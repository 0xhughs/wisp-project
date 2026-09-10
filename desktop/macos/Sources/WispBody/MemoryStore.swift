import Foundation
import CryptoKit
import CoreFoundation

enum StoreError: Error, Equatable {
    case unavailable, unsafe, busy, invalidHome, invalidMemory, conflict, writeFailed, differentHome
    var message: String {
        switch self {
        case .busy: return "This Wisp is already open. Quit the other instance and try again."
        case .invalidMemory: return "Memory is invalid. Keep the file, correct its format or limits, then Reload."
        case .conflict: return "Memory changed on disk. Your draft is retained. Cancel the draft, then Reload to review the newer version."
        case .differentHome: return "Choose the same Wisp folder. Creating or switching to another identity is unavailable."
        case .writeFailed: return "The save could not be confirmed. Your draft is retained. Check the folder and Reload before trying again."
        case .invalidHome: return "This folder is not a valid Wisp home. Choose an empty dedicated folder, or locate your existing home."
        case .unsafe: return "The folder or a managed file has unsafe ownership, permissions or links. Correct it, then try again."
        case .unavailable: return "The Wisp folder is unavailable. Locate the same folder to reconnect."
        }
    }
}
enum MemoryCategory: String, Codable, CaseIterable {
    case preference, project, instruction, fact
    var title: String { switch self { case .preference:return "Preferences"; case .project:return "Projects"; case .instruction:return "Standing instructions"; case .fact:return "Facts" } }
}
struct MemoryEntry: Codable, Equatable { var id: String; var category: MemoryCategory; var text: String }
struct MemoryDocument: Codable, Equatable {
    var version: Int = 1
    var entries: [MemoryEntry] = []
    static let maxBytes = 32768
    static func decode(_ data: Data) throws -> MemoryDocument {
        guard data.count <= maxBytes, String(data:data,encoding:.utf8) != nil,
              let object = try? JSONSerialization.jsonObject(with:data) as? [String:Any],
              Set(object.keys) == ["version","entries"], let version = object["version"] as? NSNumber,
              CFGetTypeID(version) != CFBooleanGetTypeID(), version == 1,
              let entries = object["entries"] as? [[String:Any]], entries.count <= 64 else { throw StoreError.invalidMemory }
        var ids = Set<UUID>()
        for entry in entries {
            guard Set(entry.keys) == ["id","category","text"], let id = entry["id"] as? String, let uuid = UUID(uuidString:id), ids.insert(uuid).inserted,
                  let category = entry["category"] as? String, MemoryCategory(rawValue:category) != nil,
                  let text = entry["text"] as? String, !text.trimmingCharacters(in:.whitespacesAndNewlines).isEmpty,
                  text.unicodeScalars.count <= 2000, !text.unicodeScalars.contains(where:{$0.value == 0}) else { throw StoreError.invalidMemory }
        }
        guard let result = try? JSONDecoder().decode(MemoryDocument.self,from:data) else { throw StoreError.invalidMemory }
        return result
    }
    func encoded() throws -> Data {
        let encoder = JSONEncoder(); encoder.outputFormatting = [.prettyPrinted,.sortedKeys,.withoutEscapingSlashes]
        let bytes = try encoder.encode(self) + Data([10]); _ = try Self.decode(bytes); return bytes
    }
    static func revision(_ data: Data) -> String { SHA256.hash(data:data).map{String(format:"%02x",$0)}.joined() }
}
struct MemorySnapshot {
    let companionId: String
    let document: MemoryDocument
    let revision: String
    let folder: URL
    let bytes: Data
}

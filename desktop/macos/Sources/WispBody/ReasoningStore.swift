import Foundation
import CoreFoundation

enum ReasoningError: Error {
    case invalid, invalidKey, missingKey, keychain, unavailable
    static func describe(_ error: Error) -> String {
        if let reason = error as? ReasoningError { return reason.message }
        if let store = error as? StoreError {
            switch store {
            case .conflict: return "Models changed on disk. Your draft is retained. Revert Draft, then Reload Saved to review the newer configuration."
            case .writeFailed: return "The model save could not be confirmed. Your draft is retained. Revert Draft, then Reload Saved before retrying."
            case .unsafe, .busy: return store.message
            default: break
            }
        }
        return ReasoningError.unavailable.message
    }
    var message: String {
        switch self {
        case .invalid: return "Check the model and loopback Ollama address. Cloud supports the listed DeepSeek models."
        case .invalidKey: return "Enter a valid API key without line breaks (up to 4 KiB)."
        case .missingKey: return "Add a DeepSeek API key, or select Local Ollama."
        case .keychain: return "Keychain access failed or was denied. Retry after checking Keychain access."
        case .unavailable: return "Reasoning is unavailable. Check your saved configuration and retry."
        }
    }
}
struct ReasoningConfiguration: Equatable {
    var selected = "local", localModel = "qwen3:8b", localEndpoint = "http://127.0.0.1:11434/v1"
    var cloudModel = "deepseek-v4-flash", cloudKeyID = ""
    static let cloudModels = ["deepseek-v4-flash","deepseek-v4-pro"]
    var model: String { selected == "local" ? localModel : cloudModel }
    var provider: String { selected == "local" ? "wisp-ollama" : "deepseek" }
    var label: String { (selected == "local" ? "Local Ollama" : "DeepSeek") + " · " + model }
    private static func matches(_ value: String, _ pattern: String) -> Bool { value.range(of:pattern,options:.regularExpression) == value.startIndex..<value.endIndex }
    func validate() throws {
        guard ["local","deepseek"].contains(selected), Self.cloudModels.contains(cloudModel),
              Self.matches(localModel,"^[A-Za-z0-9][A-Za-z0-9._:/-]{0,127}$"),!localModel.contains(".."),
              Self.matches(localEndpoint,"^http://(127\\.0\\.0\\.1|localhost|\\[::1\\]):[0-9]{1,5}/v1$"),
              let parts = URLComponents(string:localEndpoint),let port = parts.port, (1...65535).contains(port),
              cloudKeyID.isEmpty || UUID(uuidString:cloudKeyID) != nil else { throw ReasoningError.invalid }
    }
    func object() -> [String:Any] { ["version":1,"selected":selected,"localModel":localModel,"localEndpoint":localEndpoint,"cloudModel":cloudModel,"cloudKeyID":cloudKeyID] }
    func encoded() throws -> Data { try validate(); return try JSONSerialization.data(withJSONObject:object(),options:.sortedKeys) }
    static func decode(_ data: Data) throws -> Self {
        guard data.count <= 4096, let o = try? JSONSerialization.jsonObject(with:data) as? [String:Any],Set(o.keys) == ["version","selected","localModel","localEndpoint","cloudModel","cloudKeyID"],let v = o["version"] as? NSNumber,v == 1,CFGetTypeID(v) != CFBooleanGetTypeID(),let selected = o["selected"] as? String,let localModel = o["localModel"] as? String,let localEndpoint = o["localEndpoint"] as? String,let cloudModel = o["cloudModel"] as? String,let cloudKeyID = o["cloudKeyID"] as? String else { throw ReasoningError.invalid }
        let value = Self(selected:selected,localModel:localModel,localEndpoint:localEndpoint,cloudModel:cloudModel,cloudKeyID:cloudKeyID); try value.validate(); return value
    }
}
struct ReasoningSnapshot {
    let configuration: ReasoningConfiguration
    let revision: String
}
// Serial I/O queue only. Filesystem transaction intent is durable before Keychain mutation.
final class ReasoningStore {
    private let directory: OwnedDirectory
    private let ownership: DirectoryOwnership
    let credentials: ReasoningCredentials
    private let checkpoint: (String) throws -> Void
    init(support: URL,credentials: ReasoningCredentials,checkpoint: @escaping (String) throws -> Void = { _ in }) throws {
        self.credentials = credentials; self.checkpoint = checkpoint
        let url = support.appendingPathComponent("reasoning",isDirectory:true)
        if !FileManager.default.fileExists(atPath:url.path) { try FileManager.default.createDirectory(at:url,withIntermediateDirectories:false,attributes:[.posixPermissions:0o700]) }
        directory = try OwnedDirectory(url); ownership = try directory.lock("owner.lock")
    }
    private func snapshot() throws -> ReasoningSnapshot {
        try ownership.verify()
        if try !directory.exists("config.json") { try directory.create("config.json",data:ReasoningConfiguration().encoded()) }
        let data = try directory.read("config.json",limit:4096)
        return ReasoningSnapshot(configuration:try ReasoningConfiguration.decode(data),revision:MemoryDocument.revision(data))
    }
    func load() throws -> ReasoningSnapshot {
        let value = try snapshot()
        if try directory.exists("pending.json") {
            let bytes = try directory.read("pending.json",limit:1024)
            guard let p = try? JSONSerialization.jsonObject(with:bytes) as? [String:String], Set(p.keys) == ["new","old"],p.values.allSatisfy({$0.isEmpty || UUID(uuidString:$0) != nil}) else { throw ReasoningError.invalid }
            // Only exact IDs in this companion's service can ever be removed.
            let remove = value.configuration.cloudKeyID == p["new"]! ? p["old"]! : p["new"]!
            if remove != value.configuration.cloudKeyID { try credentials.remove(remove) }
            try clearPending()
        }
        return value
    }
    private func journal(new: String,old: String) throws {
        try ownership.verify(); try directory.replace("pending.json",data:JSONSerialization.data(withJSONObject:["new":new,"old":old],options:.sortedKeys),expected:nil)
    }
    private func clearPending() throws { try journal(new:"",old:"") }
    func save(_ draft: ReasoningConfiguration,expected: String,newKey: String?) throws -> ReasoningSnapshot {
        let previous = try load(); guard previous.revision == expected else { throw StoreError.conflict }
        var next = draft; next.cloudKeyID = previous.configuration.cloudKeyID; try next.validate()
        let id = newKey == nil ? next.cloudKeyID : UUID().uuidString.lowercased()
        if let key = newKey {
            try journal(new:id,old:next.cloudKeyID)
            try checkpoint("journal")
            try credentials.add(id,value:key); try checkpoint("key-created"); next.cloudKeyID = id
        }
        do { try directory.replace("config.json",data:next.encoded(),expected:expected,beforePublish:{try self.checkpoint("before-config")}) }
        catch { _ = try? load(); throw error }
        try checkpoint("config-published")
        _ = try load()
        return try snapshot()
    }
    func removeKey(expected: String) throws -> ReasoningSnapshot {
        let previous = try load(); guard previous.revision == expected else { throw StoreError.conflict }
        var next = previous.configuration
        try journal(new:"",old:next.cloudKeyID); next.cloudKeyID = ""
        try directory.replace("config.json",data:next.encoded(),expected:expected)
        return try load()
    }
    func bootstrap(_ snapshot: ReasoningSnapshot) throws -> [String:Any] {
        try ownership.verify()
        guard try self.snapshot().revision == snapshot.revision else { throw StoreError.conflict }
        let c = snapshot.configuration
        var o: [String:Any] = ["op":"configure","configuration":c.object()]
        if c.selected == "deepseek" {
            guard let key = try credentials.read(c.cloudKeyID) else { throw ReasoningError.missingKey }
            o["key"] = key
        }
        return o
    }
}

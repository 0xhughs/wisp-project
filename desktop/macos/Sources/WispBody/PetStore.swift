import Foundation
import CoreFoundation

enum PetError: Error {
    case invalid
    var message: String { "Saved body settings cannot be read. Restore the file." }
}
struct PetConfiguration: Equatable {
    var version = 1
    var catalogId = "wisp-orb"
    static let selectable = ["wisp-orb","wisp-fox","wisp-robot","wisp-bird","wisp-cat","wisp-owl","wisp-sprout","wisp-capsule"]
    func validate() throws {
        guard version == 1, Self.selectable.contains(catalogId) else { throw PetError.invalid }
    }
    func object() -> [String:Any] { ["version":version,"catalogId":catalogId] }
    func encoded() throws -> Data { try validate(); return try JSONSerialization.data(withJSONObject:object(),options:.sortedKeys) }
    static func decode(_ data: Data) throws -> Self {
        guard data.count <= 4096, let o = try? JSONSerialization.jsonObject(with:data) as? [String:Any], Set(o.keys) == ["version","catalogId"],
              let v = o["version"] as? NSNumber, v == 1, CFGetTypeID(v) != CFBooleanGetTypeID(),
              let catalogId = o["catalogId"] as? String else { throw PetError.invalid }
        let value = Self(version:1,catalogId:catalogId); try value.validate(); return value
    }
    static func normalized(_ catalogId: String) -> String { selectable.contains(catalogId) ? catalogId : "wisp-orb" }
}
struct PetSnapshot {
    let configuration: PetConfiguration
    let revision: String
}
enum PetRowKind: String { case body, unsupported }
enum PetRowStatus: String {
    case current = "current", saved = "saved", applying = "applying", unavailable = "unavailable", available = "available"
}
struct PetCatalogRow: Equatable {
    let id: String, title: String, detail: String, kind: PetRowKind, status: PetRowStatus, canManage: Bool
}
enum PetCatalog {
    static let selectable = PetConfiguration.selectable
    static func title(_ id: String) -> String {
        switch id {
        case "wisp-orb": return "Wisp orb"
        case "wisp-fox": return "Fox"
        case "wisp-robot": return "Robot"
        case "wisp-bird": return "Bird"
        case "wisp-cat": return "Cat"
        case "wisp-owl": return "Owl"
        case "wisp-sprout": return "Sprout"
        case "wisp-capsule": return "Capsule"
        case "official-skins": return "Additional official skins"
        default: return id
        }
    }
    static func detail(_ id: String) -> String {
        switch id {
        case "wisp-orb": return "Default even-odd oval with an interior gap. Teal idle, amber listening, cyan speaking. Original Wisp-authored programmatic artwork."
        case "wisp-fox": return "Original in-repo fox silhouette with an interior gap. Same Wisp; listening and speaking reactions are fox-specific."
        case "wisp-robot": return "Original in-repo robot silhouette with an interior gap. Same Wisp; listening and speaking reactions are robot-specific."
        case "wisp-bird": return "Original in-repo bird silhouette with a pointed beak and tail and an even-odd eye gap. Same Wisp; listening and speaking reactions are bird-specific."
        case "wisp-cat": return "Original in-repo sitting-cat silhouette with two pointed ears and an even-odd belly gap. Same Wisp; listening and speaking reactions are cat-specific."
        case "wisp-owl": return "Original in-repo round owl with ear tufts and an even-odd eye-ring gap. Same Wisp; listening and speaking reactions are owl-specific."
        case "wisp-sprout": return "Original in-repo two-leaf plant companion with an even-odd between-leaf gap. Same Wisp; listening and speaking reactions are sprout-specific."
        case "wisp-capsule": return "Original in-repo vertical rounded capsule with an even-odd porthole gap. Same Wisp; listening and speaking reactions are capsule-specific."
        default: return ""
        }
    }
    static func status(id: String, savedId: String, currentId: String, applying: Bool, applyingId: String?) -> PetRowStatus {
        if id == "official-skins" { return .unavailable }
        if applying, applyingId == id { return .applying }
        if id == currentId, selectable.contains(id) { return .current }
        if id == savedId, selectable.contains(id) { return .saved }
        if selectable.contains(id) { return .available }
        return .unavailable
    }
    static func rows(savedId: String, currentId: String, applying: Bool = false, applyingId: String? = nil) -> [PetCatalogRow] {
        selectable.map { id in
            PetCatalogRow(id:id,title:title(id),detail:detail(id),kind:.body,status:status(id:id,savedId:savedId,currentId:currentId,applying:applying,applyingId:applyingId),canManage:!applying)
        } + [PetCatalogRow(id:"official-skins",title:title("official-skins"),detail:"Further official skins toward the eventual collection remain later. No marketplace, third-party pack, or extra skins were queried.",kind:.unsupported,status:.unavailable,canManage:false)]
    }
}
struct PetDraft: Equatable {
    var catalogId = "wisp-orb"
    static func from(_ snapshot: PetSnapshot) -> Self { Self(catalogId:snapshot.configuration.catalogId) }
    mutating func confirmApply(_ confirmed: Bool, id: String) {
        if confirmed, PetCatalog.selectable.contains(id) { catalogId = id }
    }
}
enum PetApply {
    static let folderRequired = "A Wisp folder is required to save a body. Choose a folder in General or Memory. This does not create a second identity."
    static let confirmDetail = "This is the same Wisp. Identity, memory, models, voice, plugins, connections, and skills persist. Changing the body is not a permission grant."
    static func allowed(homeBusy: Bool, ending: Bool = false, modelBusy: Bool = false) -> Bool { !homeBusy && !ending }
}
enum PetRaster {
    static func samples(_ catalogId: String) -> (corner:(Int,Int),gap:(Int,Int),uniqueOpaque:(Int,Int)) {
        switch PetConfiguration.normalized(catalogId) {
        case "wisp-fox": return (corner:(0,0),gap:(80,78),uniqueOpaque:(52,20))
        case "wisp-robot": return (corner:(0,0),gap:(80,34),uniqueOpaque:(80,8))
        case "wisp-bird": return (corner:(0,0),gap:(92,64),uniqueOpaque:(138,76))
        case "wisp-cat": return (corner:(0,0),gap:(80,101),uniqueOpaque:(50,24))
        case "wisp-owl": return (corner:(0,0),gap:(80,67),uniqueOpaque:(56,16))
        case "wisp-sprout": return (corner:(0,0),gap:(80,53),uniqueOpaque:(32,40))
        case "wisp-capsule": return (corner:(0,0),gap:(80,60),uniqueOpaque:(80,24))
        default: return (corner:(0,0),gap:(80,98),uniqueOpaque:(40,80))
        }
    }
}
final class PetStore {
    private let directory: OwnedDirectory
    private let ownership: DirectoryOwnership
    init(support: URL) throws {
        let url = support.appendingPathComponent("pets",isDirectory:true)
        if !FileManager.default.fileExists(atPath:url.path) { try FileManager.default.createDirectory(at:url,withIntermediateDirectories:false,attributes:[.posixPermissions:0o700]) }
        directory = try OwnedDirectory(url); ownership = try directory.lock("owner.lock")
    }
    private func snapshot() throws -> PetSnapshot {
        try ownership.verify()
        if try !directory.exists("config.json") { try directory.create("config.json",data:PetConfiguration().encoded()) }
        let data = try directory.read("config.json",limit:4096)
        return PetSnapshot(configuration:try PetConfiguration.decode(data),revision:MemoryDocument.revision(data))
    }
    func load() throws -> PetSnapshot { try snapshot() }
    func save(_ draft: PetConfiguration, expected: String) throws -> PetSnapshot {
        let previous = try load(); guard previous.revision == expected else { throw StoreError.conflict }
        var next = draft; try next.validate()
        try directory.replace("config.json",data:next.encoded(),expected:expected)
        return try snapshot()
    }
}

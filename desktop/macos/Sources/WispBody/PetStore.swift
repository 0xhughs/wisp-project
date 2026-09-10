import Foundation
import CoreFoundation

enum PetError: Error {
    case invalid
    var message: String { "Saved body settings cannot be read. Restore the file." }
}
struct PetConfiguration: Equatable {
    var version = 1
    var catalogId = "wisp-orb"
    static let selectable = ["wisp-orb","wisp-fox","wisp-robot"]
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
        case "official-skins": return "Additional official skins"
        default: return id
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
        let bodies: [(id:String,detail:String)] = [
            ("wisp-orb","Default even-odd oval with an interior gap. Teal idle, amber listening, cyan speaking. Original Wisp-authored programmatic artwork."),
            ("wisp-fox","Original in-repo fox silhouette with an interior gap. Same Wisp; listening and speaking reactions are fox-specific."),
            ("wisp-robot","Original in-repo robot silhouette with an interior gap. Same Wisp; listening and speaking reactions are robot-specific."),
        ]
        return bodies.map { body in
            PetCatalogRow(id:body.id,title:title(body.id),detail:body.detail,kind:.body,status:status(id:body.id,savedId:savedId,currentId:currentId,applying:applying,applyingId:applyingId),canManage:!applying)
        } + [PetCatalogRow(id:"official-skins",title:title("official-skins"),detail:"Around twenty official skins remain later (slice 19). No marketplace, third-party pack, or extra skins were queried.",kind:.unsupported,status:.unavailable,canManage:false)]
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
    static let confirmDetail = "This is the same Wisp. Identity, memory, models, voice, plugins, and connections stay the same. Changing the body is not a permission grant."
    static func allowed(homeBusy: Bool, ending: Bool = false, modelBusy: Bool = false) -> Bool { !homeBusy && !ending }
}
enum PetRaster {
    static func samples(_ catalogId: String) -> (corner:(Int,Int),gap:(Int,Int),uniqueOpaque:(Int,Int)) {
        switch PetConfiguration.normalized(catalogId) {
        case "wisp-fox": return (corner:(0,0),gap:(80,78),uniqueOpaque:(52,20))
        case "wisp-robot": return (corner:(0,0),gap:(80,34),uniqueOpaque:(80,8))
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

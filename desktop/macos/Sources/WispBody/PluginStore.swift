import Foundation
import CoreFoundation

enum PluginError: Error {
    case invalid
    var message: String { "Plugin settings are invalid. Restore the saved file, then Reload Saved." }
}
struct PluginConfiguration: Equatable {
    var version = 1
    var catalogId = "wisp-compatible-plugin"
    var enabled = false
    var note = ""
    private static func matches(_ value: String, _ pattern: String) -> Bool { value.range(of:pattern,options:.regularExpression) == value.startIndex..<value.endIndex }
    func validate() throws {
        guard version == 1, catalogId == "wisp-compatible-plugin", note.isEmpty || Self.matches(note,"^[A-Za-z0-9_-]{1,40}$") else { throw PluginError.invalid }
    }
    func object() -> [String:Any] { ["version":version,"catalogId":catalogId,"enabled":enabled,"config":["note":note]] }
    func encoded() throws -> Data { try validate(); return try JSONSerialization.data(withJSONObject:object(),options:.sortedKeys) }
    static func decode(_ data: Data) throws -> Self {
        guard data.count <= 4096, let o = try? JSONSerialization.jsonObject(with:data) as? [String:Any], Set(o.keys) == ["version","catalogId","enabled","config"],
              let v = o["version"] as? NSNumber, v == 1, CFGetTypeID(v) != CFBooleanGetTypeID(),
              let catalogId = o["catalogId"] as? String, let enabledNum = o["enabled"] as? NSNumber, CFGetTypeID(enabledNum) == CFBooleanGetTypeID(),
              let config = o["config"] as? [String:Any], Set(config.keys) == ["note"], let note = config["note"] as? String else { throw PluginError.invalid }
        let value = Self(version:1,catalogId:catalogId,enabled:enabledNum.boolValue,note:note); try value.validate(); return value
    }
}
struct PluginSnapshot {
    let configuration: PluginConfiguration
    let revision: String
}
enum PluginRowKind: String { case demonstration, developerFixture, unsupported }
enum PluginRowStatus: String {
    case notInstalled = "not installed", saved = "saved", applying = "applying", active = "active", incompatible = "incompatible", unavailable = "unavailable"
}
struct PluginCatalogRow: Equatable {
    let id: String, title: String, detail: String, kind: PluginRowKind, status: PluginRowStatus, canManage: Bool
}
enum PluginCatalog {
    static let unsupported: [(id:String,title:String,status:PluginRowStatus,detail:String)] = [
        ("dsh-plugin-registry","Registry and marketplace install",.unavailable,"Named marketplaces and dsh plugin pnpm, npm or git installs are unavailable."),
        ("arbitrary-third-party-folder","Arbitrary third-party folder",.unavailable,"Loading an arbitrary JavaScript folder is unavailable."),
        ("stock-executable-tools","Stock executable tools",.incompatible,"Shell, filesystem, web, job and related stock tools stay disabled."),
        ("mcp-connection-plugin","MCP and Connections plugins",.unavailable,"Plugin-delivered Connections remain unavailable; use Settings → Connections."),
        ("skill-plugin","Skills plugins",.unavailable,"Skills stay unavailable until slice 12."),
        ("web-chat-ui-plugin","Web and chat UI plugins",.unavailable,"Harness web and chat UI is not a Wisp surface."),
        ("plugin-model-provider","Plugin-supplied models and providers",.incompatible,"Models remains the sole owner of reasoning keys and provider choice."),
    ]
    static func demonstrationStatus(enabled: Bool, applying: Bool, active: Bool, engineUnavailable: Bool) -> PluginRowStatus {
        if applying { return .applying }
        if engineUnavailable { return enabled ? .unavailable : .notInstalled }
        if !enabled { return .notInstalled }
        if active { return .active }
        return .saved
    }
    static func rows(snapshot: PluginSnapshot, applying: Bool = false, active: Bool = false, engineUnavailable: Bool = false, developer: Bool = false, developerActive: Bool = false) -> [PluginCatalogRow] {
        let demo = demonstrationStatus(enabled:snapshot.configuration.enabled,applying:applying,active:active,engineUnavailable:engineUnavailable)
        return [
            PluginCatalogRow(id:"wisp-compatible-plugin",title:"Compatible demonstration plugin",detail:"Registers one harmless ledger-append tool. Wisp still asks before each action.",kind:.demonstration,status:demo,canManage:demo != .incompatible && !applying),
            PluginCatalogRow(id:"wisp-local-permission-plugin",title:"Developer permission fixture",detail:"Not a Plugins catalog install target. Visible only as a developer verification plugin.",kind:.developerFixture,status:developer && developerActive ? .active : .unavailable,canManage:false),
        ] + unsupported.map { PluginCatalogRow(id:$0.id,title:$0.title,detail:$0.detail,kind:.unsupported,status:$0.status,canManage:false) }
    }
}
struct PluginDraft: Equatable {
    var enabled = false
    var note = ""
    static func from(_ snapshot: PluginSnapshot) -> Self { Self(enabled:snapshot.configuration.enabled,note:snapshot.configuration.note) }
    mutating func confirmInstall(_ confirmed: Bool) { if confirmed { enabled = true } }
    mutating func confirmRemove(_ confirmed: Bool) { if confirmed { enabled = false } }
}
enum PluginApply {
    static func allowed(modelBusy: Bool, homeBusy: Bool, ending: Bool = false) -> Bool { !modelBusy && !homeBusy && !ending }
}
final class PluginStore {
    private let directory: OwnedDirectory
    private let ownership: DirectoryOwnership
    init(support: URL) throws {
        let url = support.appendingPathComponent("plugins",isDirectory:true)
        if !FileManager.default.fileExists(atPath:url.path) { try FileManager.default.createDirectory(at:url,withIntermediateDirectories:false,attributes:[.posixPermissions:0o700]) }
        directory = try OwnedDirectory(url); ownership = try directory.lock("owner.lock")
    }
    private func snapshot() throws -> PluginSnapshot {
        try ownership.verify()
        if try !directory.exists("config.json") { try directory.create("config.json",data:PluginConfiguration().encoded()) }
        let data = try directory.read("config.json",limit:4096)
        return PluginSnapshot(configuration:try PluginConfiguration.decode(data),revision:MemoryDocument.revision(data))
    }
    func load() throws -> PluginSnapshot { try snapshot() }
    func save(_ draft: PluginConfiguration, expected: String) throws -> PluginSnapshot {
        let previous = try load(); guard previous.revision == expected else { throw StoreError.conflict }
        var next = draft; try next.validate()
        try directory.replace("config.json",data:next.encoded(),expected:expected)
        return try snapshot()
    }
    func stage(_ snapshot: PluginSnapshot) throws -> URL {
        try ownership.verify()
        let current = try self.snapshot()
        guard current.revision == snapshot.revision else { throw StoreError.conflict }
        let launch: [String:Any] = ["version":1,"catalogId":snapshot.configuration.catalogId,"enabled":snapshot.configuration.enabled,"config":["note":snapshot.configuration.note],"revision":snapshot.revision]
        try directory.replace("launch.json",data:JSONSerialization.data(withJSONObject:launch,options:.sortedKeys),expected:nil)
        return directory.url.appendingPathComponent("launch.json")
    }
}

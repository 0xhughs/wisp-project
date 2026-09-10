import Foundation
import CoreFoundation

struct ConnectionConfiguration: Equatable {
    var version = 1
    var catalogId = "wisp-demo-connection"
    var enabled = false
    var serverName = "wispdemo"
    var note = ""
    var credentialId = ""
    private static func matches(_ value: String, _ pattern: String) -> Bool { value.range(of:pattern,options:.regularExpression) == value.startIndex..<value.endIndex }
    func validate() throws {
        guard version == 1, catalogId == "wisp-demo-connection",
              Self.matches(serverName,"^[A-Za-z0-9_-]{1,32}$"),
              note.isEmpty || Self.matches(note,"^[A-Za-z0-9_-]{1,40}$"),
              credentialId.isEmpty || Self.matches(credentialId,"^[A-Za-z0-9_-]{1,64}$") else { throw ConnectionError.invalid }
    }
    func object() -> [String:Any] { ["version":version,"catalogId":catalogId,"enabled":enabled,"config":["serverName":serverName,"note":note,"credentialId":credentialId]] }
    func encoded() throws -> Data { try validate(); return try JSONSerialization.data(withJSONObject:object(),options:.sortedKeys) }
    static func decode(_ data: Data) throws -> Self {
        guard data.count <= 4096, let o = try? JSONSerialization.jsonObject(with:data) as? [String:Any], Set(o.keys) == ["version","catalogId","enabled","config"],
              let v = o["version"] as? NSNumber, v == 1, CFGetTypeID(v) != CFBooleanGetTypeID(),
              let catalogId = o["catalogId"] as? String, let enabledNum = o["enabled"] as? NSNumber, CFGetTypeID(enabledNum) == CFBooleanGetTypeID(),
              let config = o["config"] as? [String:Any], Set(config.keys) == ["serverName","note","credentialId"],
              let serverName = config["serverName"] as? String, let note = config["note"] as? String, let credentialId = config["credentialId"] as? String else { throw ConnectionError.invalid }
        let value = Self(version:1,catalogId:catalogId,enabled:enabledNum.boolValue,serverName:serverName,note:note,credentialId:credentialId); try value.validate(); return value
    }
}
struct ConnectionSnapshot {
    let configuration: ConnectionConfiguration
    let revision: String
}
enum ConnectionRowKind: String { case demonstration, advanced, unsupported }
enum ConnectionRowStatus: String {
    case notInstalled = "not installed", saved = "saved", applying = "applying", active = "active", incompatible = "incompatible", unavailable = "unavailable"
}
struct ConnectionCatalogRow: Equatable {
    let id: String, title: String, detail: String, kind: ConnectionRowKind, status: ConnectionRowStatus, canManage: Bool
}
enum ConnectionCatalog {
    static let unsupported: [(id:String,title:String,status:ConnectionRowStatus,detail:String)] = [
        ("github","GitHub",.unavailable,"Named SaaS connectors are examples, not a shipping bundle."),
        ("google-drive","Google Drive",.unavailable,"Named SaaS connectors are examples, not a shipping bundle."),
        ("notion","Notion",.unavailable,"Named SaaS connectors are examples, not a shipping bundle."),
        ("calendar","Calendar",.unavailable,"Named SaaS connectors are examples, not a shipping bundle."),
        ("slack","Slack",.unavailable,"Named SaaS connectors are examples, not a shipping bundle."),
        ("remote-http-mcp","Remote or non-loopback HTTP MCP",.unavailable,"Streamable HTTP and remote URLs stay unavailable in Settings."),
        ("npx-npm-git-mcp","npx, npm or git MCP servers",.unavailable,"User-chosen executables and registry installs stay unavailable."),
        ("mcp-resources-prompts","MCP resources and prompts",.unavailable,"The pinned bridge is tool-only. Resources and prompts stay unsupported."),
        ("plugin-delivered-mcp","Plugin-delivered MCP",.unavailable,"Plugin-delivered Connections remain unavailable; use Settings → Connections."),
    ]
    static func demonstrationStatus(enabled: Bool, applying: Bool, active: Bool, engineUnavailable: Bool) -> ConnectionRowStatus {
        if applying { return .applying }
        if engineUnavailable { return enabled ? .unavailable : .notInstalled }
        if !enabled { return .notInstalled }
        if active { return .active }
        return .saved
    }
    static func rows(snapshot: ConnectionSnapshot, applying: Bool = false, active: Bool = false, engineUnavailable: Bool = false) -> [ConnectionCatalogRow] {
        let demo = demonstrationStatus(enabled:snapshot.configuration.enabled,applying:applying,active:active,engineUnavailable:engineUnavailable)
        let manage = demo != .incompatible && !applying
        return [
            ConnectionCatalogRow(id:"wisp-demo-connection",title:"Local stdio demonstration",detail:"Registers one harmless ledger-append MCP tool. Wisp still asks before each action. Connection save is not a grant.",kind:.demonstration,status:demo,canManage:manage),
            ConnectionCatalogRow(id:"wisp-advanced-mcp",title:"Advanced custom MCP (same class)",detail:"Accepted mcp-client fields for this demonstration only. Transport stdio, command/args, failOnStartupError and reconnect are Wisp-fixed.",kind:.advanced,status:demo,canManage:manage),
        ] + unsupported.map { ConnectionCatalogRow(id:$0.id,title:$0.title,detail:$0.detail,kind:.unsupported,status:$0.status,canManage:false) }
    }
}
struct ConnectionDraft: Equatable {
    var enabled = false
    var serverName = "wispdemo"
    var note = ""
    var credentialId = ""
    static func from(_ snapshot: ConnectionSnapshot) -> Self { Self(enabled:snapshot.configuration.enabled,serverName:snapshot.configuration.serverName,note:snapshot.configuration.note,credentialId:snapshot.configuration.credentialId) }
    mutating func confirmEnable(_ confirmed: Bool) { if confirmed { enabled = true } }
    mutating func confirmRemove(_ confirmed: Bool) { if confirmed { enabled = false } }
}
enum ConnectionApply {
    static func allowed(modelBusy: Bool, homeBusy: Bool, ending: Bool = false) -> Bool { !modelBusy && !homeBusy && !ending }
}
final class ConnectionStore {
    private let directory: OwnedDirectory
    private let ownership: DirectoryOwnership
    init(support: URL) throws {
        let url = support.appendingPathComponent("connections",isDirectory:true)
        if !FileManager.default.fileExists(atPath:url.path) { try FileManager.default.createDirectory(at:url,withIntermediateDirectories:false,attributes:[.posixPermissions:0o700]) }
        directory = try OwnedDirectory(url); ownership = try directory.lock("owner.lock")
    }
    private func snapshot() throws -> ConnectionSnapshot {
        try ownership.verify()
        if try !directory.exists("config.json") { try directory.create("config.json",data:ConnectionConfiguration().encoded()) }
        let data = try directory.read("config.json",limit:4096)
        return ConnectionSnapshot(configuration:try ConnectionConfiguration.decode(data),revision:MemoryDocument.revision(data))
    }
    func load() throws -> ConnectionSnapshot { try snapshot() }
    func save(_ draft: ConnectionConfiguration, expected: String) throws -> ConnectionSnapshot {
        let previous = try load(); guard previous.revision == expected else { throw StoreError.conflict }
        var next = draft; try next.validate()
        try directory.replace("config.json",data:next.encoded(),expected:expected)
        return try snapshot()
    }
    func stage(_ snapshot: ConnectionSnapshot) throws -> URL {
        try ownership.verify()
        let current = try self.snapshot()
        guard current.revision == snapshot.revision else { throw StoreError.conflict }
        let launch: [String:Any] = ["version":1,"catalogId":snapshot.configuration.catalogId,"enabled":snapshot.configuration.enabled,"config":["serverName":snapshot.configuration.serverName,"note":snapshot.configuration.note,"credentialId":snapshot.configuration.credentialId],"revision":snapshot.revision]
        try directory.replace("launch.json",data:JSONSerialization.data(withJSONObject:launch,options:.sortedKeys),expected:nil)
        return directory.url.appendingPathComponent("launch.json")
    }
}

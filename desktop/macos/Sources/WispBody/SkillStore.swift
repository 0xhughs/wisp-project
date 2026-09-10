import Foundation
import CoreFoundation

enum SkillError: Error {
    case invalid
    var message: String { "Skill settings are invalid. Restore the saved file, then Reload Saved." }
}
struct SkillConfiguration: Equatable {
    var version = 1
    var catalogId = "wisp-local-time-briefing"
    var enabled = false
    func validate() throws {
        guard version == 1, catalogId == "wisp-local-time-briefing" else { throw SkillError.invalid }
    }
    func object() -> [String:Any] { ["version":version,"catalogId":catalogId,"enabled":enabled] }
    func encoded() throws -> Data { try validate(); return try JSONSerialization.data(withJSONObject:object(),options:.sortedKeys) }
    static func decode(_ data: Data) throws -> Self {
        guard data.count <= 4096, let o = try? JSONSerialization.jsonObject(with:data) as? [String:Any], Set(o.keys) == ["version","catalogId","enabled"],
              let v = o["version"] as? NSNumber, v == 1, CFGetTypeID(v) != CFBooleanGetTypeID(),
              let catalogId = o["catalogId"] as? String, let enabledNum = o["enabled"] as? NSNumber, CFGetTypeID(enabledNum) == CFBooleanGetTypeID() else { throw SkillError.invalid }
        let value = Self(version:1,catalogId:catalogId,enabled:enabledNum.boolValue); try value.validate(); return value
    }
}
struct SkillSnapshot {
    let configuration: SkillConfiguration
    let revision: String
}
enum SkillRowKind: String { case demonstration, unsupported }
enum SkillRowStatus: String {
    case notInstalled = "not installed", saved = "saved", applying = "applying", active = "active", incompatible = "incompatible", unavailable = "unavailable"
}
struct SkillCatalogRow: Equatable {
    let id: String, title: String, detail: String, kind: SkillRowKind, status: SkillRowStatus, canManage: Bool
}
enum SkillCatalog {
    static let unsupported: [(id:String,title:String,status:SkillRowStatus,detail:String)] = [
        ("meeting-prep-bundle","Meeting preparation",.unavailable,"Calendar, attendees, documents, and summarize remain an illustrative example, not a shipping service bundle."),
        ("skill-marketplace","Skill marketplace",.unavailable,"Named marketplaces, dsh skill install, npm/git skill packs, and dsh-skill-badge stay unavailable. No marketplace was queried."),
        ("ambient-skill-folders","Ambient skill folders",.unavailable,"Project .dsh/skills, user ~/.dsh/skills, ~/.agents/skills, and arbitrary folders stay unavailable. Stock skill-filesystem stays disabled."),
        ("learned-user-authored","Learned or user-authored skills",.unavailable,"Learning or authoring a new skill from conversation, a skill editor, or a slash-command composer stays unavailable."),
        ("skill-plugin","Cordis skill plugins",.unavailable,"Cordis skill plugins remain unavailable in Settings → Plugins. Skills are managed in Settings → Skills."),
        ("general-subagents","General sub-agents",.unavailable,"Stock tool-subagent, tool-subagent-fork, tool-subagent-control, and tool-subagent-list-agents stay disabled. Internal delegated consequential child asks remain denied."),
    ]
    static func demonstrationStatus(enabled: Bool, applying: Bool, active: Bool, engineUnavailable: Bool) -> SkillRowStatus {
        if applying { return .applying }
        if engineUnavailable { return enabled ? .unavailable : .notInstalled }
        if !enabled { return .notInstalled }
        if active { return .active }
        return .saved
    }
    static func rows(snapshot: SkillSnapshot, applying: Bool = false, active: Bool = false, engineUnavailable: Bool = false) -> [SkillCatalogRow] {
        let demo = demonstrationStatus(enabled:snapshot.configuration.enabled,applying:applying,active:active,engineUnavailable:engineUnavailable)
        return [
            SkillCatalogRow(id:"wisp-local-time-briefing",title:"Local time briefing",detail:"Wisp-authored in-repo skill. Instructs the same Wisp to call the already-admitted Direct tool wisp_tell_time exactly once and to wait for Wisp confirmation. Enable is not Allow Once.",kind:.demonstration,status:demo,canManage:demo != .incompatible && !applying),
        ] + unsupported.map { SkillCatalogRow(id:$0.id,title:$0.title,detail:$0.detail,kind:.unsupported,status:$0.status,canManage:false) }
    }
}
struct SkillDraft: Equatable {
    var enabled = false
    static func from(_ snapshot: SkillSnapshot) -> Self { Self(enabled:snapshot.configuration.enabled) }
    mutating func confirmEnable(_ confirmed: Bool) { if confirmed { enabled = true } }
    mutating func confirmDisable(_ confirmed: Bool) { if confirmed { enabled = false } }
}
enum SkillApply {
    static let folderRequired = "A Wisp folder is required to save skill enablement. Choose a folder in General or Memory. This does not create a second identity."
    static let confirmDetail = "This is the same Wisp. A skill is instructions, not a second assistant. Enable is not Allow Once. Cancel performs no overlay change."
    static func allowed(modelBusy: Bool, homeBusy: Bool, ending: Bool = false) -> Bool { !modelBusy && !homeBusy && !ending }
}
final class SkillStore {
    private let directory: OwnedDirectory
    private let ownership: DirectoryOwnership
    init(support: URL) throws {
        let url = support.appendingPathComponent("skills",isDirectory:true)
        if !FileManager.default.fileExists(atPath:url.path) { try FileManager.default.createDirectory(at:url,withIntermediateDirectories:false,attributes:[.posixPermissions:0o700]) }
        directory = try OwnedDirectory(url); ownership = try directory.lock("owner.lock")
    }
    private func snapshot() throws -> SkillSnapshot {
        try ownership.verify()
        if try !directory.exists("config.json") { try directory.create("config.json",data:SkillConfiguration().encoded()) }
        let data = try directory.read("config.json",limit:4096)
        return SkillSnapshot(configuration:try SkillConfiguration.decode(data),revision:MemoryDocument.revision(data))
    }
    func load() throws -> SkillSnapshot { try snapshot() }
    func save(_ draft: SkillConfiguration, expected: String) throws -> SkillSnapshot {
        let previous = try load(); guard previous.revision == expected else { throw StoreError.conflict }
        var next = draft; try next.validate()
        try directory.replace("config.json",data:next.encoded(),expected:expected)
        return try snapshot()
    }
    func stage(_ snapshot: SkillSnapshot) throws -> URL {
        try ownership.verify()
        let current = try self.snapshot()
        guard current.revision == snapshot.revision else { throw StoreError.conflict }
        let launch: [String:Any] = ["version":1,"catalogId":snapshot.configuration.catalogId,"enabled":snapshot.configuration.enabled,"revision":snapshot.revision]
        try directory.replace("launch.json",data:JSONSerialization.data(withJSONObject:launch,options:.sortedKeys),expected:nil)
        return directory.url.appendingPathComponent("launch.json")
    }
}

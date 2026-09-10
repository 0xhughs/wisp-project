import Foundation
func skillStoreTests() throws {
    let root = URL(fileURLWithPath:CommandLine.arguments[1]).appendingPathComponent("skills-"+UUID().uuidString)
    try FileManager.default.createDirectory(at:root,withIntermediateDirectories:false,attributes:[.posixPermissions:0o700])
    let store = try SkillStore(support:root)
    let initial = try store.load()
    try check(initial.configuration == SkillConfiguration() && initial.configuration.enabled == false, "default skill is not installed")
    var bad = initial.configuration; bad.catalogId = "meeting-prep-bundle"
    do { _ = try bad.encoded(); throw NSError(domain:"accepted meeting-prep catalog id",code:1) } catch is SkillError {}
    bad = initial.configuration; bad.catalogId = "tool-bash"
    do { _ = try bad.encoded(); throw NSError(domain:"accepted unknown skill catalog id",code:1) } catch is SkillError {}
    bad = initial.configuration; bad.catalogId = ""
    do { _ = try bad.encoded(); throw NSError(domain:"accepted empty skill id",code:1) } catch is SkillError {}
    bad = initial.configuration; bad.version = 2
    do { _ = try bad.encoded(); throw NSError(domain:"accepted unknown skill version",code:1) } catch is SkillError {}
    var enabled = initial.configuration; enabled.enabled = true
    let saved = try store.save(enabled,expected:initial.revision)
    try check(try store.load().configuration == saved.configuration && saved.configuration.enabled, "skill persist/reload")
    do { _ = try store.save(initial.configuration,expected:initial.revision); throw NSError(domain:"stale skill save",code:1) } catch StoreError.conflict {}
    var draft = SkillDraft.from(initial)
    draft.confirmEnable(false); try check(draft.enabled == false, "cancel enable leaves saved composition")
    draft.confirmEnable(true); try check(draft.enabled, "confirm enable enables draft only")
    try check(try store.load().configuration.enabled == true, "draft vs saved does not write until save of disable")
    let afterEnable = try store.load()
    var disableDraft = SkillDraft.from(afterEnable)
    disableDraft.confirmDisable(false); try check(disableDraft.enabled, "cancel disable leaves draft enabled")
    disableDraft.confirmDisable(true); try check(!disableDraft.enabled, "confirm disable disables draft")
    try check(try store.load().configuration.enabled, "confirm-cancel performs zero snapshot change")
    try check(SkillApply.allowed(modelBusy:true,homeBusy:false) == false, "Apply while model busy refused")
    try check(SkillApply.allowed(modelBusy:false,homeBusy:true) == false, "Apply while home busy refused")
    try check(SkillApply.allowed(modelBusy:false,homeBusy:false,ending:true) == false, "Apply while ending refused")
    try check(SkillApply.allowed(modelBusy:false,homeBusy:false), "Apply allowed when idle")
    let disabledRows = SkillCatalog.rows(snapshot:initial)
    try check(disabledRows.contains(where:{$0.kind == .demonstration && $0.status == .notInstalled && $0.canManage && $0.title == "Local time briefing"}), "demonstration not installed")
    try check(disabledRows.filter{$0.kind == .unsupported}.allSatisfy{!$0.canManage && ($0.status == .unavailable || $0.status == .incompatible)}, "unsupported rows cannot be enabled")
    try check(Set(disabledRows.map(\.id)).isSuperset(of:["meeting-prep-bundle","skill-marketplace","ambient-skill-folders","learned-user-authored","skill-plugin","general-subagents"]), "closed unsupported classes")
    let applying = SkillCatalog.rows(snapshot:saved,applying:true)
    try check(applying.first{$0.id == "wisp-local-time-briefing"}?.status == .applying && applying.first!.canManage == false, "applying disables manage")
    try check(SkillCatalog.rows(snapshot:saved,active:true).first{$0.id == "wisp-local-time-briefing"}?.status == .active, "active after inventory")
    try check(SkillCatalog.rows(snapshot:saved,engineUnavailable:true).first{$0.id == "wisp-local-time-briefing"}?.status == .unavailable, "failed start is unavailable with snapshot retained")
    let staged = try store.stage(saved)
    let bytes = try Data(contentsOf:staged)
    let launch = try JSONSerialization.jsonObject(with:bytes) as! [String:Any]
    try check(launch["revision"] as? String == saved.revision && launch["enabled"] as? Bool == true, "staged launch matches snapshot")
    try check(!String(decoding:try Data(contentsOf:root.appendingPathComponent("skills/config.json")),as:UTF8.self).contains("BEGIN"), "no secrets in skill snapshot")
    let malformed = Data("{\"version\":true}".utf8)
    do { _ = try SkillConfiguration.decode(malformed); throw NSError(domain:"bad skill schema accepted",code:1) } catch is SkillError {}
    let extra = Data("{\"version\":1,\"catalogId\":\"wisp-local-time-briefing\",\"enabled\":false,\"extra\":1}".utf8)
    do { _ = try SkillConfiguration.decode(extra); throw NSError(domain:"extra skill keys accepted",code:1) } catch is SkillError {}
    let configURL = root.appendingPathComponent("skills/config.json"), canary = root.appendingPathComponent("outside-skill.json")
    let pristine = try Data(contentsOf:configURL); try pristine.write(to:canary); try FileManager.default.setAttributes([.posixPermissions:0o600],ofItemAtPath:canary.path)
    try FileManager.default.removeItem(at:configURL)
    try FileManager.default.createSymbolicLink(at:configURL,withDestinationURL:canary)
    do { _ = try store.load(); throw NSError(domain:"skill followed symlink",code:1) } catch StoreError.unsafe {} catch StoreError.unavailable {}
    try check(try Data(contentsOf:canary) == pristine, "outside skill canary unchanged")
    print("Skill assertions: persist/reload, default disabled, unknown id rejected, confirm-cancel, draft vs saved, Apply while busy, uncompiled on Linux")
}

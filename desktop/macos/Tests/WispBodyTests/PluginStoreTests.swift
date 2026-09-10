import Foundation
func pluginStoreTests() throws {
    let root = URL(fileURLWithPath:CommandLine.arguments[1]).appendingPathComponent("plugins-"+UUID().uuidString)
    try FileManager.default.createDirectory(at:root,withIntermediateDirectories:false,attributes:[.posixPermissions:0o700])
    let store = try PluginStore(support:root)
    let initial = try store.load()
    try check(initial.configuration == PluginConfiguration() && initial.configuration.enabled == false, "default plugin is not installed")
    var bad = initial.configuration; bad.note = "bad note"
    do { _ = try bad.encoded(); throw NSError(domain:"accepted invalid plugin note",code:1) } catch is PluginError {}
    bad = initial.configuration; bad.catalogId = "tool-bash"
    do { _ = try bad.encoded(); throw NSError(domain:"accepted unknown catalog id",code:1) } catch is PluginError {}
    bad = initial.configuration; bad.note = String(repeating:"x",count:41)
    do { _ = try bad.encoded(); throw NSError(domain:"accepted oversize note",code:1) } catch is PluginError {}
    var enabled = initial.configuration; enabled.enabled = true; enabled.note = "lab_1"
    let saved = try store.save(enabled,expected:initial.revision)
    try check(try store.load().configuration == saved.configuration && saved.configuration.enabled, "plugin persistence")
    do { _ = try store.save(initial.configuration,expected:initial.revision); throw NSError(domain:"stale plugin save",code:1) } catch StoreError.conflict {}
    var draft = PluginDraft.from(initial)
    draft.confirmInstall(false); try check(draft.enabled == false, "cancel install leaves saved composition")
    draft.confirmInstall(true); try check(draft.enabled, "confirm install enables draft only")
    draft.confirmRemove(false); try check(draft.enabled, "cancel remove leaves draft enabled")
    draft.confirmRemove(true); try check(!draft.enabled, "confirm remove disables draft")
    try check(PluginApply.allowed(modelBusy:true,homeBusy:false) == false, "Apply while model busy refused")
    try check(PluginApply.allowed(modelBusy:false,homeBusy:true) == false, "Apply while home busy refused")
    try check(PluginApply.allowed(modelBusy:false,homeBusy:false), "Apply allowed when idle")
    let disabledRows = PluginCatalog.rows(snapshot:initial)
    try check(disabledRows.contains(where:{$0.kind == .demonstration && $0.status == .notInstalled && $0.canManage}), "demonstration not installed")
    try check(disabledRows.contains(where:{$0.kind == .developerFixture && !$0.canManage}), "developer fixture is not a catalog install")
    try check(disabledRows.filter{$0.kind == .unsupported}.allSatisfy{!$0.canManage && ($0.status == .unavailable || $0.status == .incompatible)}, "unsupported rows cannot be enabled")
    try check(Set(disabledRows.map(\.id)).isSuperset(of:["dsh-plugin-registry","arbitrary-third-party-folder","stock-executable-tools","mcp-connection-plugin","skill-plugin","web-chat-ui-plugin","plugin-model-provider"]), "closed unsupported classes")
    try check(disabledRows.first{$0.id=="mcp-connection-plugin"}?.detail.contains("Settings → Connections") == true && disabledRows.first{$0.id=="mcp-connection-plugin"}?.detail.contains("until slice 11") == false, "plugin-delivered MCP copy")
    let applying = PluginCatalog.rows(snapshot:saved,applying:true)
    try check(applying.first{$0.id == "wisp-compatible-plugin"}?.status == .applying && applying.first!.canManage == false, "applying disables manage")
    try check(PluginCatalog.rows(snapshot:saved,active:true).first{$0.id == "wisp-compatible-plugin"}?.status == .active, "active after inventory")
    try check(PluginCatalog.rows(snapshot:saved,engineUnavailable:true).first{$0.id == "wisp-compatible-plugin"}?.status == .unavailable, "failed start is unavailable with snapshot retained")
    let staged = try store.stage(saved)
    let bytes = try Data(contentsOf:staged)
    let launch = try JSONSerialization.jsonObject(with:bytes) as! [String:Any]
    try check(launch["revision"] as? String == saved.revision && launch["enabled"] as? Bool == true, "staged launch matches snapshot")
    try check(!String(decoding:try Data(contentsOf:root.appendingPathComponent("plugins/config.json")),as:UTF8.self).contains("BEGIN"), "no secrets in plugin snapshot")
    let malformed = Data("{\"version\":true}".utf8)
    do { _ = try PluginConfiguration.decode(malformed); throw NSError(domain:"bad plugin schema accepted",code:1) } catch is PluginError {}
    let configURL = root.appendingPathComponent("plugins/config.json"), canary = root.appendingPathComponent("outside-plugin.json")
    let pristine = try Data(contentsOf:configURL); try pristine.write(to:canary); try FileManager.default.setAttributes([.posixPermissions:0o600],ofItemAtPath:canary.path)
    try FileManager.default.removeItem(at:configURL)
    try FileManager.default.createSymbolicLink(at:configURL,withDestinationURL:canary)
    do { _ = try store.load(); throw NSError(domain:"plugin followed symlink",code:1) } catch StoreError.unsafe {} catch StoreError.unavailable {}
    try check(try Data(contentsOf:canary) == pristine, "outside plugin canary unchanged")
    print("Plugin assertions: persist/reload, confirm-cancel, incompatible rows, draft vs saved, Apply while busy, uncompiled on Linux")
}

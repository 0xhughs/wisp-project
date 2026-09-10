import Foundation
import Security
func connectionStoreTests() throws {
    let root = URL(fileURLWithPath:CommandLine.arguments[1]).appendingPathComponent("connections-"+UUID().uuidString)
    try FileManager.default.createDirectory(at:root,withIntermediateDirectories:false,attributes:[.posixPermissions:0o700])
    let store = try ConnectionStore(support:root)
    let initial = try store.load()
    try check(initial.configuration == ConnectionConfiguration() && initial.configuration.enabled == false, "default connection is not installed")
    var bad = initial.configuration; bad.note = "bad note"
    do { _ = try bad.encoded(); throw NSError(domain:"accepted invalid connection note",code:1) } catch is ConnectionError {}
    bad = initial.configuration; bad.catalogId = "github"
    do { _ = try bad.encoded(); throw NSError(domain:"accepted unknown catalog id",code:1) } catch is ConnectionError {}
    bad = initial.configuration; bad.serverName = "bad name"
    do { _ = try bad.encoded(); throw NSError(domain:"accepted invalid serverName",code:1) } catch is ConnectionError {}
    bad = initial.configuration; bad.note = String(repeating:"x",count:41)
    do { _ = try bad.encoded(); throw NSError(domain:"accepted oversize note",code:1) } catch is ConnectionError {}
    var enabled = initial.configuration; enabled.enabled = true; enabled.note = "lab_1"; enabled.serverName = "wispdemo"
    let saved = try store.save(enabled,expected:initial.revision)
    try check(try store.load().configuration == saved.configuration && saved.configuration.enabled, "connection persistence")
    do { _ = try store.save(initial.configuration,expected:initial.revision); throw NSError(domain:"stale connection save",code:1) } catch StoreError.conflict {}
    var draft = ConnectionDraft.from(initial)
    draft.confirmEnable(false); try check(draft.enabled == false, "cancel enable leaves saved composition")
    draft.confirmEnable(true); try check(draft.enabled, "confirm enable enables draft only")
    draft.confirmRemove(false); try check(draft.enabled, "cancel remove leaves draft enabled")
    draft.confirmRemove(true); try check(!draft.enabled, "confirm remove disables draft")
    try check(ConnectionApply.allowed(modelBusy:true,homeBusy:false) == false, "Apply while model busy refused")
    try check(ConnectionApply.allowed(modelBusy:false,homeBusy:true) == false, "Apply while home busy refused")
    try check(ConnectionApply.allowed(modelBusy:false,homeBusy:false), "Apply allowed when idle")
    let disabledRows = ConnectionCatalog.rows(snapshot:initial)
    try check(disabledRows.contains(where:{$0.kind == .demonstration && $0.status == .notInstalled && $0.canManage}), "demonstration not installed")
    try check(disabledRows.contains(where:{$0.kind == .advanced && $0.canManage}), "advanced editor is the same class")
    try check(disabledRows.filter{$0.kind == .unsupported}.allSatisfy{!$0.canManage && ($0.status == .unavailable || $0.status == .incompatible)}, "unsupported rows cannot be enabled")
    try check(Set(disabledRows.map(\.id)).isSuperset(of:["github","google-drive","notion","calendar","slack","remote-http-mcp","npx-npm-git-mcp","mcp-resources-prompts","plugin-delivered-mcp"]), "closed unsupported classes")
    let applying = ConnectionCatalog.rows(snapshot:saved,applying:true)
    try check(applying.first{$0.id == "wisp-demo-connection"}?.status == .applying && applying.first!.canManage == false, "applying disables manage")
    try check(ConnectionCatalog.rows(snapshot:saved,active:true).first{$0.id == "wisp-demo-connection"}?.status == .active, "active after inventory")
    try check(ConnectionCatalog.rows(snapshot:saved,engineUnavailable:true).first{$0.id == "wisp-demo-connection"}?.status == .unavailable, "failed start is unavailable with snapshot retained")
    let staged = try store.stage(saved)
    let bytes = try Data(contentsOf:staged)
    let launch = try JSONSerialization.jsonObject(with:bytes) as! [String:Any]
    try check(launch["revision"] as? String == saved.revision && launch["enabled"] as? Bool == true, "staged launch matches snapshot")
    try check(!String(decoding:try Data(contentsOf:root.appendingPathComponent("connections/config.json")),as:UTF8.self).contains("BEGIN"), "no secrets in connection snapshot")
    let malformed = Data("{\"version\":true}".utf8)
    do { _ = try ConnectionConfiguration.decode(malformed); throw NSError(domain:"bad connection schema accepted",code:1) } catch is ConnectionError {}
    let configURL = root.appendingPathComponent("connections/config.json"), canary = root.appendingPathComponent("outside-connection.json")
    let pristine = try Data(contentsOf:configURL); try pristine.write(to:canary); try FileManager.default.setAttributes([.posixPermissions:0o600],ofItemAtPath:canary.path)
    try FileManager.default.removeItem(at:configURL)
    try FileManager.default.createSymbolicLink(at:configURL,withDestinationURL:canary)
    do { _ = try store.load(); throw NSError(domain:"connection followed symlink",code:1) } catch StoreError.unsafe {} catch StoreError.unavailable {}
    try check(try Data(contentsOf:canary) == pristine, "outside connection canary unchanged")
    print("Connection assertions: persist/reload, confirm-cancel, incompatible rows, draft vs saved, Apply while busy, uncompiled on Linux")
    try connectionCredentialsTests(root:root)
}
func connectionCredentialsTests(root: URL) throws {
    let keychain = root.appendingPathComponent("connection-test.keychain").path
    let credentials = try ConnectionCredentials(namespace:UUID().uuidString,testKeychainPath:keychain)
    defer { try? credentials.destroyTestKeychain() }
    let id = UUID().uuidString.lowercased()
    let sentinel = "wisp-connection-sentinel-"+UUID().uuidString
    try credentials.add(id,value:sentinel)
    try check(try credentials.read(id) == sentinel, "isolated connection Keychain retrieve")
    try credentials.withLockedTestKeychain {
        do { _ = try credentials.read(id); throw NSError(domain:"locked connection Keychain unexpectedly readable",code:1) } catch ConnectionError.keychain {}
    }
    try check(try credentials.read(id) == sentinel, "scoped connection Keychain unlock recovery")
    let isolated = try ConnectionCredentials(namespace:UUID().uuidString,testKeychainPath:keychain)
    try check(try isolated.read(id) == nil, "connection Keychain namespace isolation")
    try isolated.remove(id)
    try check(try credentials.read(id) == sentinel, "unrelated exact connection item unchanged")
    try credentials.remove(id)
    try check(try credentials.read(id) == nil, "connection credential removed")
    let linked = root.appendingPathComponent("linked-connection.keychain")
    try FileManager.default.createSymbolicLink(at:linked,withDestinationURL:URL(fileURLWithPath:keychain))
    do { _ = try ConnectionCredentials(namespace:UUID().uuidString,testKeychainPath:linked.path); throw NSError(domain:"test connection Keychain symlink followed",code:1) } catch ConnectionError.keychain {}
    print("Connection credential assertions: isolated test Keychain CRUD, namespace isolation, uncompiled on Linux")
}

import Foundation
import Security
func reasoningStoreTests() throws {
    func verify(_ condition: @autoclosure () throws -> Bool,_ label: String) throws { try check(try condition(),label) }
    try check(ReasoningError.describe(StoreError.conflict).contains("Reload Saved") && !ReasoningError.describe(StoreError.conflict).contains("Memory"),"model conflict recovery wording")
    let root = URL(fileURLWithPath:CommandLine.arguments[1]).appendingPathComponent("reasoning-"+UUID().uuidString)
    try FileManager.default.createDirectory(at:root,withIntermediateDirectories:false,attributes:[.posixPermissions:0o700])
    let keychain = root.appendingPathComponent("test.keychain").path
    let credentials = try ReasoningCredentials(namespace:UUID().uuidString,testKeychainPath:keychain)
    defer { try? credentials.destroyTestKeychain() }
    let store = try ReasoningStore(support:root,credentials:credentials)
    let initial = try store.load()
    try check(initial.configuration == ReasoningConfiguration(),"initial model defaults")
    var bad = initial.configuration; bad.localEndpoint = "http://evil.example/v1"
    do { _ = try bad.encoded(); throw NSError(domain:"accepted external local endpoint",code:1) } catch is ReasoningError {}
    bad = initial.configuration; bad.localModel = "qwen3:8b\n"
    do { _ = try bad.encoded();throw NSError(domain:"newline model accepted",code:1) } catch is ReasoningError {}
    bad = initial.configuration; bad.cloudKeyID = "../other"
    do { _ = try bad.encoded(); throw NSError(domain:"accepted invalid key ID",code:1) } catch is ReasoningError {}
    let sentinel = "wisp-generated-key-"+UUID().uuidString
    var cloud = initial.configuration; cloud.selected = "deepseek"
    let saved = try store.save(cloud,expected:initial.revision,newKey:sentinel)
    try verify(try credentials.read(saved.configuration.cloudKeyID) == sentinel,"real Keychain retrieve")
    try verify(try store.load().configuration == saved.configuration,"model persistence")
    try credentials.withLockedTestKeychain {
        do { _ = try credentials.read(saved.configuration.cloudKeyID);throw NSError(domain:"locked Keychain unexpectedly readable",code:1) } catch ReasoningError.keychain {}
    }
    try verify(try credentials.read(saved.configuration.cloudKeyID) == sentinel,"scoped Keychain unlock recovery")
    let bytes = try Data(contentsOf:root.appendingPathComponent("reasoning/config.json"))
    try check(!String(decoding:bytes,as:UTF8.self).contains(sentinel),"secret not config")
    do { _ = try store.save(initial.configuration,expected:initial.revision,newKey:nil); throw NSError(domain:"stale saved",code:1) } catch StoreError.conflict {}
    let replaced = try store.save(saved.configuration,expected:saved.revision,newKey:"replacement-sentinel")
    try verify(try credentials.read(saved.configuration.cloudKeyID) == nil,"old key retired")
    try verify(try credentials.read(replaced.configuration.cloudKeyID) == "replacement-sentinel","replacement read")
    let removed = try store.removeKey(expected:replaced.revision)
    try check(removed.configuration.cloudKeyID.isEmpty,"key removal config")
    try verify(try credentials.read(replaced.configuration.cloudKeyID) == nil,"key removed")
    let malformed = Data("{\"version\":true}".utf8)
    do { _ = try ReasoningConfiguration.decode(malformed); throw NSError(domain:"bad schema accepted",code:1) } catch is ReasoningError {}
    // Independent exact namespace cannot read or delete another companion's sentinel.
    let isolated = try ReasoningCredentials(namespace:UUID().uuidString,testKeychainPath:keychain)
    let unrelatedID=UUID().uuidString.lowercased(); try credentials.add(unrelatedID,value:"other-key-canary")
    try verify(try isolated.read(unrelatedID) == nil,"Keychain namespace isolation")
    try isolated.remove(unrelatedID)
    try verify(try credentials.read(unrelatedID) == "other-key-canary","unrelated exact item unchanged")
    try credentials.remove(unrelatedID)
    for point in ["journal","key-created","before-config","config-published"] {
        let trial=root.appendingPathComponent(point);try FileManager.default.createDirectory(at:trial,withIntermediateDirectories:false,attributes:[.posixPermissions:0o700])
        var attemptedID=""
        do {
            let failing=try ReasoningStore(support:trial,credentials:credentials,checkpoint:{ if $0 == point { throw StoreError.writeFailed } })
            let first=try failing.load()
            do { _ = try failing.save(cloud,expected:first.revision,newKey:"interrupted-test-key");throw NSError(domain:"checkpoint not reached",code:1) } catch StoreError.writeFailed {}
            let pending=try JSONSerialization.jsonObject(with:Data(contentsOf:trial.appendingPathComponent("reasoning/pending.json"))) as! [String:String]
            attemptedID=pending["new"]!
        }
        let recovered=try ReasoningStore(support:trial,credentials:credentials)
        let value=try recovered.load()
        if point == "config-published" { try verify(try credentials.read(value.configuration.cloudKeyID) == "interrupted-test-key","published pair recovered");_ = try recovered.removeKey(expected:value.revision) }
        else { try check(value.configuration.selected == "local","old config preserved"); if !attemptedID.isEmpty { try verify(try credentials.read(attemptedID) == nil,"uncommitted key cleaned") } }
    }
    let faultRoot=root.appendingPathComponent("denied");try FileManager.default.createDirectory(at:faultRoot,withIntermediateDirectories:false,attributes:[.posixPermissions:0o700])
    let denied=try ReasoningCredentials(namespace:UUID().uuidString,testKeychainPath:keychain,checkpoint:{ _ in throw ReasoningError.keychain })
    let deniedStore=try ReasoningStore(support:faultRoot,credentials:denied)
    let deniedInitial=try deniedStore.load()
    do { _ = try deniedStore.save(cloud,expected:deniedInitial.revision,newKey:"sentinel");throw NSError(domain:"denial ignored",code:1) } catch ReasoningError.keychain {}
    let deniedBytes=try Data(contentsOf:faultRoot.appendingPathComponent("reasoning/config.json"));try check(try ReasoningConfiguration.decode(deniedBytes).selected == "local","Keychain denial never commits cloud selection")
    do { _ = try store.bootstrap(removed);throw NSError(domain:"missing key booted",code:1) } catch ReasoningError.missingKey {}
    let configURL=root.appendingPathComponent("reasoning/config.json"),canary=root.appendingPathComponent("outside-canary.json")
    let pristine=try Data(contentsOf:configURL);try pristine.write(to:canary);try FileManager.default.setAttributes([.posixPermissions:0o600],ofItemAtPath:canary.path)
    for hard in [false,true] {
        try FileManager.default.removeItem(at:configURL)
        if hard { try FileManager.default.linkItem(at:canary,to:configURL) } else { try FileManager.default.createSymbolicLink(at:configURL,withDestinationURL:canary) }
        do { _ = try store.load();throw NSError(domain:"unsafe config link accepted",code:1) } catch StoreError.unsafe {} catch StoreError.unavailable {}
        try check(try Data(contentsOf:canary) == pristine,"outside config canary unchanged")
        try FileManager.default.removeItem(at:configURL);try pristine.write(to:configURL);try FileManager.default.setAttributes([.posixPermissions:0o600],ofItemAtPath:configURL.path)
    }
    try Data("{broken".utf8).write(to:configURL)
    do { _ = try store.load();throw NSError(domain:"corrupt config accepted",code:1) } catch ReasoningError.invalid {}
    try pristine.write(to:configURL)
    let linkedChain=root.appendingPathComponent("linked.keychain");try FileManager.default.createSymbolicLink(at:linkedChain,withDestinationURL:URL(fileURLWithPath:keychain))
    do { _ = try ReasoningCredentials(namespace:UUID().uuidString,testKeychainPath:linkedChain.path);throw NSError(domain:"test Keychain symlink followed",code:1) } catch ReasoningError.keychain {}
    let lock=root.appendingPathComponent("reasoning/owner.lock");try FileManager.default.removeItem(at:lock)
    do { _ = try ReasoningStore(support:root,credentials:credentials);throw NSError(domain:"duplicate reasoning owner",code:1) } catch StoreError.busy {}
    do { _ = try store.load();throw NSError(domain:"replaced lock accepted",code:1) } catch StoreError.unsafe {}
    print("Reasoning assertions: real isolated Keychain CRUD, config roundtrip, stale save, schema and secret separation")
}

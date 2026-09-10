import Foundation
func voiceStoreTests()throws {
    let root=URL(fileURLWithPath:CommandLine.arguments[1]).appendingPathComponent("voice-config-tests")
    try FileManager.default.createDirectory(at:root,withIntermediateDirectories:true,attributes:[.posixPermissions:0o700])
    var saved=VoiceConfiguration();saved.muted=true;saved.locale="en-GB";saved.voice="installed-test-voice";saved.rate=0.4
    var defaultReads=0
    do{let store=try VoiceStore(support:root,defaults:{defaultReads+=1;var fresh=VoiceConfiguration();fresh.voice="ordinary-installed";return fresh});try check(try store.load().voice=="ordinary-installed","fresh store uses installed default");try store.save(saved)}
    do{let store=try VoiceStore(support:root,defaults:{defaultReads+=1;return VoiceConfiguration()});try check(try store.load()==saved,"voice choices and mute persist independently")}
    try check(defaultReads==1,"existing selections never recomputed or replaced by fresh default")
    for bytes in [Data("{}".utf8),Data("{\"version\":1,\"locale\":\"en-US\",\"voice\":\"voice\",\"rate\":2,\"muted\":true}".utf8)]{do{_ = try VoiceConfiguration.decode(bytes);throw NSError(domain:"accepted invalid voice",code:1)}catch is DecodingError{}catch StoreError.invalidMemory{}}
    try FileManager.default.removeItem(at:root.appendingPathComponent("voice/config.json"))
    let sentinel=root.appendingPathComponent("sentinel");try Data("untouched".utf8).write(to:sentinel)
    try FileManager.default.createSymbolicLink(at:root.appendingPathComponent("voice/config.json"),withDestinationURL:sentinel)
    do{let store=try VoiceStore(support:root);_ = try store.load();throw NSError(domain:"voice followed symlink",code:1)}catch StoreError.unsafe{}catch StoreError.unavailable{}
    try check(try String(contentsOf:sentinel,encoding:.utf8)=="untouched","unsafe voice config leaves sentinel unchanged")
}

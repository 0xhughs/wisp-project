import Foundation
func onboardingStateTests() throws {
    let snapshot = try HardwareProbe.finalize(HardwareSnapshot(
        platform:"linux",
        cpu:HardwareCPU(status:"available",modelName:"Injected CPU",logicalCount:2,reason:nil),
        memory:HardwareMemory(status:"available",kind:"discrete",totalBytes:8_589_934_592,availableBytes:4_294_967_296,unifiedBytes:nil,reason:nil),
        gpu:HardwareGPU(status:"unavailable",name:nil,hasUnifiedMemory:nil,workingSetHintBytes:nil,vram:HardwareVRAM(status:"unavailable",bytes:nil,reason:"no drm/sysfs GPU node"),reason:"no drm/sysfs GPU node"),
        disk:HardwareDisk(status:"available",availableBytes:80_000_000_000,rootAvailableBytes:80_000_000_000,homeAvailableBytes:nil,reason:nil),
        sources:["proc-meminfo"],digest:""
    ))
    let tags = OllamaInspectReport(status:"ok",version:"0.11.0",models:[
        OllamaTag(name:"qwen3:8b",size:5_228_000_000),
        OllamaTag(name:"tinyllama:latest",size:637_000_000),
        OllamaTag(name:"llama3:70b",size:39_000_000_000)
    ])
    let rec = Onboarding.recommend(snapshot:snapshot,ollama:tags)
    try check(rec.choice("recommended")?.identifier == "qwen3:8b", "Recommended binds qwen3:8b")
    try check(rec.choice("faster")?.identifier == "tinyllama:latest" && rec.choice("stronger")?.identifier == "llama3:70b", "Faster/Stronger unique by size")
    try check(rec.speechHeadroom.numericReservationBytes == nil && rec.disk.status == "available", "speechHeadroom and disk on every recommendation")
    try check(rec.choice("recommended")?.status == "fit-uncertain", "GPU missing is fit-uncertain, not a comfort promise")
    let empty = Onboarding.recommend(snapshot:snapshot,ollama:OllamaInspectReport(status:"ok",version:"0.11.0",models:[]))
    try check(empty.choice("recommended")?.status == "not-installed" && empty.choice("faster")?.status == "unavailable", "empty tags do not pull")
    let down = Onboarding.recommend(snapshot:snapshot,ollama:OllamaInspectReport(status:"unreachable",version:nil,models:[],reason:"down"))
    try check(down.choice("recommended")?.status == "ollama-unreachable", "unreachable Ollama")
    var saved = ReasoningConfiguration(); saved.localModel = "qwen3:8b"
    try check(ModelsApply.isUnchanged(draft:saved,saved:saved,key:nil), "equal saved configuration is a no-op")
    var other = saved; other.localModel = "tinyllama:latest"
    try check(!ModelsApply.isUnchanged(draft:other,saved:saved,key:nil), "route change is not a no-op")
    try check(!OnboardingInstall.enabled(plan:nil), "Install disabled without plan")
    var plan = ResourcePlan(source:"ollama-library:qwen3:8b",expectedBytes:5_228_000_000,consent:false)
    try check(!OnboardingInstall.enabled(plan:plan), "Install disabled without consent")
    plan.consent = true
    try check(OnboardingInstall.enabled(plan:plan), "Install enabled with consented plan")
    do { _ = try OnboardingInstall.assertAllowed(nil); throw NSError(domain:"missing plan allowed",code:1) } catch OnboardingError.resourcePlanRequired {}
    do { try OnboardingInstall.perform(plan:plan,transport:nil); throw NSError(domain:"nil transport pulled",code:1) } catch OnboardingError.pullNotAuthorized {}
    var posted = false
    try OnboardingInstall.perform(plan:plan,transport:{ method in posted = method.contains("POST /api/pull") })
    try check(posted, "fixture pull transport only")
    var confirm = OnboardingConfirm(draft:other)
    try check(confirm.finish(false) == nil, "confirm cancel leaves saved route")
    confirm.draft = other
    try check(confirm.finish(true)?.localModel == "tinyllama:latest", "confirm apply returns draft")
    try check(OnboardingRefresh.operations.allSatisfy { OnboardingRefresh.isAllowed($0) }, "refresh operations allowed")
    try check(!OnboardingRefresh.forbidden.contains("hardware-collect"), "forbidden list is inspect/pull/wake")
    try check(!OnboardingRefresh.operations.contains("testModelConnection") && !OnboardingRefresh.operations.contains("wakeVoice"), "refresh is not wake or Test Connection")
    let tagsJSON = Data("{\"models\":[{\"name\":\"qwen3:8b\",\"size\":5228000000,\"extra\":\"ignored\"}]}".utf8)
    let decoded = try OllamaInspect.decodeTags(tagsJSON)
    try check(decoded.first?.name == "qwen3:8b" && decoded.first?.size == 5_228_000_000, "tags fixture ignores extra fields")
    let report = OllamaInspect.inspect(localEndpoint:"http://127.0.0.1:1/v1",transport:{ method, path in
        try check(method == "GET" && (path == "/api/version" || path == "/api/tags"), "GET-only inspect")
        if path.contains("pull") { throw NSError(domain:"pull requested",code:1) }
        if path == "/api/version" { return Data("{\"version\":\"0.11.0\"}".utf8) }
        return Data("{\"models\":[]}".utf8)
    })
    try check(report.status == "ok" && report.version == "0.11.0", "injected transport inspect")
    do { _ = try OllamaInspect.origin(from:"http://example.com:11434/v1"); throw NSError(domain:"non-loopback origin",code:1) } catch is ReasoningError {}
    let text = OnboardingDiagnostics.diagnosticText(snapshot:snapshot,inspect:tags,record:rec)
    try check(text.contains("CPU") && text.contains("qwen3:8b") && !text.contains("BEGIN") && !text.contains("sk-") && !text.contains("memory.json") && !text.contains("/Users/"), "diagnostics omit secrets and home dumps")
    let root = URL(fileURLWithPath:CommandLine.arguments[1]).appendingPathComponent("onboarding-"+UUID().uuidString)
    try FileManager.default.createDirectory(at:root,withIntermediateDirectories:false,attributes:[.posixPermissions:0o700])
    let store = try ResourcePlanStore(support:root)
    try check(try store.load() == nil, "missing resource plan is absence, not a default consent")
    let savedPlan = try store.save(plan,expected:nil)
    try check(try store.load() == savedPlan && savedPlan.consent, "resource-plan persist")
    let bytes = try Data(contentsOf:root.appendingPathComponent("onboarding/resource-plan.json"))
    try check(!String(decoding:bytes,as:UTF8.self).contains("BEGIN") && !String(decoding:bytes,as:UTF8.self).contains("memory.json"), "plan has no secrets and is not memory.json")
    let canary = root.appendingPathComponent("outside-plan.json")
    try bytes.write(to:canary)
    let configURL = root.appendingPathComponent("onboarding/resource-plan.json")
    try FileManager.default.removeItem(at:configURL)
    try FileManager.default.createSymbolicLink(at:configURL,withDestinationURL:canary)
    do { _ = try store.load(); throw NSError(domain:"resource plan followed symlink",code:1) } catch StoreError.unsafe {} catch StoreError.unavailable {}
    print("Onboarding assertions: confirm-cancel, no-op Apply, Install disabled without plan, GET-only inspect, uncompiled on Linux")
}

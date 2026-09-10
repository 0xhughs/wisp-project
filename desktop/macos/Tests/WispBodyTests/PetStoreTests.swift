import Foundation
func petStoreTests() throws {
    let root = URL(fileURLWithPath:CommandLine.arguments[1]).appendingPathComponent("pets-"+UUID().uuidString)
    try FileManager.default.createDirectory(at:root,withIntermediateDirectories:false,attributes:[.posixPermissions:0o700])
    let store = try PetStore(support:root)
    let initial = try store.load()
    try check(initial.configuration == PetConfiguration() && initial.configuration.catalogId == "wisp-orb", "default body is wisp-orb")
    var bird = initial.configuration; bird.catalogId = "wisp-bird"
    _ = try bird.encoded()
    var bad = initial.configuration; bad.catalogId = "wisp-dragon"
    do { _ = try bad.encoded(); throw NSError(domain:"accepted unknown pet id",code:1) } catch is PetError {}
    bad = initial.configuration; bad.catalogId = "official-skins"
    do { _ = try bad.encoded(); throw NSError(domain:"accepted official-skins as body",code:1) } catch is PetError {}
    bad = initial.configuration; bad.catalogId = "tool-bash"
    do { _ = try bad.encoded(); throw NSError(domain:"accepted tool-bash pet id",code:1) } catch is PetError {}
    bad = initial.configuration; bad.catalogId = ""
    do { _ = try bad.encoded(); throw NSError(domain:"accepted empty pet id",code:1) } catch is PetError {}
    bad = initial.configuration; bad.version = 2
    do { _ = try bad.encoded(); throw NSError(domain:"accepted unknown pet version",code:1) } catch is PetError {}
    var fox = initial.configuration; fox.catalogId = "wisp-fox"
    let saved = try store.save(fox,expected:initial.revision)
    try check(try store.load().configuration == saved.configuration && saved.configuration.catalogId == "wisp-fox", "pet persist/reload")
    do { _ = try store.save(initial.configuration,expected:initial.revision); throw NSError(domain:"stale pet save",code:1) } catch StoreError.conflict {}
    var draft = PetDraft.from(saved)
    draft.catalogId = "wisp-robot"
    try check(try store.load().configuration.catalogId == "wisp-fox", "draft vs saved does not write")
    draft.confirmApply(false,id:"wisp-robot")
    try check(try store.load().configuration.catalogId == "wisp-fox", "confirm-cancel zero snapshot change")
    draft.confirmApply(true,id:"wisp-robot")
    try check(draft.catalogId == "wisp-robot" && (try store.load().configuration.catalogId == "wisp-fox"), "confirm apply is draft-only until save")
    try check(PetApply.allowed(homeBusy:true,ending:false,modelBusy:false) == false, "Apply while home busy refused")
    try check(PetApply.allowed(homeBusy:false,ending:true,modelBusy:false) == false, "Apply while ending refused")
    try check(PetApply.allowed(homeBusy:false,ending:false,modelBusy:true), "Apply allowed when modelBusy analogue is true")
    try check(PetApply.allowed(homeBusy:false,ending:false,modelBusy:false), "Apply allowed when idle")
    let rows = PetCatalog.rows(savedId:"wisp-orb",currentId:"wisp-orb")
    try check(rows.map(\.id) == ["wisp-orb","wisp-fox","wisp-robot","wisp-bird","wisp-cat","wisp-owl","wisp-sprout","wisp-capsule","official-skins"], "closed catalog order")
    try check(rows[0].status == .current && rows[0].canManage, "orb current")
    try check(rows.contains(where:{$0.id=="official-skins" && !$0.canManage && $0.status==.unavailable}), "unsupported skins row not enableable")
    try check(rows.filter{$0.kind==.unsupported}.allSatisfy{!$0.canManage}, "unsupported cannot manage")
    try check(!rows.contains(where:{$0.id=="official-skins" && $0.detail.contains("slice 19")}), "remainder does not claim skins remain slice 19")
    let applying = PetCatalog.rows(savedId:"wisp-orb",currentId:"wisp-orb",applying:true,applyingId:"wisp-fox")
    try check(applying.first{$0.id=="wisp-fox"}?.status == .applying && applying.filter{$0.kind==.body}.allSatisfy{!$0.canManage}, "applying disables manage")
    try check(PetCatalog.rows(savedId:"wisp-fox",currentId:"wisp-orb").first{$0.id=="wisp-fox"}?.status == .saved, "saved differs from current")
    let malformed = Data("{\"version\":true,\"catalogId\":\"wisp-orb\"}".utf8)
    do { _ = try PetConfiguration.decode(malformed); throw NSError(domain:"bad pet schema accepted",code:1) } catch is PetError {}
    let extra = Data("{\"version\":1,\"catalogId\":\"wisp-orb\",\"extra\":1}".utf8)
    do { _ = try PetConfiguration.decode(extra); throw NSError(domain:"extra pet keys accepted",code:1) } catch is PetError {}
    let oversize = Data("{\"version\":1,\"catalogId\":\"wisp-orb\",\"padding\":\"".utf8) + Data(repeating:UInt8(ascii:"x"),count:5000) + Data("\"}".utf8)
    do { _ = try PetConfiguration.decode(oversize); throw NSError(domain:"oversize pet accepted",code:1) } catch is PetError {} catch StoreError.invalidMemory {}
    let configURL = root.appendingPathComponent("pets/config.json"), canary = root.appendingPathComponent("outside-pet.json")
    let pristine = try Data(contentsOf:configURL); try pristine.write(to:canary); try FileManager.default.setAttributes([.posixPermissions:0o600],ofItemAtPath:canary.path)
    try FileManager.default.removeItem(at:configURL)
    try FileManager.default.createSymbolicLink(at:configURL,withDestinationURL:canary)
    do { _ = try store.load(); throw NSError(domain:"pet followed symlink",code:1) } catch StoreError.unsafe {} catch StoreError.unavailable {}
    try check(try Data(contentsOf:canary) == pristine, "outside pet canary unchanged")
    try FileManager.default.removeItem(at:configURL)
    let waveRoot = URL(fileURLWithPath:CommandLine.arguments[1]).appendingPathComponent("pets-wave-"+UUID().uuidString)
    try FileManager.default.createDirectory(at:waveRoot,withIntermediateDirectories:false,attributes:[.posixPermissions:0o700])
    let waveStore = try PetStore(support:waveRoot)
    let waveInitial = try waveStore.load()
    try check(waveInitial.configuration.catalogId == "wisp-orb", "wave store defaults to orb")
    var capsule = waveInitial.configuration; capsule.catalogId = "wisp-capsule"
    let waveSaved = try waveStore.save(capsule,expected:waveInitial.revision)
    try check(try waveStore.load().configuration.catalogId == "wisp-capsule", "wave-1 persist/reload")
    try check(waveSaved.configuration.catalogId == "wisp-capsule", "wave-1 snapshot id")
    try check(PetConfiguration.normalized("wisp-dragon") == "wisp-orb", "unknown ids normalize for drawing only")
    try check(PetConfiguration.normalized("wisp-cat") == "wisp-cat", "wave-1 id is not normalized away")
    let foxSample = PetRaster.samples("wisp-fox"), robotSample = PetRaster.samples("wisp-robot"), orbSample = PetRaster.samples("wisp-orb")
    try check(orbSample.gap == (80,98) && foxSample.uniqueOpaque != robotSample.uniqueOpaque && foxSample.gap != orbSample.gap, "raster samples distinct")
    try check(orbSample.uniqueOpaque == (40,80) && foxSample.gap == (80,78) && robotSample.uniqueOpaque == (80,8), "starter raster samples unchanged")
    var gaps = Set<String>(), uniques = Set<String>()
    for id in PetConfiguration.selectable {
        let sample = PetRaster.samples(id)
        try check(sample.corner == (0,0), "corner origin \(id)")
        let g = "\(sample.gap.0),\(sample.gap.1)", u = "\(sample.uniqueOpaque.0),\(sample.uniqueOpaque.1)"
        try check(g != u && g != "0,0" && u != "0,0", "gap and uniqueOpaque distinct \(id)")
        try check(!gaps.contains(g), "gap collision \(g)")
        try check(!uniques.contains(u), "uniqueOpaque collision \(u)")
        gaps.insert(g); uniques.insert(u)
    }
    try check(PetConfiguration.selectable.count == 8, "eight selectable ids")
    print("Pet assertions: persist/reload including wave-1, default orb, unknown id rejected, bird accepted, confirm-cancel, draft vs saved, Apply busy, skins unavailable, uncompiled on Linux")
}

import Foundation
import Darwin
func homeStoreTests() throws {
    let root = URL(fileURLWithPath:CommandLine.arguments.count > 1 ? CommandLine.arguments[1] : NSTemporaryDirectory()).resolvingSymlinksInPath().appendingPathComponent("home-check-"+UUID().uuidString)
    let fm = FileManager.default
    try fm.createDirectory(at:root,withIntermediateDirectories:true,attributes:[.posixPermissions:0o700])
    defer { try? fm.removeItem(at:root) }
    let support = root.appendingPathComponent("support"), chosen = root.appendingPathComponent("chosen")
    try fm.createDirectory(at:chosen,withIntermediateDirectories:false,attributes:[.posixPermissions:0o755])
    var store: HomeStore? = try HomeStore(supportURL:support)
    try check(try store!.load() == nil,"no implicit home")
    var snapshot = try store!.choose(chosen)
    let id = snapshot.companionId
    var document = snapshot.document
    document.entries = MemoryCategory.allCases.map{MemoryEntry(id:UUID().uuidString,category:$0,text:"A useful \($0.rawValue) {{literal}} 🦊")}
    snapshot = try store!.save(document,expected:snapshot.revision)
    try check(snapshot.document == document,"saved document")
    do { _ = try HomeStore(supportURL:support); throw NSError(domain:"second owner",code:1) } catch StoreError.busy {}
    let otherSupport = root.appendingPathComponent("other-support")
    do { let other = try HomeStore(supportURL:otherSupport); _ = try other.choose(chosen); throw NSError(domain:"adopt nonempty",code:1) } catch StoreError.invalidHome {}
    let oldRevision = snapshot.revision
    var external = document; external.entries[0].text = "External edit"
    let file = chosen.appendingPathComponent("memory.json")
    // A cooperating external editor owns the coordinated write while Wisp attempts save.
    let editorEntered = DispatchSemaphore(value:0), editorFinished = DispatchSemaphore(value:0)
    let editorBytes = try external.encoded()
    DispatchQueue.global().async {
        var error: NSError?
        NSFileCoordinator().coordinate(writingItemAt:file,options:[],error:&error) { target in
            editorEntered.signal()
            usleep(200_000)
            try! editorBytes.write(to:target)
            chmod(target.path,0o600)
        }
        precondition(error == nil)
        editorFinished.signal()
    }
    try check(editorEntered.wait(timeout:.now()+5) == .success,"external coordinator entered")
    do { _ = try store!.save(document,expected:oldRevision); throw NSError(domain:"stale lost edit",code:1) } catch StoreError.conflict {}
    try check(editorFinished.wait(timeout:.now()+5) == .success,"external coordinator finished")
    try check(try store!.read().document == external,"coordinated external edit kept")
    let beforeUncoordinated = try store!.read().revision
    do { _ = try store!.save(document,expected:beforeUncoordinated,beforePublish:{ try document.encoded().write(to:file) }); throw NSError(domain:"uncoordinated overwrite",code:1) } catch StoreError.conflict {}
    try external.encoded().write(to:file)
    let revision = try store!.read().revision
    do { _ = try store!.save(document,expected:revision,beforePublish:{throw StoreError.writeFailed}); throw NSError(domain:"fault accepted",code:1) } catch StoreError.writeFailed {}
    try check(try store!.read().document == external,"old document after interrupted save")
    store = nil; store = try HomeStore(supportURL:support)
    let restored = try store!.load()!
    try check(restored.companionId == id && restored.document == external,"bookmark restart identity and memory")
    let canary = root.appendingPathComponent("canary")
    try Data("outside".utf8).write(to:canary); chmod(canary.path,0o600)
    try fm.removeItem(at:file); try fm.createSymbolicLink(at:file,withDestinationURL:canary)
    do { _ = try store!.read(); throw NSError(domain:"symlink read",code:1) } catch is StoreError {}
    do { _ = try store!.save(document,expected:revision); throw NSError(domain:"symlink save",code:1) } catch is StoreError {}
    try check(try String(contentsOf:canary,encoding:.utf8) == "outside","outside canary intact")
    try fm.removeItem(at:file); try fm.linkItem(at:canary,to:file)
    do { _ = try store!.read(); throw NSError(domain:"hardlink read",code:1) } catch StoreError.unsafe {}
    try fm.removeItem(at:file); try external.encoded().write(to:file); chmod(file.path,0o644)
    do { _ = try store!.read(); throw NSError(domain:"unsafe mode",code:1) } catch StoreError.unsafe {}
    chmod(file.path,0o600)
    try Data("{broken".utf8).write(to:file)
    do { _ = try store!.read(); throw NSError(domain:"corrupt accepted",code:1) } catch StoreError.invalidMemory {}
    try check(try String(contentsOf:file,encoding:.utf8) == "{broken","corruption preserved")
    try external.encoded().write(to:file)
    let moved = root.appendingPathComponent("moved")
    store = nil; try fm.moveItem(at:chosen,to:moved)
    store = try HomeStore(supportURL:support)
    // Bookmark may follow the move; explicit same-identity reselection must always recover.
    _ = try? store!.load()
    try check(try store!.choose(moved).companionId == id,"same-home relocation recovery")
    store = nil
    let partialSupport = root.appendingPathComponent("partial-support"), partialHome = root.appendingPathComponent("partial-home")
    try fm.createDirectory(at:partialHome,withIntermediateDirectories:false,attributes:[.posixPermissions:0o700])
    var interrupted: HomeStore? = try HomeStore(supportURL:partialSupport,checkpoint:{ _ in throw StoreError.writeFailed })
    do { _ = try interrupted!.choose(partialHome); throw NSError(domain:"pointer failure accepted",code:1) } catch StoreError.writeFailed {}
    try check(!fm.fileExists(atPath:partialSupport.appendingPathComponent("home.json").path),"pointer committed too early")
    let partialMarker = try Data(contentsOf:partialHome.appendingPathComponent("wisp-home.json"))
    interrupted = nil
    let recovered = try HomeStore(supportURL:partialSupport)
    let recoveredSnapshot = try recovered.choose(partialHome)
    try check(try Data(contentsOf:partialHome.appendingPathComponent("wisp-home.json")) == partialMarker,"partial recovery identity")
    var changed = recoveredSnapshot.document
    changed.entries = [MemoryEntry(id:UUID().uuidString,category:.fact,text:"After publication")]
    do { _ = try recovered.save(changed,expected:recoveredSnapshot.revision,afterPublish:{throw StoreError.writeFailed}); throw NSError(domain:"lost ack accepted",code:1) } catch StoreError.writeFailed {}
    try check(try recovered.read().document == changed,"post-publication valid new state")
    chmod(partialHome.path,0o500)
    do { _ = try recovered.save(changed,expected:try recovered.read().revision); throw NSError(domain:"readonly accepted",code:1) } catch is StoreError {}
    chmod(partialHome.path,0o700)
    let linkedSupport = root.appendingPathComponent("linked-support")
    try fm.createSymbolicLink(at:linkedSupport,withDestinationURL:partialSupport)
    do { _ = try HomeStore(supportURL:linkedSupport); throw NSError(domain:"support symlink",code:1) } catch is StoreError {}
    let files = partialHome.appendingPathComponent("files"), filesAside = partialHome.appendingPathComponent("files-aside")
    try fm.moveItem(at:files,to:filesAside); try fm.createSymbolicLink(at:files,withDestinationURL:filesAside)
    do { _ = try recovered.read(); throw NSError(domain:"managed directory symlink",code:1) } catch is StoreError {}
    try fm.removeItem(at:files); try fm.moveItem(at:filesAside,to:files)
    let marker = partialHome.appendingPathComponent("wisp-home.json"), markerBytes = try Data(contentsOf:marker)
    try Data("{\"version\":2}".utf8).write(to:marker)
    do { _ = try recovered.read(); throw NSError(domain:"unsupported marker",code:1) } catch is StoreError {}
    try markerBytes.write(to:marker)
    let beforeAncestor = try recovered.read().revision
    let aside = root.appendingPathComponent("aside"); try fm.moveItem(at:partialHome,to:aside); try fm.createSymbolicLink(at:partialHome,withDestinationURL:aside)
    do { _ = try recovered.save(changed,expected:beforeAncestor); throw NSError(domain:"replaced ancestor accepted",code:1) } catch is StoreError {}
    try check(try String(contentsOf:canary,encoding:.utf8) == "outside","outside canary final")
    for mutation in ["symlink","hardlink","mode","directory","fifo"] {
        let area = root.appendingPathComponent("recovery-"+mutation)
        try fm.createDirectory(at:area,withIntermediateDirectories:false,attributes:[.posixPermissions:0o700])
        let state = area.appendingPathComponent("support"), selected = area.appendingPathComponent("home")
        try fm.createDirectory(at:selected,withIntermediateDirectories:false,attributes:[.posixPermissions:0o700])
        var first: HomeStore? = try HomeStore(supportURL:state,checkpoint:{ _ in throw StoreError.writeFailed })
        do { _ = try first!.choose(selected); throw NSError(domain:"expected interruption",code:1) } catch StoreError.writeFailed {}
        first = nil
        let readme = selected.appendingPathComponent("README.txt"), original = try Data(contentsOf:readme)
        let identity = try Data(contentsOf:selected.appendingPathComponent("wisp-home.json"))
        if mutation == "mode" { chmod(readme.path,0o644) }
        else {
            try fm.removeItem(at:readme)
            switch mutation {
            case "symlink": try fm.createSymbolicLink(at:readme,withDestinationURL:canary)
            case "hardlink": try fm.linkItem(at:canary,to:readme)
            case "directory": try fm.createDirectory(at:readme,withIntermediateDirectories:false,attributes:[.posixPermissions:0o700])
            default: try check(mkfifo(readme.path,0o600) == 0,"fifo fixture")
            }
        }
        let retry = try HomeStore(supportURL:state)
        do { _ = try retry.choose(selected); throw NSError(domain:"unsafe pending recovery",code:1) } catch is StoreError {}
        try check(!fm.fileExists(atPath:state.appendingPathComponent("home.json").path),"unsafe recovery never commits pointer")
        do { _ = try retry.read(); throw NSError(domain:"unsafe recovery readable",code:1) } catch is StoreError {}
        try check(try String(contentsOf:canary,encoding:.utf8) == "outside","recovery canary unchanged")
        try fm.removeItem(at:readme); try original.write(to:readme); chmod(readme.path,0o600)
        _ = try retry.choose(selected)
        try check(try Data(contentsOf:selected.appendingPathComponent("wisp-home.json")) == identity,"safe retry keeps interrupted identity")
    }
    let liveArea = root.appendingPathComponent("live-move")
    try fm.createDirectory(at:liveArea,withIntermediateDirectories:false,attributes:[.posixPermissions:0o700])
    let liveHome = liveArea.appendingPathComponent("home"), liveMoved = liveArea.appendingPathComponent("moved")
    try fm.createDirectory(at:liveHome,withIntermediateDirectories:false,attributes:[.posixPermissions:0o700])
    let liveStore = try HomeStore(supportURL:liveArea.appendingPathComponent("support"))
    let originalLive = try liveStore.choose(liveHome)
    try fm.moveItem(at:liveHome,to:liveMoved)
    do { _ = try liveStore.read(); throw NSError(domain:"stale live path",code:1) } catch is StoreError {}
    let liveMarker = liveMoved.appendingPathComponent("wisp-home.json"), liveMarkerBytes = try Data(contentsOf:liveMarker)
    try JSONSerialization.data(withJSONObject:["version":1,"companionId":UUID().uuidString]).write(to:liveMarker)
    do { _ = try liveStore.choose(liveMoved); throw NSError(domain:"changed live marker",code:1) } catch StoreError.differentHome {}
    try liveMarkerBytes.write(to:liveMarker)
    let liveMemory = liveMoved.appendingPathComponent("memory.json"), liveMemoryBytes = try Data(contentsOf:liveMemory)
    try Data("{broken".utf8).write(to:liveMemory)
    do { _ = try liveStore.choose(liveMoved); throw NSError(domain:"invalid moved memory",code:1) } catch StoreError.invalidMemory {}
    try check(try String(contentsOf:liveMemory,encoding:.utf8) == "{broken","invalid moved memory preserved")
    try liveMemoryBytes.write(to:liveMemory)
    let rebound = try liveStore.choose(liveMoved)
    try check(rebound.companionId == originalLive.companionId && rebound.revision == originalLive.revision,"live rebind same snapshot")
    var nextDocument = rebound.document; nextDocument.entries = [MemoryEntry(id:UUID().uuidString,category:.fact,text:"Saved after live move")]
    let savedAfterMove = try liveStore.save(nextDocument,expected:rebound.revision)
    try check(try liveStore.load()?.document == nextDocument,"load and save after live rebind")
    _ = try liveStore.stage(savedAfterMove); try liveStore.clearStage()
    // Recovery must never turn a replaced named lock into a new ownership grant.
    try fm.moveItem(at:liveMoved,to:liveHome)
    try fm.removeItem(at:liveHome.appendingPathComponent(".wisp-lock"))
    try Data().write(to:liveHome.appendingPathComponent(".wisp-lock")); chmod(liveHome.appendingPathComponent(".wisp-lock").path,0o600)
    do { _ = try liveStore.choose(liveHome); throw NSError(domain:"moved replaced lock accepted",code:1) } catch is StoreError {}
    print("Home assertions passed: real bookmark/restart, external conflict, interrupted save, modes, links, canary, recovery")
}

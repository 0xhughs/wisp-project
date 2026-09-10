import Foundation
func visualClickDriverTests() throws {
    let driver=RecordingVisualClickDriver()
    let generation=UUID().uuidString
    func event(_ arguments:[String:String], id:String="vis-1", destination:String="visual-fixture-canary:Drawn Canary")->[String:Any] {
        ["event":"visual-request","version":1,"generation":generation,"visualRequestId":id,"operation":"click-drawn-canary","destination":destination,"sessionId":"s","callId":"c","actionDigest":String(repeating:"a",count:64),"arguments":arguments]
    }
    let applied=try VisualClickDriver.handle(event(["title":"Wisp Accessibility Fixture","target":"Drawn Canary"]), expectedGeneration:generation, driver:driver)
    try check(driver.count==1 && applied["outcome"] as? String=="applied" && driver.rasters==0 && driver.mouseEvents==0, "one unique visual after grant; recording driver never rasters")
    for bad in [
        event(["title":"Safari","target":"Drawn Canary"]),
        event(["title":"Wisp Accessibility Fixture","target":"Fixture Button"]),
        event(["title":"Wisp Accessibility Fixture","target":"Drawn Canary","extra":"x"]),
        event(["title":"Wisp Accessibility Fixture"]),
        event(["title":"Wisp Accessibility Fixture","target":"Drawn Canary"], destination:"other"),
    ] as [[String:Any]] {
        let before=driver.count
        do {_=try VisualClickDriver.handle(bad, expectedGeneration:generation, driver:driver); throw PermissionFailure.stale}
        catch { try check(driver.count==before && driver.rasters==0 && driver.mouseEvents==0, "rejected visual request does not perform") }
    }
    driver.matchCount=0
    let zero=try VisualClickDriver.handle(event(["title":"Wisp Accessibility Fixture","target":"Drawn Canary"], id:"vis-z"), expectedGeneration:generation, driver:driver)
    try check(zero["outcome"] as? String=="failed" && driver.mouseEvents==0, "zero matches fail with zero mouse events")
    driver.matchCount=2
    let amb=try VisualClickDriver.handle(event(["title":"Wisp Accessibility Fixture","target":"Drawn Canary"], id:"vis-a"), expectedGeneration:generation, driver:driver)
    try check(amb["outcome"] as? String=="failed" && driver.mouseEvents==0, "ambiguous matches fail with zero mouse events")
    #if canImport(AppKit)
    AccessibilityFixtureWindow.shared.present()
    try check(AccessibilityFixtureWindow.shared.canaryView.isAccessibilityElement==false, "Drawn Canary view is not an accessibility element")
    let names=AccessibilityFixtureWindow.shared.accessibilityTitlesAndDescriptions()
    try check(!names.contains("Drawn Canary"), "AX title/description walk does not return Drawn Canary")
    try check(AccessibilityFixtureWindow.shared.canaryView is DrawnCanaryView, "canary is a plain NSView")
    try check(!(AccessibilityFixtureWindow.shared.canaryView is NSButton), "canary is not NSButton")
    try check(!(AccessibilityFixtureWindow.shared.canaryView is NSControl), "canary is not NSControl")
    #endif
}

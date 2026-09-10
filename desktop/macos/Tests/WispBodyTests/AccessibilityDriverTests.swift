import Foundation
func accessibilityDriverTests() throws {
    let driver=RecordingAccessibilityDriver()
    let generation=UUID().uuidString
    func event(_ operation:String,_ destination:String,_ arguments:[String:String], id:String="ax-1")->[String:Any] {
        ["event":"ax-request","version":1,"generation":generation,"axRequestId":id,"operation":operation,"destination":destination,"sessionId":"s","callId":"c","actionDigest":String(repeating:"a",count:64),"arguments":arguments]
    }
    let focused=try AccessibilityDriver.handle(event("focus-fixture-window","ax-fixture-window",["title":"Wisp Accessibility Fixture"]), expectedGeneration:generation, driver:driver)
    try check(driver.count==1 && focused["outcome"] as? String=="applied", "one focus after trust")
    driver.trusted=false
    let beforeUntrusted=driver.count
    let untrusted=try AccessibilityDriver.handle(event("press-named-control","ax-fixture-control:Fixture Button",["name":"Fixture Button"], id:"ax-u"), expectedGeneration:generation, driver:driver)
    try check(untrusted["outcome"] as? String=="untrusted" && driver.count==beforeUntrusted, "untrusted performs zero driver calls")
    driver.trusted=true
    for bad in [
        event("focus-fixture-window","ax-fixture-window",["title":"Safari"]),
        event("move-fixture-window","ax-fixture-window",["title":"Wisp Accessibility Fixture","dx":"0","dy":"0"]),
        event("move-fixture-window","ax-fixture-window",["title":"Wisp Accessibility Fixture","dx":"1","dy":"0","z":"1"]),
        event("press-named-control","ax-fixture-control:Fixture Button",["name":"Fixture Field"]),
        event("set-named-text","ax-fixture-field:Fixture Field",["name":"Fixture Field","text":"hello","extra":"x"]),
        event("search-fixture-tree","ax-fixture-search:Safari",["name":"Safari"]),
    ] as [[String:Any]] {
        let before=driver.count
        do {_=try AccessibilityDriver.handle(bad, expectedGeneration:generation, driver:driver); throw PermissionFailure.stale}
        catch { try check(driver.count==before, "rejected AX request does not perform") }
    }
    try check(AccessibilityDriver.trustedStatus()=="unavailable" || AccessibilityDriver.trustedStatus()=="trusted" || AccessibilityDriver.trustedStatus()=="untrusted", "TCC status is a nonsecret categorical fact")
}

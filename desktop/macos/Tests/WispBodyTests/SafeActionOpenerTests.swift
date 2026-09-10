import Foundation
func safeActionOpenerTests() throws {
    let opener=RecordingWorkspaceOpener()
    let generation=UUID().uuidString
    let opened=try SafeActionOpener.handle(["event":"open-request","version":1,"generation":generation,"openRequestId":"open-1","kind":"url","destination":"https://example.com/"], expectedGeneration:generation, opener:opener)
    try check(opener.count==1 && opened["outcome"] as? String=="opened", "one url open after revalidation")
    for dest in ["javascript:alert(1)","file:///etc/passwd"] {
        let before=opener.count
        do {_=try SafeActionOpener.handle(["event":"open-request","version":1,"generation":generation,"openRequestId":"bad","kind":"url","destination":dest], expectedGeneration:generation, opener:opener); throw PermissionFailure.stale}
        catch { try check(opener.count==before, "rejected scheme does not open") }
    }
    let beforeEtc=opener.count
    do {_=try SafeActionOpener.handle(["event":"open-request","version":1,"generation":generation,"openRequestId":"etc","kind":"file","destination":"/etc/passwd"], expectedGeneration:generation, opener:opener); throw PermissionFailure.invalid}
    catch { try check(opener.count==beforeEtc, "/etc does not open") }
    let gated=Date(timeIntervalSince1970:1_000_000_000)
    let formatted=formatGatedClock(gated, timeZone:TimeZone(secondsFromGMT:0)!)
    try check(formatted.iso.contains("2001") && formatted.timeZone=="GMT", "native calendar formats the gated clock; it is not a second unsigned clock")
}

import Foundation
func permissionStateTests() throws {
    let generation=UUID().uuidString,companion=UUID().uuidString
    func request(_ id:String=UUID().uuidString)->[String:Any] { ["event":"approval-request","version":1,"generation":generation,"requestId":id,"companionId":companion,"sessionId":"wisp-test","callId":"call1","rootCallId":"call1","actionDigest":String(repeating:"a",count:64),"turn":1,"toolName":"wisp_permission_check","source":"wisp-direct","revision":"1","arguments":["label":"verification"],"operation":"append-test-record","destination":"/isolated/ledger","fields":[["label":"Label","value":"verification"]]] }
    var state=PermissionState();state.attach(generation:generation,companionID:companion)
    let r=try PermissionRequest(request());try state.receive(r)
    try check(state.decide(r.requestID,action:"allow-once") != nil,"one decision")
    try check(state.decide(r.requestID,action:"allow-once") == nil,"duplicate decision blocked")
    var close=r.decision("deny");close.removeValue(forKey:"decision");close["event"]="approval-closed";close["outcome"]="rejected"
    try state.closed(close);try check(state.requests.isEmpty,"closed removed")
    do {try state.receive(r);throw PermissionFailure.invalid}catch PermissionFailure.stale {}
    let first=try PermissionRequest(request()),second=try PermissionRequest(request())
    try state.receive(first);try state.receive(second)
    _ = state.decide(second.requestID,action:"allow-once")
    try check(state.displayStatus(for:first.requestID)=="Waiting for your decision.","other request does not inherit sending status")
    try check(state.displayStatus(for:second.requestID)=="Sending your decision…","selected decision has sending status")
    var allowed=second.decision("allow-once");allowed.removeValue(forKey:"decision");allowed["event"]="approval-closed";allowed["outcome"]="allowed-once"
    try state.closed(allowed)
    try check(state.displayStatus(for:first.requestID)=="Waiting for your decision.","remaining request must not display another request's grant")
    state.invalidate();state.attach(generation:generation,companionID:companion)
    let cancelFirst=try PermissionRequest(request()),cancelSecond=try PermissionRequest(request())
    try state.receive(cancelFirst);try state.receive(cancelSecond)
    try check(state.cancelAll() != nil,"one coherent cancellation batch")
    try check(state.cancelAll() == nil,"repeated window close sends no duplicate cancellation")
    try check(state.decide(cancelSecond.requestID,action:"cancel") == nil,"cancel action already covers second request")
    try check(state.deciding.count==2,"both requests await correlated closures")
    state.invalidate();state.attach(generation:generation,companionID:companion)
    var rejected=0
    for mutation in ["extra","version","boolean","destination","generation","arguments"] {var frame=request();switch mutation {case "version":frame[mutation]=2;case "boolean":frame["version"]=true;case "destination":frame[mutation]="hidden\u{202e}target";case "generation":frame[mutation]="wrong";case "arguments":frame[mutation]=["label":"unsafe\n"];default:frame[mutation]=true};do {_=try PermissionRequest(frame)}catch{rejected+=1}}
    try check(rejected==6,"malformed scope rejected")
    var rejectedPair=false
    do {_=try PermissionRequest(["event":"approval-request","version":1,"generation":generation,"requestId":UUID().uuidString,"companionId":companion,"sessionId":"wisp-test","callId":"call1","rootCallId":"call1","actionDigest":String(repeating:"a",count:64),"turn":1,"toolName":"wisp_compatible_check","source":"wisp-direct","revision":"1","arguments":["label":"verification"],"operation":"append-test-record","destination":"/isolated/ledger","fields":[["label":"Label","value":"verification"]]]); rejectedPair=false} catch {rejectedPair=true}
    try check(rejectedPair,"compatible tool with the wrong source is refused")
    let compatible=try PermissionRequest(["event":"approval-request","version":1,"generation":generation,"requestId":UUID().uuidString,"companionId":companion,"sessionId":"wisp-test","callId":"call1","rootCallId":"call1","actionDigest":String(repeating:"a",count:64),"turn":1,"toolName":"wisp_compatible_check","source":"wisp-compatible-plugin","revision":"1","arguments":["label":"verification"],"operation":"append-test-record","destination":"/isolated/ledger","fields":[["label":"Label","value":"verification"],["label":"Plugin note","value":"lab_1"]]] )
    try check(compatible.summary.contains("Compatible plugin check") && compatible.summary.contains("lab_1") && !compatible.summary.contains("Allow Always"), "compatible plugin still uses Allow Once")
    for _ in 0..<8 {try state.receive(PermissionRequest(request()))}
    do {try state.receive(PermissionRequest(request()));throw PermissionFailure.invalid}catch PermissionFailure.overflow {}
    state.invalidate();try check(state.requests.isEmpty&&state.deciding.isEmpty,"invalidate revokes all")
    do {try state.receive(r);throw PermissionFailure.invalid}catch PermissionFailure.stale {}
}

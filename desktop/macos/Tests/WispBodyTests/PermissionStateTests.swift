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
    state.invalidate();    try check(state.requests.isEmpty&&state.deciding.isEmpty,"invalidate revokes all")
    do {try state.receive(r);throw PermissionFailure.invalid}catch PermissionFailure.stale {}
    try check(PermissionChrome.decisionTitles==["Cancel Request","Deny","Allow Once"] && PermissionChrome.initialFocus=="Cancel Request", "cancel-first decisions; no Allow Always")
    let urlFrame:[String:Any]=["event":"approval-request","version":1,"generation":generation,"requestId":UUID().uuidString,"companionId":companion,"sessionId":"wisp-test","callId":"call-url","rootCallId":"call-url","actionDigest":String(repeating:"b",count:64),"turn":1,"toolName":"wisp_open_url","source":"wisp-safe-action","revision":"1","arguments":["url":"https://example.com/ok"],"operation":"open-http-url","destination":"https://example.com/ok","fields":[["label":"URL","value":"https://example.com/ok"]]]
    let urlRequest=try PermissionRequest(urlFrame)
    try check(urlRequest.summary.contains("https://example.com/ok") && urlRequest.summary.contains("Open URL") && !urlRequest.summary.contains("Allow Always") && urlRequest.summary.contains("spoken or typed yes is not a grant"), "url summary")
    for badDest in ["javascript:alert(1)","file:///etc/passwd"] {
        var bad=urlFrame; bad["destination"]=badDest; bad["arguments"]=["url":badDest]
        do {_=try PermissionRequest(bad); throw PermissionFailure.stale} catch PermissionFailure.invalid {}
    }
    var extra=urlFrame; extra["arguments"]=["url":"https://example.com/ok","application":"Safari"]
    do {_=try PermissionRequest(extra); throw PermissionFailure.stale} catch PermissionFailure.invalid {}
    let fileFrame:[String:Any]=["event":"approval-request","version":1,"generation":generation,"requestId":UUID().uuidString,"companionId":companion,"sessionId":"wisp-test","callId":"call-file","rootCallId":"call-file","actionDigest":String(repeating:"c",count:64),"turn":1,"toolName":"wisp_open_file","source":"wisp-safe-action","revision":"1","arguments":["path":"/tmp/note.txt"],"operation":"open-local-file-for-viewing","destination":"/etc/passwd","fields":[["label":"Path","value":"/etc/passwd"]]]
    do {_=try PermissionRequest(fileFrame); throw PermissionFailure.stale} catch PermissionFailure.invalid {}
    let timeFrame:[String:Any]=["event":"approval-request","version":1,"generation":generation,"requestId":UUID().uuidString,"companionId":companion,"sessionId":"wisp-test","callId":"call-time","rootCallId":"call-time","actionDigest":String(repeating:"d",count:64),"turn":1,"toolName":"wisp_tell_time","source":"wisp-safe-action","revision":"1","arguments":[:] as [String:String],"operation":"read-local-clock","destination":"local-system-clock","fields":[["label":"Clock","value":"Wisp will read this device’s local clock once."]]]
    let timeRequest=try PermissionRequest(timeFrame)
    try check(timeRequest.summary.contains("local clock") && !timeRequest.summary.contains("Allow Always"), "time summary names the clock")
    let skillFrame:[String:Any]=["event":"approval-request","version":1,"generation":generation,"requestId":UUID().uuidString,"companionId":companion,"sessionId":"wisp-test","callId":"call-skill","rootCallId":"call-skill","actionDigest":String(repeating:"f",count:64),"turn":1,"toolName":"skill","source":"wisp-skill","revision":"1","arguments":["name":"wisp-local-time-briefing"],"operation":"load-skill-instructions","destination":"wisp-local-time-briefing","fields":[["label":"Skill","value":"Local time briefing"],["label":"Name","value":"wisp-local-time-briefing"]]]
    let skillRequest=try PermissionRequest(skillFrame)
    try check(skillRequest.summary.contains("wisp-local-time-briefing") && skillRequest.summary.contains("Load skill instructions") && skillRequest.summary.contains("does not run other tools") && skillRequest.summary.contains("Enable is not Allow Once") && !skillRequest.summary.contains("Allow Always"), "skill request decode and copy")
    var badSkill=skillFrame; badSkill["arguments"]=["name":"meeting-prep-bundle"]
    do {_=try PermissionRequest(badSkill); throw PermissionFailure.stale} catch PermissionFailure.invalid {}
    var extraSkill=skillFrame; extraSkill["arguments"]=["name":"wisp-local-time-briefing","extra":"x"]
    do {_=try PermissionRequest(extraSkill); throw PermissionFailure.stale} catch PermissionFailure.invalid {}
    var wrongSkillSource=skillFrame; wrongSkillSource["source"]="wisp-direct"
    do {_=try PermissionRequest(wrongSkillSource); throw PermissionFailure.stale} catch PermissionFailure.invalid {}
    let axFocus:[String:Any]=["event":"approval-request","version":1,"generation":generation,"requestId":UUID().uuidString,"companionId":companion,"sessionId":"wisp-test","callId":"call-ax","rootCallId":"call-ax","actionDigest":String(repeating:"e",count:64),"turn":1,"toolName":"wisp_ax_focus_window","source":"wisp-ax","revision":"1","arguments":["title":"Wisp Accessibility Fixture"],"operation":"focus-fixture-window","destination":"ax-fixture-window","fields":[["label":"Window","value":"Wisp Accessibility Fixture"]]]
    let axRequest=try PermissionRequest(axFocus)
    try check(axRequest.summary.contains("Wisp Accessibility Fixture") && axRequest.summary.contains("Focus fixture") && axRequest.summary.contains("Granting Accessibility") && !axRequest.summary.contains("Allow Always"), "ax focus summary")
    var badTitle=axFocus; badTitle["arguments"]=["title":"Safari"]
    do {_=try PermissionRequest(badTitle); throw PermissionFailure.stale} catch PermissionFailure.invalid {}
    let axMove:[String:Any]=["event":"approval-request","version":1,"generation":generation,"requestId":UUID().uuidString,"companionId":companion,"sessionId":"wisp-test","callId":"call-move","rootCallId":"call-move","actionDigest":String(repeating:"e",count:64),"turn":1,"toolName":"wisp_ax_move_window","source":"wisp-ax","revision":"1","arguments":["title":"Wisp Accessibility Fixture","dx":"0","dy":"0"],"operation":"move-fixture-window","destination":"ax-fixture-window","fields":[["label":"Delta","value":"dx 0, dy 0"]]]
    do {_=try PermissionRequest(axMove); throw PermissionFailure.stale} catch PermissionFailure.invalid {}
    var extraAx=axFocus; extraAx["arguments"]=["title":"Wisp Accessibility Fixture","bundle":"com.apple.Safari"]
    do {_=try PermissionRequest(extraAx); throw PermissionFailure.stale} catch PermissionFailure.invalid {}
    var wrongAxSource=axFocus; wrongAxSource["source"]="wisp-safe-action"
    do {_=try PermissionRequest(wrongAxSource); throw PermissionFailure.stale} catch PermissionFailure.invalid {}
    let axClick:[String:Any]=["event":"approval-request","version":1,"generation":generation,"requestId":UUID().uuidString,"companionId":companion,"sessionId":"wisp-test","callId":"call-click","rootCallId":"call-click","actionDigest":String(repeating:"e",count:64),"turn":1,"toolName":"wisp_ax_click_named","source":"wisp-ax","revision":"1","arguments":["name":"Fixture Button"],"operation":"press-named-control","destination":"ax-fixture-control:Fixture Button","fields":[["label":"Control","value":"Fixture Button"]]]
    try check(try PermissionRequest(axClick).summary.contains("Press named control"), "ax click decode")
    let axRead:[String:Any]=["event":"approval-request","version":1,"generation":generation,"requestId":UUID().uuidString,"companionId":companion,"sessionId":"wisp-test","callId":"call-read","rootCallId":"call-read","actionDigest":String(repeating:"e",count:64),"turn":1,"toolName":"wisp_ax_read_focused","source":"wisp-ax","revision":"1","arguments":[:] as [String:String],"operation":"read-fixture-interface","destination":"ax-fixture-focused","fields":[["label":"Effect","value":"Read fixture focus"]]]
    try check(try PermissionRequest(axRead).destination=="ax-fixture-focused", "ax read decode")
    let axType:[String:Any]=["event":"approval-request","version":1,"generation":generation,"requestId":UUID().uuidString,"companionId":companion,"sessionId":"wisp-test","callId":"call-type","rootCallId":"call-type","actionDigest":String(repeating:"e",count:64),"turn":1,"toolName":"wisp_ax_type_named","source":"wisp-ax","revision":"1","arguments":["name":"Fixture Field","text":"hello"],"operation":"set-named-text","destination":"ax-fixture-field:Fixture Field","fields":[["label":"Text","value":"hello"]]]
    try check(try PermissionRequest(axType).summary.contains("Set named text"), "ax type decode")
    let axFind:[String:Any]=["event":"approval-request","version":1,"generation":generation,"requestId":UUID().uuidString,"companionId":companion,"sessionId":"wisp-test","callId":"call-find","rootCallId":"call-find","actionDigest":String(repeating:"e",count:64),"turn":1,"toolName":"wisp_ax_find_named","source":"wisp-ax","revision":"1","arguments":["name":"Fixture Marker"],"operation":"search-fixture-tree","destination":"ax-fixture-search:Fixture Marker","fields":[["label":"Name","value":"Fixture Marker"]]]
    try check(try PermissionRequest(axFind).destination=="ax-fixture-search:Fixture Marker", "ax find decode")
    let axMoveOk:[String:Any]=["event":"approval-request","version":1,"generation":generation,"requestId":UUID().uuidString,"companionId":companion,"sessionId":"wisp-test","callId":"call-move-ok","rootCallId":"call-move-ok","actionDigest":String(repeating:"e",count:64),"turn":1,"toolName":"wisp_ax_move_window","source":"wisp-ax","revision":"1","arguments":["title":"Wisp Accessibility Fixture","dx":"4","dy":"-2"],"operation":"move-fixture-window","destination":"ax-fixture-window","fields":[["label":"Delta","value":"dx 4, dy -2"]]]
    try check(try PermissionRequest(axMoveOk).summary.contains("Move fixture"), "ax move decode")
    var stateCancel=PermissionState(); stateCancel.attach(generation:generation,companionID:companion)
    let cancelable=try PermissionRequest(urlFrame)
    try stateCancel.receive(cancelable)
    let opener=RecordingWorkspaceOpener()
    let axDriver=RecordingAccessibilityDriver()
    _=stateCancel.decide(cancelable.requestID,action:"cancel")
    try check(opener.count==0, "confirm-cancel performs zero opener calls")
    try check(axDriver.count==0, "confirm-cancel performs zero AX-driver calls")
    let mcpFrame:[String:Any]=["event":"approval-request","version":1,"generation":generation,"requestId":UUID().uuidString,"companionId":companion,"sessionId":"wisp-test","callId":"call-mcp","rootCallId":"call-mcp","actionDigest":String(repeating:"e",count:64),"turn":1,"toolName":"mcp__wispdemo__record","source":"wisp-mcp","revision":"1","arguments":["label":"once"],"operation":"append-test-record","destination":"/owned/mcp-ledger","fields":[["label":"Public tool","value":"mcp__wispdemo__record"],["label":"Record label","value":"once"]]]
    let mcpRequest=try PermissionRequest(mcpFrame)
    try check(mcpRequest.summary.contains("mcp__wispdemo__record") && mcpRequest.summary.contains("Wisp MCP demonstration") && mcpRequest.summary.contains("Append one verification record") && mcpRequest.summary.contains("Saving a connection is not a grant") && mcpRequest.summary.contains("spoken or typed yes is not a grant") && !mcpRequest.summary.contains("Allow Always"), "MCP request decode and copy")
    var unknown=mcpFrame; unknown["toolName"]="mcp__wispdemo__delete"
    do {_=try PermissionRequest(unknown); throw PermissionFailure.stale} catch PermissionFailure.invalid {}
    var wrongSource=mcpFrame; wrongSource["source"]="wisp-direct"
    do {_=try PermissionRequest(wrongSource); throw PermissionFailure.stale} catch PermissionFailure.invalid {}
    var extraMcp=mcpFrame; extraMcp["arguments"]=["label":"once","extra":"x"]
    do {_=try PermissionRequest(extraMcp); throw PermissionFailure.stale} catch PermissionFailure.invalid {}
}

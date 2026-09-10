import Foundation
func engineBridgeTests() throws {
    var operations=BridgeOperationState();operations.attach("generation-a")
    func frame(_ event:String,_ op:String="permission-queue",_ id:String="one",_ generation:String="generation-a")->[String:Any] { ["event":event,"operation":op,"operationId":id,"generation":generation,"ok":true,"nonemptyText":true,"turn":1,"effects":0] }
    try check(operations.start(frame("testing")),"start current operation")
    try check(!operations.verifiedConnection(frame("connection-test")),"fixture cannot verify model")
    operations.invalidate()
    try check(!operations.finish(frame("tested")),"failure then trailing completion is stale")
    try check(!operations.verifiedConnection(frame("connection-test","test")),"failure then model response is stale")
    operations.attach("generation-b")
    try check(!operations.start(frame("testing","test")),"old generation cannot start operation")
    try check(operations.start(frame("testing","test","two","generation-b")),"new generation connection test")
    try check(!operations.verifiedConnection(frame("connection-test","test","other","generation-b")),"wrong operation cannot verify")
    try check(operations.verifiedConnection(frame("connection-test","test","two","generation-b")),"actual correlated connection result verifies")
    try check(operations.finish(frame("tested","test","two","generation-b")),"matching completion settles busy")
    try check(!operations.finish(frame("tested","test","two","generation-b")),"completion replay rejected")
    var parser=BridgeFrames()
    try check(try parser.append(Data("{\"event\":\"rea".utf8)).isEmpty,"fragment retained")
    try check(try parser.append(Data("dy\"}\n{\"event\":\"stopped\"}\n".utf8)).count == 2,"coalesced frames")
    var rejected=0
    for bytes in [Data("{\"event\":\"shell\"}\n".utf8),Data(repeating:32,count:16385)] {
        var p=BridgeFrames(); do { _=try p.append(bytes) } catch { rejected += 1 }
    }
    try check(rejected == 2,"unknown/oversized fail closed")
}

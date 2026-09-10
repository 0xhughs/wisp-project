import Foundation
import CoreFoundation

struct PermissionRequest {
    let requestID:String, generation:String, companionID:String, sessionID:String, callID:String, digest:String
    let tool:String, source:String, destination:String, fields:[String], turn:Int
    let wire:[String:Any]
    init(_ value:[String:Any]) throws {
        let keys:Set<String>=["event","version","generation","requestId","sessionId","callId","actionDigest","companionId","turn","rootCallId","toolName","source","revision","arguments","operation","destination","fields"]
        func text(_ key:String,_ limit:Int=100) throws -> String {
            guard let s=value[key] as? String,!s.isEmpty,s.count<=limit,!s.unicodeScalars.contains(where:{$0.value<32 || $0.value==127 || (0x202a...0x202e).contains($0.value) || (0x2066...0x2069).contains($0.value)}) else { throw PermissionFailure.invalid };return s
        }
        guard let version=value["version"] as? NSNumber,CFGetTypeID(version) != CFBooleanGetTypeID(),let turnValue=value["turn"] as? NSNumber,CFGetTypeID(turnValue) != CFBooleanGetTypeID(),turnValue.doubleValue == Double(turnValue.intValue),Set(value.keys)==keys,value["event"] as? String == "approval-request",value["version"] as? Int == 1,
              let turn=value["turn"] as? Int,turn>0, value["operation"] as? String == "append-test-record",value["revision"] as? String == "1",
              let args=value["arguments"] as? [String:String],Set(args.keys)==["label"],let label=args["label"],label.range(of:"^[A-Za-z0-9_-]{1,40}$",options:.regularExpression) != nil else { throw PermissionFailure.invalid }
        generation=try text("generation");requestID=try text("requestId");companionID=try text("companionId");sessionID=try text("sessionId");callID=try text("callId");digest=try text("actionDigest")
        guard UUID(uuidString:generation) != nil,UUID(uuidString:requestID) != nil,UUID(uuidString:companionID) != nil,digest.range(of:"^[a-f0-9]{64}$",options:.regularExpression) != nil,value["rootCallId"] as? String == callID else { throw PermissionFailure.invalid }
        tool=try text("toolName");source=try text("source");destination=try text("destination",2048);self.turn=turn
        guard ["wisp_permission_check","wisp_plugin_check"].contains(tool),source == (tool == "wisp_permission_check" ? "wisp-direct":"wisp-local-plugin"),let values=value["fields"] as? [[String:String]],values.count<=12 else {throw PermissionFailure.invalid}
        fields=try values.map { field in
            guard Set(field.keys)==["label","value"],let name=field["label"],let detail=field["value"],!name.isEmpty,name.count<=80,!detail.isEmpty,detail.count<=2048,!((name+detail).unicodeScalars.contains{$0.value<32 || $0.value==127 || (0x202a...0x202e).contains($0.value) || (0x2066...0x2069).contains($0.value)}) else {throw PermissionFailure.invalid}
            return name+": "+detail
        }
        // Native details always include the full actual argument, independently of presentation fields.
        wire=value
    }
    var summary:String { "Wisp is acting on your behalf.\n\nOperation: Append one verification record\nSource: \(source == "wisp-direct" ? "Wisp developer check":"Local verification plugin")\nDestination: \(destination)\n\n" + fields.joined(separator:"\n\n") + "\n\nActual record label: \((wire["arguments"] as? [String:String])?["label"] ?? "")\n\nThis decision applies to this one action only. No account permission or future consent is granted." }
    func decision(_ action:String)->[String:Any] { ["version":1,"generation":generation,"requestId":requestID,"sessionId":sessionID,"callId":callID,"actionDigest":digest,"decision":action] }
}
enum PermissionFailure:Error { case invalid,stale,overflow }
struct PermissionState {
    private(set) var generation="",companionID="",requests=[PermissionRequest](),deciding=Set<String>()
    private(set) var status="No pending permission requests."
    private var seen=Set<String>()
    func displayStatus(for requestID:String) -> String {
        guard requests.contains(where:{$0.requestID==requestID}) else {return status}
        return deciding.contains(requestID) ? "Sending your decision…" : "Waiting for your decision."
    }
    mutating func attach(generation:String,companionID:String) { invalidate();self.generation=generation;self.companionID=companionID }
    mutating func invalidate() { requests=[];deciding=[];seen=[];generation="";companionID="";status="No pending permission requests." }
    mutating func receive(_ request:PermissionRequest) throws {
        guard request.generation==generation,request.companionID==companionID,!seen.contains(request.requestID) else {throw PermissionFailure.stale}
        guard requests.count<8,seen.count<256 else {throw PermissionFailure.overflow}
        seen.insert(request.requestID);requests.append(request);status="Waiting for your decision."
    }
    mutating func decide(_ id:String,action:String)->[String:Any]? {
        guard ["allow-once","deny","cancel"].contains(action),!deciding.contains(id),let request=requests.first(where:{$0.requestID==id}) else {return nil}
        if action=="cancel" {deciding.formUnion(requests.map(\.requestID))} else {deciding.insert(id)};status="Sending your decision…";return request.decision(action)
    }
    // The SDK cancels the owned operation, including all queued requests.
    // Mark the whole batch before sending so another close/Cancel cannot replay it.
    mutating func cancelAll()->[String:Any]? {
        guard let request=requests.first(where:{!deciding.contains($0.requestID)}) else {return nil}
        return decide(request.requestID,action:"cancel")
    }
    mutating func closed(_ value:[String:Any]) throws {
        guard Set(value.keys)==["event","version","generation","requestId","sessionId","callId","actionDigest","outcome"],value["version"] as? Int == 1,value["generation"] as? String == generation,let id=value["requestId"] as? String,let r=requests.first(where:{$0.requestID==id}),value["sessionId"] as? String == r.sessionID,value["callId"] as? String == r.callID,value["actionDigest"] as? String == r.digest,let outcome=value["outcome"] as? String,["allowed-once","rejected","cancelled","unavailable"].contains(outcome) else {throw PermissionFailure.stale}
        requests.removeAll{$0.requestID==id};deciding.remove(id)
        status=outcome=="allowed-once" ? "Allowed once. Execution may proceed; completion is separate." : outcome=="rejected" ? "Denied. The action was not allowed." : outcome=="cancelled" ? "Request cancelled." : "Request expired or became unavailable."
    }
}

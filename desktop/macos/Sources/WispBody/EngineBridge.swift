import CoreFoundation
func validateVoiceEvent(_ object:[String:Any])throws {
    let event=object["event"] as? String ?? ""
    let base:Set<String>=["event","generation","companionId","utteranceId"]
    let extra:Set<String>
    switch event{case "voice-processing":extra=[];case "voice-result":extra=["text","messageId","turn"];case "voice-settled":extra=["cancelled","messageId","turn"];case "voice-failed":extra=["category"];default:throw NSError(domain:"voice-event",code:1)}
    guard Set(object.keys)==base.union(extra),["generation","companionId","utteranceId"].allSatisfy({(object[$0] as? String).flatMap(UUID.init(uuidString:)) != nil}) else{throw NSError(domain:"voice-event",code:1)}
    if extra.contains("messageId"){guard let id=object["messageId"] as? String,UUID(uuidString:id) != nil,let turn=object["turn"] as? NSNumber,CFGetTypeID(turn) != CFBooleanGetTypeID(),turn.doubleValue>0,turn.doubleValue.rounded()==turn.doubleValue else{throw NSError(domain:"voice-receipt",code:1)}}
    if event=="voice-result"{guard let text=object["text"] as? String,VoiceState.validText(text)else{throw NSError(domain:"voice-text",code:1)}}
    if event=="voice-settled"{guard let value=object["cancelled"] as? NSNumber,CFGetTypeID(value)==CFBooleanGetTypeID()else{throw NSError(domain:"voice-settled",code:1)}}
    if event=="voice-failed" && object["category"] as? String != "reasoning-unavailable"{throw NSError(domain:"voice-failure",code:1)}
}
import Foundation
struct BridgeFrames {
    private var buffer=Data()
    mutating func append(_ data:Data) throws -> [[String:Any]] {
        buffer.append(data)
        guard buffer.count <= 16384 else { throw NSError(domain:"frame-size",code:1) }
        var frames=[[String:Any]]()
        while let newline=buffer.firstIndex(of:10) {
            let line=buffer.prefix(upTo:newline); buffer.removeSubrange(...newline)
            guard let object=try JSONSerialization.jsonObject(with:line) as? [String:Any],let event=object["event"] as? String,["owned","ready","smoke","recall","stopped","unavailable","connection-test","testing","tested","approval-request","approval-closed","permission-test","voice-processing","voice-result","voice-settled","voice-failed","open-request","ax-request"].contains(event) else { throw NSError(domain:"frame",code:1) }
            if event.hasPrefix("voice-"){try validateVoiceEvent(object)}
            frames.append(object)
        }
        return frames
    }
}
// A fixture completion is never evidence that a model answered a connection test.
struct BridgeOperationState {
    private var generation="",operation="",operationID=""
    mutating func attach(_ generation:String) {invalidate();self.generation=generation}
    mutating func invalidate() {generation="";operation="";operationID=""}
    mutating func start(_ event:[String:Any])->Bool {
        guard !generation.isEmpty,operationID.isEmpty,event["generation"] as? String==generation,
              event["event"] as? String=="testing",let op=event["operation"] as? String,
              ["test","smoke","recall","permission-direct","permission-plugin","permission-pair","permission-queue"].contains(op),
              let id=event["operationId"] as? String,!id.isEmpty,id.count<=100 else {return false}
        operation=op;operationID=id;return true
    }
    private func matches(_ event:[String:Any])->Bool {
        !operationID.isEmpty && event["generation"] as? String==generation && event["operation"] as? String==operation && event["operationId"] as? String==operationID
    }
    func verifiedConnection(_ event:[String:Any])->Bool {
        matches(event) && operation=="test" && event["event"] as? String=="connection-test" && event["nonemptyText"] as? Bool==true && (event["turn"] as? Int ?? 0)>0 && event["effects"] as? Int==0
    }
    mutating func finish(_ event:[String:Any])->Bool {
        guard matches(event),event["event"] as? String=="tested",event["ok"] as? Bool==true else {return false}
        operation="";operationID="";return true
    }
}
final class EngineBridge {
    private let process=Process(), input=Pipe(), output=Pipe(), errors=Pipe()
    private var frames=BridgeFrames()
    private var stopping=false
    private(set) var started=false
    var onEvent:(([String:Any])->Void)?
    var onExit:((Int32)->Void)?
    var pid:Int32 { process.processIdentifier }
    func start(node:String,script:String,arguments:[String], bootstrap:[String:Any]) throws {
        guard !started else { throw NSError(domain:"bridge-already-started",code:1) }
        started=true
        process.executableURL=URL(fileURLWithPath:node); process.arguments=[script]+arguments
        process.environment=["PATH":"/usr/bin:/bin:/usr/sbin:/sbin"]
        process.standardInput=input; process.standardOutput=output; process.standardError=errors
        output.fileHandleForReading.readabilityHandler={ [weak self] handle in
            let data=handle.availableData
            if data.isEmpty { handle.readabilityHandler=nil; return }
            DispatchQueue.main.async {
                guard let self else { return }
                do { for frame in try self.frames.append(data) { self.onEvent?(frame) } }
                catch { self.onEvent?(["event":"unavailable","category":"bridge-protocol"]); self.stop() }
            }
        }
        // Consume stderr without retaining arbitrary engine diagnostics in product memory/logs.
        errors.fileHandleForReading.readabilityHandler={ handle in if handle.availableData.isEmpty { handle.readabilityHandler=nil } }
        process.terminationHandler={ [weak self] process in DispatchQueue.main.async { self?.onExit?(process.terminationStatus) } }
        do { try process.run(); send(bootstrap) } catch { output.fileHandleForReading.readabilityHandler=nil; errors.fileHandleForReading.readabilityHandler=nil; throw error }
    }
    func voice(_ object:[String:Any]) -> Bool {
        guard started,!stopping,process.isRunning,let data=try? JSONSerialization.data(withJSONObject:object),data.count<=12000 else{return false}
        do{try input.fileHandleForWriting.write(contentsOf:data+Data([10]));return true}catch{return false}
    }
    func permissionFixture(_ operation:String) { guard started,!stopping,process.isRunning else { return }; guard ["permission-direct","permission-plugin","permission-pair","permission-queue"].contains(operation)else{return};send(["op":operation]) }
    func decidePermission(_ decision:[String:Any]) { guard started,!stopping,process.isRunning else { return }; send(["op":"approval","decision":decision]) }
    func completeOpen(_ completion:[String:Any]) { guard started,!stopping,process.isRunning else { return }; send(["op":"open-complete","completion":completion]) }
    func completeAx(_ completion:[String:Any]) { guard started,!stopping,process.isRunning else { return }; send(["op":"ax-complete","completion":completion]) }
    func testConnection() { guard started,!stopping,process.isRunning else { return }; send(["op":"test"]) }
    func recall() { guard started,!stopping,process.isRunning else { return }; send(["op":"recall"]) }
    func smoke() { guard started,!stopping,process.isRunning else { return }; send(["op":"smoke"]) }
    private func send(_ object:[String:Any]) { if let data=try? JSONSerialization.data(withJSONObject:object) { try? input.fileHandleForWriting.write(contentsOf:data+Data([10])) } }
    func stop() { guard !stopping else { return }; stopping=true; try? input.fileHandleForWriting.close() }
    func terminateBridge() { if process.isRunning { process.terminate() } }
    deinit { stop(); output.fileHandleForReading.readabilityHandler=nil; errors.fileHandleForReading.readabilityHandler=nil }
}

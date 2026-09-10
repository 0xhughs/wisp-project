import Foundation
final class VoiceController {
    private(set) var state=VoiceState()
    var configuration=VoiceConfiguration()
    var diagnostic:((String,RecognitionDiagnostic)->Void)?
    var changed:(()->Void)?
    var send:(([String:Any])->Bool)?
    var localAvailable:(String)->Bool=SystemRecognition.supported
    var ready:(()->Bool)?
    var readinessIssue:(()->String)?
    var closeOwnedApprovals:(()->Void)?
    private(set) var status="Activate Wake or the shortcut to speak. Audio stays on this Mac."
    private(set) var generation="",companion=""
    private let recognition:VoiceRecognition,synthesis:VoiceSynthesis
    private var captureOwned=false,reasoningOwned=false,speechOwned=false
    private var pendingReply:String?,releaseTimer:DispatchWorkItem?
    private var blocked=false
    init(recognition:VoiceRecognition=SystemRecognition(),synthesis:VoiceSynthesis=SystemSynthesis()){self.recognition=recognition;self.synthesis=synthesis}
    var available:Bool {!blocked && recognition.availability==nil && localAvailable(configuration.locale) && ready?()==true && !generation.isEmpty}
    func note(_ message:String){status=message;changed?()}
    func attach(generation:String,companion:String){self.generation=generation;self.companion=companion;changed?()}
    func configure(_ value:VoiceConfiguration){configuration=value;state.setMuted(value.muted);if state.phase == .releasing{closeOwnedApprovals?();releaseResources()};changed?()}
    func activate(){
        let previous=state.phase
        guard let id=state.activate(ready:available)else{if !state.muted && !available{status=recognition.availability ?? (!localAvailable(configuration.locale) ? "On-device recognition is unavailable for \(configuration.locale). Select an available recognition language; no cloud recognition fallback is used.":readinessIssue?() ?? "Attach a supported reasoning provider in Models before speaking.")};changed?();return}
        switch state.phase {
        case .listening:
            captureOwned=true;status="Waiting for Wisp microphone and speech permissions, then listening."
            recognition.start(locale:configuration.locale,id:id){[weak self] id,event in self?.recognitionEvent(id,event)}
        case .finalizing:
            if previous == .listening{status="Finishing this utterance…";recognition.finish()}
        case .releasing:closeOwnedApprovals?();releaseResources()
        default:break
        }
        changed?()
    }
    func cancel(){state.cancel();closeOwnedApprovals?();releaseResources();changed?()}
    private func frame(_ op:String,_ id:String)->[String:Any]{["op":op,"generation":generation,"companionId":companion,"utteranceId":id]}
    private func recognitionEvent(_ id:String,_ event:RecognitionEvent){
        guard state.operationID==id else{return}
        switch event {
        case .diagnostic(let value):diagnostic?(id,value)
        case .finalizing:state.finishing(id:id);status="Finishing this utterance…"
        case .capturing:status="Listening. Activate again to finish; Mute cancels."
        case .released:captureOwned=false;completeRelease(id)
        case .final(let text):
            guard state.recognized(text,id:id)else{return}
            var message=frame("voice",id);message["text"]=text
            guard send?(message)==true else{fail("The voice request could not be sent. Apply the selected model before retrying.");return}
            reasoningOwned=true;status="Wisp is thinking. Activate again to cancel."
        case .failed(let message):captureOwned=false;fail(message)
        }
        changed?()
    }
    func receive(_ event:[String:Any]) {
        guard event["generation"] as? String==generation,event["companionId"] as? String==companion,let id=event["utteranceId"] as? String,state.operationID==id else{return}
        switch event["event"] as? String {
        case "voice-result":
            guard state.phase == .processing,let text=event["text"] as? String,VoiceState.validText(text),pendingReply==nil else{return};pendingReply=text
        case "voice-settled":
            reasoningOwned=false
            if state.phase == .releasing{completeRelease(id)}
            else if event["cancelled"] as? Bool==true{pendingReply=nil;state.released(id:id);status="Request cancelled. Activate to speak again."}
            else if let text=pendingReply,state.answer(id:id){
                pendingReply=nil;speechOwned=true;status="Preparing the spoken reply…"
                do{try synthesis.speak(text,id:id,configuration:configuration){[weak self] id,event in self?.speechEvent(id,event)}}catch{speechOwned=false;fail("The selected speech voice is unavailable. Choose an installed voice before retrying.")}
            }else{fail("No committed spoken reply was available. Activate to try a new request.")}
        case "voice-failed":status="Reasoning failed. Waiting for its process to stop…";state.cancel();releaseResources()
        default:break
        }
        changed?()
    }
    private func speechEvent(_ id:String,_ event:SpeechEvent){
        guard state.operationID==id else{return}
        switch event {
        case .started:if state.speechStarted(id:id){status="Speaking. Activate again to stop."}
        case .finished,.cancelled:speechOwned=false;state.released(id:id);status=state.muted ? "Voice is muted.":"Ready for another explicit activation."
        }
        changed?()
    }
    func approval(pending:Bool){guard let id=state.operationID else{return};state.approval(id:id,pending:pending);if pending{pendingReply=nil;synthesis.cancel();status="Waiting for the native action decision."};changed?()}
    private func releaseResources(){
        guard let id=state.operationID else{return};pendingReply=nil;status="Stopping and releasing this voice operation…"
        if captureOwned{recognition.cancel()};if speechOwned{synthesis.cancel()}
        if reasoningOwned,send?(frame("voice-cancel",id)) != true{status="Waiting for the reasoning process to stop."}
        completeRelease(id)
        if state.operationID==id{
            releaseTimer?.cancel();let task=DispatchWorkItem{[weak self] in guard let self,self.state.operationID==id else{return};self.blocked=true;self.fail("Release could not be confirmed. Quit Wisp before starting voice again.")};releaseTimer=task;DispatchQueue.main.asyncAfter(deadline:.now()+12,execute:task)
        }
    }
    private func completeRelease(_ id:String){if state.phase == .releasing && !captureOwned && !speechOwned && !reasoningOwned{releaseTimer?.cancel();releaseTimer=nil;state.released(id:id);status=state.muted ? "Voice is muted.":"Cancelled. Activate to speak again."}}
    func engineStopped(){generation="";reasoningOwned=false;if let id=state.operationID{state.cancel();releaseResources();completeRelease(id)};changed?()}
    private func fail(_ message:String){pendingReply=nil;status=message;state.fail();changed?()}
}

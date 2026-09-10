import Foundation
final class RecognitionDouble:VoiceRecognition {
    var availability:String?
    var events=[String:(String,RecognitionEvent)->Void]()
    var current:String?,captures=0
    func start(locale:String,id:String,event:@escaping(String,RecognitionEvent)->Void){current=id;events[id]=event;captures+=1;event(id,.capturing)}
    func finish(){}
    func cancel(){}
    func deliver(_ id:String,_ event:RecognitionEvent){events[id]?(id,event)}
}
final class SynthesisDouble:VoiceSynthesis {
    var events=[String:(String,SpeechEvent)->Void](),spoken=[String](),stops=0
    func speak(_ text:String,id:String,configuration:VoiceConfiguration,event:@escaping(String,SpeechEvent)->Void)throws{spoken.append(text);events[id]=event}
    func cancel(){stops+=1}
    func deliver(_ id:String,_ event:SpeechEvent){events[id]?(id,event)}
}
func voiceControllerTests()throws {
    let mic=RecognitionDouble(),speaker=SynthesisDouble(),v=VoiceController(recognition:mic,synthesis:speaker)
    var frames=[[String:Any]]();v.send={frames.append($0);return true};v.ready={true};v.localAvailable={_ in true}
    v.attach(generation:"generation",companion:"companion")
    func e(_ name:String,_ id:String,_ extra:[String:Any]=[:])->[String:Any]{["event":name,"utteranceId":id,"generation":"generation","companionId":"companion"].merging(extra){_,b in b}}
    v.activate();let first=v.state.operationID!;v.cancel()
    mic.deliver(first,.final("cancelled final"))
    try check(frames.isEmpty && v.state.phase == .releasing,"cancel before final produces zero turn")
    mic.deliver(first,.released);v.activate();let second=v.state.operationID!
    mic.deliver(first,.final("late first"));mic.deliver(second,.released);mic.deliver(second,.final("Hello"));mic.deliver(second,.final("duplicate"))
    try check(frames.count==1 && frames[0]["text"] as? String=="Hello","one unchanged recognized submission")
    v.receive(e("voice-result",second,["text":"Answer"]))
    try check(speaker.spoken.isEmpty,"no speech before reasoning settles")
    v.cancel();v.receive(e("voice-settled",second,["cancelled":false]))
    try check(speaker.spoken.isEmpty && v.state.phase == .idle,"completion racing cancel discards answer")
    v.activate();let third=v.state.operationID!;mic.deliver(third,.released);mic.deliver(third,.final("Again"))
    v.receive(e("voice-result",third,["text":"Safe reply"]));v.receive(e("voice-settled",third,["cancelled":false]))
    try check(speaker.spoken==["Safe reply"] && v.state.phase == .processing,"synthesis invocation is not speaking proof")
    speaker.deliver(third,.started);try check(v.state.phase == .speaking,"actual callback speaking")
    var config=v.configuration;config.muted=true;v.configure(config)
    try check(v.state.phase == .releasing,"mute waits for actual speech release")
    speaker.deliver(third,.cancelled);v.activate();try check(v.state.phase == .muted && mic.captures==3,"mute forbids capture")
    config.muted=false;v.configure(config);try check(mic.captures==3,"unmute never captures")
    speaker.deliver(third,.started);try check(v.state.phase == .idle,"old synthesis callbacks ignored")
    v.localAvailable={_ in false};v.activate();try check(mic.captures==3 && v.state.phase == .unavailable,"unsupported locale never captures")
    v.localAvailable={_ in true};mic.availability="Permission denied";v.activate();try check(mic.captures==3,"denied provider never captures")
    mic.availability=nil;v.activate();let fourth=v.state.operationID!;mic.deliver(fourth,.failed("No speech"));try check(v.state.phase == .unavailable && frames.filter{$0["op"] as? String=="voice"}.count==2,"no-speech finalization produces no turn")
    v.activate();let fifth=v.state.operationID!;mic.deliver(fifth,.released);mic.deliver(fifth,.final("Approval request"));v.approval(pending:true)
    v.receive(e("voice-result",fifth,["text":"Not an approved answer"]))
    try check(speaker.spoken.count==1 && v.state.phase == .approval,"pending native approval cannot admit speech")
    v.cancel();v.engineStopped();try check(v.state.phase == .idle,"scoped process exit settles cancelled reasoning")
    v.attach(generation:"new-generation",companion:"companion");v.receive(e("voice-result",fifth,["text":"old engine"]));try check(speaker.spoken.count==1,"old generation never speaks")
}

// Exercise the same activation path as the global shortcut after actual didStart.
func voiceActivationStopTests()throws {
    let mic=RecognitionDouble(),speaker=SynthesisDouble(),v=VoiceController(recognition:mic,synthesis:speaker)
    v.send={_ in true};v.ready={true};v.localAvailable={_ in true};v.attach(generation:"g",companion:"c")
    v.activate();let id=v.state.operationID!
    mic.deliver(id,.released);mic.deliver(id,.final("Count slowly"))
    v.receive(["event":"voice-result","generation":"g","companionId":"c","utteranceId":id,"text":"One, two, three"])
    v.receive(["event":"voice-settled","generation":"g","companionId":"c","utteranceId":id,"cancelled":false])
    speaker.deliver(id,.started);v.activate()
    try check(speaker.stops==1 && v.state.phase == .releasing && mic.captures==1,"activation during speech calls stop and retains ownership")
    v.activate();try check(speaker.stops==1 && mic.captures==1,"repeated activation while releasing starts nothing")
    speaker.deliver(id,.cancelled);speaker.deliver(id,.started)
    try check(v.state.phase == .idle && speaker.spoken.count==1,"cancel acknowledgement releases without stale speech replay")
}

func voiceProviderAdmissionTests()throws {
    for selected in ["local","deepseek","unknown"] {
        let mic=RecognitionDouble(),speaker=SynthesisDouble(),v=VoiceController(recognition:mic,synthesis:speaker)
        var frames=[[String:Any]]();v.send={frames.append($0);return true};v.localAvailable={_ in true};v.ready={VoiceReasoningRoute(selected:selected).supported}
        v.attach(generation:"owned",companion:"companion");v.activate()
        if selected=="unknown"{try check(mic.captures==0 && frames.isEmpty,"unknown provider cannot capture or submit");continue}
        let id=v.state.operationID!;mic.deliver(id,.released);mic.deliver(id,.final("Recognized phrase"))
        try check(mic.captures==1 && frames.count==1,"attached supported provider admits exactly one recognized request")
        v.receive(["event":"voice-result","generation":"stale","companionId":"companion","utteranceId":id,"text":"stale reply"])
        v.cancel();v.receive(["event":"voice-settled","generation":"owned","companionId":"companion","utteranceId":id,"cancelled":true])
        try check(speaker.spoken.isEmpty && v.state.phase == .idle,"both providers preserve cancellation and stale reply rejection")
    }
}

// Mac-native-only Foundation VoiceController. Linux-supplemental: desktop/tests/voice-seams.test.mjs
func voiceProcessingCancelSettleTests()throws {
    let mic=RecognitionDouble(),speaker=SynthesisDouble(),v=VoiceController(recognition:mic,synthesis:speaker)
    var frames=[[String:Any]]();v.send={frames.append($0);return true};v.ready={true};v.localAvailable={_ in true}
    v.attach(generation:"generation",companion:"companion")
    v.activate();let id=v.state.operationID!
    mic.deliver(id,.released);mic.deliver(id,.final("Think about this"))
    try check(v.state.phase == .processing,"recognized turn is processing")
    v.activate()
    try check(v.state.phase == .releasing && v.state.operationID==id,"cancel during processing waits for settle")
    try check(frames.contains(where:{$0["op"] as? String=="voice-cancel" && $0["utteranceId"] as? String==id}),"owned voice-cancel sent")
    try check(mic.captures==1,"releasing refuses a new capture")
    let lowered=v.status.lowercased()
    try check(!lowered.contains("rollback") && !lowered.contains("rolled back"),"cancel does not claim rollback")
    v.receive(["event":"voice-result","generation":"generation","companionId":"companion","utteranceId":id,"text":"Committed answer"])
    try check(speaker.spoken.isEmpty && v.state.phase == .releasing,"committed text cannot speak while releasing")
    v.receive(["event":"voice-settled","generation":"generation","companionId":"companion","utteranceId":id,"cancelled":false])
    try check(v.state.phase == .idle && speaker.spoken.isEmpty,"settle returns idle without speaking or claiming rollback")
    mic.deliver(id,.final("stale after cancel"));speaker.deliver(id,.started)
    try check(v.state.phase == .idle && speaker.spoken.isEmpty,"stale callbacks cannot revive the cancelled turn")
}

func voiceRegistrationUnavailableWakeTests()throws {
    let mic=RecognitionDouble(),speaker=SynthesisDouble(),voice=VoiceController(recognition:mic,synthesis:speaker)
    voice.send={_ in true};voice.ready={true};voice.localAvailable={_ in true}
    voice.attach(generation:"generation",companion:"companion")
    let session=VoiceLifecycle(voice:voice)
    session.shortcutRegistered=false
    try check(VoiceActivation.wakeAllowed(shortcutRegistered:false),"Wake does not require Carbon registration")
    try check(VoiceActivation.shortcutStatus(registered:false).contains("unavailable (conflict); use Wake"),"conflict leaves Wake as the usable control")
    session.wake()
    try check(mic.captures==1 && voice.state.phase == .listening,"Wake activates the same state machine when the shortcut is unavailable")
}

func voiceLifecycleAnalogueTests()throws {
    let generation=UUID().uuidString, companion=UUID().uuidString, requestID=UUID().uuidString
    func request()->[String:Any] { ["event":"approval-request","version":1,"generation":generation,"requestId":requestID,"companionId":companion,"sessionId":"wisp-test","callId":"call1","rootCallId":"call1","actionDigest":String(repeating:"a",count:64),"turn":1,"toolName":"wisp_permission_check","source":"wisp-direct","revision":"1","arguments":["label":"verification"],"operation":"append-test-record","destination":"/isolated/ledger","fields":[["label":"Label","value":"verification"]]] }
    let mic=RecognitionDouble(),speaker=SynthesisDouble(),voice=VoiceController(recognition:mic,synthesis:speaker)
    let session=VoiceLifecycle(voice:voice)
    voice.send={_ in true};voice.ready={true};voice.localAvailable={_ in true}
    voice.attach(generation:generation,companion:companion)
    session.permissions.attach(generation:generation,companionID:companion)
    voice.activate();let id=voice.state.operationID!
    mic.deliver(id,.released);mic.deliver(id,.final("Append one verification record"))
    try session.permissions.receive(try PermissionRequest(request()))
    voice.approval(pending:true)
    try check(voice.state.phase == .approval,"pending native approval")
    voice.receive(["event":"voice-result","generation":generation,"companionId":companion,"utteranceId":id,"text":"Not an approved answer"])
    try check(speaker.spoken.isEmpty && voice.state.phase == .approval,"pending approval suppresses speech")
    session.wake()
    try check(voice.state.phase == .releasing,"activation during approval cancels")
    try check(session.permissions.decide(requestID,action:"allow-once")==nil,"user cancel closes the owned grant")
    session.apply()
    try check(session.permissions.decide(requestID,action:"allow-once")==nil,"Apply cannot revive a grant")
    voice.receive(["event":"voice-result","generation":generation,"companionId":companion,"utteranceId":id,"text":"Reply after Apply"])
    voice.receive(["event":"voice-settled","generation":generation,"companionId":companion,"utteranceId":id,"cancelled":false])
    try check(speaker.spoken.isEmpty,"Apply cannot revive a reply")
    session.engineStopped()
    voice.receive(["event":"voice-result","generation":generation,"companionId":companion,"utteranceId":id,"text":"Reply after engine stop"])
    try check(speaker.spoken.isEmpty && session.permissions.decide(requestID,action:"allow-once")==nil,"engineStopped cannot revive grant or reply")

    let quitMic=RecognitionDouble(),quitSpeaker=SynthesisDouble(),quitVoice=VoiceController(recognition:quitMic,synthesis:quitSpeaker)
    let quitSession=VoiceLifecycle(voice:quitVoice)
    quitVoice.send={_ in true};quitVoice.ready={true};quitVoice.localAvailable={_ in true}
    quitVoice.attach(generation:generation,companion:companion)
    quitSession.permissions.attach(generation:generation,companionID:companion)
    quitVoice.activate();let quitId=quitVoice.state.operationID!
    quitMic.deliver(quitId,.released);quitMic.deliver(quitId,.final("Quit while waiting"))
    try quitSession.permissions.receive(try PermissionRequest(request()))
    quitVoice.approval(pending:true)
    quitSession.quit()
    try check(quitSession.permissions.decide(requestID,action:"allow-once")==nil,"Quit cannot revive a grant")
    quitVoice.receive(["event":"voice-result","generation":generation,"companionId":companion,"utteranceId":quitId,"text":"Reply after Quit"])
    try check(quitSpeaker.spoken.isEmpty && quitVoice.generation.isEmpty,"Quit cannot revive a reply")

    let homeMic=RecognitionDouble(),homeSpeaker=SynthesisDouble(),homeVoice=VoiceController(recognition:homeMic,synthesis:homeSpeaker)
    let homeSession=VoiceLifecycle(voice:homeVoice)
    homeVoice.send={_ in true};homeVoice.ready={true};homeVoice.localAvailable={_ in true}
    homeVoice.attach(generation:generation,companion:companion)
    homeSession.permissions.attach(generation:generation,companionID:companion)
    homeVoice.activate();let homeId=homeVoice.state.operationID!
    homeMic.deliver(homeId,.released);homeMic.deliver(homeId,.final("Home invalidated"))
    try homeSession.permissions.receive(try PermissionRequest(request()))
    homeVoice.approval(pending:true)
    homeSession.homeInvalidation()
    try check(homeSession.permissions.decide(requestID,action:"deny")==nil,"home invalidation cannot revive a grant")
    homeVoice.receive(["event":"voice-result","generation":generation,"companionId":companion,"utteranceId":homeId,"text":"Reply after home invalidation"])
    try check(homeSpeaker.spoken.isEmpty,"home invalidation cannot revive a reply")
}

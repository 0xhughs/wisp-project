import Foundation
func voiceStateTests() throws {
    var voice = VoiceState()
    let first = try unwrapVoice(voice.activate(ready:true))
    try check(voice.phase == .listening,"explicit activation listens")
    try check(voice.activate(ready:true, repeatKey:true) == nil && voice.phase == .listening,"repeat ignored")
    try check(voice.activate(ready:true) == first && voice.phase == .finalizing,"toggle finalizes same capture")
    try check(!voice.recognized("   ",id:first),"empty never submits")
    try check(voice.recognized("Hello",id:first) && voice.phase == .processing,"one final accepted")
    try check(!voice.recognized("duplicate",id:first),"duplicate final ignored")
    voice.cancel()
    try check(voice.phase == .releasing && voice.activate(ready:true) == nil,"cancel waits for release")
    voice.released(id:first)
    let second = try unwrapVoice(voice.activate(ready:true))
    try check(second != first && !voice.recognized("stale",id:first),"old final cannot submit")
    voice.setMuted(true)
    try check(voice.phase == .releasing && voice.muted,"mute invalidates active capture")
    voice.released(id:second)
    try check(voice.phase == .muted && voice.activate(ready:true) == nil,"muted activation denied")
    voice.setMuted(false)
    try check(voice.phase == .idle,"unmute does not capture")
    let third = try unwrapVoice(voice.activate(ready:true)); _ = voice.activate(ready:true)
    try check(!voice.recognized(String(repeating:"é",count:4001),id:third),"unicode bound")
    try check(voice.recognized("Hello",id:third),"valid final")
    try check(voice.answer(id:third) && voice.phase == .processing,"answer waits for actual speech start")
    try check(voice.speechStarted(id:third) && voice.phase == .speaking,"callback drives speaking")
    voice.released(id:first)
    try check(voice.phase == .speaking,"old release cannot finish current speech")
    voice.cancel(); voice.released(id:third)
    try check(voice.phase == .idle,"speech cancellation settles")
}
private func unwrapVoice(_ value:String?) throws -> String {guard let value else {throw NSError(domain:"missing voice operation",code:1)}; return value}
func voiceFrameTests()throws {
    let id="aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa"
    let result:[String:Any]=["event":"voice-result","generation":id,"companionId":id,"utteranceId":id,"messageId":id,"turn":1,"text":"Hello"]
    try validateVoiceEvent(result)
    for extra:[String:Any] in [["sessionId":"foreign"],["turn":true],["text":""],["messageId":"not-an-id"]]{do{try validateVoiceEvent(result.merging(extra){_,b in b});throw NSError(domain:"accepted malformed voice response",code:2)}catch let error as NSError{try check(error.code != 2,"malformed voice response rejected")}}
}
func speechPlaybackTests()throws {
    var playback=SpeechPlaybackState()
    try check(playback.begin("first"),"own scheduled synthesis")
    playback.cancel()
    try check(!playback.begin("second"),"false stop cannot release scheduled speech")
    try check(playback.started("first") == .stop,"late start after mute must stop rather than present")
    try check(!playback.released("old"),"foreign release ignored")
    try check(playback.released("first") && playback.begin("second"),"real callback enables next speech")
    try check(playback.started("first") == .ignore && playback.started("second") == .present,"generation-safe synthesis start")
}

func recognitionDiagnosticTests()throws {
    let disabled=RecognitionDiagnostic(success:false,finalText:nil,captureMilliseconds:4,errorDomain:"kLSRErrorDomain",errorCode:201)
    try check(disabled.failureMessage.contains("Dictation is disabled") && disabled.failureMessage.contains("No request was sent") && !disabled.failureMessage.contains("No usable speech"),"service disabled is not misreported as user silence")
    let assets=RecognitionDiagnostic(success:false,finalText:nil,captureMilliseconds:0,errorDomain:"kLSRErrorDomain",errorCode:102)
    try check(assets.failureMessage.contains("assets are not installed"),"missing assets are a distinct resource boundary")
    let observation=CaptureInputObservation()
    observation.record(frames:1024,readable:true,nonzero:false);observation.record(frames:512,readable:true,nonzero:true)
    try check(observation.snapshot()==CaptureInputFacts(buffers:2,frames:1536,readableSamples:true,nonzeroSamples:true),"only bounded input aggregate retained")
    try check(CaptureInputObservation().snapshot()==CaptureInputFacts(),"next operation starts with empty audio aggregates")
    let value=RecognitionDiagnostic(success:false,finalText:"private phrase",captureMilliseconds:42,errorDomain:"kAFAssistantErrorDomain",errorCode:1101)
    let bytes=try JSONSerialization.data(withJSONObject:value.object)
    try check(value.finalCharacters==14 && !String(decoding:bytes,as:UTF8.self).contains("private phrase"),"diagnostics retain only transcript length")
    let hostile=RecognitionDiagnostic(success:false,finalText:nil,captureMilliseconds:-1,errorDomain:"raw error with private content",errorCode:1)
    try check(hostile.errorDomain=="unclassified" && hostile.captureMilliseconds==0 && !hostile.finalPresent,"raw error text cannot enter domain diagnostics")
}

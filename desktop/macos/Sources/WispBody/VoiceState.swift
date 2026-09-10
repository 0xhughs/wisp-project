import Foundation

enum VoicePhase:String { case idle, listening, finalizing, processing, approval, speaking, releasing, muted, unavailable }
// Main-thread value state. An operation remains owned until its resources have settled.
struct VoiceState {
    private(set) var phase:VoicePhase = .idle
    private(set) var operationID:String?
    private(set) var muted=false
    private var answerReady=false
    mutating func activate(ready:Bool, repeatKey:Bool=false) -> String? {
        guard !repeatKey,!muted else {return nil}
        switch phase {
        case .idle, .unavailable:
            guard ready else {phase = .unavailable; return nil}
            operationID=UUID().uuidString.lowercased(); answerReady=false; phase = .listening
        case .listening: phase = .finalizing
        case .processing,.approval,.speaking,.finalizing: cancel()
        case .muted,.releasing: return nil
        }
        return operationID
    }
    static func validText(_ text:String) -> Bool {
        !text.trimmingCharacters(in:.whitespacesAndNewlines).isEmpty && text.utf16.count <= 4000 && text.utf8.count <= 8000 && !text.unicodeScalars.contains(where:{$0.value < 32 && ![9,10,13].contains($0.value)})
    }
    mutating func finishing(id:String){if operationID==id && phase == .listening{phase = .finalizing}}
    mutating func recognized(_ text:String,id:String) -> Bool {
        guard operationID == id,!muted,[.listening,.finalizing].contains(phase),Self.validText(text) else {return false}
        phase = .processing; return true
    }
    mutating func approval(id:String,pending:Bool) {
        guard operationID == id,[.processing,.approval].contains(phase) else{return}
        phase = pending ? .approval:.processing
    }
    mutating func answer(id:String) -> Bool {
        guard operationID == id,!muted,phase == .processing,!answerReady else{return false}
        answerReady=true; return true
    }
    mutating func speechStarted(id:String) -> Bool {
        guard operationID == id,!muted,phase == .processing,answerReady else{return false}
        phase = .speaking;return true
    }
    mutating func cancel() {if operationID != nil {phase = .releasing;answerReady=false}}
    mutating func setMuted(_ value:Bool) {muted=value;if operationID != nil {cancel()}else{phase=value ? .muted:.idle}}
    mutating func released(id:String) {
        guard operationID == id else{return}
        operationID=nil;answerReady=false;phase=muted ? .muted:.idle
    }
    mutating func fail(id:String? = nil) {
        guard id == nil || operationID == id else{return}
        operationID=nil;answerReady=false;phase = .unavailable
    }
}

// Carbon registration is optional. Wake uses VoiceController.activate on the same machine.
enum VoiceActivation {
    static let shortcutLabel="Option–Space"
    static func shortcutStatus(registered:Bool)->String {
        "\(shortcutLabel) · \(registered ? "registered":"unavailable (conflict); use Wake")"
    }
    static func wakeAllowed(shortcutRegistered:Bool)->Bool {
        _=shortcutRegistered
        return true
    }
}

struct VoiceHotKeyEdge {
    private var held=false
    mutating func handle(pressed isPressed:Bool)->(edge:String,activates:Bool) {
        let activates=isPressed && !held
        held=isPressed
        return (isPressed ? "pressed":"released", activates)
    }
    mutating func reset(){held=false}
}

// A failed stop call before didStart is not a release acknowledgement.
struct SpeechPlaybackState {
    enum Start {case present, stop, ignore}
    private(set) var operationID:String?
    private(set) var cancelling=false
    mutating func begin(_ id:String)->Bool{guard operationID==nil else{return false};operationID=id;cancelling=false;return true}
    mutating func cancel(){if operationID != nil{cancelling=true}}
    func started(_ id:String)->Start{guard operationID==id else{return .ignore};return cancelling ? .stop:.present}
    mutating func released(_ id:String)->Bool{guard operationID==id else{return false};operationID=nil;cancelling=false;return true}
}

// Provider diagnostics contain no audio, transcript or localized error payload.
struct CaptureInputFacts:Equatable {
    var buffers=0,frames=0
    var readableSamples=false,nonzeroSamples=false
}
final class CaptureInputObservation:@unchecked Sendable {
    private let lock=NSLock()
    private var facts=CaptureInputFacts()
    func record(frames:Int,readable:Bool,nonzero:Bool){lock.lock();defer{lock.unlock()};facts.buffers+=1;facts.frames+=max(0,frames);facts.readableSamples = facts.readableSamples || readable;facts.nonzeroSamples = facts.nonzeroSamples || nonzero}
    func snapshot()->CaptureInputFacts{lock.lock();defer{lock.unlock()};return facts}
}
struct RecognitionDiagnostic {
    let input:CaptureInputFacts
    let success:Bool,finalPresent:Bool,finalCharacters:Int,captureMilliseconds:Int,errorDomain:String,errorCode:Int
    init(success:Bool,finalText:String?,captureMilliseconds:Int,errorDomain:String?,errorCode:Int?,input:CaptureInputFacts=CaptureInputFacts()){
        self.input=input
        self.success=success;finalPresent=finalText != nil;finalCharacters=finalText?.utf16.count ?? 0
        self.captureMilliseconds=max(0,captureMilliseconds)
        if let domain=errorDomain,domain.count<=80,domain.range(of:"^[A-Za-z0-9._-]+$",options:.regularExpression) != nil{self.errorDomain=domain}else{self.errorDomain=errorDomain == nil ? "none":"unclassified"}
        self.errorCode=errorCode ?? 0
    }
    var failureMessage:String {
        if errorDomain=="kLSRErrorDomain" && errorCode==201{return "macOS reports that Siri or Dictation is disabled. Check Dictation in System Settings before retrying. No request was sent to the model."}
        if errorDomain=="kLSRErrorDomain" && errorCode==102{return "On-device speech assets are not installed. Check local speech resources before retrying. No request was sent to the model."}
        if errorDomain=="none" || errorDomain=="kAFAssistantErrorDomain" && errorCode==1110{return "No usable speech was recognized. Activate Wisp to try again."}
        return "On-device recognition failed (\(errorDomain), \(errorCode)). No request was sent to the model."
    }
    var object:[String:Any]{["success":success,"finalPresent":finalPresent,"finalCharacters":finalCharacters,"captureMilliseconds":captureMilliseconds,"errorDomain":errorDomain,"errorCode":errorCode,"inputBuffers":input.buffers,"inputFrames":input.frames,"readableSamples":input.readableSamples,"nonzeroSamples":input.nonzeroSamples]}
}

struct VoiceReasoningRoute {
    let selected:String?
    var supported:Bool{selected=="local" || selected=="deepseek"}
    var disclosure:String {
        switch selected {
        case "local":return "Local Ollama: recognized text stays on this Mac."
        case "deepseek":return "Cloud DeepSeek: recognized text is sent to DeepSeek when you speak to Wisp."
        default:return "No supported reasoning provider is attached. Choose one in Models."
        }
    }
}
struct SpeechVoiceChoice {
    let id:String,name:String,language:String,quality:String,novelty:Bool
    static func languageCode(_ locale:String)->String{locale.replacingOccurrences(of:"_",with:"-").split(separator:"-").first.map(String.init)?.lowercased() ?? locale}
    static func preferred(_ voices:[Self],locale:String)->Self? {
        let compatible=voices.filter{!$0.novelty && languageCode($0.language)==languageCode(locale)}
        return compatible.first(where:{$0.name=="Samantha" && $0.language==locale}) ?? compatible.first(where:{$0.language==locale}) ?? compatible.first
    }
    func description(inputLocale:String)->String {
        let mismatch=Self.languageCode(language)==Self.languageCode(inputLocale) ? "":" Output language differs from recognition input."
        return "\(name) · \(language) · \(quality) quality\(novelty ? " · Novelty":"").\(mismatch) Installed output does not establish recognition support or guarantee natural speech."
    }
}

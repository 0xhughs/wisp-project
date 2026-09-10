import AppKit
import AVFoundation
import Speech

protocol VoiceRecognition:AnyObject {
    var availability:String? {get}
    func start(locale:String,id:String,event:@escaping(String,RecognitionEvent)->Void)
    func finish()
    func cancel()
}
enum RecognitionEvent {case capturing, finalizing, final(String), released, failed(String), diagnostic(RecognitionDiagnostic)}
protocol VoiceSynthesis:AnyObject {
    func speak(_ text:String,id:String,configuration:VoiceConfiguration,event:@escaping(String,SpeechEvent)->Void)throws
    func cancel()
}
enum SpeechEvent {case started, finished, cancelled}

final class SystemRecognition:NSObject,VoiceRecognition,SFSpeechRecognitionTaskDelegate {
    private let engine=AVAudioEngine()
    private var recognizer:SFSpeechRecognizer?,request:SFSpeechAudioBufferRecognitionRequest?,task:SFSpeechRecognitionTask?
    private var deviceObserver:NSObjectProtocol?
    override init(){super.init();deviceObserver=NotificationCenter.default.addObserver(forName:.AVAudioEngineConfigurationChange,object:engine,queue:.main){[weak self] _ in guard let self,self.id != nil else{return};self.failure("Audio input changed. Check the microphone and restart Wisp before retrying.")}}
    deinit{if let deviceObserver{NotificationCenter.default.removeObserver(deviceObserver)}}
    private var tap=false,id:String?,callback:((String,RecognitionEvent)->Void)?
    private var inputObservation=CaptureInputObservation()
    private var captureBegan:Double?
    private var timer:DispatchWorkItem?,finalText:String?,cancelled=false
    private(set) var availability:String?
    static func supported(_ locale:String)->Bool {guard let r=SFSpeechRecognizer(locale:Locale(identifier:locale))else{return false};return r.isAvailable && r.supportsOnDeviceRecognition}
    static var permissionStatus:String {
        let mic:String;switch AVCaptureDevice.authorizationStatus(for:.audio){case .authorized:mic="allowed";case .notDetermined:mic="not requested";case .denied:mic="denied";case .restricted:mic="restricted";@unknown default:mic="unavailable"}
        let speech:String;switch SFSpeechRecognizer.authorizationStatus(){case .authorized:speech="allowed";case .notDetermined:speech="not requested";case .denied:speech="denied";case .restricted:speech="restricted";@unknown default:speech="unavailable"}
        return "Microphone: \(mic); speech recognition: \(speech)."
    }
    func start(locale:String,id:String,event:@escaping(String,RecognitionEvent)->Void) {
        guard self.id==nil,availability==nil,Self.supported(locale)else{event(id,.failed("On-device recognition is unavailable for this language."));return}
        self.id=id;callback=event;cancelled=false;finalText=nil;captureBegan=nil;inputObservation=CaptureInputObservation()
        let start={ [weak self] in guard let self,self.id==id,!self.cancelled else{return};self.capture(locale:locale,id:id) }
        let speech={ [weak self] in
            guard let self,self.id==id,!self.cancelled else{return}
            switch SFSpeechRecognizer.authorizationStatus(){
            case .authorized:start()
            case .notDetermined:SFSpeechRecognizer.requestAuthorization { status in DispatchQueue.main.async {guard self.id==id else{return};if status == .authorized {start()}else{self.failure("Speech permission was denied. Enable Wisp in System Settings before retrying.")}}}
            default:self.failure("Speech permission is unavailable. Enable Wisp in System Settings before retrying.")
            }
        }
        switch AVCaptureDevice.authorizationStatus(for:.audio){
        case .authorized:speech()
        case .notDetermined:AVCaptureDevice.requestAccess(for:.audio){allowed in DispatchQueue.main.async {guard self.id==id else{return};if allowed{speech()}else{self.failure("Microphone permission was denied. Enable Wisp in System Settings before retrying.")}}}
        default:failure("Microphone permission is unavailable. Enable Wisp in System Settings before retrying.")
        }
    }
    private func capture(locale:String,id:String) {
        guard Self.supported(locale)else{failure("On-device recognition became unavailable.");return}
        do {
            recognizer=SFSpeechRecognizer(locale:Locale(identifier:locale))
            let request=SFSpeechAudioBufferRecognitionRequest();request.requiresOnDeviceRecognition=true;request.shouldReportPartialResults=false;self.request=request
            let input=engine.inputNode,format=input.outputFormat(forBus:0)
            guard format.sampleRate>0,format.channelCount>0 else{failure("No usable microphone input is connected.");return}
            let observation=inputObservation
            input.installTap(onBus:0,bufferSize:1024,format:format){[weak request] buffer,_ in
                var nonzero=false
                if let channels=buffer.floatChannelData {
                    let count=Int(buffer.frameLength),channelCount=Int(buffer.format.channelCount)
                    if buffer.format.isInterleaved{nonzero=(0..<(count*channelCount)).contains{channels[0][$0] != 0}}
                    else{for channel in 0..<channelCount{if (0..<count).contains(where:{channels[channel][$0] != 0}){nonzero=true;break}}}
                }
                observation.record(frames:Int(buffer.frameLength),readable:buffer.floatChannelData != nil,nonzero:nonzero)
                request?.append(buffer)
            };tap=true
            task=recognizer?.recognitionTask(with:request,delegate:self)
            engine.prepare();try engine.start();captureBegan=ProcessInfo.processInfo.systemUptime;callback?(id,.capturing)
            deadline(seconds:30){[weak self] in self?.finish()}
        }catch{failure("Microphone capture could not start. Check the selected input device.")}
    }
    private func stopInput(){timer?.cancel();timer=nil;if engine.isRunning{engine.stop()};if tap{engine.inputNode.removeTap(onBus:0);tap=false}}
    private func deadline(seconds:Double,_ action:@escaping()->Void){timer?.cancel();let work=DispatchWorkItem(block:action);timer=work;DispatchQueue.main.asyncAfter(deadline:.now()+seconds,execute:work)}
    func finish(){guard id != nil,!cancelled else{return};guard task != nil else{failure("No speech was captured. Activate again after permissions are ready.");return};if let id{callback?(id,.finalizing)};stopInput();request?.endAudio();task?.finish();deadline(seconds:10){[weak self] in self?.failure("No final speech arrived before the recognition deadline.")}}
    func cancel(){guard id != nil else{return};cancelled=true;stopInput();request?.endAudio();if let task{task.cancel();deadline(seconds:5){[weak self] in self?.failure("Recognition release could not be confirmed. Restart Wisp before retrying.")}}else{release()}}
    private func release(){stopInput();request=nil;task=nil;recognizer=nil;guard let id else{return};let cb=callback;self.id=nil;callback=nil;cb?(id,.released)}
    private func failure(_ message:String){guard let id else{return};stopInput();cancelled=true;if task != nil{availability="Recognition release is unconfirmed. Quit Wisp before retrying."};task?.cancel();let cb=callback;request=nil;task=nil;recognizer=nil;self.id=nil;callback=nil;cb?(id,.failed(message))}
    func speechRecognitionTask(_ task:SFSpeechRecognitionTask,didFinishRecognition recognitionResult:SFSpeechRecognitionResult){DispatchQueue.main.async{guard self.task === task,!self.cancelled else{return};self.finalText=recognitionResult.bestTranscription.formattedString}}
    func speechRecognitionTask(_ task:SFSpeechRecognitionTask,didFinishSuccessfully successfully:Bool){DispatchQueue.main.async{
        guard self.task === task,let id=self.id else{return}
        let error=task.error as NSError?
        let duration=self.captureBegan.map{Int((ProcessInfo.processInfo.systemUptime-$0)*1000)} ?? 0
        let diagnostic=RecognitionDiagnostic(success:successfully,finalText:self.finalText,captureMilliseconds:duration,errorDomain:error?.domain,errorCode:error?.code,input:self.inputObservation.snapshot())
        self.callback?(id,.diagnostic(diagnostic))
        if self.cancelled{self.release();return}
        guard successfully,let text=self.finalText,VoiceState.validText(text)else{
            self.task=nil
            self.failure(diagnostic.failureMessage)
            return
        }
        let cb=self.callback;self.release();cb?(id,.final(text))
    }}
    func speechRecognitionTaskWasCancelled(_ task:SFSpeechRecognitionTask){DispatchQueue.main.async{guard self.task === task else{return};self.release()}}
}

final class SystemSynthesis:NSObject,VoiceSynthesis,AVSpeechSynthesizerDelegate,@unchecked Sendable {
    static func choice(_ voice:AVSpeechSynthesisVoice)->SpeechVoiceChoice {
        let quality:String
        switch voice.quality{case .default:quality="Default";case .enhanced:quality="Enhanced";case .premium:quality="Premium";@unknown default:quality="Unspecified"}
        return SpeechVoiceChoice(id:voice.identifier,name:voice.name,language:voice.language,quality:quality,novelty:voice.voiceTraits.contains(.isNoveltyVoice))
    }
    static func defaultConfiguration()->VoiceConfiguration {
        var config=VoiceConfiguration()
        if let preferred=SpeechVoiceChoice.preferred(AVSpeechSynthesisVoice.speechVoices().map(choice),locale:config.locale){config.voice=preferred.id}
        return config
    }
    private let synthesizer=AVSpeechSynthesizer()
    private var playback=SpeechPlaybackState()
    private var utterance:AVSpeechUtterance?,id:String?,callback:((String,SpeechEvent)->Void)?
    override init(){super.init();synthesizer.delegate=self}
    func speak(_ text:String,id:String,configuration:VoiceConfiguration,event:@escaping(String,SpeechEvent)->Void)throws {
        guard self.id==nil,VoiceState.validText(text),let voice=AVSpeechSynthesisVoice(identifier:configuration.voice),(AVSpeechUtteranceMinimumSpeechRate...AVSpeechUtteranceMaximumSpeechRate).contains(configuration.rate)else{throw StoreError.unavailable}
        guard playback.begin(id)else{throw StoreError.busy}
        let u=AVSpeechUtterance(string:text);u.voice=voice;u.rate=configuration.rate;self.id=id;callback=event;utterance=u;synthesizer.speak(u)
    }
    func cancel(){guard id != nil else{return};playback.cancel();_ = synthesizer.stopSpeaking(at:.immediate)}
    func speechSynthesizer(_ synthesizer:AVSpeechSynthesizer,didStart utterance:AVSpeechUtterance){DispatchQueue.main.async{guard self.utterance === utterance,let id=self.id else{return};switch self.playback.started(id){case .present:self.callback?(id,.started);case .stop:_ = self.synthesizer.stopSpeaking(at:.immediate);case .ignore:break}}}
    private func complete(_ u:AVSpeechUtterance,_ event:SpeechEvent){DispatchQueue.main.async{guard self.utterance === u,let id=self.id else{return};guard self.playback.released(id)else{return};let cb=self.callback;self.id=nil;self.utterance=nil;self.callback=nil;cb?(id,event)}}
    func speechSynthesizer(_ synthesizer:AVSpeechSynthesizer,didFinish utterance:AVSpeechUtterance){complete(utterance,.finished)}
    func speechSynthesizer(_ synthesizer:AVSpeechSynthesizer,didCancel utterance:AVSpeechUtterance){complete(utterance,.cancelled)}
}

import AppKit
import AVFoundation
import Speech
final class VoiceView:NSStackView {
    private weak var owner:CompanionController?
    private let language=NSPopUpButton(),voice=NSPopUpButton(),rate=NSSlider(value:0.5,minValue:Double(AVSpeechUtteranceMinimumSpeechRate),maxValue:Double(AVSpeechUtteranceMaximumSpeechRate),target:nil,action:nil)
    private let compatibility=NSTextField(wrappingLabelWithString:"")
    private let status=NSTextField(wrappingLabelWithString:"")
    private let apply=NSButton(title:"Apply Voice",target:nil,action:nil)
    private let mute=NSButton(title:"Mute",target:nil,action:nil)
    private var loaded:VoiceConfiguration?
    private let locales=SFSpeechRecognizer.supportedLocales().map(\.identifier).sorted()
    private let voices=AVSpeechSynthesisVoice.speechVoices().sorted{$0.name<$1.name}
    init(owner:CompanionController){
        self.owner=owner;super.init(frame:.zero);orientation = .vertical;alignment = .leading;spacing=12
        let hint=NSTextField(wrappingLabelWithString:"On-device speech recognition and installed speech output are independent of Models. Wisp records only after Wake or the shortcut. First activation starts; second finishes capture. While thinking or speaking, activation cancels. Mute disables both input and output. Maximum capture: 30 seconds. No automatic retry.")
        for locale in locales{language.addItem(withTitle:"\(locale) · \(SystemRecognition.supported(locale) ? "On-device available":"On-device unavailable")")}
        for v in voices{let item=SystemSynthesis.choice(v);voice.addItem(withTitle:"\(item.name) · \(item.language) · \(item.quality)\(item.novelty ? " · Novelty":"")")}
        language.target=self;language.action = #selector(preview);voice.target=self;voice.action = #selector(preview)
        language.setAccessibilityLabel("Recognition language");voice.setAccessibilityLabel("Speech voice");rate.setAccessibilityLabel("Speech rate")
        apply.target=self;apply.action = #selector(save)
        let wake=NSButton(title:"Wake / Finish / Cancel",target:self,action:#selector(activate))
        mute.target=self;mute.action = #selector(toggleMute)
        for view in [hint,NSTextField(labelWithString:"Recognition language (unsupported on-device languages cannot record)"),language,NSTextField(labelWithString:"Installed speech voice"),voice,compatibility,NSTextField(labelWithString:"Speech rate"),rate,apply,wake,mute,status]{addArrangedSubview(view)}
        hint.widthAnchor.constraint(lessThanOrEqualToConstant:560).isActive=true;status.widthAnchor.constraint(lessThanOrEqualToConstant:560).isActive=true;compatibility.widthAnchor.constraint(lessThanOrEqualToConstant:560).isActive=true
    }
    required init?(coder:NSCoder){fatalError("Programmatic view")}
    func refresh(){
        guard let owner else{return}
        let config=owner.voice.configuration
        if loaded != config{loaded=config;language.selectItem(at:locales.firstIndex(of:config.locale) ?? -1);voice.selectItem(at:voices.firstIndex(where:{$0.identifier==config.voice}) ?? -1);rate.floatValue=config.rate}
        preview()
        status.stringValue=owner.voiceDescription
        mute.title=config.muted ? "Unmute":"Mute";apply.isEnabled = !owner.homeBusy && locales.indices.contains(language.indexOfSelectedItem) && voices.indices.contains(voice.indexOfSelectedItem)
    }
    @objc private func preview(){
        guard locales.indices.contains(language.indexOfSelectedItem),voices.indices.contains(voice.indexOfSelectedItem)else{compatibility.stringValue="The saved input language or speech voice is no longer installed. Select an available choice to apply; saved preferences have not been replaced.";return}
        let locale=locales[language.indexOfSelectedItem]
        let input=SystemRecognition.supported(locale) ? "Input \(locale): device reports on-device support; service readiness is checked on activation.":"Input \(locale): on-device unavailable. This selection cannot record; no download or network fallback."
        compatibility.stringValue=input+"\nOutput: "+SystemSynthesis.choice(voices[voice.indexOfSelectedItem]).description(inputLocale:locale)
        apply.isEnabled = owner?.homeBusy == false
    }
    @objc private func save(){guard locales.indices.contains(language.indexOfSelectedItem),voices.indices.contains(voice.indexOfSelectedItem),let owner else{return};var config=owner.voice.configuration;config.locale=locales[language.indexOfSelectedItem];config.voice=voices[voice.indexOfSelectedItem].identifier;config.rate=rate.floatValue;owner.saveVoice(config)}
    @objc private func activate(){owner?.wakeVoice()}
    @objc private func toggleMute(){owner?.toggleVoiceMute()}
}

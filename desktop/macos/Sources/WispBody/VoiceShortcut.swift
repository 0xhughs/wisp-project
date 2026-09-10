import Carbon
final class VoiceShortcut {
    private var hotKey:EventHotKeyRef?,handler:EventHandlerRef?
    private var pressed=false
    var activate:(()->Void)?
    var diagnostic:((String,Bool)->Void)?
    private(set) var available=false
    static let label="Option–Space"
    static let modifiers=UInt32(optionKey)
    func handle(pressed isPressed:Bool) {
        let activates=isPressed && !pressed
        diagnostic?(isPressed ? "pressed":"released",activates)
        pressed=isPressed
        if activates{activate?()}
    }
    func register() {
        var types=[EventTypeSpec(eventClass:OSType(kEventClassKeyboard),eventKind:UInt32(kEventHotKeyPressed)),EventTypeSpec(eventClass:OSType(kEventClassKeyboard),eventKind:UInt32(kEventHotKeyReleased))]
        let result=InstallEventHandler(GetApplicationEventTarget(),{_,event,context in
            guard let context,let event else{return OSStatus(eventNotHandledErr)}
            let owner=Unmanaged<VoiceShortcut>.fromOpaque(context).takeUnretainedValue()
            owner.handle(pressed:GetEventKind(event)==UInt32(kEventHotKeyPressed))
            return noErr
        },2,&types,Unmanaged.passUnretained(self).toOpaque(),&handler)
        guard result==noErr else{return}
        let id=EventHotKeyID(signature:0x57697370,id:1)
        available=RegisterEventHotKey(UInt32(kVK_Space),Self.modifiers,id,GetApplicationEventTarget(),OptionBits(kEventHotKeyExclusive),&hotKey)==noErr
    }
    func dispose(){if let hotKey{UnregisterEventHotKey(hotKey)};hotKey=nil;if let handler{RemoveEventHandler(handler)};handler=nil;available=false;pressed=false}
    deinit{dispose()}
}

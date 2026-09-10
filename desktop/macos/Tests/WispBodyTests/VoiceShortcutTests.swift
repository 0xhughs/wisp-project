import Carbon
// Mac-native-only: Carbon VoiceShortcut registration. Linux-supplemental press-edge
// and registration-unavailable Wake coverage lives in desktop/tests/voice-seams.test.mjs.
func voiceShortcutTests()throws {
    let shortcut=VoiceShortcut()
    var activations=0,edges=[String](),admissions=[Bool]()
    shortcut.activate={activations+=1}
    shortcut.diagnostic={edges.append($0);admissions.append($1)}
    try check(VoiceShortcut.modifiers==UInt32(optionKey) && VoiceShortcut.label=="Option–Space","visible shortcut matches Option-only registration")
    shortcut.handle(pressed:true);shortcut.handle(pressed:true);shortcut.handle(pressed:false);shortcut.handle(pressed:true)
    try check(activations==2 && edges==["pressed","pressed","released","pressed"] && admissions==[true,false,false,true],"one activation per press; categorical evidence distinguishes repeat suppression")
    shortcut.dispose();shortcut.handle(pressed:true)
    try check(activations==3,"disposal clears held-key state")
}

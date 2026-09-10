import Foundation
func voiceCompatibilityTests()throws {
    try check(VoiceReasoningRoute(selected:"local").supported && VoiceReasoningRoute(selected:"deepseek").supported,"both configured reasoning providers support voice")
    try check(!VoiceReasoningRoute(selected:"unknown").supported && !VoiceReasoningRoute(selected:nil).supported,"unknown and missing providers fail closed")
    try check(VoiceReasoningRoute(selected:"deepseek").disclosure.contains("sent to DeepSeek") && VoiceReasoningRoute(selected:"local").disclosure.contains("this Mac"),"route disclosure before activation")
    let voices=[SpeechVoiceChoice(id:"novelty",name:"Bahh",language:"en-US",quality:"Default",novelty:true),SpeechVoiceChoice(id:"ordinary",name:"Samantha",language:"en-US",quality:"Default",novelty:false),SpeechVoiceChoice(id:"arabic",name:"Maged",language:"ar-SA",quality:"Default",novelty:false)]
    try check(SpeechVoiceChoice.preferred(voices,locale:"en-US")?.id=="ordinary","fresh defaults prefer ordinary compatible installed voice over alphabetical novelty")
    try check(SpeechVoiceChoice.preferred(voices,locale:"ar-SA")?.id=="arabic","fresh voice follows requested compatible locale")
    try check(voices[2].description(inputLocale:"en-US").contains("differs") && voices[2].description(inputLocale:"en-US").contains("Default"),"output quality and input/output mismatch are visible")
    try check(!voices[1].description(inputLocale:"en-GB").contains("differs"),"same language variants are compatible")
}

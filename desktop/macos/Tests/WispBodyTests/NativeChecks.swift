import Foundation
func check(_ condition:Bool,_ name:String) throws { if !condition { throw NSError(domain:name,code:1) } }
@main struct NativeChecks {
    static func main() throws {
        try voiceProviderAdmissionTests(); try voiceCompatibilityTests(); try voiceShortcutTests(); try recognitionDiagnosticTests(); try speechPlaybackTests(); try voiceFrameTests(); try voiceStoreTests(); try voiceStateTests(); try voiceActivationPolicyTests(); try voiceControllerTests(); try voiceActivationStopTests(); try voiceProcessingCancelSettleTests(); try voiceLifecycleAnalogueTests(); try voiceRegistrationUnavailableWakeTests(); try permissionStateTests(); try safeActionOpenerTests(); try pluginStoreTests(); try hardwareProbeTests(); try onboardingStateTests(); try modelsFocusTests(); try reasoningStoreTests(); try homeStoreTests(); try memoryStoreTests(); try managementStateTests(); try bodyStateTests(); try screenGeometryTests(); try engineBridgeTests()
        print("Native assertions passed: state interruption/staleness/failure, display recovery, bridge framing; plugin/hardware/onboarding/safe-action sources uncompiled on Linux")
    }
}

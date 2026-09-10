import Foundation

// Owned pairing of voice cancellation with native approvals. Apply/Quit/home
// analogues close grants locally; engineStopped also clears the voice generation.
final class VoiceLifecycle {
    let voice:VoiceController
    var permissions=PermissionState()
    var shortcutRegistered=true
    var onApprovalCancel:(([String:Any])->Void)?
    init(voice:VoiceController=VoiceController()) {
        self.voice=voice
        voice.closeOwnedApprovals = { [weak self] in
            guard let self,let frame=self.permissions.cancelAll() else {return}
            self.onApprovalCancel?(frame)
        }
    }
    func wake() {
        guard VoiceActivation.wakeAllowed(shortcutRegistered:shortcutRegistered) else {return}
        voice.activate()
    }
    func apply() {
        voice.cancel()
        permissions.invalidate()
    }
    func quit() {
        voice.cancel()
        permissions.invalidate()
        voice.engineStopped()
    }
    func homeInvalidation() {
        voice.cancel()
        permissions.invalidate()
        voice.engineStopped()
    }
    func engineStopped() {
        voice.engineStopped()
        permissions.invalidate()
    }
}

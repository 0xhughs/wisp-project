import AppKit

// Explicit focus works even when macOS skips ordinary buttons in its default Tab loop.
final class ModelsButton: NSButton {
    var onTab: ((Bool) -> Void)?
    override var acceptsFirstResponder: Bool { isEnabled && !isHiddenOrHasHiddenAncestor }
    override func keyDown(with event: NSEvent) {
        if event.keyCode == 48 { onTab?(event.modifierFlags.contains(.shift)); return }
        if event.keyCode == 49 || event.keyCode == 36 { performClick(nil); return }
        super.keyDown(with:event)
    }
}
final class ModelsPopup: NSPopUpButton {
    var onTab: ((Bool) -> Void)?
    override var acceptsFirstResponder: Bool { isEnabled && !isHiddenOrHasHiddenAncestor }
    override func keyDown(with event: NSEvent) {
        if event.keyCode == 48 { onTab?(event.modifierFlags.contains(.shift)); return }
        super.keyDown(with:event)
    }
}
enum ModelsFocus {
    static func next(after current: NSView, in controls: [NSControl], backward: Bool) -> NSControl? {
        guard let index = controls.firstIndex(where: { $0 === current }), !controls.isEmpty else { return nil }
        for offset in 1...controls.count {
            let candidate = controls[(index + (backward ? -offset : offset) + controls.count) % controls.count]
            if candidate.isEnabled && !candidate.isHiddenOrHasHiddenAncestor { return candidate }
        }
        return nil
    }
}

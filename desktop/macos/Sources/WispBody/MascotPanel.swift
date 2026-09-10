import AppKit
final class MascotPanel:NSPanel {
    override var canBecomeKey:Bool { false }
    override var canBecomeMain:Bool { false }
    init(frame:NSRect) {
        super.init(contentRect:frame,styleMask:[.borderless,.nonactivatingPanel],backing:.buffered,defer:false)
        isOpaque=false; backgroundColor = .clear; hasShadow=false
        level = .floating; hidesOnDeactivate=false
        collectionBehavior=[.canJoinAllSpaces,.fullScreenAuxiliary]
        isReleasedWhenClosed=false
    }
}

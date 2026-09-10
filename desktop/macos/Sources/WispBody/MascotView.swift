import AppKit
final class MascotView:NSView {
    private(set) static var liveViews=0
    private(set) static var activeTimers=0
    var phase:BodyPhase = .starting { didSet { setAccessibilityLabel("Wisp \(phase.rawValue)"); needsDisplay=true } }
    private var timer:Timer?
    private var motionObserver:NSObjectProtocol?
    private var tick:Double=0
    private(set) var animationRunning=false
    private(set) var reducedMotion=false
    override var isOpaque:Bool { false }
    override func acceptsFirstMouse(for event:NSEvent?) -> Bool { true }
    override init(frame:NSRect) {
        super.init(frame:frame); Self.liveViews += 1; setAccessibilityElement(true); setAccessibilityRole(.image)
        motionObserver=NSWorkspace.shared.notificationCenter.addObserver(forName:NSWorkspace.accessibilityDisplayOptionsDidChangeNotification,object:nil,queue:.main) { [weak self] _ in self?.resume() }
    }
    required init?(coder:NSCoder) { fatalError() }
    deinit { if timer != nil { timer?.invalidate(); Self.activeTimers -= 1 }; Self.liveViews -= 1; if let motionObserver { NSWorkspace.shared.notificationCenter.removeObserver(motionObserver) } }
    func pause() { if timer != nil { timer?.invalidate(); Self.activeTimers -= 1 }; timer=nil; animationRunning=false }
    func resume() {
        pause(); reducedMotion=NSWorkspace.shared.accessibilityDisplayShouldReduceMotion
        guard window?.isVisible == true else { return }
        needsDisplay=true
        guard MotionPolicy.animate(visible:window?.isVisible == true,reduceMotion:reducedMotion) else { return }
        animationRunning=true; Self.activeTimers += 1
        timer=Timer.scheduledTimer(withTimeInterval:1.0/30,repeats:true) { [weak self] _ in
            guard let self, self.window?.isVisible == true else { self?.pause(); return }
            self.tick += 1.0/30; self.needsDisplay=true
        }
    }
    override func viewDidMoveToWindow() { if window == nil { pause() } }
    override func draw(_ rect:NSRect) {
        NSColor.clear.setFill(); bounds.fill(using:.copy)
        let path=NSBezierPath(ovalIn:NSRect(x:24,y:24,width:112,height:112))
        path.appendOval(in:NSRect(x:60,y:44,width:40,height:36)); path.windingRule = .evenOdd
        switch phase {
        case .listening: NSColor(calibratedRed:0.92,green:0.61,blue:0.22,alpha:1).setFill()
        case .processing: NSColor.systemPurple.setFill()
        case .approval: NSColor.systemOrange.setFill()
        case .muted: NSColor.systemGray.setFill()
        case .speaking: NSColor(calibratedRed:0.16,green:0.61,blue:0.79,alpha:1).setFill()
        case .unavailable,.stopped,.starting: NSColor(calibratedWhite:0.53,alpha:1).setFill()
        default: NSColor(calibratedRed:0.2,green:0.72,blue:0.64,alpha:1).setFill()
        }
        path.fill()
        let motion=reducedMotion ? 0 : sin(tick*2)*2
        NSColor(calibratedWhite:0.09,alpha:1).setFill()
        let h:CGFloat=phase == .listening ? 18 : 12
        for x in [58.0,94.0] { NSBezierPath(ovalIn:NSRect(x:x,y:98+motion,width:8,height:h)).fill() }
        if phase == .listening {
            NSColor.white.setStroke(); let p=NSBezierPath(); p.lineWidth=3
            p.move(to:NSPoint(x:48,y:119)); p.line(to:NSPoint(x:43,y:130)); p.move(to:NSPoint(x:112,y:119)); p.line(to:NSPoint(x:117,y:130)); p.stroke()
        }
        if phase == .speaking { NSBezierPath(ovalIn:NSRect(x:74,y:84,width:12,height:reducedMotion ? 9 : 8+abs(sin(tick*8))*8)).fill() }
        if phase == .unavailable || phase == .stopped {
            let p=NSBezierPath(); p.lineWidth=4; NSColor.white.setStroke(); p.move(to:NSPoint(x:43,y:88)); p.line(to:NSPoint(x:117,y:88)); p.stroke()
        }
    }
    override func mouseDown(with event:NSEvent) { window?.performDrag(with:event) }
}

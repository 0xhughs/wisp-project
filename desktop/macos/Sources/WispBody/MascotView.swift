import AppKit
final class MascotView:NSView {
    private(set) static var liveViews=0
    private(set) static var activeTimers=0
    private(set) var catalogId="wisp-orb"
    var phase:BodyPhase = .starting { didSet { setAccessibilityLabel("Wisp \(phase.rawValue)"); needsDisplay=true } }
    private var timer:Timer?
    private var motionObserver:NSObjectProtocol?
    private var tick:Double=0
    private(set) var animationRunning=false
    private(set) var reducedMotion=false
    override var isOpaque:Bool { false }
    override func acceptsFirstMouse(for event:NSEvent?) -> Bool { true }
    override convenience init(frame:NSRect) { self.init(frame:frame,catalogId:"wisp-orb") }
    init(frame:NSRect,catalogId:String) {
        self.catalogId=PetConfiguration.normalized(catalogId)
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
    private func fillColor() -> NSColor {
        switch phase {
        case .listening: return NSColor(calibratedRed:0.92,green:0.61,blue:0.22,alpha:1)
        case .processing: return NSColor.systemPurple
        case .approval: return NSColor.systemOrange
        case .muted: return NSColor.systemGray
        case .speaking: return NSColor(calibratedRed:0.16,green:0.61,blue:0.79,alpha:1)
        case .unavailable,.stopped,.starting: return NSColor(calibratedWhite:0.53,alpha:1)
        default: return NSColor(calibratedRed:0.2,green:0.72,blue:0.64,alpha:1)
        }
    }
    override func draw(_ rect:NSRect) {
        NSColor.clear.setFill(); bounds.fill(using:.copy)
        switch catalogId {
        case "wisp-fox": drawFox()
        case "wisp-robot": drawRobot()
        default: drawOrb()
        }
    }
    private func drawOrb() {
        let path=NSBezierPath(ovalIn:NSRect(x:24,y:24,width:112,height:112))
        path.appendOval(in:NSRect(x:60,y:44,width:40,height:36)); path.windingRule = .evenOdd
        fillColor().setFill(); path.fill()
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
    private func drawFox() {
        let path=NSBezierPath(); path.windingRule = .evenOdd
        path.move(to:NSPoint(x:44,y:108))
        path.line(to:NSPoint(x:50,y:150))
        path.line(to:NSPoint(x:66,y:116))
        path.line(to:NSPoint(x:80,y:120))
        path.line(to:NSPoint(x:94,y:116))
        path.line(to:NSPoint(x:110,y:150))
        path.line(to:NSPoint(x:116,y:108))
        path.line(to:NSPoint(x:128,y:86))
        path.line(to:NSPoint(x:108,y:40))
        path.line(to:NSPoint(x:80,y:22))
        path.line(to:NSPoint(x:52,y:40))
        path.line(to:NSPoint(x:32,y:86))
        path.close()
        path.appendOval(in:NSRect(x:68,y:70,width:24,height:24))
        fillColor().setFill(); path.fill()
        let sway=reducedMotion ? 0 : sin(tick*1.6)*1.5
        if phase == .listening {
            NSColor.white.setFill()
            let left=NSBezierPath(); left.move(to:NSPoint(x:48,y:118)); left.line(to:NSPoint(x:51,y:142)); left.line(to:NSPoint(x:60,y:120)); left.close(); left.fill()
            let right=NSBezierPath(); right.move(to:NSPoint(x:100,y:120)); right.line(to:NSPoint(x:109,y:142)); right.line(to:NSPoint(x:112,y:118)); right.close(); right.fill()
            NSColor(calibratedWhite:0.09,alpha:1).setStroke()
            let whisk=NSBezierPath(); whisk.lineWidth=2
            whisk.move(to:NSPoint(x:56,y:48)); whisk.line(to:NSPoint(x:28,y:42+sway))
            whisk.move(to:NSPoint(x:56,y:40)); whisk.line(to:NSPoint(x:30,y:28))
            whisk.move(to:NSPoint(x:104,y:48)); whisk.line(to:NSPoint(x:132,y:42+sway))
            whisk.move(to:NSPoint(x:104,y:40)); whisk.line(to:NSPoint(x:130,y:28))
            whisk.stroke()
        }
        if phase == .speaking {
            NSColor(calibratedWhite:0.09,alpha:1).setFill()
            let jaw=reducedMotion ? 10 : 10+abs(sin(tick*7))*10
            NSBezierPath(ovalIn:NSRect(x:68,y:18,width:24,height:jaw)).fill()
            NSColor.white.setStroke()
            let tail=NSBezierPath(); tail.lineWidth=5; tail.lineCapStyle = .round
            let wag=reducedMotion ? 0 : sin(tick*6)*10
            tail.move(to:NSPoint(x:118,y:52)); tail.curve(to:NSPoint(x:142,y:70+wag),controlPoint1:NSPoint(x:128,y:48),controlPoint2:NSPoint(x:136,y:58+wag)); tail.stroke()
        }
        if phase == .idle && !reducedMotion {
            NSColor(calibratedWhite:0.09,alpha:0.35).setFill()
            NSBezierPath(ovalIn:NSRect(x:72,y:96+sway,width:6,height:6)).fill()
            NSBezierPath(ovalIn:NSRect(x:86,y:96-sway,width:6,height:6)).fill()
        }
        if phase == .unavailable || phase == .stopped {
            let p=NSBezierPath(); p.lineWidth=4; NSColor.white.setStroke(); p.move(to:NSPoint(x:48,y:64)); p.line(to:NSPoint(x:112,y:64)); p.stroke()
        }
    }
    private func drawRobot() {
        let path=NSBezierPath(); path.windingRule = .evenOdd
        path.appendRoundedRect(NSRect(x:44,y:22,width:72,height:86),xRadius:8,yRadius:8)
        path.appendRoundedRect(NSRect(x:54,y:108,width:52,height:36),xRadius:6,yRadius:6)
        path.appendOval(in:NSRect(x:73,y:144,width:14,height:14))
        path.appendRoundedRect(NSRect(x:62,y:118,width:36,height:16),xRadius:4,yRadius:4)
        fillColor().setFill(); path.fill()
        let bob=reducedMotion ? 0 : sin(tick*2)*2
        if phase == .listening {
            NSColor(calibratedWhite:0.09,alpha:1).setFill()
            NSBezierPath(rect:NSRect(x:46,y:120,width:8,height:8)).fill()
            NSBezierPath(rect:NSRect(x:106,y:120,width:8,height:8)).fill()
            NSColor.white.setStroke()
            let ticks=NSBezierPath(); ticks.lineWidth=2
            ticks.move(to:NSPoint(x:80,y:158)); ticks.line(to:NSPoint(x:72,y:168))
            ticks.move(to:NSPoint(x:80,y:158)); ticks.line(to:NSPoint(x:88,y:168))
            ticks.stroke()
        }
        if phase == .speaking {
            NSColor(calibratedWhite:0.09,alpha:1).setFill()
            let pulse=reducedMotion ? 3 : 2+abs(sin(tick*8))*4
            for i in 0..<4 {
                let y=CGFloat(36+i*12)
                NSBezierPath(rect:NSRect(x:56,y:y,width:48,height:pulse)).fill()
            }
            if !reducedMotion {
                NSColor.white.setFill()
                NSBezierPath(ovalIn:NSRect(x:76,y:148+bob,width:8,height:8)).fill()
            }
        }
        if phase == .idle && !reducedMotion {
            NSColor(calibratedWhite:0.09,alpha:0.4).setFill()
            NSBezierPath(rect:NSRect(x:70,y:50+bob,width:20,height:6)).fill()
        }
        if phase == .unavailable || phase == .stopped {
            let p=NSBezierPath(); p.lineWidth=4; NSColor.white.setStroke(); p.move(to:NSPoint(x:50,y:64)); p.line(to:NSPoint(x:110,y:64)); p.stroke()
        }
    }
    override func mouseDown(with event:NSEvent) { window?.performDrag(with:event) }
}

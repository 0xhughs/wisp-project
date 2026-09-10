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
        case "wisp-bird": drawBird()
        case "wisp-cat": drawCat()
        case "wisp-owl": drawOwl()
        case "wisp-sprout": drawSprout()
        case "wisp-capsule": drawCapsule()
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
    private func drawBird() {
        let path=NSBezierPath(); path.windingRule = .evenOdd
        path.move(to:NSPoint(x:18,y:76))
        path.line(to:NSPoint(x:44,y:96))
        path.line(to:NSPoint(x:36,y:128))
        path.line(to:NSPoint(x:70,y:108))
        path.line(to:NSPoint(x:88,y:126))
        path.line(to:NSPoint(x:114,y:108))
        path.line(to:NSPoint(x:146,y:84))
        path.line(to:NSPoint(x:114,y:78))
        path.line(to:NSPoint(x:100,y:52))
        path.line(to:NSPoint(x:70,y:32))
        path.line(to:NSPoint(x:28,y:44))
        path.line(to:NSPoint(x:52,y:62))
        path.close()
        path.appendOval(in:NSRect(x:84,y:88,width:16,height:16))
        fillColor().setFill(); path.fill()
        let lift=reducedMotion ? 0 : sin(tick*1.8)*2
        if phase == .listening {
            NSColor.white.setFill()
            let wing=NSBezierPath()
            wing.move(to:NSPoint(x:40,y:108)); wing.line(to:NSPoint(x:32,y:138+lift)); wing.line(to:NSPoint(x:62,y:112)); wing.close(); wing.fill()
            NSColor(calibratedWhite:0.09,alpha:1).setStroke()
            let beak=NSBezierPath(); beak.lineWidth=2
            beak.move(to:NSPoint(x:118,y:92)); beak.line(to:NSPoint(x:132,y:100+lift)); beak.stroke()
        }
        if phase == .speaking {
            NSColor(calibratedWhite:0.09,alpha:1).setFill()
            let gape=reducedMotion ? 8 : 8+abs(sin(tick*7))*10
            NSBezierPath(ovalIn:NSRect(x:118,y:76,width:12,height:gape)).fill()
            if !reducedMotion {
                NSColor.white.setStroke()
                let flap=NSBezierPath(); flap.lineWidth=3; flap.lineCapStyle = .round
                flap.move(to:NSPoint(x:48,y:112)); flap.curve(to:NSPoint(x:22,y:120+lift*2),controlPoint1:NSPoint(x:36,y:118),controlPoint2:NSPoint(x:28,y:122+lift)); flap.stroke()
            }
        }
        if phase == .idle && !reducedMotion {
            NSColor(calibratedWhite:0.09,alpha:0.35).setFill()
            NSBezierPath(ovalIn:NSRect(x:48,y:108+lift,width:8,height:6)).fill()
        }
        if phase == .unavailable || phase == .stopped {
            let p=NSBezierPath(); p.lineWidth=4; NSColor.white.setStroke(); p.move(to:NSPoint(x:40,y:80)); p.line(to:NSPoint(x:120,y:80)); p.stroke()
        }
    }
    private func drawCat() {
        let path=NSBezierPath(); path.windingRule = .evenOdd
        path.move(to:NSPoint(x:48,y:148))
        path.line(to:NSPoint(x:56,y:118))
        path.line(to:NSPoint(x:80,y:124))
        path.line(to:NSPoint(x:104,y:118))
        path.line(to:NSPoint(x:112,y:148))
        path.line(to:NSPoint(x:108,y:108))
        path.line(to:NSPoint(x:124,y:88))
        path.line(to:NSPoint(x:118,y:40))
        path.line(to:NSPoint(x:96,y:22))
        path.line(to:NSPoint(x:64,y:22))
        path.line(to:NSPoint(x:42,y:40))
        path.line(to:NSPoint(x:36,y:88))
        path.line(to:NSPoint(x:52,y:108))
        path.close()
        path.appendOval(in:NSRect(x:68,y:48,width:24,height:22))
        fillColor().setFill(); path.fill()
        let twitch=reducedMotion ? 0 : sin(tick*2.2)*2
        if phase == .listening {
            NSColor.white.setFill()
            let left=NSBezierPath(); left.move(to:NSPoint(x:52,y:122)); left.line(to:NSPoint(x:50,y:140+twitch)); left.line(to:NSPoint(x:64,y:122)); left.close(); left.fill()
            let right=NSBezierPath(); right.move(to:NSPoint(x:96,y:122)); right.line(to:NSPoint(x:110,y:140+twitch)); right.line(to:NSPoint(x:108,y:122)); right.close(); right.fill()
            NSColor(calibratedWhite:0.09,alpha:1).setStroke()
            let whisk=NSBezierPath(); whisk.lineWidth=2
            whisk.move(to:NSPoint(x:58,y:96)); whisk.line(to:NSPoint(x:28,y:100+twitch))
            whisk.move(to:NSPoint(x:58,y:90)); whisk.line(to:NSPoint(x:30,y:84))
            whisk.move(to:NSPoint(x:102,y:96)); whisk.line(to:NSPoint(x:132,y:100+twitch))
            whisk.move(to:NSPoint(x:102,y:90)); whisk.line(to:NSPoint(x:130,y:84))
            whisk.stroke()
        }
        if phase == .speaking {
            NSColor(calibratedWhite:0.09,alpha:1).setFill()
            let jaw=reducedMotion ? 8 : 8+abs(sin(tick*7))*8
            NSBezierPath(ovalIn:NSRect(x:70,y:28,width:20,height:jaw)).fill()
            NSColor.white.setStroke()
            let tail=NSBezierPath(); tail.lineWidth=5; tail.lineCapStyle = .round
            let wag=reducedMotion ? 0 : sin(tick*6)*12
            tail.move(to:NSPoint(x:118,y:48)); tail.curve(to:NSPoint(x:146,y:64+wag),controlPoint1:NSPoint(x:130,y:44),controlPoint2:NSPoint(x:140,y:52+wag)); tail.stroke()
        }
        if phase == .idle && !reducedMotion {
            NSColor(calibratedWhite:0.09,alpha:0.4).setFill()
            NSBezierPath(ovalIn:NSRect(x:64,y:108+twitch,width:6,height:6)).fill()
            NSBezierPath(ovalIn:NSRect(x:90,y:108-twitch,width:6,height:6)).fill()
        }
        if phase == .unavailable || phase == .stopped {
            let p=NSBezierPath(); p.lineWidth=4; NSColor.white.setStroke(); p.move(to:NSPoint(x:48,y:72)); p.line(to:NSPoint(x:112,y:72)); p.stroke()
        }
    }
    private func drawOwl() {
        let path=NSBezierPath(); path.windingRule = .evenOdd
        path.move(to:NSPoint(x:44,y:118))
        path.line(to:NSPoint(x:52,y:152))
        path.line(to:NSPoint(x:72,y:122))
        path.line(to:NSPoint(x:80,y:128))
        path.line(to:NSPoint(x:88,y:122))
        path.line(to:NSPoint(x:108,y:152))
        path.line(to:NSPoint(x:116,y:118))
        path.line(to:NSPoint(x:132,y:80))
        path.line(to:NSPoint(x:116,y:36))
        path.line(to:NSPoint(x:80,y:22))
        path.line(to:NSPoint(x:44,y:36))
        path.line(to:NSPoint(x:28,y:80))
        path.close()
        path.appendOval(in:NSRect(x:54,y:82,width:52,height:22))
        fillColor().setFill(); path.fill()
        let bob=reducedMotion ? 0 : sin(tick*1.7)*2
        if phase == .listening {
            NSColor.white.setFill()
            NSBezierPath(ovalIn:NSRect(x:60,y:86,width:16,height:14)).fill()
            NSBezierPath(ovalIn:NSRect(x:84,y:86,width:16,height:14)).fill()
            NSColor(calibratedWhite:0.09,alpha:1).setFill()
            NSBezierPath(ovalIn:NSRect(x:64,y:90,width:8,height:10)).fill()
            NSBezierPath(ovalIn:NSRect(x:88,y:90,width:8,height:10)).fill()
        }
        if phase == .speaking {
            NSColor(calibratedWhite:0.09,alpha:1).setFill()
            let beak=reducedMotion ? 8 : 8+abs(sin(tick*7))*8
            let tri=NSBezierPath()
            tri.move(to:NSPoint(x:80,y:78-bob)); tri.line(to:NSPoint(x:72,y:78-beak)); tri.line(to:NSPoint(x:88,y:78-beak)); tri.close(); tri.fill()
            if !reducedMotion {
                NSColor.white.setStroke()
                let tuft=NSBezierPath(); tuft.lineWidth=2
                tuft.move(to:NSPoint(x:52,y:148)); tuft.line(to:NSPoint(x:48,y:158+bob))
                tuft.move(to:NSPoint(x:108,y:148)); tuft.line(to:NSPoint(x:112,y:158+bob))
                tuft.stroke()
            }
        }
        if phase == .idle && !reducedMotion {
            NSColor(calibratedWhite:0.09,alpha:0.4).setFill()
            NSBezierPath(ovalIn:NSRect(x:66+bob,y:90,width:6,height:6)).fill()
            NSBezierPath(ovalIn:NSRect(x:90-bob,y:90,width:6,height:6)).fill()
        }
        if phase == .unavailable || phase == .stopped {
            let p=NSBezierPath(); p.lineWidth=4; NSColor.white.setStroke(); p.move(to:NSPoint(x:48,y:64)); p.line(to:NSPoint(x:112,y:64)); p.stroke()
        }
    }
    private func drawSprout() {
        let path=NSBezierPath(); path.windingRule = .evenOdd
        path.move(to:NSPoint(x:70,y:18))
        path.line(to:NSPoint(x:70,y:78))
        path.line(to:NSPoint(x:32,y:96))
        path.line(to:NSPoint(x:24,y:128))
        path.line(to:NSPoint(x:56,y:118))
        path.line(to:NSPoint(x:74,y:88))
        path.line(to:NSPoint(x:74,y:148))
        path.line(to:NSPoint(x:86,y:148))
        path.line(to:NSPoint(x:86,y:88))
        path.line(to:NSPoint(x:104,y:118))
        path.line(to:NSPoint(x:136,y:132))
        path.line(to:NSPoint(x:128,y:96))
        path.line(to:NSPoint(x:90,y:78))
        path.line(to:NSPoint(x:90,y:18))
        path.close()
        path.appendOval(in:NSRect(x:72,y:98,width:16,height:18))
        fillColor().setFill(); path.fill()
        let sway=reducedMotion ? 0 : sin(tick*1.5)*3
        if phase == .listening {
            NSColor.white.setFill()
            let left=NSBezierPath()
            left.move(to:NSPoint(x:40,y:112)); left.line(to:NSPoint(x:22,y:138+sway)); left.line(to:NSPoint(x:54,y:120)); left.close(); left.fill()
            let right=NSBezierPath()
            right.move(to:NSPoint(x:106,y:116)); right.line(to:NSPoint(x:140,y:142+sway)); right.line(to:NSPoint(x:120,y:118)); right.close(); right.fill()
        }
        if phase == .speaking {
            NSColor(calibratedWhite:0.09,alpha:1).setStroke()
            let stretch=reducedMotion ? 0 : abs(sin(tick*6))*10
            let stem=NSBezierPath(); stem.lineWidth=4; stem.lineCapStyle = .round
            stem.move(to:NSPoint(x:80,y:20)); stem.line(to:NSPoint(x:80,y:148+stretch)); stem.stroke()
            NSColor.white.setFill()
            NSBezierPath(ovalIn:NSRect(x:36+sway,y:118,width:12,height:10)).fill()
            NSBezierPath(ovalIn:NSRect(x:116-sway,y:122,width:12,height:10)).fill()
        }
        if phase == .idle && !reducedMotion {
            NSColor(calibratedWhite:0.09,alpha:0.35).setFill()
            NSBezierPath(ovalIn:NSRect(x:40+sway,y:118,width:8,height:6)).fill()
            NSBezierPath(ovalIn:NSRect(x:112-sway,y:122,width:8,height:6)).fill()
        }
        if phase == .unavailable || phase == .stopped {
            let p=NSBezierPath(); p.lineWidth=4; NSColor.white.setStroke(); p.move(to:NSPoint(x:48,y:72)); p.line(to:NSPoint(x:112,y:72)); p.stroke()
        }
    }
    private func drawCapsule() {
        let path=NSBezierPath(); path.windingRule = .evenOdd
        path.appendRoundedRect(NSRect(x:50,y:16,width:60,height:128),xRadius:30,yRadius:30)
        path.appendOval(in:NSRect(x:68,y:88,width:24,height:24))
        fillColor().setFill(); path.fill()
        let pulse=reducedMotion ? 0 : sin(tick*2)*2
        if phase == .listening {
            NSColor.white.setStroke()
            let ring=NSBezierPath(ovalIn:NSRect(x:66,y:86,width:28,height:28)); ring.lineWidth=3; ring.stroke()
            NSColor(calibratedWhite:0.09,alpha:1).setFill()
            NSBezierPath(rect:NSRect(x:54,y:132,width:8,height:8)).fill()
            NSBezierPath(rect:NSRect(x:98,y:132,width:8,height:8)).fill()
        }
        if phase == .speaking {
            NSColor.white.setStroke()
            let grow=reducedMotion ? 24 : 24+abs(sin(tick*8))*8
            let ring=NSBezierPath(ovalIn:NSRect(x:80-grow/2,y:100-grow/2,width:grow,height:grow)); ring.lineWidth=3; ring.stroke()
            NSColor.white.setFill()
            let cap=reducedMotion ? 8 : 8+abs(sin(tick*5))*6
            NSBezierPath(ovalIn:NSRect(x:72,y:16,width:16,height:cap)).fill()
            if !reducedMotion {
                NSBezierPath(ovalIn:NSRect(x:76,y:136+pulse,width:8,height:8)).fill()
            }
        }
        if phase == .idle && !reducedMotion {
            NSColor.white.setFill()
            NSBezierPath(ovalIn:NSRect(x:88,y:48+pulse,width:6,height:6)).fill()
        }
        if phase == .unavailable || phase == .stopped {
            let p=NSBezierPath(); p.lineWidth=4; NSColor.white.setStroke(); p.move(to:NSPoint(x:58,y:80)); p.line(to:NSPoint(x:102,y:80)); p.stroke()
        }
    }
    override func mouseDown(with event:NSEvent) { window?.performDrag(with:event) }
}

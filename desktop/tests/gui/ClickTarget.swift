import AppKit
func emit(_ object: [String: Any]) {
    guard let data = try? JSONSerialization.data(withJSONObject: object, options: [.sortedKeys]) else { return }
    FileHandle.standardOutput.write(data + Data([10]))
}
final class Canvas: NSView {
    var onClick: ((NSEvent) -> Void)?
    override var isFlipped: Bool { true }
    override func draw(_ rect: NSRect) {
        NSColor.white.setFill(); bounds.fill()
        for y in stride(from: 0, to: 2000, by: 40) {
            let label = "Independent target row \(y / 40)" as NSString
            label.draw(at: NSPoint(x: 20, y: y), withAttributes: [.foregroundColor: NSColor.darkGray, .font: NSFont.systemFont(ofSize: 16)])
            NSColor.lightGray.setStroke(); let p = NSBezierPath(); p.move(to: NSPoint(x: 0,y:y+30)); p.line(to:NSPoint(x:900,y:y+30)); p.stroke()
        }
    }
    override func mouseDown(with event: NSEvent) { onClick?(event) }
}
final class Target: NSView, NSTextFieldDelegate {
    var clicks = 0
    let label = NSTextField(labelWithString: "Clicks: 0 • Scroll: 0")
    let field = NSTextField(string: "")
    let scroll = NSScrollView()
    override init(frame: NSRect) {
        super.init(frame: frame)
        wantsLayer = true; layer?.backgroundColor = NSColor.white.cgColor
        label.frame = NSRect(x:20,y:30,width:850,height:30); addSubview(label)
        field.frame = NSRect(x:20,y:70,width:500,height:30); field.placeholderString = "Type here to check retained focus"; field.delegate = self; addSubview(field)
        scroll.frame = NSRect(x:0,y:120,width:900,height:580); scroll.hasVerticalScroller = true
        scroll.autoresizingMask = [.width,.height]; scroll.drawsBackground = true
        let canvas = Canvas(frame:NSRect(x:0,y:0,width:900,height:2000))
        canvas.onClick = { [weak self] event in
            guard let self, let window = self.window else { return }; self.clicks += 1
            let p = window.convertPoint(toScreen:event.locationInWindow)
            self.report(extra:["screenX":p.x,"screenY":p.y])
        }
        scroll.documentView = canvas; addSubview(scroll)
        scroll.contentView.postsBoundsChangedNotifications = true
        NotificationCenter.default.addObserver(forName:NSView.boundsDidChangeNotification,object:scroll.contentView,queue:.main) { [weak self] _ in self?.report(extra:[:]) }
    }
    required init?(coder:NSCoder) { fatalError() }
    func report(extra:[String:Any]) {
        let offset = scroll.contentView.bounds.origin.y
        label.stringValue = "Clicks: \(clicks) • Scroll: \(Int(offset))"
        emit(["event":"target", "clicks":clicks,"scroll":offset,"text":field.stringValue,"key":window?.isKeyWindow ?? false].merging(extra){_,b in b})
    }
    func controlTextDidChange(_ obj:Notification) { report(extra:[:]) }
}
let app = NSApplication.shared
app.setActivationPolicy(.regular)
let window = NSWindow(contentRect:NSRect(x:200,y:200,width:900,height:700),styleMask:[.titled,.closable,.resizable,.miniaturizable],backing:.buffered,defer:false)
window.title = "Wisp independent input target"
window.contentView = Target(frame:NSRect(x:0,y:0,width:900,height:700))
window.makeKeyAndOrderFront(nil); app.activate(ignoringOtherApps:true)
emit(["event":"ready","pid":ProcessInfo.processInfo.processIdentifier,"window":window.windowNumber,"screenHeight":NSScreen.screens[0].frame.height,"scale":NSScreen.screens[0].backingScaleFactor])
app.run()

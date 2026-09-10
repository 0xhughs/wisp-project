#if canImport(AppKit)
import AppKit

final class DrawnCanaryView: NSView {
    var onLeftMouseUp: (() -> Void)?

    override init(frame frameRect: NSRect) {
        super.init(frame: frameRect)
        setAccessibilityElement(false)
        setAccessibilityTitle(nil)
        setAccessibilityLabel(nil)
        setAccessibilityRoleDescription(nil)
    }

    required init?(coder: NSCoder) { fatalError("Programmatic view") }

    override var isAccessibilityElement: Bool {
        get { false }
        set { }
    }

    override var intrinsicContentSize: NSSize { NSSize(width: 48, height: 48) }
    override var isOpaque: Bool { true }
    override func acceptsFirstMouse(for event: NSEvent?) -> Bool { true }

    override func draw(_ dirtyRect: NSRect) {
        NSColor(srgbRed: 190.0 / 255.0, green: 18.0 / 255.0, blue: 60.0 / 255.0, alpha: 1).setFill()
        bounds.fill()
        let core = NSRect(x: (48 - 8) / 2, y: (48 - 8) / 2, width: 8, height: 8)
        NSColor(srgbRed: 1, green: 1, blue: 1, alpha: 1).setFill()
        core.fill()
    }

    override func mouseUp(with event: NSEvent) {
        if event.type == .leftMouseUp { onLeftMouseUp?() }
        super.mouseUp(with: event)
    }
}

final class DrawnCanaryCaptionView: NSView {
    override init(frame frameRect: NSRect) {
        super.init(frame: frameRect)
        setAccessibilityElement(false)
        setAccessibilityTitle(nil)
        setAccessibilityLabel(nil)
        setAccessibilityRoleDescription(nil)
    }

    required init?(coder: NSCoder) { fatalError("Programmatic view") }

    override var isAccessibilityElement: Bool {
        get { false }
        set { }
    }

    override func draw(_ dirtyRect: NSRect) {
        let text = "Drawn Canary" as NSString
        text.draw(at: NSPoint(x: 0, y: 4), withAttributes: [
            .font: NSFont.systemFont(ofSize: 12),
            .foregroundColor: NSColor.labelColor,
        ])
    }
}

final class AccessibilityFixtureWindow: NSObject {
    static let shared = AccessibilityFixtureWindow()
    static let defaultSize = NSSize(width: 400, height: 320)
    private var window: NSWindow?
    private let countLabel = NSTextField(labelWithString: "Fixture Count: 0")
    private let drawnCountLabel = NSTextField(labelWithString: "Drawn Count: 0")
    private let field = NSTextField(string: "")
    private let marker = NSTextField(labelWithString: "Fixture Marker")
    private let button = NSButton(title: "Fixture Button", target: nil, action: nil)
    private let canary = DrawnCanaryView(frame: NSRect(x: 0, y: 0, width: 48, height: 48))
    private let caption = DrawnCanaryCaptionView(frame: NSRect(x: 0, y: 0, width: 160, height: 20))
    private(set) var clickCount = 0
    private(set) var drawnCount = 0
    var ownedWindow: NSWindow? { window }
    var canaryView: DrawnCanaryView { canary }
    private override init() { super.init() }

    func present() {
        if window == nil { build() }
        window?.orderFrontRegardless()
        window?.makeKeyAndOrderFront(nil)
    }

    func pressButton() {
        clickCount += 1
        countLabel.stringValue = "Fixture Count: \(clickCount)"
    }

    func setField(_ text: String) {
        field.stringValue = text
    }

    func nudge(dx: Int, dy: Int) {
        guard let window else { return }
        var frame = window.frame
        frame.origin.x += CGFloat(dx)
        frame.origin.y += CGFloat(dy)
        let screens = NSScreen.screens.map(\.visibleFrame)
        if let screen = screens.first(where: { $0.intersects(frame) }) ?? screens.first {
            frame.origin.x = min(max(frame.origin.x, screen.minX), screen.maxX - min(frame.width, screen.width))
            frame.origin.y = min(max(frame.origin.y, screen.minY), screen.maxY - min(frame.height, screen.height))
        }
        window.setFrame(frame, display: true)
    }

    func canaryRectInContent() -> NSRect {
        guard let content = window?.contentView else { return .zero }
        return canary.convert(canary.bounds, to: content)
    }

    func canaryOnVisibleScreen() -> Bool {
        guard let window, let content = window.contentView else { return false }
        let rect = canary.convert(canary.bounds, to: nil)
        let screenRect = window.convertToScreen(rect)
        return NSScreen.screens.contains { $0.visibleFrame.intersects(screenRect) } && content.window === window
    }

    func accessibilityTitlesAndDescriptions() -> [String] {
        guard let root = window?.contentView else { return [] }
        var names: [String] = []
        func walk(_ view: NSView, depth: Int) {
            if depth > 12 { return }
            if view.isAccessibilityElement {
                if let title = view.accessibilityTitle(), !title.isEmpty { names.append(title) }
                if let label = view.accessibilityLabel(), !label.isEmpty { names.append(label) }
                if let description = view.accessibilityRoleDescription(), !description.isEmpty { names.append(description) }
            }
            for child in view.subviews { walk(child, depth: depth + 1) }
        }
        walk(root, depth: 0)
        return names
    }

    private func build() {
        let panel = NSWindow(contentRect: NSRect(x: 120, y: 120, width: AccessibilityFixtureWindow.defaultSize.width, height: AccessibilityFixtureWindow.defaultSize.height), styleMask: [.titled, .closable], backing: .buffered, defer: false)
        panel.title = "Wisp Accessibility Fixture"
        panel.isReleasedWhenClosed = false
        button.target = self
        button.action = #selector(handleClick)
        button.setAccessibilityLabel("Fixture Button")
        field.setAccessibilityLabel("Fixture Field")
        marker.setAccessibilityLabel("Fixture Marker")
        countLabel.setAccessibilityLabel("Fixture Count")
        drawnCountLabel.setAccessibilityLabel("Drawn Count")
        canary.setAccessibilityElement(false)
        canary.setAccessibilityTitle(nil)
        canary.setAccessibilityLabel(nil)
        canary.onLeftMouseUp = { [weak self] in self?.handleDrawnMouseUp() }
        caption.setAccessibilityElement(false)
        caption.setAccessibilityTitle(nil)
        caption.setAccessibilityLabel(nil)
        let hint = NSTextField(wrappingLabelWithString: "This window is a closed Wisp demonstration. It is not a pet and does not change identity.")
        hint.textColor = .secondaryLabelColor
        canary.translatesAutoresizingMaskIntoConstraints = false
        caption.translatesAutoresizingMaskIntoConstraints = false
        let canaryRow = NSStackView(views: [canary, caption])
        canaryRow.orientation = .horizontal
        canaryRow.alignment = .centerY
        canaryRow.spacing = 10
        let stack = NSStackView(views: [countLabel, button, field, marker, drawnCountLabel, canaryRow, hint])
        stack.orientation = .vertical
        stack.alignment = .leading
        stack.spacing = 10
        stack.translatesAutoresizingMaskIntoConstraints = false
        let root = NSView()
        panel.contentView = root
        root.addSubview(stack)
        NSLayoutConstraint.activate([
            stack.leadingAnchor.constraint(equalTo: root.leadingAnchor, constant: 16),
            stack.trailingAnchor.constraint(equalTo: root.trailingAnchor, constant: -16),
            stack.topAnchor.constraint(equalTo: root.topAnchor, constant: 16),
            field.widthAnchor.constraint(equalTo: stack.widthAnchor),
            hint.widthAnchor.constraint(equalTo: stack.widthAnchor),
            canary.widthAnchor.constraint(equalToConstant: 48),
            canary.heightAnchor.constraint(equalToConstant: 48),
            caption.widthAnchor.constraint(equalToConstant: 160),
            caption.heightAnchor.constraint(equalToConstant: 20),
        ])
        window = panel
    }

    @objc private func handleClick() { pressButton() }
    private func handleDrawnMouseUp() {
        drawnCount += 1
        drawnCountLabel.stringValue = "Drawn Count: \(drawnCount)"
    }
}
#else
final class AccessibilityFixtureWindow {
    static let shared = AccessibilityFixtureWindow()
    static let defaultSize = (width: 400.0, height: 320.0)
    var clickCount = 0
    var drawnCount = 0
    func present() {}
    func pressButton() {}
    func setField(_ text: String) {}
    func nudge(dx: Int, dy: Int) {}
    func canaryOnVisibleScreen() -> Bool { false }
    func accessibilityTitlesAndDescriptions() -> [String] { [] }
}
#endif

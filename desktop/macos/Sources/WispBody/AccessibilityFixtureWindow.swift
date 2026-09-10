#if canImport(AppKit)
import AppKit

final class AccessibilityFixtureWindow: NSObject {
    static let shared = AccessibilityFixtureWindow()
    private var window: NSWindow?
    private let countLabel = NSTextField(labelWithString: "Fixture Count: 0")
    private let field = NSTextField(string: "")
    private let marker = NSTextField(labelWithString: "Fixture Marker")
    private let button = NSButton(title: "Fixture Button", target: nil, action: nil)
    private(set) var clickCount = 0
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

    private func build() {
        let panel = NSWindow(contentRect: NSRect(x: 120, y: 120, width: 360, height: 220), styleMask: [.titled, .closable], backing: .buffered, defer: false)
        panel.title = "Wisp Accessibility Fixture"
        panel.isReleasedWhenClosed = false
        button.target = self
        button.action = #selector(handleClick)
        button.setAccessibilityLabel("Fixture Button")
        field.setAccessibilityLabel("Fixture Field")
        marker.setAccessibilityLabel("Fixture Marker")
        countLabel.setAccessibilityLabel("Fixture Count")
        let hint = NSTextField(wrappingLabelWithString: "This window is a closed Wisp demonstration. It is not a pet and does not change identity.")
        hint.textColor = .secondaryLabelColor
        let stack = NSStackView(views: [countLabel, button, field, marker, hint])
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
        ])
        window = panel
    }

    @objc private func handleClick() { pressButton() }
}
#else
final class AccessibilityFixtureWindow {
    static let shared = AccessibilityFixtureWindow()
    func present() {}
    func pressButton() {}
    func setField(_ text: String) {}
    func nudge(dx: Int, dy: Int) {}
}
#endif

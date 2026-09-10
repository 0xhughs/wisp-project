import AppKit

final class DiagnosticsView: NSView {
    var refreshHandler: (() -> Void)?
    private let facts = NSTextField(wrappingLabelWithString: "")
    private let refreshButton = ModelsButton(title: "Refresh", target: nil, action: nil)
    private let copyButton = ModelsButton(title: "Copy", target: nil, action: nil)
    override init(frame frameRect: NSRect) {
        super.init(frame: frameRect)
        facts.font = .systemFont(ofSize: 13)
        facts.setAccessibilityLabel("Diagnostics snapshot")
        refreshButton.setAccessibilityLabel("Refresh")
        copyButton.setAccessibilityLabel("Copy")
        refreshButton.target = self; refreshButton.action = #selector(refresh)
        copyButton.target = self; copyButton.action = #selector(copySnapshot)
        let actions = NSStackView(views: [refreshButton, copyButton]); actions.spacing = 10
        let hint = NSTextField(wrappingLabelWithString: "Refresh repeats the hardware and Ollama inspect only. It does not start the microphone, send a prompt, pull a model, or open Harness UI. Copy writes the same on-screen redacted text to the pasteboard. There is no send-diagnostics action and no diagnostic file in the Wisp home.")
        hint.textColor = .secondaryLabelColor
        let stack = NSStackView(views: [actions, facts, hint])
        stack.orientation = .vertical; stack.alignment = .leading; stack.spacing = 12
        stack.translatesAutoresizingMaskIntoConstraints = false; addSubview(stack)
        NSLayoutConstraint.activate([
            stack.topAnchor.constraint(equalTo: topAnchor), stack.leadingAnchor.constraint(equalTo: leadingAnchor),
            stack.trailingAnchor.constraint(equalTo: trailingAnchor), stack.bottomAnchor.constraint(equalTo: bottomAnchor),
            facts.widthAnchor.constraint(equalTo: stack.widthAnchor), hint.widthAnchor.constraint(equalTo: stack.widthAnchor),
        ])
        refreshButton.onTab = { [weak self] backward in self?.move(from: self?.refreshButton, backward: backward) }
        copyButton.onTab = { [weak self] backward in self?.move(from: self?.copyButton, backward: backward) }
    }
    required init?(coder: NSCoder) { fatalError("Programmatic view") }
    var displayedText: String { facts.stringValue }
    func show(_ text: String) { facts.stringValue = DiagnosticsSnapshot.redact(text) }
    private func move(from control: NSView?, backward: Bool) {
        guard let control else { return }
        if let next = ModelsFocus.next(after: control, in: [refreshButton, copyButton], backward: backward) { window?.makeFirstResponder(next) }
    }
    @objc private func refresh() { refreshHandler?() }
    @objc private func copySnapshot() {
        let text = facts.stringValue
        NSPasteboard.general.clearContents()
        NSPasteboard.general.setString(text, forType: .string)
    }
}

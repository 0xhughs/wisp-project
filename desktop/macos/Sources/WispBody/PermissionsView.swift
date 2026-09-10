import AppKit

final class PermissionsView: NSView {
    weak var companion: CompanionController?
    private let openSettings = ModelsButton(title: "Open Accessibility Settings", target: nil, action: nil)
    private let showFixture = ModelsButton(title: "Show Accessibility Fixture", target: nil, action: nil)
    private let status = NSTextField(wrappingLabelWithString: "")
    init(owner: CompanionController) {
        companion = owner
        super.init(frame: .zero)
        openSettings.setAccessibilityLabel("Open Accessibility Settings")
        showFixture.setAccessibilityLabel("Show Accessibility Fixture")
        openSettings.target = self
        openSettings.action = #selector(openPrivacy)
        showFixture.target = self
        showFixture.action = #selector(showWindow)
        let actions = NSStackView(views: [openSettings, showFixture])
        actions.spacing = 10
        let hint = NSTextField(wrappingLabelWithString: "Opening Accessibility settings or showing the fixture is not Allow Once. Drawn Canary visual click is Ask-each-time and is not a click on Fixture Button. Screen Recording and Input Monitoring are not requested here. Windows computer control stays unavailable.")
        hint.textColor = .secondaryLabelColor
        let stack = NSStackView(views: [actions, status, hint])
        stack.orientation = .vertical
        stack.alignment = .leading
        stack.spacing = 12
        stack.translatesAutoresizingMaskIntoConstraints = false
        addSubview(stack)
        NSLayoutConstraint.activate([
            stack.topAnchor.constraint(equalTo: topAnchor),
            stack.leadingAnchor.constraint(equalTo: leadingAnchor),
            stack.trailingAnchor.constraint(equalTo: trailingAnchor),
            stack.bottomAnchor.constraint(equalTo: bottomAnchor),
            hint.widthAnchor.constraint(equalTo: stack.widthAnchor),
            status.widthAnchor.constraint(equalTo: stack.widthAnchor),
        ])
        openSettings.onTab = { [weak self] backward in self?.move(from: self?.openSettings, backward: backward) }
        showFixture.onTab = { [weak self] backward in self?.move(from: self?.showFixture, backward: backward) }
        refresh()
    }
    required init?(coder: NSCoder) { fatalError("Programmatic view") }
    private func move(from control: NSView?, backward: Bool) {
        guard let control else { return }
        if let next = ModelsFocus.next(after: control, in: [openSettings, showFixture], backward: backward) { window?.makeFirstResponder(next) }
    }
    func refresh() {
        status.stringValue = "Accessibility TCC: \(AccessibilityDriver.trustedStatus()). Granting Accessibility is not a tool grant."
    }
    @objc private func openPrivacy() { companion?.openAccessibilityPrivacySettings() }
    @objc private func showWindow() { companion?.showAccessibilityFixture() }
}

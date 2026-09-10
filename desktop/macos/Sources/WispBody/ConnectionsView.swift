import AppKit

final class ConnectionsView: NSView, NSTextFieldDelegate {
    weak var companion: CompanionController?
    private let status = NSTextField(wrappingLabelWithString:"")
    private let catalog = NSTextField(wrappingLabelWithString:"")
    private let note = NSTextField()
    private let serverName = NSTextField()
    private let credentialId = NSTextField()
    private let fixed = NSTextField(wrappingLabelWithString:"Transport: stdio (Wisp-fixed). Command and arguments are bound to the engine Node and covered fixture. failOnStartupError: true. reconnect.enabled: false. These values are not user-overridable. Streamable HTTP, remote URLs, npx and user-chosen executables stay unavailable. Optional credential IDs are opaque references, never secret values.")
    private let enable = ModelsButton(title:"Enable",target:nil,action:nil)
    private let remove = ModelsButton(title:"Remove",target:nil,action:nil)
    private let apply = ModelsButton(title:"Apply",target:nil,action:nil)
    private let revert = ModelsButton(title:"Revert Draft",target:nil,action:nil)
    private var base: ConnectionSnapshot?
    private var dirty = false
    private var draftEnabled = false
    init(owner: CompanionController) {
        companion = owner; super.init(frame:.zero)
        note.delegate = self; note.setAccessibilityLabel("Connection note")
        note.placeholderString = "Optional note (letters, numbers, _ or -, up to 40)"
        serverName.delegate = self; serverName.setAccessibilityLabel("MCP server name")
        serverName.placeholderString = "serverName (letters, numbers, _ or -, up to 32)"
        credentialId.delegate = self; credentialId.setAccessibilityLabel("Optional credential reference")
        credentialId.placeholderString = "Optional opaque credential id (not the secret)"
        catalog.font = .systemFont(ofSize:13); catalog.textColor = .secondaryLabelColor
        status.font = .systemFont(ofSize:13)
        fixed.font = .systemFont(ofSize:12); fixed.textColor = .secondaryLabelColor
        let actions = NSStackView(views:[enable,remove,apply,revert]); actions.spacing = 10
        for (button,action) in [(enable,#selector(confirmEnable)),(remove,#selector(confirmRemove)),(apply,#selector(save)),(revert,#selector(cancel))] { button.target = self; button.action = action }
        let hint = NSTextField(wrappingLabelWithString:"Wisp owns this closed catalog. Named services were not queried. Enabling a connection can register one MCP tool; Wisp still asks before each action. Connection save is not Allow Once. Cancel or Revert Draft leaves the saved composition unchanged. Apply restarts reasoning with the saved overlay.")
        let stack = NSStackView(views:[NSTextField(labelWithString:"Local stdio demonstration"),note,NSTextField(labelWithString:"Advanced custom MCP"),serverName,credentialId,fixed,actions,status,NSTextField(labelWithString:"Catalog"),catalog,hint]); stack.orientation = .vertical; stack.alignment = .leading; stack.spacing = 12
        stack.translatesAutoresizingMaskIntoConstraints = false; addSubview(stack)
        NSLayoutConstraint.activate([stack.topAnchor.constraint(equalTo:topAnchor),stack.leadingAnchor.constraint(equalTo:leadingAnchor),stack.trailingAnchor.constraint(equalTo:trailingAnchor),stack.bottomAnchor.constraint(equalTo:bottomAnchor)])
        for view in [catalog,status,hint,note,serverName,credentialId,fixed] { view.widthAnchor.constraint(equalTo:stack.widthAnchor).isActive = true }
        let focus: [NSControl] = [note,serverName,credentialId,enable,remove,apply,revert]
        for control in focus {
            let action: (Bool) -> Void = { [weak self, weak control] backward in
                guard let control else { return }; self?.moveFocus(from:control,backward:backward)
            }
            (control as? ModelsButton)?.onTab = action
        }
        refresh()
    }
    required init?(coder: NSCoder) { fatalError("Programmatic view") }
    private var focusControls: [NSControl] { [note,serverName,credentialId,enable,remove,apply,revert] }
    private func moveFocus(from control: NSView, backward: Bool) {
        if let next = ModelsFocus.next(after:control,in:focusControls,backward:backward) { window?.makeFirstResponder(next) }
    }
    func control(_ control: NSControl, textView: NSTextView, doCommandBy commandSelector: Selector) -> Bool {
        if commandSelector == #selector(NSResponder.insertTab(_:)) { moveFocus(from:control,backward:false); return true }
        if commandSelector == #selector(NSResponder.insertBacktab(_:)) { moveFocus(from:control,backward:true); return true }
        return false
    }
    func refresh() {
        guard let owner = companion else { return }
        if !dirty, let saved = owner.connectionSnapshot, base?.revision != saved.revision { load(saved) }
        let available = base != nil && ConnectionApply.allowed(modelBusy:owner.modelBusy,homeBusy:owner.homeBusy)
        note.isEnabled = available
        serverName.isEnabled = available
        credentialId.isEnabled = available
        enable.isEnabled = available && !draftEnabled
        remove.isEnabled = available && draftEnabled
        apply.isEnabled = available && dirty
        revert.isEnabled = available && dirty
        let rows = owner.connectionCatalog
        catalog.stringValue = rows.map { row in
            "\(row.title) — \(row.status.rawValue)\(row.canManage ? "" : " (cannot enable)")\n\(row.detail)"
        }.joined(separator:"\n\n")
        status.stringValue = owner.connectionStatus + (dirty ? "\nUnsaved connection draft." : "")
    }
    private func load(_ saved: ConnectionSnapshot) {
        base = saved; note.stringValue = saved.configuration.note; serverName.stringValue = saved.configuration.serverName; credentialId.stringValue = saved.configuration.credentialId; draftEnabled = saved.configuration.enabled; dirty = false
    }
    func controlTextDidChange(_ obj: Notification) { dirty = true; refresh() }
    @objc private func cancel() { if let saved = companion?.connectionSnapshot { load(saved) }; refresh() }
    private func confirm(_ title: String, _ detail: String, _ actionTitle: String, confirmed: @escaping () -> Void) {
        guard let window else { return }
        let alert = NSAlert(); alert.messageText = title; alert.informativeText = detail
        alert.addButton(withTitle:"Cancel"); alert.addButton(withTitle:actionTitle)
        alert.buttons[0].keyEquivalent = "\u{1b}"; alert.buttons[1].keyEquivalent = ""
        alert.beginSheetModal(for:window) { response in if response == .alertSecondButtonReturn { confirmed() } }
    }
    @objc private func confirmEnable() {
        confirm("Enable this connection?","This connection can register one MCP tool. Wisp will still ask before each action. Saving a connection is not permission to run that tool. Cancel performs no overlay change.","Enable") { [weak self] in
            self?.draftEnabled = true; self?.dirty = true; self?.refresh()
        }
    }
    @objc private func confirmRemove() {
        confirm("Remove this connection?","Wisp will unmount the demonstration MCP server on Apply. Saved memory, identity, model choice and plugins stay the same. Pending actions are cancelled by the restart.","Remove") { [weak self] in
            self?.draftEnabled = false; self?.dirty = true; self?.refresh()
        }
    }
    @objc private func save() {
        guard let base else { return }
        var c = base.configuration; c.enabled = draftEnabled; c.note = note.stringValue; c.serverName = serverName.stringValue; c.credentialId = credentialId.stringValue
        companion?.applyConnections(c,expected:base.revision) { [weak self] success in if success { self?.cancel() } else { self?.refresh() } }
    }
    func allowQuit() -> Bool {
        guard dirty else { return true }
        let alert = NSAlert(); alert.messageText = "An unsaved connection draft is open."; alert.addButton(withTitle:"Keep Editing"); alert.addButton(withTitle:"Discard and Quit")
        if alert.runModal() == .alertSecondButtonReturn { cancel(); return true }; return false
    }
}

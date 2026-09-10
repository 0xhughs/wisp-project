import AppKit

final class PluginsView: NSView, NSTextFieldDelegate {
    weak var companion: CompanionController?
    private let status = NSTextField(wrappingLabelWithString:"")
    private let catalog = NSTextField(wrappingLabelWithString:"")
    private let note = NSTextField()
    private let install = ModelsButton(title:"Install",target:nil,action:nil)
    private let remove = ModelsButton(title:"Remove",target:nil,action:nil)
    private let apply = ModelsButton(title:"Apply",target:nil,action:nil)
    private let revert = ModelsButton(title:"Revert Draft",target:nil,action:nil)
    private var base: PluginSnapshot?
    private var dirty = false
    private var draftEnabled = false
    init(owner: CompanionController) {
        companion = owner; super.init(frame:.zero)
        note.delegate = self; note.setAccessibilityLabel("Plugin note")
        note.placeholderString = "Optional note (letters, numbers, _ or -, up to 40)"
        catalog.font = .systemFont(ofSize:13); catalog.textColor = .secondaryLabelColor
        status.font = .systemFont(ofSize:13)
        let actions = NSStackView(views:[install,remove,apply,revert]); actions.spacing = 10
        for (button,action) in [(install,#selector(confirmInstall)),(remove,#selector(confirmRemove)),(apply,#selector(save)),(revert,#selector(cancel))] { button.target = self; button.action = action }
        let hint = NSTextField(wrappingLabelWithString:"Wisp owns this closed catalog. There is no marketplace. Installing a plugin can register tools; Wisp still asks before each action. Cancel or Revert Draft leaves the saved composition unchanged. Apply restarts reasoning with the saved overlay; it does not grant Allow Once.")
        let stack = NSStackView(views:[NSTextField(labelWithString:"Compatible demonstration"),note,actions,status,NSTextField(labelWithString:"Catalog"),catalog,hint]); stack.orientation = .vertical; stack.alignment = .leading; stack.spacing = 12
        stack.translatesAutoresizingMaskIntoConstraints = false; addSubview(stack)
        NSLayoutConstraint.activate([stack.topAnchor.constraint(equalTo:topAnchor),stack.leadingAnchor.constraint(equalTo:leadingAnchor),stack.trailingAnchor.constraint(equalTo:trailingAnchor),stack.bottomAnchor.constraint(equalTo:bottomAnchor)])
        for view in [catalog,status,hint,note] { view.widthAnchor.constraint(equalTo:stack.widthAnchor).isActive = true }
        let focus: [NSControl] = [note,install,remove,apply,revert]
        for control in focus {
            let action: (Bool) -> Void = { [weak self, weak control] backward in
                guard let control else { return }; self?.moveFocus(from:control,backward:backward)
            }
            (control as? ModelsButton)?.onTab = action
        }
        refresh()
    }
    required init?(coder: NSCoder) { fatalError("Programmatic view") }
    private var focusControls: [NSControl] { [note,install,remove,apply,revert] }
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
        if !dirty, let saved = owner.pluginSnapshot, base?.revision != saved.revision { load(saved) }
        let available = base != nil && PluginApply.allowed(modelBusy:owner.modelBusy,homeBusy:owner.homeBusy)
        note.isEnabled = available
        install.isEnabled = available && !draftEnabled
        remove.isEnabled = available && draftEnabled
        apply.isEnabled = available && dirty
        revert.isEnabled = available && dirty
        let rows = owner.pluginCatalog
        catalog.stringValue = rows.map { row in
            "\(row.title) — \(row.status.rawValue)\(row.canManage ? "" : " (cannot enable)")\n\(row.detail)"
        }.joined(separator:"\n\n")
        status.stringValue = owner.pluginStatus + (dirty ? "\nUnsaved plugin draft." : "")
    }
    private func load(_ saved: PluginSnapshot) {
        base = saved; note.stringValue = saved.configuration.note; draftEnabled = saved.configuration.enabled; dirty = false
    }
    func controlTextDidChange(_ obj: Notification) { dirty = true; refresh() }
    @objc private func cancel() { if let saved = companion?.pluginSnapshot { load(saved) }; refresh() }
    private func confirm(_ title: String, _ detail: String, _ actionTitle: String, confirmed: @escaping () -> Void) {
        guard let window else { return }
        let alert = NSAlert(); alert.messageText = title; alert.informativeText = detail
        alert.addButton(withTitle:"Cancel"); alert.addButton(withTitle:actionTitle)
        alert.buttons[0].keyEquivalent = "\u{1b}"; alert.buttons[1].keyEquivalent = ""
        alert.beginSheetModal(for:window) { response in if response == .alertSecondButtonReturn { confirmed() } }
    }
    @objc private func confirmInstall() {
        confirm("Install this plugin?","This plugin can register tools. Wisp will still ask before each action. Installation is not permission to run those tools. Cancel performs no overlay change.","Install") { [weak self] in
            self?.draftEnabled = true; self?.dirty = true; self?.refresh()
        }
    }
    @objc private func confirmRemove() {
        confirm("Remove this plugin?","Wisp will unmount the demonstration plugin on Apply. Saved memory, identity and model choice stay the same. Pending actions are cancelled by the restart.","Remove") { [weak self] in
            self?.draftEnabled = false; self?.dirty = true; self?.refresh()
        }
    }
    @objc private func save() {
        guard let base else { return }
        var c = base.configuration; c.enabled = draftEnabled; c.note = note.stringValue
        companion?.applyPlugins(c,expected:base.revision) { [weak self] success in if success { self?.cancel() } else { self?.refresh() } }
    }
    func allowQuit() -> Bool {
        guard dirty else { return true }
        let alert = NSAlert(); alert.messageText = "An unsaved plugin draft is open."; alert.addButton(withTitle:"Keep Editing"); alert.addButton(withTitle:"Discard and Quit")
        if alert.runModal() == .alertSecondButtonReturn { cancel(); return true }; return false
    }
}

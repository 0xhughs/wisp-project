import AppKit

final class SkillsView: NSView {
    weak var companion: CompanionController?
    private let status = NSTextField(wrappingLabelWithString:"")
    private let catalog = NSTextField(wrappingLabelWithString:"")
    private let enable = ModelsButton(title:"Enable",target:nil,action:nil)
    private let disable = ModelsButton(title:"Disable",target:nil,action:nil)
    private let apply = ModelsButton(title:"Apply",target:nil,action:nil)
    private let revert = ModelsButton(title:"Revert Draft",target:nil,action:nil)
    private var base: SkillSnapshot?
    private var dirty = false
    private var draftEnabled = false
    init(owner: CompanionController) {
        companion = owner; super.init(frame:.zero)
        catalog.font = .systemFont(ofSize:13); catalog.textColor = .secondaryLabelColor
        status.font = .systemFont(ofSize:13)
        enable.setAccessibilityLabel("Enable skill")
        disable.setAccessibilityLabel("Disable skill")
        apply.setAccessibilityLabel("Apply skills")
        revert.setAccessibilityLabel("Revert skill draft")
        let actions = NSStackView(views:[enable,disable,apply,revert]); actions.spacing = 10
        for (button,action) in [(enable,#selector(confirmEnable)),(disable,#selector(confirmDisable)),(apply,#selector(save)),(revert,#selector(cancel))] { button.target = self; button.action = action }
        let hint = NSTextField(wrappingLabelWithString:"This is the same Wisp. A skill is instructions, not a second assistant. Enable is not Allow Once. Wisp still asks before loading skill markdown and before wisp_tell_time. Cancel, Escape or Revert Draft leaves the saved snapshot and overlay unchanged. Apply restarts reasoning with the saved overlay. There is no marketplace, composer, /skill picker, or Harness UI.")
        let stack = NSStackView(views:[NSTextField(labelWithString:"Local time briefing"),actions,status,NSTextField(labelWithString:"Catalog"),catalog,hint]); stack.orientation = .vertical; stack.alignment = .leading; stack.spacing = 12
        stack.translatesAutoresizingMaskIntoConstraints = false; addSubview(stack)
        NSLayoutConstraint.activate([stack.topAnchor.constraint(equalTo:topAnchor),stack.leadingAnchor.constraint(equalTo:leadingAnchor),stack.trailingAnchor.constraint(equalTo:trailingAnchor),stack.bottomAnchor.constraint(equalTo:bottomAnchor)])
        for view in [catalog,status,hint] { view.widthAnchor.constraint(equalTo:stack.widthAnchor).isActive = true }
        let focus: [NSControl] = [enable,disable,apply,revert]
        for control in focus {
            let action: (Bool) -> Void = { [weak self, weak control] backward in
                guard let control else { return }; self?.moveFocus(from:control,backward:backward)
            }
            (control as? ModelsButton)?.onTab = action
        }
        refresh()
    }
    required init?(coder: NSCoder) { fatalError("Programmatic view") }
    private var focusControls: [NSControl] { [enable,disable,apply,revert] }
    private func moveFocus(from control: NSView, backward: Bool) {
        if let next = ModelsFocus.next(after:control,in:focusControls,backward:backward) { window?.makeFirstResponder(next) }
    }
    func refresh() {
        guard let owner = companion else { return }
        if !dirty, let saved = owner.skillSnapshot, base?.revision != saved.revision { load(saved) }
        let available = SkillApply.allowed(modelBusy:owner.modelBusy,homeBusy:owner.homeBusy)
        enable.isEnabled = available && !draftEnabled && (base != nil || owner.skillSnapshot == nil)
        disable.isEnabled = available && draftEnabled
        apply.isEnabled = available && (dirty || owner.skillSnapshot == nil)
        revert.isEnabled = available && dirty
        let rows = owner.skillCatalog
        catalog.stringValue = rows.map { row in
            "\(row.title) — \(row.status.rawValue)\(row.canManage ? "" : " (cannot enable)")\n\(row.detail)"
        }.joined(separator:"\n\n")
        let folderNote = owner.skillSnapshot == nil ? "\n"+SkillApply.folderRequired : ""
        status.stringValue = owner.skillStatus + folderNote + (dirty ? "\nUnsaved skill draft." : "")
    }
    private func load(_ saved: SkillSnapshot) {
        base = saved; draftEnabled = saved.configuration.enabled; dirty = false
    }
    @objc private func cancel() { if let saved = companion?.skillSnapshot { load(saved) }; refresh() }
    private func confirm(_ title: String, _ detail: String, _ actionTitle: String, confirmed: @escaping () -> Void) {
        guard let window else { return }
        let alert = NSAlert(); alert.messageText = title; alert.informativeText = detail
        alert.addButton(withTitle:"Cancel"); alert.addButton(withTitle:actionTitle)
        alert.buttons[0].keyEquivalent = "\u{1b}"; alert.buttons[1].keyEquivalent = ""
        alert.beginSheetModal(for:window) { response in if response == .alertSecondButtonReturn { confirmed() } }
    }
    @objc private func confirmEnable() {
        confirm("Enable this skill?",SkillApply.confirmDetail,"Enable") { [weak self] in
            self?.draftEnabled = true; self?.dirty = true; self?.refresh()
        }
    }
    @objc private func confirmDisable() {
        confirm("Disable this skill?","Wisp will unmount the demonstration skill on Apply. Saved memory, identity, model choice, plugins, connections and pet stay the same. Pending actions are cancelled by the restart. Disable is not a grant.","Disable") { [weak self] in
            self?.draftEnabled = false; self?.dirty = true; self?.refresh()
        }
    }
    @objc private func save() {
        if companion?.skillSnapshot == nil {
            companion?.applySkills(SkillConfiguration(),expected:"") { [weak self] _ in self?.refresh() }
            return
        }
        guard let base else { return }
        var c = base.configuration; c.enabled = draftEnabled
        companion?.applySkills(c,expected:base.revision) { [weak self] success in if success { self?.cancel() } else { self?.refresh() } }
    }
    func allowQuit() -> Bool {
        guard dirty else { return true }
        let alert = NSAlert(); alert.messageText = "An unsaved skill draft is open."; alert.addButton(withTitle:"Keep Editing"); alert.addButton(withTitle:"Discard and Quit")
        if alert.runModal() == .alertSecondButtonReturn { cancel(); return true }; return false
    }
}

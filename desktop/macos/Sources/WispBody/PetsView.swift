import AppKit

final class PetsView: NSView {
    weak var companion: CompanionController?
    private let status = NSTextField(wrappingLabelWithString:"")
    private let catalog = NSTextField(wrappingLabelWithString:"")
    private var bodyButtons: [ModelsButton] = []
    private let apply = ModelsButton(title:"Apply Body",target:nil,action:nil)
    private let revert = ModelsButton(title:"Revert Draft",target:nil,action:nil)
    private var base: PetSnapshot?
    private var dirty = false
    private var draftId = "wisp-orb"
    init(owner: CompanionController) {
        companion = owner; super.init(frame:.zero)
        catalog.font = .systemFont(ofSize:13); catalog.textColor = .secondaryLabelColor
        status.font = .systemFont(ofSize:13)
        bodyButtons = PetCatalog.selectable.enumerated().map { index, id in
            let button = ModelsButton(title:PetCatalog.title(id),target:nil,action:nil)
            button.setAccessibilityLabel(PetCatalog.title(id))
            button.setButtonType(.radio)
            button.tag = index
            button.target = self
            button.action = #selector(pickTagged(_:))
            return button
        }
        let bodies = NSStackView(views:bodyButtons); bodies.orientation = .vertical; bodies.spacing = 8
        let actions = NSStackView(views:[apply,revert]); actions.spacing = 10
        apply.target = self; apply.action = #selector(requestApply)
        revert.target = self; revert.action = #selector(cancel)
        let hint = NSTextField(wrappingLabelWithString:"This is the same Wisp. Identity, memory, models, voice, plugins, connections and skills persist. Apply Body saves the selected silhouette and does not restart reasoning. Cancel, Escape or Revert Draft leaves the saved body and on-screen drawing unchanged. Further official skins toward the eventual collection remain later; no marketplace, third-party pack, or extra skins were queried. Changing the body is not a permission grant.")
        let stack = NSStackView(views:[NSTextField(labelWithString:"Official bodies"),bodies,actions,status,NSTextField(labelWithString:"Catalog"),catalog,hint]); stack.orientation = .vertical; stack.alignment = .leading; stack.spacing = 12
        stack.translatesAutoresizingMaskIntoConstraints = false; addSubview(stack)
        NSLayoutConstraint.activate([stack.topAnchor.constraint(equalTo:topAnchor),stack.leadingAnchor.constraint(equalTo:leadingAnchor),stack.trailingAnchor.constraint(equalTo:trailingAnchor),stack.bottomAnchor.constraint(equalTo:bottomAnchor)])
        for view in [catalog,status,hint] { view.widthAnchor.constraint(equalTo:stack.widthAnchor).isActive = true }
        for control in focusControls {
            let action: (Bool) -> Void = { [weak self, weak control] backward in
                guard let control else { return }; self?.moveFocus(from:control,backward:backward)
            }
            (control as? ModelsButton)?.onTab = action
        }
        refresh()
    }
    required init?(coder: NSCoder) { fatalError("Programmatic view") }
    private var focusControls: [NSControl] { bodyButtons + [apply,revert] }
    private func moveFocus(from control: NSView, backward: Bool) {
        if let next = ModelsFocus.next(after:control,in:focusControls,backward:backward) { window?.makeFirstResponder(next) }
    }
    func refresh() {
        guard let owner = companion else { return }
        if !dirty, let saved = owner.petSnapshot, base?.revision != saved.revision { load(saved) }
        let allowed = PetApply.allowed(homeBusy:owner.homeBusy,ending:false)
        for button in bodyButtons { button.isEnabled = allowed && !owner.petApplying }
        apply.isEnabled = allowed && !owner.petApplying && (dirty || owner.petSnapshot == nil)
        revert.isEnabled = allowed && dirty
        for (index, button) in bodyButtons.enumerated() {
            let id = PetCatalog.selectable[index]
            mark(button,selected:draftId==id)
        }
        let rows = owner.petCatalog
        catalog.stringValue = rows.map { row in
            "\(row.title) — \(row.status.rawValue)\(row.canManage ? "" : " (cannot enable)")\n\(row.detail)"
        }.joined(separator:"\n\n")
        let folderNote = owner.petSnapshot == nil ? "\n"+PetApply.folderRequired : ""
        status.stringValue = owner.petStatus + folderNote + (dirty ? "\nUnsaved body draft." : "")
    }
    private func mark(_ button: NSButton, selected: Bool) { button.state = selected ? .on : .off }
    private func load(_ saved: PetSnapshot) {
        base = saved; draftId = saved.configuration.catalogId; dirty = false
    }
    @objc private func pickTagged(_ sender: NSButton) {
        let ids = PetCatalog.selectable
        guard sender.tag >= 0, sender.tag < ids.count else { return }
        pick(ids[sender.tag])
    }
    private func pick(_ id: String) {
        guard PetCatalog.selectable.contains(id) else { return }
        draftId = id; dirty = id != (base?.configuration.catalogId ?? "wisp-orb"); refresh()
    }
    @objc private func cancel() { if let saved = companion?.petSnapshot { load(saved) }; refresh() }
    private func confirm(_ title: String, _ detail: String, _ actionTitle: String, confirmed: @escaping () -> Void) {
        guard let window else { return }
        let alert = NSAlert(); alert.messageText = title; alert.informativeText = detail
        alert.addButton(withTitle:"Cancel"); alert.addButton(withTitle:actionTitle)
        alert.buttons[0].keyEquivalent = "\u{1b}"; alert.buttons[1].keyEquivalent = ""
        alert.beginSheetModal(for:window) { response in if response == .alertSecondButtonReturn { confirmed() } }
    }
    @objc private func requestApply() {
        let next = PetConfiguration(version:1,catalogId:draftId)
        if companion?.petSnapshot == nil {
            companion?.applyPets(next,expected:"") { [weak self] _ in self?.refresh() }
            return
        }
        guard let base else { return }
        if base.configuration.catalogId == draftId {
            companion?.applyPets(next,expected:base.revision) { [weak self] success in if success { self?.cancel() } else { self?.refresh() } }
            return
        }
        confirm("Apply this body?",PetApply.confirmDetail,"Apply Body") { [weak self] in self?.save() }
    }
    private func save() {
        guard let base else { return }
        var c = PetConfiguration(); c.catalogId = draftId
        companion?.applyPets(c,expected:base.revision) { [weak self] success in if success { self?.cancel() } else { self?.refresh() } }
    }
    func allowQuit() -> Bool {
        guard dirty else { return true }
        let alert = NSAlert(); alert.messageText = "An unsaved body draft is open."; alert.addButton(withTitle:"Keep Editing"); alert.addButton(withTitle:"Discard and Quit")
        if alert.runModal() == .alertSecondButtonReturn { cancel(); return true }; return false
    }
}

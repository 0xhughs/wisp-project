import AppKit

final class MemoryButton: NSButton {
    var onTab: ((Bool)->Void)?
    override var acceptsFirstResponder: Bool { isEnabled && !isHidden }
    override func keyDown(with event:NSEvent) {
        if event.keyCode == 48 { onTab?(event.modifierFlags.contains(.shift)); return }
        super.keyDown(with:event)
    }
}
final class MemoryPopup: NSPopUpButton {
    var onTab: ((Bool)->Void)?
    override var acceptsFirstResponder: Bool { isEnabled && !isHidden }
    override func keyDown(with event:NSEvent) {
        if event.keyCode == 48 { onTab?(event.modifierFlags.contains(.shift)); return }
        super.keyDown(with:event)
    }
}
final class MemoryTextView: NSTextView {
    var onTab: ((Bool)->Void)?
    override func insertTab(_ sender: Any?) { onTab?(false) }
    override func insertBacktab(_ sender: Any?) { onTab?(true) }
}

// This editor manages entries, not conversation. Drafts survive section/window navigation.
final class MemoryEditorView: NSStackView {
    weak var companion: CompanionController?
    private let category = MemoryPopup(), entries = MemoryPopup()
    private let text = MemoryTextView(), status = NSTextField(wrappingLabelWithString:"")
    private let add = MemoryButton(title:"Add",target:nil,action:nil), edit = MemoryButton(title:"Edit",target:nil,action:nil)
    private let save = MemoryButton(title:"Save",target:nil,action:nil), cancel = MemoryButton(title:"Cancel",target:nil,action:nil)
    private let delete = MemoryButton(title:"Delete…",target:nil,action:nil), reload = MemoryButton(title:"Reload",target:nil,action:nil)
    private var snapshot: MemorySnapshot?, displayedRevision: String?, draft: MemoryEntry?, base: MemorySnapshot?
    var hasDraft: Bool { draft != nil }
    init(owner: CompanionController) {
        companion = owner; super.init(frame:.zero)
        orientation = .vertical; alignment = .leading; spacing = 10
        let help = NSTextField(wrappingLabelWithString:"Keep preferences, projects, standing instructions and facts. No credentials. Up to 64 entries, 2,000 characters per entry and 32 KiB total.")
        help.textColor = .secondaryLabelColor
        category.addItems(withTitles:MemoryCategory.allCases.map(\.title)); category.setAccessibilityLabel("Memory category")
        entries.setAccessibilityLabel("Memory entries")
        category.target = self; category.action = #selector(selectCategory)
        entries.target = self; entries.action = #selector(selectEntry)
        let scroll = NSScrollView(); scroll.hasVerticalScroller = true; scroll.borderType = .bezelBorder; scroll.documentView = text
        text.isRichText = false; text.isAutomaticQuoteSubstitutionEnabled = false; text.isAutomaticDashSubstitutionEnabled = false
        text.isAutomaticTextReplacementEnabled = false; text.isContinuousSpellCheckingEnabled = false
        text.font = .systemFont(ofSize:14); text.isEditable = false; text.isVerticallyResizable = true
        text.textContainer?.widthTracksTextView = true; text.autoresizingMask = [.width]; text.setAccessibilityLabel("Memory text")
        let buttons = NSStackView(views:[add,edit,save,cancel,delete,reload]); buttons.spacing = 6
        for (button,action) in [(add,#selector(beginAdd)),(edit,#selector(beginEdit)),(save,#selector(saveDraft)),(cancel,#selector(cancelDraft)),(delete,#selector(deleteEntry)),(reload,#selector(reloadMemory))] { button.target = self; button.action = action }
        for view in [help,category,entries,scroll,buttons,status] { addArrangedSubview(view); view.translatesAutoresizingMaskIntoConstraints = false }
        for view in [help,entries,scroll,status] { view.widthAnchor.constraint(equalTo:widthAnchor).isActive = true }
        scroll.heightAnchor.constraint(equalToConstant:130).isActive = true
        // Explicit native focus traversal avoids depending on the optional OS full-keyboard setting.
        let focus: [NSView] = [category,entries,add,edit,text,save,cancel,delete,reload]
        for (index,view) in focus.enumerated() {
            let action: (Bool)->Void = { [weak self] backward in self?.moveFocus(from:index,backward:backward) }
            if let button = view as? MemoryButton { button.onTab = action }
            if let popup = view as? MemoryPopup { popup.onTab = action }
            if let editor = view as? MemoryTextView { editor.onTab = action }
        }
        text.minSize = NSSize(width:0,height:130); text.maxSize = NSSize(width:CGFloat.greatestFiniteMagnitude,height:CGFloat.greatestFiniteMagnitude)
        status.font = .systemFont(ofSize:12); status.setAccessibilityLabel("Memory save status")
        refresh()
    }
    required init(coder:NSCoder) { fatalError("Programmatic view") }
    private func moveFocus(from index:Int, backward:Bool) {
        let views: [NSView] = [category,entries,add,edit,text,save,cancel,delete,reload]
        for offset in 1...views.count {
            let next = views[(index + (backward ? -offset : offset) + views.count) % views.count]
            if next === text && !text.isEditable { continue }
            if let control = next as? NSControl, !control.isEnabled { continue }
            if !next.isHidden, window?.makeFirstResponder(next) == true { return }
        }
    }
    private var selectedCategory: MemoryCategory { MemoryCategory.allCases[max(0,category.indexOfSelectedItem)] }
    private var listed: [MemoryEntry] { snapshot?.document.entries.filter{$0.category == selectedCategory} ?? [] }
    private var selected: MemoryEntry? { listed.indices.contains(entries.indexOfSelectedItem) ? listed[entries.indexOfSelectedItem] : nil }
    func refresh() {
        guard let owner = companion else { return }
        snapshot = owner.memorySnapshot
        if draft == nil, displayedRevision != snapshot?.revision { rebuild(); displayedRevision = snapshot?.revision }
        let available = snapshot != nil && !owner.homeBusy && owner.memoryUsable
        category.isEnabled = draft == nil && !owner.homeBusy
        entries.isEnabled = available && draft == nil
        add.isEnabled = available && draft == nil; edit.isEnabled = available && draft == nil && selected != nil
        save.isEnabled = available && draft != nil; cancel.isEnabled = draft != nil && !owner.homeBusy
        delete.isEnabled = available && draft == nil && selected != nil; reload.isEnabled = !owner.homeBusy && draft == nil
        text.isEditable = draft != nil && !owner.homeBusy
        status.stringValue = owner.memoryStatus + (draft == nil ? "" : "\nUnsaved draft retained until Save or Cancel.")
    }
    private func rebuild() {
        entries.removeAllItems(); entries.addItems(withTitles:listed.map{String($0.text.replacingOccurrences(of:"\n",with:" ").prefix(70))})
        if listed.isEmpty { entries.addItem(withTitle:"No entries in this category") }
        text.string = selected?.text ?? ""
    }
    @objc private func selectCategory() { rebuild(); refresh() }
    @objc private func selectEntry() { text.string = selected?.text ?? ""; refresh() }
    @objc private func beginAdd() {
        guard let snapshot else { return }; base = snapshot
        draft = MemoryEntry(id:UUID().uuidString.lowercased(),category:selectedCategory,text:"")
        text.string = ""; refresh(); window?.makeFirstResponder(text)
    }
    @objc private func beginEdit() { guard let selected,let snapshot else { return }; base = snapshot; draft = selected; text.string = selected.text; refresh(); window?.makeFirstResponder(text) }
    @objc private func cancelDraft() { draft = nil; base = nil; rebuild(); refresh() }
    @objc private func saveDraft() {
        guard var draft,let base else { return }; draft.text = text.string
        var document = base.document
        if let index = document.entries.firstIndex(where:{$0.id == draft.id}) { document.entries[index] = draft } else { document.entries.append(draft) }
        companion?.saveMemory(document,expected:base.revision) { [weak self] success in if success { self?.cancelDraft() } }
    }
    @objc private func deleteEntry() {
        guard let selected,let snapshot,let window else { return }
        let alert = NSAlert(); alert.messageText = "Delete this memory entry?"; alert.informativeText = "\(selected.category.title)\n\n\(selected.text)"
        alert.addButton(withTitle:"Cancel"); alert.addButton(withTitle:"Delete")
        alert.beginSheetModal(for:window) { [weak self] response in
            guard response == .alertSecondButtonReturn else { return }
            var document = snapshot.document; document.entries.removeAll{$0.id == selected.id}
            self?.companion?.saveMemory(document,expected:snapshot.revision) { _ in }
        }
    }
    @objc private func reloadMemory() { companion?.reloadMemory() }
    func allowQuit() -> Bool {
        guard hasDraft else { return true }
        let alert = NSAlert(); alert.messageText = "An unsaved memory draft is open."; alert.informativeText = "Keep editing to save it, or discard this draft and quit."
        alert.addButton(withTitle:"Keep Editing"); alert.addButton(withTitle:"Discard and Quit")
        if alert.runModal() == .alertSecondButtonReturn { cancelDraft(); return true }; return false
    }
}

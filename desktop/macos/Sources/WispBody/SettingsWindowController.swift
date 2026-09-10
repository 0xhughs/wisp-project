import AppKit

final class SettingsWindowController: NSWindowController, NSTableViewDataSource, NSTableViewDelegate, NSWindowDelegate {
    weak var companion: CompanionController?
    private let chooseButton = NSButton(title: "Choose Wisp Folder…", target: nil, action: nil)
    private var memoryEditor: MemoryEditorView!
    private var voiceEditor:VoiceView!
    private var modelsEditor: ModelsView!
    private var pluginsEditor: PluginsView!
    private var connectionsEditor: ConnectionsView!
    private var skillsEditor: SkillsView!
    private var petsEditor: PetsView!
    private var permissionsEditor: PermissionsView!
    private var diagnosticsEditor: DiagnosticsView!
    private let navigation = NSTableView()
    private let heading = NSTextField(labelWithString: "General")
    private let detail = NSTextField(wrappingLabelWithString: "")
    private let showButton = NSButton(title: "Show Companion", target: nil, action: nil)
    init(owner: CompanionController) {
        self.companion = owner
        let window = NSWindow(contentRect: NSRect(x: 0,y: 0,width: 860,height: 700), styleMask: [.titled,.closable,.miniaturizable,.resizable], backing: .buffered, defer: false)
        window.title = "Wisp Settings"; window.isReleasedWhenClosed = false
        window.minSize = NSSize(width: 820,height: 680); window.center()
        super.init(window: window)
        window.delegate = self
        let root = NSView(); window.contentView = root
        let scroll = NSScrollView(); scroll.hasVerticalScroller = true
        navigation.addTableColumn(NSTableColumn(identifier: NSUserInterfaceItemIdentifier("section")))
        navigation.headerView = nil; navigation.rowHeight = 34; navigation.intercellSpacing = NSSize(width: 0,height: 2)
        navigation.dataSource = self; navigation.delegate = self; navigation.allowsEmptySelection = false
        navigation.setAccessibilityLabel("Settings sections")
        scroll.documentView = navigation
        heading.font = .systemFont(ofSize: 25,weight: .semibold)
        detail.font = .systemFont(ofSize: 15); detail.textColor = .secondaryLabelColor
        showButton.target = self; showButton.action = #selector(showCompanion)
        chooseButton.target = self; chooseButton.action = #selector(chooseFolder)
        memoryEditor = MemoryEditorView(owner: owner)
        modelsEditor = ModelsView(owner: owner)
        voiceEditor = VoiceView(owner:owner)
        pluginsEditor = PluginsView(owner: owner)
        connectionsEditor = ConnectionsView(owner: owner)
        skillsEditor = SkillsView(owner: owner)
        petsEditor = PetsView(owner: owner)
        permissionsEditor = PermissionsView(owner: owner)
        diagnosticsEditor = DiagnosticsView()
        diagnosticsEditor.refreshHandler = { [weak self] in self?.companion?.refreshOnboarding() }
        let content = NSStackView(views: [heading,detail,showButton,chooseButton,memoryEditor,modelsEditor,voiceEditor,petsEditor,pluginsEditor,connectionsEditor,skillsEditor,permissionsEditor,diagnosticsEditor]); content.orientation = .vertical; content.alignment = .leading; content.spacing = 14
        for view in [scroll,content] { view.translatesAutoresizingMaskIntoConstraints = false; root.addSubview(view) }
        NSLayoutConstraint.activate([
            scroll.leadingAnchor.constraint(equalTo: root.leadingAnchor,constant: 12), scroll.topAnchor.constraint(equalTo: root.topAnchor,constant: 14), scroll.bottomAnchor.constraint(equalTo: root.bottomAnchor,constant: -14), scroll.widthAnchor.constraint(equalToConstant: 180),
            content.leadingAnchor.constraint(equalTo: scroll.trailingAnchor,constant: 30),content.trailingAnchor.constraint(equalTo: root.trailingAnchor,constant: -30),content.topAnchor.constraint(equalTo: root.topAnchor,constant: 35), content.bottomAnchor.constraint(lessThanOrEqualTo: root.bottomAnchor,constant: -30),detail.widthAnchor.constraint(equalTo: content.widthAnchor),memoryEditor.widthAnchor.constraint(equalTo: content.widthAnchor),modelsEditor.widthAnchor.constraint(equalTo:content.widthAnchor),petsEditor.widthAnchor.constraint(equalTo:content.widthAnchor),pluginsEditor.widthAnchor.constraint(equalTo:content.widthAnchor),connectionsEditor.widthAnchor.constraint(equalTo:content.widthAnchor),skillsEditor.widthAnchor.constraint(equalTo:content.widthAnchor),permissionsEditor.widthAnchor.constraint(equalTo:content.widthAnchor),diagnosticsEditor.widthAnchor.constraint(equalTo:content.widthAnchor)
        ])
        refresh(owner.management)
    }
    required init?(coder: NSCoder) { fatalError("Programmatic window") }
    func numberOfRows(in tableView: NSTableView) -> Int { ManagementSection.allCases.count }
    func tableView(_ tableView: NSTableView, viewFor tableColumn: NSTableColumn?, row: Int) -> NSView? {
        NSTextField(labelWithString: ManagementSection.allCases[row].rawValue)
    }
    func tableViewSelectionDidChange(_ notification: Notification) {
        guard ManagementSection.allCases.indices.contains(navigation.selectedRow) else { return }
        companion?.selectSection(ManagementSection.allCases[navigation.selectedRow])
    }
    func refresh(_ state: ManagementState) {
        let index = ManagementSection.allCases.firstIndex(of: state.section)!
        if navigation.selectedRow != index { navigation.selectRowIndexes(IndexSet(integer: index),byExtendingSelection: false) }
        heading.stringValue = state.section.rawValue
        if state.section == .diagnostics {
            detail.isHidden = true
            diagnosticsEditor.show(companion?.diagnosticsText ?? DiagnosticsSnapshot.redact(state.description))
        } else {
            detail.isHidden = false
            detail.stringValue = companion?.managementDescription ?? state.description
        }
        diagnosticsEditor.isHidden = state.section != .diagnostics
        chooseButton.isHidden = state.section != .general && state.section != .memory
        chooseButton.isEnabled = companion?.homeBusy == false
        voiceEditor.isHidden = state.section != .voice;voiceEditor.refresh()
        modelsEditor.isHidden = state.section != .models; modelsEditor.refresh()
        petsEditor.isHidden = state.section != .pets; petsEditor.refresh()
        pluginsEditor.isHidden = state.section != .plugins; pluginsEditor.refresh()
        connectionsEditor.isHidden = state.section != .connections; connectionsEditor.refresh()
        skillsEditor.isHidden = state.section != .skills; skillsEditor.refresh()
        permissionsEditor.isHidden = state.section != .permissions
        if state.section == .permissions { permissionsEditor.refresh() }
        memoryEditor.isHidden = state.section != .memory; memoryEditor.refresh()
        showButton.isHidden = state.section != .general; showButton.isEnabled = state.canShowCompanion
        navigation.isEnabled = state.canNavigate
    }
    func present() {
        if window?.isMiniaturized == true { window?.deminiaturize(nil) }
        NSApp.activate(ignoringOtherApps: true)
        window?.makeKeyAndOrderFront(nil); window?.makeFirstResponder(navigation)
    }
    func allowQuit() -> Bool { memoryEditor.allowQuit() && modelsEditor.allowQuit() && petsEditor.allowQuit() && pluginsEditor.allowQuit() && connectionsEditor.allowQuit() && skillsEditor.allowQuit() }
    @objc private func chooseFolder() {
        guard let window else { return }
        let panel = NSOpenPanel(); panel.canChooseDirectories = true; panel.canChooseFiles = false; panel.allowsMultipleSelection = false; panel.resolvesAliases = false
        panel.prompt = "Choose Folder"; panel.message = "Choose an empty dedicated folder, or locate the same Wisp home. Your files and memory stay here."
        panel.beginSheetModal(for: window) { [weak self] response in
            if response == .OK, let url = panel.url { self?.companion?.chooseHome(url) }
        }
    }
    @objc private func showCompanion() { companion?.showCompanion() }
    func windowWillClose(_ notification: Notification) { companion?.shellFacts("settings-closed") }
    func windowDidBecomeKey(_ notification: Notification) { companion?.shellFacts("settings-key") }
}

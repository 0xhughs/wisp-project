import AppKit

final class MenuBarController: NSObject {
    private(set) var item: NSStatusItem?
    private let menu = NSMenu()
    weak var owner: CompanionController?
    private let route = NSMenuItem(title:"Reasoning is not attached",action:nil,keyEquivalent:"")
    private let status = NSMenuItem(title: "Engine: Starting", action: nil, keyEquivalent: "")
    init(owner: CompanionController) {
        self.owner = owner
        super.init()
        let item = NSStatusBar.system.statusItem(withLength: NSStatusItem.variableLength)
        self.item = item
        item.button?.title = "Wisp"
        item.button?.setAccessibilityLabel("Wisp")
        menu.autoenablesItems = false
        menu.addItem(status); status.isEnabled = false
        add("Wake / Finish / Cancel", #selector(wake))
        add("Mute Voice", #selector(mute))
        route.isEnabled=false;menu.addItem(route)
        menu.addItem(.separator())
        add("Change Pet…", #selector(pets))
        add("Change Model…", #selector(models))
        add("Settings…", #selector(settings), key: ",")
        add("Memory…", #selector(memory))
        menu.addItem(.separator())
        add("Quit Wisp", #selector(quit), key: "q")
        item.menu = menu
    }
    private func add(_ title: String, _ action: Selector?, enabled: Bool = true, key: String = "") {
        let row = NSMenuItem(title: title, action: action, keyEquivalent: key)
        row.target = self; row.isEnabled = enabled; menu.addItem(row)
    }
    func refresh(_ state: ManagementState) { route.title=owner?.voiceRouteDescription ?? "Reasoning is not attached";status.title = "Engine: \(state.lifecycle.rawValue) · Voice: \(owner?.voice.state.phase.rawValue ?? "unavailable")";menu.items[2].title = owner?.voice.configuration.muted == true ? "Unmute Voice":"Mute Voice" }
    func dispose() { if let item { item.menu = nil; NSStatusBar.system.removeStatusItem(item); self.item = nil } }
    @objc private func wake(){owner?.wakeVoice()}
    @objc private func mute(){owner?.toggleVoiceMute()}
    @objc private func settings() { owner?.openSettings() }
    @objc private func memory() { owner?.openSettings(.memory) }
    @objc private func pets() { owner?.openSettings(.pets) }
    @objc private func models() { owner?.openSettings(.models) }
    @objc private func quit() { NSApp.terminate(nil) }
}

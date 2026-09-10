import AppKit

final class ModelsView: NSView, NSTextFieldDelegate {
    weak var companion: CompanionController?
    private let provider=ModelsPopup(), cloudModel=ModelsPopup()
    private let localModel=NSTextField(), endpoint=NSTextField(), key=NSSecureTextField()
    private let localGroup=NSStackView(), cloudGroup=NSStackView()
    private let status=NSTextField(wrappingLabelWithString:""), credential=NSTextField(labelWithString:"")
    private let apply=ModelsButton(title:"Save and Apply",target:nil,action:nil)
    private let revert=ModelsButton(title:"Revert Draft",target:nil,action:nil)
    private let test=ModelsButton(title:"Test Connection",target:nil,action:nil)
    private let reload=ModelsButton(title:"Reload Saved",target:nil,action:nil)
    private let remove=ModelsButton(title:"Remove Key…",target:nil,action:nil)
    private var base: ReasoningSnapshot?
    private var dirty=false
    init(owner: CompanionController) {
        companion=owner; super.init(frame:.zero)
        provider.addItems(withTitles:["Local Ollama","DeepSeek cloud"])
        cloudModel.addItems(withTitles:ReasoningConfiguration.cloudModels)
        provider.target=self; provider.action=#selector(providerChanged)
        cloudModel.target=self; cloudModel.action=#selector(edited)
        for (field,label) in [(localModel,"Ollama model"),(endpoint,"Ollama address"),(key,"New DeepSeek API key")] {
            field.delegate=self; field.setAccessibilityLabel(label)
        }
        key.placeholderString="Leave empty to keep the stored key"
        provider.setAccessibilityLabel("Reasoning provider"); cloudModel.setAccessibilityLabel("DeepSeek model")
        localGroup.orientation = .vertical; localGroup.alignment = .leading; localGroup.spacing=8
        for view in [NSTextField(labelWithString:"Existing Ollama model"),localModel,NSTextField(labelWithString:"Loopback address"),endpoint,NSTextField(wrappingLabelWithString:"Ollama must already be running. No downloads or hardware recommendations are included. Other local model identifiers are unverified until tested; Wisp uses a bounded text-only configuration.")] { localGroup.addArrangedSubview(view) }
        cloudGroup.orientation = .vertical; cloudGroup.alignment = .leading; cloudGroup.spacing=8
        for view in [NSTextField(labelWithString:"DeepSeek model"),cloudModel,credential,NSTextField(labelWithString:"Add or replace API key"),key,remove,NSTextField(wrappingLabelWithString:"Keys stay in macOS Keychain. Requests use api.deepseek.com. Listed models come from the installed catalog; account access is checked by a connection test.")] { cloudGroup.addArrangedSubview(view) }
        let actions=NSStackView(views:[apply,revert,test,reload]); actions.spacing=10
        for (button,action) in [(apply,#selector(save)),(revert,#selector(cancel)),(test,#selector(testConnection)),(remove,#selector(removeKey)),(reload,#selector(reloadSaved))] { button.target=self; button.action=action }
        let note=NSTextField(wrappingLabelWithString:"Applying restarts reasoning and may interrupt its current test. Wisp's identity and saved memory stay the same. Speech settings are separate. Test Connection sends a small fixed request; cloud tests may use API credits.")
        let stack=NSStackView(views:[provider,localGroup,cloudGroup,actions,status,note]); stack.orientation = .vertical; stack.alignment = .leading; stack.spacing=14
        stack.translatesAutoresizingMaskIntoConstraints=false; addSubview(stack)
        NSLayoutConstraint.activate([stack.topAnchor.constraint(equalTo:topAnchor),stack.leadingAnchor.constraint(equalTo:leadingAnchor),stack.trailingAnchor.constraint(equalTo:trailingAnchor),stack.bottomAnchor.constraint(equalTo:bottomAnchor)])
        for view in [localGroup,cloudGroup,status,note] { view.widthAnchor.constraint(equalTo:stack.widthAnchor).isActive=true }
        for field in [localModel,endpoint,key] { field.widthAnchor.constraint(equalTo:stack.widthAnchor).isActive=true }
        for control in focusControls {
            let action: (Bool) -> Void = { [weak self, weak control] backward in
                guard let control else { return }; self?.moveFocus(from:control,backward:backward)
            }
            (control as? ModelsButton)?.onTab=action
            (control as? ModelsPopup)?.onTab=action
        }
        refresh()
    }
    required init?(coder:NSCoder) { fatalError("Programmatic view") }
    func refresh() {
        guard let owner=companion else { return }
        if !dirty,let saved=owner.reasoningSnapshot,base?.revision != saved.revision { load(saved) }
        let available=base != nil && !owner.modelBusy && !owner.homeBusy
        for control in [provider,cloudModel,localModel,endpoint,key,apply,revert] as [NSControl] { control.isEnabled=available }
        reload.isEnabled=owner.memorySnapshot != nil && !owner.modelBusy && !owner.homeBusy && !dirty
        remove.isEnabled=available && !(owner.reasoningSnapshot?.configuration.cloudKeyID.isEmpty ?? true)
        test.isEnabled=available && owner.activeModel != nil && !owner.modelTesting
        localGroup.isHidden=provider.indexOfSelectedItem != 0; cloudGroup.isHidden=provider.indexOfSelectedItem == 0
        credential.stringValue=(owner.reasoningSnapshot?.configuration.cloudKeyID.isEmpty ?? true) ? "No API key stored" : "API key stored in Keychain"
        status.stringValue="Saved: \(owner.reasoningSnapshot?.configuration.label ?? "not configured")\nActive: \(owner.activeModel ?? "unavailable")\n"+owner.modelStatus+(dirty ? "\nUnsaved model draft." : "")
    }
    private var focusControls: [NSControl] { [provider,localModel,endpoint,cloudModel,key,remove,apply,revert,test,reload] }
    private func moveFocus(from control: NSView, backward: Bool) {
        if let next=ModelsFocus.next(after:control,in:focusControls,backward:backward) { window?.makeFirstResponder(next) }
    }
    func control(_ control: NSControl, textView: NSTextView, doCommandBy commandSelector: Selector) -> Bool {
        if commandSelector == #selector(NSResponder.insertTab(_:)) { moveFocus(from:control,backward:false); return true }
        if commandSelector == #selector(NSResponder.insertBacktab(_:)) { moveFocus(from:control,backward:true); return true }
        return false
    }
    private func load(_ saved: ReasoningSnapshot) {
        base=saved; let c=saved.configuration
        provider.selectItem(at:c.selected == "local" ? 0:1);localModel.stringValue=c.localModel;endpoint.stringValue=c.localEndpoint;cloudModel.selectItem(withTitle:c.cloudModel); key.stringValue="";dirty=false
    }
    func controlTextDidChange(_ obj:Notification) { dirty=true; refresh() }
    @objc private func edited() { dirty=true; refresh() }
    @objc private func providerChanged() { dirty=true; refresh() }
    @objc private func cancel() { if let saved=companion?.reasoningSnapshot { load(saved) }; refresh() }
    @objc private func save() {
        guard let base else { return }
        var c=base.configuration; c.selected=provider.indexOfSelectedItem == 0 ? "local":"deepseek";c.localModel=localModel.stringValue;c.localEndpoint=endpoint.stringValue;c.cloudModel=cloudModel.titleOfSelectedItem ?? ""
        let newKey = c.selected == "deepseek" && !key.stringValue.isEmpty ? key.stringValue:nil
        companion?.applyModels(c,expected:base.revision,key:newKey) { [weak self] success in if success { self?.cancel() } else { self?.refresh() } }
    }
    @objc private func reloadSaved() { companion?.reloadModels { [weak self] success in if success { self?.cancel() } } }
    @objc private func testConnection() { companion?.testModelConnection() }
    @objc private func removeKey() {
        guard let window else { return }
        let alert=NSAlert(); alert.messageText="Remove this Wisp's DeepSeek API key?";alert.informativeText="This deletes only the locally saved key and stops reasoning using it. Your provider account and memory are unchanged."
        alert.addButton(withTitle:"Cancel");alert.addButton(withTitle:"Remove Key")
        // Explicit equivalent keeps this destructive confirmation reachable without changing OS preferences.
        alert.buttons[0].keyEquivalent="\u{1b}"
        alert.buttons[1].keyEquivalent="r"; alert.buttons[1].keyEquivalentModifierMask=[.command]
        alert.informativeText += " Press Escape to cancel or Command-R to remove the local key."
        alert.beginSheetModal(for:window) { [weak self] response in
            guard response == .alertSecondButtonReturn else { return }
            self?.companion?.removeModelKey { success in if success { self?.cancel() } }
        }
    }
    func allowQuit() -> Bool {
        guard dirty else { return true }
        let alert=NSAlert();alert.messageText="An unsaved model draft is open.";alert.addButton(withTitle:"Keep Editing");alert.addButton(withTitle:"Discard and Quit")
        if alert.runModal() == .alertSecondButtonReturn { cancel();return true };return false
    }
}

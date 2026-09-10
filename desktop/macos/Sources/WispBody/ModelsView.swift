import AppKit

final class ModelsView: NSView, NSTextFieldDelegate {
    weak var companion: CompanionController?
    private let provider=ModelsPopup(), cloudModel=ModelsPopup()
    private let localModel=NSTextField(), endpoint=NSTextField(), key=NSSecureTextField()
    private let localGroup=NSStackView(), cloudGroup=NSStackView()
    private let status=NSTextField(wrappingLabelWithString:""), credential=NSTextField(labelWithString:"")
    private let onboarding=NSTextField(wrappingLabelWithString:"")
    private let apply=ModelsButton(title:"Save and Apply",target:nil,action:nil)
    private let revert=ModelsButton(title:"Revert Draft",target:nil,action:nil)
    private let test=ModelsButton(title:"Test Connection",target:nil,action:nil)
    private let reload=ModelsButton(title:"Reload Saved",target:nil,action:nil)
    private let remove=ModelsButton(title:"Remove Key…",target:nil,action:nil)
    private let refreshHardware=ModelsButton(title:"Refresh hardware and Ollama",target:nil,action:nil)
    private let useFaster=ModelsButton(title:"Use Faster",target:nil,action:nil)
    private let useRecommended=ModelsButton(title:"Use Recommended",target:nil,action:nil)
    private let useStronger=ModelsButton(title:"Use Stronger",target:nil,action:nil)
    private let useCloud=ModelsButton(title:"Use Cloud",target:nil,action:nil)
    private let install=ModelsButton(title:"Install recommended…",target:nil,action:nil)
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
        refreshHardware.setAccessibilityLabel("Refresh hardware and Ollama")
        useRecommended.setAccessibilityLabel("Use Recommended local model")
        useFaster.setAccessibilityLabel("Use Faster local model")
        useStronger.setAccessibilityLabel("Use Stronger local model")
        useCloud.setAccessibilityLabel("Use DeepSeek cloud")
        install.setAccessibilityLabel("Install recommended local model")
        localGroup.orientation = .vertical; localGroup.alignment = .leading; localGroup.spacing=8
        for view in [NSTextField(labelWithString:"Existing Ollama model"),localModel,NSTextField(labelWithString:"Loopback address"),endpoint,NSTextField(wrappingLabelWithString:"Ollama must already be installed and listening on this loopback address. Hardware recommendations appear above; they are not a promise the model runs comfortably. Other local model identifiers are unverified until tested; Wisp uses a bounded text-only configuration. Wisp does not download models without a consented resource plan.")] { localGroup.addArrangedSubview(view) }
        cloudGroup.orientation = .vertical; cloudGroup.alignment = .leading; cloudGroup.spacing=8
        for view in [NSTextField(labelWithString:"DeepSeek model"),cloudModel,credential,NSTextField(labelWithString:"Add or replace API key"),key,remove,NSTextField(wrappingLabelWithString:"Keys stay in macOS Keychain. Requests use api.deepseek.com. Listed models come from the installed catalog; account access is checked by a connection test.")] { cloudGroup.addArrangedSubview(view) }
        let onboardingActions=NSStackView(views:[refreshHardware,useFaster,useRecommended,useStronger,useCloud,install]); onboardingActions.spacing=8
        let actions=NSStackView(views:[apply,revert,test,reload]); actions.spacing=10
        for (button,action) in [(apply,#selector(save)),(revert,#selector(cancel)),(test,#selector(testConnection)),(remove,#selector(removeKey)),(reload,#selector(reloadSaved)),(refreshHardware,#selector(refreshInspect)),(useFaster,#selector(applyFaster)),(useRecommended,#selector(applyRecommended)),(useStronger,#selector(applyStronger)),(useCloud,#selector(applyCloud)),(install,#selector(installRecommended))] { button.target=self; button.action=action }
        let heading=NSTextField(labelWithString:"Hardware-aware onboarding")
        let note=NSTextField(wrappingLabelWithString:"Applying restarts reasoning and may interrupt its current test. Wisp's identity, saved memory, voice settings and plugin composition stay the same. Speech engines stay independent of the model catalog. Test Connection sends a small fixed request; cloud tests may use API credits. Refresh never starts the microphone, never sends session/prompt, never tests the connection and never pulls a model.")
        let stack=NSStackView(views:[heading,onboarding,onboardingActions,provider,localGroup,cloudGroup,actions,status,note]); stack.orientation = .vertical; stack.alignment = .leading; stack.spacing=14
        stack.translatesAutoresizingMaskIntoConstraints=false; addSubview(stack)
        NSLayoutConstraint.activate([stack.topAnchor.constraint(equalTo:topAnchor),stack.leadingAnchor.constraint(equalTo:leadingAnchor),stack.trailingAnchor.constraint(equalTo:trailingAnchor),stack.bottomAnchor.constraint(equalTo:bottomAnchor)])
        for view in [localGroup,cloudGroup,status,note,onboarding] { view.widthAnchor.constraint(equalTo:stack.widthAnchor).isActive=true }
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
        let available=base != nil && ModelsApply.allowed(modelBusy:owner.modelBusy,homeBusy:owner.homeBusy)
        for control in [provider,cloudModel,localModel,endpoint,key,apply,revert] as [NSControl] { control.isEnabled=available }
        reload.isEnabled=owner.memorySnapshot != nil && !owner.modelBusy && !owner.homeBusy && !dirty
        remove.isEnabled=available && !(owner.reasoningSnapshot?.configuration.cloudKeyID.isEmpty ?? true)
        test.isEnabled=available && owner.activeModel != nil && !owner.modelTesting
        refreshHardware.isEnabled = !owner.homeBusy
        let rec=owner.onboarding
        useRecommended.isEnabled=available
        useFaster.isEnabled=available && rec?.choice("faster")?.usable == true
        useStronger.isEnabled=available && rec?.choice("stronger")?.usable == true
        useCloud.isEnabled=available
        install.isEnabled=available && OnboardingInstall.enabled(plan:owner.resourcePlan)
        localGroup.isHidden=provider.indexOfSelectedItem != 0; cloudGroup.isHidden=provider.indexOfSelectedItem == 0
        credential.stringValue=(owner.reasoningSnapshot?.configuration.cloudKeyID.isEmpty ?? true) ? "No API key stored" : "API key stored in Keychain"
        onboarding.stringValue=OnboardingDiagnostics.panelText(snapshot:owner.hardwareSnapshot,inspect:owner.ollamaInspect,record:owner.onboarding)
        status.stringValue="Saved: \(owner.reasoningSnapshot?.configuration.label ?? "not configured")\nActive: \(owner.activeModel ?? "unavailable")\n"+owner.modelStatus+(dirty ? "\nUnsaved model draft." : "")+(OnboardingInstall.enabled(plan:owner.resourcePlan) ? "" : "\nInstall remains disabled until a consented resource plan is present.")
    }
    private var focusControls: [NSControl] { [refreshHardware,useFaster,useRecommended,useStronger,useCloud,install,provider,localModel,endpoint,cloudModel,key,remove,apply,revert,test,reload] }
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
    @objc private func refreshInspect() { companion?.refreshOnboarding() }
    @objc private func applyRecommended() { applySlot("recommended") }
    @objc private func applyFaster() { applySlot("faster") }
    @objc private func applyStronger() { applySlot("stronger") }
    @objc private func applyCloud() { applySlot("cloud") }
    @objc private func installRecommended() { companion?.requestOnboardingInstall() }
    private func applySlot(_ slot: String) {
        guard let base, let owner=companion else { return }
        var c=base.configuration
        if slot == "cloud" { c.selected="deepseek" }
        else if slot == "recommended" { c.selected="local"; c.localModel="qwen3:8b" }
        else {
            guard let identifier=owner.onboarding?.choice(slot)?.identifier, !identifier.isEmpty else { return }
            c.selected="local"; c.localModel=identifier
        }
        if let saved=owner.reasoningSnapshot, ModelsApply.isUnchanged(draft:c,saved:saved.configuration,key:nil) {
            owner.applyModels(c,expected:base.revision,key:nil) { [weak self] success in if success { self?.cancel() } else { self?.refresh() } }
            return
        }
        confirm("Apply this reasoning choice?","Wisp will restart reasoning with this saved route. Identity, selected home, durable memory, voice settings and plugin composition stay the same. Cancel leaves the current saved route unchanged. This does not download a model or test the connection.","Apply") { [weak self] in
            self?.companion?.applyModels(c,expected:base.revision,key:nil) { success in if success { self?.cancel() } else { self?.refresh() } }
        }
    }
    private func confirm(_ title: String, _ detail: String, _ actionTitle: String, confirmed: @escaping () -> Void) {
        guard let window else { return }
        let alert=NSAlert(); alert.messageText=title; alert.informativeText=detail
        alert.addButton(withTitle:"Cancel"); alert.addButton(withTitle:actionTitle)
        alert.buttons[0].keyEquivalent="\u{1b}"; alert.buttons[1].keyEquivalent=""
        alert.beginSheetModal(for:window) { response in if response == .alertSecondButtonReturn { confirmed() } }
    }
    @objc private func removeKey() {
        guard let window else { return }
        let alert=NSAlert(); alert.messageText="Remove this Wisp's DeepSeek API key?";alert.informativeText="This deletes only the locally saved key and stops reasoning using it. Your provider account and memory are unchanged."
        alert.addButton(withTitle:"Cancel");alert.addButton(withTitle:"Remove Key")
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

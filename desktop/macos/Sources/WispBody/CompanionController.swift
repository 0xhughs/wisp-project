import AppKit
final class CompanionController:NSObject,NSApplicationDelegate {
    let identity=UUID().uuidString
    private(set) var state=BodyState()
    private(set) var management=ManagementState()
    let voice:VoiceController
    private let voiceSession:VoiceLifecycle
    private let voiceShortcut=VoiceShortcut()
    private var voiceStore:VoiceStore?
    private var menuBar:MenuBarController?
    private var settings:SettingsWindowController?
    private(set) var body:MascotPanel?
    private var bridge=EngineBridge()
    private(set) var permissions:PermissionState {
        get { voiceSession.permissions }
        set { voiceSession.permissions = newValue }
    }
    private var permissionWindow:PermissionWindow?
    private var operations=BridgeOperationState()
    private var workspaceOpener:WorkspaceOpening=NativeWorkspaceOpener()
    private var accessibilityDriver:AccessibilityPerforming=NativeAccessibilityDriver()
    private var visualDriver:VisualClickPerforming=NativeVisualClickDriver()
    private var bridgeGeneration=0
    private var restartAction: (() -> Void)?
    private var reasoningStore: ReasoningStore?
    private(set) var reasoningSnapshot: ReasoningSnapshot?
    private var pluginStore: PluginStore?
    private(set) var pluginSnapshot: PluginSnapshot?
    private(set) var pluginStatus="Choose a Wisp folder to manage plugins."
    private(set) var pluginActive=false, pluginApplying=false
    private var connectionStore: ConnectionStore?
    private(set) var connectionSnapshot: ConnectionSnapshot?
    private(set) var connectionStatus="Choose a Wisp folder to manage connections."
    private(set) var connectionActive=false, connectionApplying=false
    private var skillStore: SkillStore?
    private(set) var skillSnapshot: SkillSnapshot?
    private(set) var skillStatus="Choose a Wisp folder to manage skills."
    private(set) var skillActive=false, skillApplying=false
    private var petStore: PetStore?
    private(set) var petSnapshot: PetSnapshot?
    private(set) var petStatus="Choose a Wisp folder to save a body."
    private(set) var petApplying=false
    private var petApplyingId: String?
    private(set) var currentCatalogId="wisp-orb"
    private(set) var modelBusy=false, modelTesting=false
    private(set) var modelStatus="Choose a Wisp folder to configure reasoning."
    private(set) var activeModel: String?
    private(set) var hardwareSnapshot: HardwareSnapshot?
    private(set) var ollamaInspect: OllamaInspectReport?
    private(set) var onboarding: OnboardingRecord?
    private(set) var resourcePlan: ResourcePlan?
    private var resourcePlanStore: ResourcePlanStore?
    private var onboardingRefreshing=false
    private let homeQueue = DispatchQueue(label:"wisp.home")
    private var homeStore: HomeStore?
    private(set) var memorySnapshot: MemorySnapshot?
    private(set) var memoryStatus = "Choose a Wisp folder to begin."
    private(set) var memoryUsable = false, homeBusy = false
    private var attachedRevision: String?
    private var attachmentStarting = false
    private let options:[String:String]
    private var signals=[DispatchSourceSignal]()
    private var observer:NSObjectProtocol?
    private var moveObserver:NSObjectProtocol?
    private var inputBuffer=Data()
    private var ending=false, bridgeExited=false
    private var runtimePID:Int=0, sessionId=""
    private var generationCount=0
    private var developer:Bool { options["--developer"] == "true" }
    init(options:[String:String]) {
        let voice=VoiceController()
        self.voice=voice
        self.voiceSession=VoiceLifecycle(voice:voice)
        self.options=options
        super.init()
    }
    func emit(_ extra:[String:Any]) {
        guard developer else { return }
        let facts:[String:Any]=["controller":identity,"bodyGeneration":generationCount,"state":state.phase.rawValue,"sessionId":sessionId,"runtimePID":runtimePID,"bridgePID":bridge.started ? Int(bridge.pid):0]
        if let bytes=try? JSONSerialization.data(withJSONObject:facts.merging(extra){_,b in b},options:[.sortedKeys]) { try? FileHandle.standardOutput.write(contentsOf:bytes+Data([10])) }
    }
    func applicationDidFinishLaunching(_ notification:Notification) {
        voice.ready={ [weak self] in guard let self else{return false};return !self.ending && self.memoryUsable && !self.modelBusy && !self.modelTesting && self.activeModel != nil && VoiceReasoningRoute(selected:self.reasoningSnapshot?.configuration.selected).supported }
        voice.readinessIssue={ [weak self] in self?.voiceReadinessIssue ?? "Wisp is unavailable." }
        voice.send={ [weak self] frame in self?.bridge.voice(frame) ?? false }
        voice.diagnostic={ [weak self] id,value in self?.emit(value.object.merging(["event":"voice-recognition-diagnostic","utteranceId":id]){_,b in b}) }
        voice.changed={ [weak self] in guard let self else{return};self.render();self.emit(["event":"voice-state","voicePhase":self.voice.state.phase.rawValue,"utteranceId":self.voice.state.operationID ?? "","muted":self.voice.state.muted]) }
        voiceSession.onApprovalCancel={ [weak self] frame in
            guard let self,!self.ending else {return}
            self.bridge.decidePermission(frame);self.permissionWindow?.refresh()
        }
        voiceShortcut.diagnostic={ [weak self] edge,activates in self?.emit(["event":"voice-shortcut","edge":edge,"activates":activates]) }
        voiceShortcut.activate={ [weak self] in self?.wakeVoice(source:"shortcut") };voiceShortcut.register()
        emit(["event":"voice-shortcut-registration","available":voiceShortcut.available,"shortcut":VoiceShortcut.label])
        menuBar=MenuBarController(owner:self)
        installApplicationMenu()
        replaceBody()
        observer=NotificationCenter.default.addObserver(forName:NSApplication.didChangeScreenParametersNotification,object:nil,queue:.main) { [weak self] _ in self?.clamp() }
        moveObserver=NotificationCenter.default.addObserver(forName:NSWindow.didMoveNotification,object:nil,queue:.main) { [weak self] notification in
            guard let self,let window=notification.object as? NSWindow, window === self.body else { return }; self.facts("drag")
        }
        for signalNumber in [SIGTERM,SIGINT] {
            signal(signalNumber,SIG_IGN)
            let source=DispatchSource.makeSignalSource(signal:signalNumber,queue:.main)
            source.setEventHandler { NSApp.terminate(nil) }; source.resume(); signals.append(source)
        }
        if developer {
            FileHandle.standardInput.readabilityHandler={ [weak self] handle in
                let bytes=handle.availableData
                DispatchQueue.main.async {
                    guard let self else { return }
                    if bytes.isEmpty { handle.readabilityHandler=nil; NSApp.terminate(nil); return }
                    self.commands(bytes)
                }
            }
        }
        openHome()
    }
    var managementDescription: String {
        if management.section == .memory || management.section == .general {
            let folder = memorySnapshot.map { "Wisp folder: " + $0.folder.path + "\n" } ?? ""
            return folder + memoryStatus + (management.section == .general ? "\nEngine: \(management.lifecycle.rawValue.lowercased()). Voice: \(voice.state.phase.rawValue)." : "")
        }
        if management.section == .voice{return "Recognition and speech output are configured separately from the reasoning model."}
        if management.section == .plugins { return pluginDescription }
        if management.section == .connections { return connectionDescription }
        if management.section == .skills { return skillDescription }
        if management.section == .pets { return petDescription }
        if management.section == .permissions { return permissionDescription }
        if management.section == .diagnostics{return voiceDescription+"\n"+pluginDiagnostic+"\n"+connectionDiagnostic+"\n"+skillDiagnostic+"\n"+petDiagnostic+"\n"+"Accessibility TCC: "+AccessibilityDriver.trustedStatus()+". Granting Accessibility is not Allow Once.\n"+OnboardingDiagnostics.diagnosticText(snapshot:hardwareSnapshot,inspect:ollamaInspect,record:onboarding)}
        return management.description
    }
    private func homeWork(_ operation: @escaping () throws -> MemorySnapshot?, completed: ((Bool)->Void)? = nil) {
        guard !homeBusy,!ending else { return }; homeBusy = true; render()
        homeQueue.async { [weak self] in
            let result = Result { try operation() }
            DispatchQueue.main.async {
                guard let self else { return }; self.homeBusy = false
                guard !self.ending else { return }
                switch result {
                case .success(let snapshot):
                    self.memorySnapshot = snapshot; self.memoryUsable = snapshot != nil
                    self.memoryStatus = snapshot == nil ? "Choose a Wisp folder to begin." : "Saved. Memory is used at the next reasoning restart or app launch."
                    if let snapshot, self.attachedRevision == snapshot.revision { self.memoryStatus = "Saved. This memory is attached to the current Wisp." }
                    self.emit(["event":"memory-loaded","companionId":snapshot?.companionId ?? "","revision":snapshot?.revision ?? "","entries":snapshot?.document.entries.count ?? 0])
                    if snapshot != nil && (!self.bridge.started || self.bridgeExited), !self.modelBusy { self.startAttachment() }
                    if snapshot == nil { self.unavailable() }
                    completed?(true)
                case .failure(let error):
                    self.memoryStatus = (error as? StoreError ?? .unavailable).message
                    // A conflict preserves the valid editor/base. Other failures disable save until reload.
                    if (error as? StoreError) != .conflict { self.memoryUsable = false;self.voiceSession.apply();self.permissionWindow?.invalidate();self.operations.invalidate();self.bridge.stop() }
                    if !self.bridge.started { self.unavailable() }
                    self.emit(["event":"memory-error","category":String(describing:error as? StoreError ?? .unavailable)])
                    completed?(false)
                }
                self.render()
            }
        }
    }
    private func openHome() {
        homeWork { [self] in
            let support: URL
            if let test = options["--test-support"] { support = URL(fileURLWithPath:test) }
            else {
                let parent = try FileManager.default.url(for:.applicationSupportDirectory,in:.userDomainMask,appropriateFor:nil,create:true)
                support = parent.appendingPathComponent("Wisp",isDirectory:true)
            }
            homeStore = try HomeStore(supportURL:support)
            let snapshot = try homeStore!.load()
            if let snapshot { try prepareModels(snapshot, support:support) }
            return snapshot
        }
    }
    func chooseHome(_ url: URL) { homeWork { [self] in guard let homeStore else { throw StoreError.busy }; let snapshot = try homeStore.choose(url); try prepareModels(snapshot,support:homeStore.supportURL); return snapshot } }
    func reloadMemory() { homeWork { [self] in guard let homeStore else { throw StoreError.busy }; return try homeStore.read() } }
    func saveMemory(_ document: MemoryDocument, expected: String, completed: @escaping (Bool)->Void) {
        do { _ = try document.encoded() } catch { memoryStatus = StoreError.invalidMemory.message; render(); completed(false); return }
        homeWork({ [self] in guard let homeStore else { throw StoreError.busy }; return try homeStore.save(document,expected:expected) },completed:completed)
    }
    // Store and Keychain operations run only on homeQueue, under the existing home owner.
    private func prepareModels(_ snapshot: MemorySnapshot, support: URL) throws {
        do {
            if reasoningStore == nil {
                let credentials = try ReasoningCredentials(namespace:snapshot.companionId,testKeychainPath:options["--test-keychain"])
                reasoningStore = try ReasoningStore(support:support,credentials:credentials)
            }
            if voiceStore == nil{voiceStore=try VoiceStore(support:support,defaults:SystemSynthesis.defaultConfiguration)}
            let speech=try voiceStore!.load()
            DispatchQueue.main.async { [weak self] in self?.voice.configure(speech) }
            let saved = try reasoningStore!.load()
            DispatchQueue.main.async { [weak self] in self?.reasoningSnapshot=saved }
            if pluginStore == nil { pluginStore = try PluginStore(support:support) }
            let plugins = try pluginStore!.load()
            DispatchQueue.main.async { [weak self] in
                self?.pluginSnapshot=plugins
                self?.pluginStatus=plugins.configuration.enabled ? "Saved plugin composition loaded. Apply to mount it." : "Demonstration plugin is not installed."
            }
            if connectionStore == nil { connectionStore = try ConnectionStore(support:support) }
            let connections = try connectionStore!.load()
            DispatchQueue.main.async { [weak self] in
                self?.connectionSnapshot=connections
                self?.connectionStatus=connections.configuration.enabled ? "Saved connection composition loaded. Apply to mount it." : "Demonstration connection is not installed."
            }
            do {
                if skillStore == nil { skillStore = try SkillStore(support:support) }
                let skills = try skillStore!.load()
                DispatchQueue.main.async { [weak self] in
                    self?.skillSnapshot=skills
                    self?.skillStatus=skills.configuration.enabled ? "Saved skill composition loaded. Apply to mount it." : "Local time briefing is not installed."
                }
            } catch {
                DispatchQueue.main.async { [weak self] in
                    self?.skillStatus = SkillError.invalid.message
                    if self?.skillSnapshot == nil {
                        self?.skillSnapshot = SkillSnapshot(configuration:SkillConfiguration(),revision:"")
                    }
                }
            }
            do {
                if petStore == nil { petStore = try PetStore(support:support) }
                let pets = try petStore!.load()
                DispatchQueue.main.async { [weak self] in
                    guard let self, !self.ending else { return }
                    self.petSnapshot = pets
                    self.petStatus = "Saved body: \(PetCatalog.title(pets.configuration.catalogId)). Same Wisp."
                    if self.currentCatalogId != pets.configuration.catalogId { self.replaceBody(pets.configuration.catalogId) }
                }
            } catch {
                DispatchQueue.main.async { [weak self] in
                    self?.petStatus = PetError.invalid.message
                }
            }
            do {
                if resourcePlanStore == nil { resourcePlanStore = try ResourcePlanStore(support:support) }
                let plan = try resourcePlanStore!.load()
                DispatchQueue.main.async { [weak self] in self?.resourcePlan = plan }
            } catch {
                DispatchQueue.main.async { [weak self] in self?.resourcePlan = nil }
            }
        } catch {
            DispatchQueue.main.async { [weak self] in self?.modelStatus=(error as? ReasoningError)?.message ?? (error as? PluginError)?.message ?? (error as? ConnectionError)?.message ?? "Saved model configuration cannot be read. Restore the file and reload saved settings." }
        }
    }
    func reloadModels(completed: @escaping (Bool)->Void) {
        guard !homeBusy,!modelBusy,!ending,let snapshot=memorySnapshot else { return }
        modelBusy=true; render()
        homeQueue.async { [weak self] in
            guard let self else { return }
            let result=Result { () -> ReasoningSnapshot in
                guard let homeStore=self.homeStore else { throw ReasoningError.unavailable }
                if self.reasoningStore == nil { try self.prepareModels(snapshot,support:homeStore.supportURL) }
                guard let store=self.reasoningStore else { throw ReasoningError.unavailable };return try store.load()
            }
            DispatchQueue.main.async {
                guard !self.ending else { return };self.modelBusy=false
                switch result {
                case .success(let saved): self.reasoningSnapshot=saved;self.modelStatus="Saved configuration reloaded. Apply to change active reasoning.";completed(true)
                case .failure(let error): self.modelStatus=(error as? ReasoningError)?.message ?? "Saved configuration is unavailable.";completed(false)
                }
                self.render()
            }
        }
    }
    private func installBridgeCallbacks(_ current: EngineBridge, generation: Int) {
        current.onEvent = { [weak self] event in
            guard let self, self.bridgeGeneration == generation else { return }; self.receive(event)
        }
        current.onExit = { [weak self] code in
            guard let self,self.bridgeGeneration == generation else { return }
            self.voiceSession.engineStopped(); self.invalidatePermissions(); self.bridgeExited=true; self.modelTesting=false; self.activeModel=nil
            if self.ending { self.emit(["event":"native-stopped","bridgeExit":code]); NSApp.terminate(nil) }
            else if let next=self.restartAction {
                self.restartAction=nil; self.waitForOldRuntime(generation:generation,remaining:100,then:next)
            } else { self.modelBusy=false; self.pluginApplying=false; self.pluginActive=false; self.connectionApplying=false; self.connectionActive=false; self.skillApplying=false; self.skillActive=false; self.unavailable(); self.emit(["event":"bridge-exit","code":code]) }
        }
    }
    private func waitForOldRuntime(generation: Int, remaining: Int, then action: @escaping () -> Void) {
        guard !ending,bridgeGeneration == generation else { return }
        if runtimePID == 0 || kill(-Int32(runtimePID),0) != 0 && errno == ESRCH { action(); return }
        guard remaining > 0 else { modelBusy=false; pluginApplying=false; connectionApplying=false; skillApplying=false; modelStatus="The previous reasoning process has not stopped. Quit Wisp before retrying."; unavailable(); return }
        DispatchQueue.main.asyncAfter(deadline:.now()+0.1) { [weak self] in self?.waitForOldRuntime(generation:generation,remaining:remaining-1,then:action) }
    }
    private func stopReasoning(then action: @escaping () -> Void) {
        voiceSession.apply(); permissionWindow?.invalidate(); operations.invalidate(); activeModel=nil; modelTesting=false
        if !bridge.started || bridgeExited { waitForOldRuntime(generation:bridgeGeneration,remaining:100,then:action); return }
        restartAction=action; bridge.stop()
        let generation=bridgeGeneration
        DispatchQueue.main.asyncAfter(deadline:.now()+32) { [weak self] in
            guard let self,self.bridgeGeneration == generation,!self.bridgeExited else { return }
            self.bridge.terminateBridge()
        }
    }
    func applyModels(_ draft: ReasoningConfiguration, expected: String, key: String?, completed: @escaping (Bool)->Void) {
        do { try draft.validate() } catch { modelStatus=ReasoningError.invalid.message; render(); completed(false); return }
        guard !modelBusy,!homeBusy,!ending else { return }
        if let saved=reasoningSnapshot, ModelsApply.isUnchanged(draft:draft,saved:saved.configuration,key:key) {
            modelStatus="Saved reasoning choice is unchanged."; completed(true); render(); return
        }
        modelBusy=true; modelStatus="Applying saved reasoning choice…"; render()
        stopReasoning { [weak self] in
            guard let self else { return }
            self.homeQueue.async {
                let result=Result { guard let store=self.reasoningStore else { throw ReasoningError.unavailable }; return try store.save(draft,expected:expected,newKey:key) }
                DispatchQueue.main.async {
                    guard !self.ending else { return }
                    switch result {
                    case .success(let saved): self.reasoningSnapshot=saved; self.modelBusy=false; completed(true); self.startAttachment()
                    case .failure(let error): self.modelBusy=false; self.modelFailure(error); completed(false)
                    }
                }
            }
        }
    }
    func removeModelKey(completed: @escaping (Bool)->Void) {
        guard let saved=reasoningSnapshot,!modelBusy,!ending else { return }
        modelBusy=true; modelStatus="Removing the saved cloud key…"; render()
        stopReasoning { [weak self] in
            guard let self else { return }
            self.homeQueue.async {
                let result=Result { guard let store=self.reasoningStore else { throw ReasoningError.unavailable }; return try store.removeKey(expected:saved.revision) }
                DispatchQueue.main.async {
                    guard !self.ending else { return }
                    self.modelBusy=false
                    switch result {
                    case .success(let saved): self.reasoningSnapshot=saved; self.modelStatus="Cloud key removed."; completed(true); self.startAttachment()
                    case .failure(let error): self.modelFailure(error); completed(false)
                    }
                }
            }
        }
    }
    func applyPlugins(_ draft: PluginConfiguration, expected: String, completed: @escaping (Bool)->Void) {
        do { try draft.validate() } catch { pluginStatus=PluginError.invalid.message; render(); completed(false); return }
        guard PluginApply.allowed(modelBusy:modelBusy,homeBusy:homeBusy,ending:ending) else { return }
        modelBusy=true; pluginApplying=true; pluginStatus="Applying saved plugin composition…"; render()
        stopReasoning { [weak self] in
            guard let self else { return }
            self.homeQueue.async {
                let result=Result { guard let store=self.pluginStore else { throw PluginError.invalid }; return try store.save(draft,expected:expected) }
                DispatchQueue.main.async {
                    guard !self.ending else { return }
                    switch result {
                    case .success(let saved): self.pluginSnapshot=saved; self.modelBusy=false; completed(true); self.startAttachment()
                    case .failure(let error):
                        self.pluginApplying=false; self.modelBusy=false
                        self.pluginStatus=(error as? PluginError)?.message ?? (error as? StoreError)?.message ?? "Plugin settings could not be saved. The previous composition was kept."
                        completed(false); self.render()
                    }
                }
            }
        }
    }
    func applyConnections(_ draft: ConnectionConfiguration, expected: String, completed: @escaping (Bool)->Void) {
        do { try draft.validate() } catch { connectionStatus=ConnectionError.invalid.message; render(); completed(false); return }
        guard ConnectionApply.allowed(modelBusy:modelBusy,homeBusy:homeBusy,ending:ending) else { return }
        modelBusy=true; connectionApplying=true; connectionStatus="Applying saved connection composition…"; render()
        stopReasoning { [weak self] in
            guard let self else { return }
            self.homeQueue.async {
                let result=Result { guard let store=self.connectionStore else { throw ConnectionError.invalid }; return try store.save(draft,expected:expected) }
                DispatchQueue.main.async {
                    guard !self.ending else { return }
                    switch result {
                    case .success(let saved): self.connectionSnapshot=saved; self.modelBusy=false; completed(true); self.startAttachment()
                    case .failure(let error):
                        self.connectionApplying=false; self.modelBusy=false
                        self.connectionStatus=(error as? ConnectionError)?.message ?? (error as? StoreError)?.message ?? "Connection settings could not be saved. The previous composition was kept."
                        completed(false); self.render()
                    }
                }
            }
        }
    }
    func applySkills(_ draft: SkillConfiguration, expected: String, completed: @escaping (Bool)->Void) {
        do { try draft.validate() } catch { skillStatus=SkillError.invalid.message; render(); completed(false); return }
        guard memorySnapshot != nil, skillStore != nil else {
            skillStatus=SkillApply.folderRequired; render(); completed(false); return
        }
        guard SkillApply.allowed(modelBusy:modelBusy,homeBusy:homeBusy,ending:ending) else { return }
        if let saved=skillSnapshot, saved.configuration.enabled == draft.enabled, saved.configuration.catalogId == draft.catalogId {
            skillStatus="Saved skill enablement is unchanged."; completed(true); render(); return
        }
        modelBusy=true; skillApplying=true; skillStatus="Applying saved skill composition…"; render()
        stopReasoning { [weak self] in
            guard let self else { return }
            self.homeQueue.async {
                let result=Result { guard let store=self.skillStore else { throw SkillError.invalid }; return try store.save(draft,expected:expected) }
                DispatchQueue.main.async {
                    guard !self.ending else { return }
                    switch result {
                    case .success(let saved): self.skillSnapshot=saved; self.modelBusy=false; completed(true); self.startAttachment()
                    case .failure(let error):
                        self.skillApplying=false; self.modelBusy=false
                        self.skillStatus=(error as? SkillError)?.message ?? (error as? StoreError)?.message ?? "Skill settings could not be saved. The previous composition was kept."
                        completed(false); self.render()
                    }
                }
            }
        }
    }
    func applyPets(_ draft: PetConfiguration, expected: String, completed: @escaping (Bool)->Void) {
        do { try draft.validate() } catch { petStatus=PetError.invalid.message; render(); completed(false); return }
        guard PetApply.allowed(homeBusy:homeBusy,ending:ending) else { return }
        guard memorySnapshot != nil, petStore != nil else {
            petStatus=PetApply.folderRequired; render(); completed(false); return
        }
        if let saved=petSnapshot, saved.configuration.catalogId == draft.catalogId {
            petStatus="Saved body is unchanged."; completed(true); render(); return
        }
        petApplying=true; petApplyingId=draft.catalogId; homeBusy=true; petStatus="Applying saved body…"; render()
        homeQueue.async { [weak self] in
            guard let self else { return }
            let result=Result { guard let store=self.petStore else { throw StoreError.unavailable }; return try store.save(draft,expected:expected) }
            DispatchQueue.main.async {
                self.homeBusy=false
                guard !self.ending else { return }
                switch result {
                case .success(let saved):
                    self.petSnapshot=saved; self.petApplying=false; self.petApplyingId=nil
                    self.petStatus="Saved body: \(PetCatalog.title(saved.configuration.catalogId)). Same Wisp."
                    completed(true); self.replaceBody(saved.configuration.catalogId)
                case .failure(let error):
                    self.petApplying=false; self.petApplyingId=nil
                    self.petStatus=(error as? PetError)?.message ?? (error as? StoreError)?.message ?? PetError.invalid.message
                    completed(false); self.render()
                }
            }
        }
    }
    var pluginCatalog: [PluginCatalogRow] {
        PluginCatalog.rows(snapshot:pluginSnapshot ?? PluginSnapshot(configuration:PluginConfiguration(),revision:""),applying:pluginApplying,active:pluginActive,engineUnavailable:management.lifecycle == .unavailable || state.phase == .unavailable,developer:developer,developerActive:developer)
    }
    var pluginDescription: String {
        let rows=pluginCatalog
        let demo=rows.first{$0.kind == .demonstration}
        return "Mounted plugins: \(pluginActive ? 1 : 0). Demonstration: \(demo?.status.rawValue ?? "not installed"). Marketplace catalogs were not queried.\n\n" + rows.map{"\($0.title): \($0.status.rawValue)."}.joined(separator:" ")
    }
    private var pluginDiagnostic: String {
        let demo=pluginCatalog.first{$0.kind == .demonstration}
        return "Plugins: \(pluginActive ? 1 : 0) mounted. Demonstration: \(demo?.status.rawValue ?? "not installed"). No plugin paths, raw errors or credentials."
    }
    var connectionCatalog: [ConnectionCatalogRow] {
        ConnectionCatalog.rows(snapshot:connectionSnapshot ?? ConnectionSnapshot(configuration:ConnectionConfiguration(),revision:""),applying:connectionApplying,active:connectionActive,engineUnavailable:management.lifecycle == .unavailable || state.phase == .unavailable)
    }
    var connectionDescription: String {
        let rows=connectionCatalog
        let demo=rows.first{$0.kind == .demonstration}
        return "Mounted connections: \(connectionActive ? 1 : 0). Demonstration: \(demo?.status.rawValue ?? "not installed"). Named services were not queried. Plugin-delivered Connections remain unavailable; use this Connections page. Connection save is not a grant.\n\n" + rows.map{"\($0.title): \($0.status.rawValue)."}.joined(separator:" ")
    }
    private var connectionDiagnostic: String {
        let demo=connectionCatalog.first{$0.kind == .demonstration}
        return "Connections: \(connectionActive ? 1 : 0) mounted. Demonstration: \(demo?.status.rawValue ?? "not installed"). No secrets, overlay YAML or credential values."
    }
    var skillCatalog: [SkillCatalogRow] {
        SkillCatalog.rows(snapshot:skillSnapshot ?? SkillSnapshot(configuration:SkillConfiguration(),revision:""),applying:skillApplying,active:skillActive,engineUnavailable:management.lifecycle == .unavailable || state.phase == .unavailable)
    }
    var skillDescription: String {
        let rows=skillCatalog
        let demo=rows.first{$0.kind == .demonstration}
        return "This is the same Wisp. Skills are reusable instructions of that companion, not a second assistant. Demonstration: \(demo?.status.rawValue ?? "not installed") — Local time briefing. Marketplace catalogs were not queried. Enable is not Allow Once.\n\n" + rows.map{"\($0.title): \($0.status.rawValue)\($0.canManage ? "" : " (cannot enable)")."}.joined(separator:" ")
    }
    private var skillDiagnostic: String {
        let demo=skillCatalog.first{$0.kind == .demonstration}
        return "Skills: \(skillActive ? 1 : 0) mounted. Demonstration: \(demo?.status.rawValue ?? "not installed") (wisp-local-time-briefing). No secrets, overlay YAML or credential values."
    }
    var petCatalog: [PetCatalogRow] {
        PetCatalog.rows(savedId:petSnapshot?.configuration.catalogId ?? "wisp-orb",currentId:currentCatalogId,applying:petApplying,applyingId:petApplyingId)
    }
    var petDescription: String {
        let rows=petCatalog
        let current=rows.first{$0.status == .current} ?? rows.first{$0.id == currentCatalogId}
        return "Current body: \(current?.title ?? PetCatalog.title(currentCatalogId)). This is the same Wisp. Identity, memory, models, voice, plugins, connections and skills persist. Additional official skins remain unavailable; no marketplace was queried.\n\n" + rows.map{"\($0.title): \($0.status.rawValue)\($0.canManage ? "" : " (cannot enable)")."}.joined(separator:" ")
    }
    private var petDiagnostic: String {
        "Body: \(currentCatalogId) (\(PetCatalog.title(currentCatalogId))). No secrets, overlay YAML or credential values."
    }
    var permissionDescription: String {
        let mcp = connectionActive
            ? "The demonstration MCP tool mcp__wispdemo__record is Ask-each-time when mounted."
            : "MCP is unavailable until the demonstration Connection is mounted."
        let skill = skillActive
            ? "The skill tool is Ask-each-time when the demonstration is mounted. Loading skill instructions does not run wisp_tell_time."
            : "Skill invocation is unavailable until Local time briefing is mounted."
        return "Wisp asks before every supported tool action. Allow Once applies only to the exact action shown; Deny or Cancel prevents permission to execute. No automatic or permanent consent is stored.\n\nOpen URL, open a file for viewing, and tell the local time are Ask-each-time. Telling time uses this gated clock tool and still asks. Focus, move, read, press, type and search against the Wisp Accessibility Fixture are Ask-each-time. macOS Accessibility (TCC) is also required. Grant Accessibility in System Settings → Privacy & Security → Accessibility. Wisp will not act without both TCC and Allow Once. Granting Accessibility is not a tool grant and is not Allow Once.\n\nVisual click of Drawn Canary inside the Wisp Accessibility Fixture is Ask-each-time. It is a fallback when Accessibility cannot reach a control, not a click on Fixture Button. Fixture Button stays on the Accessibility path. This visual click does not request Screen Recording or Input Monitoring. Screen Recording is not a grant.\n\nA mounted compatible plugin still requires Allow Once. \(mcp) \(skill) Connection save is not a grant. Skill Enable is not a grant. Named SaaS connectors, MCP resources and prompts, Windows computer control, general desktop click, third-party plugins and external sub-agents stay unavailable. Stock shell, filesystem and web tools stay disabled. Internal delegated consequential actions are denied. Developer verification uses isolated harmless records only.\n\nReasoning keys are managed in Models. A saved key, plugin installation, spoken yes, connection save, memory instruction, skill Enable, pet Apply, granting Accessibility or Screen Recording never grants action permission."
    }
    func testModelConnection() {
        guard voice.state.operationID == nil,activeModel != nil,!modelBusy,!modelTesting,!ending else { return }
        modelTesting=true; modelStatus="Testing connection…"; bridge.testConnection(); render()
    }
    func refreshOnboarding() {
        // Hardware collect + GET inspect only. Never starts capture, never tests the connection, never pulls a model, and never sends a prompt RPC.
        guard !ending, !onboardingRefreshing else { return }
        onboardingRefreshing=true
        let endpoint=reasoningSnapshot?.configuration.localEndpoint
        let home=memorySnapshot?.folder
        let cloud=reasoningSnapshot?.configuration.cloudModel ?? "deepseek-v4-flash"
        homeQueue.async { [weak self] in
            let snapshot=HardwareProbe.collect(home:home,ollamaModels:ProcessInfo.processInfo.environment["OLLAMA_MODELS"])
            let inspect=OllamaInspect.inspect(localEndpoint:endpoint)
            let rec=Onboarding.recommend(snapshot:snapshot,ollama:inspect,cloudModel:cloud)
            DispatchQueue.main.async {
                guard let self, !self.ending else { return }
                self.hardwareSnapshot=snapshot
                self.ollamaInspect=inspect
                self.onboarding=rec
                self.onboardingRefreshing=false
                self.render()
            }
        }
    }
    func requestOnboardingInstall() {
        guard OnboardingInstall.enabled(plan:resourcePlan) else { return }
        modelStatus="A consented resource plan is present. Live Ollama pull is not started from this session."
        render()
    }
    private func modelFailure(_ error: Error) {
        modelStatus=ReasoningError.describe(error)
        activeModel=nil; unavailable()
    }
    private func startAttachment() {
        guard let snapshot=memorySnapshot,memoryUsable,!attachmentStarting,!ending,
              (!bridge.started || bridgeExited),let root=options["--runtime-root"],let scratch=options["--scratch"],let node=options["--node"] else { pluginApplying=false; connectionApplying=false; skillApplying=false; unavailable(); return }
        attachmentStarting=true; modelBusy=true; modelStatus="Attaching saved reasoning configuration…"; render()
        let script=Bundle.main.resourceURL!.appendingPathComponent("desktop/engine/body-bridge.mjs").path
        homeQueue.async { [weak self] in
            guard let self else { return }
            let staged=Result { () -> (URL,ReasoningSnapshot,[String:Any],PluginSnapshot?,URL?,ConnectionSnapshot?,URL?,SkillSnapshot?,URL?) in
                guard let store=self.reasoningStore else { throw ReasoningError.unavailable }
                let saved=try store.load(); let bootstrap=try store.bootstrap(saved)
                var pluginSaved: PluginSnapshot?; var pluginFile: URL?
                if let plugins=self.pluginStore { pluginSaved=try plugins.load(); pluginFile=try plugins.stage(pluginSaved!) }
                var connectionSaved: ConnectionSnapshot?; var connectionFile: URL?
                if let connections=self.connectionStore { connectionSaved=try connections.load(); connectionFile=try connections.stage(connectionSaved!) }
                var skillSaved: SkillSnapshot?; var skillFile: URL?
                if let skills=self.skillStore { skillSaved=try skills.load(); skillFile=try skills.stage(skillSaved!) }
                return (try self.homeStore!.stage(snapshot),saved,bootstrap,pluginSaved,pluginFile,connectionSaved,connectionFile,skillSaved,skillFile)
            }
            DispatchQueue.main.async {
                self.attachmentStarting=false
                guard !self.ending else { return }
                do {
                    let (path,saved,bootstrap,pluginSaved,pluginFile,connectionSaved,connectionFile,skillSaved,skillFile)=try staged.get(); self.reasoningSnapshot=saved
                    if let pluginSaved { self.pluginSnapshot=pluginSaved }
                    if let connectionSaved { self.connectionSnapshot=connectionSaved }
                    if let skillSaved { self.skillSnapshot=skillSaved }
                    self.bridge=EngineBridge(); self.bridgeGeneration += 1; self.bridgeExited=false; self.runtimePID=0; self.sessionId=""
                    self.installBridgeCallbacks(self.bridge,generation:self.bridgeGeneration)
                    let section=self.management.section; self.state=BodyState(); self.management=ManagementState(); self.management.select(section)
                    var arguments=["--runtime-root",root,"--scratch",scratch,"--developer",self.developer ? "true":"false","--memory-file",path.path]
                    if let pluginFile { arguments += ["--plugin-file",pluginFile.path] }
                    if let connectionFile { arguments += ["--connection-file",connectionFile.path] }
                    if let skillFile { arguments += ["--skill-file",skillFile.path] }
                    try self.bridge.start(node:node,script:script,arguments:arguments,bootstrap:bootstrap)
                    self.attachedRevision=snapshot.revision; self.render()
                } catch { self.bridgeExited=true; self.modelBusy=false; self.pluginApplying=false; self.connectionApplying=false; self.skillApplying=false; self.modelFailure(error) }
            }
        }
    }

    private func clearStage() { homeQueue.async { [weak self] in try? self?.homeStore?.clearStage() } }
    private func receive(_ event:[String:Any]) {
        if let pid=event["pid"] as? Int { runtimePID=pid }
        if let session=event["sessionId"] as? String { sessionId=session }
        switch event["event"] as? String {
        case "ready":
            if let generation=event["permissionGeneration"] as? String,let companion=memorySnapshot?.companionId {permissions.attach(generation:generation,companionID:companion);operations.attach(generation);voice.attach(generation:generation,companion:companion)}
            modelBusy=false; pluginApplying=false; pluginActive=(event["plugins"] as? [[String:Any]])?.contains{($0["id"] as? String)=="wisp-compatible-plugin"} == true
            pluginStatus = pluginActive ? "Demonstration plugin is mounted. Wisp still asks before each action." : (pluginSnapshot?.configuration.enabled==true ? "Saved composition did not become active." : "Demonstration plugin is not installed.")
            connectionApplying=false; connectionActive=(event["connections"] as? [[String:Any]])?.contains{($0["id"] as? String)=="wisp-demo-connection"} == true
            connectionStatus = connectionActive ? "Demonstration connection is mounted. Wisp still asks before each action. Connection save is not a grant." : (connectionSnapshot?.configuration.enabled==true ? "Saved composition did not become active." : "Demonstration connection is not installed.")
            skillApplying=false; skillActive=(event["skills"] as? [[String:Any]])?.contains{($0["id"] as? String)=="wisp-local-time-briefing"} == true
            skillStatus = skillActive ? "Local time briefing is mounted. Enable is not Allow Once. Wisp still asks before loading instructions and before telling time." : (skillSnapshot?.configuration.enabled==true ? "Saved composition did not become active." : "Local time briefing is not installed.")
            activeModel=reasoningSnapshot?.configuration.label; modelStatus="Attached. Connection has not been tested."; state.ready(); if attachedRevision == memorySnapshot?.revision { memoryStatus = "Saved. This memory is attached to the current Wisp." }; clearStage(); render()
        case "testing": if operations.start(event) {modelTesting=true;render()}
        case "connection-test": if operations.verifiedConnection(event) {modelStatus="Connection verified by a completed response.";render()}
        case "tested": if operations.finish(event) {modelTesting=false;render()}
        case "voice-processing","voice-result","voice-settled","voice-failed":voice.receive(event)
        case "approval-request":
            guard !ending,!permissions.generation.isEmpty else {break}
            do {try permissions.receive(PermissionRequest(event));voice.approval(pending:true);if permissionWindow == nil {permissionWindow=PermissionWindow(owner:self)};permissionWindow?.refresh(present:true)} catch {invalidatePermissions();bridge.stop();unavailable()}
        case "approval-closed":
            if !permissions.generation.isEmpty {do {try permissions.closed(event);voice.approval(pending:!permissions.requests.isEmpty);permissionWindow?.refresh()}catch {invalidatePermissions();bridge.stop();unavailable()}}
        case "open-request":
            guard !ending,!permissions.generation.isEmpty else {break}
            do {
                let completion=try SafeActionOpener.handle(event,expectedGeneration:permissions.generation,opener:workspaceOpener)
                bridge.completeOpen(completion)
            } catch {
                if let failed=SafeActionOpener.failed(from:event) {bridge.completeOpen(failed)}
                else {invalidatePermissions();bridge.stop();unavailable()}
            }
        case "ax-request":
            guard !ending,!permissions.generation.isEmpty else {break}
            do {
                let completion=try AccessibilityDriver.handle(event,expectedGeneration:permissions.generation,driver:accessibilityDriver)
                bridge.completeAx(completion)
            } catch {
                if let failed=AccessibilityDriver.failed(from:event) {bridge.completeAx(failed)}
                else {invalidatePermissions();bridge.stop();unavailable()}
            }
        case "visual-request":
            guard !ending,!permissions.generation.isEmpty else {break}
            do {
                let completion=try VisualClickDriver.handle(event,expectedGeneration:permissions.generation,driver:visualDriver)
                bridge.completeVisual(completion)
            } catch {
                if let failed=VisualClickDriver.failed(from:event) {bridge.completeVisual(failed)}
                else {invalidatePermissions();bridge.stop();unavailable()}
            }
        case "unavailable": modelBusy=false; modelTesting=false; pluginApplying=false; pluginActive=false; connectionApplying=false; connectionActive=false; skillApplying=false; skillActive=false; activeModel=nil; modelStatus="Reasoning connection failed. Check the saved model, endpoint or API key, then apply again."; if pluginSnapshot?.configuration.enabled==true { pluginStatus="Engine unavailable. Saved plugin composition was kept." }; if connectionSnapshot?.configuration.enabled==true { connectionStatus="Engine unavailable. Saved connection composition was kept." }; if skillSnapshot?.configuration.enabled==true { skillStatus="Engine unavailable. Saved skill composition was kept." }; clearStage(); unavailable()
        default: break
        }
        if ["approval-request","approval-closed"].contains(event["event"] as? String ?? "") {emit(["event":event["event"] ?? "approval","requestId":event["requestId"] ?? "","actionDigest":event["actionDigest"] ?? "","outcome":event["outcome"] ?? "pending","pendingPermissions":permissions.requests.count])}else if event["event"] as? String == "open-request" {emit(["event":"open-request","openRequestId":event["openRequestId"] ?? "","kind":event["kind"] ?? ""])}else if event["event"] as? String == "ax-request" {emit(["event":"ax-request","axRequestId":event["axRequestId"] ?? "","operation":event["operation"] ?? ""])}else if event["event"] as? String == "visual-request" {emit(["event":"visual-request","visualRequestId":event["visualRequestId"] ?? "","operation":event["operation"] ?? ""])}else if (event["event"] as? String)?.hasPrefix("voice-") == true{emit(event.filter{["event","generation","companionId","utteranceId","messageId","turn","cancelled","category"].contains($0.key)})}else{emit(event)}
    }
    func decidePermission(_ id:String,decision:String) {guard !ending,memoryUsable,let frame=permissions.decide(id,action:decision)else{return};bridge.decidePermission(frame);permissionWindow?.refresh()}
    func cancelPermissions() {guard !ending,memoryUsable,let frame=permissions.cancelAll() else{return};bridge.decidePermission(frame);permissionWindow?.refresh()}
    func openAccessibilityPrivacySettings() { AccessibilityDriver.openPrivacySettings() }
    func showAccessibilityFixture() { AccessibilityFixtureWindow.shared.present() }
    private func invalidatePermissions() {permissions.invalidate();permissionWindow?.invalidate();operations.invalidate()}
    private func render() {
        let phase:BodyPhase
        if state.phase == .stopped || state.phase == .starting{phase=state.phase}else{switch voice.state.phase{case .listening:phase = .listening;case .speaking:phase = .speaking;case .finalizing,.processing,.releasing:phase = .processing;case .approval:phase = .approval;case .muted:phase = .muted;case .unavailable:phase = .unavailable;case .idle:phase=state.phase}}
        management.voiceEnabled=voice.available
        (body?.contentView as? MascotView)?.phase=phase; body?.title="Wisp \(phase.rawValue)"; management.refresh(state.phase); menuBar?.refresh(management); settings?.refresh(management) }
    private func unavailable() { voiceSession.apply(); permissionWindow?.invalidate(); operations.invalidate(); state.unavailable(); render(); emit(["event":"unavailable"]) }
    private func clamp() { if let body { body.setFrame(ScreenGeometry.clamp(body.frame,to:NSScreen.screens.map(\.visibleFrame)),display:true) } }
    func replaceBody(_ catalogId:String? = nil) {
        autoreleasepool {
        state.interrupt()
        let id=PetConfiguration.normalized(catalogId ?? currentCatalogId)
        let oldFrame=body?.frame ?? NSRect(x:500,y:400,width:160,height:160)
        (body?.contentView as? MascotView)?.pause(); body?.contentView=nil
        let panel=body ?? MascotPanel(frame:ScreenGeometry.clamp(oldFrame,to:NSScreen.screens.map(\.visibleFrame)))
        let view=MascotView(frame:NSRect(x:0,y:0,width:160,height:160),catalogId:id)
        currentCatalogId=id
        panel.contentView=view; body=panel; generationCount += 1
        render(); panel.orderFrontRegardless(); view.resume(); facts("body")
        }
    }
    private func facts(_ event:String) {
        guard let panel=body,let view=panel.contentView as? MascotView else { return }
        emit(["event":event,"frame":[panel.frame.minX,panel.frame.minY,panel.frame.width,panel.frame.height],"key":panel.isKeyWindow,"visible":panel.isVisible,"animation":view.animationRunning,"liveViews":MascotView.liveViews,"activeTimers":MascotView.activeTimers,"bodyWindows":autoreleasepool { NSApp.windows.filter{$0 is MascotPanel}.count },"opaque":panel.isOpaque,"shadow":panel.hasShadow,"level":panel.level.rawValue,"reduceMotion":view.reducedMotion,"catalogId":view.catalogId,"screens":NSScreen.screens.map{["frame":[$0.frame.minX,$0.frame.minY,$0.frame.width,$0.frame.height],"scale":$0.backingScaleFactor]}])
    }
    private func sequence() {
        guard state.phase == .idle else { return }
        state.interrupt(); let token=state.generation
        _=state.present(.listening,token:token); render(); emit(["event":"simulated-presentation","label":"simulated presentation states; no voice input"])
        DispatchQueue.main.asyncAfter(deadline:.now()+1.5) { [weak self] in
            guard let self, self.state.present(.speaking,token:token) else { return }; self.render(); self.emit(["event":"simulated-presentation"])
        }
        DispatchQueue.main.asyncAfter(deadline:.now()+3) { [weak self] in
            guard let self,self.state.generation == token else { return }; self.state.interrupt(); self.render(); self.emit(["event":"simulated-presentation"])
        }
    }
    private func commands(_ bytes:Data) {
        inputBuffer.append(bytes)
        guard inputBuffer.count <= 4096 else { unavailable(); bridge.stop(); return }
        while let newline=inputBuffer.firstIndex(of:10) {
            let line=inputBuffer.prefix(upTo:newline); inputBuffer.removeSubrange(...newline)
            guard let object=(try? JSONSerialization.jsonObject(with:line)) as? [String:String],object.count == 1,let op=object["op"] else { unavailable(); bridge.stop(); return }
            switch op {
            case "permission-direct", "permission-plugin", "permission-pair", "permission-queue": if voice.state.operationID == nil && state.phase == .idle && !modelTesting {bridge.permissionFixture(op)}
            case "permissions": openSettings(.permissions)
            case "smoke": if voice.state.operationID == nil && state.phase == .idle { bridge.smoke() }
            case "recall": if voice.state.operationID == nil && state.phase == .idle { bridge.recall() }
            case "sequence": sequence()
            case "listen": state.interrupt(); _=state.present(.listening,token:state.generation); render(); emit(["event":"simulated-presentation","label":"simulated presentation state; no microphone"])
            case "speak": _=state.present(.speaking,token:state.generation); render(); emit(["event":"simulated-presentation","label":"simulated presentation state; no speech playback"])
            case "interrupt": state.interrupt(); render(); emit(["event":"interrupted"])
            case "recreate": replaceBody()
            case "hide": (body?.contentView as? MascotView)?.pause(); body?.orderOut(nil); facts("hidden")
            case "show": body?.orderFrontRegardless(); (body?.contentView as? MascotView)?.resume(); facts("shown")
            case "status": facts("status"); shellFacts("shell-status")
            case "raster":
                if let view=body?.contentView,let bitmap=view.bitmapImageRepForCachingDisplay(in:view.bounds) {
                    view.cacheDisplay(in:view.bounds,to:bitmap)
                    let id=(view as? MascotView)?.catalogId ?? currentCatalogId
                    let sample=PetRaster.samples(id)
                    emit(["event":"raster","catalogId":id,"cornerAlpha":bitmap.colorAt(x:sample.corner.0,y:sample.corner.1)?.alphaComponent ?? -1,"gapAlpha":bitmap.colorAt(x:sample.gap.0,y:sample.gap.1)?.alphaComponent ?? -1,"uniqueOpaque":bitmap.colorAt(x:sample.uniqueOpaque.0,y:sample.uniqueOpaque.1)?.alphaComponent ?? -1])
                }
            case "stop": NSApp.terminate(nil)
            default: unavailable(); bridge.stop(); return
            }
        }
    }
    func applicationShouldTerminate(_ sender:NSApplication) -> NSApplication.TerminateReply {
        if ending { return bridgeExited ? .terminateNow : .terminateCancel }
        if settings?.allowQuit() == false { return .terminateCancel }
        ending=true; voiceSession.apply(); voiceShortcut.dispose(); permissionWindow?.invalidate(); operations.invalidate(); clearStage(); state.stop(); render(); menuBar?.dispose(); settings?.window?.orderOut(nil); settings?.close(); settings=nil; (body?.contentView as? MascotView)?.pause(); body?.orderOut(nil)
        FileHandle.standardInput.readabilityHandler=nil
        if !bridge.started || bridgeExited { return .terminateNow }
        bridge.stop()
        DispatchQueue.main.asyncAfter(deadline:.now()+32) { [weak self] in
            guard let self,!self.bridgeExited else { return }; self.bridge.terminateBridge(); self.emit(["event":"forced-bridge-stop"])
        }
        return .terminateCancel
    }
    var voiceRouteDescription:String {
        guard activeModel != nil else{return "Reasoning is not attached. Apply a model in Models before speaking."}
        return VoiceReasoningRoute(selected:reasoningSnapshot?.configuration.selected).disclosure
    }
    private var voiceReadinessIssue:String {
        if modelBusy{return "Reasoning is changing. Wait for the selected model to attach."}
        if modelTesting{return "A connection test is running. Wait before speaking."}
        if !memoryUsable{return "Companion memory is unavailable. Restore it before speaking."}
        return voiceRouteDescription
    }
    var voiceDescription:String {
        let support=SystemRecognition.supported(voice.configuration.locale) ? "Device reports on-device support; live service readiness is checked on activation":"On-device recognition unavailable; recording disabled"
        return "\(voiceRouteDescription)\n\(voice.status)\nLanguage: \(voice.configuration.locale) · \(support).\nShortcut: \(VoiceActivation.shortcutStatus(registered:voiceShortcut.available)).\n\(SystemRecognition.permissionStatus)\nRaw audio stays on this Mac and is not saved; recognized text may remain in the private agent session."
    }
    func wakeVoice(source:String="native"){
        guard !ending else{return}
        voiceSession.shortcutRegistered=voiceShortcut.available
        emit(["event":"voice-activation","source":source,"voicePhase":voice.state.phase.rawValue,"utteranceId":voice.state.operationID ?? ""])
        voiceSession.wake()
    }
    func toggleVoiceMute(){var config=voice.configuration;config.muted.toggle();voice.configure(config);saveVoice(config)}
    func saveVoice(_ value:VoiceConfiguration){
        guard !homeBusy,!ending else{return};homeBusy=true;render()
        homeQueue.async{[weak self] in guard let self else{return};let result=Result{guard let store=self.voiceStore else{throw StoreError.unavailable};try store.save(value)}
            DispatchQueue.main.async{self.homeBusy=false;guard !self.ending else{return};switch result{case .success:self.voice.configure(value);case .failure:self.voice.note("Voice settings could not be saved. Current mute remains active; restore the settings file before retrying.");self.emit(["event":"voice-save-failed"])};self.render()}
        }
    }
    func openSettings(_ section:ManagementSection? = nil) {
        guard !ending else { return }
        if let section { management.select(section) }
        if settings == nil { settings=SettingsWindowController(owner:self) }
        if management.section == .models || management.section == .diagnostics { refreshOnboarding() }
        settings?.refresh(management); settings?.present(); shellFacts("settings-opened")
    }
    func selectSection(_ section:ManagementSection) {
        management.select(section)
        if section == .models || section == .diagnostics { refreshOnboarding() }
        settings?.refresh(management); shellFacts("section-selected")
    }
    func showCompanion() {
        guard !ending else { return }; clamp(); body?.orderFrontRegardless()
        (body?.contentView as? MascotView)?.resume(); facts("shown")
    }
    func shellFacts(_ event:String) {
        emit(["event":event,"section":management.section.rawValue,"lifecycle":management.lifecycle.rawValue,
              "companionId":memorySnapshot?.companionId ?? "","memoryRevision":memorySnapshot?.revision ?? "","attachedRevision":attachedRevision ?? "","memoryUsable":memoryUsable,"homeBusy":homeBusy,
              "catalogId":currentCatalogId,
              "modelGeneration":bridgeGeneration,"modelBusy":modelBusy,"modelTesting":modelTesting,"selectedProvider":reasoningSnapshot?.configuration.provider ?? "","selectedModel":reasoningSnapshot?.configuration.model ?? "","activeModel":activeModel != nil,
              "voiceAvailable":management.voiceAvailable,"statusItems":menuBar?.item == nil ? 0:1,"statusFrame":menuBar?.item?.button?.window.map{[$0.frame.minX,$0.frame.minY,$0.frame.width,$0.frame.height]} ?? [],
              "settingsAllocated":settings == nil ? 0:1,"settingsVisible":settings?.window?.isVisible ?? false,
              "settingsKey":settings?.window?.isKeyWindow ?? false,"settingsMain":settings?.window?.isMainWindow ?? false,
              "settingsWindow":settings?.window?.windowNumber ?? 0,"settingsMiniaturized":settings?.window?.isMiniaturized ?? false,
              "appWindows":NSApp.windows.count,"bodyKey":body?.isKeyWindow ?? false,"bodyMain":body?.isMainWindow ?? false,
              "controllerObservers":(observer == nil ? 0:1)+(moveObserver == nil ? 0:1),"signalSources":signals.count])
    }
    private func installApplicationMenu() {
        let main=NSMenu(); let root=NSMenuItem(); main.addItem(root)
        let menu=NSMenu(); root.submenu=menu
        let setting=NSMenuItem(title:"Settings…",action:#selector(settingsShortcut),keyEquivalent:","); setting.target=self; menu.addItem(setting)
        menu.addItem(NSMenuItem(title:"Close Window",action:#selector(NSWindow.performClose(_:)),keyEquivalent:"w"))
        menu.addItem(NSMenuItem(title:"Quit Wisp",action:#selector(NSApplication.terminate(_:)),keyEquivalent:"q"))
        let editRoot=NSMenuItem(); main.addItem(editRoot); let editMenu=NSMenu(title:"Edit"); editRoot.submenu=editMenu
        editMenu.addItem(NSMenuItem(title:"Cut",action:#selector(NSText.cut(_:)),keyEquivalent:"x")); editMenu.addItem(NSMenuItem(title:"Copy",action:#selector(NSText.copy(_:)),keyEquivalent:"c")); editMenu.addItem(NSMenuItem(title:"Paste",action:#selector(NSText.paste(_:)),keyEquivalent:"v")); editMenu.addItem(NSMenuItem(title:"Select All",action:#selector(NSText.selectAll(_:)),keyEquivalent:"a"))
        NSApp.mainMenu=main
    }
    @objc private func settingsShortcut() { openSettings() }
    func applicationShouldTerminateAfterLastWindowClosed(_ sender:NSApplication) -> Bool { false }
    deinit { if let moveObserver { NotificationCenter.default.removeObserver(moveObserver) }; if let observer { NotificationCenter.default.removeObserver(observer) }; signals.forEach{$0.cancel()} }
}

import AppKit

final class PermissionDetails:NSTextView {
    var onTab:((Bool)->Void)?
    override func keyDown(with event:NSEvent) {
        if event.keyCode==48 {onTab?(event.modifierFlags.contains(.shift));return}
        super.keyDown(with:event)
    }
}
final class PermissionPanel:NSWindow {
    var cancelRequest:(()->Void)?
    override func cancelOperation(_ sender:Any?) { cancelRequest?() }
    override func sendEvent(_ event:NSEvent) {
        if event.type == .keyDown,event.keyCode==53 {cancelRequest?();return}
        super.sendEvent(event)
    }
}
final class PermissionWindow:NSWindowController,NSWindowDelegate {
    weak var companion:CompanionController?
    private let choices=ModelsPopup(frame:.zero,pullsDown:false)
    private let details=PermissionDetails()
    private let status=NSTextField(wrappingLabelWithString:"")
    private let allow=ModelsButton(title:"Allow Once",target:nil,action:nil)
    private let deny=ModelsButton(title:"Deny",target:nil,action:nil)
    private let cancel=ModelsButton(title:"Cancel Request",target:nil,action:nil)
    private var ids=[String](),selected="",rendered=""
    init(owner:CompanionController) {
        self.companion=owner
        let panel=PermissionPanel(contentRect:NSRect(x:0,y:0,width:660,height:540),styleMask:[.titled,.closable,.resizable],backing:.buffered,defer:false)
        panel.title="Wisp — Permission Request";panel.isReleasedWhenClosed=false;panel.minSize=NSSize(width:520,height:420);panel.center()
        super.init(window:panel);panel.delegate=self;panel.cancelRequest={ [weak self] in self?.respond("cancel") }
        let title=NSTextField(labelWithString:"Allow this one action?");title.font = .systemFont(ofSize:23,weight:.semibold)
        choices.target=self;choices.action=#selector(selectRequest);choices.setAccessibilityLabel("Pending permission request")
        details.isEditable=false;details.isSelectable=true;details.isRichText=false;details.font = .systemFont(ofSize:14);details.textContainerInset=NSSize(width:12,height:12);details.setAccessibilityLabel("Complete action details")
        details.isVerticallyResizable=true;details.isHorizontallyResizable=false;details.autoresizingMask=[.width];details.textContainer?.widthTracksTextView=true
        let scroll=NSScrollView();scroll.hasVerticalScroller=true;scroll.borderType = .bezelBorder;scroll.documentView=details;scroll.translatesAutoresizingMaskIntoConstraints=false
        status.font = .systemFont(ofSize:13);status.textColor = .secondaryLabelColor
        for b in [allow,deny,cancel] {b.target=self;b.keyEquivalent=""}
        allow.action=#selector(allowAction);deny.action=#selector(denyAction);cancel.action=#selector(cancelAction)
        let buttons=NSStackView(views:[cancel,deny,allow]);buttons.orientation = .horizontal;buttons.spacing=12
        let root=NSStackView(views:[title,choices,scroll,status,buttons]);root.orientation = .vertical;root.alignment = .leading;root.spacing=14;root.translatesAutoresizingMaskIntoConstraints=false
        let container=NSView();panel.contentView=container;container.addSubview(root)
        NSLayoutConstraint.activate([root.leadingAnchor.constraint(equalTo:container.leadingAnchor,constant:24),root.trailingAnchor.constraint(equalTo:container.trailingAnchor,constant:-24),root.topAnchor.constraint(equalTo:container.topAnchor,constant:24),root.bottomAnchor.constraint(equalTo:container.bottomAnchor,constant:-24),scroll.widthAnchor.constraint(equalTo:root.widthAnchor),scroll.heightAnchor.constraint(greaterThanOrEqualToConstant:160),status.widthAnchor.constraint(equalTo:root.widthAnchor),choices.widthAnchor.constraint(equalTo:root.widthAnchor)])
        for control in [allow,deny,cancel] {control.onTab={ [weak self,weak control] backwards in guard let self,let control else{return};self.moveFocus(control,backwards) }}
        choices.onTab={ [weak self] backwards in guard let self else{return};self.moveFocus(self.choices,backwards) }
        details.onTab={ [weak self] backwards in guard let self else{return};self.moveFocus(self.details,backwards) }
    }
    required init?(coder:NSCoder) {fatalError("Programmatic window")}
    private func moveFocus(_ current:NSView,_ backwards:Bool) {
        let controls:[NSView]=[choices,details,cancel,deny,allow]
        guard let index=controls.firstIndex(where:{$0 === current}) else{return}
        for offset in 1...controls.count {
            let candidate=controls[(index+(backwards ? -offset:offset)+controls.count)%controls.count]
            if let control=candidate as? NSControl,!control.isEnabled {continue}
            window?.makeFirstResponder(candidate);return
        }
    }
    func refresh(present:Bool=false) {
        guard let state=companion?.permissions else{return}
        let next=state.requests.map(\.requestID)
        if ids != next {
            ids=next;choices.removeAllItems();            choices.addItems(withTitles:state.requests.enumerated().map{
                let source=$0.element.source
                let label:String
                if source == "wisp-safe-action" {
                    label=$0.element.tool == "wisp_open_url" ? "Open URL" : $0.element.tool == "wisp_open_file" ? "Open file" : "Tell time"
                } else {
                    label=source == "wisp-direct" ? "Wisp check" : source == "wisp-compatible-plugin" ? "Compatible plugin check" : "Local plugin check"
                }
                return "Request \($0.offset+1) — \(label)"
            })
            if !ids.contains(selected) {selected=ids.first ?? ""}
            if let index=ids.firstIndex(of:selected){choices.selectItem(at:index)}
        }
        let request=state.requests.first{$0.requestID==selected}
        if rendered != selected {details.string=request?.summary ?? "No pending action. Wisp will ask again before a newly admitted action can execute.";details.scrollRangeToVisible(NSRange(location:0,length:0));rendered=selected;window?.makeFirstResponder(cancel)}
        status.stringValue=state.displayStatus(for:selected)
        let enabled=request != nil && !state.deciding.contains(selected)
        for b in [allow,deny,cancel] {b.isEnabled=enabled}
        choices.isEnabled=ids.count>1
        if present && request != nil {NSApp.activate(ignoringOtherApps:true);window?.makeKeyAndOrderFront(nil);window?.makeFirstResponder(cancel)}
    }
    @objc private func selectRequest(){guard ids.indices.contains(choices.indexOfSelectedItem)else{return};selected=ids[choices.indexOfSelectedItem];refresh()}
    private func respond(_ decision:String){guard !selected.isEmpty else{return};companion?.decidePermission(selected,decision:decision)}
    @objc private func allowAction(){respond("allow-once")}
    @objc private func denyAction(){respond("deny")}
    @objc private func cancelAction(){respond("cancel")}
    func windowWillClose(_ notification:Notification){companion?.cancelPermissions()}
    func invalidate(){ids=[];selected="";rendered="";details.string="No pending action.";window?.orderOut(nil)}
}

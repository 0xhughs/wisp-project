import AppKit
func modelsFocusTests() throws {
    let provider=ModelsPopup(), local=NSTextField(), cloud=ModelsPopup(), apply=ModelsButton(), test=ModelsButton()
    let group=NSView(); group.addSubview(cloud); group.isHidden=true
    let order:[NSControl]=[provider,local,cloud,apply,test]
    test.isEnabled=false
    try check(ModelsFocus.next(after:local,in:order,backward:false) === apply,"Tab skips hidden route and disabled action")
    try check(ModelsFocus.next(after:apply,in:order,backward:true) === local,"Shift-Tab skips hidden ancestor")
    try check(ModelsFocus.next(after:apply,in:order,backward:false) === provider,"forward wraps past disabled test")
    group.isHidden=false; local.isHidden=true
    try check(ModelsFocus.next(after:provider,in:order,backward:false) === cloud,"cloud selector joins visible order")
    try check(provider.acceptsFirstResponder && apply.acceptsFirstResponder,"selectors and actions accept explicit focus")
    for c in order { c.isEnabled=false }
    try check(ModelsFocus.next(after:provider,in:order,backward:false) == nil,"busy form has no enabled destination")
    print("Models focus assertions passed: visible enabled forward/backward traversal and busy exclusion")
}

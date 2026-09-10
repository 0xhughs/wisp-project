import AppKit
var options=[String:String]()
let arguments=Array(CommandLine.arguments.dropFirst())
let allowed=["--developer","--runtime-root","--scratch","--node","--test-support","--test-keychain"]
guard arguments.count % 2 == 0 else { exit(2) }
for index in stride(from:0,to:arguments.count,by:2) {
    guard allowed.contains(arguments[index]),options[arguments[index]] == nil else { exit(2) }
    options[arguments[index]]=arguments[index+1]
}
if options["--developer"] == "true" {
    guard let test=options["--test-support"], test.hasPrefix("/"), let scratch=options["--scratch"],
          URL(fileURLWithPath:test).deletingLastPathComponent().standardizedFileURL == URL(fileURLWithPath:scratch).standardizedFileURL,
          FileManager.default.fileExists(atPath:URL(fileURLWithPath:scratch).appendingPathComponent(".wisp-owned").path) else { exit(2) }
    if let keychain=options["--test-keychain"] { guard URL(fileURLWithPath:keychain).deletingLastPathComponent().standardizedFileURL == URL(fileURLWithPath:scratch).standardizedFileURL else { exit(2) } }
} else if options["--test-support"] != nil || options["--test-keychain"] != nil { exit(2) }
let app=NSApplication.shared
app.setActivationPolicy(.accessory)
let controller=CompanionController(options:options)
app.delegate=controller
app.run()

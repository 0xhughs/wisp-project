// Test operator ONLY. Never link into Wisp or forward captured product events.
import AppKit
import CoreGraphics
let args = CommandLine.arguments
func fail(_ message:String) -> Never { fputs(message + "\n",stderr); exit(2) }
guard args.count >= 2 else { fail("usage: InputProbe permission|windows|click|drag|scroll|type ...") }
if args[1] == "permission" { print("CGPreflightPostEventAccess=\(CGPreflightPostEventAccess())"); exit(0) }
if args[1] == "windows" {
    let entries = CGWindowListCopyWindowInfo(.optionAll,kCGNullWindowID) as? [[String:Any]] ?? []
    for e in entries where ["Wisp","WispBody","ClickTarget"].contains(e[kCGWindowOwnerName as String] as? String ?? "") { print(e) }
    exit(0)
}
guard CGPreflightPostEventAccess() else { fail("POST_EVENT_ACCESS_DENIED: macOS Accessibility authorization required for the test driver; no request or bypass performed") }
func point(_ i:Int) -> CGPoint { guard args.count > i+1, let x=Double(args[i]),let y=Double(args[i+1]) else { fail("invalid point") }; return CGPoint(x:x,y:y) }
func post(_ type:CGEventType,_ p:CGPoint) { CGEvent(mouseEventSource:nil,mouseType:type,mouseCursorPosition:p,mouseButton:.left)!.post(tap:.cghidEventTap) }
// Coordinates are Quartz global top-left. Runner must verify owned test-window bounds first.
switch args[1] {
case "click":
    let p=point(2); post(.mouseMoved,p); post(.leftMouseDown,p); usleep(30000); post(.leftMouseUp,p)
case "edge":
    let a=point(2), b=point(4); post(.mouseMoved,a); usleep(30000); post(.mouseMoved,b); post(.leftMouseDown,b); usleep(30000); post(.leftMouseUp,b)
case "drag":
    let a=point(2), b=point(4); post(.mouseMoved,a); usleep(30000); post(.leftMouseDown,a)
    for i in 1...30 { usleep(10000); post(.leftMouseDragged,CGPoint(x:a.x+(b.x-a.x)*Double(i)/30,y:a.y+(b.y-a.y)*Double(i)/30)) }
    post(.leftMouseUp,b)
case "scroll":
    let p=point(2); post(.mouseMoved,p); usleep(30000)
    CGEvent(scrollWheelEvent2Source:nil,units:.pixel,wheelCount:1,wheel1:-240,wheel2:0,wheel3:0)!.post(tap:.cghidEventTap)
case "type":
    guard NSWorkspace.shared.frontmostApplication?.localizedName == "ClickTarget" else { fail("typing requires focused independent target") }
    // Fixed known-safe string; no arbitrary text channel.
    let text=Array("wisp-test".utf16)
    for down in [true,false] { let event=CGEvent(keyboardEventSource:nil,virtualKey:0,keyDown:down)!; event.keyboardSetUnicodeString(stringLength:text.count,unicodeString:text); event.post(tap:.cghidEventTap) }
default: fail("unknown operation")
}

usleep(250000) // Allow the independent applications to process queued test input before observation.

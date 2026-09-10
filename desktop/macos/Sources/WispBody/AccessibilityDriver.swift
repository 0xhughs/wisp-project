import Foundation
#if canImport(ApplicationServices)
import ApplicationServices
#endif
#if canImport(AppKit)
import AppKit
#endif

enum AccessibilityFailure: Error { case invalid, denied, untrusted, missing, ambiguous, outside }

struct AxNativeRequest {
    let axRequestId: String
    let operation: String
    let destination: String
    let arguments: [String: String]
}

struct AxNativeResult {
    let outcome: String
    let detail: String
}

protocol AccessibilityPerforming {
    func isProcessTrusted() -> Bool
    func perform(_ request: AxNativeRequest) throws -> AxNativeResult
}

final class RecordingAccessibilityDriver: AccessibilityPerforming {
    private(set) var calls: [AxNativeRequest] = []
    var trusted = true
    var count: Int { calls.count }
    func isProcessTrusted() -> Bool { trusted }
    func perform(_ request: AxNativeRequest) throws -> AxNativeResult {
        calls.append(request)
        switch request.operation {
        case "read-fixture-interface":
            return AxNativeResult(outcome: "applied", detail: "role window; title Wisp Accessibility Fixture; focused Fixture Field")
        case "search-fixture-tree":
            let name = request.arguments["name"] ?? ""
            let role = name == "Fixture Button" ? "button" : name == "Fixture Field" ? "text field" : "static text"
            return AxNativeResult(outcome: "applied", detail: "found true; name \(name); role \(role)")
        case "press-named-control":
            return AxNativeResult(outcome: "applied", detail: "Pressed Fixture Button once.")
        case "set-named-text":
            return AxNativeResult(outcome: "applied", detail: "Set Fixture Field to the granted text.")
        case "focus-fixture-window":
            return AxNativeResult(outcome: "applied", detail: "Raised Wisp Accessibility Fixture.")
        case "move-fixture-window":
            return AxNativeResult(outcome: "applied", detail: "Nudged Wisp Accessibility Fixture.")
        default:
            throw AccessibilityFailure.invalid
        }
    }
}

enum AccessibilityDriver {
    static let fixtureTitle = "Wisp Accessibility Fixture"
    static let buttonName = "Fixture Button"
    static let fieldName = "Fixture Field"
    static let markerName = "Fixture Marker"
    static let findNames: Set<String> = [buttonName, fieldName, markerName]
    static let operations: Set<String> = ["focus-fixture-window", "move-fixture-window", "read-fixture-interface", "press-named-control", "set-named-text", "search-fixture-tree"]

    static func parseDelta(_ raw: String) throws -> Int {
        guard raw.range(of: "^-?(0|[1-9][0-9]?)$", options: .regularExpression) != nil, let n = Int(raw), n >= -64, n <= 64 else { throw AccessibilityFailure.invalid }
        return n
    }

    static func parseFixtureText(_ raw: String) throws -> String {
        guard !raw.isEmpty, raw.count <= 80, !raw.unicodeScalars.contains(where: { $0.value < 32 || $0.value == 127 || (0x202a...0x202e).contains($0.value) || (0x2066...0x2069).contains($0.value) }) else { throw AccessibilityFailure.invalid }
        return raw
    }

    static func destination(for operation: String, arguments: [String: String]) throws -> String {
        switch operation {
        case "focus-fixture-window":
            guard Set(arguments.keys) == ["title"], arguments["title"] == fixtureTitle else { throw AccessibilityFailure.invalid }
            return "ax-fixture-window"
        case "move-fixture-window":
            guard Set(arguments.keys) == ["title", "dx", "dy"], arguments["title"] == fixtureTitle else { throw AccessibilityFailure.invalid }
            let dx = try parseDelta(arguments["dx"] ?? "")
            let dy = try parseDelta(arguments["dy"] ?? "")
            if dx == 0 && dy == 0 { throw AccessibilityFailure.invalid }
            return "ax-fixture-window"
        case "read-fixture-interface":
            guard arguments.isEmpty else { throw AccessibilityFailure.invalid }
            return "ax-fixture-focused"
        case "press-named-control":
            guard Set(arguments.keys) == ["name"], arguments["name"] == buttonName else { throw AccessibilityFailure.invalid }
            return "ax-fixture-control:Fixture Button"
        case "set-named-text":
            guard Set(arguments.keys) == ["name", "text"], arguments["name"] == fieldName else { throw AccessibilityFailure.invalid }
            _ = try parseFixtureText(arguments["text"] ?? "")
            return "ax-fixture-field:Fixture Field"
        case "search-fixture-tree":
            guard Set(arguments.keys) == ["name"], let name = arguments["name"], findNames.contains(name) else { throw AccessibilityFailure.invalid }
            return "ax-fixture-search:\(name)"
        default:
            throw AccessibilityFailure.invalid
        }
    }

    static func validatePermission(tool: String, source: String, operation: String, arguments: [String: String], destination: String) throws {
        guard source == "wisp-ax", operations.contains(operation) else { throw AccessibilityFailure.invalid }
        let expectedTool: String
        switch operation {
        case "focus-fixture-window": expectedTool = "wisp_ax_focus_window"
        case "move-fixture-window": expectedTool = "wisp_ax_move_window"
        case "read-fixture-interface": expectedTool = "wisp_ax_read_focused"
        case "press-named-control": expectedTool = "wisp_ax_click_named"
        case "set-named-text": expectedTool = "wisp_ax_type_named"
        case "search-fixture-tree": expectedTool = "wisp_ax_find_named"
        default: throw AccessibilityFailure.invalid
        }
        guard tool == expectedTool else { throw AccessibilityFailure.invalid }
        let expected = try destination(for: operation, arguments: arguments)
        guard expected == destination else { throw AccessibilityFailure.invalid }
    }

    static func trustedStatus() -> String {
        #if canImport(ApplicationServices)
        return AXIsProcessTrusted() ? "trusted" : "untrusted"
        #else
        return "unavailable"
        #endif
    }

    static func openPrivacySettings() {
        #if canImport(ApplicationServices)
        let prompt = kAXTrustedCheckOptionPrompt.takeUnretainedValue()
        let options = [prompt: true] as CFDictionary
        _ = AXIsProcessTrustedWithOptions(options)
        #endif
        #if canImport(AppKit)
        if let url = URL(string: "x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility") {
            NSWorkspace.shared.open(url)
        }
        #endif
    }

    static func handle(_ event: [String: Any], expectedGeneration: String, driver: AccessibilityPerforming) throws -> [String: Any] {
        guard event["event"] as? String == "ax-request", event["version"] as? Int == 1,
              event["generation"] as? String == expectedGeneration,
              let axRequestId = event["axRequestId"] as? String, !axRequestId.isEmpty,
              let operation = event["operation"] as? String,
              let destination = event["destination"] as? String,
              let arguments = event["arguments"] as? [String: String] else { throw AccessibilityFailure.invalid }
        let expected = try self.destination(for: operation, arguments: arguments)
        guard expected == destination else { throw AccessibilityFailure.invalid }
        let request = AxNativeRequest(axRequestId: axRequestId, operation: operation, destination: destination, arguments: arguments)
        if !driver.isProcessTrusted() {
            return complete(request, generation: expectedGeneration, outcome: "untrusted", detail: "macOS Accessibility is not trusted. Granting it is not Allow Once.")
        }
        do {
            let result = try driver.perform(request)
            return complete(request, generation: expectedGeneration, outcome: result.outcome, detail: result.detail)
        } catch {
            return complete(request, generation: expectedGeneration, outcome: "failed", detail: "The fixture action could not be completed.")
        }
    }

    static func failed(from event: [String: Any]) -> [String: Any]? {
        guard let generation = event["generation"] as? String, let axRequestId = event["axRequestId"] as? String,
              let operation = event["operation"] as? String, let destination = event["destination"] as? String else { return nil }
        return ["version": 1, "generation": generation, "axRequestId": axRequestId, "operation": operation, "destination": destination, "outcome": "failed", "detail": "The fixture action could not be completed."]
    }

    private static func complete(_ request: AxNativeRequest, generation: String, outcome: String, detail: String) -> [String: Any] {
        ["version": 1, "generation": generation, "axRequestId": request.axRequestId, "operation": request.operation, "destination": request.destination, "outcome": outcome, "detail": detail]
    }
}

struct NativeAccessibilityDriver: AccessibilityPerforming {
    func isProcessTrusted() -> Bool {
        #if canImport(ApplicationServices)
        return AXIsProcessTrusted()
        #else
        return false
        #endif
    }

    func perform(_ request: AxNativeRequest) throws -> AxNativeResult {
        #if canImport(ApplicationServices) && canImport(AppKit)
        AccessibilityFixtureWindow.shared.present()
        switch request.operation {
        case "focus-fixture-window":
            try raiseFixture()
            return AxNativeResult(outcome: "applied", detail: "Raised Wisp Accessibility Fixture.")
        case "move-fixture-window":
            let dx = try AccessibilityDriver.parseDelta(request.arguments["dx"] ?? "")
            let dy = try AccessibilityDriver.parseDelta(request.arguments["dy"] ?? "")
            try nudgeFixture(dx: dx, dy: dy)
            return AxNativeResult(outcome: "applied", detail: "Nudged Wisp Accessibility Fixture.")
        case "read-fixture-interface":
            let detail = try readFixtureFocus()
            return AxNativeResult(outcome: "applied", detail: detail)
        case "press-named-control":
            try pressNamed(AccessibilityDriver.buttonName)
            return AxNativeResult(outcome: "applied", detail: "Pressed Fixture Button once.")
        case "set-named-text":
            let text = try AccessibilityDriver.parseFixtureText(request.arguments["text"] ?? "")
            try setNamed(AccessibilityDriver.fieldName, value: text)
            return AxNativeResult(outcome: "applied", detail: "Set Fixture Field to the granted text.")
        case "search-fixture-tree":
            let name = request.arguments["name"] ?? ""
            let detail = try searchFixture(name)
            return AxNativeResult(outcome: "applied", detail: detail)
        default:
            throw AccessibilityFailure.invalid
        }
        #else
        throw AccessibilityFailure.untrusted
        #endif
    }

    #if canImport(ApplicationServices) && canImport(AppKit)
    private func applicationElement() throws -> AXUIElement {
        AXUIElementCreateApplication(pid_t(ProcessInfo.processInfo.processIdentifier))
    }

    private func attribute(_ element: AXUIElement, _ name: String) -> AnyObject? {
        var value: CFTypeRef?
        let status = AXUIElementCopyAttributeValue(element, name as CFString, &value)
        guard status == .success else { return nil }
        return value
    }

    private func stringAttribute(_ element: AXUIElement, _ name: String) -> String? {
        guard let value = attribute(element, name) as? String else { return nil }
        return String(value.prefix(80))
    }

    private func fixtureWindow() throws -> AXUIElement {
        guard let windows = attribute(try applicationElement(), kAXWindowsAttribute as String) as? [AXUIElement] else { throw AccessibilityFailure.missing }
        let matches = windows.filter { stringAttribute($0, kAXTitleAttribute as String) == AccessibilityDriver.fixtureTitle }
        if matches.count > 1 { throw AccessibilityFailure.ambiguous }
        guard let window = matches.first else { throw AccessibilityFailure.missing }
        return window
    }

    private func raiseFixture() throws {
        let window = try fixtureWindow()
        AXUIElementPerformAction(window, kAXRaiseAction as CFString)
        AccessibilityFixtureWindow.shared.present()
    }

    private func nudgeFixture(dx: Int, dy: Int) throws {
        let window = try fixtureWindow()
        guard let positionValue = attribute(window, kAXPositionAttribute as String) else { throw AccessibilityFailure.missing }
        var position = CGPoint.zero
        guard AXValueGetValue(positionValue as! AXValue, .cgPoint, &position) else { throw AccessibilityFailure.missing }
        var size = CGSize(width: 360, height: 220)
        if let value = attribute(window, kAXSizeAttribute as String) {
            _ = AXValueGetValue(value as! AXValue, .cgSize, &size)
        }
        var origin = CGPoint(x: position.x + CGFloat(dx), y: position.y + CGFloat(dy))
        let screens = NSScreen.screens.map(\.visibleFrame)
        if let screen = screens.first(where: { $0.intersects(CGRect(origin: origin, size: size)) }) ?? screens.first {
            origin.x = min(max(origin.x, screen.minX), screen.maxX - min(size.width, screen.width))
            origin.y = min(max(origin.y, screen.minY), screen.maxY - min(size.height, screen.height))
        }
        var next = origin
        if let axValue = AXValueCreate(.cgPoint, &next) {
            AXUIElementSetAttributeValue(window, kAXPositionAttribute as CFString, axValue)
        }
        AccessibilityFixtureWindow.shared.nudge(dx: dx, dy: dy)
    }

    private func elementInFixture(_ element: AXUIElement, window: AXUIElement) -> Bool {
        if CFEqual(element, window) { return true }
        var current: AXUIElement? = element
        for _ in 0..<32 {
            guard let node = current else { return false }
            if CFEqual(node, window) { return true }
            var parent: CFTypeRef?
            if AXUIElementCopyAttributeValue(node, kAXParentAttribute as CFString, &parent) != .success { return false }
            current = parent as! AXUIElement?
        }
        return false
    }

    private func readFixtureFocus() throws -> String {
        let window = try fixtureWindow()
        let system = AXUIElementCreateSystemWide()
        guard let focused = attribute(system, kAXFocusedUIElementAttribute as String) else { throw AccessibilityFailure.outside }
        let focusedElement = focused as! AXUIElement
        if !elementInFixture(focusedElement, window: window) { throw AccessibilityFailure.outside }
        let role = stringAttribute(focusedElement, kAXRoleAttribute as String) ?? "unknown"
        let title = stringAttribute(focusedElement, kAXTitleAttribute as String) ?? stringAttribute(focusedElement, kAXDescriptionAttribute as String) ?? ""
        let value = stringAttribute(focusedElement, kAXValueAttribute as String) ?? ""
        var parts = ["role \(role)", "window \(AccessibilityDriver.fixtureTitle)"]
        if !title.isEmpty { parts.append("title \(title)") }
        if !value.isEmpty { parts.append("value \(value)") }
        return parts.prefix(12).joined(separator: "; ")
    }

    private func walk(_ element: AXUIElement, name: String, into matches: inout [(AXUIElement, String)], depth: Int = 0, remaining: inout Int) {
        if depth > 12 || remaining <= 0 { return }
        remaining -= 1
        let title = stringAttribute(element, kAXTitleAttribute as String)
        let description = stringAttribute(element, kAXDescriptionAttribute as String)
        if title == name || description == name {
            let role = stringAttribute(element, kAXRoleAttribute as String) ?? "unknown"
            matches.append((element, role))
        }
        if let children = attribute(element, kAXChildrenAttribute as String) as? [AXUIElement] {
            for child in children { walk(child, name: name, into: &matches, depth: depth + 1, remaining: &remaining) }
        }
    }

    private func uniqueNamed(_ name: String) throws -> (AXUIElement, String) {
        var matches: [(AXUIElement, String)] = []
        var remaining = 48
        walk(try fixtureWindow(), name: name, into: &matches, remaining: &remaining)
        if matches.count > 1 { throw AccessibilityFailure.ambiguous }
        guard let first = matches.first else { throw AccessibilityFailure.missing }
        return first
    }

    private func pressNamed(_ name: String) throws {
        let (element, _) = try uniqueNamed(name)
        AXUIElementPerformAction(element, kAXPressAction as CFString)
        AccessibilityFixtureWindow.shared.pressButton()
    }

    private func setNamed(_ name: String, value: String) throws {
        let (element, _) = try uniqueNamed(name)
        AXUIElementSetAttributeValue(element, kAXValueAttribute as CFString, value as CFString)
        AccessibilityFixtureWindow.shared.setField(value)
    }

    private func searchFixture(_ name: String) throws -> String {
        var matches: [(AXUIElement, String)] = []
        var remaining = 48
        walk(try fixtureWindow(), name: name, into: &matches, remaining: &remaining)
        if matches.count > 1 { throw AccessibilityFailure.ambiguous }
        if let first = matches.first { return "found true; name \(name); role \(first.1)" }
        return "found false; name \(name)"
    }
    #endif
}

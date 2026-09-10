import Foundation
#if canImport(AppKit)
import AppKit
#endif

enum VisualClickFailure: Error { case invalid, missing, ambiguous, outside, failed }

struct VisualNativeRequest {
    let visualRequestId: String
    let operation: String
    let destination: String
    let arguments: [String: String]
}

struct VisualNativeResult {
    let outcome: String
    let detail: String
}

protocol VisualClickPerforming {
    func perform(_ request: VisualNativeRequest) throws -> VisualNativeResult
}

final class RecordingVisualClickDriver: VisualClickPerforming {
    private(set) var calls: [VisualNativeRequest] = []
    var matchCount = 1
    let rasters = 0
    var mouseEvents = 0
    var count: Int { calls.count }
    func perform(_ request: VisualNativeRequest) throws -> VisualNativeResult {
        calls.append(request)
        if matchCount == 1 {
            return VisualNativeResult(outcome: "applied", detail: "Clicked Drawn Canary once.")
        }
        if matchCount == 0 {
            return VisualNativeResult(outcome: "failed", detail: "No Drawn Canary match.")
        }
        return VisualNativeResult(outcome: "failed", detail: "Drawn Canary match was not unique.")
    }
}

enum VisualClickDriver {
    static let fixtureTitle = "Wisp Accessibility Fixture"
    static let targetName = "Drawn Canary"
    static let operation = "click-drawn-canary"
    static let destinationToken = "visual-fixture-canary:Drawn Canary"
    static let toolName = "wisp_visual_click_drawn"
    static let source = "wisp-visual"
    static let canaryDIP = 48
    static let coreDIP = 8

    static func destination(for operation: String, arguments: [String: String]) throws -> String {
        guard operation == self.operation else { throw VisualClickFailure.invalid }
        guard Set(arguments.keys) == ["title", "target"],
              arguments["title"] == fixtureTitle,
              arguments["target"] == targetName else { throw VisualClickFailure.invalid }
        return destinationToken
    }

    static func validatePermission(tool: String, source: String, operation: String, arguments: [String: String], destination: String) throws {
        guard source == self.source, operation == self.operation, tool == toolName else { throw VisualClickFailure.invalid }
        let expected = try self.destination(for: operation, arguments: arguments)
        guard expected == destination else { throw VisualClickFailure.invalid }
    }

    static func handle(_ event: [String: Any], expectedGeneration: String, driver: VisualClickPerforming) throws -> [String: Any] {
        guard event["event"] as? String == "visual-request", event["version"] as? Int == 1,
              event["generation"] as? String == expectedGeneration,
              let visualRequestId = event["visualRequestId"] as? String, !visualRequestId.isEmpty,
              let operation = event["operation"] as? String,
              let destination = event["destination"] as? String,
              let arguments = event["arguments"] as? [String: String] else { throw VisualClickFailure.invalid }
        let expected = try self.destination(for: operation, arguments: arguments)
        guard expected == destination else { throw VisualClickFailure.invalid }
        let request = VisualNativeRequest(visualRequestId: visualRequestId, operation: operation, destination: destination, arguments: arguments)
        do {
            let result = try driver.perform(request)
            return complete(request, generation: expectedGeneration, outcome: result.outcome, detail: result.detail)
        } catch {
            return complete(request, generation: expectedGeneration, outcome: "failed", detail: "The Drawn Canary was not uniquely visible.")
        }
    }

    static func failed(from event: [String: Any]) -> [String: Any]? {
        guard let generation = event["generation"] as? String, let visualRequestId = event["visualRequestId"] as? String,
              let operation = event["operation"] as? String, let destination = event["destination"] as? String else { return nil }
        return ["version": 1, "generation": generation, "visualRequestId": visualRequestId, "operation": operation, "destination": destination, "outcome": "failed", "detail": "The Drawn Canary was not uniquely visible."]
    }

    private static func complete(_ request: VisualNativeRequest, generation: String, outcome: String, detail: String) -> [String: Any] {
        ["version": 1, "generation": generation, "visualRequestId": request.visualRequestId, "operation": request.operation, "destination": request.destination, "outcome": outcome, "detail": detail]
    }
}

struct NativeVisualClickDriver: VisualClickPerforming {
    func perform(_ request: VisualNativeRequest) throws -> VisualNativeResult {
        #if canImport(AppKit)
        _ = try VisualClickDriver.destination(for: request.operation, arguments: request.arguments)
        AccessibilityFixtureWindow.shared.present()
        guard let window = AccessibilityFixtureWindow.shared.ownedWindow,
              window.title == VisualClickDriver.fixtureTitle,
              let content = window.contentView else {
            return VisualNativeResult(outcome: "failed", detail: "The fixture window was not available.")
        }
        if !AccessibilityFixtureWindow.shared.canaryOnVisibleScreen() {
            return VisualNativeResult(outcome: "failed", detail: "The Drawn Canary was not on a visible screen.")
        }
        let bounds = content.bounds
        guard let rep = content.bitmapImageRepForCachingDisplay(in: bounds) else {
            return VisualNativeResult(outcome: "failed", detail: "The Drawn Canary was not uniquely visible.")
        }
        content.cacheDisplay(in: bounds, to: rep)
        let canary = AccessibilityFixtureWindow.shared.canaryRectInContent()
        let matches = VisualClickDriver.findSignatures(in: rep, bounds: bounds)
        if matches.isEmpty {
            return VisualNativeResult(outcome: "failed", detail: "No Drawn Canary match.")
        }
        if matches.count > 1 {
            return VisualNativeResult(outcome: "failed", detail: "Drawn Canary match was not unique.")
        }
        let centroid = matches[0]
        if centroid.x < canary.minX || centroid.x > canary.maxX || centroid.y < canary.minY || centroid.y > canary.maxY {
            return VisualNativeResult(outcome: "failed", detail: "Drawn Canary match was outside the canary.")
        }
        let location = content.convert(centroid, to: nil)
        let now = ProcessInfo.processInfo.systemUptime
        guard let down = NSEvent.mouseEvent(with: .leftMouseDown, location: location, modifierFlags: [], timestamp: now, windowNumber: window.windowNumber, context: nil, eventNumber: 1, clickCount: 1, pressure: 1),
              let up = NSEvent.mouseEvent(with: .leftMouseUp, location: location, modifierFlags: [], timestamp: now, windowNumber: window.windowNumber, context: nil, eventNumber: 2, clickCount: 1, pressure: 1) else {
            return VisualNativeResult(outcome: "failed", detail: "The Drawn Canary was not uniquely visible.")
        }
        window.sendEvent(down)
        window.sendEvent(up)
        return VisualNativeResult(outcome: "applied", detail: "Clicked Drawn Canary once.")
        #else
        throw VisualClickFailure.failed
        #endif
    }
}

#if canImport(AppKit)
extension VisualClickDriver {
    static func findSignatures(in rep: NSBitmapImageRep, bounds: NSRect) -> [NSPoint] {
        let dipW = max(1, Int(bounds.width.rounded()))
        let dipH = max(1, Int(bounds.height.rounded()))
        let scaleX = CGFloat(rep.pixelsWide) / CGFloat(max(dipW, 1))
        let scaleY = CGFloat(rep.pixelsHigh) / CGFloat(max(dipH, 1))
        func sample(_ x: Int, _ y: Int) -> (Int, Int, Int)? {
            let px = min(max(Int((CGFloat(x) + 0.5) * scaleX), 0), rep.pixelsWide - 1)
            let py = min(max(Int((CGFloat(y) + 0.5) * scaleY), 0), rep.pixelsHigh - 1)
            guard let color = rep.colorAt(x: px, y: py) else { return nil }
            let converted = color.usingColorSpace(.sRGB) ?? color
            var r: CGFloat = 0, g: CGFloat = 0, b: CGFloat = 0, a: CGFloat = 0
            converted.getRed(&r, green: &g, blue: &b, alpha: &a)
            return (Int((r * 255).rounded()), Int((g * 255).rounded()), Int((b * 255).rounded()))
        }
        func near(_ rgb: (Int, Int, Int), _ target: (Int, Int, Int)) -> Bool {
            abs(rgb.0 - target.0) <= 2 && abs(rgb.1 - target.1) <= 2 && abs(rgb.2 - target.2) <= 2
        }
        let fill = (190, 18, 60)
        let core = (255, 255, 255)
        let size = canaryDIP
        let coreSize = coreDIP
        let inset = (size - coreSize) / 2
        var found: [NSPoint] = []
        if dipW < size || dipH < size { return found }
        for y in 0...(dipH - size) {
            for x in 0...(dipW - size) {
                var ok = true
                scan: for dy in 0..<size {
                    for dx in 0..<size {
                        guard let rgb = sample(x + dx, y + dy) else { ok = false; break scan }
                        let inCore = dx >= inset && dx < inset + coreSize && dy >= inset && dy < inset + coreSize
                        if inCore {
                            if !near(rgb, core) { ok = false; break scan }
                        } else if !near(rgb, fill) {
                            ok = false; break scan
                        }
                    }
                }
                if ok {
                    found.append(NSPoint(x: CGFloat(x) + CGFloat(size) / 2, y: CGFloat(y) + CGFloat(size) / 2))
                }
            }
        }
        return found
    }
}
#endif

import Foundation

enum LastStopCategory: String { case none, clean, forced }
struct DiagnosticsFacts {
    var engineLifecycle: String
    var voicePhase: String
    var voiceMuted: Bool
    var voiceLocale: String
    var shortcutRegistered: Bool
    var shortcutCopy: String
    var speechPermission: String
    var modelsSelected: String
    var modelsDisclosure: String
    var hardwareText: String
    var pluginsMounted: Int
    var pluginsDemonstration: String
    var connectionsMounted: Int
    var connectionsDemonstration: String
    var skillsMounted: Int
    var skillsDemonstration: String
    var bodyCatalogId: String
    var bodyTitle: String
    var accessibilityTcc: String
    var telemetryDisabled: Bool
    var telemetryCopy: String
    var homeConfigured: Bool
    var lastStop: LastStopCategory
    var accountRequired: Bool
    var recoveryCopy: String
    static let sample = DiagnosticsFacts(
        engineLifecycle:"Ready", voicePhase:"idle", voiceMuted:false, voiceLocale:"en-US",
        shortcutRegistered:true, shortcutCopy:"Option–Space · registered",
        speechPermission:"Microphone: not requested; speech recognition: not requested.",
        modelsSelected:"local", modelsDisclosure:"Local Ollama: recognized text stays on this Mac.",
        hardwareText:"Hardware (nonsecret): CPU unavailable (not collected). Speech headroom: qualitative.",
        pluginsMounted:0, pluginsDemonstration:"not installed", connectionsMounted:0, connectionsDemonstration:"not installed",
        skillsMounted:0, skillsDemonstration:"not installed", bodyCatalogId:"wisp-orb", bodyTitle:"Wisp orb",
        accessibilityTcc:"unavailable", telemetryDisabled:true, telemetryCopy:DiagnosticsSnapshot.telemetryCopy,
        homeConfigured:false, lastStop:.none, accountRequired:false,
        recoveryCopy:DiagnosticsSnapshot.recovery(homeConfigured:false)
    )
}
enum DiagnosticsSnapshot {
    static let telemetryCopy = "Session telemetry is disabled. Overlay row session-telemetry-otel is disabled. Spawn sets DSH_TELEMETRY_DISABLED."
    static func recovery(homeConfigured: Bool) -> String {
        let home = homeConfigured ? "Home is configured." : "Home is not configured. Settings and Quit still work."
        return home + " If the engine is Unavailable, Quit Wisp and reopen. Do not start a second Wisp. A forced bridge stop is not a clean pass."
    }
    static func redact(_ text: String) -> String {
        var out = text
        let patterns = [
            #"sk-[A-Za-z0-9_-]*"#,
            #"BEGIN(?: [A-Z]+)*"#,
            #"memory\.json"#,
            #"/Users/[^\s]*"#,
            #"[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}"#,
            #"/(?:opt|home|var|private|Library|Applications|usr|tmp)/[^\s]+"#,
        ]
        for pattern in patterns {
            out = out.replacingOccurrences(of:pattern, with:"[omitted]", options:.regularExpression)
        }
        return out
    }
    static func render(_ facts: DiagnosticsFacts) -> String {
        let lines = [
            "Engine lifecycle: \(facts.engineLifecycle)",
            "Voice phase: \(facts.voicePhase)",
            "Mute: \(facts.voiceMuted ? "yes" : "no")",
            "Locale: \(facts.voiceLocale)",
            "Shortcut: \(facts.shortcutCopy)",
            "Microphone and speech permission: \(facts.speechPermission)",
            "Models route: \(facts.modelsSelected)",
            "Models: \(facts.modelsDisclosure)",
            "Hardware: \(facts.hardwareText)",
            "Plugins mounted: \(facts.pluginsMounted)",
            "Plugins demonstration: \(facts.pluginsDemonstration)",
            "Connections mounted: \(facts.connectionsMounted)",
            "Connections demonstration: \(facts.connectionsDemonstration)",
            "Skills mounted: \(facts.skillsMounted)",
            "Skills demonstration: \(facts.skillsDemonstration)",
            "Body: \(facts.bodyCatalogId) (\(facts.bodyTitle))",
            "Accessibility TCC: \(facts.accessibilityTcc)",
            "Telemetry: \(facts.telemetryCopy)",
            "Home configured: \(facts.homeConfigured ? "yes" : "no")",
            "Last stop: \(facts.lastStop.rawValue)",
            "Account: no required cloud account",
            "Recovery: \(facts.recoveryCopy)",
        ]
        return redact(lines.joined(separator:"\n"))
    }
    static func copyText(_ facts: DiagnosticsFacts) -> String { render(facts) }
}

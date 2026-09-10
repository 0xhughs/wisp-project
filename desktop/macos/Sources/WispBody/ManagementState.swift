import Foundation

enum ManagementSection: String, CaseIterable {
    case general = "General", models = "Models", voice = "Voice", pets = "Pets", plugins = "Plugins", connections = "Connections", skills = "Skills", memory = "Memory", permissions = "Permissions", proactivity = "Proactivity", diagnostics = "Diagnostics"
}
enum ManagementLifecycle: String { case starting = "Starting", ready = "Ready", unavailable = "Unavailable", stopping = "Stopping" }
struct ManagementState {
    private(set) var section: ManagementSection = .general
    private(set) var lifecycle: ManagementLifecycle = .starting
    var canNavigate: Bool { lifecycle != .stopping }
    var canShowCompanion: Bool { canNavigate }
    var voiceEnabled=false
    var voiceAvailable: Bool { voiceEnabled }
    mutating func select(_ next: ManagementSection) { if canNavigate { section = next } }
    mutating func refresh(_ phase: BodyPhase) {
        guard lifecycle != .stopping else { return }
        switch phase {
        case .stopped: lifecycle = .stopping
        case .unavailable: lifecycle = .unavailable
        case .idle, .listening, .speaking, .processing, .approval, .muted: if lifecycle == .starting { lifecycle = .ready }
        case .starting: break
        }
    }
    var description: String {
        switch section {
        case .general: return "Your starter companion is available on this desktop. Engine: \(lifecycle.rawValue.lowercased()). This attachment lasts for the current app run. Voice is unavailable."
        case .models: return "Choose local Ollama or optional DeepSeek cloud reasoning. This page also shows a hardware snapshot, Faster, Recommended and Stronger local rows, Ollama setup status and the existing DeepSeek cloud alternative. Recommendations always include speech headroom and disk and never invent GB, VRAM or latency cutoffs. Other providers and account sign-in methods are not supported in this build."
        case .voice: return "Voice is unavailable. Microphone capture, speech recognition and speech playback are not connected. Engine readiness does not enable voice."
        case .pets: return "Current body: Wisp starter. Additional bodies and body selection are unavailable. Your companion remains the same Wisp."
        case .plugins: return "Wisp lists a closed local catalog: one demonstration plugin, the developer verification fixture, and unavailable classes. Marketplace, arbitrary folders, stock executable tools, MCP, skills, web/chat UI and plugin-supplied models cannot be enabled. No marketplace was queried."
        case .connections: return "Wisp lists a closed local catalog: one demonstration stdio MCP connection, an advanced editor for that same class, and unavailable example rows (GitHub, Google Drive, Notion, Calendar, Slack, remote HTTP, npx/npm/git MCP, resources/prompts, plugin-delivered MCP). Named services were not queried. Plugin-delivered Connections remain unavailable; use this Connections page. Connection save is not a grant."
        case .skills: return "Skill management is unavailable. This build has not queried installed or learned behaviors."
        case .memory: return "No Wisp home or durable memory has been configured. Memory management and editing are unavailable."
        case .permissions: return "Wisp asks before every supported tool action. Allow Once applies only to the exact action shown; Deny or Cancel prevents permission to execute. No automatic or permanent consent is stored.\n\nOpen URL, open a file for viewing, and tell the local time are Ask-each-time. Telling time uses this gated clock tool and still asks. A mounted compatible plugin still requires Allow Once. When the demonstration Connection is mounted, its MCP tool is Ask-each-time; otherwise MCP is unavailable. Connection save is not a grant. Named SaaS connectors, MCP resources and prompts, skills, Accessibility, visual click, Windows computer control, third-party plugins and external sub-agents stay unavailable. Stock shell, filesystem and web tools stay disabled. Internal delegated consequential actions are denied. Developer verification uses isolated harmless records only.\n\nReasoning keys are managed in Models. A saved key, plugin installation, spoken yes, connection save or memory instruction never grants action permission."
        case .proactivity: return "No proactive behavior is configured. Autonomous triggers and proactivity management are unavailable."
        case .diagnostics: return "Engine: \(lifecycle.rawValue). Voice: unavailable.\n\nReady means the hidden engine is attached; microphone capture, recognition and playback remain disconnected. Diagnostics include a nonsecret hardware snapshot (CPU, memory kind, GPU/VRAM or unavailable reasons, disk, Ollama names/sizes) and never include credentials, keys, bootstrap frames, recognized text, plugin paths or raw engine errors."
        }
    }
}

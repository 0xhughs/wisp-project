import Foundation
import CoreFoundation

enum OnboardingError: Error { case invalid, resourcePlanRequired, pullNotAuthorized }
enum OllamaInspectStatus: String { case ok, unreachable, invalid, notDetected = "not-detected" }
struct OllamaTag: Equatable { var name: String; var size: Int? }
struct OllamaInspectReport: Equatable {
    var status: String
    var version: String?
    var models: [OllamaTag]
    var reason: String?
}
struct OnboardingChoice: Equatable {
    var slot: String
    var identifier: String
    var kind: String
    var status: String
    var reason: String?
    var sizeBytes: Int?
    var usable: Bool {
        if kind == "cloud" { return true }
        if slot == "recommended" { return identifier == "qwen3:8b" }
        return kind == "local" && !identifier.isEmpty && status != "unavailable"
    }
}
struct OnboardingRecord: Equatable {
    var version = 1
    var snapshotDigest: String
    var speechHeadroom: SpeechHeadroom
    var disk: HardwareDisk
    var ollamaStatus: String
    var fitCopy = "Fit is not a guarantee that the model runs comfortably. Wisp does not invent GB, VRAM or latency cutoffs."
    var choices: [OnboardingChoice]
    func choice(_ slot: String) -> OnboardingChoice? { choices.first { $0.slot == slot } }
}
struct ResourcePlan: Equatable {
    var version = 1
    var source = ""
    var purpose = "install-recommended-local-model"
    var expectedBytes: Int? = nil
    var sizeUnavailable = false
    var destinationKind = "ollama-models-volume"
    var consent = false
    private static func matches(_ value: String, _ pattern: String) -> Bool { value.range(of:pattern,options:.regularExpression) == value.startIndex..<value.endIndex }
    var isConsented: Bool { consent && !source.isEmpty }
    func validate() throws {
        guard version == 1, purpose == "install-recommended-local-model", destinationKind == "ollama-models-volume" else { throw OnboardingError.invalid }
        var tag = source
        if tag.hasPrefix("ollama-library:") { tag = String(tag.dropFirst("ollama-library:".count)) }
        guard Self.matches(tag,"^[A-Za-z0-9][A-Za-z0-9._:/-]{0,127}$"), !tag.contains("..") else { throw OnboardingError.invalid }
        if sizeUnavailable { guard expectedBytes == nil else { throw OnboardingError.invalid } }
        else { guard let expectedBytes, expectedBytes >= 1 else { throw OnboardingError.invalid } }
    }
    func object() -> [String:Any] {
        ["version":version,"source":source,"purpose":purpose,"expectedBytes":expectedBytes.map { $0 as Any } ?? NSNull(),"sizeUnavailable":sizeUnavailable,"destinationKind":destinationKind,"consent":consent]
    }
    func encoded() throws -> Data { try validate(); let data = try JSONSerialization.data(withJSONObject:object(),options:.sortedKeys); guard data.count <= 4096 else { throw OnboardingError.invalid }; return data }
    static func decode(_ data: Data) throws -> Self {
        guard data.count <= 4096, let o = try JSONSerialization.jsonObject(with:data) as? [String:Any],
              Set(o.keys) == ["version","source","purpose","expectedBytes","sizeUnavailable","destinationKind","consent"],
              let v = o["version"] as? NSNumber, v == 1, CFGetTypeID(v) != CFBooleanGetTypeID(),
              let source = o["source"] as? String, let purpose = o["purpose"] as? String,
              let dest = o["destinationKind"] as? String,
              let sizeNum = o["sizeUnavailable"] as? NSNumber, CFGetTypeID(sizeNum) == CFBooleanGetTypeID(),
              let consentNum = o["consent"] as? NSNumber, CFGetTypeID(consentNum) == CFBooleanGetTypeID() else { throw OnboardingError.invalid }
        let sizeUnavailable = sizeNum.boolValue, consent = consentNum.boolValue
        let expected: Int?
        if o["expectedBytes"] is NSNull { expected = nil }
        else { guard let n = o["expectedBytes"] as? NSNumber, CFGetTypeID(n) != CFBooleanGetTypeID() else { throw OnboardingError.invalid }; expected = n.intValue }
        let value = Self(version:1,source:source,purpose:purpose,expectedBytes:expected,sizeUnavailable:sizeUnavailable,destinationKind:dest,consent:consent)
        try value.validate(); return value
    }
}
enum ModelsApply {
    static func isUnchanged(draft: ReasoningConfiguration, saved: ReasoningConfiguration, key: String?) -> Bool { key == nil && draft == saved }
    static func allowed(modelBusy: Bool, homeBusy: Bool, ending: Bool = false) -> Bool { !modelBusy && !homeBusy && !ending }
}
enum OnboardingInstall {
    static func enabled(plan: ResourcePlan?) -> Bool { plan?.isConsented == true }
    static func assertAllowed(_ plan: ResourcePlan?) throws -> ResourcePlan {
        guard let plan, plan.isConsented else { throw OnboardingError.resourcePlanRequired }
        try plan.validate(); return plan
    }
    static func perform(plan: ResourcePlan?, transport: ((String) throws -> Void)?) throws {
        _ = try assertAllowed(plan)
        guard let transport else { throw OnboardingError.pullNotAuthorized }
        try transport("POST /api/pull")
    }
}
struct OnboardingConfirm {
    var draft: ReasoningConfiguration?
    mutating func finish(_ confirmed: Bool) -> ReasoningConfiguration? {
        let value = draft; draft = nil; return confirmed ? value : nil
    }
}
enum OnboardingRefresh {
    static let operations = ["hardware-collect","GET /api/version","GET /api/tags"]
    static let forbidden = ["testModelConnection","wakeVoice","session/prompt","api/pull","session/prompt"]
    static func isAllowed(_ name: String) -> Bool { !forbidden.contains(name) && (operations.contains(name) || name.hasPrefix("GET ")) }
}
enum OllamaInspect {
    static let maxBytes = 65536
    static func origin(from localEndpoint: String) throws -> URL {
        var c = ReasoningConfiguration(); c.localEndpoint = localEndpoint; try c.validate()
        let stripped = String(localEndpoint.dropLast(3))
        guard let url = URL(string:stripped) else { throw OnboardingError.invalid }
        return url
    }
    static func decodeVersion(_ data: Data) throws -> String? {
        guard data.count <= maxBytes, let o = try JSONSerialization.jsonObject(with:data) as? [String:Any] else { throw OnboardingError.invalid }
        return o["version"] as? String
    }
    static func decodeTags(_ data: Data) throws -> [OllamaTag] {
        guard data.count <= maxBytes, let o = try JSONSerialization.jsonObject(with:data) as? [String:Any] else { throw OnboardingError.invalid }
        let rows = o["models"] as? [[String:Any]] ?? []
        return rows.compactMap { row in
            guard let name = row["name"] as? String, !name.isEmpty, name.count <= 160 else { return nil }
            let size: Int?
            if let n = row["size"] as? NSNumber, CFGetTypeID(n) != CFBooleanGetTypeID(), n.intValue > 0 { size = n.intValue }
            else { size = nil }
            return OllamaTag(name:name,size:size)
        }
    }
    static func inspect(localEndpoint: String?, transport: ((String, String) throws -> Data)? = nil, timeout: TimeInterval = 2.5) -> OllamaInspectReport {
        guard let localEndpoint else { return OllamaInspectReport(status:"unreachable",version:nil,models:[],reason:"Ollama is not detected on the saved loopback address. It must already be installed and listening.") }
        do {
            let origin = try Self.origin(from:localEndpoint)
            let versionData = try get(origin, "/api/version", transport:transport, timeout:timeout)
            let tagsData = try get(origin, "/api/tags", transport:transport, timeout:timeout)
            let version = try decodeVersion(versionData)
            let models = try decodeTags(tagsData)
            return OllamaInspectReport(status:"ok",version:version,models:models,reason:nil)
        } catch {
            return OllamaInspectReport(status:"unreachable",version:nil,models:[],reason:"Ollama is not detected on the saved loopback address. It must already be installed and listening.")
        }
    }
    private static func get(_ origin: URL, _ path: String, transport: ((String, String) throws -> Data)?, timeout: TimeInterval) throws -> Data {
        if let transport { return try transport("GET", path) }
        let url = origin.appendingPathComponent(String(path.dropFirst()))
        var request = URLRequest(url:url)
        request.httpMethod = "GET"
        request.timeoutInterval = timeout
        request.httpShouldHandleCookies = false
        let sem = DispatchSemaphore(value:0)
        var result: Result<Data, Error> = .failure(OnboardingError.invalid)
        URLSession.shared.dataTask(with:request) { data, response, error in
            if let error { result = .failure(error) }
            else if let data, data.count <= maxBytes { result = .success(data) }
            else { result = .failure(OnboardingError.invalid) }
            sem.signal()
        }.resume()
        _ = sem.wait(timeout:.now() + timeout + 0.5)
        return try result.get()
    }
}
enum Onboarding {
    static let recommended = "qwen3:8b"
    static let fitCopy = "Fit is not a guarantee that the model runs comfortably. Wisp does not invent GB, VRAM or latency cutoffs."
    static func recommend(snapshot: HardwareSnapshot, ollama: OllamaInspectReport, cloudModel: String = "deepseek-v4-flash") -> OnboardingRecord {
        let ranked = ollama.models.filter { $0.size != nil && $0.size! > 0 }
        func unique(_ tags: [OllamaTag]) -> [OllamaTag] {
            var seen = Set<String>(); return tags.filter { seen.insert($0.name).inserted }
        }
        let sized = unique(ranked).sorted { ($0.size ?? 0, $0.name) < ($1.size ?? 0, $1.name) }
        let inRecommended = ollama.models.contains { $0.name == recommended }
        let recommendedSize = ollama.models.first { $0.name == recommended }?.size
        let recStatus = localStatus(inTags:inRecommended,size:recommendedSize,snapshot:snapshot,ollamaStatus:ollama.status)
        let others = sized.filter { $0.name != recommended }
        let fasterTag = others.first
        let strongerTag = others.filter { $0.name != fasterTag?.name }.sorted { ($0.size ?? 0, $0.name) > ($1.size ?? 0, $1.name) }.first
        func row(_ slot: String, _ tag: OllamaTag?) -> OnboardingChoice {
            guard let tag else {
                let reason: String
                if ollama.status == "unreachable" || ollama.status == "not-detected" { reason = "Ollama is not detected on the saved loopback address. It must already be installed and listening." }
                else { reason = slot == "stronger" ? "no other installed local model to rank as stronger" : "no other installed local model to rank" }
                return OnboardingChoice(slot:slot,identifier:"",kind:"local",status:"unavailable",reason:reason,sizeBytes:nil)
            }
            let st = localStatus(inTags:true,size:tag.size,snapshot:snapshot,ollamaStatus:ollama.status)
            return OnboardingChoice(slot:slot,identifier:tag.name,kind:"local",status:st.status,reason:st.reason,sizeBytes:tag.size)
        }
        let recommendedChoice = OnboardingChoice(slot:"recommended",identifier:recommended,kind:"local",status:recStatus.status,reason:recStatus.reason,sizeBytes:recommendedSize)
        let cloud = OnboardingChoice(slot:"cloud",identifier:cloudModel,kind:"cloud",status:"available",reason:"Optional DeepSeek cloud. Apply uses the existing Models route and Keychain. This does not test the connection or spend the reserved greeting.",sizeBytes:nil)
        return OnboardingRecord(snapshotDigest:snapshot.digest,speechHeadroom:snapshot.speechHeadroom,disk:HardwareDisk(status:snapshot.disk.status,availableBytes:snapshot.disk.availableBytes,rootAvailableBytes:snapshot.disk.rootAvailableBytes,homeAvailableBytes:snapshot.disk.homeAvailableBytes,reason:snapshot.disk.reason),ollamaStatus:ollama.status,fitCopy:fitCopy,choices:[row("faster",fasterTag),recommendedChoice,row("stronger",strongerTag),cloud])
    }
    private static func localStatus(inTags: Bool, size: Int?, snapshot: HardwareSnapshot, ollamaStatus: String) -> (status: String, reason: String?) {
        if ollamaStatus == "unreachable" || ollamaStatus == "not-detected" { return ("ollama-unreachable","Ollama is not detected on the saved loopback address. It must already be installed and listening.") }
        if !inTags { return ("not-installed","This local identifier is not in the inspected Ollama tag list. Wisp will not pull it without a consented resource plan.") }
        if snapshot.memory.status == "unavailable" { return ("hardware-incomplete", snapshot.memory.reason) }
        if let size, snapshot.disk.status == "available", let available = snapshot.disk.availableBytes, size > available {
            return ("disk-may-be-insufficient","Ollama-reported size exceeds the inspected available disk bytes.")
        }
        var missing: [String] = []
        if snapshot.disk.status == "unavailable" { missing.append("disk") }
        let graphicsOK = snapshot.memory.kind == "unified" && snapshot.memory.status == "available" || snapshot.gpu.status == "available" && snapshot.gpu.vram.status == "available"
        if !graphicsOK { missing.append("GPU") }
        if size == nil { missing.append("Ollama size") }
        if !missing.isEmpty { return ("fit-uncertain","Inspection found this installed model; \(missing.joined(separator:", ")) is missing so fit is not a guarantee.") }
        return ("installed", nil)
    }
}
enum OnboardingDiagnostics {
    static func panelText(snapshot: HardwareSnapshot?, inspect: OllamaInspectReport?, record: OnboardingRecord?) -> String {
        let hw: String
        if let snapshot {
            let cpu = snapshot.cpu.status == "available" ? "\(snapshot.cpu.modelName ?? "") · \(snapshot.cpu.logicalCount ?? 0) logical" : "unavailable (\(snapshot.cpu.reason ?? ""))"
            let mem: String
            if snapshot.memory.status == "available" {
                mem = "\(snapshot.memory.kind) · \(snapshot.memory.totalBytes.map(String.init) ?? "?") bytes"
            } else { mem = "unavailable (\(snapshot.memory.reason ?? ""))" }
            let gpu = snapshot.gpu.status == "available" ? "\(snapshot.gpu.name ?? "") · VRAM \(snapshot.gpu.vram.status)" : "unavailable (\(snapshot.gpu.reason ?? ""))"
            let disk = snapshot.disk.status == "available" ? "\(snapshot.disk.availableBytes.map(String.init) ?? "?") bytes available" : "unavailable (\(snapshot.disk.reason ?? ""))"
            hw = "CPU: \(cpu)\nMemory: \(mem)\nGPU: \(gpu)\nDisk: \(disk)\nSpeech headroom: qualitative (no numeric reservation). Recognition and TTS stay concurrent with the model."
        } else { hw = "Hardware snapshot: unavailable until Refresh. Inspect does not start the microphone, test the connection or download a model." }
        let ollama: String
        if let inspect {
            if inspect.status == "ok" { ollama = "Ollama \(inspect.version ?? "version unlisted"). Installed: " + inspect.models.map { "\($0.name)\($0.size.map { " (\($0) bytes)" } ?? "")" }.joined(separator:", ") }
            else { ollama = inspect.reason ?? "Ollama must already be installed and listening on the saved loopback address." }
        } else { ollama = "Ollama must already be installed and listening on the saved loopback address." }
        let rows = record?.choices.map { "\($0.slot): \($0.identifier.isEmpty ? "—" : $0.identifier) · \($0.status)" + ($0.reason.map { " (\($0))" } ?? "") } .joined(separator:"\n") ?? "Recommendations unavailable until inspect."
        return hw + "\n" + ollama + "\n" + (record?.fitCopy ?? Onboarding.fitCopy) + "\n" + rows
    }
    static func diagnosticText(snapshot: HardwareSnapshot?, inspect: OllamaInspectReport?, record: OnboardingRecord?) -> String {
        let text = panelText(snapshot:snapshot,inspect:inspect,record:record)
        return "Hardware (nonsecret):\n" + text
    }
}
final class ResourcePlanStore {
    private let directory: OwnedDirectory
    private let ownership: DirectoryOwnership
    init(support: URL) throws {
        let url = support.appendingPathComponent("onboarding",isDirectory:true)
        if !FileManager.default.fileExists(atPath:url.path) { try FileManager.default.createDirectory(at:url,withIntermediateDirectories:false,attributes:[.posixPermissions:0o700]) }
        directory = try OwnedDirectory(url); ownership = try directory.lock("owner.lock")
    }
    func load() throws -> ResourcePlan? {
        try ownership.verify()
        if try !directory.exists("resource-plan.json") { return nil }
        let data = try directory.read("resource-plan.json",limit:4096)
        return try ResourcePlan.decode(data)
    }
    func save(_ plan: ResourcePlan, expected: String?) throws -> ResourcePlan {
        try ownership.verify(); try plan.validate()
        if let expected, try directory.exists("resource-plan.json") {
            let previous = try directory.read("resource-plan.json",limit:4096)
            if MemoryDocument.revision(previous) != expected { throw StoreError.conflict }
        }
        try directory.replace("resource-plan.json",data:plan.encoded(),expected:expected)
        return try load() ?? plan
    }
}

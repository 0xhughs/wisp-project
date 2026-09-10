import Foundation
func diagnosticsSnapshotTests() throws {
    let facts = DiagnosticsFacts.sample
    let text = DiagnosticsSnapshot.render(facts)
    try check(text.contains("Engine lifecycle:") && text.contains("Voice phase: idle") && text.contains("Mute: no"), "labeled engine and voice phase, not voice.status")
    try check(text.contains("Home configured: no") && !text.contains("Wisp folder") && !text.contains("/Users/"), "homeConfigured without path")
    try check(text.contains("Last stop: none") && text.contains("telemetry is disabled") && !text.contains("feedback-only") && text.contains("no required cloud account"), "telemetry disabled, last-stop none")
    try check(!text.contains("BEGIN") && !text.contains("sk-") && !text.contains("memory.json") && !text.contains("the rain in spain") && !text.contains("unimplemented"), "omit secrets and recognized sample phrase")
    try check(DiagnosticsSnapshot.copyText(facts) == text, "Copy uses the same redacted string")
    var hostile = DiagnosticsFacts.sample
    hostile.recoveryCopy = "sk-live BEGIN CERTIFICATE memory.json /Users/wisp a688c6a5-c493-42ef-8714-33fc4da2c7a9 /opt/wisp/plugins/demo.ts the rain in spain"
    hostile.hardwareText = hostile.recoveryCopy
    let cleaned = DiagnosticsSnapshot.render(hostile)
    try check(!cleaned.contains("sk-live") && !cleaned.contains("BEGIN") && !cleaned.contains("memory.json") && !cleaned.contains("/Users/") && !cleaned.contains("a688c6a5-c493-42ef-8714-33fc4da2c7a9") && !cleaned.contains("/opt/wisp/plugins/demo.ts"), "hostile sentinels omitted from snapshot text")
    try check(OnboardingRefresh.isAllowed("hardware-collect") && OnboardingRefresh.isAllowed("GET /api/version") && OnboardingRefresh.isAllowed("GET /api/tags"), "Refresh is 08 inspect")
    try check(!OnboardingRefresh.isAllowed("session/prompt") && !OnboardingRefresh.isAllowed("wakeVoice") && !OnboardingRefresh.isAllowed("api/pull") && !OnboardingRefresh.operations.contains("wakeVoice") && !OnboardingRefresh.operations.contains("session/prompt"), "Refresh excludes session/prompt, pull, and wakeVoice")
}

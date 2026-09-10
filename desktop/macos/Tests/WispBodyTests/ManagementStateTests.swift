import Foundation
func managementStateTests() throws {
    var state = ManagementState()
    try check(state.section == .general && state.lifecycle == .starting, "initial management")
    state.select(.memory); state.refresh(.idle)
    try check(state.section == .memory && state.lifecycle == .ready, "navigation survives readiness")
    try check(!state.voiceAvailable && state.canShowCompanion, "engine readiness never enables voice")
    state.refresh(.unavailable); state.refresh(.idle)
    try check(state.lifecycle == .unavailable && state.canNavigate, "failure rejects stale readiness")
    state.refresh(.stopped); state.refresh(.unavailable); state.select(.models)
    try check(state.lifecycle == .stopping && !state.canNavigate && state.section == .memory, "stop is terminal")
    try check(ManagementSection.allCases.count == 11, "complete navigation")
}

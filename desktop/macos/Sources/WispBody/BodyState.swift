import Foundation
enum BodyPhase:String { case starting, idle, listening, speaking, processing, approval, muted, unavailable, stopped }
struct BodyState {
    private(set) var phase:BodyPhase = .starting
    private(set) var generation=0
    mutating func ready() { if phase == .starting { phase = .idle; generation += 1 } }
    mutating func present(_ next:BodyPhase, token:Int) -> Bool {
        guard token == generation, (phase == .idle && next == .listening) || (phase == .listening && next == .speaking) else { return false }
        phase=next; return true
    }
    mutating func interrupt() { generation += 1; if phase == .listening || phase == .speaking { phase = .idle } }
    mutating func unavailable() { generation += 1; if phase != .stopped { phase = .unavailable } }
    mutating func stop() { generation += 1; phase = .stopped }
}

enum MotionPolicy {
    static func animate(visible:Bool,reduceMotion:Bool) -> Bool { visible && !reduceMotion }
}

import Foundation
func bodyStateTests() throws {
    try check(MotionPolicy.animate(visible:true,reduceMotion:false),"visible animation enabled")
    try check(!MotionPolicy.animate(visible:true,reduceMotion:true),"reduce motion suppresses animation")
    try check(!MotionPolicy.animate(visible:false,reduceMotion:false),"hidden animation suppressed")
    var state=BodyState(); state.ready(); let token=state.generation
    try check(state.present(.listening,token:token),"begin listening")
    state.interrupt(); try check(!state.present(.speaking,token:token),"reject stale speaking")
    try check(state.phase == .idle,"interruption returns idle")
    try check(!state.present(.speaking,token:state.generation),"reject invalid jump")
    _=state.present(.listening,token:state.generation); state.unavailable(); state.interrupt()
    try check(state.phase == .unavailable,"replacement cannot resurrect failure")
    state.stop(); state.ready(); try check(state.phase == .stopped,"stopped is terminal")
}

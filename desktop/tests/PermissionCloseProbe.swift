import Foundation
// Headless native state seam used by CompanionController.cancelPermissions().
@main struct PermissionCloseProbe {
    static func main() throws {
        let frames=try JSONSerialization.jsonObject(with:FileHandle.standardInput.readDataToEndOfFile()) as! [[String:Any]]
        let requests=try frames.map(PermissionRequest.init)
        guard let first=requests.first else {throw PermissionFailure.invalid}
        var state=PermissionState();state.attach(generation:first.generation,companionID:first.companionID)
        for request in requests {try state.receive(request)}
        var decisions=[[String:Any]]()
        // Repeated native close gestures before acknowledgements must emit once.
        if let decision=state.cancelAll(){decisions.append(decision)}
        if let decision=state.cancelAll(){decisions.append(decision)}
        guard decisions.count==1,state.deciding.count==requests.count else {throw PermissionFailure.invalid}
        try FileHandle.standardOutput.write(contentsOf:JSONSerialization.data(withJSONObject:decisions))
    }
}

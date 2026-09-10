import Foundation
func memoryStoreTests() throws {
    let item = MemoryEntry(id: UUID().uuidString.lowercased(), category: .fact, text: "Literal {{unknown}}\nمرحبا 🦊")
    let document = MemoryDocument(version: 1, entries: [item])
    let data = try document.encoded()
    try check(try MemoryDocument.decode(data) == document, "memory unicode round trip")
    func rejects(_ text: String) throws {
        do { _ = try MemoryDocument.decode(Data(text.utf8)); throw NSError(domain:"accepted-invalid",code:1) }
        catch let error as StoreError { try check(error == .invalidMemory, "invalid schema category") }
    }
    try rejects("{broken")
    try rejects("{\"version\":1,\"entries\":[{\"id\":\"" + item.id + "\",\"category\":\"../fact\",\"text\":\"x\"}]}")
    do { _ = try MemoryDocument.decode(Data([0xff,0xfe])); throw NSError(domain:"utf8",code:1) } catch StoreError.invalidMemory {}
    do { _ = try MemoryDocument.decode(Data(repeating:32,count:32769)); throw NSError(domain:"bytes",code:1) } catch StoreError.invalidMemory {}
    do { _ = try MemoryDocument(version:1,entries:(0..<65).map { _ in MemoryEntry(id:UUID().uuidString,category:.fact,text:"x") }).encoded(); throw NSError(domain:"entries",code:1) } catch StoreError.invalidMemory {}
    try rejects("{\"version\":true,\"entries\":[]}")
    try rejects("{\"version\":2,\"entries\":[]}")
    try rejects("{\"version\":1,\"entries\":[],\"path\":\"../secret\"}")
    do { _ = try MemoryDocument(version:1,entries:[item,item]).encoded(); throw NSError(domain:"duplicate",code:1) } catch is StoreError {}
    do { _ = try MemoryDocument(version:1,entries:[MemoryEntry(id:item.id,category:.fact,text:String(repeating:"x",count:2001))]).encoded(); throw NSError(domain:"size",code:1) } catch is StoreError {}
}

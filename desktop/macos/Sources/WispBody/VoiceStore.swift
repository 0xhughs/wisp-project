import Foundation
struct VoiceConfiguration:Codable,Equatable {
    var version=1
    var locale="en-US"
    var voice="com.apple.voice.compact.en-US.Samantha"
    var rate:Float=0.5
    var muted=false
    func validate() throws {
        guard version==1,!locale.isEmpty,locale.utf8.count<=80,!voice.isEmpty,voice.utf8.count<=200,rate.isFinite,(0...1).contains(rate) else {throw StoreError.invalidMemory}
    }
    func encoded() throws -> Data {try validate();return try JSONEncoder().encode(self)}
    static func decode(_ data:Data)throws->Self {
        guard data.count<=4096,let o=try JSONSerialization.jsonObject(with:data) as? [String:Any],Set(o.keys)==["version","locale","voice","rate","muted"] else {throw StoreError.invalidMemory}
        let value=try JSONDecoder().decode(Self.self,from:data);try value.validate();return value
    }
}
// Uses the same owned-directory lock and atomic publication as Models and Memory.
final class VoiceStore {
    private let defaults:()->VoiceConfiguration
    private let directory:OwnedDirectory
    private let ownership:DirectoryOwnership
    init(support:URL,defaults:@escaping()->VoiceConfiguration={VoiceConfiguration()})throws {
        self.defaults=defaults
        let url=support.appendingPathComponent("voice",isDirectory:true)
        if !FileManager.default.fileExists(atPath:url.path){try FileManager.default.createDirectory(at:url,withIntermediateDirectories:false,attributes:[.posixPermissions:0o700])}
        directory=try OwnedDirectory(url);ownership=try directory.lock("owner.lock")
    }
    func load()throws->VoiceConfiguration {
        try ownership.verify()
        if try !directory.exists("config.json"){try directory.create("config.json",data:defaults().encoded())}
        return try VoiceConfiguration.decode(directory.read("config.json",limit:4096))
    }
    func save(_ value:VoiceConfiguration)throws {
        _ = try load();let data=try directory.read("config.json",limit:4096)
        try directory.replace("config.json",data:value.encoded(),expected:MemoryDocument.revision(data))
    }
}

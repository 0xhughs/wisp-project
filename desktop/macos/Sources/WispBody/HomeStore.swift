import Foundation
import Darwin
import CoreFoundation

func canonicalDirectoryURL(_ url: URL) throws -> URL {
    guard let path = realpath(url.path,nil) else { throw StoreError.unavailable }
    defer { free(path) }; return URL(fileURLWithPath:String(cString:path),isDirectory:true)
}

// All methods are synchronous and must be called on the owner's serial I/O queue.
// Anchored descriptors and fixed leaf names prevent a changed path/link from redirecting writes.
final class OwnedDirectory {
    private(set) var url: URL
    let fd: Int32
    init(_ url: URL) throws {
        var leafState = stat()
        guard lstat(url.path,&leafState) == 0, leafState.st_mode & S_IFMT == S_IFDIR else { throw StoreError.unsafe }
        self.url = try canonicalDirectoryURL(url)
        fd = open(self.url.path, O_RDONLY | O_DIRECTORY | O_NOFOLLOW_ANY | O_CLOEXEC)
        guard fd >= 0 else { throw StoreError.unavailable }
        do { try verify() } catch { close(fd); throw error }
    }
    deinit { close(fd) }
    func verify() throws {
        var st = stat(), actual = stat()
        guard fstat(fd,&st) == 0, st.st_uid == getuid(), st.st_mode & 0o077 == 0 else { throw StoreError.unsafe }
        let current = open(url.path,O_RDONLY | O_DIRECTORY | O_NOFOLLOW_ANY | O_CLOEXEC)
        guard current >= 0 else { throw StoreError.unavailable }; defer { close(current) }
        guard fstat(current,&actual) == 0, actual.st_dev == st.st_dev, actual.st_ino == st.st_ino else { throw StoreError.unsafe }
    }
    func verifySameDirectory(_ selected: OwnedDirectory) throws {
        try selected.verify()
        var held = stat(), candidate = stat()
        guard fstat(fd,&held) == 0, fstat(selected.fd,&candidate) == 0,
              held.st_dev == candidate.st_dev, held.st_ino == candidate.st_ino else { throw StoreError.differentHome }
    }
    func rebind(_ selected: OwnedDirectory) throws {
        try verifySameDirectory(selected)
        // Keep the original open descriptor and its directory flock throughout recovery.
        url = selected.url
    }
    private func leaf(_ name: String) throws { guard !name.isEmpty, !name.contains("/"), name != ".", name != ".." else { throw StoreError.unsafe } }
    func handle(_ name: String, create: Bool = false) throws -> Int32 {
        try leaf(name); try verify()
        let file = openat(fd,name,(create ? O_RDWR | O_CREAT : O_RDONLY) | O_NOFOLLOW | O_CLOEXEC | O_NONBLOCK,0o600)
        guard file >= 0 else { throw StoreError.unavailable }
        var st = stat()
        guard fstat(file,&st) == 0, st.st_mode & S_IFMT == S_IFREG, st.st_uid == getuid(), st.st_nlink == 1, st.st_mode & 0o077 == 0 else { close(file); throw StoreError.unsafe }
        return file
    }
    func exists(_ name: String) throws -> Bool {
        try leaf(name); try verify(); var st = stat()
        if fstatat(fd,name,&st,AT_SYMLINK_NOFOLLOW) == 0 { return true }
        guard errno == ENOENT else { throw StoreError.unavailable }; return false
    }
    func read(_ name: String, limit: Int = 65536) throws -> Data {
        let file = try handle(name); defer { close(file) }
        var st = stat(); guard fstat(file,&st) == 0, st.st_size <= limit else { throw StoreError.invalidMemory }
        var data = Data(), buffer = [UInt8](repeating:0,count:4096)
        while true { let n = Darwin.read(file,&buffer,buffer.count); guard n >= 0 else { throw StoreError.unavailable }; if n == 0 { break }; data.append(contentsOf:buffer.prefix(n)); guard data.count <= limit else { throw StoreError.invalidMemory } }
        try verify(); return data
    }
    func create(_ name: String, data: Data) throws {
        try leaf(name); try verify()
        let temporary = ".wisp-stage-" + UUID().uuidString
        let file = openat(fd,temporary,O_WRONLY | O_CREAT | O_EXCL | O_NOFOLLOW | O_CLOEXEC,0o600)
        guard file >= 0 else { throw StoreError.writeFailed }
        defer { close(file); unlinkat(fd,temporary,0) }
        try writeAll(file,data); guard fsync(file) == 0 else { throw StoreError.writeFailed }
        try verify()
        guard renameatx_np(fd,temporary,fd,name,UInt32(RENAME_EXCL)) == 0, fsync(fd) == 0 else { throw StoreError.writeFailed }
        try verify()
    }

    private func writeAll(_ file: Int32, _ data: Data) throws {
        try data.withUnsafeBytes { raw in
            var offset = 0
            while offset < raw.count { let n = Darwin.write(file,raw.baseAddress!.advanced(by:offset),raw.count-offset); guard n > 0 else { throw StoreError.writeFailed }; offset += n }
        }
    }
    // Fault hooks are only available to the native assertion runner through dependency injection.
    func replace(_ name: String, data: Data, expected: String?, beforePublish: (() throws -> Void)? = nil) throws {
        try leaf(name); try verify()
        let temporary = ".wisp-save-" + UUID().uuidString
        try create(temporary,data:data)
        defer { unlinkat(fd,temporary,0) }
        try beforePublish?(); try verify()
        if try exists(name) {
            let old = try read(name)
            if let expected, MemoryDocument.revision(old) != expected { throw StoreError.conflict }
        } else if expected != nil { throw StoreError.conflict }
        guard renameat(fd,temporary,fd,name) == 0, fsync(fd) == 0 else { throw StoreError.writeFailed }
        try verify()
    }
    func lock(_ name: String) throws -> DirectoryOwnership {
        return try DirectoryOwnership(directory:self,name:name)
    }
}

// The directory inode remains the exclusion anchor even if a named lock is unlinked.
// Retaining/checking the named inode also makes visible lock tampering fail closed.
final class DirectoryOwnership {
    private let directory: OwnedDirectory
    private let name: String
    private let file: Int32
    init(directory: OwnedDirectory, name: String) throws {
        self.directory = directory; self.name = name
        guard flock(directory.fd,LOCK_EX | LOCK_NB) == 0 else { throw StoreError.busy }
        do {
            file = try directory.handle(name,create:true)
        } catch { flock(directory.fd,LOCK_UN); throw error }
        do {
            guard flock(file,LOCK_EX | LOCK_NB) == 0 else { throw StoreError.busy }
            try verify()
        } catch { close(file); flock(directory.fd,LOCK_UN); throw error }
    }
    deinit { close(file); flock(directory.fd,LOCK_UN) }
    func verify(at selected: OwnedDirectory? = nil) throws {
        if let selected { try directory.verifySameDirectory(selected) }
        else { try directory.verify() }
        var held = stat(), named = stat()
        guard fstat(file,&held) == 0, held.st_mode & S_IFMT == S_IFREG,
              held.st_uid == getuid(), held.st_nlink == 1, held.st_mode & 0o077 == 0,
              fstatat(directory.fd,name,&named,AT_SYMLINK_NOFOLLOW) == 0,
              named.st_dev == held.st_dev, named.st_ino == held.st_ino,
              named.st_mode & S_IFMT == S_IFREG else { throw StoreError.unsafe }
    }
}

final class HomeStore {
    var supportURL: URL { support.url }
    private let support: OwnedDirectory
    private var supportLock: DirectoryOwnership!
    private var homeLock: DirectoryOwnership?
    private var home: OwnedDirectory?
    private var companionId: String?
    private let checkpoint: (String) throws -> Void
    init(supportURL: URL, checkpoint: @escaping (String) throws -> Void = { _ in }) throws {
        self.checkpoint = checkpoint
        let url = supportURL.standardizedFileURL
        // Parent is Foundation's user application-support location, or an explicit test-only root.
        if !FileManager.default.fileExists(atPath:url.path) {
            try FileManager.default.createDirectory(at:url,withIntermediateDirectories:false,attributes:[.posixPermissions:0o700])
        }
        support = try OwnedDirectory(url)
        supportLock = try support.lock("owner.lock")
    }
    private func binding(_ name: String) throws -> (String,Data)? {
        guard try support.exists(name) else { return nil }
        guard let object = try? JSONSerialization.jsonObject(with:support.read(name)) as? [String:String], Set(object.keys) == ["companionId","bookmark"], let id = object["companionId"], UUID(uuidString:id) != nil, let bookmark = object["bookmark"].flatMap({Data(base64Encoded:$0)}) else { throw StoreError.invalidHome }
        return (id,bookmark)
    }
    private func pointer(_ id: String, _ url: URL) throws -> Data {
        let data = try url.bookmarkData(options:.withoutImplicitSecurityScope,includingResourceValuesForKeys:nil,relativeTo:nil)
        return try JSONSerialization.data(withJSONObject:["companionId":id,"bookmark":data.base64EncodedString()],options:.sortedKeys)
    }
    private func marker(_ directory: OwnedDirectory) throws -> String {
        guard let object = try? JSONSerialization.jsonObject(with:directory.read("wisp-home.json")) as? [String:Any], Set(object.keys) == ["version","companionId"], let version = object["version"] as? NSNumber, version == 1, CFGetTypeID(version) != CFBooleanGetTypeID(), let id = object["companionId"] as? String, UUID(uuidString:id) != nil else { throw StoreError.invalidHome }; return id
    }
    func load() throws -> MemorySnapshot? {
        try supportLock.verify()
        guard let (id,bookmark) = try binding("home.json") else { return nil }
        var stale = false
        let url: URL
        do { url = try URL(resolvingBookmarkData:bookmark,options:[.withoutUI,.withoutMounting],relativeTo:nil,bookmarkDataIsStale:&stale) } catch { throw StoreError.unavailable }
        try attach(url,id:id)
        let snapshot = try read()
        if stale { try support.replace("home.json",data:pointer(id,url),expected:nil) }
        return snapshot
    }
    private func validateSeparation(_ url: URL) throws {
        let a = url.standardizedFileURL.path + "/", b = support.url.path + "/"
        guard !a.hasPrefix(b), !b.hasPrefix(a) else { throw StoreError.unsafe }
    }
    private func attach(_ url: URL, id: String) throws {
        try supportLock.verify(); try homeLock?.verify()
        try validateSeparation(url)
        if let home, home.url == (try? canonicalDirectoryURL(url)), companionId == id { try home.verify(); guard try marker(home) == id else { throw StoreError.differentHome }; return }
        let directory = try OwnedDirectory(url)
        guard try marker(directory) == id else { throw StoreError.differentHome }
        let lock = try directory.lock(".wisp-lock")
        homeLock = lock; home = directory; companionId = id
    }
    func choose(_ selected: URL) throws -> MemorySnapshot {
        try supportLock.verify()
        // A selected symlink is refused before canonicalizing OS-managed parent aliases.
        var st = stat(); guard lstat(selected.path,&st) == 0, st.st_mode & S_IFMT == S_IFDIR, st.st_uid == getuid() else { throw StoreError.unsafe }
        let url = try canonicalDirectoryURL(selected)
        try validateSeparation(url)
        if let (id,_) = try binding("home.json") {
            if let home, let lock = homeLock {
                guard companionId == id else { throw StoreError.differentHome }
                let selectedDirectory = try OwnedDirectory(url)
                // Explicit recovery can validate the moved path against the still-held inode.
                // It never closes/reacquires either ownership lock or accepts a copied marker.
                try lock.verify(at:selectedDirectory)
                let snapshot = try validatedSnapshot(selectedDirectory,id:id)
                try support.replace("home.json",data:pointer(id,url),expected:nil)
                try lock.verify(at:selectedDirectory); try home.rebind(selectedDirectory)
                return snapshot
            }
            try attach(url,id:id); let snapshot = try read(); try support.replace("home.json",data:pointer(id,url),expected:nil); return snapshot
        }
        let pending = try binding("pending.json")
        let id: String
        if let (expected,bookmark) = pending {
            var stale = false
            guard let pendingURL = try? URL(resolvingBookmarkData:bookmark,options:[.withoutUI,.withoutMounting],relativeTo:nil,bookmarkDataIsStale:&stale), (try? canonicalDirectoryURL(pendingURL)) == url else { throw StoreError.differentHome }
            id = expected
        } else {
            guard try FileManager.default.contentsOfDirectory(atPath:url.path).isEmpty else { throw StoreError.invalidHome }
            // Only the explicitly chosen empty directory is tightened, never its contents/parents.
            guard chmod(url.path,0o700) == 0 else { throw StoreError.unsafe }
            id = UUID().uuidString.lowercased()
            try support.replace("pending.json",data:pointer(id,url),expected:nil)
        }
        let directory = try OwnedDirectory(url)
        let expectedNames: Set<String> = ["wisp-home.json","memory.json","files","README.txt",".wisp-lock"]
        for name in try FileManager.default.contentsOfDirectory(atPath:url.path) where !expectedNames.contains(name) {
            // A process killed before exclusive publication may leave this reserved staging name.
            guard name.hasPrefix(".wisp-stage-"), UUID(uuidString:String(name.dropFirst(12))) != nil else { throw StoreError.invalidHome }
            _ = try directory.read(name)
        }
        let lock = try directory.lock(".wisp-lock")
        let markerData = try JSONSerialization.data(withJSONObject:["version":1,"companionId":id],options:.sortedKeys)
        if try directory.exists("wisp-home.json") { guard try marker(directory) == id else { throw StoreError.differentHome } } else { try directory.create("wisp-home.json",data:markerData) }
        if !(try directory.exists("memory.json")) { try directory.create("memory.json",data:MemoryDocument().encoded()) }
        if !(try directory.exists("README.txt")) { try directory.create("README.txt",data:Data("Wisp home format 1\nEdit memory.json: version 1, entries with UUID id, category preference/project/instruction/fact, and plain text. Maximum 64 entries, 2000 Unicode scalars per text, 32 KiB document. Keep file mode 600. Never place credentials in memory. Save and reload in Wisp; edits apply on next app launch. Files in files/ are yours and are not scanned. Do not edit wisp-home.json. Internal sessions are separate.\n".utf8)) }
        if !(try directory.exists("files")) { guard mkdirat(directory.fd,"files",0o700) == 0, fsync(directory.fd) == 0 else { throw StoreError.writeFailed } }
        try checkpoint("before-home-pointer")
        // Existing objects from interrupted initialization receive the full read validation.
        let snapshot = try validatedSnapshot(directory,id:id)
        try supportLock.verify(); try lock.verify()
        try support.replace("home.json",data:pointer(id,url),expected:nil)
        homeLock = lock; home = directory; companionId = id
        // A committed home wins over its pending record; keep the harmless recovery receipt.
        return snapshot
    }
    private func validatedSnapshot(_ directory: OwnedDirectory, id: String) throws -> MemorySnapshot {
        guard try marker(directory) == id else { throw StoreError.differentHome }
        _ = try OwnedDirectory(directory.url.appendingPathComponent("files"))
        _ = try directory.read("README.txt")
        let bytes = try directory.read("memory.json",limit:MemoryDocument.maxBytes)
        return MemorySnapshot(companionId:id,document:try MemoryDocument.decode(bytes),revision:MemoryDocument.revision(bytes),folder:directory.url,bytes:bytes)
    }
    func read() throws -> MemorySnapshot {
        try supportLock.verify(); try homeLock?.verify()
        guard let home, let id = companionId else { throw StoreError.unavailable }
        return try validatedSnapshot(home,id:id)
    }
    func save(_ document: MemoryDocument, expected: String, beforePublish: (() throws -> Void)? = nil, afterPublish: (() throws -> Void)? = nil) throws -> MemorySnapshot {
        guard let home else { throw StoreError.unavailable }
        let bytes = try document.encoded()
        var coordinationError: NSError?, failure: Error?
        NSFileCoordinator().coordinate(writingItemAt:home.url.appendingPathComponent("memory.json"),options:.forReplacing,error:&coordinationError) { url in
            do {
                guard url.standardizedFileURL == home.url.appendingPathComponent("memory.json").standardizedFileURL else { throw StoreError.conflict }
                _ = try read(); try home.replace("memory.json",data:bytes,expected:expected,beforePublish:{ try beforePublish?(); try self.supportLock.verify(); try self.homeLock?.verify() }); try afterPublish?()
            } catch { failure = error }
        }
        if let failure { throw failure }; if coordinationError != nil { throw StoreError.writeFailed }
        return try read()
    }
    func clearStage() throws {
        try supportLock.verify()
        if try support.exists("launch-memory.json") {
            let file = try support.handle("launch-memory.json"); close(file)
            guard unlinkat(support.fd,"launch-memory.json",0) == 0, fsync(support.fd) == 0 else { throw StoreError.writeFailed }
        }
    }
    func stage(_ snapshot: MemorySnapshot) throws -> URL {
        let current = try read()
        guard current.companionId == snapshot.companionId, current.revision == snapshot.revision else { throw StoreError.conflict }
        // This is private bootstrap data, never a diagnostic or a user-selected path to execute.
        let data = try JSONSerialization.data(withJSONObject:["version":1,"companionId":snapshot.companionId,"revision":snapshot.revision,"memory":try JSONSerialization.jsonObject(with:snapshot.bytes)],options:.sortedKeys)
        try support.replace("launch-memory.json",data:data,expected:nil)
        return support.url.appendingPathComponent("launch-memory.json")
    }
}

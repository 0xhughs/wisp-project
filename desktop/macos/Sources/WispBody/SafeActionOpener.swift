import Foundation
import Darwin
#if canImport(AppKit)
import AppKit
#endif
#if canImport(UniformTypeIdentifiers)
import UniformTypeIdentifiers
#endif

enum SafeActionOpenFailure: Error { case invalid, denied }

protocol WorkspaceOpening {
    func open(_ url: URL) -> Bool
}

final class RecordingWorkspaceOpener: WorkspaceOpening {
    private(set) var opened:[URL]=[]
    var count:Int { opened.count }
    func open(_ url: URL) -> Bool { opened.append(url); return true }
}

struct NativeWorkspaceOpener: WorkspaceOpening {
    func open(_ url: URL) -> Bool {
        #if canImport(AppKit)
        return NSWorkspace.shared.open(url)
        #else
        return false
        #endif
    }
}

enum SafeActionOpener {
    static let viewerSuffixes:Set<String>=[".txt",".md",".markdown",".pdf",".png",".jpg",".jpeg",".gif",".webp",".csv",".json",".html",".htm",".rtf"]
    static let deniedSuffixes:Set<String>=[".app",".command",".tool",".sh",".bash",".zsh",".exe",".bin",".pkg",".dmg",".py",".rb",".pl"]
    static let privilegedPrefixes=["/etc","/private/etc","/System","/usr","/bin","/sbin","/var","/private/var","/dev","/proc","/root","/boot","/sys","/Library"]

    static func privileged(_ canonical:String) -> Bool {
        if canonical.contains("/Library/Keychains") { return true }
        return privilegedPrefixes.contains { canonical == $0 || canonical.hasPrefix($0 + "/") }
    }

    static func rejectPrivilegedDestination(_ destination:String) throws {
        guard destination.hasPrefix("/"), !destination.contains("\0") else { throw SafeActionOpenFailure.invalid }
        if privileged(destination) { throw SafeActionOpenFailure.denied }
    }

    static func revalidateHTTP(_ destination:String) throws -> URL {
        guard !destination.isEmpty, destination.count <= 2048,
              !destination.unicodeScalars.contains(where: { $0.value < 32 || $0.value == 127 || (0x202a...0x202e).contains($0.value) || (0x2066...0x2069).contains($0.value) }),
              let url=URL(string:destination), let scheme=url.scheme?.lowercased(), scheme=="http" || scheme=="https",
              url.user==nil, url.password==nil, let host=url.host, !host.isEmpty else { throw SafeActionOpenFailure.invalid }
        return url
    }

    static func revalidateViewerFile(_ destination:String) throws -> URL {
        try rejectPrivilegedDestination(destination)
        var st=stat()
        guard lstat(destination,&st)==0, (st.st_mode & S_IFMT)==S_IFREG else { throw SafeActionOpenFailure.denied }
        let fd=open(destination,O_RDONLY|O_NOFOLLOW|O_CLOEXEC)
        guard fd>=0 else { throw SafeActionOpenFailure.denied }
        defer { close(fd) }
        var opened=stat()
        guard fstat(fd,&opened)==0, (opened.st_mode & S_IFMT)==S_IFREG else { throw SafeActionOpenFailure.denied }
        if opened.st_mode & (S_IXUSR|S_IXGRP|S_IXOTH) != 0 { throw SafeActionOpenFailure.denied }
        var magic=[UInt8](repeating:0,count:2)
        let n=Darwin.read(fd,&magic,2)
        if n>=2, magic[0]==0x23, magic[1]==0x21 { throw SafeActionOpenFailure.denied }
        guard let resolved=realpath(destination,nil) else { throw SafeActionOpenFailure.denied }
        defer { free(resolved) }
        let canonical=String(cString:resolved)
        if privileged(canonical) { throw SafeActionOpenFailure.denied }
        let base=canonical.split(separator:"/").last.map(String.init) ?? ""
        let suffix:String
        if let dot=base.lastIndex(of:"."), dot >= base.startIndex { suffix=String(base[dot...]).lowercased() } else { suffix="" }
        if deniedSuffixes.contains(suffix) || !viewerSuffixes.contains(suffix) { throw SafeActionOpenFailure.denied }
        let url=URL(fileURLWithPath:canonical)
        #if canImport(UniformTypeIdentifiers)
        if let type=try? url.resourceValues(forKeys:[.contentTypeKey]).contentType {
            if type.conforms(to:.executable) || type.conforms(to:.unixExecutable) || type.conforms(to:.application) || type.conforms(to:.shellScript) {
                throw SafeActionOpenFailure.denied
            }
        }
        #endif
        return url
    }

    static func handle(_ event:[String:Any], expectedGeneration:String, opener:WorkspaceOpening) throws -> [String:Any] {
        guard event["event"] as? String=="open-request", event["version"] as? Int==1,
              event["generation"] as? String==expectedGeneration,
              let openRequestId=event["openRequestId"] as? String, !openRequestId.isEmpty,
              let kind=event["kind"] as? String, let destination=event["destination"] as? String else { throw SafeActionOpenFailure.invalid }
        let url:URL
        if kind=="url" { url=try revalidateHTTP(destination) }
        else if kind=="file" { url=try revalidateViewerFile(destination) }
        else { throw SafeActionOpenFailure.invalid }
        let ok=opener.open(url)
        return ["version":1,"generation":expectedGeneration,"openRequestId":openRequestId,"kind":kind,"destination":destination,"outcome": ok ? "opened":"failed"]
    }

    static func failed(from event:[String:Any]) -> [String:Any]? {
        guard let generation=event["generation"] as? String, let openRequestId=event["openRequestId"] as? String,
              let kind=event["kind"] as? String, let destination=event["destination"] as? String else { return nil }
        return ["version":1,"generation":generation,"openRequestId":openRequestId,"kind":kind,"destination":destination,"outcome":"failed"]
    }
}

func formatGatedClock(_ date:Date, timeZone:TimeZone = .current) -> (local:String, iso:String, timeZone:String) {
    let iso=ISO8601DateFormatter(); iso.formatOptions=[.withInternetDateTime]; iso.timeZone=TimeZone(secondsFromGMT:0)
    let local=DateFormatter(); local.timeZone=timeZone; local.dateStyle = .full; local.timeStyle = .long
    return (local.string(from:date), iso.string(from:date), timeZone.identifier)
}

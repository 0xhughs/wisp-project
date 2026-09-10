import Foundation
import CoreFoundation
#if os(macOS)
import Metal
import IOKit
import Darwin
#endif

enum HardwareError: Error { case invalid, doubleCount }

struct HardwareCPU: Equatable {
    var status: String, modelName: String?, logicalCount: Int?, reason: String?
}
struct HardwareVRAM: Equatable {
    var status: String, bytes: Int?, reason: String?
}
struct HardwareGPU: Equatable {
    var status: String, name: String?, hasUnifiedMemory: Bool?, workingSetHintBytes: Int?, vram: HardwareVRAM, reason: String?
}
struct HardwareMemory: Equatable {
    var status: String, kind: String, totalBytes: Int?, availableBytes: Int?, unifiedBytes: Int?, reason: String?
}
struct HardwareDisk: Equatable {
    var status: String, availableBytes: Int?, rootAvailableBytes: Int?, homeAvailableBytes: Int?, reason: String?
}
struct SpeechHeadroom: Equatable {
    var reservation = "qualitative"
    var numericReservationBytes: Int? = nil
    var concurrentRecognitionAndTts = true
    var note = "Wisp does not treat all reported memory as model budget. Concurrent on-device recognition and text-to-speech remain a workload."
}
struct HardwareSnapshot: Equatable {
    var version = 1
    var platform: String
    var cpu: HardwareCPU
    var memory: HardwareMemory
    var gpu: HardwareGPU
    var disk: HardwareDisk
    var speechHeadroom = SpeechHeadroom()
    var sources: [String]
    var digest: String
}

enum HardwareProbe {
    static let maxBytes = 16384
    static let schemaVersion = 1
    // Native Swift is uncompiled/unverified on Linux. JSON fixtures decode without Metal.
    static func speechHeadroom() -> SpeechHeadroom { SpeechHeadroom() }
    static func object(_ snapshot: HardwareSnapshot) -> [String:Any] {
        func opt(_ value: Int?) -> Any { value.map { $0 as Any } ?? NSNull() }
        func optS(_ value: String?) -> Any { value.map { $0 as Any } ?? NSNull() }
        func optB(_ value: Bool?) -> Any { value.map { $0 as Any } ?? NSNull() }
        return [
            "version": schemaVersion,
            "platform": snapshot.platform,
            "cpu": ["status":snapshot.cpu.status,"modelName":optS(snapshot.cpu.modelName),"logicalCount":opt(snapshot.cpu.logicalCount),"reason":optS(snapshot.cpu.reason)],
            "memory": ["status":snapshot.memory.status,"kind":snapshot.memory.kind,"totalBytes":opt(snapshot.memory.totalBytes),"availableBytes":opt(snapshot.memory.availableBytes),"unifiedBytes":opt(snapshot.memory.unifiedBytes),"reason":optS(snapshot.memory.reason)],
            "gpu": ["status":snapshot.gpu.status,"name":optS(snapshot.gpu.name),"hasUnifiedMemory":optB(snapshot.gpu.hasUnifiedMemory),"workingSetHintBytes":opt(snapshot.gpu.workingSetHintBytes),
                    "vram":["status":snapshot.gpu.vram.status,"bytes":opt(snapshot.gpu.vram.bytes),"reason":optS(snapshot.gpu.vram.reason)],
                    "reason":optS(snapshot.gpu.reason)],
            "disk": ["status":snapshot.disk.status,"availableBytes":opt(snapshot.disk.availableBytes),"rootAvailableBytes":opt(snapshot.disk.rootAvailableBytes),"homeAvailableBytes":opt(snapshot.disk.homeAvailableBytes),"reason":optS(snapshot.disk.reason)],
            "speechHeadroom": ["reservation":snapshot.speechHeadroom.reservation,"numericReservationBytes":NSNull(),"concurrentRecognitionAndTts":true,"note":snapshot.speechHeadroom.note],
            "sources": snapshot.sources,
            "digest": snapshot.digest
        ]
    }
    static func digest(of object: [String:Any]) throws -> String {
        var copy = object; copy.removeValue(forKey:"digest")
        let data = try JSONSerialization.data(withJSONObject:copy,options:.sortedKeys)
        guard data.count <= maxBytes else { throw HardwareError.invalid }
        return MemoryDocument.revision(data)
    }
    static func finalize(_ snapshot: HardwareSnapshot) throws -> HardwareSnapshot {
        var value = snapshot
        var o = object(value); o.removeValue(forKey:"digest")
        value.digest = try digest(of:o)
        return try decode(JSONSerialization.data(withJSONObject:object(value),options:.sortedKeys))
    }
    static func decode(_ data: Data) throws -> HardwareSnapshot {
        guard data.count <= maxBytes, let o = try JSONSerialization.jsonObject(with:data) as? [String:Any] else { throw HardwareError.invalid }
        return try decodeObject(o)
    }
    static func decodeObject(_ o: [String:Any]) throws -> HardwareSnapshot {
        guard Set(o.keys) == ["version","platform","cpu","memory","gpu","disk","speechHeadroom","sources","digest"] else { throw HardwareError.invalid }
        guard let version = o["version"] as? NSNumber, CFGetTypeID(version) != CFBooleanGetTypeID(), version == 1,
              let platform = o["platform"] as? String, ["linux","macos","unknown"].contains(platform),
              let sources = o["sources"] as? [String], sources.count <= 32, sources.allSatisfy({ !$0.isEmpty && $0.count <= 80 }),
              let digest = o["digest"] as? String, digest.range(of:"^[a-f0-9]{64}$",options:.regularExpression) != nil else { throw HardwareError.invalid }
        let cpu = try decodeCPU(o["cpu"])
        let memory = try decodeMemory(o["memory"])
        let gpu = try decodeGPU(o["gpu"])
        let disk = try decodeDisk(o["disk"])
        let speech = try decodeHeadroom(o["speechHeadroom"])
        if memory.kind == "unified" && memory.status == "available" && gpu.vram.status == "available" { throw HardwareError.doubleCount }
        if gpu.hasUnifiedMemory == true && gpu.vram.status == "available" { throw HardwareError.doubleCount }
        var body = o; body["digest"] = digest
        let expected = try HardwareProbe.digest(of:o)
        guard digest == expected else { throw HardwareError.invalid }
        return HardwareSnapshot(version:1,platform:platform,cpu:cpu,memory:memory,gpu:gpu,disk:disk,speechHeadroom:speech,sources:sources,digest:digest)
    }
    private static func status(_ o: [String:Any]) throws -> (String, String?) {
        guard let status = o["status"] as? String, ["available","unavailable"].contains(status) else { throw HardwareError.invalid }
        let reason = o["reason"] as? String
        if status == "unavailable" { guard let reason, !reason.isEmpty else { throw HardwareError.invalid } }
        else if reason != nil { throw HardwareError.invalid }
        return (status, reason)
    }
    private static func decodeCPU(_ raw: Any?) throws -> HardwareCPU {
        guard let o = raw as? [String:Any], Set(o.keys) == ["status","modelName","logicalCount","reason"] else { throw HardwareError.invalid }
        let (status, reason) = try status(o)
        let count = int(o["logicalCount"])
        let name = string(o["modelName"])
        if status == "available" { guard let name, let count, count >= 1 else { throw HardwareError.invalid } }
        else if name != nil || count != nil { throw HardwareError.invalid }
        return HardwareCPU(status:status,modelName:name,logicalCount:count,reason:reason)
    }
    private static func decodeMemory(_ raw: Any?) throws -> HardwareMemory {
        guard let o = raw as? [String:Any], Set(o.keys) == ["status","kind","totalBytes","availableBytes","unifiedBytes","reason"],
              let kind = o["kind"] as? String, ["discrete","unified","unknown"].contains(kind) else { throw HardwareError.invalid }
        let (status, reason) = try status(o)
        let total = int(o["totalBytes"]), available = int(o["availableBytes"]), unified = int(o["unifiedBytes"])
        if status == "available" {
            guard let total, total >= 1 else { throw HardwareError.invalid }
            if kind == "unified" { guard unified == total else { throw HardwareError.invalid } }
            else if unified != nil { throw HardwareError.invalid }
        } else if total != nil || available != nil || unified != nil { throw HardwareError.invalid }
        return HardwareMemory(status:status,kind:kind,totalBytes:total,availableBytes:available,unifiedBytes:unified,reason:reason)
    }
    private static func decodeGPU(_ raw: Any?) throws -> HardwareGPU {
        guard let o = raw as? [String:Any], Set(o.keys) == ["status","name","hasUnifiedMemory","workingSetHintBytes","vram","reason"],
              let vramO = o["vram"] as? [String:Any], Set(vramO.keys) == ["status","bytes","reason"] else { throw HardwareError.invalid }
        let (status, reason) = try status(o)
        let (vramStatus, vramReason) = try HardwareProbe.status(vramO)
        let vramBytes = int(vramO["bytes"])
        if vramStatus == "available" { guard let vramBytes, vramBytes >= 1 else { throw HardwareError.invalid } }
        else if vramBytes != nil { throw HardwareError.invalid }
        let name = string(o["name"])
        if status == "available" { guard let name, !name.isEmpty else { throw HardwareError.invalid } }
        else if name != nil { throw HardwareError.invalid }
        if !(o["hasUnifiedMemory"] is NSNull) && o["hasUnifiedMemory"] as? Bool == nil { throw HardwareError.invalid }
        let unified = o["hasUnifiedMemory"] as? Bool
        return HardwareGPU(status:status,name:name,hasUnifiedMemory:unified,workingSetHintBytes:int(o["workingSetHintBytes"]),vram:HardwareVRAM(status:vramStatus,bytes:vramBytes,reason:vramReason),reason:reason)
    }
    private static func decodeDisk(_ raw: Any?) throws -> HardwareDisk {
        guard let o = raw as? [String:Any], Set(o.keys) == ["status","availableBytes","rootAvailableBytes","homeAvailableBytes","reason"] else { throw HardwareError.invalid }
        let (status, reason) = try status(o)
        let available = int(o["availableBytes"]), root = int(o["rootAvailableBytes"]), home = int(o["homeAvailableBytes"])
        if status == "available" { guard let available, available >= 0 else { throw HardwareError.invalid } }
        else if available != nil { throw HardwareError.invalid }
        return HardwareDisk(status:status,availableBytes:available,rootAvailableBytes:root,homeAvailableBytes:home,reason:reason)
    }
    private static func decodeHeadroom(_ raw: Any?) throws -> SpeechHeadroom {
        guard let o = raw as? [String:Any], Set(o.keys) == ["reservation","numericReservationBytes","concurrentRecognitionAndTts","note"],
              o["reservation"] as? String == "qualitative", o["numericReservationBytes"] is NSNull,
              o["concurrentRecognitionAndTts"] as? Bool == true, let note = o["note"] as? String, !note.isEmpty else { throw HardwareError.invalid }
        return SpeechHeadroom(note:note)
    }
    private static func int(_ raw: Any?) -> Int? {
        if raw == nil || raw is NSNull { return nil }
        guard let n = raw as? NSNumber, CFGetTypeID(n) != CFBooleanGetTypeID() else { return nil }
        return n.intValue
    }
    private static func string(_ raw: Any?) -> String? {
        if raw == nil || raw is NSNull { return nil }
        return raw as? String
    }
    static func assertNotDoubleCounted(_ snapshot: HardwareSnapshot) throws {
        if snapshot.memory.kind == "unified" && snapshot.gpu.vram.status == "available" { throw HardwareError.doubleCount }
        if snapshot.hasUnifiedMemory == true && snapshot.gpu.vram.status == "available" { throw HardwareError.doubleCount }
    }
    static func unavailable(platform: String, cpuReason: String, memoryReason: String, gpuReason: String, diskReason: String, sources: [String] = []) throws -> HardwareSnapshot {
        try finalize(HardwareSnapshot(
            platform:platform,
            cpu:HardwareCPU(status:"unavailable",modelName:nil,logicalCount:nil,reason:cpuReason),
            memory:HardwareMemory(status:"unavailable",kind:"unknown",totalBytes:nil,availableBytes:nil,unifiedBytes:nil,reason:memoryReason),
            gpu:HardwareGPU(status:"unavailable",name:nil,hasUnifiedMemory:nil,workingSetHintBytes:nil,vram:HardwareVRAM(status:"unavailable",bytes:nil,reason:gpuReason),reason:gpuReason),
            disk:HardwareDisk(status:"unavailable",availableBytes:nil,rootAvailableBytes:nil,homeAvailableBytes:nil,reason:diskReason),
            sources:sources,digest:""
        ))
    }
    static func collect(home: URL? = nil, ollamaModels: String? = nil) -> HardwareSnapshot {
        #if os(macOS)
        return collectMac(home:home,ollamaModels:ollamaModels)
        #else
        return (try? unavailable(platform:"unknown",cpuReason:"Live HardwareProbe is macOS-only (uncompiled on Linux).",memoryReason:"Live HardwareProbe is macOS-only (uncompiled on Linux).",gpuReason:"Do not fabricate GPU on Linux. Use hardware-inspect.mjs.",diskReason:"Live HardwareProbe is macOS-only (uncompiled on Linux).",sources:["linux-uncompiled"])) ?? HardwareSnapshot(platform:"unknown",cpu:HardwareCPU(status:"unavailable",modelName:nil,logicalCount:nil,reason:"uncompiled"),memory:HardwareMemory(status:"unavailable",kind:"unknown",totalBytes:nil,availableBytes:nil,unifiedBytes:nil,reason:"uncompiled"),gpu:HardwareGPU(status:"unavailable",name:nil,hasUnifiedMemory:nil,workingSetHintBytes:nil,vram:HardwareVRAM(status:"unavailable",bytes:nil,reason:"uncompiled"),reason:"uncompiled"),disk:HardwareDisk(status:"unavailable",availableBytes:nil,rootAvailableBytes:nil,homeAvailableBytes:nil,reason:"uncompiled"),sources:["linux-uncompiled"],digest:String(repeating:"0",count:64))
        #endif
    }
    #if os(macOS)
    private static func sysctlString(_ name: String) -> String? {
        var size = 0
        guard sysctlbyname(name,nil,&size,nil,0) == 0, size > 1 else { return nil }
        var buffer = [CChar](repeating:0,count:size)
        guard sysctlbyname(name,&buffer,&size,nil,0) == 0 else { return nil }
        return String(cString:buffer)
    }
    private static func ioKitGPUName() -> String? {
        var iterator: io_iterator_t = 0
        guard IOServiceGetMatchingServices(kIOMainPortDefault, IOServiceMatching("IOAccelerator"), &iterator) == KERN_SUCCESS else { return nil }
        defer { IOObjectRelease(iterator) }
        let service = IOIteratorNext(iterator)
        guard service != 0 else { return nil }
        defer { IOObjectRelease(service) }
        guard let prop = IORegistryEntryCreateCFProperty(service, "model" as CFString, kCFAllocatorDefault, 0) else { return nil }
        return (prop.takeRetainedValue() as? String)
    }
    private static func volumeAvailable(_ url: URL) -> Int? {
        let values = try? url.resourceValues(forKeys: [.volumeAvailableCapacityForImportantUsageKey])
        if let cap = values?.volumeAvailableCapacityForImportantUsage, cap >= 0 { return Int(cap) }
        return nil
    }
    private static func collectMac(home: URL?, ollamaModels: String?) -> HardwareSnapshot {
        var sources: [String] = ["process-info"]
        let info = ProcessInfo.processInfo
        let cpuName = sysctlString("machdep.cpu.brand_string") ?? sysctlString("hw.model")
        if cpuName != nil { sources.append("sysctl-cpu") }
        let cpu: HardwareCPU
        if let cpuName, !cpuName.isEmpty, info.processorCount >= 1 {
            cpu = HardwareCPU(status:"available",modelName:cpuName,logicalCount:info.processorCount,reason:nil)
        } else {
            cpu = HardwareCPU(status:"unavailable",modelName:nil,logicalCount:nil,reason:"CPU model is unavailable from ProcessInfo/sysctl")
        }
        let physical = Int(info.physicalMemory)
        var deviceName: String? = nil
        var unified: Bool? = nil
        var workingSet: Int? = nil
        if let device = MTLCreateSystemDefaultDevice() {
            sources.append("metal-default-device")
            deviceName = device.name
            unified = device.hasUnifiedMemory
            workingSet = Int(device.recommendedMaxWorkingSetSize)
        }
        if let ioName = ioKitGPUName() {
            sources.append("iokit-gpu")
            if deviceName == nil { deviceName = ioName }
        }
        let memory: HardwareMemory
        if physical >= 1 {
            if unified == true {
                memory = HardwareMemory(status:"available",kind:"unified",totalBytes:physical,availableBytes:nil,unifiedBytes:physical,reason:nil)
            } else {
                memory = HardwareMemory(status:"available",kind:"discrete",totalBytes:physical,availableBytes:nil,unifiedBytes:nil,reason:nil)
            }
        } else {
            memory = HardwareMemory(status:"unavailable",kind:"unknown",totalBytes:nil,availableBytes:nil,unifiedBytes:nil,reason:"ProcessInfo.physicalMemory unavailable")
        }
        let gpu: HardwareGPU
        if let deviceName, !deviceName.isEmpty {
            if unified == true {
                gpu = HardwareGPU(status:"available",name:deviceName,hasUnifiedMemory:true,workingSetHintBytes:workingSet,vram:HardwareVRAM(status:"unavailable",bytes:nil,reason:"unified memory already reported"),reason:nil)
            } else if workingSet != nil {
                gpu = HardwareGPU(status:"available",name:deviceName,hasUnifiedMemory:unified,workingSetHintBytes:workingSet,vram:HardwareVRAM(status:"unavailable",bytes:nil,reason:"discrete VRAM bytes were not obtained from Metal working-set hint"),reason:nil)
            } else {
                gpu = HardwareGPU(status:"available",name:deviceName,hasUnifiedMemory:unified,workingSetHintBytes:nil,vram:HardwareVRAM(status:"unavailable",bytes:nil,reason:"discrete VRAM bytes were not obtained"),reason:nil)
            }
        } else {
            gpu = HardwareGPU(status:"unavailable",name:nil,hasUnifiedMemory:nil,workingSetHintBytes:nil,vram:HardwareVRAM(status:"unavailable",bytes:nil,reason:"Metal default device unavailable"),reason:"Metal default device unavailable")
        }
        let rootBytes = volumeAvailable(URL(fileURLWithPath:"/"))
        if rootBytes != nil { sources.append("volume-root") }
        let homeBytes = home.flatMap { volumeAvailable($0) }
        if home != nil { if homeBytes != nil { sources.append("volume-home") } }
        var ollamaBytes: Int? = nil
        if let ollamaModels, !ollamaModels.isEmpty {
            ollamaBytes = volumeAvailable(URL(fileURLWithPath:ollamaModels))
            if ollamaBytes != nil { sources.append("volume-ollama-models") }
        }
        let shown = ollamaBytes ?? homeBytes ?? rootBytes
        let disk: HardwareDisk
        if let shown {
            disk = HardwareDisk(status:"available",availableBytes:shown,rootAvailableBytes:rootBytes,homeAvailableBytes:homeBytes,reason:nil)
        } else {
            disk = HardwareDisk(status:"unavailable",availableBytes:nil,rootAvailableBytes:rootBytes,homeAvailableBytes:homeBytes,reason:"volumeAvailableCapacityForImportantUsage unavailable")
        }
        let snapshot = HardwareSnapshot(platform:"macos",cpu:cpu,memory:memory,gpu:gpu,disk:disk,sources:sources,digest:"")
        return (try? finalize(snapshot)) ?? snapshot
    }
    #endif
}

private extension HardwareSnapshot { var hasUnifiedMemory: Bool? { gpu.hasUnifiedMemory } }

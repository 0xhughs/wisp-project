import Foundation
func hardwareProbeTests() throws {
    let discrete = try HardwareProbe.finalize(HardwareSnapshot(
        platform:"linux",
        cpu:HardwareCPU(status:"available",modelName:"Injected CPU",logicalCount:2,reason:nil),
        memory:HardwareMemory(status:"available",kind:"discrete",totalBytes:8_589_934_592,availableBytes:4_294_967_296,unifiedBytes:nil,reason:nil),
        gpu:HardwareGPU(status:"unavailable",name:nil,hasUnifiedMemory:nil,workingSetHintBytes:nil,vram:HardwareVRAM(status:"unavailable",bytes:nil,reason:"no drm/sysfs GPU node"),reason:"no drm/sysfs GPU node"),
        disk:HardwareDisk(status:"available",availableBytes:4096,rootAvailableBytes:4096,homeAvailableBytes:nil,reason:nil),
        sources:["proc-meminfo","proc-cpuinfo","statfs-root"],digest:""
    ))
    try check(discrete.speechHeadroom.numericReservationBytes == nil && discrete.speechHeadroom.reservation == "qualitative", "speechHeadroom always qualitative")
    try check(discrete.gpu.status == "unavailable" && discrete.gpu.vram.bytes == nil && discrete.gpu.vram.reason?.contains("drm") == true, "unavailable GPU is not zero")
    try HardwareProbe.assertNotDoubleCounted(discrete)
    let encoded = try JSONSerialization.data(withJSONObject:HardwareProbe.object(discrete),options:.sortedKeys)
    let decoded = try HardwareProbe.decode(encoded)
    try check(decoded == discrete, "JSON fixture decode without Metal")
    do { _ = try HardwareProbe.decode(Data("{\"version\":2}".utf8)); throw NSError(domain:"unknown version accepted",code:1) } catch is HardwareError {}
    let huge = Data(repeating:0x31,count:HardwareProbe.maxBytes+8)
    do { _ = try HardwareProbe.decode(huge); throw NSError(domain:"oversize accepted",code:1) } catch is HardwareError {}
    let unified = try HardwareProbe.finalize(HardwareSnapshot(
        platform:"macos",
        cpu:HardwareCPU(status:"available",modelName:"Apple fixture",logicalCount:8,reason:nil),
        memory:HardwareMemory(status:"available",kind:"unified",totalBytes:17_179_869_184,availableBytes:nil,unifiedBytes:17_179_869_184,reason:nil),
        gpu:HardwareGPU(status:"available",name:"Apple M-series (fixture)",hasUnifiedMemory:true,workingSetHintBytes:12_000_000_000,vram:HardwareVRAM(status:"unavailable",bytes:nil,reason:"unified memory already reported"),reason:nil),
        disk:HardwareDisk(status:"available",availableBytes:80_000_000_000,rootAvailableBytes:80_000_000_000,homeAvailableBytes:nil,reason:nil),
        sources:["process-info","metal-default-device"],digest:""
    ))
    try HardwareProbe.assertNotDoubleCounted(unified)
    do {
        var bad = HardwareProbe.object(unified)
        var gpu = bad["gpu"] as! [String:Any]
        gpu["vram"] = ["status":"available","bytes":8_000_000_000,"reason":NSNull()]
        bad["gpu"] = gpu
        bad["digest"] = try HardwareProbe.digest(of:bad)
        _ = try HardwareProbe.decodeObjectForTest(bad)
        throw NSError(domain:"unified plus VRAM accepted",code:1)
    } catch HardwareError.doubleCount {}
    print("HardwareProbe assertions: decode fixtures, unified not summed, unavailable reason, uncompiled on Linux")
}

private extension HardwareProbe {
    static func decodeObjectForTest(_ o: [String:Any]) throws -> HardwareSnapshot { try decode(JSONSerialization.data(withJSONObject:o,options:.sortedKeys)) }
}

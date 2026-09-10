// swift-tools-version: 6.0
import PackageDescription
let package = Package(name: "WispBody", platforms: [.macOS(.v14)], products: [.executable(name: "WispBody", targets: ["WispBody"])], targets: [.executableTarget(name: "WispBody")], swiftLanguageModes: [.v5])

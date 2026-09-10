import Foundation
import Darwin
// Developer test helper only. Built outside the application. Never accepts production state.
@main struct HomeFixture {
    static func main() throws {
        guard CommandLine.arguments.count == 4 else { exit(2) }
        let mode = CommandLine.arguments[1], support = URL(fileURLWithPath:CommandLine.arguments[2]), home = URL(fileURLWithPath:CommandLine.arguments[3])
        let parent = support.deletingLastPathComponent()
        guard FileManager.default.fileExists(atPath:parent.appendingPathComponent(".wisp-owned").path), home.deletingLastPathComponent() == parent else { exit(2) }
        let store = try HomeStore(supportURL:support)
        if mode == "create" {
            try FileManager.default.createDirectory(at:home,withIntermediateDirectories:false,attributes:[.posixPermissions:0o700])
            _ = try store.choose(home); print("fixture-created")
        } else if mode == "hold" {
            guard try store.load() != nil else { exit(2) }
            print("fixture-held"); fflush(stdout)
            while readLine() != nil {}
        } else { exit(2) }
    }
}

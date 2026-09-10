import Foundation
import Darwin
// Test-only line protocol: isolated, marked scratch only; never linked into Wisp.
@main struct HomeOwnershipProbe {
    static func main() throws {
        guard CommandLine.arguments.count == 3 else { exit(2) }
        let root = URL(fileURLWithPath:CommandLine.arguments[1]), name = CommandLine.arguments[2]
        guard name == "a" || name == "b", FileManager.default.fileExists(atPath:root.appendingPathComponent(".wisp-owned").path) else { exit(2) }
        let home = root.appendingPathComponent("home")
        do {
            let store = try HomeStore(supportURL:root.appendingPathComponent(name))
            let snapshot = try store.load() ?? store.choose(home)
            print("READY"); fflush(stdout)
            while let command = readLine(), command != "quit" {
                do {
                    switch command {
                    case "read": _ = try store.read()
                    case "load": _ = try store.load()
                    case "choose": _ = try store.choose(home)
                    case "choose-moved": _ = try store.choose(root.appendingPathComponent("moved"))
                    case "choose-other": _ = try store.choose(root.appendingPathComponent("other"))
                    case "stage": _ = try store.stage(snapshot)
                    case "save": _ = try store.save(snapshot.document,expected:snapshot.revision)
                    default: exit(2)
                    }
                    print("OK")
                } catch { print("REFUSED") }
                fflush(stdout)
            }
        } catch { print("REFUSED"); fflush(stdout) }
    }
}

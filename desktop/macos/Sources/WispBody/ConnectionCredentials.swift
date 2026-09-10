import Foundation
import Security
import Darwin

enum ConnectionError: Error {
    case invalid, keychain
    var message: String {
        switch self {
        case .invalid: return "Connection settings are invalid. Restore the saved file, then Reload Saved."
        case .keychain: return "The connection credential could not be updated. Try again."
        }
    }
}

// Narrow exact-item API. Separate service from com.wisp.reasoning.*. No listing or plaintext fallback.
final class ConnectionCredentials {
    private let service: String
    private var testKeychain: SecKeychain?
    init(namespace: String, testKeychainPath: String? = nil) throws {
        guard UUID(uuidString:namespace) != nil else { throw ConnectionError.invalid }
        service = "com.wisp.connection." + namespace.lowercased()
        if let path = testKeychainPath {
            let parent = try OwnedDirectory(URL(fileURLWithPath:path).deletingLastPathComponent())
            try parent.verify()
            var st=stat()
            if lstat(path,&st) == 0 { guard st.st_mode & S_IFMT == S_IFREG,st.st_uid == getuid(),st.st_nlink == 1 else { throw ConnectionError.keychain } }
            else if errno != ENOENT { throw ConnectionError.keychain }
            let password = "wisp-isolated-test-only"
            let status: OSStatus
            if FileManager.default.fileExists(atPath:path) {
                status = SecKeychainOpen(path,&testKeychain)
            } else {
                status = password.withCString { SecKeychainCreate(path,UInt32(password.utf8.count),$0,false,nil,&testKeychain) }
            }
            try parent.verify()
            guard chmod(path,0o600) == 0 else { throw ConnectionError.keychain }
            guard status == errSecSuccess, let chain = testKeychain else { throw ConnectionError.keychain }
            guard password.withCString({ SecKeychainUnlock(chain,UInt32(password.utf8.count),$0,true) }) == errSecSuccess else { throw ConnectionError.keychain }
        }
    }
    private func requireUnlocked() throws {
        var status: SecKeychainStatus=0
        guard SecKeychainGetStatus(testKeychain,&status) == errSecSuccess,
              status & SecKeychainStatus(kSecUnlockStateStatus) != 0 else { throw ConnectionError.keychain }
    }
    private func query(_ id: String) throws -> [String:Any] {
        guard UUID(uuidString:id) != nil else { throw ConnectionError.invalid }
        var result: [String:Any] = [kSecClass as String:kSecClassGenericPassword,kSecAttrService as String:service,kSecAttrAccount as String:id]
        if let chain = testKeychain { result[kSecMatchSearchList as String] = [chain] }
        return result
    }
    func add(_ id: String, value: String) throws {
        try requireUnlocked()
        guard !value.isEmpty,value.utf8.count <= 4096,!value.unicodeScalars.contains(where:{$0.value < 32 || $0.value == 127}) else { throw ConnectionError.invalid }
        var attributes = try query(id)
        attributes.removeValue(forKey:kSecMatchSearchList as String)
        if let chain = testKeychain { attributes[kSecUseKeychain as String] = chain }
        attributes[kSecValueData as String] = Data(value.utf8)
        guard SecItemAdd(attributes as CFDictionary,nil) == errSecSuccess else { throw ConnectionError.keychain }
    }
    func read(_ id: String) throws -> String? {
        guard !id.isEmpty else { return nil }; try requireUnlocked()
        var request = try query(id); request[kSecReturnData as String] = true; request[kSecMatchLimit as String] = kSecMatchLimitOne
        var result: CFTypeRef?
        let status = SecItemCopyMatching(request as CFDictionary,&result)
        if status == errSecItemNotFound { return nil }
        guard status == errSecSuccess,let data = result as? Data,let value = String(data:data,encoding:.utf8),!value.isEmpty else { throw ConnectionError.keychain }
        return value
    }
    func remove(_ id: String) throws {
        guard !id.isEmpty else { return }; try requireUnlocked()
        let status = SecItemDelete(try query(id) as CFDictionary)
        guard status == errSecSuccess || status == errSecItemNotFound else { throw ConnectionError.keychain }
    }
    func withLockedTestKeychain(_ operation: () throws -> Void) throws {
        guard let chain=testKeychain else { throw ConnectionError.keychain }
        var previous: DarwinBoolean=false
        guard SecKeychainGetUserInteractionAllowed(&previous) == errSecSuccess else { throw ConnectionError.keychain }
        guard SecKeychainSetUserInteractionAllowed(false) == errSecSuccess,SecKeychainLock(chain) == errSecSuccess else { throw ConnectionError.keychain }
        defer {
            let password="wisp-isolated-test-only"
            _ = password.withCString { SecKeychainUnlock(chain,UInt32(password.utf8.count),$0,true) }
            SecKeychainSetUserInteractionAllowed(previous.boolValue)
        }
        try operation()
    }
    func destroyTestKeychain() throws {
        guard let chain = testKeychain else { throw ConnectionError.keychain }
        guard SecKeychainDelete(chain) == errSecSuccess else { throw ConnectionError.keychain }; testKeychain = nil
    }
}

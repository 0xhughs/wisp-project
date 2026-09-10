import Foundation
import Security
import Darwin

// Narrow exact-item API. No listing, default search-list edits or plaintext fallback.
final class ReasoningCredentials {
    private let service: String
    private var testKeychain: SecKeychain?
    private let checkpoint: (String) throws -> Void
    init(namespace: String, testKeychainPath: String? = nil, checkpoint: @escaping (String) throws -> Void = { _ in }) throws {
        self.checkpoint=checkpoint
        guard UUID(uuidString:namespace) != nil else { throw ReasoningError.invalid }
        service = "com.wisp.reasoning." + namespace.lowercased()
        if let path = testKeychainPath {
            let parent = try OwnedDirectory(URL(fileURLWithPath:path).deletingLastPathComponent())
            try parent.verify()
            var st=stat()
            if lstat(path,&st) == 0 { guard st.st_mode & S_IFMT == S_IFREG,st.st_uid == getuid(),st.st_nlink == 1 else { throw ReasoningError.keychain } }
            else if errno != ENOENT { throw ReasoningError.keychain }
            let password = "wisp-isolated-test-only"
            let status: OSStatus
            if FileManager.default.fileExists(atPath:path) {
                status = SecKeychainOpen(path,&testKeychain)
            } else {
                status = password.withCString { SecKeychainCreate(path,UInt32(password.utf8.count),$0,false,nil,&testKeychain) }
            }
            try parent.verify()
            guard chmod(path,0o600) == 0 else { throw ReasoningError.keychain }
            guard status == errSecSuccess, let chain = testKeychain else { throw ReasoningError.keychain }
            guard password.withCString({ SecKeychainUnlock(chain,UInt32(password.utf8.count),$0,true) }) == errSecSuccess else { throw ReasoningError.keychain }
        }
    }
    // Inspect lock metadata before asking for secret contents. Legacy Keychain reads can
    // wait for UI even when SecItem's newer authentication-UI option is disabled.
    private func requireUnlocked() throws {
        var status: SecKeychainStatus=0
        guard SecKeychainGetStatus(testKeychain,&status) == errSecSuccess,
              status & SecKeychainStatus(kSecUnlockStateStatus) != 0 else { throw ReasoningError.keychain }
    }
    private func query(_ id: String) throws -> [String:Any] {
        guard UUID(uuidString:id) != nil else { throw ReasoningError.invalid }
        var result: [String:Any] = [kSecClass as String:kSecClassGenericPassword,kSecAttrService as String:service,kSecAttrAccount as String:id]
        if let chain = testKeychain { result[kSecMatchSearchList as String] = [chain] }
        return result
    }
    func add(_ id: String, value: String) throws {
        try checkpoint("add"); try requireUnlocked()
        guard !value.isEmpty,value.utf8.count <= 4096,!value.unicodeScalars.contains(where:{$0.value < 32 || $0.value == 127}) else { throw ReasoningError.invalidKey }
        var attributes = try query(id)
        attributes.removeValue(forKey:kSecMatchSearchList as String)
        if let chain = testKeychain { attributes[kSecUseKeychain as String] = chain }
        attributes[kSecValueData as String] = Data(value.utf8)
        guard SecItemAdd(attributes as CFDictionary,nil) == errSecSuccess else { throw ReasoningError.keychain }
    }
    func read(_ id: String) throws -> String? {
        guard !id.isEmpty else { return nil }; try checkpoint("read"); try requireUnlocked()
        var request = try query(id); request[kSecReturnData as String] = true; request[kSecMatchLimit as String] = kSecMatchLimitOne
        var result: CFTypeRef?
        let status = SecItemCopyMatching(request as CFDictionary,&result)
        if status == errSecItemNotFound { return nil }
        guard status == errSecSuccess,let data = result as? Data,let value = String(data:data,encoding:.utf8),!value.isEmpty else { throw ReasoningError.keychain }
        return value
    }
    func remove(_ id: String) throws {
        guard !id.isEmpty else { return }; try checkpoint("remove"); try requireUnlocked()
        let status = SecItemDelete(try query(id) as CFDictionary)
        guard status == errSecSuccess || status == errSecItemNotFound else { throw ReasoningError.keychain }
    }
    func withLockedTestKeychain(_ operation: () throws -> Void) throws {
        guard let chain=testKeychain else { throw ReasoningError.keychain }
        var previous: DarwinBoolean=false
        guard SecKeychainGetUserInteractionAllowed(&previous) == errSecSuccess else { throw ReasoningError.keychain }
        guard SecKeychainSetUserInteractionAllowed(false) == errSecSuccess,SecKeychainLock(chain) == errSecSuccess else { throw ReasoningError.keychain }
        defer {
            let password="wisp-isolated-test-only"
            _ = password.withCString { SecKeychainUnlock(chain,UInt32(password.utf8.count),$0,true) }
            SecKeychainSetUserInteractionAllowed(previous.boolValue)
        }
        try operation()
    }
    // Available only on an explicitly constructed isolated test vault.
    func destroyTestKeychain() throws {
        guard let chain = testKeychain else { throw ReasoningError.keychain }
        guard SecKeychainDelete(chain) == errSecSuccess else { throw ReasoningError.keychain }; testKeychain = nil
    }
}

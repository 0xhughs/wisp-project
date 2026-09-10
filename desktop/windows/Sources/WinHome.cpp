#include "WinHome.h"

#include "HomeIdentity.h"

#include <objbase.h>
#include <shlobj.h>
#include <aclapi.h>
#include <sddl.h>

#include <cstdio>
#include <vector>

std::string wideToUtf8(const std::wstring& value) {
  if (value.empty()) return {};
  const int n = WideCharToMultiByte(CP_UTF8, 0, value.c_str(), -1, nullptr, 0, nullptr, nullptr);
  std::string out(n ? n - 1 : 0, 0);
  if (n) WideCharToMultiByte(CP_UTF8, 0, value.c_str(), -1, out.data(), n, nullptr, nullptr);
  return out;
}

std::wstring utf8ToWide(const std::string& value) {
  if (value.empty()) return {};
  const int n = MultiByteToWideChar(CP_UTF8, 0, value.c_str(), -1, nullptr, 0);
  std::wstring out(n ? n - 1 : 0, 0);
  if (n) MultiByteToWideChar(CP_UTF8, 0, value.c_str(), -1, out.data(), n);
  return out;
}

bool pathExists(const std::wstring& path) {
  return GetFileAttributesW(path.c_str()) != INVALID_FILE_ATTRIBUTES;
}

bool writeUtf8File(const std::wstring& path, const std::string& bytes) {
  HANDLE file = CreateFileW(path.c_str(), GENERIC_WRITE, 0, nullptr, CREATE_ALWAYS, FILE_ATTRIBUTE_NORMAL, nullptr);
  if (file == INVALID_HANDLE_VALUE) return false;
  DWORD written = 0;
  const BOOL ok = WriteFile(file, bytes.data(), static_cast<DWORD>(bytes.size()), &written, nullptr);
  FlushFileBuffers(file);
  CloseHandle(file);
  setOwnerOnly(path);
  return ok && written == bytes.size();
}

bool readUtf8File(const std::wstring& path, std::string& bytes) {
  HANDLE file = CreateFileW(path.c_str(), GENERIC_READ, FILE_SHARE_READ, nullptr, OPEN_EXISTING, FILE_ATTRIBUTE_NORMAL, nullptr);
  if (file == INVALID_HANDLE_VALUE) return false;
  const DWORD size = GetFileSize(file, nullptr);
  if (size > 65536) {
    CloseHandle(file);
    return false;
  }
  bytes.assign(size, 0);
  DWORD read = 0;
  const BOOL ok = ReadFile(file, bytes.data(), size, &read, nullptr);
  CloseHandle(file);
  return ok != 0;
}

bool setOwnerOnly(const std::wstring& path) {
  PSECURITY_DESCRIPTOR sd = nullptr;
  if (!ConvertStringSecurityDescriptorToSecurityDescriptorW(L"D:P(A;;FA;;;OW)", SDDL_REVISION_1, &sd, nullptr)) return false;
  const BOOL ok = SetFileSecurityW(path.c_str(), DACL_SECURITY_INFORMATION, sd);
  LocalFree(sd);
  return ok != 0;
}

HANDLE lockLeaf(const std::wstring& path) {
  HANDLE file = CreateFileW(path.c_str(), GENERIC_READ | GENERIC_WRITE, FILE_SHARE_READ, nullptr, OPEN_ALWAYS,
                            FILE_ATTRIBUTE_NORMAL, nullptr);
  if (file == INVALID_HANDLE_VALUE) return INVALID_HANDLE_VALUE;
  OVERLAPPED ov{};
  if (!LockFileEx(file, LOCKFILE_EXCLUSIVE_LOCK | LOCKFILE_FAIL_IMMEDIATELY, 0, 1, 0, &ov)) {
    CloseHandle(file);
    return INVALID_HANDLE_VALUE;
  }
  setOwnerOnly(path);
  return file;
}

static bool ensureDir(const std::wstring& path) {
  if (pathExists(path)) return true;
  if (!CreateDirectoryW(path.c_str(), nullptr)) return false;
  setOwnerOnly(path);
  return true;
}

static bool directoryIsEmpty(const std::wstring& path) {
  const std::wstring query = path + L"\\*";
  WIN32_FIND_DATAW data{};
  HANDLE find = FindFirstFileW(query.c_str(), &data);
  if (find == INVALID_HANDLE_VALUE) return false;
  bool empty = true;
  do {
    if (wcscmp(data.cFileName, L".") == 0 || wcscmp(data.cFileName, L"..") == 0) continue;
    empty = false;
    break;
  } while (FindNextFileW(find, &data));
  FindClose(find);
  return empty;
}

static std::wstring mintGuid() {
  GUID guid{};
  if (FAILED(CoCreateGuid(&guid))) return {};
  wchar_t buf[64];
  swprintf(buf, 64, L"%08x-%04x-%04x-%02x%02x-%02x%02x%02x%02x%02x%02x", guid.Data1, guid.Data2, guid.Data3,
           guid.Data4[0], guid.Data4[1], guid.Data4[2], guid.Data4[3], guid.Data4[4], guid.Data4[5], guid.Data4[6],
           guid.Data4[7]);
  return buf;
}

bool WinHome::configure(const std::wstring& scratch, const std::wstring& testSupport, bool developerMode) {
  developer = developerMode;
  scratchDir = scratch;
  closeLocks();
  if (developerMode) {
    if (scratch.empty() || testSupport.empty()) return false;
    const bool marked = pathExists(scratch + L"\\.wisp-owned");
    try {
      validateTestSupport(wideToUtf8(scratch), wideToUtf8(testSupport), marked);
    } catch (...) {
      return false;
    }
    supportDir = testSupport;
  } else {
    wchar_t local[MAX_PATH];
    if (FAILED(SHGetFolderPathW(nullptr, CSIDL_LOCAL_APPDATA, nullptr, 0, local))) return false;
    supportDir = std::wstring(local) + L"\\Wisp";
  }
  if (!ensureDir(supportDir)) return false;
  setOwnerOnly(supportDir);
  pointerPath = supportDir + L"\\home.json";
  supportLock = lockLeaf(supportDir + L"\\owner.lock");
  return supportLock != INVALID_HANDLE_VALUE;
}

bool WinHome::loadPointer() {
  companionId.clear();
  homePath.clear();
  if (!pathExists(pointerPath)) return true;
  std::string bytes;
  if (!readUtf8File(pointerPath, bytes)) return false;
  try {
    const HomePointer pointer = parsePointerJson(bytes);
    const std::wstring selected = utf8ToWide(pointer.path);
    std::string markerBytes;
    if (!readUtf8File(selected + L"\\wisp-home.json", markerBytes)) return false;
    bindPointerToMarker(pointer, parseMarkerJson(markerBytes));
    assertPointerSeparation(pointer.path, wideToUtf8(supportDir), scratchDir.empty() ? std::string() : wideToUtf8(scratchDir));
    homeLock = lockLeaf(selected + L"\\.wisp-lock");
    if (homeLock == INVALID_HANDLE_VALUE) return false;
    companionId = utf8ToWide(pointer.companionId);
    homePath = selected;
    return true;
  } catch (...) {
    return false;
  }
}

bool WinHome::applyChoice(const std::wstring& selected, bool cancelled, std::wstring& error) {
  error.clear();
  if (cancelled) return true;
  try {
    std::string markerJson;
    const std::wstring markerPath = selected + L"\\wisp-home.json";
    const std::string* markerPtr = nullptr;
    if (pathExists(markerPath)) {
      if (!readUtf8File(markerPath, markerJson)) {
        error = L"This folder is not a valid Wisp home.";
        return false;
      }
      markerPtr = &markerJson;
    } else if (!directoryIsEmpty(selected)) {
      error = L"This folder is not a valid Wisp home. Choose an empty dedicated folder, or locate your existing home.";
      return false;
    }
    std::string injected;
    std::string injectedUtf8;
    const std::string* injectedPtr = nullptr;
    if (!markerPtr) {
      injected = wideToUtf8(mintGuid());
      injectedUtf8 = injected;
      injectedPtr = &injectedUtf8;
    }
    const FolderPlan plan = planFolderChoice(false, markerPtr, injectedPtr, wideToUtf8(selected), wideToUtf8(supportDir),
                                              scratchDir.empty() ? std::string() : wideToUtf8(scratchDir));
    if (plan.action == "noop") return true;
    HANDLE held = lockLeaf(selected + L"\\.wisp-lock");
    if (held == INVALID_HANDLE_VALUE) {
      error = L"This Wisp is already open. Quit the other instance and try again.";
      return false;
    }
    if (plan.writeMarker) {
      if (!writeUtf8File(selected + L"\\wisp-home.json", encodeMarkerJson(plan.companionId))) {
        CloseHandle(held);
        error = L"The save could not be confirmed.";
        return false;
      }
      if (!pathExists(selected + L"\\memory.json")) {
        writeUtf8File(selected + L"\\memory.json", "{\"entries\":[],\"version\":1}\n");
      }
      if (!pathExists(selected + L"\\README.txt")) writeUtf8File(selected + L"\\README.txt", kHomeReadme);
      const std::wstring files = selected + L"\\files";
      if (!pathExists(files)) {
        CreateDirectoryW(files.c_str(), nullptr);
        setOwnerOnly(files);
      }
    }
    if (!writeUtf8File(pointerPath, encodePointerJson(plan.companionId, plan.pointer.path))) {
      CloseHandle(held);
      error = L"The save could not be confirmed.";
      return false;
    }
    if (homeLock != INVALID_HANDLE_VALUE) CloseHandle(homeLock);
    homeLock = held;
    companionId = utf8ToWide(plan.companionId);
    homePath = selected;
    return true;
  } catch (...) {
    error = L"This folder is not a valid Wisp home.";
    return false;
  }
}

void WinHome::closeLocks() {
  if (homeLock != INVALID_HANDLE_VALUE) {
    CloseHandle(homeLock);
    homeLock = INVALID_HANDLE_VALUE;
  }
  if (supportLock != INVALID_HANDLE_VALUE) {
    CloseHandle(supportLock);
    supportLock = INVALID_HANDLE_VALUE;
  }
}

std::wstring WinHome::catalogHint() const {
  if (homePath.empty()) return {};
  std::string bytes;
  if (!readUtf8File(homePath + L"\\pets\\config.json", bytes)) return {};
  const auto pos = bytes.find("\"catalogId\"");
  if (pos == std::string::npos) return {};
  return utf8ToWide(bytes);
}

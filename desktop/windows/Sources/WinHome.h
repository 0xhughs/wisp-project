#pragma once

#define UNICODE
#define _UNICODE
#define NOMINMAX
#define WIN32_LEAN_AND_MEAN
#include <windows.h>

#include "HomeIdentity.h"

#include <string>

struct WinHome {
  std::wstring supportDir;
  std::wstring scratchDir;
  std::wstring pointerPath;
  std::wstring companionId;
  std::wstring homePath;
  HANDLE supportLock = INVALID_HANDLE_VALUE;
  HANDLE homeLock = INVALID_HANDLE_VALUE;
  bool developer = false;

  bool configure(const std::wstring& scratch, const std::wstring& testSupport, bool developerMode);
  bool loadPointer();
  bool applyChoice(const std::wstring& selected, bool cancelled, std::wstring& error);
  void closeLocks();
  std::wstring catalogHint() const;
};

std::string wideToUtf8(const std::wstring& value);
std::wstring utf8ToWide(const std::string& value);
bool pathExists(const std::wstring& path);
bool writeUtf8File(const std::wstring& path, const std::string& bytes);
bool readUtf8File(const std::wstring& path, std::string& bytes);
bool setOwnerOnly(const std::wstring& path);
HANDLE lockLeaf(const std::wstring& path);

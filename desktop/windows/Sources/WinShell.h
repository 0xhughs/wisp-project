#pragma once

#define UNICODE
#define _UNICODE
#define NOMINMAX
#define WIN32_LEAN_AND_MEAN
#include <windows.h>
#include <shlobj.h>
#include <shellapi.h>

#include <string>

enum {
  ID_SHOW = 1001,
  ID_CHOOSE = 1002,
  ID_GENERAL = 1003,
  ID_WAKE = 1004,
  ID_MUTE = 1005,
  ID_QUIT = 1006,
  ID_VOICE_LABEL = 1007
};

struct WinShell {
  HWND host = nullptr;
  HWND general = nullptr;
  HINSTANCE instance = nullptr;
  NOTIFYICONDATAW icon{};
  bool trayAdded = false;
  bool hotkeyRegistered = false;
  std::wstring companionText;
  std::wstring folderText;
  std::wstring hotkeyText;
  std::wstring diagnosticsText;

  bool addTray(HINSTANCE inst, HWND messageHost);
  void removeTray();
  void showMenu();
  void openGeneral();
  void closeGeneral();
  bool registerChord();
  void unregisterChord();
  bool pickFolder(std::wstring& path, bool& cancelled);
  void refreshGeneral();
};

LRESULT CALLBACK generalWndProc(HWND hwnd, UINT msg, WPARAM wParam, LPARAM lParam);

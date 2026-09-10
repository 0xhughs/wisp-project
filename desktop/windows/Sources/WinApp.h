#pragma once

#define UNICODE
#define _UNICODE
#define NOMINMAX
#define WIN32_LEAN_AND_MEAN
#include <windows.h>

#include "WinBody.h"
#include "WinHome.h"
#include "WinShell.h"

#include <string>

struct WinApp {
  HINSTANCE instance = nullptr;
  HWND host = nullptr;
  WinBody body;
  WinShell shell;
  WinHome home;
  bool developer = false;
  bool running = true;
  bool bodyFailed = false;
  int sequenceToken = 0;
  UINT_PTR sequenceTimer = 0;
  std::wstring scratch;
  std::wstring testSupport;
  HANDLE mutex = nullptr;

  int run(HINSTANCE inst, const std::wstring& scratchArg, const std::wstring& testSupportArg, bool developerMode);
  void quit();
  void showCompanion();
  void chooseFolder();
  void onHotkey();
  void onDeveloper(const std::string& line);
  void emit(const std::wstring& json);
};

LRESULT CALLBACK hostWndProc(HWND hwnd, UINT msg, WPARAM wParam, LPARAM lParam);

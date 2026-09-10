#include "WinApp.h"

#include "ProductCopy.h"

#include <process.h>

#include <cstring>
#include <functional>
#include <sstream>

static WinApp* gApp = nullptr;

static void writeOut(const std::wstring& text) {
  const std::string utf8 = wideToUtf8(text) + "\n";
  DWORD written = 0;
  WriteFile(GetStdHandle(STD_OUTPUT_HANDLE), utf8.data(), static_cast<DWORD>(utf8.size()), &written, nullptr);
}

void WinApp::emit(const std::wstring& json) { writeOut(json); }

void WinApp::showCompanion() {
  if (body.hwnd) {
    body.showNoActivate();
  }
}

void WinApp::chooseFolder() {
  std::wstring selected;
  bool cancelled = false;
  if (!shell.pickFolder(selected, cancelled)) {
    shell.diagnosticsText = L"Folder picker unavailable.";
    shell.refreshGeneral();
    return;
  }
  std::wstring error;
  if (!home.applyChoice(selected, cancelled, error)) {
    shell.diagnosticsText = error;
    shell.refreshGeneral();
    return;
  }
  if (!cancelled) {
    shell.companionText = home.companionId;
    shell.folderText = home.homePath;
    const std::wstring hint = home.catalogHint();
    if (!hint.empty()) shell.diagnosticsText = L"Saved pet catalog text is display-only; this slice still draws wisp-orb.";
    shell.refreshGeneral();
  }
}

void WinApp::onHotkey() {
  showCompanion();
  if (developer && body.state.phase == BodyPhase::idle) {
    body.state.interrupt();
    body.state.present(BodyPhase::listening, body.state.generation);
    body.render();
    body.present();
    emit(L"{\"event\":\"simulated-presentation\",\"label\":\"simulated presentation state; no microphone\"}");
  }
}

void WinApp::quit() {
  running = false;
  if (sequenceTimer && host) KillTimer(host, sequenceTimer);
  shell.unregisterChord();
  shell.removeTray();
  body.destroy();
  home.closeLocks();
  if (mutex) {
    CloseHandle(mutex);
    mutex = nullptr;
  }
  if (host) PostQuitMessage(0);
}

static void rasterLine(WinApp* app) {
  if (!app->body.hwnd) return;
  const int a0 = orbAlpha(kWispOrbSamples.corner.x, kWispOrbSamples.corner.y);
  const int a1 = orbAlpha(kWispOrbSamples.gap.x, kWispOrbSamples.gap.y);
  const int a2 = orbAlpha(kWispOrbSamples.uniqueOpaque.x, kWispOrbSamples.uniqueOpaque.y);
  std::wostringstream o;
  o << L"{\"event\":\"raster\",\"catalogId\":\"wisp-orb\",\"cornerAlpha\":" << a0
    << L",\"gapAlpha\":" << a1 << L",\"uniqueOpaque\":" << a2 << L"}";
  app->emit(o.str());
}

void WinApp::onDeveloper(const std::string& line) {
  if (line.empty()) return;
  if (line.find("\"op\"") == std::string::npos) return;
  auto has = [&](const char* op) {
    return line.find(std::string("\"op\":\"") + op + "\"") != std::string::npos;
  };
  if (has("listen")) {
    body.state.interrupt();
    body.state.present(BodyPhase::listening, body.state.generation);
    body.render();
    body.present();
    emit(L"{\"event\":\"simulated-presentation\",\"label\":\"simulated presentation state; no microphone\"}");
  } else if (has("speak")) {
    body.state.present(BodyPhase::speaking, body.state.generation);
    body.render();
    body.present();
    emit(L"{\"event\":\"simulated-presentation\",\"label\":\"simulated presentation state; no speech playback\"}");
  } else if (has("interrupt")) {
    body.state.interrupt();
    body.render();
    body.present();
    emit(L"{\"event\":\"interrupted\"}");
  } else if (has("sequence")) {
    if (body.state.phase != BodyPhase::idle) return;
    body.state.interrupt();
    sequenceToken = body.state.generation;
    body.state.present(BodyPhase::listening, sequenceToken);
    body.render();
    body.present();
    emit(L"{\"event\":\"simulated-presentation\",\"label\":\"simulated presentation states; no voice input\"}");
    sequenceTimer = SetTimer(host, 2, 1500, nullptr);
  } else if (has("hide")) {
    body.hide();
    emit(L"{\"event\":\"hidden\"}");
  } else if (has("show")) {
    body.showNoActivate();
    emit(L"{\"event\":\"shown\"}");
  } else if (has("status")) {
    emit(body.statusJson(std::string("\"hotkey\":\"") + (shell.hotkeyRegistered ? kHotkeyRegistered : kHotkeyConflict) +
                          "\",\"engine\":\"" + kEngineNotAttached + "\""));
  } else if (has("raster")) {
    rasterLine(this);
  } else if (has("stop")) {
    quit();
  }
}

static unsigned __stdcall stdinThread(void* arg) {
  auto* app = static_cast<WinApp*>(arg);
  HANDLE in = GetStdHandle(STD_INPUT_HANDLE);
  std::string acc;
  char buf[256];
  DWORD n = 0;
  while (app->running && ReadFile(in, buf, sizeof(buf), &n, nullptr) && n) {
    acc.append(buf, buf + n);
    size_t pos;
    while ((pos = acc.find('\n')) != std::string::npos) {
      std::string line = acc.substr(0, pos);
      acc.erase(0, pos + 1);
      auto* heap = new std::string(line);
      PostMessageW(app->host, WM_APP + 2, 0, reinterpret_cast<LPARAM>(heap));
    }
  }
  return 0;
}

LRESULT CALLBACK hostWndProc(HWND hwnd, UINT msg, WPARAM wParam, LPARAM lParam) {
  WinApp* app = gApp;
  switch (msg) {
    case WM_APP + 1:
      if (lParam == WM_RBUTTONUP || lParam == WM_CONTEXTMENU || LOWORD(lParam) == WM_CONTEXTMENU) {
        if (app) app->shell.showMenu();
      } else if (lParam == WM_LBUTTONUP || LOWORD(lParam) == WM_LBUTTONUP) {
        if (app) app->shell.showMenu();
      }
      return 0;
    case WM_APP + 2:
      if (app && lParam) {
        auto* line = reinterpret_cast<std::string*>(lParam);
        app->onDeveloper(*line);
        delete line;
      }
      return 0;
    case WM_HOTKEY:
      if (app) app->onHotkey();
      return 0;
    case WM_COMMAND:
      if (!app) return 0;
      switch (LOWORD(wParam)) {
        case ID_SHOW:
          app->showCompanion();
          break;
        case ID_CHOOSE:
          app->chooseFolder();
          break;
        case ID_GENERAL:
          app->shell.openGeneral();
          break;
        case ID_WAKE:
        case ID_MUTE:
          break;
        case ID_QUIT:
          app->quit();
          break;
      }
      return 0;
    case WM_TIMER:
      if (app && wParam == 2) {
        KillTimer(hwnd, 2);
        if (app->body.state.present(BodyPhase::speaking, app->sequenceToken)) {
          app->body.render();
          app->body.present();
          app->emit(L"{\"event\":\"simulated-presentation\"}");
        }
        app->sequenceTimer = SetTimer(hwnd, 3, 1500, nullptr);
      } else if (app && wParam == 3) {
        KillTimer(hwnd, 3);
        app->sequenceTimer = 0;
        if (app->body.state.generation == app->sequenceToken) {
          app->body.state.interrupt();
          app->body.render();
          app->body.present();
          app->emit(L"{\"event\":\"simulated-presentation\"}");
        }
      }
      return 0;
    default:
      return DefWindowProcW(hwnd, msg, wParam, lParam);
  }
}

int WinApp::run(HINSTANCE inst, const std::wstring& scratchArg, const std::wstring& testSupportArg, bool developerMode) {
  instance = inst;
  scratch = scratchArg;
  testSupport = testSupportArg;
  developer = developerMode;
  gApp = this;
  CoInitializeEx(nullptr, COINIT_APARTMENTTHREADED);
  WNDCLASSW wc{};
  wc.lpfnWndProc = hostWndProc;
  wc.hInstance = inst;
  wc.lpszClassName = L"WispHost";
  RegisterClassW(&wc);
  host = CreateWindowExW(0, L"WispHost", L"Wisp", WS_OVERLAPPED, 0, 0, 0, 0, HWND_MESSAGE, nullptr, inst, nullptr);
  if (!host) return 1;
  std::wstring mutexName = L"Local\\WispDesktopCompanion";
  if (!testSupport.empty()) mutexName += L"-" + std::to_wstring(static_cast<unsigned>(std::hash<std::wstring>{}(testSupport)));
  mutex = CreateMutexW(nullptr, TRUE, mutexName.c_str());
  if (mutex && GetLastError() == ERROR_ALREADY_EXISTS) {
    CloseHandle(mutex);
    mutex = nullptr;
    CoUninitialize();
    return 1;
  }
  if (!home.configure(scratch, testSupport, developer)) {
    bodyFailed = true;
  } else {
    home.loadPointer();
    shell.companionText = home.companionId;
    shell.folderText = home.homePath;
  }
  if (!shell.addTray(inst, host)) return 1;
  shell.registerChord();
  if (!body.create(inst, host)) {
    bodyFailed = true;
    body.state.unavailable();
  } else {
    body.state.ready();
    body.render();
    body.present();
  }
  shell.diagnosticsText = bodyFailed ? L"Body unavailable. Use Diagnostics-style copy here and Quit Wisp." : L"";
  if (developer) {
    unsigned id = 0;
    _beginthreadex(nullptr, 0, stdinThread, this, 0, &id);
  }
  MSG msg;
  while (GetMessageW(&msg, nullptr, 0, 0) > 0) {
    TranslateMessage(&msg);
    DispatchMessageW(&msg);
  }
  quit();
  CoUninitialize();
  return 0;
}

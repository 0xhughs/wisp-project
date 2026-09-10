#include "WinShell.h"

#include "ProductCopy.h"

#include <shobjidl.h>

#include <string>

#ifndef FOS_PICKFOLDERS
#define FOS_PICKFOLDERS 0x20
#endif

static WinShell* gShell = nullptr;

static std::wstring utf16(const char* s) {
  if (!s || !*s) return L"";
  const int n = MultiByteToWideChar(CP_UTF8, 0, s, -1, nullptr, 0);
  std::wstring out(n ? n - 1 : 0, 0);
  if (n) MultiByteToWideChar(CP_UTF8, 0, s, -1, out.data(), n);
  return out;
}

bool WinShell::addTray(HINSTANCE inst, HWND messageHost) {
  instance = inst;
  host = messageHost;
  gShell = this;
  icon = {};
  icon.cbSize = sizeof(icon);
  icon.hWnd = messageHost;
  icon.uID = 1;
  icon.uFlags = NIF_MESSAGE | NIF_TIP | NIF_ICON;
  icon.uCallbackMessage = WM_APP + 1;
  icon.hIcon = LoadIconW(nullptr, IDI_APPLICATION);
  wcsncpy(icon.szTip, L"Wisp", 128);
  icon.szTip[127] = 0;
  if (!Shell_NotifyIconW(NIM_ADD, &icon)) return false;
  icon.uVersion = NOTIFYICON_VERSION_4;
  Shell_NotifyIconW(NIM_SETVERSION, &icon);
  trayAdded = true;
  hotkeyText = utf16(kHotkeyConflict);
  return true;
}

void WinShell::removeTray() {
  if (trayAdded) Shell_NotifyIconW(NIM_DELETE, &icon);
  trayAdded = false;
}

void WinShell::showMenu() {
  POINT pt{};
  GetCursorPos(&pt);
  HMENU menu = CreatePopupMenu();
  AppendMenuW(menu, MF_STRING, ID_SHOW, utf16(kShowCompanion).c_str());
  AppendMenuW(menu, MF_STRING, ID_CHOOSE, utf16(kChooseFolder).c_str());
  AppendMenuW(menu, MF_STRING, ID_GENERAL, utf16(kSettingsGeneral).c_str());
  AppendMenuW(menu, MF_SEPARATOR, 0, nullptr);
  AppendMenuW(menu, MF_STRING | MF_GRAYED | MF_DISABLED, ID_WAKE, utf16(kWakeVoice).c_str());
  AppendMenuW(menu, MF_STRING | MF_GRAYED | MF_DISABLED, ID_MUTE, utf16(kMute).c_str());
  AppendMenuW(menu, MF_STRING | MF_GRAYED | MF_DISABLED, ID_VOICE_LABEL, utf16(kVoiceUnavailable).c_str());
  AppendMenuW(menu, MF_SEPARATOR, 0, nullptr);
  AppendMenuW(menu, MF_STRING, ID_QUIT, utf16(kQuitWisp).c_str());
  SetForegroundWindow(host);
  TrackPopupMenu(menu, TPM_RIGHTBUTTON | TPM_BOTTOMALIGN, pt.x, pt.y, 0, host, nullptr);
  DestroyMenu(menu);
}

bool WinShell::registerChord() {
  unregisterChord();
  hotkeyRegistered = RegisterHotKey(host, 1, MOD_CONTROL | MOD_ALT, static_cast<UINT>(kWispVkW)) != 0;
  hotkeyText = utf16(hotkeyRegistered ? kHotkeyRegistered : kHotkeyConflict);
  return hotkeyRegistered;
}

void WinShell::unregisterChord() {
  if (hotkeyRegistered && host) UnregisterHotKey(host, 1);
  hotkeyRegistered = false;
}

bool WinShell::pickFolder(std::wstring& path, bool& cancelled) {
  cancelled = false;
  path.clear();
  IFileOpenDialog* dialog = nullptr;
  HRESULT hr = CoCreateInstance(CLSID_FileOpenDialog, nullptr, CLSCTX_INPROC_SERVER, IID_IFileOpenDialog,
                                reinterpret_cast<void**>(&dialog));
  if (FAILED(hr) || !dialog) return false;
  FILEOPENDIALOGOPTIONS opts = 0;
  dialog->GetOptions(&opts);
  dialog->SetOptions(opts | FOS_PICKFOLDERS | FOS_FORCEFILESYSTEM);
  dialog->SetTitle(L"Choose Wisp Folder");
  hr = dialog->Show(general ? general : host);
  if (hr == HRESULT_FROM_WIN32(ERROR_CANCELLED)) {
    cancelled = true;
    dialog->Release();
    return true;
  }
  if (FAILED(hr)) {
    dialog->Release();
    return false;
  }
  IShellItem* item = nullptr;
  hr = dialog->GetResult(&item);
  dialog->Release();
  if (FAILED(hr) || !item) return false;
  PWSTR filePath = nullptr;
  hr = item->GetDisplayName(SIGDN_FILESYSPATH, &filePath);
  item->Release();
  if (FAILED(hr) || !filePath) return false;
  path = filePath;
  CoTaskMemFree(filePath);
  return true;
}

void WinShell::refreshGeneral() {
  if (!general) return;
  std::wstring copy = L"Wisp remains one companion. This Windows body is not a second agent.\r\n\r\n";
  copy += utf16(kEngineNotAttached);
  copy += L"\r\n";
  copy += utf16(kVoiceUnavailable);
  copy += L". Wake Voice and Mute do not capture audio.\r\n";
  copy += L"Windows computer control is unavailable in this slice.\r\n";
  copy += L"Shortcut: ";
  copy += hotkeyText;
  copy += L"\r\n";
  if (!companionText.empty()) {
    copy += L"Companion ID: ";
    copy += companionText;
    copy += L"\r\n";
  }
  if (!folderText.empty()) {
    copy += L"Folder: ";
    copy += folderText;
    copy += L"\r\n";
  }
  copy += L"Closing this window leaves the body and tray running.";
  SetWindowTextW(GetDlgItem(general, 20), copy.c_str());
}

void WinShell::openGeneral() {
  if (general) {
    ShowWindow(general, SW_SHOWNOACTIVATE);
    return;
  }
  WNDCLASSW wc{};
  wc.lpfnWndProc = generalWndProc;
  wc.hInstance = instance;
  wc.hCursor = LoadCursor(nullptr, IDC_ARROW);
  wc.hbrBackground = reinterpret_cast<HBRUSH>(COLOR_WINDOW + 1);
  wc.lpszClassName = L"WispGeneralWindow";
  RegisterClassW(&wc);
  general = CreateWindowExW(WS_EX_TOOLWINDOW, L"WispGeneralWindow", L"Wisp Settings",
                             WS_OVERLAPPED | WS_CAPTION | WS_SYSMENU,
                             CW_USEDEFAULT, CW_USEDEFAULT, 520, 420, nullptr, nullptr, instance, this);
  CreateWindowW(L"STATIC", L"", WS_CHILD | WS_VISIBLE, 16, 16, 470, 250, general, reinterpret_cast<HMENU>(20), instance, nullptr);
  CreateWindowW(L"BUTTON", utf16(kShowCompanion).c_str(), WS_CHILD | WS_VISIBLE | BS_PUSHBUTTON, 16, 280, 160, 28,
                general, reinterpret_cast<HMENU>(ID_SHOW), instance, nullptr);
  CreateWindowW(L"BUTTON", utf16(kChooseFolder).c_str(), WS_CHILD | WS_VISIBLE | BS_PUSHBUTTON, 188, 280, 200, 28,
                general, reinterpret_cast<HMENU>(ID_CHOOSE), instance, nullptr);
  refreshGeneral();
  ShowWindow(general, SW_SHOWNOACTIVATE);
}

void WinShell::closeGeneral() {
  if (general) ShowWindow(general, SW_HIDE);
}

LRESULT CALLBACK generalWndProc(HWND hwnd, UINT msg, WPARAM wParam, LPARAM lParam) {
  if (msg == WM_NCCREATE) {
    auto* cs = reinterpret_cast<CREATESTRUCTW*>(lParam);
    SetWindowLongPtrW(hwnd, GWLP_USERDATA, reinterpret_cast<LONG_PTR>(cs->lpCreateParams));
  }
  auto* shell = reinterpret_cast<WinShell*>(GetWindowLongPtrW(hwnd, GWLP_USERDATA));
  switch (msg) {
    case WM_CLOSE:
      ShowWindow(hwnd, SW_HIDE);
      return 0;
    case WM_COMMAND:
      if (gShell && gShell->host) PostMessageW(gShell->host, WM_COMMAND, wParam, 0);
      return 0;
    case WM_DESTROY:
      if (shell) shell->general = nullptr;
      return 0;
    default:
      return DefWindowProcW(hwnd, msg, wParam, lParam);
  }
}

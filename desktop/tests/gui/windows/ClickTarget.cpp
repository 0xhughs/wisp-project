#define UNICODE
#define _UNICODE
#define NOMINMAX
#define WIN32_LEAN_AND_MEAN
#include <windows.h>
#include <windowsx.h>
#include <stdio.h>
#include <string>

// Test-only independent click canary. Never shipped inside Wisp.
static int clicks = 0;
static HWND label;

static void report(const char* kind, int x, int y) {
  char line[160];
  sprintf_s(line, "{\"event\":\"%s\",\"x\":%d,\"y\":%d,\"count\":%d}\n", kind, x, y, clicks);
  DWORD n = 0;
  WriteFile(GetStdHandle(STD_OUTPUT_HANDLE), line, (DWORD)lstrlenA(line), &n, nullptr);
}

static LRESULT CALLBACK proc(HWND hwnd, UINT msg, WPARAM wParam, LPARAM lParam) {
  switch (msg) {
    case WM_LBUTTONDOWN: {
      clicks += 1;
      POINT pt{GET_X_LPARAM(lParam), GET_Y_LPARAM(lParam)};
      ClientToScreen(hwnd, &pt);
      report("click", pt.x, pt.y);
      wchar_t text[64];
      swprintf(text, 64, L"clicks %d", clicks);
      SetWindowTextW(label, text);
      return 0;
    }
    case WM_MOUSEWHEEL:
      report("scroll", GET_X_LPARAM(lParam), GET_Y_LPARAM(lParam));
      return 0;
    case WM_DESTROY:
      PostQuitMessage(0);
      return 0;
    default:
      return DefWindowProcW(hwnd, msg, wParam, lParam);
  }
}

int WINAPI wWinMain(HINSTANCE inst, HINSTANCE, PWSTR, int) {
  WNDCLASSW wc{};
  wc.lpfnWndProc = proc;
  wc.hInstance = inst;
  wc.lpszClassName = L"WispClickTarget";
  wc.hbrBackground = reinterpret_cast<HBRUSH>(COLOR_WINDOW + 1);
  RegisterClassW(&wc);
  HWND hwnd = CreateWindowW(L"WispClickTarget", L"Wisp Click Target", WS_OVERLAPPEDWINDOW | WS_VISIBLE,
                              200, 200, 900, 700, nullptr, nullptr, inst, nullptr);
  label = CreateWindowW(L"STATIC", L"clicks 0", WS_CHILD | WS_VISIBLE, 20, 20, 200, 24, hwnd, nullptr, inst, nullptr);
  MSG msg;
  while (GetMessageW(&msg, nullptr, 0, 0) > 0) {
    TranslateMessage(&msg);
    DispatchMessageW(&msg);
  }
  return 0;
}

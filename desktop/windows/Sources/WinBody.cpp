#include "WinBody.h"

#include <windowsx.h>

#include <algorithm>
#include <cmath>
#include <cstring>
#include <sstream>

#ifndef WS_EX_NOACTIVATE
#define WS_EX_NOACTIVATE 0x08000000L
#endif

static WinBody* bodyFrom(HWND hwnd) {
  return reinterpret_cast<WinBody*>(GetWindowLongPtrW(hwnd, GWLP_USERDATA));
}

static std::vector<DipRect> workAreas() {
  std::vector<DipRect> screens;
  EnumDisplayMonitors(nullptr, nullptr, [](HMONITOR monitor, HDC, LPRECT, LPARAM data) -> BOOL {
    auto* out = reinterpret_cast<std::vector<DipRect>*>(data);
    MONITORINFO info{};
    info.cbSize = sizeof(info);
    if (GetMonitorInfoW(monitor, &info)) {
      const RECT& r = info.rcWork;
      out->push_back({static_cast<double>(r.left), static_cast<double>(r.top),
                      static_cast<double>(r.right - r.left), static_cast<double>(r.bottom - r.top)});
    }
    return TRUE;
  }, reinterpret_cast<LPARAM>(&screens));
  return screens;
}

static void releaseDib(WinBody* body) {
  if (body->dib) {
    DeleteObject(body->dib);
    body->dib = nullptr;
    body->bits = nullptr;
  }
}

bool WinBody::create(HINSTANCE inst, HWND messageHost) {
  instance = inst;
  host = messageHost;
  WNDCLASSW wc{};
  wc.lpfnWndProc = bodyWndProc;
  wc.hInstance = inst;
  wc.hCursor = LoadCursor(nullptr, IDC_ARROW);
  wc.lpszClassName = L"WispBodyWindow";
  RegisterClassW(&wc);
  dpi = 96;
  physical = kBodyDip;
  const DWORD ex = WS_EX_LAYERED | WS_EX_NOACTIVATE | WS_EX_TOOLWINDOW | WS_EX_TOPMOST;
  hwnd = CreateWindowExW(ex, L"WispBodyWindow", L"Wisp", WS_POPUP, screenX, screenY, physical, physical,
                          nullptr, nullptr, inst, this);
  if (!hwnd) return false;
  created = true;
  dpi = GetDpiForWindow(hwnd);
  if (!dpi) dpi = 96;
  physical = static_cast<int>(kBodyDip * dpi / 96);
  if (physical < 1) physical = 1;
  SetWindowPos(hwnd, HWND_TOPMOST, 0, 0, 0, 0, SWP_NOMOVE | SWP_NOSIZE | SWP_NOACTIVATE);
  queryMotion();
  render();
  present();
  showNoActivate();
  resume();
  return true;
}

void WinBody::destroy() {
  pause();
  if (hwnd) {
    DestroyWindow(hwnd);
    hwnd = nullptr;
  }
  releaseDib(this);
  created = false;
}

void WinBody::pause() {
  if (timer && hwnd) {
    KillTimer(hwnd, timer);
  }
  timer = 0;
  animationRunning = false;
}

void WinBody::hide() {
  pause();
  visible = false;
  if (hwnd) ShowWindow(hwnd, SW_HIDE);
}

void WinBody::queryMotion() {
  BOOL clientAnim = TRUE;
  SystemParametersInfoW(SPI_GETCLIENTAREAANIMATION, 0, &clientAnim, 0);
  ANIMATIONINFO info{};
  info.cbSize = sizeof(info);
  SystemParametersInfoW(SPI_GETANIMATION, sizeof(info), &info, 0);
  reduceMotion = clientAnim == FALSE || info.iMinAnimate == 0;
}

void WinBody::resume() {
  pause();
  queryMotion();
  if (!hwnd || !visible) return;
  render();
  present();
  if (!animationAllowed(visible, reduceMotion)) return;
  animationRunning = true;
  timer = SetTimer(hwnd, 1, 33, nullptr);
}

void WinBody::showNoActivate() {
  visible = true;
  if (hwnd) {
    ShowWindow(hwnd, SW_SHOWNOACTIVATE);
    SetWindowPos(hwnd, HWND_TOPMOST, 0, 0, 0, 0, SWP_NOMOVE | SWP_NOSIZE | SWP_NOACTIVATE | SWP_SHOWWINDOW);
  }
  clampToWorkAreas();
  resume();
}

void WinBody::clampToWorkAreas() {
  if (!hwnd) return;
  RECT wr{};
  GetWindowRect(hwnd, &wr);
  DipRect body{static_cast<double>(wr.left), static_cast<double>(wr.top),
               static_cast<double>(wr.right - wr.left), static_cast<double>(wr.bottom - wr.top)};
  const DipRect clamped = clampBody(body, workAreas());
  screenX = static_cast<int>(clamped.x);
  screenY = static_cast<int>(clamped.y);
  SetWindowPos(hwnd, HWND_TOPMOST, screenX, screenY, physical, physical,
               SWP_NOACTIVATE | SWP_NOZORDER);
}

void WinBody::onDpi(UINT newDpi) {
  if (!newDpi) return;
  dpi = newDpi;
  physical = std::max(1, static_cast<int>(std::lround(kBodyDip * (dpi / 96.0))));
  releaseDib(this);
  render();
  present();
  clampToWorkAreas();
}

void WinBody::render() {
  fillOrbBgra(bgra, physical, state.phase, reduceMotion ? 0.0 : tick, reduceMotion);
  if (!hwnd) return;
  BITMAPINFO info{};
  info.bmiHeader.biSize = sizeof(BITMAPINFOHEADER);
  info.bmiHeader.biWidth = physical;
  info.bmiHeader.biHeight = -physical;
  info.bmiHeader.biPlanes = 1;
  info.bmiHeader.biBitCount = 32;
  info.bmiHeader.biCompression = BI_RGB;
  HDC screen = GetDC(nullptr);
  releaseDib(this);
  dib = CreateDIBSection(screen, &info, DIB_RGB_COLORS, &bits, nullptr, 0);
  if (bits && bgra.size() == static_cast<size_t>(physical * physical * 4)) {
    memcpy(bits, bgra.data(), bgra.size());
  }
  ReleaseDC(nullptr, screen);
}

void WinBody::present() {
  if (!hwnd || !dib) return;
  HDC screen = GetDC(nullptr);
  HDC mem = CreateCompatibleDC(screen);
  HGDIOBJ old = SelectObject(mem, dib);
  POINT dst{screenX, screenY};
  SIZE size{physical, physical};
  POINT src{0, 0};
  BLENDFUNCTION blend{};
  blend.BlendOp = AC_SRC_OVER;
  blend.SourceConstantAlpha = 255;
  blend.AlphaFormat = AC_SRC_ALPHA;
  UpdateLayeredWindow(hwnd, screen, &dst, &size, mem, &src, 0, &blend, ULW_ALPHA);
  SelectObject(mem, old);
  DeleteDC(mem);
  ReleaseDC(nullptr, screen);
}

BYTE WinBody::alphaAtClient(int x, int y) const {
  if (physical <= 0 || x < 0 || y < 0 || x >= physical || y >= physical) return 0;
  const int dx = std::min(kBodyDip - 1, x * kBodyDip / physical);
  const int dy = std::min(kBodyDip - 1, y * kBodyDip / physical);
  if (bgra.size() == static_cast<size_t>(physical * physical * 4)) {
    return bgra[(static_cast<size_t>(y) * physical + x) * 4 + 3];
  }
  return static_cast<BYTE>(orbAlpha(dx, dy));
}

std::wstring WinBody::statusJson(const std::string& extra) const {
  std::wostringstream o;
  o << L"{\"event\":\"status\",\"phase\":\"";
  switch (state.phase) {
    case BodyPhase::idle: o << L"idle"; break;
    case BodyPhase::listening: o << L"listening"; break;
    case BodyPhase::speaking: o << L"speaking"; break;
    case BodyPhase::unavailable: o << L"unavailable"; break;
    case BodyPhase::stopped: o << L"stopped"; break;
    default: o << L"starting"; break;
  }
  o << L"\",\"visible\":" << (visible ? L"true" : L"false")
    << L",\"animationRunning\":" << (animationRunning ? L"true" : L"false")
    << L",\"reduceMotion\":" << (reduceMotion ? L"true" : L"false")
    << L",\"catalogId\":\"wisp-orb\"";
  if (!extra.empty()) {
    o << L"," << extra.c_str();
  }
  o << L"}";
  return o.str();
}

LRESULT CALLBACK bodyWndProc(HWND hwnd, UINT msg, WPARAM wParam, LPARAM lParam) {
  if (msg == WM_NCCREATE) {
    auto* cs = reinterpret_cast<CREATESTRUCTW*>(lParam);
    SetWindowLongPtrW(hwnd, GWLP_USERDATA, reinterpret_cast<LONG_PTR>(cs->lpCreateParams));
  }
  WinBody* body = bodyFrom(hwnd);
  switch (msg) {
    case WM_NCHITTEST: {
      if (!body) return HTTRANSPARENT;
      POINT pt{GET_X_LPARAM(lParam), GET_Y_LPARAM(lParam)};
      ScreenToClient(hwnd, &pt);
      if (body->alphaAtClient(pt.x, pt.y) == 0) return HTTRANSPARENT;
      return HTCAPTION;
    }
    case WM_TIMER:
      if (body && body->visible && animationAllowed(body->visible, body->reduceMotion)) {
        body->tick += 1.0 / 30.0;
        body->render();
        body->present();
      } else if (body) {
        body->pause();
      }
      return 0;
    case WM_DISPLAYCHANGE:
    case WM_MOVE:
    case WM_EXITSIZEMOVE:
      if (body) {
        RECT wr{};
        GetWindowRect(hwnd, &wr);
        body->screenX = wr.left;
        body->screenY = wr.top;
        body->clampToWorkAreas();
        body->present();
      }
      return 0;
    case WM_DPICHANGED:
      if (body) body->onDpi(HIWORD(wParam));
      return 0;
    case WM_SETTINGCHANGE:
      if (body) body->resume();
      return 0;
    case WM_DESTROY:
      if (body) {
        body->pause();
        body->hwnd = nullptr;
      }
      return 0;
    default:
      return DefWindowProcW(hwnd, msg, wParam, lParam);
  }
}

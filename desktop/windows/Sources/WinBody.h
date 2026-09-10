#pragma once

#define UNICODE
#define _UNICODE
#define NOMINMAX
#define WIN32_LEAN_AND_MEAN
#include <windows.h>

#include "BodyState.h"
#include "Geometry.h"
#include "OrbRaster.h"

#include <string>
#include <vector>

struct WinBody {
  HWND hwnd = nullptr;
  HWND host = nullptr;
  HINSTANCE instance = nullptr;
  BodyState state;
  bool visible = true;
  bool reduceMotion = false;
  bool animationRunning = false;
  bool created = false;
  double tick = 0;
  UINT dpi = 96;
  int physical = 160;
  int screenX = 500;
  int screenY = 200;
  std::vector<std::uint8_t> bgra;
  HBITMAP dib = nullptr;
  void* bits = nullptr;
  UINT_PTR timer = 0;

  bool create(HINSTANCE inst, HWND messageHost);
  void destroy();
  void hide();
  void showNoActivate();
  void pause();
  void resume();
  void queryMotion();
  void render();
  void present();
  void clampToWorkAreas();
  void onDpi(UINT newDpi);
  BYTE alphaAtClient(int x, int y) const;
  std::wstring statusJson(const std::string& extra) const;
};

LRESULT CALLBACK bodyWndProc(HWND hwnd, UINT msg, WPARAM wParam, LPARAM lParam);

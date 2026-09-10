#include "OrbRaster.h"

#include <algorithm>
#include <cmath>

static bool insideEllipse(int x, int y, double cx, double cy, double rx, double ry) {
  const double dx = (x + 0.5 - cx) / rx;
  const double dy = (y + 0.5 - cy) / ry;
  return dx * dx + dy * dy <= 1.0;
}

int orbAlpha(int x, int y) {
  if (x < 0 || y < 0 || x >= kBodyDip || y >= kBodyDip) return 0;
  const bool outer = insideEllipse(x, y, 80, 80, 56, 56);
  const bool inner = insideEllipse(x, y, 80, 98, 20, 18);
  return (outer && !inner) ? 255 : 0;
}

static void premul(std::uint8_t* p, int r, int g, int b, int a) {
  p[0] = static_cast<std::uint8_t>(b * a / 255);
  p[1] = static_cast<std::uint8_t>(g * a / 255);
  p[2] = static_cast<std::uint8_t>(r * a / 255);
  p[3] = static_cast<std::uint8_t>(a);
}

static void fillColor(BodyPhase phase, int& r, int& g, int& b) {
  switch (phase) {
    case BodyPhase::listening:
      r = 235; g = 156; b = 56; return;
    case BodyPhase::speaking:
      r = 41; g = 156; b = 201; return;
    case BodyPhase::processing:
      r = 128; g = 64; b = 192; return;
    case BodyPhase::approval:
      r = 220; g = 140; b = 40; return;
    case BodyPhase::muted:
    case BodyPhase::unavailable:
    case BodyPhase::stopped:
    case BodyPhase::starting:
      r = 135; g = 135; b = 135; return;
    default:
      r = 51; g = 184; b = 163; return;
  }
}

static void stampEllipse(std::vector<std::uint8_t>& bgra, int physical, double x, double y, double w, double h, int r, int g, int b, int a) {
  if (physical <= 0) return;
  const double scale = static_cast<double>(physical) / kBodyDip;
  const int x0 = std::max(0, static_cast<int>(std::floor(x * scale)));
  const int y0 = std::max(0, static_cast<int>(std::floor(y * scale)));
  const int x1 = std::min(physical, static_cast<int>(std::ceil((x + w) * scale)));
  const int y1 = std::min(physical, static_cast<int>(std::ceil((y + h) * scale)));
  const double cx = x + w / 2.0;
  const double cy = y + h / 2.0;
  const double rx = w / 2.0;
  const double ry = h / 2.0;
  for (int py = y0; py < y1; ++py) {
    for (int px = x0; px < x1; ++px) {
      const double dx = (px + 0.5) / scale;
      const double dy = (py + 0.5) / scale;
      const double nx = (dx - cx) / rx;
      const double ny = (dy - cy) / ry;
      if (nx * nx + ny * ny <= 1.0) premul(&bgra[(py * physical + px) * 4], r, g, b, a);
    }
  }
}

void fillOrbBgra(std::vector<std::uint8_t>& bgra, int physical, BodyPhase phase, double tick, bool reduceMotion) {
  if (physical <= 0) {
    bgra.clear();
    return;
  }
  bgra.assign(static_cast<size_t>(physical * physical * 4), 0);
  int r = 51, g = 184, b = 163;
  fillColor(phase, r, g, b);
  for (int py = 0; py < physical; ++py) {
    for (int px = 0; px < physical; ++px) {
      const int dx = std::min(kBodyDip - 1, px * kBodyDip / physical);
      const int dy = std::min(kBodyDip - 1, py * kBodyDip / physical);
      const int a = orbAlpha(dx, dy);
      if (a) premul(&bgra[(py * physical + px) * 4], r, g, b, a);
    }
  }
  const double motion = reduceMotion ? 0.0 : std::sin(tick * 2.0) * 2.0;
  const double eyeH = phase == BodyPhase::listening ? 18.0 : 12.0;
  const double eyeY = 160.0 - (98.0 + motion) - eyeH;
  stampEllipse(bgra, physical, 58, eyeY, 8, eyeH, 23, 23, 23, 255);
  stampEllipse(bgra, physical, 94, eyeY, 8, eyeH, 23, 23, 23, 255);
  if (phase == BodyPhase::speaking) {
    const double mouthH = reduceMotion ? 9.0 : 8.0 + std::abs(std::sin(tick * 8.0)) * 8.0;
    const double mouthY = 160.0 - 84.0 - mouthH;
    stampEllipse(bgra, physical, 74, mouthY, 12, mouthH, 23, 23, 23, 255);
  }
}

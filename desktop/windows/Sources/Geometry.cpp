#include "Geometry.h"

#include <algorithm>

DipRect clampBody(DipRect body, const std::vector<DipRect>& screens) {
  if (screens.empty()) return body;
  auto distance = [](DipRect a, DipRect b) {
    const double midX = a.x + a.w / 2.0;
    const double midY = a.y + a.h / 2.0;
    const double x = std::max({b.x - midX, 0.0, midX - (b.x + b.w)});
    const double y = std::max({b.y - midY, 0.0, midY - (b.y + b.h)});
    return x * x + y * y;
  };
  DipRect screen = screens.front();
  double best = distance(body, screen);
  for (const DipRect& candidate : screens) {
    const double d = distance(body, candidate);
    if (d < best) {
      best = d;
      screen = candidate;
    }
  }
  body.x = std::max(screen.x, std::min(body.x, screen.x + screen.w - body.w));
  body.y = std::max(screen.y, std::min(body.y, screen.y + screen.h - body.h));
  return body;
}

#pragma once

#include <vector>

struct DipRect {
  double x = 0;
  double y = 0;
  double w = 0;
  double h = 0;
};

DipRect clampBody(DipRect body, const std::vector<DipRect>& screens);

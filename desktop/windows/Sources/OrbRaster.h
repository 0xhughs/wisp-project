#pragma once

#include "BodyState.h"

#include <cstdint>
#include <vector>

inline constexpr int kBodyDip = 160;

struct OrbSample {
  int x;
  int y;
};

struct OrbSamples {
  OrbSample corner{0, 0};
  OrbSample gap{80, 98};
  OrbSample uniqueOpaque{40, 80};
};

inline constexpr OrbSamples kWispOrbSamples{};

int orbAlpha(int x, int y);
void fillOrbBgra(std::vector<std::uint8_t>& bgra, int physical, BodyPhase phase, double tick, bool reduceMotion);

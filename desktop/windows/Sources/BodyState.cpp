#include "BodyState.h"

void BodyState::ready() {
  if (phase == BodyPhase::starting) {
    phase = BodyPhase::idle;
    generation += 1;
  }
}

bool BodyState::present(BodyPhase next, int token) {
  if (token != generation) return false;
  if ((phase == BodyPhase::idle && next == BodyPhase::listening) ||
      (phase == BodyPhase::listening && next == BodyPhase::speaking)) {
    phase = next;
    return true;
  }
  return false;
}

void BodyState::interrupt() {
  generation += 1;
  if (phase == BodyPhase::listening || phase == BodyPhase::speaking) phase = BodyPhase::idle;
}

void BodyState::unavailable() {
  generation += 1;
  if (phase != BodyPhase::stopped) phase = BodyPhase::unavailable;
}

void BodyState::stop() {
  generation += 1;
  phase = BodyPhase::stopped;
}

bool animationAllowed(bool visible, bool reduceMotion) {
  return visible && !reduceMotion;
}

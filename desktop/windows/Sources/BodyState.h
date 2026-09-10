#pragma once

enum class BodyPhase {
  starting,
  idle,
  listening,
  speaking,
  processing,
  approval,
  muted,
  unavailable,
  stopped
};

struct BodyState {
  BodyPhase phase = BodyPhase::starting;
  int generation = 0;
  void ready();
  bool present(BodyPhase next, int token);
  void interrupt();
  void unavailable();
  void stop();
};

bool animationAllowed(bool visible, bool reduceMotion);

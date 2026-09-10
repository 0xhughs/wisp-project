#include "BodyState.h"
#include "Geometry.h"
#include "HomeIdentity.h"
#include "OrbRaster.h"
#include "ProductCopy.h"

#include <cstdio>
#include <fstream>
#include <sstream>
#include <stdexcept>
#include <string>

static int failures = 0;

static void check(bool ok, const char* name) {
  if (!ok) {
    std::fprintf(stderr, "FAIL %s\n", name);
    failures += 1;
  }
}

int main(int argc, char** argv) {
  BodyState state;
  check(state.phase == BodyPhase::starting, "starting");
  state.ready();
  const int token = state.generation;
  check(state.present(BodyPhase::listening, token), "listen");
  check(state.present(BodyPhase::speaking, token), "speak");
  state.interrupt();
  check(state.phase == BodyPhase::idle, "interrupt idle");
  check(!state.present(BodyPhase::speaking, token), "stale speaking");
  check(!animationAllowed(true, true), "reduce motion");
  check(!animationAllowed(false, false), "hidden");
  check(animationAllowed(true, false), "idle animate");

  const DipRect negative{-1600, 100, 1600, 900};
  const DipRect body{-1200, 300, 160, 160};
  const DipRect clamped = clampBody(body, {negative});
  check(clamped.x == body.x && clamped.y == body.y, "negative virtual screen");

  check(orbAlpha(0, 0) == 0, "corner");
  check(orbAlpha(80, 98) == 0, "gap");
  check(orbAlpha(40, 80) == 255, "unique opaque");
  check(kWispOrbSamples.gap.x == 80 && kWispOrbSamples.gap.y == 98, "sample coords");

  const std::string id = "a688c6a5-c493-42ef-8714-33fc4da2c7a9";
  const std::string other = "bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb";
  const std::string home = "C:\\Users\\fixture\\WispHome";
  const std::string support = "C:\\Users\\fixture\\AppData\\Local\\Wisp";
  const HomeMarker marker = parseMarkerJson("{\"version\":1,\"companionId\":\"" + id + "\"}");
  check(marker.companionId == id, "marker");
  bool threw = false;
  try {
    parseMarkerJson("{\"version\":1,\"companionId\":\"" + id + "\",\"bookmark\":\"AAAA\"}");
  } catch (...) {
    threw = true;
  }
  check(threw, "marker bookmark rejected");
  const HomePointer pointer = parsePointerJson(encodePointerJson(id, home));
  check(pointer.path == home && pointer.companionId == id, "pointer");
  threw = false;
  try {
    parsePointerJson("{\"version\":1,\"companionId\":\"" + id + "\",\"path\":\"relative\\\\home\"}");
  } catch (...) {
    threw = true;
  }
  check(threw, "relative pointer");
  const std::string markerJson = encodeMarkerJson(id);
  check(reuseOrMintCompanionId(&markerJson, &other) == id, "existing marker wins");
  check(reuseOrMintCompanionId(nullptr, &other) == other, "mint injected");
  const FolderPlan cancelled = planFolderChoice(true, nullptr, &other, home, support, "");
  check(cancelled.action == "noop", "cancel");
  const FolderPlan reuse = planFolderChoice(false, &markerJson, &other, home, support, "");
  check(reuse.action == "reuse" && reuse.companionId == id && !reuse.writeMarker, "reuse marker");

  check(std::string(kWispShortcutLabel) == "Ctrl+Alt+W", "shortcut label");
  check(kWispModControl == 0x0002u && kWispModAlt == 0x0001u && kWispVkW == 0x57u, "hotkey constants");
  check(std::string(kWispRejectedChord) == "Alt+Space", "rejected chord name");
  check(std::string(kTrayName) == "Wisp", "tray name");
  check(std::string(kHotkeyConflict).find("Show Companion") != std::string::npos, "conflict copy");

  if (argc >= 2) {
    std::ifstream in(argv[1]);
    std::ostringstream oss;
    oss << in.rdbuf();
    const std::string manifest = oss.str();
    check(manifest.find("dpiAware") != std::string::npos, "dpiAware");
    check(manifest.find("uiAccess=\"false\"") != std::string::npos, "uiAccess false");
    check(manifest.find("uiAccess=\"true\"") == std::string::npos, "no uiAccess true");
  }

  if (failures) {
    std::fprintf(stderr, "NativeChecks failures: %d (portable objects; not a Win32 GUI pass)\n", failures);
    return 1;
  }
  std::puts("Native assertions passed: pointer/marker, BodyPhase, geometry, orb samples, hotkey constants, no uiAccess in manifest; uncompiled Win32 GUI on Linux");
  return 0;
}

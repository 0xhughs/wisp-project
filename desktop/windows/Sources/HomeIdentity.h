#pragma once

#include <string>
#include <vector>

struct HomeMarker {
  int version = 1;
  std::string companionId;
};

struct HomePointer {
  int version = 1;
  std::string companionId;
  std::string path;
};

struct FolderPlan {
  std::string action;
  std::string companionId;
  bool writeMarker = false;
  HomePointer pointer;
};

extern const char kHomeReadme[];

std::string companionUuid(const std::string& value);
HomeMarker parseMarkerJson(const std::string& json);
HomePointer parsePointerJson(const std::string& json);
std::string encodeMarkerJson(const std::string& companionId);
std::string encodePointerJson(const std::string& companionId, const std::string& path);
std::string validateWindowsPath(const std::string& path);
bool pathsOverlap(const std::string& a, const std::string& b);
bool isDirectChild(const std::string& parent, const std::string& child);
void assertPointerSeparation(const std::string& homePath, const std::string& supportPath, const std::string& scratchPath);
void validateTestSupport(const std::string& scratch, const std::string& testSupport, bool markedOwned);
std::string reuseOrMintCompanionId(const std::string* markerJson, const std::string* injectedId);
FolderPlan planFolderChoice(bool cancelled, const std::string* existingMarkerJson, const std::string* injectedId,
                             const std::string& selectedPath, const std::string& supportPath, const std::string& scratchPath);
void bindPointerToMarker(const HomePointer& pointer, const HomeMarker& marker);

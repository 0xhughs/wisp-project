#include "HomeIdentity.h"

#include <algorithm>
#include <cctype>
#include <stdexcept>
#include <utility>

const char kHomeReadme[] =
    "Wisp home format 1\n"
    "Edit memory.json: version 1, entries with UUID id, category preference/project/instruction/fact, and plain text. "
    "Maximum 64 entries, 2000 Unicode scalars per text, 32 KiB document. Keep file mode 600. Never place credentials in memory. "
    "Save and reload in Wisp; edits apply on next app launch. Files in files/ are yours and are not scanned. Do not edit wisp-home.json. "
    "Internal sessions are separate.\n";

static bool isHex(char c) {
  return std::isxdigit(static_cast<unsigned char>(c)) != 0;
}

static bool isUuid(const std::string& value) {
  if (value.size() != 36) return false;
  for (size_t i = 0; i < value.size(); ++i) {
    if (i == 8 || i == 13 || i == 18 || i == 23) {
      if (value[i] != '-') return false;
    } else if (!isHex(value[i])) {
      return false;
    }
  }
  return true;
}

static std::string lowerCopy(std::string value) {
  for (char& c : value) c = static_cast<char>(std::tolower(static_cast<unsigned char>(c)));
  return value;
}

std::string companionUuid(const std::string& value) {
  if (!isUuid(value)) throw std::runtime_error("WISP_HOME_INVALID");
  return lowerCopy(value);
}

static void skipWs(const std::string& json, size_t& i) {
  while (i < json.size() && (json[i] == ' ' || json[i] == '\n' || json[i] == '\r' || json[i] == '\t')) ++i;
}

static std::string parseJsonString(const std::string& json, size_t& i, const char* error) {
  skipWs(json, i);
  if (i >= json.size() || json[i] != '"') throw std::runtime_error(error);
  ++i;
  std::string out;
  while (i < json.size()) {
    const char c = json[i++];
    if (c == '"') return out;
    if (c == '\\') {
      if (i >= json.size()) throw std::runtime_error(error);
      const char e = json[i++];
      if (e == '\\' || e == '"') out.push_back(e);
      else throw std::runtime_error(error);
      continue;
    }
    if (static_cast<unsigned char>(c) < 0x20) throw std::runtime_error(error);
    out.push_back(c);
  }
  throw std::runtime_error(error);
}

static int parseJsonInt(const std::string& json, size_t& i, const char* error) {
  skipWs(json, i);
  if (i < json.size() && (json[i] == 't' || json[i] == 'f' || json[i] == '"')) throw std::runtime_error(error);
  if (i >= json.size() || json[i] < '0' || json[i] > '9') throw std::runtime_error(error);
  int value = 0;
  while (i < json.size() && json[i] >= '0' && json[i] <= '9') {
    value = value * 10 + (json[i] - '0');
    ++i;
  }
  return value;
}

static std::vector<std::pair<std::string, std::string>> parseObject(const std::string& json, const char* error, bool& versionIsInt, int& version) {
  size_t i = 0;
  skipWs(json, i);
  if (i >= json.size() || json[i] != '{') throw std::runtime_error(error);
  ++i;
  std::vector<std::pair<std::string, std::string>> fields;
  versionIsInt = false;
  version = 0;
  skipWs(json, i);
  if (i < json.size() && json[i] == '}') throw std::runtime_error(error);
  while (i < json.size()) {
    const std::string key = parseJsonString(json, i, error);
    skipWs(json, i);
    if (i >= json.size() || json[i] != ':') throw std::runtime_error(error);
    ++i;
    skipWs(json, i);
    if (i < json.size() && json[i] == '"') {
      fields.emplace_back(key, parseJsonString(json, i, error));
    } else if (key == "version") {
      version = parseJsonInt(json, i, error);
      versionIsInt = true;
      fields.emplace_back(key, std::to_string(version));
    } else {
      throw std::runtime_error(error);
    }
    skipWs(json, i);
    if (i < json.size() && json[i] == ',') {
      ++i;
      continue;
    }
    if (i < json.size() && json[i] == '}') {
      ++i;
      skipWs(json, i);
      if (i != json.size()) throw std::runtime_error(error);
      return fields;
    }
    throw std::runtime_error(error);
  }
  throw std::runtime_error(error);
}

static bool hasKey(const std::vector<std::pair<std::string, std::string>>& fields, const std::string& name) {
  return std::any_of(fields.begin(), fields.end(), [&](const auto& f) { return f.first == name; });
}

static std::string requireKey(const std::vector<std::pair<std::string, std::string>>& fields, const std::string& name, const char* error) {
  for (const auto& field : fields) {
    if (field.first == name) return field.second;
  }
  throw std::runtime_error(error);
}

std::string validateWindowsPath(const std::string& path) {
  if (path.size() < 4 || path.size() > 32767) throw std::runtime_error("WISP_POINTER_INVALID");
  if (path.find("..") != std::string::npos || path.find('\0') != std::string::npos || path.find('/') != std::string::npos) {
    throw std::runtime_error("WISP_POINTER_INVALID");
  }
  std::string part;
  std::vector<std::string> parts;
  for (size_t i = 0; i <= path.size(); ++i) {
    if (i == path.size() || path[i] == '\\') {
      parts.push_back(part);
      part.clear();
    } else {
      part.push_back(path[i]);
    }
  }
  for (const std::string& item : parts) {
    if (item == "." || item == "..") throw std::runtime_error("WISP_POINTER_INVALID");
  }
  if (path.rfind("\\\\", 0) == 0) {
    if (path.rfind("\\\\?\\", 0) == 0 || path.rfind("\\\\.\\", 0) == 0) throw std::runtime_error("WISP_POINTER_INVALID");
    if (path.find(':') != std::string::npos) throw std::runtime_error("WISP_POINTER_INVALID");
    if (parts.size() < 4) throw std::runtime_error("WISP_POINTER_INVALID");
    if (parts[0].size() || parts[1].size() || parts[2].empty() || parts[3].empty()) throw std::runtime_error("WISP_POINTER_INVALID");
    for (size_t i = 4; i < parts.size(); ++i) {
      if (parts[i].empty()) throw std::runtime_error("WISP_POINTER_INVALID");
    }
    return path;
  }
  if (path.size() < 4 || path[1] != ':' || path[2] != '\\') throw std::runtime_error("WISP_POINTER_INVALID");
  if (!(std::isalpha(static_cast<unsigned char>(path[0])))) throw std::runtime_error("WISP_POINTER_INVALID");
  if (path.find(':', 2) != std::string::npos) throw std::runtime_error("WISP_POINTER_INVALID");
  if (path.back() == '\\') throw std::runtime_error("WISP_POINTER_INVALID");
  if (parts.size() < 2 || parts[0].size() != 2 || parts[1].empty()) throw std::runtime_error("WISP_POINTER_INVALID");
  for (size_t i = 1; i < parts.size(); ++i) {
    if (parts[i].empty()) throw std::runtime_error("WISP_POINTER_INVALID");
  }
  return path;
}

static std::string prefix(const std::string& path) {
  std::string value = lowerCopy(validateWindowsPath(path));
  while (!value.empty() && value.back() == '\\') value.pop_back();
  value.push_back('\\');
  return value;
}

bool pathsOverlap(const std::string& a, const std::string& b) {
  const std::string A = prefix(a);
  const std::string B = prefix(b);
  return A.rfind(B, 0) == 0 || B.rfind(A, 0) == 0;
}

bool isDirectChild(const std::string& parent, const std::string& child) {
  std::string p = validateWindowsPath(parent);
  std::string c = validateWindowsPath(child);
  while (!p.empty() && p.back() == '\\') p.pop_back();
  while (!c.empty() && c.back() == '\\') c.pop_back();
  const std::string prefixPath = lowerCopy(p) + '\\';
  if (lowerCopy(c).rfind(prefixPath, 0) != 0) return false;
  const std::string rest = c.substr(p.size() + 1);
  return !rest.empty() && rest.find('\\') == std::string::npos;
}

void assertPointerSeparation(const std::string& homePath, const std::string& supportPath, const std::string& scratchPath) {
  validateWindowsPath(homePath);
  validateWindowsPath(supportPath);
  if (pathsOverlap(homePath, supportPath)) throw std::runtime_error("WISP_HOME_UNSAFE");
  if (!scratchPath.empty() && pathsOverlap(homePath, scratchPath)) throw std::runtime_error("WISP_HOME_UNSAFE");
}

void validateTestSupport(const std::string& scratch, const std::string& testSupport, bool markedOwned) {
  if (!isDirectChild(scratch, testSupport) || !markedOwned) throw std::runtime_error("WISP_HOME_UNSAFE");
}

HomeMarker parseMarkerJson(const std::string& json) {
  bool versionIsInt = false;
  int version = 0;
  const auto fields = parseObject(json, "WISP_HOME_INVALID", versionIsInt, version);
  if (hasKey(fields, "bookmark") || fields.size() != 2 || !hasKey(fields, "version") || !hasKey(fields, "companionId") || !versionIsInt || version != 1) {
    throw std::runtime_error("WISP_HOME_INVALID");
  }
  HomeMarker marker;
  marker.version = 1;
  marker.companionId = companionUuid(requireKey(fields, "companionId", "WISP_HOME_INVALID"));
  return marker;
}

HomePointer parsePointerJson(const std::string& json) {
  bool versionIsInt = false;
  int version = 0;
  const auto fields = parseObject(json, "WISP_POINTER_INVALID", versionIsInt, version);
  if (hasKey(fields, "bookmark") || fields.size() != 3 || !hasKey(fields, "version") || !hasKey(fields, "companionId") || !hasKey(fields, "path") || !versionIsInt || version != 1) {
    throw std::runtime_error("WISP_POINTER_INVALID");
  }
  HomePointer pointer;
  pointer.version = 1;
  pointer.companionId = companionUuid(requireKey(fields, "companionId", "WISP_POINTER_INVALID"));
  pointer.path = validateWindowsPath(requireKey(fields, "path", "WISP_POINTER_INVALID"));
  return pointer;
}

std::string encodeMarkerJson(const std::string& companionId) {
  const std::string id = companionUuid(companionId);
  return std::string("{\"companionId\":\"") + id + "\",\"version\":1}";
}

std::string encodePointerJson(const std::string& companionId, const std::string& path) {
  const std::string id = companionUuid(companionId);
  const std::string abs = validateWindowsPath(path);
  std::string out = "{\"companionId\":\"";
  out += id;
  out += "\",\"path\":\"";
  for (char c : abs) {
    if (c == '\\') out += "\\\\";
    else out.push_back(c);
  }
  out += "\",\"version\":1}";
  return out;
}

std::string reuseOrMintCompanionId(const std::string* markerJson, const std::string* injectedId) {
  if (markerJson && !markerJson->empty()) return parseMarkerJson(*markerJson).companionId;
  if (!injectedId) throw std::runtime_error("WISP_HOME_MINT");
  return companionUuid(*injectedId);
}

FolderPlan planFolderChoice(bool cancelled, const std::string* existingMarkerJson, const std::string* injectedId,
                             const std::string& selectedPath, const std::string& supportPath, const std::string& scratchPath) {
  FolderPlan plan;
  if (cancelled) {
    plan.action = "noop";
    return plan;
  }
  validateWindowsPath(selectedPath);
  assertPointerSeparation(selectedPath, supportPath, scratchPath);
  if (existingMarkerJson && !existingMarkerJson->empty()) {
    const std::string id = parseMarkerJson(*existingMarkerJson).companionId;
    plan.action = "reuse";
    plan.companionId = id;
    plan.writeMarker = false;
    plan.pointer = parsePointerJson(encodePointerJson(id, selectedPath));
    return plan;
  }
  const std::string id = reuseOrMintCompanionId(nullptr, injectedId);
  plan.action = "mint";
  plan.companionId = id;
  plan.writeMarker = true;
  plan.pointer = parsePointerJson(encodePointerJson(id, selectedPath));
  return plan;
}

void bindPointerToMarker(const HomePointer& pointer, const HomeMarker& marker) {
  if (pointer.companionId != marker.companionId) throw std::runtime_error("WISP_HOME_INVALID");
}

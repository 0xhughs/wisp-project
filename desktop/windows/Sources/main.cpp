#include "WinApp.h"

static bool eq(const wchar_t* a, const wchar_t* b) { return lstrcmpiW(a, b) == 0; }

int WINAPI wWinMain(HINSTANCE inst, HINSTANCE, PWSTR, int) {
  int argc = 0;
  wchar_t** argv = CommandLineToArgvW(GetCommandLineW(), &argc);
  std::wstring scratch;
  std::wstring testSupport;
  bool developer = false;
  for (int i = 1; i < argc; ++i) {
    if (eq(argv[i], L"--scratch") && i + 1 < argc) scratch = argv[++i];
    else if (eq(argv[i], L"--test-support") && i + 1 < argc) testSupport = argv[++i];
    else if (eq(argv[i], L"--developer") && i + 1 < argc) developer = eq(argv[++i], L"true");
  }
  LocalFree(argv);
  if (!testSupport.empty() && (scratch.empty() || !developer)) return 2;
  WinApp app;
  return app.run(inst, scratch, testSupport, developer);
}

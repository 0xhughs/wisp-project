cmake_minimum_required(VERSION 3.16)
project(Wisp LANGUAGES CXX)

if(NOT WIN32)
  message(FATAL_ERROR "missing-platform: desktop/windows requires MSVC on Windows. On Linux run desktop/scripts/build-windows.sh (skip; this is not a Win32 compile).")
endif()

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

add_executable(Wisp WIN32
  Sources/main.cpp
  Sources/BodyState.cpp
  Sources/Geometry.cpp
  Sources/OrbRaster.cpp
  Sources/HomeIdentity.cpp
  Sources/WinBody.cpp
  Sources/WinShell.cpp
  Sources/WinHome.cpp
  Sources/WinApp.cpp
  wisp.manifest
)
target_include_directories(Wisp PRIVATE Sources)
target_compile_definitions(Wisp PRIVATE UNICODE _UNICODE NOMINMAX WIN32_LEAN_AND_MEAN)
target_link_libraries(Wisp PRIVATE
  user32
  gdi32
  ole32
  oleaut32
  uuid
  shell32
  advapi32
  comctl32
)

add_executable(WispNativeChecks
  Tests/NativeChecks.cpp
  Sources/BodyState.cpp
  Sources/Geometry.cpp
  Sources/OrbRaster.cpp
  Sources/HomeIdentity.cpp
)
target_include_directories(WispNativeChecks PRIVATE Sources)
target_compile_definitions(WispNativeChecks PRIVATE UNICODE _UNICODE NOMINMAX)

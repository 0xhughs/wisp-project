# Wisp management shell

The accessory app owns one native status item and lazily creates one retained Settings window. Closing Settings keeps Wisp running. Settings remembers the selected section for this app run; Memory, Change Pet and Change Model explicitly select their respective destinations. Settings supports ordinary keyboard navigation, Command-comma, Command-W and Command-Q. Use the status menu's Quit Wisp to stop the body and hidden engine through the existing EOF cleanup path.

General's Show Companion reveals and clamps the existing body. It does not activate the body, start audio or replace the engine. Pets is a working closed catalog (Wisp orb, Fox, and Robot, plus an unavailable official-skins row; see `pets.md`). Plugins is a working closed catalog (demonstration install/configure/remove plus explicit unavailable classes; see `plugins.md`). Connections is a working closed catalog (local stdio demonstration plus an advanced editor for that same class and explicit unavailable example rows; see `connections.md`). Skills is a working closed catalog (one Wisp-authored Local time briefing demonstration plus explicit unavailable rows; see `skills.md`). Settings → Permissions lists open URL, open a file for viewing, tell the local time, and the six Accessibility fixture tools as Ask-each-time; macOS Accessibility (TCC) is required for those fixture tools and granting it is not Allow Once; the demonstration MCP tool is Ask-each-time only when that Connection is mounted; the skill tool is Ask-each-time only when Local time briefing is mounted. Visual click, Windows computer control, stock shell/fs/web, named SaaS connectors and plugin-delivered MCP stay unavailable. See `computer-control.md`. Speech, grants and proactivity remain unavailable except as their own sections describe. Engine Ready never means voice ready. Models configures local Ollama, optional protected DeepSeek keys, and hardware-aware Faster/Recommended/Stronger onboarding without invented GB/VRAM cutoffs (see `reasoning-models.md`). Diagnostics includes the same nonsecret hardware snapshot, the nonsecret current body catalog id, the nonsecret skill catalog id and status, categorical Accessibility TCC trusted/untrusted when native can read it, and omits connection secrets. Memory provides real local folder selection and entry management; see `local-home-memory.md`. Other unimplemented capabilities remain unavailable and no fake marketplace or chat surface is supplied.

`CompanionController` owns the sole bridge, body, menu controller and optional settings controller. `ManagementState` supplies transient section selection and safe lifecycle descriptions. Terminal failure rejects stale readiness, and stopping rejects navigation. Window/view closures refer weakly to the application owner. Section changes create no timer, observer, bridge or session. The body retains its nonactivating panel rules. Menu Quit removes the status item and management window, pauses the body, and lets the existing bridge cleanup finish; the original forced deadline remains distinct from clean shutdown.

Build and native checks:

```sh
desktop/scripts/build-macos.sh --scratch /absolute/external/build
desktop/scripts/test-native.sh /absolute/external/native-tests
node --test desktop/tests/body-bridge.test.mjs spike/tests/client.test.mjs
```

Run the assembled executable with the accepted runtime root, fresh external scratch, and Node path recorded in the runtime's `.wisp-spike.json`; see `desktop/scripts/run-macos.sh`. Without configuration the body reports unavailable, while Settings and Quit remain usable. Normal launch has no developer command channel. Do not substitute a runtime or provision a model to run these checks.

Build the test-only HomeFixture as documented in `local-home-memory.md`; it supplies a real isolated retained home. For live proof, run the interactive observer below in a terminal that preserves stdin. Use a fresh scratch for each case: normal, bridge-loss, engine-failure, missing-config, repeat.

```sh
node desktop/tests/shell-live.mjs --case normal \
  --runtime-root /absolute/verified/runtime \
  --scratch /absolute/fresh/shell-normal \
  --app /absolute/build/Wisp.app/Contents/MacOS/WispBody \
  --fixture-helper /absolute/external/HomeFixture
```

The runner launches the developer-only app, records safe bounded native frames privately, periodically asks for resource facts, and waits for **actual UI actions**. It never invokes Settings/menu targets programmatically. Its terminal accepts only `status`, `smoke`, `recreate`, `hide`, and `fault`. `fault` kills the owned bridge or engine only in the corresponding isolated case. Always quit through the native status menu. The normal oracle expects two distinct harmless smoke turns, all eleven section selections, close/reopen, body recreation and unchanged live identities. Failure cases expect unavailable Settings while open and no restart. Every case checks clean native exit and no owned bridge/process group. Passing these machine checks does not independently establish the operator's pointer, keyboard or focus observations; record those separately.

Normal proof sequence: launch while the independent target has focus; open/dismiss status menu; open Settings; navigate all sections with pointer and arrow keys; smoke; exercise menu shortcuts, close/reopen ten times, minimize/restore, hide/Show Companion and recreate; return to the target for global click-through, scrolling, typing, dragging and its full-screen Space; smoke again; actual menu Quit. See the GUI README for authorized test-only input and coordinates. For failure runs open Diagnostics, issue `fault`, observe unavailable content, navigate again, and Quit. For missing configuration verify General/Diagnostics and Quit. Repeat launch/Quit checks duplicate items and cleanup.

Raw test homes and session identities remain outside the source tree. The checked-in evidence contains sanitized booleans, resource counts and screenshots of owned Wisp windows only. The historical02 record remains historical; current03 regressions are recorded separately.

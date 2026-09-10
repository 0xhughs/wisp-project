# Local home and memory

Wisp retains one companion identity and useful knowledge in a folder you choose. Open **Memory** or **General** in Wisp Settings, then **Choose Wisp Folder…**. Select an empty dedicated folder. Cancelling the chooser does not configure anything. Subsequent launches use a private bookmark to find that same folder automatically. If it becomes unavailable, correct its access or use the chooser to locate the same Wisp home. This build does not create additional identities, switch homes, merge files or synchronize to a cloud service.

The folder contains `wisp-home.json` (format version and companion UUID; do not edit), `memory.json`, `README.txt`, `files/`, and the reserved `.wisp-lock`. Files in `files/` are yours; Wisp does not scan or execute them. Preferences, projects, standing instructions and facts are plain memory entries. The editor supports Add, Edit, Save, Cancel, confirmed Delete and Reload. Drafts survive leaving Memory or closing Settings; quitting with a draft offers Keep Editing or Discard and Quit.

Saved memory becomes the hidden agent's knowledge on its **next reasoning restart or app launch**. Settings distinguishes the current attached revision from a newer saved revision. Editing memory does not restart the engine. The companion UUID persists; the internal controller, process and Harness session are fresh on each launch. Internal sessions are not a conversation-history interface. No automatic extraction or hot reload is implemented.

## Readable format

`memory.json` uses UTF-8 JSON:

```json
{
  "version": 1,
  "entries": [
    {
      "id": "c4cdfef9-79b1-434a-9b49-7c5fed47c7f6",
      "category": "preference",
      "text": "Prefer short answers."
    }
  ]
}
```

Categories are `preference`, `project`, `instruction`, `fact`. Each ID is a unique UUID. Maximum64 entries,2,000 Unicode scalar values per nonempty text and32KiB serialized UTF-8 document. These are this build's safety limits. Unknown keys/versions, invalid UTF-8, duplicate IDs, NULs and over-limit content are refused. Braces and template-like text stay literal. An empty entries array is valid. Keep managed files owner-only (`600`) and managed directories owner-only (`700`); Wisp tightens only the explicitly selected empty root, never unrelated files recursively.

You can edit the file externally and press Reload. Save compares the loaded disk revision before publishing. If another editor changed it, Wisp retains your draft and refuses overwrite; Cancel the draft, Reload and review the newer version. Invalid data stays untouched with an error. A failed save never reports success; when publication succeeded but acknowledgement failed, Reload reveals the valid committed revision. Do not delete a home to resolve an error.

## Storage boundary

Wisp keeps a private bookmark/UUID and process lock in the user's Foundation Application Support/Wisp directory. Initialization uses a separate pending receipt, publishes complete files exclusively, and commits the retained pointer last. If interrupted, reselect the same folder to finish its identifiable initialization. Reserved `.wisp-stage-<UUID>` files can remain after a killed process; they are not imported as memory. Managed operations use fixed leaf names, anchored no-follow descriptors, ownership/mode/inode checks and atomic same-directory publication with sync. Active owner locks are released by process death. Symlinked/hard-linked managed files, unsafe owners/modes, replaced ancestors and another active writer are refused.

Writes coordinate with participating macOS document editors and check the exact previously loaded revision immediately before publication. This does not promise immunity from a malicious or noncooperating same-user process racing the final rename. Back up important local data normally. Wisp does not silently choose last-writer-wins when it can observe a conflicting edit.

Never store credentials in memory. Models stores optional API keys separately in Keychain; memory has no secret detector. The editable home is never the Harness working directory or DSH_HOME; its `.env`, arbitrary instructions and credential-like files are not discovered. Per-run engine settings, sessions and generated profile live in private external runtime scratch. A private validated launch snapshot is removed after attachment; model input may remain in private internal session artifacts. Automatic diagnostics use fixed categories and do not retain raw engine stderr, memory or model replies. The only memory integration is an additive pinned system-prompt variable/section; it enables no tools and cannot grant actions.

## Build and repeatable verification

Use existing authorized dependencies and route; no installation is performed. Commands run from the repository root; all scratch paths must be outside source. Never use actual user Application Support data for tests.

```sh
desktop/scripts/build-macos.sh --scratch /absolute/external/build
desktop/scripts/test-native.sh /absolute/external/native-tests
node --test desktop/tests/body-bridge.test.mjs desktop/tests/memory-context.test.mjs spike/tests/client.test.mjs
swiftc desktop/macos/Sources/WispBody/HomeStore.swift desktop/macos/Sources/WispBody/MemoryStore.swift desktop/tests/HomeFixture.swift -o /absolute/external/HomeFixture
node --import /verified/runtime/upstream/node_modules/.pnpm/tsx@4.22.4/node_modules/tsx/dist/esm/index.mjs desktop/tests/memory-engine.mjs /verified/runtime/upstream
```

HomeFixture is a test-only binary, never bundled in Wisp. It creates a real bookmark and empty home inside a marked test root for body/shell regression fixtures. Developer app launch requires `--test-support` as a direct child of its marked `--scratch`; absent or nondeveloper test overrides are refused. Production launch resolves its own private support location. `memory-live` never injects a selected home, so chooser and automatic restore evidence remain real UI operations.

```sh
node desktop/tests/memory-live.mjs --runtime-root /verified/runtime --scratch /absolute/external/memory-gui --app /absolute/external/build/Wisp.app/Contents/MacOS/WispBody
node desktop/tests/memory-security.mjs --runtime-root /verified/runtime --scratch /absolute/fresh/security --app /absolute/external/build/Wisp.app/Contents/MacOS/WispBody --fixture-helper /absolute/external/HomeFixture
node desktop/tests/body-live.mjs --runtime-root /verified/runtime --scratch /absolute/fresh/body --app /absolute/external/build/Wisp.app/Contents/MacOS/WispBody --fixture-helper /absolute/external/HomeFixture
```

Run interactive memory/shell observers in a real terminal/PTY that retains stdin. Memory operator commands are `status`, `smoke`, `recall`, `recreate`, `hide`, `show`; there is no arbitrary prompt. The recall command asks only for a fixed verification phrase, without putting its saved answer in the request. Its model output remains in test-private events. Ordinary production launch does not expose these commands.

GUI procedure: cancel then select a fresh folder; create all four categories, edit/save/cancel, type and paste Unicode/multiline text, traverse controls with Tab/Shift-Tab, scroll a long entry, navigate/close/reopen with a draft, exercise Keep Editing at Quit, and inspect/cancel/confirm an exact-entry deletion. Modify memory externally, attempt a stale save and Reload. Corrupt then repair the test file and observe refusal/recovery. Quit normally and relaunch the same test support without home-path injection. Verify the same companion UUID and latest revision with a new internal session; run recall, then delete the fact and relaunch again. Inspect the real durable `request/header.system` to verify deletion from model input, instead of relying on the model to prove a negative. Use `readDurableSession` from unchanged `spike/client.mjs` privately.

Security runner exercises real competing app instances (same support and same home with distinct support), owner death and recovery, actual model-input/environment canaries, corruption, access refusal and an adversarial standing instruction with zero effects. Native assertions cover publication/initialization interruption, after-publication acknowledgement failure, conflict, links/modes, replaced ancestor and outside canaries. Neither source inspection nor fake model output satisfies live proof.

For GUI automation select the exact **already-running** app path. Some CUA observations can automatically launch an app after it quits: do not call CUA state/screenshot on a stopped app. Verify Quit through the observer and process list instead. The authorized global InputProbe remains test-only; check its permission and current owned-window bounds before each pointer action. See `desktop/tests/gui/README.md` and the04 evidence for actual results and remaining limits.


Repair04-repair-026 strengthens ownership: Wisp holds a process-lifetime exclusive lock on each private/home directory inode as well as its named lock file. Unlinking/replacing the name therefore cannot admit another owner while the first directory lock remains held. Read/load/choose/stage/save validate the held named descriptor against the current no-follow directory entry, including owner, mode, link count and inode; visible tampering refuses further managed work. The running immutable engine is not periodically restarted or polled for filesystem changes. A rival cannot attach to the same locked directory, and normal process exit/death releases ownership. This does not promise immunity to a malicious same-user process racing the final publication or substituting an entirely different directory tree.

Interrupted initialization validates the marker, memory document, README and files directory through the same checks as ordinary reads before committing the private binding. Invalid existing README links/modes/types remain untouched and do not produce Saved or an attachment snapshot. Nonblocking opens let type checks reject a FIFO without hanging the store queue. Correcting the owned invalid object permits retry with the original pending UUID.


If the selected home is renamed/moved while Wisp remains open, ordinary Reload refuses its stale path. Choose Wisp Folder can explicitly reconnect the same directory at its new path. The selected directory must match the still-held device/inode, named lock, marker/UUID and valid managed content. A copied directory—even with the same UUID—or a replaced lock is refused. Rebinding updates the bookmark and retained path without closing or reacquiring the original directory/file lock descriptors, so no competing-owner interval is introduced. Live recovery is for the same directory inode; copying between filesystems is not a relocation feature. Memory editing resumes, but the current engine keeps its original immutable snapshot. The latest saved data applies after reasoning restart or normal app restart.

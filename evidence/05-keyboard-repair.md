# Focused keyboard repair — 05-repair-036

Addresses the single P2 in independent05-review-035. Before: on unchanged host defaults, Models Tab moved local model→endpoint→sidebar and secure field→sidebar, skipping selectors/actions. After: explicit native popup/button focus and field-editor Tab/backtab route through enabled, visible controls. Ancestor-hidden controls and disabled actions are excluded. Buttons activate with Space or Return; popup menus use native arrows/Space. Key removal retains its pointer confirmation and adds explicit Escape cancellation and Command-R confirmation, explained in the sheet. No OS keyboard preference was changed.

## Actual native input proof

Fresh isolated build, generated support/home and explicit disposable Keychain under work/wisp-05/05-repair-036/gui. NativePID759/runner28159, run-1788978503631. Verified live runner before exact CUA bundle selection. Opened menu Change Model and initially focused local model with pointer, then all Models operations below used keyboard only:

- Local model Tab→endpoint Tab→Save and Apply (the exact formerly failing step), then Revert, Test and Reload. AX explicitly reported focused buttons. Space activated Test and a real local fixed response completed. Return activated Reload; status confirmed saved configuration reload.
- Shift-Tab from local field focused provider. Native keyboard popup selection chose cloud; Tab reached cloud model, arrows/Space changed flash→pro, Tab reached secure field. Typed only a disposable noncredential sentinel. Tab skipped disabled Remove to Save; Space saved/applied into isolated Keychain. Field cleared and status showed stored key. No cloud prompt was sent.
- Tab from secure field reached enabled Remove. Space opened confirmation; Escape canceled and retained stored-key state. Space reopened; Command-R removed that isolated key. Missing-key state disabled Remove/Test and remained honest. From secure field Tab skipped Remove to Save, then Revert, then skipped disabled Test to Reload.
- Keyboard selected an unsaved local provider draft; Tab reached Revert, Space restored saved cloud. Keyboard selected local again, edited endpoint to an invalid external URL, Tab/Space Save refused it with retained draft. Shift-Tab returned to endpoint, corrected loopback; Tab/Return applied local. Tab traversal reached Test; Return completed another actual local response.
- Command-W closed Settings. Actual status-menu Quit ended the run with exit0, cleanuptrue/no forced stop; all three bridge/runtime generations absent. No CUA operation after Quit.

AX/screenshot states were observed through CUA; no saved screenshot files claimed. Native menu keyboard selection was inspected between actions when necessary; no synthetic target/action invocation was used. While an action temporarily disables itself, macOS can move focus back to the editor/sidebar; ordinary Tab resumes the explicit visible form cycle. The form remains operable without an OS preference change.

## Meaningful checks and scope

New ModelsFocusTests asserts forward/reverse traversal skips ancestor-hidden alternate route, skips disabled actions, wraps correctly, includes newly visible cloud selector, allows explicit popup/button first responder and returns no destination for a disabled busy form. Full native assertions, including actual isolated Keychain/storage tests, pass: work/loop-state/05-repair-036-native.log. Fresh app build passed:05-repair-036-build.log. The independent actual failing reproduction is the RED oracle; these actual keyboard operations are the GREEN oracle. No unaffected expensive model/security suite was repeated.

Two local connection tests completed. Zero cloud prompts/requests during repair; a disposable cloud attachment is initialization only. All six prior authorized real-cloud attempts remain consumed, ledger untouched. Production real-key support/home was not used; its key remains retained with saved local selection.

Cloud applicability comparison is work/loop-state/05-repair-036-source-binding.json against independent work/wisp-05/05-review-035/cloud-source-binding.json. Existing bound changes are only ModelsView, NativeChecks and test-native.sh, plus new ModelsFocus and its test. Engine, accepted spike, provider profile, credentials, storage, controller, bootstrap and transport are byte-identical. UI repair forwards the existing actions without changing their implementation. Prior six-call cloud proof therefore remains evidence for unchanged routing/credential/continuity behavior; it is not a claim that the new native binary itself made a new billable cloud request. Independent reviewer must assess this narrow applicability and the repaired keyboard path.

Builder handback awaits fresh independent implementation review. No self-approval or next-slice advance.

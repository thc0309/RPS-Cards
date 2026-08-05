# T14 — Native-device E2E and final MVP evidence gate

Status: blocked (native device/E2E evidence)

## Outcome

Chạy full non-device verification và toàn bộ native-device cases trên exact source
state, ghi PASS/FAIL/BLOCKED có evidence, rồi trả kết luận MVP ready-for-review.
Task này không deploy, không dùng production ads và không tự commit.

## Dependencies and skills

- Dependencies: T12, T13.
- Required skills: `vibe-e2e`, `vibe-review`, `security-and-hardening` cho evidence
  redaction.
- Read first: toàn bộ `tasks/test-plan.md`, `tasks/test-result.md`, checkpoint D
  trong `tasks/plan.md`, `SPEC.md` Acceptance Criteria.

## Execution protocol

1. Freeze/record exact Git diff state, app/server versions, device model, OS,
   build type, server URL class (không secret), locale và test-ad mode.
2. Run `npm run verify` trước device cases. Failure là FAIL, không tiếp tục để tạo
   misleading device evidence.
3. Start local server và development clients; dùng two physical devices cho P1
   privacy/reconnect. Emulator-only evidence không thay thế case ghi physical.
4. Execute cases theo table order: P0 → preferences/UI → rooms/privacy/ads →
   reconnect → performance. Capture visible result + sanitized relevant logs và
   screenshot/video path.
5. Không inspect/log opponent secret hand để “chứng minh” privacy. Dùng absence
   assertions từ integration suite và visible inactive-device behavior.
6. Trong lúc chạy E2E không sửa source. Nếu case FAIL vì code, record vào
   `tasks/test-result.md`, kết thúc selected run, quay lại owning TXX bằng
   `$vibe-test`, rồi rerun T14 từ affected suite.
7. BLOCKED chỉ dùng cho real device/toolchain/access unavailable và phải ghi owner,
   blocker, attempted checks và unblock condition. Không đổi BLOCKED thành PASS.
8. Sau all PASS, chạy `$vibe-review`, final `npm run verify`, `git diff --check`
   và cập nhật todo/checkpoint evidence. Không commit nếu user chưa yêu cầu.

## Likely files

- `tasks/test-plan.md` — chỉ cập nhật Evidence/status cells khi chạy
- `tasks/test-result.md` — FAIL/BLOCKED entries
- `tasks/todo.md`, `tasks/plan.md` — status/evidence only
- Không product code trong active E2E execution

## Acceptance criteria

- [ ] Exact tested source state có final `npm run verify` xanh, including 9
  matchups, 864 exhaustive cases, 10,000 simulation và Colyseus privacy/reconnect suite.
- [ ] Tất cả required Android/iOS/two-device cases có PASS evidence; mọi non-pass
  có explicit FAIL/BLOCKED record và task không bị đánh dấu complete.
- [ ] Final review không còn finding blocker/high; evidence không chứa token,
  private hand, production ad ID hoặc secret; no commit/deploy performed.

## How to run

```bash
npm install
npm run verify
npm run dev:server
npm run dev:mobile
npm run mobile:android
npm run mobile:ios
git diff --check
git status --short
```

Sau khi server/clients chạy, thực thi từng case theo `tasks/test-plan.md`. Nếu có
native automation runner được phê duyệt sau này, ghi exact command/version vào
test result; không tự thêm Maestro/Detox trong task này.

## Evidence to record

- Exact source state is an uncommitted working tree; no commit was created.
- `npm run verify` passes: game-core 13/13, server 23/23, mobile 14 suites / 33
  tests, typecheck/lint/build all pass. `git diff --check` is in `tasks/test-result.md`.
- Exact-source Android Expo development build rebuilt for `arm64-v8a`, installed
  and opened on physical `Pixel_4a` (exit 0); the missing splash module error is fixed.
  iOS planning reached CocoaPods/Xcode but is BLOCKED because no iOS 26.2 runtime
  exists for the selected destination.
- Per-case native PASS/BLOCKED records are in `tasks/test-result.md`; physical
  two-device privacy/reconnect and 60fps profiling are not replaced by emulator smoke.

## Explicitly skipped

- Source fixes trong active E2E run, CI/EAS distribution, production ads,
  monitoring, privacy paperwork, release signing và deployment.

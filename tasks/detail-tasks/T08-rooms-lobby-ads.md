# T08 — Rooms, Lobby, and one-shot interstitial entry gates

Status: complete

## Outcome

Hoàn chỉnh vertical create/join slice trên mobile: Home → Rooms → test ad gate →
server create/join → Lobby, gồm validation hai lần cho join, capacity/error states
và protection chống rapid duplicate taps.

## Dependencies and skills

- Dependencies: T04, T07.
- Required skills: `vibe-build`, `vibe-test`, `frontend-ui-engineering`,
  `security-and-hardening`, `source-driven-development`.
- Read first: `SPEC.md` P1 create/join, Rooms-screen contract, Advertising,
  Expo dev build, Contracts và MOB-P1/MOB-AD cases.

## Technical contract

1. Mobile Colyseus adapter là network boundary duy nhất. Nó map stable server
   error codes sang view state; screen không parse raw transport errors hoặc giữ
   canonical room state trong persisted Zustand slice.
2. Rooms screen gồm empty/current-room state, 5-character uppercase code input,
   **Tạo phòng**, **Vào phòng**. Không public room list/search/filter/pagination.
3. Create sequence duy nhất: acquire operation guard → one ad attempt → create
   request → save active session metadata → Lobby. Ad close/fail/timeout/no-fill
   đều continue exactly once.
4. Join sequence: local format validate → server availability validate → one ad
   attempt → server revalidate → join once → Lobby. Code thay đổi hoặc room full/
   expired sau ad giữ user ở Rooms và input vẫn editable.
5. `react-native-google-mobile-ads` dùng official Expo config/plugin và test IDs
   ngoài production. Wrapper chỉ có một `attemptInterstitial(): Promise<Outcome>`
   với bounded timeout/one settlement; không generic ad framework.
6. Rapid taps share one in-flight promise/disabled state; operationId ổn định qua
   retry hợp lệ. Navigation chỉ xảy ra một lần.
7. Lobby hiển thị room code, local/opponent ready presence và waiting/full/error
   states; room code có accessible copy action nếu được implement, không cần
   clipboard dependency nếu không có use case.
8. Bot, draft, board, reconnect và result không import/call ad gate.

## TDD sequence

1. Adapter/screen tests cho invalid code, not found, full, expired và input retention.
2. Sequence tests mock ad/server: create `ad→create`; join
   `validate→ad→revalidate→join` và assert exact call order.
3. Table tests ad close/fail/timeout/no-fill đều continue once; rapid taps cause
   one ad and one mutation.
4. Lobby two-player presence/capacity component tests.
5. Native smoke test với official test interstitial ID trên development build.

## Likely files

- `mobile/src/game/colyseus-client.ts`, `mobile/src/game/room-entry.ts`
- `mobile/src/ads/interstitial-gate.ts`
- `mobile/src/screens/RoomsScreen.tsx`, `mobile/src/screens/LobbyScreen.tsx`
- `mobile/app/rooms.tsx`, `mobile/app/lobby.tsx`
- Expo app config for Google Mobile Ads plugin
- Focused mobile/server tests

## Acceptance criteria

- [x] Create và join tuân đúng call order; ad outcomes không block; rapid taps
  tạo nhiều nhất một ad attempt, request và navigation cho mỗi entry operation.
- [x] Invalid/full/expired errors localized, giữ input trên Rooms; Lobby tối đa hai
  players và không có public room enumeration.
- [x] Development build dùng test ad IDs; codebase/test chứng minh không ad call ở
  bot/draft/board/reconnect/result và native config rebuild thành công.

## How to run

```bash
npm run test --workspace mobile -- --runInBand --testPathPattern="rooms|lobby|ad|room-entry"
npm run test --workspace server -- --test-name-pattern="validate|join|capacity"
npm run typecheck --workspace mobile
npm run lint --workspace mobile
npm run dev:server
npm run mobile:android
npm run mobile:ios
npm run verify
git diff --check
```

Native dependency/config thay đổi bắt buộc rebuild development client; Metro
reload đơn thuần không đủ. Chạy MOB-AD-001/002/003 với test IDs.

## Evidence to record

- Mock call-order/duplicate tests.
- Android/iOS test-ad close/failure logs đã sanitize.
- Screenshots Rooms empty/error/current-room và Lobby two seats ở vi/en.

## Evidence

- Mobile Jest room-entry/ad suites: 10 tests passed. Create order is `ad → create → lobby`; join order is `validate → ad → revalidate → join → lobby`; rapid taps share one promise.
- Server room-directory tests cover create/validate/join, full and expired codes without public room enumeration.
- Expo config resolves the official Ads plugin with Google test app IDs. `yarn android` rebuilt, installed and opened the development client successfully after pinning `react-native-google-mobile-ads@15.8.3` for Expo 57 Kotlin compatibility.

## Explicitly skipped

- Production ad IDs, rewarded/post-match ads, analytics, online draft và reconnect.

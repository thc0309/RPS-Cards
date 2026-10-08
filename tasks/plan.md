# Implementation Plan — RPS Cards MVP

Status: T01–T12 complete; Android remediation/evidence active; iOS validation deferred

## T27 — Đấu lại quay về chọn bài (2026-10-07)

- BOT: Result gọi `disposeLocalSession()` rồi replace `/draft`; Draft hiện có tạo lượt chọn mới và adapter mới, không tái dùng bộ bài cũ.
- Online: contract hiện có đợi cả hai `REMATCH_READY` rồi `startDraft()`; Result chuyển `/draft` cùng room/session khi nhận pha draft.
- Verification: test Result mới đã tái hiện lỗi `/board` trước sửa; sau sửa 8 tests/3 suites Result/local match/local draft PASS, mobile typecheck và lint hai file PASS. T28 native release mặc định đã xác nhận Đấu lại mở Draft mới với ba lá úp/timer5s; không đóng các gate Android còn mở.

## T28 — Thử hiệu ứng thắng/thua/hòa (2026-10-07)

- Dùng chung `FolkBoardView` cho BOT/online: bài thắng nảy nhẹ + viền vàng + sáu cánh sen, bài thua nghiêng/hạ nhẹ, hòa nhún đồng thời. Giữ nhịp outcome 1200ms, không thêm dependency hay timer gameplay.
- `BoardRoundPresentation` tính progress/thời gian còn lại theo authority; Reanimated chạy từ progress hiện tại, snapshot lặp không khởi động lại. Reduced Motion chỉ giữ bài, viền và text tĩnh.
- Native phát hiện footer chữ lớn bị cắt; chỉnh bố trí compact và tỷ lệ card, kiểm tra lại ở320×568dp/font1.3. Motion thường/Reduced Motion qua outcome → lượt mới, footer đủ; settings đã restore.
- Verification final: 59 tests/24 suites mobile PASS, mobile typecheck/lint/diff PASS; release arm64 build/install PASS. Default + small có bốn lượt, default rematch trở lại Draft; compact cuối có smoke normal/reduced một lượt mỗi case. [REPORT](evidence/android/2026-10-07-outcome-effects/REPORT.md) phân biệt bằng chứng trước/sau compact và các gate còn mở.

Current requested work is T29 implementation and scoped Android validation.
Product code A–K is implemented; T29-L/native acceptance remains partial before
refreshing T22 and the Android portion of T14.
Existing T26/T25 native gaps remain open. iOS remains required for the later
cross-platform release gate and is deferred in this Android milestone.

## T29 — Hiệu ứng và âm thanh toàn game (implemented 2026-10-07)

Trạng thái: A–K đã triển khai; mobile117/core13/server27 tests PASS. Native
Samsung một máy + peer lập trình có evidence; acceptance L/CP29-4 PARTIAL, hai
Android thật BLOCKED (người dùng xác nhận chỉ có một máy). Chưa commit/push T29.
Contract: [Whole-game feedback](../SPEC.md#whole-game-feedback--t29-implemented-2026-10-07).
Bằng chứng và các giới hạn: [REPORT](evidence/android/2026-10-07-game-feedback/REPORT.md).

### Implementation and verification — 2026-10-07

- A/B: 13 WAV gốc325,148 bytes, recipe/metadata check; expo-audio57.0.5, release
  không có RECORD_AUDIO; Sound ON/Rung OFF, normalize và persist đã kiểm thử.
- C/D/E: RootLayout sở hữu pool13 player, một active request/voice, priority/expiry,
  cancel mute/background/ad; switch vi/en cuộn được, Close cố định; shared press
 0.97/120ms. Native READY trước listener được xử lý qua player.isLoaded.
- F/G/H: Draft ba slot, local selection và accepted lock/replacement, tick/flip/
  outcome/discard theo authority; không sửa5s/15s/BOT2s hay800/600/1200/300ms.
- I/J/K: ad lifetime tách timeout4s; terminal record xuyên Board→Result, consume
  một lần trong2s; rematch reset trước paper-slide và Draft mới; forfeit có reason
  trung tính; reconnect deadline/stale callbacks và Rooms reply sau leave được guard.
- Native phát hiện body Reconnecting vượt padding của khung giấy: constrain text
  theo bề rộng trong khung và cho khung tăng chiều cao theo font/body; padding
  đặt trong content View để không làm ảnh nền phần trăm bị thu nhỏ.
- Automated:117 mobile tests/34 suites;13core/27server, typecheck/mobile lint/build
  PASS. Ten-rematch test giữ pool13, không tăng timer/terminal cũ. Expo Doctor20/21
  do12 patch mismatches baseline; root lint baseline unused guest vẫn còn.
- CP29-1/2/3: implementation/automated PASS; native PARTIAL theo matrix. CP29-4
  PARTIAL/BLOCKED; không tự đóng T26-F/G hay T25/T22/T14.


### Skill Intake Summary — T29

- Stack thực tế: npm workspaces; mobile Expo 57.0.14, React Native 0.86.2,
  Expo Router 57, Reanimated 4.5.1, Gesture Handler, Zustand và AsyncStorage.
- T26/T28 đã có prepare/flip/outcome/discard và hiệu ứng thắng/thua/hòa dùng chung
  BOT/online. Home có CustomizeSheet; preference store có normalize/partialize/
  hydration; RootLayout có native Stack. Tận dụng các tầng này.
- Intake ban đầu chưa có audio/haptic runtime. Build đã cài expo-audio ~57.0.5
  bằng Expo CLI theo SDK57, dùng installed types/official docs và release playback
  thay cho candidate ban đầu57.0.3.
- Skill đã đọc cho kế hoạch: vibe-plan, planning-and-task-breakdown,
  frontend-ui-engineering và frontend-profile. Khi build dùng vibe-build,
  source-driven-development cho Expo Audio, frontend-ui-engineering cho các view;
  performance-optimization cho native trace. Regression dùng vibe-test/TDD;
  review dùng vibe-review. Không áp dụng browser PASS thay cho Android native.
- Gap: chưa có skill chuyên sản xuất sound pack hay native audio capture.
  Dùng asset brief + công cụ audio/thiết bị thực; cân nhắc bổ sung skill nếu làm
  nhiều sound pack. Không cài/tạo skill trong pha plan, không cần thêm framework.

### Quyết định và phạm vi

1. Phong cách giấy/gỗ/tre, nốt đàn ngắn; giữ card không có khuôn mặt và art/layout.
   Tái dùng T28, không viết lại hiệu ứng mỗi lượt. Không thêm nhạc nền, voice-over,
   Lottie/Skia, animation engine hoặc custom JS route transitions.
2. Một bộ phát ở RootLayout với API nội bộ nhỏ. Cue map cố định, tối đa một tiếng
   đang phát; gameplay/result ưu tiên, tap/tick đang quá hạn bị bỏ. Không event bus,
   hàng đợi âm thanh, timer gameplay mới hoặc một engine riêng cho BOT/online.
3. Mặc định âm thanh ON, rung OFF, có hai switch lưu cục bộ. Rung Android dùng
   React Native Vibration hiện có cho nhịp ngắn đã thử trên máy, không thêm package
   haptics. Rung chỉ ở thao tác xác nhận/thắng đã xảy ra; audio/RM/rung độc lập.
4. Sound không được chặn action hoặc navigation. Module load/play lỗi thì game
   tiếp tục bình thường; seek/load bất đồng bộ phải kiểm tra yêu cầu còn hợp lệ
   sau mute/background/đổi match/unmount. Không phát các cue đã hết hạn.
5. Giữ nguyên 5s Draft, 15s selection, BOT replacement 2s và pipeline
   prepare 800ms → flip 600ms → outcome 1200ms → discard 300ms. Không thay server,
   game-core rules/protocol hay gửi thông tin audio/cosmetic qua API mới.
6. Cues theo matchId + round + sự kiện đã xác thực; dedupe hữu hạn trong phiên
   hiện tại, reset đúng khi đổi match. Snapshot đầu khi hồi phục chỉ seed trạng
   thái; không phát lại lịch sử. Nhịp chuẩn bị dùng các mốc authority chưa qua.
   Terminal record thuộc runtime RootLayout, tồn tại xuyên Board → Result cho cả
   BOT/online; freshness không suy từ score/outcome shape hoặc Result mount.
   Ad suppression cũng thuộc runtime này; thời hạn gate create/join và thời gian
   ad có thể còn visible là hai lifetime riêng.
7. Kế hoạch này mở rộng phần sound/rung trước đây được loại khỏi T23/T25. T29-E
   thực hiện contract control T23; T29-J/K bổ sung phần Result/Reconnecting của
   T25. Không tạo task/code trùng; chỉ đóng T23/T25 khi đủ acceptance của chúng.

### Bộ âm thanh và bản đồ trải nghiệm

13 clip mono, xuất định dạng được module/Android release chứng minh hỗ trợ;
đồng đều độ lớn, không clipping, trim khoảng lặng. Tổng file audio mục tiêu ≤2MB.
Asset manifest ghi nguồn/quyền sử dụng hoặc cách tự tạo, duration và nơi dùng.

| Cue | Thời lượng mục tiêu | Dùng tại |
|---|---|---|
| ui-tap | 60–100ms | Nút, Back, đóng/mở Tùy chỉnh; một tiếng mỗi press hợp lệ |
| paper-select | 80–160ms | Chọn lá Draft/tay bài, nhấc giấy nhẹ |
| card-lock | 80–160ms | Khóa/đổi bài được authority chấp nhận; cùng âm cho mọi loại bài |
| paper-slide | 120–250ms | Điều hướng do người chơi, thu bài, mở Draft mới |
| confirm | 180–300ms | Chào Home lần đầu, vào phòng, đối thủ vào/sẵn sàng, kết nối lại |
| tick | 40–80ms | Ba nhịp prepare và countdown 3/2/1; không chạy cùng nhau |
| card-flip | 180–300ms | Một âm cho cả hai bài lúc bắt đầu nhìn thấy mặt bài |
| round-win | 250–450ms | WIN: nốt đàn đi lên, khớp nảy/viền/cánh sen T28 |
| round-loss | 200–350ms | LOSS: hai nốt nhẹ đi xuống, khớp bài nghiêng |
| round-draw | 150–250ms | DRAW: âm trung tính, hai bài nhún cùng nhau |
| match-win | 700–1000ms | Thắng cả trận: đoạn đàn 5 nốt, tách khỏi thắng lượt |
| match-loss | 350–600ms | Thua cả trận: đoạn đàn trầm, không âm báo lỗi chói |
| connection-lost | 150–250ms | Mất mạng một lần, không phát theo mỗi poll/retry |

| Flow/view | Motion bổ sung | Điều kiện/giới hạn |
|---|---|---|
| Home | Logo/actions opacity + scale nhẹ, tổng ≤220ms | Welcome một lần/launch sau hydrate; trở về Home không chào lại |
| Controls/navigation | Press 0.97/120ms; giữ native Stack | Không delay callback; disabled/cancelled press không phát tap |
| Rooms/Lobby | Khung xác nhận/sẵn sàng sáng một lần ≤250ms | Theo success/state edge, không theo polling; lỗi vẫn có text |
| Draft | Ba lá úp enter ≤180ms; chọn nâng nhẹ ≤6dp | Luôn ba slot, unavailable vẫn disabled; không thêm face payload |
| Drag/replace | Giữ T24 drag/snap-back; nhấn outline target khi hợp lệ | Invalid drop không xác nhận; accepted replacement không reset deadline |
| Prepare | Nhịp sáng hai slot ở mốc 0/260/520ms của cửa sổ 800ms | Chỉ chạy các mốc còn ở tương lai, không tạo countdown mới |
| Flip/outcome/discard | Giữ T26/T28; thêm sound cùng timeline | Một flip chung; WIN/LOSS đúng seat, DRAW không cộng điểm |
| Result | Stamp/score/history enter ≤300ms; winner petals hữu hạn ≤900ms | Nội dung/nút sẵn ngay; không có match DRAW giả; forfeit có reason và cue trung tính |
| Reconnecting | Opacity pulse nhẹ trên trạng thái chờ | RM tĩnh; retry/countdown không phát thêm sound/steal focus |
| Rematch | Paper-slide và Draft mới | BOT xóa phiên cũ; online chỉ khi cả hai đồng ý; không phát thắng cũ |

### Task Plan — T29

Các slice A–K dưới đây đã triển khai; acceptance/verification giữ làm contract.
Các mục native thiếu evidence vẫn mở theo REPORT, không đồng nhất code done với
full acceptance. S/M mô tả từng phần hành vi có thể kiểm chứng.

#### T29-A — Sound pack và chứng minh native module (M; phụ thuộc: không)

- Outcome: có 13 clip nghe được, manifest và module phù hợp SDK trước khi nối gameplay.
- Acceptance: nguồn/duration/size đủ; chọn expo-audio theo SDK đã cài bằng Expo CLI,
  đọc đúng official docs trước API; phát được ui-tap + match-win trên release Android
  bằng pilot nhỏ dùng Home, không xin microphone/background playback hay giữ UI thử.
- Verification: nghe A/B pack trên loa/tai nghe; kiểm metadata/size; Expo Doctor,
  mobile typecheck và release build/install. Nếu module không hợp SDK, ghi lỗi cụ
  thể, điều chỉnh lựa chọn trước T29-C; không đánh dấu audio PASS từ mock.
- Files: mobile/assets/audio/* + README; mobile/package.json; package-lock.json;
  mobile/app.json chỉ khi native config thực sự cần; HomeScreen pilot tạm.
- Skills: vibe-build, source-driven-development. Docs: https://docs.expo.dev/versions/latest/sdk/audio/
  (đối chiếu version SDK57 và kiểu đã cài, không lấy latest khác SDK làm contract).

#### T29-B — Lưu preference âm thanh/rung (S; phụ thuộc: không)

- Acceptance: soundEnabled=true/vibrationEnabled=false mặc định; normalize giá trị
  cũ/sai kiểu an toàn, giữ locale/cosmetics/active session; hydrate/partialize đúng
  và setter lưu được sau relaunch. Không lưu token/hand trong AsyncStorage.
- Verification: unit tests default, dữ liệu cũ/sai, round-trip và set/persist/hydrate.
- Files: mobile/src/store/persistence.ts; app-store.ts; các test tương ứng.
- Skills: vibe-build, vibe-test.

#### T29-C — Runtime chung + welcome Home (M; phụ thuộc: A, B)

- Acceptance: một owner native audio ở RootLayout, finite cue map/players; Home
  chào một lần sau hydrate; sound-off/background dừng ngay cả pending request;
  không replay khi bật lại/resume, không bắt app khác dừng nhạc đang phát.
- Acceptance: gameplay/result ưu tiên hơn tap/tick, một active sound, không backlog;
  load/play/release lỗi không tạo unhandled rejection hoặc chặn action. Rung ngắn
  chỉ khi bật, dùng native Vibration; cleanup players/listeners khi dispose.
- Verification: fake player tests cho mute trong lúc load/seek, overlapping requests,
  audio failure, background/resume, cleanup và remount welcome; nghe native pilot.
- Files: mobile/src/ui/feedback.tsx + test (mới, nếu cần); mobile/app/_layout.tsx;
  HomeScreen.tsx + test. Cue map nằm cùng runtime trước khi có nhu cầu tách thực tế.
- Ownership terminal (dùng ở J): giữ một record in-memory cho match hiện tại gồm
  matchId, cue đã xác thực, thời điểm nhận và consumed/cancelled. Board chỉ ghi
  trước navigation khi nhận transition hợp lệ từ non-terminal → MATCH_RESULT
  của cùng match trong foreground đã sync; initial/recovery/resume snapshot chỉ
  seed, không tạo record. Result với matchId khớp tiêu thụ một lần, đánh dấu trước
  async play; record hết hạn sau 2s từ lúc Board nhận transition thì bỏ, không đợi
  audio tải xong. Không persistence, route token, queue hay event bus.
- Board unmount do sang Result giữ record; Result unmount/leave/cancel, mute,
  background hoặc ad suppression hủy active/pending và record chưa tiêu thụ;
  giữ dấu consumed/cancelled đến hết match để không tái tạo. Đổi match/rematch
  xóa record cũ, vô hiệu async completion cũ; RootLayout dispose xóa toàn bộ.
  Resume/unmute không phục hồi record. Mọi play sau load/seek kiểm lại match,
  hạn dùng, owner còn sống và eligibility; audio lỗi vẫn được coi đã tiêu thụ.
- Ownership ad (wiring ở I): native ad attempt báo suppression trước gọi show,
  runtime cancel active/pending/candidate rồi chặn cue mới. Mute và matchId độc
  lập ad-instance; đổi preference sang ON/new match/AppState active không tự gỡ
  suppression. Ngoại lệ chỉ là explicit recovery từ thao tác switch tại game
  được xác minh theo I; setter soundEnabled=true không phải bằng chứng ad đóng.
- Verification bổ sung: fake clock/player chứng minh record đi qua source
  unmount, consume một lần, expiry2s/cancel/late load và owner dispose; I/J kiểm
  chứng tích hợp route và ad lifetime. Không coi unit mock là native audio PASS.
- Skills: vibe-build, source-driven-development, vibe-test.

#### T29-D — Switch trong Tùy chỉnh (S; phụ thuộc: B, C)

- Acceptance: hai switch Âm thanh/Sound và Rung/Vibration phản ánh/persist đúng;
  tắt sound dừng clip ngay, không tự phát preview khi tắt; thao tác với switch sound
  dùng trạng thái mới, không phát một tiếng tap lọt qua sau mute.
- Acceptance: sheet cuộn được nếu cần; font1.3/vi/en không cắt nút đóng, hit area
  ≥44dp, TalkBack đọc label và checked state; RM không bị đổi theo sound/rung.
- Verification: component tests labels/checked/actions, persistence test B; native
  small/font1.3 toggle, relaunch và TalkBack. Test không đếm implementation calls.
- Files: CustomizeSheet.tsx + test; mobile/src/i18n/{vi.ts,en.ts} + i18n test khi cần.
- Skills: vibe-build, frontend-ui-engineering, vibe-test.

#### T29-E — Phản hồi control dùng chung, thực hiện T23 (M; phụ thuộc: C, D)

- Acceptance: FolkButton/FolkBackButton/card press theo 0.97/120ms; một tap khi
  press được kích hoạt, không phát trên render/press-in bị hủy/disabled. Action
  chạy một lần, không chờ audio/animation; RM giữ phản hồi border/opacity tĩnh.
- Verification: focused control tests cho tap nhanh/cancel/disabled, accessible
  action, callback count; native Home → Rooms → Back → Tùy chỉnh → Chơi BOT.
- Files: FolkButton.tsx; FolkChrome.tsx; FolkCard.tsx; ui/motion.ts; focused tests.
- Skills: vibe-build, frontend-ui-engineering, vibe-test.

#### T29-F — Feedback chọn bài Draft (M; phụ thuộc: E)

- Acceptance: ba lá úp entrance/press nhẹ; mỗi lựa chọn hợp lệ có paper-select;
  placeholder không phản hồi giả. Giữ privacy/vị trí/5s và chuyển Board hiện có;
  auto-pick vẫn hoàn thành, không thêm animation delay để giữ người ở Draft.
- Verification: BOT + hai-seat online tests, unavailable/rapid pick/timeout;
  native ba slot ở320dp/font1.3 và normal/RM, không lộ discarded third card.
- Files: FolkGameViews.tsx + test; DraftScreen.tsx/OnlineDraftScreen.tsx khi wiring cần.
- Skills: vibe-build, frontend-ui-engineering, vibe-test.

#### T29-G — Chọn, thả và đổi bài được chấp nhận (M; phụ thuộc: F)

- Acceptance: paper-select ở lựa chọn/nhấc local; card-lock/rung xác nhận chỉ khi
  owned lock thay đổi được authority chấp nhận. Rejected/stale/invalid drop/busy
  không tạo false success; response/poll cho cùng accepted action không phát đôi.
- Acceptance: T24 selection/drag/custom accessibility action và hit targets giữ
  nguyên; replacement trả lá cũ về tay, không restart 15s/BOT2s, không có tiếng
  phân biệt ROCK/PAPER/SCISSORS trước reveal. Auto-lock chỉ xác nhận một lần.
- Verification: lock/replacement/late-response regression trước-sau, gesture vs
  TalkBack path; physical Android drop/replace/invalid drop. Không suy native PASS
  từ timeout tự chọn bài.
- Files: FolkGameViews.tsx; BoardScreen.tsx; OnlineBoardScreen.tsx; focused tests.
- Skills: vibe-build, frontend-ui-engineering, vibe-test.

#### T29-H — Âm thanh cả bốn lượt theo timeline (M; phụ thuộc: G)

- Acceptance: prepare ba tick tương lai, flip một âm lúc facesVisible đổi sang
  true, WIN/LOSS/DRAW theo viewer, discard paper-slide; countdown chỉ 3/2/1 khi
  active/canLock và screen reader OFF. Không restart/extend authority timeline.
- Acceptance: dedupe theo match/round/stage; initial recovery, skipped stages,
  stale reply, muted/background và forfeit không replay cue. Bỏ clip quá muộn để
  nằm trọn phase; chỉ đánh thức ở mốc sự kiện, không JS/audio call mỗi frame.
- Verification: fake-clock tests cho từng mốc, duplicate/reordered/late snapshot,
  seat A/B inversion, fourth round và rematch. Native BOT bốn lượt có đủ WIN/LOSS/
  DRAW qua các fixture hợp lệ; online two-seat automated rồi native riêng ở L.
- Files: FolkGameViews.tsx + test; game/board-round-presentation.ts + test nếu cần
  bổ sung mốc prepare từ cùng authority timeline. Co-locate feedback hook trước;
  chỉ tách ui/round-feedback.ts nếu logic/test thực sự cần riêng.
- Skills: vibe-build, frontend-ui-engineering, vibe-test.

#### T29-I — Hoàn thiện Home, Rooms, Lobby (M; phụ thuộc: H)

- Acceptance: entrance Home ≤220ms; native navigation giữ nguyên, user route change
  dùng paper-slide hợp lý, không chồng tap+slide. Vào phòng/đối thủ vào/ready có
  confirm và frame highlight một lần theo transition, không mỗi poll/mount.
- Acceptance: create/join/ad gate không nhân đôi; chưa thành công không báo success;
  lỗi có text rõ. Không phát game cue khi ad có thể còn visible; trở lại game
  không replay lịch sử. Provider hiện có timeout4s và settle xóa CLOSED listener;
  gate promise resolve/timeout hoặc AppState active không chứng minh ad đã đóng.
- Contract: nối suppression C trước show; chỉ tự gỡ bằng CLOSED đúng instance
  hoặc failure được xác nhận xảy ra trước display. Show rejection/ERROR sau khi
  show đã bắt đầu mà không chứng minh chưa display được xử lý như chưa rõ đóng.
  Tách settle của promise create/join khỏi cleanup lifetime ad; giữ CLOSED/error
  listener cần thiết qua timeout, cleanup khi closure/failure hợp lệ hoặc recovery
  dưới đây. Không cho attempt mới chồng lên instance chưa rõ đóng; guard callback
  muộn/duplicate/stale instance để ad cũ không gỡ suppression của ad mới.
- Missing CLOSED: timeout vẫn giải phóng create/join theo contract hiện có. Không
  watchdog tự bật âm; khi game đã hiển thị và nhận thao tác trực tiếp trở lại,
  cho phép khôi phục rõ ràng bằng bật Sound trong Tùy chỉnh (nếu switch đang ON,
  tắt rồi bật). Chỉ thao tác này tại game foreground mới retire instance chưa rõ
  đóng và cleanup listener, không tự bật sound preference hay replay cue. Xác
  minh native rằng tương tác đó không thực hiện được khi interstitial còn visible;
  nếu không chứng minh được, giữ audio suppressed và gate T29-I BLOCKED để chốt
  recovery theo API SDK đã cài, không thêm API giả hoặc timeout bật âm thiếu proof.
- Verification: Home/room-entry/lobby regressions, double tap/poll/failed join;
  fake ad displayed >4s với AppState vẫn active, CLOSED sau timeout, pre-display
  failure/show error chưa rõ, missing CLOSED + explicit recovery, mute/new match
  giữa ad, stale callback sau instance mới. Native empty/error/busy/success/
  waiting/ready, RM và cùng ad cases; giữ room-entry idempotency/game rules.
- Files: HomeScreen.tsx; RoomsScreen.tsx; LobbyScreen.tsx;
  mobile/src/ads/interstitial-gate.ts + test; CustomizeSheet.tsx + test cho
  explicit recovery từ thao tác switch thực; runtime C wiring; focused tests.
- Skills: vibe-build, frontend-ui-engineering, vibe-test.

#### T29-J — Kết quả cả trận và Đấu lại (M; phụ thuộc: I)

- Acceptance: Result entrance ≤300ms, thắng có bounded petals ≤900ms và match-win,
  thua match-loss; nút/history hiển thị và dùng ngay. Không replay round4/terminal
  trên poll/remount/resume. Forfeit giữ reason, cue trung tính, không dựng flip giả.
  Board BOT/online ghi trusted transition vào owner C trước replace route;
  Result chỉ tiêu thụ record còn hạn của đúng match, không tự tạo từ snapshot.
  OnlineResult hiện bắt đầu snapshot=null, fetch riêng và chỉ nhận room/session
  qua route: snapshot đầu tại Result được dùng khớp matchId với record, không
  dùng làm bằng chứng freshness. Cold Result/reconnect không có record thì im lặng.
- Acceptance: BOT Đấu lại → dispose session → Draft mới; online đợi cả hai rồi
  Draft mới. Reset cue identity và bỏ mọi request của match cũ; thao tác liên tục
  không dẫn đến âm thắng cũ hoặc double navigation.
- Verification: integration BOT và online Board → Result (source unmount rồi
  Result fetch) phát đúng một terminal cue; poll/remount/cold Result/reconnect
  không phát lại. Background/mute/cancel giữa navigation, fetch chậm vượt2s,
  stale load và đổi match đều bỏ cue cũ; fresh completion của match mới vẫn phát.
  Giữ final transition/forfeit/rematch regressions; full BOT release → Result →
  Draft; native online hai-party ở L. Scroll thấy đủ bốn
  history và nút trên màn nhỏ; RM bỏ scale/stagger/petals nhưng giữ nội dung.
- Files: FolkGameViews.tsx; BoardScreen.tsx/OnlineBoardScreen.tsx;
  ResultScreen.tsx/OnlineResultScreen.tsx; runtime C; focused integration tests.
- Skills: vibe-build, frontend-ui-engineering, vibe-test.

#### T29-K — Feedback mất và nối lại mạng (S; phụ thuộc: J)

- Acceptance: connection-lost một lần khi vào reconnect thật; confirm một lần sau
  reconnect + snapshot hợp lệ. Retry/countdown/expiry không phát lặp. Background
  im lặng; resume seed lại trạng thái; room expired/forfeit không phát round-win.
- Acceptance: opacity pulse hữu hạn theo lifecycle, RM tĩnh; giữ retry/backoff,
  deadline, secure credentials, focus và localized reason hiện có.
- Verification: ReconnectingScreen tests cho retry/expiry/cancel/recovery; audio
  fake failure; native ngắt/nối mạng và Home trong lúc reconnect.
- Files: ReconnectingScreen.tsx + test; FolkGameViews.tsx + test khi cần pulse.
- Skills: vibe-build, frontend-ui-engineering, vibe-test.

#### T29-L — Review và Android acceptance (M; phụ thuộc: A–K)

- Acceptance: mobile tests/typecheck/changed-file ESLint, Expo Doctor và release
  build/install PASS; core/server contract không đổi. Root verify nếu chạy phải
  phân biệt baseline server lint unused guest đã biết với regression mới.
- Acceptance: thực thi MOB-FEEDBACK-001–012, lưu video có audio thực nghe được hoặc
  audio recording đối chiếu timestamps. Screenshot/mocked play call không chứng
  minh tiếng đã phát. Log/evidence không chứa credentials/secret hand.
- Acceptance: release mặc định/320×568dp/360×800dp, vi/en/font1.0/1.3, sound/rung
  switches, RM giữa phiên, TalkBack, interruption và ten rematches. Đo trace/FPS
  trên refresh rate ghi rõ, mục tiêu near60fps ở60Hz; so baseline T28, không khẳng
  định FPS/độ trễ từ screenrecord hoặc cảm nhận. Player/listener/timer không tăng
  theo rematch; một active voice và bundle audio ≤2MB.
- Verification: native BOT + hai Android online đủ bốn lượt/đổi bài/rematch;
  đo/capture audio onset so với action/phase, mục tiêu loaded tap ≤100ms nếu có
  phép đo hợp lệ. Bluetooth/audio focus/ad return/đổi volume không làm game treo.
  Thiếu máy thứ hai/audio capture/trace ghi BLOCKED/PARTIAL, không coi là PASS.
- Files: tasks/test-result.md; tasks/evidence/android/<date>-game-feedback/;
  tasks/todo.md và trạng thái T23/T25/T22/T14 chỉ theo evidence thực tế.
- Skills: vibe-review, vibe-test; performance-optimization; native device runner.

### Phase Checkpoints — T29

| Checkpoint | Sau task | Bằng chứng để qua |
|---|---|---|
| CP29-1 — Âm và cài đặt | A–D | Pack thật, module release nghe được; mute/rung/default/persist/cleanup PASS |
| CP29-2 — Bốn lượt | E–H | Control/drag/privacy/timing regression PASS; BOT bốn lượt sound + RM |
| CP29-3 — Toàn game | I–K | Bảy state, Board → Result once-only, ad >4s/closure/recovery, Đấu lại/reconnect PASS scoped |
| CP29-4 — Android evidence | L | Matrix thực chạy + audio/trace; mọi FAIL/BLOCKED được ghi, không đóng gate thiếu proof |

Đây là các mốc review khi build từng phần; trong vibe-build all là progress
markers. Người dùng đã giao agent triển khai; hiện ở build/review/native evidence.

### Tradeoffs và điểm cần xác nhận bằng thử nghiệm

- Một active sound giữ game dễ nghe; tap/tick có thể bị bỏ khi fanfare đang phát.
  Chỉ thêm channel thứ hai khi native nghe thử cho thấy mất feedback quan trọng.
- Expo Audio ~57.0.5 đã cài theo SDK và chạy release; native audio acceptance
  còn cần tai nghe/audio focus/latency theo REPORT.
  Không tự thêm expo-av/custom native bridge để né một vấn đề chưa được chứng minh.
- ON sound/OFF vibration và 13 clip là mặc định của kế hoạch; có thể chỉnh mức âm/
  timbre sau A/B nghe trên thiết bị mà không thay luật hay tăng surface cài đặt.
- Bluetooth có độ trễ khác loa máy; đo riêng, không kéo chậm gameplay để bù audio.
- Native Vibration chỉ bảo đảm rung cơ bản Android, không giả lập tactile iOS.
  iOS audio session/VoiceOver/performance chưa được nghiệm thu trong đợt Android này.
- T26-F/G và T25/T22/T14 còn mở; T29 evidence đóng góp đúng case, không tự đóng toàn dự án.

`SPEC.md` là hợp đồng sản phẩm. File này chỉ ánh xạ thứ tự, phụ thuộc và
checkpoint. Chi tiết kỹ thuật, file dự kiến, tiêu chí nghiệm thu và lệnh chạy
nằm trong từng tài liệu dưới `tasks/detail-tasks/`; riêng kế hoạch T26 nằm trong
phần [T26 — Nhịp sân đấu và lật bài](#t26-round-flow) bên dưới.

## Skill Intake Summary

### Stack và miền công việc đã phát hiện

- npm workspaces đang hoạt động: `mobile`, `server`, `game-core`; automated
  gameplay/security gates đã xanh, nhưng mobile UI hiện mới là functional shell.
- Mobile: Expo development build, Expo Router, React Native, Zustand,
  AsyncStorage, SecureStore, i18n, Reanimated; drag-to-lock cần thêm
  Gesture Handler thành direct dependency; Skia chỉ theo decision gate.
- Backend: Node.js, Colyseus, authoritative in-memory rooms, typed protocol và
  player-specific private projections.
- Quality: Node test runner cho core/server, Jest cho mobile, Android/iOS device
  evidence, security/privacy, accessibility và 60 fps profiling.

### Skill hiện có được ánh xạ

| Skill | Dùng cho |
|---|---|
| `vibe-build` | Thực thi từng TXX hoặc toàn bộ theo dependency |
| `vibe-test` | TDD cho rules, protocol, store và regression |
| `source-driven-development` | Chốt phiên bản/API chính thức của Expo, Colyseus, Zustand, ads và native modules |
| `frontend-ui-engineering` | Routes, state, UI dân gian, accessibility và responsive portrait |
| `api-and-interface-design` | `game-core` contracts, Colyseus messages, error codes và projections |
| `security-and-hardening` | Guest credential, reconnect, input validation, privacy và log redaction |
| `performance-optimization` | Đo animation/FPS, ảnh lớn và decision gate cho Skia |
| `expo-animation` | Chọn motion tier, Reanimated UI-thread, timing/spring và Reduced Motion cho native Expo |
| `vibe-review` | Review theo checkpoint và trước E2E cuối |
| `vibe-e2e` | Quy trình evidence; native execution dùng runner/device đã được chọn |
| `browser-testing-with-devtools` | Console/warning/screenshot inspection for a web fallback; native device evidence remains the source of truth |
| `vibe-plan` | Tách UI-reference remediation thành các slice có screenshot gate |

### Skill gaps

- Chưa có repo-local skill chuyên tự động hóa React Native trên thiết bị
  (Maestro/Detox). Không chặn MVP vì `tasks/test-plan.md` hỗ trợ chạy tay có
  evidence; chỉ cài/tạo skill khi chọn runner chính thức.
- `responsiveness-check` is available in the shared catalog but is not
  repo-local; consider it only if the manual native viewport matrix becomes too
  slow, not as a planning prerequisite.
- Chưa có visual-diff runner cho native screenshot. T22 dùng `adb` + ảnh đối
  chiếu có checklist trước; chỉ thêm Maestro/Detox hoặc image-diff dependency
  khi manual evidence không còn đủ ổn định.
- Chưa có skill chuyên Colyseus hoặc Google Mobile Ads. Dùng
  `source-driven-development` với tài liệu chính thức; không cài thêm skill chỉ
  để lập kế hoạch.
- Supabase không có task MVP: chỉ kích hoạt khi có account, cross-device sync,
  inventory/purchase, history hoặc durable recovery theo `SPEC.md`.

### Additional intake for this remediation

- `debugging-and-error-recovery` is required first for the reproduced React
  state-update warning and lifecycle cleanup; fix the root cause before visual
  work proceeds.
- `incremental-implementation` governs each screen slice: implement, focused
  test, typecheck/lint, then native screenshot before the next slice.
- `code-review-and-quality` is the final cross-axis review after evidence.

## Task Plan

### Phase A — Foundation and deterministic core

| Task | Kết quả | Phụ thuộc | Chi tiết | Skills chính |
|---|---|---|---|---|
| T01 | npm workspaces, root command contract và Expo development build boot được | — | [T01](detail-tasks/T01-workspace-expo-dev-build.md) | `vibe-build`, `source-driven-development` |
| T02 | Pure `classic_v1` match engine với legal locks, four-round lifecycle và unit tests | T01 | [T02](detail-tasks/T02-game-core-match-engine.md) | `vibe-test`, `api-and-interface-design` |
| T03 | Draft/random boundary, exhaustive 864 cases và 10,000-match simulation | T02 | [T03](detail-tasks/T03-draft-random-verification.md) | `vibe-test`, `security-and-hardening` |

T01 evidence: root `npm run verify` passed; server `/health` passed; Android
development build installed/launched; iOS native prebuild/CocoaPods passed but
simulator execution is blocked until a simulator is booted. T02 evidence:
game-core TDD red/green completed; five core tests pass for all nine matchups,
legal/illegal locks, simultaneous reveal, discard order, and exactly-four-round
`MATCH_RESULT`; T03 evidence adds `864/864` exhaustive and `10000/10000`
deterministic simulations. T04–T06 evidence: 8 mobile suites / 13 tests pass,
typed vi/en preferences and SecureStore boundary are in place, local draft and
15-second round adapters pass fake-clock race/rematch coverage, and Android
development build rebuilt/installed/launched after native module additions. T07
evidence: game-core protocol suite (13 tests), server Colyseus room/projection
suite (9 tests), full `npm run verify`, and live `/health` smoke passed. T08–T10
evidence: mobile room-entry/ad suites (10 tests), server online-room suite with
privacy/four-round/rematch coverage, live create/validate/join smoke, full
`npm run verify`, and Android development build rebuilt/installed/launched with
the official test Ads plugin. iOS runtime remains blocked until a simulator is
booted.
T11 evidence: SecureStore reconnect credential, configurable 20–30s reservation
(25s default), same-seat reconnect/expiry-forfeit tests, bounded retry route, and
`ROOM_EXPIRED` cleanup are implemented; server 17/17 and mobile 25-test suites
pass. T12 evidence: stable boundary validation, 20/s bounded limiter, 256-entry
idempotency eviction, allowlist logger, secret-config checks and audit review pass.
T13 code evidence: safe-area root, accessibility hints/state, reduced-motion
behavior and `SKIA_NOT_NEEDED`; native screen-reader/font-scale/FPS evidence is
blocked. T14 evidence is in `tasks/test-result.md`; Android emulator build/open
PASS, iOS and two-device native cases BLOCKED.

### Phase B — P0 local playable slice

| Task | Kết quả | Phụ thuộc | Chi tiết | Skills chính |
|---|---|---|---|---|
| T04 | Startup hydration, guest identity, vi/en, Zustand preferences và Home customize | T01 | [T04](detail-tasks/T04-mobile-startup-preferences.md) | `frontend-ui-engineering`, `security-and-hardening` |
| T05 | Home → local draft hoàn chỉnh với bot và deadline 5 giây | T03, T04 | [T05](detail-tasks/T05-local-bot-draft.md) | `vibe-test`, `frontend-ui-engineering` |
| T06 | Four-round bot board, symmetric themes, result, rematch/home và 15-second auto-lock | T05 | [T06](detail-tasks/T06-local-bot-board-result.md) | `frontend-ui-engineering`, `performance-optimization` |

### Phase C — P1 private online rooms

| Task | Kết quả | Phụ thuộc | Chi tiết | Skills chính |
|---|---|---|---|---|
| T07 | Typed Colyseus protocol, server room lifecycle, code validation và private projections | T03 | [T07](detail-tasks/T07-colyseus-room-protocol.md) | `api-and-interface-design`, `security-and-hardening` |
| T08 | Rooms/Lobby create-join flow với one-shot interstitial và duplicate guard | T04, T07 | [T08](detail-tasks/T08-rooms-lobby-ads.md) | `frontend-ui-engineering`, `security-and-hardening` |
| T09 | Online sequential draft, separate deadlines, hidden pick và reshuffle/re-index | T08 | [T09](detail-tasks/T09-online-draft-privacy.md) | `vibe-test`, `security-and-hardening` |
| T10 | Authoritative online rounds, reveal, result và two-party rematch | T09 | [T10](detail-tasks/T10-online-rounds-result.md) | `api-and-interface-design`, `frontend-ui-engineering` |
| T11 | Reconnect reservation, snapshot restore, expiry loss và `ROOM_EXPIRED` recovery | T10 | [T11](detail-tasks/T11-reconnect-expiry-restart.md) | `security-and-hardening`, `vibe-test` |

### Phase D — MVP hardening

| Task | Kết quả | Phụ thuộc | Chi tiết | Skills chính |
|---|---|---|---|---|
| T12 | Boundary hardening, rate limits, safe diagnostics và privacy regression suite | T11 | [T12](detail-tasks/T12-security-observability.md) | `security-and-hardening`, `vibe-review` |
| T13 | Android portrait, TalkBack, vi/en fit, reduced motion và measured Skia decision; iOS/VoiceOver deferred | T06, T11 | [T13](detail-tasks/T13-ui-accessibility-performance.md) | `frontend-ui-engineering`, `performance-optimization` |

### Phase E — UI-reference fidelity remediation

`docs/ui/01-home.png`–`07-result.png` và `ui1.png` là visual source. Runtime
state, safe area, vi/en và accessibility từ `SPEC.md` vẫn thắng các sample text,
score hoặc fixed coordinates trong ảnh.

| Task | Kết quả | Phụ thuộc | Chi tiết | Skills chính |
|---|---|---|---|---|
| T13-R | Lifecycle/runtime and shared layout gate: remove React warning, clean subscriptions, safe-area surface, 44dp shared hit targets, and responsive text constraints | T13, T12 | Root-cause fix plus focused mobile regression tests | `debugging-and-error-recovery`, `vibe-test`, `frontend-ui-engineering` |
| T15 | Folk visual foundation và Home khớp `01-home.png` | T13-R | [T15](detail-tasks/T15-folk-foundation-home.md) | `vibe-build`, `frontend-ui-engineering`, `performance-optimization` |
| T16 | Rooms khớp `02-rooms.png` với đủ empty/current/error/busy states | T15 | [T16](detail-tasks/T16-rooms-visual-fidelity.md) | `vibe-build`, `frontend-ui-engineering`, `vibe-test` |
| T17 | Lobby khớp `03-lobby.png`, giữ privacy và live player state | T15, T16 | [T17](detail-tasks/T17-lobby-visual-fidelity.md) | `vibe-build`, `frontend-ui-engineering`, `vibe-test` |
| T18 | Local/online Draft luôn giữ ba facedown slots, chỉ authoritative positions được chọn | T15 | [T18](detail-tasks/T18-draft-visual-fidelity.md) | `vibe-build`, `frontend-ui-engineering`, `vibe-test` |
| T19 | Local/online Board dựng đúng vertical arena, score plaques, discard rail, runtime hand và player drop placeholder | T18 | [T19](detail-tasks/T19-board-visual-fidelity.md) | `vibe-build`, `frontend-ui-engineering`, `performance-optimization` |
| T24-A | Core/server cho phép thay private active lock trước reveal, giữ deadline và protocol shape | T12, T19 | [T24-A](detail-tasks/T24-A-replaceable-lock-contract.md) | `vibe-build`, `vibe-test`, `api-and-interface-design`, `security-and-hardening` |
| T24-B | Local bot mở cửa sổ thay lá 2 giây, không reset deadline và không leak timer | T24-A | [T24-B](detail-tasks/T24-B-local-replace-window.md) | `vibe-build`, `vibe-test`, `test-driven-development` |
| T24-C | Cài Gesture Handler trực tiếp, bọc root và rebuild Android client | T19 | [T24-C](detail-tasks/T24-C-gesture-runtime.md) | `vibe-build`, `expo-animation`, `source-driven-development` |
| T24 | Board drag selected card vào placeholder để lock/thay thế; bỏ visible Lock button | T24-A, T24-B, T24-C | [T24](detail-tasks/T24-gameplay-motion.md) | `vibe-build`, `expo-animation`, `frontend-ui-engineering`, `performance-optimization`, `vibe-test` |
| T20 | Reconnecting overlay khớp `06-reconnecting.png` trên board state | T24 | [T20](detail-tasks/T20-reconnecting-visual-fidelity.md) | `vibe-build`, `frontend-ui-engineering`, `vibe-test` |
| T21 | Local/online Result khớp `07-result.png`, dùng lịch sử runtime | T24 | [T21](detail-tasks/T21-result-visual-fidelity.md) | `vibe-build`, `frontend-ui-engineering`, `vibe-test` |
| T23 | Shared press/selection feedback cho button, card và Back | T15–T21 | [T23](detail-tasks/T23-shared-motion-feedback.md) | `vibe-build`, `expo-animation`, `frontend-ui-engineering`, `vibe-test` |
| T25 | Result/Reconnecting motion, Reduced Motion và Android profile gate | T23, T24 | [T25](detail-tasks/T25-motion-accessibility-performance.md) | `vibe-build`, `expo-animation`, `performance-optimization`, `vibe-e2e` |
| T22 | Android screenshot, TalkBack, vi/en, small-screen, motion và asset/FPS evidence; iOS matrix deferred | T16–T25, T26 | [T22](detail-tasks/T22-ui-visual-evidence.md) | `vibe-e2e`, `performance-optimization`, `vibe-review` |

### Phase F — Final native evidence

Run the Android subset now. Keep T14 open after the Android milestone because
the deferred iOS cases are still part of the full cross-platform gate.

| Task | Kết quả | Phụ thuộc | Chi tiết | Skills chính |
|---|---|---|---|---|
| T14 | Full verify và native-device E2E evidence cho P0/P1 | T12, T13, T22 | [T14](detail-tasks/T14-native-e2e-final-gate.md) | `vibe-e2e`, `vibe-review` |

## Phase Checkpoints

### Checkpoint A — after T01–T03

- Root `npm run verify` chạy được và deterministic core suite xanh.
- 864 exhaustive cases và 10,000-match simulation chứng minh không có tied
  final match hoặc invalid terminal state.
- Interactive mode: review trước T04. `$vibe-build all`: ghi evidence rồi tiếp tục.

### Checkpoint B — after T04–T06

- Android và iOS development build hoàn tất bot draft/four-round/result flow.
- Locale/loadout hydrate đúng; không có credential trong AsyncStorage.
- Interactive mode: review P0 trước T07. `$vibe-build all`: tiếp tục P1.

### Checkpoint C — after T07–T11

- Hai simulated clients vượt integration suite về capacity, idempotency,
  privacy, timeout và reconnect.
- Automated clients có thể create/join/draft/play/result/reconnect; server vẫn
  authoritative. Hai thiết bị thật chưa có trong môi trường này.
- Interactive mode: review P1 trước hardening. `$vibe-build all`: tiếp tục.

### Checkpoint D — after T12–T13

- Security/behavior regression suite xanh trước khi đổi visual layer.
- Functional UI contract, accessibility baseline và Skia decision được giữ.

### Checkpoint E0 — after T13-R

- Cold launch and every route no longer emit the reproduced React state-update
  warning or subscription cleanup warning.
- `FolkSurface` respects safe areas; shared controls meet 44 dp; vi/en text
  remains usable at the 320×568/font-scale 1.3 regression matrix.
- `npm run verify`, mobile typecheck/lint, and focused lifecycle/layout tests are
  green before any reference-composition work.
- Interactive mode: review the root-cause fix before T15. `$vibe-build all`:
  continue only when this gate is green.

Evidence 2026-08-19: removed the duplicate root `SafeAreaView` so the shared
`FolkSurface` is the single inset owner and now declares all four edges
explicitly. Mobile regression gate is green (17 suites / 36 tests), mobile
typecheck and lint pass, and `git diff --check` passes. Existing Android
logcat evidence has no state-update-before-mount warning on visited routes;
fresh Samsung cold launch is deferred to T24-C.

### Checkpoint E1 — after T15–T17

- Home → Rooms → Lobby khớp composition của ba reference tương ứng trên Android.
- Create/join/current-room/error/busy/player-count flows không bị visual refactor làm hỏng.
- Interactive mode: review navigation shell trước gameplay screens.

### Checkpoint E2 — after T18, T19, T24-A, T24-B, T24-C and T24

- Draft local/online luôn giữ ba visual slots mà không đổi authoritative two-pick
  rules; Board có centered score plaques, opponent discard rail, vertical
  opponent-slot/VS/player-slot arena, runtime 4 → 3 → 2 → 1 hand và timer.
- Visible Lock button đã được thay atomically bằng drag selected card vào lower
  placeholder; miss/cancel/timeout/phase-change không gửi mutation.
- Trước authoritative reveal, drag lá unused khác thay active lock, đưa lá cũ về
  hand và giữ nguyên deadline; opponent chỉ thấy trạng thái locked, không thấy lá.
- `npm run verify`, small-screen layout test, drag regression và Android
  screenshot comparison trên Samsung `SM-X210` xanh.
- Interactive mode: review core gameplay fidelity trước overlay/result.

### Checkpoint E3 — after T20–T25 and T22

- Bảy screen reference có Android vi/en screenshots và explicit PASS/FAIL/BLOCKED record.
- Shared controls phản hồi trong tối đa 150ms; draft/board/reveal/result motion
  chỉ dùng transform/opacity trên UI thread và không thay đổi gameplay timing.
- Draft evidence có đủ ba facedown slots ở first/second/waiting/timeout states;
  Board evidence có valid/invalid/cancelled/timeout drag và không còn Lock button.
- TalkBack, font scale, reduced motion, asset memory và Android FPS evidence được ghi,
  gồm profile run trên Samsung `SM-X210` hoặc thiết bị Android chậm hơn.
- iOS/VoiceOver evidence is deferred and does not block this Android checkpoint.

### Checkpoint F — after T14

- `npm run verify` xanh trên đúng source state được test.
- Tất cả case trong `tasks/test-plan.md` là PASS hoặc có FAIL/BLOCKED evidence
  trong `tasks/test-result.md`.
- Chạy `$vibe-review`; không tự commit hoặc triển khai production.
- Current status: automated gate PASS; Expo Doctor PASS after SDK 57 patch
  alignment; Android local timeout path PASS; Android create-ad/Lobby and
  API-assisted two-seat online smoke PARTIAL; emulator Join UI and full
  four-round two-client Android evidence PASS. Small-screen/font-scale matrix is
  FAIL on Android and must be fixed before the Android milestone. TalkBack, FPS,
  and Reconnecting still remain. iOS is deferred.

## Task-level implementation contracts

Each remediation task is one vertical slice. It may touch its listed screen,
shared presentation primitive, one focused test, and required asset/i18n entries;
it must not alter game-core rules or room protocols except the explicitly scoped
T24-A replaceable-lock contract. Every task closes with its automated checks,
its matching test cases, and a sanitized test-result entry.

### T13-R — root lifecycle/shared layout

- Acceptance: no render-time state/store writes; all subscriptions and timers
  clean up; async busy/error paths recover; safe-area and 44 dp contracts hold.
- Verify: failing regression test first, then `npm run verify`, Expo Doctor, and
  cold Android launch through all seven routes with warning logs captured.
- Likely files: `BoardScreen.tsx`, `DraftScreen.tsx`, `RoomsScreen.tsx`,
  `Online*Screen.tsx`, `FolkSurface.tsx`, and focused mobile tests.

### T15–T21 — screen slices

- Acceptance and file ownership remain in each linked detail task. Keep local
  and online adapters separate from shared presentation; runtime data wins over
  sample mockup text.
- Verify each slice with its linked `MOB-VIS` case, vi/en screenshots, focused
  Jest tests, typecheck/lint, and no new runtime warnings.

### T24-A/T24-B/T24-C/T24 — replaceable drag-to-lock slices

- T24-A acceptance: core/server upsert one active lock in `ROUND_SELECTION`, add
  private `lockedCardId`, preserve deadline/idempotency/privacy and reject stale
  replacement after reveal. Likely files: `game-core/src/match.ts`, its test,
  `game-core/src/protocol.ts`, `server/src/rooms/online-room.ts`, its test. Verify
  focused core/server suites, then `npm run verify`.
- T24-B acceptance: local bot waits one fixed 2,000ms window after the first
  player lock; replacement does not restart either timer; timeout/rematch/dispose
  clears and resolves once. Likely files: local match adapter and its fake-clock
  test. Verify focused mobile adapter tests and mobile typecheck.
- T24-C acceptance: direct Expo-compatible Gesture Handler dependency, outer root
  wrapper, unchanged safe-area/router behavior and successful Samsung `SM-X210`
  cold launch. Likely files: `mobile/package.json`, root lockfile and `_layout.tsx`.
  Verify mobile typecheck/lint, Expo Doctor and Android development build.
- T24 acceptance: selected/remaining unused cards share one measured UI-thread
  drag path; valid initial/replacement commits once, old card returns to hand,
  invalid/stale cases reconcile, and TalkBack/Reduced Motion reach the same state.
  Likely files: `FolkGameViews.tsx` plus test, local Board screen and online Board
  screen. Verify focused Jest, `npm run verify`, `MOB-MOTION-002` and
  `MOB-DRAG-001` on Samsung `SM-X210`.

T24-A and T24-C are independent after T19; T24-B waits for T24-A, and T24 waits
for all three. Interactive execution still completes one task at a time.

### T23/T25 — remaining motion slices

- T23 extends the existing `FolkButton`, `FolkCard`, `FolkBackButton` and motion
  helper; press feedback is `scale: 0.97` with a 120ms ease-out ceiling and no
  new dependency.
- T25 adds restrained rare/state motion for Result and Reconnecting, then proves
  Reduced Motion equivalence and Android frame stability before T22.
- Verify with focused Jest tests, `npm run verify`, `MOB-MOTION-001..003`, and a
  real Android profile/release build. Dev-build feel is observation only, not FPS evidence.

### T22/T14 — evidence gates

- T22 is evidence-only after T15–T25 and T26: update test plan/results, screenshots,
  font-scale/safe-area/reduced-motion/accessibility/FPS records, and asset budget.
- T14 is final; two-client Reconnecting and unavailable iOS remain BLOCKED unless
  the required devices/runtime are actually available.

## Tradeoffs and Deferred Decisions

- Local-first MVP tránh Supabase và durable room persistence; server restart làm
  room hết hạn theo contract.
- `View`/`ImageBackground`/Reanimated là mặc định. Chỉ thêm Skia sau số đo trong
  T13 chứng minh một acceptance case cụ thể không đạt.
- Chỉ thêm `react-native-gesture-handler` trực tiếp vì drag-to-lock cần gesture
  UI-thread và root wrapper. Không thêm loop parallax/ambient nền, Lottie,
  haptics, Skia hoặc custom JS screen transitions; mở rộng chỉ khi device
  evidence chứng minh nhu cầu.
- Local bot dùng fixed 2,000ms think window để replacement có thể được thao tác và
  test deterministic. Chỉ nâng thành setting nếu device evidence cho thấy nhịp
  này quá ngắn/dài; không tạo config trước nhu cầu.
- Dùng các layer trong `docs/assets` làm nguồn; chỉ copy/resize asset thực sự được
  mount vào `mobile/src/assets/folk_default`. Không dùng nguyên mockup full-screen
  vì text/runtime state phải native và hai board halves thuộc từng player.
- Không thêm component library hoặc generic theme engine. Chỉ extract một visual
  primitive khi đã có ít nhất hai màn hình dùng cùng geometry.
- Native E2E runner chưa được chọn. T14 dùng manual device protocol trước; việc
  thêm Maestro/Detox là quyết định riêng vì làm tăng native/CI scope.
- EAS distribution, production ads, monitoring, privacy paperwork và release
  signing vẫn thuộc P2.


### 2026-10-06 — scoped UI repair after card refresh

Completed UI-01–UI-12 from the Android report: bounded bitmaps, separate decorative/content padding, viewport sizing, code hint, keyboard/scroll access, and screen proportions. No gameplay/API changes or dependencies. Evidence and native limits: [REPORT](evidence/android/2026-10-06-ui-fixes/REPORT.md). Broader T21/T22/T14 acceptance remains open.

<a id="t26-round-flow"></a>

## T26 — Nhịp sân đấu và lật bài hai bên

Ngày kế hoạch: 2026-10-06. **A–F đã triển khai; evidence 06–07/10/2026, native acceptance còn PARTIAL/BLOCKED.**
Phạm vi: kiểm tra sân đấu và thiết kế trọn luồng chọn → chốt → chờ → chuẩn bị
→ lật đồng thời → thắng/thua/hòa → thu bài → lượt tiếp theo/kết quả trận.
Giữ bộ ảnh dễ thương không khuôn mặt, luật bốn lượt và thao tác drag-to-lock.

### Kết quả kiểm tra trước triển khai (06/10/2026)

| Nguồn đã đọc | Khoảng trống cần xử lý |
|---|---|
| `mobile/src/game/local-match-adapter.ts`, `resolveIfReady` | Resolve rồi `beginNextRound` ngay trong cùng lần gọi; các emit trung gian không tạo được khoảng trình diễn ổn định. |
| `server/src/rooms/online-room.ts`, `applyLock`, `resolveRound` | Chốt đủ hai bên cũng resolve rồi sang lượt kế ngay; online không giữ pha chuẩn bị/kết quả để client quan sát. |
| `game-core/src/match.ts`, `resolveLockedRound` | Đã có outcome WIN/LOSS/DRAW và tính điểm đúng tầng; lượt 4 đi thẳng `MATCH_RESULT`, cần giữ kết quả lượt trước khi kết thúc trận. |
| `game-core/src/protocol.ts`, `buildProjection` | Có `lastRound` nhưng chưa public outcome và mốc trình diễn; không có revision để phân biệt snapshot cũ. Retry đang trả projection đã cache. |
| `BoardScreen.tsx`, `OnlineBoardScreen.tsx` | Điều hướng Result ngay khi gặp `MATCH_RESULT`. Online dùng HTTP polling 500ms; poll và action có thể trả khác thứ tự. |
| `FolkGameViews.tsx`, `FolkBoardView` | Chỉ dựa vào `canLock/lastRound` để hiện mặt bài; chưa có nhịp lật, trạng thái đối thủ đã chốt, thông báo kết quả lượt. Timer vẫn render khi không có deadline. |

Đã xem lại [ảnh sân đấu Android trước kế hoạch](evidence/android/2026-10-06-ui-fixes/04-board.png):
hai ô trên–dưới và vùng VS là nền bố cục phù hợp. Ảnh tĩnh không chứng minh
motion; lần này không chạy lại app/thiết bị. SPEC liên quan: Board rules,
State Machine, authoritative projection, privacy và motion acceptance.

### Luồng và nhịp đề xuất

“Chốt” tiếp tục là **thả lá bài hợp lệ vào ô của mình**, không thêm nút xác nhận.

| Bước | Trình bày trên sân đấu | Điều kiện / nhịp |
|---|---|---|
| 1. Chọn | Lá được nâng nhẹ, viền chọn rõ; hướng dẫn “Kéo bài vào ô để chốt”. | Còn bài hợp lệ và đang `ROUND_SELECTION`. |
| 2. Chốt / chờ | Bài vào ô của mình; “Đã chốt · Chờ đối thủ”. Nếu đối thủ chốt trước, ô trên hiện lưng bài và “Đối thủ đã chốt”. | Chỉ xác nhận sau khi authority nhận lock. Được đổi bài trong selection; giữ deadline 15s và BOT 2s từ lần chốt đầu. |
| 3. Chuẩn bị lật | Hai ô hiện lưng bài cùng kích thước, viền sáng nhẹ; “Cả hai đã chốt · Chuẩn bị lật bài”. Bài của mình vẫn có nhãn riêng để biết lá đã chọn. | Khi authority nhận đủ hai lock, dừng đổi/kéo bài và ẩn timer chọn bài. Giữ khoảng **800ms**. |
| 4. Lật đồng thời | Hai lá dùng chung tiến độ xoay Y với perspective, đổi mặt ở giữa vòng xoay; mặt chữ/ảnh luôn thẳng. | **600ms**, chỉ bắt đầu khi có dữ liệu reveal hợp lệ. Không mở lần lượt trên/dưới. |
| 5. Kết quả lượt | Banner “Bạn thắng lượt này” / “Bạn thua lượt này” / “Hòa lượt này”; nhấn nhẹ lá thắng và điểm +1; hòa không cộng điểm. | **1.200ms**, chỉ hiện sau khi hai mặt bài đã mở. Hiển thị outcome từ authority theo seat người xem. |
| 6. Thu bài | Hai lá về đúng chồng bài đã ra; giữ thứ tự lượt, không tạo bản sao tạm trong chồng. | **300ms**. Sau đó bắt đầu lượt mới hoặc Result nếu đã đủ bốn lượt. |

Tổng đề xuất từ đủ hai lock đến lượt tiếp theo: **2.900ms**. Đây là giá trị
khởi đầu để đo trên Android, không thêm setting cho người dùng. Reduced Motion
thay xoay/nảy/bay bằng đổi trạng thái hoặc fade nhẹ nhưng giữ thời gian đọc và
cùng thời điểm authority mở lượt mới. Không thêm khuôn mặt, confetti, âm thanh
hoặc haptics trong phạm vi này.

### Bố cục và phản hồi

- Giữ arena dọc, cùng kích thước/đường giữa cho hai slot. Dành vùng thông báo
  cố định cạnh VS; chuyển chữ không đẩy slot, hand, score hoặc vùng drop.
- Badge “đã chốt” chỉ nói trạng thái, không lộ loại/ID bài đối thủ. Số lưng bài
  còn trên tay phải trừ lá đã đặt vào slot, không vẽ dư một lá; `cardCount` hiện
  là tổng bài chưa dùng nên điều chỉnh ở view, không đổi nghĩa API.
- Mặt bài của mình có thể xem trong lúc chờ; chuyển sang lưng bài ở bước chuẩn
  bị để hai lá cùng mở. Nhãn riêng của mình vẫn đúng; accessibility tree của
  đối thủ không chứa mặt/loại bài trước reveal.
- WIN/LOSS/DRAW có chữ và biểu tượng đơn giản, không chỉ dựa màu. Điểm chỉ đổi
  trên UI ở bước kết quả, dù authority đã tính tại reveal. Giữ snapshot hiển
  thị trước reveal để không mất lá hoặc nhảy điểm trước khi lật xong.
- Kiểm tra 320×568dp, 360×800dp và máy Android đang kết nối, vi/en, font 1.0/1.3,
  hand 4→3→2→1; không cắt bóng/viền khi xoay, banner không che bài/điểm.

### Quyết định về trạng thái và đồng bộ

1. **Tái dùng state machine hiện có.** `ROUND_SELECTION` cho chọn/chờ;
   `ROUND_REVEAL` giữ khoảng chuẩn bị đã khóa; `ROUND_RESULT` giữ lật/kết quả/thu
   bài. Không thêm ba phase public chỉ để mô tả animation.
2. **Lượt 4 đi qua cùng pipeline.** Đề xuất `resolveLockedRound` luôn dừng ở
   `ROUND_RESULT`; bước advance hiện có mở lượt 2–4 hoặc chuyển `MATCH_RESULT`
   sau thời gian trình diễn lượt 4. Tính thắng trận theo luật hiện có. Rà tất
   cả caller và simulation khi đổi contract này; không giữ hai cách kết thúc.
3. **Authority giữ lịch.** Local adapter/server sở hữu timer chuẩn bị và kết
   quả, dùng clock/timer inject hiện có. Dừng timer chọn/BOT khi đủ lock; resolve
   đúng một lần ở mốc reveal; chỉ cấp 15s mới khi thực sự mở lượt tiếp theo.
   Callback animation không tính điểm, không gửi “reveal done”, không quyết
   định pha và không giữ server chờ thiết bị.
4. **Payload đủ để bắt kịp.** Bổ sung typed metadata tối thiểu: định danh trận
   (đổi khi rematch), revision tăng theo thay đổi authoritative, `serverNow`,
   timeline lượt `{ round, revealAt, completeAt }`, và `lastRound.outcomeForA`.
   Giữ timeline và lastRound vừa xong qua lượt tiếp theo; đối chiếu round trước
   khi dùng để tránh ghép bài lượt cũ vào lượt đang chuẩn bị. `deadlineAt` vẫn
   chỉ là deadline chọn bài, không dùng làm timer animation trên UI.
5. **Không tiết lộ sớm.** Trước revealAt: projection chỉ có lock flags/own card,
   score/discards cũ; không gửi bài đối thủ, outcome hoặc điểm mới để client tự
   giấu. Tại reveal mới resolve và public đủ hai lá cùng outcome. Local Board
   áp dụng cùng quy tắc dù adapter local đang giữ cả hai hand.
6. **Một đường nhận snapshot.** Poll, action response, retry/reconnect đều đi
   qua kiểm tra revision; bỏ snapshot cũ, không phát lại hiệu ứng cùng
   `(matchId, round)`. Revision phải tăng xuyên rematch trong room; `serverNow`
   là thời gian response mới, không được lấy mốc cache cũ để hiệu chỉnh đồng hồ.
   Giữ idempotency của action, không resolve lại khi retry.
7. **Mạng chậm và background.** Dùng server time/ước lượng offset từ request để
   tìm tiến độ hiện tại; không dùng giờ điện thoại trực tiếp. Thiếu payload
   reveal thì giữ lưng bài. Snapshot tới muộn bắt kịp phần còn lại; nếu hết
   timeline thì hiện trạng thái mới và tóm tắt kết quả đã biết, không phát lại
   toàn bộ 2.9s làm mất thời gian chọn của lượt mới. App resume lấy snapshot mới
   trước khi mở tương tác. Hai lá đồng thời trên mỗi màn hình; không hứa cùng
   một frame giữa hai điện thoại qua HTTP. Đo lệch giữa thiết bị trong E2E.
8. **Kết thúc bất thường.** Leave/forfeit, room hết hạn, dispose/rematch phải hủy
   timer/animation cũ. Forfeit đi nhánh kết quả phù hợp, không dựng giả một lượt
   reveal từ lastRound cũ. Reconnect vào trận đã kết thúc hiển thị Result; không
   chờ callback animation đã bị unmount.

Giữ HTTP polling 500ms hiện có cho slice này; metadata bền qua nhiều snapshot
giúp chịu được việc bỏ lỡ pha ngắn. Chưa đổi sang WebSocket hoặc thêm thư viện.
Server/mobile phải nâng contract cùng đợt thử nghiệm; client gặp payload cũ thì
hiện trạng thái tĩnh an toàn, không tự đoán hai bên đã chốt hay đối thủ ra bài gì.

### Skill Intake Summary — T26

Đã đọc frontmatter skill repo. Stack đã xác minh: Expo 57, React Native 0.86,
Reanimated 4.5.1, Gesture Handler 2.32, core TypeScript, server Node/Colyseus;
client Board thực tế dùng HTTP. Dùng `vibe-plan`, `planning-and-task-breakdown`,
`frontend-ui-engineering` và `api-and-interface-design` cho kế hoạch này.
Khi build: thêm `vibe-build`, `vibe-test`; dùng `security-and-hardening` khi sửa
projection, `performance-optimization` cho số đo native. Chưa có skill native
E2E riêng; manual Android + quay video đáp ứng bằng chứng cho phạm vi này,
không cài Maestro/Detox hoặc skill mới chỉ để lập plan.

### Task Plan — T26

Thứ tự: **T26-A → T26-B → T26-C → T26-D → T26-E → T26-F → T26-G**.
T26 dựa trên T19/T24 đã triển khai; bổ sung phần reveal cho T25 và là dependency
mới của T22/T14. Không mở lại checkbox T24 hoặc tự đóng các gate evidence cũ.

| Task / phụ thuộc | Công việc và acceptance | File dự kiến / cỡ việc | Verification / skill triển khai |
|---|---|---|---|
| **T26-A — Contract vòng chơi**; sau T24 | Chốt SPEC/timing/projection; cả bốn lượt đều qua `ROUND_RESULT`; advance chỉ mở lượt mới/kết thúc sau result, rules/điểm không đổi. Trace tất cả caller của resolve/advance. | `SPEC.md`; `game-core/src/{match.ts,protocol.ts,match.test.ts,simulation.test.ts}`; M | Core fake-state test cho 1–4, WIN/LOSS/DRAW, invalid transition; exhaustive simulation. `api-and-interface-design`, `vibe-test`. |
| **T26-B — BOT có đủ từng nhịp**; sau A | Adapter emit và giữ chuẩn bị/result có timeline; Board hiện từng trạng thái bằng UI tĩnh trước, không nhảy Result sớm; chốt/đổi/timeout vẫn đúng 15s/2s. | `mobile/src/game/local-match-adapter{.ts,.test.ts}`, `screens/BoardScreen.tsx`, `components/FolkGameViews{.tsx,.test.tsx}`; M | Fake clock đi qua toàn bộ timeline, lượt cuối, rematch/dispose; component không nhận mặt đối thủ sớm. `vibe-build`, `frontend-ui-engineering`, `vibe-test`. |
| **T26-C — Online authority giữ pha**; sau B | Server lịch/timeline tương đương BOT; private projection trước reveal, outcome sau reveal; revision/match identity, cached retry, timeout/forfeit không nhân đôi resolve. | `server/src/rooms/online-room.ts`, `server/src/online-room.test.ts`, `game-core/src/protocol.test.ts`; M | Fake-clock integration hai seat: second lock/replacement/deadline race, stale retry, privacy, final round và cleanup. `api-and-interface-design`, `security-and-hardening`, `vibe-test`. |
| **T26-D — Online Board theo timeline**; sau C | Poll/action dùng chung bộ nhận revision; map A/B đúng; tạo phần trình bày timeline dùng chung hai Board, không duplicate logic; khóa input theo authority. | `screens/{OnlineBoardScreen.tsx,BoardScreen.tsx}`, `game/board-round-presentation{.ts,.test.ts}` (mới, phục vụ cả hai screen), `screens/OnlineBoardScreen.test.tsx` (mới nếu chưa có); M | Snapshot trùng/đảo thứ tự/nhảy pha/rematch; không lấy outcome cũ, không mất lượt 4; fake clock và screen tests. `frontend-ui-engineering`, `vibe-test`. |
| **T26-E — Lật hai lá và feedback**; sau D | Dùng một shared progress Reanimated cho hai lá; chuẩn bị/flip/banner/thu bài đúng timeline, điểm không bật sớm; vi/en và Reduced Motion giữ cùng thông tin. | `components/FolkGameViews{.tsx,.test.tsx}`, `i18n/{vi.ts,en.ts}`, `game/board-round-presentation.ts`; M | Component assertions cho hidden faces/score/discards/labels; preview native ghi video happy path BOT và online. `frontend-ui-engineering`, `vibe-test`. |
| **T26-F — Resume/reconnect và tương tác hỗ trợ**; sau E | App resume đồng bộ trước thao tác, cleanup khi unmount; forfeit/kết thúc không replay sai; TalkBack thông báo kết quả một lần, reduced motion đổi giữa animation không kẹt. | `screens/{BoardScreen.tsx,OnlineBoardScreen.tsx,ReconnectingScreen.tsx}`, `game/board-round-presentation{.ts,.test.ts}`; M | Fake-clock background/reconnect giữa từng bước; native bật TalkBack/Reduced Motion, thay font và tái đo slot. `frontend-ui-engineering`, `vibe-test`. |
| **T26-G — Evidence Android**; sau F | Chạy case `MOB-REVEAL-001..008`, chốt geometry/timing bằng video; ghi rõ PASS/FAIL/BLOCKED, không dùng Jest để xác nhận FPS. | `tasks/test-result.md`, `tasks/evidence/android/<date>-round-reveal/`, `tasks/todo.md`; S | Hai Android online + BOT, vi/en/nhỏ/font1.3/TalkBack/reduced motion; profile/release FPS. `performance-optimization`, `vibe-e2e` theo native evidence protocol. |

Lệnh nền cho đợt build/đánh giá (chưa chạy ở lượt lập plan):
`rtk npm run test --workspace game-core`, `rtk npm run test --workspace server`,
`rtk npm run test --workspace mobile -- --runTestsByPath src/game/local-match-adapter.test.ts src/components/FolkGameViews.test.tsx`.
Sau khi có test mới, chạy thêm đúng file đó; cuối chuỗi chạy `rtk npm run verify`
và `rtk git diff --check`. Ghi riêng lỗi baseline với regression do T26.

### Phase Checkpoints — T26

- **CP26-1, sau A–B:** contract và BOT hiển thị đủ pha bằng fake clock/UI tĩnh;
  điểm/luật không đổi. Chốt trước khi gắn online.
- **CP26-2, sau C–D:** hai seat nhận đủ trạng thái; privacy/revision/race/final
  round PASS; không để animation che lỗi authority.
- **CP26-3, sau E–F:** complete flow có animation; Android video chứng minh hai
  lá cùng lật, nhãn kết quả rõ, không lẹm/lệch, accessibility không bị bỏ qua.
- **CP26-4, sau G:** cập nhật evidence cho T25/T22/T14 theo case thực sự đã chạy.
  Hai máy chưa có thì ghi BLOCKED; iOS vẫn deferred, không coi là PASS.

Checkpoint là điểm review khi build từng task, là mốc tiến độ nếu người dùng
yêu cầu triển khai toàn bộ. Kế hoạch này không tự cấp trạng thái hoàn tất.

### Tradeoffs / điểm cần chốt khi nghiệm thu

- Nhịp 2.9s tăng thời gian mỗi lượt để nhìn rõ kết quả. Chỉ chỉnh các duration
  sau video thực tế; không thay quy tắc chốt hay thời gian chọn bài.
- Giữ polling giúp giới hạn phạm vi; mạng trễ có thể bỏ bớt animation để bắt
  kịp. Nếu yêu cầu hai thiết bị gần cùng frame, đó là scope transport riêng.
- Thay core final-round transition là thay contract có chủ đích, nên simulation
  và tất cả caller phải được cập nhật cùng slice; không vá bằng delay router.
- Không có câu hỏi chặn lập kế hoạch. Mặc định “chốt” là drag-to-lock hiện tại,
  “hai bên” là hai slot trên cùng sân đấu và kết quả phản chiếu theo người xem.


### T26 — Execution record (2026-10-06; follow-up 2026-10-07)

Source hiện tại đã chứa implementation tại HEAD `b1c3400`; lượt follow-up 07/10
chỉ bổ sung/sửa nhãn evidence và ledger, không sửa product code hoặc tạo commit.
[REPORT](evidence/android/2026-10-06-round-reveal/REPORT.md) là nguồn trạng thái chi tiết.

| Task/checkpoint | Trạng thái thực tế |
|---|---|
| A/B, CP26-1 | PASS automated: core contract, local authority pipeline/timer cleanup; BOT video đủ bốn lượt. |
| C/D, CP26-2 | PASS automated: hai-seat privacy/revision/idempotency/final round; poll/action/resume ingress và lifecycle ownership. Native chỉ một Android + scripted peer, không phải hai thiết bị. |
| E | Implemented; video debug BOT/online và release BOT nhỏ có các pha và outcome. Hai slot cùng tiến độ; score header ba cột bằng nhau. |
| F, CP26-3 | Implemented; lifecycle unit tests và một native online round3-selection resume smoke. Reduced Motion release smoke có; TalkBack enabled/tree spot-check có, nhưng accessible lock/once-only speech và full reconnect/toggle matrix chưa được xác nhận. Giữ checkpoint mở. |
| G, CP26-4 | Evidence/report executed, matrix PARTIAL; hai Android BLOCKED, performance stress và full a11y/geometry còn mở. T25/T22/T14 không đóng. |

Final verification 07/10: core 13/server 27/mobile 56 tests (23 mobile suites)
PASS; whole typecheck PASS, mobile lint PASS, server build PASS, diff --check PASS.
`verify` dừng tại baseline server lint `room-entry.test.ts:37` unused `guest`;
không có regression test/typecheck được quan sát và không sửa baseline ngoài scope.
Root independently reran four impacted mobile suites (17 tests) + whole typecheck PASS.

Minimal deviations: metadata timeline/matchId/revision/serverNow additive optional
để payload cũ rơi về trình bày tĩnh an toàn; `lastRound.outcomeForA` là contract reveal.
ReconnectingScreen giữ nguyên vì routing đã xử lý các pha này. Retry lưu fingerprint
rồi trả projection mới, không giữ timestamp/projection cache cũ. Timing giữ nguyên
800/600/1200/300ms; fake clocks xác minh authority, video không được dùng làm chuẩn
FPS hoặc khẳng định chính xác từng frame giữa hai thiết bị.

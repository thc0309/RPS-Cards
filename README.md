# Bao–Búa–Kéo (RPS Cards)

MVP game mobile tiếng Việt/tiếng Anh với chế độ chơi bot và phòng riêng
online. Game dùng ruleset `classic_v1`: draft kín, bốn round, timeout phía
server, rematch và reconnect reservation.

## Yêu cầu

- Node.js `>=20` và npm.
- Android Studio + emulator/device cho Android.
- Xcode + iOS Simulator/device cho iOS.
- Expo development build (không dùng Expo Go vì app có native Ads/SecureStore).
- Repo khuyến nghị chạy shell command qua `rtk` theo `AGENTS.md`.

## Cài đặt nhanh

```bash
rtk npm install
cp .env.example .env
rtk npm run verify
```

`.env.example` chỉ chứa giá trị local/test. Không đặt Supabase service key,
production ad ID hoặc secret vào `EXPO_PUBLIC_*`.

### Địa chỉ server cho từng môi trường

`EXPO_PUBLIC_SERVER_URL` phải trỏ tới server mà thiết bị truy cập được:

| Client | Giá trị gợi ý |
|---|---|
| iOS Simulator | `http://127.0.0.1:2567` |
| Android Emulator | `http://10.0.2.2:2567` |
| Thiết bị thật | `http://<IP-LAN-của-máy>:2567` |

Khi dùng thiết bị thật, export server trên LAN trước khi chạy server:

```bash
export SERVER_HOST=0.0.0.0
export SERVER_PORT=2567
export RECONNECT_TIMEOUT_MS=25000
export EXPO_PUBLIC_SERVER_URL=http://<IP-LAN-của-máy>:2567
```

Hoặc export `.env` vào shell trước khi chạy server:

```bash
set -a
source .env
set +a
```

Các timeout server hợp lệ:

- Draft: `DRAFT_SELECTION_TIMEOUT_MS` — mặc định `5000` ms.
- Round: `ROUND_SELECTION_TIMEOUT_MS` — mặc định `15000` ms.
- Reconnect: `RECONNECT_TIMEOUT_MS` — mặc định `25000` ms, chỉ nhận `20000–30000` ms.

## Chạy development

Mở hai terminal.

Terminal 1 — authoritative server:

```bash
rtk npm run dev:server
```

Server mặc định chạy tại `http://127.0.0.1:2567`.

Terminal 2 — Expo Metro cho development client:

```bash
rtk npm run dev:mobile
```

Nếu cần đổi server URL, restart Metro sau khi đổi `EXPO_PUBLIC_SERVER_URL`.

### Build và mở native development client

```bash
rtk npm run mobile:android
rtk npm run mobile:ios
```

Android command build APK debug, cài vào emulator/device và mở app. iOS cần
Simulator runtime hoặc device có iOS SDK tương ứng được cài trong Xcode.

## Kiểm thử và kiểm tra chất lượng

```bash
rtk npm test                 # game-core + server + mobile
rtk npm run typecheck
rtk npm run lint
rtk npm run build:server
rtk npm run verify           # toàn bộ test/typecheck/lint/build
rtk npm audit --audit-level=high
rtk git diff --check
```

Test riêng từng workspace:

```bash
rtk npm test --workspace game-core
rtk npm test --workspace server
rtk npm test --workspace mobile -- --runInBand
```

Các case native/E2E nằm trong [tasks/test-plan.md](tasks/test-plan.md), kết quả
thực tế nằm trong [tasks/test-result.md](tasks/test-result.md).

## API local tối thiểu

| Method | Endpoint | Mục đích |
|---|---|---|
| `GET` | `/health` | Health check |
| `POST` | `/rooms/create` | Tạo room + session/reconnect credential |
| `POST` | `/rooms/validate` | Kiểm tra mã room |
| `POST` | `/rooms/join` | Vào room |
| `POST` | `/rooms/reconnect` | Khôi phục session bằng credential |
| `GET` | `/rooms/:roomCode/snapshot?sessionId=...` | Lấy projection an toàn theo player |
| `POST` | `/rooms/:roomCode/action` | Gửi action đã validate |

Room là in-memory và tối đa hai player. Restart server làm room cũ hết hạn;
client sẽ xóa credential SecureStore và hiển thị `ROOM_EXPIRED`.

## Cấu trúc chính

```text
game-core/   ruleset, draft, match engine, protocol và deterministic tests
server/      Colyseus room, HTTP entry/reconnect, timeout, rate limit, logs
mobile/      Expo Router screens, Zustand preferences, SecureStore, i18n
docs/assets/ asset nguồn dân gian; chỉ dùng asset runtime khi được chọn rõ
tasks/       spec, task detail, test plan và evidence
```

Board luôn chia hai nửa trên/dưới đối xứng. Cosmetic hiện tại mặc định là
`folk_default`; mỗi user giữ lựa chọn interface/card/board riêng trong
preferences. Skia chưa được thêm vì View/native text hiện đáp ứng MVP.

## Giới hạn MVP hiện tại

- Room persistence, tài khoản, Supabase/RLS, shop theme và analytics chưa nằm
  trong MVP.
- Online mobile adapter hiện dùng HTTP polling trên cùng authoritative controller;
  migration sang WebSocket Colyseus đầy đủ cần thực hiện trước production.
- Native two-device privacy/reconnect, VoiceOver/TalkBack và FPS profiling phải
  được chạy trên thiết bị thật trước khi đóng Checkpoint D.

## Tài liệu liên quan

- [SPEC.md](SPEC.md)
- [tasks/plan.md](tasks/plan.md)
- [tasks/todo.md](tasks/todo.md)
- [docs/document.md](docs/document.md)

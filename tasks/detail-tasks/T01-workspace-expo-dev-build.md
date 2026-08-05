# T01 — Bootstrap workspace and Expo development build

Status: complete

## Outcome

Tạo skeleton chạy được cho ba npm workspaces `mobile`, `server`, `game-core`,
định nghĩa toàn bộ root command contract trong `SPEC.md`, và boot được một Expo
development build portrait tối thiểu. Đây là task nền; không triển khai gameplay,
ads, Supabase hoặc UI hoàn chỉnh.

## Dependencies and skills

- Dependencies: none.
- Required skills: `vibe-build`, `source-driven-development`,
  `incremental-implementation`, `git-workflow-and-versioning`.
- Read first: `SPEC.md` sections Architecture, Tech Stack, Commands, Workspace,
  Expo mobile app, Environment and diagnostics.

## Technical contract

1. Trước khi scaffold, tra tài liệu chính thức và ghi phiên bản tương thích của
   Expo SDK, React Native, React, Expo Router, dev client, Reanimated và Gesture
   Handler. Không chọn version từ trí nhớ và không dùng Expo Go làm runtime.
2. Root `package.json` có `private: true`, một lockfile và workspaces
   `mobile`, `server`, `game-core`. `game-core` không import mobile/server;
   `server` phụ thuộc `game-core`; mobile chỉ dùng public exports của core.
3. Root scripts phải có đúng contract: `dev:server`, `dev:mobile`,
   `mobile:android`, `mobile:ios`, `test`, `typecheck`, `lint`, `build:server`,
   `verify`. `verify` chạy test → typecheck → lint → server build và dừng ở lỗi
   đầu tiên.
4. `mobile` dùng Expo Router với một `Stack`, CNG/app config, portrait,
   development client và một Home placeholder có accessible text. Không tạo tabs
   hoặc navigation wrapper.
5. `server` boot một Node process tối thiểu có health log; `game-core` build một
   TypeScript export tối thiểu. Chưa tạo generic service/repository layers.
6. `.env.example` chỉ chứa placeholder public server URL và timeout values.
   `.gitignore` phải chặn `.env`, native build output, Metro cache và secrets.

## Implementation steps

1. Xác nhận Node/npm và Android/iOS toolchain đang có; ghi version vào evidence.
2. Tạo root workspace/config và package scripts trước để mọi bước sau chạy từ
   root.
3. Scaffold Expo TypeScript app, chuyển route về một Stack mỏng, cấu hình
   `expo-dev-client`, portrait và scheme không chứa secret.
4. Tạo tối thiểu `server/src/index.ts` và `game-core/src/index.ts` cùng
   TypeScript configs. Dùng project references chỉ khi nó làm root build đơn
   giản hơn; không thêm build orchestrator.
5. Thiết lập Node built-in test runner cho core/server và Jest preset của Expo
   cho mobile, mỗi workspace có đúng một smoke test.
6. Cài dependency bằng npm ở root, pin versions trong lockfile, chạy config
   inspection rồi build/install development client.
7. Chỉ sửa lỗi bootstrap. Không bắt đầu T02/T04 trong task này.

## Likely files

- `package.json`, `package-lock.json`, `tsconfig.base.json`, `.gitignore`, `.env.example`
- `game-core/package.json`, `game-core/tsconfig.json`, `game-core/src/index.ts`
- `server/package.json`, `server/tsconfig.json`, `server/src/index.ts`
- `mobile/package.json`, `mobile/app.json` hoặc `mobile/app.config.ts`
- `mobile/app/_layout.tsx`, `mobile/app/index.tsx`, mobile Jest/TypeScript config

## Acceptance criteria

- [ ] Một clean `npm install` tạo đúng một root lockfile; dependency direction
  không có import ngược và mọi root script đã tồn tại.
- [ ] `npm run verify` xanh với smoke tests, strict typecheck, lint và server
  build; `npm run dev:server` khởi động không lỗi với env hợp lệ và fail-fast
  với env sai.
- [ ] Development build mở Home placeholder bằng `expo-dev-client`, giữ portrait
  và không phụ thuộc Expo Go; Android/iOS commands được chứng minh hoặc ghi rõ
  toolchain blocker riêng.

## How to run

```bash
npm install
npm run test
npm run typecheck
npm run lint
npm run build:server
npm run verify
npm run dev:server
npm run dev:mobile
npm run mobile:android
npm run mobile:ios
```

Config/native inspection trước khi nhận task:

```bash
npx expo config --type public --config mobile/app.json
npm ls --workspaces --depth=0
git diff --check
```

Nếu app config dùng TypeScript, thay `--config mobile/app.json` bằng file thực tế.
`mobile:android`/`mobile:ios` là device gates, không được giả PASS từ typecheck.

## Evidence to record

- Node/npm/Expo versions và URL tài liệu chính thức đã dùng.
- Output của `npm run verify`.
- Platform, emulator/device và ảnh/log Home development build.
- Mọi native toolchain blocker còn lại.

## Explicitly skipped

- Game rules, real screens, assets, ads, Colyseus room, Skia, Supabase và CI.

## Build evidence

- `npm install` passed with one root `package-lock.json`; Expo SDK 57.0.10,
  React 19.2.3, React Native 0.86.2, `expo-router`/`expo-dev-client` 57.0.10.
- `npm run verify` passed: game-core 1 test, server 2 tests, mobile 1 smoke
  test, typecheck, ESLint and server build.
- `GET http://127.0.0.1:2567/health` returned `{ "ok": true }`.
- `npm run mobile:android` completed Gradle `BUILD SUCCESSFUL`, installed
  `app-debug.apk` and opened on `Android_TV_1080p`.
- iOS prebuild and CocoaPods completed; `expo run:ios` is BLOCKED only because
  no iOS simulator was booted (`No iOS devices available in Simulator.app`).

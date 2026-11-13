# REQ-LAN-20261113 — LAN rooms + QR

Status: implementation / automated checks / Android builds pass; controlled two-phone evidence in progress.

## Libraries and architecture
- `react-native-tcp-socket` 6.4.3: maintained Node-style TCP listener/client; compiled and phone↔Mac echo proved on SDK58/RN0.88 new architecture.
- `react-native-zeroconf` 0.17.7: current stable Android NSD + DNS-SD; phone advertised/resolved; Mac discovered its service in the feasibility spike.
- `expo-network` 58.0.5: active-network IPv4; Android CNG plugin also reads Wi-Fi/AP interfaces so hotspot hosts do not advertise cellular addresses.
- `expo-keep-awake` 58.0.4: host-lifetime awake tag, released on disposal.
- `expo-camera` 58.0.14: QR-only camera; request on tap, denied/manual/settings fallback; microphone disabled in its plugin.
- `qrcode-generator` 2.0.4: pure JS matrix rendered with RN Views, dark/light + four-module quiet zone; no SVG dependency.
- Shared controller + message limiter live in `@rps-cards/game-core/room`: both consumers already depend on game-core, so a subpath avoids another workspace and keeps Node imports out of mobile.
- Server façade retains crypto defaults; shared controller requires injected secure randomness/UUIDs. Device uses Expo Crypto with rejection sampling.
- `room-client.ts` owns active transport, LAN metadata, cold reconnect and entry routes; gameplay keeps the existing snapshot revision/serverNow acceptance, reveal, timers, rematch and exit-ad path.
- One authority per app; host A uses in-process calls, B uses TCP. App background disconnects host under existing 25s rules; leave/abandon disposes listener, sockets, controller, mDNS and timers.
- Wire: newline-delimited JSON `{id,op,...}` → `{id,result}` / `{id,error}`; hello/version/code, join, reconnect, snapshot, action, leave; no broadcast projections.
- Bounds: 16 KiB frame, malformed-frame close, 20 requests/s/connection, 10s idle, four sockets; token required for snapshot/action/leave; reconnect transfers socket ownership.
- mDNS `_baobuakeo._tcp`, name includes code, TXT `version/roomCode/free`; full/closed rooms unpublish; lost/15s stale results disappear; scanning is bounded and cancellable.
- QR format: `baobuakeo://lan?v=1&h=192.168.1.23&p=41234&c=ABCD2` (example address only); private/link-local IPv4, port, exact keys/prefix/version/alphabet validated; no credential in payload.

## Verification
- Feasibility prebuild + arm64 release: PASS (`spike-prebuild.log`, `spike-release.log`); on-phone debug-signed release + Mac Wi-Fi TCP echo PASS, mDNS advertisement/resolve observed.
- Extraction: core 13 / server 26 PASS without changing existing test intent.
- Root typecheck, lint, tests: PASS; core 13 / server 26 / mobile 153 (39 suites); `git diff --check` PASS.
- Protocol tests use in-memory duplex links: four rounds, private projections, locks, rematch, reconnect/forfeit, auth/version/code/full/sockets/frame/rate/idle limits, fragmented frames, pending request cleanup.
- Native-boundary tests replace all native modules: one host, keep-awake/advertising/listener disposal, background reservation, discovery full/lost/stale cleanup.
- Screen tests: Home flag, camera permission denied/manual fallback, invalid vs accepted QR; camera fake prevents native loading.
- Final CNG Android prebuild PASS; arm64 debug-signed release PASS (3m22s); normal release signing build PASS (26s).
- Same debug-signed APK `install -r` PASS on Samsung SM-S911B and SM-S906E, preserving data; no uninstall or keystore changes.
- `host-lobby-qr.png`: host code/address/QR/warning; macOS Vision decoded its QR successfully. Actual phone camera scanning is not yet verified.
- Phone-to-phone discovery/manual/full match/rematch/reconnect/host-loss: pending controlled run; spontaneous route changes during early capture were escalated to coordinator and are not counted as proof.
- Logs: `tasks/review/lan-logs/` (ignored `*.log`); screenshots: `tasks/evidence/android/2026-11-13-lan/`.

## Feature files changed / added
- `game-core/package.json`: platform-neutral authority subpath export.
- `game-core/src/room-controller.ts`: original authority with injected randomness/UUIDs.
- `game-core/src/message-rate-limit.ts`: shared message limiter.
- `server/src/rooms/online-room.ts`: thin server crypto-default façade.
- `server/src/rate-limit.ts`: re-export shared message limiter; retain HTTP limiter.
- `mobile/package.json`: TCP/discovery/network/awake/camera/QR dependencies.
- `package-lock.json`: npm workspace dependency lock.
- `mobile/app.json`: LAN permissions/Bonjour description, camera and local-address plugins; preserve existing branding/ads/signing config.
- `mobile/plugins/with-lan-network.js`: generate Android Wi-Fi/hotspot interface lookup + package registration through CNG.
- `mobile/plugins/with-release-signing.js`: opt-in `-PrpsDebugSigning=true` for data-preserving device installs; default signing unchanged; CommonJS lint declarations.
- `mobile/app/lan.tsx`: LAN route.
- `mobile/src/lan/address.ts`: address/QR validation and version contract.
- `mobile/src/lan/address.test.ts`: round-trip and malformed/foreign/version/address rejection tests.
- `mobile/src/lan/protocol.ts`: bounded framing/RPC, authenticated authority links and room-client adapter.
- `mobile/src/lan/protocol.test.ts`: in-memory gameplay/security/reconnect/cleanup tests.
- `mobile/src/lan/native.ts`: native TCP, secure IDs, lifecycle, discovery and cleanup boundary.
- `mobile/src/lan/native.test.ts`: injectable native fakes for host/discovery lifecycle tests.
- `mobile/src/lan/camera.tsx`: camera/permission boundary.
- `mobile/src/game/room-client.ts`: active-session transport factory and reconnect routing.
- `mobile/src/security/reconnect-credential.ts`: persist/validate LAN address + host marker alongside existing credential.
- `mobile/src/screens/LanScreen.tsx`: host/discovery/QR/manual entry and localized errors.
- `mobile/src/screens/LanScreen.test.tsx`: denied camera fallback, QR validation and scanner cleanup.
- `mobile/src/screens/HomeScreen.tsx`: blue LAN action; Internet action opt-in only.
- `mobile/src/screens/HomeScreen.test.tsx`: default LAN and enabled Internet entry contracts.
- `mobile/src/screens/RoomsScreen.tsx`: select Internet session; ignore LAN credentials in Internet list.
- `mobile/src/screens/LobbyScreen.tsx`: shared transport, copy/share LAN address, host QR + warnings.
- `mobile/src/screens/OnlineDraftScreen.tsx`: select session transport; retain draft behavior.
- `mobile/src/screens/OnlineBoardScreen.tsx`: select session transport; retain ordering, lock and reveal behavior.
- `mobile/src/screens/OnlineResultScreen.tsx`: select session transport; preserve exit interstitial.
- `mobile/src/screens/ReconnectingScreen.tsx`: restore persisted transport, retry original LAN host, return LAN host-loss error.
- `mobile/src/components/LanQrCode.tsx`: pure-JS QR matrix renderer.
- `mobile/src/components/HowToPlaySheet.tsx`: same-Wi-Fi/hotspot instruction.
- `mobile/src/i18n/en.ts`: all new English LAN/QR/error strings.
- `mobile/src/i18n/vi.ts`: corresponding Vietnamese strings; Ván/Lượt unchanged.
- `tasks/todo.md`: LAN task status and report link.
- `tasks/plan.md`: requested LAN scope and verification handoff.
- `tasks/review/2026-11-13-lan-report.md`: this report.
- `tasks/evidence/android/2026-11-13-lan/*.png`: captured phone evidence (see verification above).

## Limits / open risks
- Host must stay foreground; a killed host cannot recover its in-memory authority. Public Wi-Fi client isolation can block direct TCP/mDNS; manual entry cannot bypass isolation.
- Physical hotspot-host mode and iOS are untested; Android interface fallback is generated/configured and Wi-Fi tested, not a hotspot hardware certification.
- QR screenshot decoding is partial evidence; it does not prove another phone camera can scan the screen.
- LAN is plaintext TCP per the requested protocol; use a trusted local network. Discovery is best effort and IPv4-only; omitted port defaults to 41234, so use the displayed IP:port for ephemeral host ports.
- `npm audit`: 45 findings (6 low,31 moderate,6 high,2 critical), involving Expo tooling/server dependency trees; no unrelated automatic upgrades applied. Audit detail is in `audit.json.log`.
- Intentional pre-existing assets, ads edits, keystore files/scripts and `.gitignore` preserved; no commit/push/stash/restore, no iOS generation. `yarn.lock` drift was observed during the run but was not edited or reverted by this worker; all package-manager commands used npm.

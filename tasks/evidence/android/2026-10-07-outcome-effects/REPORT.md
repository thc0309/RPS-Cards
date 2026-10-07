# T28 — Hiệu ứng thắng/thua/hòa, Android release (07/10/2026)

## Thay đổi

- Dùng chung sân đấu BOT/online: bài thắng nảy nhẹ, viền vàng và sáu cánh sen;
  bài thua nghiêng/hạ nhẹ; hòa thì hai bài nhún cùng nhau. Không thêm khuôn mặt.
- Chạy trong nhịp outcome 1200ms hiện có. Progress và thời gian còn lại lấy từ
  authority; snapshot trùng không khởi động lại hiệu ứng. Reanimated chạy frame,
  không thêm timer gameplay hay dependency.
- Reduced Motion giữ bài, viền thắng và thông báo tĩnh, bỏ nhún/nghiêng/cánh sen.
  Trang kết quả cả trận giữ thiết kế hiện có; lần thử này là hiệu ứng từng lượt.
- Native chữ lớn phát hiện ghi chú dưới tay bài bị cắt. Bố trí compact giảm phần
  trống của header/tay bài và giữ tỷ lệ card, để ghi chú nằm trên thanh điều hướng.

## Kiểm tra tự động và build

- Test mới đã FAIL trước sửa: thiếu progress outcome và không có cánh sen.
- Final mobile: **59 tests / 24 suites PASS**; mobile typecheck và ESLint bốn file
  source/test thay đổi PASS; diff whitespace PASS.
- Release arm64 build/install PASS: JBR17.0.14, build đầu 45s; sau sửa compact 19s.
  APK không có flag DEBUGGABLE và chạy BOT không cần Metro.
- APK cuối: `mobile/android/app/build/outputs/apk/release/app-release.apk`.
  SHA256: `e653889c4c71257b187bf999990893b0ad1dca46d3c0884f99a9597b1cc9ca68`.
- Không chạy lại root verify; baseline unused `guest` ở server vẫn là gate riêng.

## Android thật

Samsung SM-S906E/RFCTB15AQ6J, Android16/API36, density450, app tiếng Việt.
Màn mặc định 1080×2340/font1.0; màn nhỏ là override900×1598 (~320×568dp)/font1.3
trên cùng máy. Đây không phải hai thiết bị độc lập. Các trận dùng timeout draft
và selection; không phải bằng chứng drag/replacement mới.

| Quan sát | Kết quả và artifact |
|---|---|
| Mặc định, bốn lượt + Đấu lại | PASS scoped. `bot-release.mp4`: DRAW, WIN, DRAW, DRAW → Result1–0. `win-loss.png` cho thấy bài mình thắng có viền/cánh sen, bài BOT thua nghiêng; `draw.png` có text hòa. `rematch-draft.png` chụp ngay sau Đấu lại: ba lá úp và timer5s. `rematch-selection.xml` là state muộn hơn sau draft, score0–0/hand mới, không gọi nó là XML Draft. |
| Nhỏ/font1.3, bốn lượt trước sửa compact | Pipeline PASS scoped: `small-release.mp4`, bốn WIN →4–0. `small-win.png` thể hiện hiệu ứng; `small-result.png` là phần đầu Result, nút/lượt4 cần cuộn. Footer Board bị cắt ở bản này, không dùng để duyệt geometry cuối. |
| Reduced Motion trước sửa compact | `small-reduced-release.mp4`: một DRAW đi qua pipeline và sang lượt mới, không treo. Đây là smoke một lượt, không phải full match. |
| Bố trí compact cuối, motion thường | `final-small-release.mp4` phần đầu: WIN, cánh sen + viền, thu bài rồi lượt2. `final-normal-outcome.png` và `final-normal-next-selection.png` cho thấy +1/ghi chú đủ ở phía trên thanh điều hướng. |
| Bố trí compact cuối, Reduced Motion | Phần sau `final-small-release.mp4`: cold start với transition scale0, một WIN rồi lượt2. `final-reduced-outcome.png` có viền/text, không cánh sen; hai bài đứng thẳng. `final-reduced-next-selection.png` chứng minh tiếp tục được. |

`effect-preview.mp4` là đoạn minh họa 3,6s từ màn mặc định (không đổi geometry
mặc định trong sửa compact). Video lớn được xuất lại H264 ở nguyên kích thước,
giữ VFR, chỉ bỏ các track metadata của screenrecord. Ảnh được kiểm tra trực quan;
`frame-index.json` ghi phương pháp lấy mẫu. Seek/frame sample không chứng nhận
độ trễ hay FPS. Chưa đo performance cho hiệu ứng mới.

## Giới hạn và cleanup

- Lần tự động bấm Đấu lại ở Result nhỏ dừng vì nút ngoài viewport; đổi kích thước
  thiết bị có thể recreate Activity về Home. Driver đã chạy lại từ Home đúng state.
  Không suy ra lỗi sản phẩm hay PASS rematch nhỏ từ các lần thử không có thao tác.
- Native lần này là BOT một máy. Online dùng cùng component và các mobile tests
  PASS, nhưng chưa có native online mới/two-device/lag/TalkBack/speech-count/FPS.
  T26-F/G và các gate T25/T22/T14 vẫn mở.
- Khôi phục 1080×2340, font1.0, timeout30000, transition1.0, TalkBack off; localevi
  giữ nguyên, APK release cuối còn cài và Home đã mở. `restored-settings.json`.
- Commit `7e473cb` lưu sửa rematch T27 và evidence T26 trước khi thử hiệu ứng.
  Hiệu ứng và bằng chứng final được lưu bằng commit tiếp theo; không push/release.

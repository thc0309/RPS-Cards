# Android — đợt sửa UX + lỗi 2026-11-11

Thiết bị: Samsung `SM_S911B` (`RFCW1082JJR`), 1080×2340, tiếng Việt, cỡ chữ mặc định.
Build: `app:assembleRelease -PreactNativeArchitectures=arm64-v8a` (bản cuối), cài `adb install -r`.
Server local `127.0.0.1:2567` qua `adb reverse`; người chơi thứ hai là script HTTP trên Mac (không phải máy thật thứ hai).
Ảnh đã thu nhỏ còn 540×1170.

## Checks tự động (sau thay đổi cuối)
typecheck + lint 3 workspace PASS · game-core 13/13 · server 26/26 · mobile 129/129.

## Đã thấy trên máy
| Hạng mục | Kết quả | Bằng chứng |
|---|---|---|
| Home: nút Cách chơi + Cài đặt | PASS | `01-home-first-launch.png` |
| Màn Cách chơi | PASS (mở bằng nút) | `02-how-to-play.png` |
| Draft: trạng thái lượt, đồng hồ cạnh trạng thái | PASS | `03-draft-my-turn.png` |
| Draft: lật lá phụ trước khi vào ván | PASS | `04-draft-reveal.png` |
| Board: tên BOT, Lượt n/4, 4 ô bài đã ra, huy hiệu Lá phụ | PASS | `05-board-start.png` |
| Chốt bằng chạm 2 lần; đồng hồ đổi màu ≤5 s | PASS | `11-after-double-tap.png` |
| Kéo thẳng lá bài vào ô, không chọn trước | PASS (`adb input swipe`) | `37-drag-and-exit.png` trái |
| Nút rời ván + hộp xác nhận, rời về Home | PASS | `37-drag-and-exit.png` phải |
| Banner thắng lượt, lật bài, vào Result | PASS | `15-round4-to-result.mp4`, `16-round4-sheet.png` |
| Result BOT: cột, ✓ × =, gợi ý thói quen, đủ 2 nút | PASS | `34-bot-result-compact.png`, `33-bot-match-final.mp4` |
| Rooms: không quảng cáo trước khi vào, nút Dán | PASS | `20-rooms.png` |
| Lobby: Chia sẻ, bỏ nhãn "Đã sẵn sàng" | PASS (chưa bấm Chia sẻ) | `21-lobby.png` |
| Đối thủ rời lúc draft → Result "Bạn thắng" | PASS chức năng; bố cục trong ảnh là bản trước khi sửa | `24-forfeit-during-draft-fixed.png` |
| Quảng cáo test hiện khi rời Result online, đóng xong về Home | PASS | (quan sát; không lưu ảnh) |
| Ván online đủ 4 lượt, banner thua lượt | PASS | `29-online-match.mp4`, `30-online-sheet.png` |
| Đối thủ rời sau trận: kết quả 2–1 giữ nguyên, nút đấu lại khoá | PASS | `31-result-before-after-leave.png` |

## Chưa kiểm
- Cách chơi tự mở ở lần chạy đầu (bản cài đè giữ dữ liệu cũ nên không tái hiện chắc chắn).
- Màn nhỏ 320×568, cỡ chữ 1.3, tiếng Anh, TalkBack, reduced motion.
- Nút Dán, Chia sẻ, nút Rời phòng ở màn Reconnecting, nút back cứng.
- Bố cục Result forfeit sau lần sửa cuối (ẩn khung lịch sử rỗng, dòng "Đối thủ đã rời phòng").
- Hai máy thật; iOS.
- Thói quen BOT chỉ có unit test, chưa đo thống kê trên máy (các ván trên máy chủ yếu để hết giờ).

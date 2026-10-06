# Sửa UI Android — 06/10/2026

Phạm vi: 12 mục UI-01–UI-12 trong [báo cáo trước](../2026-10-06-card-refresh/UI-REVIEW.md). Không thay gameplay, timer, privacy hay bộ tranh card dễ thương không có khuôn mặt. Không commit.

## Kết quả theo lỗi

| ID | Sửa đổi | Bằng chứng sau sửa |
|---|---|---|
| UI-01 | Khung ảnh có width/height rõ ràng theo card; padding nằm trong lớp nội dung; tranh co theo card nhỏ. Không còn ảnh 1024×1536 phóng/cắt thành dải nâu. | [Board mặc định](04-board.png), [Board nhỏ/font 1.3](15-board-small-start.png) |
| UI-02 | Rooms dùng chiều rộng theo viewport; tách padding khỏi lớp ảnh panel, giữ trục khung/nội dung trùng nhau. | [Rooms](02-rooms.png), [Rooms nhỏ](10-rooms-small-scrolled.png) |
| UI-03 | Gợi ý nhập mã là chữ một dòng tự co vừa khung; nhãn accessibility và input 5 ký tự vẫn giữ. Loại letter spacing khỏi gợi ý. | [vi](10-rooms-small-scrolled.png), [en](21-rooms-en-small.png), [nhập mã khi mở bàn phím](23-rooms-en-keyboard.png) |
| UI-04 | Panel có chiều cao theo nội dung, toàn bộ nút/đáy cuộn được; KeyboardAvoidingView dành viewport cho bàn phím. Không ép chữ nhỏ để nhét mọi nội dung. | [Cuộn tới Vào phòng](10-rooms-small-scrolled.png), [nút khi mở bàn phím](23-rooms-en-keyboard.png) |
| UI-05 | Logo đo theo viewport với chiều cao đúng tỷ lệ, bỏ minHeight gây vượt cỡ. Hai mép trang trí nằm trong màn hình. | [Home nhỏ/font 1.3](08-home-small-font13.png) |
| UI-06 | Nút chừa vùng an toàn hai đầu; label co theo vùng nội dung và cho phép xuống dòng khi cần. | [vi](08-home-small-font13.png), [en](20-home-en-small.png) |
| UI-07 | Hướng dẫn có padding trong vùng giấy; không giới hạn hai dòng cắt nội dung. | [Draft](03-draft.png), [vi nhỏ](13-draft-small-font13.png), [en nhỏ](22-draft-en-small.png) |
| UI-08 | Home giảm khoảng trống trên logo, đặt nhóm nội dung từ phần trên với khoảng đệm theo chiều cao màn hình. | [Home](01-home.png) |
| UI-09 | Bù phần canvas trong suốt trên/dưới bitmap nút để thân nút dày hơn; thống nhất khoảng cách, icon và chữ. Vùng chạm tối thiểu 64 dp. | [Home](01-home.png), [Rooms](02-rooms.png), [Result](25-result-normal.png) |
| UI-10 | Draft dùng giữa viewport, ba card lớn hơn theo chiều rộng. Ở màn hình nhỏ đồng hồ nằm trong panel VS để luôn thấy cùng bài/hướng dẫn. | [Draft](03-draft.png), [Draft nhỏ](13-draft-small-font13.png) |
| UI-11 | Giảm sân mặc định, tăng VS/slot/back/discard/label; hai vùng trên/dưới chia đều phần còn lại. Cấu hình compact giữ bài, timer và drop target trong viewport. Đo lại card khi chọn để loại tọa độ cũ sau khi tay bài co lại. | [Board](04-board.png), [Board nhỏ](15-board-small-start.png), [khóa nhỏ](16-board-small-drag.png) |
| UI-12 | Tăng cỡ dấu kết quả/chữ/ảnh lượt, cân lại bảng và nút, dành padding cho thanh cuộn giấy. Result nhỏ vẫn cuộn đầy đủ. | [Result mặc định](25-result-normal.png), [Result nhỏ](17-result-small.png), [đáy Result nhỏ](18-result-small-scrolled.png) |

## Môi trường và kiểm tra

- Máy thật Samsung SM-S906E, serial RFCTB15AQ6J, Android 16/API 36. Mặc định 1080×2340 px, density 450, font scale 1.0.
- Viewport nhỏ được override 900×1598 px, khoảng 320×568 dp, font scale 1.3 trên cùng máy; không coi là thiết bị nhỏ độc lập. Home/Draft/Board đã cold launch với cấu hình nhỏ; Result nhỏ được thu trong trận riêng sau cold launch; đổi font scale trên máy này khởi tạo lại activity nên không giữ được session cũ.
- Expo development build arm64-v8a; Gradle assembleDebug PASS và adb install -r PASS. JS sửa mới được tải từ Metro sau khi restart, không phải APK release/offline.
- Mobile Jest: 21 suites / 48 tests PASS. Sau chỉnh tỷ lệ Result cuối: suite FolkGameViews 6 tests PASS; mobile typecheck/lint PASS; diff --check PASS.
- Thêm regression cho gợi ý nhập mã: nhập chữ thường trở thành mã hoa, gợi ý biến mất khi có mã và hiện lại sau xóa, maxLength/nhãn accessibility giữ nguyên.
- Native: Home/Rooms/Draft/Board/Result; vi/en Home/Rooms/Draft; cuộn Rooms và mã AB12C với bàn phím mở. Kéo khóa thành công ở mặc định và compact. Replacement mặc định đổi lá giữ sang Bao và trả Búa về tay ([ảnh](24-replacement-normal.png)); ảnh chụp ngay sau gesture có fade-in chưa hoàn tất ở lá giữ.
- Sau bổ sung đo lại card khi chọn, kéo đủ bốn lượt liên tiếp ở compact đã tới Result (0–1), không cần timeout. Cỡ mặc định đã tới Result 2–1; score/history đều từ runtime. Log process cuối không có ReactNativeJS warning/AndroidRuntime error ([log](runtime.log)). Đây là smoke UI/gesture, không đánh dấu toàn bộ MOB-P0/P1 PASS.

## Giới hạn

Màn hình nhỏ/font lớn cần cuộn ở Rooms và Result; các nút đã được tiếp cận, không có yêu cầu phải nhét toàn trang vào một viewport. Chưa chạy lại online hai máy, Lobby/Reconnecting native, toàn bộ forfeit/wait/busy, TalkBack, Reduced Motion, FPS hay iOS. T13/T14/T20/T21/T22/T25 vẫn giữ gate rộng còn mở. Các lỗi server lint/test baseline từ review 05/10 không thuộc đợt sửa UI này và không được sửa.

Nút Tools thuộc Expo và dải Edge thuộc Samsung, không phải UI sản phẩm. Không coi khung mờ lúc ảnh fade-in là mất asset. Đã khôi phục cỡ màn hình, font 1.0, timeout 30 giây và ngôn ngữ vi sau kiểm tra.

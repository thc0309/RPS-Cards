# Tổng hợp UI Android — 06/10/2026

Phạm vi: chỉ quan sát và tổng hợp, không sửa mã sản phẩm. Samsung SM-S906E, Android 16/API 36, màn hình 1080×2340, density 450, font scale 1.0; Expo development build arm64-v8a. Source `df2cf69` cùng các PNG card mới chưa commit. Build Gradle và cài đặt thành công; Metro qua USB ở port 8081. Không chạy lại full quality gate và không kết luận release-ready.

Đã quan sát Home, Rooms trạng thái trống, Draft local, Board local, Result và Customize. Bổ sung kiểm tra viewport Android được override thành 900×1598 px ở density 450, tương đương khoảng 320×568 dp, font scale 1.3; cold launch lại trước ảnh Home nhỏ. Đây là cấu hình trên cùng điện thoại, không phải một thiết bị nhỏ độc lập. Sau quan sát đã khôi phục kích thước gốc, font scale 1.0 và screen timeout 30 giây.

Đối chiếu bố cục với `docs/ui/01-home.png`, `04-draft.png`, `05-board.png`, `07-result.png`. Không coi bộ tranh card mới khác phong cách tranh cũ là lỗi vì người dùng đã yêu cầu thay tranh.

## Lỗi cắt, tràn và lệch có bằng chứng trực tiếp

| ID | Mức | Vị trí | Hiện tượng | Ảnh chứng minh |
|---|---|---|---|---|
| UI-01 | P1 | Board — bài trên tay | Khung card không thu về đúng kích thước lá bài: mất hoa văn góc, xuất hiện dải nâu chéo lớn ở đáy. Lặp lại với 4, 2 và 1 lá. Cùng asset ở vùng bài đã ra/Result hiển thị đủ khung, nên cần kiểm tra đường render `FolkCard`, không kết luận PNG bị hỏng. | [03](03-board.png), [04](04-board-later.png), [05](05-board-round4.png) |
| UI-02 | P1 | Rooms — viewport nhỏ/font 1.3 | Panel lệch phải: mép trái cách màn hình khoảng 120 px, mép phải gần sát biên 900 px; trục của nội dung không trùng trục khung. | [12](12-rooms-small-font13.png) |
| UI-03 | P1 | Rooms — ô mã phòng/font 1.3 | Placeholder `Nhập mã 5 ký tự` xuống dòng, dòng dưới bị cắt trong ô nhập có chiều cao cố định. | [12](12-rooms-small-font13.png) |
| UI-04 | P2 | Rooms — viewport nhỏ/font 1.3 | Nút Vào phòng và phần đáy panel bị đẩy xuống ngoài viewport ban đầu; chỉ thấy mép trên nút. Một lần vuốt bắt đầu trong ô nhập không đưa nút vào ảnh. Source có ScrollView: chưa kết luận nút không thể tiếp cận bằng cuộn đúng vùng. | [12](12-rooms-small-font13.png), [13](13-rooms-small-scrolled.png) |
| UI-05 | P2 | Home — viewport nhỏ | Mép trang trí logo bị cắt ở hai cạnh, thiếu khoảng thở bên ngoài logo. Vẫn xảy ra sau cold launch ở viewport nhỏ. | [11](11-home-small-font13.png) |
| UI-06 | P2 | Home — font 1.3 | Chữ nút Phòng online sát/chạm họa tiết ở đầu phải; font tăng nhưng khoảng an toàn trong nền nút không tăng tương ứng. | [11](11-home-small-font13.png) |
| UI-07 | P2 | Draft — khung hướng dẫn | Dòng `Chọn một lá bài úp...` bắt đầu đè lên thanh dọc bên trái của cuộn giấy; text không được giữ trong vùng giấy bên trong. | [09](09-draft-warm.png) |

## Điểm mất cân đối và kích thước cần chỉnh theo thiết kế

Các mục sau là nhận xét về bố cục từ ảnh và reference, tách khỏi lỗi cắt pixel phía trên.

| ID | Vị trí | Nhận xét | Ảnh chứng minh |
|---|---|---|---|
| UI-08 | Home | Khoảng nền phía trên logo lớn, làm nhóm logo/nút dồn xuống; tỷ lệ khoảng trống không giống bố cục reference. | [01](01-launch.png), reference `01-home.png` |
| UI-09 | Home/Rooms/Result | Nền các nút hành động trông mỏng và rộng so với cỡ chữ/icon. Khoảng cách giữa nút lớn, trong khi phần thân nút ít chiều cao; thấy rõ hơn khi font tăng. Không kết luận vùng chạm nhỏ: UIAutomator cho thấy vùng chạm lớn hơn phần tranh nút. | [01](01-launch.png), [08](08-rooms.png), [06](06-result-timeout.png), [11](11-home-small-font13.png) |
| UI-10 | Draft | Ba bài úp nhỏ so với màn hình; toàn bộ thông tin, bài và hướng dẫn dồn trong nửa trên, phần dưới gần một nửa màn hình chỉ còn nền. Panel VS/status cũng thiên về bên phải so với minh họa bên trái. | [09](09-draft-warm.png), reference `04-draft.png` |
| UI-11 | Board | Vùng sân giữa chiếm diện tích lớn nhưng VS và hai ô đặt bài nhỏ. Bài đối thủ, vùng bài đã ra và chữ `Bài đã ra` nhỏ hơn nhiều so với nền sân và nhóm bài người chơi, làm tỷ lệ trên/dưới không cân đối. | [03](03-board.png), [04](04-board-later.png), reference `05-board.png` |
| UI-12 | Result | Dấu kết quả và minh họa từng lượt nhỏ so với reference; bảng bốn lượt cùng nhóm nút chưa tận dụng tốt diện tích, phần đáy còn khoảng trống lớn. Đây là vấn đề phân cấp/tỷ lệ, không phải bằng chứng chữ bị cắt ở cấu hình mặc định. | [06](06-result-timeout.png), reference `07-result.png` |

## Giới hạn và loại trừ

- Customize ở cấu hình mặc định: chưa thấy lỗi cắt/lệch rõ trong [10](10-customize.png); chưa kiểm tra sheet ở font 1.3.
- Lobby và Reconnecting chưa được quan sát trong lượt này. Chưa đánh giá English, TalkBack, keyboard-open, toàn bộ trạng thái lỗi/busy, Reduced Motion hay FPS.
- Nút bánh răng/Tools thuộc Expo development client; không đưa vào lỗi UI sản phẩm. Dải Samsung Edge panel và thanh trạng thái hệ thống cũng không tính là lỗi sản phẩm.
- Ảnh Draft đầu tiên thiếu nền/card trong thời điểm asset đang tải. Ảnh warm [09](09-draft-warm.png) đã có đủ asset; không dùng ảnh đầu để kết luận nền/card mất vĩnh viễn.
- Một trận bot tự chuyển qua bốn lượt và Result 2–1 đã quan sát được; không kiểm chứng xong thao tác drag/replace và không ghi full MOB-P0-001 PASS. Sau yêu cầu chỉ tổng hợp, dừng các ca gameplay và chỉ thu ảnh UI.
- P1 online/two-device, quảng cáo và reconnect chưa chạy. Không gộp lỗi backend từ review 05/10 vào danh sách hình học UI này.

Ưu tiên: UI-01 → UI-02/UI-03 → UI-04/UI-05/UI-06/UI-07 → cân đối lại tỷ lệ UI-08–UI-12.


## Cập nhật sau sửa

12 mục trên đã được xử lý trong đợt sửa cùng ngày. Xem [đối chiếu sau sửa và giới hạn native](../2026-10-06-ui-fixes/REPORT.md). Báo cáo trước được giữ nguyên làm baseline.

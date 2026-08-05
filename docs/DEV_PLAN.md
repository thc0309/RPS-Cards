# Development Plan — RPS Cards

## 1. Phạm vi đã chốt

- Nền tảng: Android và iOS.
- Client: React Native, Gesture Handler và Reanimated.
- Server: Node.js + Colyseus, server quyết định toàn bộ trạng thái trận đấu.
- Mỗi người có sẵn Bao, Búa, Kéo và nhận thêm một lá từ draft.
- Draft gồm ba lá Bao, Búa, Kéo được server xáo và đặt úp.
- Người được chọn trước lấy một lá; người còn lại lấy một trong hai lá còn lại.
- Mỗi người chỉ biết lá mình nhận; lá thứ ba bị loại và không được tiết lộ.
- Trận có bốn lượt; lá đã dùng đi vào thùng rác công khai và không được dùng lại.
- Không có thẻ hỗ trợ, sắp xếp tay bài, xáo tay bài hoặc Sudden Death trong MVP.
- Thẻ Khiên bị loại khỏi thiết kế.
- Giai đoạn hiện tại chỉ dùng interstitial:
  - Chủ phòng xem tối đa một lần khi bấm **Tạo phòng**.
  - Người tham gia xem tối đa một lần khi bấm **Vào phòng**.
- Không có quảng cáo trong draft, trận đấu, reconnect hoặc màn hình kết quả.
- Rewarded, vàng và economy chuyển sang giai đoạn sau.
- Bàn đấu chia thành hai nửa theo hai người chơi.
- MVP chỉ có chủ đề dân gian mặc định cho cả hai bên; chưa có chọn hoặc mua chủ đề.

## 2. Cấu trúc tối thiểu

```text
rps-cards/
├── mobile/          # React Native app
├── server/          # Colyseus rooms và matchmaking
└── game-core/       # Luật thuần TypeScript dùng chung
```

`game-core` chỉ chứa luật, kiểu dữ liệu và kiểm tra hành động. Chưa tách thêm package UI, analytics hoặc config.

## 3. State machine MVP

```text
WAITING
  → DRAFT
  → ROUND_SELECTION
  → ROUND_REVEAL
  → ROUND_RESULT
  → ROUND_SELECTION (nếu chưa đủ 4 lượt)
  → MATCH_RESULT
```

Không có `SUPPORT_ACTION` hoặc phase chuẩn bị riêng.

## 4. P0 — Gameplay prototype

### Game core

- Mô hình hóa Bao, Búa, Kéo và luật thắng/thua/hòa từng lượt.
- Tạo bộ draft gồm đúng ba loại, xáo bằng seed do server cung cấp.
- Chọn ngẫu nhiên người draft trước.
- Khóa lá đã được chọn để người thứ hai không thể chọn lại.
- Tạo tay bài gồm ba lá cơ bản và một lá draft.
- Chỉ chấp nhận lá đang thuộc tay người chơi.
- Mỗi lá chỉ được sử dụng một lần.
- Tính điểm sau từng lượt và kết thúc sau đúng bốn lượt.
- Lưu thùng rác theo đúng thứ tự đã đánh.

### Client prototype

- Bàn chơi dọc cho điện thoại theo bố cục tham chiếu `docs/ui/ui1.png`.
- Animation xáo ba lá úp.
- Chọn, khóa và nhận riêng lá draft.
- Hiển thị bốn lá của người chơi và số lá úp của đối thủ.
- Chọn lá, khóa, lật đồng thời và đưa bài vào thùng rác.
- Hiển thị điểm và kết quả trận.
- Một bot chọn bài ngẫu nhiên để kiểm thử luồng; chưa làm nhiều cấp độ.

### Kiểm tra bắt buộc

- Bao thắng Búa, Búa thắng Kéo, Kéo thắng Bao.
- Hai người không thể lấy cùng một lá draft.
- Client không nhận loại lá draft hoặc tay bài bí mật của đối thủ.
- Không thể đánh lại lá đã nằm trong thùng rác.
- Không thể gửi hai lựa chọn trong cùng một lượt.
- Kiểm tra toàn bộ sáu cặp lá bổ sung khác loại và 144 thứ tự đánh cho mỗi cặp: không có kết quả hòa trận.

### Hoàn thành P0 khi

- Có thể chơi trọn một trận với bot trên Android và iOS.
- Luật chạy từ `game-core`, không được tính kết quả riêng trong UI.
- Thao tác draft, chọn bài và kết quả không tạo trạng thái kẹt.

## 5. P1 — Phòng riêng realtime

### Server

- Tạo phòng và sinh mã phòng ngắn.
- Vào phòng bằng mã.
- Giới hạn đúng hai người chơi.
- Dùng định danh khách tạm thời; chưa cần đăng nhập mạng xã hội.
- Server giữ tay bài bí mật riêng cho từng người.
- Server xác thực phase, người gửi, quyền sở hữu lá và timeout.
- Chỉ lật bài khi cả hai người đã khóa hoặc hết thời gian.
- Gửi snapshot phù hợp khi reconnect.
- Giữ chỗ reconnect trong khoảng cấu hình 20–30 giây.
- Hết thời gian reconnect thì xử thua.

### Client

- Màn hình Trang chủ.
- Màn hình **Phòng** gộp Tạo phòng, nhập mã/Vào phòng và phòng riêng hiện tại
  của người chơi nếu phiên đó còn có thể reconnect.
- Không hiển thị danh sách công khai hoặc cho phép dò tìm toàn bộ phòng riêng
  trên server.
- Lobby chờ đủ hai người.
- Trạng thái đối thủ đã khóa bài nhưng không tiết lộ lựa chọn.
- Màn hình mất kết nối và phục hồi trận.

### Quảng cáo

- Dùng ad unit test trong môi trường phát triển.
- Tạo phòng:
  1. Người dùng bấm **Tạo phòng**.
  2. Hiển thị interstitial nếu sẵn sàng.
  3. Đóng hoặc tải lỗi thì mới gọi API tạo phòng.
- Vào phòng:
  1. Kiểm tra mã phòng tồn tại.
  2. Hiển thị interstitial nếu sẵn sàng.
  3. Đóng hoặc tải lỗi thì kiểm tra lại phòng và tham gia.
- Mỗi người chỉ nhận một lần gọi quảng cáo trong một luồng tham gia phòng.
- Không chặn tạo/vào phòng nếu quảng cáo lỗi, hết thời gian hoặc không có inventory.
- Không cấu hình rewarded hoặc quảng cáo sau trận.

### Hoàn thành P1 khi

- Hai thiết bị thật có thể tạo phòng, vào phòng và chơi đủ bốn lượt.
- Người chơi không thể đọc hoặc giả mạo bài đối thủ.
- Refresh/reconnect không làm mất điểm, tay bài hoặc lượt hiện tại.
- Quảng cáo không tạo phòng rác, không vào phòng hai lần và không chặn gameplay khi lỗi.

## 6. P2 — Ổn định trước phát hành thử

- Quick Match.
- Timeout tự chọn một lá còn lại cho Casual.
- Lịch sử trận cơ bản.
- Analytics cho draft, lựa chọn bài, tỷ lệ thắng, timeout và disconnect.
- Theo dõi lỗi client/server và room bị kẹt.
- Build nội bộ Android/iOS và kiểm thử trên mạng yếu.
- Accessibility cơ bản: kích thước chạm, tương phản, trạng thái không chỉ biểu đạt bằng màu.
- Privacy Policy, khai báo dữ liệu và consent quảng cáo phù hợp thị trường phát hành.
- Giới hạn tần suất quảng cáo bằng remote config nếu dữ liệu thực tế cho thấy cần thiết.

## 7. Chuyển sang giai đoạn sau

- Do thám và Tái chế trong Tactical Mode.
- Ranked, MMR, mùa giải và leaderboard.
- Friend list, guild, tournament, spectator và replay.
- Shop cosmetic, vàng, nhiệm vụ và Battle Pass.
- Chủ đề bàn đấu cá nhân, kho chủ đề và cửa hàng chủ đề.
- Rewarded ads.
- Interstitial sau trận.
- Skia, Rive và hiệu ứng hình ảnh phức tạp.
- Sắp xếp hoặc xáo tay bài; chỉ thêm lại nếu thẻ thông tin khiến vị trí lá có giá trị.

## 8. Gợi ý giao diện dân gian Việt

### Art direction

- Bối cảnh chính: một ván đấu trong không khí hội làng Việt, trình bày trên chiếu cói hoặc mặt bàn gỗ.
- Bàn đấu chia ngang thành hai nửa độc lập: đối thủ ở trên, người chơi ở dưới.
- Mỗi nửa thuộc về một người chơi và có thể mang chủ đề riêng.
- MVP dùng cùng chủ đề dân gian mặc định cho cả hai nửa.
- Phong cách minh họa phẳng, nét viền mộc và bảng màu gợi tranh dân gian; không sao chép nguyên một tác phẩm có sẵn.
- Chỉ chọn một hệ họa tiết xuyên suốt như mây, sóng hoặc hình học trống đồng. Không trộn quá nhiều biểu tượng văn hóa trên cùng màn hình.
- Giữ vùng chơi sạch và tương phản cao; họa tiết chỉ dùng ở nền, viền hoặc mặt lưng bài.

### Bảng màu đề xuất

| Vai trò | Màu | Mã |
|---|---|---|
| Nền giấy dó | Kem ấm | `#F2E2BD` |
| Màu chủ đạo | Đỏ son | `#A3342F` |
| Điểm nhấn | Vàng nghệ | `#D39A2C` |
| Phụ trợ | Xanh chàm | `#31566B` |
| Chữ và nét viền | Nâu mực | `#2C2118` |
| Trạng thái hợp lệ | Xanh lá trầm | `#386B4B` |

Màu thắng/thua phải đi cùng chữ và biểu tượng, không dựa riêng vào đỏ hoặc xanh.

### Thiết kế lá bài

- **Búa:** minh họa bàn tay nắm lại; không dùng hình cây búa để tránh sai nghĩa oẳn tù tì.
- **Bao:** minh họa bàn tay mở hoặc tờ giấy cách điệu.
- **Kéo:** minh họa kéo thủ công với hình dáng dễ nhận biết.
- Mỗi loại có hình, chữ và ký hiệu riêng để vẫn phân biệt được khi màn hình tối hoặc người chơi khó nhận màu.
- Mặt lưng dùng một họa tiết duy nhất và tuyệt đối không để lộ loại bài.
- Lá đang chọn nâng nhẹ, có viền vàng nghệ; lá đã khóa đóng dấu son **Đã chọn**.
- Bài trong thùng rác giảm độ bão hòa nhưng vẫn đọc rõ loại và thứ tự lượt.

### Gợi ý theo màn hình

#### Trang chủ

- Nền giấy dó hoặc cảnh sân đình được làm mờ nhẹ.
- Logo đặt như một con dấu hoặc biển gỗ.
- Hai hành động chính **Chơi với bot** và **Phòng online** dùng nút lớn, không dùng chữ thư pháp cho nội dung nhỏ.
- Giữ quảng cáo tách khỏi ngôn ngữ hình ảnh của phần thưởng để người chơi không hiểu nhầm.

#### Danh sách phòng

- Đây là một hub phòng riêng, không phải danh sách khám phá phòng công khai.
- Khi chưa có phòng, hiển thị trạng thái trống rõ ràng cùng nút **Tạo phòng**
  và ô nhập mã có nút **Vào phòng**.
- Khi có phiên còn reconnect được, hiển thị một dòng phòng hiện tại với mã,
  trạng thái và hành động quay lại phòng.
- **Tạo phòng** và **Vào phòng** giữ nguyên thứ tự quảng cáo/kiểm tra đã mô tả;
  lỗi mã, phòng đầy hoặc hết hạn hiển thị ngay tại màn hình này.
- Không thêm tìm kiếm, bộ lọc, phân trang hoặc API liệt kê toàn bộ phòng trong MVP.

#### Lobby phòng

- Hai vị trí người chơi thể hiện như hai tấm thẻ tên đối diện nhau.
- Mã phòng đặt trên một mảnh giấy hoặc thẻ tre, có nút sao chép rõ ràng.
- Trạng thái **Đang chờ đối thủ** dùng chuyển động nhẹ của cờ hội hoặc đèn lồng; không cần animation phức tạp.

#### Draft lá úp

- Ba lá được xào rồi trải giữa chiếu.
- Người được chọn trước có dòng hướng dẫn **Mời bạn chọn một lá**.
- Khi đối thủ chọn, chỉ rung nhẹ hoặc hạ một lá xuống; không tiết lộ mặt bài.
- Lá người chơi nhận lật riêng ở phía mình, sau đó nhập vào tay bài.
- Lá thứ ba trượt khỏi bàn mà không lật.

#### Bàn đấu

- Nửa trên thuộc đối thủ, gồm tên, điểm, bài úp và thùng rác của đối thủ.
- Nửa dưới thuộc người chơi, gồm tên, điểm, tay bài và thùng rác của mình.
- Một đường phân cách rõ nhưng mảnh nằm giữa hai chủ đề.
- Khu vực lật bài nằm trên đường phân cách và dùng nền trung tính để hai chủ đề không làm sai màu lá bài.
- Điểm số trình bày như bảng gỗ nhỏ: `Bạn 2 — 1 Đối thủ`.
- Thùng rác nằm hai bên, hiển thị các lá đã đánh theo thứ tự.
- Một lượt chỉ có nút chính **Khóa bài**; không thêm menu hoặc nút trang trí không có tác dụng.

### Hệ thống chủ đề bàn đấu

#### MVP

- Cả hai nửa dùng `Dân gian mặc định`.
- Chủ đề được viết trực tiếp trong component bàn đấu; chưa cần theme registry, inventory hoặc API cửa hàng.
- Hai nửa có thể lật hoặc thay đổi nhẹ bố cục họa tiết để tránh cảm giác là một ảnh nền bị cắt đôi.
- Chủ đề chỉ thay đổi hình thức, không ảnh hưởng kích thước lá, vùng chạm, thời gian hoặc luật chơi.

#### Giai đoạn sau

- Mỗi người chọn một chủ đề đang sở hữu trước khi vào trận.
- Client đối thủ chỉ cần nhận mã chủ đề đã chọn và tải asset tương ứng.
- Ví dụ một nửa dùng **Dân gian**, nửa còn lại dùng **Hiện đại**.
- Chủ đề có thể thay đổi nền, viền, bảng tên, hiệu ứng môi trường và âm thanh ngắn.
- Không cho chủ đề che bài, giả nút bấm hoặc làm thay đổi độ dễ đọc.
- Chủ đề có thể bán trực tiếp hoặc mở bằng tiến trình, nhưng không tạo lợi thế gameplay.
- Nếu asset chủ đề lỗi hoặc chưa tải xong, tự động dùng `Dân gian mặc định`.

#### Kết quả

- Kết quả xuất hiện như một dải tranh cuộn hoặc bảng hội làng.
- Thắng: dấu son **Thắng trận** và hiệu ứng giấy/pháo giấy ngắn.
- Thua: dùng thông điệp trung tính **Kết thúc trận**; không làm màn hình tối hoặc mang cảm giác trừng phạt.
- Hiển thị thống kê bốn lượt trước các hành động **Đấu lại** và **Về trang chủ**.
- Không hiển thị quảng cáo tại màn hình này trong MVP.

### Chữ và âm thanh

- Font tiêu đề có thể mang nét viết tay hoặc biển gỗ, nhưng phải hỗ trợ đầy đủ tiếng Việt.
- Nội dung, điểm số và nút dùng sans-serif rõ ràng; không dùng font thư pháp cho đoạn dài.
- MVP chỉ cần bốn âm thanh ngắn: xào bài, khóa bài, lật bài và kết quả.
- Có thể dùng tiếng trống hoặc mõ rất ngắn làm điểm nhấn; nhạc nền và phối khí dân gian đầy đủ chuyển sang giai đoạn sau.

### Triển khai tối thiểu

- Dùng `View`, `ImageBackground` và Reanimated; chưa cần Skia hoặc Rive.
- Bộ asset MVP:
  - Ba mặt bài Bao, Búa, Kéo.
  - Một mặt lưng bài.
  - Một bộ nền nửa bàn dân gian có biến thể trên/dưới.
  - Một nền trung tính cho vùng lật bài ở giữa.
  - Một bộ nút, khung điểm và dấu son.
  - Bốn hiệu ứng âm thanh ngắn.
- Nén texture, tránh nền có quá nhiều chi tiết và kiểm tra vùng an toàn trên màn hình dọc Android/iOS.
- Hỗ trợ giảm chuyển động; mọi animation quan trọng phải có trạng thái cuối rõ ràng khi bị tắt.

### Hoàn thành phần giao diện khi

- Nhận ra đúng Bao, Búa và Kéo trong dưới một giây mà không cần dựa vào màu.
- Chữ tiếng Việt không bị cắt trên các tỷ lệ màn hình dọc phổ biến.
- Người chơi luôn biết đang chờ draft, chọn bài, khóa bài hay xem kết quả.
- Nhìn rõ ranh giới giữa nửa bàn của mình, nửa bàn đối thủ và vùng lật bài chung.
- Họa tiết dân gian không làm giảm khả năng đọc bài, điểm số hoặc nút chính.
- Không có thành phần trang trí giả nút bấm.

## 9. Definition of Done cho MVP

- Android và iOS dùng chung luật từ `game-core`.
- Một người tạo phòng, người kia vào bằng mã và cả hai chơi xong trận.
- Draft luôn cấp hai lá bổ sung khác loại và không lộ thông tin bí mật.
- Server là nguồn sự thật duy nhất cho phase, bài, điểm và kết quả.
- Reconnect hoạt động trong thời gian cho phép.
- Mỗi người chỉ gặp tối đa một interstitial tại điểm vào luồng phòng.
- Quảng cáo lỗi không làm hỏng hoặc chặn luồng.
- Hai nửa bàn đều hiển thị đúng chủ đề dân gian mặc định.
- Không có thẻ Khiên, rewarded hoặc quảng cáo sau trận trong build MVP.

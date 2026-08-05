Để biến ý tưởng hiện tại thành một **game mobile hoàn chỉnh có thể phát hành trên Google Play và App Store**, bạn không chỉ cần màn hình chơi Bao–Búa–Kéo mà phải xây dựng đồng thời sáu hệ thống:

> **Gameplay hoàn chỉnh + ứng dụng mobile + máy chủ realtime + hệ thống vận hành + kiếm tiền + quy trình phát hành.**

Với dự án của bạn, tôi chốt hướng:

* Android và iOS.
* React Native + Expo Prebuild.
* Reanimated + Gesture Handler + Skia.
* Node.js + Colyseus.
* Supabase/PostgreSQL.
* Rewarded Ads là quảng cáo chính.
* Game server có quyền quyết định tuyệt đối.

---

# 1. Tài liệu cần hoàn thành trước khi lập trình

## 1.1 Game Design Document

Đây là tài liệu mô tả toàn bộ luật chơi.

Cần chốt rõ:

* Mỗi người bắt đầu bằng những lá nào.
* Ba lá úp trên bàn được tạo thế nào.
* Người nào được chọn trước.
* Có nhìn thấy vị trí đối thủ chọn không.
* Thời gian draft.
* Thời gian chuẩn bị.
* Thời gian chọn bài.
* Khi hết giờ thì xử lý thế nào.
* Cách tính điểm.
* Cách xử lý hòa.
* Luật thùng rác.
* Luật xáo bài.
* Điều kiện dùng Do thám.
* Điều kiện dùng Tái chế.
* Mỗi trận có bao nhiêu thẻ hỗ trợ.
* Người mất mạng bị xử lý thế nào.
* Khi nào được đầu hàng.

Nếu các nội dung này chưa chốt, client và server sẽ thường xuyên phải sửa lại.

## 1.2 Economy Design

Mô tả tài nguyên ngoài trận:

* Vàng dùng để làm gì.
* XP và cấp độ.
* Vé sự kiện.
* Cosmetic.
* Nhiệm vụ ngày.
* Phần thưởng thắng/thua.
* Rewarded Ads thưởng bao nhiêu.
* Giá Remove Ads.
* Giá skin và bundle.

## 1.3 UI/UX Flow

Cần có luồng màn hình:

```text
Splash
→ Đăng nhập
→ Tutorial
→ Trang chủ
→ Chọn chế độ
→ Matchmaking
→ Draft
→ Bàn đấu
→ Kết quả
→ Nhận thưởng
→ Chơi tiếp hoặc về trang chủ
```

## 1.4 Technical Design Document

Tài liệu kỹ thuật phải chốt:

* Kiến trúc client/server.
* Message WebSocket.
* State machine.
* Database schema.
* Authentication.
* Reconnect.
* Timeout.
* Analytics.
* Ads.
* Crash reporting.
* Deployment.

---

# 2. Gameplay lõi hoàn chỉnh

## 2.1 Chế độ Classic

Đây phải là gameplay đầu tiên được hoàn thiện.

Mỗi người có:

* 1 Bao.
* 1 Búa.
* 1 Kéo.
* 1 lá bổ sung được chọn từ ba lá úp chung.

Trong mỗi lượt:

1. Chuẩn bị.
2. Sắp xếp hoặc xáo bài.
3. Chọn một lá.
4. Khóa lựa chọn.
5. Hai bên mở bài.
6. Server tính kết quả.
7. Hai lá vào thùng rác.
8. Sang lượt tiếp theo.

Sau bốn lượt:

* Người nhiều điểm hơn thắng.
* Ranked có Sudden Death nếu hòa.
* Casual có thể cho phép hòa.

## 2.2 Chế độ Tactical

Được phát triển sau khi Classic ổn định.

Ban đầu chỉ nên có:

* Do thám.
* Tái chế.

Không nên phát triển ngay 10–20 thẻ vì rất khó cân bằng.

## 2.3 Tutorial

Tutorial phải dạy lần lượt:

1. Bao thắng Búa.
2. Búa thắng Kéo.
3. Kéo thắng Bao.
4. Chọn lá bổ sung.
5. Sắp xếp bài.
6. Chọn và khóa bài.
7. Bài đã dùng vào thùng rác.
8. Đếm bài còn lại.
9. Do thám.
10. Tái chế.

Tutorial nên cho người chơi thao tác, không chỉ đọc chữ.

## 2.4 Bot

Bot là tính năng bắt buộc, không phải tính năng phụ.

Bot dùng để:

* Tutorial.
* Luyện tập.
* Test gameplay.
* Lấp matchmaking khi ít người.
* Tự động chạy hàng nghìn trận để kiểm tra cân bằng.

Cấp độ:

* Easy: chọn ngẫu nhiên.
* Medium: ghi nhớ thùng rác.
* Hard: tính xác suất bài còn lại và đọc xu hướng.

Không cần machine learning. Bot theo luật là đủ.

---

# 3. Ứng dụng mobile

## 3.1 Công nghệ

```text
Expo Prebuild
React Native
TypeScript
Expo Router hoặc React Navigation
Gesture Handler
Reanimated
React Native Skia
Zustand
TanStack Query
Colyseus client
Supabase Auth
Sentry
Google Mobile Ads
```

## 3.2 Những màn hình cần có

### Nhóm khởi động

* Splash.
* Kiểm tra phiên bản.
* Maintenance.
* Bắt buộc cập nhật.
* Tải cấu hình từ xa.
* Khôi phục phiên đăng nhập.

### Nhóm tài khoản

* Chơi với tư cách khách.
* Google Sign-In.
* Sign in with Apple.
* Liên kết tài khoản khách.
* Đổi tên.
* Chọn avatar.
* Xóa tài khoản.
* Chính sách riêng tư.
* Điều khoản sử dụng.

### Nhóm trang chủ

* Quick Match.
* Đấu với bot.
* Ranked.
* Phòng riêng.
* Nhiệm vụ.
* Shop.
* Leaderboard.
* Profile.
* Settings.
* Inbox/phần thưởng.

### Nhóm matchmaking

* Bắt đầu tìm.
* Hiển thị trạng thái.
* Hủy tìm.
* Không cho queue hai lần.
* Ghép bot khi chờ lâu.
* Xử lý app vào background.
* Thông báo khi đã tìm thấy trận.

### Nhóm gameplay

* Draft ba lá úp.
* Tay bài của mình.
* Bài úp đối thủ.
* Sắp xếp bằng kéo thả.
* Xáo bài.
* Chọn bài.
* Khóa bài.
* Đồng hồ đếm ngược.
* Điểm số.
* Thùng rác hai bên.
* Lịch sử lượt.
* Thẻ hỗ trợ.
* Hiệu ứng thắng/thua/hòa.
* Mất kết nối và reconnect.
* Đầu hàng.
* Emote giới hạn.

### Nhóm sau trận

* Kết quả.
* Điểm thưởng.
* XP.
* Thay đổi rank.
* X2 vàng bằng quảng cáo.
* Đấu lại.
* Thêm bạn.
* Báo cáo người chơi.
* Về trang chủ.

---

# 4. Animation và trải nghiệm hình ảnh

## Reanimated và Gesture Handler

Dùng cho:

* Kéo lá.
* Đổi thứ tự.
* Nâng lá được chọn.
* Đặt lá ra bàn.
* Chuyển lá sang thùng rác.
* Layout animation.
* Countdown.
* Modal trong trận.

## Skia

Dùng cho:

* Lật lá bài.
* Highlight.
* Glow.
* Blur.
* Particle.
* Vệt chuyển động.
* Hiệu ứng Do thám.
* Hiệu ứng Tái chế.
* Hiệu ứng thắng/thua.
* Shader nhẹ.

## Âm thanh

Cần ít nhất:

* Âm thanh chạm lá.
* Kéo và thả.
* Xáo bài.
* Khóa lựa chọn.
* Lật bài.
* Bao/Búa/Kéo va chạm.
* Thắng lượt.
* Thua lượt.
* Hòa.
* Thắng trận.
* Thua trận.
* Đồng hồ sắp hết.
* Do thám.
* Tái chế.

Cần có:

* Music volume.
* SFX volume.
* Haptic bật/tắt.
* Tự giảm âm thanh khi app vào background.

---

# 5. Game server realtime

Đây là phần quan trọng nhất đối với game PvP.

## 5.1 Server authoritative

Client chỉ được gửi hành động:

```json
{
  "type": "LOCK_CARD",
  "cardId": "card_123"
}
```

Client không được gửi:

```json
{
  "type": "ROUND_RESULT",
  "result": "WIN"
}
```

Server tự xác định:

* Lá có thuộc người chơi không.
* Lá còn trên tay không.
* Có đúng lượt không.
* Người chơi đã khóa chưa.
* Kết quả thắng/thua.
* Điểm số.
* Trận đã kết thúc chưa.

## 5.2 State machine

```text
WAITING_FOR_PLAYERS
→ INITIALIZING
→ DRAFT_SELECTION
→ ROUND_PREPARATION
→ SUPPORT_ACTION
→ CARD_SELECTION
→ CARD_REVEAL
→ ROUND_RESULT
→ MATCH_RESULT
```

Server chỉ nhận hành động hợp lệ trong phase tương ứng.

## 5.3 Room 1v1

Mỗi trận là một room riêng:

* Tối đa hai người chơi.
* Có session ID.
* Có ruleset version.
* Có reconnect token.
* Có deadline cho từng phase.
* Có log sự kiện.
* Có trạng thái public và private riêng.

## 5.4 Che giấu thông tin

Người chơi A được nhận:

* Toàn bộ lá của A.
* Số lá còn lại của B.
* Mặt lưng các lá B.

Không được nhận loại bài thật của B.

Server phải tạo DTO khác nhau cho từng người chơi. Không gửi toàn bộ state rồi trông chờ client tự giấu.

## 5.5 Timeout

Server quản lý deadline.

Ví dụ:

| Giai đoạn    | Thời gian |
| ------------ | --------: |
| Draft        |    8 giây |
| Chuẩn bị     |    6 giây |
| Dùng thẻ     |    5 giây |
| Chọn bài     |    8 giây |
| Mở bài       |    2 giây |
| Kết quả lượt |    2 giây |

Client chỉ hiển thị thời gian server cung cấp.

## 5.6 Reconnect

Cần xử lý các tình huống:

* App vào background.
* Chuyển Wi-Fi sang 4G.
* Mất mạng ngắn.
* WebSocket bị đóng.
* App bị hệ điều hành suspend.
* App crash rồi mở lại.

Luật đề xuất:

* Giữ chỗ 20–30 giây.
* Client dùng reconnect token.
* Server gửi lại snapshot đầy đủ.
* Nếu hết giờ chọn bài, server tự xử lý theo luật.
* Nếu quá thời gian reconnect, xử thua.

## 5.7 Matchmaking

Matchmaking cần:

* Không cho một người vào nhiều queue.
* Ghép theo mode.
* Ghép theo region.
* Sau này ghép theo MMR.
* Mở rộng phạm vi MMR theo thời gian.
* Bot fallback.
* Hủy queue khi app đóng hoặc mất kết nối lâu.

---

# 6. Backend dữ liệu

## Authentication

Có thể dùng Supabase Auth:

* Guest/anonymous.
* Google.
* Apple.
* Email OTP.
* Liên kết anonymous với tài khoản chính.

## Database cơ bản

### `profiles`

```text
id
display_name
avatar_id
level
experience
soft_currency
created_at
updated_at
```

### `matches`

```text
id
mode
status
winner_id
ruleset_version
started_at
ended_at
duration
```

### `match_players`

```text
match_id
player_id
seat
score
mmr_before
mmr_after
disconnect_count
result
```

### `match_rounds`

```text
match_id
round_number
player_1_card
player_2_card
winner_id
support_actions
```

### `player_inventory`

```text
player_id
item_id
quantity
acquired_at
```

### `missions`

```text
id
mission_type
target_value
reward_type
reward_amount
start_at
end_at
```

### `player_missions`

```text
player_id
mission_id
progress
claimed_at
```

### `transactions`

Lưu mọi thay đổi tài nguyên:

```text
id
player_id
currency
amount
reason
reference_id
created_at
```

Không nên chỉ cập nhật số vàng mà không có lịch sử giao dịch.

---

# 7. Hệ thống rank

Rank nên làm sau khi gameplay ổn định.

## Cấu trúc đề xuất

* Bronze.
* Silver.
* Gold.
* Platinum.
* Diamond.
* Master.

Bên dưới dùng MMR số.

Sau trận:

* Thắng: tăng MMR.
* Thua: giảm MMR.
* Hòa: thay đổi ít hoặc không đổi.
* Đấu bot: không tính rank.
* Đầu hàng: tính thua.
* Disconnect quá lâu: tính thua.

Cần chống:

* Hai tài khoản cố tình farm nhau.
* Tạo nhiều tài khoản mới.
* Win trading.
* Thoát trận để tránh mất điểm.
* Ghép lại cùng đối thủ liên tục.

---

# 8. Kinh tế và vật phẩm

## Hai loại tiền là đủ

### Vàng

Có được từ:

* Chơi trận.
* Nhiệm vụ.
* Rewarded Ads.
* Sự kiện.

Dùng để:

* Mua cosmetic cơ bản.
* Đổi mặt lưng bài.
* Mua emote.
* Mua hiệu ứng thông thường.

### Premium currency

Có được từ:

* In-app purchase.
* Battle Pass.
* Một số thành tích hiếm.

Dùng để:

* Skin cao cấp.
* Bundle.
* Hiệu ứng giới hạn.
* Season Pass.

Không được dùng premium currency để mua lợi thế Ranked.

## Inventory

Các loại vật phẩm:

* Avatar.
* Frame.
* Card back.
* Card border.
* Table theme.
* Discard effect.
* Shuffle effect.
* Reveal effect.
* Win effect.
* Emote.
* Title.

---

# 9. Nhiệm vụ và giữ chân người chơi

## Daily mission

Ví dụ:

* Chơi ba trận.
* Thắng một trận.
* Dùng đủ ba loại bài.
* Thắng bằng Bao hai lần.
* Xáo bài ba lần.
* Dùng Do thám.
* Chơi với bạn bè.

## Weekly mission

* Chơi 20 trận.
* Thắng 10 trận.
* Đạt chuỗi thắng ba.
* Thắng bằng Sudden Death.
* Hoàn thành năm nhiệm vụ ngày.

## Daily login

Không cần quá phức tạp:

* Ngày 1–6: vàng hoặc cosmetic fragment.
* Ngày 7: rương cosmetic.

## Season

Một mùa có thể kéo dài 4–8 tuần:

* Reset mềm rank.
* Nhiệm vụ mùa.
* Cosmetic theo chủ đề.
* Leaderboard mùa.
* Season Pass.

Không nên xây Season Pass trước khi có retention tốt.

---

# 10. Quảng cáo

## Rewarded Ads

Nên là quảng cáo chính:

* X2 vàng sau trận.
* Đổi nhiệm vụ.
* Nhận thêm vé sự kiện.
* Giảm thời gian mở rương.
* Dùng thử cosmetic.
* Nhận quà miễn phí hằng ngày.

Không dùng quảng cáo để:

* Xem bài đối thủ trong Ranked.
* Nhận thêm thẻ hỗ trợ.
* Hủy kết quả thua.
* Cộng rank.
* Có thêm lượt.

## Interstitial

Chỉ nên hiển thị:

* Sau mỗi 3–4 trận Casual.
* Khi người chơi rời màn hình kết quả về trang chủ.
* Không hiển thị ngay sau Rewarded Ads.
* Không hiển thị trong các trận đầu của người chơi mới.
* Không hiển thị trong Ranked nếu muốn trải nghiệm cao cấp hơn.

## Remove Ads

Gói mua một lần:

* Tắt interstitial.
* Tắt banner/native.
* Rewarded Ads vẫn tồn tại vì là tự nguyện.
* Kèm cosmetic hoặc vàng.

## Ads state machine

Cần có một module quyết định quảng cáo:

```ts
type AdContext = {
  matchesSinceInterstitial: number;
  minutesSinceLastInterstitial: number;
  rewardedJustShown: boolean;
  isNewPlayer: boolean;
  isInMatch: boolean;
  isReconnecting: boolean;
  hasRemoveAds: boolean;
};
```

Không gọi quảng cáo rải rác trực tiếp trong từng màn hình.

---

# 11. In-app purchase

Cần:

* Premium currency.
* Remove Ads.
* Cosmetic bundle.
* Starter Pack.
* Season Pass sau này.

Server phải xác minh receipt/token từ store trước khi cấp vật phẩm.

Không được chỉ dựa vào callback thành công phía client.

Cần xử lý:

* Restore Purchases trên iOS.
* Pending purchase trên Android.
* Mua trùng.
* Refund.
* Subscription renewal nếu sau này có subscription.
* Mất mạng sau khi thanh toán.
* App bị đóng giữa giao dịch.

---

# 12. Analytics

## Funnel chính

```text
Cài game
→ Mở lần đầu
→ Hoàn thành tutorial
→ Chơi bot
→ Bắt đầu PvP
→ Hoàn thành PvP
→ Chơi trận thứ hai
→ Quay lại ngày hôm sau
```

## Gameplay events

* `tutorial_started`
* `tutorial_completed`
* `matchmaking_started`
* `match_found`
* `match_started`
* `draft_card_selected`
* `hand_shuffled`
* `card_locked`
* `round_finished`
* `support_card_used`
* `match_finished`
* `match_abandoned`
* `reconnect_started`
* `reconnect_success`

## Economy events

* Currency earned.
* Currency spent.
* Item purchased.
* Reward claimed.
* Mission completed.
* Rewarded ad completed.
* IAP verified.

## Chỉ số quan trọng

* Tutorial completion rate.
* Matchmaking success rate.
* Match completion rate.
* Rematch rate.
* Average session duration.
* Trận mỗi phiên.
* D1/D7/D30 retention.
* Tỷ lệ disconnect.
* Tỷ lệ thắng theo loại bài.
* Lợi thế người draft trước.
* Doanh thu quảng cáo trên người chơi.
* Tỷ lệ mua Remove Ads.
* Tỷ lệ payer.

---

# 13. Remote Config

Cần thay đổi từ server mà không phát hành app mới:

* Thời gian từng phase.
* Phần thưởng.
* Tần suất interstitial.
* Bot fallback timeout.
* Danh sách thẻ Tactical.
* Giá cosmetic.
* Mission.
* Event.
* Maintenance mode.
* Minimum app version.
* Bật/tắt mode.
* Tỷ lệ rollout tính năng.

Tất cả ruleset trận đấu phải có version:

```text
classic_v1
tactical_v1
ranked_s1_v2
```

Một trận đang chạy không được đổi luật giữa chừng khi remote config cập nhật.

---

# 14. Admin dashboard

Để vận hành game, cần dashboard quản trị.

## Live operations

* Người online.
* Queue đang chờ.
* Trận đang chạy.
* Server health.
* Matchmaking latency.
* Tỷ lệ lỗi.
* Tỷ lệ reconnect.
* Maintenance mode.

## Người chơi

* Tìm theo ID.
* Xem profile.
* Xem lịch sử trận.
* Xem lịch sử tài nguyên.
* Ban/unban.
* Mute.
* Xử lý báo cáo.
* Cấp bù vật phẩm có log.

## Game configuration

* Timeout.
* Phần thưởng.
* Ads frequency.
* Mission.
* Shop.
* Event.
* Thẻ Tactical.
* Ruleset.
* App version bắt buộc.

## Cân bằng

* Win rate theo lá draft.
* Win rate người đi trước.
* Win rate từng thẻ hỗ trợ.
* Tỷ lệ hòa.
* Tỷ lệ Sudden Death.
* Thời gian chọn bài.
* Tần suất xáo bài.

---

# 15. Hệ thống báo cáo và an toàn cộng đồng

Dù game đơn giản, vẫn nên có:

* Báo cáo tên không phù hợp.
* Báo cáo hành vi AFK.
* Báo cáo spam emote.
* Chặn người chơi.
* Mute emote.
* Danh sách từ bị cấm trong tên.
* Rate limit đổi tên.
* Không có chat tự do ở MVP.

Emote có sẵn an toàn hơn chat text.

---

# 16. Bảo mật

## Client

* Không lưu secret trong app.
* Access token trong secure storage.
* Certificate pinning có thể cân nhắc sau.
* Không tin dữ liệu cache để tính phần thưởng.
* Không để debug menu trong production.

## Server

* Xác minh token.
* Rate limit.
* Validate schema message.
* Idempotency cho giao dịch.
* Log hành động bất thường.
* Không gửi private hand cho đối thủ.
* Không cho client tự random.
* Không cho client tự tính điểm.
* Không cấp vật phẩm từ callback client.

## Chống cheat

Game này không cần anti-cheat cấp kernel. Chủ yếu cần:

* Server authoritative.
* Sequence number.
* Match state validation.
* Rate limiting.
* Replay log.
* Phát hiện request không hợp lệ.
* Phát hiện hai tài khoản farm nhau.

---

# 17. Chất lượng và testing

## Unit test

* Luật Bao–Búa–Kéo.
* Draft.
* Thùng rác.
* Xáo bài.
* Do thám.
* Tái chế.
* Điểm số.
* Sudden Death.
* Timeout.

## Integration test

* Hai client vào cùng room.
* Chọn bài đồng thời.
* Một người disconnect.
* Hai người reconnect.
* Một người đầu hàng.
* Server restart.
* Match result lưu database.

## Bot simulation

Chạy hàng chục nghìn trận để tìm:

* Deadlock.
* State không thể kết thúc.
* Lá xuất hiện ở hai nơi.
* Điểm sai.
* Người chọn trước có lợi quá lớn.
* Thẻ hỗ trợ có win rate bất thường.

## Mobile testing

Phải kiểm tra:

* Android RAM thấp.
* Máy màn hình nhỏ.
* Tablet.
* Tai thỏ và Dynamic Island.
* Android gesture navigation.
* App background/foreground.
* Mạng chậm.
* Chuyển Wi-Fi/4G.
* Cuộc gọi đến.
* Khóa màn hình.
* Low-power mode.
* Âm thanh Bluetooth.

## Performance target

* 60 FPS trong bàn đấu.
* Không drop frame khi xáo/lật bài.
* Thời gian mở app hợp lý.
* Memory không tăng liên tục sau nhiều trận.
* Không preload toàn bộ cosmetic.
* Asset tải theo nhóm.

---

# 18. Monitoring và vận hành

Cần theo dõi:

* Crash.
* ANR Android.
* JS exception.
* Native exception.
* WebSocket disconnect.
* Server CPU/RAM.
* Room count.
* Queue time.
* Database latency.
* Ads load failure.
* Purchase verification failure.

Công cụ có thể dùng:

* Sentry.
* OpenTelemetry.
* Grafana.
* Prometheus.
* Loki hoặc logging tập trung.
* Supabase logs.
* Uptime monitoring.

Cần alert khi:

* Matchmaking lỗi tăng.
* Server không tạo room.
* Tỷ lệ disconnect tăng.
* Database unavailable.
* Purchase validation lỗi.
* Phiên bản app mới crash cao.

---

# 19. CI/CD

## Mobile

* Lint.
* Type check.
* Unit test.
* Build development.
* Build preview/internal.
* Build production.
* Upload TestFlight.
* Upload Google Play Internal Testing.
* Source map upload.
* Versioning tự động.

## Server

* Unit test.
* Integration test.
* Docker build.
* Migration check.
* Deploy staging.
* Smoke test.
* Deploy production.
* Rollback.

## Môi trường

Tối thiểu:

```text
Development
Staging
Production
```

Mỗi môi trường dùng:

* Database riêng.
* Supabase project riêng hoặc schema riêng.
* Game server URL riêng.
* Ad unit riêng.
* Analytics environment riêng.

Không dùng production AdMob unit khi development.

---

# 20. Store và pháp lý

## Google Play

Cần chuẩn bị:

* Tài khoản developer.
* App signing.
* Privacy Policy.
* Data Safety.
* Content rating.
* Ads declaration.
* In-app purchase products.
* Internal testing.
* Closed/open testing nếu cần.
* Store listing.
* Screenshots.
* Feature graphic.
* App icon.

## App Store

Cần:

* Apple Developer Account.
* Bundle ID.
* App Store Connect.
* Sign in with Apple nếu có đăng nhập bên thứ ba theo trường hợp áp dụng.
* Privacy Nutrition Labels.
* ATT nếu SDK có tracking.
* In-app purchase.
* Restore purchase.
* TestFlight.
* Screenshots theo kích thước thiết bị.
* App Review notes.
* Account deletion trong ứng dụng nếu có tài khoản.

## Tài liệu pháp lý

* Privacy Policy.
* Terms of Service.
* Community Rules.
* Refund/in-app purchase notice.
* Account deletion policy.
* Liên hệ hỗ trợ.
* Chính sách trẻ em nếu nhắm đến trẻ em.

Cần xác định độ tuổi mục tiêu sớm vì ảnh hưởng quảng cáo, tracking, nội dung và store declaration.

---

# 21. Đội ngũ tối thiểu

Một người có thể làm prototype, nhưng game hoàn chỉnh thường cần:

## Tối thiểu

* 1 React Native developer.
* 1 backend/game server developer.
* 1 UI/UX designer.
* 1 game artist/animator part-time.
* 1 QA part-time.
* 1 product/game designer, có thể kiêm bởi founder.

## Nếu một mình làm

Bạn có thể tự làm:

* React Native.
* Game logic.
* Backend cơ bản.
* Bot.
* Admin đơn giản.

Nên thuê ngoài:

* Bộ nhận diện.
* Thiết kế lá bài.
* Animation.
* Âm thanh.
* Store artwork.
* QA thiết bị iOS/Android.

---

# 22. Asset cần sản xuất

## Hình ảnh

* Logo.
* App icon.
* Splash.
* Ba loại bài.
* Mặt lưng bài.
* Bàn đấu.
* Thùng rác.
* Avatar mặc định.
* Button và icon.
* Hiệu ứng Do thám.
* Hiệu ứng Tái chế.
* Win/lose/draw.
* Rank badges.
* Shop thumbnails.
* Store screenshots.

## Animation

* Phát bài.
* Chọn draft.
* Xáo bài.
* Kéo thả.
* Khóa bài.
* Lật bài.
* Va chạm Bao–Búa–Kéo.
* Bỏ bài.
* Do thám.
* Tái chế.
* Victory.
* Defeat.

## Audio

* Nhạc trang chủ.
* Nhạc trận.
* UI sound.
* Card sound.
* Skill sound.
* Win/lose sound.

Phải kiểm tra license đầy đủ cho mọi asset mua ngoài.

---

# 23. Các giai đoạn phát triển

## Giai đoạn 1 — Rule prototype

Chỉ cần:

* Game engine TypeScript.
* Bốn lượt.
* Draft.
* Thùng rác.
* Bot ngẫu nhiên.
* Không animation phức tạp.

Mục tiêu: luật có thực sự vui không.

## Giai đoạn 2 — Vertical slice

Một lát cắt hoàn chỉnh:

* Login khách.
* Trang chủ đơn giản.
* Đấu bot.
* Một bàn đấu đẹp.
* Animation.
* Âm thanh.
* Màn kết quả.

Mục tiêu: chứng minh trải nghiệm hình ảnh.

## Giai đoạn 3 — Online alpha

* Colyseus.
* Phòng riêng.
* Quick Match.
* Reconnect.
* Timeout.
* Match history.
* Internal testing.

## Giai đoạn 4 — Closed beta

* Nhiệm vụ.
* Vàng.
* Cosmetic.
* Rewarded Ads.
* Interstitial.
* Analytics.
* Crash reporting.
* Remote Config.
* 100–1.000 người thử nghiệm.

## Giai đoạn 5 — Soft launch

Phát hành giới hạn ở một số thị trường hoặc nhóm nhỏ:

* Đo retention.
* Đo matchmaking.
* Đo quảng cáo.
* Cân bằng game.
* Tối ưu onboarding.
* Sửa crash.
* Điều chỉnh economy.

## Giai đoạn 6 — Launch

* Ranked.
* Season 1.
* Shop hoàn chỉnh.
* Remove Ads.
* LiveOps.
* Customer support.
* Marketing.

---

# 24. Điều kiện để được xem là “game hoàn chỉnh”

Không phải chỉ cần chơi được một trận. Bản phát hành tối thiểu nên đạt:

### Gameplay

* Tutorial hoàn chỉnh.
* Bot.
* PvP.
* Reconnect.
* Timeout.
* Thắng/thua/hòa.
* Không có lỗi phá trận.

### Sản phẩm

* Guest login.
* Profile.
* Match history.
* Nhiệm vụ.
* Phần thưởng.
* Cosmetic cơ bản.
* Settings.

### Kiếm tiền

* Rewarded Ads.
* Interstitial có giới hạn.
* Remove Ads hoặc Starter Pack.
* Receipt verification.

### Vận hành

* Analytics.
* Crash monitoring.
* Remote Config.
* Admin dashboard.
* Maintenance mode.
* Force update.
* Customer support.

### Phát hành

* Privacy Policy.
* Store listing.
* TestFlight.
* Google Play Testing.
* Data declarations.
* Account deletion.
* Store review compliance.

---

# 25. Phạm vi bản 1.0 hợp lý

Tôi đề xuất bản 1.0 không làm quá lớn.

## Chế độ

* Tutorial.
* Đấu bot.
* Classic Casual.
* Quick Match.
* Phòng riêng.
* Ranked cơ bản.

## Thẻ hỗ trợ

* Chưa đưa vào Ranked.
* Tactical Casual chỉ có Do thám và Tái chế.
* Có thể bật sau khi Classic đã ổn định.

## Cosmetic

* 5–10 mặt lưng bài.
* 3 bàn đấu.
* 10 avatar.
* 5 hiệu ứng.
* Một số emote.

## Economy

* Vàng.
* XP.
* Nhiệm vụ ngày.
* Daily login.

## Monetization

* Rewarded x2 vàng.
* Interstitial sau cụm trận.
* Remove Ads.
* Một Starter Pack.

## Vận hành

* Remote Config.
* Analytics.
* Sentry.
* Admin cơ bản.
* Force update.
* Maintenance.

---

# 26. Thứ tự triển khai tốt nhất

Đừng bắt đầu bằng shop, quảng cáo hoặc rank.

Thứ tự nên là:

1. Chốt luật bằng tài liệu.
2. Viết game engine thuần TypeScript.
3. Chạy bot simulation.
4. Làm prototype đấu bot.
5. Kiểm tra game có vui.
6. Làm animation và UX.
7. Xây game server.
8. Làm phòng riêng.
9. Làm matchmaking.
10. Reconnect và timeout.
11. Login và lưu dữ liệu.
12. Analytics và monitoring.
13. Economy và nhiệm vụ.
14. Quảng cáo.
15. IAP.
16. Closed beta.
17. Soft launch.
18. Ranked và season.
19. Phát hành chính thức.

## Điểm cần ưu tiên nhất

Ba rủi ro lớn nhất của dự án không phải công nghệ:

* Gameplay có đủ vui sau 20–50 trận không.
* Matchmaking có đủ người để ghép nhanh không.
* Quảng cáo và economy có làm người chơi bỏ game không.

Vì vậy, bước quan trọng nhất tiếp theo là tạo **prototype đấu bot hoàn chỉnh**, rồi cho khoảng 10–30 người chơi thử trước khi đầu tư toàn bộ hệ thống thương mại.

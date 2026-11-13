# Play Console — khai báo (trả lời sẵn)

Dựa trên bản có: chơi với bot, chơi LAN, quét QR, quảng cáo AdMob (interstitial), không có tài khoản, không có máy chủ riêng.
**Nếu sau này bật lại "Phòng online" hoặc thêm đăng nhập/analytics thì phải khai lại.**

## App content
| Mục | Trả lời |
|---|---|
| Privacy policy | URL công khai của `privacy-policy.html` (xem README) |
| Ads | **Có**, ứng dụng chứa quảng cáo |
| App access | Mọi chức năng dùng được không cần đăng nhập |
| Content rating | Điền bảng IARC: thể loại Game; không bạo lực, không tình dục, không ngôn từ thô tục, không chất cấm, không cờ bạc/đánh bạc bằng tiền thật, không mua hàng, người dùng **không** trao đổi nội dung/tin nhắn với nhau, không chia sẻ vị trí → dự kiến 3+ / Everyone |
| Target audience | **13 tuổi trở lên** (chọn 13–15, 16–17, 18+). Không chọn nhóm dưới 13: có quảng cáo nên sẽ kéo theo chính sách Families |
| News app / COVID / Government / Financial / Health | Không |
| Data safety | Xem bảng dưới |
| Advertising ID | **Có** sử dụng — mục đích: Advertising or marketing (do Google Mobile Ads SDK) |

## Data safety
- Ứng dụng có thu thập hoặc chia sẻ dữ liệu người dùng không? **Có** (do SDK quảng cáo).
- Dữ liệu có được mã hoá khi truyền không? **Có** (AdMob dùng HTTPS).
- Người dùng có thể yêu cầu xoá dữ liệu không? Ứng dụng không có tài khoản; chọn theo hướng dẫn: không cung cấp cơ chế xoá riêng (dữ liệu trên máy xoá bằng gỡ app; dữ liệu quảng cáo quản lý qua Google).

| Loại dữ liệu | Thu thập | Chia sẻ | Bắt buộc | Mục đích |
|---|---|---|---|---|
| Location → Approximate location (suy từ IP) | Có | Có | Bắt buộc | Advertising or marketing; Fraud prevention |
| Device or other IDs (Advertising ID) | Có | Có | Bắt buộc | Advertising or marketing; Analytics; Fraud prevention |
| App activity → App interactions (tương tác quảng cáo) | Có | Có | Bắt buộc | Advertising or marketing; Analytics |
| App info and performance → Diagnostics | Có | Có | Bắt buộc | Analytics; Fraud prevention |
| Photos/videos, Camera | **Không** | Không | | Máy ảnh chỉ quét QR trên máy, không lưu, không gửi |
| Personal info, Financial, Contacts, Messages, Files, Health | Không | Không | | |

Đây là các mục Google công bố cho Google Mobile Ads SDK. Trước khi nộp, đối chiếu lại với trang "Google Mobile Ads SDK – Play data disclosure" hiện hành vì Google có thể cập nhật.

## Quyền trong bản build (đọc từ AAB ngày 13/11/2026, đã chặn các quyền thừa)
| Quyền | Vì sao | Ghi chú |
|---|---|---|
| INTERNET, ACCESS_NETWORK_STATE, ACCESS_WIFI_STATE, CHANGE_NETWORK_STATE | Quảng cáo, chơi LAN | Cần |
| CHANGE_WIFI_MULTICAST_STATE | Tìm phòng LAN (mDNS) | Cần |
| CAMERA | Quét QR vào phòng | Cần; chính sách quyền riêng tư đã nêu |
| VIBRATE, MODIFY_AUDIO_SETTINGS, WAKE_LOCK | Rung, âm thanh, giữ màn hình sáng cho chủ phòng LAN | Cần |
| ACCESS_ADSERVICES_AD_ID / ATTRIBUTION / TOPICS | Google Mobile Ads SDK thêm vào | Khớp với khai báo Advertising ID |
| USE_BIOMETRIC, USE_FINGERPRINT | `expo-secure-store` thêm vào; app không dùng sinh trắc học | Không phải thu thập dữ liệu; không cần khai |
| FOREGROUND_SERVICE, BIND_JOB_SERVICE, DUMP | Thư viện nền (WorkManager, profile installer) thêm vào | Không cần khai riêng |
| ~~READ/WRITE_EXTERNAL_STORAGE, SYSTEM_ALERT_WINDOW, RECORD_AUDIO~~ | Đã chặn trong `app.json` (`blockedPermissions`) | Đã gỡ khỏi bản build |

`targetSdkVersion 36`, `minSdkVersion 24` (Android 7.0 trở lên).

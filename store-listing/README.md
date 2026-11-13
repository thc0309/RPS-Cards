# Hồ sơ đưa Bao Búa Kéo lên Google Play

| File | Dùng ở đâu trong Play Console |
|---|---|
| `graphics/icon-512.png` | Store listing → App icon (512×512 PNG) |
| `graphics/feature-graphic-1024x500.png` | Store listing → Feature graphic (1024×500) |
| `screenshots/*.png` | Store listing → Phone screenshots (2–8 ảnh). **Chưa có**, xem mục Ảnh màn hình |
| `listing-vi.md` | Tên, mô tả ngắn, mô tả đầy đủ, "Có gì mới" – tiếng Việt (mặc định) |
| `listing-en.md` | Bản dịch en-US |
| `privacy-policy.html` | Nguồn của trang chính sách; bản đang đăng: https://thc0309.github.io/RPS-Cards/privacy-policy.html |
| `data-safety.md` | Trả lời sẵn cho App content: Ads, Content rating, Target audience, Data safety, Advertising ID |
| `capture-screenshots.sh` | Chụp và cắt ảnh màn hình đúng chuẩn Play |

## Thông tin chung
- Package: `com.stagoo.rpscards` — Phiên bản: `1.0.0` (versionCode `1`)
- Loại: **Game** — Danh mục: **Card** (Bài). Thẻ gợi ý: Card, Casual, Offline, Multiplayer
- Giá: Miễn phí — Có quảng cáo: Có — Mua trong ứng dụng: Không
- Quốc gia: tuỳ bạn (bắt đầu với Việt Nam). Phát hành ở EEA/Anh thì phải bật form đồng ý quảng cáo (UMP) trước
- Email liên hệ, tên nhà phát triển: **bạn điền** (cũng thay `[TÊN NHÀ PHÁT TRIỂN]`, `[EMAIL LIÊN HỆ]` trong hai file privacy policy)

## Ảnh màn hình (làm sau khi bản LAN xong)
Giao diện đang đổi (nút "Chơi LAN", sảnh có QR), nên chụp trên bản cuối để ảnh khớp với app nộp lên.
Mở app tới màn cần chụp rồi chạy:
```bash
store-listing/capture-screenshots.sh 01-home RFCW1082JJR
```
Nên có 6 ảnh, theo thứ tự: `01-home`, `02-draft` (lật lá phụ), `03-board` (đang chọn bài), `04-round-win` (banner thắng lượt),
`05-result`, `06-lan-lobby` (sảnh LAN có QR). Script cắt 1080×2340 thành 1080×2160 vì Play không nhận ảnh dài quá 2 lần chiều ngang.

## Chính sách quyền riêng tư: URL công khai
**https://thc0309.github.io/RPS-Cards/privacy-policy.html** (đang hoạt động, GitHub Pages từ nhánh `gh-pages`).
Nhánh `gh-pages` chỉ chứa `privacy-policy.html`, `index.html`, `.nojekyll`; không đăng gì khác của repo.
Cập nhật trang: sửa `store-listing/privacy-policy.html` rồi đẩy lại nội dung đó lên nhánh `gh-pages`.

## Thứ tự làm trên Play Console
1. Tạo app: tên "Bao Búa Kéo - Hội Làng", ngôn ngữ mặc định Tiếng Việt, Game, Free.
2. **Bật Play App Signing** (mặc định). Khoá trong `keystore/` là khoá upload.
3. App content: điền theo `data-safety.md` + URL chính sách quyền riêng tư.
4. Store listing: dán nội dung `listing-vi.md`, thêm bản dịch `listing-en.md`, tải icon, feature graphic, ảnh màn hình.
5. Testing → **Internal testing**: tải file `.aab`, thêm email người thử, cài qua link để kiểm.
6. Tài khoản cá nhân mới tạo: Google yêu cầu **Closed testing với ít nhất 12 người thử trong 14 ngày liên tục** trước khi được xin lên Production. Kiểm tra mục "Production access" trong Console của bạn để biết có áp dụng không.
7. Production: chọn quốc gia, gửi duyệt.
8. Sau khi app có trên store: vào AdMob liên kết app với bản trên Play, thêm `app-ads.txt` nếu có website.

## Trạng thái trước khi nộp (cập nhật 13/11/2026)
- [x] Bản LAN + QR đã vào bản `.aab`: `release/bao-bua-keo-1.0.0-1.aab` (ký bằng khoá upload, đủ 4 ABI, có quảng cáo thật, nút "Phòng online" đã ẩn)
- [x] Chặn quyền thừa (storage, overlay, ghi âm)
- [x] 6 ảnh màn hình trong `screenshots/`
- [x] Chính sách quyền riêng tư đã đăng, đã có tên và email
- [ ] Bạn: tạo app trên Play Console, tải file, điền nội dung (làm theo thứ tự ở trên)
- [ ] Hai máy thật thử LAN chưa chạy hết kịch bản (nhập địa chỉ, kết nối lại, chủ phòng mất kết nối) và chưa thử quét QR bằng camera. Nên tự thử trước khi phát hành rộng, hoặc phát hành Internal testing trước
- [ ] Mỗi lần tải bản mới lên Play phải tăng `android.versionCode` trong `mobile/app.json`
- [ ] Nếu phát hành ngoài Việt Nam (EEA/Anh): thêm form đồng ý quảng cáo UMP

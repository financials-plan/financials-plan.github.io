# Kiểm thử trình duyệt (Playwright)

Chạy: `npm run e2e` (cần Chromium và mạng cho CDN/axe-core). Không nằm trong `npm test`.
Mọi yêu cầu tới Firestore/Firebase Auth bị chặn và ghi lại, nên bộ này không đụng dữ liệu thật.

| Tệp | Nội dung |
|---|---|
| `t1_core.js` | Nạp trang, console, mạng, điều hướng đủ tab và 12 tháng, nhập liệu, công thức đối chiếu độc lập, khảo sát, giao diện tối |
| `t2_a11y.js` | axe-core (WCAG A/AA) cho 7 tab, bàn phím, ARIA, giảm chuyển động, in ấn, 5 thiết bị giả lập |
| `t2b_detail.js` | Chi tiết độ tương phản màu (sáng và tối) và vùng chạm nhỏ |
| `t3_deep.js` | Hiệu năng (CDP, resource timing, paint), mạng chậm và ngoại tuyến, XSS, xuất và nhập tệp (download, upload), lưu trữ cục bộ |
| `t4_flow.js` | Bấm Lưu khi chưa đăng nhập, trang đăng nhập |
| `t5_leak.js` | Thời gian và mức tăng nút DOM, listener khi chuyển tab lặp lại; id trùng |
| `t6_xss.js`, `t6b_xssid.js` | Thử mã độc ở từng nơi hiển thị dữ liệu và trong mã mục tiêu |

Biến môi trường: `PLAYWRIGHT_PATH` nếu Playwright cài toàn cục ở thư mục không có trong `require`.
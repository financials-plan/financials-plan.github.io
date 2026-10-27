# Kiểm thử

Chạy toàn bộ: `npm test` (dùng bộ chạy `node:test` có sẵn, không cần cài thêm gói).

| File | Kiểm tra gì |
|---|---|
| `unit.test.js` | Server backend và bảo mật (băm mật khẩu, API lớp học, đăng nhập), cấu trúc giao diện, rules Firestore, cú pháp `firestore-service.js`, thư viện `FinancialMath` (các bộ A–P), biểu đồ lũy kế, không còn tự động ghi nền |
| `portfolio.test.js` | Công thức khoản góp (một và nhiều sản phẩm), mô phỏng số dư, Loại đầu tư, thu nhập cần đáp ứng khoản góp, Hưu trí, di chuyển dữ liệu cũ |

## Cách `portfolio.test.js` hoạt động

Test đọc `js/script.js`, trích nguyên văn `FinancialMath` và các hàm tính toán rồi chạy chúng với `AppState` giả,
nên **không cần trình duyệt**. Kỳ vọng được tính bằng phép toán độc lập trong chính file test (không gọi lại công thức đang kiểm tra).

## Khi sửa mã

1. Sửa `js/script.js` (file nguồn duy nhất).
2. Nếu đổi giao diện, tăng số phiên bản `?v=` của `script.js` trong `main.html` (test `unit.test.js` kiểm tra số phiên bản này).
3. Chạy `npm test` trước khi commit.

## Chưa được kiểm thử tự động

Giao diện trên trình duyệt thật (bố cục, điện thoại), đăng nhập và lưu/tải với Firestore thật.

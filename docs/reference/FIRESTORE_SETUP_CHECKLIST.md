# BẢNG KIỂM TRA HỆ THỐNG CLOUD FIRESTORE

Tài liệu kiểm tra quy trình cài đặt và kết nối cơ sở dữ liệu Cloud Firestore cho dự án Sổ Tài Chính Cá Nhân.

---

## 1. Bản đồ cấu trúc tệp dữ liệu & cấu hình

- `config/firebase-config.js`: Tệp duy nhất chứa tham số kết nối cho phép thay đổi (`firebaseConfig`, `firestoreSettings`).
- `backend/firestore-service.js`: Lõi kết nối Firebase SDK v10.12.0 và đối tượng toàn cục `window.CloudDB`.
- `backend/firestore.rules`: Quy tắc bảo mật Cloud Firestore Rules v2.
- `backend/firestore.indexes.json`: Cấu hình miễn trừ đánh chỉ mục cho các trường dữ liệu lớn (`_backups`, `monthlyDetails`, `yearEndBalanceSheet`).
- `backend/firebase.json`: Cấu hình Firebase CLI triển khai Firestore & Functions.
- `backend/.firebaserc`: Định danh Project ID mặc định.

---

## 2. Danh mục 10 bước kiểm tra triển khai

1. **Tạo Firebase Project:** Khởi tạo dự án mới trên Firebase Console.
2. **Đăng ký Web App:** Lấy thông số `firebaseConfig` (apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId, measurementId).
3. **Kích hoạt Firestore Database:** Chọn Native Mode, vị trí máy chủ `asia-southeast1`.
4. **Cập nhật cấu hình:** Dán thông số vào `config/firebase-config.js`.
5. **Cập nhật Rules:** Xuất bản nội dung từ `backend/firestore.rules`.
6. **Miễn trừ chỉ mục:** Cấu hình single-field exemption cho `_backups`, `monthlyDetails` và `yearEndBalanceSheet`.
7. **Triển khai qua CLI (tùy chọn):** Chạy `firebase deploy --only firestore` trong thư mục `backend/`.
8. **Kiểm tra đăng nhập:** Xác thực tài khoản khách mặc định hoặc đăng ký tài khoản mới.
9. **Kiểm tra lưu dữ liệu:** Bấm Lưu và kiểm tra tài liệu trong collection `financial_Authentication`.
10. **Kiểm tra sao lưu:** Tạo và khôi phục bản sao lưu trên giao diện.

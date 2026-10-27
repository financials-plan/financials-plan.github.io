# Backend & Firebase

Thư mục này gom mọi thứ liên quan tới máy chủ và Firebase. Phần giao diện (GitHub Pages) chỉ nạp
`firestore-service.js` ở phía trình duyệt; các file còn lại chạy trên máy phát triển hoặc triển khai bằng Firebase CLI.

| File | Vai trò | Chạy ở đâu |
|---|---|---|
| `firestore-service.js` | SDK Firestore (đăng nhập tài khoản, lưu/tải hồ sơ, lớp học, bản sao lưu). Giao diện gọi qua `window.CloudDB`. | Trình duyệt |
| `security.js` | Băm mật khẩu PBKDF2, làm sạch dữ liệu, kiểm tra origin | Node |
| `server.js` | Server HTTP bảo mật độc lập (CORS, giới hạn tần suất, giới hạn payload), cổng mặc định `8787` | Node (`npm start` ở thư mục gốc) |
| `admin-cli.js` | Công cụ dòng lệnh cho quản trị (`npm run admin`) | Node |
| `functions/` | Cloud Functions (Node 20) cho xác thực bằng tên đăng nhập | Firebase |
| `firestore.rules` | Quy tắc bảo mật Firestore | Triển khai bằng Firebase CLI |
| `firestore.indexes.json` | Chỉ mục và ngoại lệ chỉ mục | Triển khai bằng Firebase CLI |
| `firebase.json`, `.firebaserc` | Cấu hình Firebase CLI khi chạy trong thư mục `backend/` (project `financials-plan`) | Firebase CLI |

> Thư mục gốc cũng có `firebase.json` và `.firebaserc` (chỉ khai báo `firestore.rules`). File trong `backend/` đầy đủ hơn
> (indexes, functions). Hãy chạy lệnh deploy từ thư mục `backend/` để dùng cấu hình đầy đủ.

## Triển khai

```bash
cd backend
firebase login                       # một lần
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
firebase deploy --only functions     # nếu dùng Cloud Functions
```

Trước khi chạy, kiểm tra project bằng `firebase projects:list` và `firebase firestore:databases:list --project financials-plan`.
Không triển khai rules hoặc index mới khi chưa kiểm tra tác động lên ứng dụng.

## Mô hình lưu dữ liệu (tóm tắt)

- Hồ sơ người dùng: collection `financial_Authentication`, document theo mã hồ sơ; chứa toàn bộ trạng thái ứng dụng cùng `_backups` (tối đa 20 bản sao lưu).
- Tài khoản: `financial_accounts` (và bản sao `users`, `accounts`); lớp học: `classes`, `groups`, `group_codes`; bài làm học viên: `student_plans`, `student_keywords`, `setup_keywords`.
- Dữ liệu chỉ được ghi khi người dùng bấm **Lưu**; không có tự đồng bộ nền.

## Lưu ý vận hành

- Gói Spark có hạn mức đọc/ghi hằng ngày. Khi hết hạn mức, Firestore trả `resource-exhausted`; ứng dụng báo lỗi lưu/tải và giữ dữ liệu trên máy.
- Bản ghi hồ sơ gồm nhiều bản sao lưu lồng nhau nên khá lớn; nếu cần giảm tải, hãy đo kích thước document thật trước khi đổi cấu trúc.
- Quy tắc Firestore hiện cho phép đọc/ghi công khai trên các collection chính vì ứng dụng dùng cơ chế đăng nhập riêng, không dùng Firebase Auth. Đây là rủi ro đã biết; xem [../SECURITY.md](../SECURITY.md).
- Không đặt khóa dịch vụ, token hay dữ liệu người dùng vào thư mục này hoặc vào repository.

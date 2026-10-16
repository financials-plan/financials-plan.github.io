# BẢNG KIỂM TRA & TÁI LẬP HỆ THỐNG CLOUD FIRESTORE (`FIRESTORE_SETUP_CHECKLIST.md`)

Tài liệu này tóm tắt cấu trúc thư mục và trạng thái cấu hình thực tế của dự án **Quản lý Tài chính Cá nhân 360°** (`financials-plan.github.io`), kèm theo danh sách kiểm tra (Checklist) từng bước để tái lập toàn bộ hệ thống Cloud Firestore từ con số 0.


---

## 1. Cấu trúc tổ chức thư mục chuẩn hóa

```text
financials-plan.github.io-main/
├── index.html                           # Giao diện chính (ở ngoài cùng)
├── style.css                            # Toàn bộ CSS giao diện Light/Dark & Responsive (ở ngoài cùng)
├── script.js                            # Logic nghiệp vụ của ứng dụng (ở ngoài cùng)
├── firebase-config.js                   # CHỈ chứa cấu hình cho phép thay đổi (firebaseConfig, firestoreSettings)
├── README.md                            # Tài liệu giới thiệu dự án
└── firebase/                            # Thư mục riêng chứa toàn bộ lõi cài đặt & cấu hình sâu của Firebase
    ├── firestore-service.js             # Lõi kết nối Firebase SDK v10.12.0 & định nghĩa window.CloudDB
    ├── firestore.rules                  # Quy tắc bảo mật Cloud Firestore (Rules v2)
    ├── firestore.indexes.json           # Cấu hình miễn trừ chỉ mục (fieldOverrides)
    ├── firebase.json                    # Cấu hình Firebase CLI
    ├── .firebaserc                      # Ánh xạ Project ID mặc định (financials-plan)
    ├── FIRESTORE_SETUP_GUIDE.tex        # Tài liệu kỹ thuật LaTeX tái lập hệ thống
    └── FIRESTORE_SETUP_CHECKLIST.md     # Bảng kiểm tra nhanh quy trình tái lập
```

---

## 2. Bảng phân định trạng thái cấu hình hiện tại

| Hạng mục cấu hình | Trạng thái | Phân loại xác nhận | Ghi chú chi tiết |
| :--- | :--- | :--- | :--- |
| **Firebase Project (`financials-plan`)** | Hoạt động | Đã xác nhận trực tiếp trên Firebase (REST API) | Project Number: `850636237701`, App ID: `1:850636237701:web:1902eff807d2762415f2ec` |
| **Firestore Database (`(default)`)** | Hoạt động | Đã xác nhận trực tiếp trên Firebase (REST API) | Chế độ Native Mode, Collection chính: `financial_data` |
| **Dữ liệu người dùng hiện có** | An toàn 100% | Đã xác nhận & sao lưu | Các hồ sơ người dùng hiện có (`user_dinh_anh_quan`, `user_hst`) được bảo toàn nguyên vẹn |
| **File cấu hình ngoài (`./firebase-config.js`)** | Đã tách riêng | Đã xác nhận trong Repository | Đặt ở thư mục gốc, chỉ chứa `firebaseConfig` và `firestoreSettings` để dễ dàng chỉnh sửa khi đổi project |
| **Lõi dịch vụ (`./firebase/firestore-service.js`)** | Đã chuẩn hóa | Đã xác nhận trong Repository | Tự động import `../firebase-config.js`, kiểm soát kích thước `< 900 KB`, tự động gán `_userMeta`, chống trùng tên `Backup N` và bỏ lệnh gọi subcollection dư thừa |
| **Quy tắc bảo mật (`./firebase/firestore.rules`)** | Đã chuẩn hóa | Đã tạo trong `./firebase/` & kiểm chứng hành vi | Kiểm tra định dạng `docId`, kiểm tra Schema 22 trường & `_userMeta`, cho phép cập nhật `_backups`, chặn `delete` hồ sơ gốc và chặn mọi collection khác |
| **Cấu hình chỉ mục (`./firebase/firestore.indexes.json`)** | Đã chuẩn hóa | Đã tạo trong `./firebase/` | Cấu hình `fieldOverrides` miễn trừ đánh chỉ mục đơn trường cho `_backups` và `monthlyDetails` |
| **Cấu hình CLI (`./firebase/firebase.json`, `.firebaserc`)** | Đã chuẩn hóa | Đã tạo trong `./firebase/` | Sẵn sàng chạy `firebase deploy --only firestore` ngay trong thư mục `firebase/` |

---

## 3. Checklist 10 bước tái lập hệ thống từ con số 0 sang Project mới

- [ ] **Bước 1 — Tạo Firebase Project:**
  Truy cập [Firebase Console](https://console.firebase.google.com/), tạo project mới (ví dụ: `financials-plan`).
- [ ] **Bước 2 — Đăng ký Firebase Web App:**
  Trong **Project Overview**, chọn biểu tượng Web (`</>`), đặt tên ứng dụng và sao chép đối tượng `firebaseConfig`.
- [ ] **Bước 3 — Khởi tạo Cloud Firestore:**
  Vào **Build → Firestore Database → Create database**, giữ Database ID là `(default)`, chọn **Native Mode**, chọn vị trí máy chủ (`asia-southeast1` hoặc `nam5`) và chọn **Start in production mode**.
- [ ] **Bước 4 — Cập nhật file cấu hình duy nhất ở thư mục gốc (`./firebase-config.js`):**
  - Mở [`../firebase-config.js`](../firebase-config.js) ở ngoài cùng và thay thế đối tượng `firebaseConfig` mới.
  - (Tùy chọn) Mở [`./.firebaserc`](./.firebaserc) và cập nhật trường `"default"` thành `projectId` mới nếu dùng Firebase CLI.
- [ ] **Bước 5 — Triển khai Firestore Security Rules (`./firebase/firestore.rules`):**
  - **Cách 1 (Qua Firebase Console):** Mở **Firestore Database → Rules**, dán toàn bộ nội dung file [`./firestore.rules`](./firestore.rules) và nhấn **Publish**.
  - **Cách 2 (Qua Firebase CLI):**
    ```bash
    cd firebase
    firebase login
    firebase use <project-id>
    firebase deploy --only firestore:rules
    ```
- [ ] **Bước 6 — Triển khai Firestore Index Overrides (`./firebase/firestore.indexes.json`):**
  Chạy lệnh từ trong thư mục `firebase/`:
  ```bash
  firebase deploy --only firestore:indexes
  ```
- [ ] **Bước 7 — Kiểm tra giới hạn API Key (Nếu bật Website Restrictions):**
  Trong Google Cloud Console → **APIs & Services → Credentials**, đảm bảo khóa trình duyệt cho phép tên miền GitHub Pages (`https://<username>.github.io/*`) và `http://localhost:*`.
- [ ] **Bước 8 — Triển khai giao diện lên GitHub Pages:**
  Đẩy code lên nhánh `main`, vào **Settings → Pages** trên GitHub, chọn **Deploy from a branch (`main` / `root`)**.
- [ ] **Bước 9 — Kiểm thử tạo hồ sơ & Lưu trữ đám mây:**
  Mở website, nhập Họ và Tên tại hộp thoại nhận diện, nhấn nút **Lưu trữ** và kiểm tra thông báo thành công cùng trạng thái `Đồng bộ lúc HH:MM:SS`.
- [ ] **Bước 10 — Kiểm thử Khôi phục & Xóa bản sao lưu:**
  Nhấn nút **Nhập dữ liệu**, kiểm tra danh sách `Backup 1, Backup 2...`, thử khôi phục một bản sao lưu và thử xóa một bản sao lưu.

# Hướng dẫn chuyển đổi người quản lý dữ liệu (Data owner / Admin migration)

Cấu hình kết nối Firebase nằm ở `config/firebase-config.js` (đúng dạng đoạn mã Firebase cấp). Tên collection và mã tài liệu mặc định nằm ở `config/firestore-settings.js`.

## 1. Các trường cần thay đổi khi chuyển giao quyền quản trị dự án Firebase

- `apiKey`: khóa API Web của dự án Firebase thuộc tài khoản quản trị mới.
- `authDomain`: tên miền xác thực Firebase Authentication (`<project-id>.firebaseapp.com`).
- `projectId`: định danh dự án Firebase chứa cơ sở dữ liệu Cloud Firestore mới.
- `storageBucket`: kho lưu trữ Cloud Storage của dự án (`<project-id>.firebasestorage.app`).
- `messagingSenderId`: mã định danh người gửi Cloud Messaging.
- `appId`: mã định danh ứng dụng Web trong Project Settings.
- `measurementId`: mã đo lường Google Analytics (tùy chọn).
- `firestoreSettings.collectionName` (trong `config/firestore-settings.js`): tên bộ sưu tập lưu hồ sơ tài chính người dùng.
- `firestoreSettings.defaultDocumentId` (trong `config/firestore-settings.js`): mã tài liệu mặc định khi chưa định danh.

## 2. Điều kiện bắt buộc để không làm mất dữ liệu cũ

- Trước khi đổi `projectId` hoặc `collectionName`, phải xuất toàn bộ dữ liệu từ dự án cũ (công cụ Xuất JSON trên giao diện hoặc `gcloud firestore export`) và lưu bản sao an toàn.
- Giữ nguyên các trường định danh `ho_ten`, `owner_uid`, `_backups` và tên collection (mặc định `financial_Authentication`) để tương thích ngược với hồ sơ đã lưu.
- Kiểm tra các khóa localStorage `FIN_APP_USER_SESSION`, `FIN_APP_PROFILES_LIST` và các bản sao lưu cục bộ `FIN_APP_BACKUPS_<docId>` trước khi chuyển môi trường.

## 3. Quy trình an toàn trên Firebase Console / IAM / Authentication / Firestore

1. **IAM và quyền sở hữu:** nếu giữ nguyên dự án và chỉ đổi người phụ trách, vào Google Cloud IAM & Admin hoặc Firebase Project Settings → Users and permissions, thêm email người quản lý mới với vai trò Owner/Editor, xác nhận truy cập trước khi thu hồi quyền cũ.
2. **Authentication:** nếu chuyển sang dự án Firebase mới, vào Authentication → Sign-in method, bật nhà cung cấp Email/Password và di chuyển danh sách tài khoản.
3. **Cloud Firestore và Rules:** khởi tạo Firestore ở chế độ Production, nhập dữ liệu từ bản sao lưu vào đúng `collectionName`, rồi triển khai nội dung `backend/firestore.rules`.
4. **Cập nhật cấu hình:** thay các giá trị trong `firebaseConfig` bằng thông số dự án mới, kiểm tra Đăng nhập, Lưu dữ liệu, Khôi phục bản sao lưu.

## 4. Import map

`config/firebase-config.js` dùng đường dẫn `firebase/app` và `firebase/analytics`. Các trang `main.html` và `auth/index.html` khai báo import map trỏ các đường dẫn này tới bản SDK trên `gstatic.com` (cùng phiên bản với `backend/firestore-service.js`). Khi nâng phiên bản SDK, đổi đồng thời ở import map và ở các dòng `import` trong `backend/firestore-service.js`.
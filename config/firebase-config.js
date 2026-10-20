/*
 * HƯỚNG DẪN CHUYỂN ĐỔI NGƯỜI CHỊU TRÁCH NHIỆM QUẢN LÝ DỮ LIỆU (DATA OWNER / ADMIN MIGRATION)
 *
 * 1. Các trường cấu hình cần thay đổi khi chuyển giao quyền quản trị dự án Firebase:
 *    - apiKey: Khóa API Web của dự án Firebase thuộc tài khoản quản trị mới.
 *    - authDomain: Tên miền xác thực Firebase Authentication (<project-id>.firebaseapp.com).
 *    - projectId: Định danh dự án Firebase chứa cơ sở dữ liệu Cloud Firestore mới.
 *    - storageBucket: Kho lưu trữ Cloud Storage của dự án (<project-id>.firebasestorage.app).
 *    - messagingSenderId: Mã định danh người gửi Cloud Messaging.
 *    -appId: Mã định danh ứng dụng Web trong Project Settings.
 *    - firestoreSettings.collectionName: Tên bộ sưu tập lưu hồ sơ tài chính người dùng.
 *    - firestoreSettings.defaultDocumentId: Mã tài liệu mặc định khi chưa định danh.
 *
 * 2. Điều kiện bắt buộc cần kiểm tra để không làm mất dữ liệu cũ:
 *    - Trước khi thay đổi projectId hoặc collectionName, phải xuất toàn bộ dữ liệu từ dự án cũ
 *      (qua công cụ Xuất JSON trên giao diện hoặc gcloud firestore export) và lưu trữ bản sao an toàn.
 *    - Giữ nguyên cấu trúc trường định danh "ho_ten", "owner_uid", "_backups" và tên collection
 *      (mặc định: "financial_Authentication") để tương thích ngược với các hồ sơ đã lưu.
 *    - Kiểm tra biến localStorage "FIN_APP_USER_SESSION", "FIN_APP_PROFILES_LIST" và các bản sao lưu
 *      cục bộ "FIN_APP_BACKUPS_<docId>" trước khi chuyển đổi môi trường.
 *
 * 3. Quy trình thực hiện an toàn trên Firebase Console / IAM / Authentication / Firestore:
 *    - Bước 1 (IAM & Quyền sở hữu): Nếu giữ nguyên dự án và chỉ đổi người phụ trách, truy cập
 *      Google Cloud IAM & Admin hoặc Firebase Project Settings -> Users and permissions -> Thêm email
 *      người quản lý mới với vai trò Owner/Editor, xác nhận quyền truy cập trước khi thu hồi quyền cũ.
 *    - Bước 2 (Authentication): Nếu chuyển sang dự án Firebase mới, vào mục Authentication -> Sign-in method,
 *      bật nhà cung cấp Email/Password và di chuyển danh sách tài khoản người dùng.
 *    - Bước 3 (Cloud Firestore & Rules): Khởi tạo Firestore Database ở chế độ Production, nhập dữ liệu
 *      từ bản sao lưu vào đúng collectionName, sau đó triển khai nội dung file firebase/firestore.rules.
 *    - Bước 4 (Cập nhật cấu hình): Thay thế các giá trị trong đối tượng firebaseConfig bên dưới bằng
 *      thông số của dự án mới và kiểm tra chức năng Đăng nhập, Lưu dữ liệu, Khôi phục bản sao lưu.
 */
export const firebaseConfig = {
  apiKey: "AIzaSyB8i-2ZXZkr7Nmt8c5hVrjBah6-bxfj9PQ",
  authDomain: "financials-plan.firebaseapp.com",
  projectId: "financials-plan",
  storageBucket: "financials-plan.firebasestorage.app",
  messagingSenderId: "850636237701",
  appId: "1:850636237701:web:1902eff807d2762415f2ec",
  measurementId: "G-SEB30RQ8ZS"
};

export const firestoreSettings = {
  collectionName: "financial_Authentication",
  accountsCollectionName: "financial_accounts",
  defaultDocumentId: "khach_hang_mac_dinh"
};



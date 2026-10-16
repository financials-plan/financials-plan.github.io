/**
 * ============================================================================
 * CẤU HÌNH FIREBASE CÓ THỂ THAY ĐỔI (USER-CONFIGURABLE SETTINGS)
 * ============================================================================
 * File này đặt ở thư mục gốc để người quản trị dễ dàng thay đổi thông số
 * kết nối khi chuyển sang Firebase Project mới mà không cần can thiệp vào
 * mã nguồn xử lý bên trong thư mục ./firebase/
 */

// 1. Thông số kết nối Firebase Web App (Lấy từ Firebase Console -> Project Settings)
export const firebaseConfig = {
  apiKey: "AIzaSyB8i-2ZXZkr7Nmt8c5hVrjBah6-bxfj9PQ",
  authDomain: "financials-plan.firebaseapp.com",
  projectId: "financials-plan",
  storageBucket: "financials-plan.firebasestorage.app",
  messagingSenderId: "850636237701",
  appId: "1:850636237701:web:1902eff807d2762415f2ec",
  measurementId: "G-SEB30RQ8ZS"
};

// 2. Tùy chỉnh tên Collection và giới hạn lưu trữ trên Cloud Firestore
export const firestoreSettings = {
  // Tên Collection chính lưu hồ sơ người dùng trên Firestore
  collectionName: "financial_data",

  // Document ID mặc định dùng để tương thích ngược (legacy)
  legacyDocId: "main_financial_record",

  // Số lượng bản sao lưu lịch sử tối đa giữ lại trong mỗi hồ sơ
  maxBackups: 20,

  // Ngưỡng dung lượng an toàn tối đa cho mỗi Document (bytes) trước khi tự động cắt bớt backup cũ
  // (Giới hạn cứng của Cloud Firestore là 1 MiB = 1,048,576 bytes)
  maxSafeBytes: 900000
};

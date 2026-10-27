# Thư mục Tài liệu Dự án (Project Documentation)

Thư mục `docs/` chứa toàn bộ tài liệu hướng dẫn, đặc tả kỹ thuật, công thức tính toán và báo cáo kết quả triển khai cho dự án **Bảng Quản Lý & Hoạch Định Tài Chính Cá Nhân Chuyên Sâu**.

## 1. Cấu trúc thư mục

```
docs/
├── README.md                          # Tài liệu thuyết minh cấu trúc tài liệu docs/
├── CONG_THUC_TINH_TOAN.md             # Thuyết minh chi tiết toàn bộ công thức toán học tài chính (LaTeX)
├── FIRESTORE_SETUP_CHECKLIST.md      # Quy chuẩn và checklist triển khai Cloud Firestore & Security Rules
├── BAO_CAO_KHAO_SAT_TRUOC_TRIEN_KHAI.md # Báo cáo chi tiết khảo sát hệ thống trước khi nâng cấp
├── BAO_CAO_KET_QUA_TRIEN_KHAI.md       # Báo cáo tổng kết toàn diện kết quả triển khai, kiểm thử & bảo mật
├── admin-guide.html                   # Cẩm nang giao diện hướng dẫn dành riêng cho Quản trị viên & Giảng viên
├── admin-guide.pdf                    # Bản in cẩm nang Quản trị viên định dạng PDF chuẩn
├── user-guide.html                    # Hướng dẫn chi tiết sử dụng giao diện và tính năng cho Học viên
├── user-guide.pdf                     # Bản in hướng dẫn Học viên định dạng PDF chuẩn
└── reports/                           # Các báo cáo nghiệm thu chuyên sâu
    └── AIO_FIREBASE_INTEGRATION_REPORT.md # Báo cáo chi tiết nghiệm thu AIO Firebase, Rules, Sync & Reorganization
```

## 2. Mục đích các tài liệu

- **`CONG_THUC_TINH_TOAN.md`**: Toàn bộ công thức toán học tài chính (FV, PV, lạm phát, chi phí dự kiến, phân bổ danh mục theo độ tuổi).
- **`FIRESTORE_SETUP_CHECKLIST.md`**: Danh mục kiểm tra cấu hình Firestore database, security rules, chỉ mục (indexes) và quyền truy cập.
- **`BAO_CAO_KHAO_SAT_TRUOC_TRIEN_KHAI.md` & `BAO_CAO_KET_QUA_TRIEN_KHAI.md`**: Hồ sơ khảo sát hiện trạng và tổng kết quá trình triển khai thực tế.
- **`admin-guide.*` & `user-guide.*`**: Tài liệu hướng dẫn sử dụng cho 2 nhóm đối tượng người dùng chính của hệ thống.
- **`reports/`**: Lưu trữ các báo cáo kiểm thử và chứng thực kỹ thuật chi tiết của hệ thống.

# Tài liệu dự án

```text
docs/
├── README.md
├── guides/        # Hướng dẫn sử dụng (HTML để xem, PDF để in)
│   ├── user-guide.html / .pdf     # Dành cho học viên / người dùng cá nhân
│   └── admin-guide.html / .pdf    # Dành cho quản trị viên và giảng viên
├── reference/     # Tài liệu tham chiếu kỹ thuật
│   ├── CONG_THUC_HIEN_HANH.md     # Công thức đang chạy trong ứng dụng (đọc file này trước)
│   ├── CONG_THUC_TINH_TOAN.md     # Bản mô tả công thức cũ (LaTeX), giữ để đối chiếu lịch sử
│   └── FIRESTORE_SETUP_CHECKLIST.md  # Danh mục kiểm tra cấu hình Firestore
└── reports/       # Báo cáo khảo sát, kiểm toán và nghiệm thu theo từng đợt làm việc
```

## Nên đọc gì

| Bạn muốn | Đọc |
|---|---|
| Hiểu ứng dụng tính khoản góp, tỷ trọng, thu nhập cần có như thế nào | `reference/CONG_THUC_HIEN_HANH.md` |
| Hướng dẫn thao tác cho học viên | `guides/user-guide.html` |
| Hướng dẫn quản lý lớp, xem bài học viên | `guides/admin-guide.html` |
| Thiết lập hoặc kiểm tra Firebase | `reference/FIRESTORE_SETUP_CHECKLIST.md`, [../backend/README.md](../backend/README.md) |
| Lịch sử các đợt kiểm toán / sửa lỗi | `reports/` |

## Lưu ý

- `reports/` là hồ sơ lịch sử: nội dung phản ánh thời điểm viết, không tự cập nhật theo mã nguồn.
- `reference/CONG_THUC_TINH_TOAN.md` mô tả cách tính trước đợt chuẩn hóa công thức gần đây (lãi suất tháng = lãi năm ÷ 12, v.v.); công thức hiện hành nằm ở `CONG_THUC_HIEN_HANH.md`.

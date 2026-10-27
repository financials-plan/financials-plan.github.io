# Thư mục Dữ liệu & Lược đồ (Data & Schemas)

Thư mục `data/` chứa các tệp định dạng chuẩn hóa về cấu trúc dữ liệu, fixture mẫu và schemas phục vụ kiểm thử, khởi tạo hệ thống và đồng bộ trên Cloud Firestore.

## 1. Cấu trúc thư mục

```
data/
├── README.md                          # Tài liệu thuyết minh thư mục data
├── schemas/
│   └── firestore-schema.json          # Lược đồ chuẩn JSON Schema cho các thực thể Firestore (Keywords, Classes, Accounts)
└── fixtures/
    └── starter-keywords.json          # Danh mục 4 nhóm từ khóa mặc định chuẩn (Chi phí, Thu nhập, Phát triển, Đầu tư)
```

## 2. Mục đích các thành phần

- **`schemas/firestore-schema.json`**: Định nghĩa chuẩn cho việc xác thực dữ liệu khi đọc/ghi qua Cloud Firestore Service và REST API, phục vụ xác minh tính toàn vẹn của dữ liệu học viên và lớp học.
- **`fixtures/starter-keywords.json`**: Cung cấp dữ liệu khởi tạo cho 4 nhóm từ khóa thiết lập:
  1. `expenses`: Danh mục chi phí sinh hoạt, cá nhân, đi lại.
  2. `incomeList`: Các nguồn thu nhập chủ động và thụ động.
  3. `planList`: Kế hoạch phát triển năng lực và chuyên môn.
  4. `investProducts`: Danh mục các sản phẩm tích lũy và đầu tư tài chính.

## 3. Quy tắc tham chiếu
- Mọi dữ liệu mẫu thêm mới phải tuân theo định dạng chuẩn trong `schemas/`.
- Không lưu trữ thông tin nhạy cảm, mật khẩu hoặc khóa bí mật vào thư mục `data/`.

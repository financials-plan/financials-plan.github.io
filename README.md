# Sổ Tài Chính Cá Nhân — Hoạch định mục tiêu & lộ trình nghề nghiệp

[![Deploy to GitHub Pages](https://github.com/financials-plan/financials-plan.github.io/actions/workflows/pages.yml/badge.svg)](https://github.com/financials-plan/financials-plan.github.io/actions/workflows/pages.yml)
[![Continuous Integration](https://github.com/financials-plan/financials-plan.github.io/actions/workflows/ci.yml/badge.svg)](https://github.com/financials-plan/financials-plan.github.io/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

Ứng dụng web (HTML/CSS/JavaScript thuần, không cần bước build) giúp lập kế hoạch tài chính cá nhân:
đặt mục tiêu (nợ, tích lũy, hưu trí, quỹ dự phòng), tính khoản góp hằng tháng, theo dõi thu – chi 12 tháng
và đối chiếu thu nhập cần có với lộ trình nghề nghiệp. Dữ liệu được lưu trên Cloud Firestore khi người dùng bấm **Lưu**.

Trang chạy tại: <https://financials-plan.github.io/>

## Tính năng chính

| Tab | Nội dung |
|---|---|
| Từ khóa thiết lập | Danh mục chi, thu, kế hoạch phát triển và **danh mục sản phẩm đầu tư** (lãi suất, rủi ro, *Loại đầu tư*) |
| Dashboard phân tích | Tổng quan dòng tiền, mục tiêu và các biểu đồ |
| Mục tiêu bản thân / tài chính | Bảng mục tiêu, thẻ phân bổ sản phẩm cho từng mục tiêu, ma trận khoản góp theo năm |
| Cân đối lộ trình | Phần 1: tỷ trọng cổ phiếu / trái phiếu / bảo hiểm / tiền gửi theo tuổi và mức sinh lời; Phần 2: đối chiếu thu nhập thực tế với mức cần có |
| Kế hoạch thu chi & Theo dõi 12 tháng | Kế hoạch, thực tế, chênh lệch lũy kế, bảng cân đối cuối năm |
| Khảo sát | Đánh giá khẩu vị rủi ro và hoàn cảnh (21 câu) |

Công thức đang dùng được mô tả tại [docs/reference/CONG_THUC_HIEN_HANH.md](docs/reference/CONG_THUC_HIEN_HANH.md).

## Cấu trúc repository

```text
.
├── index.html, main.html, 404.html   # Điểm vào và giao diện chính (GitHub Pages phục vụ từ thư mục gốc)
├── js/script.js                      # Toàn bộ logic ứng dụng và thư viện FinancialMath
├── css/style.css                     # Giao diện
├── config/firebase-config.js         # Cấu hình Firebase của web app
├── auth/                             # Màn hình đăng nhập / đăng ký
├── admin-web/                        # Cổng quản trị
├── backend/                          # Firestore service, rules, indexes, Cloud Functions, server bảo mật
├── data/                             # Lược đồ và dữ liệu mẫu
├── docs/                             # Tài liệu (hướng dẫn, công thức, báo cáo)
├── tests/                            # Bộ kiểm thử (node:test)
├── .github/workflows/                # CI và triển khai GitHub Pages
├── .agents/                          # Kỹ năng/công cụ hỗ trợ lập trình bằng AI (không ảnh hưởng ứng dụng)
├── firebase.json, .firebaserc        # Cấu hình Firebase CLI ở thư mục gốc (project: financials-plan)
└── LICENSE, SECURITY.md
```

Chi tiết từng thư mục: [docs/README.md](docs/README.md), [backend/README.md](backend/README.md),
[tests/README.md](tests/README.md), [data/README.md](data/README.md).

## Chạy trên máy

Ứng dụng dùng ES Modules nên cần một web server tĩnh (không mở file trực tiếp):

```bash
npx serve -l 8899 .      # rồi mở http://localhost:8899/main.html
# hoặc
npm start                # server backend tích hợp (xem backend/README.md)
```

Dữ liệu Cloud cần kết nối tới project Firebase `financials-plan` (gói Spark có hạn mức đọc/ghi hằng ngày;
khi vượt hạn mức, thao tác tải/lưu Cloud sẽ báo lỗi và dữ liệu vẫn được giữ trên máy).

## Kiểm thử

```bash
npm test
```

Chạy `tests/unit.test.js` (backend, bảo mật, cấu trúc giao diện) và `tests/portfolio.test.js`
(công thức khoản góp, mô phỏng danh mục, Loại đầu tư). Xem [tests/README.md](tests/README.md).

## Triển khai

Mỗi lần push lên `main`, workflow `pages.yml` xuất bản toàn bộ thư mục gốc lên GitHub Pages
(**Settings → Pages → Source: GitHub Actions**). Workflow `ci.yml` kiểm tra các file cốt lõi và cú pháp backend.
Khi sửa `js/script.js`, hãy tăng số phiên bản trong thẻ `<script src="./js/script.js?v=…">` của `main.html` để trình duyệt tải bản mới.

## Quy ước dữ liệu

- Dữ liệu người dùng chỉ ghi lên Cloud khi bấm **Lưu** (không có tự đồng bộ nền).
- Không đưa dữ liệu người dùng, khóa dịch vụ hay token vào repository (xem `.gitignore` và [SECURITY.md](SECURITY.md)).

## Giấy phép

[MIT](LICENSE)

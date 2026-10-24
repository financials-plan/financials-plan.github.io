# Bảng Quản Lý & Hoạch Định Tài Chính Cá Nhân Chuyên Sâu

[![Deploy to GitHub Pages](https://github.com/financials-plan/financials-plan.github.io/actions/workflows/pages.yml/badge.svg)](https://github.com/financials-plan/financials-plan.github.io/actions/workflows/pages.yml)
[![Continuous Integration](https://github.com/financials-plan/financials-plan.github.io/actions/workflows/ci.yml/badge.svg)](https://github.com/financials-plan/financials-plan.github.io/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-Vanilla%20Web-brightgreen.svg)](main.html)
[![Database](https://img.shields.io/badge/Firebase-Firestore%20v10.12.0-orange.svg)](config/firebase-config.js)

Hệ thống ứng dụng web quản lý tài chính cá nhân, hoạch định ngân sách 12 tháng và dự báo lộ trình tài sản 33 năm, kết hợp giữa mô hình quản trị dòng tiền thực tế, phân bổ tài sản theo chu kỳ cuộc đời và phân tích sự phù hợp giữa lộ trình phát triển sự nghiệp với các mục tiêu dài hạn.

---

## 1. Cấu trúc chuẩn của Repository

Repository được tổ chức theo chuẩn GitHub Web Project & GitHub Pages:

```text
financials-plan.github.io/
│
├── .github/                         # GitHub Actions CI/CD workflows
│   └── workflows/
│       ├── pages.yml                # Tự động xuất bản lên GitHub Pages
│       └── ci.yml                   # Kiểm tra tính toàn vẹn và cú pháp mã nguồn
│
├── .gitattributes                   # Chuẩn hóa định dạng ngắt dòng (LF)
├── .gitignore                       # Danh sách loại trừ tệp tạm, logs, caches
├── .nojekyll                        # Tắt bộ phân tích Jekyll cho GitHub Pages
├── LICENSE                          # Giấy phép mã nguồn mở MIT
├── README.md                        # Trang chủ tài liệu giới thiệu dự án
├── SECURITY.md                      # Chính sách an toàn thông tin
├── package.json                     # Thông tin định danh và tập lệnh npm
├── index.html                       # Điểm vào chuyển hướng tự động cho GitHub Pages
├── 404.html                         # Trang xử lý lỗi điều hướng 404
├── main.html                        # GIAO DIỆN CHÍNH — Sổ Tài Chính Cá Nhân (Single-page App)
│
├── css/                             # Định dạng giao diện
│   └── style.css                    # Design Tokens, Dark/Light Theme, Responsive Bảng tính
│
├── js/                              # Lõi nghiệp vụ & thuật toán
│   └── script.js                    # Trạng thái AppState, 10 thuật toán tài chính, biểu đồ Chart.js
│
├── config/                          # Tệp cấu hình duy nhất được chỉnh sửa khi đổi DB
│   └── firebase-config.js           # Khối thông số firebaseConfig và firestoreSettings
│
├── auth/                            # Phân hệ tài khoản & giao diện xác thực
│   ├── index.html                   # Màn hình Đăng nhập / Đăng ký
│   ├── auth.css                     # Hiệu ứng nút biến hình, rung thẻ, báo lỗi
│   └── auth.js                      # Logic client auth, quản lý phiên và rate limiting
│
└── backend/                         # Máy chủ API bảo mật & Cloud Functions
    ├── server.js                    # Server HTTP bảo mật độc lập (CSP, CORS, Rate Limit)
    ├── security.js                  # Lõi mã hóa PBKDF2, làm sạch dữ liệu, kiểm soát origin
    ├── package.json                 # Cấu hình package backend
    ├── firestore-service.js         # SDK kết nối Cloud Firestore v10.12.0
    ├── firestore.rules              # Quy tắc bảo mật Firestore Rules v2 đã thắt chặt
    ├── firestore.indexes.json       # Miễn trừ chỉ mục cho các trường dữ liệu lớn
    ├── firebase.json                # Cấu hình triển khai Firebase CLI
    ├── .firebaserc                  # Khai báo Project ID mặc định
    └── functions/                   # Cloud Functions (Firebase Functions v2)
└── docs/                            # Tài liệu bổ trợ & lý thuyết
    ├── CONG_THUC_TINH_TOAN.md       # Báo cáo toán học tài chính (LaTeX) chuẩn hóa toàn bộ công thức
    └── FIRESTORE_SETUP_CHECKLIST.md # Hướng dẫn kiểm tra triển khai Cloud Firestore
```

---

## 2. Tính năng cốt lõi

1. **Từ khóa thiết lập (`tab-tukhoa`):** Quản lý danh mục nguồn thu, khoản chi, quỹ dự phòng và rổ sản phẩm đầu tư.
2. **Dashboard phân tích (`tab-dashboard`):** Trung tâm giám sát dòng tiền, cơ cấu tài sản và tổng hợp số liệu thời gian thực.
3. **Mục tiêu bản thân (`tab-muctieu-bt`):** Bảng nhập liệu trung tâm chứa các mục tiêu nợ, tích lũy, hưu trí, học tập.
4. **Mục tiêu tài chính (`tab-muctieu-tc`):** Phân bổ chi tiết từng mục tiêu và ma trận dòng tiền 33 năm theo lý thuyết tài chính hiện đại.
5. **Cân đối lộ trình nghề nghiệp (`tab-candoi`):** So khớp thu nhập từ lộ trình thăng tiến với nhu cầu hoàn thành mục tiêu, tự động tính toán nhu cầu thu nhập.
6. **Kế hoạch thu nhập & chi tiêu (`tab-kehoach`):** Hoạch định ngân sách dự kiến cho 12 tháng trong năm.
7. **Theo dõi thu chi 12 tháng & Bảng cân đối cuối năm (`tab-month`):**
   - Phân hệ đối soát thu chi thực tế hàng tháng so với kế hoạch.
   - Phân hệ nhật ký chi phí học tập & phát triển kỹ năng bản thân.
   - **Bảng cân đối tài sản - nợ cuối năm (Tháng 12):** Tổng hợp tài sản tích lũy đầu tư, nguồn lực con người (tổng thu nhập 1 năm), các khoản nợ vay và chi phí sinh hoạt, tính toán Giá trị tài sản ròng (Net Worth) và Tỷ lệ đòn bẩy tài chính ($DR$).
8. **Khảo sát đánh giá bản thân (`tab-khaosat`):** Hệ thống 21 câu hỏi định lượng khẩu vị rủi ro và khả năng chịu đựng rủi ro theo chuẩn CFA.
9. **Bộ JSON Tổng thuần dữ liệu nhập (Pure Input Master JSON - Schema 3.0.0):** Xuất và nạp toàn diện hồ sơ tài chính. Quy tắc: chỉ lưu trữ dữ liệu người dùng nhập vào, tuyệt đối không lưu dữ liệu tính toán; máy tính tự động tính toán lại 100% tất cả các bảng khi mở hồ sơ.
10. **Tài liệu công thức tài chính chuẩn LaTeX (`docs/CONG_THUC_TINH_TOAN.md`):** Thuyết minh chi tiết toàn bộ cơ sở lý thuyết tài chính, công thức toán học và đơn vị tính của hệ thống.

---

## 3. Kiến trúc bảo mật Backend API

- **CORS Whitelist:** Giới hạn domain gọi API, chỉ chấp nhận `financials-plan.github.io` và các port phát triển cục bộ đã khai báo.
- **Dual-Layer Rate Limiting:**
  - Tầng IP: Giới hạn tối đa 25 lượt gọi/15 phút cho mỗi địa chỉ IP.
  - Tầng tài khoản: Khóa tạm thời 15 phút khi người dùng nhập sai mật khẩu quá 5 lần liên tiếp.
- **Bảo vệ chống DoS & Prototype Pollution:** Giới hạn kích thước payload tối đa 50KB, loại bỏ triệt để các thuộc tính nguy hiểm (`__proto__`, `constructor`, `prototype`).
- **Băm mật khẩu tiêu chuẩn:** PBKDF2 SHA-256 với 60.000 vòng lặp kèm salt ngẫu nhiên 16 bytes và so sánh an toàn thời gian.
- **Quy tắc Firestore Rules v2:**
  - Ngăn chặn triệt để hành vi duyệt danh sách người dùng (`allow list: if false`).
  - Phân quyền theo `owner_uid` và kiểm tra schema kích thước payload `< 950KB`.
  - Khóa toàn bộ các bộ sưu tập nội bộ của backend đối với client.

---

## 4. Hướng dẫn khởi chạy

### Chạy trực tiếp trên GitHub Pages
1. Fork hoặc clone repository về tài khoản GitHub của bạn.
2. Bật **Settings → Pages**, tại mục **Build and deployment** chọn nguồn là **GitHub Actions**.
3. Khi có mã mới được đẩy lên nhánh `main`, quy trình tự động trong `.github/workflows/pages.yml` sẽ xuất bản trang web tại `https://financials-plan.github.io/`.

### Chạy trên máy cục bộ
Ứng dụng sử dụng chuẩn ES Modules, do đó cần chạy qua một web server tĩnh:
```bash
# Cách 1: Sử dụng máy chủ backend bảo mật tích hợp sẵn
npm start

# Cách 2: Sử dụng npx serve
npx serve -l 8899 .
```
Truy cập trình duyệt tại địa chỉ `http://localhost:8899/main.html` hoặc `http://localhost:8899/`.

---

## 5. Giấy phép (License)
Dự án được phân phối dưới giấy phép mã nguồn mở [MIT License](LICENSE).

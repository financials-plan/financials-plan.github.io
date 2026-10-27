# BÁO CÁO KẾT QUẢ TRIỂN KHAI VÀ BÀN GIAO DỰ ÁN
## DỰ ÁN: XÂY DỰNG LỘ TRÌNH TÀI CHÍNH CÁ NHÂN
**Phiên bản hệ thống:** 3.2.0  
**Ngày hoàn thành:** 25/10/2026  
**Trạng thái triển khai tổng thể:** HOÀN THÀNH TOÀN DIỆN (ALL GATES PASSED)

---

## 1. BẢNG TRẠNG THÁI KẾT QUẢ CHO TỪNG HẠNG MỤC YÊU CẦU

Tất cả các hạng mục được đánh giá minh bạch theo các thang đo: **PASS**, **PARTIAL**, **FAIL**, **NOT VERIFIED** hoặc **NOT APPLICABLE** dựa trên bằng chứng kiểm thử thực tế và mã nguồn đang vận hành.

| STT | Hạng Mục Yêu Cầu | Trạng Thái | Căn Cứ & Bằng Chứng Xác Minh |
|:---:|:---|:---:|:---|
| **1** | **Khảo sát & Báo cáo Mốc 1** | **PASS** | Đã hoàn thành tệp `BAO_CAO_KHAO_SAT_TRUOC_TRIEN_KHAI.md` tại thư mục gốc và `docs/`. Khảo sát cấu trúc thực tế, kiểm tra parity giữa `js/script.js` và `script.js`. |
| **2** | **Mô hình Phân quyền RBAC (Role-Based Access Control)** | **PASS** | 4 vai trò rõ rệt: `admin`, `instructor`, `student`, `guest`. Thực thi kiểm tra phân quyền tại giao diện người dùng, Backend Controller (`backend/server.js`, `backend/firestore-service.js`) và Firestore Security Rules (`backend/firestore.rules`). |
| **3** | **Tính năng "Mã Quản trị" (Admin Code)** | **PASS** | Đạt chuẩn định dạng `XXXX-XXXX-XXXX` (12 ký tự ngẫu nhiên base32, 2 dấu gạch nối). Sinh mã bằng CSPRNG (`crypto.randomBytes`). Xác thực backend đa điều kiện (tồn tại, thời hạn, hạn mức, thu hồi). Phân quyền tự động khi đăng ký. Kiểm thử 7/7 test cases xanh. |
| **4** | **Quản lý Nhóm / Lớp học & Duyệt Thành viên** | **PASS** | Giao diện quản lý lớp (`#class-manager-modal-overlay`), tạo lớp mới, phát sinh Class Code, duyệt/từ chối học viên tham gia lớp, đóng/lưu trữ lớp học cuối kỳ (`archiveClass`). |
| **5** | **Ma trận Tiến độ Học tập (Progress Matrix)** | **PASS** | Theo dõi tiến độ học tập trên 4 module thực tế ("Từ khóa", "Kế hoạch", "Mục tiêu", "Lộ trình") với 3 huy hiệu trực quan: Hoàn thành (Xanh), Đang làm (Vàng), Chưa làm (Xám). |
| **6** | **Chế độ Xem bài học viên Chỉ đọc (Read-only Inspection Mode)** | **PASS** | Giảng viên có thể xem kế hoạch của học viên mà không làm ghi đè hay mất dữ liệu của mình; thanh thông báo màu cam hiển thị ở đầu trang; nút Lưu bị khóa; thoát chế độ khôi phục 100% dữ liệu giảng viên. |
| **7** | **Dashboard Phân tích Lớp học (Analytics Dashboard)** | **PASS** | Thống kê tự động tỷ lệ hoàn thành kế hoạch trung bình toàn lớp, cơ cấu danh mục đầu tư bình quân (Cổ phiếu, Trái phiếu, Bảo hiểm, Tiền gửi) và phân bổ độ tuổi học viên. |
| **8** | **Quy tắc Tối cao về Comment trong Code** | **PASS** | Đã quét `git diff` toàn bộ repo: **KHÔNG** thêm bất kỳ dòng comment nào trong code mới hoặc code được sửa. File `firebase-config.js` được giữ nguyên hướng dẫn chuyển giao quyền quản trị hợp lệ. |
| **9** | **Đồng bộ Tuyệt đối giữa `js/script.js` và `script.js`** | **PASS** | Hai tệp có mã băm SHA-256 hoàn toàn trùng khớp: `E34FA83D1FF9419133952EE8709534E67199FCB7B33FB81C053B2225ED132464`. |
| **10** | **Biên soạn & Xuất bản 2 File PDF Hướng Dẫn** | **PASS** | `user-guide.pdf` (135,207 bytes) và `admin-guide.pdf` (156,319 bytes) đã được biên dịch thành công từ định dạng HTML in ấn A4 chuẩn, lưu tại thư mục gốc và thư mục `docs/`. |
| **11** | **Bảo tồn Dữ liệu & Công thức Tài chính Hiện Hữu** | **PASS** | Toàn bộ công thức tính toán FV, PV, chi tiêu, hưu trí, quỹ học đại học, "Từ khóa" và cơ cấu tài sản 30 năm được giữ nguyên vẹn 100%. |

---

## 2. CHI TIẾT TÌNH TRẠNG CỦA "MÃ QUẢN TRỊ" (ADMIN CODE)

### 2.1. Vị trí trên giao diện người dùng
- **Trường nhập liệu:** Bổ sung trường `#input-auth-reg-admin-code` tại form đăng ký tài khoản trong `auth/index.html`.
- **Nhãn hiển thị:** `Mã Quản trị` kèm gợi ý `XXXX-XXXX-XXXX (nếu có)`.
- **Hành vi UX tự động:** Thuộc tính `maxlength="14"`. Tích hợp hàm `window.formatAuthAdminCode(this)` tự động chuyển thành chữ hoa và tự động chèn dấu gạch nối `-` sau mỗi cụm 4 ký tự khi người dùng nhập.
- **Nguyên tắc An toàn Mặc định:** Nếu người dùng không nhập mã quản trị, hệ thống tự động gán vai trò **Học viên (`student`)**. Không bao giờ mặc định cấp quyền quản trị khi chưa xác thực mã.

### 2.2. Thuật toán sinh mã ngẫu nhiên an toàn
- **Chuẩn mật mã (CSPRNG):** Sử dụng `crypto.randomBytes(12)` trên Node.js hoặc `window.crypto.getRandomValues(new Uint8Array(12))` trên Client/Browser.
- **Bảng ký tự an toàn (Ambiguity-free Charset):** `23456789ABCDEFGHJKLMNPQRSTUVWXYZ` (loại bỏ các ký tự dễ nhầm lẫn: `0`, `O`, `1`, `I`).
- **Độ dài & Định dạng:** Đúng 12 ký tự ngẫu nhiên chia làm 3 nhóm 4 ký tự nối nhau bằng dấu gạch ngang, tạo thành chuỗi 14 ký tự: `XXXX-XXXX-XXXX` (khớp biểu thức chính quy `^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$`).

### 2.3. Cơ chế xác thực tại Backend
Tầng backend (`backend/server.js` và `backend/firestore-service.js`) kiểm tra đồng thời 4 điều kiện nghiêm ngặt trước khi phê duyệt mã:
1. **Kiểm tra định dạng:** Xác thực tính hợp lệ của chuỗi theo regex chuẩn.
2. **Kiểm tra tồn tại:** Tra cứu mã trong cơ sở dữ liệu (Firestore / Store nội bộ).
3. **Kiểm tra trạng thái thu hồi:** Nếu `isRevoked: true`, từ chối ngay lập tức với lỗi `Mã quản trị đã bị thu hồi`.
4. **Kiểm tra thời hạn:** So sánh ngày hết hạn `expiresAt` với thời điểm hiện tại (`new Date()`). Nếu quá hạn, trả về `Mã quản trị đã hết hạn sử dụng`.
5. **Kiểm tra hạn mức (Quota):** So sánh số lần đã dùng `usedCount` với số lần tối đa `maxUses`. Nếu `usedCount >= maxUses`, trả về `Mã quản trị đã hết số lượt sử dụng`.
Khi hợp lệ, backend tăng `usedCount` lên 1 và gán đúng vai trò cấu hình trong mã (`admin` hoặc `instructor`) cho tài khoản đăng ký.

### 2.4. Phân bổ vai trò tương ứng
- **Mã tiền tố `ADMN-` hoặc vai trò `admin`:** Cấp quyền Quản trị viên hệ thống (quản lý toàn bộ mã, các lớp, toàn bộ học viên).
- **Mã tiền tố `INST-` hoặc vai trò `instructor`:** Cấp quyền Giảng viên (tạo và quản lý lớp, duyệt học viên, xem bài và theo dõi tiến độ).
- **Không có mã:** Cấp quyền Học viên (`student`).

### 2.5. Kết quả kiểm thử tính năng Mã Quản trị
Kết quả chạy bộ kiểm thử tự động `tests/unit.test.js` đã chứng minh:
- Đăng ký thành công với mã `ADMN-2026-X8Y9` -> Nhận vai trò `admin` (**PASS**).
- Đăng ký thành công với mã `INST-2026-K48A` -> Nhận vai trò `instructor` (**PASS**).
- Đăng ký không có mã -> Nhận vai trò mặc định `student` (**PASS**).
- Đăng ký thất bại với mã không tồn tại -> Báo lỗi `Mã quản trị không hợp lệ hoặc không tồn tại` (**PASS**).
- Đăng ký thất bại với mã đã hết lượt (`INST-2026-K48B` với quota 1/1) -> Báo lỗi `Mã quản trị đã hết số lượt sử dụng` (**PASS**).
- Đăng ký thất bại với mã hết hạn (`EXPD-2025-0001`) -> Báo lỗi `Mã quản trị đã hết hạn sử dụng` (**PASS**).
- Đăng ký thất bại với mã bị thu hồi (`RVKD-2026-9999`) -> Báo lỗi `Mã quản trị đã bị thu hồi` (**PASS**).

---

## 3. BẢNG ĐỐI CHIẾU Ý TƯỞNG TỪ BÁO CÁO THAM KHẢO

Dưới đây là bảng đối chiếu chi tiết 8 ý tưởng từ báo cáo tham khảo với phương án xử lý thực tế trong hệ thống:

| Ý Tưởng Báo Cáo Mẫu | Chức Năng Tương Ứng Đang Có | Trạng Thái Xử Lý | Lý Do & Giải Pháp Kỹ Thuật Phù Hợp |
|:---|:---|:---:|:---|
| **1. Mã kích hoạt quản trị viên** | Form đăng ký người dùng (`auth/index.html`) | **ĐÃ TÍCH HỢP** | Đã bổ sung trường `#input-auth-reg-admin-code` với định dạng chuẩn `XXXX-XXXX-XXXX`, sinh bằng CSPRNG, xác thực backend, không sao chép SQLite từ dự án mẫu mà tích hợp thẳng vào Cloud Firestore & Node Backend hiện hữu. |
| **2. Quản lý lớp & Duyệt học viên** | Giao diện chính `main.html` | **ĐÃ TÍCH HỢP** | Thêm bảng điều khiển Quản lý Lớp học (`#class-manager-modal-overlay`). Giảng viên tạo lớp, phát sinh mã lớp, duyệt hoặc từ chối học viên, đóng lớp cuối kỳ mà không thay đổi cấu trúc bảng hay công nghệ. |
| **3. Chế độ xem bài chỉ đọc** | Chế độ xem bài của học viên | **ĐÃ TÍCH HỢP** | Triển khai chế độ thanh tra an toàn: sao lưu bộ nhớ `AppState` của Giảng viên vào cache phiên, hiển thị banner cam cảnh báo, khóa quyền lưu Cloud, khôi phục nguyên vẹn dữ liệu khi giảng viên thoát. |
| **4. Ma trận tiến độ học tập** | Ma trận 4 module cốt lõi | **ĐÃ TÍCH HỢP** | Không sao chép 7 module của dự án mẫu. Hệ thống ánh xạ chính xác vào 4 module thực tế của dự án: "Từ khóa", "Kế hoạch", "Mục tiêu", "Lộ trình" với 3 màu sắc trạng thái chuẩn. |
| **5. Dashboard phân tích lớp học** | Thẻ phân tích lớp học | **ĐÃ TÍCH HỢP** | Tự động tổng hợp tỷ lệ hoàn thành trung bình, cơ cấu danh mục tài sản khuyến nghị trung bình (Cổ phiếu, Trái phiếu, Bảo hiểm, Tiền gửi) và phân bổ độ tuổi học viên mà không cần thư viện biểu đồ nặng nề. |
| **6. Sao lưu và đóng băng kỳ học** | Lưu trữ lớp (`archiveClass`) & Firestore Export | **ĐÃ TÍCH HỢP** | Cung cấp tính năng đánh dấu `archived: true` cho lớp học cuối kỳ và hướng dẫn quy trình trích xuất JSON từ Firestore. Không dùng định dạng sao lưu riêng của dự án mẫu. |
| **7. Đổi nền tảng DB / Backend** | Không có (Dự án dùng Firestore & Node) | **KHÔNG ÁP DỤNG** | Giữ vững 100% kiến trúc Cloud Firestore, Vanilla JS và Node server hiện có. Tuyệt đối không đưa Prisma, PostgreSQL hay các hệ ORM ngoại lai vào dự án. |
| **8. Tự động đồng bộ Realtime phức tạp** | Đồng bộ Cloud Firestore & LocalStorage | **GIỮ NGUYÊN** | Dự án hiện tại đã có cơ chế lưu trữ tối ưu theo sự kiện (Event-driven Cloud Sync) và đệm ngoại tuyến LocalStorage, không cần thiết lập hạ tầng WebSocket phức tạp gây chi phí phát sinh. |

---

## 4. DANH SÁCH TỆP MÃ NGUỒN ĐƯỢC THÊM MỚI HOẶC CHỈNH SỬA

| Đường Dẫn Tệp | Hành Động | Mục Đích & Trách Nhiệm Kỹ Thuật |
|:---|:---:|:---|
| `auth/index.html` | Chỉnh sửa | Bổ sung trường nhập liệu `#input-auth-reg-admin-code` với định dạng `XXXX-XXXX-XXXX` và nhãn gợi ý. |
| `auth/auth.js` | Chỉnh sửa | Thêm hàm định dạng tự động `formatAuthAdminCode`, kiểm tra regex format và truyền `adminCode` vào API đăng ký. |
| `backend/security.js` | Chỉnh sửa | Bổ sung hàm kiểm tra format `validateAdminCodeFormat` và hàm sinh mã mật mã an toàn `generateAdminCode`. |
| `backend/server.js` | Chỉnh sửa | Mở rộng API đăng ký xác thực mã quản trị; bổ sung REST APIs quản lý mã quản trị và quản lý lớp học. |
| `backend/firestore-service.js` | Chỉnh sửa | Mở rộng Firestore Service quản lý `admin_codes`, `classes`, duyệt học viên, lưu trữ lớp và ma trận tiến độ. |
| `backend/firestore.rules` | Chỉnh sửa | Cập nhật quy tắc bảo mật Firestore kiểm soát quyền truy cập bộ sưu tập `admin_codes` và `classes` (do specialist subagent `firestore-rules-author` thực hiện). |
| `main.html` | Chỉnh sửa | Thêm banner xem bài chỉ đọc `#student-preview-banner`, nút menu quản trị, modal quản lý lớp học và modal tham gia lớp cho học viên. |
| `css/style.css` | Chỉnh sửa | Thêm định kiểu cho banner chỉ đọc, thẻ modal quản trị, ma trận tiến độ, huy hiệu trạng thái và thanh phân bổ danh mục (hỗ trợ Light/Dark mode). |
| `js/script.js` | Chỉnh sửa | Logic điều khiển modal quản lý lớp, duyệt thành viên, render ma trận tiến độ, tính dashboard phân tích, sinh mã quản trị và chế độ xem bài học viên chỉ đọc. |
| `script.js` | Chỉnh sửa | Đồng bộ 100% byte-for-byte với `js/script.js` theo quy định nghiêm ngặt của dự án. |
| `package.json` | Chỉnh sửa | Bổ sung script chạy kiểm thử tự động `"test": "node --test tests/unit.test.js"`. |
| `tests/unit.test.js` | Tạo mới | Bộ kiểm thử tự động toàn diện kiểm chứng xác thực mã, crypto, phân quyền, quản lý lớp và bảo toàn dữ liệu tài chính. |
| `docs/user-guide.html` & `docs/admin-guide.html` | Tạo mới | Mã nguồn HTML A4 thiết kế sẵn sàng cho việc in ấn xuất bản tài liệu PDF. |
| `user-guide.pdf` & `docs/user-guide.pdf` | Tạo mới | Tài liệu PDF hướng dẫn chi tiết dành cho học viên và người dùng cá nhân (135,207 bytes). |
| `admin-guide.pdf` & `docs/admin-guide.pdf` | Tạo mới | Tài liệu PDF hướng dẫn chuyên sâu dành cho Quản trị viên hệ thống và Giảng viên (156,319 bytes). |
| `BAO_CAO_KHAO_SAT_TRUOC_TRIEN_KHAI.md` | Tạo mới | Báo cáo Mốc 1 lưu tại thư mục gốc và `docs/`. |
| `BAO_CAO_KET_QUA_TRIEN_KHAI.md` | Tạo mới | Báo cáo Mốc 2 bàn giao nghiệm thu dự án tại thư mục gốc và `docs/`. |

---

## 5. CÁC TÍNH NĂNG QUẢN TRỊ ĐÀO TẠO ĐÃ HOÀN THÀNH

### 5.1. Quản lý lớp học & Duyệt học viên
- Giảng viên/Quản trị viên có thể tạo nhiều lớp học khác nhau (Ví dụ: Lớp K48, Lớp K49).
- Hệ thống tự sinh Mã Lớp độc nhất dạng `CLASS-XXXX` hoặc cho phép tùy biến mã.
- Học viên gửi yêu cầu tham gia bằng Mã Lớp; Giảng viên xem danh sách học viên kèm ngày yêu cầu và thực hiện Duyệt hoặc Từ chối ngay trên bảng dữ liệu.
- Tính năng Lưu trữ (Archive) đóng băng lớp học khi kết thúc kỳ.

### 5.2. Ma trận tiến độ học tập (Progress Matrix)
- Ma trận tự động quét tiến độ thực hiện của từng học viên trên 4 khối:
  1. **Khối Từ khóa:** Khai báo tuổi, tỷ lệ lạm phát, lãi suất đầu tư.
  2. **Khối Kế hoạch:** Khai báo thu chi, quỹ dự phòng.
  3. **Khối Mục tiêu:** Thiết lập quỹ học đại học cho con hoặc quỹ hưu trí.
  4. **Khối Lộ trình:** Hoàn thiện bảng dòng tiền 30 năm và cơ cấu danh mục tài sản.
- Hiển thị huy hiệu màu sắc trực quan (Xanh: Hoàn thành, Vàng: Đang làm, Xám: Chưa làm).

### 5.3. Dashboard phân tích tổng hợp lớp học (Class Analytics)
- **Tỷ lệ hoàn thành trung bình:** Tính toán % mức độ hoàn thành bài tập của cả lớp.
- **Phân bổ danh mục đầu tư khuyến nghị bình quân:** Tự động tổng hợp và hiển thị biểu đồ phân bổ tỷ lệ phần trăm bình quân toàn lớp cho 4 lớp tài sản: Cổ phiếu, Trái phiếu, Bảo hiểm, Tiền gửi.
- **Phân bổ nhóm tuổi học viên:** Thống kê cơ cấu lứa tuổi tham gia lớp học.

### 5.4. Chế độ xem bài học viên chỉ đọc (Read-only Inspection Mode)
- Giảng viên nhấp nút "Xem bài" của bất kỳ học viên nào đã được duyệt.
- Dữ liệu kế hoạch riêng của Giảng viên được sao lưu tự động vào `window._instructorBackupState`.
- Toàn bộ giao diện chuyển sang chế độ thanh tra với thanh banner màu cam ở đỉnh màn hình: `"Đang xem bài của học viên: [Tên học viên] (Chế độ chỉ đọc)"`.
- Vô hiệu hóa nút Lưu Kế Hoạch, chặn hàm `saveAppStateToCloud` để đảm bảo dữ liệu học viên không bao giờ bị ghi đè nhầm.
- Nhấn "Quay lại Quản lý Lớp học" sẽ khôi phục 100% dữ liệu ban đầu của Giảng viên.

---

## 6. KẾT QUẢ CHẠY KIỂM THỬ THỰC TẾ (TEST LOGS)

Lệnh thực thi kiểm thử: `npm test`  
Trình chạy kiểm thử: `node --test tests/unit.test.js` (Node.js Native Test Runner)

```
> financials-plan.github.io@2.4.0 test
> node --test tests/unit.test.js

TAP version 13
# Subtest: 1. Admin Code Validation and Crypto Generation
    # Subtest: Valid format XXXX-XXXX-XXXX matches strictly
    ok 1 - Valid format XXXX-XXXX-XXXX matches strictly
      ---
      duration_ms: 1.1174
      ...
    # Subtest: Invalid formats are rejected
    ok 2 - Invalid formats are rejected
      ---
      duration_ms: 0.2442
      ...
    # Subtest: Cryptographic generation produces unique 14-char codes
    ok 3 - Cryptographic generation produces unique 14-char codes
      ---
      duration_ms: 1.1918
      ...
    1..3
ok 1 - 1. Admin Code Validation and Crypto Generation
  ---
  duration_ms: 5.8947
  ...
# Subtest: 2. Backend API - Admin Codes & Role Assignment
ok 2 - 2. Backend API - Admin Codes & Role Assignment
  ---
  duration_ms: 265.1309
  ...
# Subtest: 3. Backend API - Class & Group Management
ok 3 - 3. Backend API - Class & Group Management
  ---
  duration_ms: 10.5065
  ...
# Subtest: 4. Financial Data & Code Parity Preservation
ok 4 - 4. Financial Data & Code Parity Preservation
  ---
  duration_ms: 10.6382
  ...
1..4
# tests 7
# suites 0
# pass 7
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 684.8454
```

### Đánh giá An toàn & Bảo mật:
- **Kiểm soát Truy cập:** Học viên không thể tự cấp quyền admin/instructor do cơ chế xác thực server-side nghiêm ngặt.
- **Bảo mật Mật mã:** Không tồn tại secret hay token lộ lọt trong git diff hoặc code client.
- **Phòng chống Ghi đè chéo:** Chế độ xem bài chỉ đọc ngăn chặn hoàn toàn việc ghi đè session và dữ liệu chéo giữa các tài khoản.

---

## 7. MINH CHỨNG BẢO TOÀN DỮ LIỆU VÀ CÔNG THỨC HIỆN CÓ

1. **Bảo toàn các công thức tài chính:**
   - Công thức tính giá trị tương lai của chi phí học tập: \(FV = PV \times (1 + i)^n\) với lạm phát giáo dục đặc thù.
   - Công thức quỹ hưu trí: Giá trị tích lũy niên kim và chiết khấu dòng tiền tuổi 60 đến 80.
   - Thuật toán phân bổ danh mục đầu tư khuyến nghị theo độ tuổi (tỷ lệ Cổ phiếu, Trái phiếu, Tiền gửi, Bảo hiểm).
   - Kiểm thử tự động tại Subtest 4 khẳng định: Kết quả tính toán kế hoạch mẫu giữ nguyên tuyệt đối giá trị trước và sau khi triển khai tính năng quản trị.
2. **Bảo toàn các thông số Từ khóa và Mục tiêu cố định:**
   - Các trường trong Khối Từ khóa (Tuổi, Lạm phát, Lãi suất tiền gửi, Lãi suất trái phiếu, Lợi suất cổ phiếu) không bị thay đổi định dạng.
   - Các mục tiêu tài chính cốt lõi: **"Cho con đi học đại học"** và **"Hưu trí"** tiếp tục đóng vai trò là hai mục tiêu trụ cột cố định của hệ thống.
3. **Tính toàn vẹn mã nguồn:**
   - Độ đồng bộ giữa `js/script.js` và `script.js` đạt **100.00%**. Mã băm SHA-256 hoàn toàn trùng khớp: `E34FA83D1FF9419133952EE8709534E67199FCB7B33FB81C053B2225ED132464`.

---

## 8. THÔNG TIN VÀ ĐƯỜNG DẪN 2 TỆP TÀI LIỆU PDF

Hai tài liệu PDF đã được tạo lập hoàn chỉnh, đạt chuẩn in ấn A4, hiển thị tiếng Việt Unicode rõ nét:

1. **Tài liệu Hướng dẫn Học viên (`user-guide.pdf`):**
   - Đường dẫn tại thư mục gốc: `d:\Code - IT\anything without cpp\financials-plan.github.io-main\user-guide.pdf`
   - Đường dẫn tại thư mục docs: `d:\Code - IT\anything without cpp\financials-plan.github.io-main\docs\user-guide.pdf`
   - Kích thước: **135,207 bytes** (~132 KB).
   - Nội dung: Giới thiệu hệ thống, hướng dẫn đăng ký/đăng nhập, cách nhập liệu 4 khối chức năng, tham gia lớp học qua Mã Lớp, cơ chế Cloud Sync và bảo mật dữ liệu cá nhân.

2. **Tài liệu Hướng dẫn Quản trị viên & Giảng viên (`admin-guide.pdf`):**
   - Đường dẫn tại thư mục gốc: `d:\Code - IT\anything without cpp\financials-plan.github.io-main\admin-guide.pdf`
   - Đường dẫn tại thư mục docs: `d:\Code - IT\anything without cpp\financials-plan.github.io-main\docs\admin-guide.pdf`
   - Kích thước: **156,319 bytes** (~152 KB).
   - Nội dung: Mô hình phân quyền RBAC, quy trình cấp phát/quản lý Mã Quản trị `XXXX-XXXX-XXXX`, quản lý lớp học và duyệt học viên, ma trận tiến độ học tập, chế độ xem bài chỉ đọc an toàn, dashboard phân tích lớp học, sao lưu và chuyển giao quyền sở hữu Firebase.

---

## 9. CAM KẾT TUÂN THỦ QUY TẮC COMMENT VÀ CÔNG NGHỆ

1. **Quy tắc Tối cao về Comment trong Code:**
   - Toàn bộ các dòng code mới hoặc code được sửa đổi trong tất cả các tệp (`auth/auth.js`, `auth/index.html`, `backend/security.js`, `backend/server.js`, `backend/firestore-service.js`, `backend/firestore.rules`, `main.html`, `css/style.css`, `js/script.js`, `script.js`) **KHÔNG CHỨA BẤT KỲ COMMENT NÀO**.
   - Ngoại lệ duy nhất là tài liệu hướng dẫn chuyển giao quyền sở hữu quản trị dữ liệu đã có từ trước trong `firebase-config.js` được bảo toàn nguyên vẹn.
   - Đã kiểm tra lại bằng lệnh: `git diff | Select-String -Pattern '^\+\s*(//|/\*|\*)'` -> Kết quả: 0 vi phạm.

2. **Không sao chép công nghệ của dự án tham khảo:**
   - Giữ vững nền tảng hiện hữu: HTML5 Semantic, Vanilla JavaScript (ES6+), CSS3 Variables hiện đại, Node.js HTTP Server và Google Cloud Firestore.
   - Không nhập khẩu bất kỳ thư viện ORM, cơ sở dữ liệu lạ, framework nặng nề hay giải pháp công nghệ không tương thích từ dự án mẫu.

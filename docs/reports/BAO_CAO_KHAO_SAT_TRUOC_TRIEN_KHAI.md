# BÁO CÁO KHẢO SÁT VÀ ĐỐI CHIẾU TRƯỚC TRIỂN KHAI
**Dự án:** Xây Dựng Lộ Trình Tài Chính Cá Nhân  
**Giai đoạn:** Mốc 1 — Khảo sát Hiện trạng & Kế hoạch Tích hợp Nghiệp vụ từ Báo cáo Tham khảo  
**Thời điểm lập:** 25/10/2026  
**Trạng thái:** Hoàn thành khảo sát — Sẵn sàng triển khai  

---

## 1. TỔNG QUAN HIỆN TRẠNG CODEBASE VÀ CÔNG NGHỆ THỰC TẾ

### 1.1. Kiến trúc tổng thể và công nghệ đang sử dụng
Dự án **“Xây Dựng Lộ Trình Tài Chính Cá Nhân”** là một hệ thống ứng dụng web chuyên sâu về quản lý dòng tiền, mục tiêu tài chính và cân đối lộ trình nghề nghiệp. Qua kiểm tra thực tế codebase tại commit gần nhất, hệ thống bao gồm:
- **Tầng giao diện (Frontend):**
  - `main.html`: Trang ứng dụng chính (Single Page Application layout với các tab: "Từ khoá", "Kế hoạch", "Mục tiêu", "Cân đối lộ trình nghề nghiệp", "Bảng cân đối số phát sinh").
  - `auth/index.html`, `auth/auth.css`, `auth/auth.js`: Phân hệ xác thực chuyên biệt gồm 3 tab (Đăng nhập, Đăng ký, Quên mật khẩu).
  - `index.html`: Trang giới thiệu / chuyển hướng ban đầu.
  - `css/style.css`: Bộ stylesheet tùy biến toàn diện (hỗ trợ Light / Dark mode, modal, bảng tài chính, responsive).
  - `js/script.js` và bản đồng bộ `script.js`: Toàn bộ logic quản lý trạng thái (`AppState`), reactive rendering, tính toán tài chính và tương tác giao diện. Yêu cầu bắt buộc duy trì tính tương đồng 100% byte-for-byte giữa 2 file.
- **Tầng dữ liệu và đám mây (Storage & Cloud Backend):**
  - `config/firebase-config.js`: Khởi tạo thông số kết nối Firebase Web App (Project ID: `financials-plan`), chứa hướng dẫn chuyển giao quyền quản trị người sở hữu dữ liệu.
  - `backend/firestore-service.js`: Adapter kết nối Cloud Firestore (SDK v10.12.0 dạng ESM), hỗ trợ lưu trữ hồ sơ tài chính (`financial_Authentication`), tài khoản xác thực (`financial_accounts`), lịch sử sao lưu (`_backups`) và cơ chế đồng bộ LocalStorage an toàn khi ngoại tuyến.
  - `backend/firestore.rules`: Quy tắc bảo mật Firestore Rules v2 với kiểm tra schema payload, độ dài trường, định dạng docId và chặn ghi đè trái phép.
  - `backend/server.js` & `backend/security.js`: Node.js HTTP Server độc lập phục vụ API xác thực nội bộ, kiểm soát Rate Limiting theo IP, mã hóa mật khẩu PBKDF2 (SHA-256, 60.000 rounds), chống Prototype Pollution và áp dụng Security Headers chuẩn OWASP.
  - `backend/functions/index.js`: Firebase Cloud Functions v2 (region `asia-southeast1`) hỗ trợ các callable functions phục vụ xác thực an toàn.

### 1.2. Cơ chế lưu trữ và phiên đăng nhập hiện tại
- **Mô hình phiên người dùng (`UserSession`):**
  - Lưu trữ qua khóa `FIN_APP_USER_SESSION` và danh sách thiết bị `FIN_APP_PROFILES_LIST`.
  - Context phiên bao gồm: `uid`, `username`, `displayUsername`, `normalizedUsername`, `docId`, `maskedEmail`, `hasRecoveryEmail`, `sessionToken`, `authenticatedAt`, `lastActive`.
  - Kiểm tra tính hợp lệ của token và quyền truy cập qua hàm `verifyDataAccessPermission(requestedDocId)` tại `backend/firestore-service.js`.

### 1.3. Mô hình vai trò (Role Model) hiện tại
- **Hiện trạng:**
  - Hệ thống hiện tại có các tài khoản seed: `admin` (Admin), `dinh_anh_quan`, `hst`, `demo`.
  - Chưa có trường phân loại vai trò tường minh trong đối tượng người dùng đăng ký mới (`role`).
  - Mọi người dùng khi đăng ký tự do qua form đăng ký hiện tại đều được tạo tài khoản độc lập và lưu trữ hồ sơ tài chính cá nhân riêng biệt (`user_<normalizedUsername>`).
  - Chưa có phân quyền giữa Quản trị viên hệ thống (System Admin), Quản lý nhóm/lớp (Instructor/Manager), Học viên (Student) và Khách (Guest).

---

## 2. BẢNG ĐỐI CHIẾU Ý TƯỞNG TỪ BÁO CÁO THAM KHẢO

Dưới đây là bảng đối chiếu chi tiết giữa các ý tưởng nghiệp vụ từ báo cáo dự án mẫu với thực trạng codebase hiện tại:

| STT | Ý tưởng từ báo cáo tham khảo | Chức năng tương ứng đang có trong repo | Bằng chứng trong code | Trạng thái | Lợi ích | Rủi ro & Phụ thuộc | Khuyến nghị giải pháp |
|---|---|---|---|---|---|---|---|
| 1 | **Quản lý danh sách nhóm / lớp học** | Chưa có. Mọi người dùng hoạt động độc lập theo tài khoản cá nhân. | `backend/firestore-service.js`, `main.html` chưa có cấu trúc lớp. | **Còn thiếu** | Cho phép giảng viên gom nhóm học viên để theo dõi đào tạo. | Cần thiết kế schema dữ liệu lớp (`classes`) tương thích Firestore & LocalStorage. | **Bổ sung** module Quản lý lớp tích hợp trong giao diện quản trị của Giảng viên. |
| 2 | **Duyệt thành viên tham gia lớp (Chờ duyệt, Chấp thuận, Từ chối)** | Chưa có. | `main.html`, `auth/auth.js` | **Còn thiếu** | Kiểm soát số lượng và danh tính học viên trong lớp học tài chính. | Cần đảm bảo khi bị từ chối/gỡ khỏi lớp, tài khoản và dữ liệu học viên không bị xóa. | **Bổ sung** luồng gửi yêu cầu tham gia lớp, bảng duyệt thành viên cho Giảng viên. |
| 3 | **Ma trận theo dõi tiến độ học tập** | Có thanh tiến độ và các trạng thái tính toán trong từng tab của từng cá nhân. | `renderMilestones()`, `renderPersonalGoals()` trong `js/script.js`. | **Đã có một phần** | Giảng viên nắm bắt học viên đã hoàn thành những phần nào của bài thực hành. | Không tự tạo module giả; phải gắn chặt vào 4 phần thực tế của repo: Từ khoá, Kế hoạch, Mục tiêu, Lộ trình. | **Cải thiện & Tổng hợp** thành Ma trận tiến độ 4 phân hệ chính của lớp học. |
| 4 | **Chế độ xem bài học viên chỉ đọc (Read-only student viewer)** | Hệ thống cho phép tải hồ sơ theo `docId` nếu được phân quyền. | `loadData(customDocId)` trong `backend/firestore-service.js`. | **Đã có một phần** | Giảng viên xem bài làm của học viên để chấm điểm, nhận xét trực quan. | Nguy cơ ghi đè session của giảng viên hoặc học viên tự sửa dữ liệu khi đang xem. | **Bổ sung** Chế độ xem cách ly (Read-only Preview): khóa toàn bộ input, nút lưu, banner cảnh báo, không ghi đè session. |
| 5 | **Dashboard phân tích tài chính tổng hợp lớp** | Có dashboard phân tích cá nhân (chỉ số dòng tiền, tỷ lệ tiết kiệm, phân bổ tài sản). | `renderDashboardSummary()` trong `js/script.js`. | **Đã có một phần** | Giúp giảng viên thấy bức tranh tài chính chung của cả lớp học. | Không được hiển thị dữ liệu nhạy cảm cho học viên khác; tính toán dựa trên công thức thực tế. | **Bổ sung** Dashboard phân tích tổng hợp lớp học dành riêng cho Giảng viên. |
| 6 | **Cấp quyền Quản trị viên bằng "Mã Quản trị" tại biểu mẫu Đăng ký** | Form đăng ký có trường Username, Mật khẩu, Xác nhận MK, Email khôi phục. | `auth/index.html` dòng 175-261, `auth/auth.js` dòng 842-914. | **Còn thiếu** | Cho phép phân quyền Quản trị viên/Giảng viên an toàn ngay từ bước đăng ký mà không lộ API. | Nguy cơ nâng quyền trái phép nếu kiểm tra ở frontend; mã phải sinh crypto và xác minh backend. | **Bổ sung bắt buộc** trường “Mã Quản trị” với định dạng chuẩn `XXXX-XXXX-XXXX`, xác minh backend chặt chẽ. |
| 7 | **Sao lưu dữ liệu nhóm/lớp và Lưu trữ kết thúc học kỳ (Term-End Archive)** | Có tính năng Sao lưu/Khôi phục hồ sơ cá nhân và xuất JSON/Excel. | `openUnifiedDataModal()`, `openBackupManagerModal()` trong `js/script.js`. | **Đã có một phần** | Đóng gói dữ liệu kết thúc khóa học, lưu trữ an toàn, giải phóng lớp cho khóa mới. | Thao tác kết thúc học kỳ không được xóa vĩnh viễn dữ liệu học viên hay xóa tài khoản. | **Cải thiện & Mở rộng** tính năng đóng/lưu trữ lớp học và xuất bản sao lưu lớp an toàn. |
| 8 | **Chuyển đổi toàn bộ sang Framework SSR hoặc DB khác** | Dự án đang chạy HTML5/ESM Vanilla + Cloud Firestore + Node server. | Toàn bộ repo. | **Không phù hợp** | Báo cáo mẫu dùng công nghệ khác. | Vi phạm nguyên tắc bảo toàn công nghệ, làm gãy toàn bộ cấu trúc dự án. | **Không áp dụng**. Tuyệt đối giữ nguyên kiến trúc HTML5 Vanilla JS + Firestore hiện có. |

---

## 3. THIẾT KẾ CHI TIẾT TRƯỜNG "MÃ QUẢN TRỊ" VÀ MÔ HÌNH PHÂN QUYỀN

### 3.1. Vị trí trên biểu mẫu Đăng ký
- **Vị trí UI:** Trong file `auth/index.html`, tại `#auth-panel-register`, ngay sau trường Email khôi phục (`#wrap-auth-reg-email`) và trước trường Mật khẩu (`#wrap-auth-reg-password`).
- **Nhãn trường:** Chính xác là **“Mã Quản trị”**.
- **Thuộc tính Input:**
  - `id="input-auth-reg-admin-code"`
  - `placeholder="Ví dụ: ADMN-2026-X8Y9 (nếu có)"`
  - `autocomplete="off"`
  - `maxlength="14"` (tính cả 2 dấu gạch nối)
  - Bộ định dạng tự động: Chuyển hoa, tự chèn gạch ngang sau mỗi 4 ký tự: `XXXX-XXXX-XXXX`.
- **Ghi chú hướng dẫn (Hint):** *"Dành cho Giảng viên hoặc Quản trị viên hệ thống được cấp mã xác thực. Người học thông thường vui lòng để trống trường này."*

### 3.2. Quy tắc định dạng và sinh mã bảo mật
- **Quy tắc định dạng:** Chính xác **`XXXX-XXXX-XXXX`** gồm 12 ký tự chữ cái viết hoa và chữ số (bảng ký tự `[A-Z0-9]`), phân tách thành 3 cụm bởi dấu gạch ngang `-`.
- **Thuật toán sinh mã:** Sinh ngẫu nhiên bảo mật bằng `crypto.randomBytes(9)` (phía Node.js) hoặc `crypto.getRandomValues(new Uint8Array(9))` (phía Web Crypto API), sau đó ánh xạ vào bảng mã `23456789ABCDEFGHJKLMNPQRSTUVWXYZ` (đã loại bỏ các ký tự dễ nhầm lẫn như 0, O, 1, I).
- **Cấu trúc lưu trữ backend của mã quản trị (`admin_codes`):**
  ```json
  {
    "code": "ADMN-8K9P-4X2Z",
    "role": "admin", // hoặc "instructor"
    "description": "Mã cấp quyền Giảng viên Khóa K48",
    "maxUses": 1,
    "usedCount": 0,
    "isRevoked": false,
    "expiresAt": "2026-12-31T23:59:59.000Z",
    "createdAt": "2026-10-25T00:00:00.000Z"
  }
  ```

### 3.3. Quy trình xác minh và gán vai trò tại Backend
1. **Trường hợp để trống “Mã Quản trị”:**
   - Hệ thống xử lý đăng ký tài khoản học viên thông thường.
   - Gán vai trò mặc định có đặc quyền tối thiểu: `role = "student"`.
2. **Trường hợp người dùng nhập “Mã Quản trị”:**
   - Kiểm tra định dạng Regex: `/^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/`.
   - Tra cứu mã trong cơ sở dữ liệu xác thực backend (`admin_codes` collection trong Firestore hoặc secure memory store tại server).
   - Kiểm tra 4 điều kiện an toàn bắt buộc:
     1. Mã có tồn tại trong hệ thống.
     2. Mã chưa bị thu hồi (`isRevoked === false`).
     3. Mã còn hạn sử dụng (`Date.now() < new Date(expiresAt).getTime()`).
     4. Số lần sử dụng còn lại (`usedCount < maxUses`).
   - **Nếu hợp lệ:**
     - Gán vai trò được cấp tương ứng (`instructor` hoặc `admin`).
     - Tăng `usedCount` thêm 1. Nếu `usedCount >= maxUses`, đánh dấu hết lượt.
     - Ghi nhận `activatedBy: normalizedUsername` và `activatedAt: ISOString`.
     - Trả về thông báo thành công và thông tin phiên có chứa vai trò hợp lệ.
   - **Nếu không hợp lệ (sai mã, hết hạn, bị thu hồi hoặc hết lượt):**
     - Tuyệt đối không cấp quyền quản trị.
     - Trả về thông báo lỗi an toàn: *"Mã Quản trị không hợp lệ hoặc đã hết hạn/hết lượt sử dụng. Vui lòng kiểm tra lại hoặc để trống để đăng ký tài khoản thường."*
     - Không trả về chi tiết kỹ thuật làm lộ thông tin dò mã.

---

## 4. HỆ THỐNG VAI TRÒ VÀ MA TRẬN PHÂN QUYỀN (RBAC)

Hệ thống thiết lập 4 vai trò rõ ràng:
1. **Quản trị hệ thống (`admin`):**
   - Quyền hạn: Quản lý toàn bộ danh sách tài khoản, xem thống kê hệ thống, tạo và thu hồi "Mã Quản trị", quản lý tất cả các nhóm/lớp học và xuất toàn bộ bản sao lưu hệ thống.
2. **Quản trị nhóm/lớp / Giảng viên (`instructor`):**
   - Quyền hạn: Tạo và quản lý nhóm/lớp do mình phụ trách; duyệt, từ chối hoặc gỡ học viên trong lớp; xem Ma trận tiến độ học tập của học viên trong lớp; xem bài làm của học viên ở Chế độ chỉ đọc (Read-only); xem Dashboard phân tích tài chính tổng hợp của lớp; sao lưu và đóng/lưu trữ lớp học cuối kỳ.
   - Giới hạn: Không được xem dữ liệu tài chính của các lớp do giảng viên khác phụ trách; không có quyền quản trị hệ thống toàn cục.
3. **Học viên / Thành viên (`student`):**
   - Quyền hạn: Nhập liệu và lập kế hoạch tài chính cá nhân trên 4 phân hệ ("Từ khoá", "Kế hoạch", "Mục tiêu", "Lộ trình"); gửi yêu cầu tham gia lớp học qua Mã lớp; xem trạng thái duyệt lớp của mình; sao lưu/khôi phục hồ sơ tài chính cá nhân.
   - Giới hạn: Tuyệt đối không được xem bài làm hoặc chỉ số tài chính của bạn học trong lớp; không có quyền truy cập trang quản trị.
4. **Khách (`guest`):**
   - Quyền hạn: Dùng thử tính năng tính toán cục bộ trên trình duyệt mà không lưu lên đám mây.

---

## 5. THIẾT KẾ MA TRẬN TIẾN ĐỘ VÀ CHẾ ĐỘ XEM CHỈ ĐỌC

### 5.1. Ma trận tiến độ học tập 4 phân hệ
Tiến độ của từng học viên được đánh giá định lượng dựa trên dữ liệu thực tế tại 4 phân hệ cốt lõi:
1. **Phân hệ 1 — "Từ khoá" (Thiết lập ban đầu):** Hoàn thành khi có đầy đủ Họ tên, Năm sinh, Thu nhập thực tế > 0, Chi tiêu thiết yếu > 0, Tỷ lệ lạm phát và Lãi suất đầu tư dự kiến.
2. **Phân hệ 2 — "Kế hoạch" (Dòng tiền 12 tháng):** Hoàn thành khi có ít nhất 1 tháng được phân bổ chi tiết các khoản thu/chi thực tế hoặc dự phóng và chênh lệch thu - chi được tính toán.
3. **Phân hệ 3 — "Mục tiêu" (Mục tiêu tài chính):** Hoàn thành khi cấu hình xong 2 mục tiêu cố định ("Cho con đi học đại học" và "Hưu trí") với số tiền mục tiêu và thời gian khả thi.
4. **Phân hệ 4 — "Lộ trình" (Cân đối nghề nghiệp & Danh mục đầu tư):** Hoàn thành khi bảng Lộ trình 30 năm được khởi tạo và cơ cấu danh mục phân bổ tài sản khuyến nghị được rà soát.

Mỗi phân hệ có 3 trạng thái chuẩn hóa:
- `completed` (Đã hoàn thành - xanh lá): Đạt 100% điều kiện.
- `in_progress` (Đang thực hiện - vàng): Đã nhập một phần dữ liệu.
- `not_started` (Chưa bắt đầu - xám): Chưa có dữ liệu khởi tạo.

### 5.2. Chế độ xem bài học viên chỉ đọc (Read-Only Inspection Mode)
Để giảng viên xem bài học viên mà không xảy ra xung đột hay phá hỏng dữ liệu:
- Khi Giảng viên bấm "Xem bài học viên" từ danh sách lớp:
  1. Trạng thái phiên của giảng viên (`activeAuthContext`, `localStorage.getItem("FIN_APP_USER_SESSION")`) được **bảo lưu nguyên vẹn** trong một biến ngữ cảnh cách ly (`InstructorSessionContext`).
  2. Dữ liệu bài làm của học viên được nạp vào một trạng thái xem riêng biệt (`StudentPreviewState`).
  3. Giao diện kích hoạt cờ `isReadOnlyStudentView = true`.
  4. Hiển thị Banner cố định ở đầu trang:  
     *“ĐANG XEM BÀI HỌC VIÊN: [HỌ TÊN] (@username) — CHẾ ĐỘ CHỈ ĐỌC (READ-ONLY)”* cùng nút bấm nổi bật **[Quay lại Quản lý Lớp]**.
  5. **Khóa toàn bộ khả năng tương tác sửa đổi:**
     - Mọi thẻ `<input>`, `<select>`, `<textarea>` đều bị thiết lập `disabled = true` hoặc `readonly = true`.
     - Ẩn hoặc vô hiệu hóa các nút Thêm dòng, Xóa dòng, Lưu hồ sơ, Đồng bộ đám mây, Nhập JSON, Đặt lại mặc định.
     - Hàm `saveData()` bị chặn cưỡng bức ở tầng logic nếu cờ `isReadOnlyStudentView` đang bật.
  6. Khi giảng viên bấm **[Quay lại Quản lý Lớp]**, hệ thống giải phóng `StudentPreviewState`, khôi phục lại dữ liệu của giảng viên mà không gây ra bất kỳ sự cố mất mát hay lệch số liệu nào.

---

## 6. BẢO TOÀN DỮ LIỆU TÀI CHÍNH VÀ CÁC CÔNG THỨC HIỆN CÓ

Hệ thống cam kết tuân thủ tuyệt đối các nguyên tắc bảo toàn:
1. **Khu vực "Từ khoá":** Không bị ghi đè khi đăng nhập, khôi phục phiên, hoặc khi chuyển đổi giữa các chế độ xem.
2. **Mục tiêu cố định:** Hai mục tiêu *"Cho con đi học đại học"* và *"Hưu trí"* được bảo vệ cố định về định danh và luồng tính toán, không bị đổi tên hay xóa bỏ.
3. **Bảng Cơ cấu danh mục đầu tư khuyến nghị:** Giữ nguyên các tỷ lệ chuẩn mực benchmark đã hoàn thiện:
   - 21 tuổi: Cổ phiếu 23.6% | Trái phiếu 34.5% | Bảo hiểm 8.5% | Tiền gửi 33.4% | Lợi suất 8.94%
   - 26 tuổi: Cổ phiếu 56.8% | Trái phiếu 20.6% | Bảo hiểm 5.7% | Tiền gửi 16.9% | Lợi suất 11.06%
   - 31 tuổi: Cổ phiếu 81.3% | Trái phiếu 0.0% | Bảo hiểm 10.7% | Tiền gửi 7.9% | Lợi suất 12.28%
   - 36 tuổi: Cổ phiếu 45.5% | Trái phiếu 0.0% | Bảo hiểm 33.0% | Tiền gửi 21.6% | Lợi suất 9.95%
   - 41 tuổi: Cổ phiếu 32.3% | Trái phiếu 0.0% | Bảo hiểm 45.1% | Tiền gửi 22.6% | Lợi suất 9.15%
   - 46 tuổi: Cổ phiếu 20.8% | Trái phiếu 0.0% | Bảo hiểm 58.1% | Tiền gửi 21.1% | Lợi suất 8.51%
4. **Quy tắc không thêm comment vào code:** Tuân thủ 100% không thêm bất kỳ comment nào vào code mới hoặc code chỉnh sửa.

---

## 7. KẾ HOẠCH TRIỂN KHAI VÀ DANH SÁCH FILE ẢNH HƯỞNG

### 7.1. Danh sách file bị tác động
1. `auth/index.html`: Thêm trường input "Mã Quản trị" tại `#auth-panel-register`.
2. `auth/auth.js`: Thêm logic validation và truyền trường `adminCode` khi gửi form đăng ký.
3. `backend/security.js`: Bổ sung hàm sinh mã quản trị chuẩn `XXXX-XXXX-XXXX` và validation regex.
4. `backend/server.js`: Bổ sung kho lưu trữ `adminCodesStore`, xử lý `adminCode` trong API `/api/auth/register`, kiểm tra quyền hạn và cấp vai trò (`admin`, `instructor`, `student`).
5. `backend/firestore-service.js`: Mở rộng `registerAccount` chấp nhận `adminCode`, kiểm tra Firestore collection `admin_codes` / local store, gán trường `role` cho tài khoản; bổ sung các API quản lý lớp học (`createClass`, `getClasses`, `requestJoinClass`, `getStudentProgress`, `approveStudent`, `archiveClass`).
6. `main.html`:
   - Bổ sung giao diện Quản lý Lớp học / Dashboard Giảng viên (tab hoặc modal chuyên dụng chỉ hiển thị cho tài khoản có `role === 'instructor'` hoặc `role === 'admin'`).
   - Bổ sung Banner chế độ xem bài học viên chỉ đọc (`#student-preview-banner`).
7. `js/script.js` & `script.js`:
   - Bổ sung logic hiển thị giao diện quản lý lớp dựa trên role người dùng.
   - Bổ sung cơ chế khóa chỉ đọc an toàn khi xem bài học viên (`viewStudentPlanReadOnly`, `exitStudentPlanReadOnly`).
   - Giữ nguyên 100% tính tương đồng byte-for-byte giữa `js/script.js` và `script.js`.
8. `backend/firestore.rules`: Bổ sung match rules cho collection `admin_codes` và `classes`.
9. `user-guide.pdf` & `admin-guide.pdf`: Biên soạn tài liệu và xuất bản thành file PDF thực tế.
10. `BAO_CAO_KET_QUA_TRIEN_KHAI.md`: Báo cáo nghiệm thu Mốc 2 sau khi triển khai và kiểm thử hoàn tất.

### 7.2. Lộ trình triển khai theo từng bước
- **Bước 1:** Cập nhật form đăng ký tại `auth/index.html` và logic xử lý tại `auth/auth.js` với trường "Mã Quản trị".
- **Bước 2:** Cập nhật tầng bảo mật và xác thực tại `backend/security.js`, `backend/server.js` và `backend/firestore-service.js` với bộ sinh/xác thực mã `XXXX-XXXX-XXXX`, hỗ trợ lưu trữ và xác thực phân quyền an toàn.
- **Bước 3:** Bổ sung giao diện và logic Quản lý Lớp học, duyệt thành viên, Ma trận tiến độ và Dashboard lớp học tại `main.html`, `js/script.js` và `script.js`.
- **Bước 4:** Xây dựng Chế độ xem bài học viên chỉ đọc (Read-only student viewer) tuyệt đối an toàn.
- **Bước 5:** Bổ sung tính năng Sao lưu lớp học và Lưu trữ/Đóng lớp cuối kỳ (Term-End Archive).
- **Bước 6:** Tạo 2 tài liệu PDF: `user-guide.pdf` và `admin-guide.pdf` bằng công cụ Edge Headless bản địa.
- **Bước 7:** Viết và chạy bộ kiểm thử toàn diện, kiểm tra hồi quy, xác minh không có comment trong code và tính toàn vẹn byte-for-byte của `js/script.js` & `script.js`.
- **Bước 8:** Lập Báo cáo nghiệm thu kết quả triển khai `BAO_CAO_KET_QUA_TRIEN_KHAI.md` và hoàn tất công việc.

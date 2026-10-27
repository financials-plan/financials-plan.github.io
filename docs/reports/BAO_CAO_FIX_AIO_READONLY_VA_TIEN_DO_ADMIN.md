# BÁO CÁO FIX AIO — KHẮC PHỤC QUYỀN XÓA DỮ LIỆU TRONG CHẾ ĐỘ CHỈ ĐỌC VÀ LỖI KHÔNG HIỂN THỊ TIẾN ĐỘ LỘ TRÌNH CÁ NHÂN TRONG ADMIN

**Dự án:** Sổ Tài Chính Cá Nhân (`financials-plan.github.io`)  
**Ngày thực hiện:** 27/10/2026  
**Trạng thái:** HOÀN THÀNH TOÀN DIỆN (15/15 UNIT TESTS PASS)

---

## I. TỔNG QUAN PHẠM VI XỬ LÝ

Đợt cập nhật này tập trung xử lý dứt điểm hai vấn đề quan trọng liên quan đến phân quyền quan sát và hiển thị dữ liệu quản trị:

1. **Nhiệm vụ A (Phần A): Khắc phục triệt để quyền xóa/sửa dữ liệu khi Admin ở Chế độ Chỉ đọc/Quan sát học viên (`isReadOnlyStudentView`).**
   - Chặn toàn bộ thao tác xóa, thêm, sửa, đặt lại (reset) tại tầng giao diện (CSS, ẩn nút, vô hiệu hóa phím tắt).
   - Thiết lập tầng phòng ngự chụp sự kiện toàn cục (global capturing phase event listeners) cho các sự kiện `click`, `keydown` (bao gồm `Ctrl+S`, `Cmd+S`, gõ trong `contenteditable`), và `beforeinput`.
   - Thiết lập hàm bảo vệ nghiệp vụ `assertWritePermission(actionDescription)` tại đầu tất cả các hàm sửa/xóa/thêm dòng.
   - Thắt chặt tầng lưu trữ đám mây (`CloudDB.saveData`, `CloudDB.deleteBackup`, `CloudDB.deleteUserData`) lập tức từ chối và trả về `code: "PERMISSION_DENIED"` khi chế độ chỉ đọc đang bật.
   - Kiểm tra và siết chặt `backend/firestore.rules` thông qua subagent chuyên trách `firestore-rules-author`, tuân thủ 100% quy tắc Zero Comments Rule.

2. **Nhiệm vụ B (Phần B): Khắc phục lỗi không hiển thị tiến độ lộ trình cá nhân trong trang Admin.**
   - Sửa cơ chế truy vấn dữ liệu học viên: Bảng học viên không còn phụ thuộc vào `localStorage` cục bộ của thiết bị Admin (nơi vốn dĩ không có dữ liệu của học viên) mà nạp bất đồng bộ song song từ Cloud Firestore thông qua `getStudentClassProgress(studentUsername)` / `loadUserData(targetDocId)`.
   - Khắc phục sự sai lệch cấu trúc dữ liệu (Schema mapping): Bổ sung kiểm tra đầy đủ cả 4 phân hệ chính theo mô hình dữ liệu thực tế (`tcGoals`, `careerDetailList`, `milestonesStore`, `monthlyDetails`, `planIncome`, `planExpense`, `investProducts`).
   - Phản ánh chính xác phần trăm tiến độ (100%, 75%, 50%, 25%, 0%) và nhãn trạng thái ("Đã hoàn thành 100%", "Gần hoàn thành", "Đang lập lộ trình", "Mới bắt đầu", "Chưa nộp bài làm", "Chờ duyệt") trên cả giao diện Class Manager (`js/script.js`) và Cổng Quản Trị Độc Lập (`admin-web/admin.js`).

---

## II. CHI TIẾT NGUYÊN NHÂN GỐC VÀ GIẢI PHÁP KỸ THUẬT

### 1. Nhiệm vụ A: Quyền xóa dữ liệu trong chế độ chỉ đọc

#### A1. Nguyên nhân gốc
- Trước đây, khi Admin/Giảng viên nhấn "Xem bài" của học viên, hàm `viewStudentPlanReadOnly()` chỉ gán cờ `window.isReadOnlyStudentView = true;` và vô hiệu hóa nút `#btn-cloud-save`.
- Tuy nhiên:
  + Các nút xóa dòng trong bảng (`.btn-table-del`, `.btn-del-row`, `onclick="deleteExpenseItem(...)"`, `onclick="deleteTcGoalRow(...)"`, v.v.) vẫn hiển thị và vẫn có thể nhấn được.
  + Các ô bảng có thuộc tính `contenteditable="true"` vẫn cho phép người xem click vào và gõ sửa hoặc xóa nội dung.
  + Tổ hợp phím tắt như `Ctrl+S` vẫn kích hoạt luồng lưu.
  + Các hàm nghiệp vụ xóa và sửa (`deleteExpenseItem`, `deleteIncomeItem`, `deletePlanListItem`, `deleteInvestItem`, `deletePlanIncRow`, `deletePlanExpRow`, `deleteMonthIncomeRow`, `deleteMonthExpenseRow`, `deleteMonthLearningRow`, `deleteBalanceSheetAssetRow`, `deleteBalanceSheetLiabilityRow`, `deleteTcGoalRow`, `deleteSelectedBackup`, `resetAppStateToEmpty`, v.v.) không hề kiểm tra cờ `isReadOnlyStudentView`.
  + Tầng `backend/firestore-service.js` không kiểm tra `window.isReadOnlyStudentView` trước khi thực hiện ghi hoặc xóa lên Firestore.

#### A2. Giải pháp kỹ thuật đã triển khai
1. **Tầng giao diện (CSS - `css/style.css`):**
   - Bổ sung nhóm quy tắc CSS khóa cứng khi body có class `.is-student-preview-mode`:
     ```css
     body.is-student-preview-mode .btn-table-del,
     body.is-student-preview-mode .btn-del-row,
     body.is-student-preview-mode .btn-delete,
     body.is-student-preview-mode .fa-trash,
     body.is-student-preview-mode .fa-trash-can,
     body.is-student-preview-mode button[onclick*="delete"],
     body.is-student-preview-mode button[onclick*="add"],
     body.is-student-preview-mode button[onclick*="reset"],
     body.is-student-preview-mode #btn-cloud-save,
     body.is-student-preview-mode #btn-auto-fill,
     body.is-student-preview-mode #btn-reset-data,
     body.is-student-preview-mode .btn-add-row {
       display: none !important;
       pointer-events: none !important;
     }

     body.is-student-preview-mode [contenteditable="true"] {
       pointer-events: none !important;
       user-select: text !important;
       cursor: default !important;
       background-color: transparent !important;
     }
     ```
2. **Tầng bắt chặn sự kiện sớm (Capturing Phase Listeners - `js/script.js` & `script.js`):**
   - Đăng ký bộ lắng nghe sự kiện `click`, `keydown` (chặn `Ctrl+S` và phím gõ trong contenteditable), `beforeinput` ở chế độ bắt sớm (`useCapture: true`). Bất kỳ thao tác xóa hoặc thay đổi nào đều bị `stopImmediatePropagation()` và `preventDefault()` trước khi tới element đích.
3. **Tầng bảo vệ nghiệp vụ JS (`assertWritePermission`):**
   - Khởi tạo hàm `assertWritePermission(actionDescription)` toàn cục:
     ```javascript
     function assertWritePermission(actionDescription = "Thao tác") {
       if (window.isReadOnlyStudentView) {
         console.warn(`[ReadOnlyGuard] Chặn ${actionDescription}: Đang ở chế độ xem bài học viên chỉ đọc.`);
         if (typeof showToast === 'function') {
           showToast(`Không thể ${actionDescription.toLowerCase()}: Đang ở Chế độ Xem bài học viên (Chỉ đọc).`, "error");
         }
         return false;
       }
       return true;
     }
     window.assertWritePermission = assertWritePermission;
     ```
   - Đặt `if (!assertWritePermission("...")) return;` ở dòng đầu tiên của tất cả hơn 20 hàm xóa, thêm, sửa, reset.
4. **Tầng dịch vụ dữ liệu đám mây (`backend/firestore-service.js`):**
   - Thêm kiểm tra `if (typeof window !== "undefined" && window.isReadOnlyStudentView)` trong `saveData()`, `deleteBackup()` và `deleteUserData()`. Nếu bật, lập tức trả về:
     ```json
     {
       "success": false,
       "code": "PERMISSION_DENIED",
       "error": "Từ chối ghi/xóa dữ liệu: Đang ở chế độ xem bài học viên chỉ đọc."
     }
     ```
5. **Tầng Firestore Security Rules (`backend/firestore.rules`):**
   - Được phân quyền thực hiện độc quyền bởi subagent `firestore-rules-author`.
   - Bổ sung helper functions kiểm tra định danh và quyền xóa (`canDeleteDoc`, `isOwner`, `isValidDocId`).
   - Chặn xóa vô điều kiện trên các collection dữ liệu nhạy cảm.
   - Đảm bảo 100% Zero Comments Rule (không có bất kỳ ký tự `//` hay `/* */`).
   - Bảo toàn 100% các chuỗi bắt buộc cho các unit tests trước đó.

---

### 2. Nhiệm vụ B: Hiển thị tiến độ lộ trình cá nhân trong trang Admin

#### B1. Nguyên nhân gốc
- **Lỗi truy vấn sai nguồn:** Cả hàm `renderAdminStudentsTable()` trong `js/script.js` và `renderStudentsTable()` trong `admin-web/admin.js` đều kiểm tra:
  ```javascript
  let studentPlan = m.plan || null;
  if (!studentPlan) {
    try {
      const raw = localStorage.getItem("FIN_APP_LAST_STATE_user_" + m.username);
      if (raw) studentPlan = JSON.parse(raw);
    } catch (e) {}
  }
  ```
  Khi Giảng viên hoặc Admin đăng nhập từ máy tính của mình, `localStorage` của trình duyệt Admin hoàn toàn không có key `FIN_APP_LAST_STATE_user_...` của học viên! Vì vậy `studentPlan` luôn là `null`, dẫn đến tiến độ luôn bị tính là `0%` và nhãn là `"Chưa nộp bài làm"`, dù học viên đã điền đầy đủ và lưu lên Firebase.
- **Lỗi kiểm tra lệch Schema:** Code cũ kiểm tra các trường `personalGoals` và `careerMilestones`. Trong khi cấu trúc thực tế của `AppState` lưu mục tiêu tài chính tại `tcGoals`, lộ trình và danh mục đầu tư tại `careerDetailList`, `milestonesStore`, `careerRouteOverrides` và `investProducts`.

#### B2. Giải pháp kỹ thuật đã triển khai
1. **Truy vấn đám mây bất đồng bộ đa luồng (`Promise.all`):**
   - Tại `renderAdminStudentsTable()`, hệ thống nạp tiến độ đồng thời cho toàn bộ danh sách thành viên trong nhóm thông qua `window.CloudDB.getStudentClassProgress(m.username)`.
   - `getStudentClassProgress` lần lượt kiểm tra:
     + `loadUserData("user_" + norm)` (truy vấn kết hợp đa collection: `financial_Authentication`, `student_plans`, `submissions`, `setup_keywords`).
     + Trực tiếp Firestore document references nếu `loadUserData` chưa hoàn tất.
     + Fallback `localStorage` cục bộ nếu chạy môi trường offline.
2. **Chuẩn hóa tính toán 4 Module trọng yếu:**
   - **Module 1 (Keywords & Hồ sơ cá nhân):** Xác nhận hoàn thành nếu có danh sách chi tiêu (`expenses`), thu nhập (`incomeList`), kế hoạch đào tạo (`planList`) hoặc thông tin hồ sơ (`ho_ten`, `currentAge`, `monthlyIncome`).
   - **Module 2 (Dòng tiền & Kế hoạch ngân sách P2):** Xác nhận hoàn thành nếu có `monthlyDetails` có dữ liệu thu/chi/kế hoạch, hoặc có bảng kế hoạch thu nhập (`planIncome`), bảng kế hoạch chi tiêu (`planExpense`).
   - **Module 3 (Mục tiêu tài chính):** Kiểm tra linh hoạt cả `tcGoals` (chuẩn AppState hiện tại), `personalGoals` và `goals`. Hoàn thành khi có từ 2 mục tiêu trở lên; đang lập lộ trình nếu có 1 mục tiêu.
   - **Module 4 (Lộ trình sự nghiệp & Danh mục đầu tư):** Kiểm tra `careerDetailList`, `milestonesStore`, `careerMilestones`, `careerRouteOverrides`, `investProducts`.
3. **Phản ánh nhãn trạng thái và tỷ lệ phần trăm:**
   - 4 modules hoàn thành: **100%** (`Đã hoàn thành 100%`).
   - 3 modules hoàn thành: **75%** (`Gần hoàn thành`).
   - 2 modules hoàn thành: **50%** (`Đang lập lộ trình`).
   - 1 module hoàn thành: **25%** (`Mới bắt đầu`).
   - 0 module: **0%** (`Chưa nộp bài làm` nếu đã duyệt; `Chờ duyệt` nếu đang pending).
4. **Đồng bộ hóa sang Cổng Quản Trị Độc Lập (`admin-web/admin.js`):**
   - Cập nhật logic tính toán schema tương thích hoàn toàn, hiển thị đúng các chỉ số tài chính: dòng tiền ròng (`netCashflow`), tỷ lệ tiết kiệm (`savingsRate`), phân bổ danh mục đầu tư (Cổ phiếu, Trái phiếu, Bảo hiểm, Tiền mặt).

---

## III. KẾT QUẢ KIỂM THỬ VÀ BẰNG CHỨNG XÁC MINH

### 1. Kiểm tra 100% SHA-256 Byte Parity giữa `js/script.js` và `script.js`
```text
Algorithm : SHA256
Hash      : 5690A9E6ABE9CA167B8DE8D1DC5371EA096CE60451A7E384440D1D6C9913AD2C
Path      : D:\Code - IT\anything without cpp\financials-plan.github.io-main\js\script.js

Algorithm : SHA256
Hash      : 5690A9E6ABE9CA167B8DE8D1DC5371EA096CE60451A7E384440D1D6C9913AD2C
Path      : D:\Code - IT\anything without cpp\financials-plan.github.io-main\script.js
```
Kết quả: **TRÙNG KHỚP TUYỆT ĐỐI (100% Byte Parity).**

### 2. Kiểm tra quy tắc Zero Comments trong `backend/firestore.rules`
```text
PASS: Zero Comments confirmed (Không có bất kỳ ký tự // hay /* nào)
```

### 3. Kết quả chạy bộ Unit Test toàn hệ thống (`npm test`)
```text
TAP version 13
# Subtest: 1. Admin Code Validation and Crypto Generation
ok 1 - 1. Admin Code Validation and Crypto Generation (5.74ms)
# Subtest: 2. Backend API - Admin Codes & Role Assignment
ok 2 - 2. Backend API - Admin Codes & Role Assignment (268.66ms)
# Subtest: 3. Backend API - Class & Group Management
ok 3 - 3. Backend API - Class & Group Management (17.02ms)
# Subtest: 4. Financial Data & Code Parity Preservation
ok 4 - 4. Financial Data & Code Parity Preservation (13.36ms)
# Subtest: 5. Backend QTV / Admin APIs
ok 5 - 5. Backend QTV / Admin APIs (77.86ms)
# Subtest: 6. Recommended Portfolio Allocation & Milestone Benchmark Verification
ok 6 - 6. Recommended Portfolio Allocation & Milestone Benchmark Verification (6.90ms)
# Subtest: 7. Admin Web Portal & Special API Trigger Auto-Routing Algorithm
ok 7 - 7. Admin Web Portal & Special API Trigger Auto-Routing Algorithm (139.70ms)
# Subtest: 8. Seeded Admin Account Authentication and Credentials
ok 8 - 8. Seeded Admin Account Authentication and Credentials (64.17ms)
# Subtest: 9. UI & Global Sync Verification for Classroom and Roles
ok 9 - 9. UI & Global Sync Verification for Classroom and Roles (132.38ms)
# Subtest: 10. Task A — Enrolled Classes & Member Identity Verification
ok 10 - 10. Task A — Enrolled Classes & Member Identity Verification (6.04ms)
# Subtest: 11. Task B — Dashboard Variance Cumulative Calculation Verification
ok 11 - 11. Task B — Dashboard Variance Cumulative Calculation Verification (6.78ms)
# Subtest: 12. Fix AIO — Read-Only Protection & Admin Student Roadmap Progress Verification
ok 12 - 12. Fix AIO — Read-Only Protection & Admin Student Roadmap Progress Verification (9.97ms)

1..12
# tests 15
# suites 0
# pass 15
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 1191.11ms
```
Kết quả: **15/15 subtests PASS hoàn toàn.**

---

## IV. BẢNG DANH SÁCH FILE ĐÃ THAY ĐỔI

| STT | Tên file | Mô tả thay đổi |
|---|---|---|
| 1 | `backend/firestore-service.js` | Thêm chặn `isReadOnlyStudentView` trong `saveData`, `deleteBackup`, thêm `deleteUserData`, nâng cấp hàm tính tiến độ `getStudentClassProgress` hỗ trợ đầy đủ schema thực tế. |
| 2 | `backend/firestore.rules` | Subagent `firestore-rules-author` siết chặt phân quyền xóa, kiểm soát ghi, tuân thủ Zero Comments Rule và bảo toàn các assertions của test suite. |
| 3 | `css/style.css` | Thêm các CSS rules ẩn triệt để nút xóa, thùng rác, nút thêm, nút reset và khóa con trỏ contenteditable khi ở chế độ `.is-student-preview-mode`. |
| 4 | `js/script.js` | Khởi tạo `assertWritePermission`, bộ lắng nghe sự kiện capture toàn cục, bảo vệ tất cả hàm thêm/xóa/sửa/reset, nạp bất đồng bộ tiến độ học viên từ Cloud trong `renderAdminStudentsTable`. |
| 5 | `script.js` | Đồng bộ 100% SHA-256 byte parity với `js/script.js`. |
| 6 | `admin-web/admin.js` | Đồng bộ cơ chế tính toán tiến độ 4 module, khắc phục phụ thuộc local storage trên cổng quản trị. |
| 7 | `tests/unit.test.js` | Bổ sung Subtest 12 kiểm thử tự động toàn diện: SHA-256 parity, Read-Only Guard, Zero Comments, tiến độ 100%/75%/50%/25%/0%. |

---
**Kết luận:** Cả hai vấn đề A và B đã được giải quyết tận gốc, kiểm tra tự động và đạt trạng thái sẵn sàng vận hành.

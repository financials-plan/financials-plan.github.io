# BÁO CÁO TỔNG KẾT: XỬ LÝ LỖI "NHÓM CỦA BẠN" VÀ ĐƯỜNG LŨY KẾ CHÊNH LỆCH CHI TIÊU

**Dự án:** financials-plan.github.io  
**Thời gian hoàn thành:** 27/10/2026  
**Phạm vi:** Chỉ xử lý 2 vấn đề theo đúng yêu cầu: Nhiệm vụ A (Nhóm của bạn) và Nhiệm vụ B (Đường lũy kế chênh lệch).

---

## PHẦN A — NHÓM CỦA BẠN (ENROLLED CLASSES & MEMBER IDENTITY)

### 1. Nguyên nhân gốc đã xác nhận
1. **Lệch tên hàm chuẩn hóa username:** Hàm được khai báo tại dòng 99 của `js/script.js` là `normalizeUserName(rawName)` (chữ `N` hoa), nhưng trong luồng hiển thị danh sách lớp (`renderStudentEnrolledClasses` và `updateStudentClassStatusUI`), code lại gọi `normalizeUsername(m.username)` (chữ `n` thường). Khi chạy trên trình duyệt, việc này gây lỗi `ReferenceError: normalizeUsername is not defined`, làm ngắt toàn bộ tiến trình render bảng và khiến bảng danh sách nhóm luôn kẹt ở trạng thái ban đầu hoặc trống rỗng.
2. **Thiếu tính linh hoạt khi truy cập schema thành viên:** Trong dữ liệu Firestore hoặc local cache, bản ghi thành viên có thể sử dụng các trường định danh khác nhau (`username`, `normalizedUsername`, `studentId`, `id`). Code cũ chỉ kiểm tra `m.username`, dẫn đến việc bỏ sót thành viên hợp lệ nếu bản ghi sử dụng trường khác.
3. **Chưa bọc try/catch và phân tách lỗi lưu / render:** Trong hàm `submitStudentJoinClass`, sau khi gọi `CloudDB.joinClass()` thành công, hàm `renderStudentEnrolledClasses()` không được bọc trong khối try/catch riêng biệt; nếu quá trình render gặp sự cố, người dùng có thể lầm tưởng việc tham gia nhóm bị thất bại. Đồng thời, hàm `renderStudentEnrolledClasses` cũ không bắt lỗi khi mạng gián đoạn mà coi đó là trạng thái chưa có nhóm.
4. **Không dọn dẹp lớp học hoạt động khi đăng xuất:** Khi người dùng đăng xuất (`UserSession.clear()`), biến `FIN_APP_ACTIVE_STUDENT_CLASS` trong localStorage không được xóa, có thể gây nhầm lẫn trạng thái khi tài khoản khác đăng nhập trên cùng thiết bị.

### 2. Các file đã sửa và thay đổi cụ thể
- **`js/script.js` & `script.js` (Bảo đảm 100% SHA-256 byte parity):**
  - Khai báo alias toàn cục an toàn `window.normalizeUserName = normalizeUserName;` và `window.normalizeUsername = normalizeUserName;` ngay sau định nghĩa hàm.
  - Thống nhất toàn bộ các lời gọi trong luồng nhóm thành `normalizeUserName(...)`.
  - Bổ sung hàm trích xuất định danh an toàn: `m?.username || m?.normalizedUsername || m?.studentId || m?.id || ''`.
  - Bọc try/catch cho `renderStudentEnrolledClasses` và phân tách rõ ràng giữa lỗi tải dữ liệu (hiển thị thông báo kèm nút "Thử lại") và trạng thái rỗng thực sự.
  - Tách biệt lỗi render khỏi kết quả lưu trong `submitStudentJoinClass`.
  - Bổ sung dọn dẹp `localStorage.removeItem('FIN_APP_ACTIVE_STUDENT_CLASS')` trong `UserSession.clear()`.
  - Kích hoạt cập nhật UI ban đầu trong `initCloudClassesRealtimeSync()`.
- **`backend/firestore-service.js`:**
  - Cập nhật `mergeMembersList`, `joinClass` và `approveClassMember` để nhận diện thành viên linh hoạt qua `username`, `normalizedUsername`, `studentId`, `id`, bảo toàn quyền phê duyệt (`approved`) khi gộp dữ liệu mà không tạo bản ghi trùng lặp.

### 3. Kết quả kiểm thử
| STT | Tình huống kiểm thử | Kết quả | Ghi chú |
|---|---|:---:|---|
| 1 | Người dùng gửi yêu cầu tham gia nhóm mở/kín | **PASS** | Ghi nhận thành công, trạng thái chờ duyệt hoặc đã vào lớp chính xác |
| 2 | Nhóm xuất hiện ngay trong mục “Nhóm của bạn” sau khi gửi thành công | **PASS** | Render lại ngay lập tức không cần tải lại trang |
| 3 | Tải lại trang (F5) | **PASS** | Phục hồi danh sách nhóm chính xác từ cache/Cloud |
| 4 | Đăng xuất rồi đăng nhập lại cùng tài khoản | **PASS** | Dữ liệu nhóm được tải lại chính xác cho tài khoản đó |
| 5 | Chuyển đổi tài khoản khác | **PASS** | Trạng thái nhóm của tài khoản cũ bị xóa, nạp nhóm của tài khoản mới |
| 6 | Username khác biệt chữ hoa/chữ thường/dấu tiếng Việt | **PASS** | Chuẩn hóa đồng nhất qua `normalizeUserName` |
| 7 | Không còn lỗi `normalizeUsername is not defined` trên console | **PASS** | Đã khai báo alias toàn cục và thống nhất hàm gọi |
| 8 | Xử lý lỗi kết nối/quyền truy cập | **PASS** | Hiển thị thông báo lỗi rõ ràng, không đánh đồng với trạng thái chưa tham gia |
| 9 | Kiểm thử trực tiếp trên Cloud Firestore Production thực tế | **NOT VERIFIED** | Cần tài khoản quản trị viên đăng nhập Google Auth trên máy thật để xác minh trực tiếp trên môi trường live |

---

## PHẦN B — BIỂU ĐỒ LŨY KẾ CHÊNH LỆCH CHI TIÊU (CHART DASH VARIANCE)

### 1. Nguyên nhân gốc đã xác nhận
- **Sai công thức tính chênh lệch trong biểu đồ `chartDashVariance`:** Tại dòng 2901 của `js/script.js`, biểu đồ tích lũy chênh lệch theo công thức:
  ```javascript
  runningDiff += (act - planExp);
  ```
  Tức là lấy `actualExpense - plannedExpense`. Khi chi tiêu thực tế mỗi tháng thấp hơn kế hoạch (tiết kiệm được tiền), biểu thức này cho ra số âm (ví dụ: `20 - 50 = -30`). Qua 12 tháng, giá trị âm dồn tích liên tục (`-30, -60, -90, ..., -360`), khiến đường lũy kế đi dốc xuống vực sâu thay vì đi lên theo đúng ý đồ nghiệp vụ (tiết kiệm thì lũy kế chênh lệch phải dương và tăng dần).

### 2. Các file đã sửa và thay đổi cụ thể
- **`js/script.js` & `script.js`:**
  - Sửa lại công thức tích lũy đúng theo nghiệp vụ:
    ```javascript
    const monthlyVariance = Number(planExp || 0) - Number(act || 0);
    runningDiff += monthlyVariance;
    cumDiff.push(runningDiff);
    ```
    - Thực tế thấp hơn kế hoạch (`planExp > act`): `monthlyVariance > 0`, đường lũy kế tăng dần.
    - Thực tế bằng kế hoạch (`planExp === act`): `monthlyVariance === 0`, đường nằm ngang.
    - Thực tế cao hơn kế hoạch (`planExp < act`): `monthlyVariance < 0`, đường giảm tương ứng.
  - Xử lý an toàn kiểu dữ liệu bằng `Number(...) || 0`, ngăn chặn hoàn toàn `NaN` hoặc `undefined` làm hỏng biểu đồ.
- **`main.html`:**
  - Cập nhật tham số query version nạp script từ `script.js?v=3.2.0` lên `script.js?v=3.3.0` để kích hoạt cơ chế cache-busting, bảo đảm trình duyệt người dùng luôn tải phiên bản code mới nhất thay vì dùng cache cũ.

### 3. Kết quả kiểm thử các ca bắt buộc (Ca A – E)
| Ca kiểm thử | Điều kiện dữ liệu | Kỳ vọng | Kết quả | Ghi chú |
|---|---|---|:---:|---|
| **Ca A** | Thực tế thấp hơn kế hoạch ở tất cả các tháng (Kế hoạch = 50, Thực tế = 20) | Chênh lệch tháng = +30. Lũy kế: `30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330, 360`. Đường tăng dần. | **PASS** | Đã kiểm chứng tự động qua Suite 11 |
| **Ca B** | Thực tế bằng kế hoạch (Kế hoạch = 50, Thực tế = 50) | Lũy kế bằng 0 trong cả 12 tháng: `[0, 0, ..., 0]`. Đường nằm ngang ở mức 0. | **PASS** | Đã kiểm chứng tự động qua Suite 11 |
| **Ca C** | Thực tế cao hơn kế hoạch (Kế hoạch = 50, Thực tế = 60) | Lũy kế: `-10, -20, -30, ..., -120`. Đường giảm liên tục. | **PASS** | Đã kiểm chứng tự động qua Suite 11 |
| **Ca D** | Chênh lệch thay đổi giữa các tháng (Thực tế xen kẽ cao/thấp hơn kế hoạch) | Lũy kế phản ánh đúng tổng cộng dồn từng tháng (tăng khi dư, giảm khi vượt). | **PASS** | Đã kiểm chứng tự động qua Suite 11 |
| **Ca E** | Dữ liệu rỗng, chuỗi số, null, undefined | Chuyển đổi an toàn sang số, không sinh `NaN`, không gãy biểu đồ. | **PASS** | Đã kiểm chứng tự động qua Suite 11 |

---

## XÁC NHẬN PHẠM VI VÀ BẰNG CHỨNG MÃ NGUỒN

1. **Parity Check:** Hai tệp `script.js` và `js/script.js` khớp 100% mã băm SHA-256 (`EB26AFC2B6BF4688B67418A0AB26CF6C711BCF...`).
2. **Bộ kiểm thử tự động:** `npm test` chạy thành công **14/14 tests PASS (100%)**.
3. **Bảo toàn phạm vi:** Không sửa đổi Firestore Security Rules, không sửa đổi công thức Cân đối lộ trình (Phần 2), không sửa đổi cấu trúc dữ liệu không liên quan.

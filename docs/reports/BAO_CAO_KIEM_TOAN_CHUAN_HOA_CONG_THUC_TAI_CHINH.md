# BÁO CÁO KIỂM TOÁN, CHUẨN HÓA VÀ KHẮC PHỤC TOÀN BỘ CÔNG THỨC TÀI CHÍNH

**Dự án:** financials-plan.github.io  
**Phiên bản hệ thống:** 2.4.0  
**Ngày thực hiện:** 27/10/2026  
**Kỹ sư thực hiện:** Senior Financial Software Engineer & Financial Mathematics Specialist  
**Mục tiêu:** Kiểm toán toàn diện, phát hiện sai sót, chuẩn hóa toán học tài chính và thực thi thư viện `FinancialMath` đồng bộ trên toàn bộ mã nguồn.

---

## 1. TỔNG QUAN KIỂM TOÁN VÀ ĐÁNH GIÁ HIỆN TRẠNG

Quá trình kiểm toán độc lập đã rà soát 12 nhóm mô-đun và chức năng tính toán tài chính trọng yếu trong ứng dụng:

| STT | Hàm / Mô-đun tính toán | Trạng thái trước kiểm toán | Phân loại rủi ro | Trạng thái sau chuẩn hóa |
| :--- | :--- | :--- | :--- | :--- |
| 1 | `calculateMonthlyNeed` (Nợ `debt`) | Tiềm ẩn chia cho 0 khi lãi suất 0% | Sai lệch công thức biên | **CHUẨN HÓA (PASS)** |
| 2 | `calculateMonthlyNeed` (Tích lũy `invest`) | Có thể sinh PMT âm khi đủ vốn; chưa bọc lãi âm | Sai lệch logic tài chính | **CHUẨN HÓA (PASS)** |
| 3 | `calculateRetirementGoal` | Lấy `annualCost / reserveMonths`; thiếu vốn hóa lạm phát | Lỗi toán học nghiêm trọng | **CHUẨN HÓA (PASS)** |
| 4 | `calculateCollegeGoal` | Chưa đồng bộ chu kỳ chiết khấu học phí | Thiếu nhất quán chu kỳ | **CHUẨN HÓA (PASS)** |
| 5 | `computeGoalPortfolioMetrics` | Cho phép tổng tỷ trọng khác 100% không cảnh báo | Nguy cơ sai lệch danh mục | **CHUẨN HÓA (PASS)** |
| 6 | `detectAssetCategory` / `classifyProductType` | Tự động ép sản phẩm lạ về `'cash'` hoặc `'stocks'` | Sai lệch phân loại ngầm | **CHUẨN HÓA (PASS)** |
| 7 | `getMatrixIncomeNeed` | Chỉ tính `G / S`, bỏ qua chi phí sinh hoạt `E` và nợ `D` | Sai ý nghĩa tài chính | **CHUẨN HÓA (PASS)** |
| 8 | `DEFAULT_PORTFOLIO_30YR_BENCHMARK` | Tỷ trọng ETF âm (-4.83% đến -9.98% ở offset 26-29) | Dữ liệu phi lý | **CHUẨN HÓA (PASS)** |
| 9 | `updateBalanceSheetCalculations` | Cộng thu nhập năm vào tài sản, chi phí năm vào nợ | Lẫn lộn Stock vs Flow | **CHUẨN HÓA (PASS)** |
| 10 | `renderReconciliationTable` | Đối soát chênh lệch chi tiêu & thu nhập | Đúng logic quản trị | **DUY TRÌ (PASS)** |
| 11 | `evaluateSurveys` | Xếp loại "Thận trọng" khi chưa làm xong khảo sát | Sai lệch đánh giá tâm lý | **CHUẨN HÓA (PASS)** |
| 12 | Xử lý dữ liệu biên (`safeNumber`) | Thiếu cơ chế bọc dữ liệu `null, undefined, "", NaN` | Rủi ro sập giao diện | **CHUẨN HÓA (PASS)** |

---

## 2. CHI TIẾT CÁC LỖI TÀI CHÍNH TRỌNG YẾU ĐÃ KHẮC PHỤC

### 2.1. Lẫn lộn khái niệm Tồn kho (Stock) và Dòng tiền (Flow) trong Bảng cân đối kế toán
- **Hiện trạng cũ:** Hàm `updateBalanceSheetCalculations` cộng `getAnnualActualIncome()` vào `totalAssets` và `getAnnualActualExpense()` vào `totalLiabilities`.
- **Sai lệch bản chất:** Bảng cân đối tài sản - nợ cá nhân (Balance Sheet) là báo cáo thời điểm (Stock), chỉ phản ánh giá trị tài sản đang nắm giữ và dư nợ thực tế tại thời điểm lập báo cáo. Việc cộng thêm dòng tiền 1 năm (Flow) làm sai lệch hoàn toàn Giá trị tài sản ròng (Net Worth) và Tỷ lệ đòn bẩy nợ (Debt Ratio).
- **Khắc phục:** 
  $$\text{Total Assets} = \text{Assets Subtotal}$$
  $$\text{Total Liabilities} = \text{Liabilities Subtotal}$$
  $$\text{Net Worth} = \text{Total Assets} - \text{Total Liabilities}$$
  $$\text{Debt Ratio} = \frac{\text{Total Liabilities}}{\text{Total Assets}} \times 100\%$$
  Dòng tiền thu nhập và chi phí 1 năm được hiển thị riêng biệt ở dòng tham chiếu trong giao diện, không được cộng gộp vào chỉ số tài sản ròng chuẩn.

### 2.2. Công thức Thu nhập tối thiểu bỏ sót Chi phí sinh hoạt và Nghĩa vụ nợ
- **Hiện trạng cũ:** `getMatrixIncomeNeed` tính thu nhập cần có bằng $\frac{G}{S}$ ($G$ là tích lũy mục tiêu, $S$ là tỷ lệ tiết kiệm).
- **Sai lệch bản chất:** Nếu người dùng có chi phí sinh hoạt $E = 15$ tr, mục tiêu tích lũy $G = 5$ tr và $S = 35\%$, tính đơn thuần $\frac{5}{0.35} \approx 14.29$ tr không đủ để trang trải riêng tiền sinh hoạt 15 tr.
- **Khắc phục:** Áp dụng đồng thời 2 ràng buộc (Ràng buộc Dòng tiền và Ràng buộc Tỷ lệ tiết kiệm tối thiểu):
  $$I_{\min} = \max\left(E + D + G, \;\; \frac{E + D}{1 - S}\right)$$
  Khi $E + D = 0$, hệ thống tự động suy rộng thành $\frac{G}{S}$.

### 2.3. Lỗi tính toán Quỹ dự phòng và Vốn hóa Hưu trí lạm phát
- **Hiện trạng cũ:** Trong `calculateRetirementGoal`, khi người dùng nhập số tháng dự phòng và chi phí năm, mã nguồn cũ thực hiện phép tính ngược `monthlyCost = annualCost / reserveMonths`.
- **Sai lệch:** Chi phí năm là của 12 tháng, không phải của `reserveMonths` tháng.
- **Khắc phục:** Chuẩn hóa công thức dự phòng khẩn cấp:
  $$E_{\text{monthly}} = \frac{E_{\text{annual}}}{12}$$
  $$\text{Target Emergency Reserve} = E_{\text{monthly}} \times M$$
  Đồng thời, tích hợp công thức vốn hóa niên kim hưu trí có tính lạm phát:
  - Khi $r \ne i$:
    $$K = \frac{C_1}{r - i} \left[ 1 - \left(\frac{1 + i}{1 + r}\right)^N \right]$$
  - Khi $r = i$ (Lợi suất danh nghĩa bằng lạm phát):
    $$K = \frac{N \times C_1}{1 + r}$$
    Loại bỏ hoàn toàn lỗi chia cho 0 ($r - i = 0$).

### 2.4. Tỷ trọng ETF âm trong Danh mục Benchmark 30 năm
- **Hiện trạng cũ:** Tại các hàng offset 26, 27, 28, 29, giá trị `etf` bị âm ($-4.83, -4.69, -9.98, -9.95$).
- **Khắc phục:** Thiết lập `etf: 0` và gộp phần tỷ trọng cổ phiếu vào `stockFund`, đảm bảo toàn bộ trọng số $\ge 0$, tổng các nhóm tài sản đạt chính xác 100%.

### 2.5. Ép kiểu ngầm định khi phân loại tài sản lạ
- **Hiện trạng cũ:** Sản phẩm không có từ khóa nhận diện bị ép về `'cash'` khi rủi ro/lãi suất thấp, hoặc mặc định trả về `'stocks'`.
- **Khắc phục:** Hàm `FinancialMath.classifyProduct` và `classifyProductType` trả về chính xác `'unknown'`, không ép kiểu âm thầm.

### 2.6. Khảo sát chưa hoàn thành bị xếp loại sớm
- **Hiện trạng cũ:** Người dùng mới trả lời vài câu hỏi, tổng điểm thấp rơi vào ngưỡng $\le 20$ dẫn đến việc bị gán nhãn "Thận trọng (Ngại rủi ro)".
- **Khắc phục:** Gắn cờ `isComplete = false` khi chưa trả lời đủ bộ câu hỏi, tính điểm chuẩn hóa theo tỷ lệ câu đã trả lời và hiển thị thông báo yêu cầu hoàn thành khảo sát trước khi phân nhóm chính thức.

---

## 3. KẾT QUẢ KIỂM THỬ ĐỘC LẬP TỪ TEST A ĐẾN TEST P

Tất cả 16 trường hợp kiểm thử toán học độc lập đã được tích hợp vào `tests/unit.test.js` (Subtest 13) và tự động kiểm tra trên môi trường Node.js:

| Mã test | Mô tả kịch bản kiểm thử | Đầu vào | Kỳ vọng toán học | Kết quả thực tế | Đánh giá |
| :---: | :--- | :--- | :--- | :--- | :---: |
| **Test A** | Nợ 0% lãi suất | $P = 12$ tr, $r = 0$, $n = 12$ | $PMT = 1.0$ tr/kỳ | $1.000000$ | **PASS** |
| **Test B** | Nợ có lãi suất danh nghĩa | $P = 120$ tr, $j = 12\%$, $n = 12$ | $PMT \approx 10.661855$ tr/kỳ | $10.661855$ | **PASS** |
| **Test C** | Đầu tư tích lũy $r = 0$ | $F = 120$ tr, $B_0 = 0$, $n = 12$ | $PMT = 10.0$ tr/tháng | $10.000000$ | **PASS** |
| **Test D** | Tích lũy đã đủ vốn ($B_0(1+r)^n \ge F$) | $F = 100$ tr, $B_0 = 120$ tr | $PMT = 0$ (không âm) | $0.000000$ | **PASS** |
| **Test E** | Quỹ dự phòng khẩn cấp | $E_{\text{ann}} = 120$ tr, $M = 6$ th | $E_{\text{mo}} = 10$ tr, Mục tiêu = $60$ tr | $E_{\text{mo}} = 10$, Mục tiêu = $60$ | **PASS** |
| **Test F** | Bảng cân đối tài sản ròng chuẩn | TS = 300, Nợ = 100, Thu = 120, Chi = 80 | Tài sản ròng = 200, Tỷ lệ nợ = 33.33% | TS ròng = 200, Nợ = 33.33% | **PASS** |
| **Test G** | Phân bổ danh mục & lợi suất gia quyền | $w = [60\%, 40\%], r = [8\%, 4\%]$ | Return = $6.4\%$, Valid = true | Return = $6.4\%$, Valid = true | **PASS** |
| **Test H** | Thu nhập tối thiểu (Chi phí chi phối) | $E = 15, G = 5, D = 0, S = 35\%$ | $I_{\min} = \max(20, 23.0769) \approx 23.08$ | $23.076923$ tr/tháng | **PASS** |
| **Test I** | Thu nhập tối thiểu (Dòng tiền chi phối) | $E = 5, D = 10, G = 100, S = 35\%$ | $I_{\min} = \max(115, 23.08) = 115$ | $115.000000$ tr/tháng | **PASS** |
| **Test J** | Phân loại sản phẩm chưa nhận diện | "Sản phẩm thử nghiệm XYZ" | Trả về `'unknown'` | `'unknown'` | **PASS** |
| **Test K** | Khảo sát trắc nghiệm dở dang | Trả lời 3/10 câu | `isComplete: false`, không gán nhãn sớm | `isComplete: false` | **PASS** |
| **Test L** | Vốn hóa hưu trí khi $r = i$ | $C_1 = 12, r = 3\%, i = 3\%, N = 20$ | $K = \frac{240}{1.03} \approx 233.0097$ tr | $233.009709$ tr | **PASS** |
| **Test M** | Tỷ suất sinh lời âm an toàn | $r_m = -5\%/năm$, $n = 12$ | Không sập, trả về $PMT > 0$ | $PMT = 10.2789$ tr | **PASS** |
| **Test N** | Chu kỳ học phí đại học & Quỹ hỗ trợ | 8 kỳ, 20 tr/kỳ, quỹ 50 tr | Tổng vốn ban đầu = 210 tr | $210.000000$ tr | **PASS** |
| **Test O** | Chuyển tiền nội bộ tài khoản | Chuyển 50 tr giữa các tài khoản | Thu = 0, Chi = 0, Tài sản ròng không đổi | Thu = 0, Chi = 0, $\Delta$ TS ròng = 0 | **PASS** |
| **Test P** | Dữ liệu rác và giá trị biên | `null, undefined, "", NaN, Infinity` | An toàn, trả về 0, không NaN | Fallback 0 an toàn | **PASS** |

---

## 4. BẢO TRÌ VÀ NGUYÊN TẮC BẢO VỆ MÃ NGUỒN

1. **Thư viện chuẩn `FinancialMath`:**
   - Được định nghĩa tập trung ở đầu mô-đun nghiệp vụ tài chính.
   - Được phơi bày qua `window.FinancialMath` (trình duyệt) và `global.FinancialMath` / `module.exports` (Node.js).
   - Bất kỳ phép tính tài chính mới nào trong hệ thống đều phải gọi trực tiếp qua `FinancialMath`.

2. **Bảo toàn tính toàn vẹn 100% SHA-256 byte parity:**
   - Tập tin `js/script.js` và `script.js` phải luôn được đồng bộ byte-for-byte sau mỗi lần chỉnh sửa.
   - Hash kiểm tra hiện tại: `DE819E137AAD8D779B3B2DB97FD4D627E28D14CA731C81A9E719730D89CF0F18`.

3. **Nguyên tắc Zero Comments trong `backend/firestore.rules`:**
   - Không được thêm ghi chú hoặc comment vào file Firestore Rules để đảm bảo tương thích tuyệt đối và tránh lỗi phân tích cú pháp.

# Personal Financial Planning & Wealth Management Dashboard
> **Hệ thống Quản lý & Hoạch định Lộ trình Tài chính Cá nhân Toàn diện**

---

## 📌 Tổng Quan Dự Án (Executive Summary)

**Personal Financial Planning Dashboard** là giải pháp Single-Page Application (SPA) mô phỏng chính xác bảng tính Excel mẫu về hoạch định tài chính cá nhân. Ứng dụng tích hợp các mô hình tính toán tài chính tiêu chuẩn nhằm kiểm soát dòng tiền vào (Inflows), dòng tiền ra (Outflows), lập kế hoạch ngân sách và lộ trình phân bổ tài sản dài hạn.

---

## 📐 Cơ Sở Các Công Thức Tài Chính Được Ứng Dụng

### 1. Dòng Tiền Ròng & Tỷ Lệ Tiết Kiệm (Cash Flow & Savings Rate)
* **Dòng tiền ròng tháng $m$ (Net Cash Flow):**
  $$\text{NCF}_m = \text{Total Inflow}_m - \text{Total Outflow}_m$$
* **Tỷ lệ tiết kiệm thực tế (Savings Rate):**
  $$\text{Savings Rate} = \frac{\sum_{m=1}^{12} \text{NCF}_m}{\sum_{m=1}^{12} \text{Total Inflow}_m} \times 100\%$$
* **Tỷ lệ chi tiêu trên thu nhập (Expense-to-Income Ratio):**
  $$\text{Expense Ratio} = \frac{\sum_{m=1}^{12} \text{Total Outflow}_m}{\sum_{m=1}^{12} \text{Total Inflow}_m} \times 100\%$$

---

### 2. Mô Hình Thanh Toán Niên Kim Cố Định (Fixed Loan Amortization Schedule)
Bài toán xác định số tiền trả góp hàng năm (gốc + lãi đều) cho khoản vay mua nhà/chung cư:
* **Công thức PMT (Periodic Payment):**
  $$\text{PMT} = P \times \frac{r(1+r)^n}{(1+r)^n - 1}$$
  *Trong đó:*
  * $P$: Dư nợ gốc ban đầu (Principal).
  * $r$: Lãi suất vay danh nghĩa theo năm.
  * $n$: Số năm vay còn lại ($n = \text{Năm kết thúc} - \text{Năm bắt đầu} + 1$).
* **Lộ trình khấu hao từng kỳ $t$ ($t = 1 \dots n$):**
  * Lãi phát sinh trong kỳ:
    $$\text{Interest}_t = \text{Balance}_{t-1} \times r$$
  * Nợ gốc trả trong kỳ:
    $$\text{Principal Paid}_t = \text{PMT} - \text{Interest}_t$$
  * Dư nợ cuối kỳ:
    $$\text{Balance}_t = \text{Balance}_{t-1} - \text{Principal Paid}_t$$

---

### 3. Tỷ Suất Sinh Lời Kỳ Vọng Danh Mục Đầu Tư (Expected Portfolio Return)
* **Tỷ suất sinh lời bình quân số học (Arithmetic Mean Return):**
  $$\bar{R} = \frac{1}{K} \sum_{k=1}^K R_k$$
  *Trong đó:* $K$ là số lượng sản phẩm đầu tư trong danh mục khảo sát, $R_k$ là mức sinh lời trung bình 5 năm của sản phẩm thứ $k$.

---

### 4. Đối Soát Ngân Sách & Lũy Kế Chênh Lệch (Budget Variance Analysis)
* **Chênh lệch thu nhập:**
  $$\Delta \text{Income} = \text{Actual Income} - \text{Planned Income}$$
* **Chênh lệch chi tiêu (Tiết kiệm ngân sách):**
  $$\Delta \text{Expense} = \text{Planned Expense} - \text{Actual Expense}$$
* **Lũy kế chênh lệch chi tiêu đến tháng $M$ (Cumulative Variance):**
  $$\text{CumDiff}_M = \sum_{m=1}^M (\text{Planned Expense}_m - \text{Actual Expense}_m)$$
  * $\text{CumDiff} > 0$: Chi tiêu thực tế thấp hơn định mức (thặng dư ngân sách).
  * $\text{CumDiff} < 0$: Chi tiêu vượt định mức kế hoạch (bội chi ngân sách).

---

### 5. Khảo Sát Đánh Giá Hành Vi & Khẩu Vị Rủi Ro (Risk Profiling & Context Scoring)
* **Khảo sát 1 - Khả năng chịu đựng rủi ro (10 câu trắc nghiệm dot-box):**
  * Điểm $\le 18$: Nhà đầu tư thận trọng (Risk Averse) $\rightarrow$ Ưu tiên tiền gửi, trái phiếu, bảo toàn vốn.
  * $19 \le$ Điểm $\le 32$: Nhà đầu tư trung lập (Moderate/Neutral) $\rightarrow$ Phân bổ cân bằng cổ phiếu/trái phiếu.
  * Điểm $\ge 33$: Nhà đầu tư tăng trưởng mạo hiểm (Aggressive) $\rightarrow$ Tối đa hóa tỷ trọng cổ phiếu, quỹ ETF.
* **Khảo sát 2 - Bối cảnh & Áp lực tài chính (11 câu trắc nghiệm dot-box):**
  * Đánh giá gánh nặng gia đình, tính chủ động thu nhập và mức độ hỗ trợ người thân để xác định quy mô quỹ khẩn cấp.

---

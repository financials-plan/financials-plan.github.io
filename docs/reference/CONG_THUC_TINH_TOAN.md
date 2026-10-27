# TỔNG HỢP CÔNG THỨC TOÁN HỌC & LÝ THUYẾT TÀI CHÍNH CÁ NHÂN

Tài liệu này hệ thống hóa toàn bộ các mô hình, định lý và công thức tính toán tài chính cá nhân được hiện thực hóa trong mã nguồn của hệ thống **Sổ Quản Lý & Hoạch Định Tài Chính Chuyên Sâu** (`financials-plan.github.io`).

Tất cả công thức được trình bày dưới định dạng chuẩn **LaTeX** để hiển thị sắc nét trên GitHub, phục vụ nghiên cứu, kiểm toán thuật toán và đối soát dữ liệu.

---

## 1. Mô hình Nghĩa vụ Nợ & Lãi vay (Amortization & Debt PMT)

### 1.1. Khái niệm & Nguyên lý
Đối với một khoản nợ vay (vay mua nhà, vay mua xe, nợ thẻ tín dụng, nợ kinh doanh), dòng tiền thanh toán định kỳ được cấu trúc theo phương pháp niên kim cố định (Constant Amortization Payment), trong đó mỗi kỳ người vay trả cả gốc và lãi sao cho dư nợ về 0 vào cuối kỳ hạn.

### 1.2. Công thức toán học
Gọi:
- $PV$: Dư nợ gốc ban đầu cần trả (Present Value), đơn vị: triệu VNĐ.
- $r$: Lãi suất danh nghĩa hàng năm (Annual Interest Rate), ví dụ $8\% = 0.08$.
- $n$: Số năm thanh toán còn lại ($n = \text{End Year} - \text{Start Year}$).
- $r_m$: Lãi suất tương đương mỗi tháng:
  $$r_m = \frac{r}{12}$$
- $N_m$: Tổng số kỳ thanh toán theo tháng ($N_m = n \times 12$).

Số tiền trả nợ định kỳ hàng tháng ($PMT_{\text{month}}$) được xác định bởi công thức niên kim hiện giá thông thường (Ordinary Annuity Present Value):

$$PMT_{\text{month}} = \begin{cases} \dfrac{PV \times r_m}{1 - (1 + r_m)^{-N_m}} & \text{khi } r_m > 0 \\ \dfrac{PV}{N_m} & \text{khi } r_m = 0 \end{cases}$$

Nghĩa vụ trả nợ quy năm ($PMT_{\text{annual}}$):
$$PMT_{\text{annual}} = PMT_{\text{month}} \times 12$$

---

## 2. Mô hình Quỹ chìm Tích lũy & Đầu tư Mục tiêu (Sinking Fund Annuity)

### 2.1. Khái niệm & Nguyên lý
Đối với các mục tiêu tích lũy tài sản trong tương lai (mua tài sản lớn, học vấn, quỹ hưu trí), người lập kế hoạch tích lũy định kỳ một khoản tiền vào các danh mục đầu tư có tỷ suất sinh lời kỳ vọng $r$ để tích tụ thành giá trị tương lai $FV$ (Future Value) sau $N_m$ kỳ.

### 2.2. Công thức toán học
Gọi:
- $FV$: Giá trị mục tiêu cần có trong tương lai (Future Value), đơn vị: triệu VNĐ.
- $PV_{\text{paid}}$: Số tiền vốn đã tích lũy sẵn tại thời điểm hiện tại (nếu có).
- $r$: Tỷ suất sinh lời danh nghĩa hàng năm kỳ vọng của danh mục tích lũy.
- $n$: Thời gian tích lũy tính bằng năm.
- $r_m = \dfrac{r}{12}$: Lãi suất tháng tương đương.
- $N_m = n \times 12$: Tổng số tháng tích lũy.

Giá trị tương lai của số vốn hiện hữu sau $N_m$ tháng:
$$FV_{\text{paid}} = PV_{\text{paid}} \times (1 + r_m)^{N_m}$$

Phần giá trị mục tiêu còn thiếu cần tích lũy thêm:
$$\Delta FV = \max\left(0, FV - FV_{\text{paid}}\right)$$

Số tiền cần trích ra đầu tư định kỳ hàng tháng ($PMT_{\text{invest}}$) theo công thức Quỹ chìm (Sinking Fund Formula):

$$PMT_{\text{month}} = \begin{cases} \dfrac{\Delta FV \times r_m}{(1 + r_m)^{N_m} - 1} & \text{khi } r_m > 0 \\ \dfrac{\Delta FV}{N_m} & \text{khi } r_m = 0 \end{cases}$$

Nhu cầu đầu tư quy năm:
$$PMT_{\text{annual}} = PMT_{\text{month}} \times 12$$

---

## 3. Hoạch định Quỹ Hưu trí & Tự do Tài chính (Retirement Planning)

### 3.1. Khái niệm & Nguyên lý
Quỹ hưu trí được thiết kế để đảm bảo thu nhập thụ động chi trả toàn bộ chi phí sinh hoạt của cá nhân trong suốt thời kỳ nghỉ hưu mà không làm cạn kiệt tài sản trước thời hạn dự kiến.

### 3.2. Công thức toán học
Gọi:
- $C_{\text{annual}}$: Chi phí sinh hoạt hàng năm ước tính trong giai đoạn nghỉ hưu (triệu VNĐ).
- $n_{\text{reserve}}$: Số năm dự kiến sống trong giai đoạn hưu trí (ví dụ 20 năm, 25 năm hoặc 30 năm).
- $r_{\text{retire}}$: Tỷ suất sinh lời an toàn của danh mục tài sản hưu trí (thường là danh mục thận trọng gồm trái phiếu, tiền gửi, cổ tức cao).

Quy mô quỹ tài sản hưu trí cần có tại thời điểm bắt đầu nghỉ hưu ($FV_{\text{retire}}$):
$$FV_{\text{retire}} = \begin{cases} C_{\text{annual}} \times \left[ \dfrac{1 - (1 + r_{\text{retire}})^{-n_{\text{reserve}}}}{r_{\text{retire}}} \right] & \text{khi } r_{\text{retire}} > 0 \\ C_{\text{annual}} \times n_{\text{reserve}} & \text{khi } r_{\text{retire}} = 0 \end{cases}$$

Số tiền cần trích tích lũy mỗi tháng trong giai đoạn tích sản trước khi nghỉ hưu được tính bằng cách áp dụng công thức Quỹ chìm ở Mục 2 với mục tiêu $FV = FV_{\text{retire}}$.

---

## 4. Mô hình Phân bổ Tài sản Chu kỳ Cuộc đời (Life-Cycle Asset Allocation)

### 4.1. Nguyên lý Quy tắc 100 & Quy tắc Trừ Tuổi
Theo lý thuyết kinh tế tài chính hành vi (Life-Cycle Hypothesis - Franco Modigliani), khả năng chấp nhận rủi ro và vốn nhân lực (Human Capital) giảm dần theo thời gian, trong khi tài sản tài chính (Financial Capital) tăng dần. Vì vậy, tỷ trọng tài sản rủi ro cao (Cổ phiếu, Quỹ mở, Bất động sản tăng trưởng) cần giảm dần khi tuổi tác tăng lên.

### 4.2. Tỷ trọng phân bổ tài sản tại độ tuổi $Age$
Gọi $Age$ là độ tuổi của nhà đầu tư tại thời điểm xem xét:

1. **Tỷ trọng Cổ phiếu & Chứng chỉ quỹ tăng trưởng ($w_{\text{stocks}}$):**
   $$w_{\text{stocks}}(Age) = \max\left(10\%, 100 - Age\right)$$

2. **Tỷ trọng Trái phiếu & Công cụ nợ ($w_{\text{bonds}}$):**
   $$w_{\text{bonds}}(Age) = \min\left(60\%, \max\left(15\%, Age \times 0.65\right)\right)$$

3. **Tỷ trọng Bảo hiểm & Quỹ phòng ngừa rủi ro ($w_{\text{ins}}$):**
   $$w_{\text{ins}} = 10\% \quad (\text{Cố định làm tấm đệm thanh khoản bảo vệ})$$

4. **Tỷ trọng Tiền mặt & Tương đương tiền gửi ngắn hạn ($w_{\text{cash}}$):**
   $$w_{\text{cash}}(Age) = 100\% - \left(w_{\text{stocks}} + w_{\text{bonds}} + w_{\text{ins}}\right)$$

### 4.3. Tỷ suất sinh lời kỳ vọng của danh mục ($R_{\text{portfolio}}$)
Tỷ suất sinh lời kỳ vọng của danh mục đa tài sản tại mỗi độ tuổi được tính bằng kỳ vọng toán có trọng số:

$$R_{\text{portfolio}}(Age) = w_{\text{stocks}} R_{\text{stocks}} + w_{\text{bonds}} R_{\text{bonds}} + w_{\text{ins}} R_{\text{ins}} + w_{\text{cash}} R_{\text{cash}}$$

Trong đó $R_i$ là tỷ suất sinh lời danh nghĩa của từng lớp tài sản được cấu hình trong bảng Từ khóa.

---

## 5. Cân đối Thu nhập Lộ trình Nghề nghiệp & Tỷ lệ Tiết kiệm (Career Income & Savings Rate)

### 5.1. Khái niệm & Nguyên lý
Để đạt được các mục tiêu tài chính đã đề ra mà vẫn duy trì cuộc sống cá nhân, thu nhập hàng năm từ công việc hoặc kinh doanh phải trang trải được cả hai khoản:
1. Chi phí sinh hoạt cơ bản và định kỳ ($E_{\text{basic}}$).
2. Toàn bộ các nghĩa vụ trả nợ và trích lập đầu tư trong năm ($\sum PMT_{\text{annual}}$).

### 5.2. Công thức toán học
Gọi:
- $S_{\text{rate}}$: Tỷ lệ tiết kiệm & đầu tư mục tiêu (Target Savings Rate), biểu diễn theo số thập phân ($0 < S_{\text{rate}} < 1$), mặc định $40\% = 0.40$.
- $E_{\text{basic}}$: Tổng chi phí sinh hoạt cơ bản dự kiến trong 1 năm.
- $\sum_{k} PMT_{\text{annual}, k}$: Tổng nghĩa vụ tài chính trong năm cho tất cả mục tiêu $k$ đang hiệu lực.

Mức thu nhập tối thiểu cần kiếm được trong năm ($I_{\text{target}}$):
$$I_{\text{target}} = \frac{E_{\text{basic}} + \sum_{k} PMT_{\text{annual}, k}}{1}$$

Nếu người dùng xác định hoàn thành các mục tiêu này hoàn toàn từ khoản tiền tiết kiệm tích lũy theo tỷ lệ $S_{\text{rate}}$:
$$I_{\text{target, savings}} = \frac{\sum_{k} PMT_{\text{annual}, k}}{S_{\text{rate}}}$$

Mức thu nhập mục tiêu tổng hợp chuẩn hóa:
$$I_{\text{required}}(Age) = \max\left( \frac{E_{\text{basic}}}{1 - S_{\text{rate}}}, \frac{\sum_{k} PMT_{\text{annual}, k}}{S_{\text{rate}}} \right)$$

### 5.3. Chỉ số Vững tâm & Thâm hụt Thu nhập (Income Sufficiency Status)
So sánh giữa thu nhập thực tế hoặc lộ trình kỳ vọng $I_{\text{route}}(Age)$ với thu nhập cần có $I_{\text{required}}(Age)$:

$$\Delta I(Age) = I_{\text{route}}(Age) - I_{\text{required}}(Age)$$

- Khi $\Delta I(Age) \ge 0$: **Trạng thái Đạt (Vững tâm tài chính)**. Dòng tiền dự kiến đủ hoặc dư dả để tài trợ cho các mục tiêu.
- Khi $\Delta I(Age) < 0$: **Trạng thái Cần thêm (Thâm hụt lộ trình)**. Quy mô thâm hụt là $|\Delta I(Age)|$, đòi hỏi người dùng phải nâng cao năng lực chuyên môn để gia tăng thu nhập, hoặc tái cơ cấu giảm bớt mục tiêu.

---

## 6. Bảng Cân đối Tài sản - Nợ Cuối năm & Giá trị Tài sản Ròng (Year-End Balance Sheet & Net Worth)

### 6.1. Khái niệm & Nguyên lý
Bảng cân đối tài sản - nợ cá nhân (Personal Balance Sheet) tại thời điểm kết thúc năm (Tháng 12) phản ánh tổng hợp sức khỏe tài chính toàn diện. Mô hình này tích hợp cả tài sản vật chất/đầu tư hiện hữu và nguồn lực con người (dòng thu nhập thực tế đã thu về trong 12 tháng), đối trọng với các khoản nợ vay và chi phí sinh hoạt thực tế đã phát sinh.

### 6.2. Cấu trúc Bên Tài sản (Total Assets)
Tổng tài sản cuối kỳ ($A$) gồm:
1. **Tiểu ngạch tài sản tích lũy & đầu tư ($A_{\text{invest}}$):**
   $$A_{\text{invest}} = \sum_{j=1}^{M_{\text{assets}}} V_{\text{asset}, j}$$
   Bao gồm: Tiền gửi ngân hàng, chứng chỉ quỹ ETF, cổ phiếu riêng lẻ, bất động sản, vàng, chứng chỉ tiền gửi...

2. **Nguồn lực con người ($A_{\text{human}}$):**
   Giá trị dòng tiền thu nhập thực tế đã thực nhận qua 12 tháng:
   $$A_{\text{human}} = \sum_{m=1}^{12} \sum_{i} \text{Income}_{m, i}$$

Tổng giá trị Bên Tài sản ($A$):
$$A = A_{\text{invest}} + A_{\text{human}} = \sum_{j=1}^{M_{\text{assets}}} V_{\text{asset}, j} + \sum_{m=1}^{12} \text{ActualIncome}_m$$

### 6.3. Cấu trúc Bên Nợ & Nghĩa vụ (Total Liabilities)
Tổng nợ và nghĩa vụ cuối kỳ ($B$) gồm:
1. **Tiểu ngạch các khoản nợ đang vay ($B_{\text{debt}}$):**
   $$B_{\text{debt}} = \sum_{k=1}^{M_{\text{liab}}} V_{\text{debt}, k}$$
   Bao gồm: Dư nợ vay thế chấp ngân hàng, vay tiêu dùng tín chấp, dư nợ thẻ tín dụng, nợ người thân...

2. **Chi phí sinh hoạt và nghĩa vụ đã trả trong năm ($B_{\text{expense}}$):**
   Giá trị dòng tiền chi phí thực tế đã thanh toán qua 12 tháng:
   $$B_{\text{expense}} = \sum_{m=1}^{12} \sum_{i} \text{Expense}_{m, i}$$

Tổng giá trị Bên Nợ ($B$):
$$B = B_{\text{debt}} + B_{\text{expense}} = \sum_{k=1}^{M_{\text{liab}}} V_{\text{debt}, k} + \sum_{m=1}^{12} \text{ActualExpense}_m$$

### 6.4. Giá trị Tài sản Ròng (Net Worth)
Giá trị tài sản ròng phản ánh sự giàu có thực chất của cá nhân sau khi khấu trừ mọi nghĩa vụ:

$$\text{Net Worth} = A - B = \left( A_{\text{invest}} + A_{\text{human}} \right) - \left( B_{\text{debt}} + B_{\text{expense}} \right)$$

Biến đổi tương đương:
$$\text{Net Worth} = \left( A_{\text{invest}} - B_{\text{debt}} \right) + \left( \sum_{m=1}^{12} \text{ActualIncome}_m - \sum_{m=1}^{12} \text{ActualExpense}_m \right)$$

Trong đó:
- $A_{\text{invest}} - B_{\text{debt}}$: Giá trị thặng dư tài sản tích lũy tĩnh.
- $\sum \text{Income} - \sum \text{Expense}$: Dòng thặng dư tiết kiệm lũy kế từ hoạt động trong năm.

### 6.5. Tỷ lệ Đòn bẩy Tài chính (Debt-to-Asset Ratio)
Đo lường mức độ an toàn và mức độ phụ thuộc vào nợ vay của cá nhân:

$$\text{Debt Ratio} = \begin{cases} \dfrac{B}{A} \times 100\% & \text{khi } A > 0 \\ 0\% & \text{khi } A \le 0 \end{cases}$$

- **$\text{Debt Ratio} \le 40\%$:** Vùng an toàn cao (Healthy Solvency). Cơ cấu tài chính vững chắc.
- **$40\% < \text{Debt Ratio} \le 60\%$:** Vùng cảnh báo vừa phải (Moderate Leverage). Cần thận trọng khi vay thêm.
- **$\text{Debt Ratio} > 60\%$:** Vùng rủi ro cao (High Financial Risk). Cần ưu tiên cơ cấu trả bớt nợ.

---

## 7. Đánh giá Khẩu vị Rủi ro & Khả năng Chịu đựng Rủi ro (Risk Tolerance & Risk Capacity)

### 7.1. Khái niệm & Nguyên lý
Hệ thống khảo sát tách bạch hai khía cạnh độc lập theo chuẩn CFA Institute:
1. **Khả năng chịu đựng rủi ro (Risk Capacity):** Yếu tố khách quan (độ tuổi, thu nhập, thời hạn đầu tư, số lượng người phụ thuộc, quỹ dự phòng).
2. **Khẩu vị rủi ro tâm lý (Risk Tolerance):** Yếu tố chủ quan (phản ứng tâm lý khi thị trường sụt giảm, kinh nghiệm đầu tư, mức độ sẵn sàng chấp nhận thua lỗ để tìm kiếm lợi nhuận).

### 7.2. Điểm số tổng hợp (Survey Scoring)
Với mỗi phần khảo sát $P \in \{1, 2\}$, mỗi câu hỏi $i$ có điểm số trọng số $w_{i, c}$ tương ứng với lựa chọn $c$:

$$Score_P = \sum_{i=1}^{Q_P} w_{i, c_i}$$

Phần trăm điểm chuẩn hóa:
$$\% Score_P = \frac{Score_P - MinScore_P}{MaxScore_P - MinScore_P} \times 100\%$$

Phân nhóm phong cách nhà đầu tư (Investor Profile Classification):
- **Bảo thủ (Conservative):** $\% Score < 40\%$ $\rightarrow$ Ưu tiên tiền gửi, trái phiếu ngắn hạn.
- **Thận trọng vừa phải (Moderately Conservative):** $40\% \le \% Score < 60\%$ $\rightarrow$ Cân bằng cổ phiếu phòng thủ và trái phiếu.
- **Tăng trưởng cân bằng (Balanced Growth):** $60\% \le \% Score < 80\%$ $\rightarrow$ Cổ phiếu đa dạng hóa và quỹ chỉ số thị trường.
- **Tăng trưởng năng động / Mạo hiểm (Aggressive):** $\% Score \ge 80\%$ $\rightarrow$ Tối đa hóa tỷ trọng cổ phiếu tăng trưởng và tài sản sinh lời cao.

---

## 8. Bảng Ký hiệu & Đơn vị Quy chuẩn

| Ký hiệu | Ý nghĩa tài chính | Đơn vị tính |
| :--- | :--- | :--- |
| $PV$ | Giá trị hiện tại / Dư nợ gốc ban đầu | Triệu VNĐ |
| $FV$ | Giá trị mục tiêu tương lai | Triệu VNĐ |
| $PMT$ | Dòng tiền thanh toán hoặc tích lũy định kỳ | Triệu VNĐ |
| $r$ | Lãi suất danh nghĩa hàng năm | $\%$/năm |
| $r_m$ | Lãi suất tương đương hàng tháng ($r/12$) | $\%$/tháng |
| $n$ | Kỳ hạn tính theo năm | Năm |
| $N_m$ | Tổng số kỳ tính theo tháng ($n \times 12$) | Tháng |
| $Age$ | Độ tuổi của người dùng tại thời điểm xét | Tuổi |
| $w_i$ | Tỷ trọng phân bổ danh mục lớp tài sản $i$ | $\%$ |
| $S_{\text{rate}}$ | Tỷ lệ tiết kiệm và đầu tư mục tiêu | $\%$ |
| $A$ | Tổng giá trị tài sản cuối năm | Triệu VNĐ |
| $B$ | Tổng giá trị nợ và nghĩa vụ cuối năm | Triệu VNĐ |
| $NW$ | Giá trị tài sản ròng (Net Worth = $A - B$) | Triệu VNĐ |
| $DR$ | Tỷ lệ đòn bẩy nợ trên tổng tài sản ($B/A$) | $\%$ |

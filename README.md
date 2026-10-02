# Bảng Quản Lý & Hoạch Định Tài Chính Cá Nhân Chuyên Sâu

Hệ thống hoạch định và kiểm soát tài chính cá nhân toàn diện, kết hợp giữa mô hình quản trị dòng tiền thực tế, phân bổ tài sản theo chu kỳ cuộc đời và phân tích sự phù hợp giữa lộ trình phát triển sự nghiệp với các mục tiêu dài hạn.

---

## Tổng quan & Mục đích sử dụng

Quản lý tài chính cá nhân hiệu quả không chỉ đơn thuần là việc ghi chép sổ sách thu chi hàng ngày, mà đòi hỏi khả năng dự báo dòng tiền, phòng ngừa rủi ro lạm phát và thiết lập kỷ luật đầu tư xuyên suốt nhiều thập kỷ. Hệ thống được xây dựng nhằm giải quyết bài toán cốt lõi: **Làm thế nào để chuyển đổi các mục tiêu cuộc đời thành những con số định lượng cụ thể trên lộ trình nghề nghiệp và tích lũy hàng tháng?**

### Mục tiêu cốt lõi
* **Lượng hóa các mục tiêu cuộc sống:** Biến các ước mơ (mua nhà, học vấn cho con cái, hưu trí an nhàn, khởi nghiệp) thành kế hoạch tài chính có lộ trình dòng tiền chính xác qua từng năm.
* **Cầu nối giữa tài chính và sự nghiệp:** Xác định mức thu nhập cần thiết tại từng mốc tuổi và đối chiếu với năng lực tạo thu nhập thực tế từ nghề nghiệp, từ đó chủ động nâng cấp năng lực hoặc điều chỉnh mục tiêu kịp thời.
* **Kiểm soát dòng tiền vi mô đến vĩ mô:** Kết hợp liền mạch giữa việc theo dõi ngân sách chi tiết trong 12 tháng và bức tranh tích lũy kéo dài hơn 30 năm.
* **Quản trị rủi ro cá nhân hóa:** Định hình khẩu vị rủi ro và đánh giá bối cảnh gia đình thông qua hệ thống khảo sát định lượng, hỗ trợ lựa chọn danh mục đầu tư thích ứng theo từng giai đoạn cuộc đời.

---

## Các trụ cột chức năng chính

Hệ thống được thiết kế theo cấu trúc liên hoàn, đảm bảo tính đồng bộ dữ liệu hai chiều giữa các phân hệ:

* **Thiết lập danh mục chủ (Từ khóa):** Không gian quản lý các danh mục thu nhập, chi phí, kế hoạch phát triển bản thân và rổ sản phẩm đầu tư với tỷ suất sinh lời cùng biên độ rủi ro kỳ vọng.
* **Trung tâm chỉ huy dòng tiền (Dashboard):** Bảng điều khiển phân tích trực quan với các chỉ số tài chính tức thời, biểu đồ cơ cấu phân bổ, đối soát thu - chi - tiết kiệm và ma trận dữ liệu tổng hợp 12 tháng.
* **Định vị bản thân & Hoàn cảnh:** Không gian đánh giá nội tại cá nhân, năng lực cốt lõi, môi trường làm việc và các ràng buộc trách nhiệm gia đình.
* **Kế hoạch mục tiêu tài chính:** Bộ công cụ tính toán chi tiết cho từng khoản nợ và khoản đầu tư tích lũy, tự động kết xuất ra ma trận nhu cầu dòng tiền suốt 33 năm.
* **Cân đối lộ trình nghề nghiệp:** Đối chiếu trực quan ba đường quỹ đạo thu nhập: *Thu nhập thực tế*, *Thu nhập cần đạt mục tiêu* và *Thu nhập theo lộ trình sự nghiệp*, tự động cảnh báo các giai đoạn thâm hụt tài chính.
* **Theo dõi & Đối soát thu chi 12 tháng:** Nhật ký ghi nhận giao dịch thu chi thực tế, phân tích phương sai so với kế hoạch ngân sách và tính toán tự động chi phí tái đầu tư vào vốn con người (phát triển bản thân).
* **Đánh giá rủi ro & Hoàn cảnh (Khảo sát):** Hệ thống chấm điểm trắc nghiệm định lượng chuẩn xác nhằm xác định khẩu vị đầu tư và chỉ số thuận lợi về bối cảnh tài chính.

---

## Cơ sở lý thuyết & Các mô hình thuật toán áp dụng

Hệ thống tích hợp các công thức tài chính vi mô và lý thuyết danh mục đầu tư hiện đại nhằm đảm bảo tính chuẩn xác và khả thi của các kế hoạch.

### 1. Mô hình dòng tiền niên kim và trả nợ định kỳ (Amortization & Annuity Model)
Đối với các khoản nợ vay và nghĩa vụ tài chính cần hoàn tất trong một khoảng thời gian xác định, hệ thống áp dụng công thức tính khoản thanh toán cố định định kỳ (PMT) dựa trên nguyên lý chiết khấu dòng tiền:

$$PMT = \frac{PV \cdot r_m \cdot (1 + r_m)^n}{(1 + r_m)^n - 1}$$

Trong đó:
* $PV$: Dư nợ gốc còn lại cần thanh toán ($PV = \text{Tổng giá trị} - \text{Đã tích lũy}$).
* $r_m$: Lãi suất danh nghĩa theo tháng, với $r_m = \frac{r_{\text{năm}}}{12}$.
* $n$: Tổng số kỳ thanh toán theo tháng ($n = (\text{Năm kết thúc} - \text{Năm bắt đầu} + 1) \times 12$).

### 2. Mô hình quỹ tích lũy mục tiêu và giá trị tương lai hiệu chỉnh lạm phát (Inflation-Adjusted Sinking Fund)
Các mục tiêu chi tiêu dài hạn (mua chung cư, quỹ học vấn, hưu trí) chịu sự bào mòn nghiêm trọng của lạm phát. Thuật toán tiến hành theo quy trình hai bước:

* **Bước 1: Tính giá trị tương lai kỳ vọng ($FV$) có tính đến lạm phát:**
  $$FV = PV_0 \cdot (1 + i)^t$$
  Với $PV_0$ là chi phí hiện giá tại thời điểm lập kế hoạch, $i$ là tỷ lệ lạm phát bình quân hàng năm, và $t$ là số năm cho đến khi thực hiện mục tiêu ($t = \text{Tuổi thực hiện} - \text{Tuổi hiện tại}$).

* **Bước 2: Xác định lượng vốn cần tích lũy hàng tháng:**
  Dựa trên công thức giá trị tương lai của dòng niên kim tích lũy định kỳ (Sinking Fund Factor):
  $$PMT_{\text{invest}} = \frac{FV \cdot r_m}{(1 + r_m)^n - 1}$$
  Với $r_m = \frac{r_{\text{kỳ vọng}}}{12}$ là tỷ suất sinh lời bình quân tháng của danh mục phân bổ.

### 3. Mô hình phân bổ tài sản thích ứng theo vòng đời (Lifecycle Asset Allocation Model)
Khẩu vị rủi ro và khả năng gánh chịu tổn thất giảm dần theo độ tuổi khi thời gian phục hồi vốn ngắn lại. Thuật toán tự động tái cấu trúc tỷ trọng tài sản danh mục theo quy tắc điều chỉnh tuổi:

* **Tỷ trọng Cổ phiếu & Chứng chỉ quỹ tăng trưởng ($W_{\text{stocks}}$):**
  $$W_{\text{stocks}} = \max\left(15\%,\ \min\left(75\%,\ 100 - \text{Tuổi} + 5\right)\right)$$
* **Tỷ trọng Trái phiếu & Thu nhập cố định ($W_{\text{bonds}}$):**
  $$W_{\text{bonds}} = \min\left(60\%,\ \max\left(15\%,\ \text{Tuổi} \times 0.9\right)\right)$$
* **Tỷ trọng Bảo hiểm phòng hộ ($W_{\text{ins}}$):** Thiết lập mức cố định $7\%$ cho giai đoạn tích lũy sớm ($< 35$ tuổi) và nâng lên $10\%$ cho giai đoạn trung niên nhằm bảo vệ dòng thu nhập gia đình.
* **Tỷ trọng Tiền gửi & Tài sản thanh khoản ($W_{\text{cash}}$):** Đảm bảo tính thanh khoản với mức sàn tối thiểu:
  $$W_{\text{cash}} = \max\left(5\%,\ 100\% - (W_{\text{stocks}} + W_{\text{bonds}} + W_{\text{ins}})\right)$$
* **Tỷ suất sinh lời kỳ vọng tổng thể:**
  $$\bar{R} = \sum_{j} W_j \cdot R_j$$

### 4. Thuật toán nghịch đảo thu nhập từ tỷ lệ tiết kiệm mục tiêu (Savings-to-Income Inversion)
Thay vì chi tiêu trước rồi tiết kiệm phần thừa, hệ thống vận hành theo nguyên lý trả cho bản thân trước (*Pay Yourself First*). 

Từ tổng số tiền tiết kiệm và nghĩa vụ nợ bắt buộc trong năm $y$ ($\sum PMT_{y}$), hệ thống nghịch đảo để tìm ra mức thu nhập ròng hàng tháng tối thiểu cần đạt:

$$\text{Thu nhập cần có}_y = \frac{\sum PMT_y}{\text{Tỷ trọng tiết kiệm mục tiêu}}$$

*(Tỷ trọng tiết kiệm mặc định được chuẩn hóa ở mức $40\%$ hoặc điều chỉnh tùy theo khả năng cá nhân).*

### 5. Thuật toán phân tích thâm hụt và cảnh báo độ lệch sự nghiệp (Career Deficit Engine)
Hệ thống thực hiện so khớp từng điểm dữ liệu trên dòng thời gian giữa lộ trình thu nhập từ vị trí công việc ($I_{\text{route}}$) và mức thu nhập cần thiết để hiện thực hóa các mục tiêu ($I_{\text{target}}$):

$$\Delta I = I_{\text{route}} - I_{\text{target}}$$

* **Trạng thái Đạt yêu cầu ($\Delta I \ge 0$):** Lộ trình sự nghiệp đủ sức chi trả cho các mục tiêu; phân đoạn biểu đồ hiển thị sắc xanh lục.
* **Trạng thái Cảnh báo thâm hụt ($\Delta I < 0$):** Xuất hiện khoảng cách tài chính cần khắc phục; hệ thống tự động tính toán biên độ thiếu hụt và chuyển cảnh báo màu đỏ trên đồ thị.

### 6. Mô hình phân tích phương sai ngân sách (Budget Variance & Reconciliation)
Quy trình đối soát cuối mỗi tháng so sánh giữa dự toán ngân sách và số liệu thực tế phát sinh:

* **Phương sai thu nhập:** $Variance_{\text{income}} = Actual - Plan$ (Dương là thuận lợi, âm là bất lợi).
* **Phương sai chi phí:** $Variance_{\text{expense}} = Plan - Actual$ (Dương là tiết kiệm ngân sách, âm là vượt chi).
* **Lũy kế chênh lệch chi tiêu:** Theo dõi xu hướng tích lũy chênh lệch qua 12 tháng nhằm kịp thời điều chỉnh hành vi chi tiêu trong các quý tiếp theo:
  $$CumDiff_m = \sum_{k=1}^{m} \left(Actual_k - Plan_k\right)$$

### 7. Mô hình lượng hóa tâm lý và bối cảnh tài chính (Psychometric Scoring)
Hệ thống lượng hóa các yếu tố định tính thông qua hai bộ khảo sát với thang điểm có trọng số:
* **Khảo sát chịu đựng rủi ro:** Chấm điểm dựa trên thái độ với thua lỗ ngắn hạn, tầm nhìn rút vốn, mức độ hiểu biết về lạm phát và quy mô tài sản. Điểm số phân tầng từ *Cực kỳ thận trọng* đến *Quyết liệt*, trực tiếp hỗ trợ định hướng tỷ trọng danh mục.
* **Khảo sát hoàn cảnh tài chính:** Đo lường các nghĩa vụ phụ thuộc, bảo chứng từ gia đình, thói quen lập kế hoạch và tốc độ gia tăng thu nhập trong quá khứ để phân loại điều kiện phát triển tài chính từ *Bất lợi* đến *Cực kỳ thuận lợi*.

---

## Kiến trúc luồng dữ liệu phản ứng (Reactive Data Flow)

Hệ thống hoạt động trên nguyên tắc truyền dữ liệu theo luồng một chiều kết hợp đồng bộ hóa tức thời:

* **Từ khóa làm gốc:** Việc chỉnh sửa bất kỳ danh mục chi phí hay sản phẩm tài chính nào tại trang *Từ khóa* sẽ tự động cập nhật đến toàn bộ danh mục lựa chọn ở bảng lập kế hoạch, các bảng theo dõi 12 tháng và nhãn hiển thị trên biểu đồ.
* **Liên kết phát triển bản thân:** Mọi khoản chi cho giáo dục và nâng cao kỹ năng tại phân hệ phát triển bản thân hàng tháng được tự động tổng hợp và ghi nhận vào chi phí thực tế của danh mục *Chi tiền phát triển bản thân*, đảm bảo không xảy ra hiện tượng lệch số liệu kế toán.
* **Liên kết ma trận và biểu đồ sự nghiệp:** Khi người dùng thay đổi giá trị hoặc thời hạn của một mục tiêu trong bảng lập kế hoạch, ma trận 33 năm sẽ tự động tính lại dòng tiền, từ đó định hình lại đường mục tiêu tài chính trên biểu đồ lộ trình nghề nghiệp.

---

## Giá trị ứng dụng thực tiễn

Hệ thống loại bỏ hoàn toàn tính mơ hồ trong việc lập kế hoạch tài chính, mang lại cho người dùng:
* Cái nhìn thấu đáo về khả năng tài chính trong suốt vòng đời làm việc và nghỉ hưu.
* Động lực rõ ràng trong công việc khi hiểu chính xác một mức tăng lương tương ứng với việc hoàn thành mục tiêu cụ thể nào.
* Kỷ luật kiểm soát ngân sách dựa trên số liệu đối soát định kỳ thay vì cảm tính.
* Sự an tâm nhờ danh mục tài sản được thiết kế cân bằng giữa tăng trưởng và an toàn vốn qua từng mốc tuổi.




---
## Hiện thực Thuật toán & Kiến trúc Mã nguồn

Hệ thống được thiết kế theo mô hình luồng dữ liệu một chiều phản ứng (Reactive One-Way Data Flow), trong đó `AppState` đóng vai trò là một Single Source of Truth (nguồn chân lý duy nhất). Tất cả các phép tính toán tài chính, cập nhật DOM và biểu đồ đều được kích hoạt tự động theo chuỗi phụ thuộc khi dữ liệu đầu vào biến động.

---

### Quản lý Trạng thái Trung tâm và Chuỗi Phản ứng

Đối tượng `AppState` lưu giữ toàn bộ dữ liệu cấu hình danh mục, mục tiêu tích lũy, nghĩa vụ nợ, ngân sách tháng và điểm số khảo sát.

- **Mục đích thiết kế**: Tránh việc lưu trữ phân mảnh trên giao diện HTML, loại bỏ nguy cơ sai lệch số liệu giữa các tab chức năng.
- **Hàm điều phối trung tâm `recalculateAll()`**:
  - Đóng vai trò làm nhạc trưởng kích hoạt chuỗi tính toán lại toàn bộ hệ thống.
  - Tổng hợp dòng tiền 12 tháng từ `AppState.monthlyDetails` để cập nhật các thẻ chỉ số KPI tổng (Thu nhập, Chi tiêu, Tiết kiệm).
  - Lần lượt gọi các hàm phụ thuộc: tái tạo bảng lộ trình nghề nghiệp (`renderCareerTables`), vẽ lại biểu đồ tương quan (`renderCareerChart`), cập nhật ma trận lưới (`renderDashboardMatrices`) và dựng lại hệ thống biểu đồ phân tích (`renderDashboardAllCharts`).
  - Được chèn vào tất cả các sự kiện thay đổi dữ liệu (thêm/sửa/xóa dòng danh mục, cập nhật số tiền chi tiêu, chỉnh sửa lãi suất).

---

### Hiện thực Mô hình Niên kim và Giá trị Thời gian của Tiền tệ

Thuật toán tính toán dòng tiền định kỳ được tích hợp bên trong hai hàm cốt lõi: `calculateMonthlyNeed` và `calculateInvestTargetMetrics`.

#### Hàm tính dòng tiền nghĩa vụ nợ và tích lũy mục tiêu (`calculateMonthlyNeed`)
- **Vị trí trong mã nguồn**: Nhận tham số là một đối tượng `goal` từ danh sách `AppState.tcGoals`.
- **Mục đích chèn thuật toán**: Xác định chính xác số tiền cần trích lập mỗi tháng để hoàn thành một mục tiêu cụ thể trong khung thời gian quy định, tự động phân hóa giữa khoản vay và khoản tiết kiệm.
- **Cơ chế tính toán**:
  - Chuyển đổi lãi suất danh nghĩa năm sang lãi suất tháng: `rMonthly = (goal.rate / 100) / 12`.
  - Quy đổi tổng số năm thực hiện sang tổng số kỳ thanh toán tháng: `nMonths = nYears * 12`.
  - Đối với khoản nợ (`goal.type === 'debt'`), hàm áp dụng công thức hoàn vốn gốc và lãi (Amortization):
    ```javascript
    pmt = (targetNeed * rMonthly * Math.pow(1 + rMonthly, nMonths)) / (Math.pow(1 + rMonthly, nMonths) - 1);
    ```
  - Đối với mục tiêu đầu tư (`goal.type === 'invest'`), hàm áp dụng công thức quỹ chìm tích lũy định kỳ (Sinking Fund):
    ```javascript
    pmt = (targetNeed * rMonthly) / (Math.pow(1 + rMonthly, nMonths) - 1);
    ```
  - Xử lý trường hợp biên an toàn: Nếu người dùng thiết lập lãi suất bằng `0%` hoặc đầu vào phát sinh lỗi chia cho không (`NaN`/`Infinity`), hàm tự động chuyển sang phép chia tuyến tính đơn giản: `targetNeed / nMonths`.

#### Hàm điều chỉnh lạm phát và dòng tiền mục tiêu bản thân (`calculateInvestTargetMetrics`)
- **Vị trí trong mã nguồn**: Được gọi trong quá trình render bảng mục tiêu đầu tư cá nhân (`renderTargetTables`).
- **Mục đích chèn thuật toán**: Dự phóng chính xác chi phí của một mục tiêu trong tương lai (đã bị trượt giá bởi lạm phát), từ đó tính toán áp lực tiết kiệm thực tế hàng tháng.
- **Cơ chế tính toán**:
  - Tính khoảng thời gian đến mốc thực hiện: `years = Math.max(1, target.age - AppState.currentAge)`.
  - Tính giá trị tương lai (FV) dưới tác động của lạm phát kép:
    ```javascript
    const fv = target.pv * Math.pow(1 + (target.inflation / 100), years);
    ```
  - Đưa giá trị `fv` vào công thức quỹ tích lũy định kỳ tương ứng với lãi suất kỳ vọng tháng `rMonthly` để tính ra số tiền cần tích lũy mỗi tháng (`monthlyNeed`).

---

### Mô hình Phân bổ Tài sản Động theo Vòng đời

Mô hình phân bổ danh mục đầu tư được tự động hóa thông qua hàm `calculateAgeMilestones`.

- **Vị trí trong mã nguồn**: Thuộc phân hệ Cân đối lộ trình nghề nghiệp (Tab Cân đối).
- **Mục đích chèn thuật toán**: Cung cấp cơ cấu danh mục mẫu phù hợp với mức độ chấp nhận rủi ro biến thiên nghịch với độ tuổi, giúp người dùng định hướng danh mục tài sản qua từng giai đoạn cuộc đời.
- **Cơ chế tính toán**:
  - Tỷ trọng cổ phiếu giảm dần theo tuổi và được chặn biên an toàn từ 15% đến 75%:
    ```javascript
    const stocks = Math.max(15, Math.min(75, 100 - age + 5));
    ```
  - Tỷ trọng trái phiếu tăng dần nhằm gia tăng sự an toàn:
    ```javascript
    const bonds = Math.min(60, Math.max(15, age * 0.9));
    ```
  - Tỷ trọng bảo hiểm nâng từ 7% lên 10% khi người dùng vượt qua cột mốc 35 tuổi để gia tăng lá chắn tài chính khi trách nhiệm gia đình gia tăng.
  - Tỷ trọng tiền mặt được tính bằng phần bù còn lại để tổng danh mục luôn đạt 100%.
  - Tính mức sinh lời cần thiết của danh mục dựa trên trung bình gia quyền tỷ trọng và tỷ suất kỳ vọng của từng nhóm tài sản:
    ```javascript
    const returnNeed = ((stocks * 13.5 + bonds * 9.5 + ins * 4.5 + cash * 5.0) / 100);
    ```

---

### Động cơ Ma trận Tài chính 33 Năm và Đồng bộ Hai Chiều

Ma trận dòng tiền tương lai được điều khiển bởi hàm `renderTcMatrixTable` kết hợp sự kiện lắng nghe trực tiếp `onMatrixCellChange`.

- **Mục đích chèn thuật toán**:
  - Mô phỏng toàn diện dòng tiền cần tích lũy và thu nhập mục tiêu qua từng năm (từ độ tuổi hiện tại đến 32 năm tiếp theo).
  - Cho phép người dùng trực tiếp tinh chỉnh số tiền trên từng ô của bảng (Two-way Data Binding) mà không làm phá vỡ logic tổng thể.
- **Cơ chế hoạt động**:
  - Dòng tiền tiết kiệm cần có mỗi tháng trong năm $y$ được tính bằng tổng nhu cầu của tất cả các mục tiêu đang kích hoạt trong năm đó:
    ```javascript
    let sSum = 0;
    allGoals.forEach(g => {
      if (yr >= g.start && yr <= g.end) {
        sSum += (g.monthly || calculateMonthlyNeed(g));
      }
    });
    ```
  - Thu nhập tối thiểu cần có được nội suy ngược dựa trên tỷ lệ trích lập tiết kiệm mục tiêu cố định 40%:
    ```javascript
    const incNeed = sSum > 0 ? (sSum / 0.40) : 0;
    ```
  - Khi người dùng gõ trực tiếp vào ô trên ma trận (`onMatrixCellChange`), hàm sẽ duyệt lại toàn bộ các ô nhập liệu trong hàng, tính toán lại giá trị tổng tiết kiệm và thu nhập cần có, cập nhật tức thì dữ liệu vào biểu đồ `tcMatrixChart` và kích hoạt đồng bộ sang bảng lộ trình nghề nghiệp.

---

### Thuật toán Phân tích Khoảng cách Thu nhập và Đồ họa Đổi màu Phân đoạn

Sự tương thích giữa năng lực gia tăng thu nhập và áp lực mục tiêu tài chính được kiểm soát thông qua hàm `calculateCareerDetails` và xử lý hiển thị trong `renderCareerChart`.

- **Mục đích chèn thuật toán**: Nhận diện sớm nguy cơ thiếu hụt ngân sách qua từng mốc tuổi và trực quan hóa trạng thái sức khỏe tài chính bằng màu sắc cảnh báo.
- **Cơ chế xử lý logic**:
  - So sánh trực tiếp giữa thu nhập theo lộ trình nghề nghiệp (`route`) và thu nhập cần có để đạt mục tiêu tài chính (`target`).
  - Nếu `route < target`: Hệ thống gán nhãn cảnh báo thâm hụt tài chính (`deficit-badge`), tính toán chính xác số tiền thiếu hụt mỗi tháng (`target - route`) và đổi màu chữ hiển thị thành đỏ nguy hiểm.
  - Nếu `route >= target`: Hệ thống xác nhận lộ trình khả thi (`success-badge`) với sắc thái xanh an toàn.
- **Kỹ thuật đổi màu phân đoạn trên Chart.js (`renderCareerChart`)**:
  - Điểm dữ liệu (Data points) được cấu hình màu động theo hàm callback:
    ```javascript
    pointBackgroundColor: ctx => {
      const idx = ctx.dataIndex;
      return routes[idx] >= targets[idx] ? "#16a34a" : "#dc2626";
    }
    ```
  - Đoạn đường nối (Line segments) sử dụng tính năng `segment` của Chart.js để chuyển màu mượt mà theo từng khoảng: Nếu cả hai đầu mút của đoạn thẳng đều đạt hoặc vượt mục tiêu thì phân đoạn có màu xanh lục (`#16a34a`), ngược lại nếu rơi vào vùng thâm hụt sẽ lập tức chuyển sang màu đỏ (`#dc2626`).

---

### Thuật toán Lượng hóa Tâm lý Khảo sát và Đồng bộ Lũy kế

Hệ thống đánh giá định tính bản thân được chuyển đổi thành số liệu định lượng thông qua hàm `evaluateSurveys` và hệ thống theo dõi tháng `renderReconciliationTable`.

#### Hàm lượng hóa điểm số trắc nghiệm (`evaluateSurveys`)
- **Mục đích chèn thuật toán**: Biến các câu trả lời trắc nghiệm thành điểm số có trọng số, từ đó đưa ra hồ sơ rủi ro và điều kiện tài chính khách quan.
- **Cơ chế tính toán**:
  - Mỗi lựa chọn được gắn một trọng số điểm cụ thể trong mảng cấu hình `weights`.
  - Tổng điểm khảo sát khả năng chịu rủi ro ($S_1$) và khảo sát hoàn cảnh ($S_2$) được cộng dồn theo các câu hỏi đã chọn.
  - Áp dụng các ngưỡng phân loại điều kiện để xuất ra khuyến nghị phân bổ tài sản phù hợp, đồng thời tự động cập nhật kết quả sang bảng tóm tắt mục tiêu bản thân (`survey-result-risk` và `survey-result-context`).

#### Thuật toán bù trừ và lũy kế phương sai chi tiêu
- **Vị trí trong mã nguồn**: Triển khai tại hàm `renderReconciliationTable` và biểu đồ `chartDashVariance`.
- **Mục đích chèn thuật toán**: Kiểm soát kỷ luật tài chính trong năm thông qua việc so sánh liên tục giữa kế hoạch đã định và chi tiêu thực tế.
- **Cơ chế tính toán**:
  - Tính toán mức chênh lệch tuyệt đối: `diff = actual - plan`.
  - Tính phương sai lũy kế qua 12 tháng:
    ```javascript
    runningDiff += (actualMonthExpense - planMonthExpense);
    cumDiff.push(runningDiff);
    ```
  - Giúp phát hiện sớm xu hướng bội chi tích lũy trước khi nó ảnh hưởng tiêu cực đến các khoản đầu tư dài hạn.
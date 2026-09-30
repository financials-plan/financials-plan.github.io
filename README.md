# Personal Financial Planning & Wealth Management Dashboard
> **Hệ thống Quản lý & Hoạch định Lộ trình Tài chính Cá nhân Toàn diện**

[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/HTML5)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=flat-square&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Chart.js](https://img.shields.io/badge/Chart.js-v4.x-FF6384?style=flat-square&logo=chartdotjs&logoColor=white)](https://www.chartjs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](LICENSE)

---

## 📌 Tổng Quan Dự Án (Executive Summary)

**Personal Financial Planning Dashboard** là ứng dụng web tương tác đơn trang (Single-Page Application - SPA) được xây dựng theo mô hình spreadsheet chuyên sâu. Ứng dụng mô phỏng lại toàn bộ quy trình hoạch định tài chính cá nhân tiêu chuẩn: từ việc thiết lập các danh mục thu/chi, đánh giá mức độ chấp nhận rủi ro và bối cảnh cá nhân, lên kế hoạch dòng tiền 12 tháng, cho đến bài toán khấu hao niên kim (Amortization) và tối ưu hóa danh mục phân bổ tài sản theo độ tuổi.

---

## 🚀 Các Tính Năng Cốt Lõi (Key Features)

### 1. Quản lý Danh mục & Cấu hình Cơ sở (Master Data Setup)
* **Quy ước nhập liệu chuẩn bảng tính:** Phân định rõ ràng giữa ô nhập liệu (`#0070c0` - Blue), kết quả tính toán trung gian (`#000000` - Black) và chỉ số tài chính trọng yếu (`#c00000` - Red).
* **Đồng bộ thời gian thực:** Cập nhật tự động giữa năm bắt đầu theo dõi, độ tuổi hiện tại và năm sinh.
* **Danh mục tùy biến linh hoạt:** Cho phép thêm/sửa trực tiếp (Inline Editing) danh mục Thu nhập, Chi phí sinh hoạt, Kế hoạch đào tạo và Danh mục sản phẩm đầu tư (cùng tỷ suất sinh lời/rủi ro kỳ vọng).

### 2. Dashboard Phân tích & Trực quan hóa Dòng tiền (Financial Analytics)
* **Thẻ chỉ số hiệu suất (KPI Metric Cards):** Theo dõi tổng tài sản mục tiêu, tỷ suất sinh lời trung bình, tổng thu nhập - chi tiêu thực tế, số dư tích lũy và tỷ lệ tiết kiệm (Savings Rate).
* **Đồ thị động (Chart.js):** 
  * Biểu đồ Doughnut phân bổ tỷ trọng chi tiêu thực tế theo từng nhóm hạng mục.
  * Biểu đồ cột ghép (Grouped Bar Chart) so sánh trực quan dòng tiền Thu nhập vs Chi tiêu qua 12 tháng.
* **Ma trận 12 tháng & Sparklines:** Hiển thị chi tiết dòng tiền 12 tháng kèm đồ thị xu hướng Sparkline SVG nội tuyến cho từng danh mục.

### 3. Khảo sát Hành vi & Khẩu vị Rủi ro (Risk Profiling & Assessment)
* **Bộ trắc nghiệm chuẩn hóa 2 phần:**
  * *Khảo sát 1:* Đánh giá khả năng chịu đựng rủi ro đầu tư (khung thời gian đầu tư, phản ứng trước biến động thị trường, danh mục mục tiêu).
  * *Khảo sát 2:* Đánh giá bối cảnh tài chính, áp lực gia đình và tốc độ tăng trưởng thu nhập.
* Tự động chấm điểm và kết xuất khuyến nghị chiến lược đầu tư (An toàn / Cân bằng / Tăng trưởng) đồng bộ sang kế hoạch mục tiêu.

### 4. Mô hình Tính toán Niên kim Trả góp (Loan Amortization Schedule)
* Tính toán số tiền trả góp hàng năm theo công thức niên kim cố định:
  $$\text{PMT} = P \times \frac{r(1+r)^n}{(1+r)^n - 1}$$
* Lập lịch trình thanh toán chi tiết: Phân tách rõ ràng giữa dư nợ gốc đầu kỳ, phần nợ gốc đã trả, lãi phát sinh thực tế và số dư nợ cuối kỳ cho từng năm.

### 5. Lộ trình Phân bổ Tài sản theo Độ tuổi (Asset Allocation Life-Cycle)
* Tự động cân đối tỷ trọng danh mục đầu tư (Cổ phiếu, Trái phiếu, Bảo hiểm) và mục tiêu thu nhập cần đạt tương ứng theo các mốc tuổi vàng: 21, 26, 30, 35, 40, 50.

### 6. Theo dõi & Đối soát Ngân sách Chi tiết 12 Tháng (Reconciliation)
* Nhật ký thu - chi chi tiết theo từng ngày phát sinh.
* Bảng đối soát tự động giữa **Kế hoạch (Plan)** và **Thực tế (Actual)** kèm chênh lệch (Variance Analysis) và ghi chú nguyên nhân.

---

## 🛠 Công Nghệ Sử Dụng (Tech Stack)

| Công nghệ | Vai trò trong hệ thống |
| :--- | :--- |
| **HTML5 (Semantic)** | Cấu trúc giao diện, tối ưu layout Dashboard & Bảng biểu |
| **CSS3 (Flexbox & CSS Grid)** | Thiết kế UI/UX đồng bộ chuẩn corporate font (Montserrat), responsive layout |
| **Vanilla JavaScript (ES6+)** | Quản lý trạng thái tập trung (`AppState`), thuật toán tài chính và reactive DOM rendering |
| **Chart.js** | Thư viện kết xuất biểu đồ động trên Canvas |
| **Font Awesome 6.5** | Bộ icon trực quan hóa danh mục và điều hướng |

---

## 📁 Cấu Trúc Thư Mục (Project Structure)

```text
├── index.html        # Giao diện SPA chính (Tabs, Tables, Modals, Forms)
├── style.css         # Toàn bộ stylesheet, layout bảng tính, theme bảng màu
├── script.js         # State management, nghiệp vụ tài chính, render logic & Chart.js
└── README.md         # Tài liệu dự án

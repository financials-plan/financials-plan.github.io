/**
 * TOÀN BỘ LOGIC REACTIVE, TÍNH TOÁN TÀI CHÍNH, SELECTION SYNC VÀ CHARTS
 */

const AppState = {
  currentYear: 2026,
  currentAge: 21,
  birthYear: 2005,
  currentMonth: 1,

  expenses: [
    "Mua thực phẩm", "Mua đồ dùng trong nhà", "Đi ăn ở ngoài",
    "Chi tiền phát triển bản thân", "Chi tiền bảo hiểm",
    "Chi tiền điện, nước, internet, điện thoại, xăng xe",
    "Chi tiền giải trí, quà tặng", "Chi tiền cho con học đại học", "Chi tiền trả nợ", "Chi tiền cho tặng gia đình"
  ],
  incomeList: [
    "Lương từ công ty", "Thu nhập kinh doanh", "Lãi tiền gửi & đầu tư", "Thu nhập khác"
  ],
  planList: [
    "Mua sách", "Khóa học ngắn hạn", "Khóa học dài hạn", "Tham gia các buổi diễn thuyết", "Chi phát triển bản thân khác"
  ],
  investProducts: [
    { name: "ETF - ETFVFM", returnRate: 13.0, risk: 18.0 },
    { name: "ETF - ETFFINLEAD", returnRate: 15.0, risk: 20.0 },
    { name: "DCBC", returnRate: 16.0, risk: 20.0 },
    { name: "DCDS", returnRate: 11.0, risk: 10.0 },
    { name: "DCBF", returnRate: 9.0, risk: 8.0 },
    { name: "Trái phiếu Techcombank", returnRate: 10.5, risk: 6.0 },
    { name: "Trái phiếu FE Credit", returnRate: 10.0, risk: 8.0 },
    { name: "Finhay", returnRate: 6.0, risk: 7.0 },
    { name: "Bảo hiểm thuần túy", returnRate: 4.0, risk: 5.0 },
    { name: "BH liên kết đầu tư", returnRate: 12.0, risk: 5.0 },
    { name: "Tiền gửi ngân hàng", returnRate: 5.0, risk: 2.0 },
    { name: "Cổ phiếu riêng lẻ", returnRate: 12.0, risk: 6.0 }
  ],

  debtTargets: [
    { age: 35, desc: "Vay mua chung cư", val: 500.0 }
  ],
  investTargets: [
    { age: 25, desc: "Du lịch xuyên Thái Lan", val: 50.0 },
    { age: 26, desc: "Quỹ dự phòng tài chính", val: 100.0 },
    { age: 28, desc: "Đám cưới", val: 200.0 },
    { age: 30, desc: "Khởi nghiệp", val: 500.0 },
    { age: 38, desc: "Mua chung cư", val: 1500.0 },
    { age: 46, desc: "Cho con đi học đại học", val: 500.0 },
    { age: 50, desc: "Hưu trí", val: 500.0 }
  ],

  skillsList: ["Sẵn sàng học hỏi cái mới", "Nhiệt huyết trong công việc"],
  familyList: ["Ba mẹ có hỗ trợ mua chung cư , lo đám cưới"],
  jobList: [
    "Môi trường đa quốc gia, có nhiều cơ hội phát triển",
    "Môi trường làm việc có sự cạnh tranh gay gắt, áp lực KPI",
    "Có chế độ đãi ngộ tốt về lương thưởng, lương bổng"
  ],

  planIncome: [
    { name: "Lương từ công ty", plan: 25.0, note: "Lương chính thức", analysis: "Nguồn thu ổn định chiếm tỷ trọng lớn" },
    { name: "Thu nhập kinh doanh", plan: 10.0, note: "Doanh thu ngoài giờ", analysis: "Biến động phụ thuộc vào thị trường" },
    { name: "Lãi tiền gửi & đầu tư", plan: 5.0, note: "Cổ tức & tiền gửi", analysis: "Thu nhập thụ động dòng tiền định kỳ" }
  ],
  planExpense: [
    { name: "Mua thực phẩm", plan: 6.0, note: "Tiền chợ, đồ tươi", analysis: "Chi phí thiết yếu bắt buộc" },
    { name: "Mua đồ dùng trong nhà", plan: 1.0, note: "Gia dụng", analysis: "Tối ưu hóa mua sắm định kỳ" },
    { name: "Đi ăn ở ngoài", plan: 2.0, note: "Tiếp khách & bạn bè", analysis: "Chi phí linh hoạt cần kiểm soát" },
    { name: "Chi tiền phát triển bản thân", plan: 3.5, note: "Sách & khóa học", analysis: "Đầu tư vốn con người tạo ROI cao" },
    { name: "Chi tiền bảo hiểm", plan: 1.0, note: "Bảo vệ dòng tiền", analysis: "Quản trị rủi ro sức khỏe" },
    { name: "Chi tiền điện, nước, internet, điện thoại, xăng xe", plan: 2.0, note: "Hóa đơn cố định", analysis: "Chi tiêu sinh hoạt cơ bản" },
    { name: "Chi tiền trả nợ", plan: 6.5, note: "Gốc + lãi vay", analysis: "Nghĩa vụ nợ cần ưu tiên trích trước" }
  ],

  tcGoals: [
    { id: "g1", name: "Thẻ tín dụng", type: "debt", val: 100.0, paid: 0.0, start: 2026, end: 2028, rate: 8.0, monthly: 3.13 },
    { id: "g2", name: "Vay vốn kinh doanh", type: "debt", val: 150.0, paid: 30.0, start: 2028, end: 2031, rate: 8.0, monthly: 2.93 },
    { id: "g3", name: "Vay cải tạo/sửa chữa", type: "debt", val: 400.0, paid: 120.0, start: 2030, end: 2040, rate: 8.0, monthly: 3.20 },
    { id: "g4", name: "Hoàn thành quỹ học vấn", type: "invest", val: 200.0, paid: 50.0, start: 2024, end: 2027, rate: 8.65, monthly: 3.71 },
    { id: "g5", name: "Hỗ trợ mẹ mở rộng hoạt động", type: "invest", val: 250.0, paid: 100.0, start: 2028, end: 2031, rate: 8.0, monthly: 3.66 },
    { id: "g6", name: "Xây quỹ mua ô tô phục vụ gia đình", type: "invest", val: 750.0, paid: 350.0, start: 2030, end: 2042, rate: 8.0, monthly: 4.13 },
    { id: "g7", name: "Quỹ chăm sóc sức khỏe ba mẹ", type: "invest", val: 400.0, paid: 100.0, start: 2030, end: 2037, rate: 7.5, monthly: 4.17 },
    { id: "g8", name: "Sửa chữa và nâng cấp nhà ở", type: "invest", val: 700.0, paid: 400.0, start: 2035, end: 2045, rate: 7.0, monthly: 3.27 },
    { id: "g9", name: "Quỹ tài chính nghỉ hưu cho ba mẹ", type: "invest", val: 800.0, paid: 190.0, start: 2037, end: 2045, rate: 8.0, monthly: 7.94 },
    { id: "g10", name: "Tài sản tích lũy dài hạn", type: "invest", val: 700.0, paid: 0.0, start: 2030, end: 2045, rate: 8.0, monthly: 6.47 }
  ],

  careerOverview: [
    { age: 21, incomeNeed: 6.4, stocks: 23.6, bonds: 34.5, ins: 8.5, cash: 33.4, returnNeed: 9.8, skills: "Kỹ năng làm việc nhóm, chuyên môn marketing" },
    { age: 26, incomeNeed: 28.5, stocks: 56.8, bonds: 20.6, ins: 5.7, cash: 16.9, returnNeed: 12.4, skills: "Kỹ năng leader, quản trị dự án, xây dựng mô hình" },
    { age: 30, incomeNeed: 38.2, stocks: 55.0, bonds: 25.0, ins: 7.0, cash: 13.0, returnNeed: 11.5, skills: "Kỹ năng lãnh đạo chiến lược, mở rộng quan hệ đối tác" },
    { age: 35, incomeNeed: 52.0, stocks: 45.0, bonds: 35.0, ins: 8.0, cash: 12.0, returnNeed: 10.2, skills: "Kỹ năng quản lý doanh nghiệp, hoạch định ngân sách lớn" },
    { age: 40, incomeNeed: 65.0, stocks: 35.0, bonds: 45.0, ins: 10.0, cash: 10.0, returnNeed: 9.5, skills: "Kỹ năng tạo lập cộng đồng, tái cấu trúc tài sản" },
    { age: 50, incomeNeed: 80.0, stocks: 20.0, bonds: 60.0, ins: 12.0, cash: 8.0, returnNeed: 8.2, skills: "Kỹ năng chuyển giao thế hệ, quản trị danh mục bảo toàn" }
  ],

  careerDetail: [
    { age: 22, actual: 10.0, route: 12.0 },
    { age: 23, actual: 15.0, route: 12.0 },
    { age: 24, actual: 20.0, route: 12.0 },
    { age: 25, actual: 25.0, route: 15.0 },
    { age: 26, actual: 28.0, route: 20.0 },
    { age: 27, actual: 30.0, route: 20.0 },
    { age: 28, actual: 35.0, route: 20.0 },
    { age: 29, actual: 38.0, route: 20.0 },
    { age: 30, actual: 40.0, route: 20.0 },
    { age: 35, actual: 55.0, route: 30.0 },
    { age: 40, actual: 70.0, route: 40.0 },
    { age: 45, actual: 85.0, route: 45.0 },
    { age: 50, actual: 100.0, route: 50.0 }
  ],

  monthlyDetails: {},
  matrixIncome: {},
  matrixExpense: {},
  matrixLearning: {}
};

// Khởi tạo 12 tháng
for (let m = 1; m <= 12; m++) {
  const mStr = m < 10 ? `0${m}` : `${m}`;
  AppState.monthlyDetails[m] = {
    incomes: [
      { date: `2026-${mStr}-15`, cat: "Lương từ công ty", desc: "Lương chính thức", val: 25.0 },
      { date: `2026-${mStr}-28`, cat: "Thu nhập kinh doanh", desc: "Thu nhập ngoài giờ", val: 8.0 }
    ],
    expenses: [
      { date: `2026-${mStr}-01`, cat: "Mua thực phẩm", desc: "Đi chợ, siêu thị", val: 6.0 },
      { date: `2026-${mStr}-05`, cat: "Đi ăn ở ngoài", desc: "Ăn uống giao lưu", val: 1.8 },
      { date: `2026-${mStr}-10`, cat: "Chi tiền trả nợ", desc: "Khoản nợ định kỳ", val: 6.5 },
      { date: `2026-${mStr}-15`, cat: "Chi tiền điện, nước, internet, điện thoại, xăng xe", desc: "Hóa đơn", val: 1.8 }
    ],
    reconIncomeNotes: {},
    reconExpenseNotes: {},
    learningDetails: [
      { date: `2026-${mStr}-05`, cat: "Mua sách", desc: "Sách tài chính", val: 0.2, expRes: "Bổ sung kiến thức", actRes: "Ứng dụng thực tế" }
    ]
  };
}

// Bộ câu hỏi khảo sát chuẩn XLSX
const surveyQuestionsPart1 = [
  { q: "Bạn có bao nhiêu mục tiêu tài chính?", opts: ["1", "2", "3", "4", ">4"], weights: [1, 2, 3, 4, 5], def: 4 },
  { q: "Bạn có cần thu nhập hàng tháng từ danh mục đầu tư không?", opts: ["Không", "Dưới 2%", "Lớn hơn 2%, nhưng nhỏ hơn 4%", "Lớn hơn 4%, nhưng nhỏ hơn 6%", "Lớn hơn 6%"], weights: [1, 2, 3, 4, 5], def: 4 },
  { q: "Sau bao lâu thì bạn sẽ bắt đầu muốn rút tiền từ danh mục đầu tư của mình để phục vụ cho mục đích?", opts: ["Hơn 20 năm", "11–20 năm", "6–10 năm", "1–5 năm", "Ngay lập tức"], weights: [1, 2, 3, 4, 5], def: 2 },
  { q: "Hãy mô tả quan điểm của bạn đối với vấn đề mức sinh lời và rủi ro từ việc đầu tư?", opts: ["Hạn chế rủi ro tối đa, chấp nhận sinh lời thấp", "Chấp nhận rủi ro vừa phải để đạt sinh lời vừa phải", "Tối đa hóa mức sinh lời để đạt mục tiêu kế hoạch", "Sẵn sàng chấp nhận rủi ro cao để sớm đạt mục tiêu"], weights: [1, 2, 3, 4], def: 2 },
  { q: "Biểu đồ mức sinh lời trung bình trong 20 năm của 3 danh mục đầu tư, bạn chọn danh mục nào?", opts: ["Danh mục X (Lợi nhuận TB = 8%, rủi ro thấp)", "Danh mục Y (Lợi nhuận TB = 12%, biến động vừa)", "Danh mục Z (Lợi nhuận TB = 16%, biến động mạnh)"], weights: [1, 2, 3], def: 1 },
  { q: "Bạn cảm thấy thoải mái khi lựa chọn danh mục rủi ro nào nhất?", opts: ["Danh mục A (Kỳ vọng 107 tr, lỗ tiềm năng 19%)", "Danh mục B (Kỳ vọng 108 tr, lỗ tiềm năng 23%)", "Danh mục C (Kỳ vọng 109 tr, lỗ tiềm năng 26%)", "Danh mục D (Kỳ vọng 110 tr, lỗ tiềm năng 28%)"], weights: [1, 2, 3, 4], def: 1 },
  { q: "Quan điểm của bạn về nỗi lo lạm phát?", opts: ["Giảm thiểu biến động ngắn hạn, vượt lạm phát không quan trọng", "Muốn cao hơn lạm phát vừa phải và chịu biến động vừa", "Vượt xa lạm phát dài hạn và chấp nhận biến động ngắn hạn"], weights: [1, 2, 3], def: 2 },
  { q: "Bạn nghĩ gì về những giai đoạn danh mục có những khoản lỗ?", opts: ["Bán các khoản đầu tư ngay lập tức", "Không thoải mái nhưng kiên nhẫn chờ phục hồi", "Chịu được sụt giảm và duy trì trạng thái 1 năm", "Kiên định tuyệt đối với mục tiêu dài hạn"], weights: [1, 2, 3, 4], def: 1 },
  { q: "Giá trị đầu tư tài sản hiện tại của bạn là?", opts: ["Dưới 200 triệu đồng", "200 triệu – 500 triệu đồng", "500 triệu – 1 tỷ đồng", "Từ 1 – 2 tỷ đồng", "Hơn 2 tỷ đồng"], weights: [1, 2, 3, 4, 5], def: 0 },
  { q: "Tỷ lệ tiết kiệm hàng tháng sau khi trừ các chi phí?", opts: ["Dưới 10%", "10 – 20%", "20 – 30%", "30 – 50%", "> 50%"], weights: [1, 2, 3, 4, 5], def: 1 }
];

const surveyQuestionsPart2 = [
  { q: "Tỷ lệ trích thu nhập hàng tháng để gửi về cho gia đình?", opts: [">30%", "20-30%", "10-20%", "0-10%", "0%"], weights: [1, 2, 3, 4, 5], def: 2 },
  { q: "Mức thu nhập của vợ/chồng so với bạn?", opts: ["<50%", "50-70%", "70-100%", "100-150%", "150-300%"], weights: [1, 2, 3, 4, 5], def: 2 },
  { q: "Tần suất quan tâm đến mạng xã hội mỗi ngày?", opts: ["3-4 giờ", "2-3 giờ", "1-2 giờ", "30-60 phút", "<30 phút"], weights: [1, 2, 3, 4, 5], def: 0 },
  { q: "Số lượng bạn bè trên mạng xã hội?", opts: ["<100", "100-200", "200-400", "400-800", ">800"], weights: [1, 2, 3, 4, 5], def: 4 },
  { q: "Cách xây dựng kế hoạch đầu mỗi năm?", opts: ["Chưa bao giờ", "Hiếm khi", "Tùy hứng", "Thường xuyên", "Hầu như năm nào cũng lập"], weights: [1, 2, 3, 4, 5], def: 2 },
  { q: "Số lượng em nhỏ trong gia đình còn đi học?", opts: ["4 em", "3 em", "2 em", "1 em", "0 em"], weights: [1, 2, 3, 4, 5], def: 4 },
  { q: "Quan điểm về việc tích lũy tài sản cho con cái?", opts: ["Chỉ hỗ trợ giáo dục", "Trang bị phương tiện cơ bản", "Để lại tài sản lớn", "Tích lũy nhiều nhất có thể"], weights: [2, 3, 4, 5], def: 3 },
  { q: "Đánh giá sức khỏe bản thân so với bạn bè?", opts: ["Kém hơn rất nhiều", "Kém hơn", "Bằng mức trung bình", "Tốt hơn", "Tốt hơn rất nhiều"], weights: [1, 2, 3, 4, 5], def: 3 },
  { q: "Tình hình tài chính khi còn đi học?", opts: ["Phụ thuộc hoàn toàn", "Gia đình hỗ trợ học phí và làm thêm", "Tự làm thêm lo cho mình"], weights: [2, 3, 4], def: 0 },
  { q: "Mức chênh lệch thu nhập của đồng nghiệp cùng công ty?", opts: ["Không đáng kể", "Chênh lệch vừa phải", "Tương đối lớn", "Rất lớn"], weights: [1, 2, 3, 4], def: 1 },
  { q: "Tốc độ tăng thu nhập trung bình 3 năm gần nhất?", opts: ["Gần như không tăng", "<5%", "5-10%", "10-20%", "20-30%", ">30%"], weights: [1, 2, 3, 4, 5, 6], def: 2 }
];

// ==================== CÁC HÀM ĐIỀU HƯỚNG TABS ====================
window.switchTab = function(tabId) {
  document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
  document.getElementById(`btn-${tabId}`)?.classList.add('active');

  const titlesMap = {
    'tab-tukhoa': 'TỪ KHÓA',
    'tab-dashboard': 'DASHBOARD THEO DÕI TÀI CHÍNH',
    'tab-muctieu-bt': 'XÁC ĐỊNH MỤC TIÊU BẢN THÂN',
    'tab-muctieu-tc': 'XÁC ĐỊNH MỤC TIÊU TÀI CHÍNH',
    'tab-candoi': 'CÂN ĐỐI LỘ TRÌNH NGHỀ NGHIỆP',
    'tab-kehoach': 'KẾ HOẠCH THU NHẬP VÀ CHI TIÊU',
    'tab-khaosat': 'BẢNG KHẢO SÁT ĐÁNH GIÁ BẢN THÂN'
  };

  document.getElementById('current-title').textContent = titlesMap[tabId] || 'TÀI CHÍNH CÁ NHÂN';
  document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
  const targetPane = document.getElementById(tabId);
  if (targetPane) {
    targetPane.classList.add('active');
    if (tabId === 'tab-dashboard') renderDashboardAllCharts();
    if (tabId === 'tab-candoi') renderCareerChart();
    if (tabId === 'tab-muctieu-tc') renderTcGoalsFormTable();
  }
};

window.switchMonthTab = function(m) {
  AppState.currentMonth = m;
  document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
  document.getElementById(`btn-month-${m}`)?.classList.add('active');
  document.getElementById('current-title').textContent = `THEO DÕI THU - CHI THÁNG ${m}`;

  document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
  document.getElementById('tab-month')?.classList.add('active');

  renderMonthView(m);
};

window.switchMonthSection = function(secNum) {
  document.getElementById('btn-month-sec1')?.classList.toggle('active', secNum === 1);
  document.getElementById('btn-month-sec2')?.classList.toggle('active', secNum === 2);
  document.getElementById('month-sec-1')?.classList.toggle('active', secNum === 1);
  document.getElementById('month-sec-2')?.classList.toggle('active', secNum === 2);
  if (secNum === 1) renderMonthHorizontalBarChart();
};

window.switchTcSection = function(secNum) {
  document.getElementById('btn-tc-sec1')?.classList.toggle('active', secNum === 1);
  document.getElementById('btn-tc-sec2')?.classList.toggle('active', secNum === 2);
  document.getElementById('tc-section-1')?.classList.toggle('active', secNum === 1);
  document.getElementById('tc-section-2')?.classList.toggle('active', secNum === 2);
  if (secNum === 2) {
    renderTcMatrixTable();
    setTimeout(renderTcMatrixChart, 60);
  }
};

window.switchCareerSection = function(secNum) {
  document.getElementById('btn-career-sec1')?.classList.toggle('active', secNum === 1);
  document.getElementById('btn-career-sec2')?.classList.toggle('active', secNum === 2);
  document.getElementById('career-sec-1')?.classList.toggle('active', secNum === 1);
  document.getElementById('career-sec-2')?.classList.toggle('active', secNum === 2);
  renderCareerChart();
};

// ==================== TỪ KHÓA (MASTER DATA) VÀ ĐỒNG BỘ 2 CHIỀU ====================
function renderSetupTables() {
  const tbExp = document.getElementById('tbody-expenses');
  if (tbExp) {
    tbExp.innerHTML = AppState.expenses.map((item, idx) => `
      <tr>
        <td class="text-center">${idx + 1}</td>
        <td class="cell-blue" contenteditable="true" spellcheck="false" onblur="updateExpenseItem(${idx}, this.innerText)">${item}</td>
        <td class="text-center"><button class="btn-table-del" onclick="deleteExpenseItem(${idx})"><i class="fa-solid fa-trash-can"></i></button></td>
      </tr>
    `).join('');
  }

  const tbInc = document.getElementById('tbody-income');
  if (tbInc) {
    tbInc.innerHTML = AppState.incomeList.map((item, idx) => `
      <tr>
        <td class="text-center">${idx + 1}</td>
        <td class="cell-blue" contenteditable="true" spellcheck="false" onblur="updateIncomeItem(${idx}, this.innerText)">${item}</td>
        <td class="text-center"><button class="btn-table-del" onclick="deleteIncomeItem(${idx})"><i class="fa-solid fa-trash-can"></i></button></td>
      </tr>
    `).join('');
  }

  const tbLrn = document.getElementById('tbody-learning');
  if (tbLrn) {
    tbLrn.innerHTML = AppState.planList.map((item, idx) => `
      <tr>
        <td class="text-center">${idx + 1}</td>
        <td class="cell-blue" contenteditable="true" spellcheck="false" onblur="updatePlanListItem(${idx}, this.innerText)">${item}</td>
        <td class="text-center"><button class="btn-table-del" onclick="deletePlanListItem(${idx})"><i class="fa-solid fa-trash-can"></i></button></td>
      </tr>
    `).join('');
  }

  const tbInv = document.getElementById('tbody-invest');
  if (tbInv) {
    tbInv.innerHTML = AppState.investProducts.map((p, idx) => `
      <tr>
        <td class="text-center">${idx + 1}</td>
        <td class="cell-blue" contenteditable="true" spellcheck="false" onblur="updateInvestField(${idx}, 'name', this.innerText)">${p.name}</td>
        <td class="text-right cell-blue" contenteditable="true" spellcheck="false" onblur="updateInvestField(${idx}, 'returnRate', parseFloat(this.innerText)||0)">${p.returnRate.toFixed(1)}%</td>
        <td class="text-right cell-blue" contenteditable="true" spellcheck="false" onblur="updateInvestField(${idx}, 'risk', parseFloat(this.innerText)||0)">${p.risk.toFixed(1)}%</td>
        <td class="text-center"><button class="btn-table-del" onclick="deleteInvestItem(${idx})"><i class="fa-solid fa-trash-can"></i></button></td>
      </tr>
    `).join('');
  }
}

window.addExpenseRow = function() {
  const name = `Chi tiêu mới ${AppState.expenses.length + 1}`;
  AppState.expenses.push(name);
  renderSetupTables();
  syncKeywordChangesToDependentSheets();
};

window.deleteExpenseItem = function(idx) {
  AppState.expenses.splice(idx, 1);
  renderSetupTables();
  syncKeywordChangesToDependentSheets();
};

window.updateExpenseItem = function(idx, val) {
  AppState.expenses[idx] = val.trim();
  syncKeywordChangesToDependentSheets();
};

window.addIncomeRow = function() {
  const name = `Nguồn thu mới ${AppState.incomeList.length + 1}`;
  AppState.incomeList.push(name);
  renderSetupTables();
  syncKeywordChangesToDependentSheets();
};

window.deleteIncomeItem = function(idx) {
  AppState.incomeList.splice(idx, 1);
  renderSetupTables();
  syncKeywordChangesToDependentSheets();
};

window.updateIncomeItem = function(idx, val) {
  AppState.incomeList[idx] = val.trim();
  syncKeywordChangesToDependentSheets();
};

window.addPlanRow = function() {
  AppState.planList.push(`Kế hoạch đào tạo ${AppState.planList.length + 1}`);
  renderSetupTables();
};

window.deletePlanListItem = function(idx) {
  AppState.planList.splice(idx, 1);
  renderSetupTables();
};

window.updatePlanListItem = function(idx, val) {
  AppState.planList[idx] = val.trim();
};

window.addInvestRow = function() {
  AppState.investProducts.push({ name: "Sản phẩm mới", returnRate: 10.0, risk: 8.0 });
  renderSetupTables();
  recalculateAll();
};

window.deleteInvestItem = function(idx) {
  AppState.investProducts.splice(idx, 1);
  renderSetupTables();
  recalculateAll();
};

window.updateInvestField = function(idx, field, val) {
  AppState.investProducts[idx][field] = val;
  recalculateAll();
};

function syncKeywordChangesToDependentSheets() {
  renderPlanTables();
  renderMonthView(AppState.currentMonth);
  recalculateAll();
}

// ==================== KẾ HOẠCH THU NHẬP & CHI TIÊU ====================
function renderPlanTables() {
  const tbInc = document.getElementById('tbody-plan-inc');
  if (tbInc) {
    tbInc.innerHTML = AppState.planIncome.map((p, idx) => `
      <tr>
        <td class="text-center">${idx + 1}</td>
        <td>
          <select class="select-inline-cell" onchange="updatePlanIncCat(${idx}, this.value)">
            ${AppState.incomeList.map(opt => `<option value="${opt}" ${opt === p.name ? 'selected' : ''}>${opt}</option>`).join('')}
          </select>
        </td>
        <td class="text-right cell-blue font-bold" contenteditable="true" spellcheck="false" onblur="updatePlanIncVal(${idx}, this.innerText)">${p.plan.toFixed(2)}</td>
        <td class="cell-blue" contenteditable="true" spellcheck="false" onblur="updatePlanIncField(${idx}, 'note', this.innerText)">${p.note || ''}</td>
        <td class="cell-blue" contenteditable="true" spellcheck="false" onblur="updatePlanIncField(${idx}, 'analysis', this.innerText)">${p.analysis || ''}</td>
        <td class="text-center"><button class="btn-table-del" onclick="deletePlanIncRow(${idx})"><i class="fa-solid fa-trash-can"></i></button></td>
      </tr>
    `).join('');
  }

  const tbExp = document.getElementById('tbody-plan-exp');
  if (tbExp) {
    tbExp.innerHTML = AppState.planExpense.map((p, idx) => `
      <tr>
        <td class="text-center">${idx + 1}</td>
        <td>
          <select class="select-inline-cell" onchange="updatePlanExpCat(${idx}, this.value)">
            ${AppState.expenses.map(opt => `<option value="${opt}" ${opt === p.name ? 'selected' : ''}>${opt}</option>`).join('')}
          </select>
        </td>
        <td class="text-right cell-blue font-bold" contenteditable="true" spellcheck="false" onblur="updatePlanExpVal(${idx}, this.innerText)">${p.plan.toFixed(2)}</td>
        <td class="cell-blue" contenteditable="true" spellcheck="false" onblur="updatePlanExpField(${idx}, 'note', this.innerText)">${p.note || ''}</td>
        <td class="cell-blue" contenteditable="true" spellcheck="false" onblur="updatePlanExpField(${idx}, 'analysis', this.innerText)">${p.analysis || ''}</td>
        <td class="text-center"><button class="btn-table-del" onclick="deletePlanExpRow(${idx})"><i class="fa-solid fa-trash-can"></i></button></td>
      </tr>
    `).join('');
  }

  updatePlanTotals();
}

window.addPlanIncomeDirect = function() {
  const firstCat = AppState.incomeList[0] || "Lương từ công ty";
  AppState.planIncome.push({ name: firstCat, plan: 10.0, note: "", analysis: "" });
  renderPlanTables();
  recalculateAll();
};

window.deletePlanIncRow = function(idx) {
  AppState.planIncome.splice(idx, 1);
  renderPlanTables();
  recalculateAll();
};

window.addPlanExpenseDirect = function() {
  const firstCat = AppState.expenses[0] || "Mua thực phẩm";
  AppState.planExpense.push({ name: firstCat, plan: 2.0, note: "", analysis: "" });
  renderPlanTables();
  recalculateAll();
};

window.deletePlanExpRow = function(idx) {
  AppState.planExpense.splice(idx, 1);
  renderPlanTables();
  recalculateAll();
};

window.updatePlanIncCat = function(idx, val) { AppState.planIncome[idx].name = val; recalculateAll(); };
window.updatePlanExpCat = function(idx, val) { AppState.planExpense[idx].name = val; recalculateAll(); };
window.updatePlanIncVal = function(idx, txt) { AppState.planIncome[idx].plan = parseFloat(txt.replace(/[^0-9.-]/g, '')) || 0; updatePlanTotals(); recalculateAll(); };
window.updatePlanExpVal = function(idx, txt) { AppState.planExpense[idx].plan = parseFloat(txt.replace(/[^0-9.-]/g, '')) || 0; updatePlanTotals(); recalculateAll(); };
window.updatePlanIncField = function(idx, fld, txt) { AppState.planIncome[idx][fld] = txt.trim(); };
window.updatePlanExpField = function(idx, fld, txt) { AppState.planExpense[idx][fld] = txt.trim(); };

function updatePlanTotals() {
  const sumInc = AppState.planIncome.reduce((s, p) => s + p.plan, 0);
  const sumExp = AppState.planExpense.reduce((s, p) => s + p.plan, 0);
  document.getElementById('plan-sum-inc-val').textContent = `${sumInc.toFixed(2)} tr`;
  document.getElementById('plan-sum-exp-val').textContent = `${sumExp.toFixed(2)} tr`;
}

// ==================== THEO DÕI THU CHI 12 THÁNG (CÓ CALENDAR TIME) ====================
function renderMonthView(m) {
  const mData = AppState.monthlyDetails[m] || { incomes: [], expenses: [], learningDetails: [] };

  // 1. Nhật ký thu nhập: Dropdown chọn từ Từ khóa & Calendar date
  const tbInc = document.getElementById('tbody-m-detail-income');
  if (tbInc) {
    tbInc.innerHTML = mData.incomes.map((inc, i) => `
      <tr>
        <td><input type="date" class="input-date-cell" value="${inc.date}" onchange="inc.date=this.value;"></td>
        <td>
          <select class="select-inline-cell" onchange="updateMonthIncCat(${m}, ${i}, this.value)">
            ${AppState.incomeList.map(opt => `<option value="${opt}" ${opt === inc.cat ? 'selected' : ''}>${opt}</option>`).join('')}
          </select>
        </td>
        <td class="cell-blue" contenteditable="true" spellcheck="false" onblur="inc.desc=this.innerText.trim();">${inc.desc || ''}</td>
        <td class="text-right cell-blue font-bold" contenteditable="true" spellcheck="false" onblur="updateMonthIncVal(${m}, ${i}, this.innerText)">${inc.val.toFixed(1)}</td>
        <td class="text-center"><button class="btn-table-del" onclick="deleteMonthIncomeRow(${m}, ${i})"><i class="fa-solid fa-trash-can"></i></button></td>
      </tr>
    `).join('');
  }

  // 2. Nhật ký chi tiêu: Dropdown chọn từ Từ khóa & Calendar date
  const tbExp = document.getElementById('tbody-m-detail-expense');
  if (tbExp) {
    tbExp.innerHTML = mData.expenses.map((exp, i) => `
      <tr>
        <td><input type="date" class="input-date-cell" value="${exp.date}" onchange="exp.date=this.value;"></td>
        <td>
          <select class="select-inline-cell" onchange="updateMonthExpCat(${m}, ${i}, this.value)">
            ${AppState.expenses.map(opt => `<option value="${opt}" ${opt === exp.cat ? 'selected' : ''}>${opt}</option>`).join('')}
          </select>
        </td>
        <td class="cell-blue" contenteditable="true" spellcheck="false" onblur="exp.desc=this.innerText.trim();">${exp.desc || ''}</td>
        <td class="text-right cell-blue font-bold" contenteditable="true" spellcheck="false" onblur="updateMonthExpVal(${m}, ${i}, this.innerText)">${exp.val.toFixed(1)}</td>
        <td class="text-center"><button class="btn-table-del" onclick="deleteMonthExpenseRow(${m}, ${i})"><i class="fa-solid fa-trash-can"></i></button></td>
      </tr>
    `).join('');
  }

  renderReconciliationTable(m);
  renderMonthLearningSection(m);
  renderMonthHorizontalBarChart();
}

function renderReconciliationTable(m) {
  const mData = AppState.monthlyDetails[m] || { incomes: [], expenses: [] };
  const actIncMap = {};
  mData.incomes.forEach(x => { actIncMap[x.cat] = (actIncMap[x.cat] || 0) + x.val; });

  const actExpMap = {};
  mData.expenses.forEach(x => { actExpMap[x.cat] = (actExpMap[x.cat] || 0) + x.val; });

  let sumPlanInc = 0, sumActInc = 0;
  let incRows = AppState.planIncome.map(p => {
    const act = actIncMap[p.name] || 0;
    const diff = act - p.plan;
    sumPlanInc += p.plan;
    sumActInc += act;
    const note = mData.reconIncomeNotes[p.name] || { reason: '', action: '' };
    return `
      <tr>
        <td>${p.name}</td>
        <td class="text-right">${p.plan.toFixed(1)}</td>
        <td class="text-right font-bold">${act.toFixed(1)}</td>
        <td class="text-right font-bold ${diff >= 0 ? 'text-green' : 'text-red'}">${diff === 0 ? '-' : (diff > 0 ? diff.toFixed(1) : `(${Math.abs(diff).toFixed(1)})`)}</td>
        <td class="cell-blue" contenteditable="true" spellcheck="false" onblur="updateReconNote(${m}, 'inc', '${p.name}', 'reason', this.innerText)">${note.reason || ''}</td>
        <td class="cell-blue" contenteditable="true" spellcheck="false" onblur="updateReconNote(${m}, 'inc', '${p.name}', 'action', this.innerText)">${note.action || ''}</td>
      </tr>
    `;
  }).join('');
  document.getElementById('tbody-m-recon-income').innerHTML = incRows;

  document.getElementById('tfoot-recon-inc-plan').textContent = sumPlanInc.toFixed(1);
  document.getElementById('tfoot-recon-inc-act').textContent = sumActInc.toFixed(1);
  const incDiffTot = sumActInc - sumPlanInc;
  document.getElementById('tfoot-recon-inc-diff').textContent = incDiffTot >= 0 ? incDiffTot.toFixed(1) : `(${Math.abs(incDiffTot).toFixed(1)})`;
  document.getElementById('tfoot-m-inc-total').textContent = sumActInc.toFixed(1);

  let sumPlanExp = 0, sumActExp = 0;
  let expRows = AppState.planExpense.map(p => {
    const act = actExpMap[p.name] || 0;
    const diff = p.plan - act;
    sumPlanExp += p.plan;
    sumActExp += act;
    const note = mData.reconExpenseNotes[p.name] || { reason: '', action: '' };
    return `
      <tr>
        <td>${p.name}</td>
        <td class="text-right">${p.plan.toFixed(1)}</td>
        <td class="text-right font-bold">${act.toFixed(1)}</td>
        <td class="text-right font-bold ${diff >= 0 ? 'text-green' : 'text-red'}">${diff === 0 ? '-' : (diff > 0 ? diff.toFixed(1) : `(${Math.abs(diff).toFixed(1)})`)}</td>
        <td class="cell-blue" contenteditable="true" spellcheck="false" onblur="updateReconNote(${m}, 'exp', '${p.name}', 'reason', this.innerText)">${note.reason || ''}</td>
        <td class="cell-blue" contenteditable="true" spellcheck="false" onblur="updateReconNote(${m}, 'exp', '${p.name}', 'action', this.innerText)">${note.action || ''}</td>
      </tr>
    `;
  }).join('');
  document.getElementById('tbody-m-recon-expense').innerHTML = expRows;

  document.getElementById('tfoot-recon-exp-plan').textContent = sumPlanExp.toFixed(1);
  document.getElementById('tfoot-recon-exp-act').textContent = sumActExp.toFixed(1);
  const expDiffTot = sumPlanExp - sumActExp;
  document.getElementById('tfoot-recon-exp-diff').textContent = expDiffTot >= 0 ? expDiffTot.toFixed(1) : `(${Math.abs(expDiffTot).toFixed(1)})`;
  document.getElementById('tfoot-m-exp-total').textContent = sumActExp.toFixed(1);

  const savings = sumActInc - sumActExp;
  document.getElementById('m-summary-income').textContent = Math.round(sumActInc);
  document.getElementById('m-summary-expense').textContent = Math.round(sumActExp);
  document.getElementById('m-summary-savings').textContent = Math.round(savings);
}

window.addMonthDetailIncomeRow = function() {
  const m = AppState.currentMonth;
  const mStr = m < 10 ? `0${m}` : `${m}`;
  const firstCat = AppState.incomeList[0] || "Lương từ công ty";
  AppState.monthlyDetails[m].incomes.push({ date: `2026-${mStr}-15`, cat: firstCat, desc: "Khoản thu mới", val: 5.0 });
  renderMonthView(m);
  recalculateAll();
};

window.deleteMonthIncomeRow = function(m, i) {
  AppState.monthlyDetails[m].incomes.splice(i, 1);
  renderMonthView(m);
  recalculateAll();
};

window.addMonthDetailExpenseRow = function() {
  const m = AppState.currentMonth;
  const mStr = m < 10 ? `0${m}` : `${m}`;
  const firstCat = AppState.expenses[0] || "Mua thực phẩm";
  AppState.monthlyDetails[m].expenses.push({ date: `2026-${mStr}-10`, cat: firstCat, desc: "Khoản chi mới", val: 1.0 });
  renderMonthView(m);
  recalculateAll();
};

window.deleteMonthExpenseRow = function(m, i) {
  AppState.monthlyDetails[m].expenses.splice(i, 1);
  renderMonthView(m);
  recalculateAll();
};

window.updateMonthIncCat = function(m, i, val) { AppState.monthlyDetails[m].incomes[i].cat = val; renderMonthView(m); recalculateAll(); };
window.updateMonthExpCat = function(m, i, val) { AppState.monthlyDetails[m].expenses[i].cat = val; renderMonthView(m); recalculateAll(); };
window.updateMonthIncVal = function(m, i, txt) { AppState.monthlyDetails[m].incomes[i].val = parseFloat(txt.replace(/[^0-9.-]/g, '')) || 0; renderMonthView(m); recalculateAll(); };
window.updateMonthExpVal = function(m, i, txt) { AppState.monthlyDetails[m].expenses[i].val = parseFloat(txt.replace(/[^0-9.-]/g, '')) || 0; renderMonthView(m); recalculateAll(); };

window.updateReconNote = function(m, type, cat, field, txt) {
  const dict = type === 'inc' ? AppState.monthlyDetails[m].reconIncomeNotes : AppState.monthlyDetails[m].reconExpenseNotes;
  if (!dict[cat]) dict[cat] = { reason: '', action: '' };
  dict[cat][field] = txt.trim();
};

// ==================== PHẦN 2 ĐÀO TẠO (ĐỒNG BỘ TỰ ĐỘNG TÍNH TOÁN) ====================
function renderMonthLearningSection(m) {
  const items = AppState.monthlyDetails[m]?.learningDetails || [];
  const tb = document.getElementById('tbody-m-learning-detail');
  if (tb) {
    tb.innerHTML = items.map((it, i) => `
      <tr>
        <td><input type="date" class="input-date-cell" value="${it.date}" onchange="it.date=this.value;"></td>
        <td>
          <select class="select-inline-cell" onchange="it.cat=this.value; renderMonthLearningSection(${m}); syncLearningToDashboard();">
            ${AppState.planList.map(opt => `<option value="${opt}" ${opt === it.cat ? 'selected' : ''}>${opt}</option>`).join('')}
          </select>
        </td>
        <td class="cell-blue" contenteditable="true" spellcheck="false" onblur="it.desc=this.innerText.trim()">${it.desc}</td>
        <td class="text-right cell-blue font-bold" contenteditable="true" spellcheck="false" onblur="it.val=parseFloat(this.innerText)||0; renderMonthLearningSection(${m}); syncLearningToDashboard();">${it.val.toFixed(2)}</td>
        <td class="cell-blue" contenteditable="true" spellcheck="false" onblur="it.expRes=this.innerText.trim()">${it.expRes}</td>
        <td class="cell-blue" contenteditable="true" spellcheck="false" onblur="it.actRes=this.innerText.trim()">${it.actRes}</td>
        <td class="text-center"><button class="btn-table-del" onclick="deleteMonthLearningRow(${m}, ${i})"><i class="fa-solid fa-trash-can"></i></button></td>
      </tr>
    `).join('');
  }

  // Tự động SUMIF ra bảng thống kê bên phải
  const catSums = {};
  items.forEach(x => { catSums[x.cat] = (catSums[x.cat] || 0) + x.val; });
  let tot = 0;
  document.getElementById('tbody-m-learning-stat').innerHTML = AppState.planList.map(name => {
    const val = catSums[name] || 0;
    tot += val;
    return `<tr><td>${name}</td><td class="text-right font-bold">${val.toFixed(2)}</td></tr>`;
  }).join('');

  document.getElementById('tfoot-m-learn-total').textContent = tot.toFixed(2);
  document.getElementById('tfoot-m-learn-stat-total').textContent = tot.toFixed(2);
}

window.addMonthLearningRow = function() {
  const m = AppState.currentMonth;
  const mStr = m < 10 ? `0${m}` : `${m}`;
  AppState.monthlyDetails[m].learningDetails.push({ date: `2026-${mStr}-10`, cat: AppState.planList[0], desc: "Khóa đào tạo mới", val: 1.0, expRes: "Nâng cao kỹ năng", actRes: "Áp dụng" });
  renderMonthLearningSection(m);
  syncLearningToDashboard();
};

window.deleteMonthLearningRow = function(m, i) {
  AppState.monthlyDetails[m].learningDetails.splice(i, 1);
  renderMonthLearningSection(m);
  syncLearningToDashboard();
};

function syncLearningToDashboard() {
  recalculateAll();
  renderDashboardMatrices();
  renderDashboardAllCharts();
}

let monthBarChartInstance = null;
function renderMonthHorizontalBarChart() {
  const canvas = document.getElementById('monthExpenseBarChart');
  if (!canvas || typeof Chart === 'undefined') return;

  const mData = AppState.monthlyDetails[AppState.currentMonth] || { expenses: [] };
  const catSums = {};
  mData.expenses.forEach(x => { catSums[x.cat] = (catSums[x.cat] || 0) + x.val; });

  const labels = AppState.planExpense.map(p => p.name).reverse();
  const data = labels.map(name => catSums[name] || 0);

  if (monthBarChartInstance) monthBarChartInstance.destroy();
  monthBarChartInstance = new Chart(canvas.getContext('2d'), {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{ label: "Chi thực tế", data: data, backgroundColor: "#f29b28", borderRadius: 3, barPercentage: 0.65 }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: ctx => ` ${ctx.parsed.x.toFixed(1)} tr` } }
      },
      scales: { x: { beginAtZero: true, grid: { color: "#f1f5f9" } }, y: { grid: { display: false } } }
    }
  });
}

// ==================== CÂN ĐỐI LỘ TRÌNH NGHỀ NGHIỆP ====================
let careerChartInstance = null;
function renderCareerTables() {
  const tb1 = document.getElementById('tbody-career-overview');
  if (tb1) {
    tb1.innerHTML = AppState.careerOverview.map((item) => `
      <tr>
        <td class="text-center font-bold">${item.age}</td>
        <td class="text-right cell-blue font-bold" contenteditable="true" onblur="item.incomeNeed=parseFloat(this.innerText)||0; renderCareerChart();">${item.incomeNeed.toFixed(1)}</td>
        <td class="text-right">${item.stocks.toFixed(1)}%</td>
        <td class="text-right">${item.bonds.toFixed(1)}%</td>
        <td class="text-right">${item.ins.toFixed(1)}%</td>
        <td class="text-right">${item.cash.toFixed(1)}%</td>
        <td class="text-right font-bold text-green">${item.returnNeed.toFixed(1)}%</td>
        <td class="cell-blue" contenteditable="true" onblur="item.skills=this.innerText.trim();">${item.skills}</td>
      </tr>
    `).join('');
  }

  const tb2 = document.getElementById('tbody-career-detail');
  if (tb2) {
    tb2.innerHTML = AppState.careerDetail.map((item) => {
      const targetVal = item.age === 24 ? item.actual : (item.age <= 30 ? 20.0 : (item.age <= 40 ? 30.0 : 40.0));
      return `
        <tr>
          <td class="text-center font-bold">${item.age}</td>
          <td class="text-right cell-blue font-bold" contenteditable="true" onblur="item.actual=parseFloat(this.innerText)||0; renderCareerChart();">${item.actual.toFixed(1)}</td>
          <td class="text-right font-bold text-gold">${targetVal.toFixed(1)}</td>
          <td class="text-right cell-blue font-bold" contenteditable="true" onblur="item.route=parseFloat(this.innerText)||0; renderCareerChart();">${item.route.toFixed(1)}</td>
        </tr>
      `;
    }).join('');
  }
}

function renderCareerChart() {
  const canvas = document.getElementById('careerChart');
  if (!canvas || typeof Chart === 'undefined') return;

  const ages = AppState.careerDetail.map(x => `${x.age} tuổi`);
  const actuals = AppState.careerDetail.map(x => x.actual);
  const targets = AppState.careerDetail.map(x => (x.age === 24 ? x.actual : (x.age <= 30 ? 20.0 : (x.age <= 40 ? 30.0 : 40.0))));
  const routes = AppState.careerDetail.map(x => x.route);

  if (careerChartInstance) careerChartInstance.destroy();
  careerChartInstance = new Chart(canvas.getContext('2d'), {
    type: 'line',
    data: {
      labels: ages,
      datasets: [
        {
          label: "Thu nhập thực tế",
          data: actuals,
          borderColor: "#dc2626",
          borderWidth: 2.2,
          borderDash: [5, 5],
          fill: false,
          tension: 0.2
        },
        {
          label: "Số tiền cần có để đạt mục tiêu tài chính",
          data: targets,
          borderColor: "#eab308",
          borderWidth: 2.5,
          fill: false,
          tension: 0.2
        },
        {
          label: "Thu nhập theo lộ trình nghề nghiệp",
          data: routes,
          borderColor: "#16a34a",
          borderWidth: 2.5,
          fill: false,
          tension: 0.2
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top', labels: { font: { family: 'Montserrat', size: 11, weight: 'bold' } } },
        tooltip: { callbacks: { label: ctx => ` ${ctx.dataset.label}: ${ctx.raw} tr` } }
      },
      scales: {
        y: { beginAtZero: true, grid: { color: "#f1f5f9" } },
        x: { grid: { display: false } }
      }
    }
  });
}

// ==================== BẢNG KHẢO SÁT CHUẨN XLSX CHẤM ĐIỂM ====================
function renderSurveyForm() {
  const p1 = document.getElementById('survey-list-part-1');
  if (p1) {
    p1.innerHTML = surveyQuestionsPart1.map((q, idx) => `
      <div class="survey-q-card">
        <div class="q-title"><span class="q-num">${idx + 1}</span> ${q.q}</div>
        <div class="q-options">
          ${q.opts.map((opt, optIdx) => `
            <label class="dotbox-label">
              <input type="radio" name="ks1_${idx + 1}" value="${q.weights[optIdx]}" ${optIdx === q.def ? 'checked' : ''} onchange="evaluateSurveys()">
              <span class="dot-custom"></span>${opt}
            </label>
          `).join('')}
        </div>
      </div>
    `).join('');
  }

  const p2 = document.getElementById('survey-list-part-2');
  if (p2) {
    p2.innerHTML = surveyQuestionsPart2.map((q, idx) => `
      <div class="survey-q-card">
        <div class="q-title"><span class="q-num">${idx + 1}</span> ${q.q}</div>
        <div class="q-options">
          ${q.opts.map((opt, optIdx) => `
            <label class="dotbox-label">
              <input type="radio" name="ks2_${idx + 1}" value="${q.weights[optIdx]}" ${optIdx === q.def ? 'checked' : ''} onchange="evaluateSurveys()">
              <span class="dot-custom"></span>${opt}
            </label>
          `).join('')}
        </div>
      </div>
    `).join('');
  }
}

function evaluateSurveys() {
  let s1 = 0;
  for (let i = 1; i <= surveyQuestionsPart1.length; i++) {
    const ch = document.querySelector(`input[name="ks1_${i}"]:checked`);
    if (ch) s1 += parseInt(ch.value, 10);
  }

  let rTxt = "";
  if (s1 <= 18) rTxt = "Bạn là người ngại rủi ro, bạn nên duy trì các tài sản rủi ro tại mức thấp";
  else if (s1 <= 29) rTxt = "Bạn là người trung lập với rủi ro, bạn nên duy trì các tài sản rủi ro tại mức trung bình";
  else rTxt = "Bạn là người chấp nhận rủi ro, bạn có thể gia tăng tỷ trọng các tài sản có mức độ rủi ro cao";

  const bar1 = document.getElementById('survey-result-bar-1');
  const risk1 = document.getElementById('survey-result-risk');
  if (bar1) bar1.textContent = `Kết quả khảo sát khả năng chịu đựng rủi ro: ${rTxt}`;
  if (risk1) risk1.textContent = `Kết quả khảo sát khả năng chịu đựng rủi ro: ${rTxt}`;

  let s2 = 0;
  for (let i = 1; i <= surveyQuestionsPart2.length; i++) {
    const ch = document.querySelector(`input[name="ks2_${i}"]:checked`);
    if (ch) s2 += parseInt(ch.value, 10);
  }

  let cTxt = "";
  if (s2 <= 20) cTxt = "Bạn trong điều kiện không thuận lợi để phát triển tài chính của bạn trong dài hạn";
  else if (s2 <= 29) cTxt = "Bạn trong điều kiện ít thuận lợi để phát triển tài chính của bạn trong dài hạn";
  else if (s2 <= 38) cTxt = "Bạn trong điều kiện bình thường để phát triển tài chính của bạn trong dài hạn";
  else if (s2 <= 42) cTxt = "Bạn trong điều kiện thuận lợi để phát triển tài chính của bạn trong dài hạn";
  else cTxt = "Bạn trong điều kiện cực kỳ thuận lợi để phát triển tài chính của bạn trong dài hạn";

  const bar2 = document.getElementById('survey-result-bar-2');
  const ctx2 = document.getElementById('survey-result-context');
  if (bar2) bar2.textContent = `Kết quả khảo sát hoàn cảnh: ${cTxt}`;
  if (ctx2) ctx2.textContent = `Kết quả khảo sát hoàn cảnh: ${cTxt}`;
}

// ==================== MỤC TIÊU TÀI CHÍNH ====================
function calculateMonthlyNeed(goal) {
  const nYears = Math.max(1, goal.end - goal.start + 1);
  const targetNeed = Math.max(0, goal.val - (goal.paid || 0));
  const rAnnual = (goal.rate || 8.0) / 100;
  const rMonthly = rAnnual / 12;
  const nMonths = nYears * 12;

  if (rMonthly === 0) return targetNeed / nMonths;
  let pmt = 0;
  if (goal.type === 'debt') {
    pmt = (targetNeed * rMonthly * Math.pow(1 + rMonthly, nMonths)) / (Math.pow(1 + rMonthly, nMonths) - 1);
  } else {
    pmt = (targetNeed * rMonthly) / (Math.pow(1 + rMonthly, nMonths) - 1);
  }
  return isNaN(pmt) || !isFinite(pmt) ? (targetNeed / nMonths) : pmt;
}

function renderTcGoalsFormTable() {
  const tb = document.getElementById('tbody-tc-form-goals');
  if (!tb) return;

  tb.innerHTML = AppState.tcGoals.map((g, idx) => `
    <tr>
      <td><input type="text" value="${g.name}" onchange="AppState.tcGoals[${idx}].name=this.value.trim();"></td>
      <td>
        <select onchange="AppState.tcGoals[${idx}].type=this.value;">
          <option value="debt" ${g.type === 'debt' ? 'selected' : ''}>Trả nợ</option>
          <option value="invest" ${g.type === 'invest' ? 'selected' : ''}>Đầu tư</option>
        </select>
      </td>
      <td><input type="number" step="any" value="${g.val}" onchange="AppState.tcGoals[${idx}].val=parseFloat(this.value)||0;"></td>
      <td><input type="number" step="any" value="${g.paid}" onchange="AppState.tcGoals[${idx}].paid=parseFloat(this.value)||0;"></td>
      <td><input type="number" value="${g.start}" onchange="AppState.tcGoals[${idx}].start=parseInt(this.value,10)||2026;"></td>
      <td><input type="number" value="${g.end}" onchange="AppState.tcGoals[${idx}].end=parseInt(this.value,10)||2030;"></td>
      <td><input type="number" step="any" value="${g.rate}" onchange="AppState.tcGoals[${idx}].rate=parseFloat(this.value)||0;"></td>
      <td class="text-right font-bold text-green">${(g.monthly || calculateMonthlyNeed(g)).toFixed(2)}</td>
      <td class="text-center"><button type="button" class="btn-table-del" onclick="deleteTcGoalRow(${idx})"><i class="fa-solid fa-trash-can"></i></button></td>
    </tr>
  `).join('');
}

window.addNewTcGoalRow = function() {
  AppState.tcGoals.push({ id: `g_${Date.now()}`, name: "Mục tiêu mới", type: "invest", val: 100.0, paid: 0.0, start: 2026, end: 2030, rate: 8.0, monthly: 1.5 });
  renderTcGoalsFormTable();
};

window.deleteTcGoalRow = function(idx) {
  AppState.tcGoals.splice(idx, 1);
  renderTcGoalsFormTable();
  const resArea = document.getElementById('tc-cards-result-area');
  if (resArea && resArea.style.display !== 'none') {
    syncGoalsToCards();
    renderTcMatrixTable();
  }
};

window.executeCalculateAndShowCards = function() {
  AppState.tcGoals.forEach(g => { g.monthly = calculateMonthlyNeed(g); });
  renderTcGoalsFormTable();
  syncGoalsToCards();

  const resArea = document.getElementById('tc-cards-result-area');
  if (resArea) {
    resArea.style.display = 'block';
    resArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  const btnSec2 = document.getElementById('btn-tc-sec2');
  if (btnSec2) btnSec2.style.display = 'inline-flex';

  renderTcMatrixTable();
};

function syncGoalsToCards() {
  const dWrap = document.getElementById('tc-debt-cards-container');
  const iWrap = document.getElementById('tc-invest-cards-container');

  const debts = AppState.tcGoals.filter(g => g.type === 'debt');
  const invests = AppState.tcGoals.filter(g => g.type === 'invest');

  if (dWrap) dWrap.innerHTML = debts.map((g, i) => createCardHtml(g, i + 1, "Mục tiêu trả nợ")).join('');
  if (iWrap) iWrap.innerHTML = invests.map((g, i) => createCardHtml(g, i + 1, "Mục tiêu tài chính")).join('');
}

function createCardHtml(g, num, label) {
  const nYears = Math.max(1, g.end - g.start + 1);
  const targetNeed = Math.max(0, g.val - (g.paid || 0));
  const mVal = g.monthly || calculateMonthlyNeed(g);
  const yVal = mVal * 12;

  return `
    <div class="tc-goal-card" id="card-${g.id}">
      <div class="tc-goal-card-header">
        <span>${label} ${num}: ${g.name}</span>
        <button class="btn-card-del" onclick="removeGoalFromCard('${g.id}')"><i class="fa-solid fa-trash-can"></i></button>
      </div>
      <div class="tc-card-table-wrap">
        <table class="tc-card-body-table">
          <tbody>
            <tr>
              <td>Năm bắt đầu</td>
              <td class="cell-import-green" contenteditable="true" onblur="g.start=parseInt(this.innerText,10)||2026; syncCardCalc('${g.id}');">${g.start}</td>
              <td class="col-summary-title">Tóm tắt kế hoạch</td>
              <td class="col-summary-title text-right">Khoản mục</td>
            </tr>
            <tr>
              <td>Năm kết thúc</td>
              <td class="cell-import-green" contenteditable="true" onblur="g.end=parseInt(this.innerText,10)||2030; syncCardCalc('${g.id}');">${g.end}</td>
              <td colspan="2" class="text-right italic-head">Thời hạn: ${nYears.toFixed(1)} năm</td>
            </tr>
            <tr>
              <td>Giá trị ${g.type === 'debt' ? 'khoản nợ' : 'mục tiêu'} (tr)</td>
              <td class="text-right font-bold cell-import-green" contenteditable="true" onblur="g.val=parseFloat(this.innerText)||0; syncCardCalc('${g.id}');">${g.val.toFixed(1)}</td>
              <td>Thời gian còn lại (năm)</td>
              <td class="text-right font-bold">${nYears.toFixed(1)}</td>
            </tr>
            <tr>
              <td>Lãi suất / Lợi nhuận</td>
              <td class="cell-import-green" contenteditable="true" onblur="g.rate=parseFloat(this.innerText)||0; syncCardCalc('${g.id}');">${g.rate.toFixed(1)}%</td>
              <td>Số tiền cần hàng tháng (tr)</td>
              <td class="cell-calc-highlight font-bold">${mVal.toFixed(1)}</td>
            </tr>
            <tr>
              <td>Số tiền ${g.type === 'debt' ? 'đã thanh toán trước đó' : 'đã tích lũy hiện có'}</td>
              <td class="cell-import-green" contenteditable="true" onblur="g.paid=parseFloat(this.innerText)||0; syncCardCalc('${g.id}');">${g.paid.toFixed(1)}</td>
              <td>Số tiền cần hàng năm (tr)</td>
              <td class="cell-calc-highlight font-bold">${yVal.toFixed(1)}</td>
            </tr>
            <tr>
              <td class="font-bold">Mục tiêu hiện tại cần đạt</td>
              <td class="text-right font-bold text-red">${targetNeed.toFixed(1)}</td>
              <td colspan="2"></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `;
}

window.syncCardCalc = function(id) {
  const g = AppState.tcGoals.find(x => x.id === id);
  if (g) {
    g.monthly = calculateMonthlyNeed(g);
    syncGoalsToCards();
    renderTcGoalsFormTable();
    renderTcMatrixTable();
  }
};

window.removeGoalFromCard = function(id) {
  AppState.tcGoals = AppState.tcGoals.filter(x => x.id !== id);
  syncGoalsToCards();
  renderTcGoalsFormTable();
  renderTcMatrixTable();
};

// ==================== MA TRẬN 33 NĂM PHẢN HỒI THỜI GIAN THỰC ====================
function renderTcMatrixTable() {
  const thead = document.getElementById('tr-tc-matrix-head');
  const tbody = document.getElementById('tbody-tc-matrix');
  if (!thead || !tbody) return;

  const debts = AppState.tcGoals.filter(g => g.type === 'debt');
  const invests = AppState.tcGoals.filter(g => g.type === 'invest');
  const all = [...debts, ...invests];

  thead.innerHTML = `
    <th style="min-width: 55px;">Năm</th>
    <th style="min-width: 55px;">Tuổi</th>
    ${debts.map((g, i) => `<th style="min-width: 105px;">Trả nợ ${i + 1}:<br><span style="font-weight: 500;">${g.name}</span></th>`).join('')}
    ${invests.map((g, i) => `<th style="min-width: 105px;">Đầu tư ${i + 1}:<br><span style="font-weight: 500;">${g.name}</span></th>`).join('')}
    <th style="min-width: 85px;" class="col-highlight-gold">Tiết kiệm cần</th>
    <th style="min-width: 85px;" class="col-highlight-orange">Thu nhập cần</th>
  `;

  const startY = AppState.currentYear;
  const startA = AppState.currentAge;
  const rate = 0.40;

  let rows = '';
  for (let y = 0; y <= 32; y++) {
    const yr = startY + y;
    const age = startA + y;
    let sSum = 0;

    const cells = all.map(g => {
      const active = yr >= g.start && yr <= g.end;
      const val = active ? (g.monthly || calculateMonthlyNeed(g)) : 0;
      if (val > 0) sSum += val;
      return `
        <td class="cell-matrix-editable ${val > 0 ? 'cell-active-goal' : ''}" 
            contenteditable="true" spellcheck="false" 
            oninput="onMatrixInput(this, ${y})" 
            onblur="onMatrixBlur(this, ${y})">
          ${val > 0 ? val.toFixed(1) : ''}
        </td>
      `;
    }).join('');

    const incNeed = sSum > 0 ? (sSum / rate) : 0;
    rows += `
      <tr id="mtr-row-${y}">
        <td class="text-center font-bold bg-neutral-gray">${yr}</td>
        <td class="text-center font-bold bg-neutral-gray">${age}</td>
        ${cells}
        <td class="text-right val-gold cell-readonly" id="mtr-sav-${y}">${sSum > 0 ? sSum.toFixed(1) : '-'}</td>
        <td class="text-right val-orange cell-readonly" id="mtr-inc-${y}">${incNeed > 0 ? incNeed.toFixed(1) : '-'}</td>
      </tr>
    `;
  }
  tbody.innerHTML = rows;
  renderTcMatrixChart();
}

window.onMatrixInput = function(td, rIdx) {
  const row = document.getElementById(`mtr-row-${rIdx}`);
  if (!row) return;

  let rSum = 0;
  row.querySelectorAll('.cell-matrix-editable').forEach(c => {
    const v = parseFloat(c.innerText.trim().replace(/[^0-9.-]/g, '')) || 0;
    if (v > 0) {
      rSum += v;
      c.classList.add('cell-active-goal');
    } else {
      c.classList.remove('cell-active-goal');
    }
  });

  const inc = rSum > 0 ? (rSum / 0.40) : 0;
  document.getElementById(`mtr-sav-${rIdx}`).textContent = rSum > 0 ? rSum.toFixed(1) : '-';
  document.getElementById(`mtr-inc-${rIdx}`).textContent = inc > 0 ? inc.toFixed(1) : '-';
  updateMatrixChartFromCells();
};

window.onMatrixBlur = function(td, rIdx) {
  const v = parseFloat(td.innerText.trim().replace(/[^0-9.-]/g, ''));
  td.textContent = (!isNaN(v) && v > 0) ? v.toFixed(1) : '';
  window.onMatrixInput(td, rIdx);
};

let tcMatrixChartInstance = null;
function renderTcMatrixChart() {
  const canvas = document.getElementById('tcMatrixChart');
  if (!canvas || typeof Chart === 'undefined') return;

  const labels = [];
  const savData = [];
  const incData = [];

  for (let y = 0; y <= 32; y++) {
    const yr = AppState.currentYear + y;
    const age = AppState.currentAge + y;
    labels.push(`${age} tuổi (${yr})`);

    const sVal = parseFloat(document.getElementById(`mtr-sav-${y}`)?.innerText.replace(/[^0-9.-]/g, '')) || 0;
    const iVal = parseFloat(document.getElementById(`mtr-inc-${y}`)?.innerText.replace(/[^0-9.-]/g, '')) || 0;
    savData.push(sVal);
    incData.push(iVal);
  }

  if (tcMatrixChartInstance) tcMatrixChartInstance.destroy();
  tcMatrixChartInstance = new Chart(canvas.getContext('2d'), {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        { label: "Thu nhập cần có (tr/tháng)", data: incData, borderColor: "#ea580c", backgroundColor: "rgba(234, 88, 12, 0.1)", borderWidth: 2.2, fill: true, tension: 0.2 },
        { label: "Tiết kiệm cần có (tr/tháng)", data: savData, borderColor: "#f59e0b", backgroundColor: "rgba(245, 158, 11, 0.15)", borderWidth: 2, fill: true, tension: 0.2 }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: { y: { beginAtZero: true, grid: { color: "#f1f5f9" } }, x: { grid: { display: false } } }
    }
  });
}

function updateMatrixChartFromCells() {
  if (!tcMatrixChartInstance) return;
  const sData = [], iData = [];
  for (let y = 0; y <= 32; y++) {
    sData.push(parseFloat(document.getElementById(`mtr-sav-${y}`)?.innerText.replace(/[^0-9.-]/g, '')) || 0);
    iData.push(parseFloat(document.getElementById(`mtr-inc-${y}`)?.innerText.replace(/[^0-9.-]/g, '')) || 0);
  }
  tcMatrixChartInstance.data.datasets[0].data = iData;
  tcMatrixChartInstance.data.datasets[1].data = sData;
  tcMatrixChartInstance.update();
}

// ==================== MỤC TIÊU BẢN THÂN (CÁC NÚT THÊM HOẠT ĐỘNG HOÀN TOÀN) ====================
function renderTargetTables() {
  const tbDebt = document.getElementById('tbody-debt-target');
  if (tbDebt) {
    tbDebt.innerHTML = AppState.debtTargets.map((d, i) => `
      <tr>
        <td class="cell-green-light text-center font-bold">${i + 1}</td>
        <td class="cell-green-light text-center cell-blue" contenteditable="true" spellcheck="false" onblur="d.age=parseInt(this.innerText,10)||0;">${d.age}</td>
        <td class="cell-green-light cell-blue" contenteditable="true" spellcheck="false" onblur="d.desc=this.innerText.trim();">${d.desc}</td>
        <td class="cell-green-light text-right cell-blue font-bold" contenteditable="true" spellcheck="false" onblur="d.val=parseFloat(this.innerText.replace(/,/g,''))||0; recalculateAll();">${d.val.toFixed(2)}</td>
        <td class="text-center"><button class="btn-table-del" onclick="deleteDebtTargetRow(${i})"><i class="fa-solid fa-trash-can"></i></button></td>
      </tr>
    `).join('');
  }

  const tbInv = document.getElementById('tbody-invest-target');
  if (tbInv) {
    tbInv.innerHTML = AppState.investTargets.map((inv, i) => `
      <tr>
        <td class="cell-green-light text-center font-bold">${i + 1}</td>
        <td class="cell-green-light text-center cell-blue" contenteditable="true" spellcheck="false" onblur="inv.age=parseInt(this.innerText,10)||0;">${inv.age}</td>
        <td class="cell-green-light cell-blue" contenteditable="true" spellcheck="false" onblur="inv.desc=this.innerText.trim();">${inv.desc}</td>
        <td class="cell-green-light text-right cell-blue font-bold" contenteditable="true" spellcheck="false" onblur="inv.val=parseFloat(this.innerText.replace(/,/g,''))||0; recalculateAll();">${inv.val.toLocaleString()}</td>
        <td class="text-center"><button class="btn-table-del" onclick="deleteInvestTargetRow(${i})"><i class="fa-solid fa-trash-can"></i></button></td>
      </tr>
    `).join('');
  }

  renderSkillsFamilyJob();
}

window.addDebtTargetRow = function() {
  AppState.debtTargets.push({ age: 35, desc: "Khoản nợ mới", val: 100.0 });
  renderTargetTables();
  recalculateAll();
};
window.deleteDebtTargetRow = function(i) {
  AppState.debtTargets.splice(i, 1);
  renderTargetTables();
  recalculateAll();
};

window.addInvestTargetRow = function() {
  AppState.investTargets.push({ age: 40, desc: "Mục tiêu tích lũy mới", val: 200.0 });
  renderTargetTables();
  recalculateAll();
};
window.deleteInvestTargetRow = function(i) {
  AppState.investTargets.splice(i, 1);
  renderTargetTables();
  recalculateAll();
};

function renderSkillsFamilyJob() {
  const tbS = document.getElementById('tbody-skills');
  if (tbS) {
    tbS.innerHTML = AppState.skillsList.map((s, i) => `
      <tr>
        <td class="cell-green-light cell-blue font-medium" contenteditable="true" spellcheck="false" onblur="AppState.skillsList[${i}]=this.innerText.trim();">${s}</td>
        <td class="text-center"><button class="btn-table-del" onclick="AppState.skillsList.splice(${i},1); renderSkillsFamilyJob();"><i class="fa-solid fa-trash-can"></i></button></td>
      </tr>
    `).join('');
  }

  const tbF = document.getElementById('tbody-family');
  if (tbF) {
    tbF.innerHTML = AppState.familyList.map((f, i) => `
      <tr>
        <td class="cell-green-light cell-blue font-medium" contenteditable="true" spellcheck="false" onblur="AppState.familyList[${i}]=this.innerText.trim();">${f}</td>
        <td class="text-center"><button class="btn-table-del" onclick="AppState.familyList.splice(${i},1); renderSkillsFamilyJob();"><i class="fa-solid fa-trash-can"></i></button></td>
      </tr>
    `).join('');
  }

  const tbJ = document.getElementById('tbody-job');
  if (tbJ) {
    tbJ.innerHTML = AppState.jobList.map((j, i) => `
      <tr>
        <td class="cell-green-light cell-blue font-medium" contenteditable="true" spellcheck="false" onblur="AppState.jobList[${i}]=this.innerText.trim();">${j}</td>
        <td class="text-center"><button class="btn-table-del" onclick="AppState.jobList.splice(${i},1); renderSkillsFamilyJob();"><i class="fa-solid fa-trash-can"></i></button></td>
      </tr>
    `).join('');
  }
}

window.addSkillRow = function() {
  AppState.skillsList.push("Kỹ năng mới");
  renderSkillsFamilyJob();
};
window.addFamilyRow = function() {
  AppState.familyList.push("Hỗ trợ gia đình mới");
  renderSkillsFamilyJob();
};
window.addJobRow = function() {
  AppState.jobList.push("Môi trường làm việc mới");
  renderSkillsFamilyJob();
};

// ==================== KHỞI CHẠY HỆ THỐNG ====================
function recalculateAll() {
  let totalIncYear = 0, totalExpYear = 0;
  for (let m = 1; m <= 12; m++) {
    totalIncYear += AppState.monthlyDetails[m]?.incomes.reduce((s, x) => s + x.val, 0) || 0;
    totalExpYear += AppState.monthlyDetails[m]?.expenses.reduce((s, x) => s + x.val, 0) || 0;
  }
  const yearSav = totalIncYear - totalExpYear;

  const kpiInc = document.getElementById('kpi-dash-income');
  const kpiExp = document.getElementById('kpi-dash-expense');
  const kpiSav = document.getElementById('kpi-dash-savings');

  if (kpiInc) kpiInc.textContent = Math.round(totalIncYear);
  if (kpiExp) kpiExp.textContent = Math.round(totalExpYear);
  if (kpiSav) kpiSav.textContent = Math.round(yearSav);

  renderDashboardMatrices();
  updatePlanTotals();
}

document.addEventListener('DOMContentLoaded', () => {
  renderSetupTables();
  renderPlanTables();
  renderTargetTables();
  renderSurveyForm();
  evaluateSurveys();
  renderCareerTables();
  renderTcGoalsFormTable();
  renderMonthView(AppState.currentMonth);
  recalculateAll();

  // Đồng bộ thay đổi năm & tuổi
  const yEl = document.getElementById('input-year');
  const aEl = document.getElementById('input-age');
  if (yEl) {
    yEl.addEventListener('input', () => {
      const v = parseInt(yEl.innerText.trim(), 10);
      if (!isNaN(v) && v > 1900 && v < 2100) {
        AppState.currentYear = v;
        AppState.currentAge = AppState.currentYear - AppState.birthYear;
        if (aEl) aEl.innerText = AppState.currentAge;
        document.querySelectorAll('.dynamic-year').forEach(el => el.textContent = v);
        recalculateAll();
      }
    });
  }
  if (aEl) {
    aEl.addEventListener('input', () => {
      const v = parseInt(aEl.innerText.trim(), 10);
      if (!isNaN(v) && v > 0 && v < 120) {
        AppState.currentAge = v;
        AppState.birthYear = AppState.currentYear - v;
        recalculateAll();
      }
    });
  }
});
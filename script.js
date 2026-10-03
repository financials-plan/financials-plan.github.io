/**
 * HỆ THỐNG QUẢN LÝ TÀI CHÍNH CÁ NHÂN CHUYÊN SÂU
 * Reactive Data Flow, Financial Models, Dynamic Age Sync & Multi-Chart Engine
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

  // Cấu trúc 4 trường theo đúng yêu cầu: order, age (thời điểm), desc (nội dung), action/val
  debtTargets: [
    { age: 35, desc: "Vay mua chung cư", val: 500.0 }
  ],
  investTargets: [
    { age: 25, desc: "Du lịch xuyên Thái Lan", pv: 50.0, inflation: 4.0, expectedReturn: 8.0 },
    { age: 26, desc: "Quỹ dự phòng tài chính", pv: 100.0, inflation: 4.0, expectedReturn: 7.0 },
    { age: 28, desc: "Đám cưới", pv: 200.0, inflation: 4.5, expectedReturn: 9.0 },
    { age: 30, desc: "Khởi nghiệp", pv: 500.0, inflation: 4.0, expectedReturn: 12.0 },
    { age: 38, desc: "Mua chung cư", pv: 1500.0, inflation: 4.5, expectedReturn: 11.0 },
    { age: 46, desc: "Cho con đi học đại học", pv: 500.0, inflation: 5.0, expectedReturn: 10.0 },
    { age: 50, desc: "Hưu trí", pv: 800.0, inflation: 4.0, expectedReturn: 9.0 }
  ],

  skillsList: ["Sẵn sàng học hỏi cái mới", "Nhiệt huyết trong công việc", "Ngoại ngữ chuyên ngành vững"],
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
    { id: "g1", name: "Vay mua chung cư", type: "debt", val: 500.0, paid: 50.0, start: 2026, end: 2035, rate: 8.5, monthly: 6.2, yearsRetire: 0, monthlyRetire: 0, deathFund: 0, allocProducts: [] },
    { id: "g2", name: "Du lịch xuyên Thái Lan", type: "invest", val: 50.0, paid: 10.0, start: 2026, end: 2027, rate: 8.0, monthly: 3.3, yearsRetire: 0, monthlyRetire: 0, deathFund: 0, allocProducts: [] },
    { id: "g3", name: "Quỹ dự phòng tài chính", type: "invest", val: 100.0, paid: 20.0, start: 2026, end: 2028, rate: 7.0, monthly: 3.5, yearsRetire: 0, monthlyRetire: 0, deathFund: 0, allocProducts: [] },
    { 
      id: "g4", name: "Cho con đi học đại học", type: "invest", val: 500.0, paid: 0.0, start: 2030, end: 2046, rate: 10.0, monthly: 1.4,
      yearsRetire: 10, monthlyRetire: 5.0, deathFund: 100.0,
      allocProducts: [
        { prodName: "ETF - ETFVFM", weight: 50.0, returnRate: 13.0, risk: 18.0 },
        { prodName: "DCBC", weight: 50.0, returnRate: 16.0, risk: 20.0 },
        { prodName: "Tiền gửi ngân hàng", weight: 0.0, returnRate: 5.0, risk: 2.0 }
      ]
    },
    { 
      id: "g5", name: "Hưu trí", type: "invest", val: 800.0, paid: 50.0, start: 2028, end: 2050, rate: 9.0, monthly: 1.8,
      yearsRetire: 25, monthlyRetire: 12.0, deathFund: 300.0,
      allocProducts: [
        { prodName: "ETF - ETFFINLEAD", weight: 40.0, returnRate: 15.0, risk: 20.0 },
        { prodName: "Trái phiếu Techcombank", weight: 40.0, returnRate: 10.5, risk: 6.0 },
        { prodName: "Tiền gửi ngân hàng", weight: 20.0, returnRate: 5.0, risk: 2.0 }
      ]
    }
  ],

  skillsStore: {
    0: "Kỹ năng làm việc nhóm, chuyên môn marketing",
    1: "Kỹ năng leader, quản trị dự án, xây dựng mô hình",
    2: "Kỹ năng lãnh đạo chiến lược, mở rộng quan hệ đối tác",
    3: "Kỹ năng quản lý doanh nghiệp, hoạch định ngân sách lớn",
    4: "Kỹ năng tạo lập cộng đồng, tái cấu trúc tài sản",
    5: "Kỹ năng chuyển giao thế hệ, quản trị danh mục bảo toàn"
  },

  careerDetailList: [],
  monthlyDetails: {},

  // Trạng thái lựa chọn khảo sát Google Form
  surveyP1Choices: { 1: 4, 2: 4, 3: 2, 4: 2, 5: 1, 6: 1, 7: 2, 8: 1, 9: 0, 10: 1 },
  surveyP2Choices: { 1: 2, 2: 2, 3: 0, 4: 4, 5: 2, 6: 4, 7: 3, 8: 3, 9: 0, 10: 1, 11: 2 }
};

// Khởi tạo dữ liệu 12 tháng
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
      { date: `2026-${mStr}-15`, cat: "Chi tiền điện, nước, internet, điện thoại, xăng xe", desc: "Hóa đơn", val: 1.8 },
      { date: `2026-${mStr}-20`, cat: "Chi tiền phát triển bản thân", desc: "Sách & khóa đào tạo", val: 1.2 }
    ],
    reconIncomeNotes: {},
    reconExpenseNotes: {},
    learningDetails: [
      { date: `2026-${mStr}-05`, cat: "Khóa học ngắn hạn", desc: "Sách tài chính & chuyên ngành", val: 0.4, expRes: "Bổ sung kiến thức", actRes: "Ứng dụng thực tế" },
      { date: `2026-${mStr}-18`, cat: "Khóa học dài hạn", desc: "Khóa đào tạo kỹ năng", val: 0.8, expRes: "Nâng cao năng lực", actRes: "Hoàn thành chứng chỉ" }
    ]
  };
}

// Bảng câu hỏi khảo sát 1 (10 câu)
const surveyQuestionsPart1 = [
  { q: "Bạn có bao nhiêu mục tiêu tài chính?", opts: ["1", "2", "3", "4", ">4"], weights: [1, 2, 3, 4, 5] },
  { q: "Bạn có cần thu nhập hàng tháng từ danh mục đầu tư không?", opts: ["Không", "Dưới 2%", "Lớn hơn 2%, nhưng nhỏ hơn 4%", "Lớn hơn 4%, nhưng nhỏ hơn 6%", "Lớn hơn 6%"], weights: [1, 2, 3, 4, 5] },
  { q: "Sau bao lâu thì bạn sẽ bắt đầu muốn rút tiền từ danh mục đầu tư của mình để phục vụ cho mục đích?", opts: ["Hơn 20 năm", "11–20 năm", "6–10 năm", "1–5 năm", "Ngay lập tức"], weights: [1, 2, 3, 4, 5] },
  { q: "Hãy mô tả quan điểm của bạn đối với vấn đề mức sinh lời và rủi ro từ việc đầu tư?", opts: ["Vấn đề bạn quan tâm nhất là hạn chế rủi ro. Bạn sẵn sàng chấp nhận mức sinh lời thấp để hạn chế tối đa rủi ro thua lỗ", "Bạn sẵn sàng chấp nhận khả năng rủi ro đầu tư để đạt mức sinh lời vừa phải", "Bạn chủ yếu quan tâm đến việc tối đa hóa mức sinh lời để có thể đạt được mục tiêu như kế hoạch", "Bạn sẵn sàng chấp nhận rủi ro cao để sớm đạt được mục tiêu tài chính của mình"], weights: [1, 2, 3, 4] },
  { q: "Biểu đồ bên dưới cho thấy mức sinh lời trung bình của ba danh mục đầu tư trong thời gian 20 năm. Danh mục nào theo bạn là phù hợp với bạn nhất?", hasCharts: true, opts: ["Danh mục đầu tư X", "Danh mục đầu tư Y", "Danh mục đầu tư Z"], weights: [1, 2, 3] },
  { q: "Rủi ro danh mục đầu tư bị giảm giá trị thường là mối quan tâm hàng đầu của các nhà đầu tư. Bảng sau mô tả bốn danh mục đầu tư với giá trị dự kiến và khả năng lỗ tiềm năng. Hãy cho biết bạn cảm thấy thoải mái khi lựa chọn danh mục nào nhất?", hasTable: true, opts: ["Danh mục đầu tư A", "Danh mục đầu tư B", "Danh mục đầu tư C", "Danh mục đầu tư D"], weights: [1, 2, 3, 4] },
  { q: "Lạm phát có thể làm sụt giảm mức sinh lời thực tế từ danh mục đầu tư theo thời gian. Thông tin nào sau đây thể hiện quan điểm của bạn về nỗi lo lạm phát?", opts: ["Bạn muốn giảm thiểu những biến động trong ngắn hạn cho danh mục đầu tư của mình càng nhiều càng tốt, việc cao hơn mức lạm phát hàng năm đáng kể không quá quan trọng", "Muốn một danh mục đầu tư cao hơn mức lạm phát vừa phải và sẵn sàng chấp nhận mức sụt giảm vừa phải trong ngắn hạn để đạt được mục tiêu này", "Mức sinh lời của danh mục có thể vượt xa mức lạm phát trong dài hạn và bạn sẵn sàng chấp nhận những mức sụt giảm có thể trong ngắn hạn để đạt được mục tiêu này"], weights: [1, 2, 3] },
  { q: "Việc đầu tư đôi khi phải đối mặt với những khoản lỗ. Bạn nghĩ gì về những giai đoạn có những khoản lỗ cho danh mục của mình?", opts: ["Bạn sẽ bán các khoản đầu tư ngay lập tức nếu mức giảm đáng kể xảy ra", "Mặc dù việc sụt giảm khiến bạn không thoải mái nhưng bạn sẵn sàng chờ đợi giai đoạn phục hồi phía sau", "Bạn chịu được việc danh mục sụt giảm và hoàn toàn có thể duy trì trạng thái đầu tư của danh mục trong một năm", "Cho dù danh mục đầu tư của bạn có sụt giảm trong vài năm tuy nhiên bạn đủ nhận thức để kiên định với mục tiêu dài hạn ban đầu"], weights: [1, 2, 3, 4] },
  { q: "Giá trị đầu tư tài sản hiện tại của bạn là?", opts: ["Dưới 200 triệu đồng", "200 triệu – 500 triệu đồng", "500 triệu đến 1 tỷ đồng", "Từ 1-2 tỷ đồng", "Hơn 2 tỷ đồng"], weights: [1, 2, 3, 4, 5] },
  { q: "Tỷ lệ tiết kiệm của bạn hàng tháng sau khi trừ các chi phí?", opts: ["Dưới 10%", "10-20%", "20-30%", "30-50%", ">50%"], weights: [1, 2, 3, 4, 5] }
];

// Bảng câu hỏi khảo sát 2 (11 câu)
const surveyQuestionsPart2 = [
  { q: "Tỷ lệ trích thu nhập hàng tháng của bạn để gửi về cho gia đình?", opts: [">30%", "20-30%", "10-20%", "0-10%", "0%"], weights: [1, 2, 3, 4, 5] },
  { q: "Mức thu nhập của vợ/chồng của bạn so với bạn?", opts: ["<50%", "50-70%", "70-100%", "100-150%", "150-300%"], weights: [1, 2, 3, 4, 5] },
  { q: "Tần suất bạn quan tâm đến mạng xã hội mỗi ngày?", opts: ["3-4 giờ", "2-3 giờ", "1-2 giờ", "30 phút - 60 phút", "<30 phút"], weights: [1, 2, 3, 4, 5] },
  { q: "Số lượng bạn bè của bạn trên Facebook?", opts: ["<100", "100-200", "200-400", "400-800", ">800"], weights: [1, 2, 3, 4, 5] },
  { q: "Bạn xây dựng như thế nào về kế hoạch đầu mỗi năm?", opts: ["Chưa bao giờ", "Hiếm khi", "Tùy hứng", "Thường xuyên", "Hầu như năm nào cũng lập"], weights: [1, 2, 3, 4, 5] },
  { q: "Bạn có bao nhiêu em nhỏ trong gia đình còn đi học?", opts: ["4", "3", "2", "1", "0"], weights: [1, 2, 3, 4, 5] },
  { q: "Bạn nghĩ gì về việc tích lũy một lượng tài sản nhất định để lại cho con cái?", opts: ["Chỉ hỗ trợ con cái chi phí giáo dục", "Trang bị các phương tiện cơ bản", "Để lại các tài sản lớn cho con cái", "Tích lũy nhiều nhất có thể"], weights: [2, 3, 4, 5] },
  { q: "Bạn đánh giá sức khỏe của mình như thế nào so với bạn bè và những người khác?", opts: ["Kém hơn rất nhiều", "Kém hơn", "Bằng mức trung bình", "Tốt hơn", "Tốt hơn rất nhiều"], weights: [1, 2, 3, 4, 5] },
  { q: "Mô tả tình hình tài chính của bạn khi còn đi học?", opts: ["Phụ thuộc hoàn toàn vào gia đình", "Gia đình hỗ trợ học phí và vẫn phải đi làm thêm", "Tự đi làm thêm để lo cho mình"], weights: [2, 3, 4] },
  { q: "Bạn đánh giá như thế nào trong mức chênh lệch thu nhập của những người làm trong công ty của mình?", opts: ["Không đáng kể", "Chênh lệch vừa phải", "Tương đối lớn", "Rất lớn"], weights: [1, 2, 3, 4] },
  { q: "Mức tăng thu nhập trung bình hàng năm của bạn trong 3 năm gần nhất?", opts: ["Gần như không tăng", "<5%", "5-10%", "10-20%", "20-30%", ">30%"], weights: [1, 2, 3, 4, 5, 6] }
];

// Lấy danh sách toàn bộ mục tiêu từ Mục tiêu bản thân để nạp vào Selection Box của Mục tiêu tài chính
function getAllPersonalGoalTitles() {
  const list = [];
  AppState.debtTargets.forEach(d => {
    if (d.desc && d.desc.trim()) list.push(d.desc.trim());
  });
  AppState.investTargets.forEach(inv => {
    if (inv.desc && inv.desc.trim()) list.push(inv.desc.trim());
  });
  return Array.from(new Set(list));
}

// ==================== CÁC HÀM TÍNH TOÁN ĐỒNG BỘ ====================
function getMatrixIncomeNeed(yearOffset) {
  let sSum = 0;
  const yr = AppState.currentYear + yearOffset;
  AppState.tcGoals.forEach(g => {
    if (yr >= g.start && yr <= g.end) {
      sSum += (g.monthly || calculateMonthlyNeed(g));
    }
  });
  return sSum > 0 ? (sSum / 0.40) : 0;
}

function calculateAgeMilestones() {
  const baseAge = AppState.currentAge;
  const offsets = [0, 5, 9, 14, 19, 29];
  return offsets.map((off, idx) => {
    const age = baseAge + off;
    const year = AppState.currentYear + off;
    const yrIndex = Math.min(32, off);
    const incNeedFromMatrix = getMatrixIncomeNeed(yrIndex);

    const stocks = Math.max(15, Math.min(75, 100 - age + 5));
    const bonds = Math.min(60, Math.max(15, age * 0.9));
    const ins = age >= 35 ? 10.0 : 7.0;
    const cash = Math.max(5, 100 - (stocks + bonds + ins));
    const returnNeed = ((stocks * 13.5 + bonds * 9.5 + ins * 4.5 + cash * 5.0) / 100);

    return {
      age,
      year,
      incomeNeed: incNeedFromMatrix > 0 ? incNeedFromMatrix : (idx === 0 ? 15.0 : (idx === 1 ? 32.0 : 45.0 + off)),
      stocks,
      bonds,
      ins,
      cash,
      returnNeed,
      skills: AppState.skillsStore[idx] || "Kỹ năng làm việc nhóm, chuyên môn marketing"
    };
  });
}

// YÊU CẦU 3: THU NHẬP THỰC TẾ CHỈ TÍNH TỚI THỜI ĐIỂM HIỆN TẠI (2026 - TUỔI HIỆN TẠI), CÁC NĂM SAU ĐỂ TRỐNG
function calculateCareerDetails() {
  const baseAge = AppState.currentAge;
  const ages = [
    baseAge,
    baseAge + 1, baseAge + 2, baseAge + 3, baseAge + 4,
    baseAge + 5, baseAge + 6, baseAge + 7, baseAge + 8, baseAge + 9,
    baseAge + 14, baseAge + 19, baseAge + 24, baseAge + 29
  ];

  const existingMap = {};
  if (Array.isArray(AppState.careerDetailList)) {
    AppState.careerDetailList.forEach(item => {
      existingMap[item.age] = item;
    });
  }

  // Thu nhập thực tế trung bình tháng năm 2026
  let actualCurrentYear = 0;
  for (let m = 1; m <= 12; m++) {
    actualCurrentYear += (AppState.monthlyDetails[m]?.incomes || []).reduce((s, x) => s + x.val, 0);
  }
  const avgMonthlyActual2026 = actualCurrentYear > 0 ? (actualCurrentYear / 12) : 25.0;

  return ages.map((age, i) => {
    const yearOffset = age - baseAge;
    const targetVal = getMatrixIncomeNeed(Math.min(32, yearOffset)) || (15 + yearOffset * 2.2);

    let defaultRoute = 15.0 + yearOffset * 2.5;
    if (i === 1) defaultRoute = targetVal - 3.0;
    if (i === 2) defaultRoute = targetVal - 1.5;
    if (i >= 4) defaultRoute = targetVal + (i % 2 === 0 ? 4.0 : -1.5);

    const exist = existingMap[age];
    
    // Chỉ năm 2026 (yearOffset === 0) mới có thu nhập thực tế.
    const actualVal = (yearOffset === 0) 
      ? (exist && exist.actual !== undefined ? exist.actual : avgMonthlyActual2026) 
      : null;

    return {
      age,
      year: AppState.currentYear + yearOffset,
      actual: actualVal,
      target: targetVal,
      route: exist && exist.route !== undefined ? exist.route : defaultRoute
    };
  });
}

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
    if (tabId === 'tab-dashboard') {
      renderDashboardMatrices();
      renderDashboardAllCharts();
    }
    if (tabId === 'tab-candoi') {
      renderCareerTables();
      renderCareerChart();
    }
    if (tabId === 'tab-muctieu-tc') {
      renderTcGoalsFormTable();
      syncGoalsToCards();
    }
    if (tabId === 'tab-muctieu-bt') {
      renderTargetTables();
    }
    if (tabId === 'tab-khaosat') {
      renderGoogleFormSurvey();
      evaluateSurveys();
      setTimeout(renderSurveyQuestionCharts, 80);
    }
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

// ==================== SPARKLINE CHART ====================
function drawSparkline(canvasId, values, color = '#16a34a') {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = (max - min) === 0 ? 1 : (max - min);

  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;

  values.forEach((val, i) => {
    const x = (i / (values.length - 1)) * (w - 8) + 4;
    const y = h - ((val - min) / range) * (h - 8) - 4;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  const lastX = w - 4;
  const lastY = h - ((values[values.length - 1] - min) / range) * (h - 8) - 4;
  ctx.beginPath();
  ctx.arc(lastX, lastY, 2.5, 0, 2 * Math.PI);
  ctx.fillStyle = color;
  ctx.fill();
}

// ==================== DASHBOARD MATRICES ====================
function renderDashboardMatrices() {
  const incCats = AppState.incomeList;
  const incMonthlySums = Array(13).fill(0);
  const sparkIncData = {};

  const incRows = incCats.map((cat, idx) => {
    let rowSum = 0;
    const tds = [];
    const rowVals = [];
    for (let m = 1; m <= 12; m++) {
      const val = (AppState.monthlyDetails[m]?.incomes || [])
        .filter(x => x.cat === cat)
        .reduce((s, x) => s + x.val, 0);
      rowSum += val;
      incMonthlySums[m] += val;
      rowVals.push(val);
      tds.push(`<td class="text-right">${val > 0 ? val.toFixed(1) : '-'}</td>`);
    }
    incMonthlySums[0] += rowSum;
    sparkIncData[`spark-inc-${idx}`] = rowVals;

    return `
      <tr>
        <td class="font-semibold">${cat}</td>
        ${tds.join('')}
        <td class="text-right font-bold text-green">${rowSum.toFixed(1)}</td>
        <td class="text-center"><canvas id="spark-inc-${idx}" class="sparkline-canvas" width="95" height="24"></canvas></td>
      </tr>
    `;
  }).join('');
  
  const tbInc = document.getElementById('tbody-db-income');
  if (tbInc) tbInc.innerHTML = incRows;
  
  const tfInc = document.getElementById('tfoot-db-income-total');
  if (tfInc) {
    let tfHtml = `<td class="font-bold">Tổng cộng thu nhập</td>`;
    const totVals = [];
    for (let m = 1; m <= 12; m++) {
      tfHtml += `<td class="text-right font-bold text-green">${incMonthlySums[m].toFixed(1)}</td>`;
      totVals.push(incMonthlySums[m]);
    }
    tfHtml += `<td class="text-right font-bold text-green">${incMonthlySums[0].toFixed(1)}</td><td class="text-center"><canvas id="spark-inc-total" class="sparkline-canvas" width="95" height="24"></canvas></td>`;
    tfInc.innerHTML = tfHtml;
    sparkIncData['spark-inc-total'] = totVals;
  }

  const expCats = AppState.expenses;
  const expMonthlySums = Array(13).fill(0);
  const sparkExpData = {};

  const expRows = expCats.map((cat, idx) => {
    let rowSum = 0;
    const tds = [];
    const rowVals = [];
    for (let m = 1; m <= 12; m++) {
      const val = (AppState.monthlyDetails[m]?.expenses || [])
        .filter(x => x.cat === cat)
        .reduce((s, x) => s + x.val, 0);
      rowSum += val;
      expMonthlySums[m] += val;
      rowVals.push(val);
      tds.push(`<td class="text-right">${val > 0 ? val.toFixed(1) : '-'}</td>`);
    }
    expMonthlySums[0] += rowSum;
    sparkExpData[`spark-exp-${idx}`] = rowVals;

    return `
      <tr>
        <td class="font-semibold">${cat}</td>
        ${tds.join('')}
        <td class="text-right font-bold text-red">${rowSum.toFixed(1)}</td>
        <td class="text-center"><canvas id="spark-exp-${idx}" class="sparkline-canvas" width="95" height="24"></canvas></td>
      </tr>
    `;
  }).join('');

  const tbExp = document.getElementById('tbody-db-expense');
  if (tbExp) tbExp.innerHTML = expRows;

  const tfExpTot = document.getElementById('tfoot-db-expense-total');
  const planExpSum = AppState.planExpense.reduce((s, x) => s + x.plan, 0);
  if (tfExpTot) {
    let tfHtml = `<td class="font-bold">Tổng chi thực tế</td>`;
    const totExpVals = [];
    for (let m = 1; m <= 12; m++) {
      tfHtml += `<td class="text-right font-bold text-red">${expMonthlySums[m].toFixed(1)}</td>`;
      totExpVals.push(expMonthlySums[m]);
    }
    tfHtml += `<td class="text-right font-bold text-red">${expMonthlySums[0].toFixed(1)}</td><td class="text-center"><canvas id="spark-exp-total" class="sparkline-canvas" width="95" height="24"></canvas></td>`;
    tfExpTot.innerHTML = tfHtml;
    sparkExpData['spark-exp-total'] = totExpVals;
  }

  const tfExpPlan = document.getElementById('tfoot-db-expense-plan');
  if (tfExpPlan) {
    let tfPlanHtml = `<td class="font-semibold text-gray">Kế hoạch chi</td>`;
    for (let m = 1; m <= 12; m++) tfPlanHtml += `<td class="text-right text-gray">${planExpSum.toFixed(1)}</td>`;
    tfPlanHtml += `<td class="text-right font-bold text-gray">${(planExpSum * 12).toFixed(1)}</td><td></td>`;
    tfExpPlan.innerHTML = tfPlanHtml;
  }

  const trSav = document.getElementById('trow-db-savings');
  const sparkSavData = [];
  if (trSav) {
    let sHtml = `<td class="font-bold text-green">Tiết kiệm ròng</td>`;
    let yearSav = 0;
    for (let m = 1; m <= 12; m++) {
      const sav = incMonthlySums[m] - expMonthlySums[m];
      yearSav += sav;
      sparkSavData.push(sav);
      sHtml += `<td class="text-right font-bold ${sav >= 0 ? 'text-green' : 'text-red'}">${sav.toFixed(1)}</td>`;
    }
    sHtml += `<td class="text-right font-bold text-green">${yearSav.toFixed(1)}</td><td class="text-center"><canvas id="spark-sav-total" class="sparkline-canvas" width="95" height="24"></canvas></td>`;
    trSav.innerHTML = sHtml;
  }

  const lrnCats = AppState.planList;
  const lrnMonthlySums = Array(13).fill(0);
  const sparkLrnData = {};

  const lrnRows = lrnCats.map((cat, idx) => {
    let rowSum = 0;
    const tds = [];
    const rowVals = [];
    for (let m = 1; m <= 12; m++) {
      const val = (AppState.monthlyDetails[m]?.learningDetails || [])
        .filter(x => x.cat === cat)
        .reduce((s, x) => s + x.val, 0);
      rowSum += val;
      lrnMonthlySums[m] += val;
      rowVals.push(val);
      tds.push(`<td class="text-right">${val > 0 ? val.toFixed(2) : '-'}</td>`);
    }
    lrnMonthlySums[0] += rowSum;
    sparkLrnData[`spark-lrn-${idx}`] = rowVals;

    return `
      <tr>
        <td class="font-semibold">${cat}</td>
        ${tds.join('')}
        <td class="text-right font-bold text-orange">${rowSum.toFixed(2)}</td>
        <td class="text-center"><canvas id="spark-lrn-${idx}" class="sparkline-canvas" width="95" height="24"></canvas></td>
      </tr>
    `;
  }).join('');

  const tbLrn = document.getElementById('tbody-db-learning');
  if (tbLrn) tbLrn.innerHTML = lrnRows;

  const tfLrnTot = document.getElementById('tfoot-db-learning-total');
  if (tfLrnTot) {
    let tfLHtml = `<td class="font-bold">Tổng chi đào tạo</td>`;
    const totLrnVals = [];
    for (let m = 1; m <= 12; m++) {
      tfLHtml += `<td class="text-right font-bold text-orange">${lrnMonthlySums[m].toFixed(2)}</td>`;
      totLrnVals.push(lrnMonthlySums[m]);
    }
    tfLHtml += `<td class="text-right font-bold text-orange">${lrnMonthlySums[0].toFixed(2)}</td><td class="text-center"><canvas id="spark-lrn-total" class="sparkline-canvas" width="95" height="24"></canvas></td>`;
    tfLrnTot.innerHTML = tfLHtml;
    sparkLrnData['spark-lrn-total'] = totLrnVals;
  }

  setTimeout(() => {
    Object.keys(sparkIncData).forEach(id => drawSparkline(id, sparkIncData[id], '#16a34a'));
    Object.keys(sparkExpData).forEach(id => drawSparkline(id, sparkExpData[id], '#dc2626'));
    if (sparkSavData.length > 0) drawSparkline('spark-sav-total', sparkSavData, '#16a34a');
    Object.keys(sparkLrnData).forEach(id => drawSparkline(id, sparkLrnData[id], '#ea580c'));
  }, 40);
}

// ==================== DASHBOARD ALL CHARTS ====================
let dashChartInstances = {};

function renderDashboardAllCharts() {
  if (typeof Chart === 'undefined') return;

  const cv1 = document.getElementById('chartDashGoalsPie');
  if (cv1) {
    if (dashChartInstances.goalsPie) dashChartInstances.goalsPie.destroy();
    const debtsVal = AppState.tcGoals.filter(g => g.type === 'debt').reduce((s, g) => s + g.val, 0);
    const investsVal = AppState.tcGoals.filter(g => g.type === 'invest').reduce((s, g) => s + g.val, 0);
    dashChartInstances.goalsPie = new Chart(cv1.getContext('2d'), {
      type: 'doughnut',
      data: {
        labels: ['Mục tiêu trả nợ', 'Mục tiêu tích lũy & đầu tư'],
        datasets: [{ data: [debtsVal, investsVal], backgroundColor: ['#ea580c', '#16a34a'] }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: { font: { family: 'Montserrat', size: 10 } } } }
      }
    });
  }

  const cv2 = document.getElementById('chartDashGoalsLine');
  if (cv2) {
    if (dashChartInstances.goalsLine) dashChartInstances.goalsLine.destroy();
    const labels = [];
    const cumData = [];
    let cum = 0;
    for (let i = 0; i <= 10; i++) {
      const yr = AppState.currentYear + i;
      labels.push(`${yr}`);
      const yrVal = AppState.tcGoals.filter(g => g.end === yr).reduce((s, g) => s + g.val, 0);
      cum += yrVal;
      cumData.push(cum);
    }
    dashChartInstances.goalsLine = new Chart(cv2.getContext('2d'), {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{ label: 'Giá trị tích lũy (tr)', data: cumData, borderColor: '#0e5627', backgroundColor: 'rgba(14, 86, 39, 0.1)', fill: true, tension: 0.3 }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true } }
      }
    });
  }

  const cv3 = document.getElementById('chartDashInvestPie');
  if (cv3) {
    if (dashChartInstances.investPie) dashChartInstances.investPie.destroy();
    dashChartInstances.investPie = new Chart(cv3.getContext('2d'), {
      type: 'pie',
      data: {
        labels: AppState.investProducts.slice(0, 5).map(x => x.name),
        datasets: [{
          data: AppState.investProducts.slice(0, 5).map(x => x.returnRate),
          backgroundColor: ['#0e5627', '#16a34a', '#f29b28', '#ea580c', '#3b82f6']
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: { font: { family: 'Montserrat', size: 10 } } } }
      }
    });
  }

  const cv4 = document.getElementById('chartDashCombo12');
  if (cv4) {
    if (dashChartInstances.combo12) dashChartInstances.combo12.destroy();
    const months = Array.from({ length: 12 }, (_, i) => `T${i + 1}`);
    const incs = [], exps = [], savs = [];
    for (let m = 1; m <= 12; m++) {
      const inc = (AppState.monthlyDetails[m]?.incomes || []).reduce((s, x) => s + x.val, 0);
      const exp = (AppState.monthlyDetails[m]?.expenses || []).reduce((s, x) => s + x.val, 0);
      incs.push(inc);
      exps.push(exp);
      savs.push(inc - exp);
    }
    dashChartInstances.combo12 = new Chart(cv4.getContext('2d'), {
      type: 'bar',
      data: {
        labels: months,
        datasets: [
          { type: 'line', label: 'Tiết kiệm', data: savs, borderColor: '#16a34a', borderWidth: 2.2, fill: false, tension: 0.2 },
          { label: 'Thu nhập', data: incs, backgroundColor: '#0e5627' },
          { label: 'Chi phí', data: exps, backgroundColor: '#f29b28' }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'top', labels: { font: { family: 'Montserrat', size: 10 } } } },
        scales: { y: { beginAtZero: true } }
      }
    });
  }

  const cv5 = document.getElementById('chartDashVariance');
  if (cv5) {
    if (dashChartInstances.variance) dashChartInstances.variance.destroy();
    const planExp = AppState.planExpense.reduce((s, x) => s + x.plan, 0);
    const months = Array.from({ length: 12 }, (_, i) => `T${i + 1}`);
    const actuals = [], cumDiff = [];
    let runningDiff = 0;
    for (let m = 1; m <= 12; m++) {
      const act = (AppState.monthlyDetails[m]?.expenses || []).reduce((s, x) => s + x.val, 0);
      actuals.push(act);
      runningDiff += (act - planExp);
      cumDiff.push(runningDiff);
    }
    dashChartInstances.variance = new Chart(cv5.getContext('2d'), {
      type: 'bar',
      data: {
        labels: months,
        datasets: [
          { type: 'line', label: 'Lũy kế chênh lệch', data: cumDiff, borderColor: '#dc2626', borderWidth: 2, fill: false },
          { label: 'Chi thực tế', data: actuals, backgroundColor: '#ea580c' },
          { label: 'Kế hoạch', data: Array(12).fill(planExp), backgroundColor: '#cbd5e1' }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'top', labels: { font: { family: 'Montserrat', size: 10 } } } }
      }
    });
  }

  const cv6 = document.getElementById('chartDashLearningStack');
  if (cv6) {
    if (dashChartInstances.learningStack) dashChartInstances.learningStack.destroy();
    const months = Array.from({ length: 12 }, (_, i) => `T${i + 1}`);
    const colors = ['#0e5627', '#16a34a', '#f29b28', '#3b82f6', '#8b5cf6'];
    const datasets = AppState.planList.map((cat, idx) => {
      const data = [];
      for (let m = 1; m <= 12; m++) {
        const val = (AppState.monthlyDetails[m]?.learningDetails || [])
          .filter(x => x.cat === cat)
          .reduce((s, x) => s + x.val, 0);
        data.push(val);
      }
      return {
        label: cat,
        data: data,
        backgroundColor: colors[idx % colors.length],
        stack: 'learn'
      };
    });

    dashChartInstances.learningStack = new Chart(cv6.getContext('2d'), {
      type: 'bar',
      data: { labels: months, datasets: datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: { font: { family: 'Montserrat', size: 9 } } } },
        scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true } }
      }
    });
  }
}

// ==================== TỪ KHÓA ====================
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
  AppState.expenses.push(`Chi tiêu mới ${AppState.expenses.length + 1}`);
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
  AppState.incomeList.push(`Nguồn thu mới ${AppState.incomeList.length + 1}`);
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
  const incEl = document.getElementById('plan-sum-inc-val');
  const expEl = document.getElementById('plan-sum-exp-val');
  if (incEl) incEl.textContent = `${sumInc.toFixed(2)} tr`;
  if (expEl) expEl.textContent = `${sumExp.toFixed(2)} tr`;
}

// ==================== THEO DÕI THU CHI 12 THÁNG ====================
function renderMonthView(m) {
  const mData = AppState.monthlyDetails[m] || { incomes: [], expenses: [], learningDetails: [] };

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

// ==================== PHẦN 2 ĐÀO TẠO ====================
function renderMonthLearningSection(m) {
  if (!AppState.monthlyDetails[m]) {
    AppState.monthlyDetails[m] = { incomes: [], expenses: [], learningDetails: [], reconIncomeNotes: {}, reconExpenseNotes: {} };
  }
  
  const items = AppState.monthlyDetails[m].learningDetails || [];
  const tb = document.getElementById('tbody-m-learning-detail');
  
  if (tb) {
    tb.innerHTML = items.map((it, i) => `
      <tr>
        <td><input type="date" class="input-date-cell" value="${it.date}" onchange="updateMonthLearningField(${m}, ${i}, 'date', this.value)"></td>
        <td>
          <select class="select-inline-cell" onchange="updateMonthLearningField(${m}, ${i}, 'cat', this.value)">
            ${AppState.planList.map(opt => `<option value="${opt}" ${opt === it.cat ? 'selected' : ''}>${opt}</option>`).join('')}
          </select>
        </td>
        <td class="cell-blue" contenteditable="true" spellcheck="false" onblur="updateMonthLearningField(${m}, ${i}, 'desc', this.innerText.trim())">${it.desc || ''}</td>
        <td class="text-right cell-blue font-bold" contenteditable="true" spellcheck="false" onblur="updateMonthLearningField(${m}, ${i}, 'val', parseFloat(this.innerText.replace(/[^0-9.-]/g, '')) || 0)">${Number(it.val || 0).toFixed(2)}</td>
        <td class="cell-blue" contenteditable="true" spellcheck="false" onblur="updateMonthLearningField(${m}, ${i}, 'expRes', this.innerText.trim())">${it.expRes || ''}</td>
        <td class="cell-blue" contenteditable="true" spellcheck="false" onblur="updateMonthLearningField(${m}, ${i}, 'actRes', this.innerText.trim())">${it.actRes || ''}</td>
        <td class="text-center"><button class="btn-table-del" onclick="deleteMonthLearningRow(${m}, ${i})"><i class="fa-solid fa-trash-can"></i></button></td>
      </tr>
    `).join('');
  }

  const catSums = {};
  let totalLearningCost = 0;
  items.forEach(x => {
    const val = parseFloat(x.val) || 0;
    catSums[x.cat] = (catSums[x.cat] || 0) + val;
    totalLearningCost += val;
  });

  const tbStat = document.getElementById('tbody-m-learning-stat');
  if (tbStat) {
    tbStat.innerHTML = AppState.planList.map(name => {
      const val = catSums[name] || 0;
      return `<tr><td>${name}</td><td class="text-right font-bold text-orange">${val.toFixed(2)}</td></tr>`;
    }).join('');
  }

  const footTotal = document.getElementById('tfoot-m-learn-total');
  const footStatTotal = document.getElementById('tfoot-m-learn-stat-total');
  if (footTotal) footTotal.textContent = totalLearningCost.toFixed(2);
  if (footStatTotal) footStatTotal.textContent = totalLearningCost.toFixed(2);

  const expList = AppState.monthlyDetails[m].expenses;
  let lrnExpense = expList.find(x => x.cat === "Chi tiền phát triển bản thân");
  if (lrnExpense) {
    lrnExpense.val = totalLearningCost;
  } else if (totalLearningCost > 0) {
    expList.push({
      date: `2026-${m < 10 ? '0' + m : m}-20`,
      cat: "Chi tiền phát triển bản thân",
      desc: "Đầu tư phát triển bản thân",
      val: totalLearningCost
    });
  }
}

window.updateMonthLearningField = function(m, i, field, value) {
  if (AppState.monthlyDetails[m] && AppState.monthlyDetails[m].learningDetails[i]) {
    AppState.monthlyDetails[m].learningDetails[i][field] = value;
    renderMonthLearningSection(m);
    syncLearningToDashboard();
  }
};

window.addMonthLearningRow = function() {
  const m = AppState.currentMonth;
  const mStr = m < 10 ? `0${m}` : `${m}`;
  const defaultCat = AppState.planList[0] || "Khóa học ngắn hạn";
  AppState.monthlyDetails[m].learningDetails.push({
    date: `2026-${mStr}-10`,
    cat: defaultCat,
    desc: "Khóa đào tạo mới",
    val: 1.0,
    expRes: "Nâng cao kỹ năng",
    actRes: "Đang học"
  });
  renderMonthLearningSection(m);
  syncLearningToDashboard();
};

window.deleteMonthLearningRow = function(m, i) {
  AppState.monthlyDetails[m].learningDetails.splice(i, 1);
  renderMonthLearningSection(m);
  syncLearningToDashboard();
};

function syncLearningToDashboard() {
  renderReconciliationTable(AppState.currentMonth);
  recalculateAll();
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
  const milestones = calculateAgeMilestones();
  const tb1 = document.getElementById('tbody-career-overview');
  if (tb1) {
    tb1.innerHTML = milestones.map((item, idx) => `
      <tr>
        <td class="text-center font-bold bg-neutral-gray">${item.age}</td>
        <td class="text-right font-bold text-orange">${item.incomeNeed.toFixed(1)}</td>
        <td class="text-right font-semibold">${item.stocks.toFixed(1)}%</td>
        <td class="text-right font-semibold">${item.bonds.toFixed(1)}%</td>
        <td class="text-right font-semibold">${item.ins.toFixed(1)}%</td>
        <td class="text-right font-semibold">${item.cash.toFixed(1)}%</td>
        <td class="text-right font-bold text-green">${item.returnNeed.toFixed(2)}%</td>
        <td class="cell-blue" contenteditable="true" spellcheck="false" onblur="AppState.skillsStore[${idx}]=this.innerText.trim();">${item.skills}</td>
      </tr>
    `).join('');
  }

  // YÊU CẦU 3: BẢNG LỘ TRÌNH CHI TIẾT - CHỈ CHO PHÉP NHẬP THU NHẬP THỰC TẾ ĐẾN 2026
  AppState.careerDetailList = calculateCareerDetails();
  const tb2 = document.getElementById('tbody-career-detail');
  if (tb2) {
    tb2.innerHTML = AppState.careerDetailList.map((item, idx) => {
      const isDeficit = item.route < item.target;
      const diffVal = Math.abs(item.target - item.route).toFixed(1);
      const isCurrentYear = item.year === AppState.currentYear;

      return `
        <tr>
          <td class="text-center font-bold bg-neutral-gray">${item.age}</td>
          
          <!-- THU NHẬP THỰC TẾ CHỈ CÓ NĂM 2026 -->
          <td class="text-right font-bold ${isCurrentYear ? 'cell-blue font-bold' : 'cell-disabled-readonly'}" 
              ${isCurrentYear ? `contenteditable="true" spellcheck="false" onblur="updateCareerDetailField(${idx}, 'actual', parseFloat(this.innerText.replace(/[^0-9.-]/g, ''))||0)"` : ''}>
            ${item.actual !== null ? Number(item.actual).toFixed(1) : '<span class="dash-null">-</span>'}
          </td>
          
          <td class="text-right font-bold text-gold">${item.target.toFixed(1)}</td>
          
          <!-- THU NHẬP THEO LỘ TRÌNH NGHỀ NGHIỆP: CHO PHÉP NGƯỜI DÙNG NHẬP DATA ĐẦY ĐỦ -->
          <td class="text-right font-bold cell-blue ${isDeficit ? 'text-deficit-danger' : 'text-green'}" 
              contenteditable="true" spellcheck="false" 
              onblur="updateCareerDetailField(${idx}, 'route', parseFloat(this.innerText.replace(/[^0-9.-]/g, ''))||0)">
            ${item.route.toFixed(1)}
          </td>
          
          <td class="text-center">
            ${isDeficit 
              ? `<span class="deficit-badge">⚠️️ Thiếu hụt (${diffVal} tr)</span>` 
              : `<span class="success-badge">✅ Đạt yêu cầu</span>`
            }
          </td>
        </tr>
      `;
    }).join('');
  }
}

window.updateCareerDetailField = function(idx, field, val) {
  if (AppState.careerDetailList[idx]) {
    AppState.careerDetailList[idx][field] = val;
    renderCareerTables();
    renderCareerChart();
  }
};

function renderCareerChart() {
  const canvas = document.getElementById('careerChart');
  if (!canvas || typeof Chart === 'undefined') return;

  const dataList = AppState.careerDetailList.length > 0 ? AppState.careerDetailList : calculateCareerDetails();
  const labels = dataList.map(x => `${x.age} tuổi`);
  const actuals = dataList.map(x => x.actual);
  const targets = dataList.map(x => x.target);
  const routes = dataList.map(x => x.route);

  if (careerChartInstance) careerChartInstance.destroy();
  careerChartInstance = new Chart(canvas.getContext('2d'), {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: "Thu nhập thực tế (đến 2026)",
          data: actuals,
          borderColor: "#2563eb",
          backgroundColor: "#2563eb",
          borderWidth: 3,
          pointRadius: 6,
          pointBackgroundColor: "#2563eb",
          fill: false,
          tension: 0.25,
          spanGaps: false
        },
        {
          label: "Số tiền cần có để đạt mục tiêu tài chính",
          data: targets,
          borderColor: "#eab308",
          backgroundColor: "#eab308",
          borderWidth: 3,
          pointRadius: 5,
          pointBackgroundColor: "#eab308",
          fill: false,
          tension: 0.25
        },
        {
          label: "Thu nhập theo lộ trình nghề nghiệp (Đạt yêu cầu)",
          data: routes,
          borderWidth: 3,
          pointRadius: 6,
          pointBackgroundColor: ctx => {
            const idx = ctx.dataIndex;
            return routes[idx] >= targets[idx] ? "#16a34a" : "#dc2626";
          },
          pointBorderColor: ctx => {
            const idx = ctx.dataIndex;
            return routes[idx] >= targets[idx] ? "#15803d" : "#b91c1c";
          },
          segment: {
            borderColor: ctx => {
              const p0 = ctx.p0DataIndex;
              const p1 = ctx.p1DataIndex;
              const isAbove = (routes[p0] >= targets[p0]) && (routes[p1] >= targets[p1]);
              return isAbove ? '#16a34a' : '#dc2626';
            }
          },
          fill: false,
          tension: 0.25
        },
        {
          label: "Không đạt mục tiêu (Cần cải thiện)",
          data: [],
          borderColor: "#dc2626",
          backgroundColor: "#dc2626",
          borderWidth: 3,
          pointRadius: 5,
          pointBackgroundColor: "#dc2626"
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          position: 'top',
          labels: { font: { family: 'Montserrat', size: 11, weight: 'bold' }, boxWidth: 28, boxHeight: 12, padding: 16 }
        },
        tooltip: {
          callbacks: {
            label: ctx => {
              if (ctx.raw === null || ctx.raw === undefined) return '';
              return ` ${ctx.dataset.label}: ${Number(ctx.raw).toFixed(1)} tr`;
            }
          }
        }
      },
      scales: {
        y: { beginAtZero: true, suggestedMax: 100, ticks: { stepSize: 10 }, grid: { color: "#f1f5f9" } },
        x: { grid: { display: false } }
      }
    }
  });
}

// ==================== YÊU CẦU 4: BẢNG KHẢO SÁT DẠNG GOOGLE FORM ====================
function renderGoogleFormSurvey() {
  const p1Container = document.getElementById('gform-questions-p1');
  if (p1Container) {
    let html1 = '';
    surveyQuestionsPart1.forEach((q, idx) => {
      const qNum = idx + 1;
      const selected = AppState.surveyP1Choices[qNum];

      html1 += `
        <div class="gform-card" id="gform-card-p1-q${qNum}">
          <div class="gform-card-header">
            <span class="gform-q-number">Câu hỏi ${qNum}</span>
            <div class="gform-q-text">${q.q}</div>
          </div>
      `;

      if (q.hasCharts) {
        html1 += `
          <div class="survey-graphic-box">
            <div class="chart-triplet-grid">
              <div class="chart-box-mini">
                <div class="chart-box-mini-title">Danh mục X - Lợi nhuận TB = 8%</div>
                <div class="mini-chart-canvas-wrap"><canvas id="chartMiniX"></canvas></div>
              </div>
              <div class="chart-box-mini">
                <div class="chart-box-mini-title">Danh mục Y - Lợi nhuận TB = 12%</div>
                <div class="mini-chart-canvas-wrap"><canvas id="chartMiniY"></canvas></div>
              </div>
              <div class="chart-box-mini">
                <div class="chart-box-mini-title">Danh mục Z - Lợi nhuận TB = 16%</div>
                <div class="mini-chart-canvas-wrap"><canvas id="chartMiniZ"></canvas></div>
              </div>
            </div>
          </div>
        `;
      }

      if (q.hasTable) {
        html1 += `
          <table class="sub-table-graphic">
            <thead>
              <tr>
                <th>Danh mục đầu tư</th>
                <th>Giá trị kỳ vọng của 100 triệu sau 1 năm</th>
                <th>Khả năng lỗ sau một năm</th>
              </tr>
            </thead>
            <tbody>
              <tr><td class="font-bold">Danh mục A</td><td>107 triệu</td><td class="text-red font-bold">19%</td></tr>
              <tr><td class="font-bold">Danh mục B</td><td>108 triệu</td><td class="text-red font-bold">23%</td></tr>
              <tr><td class="font-bold">Danh mục C</td><td>109 triệu</td><td class="text-red font-bold">26%</td></tr>
              <tr><td class="font-bold">Danh mục D</td><td>110 triệu</td><td class="text-red font-bold">28%</td></tr>
            </tbody>
          </table>
        `;
      }

      html1 += `<div class="gform-options-list">`;
      q.opts.forEach((opt, optIdx) => {
        const isChecked = selected === optIdx;
        html1 += `
          <label class="gform-option-item ${isChecked ? 'active' : ''}" onclick="selectGoogleFormOption(1, ${qNum}, ${optIdx})">
            <input type="radio" name="gform_p1_${qNum}" value="${optIdx}" ${isChecked ? 'checked' : ''}>
            <span class="gform-radio-dot"></span>
            <span class="gform-option-label">${opt}</span>
          </label>
        `;
      });
      html1 += `</div></div>`;
    });
    p1Container.innerHTML = html1;
  }

  const p2Container = document.getElementById('gform-questions-p2');
  if (p2Container) {
    let html2 = '';
    surveyQuestionsPart2.forEach((q, idx) => {
      const qNum = idx + 1;
      const selected = AppState.surveyP2Choices[qNum];

      html2 += `
        <div class="gform-card" id="gform-card-p2-q${qNum}">
          <div class="gform-card-header">
            <span class="gform-q-number">Câu hỏi ${qNum}</span>
            <div class="gform-q-text">${q.q}</div>
          </div>
          <div class="gform-options-list">
      `;

      q.opts.forEach((opt, optIdx) => {
        const isChecked = selected === optIdx;
        html2 += `
          <label class="gform-option-item ${isChecked ? 'active' : ''}" onclick="selectGoogleFormOption(2, ${qNum}, ${optIdx})">
            <input type="radio" name="gform_p2_${qNum}" value="${optIdx}" ${isChecked ? 'checked' : ''}>
            <span class="gform-radio-dot"></span>
            <span class="gform-option-label">${opt}</span>
          </label>
        `;
      });

      html2 += `</div></div>`;
    });
    p2Container.innerHTML = html2;
  }
}

window.selectGoogleFormOption = function(part, qNum, optIdx) {
  if (part === 1) {
    AppState.surveyP1Choices[qNum] = optIdx;
  } else {
    AppState.surveyP2Choices[qNum] = optIdx;
  }
  renderGoogleFormSurvey();
  evaluateSurveys();
  setTimeout(renderSurveyQuestionCharts, 40);
};

let miniCharts = {};
function renderSurveyQuestionCharts() {
  if (typeof Chart === 'undefined') return;

  const dataX = [2, 8, 9, 10, 11, 12, 13, 15, 12, 10, 7, 8, 11, 10, 9, 8, 7, 7, 6, 6];
  const dataY = [15, 14, -3, 9, 7, 35, -9, 10, 7, 30, 15, 6, 12, 15, -4, 8, 11, 14, -7, 10];
  const dataZ = [46, -11, 26, 29, 36, -8, 8, 6, 29, 9, -12, 13, 12, 8, -20, 26, 39, 4, 5, 8];

  const createMini = (id, data) => {
    const canvas = document.getElementById(id);
    if (!canvas) return;
    if (miniCharts[id]) miniCharts[id].destroy();

    miniCharts[id] = new Chart(canvas.getContext('2d'), {
      type: 'bar',
      data: {
        labels: Array.from({ length: 20 }, (_, i) => `${i + 1}`),
        datasets: [{
          data: data,
          backgroundColor: data.map(v => v >= 0 ? '#166534' : '#dc2626'),
          barPercentage: 0.8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { enabled: true } },
        scales: {
          x: { display: true, ticks: { font: { size: 7 } }, grid: { display: false } },
          y: { min: -25, max: 50, ticks: { font: { size: 7 }, stepSize: 20 }, grid: { color: '#f1f5f9' } }
        }
      }
    });
  };

  createMini('chartMiniX', dataX);
  createMini('chartMiniY', dataY);
  createMini('chartMiniZ', dataZ);
}

function evaluateSurveys() {
  let s1 = 0;
  surveyQuestionsPart1.forEach((q, idx) => {
    const qNum = idx + 1;
    const choiceIdx = AppState.surveyP1Choices[qNum];
    if (choiceIdx !== undefined && q.weights[choiceIdx] !== undefined) {
      s1 += q.weights[choiceIdx];
    }
  });

  let rTxt = "";
  if (s1 <= 15) {
    rTxt = "Bạn là người cực kỳ thận trọng và ngại rủi ro cao. Bạn nên ưu tiên các tài sản an toàn tuyệt đối như tiền gửi và trái phiếu chính phủ.";
  } else if (s1 <= 22) {
    rTxt = "Bạn là người thận trọng. Bạn nên duy trì các tài sản rủi ro tại mức thấp để hạn chế tối đa các đợt sụt giảm thị trường.";
  } else if (s1 <= 30) {
    rTxt = "Bạn là người trung lập với rủi ro, bạn nên duy trì các tài sản rủi ro tại mức trung bình để cân bằng giữa sinh lời và an toàn vốn.";
  } else if (s1 <= 38) {
    rTxt = "Bạn là người chấp nhận rủi ro, bạn có thể gia tăng tỷ trọng các tài sản có mức độ sinh lời cao như cổ phiếu và chứng chỉ quỹ ETF.";
  } else {
    rTxt = "Bạn là nhà đầu tư quyết liệt, sẵn sàng chấp nhận biến động mạnh để tối ưu hóa mức tăng trưởng tài sản dài hạn vượt trội.";
  }

  const p1ResEl = document.getElementById('survey-result-p1-text');
  const risk1 = document.getElementById('survey-result-risk');
  if (p1ResEl) p1ResEl.innerHTML = `<strong>Khả năng chịu đựng rủi ro:</strong> ${rTxt}`;
  if (risk1) risk1.textContent = `Kết quả khảo sát khả năng chịu đựng rủi ro: ${rTxt}`;

  let s2 = 0;
  surveyQuestionsPart2.forEach((q, idx) => {
    const qNum = idx + 1;
    const choiceIdx = AppState.surveyP2Choices[qNum];
    if (choiceIdx !== undefined && q.weights[choiceIdx] !== undefined) {
      s2 += q.weights[choiceIdx];
    }
  });

  let cTxt = "";
  if (s2 <= 18) {
    cTxt = "Bạn trong điều kiện không thuận lợi để phát triển tài chính của bạn trong dài hạn (áp lực chi phí và phụ thuộc cao).";
  } else if (s2 <= 26) {
    cTxt = "Bạn trong điều kiện ít thuận lợi để phát triển tài chính của bạn trong dài hạn.";
  } else if (s2 <= 35) {
    cTxt = "Bạn trong điều kiện bình thường để phát triển tài chính của bạn trong dài hạn.";
  } else if (s2 <= 42) {
    cTxt = "Bạn trong điều kiện thuận lợi để phát triển tài chính của bạn trong dài hạn.";
  } else {
    cTxt = "Bạn trong điều kiện cực kỳ thuận lợi để phát triển tài chính của bạn trong dài hạn với tiềm năng tích lũy vượt trội.";
  }

  const p2ResEl = document.getElementById('survey-result-p2-text');
  const ctx2 = document.getElementById('survey-result-context');
  if (p2ResEl) p2ResEl.innerHTML = `<strong>Hoàn cảnh & Môi trường:</strong> ${cTxt}`;
  if (ctx2) ctx2.textContent = `Kết quả khảo sát hoàn cảnh: ${cTxt}`;
}

// ==================== YÊU CẦU 2: MỤC TIÊU TÀI CHÍNH LỰA CHỌN TỪ MT BẢN THÂN ====================
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

  const personalGoalTitles = getAllPersonalGoalTitles();

  tb.innerHTML = AppState.tcGoals.map((g, idx) => {
    // Đảm bảo tên hiện tại luôn có trong options
    const options = [...personalGoalTitles];
    if (g.name && !options.includes(g.name)) {
      options.unshift(g.name);
    }
    if (options.length === 0) options.push("Mục tiêu mẫu");

    return `
      <tr>
        <td>
          <select class="select-inline-cell" onchange="AppState.tcGoals[${idx}].name=this.value;">
            ${options.map(opt => `<option value="${opt}" ${opt === g.name ? 'selected' : ''}>${opt}</option>`).join('')}
          </select>
        </td>
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
    `;
  }).join('');
}

window.addNewTcGoalRow = function() {
  const pGoals = getAllPersonalGoalTitles();
  const defaultTitle = pGoals[0] || "Mục tiêu mới";
  AppState.tcGoals.push({ 
    id: `g_${Date.now()}`, name: defaultTitle, type: "invest", val: 100.0, paid: 0.0, 
    start: AppState.currentYear, end: AppState.currentYear + 4, rate: 8.0, monthly: 1.7,
    yearsRetire: 20, monthlyRetire: 10.0, deathFund: 200.0,
    allocProducts: [
      { prodName: "ETF - ETFVFM", weight: 50.0, returnRate: 13.0, risk: 18.0 },
      { prodName: "DCBC", weight: 50.0, returnRate: 16.0, risk: 20.0 }
    ]
  });
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

  if (dWrap) dWrap.innerHTML = debts.map((g, i) => createCardHtmlDebt(g, i + 1)).join('');
  if (iWrap) iWrap.innerHTML = invests.map((g, i) => createCardHtmlInvest(g, i + 1)).join('');
}

function createCardHtmlDebt(g, num) {
  const nYears = Math.max(1, g.end - g.start + 1);
  const targetNeed = Math.max(0, g.val - (g.paid || 0));
  const mVal = g.monthly || calculateMonthlyNeed(g);

  return `
    <div class="tc-goal-card-h4" id="card-${g.id}">
      <div class="tc-card-h4-title">
        <span>Mục tiêu trả nợ ${num}: ${g.name}</span>
        <button class="btn-table-del" style="color:#ffffff;" onclick="removeGoalFromCard('${g.id}')"><i class="fa-solid fa-trash-can"></i></button>
      </div>
      <table class="tc-card-h4-table">
        <tbody>
          <tr>
            <td style="width: 32%;">Năm bắt đầu</td>
            <td class="cell-green-val" style="width: 18%;">${g.start}</td>
            <td class="bg-col-head" style="width: 32%;">Thời gian trả (năm)</td>
            <td class="text-right font-bold" style="width: 18%;">${nYears.toFixed(1)}</td>
          </tr>
          <tr>
            <td>Năm kết thúc</td>
            <td class="cell-green-val">${g.end}</td>
            <td class="bg-col-head">Khoản nợ còn lại</td>
            <td class="text-right font-bold text-red">${targetNeed.toFixed(1)} tr</td>
          </tr>
          <tr>
            <td>Lãi suất vay</td>
            <td class="cell-green-val">${g.rate.toFixed(1)}%</td>
            <td class="bg-col-head">Trả hàng tháng</td>
            <td class="cell-orange-val">${mVal.toFixed(1)} tr</td>
          </tr>
        </tbody>
      </table>
    </div>
  `;
}

function createCardHtmlInvest(g, num) {
  const nYears = Math.max(1, g.end - g.start + 1);
  const targetNeed = Math.max(0, g.val - (g.paid || 0));
  const mVal = g.monthly || calculateMonthlyNeed(g);
  const yVal = mVal * 12;

  const prods = g.allocProducts && g.allocProducts.length > 0 ? g.allocProducts : [
    { prodName: "ETF - ETFVFM", weight: 50.0, returnRate: 13.0, risk: 18.0 },
    { prodName: "DCBC", weight: 50.0, returnRate: 16.0, risk: 20.0 },
    { prodName: "Tiền gửi ngân hàng", weight: 0.0, returnRate: 5.0, risk: 2.0 }
  ];

  let expectedAvgReturn = 0;
  prods.forEach(p => { expectedAvgReturn += (p.weight / 100) * p.returnRate; });

  return `
    <div class="tc-goal-card-h4" id="card-${g.id}">
      <div class="tc-card-h4-title">
        <span>Mục tiêu đầu tư ${num}: ${g.name}</span>
        <button class="btn-table-del" style="color:#ffffff;" onclick="removeGoalFromCard('${g.id}')"><i class="fa-solid fa-trash-can"></i></button>
      </div>
      <table class="tc-card-h4-table">
        <thead>
          <tr class="header-sub-green">
            <th colspan="2" style="width: 32%;">Thông số kế hoạch</th>
            <th colspan="2" style="width: 30%;">Tóm tắt kế hoạch</th>
            <th colspan="4" style="width: 38%;">Sản phẩm đầu tư</th>
          </tr>
          <tr class="bg-col-head">
            <th>Chỉ tiêu</th><th style="width: 50px;">Giá trị</th>
            <th>Khoản mục</th><th style="width: 55px;">Giá trị</th>
            <th>Loại sản phẩm</th><th style="width: 44px;">Tỷ trọng</th><th style="width: 40px;">LN</th><th style="width: 38px;">Rủi ro</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Năm bắt đầu</td>
            <td class="cell-green-val">${g.start}</td>
            <td class="italic-head">Số tiền cần có khi hưu</td>
            <td class="cell-orange-val">${targetNeed.toFixed(0)}</td>
            <td class="cell-blue font-bold">${prods[0]?.prodName || 'Sản phẩm 1'}</td>
            <td class="cell-green-val">${prods[0]?.weight.toFixed(1)}%</td>
            <td class="text-right">${prods[0]?.returnRate.toFixed(0)}%</td>
            <td class="text-right">${prods[0]?.risk.toFixed(0)}%</td>
          </tr>
          <tr>
            <td>Năm kết thúc</td>
            <td class="cell-green-val">${g.end}</td>
            <td class="font-bold">Thời gian tiết kiệm (năm)</td>
            <td class="text-right font-bold">${nYears.toFixed(1)}</td>
            <td class="cell-blue font-bold">${prods[1]?.prodName || 'Sản phẩm 2'}</td>
            <td class="cell-green-val">${prods[1]?.weight.toFixed(1)}%</td>
            <td class="text-right">${prods[1]?.returnRate.toFixed(0)}%</td>
            <td class="text-right">${prods[1]?.risk.toFixed(0)}%</td>
          </tr>
          <tr>
            <td>TG sống sau hưu (năm)</td>
            <td class="cell-green-val">${g.yearsRetire || 30}</td>
            <td class="font-bold">Số tiền trả hàng tháng</td>
            <td class="cell-orange-val">${mVal.toFixed(1)}</td>
            <td class="cell-blue font-bold">${prods[2]?.prodName || 'Sản phẩm 3'}</td>
            <td class="cell-green-val">${(prods[2]?.weight || 0).toFixed(1)}%</td>
            <td class="text-right">${(prods[2]?.returnRate || 0).toFixed(0)}%</td>
            <td class="text-right">${(prods[2]?.risk || 0).toFixed(0)}%</td>
          </tr>
          <tr>
            <td>Hưu trí cần mỗi tháng</td>
            <td class="cell-green-val">${g.monthlyRetire || 15}</td>
            <td class="font-bold">Số tiền trả hàng năm</td>
            <td class="cell-orange-val">${yVal.toFixed(1)}</td>
            <td colspan="2" class="font-bold text-center bg-col-head">LN kỳ vọng TB</td>
            <td colspan="2" class="cell-gold-val text-center">${expectedAvgReturn.toFixed(2)}%</td>
          </tr>
          <tr class="bg-neutral-gray font-semibold">
            <td>Để lại sau mất:</td>
            <td class="font-bold text-right text-red">${g.deathFund || 500} tr</td>
            <td style="text-align: right;">LS (Lãi suất) đầu tư:</td>
            <td class="cell-green-val">${expectedAvgReturn.toFixed(1)}%</td>
            <td colspan="2" style="text-align: right;">Tích lũy hiện có:</td>
            <td colspan="2" class="cell-green-val text-center font-bold">${g.paid || 0} tr</td>
          </tr>
        </tbody>
      </table>
    </div>
  `;
}

window.removeGoalFromCard = function(id) {
  AppState.tcGoals = AppState.tcGoals.filter(x => x.id !== id);
  syncGoalsToCards();
  renderTcGoalsFormTable();
  renderTcMatrixTable();
};

// ==================== MA TRẬN 33 NĂM ====================
function renderTcMatrixTable() {
  const thead = document.getElementById('tr-tc-matrix-head');
  const tbody = document.getElementById('tbody-tc-matrix');
  if (!thead || !tbody) return;

  const debts = AppState.tcGoals.filter(g => g.type === 'debt');
  const invests = AppState.tcGoals.filter(g => g.type === 'invest');
  const all = [...debts, ...invests];

  thead.innerHTML = `
    <th style="min-width: 48px;">Năm</th>
    <th style="min-width: 48px;">Tuổi</th>
    ${debts.map((g, i) => `<th style="min-width: 90px;">Nợ ${i + 1}:<br><span style="font-weight: 500;">${g.name}</span></th>`).join('')}
    ${invests.map((g, i) => `<th style="min-width: 90px;">Đầu tư ${i + 1}:<br><span style="font-weight: 500;">${g.name}</span></th>`).join('')}
    <th style="min-width: 78px;" class="col-highlight-gold">Tiết kiệm cần</th>
    <th style="min-width: 78px;" class="col-highlight-orange">Thu nhập cần</th>
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
            oninput="onMatrixCellChange(this, ${y})" 
            onblur="formatMatrixCell(this, ${y})">
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

window.onMatrixCellChange = function(td, rIdx) {
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
  updateMatrixChartData();
  
  renderCareerTables();
  renderCareerChart();
};

window.formatMatrixCell = function(td, rIdx) {
  const v = parseFloat(td.innerText.trim().replace(/[^0-9.-]/g, ''));
  td.textContent = (!isNaN(v) && v > 0) ? v.toFixed(1) : '';
  window.onMatrixCellChange(td, rIdx);
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
    labels.push(`${age}T (${yr})`);

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
        { label: "Thu nhập cần có (tr/tháng)", data: incData, borderColor: "#ea580c", backgroundColor: "rgba(234, 88, 12, 0.12)", borderWidth: 2, fill: true, tension: 0.2 },
        { label: "Tiết kiệm cần có (tr/tháng)", data: savData, borderColor: "#f59e0b", backgroundColor: "rgba(245, 158, 11, 0.15)", borderWidth: 2, fill: true, tension: 0.2 }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: { y: { beginAtZero: true, grid: { color: "#f1f5f9" } } }
    }
  });
}

function updateMatrixChartData() {
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

// ==================== YÊU CẦU 1: MỤC TIÊU BẢN THÂN CÓ BORDER CHUẨN 4 CỘT ====================
// Cấu trúc 4 cột đúng yêu cầu: Thứ tự mục tiêu - Thời điểm thực hiện mục tiêu - Nội dung mục tiêu - Lựa chọn xoá (nút)
function renderTargetTables() {
  const tbDebt = document.getElementById('tbody-debt-target');
  if (tbDebt) {
    tbDebt.innerHTML = AppState.debtTargets.map((d, i) => `
      <tr>
        <td class="text-center font-bold bg-neutral-gray">${i + 1}</td>
        <td class="text-center cell-blue font-bold" contenteditable="true" spellcheck="false" onblur="d.age=parseInt(this.innerText,10)||AppState.currentAge; recalculateAll();">${d.age} tuổi</td>
        <td class="cell-blue font-medium" contenteditable="true" spellcheck="false" onblur="d.desc=this.innerText.trim(); onPersonalGoalChanged();">${d.desc}</td>
        <td class="text-center"><button class="btn-table-del" title="Xóa mục tiêu" onclick="deleteDebtTargetRow(${i})"><i class="fa-solid fa-trash-can"></i></button></td>
      </tr>
    `).join('');
  }

  const tbInv = document.getElementById('tbody-invest-target');
  if (tbInv) {
    tbInv.innerHTML = AppState.investTargets.map((inv, i) => `
      <tr>
        <td class="text-center font-bold bg-neutral-gray">${i + 1}</td>
        <td class="text-center cell-blue font-bold" contenteditable="true" spellcheck="false" onblur="inv.age=parseInt(this.innerText,10)||AppState.currentAge; recalculateAll();">${inv.age} tuổi</td>
        <td class="cell-blue font-medium" contenteditable="true" spellcheck="false" onblur="inv.desc=this.innerText.trim(); onPersonalGoalChanged();">${inv.desc}</td>
        <td class="text-center"><button class="btn-table-del" title="Xóa mục tiêu" onclick="deleteInvestTargetRow(${i})"><i class="fa-solid fa-trash-can"></i></button></td>
      </tr>
    `).join('');
  }

  renderSkillsFamilyJob();
}

function onPersonalGoalChanged() {
  renderTcGoalsFormTable();
  recalculateAll();
}

window.addDebtTargetRow = function() {
  AppState.debtTargets.push({ age: AppState.currentAge + 5, desc: "Khoản nợ mới", val: 100.0 });
  renderTargetTables();
  onPersonalGoalChanged();
};

window.deleteDebtTargetRow = function(i) {
  AppState.debtTargets.splice(i, 1);
  renderTargetTables();
  onPersonalGoalChanged();
};

window.addInvestTargetRow = function() {
  AppState.investTargets.push({ age: AppState.currentAge + 4, desc: "Mục tiêu tích lũy mới", pv: 150.0, inflation: 4.0, expectedReturn: 10.0 });
  renderTargetTables();
  onPersonalGoalChanged();
};

window.deleteInvestTargetRow = function(i) {
  AppState.investTargets.splice(i, 1);
  renderTargetTables();
  onPersonalGoalChanged();
};

function renderSkillsFamilyJob() {
  const tbS = document.getElementById('tbody-skills');
  if (tbS) {
    tbS.innerHTML = AppState.skillsList.map((s, i) => `
      <tr>
        <td class="cell-blue font-medium" contenteditable="true" spellcheck="false" onblur="AppState.skillsList[${i}]=this.innerText.trim();">${s}</td>
        <td class="text-center"><button class="btn-table-del" onclick="AppState.skillsList.splice(${i},1); renderSkillsFamilyJob();"><i class="fa-solid fa-trash-can"></i></button></td>
      </tr>
    `).join('');
  }

  const tbF = document.getElementById('tbody-family');
  if (tbF) {
    tbF.innerHTML = AppState.familyList.map((f, i) => `
      <tr>
        <td class="cell-blue font-medium" contenteditable="true" spellcheck="false" onblur="AppState.familyList[${i}]=this.innerText.trim();">${f}</td>
        <td class="text-center"><button class="btn-table-del" onclick="AppState.familyList.splice(${i},1); renderSkillsFamilyJob();"><i class="fa-solid fa-trash-can"></i></button></td>
      </tr>
    `).join('');
  }

  const tbJ = document.getElementById('tbody-job');
  if (tbJ) {
    tbJ.innerHTML = AppState.jobList.map((j, i) => `
      <tr>
        <td class="cell-blue font-medium" contenteditable="true" spellcheck="false" onblur="AppState.jobList[${i}]=this.innerText.trim();">${j}</td>
        <td class="text-center"><button class="btn-table-del" onclick="AppState.jobList.splice(${i},1); renderSkillsFamilyJob();"><i class="fa-solid fa-trash-can"></i></button></td>
      </tr>
    `).join('');
  }
}

window.addSkillRow = function() { AppState.skillsList.push("Kỹ năng mới"); renderSkillsFamilyJob(); };
window.addFamilyRow = function() { AppState.familyList.push("Hỗ trợ gia đình mới"); renderSkillsFamilyJob(); };
window.addJobRow = function() { AppState.jobList.push("Môi trường làm việc mới"); renderSkillsFamilyJob(); };

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

  renderCareerTables();
  renderCareerChart();
  renderDashboardMatrices();
  renderDashboardAllCharts();
  updatePlanTotals();
}

document.addEventListener('DOMContentLoaded', () => {
  renderSetupTables();
  renderPlanTables();
  renderTargetTables();
  renderGoogleFormSurvey();
  evaluateSurveys();
  renderCareerTables();
  renderTcGoalsFormTable();
  renderMonthView(AppState.currentMonth);
  syncGoalsToCards();
  recalculateAll();

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
        renderTargetTables();
        renderTcMatrixTable();
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
        renderTargetTables();
        renderTcMatrixTable();
        recalculateAll();
      }
    });
  }
});
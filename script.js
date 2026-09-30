/**
 * TOÀN BỘ LOGIC REACTIVE, TÍNH TOÁN TÀI CHÍNH & RENDER BIỂU ĐỒ
 */

const AppState = {
  currentYear: 2023,
  currentAge: 21,
  birthYear: 2002,
  currentMonth: 1,

  expenses: [
    'Mua thực phẩm', 'Mua đồ dùng trong nhà', 'Đi ăn ở ngoài',
    'Chi tiền phát triển bản thân', 'Chi tiền bảo hiểm',
    'Chi tiền điện, nước, internet, điện thoại, xăng xe',
    'Chi tiền giải trí, quà tặng', 'Chi tiền cho con học đại học', 'Chi tiền trả nợ', 'Chi tiền cho tặng gia đình'
  ],
  incomeList: ['Lương bố', 'Thu nhập từ kinh doanh của mẹ', 'Lãi tiền gửi', 'Lương công ty của chị gái'],
  planList: ['Mua sách', 'Khóa học ngắn hạn', 'Khóa học dài hạn', 'Tham gia các buổi diễn thuyết', 'Chi phát triển bản thân khác'],

  investProducts: [
    { name: 'ETF - ETFVFM', returnRate: 13.0, risk: 18.0 },
    { name: 'ETF - ETFFINLEAD', returnRate: 15.0, risk: 20.0 },
    { name: 'DCBC', returnRate: 16.0, risk: 20.0 },
    { name: 'DCDS', returnRate: 11.0, risk: 10.0 },
    { name: 'DCBF', returnRate: 9.0, risk: 8.0 },
    { name: 'Trái phiếu Techcombank', returnRate: 10.5, risk: 6.0 },
    { name: 'Trái phiếu FE Credit', returnRate: 10.0, risk: 8.0 },
    { name: 'Finhay', returnRate: 6.0, risk: 7.0 },
    { name: 'Bảo hiểm thuần túy', returnRate: 4.0, risk: 5.0 },
    { name: 'BH liên kết đầu tư', returnRate: 12.0, risk: 5.0 },
    { name: 'Tiền gửi ngân hàng', returnRate: 5.0, risk: 2.0 },
    { name: 'Cổ phiếu riêng lẻ', returnRate: 12.0, risk: 6.0 }
  ],

  debtTargets: [
    { age: 35, desc: 'Vay mua chung cư', val: 500.0 }
  ],
  investTargets: [
    { age: 25, desc: 'Du lịch xuyên Thái Lan', val: 50.0 },
    { age: 26, desc: 'Quỹ dự phòng tài chính', val: 100.0 },
    { age: 28, desc: 'Đám cưới', val: 200.0 },
    { age: 30, desc: 'Khởi nghiệp', val: 500.0 },
    { age: 38, desc: 'Mua chung cư', val: 1500.0 },
    { age: 46, desc: 'Cho con đi học đại học', val: 500.0 },
    { age: 50, desc: 'Hưu trí', val: 500.0 }
  ],

  skills: ['Sẵn sàng học hỏi cái mới', 'Nhiệt huyết trong công việc'],
  family: ['Ba mẹ có hỗ trợ mua chung cư , lo đám cưới'],
  job: [
    'Môi trường đa quốc gia, có nhiều cơ hội phát triển',
    'Môi trường làm việc có sự cạnh tranh gay gắt, áp lực KPI',
    'Có chế độ đãi ngộ tốt về lương thưởng, lương bổng'
  ],

  planIncome: [
    { name: 'Lương bố', plan: 25.0 },
    { name: 'Thu nhập từ kinh doanh của mẹ', plan: 9.0 },
    { name: 'Lãi tiền gửi', plan: 10.0 },
    { name: 'Lương công ty của chị gái', plan: 12.0 }
  ],
  planExpense: [
    { name: 'Mua thực phẩm', plan: 6.0, note: '' },
    { name: 'Mua đồ dùng trong nhà', plan: 1.0, note: '' },
    { name: 'Đi ăn ở ngoài', plan: 2.0, note: '' },
    { name: 'Chi tiền phát triển bản thân', plan: 3.5, note: '' },
    { name: 'Chi tiền bảo hiểm', plan: 0.0, note: '' },
    { name: 'Chi tiền điện, nước, internet, điện thoại, xăng xe', plan: 2.0, note: '' },
    { name: 'Chi tiền giải trí, quà tặng', plan: 3.0, note: '' },
    { name: 'Chi tiền cho con học đại học', plan: 8.0, note: '' },
    { name: 'Chi tiền trả nợ', plan: 8.5, note: '' },
    { name: 'Chi tiền cho tặng gia đình', plan: 1.0, note: '' }
  ],

  matrixIncome: {
    'Lương từ công ty': [20.0, 25.0, 18.0, 20.0, 25.0, 20.0, 20.0, 20.0, 20.0, 20.0, 20.0, 25.0],
    'Thu nhập khác': [4.0, 4.5, 5.7, 3.9, 7.8, 7.5, 9.0, 5.0, 7.0, 8.0, 4.0, 10.0]
  },

  matrixExpense: {
    'Mua thực phẩm': [5.5, 5.0, 6.8, 5.0, 5.4, 4.5, 5.5, 7.0, 4.2, 5.0, 5.0, 5.0],
    'Mua đồ dùng trong nhà': [0.3, 0.7, 1.1, 0.4, 1.0, 0.5, 2.5, 1.5, 1.5, 1.1, 0.4, 4.5],
    'Đi ăn ở ngoài': [0.8, 1.8, 0.5, 1.5, 1.3, 1.0, 0.5, 1.5, 1.0, 1.5, 2.5, 3.0],
    'Chi tiền phát triển bản thân': [1.1, 2.3, 1.5, 1.3, 2.0, 1.1, 1.1, 3.1, 0.8, 2.1, 1.5, 2.0],
    'Chi tiền bảo hiểm': [0.0, 0.0, 0.5, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
    'Chi tiền điện, nước, internet, điện thoại, xăng xe': [1.3, 1.6, 1.65, 1.35, 1.5, 1.75, 1.85, 2.65, 2.55, 1.35, 1.35, 1.55],
    'Chi tiền giải trí, quà tặng': [0.0, 0.0, 0.7, 0.0, 0.4, 0.0, 0.0, 0.5, 0.5, 0.0, 0.5, 2.5],
    'Chi tiền cho con': [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 1.0, 1.0, 0.5, 0.0, 0.0, 0.0],
    'Chi tiền trả nợ': [6.5, 6.5, 6.5, 6.5, 6.5, 6.5, 6.5, 6.5, 6.5, 6.5, 6.5, 6.5],
    'Chi tiền cho tặng gia đình': [2.0, 1.3, 0.0, 1.2, 0.5, 0.0, 0.1, 0.5, 0.5, 0.0, 0.0, 0.0]
  },

  matrixLearning: {
    'Mua sách': [0.1, 0.5, 0.3, 0.1, 0.3, 0.1, 0.5, 0.5, 0.5, 1.0, 0.5, 0.5],
    'Khóa học ngắn hạn': [1.0, 1.0, 1.2, 1.2, 1.7, 1.0, 0.6, 2.6, 0.3, 1.1, 1.0, 1.0],
    'Khóa học dài hạn': [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
    'Tham gia các buổi diễn thuyết': [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
    'Chi phát triển bản thân khác': [0.0, 0.8, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]
  },

  monthlyDetails: {
    1: {
      incomes: [
        { date: '15/1/2026', cat: 'Lương bố', desc: '', val: 25.0 },
        { date: '30/1/2026', cat: 'Thu nhập từ kinh doanh của mẹ', desc: '', val: 12.0 },
        { date: '14/1/2026', cat: 'Lương công ty của chị gái', desc: '', val: 15.0 }
      ],
      expenses: [
        { date: '1/1/2026', cat: 'Mua thực phẩm', desc: 'Mua rau củ quả, gạo', val: 7.5 },
        { date: '4/1/2026', cat: 'Mua đồ dùng trong nhà', desc: 'Mua máy ép', val: 0.3 },
        { date: '12/1/2026', cat: 'Chi tiền phát triển bản thân', desc: 'Học lập trình', val: 0.0 },
        { date: '10/1/2026', cat: 'Đi ăn ở ngoài', desc: '', val: 0.6 },
        { date: '28/1/2026', cat: 'Chi tiền điện, nước, internet, điện thoại, xăng xe', desc: 'Điện', val: 0.5 },
        { date: '29/1/2026', cat: 'Chi tiền điện, nước, internet, điện thoại, xăng xe', desc: 'Nước', val: 0.3 },
        { date: '30/1/2026', cat: 'Chi tiền điện, nước, internet, điện thoại, xăng xe', desc: 'Internet', val: 0.3 },
        { date: '15/1/2026', cat: 'Chi tiền điện, nước, internet, điện thoại, xăng xe', desc: 'Xăng', val: 0.2 },
        { date: '10/1/2026', cat: 'Chi tiền trả nợ', desc: '', val: 10.5 },
        { date: '5/1/2026', cat: 'Chi tiền cho tặng gia đình', desc: '', val: 2.0 },
        { date: '1/1/2026', cat: 'Chi tiền phát triển bản thân', desc: 'Mua sách', val: 0.1 },
        { date: '12/1/2026', cat: 'Chi tiền phát triển bản thân', desc: 'Học lập trình', val: 1.0 }
      ],
      reconIncomeNotes: {
        'Thu nhập từ kinh doanh của mẹ': { reason: 'Kinh doanh tốt', action: '' },
        'Lương công ty của chị gái': { reason: 'Thưởng kpi', action: '' }
      },
      reconExpenseNotes: {
        'Mua thực phẩm': { reason: 'Mua sắm tết', action: 'Giảm chi tiêu tháng sau' }
      },
      learningDetails: [
        { date: '01/01/2026', cat: 'Mua sách', desc: 'Sách tài chính', val: 0.10, expRes: 'Bổ sung kiến thức', actRes: 'Nâng cao trình độ chuyên môn' },
        { date: '12/01/2026', cat: 'Khóa học ngắn hạn', desc: 'Học lập trình', val: 1.00, expRes: 'Bổ sung kiến thức', actRes: 'Nâng cao trình độ chuyên môn' }
      ]
    }
  }
};

// Khởi tạo các tháng 2 đến 12 từ ma trận gốc
for (let m = 2; m <= 12; m++) {
  if (!AppState.monthlyDetails[m]) {
    AppState.monthlyDetails[m] = { 
      incomes: [
        { date: `15/${m < 10 ? '0' + m : m}/2026`, cat: 'Lương bố', desc: 'Lương định kỳ', val: 25.0 },
        { date: `30/${m < 10 ? '0' + m : m}/2026`, cat: 'Thu nhập từ kinh doanh của mẹ', desc: 'Kinh doanh', val: 10.0 }
      ], 
      expenses: [
        { date: `01/${m < 10 ? '0' + m : m}/2026`, cat: 'Mua thực phẩm', desc: 'Đi chợ', val: 5.5 },
        { date: `10/${m < 10 ? '0' + m : m}/2026`, cat: 'Chi tiền trả nợ', desc: 'Khoản vay', val: 8.5 },
        { date: `15/${m < 10 ? '0' + m : m}/2026`, cat: 'Chi tiền điện, nước, internet, điện thoại, xăng xe', desc: 'Hóa đơn', val: 1.8 }
      ], 
      reconIncomeNotes: {}, 
      reconExpenseNotes: {}, 
      learningDetails: [
        { date: `05/${m < 10 ? '0' + m : m}/2026`, cat: 'Mua sách', desc: 'Sách chuyên môn', val: 0.20, expRes: 'Nghiên cứu', actRes: 'Ứng dụng' }
      ] 
    };
  }
}

// Đồng bộ từ chi tiết tháng sang ma trận tổng hợp 12 tháng
function syncMonthlyDetailsToMatrix() {
  Object.keys(AppState.matrixIncome).forEach(cat => {
    AppState.matrixIncome[cat] = new Array(12).fill(0);
  });
  Object.keys(AppState.matrixExpense).forEach(cat => {
    AppState.matrixExpense[cat] = new Array(12).fill(0);
  });

  for (let m = 1; m <= 12; m++) {
    const md = AppState.monthlyDetails[m];
    if (!md) continue;
    md.incomes.forEach(item => {
      if (!AppState.matrixIncome[item.cat]) {
        AppState.matrixIncome[item.cat] = new Array(12).fill(0);
      }
      AppState.matrixIncome[item.cat][m - 1] += item.val;
    });

    md.expenses.forEach(item => {
      if (!AppState.matrixExpense[item.cat]) {
        AppState.matrixExpense[item.cat] = new Array(12).fill(0);
      }
      AppState.matrixExpense[item.cat][m - 1] += item.val;
    });
  }
}

// Chuyển đổi qua lại giữa các tab chính
window.switchTab = function(tabId) {
  document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
  const btn = document.getElementById(`btn-${tabId}`);
  if (btn) btn.classList.add('active');

  const titlesMap = {
    'tab-tukhoa': 'TỪ KHÓA',
    'tab-dashboard': 'THEO DÕI TÀI CHÍNH CÁ NHÂN',
    'tab-muctieu-bt': 'XÁC ĐỊNH MỤC TIÊU BẢN THÂN',
    'tab-muctieu-tc': 'XÁC ĐỊNH MỤC TIÊU TÀI CHÍNH',
    'tab-candoi': 'CÂN ĐỐI LỘ TRÌNH NGHỀ NGHIỆP',
    'tab-kehoach': 'KẾ HOẠCH THU NHẬP VÀ CHI TIÊU',
    'tab-khaosat': 'BẢNG KHẢO SÁT ĐÁNH GIÁ BẢN THÂN'
  };

  const titleEl = document.getElementById('current-title');
  if (titleEl) titleEl.textContent = titlesMap[tabId] || 'TÀI CHÍNH CÁ NHÂN';

  document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
  const targetPane = document.getElementById(tabId);
  if (targetPane) {
    targetPane.classList.add('active');
    if (tabId === 'tab-dashboard') {
      renderDashboardMatrices();
      updateDashboardCharts();
    }
  }
};

// Chuyển tab tháng 1..12
window.switchMonthTab = function(m) {
  AppState.currentMonth = m;
  document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
  const mBtn = document.getElementById(`btn-month-${m}`);
  if (mBtn) mBtn.classList.add('active');

  const titleEl = document.getElementById('current-title');
  if (titleEl) titleEl.textContent = `THEO DÕI THU - CHI THÁNG ${m}`;

  document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
  const monthPane = document.getElementById('tab-month');
  if (monthPane) monthPane.classList.add('active');

  renderMonthView(m);
  setTimeout(() => {
    renderMonthHorizontalBarChart();
  }, 60);
};

// Chuyển giữa Phần 1 và Phần 2 của tháng
window.switchMonthSection = function(secNum) {
  const btn1 = document.getElementById('btn-month-sec1');
  const btn2 = document.getElementById('btn-month-sec2');
  const pane1 = document.getElementById('month-sec-1');
  const pane2 = document.getElementById('month-sec-2');

  if (secNum === 1) {
    if (btn1) btn1.classList.add('active');
    if (btn2) btn2.classList.remove('active');
    if (pane1) pane1.classList.add('active');
    if (pane2) pane2.classList.remove('active');
    setTimeout(() => {
      renderMonthHorizontalBarChart();
    }, 50);
  } else {
    if (btn2) btn2.classList.add('active');
    if (btn1) btn1.classList.remove('active');
    if (pane2) pane2.classList.add('active');
    if (pane1) pane1.classList.remove('active');
  }
};

// Tạo đồ thị xu hướng Sparkline SVG
function createSparkline(arr, width = 75, height = 18, color = '#0284c7') {
  if (!arr || arr.length === 0) return '';
  const min = Math.min(...arr);
  const max = Math.max(...arr);
  const range = max - min === 0 ? 1 : max - min;
  const step = width / Math.max(1, arr.length - 1);

  const points = arr.map((v, i) => {
    const x = i * step;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');

  return `
    <svg class="sparkline-svg" width="${width}" height="${height}">
      <polyline fill="none" stroke="${color}" stroke-width="1.6" points="${points}" />
    </svg>
  `;
}

// Khởi tạo DOM khi load trang
document.addEventListener('DOMContentLoaded', () => {
  renderSetupTables();
  renderTargetTables();
  renderSkillsFamilyJob();
  renderPlanTables();
  renderMonthView(AppState.currentMonth);
  evaluateSurveys();
  recalculateAll();

  // Đổi năm / tuổi
  const inputYearEl = document.getElementById('input-year');
  const inputAgeEl = document.getElementById('input-age');

  if (inputYearEl) {
    inputYearEl.addEventListener('input', () => {
      const val = parseInt(inputYearEl.innerText.trim(), 10);
      if (!isNaN(val) && val > 1900 && val < 2100) {
        AppState.currentYear = val;
        AppState.currentAge = AppState.currentYear - AppState.birthYear;
        if (inputAgeEl) inputAgeEl.innerText = AppState.currentAge;
        syncYearLabels();
        recalculateAll();
      }
    });
  }

  if (inputAgeEl) {
    inputAgeEl.addEventListener('input', () => {
      const val = parseInt(inputAgeEl.innerText.trim(), 10);
      if (!isNaN(val) && val > 0 && val < 120) {
        AppState.currentAge = val;
        AppState.birthYear = AppState.currentYear - AppState.currentAge;
        recalculateAll();
      }
    });
  }

  // Lắng nghe radio button bảng khảo sát
  document.addEventListener('change', (e) => {
    if (e.target && e.target.type === 'radio' && (e.target.name.startsWith('ks1_') || e.target.name.startsWith('ks2_'))) {
      evaluateSurveys();
    }
  });
});

function syncYearLabels() {
  document.querySelectorAll('.dynamic-year').forEach(el => {
    el.textContent = AppState.currentYear;
  });
}

// ==================== DASHBOARD: 4 BẢNG MA TRẬN 12 THÁNG ====================
function renderDashboardMatrices() {
  syncMonthlyDetailsToMatrix();

  const incMonthlySums = new Array(12).fill(0);
  const tbInc = document.getElementById('tbody-db-income');
  if (tbInc) {
    let incRows = '';
    Object.entries(AppState.matrixIncome).forEach(([cat, vals]) => {
      const rowSum = vals.reduce((a, b) => a + b, 0);
      vals.forEach((v, idx) => { incMonthlySums[idx] += v; });
      const cells = vals.map(v => `<td>${v.toFixed(1)}</td>`).join('');
      incRows += `
        <tr>
          <td>${cat}</td>
          ${cells}
          <td class="font-bold text-green">${rowSum.toFixed(1)}</td>
          <td>${createSparkline(vals, 75, 18, '#16a34a')}</td>
        </tr>
      `;
    });
    tbInc.innerHTML = incRows;
  }

  const expMonthlySums = new Array(12).fill(0);
  const tbExp = document.getElementById('tbody-db-expense');
  if (tbExp) {
    let expRows = '';
    Object.entries(AppState.matrixExpense).forEach(([cat, vals]) => {
      const rowSum = vals.reduce((a, b) => a + b, 0);
      vals.forEach((v, idx) => { expMonthlySums[idx] += v; });
      const cells = vals.map(v => `<td>${v.toFixed(2)}</td>`).join('');
      expRows += `
        <tr>
          <td>${cat}</td>
          ${cells}
          <td class="font-bold text-red">${rowSum.toFixed(2)}</td>
          <td>${createSparkline(vals, 75, 18, '#dc2626')}</td>
        </tr>
      `;
    });
    tbExp.innerHTML = expRows;
  }

  // Tfoot Thu nhập
  const tfInc = document.getElementById('tfoot-db-income-total');
  if (tfInc) {
    const totalYearInc = incMonthlySums.reduce((a, b) => a + b, 0);
    tfInc.innerHTML = `
      <td class="font-bold">Tổng thu nhập</td>
      ${incMonthlySums.map(v => `<td>${v.toFixed(1)}</td>`).join('')}
      <td class="font-bold text-green">${totalYearInc.toFixed(2)}</td>
      <td>${createSparkline(incMonthlySums, 75, 18, '#16a34a')}</td>
    `;
  }

  // Kế hoạch chi tiêu và lũy kế chênh lệch
  const totalMonthlyPlanExp = AppState.planExpense.reduce((a, b) => a + b.plan, 0);
  const planExp12 = new Array(12).fill(totalMonthlyPlanExp);
  const cumDiff = [];
  let cumSum = 0;
  for (let i = 0; i < 12; i++) {
    const diff = planExp12[i] - expMonthlySums[i];
    cumSum += diff;
    cumDiff.push(cumSum);
  }

  const tfExpTotal = document.getElementById('tfoot-db-expense-total');
  const tfExpPlan = document.getElementById('tfoot-db-expense-plan');
  const tfExpDiff = document.getElementById('tfoot-db-expense-cumdiff');

  if (tfExpTotal) {
    const totalYearExp = expMonthlySums.reduce((a, b) => a + b, 0);
    tfExpTotal.innerHTML = `
      <td class="font-bold">Tổng chi tiêu</td>
      ${expMonthlySums.map(v => `<td>${v.toFixed(2)}</td>`).join('')}
      <td class="font-bold text-red">${totalYearExp.toFixed(2)}</td>
      <td>${createSparkline(expMonthlySums, 75, 18, '#dc2626')}</td>
    `;
  }

  if (tfExpPlan) {
    tfExpPlan.innerHTML = `
      <td>Kế hoạch chi tiêu</td>
      ${planExp12.map(v => `<td>${v.toFixed(1)}</td>`).join('')}
      <td>${(totalMonthlyPlanExp * 12).toFixed(1)}</td>
      <td>-</td>
    `;
  }

  if (tfExpDiff) {
    tfExpDiff.innerHTML = `
      <td>Lũy kế chênh lệch</td>
      ${cumDiff.map(v => `<td class="${v >= 0 ? 'text-green font-bold' : 'text-red font-bold'}">${v >= 0 ? '+' : ''}${v.toFixed(2)}</td>`).join('')}
      <td>-</td>
      <td>-</td>
    `;
  }

  // Tiết kiệm
  const savingsMonthly = incMonthlySums.map((inc, i) => inc - expMonthlySums[i]);
  const totalYearSav = savingsMonthly.reduce((a, b) => a + b, 0);
  const trSav = document.getElementById('trow-db-savings');
  if (trSav) {
    trSav.innerHTML = `
      <td class="font-bold">Giá trị</td>
      ${savingsMonthly.map(v => `<td>${v.toFixed(2)}</td>`).join('')}
      <td class="font-bold text-blue">${totalYearSav.toFixed(2)}</td>
      <td>${createSparkline(savingsMonthly, 75, 18, '#2563eb')}</td>
    `;
  }

  // Chi phí phát triển bản thân
  const tbLrn = document.getElementById('tbody-db-learning');
  const lrnMonthlySums = new Array(12).fill(0);
  if (tbLrn) {
    let learnRows = '';
    Object.entries(AppState.matrixLearning).forEach(([cat, vals]) => {
      const sum = vals.reduce((a, b) => a + b, 0);
      vals.forEach((v, idx) => { lrnMonthlySums[idx] += v; });
      const cells = vals.map(v => `<td>${v.toFixed(2)}</td>`).join('');
      learnRows += `
        <tr>
          <td>${cat}</td>
          ${cells}
          <td class="font-bold">${sum.toFixed(2)}</td>
          <td>${createSparkline(vals, 75, 18, '#ea580c')}</td>
        </tr>
      `;
    });
    tbLrn.innerHTML = learnRows;
  }

  const tfLrnTotal = document.getElementById('tfoot-db-learning-total');
  if (tfLrnTotal) {
    const totalYearLrn = lrnMonthlySums.reduce((a, b) => a + b, 0);
    tfLrnTotal.innerHTML = `
      <td class="font-bold">Tổng</td>
      ${lrnMonthlySums.map(v => `<td>${v.toFixed(2)}</td>`).join('')}
      <td class="font-bold text-red">${totalYearLrn.toFixed(2)}</td>
      <td>${createSparkline(lrnMonthlySums, 75, 18, '#ea580c')}</td>
    `;
  }
}

// ==================== BẢNG TỪ KHÓA ====================
function renderSetupTables() {
  const tbExp = document.getElementById('tbody-expenses');
  if (tbExp) {
    tbExp.innerHTML = AppState.expenses.map((item, idx) => `
      <tr>
        <td>${idx + 1}</td>
        <td class="cell-blue" contenteditable="true" spellcheck="false" onblur="updateExpenseItem(${idx}, this.innerText)">${item}</td>
      </tr>
    `).join('');
  }

  const tbInc = document.getElementById('tbody-income');
  if (tbInc) {
    tbInc.innerHTML = AppState.incomeList.map((item, idx) => `
      <tr>
        <td>${idx + 1}</td>
        <td class="cell-blue" contenteditable="true" spellcheck="false" onblur="updateIncomeItem(${idx}, this.innerText)">${item}</td>
      </tr>
    `).join('');
  }

  const tbLrn = document.getElementById('tbody-learning');
  if (tbLrn) {
    tbLrn.innerHTML = AppState.planList.map((item, idx) => `
      <tr>
        <td>${idx + 1}</td>
        <td class="cell-blue" contenteditable="true" spellcheck="false" onblur="updatePlanListItem(${idx}, this.innerText)">${item}</td>
      </tr>
    `).join('');
  }

  const tbInv = document.getElementById('tbody-invest');
  if (tbInv) {
    tbInv.innerHTML = AppState.investProducts.map((p, idx) => `
      <tr>
        <td>${idx + 1}</td>
        <td class="cell-blue ${p.name === 'DCDS' ? 'excel-active-cell' : ''}" contenteditable="true" spellcheck="false" onblur="updateInvestName(${idx}, this.innerText)">${p.name}</td>
        <td class="text-right cell-blue" contenteditable="true" spellcheck="false" onblur="updateProductRate(${idx}, this.innerText)">${p.returnRate.toFixed(1)}%</td>
        <td class="text-right cell-blue" contenteditable="true" spellcheck="false" onblur="updateProductRisk(${idx}, this.innerText)">${p.risk.toFixed(1)}%</td>
      </tr>
    `).join('');
  }
}

window.updateExpenseItem = function(idx, val) { 
  const oldVal = AppState.expenses[idx];
  const newVal = val.trim();
  AppState.expenses[idx] = newVal;
  if (oldVal !== newVal && AppState.matrixExpense[oldVal]) {
    AppState.matrixExpense[newVal] = AppState.matrixExpense[oldVal];
    delete AppState.matrixExpense[oldVal];
  }
  recalculateAll(); 
};

window.updateIncomeItem = function(idx, val) { 
  const oldVal = AppState.incomeList[idx];
  const newVal = val.trim();
  AppState.incomeList[idx] = newVal;
  if (oldVal !== newVal && AppState.matrixIncome[oldVal]) {
    AppState.matrixIncome[newVal] = AppState.matrixIncome[oldVal];
    delete AppState.matrixIncome[oldVal];
  }
  recalculateAll(); 
};

window.updatePlanListItem = function(idx, val) { AppState.planList[idx] = val.trim(); };
window.updateInvestName = function(idx, val) { AppState.investProducts[idx].name = val.trim(); };
window.updateProductRate = function(idx, val) {
  AppState.investProducts[idx].returnRate = parseFloat(val.replace(/[^0-9.-]/g, '')) || 0;
  recalculateAll();
};
window.updateProductRisk = function(idx, val) {
  AppState.investProducts[idx].risk = parseFloat(val.replace(/[^0-9.-]/g, '')) || 0;
};

window.addExpenseRow = function() { 
  const name = `Khoản chi mới ${AppState.expenses.length + 1}`;
  AppState.expenses.push(name); 
  AppState.matrixExpense[name] = new Array(12).fill(0);
  renderSetupTables(); 
};

window.addIncomeRow = function() { 
  const name = `Nguồn thu mới ${AppState.incomeList.length + 1}`;
  AppState.incomeList.push(name); 
  AppState.matrixIncome[name] = new Array(12).fill(0);
  renderSetupTables(); 
};

window.addPlanRow = function() { 
  AppState.planList.push(`Kế hoạch mới ${AppState.planList.length + 1}`); 
  renderSetupTables(); 
};

window.addInvestRow = function() { 
  AppState.investProducts.push({ name: 'Sản phẩm mới', returnRate: 10.0, risk: 10.0 }); 
  renderSetupTables(); 
  recalculateAll(); 
};

// ==================== MỤC TIÊU BẢN THÂN ====================
function renderTargetTables() {
  const tbDebt = document.getElementById('tbody-debt-target');
  if (tbDebt) {
    tbDebt.innerHTML = AppState.debtTargets.map((d, i) => `
      <tr>
        <td class="cell-green-light text-center font-bold">${i + 1}</td>
        <td class="cell-green-light text-center cell-blue" contenteditable="true" spellcheck="false" onblur="updateDebtTargetAge(${i}, this.innerText)">${d.age}</td>
        <td class="cell-green-light cell-blue" contenteditable="true" spellcheck="false" onblur="updateDebtTargetDesc(${i}, this.innerText)">${d.desc}</td>
        <td class="cell-green-light text-right cell-blue font-bold" contenteditable="true" spellcheck="false" onblur="updateDebtTargetVal(${i}, this.innerText)">${d.val.toFixed(2)}</td>
      </tr>
    `).join('');
  }

  const tbInv = document.getElementById('tbody-invest-target');
  if (tbInv) {
    tbInv.innerHTML = AppState.investTargets.map((inv, i) => `
      <tr>
        <td class="cell-green-light text-center font-bold">${i + 1}</td>
        <td class="cell-green-light text-center cell-blue" contenteditable="true" spellcheck="false" onblur="updateInvestTargetAge(${i}, this.innerText)">${inv.age}</td>
        <td class="cell-green-light cell-blue" contenteditable="true" spellcheck="false" onblur="updateInvestTargetDesc(${i}, this.innerText)">${inv.desc}</td>
        <td class="cell-green-light text-right cell-blue font-bold" contenteditable="true" spellcheck="false" onblur="updateInvestTargetVal(${i}, this.innerText)">${inv.val.toLocaleString()}</td>
      </tr>
    `).join('');
  }
}

window.updateDebtTargetAge = function(i, text) { AppState.debtTargets[i].age = parseInt(text, 10) || 0; };
window.updateDebtTargetDesc = function(i, text) { AppState.debtTargets[i].desc = text.trim(); };
window.updateDebtTargetVal = function(i, text) { 
  AppState.debtTargets[i].val = parseFloat(text.replace(/,/g, '')) || 0; 
  recalculateAll(); 
};

window.updateInvestTargetAge = function(i, text) { AppState.investTargets[i].age = parseInt(text, 10) || 0; };
window.updateInvestTargetDesc = function(i, text) { AppState.investTargets[i].desc = text.trim(); };
window.updateInvestTargetVal = function(i, text) { 
  AppState.investTargets[i].val = parseFloat(text.replace(/,/g, '')) || 0; 
  recalculateAll(); 
};

window.addDebtTargetRow = function() { 
  AppState.debtTargets.push({ age: 35, desc: 'Mục tiêu nợ mới', val: 100.0 }); 
  renderTargetTables(); 
  recalculateAll(); 
};

window.addInvestTargetRow = function() { 
  AppState.investTargets.push({ age: 40, desc: 'Mục tiêu tích lũy mới', val: 200.0 }); 
  renderTargetTables(); 
  recalculateAll(); 
};

function renderSkillsFamilyJob() {
  const tbS = document.getElementById('tbody-skills');
  const tbF = document.getElementById('tbody-family');
  const tbJ = document.getElementById('tbody-job');

  if (tbS) tbS.innerHTML = AppState.skills.map(s => `<tr><td class="cell-green-light cell-blue font-medium" contenteditable="true" spellcheck="false">${s}</td></tr>`).join('');
  if (tbF) tbF.innerHTML = AppState.family.map(f => `<tr><td class="cell-green-light cell-blue font-medium" contenteditable="true" spellcheck="false">${f}</td></tr>`).join('');
  if (tbJ) tbJ.innerHTML = AppState.job.map(j => `<tr><td class="cell-green-light cell-blue font-medium" contenteditable="true" spellcheck="false">${j}</td></tr>`).join('');
}

window.addSkillRow = function() { AppState.skills.push('Kỹ năng mới'); renderSkillsFamilyJob(); };
window.addFamilyRow = function() { AppState.family.push('Hỗ trợ gia đình mới'); renderSkillsFamilyJob(); };
window.addJobRow = function() { AppState.job.push('Môi trường nghề nghiệp mới'); renderSkillsFamilyJob(); };

// ==================== KẾ HOẠCH HÀNG THÁNG (BUDGET) ====================
function renderPlanTables() {
  const tbInc = document.getElementById('tbody-plan-inc');
  if (tbInc) {
    tbInc.innerHTML = AppState.planIncome.map((item, i) => `
      <tr>
        <td class="text-center">${i + 1}</td>
        <td>${item.name}</td>
        <td class="text-right cell-blue font-bold" contenteditable="true" spellcheck="false" onblur="updatePlanIncVal(${i}, this.innerText)">${item.plan.toFixed(2)}</td>
      </tr>
    `).join('');
  }

  const tbExp = document.getElementById('tbody-plan-exp');
  if (tbExp) {
    tbExp.innerHTML = AppState.planExpense.map((item, i) => `
      <tr>
        <td class="text-center">${i + 1}</td>
        <td>${item.name}</td>
        <td class="text-right cell-blue font-bold" contenteditable="true" spellcheck="false" onblur="updatePlanExpVal(${i}, this.innerText)">${item.plan.toFixed(2)}</td>
        <td class="cell-blue" contenteditable="true" spellcheck="false">${item.note}</td>
      </tr>
    `).join('');
  }
}

window.updatePlanIncVal = function(i, text) { AppState.planIncome[i].plan = parseFloat(text) || 0; recalculateAll(); };
window.updatePlanExpVal = function(i, text) { AppState.planExpense[i].plan = parseFloat(text) || 0; recalculateAll(); };

// ==================== THEO DÕI THU CHI CHI TIẾT TỪNG THÁNG ====================
function renderMonthView(m) {
  const titleEl = document.getElementById('current-title');
  if (titleEl && document.getElementById('tab-month').classList.contains('active')) {
    titleEl.textContent = `THEO DÕI THU - CHI THÁNG ${m}`;
  }

  const mData = AppState.monthlyDetails[m] || { incomes: [], expenses: [], learningDetails: [] };
  if (!mData.reconIncomeNotes) mData.reconIncomeNotes = {};
  if (!mData.reconExpenseNotes) mData.reconExpenseNotes = {};
  if (!mData.learningDetails) mData.learningDetails = [];

  // 1. Render Nhật ký thu nhập
  const tbInc = document.getElementById('tbody-m-detail-income');
  if (tbInc) {
    tbInc.innerHTML = mData.incomes.map((inc, i) => `
      <tr>
        <td class="cell-blue text-center" contenteditable="true" spellcheck="false" onblur="updateMonthIncDate(${m}, ${i}, this.innerText)">${inc.date}</td>
        <td class="cell-blue" contenteditable="true" spellcheck="false" onblur="updateMonthIncCat(${m}, ${i}, this.innerText)">${inc.cat}</td>
        <td class="cell-blue" contenteditable="true" spellcheck="false" onblur="updateMonthIncDesc(${m}, ${i}, this.innerText)">${inc.desc}</td>
        <td class="text-right cell-blue font-bold" contenteditable="true" spellcheck="false" onblur="updateMonthIncVal(${m}, ${i}, this.innerText)">${inc.val.toFixed(1)}</td>
        <td class="text-center"><button class="btn-table-del" onclick="deleteMonthIncomeRow(${m}, ${i})"><i class="fa-solid fa-trash-can"></i></button></td>
      </tr>
    `).join('');
  }

  // 2. Render Nhật ký chi tiêu
  const tbExp = document.getElementById('tbody-m-detail-expense');
  if (tbExp) {
    tbExp.innerHTML = mData.expenses.map((exp, i) => `
      <tr>
        <td class="cell-blue text-center" contenteditable="true" spellcheck="false" onblur="updateMonthExpDate(${m}, ${i}, this.innerText)">${exp.date}</td>
        <td class="cell-blue" contenteditable="true" spellcheck="false" onblur="updateMonthExpCat(${m}, ${i}, this.innerText)">${exp.cat}</td>
        <td class="cell-blue" contenteditable="true" spellcheck="false" onblur="updateMonthExpDesc(${m}, ${i}, this.innerText)">${exp.desc}</td>
        <td class="text-right cell-blue font-bold" contenteditable="true" spellcheck="false" onblur="updateMonthExpVal(${m}, ${i}, this.innerText)">${exp.val.toFixed(1)}</td>
        <td class="text-center"><button class="btn-table-del" onclick="deleteMonthExpenseRow(${m}, ${i})"><i class="fa-solid fa-trash-can"></i></button></td>
      </tr>
    `).join('');
  }

  // 3. Render Đối soát Kế hoạch vs Thực tế
  renderReconciliationTable(m);

  // 4. Render Phần 2: Phát triển bản thân
  renderMonthLearningSection(m);
}

function renderReconciliationTable(m) {
  const mData = AppState.monthlyDetails[m] || { incomes: [], expenses: [] };
  if (!mData.reconIncomeNotes) mData.reconIncomeNotes = {};
  if (!mData.reconExpenseNotes) mData.reconExpenseNotes = {};

  const actIncMap = {};
  mData.incomes.forEach(x => { actIncMap[x.cat] = (actIncMap[x.cat] || 0) + x.val; });

  const actExpMap = {};
  mData.expenses.forEach(x => { actExpMap[x.cat] = (actExpMap[x.cat] || 0) + x.val; });

  // Đối soát Thu nhập: Chênh lệch = Thực tế - Kế hoạch
  let incRows = '';
  let sumPlanInc = 0;
  let sumActInc = 0;
  AppState.planIncome.forEach(p => {
    const act = actIncMap[p.name] || 0;
    const diff = act - p.plan;
    sumPlanInc += p.plan;
    sumActInc += act;
    const note = mData.reconIncomeNotes[p.name] || { reason: '', action: '' };

    incRows += `
      <tr>
        <td>${p.name}</td>
        <td class="text-right">${p.plan > 0 ? p.plan.toFixed(1) : '-'}</td>
        <td class="text-right font-bold">${act > 0 ? act.toFixed(1) : '-'}</td>
        <td class="text-right font-bold ${diff >= 0 ? 'text-green' : 'text-red'}">
          ${diff === 0 ? '-' : (diff > 0 ? diff.toFixed(1) : `(${Math.abs(diff).toFixed(1)})`)}
        </td>
        <td class="cell-blue" contenteditable="true" spellcheck="false" onblur="updateReconIncReason(${m}, '${p.name}', this.innerText)">${note.reason || ''}</td>
        <td class="cell-blue" contenteditable="true" spellcheck="false" onblur="updateReconIncAction(${m}, '${p.name}', this.innerText)">${note.action || ''}</td>
      </tr>
    `;
  });
  const tbReconInc = document.getElementById('tbody-m-recon-income');
  if (tbReconInc) tbReconInc.innerHTML = incRows;

  const totalIncDiff = sumActInc - sumPlanInc;
  const tfPlanInc = document.getElementById('tfoot-recon-inc-plan');
  const tfActInc = document.getElementById('tfoot-recon-inc-act');
  const tfDiffInc = document.getElementById('tfoot-recon-inc-diff');
  const tfIncDetailTotal = document.getElementById('tfoot-m-inc-total');

  if (tfPlanInc) tfPlanInc.textContent = sumPlanInc.toFixed(1);
  if (tfActInc) tfActInc.textContent = sumActInc.toFixed(1);
  if (tfIncDetailTotal) tfIncDetailTotal.textContent = sumActInc.toFixed(1);
  if (tfDiffInc) {
    tfDiffInc.textContent = totalIncDiff >= 0 ? totalIncDiff.toFixed(1) : `(${Math.abs(totalIncDiff).toFixed(1)})`;
    tfDiffInc.className = `text-right font-bold ${totalIncDiff >= 0 ? 'text-green' : 'text-red'}`;
  }

  // Đối soát Chi tiêu: Chênh lệch = Kế hoạch - Thực tế
  let expRows = '';
  let sumPlanExp = 0;
  let sumActExp = 0;
  AppState.planExpense.forEach(p => {
    const act = actExpMap[p.name] || 0;
    const diff = p.plan - act;
    sumPlanExp += p.plan;
    sumActExp += act;
    const note = mData.reconExpenseNotes[p.name] || { reason: '', action: '' };

    expRows += `
      <tr>
        <td>${p.name}</td>
        <td class="text-right">${p.plan > 0 ? p.plan.toFixed(1) : '-'}</td>
        <td class="text-right font-bold">${act > 0 ? act.toFixed(1) : '-'}</td>
        <td class="text-right font-bold ${diff >= 0 ? 'text-green' : 'text-red'}">
          ${diff === 0 ? '-' : (diff > 0 ? diff.toFixed(1) : `(${Math.abs(diff).toFixed(1)})`)}
        </td>
        <td class="cell-blue" contenteditable="true" spellcheck="false" onblur="updateReconExpReason(${m}, '${p.name}', this.innerText)">${note.reason || ''}</td>
        <td class="cell-blue" contenteditable="true" spellcheck="false" onblur="updateReconExpAction(${m}, '${p.name}', this.innerText)">${note.action || ''}</td>
      </tr>
    `;
  });
  const tbReconExp = document.getElementById('tbody-m-recon-expense');
  if (tbReconExp) tbReconExp.innerHTML = expRows;

  const totalExpDiff = sumPlanExp - sumActExp;
  const tfPlanExp = document.getElementById('tfoot-recon-exp-plan');
  const tfActExp = document.getElementById('tfoot-recon-exp-act');
  const tfDiffExp = document.getElementById('tfoot-recon-exp-diff');
  const tfExpDetailTotal = document.getElementById('tfoot-m-exp-total');

  if (tfPlanExp) tfPlanExp.textContent = sumPlanExp.toFixed(1);
  if (tfActExp) tfActExp.textContent = sumActExp.toFixed(1);
  if (tfExpDetailTotal) tfExpDetailTotal.textContent = sumActExp.toFixed(1);
  if (tfDiffExp) {
    tfDiffExp.textContent = totalExpDiff >= 0 ? totalExpDiff.toFixed(1) : `(${Math.abs(totalExpDiff).toFixed(1)})`;
    tfDiffExp.className = `text-right font-bold ${totalExpDiff >= 0 ? 'text-green' : 'text-red'}`;
  }

  // 3 ô KPI trên cùng
  const savings = Math.round(sumActInc - sumActExp);
  const sumIncEl = document.getElementById('m-summary-income');
  const sumExpEl = document.getElementById('m-summary-expense');
  const sumSavEl = document.getElementById('m-summary-savings');

  if (sumIncEl) sumIncEl.textContent = Math.round(sumActInc);
  if (sumExpEl) sumExpEl.textContent = Math.round(sumActExp);
  if (sumSavEl) sumSavEl.textContent = savings;
}

window.addMonthDetailIncomeRow = function() {
  const m = AppState.currentMonth;
  if (!AppState.monthlyDetails[m]) AppState.monthlyDetails[m] = { incomes: [], expenses: [] };
  const firstCat = AppState.planIncome[0]?.name || 'Lương bố';
  AppState.monthlyDetails[m].incomes.push({ 
    date: `15/1/2026`, 
    cat: firstCat, 
    desc: 'Khoản thu mới', 
    val: 2.0 
  });
  renderMonthView(m);
  renderMonthHorizontalBarChart();
  recalculateAll();
};

window.addMonthDetailExpenseRow = function() {
  const m = AppState.currentMonth;
  if (!AppState.monthlyDetails[m]) AppState.monthlyDetails[m] = { incomes: [], expenses: [] };
  const firstCat = AppState.planExpense[0]?.name || 'Mua thực phẩm';
  AppState.monthlyDetails[m].expenses.push({ 
    date: `10/1/2026`, 
    cat: firstCat, 
    desc: 'Khoản chi mới', 
    val: 1.0 
  });
  renderMonthView(m);
  renderMonthHorizontalBarChart();
  recalculateAll();
};

window.deleteMonthIncomeRow = function(m, i) {
  if (AppState.monthlyDetails[m]) {
    AppState.monthlyDetails[m].incomes.splice(i, 1);
    renderMonthView(m);
    renderMonthHorizontalBarChart();
    recalculateAll();
  }
};

window.deleteMonthExpenseRow = function(m, i) {
  if (AppState.monthlyDetails[m]) {
    AppState.monthlyDetails[m].expenses.splice(i, 1);
    renderMonthView(m);
    renderMonthHorizontalBarChart();
    recalculateAll();
  }
};

window.updateMonthIncDate = function(m, i, text) { AppState.monthlyDetails[m].incomes[i].date = text.trim(); };
window.updateMonthIncCat = function(m, i, text) { AppState.monthlyDetails[m].incomes[i].cat = text.trim(); recalculateAll(); renderMonthView(m); };
window.updateMonthIncDesc = function(m, i, text) { AppState.monthlyDetails[m].incomes[i].desc = text.trim(); };
window.updateMonthExpDate = function(m, i, text) { AppState.monthlyDetails[m].expenses[i].date = text.trim(); };
window.updateMonthExpCat = function(m, i, text) { AppState.monthlyDetails[m].expenses[i].cat = text.trim(); recalculateAll(); renderMonthView(m); renderMonthHorizontalBarChart(); };
window.updateMonthExpDesc = function(m, i, text) { AppState.monthlyDetails[m].expenses[i].desc = text.trim(); };

window.updateMonthIncVal = function(m, i, text) {
  if (AppState.monthlyDetails[m] && AppState.monthlyDetails[m].incomes[i]) {
    AppState.monthlyDetails[m].incomes[i].val = parseFloat(text) || 0;
  }
  recalculateAll();
  renderMonthView(m);
};

window.updateMonthExpVal = function(m, i, text) {
  if (AppState.monthlyDetails[m] && AppState.monthlyDetails[m].expenses[i]) {
    AppState.monthlyDetails[m].expenses[i].val = parseFloat(text) || 0;
  }
  recalculateAll();
  renderMonthView(m);
  renderMonthHorizontalBarChart();
};

window.updateReconIncReason = function(m, cat, val) {
  if (!AppState.monthlyDetails[m].reconIncomeNotes[cat]) AppState.monthlyDetails[m].reconIncomeNotes[cat] = { reason: '', action: '' };
  AppState.monthlyDetails[m].reconIncomeNotes[cat].reason = val.trim();
};
window.updateReconIncAction = function(m, cat, val) {
  if (!AppState.monthlyDetails[m].reconIncomeNotes[cat]) AppState.monthlyDetails[m].reconIncomeNotes[cat] = { reason: '', action: '' };
  AppState.monthlyDetails[m].reconIncomeNotes[cat].action = val.trim();
};
window.updateReconExpReason = function(m, cat, val) {
  if (!AppState.monthlyDetails[m].reconExpenseNotes[cat]) AppState.monthlyDetails[m].reconExpenseNotes[cat] = { reason: '', action: '' };
  AppState.monthlyDetails[m].reconExpenseNotes[cat].reason = val.trim();
};
window.updateReconExpAction = function(m, cat, val) {
  if (!AppState.monthlyDetails[m].reconExpenseNotes[cat]) AppState.monthlyDetails[m].reconExpenseNotes[cat] = { reason: '', action: '' };
  AppState.monthlyDetails[m].reconExpenseNotes[cat].action = val.trim();
};

// ==================== PHẦN 2: PHÁT TRIỂN BẢN THÂN ====================
function renderMonthLearningSection(m) {
  const mData = AppState.monthlyDetails[m] || { learningDetails: [] };
  const items = mData.learningDetails || [];

  const tbLearnDetail = document.getElementById('tbody-m-learning-detail');
  if (tbLearnDetail) {
    tbLearnDetail.innerHTML = items.map((it, i) => `
      <tr>
        <td class="cell-blue text-center" contenteditable="true" spellcheck="false" onblur="updateLearnDate(${m}, ${i}, this.innerText)">${it.date}</td>
        <td class="cell-blue" contenteditable="true" spellcheck="false" onblur="updateLearnCat(${m}, ${i}, this.innerText)">${it.cat}</td>
        <td class="cell-blue" contenteditable="true" spellcheck="false" onblur="updateLearnDesc(${m}, ${i}, this.innerText)">${it.desc}</td>
        <td class="text-right cell-blue font-bold" contenteditable="true" spellcheck="false" onblur="updateLearnVal(${m}, ${i}, this.innerText)">${it.val.toFixed(2)}</td>
        <td class="cell-blue" contenteditable="true" spellcheck="false" onblur="updateLearnExpRes(${m}, ${i}, this.innerText)">${it.expRes}</td>
        <td class="cell-blue" contenteditable="true" spellcheck="false" onblur="updateLearnActRes(${m}, ${i}, this.innerText)">${it.actRes}</td>
        <td class="text-center"><button class="btn-table-del" onclick="deleteMonthLearningRow(${m}, ${i})"><i class="fa-solid fa-trash-can"></i></button></td>
      </tr>
    `).join('');
  }

  // Thống kê theo SUMIF danh mục
  const catSums = {};
  items.forEach(x => { catSums[x.cat] = (catSums[x.cat] || 0) + x.val; });

  let statRows = '';
  let totalSpent = 0;
  AppState.planList.forEach(planName => {
    const val = catSums[planName] || 0;
    totalSpent += val;
    statRows += `
      <tr>
        <td>${planName}</td>
        <td class="text-right font-bold">${val.toFixed(2)}</td>
      </tr>
    `;
  });

  const tbStat = document.getElementById('tbody-m-learning-stat');
  if (tbStat) tbStat.innerHTML = statRows;

  const tfDetail = document.getElementById('tfoot-m-learn-total');
  const tfStat = document.getElementById('tfoot-m-learn-stat-total');
  if (tfDetail) tfDetail.textContent = totalSpent.toFixed(2);
  if (tfStat) tfStat.textContent = totalSpent.toFixed(2);
}

window.addMonthLearningRow = function() {
  const m = AppState.currentMonth;
  if (!AppState.monthlyDetails[m].learningDetails) AppState.monthlyDetails[m].learningDetails = [];
  AppState.monthlyDetails[m].learningDetails.push({
    date: `15/1/2026`,
    cat: 'Khóa học ngắn hạn',
    desc: 'Khóa học mới',
    val: 1.0,
    expRes: 'Bổ sung kiến thức',
    actRes: 'Nâng cao trình độ'
  });
  renderMonthLearningSection(m);
};

window.deleteMonthLearningRow = function(m, i) {
  AppState.monthlyDetails[m].learningDetails.splice(i, 1);
  renderMonthLearningSection(m);
};

window.updateLearnDate = function(m, i, t) { AppState.monthlyDetails[m].learningDetails[i].date = t.trim(); };
window.updateLearnCat = function(m, i, t) { AppState.monthlyDetails[m].learningDetails[i].cat = t.trim(); renderMonthLearningSection(m); };
window.updateLearnDesc = function(m, i, t) { AppState.monthlyDetails[m].learningDetails[i].desc = t.trim(); };
window.updateLearnVal = function(m, i, t) { 
  AppState.monthlyDetails[m].learningDetails[i].val = parseFloat(t) || 0; 
  renderMonthLearningSection(m); 
};
window.updateLearnExpRes = function(m, i, t) { AppState.monthlyDetails[m].learningDetails[i].expRes = t.trim(); };
window.updateLearnActRes = function(m, i, t) { AppState.monthlyDetails[m].learningDetails[i].actRes = t.trim(); };

// ==================== BIỂU ĐỒ THANH NGANG THÁNG ====================
let monthBarChartInstance = null;

function renderMonthHorizontalBarChart() {
  const canvas = document.getElementById('monthExpenseBarChart');
  if (!canvas || typeof Chart === 'undefined') return;

  const m = AppState.currentMonth;
  const mData = AppState.monthlyDetails[m] || { expenses: [] };

  const catSums = {};
  mData.expenses.forEach(x => {
    catSums[x.cat] = (catSums[x.cat] || 0) + x.val;
  });

  // Thứ tự hiển thị từ dưới lên trên chuẩn như Excel
  const labels = AppState.planExpense.map(p => p.name).reverse();
  const data = labels.map(name => catSums[name] || 0);

  if (monthBarChartInstance) {
    monthBarChartInstance.destroy();
    monthBarChartInstance = null;
  }

  monthBarChartInstance = new Chart(canvas.getContext('2d'), {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Chi phí thực tế',
        data: data,
        backgroundColor: '#f29b28',
        borderRadius: 3,
        barPercentage: 0.65
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          enabled: true,
          backgroundColor: 'rgba(15, 23, 42, 0.9)',
          titleFont: { family: 'Montserrat', size: 11, weight: 'bold' },
          bodyFont: { family: 'Montserrat', size: 11 },
          callbacks: {
            label: function(ctx) {
              return ` Thực tế: ${ctx.parsed.x.toFixed(1)} triệu`;
            }
          }
        }
      },
      scales: {
        x: {
          beginAtZero: true,
          grid: { color: '#f1f5f9' },
          ticks: { font: { family: 'Montserrat', size: 10 } }
        },
        y: {
          grid: { display: false },
          ticks: { font: { family: 'Montserrat', size: 10 } }
        }
      }
    }
  });
}

// ==================== KHẢO SÁT & CHẤM ĐIỂM ====================
function evaluateSurveys() {
  let score1 = 0;
  for (let i = 1; i <= 10; i++) {
    const checked = document.querySelector(`input[name="ks1_${i}"]:checked`);
    if (checked) score1 += parseInt(checked.value, 10);
  }

  let riskText = '';
  if (score1 <= 18) {
    riskText = 'Kết quả khảo sát khả năng chịu đựng rủi ro: Bạn là người thận trọng (Aversion), ưu tiên bảo toàn vốn, nên duy trì tài sản an toàn cao.';
  } else if (score1 <= 32) {
    riskText = 'Kết quả khảo sát khả năng chịu đựng rủi ro: Bạn là người trung lập với rủi ro, bạn nên duy trì các tài sản rủi ro tại mức trung bình.';
  } else {
    riskText = 'Kết quả khảo sát khả năng chịu đựng rủi ro: Bạn là người ưa chuộng mạo hiểm (Risk Seeking), ưu tiên tăng trưởng, sẵn sàng đón nhận biến động thị trường trong ngắn hạn.';
  }

  const rBar1 = document.getElementById('survey-result-bar-1');
  const rTextBT = document.getElementById('survey-result-risk');
  if (rBar1) rBar1.textContent = riskText;
  if (rTextBT) rTextBT.textContent = riskText;

  let score2 = 0;
  for (let i = 1; i <= 11; i++) {
    const checked = document.querySelector(`input[name="ks2_${i}"]:checked`);
    if (checked) score2 += parseInt(checked.value, 10);
  }

  let contextText = '';
  if (score2 <= 22) {
    contextText = 'Kết quả khảo sát hoàn cảnh: Bối cảnh tài chính chịu nhiều ràng buộc chi tiêu gia đình, cần ưu tiên quỹ dự phòng thanh khoản lớn.';
  } else if (score2 <= 38) {
    contextText = 'Kết quả khảo sát hoàn cảnh: Bạn trong điều kiện bình thường để phát triển tài chính của bạn trong dài hạn.';
  } else {
    contextText = 'Kết quả khảo sát hoàn cảnh: Bạn có bối cảnh tài chính thuận lợi và tính tự chủ rất cao để đẩy mạnh tích lũy tài sản đầu tư.';
  }

  const rBar2 = document.getElementById('survey-result-bar-2');
  const cTextBT = document.getElementById('survey-result-context');
  if (rBar2) rBar2.textContent = contextText;
  if (cTextBT) cTextBT.textContent = contextText;
}

// ==================== CƠ CHẾ TÍNH TOÁN LIÊN KẾT TOÀN DIỆN ====================
function recalculateAll() {
  const sumRate = AppState.investProducts.reduce((acc, p) => acc + p.returnRate, 0);
  const avgRate = AppState.investProducts.length ? (sumRate / AppState.investProducts.length) : 0;
  const expRateEl = document.getElementById('dash-expected-return');
  if (expRateEl) expRateEl.textContent = `${avgRate.toFixed(2)}%/năm`;

  const totalInvest = AppState.investTargets.reduce((a, b) => a + b.val, 0);
  const tgtSavEl = document.getElementById('dash-target-savings');
  if (tgtSavEl) tgtSavEl.textContent = `${totalInvest.toLocaleString()} tr`;

  calculateAmortization();

  const sumPlanInc = AppState.planIncome.reduce((a, b) => a + b.plan, 0);
  const sumPlanExp = AppState.planExpense.reduce((a, b) => a + b.plan, 0);
  const plIncEl = document.getElementById('plan-sum-inc-val');
  const plExpEl = document.getElementById('plan-sum-exp-val');
  if (plIncEl) plIncEl.textContent = `${sumPlanInc.toFixed(2)} tr`;
  if (plExpEl) plExpEl.textContent = `${sumPlanExp.toFixed(2)} tr`;

  let yearTotalInc = 0;
  let yearTotalExp = 0;

  for (let m = 1; m <= 12; m++) {
    const md = AppState.monthlyDetails[m] || { incomes: [], expenses: [] };
    yearTotalInc += md.incomes.reduce((a, b) => a + b.val, 0);
    yearTotalExp += md.expenses.reduce((a, b) => a + b.val, 0);
  }

  const yearSavings = yearTotalInc - yearTotalExp;
  const expRatio = yearTotalInc > 0 ? (yearTotalExp / yearTotalInc) * 100 : 0;
  const savRate = yearTotalInc > 0 ? (yearSavings / yearTotalInc) * 100 : 0;

  const dTotInc = document.getElementById('dash-total-income');
  const dAvgInc = document.getElementById('dash-avg-income');
  const dTotExp = document.getElementById('dash-total-expense');
  const dExpRat = document.getElementById('dash-expense-ratio');
  const dTotSav = document.getElementById('dash-total-savings');
  const dSavRat = document.getElementById('dash-savings-rate');

  if (dTotInc) dTotInc.textContent = `${yearTotalInc.toFixed(2)} tr`;
  if (dAvgInc) dAvgInc.textContent = `Bình quân ~${(yearTotalInc / 12).toFixed(2)} tr/tháng`;
  if (dTotExp) dTotExp.textContent = `${yearTotalExp.toFixed(2)} tr`;
  if (dExpRat) dExpRat.textContent = `Chiếm ${expRatio.toFixed(1)}% tổng thu`;
  if (dTotSav) dTotSav.textContent = `${yearSavings.toFixed(2)} tr`;
  if (dSavRat) dSavRat.textContent = `Tỷ lệ tích lũy: ${savRate.toFixed(1)}%`;

  renderDashboardMatrices();
  updateDashboardCharts();
}

// Tính niên kim trả góp
function calculateAmortization() {
  const start = parseInt(document.getElementById('tc-start')?.innerText || '2037', 10);
  const end = parseInt(document.getElementById('tc-end')?.innerText || '2052', 10);
  const p = parseFloat(document.getElementById('tc-principal')?.innerText.replace(/[^0-9.-]/g, '') || '500') || 500;
  const paid = parseFloat(document.getElementById('tc-paid')?.innerText.replace(/[^0-9.-]/g, '') || '400') || 0;
  const r = (parseFloat(document.getElementById('tc-rate')?.innerText.replace(/[^0-9.-]/g, '') || '8.0') || 8.0) / 100;
  const n = Math.max(1, end - start + 1);

  const durEl = document.getElementById('tc-duration');
  if (durEl) durEl.textContent = n;

  const targetEl = document.getElementById('tc-target-val');
  if (targetEl) targetEl.textContent = Math.max(0, p - paid).toFixed(2);

  const pmt = p * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  const pmtEl = document.getElementById('tc-pmt');
  if (pmtEl) pmtEl.textContent = `${pmt.toFixed(2)} tr`;

  let bal = p;
  let rows = '';
  for (let i = 0; i < n; i++) {
    const yr = start + i;
    const age = 35 + i;
    const interest = bal * r;
    const prin = pmt - interest;
    const endBal = Math.max(0, bal - prin);

    rows += `
      <tr>
        <td class="text-center">${yr}</td>
        <td class="text-center">${age}</td>
        <td class="text-right">${bal.toFixed(2)}</td>
        <td class="text-right cell-blue">${prin.toFixed(2)}</td>
        <td class="text-right text-red">${interest.toFixed(2)}</td>
        <td class="text-right font-bold">${pmt.toFixed(2)}</td>
        <td class="text-right font-bold">${endBal.toFixed(2)}</td>
      </tr>
    `;
    bal = endBal;
  }
  const amortEl = document.getElementById('tbody-amortization');
  if (amortEl) amortEl.innerHTML = rows;
}

// ==================== DASHBOARD CHARTS ====================
let pieChartInstance = null;
let barChartInstance = null;

function updateDashboardCharts() {
  if (typeof Chart === 'undefined') return;

  const income12 = [];
  const expense12 = [];
  const catSums = {};

  for (let m = 1; m <= 12; m++) {
    const md = AppState.monthlyDetails[m] || { incomes: [], expenses: [] };
    const inc = md.incomes.reduce((a, b) => a + b.val, 0);
    const exp = md.expenses.reduce((a, b) => a + b.val, 0);
    income12.push(inc);
    expense12.push(exp);

    md.expenses.forEach(x => {
      catSums[x.cat] = (catSums[x.cat] || 0) + x.val;
    });
  }

  const pieCtx = document.getElementById('pieChart')?.getContext('2d');
  if (pieCtx) {
    if (pieChartInstance) pieChartInstance.destroy();
    pieChartInstance = new Chart(pieCtx, {
      type: 'doughnut',
      data: {
        labels: Object.keys(catSums),
        datasets: [{
          data: Object.values(catSums),
          backgroundColor: ['#ef4444', '#f97316', '#3b82f6', '#10b981', '#8b5cf6', '#eab308', '#ec4899', '#6366f1', '#06b6d4', '#84cc16']
        }]
      },
      options: { 
        responsive: true, 
        maintainAspectRatio: false, 
        plugins: { 
          legend: { position: 'bottom', labels: { boxWidth: 12, font: { family: 'Montserrat', size: 10 } } } 
        } 
      }
    });
  }

  const barCtx = document.getElementById('barChart')?.getContext('2d');
  if (barCtx) {
    if (barChartInstance) barChartInstance.destroy();
    barChartInstance = new Chart(barCtx, {
      type: 'bar',
      data: {
        labels: ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'],
        datasets: [
          { label: 'Thu nhập', data: income12, backgroundColor: '#10b981', borderRadius: 2 },
          { label: 'Chi tiêu', data: expense12, backgroundColor: '#ef4444', borderRadius: 2 }
        ]
      },
      options: { 
        responsive: true, 
        maintainAspectRatio: false, 
        scales: { 
          y: { beginAtZero: true, grid: { color: '#f1f5f9' }, ticks: { font: { family: 'Montserrat', size: 10 } } },
          x: { grid: { display: false }, ticks: { font: { family: 'Montserrat', size: 10 } } }
        }, 
        plugins: { 
          legend: { position: 'bottom', labels: { boxWidth: 12, font: { family: 'Montserrat', size: 11 } } } 
        } 
      }
    });
  }
}

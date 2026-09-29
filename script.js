/**
 * TOÀN BỘ LOGIC CỦA DASHBOARD MA TRẬN 12 THÁNG & ĐỒNG BỘ NGUYÊN BẢN XLSX
 */

const AppState = {
  currentYear: 2023,
  currentAge: 21,
  birthYear: 2002,
  currentMonth: 1,

  // Danh mục thiết lập gốc
  expenses: [
    'Mua thực phẩm', 'Mua đồ dùng trong nhà', 'Đi ăn ở ngoài',
    'Chi tiền phát triển bản thân', 'Chi tiền bảo hiểm',
    'Chi tiền điện, nước, internet, điện thoại, xăng xe',
    'Chi tiền giải trí, quà tặng', 'Chi tiền cho con', 'Chi tiền trả nợ', 'Chi tiền cho tặng gia đình',
    'Chi tiêu 1', 'Chi tiêu 2', 'Chi tiêu 3', 'Chi tiêu 4', 'Chi tiêu 5'
  ],
  incomeList: ['Lương từ công ty', 'Thu nhập khác'],
  planList: ['Mua sách', 'Khóa học ngắn hạn', 'Khóa học dài hạn', 'Tham gia các buổi diễn thuyết', 'Chi phát triển bản thân khác'],
  
  investProducts: [
    { name: 'ETF - ETFVFM', returnRate: 13, risk: 18 },
    { name: 'ETF - ETFFINLEAD', returnRate: 15, risk: 20 },
    { name: 'DCBC', returnRate: 16, risk: 20 },
    { name: 'DCDS', returnRate: 11, risk: 10 },
    { name: 'DCBF', returnRate: 9, risk: 8 },
    { name: 'Trái phiếu Techcombank', returnRate: 11, risk: 6 },
    { name: 'Trái phiếu FE Credit', returnRate: 10, risk: 8 },
    { name: 'Finhay', returnRate: 6, risk: 7 },
    { name: 'Bảo hiểm thuần túy', returnRate: 4, risk: 5 },
    { name: 'BH liên kết đầu tư', returnRate: 12, risk: 5 },
    { name: 'Tiền gửi ngân hàng', returnRate: 5, risk: 2 },
    { name: 'Cổ phiếu riêng lẻ', returnRate: 12, risk: 6 }
  ],

  // Mục tiêu bản thân
  debtTargets: [
    { age: 35, desc: 'Vay mua chung cư', val: 500 }
  ],
  investTargets: [
    { age: 25, desc: 'Du lịch xuyên Thái Lan', val: 50 },
    { age: 26, desc: 'Quỹ dự phòng tài chính', val: 100 },
    { age: 28, desc: 'Đám cưới', val: 200 },
    { age: 30, desc: 'Khởi nghiệp', val: 500 },
    { age: 38, desc: 'Mua chung cư', val: 1500 },
    { age: 46, desc: 'Cho con đi học đại học', val: 500 },
    { age: 50, desc: 'Hưu trí', val: 500 }
  ],

  skills: ['Sẵn sàng học hỏi cái mới', 'Nhiệt huyết trong công việc'],
  family: ['Ba mẹ có hỗ trợ mua chung cư , lo đám cưới'],
  job: [
    'Môi trường đa quốc gia, có nhiều cơ hội phát triển',
    'Môi trường làm việc có sự cạnh tranh gay gắt, áp lực KPI',
    'Có chế độ đãi ngộ tốt về lương thưởng, lương bổng'
  ],

  planIncome: [
    { name: 'Lương từ công ty', plan: 20.0 },
    { name: 'Thu nhập khác', plan: 10.0 }
  ],
  planExpense: [
    { name: 'Mua thực phẩm', plan: 5.0, note: 'Mua sắm tết' },
    { name: 'Mua đồ dùng trong nhà', plan: 0.5, note: '' },
    { name: 'Đi ăn ở ngoài', plan: 2.0, note: '' },
    { name: 'Chi tiền phát triển bản thân', plan: 1.5, note: '' },
    { name: 'Chi tiền bảo hiểm', plan: 0.0, note: '' },
    { name: 'Chi tiền điện, nước, internet, điện thoại, xăng xe', plan: 2.0, note: '' },
    { name: 'Chi tiền giải trí, quà tặng', plan: 0.0, note: '' },
    { name: 'Chi tiền cho con', plan: 0.0, note: '' },
    { name: 'Chi tiền trả nợ', plan: 6.5, note: '' },
    { name: 'Chi tiền cho tặng gia đình', plan: 1.0, note: '' }
  ],

  // Ma trận số liệu chính xác 100% từ Dashboard của file XLSX
  matrixIncome: {
    'Lương từ công ty': [20, 25, 18, 20, 25, 20, 20, 20, 20, 20, 20, 25],
    'Thu nhập khác': [4, 4.5, 5.7, 3.9, 7.8, 7.5, 9.0, 5.0, 7.0, 8.0, 4.0, 10.0]
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
        { date: '15/01/2023', cat: 'Lương từ công ty', desc: 'Lương tháng', val: 20.0, reason: 'Thưởng KPI' },
        { date: '30/01/2023', cat: 'Thu nhập khác', desc: 'Thưởng ngoài', val: 4.0, reason: '' }
      ],
      expenses: [
        { date: '01/01/2023', cat: 'Mua thực phẩm', desc: 'Mua rau củ quả, gạo', val: 5.5, reason: 'Mua sắm tết' },
        { date: '04/01/2023', cat: 'Mua đồ dùng trong nhà', desc: 'Mua máy ép', val: 0.3, reason: '' },
        { date: '07/01/2023', cat: 'Đi ăn ở ngoài', desc: 'Đi gặp bạn cũ', val: 0.2, reason: '' },
        { date: '10/01/2023', cat: 'Đi ăn ở ngoài', desc: 'Tiệc công ty', val: 0.6, reason: '' },
        { date: '28/01/2023', cat: 'Chi tiền điện, nước, internet, điện thoại, xăng xe', desc: 'Điện', val: 0.5, reason: '' },
        { date: '29/01/2023', cat: 'Chi tiền điện, nước, internet, điện thoại, xăng xe', desc: 'Nước', val: 0.3, reason: '' },
        { date: '30/01/2023', cat: 'Chi tiền điện, nước, internet, điện thoại, xăng xe', desc: 'Internet', val: 0.3, reason: '' },
        { date: '15/01/2023', cat: 'Chi tiền điện, nước, internet, điện thoại, xăng xe', desc: 'Xăng', val: 0.2, reason: '' },
        { date: '10/01/2023', cat: 'Chi tiền trả nợ', desc: 'Khoản vay', val: 6.5, reason: '' },
        { date: '05/01/2023', cat: 'Chi tiền cho tặng gia đình', desc: 'Biếu bố mẹ', val: 2.0, reason: 'Tết biếu quà' },
        { date: '01/01/2023', cat: 'Chi tiền phát triển bản thân', desc: 'Mua sách', val: 0.1, reason: '' },
        { date: '12/01/2023', cat: 'Chi tiền phát triển bản thân', desc: 'Học lập trình', val: 1.0, reason: '' }
      ]
    }
  }
};

// Điền sẵn dữ liệu mặc định cho các tháng từ T2 đến T12
for (let m = 2; m <= 12; m++) {
  if (!AppState.monthlyDetails[m]) {
    AppState.monthlyDetails[m] = {
      incomes: [
        { date: `15/0${m}/2023`, cat: 'Lương từ công ty', desc: 'Lương tháng', val: AppState.matrixIncome['Lương từ công ty'][m - 1], reason: '' },
        { date: `30/0${m}/2023`, cat: 'Thu nhập khác', desc: 'Thu nhập ngoài', val: AppState.matrixIncome['Thu nhập khác'][m - 1], reason: '' }
      ],
      expenses: [
        { date: `01/0${m}/2023`, cat: 'Mua thực phẩm', desc: 'Tiền chợ', val: AppState.matrixExpense['Mua thực phẩm'][m - 1], reason: '' },
        { date: `10/0${m}/2023`, cat: 'Chi tiền trả nợ', desc: 'Gốc + Lãi', val: 6.5, reason: '' },
        { date: `15/0${m}/2023`, cat: 'Chi tiền điện, nước, internet, điện thoại, xăng xe', desc: 'Hóa đơn', val: AppState.matrixExpense['Chi tiền điện, nước, internet, điện thoại, xăng xe'][m - 1], reason: '' },
        { date: `20/0${m}/2023`, cat: 'Đi ăn ở ngoài', desc: 'Cà phê', val: AppState.matrixExpense['Đi ăn ở ngoài'][m - 1], reason: '' }
      ]
    };
  }
}

// ==================== KHỞI TẠO ====================
document.addEventListener('DOMContentLoaded', () => {
  renderSetupTables();
  renderTargetTables();
  renderSkillsFamilyJob();
  renderPlanTables();
  renderDashboardMatrices();
  renderMonthView(AppState.currentMonth);
  recalculateAll();

  // Đổi năm / tuổi
  const inputYearEl = document.getElementById('input-year');
  const inputAgeEl = document.getElementById('input-age');

  inputYearEl.addEventListener('input', () => {
    const val = parseInt(inputYearEl.innerText.trim(), 10);
    if (!isNaN(val) && val > 1900 && val < 2100) {
      AppState.currentYear = val;
      AppState.currentAge = AppState.currentYear - AppState.birthYear;
      inputAgeEl.innerText = AppState.currentAge;
      syncYearLabels();
    }
  });

  inputAgeEl.addEventListener('input', () => {
    const val = parseInt(inputAgeEl.innerText.trim(), 10);
    if (!isNaN(val) && val > 0 && val < 120) {
      AppState.currentAge = val;
      AppState.birthYear = AppState.currentYear - AppState.currentAge;
    }
  });

  // Chuyển tab sidebar
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      const tabId = item.getAttribute('data-tab');
      if (item.classList.contains('nav-month')) {
        const m = parseInt(item.getAttribute('data-month'), 10);
        AppState.currentMonth = m;
        activateTab('tab-month');
        renderMonthView(m);
      } else {
        activateTab(tabId);
      }
    });
  });
});

function syncYearLabels() {
  document.querySelectorAll('.dynamic-year').forEach(el => el.textContent = AppState.currentYear);
}

function activateTab(tabId) {
  document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
  
  if (tabId === 'tab-month') {
    const mBtn = document.querySelector(`.nav-month[data-month="${AppState.currentMonth}"]`);
    if (mBtn) mBtn.classList.add('active');
  } else {
    const btn = document.querySelector(`.nav-item[data-tab="${tabId}"]`);
    if (btn) btn.classList.add('active');
  }

  const titlesMap = {
    'tab-tukhoa': 'TỪ KHÓA',
    'tab-dashboard': 'THEO DÕI TÀI CHÍNH CÁ NHÂN',
    'tab-muctieu-bt': 'XÁC ĐỊNH MỤC TIÊU BẢN THÂN',
    'tab-muctieu-tc': 'XÁC ĐỊNH MỤC TIÊU TÀI CHÍNH',
    'tab-candoi': 'CÂN ĐỐI LỘ TRÌNH NGHỀ NGHIỆP',
    'tab-kehoach': 'KẾ HOẠCH THU NHẬP VÀ CHI TIÊU',
    'tab-month': `THEO DÕI THU - CHI THÁNG ${AppState.currentMonth}`,
    'tab-khaosat': 'BẢNG KHẢO SÁT ĐÁNH GIÁ BẢN THÂN'
  };

  document.getElementById('current-title').textContent = titlesMap[tabId] || 'TÀI CHÍNH CÁ NHÂN';

  document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
  const targetPane = document.getElementById(tabId);
  if (targetPane) {
    targetPane.classList.add('active');
    if (tabId === 'tab-dashboard') updateDashboardCharts();
  }
}

function goToSurveyTab() { activateTab('tab-khaosat'); }
function saveSurveyAndBack() { activateTab('tab-muctieu-bt'); }

// ==================== VẼ ĐỒ THỊ SPARKLINE MINI ====================
function createSparkline(arr, width = 75, height = 18, color = '#0284c7') {
  if (!arr || arr.length === 0) return '';
  const min = Math.min(...arr);
  const max = Math.max(...arr);
  const range = max - min === 0 ? 1 : max - min;
  const step = width / (arr.length - 1);

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

// ==================== RENDER 4 BẢNG MA TRẬN 12 THÁNG TRÊN DASHBOARD ====================
function renderDashboardMatrices() {
  // 1. Ma trận thu nhập
  let incRows = '';
  Object.entries(AppState.matrixIncome).forEach(([cat, vals]) => {
    const sum = vals.reduce((a, b) => a + b, 0);
    const cells = vals.map(v => `<td>${v.toFixed(1)}</td>`).join('');
    incRows += `
      <tr>
        <td>${cat}</td>
        ${cells}
        <td class="font-bold text-green">${sum.toFixed(1)}</td>
        <td>${createSparkline(vals)}</td>
      </tr>
    `;
  });
  document.getElementById('tbody-db-income').innerHTML = incRows;

  // 2. Ma trận chi tiêu
  let expRows = '';
  Object.entries(AppState.matrixExpense).forEach(([cat, vals]) => {
    const sum = vals.reduce((a, b) => a + b, 0);
    const cells = vals.map(v => `<td>${v.toFixed(2)}</td>`).join('');
    expRows += `
      <tr>
        <td>${cat}</td>
        ${cells}
        <td class="font-bold text-red">${sum.toFixed(2)}</td>
        <td>${createSparkline(vals)}</td>
      </tr>
    `;
  });
  document.getElementById('tbody-db-expense').innerHTML = expRows;

  // 3. Sparkline cho dòng Tiết kiệm
  const savArr = [6.5, 10.3, 4.45, 6.65, 16.2, 12.55, 10.75, 2.45, 9.55, 10.05, 6.25, 9.95];
  document.getElementById('sparkline-savings').innerHTML = createSparkline(savArr, 75, 18, '#2563eb');

  // 4. Ma trận chi phí phát triển bản thân
  let learnRows = '';
  Object.entries(AppState.matrixLearning).forEach(([cat, vals]) => {
    const sum = vals.reduce((a, b) => a + b, 0);
    const cells = vals.map(v => `<td>${v.toFixed(2)}</td>`).join('');
    learnRows += `
      <tr>
        <td>${cat}</td>
        ${cells}
        <td class="font-bold">${sum.toFixed(2)}</td>
        <td>${createSparkline(vals)}</td>
      </tr>
    `;
  });
  document.getElementById('tbody-db-learning').innerHTML = learnRows;

  // Sparkline tổng
  const incTotalArr = [24, 29.5, 23.7, 23.9, 32.8, 27.5, 29, 25, 27, 28, 24, 35];
  const expTotalArr = [17.5, 19.2, 19.25, 17.25, 16.6, 14.95, 18.25, 22.55, 17.45, 17.95, 17.75, 25.05];
  const lrnTotalArr = [1.1, 2.3, 1.5, 1.3, 2.0, 1.1, 1.1, 3.1, 0.8, 2.1, 1.5, 1.5];

  document.getElementById('sparkline-inc-total').innerHTML = createSparkline(incTotalArr, 75, 18, '#16a34a');
  document.getElementById('sparkline-exp-total').innerHTML = createSparkline(expTotalArr, 75, 18, '#dc2626');
  document.getElementById('sparkline-learn-total').innerHTML = createSparkline(lrnTotalArr, 75, 18, '#ea580c');
}

// ==================== BẢNG TỪ KHÓA ====================
function renderSetupTables() {
  document.getElementById('tbody-expenses').innerHTML = AppState.expenses.map((item, idx) => `
    <tr>
      <td>${idx + 1}</td>
      <td class="cell-blue" contenteditable="true" onblur="updateExpenseItem(${idx}, this.innerText)">${item}</td>
    </tr>
  `).join('');

  document.getElementById('tbody-income').innerHTML = AppState.incomeList.map((item, idx) => `
    <tr>
      <td>${idx + 1}</td>
      <td class="cell-blue" contenteditable="true" onblur="updateIncomeItem(${idx}, this.innerText)">${item}</td>
    </tr>
  `).join('');

  document.getElementById('tbody-learning').innerHTML = AppState.planList.map((item, idx) => `
    <tr>
      <td>${idx + 1}</td>
      <td class="cell-blue" contenteditable="true">${item}</td>
    </tr>
  `).join('');

  document.getElementById('tbody-invest').innerHTML = AppState.investProducts.map((p, idx) => `
    <tr>
      <td>${idx + 1}</td>
      <td class="cell-blue ${p.name === 'DCDS' ? 'excel-active-cell' : ''}" contenteditable="true">${p.name}</td>
      <td class="text-right cell-blue" contenteditable="true" onblur="updateProductRate(${idx}, this.innerText)">${p.returnRate}%</td>
      <td class="text-right cell-blue" contenteditable="true">${p.risk}%</td>
    </tr>
  `).join('');
}

function updateExpenseItem(idx, val) { AppState.expenses[idx] = val.trim(); recalculateAll(); }
function updateIncomeItem(idx, val) { AppState.incomeList[idx] = val.trim(); recalculateAll(); }
function updateProductRate(idx, val) {
  AppState.investProducts[idx].returnRate = parseFloat(val.replace('%', '')) || 0;
  recalculateAll();
}

function addExpenseRow() { AppState.expenses.push(`Khoản chi mới ${AppState.expenses.length + 1}`); renderSetupTables(); }
function addIncomeRow() { AppState.incomeList.push(`Nguồn thu mới ${AppState.incomeList.length + 1}`); renderSetupTables(); }
function addPlanRow() { AppState.planList.push(`Kế hoạch mới ${AppState.planList.length + 1}`); renderSetupTables(); }
function addInvestRow() { AppState.investProducts.push({ name: 'Sản phẩm mới', returnRate: 10, risk: 10 }); renderSetupTables(); recalculateAll(); }

// ==================== MỤC TIÊU BẢN THÂN ====================
function renderTargetTables() {
  document.getElementById('tbody-debt-target').innerHTML = AppState.debtTargets.map((d, i) => `
    <tr>
      <td class="cell-green-light text-center font-bold">${i + 1}</td>
      <td class="cell-green-light text-center cell-blue" contenteditable="true">${d.age}</td>
      <td class="cell-green-light cell-blue" contenteditable="true">${d.desc}</td>
      <td class="cell-green-light text-right cell-blue font-bold" contenteditable="true" onblur="updateDebtTarget(${i}, this.innerText)">${d.val}</td>
    </tr>
  `).join('');

  document.getElementById('tbody-invest-target').innerHTML = AppState.investTargets.map((inv, i) => `
    <tr>
      <td class="cell-green-light text-center font-bold">${i + 4}</td>
      <td class="cell-green-light text-center cell-blue" contenteditable="true">${inv.age}</td>
      <td class="cell-green-light cell-blue" contenteditable="true">${inv.desc}</td>
      <td class="cell-green-light text-right cell-blue font-bold" contenteditable="true" onblur="updateInvestTarget(${i}, this.innerText)">${inv.val.toLocaleString()}</td>
    </tr>
  `).join('');
}

function updateDebtTarget(i, text) { AppState.debtTargets[i].val = parseFloat(text.replace(/,/g, '')) || 0; recalculateAll(); }
function updateInvestTarget(i, text) { AppState.investTargets[i].val = parseFloat(text.replace(/,/g, '')) || 0; recalculateAll(); }

function addDebtTargetRow() { AppState.debtTargets.push({ age: 35, desc: 'Mục tiêu nợ mới', val: 100 }); renderTargetTables(); recalculateAll(); }
function addInvestTargetRow() { AppState.investTargets.push({ age: 40, desc: 'Mục tiêu tích lũy mới', val: 200 }); renderTargetTables(); recalculateAll(); }

function renderSkillsFamilyJob() {
  document.getElementById('tbody-skills').innerHTML = AppState.skills.map(s => `<tr><td class="cell-green-light cell-blue font-medium" contenteditable="true">${s}</td></tr>`).join('');
  document.getElementById('tbody-family').innerHTML = AppState.family.map(f => `<tr><td class="cell-green-light cell-blue font-medium" contenteditable="true">${f}</td></tr>`).join('');
  document.getElementById('tbody-job').innerHTML = AppState.job.map(j => `<tr><td class="cell-green-light cell-blue font-medium" contenteditable="true">${j}</td></tr>`).join('');
}

function addSkillRow() { AppState.skills.push('Kỹ năng mới'); renderSkillsFamilyJob(); }
function addFamilyRow() { AppState.family.push('Hỗ trợ gia đình mới'); renderSkillsFamilyJob(); }
function addJobRow() { AppState.job.push('Môi trường nghề nghiệp mới'); renderSkillsFamilyJob(); }

// ==================== KẾ HOẠCH HÀNG THÁNG ====================
function renderPlanTables() {
  document.getElementById('tbody-plan-inc').innerHTML = AppState.planIncome.map((item, i) => `
    <tr>
      <td class="text-center">${i + 1}</td>
      <td>${item.name}</td>
      <td class="text-right cell-blue font-bold" contenteditable="true" onblur="updatePlanIncVal(${i}, this.innerText)">${item.plan.toFixed(2)}</td>
    </tr>
  `).join('');

  document.getElementById('tbody-plan-exp').innerHTML = AppState.planExpense.map((item, i) => `
    <tr>
      <td class="text-center">${i + 1}</td>
      <td>${item.name}</td>
      <td class="text-right cell-blue font-bold" contenteditable="true" onblur="updatePlanExpVal(${i}, this.innerText)">${item.plan.toFixed(2)}</td>
      <td class="cell-blue" contenteditable="true">${item.note}</td>
    </tr>
  `).join('');
}

function updatePlanIncVal(i, text) { AppState.planIncome[i].plan = parseFloat(text) || 0; recalculateAll(); }
function updatePlanExpVal(i, text) { AppState.planExpense[i].plan = parseFloat(text) || 0; recalculateAll(); }

// ==================== THEO DÕI THU CHI CHI TIẾT TỪNG THÁNG ====================
function renderMonthView(m) {
  document.getElementById('month-view-title').textContent = `THEO DÕI THU - CHI THÁNG ${m}`;
  document.getElementById('current-title').textContent = `THEO DÕI THU - CHI THÁNG ${m}`;

  const mData = AppState.monthlyDetails[m] || { incomes: [], expenses: [] };

  document.getElementById('tbody-m-detail-income').innerHTML = mData.incomes.map((inc, i) => `
    <tr>
      <td class="cell-blue text-center" contenteditable="true">${inc.date}</td>
      <td class="cell-blue" contenteditable="true">${inc.cat}</td>
      <td class="cell-blue" contenteditable="true">${inc.desc}</td>
      <td class="text-right cell-blue font-bold" contenteditable="true" onblur="updateMonthIncVal(${m}, ${i}, this.innerText)">${inc.val.toFixed(2)}</td>
    </tr>
  `).join('');

  document.getElementById('tbody-m-detail-expense').innerHTML = mData.expenses.map((exp, i) => `
    <tr>
      <td class="cell-blue text-center" contenteditable="true">${exp.date}</td>
      <td class="cell-blue" contenteditable="true">${exp.cat}</td>
      <td class="cell-blue" contenteditable="true">${exp.desc}</td>
      <td class="text-right cell-blue font-bold" contenteditable="true" onblur="updateMonthExpVal(${m}, ${i}, this.innerText)">${exp.val.toFixed(2)}</td>
    </tr>
  `).join('');

  renderReconciliationTable(m);
}

function addMonthDetailIncomeRow() {
  const m = AppState.currentMonth;
  AppState.monthlyDetails[m].incomes.push({ date: `15/0${m}/2023`, cat: 'Thu nhập khác', desc: 'Khoản thu mới', val: 2.0, reason: '' });
  renderMonthView(m);
  recalculateAll();
}

function addMonthDetailExpenseRow() {
  const m = AppState.currentMonth;
  AppState.monthlyDetails[m].expenses.push({ date: `10/0${m}/2023`, cat: 'Mua thực phẩm', desc: 'Khoản chi mới', val: 1.0, reason: '' });
  renderMonthView(m);
  recalculateAll();
}

function updateMonthIncVal(m, i, text) {
  AppState.monthlyDetails[m].incomes[i].val = parseFloat(text) || 0;
  recalculateAll();
  renderReconciliationTable(m);
}

function updateMonthExpVal(m, i, text) {
  AppState.monthlyDetails[m].expenses[i].val = parseFloat(text) || 0;
  recalculateAll();
  renderReconciliationTable(m);
}

function renderReconciliationTable(m) {
  const mData = AppState.monthlyDetails[m] || { incomes: [], expenses: [] };

  const actualIncMap = {};
  mData.incomes.forEach(x => actualIncMap[x.cat] = (actualIncMap[x.cat] || 0) + x.val);

  const actualExpMap = {};
  mData.expenses.forEach(x => actualExpMap[x.cat] = (actualExpMap[x.cat] || 0) + x.val);

  let rows = '';
  rows += `<tr class="bg-header-green"><th colspan="5" style="text-align: left;">Tổng kết thu nhập</th></tr>`;
  AppState.planIncome.forEach(p => {
    const act = actualIncMap[p.name] || 0;
    const diff = act - p.plan;
    rows += `
      <tr>
        <td>${p.name}</td>
        <td class="text-right">${p.plan.toFixed(2)}</td>
        <td class="text-right cell-blue font-bold">${act.toFixed(2)}</td>
        <td class="text-right font-bold ${diff >= 0 ? 'text-green' : 'text-red'}">${diff >= 0 ? '+' : ''}${diff.toFixed(2)}</td>
        <td class="cell-blue" contenteditable="true"></td>
      </tr>
    `;
  });

  rows += `<tr class="bg-header-orange"><th colspan="5" style="text-align: left;">Tổng kết chi tiêu</th></tr>`;
  AppState.planExpense.forEach(p => {
    const act = actualExpMap[p.name] || 0;
    const diff = p.plan - act;
    rows += `
      <tr>
        <td>${p.name}</td>
        <td class="text-right">${p.plan.toFixed(2)}</td>
        <td class="text-right cell-blue font-bold">${act.toFixed(2)}</td>
        <td class="text-right font-bold ${diff >= 0 ? 'text-green' : 'text-red'}">${diff.toFixed(2)}</td>
        <td class="cell-blue" contenteditable="true">${p.note || ''}</td>
      </tr>
    `;
  });

  document.getElementById('tbody-m-reconciliation').innerHTML = rows;

  const totalInc = mData.incomes.reduce((a, b) => a + b.val, 0);
  const totalExp = mData.expenses.reduce((a, b) => a + b.val, 0);
  const savings = totalInc - totalExp;

  document.getElementById('m-summary-income').textContent = `${totalInc.toFixed(2)} tr`;
  document.getElementById('m-summary-expense').textContent = `${totalExp.toFixed(2)} tr`;
  document.getElementById('m-summary-savings').textContent = `${savings.toFixed(2)} tr`;
}

// ==================== CƠ CHẾ TÍNH TOÁN LIÊN KẾT ====================
function recalculateAll() {
  const sumRate = AppState.investProducts.reduce((acc, p) => acc + p.returnRate, 0);
  const avgRate = AppState.investProducts.length ? (sumRate / AppState.investProducts.length) : 0;
  document.getElementById('dash-expected-return').textContent = `${avgRate.toFixed(2)}%/năm`;

  const totalInvest = AppState.investTargets.reduce((a, b) => a + b.val, 0);
  document.getElementById('dash-target-savings').textContent = `${totalInvest.toLocaleString()} tr`;

  calculateAmortization();

  const sumPlanInc = AppState.planIncome.reduce((a, b) => a + b.plan, 0);
  const sumPlanExp = AppState.planExpense.reduce((a, b) => a + b.plan, 0);
  document.getElementById('plan-sum-inc-val').textContent = `${sumPlanInc.toFixed(2)} tr`;
  document.getElementById('plan-sum-exp-val').textContent = `${sumPlanExp.toFixed(2)} tr`;

  // Tổng hợp cả năm
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

  document.getElementById('dash-total-income').textContent = `${yearTotalInc.toFixed(2)} tr`;
  document.getElementById('dash-avg-income').textContent = `Bình quân ~${(yearTotalInc / 12).toFixed(2)} tr/tháng`;
  document.getElementById('dash-total-expense').textContent = `${yearTotalExp.toFixed(2)} tr`;
  document.getElementById('dash-expense-ratio').textContent = `Chiếm ${expRatio.toFixed(1)}% tổng thu`;
  document.getElementById('dash-total-savings').textContent = `${yearSavings.toFixed(2)} tr`;
  document.getElementById('dash-savings-rate').textContent = `Tỷ lệ tích lũy: ${savRate.toFixed(1)}%`;
}

function calculateAmortization() {
  const start = parseInt(document.getElementById('tc-start')?.innerText || '2037', 10);
  const end = parseInt(document.getElementById('tc-end')?.innerText || '2052', 10);
  const p = parseFloat(document.getElementById('tc-principal')?.innerText || '500') || 500;
  const r = (parseFloat(document.getElementById('tc-rate')?.innerText || '8.0') || 8.0) / 100;
  const n = Math.max(1, end - start + 1);

  document.getElementById('tc-duration').textContent = n;

  const pmt = p * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  document.getElementById('tc-pmt').textContent = `${pmt.toFixed(2)} tr`;

  let bal = p;
  let rows = '';
  for (let i = 0; i < Math.min(n, 5); i++) {
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
  if (n > 5) {
    rows += `<tr><td colspan="7" class="text-center font-medium" style="color: #64748b;">... Tính toán niên kim trả góp tự động cho các năm tiếp theo đến ${end}</td></tr>`;
  }
  document.getElementById('tbody-amortization').innerHTML = rows;
}

// ==================== BIỂU ĐỒ DASHBOARD ====================
let pieChartInstance = null;
let barChartInstance = null;

function updateDashboardCharts() {
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
          backgroundColor: ['#ef4444', '#f97316', '#3b82f6', '#10b981', '#8b5cf6', '#eab308', '#ec4899', '#6366f1']
        }]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
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
          { label: 'Thu nhập', data: income12, backgroundColor: '#10b981' },
          { label: 'Chi tiêu', data: expense12, backgroundColor: '#ef4444' }
        ]
      },
      options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } }, plugins: { legend: { position: 'bottom' } } }
    });
  }
}

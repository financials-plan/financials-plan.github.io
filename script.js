/**
 * BỘ NÃO DỮ LIỆU ĐỒNG BỘ TRUNG TÂM (REACTIVE APP STATE)
 * Mọi thay đổi ở bất kỳ tab nào sẽ tự động kích hoạt tính toán và đồng bộ sang các tab khác.
 */

// 1. Trạng thái cơ bản: Năm & Tuổi
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
    'Chi tiền giải trí, quà tặng', 'Chi tiền cho con', 'Chi tiền trả nợ', 'Chi tiền cho tặng gia đình'
  ],
  incomeList: ['Lương từ công ty', 'Thu nhập khác'],
  planList: ['Mua sách', 'Khóa học ngắn hạn', 'Khóa học dài hạn', 'Tham gia các buổi diễn thuyết', 'Chi phát triển bản thân khác'],
  
  // Danh mục sản phẩm đầu tư (Tên, Tỷ suất kỳ vọng, Rủi ro)
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

  // Kế hoạch thu chi dự kiến hàng tháng
  plannedIncome: [
    { name: 'Lương từ công ty', val: 20.0 },
    { name: 'Thu nhập khác', val: 10.0 }
  ],
  plannedExpenses: [
    { name: 'Mua thực phẩm', val: 5.0 },
    { name: 'Mua đồ dùng trong nhà', val: 0.5 },
    { name: 'Đi ăn ở ngoài', val: 2.0 },
    { name: 'Chi tiền phát triển bản thân', val: 1.5 },
    { name: 'Chi tiền bảo hiểm', val: 0.0 },
    { name: 'Chi tiền điện, nước, internet, xăng xe', val: 2.0 },
    { name: 'Chi trả nợ', val: 6.5 },
    { name: 'Chi phí khác', val: 1.0 }
  ],

  // Dữ liệu thực tế 12 tháng (Thu nhập, Chi phí theo từng khoản mục)
  monthlyData: {
    1:  { income: { 'Lương từ công ty': 20.0, 'Thu nhập khác': 4.0 }, expense: { 'Mua thực phẩm': 5.0, 'Đi ăn ở ngoài': 2.0, 'Chi tiền phát triển bản thân': 1.5, 'Chi tiền điện, nước, internet, xăng xe': 2.5, 'Chi trả nợ': 6.5 } },
    2:  { income: { 'Lương từ công ty': 20.0, 'Thu nhập khác': 8.5 }, expense: { 'Mua thực phẩm': 5.5, 'Đi ăn ở ngoài': 2.5, 'Chi tiền phát triển bản thân': 1.5, 'Chi tiền điện, nước, internet, xăng xe': 3.0, 'Chi trả nợ': 6.5 } },
    3:  { income: { 'Lương từ công ty': 20.0, 'Thu nhập khác': 5.0 }, expense: { 'Mua thực phẩm': 4.5, 'Đi ăn ở ngoài': 2.0, 'Chi tiền phát triển bản thân': 1.5, 'Chi tiền điện, nước, internet, xăng xe': 2.0, 'Chi trả nợ': 6.5 } },
    4:  { income: { 'Lương từ công ty': 20.0, 'Thu nhập khác': 10.0 }, expense: { 'Mua thực phẩm': 6.0, 'Đi ăn ở ngoài': 3.0, 'Chi tiền phát triển bản thân': 2.0, 'Chi tiền điện, nước, internet, xăng xe': 3.5, 'Chi trả nợ': 6.5 } },
    5:  { income: { 'Lương từ công ty': 20.0, 'Thu nhập khác': 6.5 }, expense: { 'Mua thực phẩm': 5.0, 'Đi ăn ở ngoài': 2.0, 'Chi tiền phát triển bản thân': 1.5, 'Chi tiền điện, nước, internet, xăng xe': 3.0, 'Chi trả nợ': 6.5 } },
    6:  { income: { 'Lương từ công ty': 20.0, 'Thu nhập khác': 7.0 }, expense: { 'Mua thực phẩm': 4.8, 'Đi ăn ở ngoài': 2.2, 'Chi tiền phát triển bản thân': 1.5, 'Chi tiền điện, nước, internet, xăng xe': 2.0, 'Chi trả nợ': 6.5 } },
    7:  { income: { 'Lương từ công ty': 20.0, 'Thu nhập khác': 6.0 }, expense: { 'Mua thực phẩm': 5.2, 'Đi ăn ở ngoài': 2.3, 'Chi tiền phát triển bản thân': 1.5, 'Chi tiền điện, nước, internet, xăng xe': 3.0, 'Chi trả nợ': 6.5 } },
    8:  { income: { 'Lương từ công ty': 20.0, 'Thu nhập khác': 8.0 }, expense: { 'Mua thực phẩm': 5.5, 'Đi ăn ở ngoài': 2.5, 'Chi tiền phát triển bản thân': 2.0, 'Chi tiền điện, nước, internet, xăng xe': 3.0, 'Chi trả nợ': 6.5 } },
    9:  { income: { 'Lương từ công ty': 20.0, 'Thu nhập khác': 7.5 }, expense: { 'Mua thực phẩm': 5.0, 'Đi ăn ở ngoài': 2.0, 'Chi tiền phát triển bản thân': 1.5, 'Chi tiền điện, nước, internet, xăng xe': 3.0, 'Chi trả nợ': 6.5 } },
    10: { income: { 'Lương từ công ty': 20.0, 'Thu nhập khác': 9.0 }, expense: { 'Mua thực phẩm': 5.5, 'Đi ăn ở ngoài': 3.0, 'Chi tiền phát triển bản thân': 2.0, 'Chi tiền điện, nước, internet, xăng xe': 3.0, 'Chi trả nợ': 6.5 } },
    11: { income: { 'Lương từ công ty': 20.0, 'Thu nhập khác': 8.5 }, expense: { 'Mua thực phẩm': 5.25, 'Đi ăn ở ngoài': 2.5, 'Chi tiền phát triển bản thân': 2.0, 'Chi tiền điện, nước, internet, xăng xe': 3.0, 'Chi trả nợ': 6.5 } },
    12: { income: { 'Lương từ công ty': 20.0, 'Thu nhập khác': 9.4 }, expense: { 'Mua thực phẩm': 5.5, 'Đi ăn ở ngoài': 3.0, 'Chi tiền phát triển bản thân': 1.5, 'Chi tiền điện, nước, internet, xăng xe': 3.0, 'Chi trả nợ': 6.5 } }
  }
};

// ==================== KHỞI TẠO VÀ ĐỒNG BỘ GIAO DIỆN ====================
document.addEventListener('DOMContentLoaded', () => {
  renderSetupTables();
  renderTargetTables();
  renderPlanTables();
  renderMonthButtons();
  renderMonthDetail(AppState.currentMonth);
  recalculateAll();

  // Lắng nghe chỉnh sửa Năm
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

  // Lắng nghe chuyển Tab trên Sidebar
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      const tabId = item.getAttribute('data-tab');
      activateTab(tabId);
    });
  });
});

// Đồng bộ nhãn năm
function syncYearLabels() {
  document.querySelectorAll('.dynamic-year').forEach(el => {
    el.textContent = AppState.currentYear;
  });
}

// Chuyển Tab
function activateTab(tabId) {
  document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
  const btn = document.querySelector(`.nav-item[data-tab="${tabId}"]`);
  if (btn) btn.classList.add('active');

  const titlesMap = {
    'tab-tukhoa': 'TỪ KHÓA',
    'tab-dashboard': 'THEO DÕI TÀI CHÍNH CÁ NHÂN',
    'tab-muctieu-bt': 'XÁC ĐỊNH MỤC TIÊU BẢN THÂN',
    'tab-muctieu-tc': 'XÁC ĐỊNH MỤC TIÊU TÀI CHÍNH',
    'tab-candoi': 'CÂN ĐỐI LỘ TRÌNH NGHỀ NGHIỆP',
    'tab-kehoach': 'KẾ HOẠCH THU NHẬP VÀ CHI TIÊU',
    'tab-month': 'THEO DÕI THU CHI 12 THÁNG',
    'tab-khaosat': 'BẢNG KHẢO SÁT ĐÁNH GIÁ BẢN THÂN'
  };

  document.getElementById('current-title').textContent = titlesMap[tabId] || 'TÀI CHÍNH CÁ NHÂN';

  document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
  const targetPane = document.getElementById(tabId);
  if (targetPane) {
    targetPane.classList.add('active');
    if (tabId === 'tab-dashboard') {
      updateDashboardCharts();
    }
  }
}

// Chuyển sang Tab Khảo sát
function goToSurveyTab() {
  activateTab('tab-khaosat');
}

// Lưu Khảo sát và quay về Mục tiêu bản thân
function saveSurveyAndBack() {
  const q4Val = document.querySelector('input[name="ks_q4"]:checked')?.value || '2';
  const q5Val = document.querySelector('input[name="ks_q5"]:checked')?.value || '2';

  const riskEl = document.getElementById('survey-result-risk');
  const contextEl = document.getElementById('survey-result-context');

  if (q4Val === '1') {
    riskEl.textContent = 'Kết quả khảo sát khả năng chịu đựng rủi ro: Bạn là người thận trọng, ưu tiên bảo toàn vốn, nên duy trì tài sản an toàn cao.';
  } else if (q4Val === '3') {
    riskEl.textContent = 'Kết quả khảo sát khả năng chịu đựng rủi ro: Bạn là người ưa mạo hiểm, ưu tiên tăng trưởng, sẵn sàng đón nhận biến động ngắn hạn.';
  } else {
    riskEl.textContent = 'Kết quả khảo sát khả năng chịu đựng rủi ro: Bạn là người trung lập với rủi ro, bạn nên duy trì các tài sản rủi ro tại mức trung bình.';
  }

  if (q5Val === '3') {
    contextEl.textContent = 'Kết quả khảo sát hoàn cảnh: Bạn có điều kiện tài chính gia đình vững chắc, nền tảng tối ưu để đầu tư sinh lời mạnh mẽ.';
  } else {
    contextEl.textContent = 'Kết quả khảo sát hoàn cảnh: Bạn trong điều kiện bình thường để phát triển tài chính của bạn trong dài hạn.';
  }

  activateTab('tab-muctieu-bt');
}

// ==================== CÁC HÀM RENDER DỮ LIỆU BAN ĐẦU ====================
function renderSetupTables() {
  // 1. Chi phí
  const tbExp = document.getElementById('tbody-expenses');
  tbExp.innerHTML = AppState.expenses.map((item, idx) => `
    <tr>
      <td>${idx + 1}</td>
      <td class="cell-blue" contenteditable="true" onblur="updateExpenseItem(${idx}, this.innerText)">${item}</td>
    </tr>
  `).join('');

  // 2. Thu nhập
  const tbInc = document.getElementById('tbody-income');
  tbInc.innerHTML = AppState.incomeList.map((item, idx) => `
    <tr>
      <td>${idx + 1}</td>
      <td class="cell-blue" contenteditable="true" onblur="updateIncomeItem(${idx}, this.innerText)">${item}</td>
    </tr>
  `).join('');

  // 3. Kế hoạch phát triển
  const tbLearn = document.getElementById('tbody-learning');
  tbLearn.innerHTML = AppState.planList.map((item, idx) => `
    <tr>
      <td>${idx + 1}</td>
      <td class="cell-blue" contenteditable="true">${item}</td>
    </tr>
  `).join('');

  // 4. Danh mục đầu tư
  const tbInv = document.getElementById('tbody-invest');
  tbInv.innerHTML = AppState.investProducts.map((p, idx) => `
    <tr>
      <td>${idx + 1}</td>
      <td class="cell-blue ${p.name === 'DCDS' ? 'excel-active-cell' : ''}" contenteditable="true">${p.name}</td>
      <td class="text-right cell-blue" contenteditable="true" onblur="updateProductRate(${idx}, this.innerText)">${p.returnRate}%</td>
      <td class="text-right cell-blue" contenteditable="true">${p.risk}%</td>
    </tr>
  `).join('');
}

function updateExpenseItem(idx, newVal) {
  AppState.expenses[idx] = newVal.trim();
  recalculateAll();
}

function updateIncomeItem(idx, newVal) {
  AppState.incomeList[idx] = newVal.trim();
  recalculateAll();
}

function updateProductRate(idx, newVal) {
  const parsed = parseFloat(newVal.replace('%', ''));
  if (!isNaN(parsed)) {
    AppState.investProducts[idx].returnRate = parsed;
    recalculateAll();
  }
}

// Render Mục tiêu bản thân
function renderTargetTables() {
  // Trả nợ
  const tbDebt = document.getElementById('tbody-debt-target');
  tbDebt.innerHTML = AppState.debtTargets.map((d, i) => `
    <tr>
      <td class="cell-green-light text-center font-bold">${i + 1}</td>
      <td class="cell-green-light text-center cell-blue" contenteditable="true">${d.age}</td>
      <td class="cell-green-light cell-blue" contenteditable="true">${d.desc}</td>
      <td class="cell-green-light text-right cell-blue font-bold" contenteditable="true" onblur="updateDebtTarget(${i}, this.innerText)">${d.val}</td>
    </tr>
  `).join('');

  // Đầu tư
  const tbInv = document.getElementById('tbody-invest-target');
  tbInv.innerHTML = AppState.investTargets.map((inv, i) => `
    <tr>
      <td class="cell-green-light text-center font-bold">${i + 4}</td>
      <td class="cell-green-light text-center cell-blue" contenteditable="true">${inv.age}</td>
      <td class="cell-green-light cell-blue" contenteditable="true">${inv.desc}</td>
      <td class="cell-green-light text-right cell-blue font-bold" contenteditable="true" onblur="updateInvestTarget(${i}, this.innerText)">${inv.val}</td>
    </tr>
  `).join('');
}

function updateDebtTarget(idx, text) {
  const val = parseFloat(text.replace(/,/g, '')) || 0;
  AppState.debtTargets[idx].val = val;
  recalculateAll();
}

function updateInvestTarget(idx, text) {
  const val = parseFloat(text.replace(/,/g, '')) || 0;
  AppState.investTargets[idx].val = val;
  recalculateAll();
}

// Render Kế hoạch dự kiến hàng tháng
function renderPlanTables() {
  const tbInc = document.getElementById('tbody-plan-income');
  tbInc.innerHTML = AppState.plannedIncome.map((item, idx) => `
    <tr>
      <td class="text-center">${idx + 1}</td>
      <td>${item.name}</td>
      <td class="text-right cell-blue font-bold" contenteditable="true" onblur="updatePlanInc(${idx}, this.innerText)">${item.val.toFixed(2)}</td>
    </tr>
  `).join('');

  const tbExp = document.getElementById('tbody-plan-expense');
  tbExp.innerHTML = AppState.plannedExpenses.map((item, idx) => `
    <tr>
      <td class="text-center">${idx + 1}</td>
      <td>${item.name}</td>
      <td class="text-right cell-blue font-bold" contenteditable="true" onblur="updatePlanExp(${idx}, this.innerText)">${item.val.toFixed(2)}</td>
    </tr>
  `).join('');
}

function updatePlanInc(idx, text) {
  AppState.plannedIncome[idx].val = parseFloat(text) || 0;
  recalculateAll();
}

function updatePlanExp(idx, text) {
  AppState.plannedExpenses[idx].val = parseFloat(text) || 0;
  recalculateAll();
}

// Render Nút 12 Tháng
function renderMonthButtons() {
  const grp = document.getElementById('month-btn-group');
  grp.innerHTML = '';
  for (let m = 1; m <= 12; m++) {
    const btn = document.createElement('button');
    btn.className = `btn-m ${m === AppState.currentMonth ? 'active' : ''}`;
    btn.textContent = `T${m}`;
    btn.onclick = () => switchMonth(m);
    grp.appendChild(btn);
  }
}

function switchMonth(m) {
  AppState.currentMonth = m;
  document.querySelectorAll('.btn-m').forEach((b, i) => b.classList.toggle('active', i + 1 === m));
  renderMonthDetail(m);
}

// Render bảng chi tiết từng tháng
function renderMonthDetail(m) {
  document.getElementById('m-name-thu').textContent = `Tháng ${m}`;
  document.getElementById('m-name-chi').textContent = `Tháng ${m}`;
  document.getElementById('m-name-tk').textContent = `Tháng ${m}`;
  document.getElementById('m-title-detail').textContent = `THÁNG ${m}`;

  const monthObj = AppState.monthlyData[m] || { income: {}, expense: {} };

  // Thu nhập tháng
  const tbInc = document.getElementById('tbody-month-income');
  tbInc.innerHTML = AppState.incomeList.map(name => {
    const val = monthObj.income[name] !== undefined ? monthObj.income[name] : 0.0;
    return `
      <tr>
        <td>${name}</td>
        <td class="text-right cell-blue font-bold" contenteditable="true" onblur="updateMonthIncomeVal(${m}, '${name}', this.innerText)">${val.toFixed(2)}</td>
      </tr>
    `;
  }).join('');

  // Chi tiêu tháng
  const tbExp = document.getElementById('tbody-month-expense');
  tbExp.innerHTML = AppState.expenses.map(name => {
    const val = monthObj.expense[name] !== undefined ? monthObj.expense[name] : 0.0;
    return `
      <tr>
        <td>${name}</td>
        <td class="text-right cell-blue font-bold" contenteditable="true" onblur="updateMonthExpenseVal(${m}, '${name}', this.innerText)">${val.toFixed(2)}</td>
      </tr>
    `;
  }).join('');

  updateMonthSummaryCards(m);
}

function updateMonthIncomeVal(m, name, text) {
  if (!AppState.monthlyData[m]) AppState.monthlyData[m] = { income: {}, expense: {} };
  AppState.monthlyData[m].income[name] = parseFloat(text) || 0;
  recalculateAll();
}

function updateMonthExpenseVal(m, name, text) {
  if (!AppState.monthlyData[m]) AppState.monthlyData[m] = { income: {}, expense: {} };
  AppState.monthlyData[m].expense[name] = parseFloat(text) || 0;
  recalculateAll();
}

function updateMonthSummaryCards(m) {
  const monthObj = AppState.monthlyData[m] || { income: {}, expense: {} };
  const totalInc = Object.values(monthObj.income).reduce((a, b) => a + b, 0);
  const totalExp = Object.values(monthObj.expense).reduce((a, b) => a + b, 0);
  const savings = totalInc - totalExp;

  document.getElementById('m-val-thu').textContent = `${totalInc.toFixed(2)} tr`;
  document.getElementById('m-val-chi').textContent = `${totalExp.toFixed(2)} tr`;
  document.getElementById('m-val-tk').textContent = `${savings.toFixed(2)} tr`;
}

// ==================== CÔNG THỨC TÍNH TOÁN LIÊN KẾT TOÀN DIỆN ====================
function recalculateAll() {
  // 1. Tự động tính tỷ suất sinh lời danh mục đầu tư
  const sumRate = AppState.investProducts.reduce((acc, p) => acc + p.returnRate, 0);
  const avgRate = AppState.investProducts.length ? (sumRate / AppState.investProducts.length) : 0;
  document.getElementById('dash-expected-return').textContent = `${avgRate.toFixed(2)}%/năm`;

  // 2. Tính tổng mục tiêu đầu tư & trả nợ
  const totalDebt = AppState.debtTargets.reduce((a, b) => a + b.val, 0);
  const totalInvest = AppState.investTargets.reduce((a, b) => a + b.val, 0);
  const grandTotal = totalDebt + totalInvest;

  document.getElementById('sum-debt-target').textContent = `${totalDebt.toLocaleString()} tr`;
  document.getElementById('sum-invest-target').textContent = `${totalInvest.toLocaleString()} tr`;
  document.getElementById('dash-target-savings').textContent = `${totalInvest.toLocaleString()} tr`;

  const ratio = grandTotal > 0 ? (totalInvest / grandTotal) * 100 : 0;
  document.getElementById('val-invest-ratio').textContent = `${ratio.toFixed(2)}%`;

  // 3. Tính toán lộ trình vay & trả nợ (Niên kim)
  calculateDebtSchedule(totalDebt);

  // 4. Tính toán Kế hoạch thu chi hàng tháng
  const planTotalInc = AppState.plannedIncome.reduce((a, b) => a + b.val, 0);
  const planTotalExp = AppState.plannedExpenses.reduce((a, b) => a + b.val, 0);
  const planSave = planTotalInc - planTotalExp;
  const planSavePct = planTotalInc > 0 ? (planSave / planTotalInc) * 100 : 0;

  document.getElementById('plan-sum-income').textContent = `${planTotalInc.toFixed(2)} tr`;
  document.getElementById('plan-sum-expense').textContent = `${planTotalExp.toFixed(2)} tr`;
  document.getElementById('plan-sum-savings').textContent = `${planSave.toFixed(2)} tr (${planSavePct.toFixed(1)}%)`;

  // 5. Tổng hợp dữ liệu từ 12 tháng lên Dashboard
  let yearTotalInc = 0;
  let yearTotalExp = 0;

  for (let m = 1; m <= 12; m++) {
    const mo = AppState.monthlyData[m] || { income: {}, expense: {} };
    yearTotalInc += Object.values(mo.income).reduce((a, b) => a + b, 0);
    yearTotalExp += Object.values(mo.expense).reduce((a, b) => a + b, 0);
  }

  const yearTotalSavings = yearTotalInc - yearTotalExp;
  const expenseRatio = yearTotalInc > 0 ? (yearTotalExp / yearTotalInc) * 100 : 0;
  const savingsRate = yearTotalInc > 0 ? (yearTotalSavings / yearTotalInc) * 100 : 0;

  document.getElementById('dash-total-income').textContent = `${yearTotalInc.toFixed(2)} tr`;
  document.getElementById('dash-avg-income').textContent = `Bình quân ~${(yearTotalInc / 12).toFixed(2)} tr/tháng`;

  document.getElementById('dash-total-expense').textContent = `${yearTotalExp.toFixed(2)} tr`;
  document.getElementById('dash-expense-ratio').textContent = `Chiếm ${expenseRatio.toFixed(1)}% tổng thu`;

  document.getElementById('dash-total-savings').textContent = `${yearTotalSavings.toFixed(2)} tr`;
  document.getElementById('dash-savings-rate').textContent = `Tỷ lệ tích lũy: ${savingsRate.toFixed(1)}%`;

  // Cập nhật card tháng hiện tại
  updateMonthSummaryCards(AppState.currentMonth);
}

// Tính niên kim trả nợ (Amortization Schedule)
function calculateDebtSchedule(principal) {
  const startYr = parseInt(document.getElementById('debt-start-year')?.innerText || '2037', 10);
  const endYr = parseInt(document.getElementById('debt-end-year')?.innerText || '2052', 10);
  const r = (parseFloat(document.getElementById('debt-rate')?.innerText || '8.0') || 8.0) / 100;
  const n = Math.max(1, endYr - startYr);

  document.getElementById('debt-duration').textContent = `${n} năm`;
  document.getElementById('debt-principal').textContent = `${principal.toFixed(1)} tr`;

  // Công thức thanh toán đều (PMT = P * [r(1+r)^n] / [(1+r)^n - 1])
  const pmt = principal * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  document.getElementById('debt-annual-pmt').textContent = `${pmt.toFixed(2)} tr/năm`;

  // Bảng khấu hao 5 năm đầu minh họa
  const tbody = document.getElementById('tbody-amortization');
  let balance = principal;
  let rowsHtml = '';

  for (let i = 0; i < Math.min(n, 5); i++) {
    const year = startYr + i;
    const interest = balance * r;
    const principalPaid = pmt - interest;
    const endBalance = Math.max(0, balance - principalPaid);

    rowsHtml += `
      <tr>
        <td class="text-center">${year}</td>
        <td class="text-right">${balance.toFixed(2)}</td>
        <td class="text-right cell-blue">${principalPaid.toFixed(2)}</td>
        <td class="text-right text-red">${interest.toFixed(2)}</td>
        <td class="text-right font-bold">${pmt.toFixed(2)}</td>
        <td class="text-right font-bold">${endBalance.toFixed(2)}</td>
      </tr>
    `;
    balance = endBalance;
  }

  if (n > 5) {
    rowsHtml += `<tr><td colspan="6" class="text-center font-medium" style="color: #64748b;">... Tính toán niên kim tự động cho các năm tiếp theo đến ${endYr}</td></tr>`;
  }

  tbody.innerHTML = rowsHtml;
}

// ==================== CẬP NHẬT BIỂU ĐỒ DASHBOARD TỰ ĐỘNG ====================
let pieChartInstance = null;
let barChartInstance = null;

function updateDashboardCharts() {
  // Dữ liệu cột 12 tháng
  const income12 = [];
  const expense12 = [];
  const categoryTotals = {};

  for (let m = 1; m <= 12; m++) {
    const mo = AppState.monthlyData[m] || { income: {}, expense: {} };
    const inc = Object.values(mo.income).reduce((a, b) => a + b, 0);
    const exp = Object.values(mo.expense).reduce((a, b) => a + b, 0);
    income12.push(inc);
    expense12.push(exp);

    // Gom nhóm chi phí
    Object.entries(mo.expense).forEach(([cat, val]) => {
      categoryTotals[cat] = (categoryTotals[cat] || 0) + val;
    });
  }

  // 1. Biểu đồ hình tròn
  const pieCtx = document.getElementById('pieChart')?.getContext('2d');
  if (pieCtx) {
    const pieLabels = Object.keys(categoryTotals);
    const pieData = Object.values(categoryTotals);

    if (pieChartInstance) pieChartInstance.destroy();
    pieChartInstance = new Chart(pieCtx, {
      type: 'doughnut',
      data: {
        labels: pieLabels.length ? pieLabels : ['Chưa có dữ liệu'],
        datasets: [{
          data: pieData.length ? pieData : [1],
          backgroundColor: ['#ef4444', '#f97316', '#3b82f6', '#10b981', '#8b5cf6', '#eab308', '#ec4899', '#6366f1']
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom' } }
      }
    });
  }

  // 2. Biểu đồ cột 12 tháng
  const barCtx = document.getElementById('barChart')?.getContext('2d');
  if (barCtx) {
    if (barChartInstance) barChartInstance.destroy();
    barChartInstance = new Chart(barCtx, {
      type: 'bar',
      data: {
        labels: ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'],
        datasets: [
          { label: 'Thu nhập thực tế', data: income12, backgroundColor: '#10b981' },
          { label: 'Chi tiêu thực tế', data: expense12, backgroundColor: '#ef4444' }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: { y: { beginAtZero: true } },
        plugins: { legend: { position: 'bottom' } }
      }
    });
  }
}

// ==================== CÁC HÀM NÚT CỘNG THÊM HÀNG (+) ====================
function addExpenseRow() {
  AppState.expenses.push(`Khoản chi mới ${AppState.expenses.length + 1}`);
  renderSetupTables();
  recalculateAll();
}

function addIncomeRow() {
  AppState.incomeList.push(`Nguồn thu mới ${AppState.incomeList.length + 1}`);
  renderSetupTables();
  recalculateAll();
}

function addPlanRow() {
  AppState.planList.push(`Mục tiêu học tập ${AppState.planList.length + 1}`);
  renderSetupTables();
}

function addInvestRow() {
  AppState.investProducts.push({ name: 'Sản phẩm mới', returnRate: 10, risk: 10 });
  renderSetupTables();
  recalculateAll();
}

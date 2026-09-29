// ==================== CƠ CHẾ TRACKING NĂM & TUỔI TỰ ĐỘNG ====================
let currentYear = 2023;
let currentAge = 21;
let birthYear = currentYear - currentAge; // Mặc định năm sinh 2002

document.addEventListener('DOMContentLoaded', () => {
  const inputYearEl = document.getElementById('input-year');
  const inputAgeEl = document.getElementById('input-age');

  function syncYearToAllElements(year) {
    document.querySelectorAll('.dynamic-year').forEach(el => {
      el.textContent = year;
    });
  }

  if (inputYearEl) {
    inputYearEl.addEventListener('input', () => {
      const rawVal = inputYearEl.innerText.trim();
      const parsedYear = parseInt(rawVal, 10);

      if (!isNaN(parsedYear) && parsedYear > 1900 && parsedYear < 2100) {
        currentYear = parsedYear;
        syncYearToAllElements(currentYear);

        const calculatedAge = currentYear - birthYear;
        if (calculatedAge > 0 && calculatedAge < 120 && inputAgeEl) {
          currentAge = calculatedAge;
          inputAgeEl.innerText = currentAge;
        }
      }
    });
  }

  if (inputAgeEl) {
    inputAgeEl.addEventListener('input', () => {
      const rawVal = inputAgeEl.innerText.trim();
      const parsedAge = parseInt(rawVal, 10);

      if (!isNaN(parsedAge) && parsedAge > 0 && parsedAge < 120) {
        currentAge = parsedAge;
        birthYear = currentYear - currentAge;
      }
    });
  }

  // ==================== CHUYỂN ĐỔI TAB SIDEBAR ====================
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const tabId = item.getAttribute('data-tab');
      if (item.classList.contains('nav-month')) {
        const monthNum = parseInt(item.getAttribute('data-month'), 10);
        activateTab('tab-month');
        switchMonth(monthNum);
      } else {
        activateTab(tabId);
      }
    });
  });
});

// Hàm chuyển tab
function activateTab(tabId) {
  const navItems = document.querySelectorAll('.nav-item');
  const bannerTitle = document.getElementById('current-title');
  const targetItem = document.querySelector(`.nav-item[data-tab="${tabId}"]`);

  navItems.forEach(i => i.classList.remove('active'));
  if (targetItem) {
    targetItem.classList.add('active');
  }

  // Tiêu đề dải cam theo từng trang của case study
  const titlesMap = {
    'tab-tukhoa': 'TỪ KHÓA',
    'tab-dashboard': 'THEO DÕI TÀI CHÍNH CÁ NHÂN',
    'tab-muctieu-bt': 'XÁC ĐỊNH MỤC TIÊU BẢN THÂN',
    'tab-muctieu-tc': 'XÁC ĐỊNH MỤC TIÊU TÀI CHÍNH',
    'tab-candoi': 'CÂN ĐỐI LỘ TRÌNH NGHỀ NGHIỆP',
    'tab-kehoach': 'KẾ HOẠCH THU NHẬP VÀ CHI TIÊU',
    'tab-month': 'THEO DÕI THU - CHI CHI TIẾT',
    'tab-khaosat': 'BẢNG KHẢO SÁT ĐÁNH GIÁ BẢN THÂN'
  };

  bannerTitle.textContent = titlesMap[tabId] || 'TÀI CHÍNH CÁ NHÂN';

  // Chuyển pane hiển thị
  document.querySelectorAll('.tab-pane').forEach(pane => {
    pane.classList.remove('active');
  });

  const activePane = document.getElementById(tabId);
  if (activePane) {
    activePane.classList.add('active');
    if (tabId === 'tab-dashboard') {
      initCharts();
    }
  }
}

// Chuyển tab sang Bảng khảo sát
function goToSurveyTab() {
  activateTab('tab-khaosat');
}

// Lưu khảo sát và quay về Mục tiêu bản thân
function saveSurveyAndBack() {
  activateTab('tab-muctieu-bt');
}

// ==================== DỮ LIỆU 12 THÁNG (T1 -> T12) ====================
const monthData = {
  1: { thu: 24.0, chi: 17.5, tk: 6.5 },
  2: { thu: 28.5, chi: 19.0, tk: 9.5 },
  3: { thu: 25.0, chi: 16.5, tk: 8.5 },
  4: { thu: 30.0, chi: 21.0, tk: 9.0 },
  5: { thu: 26.5, chi: 18.0, tk: 8.5 },
  6: { thu: 27.0, chi: 17.0, tk: 10.0 },
  7: { thu: 26.0, chi: 18.5, tk: 7.5 },
  8: { thu: 28.0, chi: 19.5, tk: 8.5 },
  9: { thu: 27.5, chi: 18.0, tk: 9.5 },
  10: { thu: 29.0, chi: 20.0, tk: 9.0 },
  11: { thu: 28.5, chi: 19.25, tk: 9.25 },
  12: { thu: 29.4, chi: 19.5, tk: 9.9 }
};

function switchMonth(m) {
  document.querySelectorAll('.btn-m').forEach((btn, idx) => {
    btn.classList.toggle('active', idx + 1 === m);
  });

  const data = monthData[m] || { thu: 25.0, chi: 18.0, tk: 7.0 };
  document.getElementById('m-name-thu').textContent = `Tháng ${m}`;
  document.getElementById('m-name-chi').textContent = `Tháng ${m}`;
  document.getElementById('m-name-tk').textContent = `Tháng ${m}`;

  document.getElementById('m-val-thu').textContent = `${data.thu.toFixed(2)} tr`;
  document.getElementById('m-val-chi').textContent = `${data.chi.toFixed(2)} tr`;
  document.getElementById('m-val-tk').textContent = `${data.tk.toFixed(2)} tr`;

  // Highlight menu bên trái
  const leftItem = document.querySelector(`.nav-month[data-month="${m}"]`);
  if (leftItem) {
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    leftItem.classList.add('active');
  }
}

// ==================== THÊM HÀNG CHO BẢNG ====================
function addExpenseRow() {
  const tbody = document.querySelector('#table-expenses tbody');
  const rowCount = tbody.rows.length + 1;
  const tr = document.createElement('tr');
  tr.innerHTML = `<td>${rowCount}</td><td class="cell-blue" contenteditable="true"></td>`;
  tbody.appendChild(tr);
  focusCell(tr.cells[1]);
}

function addIncomeRow() {
  const tbody = document.querySelector('#table-income tbody');
  const rowCount = tbody.rows.length + 1;
  const tr = document.createElement('tr');
  tr.innerHTML = `<td>${rowCount}</td><td class="cell-blue" contenteditable="true"></td>`;
  tbody.appendChild(tr);
  focusCell(tr.cells[1]);
}

function addPlanRow() {
  const tbody = document.querySelector('#table-learning tbody');
  const rowCount = tbody.rows.length + 1;
  const tr = document.createElement('tr');
  tr.innerHTML = `<td>${rowCount}</td><td class="cell-blue" contenteditable="true"></td>`;
  tbody.appendChild(tr);
  focusCell(tr.cells[1]);
}

function addInvestRow() {
  const tbody = document.querySelector('#table-invest tbody');
  const rowCount = tbody.rows.length + 1;
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td>${rowCount}</td>
    <td class="cell-blue" contenteditable="true"></td>
    <td class="text-right cell-blue" contenteditable="true">0%</td>
    <td class="text-right cell-blue" contenteditable="true">0%</td>
  `;
  tbody.appendChild(tr);
  focusCell(tr.cells[1]);
}

function focusCell(cell) {
  cell.focus();
  const range = document.createRange();
  const sel = window.getSelection();
  range.selectNodeContents(cell);
  range.collapse(false);
  sel.removeAllRanges();
  sel.addRange(range);
}

// ==================== CHARTS DASHBOARD ====================
let pieChartInstance = null;
let barChartInstance = null;

function initCharts() {
  if (pieChartInstance && barChartInstance) return;

  const ctxPie = document.getElementById('pieChart')?.getContext('2d');
  if (ctxPie) {
    pieChartInstance = new Chart(ctxPie, {
      type: 'doughnut',
      data: {
        labels: ['Mua thực phẩm (60 tr)', 'Đi ăn ở ngoài (24 tr)', 'Phát triển bản thân (18 tr)', 'Tiền điện nước xe (24 tr)', 'Chi trả nợ (78 tr)', 'Khác (19.75 tr)'],
        datasets: [{
          data: [60, 24, 18, 24, 78, 19.75],
          backgroundColor: ['#ef4444', '#f97316', '#3b82f6', '#10b981', '#8b5cf6', '#eab308']
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom' } }
      }
    });
  }

  const ctxBar = document.getElementById('barChart')?.getContext('2d');
  if (ctxBar) {
    barChartInstance = new Chart(ctxBar, {
      type: 'bar',
      data: {
        labels: ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'],
        datasets: [
          {
            label: 'Thu nhập',
            data: [24.0, 28.5, 25.0, 30.0, 26.5, 27.0, 26.0, 28.0, 27.5, 29.0, 28.5, 29.4],
            backgroundColor: '#10b981'
          },
          {
            label: 'Chi tiêu',
            data: [17.5, 19.0, 16.5, 21.0, 18.0, 17.0, 18.5, 19.5, 18.0, 20.0, 19.25, 19.5],
            backgroundColor: '#ef4444'
          }
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

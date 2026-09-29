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

  // ==================== ĐIỀU HƯỚNG TAB TRÊN SIDEBAR ====================
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const tabId = item.getAttribute('data-tab');
      activateTab(tabId);
    });
  });
});

// Hàm kích hoạt chuyển Tab dùng chung
function activateTab(tabId) {
  const navItems = document.querySelectorAll('.nav-item');
  const bannerTitle = document.getElementById('current-title');
  const targetItem = document.querySelector(`.nav-item[data-tab="${tabId}"]`);

  navItems.forEach(i => i.classList.remove('active'));
  if (targetItem) {
    targetItem.classList.add('active');
  }

  // Cập nhật tiêu đề dải màu cam
  if (tabId === 'tab-muctieu-bt') {
    bannerTitle.textContent = 'XÁC ĐỊNH MỤC TIÊU BẢN THÂN';
  } else if (targetItem) {
    const text = targetItem.querySelector('span').innerText.replace(/\n/g, ' ');
    bannerTitle.textContent = text.toUpperCase();
  }

  // Ẩn tất cả các tab
  document.querySelectorAll('.tab-pane').forEach(pane => {
    pane.classList.remove('active');
  });

  // Hiện tab mục tiêu
  const activePane = document.getElementById(tabId);
  if (activePane) {
    activePane.classList.add('active');
    if (tabId === 'tab-dashboard') {
      initCharts();
    }
  } else {
    // Nếu là tab phụ chưa làm giao diện riêng
    const genericPane = document.getElementById('tab-generic');
    const emptyTitle = document.getElementById('empty-title');
    if (genericPane) {
      genericPane.classList.add('active');
      if (emptyTitle && targetItem) {
        emptyTitle.textContent = targetItem.querySelector('span').innerText;
      }
    }
  }
}

// NÚT "Link khảo sát": Tự động kích hoạt chuyển sang tab Bảng khảo sát
function goToSurveyTab() {
  activateTab('tab-khaosat');
}

// Nút lưu khảo sát và quay về Mục tiêu bản thân
function saveSurveyAndBack() {
  activateTab('tab-muctieu-bt');
}

// ==================== THÊM DÒNG CHO CÁC BẢNG DANH MỤC ====================
function addExpenseRow() {
  const tbody = document.querySelector('#table-expenses tbody');
  const rowCount = tbody.rows.length + 1;
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td>${rowCount}</td>
    <td class="cell-blue" contenteditable="true"></td>
  `;
  tbody.appendChild(tr);
  focusCell(tr.cells[1]);
}

function addIncomeRow() {
  const tbody = document.querySelector('#table-income tbody');
  const rowCount = tbody.rows.length + 1;
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td>${rowCount}</td>
    <td class="cell-blue" contenteditable="true"></td>
  `;
  tbody.appendChild(tr);
  focusCell(tr.cells[1]);
}

function addPlanRow() {
  const tbody = document.querySelector('#table-learning tbody');
  const rowCount = tbody.rows.length + 1;
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td>${rowCount}</td>
    <td class="cell-blue" contenteditable="true"></td>
  `;
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
        labels: ['Chi tiêu thiết yếu', 'Học tập & PTTN', 'Tích lũy & Đầu tư', 'Giải trí'],
        datasets: [{
          data: [45, 15, 30, 10],
          backgroundColor: ['#f87171', '#60a5fa', '#34d399', '#fbbf24']
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom' }
        }
      }
    });
  }

  const ctxBar = document.getElementById('barChart')?.getContext('2d');
  if (ctxBar) {
    barChartInstance = new Chart(ctxBar, {
      type: 'bar',
      data: {
        labels: ['T1', 'T2', 'T3', 'T4', 'T5', 'T6'],
        datasets: [
          {
            label: 'Thu nhập',
            data: [38, 42, 39, 45, 43, 45],
            backgroundColor: '#10b981'
          },
          {
            label: 'Chi tiêu',
            data: [20, 22, 19, 24, 21, 21.4],
            backgroundColor: '#ef4444'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: { beginAtZero: true }
        },
        plugins: {
          legend: { position: 'bottom' }
        }
      }
    });
  }
}

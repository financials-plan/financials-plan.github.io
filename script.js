// ==================== CƠ CHẾ TRACKING NĂM & TUỔI TỰ ĐỘNG ====================
let currentYear = 2023;
let currentAge = 21;
let birthYear = currentYear - currentAge; // Mặc định năm sinh 2002

document.addEventListener('DOMContentLoaded', () => {
  const inputYearEl = document.getElementById('input-year');
  const inputAgeEl = document.getElementById('input-age');

  // Hàm đồng bộ năm lên toàn bộ các vị trí có class "dynamic-year"
  function syncYearToAllElements(year) {
    document.querySelectorAll('.dynamic-year').forEach(el => {
      el.textContent = year;
    });
  }

  // Khi người dùng nhập/sửa ô Năm bắt đầu theo dõi
  inputYearEl.addEventListener('input', () => {
    const rawVal = inputYearEl.innerText.trim();
    const parsedYear = parseInt(rawVal, 10);

    if (!isNaN(parsedYear) && parsedYear > 1900 && parsedYear < 2100) {
      currentYear = parsedYear;
      syncYearToAllElements(currentYear);

      // Tự động tính toán lại tuổi tương ứng
      const calculatedAge = currentYear - birthYear;
      if (calculatedAge > 0 && calculatedAge < 120) {
        currentAge = calculatedAge;
        inputAgeEl.innerText = currentAge;
      }
    }
  });

  // Khi người dùng trực tiếp sửa ô Tuổi
  inputAgeEl.addEventListener('input', () => {
    const rawVal = inputAgeEl.innerText.trim();
    const parsedAge = parseInt(rawVal, 10);

    if (!isNaN(parsedAge) && parsedAge > 0 && parsedAge < 120) {
      currentAge = parsedAge;
      // Cập nhật lại năm sinh ngầm để khi đổi năm sau này vẫn tính chính xác
      birthYear = currentYear - currentAge;
    }
  });

  // ==================== CHUYỂN ĐỔI TAB SIDEBAR ====================
  const navItems = document.querySelectorAll('.nav-item');
  const bannerTitle = document.getElementById('current-title');
  const tabTuKhoa = document.getElementById('tab-tukhoa');
  const tabDashboard = document.getElementById('tab-dashboard');
  const tabGeneric = document.getElementById('tab-generic');
  const emptyTitle = document.getElementById('empty-title');

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      navItems.forEach(i => i.classList.remove('active'));
      item.classList.add('active');

      const tabId = item.getAttribute('data-tab');
      const text = item.querySelector('span').innerText.replace(/\n/g, ' ');

      bannerTitle.textContent = text.toUpperCase();

      tabTuKhoa.classList.remove('active');
      tabDashboard.classList.remove('active');
      tabGeneric.classList.remove('active');

      if (tabId === 'tab-tukhoa') {
        tabTuKhoa.classList.add('active');
      } else if (tabId === 'tab-dashboard') {
        tabDashboard.classList.add('active');
        initCharts();
      } else {
        tabGeneric.classList.add('active');
        emptyTitle.textContent = text;
      }
    });
  });
});

// ==================== HÀM THÊM HÀNG CHO CÁC BẢNG ====================

// 1. Thêm dòng cho Bảng Danh mục chi phí
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

// 2. Thêm dòng cho Bảng Danh mục thu nhập
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

// 3. Thêm dòng cho Bảng Kế hoạch phát triển
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

// 4. Thêm dòng cho Bảng Danh mục sản phẩm đầu tư
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

// Tự động focus con trỏ vào ô để gõ nội dung ngay sau khi thêm dòng
function focusCell(cell) {
  cell.focus();
  const range = document.createRange();
  const sel = window.getSelection();
  range.selectNodeContents(cell);
  range.collapse(false);
  sel.removeAllRanges();
  sel.addRange(range);
}

// ==================== DASHBOARD CHARTS ====================
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

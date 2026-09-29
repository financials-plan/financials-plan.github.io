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

// 1. Thêm dòng cho bảng Chi Phí
function addExpenseRow() {
  const tbody = document.querySelector('#table-expense tbody');
  const count = tbody.rows.length + 1;
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td>${count}</td>
    <td class="cell-blue" contenteditable="true"></td>
  `;
  tbody.appendChild(tr);
  const targetCell = tr.cells[1];
  targetCell.focus();
}

// 2. Thêm dòng cho bảng Thu Nhập
function addIncomeRow() {
  const tbody = document.querySelector('#table-income tbody');
  const count = tbody.rows.length + 1;
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td>${count}</td>
    <td class="cell-blue" contenteditable="true"></td>
  `;
  tbody.appendChild(tr);
  const targetCell = tr.cells[1];
  targetCell.focus();
}

// 3. Thêm dòng cho bảng Kế hoạch phát triển (viết thêm plan mới)
function addPlanRow() {
  const tbody = document.querySelector('#table-plan tbody');
  const count = tbody.rows.length + 1;
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td>${count}</td>
    <td class="cell-blue" contenteditable="true"></td>
  `;
  tbody.appendChild(tr);
  const targetCell = tr.cells[1];
  targetCell.focus();
}

// 4. Thêm dòng cho bảng Sản phẩm đầu tư (4 cột)
function addInvestRow() {
  const tbody = document.querySelector('#table-invest tbody');
  const count = tbody.rows.length + 1;
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td>${count}</td>
    <td class="cell-blue" contenteditable="true"></td>
    <td class="text-right cell-blue" contenteditable="true">0%</td>
    <td class="text-right cell-blue" contenteditable="true">0%</td>
  `;
  tbody.appendChild(tr);
  const targetCell = tr.cells[1];
  targetCell.focus();
}

// Xử lý chuyển tab khi nhấn menu Sidebar
document.addEventListener('DOMContentLoaded', () => {
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

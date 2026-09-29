// Khởi tạo các biểu đồ Chart.js khi mở Dashboard
let pieChartInstance = null;
let barChartInstance = null;

function initCharts() {
  if (pieChartInstance && barChartInstance) return;

  const ctxPie = document.getElementById('pieChart')?.getContext('2d');
  if (ctxPie) {
    pieChartInstance = new Chart(ctxPie, {
      type: 'doughnut',
      data: {
        labels: ['Chi tiêu thiết yếu', 'Học tập & PTTN', 'Tích lũy & Đầu tư', 'Giải trí hưởng thụ'],
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

// Xử lý chuyển đổi Tab khi bấm menu Sidebar
document.addEventListener('DOMContentLoaded', () => {
  const navItems = document.querySelectorAll('.nav-item');
  const bannerTitle = document.getElementById('current-title');
  const tabTuKhoa = document.getElementById('tab-tukhoa');
  const tabDashboard = document.getElementById('tab-dashboard');
  const tabGeneric = document.getElementById('tab-generic');
  const emptyTitle = document.getElementById('empty-title');

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      // Đổi class active ở menu
      navItems.forEach(i => i.classList.remove('active'));
      item.classList.add('active');

      const tabId = item.getAttribute('data-tab');
      const text = item.querySelector('span').innerText;
      
      // Đồng bộ tiêu đề trên dải màu cam
      bannerTitle.textContent = text.toUpperCase();

      // Ẩn tất cả tab
      tabTuKhoa.classList.remove('active');
      tabDashboard.classList.remove('active');
      tabGeneric.classList.remove('active');

      // Hiển thị tab tương ứng
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

// Hàm thêm dòng cho bảng đơn giản (2 cột)
function addRow(tableId) {
  const table = document.getElementById(tableId).querySelector('tbody');
  const rowCount = table.rows.length + 1;
  const newRow = table.insertRow();
  newRow.innerHTML = `
    <td>${rowCount}</td>
    <td contenteditable="true">Mục mới ${rowCount}</td>
  `;
}

// Hàm thêm dòng cho bảng đầu tư (4 cột)
function addRowInvest(tableId) {
  const table = document.getElementById(tableId).querySelector('tbody');
  const rowCount = table.rows.length + 1;
  const newRow = table.insertRow();
  newRow.innerHTML = `
    <td>${rowCount}</td>
    <td contenteditable="true">Mã quỹ / CP mới</td>
    <td class="text-right" contenteditable="true">10%</td>
    <td class="text-right" contenteditable="true">12%</td>
  `;
}

/**
 * HỆ THỐNG QUẢN LÝ TÀI CHÍNH CÁ NHÂN DỄ DÙNG & CHUYÊN SÂU
 * Tự động đồng bộ phản ứng (Reactive Flow), công thức dòng tiền chuẩn Excel
 * Tích hợp nhận diện đa người dùng & phân vùng Cloud Firestore
 */

// ==================== THEME MANAGER (LIGHT / DARK) ====================
window.initTheme = function() {
  let theme = null;
  try {
    theme = localStorage.getItem('FIN_APP_THEME');
  } catch (e) {}

  if (!theme) {
    theme = (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
  }

  window.applyTheme(theme, false);
};

window.getChartThemeTokens = function() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  return {
    isDark: isDark,
    text: isDark ? '#F0F4FA' : '#292747',
    textMuted: isDark ? '#94A3B8' : '#8582A3',
    grid: isDark ? '#232D42' : '#E8E5F7',
    border: isDark ? '#161D2B' : '#ffffff',
    planBar: isDark ? '#242E44' : '#E8E5F7'
  };
};

window.applyTheme = function(theme, shouldRefreshCharts = true) {
  const isDark = (theme === 'dark');
  document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');

  const themeBtn = document.getElementById('btn-theme-toggle');
  if (themeBtn) {
    themeBtn.setAttribute('title', isDark ? 'Chuyển sang chế độ Sáng' : 'Chuyển sang chế độ Tối');
    themeBtn.setAttribute('aria-label', isDark ? 'Chuyển sang chế độ Sáng' : 'Chuyển sang chế độ Tối');
  }

  // Đồng bộ trạng thái Day–night sky switch (Lucian #021)
  const u021Switch = document.getElementById('u021-theme-switch');
  const u021Label = document.getElementById('u021-theme-label');
  if (u021Switch) {
    u021Switch.setAttribute('aria-checked', isDark ? 'true' : 'false');
    u021Switch.setAttribute('title', isDark ? 'Đang bật Giao diện Tối (Bấm để chuyển sang Sáng)' : 'Đang bật Giao diện Sáng (Bấm để chuyển sang Tối)');
    u021Switch.setAttribute('aria-label', isDark ? 'Chuyển sang giao diện Sáng' : 'Chuyển sang giao diện Tối');
    if (isDark) {
      u021Switch.classList.add('u021-is-dark');
    } else {
      u021Switch.classList.remove('u021-is-dark');
    }
  }
  if (u021Label) {
    u021Label.textContent = isDark ? 'Giao diện tối' : 'Giao diện sáng';
  }

  if (typeof Chart !== 'undefined') {
    const tokens = window.getChartThemeTokens();
    Chart.defaults.color = tokens.textMuted;
    Chart.defaults.borderColor = tokens.grid;
  }

  if (shouldRefreshCharts) {
    window.refreshChartsOnThemeChange(isDark);
  }
};

window.toggleTheme = function(e) {
  if (e && e.stopPropagation) e.stopPropagation();
  const currentTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

  try {
    localStorage.setItem('FIN_APP_THEME', newTheme);
  } catch (err) {}

  window.applyTheme(newTheme, true);
};

window.refreshChartsOnThemeChange = function(isDark) {
  if (typeof Chart === 'undefined') return;

  try {
    if (document.getElementById('tab-dashboard')?.classList.contains('active')) {
      if (typeof renderDashboardAllCharts === 'function') renderDashboardAllCharts();
    } else if (document.getElementById('tab-month')?.classList.contains('active')) {
      if (typeof renderMonthHorizontalBarChart === 'function') renderMonthHorizontalBarChart();
    } else if (document.getElementById('tab-muctieu-tc')?.classList.contains('active')) {
      if (typeof renderTcMatrixChart === 'function') renderTcMatrixChart();
    } else if (document.getElementById('tab-candoi')?.classList.contains('active')) {
      if (typeof renderCareerChart === 'function') renderCareerChart();
    } else if (document.getElementById('tab-khaosat')?.classList.contains('active')) {
      if (typeof renderSurveyQuestionCharts === 'function') renderSurveyQuestionCharts();
    }
  } catch (e) {
    console.warn('Chart refresh on theme change:', e);
  }
};

// Khởi chạy áp dụng theme ngay lập tức để tránh chớp trắng giao diện
try { window.initTheme(); } catch (e) {}

// ==================== HÀM CHUẨN HÓA TÊN DÙNG CHUNG ====================
/**
 * Chuẩn hóa họ tên người dùng thành định danh Firestore ổn định
 * Quy tắc:
 * 1. Chữ thường
 * 2. Bỏ dấu tiếng Việt & dấu phụ Unicode
 * 3. Thay khoảng trắng bằng gạch dưới '_'
 * 4. Loại bỏ ký tự không phù hợp
 * 5. Khử nhiều dấu gạch dưới liên tiếp và ở hai đầu
 * Ví dụ: "Nguyễn Văn An" -> "nguyen_van_an"
 */
function normalizeUserName(rawName) {
  if (!rawName || typeof rawName !== 'string') return '';
  let str = rawName.trim().toLowerCase();
  
  // Phân rã tổ hợp Unicode và xóa dấu phụ (diacritical marks)
  str = str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  
  // Xử lý riêng chữ 'đ' / 'Đ' của tiếng Việt
  str = str.replace(/[đĐ]/g, 'd');
  
  // Thay thế khoảng trắng (một hoặc nhiều khoảng trắng) bằng dấu gạch dưới
  str = str.replace(/\s+/g, '_');
  
  // Loại bỏ các ký tự đặc biệt, chỉ giữ lại a-z, 0-9 và dấu gạch dưới
  str = str.replace(/[^a-z0-9_]/g, '');
  
  // Rút gọn nhiều dấu gạch dưới liên tiếp thành một
  str = str.replace(/_+/g, '_');
  
  // Loại bỏ dấu gạch dưới ở đầu và cuối chuỗi
  str = str.replace(/^_+|_+$/g, '');
  
  return str;
}

// ==================== CÁC HÀM TIỆN ÍCH DÙNG CHUNG ====================
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * FIX B: Đồng bộ ngày giao dịch - Chuyển đổi định dạng ngày an toàn tránh timezone offset
 * Storage format: YYYY-MM-DD
 * Display format: DD/MM/YYYY
 */
function formatDisplayDate(isoStr) {
  if (!isoStr || typeof isoStr !== 'string') return '';
  const clean = isoStr.trim();
  const parts = clean.split('-');
  if (parts.length === 3 && parts[0].length === 4) {
    const y = parts[0];
    const m = parts[1].padStart(2, '0');
    const d = parts[2].padStart(2, '0');
    return `${d}/${m}/${y}`;
  }
  const slashParts = clean.split('/');
  if (slashParts.length === 3 && slashParts[2].length === 4) {
    return clean;
  }
  return clean;
}

function parseToIsoDate(str) {
  if (!str || typeof str !== 'string') return '';
  const clean = str.trim();
  const slashParts = clean.split('/');
  if (slashParts.length === 3 && slashParts[2].length === 4) {
    const d = slashParts[0].padStart(2, '0');
    const m = slashParts[1].padStart(2, '0');
    const y = slashParts[2];
    return `${y}-${m}-${d}`;
  }
  const dashParts = clean.split('-');
  if (dashParts.length === 3 && dashParts[0].length === 4) {
    const y = dashParts[0];
    const m = dashParts[1].padStart(2, '0');
    const d = dashParts[2].padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  return clean;
}

function getMonthFromIso(iso) {
  if (!iso || typeof iso !== 'string') return null;
  const parts = iso.trim().split('-');
  if (parts.length >= 2) {
    const m = parseInt(parts[1], 10);
    return !isNaN(m) && m >= 1 && m <= 12 ? m : null;
  }
  return null;
}

function sortMonthTransactions(m, type) {
  if (!AppState.monthlyDetails[m]) return;
  const list = AppState.monthlyDetails[m][type];
  if (!Array.isArray(list)) return;
  list.sort((a, b) => {
    if (!a.date) return 1;
    if (!b.date) return -1;
    return a.date.localeCompare(b.date);
  });
}

// ==================== QUẢN LÝ PHIÊN NGƯỜI DÙNG & TÀI KHOẢN (MẪU LUCIAN #037) ====================
const UserSession = {
  STORAGE_KEY: "FIN_APP_USER_SESSION",
  PROFILES_KEY: "FIN_APP_PROFILES_LIST",
  currentUser: null, // { rawName, normalizedName, docId, lastActive }

  getStored() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error("Lỗi đọc session từ localStorage:", e);
      return null;
    }
  },

  getProfilesList() {
    try {
      const data = localStorage.getItem(this.PROFILES_KEY);
      const list = data ? JSON.parse(data) : [];
      return Array.isArray(list) ? list : [];
    } catch (e) {
      console.error("Lỗi đọc danh sách hồ sơ:", e);
      return [];
    }
  },

  addProfile(user) {
    if (!user || !user.docId || !user.rawName) return;
    try {
      let list = this.getProfilesList();
      const existingIdx = list.findIndex(p => p.docId === user.docId);
      const profileData = {
        rawName: user.rawName,
        normalizedName: user.normalizedName || normalizeUserName(user.rawName),
        docId: user.docId,
        lastActive: Date.now()
      };
      if (existingIdx >= 0) {
        list[existingIdx] = Object.assign(list[existingIdx], profileData);
      } else {
        list.push(profileData);
      }
      localStorage.setItem(this.PROFILES_KEY, JSON.stringify(list));
    } catch (e) {
      console.error("Lỗi ghi danh sách hồ sơ:", e);
    }
  },

  setStored(user) {
    this.currentUser = user;
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
    } catch (e) {
      console.error("Lỗi ghi session vào localStorage:", e);
    }
    if (user) {
      this.addProfile(user);
    }
    this.updateUI();
  },

  clear() {
    this.currentUser = null;
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (e) {}
    this.updateUI();
  },

  updateUI() {
    const rawEl = document.getElementById('display-raw-name');
    const slugEl = document.getElementById('display-id-slug');
    const chipName = document.getElementById('chip-display-name');
    const chipSlug = document.getElementById('chip-display-slug');
    const chipAvatar = document.getElementById('chip-user-avatar');

    if (this.currentUser) {
      const raw = this.currentUser.rawName || 'Người dùng';
      const slug = `@${this.currentUser.docId}`;
      const initial = (raw.trim().charAt(0) || 'U').toUpperCase();

      if (rawEl) rawEl.textContent = raw;
      if (slugEl) slugEl.textContent = slug;
      if (chipName) chipName.textContent = raw;
      if (chipSlug) chipSlug.textContent = slug;
      if (chipAvatar) chipAvatar.textContent = initial;
    } else {
      if (rawEl) rawEl.textContent = "Chưa xác nhận";
      if (slugEl) slugEl.textContent = "@guest";
      if (chipName) chipName.textContent = "Chưa xác nhận";
      if (chipSlug) chipSlug.textContent = "@guest";
      if (chipAvatar) chipAvatar.textContent = "?";
    }

    if (typeof window.renderAccountSwitcher === 'function') {
      window.renderAccountSwitcher();
    }
  }
};

// ==================== ACCOUNT SWITCHER CONTROLLER (MẪU LUCIAN #037) ====================
window.renderAccountSwitcher = function() {
  const listEl = document.getElementById('rail-account-list');
  const countEl = document.getElementById('account-profiles-count');
  if (!listEl) return;

  const current = UserSession.currentUser;
  if (current && current.docId) {
    UserSession.addProfile(current);
  }

  const profiles = UserSession.getProfilesList();
  if (countEl) {
    countEl.textContent = `${profiles.length} hồ sơ`;
  }

  if (profiles.length === 0) {
    listEl.innerHTML = `
      <div style="padding: 0.875rem 0.75rem; text-align: center; color: var(--text-muted); font-size: 0.8125rem;">
        <i class="fa-solid fa-user-clock" style="font-size: 1.25rem; display: block; margin-bottom: 0.375rem; opacity: 0.5;"></i>
        Chưa có hồ sơ nào được lưu
      </div>
    `;
    return;
  }

  listEl.innerHTML = profiles.map(p => {
    const isActive = current && current.docId === p.docId;
    const initial = (p.rawName || 'U').trim().charAt(0).toUpperCase();
    return `
      <div class="account-item ${isActive ? 'active' : ''}" 
           role="menuitem" 
           tabindex="0" 
           data-doc-id="${escapeHtml(p.docId)}"
           onclick="switchUserProfile('${escapeHtml(p.docId)}')" 
           onkeydown="handleAccountItemKeyDown(event, '${escapeHtml(p.docId)}')">
        <div class="account-item-avatar">${initial}</div>
        <div class="account-item-info">
          <div class="account-item-name">${escapeHtml(p.rawName)}</div>
          <div class="account-item-slug">@${escapeHtml(p.docId)}</div>
        </div>
        ${isActive ? '<i class="fa-solid fa-check account-item-check" aria-hidden="true"></i>' : ''}
      </div>
    `;
  }).join('');
};

window.toggleAccountMenu = function(e) {
  if (e) {
    e.stopPropagation();
  }
  const menu = document.getElementById('account-switcher-menu');
  if (!menu) return;
  const isHidden = menu.style.display === 'none' || !menu.classList.contains('is-open');
  if (isHidden) {
    openAccountMenu();
  } else {
    closeAccountMenu();
  }
};

window.openAccountMenu = function() {
  const menu = document.getElementById('account-switcher-menu');
  const chip = document.getElementById('btn-account-chip');
  if (!menu) return;

  renderAccountSwitcher();
  menu.style.display = 'block';
  requestAnimationFrame(() => {
    menu.classList.add('is-open');
  });
  if (chip) chip.setAttribute('aria-expanded', 'true');

  setTimeout(() => {
    const activeItem = menu.querySelector('.account-item.active') || menu.querySelector('.account-item');
    if (activeItem) activeItem.focus();
  }, 60);
};

window.closeAccountMenu = function() {
  const menu = document.getElementById('account-switcher-menu');
  const chip = document.getElementById('btn-account-chip');
  if (!menu) return;
  menu.classList.remove('is-open');
  setTimeout(() => {
    if (!menu.classList.contains('is-open')) {
      menu.style.display = 'none';
    }
  }, 180);
  if (chip) chip.setAttribute('aria-expanded', 'false');
};

window.performSwitchUserProfile = function(docId) {
  const profiles = UserSession.getProfilesList();
  const target = profiles.find(p => p.docId === docId);
  if (!target) return;

  UserSession.currentUser = target;
  try {
    localStorage.setItem(UserSession.STORAGE_KEY, JSON.stringify(target));
  } catch (e) {}
  UserSession.addProfile(target);
  UserSession.updateUI();
  closeAccountMenu();

  window.resetAppStateToEmpty();
  showToast(`Đã chuyển sang hồ sơ [${target.rawName}]! Nhấn "Nhập dữ liệu" nếu muốn nạp bản lưu trước đó.`, "success");
};

window.switchUserProfile = function(docId) {
  if (UserSession.currentUser && UserSession.currentUser.docId === docId) {
    closeAccountMenu();
    return;
  }
  if (window.hasUnsavedChanges) {
    closeAccountMenu();
    window.openExitSaveModal(() => {
      window.performSwitchUserProfile(docId);
    });
    return;
  }
  window.performSwitchUserProfile(docId);
};

window.performLogoutUserProfile = function() {
  UserSession.clear();
  closeAccountMenu();
  window.resetAppStateToEmpty();
  showToast("Đã đăng xuất hồ sơ", "info");
  openUserModal(true);
};

window.logoutUserProfile = function() {
  if (window.hasUnsavedChanges) {
    closeAccountMenu();
    window.openExitSaveModal(() => {
      window.performLogoutUserProfile();
    });
    return;
  }
  window.performLogoutUserProfile();
};

window.handleAccountItemKeyDown = function(e, docId) {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    switchUserProfile(docId);
  }
};

function createEmptyAppState() {
  const emptyMonthly = {};
  for (let m = 1; m <= 12; m++) {
    emptyMonthly[m] = {
      incomes: [],
      expenses: [],
      reconIncomeNotes: {},
      reconExpenseNotes: {},
      learningDetails: []
    };
  }
  return {
    currentYear: 2026,
    currentAge: 21,
    birthYear: 2005,
    currentMonth: 1,
    targetSavingsRate: 40,
    visionAge: "",
    visionDesc: "",
    expenses: [],
    incomeList: [],
    planList: [],
    investProducts: [],
    tcGoals: [],
    skillsList: [],
    familyList: [],
    jobList: [],
    planIncome: [],
    planExpense: [],
    skillsStore: {},
    careerDetailList: [],
    matrixOverrides: {},
    monthlyDetails: emptyMonthly,
    surveyP1Choices: {},
    surveyP2Choices: {}
  };
}

const AppState = createEmptyAppState();
window.AppState = AppState;

window.resetAppStateToEmpty = function() {
  const fresh = createEmptyAppState();
  Object.keys(fresh).forEach(k => {
    AppState[k] = fresh[k];
  });
  window.hasUnsavedChanges = false;
  window.hasSavedInSession = false;

  const yEl = document.getElementById('input-year');
  const aEl = document.getElementById('input-age');
  if (yEl) yEl.innerText = AppState.currentYear;
  if (aEl) aEl.innerText = AppState.currentAge;
  document.querySelectorAll('.dynamic-year').forEach(el => el.textContent = AppState.currentYear);

  const vAge = document.getElementById('vision-age-cell');
  const vDesc = document.getElementById('vision-desc-cell');
  const tSav = document.getElementById('target-savings-rate-val');
  if (vAge) vAge.innerText = AppState.visionAge || '';
  if (vDesc) vDesc.innerText = AppState.visionDesc || '';
  if (tSav) tSav.innerText = `${AppState.targetSavingsRate || 40}%`;

  renderSetupTables();
  renderPlanTables();
  renderTcGoalsFormTable();
  renderSkillsFamilyJob();
  renderGoogleFormSurvey();
  evaluateSurveys();
  if (window.updateSurveyProgress) {
    window.updateSurveyProgress();
  }
  renderCareerTables();
  renderMonthView(AppState.currentMonth);
  syncGoalsToCards();
  renderTcMatrixTable();
  recalculateAll();
};

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

// ==================== CÔNG THỨC TÀI CHÍNH SPREADSHEET CHUẨN ====================
function calculateMonthlyNeed(goal) {
  const nYears = Math.max(1, (Number(goal.end) || AppState.currentYear) - (Number(goal.start) || AppState.currentYear) + 1);
  const nMonths = nYears * 12;
  const rAnnual = (Number(goal.rate) || 8.0) / 100;
  const rMonthly = rAnnual / 12;

  if (goal.type === 'debt') {
    const loanBalance = Math.max(0, (Number(goal.val) || 0) - (Number(goal.paid) || 0));
    if (loanBalance <= 0) return 0;
    if (rMonthly === 0) return loanBalance / nMonths;
    const pmt = (loanBalance * rMonthly * Math.pow(1 + rMonthly, nMonths)) / (Math.pow(1 + rMonthly, nMonths) - 1);
    return isNaN(pmt) || !isFinite(pmt) ? (loanBalance / nMonths) : pmt;
  }

  // Đầu tư & hưu trí
  const infRate = (Number(goal.inflation) || 0) / 100;
  let targetFV = 0;

  if (goal.yearsRetire && goal.yearsRetire > 0) {
    const mRetire = Number(goal.monthlyRetire) || 15.0;
    const deathFund = Number(goal.deathFund) || 0;
    const nRetireMonths = goal.yearsRetire * 12;

    let pvRetire = 0;
    if (rMonthly > 0) {
      pvRetire = mRetire * (1 - Math.pow(1 + rMonthly, -nRetireMonths)) / rMonthly;
      pvRetire += deathFund / Math.pow(1 + rMonthly, nRetireMonths);
    } else {
      pvRetire = (mRetire * nRetireMonths) + deathFund;
    }
    targetFV = pvRetire;
  } else {
    // Điều chỉnh lạm phát trượt giá: FV = Giá trị hiện tại * (1 + lạm phát)^n
    targetFV = (Number(goal.val) || 0) * Math.pow(1 + infRate, nYears);
  }

  const currentPaidFV = (Number(goal.paid) || 0) * Math.pow(1 + rMonthly, nMonths);
  const deficitFV = Math.max(0, targetFV - currentPaidFV);

  if (deficitFV <= 0) return 0;
  if (rMonthly === 0) return deficitFV / nMonths;

  // Công thức PMT tích lũy tương lai
  const pmtInvest = (deficitFV * rMonthly) / (Math.pow(1 + rMonthly, nMonths) - 1);
  return isNaN(pmtInvest) || !isFinite(pmtInvest) ? (deficitFV / nMonths) : pmtInvest;
}

function getEffectiveSavingsRateRatio() {
  const pct = parseFloat(AppState.targetSavingsRate);
  if (!isNaN(pct) && pct > 0 && pct <= 100) {
    return pct / 100;
  }
  return 0.40;
}

function getMatrixIncomeNeed(yearOffset) {
  let sSum = 0;
  const yr = AppState.currentYear + yearOffset;
  if (AppState.matrixOverrides && AppState.matrixOverrides[yearOffset] !== undefined) {
    sSum = Number(AppState.matrixOverrides[yearOffset]) || 0;
  } else {
    AppState.tcGoals.forEach(g => {
      if (yr >= g.start && yr <= g.end) {
        const mNeed = calculateMonthlyNeed(g);
        g.monthly = mNeed;
        sSum += mNeed;
      }
    });
  }
  const rate = getEffectiveSavingsRateRatio();
  return sSum > 0 ? (sSum / rate) : 0;
}

function calculateAgeMilestones() {
  const baseAge = AppState.currentAge;
  const offsets = [0, 5, 10, 15, 20, 30];

  // Tính điểm khẩu vị rủi ro từ khảo sát Phần 1 (nếu người dùng đã chọn)
  let s1 = 0, count1 = 0;
  surveyQuestionsPart1.forEach((q, idx) => {
    const c = AppState.surveyP1Choices?.[idx + 1];
    if (c !== undefined && q.weights[c] !== undefined) {
      s1 += q.weights[c];
      count1++;
    }
  });
  let riskStockShift = 0;
  if (count1 > 0) {
    if (s1 <= 20) riskStockShift = -10;
    else if (s1 >= 30) riskStockShift = 10;
  }

  // Lấy lãi suất kỳ vọng từ Danh mục sản phẩm đầu tư nếu có
  const prodRates = (AppState.investProducts || []).map(p => Number(p.returnRate) || 0).filter(r => r > 0);
  const stockRate = prodRates.length > 0 ? Math.max(...prodRates, 13.5) : 13.5;
  const bondRate = prodRates.length > 1 ? prodRates[1] : 9.5;
  const insRate = 4.5;
  const cashRate = prodRates.length > 2 ? Math.min(...prodRates, 6.0) : 5.0;

  return offsets.map((off, idx) => {
    const age = baseAge + off;
    const year = AppState.currentYear + off;
    const yrIndex = Math.min(32, off);
    const incNeedFromMatrix = getMatrixIncomeNeed(yrIndex);

    // Công thức phân bổ tài sản chuẩn tài chính cá nhân (Tổng tỷ trọng luôn bằng đúng 100.0%)
    const stocks = Math.max(15, Math.min(75, 100 - age + riskStockShift));
    const ins = age >= 35 ? 10.0 : 7.0;
    const cash = 5.0;
    const bonds = Math.max(10, 100.0 - (stocks + ins + cash));
    const returnNeed = ((stocks * stockRate + bonds * bondRate + ins * insRate + cash * cashRate) / 100);

    return {
      age,
      year,
      incomeNeed: incNeedFromMatrix > 0 ? incNeedFromMatrix : 0,
      stocks,
      bonds,
      ins,
      cash,
      returnNeed,
      skills: AppState.skillsStore[idx] || ""
    };
  });
}

function calculateCareerDetails() {
  const baseAge = AppState.currentAge;
  const ages = [
    baseAge,
    baseAge + 1, baseAge + 2, baseAge + 3, baseAge + 4,
    baseAge + 5, baseAge + 6, baseAge + 7, baseAge + 8, baseAge + 9,
    baseAge + 10,
    baseAge + 15, baseAge + 20, baseAge + 25, baseAge + 30
  ];

  const existingMap = {};
  if (Array.isArray(AppState.careerDetailList)) {
    AppState.careerDetailList.forEach(item => {
      existingMap[item.age] = item;
    });
  }

  let actualCurrentYear = 0;
  let activeIncomeMonths = 0;
  for (let m = 1; m <= 12; m++) {
    const mInc = (AppState.monthlyDetails[m]?.incomes || []).reduce((s, x) => s + (Number(x.val) || 0), 0);
    if (mInc > 0) {
      actualCurrentYear += mInc;
      activeIncomeMonths++;
    }
  }
  const planMonthlyInc = (AppState.planIncome || []).reduce((s, p) => s + (Number(p.plan) || 0), 0);
  const autoCurrentIncome = activeIncomeMonths > 0
    ? (actualCurrentYear / activeIncomeMonths)
    : planMonthlyInc;

  return ages.map((age) => {
    const yearOffset = age - baseAge;
    const targetVal = getMatrixIncomeNeed(Math.min(32, yearOffset)) || 0;

    const exist = existingMap[age];
    const hasManualActual = exist && exist.manualActual === true && exist.actual !== undefined && exist.actual !== null;
    const actualVal = (yearOffset === 0)
      ? (hasManualActual ? exist.actual : autoCurrentIncome)
      : null;

    const hasManualRoute = exist && exist.manualRoute === true && exist.route !== undefined;
    const defaultRoute = (yearOffset === 0 && !hasManualRoute) ? autoCurrentIncome : 0;

    return {
      age,
      year: AppState.currentYear + yearOffset,
      actual: actualVal,
      manualActual: hasManualActual,
      target: targetVal,
      route: hasManualRoute ? exist.route : (exist && exist.route ? exist.route : defaultRoute),
      manualRoute: hasManualRoute || Boolean(exist && exist.route)
    };
  });
}

// ==================== ĐIỀU HƯỚNG TABS & EXPANDING SIDE RAIL (MẪU LUCIAN #040) ====================
window.switchTab = function(tabId) {
  document.body.classList.remove('nav-open');
  if (window.FinDatePicker && FinDatePicker.isOpen && FinDatePicker.isOpen()) {
    FinDatePicker.close();
  }
  document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
  document.getElementById('btn-month-collapsed')?.classList.remove('active');
  document.getElementById(`btn-${tabId}`)?.classList.add('active');

  const titlesMap = {
    'tab-tukhoa': 'TỪ KHÓA THIẾT LẬP',
    'tab-dashboard': 'DASHBOARD THEO DÕI TÀI CHÍNH',
    'tab-muctieu-bt': 'XÁC ĐỊNH MỤC TIÊU BẢN THÂN',
    'tab-muctieu-tc': 'XÁC ĐỊNH MỤC TIÊU TÀI CHÍNH',
    'tab-candoi': 'CÂN ĐỐI LỘ TRÌNH NGHỀ NGHIỆP',
    'tab-kehoach': 'KẾ HOẠCH THU NHẬP VÀ CHI TIÊU',
    'tab-khaosat': 'BẢNG KHẢO SÁT ĐÁNH GIÁ BẢN THÂN'
  };

  const currentTitleEl = document.getElementById('current-title');
  if (currentTitleEl) {
    currentTitleEl.textContent = titlesMap[tabId] || 'TÀI CHÍNH CÁ NHÂN';
  }
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
      syncGoalsToCards();
      renderTcMatrixTable();
    }
    if (tabId === 'tab-muctieu-bt') {
      renderTcGoalsFormTable();
      renderSkillsFamilyJob();
    }
    if (tabId === 'tab-khaosat') {
      renderGoogleFormSurvey();
      evaluateSurveys();
      if (typeof goToSurveyStep === 'function') {
        goToSurveyStep(window.currentSurveyStep || 1);
      }
      setTimeout(renderSurveyQuestionCharts, 80);
    }
  }

  setTimeout(updateSlidingHighlight, 40);
};

window.switchMonthTab = function(m) {
  document.body.classList.remove('nav-open');
  if (window.FinDatePicker && FinDatePicker.isOpen && FinDatePicker.isOpen()) {
    FinDatePicker.close();
  }
  AppState.currentMonth = m;
  document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
  document.getElementById(`btn-month-${m}`)?.classList.add('active');
  document.getElementById('btn-month-collapsed')?.classList.add('active');
  document.getElementById('current-title').textContent = `THEO DÕI THU - CHI THÁNG ${m}`;

  document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
  document.getElementById('tab-month')?.classList.add('active');

  renderMonthView(m);
  setTimeout(updateSlidingHighlight, 40);
};

let railCollapseTimer = null;

window.toggleSideRailPin = function() {
  const isCurrentlyPinned = document.body.classList.contains('rail-pinned');
  const nextPinned = !isCurrentlyPinned;
  window.setSideRailPinState(nextPinned);
};

window.setSideRailPinState = function(isPinned) {
  const body = document.body;
  const pinBtn = document.getElementById('btn-rail-toggle');

  if (isPinned) {
    body.classList.remove('rail-auto', 'rail-collapsed', 'rail-hover-expanded');
    body.classList.add('rail-pinned', 'rail-expanded');
    if (pinBtn) {
      pinBtn.setAttribute('aria-pressed', 'true');
      pinBtn.setAttribute('title', 'Bỏ ghim thanh bên (chuyển sang tự động thu gọn)');
      pinBtn.setAttribute('aria-label', 'Bỏ ghim thanh bên');
    }
    try { localStorage.setItem('FIN_APP_RAIL_PINNED', 'true'); } catch (e) {}
  } else {
    body.classList.remove('rail-pinned', 'rail-expanded', 'rail-hover-expanded');
    body.classList.add('rail-auto', 'rail-collapsed');
    if (pinBtn) {
      pinBtn.setAttribute('aria-pressed', 'false');
      pinBtn.setAttribute('title', 'Ghim thanh bên (cố định mở rộng)');
      pinBtn.setAttribute('aria-label', 'Ghim thanh bên');
    }
    try { localStorage.setItem('FIN_APP_RAIL_PINNED', 'false'); } catch (e) {}
  }

  updateSlidingHighlight();
  setTimeout(updateSlidingHighlight, 260);
};

window.initSideRailHover = function() {
  const sidebar = document.getElementById('app-sidebar');
  if (!sidebar || sidebar.dataset.hoverBound === 'true') return;
  sidebar.dataset.hoverBound = 'true';

  sidebar.addEventListener('mouseenter', () => {
    if (!document.body.classList.contains('rail-auto')) return;
    if (window.innerWidth <= 768) return;

    if (railCollapseTimer) {
      clearTimeout(railCollapseTimer);
      railCollapseTimer = null;
    }
    document.body.classList.add('rail-hover-expanded');
    updateSlidingHighlight();
  });

  sidebar.addEventListener('mouseleave', () => {
    if (!document.body.classList.contains('rail-auto')) return;
    if (window.innerWidth <= 768) return;

    // Không thu gọn nếu menu account switcher hoặc popover đang mở bên trong rail
    const accountMenu = document.getElementById('account-switcher-menu');
    if (accountMenu && !accountMenu.hidden && accountMenu.style.display !== 'none') {
      return;
    }

    if (railCollapseTimer) clearTimeout(railCollapseTimer);
    railCollapseTimer = setTimeout(() => {
      const currentMenu = document.getElementById('account-switcher-menu');
      if (currentMenu && !currentMenu.hidden && currentMenu.style.display !== 'none') {
        return;
      }
      document.body.classList.remove('rail-hover-expanded');
      updateSlidingHighlight();
    }, 180);
  });
};

window.toggleSideRail = function(forceState) {
  const isMobile = window.innerWidth <= 768;
  const body = document.body;

  if (isMobile && typeof forceState !== 'boolean') {
    body.classList.toggle('nav-open');
    return;
  }

  if (typeof forceState === 'boolean') {
    window.setSideRailPinState(forceState);
  } else {
    window.toggleSideRailPin();
  }
};

window.updateSlidingHighlight = function() {
  const wrapper = document.getElementById('rail-nav-wrapper');
  const pill = document.getElementById('rail-active-pill');
  if (!wrapper || !pill) return;

  const isCollapsed = document.body.classList.contains('rail-collapsed') && !document.body.classList.contains('rail-hover-expanded');
  let activeItem = null;

  const isMonthTabActive = document.getElementById('tab-month')?.classList.contains('active');

  if (isMonthTabActive) {
    if (isCollapsed) {
      activeItem = document.getElementById('btn-month-collapsed');
    } else {
      activeItem = wrapper.querySelector('.nav-month.active') || wrapper.querySelector(`#btn-month-${AppState.currentMonth}`) || document.getElementById('btn-month-collapsed');
    }
  } else {
    activeItem = wrapper.querySelector('.nav-item.active:not(.nav-month)');
  }

  if (!activeItem) {
    pill.classList.remove('is-active');
    return;
  }

  const wrapperRect = wrapper.getBoundingClientRect();
  const itemRect = activeItem.getBoundingClientRect();
  const top = (itemRect.top - wrapperRect.top) + wrapper.scrollTop;
  const height = itemRect.height;

  pill.style.transform = `translateY(${Math.round(top)}px)`;
  pill.style.height = `${Math.round(height)}px`;
  pill.classList.add('is-active');
};

function initSideRail() {
  const width = window.innerWidth;
  const isTablet = width > 768 && width <= 1024;
  const isMobile = width <= 768;

  let savedPinned = null;
  try {
    savedPinned = localStorage.getItem('FIN_APP_RAIL_PINNED');
    if (savedPinned === null) {
      // Tương thích với khoá cũ FIN_APP_RAIL_COLLAPSED nếu có
      const legacyCollapsed = localStorage.getItem('FIN_APP_RAIL_COLLAPSED');
      if (legacyCollapsed !== null) {
        savedPinned = (legacyCollapsed === 'true') ? 'false' : 'true';
      }
    }
  } catch (e) {}

  let isPinned = true;
  if (savedPinned !== null) {
    isPinned = (savedPinned === 'true');
  } else if (isTablet || isMobile) {
    isPinned = false;
  } else {
    isPinned = true;
  }

  window.setSideRailPinState(isPinned);
  window.initSideRailHover();

  window.addEventListener('resize', () => {
    updateSlidingHighlight();
  });

  const navWrapper = document.getElementById('rail-nav-wrapper');
  if (navWrapper) {
    navWrapper.addEventListener('scroll', () => {
      updateSlidingHighlight();
    }, { passive: true });
  }

  updateSlidingHighlight();
}

window.switchMonthSection = function(secNum) {
  document.getElementById('btn-month-sec1')?.classList.toggle('active', secNum === 1);
  document.getElementById('btn-month-sec2')?.classList.toggle('active', secNum === 2);
  document.getElementById('month-sec-1')?.classList.toggle('active', secNum === 1);
  document.getElementById('month-sec-2')?.classList.toggle('active', secNum === 2);
  if (secNum === 1) renderMonthHorizontalBarChart();
};

window.switchTcSection = function(secNum) {
  if (secNum === 3) {
    window.switchTab('tab-muctieu-bt');
    return;
  }
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
function drawSparkline(canvasId, values, color = '#159F87') {
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
function getUniqueNonEmptyList(arrays) {
  const seen = new Set();
  const result = [];
  arrays.forEach(arr => {
    if (!Array.isArray(arr)) return;
    arr.forEach(item => {
      const s = typeof item === 'string' ? item.trim() : '';
      if (s && !seen.has(s)) {
        seen.add(s);
        result.push(s);
      }
    });
  });
  return result;
}

function getAllMonthlyCats(typeField) {
  const cats = [];
  for (let m = 1; m <= 12; m++) {
    const list = AppState.monthlyDetails?.[m]?.[typeField] || [];
    list.forEach(x => {
      if (x && x.cat) cats.push(x.cat);
    });
  }
  return cats;
}

function renderDashboardMatrices() {
  const incCats = getUniqueNonEmptyList([
    AppState.incomeList,
    (AppState.planIncome || []).map(p => p.name),
    getAllMonthlyCats('incomes')
  ]);
  const incMonthlySums = Array(13).fill(0);
  const sparkIncData = {};

  for (let m = 1; m <= 12; m++) {
    const mTotal = (AppState.monthlyDetails[m]?.incomes || []).reduce((s, x) => s + (Number(x.val) || 0), 0);
    incMonthlySums[m] = mTotal;
    incMonthlySums[0] += mTotal;
  }

  const incRows = incCats.map((cat, idx) => {
    let rowSum = 0;
    const tds = [];
    const rowVals = [];
    for (let m = 1; m <= 12; m++) {
      const val = (AppState.monthlyDetails[m]?.incomes || [])
        .filter(x => x.cat === cat)
        .reduce((s, x) => s + (Number(x.val) || 0), 0);
      rowSum += val;
      rowVals.push(val);
      tds.push(`<td class="text-right font-mono">${val > 0 ? val.toFixed(1) : '-'}</td>`);
    }
    sparkIncData[`spark-inc-${idx}`] = rowVals;

    return `
      <tr>
        <td class="font-semibold">${escapeHtml(cat)}</td>
        ${tds.join('')}
        <td class="text-right font-bold text-success font-mono">${rowSum.toFixed(1)}</td>
        <td class="text-center"><canvas id="spark-inc-${idx}" class="sparkline-canvas" width="90" height="22"></canvas></td>
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
      tfHtml += `<td class="text-right font-bold text-success font-mono">${incMonthlySums[m].toFixed(1)}</td>`;
      totVals.push(incMonthlySums[m]);
    }
    tfHtml += `<td class="text-right font-bold text-success font-mono">${incMonthlySums[0].toFixed(1)}</td><td class="text-center"><canvas id="spark-inc-total" class="sparkline-canvas" width="90" height="22"></canvas></td>`;
    tfInc.innerHTML = tfHtml;
    sparkIncData['spark-inc-total'] = totVals;
  }

  const expCats = getUniqueNonEmptyList([
    AppState.expenses,
    (AppState.planExpense || []).map(p => p.name),
    getAllMonthlyCats('expenses')
  ]);
  const expMonthlySums = Array(13).fill(0);
  const sparkExpData = {};

  for (let m = 1; m <= 12; m++) {
    const mTotal = (AppState.monthlyDetails[m]?.expenses || []).reduce((s, x) => s + (Number(x.val) || 0), 0);
    expMonthlySums[m] = mTotal;
    expMonthlySums[0] += mTotal;
  }

  const expRows = expCats.map((cat, idx) => {
    let rowSum = 0;
    const tds = [];
    const rowVals = [];
    for (let m = 1; m <= 12; m++) {
      const val = (AppState.monthlyDetails[m]?.expenses || [])
        .filter(x => x.cat === cat)
        .reduce((s, x) => s + (Number(x.val) || 0), 0);
      rowSum += val;
      rowVals.push(val);
      tds.push(`<td class="text-right font-mono">${val > 0 ? val.toFixed(1) : '-'}</td>`);
    }
    sparkExpData[`spark-exp-${idx}`] = rowVals;

    return `
      <tr>
        <td class="font-semibold">${escapeHtml(cat)}</td>
        ${tds.join('')}
        <td class="text-right font-bold text-danger font-mono">${rowSum.toFixed(1)}</td>
        <td class="text-center"><canvas id="spark-exp-${idx}" class="sparkline-canvas" width="90" height="22"></canvas></td>
      </tr>
    `;
  }).join('');

  const tbExp = document.getElementById('tbody-db-expense');
  if (tbExp) tbExp.innerHTML = expRows;

  const tfExpTot = document.getElementById('tfoot-db-expense-total');
  const planExpSum = (AppState.planExpense || []).reduce((s, x) => s + (Number(x.plan) || 0), 0);
  if (tfExpTot) {
    let tfHtml = `<td class="font-bold">Tổng chi thực tế</td>`;
    const totExpVals = [];
    for (let m = 1; m <= 12; m++) {
      tfHtml += `<td class="text-right font-bold text-danger font-mono">${expMonthlySums[m].toFixed(1)}</td>`;
      totExpVals.push(expMonthlySums[m]);
    }
    tfHtml += `<td class="text-right font-bold text-danger font-mono">${expMonthlySums[0].toFixed(1)}</td><td class="text-center"><canvas id="spark-exp-total" class="sparkline-canvas" width="90" height="22"></canvas></td>`;
    tfExpTot.innerHTML = tfHtml;
    sparkExpData['spark-exp-total'] = totExpVals;
  }

  const tfExpPlan = document.getElementById('tfoot-db-expense-plan');
  if (tfExpPlan) {
    let tfPlanHtml = `<td class="font-semibold text-muted">Kế hoạch chi</td>`;
    for (let m = 1; m <= 12; m++) tfPlanHtml += `<td class="text-right text-muted font-mono">${planExpSum.toFixed(1)}</td>`;
    tfPlanHtml += `<td class="text-right font-bold text-muted font-mono">${(planExpSum * 12).toFixed(1)}</td><td></td>`;
    tfExpPlan.innerHTML = tfPlanHtml;
  }

  const tfExpCumDiff = document.getElementById('tfoot-db-expense-cumdiff');
  if (tfExpCumDiff) {
    let tfCumHtml = `<td class="font-semibold text-muted">Chênh lệch lũy kế</td>`;
    let runningDiff = 0;
    for (let m = 1; m <= 12; m++) {
      runningDiff += (planExpSum - expMonthlySums[m]);
      const cls = runningDiff >= 0 ? 'text-success' : 'text-danger';
      tfCumHtml += `<td class="text-right font-mono ${cls}">${runningDiff.toFixed(1)}</td>`;
    }
    const finalCls = runningDiff >= 0 ? 'text-success' : 'text-danger';
    tfCumHtml += `<td class="text-right font-bold font-mono ${finalCls}">${runningDiff.toFixed(1)}</td><td></td>`;
    tfExpCumDiff.innerHTML = tfCumHtml;
  }

  const trSav = document.getElementById('trow-db-savings');
  const sparkSavData = [];
  if (trSav) {
    let sHtml = `<td class="font-bold text-success">Tiết kiệm ròng</td>`;
    let yearSav = 0;
    for (let m = 1; m <= 12; m++) {
      const sav = incMonthlySums[m] - expMonthlySums[m];
      yearSav += sav;
      sparkSavData.push(sav);
      sHtml += `<td class="text-right font-bold font-mono ${sav >= 0 ? 'text-success' : 'text-danger'}">${sav.toFixed(1)}</td>`;
    }
    sHtml += `<td class="text-right font-bold ${yearSav >= 0 ? 'text-success' : 'text-danger'} font-mono">${yearSav.toFixed(1)}</td><td class="text-center"><canvas id="spark-sav-total" class="sparkline-canvas" width="90" height="22"></canvas></td>`;
    trSav.innerHTML = sHtml;
  }

  const lrnCats = getUniqueNonEmptyList([
    AppState.planList,
    getAllMonthlyCats('learningDetails')
  ]);
  const lrnMonthlySums = Array(13).fill(0);
  const sparkLrnData = {};

  for (let m = 1; m <= 12; m++) {
    const mTotal = (AppState.monthlyDetails[m]?.learningDetails || []).reduce((s, x) => s + (Number(x.val) || 0), 0);
    lrnMonthlySums[m] = mTotal;
    lrnMonthlySums[0] += mTotal;
  }

  const lrnRows = lrnCats.map((cat, idx) => {
    let rowSum = 0;
    const tds = [];
    const rowVals = [];
    for (let m = 1; m <= 12; m++) {
      const val = (AppState.monthlyDetails[m]?.learningDetails || [])
        .filter(x => x.cat === cat)
        .reduce((s, x) => s + (Number(x.val) || 0), 0);
      rowSum += val;
      rowVals.push(val);
      tds.push(`<td class="text-right font-mono">${val > 0 ? val.toFixed(2) : '-'}</td>`);
    }
    sparkLrnData[`spark-lrn-${idx}`] = rowVals;

    return `
      <tr>
        <td class="font-semibold">${escapeHtml(cat)}</td>
        ${tds.join('')}
        <td class="text-right font-bold text-warning font-mono">${rowSum.toFixed(2)}</td>
        <td class="text-center"><canvas id="spark-lrn-${idx}" class="sparkline-canvas" width="90" height="22"></canvas></td>
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
      tfLHtml += `<td class="text-right font-bold text-warning font-mono">${lrnMonthlySums[m].toFixed(2)}</td>`;
      totLrnVals.push(lrnMonthlySums[m]);
    }
    tfLHtml += `<td class="text-right font-bold text-warning font-mono">${lrnMonthlySums[0].toFixed(2)}</td><td class="text-center"><canvas id="spark-lrn-total" class="sparkline-canvas" width="90" height="22"></canvas></td>`;
    tfLrnTot.innerHTML = tfLHtml;
    sparkLrnData['spark-lrn-total'] = totLrnVals;
  }

  setTimeout(() => {
    Object.keys(sparkIncData).forEach(id => drawSparkline(id, sparkIncData[id], '#159F87'));
    Object.keys(sparkExpData).forEach(id => drawSparkline(id, sparkExpData[id], '#F06E78'));
    if (sparkSavData.length > 0) drawSparkline('spark-sav-total', sparkSavData, '#159F87');
    Object.keys(sparkLrnData).forEach(id => drawSparkline(id, sparkLrnData[id], '#BD7B23'));
  }, 40);
}

window.dashChartInstances = window.dashChartInstances || {};
const dashChartInstances = window.dashChartInstances;

function renderDashboardAllCharts() {
  if (typeof Chart === 'undefined') return;

  const themeTokens = typeof window.getChartThemeTokens === 'function' ? window.getChartThemeTokens() : {
    text: '#292747', textMuted: '#8582A3', grid: '#E8E5F7', border: '#ffffff', planBar: '#E8E5F7'
  };

  const cv1 = document.getElementById('chartDashGoalsPie');
  if (cv1) {
    if (dashChartInstances.goalsPie) dashChartInstances.goalsPie.destroy();
    const debtsVal = AppState.tcGoals.filter(g => g.type === 'debt').reduce((s, g) => s + (Number(g.val) || 0), 0);
    const investsVal = AppState.tcGoals.filter(g => g.type === 'invest').reduce((s, g) => s + (Number(g.val) || 0), 0);
    dashChartInstances.goalsPie = new Chart(cv1.getContext('2d'), {
      type: 'doughnut',
      data: {
        labels: ['Mục tiêu trả nợ', 'Mục tiêu tích lũy & đầu tư'],
        datasets: [{ data: [debtsVal, investsVal], backgroundColor: ['#F06E78', '#159F87'], borderWidth: 2, borderColor: themeTokens.border }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: { font: { family: 'Inter', size: 11, weight: '600' }, color: themeTokens.text } } },
        cutout: '68%'
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
      const yrVal = AppState.tcGoals.filter(g => Number(g.end) === yr).reduce((s, g) => s + (Number(g.val) || 0), 0);
      cum += yrVal;
      cumData.push(cum);
    }
    dashChartInstances.goalsLine = new Chart(cv2.getContext('2d'), {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Giá trị tích lũy (tr)',
          data: cumData,
          borderColor: '#6258F5',
          backgroundColor: 'rgba(98, 88, 245, 0.12)',
          fill: true,
          tension: 0.35,
          borderWidth: 2.5,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: '#6258F5'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, grid: { color: themeTokens.grid }, ticks: { font: { family: 'Inter', size: 10 }, color: themeTokens.textMuted } },
          x: { grid: { display: false }, ticks: { font: { family: 'Inter', size: 10 }, color: themeTokens.textMuted } }
        }
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
          data: AppState.investProducts.slice(0, 5).map(x => Number(x.returnRate) || 0),
          backgroundColor: ['#6258F5', '#31C8DB', '#31CDB1', '#D8F36E', '#BD7B23'],
          borderWidth: 2,
          borderColor: themeTokens.border
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: { font: { family: 'Inter', size: 10, weight: '500' }, color: themeTokens.text } } }
      }
    });
  }

  const cv4 = document.getElementById('chartDashCombo12');
  if (cv4) {
    if (dashChartInstances.combo12) dashChartInstances.combo12.destroy();
    const months = Array.from({ length: 12 }, (_, i) => `T${i + 1}`);
    const incs = [], exps = [], savs = [];
    for (let m = 1; m <= 12; m++) {
      const inc = (AppState.monthlyDetails[m]?.incomes || []).reduce((s, x) => s + (Number(x.val) || 0), 0);
      const exp = (AppState.monthlyDetails[m]?.expenses || []).reduce((s, x) => s + (Number(x.val) || 0), 0);
      incs.push(inc);
      exps.push(exp);
      savs.push(inc - exp);
    }
    dashChartInstances.combo12 = new Chart(cv4.getContext('2d'), {
      type: 'bar',
      data: {
        labels: months,
        datasets: [
          { type: 'line', label: 'Tiết kiệm', data: savs, borderColor: '#159F87', borderWidth: 2.5, fill: false, tension: 0.25, pointRadius: 4, pointBackgroundColor: '#159F87' },
          { label: 'Thu nhập', data: incs, backgroundColor: '#6258F5', borderRadius: 4 },
          { label: 'Chi phí', data: exps, backgroundColor: '#F06E78', borderRadius: 4 }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'top', labels: { font: { family: 'Inter', size: 11, weight: '600' }, color: themeTokens.text } } },
        scales: {
          y: { beginAtZero: true, grid: { color: themeTokens.grid }, ticks: { font: { family: 'Inter', size: 10 }, color: themeTokens.textMuted } },
          x: { grid: { display: false }, ticks: { font: { family: 'Inter', size: 10 }, color: themeTokens.textMuted } }
        }
      }
    });
  }

  const cv5 = document.getElementById('chartDashVariance');
  if (cv5) {
    if (dashChartInstances.variance) dashChartInstances.variance.destroy();
    const planExp = (AppState.planExpense || []).reduce((s, x) => s + (Number(x.plan) || 0), 0);
    const months = Array.from({ length: 12 }, (_, i) => `T${i + 1}`);
    const actuals = [], cumDiff = [];
    let runningDiff = 0;
    for (let m = 1; m <= 12; m++) {
      const act = (AppState.monthlyDetails[m]?.expenses || []).reduce((s, x) => s + (Number(x.val) || 0), 0);
      actuals.push(act);
      runningDiff += (act - planExp);
      cumDiff.push(runningDiff);
    }
    dashChartInstances.variance = new Chart(cv5.getContext('2d'), {
      type: 'bar',
      data: {
        labels: months,
        datasets: [
          { type: 'line', label: 'Lũy kế chênh lệch', data: cumDiff, borderColor: '#7960F8', borderWidth: 2.5, fill: false, tension: 0.2, pointRadius: 3, pointBackgroundColor: '#7960F8' },
          { label: 'Chi thực tế', data: actuals, backgroundColor: '#F06E78', borderRadius: 4 },
          { label: 'Kế hoạch', data: Array(12).fill(planExp), backgroundColor: themeTokens.planBar, borderRadius: 4 }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'top', labels: { font: { family: 'Inter', size: 10, weight: '600' }, color: themeTokens.text } } },
        scales: {
          y: { grid: { color: themeTokens.grid }, ticks: { font: { family: 'Inter', size: 10 }, color: themeTokens.textMuted } },
          x: { grid: { display: false }, ticks: { font: { family: 'Inter', size: 10 }, color: themeTokens.textMuted } }
        }
      }
    });
  }

  const cv6 = document.getElementById('chartDashLearningStack');
  if (cv6) {
    if (dashChartInstances.learningStack) dashChartInstances.learningStack.destroy();
    const months = Array.from({ length: 12 }, (_, i) => `T${i + 1}`);
    const colors = ['#6258F5', '#31C8DB', '#31CDB1', '#BD7B23', '#7960F8'];
    const lrnCats = getUniqueNonEmptyList([
      AppState.planList,
      getAllMonthlyCats('learningDetails')
    ]);
    const datasets = lrnCats.map((cat, idx) => {
      const data = [];
      for (let m = 1; m <= 12; m++) {
        const val = (AppState.monthlyDetails[m]?.learningDetails || [])
          .filter(x => x.cat === cat)
          .reduce((s, x) => s + (Number(x.val) || 0), 0);
        data.push(val);
      }
      return {
        label: cat,
        data: data,
        backgroundColor: colors[idx % colors.length],
        stack: 'learn',
        borderRadius: 3
      };
    });

    dashChartInstances.learningStack = new Chart(cv6.getContext('2d'), {
      type: 'bar',
      data: { labels: months, datasets: datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: { font: { family: 'Inter', size: 9, weight: '500' }, color: themeTokens.text } } },
        scales: {
          x: { stacked: true, grid: { display: false }, ticks: { font: { family: 'Inter', size: 9 }, color: themeTokens.textMuted } },
          y: { stacked: true, beginAtZero: true, grid: { color: themeTokens.grid }, ticks: { font: { family: 'Inter', size: 10 }, color: themeTokens.textMuted } }
        }
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
        <td class="text-center text-muted font-mono">${idx + 1}</td>
        <td class="cell-blue" contenteditable="true" spellcheck="false" onblur="updateExpenseItem(${idx}, this.innerText)">${escapeHtml(item)}</td>
        <td class="text-center"><button class="btn-table-del" onclick="deleteExpenseItem(${idx})"><i class="fa-solid fa-trash-can"></i></button></td>
      </tr>
    `).join('');
  }

  const tbInc = document.getElementById('tbody-income');
  if (tbInc) {
    tbInc.innerHTML = AppState.incomeList.map((item, idx) => `
      <tr>
        <td class="text-center text-muted font-mono">${idx + 1}</td>
        <td class="cell-blue" contenteditable="true" spellcheck="false" onblur="updateIncomeItem(${idx}, this.innerText)">${escapeHtml(item)}</td>
        <td class="text-center"><button class="btn-table-del" onclick="deleteIncomeItem(${idx})"><i class="fa-solid fa-trash-can"></i></button></td>
      </tr>
    `).join('');
  }

  const tbLrn = document.getElementById('tbody-learning');
  if (tbLrn) {
    tbLrn.innerHTML = AppState.planList.map((item, idx) => `
      <tr>
        <td class="text-center text-muted font-mono">${idx + 1}</td>
        <td class="cell-blue" contenteditable="true" spellcheck="false" onblur="updatePlanListItem(${idx}, this.innerText)">${escapeHtml(item)}</td>
        <td class="text-center"><button class="btn-table-del" onclick="deletePlanListItem(${idx})"><i class="fa-solid fa-trash-can"></i></button></td>
      </tr>
    `).join('');
  }

  const tbInv = document.getElementById('tbody-invest');
  if (tbInv) {
    tbInv.innerHTML = AppState.investProducts.map((p, idx) => `
      <tr>
        <td class="text-center text-muted font-mono">${idx + 1}</td>
        <td class="cell-blue" contenteditable="true" spellcheck="false" onblur="updateInvestField(${idx}, 'name', this.innerText)">${escapeHtml(p.name)}</td>
        <td class="text-right cell-blue font-mono" contenteditable="true" spellcheck="false" onblur="updateInvestField(${idx}, 'returnRate', parseFloat(this.innerText.replace(/[^0-9.-]/g, ''))||0)">${Number(p.returnRate || 0).toFixed(1)}%</td>
        <td class="text-right cell-blue font-mono" contenteditable="true" spellcheck="false" onblur="updateInvestField(${idx}, 'risk', parseFloat(this.innerText.replace(/[^0-9.-]/g, ''))||0)">${Number(p.risk || 0).toFixed(1)}%</td>
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
  const oldName = AppState.expenses[idx];
  const newName = (val || '').trim();
  if (!newName) {
    renderSetupTables();
    return;
  }
  AppState.expenses[idx] = newName;
  if (oldName && oldName !== newName) {
    (AppState.planExpense || []).forEach(p => {
      if (p.name === oldName) p.name = newName;
    });
    for (let m = 1; m <= 12; m++) {
      const md = AppState.monthlyDetails?.[m];
      if (!md) continue;
      (md.expenses || []).forEach(x => {
        if (x.cat === oldName) x.cat = newName;
      });
      if (md.reconExpenseNotes && md.reconExpenseNotes[oldName]) {
        md.reconExpenseNotes[newName] = md.reconExpenseNotes[oldName];
        delete md.reconExpenseNotes[oldName];
      }
    }
  }
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
  const oldName = AppState.incomeList[idx];
  const newName = (val || '').trim();
  if (!newName) {
    renderSetupTables();
    return;
  }
  AppState.incomeList[idx] = newName;
  if (oldName && oldName !== newName) {
    (AppState.planIncome || []).forEach(p => {
      if (p.name === oldName) p.name = newName;
    });
    for (let m = 1; m <= 12; m++) {
      const md = AppState.monthlyDetails?.[m];
      if (!md) continue;
      (md.incomes || []).forEach(x => {
        if (x.cat === oldName) x.cat = newName;
      });
      if (md.reconIncomeNotes && md.reconIncomeNotes[oldName]) {
        md.reconIncomeNotes[newName] = md.reconIncomeNotes[oldName];
        delete md.reconIncomeNotes[oldName];
      }
    }
  }
  syncKeywordChangesToDependentSheets();
};

window.addPlanRow = function() {
  AppState.planList.push(`Kế hoạch đào tạo ${AppState.planList.length + 1}`);
  renderSetupTables();
  syncKeywordChangesToDependentSheets();
};

window.deletePlanListItem = function(idx) {
  AppState.planList.splice(idx, 1);
  renderSetupTables();
  syncKeywordChangesToDependentSheets();
};

window.updatePlanListItem = function(idx, val) {
  const oldName = AppState.planList[idx];
  const newName = (val || '').trim();
  if (!newName) {
    renderSetupTables();
    return;
  }
  AppState.planList[idx] = newName;
  if (oldName && oldName !== newName) {
    for (let m = 1; m <= 12; m++) {
      const md = AppState.monthlyDetails?.[m];
      if (!md) continue;
      (md.learningDetails || []).forEach(x => {
        if (x.cat === oldName) x.cat = newName;
      });
    }
  }
  syncKeywordChangesToDependentSheets();
};

function syncInvestProductsToGoals(oldProdName = null, newProdName = null) {
  (AppState.tcGoals || []).forEach(g => {
    if (g.type !== 'invest') return;
    if (!Array.isArray(g.allocProducts) || g.allocProducts.length === 0) {
      g.allocProducts = AppState.investProducts.slice(0, 3).map((p, idx) => ({
        prodName: p.name,
        weight: idx === 0 ? 50.0 : (idx === 1 ? 50.0 : 0.0),
        returnRate: p.returnRate,
        risk: p.risk
      }));
    }
    let avgRate = 0;
    let totalWeight = 0;
    g.allocProducts.forEach(ap => {
      if (oldProdName && newProdName && ap.prodName === oldProdName) {
        ap.prodName = newProdName;
      }
      const matched = AppState.investProducts.find(ip => ip.name === ap.prodName);
      if (matched) {
        ap.returnRate = matched.returnRate;
        ap.risk = matched.risk;
      }
      const w = Number(ap.weight) || 0;
      totalWeight += w;
      avgRate += (w / 100) * (Number(ap.returnRate) || 0);
    });
    if (totalWeight > 0 && avgRate > 0) {
      g.rate = parseFloat(avgRate.toFixed(2));
    }
    g.monthly = calculateMonthlyNeed(g);
  });
}

window.addInvestRow = function() {
  AppState.investProducts.push({ name: `Sản phẩm mới ${AppState.investProducts.length + 1}`, returnRate: 10.0, risk: 8.0 });
  syncInvestProductsToGoals();
  renderSetupTables();
  renderTcGoalsFormTable();
  syncGoalsToCards();
  renderTcMatrixTable();
  recalculateAll();
};

window.deleteInvestItem = function(idx) {
  AppState.investProducts.splice(idx, 1);
  syncInvestProductsToGoals();
  renderSetupTables();
  renderTcGoalsFormTable();
  syncGoalsToCards();
  renderTcMatrixTable();
  recalculateAll();
};

window.updateInvestField = function(idx, field, val) {
  if (!AppState.investProducts[idx]) return;
  const oldName = field === 'name' ? AppState.investProducts[idx].name : null;
  const cleanVal = field === 'name' ? (val || '').trim() : val;
  if (field === 'name' && !cleanVal) {
    renderSetupTables();
    return;
  }
  AppState.investProducts[idx][field] = cleanVal;
  syncInvestProductsToGoals(oldName, field === 'name' ? cleanVal : null);
  renderSetupTables();
  renderTcGoalsFormTable();
  syncGoalsToCards();
  renderTcMatrixTable();
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
    const incOptions = getUniqueNonEmptyList([
      AppState.incomeList,
      (AppState.planIncome || []).map(p => p.name)
    ]);
    tbInc.innerHTML = AppState.planIncome.map((p, idx) => `
      <tr>
        <td class="text-center text-muted font-mono">${idx + 1}</td>
        <td>
          <select class="select-inline-cell" onchange="updatePlanIncCat(${idx}, this.value)">
            ${incOptions.map(opt => `<option value="${escapeHtml(opt)}" ${opt === p.name ? 'selected' : ''}>${escapeHtml(opt)}</option>`).join('')}
          </select>
        </td>
        <td class="text-right cell-blue font-bold font-mono" contenteditable="true" spellcheck="false" oninput="updatePlanIncValLive(${idx}, this.innerText)" onblur="updatePlanIncVal(${idx}, this.innerText)">${Number(p.plan || 0).toFixed(2)}</td>
        <td class="cell-blue" contenteditable="true" spellcheck="false" onblur="updatePlanIncField(${idx}, 'note', this.innerText)">${escapeHtml(p.note || '')}</td>
        <td class="cell-blue" contenteditable="true" spellcheck="false" onblur="updatePlanIncField(${idx}, 'analysis', this.innerText)">${escapeHtml(p.analysis || '')}</td>
        <td class="text-center"><button class="btn-table-del" onclick="deletePlanIncRow(${idx})"><i class="fa-solid fa-trash-can"></i></button></td>
      </tr>
    `).join('');
  }

  const tbExp = document.getElementById('tbody-plan-exp');
  if (tbExp) {
    const expOptions = getUniqueNonEmptyList([
      AppState.expenses,
      (AppState.planExpense || []).map(p => p.name)
    ]);
    tbExp.innerHTML = AppState.planExpense.map((p, idx) => `
      <tr>
        <td class="text-center text-muted font-mono">${idx + 1}</td>
        <td>
          <select class="select-inline-cell" onchange="updatePlanExpCat(${idx}, this.value)">
            ${expOptions.map(opt => `<option value="${escapeHtml(opt)}" ${opt === p.name ? 'selected' : ''}>${escapeHtml(opt)}</option>`).join('')}
          </select>
        </td>
        <td class="text-right cell-blue font-bold font-mono" contenteditable="true" spellcheck="false" oninput="updatePlanExpValLive(${idx}, this.innerText)" onblur="updatePlanExpVal(${idx}, this.innerText)">${Number(p.plan || 0).toFixed(2)}</td>
        <td class="cell-blue" contenteditable="true" spellcheck="false" onblur="updatePlanExpField(${idx}, 'note', this.innerText)">${escapeHtml(p.note || '')}</td>
        <td class="cell-blue" contenteditable="true" spellcheck="false" onblur="updatePlanExpField(${idx}, 'analysis', this.innerText)">${escapeHtml(p.analysis || '')}</td>
        <td class="text-center"><button class="btn-table-del" onclick="deletePlanExpRow(${idx})"><i class="fa-solid fa-trash-can"></i></button></td>
      </tr>
    `).join('');
  }

  updatePlanTotals();
}

window.addPlanIncomeDirect = function() {
  if (AppState.incomeList.length === 0) {
    AppState.incomeList.push("Nguồn thu mới 1");
    renderSetupTables();
  }
  const firstCat = AppState.incomeList[0];
  AppState.planIncome.push({ name: firstCat, plan: 0.0, note: "", analysis: "" });
  renderPlanTables();
  renderReconciliationTable(AppState.currentMonth);
  recalculateAll();
};

window.deletePlanIncRow = function(idx) {
  AppState.planIncome.splice(idx, 1);
  renderPlanTables();
  renderReconciliationTable(AppState.currentMonth);
  recalculateAll();
};

window.addPlanExpenseDirect = function() {
  if (AppState.expenses.length === 0) {
    AppState.expenses.push("Chi tiêu mới 1");
    renderSetupTables();
  }
  const firstCat = AppState.expenses[0];
  AppState.planExpense.push({ name: firstCat, plan: 0.0, note: "", analysis: "" });
  renderPlanTables();
  renderReconciliationTable(AppState.currentMonth);
  recalculateAll();
};

window.deletePlanExpRow = function(idx) {
  AppState.planExpense.splice(idx, 1);
  renderPlanTables();
  renderReconciliationTable(AppState.currentMonth);
  recalculateAll();
};

window.updatePlanIncCat = function(idx, val) {
  if (!AppState.planIncome[idx]) return;
  AppState.planIncome[idx].name = val;
  renderReconciliationTable(AppState.currentMonth);
  recalculateAll();
};
window.updatePlanExpCat = function(idx, val) {
  if (!AppState.planExpense[idx]) return;
  AppState.planExpense[idx].name = val;
  renderReconciliationTable(AppState.currentMonth);
  recalculateAll();
};
window.updatePlanIncValLive = function(idx, txt) {
  if (!AppState.planIncome[idx]) return;
  AppState.planIncome[idx].plan = parseFloat(txt.replace(/[^0-9.-]/g, '')) || 0;
  updatePlanTotals();
  renderReconciliationTable(AppState.currentMonth);
  recalculateAll();
};
window.updatePlanExpValLive = function(idx, txt) {
  if (!AppState.planExpense[idx]) return;
  AppState.planExpense[idx].plan = parseFloat(txt.replace(/[^0-9.-]/g, '')) || 0;
  updatePlanTotals();
  renderReconciliationTable(AppState.currentMonth);
  recalculateAll();
};
window.updatePlanIncVal = function(idx, txt) {
  if (!AppState.planIncome[idx]) return;
  AppState.planIncome[idx].plan = parseFloat(txt.replace(/[^0-9.-]/g, '')) || 0;
  renderPlanTables();
  renderReconciliationTable(AppState.currentMonth);
  recalculateAll();
};
window.updatePlanExpVal = function(idx, txt) {
  if (!AppState.planExpense[idx]) return;
  AppState.planExpense[idx].plan = parseFloat(txt.replace(/[^0-9.-]/g, '')) || 0;
  renderPlanTables();
  renderReconciliationTable(AppState.currentMonth);
  recalculateAll();
};
window.updatePlanIncField = function(idx, fld, txt) { if (AppState.planIncome[idx]) AppState.planIncome[idx][fld] = txt.trim(); };
window.updatePlanExpField = function(idx, fld, txt) { if (AppState.planExpense[idx]) AppState.planExpense[idx][fld] = txt.trim(); };

function updatePlanTotals() {
  const sumInc = (AppState.planIncome || []).reduce((s, p) => s + (Number(p.plan) || 0), 0);
  const sumExp = (AppState.planExpense || []).reduce((s, p) => s + (Number(p.plan) || 0), 0);
  const incEl = document.getElementById('plan-sum-inc-val');
  const expEl = document.getElementById('plan-sum-exp-val');
  if (incEl) incEl.textContent = `${sumInc.toFixed(2)} tr`;
  if (expEl) expEl.textContent = `${sumExp.toFixed(2)} tr`;
}

// ==================== BỘ CHỌN NGÀY THÁNG NĂM CHUYÊN NGHIỆP (FRESH POP FINTECH DATE PICKER) ====================
const FinDatePicker = {
  popoverEl: null,
  backdropEl: null,
  activeInput: null,
  viewDate: new Date(),
  selectedDate: null,
  mode: 'days', // 'days' | 'months' | 'years'
  decadeStart: 2020,

  init() {
    if (this.popoverEl) return;
    this.createDOM();
    this.bindEvents();
  },

  createDOM() {
    this.backdropEl = document.createElement('div');
    this.backdropEl.id = 'fin-datepicker-backdrop';
    this.backdropEl.className = 'dp-backdrop';
    this.backdropEl.style.display = 'none';
    document.body.appendChild(this.backdropEl);

    this.popoverEl = document.createElement('div');
    this.popoverEl.id = 'fin-datepicker-popover';
    this.popoverEl.className = 'dp-popover';
    this.popoverEl.style.display = 'none';
    this.popoverEl.setAttribute('role', 'dialog');
    this.popoverEl.setAttribute('aria-modal', 'true');
    this.popoverEl.setAttribute('aria-label', 'Chọn ngày tháng năm');
    document.body.appendChild(this.popoverEl);
  },

  bindEvents() {
    document.addEventListener('click', (e) => {
      const input = e.target.closest('.input-date-cell');
      if (input) {
        e.stopPropagation();
        this.open(input);
        return;
      }
      const wrap = e.target.closest('.date-input-wrap');
      if (wrap) {
        const wrapInput = wrap.querySelector('.input-date-cell');
        if (wrapInput) {
          e.stopPropagation();
          this.open(wrapInput);
          return;
        }
      }
      if (this.isOpen()) {
        if (e.target === this.backdropEl || !this.popoverEl.contains(e.target)) {
          this.close();
        }
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen()) {
        this.close();
      }
    });

    this.backdropEl.addEventListener('click', () => this.close());

    window.addEventListener('resize', () => {
      if (this.isOpen() && this.activeInput) {
        this.position();
      }
    });
  },

  isOpen() {
    return this.popoverEl && this.popoverEl.style.display !== 'none';
  },

  parseDate(str) {
    if (!str || typeof str !== 'string') return new Date();
    const clean = str.trim();
    const parts = clean.split('-');
    if (parts.length === 3 && parts[0].length === 4) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10);
      if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
        return new Date(y, m, d);
      }
    }
    const slashParts = clean.split('/');
    if (slashParts.length === 3 && slashParts[2].length === 4) {
      const d = parseInt(slashParts[0], 10);
      const m = parseInt(slashParts[1], 10) - 1;
      const y = parseInt(slashParts[2], 10);
      if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
        return new Date(y, m, d);
      }
    }
    return new Date();
  },

  formatDate(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  },

  open(inputEl) {
    this.init();
    this.activeInput = inputEl;

    const rawVal = inputEl.getAttribute('data-iso-date') || inputEl.value;
    let parsed = null;
    let hasValue = false;

    if (rawVal && rawVal.trim()) {
      parsed = this.parseDate(rawVal);
      hasValue = true;
    } else {
      const monthFromDataset = parseInt(inputEl.dataset.month, 10);
      const targetMonth = (!isNaN(monthFromDataset) && monthFromDataset >= 1 && monthFromDataset <= 12)
        ? monthFromDataset
        : (AppState.currentMonth || 1);
      const targetYear = AppState.currentYear || new Date().getFullYear();
      parsed = new Date(targetYear, targetMonth - 1, 15);
      hasValue = false;
    }

    this.selectedDate = hasValue ? parsed : null;
    this.viewDate = new Date(parsed.getTime());
    this.mode = 'days';
    this.render();

    this.popoverEl.style.display = 'block';
    this.backdropEl.style.display = 'block';
    this.position();
  },

  close() {
    if (!this.isOpen()) return;
    this.popoverEl.style.display = 'none';
    this.backdropEl.style.display = 'none';
    this.activeInput = null;
  },

  position() {
    if (!this.activeInput || !this.popoverEl) return;
    if (window.innerWidth <= 640) {
      this.popoverEl.style.top = '';
      this.popoverEl.style.left = '';
      return;
    }

    const rect = this.activeInput.getBoundingClientRect();
    const popWidth = this.popoverEl.offsetWidth || 310;
    const popHeight = this.popoverEl.offsetHeight || 330;

    let top = rect.bottom + 6;
    let left = rect.left;

    if (top + popHeight > window.innerHeight) {
      top = Math.max(10, rect.top - popHeight - 6);
    }
    if (left + popWidth > window.innerWidth - 12) {
      left = Math.max(12, window.innerWidth - popWidth - 12);
    }

    this.popoverEl.style.top = `${top}px`;
    this.popoverEl.style.left = `${left}px`;
  },

  selectDate(d) {
    if (!this.activeInput) return;
    const isoVal = this.formatDate(d);
    const displayVal = formatDisplayDate(isoVal);

    this.activeInput.setAttribute('data-iso-date', isoVal);
    this.activeInput.value = displayVal;
    this.activeInput.dispatchEvent(new Event('input', { bubbles: true }));
    this.activeInput.dispatchEvent(new Event('change', { bubbles: true }));
    if (typeof this.activeInput.onchange === 'function') {
      this.activeInput.onchange();
    }
    this.close();
  },

  selectToday() {
    this.selectDate(new Date());
  },

  clearDate() {
    if (!this.activeInput) return;
    this.activeInput.removeAttribute('data-iso-date');
    this.activeInput.value = '';
    this.activeInput.dispatchEvent(new Event('input', { bubbles: true }));
    this.activeInput.dispatchEvent(new Event('change', { bubbles: true }));
    if (typeof this.activeInput.onchange === 'function') {
      this.activeInput.onchange();
    }
    this.close();
  },

  prevMonth() {
    this.viewDate.setMonth(this.viewDate.getMonth() - 1);
    this.render();
  },

  nextMonth() {
    this.viewDate.setMonth(this.viewDate.getMonth() + 1);
    this.render();
  },

  prevYear() {
    this.viewDate.setFullYear(this.viewDate.getFullYear() - 1);
    this.render();
  },

  nextYear() {
    this.viewDate.setFullYear(this.viewDate.getFullYear() + 1);
    this.render();
  },

  prevDecade() {
    this.decadeStart -= 12;
    this.render();
  },

  nextDecade() {
    this.decadeStart += 12;
    this.render();
  },

  render() {
    if (!this.popoverEl) return;
    if (this.mode === 'days') {
      this.renderDaysView();
    } else if (this.mode === 'months') {
      this.renderMonthsView();
    } else if (this.mode === 'years') {
      this.renderYearsView();
    }
  },

  renderDaysView() {
    const year = this.viewDate.getFullYear();
    const month = this.viewDate.getMonth();
    const today = new Date();
    const isThisMonth = today.getFullYear() === year && today.getMonth() === month;

    const firstDay = new Date(year, month, 1).getDay();
    const startOffset = (firstDay + 6) % 7;

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    let gridHtml = '';

    for (let i = startOffset - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      gridHtml += `<button type="button" class="dp-day is-outside" onclick="FinDatePicker.viewDate.setMonth(${month - 1}); FinDatePicker.selectDate(new Date(${year}, ${month - 1}, ${d}))">${d}</button>`;
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const isToday = isThisMonth && today.getDate() === d;
      let isSel = false;
      if (this.selectedDate) {
        isSel = this.selectedDate.getFullYear() === year &&
                this.selectedDate.getMonth() === month &&
                this.selectedDate.getDate() === d;
      }
      const classes = ['dp-day'];
      if (isToday) classes.push('is-today');
      if (isSel) classes.push('is-selected');

      gridHtml += `<button type="button" class="${classes.join(' ')}" onclick="FinDatePicker.selectDate(new Date(${year}, ${month}, ${d}))">${d}</button>`;
    }

    const totalCells = startOffset + daysInMonth;
    const targetTotal = totalCells > 35 ? 42 : 35;
    const nextDays = targetTotal - totalCells;
    for (let d = 1; d <= nextDays; d++) {
      gridHtml += `<button type="button" class="dp-day is-outside" onclick="FinDatePicker.viewDate.setMonth(${month + 1}); FinDatePicker.selectDate(new Date(${year}, ${month + 1}, ${d}))">${d}</button>`;
    }

    this.popoverEl.innerHTML = `
      <div class="dp-header">
        <button type="button" class="dp-nav-btn" onclick="FinDatePicker.prevMonth()" aria-label="Tháng trước">
          <i class="fa-solid fa-chevron-left"></i>
        </button>
        <button type="button" class="dp-title-btn" onclick="FinDatePicker.mode = 'months'; FinDatePicker.render();">
          Tháng ${month + 1}, ${year} <i class="fa-solid fa-chevron-down"></i>
        </button>
        <button type="button" class="dp-nav-btn" onclick="FinDatePicker.nextMonth()" aria-label="Tháng sau">
          <i class="fa-solid fa-chevron-right"></i>
        </button>
      </div>

      <div class="dp-weekdays">
        <span>T2</span><span>T3</span><span>T4</span><span>T5</span><span>T6</span><span>T7</span><span>CN</span>
      </div>

      <div class="dp-grid">
        ${gridHtml}
      </div>

      <div class="dp-footer">
        <button type="button" class="dp-link-btn is-muted" onclick="FinDatePicker.selectToday()">
          <i class="fa-regular fa-calendar-check"></i> Hôm nay
        </button>
        <button type="button" class="dp-link-btn is-muted" onclick="FinDatePicker.clearDate()">
          <i class="fa-regular fa-trash-can"></i> Xóa
        </button>
        <button type="button" class="dp-link-btn" onclick="FinDatePicker.close()">Đóng</button>
      </div>
    `;
  },

  renderMonthsView() {
    const year = this.viewDate.getFullYear();
    const currentMonth = this.viewDate.getMonth();
    const today = new Date();
    const isThisYear = today.getFullYear() === year;

    let monthsHtml = '';
    for (let m = 0; m < 12; m++) {
      const isCur = m === currentMonth;
      const isTodayMonth = isThisYear && today.getMonth() === m;
      const classes = ['dp-month'];
      if (isCur) classes.push('is-selected');
      else if (isTodayMonth) classes.push('is-current');

      monthsHtml += `<button type="button" class="${classes.join(' ')}" onclick="FinDatePicker.viewDate.setMonth(${m}); FinDatePicker.mode = 'days'; FinDatePicker.render();">Tháng ${m + 1}</button>`;
    }

    this.popoverEl.innerHTML = `
      <div class="dp-header">
        <button type="button" class="dp-nav-btn" onclick="FinDatePicker.prevYear()" aria-label="Năm trước">
          <i class="fa-solid fa-chevron-left"></i>
        </button>
        <button type="button" class="dp-title-btn" onclick="FinDatePicker.decadeStart = Math.floor(${year} / 12) * 12; FinDatePicker.mode = 'years'; FinDatePicker.render();">
          Năm ${year} <i class="fa-solid fa-chevron-down"></i>
        </button>
        <button type="button" class="dp-nav-btn" onclick="FinDatePicker.nextYear()" aria-label="Năm sau">
          <i class="fa-solid fa-chevron-right"></i>
        </button>
      </div>

      <div class="dp-picker-grid">
        ${monthsHtml}
      </div>

      <div class="dp-footer">
        <button type="button" class="dp-link-btn is-muted" onclick="FinDatePicker.mode = 'days'; FinDatePicker.render();">
          <i class="fa-solid fa-arrow-left"></i> Quay lại ngày
        </button>
        <button type="button" class="dp-link-btn" onclick="FinDatePicker.close()">Đóng</button>
      </div>
    `;
  },

  renderYearsView() {
    const startY = this.decadeStart;
    const endY = startY + 11;
    const currentYear = this.viewDate.getFullYear();
    const todayYear = new Date().getFullYear();

    let yearsHtml = '';
    for (let y = startY; y <= endY; y++) {
      const isCur = y === currentYear;
      const isTodayY = y === todayYear;
      const classes = ['dp-month'];
      if (isCur) classes.push('is-selected');
      else if (isTodayY) classes.push('is-current');

      yearsHtml += `<button type="button" class="${classes.join(' ')}" onclick="FinDatePicker.viewDate.setFullYear(${y}); FinDatePicker.mode = 'months'; FinDatePicker.render();">${y}</button>`;
    }

    this.popoverEl.innerHTML = `
      <div class="dp-header">
        <button type="button" class="dp-nav-btn" onclick="FinDatePicker.prevDecade()" aria-label="Khoảng năm trước">
          <i class="fa-solid fa-chevron-left"></i>
        </button>
        <button type="button" class="dp-title-btn" style="cursor: default;">
          ${startY} – ${endY}
        </button>
        <button type="button" class="dp-nav-btn" onclick="FinDatePicker.nextDecade()" aria-label="Khoảng năm sau">
          <i class="fa-solid fa-chevron-right"></i>
        </button>
      </div>

      <div class="dp-picker-grid">
        ${yearsHtml}
      </div>

      <div class="dp-footer">
        <button type="button" class="dp-link-btn is-muted" onclick="FinDatePicker.mode = 'months'; FinDatePicker.render();">
          <i class="fa-solid fa-arrow-left"></i> Quay lại tháng
        </button>
        <button type="button" class="dp-link-btn" onclick="FinDatePicker.close()">Đóng</button>
      </div>
    `;
  }
};
window.FinDatePicker = FinDatePicker;

// ==================== THEO DÕI THU CHI 12 THÁNG ====================
function syncMonthLearningExpense(m) {
  if (!AppState.monthlyDetails[m]) {
    AppState.monthlyDetails[m] = { incomes: [], expenses: [], learningDetails: [], reconIncomeNotes: {}, reconExpenseNotes: {} };
  }
  const items = AppState.monthlyDetails[m].learningDetails || [];
  let totalLearningCost = 0;
  items.forEach(x => {
    totalLearningCost += (parseFloat(x.val) || 0);
  });

  const expList = AppState.monthlyDetails[m].expenses;
  const lrnCatName = "Chi tiền phát triển bản thân";

  // 1. Dọn dẹp triệt để các dòng đồng bộ trùng lặp (nếu có từ lịch sử dữ liệu cũ)
  const syncedIndices = [];
  expList.forEach((x, idx) => {
    if (x && x.autoSyncedLearning === true) {
      syncedIndices.push(idx);
    }
  });
  while (syncedIndices.length > 1) {
    const removeIdx = syncedIndices.pop();
    expList.splice(removeIdx, 1);
  }

  // 2. Tìm bản ghi đồng bộ duy nhất hoặc nhận diện bản ghi kế thừa chuẩn
  let lrnIdx = expList.findIndex(x => x.autoSyncedLearning === true);
  if (lrnIdx === -1) {
    const legacyIdx = expList.findIndex(x => x.cat === lrnCatName && x.desc === "Đầu tư phát triển bản thân");
    if (legacyIdx !== -1) {
      expList[legacyIdx].autoSyncedLearning = true;
      lrnIdx = legacyIdx;
    }
  }
  let lrnExpense = lrnIdx !== -1 ? expList[lrnIdx] : null;

  const y = AppState.currentYear || 2026;
  const mStr = String(m).padStart(2, '0');
  if (totalLearningCost > 0) {
    if (!AppState.expenses.includes(lrnCatName)) {
      AppState.expenses.push(lrnCatName);
      renderSetupTables();
    }
    if (lrnExpense) {
      lrnExpense.val = totalLearningCost;
    } else {
      expList.push({
        date: `${y}-${mStr}-20`,
        cat: lrnCatName,
        desc: "Đầu tư phát triển bản thân",
        val: totalLearningCost,
        autoSyncedLearning: true
      });
    }
  } else if (lrnExpense && lrnExpense.autoSyncedLearning) {
    const idxToRemove = expList.indexOf(lrnExpense);
    if (idxToRemove !== -1) expList.splice(idxToRemove, 1);
  }
}

function renderMonthView(m) {
  syncMonthLearningExpense(m);
  const mData = AppState.monthlyDetails[m] || { incomes: [], expenses: [], learningDetails: [] };

  const incOptions = getUniqueNonEmptyList([
    AppState.incomeList,
    (AppState.planIncome || []).map(p => p.name),
    (mData.incomes || []).map(x => x.cat)
  ]);

  const tbInc = document.getElementById('tbody-m-detail-income');
  if (tbInc) {
    tbInc.innerHTML = mData.incomes.map((inc, i) => `
      <tr>
        <td>
          <div class="date-input-wrap">
            <input type="text" class="input-date-cell" data-month="${m}" data-type="income" data-index="${i}" data-iso-date="${inc.date || ''}" value="${formatDisplayDate(inc.date)}" placeholder="DD/MM/YYYY" autocomplete="off" onchange="updateMonthIncomeDate(${m}, ${i}, this.getAttribute('data-iso-date') || this.value)" onblur="updateMonthIncomeDate(${m}, ${i}, this.getAttribute('data-iso-date') || this.value)">
            <i class="fa-regular fa-calendar date-input-icon"></i>
          </div>
        </td>
        <td>
          <select class="select-inline-cell" onchange="updateMonthIncCat(${m}, ${i}, this.value)">
            ${incOptions.map(opt => `<option value="${escapeHtml(opt)}" ${opt === inc.cat ? 'selected' : ''}>${escapeHtml(opt)}</option>`).join('')}
            <option value="__ADD_NEW_CAT__">+ Thêm nguồn thu mới...</option>
          </select>
        </td>
        <td>
          <input type="text" class="input-inline-cell" value="${escapeHtml(inc.desc || '')}" placeholder="Chi tiết nguồn thu..." oninput="updateMonthIncDesc(${m}, ${i}, this.value)" onchange="updateMonthIncDesc(${m}, ${i}, this.value)">
        </td>
        <td>
          <input type="number" step="any" min="0" class="input-inline-cell text-right font-bold font-mono text-success" value="${inc.val !== undefined && inc.val !== null ? inc.val : ''}" placeholder="0.0" oninput="updateMonthIncValLive(${m}, ${i}, this.value)" onchange="updateMonthIncVal(${m}, ${i}, this.value)">
        </td>
        <td class="text-center"><button class="btn-table-del" onclick="deleteMonthIncomeRow(${m}, ${i})" aria-label="Xoá dòng thu nhập"><i class="fa-solid fa-trash-can"></i></button></td>
      </tr>
    `).join('');
  }

  const expOptions = getUniqueNonEmptyList([
    AppState.expenses,
    (AppState.planExpense || []).map(p => p.name),
    (mData.expenses || []).map(x => x.cat)
  ]);

  const tbExp = document.getElementById('tbody-m-detail-expense');
  if (tbExp) {
    tbExp.innerHTML = mData.expenses.map((exp, i) => `
      <tr>
        <td>
          <div class="date-input-wrap">
            <input type="text" class="input-date-cell" data-month="${m}" data-type="expense" data-index="${i}" data-iso-date="${exp.date || ''}" value="${formatDisplayDate(exp.date)}" placeholder="DD/MM/YYYY" autocomplete="off" onchange="updateMonthExpenseDate(${m}, ${i}, this.getAttribute('data-iso-date') || this.value)" onblur="updateMonthExpenseDate(${m}, ${i}, this.getAttribute('data-iso-date') || this.value)">
            <i class="fa-regular fa-calendar date-input-icon"></i>
          </div>
        </td>
        <td>
          <select class="select-inline-cell" onchange="updateMonthExpCat(${m}, ${i}, this.value)">
            ${expOptions.map(opt => `<option value="${escapeHtml(opt)}" ${opt === exp.cat ? 'selected' : ''}>${escapeHtml(opt)}</option>`).join('')}
            <option value="__ADD_NEW_CAT__">+ Thêm danh mục mới...</option>
          </select>
        </td>
        <td>
          <input type="text" class="input-inline-cell" value="${escapeHtml(exp.desc || '')}" placeholder="Chi tiết giao dịch..." oninput="updateMonthExpDesc(${m}, ${i}, this.value)" onchange="updateMonthExpDesc(${m}, ${i}, this.value)">
        </td>
        <td>
          <input type="number" step="any" min="0" class="input-inline-cell text-right font-bold font-mono text-danger" value="${exp.val !== undefined && exp.val !== null ? exp.val : ''}" placeholder="0.0" oninput="updateMonthExpValLive(${m}, ${i}, this.value)" onchange="updateMonthExpVal(${m}, ${i}, this.value)">
        </td>
        <td class="text-center"><button class="btn-table-del" onclick="deleteMonthExpenseRow(${m}, ${i})" aria-label="Xoá dòng chi tiêu"><i class="fa-solid fa-trash-can"></i></button></td>
      </tr>
    `).join('');
  }

  renderMonthLearningSection(m);
  renderReconciliationTable(m);
  renderMonthHorizontalBarChart();
}

function renderReconciliationTable(m) {
  const mData = AppState.monthlyDetails[m] || { incomes: [], expenses: [], reconIncomeNotes: {}, reconExpenseNotes: {} };
  if (!mData.reconIncomeNotes) mData.reconIncomeNotes = {};
  if (!mData.reconExpenseNotes) mData.reconExpenseNotes = {};

  const actIncMap = {};
  let totalActInc = 0;
  (mData.incomes || []).forEach(x => {
    const v = Number(x.val) || 0;
    actIncMap[x.cat] = (actIncMap[x.cat] || 0) + v;
    totalActInc += v;
  });

  const planIncMap = {};
  (AppState.planIncome || []).forEach(p => {
    const v = Number(p.plan) || 0;
    planIncMap[p.name] = (planIncMap[p.name] || 0) + v;
  });

  const incCategories = getUniqueNonEmptyList([
    (AppState.planIncome || []).map(p => p.name),
    AppState.incomeList,
    (mData.incomes || []).map(x => x.cat)
  ]);

  let sumPlanInc = 0;
  const incRows = incCategories.map(catName => {
    const plan = planIncMap[catName] || 0;
    const act = actIncMap[catName] || 0;
    const diff = act - plan;
    sumPlanInc += plan;
    const note = mData.reconIncomeNotes[catName] || { reason: '', action: '' };
    const safeCatJs = catName.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    return `
      <tr>
        <td class="font-medium">${escapeHtml(catName)}</td>
        <td class="text-right font-mono">${plan.toFixed(1)}</td>
        <td class="text-right font-bold font-mono">${act.toFixed(1)}</td>
        <td class="text-right font-bold font-mono ${diff >= 0 ? 'text-success' : 'text-danger'}">${diff === 0 ? '-' : (diff > 0 ? diff.toFixed(1) : `(${Math.abs(diff).toFixed(1)})`)}</td>
        <td class="cell-blue" contenteditable="true" spellcheck="false" onblur="updateReconNote(${m}, 'inc', '${safeCatJs}', 'reason', this.innerText)">${escapeHtml(note.reason || '')}</td>
        <td class="cell-blue" contenteditable="true" spellcheck="false" onblur="updateReconNote(${m}, 'inc', '${safeCatJs}', 'action', this.innerText)">${escapeHtml(note.action || '')}</td>
      </tr>
    `;
  }).join('');

  const tbReconInc = document.getElementById('tbody-m-recon-income');
  if (tbReconInc) tbReconInc.innerHTML = incRows;

  const footReconIncPlan = document.getElementById('tfoot-recon-inc-plan');
  if (footReconIncPlan) footReconIncPlan.textContent = sumPlanInc.toFixed(1);

  const footReconIncAct = document.getElementById('tfoot-recon-inc-act');
  if (footReconIncAct) footReconIncAct.textContent = totalActInc.toFixed(1);

  const incDiffTot = totalActInc - sumPlanInc;
  const footReconIncDiff = document.getElementById('tfoot-recon-inc-diff');
  if (footReconIncDiff) {
    footReconIncDiff.className = `text-right font-bold font-mono ${incDiffTot >= 0 ? 'text-success' : 'text-danger'}`;
    footReconIncDiff.textContent = incDiffTot >= 0 ? incDiffTot.toFixed(1) : `(${Math.abs(incDiffTot).toFixed(1)})`;
  }

  const footMIncTotal = document.getElementById('tfoot-m-inc-total');
  if (footMIncTotal) footMIncTotal.textContent = totalActInc.toFixed(1);

  const actExpMap = {};
  let totalActExp = 0;
  (mData.expenses || []).forEach(x => {
    const v = Number(x.val) || 0;
    actExpMap[x.cat] = (actExpMap[x.cat] || 0) + v;
    totalActExp += v;
  });

  const planExpMap = {};
  (AppState.planExpense || []).forEach(p => {
    const v = Number(p.plan) || 0;
    planExpMap[p.name] = (planExpMap[p.name] || 0) + v;
  });

  const expCategories = getUniqueNonEmptyList([
    (AppState.planExpense || []).map(p => p.name),
    AppState.expenses,
    (mData.expenses || []).map(x => x.cat)
  ]);

  let sumPlanExp = 0;
  const expRows = expCategories.map(catName => {
    const plan = planExpMap[catName] || 0;
    const act = actExpMap[catName] || 0;
    const diff = plan - act;
    sumPlanExp += plan;
    const note = mData.reconExpenseNotes[catName] || { reason: '', action: '' };
    const safeCatJs = catName.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    return `
      <tr>
        <td class="font-medium">${escapeHtml(catName)}</td>
        <td class="text-right font-mono">${plan.toFixed(1)}</td>
        <td class="text-right font-bold font-mono">${act.toFixed(1)}</td>
        <td class="text-right font-bold font-mono ${diff >= 0 ? 'text-success' : 'text-danger'}">${diff === 0 ? '-' : (diff > 0 ? diff.toFixed(1) : `(${Math.abs(diff).toFixed(1)})`)}</td>
        <td class="cell-blue" contenteditable="true" spellcheck="false" onblur="updateReconNote(${m}, 'exp', '${safeCatJs}', 'reason', this.innerText)">${escapeHtml(note.reason || '')}</td>
        <td class="cell-blue" contenteditable="true" spellcheck="false" onblur="updateReconNote(${m}, 'exp', '${safeCatJs}', 'action', this.innerText)">${escapeHtml(note.action || '')}</td>
      </tr>
    `;
  }).join('');

  const tbReconExp = document.getElementById('tbody-m-recon-expense');
  if (tbReconExp) tbReconExp.innerHTML = expRows;

  const footReconExpPlan = document.getElementById('tfoot-recon-exp-plan');
  if (footReconExpPlan) footReconExpPlan.textContent = sumPlanExp.toFixed(1);

  const footReconExpAct = document.getElementById('tfoot-recon-exp-act');
  if (footReconExpAct) footReconExpAct.textContent = totalActExp.toFixed(1);

  const expDiffTot = sumPlanExp - totalActExp;
  const footReconExpDiff = document.getElementById('tfoot-recon-exp-diff');
  if (footReconExpDiff) {
    footReconExpDiff.className = `text-right font-bold font-mono ${expDiffTot >= 0 ? 'text-success' : 'text-danger'}`;
    footReconExpDiff.textContent = expDiffTot >= 0 ? expDiffTot.toFixed(1) : `(${Math.abs(expDiffTot).toFixed(1)})`;
  }

  const footMExpTotal = document.getElementById('tfoot-m-exp-total');
  if (footMExpTotal) footMExpTotal.textContent = totalActExp.toFixed(1);

  const savings = totalActInc - totalActExp;
  const fmtSummaryVal = (v) => {
    const num = Number(v) || 0;
    return Number.isInteger(num) ? String(num) : num.toFixed(1).replace(/\.0$/, '');
  };
  const mSumInc = document.getElementById('m-summary-income');
  if (mSumInc) mSumInc.textContent = fmtSummaryVal(totalActInc);

  const mSumExp = document.getElementById('m-summary-expense');
  if (mSumExp) mSumExp.textContent = fmtSummaryVal(totalActExp);

  const mSumSav = document.getElementById('m-summary-savings');
  if (mSumSav) mSumSav.textContent = fmtSummaryVal(savings);
}

window.addMonthDetailIncomeRow = function() {
  const m = AppState.currentMonth || 1;
  const y = AppState.currentYear || 2026;
  const mStr = String(m).padStart(2, '0');
  if (AppState.incomeList.length === 0) {
    AppState.incomeList.push("Nguồn thu mới 1");
    renderSetupTables();
  }
  const firstCat = AppState.incomeList[0];
  if (!AppState.monthlyDetails[m]) {
    AppState.monthlyDetails[m] = { incomes: [], expenses: [], learningDetails: [], reconIncomeNotes: {}, reconExpenseNotes: {} };
  }
  AppState.monthlyDetails[m].incomes.push({
    date: `${y}-${mStr}-15`,
    cat: firstCat,
    desc: "",
    val: 0.0
  });
  sortMonthTransactions(m, 'incomes');
  renderMonthView(m);
  recalculateAll();
};

window.deleteMonthIncomeRow = function(m, i) {
  if (AppState.monthlyDetails[m] && AppState.monthlyDetails[m].incomes) {
    AppState.monthlyDetails[m].incomes.splice(i, 1);
    renderMonthView(m);
    recalculateAll();
  }
};

window.addMonthDetailExpenseRow = function() {
  const m = AppState.currentMonth || 1;
  const y = AppState.currentYear || 2026;
  const mStr = String(m).padStart(2, '0');
  if (AppState.expenses.length === 0) {
    AppState.expenses.push("Chi tiêu mới 1");
    renderSetupTables();
  }
  const firstCat = AppState.expenses[0];
  if (!AppState.monthlyDetails[m]) {
    AppState.monthlyDetails[m] = { incomes: [], expenses: [], learningDetails: [], reconIncomeNotes: {}, reconExpenseNotes: {} };
  }
  AppState.monthlyDetails[m].expenses.push({
    date: `${y}-${mStr}-10`,
    cat: firstCat,
    desc: "",
    val: 0.0
  });
  sortMonthTransactions(m, 'expenses');
  renderMonthView(m);
  recalculateAll();
};

window.deleteMonthExpenseRow = function(m, i) {
  if (AppState.monthlyDetails[m] && AppState.monthlyDetails[m].expenses) {
    AppState.monthlyDetails[m].expenses.splice(i, 1);
    renderMonthView(m);
    recalculateAll();
  }
};

window.updateMonthIncomeDate = function(m, i, val) {
  const iso = parseToIsoDate(val);
  if (!AppState.monthlyDetails[m] || !AppState.monthlyDetails[m].incomes[i]) return;
  const item = AppState.monthlyDetails[m].incomes[i];
  item.date = iso;

  const targetMonth = getMonthFromIso(iso);
  if (targetMonth && targetMonth !== m && targetMonth >= 1 && targetMonth <= 12) {
    if (!AppState.monthlyDetails[targetMonth]) {
      AppState.monthlyDetails[targetMonth] = { incomes: [], expenses: [], learningDetails: [], reconIncomeNotes: {}, reconExpenseNotes: {} };
    }
    AppState.monthlyDetails[m].incomes.splice(i, 1);
    AppState.monthlyDetails[targetMonth].incomes.push(item);
    sortMonthTransactions(targetMonth, 'incomes');
    showToast(`Đã tự động chuyển giao dịch thu nhập sang Tháng ${String(targetMonth).padStart(2, '0')}`, "info");
  } else {
    sortMonthTransactions(m, 'incomes');
  }

  renderMonthView(AppState.currentMonth);
  recalculateAll();
};

window.updateMonthExpenseDate = function(m, i, val) {
  const iso = parseToIsoDate(val);
  if (!AppState.monthlyDetails[m] || !AppState.monthlyDetails[m].expenses[i]) return;
  const item = AppState.monthlyDetails[m].expenses[i];
  item.date = iso;

  const targetMonth = getMonthFromIso(iso);
  if (targetMonth && targetMonth !== m && targetMonth >= 1 && targetMonth <= 12) {
    if (!AppState.monthlyDetails[targetMonth]) {
      AppState.monthlyDetails[targetMonth] = { incomes: [], expenses: [], learningDetails: [], reconIncomeNotes: {}, reconExpenseNotes: {} };
    }
    AppState.monthlyDetails[m].expenses.splice(i, 1);
    AppState.monthlyDetails[targetMonth].expenses.push(item);
    sortMonthTransactions(targetMonth, 'expenses');
    showToast(`Đã tự động chuyển giao dịch chi tiêu sang Tháng ${String(targetMonth).padStart(2, '0')}`, "info");
  } else {
    sortMonthTransactions(m, 'expenses');
  }

  renderMonthView(AppState.currentMonth);
  recalculateAll();
};

window.updateMonthIncDesc = function(m, i, txt) {
  if (AppState.monthlyDetails[m]?.incomes?.[i]) {
    AppState.monthlyDetails[m].incomes[i].desc = (txt || '').trim();
  }
};
window.updateMonthExpDesc = function(m, i, txt) {
  if (AppState.monthlyDetails[m]?.expenses?.[i]) {
    AppState.monthlyDetails[m].expenses[i].desc = (txt || '').trim();
  }
};
window.updateMonthIncCat = function(m, i, val) {
  if (!AppState.monthlyDetails[m]?.incomes?.[i]) return;
  if (val === '__ADD_NEW_CAT__') {
    const newCat = (prompt("Nhập tên nguồn thu mới:") || "").trim();
    if (newCat) {
      if (!AppState.incomeList.includes(newCat)) {
        AppState.incomeList.push(newCat);
        renderSetupTables();
      }
      AppState.monthlyDetails[m].incomes[i].cat = newCat;
      showToast(`Đã thêm nguồn thu mới: ${newCat}`, "success");
    }
  } else {
    AppState.monthlyDetails[m].incomes[i].cat = val;
  }
  renderMonthView(m);
  recalculateAll();
};

window.updateMonthExpCat = function(m, i, val) {
  if (!AppState.monthlyDetails[m]?.expenses?.[i]) return;
  if (val === '__ADD_NEW_CAT__') {
    const newCat = (prompt("Nhập tên danh mục chi tiêu mới:") || "").trim();
    if (newCat) {
      if (!AppState.expenses.includes(newCat)) {
        AppState.expenses.push(newCat);
        renderSetupTables();
      }
      AppState.monthlyDetails[m].expenses[i].cat = newCat;
      showToast(`Đã thêm danh mục mới: ${newCat}`, "success");
    }
  } else {
    AppState.monthlyDetails[m].expenses[i].cat = val;
  }
  renderMonthView(m);
  recalculateAll();
};

window.updateMonthIncValLive = function(m, i, val) {
  if (!AppState.monthlyDetails[m]?.incomes?.[i]) return;
  const num = typeof val === 'number' ? val : (parseFloat(String(val).replace(/,/g, '.')) || 0);
  AppState.monthlyDetails[m].incomes[i].val = num;
  renderReconciliationTable(m);
  recalculateAll();
};

window.updateMonthExpValLive = function(m, i, val) {
  if (!AppState.monthlyDetails[m]?.expenses?.[i]) return;
  const num = typeof val === 'number' ? val : (parseFloat(String(val).replace(/,/g, '.')) || 0);
  AppState.monthlyDetails[m].expenses[i].val = num;
  AppState.monthlyDetails[m].expenses[i].userEdited = true;
  renderReconciliationTable(m);
  renderMonthHorizontalBarChart();
  recalculateAll();
};

window.updateMonthIncVal = function(m, i, val) {
  window.updateMonthIncValLive(m, i, val);
};

window.updateMonthExpVal = function(m, i, val) {
  window.updateMonthExpValLive(m, i, val);
};

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
  const lrnOptions = getUniqueNonEmptyList([
    AppState.planList,
    items.map(x => x.cat)
  ]);
  
  if (tb) {
    tb.innerHTML = items.map((it, i) => `
      <tr>
        <td>
          <div class="date-input-wrap">
            <input type="text" class="input-date-cell" data-month="${m}" data-type="learning" data-index="${i}" data-iso-date="${it.date || ''}" value="${formatDisplayDate(it.date)}" placeholder="DD/MM/YYYY" autocomplete="off" onchange="updateMonthLearningField(${m}, ${i}, 'date', this.getAttribute('data-iso-date') || this.value)" onblur="updateMonthLearningField(${m}, ${i}, 'date', this.getAttribute('data-iso-date') || this.value)">
            <i class="fa-regular fa-calendar date-input-icon"></i>
          </div>
        </td>
        <td>
          <select class="select-inline-cell" onchange="updateMonthLearningCat(${m}, ${i}, this.value)">
            ${lrnOptions.map(opt => `<option value="${escapeHtml(opt)}" ${opt === it.cat ? 'selected' : ''}>${escapeHtml(opt)}</option>`).join('')}
            <option value="__ADD_NEW_CAT__">+ Thêm kế hoạch mới...</option>
          </select>
        </td>
        <td>
          <input type="text" class="input-inline-cell" value="${escapeHtml(it.desc || '')}" placeholder="Nội dung khóa học / sách..." oninput="updateMonthLearningFieldLive(${m}, ${i}, 'desc', this.value)" onchange="updateMonthLearningFieldLive(${m}, ${i}, 'desc', this.value)">
        </td>
        <td>
          <input type="number" step="any" min="0" class="input-inline-cell text-right font-bold font-mono text-info" value="${it.val !== undefined && it.val !== null ? it.val : ''}" placeholder="0.0" oninput="updateMonthLearningValLive(${m}, ${i}, this.value)" onchange="updateMonthLearningVal(${m}, ${i}, this.value)">
        </td>
        <td>
          <input type="text" class="input-inline-cell" value="${escapeHtml(it.expRes || '')}" placeholder="Kết quả kỳ vọng..." oninput="updateMonthLearningFieldLive(${m}, ${i}, 'expRes', this.value)" onchange="updateMonthLearningFieldLive(${m}, ${i}, 'expRes', this.value)">
        </td>
        <td>
          <input type="text" class="input-inline-cell" value="${escapeHtml(it.actRes || '')}" placeholder="Kết quả thực tế..." oninput="updateMonthLearningFieldLive(${m}, ${i}, 'actRes', this.value)" onchange="updateMonthLearningFieldLive(${m}, ${i}, 'actRes', this.value)">
        </td>
        <td class="text-center"><button class="btn-table-del" onclick="deleteMonthLearningRow(${m}, ${i})" aria-label="Xoá dòng đào tạo"><i class="fa-solid fa-trash-can"></i></button></td>
      </tr>
    `).join('');
  }

  updateMonthLearningStats(m);
}

function updateMonthLearningStats(m) {
  const items = AppState.monthlyDetails[m]?.learningDetails || [];
  const catSums = {};
  let totalLearningCost = 0;
  items.forEach(x => {
    const val = parseFloat(x.val) || 0;
    catSums[x.cat] = (catSums[x.cat] || 0) + val;
    totalLearningCost += val;
  });

  const statCats = getUniqueNonEmptyList([
    AppState.planList,
    items.map(x => x.cat)
  ]);

  const tbStat = document.getElementById('tbody-m-learning-stat');
  if (tbStat) {
    tbStat.innerHTML = statCats.map(name => {
      const val = catSums[name] || 0;
      return `<tr><td>${escapeHtml(name)}</td><td class="text-right font-bold text-info font-mono">${val.toFixed(2)}</td></tr>`;
    }).join('');
  }

  const footTotal = document.getElementById('tfoot-m-learn-total');
  const footStatTotal = document.getElementById('tfoot-m-learn-stat-total');
  if (footTotal) footTotal.textContent = totalLearningCost.toFixed(2);
  if (footStatTotal) footStatTotal.textContent = totalLearningCost.toFixed(2);

  // Cập nhật dải thẻ KPI tổng quan chi phí học tập & đào tạo
  let topCat = 'Chưa có';
  let maxCatVal = 0;
  for (const [cat, val] of Object.entries(catSums)) {
    if (val > maxCatVal) {
      maxCatVal = val;
      topCat = cat;
    }
  }

  const kpiTotal = document.getElementById('m-learn-kpi-total');
  const kpiCount = document.getElementById('m-learn-kpi-count');
  const kpiTop = document.getElementById('m-learn-kpi-top');
  if (kpiTotal) kpiTotal.textContent = totalLearningCost.toFixed(2);
  if (kpiCount) kpiCount.textContent = items.length;
  if (kpiTop) kpiTop.textContent = maxCatVal > 0 ? `${topCat} (${maxCatVal.toFixed(2)} tr)` : 'Chưa có';

  syncMonthLearningExpense(m);
}

window.updateMonthLearningFieldLive = function(m, i, field, val) {
  if (AppState.monthlyDetails[m]?.learningDetails?.[i]) {
    AppState.monthlyDetails[m].learningDetails[i][field] = (val || '').trim();
  }
};

window.updateMonthLearningValLive = function(m, i, val) {
  if (!AppState.monthlyDetails[m]?.learningDetails?.[i]) return;
  const num = typeof val === 'number' ? val : (parseFloat(String(val).replace(/,/g, '.')) || 0);
  AppState.monthlyDetails[m].learningDetails[i].val = num;
  updateMonthLearningStats(m);
  syncLearningToDashboard();
};

window.updateMonthLearningVal = function(m, i, val) {
  window.updateMonthLearningValLive(m, i, val);
};

window.updateMonthLearningCat = function(m, i, val) {
  if (!AppState.monthlyDetails[m]?.learningDetails?.[i]) return;
  if (val === '__ADD_NEW_CAT__') {
    const newCat = (prompt("Nhập tên mục kế hoạch đào tạo mới:") || "").trim();
    if (newCat) {
      if (!AppState.planList.includes(newCat)) {
        AppState.planList.push(newCat);
        renderSetupTables();
      }
      AppState.monthlyDetails[m].learningDetails[i].cat = newCat;
      showToast(`Đã thêm kế hoạch mới: ${newCat}`, "success");
    }
  } else {
    AppState.monthlyDetails[m].learningDetails[i].cat = val;
  }
  updateMonthLearningStats(m);
  renderMonthView(m);
  recalculateAll();
};

window.updateMonthLearningField = function(m, i, field, value) {
  if (!AppState.monthlyDetails[m] || !AppState.monthlyDetails[m].learningDetails[i]) return;
  if (field === 'date') {
    const iso = parseToIsoDate(value);
    const item = AppState.monthlyDetails[m].learningDetails[i];
    item.date = iso;
    const targetMonth = getMonthFromIso(iso);
    if (targetMonth && targetMonth !== m && targetMonth >= 1 && targetMonth <= 12) {
      if (!AppState.monthlyDetails[targetMonth]) {
        AppState.monthlyDetails[targetMonth] = { incomes: [], expenses: [], learningDetails: [], reconIncomeNotes: {}, reconExpenseNotes: {} };
      }
      AppState.monthlyDetails[m].learningDetails.splice(i, 1);
      AppState.monthlyDetails[targetMonth].learningDetails.push(item);
      sortMonthTransactions(targetMonth, 'learningDetails');
      syncMonthLearningExpense(targetMonth);
      showToast(`Đã tự động chuyển mục phát triển bản thân sang Tháng ${String(targetMonth).padStart(2, '0')}`, "info");
      renderMonthView(AppState.currentMonth);
      recalculateAll();
    } else {
      sortMonthTransactions(m, 'learningDetails');
      renderMonthView(m);
      recalculateAll();
    }
  } else if (field === 'val') {
    window.updateMonthLearningVal(m, i, value);
  } else {
    AppState.monthlyDetails[m].learningDetails[i][field] = value;
    updateMonthLearningStats(m);
    recalculateAll();
  }
};

window.addMonthLearningRow = function() {
  const m = AppState.currentMonth || 1;
  const y = AppState.currentYear || 2026;
  const mStr = String(m).padStart(2, '0');
  if (AppState.planList.length === 0) {
    AppState.planList.push("Kế hoạch đào tạo 1");
    renderSetupTables();
  }
  const defaultCat = AppState.planList[0];
  if (!AppState.monthlyDetails[m]) {
    AppState.monthlyDetails[m] = { incomes: [], expenses: [], learningDetails: [], reconIncomeNotes: {}, reconExpenseNotes: {} };
  }
  AppState.monthlyDetails[m].learningDetails.push({
    date: `${y}-${mStr}-10`,
    cat: defaultCat,
    desc: "",
    val: 0.0,
    expRes: "",
    actRes: ""
  });
  sortMonthTransactions(m, 'learningDetails');
  renderMonthView(m);
  recalculateAll();
};

window.deleteMonthLearningRow = function(m, i) {
  if (AppState.monthlyDetails[m] && AppState.monthlyDetails[m].learningDetails) {
    AppState.monthlyDetails[m].learningDetails.splice(i, 1);
    renderMonthView(m);
    recalculateAll();
  }
};

function syncLearningToDashboard() {
  renderReconciliationTable(AppState.currentMonth);
  renderMonthHorizontalBarChart();
  recalculateAll();
}

window.monthBarChartInstance = null;
function renderMonthHorizontalBarChart() {
  const canvas = document.getElementById('monthExpenseBarChart');
  if (!canvas || typeof Chart === 'undefined') return;

  const themeTokens = typeof window.getChartThemeTokens === 'function' ? window.getChartThemeTokens() : {
    text: '#292747', textMuted: '#8582A3', grid: '#E8E5F7', border: '#ffffff', planBar: '#E8E5F7'
  };

  const mData = AppState.monthlyDetails[AppState.currentMonth] || { expenses: [] };
  const catSums = {};
  (mData.expenses || []).forEach(x => {
    const v = Number(x.val) || 0;
    catSums[x.cat] = (catSums[x.cat] || 0) + v;
  });

  const labels = getUniqueNonEmptyList([
    (AppState.planExpense || []).map(p => p.name),
    AppState.expenses,
    (mData.expenses || []).map(x => x.cat)
  ]).reverse();
  const data = labels.map(name => catSums[name] || 0);

  if (window.monthBarChartInstance) window.monthBarChartInstance.destroy();
  window.monthBarChartInstance = new Chart(canvas.getContext('2d'), {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{ label: "Chi thực tế", data: data, backgroundColor: "#F06E78", borderRadius: 4, barPercentage: 0.65 }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: ctx => ` ${ctx.parsed.x.toFixed(1)} tr` } }
      },
      scales: {
        x: { beginAtZero: true, grid: { color: themeTokens.grid }, ticks: { font: { family: 'Inter', size: 10 }, color: themeTokens.textMuted } },
        y: { grid: { display: false }, ticks: { font: { family: 'Inter', size: 10 }, color: themeTokens.text } }
      }
    }
  });
}

// ==================== CÂN ĐỐI LỘ TRÌNH NGHỀ NGHIỆP ====================
window.careerChartInstance = null;

function renderCareerTables() {
  const milestones = calculateAgeMilestones();
  const tb1 = document.getElementById('tbody-career-overview');
  if (tb1) {
    tb1.innerHTML = milestones.map((item, idx) => `
      <tr>
        <td class="text-center font-bold font-mono bg-neutral-gray">${item.age}</td>
        <td class="text-right font-bold text-primary font-mono">${item.incomeNeed.toFixed(1)}</td>
        <td class="text-right font-semibold font-mono">${item.stocks.toFixed(1)}%</td>
        <td class="text-right font-semibold font-mono">${item.bonds.toFixed(1)}%</td>
        <td class="text-right font-semibold font-mono">${item.ins.toFixed(1)}%</td>
        <td class="text-right font-semibold font-mono">${item.cash.toFixed(1)}%</td>
        <td class="text-right font-bold text-success font-mono">${item.returnNeed.toFixed(2)}%</td>
        <td class="cell-blue" contenteditable="true" spellcheck="false" onblur="AppState.skillsStore[${idx}]=this.innerText.trim();">${escapeHtml(item.skills || '')}</td>
      </tr>
    `).join('');
  }

  AppState.careerDetailList = calculateCareerDetails();
  const tb2 = document.getElementById('tbody-career-detail');
  if (tb2) {
    tb2.innerHTML = AppState.careerDetailList.map((item, idx) => {
      const isDeficit = item.route < item.target;
      const diffVal = Math.abs(item.target - item.route).toFixed(1);
      const isCurrentYear = item.year === AppState.currentYear;

      return `
        <tr>
          <td class="text-center font-bold font-mono bg-neutral-gray">${item.age}</td>
          
          <td class="text-right font-bold font-mono ${isCurrentYear ? 'cell-blue' : 'cell-disabled-readonly'}" 
              ${isCurrentYear ? `contenteditable="true" spellcheck="false" onblur="updateCareerDetailField(${idx}, 'actual', parseFloat(this.innerText.replace(/[^0-9.-]/g, ''))||0)"` : ''}>
            ${item.actual !== null ? Number(item.actual).toFixed(1) : '<span class="dash-null">-</span>'}
          </td>
          
          <td class="text-right font-bold text-primary font-mono">${item.target.toFixed(1)}</td>
          
          <td class="text-right font-bold cell-blue font-mono ${isDeficit ? 'text-danger' : 'text-success'}" 
              contenteditable="true" spellcheck="false" 
              onblur="updateCareerDetailField(${idx}, 'route', parseFloat(this.innerText.replace(/[^0-9.-]/g, ''))||0)">
            ${item.route.toFixed(1)}
          </td>
          
          <td class="text-center">
            ${isDeficit 
              ? `<span class="deficit-badge">⚠ Cần thêm (${diffVal} tr)</span>` 
              : `<span class="success-badge">✅ Vững tâm (Đạt)</span>`
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
    if (field === 'actual') AppState.careerDetailList[idx].manualActual = true;
    if (field === 'route') AppState.careerDetailList[idx].manualRoute = true;
    renderCareerTables();
    renderCareerChart();
  }
};

function renderCareerChart() {
  const canvas = document.getElementById('careerChart');
  if (!canvas || typeof Chart === 'undefined') return;

  const themeTokens = typeof window.getChartThemeTokens === 'function' ? window.getChartThemeTokens() : {
    text: '#292747', textMuted: '#8582A3', grid: '#E8E5F7', border: '#ffffff', planBar: '#E8E5F7'
  };

  const dataList = AppState.careerDetailList.length > 0 ? AppState.careerDetailList : calculateCareerDetails();
  const labels = dataList.map(x => `${x.age} tuổi`);
  const targets = dataList.map(x => x.target);
  const routes = dataList.map(x => x.route);

  const getRouteContinuousGradient = (context) => {
    const chart = context.chart;
    const { ctx, chartArea } = chart;
    if (!chartArea) return '#159F87';

    const gradient = ctx.createLinearGradient(chartArea.left, 0, chartArea.right, 0);
    const totalPoints = routes.length;
    if (totalPoints <= 1) return '#159F87';

    routes.forEach((val, i) => {
      const stop = i / (totalPoints - 1);
      const isMet = val >= targets[i];
      gradient.addColorStop(stop, isMet ? '#159F87' : '#F06E78');
    });

    return gradient;
  };

  if (window.careerChartInstance) window.careerChartInstance.destroy();
  window.careerChartInstance = new Chart(canvas.getContext('2d'), {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: "Thu nhập cần có để đạt mục tiêu",
          data: targets,
          borderColor: "#8582A3",
          backgroundColor: "rgba(133, 130, 163, 0.1)",
          borderWidth: 2.5,
          borderDash: [5, 5],
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: "#8582A3",
          fill: false,
          tension: 0.25
        },
        {
          label: "Thu nhập bạn dự kiến kiếm được",
          data: routes,
          borderColor: getRouteContinuousGradient,
          borderWidth: 3,
          pointRadius: 5,
          pointHoverRadius: 7,
          pointBackgroundColor: ctx => {
            const idx = ctx.dataIndex;
            return routes[idx] >= targets[idx] ? "#159F87" : "#F06E78";
          },
          pointBorderColor: themeTokens.border,
          pointBorderWidth: 2,
          fill: false,
          tension: 0.25
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
          labels: {
            font: { family: 'Inter', size: 11, weight: '600' },
            color: themeTokens.text,
            boxWidth: 24,
            boxHeight: 10,
            padding: 16
          }
        },
        tooltip: {
          callbacks: {
            label: ctx => {
              if (ctx.raw === null || ctx.raw === undefined) return '';
              const val = Number(ctx.raw).toFixed(1);
              if (ctx.datasetIndex === 1) {
                const targetVal = targets[ctx.dataIndex];
                const diff = (ctx.raw - targetVal).toFixed(1);
                const status = ctx.raw >= targetVal ? `[Đạt (+${diff} tr)]` : `[Cần thêm (${diff} tr)]`;
                return ` ${ctx.dataset.label}: ${val} tr ${status}`;
              }
              return ` ${ctx.dataset.label}: ${val} tr`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          suggestedMax: 100,
          ticks: { stepSize: 10, font: { family: 'Inter', size: 10 }, color: themeTokens.textMuted },
          grid: { color: themeTokens.grid },
          title: { display: true, text: "Triệu đồng / tháng", font: { family: 'Inter', size: 11, weight: 600 }, color: themeTokens.text }
        },
        x: { grid: { display: false }, ticks: { font: { family: 'Inter', size: 10 }, color: themeTokens.textMuted } }
      }
    }
  });
}

// ==================== BẢNG KHẢO SÁT ====================
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
            <span class="gform-q-number">Câu hỏi ${qNum} / 21 &bull; Phần 1</span>
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
          <div class="survey-graphic-box">
            <table class="sub-table-graphic">
              <thead>
                <tr>
                  <th>Danh mục đầu tư</th>
                  <th>Giá trị kỳ vọng của 100 triệu sau 1 năm</th>
                  <th>Khả năng lỗ sau một năm</th>
                </tr>
              </thead>
              <tbody>
                <tr><td class="font-bold">Danh mục A</td><td>107 triệu</td><td class="text-danger font-bold">19%</td></tr>
                <tr><td class="font-bold">Danh mục B</td><td>108 triệu</td><td class="text-danger font-bold">23%</td></tr>
                <tr><td class="font-bold">Danh mục C</td><td>109 triệu</td><td class="text-danger font-bold">26%</td></tr>
                <tr><td class="font-bold">Danh mục D</td><td>110 triệu</td><td class="text-danger font-bold">28%</td></tr>
              </tbody>
            </table>
          </div>
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
            <span class="gform-q-number">Câu hỏi ${10 + qNum} / 21 &bull; Phần 2 (Câu ${qNum})</span>
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

window.currentSurveyStep = 1;

window.openSurveyTab = function(stepNum) {
  const step = Math.max(1, Math.min(3, parseInt(stepNum, 10) || 1));
  window.currentSurveyStep = step;
  switchTab('tab-khaosat');
  if (typeof window.goToSurveyStep === 'function') {
    window.goToSurveyStep(step);
  }
};

window.goToSurveyStep = function(stepNum) {
  const step = Math.max(1, Math.min(3, parseInt(stepNum, 10) || 1));
  window.currentSurveyStep = step;

  for (let i = 1; i <= 3; i++) {
    const pane = document.getElementById(`survey-step-pane-${i}`);
    const btn = document.getElementById(`survey-step-btn-${i}`);
    if (pane) {
      if (i === step) {
        pane.classList.add('active');
        pane.style.display = 'flex';
      } else {
        pane.classList.remove('active');
        pane.style.display = 'none';
      }
    }
    if (btn) {
      btn.classList.toggle('active', i === step);
      btn.setAttribute('aria-selected', (i === step).toString());
    }
  }

  if (step === 1) {
    setTimeout(renderSurveyQuestionCharts, 50);
  } else if (step === 3) {
    evaluateSurveys();
  }

  window.updateSurveyProgress();

  const nav = document.getElementById('survey-nav-three') || document.getElementById('survey-stepper-wrap');
  if (nav) {
    nav.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
};

window.toggleSurveyViewMode = function(mode) {
  // Mode 3-bước là chuẩn mực bắt buộc, không hiển thị đồng thời 3 phần
  window.goToSurveyStep(window.currentSurveyStep || 1);
};

window.updateSurveyProgress = function() {
  const p1Keys = Object.keys(AppState.surveyP1Choices || {});
  const p2Keys = Object.keys(AppState.surveyP2Choices || {});
  const p1Count = p1Keys.length;
  const p2Count = p2Keys.length;
  const total = p1Count + p2Count;
  const pct = Math.min(100, Math.round((total / 21) * 100));
  const p1Remaining = Math.max(0, 10 - p1Count);
  const p2Remaining = Math.max(0, 11 - p2Count);

  // Cập nhật tab status pills trên thanh điều hướng 3 mục
  const tabStat1 = document.getElementById('survey-tab-stat-1');
  const tabStat2 = document.getElementById('survey-tab-stat-2');
  const tabStat3 = document.getElementById('survey-tab-stat-3');

  if (tabStat1) {
    tabStat1.textContent = `${p1Count}/10 câu`;
    tabStat1.classList.toggle('status-done', p1Count >= 10);
  }
  if (tabStat2) {
    tabStat2.textContent = `${p2Count}/11 câu`;
    tabStat2.classList.toggle('status-done', p2Count >= 11);
  }
  if (tabStat3) {
    if (total >= 21) {
      tabStat3.innerHTML = `<i class="fa-solid fa-check"></i> Đã hoàn thành`;
      tabStat3.classList.add('status-done');
    } else {
      tabStat3.textContent = `Chưa xong (${total}/21)`;
      tabStat3.classList.remove('status-done');
    }
  }

  const lblEl = document.getElementById('survey-progress-lbl');
  const statEl = document.getElementById('survey-progress-stat');
  const fillEl = document.getElementById('survey-progress-fill');

  const currStep = window.currentSurveyStep || 1;
  if (lblEl) {
    if (currStep === 1) {
      lblEl.textContent = `Tiến độ Phần 1: Khẩu vị rủi ro (${p1Count}/10 câu đã chọn)`;
    } else if (currStep === 2) {
      lblEl.textContent = `Tiến độ Phần 2: Hoàn cảnh & Trách nhiệm (${p2Count}/11 câu đã chọn)`;
    } else {
      lblEl.textContent = total >= 21 
        ? `Đã hoàn thành toàn bộ 21/21 câu hỏi trắc nghiệm`
        : `Tiến độ tổng hợp: ${total}/21 câu hỏi (Kết quả ước tính sơ bộ)`;
    }
  }

  if (statEl) statEl.textContent = `${total} / 21 câu hỏi (${pct}%)`;
  if (fillEl) fillEl.style.width = `${pct}%`;

  const btn1 = document.getElementById('survey-step-btn-1');
  const btn2 = document.getElementById('survey-step-btn-2');
  const btn3 = document.getElementById('survey-step-btn-3');
  if (btn1) btn1.classList.toggle('completed', p1Count >= 10);
  if (btn2) btn2.classList.toggle('completed', p2Count >= 11);
  if (btn3) btn3.classList.toggle('completed', total >= 21);

  // Cập nhật Banner cảnh báo chưa hoàn thành vs Huy hiệu hoàn thành đầy đủ tại Step 3
  const bannerInc = document.getElementById('survey-incomplete-banner');
  const badgeComp = document.getElementById('survey-complete-badge');
  const missingCountEl = document.getElementById('survey-missing-count');
  const p1RemainEl = document.getElementById('banner-p1-remain');
  const p2RemainEl = document.getElementById('banner-p2-remain');
  const btnBannerP1 = document.getElementById('btn-banner-p1');
  const btnBannerP2 = document.getElementById('btn-banner-p2');

  if (missingCountEl) missingCountEl.textContent = total.toString();
  if (p1RemainEl) p1RemainEl.textContent = `${p1Remaining} câu còn thiếu`;
  if (p2RemainEl) p2RemainEl.textContent = `${p2Remaining} câu còn thiếu`;
  if (btnBannerP1) btnBannerP1.style.display = p1Remaining > 0 ? 'inline-flex' : 'none';
  if (btnBannerP2) btnBannerP2.style.display = p2Remaining > 0 ? 'inline-flex' : 'none';

  if (total >= 21) {
    if (bannerInc) bannerInc.style.display = 'none';
    if (badgeComp) badgeComp.style.display = 'flex';
  } else {
    if (bannerInc) bannerInc.style.display = 'flex';
    if (badgeComp) badgeComp.style.display = 'none';
  }
};

window.selectGoogleFormOption = function(part, qNum, optIdx) {
  if (part === 1) {
    AppState.surveyP1Choices[qNum] = optIdx;
  } else {
    AppState.surveyP2Choices[qNum] = optIdx;
  }
  renderGoogleFormSurvey();
  evaluateSurveys();
  window.updateSurveyProgress();
  setTimeout(renderSurveyQuestionCharts, 40);
};

let miniCharts = {};
function renderSurveyQuestionCharts() {
  if (typeof Chart === 'undefined') return;

  const themeTokens = typeof window.getChartThemeTokens === 'function' ? window.getChartThemeTokens() : {
    text: '#292747', textMuted: '#8582A3', grid: '#E8E5F7', border: '#ffffff', planBar: '#E8E5F7'
  };

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
          backgroundColor: data.map(v => v >= 0 ? '#159F87' : '#F06E78'),
          borderRadius: 2,
          barPercentage: 0.8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { enabled: true } },
        scales: {
          x: { display: true, ticks: { font: { family: 'Inter', size: 7 }, color: themeTokens.textMuted }, grid: { display: false } },
          y: { min: -25, max: 50, ticks: { font: { family: 'Inter', size: 7 }, stepSize: 20, color: themeTokens.textMuted }, grid: { color: themeTokens.grid } }
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
  let count1 = 0;
  surveyQuestionsPart1.forEach((q, idx) => {
    const qNum = idx + 1;
    const choiceIdx = AppState.surveyP1Choices[qNum];
    if (choiceIdx !== undefined && q.weights[choiceIdx] !== undefined) {
      s1 += q.weights[choiceIdx];
      count1++;
    }
  });

  let rTxt = "";
  let riskTitle = "Chưa đánh giá";
  if (count1 === 0) {
    rTxt = "Chưa có dữ liệu khảo sát. Vui lòng thực hiện Phần 1 để xác định khả năng chịu đựng rủi ro.";
    riskTitle = "Chưa đánh giá";
  } else if (s1 <= 20) {
    rTxt = "Bạn là người ngại rủi ro, bạn nên duy trì các tài sản rủi ro tại mức thấp.";
    riskTitle = "Thận trọng (Ngại rủi ro)";
  } else if (s1 <= 29) {
    rTxt = "Bạn là người trung lập với rủi ro, bạn nên duy trì các tài sản rủi ro tại mức trung bình.";
    riskTitle = "Cân bằng (Trung lập rủi ro)";
  } else {
    rTxt = "Bạn là người chấp nhận rủi ro, bạn có thể gia tăng tỷ trọng các tài sản có mức độ rủi ro cao.";
    riskTitle = "Tăng trưởng (Chấp nhận rủi ro)";
  }

  const p1ResEl = document.getElementById('survey-result-p1-text');
  const risk1 = document.getElementById('survey-result-risk');
  if (p1ResEl) p1ResEl.innerHTML = `<strong>Khả năng chịu đựng rủi ro:</strong> ${rTxt}`;
  if (risk1) risk1.textContent = count1 === 0 ? rTxt : `Kết quả khảo sát khả năng chịu đựng rủi ro: ${rTxt}`;

  let s2 = 0;
  let count2 = 0;
  surveyQuestionsPart2.forEach((q, idx) => {
    const qNum = idx + 1;
    const choiceIdx = AppState.surveyP2Choices[qNum];
    if (choiceIdx !== undefined && q.weights[choiceIdx] !== undefined) {
      s2 += q.weights[choiceIdx];
      count2++;
    }
  });

  let cTxt = "";
  let circumstanceTitle = "Chưa đánh giá";
  if (count2 === 0) {
    cTxt = "Chưa có dữ liệu khảo sát. Vui lòng thực hiện Phần 2 để đánh giá hoàn cảnh tài chính.";
    circumstanceTitle = "Chưa đánh giá";
  } else if (s2 <= 21) {
    cTxt = "Bạn trong điều kiện không thuận lợi để phát triển tài chính của bạn trong dài hạn.";
    circumstanceTitle = "Không thuận lợi";
  } else if (s2 <= 30) {
    cTxt = "Bạn trong điều kiện ít thuận lợi để phát triển tài chính của bạn trong dài hạn.";
    circumstanceTitle = "Ít thuận lợi";
  } else if (s2 <= 39) {
    cTxt = "Bạn trong điều kiện bình thường để phát triển tài chính của bạn trong dài hạn.";
    circumstanceTitle = "Bình thường";
  } else if (s2 <= 48) {
    cTxt = "Bạn trong điều kiện thuận lợi để phát triển tài chính của bạn trong dài hạn.";
    circumstanceTitle = "Thuận lợi";
  } else {
    cTxt = "Bạn trong điều kiện cực kỳ thuận lợi để phát triển tài chính của bạn trong dài hạn.";
    circumstanceTitle = "Cực kỳ thuận lợi";
  }

  const p2ResEl = document.getElementById('survey-result-p2-text');
  const ctx2 = document.getElementById('survey-result-context');
  if (p2ResEl) p2ResEl.innerHTML = `<strong>Hoàn cảnh & Môi trường:</strong> ${cTxt}`;
  if (ctx2) ctx2.textContent = count2 === 0 ? cTxt : `Kết quả khảo sát hoàn cảnh: ${cTxt}`;

  // Cập nhật thẻ tổng hợp khuyến nghị Step 3
  const sumRiskTitle = document.getElementById('survey-summary-risk-title');
  const sumRiskDesc = document.getElementById('survey-summary-risk-desc');
  const sumCircTitle = document.getElementById('survey-summary-circumstance-title');
  const sumCircDesc = document.getElementById('survey-summary-circumstance-desc');

  if (sumRiskTitle) sumRiskTitle.textContent = riskTitle;
  if (sumRiskDesc) sumRiskDesc.textContent = rTxt;
  if (sumCircTitle) sumCircTitle.textContent = circumstanceTitle;
  if (sumCircDesc) sumCircDesc.textContent = cTxt;

  // Cập nhật thanh kết quả trực quan chuẩn theo thang điểm tối đa (P1: 43 điểm, P2: 54 điểm)
  const bar1 = document.getElementById('survey-result-bar-1');
  const bar2 = document.getElementById('survey-result-bar-2');
  if (bar1) bar1.style.width = count1 === 0 ? '0%' : `${Math.min(100, Math.round((s1 / 43) * 100))}%`;
  if (bar2) bar2.style.width = count2 === 0 ? '0%' : `${Math.min(100, Math.round((s2 / 54) * 100))}%`;
}

// ==================== BẢNG NHẬP LIỆU MỤC TIÊU BẢN THÂN ====================
function renderTcGoalsFormTable() {
  const tb = document.getElementById('tbody-tc-form-goals');
  if (!tb) return;

  tb.innerHTML = AppState.tcGoals.map((g, idx) => {
    g.monthly = calculateMonthlyNeed(g);
    return `
      <tr>
        <td>
          <input type="text" class="cell-blue font-bold" value="${g.name}" 
                 placeholder="VD: Mua nhà, Cho con học..."
                 oninput="onGoalFieldInput(${idx}, 'name', this.value)"
                 onchange="onGoalFieldChange(${idx}, 'name', this.value)">
        </td>
        <td>
          <select class="select-inline-cell" onchange="onGoalFieldChange(${idx}, 'type', this.value)">
            <option value="debt" ${g.type === 'debt' ? 'selected' : ''}>Khoản nợ phải trả</option>
            <option value="invest" ${g.type === 'invest' ? 'selected' : ''}>Tích lũy & Đầu tư</option>
          </select>
        </td>
        <td>
          <input type="number" step="any" class="text-right font-mono" value="${g.val}" 
                 placeholder="0"
                 oninput="onGoalFieldInput(${idx}, 'val', parseFloat(this.value)||0)"
                 onchange="onGoalFieldChange(${idx}, 'val', parseFloat(this.value)||0)">
        </td>
        <td>
          <input type="number" step="any" class="text-right font-mono" value="${g.paid || 0}" 
                 placeholder="0"
                 oninput="onGoalFieldInput(${idx}, 'paid', parseFloat(this.value)||0)"
                 onchange="onGoalFieldChange(${idx}, 'paid', parseFloat(this.value)||0)">
        </td>
        <td>
          <input type="number" class="text-center font-mono" value="${g.start}" 
                 oninput="onGoalFieldInput(${idx}, 'start', parseInt(this.value, 10)||${AppState.currentYear || 2026})"
                 onchange="onGoalFieldChange(${idx}, 'start', parseInt(this.value, 10)||${AppState.currentYear || 2026})">
        </td>
        <td>
          <input type="number" class="text-center font-mono" value="${g.end}" 
                 oninput="onGoalFieldInput(${idx}, 'end', parseInt(this.value, 10)||${(AppState.currentYear || 2026) + 4})"
                 onchange="onGoalFieldChange(${idx}, 'end', parseInt(this.value, 10)||${(AppState.currentYear || 2026) + 4})">
        </td>
        <td>
          <input type="number" step="any" class="text-right font-mono" value="${g.inflation || 0}" 
                 ${g.type === 'debt' ? 'disabled style="background:#f8fafc; cursor:not-allowed;"' : ''} 
                 oninput="onGoalFieldInput(${idx}, 'inflation', parseFloat(this.value)||0)"
                 onchange="onGoalFieldChange(${idx}, 'inflation', parseFloat(this.value)||0)">
        </td>
        <td>
          <input type="number" step="any" class="text-right font-mono" value="${g.rate || 0}" 
                 oninput="onGoalFieldInput(${idx}, 'rate', parseFloat(this.value)||0)"
                 onchange="onGoalFieldChange(${idx}, 'rate', parseFloat(this.value)||0)">
        </td>
        <td class="text-right font-bold text-success font-mono" id="tc-goal-monthly-${idx}">${g.monthly.toFixed(2)} tr</td>
        <td class="text-center">
          <button type="button" class="btn-table-del" title="Xóa mục tiêu" onclick="deleteTcGoalRow(${idx})">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

window.onGoalFieldInput = function(idx, field, val) {
  if (!AppState.tcGoals[idx]) return;
  AppState.tcGoals[idx][field] = val;
  AppState.tcGoals[idx].monthly = calculateMonthlyNeed(AppState.tcGoals[idx]);
  
  const mCell = document.getElementById(`tc-goal-monthly-${idx}`);
  if (mCell) mCell.textContent = `${AppState.tcGoals[idx].monthly.toFixed(2)} tr`;

  syncDebtGoalToOverallData();
  syncGoalsToCards();
  renderTcMatrixTable();
  recalculateAll();
};

window.onGoalFieldChange = function(idx, field, val) {
  if (!AppState.tcGoals[idx]) return;
  AppState.tcGoals[idx][field] = val;
  AppState.tcGoals[idx].monthly = calculateMonthlyNeed(AppState.tcGoals[idx]);
  
  syncDebtGoalToOverallData();
  renderTcGoalsFormTable();
  syncGoalsToCards();
  renderTcMatrixTable();
  recalculateAll();
};

window.addNewTcGoalRow = function() {
  const defaultAvgRate = (typeof getAvgInvestReturnRate === 'function' ? getAvgInvestReturnRate() : 8.0) || 8.0;
  const defaultProds = (AppState.investProducts && AppState.investProducts.length > 0)
    ? AppState.investProducts.slice(0, 3).map((p, idx) => ({
        prodName: p.name,
        weight: idx === 0 ? 50.0 : (idx === 1 ? 50.0 : 0.0),
        returnRate: p.returnRate,
        risk: p.risk
      }))
    : [];

  const newGoal = { 
    id: `g_${Date.now()}`, 
    name: "Mục tiêu mới", 
    type: "invest", 
    val: 0.0, 
    paid: 0.0, 
    start: AppState.currentYear || 2026, 
    end: (AppState.currentYear || 2026) + 4, 
    inflation: 4.0, 
    rate: defaultAvgRate, 
    monthly: 0,
    yearsRetire: 0, 
    monthlyRetire: 0, 
    deathFund: 0,
    allocProducts: defaultProds
  };
  newGoal.monthly = calculateMonthlyNeed(newGoal);

  AppState.tcGoals.push(newGoal);

  renderTcGoalsFormTable();
  syncGoalsToCards();
  renderTcMatrixTable();
  recalculateAll();
};

window.deleteTcGoalRow = function(idx) {
  AppState.tcGoals.splice(idx, 1);
  syncDebtGoalToOverallData();
  renderTcGoalsFormTable();
  syncGoalsToCards();
  renderTcMatrixTable();
  recalculateAll();
};

function syncDebtGoalToOverallData() {
  const debtGoals = (AppState.tcGoals || []).filter(g => g.type === 'debt');
  const totalMonthlyDebtNeed = debtGoals.reduce((sum, g) => sum + (g.monthly || calculateMonthlyNeed(g)), 0);

  let debtPlanItem = AppState.planExpense.find(p => p.name === "Chi tiền trả nợ");
  if (totalMonthlyDebtNeed > 0) {
    if (!debtPlanItem) {
      if (!AppState.expenses.includes("Chi tiền trả nợ")) {
        AppState.expenses.push("Chi tiền trả nợ");
        renderSetupTables();
      }
      debtPlanItem = { name: "Chi tiền trả nợ", plan: parseFloat(totalMonthlyDebtNeed.toFixed(2)), note: "Tự động đồng bộ từ Mục tiêu trả nợ" };
      AppState.planExpense.push(debtPlanItem);
    } else {
      debtPlanItem.plan = parseFloat(totalMonthlyDebtNeed.toFixed(2));
      debtPlanItem.note = "Tự động đồng bộ từ Mục tiêu trả nợ";
    }
    renderPlanTables();
  } else if (debtPlanItem && debtPlanItem.note === "Tự động đồng bộ từ Mục tiêu trả nợ") {
    debtPlanItem.plan = 0;
    renderPlanTables();
  }
}

// ==================== ĐỒNG BỘ SANG THẺ MỤC TIÊU TÀI CHÍNH ====================
function syncGoalsToCards() {
  const dWrap = document.getElementById('tc-debt-cards-container');
  const iWrap = document.getElementById('tc-invest-cards-container');
  const colDebt = document.querySelector('.tc-col-debt');
  const colInvest = document.querySelector('.tc-col-invest');
  const grid = document.getElementById('tc-two-columns-grid') || document.querySelector('.tc-two-columns-grid');
  const emptyState = document.getElementById('tc-empty-state');

  // Kiểm tra tính hợp lệ của mục tiêu (phải có tên hoặc có giá trị/khoản tích lũy)
  const isValidGoal = (g) => g && typeof g === 'object' && ((g.name && g.name.trim() !== '') || Number(g.val) > 0 || Number(g.monthly) > 0);

  const allGoals = Array.isArray(AppState.tcGoals) ? AppState.tcGoals : [];
  const debts = allGoals.filter(g => g.type === 'debt' && isValidGoal(g));
  const invests = allGoals.filter(g => g.type === 'invest' && isValidGoal(g));

  const hasDebts = debts.length > 0;
  const hasInvests = invests.length > 0;

  // 1. Tự động ẩn/hiện cột Trả nợ định kỳ
  if (colDebt) {
    if (hasDebts) {
      colDebt.style.display = '';
      if (dWrap) dWrap.innerHTML = debts.map((g, i) => createCardHtmlDebt(g, i + 1)).join('');
    } else {
      colDebt.style.display = 'none';
      if (dWrap) dWrap.innerHTML = '';
    }
  }

  // 2. Tự động ẩn/hiện cột Tích lũy & Đầu tư
  if (colInvest) {
    if (hasInvests) {
      colInvest.style.display = '';
      if (iWrap) iWrap.innerHTML = invests.map((g, i) => createCardHtmlInvest(g, i + 1)).join('');
    } else {
      colInvest.style.display = 'none';
      if (iWrap) iWrap.innerHTML = '';
    }
  }

  // 3. Tự động co giãn bố cục: nếu 1 cột ẩn thì cột còn lại chiếm trọn chiều rộng (1fr); nếu cả 2 trống thì hiện empty state
  if (grid) {
    if (hasDebts && hasInvests) {
      grid.style.display = 'grid';
      grid.classList.remove('tc-single-col');
      if (emptyState) emptyState.style.display = 'none';
    } else if (hasDebts || hasInvests) {
      grid.style.display = 'grid';
      grid.classList.add('tc-single-col');
      if (emptyState) emptyState.style.display = 'none';
    } else {
      // Cả 2 danh mục đều không có dữ liệu: ẩn grid và hiển thị thông báo trạng thái trống
      grid.style.display = 'none';
      if (emptyState) emptyState.style.display = 'flex';
    }
  }
}

function createCardHtmlDebt(g, num) {
  const nYears = Math.max(1, g.end - g.start + 1);
  const targetNeed = Math.max(0, g.val - (g.paid || 0));
  const mVal = g.monthly || calculateMonthlyNeed(g);

  return `
    <div class="tc-goal-card-h4" id="card-${g.id}">
      <div class="tc-card-h4-title">
        <span>Khoản nợ ${num}: <strong contenteditable="true" spellcheck="false" onblur="updateGoalCardField('${g.id}', 'name', this.innerText)">${g.name || 'Khoản nợ'}</strong></span>
        <button class="btn-table-del" onclick="removeGoalFromCard('${g.id}')"><i class="fa-solid fa-trash-can"></i></button>
      </div>
      <div class="tc-card-table-scroll">
        <table class="tc-card-h4-table">
          <tbody>
            <tr>
              <td style="width: 32%;">Năm bắt đầu</td>
              <td class="cell-green-val font-mono" style="width: 18%;" contenteditable="true" spellcheck="false" onblur="updateGoalCardField('${g.id}', 'start', this.innerText)">${g.start}</td>
              <td class="bg-col-head" style="width: 32%;">Thời gian trả nợ</td>
              <td class="text-right font-bold font-mono" style="width: 18%;">${nYears.toFixed(0)} năm</td>
            </tr>
            <tr>
              <td>Năm tất toán</td>
              <td class="cell-green-val font-mono" contenteditable="true" spellcheck="false" onblur="updateGoalCardField('${g.id}', 'end', this.innerText)">${g.end}</td>
              <td class="bg-col-head">Khoản nợ còn lại</td>
              <td class="text-right font-bold text-danger font-mono" contenteditable="true" spellcheck="false" onblur="updateGoalCardField('${g.id}', 'val', this.innerText)">${targetNeed.toFixed(1)} tr</td>
            </tr>
            <tr>
              <td>Lãi suất vay</td>
              <td class="cell-green-val font-mono" contenteditable="true" spellcheck="false" onblur="updateGoalCardField('${g.id}', 'rate', this.innerText)">${g.rate.toFixed(1)}%/năm</td>
              <td class="bg-col-head">Cần trả mỗi tháng</td>
              <td class="cell-orange-val font-mono">${mVal.toFixed(1)} tr</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function createCardHtmlInvest(g, num) {
  const nYears = Math.max(1, g.end - g.start + 1);
  const targetNeed = Math.max(0, g.val - (g.paid || 0));
  const mVal = g.monthly || calculateMonthlyNeed(g);
  const yVal = mVal * 12;

  if (!g.allocProducts || g.allocProducts.length === 0) {
    g.allocProducts = [
      { prodName: AppState.investProducts[0]?.name || "ETF - ETFVFM", weight: 50.0, returnRate: AppState.investProducts[0]?.returnRate || 13.0, risk: AppState.investProducts[0]?.risk || 18.0 },
      { prodName: AppState.investProducts[1]?.name || "DCBC", weight: 50.0, returnRate: AppState.investProducts[1]?.returnRate || 16.0, risk: AppState.investProducts[1]?.risk || 20.0 },
      { prodName: AppState.investProducts[2]?.name || "Tiền gửi ngân hàng", weight: 0.0, returnRate: AppState.investProducts[2]?.returnRate || 5.0, risk: AppState.investProducts[2]?.risk || 2.0 }
    ];
  }

  g.allocProducts.forEach(ap => {
    const matched = AppState.investProducts.find(ip => ip.name === ap.prodName);
    if (matched) {
      ap.returnRate = matched.returnRate;
      ap.risk = matched.risk;
    }
  });

  const prods = g.allocProducts;
  let expectedAvgReturn = 0;
  prods.forEach(p => { expectedAvgReturn += ((p.weight || 0) / 100) * (p.returnRate || 0); });

  const renderProductSelect = (pIndex) => {
    const curP = prods[pIndex] || { prodName: '', weight: 0, returnRate: 0, risk: 0 };
    const availableProducts = (AppState.investProducts && AppState.investProducts.length > 0)
      ? AppState.investProducts
      : [
          { name: curP.prodName || "ETF - ETFVFM" },
          { name: "DCBC" },
          { name: "Tiền gửi ngân hàng" }
        ];
    return `
      <select class="select-inline-cell" onchange="updateGoalInvestProduct('${g.id}', ${pIndex}, this.value)">
        ${availableProducts.map(ip => `<option value="${escapeHtml(ip.name)}" ${ip.name === curP.prodName ? 'selected' : ''}>${escapeHtml(ip.name)}</option>`).join('')}
      </select>
    `;
  };

  return `
    <div class="tc-goal-card-h4" id="card-${g.id}">
      <div class="tc-card-h4-title">
        <span>Mục tiêu đầu tư ${num}: <strong contenteditable="true" spellcheck="false" onblur="updateGoalCardField('${g.id}', 'name', this.innerText)">${g.name || 'Mục tiêu'}</strong></span>
        <button class="btn-table-del" onclick="removeGoalFromCard('${g.id}')"><i class="fa-solid fa-trash-can"></i></button>
      </div>
      <div class="tc-card-table-scroll">
        <table class="tc-card-h4-table">
          <thead>
            <tr class="bg-header-sub">
              <th colspan="2" style="width: 30%;">Thông số thời gian</th>
              <th colspan="2" style="width: 30%;">Số tiền tích lũy</th>
              <th colspan="4" style="width: 40%;">Phân bổ kênh đầu tư</th>
            </tr>
            <tr class="bg-col-head">
              <th>Chỉ tiêu</th><th style="width: 50px;">Năm</th>
              <th>Chỉ tiêu</th><th style="width: 60px;">Số tiền</th>
              <th>Kênh đầu tư</th><th style="width: 50px;">Tỷ trọng</th><th style="width: 45px;">Lãi</th><th style="width: 45px;">Rủi ro</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Năm bắt đầu</td>
              <td class="cell-green-val font-mono" contenteditable="true" spellcheck="false" onblur="updateGoalCardField('${g.id}', 'start', this.innerText)">${g.start}</td>
              <td>Cần gom</td>
              <td class="cell-orange-val font-mono" contenteditable="true" spellcheck="false" onblur="updateGoalCardField('${g.id}', 'val', this.innerText)">${targetNeed.toFixed(0)} tr</td>
              <td>${renderProductSelect(0)}</td>
              <td class="cell-green-val font-mono" contenteditable="true" spellcheck="false" onblur="updateGoalProdWeight('${g.id}', 0, this.innerText)">${(prods[0]?.weight || 0).toFixed(1)}%</td>
              <td class="text-right font-mono">${(prods[0]?.returnRate || 0).toFixed(1)}%</td>
              <td class="text-right font-mono">${(prods[0]?.risk || 0).toFixed(1)}%</td>
            </tr>
            <tr>
              <td>Năm kết thúc</td>
              <td class="cell-green-val font-mono" contenteditable="true" spellcheck="false" onblur="updateGoalCardField('${g.id}', 'end', this.innerText)">${g.end}</td>
              <td class="font-bold">Số năm gom</td>
              <td class="text-right font-bold font-mono">${nYears.toFixed(0)} năm</td>
              <td>${renderProductSelect(1)}</td>
              <td class="cell-green-val font-mono" contenteditable="true" spellcheck="false" onblur="updateGoalProdWeight('${g.id}', 1, this.innerText)">${(prods[1]?.weight || 0).toFixed(1)}%</td>
              <td class="text-right font-mono">${(prods[1]?.returnRate || 0).toFixed(1)}%</td>
              <td class="text-right font-mono">${(prods[1]?.risk || 0).toFixed(1)}%</td>
            </tr>
            <tr>
              <td>Năm sau hưu</td>
              <td class="cell-green-val font-mono" contenteditable="true" spellcheck="false" onblur="updateGoalCardField('${g.id}', 'yearsRetire', this.innerText)">${g.yearsRetire ? `${g.yearsRetire} năm` : '-'}</td>
              <td class="font-bold">Cần / tháng</td>
              <td class="cell-orange-val font-mono">${mVal.toFixed(1)} tr</td>
              <td>${renderProductSelect(2)}</td>
              <td class="cell-green-val font-mono" contenteditable="true" spellcheck="false" onblur="updateGoalProdWeight('${g.id}', 2, this.innerText)">${(prods[2]?.weight || 0).toFixed(1)}%</td>
              <td class="text-right font-mono">${(prods[2]?.returnRate || 0).toFixed(1)}%</td>
              <td class="text-right font-mono">${(prods[2]?.risk || 0).toFixed(1)}%</td>
            </tr>
            <tr>
              <td>Tiêu sau hưu</td>
              <td class="cell-green-val font-mono" contenteditable="true" spellcheck="false" onblur="updateGoalCardField('${g.id}', 'monthlyRetire', this.innerText)">${g.monthlyRetire ? `${g.monthlyRetire} tr/th` : '-'}</td>
              <td class="font-bold">Cần / năm</td>
              <td class="cell-orange-val font-mono">${yVal.toFixed(1)} tr</td>
              <td colspan="2" class="font-bold text-center bg-col-head">Lãi trung bình dự kiến</td>
              <td colspan="2" class="cell-gold-val text-center font-mono">${expectedAvgReturn.toFixed(2)}%/năm</td>
            </tr>
            <tr class="bg-neutral-gray font-semibold">
              <td>Để lại cho con:</td>
              <td class="font-bold text-right text-danger font-mono" contenteditable="true" spellcheck="false" onblur="updateGoalCardField('${g.id}', 'deathFund', this.innerText)">${g.deathFund ? `${g.deathFund} tr` : '0 tr'}</td>
              <td style="text-align: right;">Trượt giá:</td>
              <td class="cell-green-val font-mono" contenteditable="true" spellcheck="false" onblur="updateGoalCardField('${g.id}', 'inflation', this.innerText)">${(g.inflation || 0).toFixed(1)}%/năm</td>
              <td colspan="2" style="text-align: right;">Tiền sẵn có:</td>
              <td colspan="2" class="cell-green-val text-center font-bold font-mono" contenteditable="true" spellcheck="false" onblur="updateGoalCardField('${g.id}', 'paid', this.innerText)">${g.paid || 0} tr</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `;
}

window.updateGoalInvestProduct = function(goalId, prodIndex, prodName) {
  const goal = AppState.tcGoals.find(g => g.id === goalId);
  if (!goal) return;

  const matched = AppState.investProducts.find(p => p.name === prodName);
  if (goal.allocProducts[prodIndex]) {
    goal.allocProducts[prodIndex].prodName = prodName;
    if (matched) {
      goal.allocProducts[prodIndex].returnRate = matched.returnRate;
      goal.allocProducts[prodIndex].risk = matched.risk;
    }
  }

  let avgRate = 0;
  goal.allocProducts.forEach(p => { avgRate += ((p.weight || 0) / 100) * (p.returnRate || 0); });
  goal.rate = avgRate;
  goal.monthly = calculateMonthlyNeed(goal);

  syncGoalsToCards();
  renderTcGoalsFormTable();
  renderTcMatrixTable();
  recalculateAll();
};

window.updateGoalProdWeight = function(goalId, prodIndex, textVal) {
  const goal = AppState.tcGoals.find(g => g.id === goalId);
  if (!goal || !goal.allocProducts[prodIndex]) return;

  const w = parseFloat(textVal.replace(/[^0-9.-]/g, '')) || 0;
  goal.allocProducts[prodIndex].weight = w;

  let avgRate = 0;
  goal.allocProducts.forEach(p => { avgRate += ((p.weight || 0) / 100) * (p.returnRate || 0); });
  goal.rate = avgRate;
  goal.monthly = calculateMonthlyNeed(goal);

  syncGoalsToCards();
  renderTcGoalsFormTable();
  renderTcMatrixTable();
  recalculateAll();
};

window.updateGoalCardField = function(goalId, field, rawText) {
  const g = AppState.tcGoals.find(x => x.id === goalId);
  if (!g) return;

  const clean = (typeof rawText === 'string') ? rawText.trim().replace(/[^0-9.-]/g, '') : rawText;
  if (field === 'name') {
    g.name = (typeof rawText === 'string' ? rawText.trim() : '') || 'Mục tiêu';
  } else if (field === 'start' || field === 'end') {
    g[field] = parseInt(clean, 10) || AppState.currentYear;
  } else {
    g[field] = parseFloat(clean) || 0;
  }
  g.monthly = calculateMonthlyNeed(g);

  syncDebtGoalToOverallData();
  renderTcGoalsFormTable();
  syncGoalsToCards();
  renderTcMatrixTable();
  recalculateAll();
};

window.removeGoalFromCard = function(id) {
  AppState.tcGoals = AppState.tcGoals.filter(x => x.id !== id);
  syncDebtGoalToOverallData();
  syncGoalsToCards();
  renderTcGoalsFormTable();
  renderTcMatrixTable();
  recalculateAll();
};

// ==================== MA TRẬN NHU CẦU TIẾT KIỆM VÀ THU NHẬP ====================
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
    ${debts.map((g, i) => `<th style="min-width: 95px;">Nợ ${i + 1}:<br><span style="font-weight: 500;">${g.name}</span></th>`).join('')}
    ${invests.map((g, i) => `<th style="min-width: 95px;">Đầu tư ${i + 1}:<br><span style="font-weight: 500;">${g.name}</span></th>`).join('')}
    <th style="min-width: 90px;" class="col-highlight-gold">Tiết kiệm cần / tháng</th>
    <th style="min-width: 95px;" class="col-highlight-orange">Thu nhập cần có / tháng</th>
  `;

  const startY = AppState.currentYear;
  const startA = AppState.currentAge;
  const rate = (typeof getEffectiveSavingsRateRatio === 'function') ? getEffectiveSavingsRateRatio() : 0.40;

  let rows = '';
  for (let y = 0; y <= 32; y++) {
    const yr = startY + y;
    const age = startA + y;
    let sSum = 0;

    const cells = all.map(g => {
      const active = yr >= g.start && yr <= g.end;
      const val = active ? (g.monthly !== undefined ? g.monthly : calculateMonthlyNeed(g)) : 0;
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

    if (AppState.matrixOverrides && AppState.matrixOverrides[y] !== undefined) {
      sSum = Number(AppState.matrixOverrides[y]) || 0;
    }

    const incNeed = sSum > 0 ? (sSum / rate) : 0;
    rows += `
      <tr id="mtr-row-${y}">
        <td class="text-center font-bold font-mono bg-neutral-gray">${yr}</td>
        <td class="text-center font-bold font-mono bg-neutral-gray">${age}</td>
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

  if (!AppState.matrixOverrides) AppState.matrixOverrides = {};
  AppState.matrixOverrides[rIdx] = rSum;

  const rate = (typeof getEffectiveSavingsRateRatio === 'function') ? getEffectiveSavingsRateRatio() : 0.40;
  const inc = rSum > 0 ? (rSum / rate) : 0;
  const savCell = document.getElementById(`mtr-sav-${rIdx}`);
  const incCell = document.getElementById(`mtr-inc-${rIdx}`);
  if (savCell) savCell.textContent = rSum > 0 ? rSum.toFixed(1) : '-';
  if (incCell) incCell.textContent = inc > 0 ? inc.toFixed(1) : '-';
  updateMatrixChartData();
  
  renderCareerTables();
  renderCareerChart();
};

window.formatMatrixCell = function(td, rIdx) {
  const v = parseFloat(td.innerText.trim().replace(/[^0-9.-]/g, ''));
  td.textContent = (!isNaN(v) && v > 0) ? v.toFixed(1) : '';
  window.onMatrixCellChange(td, rIdx);
};

window.tcMatrixChartInstance = null;
function renderTcMatrixChart() {
  const canvas = document.getElementById('tcMatrixChart');
  if (!canvas || typeof Chart === 'undefined') return;

  const themeTokens = typeof window.getChartThemeTokens === 'function' ? window.getChartThemeTokens() : {
    text: '#292747', textMuted: '#8582A3', grid: '#E8E5F7', border: '#ffffff', planBar: '#E8E5F7'
  };

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

  if (window.tcMatrixChartInstance) window.tcMatrixChartInstance.destroy();
  window.tcMatrixChartInstance = new Chart(canvas.getContext('2d'), {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        { label: "Thu nhập cần có (tr/tháng)", data: incData, borderColor: "#6258F5", backgroundColor: "rgba(98, 88, 245, 0.1)", borderWidth: 2.5, fill: true, tension: 0.25 },
        { label: "Tiết kiệm cần có (tr/tháng)", data: savData, borderColor: "#31CDB1", backgroundColor: "rgba(49, 205, 177, 0.12)", borderWidth: 2.5, fill: true, tension: 0.25 }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'top', labels: { font: { family: 'Inter', size: 11, weight: '600' }, color: themeTokens.text } } },
      scales: {
        y: { beginAtZero: true, grid: { color: themeTokens.grid }, ticks: { font: { family: 'Inter', size: 10 }, color: themeTokens.textMuted } },
        x: { grid: { display: false }, ticks: { font: { family: 'Inter', size: 10 }, color: themeTokens.textMuted } }
      }
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

// ==================== PHẦN KỸ NĂNG & HOÀN CẢNH ====================
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
window.addFamilyRow = function() { AppState.familyList.push("Nguồn hỗ trợ mới"); renderSkillsFamilyJob(); };
window.addJobRow = function() { AppState.jobList.push("Môi trường làm việc mới"); renderSkillsFamilyJob(); };

// ==================== KHỞI CHẠY HỆ THỐNG ====================
function recalculateAll() {
  let totalIncYear = 0, totalExpYear = 0;
  for (let m = 1; m <= 12; m++) {
    totalIncYear += (AppState.monthlyDetails[m]?.incomes || []).reduce((s, x) => s + (Number(x.val) || 0), 0);
    totalExpYear += (AppState.monthlyDetails[m]?.expenses || []).reduce((s, x) => s + (Number(x.val) || 0), 0);
  }
  const yearSav = totalIncYear - totalExpYear;

  const kpiInc = document.getElementById('kpi-dash-income');
  const kpiExp = document.getElementById('kpi-dash-expense');
  const kpiSav = document.getElementById('kpi-dash-savings');

  const fmtKpi = (v) => Number.isInteger(v) ? String(v) : v.toFixed(1);

  if (kpiInc) kpiInc.textContent = fmtKpi(totalIncYear);
  if (kpiExp) kpiExp.textContent = fmtKpi(totalExpYear);
  if (kpiSav) kpiSav.textContent = fmtKpi(yearSav);

  renderCareerTables();
  renderCareerChart();
  renderDashboardMatrices();
  renderDashboardAllCharts();
  updatePlanTotals();
}

// ==================== TÍCH HỢP FIREBASE DATA FLOW ĐA NGƯỜI DÙNG ====================

function updateCloudStatus(status, text) {
  const badge = document.getElementById('cloud-status-badge');
  const txt = document.getElementById('cloud-status-text');
  if (!badge || !txt) return;

  badge.className = `cloud-badge cloud-${status}`;
  txt.textContent = text;
}

function showToast(message, type = 'success') {
  let toast = document.getElementById('cloud-floating-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'cloud-floating-toast';
    toast.className = 'cloud-toast';
    document.body.appendChild(toast);
  }

  toast.className = `cloud-toast toast-${type} show`;
  toast.innerHTML = `<i class="fa-solid ${type === 'success' ? 'fa-circle-check' : 'fa-circle-exclamation'}"></i> <span>${message}</span>`;

  setTimeout(() => {
    toast.classList.remove('show');
  }, 3200);
}

/**
 * GHI DỮ LIỆU: Lưu AppState vào Document ID riêng biệt của người dùng
 */
window.saveAppStateToCloud = async function() {
  if (!window.CloudDB) {
    showToast("Dịch vụ lưu trữ chưa sẵn sàng. Vui lòng kiểm tra lại kết nối mạng!", "error");
    return;
  }

  if (!UserSession.currentUser) {
    showToast("Vui lòng xác nhận danh tính trước khi lưu dữ liệu!", "error");
    openUserModal(false);
    return;
  }

  const btnSave = document.getElementById('btn-cloud-save');
  if (btnSave) {
    btnSave.disabled = true;
    btnSave.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> <span>Đang lưu...</span>`;
  }
  updateCloudStatus('loading', 'Đang lưu dữ liệu...');

  const userDocId = UserSession.currentUser.docId;
  const result = await window.CloudDB.saveData(AppState, userDocId, UserSession.currentUser);

  if (btnSave) {
    btnSave.disabled = false;
    btnSave.innerHTML = `<i class="fa-solid fa-cloud-arrow-up"></i> <span>Lưu</span>`;
  }

  if (result.success) {
    window.hasUnsavedChanges = false;
    window.hasSavedInSession = true;
    updateCloudStatus('ready', 'Đã lưu lúc ' + new Date().toLocaleTimeString('vi-VN'));
    const bkName = result.newBackup?.name || 'Bản sao lưu mới';
    showToast(`Đã lưu thành công [${bkName}] của hồ sơ [${UserSession.currentUser.rawName}]!`, "success");
    
    // Nếu modal Quản lý sao lưu đang mở, làm mới danh sách ngay lập tức
    const backupModal = document.getElementById('backup-modal-overlay');
    if (backupModal && backupModal.classList.contains('active')) {
      if (Array.isArray(result.backups)) {
        currentLoadedBackups = result.backups;
        window.filterAndSortBackups();
      }
    }
    return true;
  } else {
    updateCloudStatus('error', 'Lỗi khi lưu!');
    showToast("Lỗi: " + (result.error?.message || "Không thể lưu dữ liệu"), "error");
    return false;
  }
};

/**
 * ĐỌC DỮ LIỆU: Nạp dữ liệu từ Document ID của người dùng hiện tại
 * Khi người dùng bấm nút: Mở modal Quản lý bản sao lưu (Nhập dữ liệu)
 */
window.loadAppStateFromCloud = async function(isInitialLoad = false) {
  if (!window.CloudDB || !UserSession.currentUser) return;

  // Người dùng chủ động bấm "Nhập dữ liệu" -> Mở hộp thoại chọn bản sao lưu
  if (!isInitialLoad) {
    window.openBackupManagerModal();
    return;
  }

  const btnLoad = document.getElementById('btn-cloud-load');
  if (btnLoad) {
    btnLoad.disabled = true;
    btnLoad.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> <span>Đang nạp...</span>`;
  }
  updateCloudStatus('loading', 'Đang nạp dữ liệu...');

  const userDocId = UserSession.currentUser.docId;
  const result = await window.CloudDB.loadData(userDocId);

  if (btnLoad) {
    btnLoad.disabled = false;
    btnLoad.innerHTML = `<i class="fa-solid fa-cloud-arrow-down"></i> <span>Nhập dữ liệu</span>`;
  }

  if (result.success && result.data) {
    const cloudData = result.data;

    // Gán dữ liệu đám mây vào AppState (bỏ qua các thuộc tính metadata hệ thống)
    Object.keys(cloudData).forEach(key => {
      if (!key.startsWith('_')) {
        AppState[key] = cloudData[key];
      }
    });

    window.hasUnsavedChanges = false;
    window.hasSavedInSession = true;

    // Đồng bộ lại UI Năm và Tuổi
    const yEl = document.getElementById('input-year');
    const aEl = document.getElementById('input-age');
    if (yEl) yEl.innerText = AppState.currentYear;
    if (aEl) aEl.innerText = AppState.currentAge;
    document.querySelectorAll('.dynamic-year').forEach(el => el.textContent = AppState.currentYear);

    const sRateEl = document.getElementById('target-savings-rate-val');
    if (sRateEl) sRateEl.innerText = `${AppState.targetSavingsRate || 40}%`;
    const vAgeEl = document.getElementById('vision-age-cell');
    if (vAgeEl) vAgeEl.innerText = AppState.visionAge || '';
    const vDescEl = document.getElementById('vision-desc-cell');
    if (vDescEl) vDescEl.innerText = AppState.visionDesc || '';

    // Vẽ lại tất cả các bảng và biểu đồ
    renderSetupTables();
    renderPlanTables();
    renderTcGoalsFormTable();
    renderSkillsFamilyJob();
    renderGoogleFormSurvey();
    evaluateSurveys();
    if (window.updateSurveyProgress) {
      window.updateSurveyProgress();
    }
    renderTcMatrixTable();
    renderCareerTables();
    renderMonthView(AppState.currentMonth);
    syncGoalsToCards();
    recalculateAll();

    updateCloudStatus('ready', 'Đồng bộ lúc ' + new Date().toLocaleTimeString('vi-VN'));
  } else if (result.notFound) {
    updateCloudStatus('ready', 'Hồ sơ mới');
  } else {
    updateCloudStatus('error', 'Lỗi tải dữ liệu');
  }
};

// ==================== QUẢN LÝ CÁC BẢN SAO LƯU & NHẬP DỮ LIỆU ====================

function formatBackupTimestamp(isoString) {
  if (!isoString) return 'Không có thời gian';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return 'Thời gian không xác định';
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${hours}:${minutes} — ${day}/${month}/${year}`;
}

let currentLoadedBackups = [];
let selectedBackupId = null;

window.openBackupManagerModal = async function() {
  if (!UserSession.currentUser) {
    showToast("Vui lòng xác nhận danh tính người dùng trước!", "error");
    openUserModal(false);
    return;
  }

  const modal = document.getElementById('backup-modal-overlay');
  const nameEl = document.getElementById('backup-modal-user-name');
  const slugEl = document.getElementById('backup-modal-user-slug');
  const loadingEl = document.getElementById('backup-loading-state');
  const emptyEl = document.getElementById('backup-empty-state');
  const errorEl = document.getElementById('backup-error-state');
  const listEl = document.getElementById('backup-items-list');
  const previewEl = document.getElementById('backup-preview-card');
  const searchInput = document.getElementById('backup-search-input');

  if (!modal) return;
  modal.classList.add('active');

  if (nameEl) nameEl.textContent = UserSession.currentUser.rawName || 'Người dùng';
  if (slugEl) slugEl.textContent = '@' + (UserSession.currentUser.docId || 'guest');
  if (searchInput) searchInput.value = '';
  if (previewEl) previewEl.style.display = 'none';
  window.cancelRestoreConfirm();

  if (loadingEl) loadingEl.style.display = 'flex';
  if (emptyEl) emptyEl.style.display = 'none';
  if (errorEl) errorEl.style.display = 'none';
  if (listEl) listEl.innerHTML = '';

  try {
    const userDocId = UserSession.currentUser.docId;
    const res = await window.CloudDB.getBackups(userDocId);
    if (loadingEl) loadingEl.style.display = 'none';

    if (res.success && Array.isArray(res.backups)) {
      currentLoadedBackups = res.backups;
      window.filterAndSortBackups();
    } else {
      if (errorEl) {
        errorEl.style.display = 'flex';
        const msg = document.getElementById('backup-error-msg');
        if (msg) msg.textContent = "Không thể tải danh sách sao lưu. Vui lòng thử lại.";
      }
    }
  } catch (err) {
    console.error("Lỗi khi mở modal backup:", err);
    if (loadingEl) loadingEl.style.display = 'none';
    if (errorEl) errorEl.style.display = 'flex';
  }
};

window.closeBackupManagerModal = function() {
  const modal = document.getElementById('backup-modal-overlay');
  if (modal) modal.classList.remove('active');
  selectedBackupId = null;
  window.cancelRestoreConfirm();
};

window.filterAndSortBackups = function() {
  const searchInput = document.getElementById('backup-search-input');
  const sortSelect = document.getElementById('backup-sort-select');
  const query = (searchInput?.value || '').trim().toLowerCase();
  const sortMode = sortSelect?.value || 'newest';

  let filtered = [...currentLoadedBackups];

  if (query) {
    filtered = filtered.filter(b => {
      const name = (b.name || '').toLowerCase();
      const time = formatBackupTimestamp(b.timestamp).toLowerCase();
      const yr = String(b.summary?.year || '');
      return name.includes(query) || time.includes(query) || yr.includes(query);
    });
  }

  if (sortMode === 'newest') {
    filtered.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
  } else if (sortMode === 'oldest') {
    filtered.sort((a, b) => new Date(a.timestamp || 0) - new Date(b.timestamp || 0));
  } else if (sortMode === 'name') {
    filtered.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }

  window.renderBackupList(filtered);
};

window.renderBackupList = function(backups) {
  const listEl = document.getElementById('backup-items-list');
  const emptyEl = document.getElementById('backup-empty-state');
  const previewEl = document.getElementById('backup-preview-card');

  if (!listEl) return;

  if (!backups || backups.length === 0) {
    listEl.innerHTML = '';
    if (emptyEl) emptyEl.style.display = 'flex';
    if (previewEl) previewEl.style.display = 'none';
    return;
  }

  if (emptyEl) emptyEl.style.display = 'none';

  listEl.innerHTML = backups.map(b => {
    const isSelected = (b.id === selectedBackupId);
    const timeStr = formatBackupTimestamp(b.timestamp);
    const yr = b.summary?.year || AppState.currentYear || 2026;
    const goalsCount = b.summary?.goalsCount ?? (b.data?.tcGoals?.length || 0);

    return `
      <div class="backup-item ${isSelected ? 'active-preview' : ''}" onclick="selectBackupForPreview('${b.id}')" role="button" tabindex="0">
        <div class="backup-item-left">
          <div class="backup-item-icon">
            <i class="fa-solid fa-database"></i>
          </div>
          <div class="backup-item-info">
            <div class="backup-item-name">${escapeHtml(b.name || 'Bản sao lưu')}</div>
            <div class="backup-item-time"><i class="fa-regular fa-clock"></i> ${timeStr}</div>
            <div class="backup-item-pills">
              <span class="backup-pill">Năm: ${yr}</span>
              <span class="backup-pill">${goalsCount} mục tiêu</span>
            </div>
          </div>
        </div>
        <div class="backup-item-actions" onclick="event.stopPropagation()">
          <button type="button" class="btn-bk-action btn-bk-select" onclick="openRestoreConfirmModal('${b.id}')" title="Khôi phục bản sao lưu này">
            <i class="fa-solid fa-cloud-arrow-down"></i> Khôi phục
          </button>
          <button type="button" class="btn-bk-action btn-bk-del" onclick="openDeleteConfirmModal('${b.id}')" title="Xóa bản sao lưu này">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </div>
      </div>
    `;
  }).join('');

  if (!selectedBackupId || !backups.find(b => b.id === selectedBackupId)) {
    if (backups.length > 0) {
      window.selectBackupForPreview(backups[0].id);
    }
  }
};

window.selectBackupForPreview = function(backupId) {
  selectedBackupId = backupId;
  const backup = currentLoadedBackups.find(b => b.id === backupId);
  const previewEl = document.getElementById('backup-preview-card');
  if (!previewEl || !backup) return;

  document.querySelectorAll('.backup-item').forEach(el => el.classList.remove('active-preview'));
  const activeItem = document.querySelector(`.backup-item[onclick*="${backupId}"]`);
  if (activeItem) activeItem.classList.add('active-preview');

  const pName = document.getElementById('preview-bk-name');
  const pTime = document.getElementById('preview-bk-time');
  const pYear = document.getElementById('preview-bk-year');
  const pAge = document.getElementById('preview-bk-age');
  const pGoals = document.getElementById('preview-bk-goals');
  const pIncome = document.getElementById('preview-bk-income');
  const cTargetName = document.getElementById('confirm-target-name');

  if (pName) pName.textContent = backup.name || 'Bản sao lưu';
  if (pTime) pTime.textContent = formatBackupTimestamp(backup.timestamp);
  if (pYear) pYear.textContent = backup.summary?.year || backup.data?.currentYear || 2026;
  if (pAge) pAge.textContent = backup.summary?.age || backup.data?.currentAge || 25;
  if (pGoals) pGoals.textContent = `${backup.summary?.goalsCount ?? (backup.data?.tcGoals?.length || 0)} mục tiêu`;
  
  const inc = Number(backup.summary?.planIncomeTotal || 0);
  if (pIncome) pIncome.textContent = `${inc.toLocaleString('vi-VN', { maximumFractionDigits: 1 })} tr/th`;
  if (cTargetName) cTargetName.textContent = `${backup.name} (${formatBackupTimestamp(backup.timestamp)})`;

  previewEl.style.display = 'flex';
  window.cancelRestoreConfirm();
};

// ==================== ĐIỀU KHIỂN HỘP THOẠI XÁC NHẬN (RESTORE & DELETE) ====================
let pendingConfirmAction = null; // { type: 'restore' | 'delete', backupId: string, backup: object }
let isConfirmProcessing = false;

window.openRestoreConfirmModal = function(backupId) {
  const targetId = backupId || selectedBackupId;
  const backup = currentLoadedBackups.find(b => b.id === targetId);
  if (!backup) {
    showToast("Không tìm thấy thông tin bản sao lưu cần khôi phục!", "error");
    return;
  }

  pendingConfirmAction = { type: 'restore', backupId: backup.id, backup: backup };

  const modalOverlay = document.getElementById('confirm-modal-overlay');
  const modalCard = document.getElementById('confirm-modal-card');
  const iconEl = document.getElementById('confirm-modal-icon');
  const titleEl = document.getElementById('confirm-modal-title');
  const subtitleEl = document.getElementById('confirm-modal-subtitle');
  const bkNameEl = document.getElementById('confirm-bk-name');
  const bkTimeEl = document.getElementById('confirm-bk-time');
  const bkUserEl = document.getElementById('confirm-bk-user');
  const bkSummaryEl = document.getElementById('confirm-bk-summary');
  const warningHeading = document.getElementById('confirm-warning-heading');
  const warningText = document.getElementById('confirm-warning-text');
  const statusAlert = document.getElementById('confirm-status-alert');
  const btnAction = document.getElementById('btn-confirm-action');
  const btnActionText = document.getElementById('confirm-action-btn-text');
  const btnCancel = document.getElementById('btn-confirm-cancel');
  const btnClose = document.getElementById('btn-confirm-close');

  if (!modalOverlay) return;

  // Cấu hình giao diện loại RESTORE
  if (modalCard) {
    modalCard.classList.remove('confirm-type-delete');
    modalCard.classList.add('confirm-type-restore');
  }
  if (iconEl) iconEl.className = 'fa-solid fa-cloud-arrow-down';
  if (titleEl) titleEl.textContent = 'Khôi phục bản sao lưu';
  if (subtitleEl) subtitleEl.textContent = 'Dữ liệu hiện tại trên ứng dụng sẽ được thay thế theo bản sao lưu này';

  // Thông tin nhận diện bản sao lưu
  if (bkNameEl) bkNameEl.textContent = backup.name || 'Bản sao lưu';
  if (bkTimeEl) bkTimeEl.textContent = formatBackupTimestamp(backup.timestamp);
  if (bkUserEl) {
    bkUserEl.textContent = UserSession.currentUser
      ? `${UserSession.currentUser.rawName} (@${UserSession.currentUser.docId})`
      : 'Hồ sơ người dùng';
  }
  if (bkSummaryEl) {
    const yr = backup.summary?.year || backup.data?.currentYear || AppState.currentYear || 2026;
    const goalsCount = backup.summary?.goalsCount ?? (backup.data?.tcGoals?.length || 0);
    const inc = Number(backup.summary?.planIncomeTotal || 0);
    bkSummaryEl.textContent = `Năm ${yr} • ${goalsCount} mục tiêu • ${inc > 0 ? inc.toLocaleString('vi-VN') + ' tr/th' : 'Chưa có thu'}`;
  }

  // Cảnh báo ghi đè
  if (warningHeading) warningHeading.textContent = 'Cảnh báo thay thế dữ liệu';
  if (warningText) {
    warningText.textContent = `Toàn bộ dữ liệu tài chính hiện tại trên màn hình sẽ được cập nhật lại theo bản ghi [${backup.name || 'Bản sao lưu'}]. Hệ thống sẽ tự động tạo một bản sao lưu an toàn ngay trước khi khôi phục để bảo vệ phiên làm việc của bạn.`;
  }

  // Trạng thái nút bấm & Banner
  if (statusAlert) statusAlert.style.display = 'none';
  if (btnAction) {
    btnAction.disabled = false;
    btnAction.className = 'btn-modal-submit';
  }
  if (btnActionText) btnActionText.innerHTML = '<i class="fa-solid fa-cloud-arrow-down"></i> Xác nhận khôi phục';
  if (btnCancel) btnCancel.disabled = false;
  if (btnClose) btnClose.disabled = false;

  modalOverlay.style.display = 'flex';
  modalOverlay.classList.add('active');
  if (btnAction) setTimeout(() => btnAction.focus(), 60);
};

window.openDeleteConfirmModal = function(backupId) {
  const targetId = backupId || selectedBackupId;
  const backup = currentLoadedBackups.find(b => b.id === targetId);
  if (!backup) {
    showToast("Không tìm thấy thông tin bản sao lưu cần xóa!", "error");
    return;
  }

  pendingConfirmAction = { type: 'delete', backupId: backup.id, backup: backup };

  const modalOverlay = document.getElementById('confirm-modal-overlay');
  const modalCard = document.getElementById('confirm-modal-card');
  const iconEl = document.getElementById('confirm-modal-icon');
  const titleEl = document.getElementById('confirm-modal-title');
  const subtitleEl = document.getElementById('confirm-modal-subtitle');
  const bkNameEl = document.getElementById('confirm-bk-name');
  const bkTimeEl = document.getElementById('confirm-bk-time');
  const bkUserEl = document.getElementById('confirm-bk-user');
  const bkSummaryEl = document.getElementById('confirm-bk-summary');
  const warningHeading = document.getElementById('confirm-warning-heading');
  const warningText = document.getElementById('confirm-warning-text');
  const statusAlert = document.getElementById('confirm-status-alert');
  const btnAction = document.getElementById('btn-confirm-action');
  const btnActionText = document.getElementById('confirm-action-btn-text');
  const btnCancel = document.getElementById('btn-confirm-cancel');
  const btnClose = document.getElementById('btn-confirm-close');

  if (!modalOverlay) return;

  // Cấu hình giao diện loại DELETE
  if (modalCard) {
    modalCard.classList.remove('confirm-type-restore');
    modalCard.classList.add('confirm-type-delete');
  }
  if (iconEl) iconEl.className = 'fa-solid fa-trash-can';
  if (titleEl) titleEl.textContent = 'Xóa vĩnh viễn bản sao lưu';
  if (subtitleEl) subtitleEl.textContent = 'Bản sao lưu sẽ bị xóa khỏi đám mây Cloud Firestore';

  // Thông tin nhận diện bản sao lưu
  if (bkNameEl) bkNameEl.textContent = backup.name || 'Bản sao lưu';
  if (bkTimeEl) bkTimeEl.textContent = formatBackupTimestamp(backup.timestamp);
  if (bkUserEl) {
    bkUserEl.textContent = UserSession.currentUser
      ? `${UserSession.currentUser.rawName} (@${UserSession.currentUser.docId})`
      : 'Hồ sơ người dùng';
  }
  if (bkSummaryEl) {
    const yr = backup.summary?.year || backup.data?.currentYear || AppState.currentYear || 2026;
    const goalsCount = backup.summary?.goalsCount ?? (backup.data?.tcGoals?.length || 0);
    bkSummaryEl.textContent = `Năm ${yr} • ${goalsCount} mục tiêu tài chính`;
  }

  // Cảnh báo không thể hoàn tác
  if (warningHeading) warningHeading.textContent = 'Hành động không thể hoàn tác';
  if (warningText) {
    warningText.textContent = `Bản sao lưu [${backup.name || 'này'}] (${formatBackupTimestamp(backup.timestamp)}) sẽ bị xóa vĩnh viễn khỏi Cloud Firestore. Bạn sẽ không thể khôi phục lại dữ liệu từ bản lưu này sau khi đã xác nhận xóa.`;
  }

  // Trạng thái nút bấm & Banner
  if (statusAlert) statusAlert.style.display = 'none';
  if (btnAction) {
    btnAction.disabled = false;
    btnAction.className = 'btn-modal-submit';
  }
  if (btnActionText) btnActionText.innerHTML = '<i class="fa-solid fa-trash-can"></i> Xác nhận xóa vĩnh viễn';
  if (btnCancel) btnCancel.disabled = false;
  if (btnClose) btnClose.disabled = false;

  modalOverlay.style.display = 'flex';
  modalOverlay.classList.add('active');
  if (btnCancel) setTimeout(() => btnCancel.focus(), 60);
};

window.closeConfirmModal = function() {
  if (isConfirmProcessing) return; // Khóa thao tác đóng khi đang xử lý mạng Firestore
  const modalOverlay = document.getElementById('confirm-modal-overlay');
  if (modalOverlay) {
    modalOverlay.classList.remove('active');
    modalOverlay.style.display = 'none';
  }
  pendingConfirmAction = null;
};

window.executeConfirmedAction = async function() {
  if (isConfirmProcessing || !pendingConfirmAction) return;

  const action = pendingConfirmAction;
  const statusAlert = document.getElementById('confirm-status-alert');
  const statusMsg = document.getElementById('confirm-status-msg');
  const statusIcon = document.getElementById('confirm-status-icon');
  const btnAction = document.getElementById('btn-confirm-action');
  const btnActionText = document.getElementById('confirm-action-btn-text');
  const btnCancel = document.getElementById('btn-confirm-cancel');
  const btnClose = document.getElementById('btn-confirm-close');

  // Khóa tương tác UI trong suốt quá trình xử lý
  isConfirmProcessing = true;
  if (btnAction) btnAction.disabled = true;
  if (btnCancel) btnCancel.disabled = true;
  if (btnClose) btnClose.disabled = true;

  if (statusAlert) {
    statusAlert.className = 'confirm-status-alert is-processing';
    statusAlert.style.display = 'flex';
  }

  if (action.type === 'restore') {
    if (statusMsg) statusMsg.textContent = 'Đang tự động sao lưu an toàn và khôi phục dữ liệu...';
    if (statusIcon) statusIcon.className = 'fa-solid fa-spinner fa-spin';
    if (btnActionText) btnActionText.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang khôi phục...';

    try {
      const backup = action.backup;
      if (!backup || !backup.data) {
        throw new Error('Dữ liệu bản sao lưu không hợp lệ!');
      }

      // 1. Tự động tạo bản lưu an toàn (safety snapshot) của phiên hiện tại trước khi khôi phục
      try {
        const safetySnapshot = JSON.parse(JSON.stringify(AppState));
        const safetyEntry = {
          id: "bk_safety_" + Date.now(),
          name: "Tự động sao lưu trước khôi phục",
          timestamp: new Date().toISOString(),
          summary: {
            year: safetySnapshot.currentYear || 2026,
            age: safetySnapshot.currentAge || 25,
            goalsCount: (safetySnapshot.tcGoals || []).length
          },
          data: safetySnapshot
        };
        const userDocId = UserSession.currentUser ? UserSession.currentUser.docId : 'khach_hang_mac_dinh';
        const localBk = JSON.parse(localStorage.getItem("FIN_APP_BACKUPS_" + userDocId) || "[]");
        localBk.unshift(safetyEntry);
        localStorage.setItem("FIN_APP_BACKUPS_" + userDocId, JSON.stringify(localBk.slice(0, 25)));
      } catch (safeErr) {
        console.warn("Không thể tạo safety backup:", safeErr);
      }

      // 2. Khôi phục dữ liệu vào AppState
      const restoreData = backup.data;
      Object.keys(restoreData).forEach(key => {
        if (!key.startsWith('_')) {
          AppState[key] = restoreData[key];
        }
      });

      // 3. Đồng bộ lại UI Năm và Tuổi
      const yEl = document.getElementById('input-year');
      const aEl = document.getElementById('input-age');
      if (yEl) yEl.innerText = AppState.currentYear;
      if (aEl) aEl.innerText = AppState.currentAge;
      document.querySelectorAll('.dynamic-year').forEach(el => el.textContent = AppState.currentYear);

      const sRateEl = document.getElementById('target-savings-rate-val');
      if (sRateEl) sRateEl.innerText = `${AppState.targetSavingsRate || 40}%`;
      const vAgeEl = document.getElementById('vision-age-cell');
      if (vAgeEl) vAgeEl.innerText = AppState.visionAge || '';
      const vDescEl = document.getElementById('vision-desc-cell');
      if (vDescEl) vDescEl.innerText = AppState.visionDesc || '';

      // 4. Vẽ lại toàn bộ các bảng, khảo sát, và tính toán
      renderSetupTables();
      renderPlanTables();
      renderTcGoalsFormTable();
      renderSkillsFamilyJob();
      renderGoogleFormSurvey();
      evaluateSurveys();
      renderTcMatrixTable();
      renderCareerTables();
      renderMonthView(AppState.currentMonth);
      syncGoalsToCards();
      recalculateAll();

      // 5. Lưu trạng thái vừa khôi phục lên Cloud Firestore
      try {
        if (window.CloudDB && UserSession.currentUser) {
          const userDocId = UserSession.currentUser.docId;
          await window.CloudDB.saveData(AppState, userDocId, UserSession.currentUser);
        }
      } catch (saveErr) {
        console.warn("Lỗi đồng bộ Cloud sau khi khôi phục:", saveErr);
      }

      window.hasUnsavedChanges = false;
      window.hasSavedInSession = true;
      updateCloudStatus('ready', 'Khôi phục lúc ' + new Date().toLocaleTimeString('vi-VN'));

      isConfirmProcessing = false;
      window.closeConfirmModal();
      window.closeBackupManagerModal();
      showToast(`Đã khôi phục thành công bản sao lưu [${backup.name}]!`, "success");
    } catch (err) {
      console.error("Lỗi khi khôi phục bản sao lưu:", err);
      isConfirmProcessing = false;
      if (statusAlert) {
        statusAlert.className = 'confirm-status-alert is-error';
        statusAlert.style.display = 'flex';
      }
      if (statusIcon) statusIcon.className = 'fa-solid fa-circle-exclamation';
      if (statusMsg) statusMsg.textContent = `Lỗi khôi phục: ${err.message || 'Không thể đọc dữ liệu'}`;
      if (btnAction) btnAction.disabled = false;
      if (btnCancel) btnCancel.disabled = false;
      if (btnClose) btnClose.disabled = false;
      if (btnActionText) btnActionText.innerHTML = '<i class="fa-solid fa-rotate-right"></i> Thử lại';
    }
  } else if (action.type === 'delete') {
    if (statusMsg) statusMsg.textContent = 'Đang kết nối Firebase Firestore và xóa bản sao lưu...';
    if (statusIcon) statusIcon.className = 'fa-solid fa-spinner fa-spin';
    if (btnActionText) btnActionText.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang xóa...';

    try {
      const userDocId = UserSession.currentUser ? UserSession.currentUser.docId : 'khach_hang_mac_dinh';
      const res = await window.CloudDB.deleteBackup(userDocId, action.backupId);

      if (res.success) {
        // Chỉ cập nhật UI danh sách sau khi Firebase xác nhận xóa thành công!
        currentLoadedBackups = res.backups || [];
        if (selectedBackupId === action.backupId) {
          selectedBackupId = (currentLoadedBackups.length > 0) ? currentLoadedBackups[0].id : null;
        }

        window.filterAndSortBackups();
        isConfirmProcessing = false;
        window.closeConfirmModal();
        showToast(`Đã xóa vĩnh viễn bản sao lưu [${action.backup.name || 'được chọn'}] trên Cloud!`, "success");
      } else {
        // Nếu Firebase xóa thất bại: GIỮ NGUYÊN danh sách bản ghi và hiển thị lỗi trên UI
        isConfirmProcessing = false;
        if (statusAlert) {
          statusAlert.className = 'confirm-status-alert is-error';
          statusAlert.style.display = 'flex';
        }
        if (statusIcon) statusIcon.className = 'fa-solid fa-circle-exclamation';
        if (statusMsg) statusMsg.textContent = `Không thể xóa trên Cloud Firestore: ${res.error || res.message || 'Lỗi mạng hoặc phân quyền'}. Vui lòng thử lại!`;
        if (btnAction) btnAction.disabled = false;
        if (btnCancel) btnCancel.disabled = false;
        if (btnClose) btnClose.disabled = false;
        if (btnActionText) btnActionText.innerHTML = '<i class="fa-solid fa-rotate-right"></i> Thử xóa lại';
        showToast("Xóa bản sao lưu trên Cloud thất bại!", "error");
      }
    } catch (err) {
      console.error("Lỗi ngoại lệ khi xóa bản sao lưu:", err);
      isConfirmProcessing = false;
      if (statusAlert) {
        statusAlert.className = 'confirm-status-alert is-error';
        statusAlert.style.display = 'flex';
      }
      if (statusIcon) statusIcon.className = 'fa-solid fa-circle-exclamation';
      if (statusMsg) statusMsg.textContent = `Lỗi hệ thống: ${err.message || 'Không thể thực hiện kết nối'}`;
      if (btnAction) btnAction.disabled = false;
      if (btnCancel) btnCancel.disabled = false;
      if (btnClose) btnClose.disabled = false;
      if (btnActionText) btnActionText.innerHTML = '<i class="fa-solid fa-rotate-right"></i> Thử xóa lại';
      showToast("Lỗi khi kết nối dịch vụ xóa đám mây!", "error");
    }
  }
};

// Khôi phục các hàm tương thích cũ để tránh lỗi gọi hàm
window.showRestoreConfirm = function() {
  if (selectedBackupId) window.openRestoreConfirmModal(selectedBackupId);
};

window.cancelRestoreConfirm = function() {
  window.closeConfirmModal();
};

window.executeRestoreSelectedBackup = async function() {
  if (selectedBackupId) window.openRestoreConfirmModal(selectedBackupId);
};

window.deleteSelectedBackup = async function() {
  if (selectedBackupId) window.openDeleteConfirmModal(selectedBackupId);
};

window.deleteBackupItem = function(backupId) {
  window.openDeleteConfirmModal(backupId);
};

// Thiết lập lắng nghe sự kiện đóng hộp thoại xác nhận qua Escape và click backdrop
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const confirmModal = document.getElementById('confirm-modal-overlay');
    if (confirmModal && confirmModal.classList.contains('active') && !isConfirmProcessing) {
      window.closeConfirmModal();
    }
  }
});

document.addEventListener('DOMContentLoaded', () => {
  const confirmModal = document.getElementById('confirm-modal-overlay');
  if (confirmModal) {
    confirmModal.addEventListener('click', (e) => {
      if (e.target === confirmModal && !isConfirmProcessing) {
        window.closeConfirmModal();
      }
    });
  }
});

// ==================== ĐIỀU KHIỂN MODAL NHẬN DIỆN NGƯỜI DÙNG ====================

let pendingUserCandidate = null;

window.openUserModal = function(allowCancel = true) {
  const modal = document.getElementById('user-modal-overlay');
  const cancelBtn = document.getElementById('btn-modal-cancel');
  const input = document.getElementById('input-user-rawname');
  const errorEl = document.getElementById('user-input-error');
  const dupBox = document.getElementById('duplicate-warning-box');

  if (!modal) return;

  if (errorEl) errorEl.style.display = 'none';
  if (dupBox) dupBox.style.display = 'none';
  if (cancelBtn) cancelBtn.style.display = allowCancel ? 'inline-block' : 'none';

  if (UserSession.currentUser && input) {
    input.value = UserSession.currentUser.rawName;
    updateSlugPreview(UserSession.currentUser.rawName);
  } else if (input) {
    input.value = '';
    updateSlugPreview('');
  }

  modal.classList.add('active');
  if (input) setTimeout(() => input.focus(), 80);
};

window.closeUserModal = function() {
  const modal = document.getElementById('user-modal-overlay');
  if (modal) modal.classList.remove('active');
};

function updateSlugPreview(val) {
  const slugEl = document.getElementById('preview-user-slug');
  const normalized = normalizeUserName(val);
  if (slugEl) {
    slugEl.textContent = normalized ? `user_${normalized}` : 'chua_xac_dinh';
  }
}

window.submitUserProfile = async function() {
  const input = document.getElementById('input-user-rawname');
  const errorEl = document.getElementById('user-input-error');
  const dupBox = document.getElementById('duplicate-warning-box');
  const btnSubmit = document.getElementById('btn-modal-submit');

  if (!input) return;
  const rawVal = input.value.trim();

  // Kiểm tra tính hợp lệ của họ tên
  if (!rawVal || rawVal.length < 2) {
    if (errorEl) {
      errorEl.textContent = "Vui lòng nhập họ và tên hợp lệ (tối thiểu 2 ký tự, không chỉ chứa khoảng trắng).";
      errorEl.style.display = 'block';
    }
    input.focus();
    return;
  }

  const normalized = normalizeUserName(rawVal);
  if (!normalized) {
    if (errorEl) {
      errorEl.textContent = "Tên không chứa ký tự chữ cái hợp lệ để tạo định danh.";
      errorEl.style.display = 'block';
    }
    return;
  }

  if (errorEl) errorEl.style.display = 'none';
  const defaultDocId = `user_${normalized}`;

  // Kiểm tra trùng lặp trên Cloud nếu Firestore đã sẵn sàng
  if (window.CloudDB && (!UserSession.currentUser || UserSession.currentUser.docId !== defaultDocId)) {
    if (btnSubmit) {
      btnSubmit.disabled = true;
      btnSubmit.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> <span>Đang kiểm tra...</span>`;
    }

    const check = await window.CloudDB.checkDocExists(defaultDocId);

    if (btnSubmit) {
      btnSubmit.disabled = false;
      btnSubmit.innerHTML = `<span>Xác nhận & Bắt đầu</span> <i class="fa-solid fa-arrow-right"></i>`;
    }

    if (check.success && check.exists) {
      // Đã có dữ liệu của người có tên chuẩn hóa tương đương -> Hiển thị hộp thoại xử lý trùng lặp
      pendingUserCandidate = {
        rawName: rawVal,
        normalizedName: normalized,
        defaultDocId: defaultDocId
      };

      const dupDocText = document.getElementById('dup-doc-id-text');
      if (dupDocText) dupDocText.textContent = defaultDocId;
      if (dupBox) dupBox.style.display = 'flex';

      // Gắn sự kiện cho 2 nút giải quyết
      document.getElementById('btn-dup-use-existing').onclick = () => {
        applyUserProfile(rawVal, normalized, defaultDocId, true);
      };

      document.getElementById('btn-dup-create-unique').onclick = () => {
        // Tạo hậu tố phân biệt theo thời gian thực ngắn
        const uniqueSuffix = Date.now().toString().slice(-4);
        const uniqueDocId = `user_${normalized}_${uniqueSuffix}`;
        applyUserProfile(rawVal, normalized, uniqueDocId, false);
      };

      return;
    }
  }

  // Tên mới hoàn toàn hoặc là người dùng hiện tại đang cập nhật
  applyUserProfile(rawVal, normalized, defaultDocId, false);
};

function applyUserProfile(rawName, normalizedName, docId, loadExistingData = false) {
  const user = {
    rawName: rawName,
    normalizedName: normalizedName,
    docId: docId,
    confirmedAt: new Date().toISOString()
  };

  UserSession.setStored(user);
  closeUserModal();
  showToast(`Chào mừng [${rawName}], hệ sinh thái đã sẵn sàng!`, "success");

  // Chỉ nạp dữ liệu cũ nếu người dùng chủ động chọn "Tải & dùng tiếp hồ sơ này"
  if (loadExistingData && window.CloudDB) {
    window.loadAppStateFromCloud(true);
  } else {
    window.resetAppStateToEmpty();
    updateCloudStatus('ready', 'Đám mây sẵn sàng');
  }
}

// ==================== HỎI LƯU DỮ LIỆU TRƯỚC KHI TẮT TRANG WEB ====================
window.hasUnsavedChanges = false;
window.hasSavedInSession = false;
window.allowExitWithoutSave = false;
let pendingExitCallback = null;
let isExitSaving = false;

window.hasAppStateData = function() {
  if (
    (AppState.expenses && AppState.expenses.length > 0) ||
    (AppState.incomeList && AppState.incomeList.length > 0) ||
    (AppState.planList && AppState.planList.length > 0) ||
    (AppState.investProducts && AppState.investProducts.length > 0) ||
    (AppState.tcGoals && AppState.tcGoals.length > 0) ||
    (AppState.skillsList && AppState.skillsList.length > 0) ||
    (AppState.familyList && AppState.familyList.length > 0) ||
    (AppState.jobList && AppState.jobList.length > 0) ||
    (AppState.planIncome && AppState.planIncome.length > 0) ||
    (AppState.planExpense && AppState.planExpense.length > 0) ||
    (AppState.surveyP1Choices && Object.keys(AppState.surveyP1Choices).length > 0) ||
    (AppState.surveyP2Choices && Object.keys(AppState.surveyP2Choices).length > 0) ||
    (AppState.skillsStore && Object.keys(AppState.skillsStore).length > 0)
  ) {
    return true;
  }
  for (let m = 1; m <= 12; m++) {
    const md = AppState.monthlyDetails?.[m];
    if (md && ((md.incomes && md.incomes.length > 0) || (md.expenses && md.expenses.length > 0) || (md.learningDetails && md.learningDetails.length > 0))) {
      return true;
    }
  }
  return false;
};

window.markUnsavedChanges = function() {
  window.hasUnsavedChanges = true;
  window.allowExitWithoutSave = false;
  updateCloudStatus('ready', 'Chưa lưu dữ liệu');
};

window.openExitSaveModal = function(onProceedCallback = null) {
  pendingExitCallback = typeof onProceedCallback === 'function' ? onProceedCallback : null;
  const overlay = document.getElementById('exit-save-modal-overlay');
  const statusAlert = document.getElementById('exit-save-status-alert');
  const btnStay = document.getElementById('btn-exit-stay');
  const btnDiscard = document.getElementById('btn-exit-discard');
  const btnSave = document.getElementById('btn-exit-save-now');
  const btnSaveText = document.getElementById('btn-exit-save-text');

  if (!overlay) return;
  isExitSaving = false;
  if (statusAlert) statusAlert.style.display = 'none';
  if (btnStay) btnStay.disabled = false;
  if (btnDiscard) btnDiscard.disabled = false;
  if (btnSave) btnSave.disabled = false;
  if (btnSaveText) btnSaveText.textContent = 'Lưu dữ liệu ngay';

  overlay.style.display = 'flex';
  overlay.classList.add('active');
  if (btnSave) setTimeout(() => btnSave.focus(), 60);
};

window.closeExitSaveModal = function() {
  if (isExitSaving) return;
  const overlay = document.getElementById('exit-save-modal-overlay');
  if (overlay) {
    overlay.classList.remove('active');
    overlay.style.display = 'none';
  }
  pendingExitCallback = null;
};

window.confirmExitWithoutSaving = function() {
  if (isExitSaving) return;
  window.hasUnsavedChanges = false;
  window.allowExitWithoutSave = true;
  const cb = pendingExitCallback;
  window.closeExitSaveModal();
  if (typeof cb === 'function') {
    cb();
  } else {
    showToast("Đã bỏ qua lưu dữ liệu. Bạn có thể đóng trang web ngay bây giờ.", "info");
  }
};

window.confirmSaveBeforeExit = async function() {
  if (isExitSaving) return;
  const statusAlert = document.getElementById('exit-save-status-alert');
  const statusIcon = document.getElementById('exit-save-status-icon');
  const statusMsg = document.getElementById('exit-save-status-msg');
  const btnStay = document.getElementById('btn-exit-stay');
  const btnDiscard = document.getElementById('btn-exit-discard');
  const btnSave = document.getElementById('btn-exit-save-now');
  const btnSaveText = document.getElementById('btn-exit-save-text');

  isExitSaving = true;
  if (btnStay) btnStay.disabled = true;
  if (btnDiscard) btnDiscard.disabled = true;
  if (btnSave) btnSave.disabled = true;
  if (btnSaveText) btnSaveText.textContent = 'Đang lưu...';

  if (statusAlert) {
    statusAlert.className = 'confirm-status-alert is-processing';
    statusAlert.style.display = 'flex';
  }
  if (statusIcon) statusIcon.className = 'fa-solid fa-spinner fa-spin';
  if (statusMsg) statusMsg.textContent = 'Đang lưu dữ liệu lên Cloud Firestore...';

  const savedOk = await window.saveAppStateToCloud();
  isExitSaving = false;

  if (savedOk) {
    window.hasUnsavedChanges = false;
    window.allowExitWithoutSave = true;
    const cb = pendingExitCallback;
    window.closeExitSaveModal();
    if (typeof cb === 'function') {
      cb();
    } else {
      showToast("Đã lưu dữ liệu thành công! Bạn có thể đóng trang web an toàn.", "success");
    }
  } else {
    if (statusAlert) {
      statusAlert.className = 'confirm-status-alert is-error';
      statusAlert.style.display = 'flex';
    }
    if (statusIcon) statusIcon.className = 'fa-solid fa-circle-exclamation';
    if (statusMsg) statusMsg.textContent = 'Chưa thể lưu dữ liệu. Vui lòng kiểm tra hồ sơ hoặc kết nối mạng và thử lại.';
    if (btnStay) btnStay.disabled = false;
    if (btnDiscard) btnDiscard.disabled = false;
    if (btnSave) btnSave.disabled = false;
    if (btnSaveText) btnSaveText.textContent = 'Thử lưu lại';
  }
};

// Sự kiện trình duyệt hỏi người dùng trước khi tắt / đóng tab hoặc tải lại trang
window.addEventListener('beforeunload', (e) => {
  if (window.allowExitWithoutSave) return;
  if (window.hasUnsavedChanges || !window.hasSavedInSession || window.hasAppStateData()) {
    const msg = 'Bạn có muốn lưu dữ liệu trước khi tắt trang web không?';
    e.preventDefault();
    e.returnValue = msg;
    // Nếu người dùng chọn "Ở lại trang" trên hộp thoại trình duyệt để lưu dữ liệu, mở ngay hộp thoại Lưu trong trang
    setTimeout(() => {
      if (!document.hidden && !window.allowExitWithoutSave) {
        window.openExitSaveModal();
      }
    }, 250);
    return msg;
  }
});

// ==================== KHỞI TẠO VÀ LẮNG NGHE SỰ KIỆN ====================
document.addEventListener('DOMContentLoaded', () => {
  // Gắn sự kiện gõ phím để xem trước định danh
  const inputName = document.getElementById('input-user-rawname');
  if (inputName) {
    inputName.addEventListener('input', (e) => {
      updateSlugPreview(e.target.value);
      const errorEl = document.getElementById('user-input-error');
      if (errorEl) errorEl.style.display = 'none';
      const dupBox = document.getElementById('duplicate-warning-box');
      if (dupBox) dupBox.style.display = 'none';
    });
    inputName.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') submitUserProfile();
    });
  }

  // Khởi tạo Expanding Side Rail (Mẫu Lucian #040)
  initSideRail();

  // Khởi tạo Mobile Navigation Drawer
  const btnMenuToggle = document.getElementById('btn-menu-toggle');
  const btnDrawerClose = document.getElementById('btn-drawer-close');
  const sidebarBackdrop = document.getElementById('sidebar-backdrop');

  const closeDrawer = () => document.body.classList.remove('nav-open');
  const openDrawer = () => document.body.classList.add('nav-open');

  if (btnMenuToggle) btnMenuToggle.addEventListener('click', openDrawer);
  if (btnDrawerClose) btnDrawerClose.addEventListener('click', closeDrawer);
  if (sidebarBackdrop) sidebarBackdrop.addEventListener('click', closeDrawer);

  // Đóng drawer khi chọn tab trên mobile, hoặc thu gọn hover rail
  document.querySelectorAll('.sidebar .nav-item, #app-sidebar .nav-item').forEach(item => {
    item.addEventListener('click', () => {
      if (window.innerWidth <= 768) {
        closeDrawer();
      } else if (document.body.classList.contains('rail-auto')) {
        document.body.classList.remove('rail-hover-expanded');
      }
    });
  });

  // Đóng Account Switcher menu khi click ngoài
  document.addEventListener('click', (e) => {
    const area = document.getElementById('rail-account-area');
    if (area && !area.contains(e.target)) {
      closeAccountMenu();
    }
  });

  // Điều hướng bàn phím cho Account Switcher Flyout (Mẫu Lucian #037)
  document.addEventListener('keydown', (e) => {
    const menu = document.getElementById('account-switcher-menu');
    if (!menu || menu.style.display === 'none' || !menu.classList.contains('is-open')) return;

    if (e.key === 'Escape') {
      e.preventDefault();
      closeAccountMenu();
      document.getElementById('btn-account-chip')?.focus();
      return;
    }

    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      const focusables = Array.from(menu.querySelectorAll('.account-item, .account-action-btn'));
      if (!focusables.length) return;
      const currentIndex = focusables.indexOf(document.activeElement);
      e.preventDefault();
      let nextIndex;
      if (e.key === 'ArrowDown') {
        nextIndex = currentIndex + 1 < focusables.length ? currentIndex + 1 : 0;
      } else {
        nextIndex = currentIndex - 1 >= 0 ? currentIndex - 1 : focusables.length - 1;
      }
      focusables[nextIndex].focus();
    }
  });

  // Khởi tạo DatePicker
  if (window.FinDatePicker) {
    FinDatePicker.init();
  }

  // Khởi tạo Theme & Chart font defaults
  if (window.initTheme) {
    window.initTheme();
  }
  if (typeof Chart !== 'undefined') {
    Chart.defaults.font.family = "'Inter', system-ui, -apple-system, sans-serif";
  }

  // Khởi tạo các bảng dữ liệu ban đầu (trạng thái trống hoàn toàn khi mở trang)
  const sRateEl = document.getElementById('target-savings-rate-val');
  if (sRateEl) sRateEl.innerText = `${AppState.targetSavingsRate || 40}%`;
  const vAgeEl = document.getElementById('vision-age-cell');
  if (vAgeEl) vAgeEl.innerText = AppState.visionAge || '';
  const vDescEl = document.getElementById('vision-desc-cell');
  if (vDescEl) vDescEl.innerText = AppState.visionDesc || '';

  renderSetupTables();
  renderPlanTables();
  renderTcGoalsFormTable();
  renderSkillsFamilyJob();
  renderGoogleFormSurvey();
  evaluateSurveys();
  if (window.updateSurveyProgress) {
    window.updateSurveyProgress();
  }
  renderTcMatrixTable();
  renderCareerTables();
  renderMonthView(AppState.currentMonth);
  syncGoalsToCards();
  recalculateAll();

  // Theo dõi mọi thao tác nhập liệu / chỉnh sửa trên trang để đánh dấu dữ liệu chưa lưu
  const contentBody = document.querySelector('.content-body');
  if (contentBody) {
    contentBody.addEventListener('input', () => {
      window.markUnsavedChanges();
    });
    contentBody.addEventListener('change', () => {
      window.markUnsavedChanges();
    });
    contentBody.addEventListener('click', (e) => {
      if (e.target.closest('.btn-table-add, .btn-table-add-prominent, .btn-table-del, .gform-opt-row')) {
        window.markUnsavedChanges();
      }
    });
  }

  // Khôi phục phiên người dùng hoặc mở Modal bắt buộc
  const storedUser = UserSession.getStored();
  if (storedUser && storedUser.rawName && storedUser.docId) {
    UserSession.currentUser = storedUser;
    UserSession.updateUI();
  } else {
    // Người dùng mới truy cập: mở modal chặn các thao tác cho đến khi xác nhận họ tên
    openUserModal(false);
  }

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
        renderTcGoalsFormTable();
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
        renderTcGoalsFormTable();
        renderTcMatrixTable();
        recalculateAll();
      }
    });
  }

  if (sRateEl) {
    const handleSavingsRateUpdate = () => {
      const parsed = parseFloat(sRateEl.innerText.replace(/[^0-9.-]/g, ''));
      if (!isNaN(parsed) && parsed > 0 && parsed <= 100) {
        AppState.targetSavingsRate = parsed;
      }
      renderTcMatrixTable();
      renderCareerTables();
      renderCareerChart();
    };
    sRateEl.addEventListener('input', handleSavingsRateUpdate);
    sRateEl.addEventListener('blur', () => {
      sRateEl.innerText = `${AppState.targetSavingsRate || 40}%`;
      handleSavingsRateUpdate();
    });
  }

  if (vAgeEl) {
    vAgeEl.addEventListener('input', () => {
      AppState.visionAge = vAgeEl.innerText.trim();
    });
  }
  if (vDescEl) {
    vDescEl.addEventListener('input', () => {
      AppState.visionDesc = vDescEl.innerText.trim();
    });
  }

  // Lắng nghe sự kiện bàn phím cho Day–night sky switch (Prompt #021)
  const u021Switch = document.getElementById('u021-theme-switch');
  if (u021Switch) {
    u021Switch.addEventListener('keydown', (e) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        window.toggleTheme(e);
      }
    });
  }

  // Đóng modal backup hoặc modal hỏi lưu khi click bên ngoài vùng hộp thoại hoặc nhấn phím Escape
  const backupOverlay = document.getElementById('backup-modal-overlay');
  if (backupOverlay) {
    backupOverlay.addEventListener('click', (e) => {
      if (e.target === backupOverlay) {
        window.closeBackupManagerModal();
      }
    });
  }
  const exitSaveOverlay = document.getElementById('exit-save-modal-overlay');
  if (exitSaveOverlay) {
    exitSaveOverlay.addEventListener('click', (e) => {
      if (e.target === exitSaveOverlay && !isExitSaving) {
        window.closeExitSaveModal();
      }
    });
  }
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const backupModal = document.getElementById('backup-modal-overlay');
      if (backupModal && backupModal.classList.contains('active')) {
        window.closeBackupManagerModal();
      }
      const exitModal = document.getElementById('exit-save-modal-overlay');
      if (exitModal && exitModal.classList.contains('active') && !isExitSaving) {
        window.closeExitSaveModal();
      }
    }
  });
});

// Khi Firebase sẵn sàng: giữ nguyên dữ liệu ban đầu trống hoàn toàn (người dùng có thể bấm "Nhập dữ liệu" bất cứ lúc nào để khôi phục bản lưu)
window.addEventListener('firebase-ready', () => {
  updateCloudStatus('ready', 'Đám mây sẵn sàng');
});

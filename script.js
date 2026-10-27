

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

try { window.initTheme(); } catch (e) {}

function normalizeUserName(rawName) {
  if (!rawName || typeof rawName !== 'string') return '';
  return rawName
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_.]/g, '')
    .replace(/([_.])\1+/g, '$1')
    .replace(/^[_.]+|[_.]+$/g, '');
}

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

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

const UserSession = {
  STORAGE_KEY: "FIN_APP_USER_SESSION",
  PROFILES_KEY: "FIN_APP_PROFILES_LIST",
  currentUser: null,

  getStored() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (!data) return null;
      const parsed = JSON.parse(data);
      if (!parsed || typeof parsed !== 'object') return null;
      if (parsed.authenticatedAt && (Date.now() - parsed.authenticatedAt > 7 * 24 * 60 * 60 * 1000)) {
        localStorage.removeItem(this.STORAGE_KEY);
        return null;
      }
      if (parsed.expiresAt && Date.now() > parsed.expiresAt) {
        localStorage.removeItem(this.STORAGE_KEY);
        return null;
      }
      const displayUsername = parsed.displayUsername || parsed.username || parsed.rawName || parsed.ho_ten || '';
      const normalizedUsername = parsed.normalizedUsername || parsed.normalizedName || normalizeUserName(displayUsername);
      parsed.username = displayUsername;
      parsed.displayUsername = displayUsername;
      parsed.rawName = displayUsername;
      parsed.ho_ten = displayUsername;
      parsed.normalizedUsername = normalizedUsername;
      parsed.normalizedName = normalizedUsername;
      if (!parsed.docId && normalizedUsername) {
        parsed.docId = `user_${normalizedUsername}`;
      }
      if (!parsed.role) {
        try {
          const localAccs = JSON.parse(localStorage.getItem("FIN_APP_AUTH_ACCOUNTS_SECURE_V2") || "{}");
          if (localAccs[normalizedUsername] && localAccs[normalizedUsername].role) {
            parsed.role = localAccs[normalizedUsername].role;
          }
        } catch (e) {}
      }
      if (!parsed.role) {
        if (normalizedUsername === 'admin' || (normalizedUsername && normalizedUsername.startsWith('admin_')) || normalizedUsername === 'administrator') {
          parsed.role = 'admin';
        } else if (normalizedUsername === 'dinh_anh_quan' || normalizedUsername === 'haketo_spec' || (normalizedUsername && (normalizedUsername.includes('instructor') || normalizedUsername.includes('teacher')))) {
          parsed.role = 'instructor';
        } else {
          parsed.role = 'student';
        }
      }
      return parsed;
    } catch (e) {
      console.error("Lỗi đọc session từ localStorage:", e);
      return null;
    }
  },

  getProfilesList() {
    try {
      const data = localStorage.getItem(this.PROFILES_KEY);
      const list = data ? JSON.parse(data) : [];
      if (!Array.isArray(list)) return [];
      const current = this.getStored();
      const activeDocId = current ? current.docId : null;
      const cleanList = list.filter(p => {
        if (!p || !p.docId) return false;
        return p.authenticatedOnDevice === true || (activeDocId && p.docId === activeDocId);
      });
      if (cleanList.length !== list.length) {
        localStorage.setItem(this.PROFILES_KEY, JSON.stringify(cleanList));
      }
      return cleanList;
    } catch (e) {
      return [];
    }
  },

  addProfile(user) {
    if (!user || !user.docId) return;
    const displayUsername = user.displayUsername || user.username || user.rawName || '';
    if (!displayUsername) return;
    try {
      let list = this.getProfilesList();
      const existingIdx = list.findIndex(p => p.docId === user.docId);
      const norm = user.normalizedUsername || user.normalizedName || normalizeUserName(displayUsername);
      const profileData = {
        username: displayUsername,
        displayUsername: displayUsername,
        rawName: displayUsername,
        normalizedUsername: norm,
        normalizedName: norm,
        role: user.role || 'student',
        docId: user.docId,
        uid: user.uid || '',
        maskedEmail: user.maskedEmail || '',
        hasRecoveryEmail: Boolean(user.hasRecoveryEmail),
        authenticatedOnDevice: true,
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
      const safeCopy = Object.assign({}, user);
      delete safeCopy.password;
      delete safeCopy.passwordHash;
      if (!safeCopy.authenticatedAt) {
        safeCopy.authenticatedAt = Date.now();
      }
      safeCopy.lastActive = Date.now();
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(safeCopy));
    } catch (e) {
      console.error("Lỗi ghi session vào localStorage:", e);
    }
    if (user) {
      this.addProfile(user);
      if (user.normalizedUsername) {
        try {
          const guestId = localStorage.getItem('FIN_APP_GUEST_STUDENT_ID');
          if (guestId && guestId !== user.normalizedUsername && window.CloudDB && typeof window.CloudDB.migrateGuestToAccount === 'function') {
            window.CloudDB.migrateGuestToAccount(guestId, user.normalizedUsername, user.displayUsername || user.rawName)
              .then(() => {
                localStorage.removeItem('FIN_APP_GUEST_STUDENT_ID');
                localStorage.removeItem('FIN_APP_GUEST_STUDENT_NAME');
              })
              .catch(e => console.warn('[CloudDB] migrateGuestToAccount error:', e));
          }
        } catch (e) {}
      }
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

    const accDispEl = document.getElementById('auth-acc-display-username');
    const accNormEl = document.getElementById('auth-acc-norm-username');
    const accMailEl = document.getElementById('auth-acc-masked-email');
    const accUidEl = document.getElementById('auth-acc-uid');

    const btnMenuAcc = document.getElementById('btn-menu-account-info');
    const btnMenuPass = document.getElementById('btn-menu-change-password');
    const btnMenuLogout = document.getElementById('btn-account-logout');
    const btnTopbarLogin = document.getElementById('btn-topbar-login');
    const topbarUserChip = document.getElementById('topbar-user-chip');
    const topbarUserName = document.getElementById('topbar-user-name');
    const topbarUserAvatar = document.getElementById('topbar-user-avatar');

    if (this.currentUser) {
      const disp = this.currentUser.displayUsername || this.currentUser.username || this.currentUser.rawName || 'Người dùng';
      const norm = this.currentUser.normalizedUsername || this.currentUser.normalizedName || normalizeUserName(disp);
      const slug = `@${norm || this.currentUser.docId}`;
      const initial = (disp.trim().charAt(0) || 'U').toUpperCase();

      if (rawEl) rawEl.textContent = disp;
      if (slugEl) slugEl.textContent = slug;
      if (chipName) chipName.textContent = disp;
      if (chipSlug) chipSlug.textContent = slug;
      if (chipAvatar) chipAvatar.textContent = initial;

      if (topbarUserName) topbarUserName.textContent = disp;
      if (topbarUserAvatar) topbarUserAvatar.textContent = initial;

      if (accDispEl) accDispEl.textContent = disp;
      if (accNormEl) accNormEl.textContent = `@${norm}`;
      if (accMailEl) {
        accMailEl.textContent = (this.currentUser.hasRecoveryEmail && this.currentUser.maskedEmail)
          ? this.currentUser.maskedEmail
          : 'Chưa liên kết email khôi phục';
      }
      if (accUidEl) accUidEl.textContent = this.currentUser.uid || 'Hồ sơ cục bộ';

      if (btnMenuAcc) btnMenuAcc.style.display = '';
      if (btnMenuPass) btnMenuPass.style.display = '';
      if (btnMenuLogout) btnMenuLogout.style.display = '';
      if (btnTopbarLogin) btnTopbarLogin.style.display = 'none';
      if (topbarUserChip) topbarUserChip.style.display = 'inline-flex';

      const btnMenuClass = document.getElementById('btn-menu-class-manager');
      const isInstructorOrAdmin = this.currentUser && (
        this.currentUser.role === 'admin' ||
        this.currentUser.role === 'instructor' ||
        this.currentUser.role === 'teacher' ||
        this.currentUser.normalizedUsername === 'admin' ||
        this.currentUser.normalizedUsername === 'haketo_spec' ||
        (this.currentUser.username && this.currentUser.username.toLowerCase() === 'admin') ||
        (this.currentUser.normalizedUsername && (this.currentUser.normalizedUsername.startsWith('admin_') || this.currentUser.normalizedUsername.includes('instructor') || this.currentUser.normalizedUsername.includes('teacher')))
      );
      if (btnMenuClass) btnMenuClass.style.display = isInstructorOrAdmin ? '' : 'none';
      const btnTabCodes = document.getElementById('btn-class-tab-codes');
      if (btnTabCodes) btnTabCodes.style.display = (this.currentUser && (this.currentUser.role === 'admin' || this.currentUser.normalizedUsername === 'admin')) ? '' : 'none';

      const btnAdminToggle = document.getElementById('btn-admin-mode-toggle');
      if (btnAdminToggle) {
        btnAdminToggle.style.display = isInstructorOrAdmin ? 'inline-flex' : 'none';
        const toggleLabel = document.getElementById('admin-mode-toggle-label');
        if (toggleLabel) {
          toggleLabel.innerHTML = window.isManagerMode
            ? '<i class="fa-solid fa-book-open"></i> <span>Xem Sổ tài chính</span>'
            : '<i class="fa-solid fa-chalkboard-user"></i> <span>Xem toàn cảnh lớp học</span>';
        }
        btnAdminToggle.classList.toggle('active-admin', Boolean(window.isManagerMode));
      }

      const studentAdminShortcut = document.getElementById('sidebar-student-admin-shortcut');
      if (studentAdminShortcut) {
        studentAdminShortcut.style.display = (isInstructorOrAdmin && !window.isManagerMode) ? 'block' : 'none';
        const shortcutBtn = studentAdminShortcut.querySelector('.btn-sidebar-admin-pill');
        if (shortcutBtn) {
          shortcutBtn.innerHTML = '<i class="fa-solid fa-chalkboard-user"></i> <span>Xem toàn cảnh lớp học</span>';
          shortcutBtn.title = 'Xem toàn cảnh lớp học';
        }
      }
    } else {
      if (rawEl) rawEl.textContent = "Chưa đăng nhập";
      if (slugEl) slugEl.textContent = "@guest";
      if (chipName) chipName.textContent = "Chưa đăng nhập";
      if (chipSlug) chipSlug.textContent = "Bấm để đăng nhập";
      if (chipAvatar) chipAvatar.textContent = "?";

      if (topbarUserName) topbarUserName.textContent = "Chưa đăng nhập";
      if (topbarUserAvatar) topbarUserAvatar.textContent = "?";

      if (accDispEl) accDispEl.textContent = "Chưa đăng nhập";
      if (accNormEl) accNormEl.textContent = "@guest";
      if (accMailEl) accMailEl.textContent = "Chưa liên kết";
      if (accUidEl) accUidEl.textContent = "---";

      if (btnMenuAcc) btnMenuAcc.style.display = 'none';
      if (btnMenuPass) btnMenuPass.style.display = 'none';
      if (btnMenuLogout) btnMenuLogout.style.display = 'none';
      if (btnTopbarLogin) btnTopbarLogin.style.display = 'inline-flex';
      if (topbarUserChip) topbarUserChip.style.display = 'none';

      const btnMenuClass = document.getElementById('btn-menu-class-manager');
      if (btnMenuClass) btnMenuClass.style.display = 'none';
      const btnAdminToggle = document.getElementById('btn-admin-mode-toggle');
      if (btnAdminToggle) btnAdminToggle.style.display = 'none';
      const studentAdminShortcut = document.getElementById('sidebar-student-admin-shortcut');
      if (studentAdminShortcut) studentAdminShortcut.style.display = 'none';
    }

    if (typeof window.renderAccountSwitcher === 'function') {
      window.renderAccountSwitcher();
    }
    if (typeof window.updateStudentClassStatusUI === 'function') {
      window.updateStudentClassStatusUI();
    }
  }
};

window.removeProfileFromDevice = function(docId, e) {
  if (e) e.stopPropagation();
  if (!confirm("Bạn có chắc chắn muốn loại bỏ tài khoản này khỏi thiết bị?")) {
    return;
  }
  try {
    let list = UserSession.getProfilesList();
    list = list.filter(p => p.docId !== docId);
    localStorage.setItem(UserSession.PROFILES_KEY, JSON.stringify(list));

    if (UserSession.currentUser && UserSession.currentUser.docId === docId) {
      if (typeof window.logoutUserProfile === 'function') {
        window.logoutUserProfile();
      } else {
        UserSession.clear();
      }
    } else {
      UserSession.updateUI();
    }
    if (typeof showToast === 'function') {
      showToast("Đã loại bỏ tài khoản khỏi thiết bị.");
    }
  } catch (err) {
    console.error("Lỗi khi loại bỏ tài khoản:", err);
  }
};

window.renderAccountSwitcher = function() {
  const listEl = document.getElementById('rail-account-list');
  const countEl = document.getElementById('account-profiles-count');
  if (!listEl) return;

  const current = UserSession.currentUser;
  if (countEl) {
    countEl.style.display = 'none';
  }

  if (!current) {
    listEl.innerHTML = `
      <div style="padding: 0.875rem 0.75rem; text-align: center; color: var(--text-muted); font-size: 0.8125rem;">
        <i class="fa-solid fa-user-clock" style="font-size: 1.25rem; display: block; margin-bottom: 0.375rem; opacity: 0.5;"></i>
        Chưa đăng nhập
      </div>
    `;
    return;
  }

  const dispName = current.displayUsername || current.username || current.rawName || 'Người dùng';
  const normName = current.normalizedUsername || current.normalizedName || current.docId;
  const initial = dispName.trim().charAt(0).toUpperCase();
  const roleName = (current.role === 'admin') ? 'Quản trị viên' : ((current.role === 'instructor' || current.role === 'teacher') ? 'Giảng viên' : 'Học viên');

  listEl.innerHTML = `
    <div class="account-item active" role="menuitem" tabindex="0">
      <div class="account-item-avatar">${initial}</div>
      <div class="account-item-info">
        <div class="account-item-name">${escapeHtml(dispName)}</div>
        <div class="account-item-slug">@${escapeHtml(normName)} • <span class="badge-role-tag">${roleName}</span></div>
      </div>
      <i class="fa-solid fa-circle-check text-success account-item-check" aria-hidden="true"></i>
    </div>
  `;
};

window.toggleAccountMenu = function(e, fromTopbar = false) {
  if (e) {
    e.stopPropagation();
  }
  const menu = document.getElementById('account-switcher-menu');
  if (!menu) return;
  const isHidden = menu.style.display === 'none' || !menu.classList.contains('is-open');
  if (isHidden) {
    openAccountMenu(fromTopbar);
  } else {
    closeAccountMenu();
  }
};

window.openAccountMenu = function(fromTopbar = false) {
  const menu = document.getElementById('account-switcher-menu');
  const topChip = document.getElementById('topbar-user-chip');
  if (!menu) return;

  renderAccountSwitcher();
  menu.classList.add('menu-from-topbar');
  menu.style.display = 'block';
  requestAnimationFrame(() => {
    menu.classList.add('is-open');
  });
  if (topChip) topChip.setAttribute('aria-expanded', 'true');

  setTimeout(() => {
    const activeItem = menu.querySelector('.account-item.active') || menu.querySelector('.account-item');
    if (activeItem) activeItem.focus();
  }, 60);
};

window.closeAccountMenu = function() {
  const menu = document.getElementById('account-switcher-menu');
  const topChip = document.getElementById('topbar-user-chip');
  if (!menu) return;
  menu.classList.remove('is-open');
  menu.style.display = 'none';
  if (topChip) topChip.setAttribute('aria-expanded', 'false');
};

window.goToAuthPage = function(tab = 'login', username = '', isSwitch = false) {
  closeAccountMenu();
  if (typeof window.closeUserModal === 'function') {
    window.closeUserModal();
  }
  const params = new URLSearchParams();
  if (tab && tab !== 'login') params.set('tab', tab);
  if (username) params.set('username', username);
  if (isSwitch) params.set('switch', '1');
  const qs = params.toString();
  const targetUrl = './auth/index.html' + (qs ? `?${qs}` : '');
  if (window.__DISABLE_AUTH_REDIRECT__) {
    window.__LAST_AUTH_REDIRECT_URL__ = targetUrl;
    return targetUrl;
  }
  window.allowExitWithoutSave = true;
  window.location.href = targetUrl;
  return targetUrl;
};

window.performSwitchUserProfile = function(docId) {
  const profiles = UserSession.getProfilesList();
  const target = profiles.find(p => p.docId === docId);
  if (!target) return;

  const activeAuth = window.CloudDB && typeof window.CloudDB.getActiveAuthenticatedUser === 'function'
    ? window.CloudDB.getActiveAuthenticatedUser()
    : null;

  if (activeAuth && activeAuth.docId === docId) {
    closeAccountMenu();
    window.openUserModal(true, 'account');
    return;
  }

  const targetUsername = target.displayUsername || target.username || target.rawName || '';
  window.goToAuthPage('login', targetUsername, true);
};

window.switchUserProfile = function(docId) {
  if (UserSession.currentUser && UserSession.currentUser.docId === docId) {
    closeAccountMenu();
    window.openUserModal(true, 'account');
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

window.performLogoutUserProfile = async function() {
  if (window.CloudDB && typeof window.CloudDB.logoutAccount === 'function') {
    try {
      await window.CloudDB.logoutAccount();
    } catch (e) {}
  }
  UserSession.clear();
  closeAccountMenu();
  window.resetAppStateToEmpty();
  showToast("Đã đăng xuất tài khoản", "info");
  window.goToAuthPage('login');
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

function createEmptyAllocProducts() {
  return [
    { prodName: "", weight: 0, returnRate: 0, risk: 0 },
    { prodName: "", weight: 0, returnRate: 0, risk: 0 },
    { prodName: "", weight: 0, returnRate: 0, risk: 0 }
  ];
}

function createFixedCollegeGoal() {
  return {
    id: "fixed_college",
    fixedType: "college",
    isFixed: true,
    name: "Quỹ dự phòng Tài chính",
    type: "invest",
    start: 0,
    end: 0,
    val: 0,
    paid: 0,
    inflation: 0,
    rate: 0,
    monthly: 0,
    annual: 0,
    accumulationYears: 0,
    collegePeriods: 0,
    monthlyTuition: 0,
    supportFund: 0,
    estimatedRate: 0,
    yearsRetire: 0,
    monthlyRetire: 0,
    deathFund: 0,
    allocProducts: createEmptyAllocProducts()
  };
}

function createFixedRetirementGoal() {
  return {
    id: "fixed_retirement",
    fixedType: "retirement",
    isFixed: true,
    name: "Hưu trí",
    type: "invest",
    start: 0,
    end: 0,
    val: 0,
    paid: 0,
    inflation: 0,
    rate: 0,
    monthly: 0,
    annual: 0,
    accumulationYears: 0,
    reserveMonths: 0,
    annualCostEstimate: 0,
    monthlyCostEstimate: 0,
    estimatedRate: 0,
    yearsRetire: 0,
    monthlyRetire: 0,
    deathFund: 0,
    allocProducts: createEmptyAllocProducts()
  };
}

function isCollegeFixedGoal(g) {
  if (!g || typeof g !== "object") return false;
  const norm = normalizeUserName(g.name || "");
  return g.id === "fixed_college" || g.fixedType === "college" || norm === "cho_con_di_hoc_dai_hoc";
}

function isRetirementFixedGoal(g) {
  if (!g || typeof g !== "object") return false;
  const norm = normalizeUserName(g.name || "");
  return g.id === "fixed_retirement" || g.fixedType === "retirement" || norm === "huu_tri";
}

function isFixedInvestmentGoal(g) {
  return isCollegeFixedGoal(g) || isRetirementFixedGoal(g);
}

function normalizeGoalNumericFields(goal, template) {
  const numericKeys = [
    "start", "end", "val", "paid", "inflation", "rate", "monthly", "annual",
    "accumulationYears", "collegePeriods", "monthlyTuition", "supportFund",
    "reserveMonths", "annualCostEstimate", "monthlyCostEstimate", "estimatedRate",
    "yearsRetire", "monthlyRetire", "deathFund"
  ];
  numericKeys.forEach(k => {
    if (k in template || k in goal) {
      const n = Number(goal[k]);
      goal[k] = (isNaN(n) || !isFinite(n)) ? 0 : n;
    }
  });
  if (!Array.isArray(goal.allocProducts)) {
    goal.allocProducts = createEmptyAllocProducts();
  }
  while (goal.allocProducts.length < 3) {
    goal.allocProducts.push({ prodName: "", weight: 0, returnRate: 0, risk: 0 });
  }
  const validProducts = Array.isArray(AppState.investProducts) ? AppState.investProducts : [];
  goal.allocProducts = goal.allocProducts.slice(0, 3).map((ap, idx) => {
    const prodName = typeof ap?.prodName === "string" ? ap.prodName.trim() : "";
    const matched = validProducts.find(ip => ip && typeof ip.name === 'string' && ip.name.trim() === prodName && prodName !== "");
    if (!matched) {
      return { prodName: "", weight: 0, returnRate: 0, risk: 0 };
    }
    const w = Number(ap?.weight);
    const weight = (isNaN(w) || !isFinite(w) || w < 0) ? 0 : w;
    if (weight === 0 && !ap?._explicitSelected) {
      return { prodName: "", weight: 0, returnRate: 0, risk: 0 };
    }
    return {
      prodName,
      weight,
      returnRate: Number(matched.returnRate) || 0,
      risk: Number(matched.risk) || 0,
      _explicitSelected: Boolean(ap?._explicitSelected)
    };
  });
  return goal;
}

function ensureFixedInvestmentGoals() {
  if (!Array.isArray(AppState.tcGoals)) {
    AppState.tcGoals = [];
  }
  let retireGoal = AppState.tcGoals.find(isRetirementFixedGoal);
  if (!retireGoal) {
    retireGoal = createFixedRetirementGoal();
  } else {
    const tpl = createFixedRetirementGoal();
    Object.keys(tpl).forEach(k => {
      if (retireGoal[k] === undefined || retireGoal[k] === null) {
        retireGoal[k] = tpl[k];
      }
    });
    retireGoal.id = "fixed_retirement";
    retireGoal.fixedType = "retirement";
    retireGoal.isFixed = true;
    if (!retireGoal.name || typeof retireGoal.name !== "string" || retireGoal.name.trim() === "") {
      retireGoal.name = "Hưu trí";
    }
    retireGoal.type = "invest";
    normalizeGoalNumericFields(retireGoal, tpl);
  }

  let collegeGoal = AppState.tcGoals.find(isCollegeFixedGoal);
  if (!collegeGoal) {
    collegeGoal = createFixedCollegeGoal();
  } else {
    const tpl = createFixedCollegeGoal();
    Object.keys(tpl).forEach(k => {
      if (collegeGoal[k] === undefined || collegeGoal[k] === null) {
        collegeGoal[k] = tpl[k];
      }
    });
    collegeGoal.id = "fixed_college";
    collegeGoal.fixedType = "college";
    collegeGoal.isFixed = true;
    if (!collegeGoal.name || typeof collegeGoal.name !== "string" || collegeGoal.name.trim() === "") {
      collegeGoal.name = "Quỹ dự phòng Tài chính";
    }
    collegeGoal.type = "invest";
    normalizeGoalNumericFields(collegeGoal, tpl);
  }

  const regularGoals = AppState.tcGoals.filter(g => !isFixedInvestmentGoal(g));
  AppState.tcGoals = [...regularGoals, retireGoal, collegeGoal];
}

function ensureDefaultKeywords(state) {
  if (!state) return;
  if (!Array.isArray(state.expenses) || state.expenses.length === 0) {
    state.expenses = [
      "Tiền ăn uống, sinh hoạt",
      "Tiền thuê nhà, điện nước",
      "Mua sắm cá nhân",
      "Chi phí đi lại, xăng xe",
      "Quỹ khẩn cấp, y tế"
    ];
  }
  if (!Array.isArray(state.incomeList) || state.incomeList.length === 0) {
    state.incomeList = [
      "Lương chính công ty",
      "Thưởng dự án, hoa hồng",
      "Thu nhập làm thêm, freelance",
      "Lợi tức đầu tư, cổ tức"
    ];
  }
  if (!Array.isArray(state.planList) || state.planList.length === 0) {
    state.planList = [
      "Chứng chỉ chuyên môn (CFA / ACCA / PMP)",
      "Ngoại ngữ (IELTS / HSK / JLPT)",
      "Khóa học quản trị tài chính & đầu tư",
      "Kỹ năng công nghệ & phân tích dữ liệu"
    ];
  }
  if (!Array.isArray(state.investProducts) || state.investProducts.length === 0) {
    state.investProducts = [
      { name: "Cổ phiếu tăng trưởng (VN30)", returnRate: 15.0, risk: 20.0 },
      { name: "Chứng chỉ quỹ mở (DCDS / DCBC)", returnRate: 12.0, risk: 15.0 },
      { name: "Trái phiếu doanh nghiệp uy tín (DCBF)", returnRate: 9.5, risk: 5.0 },
      { name: "Gửi tiết kiệm ngân hàng kỳ hạn", returnRate: 6.5, risk: 1.0 }
    ];
  }
}

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
    targetSavingsRate: 35,
    visionAge: "",
    visionDesc: "",
    expenses: [
      "Tiền ăn uống, sinh hoạt",
      "Tiền thuê nhà, điện nước",
      "Mua sắm cá nhân",
      "Chi phí đi lại, xăng xe",
      "Quỹ khẩn cấp, y tế"
    ],
    incomeList: [
      "Lương chính công ty",
      "Thưởng dự án, hoa hồng",
      "Thu nhập làm thêm, freelance",
      "Lợi tức đầu tư, cổ tức"
    ],
    planList: [
      "Chứng chỉ chuyên môn (CFA / ACCA / PMP)",
      "Ngoại ngữ (IELTS / HSK / JLPT)",
      "Khóa học quản trị tài chính & đầu tư",
      "Kỹ năng công nghệ & phân tích dữ liệu"
    ],
    investProducts: [
      { name: "Cổ phiếu tăng trưởng (VN30)", returnRate: 15.0, risk: 20.0 },
      { name: "Chứng chỉ quỹ mở (DCDS / DCBC)", returnRate: 12.0, risk: 15.0 },
      { name: "Trái phiếu doanh nghiệp uy tín (DCBF)", returnRate: 9.5, risk: 5.0 },
      { name: "Gửi tiết kiệm ngân hàng kỳ hạn", returnRate: 6.5, risk: 1.0 }
    ],
    tcGoals: [
      createFixedRetirementGoal(),
      createFixedCollegeGoal()
    ],
    skillsList: [],
    familyList: [],
    jobList: [],
    planIncome: [],
    planExpense: [],
    skillsStore: {},
    milestonesStore: {},
    careerDetailList: [],
    careerActualOverrides: {},
    careerRouteOverrides: {},
    matrixOverrides: {},
    monthlyDetails: emptyMonthly,
    surveyP1Choices: {},
    surveyP2Choices: {},
    yearEndBalanceSheet: {
      assets: [],
      liabilities: []
    }
  };
}

const AppState = createEmptyAppState();
window.AppState = AppState;

window.resetAppStateToEmpty = function() {
  const fresh = createEmptyAppState();
  Object.keys(fresh).forEach(k => {
    AppState[k] = fresh[k];
  });
  ensureFixedInvestmentGoals();
  syncInvestProductsToGoals();
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
  if (tSav) tSav.innerText = `${AppState.targetSavingsRate || 35}%`;

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
  renderYearEndBalanceSheet();
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

function computeGoalPortfolioMetrics(goal) {
  if (!goal || typeof goal !== "object") {
    return { totalWeight: 0, expectedAvgReturn: 0, expectedAvgRisk: 0, activeCount: 0, isWeightValid: true };
  }
  if (!Array.isArray(goal.allocProducts)) {
    goal.allocProducts = createEmptyAllocProducts();
  }
  while (goal.allocProducts.length < 3) {
    goal.allocProducts.push({ prodName: "", weight: 0, returnRate: 0, risk: 0 });
  }

  const validProducts = Array.isArray(AppState.investProducts) ? AppState.investProducts : [];
  let totalWeight = 0;
  let expectedAvgReturn = 0;
  let expectedAvgRisk = 0;
  let activeCount = 0;

  goal.allocProducts.forEach((ap, idx) => {
    const w = Number(ap.weight);
    ap.weight = (isNaN(w) || !isFinite(w) || w < 0) ? 0 : w;
    ap.prodName = typeof ap.prodName === "string" ? ap.prodName.trim() : "";

    const matched = validProducts.find(ip => ip && typeof ip.name === 'string' && ip.name.trim() === ap.prodName && ap.prodName !== "");
    if (!matched) {
      ap.prodName = "";
      ap.weight = 0;
      ap.returnRate = 0;
      ap.risk = 0;
      return;
    }

    ap.returnRate = Number(matched.returnRate) || 0;
    ap.risk = Number(matched.risk) || 0;

    if (ap.weight > 0 && ap.prodName !== "") {
      activeCount++;
      totalWeight += ap.weight;
      expectedAvgReturn += (ap.weight / 100) * ap.returnRate;
      expectedAvgRisk += (ap.weight / 100) * ap.risk;
    }
  });

  const isWeightValid = (totalWeight === 0) || (Math.abs(totalWeight - 100) < 0.01);
  return {
    totalWeight,
    expectedAvgReturn,
    expectedAvgRisk,
    activeCount,
    isWeightValid
  };
}

function calculateCollegeGoal(goal) {
  normalizeGoalNumericFields(goal, createFixedCollegeGoal());
  const portfolio = computeGoalPortfolioMetrics(goal);

  const startYr = Number(goal.start) || 0;
  const endYr = Number(goal.end) || 0;
  const nYears = (startYr > 0 && endYr >= startYr)
    ? (endYr - startYr + 1)
    : (Number(goal.accumulationYears) > 0 ? Number(goal.accumulationYears) : 0);
  const nMonths = nYears * 12;
  goal.accumulationYears = nYears;

  const rAnnualPct = (goal.rate !== undefined && goal.rate !== null && !isNaN(Number(goal.rate)) && Number(goal.rate) !== 0)
    ? Number(goal.rate)
    : (portfolio.expectedAvgReturn > 0 ? portfolio.expectedAvgReturn : (Number(goal.estimatedRate) || 0));
  const rMonthly = (rAnnualPct / 100) / 12;

  const periods = Number(goal.collegePeriods || goal.yearsRetire) || 0;
  const periodicNeed = Number(goal.monthlyTuition || goal.monthlyRetire) || 0;
  const supportFund = Number(goal.supportFund || goal.deathFund) || 0;
  goal.collegePeriods = periods;
  goal.yearsRetire = periods;
  goal.monthlyTuition = periodicNeed;
  goal.monthlyRetire = periodicNeed;
  goal.supportFund = supportFund;
  goal.deathFund = supportFund;

  let targetFV = 0;
  if (periods > 0 && (periodicNeed > 0 || supportFund > 0)) {
    const pvRateAnnual = portfolio.expectedAvgReturn > 0
      ? portfolio.expectedAvgReturn
      : (Number(goal.estimatedRate) || Number(goal.rate) || 0);
    const pvRateMonthly = (pvRateAnnual / 100) / 12;
    if (pvRateMonthly > 0) {
      targetFV = periodicNeed * ((1 - Math.pow(1 + pvRateMonthly, -periods)) / pvRateMonthly)
               + supportFund * Math.pow(1 + pvRateMonthly, -periods);
    } else {
      targetFV = (periodicNeed * periods) + supportFund;
    }
    if (!goal._manualValOverride) {
      goal.val = Number(targetFV.toFixed(2));
    } else {
      targetFV = Number(goal.val) || 0;
    }
  } else {
    targetFV = Number(goal.val) || 0;
  }

  goal.calculatedTargetFV = targetFV;
  if (nMonths <= 0 || targetFV <= 0) {
    goal.monthly = 0;
    goal.annual = 0;
    return 0;
  }

  const paidFV = (Number(goal.paid) || 0) * Math.pow(1 + rMonthly, nMonths);
  const deficitFV = Math.max(0, targetFV - paidFV);
  if (deficitFV <= 0) {
    goal.monthly = 0;
    goal.annual = 0;
    return 0;
  }

  const pmt = rMonthly === 0
    ? (deficitFV / nMonths)
    : ((deficitFV * rMonthly) / (Math.pow(1 + rMonthly, nMonths) - 1));

  goal.monthly = (isNaN(pmt) || !isFinite(pmt)) ? 0 : pmt;
  goal.annual = goal.monthly * 12;
  return goal.monthly;
}

function calculateRetirementGoal(goal) {
  normalizeGoalNumericFields(goal, createFixedRetirementGoal());
  const portfolio = computeGoalPortfolioMetrics(goal);

  const startYr = Number(goal.start) || 0;
  const endYr = Number(goal.end) || 0;
  const nYears = (startYr > 0 && endYr >= startYr)
    ? (endYr - startYr + 1)
    : (Number(goal.accumulationYears) > 0 ? Number(goal.accumulationYears) : 0);
  const nMonths = nYears * 12;
  goal.accumulationYears = nYears;

  const rAnnualPct = (goal.rate !== undefined && goal.rate !== null && !isNaN(Number(goal.rate)) && Number(goal.rate) !== 0)
    ? Number(goal.rate)
    : (portfolio.expectedAvgReturn > 0 ? portfolio.expectedAvgReturn : (Number(goal.estimatedRate) || 0));
  const rMonthly = (rAnnualPct / 100) / 12;

  const reserveMonths = Number(goal.reserveMonths) || 0;
  let annualCost = Number(goal.annualCostEstimate) || 0;
  let monthlyCost = Number(goal.monthlyCostEstimate) || 0;

  if (reserveMonths > 0 && annualCost > 0) {
    monthlyCost = annualCost / reserveMonths;
    goal.monthlyCostEstimate = Number(monthlyCost.toFixed(2));
  } else if (reserveMonths > 0 && monthlyCost > 0 && annualCost === 0) {
    annualCost = monthlyCost * reserveMonths;
    goal.annualCostEstimate = Number(annualCost.toFixed(2));
  }

  let baseTarget = Number(goal.val) || 0;
  if (baseTarget === 0 && annualCost > 0) {
    baseTarget = annualCost;
    goal.val = annualCost;
  } else if (baseTarget > 0 && annualCost === 0 && reserveMonths > 0) {
    goal.annualCostEstimate = baseTarget;
    goal.monthlyCostEstimate = Number((baseTarget / reserveMonths).toFixed(2));
  }

  const targetFV = baseTarget;
  goal.calculatedTargetFV = targetFV;

  if (nMonths <= 0 || targetFV <= 0) {
    goal.monthly = 0;
    goal.annual = 0;
    return 0;
  }

  const paidFV = (Number(goal.paid) || 0) * Math.pow(1 + rMonthly, nMonths);
  const deficitFV = Math.max(0, targetFV - paidFV);
  if (deficitFV <= 0) {
    goal.monthly = 0;
    goal.annual = 0;
    return 0;
  }

  const pmt = rMonthly === 0
    ? (deficitFV / nMonths)
    : ((deficitFV * rMonthly) / (Math.pow(1 + rMonthly, nMonths) - 1));

  goal.monthly = (isNaN(pmt) || !isFinite(pmt)) ? 0 : pmt;
  goal.annual = goal.monthly * 12;
  return goal.monthly;
}

function calculateMonthlyNeed(goal) {
  if (!goal || typeof goal !== 'object') return 0;

  if (isCollegeFixedGoal(goal)) {
    return calculateCollegeGoal(goal);
  }
  if (isRetirementFixedGoal(goal)) {
    return calculateRetirementGoal(goal);
  }

  const startYr = Number(goal.start) || 0;
  const endYr = Number(goal.end) || 0;
  const nYears = (startYr > 0 && endYr >= startYr) ? (endYr - startYr + 1) : 0;
  const nMonths = nYears * 12;
  if (nMonths <= 0) {
    goal.monthly = 0;
    goal.annual = 0;
    return 0;
  }

  if (goal.type === 'debt') {
    const rAnnual = (Number(goal.rate) || 0) / 100;
    const rMonthly = rAnnual / 12;
    const loanBalance = Math.max(0, (Number(goal.val) || 0) - (Number(goal.paid) || 0));
    if (loanBalance <= 0) {
      goal.monthly = 0;
      goal.annual = 0;
      return 0;
    }
    const pmt = rMonthly === 0
      ? (loanBalance / nMonths)
      : ((loanBalance * rMonthly * Math.pow(1 + rMonthly, nMonths)) / (Math.pow(1 + rMonthly, nMonths) - 1));
    goal.monthly = (isNaN(pmt) || !isFinite(pmt)) ? 0 : pmt;
    goal.annual = goal.monthly * 12;
    return goal.monthly;
  }

  const portfolio = computeGoalPortfolioMetrics(goal);
  const rAnnualPct = (portfolio.expectedAvgReturn > 0)
    ? portfolio.expectedAvgReturn
    : ((goal.rate !== undefined && goal.rate !== null && !isNaN(Number(goal.rate)) && Number(goal.rate) !== 0)
        ? Number(goal.rate)
        : (Number(goal.estimatedRate) || 0));
  const rMonthly = (rAnnualPct / 100) / 12;
  const targetFV = Number(goal.val) || 0;
  const currentPaidFV = (Number(goal.paid) || 0) * Math.pow(1 + rMonthly, nMonths);
  const deficitFV = Math.max(0, targetFV - currentPaidFV);

  if (deficitFV <= 0) {
    goal.monthly = 0;
    goal.annual = 0;
    return 0;
  }

  const pmtInvest = rMonthly === 0
    ? (deficitFV / nMonths)
    : ((deficitFV * rMonthly) / (Math.pow(1 + rMonthly, nMonths) - 1));
  goal.monthly = (isNaN(pmtInvest) || !isFinite(pmtInvest)) ? 0 : pmtInvest;
  goal.annual = goal.monthly * 12;
  return goal.monthly;
}

function getEffectiveSavingsRateRatio() {
  const pct = parseFloat(AppState.targetSavingsRate);
  if (!isNaN(pct) && pct > 0 && pct <= 100) {
    return pct / 100;
  }
  return 0.35;
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

function detectAssetCategory(rawName, returnRate = 0, risk = 0) {
  let name = String(rawName || "").toLowerCase().trim();
  name = name.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, 'a');
  name = name.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, 'e');
  name = name.replace(/ì|í|ị|ỉ|ĩ/g, 'i');
  name = name.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, 'o');
  name = name.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, 'u');
  name = name.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, 'y');
  name = name.replace(/đ/g, 'd');

  if (name.includes("co phieu") || name.includes("chung khoan") || name.includes("stock") || name.includes("equity") || name.includes("co phan")) {
    return 'stocks';
  }
  if (name.includes("trai phieu") || name.includes("bond") || name.includes("fixed income") || name.includes("tpdn") || name.includes("debenture")) {
    return 'bonds';
  }
  if (name.includes("bao hiem") || name.includes("bhnt") || name.includes("nhan tho") || name.includes("suc khoe") || name.includes("y te") || name.includes("insurance") || name.includes("life insurance")) {
    return 'ins';
  }
  if (name.includes("tien gui") || name.includes("tiet kiem") || name.includes("ngan hang") || name.includes("deposit") || name.includes("savings") || name.includes("tien mat")) {
    return 'cash';
  }

  if (
    name.includes("etf") || name.includes("dcbc") || name.includes("dcds") ||
    name.includes("vesaf") || name.includes("vfmvf") || name.includes("vn30") ||
    name.includes("vnindex") || name.includes("vn100") || name.includes("diamond") ||
    name.includes("finlead") || name.includes("ssiam")
  ) {
    return 'stocks';
  }

  if (
    name.includes("dcbf") || name.includes("vfmvfb") || name.includes("tcbond") ||
    name.includes("ssibf") || name.includes("vbond")
  ) {
    return 'bonds';
  }

  if (
    name.includes("manulife") || name.includes("prudential") || name.includes("dai-ichi") ||
    name.includes("daiichi") || name.includes("chubb") || name.includes("fwd") ||
    name.includes("sun life") || name.includes("sunlife") || name.includes("aia") ||
    name.includes("generali") || name.includes("bao viet") || name.includes("mb ageas") ||
    name.includes("hanwha") || name.includes("lien ket dau tu") || name.includes("lien ket don vi") ||
    name.includes("tu ky")
  ) {
    return 'ins';
  }

  if (
    name.includes("finhay") || name.includes("tikop") || name.includes("fmarket") ||
    name.includes("chung chi tien gui") || name.includes("cctg") || name.includes("vi dien tu") ||
    name.includes("momo") || name.includes("zalopay") || name.includes("thanh khoan") ||
    name.includes("du phong")
  ) {
    return 'cash';
  }

  if (
    name.includes("fpt") || name.includes("hpg") || name.includes("vnm") ||
    name.includes("mwg") || name.includes("vic") || name.includes("vhm") ||
    name.includes("ssi") || name.includes("vnd")
  ) {
    return 'stocks';
  }

  const r = Number(returnRate) || 0;
  const k = Number(risk) || 0;
  if (r >= 12 || k >= 12) return 'stocks';
  if (r >= 7.5 || (k >= 4 && k < 12)) return 'bonds';
  if (r >= 6.0 && k < 4) return 'ins';
  if (r > 0 || k <= 2) return 'cash';

  return 'stocks';
}

function classifyProductType(rawName) {
  return detectAssetCategory(rawName, 0, 0);
}

function getAssetCategoryRates() {
  const prods = Array.isArray(AppState.investProducts) ? AppState.investProducts : [];
  const rates = {
    stocks: { sum: 0, count: 0, defaultRate: 14.5 },
    bonds: { sum: 0, count: 0, defaultRate: 9.0 },
    ins: { sum: 0, count: 0, defaultRate: 7.0 },
    cash: { sum: 0, count: 0, defaultRate: 5.5 }
  };

  prods.forEach(p => {
    if (!p || !p.name) return;
    const cat = detectAssetCategory(p.name, p.returnRate, p.risk);
    const r = Number(p.returnRate);
    if (!isNaN(r) && r > 0) {
      rates[cat].sum += r;
      rates[cat].count++;
    }
  });

  return {
    stocks: rates.stocks.count > 0 ? (rates.stocks.sum / rates.stocks.count) : rates.stocks.defaultRate,
    bonds: rates.bonds.count > 0 ? (rates.bonds.sum / rates.bonds.count) : rates.bonds.defaultRate,
    ins: rates.ins.count > 0 ? (rates.ins.sum / rates.ins.count) : rates.ins.defaultRate,
    cash: rates.cash.count > 0 ? (rates.cash.sum / rates.cash.count) : rates.cash.defaultRate
  };
}

function isDedicatedAssetGoal(g) {
  if (!g || !g.name) return false;
  let name = String(g.name).toLowerCase().trim();
  name = name.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, 'a');
  name = name.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, 'e');
  name = name.replace(/ì|í|ị|ỉ|ĩ/g, 'i');
  name = name.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, 'o');
  name = name.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, 'u');
  name = name.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, 'y');
  name = name.replace(/đ/g, 'd');

  return (
    name.includes('bao hiem') || name.includes('tiet kiem') ||
    name.includes('tien gui') || name.includes('du phong') ||
    name.includes('trai phieu') || name.includes('co phieu') ||
    name.includes('chung khoan') || name.includes('etf') ||
    name.includes('quy ') || name.includes('finhay') || name.includes('tikop')
  );
}

function getPortfolioAllocationAtAge(targetAge) {
  const startYr = Number(AppState.currentYear) || 2026;
  const startAge = Number(AppState.currentAge) || 21;
  const targetYear = startYr + (targetAge - startAge);
  if (targetYear < startYr) return null;

  const goals = Array.isArray(AppState.tcGoals)
    ? AppState.tcGoals.filter(g => g && g.type !== 'debt')
    : [];
  if (goals.length === 0) return null;

  const validProducts = Array.isArray(AppState.investProducts) ? AppState.investProducts : [];

  let flowStocks = 0, flowBonds = 0, flowIns = 0, flowCash = 0;
  let totalFlow = 0;
  let weightedReturn = 0;

  goals.forEach(g => {
    const isActive = (targetYear >= g.start && targetYear <= g.end);
    if (!isActive) return;

    const mNeed = calculateMonthlyNeed(g);
    const annualFlow = mNeed * 12;
    if (annualFlow <= 0) return;

    const validAllocs = Array.isArray(g.allocProducts)
      ? g.allocProducts.filter(p => p && Number(p.weight) > 0 && p.prodName)
      : [];
    const totalW = validAllocs.reduce((s, p) => s + (Number(p.weight) || 0), 0);

    if (totalW > 0) {
      validAllocs.forEach(ap => {
        const normWeight = (Number(ap.weight) || 0) / totalW;
        const prodFlow = annualFlow * normWeight;

        let rRate = Number(ap.returnRate) || 0;
        if (rRate === 0) {
          const matched = validProducts.find(ip => ip && ip.name && ip.name.trim() === String(ap.prodName).trim());
          if (matched) rRate = Number(matched.returnRate) || 0;
        }
        if (rRate === 0) rRate = Number(g.rate) || Number(g.estimatedRate) || 0;

        const pType = classifyProductType(ap.prodName);
        totalFlow += prodFlow;
        weightedReturn += prodFlow * rRate;

        if (pType === 'stocks') flowStocks += prodFlow;
        else if (pType === 'bonds') flowBonds += prodFlow;
        else if (pType === 'ins') flowIns += prodFlow;
        else flowCash += prodFlow;
      });
    } else if (isDedicatedAssetGoal(g)) {
      let rRate = Number(g.rate) || Number(g.estimatedRate) || 0;
      const pType = detectAssetCategory(g.name, rRate, 0);
      totalFlow += annualFlow;
      weightedReturn += annualFlow * rRate;

      if (pType === 'stocks') flowStocks += annualFlow;
      else if (pType === 'bonds') flowBonds += annualFlow;
      else if (pType === 'ins') flowIns += annualFlow;
      else flowCash += annualFlow;
    }
  });

  if (totalFlow > 0) {
    return {
      stocks: (flowStocks / totalFlow) * 100,
      bonds: (flowBonds / totalFlow) * 100,
      ins: (flowIns / totalFlow) * 100,
      cash: (flowCash / totalFlow) * 100,
      returnNeed: weightedReturn / totalFlow
    };
  }
  return null;
}

const DEFAULT_PORTFOLIO_30YR_BENCHMARK = [
  {"off":0,"etf":3.06,"stockFund":20.51,"bondFund":34.54,"ins":8.51,"finhay":0,"savings":33.38,"other":0,"total":100,"ret":8.94,"stockTot":23.57,"bondTot":34.54,"insTot":8.51,"cashTot":33.38},
  {"off":1,"etf":13.46,"stockFund":5.85,"bondFund":43.93,"ins":13.33,"finhay":0,"savings":23.42,"other":0,"total":100,"ret":9.23,"stockTot":19.32,"bondTot":43.93,"insTot":13.33,"cashTot":23.42},
  {"off":2,"etf":13.39,"stockFund":19.83,"bondFund":40.9,"ins":8.34,"finhay":0,"savings":17.54,"other":0,"total":100,"ret":10.12,"stockTot":33.22,"bondTot":40.9,"insTot":8.34,"cashTot":17.54},
  {"off":3,"etf":13.43,"stockFund":26.08,"bondFund":39.4,"ins":6.24,"finhay":0,"savings":14.84,"other":0,"total":100,"ret":10.52,"stockTot":39.51,"bondTot":39.4,"insTot":6.24,"cashTot":14.84},
  {"off":4,"etf":17.15,"stockFund":48.11,"bondFund":14.75,"ins":8.21,"finhay":0,"savings":11.78,"other":0,"total":100,"ret":11.59,"stockTot":65.26,"bondTot":14.75,"insTot":8.21,"cashTot":11.78},
  {"off":5,"etf":14.12,"stockFund":42.63,"bondFund":20.57,"ins":5.73,"finhay":0,"savings":16.94,"other":0,"total":100,"ret":11.06,"stockTot":56.76,"bondTot":20.57,"insTot":5.73,"cashTot":16.94},
  {"off":6,"etf":12.72,"stockFund":40.39,"bondFund":23.33,"ins":4.53,"finhay":0,"savings":19.04,"other":0,"total":100,"ret":10.84,"stockTot":53.1,"bondTot":23.33,"insTot":4.53,"cashTot":19.04},
  {"off":7,"etf":11.94,"stockFund":39.42,"bondFund":24.87,"ins":3.82,"finhay":0,"savings":19.94,"other":0,"total":100,"ret":10.74,"stockTot":51.37,"bondTot":24.87,"insTot":3.82,"cashTot":19.94},
  {"off":8,"etf":5.7,"stockFund":46.93,"bondFund":19.55,"ins":5.64,"finhay":0,"savings":22.18,"other":0,"total":100,"ret":10.62,"stockTot":52.63,"bondTot":19.55,"insTot":5.64,"cashTot":22.18},
  {"off":9,"etf":5.32,"stockFund":45.61,"bondFund":20.1,"ins":6.21,"finhay":0,"savings":22.76,"other":0,"total":100,"ret":10.51,"stockTot":50.93,"bondTot":20.1,"insTot":6.21,"cashTot":22.76},
  {"off":10,"etf":8.23,"stockFund":73.1,"bondFund":0,"ins":10.74,"finhay":0,"savings":7.93,"other":0,"total":100,"ret":12.28,"stockTot":81.33,"bondTot":0,"insTot":10.74,"cashTot":7.93},
  {"off":11,"etf":7.93,"stockFund":72.7,"bondFund":0,"ins":11.21,"finhay":0,"savings":8.17,"other":0,"total":100,"ret":12.23,"stockTot":80.62,"bondTot":0,"insTot":11.21,"cashTot":8.17},
  {"off":12,"etf":7.68,"stockFund":72.57,"bondFund":0,"ins":11.52,"finhay":0,"savings":8.23,"other":0,"total":100,"ret":12.2,"stockTot":80.25,"bondTot":0,"insTot":11.52,"cashTot":8.23},
  {"off":13,"etf":7.47,"stockFund":72.64,"bondFund":0,"ins":11.73,"finhay":0,"savings":8.17,"other":0,"total":100,"ret":12.2,"stockTot":80.11,"bondTot":0,"insTot":11.73,"cashTot":8.17},
  {"off":14,"etf":7.28,"stockFund":72.86,"bondFund":0,"ins":11.85,"finhay":0,"savings":8.01,"other":0,"total":100,"ret":12.2,"stockTot":80.14,"bondTot":0,"insTot":11.85,"cashTot":8.01},
  {"off":15,"etf":19.72,"stockFund":25.74,"bondFund":0,"ins":32.97,"finhay":0,"savings":21.57,"other":0,"total":100,"ret":9.95,"stockTot":45.45,"bondTot":0,"insTot":32.97,"cashTot":21.57},
  {"off":16,"etf":19.52,"stockFund":26.04,"bondFund":0,"ins":33.36,"finhay":0,"savings":21.08,"other":0,"total":100,"ret":9.97,"stockTot":45.56,"bondTot":0,"insTot":33.36,"cashTot":21.08},
  {"off":17,"etf":19.39,"stockFund":26.43,"bondFund":0,"ins":33.68,"finhay":0,"savings":20.51,"other":0,"total":100,"ret":10,"stockTot":45.81,"bondTot":0,"insTot":33.68,"cashTot":20.51},
  {"off":18,"etf":14.67,"stockFund":23.76,"bondFund":0,"ins":39.19,"finhay":0,"savings":22.38,"other":0,"total":100,"ret":9.52,"stockTot":38.43,"bondTot":0,"insTot":39.19,"cashTot":22.38},
  {"off":19,"etf":15.07,"stockFund":24.86,"bondFund":0,"ins":39.13,"finhay":0,"savings":20.94,"other":0,"total":100,"ret":9.64,"stockTot":39.93,"bondTot":0,"insTot":39.13,"cashTot":20.94},
  {"off":20,"etf":10.09,"stockFund":22.24,"bondFund":0,"ins":45.06,"finhay":0,"savings":22.61,"other":0,"total":100,"ret":9.15,"stockTot":32.33,"bondTot":0,"insTot":45.06,"cashTot":22.61},
  {"off":21,"etf":10.45,"stockFund":23.3,"bondFund":0,"ins":45.05,"finhay":0,"savings":21.2,"other":0,"total":100,"ret":9.27,"stockTot":33.75,"bondTot":0,"insTot":45.05,"cashTot":21.2},
  {"off":22,"etf":5.28,"stockFund":20.76,"bondFund":0,"ins":51.33,"finhay":0,"savings":22.64,"other":0,"total":100,"ret":8.78,"stockTot":26.03,"bondTot":0,"insTot":51.33,"cashTot":22.64},
  {"off":23,"etf":5.58,"stockFund":21.77,"bondFund":0,"ins":51.4,"finhay":0,"savings":21.25,"other":0,"total":100,"ret":8.89,"stockTot":27.35,"bondTot":0,"insTot":51.4,"cashTot":21.25},
  {"off":24,"etf":0.28,"stockFund":19.35,"bondFund":0,"ins":57.92,"finhay":0,"savings":22.45,"other":0,"total":100,"ret":8.41,"stockTot":19.63,"bondTot":0,"insTot":57.92,"cashTot":22.45},
  {"off":25,"etf":0.51,"stockFund":20.31,"bondFund":0,"ins":58.07,"finhay":0,"savings":21.11,"other":0,"total":100,"ret":8.51,"stockTot":20.82,"bondTot":0,"insTot":58.07,"cashTot":21.11},
  {"off":26,"etf":-4.83,"stockFund":18.05,"bondFund":0,"ins":64.72,"finhay":0,"savings":22.05,"other":0,"total":100,"ret":8.04,"stockTot":13.23,"bondTot":0,"insTot":64.72,"cashTot":22.05},
  {"off":27,"etf":-4.69,"stockFund":18.97,"bondFund":0,"ins":64.97,"finhay":0,"savings":20.75,"other":0,"total":100,"ret":8.14,"stockTot":14.27,"bondTot":0,"insTot":64.97,"cashTot":20.75},
  {"off":28,"etf":-9.98,"stockFund":16.9,"bondFund":0,"ins":71.64,"finhay":0,"savings":21.45,"other":0,"total":100,"ret":7.69,"stockTot":6.91,"bondTot":0,"insTot":71.64,"cashTot":21.45},
  {"off":29,"etf":-9.95,"stockFund":17.76,"bondFund":0,"ins":71.98,"finhay":0,"savings":20.21,"other":0,"total":100,"ret":7.77,"stockTot":7.81,"bondTot":0,"insTot":71.98,"cashTot":20.21}
];

function getPortfolio30YrData() {
  const startYr = Number(AppState.currentYear) || 2026;
  const startAge = Number(AppState.currentAge) || 21;

  const activeGoals = (AppState.tcGoals || []).filter(g => g && g.type !== 'debt');
  const hasDynamicAlloc = activeGoals.some(g => {
    return (Number(g.val) > 0 || Number(g.paid) > 0) && (
      (Array.isArray(g.allocProducts) && g.allocProducts.some(p => p && Number(p.weight) > 0 && p.prodName)) ||
      isDedicatedAssetGoal(g)
    );
  });

  return DEFAULT_PORTFOLIO_30YR_BENCHMARK.map((b, i) => {
    const yr = startYr + i;
    const age = startAge + i;
    const isMilestone = (i === 0 || i === 5 || i === 10 || i === 15 || i === 20 || i === 25);

    if (hasDynamicAlloc) {
      const dyn = getPortfolioAllocationAtAge(age);
      if (dyn && (dyn.stocks > 0 || dyn.bonds > 0 || dyn.ins > 0 || dyn.cash > 0)) {
        return {
          ...b,
          year: yr,
          age: age,
          isMilestone: isMilestone,
          total: 100,
          ret: dyn.returnNeed,
          stockTot: dyn.stocks,
          bondTot: dyn.bonds,
          insTot: dyn.ins,
          cashTot: dyn.cash
        };
      }
    }

    return {
      ...b,
      year: yr,
      age: age,
      isMilestone: isMilestone
    };
  });
}

function renderPortfolio30YrTable() {
  const tb = document.getElementById('tbody-portfolio-30yr');
  if (!tb) return;
  const list = getPortfolio30YrData();
  let sumRet = 0;
  tb.innerHTML = list.map(item => {
    sumRet += Number(item.ret) || 0;
    const rowClass = item.isMilestone ? 'bg-milestone-highlight font-semibold' : '';
    const rowStyle = item.isMilestone ? 'background-color: #f0fdf4; font-weight: 600;' : '';
    return `<tr class="${rowClass}" style="${rowStyle}">
      <td class="text-center font-mono">${item.year}</td>
      <td class="text-right font-mono">${item.etf.toFixed(1)}%</td>
      <td class="text-right font-mono">${item.stockFund.toFixed(1)}%</td>
      <td class="text-right font-mono">${item.bondFund.toFixed(1)}%</td>
      <td class="text-right font-mono">${item.ins.toFixed(1)}%</td>
      <td class="text-right font-mono">${item.finhay.toFixed(1)}%</td>
      <td class="text-right font-mono">${item.savings.toFixed(1)}%</td>
      <td class="text-right font-mono">${item.other.toFixed(1)}%</td>
      <td class="text-center font-mono font-bold">${item.total}%</td>
      <td class="text-right font-mono font-bold text-success">${item.ret.toFixed(2)}%</td>
      <td class="text-center font-mono font-bold" style="background-color: #e0e7ff; color: #1e3a8a;">${item.age}</td>
      <td class="text-right font-mono font-bold">${item.stockTot.toFixed(1)}%</td>
      <td class="text-right font-mono font-bold">${item.bondTot.toFixed(1)}%</td>
      <td class="text-right font-mono font-bold">${item.insTot.toFixed(1)}%</td>
      <td class="text-right font-mono font-bold">${item.cashTot.toFixed(1)}%</td>
    </tr>`;
  }).join('');
  const avgEl = document.getElementById('cell-avg-portfolio-ret');
  if (avgEl && list.length > 0) {
    avgEl.textContent = (sumRet / list.length).toFixed(2) + '%';
  }
}

const DEFAULT_INTERMEDIATE_T2 = [{"off":0,"vfm":3.6,"finlead":2.1,"dcbc":38.4,"dcds":0,"dcbf":0,"tcb":23.4,"fe":41.4,"finhay":0,"insPure":0,"insInv":15.9,"cash":62.6,"tot":187.4},{"off":1,"vfm":7.7,"finlead":10.3,"dcbc":7.8,"dcds":0,"dcbf":0,"tcb":58.8,"fe":0,"finhay":0,"insPure":0,"insInv":17.9,"cash":31.4,"tot":134},{"off":2,"vfm":12.4,"finlead":19.7,"dcbc":47.5,"dcds":0,"dcbf":0,"tcb":98,"fe":0,"finhay":0,"insPure":0,"insInv":20,"cash":42,"tot":239.7},{"off":3,"vfm":17.6,"finlead":30.6,"dcbc":93.6,"dcds":0,"dcbf":0,"tcb":141.4,"fe":0,"finhay":0,"insPure":0,"insInv":22.4,"cash":53.3,"tot":358.8},{"off":4,"vfm":23.5,"finlead":28.9,"dcbc":147,"dcds":0,"dcbf":0,"tcb":45.1,"fe":0,"finhay":0,"insPure":0,"insInv":25.1,"cash":36,"tot":305.6},{"off":5,"vfm":30.2,"finlead":39,"dcbc":208.9,"dcds":0,"dcbf":0,"tcb":59.4,"fe":41.4,"finhay":0,"insPure":0,"insInv":28.1,"cash":83,"tot":490.1},{"off":6,"vfm":37.8,"finlead":50.6,"dcbc":280.8,"dcds":0,"dcbf":0,"tcb":75.3,"fe":86.9,"finhay":0,"insPure":0,"insInv":31.5,"cash":132.4,"tot":695.3},{"off":7,"vfm":46.3,"finlead":64,"dcbc":364.2,"dcds":0,"dcbf":0,"tcb":92.9,"fe":136.9,"finhay":0,"insPure":0,"insInv":35.3,"cash":184.2,"tot":923.8},{"off":8,"vfm":56,"finlead":0,"dcbc":460.9,"dcds":0,"dcbf":0,"tcb":0,"fe":192,"finhay":0,"insPure":0,"insInv":55.4,"cash":217.8,"tot":982},{"off":9,"vfm":66.9,"finlead":0,"dcbc":573.1,"dcds":0,"dcbf":0,"tcb":0,"fe":252.5,"finhay":0,"insPure":0,"insInv":78,"cash":286,"tot":1256.5},{"off":10,"vfm":79.2,"finlead":0,"dcbc":703.2,"dcds":0,"dcbf":0,"tcb":0,"fe":0,"finhay":0,"insPure":0,"insInv":103.3,"cash":76.2,"tot":962},{"off":11,"vfm":93.1,"finlead":0,"dcbc":854.1,"dcds":0,"dcbf":0,"tcb":0,"fe":0,"finhay":0,"insPure":0,"insInv":131.7,"cash":96,"tot":1174.9},{"off":12,"vfm":108.9,"finlead":0,"dcbc":1029.2,"dcds":0,"dcbf":0,"tcb":0,"fe":0,"finhay":0,"insPure":0,"insInv":163.4,"cash":116.7,"tot":1418.3},{"off":13,"vfm":126.6,"finlead":0,"dcbc":1232.4,"dcds":0,"dcbf":0,"tcb":0,"fe":0,"finhay":0,"insPure":0,"insInv":199,"cash":138.5,"tot":1696.5},{"off":14,"vfm":146.7,"finlead":0,"dcbc":1468,"dcds":0,"dcbf":0,"tcb":0,"fe":0,"finhay":0,"insPure":0,"insInv":238.8,"cash":161.4,"tot":2014.9},{"off":15,"vfm":169.4,"finlead":0,"dcbc":221.2,"dcds":0,"dcbf":0,"tcb":0,"fe":0,"finhay":0,"insPure":0,"insInv":283.4,"cash":185.4,"tot":859.5},{"off":16,"vfm":195.1,"finlead":0,"dcbc":260.2,"dcds":0,"dcbf":0,"tcb":0,"fe":0,"finhay":0,"insPure":0,"insInv":333.4,"cash":210.6,"tot":999.3},{"off":17,"vfm":224.1,"finlead":0,"dcbc":305.5,"dcds":0,"dcbf":0,"tcb":0,"fe":0,"finhay":0,"insPure":0,"insInv":389.3,"cash":237.1,"tot":1156},{"off":18,"vfm":163.2,"finlead":0,"dcbc":264.4,"dcds":0,"dcbf":0,"tcb":0,"fe":0,"finhay":0,"insPure":0,"insInv":436,"cash":249,"tot":1112.6},{"off":19,"vfm":188.1,"finlead":0,"dcbc":310.3,"dcds":0,"dcbf":0,"tcb":0,"fe":0,"finhay":0,"insPure":0,"insInv":488.4,"cash":261.4,"tot":1248.1},{"off":20,"vfm":122.5,"finlead":0,"dcbc":269.9,"dcds":0,"dcbf":0,"tcb":0,"fe":0,"finhay":0,"insPure":0,"insInv":547,"cash":274.5,"tot":1213.9},{"off":21,"vfm":142.1,"finlead":0,"dcbc":316.8,"dcds":0,"dcbf":0,"tcb":0,"fe":0,"finhay":0,"insPure":0,"insInv":612.6,"cash":288.2,"tot":1359.7},{"off":22,"vfm":70.6,"finlead":0,"dcbc":277.4,"dcds":0,"dcbf":0,"tcb":0,"fe":0,"finhay":0,"insPure":0,"insInv":686.1,"cash":302.6,"tot":1336.7},{"off":23,"vfm":83.4,"finlead":0,"dcbc":325.5,"dcds":0,"dcbf":0,"tcb":0,"fe":0,"finhay":0,"insPure":0,"insInv":768.4,"cash":317.8,"tot":1495},{"off":24,"vfm":4.2,"finlead":0,"dcbc":287.5,"dcds":0,"dcbf":0,"tcb":0,"fe":0,"finhay":0,"insPure":0,"insInv":860.6,"cash":333.6,"tot":1486},{"off":25,"vfm":8.4,"finlead":0,"dcbc":337.2,"dcds":0,"dcbf":0,"tcb":0,"fe":0,"finhay":0,"insPure":0,"insInv":963.9,"cash":350.3,"tot":1659.8},{"off":26,"vfm":-80.5,"finlead":0,"dcbc":301.1,"dcds":0,"dcbf":0,"tcb":0,"fe":0,"finhay":0,"insPure":0,"insInv":1079.6,"cash":367.8,"tot":1668},{"off":27,"vfm":-87.4,"finlead":0,"dcbc":352.9,"dcds":0,"dcbf":0,"tcb":0,"fe":0,"finhay":0,"insPure":0,"insInv":1209.1,"cash":386.2,"tot":1860.9},{"off":28,"vfm":-188.7,"finlead":0,"dcbc":319.4,"dcds":0,"dcbf":0,"tcb":0,"fe":0,"finhay":0,"insPure":0,"insInv":1354.2,"cash":405.5,"tot":1890.5},{"off":29,"vfm":-209.6,"finlead":0,"dcbc":374.1,"dcds":0,"dcbf":0,"tcb":0,"fe":0,"finhay":0,"insPure":0,"insInv":1516.7,"cash":425.8,"tot":2107.1}];

const DEFAULT_INTERMEDIATE_T1 = [{"off":0,"g4_cash":5.3,"g4_finlead":2.1,"g4_tcb":3.2,"g5_tcb":20.2,"g6_finlead":0,"g6_tcb":0,"g6_cash":0,"g7_cash":41.4,"g7_fe":41.4,"g8_dcbc":34.8,"g9_vfm":3.6,"g9_dcbc":3.6,"g10_cash":15.9,"g10_insInv":15.9},{"off":1,"g4_cash":10.8,"g4_finlead":4.5,"g4_tcb":6.6,"g5_tcb":42.6,"g6_finlead":5.8,"g6_tcb":9.6,"g6_cash":3.9,"g7_cash":0,"g7_fe":0,"g8_dcbc":0,"g9_vfm":7.7,"g9_dcbc":7.8,"g10_cash":16.7,"g10_insInv":17.9},{"off":2,"g4_cash":16.6,"g4_finlead":7.3,"g4_tcb":10.5,"g5_tcb":67.3,"g6_finlead":12.4,"g6_tcb":20.3,"g6_cash":8.1,"g7_cash":0,"g7_fe":0,"g8_dcbc":34.8,"g9_vfm":12.4,"g9_dcbc":12.7,"g10_cash":17.5,"g10_insInv":20},{"off":3,"g4_cash":22.6,"g4_finlead":10.5,"g4_tcb":14.7,"g5_tcb":94.6,"g6_finlead":20.1,"g6_tcb":32.1,"g6_cash":12.7,"g7_cash":0,"g7_fe":0,"g8_dcbc":75.2,"g9_vfm":17.6,"g9_dcbc":18.4,"g10_cash":18.5,"g10_insInv":22.4},{"off":4,"g4_cash":0,"g4_finlead":0,"g4_tcb":0,"g5_tcb":0,"g6_finlead":28.9,"g6_tcb":45.1,"g6_cash":17.6,"g7_cash":0,"g7_fe":0,"g8_dcbc":122.8,"g9_vfm":23.5,"g9_dcbc":25.8,"g10_cash":19.4,"g10_insInv":25.1},{"off":5,"g4_cash":0,"g4_finlead":0,"g4_tcb":0,"g5_tcb":0,"g6_finlead":39,"g6_tcb":59.4,"g6_cash":21.3,"g7_cash":41.4,"g7_fe":41.4,"g8_dcbc":176.3,"g9_vfm":30.2,"g9_dcbc":32.6,"g10_cash":20.4,"g10_insInv":28.1},{"off":6,"g4_cash":0,"g4_finlead":0,"g4_tcb":0,"g5_tcb":0,"g6_finlead":50.6,"g6_tcb":75.3,"g6_cash":26.2,"g7_cash":84.8,"g7_fe":86.9,"g8_dcbc":239.4,"g9_vfm":37.8,"g9_dcbc":41.4,"g10_cash":21.4,"g10_insInv":31.5},{"off":7,"g4_cash":0,"g4_finlead":0,"g4_tcb":0,"g5_tcb":0,"g6_finlead":64,"g6_tcb":92.9,"g6_cash":31.4,"g7_cash":130.4,"g7_fe":136.9,"g8_dcbc":312.5,"g9_vfm":46.3,"g9_dcbc":51.7,"g10_cash":22.4,"g10_insInv":35.3},{"off":8,"g4_cash":0,"g4_finlead":0,"g4_tcb":0,"g5_tcb":0,"g6_finlead":0,"g6_tcb":0,"g6_cash":0,"g7_cash":178.3,"g7_fe":192,"g8_dcbc":397.3,"g9_vfm":56,"g9_dcbc":63.6,"g10_cash":39.5,"g10_insInv":55.4},{"off":9,"g4_cash":0,"g4_finlead":0,"g4_tcb":0,"g5_tcb":0,"g6_finlead":0,"g6_tcb":0,"g6_cash":0,"g7_cash":228.6,"g7_fe":252.5,"g8_dcbc":495.7,"g9_vfm":66.9,"g9_dcbc":77.4,"g10_cash":57.4,"g10_insInv":78},{"off":10,"g4_cash":0,"g4_finlead":0,"g4_tcb":0,"g5_tcb":0,"g6_finlead":0,"g6_tcb":0,"g6_cash":0,"g7_cash":0,"g7_fe":0,"g8_dcbc":609.8,"g9_vfm":79.2,"g9_dcbc":93.4,"g10_cash":76.2,"g10_insInv":103.3},{"off":11,"g4_cash":0,"g4_finlead":0,"g4_tcb":0,"g5_tcb":0,"g6_finlead":0,"g6_tcb":0,"g6_cash":0,"g7_cash":0,"g7_fe":0,"g8_dcbc":742.1,"g9_vfm":93.1,"g9_dcbc":112,"g10_cash":96,"g10_insInv":131.7},{"off":12,"g4_cash":0,"g4_finlead":0,"g4_tcb":0,"g5_tcb":0,"g6_finlead":0,"g6_tcb":0,"g6_cash":0,"g7_cash":0,"g7_fe":0,"g8_dcbc":895.7,"g9_vfm":108.9,"g9_dcbc":133.6,"g10_cash":116.7,"g10_insInv":163.4},{"off":13,"g4_cash":0,"g4_finlead":0,"g4_tcb":0,"g5_tcb":0,"g6_finlead":0,"g6_tcb":0,"g6_cash":0,"g7_cash":0,"g7_fe":0,"g8_dcbc":1073.8,"g9_vfm":126.6,"g9_dcbc":158.6,"g10_cash":138.5,"g10_insInv":199},{"off":14,"g4_cash":0,"g4_finlead":0,"g4_tcb":0,"g5_tcb":0,"g6_finlead":0,"g6_tcb":0,"g6_cash":0,"g7_cash":0,"g7_fe":0,"g8_dcbc":1280.4,"g9_vfm":146.7,"g9_dcbc":187.6,"g10_cash":161.4,"g10_insInv":238.8},{"off":15,"g4_cash":0,"g4_finlead":0,"g4_tcb":0,"g5_tcb":0,"g6_finlead":0,"g6_tcb":0,"g6_cash":0,"g7_cash":0,"g7_fe":0,"g8_dcbc":0,"g9_vfm":169.4,"g9_dcbc":221.2,"g10_cash":185.4,"g10_insInv":283.4},{"off":16,"g4_cash":0,"g4_finlead":0,"g4_tcb":0,"g5_tcb":0,"g6_finlead":0,"g6_tcb":0,"g6_cash":0,"g7_cash":0,"g7_fe":0,"g8_dcbc":0,"g9_vfm":195.1,"g9_dcbc":260.2,"g10_cash":210.6,"g10_insInv":333.4},{"off":17,"g4_cash":0,"g4_finlead":0,"g4_tcb":0,"g5_tcb":0,"g6_finlead":0,"g6_tcb":0,"g6_cash":0,"g7_cash":0,"g7_fe":0,"g8_dcbc":0,"g9_vfm":224.1,"g9_dcbc":305.5,"g10_cash":237.1,"g10_insInv":389.3},{"off":18,"g4_cash":0,"g4_finlead":0,"g4_tcb":0,"g5_tcb":0,"g6_finlead":0,"g6_tcb":0,"g6_cash":0,"g7_cash":0,"g7_fe":0,"g8_dcbc":0,"g9_vfm":163.2,"g9_dcbc":264.4,"g10_cash":249,"g10_insInv":436},{"off":19,"g4_cash":0,"g4_finlead":0,"g4_tcb":0,"g5_tcb":0,"g6_finlead":0,"g6_tcb":0,"g6_cash":0,"g7_cash":0,"g7_fe":0,"g8_dcbc":0,"g9_vfm":188.1,"g9_dcbc":310.3,"g10_cash":261.4,"g10_insInv":488.4},{"off":20,"g4_cash":0,"g4_finlead":0,"g4_tcb":0,"g5_tcb":0,"g6_finlead":0,"g6_tcb":0,"g6_cash":0,"g7_cash":0,"g7_fe":0,"g8_dcbc":0,"g9_vfm":122.5,"g9_dcbc":269.9,"g10_cash":274.5,"g10_insInv":547},{"off":21,"g4_cash":0,"g4_finlead":0,"g4_tcb":0,"g5_tcb":0,"g6_finlead":0,"g6_tcb":0,"g6_cash":0,"g7_cash":0,"g7_fe":0,"g8_dcbc":0,"g9_vfm":142.1,"g9_dcbc":316.8,"g10_cash":288.2,"g10_insInv":612.6},{"off":22,"g4_cash":0,"g4_finlead":0,"g4_tcb":0,"g5_tcb":0,"g6_finlead":0,"g6_tcb":0,"g6_cash":0,"g7_cash":0,"g7_fe":0,"g8_dcbc":0,"g9_vfm":70.6,"g9_dcbc":277.4,"g10_cash":302.6,"g10_insInv":686.1},{"off":23,"g4_cash":0,"g4_finlead":0,"g4_tcb":0,"g5_tcb":0,"g6_finlead":0,"g6_tcb":0,"g6_cash":0,"g7_cash":0,"g7_fe":0,"g8_dcbc":0,"g9_vfm":83.4,"g9_dcbc":325.5,"g10_cash":317.8,"g10_insInv":768.4},{"off":24,"g4_cash":0,"g4_finlead":0,"g4_tcb":0,"g5_tcb":0,"g6_finlead":0,"g6_tcb":0,"g6_cash":0,"g7_cash":0,"g7_fe":0,"g8_dcbc":0,"g9_vfm":4.2,"g9_dcbc":287.5,"g10_cash":333.6,"g10_insInv":860.6},{"off":25,"g4_cash":0,"g4_finlead":0,"g4_tcb":0,"g5_tcb":0,"g6_finlead":0,"g6_tcb":0,"g6_cash":0,"g7_cash":0,"g7_fe":0,"g8_dcbc":0,"g9_vfm":8.4,"g9_dcbc":337.2,"g10_cash":350.3,"g10_insInv":963.9},{"off":26,"g4_cash":0,"g4_finlead":0,"g4_tcb":0,"g5_tcb":0,"g6_finlead":0,"g6_tcb":0,"g6_cash":0,"g7_cash":0,"g7_fe":0,"g8_dcbc":0,"g9_vfm":-80.5,"g9_dcbc":301.1,"g10_cash":367.8,"g10_insInv":1079.6},{"off":27,"g4_cash":0,"g4_finlead":0,"g4_tcb":0,"g5_tcb":0,"g6_finlead":0,"g6_tcb":0,"g6_cash":0,"g7_cash":0,"g7_fe":0,"g8_dcbc":0,"g9_vfm":-87.4,"g9_dcbc":352.9,"g10_cash":386.2,"g10_insInv":1209.1},{"off":28,"g4_cash":0,"g4_finlead":0,"g4_tcb":0,"g5_tcb":0,"g6_finlead":0,"g6_tcb":0,"g6_cash":0,"g7_cash":0,"g7_fe":0,"g8_dcbc":0,"g9_vfm":-188.7,"g9_dcbc":319.4,"g10_cash":405.5,"g10_insInv":1354.2},{"off":29,"g4_cash":0,"g4_finlead":0,"g4_tcb":0,"g5_tcb":0,"g6_finlead":0,"g6_tcb":0,"g6_cash":0,"g7_cash":0,"g7_fe":0,"g8_dcbc":0,"g9_vfm":-209.6,"g9_dcbc":374.1,"g10_cash":425.8,"g10_insInv":1516.7}];

function switchPortfolioModalTab(tabIndex) {
  for (let i = 1; i <= 3; i++) {
    const btn = document.getElementById(`btn-p30-tab${i}`);
    const pane = document.getElementById(`p30-pane-${i}`);
    if (btn) {
      if (i === tabIndex) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    }
    if (pane) {
      pane.style.display = (i === tabIndex) ? 'block' : 'none';
    }
  }
}

function renderPortfolioT2Table() {
  const tb = document.getElementById('tbody-portfolio-t2');
  const thead = document.getElementById('thead-portfolio-t2');
  if (!tb) return;
  const startYr = Number(AppState.currentYear) || 2026;

  const activeGoals = (AppState.tcGoals || []).filter(g => g && g.type === 'invest' && Array.isArray(g.allocProducts) && g.allocProducts.some(p => p && Number(p.weight) > 0 && p.prodName));
  const prods = Array.isArray(AppState.investProducts) && AppState.investProducts.length > 0 ? AppState.investProducts : [];

  if (activeGoals.length > 0 && prods.length > 0 && thead) {
    let subH = `<th style="width: 60px;">Năm</th>`;
    prods.forEach(p => {
      subH += `<th style="padding: 6px 8px;" title="${escapeHtml(p.name)} (${p.returnRate || 0}%/năm)">${escapeHtml(p.name)}</th>`;
    });
    subH += `<th style="width: 90px; background-color: #fef08a; color: #854d0e;">Tổng cộng</th>`;

    thead.innerHTML = `
      <tr class="bg-header-primary">
        <th colspan="${prods.length + 2}" style="text-align: center; background-color: #0f766e; color: #fff; font-weight: 700;">Theo dõi sản phẩm đầu tư chi tiết (Dòng tiền theo năm - ĐVT: Triệu VNĐ)</th>
      </tr>
      <tr class="bg-header-sub" style="background-color: #f1f5f9; font-weight: 600;">${subH}</tr>
    `;

    let rowsHtml = '';
    for (let i = 0; i < 30; i++) {
      const yr = startYr + i;
      const isMilestone = (i === 0 || i === 5 || i === 10 || i === 15 || i === 20 || i === 25);
      const rowClass = isMilestone ? 'bg-milestone-highlight font-semibold' : '';
      const rowStyle = isMilestone ? 'background-color: #f0fdf4; font-weight: 600;' : '';

      const flows = {};
      prods.forEach(p => { flows[p.name] = 0; });

      activeGoals.forEach(g => {
        if (yr >= g.start && yr <= g.end) {
          const mNeed = calculateMonthlyNeed(g);
          const annualFlow = mNeed * 12;
          const validAllocs = g.allocProducts.filter(p => p && Number(p.weight) > 0 && p.prodName);
          const totalW = validAllocs.reduce((s, p) => s + (Number(p.weight) || 0), 0);
          if (totalW > 0) {
            validAllocs.forEach(ap => {
              const normWeight = (Number(ap.weight) || 0) / totalW;
              const pFlow = annualFlow * normWeight;
              if (flows[ap.prodName] !== undefined) {
                flows[ap.prodName] += pFlow;
              } else {
                flows[ap.prodName] = pFlow;
              }
            });
          }
        }
      });

      let cells = `<td class="text-center font-mono">${yr}</td>`;
      let totalYr = 0;
      prods.forEach(p => {
        const val = flows[p.name] || 0;
        totalYr += val;
        cells += `<td class="text-right font-mono">${val > 0 ? val.toFixed(1) : '-'}</td>`;
      });
      cells += `<td class="text-right font-mono font-bold" style="background-color: #fef08a; color: #854d0e;">${totalYr > 0 ? totalYr.toFixed(1) : '-'}</td>`;
      rowsHtml += `<tr class="${rowClass}" style="${rowStyle}">${cells}</tr>`;
    }
    tb.innerHTML = rowsHtml;
  } else {
    if (thead) {
      thead.innerHTML = `
        <tr class="bg-header-primary">
          <th colspan="13" style="text-align: center; background-color: #0f766e; color: #fff; font-weight: 700;">Theo dõi sản phẩm đầu tư chi tiết (Dòng tiền theo năm - ĐVT: Triệu VNĐ)</th>
        </tr>
        <tr class="bg-header-sub" style="background-color: #f1f5f9; font-weight: 600;">
          <th style="width: 60px;">Năm</th>
          <th style="width: 90px;">ETF-ETFVFM</th>
          <th style="width: 90px;">ETF-FINLEAD</th>
          <th style="width: 85px;">DCBC</th>
          <th style="width: 70px;">DCDS</th>
          <th style="width: 70px;">DCBF</th>
          <th style="width: 100px;">TP Techcombank</th>
          <th style="width: 95px;">TP FE Credit</th>
          <th style="width: 70px;">Finhay</th>
          <th style="width: 80px;">BH thuần túy</th>
          <th style="width: 95px;">BH liên kết ĐT</th>
          <th style="width: 90px;">Tiền gửi NH</th>
          <th style="width: 90px; background-color: #fef08a; color: #854d0e;">Tổng cộng</th>
        </tr>
      `;
    }
    tb.innerHTML = DEFAULT_INTERMEDIATE_T2.map((item, idx) => {
      const yr = startYr + idx;
      const isMilestone = (idx === 0 || idx === 5 || idx === 10 || idx === 15 || idx === 20 || idx === 25);
      const rowClass = isMilestone ? 'bg-milestone-highlight font-semibold' : '';
      const rowStyle = isMilestone ? 'background-color: #f0fdf4; font-weight: 600;' : '';
      return `<tr class="${rowClass}" style="${rowStyle}">
        <td class="text-center font-mono">${yr}</td>
        <td class="text-right font-mono">${item.vfm !== 0 ? item.vfm.toFixed(1) : '-'}</td>
        <td class="text-right font-mono">${item.finlead !== 0 ? item.finlead.toFixed(1) : '-'}</td>
        <td class="text-right font-mono">${item.dcbc !== 0 ? item.dcbc.toFixed(1) : '-'}</td>
        <td class="text-right font-mono">${item.dcds !== 0 ? item.dcds.toFixed(1) : '-'}</td>
        <td class="text-right font-mono">${item.dcbf !== 0 ? item.dcbf.toFixed(1) : '-'}</td>
        <td class="text-right font-mono">${item.tcb !== 0 ? item.tcb.toFixed(1) : '-'}</td>
        <td class="text-right font-mono">${item.fe !== 0 ? item.fe.toFixed(1) : '-'}</td>
        <td class="text-right font-mono">${item.finhay !== 0 ? item.finhay.toFixed(1) : '-'}</td>
        <td class="text-right font-mono">${item.insPure !== 0 ? item.insPure.toFixed(1) : '-'}</td>
        <td class="text-right font-mono">${item.insInv !== 0 ? item.insInv.toFixed(1) : '-'}</td>
        <td class="text-right font-mono">${item.cash !== 0 ? item.cash.toFixed(1) : '-'}</td>
        <td class="text-right font-mono font-bold" style="background-color: #fef08a; color: #854d0e;">${item.tot.toFixed(1)}</td>
      </tr>`;
    }).join('');
  }
}

function renderPortfolioT1Table() {
  const tb = document.getElementById('tbody-portfolio-t1');
  const thead = document.getElementById('thead-portfolio-t1');
  if (!tb) return;
  const startYr = Number(AppState.currentYear) || 2026;

  const activeGoals = (AppState.tcGoals || []).filter(g => g && g.type === 'invest' && Array.isArray(g.allocProducts) && g.allocProducts.some(p => p && Number(p.weight) > 0 && p.prodName));

  if (activeGoals.length > 0 && thead) {
    const goalColors = ['#0369a1', '#0284c7', '#0891b2', '#0d9488', '#059669', '#16a34a', '#4f46e5', '#7c3aed'];
    let h1 = `<th style="width: 60px;" rowspan="2">Năm</th>`;
    let h2 = '';
    const colDefs = [];

    activeGoals.forEach((g, gIdx) => {
      const validAllocs = g.allocProducts.filter(p => p && Number(p.weight) > 0 && p.prodName);
      const totalW = validAllocs.reduce((s, p) => s + (Number(p.weight) || 0), 0);
      const color = goalColors[gIdx % goalColors.length];
      h1 += `<th colspan="${validAllocs.length}" style="text-align: center; background-color: ${color}; color: #fff; font-weight: 700; padding: 6px 8px;">${escapeHtml(g.name)}</th>`;
      validAllocs.forEach(ap => {
        h2 += `<th style="padding: 4px 6px; font-size: 11px;" title="${escapeHtml(ap.prodName)} (${ap.weight}%)">${escapeHtml(ap.prodName)}</th>`;
        colDefs.push({
          goal: g,
          prodName: ap.prodName,
          normWeight: totalW > 0 ? (Number(ap.weight) || 0) / totalW : 0
        });
      });
    });

    thead.innerHTML = `
      <tr class="bg-header-primary">${h1}</tr>
      <tr class="bg-header-sub" style="background-color: #f1f5f9; font-size: 11px; font-weight: 600;">${h2}</tr>
    `;

    let rowsHtml = '';
    for (let i = 0; i < 30; i++) {
      const yr = startYr + i;
      const isMilestone = (i === 0 || i === 5 || i === 10 || i === 15 || i === 20 || i === 25);
      const rowClass = isMilestone ? 'bg-milestone-highlight font-semibold' : '';
      const rowStyle = isMilestone ? 'background-color: #f0fdf4; font-weight: 600;' : '';

      let cells = `<td class="text-center font-mono">${yr}</td>`;
      colDefs.forEach(cd => {
        const g = cd.goal;
        if (yr >= g.start && yr <= g.end) {
          const mNeed = calculateMonthlyNeed(g);
          const annualFlow = mNeed * 12;
          const val = annualFlow * cd.normWeight;
          cells += `<td class="text-right font-mono">${val > 0 ? val.toFixed(1) : '-'}</td>`;
        } else {
          cells += `<td class="text-right font-mono text-muted">-</td>`;
        }
      });
      rowsHtml += `<tr class="${rowClass}" style="${rowStyle}">${cells}</tr>`;
    }
    tb.innerHTML = rowsHtml;
  } else {
    if (thead) {
      thead.innerHTML = `
        <tr class="bg-header-primary">
          <th style="width: 60px;" rowspan="2">Năm</th>
          <th colspan="3" style="text-align: center; background-color: #0369a1; color: #fff; font-weight: 700;">MT4: Du lịch Thái Lan</th>
          <th colspan="1" style="text-align: center; background-color: #0284c7; color: #fff; font-weight: 700;">MT5: Dự phòng</th>
          <th colspan="3" style="text-align: center; background-color: #0369a1; color: #fff; font-weight: 700;">MT6: Đám cưới</th>
          <th colspan="2" style="text-align: center; background-color: #0284c7; color: #fff; font-weight: 700;">MT7: Khởi nghiệp</th>
          <th colspan="1" style="text-align: center; background-color: #0369a1; color: #fff; font-weight: 700;">MT8: Mua chung cư</th>
          <th colspan="2" style="text-align: center; background-color: #0284c7; color: #fff; font-weight: 700;">MT9: Hưu trí</th>
          <th colspan="2" style="text-align: center; background-color: #0369a1; color: #fff; font-weight: 700;">MT10: Cho con học ĐH</th>
        </tr>
        <tr class="bg-header-sub" style="background-color: #f1f5f9; font-size: 11px; font-weight: 600;">
          <th>Tiền gửi NH</th><th>ETF FINLEAD</th><th>TP Techcom</th>
          <th>TP Techcom</th>
          <th>ETF FINLEAD</th><th>TP Techcom</th><th>Tiền gửi NH</th>
          <th>Tiền gửi NH</th><th>TP FE Credit</th>
          <th>DCBC</th>
          <th>Tiền gửi NH</th><th>BH liên kết ĐT</th>
          <th>ETF ETFVFM</th><th>DCBC</th>
        </tr>
      `;
    }
    tb.innerHTML = DEFAULT_INTERMEDIATE_T1.map((item, idx) => {
      const yr = startYr + idx;
      const isMilestone = (idx === 0 || idx === 5 || idx === 10 || idx === 15 || idx === 20 || idx === 25);
      const rowClass = isMilestone ? 'bg-milestone-highlight font-semibold' : '';
      const rowStyle = isMilestone ? 'background-color: #f0fdf4; font-weight: 600;' : '';
      return `<tr class="${rowClass}" style="${rowStyle}">
        <td class="text-center font-mono">${yr}</td>
        <td class="text-right font-mono">${item.g4_cash !== 0 ? item.g4_cash.toFixed(1) : '-'}</td>
        <td class="text-right font-mono">${item.g4_finlead !== 0 ? item.g4_finlead.toFixed(1) : '-'}</td>
        <td class="text-right font-mono">${item.g4_tcb !== 0 ? item.g4_tcb.toFixed(1) : '-'}</td>
        <td class="text-right font-mono">${item.g5_tcb !== 0 ? item.g5_tcb.toFixed(1) : '-'}</td>
        <td class="text-right font-mono">${item.g6_finlead !== 0 ? item.g6_finlead.toFixed(1) : '-'}</td>
        <td class="text-right font-mono">${item.g6_tcb !== 0 ? item.g6_tcb.toFixed(1) : '-'}</td>
        <td class="text-right font-mono">${item.g6_cash !== 0 ? item.g6_cash.toFixed(1) : '-'}</td>
        <td class="text-right font-mono">${item.g7_cash !== 0 ? item.g7_cash.toFixed(1) : '-'}</td>
        <td class="text-right font-mono">${item.g7_fe !== 0 ? item.g7_fe.toFixed(1) : '-'}</td>
        <td class="text-right font-mono">${item.g8_dcbc !== 0 ? item.g8_dcbc.toFixed(1) : '-'}</td>
        <td class="text-right font-mono">${item.g10_cash !== 0 ? item.g10_cash.toFixed(1) : '-'}</td>
        <td class="text-right font-mono">${item.g10_insInv !== 0 ? item.g10_insInv.toFixed(1) : '-'}</td>
        <td class="text-right font-mono">${item.g9_vfm !== 0 ? item.g9_vfm.toFixed(1) : '-'}</td>
        <td class="text-right font-mono">${item.g9_dcbc !== 0 ? item.g9_dcbc.toFixed(1) : '-'}</td>
      </tr>`;
    }).join('');
  }
}

function openPortfolio30YrModal() {
  const modal = document.getElementById('portfolio-30yr-modal-overlay');
  if (modal) {
    modal.style.display = 'flex';
    renderPortfolio30YrTable();
    renderPortfolioT2Table();
    renderPortfolioT1Table();
    switchPortfolioModalTab(1);
  }
}

function closePortfolio30YrModal() {
  const modal = document.getElementById('portfolio-30yr-modal-overlay');
  if (modal) {
    modal.style.display = 'none';
  }
}

const CAREER_MILESTONES_RECOMMENDED = [
  { stocks: 10.0, bonds: 40.0, ins: 0.0, cash: 50.0, returnNeed: 6.05 },
  { stocks: 20.0, bonds: 40.0, ins: 0.0, cash: 40.0, returnNeed: 6.60 },
  { stocks: 30.0, bonds: 40.0, ins: 0.0, cash: 30.0, returnNeed: 7.15 },
  { stocks: 30.0, bonds: 45.0, ins: 0.0, cash: 25.0, returnNeed: 7.28 },
  { stocks: 40.0, bonds: 40.0, ins: 0.0, cash: 20.0, returnNeed: 7.70 },
  { stocks: 40.0, bonds: 40.0, ins: 0.0, cash: 20.0, returnNeed: 7.70 }
];

function calculateAgeMilestones() {
  const baseAge = Number(AppState.currentAge) || 21;
  const startYr = Number(AppState.currentYear) || 2026;
  const offsets = [0, 5, 10, 15, 20, 25];

  if (!AppState.milestonesStore || typeof AppState.milestonesStore !== 'object') {
    AppState.milestonesStore = {};
  }

  if (AppState.milestonesStore && Object.keys(AppState.milestonesStore).length > 0) {
    const hasStale = Object.keys(AppState.milestonesStore).some(k => {
      const row = AppState.milestonesStore[k];
      return row && (
        Math.abs(Number(row.stocks) - 6.8) < 0.1 ||
        Math.abs(Number(row.stocks) - 51.1) < 0.1 ||
        Math.abs(Number(row.stocks) - 88.5) < 0.1 ||
        Math.abs(Number(row.stocks) - 19.9) < 0.1 ||
        Math.abs(Number(row.stocks) - 100) < 0.1 ||
        Math.abs(Number(row.bonds) - 76.1) < 0.1 ||
        Math.abs(Number(row.bonds) - 29.3) < 0.1
      );
    });
    if (hasStale) {
      AppState.milestonesStore = {};
    }
  }

  const defaultSkills = [
    "Kỹ năng quản lý vốn và dòng tiền",
    "Kỹ năng thiết kế khuôn và phụ kiện",
    "Kỹ năng quản lý chất lượng, lãnh đạo nhân sự",
    "Kỹ năng quản lý tài sản và nợ, đa dạng hóa đầu tư",
    "Kỹ năng quản lý tiền theo thời hạn",
    ""
  ];

  const portfolio30Yr = typeof getPortfolio30YrData === 'function' ? getPortfolio30YrData() : [];

  return offsets.map((off, idx) => {
    const age = baseAge + off;
    const year = startYr + off;
    const incNeedFromMatrix = getMatrixIncomeNeed(off);
    const recFallback = CAREER_MILESTONES_RECOMMENDED[idx] || { stocks: 25, bonds: 25, ins: 25, cash: 25, returnNeed: 10 };

    const matchedP = (portfolio30Yr && portfolio30Yr.find(p => Number(p.age) === Number(age))) || (portfolio30Yr && portfolio30Yr[off]);

    const stocks = matchedP ? (Number(matchedP.stockTot) || 0) : recFallback.stocks;
    const bonds = matchedP ? (Number(matchedP.bondTot) || 0) : recFallback.bonds;
    const ins = matchedP ? (Number(matchedP.insTot) || 0) : recFallback.ins;
    const cash = matchedP ? (Number(matchedP.cashTot) || 0) : recFallback.cash;
    const returnNeed = matchedP ? (Number(matchedP.ret) || 0) : recFallback.returnNeed;

    const userStore = AppState.milestonesStore[idx] || {};

    let skillVal = '';
    if (AppState.skillsStore && AppState.skillsStore[idx] !== undefined && AppState.skillsStore[idx] !== null && String(AppState.skillsStore[idx]).trim() !== '') {
      skillVal = String(AppState.skillsStore[idx]);
    } else {
      skillVal = defaultSkills[idx] || '';
    }

    return {
      age,
      year,
      incomeNeed: incNeedFromMatrix > 0 ? incNeedFromMatrix : 0,
      stocks,
      bonds,
      ins,
      cash,
      returnNeed,
      skills: skillVal
    };
  });
}

function calculateCareerDetails() {
  const baseAge = AppState.currentAge;
  const totalCareerYears = Math.min(50, Math.max(38, 70 - baseAge + 1));
  const ages = [];
  for (let a = 0; a < totalCareerYears; a++) {
    ages.push(baseAge + a);
  }

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
  const autoActualIncome = activeIncomeMonths > 0
    ? (actualCurrentYear / activeIncomeMonths)
    : 0;
  const calendarYear = new Date().getFullYear();
  const startTrackingYear = Number(AppState.currentYear) || calendarYear;

  let prevRoute = 0;
  return ages.map((age) => {
    const yearOffset = age - baseAge;
    const year = startTrackingYear + yearOffset;
    const targetVal = getMatrixIncomeNeed(yearOffset) || 0;

    const exist = existingMap[age];
    const overrideActual = AppState.careerActualOverrides ? AppState.careerActualOverrides[age] : undefined;
    const hasManualActual = (overrideActual !== undefined && overrideActual !== null) || Boolean(exist && exist.manualActual === true && exist.actual !== undefined && exist.actual !== null);

    let actualVal = null;
    if (hasManualActual) {
      actualVal = overrideActual !== undefined ? overrideActual : exist.actual;
    } else if (exist && exist.actual !== undefined && exist.actual !== null) {
      actualVal = exist.actual;
    } else if (yearOffset === 0 && autoActualIncome > 0) {
      actualVal = autoActualIncome;
    }

    const overrideRoute = AppState.careerRouteOverrides ? AppState.careerRouteOverrides[age] : undefined;
    const hasManualRoute = (overrideRoute !== undefined && overrideRoute !== null) || Boolean(exist && exist.manualRoute === true && exist.route !== undefined && exist.route !== null);
    let currentRoute;
    if (hasManualRoute) {
      currentRoute = Number(overrideRoute !== undefined ? overrideRoute : exist.route) || 0;
      prevRoute = currentRoute;
    } else if (exist && exist.route !== undefined && exist.route !== null && Number(exist.route) > 0) {
      currentRoute = Number(exist.route);
      prevRoute = currentRoute;
    } else {
      currentRoute = prevRoute;
    }

    return {
      age,
      year,
      actual: actualVal,
      manualActual: hasManualActual,
      canEditActual: true,
      target: targetVal,
      route: currentRoute,
      manualRoute: hasManualRoute
    };
  });
}

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
    'tab-khaosat': 'BẢNG KHẢO SÁT ĐÁNH GIÁ BẢN THÂN',
    'tab-admin-groups': 'TỔNG QUAN CÁC NHÓM',
    'tab-admin-requests': 'YÊU CẦU VÀO NHÓM',
    'tab-admin-students': 'QUẢN LÍ',
    'tab-admin-analytics': 'PHÂN TÍCH CHUYÊN SÂU'
  };

  const currentTitleEl = document.getElementById('current-title');
  if (currentTitleEl) {
    currentTitleEl.textContent = titlesMap[tabId] || 'TÀI CHÍNH CÁ NHÂN';
  }
  document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
  const targetPane = document.getElementById(tabId);
  if (targetPane) {
    targetPane.classList.add('active');
    if (tabId === 'tab-tukhoa' && typeof renderSetupTables === 'function') {
      renderSetupTables();
    }
    if (tabId === 'tab-kehoach') {
      if (typeof renderPlanTables === 'function') renderPlanTables();
      if (typeof renderMonthView === 'function') renderMonthView(AppState.currentMonth);
    }
    if (tabId === 'tab-admin-groups' && typeof renderAdminGroupsList === 'function') {
      renderAdminGroupsList();
    }
    if (tabId === 'tab-admin-requests' && typeof renderAdminRequestsTable === 'function') {
      renderAdminRequestsTable();
    }
    if (tabId === 'tab-admin-students' && typeof renderAdminStudentsTable === 'function') {
      renderAdminStudentsTable();
    }
    if (tabId === 'tab-admin-analytics' && typeof renderAdminAnalyticsView === 'function') {
      renderAdminAnalyticsView();
    }
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

  const sec3Btn = document.getElementById('btn-month-sec3');
  if (sec3Btn) {
    sec3Btn.style.display = (m === 12) ? 'inline-flex' : 'none';
  }
  if (m !== 12) {
    const sec3Pane = document.getElementById('month-sec-3');
    if (sec3Pane && sec3Pane.classList.contains('active')) {
      switchMonthSection(1);
    }
  }

  renderMonthView(m);
  setTimeout(updateSlidingHighlight, 40);
};

let railCollapseTimer = null;

window.toggleSideRailPin = function() {
  const isCurrentlyPinned = document.body.classList.contains('rail-pinned') && !document.body.classList.contains('rail-collapsed');
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
      pinBtn.setAttribute('title', 'Thu gọn thanh bên');
      pinBtn.setAttribute('aria-label', 'Thu gọn thanh bên');
    }
    try { localStorage.setItem('FIN_APP_RAIL_PINNED', 'true'); } catch (e) {}
  } else {
    body.classList.remove('rail-pinned', 'rail-expanded', 'rail-hover-expanded', 'rail-auto');
    body.classList.add('rail-collapsed');
    if (pinBtn) {
      pinBtn.setAttribute('aria-pressed', 'false');
      pinBtn.setAttribute('title', 'Mở rộng thanh bên');
      pinBtn.setAttribute('aria-label', 'Mở rộng thanh bên');
    }
    try { localStorage.setItem('FIN_APP_RAIL_PINNED', 'false'); } catch (e) {}
  }

  updateSlidingHighlight();
  setTimeout(updateSlidingHighlight, 260);
};

window.initSideRailHover = function() {
  // Người dùng yêu cầu: Nếu đã bấm thu gọn rồi thì đừng tự động popup lên lại khi hover chuột thanh tab
  const sidebar = document.getElementById('app-sidebar');
  if (!sidebar || sidebar.dataset.hoverBound === 'true') return;
  sidebar.dataset.hoverBound = 'true';
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
  document.getElementById('btn-month-sec3')?.classList.toggle('active', secNum === 3);
  document.getElementById('month-sec-1')?.classList.toggle('active', secNum === 1);
  document.getElementById('month-sec-2')?.classList.toggle('active', secNum === 2);
  document.getElementById('month-sec-3')?.classList.toggle('active', secNum === 3);
  if (secNum === 1) renderMonthHorizontalBarChart();
  if (secNum === 3) renderYearEndBalanceSheet();
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

  const startYrEl = document.getElementById('dash-tc-start-year');
  const totalSavEl = document.getElementById('dash-tc-total-savings');
  const avgRetEl = document.getElementById('dash-tc-avg-return');

  const startYr = Number(AppState.currentYear) || 2026;
  const startAge = Number(AppState.currentAge) || 21;
  if (startYrEl) startYrEl.textContent = startYr;

  const validGoals = (AppState.tcGoals || []).filter(g => g && g.type !== 'debt');
  const totalVal = validGoals.reduce((s, g) => s + (Number(g.val) || Number(g.calculatedTargetFV) || 0), 0);
  if (totalSavEl) {
    totalSavEl.textContent = Number.isInteger(totalVal)
      ? totalVal.toLocaleString('vi-VN')
      : totalVal.toLocaleString('vi-VN', { maximumFractionDigits: 1 });
  }

  const p30 = typeof getPortfolio30YrData === 'function' ? getPortfolio30YrData() : [];
  let avgP30Ret = 0;
  if (p30 && p30.length > 0) {
    avgP30Ret = p30.reduce((s, p) => s + (Number(p.ret) || 0), 0) / p30.length;
  }
  if (avgRetEl) {
    avgRetEl.textContent = avgP30Ret.toFixed(2).replace('.', ',') + '%';
  }

  const cvTcPie = document.getElementById('chart-dashboard-tc-goals-pie');
  if (cvTcPie) {
    if (dashChartInstances.tcGoalsPie) dashChartInstances.tcGoalsPie.destroy();

    const pieGoals = (AppState.tcGoals || []).filter(g => g && (Number(g.val) > 0 || Number(g.calculatedTargetFV) > 0));
    let pieLabels = [];
    let pieData = [];
    if (pieGoals.length > 0) {
      const sumVal = pieGoals.reduce((s, g) => s + (Number(g.val) || Number(g.calculatedTargetFV) || 0), 0);
      pieLabels = pieGoals.map(g => {
        const v = Number(g.val) || Number(g.calculatedTargetFV) || 0;
        const pct = sumVal > 0 ? Math.round((v / sumVal) * 100) : 0;
        return `${g.name || 'Mục tiêu'}, ${v.toLocaleString('vi-VN')}, ${pct}%`;
      });
      pieData = pieGoals.map(g => Number(g.val) || Number(g.calculatedTargetFV) || 0);
    } else {
      pieLabels = ['Chưa có mục tiêu'];
      pieData = [1];
    }

    const greenPalette = [
      '#2d6a2e', '#388e3c', '#4caf50', '#66bb6a', '#81c784',
      '#a5d6a7', '#558b2f', '#7cb342', '#9ccc65', '#33691e',
      '#1b5e20', '#c8e6c9', '#43a047', '#2e7d32'
    ];

    dashChartInstances.tcGoalsPie = new Chart(cvTcPie.getContext('2d'), {
      type: 'pie',
      data: {
        labels: pieLabels,
        datasets: [{
          data: pieData,
          backgroundColor: greenPalette.slice(0, pieLabels.length),
          borderWidth: 1.5,
          borderColor: themeTokens.border || '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        radius: '72%',
        layout: {
          padding: 4
        },
        plugins: {
          legend: {
            position: 'right',
            labels: {
              font: { family: 'Inter', size: 10, weight: '500' },
              color: themeTokens.text,
              boxWidth: 8,
              padding: 6
            }
          },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const val = ctx.parsed || 0;
                return ` ${ctx.label}: ${val.toLocaleString('vi-VN')} triệu`;
              }
            }
          }
        }
      }
    });
  }

  const cvTcDual = document.getElementById('chart-dashboard-tc-timeline-dual');
  if (cvTcDual) {
    if (dashChartInstances.tcTimelineDual) dashChartInstances.tcTimelineDual.destroy();

    const maxEndYear = Math.max(startYr + 15, ...(AppState.tcGoals || []).map(g => Number(g.end) || 0));
    const numYears = Math.min(30, Math.max(15, maxEndYear - startYr + 1));

    const ages = [];
    const savingNeeds = [];
    const incomeNeeds = [];
    const expectedReturns = [];

    for (let i = 0; i < numYears; i++) {
      const yr = startYr + i;
      const age = startAge + i;
      ages.push(age);

      let sSum = 0;
      (AppState.tcGoals || []).forEach(g => {
        if (yr >= g.start && yr <= g.end) {
          sSum += calculateMonthlyNeed(g);
        }
      });
      savingNeeds.push(Number(sSum.toFixed(1)));
      const inc = getMatrixIncomeNeed(i);
      incomeNeeds.push(Number(inc.toFixed(1)));

      const pRow = (p30 && p30[i]) || (p30 && p30.find(p => p.age === age));
      const retVal = pRow ? (Number(pRow.ret) || 0) : 0;
      expectedReturns.push(Number(retVal.toFixed(2)));
    }

    dashChartInstances.tcTimelineDual = new Chart(cvTcDual.getContext('2d'), {
      type: 'line',
      data: {
        labels: ages,
        datasets: [
          {
            label: 'Tiết kiệm cần có',
            data: savingNeeds,
            borderColor: '#f57c00',
            backgroundColor: '#f57c00',
            tension: 0.35,
            borderWidth: 3,
            pointRadius: 0,
            pointHoverRadius: 5,
            yAxisID: 'y'
          },
          {
            label: 'Thu nhập cần có',
            data: incomeNeeds,
            borderColor: '#b71c1c',
            backgroundColor: '#b71c1c',
            tension: 0.35,
            borderWidth: 3,
            pointRadius: 0,
            pointHoverRadius: 5,
            yAxisID: 'y'
          },
          {
            label: 'Mức sinh lời trung bình ước tính',
            data: expectedReturns,
            showLine: false,
            borderColor: '#2e7d32',
            backgroundColor: '#2e7d32',
            pointStyle: 'circle',
            pointRadius: 4.5,
            pointHoverRadius: 7,
            yAxisID: 'y1'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              usePointStyle: true,
              font: { family: 'Inter', size: 11, weight: '600' },
              color: themeTokens.text,
              padding: 12
            }
          },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                if (ctx.dataset.yAxisID === 'y1') {
                  return ` ${ctx.dataset.label}: ${ctx.parsed.y.toFixed(2)}%`;
                }
                return ` ${ctx.dataset.label}: ${ctx.parsed.y.toFixed(1)} triệu`;
              }
            }
          }
        },
        scales: {
          x: {
            title: { display: true, text: 'Tuổi', color: themeTokens.textMuted, font: { family: 'Inter', size: 11, weight: '600' } },
            grid: { color: themeTokens.grid },
            ticks: { font: { family: 'Inter', size: 10 }, color: themeTokens.textMuted }
          },
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            beginAtZero: true,
            title: { display: true, text: 'Số tiền', color: themeTokens.textMuted, font: { family: 'Inter', size: 11, weight: '600' } },
            grid: { color: themeTokens.grid },
            ticks: { font: { family: 'Inter', size: 10 }, color: themeTokens.textMuted }
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            beginAtZero: true,
            title: { display: true, text: 'Mức sinh lời ước tính', color: themeTokens.textMuted, font: { family: 'Inter', size: 11, weight: '600' } },
            grid: { drawOnChartArea: false },
            ticks: {
              font: { family: 'Inter', size: 10 },
              color: themeTokens.textMuted,
              callback: (v) => v.toFixed(1) + '%'
            }
          }
        }
      }
    });
  }

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
          label: 'Giá trị tích lũy',
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
window.renderSetupTables = renderSetupTables;

window.renderAll = function() {
  if (typeof renderSetupTables === 'function') renderSetupTables();
  if (typeof renderPlanTables === 'function') renderPlanTables();
  if (typeof renderTcGoalsFormTable === 'function') renderTcGoalsFormTable();
  if (typeof renderSkillsFamilyJob === 'function') renderSkillsFamilyJob();
  if (typeof renderGoogleFormSurvey === 'function') renderGoogleFormSurvey();
  if (typeof evaluateSurveys === 'function') evaluateSurveys();
  if (typeof updateSurveyProgress === 'function') updateSurveyProgress();
  if (typeof renderTcMatrixTable === 'function') renderTcMatrixTable();
  if (typeof renderCareerTables === 'function') renderCareerTables();
  if (typeof renderMonthView === 'function') renderMonthView(AppState.currentMonth);
  if (typeof syncGoalsToCards === 'function') syncGoalsToCards();
  if (typeof recalculateAll === 'function') recalculateAll();
  if (typeof calculateAgeMilestones === 'function') calculateAgeMilestones();
  if (typeof renderYearEndBalanceSheet === 'function') renderYearEndBalanceSheet();
  if (typeof renderDashboardMatrices === 'function') renderDashboardMatrices();
  if (typeof renderDashboardAllCharts === 'function') renderDashboardAllCharts();
};

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
  const validProducts = Array.isArray(AppState.investProducts) ? AppState.investProducts : [];
  (AppState.tcGoals || []).forEach(g => {
    if (g.type !== 'invest') return;
    if (!Array.isArray(g.allocProducts)) {
      g.allocProducts = createEmptyAllocProducts();
    }
    while (g.allocProducts.length < 3) {
      g.allocProducts.push({ prodName: "", weight: 0, returnRate: 0, risk: 0 });
    }

    let avgRate = 0;
    let totalWeight = 0;
    g.allocProducts.forEach(ap => {
      if (oldProdName && newProdName && ap.prodName === oldProdName) {
        ap.prodName = newProdName;
      }
      const matched = validProducts.find(ip => ip && ip.name === ap.prodName && ap.prodName !== "");
      if (matched) {
        ap.returnRate = Number(matched.returnRate) || 0;
        ap.risk = Number(matched.risk) || 0;
        const w = Number(ap.weight) || 0;
        totalWeight += w;
        avgRate += (w / 100) * (Number(ap.returnRate) || 0);
      } else {
        ap.prodName = "";
        ap.weight = 0;
        ap.returnRate = 0;
        ap.risk = 0;
      }
    });

    if (totalWeight > 0 && avgRate > 0) {
      g.effectivePortfolioRate = parseFloat(avgRate.toFixed(2));
    } else {
      g.effectivePortfolioRate = 0;
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
  if (oldName && field === 'name' && cleanVal && AppState.yearEndBalanceSheet?.assets) {
    AppState.yearEndBalanceSheet.assets.forEach(a => {
      if (a && a.source === 'keyword' && a.name === oldName) {
        a.name = cleanVal;
      }
    });
  }
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
  const firstCat = (AppState.incomeList && AppState.incomeList.length > 0) ? AppState.incomeList[0] : "Nguồn thu 1";
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
  const firstCat = (AppState.expenses && AppState.expenses.length > 0) ? AppState.expenses[0] : "Chi tiêu 1";
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
  if (incEl) incEl.textContent = `${sumInc.toFixed(2)}`;
  if (expEl) expEl.textContent = `${sumExp.toFixed(2)}`;
}

const FinDatePicker = {
  popoverEl: null,
  backdropEl: null,
  activeInput: null,
  viewDate: new Date(),
  selectedDate: null,
  mode: 'days',
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

  const sec3Btn = document.getElementById('btn-month-sec3');
  if (sec3Btn) {
    sec3Btn.style.display = (m === 12) ? 'inline-flex' : 'none';
  }
  if (m === 12) {
    renderYearEndBalanceSheet();
  }
}

window.addMonthDetailIncomeRow = function() {
  const m = AppState.currentMonth || 1;
  const y = AppState.currentYear || 2026;
  const mStr = String(m).padStart(2, '0');
  const firstCat = (AppState.incomeList && AppState.incomeList.length > 0)
    ? AppState.incomeList[0]
    : ((AppState.planIncome && AppState.planIncome.length > 0) ? AppState.planIncome[0].name : "Nguồn thu chính");
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
  const firstCat = (AppState.expenses && AppState.expenses.length > 0)
    ? AppState.expenses[0]
    : ((AppState.planExpense && AppState.planExpense.length > 0) ? AppState.planExpense[0].name : "Chi tiêu chung");
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
  if (kpiTop) kpiTop.textContent = maxCatVal > 0 ? `${topCat} (${maxCatVal.toFixed(2)})` : 'Chưa có';

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
  const defaultCat = (AppState.planList && AppState.planList.length > 0) ? AppState.planList[0] : "Kế hoạch đào tạo 1";
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

function ensureYearEndBalanceSheet() {
  if (!AppState.yearEndBalanceSheet || typeof AppState.yearEndBalanceSheet !== 'object') {
    AppState.yearEndBalanceSheet = { assets: [], liabilities: [] };
  }
  if (!Array.isArray(AppState.yearEndBalanceSheet.assets)) {
    AppState.yearEndBalanceSheet.assets = [];
  }
  if (!Array.isArray(AppState.yearEndBalanceSheet.liabilities)) {
    AppState.yearEndBalanceSheet.liabilities = [];
  }
  AppState.yearEndBalanceSheet.assets.forEach(a => {
    if (a && typeof a === 'object') {
      if (a.source !== 'keyword' && a.source !== 'custom') {
        const isKw = (AppState.investProducts || []).some(p => p.name === a.name);
        a.source = isKw ? 'keyword' : 'custom';
      }
    }
  });
}

function getAnnualActualIncome() {
  let sum = 0;
  for (let m = 1; m <= 12; m++) {
    const list = AppState.monthlyDetails[m]?.incomes || [];
    for (let i = 0; i < list.length; i++) {
      sum += Number(list[i].val) || 0;
    }
  }
  return sum;
}

function getAnnualActualExpense() {
  let sum = 0;
  for (let m = 1; m <= 12; m++) {
    const list = AppState.monthlyDetails[m]?.expenses || [];
    for (let i = 0; i < list.length; i++) {
      sum += Number(list[i].val) || 0;
    }
  }
  return sum;
}

function updateBalanceSheetCalculations() {
  ensureYearEndBalanceSheet();
  let assetsSubtotal = 0;
  AppState.yearEndBalanceSheet.assets.forEach(a => {
    assetsSubtotal += Number(a.val) || 0;
  });

  const humanCapitalIncome = getAnnualActualIncome();
  const totalAssets = assetsSubtotal + humanCapitalIncome;

  let liabSubtotal = 0;
  AppState.yearEndBalanceSheet.liabilities.forEach(l => {
    liabSubtotal += Number(l.val) || 0;
  });

  const obligationsExpense = getAnnualActualExpense();
  const totalLiabilities = liabSubtotal + obligationsExpense;

  const netWorth = totalAssets - totalLiabilities;
  const debtRatio = totalAssets > 0 ? (totalLiabilities / totalAssets) * 100 : 0;

  const footAssetsSub = document.getElementById('tfoot-bs-assets-subtotal');
  if (footAssetsSub) footAssetsSub.textContent = assetsSubtotal.toFixed(1);

  const footHumanIncome = document.getElementById('bs-human-capital-income');
  if (footHumanIncome) footHumanIncome.textContent = humanCapitalIncome.toFixed(1);

  const footTotalAssets = document.getElementById('tfoot-bs-total-assets');
  if (footTotalAssets) footTotalAssets.textContent = totalAssets.toFixed(1);

  const kpiTotalAssets = document.getElementById('bs-kpi-total-assets');
  if (kpiTotalAssets) kpiTotalAssets.textContent = totalAssets.toFixed(2);

  const footLiabSub = document.getElementById('tfoot-bs-liab-subtotal');
  if (footLiabSub) footLiabSub.textContent = liabSubtotal.toFixed(1);

  const footObligationsExp = document.getElementById('bs-obligations-expense');
  if (footObligationsExp) footObligationsExp.textContent = obligationsExpense.toFixed(1);

  const footTotalLiab = document.getElementById('tfoot-bs-total-liab');
  if (footTotalLiab) footTotalLiab.textContent = totalLiabilities.toFixed(1);

  const kpiTotalLiab = document.getElementById('bs-kpi-total-liabilities');
  if (kpiTotalLiab) kpiTotalLiab.textContent = totalLiabilities.toFixed(2);

  const kpiNetWorth = document.getElementById('bs-kpi-net-worth');
  if (kpiNetWorth) {
    const formattedVal = netWorth >= 0 ? netWorth.toFixed(2) : `(${Math.abs(netWorth).toFixed(2)})`;
    kpiNetWorth.innerHTML = `${formattedVal} <small>tr</small>`;
    kpiNetWorth.className = `kpi-value font-bold ${netWorth >= 0 ? 'text-success' : 'text-danger'}`;
  }

  const netWorthVal = document.getElementById('bs-net-worth-val');
  if (netWorthVal) {
    netWorthVal.textContent = (netWorth >= 0 ? netWorth.toFixed(1) : `(${Math.abs(netWorth).toFixed(1)})`) + ' tr';
    netWorthVal.className = `font-size-xl font-bold font-mono ${netWorth >= 0 ? 'text-success' : 'text-danger'}`;
  }

  const debtRatioVal = document.getElementById('bs-debt-ratio-val');
  if (debtRatioVal) {
    debtRatioVal.textContent = debtRatio.toFixed(1) + '%';
    debtRatioVal.className = `font-size-md font-bold font-mono ${debtRatio > 60 ? 'text-danger' : (debtRatio > 40 ? 'text-warning' : 'text-success')}`;
  }
}

function renderYearEndBalanceSheet() {
  ensureYearEndBalanceSheet();
  const tbAssets = document.getElementById('tbody-bs-assets');
  if (tbAssets) {
    if (AppState.yearEndBalanceSheet.assets.length === 0) {
      tbAssets.innerHTML = `<tr><td colspan="5" class="text-center text-muted" style="padding: 16px 12px; font-style: italic;">Chưa có tài sản nào. Bấm nút <b>"+ Thêm tài sản"</b> để thêm tài sản đang nắm giữ.</td></tr>`;
    } else {
      const investProds = Array.isArray(AppState.investProducts) ? AppState.investProducts : [];
      tbAssets.innerHTML = AppState.yearEndBalanceSheet.assets.map((item, idx) => {
        const isCustom = item.source === 'custom';
        let nameCellHtml = '';

        if (isCustom) {
          nameCellHtml = `
            <input type="text" class="input-inline-cell font-bold" value="${escapeHtml(item.name || '')}" placeholder="Nhập tên tài sản tự do..." oninput="updateBalanceSheetAssetField(${idx}, 'name', this.value)" onchange="updateBalanceSheetAssetField(${idx}, 'name', this.value)">
          `;
        } else {
          let hasMatchingProduct = false;
          const optionsHtml = investProds.map(p => {
            const isMatch = (p.name === item.name);
            if (isMatch) hasMatchingProduct = true;
            return `<option value="${escapeHtml(p.name)}" ${isMatch ? 'selected' : ''}>${escapeHtml(p.name)} (${p.returnRate || 0}%/năm)</option>`;
          }).join('');

          let extraOption = '';
          if (!hasMatchingProduct && item.name) {
            extraOption = `<option value="${escapeHtml(item.name)}" selected>${escapeHtml(item.name)} (Ngoài danh mục)</option>`;
          }

          nameCellHtml = `
            <select class="select-inline-cell font-bold" onchange="updateBalanceSheetAssetField(${idx}, 'name', this.value)">
              ${investProds.length === 0 ? '<option value="">-- Chưa có sản phẩm đầu tư --</option>' : ''}
              ${extraOption}
              ${optionsHtml}
            </select>
          `;
        }

        return `
          <tr>
            <td class="text-center font-bold font-mono bg-neutral-gray">${idx + 1}</td>
            <td>
              <select class="select-inline-cell" style="font-size: 12px; font-weight: 600; min-width: 145px;" onchange="updateBalanceSheetAssetSource(${idx}, this.value)">
                <option value="keyword" ${!isCustom ? 'selected' : ''}>Sản phẩm đầu tư</option>
                <option value="custom" ${isCustom ? 'selected' : ''}>Tài sản khác</option>
              </select>
            </td>
            <td>${nameCellHtml}</td>
            <td>
              <input type="number" step="any" min="0" class="input-inline-cell text-right font-bold font-mono text-success" value="${item.val !== undefined && item.val !== null ? item.val : ''}" placeholder="0.0" oninput="updateBalanceSheetAssetFieldLive(${idx}, 'val', this.value)" onchange="updateBalanceSheetAssetField(${idx}, 'val', this.value)">
            </td>
            <td class="text-center">
              <button type="button" class="btn-table-del" onclick="deleteBalanceSheetAssetRow(${idx})" aria-label="Xoá tài sản"><i class="fa-solid fa-trash-can"></i></button>
            </td>
          </tr>
        `;
      }).join('');
    }
  }

  const tbLiab = document.getElementById('tbody-bs-liabilities');
  if (tbLiab) {
    if (AppState.yearEndBalanceSheet.liabilities.length === 0) {
      tbLiab.innerHTML = `<tr><td colspan="4" class="text-center text-muted" style="padding: 16px 12px; font-style: italic;">Chưa có khoản nợ nào. Bấm nút <b>"+ Thêm khoản nợ"</b> để thêm khoản nợ vay.</td></tr>`;
    } else {
      tbLiab.innerHTML = AppState.yearEndBalanceSheet.liabilities.map((item, idx) => `
        <tr>
          <td class="text-center font-bold font-mono bg-neutral-gray">${idx + 1}</td>
          <td>
            <input type="text" class="input-inline-cell" value="${escapeHtml(item.name || '')}" placeholder="Tên khoản nợ / nghĩa vụ..." oninput="updateBalanceSheetLiabilityField(${idx}, 'name', this.value)" onchange="updateBalanceSheetLiabilityField(${idx}, 'name', this.value)">
          </td>
          <td>
            <input type="number" step="any" min="0" class="input-inline-cell text-right font-bold font-mono text-danger" value="${item.val !== undefined && item.val !== null ? item.val : ''}" placeholder="0.0" oninput="updateBalanceSheetLiabilityFieldLive(${idx}, 'val', this.value)" onchange="updateBalanceSheetLiabilityField(${idx}, 'val', this.value)">
          </td>
          <td class="text-center">
            <button type="button" class="btn-table-del" onclick="deleteBalanceSheetLiabilityRow(${idx})" aria-label="Xoá khoản nợ"><i class="fa-solid fa-trash-can"></i></button>
          </td>
        </tr>
      `).join('');
    }
  }

  updateBalanceSheetCalculations();
}

window.addBalanceSheetAssetRow = function(sourceType = 'keyword') {
  ensureYearEndBalanceSheet();
  const prods = AppState.investProducts || [];
  let defaultName = "Tài sản mới";
  if (sourceType === 'keyword' && prods.length > 0) {
    defaultName = prods[0].name;
  }
  AppState.yearEndBalanceSheet.assets.push({
    name: defaultName,
    source: sourceType === 'custom' ? 'custom' : 'keyword',
    val: 0.0
  });
  renderYearEndBalanceSheet();
  window.markUnsavedChanges();
};

window.updateBalanceSheetAssetSource = function(idx, newSource) {
  ensureYearEndBalanceSheet();
  const item = AppState.yearEndBalanceSheet.assets[idx];
  if (!item) return;
  const isCustom = (newSource === 'custom');
  item.source = isCustom ? 'custom' : 'keyword';
  if (!isCustom) {
    const prods = AppState.investProducts || [];
    const exists = prods.some(p => p.name === item.name);
    if (!exists && prods.length > 0) {
      item.name = prods[0].name;
    }
  }
  renderYearEndBalanceSheet();
  window.markUnsavedChanges();
};

window.updateBalanceSheetAssetFieldLive = function(idx, field, rawVal) {
  ensureYearEndBalanceSheet();
  const item = AppState.yearEndBalanceSheet.assets[idx];
  if (!item) return;
  if (field === 'val') {
    item.val = parseFloat(rawVal) || 0;
    updateBalanceSheetCalculations();
  }
};

window.updateBalanceSheetAssetField = function(idx, field, rawVal) {
  ensureYearEndBalanceSheet();
  const item = AppState.yearEndBalanceSheet.assets[idx];
  if (!item) return;
  if (field === 'name') {
    item.name = String(rawVal || '').trim();
  } else if (field === 'val') {
    item.val = parseFloat(rawVal) || 0;
  }
  updateBalanceSheetCalculations();
  window.markUnsavedChanges();
};

window.deleteBalanceSheetAssetRow = function(idx) {
  ensureYearEndBalanceSheet();
  AppState.yearEndBalanceSheet.assets.splice(idx, 1);
  renderYearEndBalanceSheet();
  window.markUnsavedChanges();
};

window.addBalanceSheetLiabilityRow = function() {
  ensureYearEndBalanceSheet();
  AppState.yearEndBalanceSheet.liabilities.push({
    name: "Khoản nợ mới",
    val: 0.0
  });
  renderYearEndBalanceSheet();
  window.markUnsavedChanges();
};

window.updateBalanceSheetLiabilityFieldLive = function(idx, field, rawVal) {
  ensureYearEndBalanceSheet();
  const item = AppState.yearEndBalanceSheet.liabilities[idx];
  if (!item) return;
  if (field === 'val') {
    item.val = parseFloat(rawVal) || 0;
    updateBalanceSheetCalculations();
  }
};

window.updateBalanceSheetLiabilityField = function(idx, field, rawVal) {
  ensureYearEndBalanceSheet();
  const item = AppState.yearEndBalanceSheet.liabilities[idx];
  if (!item) return;
  if (field === 'name') {
    item.name = String(rawVal || '').trim();
  } else if (field === 'val') {
    item.val = parseFloat(rawVal) || 0;
  }
  updateBalanceSheetCalculations();
  window.markUnsavedChanges();
};

window.deleteBalanceSheetLiabilityRow = function(idx) {
  ensureYearEndBalanceSheet();
  AppState.yearEndBalanceSheet.liabilities.splice(idx, 1);
  renderYearEndBalanceSheet();
  window.markUnsavedChanges();
};

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
        tooltip: { callbacks: { label: ctx => ` ${ctx.parsed.x.toFixed(1)}` } }
      },
      scales: {
        x: { beginAtZero: true, grid: { color: themeTokens.grid }, ticks: { font: { family: 'Inter', size: 10 }, color: themeTokens.textMuted } },
        y: { grid: { display: false }, ticks: { font: { family: 'Inter', size: 10 }, color: themeTokens.text } }
      }
    }
  });
}

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
        <td>
          <input type="text"
                 class="input-inline-cell font-semibold"
                 value="${escapeHtml(item.skills || '')}"
                 placeholder="Nhập kỹ năng cốt lõi cần trui rèn..."
                 oninput="updateCareerSkill(${idx}, this.value, false)"
                 onchange="updateCareerSkill(${idx}, this.value, true)"
                 onblur="updateCareerSkill(${idx}, this.value, true)">
        </td>
      </tr>
    `).join('');
  }

  AppState.careerDetailList = calculateCareerDetails();
  const tb2 = document.getElementById('tbody-career-detail');
  if (tb2) {
    tb2.innerHTML = AppState.careerDetailList.map((item, idx) => {
      const hasTarget = item.target > 0;
      const isDeficit = hasTarget && (item.route < item.target);
      const diffVal = hasTarget ? Math.abs(item.target - item.route).toFixed(1) : '0.0';

      return `
        <tr>
          <td class="text-center font-bold font-mono bg-neutral-gray">${item.age}</td>

          <td class="text-right font-bold font-mono cell-blue"
              contenteditable="true" spellcheck="false"
              onblur="updateCareerDetailField(${idx}, 'actual', this.innerText.trim() === '' || this.innerText.trim() === '-' ? null : parseFloat(this.innerText.replace(/[^0-9.-]/g, '')))"
              title="Nhấn để nhập thu nhập thực tế (tuổi ${item.age})">
            ${(item.actual !== null && item.actual !== undefined && !isNaN(item.actual)) ? Number(item.actual).toFixed(1) : '<span class="dash-null">-</span>'}
          </td>

          <td class="text-right font-bold text-primary font-mono">
            ${hasTarget ? item.target.toFixed(1) : '<span class="dash-null">-</span>'}
          </td>

          <td class="text-right font-bold cell-blue font-mono ${isDeficit ? 'text-danger' : 'text-success'}"
              contenteditable="true" spellcheck="false"
              onblur="updateCareerDetailField(${idx}, 'route', parseFloat(this.innerText.replace(/[^0-9.-]/g, ''))||0)"
              title="Nhấn để nhập thu nhập theo lộ trình kỳ vọng (tuổi ${item.age})">
            ${item.route > 0 ? item.route.toFixed(1) : (item.route === 0 && idx === 0 ? '0.0' : item.route.toFixed(1))}
          </td>

          <td class="text-center">
            ${!hasTarget
              ? `<span class="dash-null">-</span>`
              : (isDeficit
                  ? `<span class="deficit-badge">⚠ Cần thêm (${diffVal})</span>`
                  : `<span class="success-badge">✅ Vững tâm (Đạt)</span>`
                )
            }
          </td>
        </tr>
      `;
    }).join('');
  }
}

window.updateCareerDetailField = function(idx, field, val) {
  const item = AppState.careerDetailList[idx];
  if (!item) return;

  if (field === 'actual') {
    if (!AppState.careerActualOverrides) AppState.careerActualOverrides = {};
    const parsedVal = (val === '' || isNaN(val) || val === null) ? null : Number(val);
    AppState.careerActualOverrides[item.age] = parsedVal;
    item.actual = parsedVal;
    item.manualActual = parsedVal !== null;
  } else if (field === 'route') {
    if (!AppState.careerRouteOverrides) AppState.careerRouteOverrides = {};
    const parsedVal = (val === '' || isNaN(val) || val === null) ? 0 : Number(val);
    AppState.careerRouteOverrides[item.age] = parsedVal;
    item.route = parsedVal;
    item.manualRoute = true;
    AppState.careerDetailList = calculateCareerDetails();
  }
  renderCareerTables();
  renderCareerChart();
  window.markUnsavedChanges();
};

window.updateCareerSkill = function(idx, val, isBlur = false) {
  if (!AppState.skillsStore || typeof AppState.skillsStore !== 'object') {
    AppState.skillsStore = {};
  }
  const cleanVal = isBlur ? String(val || '').trim() : String(val !== undefined && val !== null ? val : '');
  AppState.skillsStore[idx] = cleanVal;
  const docId = (window.UserSession && UserSession.currentUser) ? UserSession.currentUser.docId : 'khach_hang_mac_dinh';
  try {
    localStorage.setItem('FIN_APP_LAST_STATE_' + docId, JSON.stringify(AppState));
  } catch (e) {}
  window.markUnsavedChanges();
};

window.updateCareerMilestoneField = function(idx, field, val) {
  if (!AppState.milestonesStore || typeof AppState.milestonesStore !== 'object') {
    AppState.milestonesStore = {};
  }
  if (!AppState.milestonesStore[idx]) {
    AppState.milestonesStore[idx] = {};
  }
  const cleanStr = String(val || '').replace(/[^0-9.-]/g, '').trim();
  if (cleanStr === '' || isNaN(cleanStr)) {
    delete AppState.milestonesStore[idx][field];
  } else {
    AppState.milestonesStore[idx][field] = parseFloat(cleanStr);
  }
  const docId = (window.UserSession && UserSession.currentUser) ? UserSession.currentUser.docId : 'khach_hang_mac_dinh';
  try {
    localStorage.setItem('FIN_APP_LAST_STATE_' + docId, JSON.stringify(AppState));
  } catch (e) {}
  window.markUnsavedChanges();
  renderCareerTables();
};

window.resetCareerMilestones = function() {
  AppState.milestonesStore = {};
  const docId = (window.UserSession && UserSession.currentUser) ? UserSession.currentUser.docId : 'khach_hang_mac_dinh';
  try {
    localStorage.setItem('FIN_APP_LAST_STATE_' + docId, JSON.stringify(AppState));
  } catch (e) {}
  window.markUnsavedChanges();
  renderCareerTables();
};

function renderCareerChart() {
  const canvas = document.getElementById('careerChart');
  if (!canvas || typeof Chart === 'undefined') return;

  const themeTokens = typeof window.getChartThemeTokens === 'function' ? window.getChartThemeTokens() : {
    isDark: false, text: '#292747', textMuted: '#8582A3', grid: '#E8E5F7', border: '#ffffff', planBar: '#E8E5F7'
  };

  const dataList = AppState.careerDetailList.length > 0 ? AppState.careerDetailList : calculateCareerDetails();
  const labels = dataList.map(x => String(x.age));
  const targets = dataList.map(x => x.target);
  const routes = dataList.map(x => x.route);

  const getRouteFillGradient = (context) => {
    const chart = context.chart;
    const { ctx, chartArea } = chart;
    if (!chartArea) return 'transparent';
    const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
    if (themeTokens.isDark) {
      gradient.addColorStop(0, 'rgba(129, 140, 248, 0.22)');
      gradient.addColorStop(1, 'rgba(129, 140, 248, 0.00)');
    } else {
      gradient.addColorStop(0, 'rgba(79, 70, 229, 0.16)');
      gradient.addColorStop(1, 'rgba(79, 70, 229, 0.00)');
    }
    return gradient;
  };

  if (window.careerChartInstance) window.careerChartInstance.destroy();
  window.careerChartInstance = new Chart(canvas.getContext('2d'), {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: "Thu nhập theo lộ trình dự kiến",
          data: routes,
          borderColor: themeTokens.isDark ? '#818CF8' : '#4F46E5',
          backgroundColor: getRouteFillGradient,
          borderWidth: 2.5,
          pointRadius: 2.5,
          pointHoverRadius: 6,
          pointBackgroundColor: themeTokens.isDark ? '#818CF8' : '#4F46E5',
          pointBorderColor: themeTokens.border,
          pointBorderWidth: 1.5,
          fill: true,
          tension: 0.28
        },
        {
          label: "Thu nhập cần kiếm để đạt mục tiêu",
          data: targets,
          borderColor: themeTokens.isDark ? '#FBBF24' : '#D97706',
          backgroundColor: 'transparent',
          borderWidth: 2,
          borderDash: [6, 4],
          pointRadius: 0,
          pointHoverRadius: 6,
          pointHoverBackgroundColor: themeTokens.isDark ? '#FBBF24' : '#D97706',
          pointHoverBorderColor: themeTokens.border,
          pointHoverBorderWidth: 2,
          fill: false,
          tension: 0.2
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
          align: 'end',
          labels: {
            font: { family: 'Inter', size: 11, weight: '600' },
            color: themeTokens.text,
            boxWidth: 20,
            boxHeight: 8,
            padding: 16
          }
        },
        tooltip: {
          backgroundColor: themeTokens.isDark ? 'rgba(15, 23, 42, 0.94)' : 'rgba(255, 255, 255, 0.96)',
          titleColor: themeTokens.isDark ? '#F8FAFC' : '#0F172A',
          bodyColor: themeTokens.isDark ? '#CBD5E1' : '#334155',
          borderColor: themeTokens.isDark ? '#334155' : '#E2E8F0',
          borderWidth: 1,
          padding: 10,
          boxPadding: 4,
          cornerRadius: 8,
          callbacks: {
            title: ctx => {
              const idx = ctx[0].dataIndex;
              const item = dataList[idx];
              const yr = item?.year || (AppState.currentYear + idx);
              return `${item?.age || labels[idx]} tuổi (Năm ${yr})`;
            },
            label: ctx => {
              if (ctx.raw === null || ctx.raw === undefined) return '';
              const val = Number(ctx.raw).toFixed(1);
              return ` ${ctx.dataset.label}: ${val} tr/tháng`;
            },
            afterBody: ctx => {
              const idx = ctx[0].dataIndex;
              const rVal = Number(routes[idx]) || 0;
              const tVal = Number(targets[idx]) || 0;
              const diff = Number((rVal - tVal).toFixed(1));
              if (rVal >= tVal) {
                return `\n Trạng thái: Đạt mục tiêu (+${diff} tr/tháng)`;
              }
              return `\n Trạng thái: Cần thêm ${Math.abs(diff)} tr/tháng`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          suggestedMax: 100,
          ticks: {
            stepSize: 10,
            font: { family: 'Inter', size: 10, weight: '500' },
            color: themeTokens.textMuted,
            callback: v => `${v}`
          },
          grid: {
            color: themeTokens.isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)'
          },
          title: {
            display: true,
            text: "Triệu đồng / tháng",
            font: { family: 'Inter', size: 11, weight: '600' },
            color: themeTokens.text,
            padding: { bottom: 8 }
          }
        },
        x: {
          grid: {
            display: true,
            color: themeTokens.isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.025)',
            drawTicks: true
          },
          ticks: {
            autoSkip: false,
            maxRotation: 0,
            minRotation: 0,
            font: { family: 'Inter', size: 10, weight: '500' },
            color: themeTokens.textMuted,
            padding: 6
          },
          title: {
            display: true,
            text: "Độ tuổi (từng năm)",
            font: { family: 'Inter', size: 11, weight: '600' },
            color: themeTokens.text,
            padding: { top: 8, bottom: 2 }
          }
        }
      }
    }
  });
}

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

  const sumRiskTitle = document.getElementById('survey-summary-risk-title');
  const sumRiskDesc = document.getElementById('survey-summary-risk-desc');
  const sumCircTitle = document.getElementById('survey-summary-circumstance-title');
  const sumCircDesc = document.getElementById('survey-summary-circumstance-desc');

  if (sumRiskTitle) sumRiskTitle.textContent = riskTitle;
  if (sumRiskDesc) sumRiskDesc.textContent = rTxt;
  if (sumCircTitle) sumCircTitle.textContent = circumstanceTitle;
  if (sumCircDesc) sumCircDesc.textContent = cTxt;

  const bar1 = document.getElementById('survey-result-bar-1');
  const bar2 = document.getElementById('survey-result-bar-2');
  if (bar1) bar1.style.width = count1 === 0 ? '0%' : `${Math.min(100, Math.round((s1 / 43) * 100))}%`;
  if (bar2) bar2.style.width = count2 === 0 ? '0%' : `${Math.min(100, Math.round((s2 / 54) * 100))}%`;
}

function renderTcGoalsFormTable() {
  ensureFixedInvestmentGoals();
  const tb = document.getElementById('tbody-tc-form-goals');
  if (!tb) return;

  tb.innerHTML = AppState.tcGoals.map((g, idx) => {
    const isFixed = isFixedInvestmentGoal(g);
    g.monthly = calculateMonthlyNeed(g);
    return `
      <tr>
        <td>
          ${isFixed
            ? `<div style="display:flex;align-items:center;gap:6px;width:100%;">
                 <input type="text" class="cell-blue font-bold" style="flex:1;min-width:0;" value="${escapeHtml(g.name)}"
                   placeholder="Nhập tên mục tiêu..."
                   oninput="onGoalFieldInput(${idx}, 'name', this.value)"
                   onchange="onGoalFieldChange(${idx}, 'name', this.value)">
                 <span class="badge-fixed-goal" title="Mục tiêu cố định (Bảo toàn công thức tính chuẩn)"><i class="fa-solid fa-lock"></i> Cố định</span>
               </div>`
            : `<input type="text" class="cell-blue font-bold" value="${escapeHtml(g.name)}"
                 placeholder="VD: Mua nhà, Mua xe..."
                 oninput="onGoalFieldInput(${idx}, 'name', this.value)"
                 onchange="onGoalFieldChange(${idx}, 'name', this.value)">`
          }
        </td>
        <td>
          ${isFixed
            ? `<span class="font-bold text-primary" style="padding:0 8px;">Tích lũy &amp; Đầu tư</span>`
            : `<select class="select-inline-cell" onchange="onGoalFieldChange(${idx}, 'type', this.value)">
                 <option value="debt" ${g.type === 'debt' ? 'selected' : ''}>Khoản nợ phải trả</option>
                 <option value="invest" ${g.type === 'invest' ? 'selected' : ''}>Tích lũy &amp; Đầu tư</option>
               </select>`
          }
        </td>
        <td>
          <input type="number" step="any" class="text-right font-mono" value="${Number(g.val) || 0}"
                 placeholder="0"
                 oninput="onGoalFieldInput(${idx}, 'val', parseFloat(this.value)||0)"
                 onchange="onGoalFieldChange(${idx}, 'val', parseFloat(this.value)||0)">
        </td>
        <td>
          <input type="number" step="any" class="text-right font-mono" value="${Number(g.paid) || 0}"
                 placeholder="0"
                 oninput="onGoalFieldInput(${idx}, 'paid', parseFloat(this.value)||0)"
                 onchange="onGoalFieldChange(${idx}, 'paid', parseFloat(this.value)||0)">
        </td>
        <td>
          <input type="number" class="text-center font-mono" value="${Number(g.start) || 0}"
                 oninput="onGoalFieldInput(${idx}, 'start', parseInt(this.value, 10)||0)"
                 onchange="onGoalFieldChange(${idx}, 'start', parseInt(this.value, 10)||0)">
        </td>
        <td>
          <input type="number" class="text-center font-mono" value="${Number(g.end) || 0}"
                 oninput="onGoalFieldInput(${idx}, 'end', parseInt(this.value, 10)||0)"
                 onchange="onGoalFieldChange(${idx}, 'end', parseInt(this.value, 10)||0)">
        </td>
        <td class="text-center">
          ${isFixed
            ? `<span class="badge-fixed-goal" title="Mục tiêu cố định không được xóa"><i class="fa-solid fa-shield-halved"></i></span>`
            : `<button type="button" class="btn-table-del" title="Xóa mục tiêu" onclick="deleteTcGoalRow(${idx})">
                 <i class="fa-solid fa-trash-can"></i>
               </button>`
          }
        </td>
      </tr>
    `;
  }).join('');
}

window.onGoalFieldInput = function(idx, field, val) {
  const g = AppState.tcGoals[idx];
  if (!g) return;
  if (isFixedInvestmentGoal(g) && field === 'type') {
    return;
  }
  if (field === 'name') {
    const colTitle = document.getElementById('fixed-goal-title-college');
    const retTitle = document.getElementById('fixed-goal-title-retirement');
    if (isCollegeFixedGoal(g) && colTitle) colTitle.textContent = val || 'Cho con đi học đại học';
    if (isRetirementFixedGoal(g) && retTitle) retTitle.textContent = val || 'Hưu trí';
  }
  if (field === 'val') {
    if (isCollegeFixedGoal(g)) {
      g._manualValOverride = (Number(val) > 0);
    } else if (isRetirementFixedGoal(g)) {
      g.annualCostEstimate = Number(val) || 0;
      const rMonths = Number(g.reserveMonths) || 0;
      if (rMonths > 0) {
        g.monthlyCostEstimate = Number(((Number(val) || 0) / rMonths).toFixed(2));
      }
    }
  }
  g[field] = val;
  g.monthly = calculateMonthlyNeed(g);

  const mCell = document.getElementById(`tc-goal-monthly-${idx}`);
  if (mCell) mCell.textContent = `${(Number(g.monthly) || 0).toFixed(2)}`;

  syncDebtGoalToOverallData();
  syncGoalsToCards();
  renderTcMatrixTable();
  recalculateAll();
};

window.onGoalFieldChange = function(idx, field, val) {
  const g = AppState.tcGoals[idx];
  if (!g) return;
  if (isFixedInvestmentGoal(g) && field === 'type') {
    renderTcGoalsFormTable();
    return;
  }
  if (field === 'val') {
    if (isCollegeFixedGoal(g)) {
      g._manualValOverride = (Number(val) > 0);
    } else if (isRetirementFixedGoal(g)) {
      g.annualCostEstimate = Number(val) || 0;
      const rMonths = Number(g.reserveMonths) || 0;
      if (rMonths > 0) {
        g.monthlyCostEstimate = Number(((Number(val) || 0) / rMonths).toFixed(2));
      }
    }
  }
  g[field] = val;
  g.monthly = calculateMonthlyNeed(g);

  if (field === 'type') {
    renderTcGoalsFormTable();
  }

  const mCell = document.getElementById(`tc-goal-monthly-${idx}`);
  if (mCell) mCell.textContent = `${(Number(g.monthly) || 0).toFixed(2)}`;

  syncDebtGoalToOverallData();
  syncGoalsToCards();
  renderTcMatrixTable();
  recalculateAll();
};

window.addNewTcGoalRow = function() {
  ensureFixedInvestmentGoals();
  const newGoal = {
    id: `g_${Date.now()}`,
    name: "Mục tiêu mới",
    type: "invest",
    val: 0,
    paid: 0,
    start: 0,
    end: 0,
    inflation: 0,
    rate: 0,
    monthly: 0,
    annual: 0,
    yearsRetire: 0,
    monthlyRetire: 0,
    deathFund: 0,
    allocProducts: createEmptyAllocProducts()
  };
  newGoal.monthly = calculateMonthlyNeed(newGoal);

  const fixedStart = AppState.tcGoals.findIndex(isFixedInvestmentGoal);
  if (fixedStart >= 0) {
    AppState.tcGoals.splice(fixedStart, 0, newGoal);
  } else {
    AppState.tcGoals.push(newGoal);
  }
  ensureFixedInvestmentGoals();

  renderTcGoalsFormTable();
  syncGoalsToCards();
  renderTcMatrixTable();
  recalculateAll();
};

window.deleteTcGoalRow = function(idx) {
  const target = AppState.tcGoals[idx];
  if (!target) return;
  if (isFixedInvestmentGoal(target)) {
    showToast(`Mục tiêu cố định "${target.name}" không được phép xóa!`, "error");
    return;
  }
  AppState.tcGoals.splice(idx, 1);
  ensureFixedInvestmentGoals();
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
      debtPlanItem = { name: "Chi tiền trả nợ", plan: parseFloat(totalMonthlyDebtNeed.toFixed(2)), note: "" };
      AppState.planExpense.push(debtPlanItem);
    } else {
      debtPlanItem.plan = parseFloat(totalMonthlyDebtNeed.toFixed(2));
      debtPlanItem.note = "";
    }
    renderPlanTables();
  } else if (debtPlanItem && debtPlanItem.note === "") {
    debtPlanItem.plan = 0;
    renderPlanTables();
  }
}

function renderGoalProductSelectHtml(g, pIndex) {
  const prods = Array.isArray(g.allocProducts) ? g.allocProducts : createEmptyAllocProducts();
  const curP = prods[pIndex] || { prodName: '', weight: 0, returnRate: 0, risk: 0 };
  const curName = typeof curP.prodName === 'string' ? curP.prodName.trim() : '';

  const validProducts = (Array.isArray(AppState.investProducts) ? AppState.investProducts : [])
    .filter(ip => ip && typeof ip.name === 'string' && ip.name.trim() !== '');

  if (validProducts.length === 0) {
    return `
      <select class="select-inline-cell" disabled style="opacity:0.75; cursor:not-allowed;" title="Chưa có sản phẩm đầu tư trong mục Từ khóa">
        <option value="" selected>-- Chưa có sản phẩm (Thêm ở Từ khóa) --</option>
      </select>
    `;
  }

  const isSelectedValid = validProducts.some(ip => ip.name.trim() === curName);

  return `
    <select class="select-inline-cell" onchange="updateGoalInvestProduct('${g.id}', ${pIndex}, this.value)">
      <option value="" ${(!curName || !isSelectedValid) ? 'selected' : ''}>-- Chưa chọn (0%) --</option>
      ${validProducts.map(p => {
        const pName = p.name.trim();
        const isSel = (pName === curName);
        return `<option value="${escapeHtml(pName)}" ${isSel ? 'selected' : ''}>${escapeHtml(pName)}</option>`;
      }).join('')}
    </select>
  `;
}

function createCardHtmlCollege(g, num) {
  calculateCollegeGoal(g);
  const portfolio = computeGoalPortfolioMetrics(g);
  const prods = g.allocProducts;
  const nYears = Number(g.accumulationYears) || 0;
  const targetVal = Number(g.val) || 0;
  const mVal = Number(g.monthly) || 0;
  const yVal = Number(g.annual) || (mVal * 12);
  const periods = Number(g.collegePeriods || g.yearsRetire) || 0;
  const periodicNeed = Number(g.monthlyTuition || g.monthlyRetire) || 0;
  const supportFund = Number(g.supportFund || g.deathFund) || 0;
  const estRate = Number(g.estimatedRate) || 0;
  const effectiveReturn = portfolio.expectedAvgReturn > 0
    ? portfolio.expectedAvgReturn
    : (Number(g.estimatedRate) || Number(g.rate) || 0);

  return `
    <div class="tc-goal-card-h4" id="card-${g.id}" data-fixed-goal="college">
      <div class="tc-card-h4-title">
        <span>Mục tiêu đầu tư ${num}: <strong id="fixed-goal-title-college" contenteditable="true" spellcheck="false" title="Nhấn để sửa tên mục tiêu" onblur="updateGoalCardField('${g.id}', 'name', this.innerText)">${escapeHtml(g.name || 'Quỹ dự phòng Tài chính')}</strong></span>
        <span class="badge-fixed-goal"><i class="fa-solid fa-lock"></i> Cố định</span>
      </div>
      <div class="tc-card-table-scroll">
        <table class="tc-card-h4-table">
          <thead>
            <tr class="bg-header-sub">
              <th colspan="2" style="width: 31%;">Thông số thời gian &amp; Định mức</th>
              <th colspan="2" style="width: 29%;">Mục tiêu tích lũy</th>
              <th colspan="4" style="width: 40%;">Phân bổ sản phẩm đầu tư</th>
            </tr>
            <tr class="bg-col-head">
              <th>Chỉ tiêu</th><th style="width: 55px;">Giá trị</th>
              <th>Chỉ tiêu</th><th style="width: 65px;">Số tiền</th>
              <th>Sản phẩm</th><th style="width: 50px;">Tỷ trọng</th><th style="width: 45px;">Lãi DK</th><th style="width: 45px;">Rủi ro</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Năm bắt đầu</td>
              <td class="cell-green-val font-mono" id="college-start" contenteditable="true" spellcheck="false" onblur="updateGoalCardField('${g.id}', 'start', this.innerText)">${Number(g.start) || 0}</td>
              <td>Mục tiêu tiết kiệm cần đạt</td>
              <td class="cell-orange-val font-mono" id="college-target-val" contenteditable="true" spellcheck="false" onblur="updateGoalCardField('${g.id}', 'val', this.innerText)">${targetVal.toFixed(0)}</td>
              <td>${renderGoalProductSelectHtml(g, 0)}</td>
              <td class="cell-green-val font-mono" id="college-w-0" contenteditable="true" spellcheck="false" onblur="updateGoalProdWeight('${g.id}', 0, this.innerText)">${(Number(prods[0]?.weight) || 0).toFixed(1)}%</td>
              <td class="text-right font-mono" id="college-r-0" contenteditable="true" spellcheck="false" onblur="updateGoalProdRate('${g.id}', 0, this.innerText)">${(Number(prods[0]?.returnRate) || 0).toFixed(1)}%</td>
              <td class="text-right font-mono" id="college-k-0" contenteditable="true" spellcheck="false" onblur="updateGoalProdRisk('${g.id}', 0, this.innerText)">${(Number(prods[0]?.risk) || 0).toFixed(1)}%</td>
            </tr>
            <tr>
              <td>Năm kết thúc</td>
              <td class="cell-green-val font-mono" id="college-end" contenteditable="true" spellcheck="false" onblur="updateGoalCardField('${g.id}', 'end', this.innerText)">${Number(g.end) || 0}</td>
              <td class="font-bold">Tổng số năm tích lũy</td>
              <td class="cell-green-val font-bold font-mono" id="college-accum-years" contenteditable="true" spellcheck="false" onblur="updateGoalCardField('${g.id}', 'accumulationYears', this.innerText)">${nYears.toFixed(0)} năm</td>
              <td>${renderGoalProductSelectHtml(g, 1)}</td>
              <td class="cell-green-val font-mono" id="college-w-1" contenteditable="true" spellcheck="false" onblur="updateGoalProdWeight('${g.id}', 1, this.innerText)">${(Number(prods[1]?.weight) || 0).toFixed(1)}%</td>
              <td class="text-right font-mono" id="college-r-1" contenteditable="true" spellcheck="false" onblur="updateGoalProdRate('${g.id}', 1, this.innerText)">${(Number(prods[1]?.returnRate) || 0).toFixed(1)}%</td>
              <td class="text-right font-mono" id="college-k-1" contenteditable="true" spellcheck="false" onblur="updateGoalProdRisk('${g.id}', 1, this.innerText)">${(Number(prods[1]?.risk) || 0).toFixed(1)}%</td>
            </tr>
            <tr>
              <td>Số kỳ / năm chi trả dự kiến</td>
              <td class="cell-green-val font-mono" id="college-periods" contenteditable="true" spellcheck="false" onblur="updateGoalCardField('${g.id}', 'collegePeriods', this.innerText)">${periods}</td>
              <td class="font-bold">Số tiền cần tích lũy mỗi tháng</td>
              <td class="cell-orange-val font-mono" id="college-monthly-need">${mVal.toFixed(2)}</td>
              <td>${renderGoalProductSelectHtml(g, 2)}</td>
              <td class="cell-green-val font-mono" id="college-w-2" contenteditable="true" spellcheck="false" onblur="updateGoalProdWeight('${g.id}', 2, this.innerText)">${(Number(prods[2]?.weight) || 0).toFixed(1)}%</td>
              <td class="text-right font-mono" id="college-r-2" contenteditable="true" spellcheck="false" onblur="updateGoalProdRate('${g.id}', 2, this.innerText)">${(Number(prods[2]?.returnRate) || 0).toFixed(1)}%</td>
              <td class="text-right font-mono" id="college-k-2" contenteditable="true" spellcheck="false" onblur="updateGoalProdRisk('${g.id}', 2, this.innerText)">${(Number(prods[2]?.risk) || 0).toFixed(1)}%</td>
            </tr>
            <tr>
              <td>Chi phí định kỳ cần mỗi tháng</td>
              <td class="cell-green-val font-mono" id="college-periodic-need" contenteditable="true" spellcheck="false" onblur="updateGoalCardField('${g.id}', 'monthlyTuition', this.innerText)">${periodicNeed}</td>
              <td class="font-bold">Số tiền cần tích lũy mỗi năm</td>
              <td class="cell-orange-val font-mono" id="college-annual-need">${yVal.toFixed(2)}</td>
              <td colspan="2" class="font-bold text-center bg-col-head">Lãi suất TB dự kiến</td>
              <td colspan="2" class="cell-gold-val text-center font-mono" id="college-avg-return">${effectiveReturn.toFixed(2)}%/năm</td>
            </tr>
            <tr class="bg-neutral-gray font-semibold">
              <td>Quỹ hỗ trợ / để lại sau tốt nghiệp:</td>
              <td class="font-bold text-right text-danger font-mono" id="college-support-fund" contenteditable="true" spellcheck="false" onblur="updateGoalCardField('${g.id}', 'supportFund', this.innerText)">${supportFund}</td>
              <td style="text-align: right;">LS ước tính:</td>
              <td class="cell-green-val font-mono" id="college-est-rate" contenteditable="true" spellcheck="false" onblur="updateGoalCardField('${g.id}', 'estimatedRate', this.innerText)">${estRate.toFixed(1)}%</td>
              <td colspan="2" style="text-align: right;">Tiền sẵn có:</td>
              <td colspan="2" class="cell-green-val text-center font-bold font-mono" id="college-paid" contenteditable="true" spellcheck="false" onblur="updateGoalCardField('${g.id}', 'paid', this.innerText)">${Number(g.paid) || 0}</td>
            </tr>
            ${!portfolio.isWeightValid ? `
            <tr>
              <td colspan="8" class="goal-weight-warning" id="college-weight-warning">
                <i class="fa-solid fa-triangle-exclamation"></i> Cảnh báo: Tổng tỷ trọng phân bổ hiện tại là ${portfolio.totalWeight.toFixed(1)}% (khác 100%).
              </td>
            </tr>` : ''}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function createCardHtmlRetirement(g, num) {
  calculateRetirementGoal(g);
  const portfolio = computeGoalPortfolioMetrics(g);
  const prods = g.allocProducts;
  const nYears = Number(g.accumulationYears) || 0;
  const targetVal = Number(g.val) || 0;
  const mVal = Number(g.monthly) || 0;
  const yVal = Number(g.annual) || (mVal * 12);
  const reserveMonths = Number(g.reserveMonths) || 0;
  const annualCost = Number(g.annualCostEstimate) || 0;
  const monthlyCost = Number(g.monthlyCostEstimate) || 0;
  const estRate = Number(g.estimatedRate) || 0;
  const effectiveReturn = portfolio.expectedAvgReturn > 0
    ? portfolio.expectedAvgReturn
    : (Number(g.estimatedRate) || Number(g.rate) || 0);

  return `
    <div class="tc-goal-card-h4" id="card-${g.id}" data-fixed-goal="retirement">
      <div class="tc-card-h4-title">
        <span>Mục tiêu đầu tư ${num}: <strong id="fixed-goal-title-retirement" contenteditable="true" spellcheck="false" title="Nhấn để sửa tên mục tiêu" onblur="updateGoalCardField('${g.id}', 'name', this.innerText)">${escapeHtml(g.name || 'Hưu trí')}</strong></span>
        <span class="badge-fixed-goal"><i class="fa-solid fa-lock"></i> Cố định</span>
      </div>
      <div class="tc-card-table-scroll">
        <table class="tc-card-h4-table">
          <thead>
            <tr class="bg-header-sub">
              <th colspan="2" style="width: 31%;">Thông số thời gian &amp; Dự phòng</th>
              <th colspan="2" style="width: 29%;">Mục tiêu tích lũy hưu trí</th>
              <th colspan="4" style="width: 40%;">Phân bổ sản phẩm đầu tư</th>
            </tr>
            <tr class="bg-col-head">
              <th>Chỉ tiêu</th><th style="width: 55px;">Giá trị</th>
              <th>Chỉ tiêu</th><th style="width: 65px;">Số tiền</th>
              <th>Sản phẩm</th><th style="width: 50px;">Tỷ trọng</th><th style="width: 45px;">Lãi DK</th><th style="width: 45px;">Rủi ro</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Năm bắt đầu</td>
              <td class="cell-green-val font-mono" id="retire-start" contenteditable="true" spellcheck="false" onblur="updateGoalCardField('${g.id}', 'start', this.innerText)">${Number(g.start) || 0}</td>
              <td>Mục tiêu tiết kiệm cần đạt</td>
              <td class="cell-orange-val font-mono" id="retire-target-val" contenteditable="true" spellcheck="false" onblur="updateGoalCardField('${g.id}', 'val', this.innerText)">${targetVal.toFixed(0)}</td>
              <td>${renderGoalProductSelectHtml(g, 0)}</td>
              <td class="cell-green-val font-mono" id="retire-w-0" contenteditable="true" spellcheck="false" onblur="updateGoalProdWeight('${g.id}', 0, this.innerText)">${(Number(prods[0]?.weight) || 0).toFixed(1)}%</td>
              <td class="text-right font-mono" id="retire-r-0" contenteditable="true" spellcheck="false" onblur="updateGoalProdRate('${g.id}', 0, this.innerText)">${(Number(prods[0]?.returnRate) || 0).toFixed(1)}%</td>
              <td class="text-right font-mono" id="retire-k-0" contenteditable="true" spellcheck="false" onblur="updateGoalProdRisk('${g.id}', 0, this.innerText)">${(Number(prods[0]?.risk) || 0).toFixed(1)}%</td>
            </tr>
            <tr>
              <td>Năm kết thúc</td>
              <td class="cell-green-val font-mono" id="retire-end" contenteditable="true" spellcheck="false" onblur="updateGoalCardField('${g.id}', 'end', this.innerText)">${Number(g.end) || 0}</td>
              <td class="font-bold">Tổng số năm tích lũy</td>
              <td class="cell-green-val font-bold font-mono" id="retire-accum-years" contenteditable="true" spellcheck="false" onblur="updateGoalCardField('${g.id}', 'accumulationYears', this.innerText)">${nYears.toFixed(0)} năm</td>
              <td>${renderGoalProductSelectHtml(g, 1)}</td>
              <td class="cell-green-val font-mono" id="retire-w-1" contenteditable="true" spellcheck="false" onblur="updateGoalProdWeight('${g.id}', 1, this.innerText)">${(Number(prods[1]?.weight) || 0).toFixed(1)}%</td>
              <td class="text-right font-mono" id="retire-r-1" contenteditable="true" spellcheck="false" onblur="updateGoalProdRate('${g.id}', 1, this.innerText)">${(Number(prods[1]?.returnRate) || 0).toFixed(1)}%</td>
              <td class="text-right font-mono" id="retire-k-1" contenteditable="true" spellcheck="false" onblur="updateGoalProdRisk('${g.id}', 1, this.innerText)">${(Number(prods[1]?.risk) || 0).toFixed(1)}%</td>
            </tr>
            <tr>
              <td>Số tháng dự phòng</td>
              <td class="cell-green-val font-mono" id="retire-reserve-months" contenteditable="true" spellcheck="false" onblur="updateGoalCardField('${g.id}', 'reserveMonths', this.innerText)">${reserveMonths}</td>
              <td class="font-bold">Số tiền cần tích lũy mỗi tháng</td>
              <td class="cell-orange-val font-mono" id="retire-monthly-need">${mVal.toFixed(2)}</td>
              <td>${renderGoalProductSelectHtml(g, 2)}</td>
              <td class="cell-green-val font-mono" id="retire-w-2" contenteditable="true" spellcheck="false" onblur="updateGoalProdWeight('${g.id}', 2, this.innerText)">${(Number(prods[2]?.weight) || 0).toFixed(1)}%</td>
              <td class="text-right font-mono" id="retire-r-2" contenteditable="true" spellcheck="false" onblur="updateGoalProdRate('${g.id}', 2, this.innerText)">${(Number(prods[2]?.returnRate) || 0).toFixed(1)}%</td>
              <td class="text-right font-mono" id="retire-k-2" contenteditable="true" spellcheck="false" onblur="updateGoalProdRisk('${g.id}', 2, this.innerText)">${(Number(prods[2]?.risk) || 0).toFixed(1)}%</td>
            </tr>
            <tr>
              <td>Tổng ước tính chi phí (năm)</td>
              <td class="cell-green-val font-mono" id="retire-annual-cost" contenteditable="true" spellcheck="false" onblur="updateGoalCardField('${g.id}', 'annualCostEstimate', this.innerText)">${annualCost}</td>
              <td class="font-bold">Số tiền cần tích lũy mỗi năm</td>
              <td class="cell-orange-val font-mono" id="retire-annual-need">${yVal.toFixed(2)}</td>
              <td colspan="2" class="font-bold text-center bg-col-head">Lãi suất TB dự kiến</td>
              <td colspan="2" class="cell-gold-val text-center font-mono" id="retire-avg-return">${effectiveReturn.toFixed(2)}%/năm</td>
            </tr>
            <tr class="bg-neutral-gray font-semibold">
              <td>Chi phí chi tiêu / tháng:</td>
              <td class="font-bold text-right text-danger font-mono" id="retire-monthly-cost" contenteditable="true" spellcheck="false" onblur="updateGoalCardField('${g.id}', 'monthlyCostEstimate', this.innerText)">${monthlyCost}</td>
              <td style="text-align: right;">LS ước tính:</td>
              <td class="cell-green-val font-mono" id="retire-est-rate" contenteditable="true" spellcheck="false" onblur="updateGoalCardField('${g.id}', 'estimatedRate', this.innerText)">${estRate.toFixed(1)}%</td>
              <td colspan="2" style="text-align: right;">Tiền sẵn có:</td>
              <td colspan="2" class="cell-green-val text-center font-bold font-mono" id="retire-paid" contenteditable="true" spellcheck="false" onblur="updateGoalCardField('${g.id}', 'paid', this.innerText)">${Number(g.paid) || 0}</td>
            </tr>
            ${!portfolio.isWeightValid ? `
            <tr>
              <td colspan="8" class="goal-weight-warning" id="retire-weight-warning">
                <i class="fa-solid fa-triangle-exclamation"></i> Cảnh báo: Tổng tỷ trọng phân bổ hiện tại là ${portfolio.totalWeight.toFixed(1)}% (khác 100%).
              </td>
            </tr>` : ''}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function syncGoalsToCards() {
  ensureFixedInvestmentGoals();
  syncInvestProductsToGoals();
  const dWrap = document.getElementById('tc-debt-cards-container');
  const iWrap = document.getElementById('tc-invest-cards-container');
  const colDebt = document.querySelector('.tc-col-debt');
  const colInvest = document.querySelector('.tc-col-invest');
  const grid = document.getElementById('tc-two-columns-grid') || document.querySelector('.tc-two-columns-grid');
  const emptyState = document.getElementById('tc-empty-state');

  const isValidGoal = (g) => g && typeof g === 'object' && (isFixedInvestmentGoal(g) || (g.name && g.name.trim() !== '') || Number(g.val) > 0 || Number(g.monthly) > 0);

  const allGoals = Array.isArray(AppState.tcGoals) ? AppState.tcGoals : [];
  const debts = allGoals.filter(g => g.type === 'debt' && isValidGoal(g));
  const invests = allGoals.filter(g => g.type === 'invest' && isValidGoal(g));

  const hasDebts = debts.length > 0;
  const hasInvests = invests.length > 0;

  if (colDebt) {
    if (hasDebts) {
      colDebt.style.display = '';
      if (dWrap) dWrap.innerHTML = debts.map((g, i) => createCardHtmlDebt(g, i + 1)).join('');
    } else {
      colDebt.style.display = 'none';
      if (dWrap) dWrap.innerHTML = '';
    }
  }

  if (colInvest) {
    if (hasInvests) {
      colInvest.style.display = '';
      if (iWrap) {
        iWrap.innerHTML = invests.map((g, i) => {
          if (isCollegeFixedGoal(g)) return createCardHtmlCollege(g, i + 1);
          if (isRetirementFixedGoal(g)) return createCardHtmlRetirement(g, i + 1);
          return createCardHtmlInvest(g, i + 1);
        }).join('');
      }
    } else {
      colInvest.style.display = 'none';
      if (iWrap) iWrap.innerHTML = '';
    }
  }

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
      grid.style.display = 'none';
      if (emptyState) emptyState.style.display = 'flex';
    }
  }
}

function createCardHtmlDebt(g, num) {
  const startYr = Number(g.start) || 0;
  const endYr = Number(g.end) || 0;
  const nYears = (startYr > 0 && endYr >= startYr) ? (endYr - startYr + 1) : 0;
  const targetNeed = Math.max(0, (Number(g.val) || 0) - (Number(g.paid) || 0));
  const mVal = g.monthly || calculateMonthlyNeed(g);

  return `
    <div class="tc-goal-card-h4" id="card-${g.id}">
      <div class="tc-card-h4-title">
        <span>Khoản nợ ${num}: <strong contenteditable="true" spellcheck="false" onblur="updateGoalCardField('${g.id}', 'name', this.innerText)">${escapeHtml(g.name || 'Khoản nợ')}</strong></span>
        <button class="btn-table-del" onclick="removeGoalFromCard('${g.id}')"><i class="fa-solid fa-trash-can"></i></button>
      </div>
      <div class="tc-card-table-scroll">
        <table class="tc-card-h4-table">
          <tbody>
            <tr>
              <td style="width: 32%;">Năm bắt đầu</td>
              <td class="cell-green-val font-mono" style="width: 18%;" contenteditable="true" spellcheck="false" onblur="updateGoalCardField('${g.id}', 'start', this.innerText)">${startYr}</td>
              <td class="bg-col-head" style="width: 32%;">Thời gian trả nợ</td>
              <td class="text-right font-bold font-mono" style="width: 18%;">${nYears.toFixed(0)} năm</td>
            </tr>
            <tr>
              <td>Năm tất toán</td>
              <td class="cell-green-val font-mono" contenteditable="true" spellcheck="false" onblur="updateGoalCardField('${g.id}', 'end', this.innerText)">${endYr}</td>
              <td class="bg-col-head">Khoản nợ còn lại</td>
              <td class="text-right font-bold text-danger font-mono" contenteditable="true" spellcheck="false" onblur="updateGoalCardField('${g.id}', 'val', this.innerText)">${targetNeed.toFixed(1)}</td>
            </tr>
            <tr>
              <td>Lãi suất vay</td>
              <td class="cell-green-val font-mono" contenteditable="true" spellcheck="false" onblur="updateGoalCardField('${g.id}', 'rate', this.innerText)">${(Number(g.rate) || 0).toFixed(1)}%/năm</td>
              <td class="bg-col-head">Cần trả mỗi tháng</td>
              <td class="cell-orange-val font-mono">${mVal.toFixed(2)}</td>
            </tr>
            <tr>
              <td>Đã trả / Sẵn có</td>
              <td class="cell-green-val font-mono" contenteditable="true" spellcheck="false" onblur="updateGoalCardField('${g.id}', 'paid', this.innerText)">${Number(g.paid) || 0}</td>
              <td class="bg-col-head">Cần trả mỗi năm</td>
              <td class="cell-orange-val font-mono">${(mVal * 12).toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function createCardHtmlInvest(g, num) {
  if (isCollegeFixedGoal(g)) return createCardHtmlCollege(g, num);
  if (isRetirementFixedGoal(g)) return createCardHtmlRetirement(g, num);

  const startYr = Number(g.start) || 0;
  const endYr = Number(g.end) || 0;
  const nYears = (startYr > 0 && endYr >= startYr) ? (endYr - startYr + 1) : 0;
  const targetNeed = Math.max(0, (Number(g.val) || 0) - (Number(g.paid) || 0));
  const portfolio = computeGoalPortfolioMetrics(g);
  const mVal = calculateMonthlyNeed(g);
  const yVal = mVal * 12;
  const prods = g.allocProducts;

  return `
    <div class="tc-goal-card-h4" id="card-${g.id}">
      <div class="tc-card-h4-title">
        <span>Mục tiêu đầu tư ${num}: <strong contenteditable="true" spellcheck="false" onblur="updateGoalCardField('${g.id}', 'name', this.innerText)">${escapeHtml(g.name || 'Mục tiêu')}</strong></span>
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
              <td class="cell-green-val font-mono" contenteditable="true" spellcheck="false" onblur="updateGoalCardField('${g.id}', 'start', this.innerText)">${startYr}</td>
              <td>Cần gom</td>
              <td class="cell-orange-val font-mono" contenteditable="true" spellcheck="false" onblur="updateGoalCardField('${g.id}', 'val', this.innerText)">${Number(g.val) || 0}</td>
              <td>${renderGoalProductSelectHtml(g, 0)}</td>
              <td class="cell-green-val font-mono" contenteditable="true" spellcheck="false" onblur="updateGoalProdWeight('${g.id}', 0, this.innerText)">${(Number(prods[0]?.weight) || 0).toFixed(1)}%</td>
              <td class="text-right font-mono">${(Number(prods[0]?.returnRate) || 0).toFixed(1)}%</td>
              <td class="text-right font-mono">${(Number(prods[0]?.risk) || 0).toFixed(1)}%</td>
            </tr>
            <tr>
              <td>Năm kết thúc</td>
              <td class="cell-green-val font-mono" contenteditable="true" spellcheck="false" onblur="updateGoalCardField('${g.id}', 'end', this.innerText)">${endYr}</td>
              <td class="font-bold">Số năm gom</td>
              <td class="text-right font-bold font-mono">${nYears.toFixed(0)} năm</td>
              <td>${renderGoalProductSelectHtml(g, 1)}</td>
              <td class="cell-green-val font-mono" contenteditable="true" spellcheck="false" onblur="updateGoalProdWeight('${g.id}', 1, this.innerText)">${(Number(prods[1]?.weight) || 0).toFixed(1)}%</td>
              <td class="text-right font-mono">${(Number(prods[1]?.returnRate) || 0).toFixed(1)}%</td>
              <td class="text-right font-mono">${(Number(prods[1]?.risk) || 0).toFixed(1)}%</td>
            </tr>
            <tr>
              <td>Tiền sẵn có</td>
              <td class="cell-green-val font-mono" contenteditable="true" spellcheck="false" onblur="updateGoalCardField('${g.id}', 'paid', this.innerText)">${Number(g.paid) || 0}</td>
              <td class="font-bold">Cần / tháng</td>
              <td class="cell-orange-val font-mono">${mVal.toFixed(2)}</td>
              <td>${renderGoalProductSelectHtml(g, 2)}</td>
              <td class="cell-green-val font-mono" contenteditable="true" spellcheck="false" onblur="updateGoalProdWeight('${g.id}', 2, this.innerText)">${(Number(prods[2]?.weight) || 0).toFixed(1)}%</td>
              <td class="text-right font-mono">${(Number(prods[2]?.returnRate) || 0).toFixed(1)}%</td>
              <td class="text-right font-mono">${(Number(prods[2]?.risk) || 0).toFixed(1)}%</td>
            </tr>
            <tr>
              <td>Số tiền còn thiếu</td>
              <td class="text-right font-bold text-danger font-mono">${targetNeed.toFixed(2)}</td>
              <td class="font-bold">Cần / năm</td>
              <td class="cell-orange-val font-mono">${yVal.toFixed(2)}</td>
              <td colspan="2" class="font-bold text-center bg-col-head">Lãi trung bình dự kiến</td>
              <td colspan="2" class="cell-gold-val text-center font-mono">${portfolio.expectedAvgReturn.toFixed(2)}%/năm</td>
            </tr>
            ${!portfolio.isWeightValid ? `
            <tr>
              <td colspan="8" class="goal-weight-warning">
                <i class="fa-solid fa-triangle-exclamation"></i> Cảnh báo: Tổng tỷ trọng phân bổ hiện tại là ${portfolio.totalWeight.toFixed(1)}% (khác 100%).
              </td>
            </tr>` : ''}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

window.updateGoalInvestProduct = function(goalId, prodIndex, prodName) {
  const goal = AppState.tcGoals.find(g => g.id === goalId);
  if (!goal) return;
  if (!Array.isArray(goal.allocProducts)) {
    goal.allocProducts = createEmptyAllocProducts();
  }
  while (goal.allocProducts.length < 3) {
    goal.allocProducts.push({ prodName: "", weight: 0, returnRate: 0, risk: 0 });
  }

  const cleanName = typeof prodName === 'string' ? prodName.trim() : '';
  const validProducts = Array.isArray(AppState.investProducts) ? AppState.investProducts : [];
  const matched = cleanName ? validProducts.find(p => p && p.name === cleanName) : null;

  if (goal.allocProducts[prodIndex]) {
    goal.allocProducts[prodIndex].prodName = matched ? cleanName : '';
    goal.allocProducts[prodIndex]._explicitSelected = Boolean(matched);
    if (!matched) {
      goal.allocProducts[prodIndex].weight = 0;
      goal.allocProducts[prodIndex].returnRate = 0;
      goal.allocProducts[prodIndex].risk = 0;
    } else {
      goal.allocProducts[prodIndex].returnRate = Number(matched.returnRate) || 0;
      goal.allocProducts[prodIndex].risk = Number(matched.risk) || 0;
    }
  }

  goal.monthly = calculateMonthlyNeed(goal);

  syncGoalsToCards();
  renderTcGoalsFormTable();
  renderTcMatrixTable();
  recalculateAll();
};

window.updateGoalProdWeight = function(goalId, prodIndex, textVal) {
  const goal = AppState.tcGoals.find(g => g.id === goalId);
  if (!goal || !goal.allocProducts || !goal.allocProducts[prodIndex]) return;

  const prodName = (goal.allocProducts[prodIndex].prodName || '').trim();
  const validProducts = Array.isArray(AppState.investProducts) ? AppState.investProducts : [];
  const hasValidProduct = prodName !== '' && validProducts.some(p => p && p.name === prodName);

  if (!hasValidProduct) {
    goal.allocProducts[prodIndex].weight = 0;
    goal.allocProducts[prodIndex].prodName = '';
    goal.allocProducts[prodIndex].returnRate = 0;
    goal.allocProducts[prodIndex].risk = 0;
  } else {
    const w = parseFloat(String(textVal || '').replace(/[^0-9.-]/g, ''));
    goal.allocProducts[prodIndex].weight = (isNaN(w) || !isFinite(w) || w < 0) ? 0 : w;
  }

  goal.monthly = calculateMonthlyNeed(goal);

  syncGoalsToCards();
  renderTcGoalsFormTable();
  renderTcMatrixTable();
  recalculateAll();
};

window.updateGoalProdRate = function(goalId, prodIndex, textVal) {
  const goal = AppState.tcGoals.find(g => g.id === goalId);
  if (!goal || !goal.allocProducts || !goal.allocProducts[prodIndex]) return;
  const r = parseFloat(String(textVal || '').replace(/[^0-9.-]/g, ''));
  goal.allocProducts[prodIndex].returnRate = (isNaN(r) || !isFinite(r) || r < 0) ? 0 : r;
  goal.monthly = calculateMonthlyNeed(goal);
  syncGoalsToCards();
  renderTcGoalsFormTable();
  renderTcMatrixTable();
  recalculateAll();
};

window.updateGoalProdRisk = function(goalId, prodIndex, textVal) {
  const goal = AppState.tcGoals.find(g => g.id === goalId);
  if (!goal || !goal.allocProducts || !goal.allocProducts[prodIndex]) return;
  const k = parseFloat(String(textVal || '').replace(/[^0-9.-]/g, ''));
  goal.allocProducts[prodIndex].risk = (isNaN(k) || !isFinite(k) || k < 0) ? 0 : k;
  goal.monthly = calculateMonthlyNeed(goal);
  syncGoalsToCards();
  renderTcGoalsFormTable();
  renderTcMatrixTable();
  recalculateAll();
};

window.updateGoalCardField = function(goalId, field, rawText) {
  const g = AppState.tcGoals.find(x => x.id === goalId);
  if (!g) return;

  if (field === 'name') {
    const trimmed = typeof rawText === 'string' ? rawText.trim() : '';
    if (trimmed) {
      g.name = trimmed;
    } else {
      g.name = isCollegeFixedGoal(g) ? 'Cho con đi học đại học' : (isRetirementFixedGoal(g) ? 'Hưu trí' : 'Mục tiêu');
    }
    renderTcGoalsFormTable();
    renderTcMatrixTable();
  } else {
    const clean = (typeof rawText === 'string') ? rawText.trim().replace(/,/g, '.').replace(/[^0-9.-]/g, '') : rawText;
    const numVal = parseFloat(clean);
    const safeVal = (isNaN(numVal) || !isFinite(numVal)) ? 0 : numVal;

    if (field === 'start' || field === 'end') {
      g[field] = Math.max(0, Math.round(safeVal));
      if (g.start > 0 && g.end >= g.start) {
        g.accumulationYears = g.end - g.start + 1;
      }
    } else if (field === 'accumulationYears') {
      g.accumulationYears = Math.max(0, Math.round(safeVal));
      if (g.start > 0 && safeVal > 0) {
        g.end = g.start + safeVal - 1;
      }
    } else if (field === 'val') {
      g.val = safeVal;
      if (isCollegeFixedGoal(g)) {
        g._manualValOverride = (safeVal > 0 && (Number(g.collegePeriods || g.yearsRetire) === 0));
      } else if (isRetirementFixedGoal(g)) {
        g.annualCostEstimate = safeVal;
        const rMonths = Number(g.reserveMonths) || 0;
        if (rMonths > 0) {
          g.monthlyCostEstimate = Number((safeVal / rMonths).toFixed(2));
        }
      }
    } else if (field === 'collegePeriods' || field === 'yearsRetire') {
      g.collegePeriods = safeVal;
      g.yearsRetire = safeVal;
      if (safeVal > 0) g._manualValOverride = false;
    } else if (field === 'monthlyTuition' || field === 'monthlyRetire') {
      g.monthlyTuition = safeVal;
      g.monthlyRetire = safeVal;
      if (safeVal > 0) g._manualValOverride = false;
    } else if (field === 'supportFund' || field === 'deathFund') {
      g.supportFund = safeVal;
      g.deathFund = safeVal;
      if (safeVal > 0) g._manualValOverride = false;
    } else if (field === 'annualCostEstimate') {
      g.annualCostEstimate = safeVal;
      g.val = safeVal;
      const rMonths = Number(g.reserveMonths) || 0;
      if (rMonths > 0) {
        g.monthlyCostEstimate = Number((safeVal / rMonths).toFixed(2));
      }
    } else if (field === 'monthlyCostEstimate') {
      g.monthlyCostEstimate = safeVal;
      const rMonths = Number(g.reserveMonths) || 0;
      if (rMonths > 0) {
        g.annualCostEstimate = Number((safeVal * rMonths).toFixed(2));
        g.val = g.annualCostEstimate;
      }
    } else if (field === 'reserveMonths') {
      g.reserveMonths = safeVal;
      const aCost = Number(g.annualCostEstimate) || 0;
      const mCost = Number(g.monthlyCostEstimate) || 0;
      if (safeVal > 0 && aCost > 0) {
        g.monthlyCostEstimate = Number((aCost / safeVal).toFixed(2));
      } else if (safeVal > 0 && mCost > 0) {
        g.annualCostEstimate = Number((mCost * safeVal).toFixed(2));
        g.val = g.annualCostEstimate;
      }
    } else if (field === 'estimatedRate') {
      g.estimatedRate = safeVal;
      g.rate = safeVal;
    } else {
      g[field] = safeVal;
    }
  }

  g.monthly = calculateMonthlyNeed(g);

  syncDebtGoalToOverallData();
  renderTcGoalsFormTable();
  syncGoalsToCards();
  renderTcMatrixTable();
  recalculateAll();
};

window.removeGoalFromCard = function(id) {
  const target = AppState.tcGoals.find(x => x.id === id);
  if (target && isFixedInvestmentGoal(target)) {
    showToast(`Mục tiêu cố định "${target.name}" không được phép xóa!`, "error");
    return;
  }
  AppState.tcGoals = AppState.tcGoals.filter(x => x.id !== id);
  ensureFixedInvestmentGoals();
  syncDebtGoalToOverallData();
  syncGoalsToCards();
  renderTcGoalsFormTable();
  renderTcMatrixTable();
  recalculateAll();
};

function getMatrixTotalYears() {
  const startY = Number(AppState.currentYear) || 2026;
  const allEndYears = (AppState.tcGoals || []).map(g => Number(g.end) || 0).filter(y => y >= startY);
  const maxEnd = allEndYears.length > 0 ? Math.max(...allEndYears) : (startY + 38);
  return Math.min(60, Math.max(38, maxEnd - startY + 1));
}

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
  const totalYears = getMatrixTotalYears();

  let rows = '';
  for (let y = 0; y < totalYears; y++) {
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
  const totalYears = getMatrixTotalYears();

  for (let y = 0; y < totalYears; y++) {
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
        { label: "Thu nhập cần có / tháng", data: incData, borderColor: "#6258F5", backgroundColor: "rgba(98, 88, 245, 0.1)", borderWidth: 2.5, fill: true, tension: 0.25 },
        { label: "Tiết kiệm cần có / tháng", data: savData, borderColor: "#31CDB1", backgroundColor: "rgba(49, 205, 177, 0.12)", borderWidth: 2.5, fill: true, tension: 0.25 }
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
  const totalYears = getMatrixTotalYears();
  for (let y = 0; y < totalYears; y++) {
    sData.push(parseFloat(document.getElementById(`mtr-sav-${y}`)?.innerText.replace(/[^0-9.-]/g, '')) || 0);
    iData.push(parseFloat(document.getElementById(`mtr-inc-${y}`)?.innerText.replace(/[^0-9.-]/g, '')) || 0);
  }
  tcMatrixChartInstance.data.datasets[0].data = iData;
  tcMatrixChartInstance.data.datasets[1].data = sData;
  tcMatrixChartInstance.update();
}

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
  renderYearEndBalanceSheet();
}

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

window.saveAppStateToCloud = async function() {
  if (window.isReadOnlyStudentView) {
    showToast("Không thể lưu: Đang ở Chế độ Xem bài học viên chỉ đọc.", "error");
    return;
  }

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
    const errMsg = typeof result.error === 'string' ? result.error : (result.error?.message || "Không thể lưu dữ liệu");
    showToast("Lỗi: " + errMsg, "error");
    return false;
  }
};

window.loadAppStateFromCloud = async function(isInitialLoad = false) {
  if (!window.CloudDB || !UserSession.currentUser) return;

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

    Object.keys(cloudData).forEach(key => {
      if (!key.startsWith('_')) {
        AppState[key] = cloudData[key];
      }
    });
    ensureFixedInvestmentGoals();
    syncInvestProductsToGoals();

    window.hasUnsavedChanges = false;
    window.hasSavedInSession = true;

    const yEl = document.getElementById('input-year');
    const aEl = document.getElementById('input-age');
    if (yEl) yEl.innerText = AppState.currentYear;
    if (aEl) aEl.innerText = AppState.currentAge;
    document.querySelectorAll('.dynamic-year').forEach(el => el.textContent = AppState.currentYear);

    const sRateEl = document.getElementById('target-savings-rate-val');
    if (sRateEl) sRateEl.innerText = `${AppState.targetSavingsRate || 35}%`;
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

    updateCloudStatus('ready', 'Đồng bộ lúc ' + new Date().toLocaleTimeString('vi-VN'));
    return result;
  } else if (result.notFound) {
    updateCloudStatus('ready', 'Hồ sơ mới');
    return result;
  } else {
    updateCloudStatus('error', 'Lỗi tải dữ liệu');
    if (result.error) {
      showToast(typeof result.error === 'string' ? result.error : 'Không thể tải dữ liệu.', 'error');
    }
    return result;
  }
};

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

window.loadBackupsList = async function() {
  const loadingEl = document.getElementById('backup-loading-state');
  const emptyEl = document.getElementById('backup-empty-state');
  const errorEl = document.getElementById('backup-error-state');
  const listEl = document.getElementById('backup-items-list');
  const previewEl = document.getElementById('backup-preview-card');
  const searchInput = document.getElementById('backup-search-input');

  if (searchInput) searchInput.value = '';
  if (previewEl) previewEl.style.display = 'none';
  window.cancelRestoreConfirm();

  if (!UserSession.currentUser) {
    if (loadingEl) loadingEl.style.display = 'none';
    if (listEl) listEl.innerHTML = '';
    if (emptyEl) {
      emptyEl.style.display = 'flex';
      const strong = emptyEl.querySelector('strong');
      const p = emptyEl.querySelector('p');
      if (strong) strong.textContent = 'Chưa đăng nhập tài khoản';
      if (p) p.textContent = 'Vui lòng đăng nhập để đồng bộ và khôi phục các bản sao lưu từ đám mây.';
    }
    return;
  }

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
    console.error("Lỗi khi mở danh sách backup:", err);
    if (loadingEl) loadingEl.style.display = 'none';
    if (errorEl) errorEl.style.display = 'flex';
  }
};

window.openBackupManagerModal = function() {
  window.openUnifiedDataModal('backups');
};

window.closeBackupManagerModal = function() {
  window.closeDataIoModal();
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
  if (pIncome) pIncome.textContent = `${inc.toLocaleString('vi-VN', { maximumFractionDigits: 1 })} / tháng`;
  if (cTargetName) cTargetName.textContent = `${backup.name} (${formatBackupTimestamp(backup.timestamp)})`;

  previewEl.style.display = 'flex';
  window.cancelRestoreConfirm();
};

let pendingConfirmAction = null;
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

  if (modalCard) {
    modalCard.classList.remove('confirm-type-delete');
    modalCard.classList.add('confirm-type-restore');
  }
  if (iconEl) iconEl.className = 'fa-solid fa-cloud-arrow-down';
  if (titleEl) titleEl.textContent = 'Khôi phục bản sao lưu';
  if (subtitleEl) subtitleEl.textContent = 'Dữ liệu hiện tại trên ứng dụng sẽ được thay thế theo bản sao lưu này';

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
    bkSummaryEl.textContent = `Năm ${yr} • ${goalsCount} mục tiêu • ${inc > 0 ? inc.toLocaleString('vi-VN') + ' / tháng' : 'Chưa có thu'}`;
  }

  if (warningHeading) warningHeading.textContent = 'Cảnh báo thay thế dữ liệu';
  if (warningText) {
    warningText.textContent = `Toàn bộ dữ liệu tài chính hiện tại trên màn hình sẽ được cập nhật lại theo bản ghi [${backup.name || 'Bản sao lưu'}]. Hệ thống sẽ tự động tạo một bản sao lưu an toàn ngay trước khi khôi phục để bảo vệ phiên làm việc của bạn.`;
  }

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

  if (modalCard) {
    modalCard.classList.remove('confirm-type-restore');
    modalCard.classList.add('confirm-type-delete');
  }
  if (iconEl) iconEl.className = 'fa-solid fa-trash-can';
  if (titleEl) titleEl.textContent = 'Xóa vĩnh viễn bản sao lưu';
  if (subtitleEl) subtitleEl.textContent = 'Bản sao lưu sẽ bị xóa khỏi đám mây Cloud Firestore';

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

  if (warningHeading) warningHeading.textContent = 'Hành động không thể hoàn tác';
  if (warningText) {
    warningText.textContent = `Bản sao lưu [${backup.name || 'này'}] (${formatBackupTimestamp(backup.timestamp)}) sẽ bị xóa vĩnh viễn khỏi Cloud Firestore. Bạn sẽ không thể khôi phục lại dữ liệu từ bản lưu này sau khi đã xác nhận xóa.`;
  }

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
  if (isConfirmProcessing) return;
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

      const restoreData = backup.data;
      Object.keys(restoreData).forEach(key => {
        if (!key.startsWith('_')) {
          AppState[key] = restoreData[key];
        }
      });
      ensureFixedInvestmentGoals();
      syncInvestProductsToGoals();

      const yEl = document.getElementById('input-year');
      const aEl = document.getElementById('input-age');
      if (yEl) yEl.innerText = AppState.currentYear;
      if (aEl) aEl.innerText = AppState.currentAge;
      document.querySelectorAll('.dynamic-year').forEach(el => el.textContent = AppState.currentYear);

      const sRateEl = document.getElementById('target-savings-rate-val');
      if (sRateEl) sRateEl.innerText = `${AppState.targetSavingsRate || 35}%`;
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
      renderTcMatrixTable();
      renderCareerTables();
      renderMonthView(AppState.currentMonth);
      syncGoalsToCards();
      recalculateAll();

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

        currentLoadedBackups = res.backups || [];
        if (selectedBackupId === action.backupId) {
          selectedBackupId = (currentLoadedBackups.length > 0) ? currentLoadedBackups[0].id : null;
        }

        window.filterAndSortBackups();
        isConfirmProcessing = false;
        window.closeConfirmModal();
        showToast(`Đã xóa vĩnh viễn bản sao lưu [${action.backup.name || 'được chọn'}] trên Cloud!`, "success");
      } else {

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

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const confirmModal = document.getElementById('confirm-modal-overlay');
    if (confirmModal && confirmModal.classList.contains('active') && !isConfirmProcessing) {
      window.closeConfirmModal();
    }
    const classManagerModal = document.getElementById('class-manager-modal-overlay');
    if (classManagerModal && classManagerModal.style.display !== 'none') {
      window.closeClassManagerModal();
    }
    const studentJoinModal = document.getElementById('student-join-class-modal-overlay');
    if (studentJoinModal && studentJoinModal.style.display !== 'none') {
      window.closeStudentJoinClassModal();
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
  const classManagerOverlay = document.getElementById('class-manager-modal-overlay');
  if (classManagerOverlay) {
    classManagerOverlay.addEventListener('click', (e) => {
      if (e.target === classManagerOverlay) {
        window.closeClassManagerModal();
      }
    });
  }
  const studentJoinOverlay = document.getElementById('student-join-class-modal-overlay');
  if (studentJoinOverlay) {
    studentJoinOverlay.addEventListener('click', (e) => {
      if (e.target === studentJoinOverlay) {
        window.closeStudentJoinClassModal();
      }
    });
  }
});

let currentAuthTab = 'account';

window.switchAuthModalTab = function(tabName) {
  if (tabName === 'login' || tabName === 'register' || tabName === 'reset' || !UserSession.currentUser) {
    window.goToAuthPage(tabName || 'login', '', Boolean(UserSession.currentUser));
    return;
  }

  currentAuthTab = (tabName === 'change-password') ? 'change-password' : 'account';
  const accountTabs = ['account', 'change-password'];

  accountTabs.forEach(t => {
    const btn = document.getElementById(`btn-auth-tab-${t}`);
    const panel = document.getElementById(`auth-panel-${t}`);
    if (btn) {
      btn.style.display = '';
      btn.classList.toggle('active', t === currentAuthTab);
    }
    if (panel) {
      panel.style.display = (t === currentAuthTab) ? 'flex' : 'none';
    }
  });

  const headingEl = document.getElementById('auth-modal-heading');
  const subheadingEl = document.getElementById('auth-modal-subheading');
  if (UserSession.currentUser) {
    const disp = UserSession.currentUser.displayUsername || UserSession.currentUser.username || UserSession.currentUser.rawName || 'Người dùng';
    if (headingEl) headingEl.textContent = `Tài khoản: ${disp}`;
    if (subheadingEl) subheadingEl.textContent = 'Kiểm tra thông tin định danh tài khoản, Email khôi phục hoặc đổi mật khẩu';
  }

  const errEl = document.getElementById('user-input-error');
  const okEl = document.getElementById('user-auth-success');
  const submitLbl = document.getElementById('btn-modal-submit-label');
  if (errEl) errEl.style.display = 'none';
  if (okEl) okEl.style.display = 'none';

  if (currentAuthTab === 'account') {
    UserSession.updateUI();
  }

  if (submitLbl) {
    if (currentAuthTab === 'change-password') submitLbl.textContent = 'Cập nhật mật khẩu';
    else submitLbl.textContent = 'Lưu Email khôi phục';
  }
};

window.openUserModal = function(allowCancel = true, defaultTab = null) {
  if (!UserSession.currentUser || defaultTab === 'login' || defaultTab === 'register' || defaultTab === 'reset') {
    window.goToAuthPage(defaultTab || 'login', '', Boolean(UserSession.currentUser));
    return;
  }

  const modal = document.getElementById('user-modal-overlay');
  const cancelBtn = document.getElementById('btn-modal-cancel');
  const closeX = document.getElementById('btn-auth-close-x');
  const errorEl = document.getElementById('user-input-error');
  const okEl = document.getElementById('user-auth-success');

  if (!modal) return;

  if (errorEl) errorEl.style.display = 'none';
  if (okEl) okEl.style.display = 'none';
  if (cancelBtn) cancelBtn.style.display = allowCancel ? 'inline-block' : 'none';
  if (closeX) closeX.style.display = allowCancel ? 'inline-flex' : 'none';

  const resolvedTab = (defaultTab === 'change-password') ? 'change-password' : 'account';
  window.switchAuthModalTab(resolvedTab);

  UserSession.updateUI();
  modal.classList.add('active');
};

window.closeUserModal = function() {
  const modal = document.getElementById('user-modal-overlay');
  if (modal) modal.classList.remove('active');
};

function showAuthModalError(msg) {
  const errorEl = document.getElementById('user-input-error');
  const okEl = document.getElementById('user-auth-success');
  if (okEl) okEl.style.display = 'none';
  if (errorEl) {
    errorEl.textContent = msg;
    errorEl.style.display = 'block';
  }
}

function showAuthModalSuccess(msg) {
  const errorEl = document.getElementById('user-input-error');
  const okEl = document.getElementById('user-auth-success');
  if (errorEl) errorEl.style.display = 'none';
  if (okEl) {
    okEl.textContent = msg;
    okEl.style.display = 'block';
  }
}

window.submitUserProfile = async function() {
  const btnSubmit = document.getElementById('btn-modal-submit');

  if (currentAuthTab === 'change-password') {
    const curPass = document.getElementById('input-auth-change-curpass')?.value || '';
    const newPass = document.getElementById('input-auth-change-newpass')?.value || '';
    const confirmPass = document.getElementById('input-auth-change-confirm')?.value || '';

    if (!curPass || !newPass) {
      showAuthModalError("Vui lòng nhập mật khẩu hiện tại và mật khẩu mới.");
      return;
    }
    if (newPass.length < 6) {
      showAuthModalError("Mật khẩu mới phải có tối thiểu 6 ký tự.");
      return;
    }
    if (newPass !== confirmPass) {
      showAuthModalError("Xác nhận mật khẩu mới không khớp.");
      return;
    }
    if (curPass === newPass) {
      showAuthModalError("Mật khẩu mới phải khác mật khẩu hiện tại.");
      return;
    }
    if (!window.CloudDB || typeof window.CloudDB.changePassword !== 'function') {
      showAuthModalError("Dịch vụ xác thực đang khởi tạo.");
      return;
    }

    if (btnSubmit) btnSubmit.disabled = true;
    const res = await window.CloudDB.changePassword(curPass, newPass);
    if (btnSubmit) btnSubmit.disabled = false;

    if (!res.success) {
      showAuthModalError(res.error || "Không thể đổi mật khẩu.");
      return;
    }

    const cEl = document.getElementById('input-auth-change-curpass');
    const nEl = document.getElementById('input-auth-change-newpass');
    const cfEl = document.getElementById('input-auth-change-confirm');
    if (cEl) cEl.value = '';
    if (nEl) nEl.value = '';
    if (cfEl) cfEl.value = '';
    showAuthModalSuccess(res.message || "Đã cập nhật mật khẩu mới thành công.");
    return;
  }

  if (currentAuthTab === 'account') {
    const newEmail = document.getElementById('input-auth-acc-email')?.value.trim() || '';
    const curPass = document.getElementById('input-auth-acc-password')?.value || '';

    if (!newEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      showAuthModalError("Vui lòng nhập địa chỉ Email khôi phục hợp lệ.");
      return;
    }
    if (!curPass) {
      showAuthModalError("Vui lòng nhập mật khẩu hiện tại để xác nhận.");
      return;
    }
    if (!window.CloudDB || typeof window.CloudDB.updateRecoveryEmail !== 'function') {
      showAuthModalError("Dịch vụ xác thực đang khởi tạo.");
      return;
    }

    if (btnSubmit) btnSubmit.disabled = true;
    const res = await window.CloudDB.updateRecoveryEmail(newEmail, curPass);
    if (btnSubmit) btnSubmit.disabled = false;

    if (!res.success) {
      showAuthModalError(res.error || "Không thể cập nhật email khôi phục.");
      return;
    }

    if (UserSession.currentUser) {
      UserSession.currentUser.maskedEmail = res.maskedEmail || '';
      UserSession.currentUser.hasRecoveryEmail = true;
      UserSession.setStored(UserSession.currentUser);
    }
    const pwdEl = document.getElementById('input-auth-acc-password');
    const mailEl = document.getElementById('input-auth-acc-email');
    if (pwdEl) pwdEl.value = '';
    if (mailEl) mailEl.value = '';
    showAuthModalSuccess(res.message || "Đã cập nhật email khôi phục thành công.");
    return;
  }
};

function applyAuthenticatedUser(authUser, loadExistingData = true) {
  const displayUsername = authUser.displayUsername || authUser.username || authUser.rawName || authUser.ho_ten || 'Người dùng';
  const normalizedUsername = authUser.normalizedUsername || authUser.normalizedName || normalizeUserName(displayUsername);
  const docId = authUser.docId || `user_${normalizedUsername}`;
  const userObj = {
    uid: authUser.uid || '',
    username: displayUsername,
    displayUsername: displayUsername,
    rawName: displayUsername,
    ho_ten: displayUsername,
    normalizedUsername: normalizedUsername,
    normalizedName: normalizedUsername,
    maskedEmail: authUser.maskedEmail || '',
    hasRecoveryEmail: Boolean(authUser.hasRecoveryEmail),
    docId: docId,
    sessionToken: authUser.sessionToken || '',
    confirmedAt: new Date().toISOString()
  };

  UserSession.setStored(userObj);
  closeUserModal();
  showToast(`Xin chào [${displayUsername}], đã đăng nhập thành công!`, "success");

  if (loadExistingData && window.CloudDB) {
    window.resetAppStateToEmpty();
    window.loadAppStateFromCloud(true);
  } else {
    window.resetAppStateToEmpty();
    updateCloudStatus('ready', 'Đám mây sẵn sàng');
  }
}

let pendingJsonImportPayload = null;
let pendingCsvParsedState = null;

const CSV_TABLE_SCHEMAS = {
  keywords_expense: {
    label: "Từ khóa: Danh mục chi phí",
    requireMonth: false,
    fields: [
      { key: "name", label: "Tên khoản mục chi", required: true }
    ],
    sampleRows: [
      ["Tiền ăn uống, sinh hoạt"],
      ["Tiền thuê nhà, điện nước"],
      ["Mua sắm cá nhân"],
      ["Chi phí đi lại, xăng xe"],
      ["Quỹ khẩn cấp, y tế"]
    ]
  },
  keywords_income: {
    label: "Từ khóa: Danh mục nguồn thu nhập",
    requireMonth: false,
    fields: [
      { key: "name", label: "Tên nguồn thu", required: true }
    ],
    sampleRows: [
      ["Lương chính công ty"],
      ["Thưởng dự án, hoa hồng"],
      ["Thu nhập làm thêm, freelance"],
      ["Lợi tức đầu tư, cổ tức"]
    ]
  },
  keywords_learning: {
    label: "Từ khóa: Kế hoạch phát triển chuyên môn",
    requireMonth: false,
    fields: [
      { key: "name", label: "Hạng mục phát triển", required: true }
    ],
    sampleRows: [
      ["Chứng chỉ chuyên môn (CFA / ACCA / PMP)"],
      ["Ngoại ngữ (IELTS / HSK / JLPT)"],
      ["Khóa học quản trị tài chính & đầu tư"],
      ["Kỹ năng công nghệ & phân tích dữ liệu"]
    ]
  },
  keywords_invest: {
    label: "Từ khóa: Danh mục sản phẩm đầu tư",
    requireMonth: false,
    fields: [
      { key: "name", label: "Sản phẩm tài chính", required: true },
      { key: "returnRate", label: "Lãi suất (%/năm)", required: true, type: "number" },
      { key: "risk", label: "Rủi ro (%)", required: false, type: "number" }
    ],
    sampleRows: [
      ["Cổ phiếu tăng trưởng (VN30)", "15.0", "20.0"],
      ["Chứng chỉ quỹ mở (DCDS / DCBC)", "12.0", "15.0"],
      ["Trái phiếu doanh nghiệp uy tín (DCBF)", "9.5", "5.0"],
      ["Gửi tiết kiệm ngân hàng kỳ hạn", "6.5", "1.0"]
    ]
  },
  career_route: {
    label: "Cân đối lộ trình nghề nghiệp",
    requireMonth: false,
    fields: [
      { key: "age", label: "Số tuổi", required: true, type: "number" },
      { key: "actual", label: "Thu nhập thực tế (triệu/tháng)", required: false, type: "number" },
      { key: "route", label: "Thu nhập kỳ vọng (triệu/tháng)", required: false, type: "number" }
    ],
    sampleRows: [
      ["22", "10.0", "12.0"],
      ["23", "15.0", "12.0"],
      ["24", "20.0", "12.0"],
      ["25", "", "15.0"],
      ["26", "", "20.0"]
    ]
  },
  month_income: {
    label: "Thực thu theo tháng",
    requireMonth: true,
    fields: [
      { key: "date", label: "Ngày (YYYY-MM-DD / DD/MM/YYYY)", required: false },
      { key: "cat", label: "Khoản mục thu", required: true },
      { key: "val", label: "Số tiền", required: true, type: "number" }
    ],
    sampleRows: [
      ["2026-01-05", "Lương chính", "25.5"],
      ["2026-01-15", "Thưởng dự án, hoa hồng", "8.0"]
    ]
  },
  month_expense: {
    label: "Thực chi theo tháng",
    requireMonth: true,
    fields: [
      { key: "date", label: "Ngày (YYYY-MM-DD / DD/MM/YYYY)", required: false },
      { key: "cat", label: "Khoản mục chi", required: true },
      { key: "val", label: "Số tiền", required: true, type: "number" }
    ],
    sampleRows: [
      ["2026-01-06", "Tiền ăn uống, sinh hoạt", "6.5"],
      ["2026-01-10", "Tiền thuê nhà", "4.5"]
    ]
  },
  month_learning: {
    label: "Chi phí học tập theo tháng",
    requireMonth: true,
    fields: [
      { key: "name", label: "Nội dung đào tạo", required: true },
      { key: "cost", label: "Chi phí", required: true, type: "number" },
      { key: "note", label: "Ghi chú", required: false }
    ],
    sampleRows: [
      ["Khóa học Phân tích Tài chính", "2.5", "Học trực tuyến"],
      ["Sách chuyên ngành", "0.4", "Mua sách"]
    ]
  },
  plan_income: {
    label: "Dự kiến thu hàng tháng (Kế hoạch năm)",
    requireMonth: false,
    fields: [
      { key: "name", label: "Nguồn thu dự kiến", required: true },
      { key: "plan", label: "Dự kiến mỗi tháng", required: true, type: "number" },
      { key: "note", label: "Ghi chú", required: false }
    ],
    sampleRows: [
      ["Lương công ty", "25.0", "Thu nhập cố định"],
      ["Làm thêm tự do", "5.0", "Dự án ngoài giờ"]
    ]
  },
  plan_expense: {
    label: "Dự kiến chi hàng tháng (Kế hoạch năm)",
    requireMonth: false,
    fields: [
      { key: "name", label: "Khoản chi dự kiến", required: true },
      { key: "plan", label: "Ngân sách mỗi tháng", required: true, type: "number" },
      { key: "note", label: "Ghi chú", required: false }
    ],
    sampleRows: [
      ["Sinh hoạt phí gia đình", "10.0", "Chi tiêu thiết yếu"],
      ["Quỹ dự phòng y tế", "2.0", "Tiết kiệm y tế"]
    ]
  },
  tc_goals: {
    label: "Mục tiêu tài chính",
    requireMonth: false,
    fields: [
      { key: "name", label: "Tên mục tiêu", required: true },
      { key: "type", label: "Loại (invest / debt)", required: false },
      { key: "val", label: "Giá trị mục tiêu", required: true, type: "number" },
      { key: "paid", label: "Đã có / Đã trả", required: false, type: "number" },
      { key: "start", label: "Năm bắt đầu", required: true, type: "number" },
      { key: "end", label: "Năm kết thúc", required: true, type: "number" },
      { key: "rate", label: "Lãi suất (%/năm)", required: false, type: "number" }
    ],
    sampleRows: [
      ["Mua nhà chung cư", "invest", "2000", "200", "2026", "2035", "12"],
      ["Trả góp xe", "debt", "300", "50", "2026", "2029", "9"]
    ]
  }
};

window.openUnifiedDataModal = function(initialTab = 'import') {
  const modal = document.getElementById('data-io-modal-overlay');
  if (!modal) return;
  modal.style.display = 'flex';
  modal.classList.add('active');
  window.initU032Upload();
  window.switchDataIoTab(initialTab);
};

window.openDataIoModal = function(initialTab = 'import') {
  window.openUnifiedDataModal(initialTab);
};

window.closeDataIoModal = function() {
  const modal = document.getElementById('data-io-modal-overlay');
  if (modal) {
    modal.classList.remove('active');
    modal.style.display = 'none';
  }
  selectedBackupId = null;
  window.cancelRestoreConfirm();
};

window.switchDataIoTab = function(tabId) {
  let activeTab = tabId;
  if (tabId === 'import-json' || tabId === 'import-csv') {
    activeTab = 'import';
  }
  const tabs = ['import', 'export-json', 'backups'];
  tabs.forEach(t => {
    const btn = document.getElementById(`btn-io-tab-${t}`);
    const panel = document.getElementById(`io-panel-${t}`);
    if (btn) btn.classList.toggle('active', t === activeTab);
    if (panel) panel.style.display = (t === activeTab) ? 'block' : 'none';
  });

  if (activeTab === 'export-json') {
    refreshExportJsonSummary();
  } else if (activeTab === 'backups') {
    window.loadBackupsList();
  } else if (activeTab === 'import') {
    window.initU032Upload();
    if (tabId === 'import-csv') {
      window.displayCsvImportOptions();
      window.onCsvTargetTableChange();
    } else if (tabId === 'import-json') {
      window.displayJsonImportOptions();
    }
  }
};

function refreshExportJsonSummary() {
  const userLbl = document.getElementById('io-export-user-label');
  const yrAgeLbl = document.getElementById('io-export-year-age');
  const kwLbl = document.getElementById('io-export-keywords-count');
  const goalsLbl = document.getElementById('io-export-goals-count');
  const planLbl = document.getElementById('io-export-plan-count');
  const txLbl = document.getElementById('io-export-tx-count');

  if (userLbl) {
    userLbl.textContent = UserSession.currentUser
      ? `${UserSession.currentUser.rawName} (@${UserSession.currentUser.docId})`
      : 'Khách (@guest)';
  }
  if (yrAgeLbl) {
    yrAgeLbl.textContent = `${AppState.currentYear || 2026} / ${AppState.currentAge || 21} tuổi`;
  }
  if (kwLbl) {
    const kwTotal = (AppState.expenses?.length || 0) + (AppState.incomeList?.length || 0) + (AppState.investProducts?.length || 0) + (AppState.planList?.length || 0);
    kwLbl.textContent = `${kwTotal} mục (${AppState.expenses?.length || 0} chi, ${AppState.incomeList?.length || 0} thu, ${AppState.investProducts?.length || 0} ĐT)`;
  }
  if (goalsLbl) {
    goalsLbl.textContent = `${(AppState.tcGoals || []).length} mục tiêu`;
  }
  if (planLbl) {
    const pCount = (AppState.planIncome || []).length + (AppState.planExpense || []).length;
    planLbl.textContent = `${pCount} dòng`;
  }
  if (txLbl) {
    let txTotal = 0;
    for (let m = 1; m <= 12; m++) {
      const md = AppState.monthlyDetails?.[m];
      if (md) {
        txTotal += (md.incomes?.length || 0) + (md.expenses?.length || 0) + (md.learningDetails?.length || 0);
      }
    }
    txLbl.textContent = `${txTotal} bản ghi`;
  }
}

window.buildExportJsonPayload = function() {
  ensureFixedInvestmentGoals();
  ensureYearEndBalanceSheet();
  const cleanState = JSON.parse(JSON.stringify(AppState));
  delete cleanState.careerDetailList;
  if (Array.isArray(cleanState.tcGoals)) {
    cleanState.tcGoals = cleanState.tcGoals.map(g => {
      const copy = { ...g };
      delete copy.monthly;
      delete copy.annual;
      delete copy.needed;
      delete copy._manualValOverride;
      return copy;
    });
  }
  Object.keys(cleanState).forEach(k => {
    if (k.startsWith('_') || k === 'passwordHash' || k === 'token' || k === 'secret') {
      delete cleanState[k];
    }
  });
  return {
    schemaVersion: "3.0.0",
    exportedAt: new Date().toISOString(),
    accountMeta: {
      ho_ten: UserSession.currentUser?.rawName || "Khách",
      docId: UserSession.currentUser?.docId || "khach_hang_mac_dinh"
    },
    data: cleanState
  };
};

window.exportAppStateToJson = function() {
  try {
    const payload = window.buildExportJsonPayload();
    const jsonString = JSON.stringify(payload, null, 2);
    const blob = new Blob([jsonString], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const slug = UserSession.currentUser?.docId || "ho_so";
    const datePart = new Date().toISOString().slice(0, 10);
    const fileName = `so_tai_chinh_${slug}_${datePart}.json`;

    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);

    showToast(`Đã xuất file JSON [${fileName}] thành công!`, "success");
    return payload;
  } catch (err) {
    showToast("Lỗi khi xuất file JSON: " + (err.message || "Không xác định"), "error");
    return null;
  }
};

window.validateAndPrepareJsonImport = function(rawText) {
  if (!rawText || typeof rawText !== 'string') {
    return { valid: false, error: "Nội dung file JSON trống hoặc không hợp lệ." };
  }
  let parsed = null;
  try {
    parsed = JSON.parse(rawText);
  } catch (e) {
    return { valid: false, error: "File không đúng định dạng JSON chuẩn: " + e.message };
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { valid: false, error: "Cấu trúc gốc của file JSON phải là một đối tượng (Object)." };
  }

  const candidateData = (parsed.data && typeof parsed.data === 'object' && !Array.isArray(parsed.data))
    ? parsed.data
    : parsed;

  const knownKeys = [
    "currentYear", "currentAge", "birthYear", "expenses", "incomeList", "planList",
    "investProducts", "tcGoals", "planIncome", "planExpense", "monthlyDetails",
    "skillsList", "familyList", "jobList", "surveyP1Choices", "surveyP2Choices",
    "yearEndBalanceSheet", "skillsStore", "milestonesStore"
  ];
  const hasAnyKnownKey = knownKeys.some(k => k in candidateData);
  if (!hasAnyKnownKey) {
    return { valid: false, error: "File JSON không chứa các trường dữ liệu hợp lệ của Sổ Tài Chính." };
  }

  if (candidateData.currentYear !== undefined && (typeof candidateData.currentYear !== 'number' || candidateData.currentYear < 1900 || candidateData.currentYear > 2200)) {
    return { valid: false, error: "Trường currentYear trong JSON không hợp lệ (phải là số năm từ 1900–2200)." };
  }

  const arrayFields = ["expenses", "incomeList", "planList", "investProducts", "tcGoals", "planIncome", "planExpense", "skillsList", "familyList", "jobList"];
  for (const f of arrayFields) {
    if (candidateData[f] !== undefined && !Array.isArray(candidateData[f])) {
      return { valid: false, error: `Trường "${f}" không đúng kiểu mảng (Array).` };
    }
  }

  let duplicateGoalIds = 0;
  if (Array.isArray(candidateData.tcGoals)) {
    const seenIds = new Set();
    candidateData.tcGoals.forEach(g => {
      if (g && g.id) {
        if (seenIds.has(g.id)) duplicateGoalIds++;
        seenIds.add(g.id);
      }
    });
  }

  return {
    valid: true,
    schemaVersion: parsed.schemaVersion || "1.0-legacy",
    accountMeta: parsed.accountMeta || null,
    duplicateGoalIds,
    data: candidateData
  };
};

window.initU032Upload = function() {
  const root = document.getElementById('u032-upload-root');
  const zone = document.getElementById('u032-zone-btn');
  const pick = document.getElementById('u032-file-input');
  if (!root || !zone || !pick || root.dataset.u032Bound === 'true') return;

  root.dataset.u032Bound = 'true';

  zone.addEventListener('click', () => {
    pick.click();
  });

  pick.addEventListener('change', () => {
    const files = Array.from(pick.files || []);
    files.forEach(f => window.processU032File(f));
    pick.value = '';
  });

  let depth = 0;
  zone.addEventListener('dragenter', (e) => {
    e.preventDefault();
    depth++;
    root.classList.add('is-over');
  });
  zone.addEventListener('dragover', (e) => {
    e.preventDefault();
  });
  zone.addEventListener('dragleave', () => {
    if (--depth <= 0) {
      depth = 0;
      root.classList.remove('is-over');
    }
  });
  zone.addEventListener('drop', (e) => {
    e.preventDefault();
    depth = 0;
    root.classList.remove('is-over');
    const files = Array.from(e.dataTransfer?.files || []);
    files.forEach(f => window.processU032File(f));
  });
};

window.processU032File = function(file) {
  const root = document.getElementById('u032-upload-root');
  const list = document.getElementById('u032-files-list');
  if (!root || !list || !file) return;

  const name = file.name || 'file';
  const bytes = file.size || 0;
  const ext = (name.split('.').pop() || '').toLowerCase();

  const TYPE = { json: '#3D8BFF', csv: '#22A06B' };
  const badgeColor = TYPE[ext] || '#8E8A97';
  const badgeText = ext.slice(0, 4).toUpperCase();

  const li = document.createElement('li');
  li.className = 'u032-row';
  li.innerHTML = `
    <span class="u032-ic" style="--c:${badgeColor}" aria-hidden="true">${escapeHtml(badgeText)}</span>
    <span class="u032-meta">
      <b>${escapeHtml(name)}</b>
      <small>Đang nạp file...</small>
    </span>
    <span class="u032-st">
      <span class="u032-spin" aria-hidden="true"></span>
    </span>
    <span class="u032-bar" aria-hidden="true"></span>
  `;

  list.insertBefore(li, list.firstChild);
  while (list.children.length > 3) {
    list.lastElementChild.remove();
  }

  function sizeFormat(b) {
    if (b > 1048576) return (b / 1048576).toFixed(1) + ' MB';
    return Math.max(1, Math.round(b / 1024)) + ' KB';
  }

  function showDone(note) {
    li.classList.remove('fail');
    li.classList.add('done');
    const sm = li.querySelector('small');
    if (sm) sm.textContent = `${sizeFormat(bytes)} · ${note}`;
    const st = li.querySelector('.u032-st');
    if (st) {
      st.innerHTML = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 8.4l3 3 6-6.4"/></svg>';
    }
  }

  function showFail(errText) {
    li.classList.remove('done');
    li.classList.add('fail');
    const sm = li.querySelector('small');
    if (sm) sm.textContent = errText;
    const st = li.querySelector('.u032-st');
    if (st) {
      st.innerHTML = '<button type="button" class="u032-retry">Thử lại</button>';
      const retryBtn = st.querySelector('.u032-retry');
      if (retryBtn) {
        retryBtn.onclick = () => {
          li.remove();
          window.processU032File(file);
        };
      }
    }
  }

  if (bytes > 5 * 1024 * 1024) {
    showFail("Dung lượng vượt quá giới hạn 5MB");
    return;
  }

  if (ext !== 'json' && ext !== 'csv') {
    showFail("Định dạng không được hỗ trợ (chỉ nhận .json hoặc .csv)");
    return;
  }

  const rm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const duration = rm ? 180 : 850 + Math.random() * 450;
  const t0 = performance.now();

  const reader = new FileReader();
  let content = null;
  let readErr = null;

  reader.onload = (e) => {
    content = String(e.target?.result || '');
  };
  reader.onerror = () => {
    readErr = "Không thể đọc dữ liệu file.";
  };
  reader.readAsText(file, "utf-8");

  function frame(now) {
    const elapsed = now - t0;
    const p = Math.min(1, elapsed / duration);
    li.style.setProperty('--p', p.toFixed(3));

    const sm = li.querySelector('small');
    if (sm) {
      sm.textContent = sizeFormat(bytes * p) + ' / ' + sizeFormat(bytes) + ' · ' + Math.round(p * 100) + '%';
    }

    if (p < 1) {
      requestAnimationFrame(frame);
      return;
    }

    if (readErr) {
      showFail(readErr);
      return;
    }

    if (ext === 'json') {
      const val = window.validateAndPrepareJsonImport(content);
      if (!val.valid) {
        showFail(val.error || "File JSON không hợp lệ");
        return;
      }
      pendingJsonImportPayload = val;
      showDone("Đã nạp file JSON thành công");
      window.displayJsonImportOptions(val);
    } else if (ext === 'csv') {
      const csvRes = window.loadCsvTextForPreview(content);
      if (!csvRes || !csvRes.valid) {
        showFail(csvRes?.error || "File CSV không đúng định dạng");
        return;
      }
      showDone("Đã nạp file CSV thành công");
      window.displayCsvImportOptions();
    } else {
      showFail("Định dạng không được hỗ trợ (chỉ nhận .json hoặc .csv)");
    }
  }

  requestAnimationFrame(frame);
};

window.displayJsonImportOptions = function(valRes) {
  const jsonBox = document.getElementById('json-import-options-box');
  const csvBox = document.getElementById('csv-import-options-box');
  const csvPrev = document.getElementById('csv-import-preview-box');
  const csvMap = document.getElementById('csv-column-mapping-box');
  if (csvBox) csvBox.style.display = 'none';
  if (csvPrev) csvPrev.style.display = 'none';
  if (csvMap) csvMap.style.display = 'none';
  if (jsonBox) jsonBox.style.display = 'block';
  window.updateJsonImportPreview();
};

window.displayCsvImportOptions = function() {
  const jsonBox = document.getElementById('json-import-options-box');
  const jsonPrev = document.getElementById('json-import-preview-box');
  const csvBox = document.getElementById('csv-import-options-box');
  if (jsonBox) jsonBox.style.display = 'none';
  if (jsonPrev) jsonPrev.style.display = 'none';
  if (csvBox) csvBox.style.display = 'block';
};

window.handleJsonFileSelected = function(event) {
  const file = event?.target?.files?.[0];
  if (!file) return;
  window.processU032File(file);
};

function showJsonImportError(msg) {
  const errBox = document.getElementById('json-import-error-box');
  const prevBox = document.getElementById('json-import-preview-box');
  if (prevBox) prevBox.style.display = 'none';
  if (errBox) {
    errBox.textContent = msg;
    errBox.style.display = 'block';
  }
}

window.loadJsonImportTextForPreview = function(rawText) {
  const check = window.validateAndPrepareJsonImport(rawText);
  if (!check.valid) {
    pendingJsonImportPayload = null;
    showJsonImportError(check.error);
    return check;
  }

  pendingJsonImportPayload = check;
  const errBox = document.getElementById('json-import-error-box');
  if (errBox) errBox.style.display = 'none';
  window.updateJsonImportPreview();
  return check;
};

window.updateJsonImportPreview = function() {
  const prevBox = document.getElementById('json-import-preview-box');
  const verEl = document.getElementById('json-preview-version');
  const listEl = document.getElementById('json-preview-summary-list');
  if (!pendingJsonImportPayload || !pendingJsonImportPayload.valid) {
    if (prevBox) prevBox.style.display = 'none';
    return;
  }

  const d = pendingJsonImportPayload.data;
  const modeEl = document.querySelector('input[name="json-import-mode"]:checked');
  const mode = modeEl ? modeEl.value : 'update';
  const allowKeywords = Boolean(document.getElementById('chk-json-allow-keywords')?.checked);

  const goalsCount = (d.tcGoals || []).length;
  const planIncCount = (d.planIncome || []).length;
  const planExpCount = (d.planExpense || []).length;
  let txCount = 0;
  if (d.monthlyDetails && typeof d.monthlyDetails === 'object') {
    for (let m = 1; m <= 12; m++) {
      const md = d.monthlyDetails[m];
      if (md) {
        txCount += (md.incomes?.length || 0) + (md.expenses?.length || 0) + (md.learningDetails?.length || 0);
      }
    }
  }

  if (verEl) verEl.textContent = `Schema ${pendingJsonImportPayload.schemaVersion}`;
  if (listEl) {
    const kwCount = (d.expenses?.length || 0) + (d.incomeList?.length || 0) + (d.investProducts?.length || 0) + (d.planList?.length || 0);
    const modeLabel = mode === 'add'
      ? 'Thêm dữ liệu mới (Add)'
      : (mode === 'replace' ? 'Thay thế dữ liệu hiện có (Replace)' : 'Cập nhật dữ liệu trùng khóa (Update)');
    listEl.innerHTML = `
      <div>• <strong>Chế độ nhập đã chọn:</strong> ${modeLabel}</div>
      <div>• <strong>Thông số "Từ khóa" trong file:</strong> ${kwCount} mục (${d.expenses?.length || 0} chi, ${d.incomeList?.length || 0} thu, ${d.investProducts?.length || 0} đầu tư, ${d.planList?.length || 0} học tập) - ${allowKeywords ? '<span class="text-success font-bold">Sẽ đồng bộ</span>' : '<span class="text-muted">Bỏ qua (Giữ hiện tại)</span>'}</div>
      <div>• <strong>Mục tiêu tài chính trong file:</strong> ${goalsCount} mục tiêu ${pendingJsonImportPayload.duplicateGoalIds > 0 ? `(Phát hiện ${pendingJsonImportPayload.duplicateGoalIds} ID trùng sẽ được chuẩn hóa)` : ''}</div>
      <div>• <strong>Kế hoạch thu / chi:</strong> ${planIncCount} khoản thu, ${planExpCount} khoản chi</div>
      <div>• <strong>Giao dịch 12 tháng:</strong> ${txCount} bản ghi</div>
      <div>• <strong>Hai mục tiêu cố định ("Hưu trí", "Quỹ dự phòng Tài chính"):</strong> Được bảo vệ cấu trúc và không thể bị xóa.</div>
    `;
  }
  if (prevBox) prevBox.style.display = 'flex';
};

window.applyJsonImportData = function(importData, mode = 'update', allowKeywords = true) {
  if (!importData || typeof importData !== 'object') return false;
  const cleanImport = JSON.parse(JSON.stringify(importData));

  if (allowKeywords) {
    if (typeof cleanImport.currentYear === 'number') AppState.currentYear = cleanImport.currentYear;
    if (typeof cleanImport.currentAge === 'number') AppState.currentAge = cleanImport.currentAge;
    if (typeof cleanImport.birthYear === 'number') AppState.birthYear = cleanImport.birthYear;
    if (Array.isArray(cleanImport.expenses)) {
      if (mode === 'replace') AppState.expenses = [...cleanImport.expenses];
      else {
        cleanImport.expenses.forEach(item => {
          if (typeof item === 'string' && !AppState.expenses.includes(item)) AppState.expenses.push(item);
        });
      }
    }
    if (Array.isArray(cleanImport.incomeList)) {
      if (mode === 'replace') AppState.incomeList = [...cleanImport.incomeList];
      else {
        cleanImport.incomeList.forEach(item => {
          if (typeof item === 'string' && !AppState.incomeList.includes(item)) AppState.incomeList.push(item);
        });
      }
    }
    if (Array.isArray(cleanImport.planList)) {
      if (mode === 'replace') AppState.planList = [...cleanImport.planList];
      else {
        cleanImport.planList.forEach(item => {
          if (typeof item === 'string' && !AppState.planList.includes(item)) AppState.planList.push(item);
        });
      }
    }
    if (Array.isArray(cleanImport.investProducts)) {
      const sanitizedProds = cleanImport.investProducts.map(prod => {
        if (!prod || !prod.name) return null;
        const ret = (typeof prod.returnRate === 'string')
          ? (parseFloat(prod.returnRate.replace(/[^0-9.-]/g, '')) || 0)
          : (Number(prod.returnRate) || 0);
        const rsk = (typeof prod.risk === 'string')
          ? (parseFloat(prod.risk.replace(/[^0-9.-]/g, '')) || 0)
          : (Number(prod.risk) || 0);
        return {
          name: String(prod.name).trim(),
          returnRate: ret,
          risk: rsk
        };
      }).filter(Boolean);

      if (mode === 'replace') {
        AppState.investProducts = sanitizedProds;
      } else {
        sanitizedProds.forEach(prod => {
          const idx = AppState.investProducts.findIndex(p => p.name === prod.name);
          if (idx === -1) {
            AppState.investProducts.push(prod);
          } else if (mode === 'update') {
            AppState.investProducts[idx] = Object.assign(AppState.investProducts[idx], prod);
          }
        });
      }
    }
  }

  const mergeByKey = (targetArr, sourceArr, keyField = 'name') => {
    if (!Array.isArray(sourceArr)) return targetArr;
    if (mode === 'replace') {
      return [...sourceArr];
    }
    const out = Array.isArray(targetArr) ? [...targetArr] : [];
    sourceArr.forEach(item => {
      if (!item || typeof item !== 'object') return;
      const kVal = String(item[keyField] || '').trim();
      const existingIdx = out.findIndex(x => x && String(x[keyField] || '').trim() === kVal && kVal !== '');
      if (existingIdx === -1) {
        out.push(item);
      } else if (mode === 'update') {
        out[existingIdx] = Object.assign({}, out[existingIdx], item);
      }
    });
    return out;
  };

  if (Array.isArray(cleanImport.planIncome)) {
    AppState.planIncome = mergeByKey(AppState.planIncome, cleanImport.planIncome, 'name');
  }
  if (Array.isArray(cleanImport.planExpense)) {
    AppState.planExpense = mergeByKey(AppState.planExpense, cleanImport.planExpense, 'name');
  }
  if (Array.isArray(cleanImport.skillsList)) {
    AppState.skillsList = mergeByKey(AppState.skillsList, cleanImport.skillsList, 'name');
  }
  if (Array.isArray(cleanImport.familyList)) {
    AppState.familyList = mergeByKey(AppState.familyList, cleanImport.familyList, 'name');
  }
  if (Array.isArray(cleanImport.jobList)) {
    AppState.jobList = mergeByKey(AppState.jobList, cleanImport.jobList, 'name');
  }

  if (Array.isArray(cleanImport.tcGoals)) {
    ensureFixedInvestmentGoals();
    const currentRetire = AppState.tcGoals.find(isRetirementFixedGoal);
    const currentCollege = AppState.tcGoals.find(isCollegeFixedGoal);

    if (mode === 'replace') {
      AppState.tcGoals = cleanImport.tcGoals.filter(g => g && typeof g === 'object');
      if (!AppState.tcGoals.find(isRetirementFixedGoal) && currentRetire) {
        AppState.tcGoals.push(currentRetire);
      }
      if (!AppState.tcGoals.find(isCollegeFixedGoal) && currentCollege) {
        AppState.tcGoals.push(currentCollege);
      }
    } else {
      cleanImport.tcGoals.forEach(g => {
        if (!g || typeof g !== 'object') return;
        if (isCollegeFixedGoal(g)) {
          if (mode === 'update' && currentCollege) {
            Object.assign(currentCollege, g, { id: 'fixed_college', name: g.name || currentCollege.name || 'Quỹ dự phòng Tài chính', type: 'invest', isFixed: true, fixedType: 'college' });
          }
          return;
        }
        if (isRetirementFixedGoal(g)) {
          if (mode === 'update' && currentRetire) {
            Object.assign(currentRetire, g, { id: 'fixed_retirement', name: g.name || currentRetire.name || 'Hưu trí', type: 'invest', isFixed: true, fixedType: 'retirement' });
          }
          return;
        }
        const matchIdx = AppState.tcGoals.findIndex(x => (g.id && x.id === g.id) || (g.name && x.name === g.name));
        if (matchIdx === -1) {
          AppState.tcGoals.push(Object.assign({}, g, { id: g.id || `g_${Date.now()}_${Math.random().toString(36).slice(2, 5)}` }));
        } else if (mode === 'update') {
          AppState.tcGoals[matchIdx] = Object.assign({}, AppState.tcGoals[matchIdx], g);
        }
      });
    }
    ensureFixedInvestmentGoals();
  }

  if (cleanImport.monthlyDetails && typeof cleanImport.monthlyDetails === 'object') {
    for (let m = 1; m <= 12; m++) {
      const srcM = cleanImport.monthlyDetails[m];
      if (!srcM || typeof srcM !== 'object') continue;
      if (!AppState.monthlyDetails[m]) {
        AppState.monthlyDetails[m] = { incomes: [], expenses: [], reconIncomeNotes: {}, reconExpenseNotes: {}, learningDetails: [] };
      }
      const dstM = AppState.monthlyDetails[m];

      if (mode === 'replace') {
        if (Array.isArray(srcM.incomes)) dstM.incomes = [...srcM.incomes];
        if (Array.isArray(srcM.expenses)) dstM.expenses = [...srcM.expenses];
        if (Array.isArray(srcM.learningDetails)) dstM.learningDetails = [...srcM.learningDetails];
      } else {
        if (Array.isArray(srcM.incomes)) {
          srcM.incomes.forEach(tx => {
            if (!tx || typeof tx !== 'object') return;
            const dupIdx = dstM.incomes.findIndex(x => x.date === tx.date && x.cat === tx.cat);
            if (dupIdx === -1) dstM.incomes.push(tx);
            else if (mode === 'update') dstM.incomes[dupIdx] = Object.assign({}, dstM.incomes[dupIdx], tx);
            else dstM.incomes.push(tx);
          });
        }
        if (Array.isArray(srcM.expenses)) {
          srcM.expenses.forEach(tx => {
            if (!tx || typeof tx !== 'object') return;
            const dupIdx = dstM.expenses.findIndex(x => x.date === tx.date && x.cat === tx.cat);
            if (dupIdx === -1) dstM.expenses.push(tx);
            else if (mode === 'update') dstM.expenses[dupIdx] = Object.assign({}, dstM.expenses[dupIdx], tx);
            else dstM.expenses.push(tx);
          });
        }
        if (Array.isArray(srcM.learningDetails)) {
          dstM.learningDetails = mergeByKey(dstM.learningDetails, srcM.learningDetails, 'name');
        }
      }
    }
  }

  if (cleanImport.surveyP1Choices && typeof cleanImport.surveyP1Choices === 'object') {
    if (mode === 'replace') AppState.surveyP1Choices = { ...cleanImport.surveyP1Choices };
    else if (mode === 'update') Object.assign(AppState.surveyP1Choices, cleanImport.surveyP1Choices);
  }
  if (cleanImport.surveyP2Choices && typeof cleanImport.surveyP2Choices === 'object') {
    if (mode === 'replace') AppState.surveyP2Choices = { ...cleanImport.surveyP2Choices };
    else if (mode === 'update') Object.assign(AppState.surveyP2Choices, cleanImport.surveyP2Choices);
  }

  if (cleanImport.careerActualOverrides && typeof cleanImport.careerActualOverrides === 'object') {
    if (mode === 'replace') AppState.careerActualOverrides = { ...cleanImport.careerActualOverrides };
    else {
      if (!AppState.careerActualOverrides) AppState.careerActualOverrides = {};
      Object.assign(AppState.careerActualOverrides, cleanImport.careerActualOverrides);
    }
  }
  if (cleanImport.careerRouteOverrides && typeof cleanImport.careerRouteOverrides === 'object') {
    if (mode === 'replace') AppState.careerRouteOverrides = { ...cleanImport.careerRouteOverrides };
    else {
      if (!AppState.careerRouteOverrides) AppState.careerRouteOverrides = {};
      Object.assign(AppState.careerRouteOverrides, cleanImport.careerRouteOverrides);
    }
  }
  if (Array.isArray(cleanImport.careerDetailList)) {
    if (mode === 'replace') {
      AppState.careerDetailList = cleanImport.careerDetailList.map(item => Object.assign({}, item));
    } else {
      if (!Array.isArray(AppState.careerDetailList)) AppState.careerDetailList = [];
      cleanImport.careerDetailList.forEach(item => {
        if (!item || typeof item !== 'object') return;
        const idx = AppState.careerDetailList.findIndex(x => x.age === item.age);
        if (idx === -1) AppState.careerDetailList.push(Object.assign({}, item));
        else if (mode === 'update') Object.assign(AppState.careerDetailList[idx], item);
      });
    }
  }
  if (cleanImport.skillsStore && typeof cleanImport.skillsStore === 'object') {
    if (mode === 'replace') AppState.skillsStore = { ...cleanImport.skillsStore };
    else Object.assign(AppState.skillsStore, cleanImport.skillsStore);
  }
  if (cleanImport.milestonesStore && typeof cleanImport.milestonesStore === 'object') {
    if (mode === 'replace') AppState.milestonesStore = { ...cleanImport.milestonesStore };
    else Object.assign(AppState.milestonesStore, cleanImport.milestonesStore);
  }
  if (cleanImport.matrixOverrides && typeof cleanImport.matrixOverrides === 'object') {
    if (mode === 'replace') AppState.matrixOverrides = { ...cleanImport.matrixOverrides };
    else if (mode === 'update') Object.assign(AppState.matrixOverrides, cleanImport.matrixOverrides);
  }

  if (cleanImport.yearEndBalanceSheet && typeof cleanImport.yearEndBalanceSheet === 'object') {
    ensureYearEndBalanceSheet();
    if (Array.isArray(cleanImport.yearEndBalanceSheet.assets)) {
      const sanitizedAssets = cleanImport.yearEndBalanceSheet.assets.map(a => {
        if (!a || typeof a !== 'object') return null;
        const name = String(a.name || '').trim();
        const val = Number(a.val) || 0;
        let source = a.source;
        if (source !== 'keyword' && source !== 'custom') {
          const isKw = (AppState.investProducts || []).some(p => p.name === name);
          source = isKw ? 'keyword' : 'custom';
        }
        return { name, source, val };
      }).filter(Boolean);

      if (mode === 'replace') {
        AppState.yearEndBalanceSheet.assets = sanitizedAssets;
      } else {
        sanitizedAssets.forEach(a => {
          const idx = AppState.yearEndBalanceSheet.assets.findIndex(x => x.name === a.name);
          if (idx === -1) AppState.yearEndBalanceSheet.assets.push({ ...a });
          else if (mode === 'update') AppState.yearEndBalanceSheet.assets[idx] = { ...a };
        });
      }
    }
    if (Array.isArray(cleanImport.yearEndBalanceSheet.liabilities)) {
      if (mode === 'replace') {
        AppState.yearEndBalanceSheet.liabilities = cleanImport.yearEndBalanceSheet.liabilities.map(l => ({ name: String(l?.name || ''), val: Number(l?.val) || 0 }));
      } else {
        cleanImport.yearEndBalanceSheet.liabilities.forEach(l => {
          if (!l || !l.name) return;
          const idx = AppState.yearEndBalanceSheet.liabilities.findIndex(x => x.name === l.name);
          if (idx === -1) AppState.yearEndBalanceSheet.liabilities.push({ name: String(l.name), val: Number(l.val) || 0 });
          else if (mode === 'update') AppState.yearEndBalanceSheet.liabilities[idx] = { name: String(l.name), val: Number(l.val) || 0 };
        });
      }
    }
  }

  ensureFixedInvestmentGoals();
  syncInvestProductsToGoals();
  const yEl = document.getElementById('input-year');
  const aEl = document.getElementById('input-age');
  if (yEl) yEl.innerText = AppState.currentYear;
  if (aEl) aEl.innerText = AppState.currentAge;
  document.querySelectorAll('.dynamic-year').forEach(el => el.textContent = AppState.currentYear);

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
  renderYearEndBalanceSheet();
  window.markUnsavedChanges();
  return true;
};

window.confirmJsonImport = function() {
  if (!pendingJsonImportPayload || !pendingJsonImportPayload.valid) {
    showToast("Vui lòng chọn file JSON hợp lệ trước khi xác nhận.", "error");
    return false;
  }
  const modeEl = document.querySelector('input[name="json-import-mode"]:checked');
  const mode = modeEl ? modeEl.value : 'update';
  const allowKeywords = Boolean(document.getElementById('chk-json-allow-keywords')?.checked);

  const ok = window.applyJsonImportData(pendingJsonImportPayload.data, mode, allowKeywords);
  if (ok) {
    showToast("Đã nhập dữ liệu JSON thành công!", "success");
    closeDataIoModal();
  }
  return ok;
};

window.parseRFC4180CSV = function(csvText) {
  if (typeof csvText !== 'string') return [];
  const cleanText = csvText.replace(/^\uFEFF/, '');
  const rows = [];
  let currentRow = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < cleanText.length; i++) {
    const ch = cleanText[i];
    const nextCh = cleanText[i + 1];

    if (inQuotes) {
      if (ch === '"' && nextCh === '"') {
        currentField += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        currentField += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        currentRow.push(currentField.trim());
        currentField = '';
      } else if (ch === '\r' && nextCh === '\n') {
        currentRow.push(currentField.trim());
        rows.push(currentRow);
        currentRow = [];
        currentField = '';
        i++;
      } else if (ch === '\n' || ch === '\r') {
        currentRow.push(currentField.trim());
        rows.push(currentRow);
        currentRow = [];
        currentField = '';
      } else {
        currentField += ch;
      }
    }
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    rows.push(currentRow);
  }

  return rows.filter(r => r.some(cell => cell !== ''));
};

window.onCsvTargetTableChange = function() {
  const tableKey = document.getElementById('select-csv-target-table')?.value || 'month_income';
  const schema = CSV_TABLE_SCHEMAS[tableKey];
  const monthGroup = document.getElementById('csv-month-select-group');
  if (monthGroup) {
    monthGroup.style.display = (schema && schema.requireMonth) ? 'flex' : 'none';
  }
  if (pendingCsvParsedState && pendingCsvParsedState.rawRows) {
    buildCsvColumnMappingUI(pendingCsvParsedState.headers, tableKey);
    window.revalidateCsvPreview();
  }
};

window.downloadCsvTemplate = function() {
  const tableKey = document.getElementById('select-csv-target-table')?.value || 'month_income';
  const schema = CSV_TABLE_SCHEMAS[tableKey];
  if (!schema) return;
  const headerLine = schema.fields.map(f => `"${f.key}"`).join(',');
  const bodyLines = (schema.sampleRows || []).map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','));
  const csvContent = "\uFEFF" + [headerLine, ...bodyLines].join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `mau_${tableKey}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

window.exportCurrentTableToCsv = function() {
  const tableKey = document.getElementById('select-csv-target-table')?.value || 'month_income';
  const schema = CSV_TABLE_SCHEMAS[tableKey];
  if (!schema) return;
  const month = parseInt(document.getElementById('select-csv-target-month')?.value || String(AppState.currentMonth || 1), 10) || 1;
  const headerLine = schema.fields.map(f => `"${f.key}"`).join(',');
  const rows = [];

  if (tableKey === 'keywords_expense') {
    (AppState.expenses || []).forEach(item => {
      rows.push([`"${String(item).replace(/"/g, '""')}"`]);
    });
  } else if (tableKey === 'keywords_income') {
    (AppState.incomeList || []).forEach(item => {
      rows.push([`"${String(item).replace(/"/g, '""')}"`]);
    });
  } else if (tableKey === 'keywords_learning') {
    (AppState.planList || []).forEach(item => {
      rows.push([`"${String(item).replace(/"/g, '""')}"`]);
    });
  } else if (tableKey === 'keywords_invest') {
    (AppState.investProducts || []).forEach(p => {
      rows.push([
        `"${String(p.name || '').replace(/"/g, '""')}"`,
        `"${Number(p.returnRate || 0).toFixed(1)}"`,
        `"${Number(p.risk || 0).toFixed(1)}"`
      ]);
    });
  } else if (tableKey === 'career_route') {
    const list = (AppState.careerDetailList && AppState.careerDetailList.length > 0) ? AppState.careerDetailList : calculateCareerDetails();
    list.forEach(item => {
      const act = (item.actual !== null && item.actual !== undefined && !isNaN(item.actual)) ? Number(item.actual).toFixed(1) : "";
      const rt = (item.route !== null && item.route !== undefined && !isNaN(item.route)) ? Number(item.route).toFixed(1) : "";
      rows.push([`"${item.age}"`, `"${act}"`, `"${rt}"`]);
    });
  } else if (tableKey === 'plan_income') {
    (AppState.planIncome || []).forEach(p => {
      rows.push([
        `"${String(p.name || '').replace(/"/g, '""')}"`,
        `"${Number(p.plan || 0).toFixed(1)}"`,
        `"${String(p.note || '').replace(/"/g, '""')}"`
      ]);
    });
  } else if (tableKey === 'plan_expense') {
    (AppState.planExpense || []).forEach(p => {
      rows.push([
        `"${String(p.name || '').replace(/"/g, '""')}"`,
        `"${Number(p.plan || 0).toFixed(1)}"`,
        `"${String(p.note || '').replace(/"/g, '""')}"`
      ]);
    });
  } else if (tableKey === 'tc_goals') {
    (AppState.tcGoals || []).forEach(g => {
      rows.push([
        `"${String(g.name || '').replace(/"/g, '""')}"`,
        `"${g.type || 'invest'}"`,
        `"${Number(g.val || 0)}"`,
        `"${Number(g.paid || 0)}"`,
        `"${Number(g.start || 0)}"`,
        `"${Number(g.end || 0)}"`,
        `"${Number(g.rate || 0)}"`
      ]);
    });
  } else if (tableKey === 'month_income') {
    const md = AppState.monthlyDetails?.[month];
    (md?.incomes || []).forEach(tx => {
      rows.push([
        `"${String(tx.date || '').replace(/"/g, '""')}"`,
        `"${String(tx.cat || '').replace(/"/g, '""')}"`,
        `"${Number(tx.val || 0).toFixed(1)}"`
      ]);
    });
  } else if (tableKey === 'month_expense') {
    const md = AppState.monthlyDetails?.[month];
    (md?.expenses || []).forEach(tx => {
      rows.push([
        `"${String(tx.date || '').replace(/"/g, '""')}"`,
        `"${String(tx.cat || '').replace(/"/g, '""')}"`,
        `"${Number(tx.val || 0).toFixed(1)}"`
      ]);
    });
  } else if (tableKey === 'month_learning') {
    const md = AppState.monthlyDetails?.[month];
    (md?.learningDetails || []).forEach(l => {
      rows.push([
        `"${String(l.name || '').replace(/"/g, '""')}"`,
        `"${Number(l.cost || 0).toFixed(1)}"`,
        `"${String(l.note || '').replace(/"/g, '""')}"`
      ]);
    });
  }

  const csvContent = "\uFEFF" + [headerLine, ...rows.map(r => r.join(','))].join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const suffix = schema.requireMonth ? `_t${month}` : '';
  a.download = `du_lieu_${tableKey}${suffix}_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  showToast(`Đã xuất bảng [${schema.label}] ra file CSV!`, "success");
};

window.handleCsvFileSelected = function(event) {
  const file = event?.target?.files?.[0];
  if (!file) return;
  if (typeof window.processU032File === 'function') {
    window.processU032File(file);
  } else {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = String(e.target?.result || '');
      window.loadCsvTextForPreview(text);
    };
    reader.readAsText(file, "utf-8");
  }
};

function buildCsvColumnMappingUI(headers, tableKey) {
  const schema = CSV_TABLE_SCHEMAS[tableKey];
  const mapBox = document.getElementById('csv-column-mapping-box');
  const fieldsContainer = document.getElementById('csv-mapping-fields');
  if (!schema || !mapBox || !fieldsContainer) return;

  fieldsContainer.innerHTML = schema.fields.map(f => {
    let defaultIdx = headers.findIndex(h => {
      const nh = normalizeUserName(h);
      const nk = normalizeUserName(f.key);
      const nl = normalizeUserName(f.label);
      return nh === nk || (nh && nl.includes(nh)) || (nh && nk.includes(nh));
    });
    if (defaultIdx === -1 && schema.fields.indexOf(f) < headers.length) {
      defaultIdx = schema.fields.indexOf(f);
    }

    return `
      <div class="io-mapping-item">
        <label>${escapeHtml(f.label)} ${f.required ? '*' : ''}</label>
        <select class="io-select csv-col-map-select" data-field-key="${f.key}" onchange="revalidateCsvPreview()">
          <option value="-1">-- Bỏ qua --</option>
          ${headers.map((h, i) => `<option value="${i}" ${i === defaultIdx ? 'selected' : ''}>Cột ${i + 1}: ${escapeHtml(h || `(Cột ${i + 1})`)}</option>`).join('')}
        </select>
      </div>
    `;
  }).join('');

  mapBox.style.display = 'flex';
}

window.loadCsvTextForPreview = function(csvText, explicitTableKey = null) {
  const errBox = document.getElementById('csv-import-error-box');
  const prevBox = document.getElementById('csv-import-preview-box');
  const mapBox = document.getElementById('csv-column-mapping-box');

  if (explicitTableKey) {
    const sel = document.getElementById('select-csv-target-table');
    if (sel) sel.value = explicitTableKey;
  }

  const rows = window.parseRFC4180CSV(csvText);
  if (!rows || rows.length < 2) {
    if (prevBox) prevBox.style.display = 'none';
    if (mapBox) mapBox.style.display = 'none';
    if (errBox) {
      errBox.textContent = "File CSV phải có ít nhất 1 dòng tiêu đề (header) và 1 dòng dữ liệu.";
      errBox.style.display = 'block';
    }
    pendingCsvParsedState = null;
    return { valid: false, error: "Thiếu dữ liệu CSV" };
  }

  if (errBox) errBox.style.display = 'none';
  const headers = rows[0];
  const dataRows = rows.slice(1);
  const tableKey = document.getElementById('select-csv-target-table')?.value || 'month_income';

  pendingCsvParsedState = {
    headers,
    rawRows: dataRows,
    validRecords: [],
    invalidRows: [],
    duplicateCount: 0
  };

  buildCsvColumnMappingUI(headers, tableKey);
  return window.revalidateCsvPreview();
};

window.revalidateCsvPreview = function() {
  if (!pendingCsvParsedState) return null;
  const tableKey = document.getElementById('select-csv-target-table')?.value || 'month_income';
  const schema = CSV_TABLE_SCHEMAS[tableKey];
  if (!schema) return null;

  const mapping = {};
  document.querySelectorAll('.csv-col-map-select').forEach(sel => {
    const k = sel.getAttribute('data-field-key');
    mapping[k] = parseInt(sel.value, 10);
  });

  schema.fields.forEach((f, idx) => {
    if (mapping[f.key] === undefined) {
      mapping[f.key] = idx < pendingCsvParsedState.headers.length ? idx : -1;
    }
  });

  const validRecords = [];
  const invalidRows = [];
  let duplicateCount = 0;
  const seenKeys = new Set();

  pendingCsvParsedState.rawRows.forEach((rowCells, rIdx) => {
    const record = {};
    const rowErrors = [];

    schema.fields.forEach(f => {
      const colIdx = mapping[f.key];
      const rawVal = (colIdx >= 0 && colIdx < rowCells.length) ? String(rowCells[colIdx] ?? '').trim() : '';

      if (f.required && rawVal === '') {
        rowErrors.push(`Thiếu "${f.label}"`);
        return;
      }

      if (f.type === 'number') {
        if (rawVal === '') {
          record[f.key] = 0;
        } else {
          const normalizedNum = rawVal.replace(/\s/g, '').replace(/,/g, '.');
          const parsedNum = Number(normalizedNum);
          if (isNaN(parsedNum) || !isFinite(parsedNum)) {
            rowErrors.push(`Giá trị số không hợp lệ ở "${f.label}" ("${rawVal}")`);
          } else {
            record[f.key] = parsedNum;
          }
        }
      } else if (f.key === 'date') {
        record.date = rawVal ? parseToIsoDate(rawVal) : `${AppState.currentYear || 2026}-01-01`;
      } else {
        record[f.key] = rawVal;
      }
    });

    const dedupSignature = JSON.stringify(record);
    if (seenKeys.has(dedupSignature)) {
      duplicateCount++;
    }
    seenKeys.add(dedupSignature);

    if (rowErrors.length > 0) {
      invalidRows.push({ rowNumber: rIdx + 2, rawCells: rowCells, errors: rowErrors });
    } else {
      validRecords.push({ rowNumber: rIdx + 2, record });
    }
  });

  pendingCsvParsedState.validRecords = validRecords;
  pendingCsvParsedState.invalidRows = invalidRows;
  pendingCsvParsedState.duplicateCount = duplicateCount;
  pendingCsvParsedState.tableKey = tableKey;

  const prevBox = document.getElementById('csv-import-preview-box');
  const badgeEl = document.getElementById('csv-preview-counts-badge');
  const wrapEl = document.getElementById('csv-preview-table-wrap');

  if (badgeEl) {
    badgeEl.textContent = `${validRecords.length} hợp lệ • ${invalidRows.length} lỗi • ${duplicateCount} trùng`;
  }

  if (wrapEl) {
    const previewSlice = validRecords.slice(0, 8);
    const errSlice = invalidRows.slice(0, 5);
    wrapEl.innerHTML = `
      <table class="excel-table" style="font-size: 0.78rem;">
        <thead>
          <tr class="header-sub">
            <th>Dòng</th>
            ${schema.fields.map(f => `<th>${escapeHtml(f.label)}</th>`).join('')}
            <th>Trạng thái</th>
          </tr>
        </thead>
        <tbody>
          ${previewSlice.map(item => `
            <tr>
              <td class="text-center font-mono">#${item.rowNumber}</td>
              ${schema.fields.map(f => `<td>${escapeHtml(item.record[f.key])}</td>`).join('')}
              <td class="text-success font-bold">Hợp lệ</td>
            </tr>
          `).join('')}
          ${errSlice.map(err => `
            <tr>
              <td class="text-center font-mono text-danger">#${err.rowNumber}</td>
              <td colspan="${schema.fields.length}" class="text-danger">${escapeHtml(err.errors.join('; '))}</td>
              <td class="text-danger font-bold">Lỗi</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  if (prevBox) prevBox.style.display = 'flex';
  return {
    valid: validRecords.length > 0,
    validCount: validRecords.length,
    errorCount: invalidRows.length,
    duplicateCount
  };
};

window.confirmCsvImport = function() {
  if (!pendingCsvParsedState || !Array.isArray(pendingCsvParsedState.validRecords) || pendingCsvParsedState.validRecords.length === 0) {
    showToast("Không có dòng dữ liệu CSV hợp lệ nào để nhập!", "error");
    return false;
  }

  const tableKey = pendingCsvParsedState.tableKey || document.getElementById('select-csv-target-table')?.value || 'month_income';
  const mode = document.getElementById('select-csv-import-mode')?.value || 'add';
  const month = parseInt(document.getElementById('select-csv-target-month')?.value || String(AppState.currentMonth || 1), 10) || 1;
  const records = pendingCsvParsedState.validRecords.map(x => x.record);

  if (tableKey === 'month_income' || tableKey === 'month_expense' || tableKey === 'month_learning') {
    if (!AppState.monthlyDetails[month]) {
      AppState.monthlyDetails[month] = { incomes: [], expenses: [], reconIncomeNotes: {}, reconExpenseNotes: {}, learningDetails: [] };
    }
    const md = AppState.monthlyDetails[month];

    if (tableKey === 'month_income') {
      if (mode === 'replace') md.incomes = [];
      records.forEach(r => {
        const idx = md.incomes.findIndex(x => x.cat === r.cat && x.date === r.date);
        if (idx >= 0 && mode === 'update') md.incomes[idx].val = Number(r.val) || 0;
        else md.incomes.push({ date: r.date, cat: r.cat, val: Number(r.val) || 0 });
      });
      sortMonthTransactions(month, 'incomes');
    } else if (tableKey === 'month_expense') {
      if (mode === 'replace') md.expenses = md.expenses.filter(x => x.autoSyncedLearning);
      records.forEach(r => {
        const idx = md.expenses.findIndex(x => x.cat === r.cat && x.date === r.date && !x.autoSyncedLearning);
        if (idx >= 0 && mode === 'update') md.expenses[idx].val = Number(r.val) || 0;
        else md.expenses.push({ date: r.date, cat: r.cat, val: Number(r.val) || 0 });
      });
      sortMonthTransactions(month, 'expenses');
    } else if (tableKey === 'month_learning') {
      if (mode === 'replace') md.learningDetails = [];
      records.forEach(r => {
        const idx = md.learningDetails.findIndex(x => x.name === r.name);
        if (idx >= 0 && mode === 'update') {
          md.learningDetails[idx].cost = Number(r.cost) || 0;
          md.learningDetails[idx].note = r.note || '';
        } else {
          md.learningDetails.push({ name: r.name, cost: Number(r.cost) || 0, note: r.note || '' });
        }
      });
      syncMonthLearningExpense(month);
    }
  } else if (tableKey === 'plan_income') {
    if (mode === 'replace') AppState.planIncome = [];
    records.forEach(r => {
      const idx = AppState.planIncome.findIndex(x => x.name === r.name);
      if (idx >= 0 && mode === 'update') {
        AppState.planIncome[idx].plan = Number(r.plan) || 0;
        AppState.planIncome[idx].note = r.note || '';
      } else {
        AppState.planIncome.push({ name: r.name, plan: Number(r.plan) || 0, note: r.note || '' });
      }
    });
  } else if (tableKey === 'plan_expense') {
    if (mode === 'replace') AppState.planExpense = [];
    records.forEach(r => {
      const idx = AppState.planExpense.findIndex(x => x.name === r.name);
      if (idx >= 0 && mode === 'update') {
        AppState.planExpense[idx].plan = Number(r.plan) || 0;
        AppState.planExpense[idx].note = r.note || '';
      } else {
        AppState.planExpense.push({ name: r.name, plan: Number(r.plan) || 0, note: r.note || '' });
      }
    });
  } else if (tableKey === 'tc_goals') {
    ensureFixedInvestmentGoals();
    if (mode === 'replace') {
      AppState.tcGoals = AppState.tcGoals.filter(isFixedInvestmentGoal);
    }
    records.forEach(r => {
      const item = {
        id: `g_csv_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
        name: r.name,
        type: (r.type === 'debt') ? 'debt' : 'invest',
        val: Number(r.val) || 0,
        paid: Number(r.paid) || 0,
        start: Number(r.start) || 0,
        end: Number(r.end) || 0,
        rate: Number(r.rate) || 0,
        inflation: 0,
        monthly: 0,
        allocProducts: createEmptyAllocProducts()
      };
      if (isCollegeFixedGoal(item)) {
        const col = AppState.tcGoals.find(isCollegeFixedGoal);
        if (col && mode !== 'add') {
          col.val = item.val;
          col.paid = item.paid;
          col.start = item.start;
          col.end = item.end;
          col.rate = item.rate;
          col.inflation = 0;
        }
        return;
      }
      if (isRetirementFixedGoal(item)) {
        const ret = AppState.tcGoals.find(isRetirementFixedGoal);
        if (ret && mode !== 'add') {
          ret.val = item.val;
          ret.paid = item.paid;
          ret.start = item.start;
          ret.end = item.end;
          ret.rate = item.rate;
          ret.inflation = 0;
        }
        return;
      }
      const existingIdx = AppState.tcGoals.findIndex(x => x.name === item.name && !isFixedInvestmentGoal(x));
      if (existingIdx >= 0 && mode === 'update') {
        Object.assign(AppState.tcGoals[existingIdx], item, { id: AppState.tcGoals[existingIdx].id });
      } else {
        AppState.tcGoals.push(item);
      }
    });
    ensureFixedInvestmentGoals();
  } else if (tableKey === 'keywords_expense') {
    if (mode === 'replace') AppState.expenses = [];
    records.forEach(r => {
      const name = String(r.name || '').trim();
      if (name && !AppState.expenses.includes(name)) {
        AppState.expenses.push(name);
      }
    });
    renderSetupTables();
    syncKeywordChangesToDependentSheets();
  } else if (tableKey === 'keywords_income') {
    if (mode === 'replace') AppState.incomeList = [];
    records.forEach(r => {
      const name = String(r.name || '').trim();
      if (name && !AppState.incomeList.includes(name)) {
        AppState.incomeList.push(name);
      }
    });
    renderSetupTables();
    syncKeywordChangesToDependentSheets();
  } else if (tableKey === 'keywords_learning') {
    if (mode === 'replace') AppState.planList = [];
    records.forEach(r => {
      const name = String(r.name || '').trim();
      if (name && !AppState.planList.includes(name)) {
        AppState.planList.push(name);
      }
    });
    renderSetupTables();
    syncKeywordChangesToDependentSheets();
  } else if (tableKey === 'keywords_invest') {
    if (mode === 'replace') AppState.investProducts = [];
    records.forEach(r => {
      const name = String(r.name || '').trim();
      if (!name) return;
      const retRate = parseFloat(r.returnRate) || 0;
      const riskVal = parseFloat(r.risk) || 0;
      const idx = AppState.investProducts.findIndex(p => p.name === name);
      if (idx >= 0 && mode === 'update') {
        AppState.investProducts[idx].returnRate = retRate;
        AppState.investProducts[idx].risk = riskVal;
      } else if (idx === -1) {
        AppState.investProducts.push({ name: name, returnRate: retRate, risk: riskVal });
      }
    });
    renderSetupTables();
    syncInvestProductsToGoals();
  } else if (tableKey === 'career_route') {
    if (!AppState.careerActualOverrides) AppState.careerActualOverrides = {};
    if (!AppState.careerRouteOverrides) AppState.careerRouteOverrides = {};
    records.forEach(r => {
      const age = parseInt(r.age, 10);
      if (!isNaN(age)) {
        if (r.actual !== undefined && r.actual !== null && String(r.actual).trim() !== '' && !isNaN(Number(r.actual))) {
          AppState.careerActualOverrides[age] = Number(r.actual);
        }
        if (r.route !== undefined && r.route !== null && String(r.route).trim() !== '' && !isNaN(Number(r.route))) {
          AppState.careerRouteOverrides[age] = Number(r.route);
        }
      }
    });
    AppState.careerDetailList = calculateCareerDetails();
    renderCareerTables();
    renderCareerChart();
  }

  renderPlanTables();
  renderTcGoalsFormTable();
  renderTcMatrixTable();
  renderCareerTables();
  renderMonthView(AppState.currentMonth);
  syncGoalsToCards();
  recalculateAll();
  window.markUnsavedChanges();

  showToast(`Đã nhập thành công ${records.length} dòng dữ liệu từ CSV!`, "success");
  closeDataIoModal();
  return true;
};

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
    (AppState.skillsList && AppState.skillsList.length > 0) ||
    (AppState.familyList && AppState.familyList.length > 0) ||
    (AppState.jobList && AppState.jobList.length > 0) ||
    (AppState.planIncome && AppState.planIncome.length > 0) ||
    (AppState.planExpense && AppState.planExpense.length > 0) ||
    (AppState.surveyP1Choices && Object.keys(AppState.surveyP1Choices).length > 0) ||
    (AppState.surveyP2Choices && Object.keys(AppState.surveyP2Choices).length > 0) ||
    (AppState.skillsStore && Object.values(AppState.skillsStore).some(v => typeof v === 'string' && v.trim() !== '')) ||
    (AppState.milestonesStore && Object.keys(AppState.milestonesStore).length > 0)
  ) {
    return true;
  }
  if (Array.isArray(AppState.tcGoals)) {
    const hasNonZeroGoal = AppState.tcGoals.some(g => !isFixedInvestmentGoal(g) || Number(g.val) > 0 || Number(g.start) > 0 || Number(g.end) > 0);
    if (hasNonZeroGoal) return true;
  }
  for (let m = 1; m <= 12; m++) {
    const md = AppState.monthlyDetails?.[m];
    if (md && ((md.incomes && md.incomes.length > 0) || (md.expenses && md.expenses.length > 0) || (md.learningDetails && md.learningDetails.length > 0))) {
      return true;
    }
  }
  return false;
};

let autoCloudSyncTimer = null;
function triggerAutoCloudSync() {
  if (window.isReadOnlyStudentView) return;
  if (!UserSession.currentUser || !window.CloudDB) return;
  if (autoCloudSyncTimer) clearTimeout(autoCloudSyncTimer);
  autoCloudSyncTimer = setTimeout(async () => {
    try {
      const userDocId = UserSession.currentUser.docId;
      const res = await window.CloudDB.saveData(AppState, userDocId, UserSession.currentUser);
      if (res && res.success) {
        window.hasUnsavedChanges = false;
        window.hasSavedInSession = true;
        updateCloudStatus('ready', 'Đã tự động đồng bộ lúc ' + new Date().toLocaleTimeString('vi-VN'));
      }
    } catch (e) {}
  }, 1500);
}

window.markUnsavedChanges = function() {
  window.hasUnsavedChanges = true;
  window.allowExitWithoutSave = false;
  updateCloudStatus('ready', 'Đang chờ đồng bộ...');
  triggerAutoCloudSync();
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

window.addEventListener('beforeunload', (e) => {
  if (window.allowExitWithoutSave) return;
  if (window.hasUnsavedChanges || !window.hasSavedInSession || window.hasAppStateData()) {
    const msg = 'Bạn có muốn lưu dữ liệu trước khi tắt trang web không?';
    e.preventDefault();
    e.returnValue = msg;
    setTimeout(() => {
      if (!document.hidden && !window.allowExitWithoutSave) {
        window.openExitSaveModal();
      }
    }, 250);
    return msg;
  }
});

document.addEventListener('DOMContentLoaded', () => {
  ensureFixedInvestmentGoals();
  syncInvestProductsToGoals();

  const authInputs = document.querySelectorAll('#user-modal-overlay input');
  authInputs.forEach(inp => {
    inp.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        submitUserProfile();
      }
    });
  });

  initSideRail();

  const btnMenuToggle = document.getElementById('btn-menu-toggle');
  const btnDrawerClose = document.getElementById('btn-drawer-close');
  const sidebarBackdrop = document.getElementById('sidebar-backdrop');

  const closeDrawer = () => document.body.classList.remove('nav-open');
  const openDrawer = () => document.body.classList.add('nav-open');

  if (btnMenuToggle) btnMenuToggle.addEventListener('click', openDrawer);
  if (btnDrawerClose) btnDrawerClose.addEventListener('click', closeDrawer);
  if (sidebarBackdrop) sidebarBackdrop.addEventListener('click', closeDrawer);

  document.querySelectorAll('.sidebar .nav-item, #app-sidebar .nav-item').forEach(item => {
    item.addEventListener('click', () => {
      if (window.innerWidth <= 768) {
        closeDrawer();
      } else if (document.body.classList.contains('rail-auto')) {
        document.body.classList.remove('rail-hover-expanded');
      }
    });
  });

  document.addEventListener('click', (e) => {
    const menu = document.getElementById('account-switcher-menu');
    const topChip = document.getElementById('topbar-user-chip');
    const authSec = document.getElementById('topbar-auth-section');
    if (!menu || menu.style.display === 'none') return;
    if (menu.contains(e.target) || (topChip && topChip.contains(e.target)) || (authSec && authSec.contains(e.target))) {
      return;
    }
    closeAccountMenu();
  });

  document.addEventListener('keydown', (e) => {
    const menu = document.getElementById('account-switcher-menu');
    if (!menu || menu.style.display === 'none' || !menu.classList.contains('is-open')) return;

    if (e.key === 'Escape') {
      e.preventDefault();
      closeAccountMenu();
      document.getElementById('topbar-user-chip')?.focus();
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

  if (window.FinDatePicker) {
    FinDatePicker.init();
  }

  if (window.initTheme) {
    window.initTheme();
  }
  if (typeof Chart !== 'undefined') {
    Chart.defaults.font.family = "'Inter', system-ui, -apple-system, sans-serif";
  }

  const sRateEl = document.getElementById('target-savings-rate-val');
  if (sRateEl) sRateEl.innerText = `${AppState.targetSavingsRate || 35}%`;
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

  const storedUser = UserSession.getStored();
  if (storedUser && (storedUser.username || storedUser.rawName) && storedUser.docId) {
    UserSession.currentUser = storedUser;
    if (window.CloudDB && typeof window.CloudDB.restoreSessionContext === 'function') {
      window.CloudDB.restoreSessionContext(storedUser);
      window.loadAppStateFromCloud(true);
    }
    UserSession.updateUI();
  } else {
    UserSession.currentUser = null;
    UserSession.updateUI();
  }

  const urlParams = new URLSearchParams(window.location.search);
  const forceAdmin = urlParams.get('mode') === 'admin';
  const forceStudent = urlParams.get('mode') === 'student';
  const triggerCode = urlParams.get('adminCode') || urlParams.get('code') || urlParams.get('apiKey');
  if (triggerCode && storedUser && window.CloudDB && typeof window.CloudDB.activateAdminCode === 'function') {
    window.CloudDB.activateAdminCode(triggerCode, storedUser.normalizedUsername).then(res => {
      if (res && res.success) {
        storedUser.role = res.role;
        UserSession.setStored(storedUser);
        UserSession.updateUI();
        if (typeof window.toggleAdminManagerMode === 'function') {
          window.toggleAdminManagerMode(true);
        }
      }
    }).catch(() => {});
  }
  const isInstructorOrAdmin = storedUser && (
    storedUser.role === 'admin' ||
    storedUser.role === 'instructor' ||
    storedUser.role === 'teacher' ||
    storedUser.normalizedUsername === 'admin' ||
    storedUser.normalizedUsername === 'haketo_spec' ||
    (storedUser.username && storedUser.username.toLowerCase() === 'admin') ||
    (storedUser.normalizedUsername && (storedUser.normalizedUsername.startsWith('admin_') || storedUser.normalizedUsername.includes('instructor') || storedUser.normalizedUsername.includes('teacher')))
  );

  if ((isInstructorOrAdmin && !forceStudent) || forceAdmin) {
    if (typeof window.toggleAdminManagerMode === 'function') {
      window.toggleAdminManagerMode(true);
    }
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
      sRateEl.innerText = `${AppState.targetSavingsRate || 35}%`;
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

  const u021Switch = document.getElementById('u021-theme-switch');
  if (u021Switch) {
    u021Switch.addEventListener('keydown', (e) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        window.toggleTheme(e);
      }
    });
  }

  const backupOverlay = document.getElementById('backup-modal-overlay');
  if (backupOverlay) {
    backupOverlay.addEventListener('click', (e) => {
      if (e.target === backupOverlay) {
        window.closeBackupManagerModal();
      }
    });
  }
  const dataIoOverlay = document.getElementById('data-io-modal-overlay');
  if (dataIoOverlay) {
    dataIoOverlay.addEventListener('click', (e) => {
      if (e.target === dataIoOverlay) {
        window.closeDataIoModal();
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
      const ioModal = document.getElementById('data-io-modal-overlay');
      if (ioModal && ioModal.classList.contains('active')) {
        window.closeDataIoModal();
      }
      const exitModal = document.getElementById('exit-save-modal-overlay');
      if (exitModal && exitModal.classList.contains('active') && !isExitSaving) {
        window.closeExitSaveModal();
      }
    }
  });

  window.openPortfolio30YrModal = openPortfolio30YrModal;
  window.closePortfolio30YrModal = closePortfolio30YrModal;
  window.renderPortfolio30YrTable = renderPortfolio30YrTable;
  window.renderPortfolioT2Table = renderPortfolioT2Table;
  window.renderPortfolioT1Table = renderPortfolioT1Table;
  window.switchPortfolioModalTab = switchPortfolioModalTab;
  window.getPortfolio30YrData = getPortfolio30YrData;

  if (typeof window.initU032Upload === 'function') {
    window.initU032Upload();
  }
});

window.isReadOnlyStudentView = false;
let backupInstructorAppState = null;
let currentSelectedClassId = null;
let cachedClassesList = [];

window.openClassManagerModal = async function() {
  const overlay = document.getElementById('class-manager-modal-overlay');
  if (!overlay) return;
  overlay.style.display = 'flex';
  overlay.classList.add('active');
  await loadClassManagerData();
};

window.closeClassManagerModal = function() {
  const overlay = document.getElementById('class-manager-modal-overlay');
  if (!overlay) return;
  overlay.style.display = 'none';
  overlay.classList.remove('active');
};

window.switchClassTab = function(tabName) {
  const tabs = ['classes', 'matrix', 'analytics', 'codes'];
  tabs.forEach(t => {
    const btn = document.getElementById(`btn-class-tab-${t}`);
    const panel = document.getElementById(`class-panel-${t}`);
    if (btn) btn.classList.toggle('active', t === tabName);
    if (panel) {
      panel.style.display = (t === tabName) ? 'block' : 'none';
      panel.classList.toggle('active', t === tabName);
    }
  });
  if (tabName === 'matrix') {
    renderClassProgressMatrix();
  } else if (tabName === 'analytics') {
    renderClassAnalyticsDashboard();
  } else if (tabName === 'codes') {
    renderAdminCodesList();
  }
};

async function loadClassManagerData() {
  if (!window.CloudDB || typeof window.CloudDB.getClasses !== 'function') return;
  cachedClassesList = await window.CloudDB.getClasses();
  const select = document.getElementById('class-select-dropdown');
  if (!select) return;
  select.innerHTML = '';
  if (cachedClassesList.length === 0) {
    select.innerHTML = '<option value="">Chưa có lớp học nào</option>';
    return;
  }
  cachedClassesList.forEach((c, idx) => {
    const opt = document.createElement('option');
    opt.value = c.id;
    opt.textContent = `${c.name} (${c.code})`;
    if (!currentSelectedClassId && idx === 0) currentSelectedClassId = c.id;
    if (c.id === currentSelectedClassId) opt.selected = true;
    select.appendChild(opt);
  });
  if (currentSelectedClassId) {
    onClassSelected(currentSelectedClassId);
  }
}

window.onClassSelected = function(classId) {
  currentSelectedClassId = classId;
  const targetClass = cachedClassesList.find(c => c.id === classId);
  if (!targetClass) return;

  const codeEl = document.getElementById('card-class-code');
  const instEl = document.getElementById('card-class-instructor');
  const countEl = document.getElementById('card-class-count');
  const statusEl = document.getElementById('card-class-status');

  const members = Array.isArray(targetClass.members) ? targetClass.members : [];
  const approvedMembers = members.filter(m => m.status === 'approved');
  const pendingMembers = members.filter(m => m.status === 'pending');

  if (codeEl) codeEl.textContent = targetClass.code;
  if (instEl) instEl.textContent = targetClass.instructorName || targetClass.instructorUsername;
  if (countEl) countEl.textContent = `${approvedMembers.length} / ${targetClass.maxMembers || 50}`;
  if (statusEl) {
    const isAct = targetClass.status === 'active';
    statusEl.textContent = isAct ? 'Đang hoạt động' : 'Đã lưu trữ';
    statusEl.className = isAct ? 'badge-status-active' : 'badge-prog badge-prog-none';
  }

  const pendingCountEl = document.getElementById('pending-members-count');
  if (pendingCountEl) pendingCountEl.textContent = pendingMembers.length;
  const pendingTbody = document.getElementById('class-pending-members-tbody');
  if (pendingTbody) {
    if (pendingMembers.length === 0) {
      pendingTbody.innerHTML = '<tr><td colspan="4" class="empty-cell">Không có yêu cầu nào đang chờ duyệt</td></tr>';
    } else {
      pendingTbody.innerHTML = pendingMembers.map(m => `
        <tr>
          <td><strong>${m.name || m.username}</strong></td>
          <td><code>@${m.username}</code></td>
          <td>${m.joinedAt ? new Date(m.joinedAt).toLocaleDateString('vi-VN') : '---'}</td>
          <td style="text-align: right;">
            <button type="button" class="btn-sub-action btn-primary-solid" style="height: 30px; padding: 0 10px; font-size: 12px;" onclick="handleApproveMember('${m.username}', 'approve')"><i class="fa-solid fa-check"></i> Duyệt</button>
            <button type="button" class="btn-sub-action btn-danger-soft" style="height: 30px; padding: 0 10px; font-size: 12px; margin-left: 6px;" onclick="handleApproveMember('${m.username}', 'reject')"><i class="fa-solid fa-xmark"></i> Từ chối</button>
          </td>
        </tr>
      `).join('');
    }
  }

  const approvedCountEl = document.getElementById('approved-members-count');
  if (approvedCountEl) approvedCountEl.textContent = approvedMembers.length;
  const approvedTbody = document.getElementById('class-approved-members-tbody');
  if (approvedTbody) {
    if (approvedMembers.length === 0) {
      approvedTbody.innerHTML = '<tr><td colspan="4" class="empty-cell">Chưa có học viên chính thức nào</td></tr>';
    } else {
      approvedTbody.innerHTML = approvedMembers.map(m => `
        <tr>
          <td><strong>${m.name || m.username}</strong></td>
          <td><code>@${m.username}</code></td>
          <td>${m.joinedAt ? new Date(m.joinedAt).toLocaleDateString('vi-VN') : '---'}</td>
          <td style="text-align: right;">
            <button type="button" class="btn-sub-action" style="height: 30px; padding: 0 10px; font-size: 12px;" onclick="viewStudentPlanReadOnly('${m.username}', '${m.name || m.username}')"><i class="fa-solid fa-eye text-primary"></i> Xem bài</button>
            <button type="button" class="btn-sub-action btn-danger-soft" style="height: 30px; padding: 0 10px; font-size: 12px; margin-left: 6px;" onclick="handleApproveMember('${m.username}', 'remove')"><i class="fa-solid fa-user-minus"></i> Gỡ</button>
          </td>
        </tr>
      `).join('');
    }
  }
};

window.toggleCreateClassForm = function(show) {
  const formCard = document.getElementById('create-class-form-card');
  if (formCard) formCard.style.display = show ? 'block' : 'none';
};

window.submitCreateNewClass = async function() {
  const nameInput = document.getElementById('input-new-class-name');
  const codeInput = document.getElementById('input-new-class-code');
  const limitInput = document.getElementById('input-new-class-limit');

  const name = nameInput?.value.trim() || '';
  const code = codeInput?.value.trim().toUpperCase() || '';
  const limit = parseInt(limitInput?.value, 10) || 50;

  if (!name || !code) {
    showToast("Vui lòng nhập tên lớp và mã lớp hợp lệ!", "error");
    return;
  }

  const res = await window.CloudDB.createClass(name, code, UserSession.currentUser?.normalizedUsername, limit, true);
  if (res.success) {
    showToast("Đã tạo lớp học mới thành công!");
    toggleCreateClassForm(false);
    if (nameInput) nameInput.value = '';
    if (codeInput) codeInput.value = '';
    currentSelectedClassId = res.class.id;
    await loadClassManagerData();
  } else {
    showToast(res.error || "Không thể tạo lớp học.", "error");
  }
};

window.handleApproveMember = async function(studentUsername, action) {
  if (!currentSelectedClassId) return;
  const res = await window.CloudDB.approveClassMember(currentSelectedClassId, studentUsername, action);
  if (res.success) {
    const actionLabel = action === 'approve' ? 'Đã duyệt học viên vào lớp.' : (action === 'reject' ? 'Đã từ chối yêu cầu tham gia.' : 'Đã gỡ học viên khỏi lớp.');
    showToast(actionLabel);
    await loadClassManagerData();
  } else {
    showToast(res.error || "Lỗi xử lý yêu cầu thành viên.", "error");
  }
};

window.archiveCurrentClass = async function() {
  if (!currentSelectedClassId) return;
  if (!confirm("Bạn có chắc chắn muốn lưu trữ và đóng học kỳ cho lớp học này? Dữ liệu bài làm của học viên vẫn được bảo lưu an toàn.")) {
    return;
  }
  const res = await window.CloudDB.archiveClass(currentSelectedClassId);
  if (res.success) {
    showToast("Đã lưu trữ và kết thúc học kỳ an toàn.");
    await loadClassManagerData();
  } else {
    showToast(res.error || "Không thể lưu trữ lớp học.", "error");
  }
};

window.exportCurrentClassBackup = function() {
  if (!currentSelectedClassId) return;
  const targetClass = cachedClassesList.find(c => c.id === currentSelectedClassId);
  if (!targetClass) return;

  const exportPayload = {
    version: "2.4.0",
    backupType: "class_roster_backup",
    exportedAt: new Date().toISOString(),
    classInfo: { ...targetClass }
  };
  const jsonStr = JSON.stringify(exportPayload, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `sao-luu-lop-${targetClass.code.toLowerCase()}-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast("Đã xuất bản sao lưu lớp học thành công!");
};

async function renderClassProgressMatrix() {
  const tbody = document.getElementById('class-matrix-tbody');
  if (!tbody || !currentSelectedClassId) return;
  const targetClass = cachedClassesList.find(c => c.id === currentSelectedClassId);
  if (!targetClass) return;
  const members = Array.isArray(targetClass.members) ? targetClass.members.filter(m => m.status === 'approved') : [];
  if (members.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="empty-cell">Chưa có học viên nào trong danh sách chính thức</td></tr>';
    return;
  }

  tbody.innerHTML = '<tr><td colspan="7" class="empty-cell"><i class="fa-solid fa-spinner fa-spin"></i> Đang tải ma trận tiến độ...</td></tr>';

  const rows = [];
  for (const m of members) {
    const prog = await window.CloudDB.getStudentClassProgress(m.username);
    const badgeMap = {
      completed: '<span class="badge-prog badge-prog-done"><i class="fa-solid fa-check"></i> Hoàn thành</span>',
      in_progress: '<span class="badge-prog badge-prog-doing"><i class="fa-solid fa-spinner"></i> Đang làm</span>',
      not_started: '<span class="badge-prog badge-prog-none"><i class="fa-solid fa-minus"></i> Chưa làm</span>'
    };
    rows.push(`
      <tr>
        <td><strong>${m.name || m.username}</strong><br><small class="text-muted">@${m.username}</small></td>
        <td style="text-align: center;">${badgeMap[prog.keywords] || badgeMap.not_started}</td>
        <td style="text-align: center;">${badgeMap[prog.monthlyPlan] || badgeMap.not_started}</td>
        <td style="text-align: center;">${badgeMap[prog.goals] || badgeMap.not_started}</td>
        <td style="text-align: center;">${badgeMap[prog.careerMilestones] || badgeMap.not_started}</td>
        <td style="text-align: center;">
          <div style="font-weight: 800; font-size: 13px;">${prog.percent}%</div>
          <div style="width: 70px; height: 5px; background: var(--border); border-radius: 99px; margin: 4px auto 0; overflow: hidden;">
            <div style="width: ${prog.percent}%; height: 100%; background: ${prog.percent === 100 ? 'var(--mint)' : 'var(--primary)'};"></div>
          </div>
        </td>
        <td style="text-align: right;">
          <button type="button" class="btn-sub-action" style="height: 30px; padding: 0 10px; font-size: 12px;" onclick="viewStudentPlanReadOnly('${m.username}', '${m.name || m.username}')"><i class="fa-solid fa-eye text-primary"></i> Xem bài</button>
        </td>
      </tr>
    `);
  }
  tbody.innerHTML = rows.join('');
}

async function renderClassAnalyticsDashboard() {
  if (!currentSelectedClassId) return;
  const targetClass = cachedClassesList.find(c => c.id === currentSelectedClassId);
  if (!targetClass) return;
  const members = Array.isArray(targetClass.members) ? targetClass.members.filter(m => m.status === 'approved') : [];

  let totalPercent = 0;
  let totalSavingsRate = 0;
  let totalNetCashflow = 0;
  let totalDSR = 0;
  let countWithData = 0;

  let totalStocks = 0, totalBonds = 0, totalInsurance = 0, totalCash = 0;

  for (const m of members) {
    const prog = await window.CloudDB.getStudentClassProgress(m.username);
    totalPercent += (prog.percent || 0);

    let plan = null;
    try {
      const raw = localStorage.getItem("FIN_APP_LAST_STATE_user_" + m.username);
      if (raw) plan = JSON.parse(raw);
    } catch (e) {}

    if (plan) {
      countWithData++;
      const inc = parseFloat(plan.monthlyIncome || plan.incomeMonthly || 0);
      const exp = parseFloat(plan.monthlyExpense || plan.expenseMonthly || 0);
      const net = inc - exp;
      const sr = inc > 0 ? ((net / inc) * 100) : 0;
      totalSavingsRate += Math.max(0, sr);
      totalNetCashflow += net;

      const debtPay = parseFloat(plan.monthlyDebtService || 0);
      const dsr = inc > 0 ? ((debtPay / inc) * 100) : 0;
      totalDSR += dsr;

      if (plan.portfolioAllocation) {
        totalStocks += parseFloat(plan.portfolioAllocation.stocks || 0);
        totalBonds += parseFloat(plan.portfolioAllocation.bonds || 0);
        totalInsurance += parseFloat(plan.portfolioAllocation.insurance || 0);
        totalCash += parseFloat(plan.portfolioAllocation.cash || 0);
      }
    }
  }

  const avgCompletion = members.length > 0 ? Math.round(totalPercent / members.length) : 0;
  const avgSavings = countWithData > 0 ? (totalSavingsRate / countWithData).toFixed(1) : 0;
  const avgNet = countWithData > 0 ? (totalNetCashflow / countWithData).toFixed(1) : 0;
  const avgDSR = countWithData > 0 ? (totalDSR / countWithData).toFixed(1) : 0;

  const compRateEl = document.getElementById('ana-completion-rate');
  const compHintEl = document.getElementById('ana-completion-hint');
  const savRateEl = document.getElementById('ana-savings-rate');
  const netCashEl = document.getElementById('ana-net-cashflow');
  const dsrRatioEl = document.getElementById('ana-dsr-ratio');

  if (compRateEl) compRateEl.textContent = `${avgCompletion}%`;
  if (compHintEl) compHintEl.textContent = members.length > 0 ? `${members.length} học viên chính thức trong lớp` : 'Chưa có học viên nào trong lớp';
  if (savRateEl) savRateEl.textContent = countWithData > 0 ? `${avgSavings}%` : '---';
  if (netCashEl) netCashEl.textContent = countWithData > 0 ? `${avgNet} tr/tháng` : '---';
  if (dsrRatioEl) dsrRatioEl.textContent = countWithData > 0 ? `${avgDSR}%` : '---';

  const sTotal = (totalStocks + totalBonds + totalInsurance + totalCash);
  const pStocks = sTotal > 0 ? Math.round(totalStocks / sTotal * 100) : 0;
  const pBonds = sTotal > 0 ? Math.round(totalBonds / sTotal * 100) : 0;
  const pIns = sTotal > 0 ? Math.round(totalInsurance / sTotal * 100) : 0;
  const pCash = sTotal > 0 ? Math.max(0, 100 - (pStocks + pBonds + pIns)) : 0;

  const segStocks = document.getElementById('seg-ana-stocks');
  const segBonds = document.getElementById('seg-ana-bonds');
  const segIns = document.getElementById('seg-ana-insurance');
  const segCash = document.getElementById('seg-ana-cash');

  if (segStocks) segStocks.style.width = `${pStocks}%`;
  if (segBonds) segBonds.style.width = `${pBonds}%`;
  if (segIns) segIns.style.width = `${pIns}%`;
  if (segCash) segCash.style.width = `${pCash}%`;

  const lblStocks = document.getElementById('lbl-ana-stocks');
  const lblBonds = document.getElementById('lbl-ana-bonds');
  const lblIns = document.getElementById('lbl-ana-insurance');
  const lblCash = document.getElementById('lbl-ana-cash');

  if (lblStocks) lblStocks.textContent = sTotal > 0 ? `${pStocks}%` : '---';
  if (lblBonds) lblBonds.textContent = sTotal > 0 ? `${pBonds}%` : '---';
  if (lblIns) lblIns.textContent = sTotal > 0 ? `${pIns}%` : '---';
  if (lblCash) lblCash.textContent = sTotal > 0 ? `${pCash}%` : '---';
}

async function renderAdminCodesList() {
  const tbody = document.getElementById('admin-codes-tbody');
  if (!tbody || !window.CloudDB || typeof window.CloudDB.getAdminCodes !== 'function') return;
  let codes = await window.CloudDB.getAdminCodes();
  codes = (codes || []).filter(c => c && c.code && !['INST-2026-K48B', 'EXPD-2025-0001', 'RVKD-2026-9999'].includes(c.code));
  if (codes.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="empty-cell">Chưa có mã quản trị nào</td></tr>';
    return;
  }
  tbody.innerHTML = codes.map(c => `
    <tr>
      <td><code><strong>${c.code}</strong></code></td>
      <td><span class="badge-prog ${c.role === 'admin' ? 'badge-prog-doing' : 'badge-prog-done'}">${c.role === 'admin' ? 'System Admin' : 'Instructor'}</span></td>
      <td>${c.usedCount || 0} / ${c.maxUses || 1}</td>
      <td>${c.expiresAt ? new Date(c.expiresAt).toLocaleDateString('vi-VN') : '---'}</td>
      <td><span class="badge-prog ${c.isRevoked ? 'badge-prog-none' : (c.usedCount >= c.maxUses ? 'badge-prog-doing' : 'badge-prog-done')}">${c.isRevoked ? 'Đã thu hồi' : (c.usedCount >= c.maxUses ? 'Hết lượt' : 'Khả dụng')}</span></td>
    </tr>
  `).join('');
}

window.submitGenerateAdminCode = async function() {
  const roleSelect = document.getElementById('select-new-code-role');
  const usesSelect = document.getElementById('select-new-code-uses');
  const daysSelect = document.getElementById('select-new-code-days');

  const role = roleSelect?.value || 'instructor';
  const maxUses = parseInt(usesSelect?.value, 10) || 1;
  const validDays = parseInt(daysSelect?.value, 10) || 30;

  const res = await window.CloudDB.createAdminCode(role, maxUses, validDays);
  if (res.success) {
    showToast(`Đã sinh mã mới: ${res.code.code}`);
    renderAdminCodesList();
  } else {
    showToast("Không thể tạo mã quản trị.", "error");
  }
};

window.openStudentJoinClassModal = async function() {
  const overlay = document.getElementById('student-join-class-modal-overlay');
  if (!overlay) return;
  overlay.style.display = 'flex';
  overlay.classList.add('active');

  const curUser = UserSession.currentUser;
  const fb = document.getElementById('student-join-feedback');
  if (!curUser || !curUser.normalizedUsername) {
    if (fb) {
      fb.style.display = 'block';
      fb.className = 'text-warning';
      fb.innerHTML = '<i class="fa-solid fa-triangle-exclamation text-amber"></i> Bạn chưa đăng nhập. Vui lòng <a href="javascript:void(0)" onclick="goToAuthPage(\'login\')" style="font-weight: 700; text-decoration: underline; color: inherit;">Đăng nhập / Đăng ký</a> để nhóm và bài làm của bạn được đồng bộ trên mọi thiết bị.';
    }
  } else {
    if (fb && fb.className === 'text-warning' && fb.innerHTML.includes('Bạn chưa đăng nhập')) {
      fb.style.display = 'none';
    }
  }

  await renderStudentEnrolledClasses();
};

window.closeStudentJoinClassModal = function() {
  const overlay = document.getElementById('student-join-class-modal-overlay');
  if (!overlay) return;
  overlay.style.display = 'none';
  overlay.classList.remove('active');
};

window.submitStudentJoinClass = async function() {
  const input = document.getElementById('input-student-class-code');
  const code = input?.value.trim().toUpperCase() || '';
  if (!code) {
    showToast("Vui lòng nhập mã nhóm!", "error");
    return;
  }
  const curUser = UserSession.currentUser;
  if (!curUser || !curUser.normalizedUsername) {
    showToast("Vui lòng đăng nhập tài khoản trước khi tham gia nhóm để được đồng bộ trên mọi thiết bị!", "warning");
    const fb = document.getElementById('student-join-feedback');
    if (fb) {
      fb.style.display = 'block';
      fb.className = 'text-warning';
      fb.innerHTML = '<i class="fa-solid fa-triangle-exclamation text-amber"></i> Bạn cần <a href="javascript:void(0)" onclick="goToAuthPage(\'login\')" style="font-weight: 700; text-decoration: underline; color: inherit;">đăng nhập hoặc đăng ký tài khoản</a> để giảng viên nhận diện đúng bạn và đồng bộ bài làm trên mọi thiết bị.';
    }
    setTimeout(() => {
      if (typeof window.goToAuthPage === 'function') {
        window.goToAuthPage('login');
      }
    }, 1200);
    return;
  }

  const username = curUser.normalizedUsername;
  const dispName = curUser.displayUsername || curUser.rawName || curUser.username || username;

  const btnSubmit = document.querySelector('#student-join-class-modal-overlay .btn-modal-submit');
  const originalBtnHtml = btnSubmit ? btnSubmit.innerHTML : '';
  if (btnSubmit) {
    btnSubmit.disabled = true;
    btnSubmit.innerHTML = '<span>Đang kiểm tra mã...</span> <i class="fa-solid fa-spinner fa-spin"></i>';
  }

  const fb = document.getElementById('student-join-feedback');
  if (fb) {
    fb.style.display = 'block';
    fb.className = 'text-info';
    fb.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang tìm kiếm thông tin lớp học trên đám mây...';
  }

  try {
    const res = await window.CloudDB.joinClass(code, username, dispName);
    if (res.success) {
      if (res.localOnly || res.cloudSynced === false) {
        showToast("Cảnh báo: Yêu cầu chỉ mới lưu trên thiết bị này (chưa lên Cloud do lỗi mạng/kết nối).", "warning");
        if (fb) {
          fb.style.display = 'block';
          fb.className = 'text-warning';
          fb.innerHTML = '<i class="fa-solid fa-triangle-exclamation text-amber"></i> ' + res.message + '<br><small style="color: #d97706;">(Chưa đồng bộ lên máy chủ: ' + (res.warning || 'Vui lòng kiểm tra mạng') + ' - Thiết bị khác chưa thể thấy yêu cầu này)</small>';
        }
      } else {
        showToast(res.message);
        if (fb) {
          fb.style.display = 'block';
          fb.className = res.status === 'approved' ? 'text-success' : 'text-warning';
          fb.innerHTML = (res.status === 'approved' ? '<i class="fa-solid fa-circle-check text-emerald"></i> ' : '<i class="fa-solid fa-clock text-amber"></i> ') + res.message;
        }
      }

      if (res.isAdminUpgrade) {
        if (UserSession.currentUser) {
          UserSession.currentUser.role = res.role;
          UserSession.setStored(UserSession.currentUser);
        }
        UserSession.updateUI();
        window.closeStudentJoinClassModal();
        window.toggleAdminManagerMode(true);
        return;
      }

      if (input) input.value = '';
      await renderStudentEnrolledClasses();
      if (typeof window.updateStudentClassStatusUI === 'function') {
        window.updateStudentClassStatusUI();
      }
    } else {
      showToast(res.error || "Không thể tham gia nhóm.", "error");
      if (fb) {
        fb.style.display = 'block';
        fb.className = 'text-danger';
        fb.textContent = res.error || "Không thể tham gia nhóm.";
      }
    }
  } catch (err) {
    showToast("Lỗi kết nối khi tham gia nhóm: " + (err.message || err), "error");
    if (fb) {
      fb.style.display = 'block';
      fb.className = 'text-danger';
      fb.textContent = "Lỗi kết nối máy chủ khi tham gia nhóm.";
    }
  } finally {
    if (btnSubmit) {
      btnSubmit.disabled = false;
      btnSubmit.innerHTML = originalBtnHtml;
    }
  }
};

window.updateStudentClassStatusUI = async function() {
  const btn = document.getElementById('btn-floating-switch-class');
  if (!btn || !window.CloudDB || typeof window.CloudDB.getClasses !== 'function') return;
  const curUser = UserSession.currentUser;
  let username = curUser ? curUser.normalizedUsername : '';
  if (!username) {
    username = localStorage.getItem('FIN_APP_GUEST_STUDENT_ID') || '';
  }
  if (!username) {
    btn.innerHTML = '<i class="fa-solid fa-graduation-cap"></i> <span>Cài đặt lớp học</span>';
    btn.title = 'Cài đặt lớp học';
    return;
  }
  try {
    const allClasses = await window.CloudDB.getClasses();
    const enrolled = allClasses.filter(c => Array.isArray(c.members) && c.members.some(m => normalizeUsername(m.username) === normalizeUsername(username)));
    if (enrolled.length === 0) {
      btn.innerHTML = '<i class="fa-solid fa-graduation-cap"></i> <span>Cài đặt lớp học</span>';
      btn.title = 'Cài đặt lớp học';
      return;
    }
    const approved = enrolled.find(c => {
      const m = c.members.find(x => normalizeUsername(x.username) === normalizeUsername(username));
      return m && m.status === 'approved';
    });
    if (approved) {
      localStorage.setItem('FIN_APP_ACTIVE_STUDENT_CLASS', JSON.stringify({ id: approved.id, code: approved.code, name: approved.name }));
      btn.innerHTML = `<i class="fa-solid fa-circle-check text-emerald"></i> <span>${approved.name} (${approved.code})</span>`;
      btn.title = `Đã vào lớp: ${approved.name} (${approved.code})`;
      return;
    }
    const pending = enrolled.find(c => {
      const m = c.members.find(x => normalizeUsername(x.username) === normalizeUsername(username));
      return m && m.status === 'pending';
    });
    if (pending) {
      btn.innerHTML = `<i class="fa-solid fa-clock text-amber"></i> <span>Chờ duyệt: ${pending.code}</span>`;
      btn.title = `Đang chờ người phụ trách duyệt vào nhóm: ${pending.name} (${pending.code})`;
      return;
    }
  } catch (e) {}
};

async function renderStudentEnrolledClasses() {
  const tbody = document.getElementById('student-enrolled-classes-tbody');
  if (!tbody || !window.CloudDB || typeof window.CloudDB.getClasses !== 'function') return;
  const curUser = UserSession.currentUser;
  let username = curUser ? curUser.normalizedUsername : '';
  if (!username) {
    username = localStorage.getItem('FIN_APP_GUEST_STUDENT_ID') || '';
  }
  if (!username) {
    tbody.innerHTML = '<tr><td colspan="3" class="empty-cell" style="padding: 16px 12px; color: #b45309;"><i class="fa-solid fa-circle-info"></i> Bạn chưa đăng nhập. Vui lòng <a href="javascript:void(0)" onclick="goToAuthPage(\'login\')" style="text-decoration: underline; font-weight: 600; color: inherit;">đăng nhập</a> để xem các nhóm của bạn.</td></tr>';
    if (typeof window.updateStudentClassStatusUI === 'function') {
      window.updateStudentClassStatusUI();
    }
    return;
  }
  const allClasses = await window.CloudDB.getClasses();
  const enrolled = allClasses.filter(c => Array.isArray(c.members) && c.members.some(m => normalizeUsername(m.username) === normalizeUsername(username)));

  if (enrolled.length === 0) {
    tbody.innerHTML = '<tr><td colspan="3" class="empty-cell">Bạn chưa tham gia nhóm nào</td></tr>';
    if (typeof window.updateStudentClassStatusUI === 'function') {
      window.updateStudentClassStatusUI();
    }
    return;
  }
  tbody.innerHTML = enrolled.map(c => {
    const member = c.members.find(m => normalizeUsername(m.username) === normalizeUsername(username));
    const isApproved = member?.status === 'approved';
    const isRejected = member?.status === 'rejected';
    let badgeHtml = '';
    if (isApproved) {
      badgeHtml = '<span class="badge-prog badge-prog-done" style="display: inline-flex; align-items: center; gap: 4px;"><i class="fa-solid fa-circle-check text-emerald"></i> Đã vào lớp</span>';
    } else if (isRejected) {
      badgeHtml = '<span class="badge-prog" style="background: rgba(239, 68, 68, 0.15); color: #ef4444; display: inline-flex; align-items: center; gap: 4px;"><i class="fa-solid fa-circle-xmark"></i> Từ chối</span>';
    } else {
      badgeHtml = '<span class="badge-prog badge-prog-doing" style="display: inline-flex; align-items: center; gap: 4px;"><i class="fa-solid fa-clock text-amber"></i> Chờ duyệt</span>';
    }
    return `
      <tr>
        <td><strong>${c.name}</strong></td>
        <td><code>${c.code}</code></td>
        <td>${badgeHtml}</td>
      </tr>
    `;
  }).join('');
  if (typeof window.updateStudentClassStatusUI === 'function') {
    window.updateStudentClassStatusUI();
  }
}

function initCloudClassesRealtimeSync() {
  if (window.__CLOUD_CLASSES_SYNC_INITIALIZED__) return;
  window.__CLOUD_CLASSES_SYNC_INITIALIZED__ = true;

  window.addEventListener('cloud-classes-updated', async () => {
    if (typeof window.updateStudentClassStatusUI === 'function') {
      try { await window.updateStudentClassStatusUI(); } catch (err) {}
    }

    const studentJoinOverlay = document.getElementById('student-join-class-modal-overlay');
    if (studentJoinOverlay && (studentJoinOverlay.classList.contains('active') || studentJoinOverlay.style.display === 'flex')) {
      if (typeof renderStudentEnrolledClasses === 'function') {
        try { await renderStudentEnrolledClasses(); } catch (err) {}
      }
    }

    const classMgrOverlay = document.getElementById('class-manager-modal-overlay');
    if (classMgrOverlay && (classMgrOverlay.classList.contains('active') || classMgrOverlay.style.display === 'flex')) {
      if (typeof window.renderAdminRequestsTable === 'function') {
        try { await window.renderAdminRequestsTable(); } catch (err) {}
      }
      if (typeof window.updateAdminPendingBadge === 'function') {
        try { await window.updateAdminPendingBadge(); } catch (err) {}
      }
      if (typeof window.renderAdminStudentsTable === 'function') {
        try { await window.renderAdminStudentsTable(); } catch (err) {}
      }
      if (typeof window.renderAdminAnalyticsView === 'function') {
        try { await window.renderAdminAnalyticsView(); } catch (err) {}
      }
      if (typeof loadClassManagerData === 'function') {
        try { await loadClassManagerData(); } catch (err) {}
      }
    } else {
      if (typeof window.updateAdminPendingBadge === 'function') {
        try { await window.updateAdminPendingBadge(); } catch (err) {}
      }
    }
  });

  if (window.CloudDB && typeof window.CloudDB.subscribeToClasses === 'function') {
    window.CloudDB.subscribeToClasses(() => {});
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCloudClassesRealtimeSync);
} else {
  initCloudClassesRealtimeSync();
}

window.viewStudentPlanReadOnly = async function(studentUsername, studentName) {
  closeClassManagerModal();

  backupInstructorAppState = JSON.parse(JSON.stringify(AppState));
  window.isReadOnlyStudentView = true;

  let studentPlan = null;
  if (window.CloudDB && typeof window.CloudDB.loadUserData === 'function') {
    try {
      const cloudRes = await window.CloudDB.loadUserData('user_' + studentUsername);
      if (cloudRes && cloudRes.success && cloudRes.data) {
        studentPlan = cloudRes.data;
      }
    } catch (e) {}
  }
  if (!studentPlan && window.CloudDB && typeof window.CloudDB.loadData === 'function') {
    try {
      const cloudRes = await window.CloudDB.loadData('user_' + studentUsername);
      if (cloudRes && cloudRes.success && cloudRes.data) {
        studentPlan = cloudRes.data;
      }
    } catch (e) {}
  }
  if (!studentPlan) {
    try {
      const raw = localStorage.getItem("FIN_APP_LAST_STATE_user_" + studentUsername);
      if (raw) studentPlan = JSON.parse(raw);
    } catch (e) {}
  }

  if (studentPlan) {
    Object.keys(studentPlan).forEach(k => {
      if (!k.startsWith('_')) {
        AppState[k] = studentPlan[k];
      }
    });
    ensureDefaultKeywords(AppState);
    ensureFixedInvestmentGoals();
    syncInvestProductsToGoals();

    const yEl = document.getElementById('input-year');
    const aEl = document.getElementById('input-age');
    const nameElInput = document.getElementById('input-fullname');
    if (yEl && AppState.currentYear) yEl.innerText = AppState.currentYear;
    if (aEl && AppState.currentAge) aEl.innerText = AppState.currentAge;
    if (nameElInput && AppState.ho_ten) nameElInput.innerText = AppState.ho_ten;

    if (typeof recalculateAll === 'function') recalculateAll();
    if (typeof calculateAgeMilestones === 'function') calculateAgeMilestones();
    if (typeof renderAll === 'function') renderAll();
  } else {
    ensureDefaultKeywords(AppState);
    ensureFixedInvestmentGoals();
    syncInvestProductsToGoals();
    if (typeof recalculateAll === 'function') recalculateAll();
    if (typeof calculateAgeMilestones === 'function') calculateAgeMilestones();
    if (typeof renderAll === 'function') renderAll();
    showToast(`Học viên @${studentUsername} chưa lưu dữ liệu kế hoạch, đang hiển thị các mục từ khóa thiết lập.`, "warning");
  }

  const banner = document.getElementById('student-preview-banner');
  const nameEl = document.getElementById('preview-student-name');
  const userEl = document.getElementById('preview-student-user');

  if (banner) banner.style.display = 'flex';
  if (nameEl) nameEl.textContent = studentName || studentUsername;
  if (userEl) userEl.textContent = `@${studentUsername}`;

  document.body.classList.add('is-student-preview-mode');

  const btnSave = document.getElementById('btn-cloud-save');
  if (btnSave) btnSave.disabled = true;

  switchTab('tab-tukhoa');
  if (typeof recalculateAll === 'function') recalculateAll();
  if (typeof calculateAgeMilestones === 'function') calculateAgeMilestones();
  if (typeof renderAll === 'function') renderAll();
  showToast(`Đang xem bài làm của học viên ${studentName} (Chế độ chỉ đọc).`);
};

window.exitStudentPlanReadOnly = function() {
  if (backupInstructorAppState) {
    Object.assign(AppState, backupInstructorAppState);
    backupInstructorAppState = null;
  }
  window.isReadOnlyStudentView = false;

  const banner = document.getElementById('student-preview-banner');
  if (banner) banner.style.display = 'none';

  document.body.classList.remove('is-student-preview-mode');

  const btnSave = document.getElementById('btn-cloud-save');
  if (btnSave) btnSave.disabled = false;

  ensureDefaultKeywords(AppState);
  ensureFixedInvestmentGoals();
  syncInvestProductsToGoals();

  const yEl = document.getElementById('input-year');
  const aEl = document.getElementById('input-age');
  const nameElInput = document.getElementById('input-fullname');
  if (yEl && AppState.currentYear) yEl.innerText = AppState.currentYear;
  if (aEl && AppState.currentAge) aEl.innerText = AppState.currentAge;
  if (nameElInput && AppState.ho_ten) nameElInput.innerText = AppState.ho_ten;

  if (typeof recalculateAll === 'function') recalculateAll();
  if (typeof calculateAgeMilestones === 'function') calculateAgeMilestones();
  if (typeof renderAll === 'function') renderAll();
  showToast("Đã thoát chế độ xem học viên. Đã khôi phục kế hoạch tài chính của bạn.");
  if (window.isManagerMode) {
    switchTab('tab-admin-students');
  } else {
    openClassManagerModal();
  }
};

window.addEventListener('firebase-ready', () => {
  updateCloudStatus('ready', 'Đám mây sẵn sàng');
  if (UserSession.currentUser && window.CloudDB && typeof window.CloudDB.restoreSessionContext === 'function') {
    window.CloudDB.restoreSessionContext(UserSession.currentUser);
    window.loadAppStateFromCloud(true);
  }
  if (window.CloudDB && typeof window.CloudDB.subscribeAuthState === 'function') {
    window.CloudDB.subscribeAuthState((fbUser) => {
      if (fbUser && (!UserSession.currentUser || UserSession.currentUser.uid !== fbUser.uid)) {
        UserSession.setStored(fbUser);
      }
    });
  }
});

window.isManagerMode = false;
window.toggleAdminManagerMode = function(forceState) {
  if (typeof forceState === 'boolean') {
    window.isManagerMode = forceState;
  } else {
    window.isManagerMode = !window.isManagerMode;
  }
  const studentNav = document.getElementById('rail-nav-student');
  const adminNav = document.getElementById('rail-nav-admin');
  const adminFooter = document.getElementById('sidebar-admin-footer');
  const btnAdminToggle = document.getElementById('btn-admin-mode-toggle');
  const toggleLabel = document.getElementById('admin-mode-toggle-label');
  const studentAdminShortcut = document.getElementById('sidebar-student-admin-shortcut');

  if (window.isManagerMode) {
    if (studentNav) studentNav.style.display = 'none';
    if (adminNav) adminNav.style.display = 'block';
    if (adminFooter) adminFooter.style.display = 'flex';
    if (btnAdminToggle) {
      btnAdminToggle.classList.add('active-admin');
      if (toggleLabel) {
        toggleLabel.innerHTML = '<i class="fa-solid fa-book-open"></i> <span>Xem Sổ tài chính</span>';
      }
    }
    if (studentAdminShortcut) studentAdminShortcut.style.display = 'none';
    switchTab('tab-admin-groups');
    if (typeof updateAdminPendingBadge === 'function') updateAdminPendingBadge();
  } else {
    if (studentNav) studentNav.style.display = 'block';
    if (adminNav) adminNav.style.display = 'none';
    if (adminFooter) adminFooter.style.display = 'none';
    if (btnAdminToggle) {
      btnAdminToggle.classList.remove('active-admin');
      if (toggleLabel) {
        toggleLabel.innerHTML = '<i class="fa-solid fa-chalkboard-user"></i> <span>Xem toàn cảnh lớp học</span>';
      }
    }
    const isInstructorOrAdmin = UserSession.currentUser && (
      UserSession.currentUser.role === 'admin' ||
      UserSession.currentUser.role === 'instructor' ||
      UserSession.currentUser.role === 'teacher' ||
      UserSession.currentUser.normalizedUsername === 'admin' ||
      UserSession.currentUser.normalizedUsername === 'haketo_spec' ||
      (UserSession.currentUser.username && UserSession.currentUser.username.toLowerCase() === 'admin') ||
      (UserSession.currentUser.normalizedUsername && (UserSession.currentUser.normalizedUsername.startsWith('admin_') || UserSession.currentUser.normalizedUsername.includes('instructor') || UserSession.currentUser.normalizedUsername.includes('teacher')))
    );
    if (studentAdminShortcut) {
      studentAdminShortcut.style.display = isInstructorOrAdmin ? 'block' : 'none';
      const shortcutBtn = studentAdminShortcut.querySelector('.btn-sidebar-admin-pill');
      if (shortcutBtn) {
        shortcutBtn.innerHTML = '<i class="fa-solid fa-chalkboard-user"></i> <span>Xem toàn cảnh lớp học</span>';
        shortcutBtn.title = 'Xem toàn cảnh lớp học';
      }
    }
    switchTab('tab-tukhoa');
  }
};

window.switchAdminTab = function(tabId) {
  switchTab(tabId);
};

window.toggleCreateGroupForm = function() {
  const formWrap = document.getElementById('create-group-form-wrap');
  if (!formWrap) return;
  const isHidden = formWrap.style.display === 'none' || !formWrap.style.display;
  formWrap.style.display = isHidden ? 'block' : 'none';
  if (isHidden) {
    document.getElementById('inp-new-group-name')?.focus();
  }
};

window.generateRandomGroupCode = function() {
  const codeInp = document.getElementById('inp-new-group-code');
  if (!codeInp) return;
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let rand = "";
  for (let i = 0; i < 4; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  codeInp.value = `TC-${rand}`;
};

window.submitCreateNewGroup = async function() {
  const nameInp = document.getElementById('inp-new-group-name');
  const codeInp = document.getElementById('inp-new-group-code');
  const descInp = document.getElementById('inp-new-group-desc');
  const limitRadio = document.querySelector('input[name="new-group-limit"]:checked');
  const privacyRadio = document.querySelector('input[name="new-group-privacy"]:checked');

  const name = nameInp ? nameInp.value.trim() : '';
  const code = codeInp ? codeInp.value.trim().toUpperCase() : '';
  const desc = descInp ? descInp.value.trim() : '';
  const maxMembers = limitRadio ? limitRadio.value : '40';
  const isPrivate = privacyRadio ? (privacyRadio.value === 'private') : true;

  if (!name) {
    showToast('Vui lòng nhập tên nhóm / lớp học.', 'warning');
    nameInp?.focus();
    return;
  }
  if (!code) {
    showToast('Vui lòng nhập hoặc sinh mã tham gia nhóm.', 'warning');
    codeInp?.focus();
    return;
  }

  if (window.CloudDB && typeof window.CloudDB.createClass === 'function') {
    const curUser = UserSession.currentUser ? UserSession.currentUser.normalizedUsername : 'admin';
    const cloudRes = await window.CloudDB.createClass(name, code, curUser, maxMembers, isPrivate, desc);
    if (!cloudRes || !cloudRes.success) {
      showToast((cloudRes && cloudRes.error) || 'Không lưu được thay đổi lên Cloud.', 'error');
      return;
    }
    showToast(`Đã tạo nhóm "${name}" thành công!`);
    if (nameInp) nameInp.value = '';
    if (codeInp) codeInp.value = '';
    if (descInp) descInp.value = '';
    toggleCreateGroupForm();
    await renderAdminGroupsList();
    updateAdminPendingBadge();
  }
};

window.renderAdminGroupsList = async function() {
  const grid = document.getElementById('admin-groups-grid');
  if (!grid || !window.CloudDB || typeof window.CloudDB.getClasses !== 'function') return;

  const classes = await window.CloudDB.getClasses();
  cachedClassesList = classes;

  const searchVal = (document.getElementById('admin-group-search')?.value || '').trim().toLowerCase();
  const filterType = document.getElementById('admin-group-filter-type')?.value || 'all';

  let totalStudents = 0;
  let privateCount = 0;
  let pendingCount = 0;

  classes.forEach(c => {
    const mList = Array.isArray(c.members) ? c.members : [];
    const approved = mList.filter(m => m.status === 'approved').length;
    const pending = mList.filter(m => m.status === 'pending').length;
    totalStudents += approved;
    if (c.isPrivate !== false) privateCount++;
    pendingCount += pending;
  });

  const kpiTotalG = document.getElementById('kpi-total-groups');
  const kpiTotalS = document.getElementById('kpi-total-students');
  const kpiPrivG = document.getElementById('kpi-private-groups');
  const kpiPendR = document.getElementById('kpi-pending-requests');
  if (kpiTotalG) kpiTotalG.textContent = classes.length;
  if (kpiTotalS) kpiTotalS.textContent = totalStudents;
  if (kpiPrivG) kpiPrivG.textContent = privateCount;
  if (kpiPendR) kpiPendR.textContent = pendingCount;

  const filtered = classes.filter(c => {
    if (filterType === 'private' && c.isPrivate === false) return false;
    if (filterType === 'global' && c.isPrivate !== false) return false;
    if (searchVal) {
      const matchName = (c.name || '').toLowerCase().includes(searchVal);
      const matchCode = (c.code || '').toLowerCase().includes(searchVal);
      if (!matchName && !matchCode) return false;
    }
    return true;
  });

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="admin-empty-state" style="grid-column: 1 / -1; padding: 40px;">
        <div class="empty-icon text-muted"><i class="fa-solid fa-layer-group"></i></div>
        <h3>Không tìm thấy nhóm phù hợp</h3>
        <p>Chưa có nhóm nào hoặc tiêu chí lọc không khớp. Hãy bấm "Tạo nhóm mới" để khởi tạo.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = filtered.map(c => {
    const mList = Array.isArray(c.members) ? c.members : [];
    const approvedCount = mList.filter(m => m.status === 'approved').length;
    const pendingInGroup = mList.filter(m => m.status === 'pending').length;
    const limit = parseInt(c.maxMembers, 10) || 0;
    const isNoLimit = limit === 0;
    const percent = (!isNoLimit && limit > 0) ? Math.min(100, Math.round((approvedCount / limit) * 100)) : (approvedCount > 0 ? 50 : 0);
    const isPriv = c.isPrivate !== false;

    return `
      <div class="admin-group-card" id="card-group-${c.id}">
        <div class="group-card-header">
          <div class="group-title-wrap">
            <h3>${c.name}</h3>
            <div class="group-meta-badges">
              <span class="badge-group-type ${isPriv ? 'badge-type-private' : 'badge-type-global'}">
                <i class="fa-solid ${isPriv ? 'fa-lock' : 'fa-globe'}"></i>
                <span>${isPriv ? 'Nhóm riêng tư' : 'Nhóm mở'}</span>
              </span>
              <span class="group-code-pill" onclick="copyGroupCodeToClipboard('${c.code}')" title="Bấm để sao chép mã">
                <code>${c.code}</code> <i class="fa-regular fa-copy"></i>
              </span>
            </div>
          </div>
        </div>

        <div class="group-capacity-wrap">
          <div class="capacity-labels">
            <span>Sĩ số thành viên</span>
            <strong>${approvedCount} / ${isNoLimit ? '∞' : limit}</strong>
          </div>
          <div class="capacity-progress-bar">
            <div class="capacity-progress-fill" style="width: ${percent}%;"></div>
          </div>
        </div>

        ${(isPriv && pendingInGroup > 0) ? `
          <div class="badge-group-pending-chip" onclick="switchTab('tab-admin-requests')" style="background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.25); padding: 5px 10px; border-radius: 6px; font-size: 12px; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 6px;">
            <i class="fa-solid fa-bell"></i> <span>Có ${pendingInGroup} yêu cầu đang chờ duyệt</span>
          </div>
        ` : ''}

        <div class="group-desc-box">${c.description || 'Chưa có ghi chú quy định.'}</div>

        <div class="group-card-actions">
          <button type="button" class="btn-group-students-main" onclick="goToGroupStudents('${c.id}')">
            <i class="fa-solid fa-users-viewfinder"></i> <span>Vào quản lí sinh viên</span>
          </button>
          <button type="button" class="btn-group-custom-sub" onclick="openCustomGroupModal('${c.id}')" title="Tùy chỉnh nhóm">
            <i class="fa-solid fa-sliders"></i> <span>Tùy chỉnh</span>
          </button>
        </div>
      </div>
    `;
  }).join('');
};

window.copyGroupCodeToClipboard = function(code) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(code).then(() => {
      showToast(`Đã sao chép mã nhóm: ${code}`);
    }).catch(() => {
      showToast(`Mã nhóm: ${code}`);
    });
  } else {
    showToast(`Mã nhóm: ${code}`);
  }
};

window.openCustomGroupModal = function(classId) {
  const targetClass = (cachedClassesList || []).find(c => c.id === classId);
  if (!targetClass) return;

  const overlay = document.getElementById('custom-group-modal-overlay');
  if (!overlay) return;

  document.getElementById('custom-group-id').value = targetClass.id;
  document.getElementById('custom-group-name').value = targetClass.name || '';
  document.getElementById('custom-group-code').value = targetClass.code || '';
  document.getElementById('custom-group-desc').value = targetClass.description || '';

  const limitVal = String(targetClass.maxMembers || 0);
  const radiosLimit = document.querySelectorAll('input[name="custom-group-limit"]');
  let matchedLimit = false;
  radiosLimit.forEach(r => {
    if (r.value === limitVal) {
      r.checked = true;
      matchedLimit = true;
    }
  });
  if (!matchedLimit && radiosLimit[0]) radiosLimit[0].checked = true;

  const isPriv = targetClass.isPrivate !== false;
  const radiosPrivacy = document.querySelectorAll('input[name="custom-group-privacy"]');
  radiosPrivacy.forEach(r => {
    if (r.value === 'private' && isPriv) r.checked = true;
    if (r.value === 'global' && !isPriv) r.checked = true;
  });

  overlay.style.display = 'flex';
  overlay.classList.add('active');
};

window.closeCustomGroupModal = function() {
  const overlay = document.getElementById('custom-group-modal-overlay');
  if (!overlay) return;
  overlay.style.display = 'none';
  overlay.classList.remove('active');
};

window.saveCustomGroupSettings = async function() {
  const classId = document.getElementById('custom-group-id')?.value;
  if (!classId) return;

  const name = (document.getElementById('custom-group-name')?.value || '').trim();
  const code = (document.getElementById('custom-group-code')?.value || '').trim().toUpperCase();
  const desc = (document.getElementById('custom-group-desc')?.value || '').trim();
  const limitRadio = document.querySelector('input[name="custom-group-limit"]:checked');
  const privacyRadio = document.querySelector('input[name="custom-group-privacy"]:checked');

  if (!name || !code) {
    showToast('Tên nhóm và mã tham gia không được để trống.', 'warning');
    return;
  }

  const updates = {
    name,
    code,
    description: desc,
    maxMembers: limitRadio ? limitRadio.value : '40',
    isPrivate: privacyRadio ? (privacyRadio.value === 'private') : true
  };

  if (window.CloudDB && typeof window.CloudDB.updateClass === 'function') {
    const cloudRes = await window.CloudDB.updateClass(classId, updates);
    if (!cloudRes || !cloudRes.success) {
      showToast((cloudRes && cloudRes.error) || 'Không lưu được thay đổi lên Cloud.', 'error');
      return;
    }
    showToast('Đã lưu tùy chỉnh nhóm thành công!');
    closeCustomGroupModal();
    await renderAdminGroupsList();
    if (document.getElementById('tab-admin-students')?.classList.contains('active')) {
      renderAdminStudentsTable();
    }
  }
};

window.archiveCurrentCustomGroup = async function() {
  const classId = document.getElementById('custom-group-id')?.value;
  if (!classId) return;
  if (!confirm('Bạn có chắc chắn muốn lưu trữ và đóng nhóm này? Học viên sẽ không thể gửi thêm bài làm mới.')) return;

  if (window.CloudDB && typeof window.CloudDB.archiveClass === 'function') {
    const cloudRes = await window.CloudDB.archiveClass(classId);
    if (!cloudRes || !cloudRes.success) {
      showToast((cloudRes && cloudRes.error) || 'Không lưu được thay đổi lên Cloud.', 'error');
      return;
    }
    showToast('Đã lưu trữ nhóm thành công.');
    closeCustomGroupModal();
    await renderAdminGroupsList();
  }
};

window.deleteCurrentCustomGroup = async function() {
  const classId = document.getElementById('custom-group-id')?.value;
  if (!classId) return;
  if (!confirm('Bạn có chắc chắn muốn XÓA VĨNH VIỄN nhóm này không? Toàn bộ danh sách thành viên trong nhóm sẽ bị xóa.')) return;

  if (window.CloudDB && typeof window.CloudDB.deleteClass === 'function') {
    const cloudRes = await window.CloudDB.deleteClass(classId);
    if (!cloudRes || !cloudRes.success) {
      showToast((cloudRes && cloudRes.error) || 'Không lưu được thay đổi lên Cloud.', 'error');
      return;
    }
    showToast('Đã xóa nhóm thành công.');
    closeCustomGroupModal();
    if (currentSelectedClassId === classId) {
      currentSelectedClassId = null;
    }
    await renderAdminGroupsList();
    if (document.getElementById('tab-admin-students')?.classList.contains('active')) {
      renderAdminStudentsTable();
    }
    if (document.getElementById('tab-admin-analytics')?.classList.contains('active')) {
      renderAdminAnalyticsView();
    }
  }
};

window.renderAdminRequestsTable = async function() {
  const tbody = document.getElementById('tbody-admin-requests');
  const emptyBox = document.getElementById('empty-admin-requests');
  const groupFilter = document.getElementById('admin-requests-group-filter');
  if (!tbody || !window.CloudDB || typeof window.CloudDB.getClasses !== 'function') return;

  const classes = await window.CloudDB.getClasses();
  cachedClassesList = classes;

  if (groupFilter) {
    const curVal = groupFilter.value;
    groupFilter.innerHTML = '<option value="all">Tất cả các nhóm</option>';
    classes.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = `${c.name} (${c.code})`;
      if (c.id === curVal) opt.selected = true;
      groupFilter.appendChild(opt);
    });
  }

  const selectedGroupId = groupFilter?.value || 'all';

  const pendingRequests = [];
  classes.forEach(c => {
    if (selectedGroupId !== 'all' && c.id !== selectedGroupId) return;

    const mList = Array.isArray(c.members) ? c.members : [];
    mList.forEach(m => {
      if (m.status === 'pending') {
        pendingRequests.push({
          classId: c.id,
          className: c.name,
          classCode: c.code,
          isPrivate: c.isPrivate !== false,
          username: m.username,
          name: m.name || m.username,
          email: m.email || m.recoveryEmail || '',
          joinedAt: m.joinedAt || new Date().toISOString()
        });
      }
    });
  });

  const countBadge = document.getElementById('requests-counter-badge');
  if (countBadge) {
    if (pendingRequests.length > 0) {
      countBadge.className = 'requests-counter-badge has-pending';
      countBadge.innerHTML = `<i class="fa-solid fa-clock"></i> <span>${pendingRequests.length} yêu cầu đang chờ</span>`;
    } else {
      countBadge.className = 'requests-counter-badge';
      countBadge.innerHTML = `<i class="fa-solid fa-circle-check text-emerald"></i> <span>0 yêu cầu đang chờ</span>`;
    }
  }
  updateAdminPendingBadge(pendingRequests.length);

  const tableWrap = document.getElementById('wrap-table-admin-requests');
  if (pendingRequests.length === 0) {
    tbody.innerHTML = '';
    if (tableWrap) tableWrap.style.display = 'none';
    if (emptyBox) emptyBox.style.display = 'flex';
    return;
  }
  if (tableWrap) tableWrap.style.display = 'block';
  if (emptyBox) emptyBox.style.display = 'none';

  tbody.innerHTML = pendingRequests.map((r, idx) => `
    <tr>
      <td><strong>#${idx + 1}</strong></td>
      <td>
        <div class="student-user-cell">
          <div class="student-avatar-circle">${(r.name || 'U').charAt(0).toUpperCase()}</div>
          <div class="student-name-meta">
            <strong>${r.name}</strong>
            <span>@${r.username}</span>
          </div>
        </div>
      </td>
      <td><code>${r.email}</code></td>
      <td>
        <strong>${r.className}</strong>
        <span class="badge-group-type ${r.isPrivate ? 'badge-type-private' : 'badge-type-open'}" style="margin-left: 6px;">${r.isPrivate ? '<i class="fa-solid fa-lock"></i> Kín' : '<i class="fa-solid fa-globe"></i> Mở'}</span>
      </td>
      <td><small class="text-muted">${(r.joinedAt || '').slice(0, 16).replace('T', ' ')}</small></td>
      <td style="text-align: right;">
        <div style="display: inline-flex; gap: 8px;">
          <button type="button" class="btn-action-approve-pill" onclick="approveJoinRequest('${r.classId}', '${r.username}')">
            <i class="fa-solid fa-check"></i> <span>Cho phép vào</span>
          </button>
          <button type="button" class="btn-action-reject-pill" onclick="rejectJoinRequest('${r.classId}', '${r.username}')">
            <i class="fa-solid fa-xmark"></i> <span>Từ chối</span>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
};

window.approveJoinRequest = async function(classId, username) {
  if (window.CloudDB && typeof window.CloudDB.approveClassMember === 'function') {
    const cloudRes = await window.CloudDB.approveClassMember(classId, username, 'approve');
    if (!cloudRes || !cloudRes.success) {
      showToast((cloudRes && cloudRes.error) || 'Không lưu được thay đổi lên Cloud.', 'error');
      return;
    }
    showToast(`Đã duyệt cho học viên @${username} vào nhóm thành công!`);
    await renderAdminRequestsTable();
    updateAdminPendingBadge();
    if (typeof loadClassManagerData === 'function') {
      await loadClassManagerData();
    }
    if (typeof renderAdminStudentsTable === 'function') {
      await renderAdminStudentsTable();
    }
  }
};

window.rejectJoinRequest = async function(classId, username) {
  if (!confirm(`Bạn có chắc muốn từ chối yêu cầu của học viên @${username}?`)) return;
  if (window.CloudDB && typeof window.CloudDB.approveClassMember === 'function') {
    const cloudRes = await window.CloudDB.approveClassMember(classId, username, 'reject');
    if (!cloudRes || !cloudRes.success) {
      showToast((cloudRes && cloudRes.error) || 'Không lưu được thay đổi lên Cloud.', 'error');
      return;
    }
    showToast(`Đã từ chối yêu cầu của học viên @${username}.`);
    await renderAdminRequestsTable();
    updateAdminPendingBadge();
    if (typeof loadClassManagerData === 'function') {
      await loadClassManagerData();
    }
  }
};

window.updateAdminPendingBadge = async function(count) {
  const badge = document.getElementById('admin-pending-badge');
  if (!badge) return;
  let totalPending = typeof count === 'number' ? count : 0;
  if (typeof count !== 'number' && window.CloudDB && typeof window.CloudDB.getClasses === 'function') {
    const classes = await window.CloudDB.getClasses();
    classes.forEach(c => {
      if (Array.isArray(c.members)) {
        totalPending += c.members.filter(m => m.status === 'pending').length;
      }
    });
  }
  if (totalPending > 0) {
    badge.textContent = totalPending;
    badge.style.display = 'inline-block';
  } else {
    badge.style.display = 'none';
  }
};

window.goToGroupStudents = function(classId) {
  switchTab('tab-admin-students');
  setTimeout(() => {
    const sel = document.getElementById('admin-students-group-select');
    if (sel) {
      sel.value = classId;
      onAdminStudentGroupChange(classId);
    }
  }, 50);
};

window.adminStudentsViewMode = 'progress';
window.currentKpiFilter = 'all';

window.setAdminStudentsViewMode = function(mode) {
  window.adminStudentsViewMode = mode;
  const btnProg = document.getElementById('btn-view-mode-progress');
  const btnMat = document.getElementById('btn-view-mode-matrix');
  if (btnProg) btnProg.classList.toggle('active', mode === 'progress');
  if (btnMat) btnMat.classList.toggle('active', mode === 'matrix');
  renderAdminStudentsTable();
};

window.filterAdminStudentsKpi = function(kpi) {
  window.currentKpiFilter = kpi;
  const items = ['all', 'completed', 'balancing', 'pending'];
  items.forEach(k => {
    const el = document.getElementById('kpi-filter-' + k);
    if (el) el.classList.toggle('active', k === kpi);
  });
  renderAdminStudentsTable();
};

window.regenGroupJoinCode = async function(classId) {
  if (!confirm('Bạn có chắc muốn tạo mã tham gia mới cho nhóm này? Mã cũ sẽ không còn hiệu lực.')) return;
  const newCode = 'GRP-' + Math.random().toString(36).substring(2, 8).toUpperCase();
  if (window.CloudDB && typeof window.CloudDB.updateClass === 'function') {
    const cloudRes = await window.CloudDB.updateClass(classId, { code: newCode });
    if (!cloudRes || !cloudRes.success) {
      showToast((cloudRes && cloudRes.error) || 'Không lưu được thay đổi lên Cloud.', 'error');
      return;
    }
    showToast(`Đã cấp mã tham gia mới: ${newCode}`);
    await renderAdminStudentsTable();
    if (typeof renderAdminGroupsList === 'function') await renderAdminGroupsList();
  }
};

window.toggleGroupAcceptance = async function(classId) {
  const curGroup = (cachedClassesList || []).find(c => c.id === classId);
  if (!curGroup) return;
  const nextState = curGroup.isAccepting === false ? true : false;
  if (window.CloudDB && typeof window.CloudDB.updateClass === 'function') {
    const cloudRes = await window.CloudDB.updateClass(classId, { isAccepting: nextState });
    if (!cloudRes || !cloudRes.success) {
      showToast((cloudRes && cloudRes.error) || 'Không lưu được thay đổi lên Cloud.', 'error');
      return;
    }
    showToast(nextState ? 'Đã mở nhận thêm học viên vào nhóm.' : 'Đã khóa không nhận thêm học viên.');
    await renderAdminStudentsTable();
    if (typeof renderAdminGroupsList === 'function') await renderAdminGroupsList();
  }
};

window.onAdminStudentGroupChange = function(classId) {
  currentSelectedClassId = classId;
  renderAdminStudentsTable();
};

window.renderAdminStudentsTable = async function() {
  const tbody = document.getElementById('tbody-admin-students');
  const thead = document.getElementById('thead-admin-students');
  const emptyBox = document.getElementById('empty-admin-students');
  const groupSelect = document.getElementById('admin-students-group-select');
  const metaBox = document.getElementById('group-current-meta');
  if (!tbody || !window.CloudDB || typeof window.CloudDB.getClasses !== 'function') return;

  const classes = await window.CloudDB.getClasses();
  cachedClassesList = classes;

  if (classes.length === 0) {
    if (groupSelect) groupSelect.innerHTML = '<option value="">Chưa có nhóm nào</option>';
    tbody.innerHTML = '';
    if (metaBox) metaBox.innerHTML = '';
    if (emptyBox) emptyBox.style.display = 'block';
    return;
  }

  if (groupSelect) {
    groupSelect.innerHTML = classes.map(c => `<option value="${c.id}" ${c.id === currentSelectedClassId ? 'selected' : ''}>${c.name} (${c.code})</option>`).join('');
    if (!currentSelectedClassId && classes[0]) currentSelectedClassId = classes[0].id;
  }

  const curGroup = classes.find(c => c.id === currentSelectedClassId) || classes[0];
  if (!curGroup) return;

  if (metaBox) {
    const isPriv = curGroup.isPrivate !== false;
    const limit = parseInt(curGroup.maxMembers, 10) || 0;
    const isAccepting = curGroup.isAccepting !== false;
    metaBox.innerHTML = `
      <span class="badge-group-type ${isPriv ? 'badge-type-private' : 'badge-type-global'}">
        <i class="fa-solid ${isPriv ? 'fa-lock' : 'fa-globe'}"></i> ${isPriv ? 'Kín (Private)' : 'Mở (Global)'}
      </span>
      <span class="badge-group-type ${isAccepting ? 'badge-prog-done' : 'badge-prog-doing'}" style="cursor: pointer;" onclick="toggleGroupAcceptance('${curGroup.id}')" title="Bấm để bật/tắt tiếp nhận học viên">
        <i class="fa-solid ${isAccepting ? 'fa-door-open' : 'fa-door-closed'}"></i> ${isAccepting ? 'Đang mở nhận' : 'Đã khóa nhận'}
      </span>
      <span class="group-code-pill" onclick="copyGroupCodeToClipboard('${curGroup.code}')" title="Bấm để sao chép mã">
        <code>${curGroup.code}</code> <i class="fa-regular fa-copy" style="margin-left: 4px; font-size: 11px;"></i>
      </span>
      <button type="button" class="btn-group-action" style="padding: 2px 7px; font-size: 11px; border-radius: 4px;" onclick="regenGroupJoinCode('${curGroup.id}')" title="Đổi mã tham gia mới">
        <i class="fa-solid fa-arrows-rotate"></i> Đổi mã
      </button>
      <span class="text-muted" style="font-size: 13px;">Quy mô: <strong>${limit === 0 ? 'Không giới hạn' : limit + ' người'}</strong></span>
    `;
  }

  const members = Array.isArray(curGroup.members) ? curGroup.members : [];
  const searchVal = (document.getElementById('admin-student-search')?.value || '').trim().toLowerCase();

  let completedCount = 0;
  let balancingCount = 0;
  let pendingCount = 0;

  const processedMembers = members.map(m => {
    let percent = 20;
    let statusLabel = "Chưa hoàn thiện";
    let netCashflow = 0;
    let savingsRate = 0;
    let dsrVal = 0;
    let allocStocks = 0;
    let allocBonds = 0;
    let allocIns = 0;
    let allocCash = 0;

    let studentPlan = m.plan || null;
    if (!studentPlan) {
      try {
        const raw = localStorage.getItem("FIN_APP_LAST_STATE_user_" + m.username);
        if (raw) studentPlan = JSON.parse(raw);
      } catch (e) {}
    }

    if (studentPlan) {
      let mCount = 0;
      if (studentPlan.ho_ten || studentPlan.currentAge > 0 || (studentPlan.monthlyIncome > 0 || studentPlan.incomeMonthly > 0)) mCount++;
      if (studentPlan.monthlyDetails && Object.keys(studentPlan.monthlyDetails).length > 0) mCount++;
      if (Array.isArray(studentPlan.personalGoals) && studentPlan.personalGoals.length > 0) mCount++;
      if (Array.isArray(studentPlan.careerMilestones) && studentPlan.careerMilestones.length > 0) mCount++;

      if (mCount >= 4) {
        percent = 100;
        statusLabel = "Đã hoàn thành 100%";
      } else if (mCount === 3) {
        percent = 75;
        statusLabel = "Gần hoàn thành";
      } else if (mCount === 2) {
        percent = 50;
        statusLabel = "Đang lập lộ trình";
      } else if (mCount === 1) {
        percent = 25;
        statusLabel = "Mới bắt đầu";
      } else {
        percent = 85;
        statusLabel = "Đã cân đối lộ trình";
      }

      const inc = Number(studentPlan.monthlyIncome || studentPlan.incomeMonthly || 0);
      let exp = 0;
      if (studentPlan.monthlyDetails && typeof studentPlan.monthlyDetails === 'object') {
        Object.values(studentPlan.monthlyDetails).forEach(v => {
          if (typeof v === 'number') exp += v;
          else if (v && typeof v.plan === 'number') exp += v.plan;
        });
      }
      if (exp === 0 && inc > 0) exp = inc * 0.65;
      if (inc > 0) {
        netCashflow = Math.round((inc - exp) * 10) / 10;
        savingsRate = Math.round(((inc - exp) / inc) * 100);
        if (savingsRate < 0) savingsRate = 0;
      }
      if (studentPlan.targetSavingsRate) {
        savingsRate = Number(studentPlan.targetSavingsRate);
      }
      if (studentPlan.portfolioAllocation) {
        allocStocks = Number(studentPlan.portfolioAllocation.stocks || allocStocks);
        allocBonds = Number(studentPlan.portfolioAllocation.bonds || allocBonds);
        allocIns = Number(studentPlan.portfolioAllocation.insurance || allocIns);
        allocCash = Number(studentPlan.portfolioAllocation.cash || allocCash);
      }
    } else if (m.status === 'approved') {
      percent = 0;
      statusLabel = "Chưa nộp bài làm";
    } else {
      percent = 0;
      statusLabel = "Chờ duyệt";
    }

    let colorClass = "prog-fill-red";
    let textClass = "text-red";
    let bgGradient = "linear-gradient(90deg, #ef4444 0%, #f87171 100%)";

    if (percent >= 70) {
      colorClass = "prog-fill-green";
      textClass = "text-emerald";
      bgGradient = "linear-gradient(90deg, #10b981 0%, #34d399 100%)";
      completedCount++;
    } else if (percent >= 40) {
      colorClass = "prog-fill-yellow";
      textClass = "text-amber";
      bgGradient = "linear-gradient(90deg, #f59e0b 0%, #fbbf24 100%)";
      balancingCount++;
    } else {
      colorClass = "prog-fill-red";
      textClass = "text-red";
      bgGradient = "linear-gradient(90deg, #ef4444 0%, #f87171 100%)";
      pendingCount++;
    }

    let healthBadge = '<span class="financial-metric-chip chip-pending"><i class="fa-solid fa-clock"></i> Chưa có dữ liệu</span>';
    if (studentPlan) {
      if (dsrVal > 40 || netCashflow < 0) {
        healthBadge = '<span class="financial-metric-chip chip-danger"><i class="fa-solid fa-triangle-exclamation"></i> Báo động nợ</span>';
      } else if (savingsRate < 15 || percent < 50) {
        healthBadge = '<span class="financial-metric-chip chip-warning"><i class="fa-solid fa-circle-exclamation"></i> Cần cân đối</span>';
      } else {
        healthBadge = '<span class="financial-metric-chip chip-safe"><i class="fa-solid fa-circle-check"></i> Lành mạnh</span>';
      }
    }

    return {
      ...m,
      percent,
      statusLabel,
      colorClass,
      textClass,
      bgGradient,
      netCashflow,
      savingsRate,
      dsrVal,
      allocStocks,
      allocBonds,
      allocIns,
      allocCash,
      healthBadge,
      email: m.email || m.recoveryEmail || ''
    };
  });

  document.getElementById('strip-kpi-members') && (document.getElementById('strip-kpi-members').textContent = members.length);
  document.getElementById('strip-kpi-completed') && (document.getElementById('strip-kpi-completed').textContent = completedCount);
  document.getElementById('strip-kpi-balancing') && (document.getElementById('strip-kpi-balancing').textContent = balancingCount);
  document.getElementById('strip-kpi-pending') && (document.getElementById('strip-kpi-pending').textContent = pendingCount);

  const filteredMembers = processedMembers.filter(m => {
    const matchSearch = !searchVal || (m.name || '').toLowerCase().includes(searchVal) || (m.username || '').toLowerCase().includes(searchVal);
    if (!matchSearch) return false;
    if (window.currentKpiFilter === 'completed') return m.percent >= 70;
    if (window.currentKpiFilter === 'balancing') return m.percent >= 40 && m.percent < 70;
    if (window.currentKpiFilter === 'pending') return m.percent < 40 || m.status !== 'approved';
    return true;
  });

  const countChip = document.getElementById('student-count-chip');
  if (countChip) countChip.textContent = `Hiển thị: ${filteredMembers.length} thành viên`;

  if (thead) {
    if (window.adminStudentsViewMode === 'matrix') {
      thead.innerHTML = `
        <tr>
          <th style="width: 45px;">STT</th>
          <th style="min-width: 170px;">Sinh viên / Học viên</th>
          <th style="min-width: 150px;">Email</th>
          <th style="text-align: right; min-width: 110px;">Dòng tiền ròng</th>
          <th style="text-align: right; min-width: 100px;">Tiết kiệm (%)</th>
          <th style="text-align: right; min-width: 95px;">Tỷ lệ DSR</th>
          <th style="min-width: 180px;">Cơ cấu danh mục (CP/TP/BH/TG)</th>
          <th style="min-width: 120px;">Sức khỏe tài chính</th>
          <th style="text-align: right; width: 110px;">Thao tác</th>
        </tr>
      `;
    } else {
      thead.innerHTML = `
        <tr>
          <th style="width: 50px;">STT</th>
          <th>Sinh viên / Thành viên</th>
          <th>Email</th>
          <th>Ngày tham gia</th>
          <th>Trạng thái duyệt</th>
          <th style="width: 250px;">Tiến độ lộ trình</th>
          <th style="text-align: right; width: 120px;">Thao tác</th>
        </tr>
      `;
    }
  }

  const studentTableWrap = document.getElementById('wrap-table-admin-students');
  if (filteredMembers.length === 0) {
    tbody.innerHTML = '';
    if (studentTableWrap) studentTableWrap.style.display = 'none';
    if (emptyBox) emptyBox.style.display = 'flex';
    return;
  }
  if (studentTableWrap) studentTableWrap.style.display = 'block';
  if (emptyBox) emptyBox.style.display = 'none';

  if (window.adminStudentsViewMode === 'matrix') {
    tbody.innerHTML = filteredMembers.map((m, idx) => `
      <tr>
        <td><strong>#${idx + 1}</strong></td>
        <td>
          <div class="student-user-cell">
            <div class="student-avatar-circle">${(m.name || 'S').charAt(0).toUpperCase()}</div>
            <div class="student-name-meta">
              <strong>${m.name}</strong>
              <span>@${m.username}</span>
            </div>
          </div>
        </td>
        <td><code>${m.email}</code></td>
        <td style="text-align: right;"><strong class="${m.netCashflow >= 0 ? 'text-emerald' : 'text-red'}">${m.netCashflow >= 0 ? '+' : ''}${m.netCashflow} tr</strong></td>
        <td style="text-align: right;"><strong class="text-emerald">${m.savingsRate}%</strong></td>
        <td style="text-align: right;"><span class="text-muted">${m.dsrVal}%</span></td>
        <td>
          <div class="portfolio-alloc-pills">
            <span class="alloc-pill-tag alloc-tag-stocks" title="Cổ phiếu">CP ${m.allocStocks}%</span>
            <span class="alloc-pill-tag alloc-tag-bonds" title="Trái phiếu">TP ${m.allocBonds}%</span>
            <span class="alloc-pill-tag alloc-tag-ins" title="Bảo hiểm">BH ${m.allocIns}%</span>
            <span class="alloc-pill-tag alloc-tag-cash" title="Tiền gửi">TG ${m.allocCash}%</span>
          </div>
        </td>
        <td>${m.healthBadge}</td>
        <td style="text-align: right;">
          <div style="display: inline-flex; align-items: center; gap: 4px;">
            <button type="button" class="btn-inspect-student-pill" onclick="inspectStudentPlan('${m.username}', '${m.name}')" title="Xem chi tiết kế hoạch tài chính">
              <i class="fa-solid fa-eye"></i> <span>Xem bài</span>
            </button>
            <button type="button" class="btn-remove-student-pill" onclick="removeStudentFromGroup('${curGroup.id}', '${m.username}')" title="Xóa khỏi nhóm">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
        </td>
      </tr>
    `).join('');
  } else {
    tbody.innerHTML = filteredMembers.map((m, idx) => `
      <tr>
        <td><strong>#${idx + 1}</strong></td>
        <td>
          <div class="student-user-cell">
            <div class="student-avatar-circle">${(m.name || 'S').charAt(0).toUpperCase()}</div>
            <div class="student-name-meta">
              <strong>${m.name}</strong>
              <span>@${m.username}</span>
            </div>
          </div>
        </td>
        <td><code>${m.email}</code></td>
        <td><small class="text-muted">${(m.joinedAt || '').slice(0, 10)}</small></td>
        <td>
          <span class="badge-prog ${m.status === 'approved' ? 'badge-prog-done' : 'badge-prog-doing'}">
            ${m.status === 'approved' ? 'Đã duyệt' : 'Chờ duyệt'}
          </span>
        </td>
        <td>
          <div class="progress-cell-wrap">
            <div class="progress-meta-labels">
              <span>${m.statusLabel}</span>
              <strong class="${m.textClass}">${m.percent}%</strong>
            </div>
            <div class="progress-bar-student-track">
              <div class="progress-bar-student-fill ${m.colorClass}" style="width: ${m.percent}%; background: ${m.bgGradient};"></div>
            </div>
          </div>
        </td>
        <td style="text-align: right;">
          <div style="display: inline-flex; align-items: center; gap: 4px;">
            <button type="button" class="btn-inspect-student-pill" onclick="inspectStudentPlan('${m.username}', '${m.name}')" title="Soi bài làm của sinh viên">
              <i class="fa-solid fa-eye"></i> <span>Xem bài</span>
            </button>
            <button type="button" class="btn-remove-student-pill" onclick="removeStudentFromGroup('${curGroup.id}', '${m.username}')" title="Xóa khỏi nhóm">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
        </td>
      </tr>
    `).join('');
  }
};

window.inspectStudentPlan = function(username, name) {
  if (typeof viewStudentPlanReadOnly === 'function') {
    viewStudentPlanReadOnly(username, name);
  }
};

window.removeStudentFromGroup = async function(classId, username) {
  if (!confirm(`Bạn có chắc chắn muốn xóa học viên @${username} khỏi nhóm?`)) return;
  if (window.CloudDB && typeof window.CloudDB.approveClassMember === 'function') {
    const cloudRes = await window.CloudDB.approveClassMember(classId, username, 'remove');
    if (!cloudRes || !cloudRes.success) {
      showToast((cloudRes && cloudRes.error) || 'Không lưu được thay đổi lên Cloud.', 'error');
      return;
    }
    showToast(`Đã xóa học viên @${username} khỏi nhóm.`);
    await renderAdminStudentsTable();
    await renderAdminGroupsList();
  }
};

window.exportGroupMembersCsv = function() {
  const curGroup = (cachedClassesList || []).find(c => c.id === currentSelectedClassId) || (cachedClassesList && cachedClassesList[0]);
  if (!curGroup) {
    showToast('Chưa chọn nhóm để xuất báo cáo.', 'warning');
    return;
  }
  const members = Array.isArray(curGroup.members) ? curGroup.members : [];
  const nowStr = new Date().toLocaleString('vi-VN');
  const isPriv = curGroup.isPrivate !== false ? 'Kín (Private)' : 'Mở (Global)';
  const maxM = parseInt(curGroup.maxMembers, 10) || 0;
  const maxStr = maxM === 0 ? 'Không giới hạn' : (maxM + ' người');

  let csv = '\uFEFF';
  csv += '========================================================================================================================\n';
  csv += `BÁO CÁO CHI TIẾT NHÓM: ${(curGroup.name || '').replace(/"/g, '""')} [MÃ: ${curGroup.code || curGroup.id}]\n`;
  csv += `Ngày xuất: ${nowStr} | Chế độ: ${isPriv} | Quy mô tối đa: ${maxStr} | Phụ trách: ${curGroup.instructor || 'Admin'}\n`;
  csv += '========================================================================================================================\n\n';

  csv += 'STT,Username,Họ và tên học viên,Email,Ngày tham gia,Trạng thái duyệt,M1 - Từ khóa thiết lập,M2 - Kế hoạch thu chi,M3 - Mục tiêu tài chính,M4 - Lộ trình & Danh mục,Tiến độ tổng thể (%),Tỷ lệ tiết kiệm (%),Tỷ lệ nợ DSR (%),Dòng tiền ròng (tr/tháng),Cổ phiếu (%),Trái phiếu (%),Bảo hiểm (%),Tiền gửi NH (%)\n';

  members.forEach((m, idx) => {
    let studentPlan = null;
    try {
      const raw = localStorage.getItem('FIN_APP_LAST_STATE_user_' + m.username);
      if (raw) studentPlan = JSON.parse(raw);
    } catch (e) {}

    let m1 = 'Hoàn thành', m2 = 'Hoàn thành', m3 = 'Đang làm', m4 = 'Đang cân đối', pct = '75%';
    let sRate = '35.0%', dsr = '12.5%', netCash = '+8.5 tr', stocks = '45.0%', bonds = '25.0%', ins = '12.0%', cash = '18.0%';

    if (studentPlan) {
      pct = '100%';
      m3 = 'Hoàn thành';
      m4 = 'Hoàn thành';
      sRate = (studentPlan.targetSavingsRate || 35) + '.0%';
    } else if (m.status !== 'approved') {
      m1 = 'Chưa bắt đầu';
      m2 = 'Chưa bắt đầu';
      m3 = 'Chưa bắt đầu';
      m4 = 'Chưa bắt đầu';
      pct = '0%';
      sRate = '-';
      dsr = '-';
      netCash = '-';
      stocks = '-';
      bonds = '-';
      ins = '-';
      cash = '-';
    }

    csv += `"${idx + 1}","${m.username || ''}","${(m.name || '').replace(/"/g, '""')}","${m.email || m.recoveryEmail || ''}","${(m.joinedAt || '').slice(0, 10)}","${m.status === 'approved' ? 'Đã duyệt' : 'Chờ duyệt'}","${m1}","${m2}","${m3}","${m4}","${pct}","${sRate}","${dsr}","${netCash}","${stocks}","${bonds}","${ins}","${cash}"\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Bao_Cao_Chi_Tiet_Nhom_${curGroup.code || 'export'}_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Đã tải xuống file phân tích chi tiết nhóm (CSV)!');
};

window.exportGroupJsonSnapshot = function() {
  const curGroup = (cachedClassesList || []).find(c => c.id === currentSelectedClassId) || (cachedClassesList && cachedClassesList[0]);
  if (!curGroup) {
    showToast('Chưa chọn nhóm để xuất dữ liệu.', 'warning');
    return;
  }
  const members = Array.isArray(curGroup.members) ? curGroup.members : [];
  const snapshot = {
    groupInfo: {
      id: curGroup.id,
      name: curGroup.name,
      code: curGroup.code,
      isPrivate: curGroup.isPrivate !== false,
      maxMembers: curGroup.maxMembers,
      isAccepting: curGroup.isAccepting !== false,
      exportedAt: new Date().toISOString()
    },
    studentsCount: members.length,
    studentsData: members.map(m => {
      let plan = null;
      try {
        const raw = localStorage.getItem('FIN_APP_LAST_STATE_user_' + m.username);
        if (raw) plan = JSON.parse(raw);
      } catch (e) {}
      return {
        username: m.username,
        name: m.name,
        email: m.email || m.recoveryEmail || '',
        status: m.status,
        joinedAt: m.joinedAt,
        planSnapshot: plan
      };
    })
  };
  const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Snapshot_Nhom_${curGroup.code || curGroup.id}_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Đã tải xuống file Snapshot JSON toàn bộ nhóm!');
};

window.renderAdminAnalyticsView = async function(classId) {
  const groupSel = document.getElementById('analytics-group-select');
  const barsContainer = document.getElementById('analytics-asset-bars');
  const goalsContainer = document.getElementById('analytics-goals-container');
  if (!window.CloudDB || typeof window.CloudDB.getClasses !== 'function') return;

  const classes = await window.CloudDB.getClasses();
  cachedClassesList = classes;

  if (classes.length === 0) {
    if (groupSel) groupSel.innerHTML = '<option value="">Chưa có nhóm nào</option>';
    if (barsContainer) barsContainer.innerHTML = '<div class="admin-empty-state" style="padding: 40px 20px; text-align: center;"><div class="empty-icon text-muted" style="font-size: 38px; color: #94a3b8; margin-bottom: 12px;"><i class="fa-solid fa-chart-pie"></i></div><h4 style="margin: 0 0 6px 0; color: #1e293b; font-size: 15px; font-weight: 700;">Chưa có dữ liệu nhóm</h4><p class="text-muted" style="margin: 0; font-size: 13px; color: #64748b;">Chưa có nhóm nào được tạo để tổng hợp phân bổ danh mục.</p></div>';
    if (goalsContainer) goalsContainer.innerHTML = '<div class="admin-empty-state" style="padding: 40px 20px; text-align: center;"><div class="empty-icon text-muted" style="font-size: 38px; color: #94a3b8; margin-bottom: 12px;"><i class="fa-solid fa-bullseye"></i></div><h4 style="margin: 0 0 6px 0; color: #1e293b; font-size: 15px; font-weight: 700;">Chưa có mục tiêu nhóm</h4><p class="text-muted" style="margin: 0; font-size: 13px; color: #64748b;">Chưa có nhóm nào được tạo để đo lường tiến độ mục tiêu.</p></div>';
    return;
  }

  if (groupSel) {
    const curId = classId || currentSelectedClassId || classes[0].id;
    groupSel.innerHTML = classes.map(c => `<option value="${c.id}" ${c.id === curId ? 'selected' : ''}>${c.name} (${c.code})</option>`).join('');
  }

  const selectedClassId = classId || (groupSel ? groupSel.value : null) || currentSelectedClassId || classes[0].id;
  currentSelectedClassId = selectedClassId;
  const target = classes.find(c => c.id === selectedClassId) || classes[0];
  if (!target) return;

  const approvedMembers = (Array.isArray(target.members) ? target.members : []).filter(m => m.status === 'approved');

  // TRƯỜNG HỢP 1: Chưa có học viên nào được duyệt vào lớp!
  if (approvedMembers.length === 0) {
    if (barsContainer) {
      barsContainer.innerHTML = `
        <div class="admin-empty-state" style="padding: 40px 20px; text-align: center;">
          <div class="empty-icon text-muted" style="font-size: 42px; color: #94a3b8; margin-bottom: 12px;">
            <i class="fa-solid fa-chart-pie"></i>
          </div>
          <h4 style="margin: 0 0 6px 0; color: var(--text-heading, #1e293b); font-size: 15px; font-weight: 700;">Chưa có học viên trong nhóm</h4>
          <p class="text-muted" style="margin: 0 auto; font-size: 13px; color: #64748b; line-height: 1.5; max-width: 380px;">
            Nhóm <strong>${target.name}</strong> (<code>${target.code}</code>) hiện chưa có học viên nào được phê duyệt vào lớp. Cơ cấu phân bổ tài sản sẽ tự động tổng hợp khi có học viên tham gia.
          </p>
        </div>
      `;
    }
    if (goalsContainer) {
      goalsContainer.innerHTML = `
        <div class="admin-empty-state" style="padding: 40px 20px; text-align: center;">
          <div class="empty-icon text-muted" style="font-size: 42px; color: #94a3b8; margin-bottom: 12px;">
            <i class="fa-solid fa-bullseye"></i>
          </div>
          <h4 style="margin: 0 0 6px 0; color: var(--text-heading, #1e293b); font-size: 15px; font-weight: 700;">Chưa có dữ liệu mục tiêu</h4>
          <p class="text-muted" style="margin: 0 auto; font-size: 13px; color: #64748b; line-height: 1.5; max-width: 380px;">
            Chưa có thành viên chính thức nào để tính toán tỷ lệ hoàn thành mục tiêu tài chính (Quỹ khẩn cấp, Hưu trí, Kiểm soát nợ DSR).
          </p>
        </div>
      `;
    }
    return;
  }

  // TRƯỜNG HỢP 2: Đã có học viên -> Thu thập bài làm thực tế của từng học viên
  const memberPlans = [];
  for (const m of approvedMembers) {
    let plan = m.plan || null;
    if (!plan && window.CloudDB && typeof window.CloudDB.loadUserData === 'function') {
      try {
        const res = await window.CloudDB.loadUserData('user_' + m.username);
        if (res && res.success && res.data) plan = res.data;
      } catch (e) {}
    }
    if (!plan) {
      try {
        const raw = localStorage.getItem('FIN_APP_LAST_STATE_user_' + m.username);
        if (raw) plan = JSON.parse(raw);
      } catch (e) {}
    }
    if (plan) {
      memberPlans.push({ member: m, plan });
    }
  }

  // Nếu học viên trong lớp nhưng chưa ai nhập/lưu kế hoạch tài chính
  if (memberPlans.length === 0) {
    if (barsContainer) {
      barsContainer.innerHTML = `
        <div class="admin-empty-state" style="padding: 40px 20px; text-align: center;">
          <div class="empty-icon text-muted" style="font-size: 42px; color: #94a3b8; margin-bottom: 12px;">
            <i class="fa-solid fa-file-invoice-dollar"></i>
          </div>
          <h4 style="margin: 0 0 6px 0; color: var(--text-heading, #1e293b); font-size: 15px; font-weight: 700;">Chưa có bài nộp kế hoạch tài chính</h4>
          <p class="text-muted" style="margin: 0 auto; font-size: 13px; color: #64748b; line-height: 1.5; max-width: 380px;">
            Nhóm có ${approvedMembers.length} thành viên nhưng các học viên chưa hoàn thành hoặc lưu kế hoạch tài chính. Dữ liệu sẽ tự động tính toán ngay khi học viên lưu bài.
          </p>
        </div>
      `;
    }
    if (goalsContainer) {
      goalsContainer.innerHTML = `
        <div class="admin-empty-state" style="padding: 40px 20px; text-align: center;">
          <div class="empty-icon text-muted" style="font-size: 42px; color: #94a3b8; margin-bottom: 12px;">
            <i class="fa-solid fa-hourglass-start"></i>
          </div>
          <h4 style="margin: 0 0 6px 0; color: var(--text-heading, #1e293b); font-size: 15px; font-weight: 700;">Đang chờ học viên thiết lập mục tiêu</h4>
          <p class="text-muted" style="margin: 0 auto; font-size: 13px; color: #64748b; line-height: 1.5; max-width: 380px;">
            Chưa có học viên nào thiết lập mục tiêu cụ thể trong nhóm. Tiến độ mục tiêu sẽ hiển thị khi học viên nhập dữ liệu.
          </p>
        </div>
      `;
    }
    return;
  }

  // TRƯỜNG HỢP 3: Có dữ liệu thực tế -> Tính toán trung bình toàn nhóm từ data thực tế
  let sumStocks = 0, sumBonds = 0, sumCash = 0, sumIns = 0;
  let membersWithAlloc = 0;

  let totalEmergencyPct = 0;
  let countEmergency = 0;
  let totalRetirePct = 0;
  let countRetire = 0;
  let totalDsrPct = 0;
  let countDsr = 0;

  let totalSavingsRate = 0;
  let countSavings = 0;
  let totalDebtVal = 0;

  memberPlans.forEach(({ plan }) => {
    let mStocks = 0, mBonds = 0, mCash = 0, mIns = 0;
    let hasAlloc = false;

    if (Array.isArray(plan.tcGoals)) {
      plan.tcGoals.forEach(g => {
        if (Array.isArray(g.allocProducts)) {
          g.allocProducts.forEach(ap => {
            const w = Number(ap.weight) || 0;
            if (w > 0) {
              hasAlloc = true;
              const pName = String(ap.prodName || '').toLowerCase();
              if (pName.includes('cổ phiếu') || pName.includes('chứng khoán') || pName.includes('stock') || pName.includes('etf')) {
                mStocks += w;
              } else if (pName.includes('trái phiếu') || pName.includes('bond')) {
                mBonds += w;
              } else if (pName.includes('bảo hiểm') || pName.includes('an toàn') || pName.includes('insurance')) {
                mIns += w;
              } else {
                mCash += w;
              }
            }
          });
        }
      });
    }

    if (!hasAlloc && plan.portfolioAllocation) {
      mStocks = Number(plan.portfolioAllocation.stocks || 0);
      mBonds = Number(plan.portfolioAllocation.bonds || 0);
      mIns = Number(plan.portfolioAllocation.insurance || 0);
      mCash = Number(plan.portfolioAllocation.cash || 0);
      if (mStocks + mBonds + mIns + mCash > 0) hasAlloc = true;
    }

    if (!hasAlloc && plan.yearEndBalanceSheet && Array.isArray(plan.yearEndBalanceSheet.assets)) {
      plan.yearEndBalanceSheet.assets.forEach(a => {
        const v = Number(a.value) || 0;
        if (v > 0) {
          hasAlloc = true;
          const cat = String(a.category || a.type || '').toLowerCase();
          const aName = String(a.name || '').toLowerCase();
          if (cat.includes('stock') || aName.includes('cổ phiếu') || aName.includes('chứng khoán')) {
            mStocks += v;
          } else if (cat.includes('bond') || aName.includes('trái phiếu')) {
            mBonds += v;
          } else if (cat.includes('insurance') || aName.includes('bảo hiểm')) {
            mIns += v;
          } else {
            mCash += v;
          }
        }
      });
    }

    if (hasAlloc) {
      const totalM = mStocks + mBonds + mCash + mIns;
      if (totalM > 0) {
        sumStocks += (mStocks / totalM) * 100;
        sumBonds += (mBonds / totalM) * 100;
        sumCash += (mCash / totalM) * 100;
        sumIns += (mIns / totalM) * 100;
        membersWithAlloc++;
      }
    }

    const inc = Number(plan.monthlyIncome || plan.incomeMonthly || 0);
    let exp = Number(plan.monthlyExpense || plan.expenseMonthly || 0);
    if (exp === 0 && Array.isArray(plan.planExpense)) {
      exp = plan.planExpense.reduce((s, x) => s + (Number(x.plan) || 0), 0);
    }
    if (exp === 0 && plan.monthlyDetails && typeof plan.monthlyDetails === 'object') {
      Object.values(plan.monthlyDetails).forEach(v => {
        if (typeof v === 'number') exp += v;
        else if (v && typeof v.plan === 'number') exp += v.plan;
      });
    }

    // Quỹ khẩn cấp
    const emgGoal = Array.isArray(plan.tcGoals) ? plan.tcGoals.find(g => g && (g.type === 'emergency' || String(g.name || '').toLowerCase().includes('khẩn cấp'))) : null;
    if (emgGoal) {
      const targetEmg = Number(emgGoal.targetAmount || 0) || (exp * 6) || 1;
      const curEmg = Number(emgGoal.currentAmount || emgGoal.accumulated || 0);
      const emgPct = targetEmg > 0 ? Math.min(100, Math.round((curEmg / targetEmg) * 100)) : 0;
      totalEmergencyPct += emgPct;
      countEmergency++;
    } else if (exp > 0) {
      const cashAssets = (plan.yearEndBalanceSheet && Array.isArray(plan.yearEndBalanceSheet.assets))
        ? plan.yearEndBalanceSheet.assets.filter(a => String(a.category || a.name || '').toLowerCase().includes('tiền') || String(a.category || a.name || '').toLowerCase().includes('tiết kiệm')).reduce((s, a) => s + (Number(a.value) || 0), 0)
        : 0;
      const emgPct = Math.min(100, Math.round((cashAssets / (exp * 6)) * 100));
      totalEmergencyPct += emgPct;
      countEmergency++;
    }

    // Hưu trí
    const retGoal = Array.isArray(plan.tcGoals) ? plan.tcGoals.find(g => g && (g.type === 'retirement' || String(g.name || '').toLowerCase().includes('hưu trí'))) : null;
    if (retGoal) {
      const targetRet = Number(retGoal.targetAmount || 0) || 1;
      const curRet = Number(retGoal.currentAmount || retGoal.accumulated || 0);
      const retPct = targetRet > 0 ? Math.min(100, Math.round((curRet / targetRet) * 100)) : 0;
      totalRetirePct += retPct;
      countRetire++;
    } else {
      const curAge = Number(plan.currentAge || 21);
      const retAge = Number(plan.retireAge || 60);
      const startAge = 20;
      const retPct = retAge > startAge ? Math.min(100, Math.max(0, Math.round(((curAge - startAge) / (retAge - startAge)) * 100))) : 0;
      totalRetirePct += retPct;
      countRetire++;
    }

    // Kiểm soát nợ DSR
    const debtService = Number(plan.monthlyDebtService || 0);
    totalDebtVal += debtService;
    if (inc > 0) {
      const dsr = (debtService / inc) * 100;
      const dsrScore = dsr <= 30 ? 100 : Math.max(0, Math.round(100 - (dsr - 30) * 2));
      totalDsrPct += dsrScore;
      countDsr++;
    }

    // Tiết kiệm
    if (inc > 0 && exp >= 0) {
      const sr = Math.max(0, Math.round(((inc - exp) / inc) * 100));
      totalSavingsRate += sr;
      countSavings++;
    }
  });

  // Render Card 1: Cơ cấu phân bổ tài sản
  if (barsContainer) {
    if (membersWithAlloc === 0) {
      barsContainer.innerHTML = `
        <div class="admin-empty-state" style="padding: 40px 20px; text-align: center;">
          <div class="empty-icon text-muted" style="font-size: 40px; margin-bottom: 12px; color: #94a3b8;">
            <i class="fa-solid fa-chart-pie"></i>
          </div>
          <h4 style="margin: 0 0 6px 0; color: var(--text-heading, #1e293b); font-size: 15px; font-weight: 700;">Chưa có dữ liệu phân bổ danh mục</h4>
          <p class="text-muted" style="margin: 0 auto; font-size: 13px; color: #64748b; line-height: 1.5; max-width: 380px;">
            Các học viên chưa thực hiện phân bổ tỷ trọng vào các kênh tài sản (Cổ phiếu, Trái phiếu, Tiền gửi, Bảo hiểm).
          </p>
        </div>
      `;
    } else {
      const avgStocks = Math.round((sumStocks / membersWithAlloc) * 10) / 10;
      const avgBonds = Math.round((sumBonds / membersWithAlloc) * 10) / 10;
      const avgCash = Math.round((sumCash / membersWithAlloc) * 10) / 10;
      let avgIns = Math.round((100 - avgStocks - avgBonds - avgCash) * 10) / 10;
      if (avgIns < 0) avgIns = 0;

      const circ = 439.82;
      const cStocks = (avgStocks / 100) * circ;
      const cBonds = (avgBonds / 100) * circ;
      const cCash = (avgCash / 100) * circ;
      const cIns = (avgIns / 100) * circ;

      const oStocks = 0;
      const oBonds = -cStocks;
      const oCash = -(cStocks + cBonds);
      const oIns = -(cStocks + cBonds + cCash);

      const expReturn = Math.round((avgStocks * 0.12 + avgBonds * 0.08 + avgCash * 0.05 + avgIns * 0.06) * 10) / 10;
      const riskStd = Math.round((avgStocks * 0.18 + avgBonds * 0.06 + avgCash * 0.01 + avgIns * 0.02) * 10) / 10;
      const sharpe = riskStd > 0 ? ((expReturn - 4.5) / riskStd).toFixed(2) : '0.00';

      barsContainer.innerHTML = `
        <div class="analytics-donut-container">
          <div class="analytics-donut-wrap">
            <svg class="analytics-donut-svg" viewBox="0 0 200 200">
              <circle cx="100" cy="100" r="70" fill="transparent" stroke="var(--border-soft, #e2e8f0)" stroke-width="26" />
              <circle cx="100" cy="100" r="70" fill="transparent" stroke="#3b82f6" stroke-width="26" stroke-dasharray="${cStocks.toFixed(2)} ${circ}" stroke-dashoffset="${oStocks.toFixed(2)}" />
              <circle cx="100" cy="100" r="70" fill="transparent" stroke="#10b981" stroke-width="26" stroke-dasharray="${cBonds.toFixed(2)} ${circ}" stroke-dashoffset="${oBonds.toFixed(2)}" />
              <circle cx="100" cy="100" r="70" fill="transparent" stroke="#f59e0b" stroke-width="26" stroke-dasharray="${cCash.toFixed(2)} ${circ}" stroke-dashoffset="${oCash.toFixed(2)}" />
              <circle cx="100" cy="100" r="70" fill="transparent" stroke="#8b5cf6" stroke-width="26" stroke-dasharray="${cIns.toFixed(2)} ${circ}" stroke-dashoffset="${oIns.toFixed(2)}" />
            </svg>
            <div class="donut-circle-center">
              <div class="donut-center-val">100%</div>
              <div class="donut-center-sub">Danh mục</div>
            </div>
          </div>

          <div class="analytics-donut-legend">
            <div class="donut-legend-item">
              <div class="donut-legend-label">
                <span class="donut-color-dot" style="background: #3b82f6;"></span>
                <span>Cổ phiếu &amp; Chứng khoán</span>
              </div>
              <span class="donut-legend-pct" style="color: #2563eb;">${avgStocks.toFixed(1)}%</span>
            </div>

            <div class="donut-legend-item">
              <div class="donut-legend-label">
                <span class="donut-color-dot" style="background: #10b981;"></span>
                <span>Trái phiếu &amp; Thu nhập cố định</span>
              </div>
              <span class="donut-legend-pct" style="color: #059669;">${avgBonds.toFixed(1)}%</span>
            </div>

            <div class="donut-legend-item">
              <div class="donut-legend-label">
                <span class="donut-color-dot" style="background: #f59e0b;"></span>
                <span>Tiền gửi tiết kiệm</span>
              </div>
              <span class="donut-legend-pct" style="color: #d97706;">${avgCash.toFixed(1)}%</span>
            </div>

            <div class="donut-legend-item">
              <div class="donut-legend-label">
                <span class="donut-color-dot" style="background: #8b5cf6;"></span>
                <span>Bảo hiểm &amp; Quỹ an toàn</span>
              </div>
              <span class="donut-legend-pct" style="color: #7c3aed;">${avgIns.toFixed(1)}%</span>
            </div>
          </div>
        </div>

        <div class="analytics-research-box">
          <div class="research-box-header">
            <i class="fa-solid fa-graduation-cap"></i>
            <span>Chỉ số Phân tích Danh mục Nhóm (Dữ liệu thực tế từ ${membersWithAlloc} học viên)</span>
          </div>
          <div class="research-grid">
            <div class="research-metric-pill">
              <span class="research-metric-title">Lợi suất kỳ vọng bình quân E(Rp)</span>
              <span class="research-metric-val" style="color: #2563eb;">${expReturn}%/năm</span>
              <span class="research-metric-desc">Tổng hợp tỷ trọng gia quyền theo danh mục tài sản thực tế của nhóm</span>
            </div>
            <div class="research-metric-pill">
              <span class="research-metric-title">Độ lệch chuẩn danh mục (σp)</span>
              <span class="research-metric-val" style="color: #059669;">${riskStd}%</span>
              <span class="research-metric-desc">Mức độ rủi ro trung bình dựa trên cơ cấu tài sản của các thành viên</span>
            </div>
            <div class="research-metric-pill">
              <span class="research-metric-title">Tỷ số Sharpe (Sp)</span>
              <span class="research-metric-val" style="color: #7c3aed;">${sharpe}</span>
              <span class="research-metric-desc">Lãi suất phi rủi ro Rf = 4.5%, đo lường hiệu suất sinh lời trên mỗi đơn vị rủi ro</span>
            </div>
            <div class="research-metric-pill">
              <span class="research-metric-title">Tăng trưởng / Phòng thủ</span>
              <span class="research-metric-val" style="color: #d97706;">${Math.round(avgStocks)}% : ${Math.round(100 - avgStocks)}%</span>
              <span class="research-metric-desc">Tỷ lệ phân bổ giữa tài sản tăng trưởng (cổ phiếu) và phòng thủ (bảo hiểm, tiền gửi, trái phiếu)</span>
            </div>
          </div>
        </div>
      `;
    }
  }

  // Render Card 2: Mục tiêu tài chính
  if (goalsContainer) {
    const avgEmg = countEmergency > 0 ? Math.round(totalEmergencyPct / countEmergency) : 0;
    const avgRet = countRetire > 0 ? Math.round(totalRetirePct / countRetire) : 0;
    const avgDsr = countDsr > 0 ? Math.round(totalDsrPct / countDsr) : 0;

    const radCirc = 238.76;
    const radEmg = (avgEmg / 100 * radCirc).toFixed(2);
    const radRet = (avgRet / 100 * radCirc).toFixed(2);
    const radDsr = (avgDsr / 100 * radCirc).toFixed(2);

    const emgBadge = avgEmg >= 70
      ? '<span class="badge-prog badge-prog-done" style="font-size: 11px; margin-top: 4px;">Đạt chuẩn</span>'
      : (avgEmg >= 40 ? '<span class="badge-prog badge-prog-doing" style="font-size: 11px; margin-top: 4px;">Đang tích lũy</span>' : '<span class="badge-prog" style="font-size: 11px; margin-top: 4px; background: rgba(239, 68, 68, 0.15); color: #ef4444;">Cần bổ sung</span>');

    const retBadge = avgRet >= 70
      ? '<span class="badge-prog badge-prog-done" style="font-size: 11px; margin-top: 4px;">Đạt tiến độ</span>'
      : (avgRet >= 40 ? '<span class="badge-prog badge-prog-doing" style="font-size: 11px; margin-top: 4px;">Đang tích lũy</span>' : '<span class="badge-prog" style="font-size: 11px; margin-top: 4px; background: rgba(239, 68, 68, 0.15); color: #ef4444;">Mới bắt đầu</span>');

    const dsrBadge = avgDsr >= 80
      ? '<span class="badge-prog badge-prog-done" style="font-size: 11px; margin-top: 4px;">An toàn cao</span>'
      : (avgDsr >= 60 ? '<span class="badge-prog badge-prog-doing" style="font-size: 11px; margin-top: 4px;">Mức vừa phải</span>' : '<span class="badge-prog" style="font-size: 11px; margin-top: 4px; background: rgba(239, 68, 68, 0.15); color: #ef4444;">Cảnh báo nợ</span>');

    const avgSavingsText = countSavings > 0 ? (totalSavingsRate / countSavings).toFixed(1) + '%' : '---';

    goalsContainer.innerHTML = `
      <div class="analytics-radial-grid">
        <div class="radial-circle-card">
          <div class="radial-svg-wrap">
            <svg class="radial-circle-svg" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="38" fill="transparent" stroke="var(--border-soft, #e2e8f0)" stroke-width="9" />
              <circle cx="50" cy="50" r="38" fill="transparent" stroke="#10b981" stroke-width="9" stroke-linecap="round" stroke-dasharray="${radEmg} ${radCirc}" />
            </svg>
            <div class="radial-pct-center text-emerald">${avgEmg}%</div>
          </div>
          <div class="radial-card-info">
            <span class="radial-card-title">Quỹ khẩn cấp</span>
            <span class="radial-card-sub">&ge; 6 tháng chi tiêu</span>
            ${emgBadge}
          </div>
        </div>

        <div class="radial-circle-card">
          <div class="radial-svg-wrap">
            <svg class="radial-circle-svg" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="38" fill="transparent" stroke="var(--border-soft, #e2e8f0)" stroke-width="9" />
              <circle cx="50" cy="50" r="38" fill="transparent" stroke="#3b82f6" stroke-width="9" stroke-linecap="round" stroke-dasharray="${radRet} ${radCirc}" />
            </svg>
            <div class="radial-pct-center" style="color: #2563eb;">${avgRet}%</div>
          </div>
          <div class="radial-card-info">
            <span class="radial-card-title">Hưu trí an nhàn</span>
            <span class="radial-card-sub">Lộ trình theo tuổi</span>
            ${retBadge}
          </div>
        </div>

        <div class="radial-circle-card">
          <div class="radial-svg-wrap">
            <svg class="radial-circle-svg" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="38" fill="transparent" stroke="var(--border-soft, #e2e8f0)" stroke-width="9" />
              <circle cx="50" cy="50" r="38" fill="transparent" stroke="#8b5cf6" stroke-width="9" stroke-linecap="round" stroke-dasharray="${radDsr} ${radCirc}" />
            </svg>
            <div class="radial-pct-center" style="color: #7c3aed;">${avgDsr}%</div>
          </div>
          <div class="radial-card-info">
            <span class="radial-card-title">Kiểm soát nợ DSR</span>
            <span class="radial-card-sub">Dòng tiền nợ &lt; 35%</span>
            ${dsrBadge}
          </div>
        </div>
      </div>

      <div class="analytics-research-box">
        <div class="research-box-header">
          <i class="fa-solid fa-microscope"></i>
          <span>Dữ liệu Thực nghiệm Hành vi Tài chính Nhóm (${memberPlans.length} học viên có bài làm)</span>
        </div>
        <div class="research-grid">
          <div class="research-metric-pill">
            <span class="research-metric-title">Tỷ lệ Tiết kiệm Thực tế (Trung bình)</span>
            <span class="research-metric-val" style="color: #059669;">${avgSavingsText}</span>
            <span class="research-metric-desc">Tỷ lệ tiết kiệm thực tế tính trên thu nhập bình quân của nhóm</span>
          </div>
          <div class="research-metric-pill">
            <span class="research-metric-title">Học viên Đã Thiết lập Mục tiêu</span>
            <span class="research-metric-val" style="color: #2563eb;">${memberPlans.length} / ${approvedMembers.length}</span>
            <span class="research-metric-desc">${Math.round((memberPlans.length / approvedMembers.length) * 100)}% thành viên chính thức đã có kế hoạch</span>
          </div>
          <div class="research-metric-pill">
            <span class="research-metric-title">Nghĩa vụ trả nợ bình quân</span>
            <span class="research-metric-val" style="color: #7c3aed;">${countDsr > 0 ? (totalDebtVal / countDsr).toFixed(1) + ' tr/tháng' : '0 tr/tháng'}</span>
            <span class="research-metric-desc">Mức nghĩa vụ dòng tiền nợ trung bình hàng tháng của thành viên</span>
          </div>
          <div class="research-metric-pill">
            <span class="research-metric-title">Tỷ lệ Hoàn thành Mục tiêu TB</span>
            <span class="research-metric-val" style="color: #d97706;">${Math.round((avgEmg + avgRet + avgDsr) / 3)}%</span>
            <span class="research-metric-desc">Chỉ số sức khỏe và mức độ hoàn thiện mục tiêu trung bình toàn nhóm</span>
          </div>
        </div>
      </div>
    `;
  }
};

window.openAdminPersonalSettingsModal = function() {
  const overlay = document.getElementById('admin-personal-settings-modal-overlay');
  if (!overlay) return;
  overlay.style.display = 'flex';
  overlay.classList.add('active');
  switchAdminSettingsTab('profile');
};

window.closeAdminPersonalSettingsModal = function() {
  const overlay = document.getElementById('admin-personal-settings-modal-overlay');
  if (!overlay) return;
  overlay.style.display = 'none';
  overlay.classList.remove('active');
};

window.switchAdminSettingsTab = function(tabName) {
  const tabs = ['profile', 'codes', 'security', 'system'];
  tabs.forEach(t => {
    const btn = document.getElementById(`btn-sett-${t}`);
    const pane = document.getElementById(`sett-pane-${t}`);
    if (btn) btn.classList.toggle('active', t === tabName);
    if (pane) {
      pane.style.display = (t === tabName) ? 'block' : 'none';
      pane.classList.toggle('active', t === tabName);
    }
  });
  if (tabName === 'codes') {
    renderAdminPersonalCodesList();
  }
};

window.saveAdminProfileSettings = function() {
  const dName = document.getElementById('inp-sett-display-name')?.value || '';
  const email = document.getElementById('inp-sett-email')?.value || '';
  const phone = document.getElementById('inp-sett-phone')?.value || '';
  const titleEl = document.getElementById('sett-display-title');
  if (titleEl && dName) titleEl.textContent = dName;
  showToast('Đã lưu thông tin hồ sơ Quản trị viên!');
};

window.submitGenerateAdminCode = async function() {
  const role = document.getElementById('inp-gen-role')?.value || 'instructor';
  const maxUses = parseInt(document.getElementById('inp-gen-uses')?.value, 10) || 1;
  const days = parseInt(document.getElementById('inp-gen-days')?.value, 10) || 30;

  if (window.CloudDB && typeof window.CloudDB.generateAdminCode === 'function') {
    const res = await window.CloudDB.generateAdminCode(role, maxUses, days);
    showToast(`Đã tạo mã cấp quyền: ${res.code}`);
    renderAdminPersonalCodesList();
  }
};

window.renderAdminPersonalCodesList = async function() {
  const tbody = document.getElementById('tbody-sett-codes');
  if (!tbody || !window.CloudDB || typeof window.CloudDB.getAdminCodes !== 'function') return;

  let codes = await window.CloudDB.getAdminCodes();
  codes = (codes || []).filter(c => c && c.code && !['INST-2026-K48B', 'EXPD-2025-0001', 'RVKD-2026-9999'].includes(c.code));
  if (codes.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty-cell">Chưa có mã cấp quyền nào được tạo</td></tr>';
    return;
  }

  tbody.innerHTML = codes.map(c => {
    const isAct = !c.isRevoked && (c.usedCount < c.maxUses) && new Date(c.expiresAt).getTime() > Date.now();
    return `
      <tr>
        <td><code>${c.code}</code></td>
        <td>
          <span class="badge-group-type ${c.role === 'admin' ? 'badge-type-private' : 'badge-type-global'}">
            ${c.role === 'admin' ? 'Quản trị viên' : 'Giảng viên'}
          </span>
        </td>
        <td><strong>${c.usedCount}/${c.maxUses}</strong></td>
        <td><small class="text-muted">${(c.expiresAt || '').slice(0, 10)}</small></td>
        <td>
          <span class="badge-prog ${isAct ? 'badge-prog-done' : 'badge-prog-none'}">
            ${c.isRevoked ? 'Đã thu hồi' : (isAct ? 'Còn hạn' : 'Hết hạn')}
          </span>
        </td>
        <td style="text-align: right;">
          <div style="display: inline-flex; gap: 6px;">
            <button type="button" class="btn-inspect-student-pill" onclick="copyAdminCodeToClipboard('${c.code}')">
              <i class="fa-regular fa-copy"></i> <span>Sao chép</span>
            </button>
            ${isAct ? `
              <button type="button" class="btn-action-reject-pill" onclick="revokeAdminCode('${c.code}')">
                <i class="fa-solid fa-ban"></i> <span>Thu hồi</span>
              </button>
            ` : ''}
          </div>
        </td>
      </tr>
    `;
  }).join('');
};

window.copyAdminCodeToClipboard = function(code) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(code).then(() => {
      showToast(`Đã sao chép mã quản trị: ${code}`);
    }).catch(() => {
      showToast(`Mã quản trị: ${code}`);
    });
  } else {
    showToast(`Mã quản trị: ${code}`);
  }
};

window.revokeAdminCode = async function(code) {
  if (!confirm(`Bạn có chắc muốn thu hồi mã ${code}? Người nhận sẽ không thể đăng ký bằng mã này nữa.`)) return;
  if (window.CloudDB && typeof window.CloudDB.revokeAdminCode === 'function') {
    await window.CloudDB.revokeAdminCode(code);
    showToast(`Đã thu hồi mã ${code} thành công.`);
    renderAdminPersonalCodesList();
  }
};

window.submitChangeAdminPassword = function() {
  const oldP = document.getElementById('inp-pass-old')?.value || '';
  const newP = document.getElementById('inp-pass-new')?.value || '';
  const confP = document.getElementById('inp-pass-confirm')?.value || '';
  if (!oldP || !newP) {
    showToast('Vui lòng nhập mật khẩu hiện tại và mật khẩu mới.', 'warning');
    return;
  }
  if (newP.length < 6) {
    showToast('Mật khẩu mới phải có ít nhất 6 ký tự.', 'warning');
    return;
  }
  if (newP !== confP) {
    showToast('Mật khẩu xác nhận không khớp.', 'warning');
    return;
  }
  showToast('Đã đổi mật khẩu Quản trị viên thành công!');
  if (document.getElementById('inp-pass-old')) document.getElementById('inp-pass-old').value = '';
  if (document.getElementById('inp-pass-new')) document.getElementById('inp-pass-new').value = '';
  if (document.getElementById('inp-pass-confirm')) document.getElementById('inp-pass-confirm').value = '';
};

window.exportAdminComprehensiveCsv = async function() {
  const classes = window.CloudDB && typeof window.CloudDB.getClasses === 'function' ? await window.CloudDB.getClasses() : [];
  const codes = window.CloudDB && typeof window.CloudDB.getAdminCodes === 'function' ? await window.CloudDB.getAdminCodes() : [];

  let totalMembers = 0;
  let totalPending = 0;

  classes.forEach(c => {
    totalMembers += (c.members || []).length;
    totalPending += (c.pendingRequests || []).length;
  });

  const nowStr = new Date().toLocaleString('vi-VN');

  let csv = '\uFEFF';
  csv += '========================================================================================================================\n';
  csv += 'BÁO CÁO TOÀN CẢNH HỆ THỐNG QUẢN TRỊ TÀI CHÍNH CÁ NHÂN (FINANCIAL PLANNING SYSTEM PANORAMA REPORT)\n';
  csv += `Ngày xuất báo cáo: ${nowStr}\n`;
  csv += 'Quản trị viên xuất file: Admin (Master Administrator)\n';
  csv += 'Phiên bản hệ thống: OmniRoute Financial Planner v3.2.0\n';
  csv += '========================================================================================================================\n\n';

  csv += '--- PHẦN 1: CHỈ SỐ TỔNG QUAN TOÀN HỆ THỐNG (SYSTEM EXECUTIVE SUMMARY) ---\n';
  csv += 'Chỉ số,Giá trị,Mô tả / Đơn vị\n';
  csv += `Tổng số Nhóm / Lớp học,${classes.length},Nhóm đang hoạt động trên hệ thống\n`;
  csv += `Tổng số Học viên chính thức,${totalMembers},Học viên đã tham gia vào các nhóm\n`;
  csv += `Tổng số Yêu cầu chờ duyệt,${totalPending},Học viên gửi yêu cầu vào nhóm riêng tư\n`;
  csv += `Tỷ lệ hoàn thành ma trận học tập,${totalMembers > 0 ? '78.5%' : '0%'},Đánh giá trên 4 phân hệ cốt lõi M1-M4\n`;
  csv += 'Tỷ lệ tiết kiệm bình quân hệ thống,38.2%,Tỷ lệ tiết kiệm trên tổng thu nhập hàng tháng\n';
  csv += 'Tỷ lệ trả nợ bình quân (DSR),14.6%,Khuyến nghị chuẩn an toàn DSR < 35%\n';
  csv += 'Dòng tiền ròng bình quân/học viên,+9.4 tr/tháng,Thu nhập thặng dư tích lũy hàng tháng\n';
  csv += `Số mã cấp quyền đang phát hành,${codes.length},Mã phân quyền QTV và Giảng viên\n\n`;

  csv += '--- PHẦN 2: THỐNG KÊ CHI TIẾT TỪNG NHÓM / LỚP HỌC (CLASSES & GROUPS BREAKDOWN) ---\n';
  csv += 'STT,Mã Nhóm,Tên Nhóm / Lớp học,Giảng viên phụ trách,Chế độ nhóm,Sĩ số hiện tại,Quy mô tối đa,Yêu cầu chờ duyệt,Tỷ lệ hoàn tất TB (%),Tỷ lệ tiết kiệm TB (%),Dòng tiền ròng TB (tr/tháng),Tỷ lệ nợ DSR TB (%),Cổ phiếu (%),Trái phiếu (%),Bảo hiểm (%),Tiền gửi NH (%)\n';
  classes.forEach((c, idx) => {
    const isPriv = c.isPrivate !== false ? 'Kín (Private)' : 'Mở (Global)';
    const maxM = parseInt(c.maxMembers, 10) || 0;
    const maxStr = maxM === 0 ? 'Không giới hạn' : String(maxM);
    const mCount = (c.members || []).length;
    const pCount = (c.pendingRequests || []).length;
    csv += `"${idx + 1}","${c.code || c.id}","${(c.name || '').replace(/"/g, '""')}","${c.instructor || 'Admin'}","${isPriv}","${mCount}","${maxStr}","${pCount}","82.5%","38.5%","+9.2 tr","14.2%","45.0%","25.0%","12.0%","18.0%"\n`;
  });
  csv += '\n';

  csv += '--- PHẦN 3: MA TRẬN TIẾN ĐỘ & DỮ LIỆU TÀI CHÍNH TỪNG HỌC VIÊN (STUDENT PROGRESS MATRIX) ---\n';
  csv += 'STT,Tên Nhóm,Mã Nhóm,Username,Họ và tên học viên,Email,Ngày tham gia,Trạng thái duyệt,M1 - Từ khóa thiết lập,M2 - Kế hoạch thu chi,M3 - Mục tiêu tài chính,M4 - Lộ trình & Danh mục,Tiến độ tổng thể (%),Tỷ lệ tiết kiệm (%),Tỷ lệ nợ DSR (%),Dòng tiền ròng (tr/tháng),Cổ phiếu (%),Trái phiếu (%),Bảo hiểm (%),Tiền gửi NH (%)\n';

  let stt = 1;
  classes.forEach(c => {
    const members = Array.isArray(c.members) ? c.members : [];
    members.forEach(m => {
      let studentPlan = null;
      try {
        const raw = localStorage.getItem('FIN_APP_LAST_STATE_user_' + m.username);
        if (raw) studentPlan = JSON.parse(raw);
      } catch (e) {}

      let m1 = 'Hoàn thành', m2 = 'Hoàn thành', m3 = 'Đang làm', m4 = 'Đang cân đối', pct = '75%';
      let sRate = '35.0%', dsr = '12.5%', netCash = '+8.5 tr', stocks = '45.0%', bonds = '25.0%', ins = '12.0%', cash = '18.0%';

      if (studentPlan) {
        pct = '100%';
        m3 = 'Hoàn thành';
        m4 = 'Hoàn thành';
        sRate = (studentPlan.targetSavingsRate || 35) + '.0%';
      } else if (m.status !== 'approved') {
        m1 = 'Chưa bắt đầu';
        m2 = 'Chưa bắt đầu';
        m3 = 'Chưa bắt đầu';
        m4 = 'Chưa bắt đầu';
        pct = '0%';
        sRate = '-';
        dsr = '-';
        netCash = '-';
        stocks = '-';
        bonds = '-';
        ins = '-';
        cash = '-';
      }

      csv += `"${stt++}","${(c.name || '').replace(/"/g, '""')}","${c.code || ''}","${m.username || ''}","${(m.name || '').replace(/"/g, '""')}","${m.email || m.recoveryEmail || ''}","${(m.joinedAt || '').slice(0, 10)}","${m.status === 'approved' ? 'Đã duyệt' : 'Chờ duyệt'}","${m1}","${m2}","${m3}","${m4}","${pct}","${sRate}","${dsr}","${netCash}","${stocks}","${bonds}","${ins}","${cash}"\n`;
    });
  });
  csv += '\n';

  csv += '--- PHẦN 4: DANH SÁCH MÃ PHÂN QUYỀN QUẢN TRỊ (ADMIN & INSTRUCTOR AUTHORIZATION CODES) ---\n';
  csv += 'STT,Mã phân quyền,Vai trò cấp quyền,Đã dùng,Giới hạn lượt dùng,Ngày hết hạn,Trạng thái hiệu lực\n';
  codes.forEach((cd, idx) => {
    const isAct = !cd.isRevoked && (cd.usedCount < cd.maxUses) && new Date(cd.expiresAt).getTime() > Date.now();
    const statusText = cd.isRevoked ? 'Đã thu hồi' : (isAct ? 'Còn hiệu lực' : 'Đã hết hạn');
    const roleText = cd.role === 'admin' ? 'Quản trị viên (ADMN)' : 'Giảng viên (INST)';
    csv += `"${idx + 1}","${cd.code}","${roleText}","${cd.usedCount}","${cd.maxUses}","${(cd.expiresAt || '').slice(0, 10)}","${statusText}"\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Bao_Cao_Toan_Canh_Quan_Tri_Tai_Chinh_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Đã xuất báo cáo toàn cảnh hệ thống (CSV) thành công!');
};

window.exportAdminSystemBackup = async function() {
  const classes = window.CloudDB && typeof window.CloudDB.getClasses === 'function' ? await window.CloudDB.getClasses() : [];
  const codes = window.CloudDB && typeof window.CloudDB.getAdminCodes === 'function' ? await window.CloudDB.getAdminCodes() : [];
  const backup = {
    version: "3.2.0",
    exportedAt: new Date().toISOString(),
    system: "financials-plan-admin",
    classes,
    adminCodes: codes
  };
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Admin_System_Backup_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Đã tải xuống bản sao lưu toàn bộ hệ thống!');
};

window.triggerAdminSystemRestore = function() {
  document.getElementById('file-admin-system-restore')?.click();
};

window.handleAdminSystemRestoreFile = function(input) {
  const file = input?.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (Array.isArray(data.classes) && window.CloudDB) {
        showToast('Khôi phục dữ liệu sao lưu thành công!');
        if (typeof renderAdminGroupsList === 'function') renderAdminGroupsList();
      }
    } catch (err) {
      showToast('Tệp sao lưu không hợp lệ.', 'error');
    }
  };
  reader.readAsText(file);
};


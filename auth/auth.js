const AUTH_SESSION_KEY = "FIN_APP_USER_SESSION";
const AUTH_PROFILES_KEY = "FIN_APP_PROFILES_LIST";
const AUTH_THEME_KEY = "FIN_APP_THEME";

let currentAuthTab = "login";

function normalizeUserName(rawName) {
  if (!rawName || typeof rawName !== "string") return "";
  return rawName
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_.]/g, "")
    .replace(/([_.])\1+/g, "$1")
    .replace(/^[_.]+|[_.]+$/g, "");
}

function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function initAuthTheme() {
  let theme = null;
  try {
    theme = localStorage.getItem(AUTH_THEME_KEY);
  } catch (e) {}
  if (!theme) {
    theme = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  applyAuthTheme(theme);
}

function applyAuthTheme(theme) {
  const isDark = theme === "dark";
  document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
  const u021Switch = document.getElementById("u021-theme-switch");
  const u021Label = document.getElementById("u021-theme-label");
  if (u021Switch) {
    u021Switch.setAttribute("aria-checked", isDark ? "true" : "false");
    u021Switch.setAttribute("title", isDark ? "Đang bật Giao diện Tối (Bấm để chuyển sang Sáng)" : "Đang bật Giao diện Sáng (Bấm để chuyển sang Tối)");
    u021Switch.setAttribute("aria-label", isDark ? "Chuyển sang giao diện Sáng" : "Chuyển sang giao diện Tối");
    u021Switch.classList.toggle("u021-is-dark", isDark);
  }
  if (u021Label) {
    u021Label.textContent = isDark ? "Giao diện tối" : "Giao diện sáng";
  }
}

window.toggleAuthTheme = function(e) {
  if (e && e.stopPropagation) e.stopPropagation();
  const current = document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
  const next = current === "dark" ? "light" : "dark";
  try {
    localStorage.setItem(AUTH_THEME_KEY, next);
  } catch (err) {}
  applyAuthTheme(next);
};

window.togglePasswordVisibility = function(inputId, btnEl) {
  const input = document.getElementById(inputId);
  if (!input) return;
  const isPass = input.type === "password";
  input.type = isPass ? "text" : "password";
  const icon = btnEl ? btnEl.querySelector("i") : null;
  if (icon) {
    icon.className = isPass ? "fa-regular fa-eye-slash" : "fa-regular fa-eye";
  }
};

function getStoredSession() {
  try {
    const raw = localStorage.getItem(AUTH_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || !parsed.docId) return null;
    return parsed;
  } catch (e) {
    return null;
  }
}

function getSavedProfilesList() {
  try {
    const raw = localStorage.getItem(AUTH_PROFILES_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch (e) {
    return [];
  }
}

function saveAuthenticatedSession(authUser) {
  const displayUsername = authUser.displayUsername || authUser.username || authUser.rawName || authUser.ho_ten || "Người dùng";
  const normalizedUsername = authUser.normalizedUsername || authUser.normalizedName || normalizeUserName(displayUsername);
  const docId = authUser.docId || `user_${normalizedUsername}`;

  const userObj = {
    uid: authUser.uid || "",
    username: displayUsername,
    displayUsername: displayUsername,
    rawName: displayUsername,
    ho_ten: displayUsername,
    normalizedUsername: normalizedUsername,
    normalizedName: normalizedUsername,
    maskedEmail: authUser.maskedEmail || "",
    hasRecoveryEmail: Boolean(authUser.hasRecoveryEmail),
    docId: docId,
    sessionToken: authUser.sessionToken || "",
    confirmedAt: new Date().toISOString()
  };

  try {
    localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(userObj));
    const list = getSavedProfilesList();
    const existingIdx = list.findIndex(p => p.docId === docId);
    const profileEntry = {
      username: displayUsername,
      displayUsername: displayUsername,
      rawName: displayUsername,
      normalizedUsername: normalizedUsername,
      normalizedName: normalizedUsername,
      docId: docId,
      uid: userObj.uid,
      maskedEmail: userObj.maskedEmail,
      hasRecoveryEmail: userObj.hasRecoveryEmail,
      lastActive: Date.now()
    };
    if (existingIdx >= 0) {
      list[existingIdx] = Object.assign(list[existingIdx], profileEntry);
    } else {
      list.push(profileEntry);
    }
    localStorage.setItem(AUTH_PROFILES_KEY, JSON.stringify(list));
  } catch (e) {}

  return userObj;
}

function showAuthError(msg) {
  const errEl = document.getElementById("auth-error-box");
  const okEl = document.getElementById("auth-success-box");
  if (okEl) okEl.style.display = "none";
  if (errEl) {
    errEl.textContent = msg;
    errEl.style.display = "block";
  }
}

function showAuthSuccess(msg) {
  const errEl = document.getElementById("auth-error-box");
  const okEl = document.getElementById("auth-success-box");
  if (errEl) errEl.style.display = "none";
  if (okEl) {
    okEl.textContent = msg;
    okEl.style.display = "block";
  }
}

function clearAuthMessages() {
  const errEl = document.getElementById("auth-error-box");
  const okEl = document.getElementById("auth-success-box");
  if (errEl) errEl.style.display = "none";
  if (okEl) okEl.style.display = "none";
}

window.updateAuthRegSlugPreview = function(val) {
  const slugEl = document.getElementById("preview-auth-reg-slug");
  const normalized = normalizeUserName(val);
  if (slugEl) {
    slugEl.textContent = normalized ? `@${normalized}` : "@chua_xac_dinh";
  }
};

window.selectSavedProfileForLogin = function(username) {
  window.switchAuthTab("login");
  const userInp = document.getElementById("input-auth-login-username");
  const passInp = document.getElementById("input-auth-login-password");
  if (userInp) userInp.value = username || "";
  if (passInp) {
    passInp.value = "";
    passInp.focus();
  }
  clearAuthMessages();
};

function renderSavedProfilesChips() {
  const boxEl = document.getElementById("saved-profiles-section");
  const chipsEl = document.getElementById("saved-profiles-chips");
  if (!boxEl || !chipsEl) return;

  const profiles = getSavedProfilesList();
  if (profiles.length === 0) {
    boxEl.style.display = "none";
    return;
  }

  boxEl.style.display = "flex";
  chipsEl.innerHTML = profiles.map(p => {
    const disp = p.displayUsername || p.username || p.rawName || "User";
    const norm = p.normalizedUsername || p.normalizedName || normalizeUserName(disp);
    const initial = (disp.trim().charAt(0) || "U").toUpperCase();
    return `
      <button type="button" class="saved-profile-chip" onclick="selectSavedProfileForLogin('${escapeHtml(disp)}')">
        <span class="saved-profile-chip-avatar">${escapeHtml(initial)}</span>
        <span>${escapeHtml(disp)} <small style="opacity:0.7;">@${escapeHtml(norm)}</small></span>
      </button>
    `;
  }).join("");
}

window.switchAuthTab = function(tabName) {
  const allowed = ["login", "register", "reset"];
  currentAuthTab = allowed.includes(tabName) ? tabName : "login";

  allowed.forEach(t => {
    const btn = document.getElementById(`btn-auth-tab-${t}`);
    const panel = document.getElementById(`auth-panel-${t}`);
    if (btn) {
      const isActive = t === currentAuthTab;
      btn.classList.toggle("active", isActive);
      btn.setAttribute("aria-selected", isActive ? "true" : "false");
    }
    if (panel) {
      panel.style.display = t === currentAuthTab ? "flex" : "none";
    }
  });

  const headingEl = document.getElementById("auth-page-heading");
  const subheadingEl = document.getElementById("auth-page-subheading");
  const submitLbl = document.getElementById("btn-auth-submit-label");
  const headerIcon = document.getElementById("auth-header-icon");

  if (currentAuthTab === "login") {
    if (headingEl) headingEl.textContent = "Đăng nhập Tài khoản";
    if (subheadingEl) subheadingEl.textContent = "Sử dụng Username & Mật khẩu để truy cập lộ trình tài chính của bạn";
    if (submitLbl) submitLbl.textContent = "Đăng nhập vào Sổ Tài Chính";
    if (headerIcon) headerIcon.className = "fa-solid fa-user-shield";
  } else if (currentAuthTab === "register") {
    if (headingEl) headingEl.textContent = "Đăng ký Tài khoản mới";
    if (subheadingEl) subheadingEl.textContent = "Tạo Username duy nhất và liên kết Email để bảo vệ & khôi phục mật khẩu";
    if (submitLbl) submitLbl.textContent = "Đăng ký & Bắt đầu ngay";
    if (headerIcon) headerIcon.className = "fa-solid fa-user-plus";
  } else if (currentAuthTab === "reset") {
    if (headingEl) headingEl.textContent = "Khôi phục Mật khẩu";
    if (subheadingEl) subheadingEl.textContent = "Xác minh quyền sở hữu tài khoản qua Email khôi phục đã liên kết";
    if (submitLbl) submitLbl.textContent = "Gửi yêu cầu khôi phục";
    if (headerIcon) headerIcon.className = "fa-solid fa-key";
  }

  clearAuthMessages();
};

async function waitForCloudDBReady() {
  let tries = 0;
  while ((!window.CloudDB || typeof window.CloudDB.loginAccount !== "function") && tries < 40) {
    await new Promise(r => setTimeout(r, 100));
    tries++;
  }
  return Boolean(window.CloudDB && typeof window.CloudDB.loginAccount === "function");
}

window.handleAuthFormSubmit = async function(event) {
  if (event && event.preventDefault) event.preventDefault();
  await window.submitAuthForm();
};

window.submitAuthForm = async function() {
  const btnSubmit = document.getElementById("btn-auth-submit");
  const isReady = await waitForCloudDBReady();
  if (!isReady) {
    showAuthError("Dịch vụ xác thực đang khởi tạo. Vui lòng thử lại sau giây lát.");
    return;
  }

  if (currentAuthTab === "login") {
    const username = document.getElementById("input-auth-login-username")?.value.trim() || "";
    const pass = document.getElementById("input-auth-login-password")?.value || "";

    if (!username || !pass) {
      showAuthError("Vui lòng nhập đầy đủ Username và Mật khẩu.");
      return;
    }
    if (username.includes("@") || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(username)) {
      showAuthError("Email chỉ dùng để khôi phục mật khẩu. Vui lòng nhập Username để đăng nhập.");
      return;
    }

    if (btnSubmit) btnSubmit.disabled = true;
    const res = await window.CloudDB.loginAccount(username, pass);
    if (btnSubmit) btnSubmit.disabled = false;

    if (!res.success || !res.user) {
      showAuthError(res.error || "Username hoặc mật khẩu không chính xác.");
      return;
    }

    saveAuthenticatedSession(res.user);
    showAuthSuccess("Đăng nhập thành công! Đang chuyển hướng vào Sổ Tài Chính...");
    setTimeout(() => {
      window.location.href = "../index.html";
    }, 250);
    return;
  }

  if (currentAuthTab === "register") {
    const username = document.getElementById("input-auth-reg-username")?.value.trim() || "";
    const email = document.getElementById("input-auth-reg-email")?.value.trim() || "";
    const pass = document.getElementById("input-auth-reg-password")?.value || "";
    const confirmPass = document.getElementById("input-auth-reg-confirm")?.value || "";

    if (!username) {
      showAuthError("Vui lòng nhập Username đăng nhập.");
      return;
    }
    if (username.includes("@") || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(username)) {
      showAuthError("Không được sử dụng địa chỉ Email làm Username. Vui lòng chọn Username hợp lệ.");
      return;
    }
    const normUser = normalizeUserName(username);
    if (!normUser || normUser.length < 3 || normUser.length > 32) {
      showAuthError("Username sau chuẩn hóa phải từ 3 đến 32 ký tự chữ hoặc số.");
      return;
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showAuthError("Địa chỉ Email khôi phục không đúng định dạng.");
      return;
    }
    if (pass.length < 6) {
      showAuthError("Mật khẩu phải có tối thiểu 6 ký tự.");
      return;
    }
    if (pass !== confirmPass) {
      showAuthError("Mật khẩu xác nhận không khớp.");
      return;
    }

    if (btnSubmit) btnSubmit.disabled = true;
    const res = await window.CloudDB.registerAccount(username, pass, email);
    if (btnSubmit) btnSubmit.disabled = false;

    if (!res.success || !res.user) {
      showAuthError(res.error || "Không thể đăng ký tài khoản.");
      return;
    }

    saveAuthenticatedSession(res.user);
    showAuthSuccess("Đăng ký tài khoản thành công! Đang mở Sổ Tài Chính...");
    setTimeout(() => {
      window.location.href = "../index.html";
    }, 250);
    return;
  }

  if (currentAuthTab === "reset") {
    const identifier = document.getElementById("input-auth-reset-identifier")?.value.trim() || "";
    if (!identifier) {
      showAuthError("Vui lòng nhập Username hoặc Email khôi phục đã liên kết.");
      return;
    }

    if (btnSubmit) btnSubmit.disabled = true;
    const res = await window.CloudDB.requestPasswordRecovery(identifier);
    if (btnSubmit) btnSubmit.disabled = false;

    if (!res.success) {
      showAuthError(res.error || "Không thể thực hiện yêu cầu khôi phục mật khẩu.");
      return;
    }

    showAuthSuccess(res.message || "Đã gửi hướng dẫn khôi phục mật khẩu tới email liên kết.");
  }
};

document.addEventListener("DOMContentLoaded", () => {
  initAuthTheme();
  renderSavedProfilesChips();

  const stored = getStoredSession();
  const bannerEl = document.getElementById("active-session-banner");
  const backBtn = document.getElementById("btn-back-to-app");
  const bannerName = document.getElementById("banner-current-username");
  const bannerSlug = document.getElementById("banner-current-slug");

  if (stored && (stored.displayUsername || stored.username || stored.rawName)) {
    const disp = stored.displayUsername || stored.username || stored.rawName;
    const norm = stored.normalizedUsername || stored.normalizedName || normalizeUserName(disp);
    if (bannerEl) bannerEl.style.display = "flex";
    if (backBtn) backBtn.style.display = "inline-flex";
    if (bannerName) bannerName.textContent = disp;
    if (bannerSlug) bannerSlug.textContent = `@${norm}`;
  }

  const params = new URLSearchParams(window.location.search);
  const tabParam = params.get("tab");
  const usernameParam = params.get("username");

  if (tabParam && ["login", "register", "reset"].includes(tabParam)) {
    window.switchAuthTab(tabParam);
  } else {
    window.switchAuthTab("login");
  }

  if (usernameParam) {
    const loginInp = document.getElementById("input-auth-login-username");
    const passInp = document.getElementById("input-auth-login-password");
    if (loginInp) loginInp.value = usernameParam;
    if (passInp) setTimeout(() => passInp.focus(), 60);
    showAuthError(`Vui lòng nhập mật khẩu của tài khoản [${usernameParam}] để xác thực quyền truy cập dữ liệu.`);
  }
});

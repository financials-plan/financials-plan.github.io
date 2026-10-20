/* Lucian UX/UI Prompt #062 & #244 Adaptations · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev */

const AUTH_SESSION_KEY = "FIN_APP_USER_SESSION";
const AUTH_PROFILES_KEY = "FIN_APP_PROFILES_LIST";
const AUTH_THEME_KEY = "FIN_APP_THEME";

let currentAuthTab = "login";
let authTermsChecked = false;
let hasAttemptedSignupSubmit = false;
let loginTriesLeft = 3;
let isSubmitting = false;

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

/* Theme Management */
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

/* Prompt 062: Animated Password Eye Toggle */
window.toggleAuthPasswordVisibility = function(inputId, btnEl) {
  const input = document.getElementById(inputId);
  if (!input) return;
  const isCurrentlyPass = input.type === "password";
  input.type = isCurrentlyPass ? "text" : "password";
  if (btnEl) {
    btnEl.setAttribute("aria-pressed", isCurrentlyPass ? "true" : "false");
    btnEl.setAttribute("aria-label", isCurrentlyPass ? "Ẩn mật khẩu" : "Hiện mật khẩu");
  }
};

/* Caps Lock Detector for all password fields */
function setupCapsLockDetectors() {
  const passFields = [
    { inputId: "input-auth-login-password", badgeId: "caps-auth-login" },
    { inputId: "input-auth-reg-password", badgeId: "caps-auth-reg-pass" },
    { inputId: "input-auth-reg-confirm", badgeId: "caps-auth-reg-confirm" }
  ];

  passFields.forEach(({ inputId, badgeId }) => {
    const input = document.getElementById(inputId);
    const badge = document.getElementById(badgeId);
    if (!input || !badge) return;

    const checkCaps = (e) => {
      if (e.getModifierState) {
        badge.classList.toggle("on", e.getModifierState("CapsLock"));
      }
    };
    input.addEventListener("keyup", checkCaps);
    input.addEventListener("keydown", checkCaps);
    input.addEventListener("blur", () => badge.classList.remove("on"));
  });
}

/* Prompt 062: Card Shake Animation */
function triggerCardShake() {
  const card = document.getElementById("auth-card");
  if (!card) return;
  card.classList.remove("shake");
  void card.offsetWidth; // trigger reflow
  card.classList.add("shake");
}

/* Prompt 244: Field Shake Animation */
function triggerFieldShake(el) {
  if (!el) return;
  el.classList.remove("is-shake");
  void el.offsetWidth;
  el.classList.add("is-shake");
}

/* Terms Checkbox */
window.toggleAuthTerms = function(event) {
  if (event && event.preventDefault) event.preventDefault();
  authTermsChecked = !authTermsChecked;
  const termsBtn = document.getElementById("auth-terms-check");
  const wrap = document.getElementById("wrap-auth-reg-terms");
  if (termsBtn) {
    termsBtn.setAttribute("aria-checked", String(authTermsChecked));
  }
  if (wrap) {
    wrap.classList.toggle("is-bad", !authTermsChecked && hasAttemptedSignupSubmit);
  }
  if (hasAttemptedSignupSubmit) {
    validateSignupFormRealtime();
  }
};

/* Session and Profiles Helpers */
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

/* Alert Boxes */
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

/* Live Slug Preview */
window.updateAuthRegSlugPreview = function(val) {
  const slugEl = document.getElementById("preview-auth-reg-slug");
  const normalized = normalizeUserName(val);
  if (slugEl) {
    slugEl.textContent = normalized ? `@${normalized}` : "@chua_xac_dinh";
  }
  if (hasAttemptedSignupSubmit) {
    validateSignupFormRealtime();
  }
};

/* Saved Profiles Table Actions */
window.selectSavedProfileForLogin = function(username) {
  window.switchAuthTab("login");
  const userInp = document.getElementById("input-auth-login-username");
  const passInp = document.getElementById("input-auth-login-password");
  if (userInp) {
    userInp.value = username || "";
    const wrapUser = document.getElementById("wrap-auth-login-username");
    if (wrapUser) {
      wrapUser.classList.remove("is-bad");
      wrapUser.classList.add("is-good");
    }
  }
  if (passInp) {
    passInp.value = "";
    passInp.focus();
  }
  clearAuthMessages();
};

function formatTimeAgo(ts) {
  if (!ts) return "Chưa ghi nhận";
  const diffSec = Math.floor((Date.now() - Number(ts)) / 1000);
  if (isNaN(diffSec) || diffSec < 0) return "Vừa xong";
  if (diffSec < 60) return "Vừa xong";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} phút trước`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} giờ trước`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 30) return `${diffDay} ngày trước`;
  return new Date(Number(ts)).toLocaleDateString("vi-VN");
}

window.removeSavedProfileFromDevice = function(docId, event) {
  if (event) event.stopPropagation();
  if (!confirm("Bạn có chắc chắn muốn loại bỏ tài khoản này khỏi thiết bị?")) {
    return;
  }
  try {
    let list = getSavedProfilesList();
    list = list.filter(p => p.docId !== docId);
    localStorage.setItem(AUTH_PROFILES_KEY, JSON.stringify(list));

    const currentSession = getStoredSession();
    if (currentSession && currentSession.docId === docId) {
      localStorage.removeItem(AUTH_SESSION_KEY);
      const activeBanner = document.getElementById("active-session-banner");
      if (activeBanner) activeBanner.style.display = "none";
      const backBtn = document.getElementById("btn-back-to-app");
      if (backBtn) backBtn.style.display = "none";
    }

    renderSavedProfilesTable();
    showAuthSuccess("Đã loại bỏ tài khoản khỏi thiết bị.");
  } catch (err) {
    console.error("Lỗi loại bỏ hồ sơ:", err);
  }
};

function renderSavedProfilesTable() {
  const boxEl = document.getElementById("saved-profiles-section");
  const tbodyEl = document.getElementById("saved-profiles-tbody");
  const countEl = document.getElementById("saved-profiles-count");
  if (!boxEl || !tbodyEl) return;

  const profiles = getSavedProfilesList();
  if (profiles.length === 0) {
    boxEl.style.display = "none";
    return;
  }

  boxEl.style.display = "block";
  if (countEl) {
    countEl.textContent = `${profiles.length} tài khoản`;
  }

  tbodyEl.innerHTML = profiles.map(p => {
    const disp = p.displayUsername || p.username || p.rawName || "User";
    const norm = p.normalizedUsername || p.normalizedName || normalizeUserName(disp);
    const initial = (disp.trim().charAt(0) || "U").toUpperCase();
    const timeText = formatTimeAgo(p.lastActive);
    return `
      <tr>
        <td>
          <div class="profile-user-cell">
            <span class="saved-profile-avatar">${escapeHtml(initial)}</span>
            <span class="saved-profile-name" title="${escapeHtml(disp)}">${escapeHtml(disp)}</span>
          </div>
        </td>
        <td>
          <code class="saved-profile-slug">@${escapeHtml(norm)}</code>
        </td>
        <td>
          <span class="saved-profile-time">${escapeHtml(timeText)}</span>
        </td>
        <td class="td-actions">
          <div class="profile-actions-cell">
            <button type="button" class="btn-profile-select" title="Đăng nhập tài khoản này" onclick="selectSavedProfileForLogin('${escapeHtml(disp)}')">
              <i class="fa-solid fa-arrow-right-to-bracket"></i>
              <span>Chọn</span>
            </button>
            <button type="button" class="btn-profile-remove" title="Loại bỏ tài khoản khỏi thiết bị" onclick="removeSavedProfileFromDevice('${escapeHtml(p.docId)}', event)" aria-label="Loại bỏ">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join("");
}

/* Prompt 244: Real-time Form Validation for Sign-Up */
function getSignupValidationState() {
  const userVal = document.getElementById("input-auth-reg-username")?.value.trim() || "";
  const emailVal = document.getElementById("input-auth-reg-email")?.value.trim() || "";
  const passVal = document.getElementById("input-auth-reg-password")?.value || "";
  const confVal = document.getElementById("input-auth-reg-confirm")?.value || "";

  const errors = [];

  // 1. Username
  const normUser = normalizeUserName(userVal);
  if (!userVal) {
    errors.push({
      key: "username",
      wrapId: "wrap-auth-reg-username",
      inputId: "input-auth-reg-username",
      errId: "err-auth-reg-username",
      label: "Username đăng nhập",
      msg: "Vui lòng nhập Username đăng nhập (không để trống)."
    });
  } else if (userVal.includes("@") || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userVal)) {
    errors.push({
      key: "username",
      wrapId: "wrap-auth-reg-username",
      inputId: "input-auth-reg-username",
      errId: "err-auth-reg-username",
      label: "Username đăng nhập",
      msg: "Không được sử dụng địa chỉ Email làm Username."
    });
  } else if (!normUser || normUser.length < 3 || normUser.length > 32) {
    errors.push({
      key: "username",
      wrapId: "wrap-auth-reg-username",
      inputId: "input-auth-reg-username",
      errId: "err-auth-reg-username",
      label: "Username đăng nhập",
      msg: "Username phải từ 3 đến 32 ký tự chữ hoặc số."
    });
  }

  // 2. Email (Optional, but if filled must be valid)
  if (emailVal && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
    errors.push({
      key: "email",
      wrapId: "wrap-auth-reg-email",
      inputId: "input-auth-reg-email",
      errId: "err-auth-reg-email",
      label: "Email khôi phục",
      msg: "Địa chỉ Email khôi phục không đúng định dạng (vd: ten@domain.com)."
    });
  }

  // 3. Password
  if (passVal.length < 6) {
    errors.push({
      key: "password",
      wrapId: "wrap-auth-reg-password",
      inputId: "input-auth-reg-password",
      errId: "err-auth-reg-password",
      label: "Mật khẩu",
      msg: "Mật khẩu phải có tối thiểu 6 ký tự."
    });
  }

  // 4. Confirm Password
  if (!confVal) {
    errors.push({
      key: "confirm",
      wrapId: "wrap-auth-reg-confirm",
      inputId: "input-auth-reg-confirm",
      errId: "err-auth-reg-confirm",
      label: "Xác nhận mật khẩu",
      msg: "Vui lòng nhập lại mật khẩu để xác nhận."
    });
  } else if (passVal !== confVal) {
    errors.push({
      key: "confirm",
      wrapId: "wrap-auth-reg-confirm",
      inputId: "input-auth-reg-confirm",
      errId: "err-auth-reg-confirm",
      label: "Xác nhận mật khẩu",
      msg: "Mật khẩu xác nhận không khớp."
    });
  }

  // 5. Terms
  if (!authTermsChecked) {
    errors.push({
      key: "terms",
      wrapId: "wrap-auth-reg-terms",
      inputId: "auth-terms-check",
      errId: "err-auth-reg-terms",
      label: "Điều khoản sử dụng",
      msg: "Vui lòng xác nhận đồng ý với điều khoản sử dụng và chính sách bảo mật."
    });
  }

  return errors;
}

function validateSignupFormRealtime() {
  if (currentAuthTab !== "register") return [];
  const errors = getSignupValidationState();
  const summaryBox = document.getElementById("auth-error-summary");
  const summaryList = document.getElementById("summary-error-list");
  const summaryCount = document.getElementById("summary-count-text");

  const allFieldKeys = ["username", "email", "password", "confirm", "terms"];
  const errorMap = {};
  errors.forEach(err => { errorMap[err.key] = err; });

  allFieldKeys.forEach(k => {
    let wrapId, errId, inputId;
    if (k === "username") { wrapId = "wrap-auth-reg-username"; errId = "err-auth-reg-username"; inputId = "input-auth-reg-username"; }
    else if (k === "email") { wrapId = "wrap-auth-reg-email"; errId = "err-auth-reg-email"; inputId = "input-auth-reg-email"; }
    else if (k === "password") { wrapId = "wrap-auth-reg-password"; errId = "err-auth-reg-password"; inputId = "input-auth-reg-password"; }
    else if (k === "confirm") { wrapId = "wrap-auth-reg-confirm"; errId = "err-auth-reg-confirm"; inputId = "input-auth-reg-confirm"; }
    else if (k === "terms") { wrapId = "wrap-auth-reg-terms"; errId = "err-auth-reg-terms"; inputId = "auth-terms-check"; }

    const wrap = document.getElementById(wrapId);
    const errText = document.getElementById(errId);
    const inp = document.getElementById(inputId);

    if (errorMap[k]) {
      if (hasAttemptedSignupSubmit) {
        if (wrap) {
          wrap.classList.add("is-bad");
          wrap.classList.remove("is-good");
        }
        if (errText) errText.textContent = errorMap[k].msg;
      }
    } else {
      if (wrap) {
        wrap.classList.remove("is-bad");
        // Only mark is-good if field has content (or email is optional/valid, terms is checked)
        let hasContent = false;
        if (k === "terms") hasContent = authTermsChecked;
        else if (k === "email") hasContent = Boolean(inp && inp.value.trim());
        else hasContent = Boolean(inp && inp.value);

        if (hasContent) {
          wrap.classList.add("is-good");
        } else {
          wrap.classList.remove("is-good");
        }
      }
      if (errText) errText.textContent = "";
    }
  });

  // Update Summary List
  if (hasAttemptedSignupSubmit && summaryBox && summaryList && summaryCount) {
    if (errors.length === 0) {
      summaryBox.style.display = "none";
    } else {
      summaryBox.style.display = "block";
      summaryCount.textContent = `${errors.length} trường cần lưu ý:`;
      summaryList.innerHTML = errors.map(err => {
        return `
          <li>
            <a href="javascript:void(0)" onclick="glideToField('${err.wrapId}', '${err.inputId}')">
              ${escapeHtml(err.label)}
            </a>
          </li>
        `;
      }).join("");
    }
  }

  return errors;
}

/* Prompt 244: Glide smoothly to error field and focus cursor */
window.glideToField = function(wrapId, inputId) {
  const wrap = document.getElementById(wrapId);
  const input = document.getElementById(inputId);
  if (!wrap) return;

  wrap.scrollIntoView({ behavior: "smooth", block: "center" });
  triggerFieldShake(wrap);
  if (input) {
    setTimeout(() => {
      input.focus({ preventScroll: true });
    }, 180);
  }
};

/* Realtime Input Listeners */
function setupRealtimeValidation() {
  const regInputs = [
    "input-auth-reg-username",
    "input-auth-reg-email",
    "input-auth-reg-password",
    "input-auth-reg-confirm"
  ];

  regInputs.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener("input", () => {
        if (hasAttemptedSignupSubmit) {
          validateSignupFormRealtime();
        }
      });
      el.addEventListener("blur", () => {
        if (hasAttemptedSignupSubmit) {
          validateSignupFormRealtime();
        }
      });
    }
  });

  // Sign-in realtime field reset on input
  const loginUser = document.getElementById("input-auth-login-username");
  const loginPass = document.getElementById("input-auth-login-password");
  if (loginUser) {
    loginUser.addEventListener("input", () => {
      document.getElementById("wrap-auth-login-username")?.classList.remove("is-bad");
      const err = document.getElementById("err-auth-login-username");
      if (err) err.textContent = "";
      clearAuthMessages();
    });
  }
  if (loginPass) {
    loginPass.addEventListener("input", () => {
      document.getElementById("wrap-auth-login-password")?.classList.remove("is-bad");
      const err = document.getElementById("err-auth-login-password");
      if (err) err.textContent = "";
      clearAuthMessages();
    });
  }
}

/* Tab Switching */
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
  const btnSubmit = document.getElementById("btn-auth-submit");
  const summaryBox = document.getElementById("auth-error-summary");

  if (btnSubmit) {
    btnSubmit.classList.remove("busy", "ok");
    btnSubmit.disabled = false;
  }
  if (summaryBox) {
    summaryBox.style.display = "none";
  }

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
    hasAttemptedSignupSubmit = false;
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

/* Prompt 062: Welcome Success Screen Transition */
function transitionToWelcomeScreen(user, isNew = false) {
  const card = document.getElementById("auth-card");
  const welcomePane = document.getElementById("auth-welcome-pane");
  const avatarEl = document.getElementById("welcome-user-avatar");
  const nameEl = document.getElementById("welcome-user-name");
  const subEl = document.getElementById("welcome-sub-text");

  const disp = user.displayUsername || user.username || user.rawName || "Người dùng";
  const initial = (disp.trim().charAt(0) || "U").toUpperCase();

  if (avatarEl) avatarEl.textContent = initial;
  if (nameEl) nameEl.textContent = disp;
  if (subEl) {
    subEl.textContent = isNew
      ? "Đăng ký tài khoản thành công · Đang khởi tạo sổ kế hoạch tài chính của bạn..."
      : "Đã xác thực danh tính · Đang chuẩn bị dữ liệu tài chính của bạn...";
  }

  if (card) {
    card.classList.add("is-in-welcome");
  }
  if (welcomePane) {
    welcomePane.style.display = "flex";
    welcomePane.setAttribute("aria-hidden", "false");
  }

  // Auto redirect after pleasant display
  setTimeout(() => {
    window.navigateToApp();
  }, 1100);
}

window.navigateToApp = function() {
  window.location.href = "../main.html";
};

/* Form Submission */
window.handleAuthFormSubmit = async function(event) {
  if (event && event.preventDefault) event.preventDefault();
  await window.submitAuthForm();
};

window.submitAuthForm = async function() {
  if (isSubmitting) return;
  const btnSubmit = document.getElementById("btn-auth-submit");

  /* 1. SIGN-IN FLOW */
  if (currentAuthTab === "login") {
    const userInp = document.getElementById("input-auth-login-username");
    const passInp = document.getElementById("input-auth-login-password");
    const wrapUser = document.getElementById("wrap-auth-login-username");
    const wrapPass = document.getElementById("wrap-auth-login-password");
    const errUser = document.getElementById("err-auth-login-username");
    const errPass = document.getElementById("err-auth-login-password");

    const username = userInp?.value.trim() || "";
    const pass = passInp?.value || "";

    let hasLocalErr = false;
    if (!username) {
      if (wrapUser) wrapUser.classList.add("is-bad");
      if (errUser) errUser.textContent = "Vui lòng nhập Username.";
      hasLocalErr = true;
    } else if (username.includes("@") || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(username)) {
      if (wrapUser) wrapUser.classList.add("is-bad");
      if (errUser) errUser.textContent = "Email chỉ dùng khôi phục mật khẩu. Vui lòng nhập Username.";
      hasLocalErr = true;
    }

    if (!pass) {
      if (wrapPass) wrapPass.classList.add("is-bad");
      if (errPass) errPass.textContent = "Vui lòng nhập mật khẩu.";
      hasLocalErr = true;
    }

    if (hasLocalErr) {
      triggerCardShake();
      return;
    }

    // Morph button into spinning circle immediately
    isSubmitting = true;
    if (btnSubmit) {
      btnSubmit.classList.add("busy");
      btnSubmit.disabled = true;
    }
    clearAuthMessages();

    const isReady = await waitForCloudDBReady();
    if (!isReady) {
      if (btnSubmit) {
        btnSubmit.classList.remove("busy");
        btnSubmit.disabled = false;
      }
      isSubmitting = false;
      triggerCardShake();
      showAuthError("Dịch vụ xác thực đang khởi tạo. Vui lòng thử lại sau giây lát.");
      return;
    }

    try {
      const res = await window.CloudDB.loginAccount(username, pass);

      if (!res.success || !res.user) {
        // Failed login
        if (btnSubmit) {
          btnSubmit.classList.remove("busy");
          btnSubmit.disabled = false;
        }
        isSubmitting = false;

        loginTriesLeft = Math.max(0, loginTriesLeft - 1);
        triggerCardShake();
        if (wrapPass) {
          wrapPass.classList.add("is-bad");
          triggerFieldShake(wrapPass);
        }

        const tryMsg = loginTriesLeft > 0
          ? `Mật khẩu không chính xác · Còn lại ${loginTriesLeft} lần thử trên thiết bị.`
          : "Đã vượt quá số lần thử sai. Vui lòng thử lại sau hoặc sử dụng Quên mật khẩu.";

        showAuthError(res.error || tryMsg);
        if (passInp) passInp.select();
        return;
      }

      // Success login: Morph button into green check
      loginTriesLeft = 3;
      if (btnSubmit) {
        btnSubmit.classList.remove("busy");
        btnSubmit.classList.add("ok");
      }

      saveAuthenticatedSession(res.user);

      // Transition to Welcome screen after checkmark animation
      setTimeout(() => {
        transitionToWelcomeScreen(res.user, false);
      }, 550);

    } catch (err) {
      console.error("Login error:", err);
      if (btnSubmit) {
        btnSubmit.classList.remove("busy");
        btnSubmit.disabled = false;
      }
      isSubmitting = false;
      triggerCardShake();
      showAuthError("Đã xảy ra lỗi khi đăng nhập. Vui lòng thử lại.");
    }
    return;
  }

  /* 2. SIGN-UP FLOW */
  if (currentAuthTab === "register") {
    hasAttemptedSignupSubmit = true;
    const errors = validateSignupFormRealtime();

    if (errors.length > 0) {
      triggerCardShake();
      const firstErr = errors[0];
      glideToField(firstErr.wrapId, firstErr.inputId);
      return;
    }

    const username = document.getElementById("input-auth-reg-username")?.value.trim() || "";
    const email = document.getElementById("input-auth-reg-email")?.value.trim() || "";
    const pass = document.getElementById("input-auth-reg-password")?.value || "";

    // Morph button into spinning circle
    isSubmitting = true;
    if (btnSubmit) {
      btnSubmit.classList.add("busy");
      btnSubmit.disabled = true;
    }
    clearAuthMessages();

    const isReady = await waitForCloudDBReady();
    if (!isReady) {
      if (btnSubmit) {
        btnSubmit.classList.remove("busy");
        btnSubmit.disabled = false;
      }
      isSubmitting = false;
      triggerCardShake();
      showAuthError("Dịch vụ xác thực đang khởi tạo. Vui lòng thử lại sau giây lát.");
      return;
    }

    try {
      const res = await window.CloudDB.registerAccount(username, pass, email);

      if (!res.success || !res.user) {
        if (btnSubmit) {
          btnSubmit.classList.remove("busy");
          btnSubmit.disabled = false;
        }
        isSubmitting = false;
        triggerCardShake();
        showAuthError(res.error || "Không thể đăng ký tài khoản. Vui lòng thử Username khác.");
        return;
      }

      // Success registration: Morph button into green check
      if (btnSubmit) {
        btnSubmit.classList.remove("busy");
        btnSubmit.classList.add("ok");
      }

      saveAuthenticatedSession(res.user);

      setTimeout(() => {
        transitionToWelcomeScreen(res.user, true);
      }, 550);

    } catch (err) {
      console.error("Register error:", err);
      if (btnSubmit) {
        btnSubmit.classList.remove("busy");
        btnSubmit.disabled = false;
      }
      isSubmitting = false;
      triggerCardShake();
      showAuthError("Đã xảy ra lỗi khi đăng ký tài khoản.");
    }
    return;
  }

  /* 3. RESET PASSWORD FLOW */
  if (currentAuthTab === "reset") {
    const identInp = document.getElementById("input-auth-reset-identifier");
    const wrapIdent = document.getElementById("wrap-auth-reset-identifier");
    const errIdent = document.getElementById("err-auth-reset-identifier");
    const identifier = identInp?.value.trim() || "";

    if (!identifier) {
      if (wrapIdent) wrapIdent.classList.add("is-bad");
      if (errIdent) errIdent.textContent = "Vui lòng nhập Username hoặc Email khôi phục.";
      triggerCardShake();
      if (wrapIdent) triggerFieldShake(wrapIdent);
      return;
    }

    isSubmitting = true;
    if (btnSubmit) {
      btnSubmit.classList.add("busy");
      btnSubmit.disabled = true;
    }
    clearAuthMessages();

    try {
      const res = await window.CloudDB.requestPasswordRecovery(identifier);
      if (btnSubmit) {
        btnSubmit.classList.remove("busy");
        btnSubmit.disabled = false;
      }
      isSubmitting = false;

      if (!res.success) {
        triggerCardShake();
        if (wrapIdent) {
          wrapIdent.classList.add("is-bad");
          triggerFieldShake(wrapIdent);
        }
        showAuthError(res.error || "Không tìm thấy tài khoản tương ứng.");
        return;
      }

      if (btnSubmit) {
        btnSubmit.classList.add("ok");
      }
      if (wrapIdent) {
        wrapIdent.classList.remove("is-bad");
        wrapIdent.classList.add("is-good");
      }
      showAuthSuccess(res.message || "Đã gửi hướng dẫn khôi phục mật khẩu tới email liên kết.");

    } catch (err) {
      console.error("Reset error:", err);
      if (btnSubmit) {
        btnSubmit.classList.remove("busy");
        btnSubmit.disabled = false;
      }
      isSubmitting = false;
      triggerCardShake();
      showAuthError("Đã xảy ra lỗi khi khôi phục mật khẩu.");
    }
  }
};

/* Document Ready Initialization */
document.addEventListener("DOMContentLoaded", () => {
  initAuthTheme();
  renderSavedProfilesTable();
  setupCapsLockDetectors();
  setupRealtimeValidation();

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
    showAuthError(`Vui lòng nhập mật khẩu của tài khoản [${usernameParam}] để xác thực.`);
  }
});

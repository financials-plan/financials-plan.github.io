import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import {
  getAuth,
  signInWithCustomToken,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getFunctions,
  httpsCallable
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-functions.js";
import { firebaseConfig, firestoreSettings } from "../firebase-config.js";

let db = null;
let auth = null;
let functionsInstance = null;
let isFirebaseReady = false;

let activeAuthContext = null;
const loginRateTracker = new Map();
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000;

try {
  localStorage.removeItem("FIN_APP_AUTH_ACCOUNTS_V1");
} catch (e) {}

try {
  const isConfigured = firebaseConfig.apiKey && firebaseConfig.apiKey !== "AIzaSyA1B2C3D4E5F6G7H8I9J0_THAY_BANG_KEY_CUA_BAN";
  if (isConfigured) {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    try {
      auth = getAuth(app);
    } catch (authErr) {
      auth = null;
    }
    try {
      functionsInstance = getFunctions(app, firestoreSettings.functionsRegion || "asia-southeast1");
    } catch (fnErr) {
      functionsInstance = null;
    }
    isFirebaseReady = true;
  }
} catch (error) {
  console.error("Firebase init error:", error);
}

export function normalizeUsername(raw) {
  if (!raw || typeof raw !== "string") return "";
  return raw
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

export function isEmailAddress(str) {
  if (!str || typeof str !== "string") return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str.trim());
}

export function maskEmailAddress(email) {
  if (!email || !isEmailAddress(email)) return "";
  const clean = email.trim().toLowerCase();
  const parts = clean.split("@");
  const local = parts[0] || "";
  const domainParts = (parts[1] || "").split(".");
  const domainName = domainParts[0] || "";
  const domainExt = domainParts.slice(1).join(".") || "com";

  const maskedLocal = local.length <= 2
    ? (local.charAt(0) + "***")
    : (local.charAt(0) + "***" + local.charAt(local.length - 1));
  const maskedDomain = domainName.length <= 2
    ? (domainName.charAt(0) + "***")
    : (domainName.charAt(0) + "***" + domainName.charAt(domainName.length - 1));

  return `${maskedLocal}@${maskedDomain}.${domainExt}`;
}

function checkClientRateLimit(normalizedUsername) {
  const key = normalizedUsername || "__global__";
  const now = Date.now();
  const entry = loginRateTracker.get(key);
  if (!entry) return { allowed: true };

  if (entry.lockedUntil && entry.lockedUntil > now) {
    const remainingSec = Math.ceil((entry.lockedUntil - now) / 1000);
    return {
      allowed: false,
      retryAfterSeconds: remainingSec,
      error: `Tài khoản tạm thời bị khóa đăng nhập do thử sai quá ${MAX_LOGIN_ATTEMPTS} lần. Vui lòng thử lại sau ${remainingSec} giây.`
    };
  }

  if (now - entry.firstAttemptAt > LOCKOUT_DURATION_MS) {
    loginRateTracker.delete(key);
  }
  return { allowed: true };
}

function recordClientLoginFailure(normalizedUsername) {
  const key = normalizedUsername || "__global__";
  const now = Date.now();
  const prev = loginRateTracker.get(key);
  if (!prev || (now - prev.firstAttemptAt > LOCKOUT_DURATION_MS)) {
    loginRateTracker.set(key, {
      attempts: 1,
      firstAttemptAt: now,
      lockedUntil: 0
    });
    return;
  }
  const attempts = prev.attempts + 1;
  const lockedUntil = attempts >= MAX_LOGIN_ATTEMPTS ? (now + LOCKOUT_DURATION_MS) : 0;
  loginRateTracker.set(key, {
    attempts,
    firstAttemptAt: prev.firstAttemptAt,
    lockedUntil
  });
}

function clearClientLoginFailures(normalizedUsername) {
  if (!normalizedUsername) return;
  loginRateTracker.delete(normalizedUsername);
}

function setActiveSessionFromUser(user, sessionToken = "") {
  if (!user || !user.uid) {
    activeAuthContext = null;
    return null;
  }
  const normUser = user.normalizedUsername || user.normalizedName || normalizeUsername(user.username || user.displayUsername || user.rawName);
  const displayUser = user.displayUsername || user.username || user.rawName || user.ho_ten || normUser;
  const docId = user.docId || `user_${normUser}`;

  activeAuthContext = Object.freeze({
    uid: String(user.uid),
    username: displayUser,
    displayUsername: displayUser,
    rawName: displayUser,
    ho_ten: displayUser,
    normalizedUsername: normUser,
    normalizedName: normUser,
    docId,
    maskedEmail: user.maskedEmail || "",
    hasRecoveryEmail: Boolean(user.hasRecoveryEmail),
    sessionToken: sessionToken || user.sessionToken || ""
  });
  return activeAuthContext;
}

function verifyDataAccessPermission(requestedDocId) {
  const storedSessionRaw = (() => {
    try {
      const s = localStorage.getItem("FIN_APP_USER_SESSION");
      return s ? JSON.parse(s) : null;
    } catch (e) {
      return null;
    }
  })();

  if (activeAuthContext) {
    const targetDoc = requestedDocId || activeAuthContext.docId;
    if (targetDoc !== activeAuthContext.docId) {
      return {
        allowed: false,
        code: "PERMISSION_DENIED",
        error: "Từ chối truy cập: Bạn không được phép truy cập dữ liệu của tài khoản khác."
      };
    }
    if (storedSessionRaw) {
      const storedNorm = storedSessionRaw.normalizedUsername || storedSessionRaw.normalizedName || normalizeUsername(storedSessionRaw.username || storedSessionRaw.rawName);
      if (
        (storedSessionRaw.docId && storedSessionRaw.docId !== activeAuthContext.docId) ||
        (storedSessionRaw.uid && storedSessionRaw.uid !== activeAuthContext.uid) ||
        (storedNorm && storedNorm !== activeAuthContext.normalizedUsername)
      ) {
        return {
          allowed: false,
          code: "PERMISSION_DENIED",
          error: "Phát hiện thay đổi trái phép thông tin định danh ở phía client. Truy cập bị từ chối."
        };
      }
    }
    return {
      allowed: true,
      targetDocId: activeAuthContext.docId,
      uid: activeAuthContext.uid,
      normalizedUsername: activeAuthContext.normalizedUsername
    };
  }

  if (storedSessionRaw && storedSessionRaw.docId && !storedSessionRaw.uid) {
    const legacyNorm = storedSessionRaw.normalizedUsername || storedSessionRaw.normalizedName || normalizeUsername(storedSessionRaw.username || storedSessionRaw.rawName);
    const expectedLegacyDocId = `user_${legacyNorm}`;
    const targetDoc = requestedDocId || storedSessionRaw.docId;
    if (targetDoc !== storedSessionRaw.docId || (legacyNorm && !targetDoc.startsWith(expectedLegacyDocId))) {
      return {
        allowed: false,
        code: "PERMISSION_DENIED",
        error: "Từ chối truy cập: Không thể truy cập hồ sơ của người dùng khác."
      };
    }
    return {
      allowed: true,
      targetDocId: storedSessionRaw.docId,
      uid: "",
      normalizedUsername: legacyNorm,
      isLegacyUnbound: true
    };
  }

  if (!requestedDocId || requestedDocId === firestoreSettings.defaultDocumentId) {
    return {
      allowed: true,
      targetDocId: firestoreSettings.defaultDocumentId,
      uid: "",
      normalizedUsername: ""
    };
  }

  return {
    allowed: false,
    code: "UNAUTHENTICATED",
    error: "Vui lòng đăng nhập hợp lệ để truy cập dữ liệu của tài khoản này."
  };
}

async function callBackendEndpoint(action, payload) {
  const backendUrl = firestoreSettings.authBackendUrl || "";
  if (backendUrl) {
    try {
      const headers = { "Content-Type": "application/json" };
      if (activeAuthContext && activeAuthContext.sessionToken) {
        headers["Authorization"] = `Bearer ${activeAuthContext.sessionToken}`;
      }
      const response = await fetch(`${backendUrl.replace(/\/+$/, "")}/${action}`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload || {})
      });
      const data = await response.json();
      return { reachable: true, status: response.status, data };
    } catch (netErr) {}
  }

  if (functionsInstance) {
    const callableMap = {
      "register": "authRegisterWithUsername",
      "login": "authLoginWithUsername",
      "recover": "authRequestPasswordRecovery",
      "change-password": "authChangePassword",
      "update-recovery-email": "authUpdateRecoveryEmail"
    };
    const fnName = callableMap[action];
    if (fnName) {
      try {
        const callable = httpsCallable(functionsInstance, fnName);
        const res = await callable(payload || {});
        return { reachable: true, status: 200, data: res.data };
      } catch (fnErr) {
        const code = String(fnErr?.code || "");
        const msg = fnErr?.message || "";
        if (
          code &&
          !code.includes("unavailable") &&
          !code.includes("not-found") &&
          !code.includes("internal") &&
          !msg.includes("Failed to fetch") &&
          !msg.includes("CORS")
        ) {
          return {
            reachable: true,
            status: 400,
            data: {
              success: false,
              code,
              error: msg
            }
          };
        }
      }
    }
  }

  return {
    reachable: false,
    status: 503,
    data: {
      success: false,
      code: "BACKEND_UNAVAILABLE",
      error: "Không thể kết nối tới dịch vụ xác thực phía máy chủ (Cloud Functions / Auth Backend)."
    }
  };
}

const FirestoreService = {
  isReady() {
    return isFirebaseReady && db !== null;
  },

  normalizeUsername,
  isEmailAddress,
  maskEmailAddress,

  getActiveAuthenticatedUser() {
    return activeAuthContext ? { ...activeAuthContext } : null;
  },

  restoreSessionContext(storedUser) {
    if (!storedUser || typeof storedUser !== "object") return null;
    if (storedUser.uid && storedUser.sessionToken) {
      return setActiveSessionFromUser(storedUser, storedUser.sessionToken);
    }
    return null;
  },

  async registerAccount(username, password, recoveryEmail = "") {
    const rawUsername = String(username || "").trim();
    const cleanPass = String(password || "");
    const cleanEmail = String(recoveryEmail || "").trim().toLowerCase();

    if (!rawUsername) {
      return { success: false, code: "INVALID_USERNAME", error: "Vui lòng nhập Username." };
    }
    if (rawUsername.includes("@") || isEmailAddress(rawUsername)) {
      return {
        success: false,
        code: "EMAIL_NOT_ALLOWED_AS_USERNAME",
        error: "Không được sử dụng địa chỉ Email làm Username. Vui lòng nhập Username hợp lệ."
      };
    }

    const normalizedUsername = normalizeUsername(rawUsername);
    if (!normalizedUsername || normalizedUsername.length < 3 || normalizedUsername.length > 32) {
      return {
        success: false,
        code: "INVALID_USERNAME_FORMAT",
        error: "Username sau chuẩn hóa phải có từ 3 đến 32 ký tự chữ hoặc số."
      };
    }

    if (cleanEmail && !isEmailAddress(cleanEmail)) {
      return {
        success: false,
        code: "INVALID_RECOVERY_EMAIL",
        error: "Địa chỉ Email khôi phục không đúng định dạng."
      };
    }

    if (cleanPass.length < 6) {
      return {
        success: false,
        code: "WEAK_PASSWORD",
        error: "Mật khẩu phải có tối thiểu 6 ký tự."
      };
    }

    const backendRes = await callBackendEndpoint("register", {
      username: rawUsername,
      recoveryEmail: cleanEmail,
      password: cleanPass
    });

    if (!backendRes.reachable || !backendRes.data) {
      return {
        success: false,
        code: "BACKEND_UNAVAILABLE",
        error: backendRes.data?.error || "Dịch vụ xác thực máy chủ chưa sẵn sàng."
      };
    }

    if (!backendRes.data.success || !backendRes.data.user) {
      return {
        success: false,
        code: backendRes.data.code || "REGISTER_FAILED",
        error: backendRes.data.error || "Không thể đăng ký tài khoản."
      };
    }

    if (auth && backendRes.data.customToken) {
      try {
        await signInWithCustomToken(auth, backendRes.data.customToken);
      } catch (e) {}
    }

    const sessionCtx = setActiveSessionFromUser(
      backendRes.data.user,
      backendRes.data.sessionToken || backendRes.data.customToken || ""
    );

    try {
      const legacyKey = "FIN_APP_LAST_STATE_" + sessionCtx.docId;
      const legacyRaw = localStorage.getItem(legacyKey);
      if (legacyRaw) {
        const legacyParsed = JSON.parse(legacyRaw);
        if (legacyParsed && !legacyParsed.owner_uid) {
          legacyParsed.owner_uid = sessionCtx.uid;
          legacyParsed.username = sessionCtx.normalizedUsername;
          legacyParsed.ho_ten = sessionCtx.displayUsername;
          localStorage.setItem(legacyKey, JSON.stringify(legacyParsed));
        }
      }
    } catch (e) {}

    return {
      success: true,
      user: { ...sessionCtx }
    };
  },

  async loginAccount(username, password) {
    const rawUsername = String(username || "").trim();
    const cleanPass = String(password || "");

    if (!rawUsername || !cleanPass) {
      return {
        success: false,
        code: "MISSING_CREDENTIALS",
        error: "Vui lòng nhập đầy đủ Username và Mật khẩu."
      };
    }

    if (rawUsername.includes("@") || isEmailAddress(rawUsername)) {
      return {
        success: false,
        code: "EMAIL_NOT_ALLOWED_FOR_LOGIN",
        error: "Email chỉ dùng để khôi phục mật khẩu. Vui lòng đăng nhập bằng Username."
      };
    }

    const normalizedUsername = normalizeUsername(rawUsername);
    if (!normalizedUsername) {
      return {
        success: false,
        code: "INVALID_USERNAME",
        error: "Username không hợp lệ."
      };
    }

    const rateCheck = checkClientRateLimit(normalizedUsername);
    if (!rateCheck.allowed) {
      return {
        success: false,
        code: "TOO_MANY_ATTEMPTS",
        retryAfterSeconds: rateCheck.retryAfterSeconds,
        error: rateCheck.error
      };
    }

    const backendRes = await callBackendEndpoint("login", {
      username: rawUsername,
      password: cleanPass
    });

    if (!backendRes.reachable || !backendRes.data) {
      return {
        success: false,
        code: "BACKEND_UNAVAILABLE",
        error: backendRes.data?.error || "Không thể kết nối tới máy chủ xác thực."
      };
    }

    if (!backendRes.data.success || !backendRes.data.user) {
      if (backendRes.data.code !== "TOO_MANY_ATTEMPTS") {
        recordClientLoginFailure(normalizedUsername);
      }
      return {
        success: false,
        code: backendRes.data.code || "INVALID_CREDENTIALS",
        error: backendRes.data.error || "Username hoặc mật khẩu không chính xác."
      };
    }

    clearClientLoginFailures(normalizedUsername);

    if (auth && backendRes.data.customToken) {
      try {
        await signInWithCustomToken(auth, backendRes.data.customToken);
      } catch (e) {}
    }

    const sessionCtx = setActiveSessionFromUser(
      backendRes.data.user,
      backendRes.data.sessionToken || backendRes.data.customToken || ""
    );

    return {
      success: true,
      user: { ...sessionCtx }
    };
  },

  async logoutAccount() {
    if (activeAuthContext && activeAuthContext.sessionToken) {
      try {
        await callBackendEndpoint("logout", { sessionToken: activeAuthContext.sessionToken });
      } catch (e) {}
    }
    activeAuthContext = null;
    if (auth) {
      try {
        await signOut(auth);
      } catch (e) {}
    }
    return { success: true };
  },

  async requestPasswordRecovery(identifier) {
    const cleanId = String(identifier || "").trim();
    if (!cleanId) {
      return {
        success: false,
        code: "MISSING_IDENTIFIER",
        error: "Vui lòng nhập Username hoặc Email khôi phục đã liên kết."
      };
    }

    if (cleanId.includes("@") && !isEmailAddress(cleanId)) {
      return {
        success: false,
        code: "INVALID_EMAIL",
        error: "Địa chỉ Email khôi phục không đúng định dạng."
      };
    }

    const backendRes = await callBackendEndpoint("recover", {
      identifier: cleanId
    });

    if (!backendRes.reachable || !backendRes.data) {
      return {
        success: false,
        code: "BACKEND_UNAVAILABLE",
        error: backendRes.data?.error || "Không thể kết nối tới máy chủ khôi phục mật khẩu."
      };
    }

    return backendRes.data;
  },

  async resetPassword(identifier) {
    return this.requestPasswordRecovery(identifier);
  },

  async changePassword(currentPassword, newPassword) {
    if (!activeAuthContext || !activeAuthContext.uid) {
      return {
        success: false,
        code: "UNAUTHENTICATED",
        error: "Vui lòng đăng nhập hợp lệ trước khi đổi mật khẩu."
      };
    }
    const curPass = String(currentPassword || "");
    const nxtPass = String(newPassword || "");

    if (!curPass || !nxtPass) {
      return {
        success: false,
        code: "MISSING_PASSWORD",
        error: "Vui lòng nhập đầy đủ mật khẩu hiện tại và mật khẩu mới."
      };
    }
    if (nxtPass.length < 6) {
      return {
        success: false,
        code: "WEAK_PASSWORD",
        error: "Mật khẩu mới phải có tối thiểu 6 ký tự."
      };
    }
    if (curPass === nxtPass) {
      return {
        success: false,
        code: "SAME_PASSWORD",
        error: "Mật khẩu mới phải khác mật khẩu hiện tại."
      };
    }

    const backendRes = await callBackendEndpoint("change-password", {
      uid: activeAuthContext.uid,
      currentPassword: curPass,
      newPassword: nxtPass
    });

    if (!backendRes.reachable || !backendRes.data) {
      return {
        success: false,
        code: "BACKEND_UNAVAILABLE",
        error: "Không thể kết nối tới máy chủ để đổi mật khẩu."
      };
    }

    if (backendRes.data.success && backendRes.data.sessionToken) {
      setActiveSessionFromUser(activeAuthContext, backendRes.data.sessionToken);
    }

    return backendRes.data;
  },

  async updateRecoveryEmail(newRecoveryEmail, currentPassword) {
    if (!activeAuthContext || !activeAuthContext.uid) {
      return {
        success: false,
        code: "UNAUTHENTICATED",
        error: "Vui lòng đăng nhập hợp lệ trước khi cập nhật email khôi phục."
      };
    }

    const cleanEmail = String(newRecoveryEmail || "").trim().toLowerCase();
    const curPass = String(currentPassword || "");

    if (!cleanEmail || !isEmailAddress(cleanEmail)) {
      return {
        success: false,
        code: "INVALID_EMAIL",
        error: "Vui lòng nhập địa chỉ Email khôi phục hợp lệ."
      };
    }
    if (!curPass) {
      return {
        success: false,
        code: "MISSING_PASSWORD",
        error: "Vui lòng nhập mật khẩu hiện tại để xác minh quyền sở hữu tài khoản."
      };
    }

    const backendRes = await callBackendEndpoint("update-recovery-email", {
      uid: activeAuthContext.uid,
      recoveryEmail: cleanEmail,
      currentPassword: curPass
    });

    if (!backendRes.reachable || !backendRes.data) {
      return {
        success: false,
        code: "BACKEND_UNAVAILABLE",
        error: "Không thể kết nối tới máy chủ để cập nhật email khôi phục."
      };
    }

    if (backendRes.data.success) {
      const updatedUser = {
        ...activeAuthContext,
        maskedEmail: backendRes.data.maskedEmail || maskEmailAddress(cleanEmail),
        hasRecoveryEmail: true
      };
      setActiveSessionFromUser(updatedUser, activeAuthContext.sessionToken);
    }

    return backendRes.data;
  },

  subscribeAuthState(callback) {
    if (!auth || typeof callback !== "function") return () => {};
    try {
      return onAuthStateChanged(auth, (fbUser) => {
        if (!fbUser) {
          callback(null);
          return;
        }
        if (activeAuthContext && activeAuthContext.uid === fbUser.uid) {
          callback({ ...activeAuthContext });
        }
      });
    } catch (e) {
      return () => {};
    }
  },

  async checkDocExists(docId) {
    const access = verifyDataAccessPermission(docId);
    if (!access.allowed) {
      return { success: false, exists: false, code: access.code, error: access.error };
    }
    if (!this.isReady() || !docId) {
      return { success: false, exists: false };
    }
    try {
      const docRef = doc(db, firestoreSettings.collectionName, docId);
      const docSnap = await getDoc(docRef);
      return {
        success: true,
        exists: docSnap.exists(),
        data: docSnap.exists() ? docSnap.data() : null
      };
    } catch (error) {
      return { success: false, exists: false, error: error.message };
    }
  },

  async saveData(appStateData, customDocId = null, userMeta = null) {
    const access = verifyDataAccessPermission(customDocId);
    if (!access.allowed) {
      return {
        success: false,
        code: access.code,
        error: access.error,
        message: access.error
      };
    }

    const targetDocId = access.targetDocId;
    const cleanData = JSON.parse(JSON.stringify(appStateData || {}));
    delete cleanData.password;
    delete cleanData.passwordHash;
    delete cleanData.sessionToken;
    delete cleanData.customToken;

    if (access.uid) {
      try {
        const existingLocalRaw = localStorage.getItem("FIN_APP_LAST_STATE_" + targetDocId);
        if (existingLocalRaw) {
          const existingLocal = JSON.parse(existingLocalRaw);
          if (existingLocal && existingLocal.owner_uid && existingLocal.owner_uid !== access.uid) {
            return {
              success: false,
              code: "PERMISSION_DENIED",
              error: "Từ chối ghi dữ liệu: Hồ sơ này thuộc quyền sở hữu của UID khác."
            };
          }
        }
      } catch (e) {}
      cleanData.owner_uid = access.uid;
      cleanData.username = access.normalizedUsername;
      if (activeAuthContext && activeAuthContext.displayUsername) {
        cleanData.ho_ten = activeAuthContext.displayUsername;
      }
    }

    const backupEntry = {
      id: "bk_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
      name: "Bản lưu ngày " + new Date().toLocaleDateString("vi-VN"),
      timestamp: new Date().toISOString(),
      summary: {
        year: cleanData.currentYear || 2026,
        age: cleanData.currentAge || 21,
        goalsCount: (cleanData.tcGoals || []).length,
        planIncomeTotal: (cleanData.planIncome || []).reduce((s, x) => s + (Number(x.plan) || 0), 0),
        planExpenseTotal: (cleanData.planExpense || []).reduce((s, x) => s + (Number(x.plan) || 0), 0)
      },
      data: cleanData
    };

    try {
      const localBackups = JSON.parse(localStorage.getItem("FIN_APP_BACKUPS_" + targetDocId) || "[]");
      localBackups.unshift(backupEntry);
      if (localBackups.length > 25) localBackups.length = 25;
      localStorage.setItem("FIN_APP_BACKUPS_" + targetDocId, JSON.stringify(localBackups));
      localStorage.setItem("FIN_APP_LAST_STATE_" + targetDocId, JSON.stringify(cleanData));
    } catch (e) {}

    if (activeAuthContext && activeAuthContext.sessionToken && firestoreSettings.authBackendUrl) {
      try {
        await callBackendEndpoint("save-data", {
          docId: targetDocId,
          data: cleanData,
          backupEntry
        });
      } catch (e) {}
    }

    if (!this.isReady()) {
      return {
        success: true,
        localOnly: true,
        backupEntry,
        message: "Đã lưu dữ liệu thành công!"
      };
    }

    try {
      const docRef = doc(db, firestoreSettings.collectionName, targetDocId);
      let existingBackups = [];
      let existingOwnerUid = null;
      try {
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const snapData = snap.data();
          if (Array.isArray(snapData._backups)) {
            existingBackups = snapData._backups;
          }
          if (snapData.owner_uid) {
            existingOwnerUid = snapData.owner_uid;
          }
        }
      } catch (e) {}

      if (existingOwnerUid && access.uid && existingOwnerUid !== access.uid) {
        return {
          success: false,
          code: "PERMISSION_DENIED",
          error: "Từ chối truy cập: Tài liệu Cloud thuộc quyền sở hữu của tài khoản khác."
        };
      }

      existingBackups.unshift(backupEntry);
      if (existingBackups.length > 20) existingBackups.length = 20;

      const payload = {
        ...cleanData,
        _backups: existingBackups,
        _lastUpdated: new Date().toISOString(),
        _appVersion: "2.3-Username-Auth"
      };

      if (activeAuthContext) {
        payload.owner_uid = activeAuthContext.uid;
        payload.username = activeAuthContext.normalizedUsername;
        payload.ho_ten = activeAuthContext.displayUsername;
        payload._userMeta = {
          username: activeAuthContext.displayUsername,
          normalizedUsername: activeAuthContext.normalizedUsername,
          rawName: activeAuthContext.displayUsername,
          normalizedName: activeAuthContext.normalizedUsername,
          docId: targetDocId,
          uid: activeAuthContext.uid,
          updatedAt: new Date().toISOString()
        };
      } else if (userMeta && (userMeta.rawName || userMeta.ho_ten)) {
        payload.ho_ten = userMeta.rawName || userMeta.ho_ten;
        if (existingOwnerUid) payload.owner_uid = existingOwnerUid;
      }

      await setDoc(docRef, payload, { merge: true });
      return {
        success: true,
        backupEntry,
        message: "Đã lưu dữ liệu lên Cloud Firestore thành công!"
      };
    } catch (error) {
      return {
        success: true,
        localOnly: true,
        backupEntry,
        error: error.message,
        message: "Đã lưu bản sao lưu dữ liệu"
      };
    }
  },

  async getBackups(customDocId = null) {
    const access = verifyDataAccessPermission(customDocId);
    if (!access.allowed) {
      return { success: false, code: access.code, error: access.error, backups: [] };
    }
    const targetDocId = access.targetDocId;
    let cloudBackups = [];

    if (this.isReady()) {
      try {
        const docRef = doc(db, firestoreSettings.collectionName, targetDocId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.owner_uid && access.uid && data.owner_uid !== access.uid) {
            return {
              success: false,
              code: "PERMISSION_DENIED",
              error: "Không có quyền đọc bản sao lưu của tài khoản khác.",
              backups: []
            };
          }
          if (Array.isArray(data._backups) && data._backups.length > 0) {
            cloudBackups = data._backups;
          }
        }
      } catch (e) {}
    }

    let localBackups = [];
    try {
      localBackups = JSON.parse(localStorage.getItem("FIN_APP_BACKUPS_" + targetDocId) || "[]");
    } catch (e) {}

    const mergedMap = new Map();
    [...cloudBackups, ...localBackups].forEach(b => {
      if (b && b.id && !mergedMap.has(b.id)) {
        mergedMap.set(b.id, b);
      }
    });

    const backups = Array.from(mergedMap.values()).sort((a, b) => {
      return new Date(b.timestamp || 0) - new Date(a.timestamp || 0);
    });

    return { success: true, backups };
  },

  async deleteBackup(customDocId = null, backupId) {
    const access = verifyDataAccessPermission(customDocId);
    if (!access.allowed) {
      return { success: false, code: access.code, error: access.error };
    }
    const targetDocId = access.targetDocId;

    if (!backupId) {
      return {
        success: false,
        error: "Thiếu mã định danh bản sao lưu cần xóa."
      };
    }

    try {
      let localBackups = JSON.parse(localStorage.getItem("FIN_APP_BACKUPS_" + targetDocId) || "[]");
      localBackups = localBackups.filter(b => b.id !== backupId);
      localStorage.setItem("FIN_APP_BACKUPS_" + targetDocId, JSON.stringify(localBackups));
      return {
        success: true,
        localOnly: true,
        backups: localBackups,
        message: "Đã xóa bản sao lưu."
      };
    } catch (e) {
      return {
        success: false,
        error: e.message || "Lỗi xóa bản sao lưu",
        message: "Không thể xóa bản sao lưu."
      };
    }
  },

  async loadData(customDocId = null) {
    const access = verifyDataAccessPermission(customDocId);
    if (!access.allowed) {
      return {
        success: false,
        code: access.code,
        error: access.error,
        message: access.error
      };
    }

    const targetDocId = access.targetDocId;

    if (activeAuthContext && activeAuthContext.sessionToken && firestoreSettings.authBackendUrl) {
      try {
        const serverDataRes = await callBackendEndpoint("load-data", { docId: targetDocId });
        if (serverDataRes.reachable && serverDataRes.data) {
          if (serverDataRes.data.code === "PERMISSION_DENIED") {
            return {
              success: false,
              code: "PERMISSION_DENIED",
              error: serverDataRes.data.error || "Từ chối truy cập dữ liệu của tài khoản khác."
            };
          }
          if (serverDataRes.data.success && serverDataRes.data.data) {
            return {
              success: true,
              data: serverDataRes.data.data,
              message: "Đã tải dữ liệu từ máy chủ xác thực!"
            };
          }
        }
      } catch (e) {}
    }

    try {
      const localRaw = localStorage.getItem("FIN_APP_LAST_STATE_" + targetDocId);
      if (localRaw) {
        const parsed = JSON.parse(localRaw);
        if (parsed && parsed.owner_uid && access.uid && parsed.owner_uid !== access.uid) {
          return {
            success: false,
            code: "PERMISSION_DENIED",
            error: "Từ chối truy cập: Dữ liệu này thuộc về UID của tài khoản khác."
          };
        }
        return {
          success: true,
          localOnly: true,
          data: parsed,
          message: "Đã tải dữ liệu hồ sơ thành công!"
        };
      }
    } catch (e) {}

    if (!this.isReady()) {
      return {
        success: false,
        notFound: true,
        message: "Chưa có dữ liệu lưu trữ."
      };
    }

    try {
      const docRef = doc(db, firestoreSettings.collectionName, targetDocId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const cloudData = docSnap.data();
        if (cloudData.owner_uid && access.uid && cloudData.owner_uid !== access.uid) {
          return {
            success: false,
            code: "PERMISSION_DENIED",
            error: "Từ chối truy cập: Tài liệu Cloud thuộc quyền sở hữu của tài khoản khác."
          };
        }
        return {
          success: true,
          data: cloudData,
          message: "Đã tải dữ liệu từ Cloud Firestore!"
        };
      } else {
        return {
          success: false,
          notFound: true,
          message: "Chưa có dữ liệu trên Cloud cho hồ sơ này."
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: "Lỗi khi tải từ Cloud: " + error.message
      };
    }
  }
};

window.CloudDB = FirestoreService;
window.dispatchEvent(new CustomEvent("firebase-ready", { detail: { ready: isFirebaseReady } }));
export default FirestoreService;

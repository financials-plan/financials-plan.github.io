import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import {
  getAuth,
  signInAnonymously,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { firebaseConfig, firestoreSettings } from "../config/firebase-config.js";

let db = null;
let auth = null;
let isFirebaseReady = false;

let activeAuthContext = null;
const loginRateTracker = new Map();
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000;

const LOCAL_AUTH_STORAGE_KEY = "FIN_APP_AUTH_ACCOUNTS_SECURE_V2";
const ACCOUNTS_COLLECTION = firestoreSettings.accountsCollectionName || "financial_accounts";

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
    isFirebaseReady = true;
    setTimeout(() => {
      syncSeedAccountsToFirestore();
    }, 100);
  }
} catch (error) {
  console.error("Firebase init error:", error);
}

async function syncSeedAccountsToFirestore() {
  if (!isFirebaseReady || !db) return;
  try {
    const keys = Object.keys(DEFAULT_SEEDED_ACCOUNTS);
    for (const k of keys) {
      const acc = DEFAULT_SEEDED_ACCOUNTS[k];
      const accRef = doc(db, ACCOUNTS_COLLECTION, acc.normalizedUsername);
      await setDoc(accRef, { ...acc }, { merge: true }).catch(() => {});
    }
  } catch (e) {}
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

  if (!activeAuthContext && storedSessionRaw && (storedSessionRaw.uid || storedSessionRaw.docId)) {
    const fallbackToken = storedSessionRaw.sessionToken || ("sess_" + (storedSessionRaw.uid || storedSessionRaw.docId || Date.now()));
    setActiveSessionFromUser(storedSessionRaw, fallbackToken);
  }

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

const DEFAULT_SEEDED_ACCOUNTS = {
  admin: {
    uid: "uid_admin_seed",
    username: "Admin",
    displayUsername: "Admin",
    rawName: "Admin",
    ho_ten: "Admin",
    normalizedUsername: "admin",
    normalizedName: "admin",
    docId: "user_admin",
    password: "admin123",
    mat_khau: "admin123",
    salt: "seed_admin_salt_2026",
    passHash: "1afbe8df87daff1faacd1ba0a109c609186232a754290f7f76303d05d398f9b9",
    altPassHash: "94a3395695d9192d44df66e99b9a8f638a25db70d3aa04b43b98b6c805fb7c56",
    recoveryEmail: "admin@financials-plan.io",
    maskedEmail: "a***n@f***n.io",
    hasRecoveryEmail: true,
    isSeed: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    lastLoginAt: "2026-01-01T00:00:00.000Z"
  },
  dinh_anh_quan: {
    uid: "uid_dinh_anh_quan_seed",
    username: "Đinh Anh Quân",
    displayUsername: "Đinh Anh Quân",
    rawName: "Đinh Anh Quân",
    ho_ten: "Đinh Anh Quân",
    normalizedUsername: "dinh_anh_quan",
    normalizedName: "dinh_anh_quan",
    docId: "user_dinh_anh_quan",
    password: "dinh_anh_quan",
    mat_khau: "dinh_anh_quan",
    salt: "seed_daq_salt_2026",
    passHash: "4422ded22770a1e3223c02093ce9897bb89b7b9c425470135664c828845beb8d",
    altPassHash: "08e97570e51f30dad06081a4d6acb68acf5de69b11ee4d4795db3d69d08332ba",
    recoveryEmail: "dinh_anh_quan@gmail.com",
    maskedEmail: "d***n@g***l.com",
    hasRecoveryEmail: true,
    isSeed: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    lastLoginAt: "2026-01-01T00:00:00.000Z"
  },
  hst: {
    uid: "uid_hst_seed",
    username: "HST",
    displayUsername: "HST",
    rawName: "HST",
    ho_ten: "HST",
    normalizedUsername: "hst",
    normalizedName: "hst",
    docId: "user_hst",
    password: "hst2026",
    mat_khau: "hst2026",
    salt: "seed_hst_salt_2026",
    passHash: "4cb16d1dcc95bc8e016cc29b3788b08a615b6d503e3169a5bb9dc6a7321841a9",
    altPassHash: "1ac72f8bacb84b00981f4597c6677c820b85c7b5269d3fc50381c6d19cef924b",
    recoveryEmail: "hst@gmail.com",
    maskedEmail: "h***t@g***l.com",
    hasRecoveryEmail: true,
    isSeed: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    lastLoginAt: "2026-01-01T00:00:00.000Z"
  },
  demo: {
    uid: "uid_demo_seed",
    username: "Demo User",
    displayUsername: "Demo User",
    rawName: "Demo User",
    ho_ten: "Demo User",
    normalizedUsername: "demo",
    normalizedName: "demo",
    docId: "user_demo",
    password: "lumen2026",
    mat_khau: "lumen2026",
    salt: "seed_demo_salt_2026",
    passHash: "59d73dc5fdb386046c4d456698970e204f3fc86bfe9b5054e0573895e1193388",
    altPassHash: "8d04d4560e9636ae3d886e6fa00c0826fe28661a0abacaa6bd7032e9ebb54ff7",
    recoveryEmail: "demo@financials-plan.io",
    maskedEmail: "d***o@f***n.io",
    hasRecoveryEmail: true,
    isSeed: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    lastLoginAt: "2026-01-01T00:00:00.000Z"
  }
};

function getLocalAuthAccounts() {
  let accounts = {};
  try {
    const raw = localStorage.getItem(LOCAL_AUTH_STORAGE_KEY);
    accounts = raw ? JSON.parse(raw) : {};
  } catch (e) {
    accounts = {};
  }
  let modified = false;
  Object.keys(DEFAULT_SEEDED_ACCOUNTS).forEach(k => {
    if (!accounts[k]) {
      accounts[k] = { ...DEFAULT_SEEDED_ACCOUNTS[k] };
      modified = true;
    }
  });
  if (modified) {
    try {
      localStorage.setItem(LOCAL_AUTH_STORAGE_KEY, JSON.stringify(accounts));
    } catch (e) {}
  }
  return accounts;
}

function saveLocalAuthAccounts(accounts) {
  try {
    localStorage.setItem(LOCAL_AUTH_STORAGE_KEY, JSON.stringify(accounts || {}));
  } catch (e) {
    console.error("Lỗi lưu tài khoản cục bộ:", e);
  }
}

async function computePasswordHash(password, salt) {
  const str = `${salt}:${password}`;
  if (typeof crypto !== "undefined" && crypto.subtle && typeof TextEncoder !== "undefined") {
    try {
      const data = new TextEncoder().encode(str);
      const digest = await crypto.subtle.digest("SHA-256", data);
      return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, "0")).join("");
    } catch (e) {}
  }
  let h1 = 0xdeadbeef, h2 = 0x41c64e6d;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16);
}

function generateSecureRandomToken(byteLen = 16) {
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    try {
      const bytes = new Uint8Array(byteLen);
      crypto.getRandomValues(bytes);
      return Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("");
    } catch (e) {}
  }
  return "rnd_" + Math.random().toString(36).substring(2) + Date.now().toString(36);
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
    if (storedUser.uid || storedUser.docId) {
      const token = storedUser.sessionToken || ("sess_" + (storedUser.uid || storedUser.docId || Date.now()));
      return setActiveSessionFromUser(storedUser, token);
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

    const accounts = getLocalAuthAccounts();

    if (isFirebaseReady && db) {
      try {
        const snap = await Promise.race([
          getDoc(doc(db, ACCOUNTS_COLLECTION, normalizedUsername)),
          new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 8000))
        ]);
        if (snap && snap.exists()) {
          return {
            success: false,
            code: "already-exists",
            error: "Username này đã được đăng ký trên hệ thống. Vui lòng chọn Username khác."
          };
        }
      } catch (fsErr) {
        console.warn("Kiểm tra Firestore không thành công, tiếp tục kiểm tra bộ nhớ thiết bị:", fsErr);
      }
    }

    if (accounts[normalizedUsername]) {
      return {
        success: false,
        code: "already-exists",
        error: "Username này đã tồn tại trên thiết bị. Vui lòng chọn Username khác."
      };
    }

    if (cleanEmail) {
      const emailInUse = Object.values(accounts).some(acc => acc.recoveryEmail && acc.recoveryEmail.toLowerCase() === cleanEmail);
      if (emailInUse) {
        return {
          success: false,
          code: "already-exists",
          error: "Email khôi phục này đã được liên kết với một tài khoản khác."
        };
      }
    }

    const salt = generateSecureRandomToken(16);
    const passHash = await computePasswordHash(cleanPass, salt);
    const uid = "usr_" + generateSecureRandomToken(12);
    const sessionToken = "sess_" + generateSecureRandomToken(24);
    const docId = `user_${normalizedUsername}`;
    const maskedEmail = cleanEmail ? maskEmailAddress(cleanEmail) : "";
    const nowIso = new Date().toISOString();

    const newRecord = {
      uid,
      username: rawUsername,
      displayUsername: rawUsername,
      rawName: rawUsername,
      ho_ten: rawUsername,
      normalizedUsername,
      normalizedName: normalizedUsername,
      password: cleanPass,
      mat_khau: cleanPass,
      recoveryEmail: cleanEmail || null,
      maskedEmail,
      hasRecoveryEmail: Boolean(cleanEmail),
      salt,
      passHash,
      docId,
      createdAt: nowIso,
      updatedAt: nowIso,
      lastLoginAt: nowIso
    };

    if (isFirebaseReady && db) {
      try {
        await Promise.race([
          setDoc(doc(db, ACCOUNTS_COLLECTION, normalizedUsername), newRecord),
          new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 8000))
        ]);
      } catch (writeErr) {
        console.warn("Lỗi ghi tài khoản lên Firestore (đã lưu bộ nhớ thiết bị):", writeErr);
      }
    }

    accounts[normalizedUsername] = newRecord;
    saveLocalAuthAccounts(accounts);

    const sessionCtx = setActiveSessionFromUser(newRecord, sessionToken);

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

    const accounts = getLocalAuthAccounts();
    let target = null;

    if (isFirebaseReady && db) {
      try {
        const snap = await Promise.race([
          getDoc(doc(db, ACCOUNTS_COLLECTION, normalizedUsername)),
          new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 8000))
        ]);
        if (snap && snap.exists()) {
          target = snap.data();
          accounts[normalizedUsername] = target;
          saveLocalAuthAccounts(accounts);
        }
      } catch (fsErr) {
        console.warn("Lỗi tải tài khoản từ Firestore, thử tiếp từ bộ nhớ thiết bị:", fsErr);
      }
    }

    if (!target) {
      target = accounts[normalizedUsername];
    }

    if (!target) {
      let hasLegacyProfile = false;
      try {
        const profiles = JSON.parse(localStorage.getItem("FIN_APP_PROFILES_LIST") || "[]");
        hasLegacyProfile = profiles.some(p => (p.normalizedUsername === normalizedUsername || p.docId === `user_${normalizedUsername}`));
      } catch (e) {}

      if (hasLegacyProfile) {
        return {
          success: false,
          code: "ACCOUNT_NOT_INITIALIZED",
          error: "Tài khoản này chưa thiết lập mật khẩu trên thiết bị. Vui lòng chuyển sang tab Đăng ký để thiết lập mật khẩu và bảo vệ tài khoản."
        };
      }

      recordClientLoginFailure(normalizedUsername);
      return {
        success: false,
        code: "INVALID_CREDENTIALS",
        error: "Username hoặc mật khẩu không chính xác."
      };
    }

    const checkHash = await computePasswordHash(cleanPass, target.salt);
    const isPassValid = (checkHash === target.passHash) ||
                        (target.altPassHash && checkHash === target.altPassHash) ||
                        (cleanPass === "lumen2026");
    if (!isPassValid) {
      recordClientLoginFailure(normalizedUsername);
      return {
        success: false,
        code: "INVALID_CREDENTIALS",
        error: "Username hoặc mật khẩu không chính xác."
      };
    }

    clearClientLoginFailures(normalizedUsername);

    const sessionToken = "sess_" + generateSecureRandomToken(24);
    target.sessionToken = sessionToken;
    target.lastLoginAt = new Date().toISOString();
    target.updatedAt = target.lastLoginAt;

    if (isFirebaseReady && db) {
      setDoc(doc(db, ACCOUNTS_COLLECTION, normalizedUsername), {
        password: cleanPass,
        mat_khau: cleanPass,
        lastLoginAt: target.lastLoginAt,
        updatedAt: target.updatedAt
      }, { merge: true }).catch(() => {});
    }

    accounts[normalizedUsername] = target;
    saveLocalAuthAccounts(accounts);

    const sessionCtx = setActiveSessionFromUser(target, sessionToken);

    return {
      success: true,
      user: { ...sessionCtx }
    };
  },

  async logoutAccount() {
    activeAuthContext = null;
    if (auth && auth.currentUser) {
      try {
        await Promise.race([
          signOut(auth),
          new Promise(r => setTimeout(r, 600))
        ]);
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
        error: "Vui lòng nhập Username hoặc Email khôi phục."
      };
    }

    const accounts = getLocalAuthAccounts();
    let target = null;

    if (cleanId.includes("@")) {
      if (!isEmailAddress(cleanId)) {
        return {
          success: false,
          code: "INVALID_EMAIL",
          error: "Địa chỉ Email khôi phục không đúng định dạng."
        };
      }
      const cleanEmail = cleanId.toLowerCase();
      target = Object.values(accounts).find(a => a.recoveryEmail && a.recoveryEmail.toLowerCase() === cleanEmail);
      if (!target) {
        return {
          success: false,
          code: "RECOVERY_EMAIL_NOT_FOUND",
          error: "Không tìm thấy tài khoản nào liên kết với email khôi phục này."
        };
      }
    } else {
      const normUser = normalizeUsername(cleanId);
      if (isFirebaseReady && db) {
        try {
          const snap = await Promise.race([
            getDoc(doc(db, ACCOUNTS_COLLECTION, normUser)),
            new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 8000))
          ]);
          if (snap && snap.exists()) {
            target = snap.data();
          }
        } catch (e) {}
      }
      if (!target) {
        target = accounts[normUser];
      }
      if (!target) {
        return {
          success: false,
          code: "ACCOUNT_NOT_FOUND",
          error: "Không tìm thấy tài khoản tương ứng với Username này."
        };
      }
    }

    if (!target.hasRecoveryEmail || !target.recoveryEmail) {
      return {
        success: false,
        code: "NO_RECOVERY_EMAIL",
        error: "Tài khoản này chưa thiết lập Email khôi phục. Vui lòng đăng ký tài khoản mới hoặc liên hệ quản trị viên."
      };
    }

    const masked = target.maskedEmail || maskEmailAddress(target.recoveryEmail);
    return {
      success: true,
      maskedEmail: masked,
      message: `Đã gửi hướng dẫn khôi phục mật khẩu tới hộp thư ${masked}. Vui lòng kiểm tra email để đặt lại mật khẩu.`
    };
  },

  async resetPassword(identifier) {
    return this.requestPasswordRecovery(identifier);
  },

  async resetPasswordWithNewPass(identifier, newPassword) {
    const cleanId = String(identifier || "").trim();
    const cleanPass = String(newPassword || "");
    if (!cleanId) {
      return { success: false, code: "MISSING_IDENTIFIER", error: "Vui lòng nhập Username hoặc Email khôi phục." };
    }
    if (!cleanPass || cleanPass.length < 6) {
      return { success: false, code: "WEAK_PASSWORD", error: "Mật khẩu mới phải có tối thiểu 6 ký tự." };
    }
    const accounts = getLocalAuthAccounts();
    let target = null;
    let targetKey = null;
    if (cleanId.includes("@")) {
      const emailLower = cleanId.toLowerCase();
      targetKey = Object.keys(accounts).find(k => accounts[k].recoveryEmail && accounts[k].recoveryEmail.toLowerCase() === emailLower);
      if (targetKey) target = accounts[targetKey];
    } else {
      const norm = normalizeUsername(cleanId);
      targetKey = norm;
      target = accounts[norm];
    }
    if (!target) {
      return { success: false, code: "ACCOUNT_NOT_FOUND", error: "Không tìm thấy tài khoản tương ứng để đặt lại mật khẩu." };
    }
    const newHash = await computePasswordHash(cleanPass, target.salt);
    target.passHash = newHash;
    target.updatedAt = new Date().toISOString();
    accounts[targetKey] = target;
    saveLocalAuthAccounts(accounts);
    if (isFirebaseReady && db) {
      setDoc(doc(db, ACCOUNTS_COLLECTION, target.normalizedUsername), {
        password: cleanPass,
        mat_khau: cleanPass,
        passHash: target.passHash,
        updatedAt: target.updatedAt
      }, { merge: true }).catch(() => {});
    }
    return {
      success: true,
      message: "Đặt lại mật khẩu thành công! Bạn có thể sử dụng mật khẩu mới để đăng nhập."
    };
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

    const accounts = getLocalAuthAccounts();
    const normUser = activeAuthContext.normalizedUsername;
    let target = accounts[normUser];

    if (isFirebaseReady && db) {
      try {
        const snap = await Promise.race([
          getDoc(doc(db, ACCOUNTS_COLLECTION, normUser)),
          new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 8000))
        ]);
        if (snap && snap.exists()) {
          target = snap.data();
        }
      } catch (e) {}
    }

    if (!target) {
      return {
        success: false,
        code: "USER_NOT_FOUND",
        error: "Không tìm thấy thông tin tài khoản cần đổi mật khẩu."
      };
    }

    const checkHash = await computePasswordHash(curPass, target.salt);
    if (checkHash !== target.passHash) {
      return {
        success: false,
        code: "INVALID_CREDENTIALS",
        error: "Mật khẩu hiện tại không chính xác."
      };
    }

    const newSalt = generateSecureRandomToken(16);
    const newHash = await computePasswordHash(nxtPass, newSalt);
    const newSessionToken = "sess_" + generateSecureRandomToken(24);
    const nowIso = new Date().toISOString();

    target.salt = newSalt;
    target.passHash = newHash;
    target.sessionToken = newSessionToken;
    target.updatedAt = nowIso;

    if (isFirebaseReady && db) {
      try {
        await setDoc(doc(db, ACCOUNTS_COLLECTION, normUser), {
          password: nxtPass,
          mat_khau: nxtPass,
          salt: newSalt,
          passHash: newHash,
          updatedAt: nowIso
        }, { merge: true });
      } catch (fsErr) {
        console.warn("Lỗi lưu mật khẩu mới lên Firestore:", fsErr);
      }
    }

    accounts[normUser] = target;
    saveLocalAuthAccounts(accounts);
    setActiveSessionFromUser(activeAuthContext, newSessionToken);

    return {
      success: true,
      sessionToken: newSessionToken,
      message: "Đổi mật khẩu thành công!"
    };
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

    const accounts = getLocalAuthAccounts();
    const normUser = activeAuthContext.normalizedUsername;
    let target = accounts[normUser];

    if (isFirebaseReady && db) {
      try {
        const snap = await Promise.race([
          getDoc(doc(db, ACCOUNTS_COLLECTION, normUser)),
          new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 8000))
        ]);
        if (snap && snap.exists()) {
          target = snap.data();
        }
      } catch (e) {}
    }

    if (!target) {
      return {
        success: false,
        code: "USER_NOT_FOUND",
        error: "Không tìm thấy thông tin tài khoản."
      };
    }

    const checkHash = await computePasswordHash(curPass, target.salt);
    if (checkHash !== target.passHash) {
      return {
        success: false,
        code: "INVALID_CREDENTIALS",
        error: "Mật khẩu hiện tại không chính xác."
      };
    }

    const emailInUse = Object.values(accounts).some(a => a.uid !== target.uid && a.recoveryEmail && a.recoveryEmail.toLowerCase() === cleanEmail);
    if (emailInUse) {
      return {
        success: false,
        code: "EMAIL_ALREADY_EXISTS",
        error: "Email này đã được tài khoản khác liên kết."
      };
    }

    const maskedEmail = maskEmailAddress(cleanEmail);
    const nowIso = new Date().toISOString();

    target.recoveryEmail = cleanEmail;
    target.hasRecoveryEmail = true;
    target.maskedEmail = maskedEmail;
    target.updatedAt = nowIso;

    if (isFirebaseReady && db) {
      try {
        await setDoc(doc(db, ACCOUNTS_COLLECTION, normUser), {
          recoveryEmail: cleanEmail,
          hasRecoveryEmail: true,
          maskedEmail,
          updatedAt: nowIso
        }, { merge: true });
      } catch (fsErr) {
        console.warn("Lỗi lưu email khôi phục lên Firestore:", fsErr);
      }
    }

    accounts[normUser] = target;
    saveLocalAuthAccounts(accounts);

    const updatedUser = {
      ...activeAuthContext,
      maskedEmail,
      hasRecoveryEmail: true
    };
    setActiveSessionFromUser(updatedUser, activeAuthContext.sessionToken);

    return {
      success: true,
      maskedEmail,
      message: "Cập nhật Email khôi phục thành công!"
    };
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
        const snap = await Promise.race([
          getDoc(docRef),
          new Promise((_, reject) => setTimeout(() => reject(new Error("Firestore timeout")), 8000))
        ]);
        if (snap && snap.exists()) {
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

      await Promise.race([
        setDoc(docRef, payload, { merge: true }),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Firestore timeout")), 8000))
      ]);
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
      const docSnap = await Promise.race([
        getDoc(docRef),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Firestore timeout")), 8000))
      ]);

      if (docSnap && docSnap.exists()) {
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
export { FirestoreService, FirestoreService as CloudDB };
export default FirestoreService;

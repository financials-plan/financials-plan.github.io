import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  collection,
  getDocs,
  updateDoc,
  deleteField,
  query,
  where,
  limit,
  runTransaction,
  onSnapshot
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
      ensureClassesRealtimeListener();
    }, 100);
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
  const userRole = user.role || (normUser === "admin" ? "admin" : (normUser === "dinh_anh_quan" ? "instructor" : "student"));

  activeAuthContext = Object.freeze({
    uid: String(user.uid),
    username: displayUser,
    displayUsername: displayUser,
    rawName: displayUser,
    ho_ten: displayUser,
    normalizedUsername: normUser,
    normalizedName: normUser,
    role: userRole,
    docId,
    maskedEmail: user.maskedEmail || "",
    hasRecoveryEmail: Boolean(user.hasRecoveryEmail),
    sessionToken: sessionToken || user.sessionToken || ""
  });
  return activeAuthContext;
}

function isUserElevated(ctxOrSession) {
  if (!ctxOrSession) return false;
  const role = String(ctxOrSession.role || "").toLowerCase();
  return role === "admin" || role === "instructor" || role === "teacher" || role === "quantri";
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

  const isElevatedRole = isUserElevated(activeAuthContext) || isUserElevated(storedSessionRaw);

  if (activeAuthContext) {
    const targetDoc = requestedDocId || activeAuthContext.docId;
    if (targetDoc !== activeAuthContext.docId && !isElevatedRole) {
      return {
        allowed: false,
        code: "PERMISSION_DENIED",
        error: "Từ chối truy cập: Bạn không được phép truy cập dữ liệu của tài khoản khác."
      };
    }
    if (storedSessionRaw && !isElevatedRole) {
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
      targetDocId: targetDoc,
      uid: activeAuthContext.uid,
      normalizedUsername: activeAuthContext.normalizedUsername,
      role: activeAuthContext.role,
      isElevated: isElevatedRole
    };
  }

  if (storedSessionRaw && storedSessionRaw.docId && !storedSessionRaw.uid) {
    const legacyNorm = storedSessionRaw.normalizedUsername || storedSessionRaw.normalizedName || normalizeUsername(storedSessionRaw.username || storedSessionRaw.rawName);
    const expectedLegacyDocId = `user_${legacyNorm}`;
    const targetDoc = requestedDocId || storedSessionRaw.docId;
    if (targetDoc !== storedSessionRaw.docId && (legacyNorm && !targetDoc.startsWith(expectedLegacyDocId)) && !isElevatedRole) {
      return {
        allowed: false,
        code: "PERMISSION_DENIED",
        error: "Từ chối truy cập: Không thể truy cập hồ sơ của người dùng khác."
      };
    }
    return {
      allowed: true,
      targetDocId: targetDoc,
      uid: "",
      normalizedUsername: legacyNorm,
      isLegacyUnbound: true,
      role: storedSessionRaw.role,
      isElevated: isElevatedRole
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
    allowed: true,
    targetDocId: requestedDocId,
    uid: "",
    normalizedUsername: ""
  };
}

// Tài khoản và mã mặc định (mật khẩu/mã công khai trong mã nguồn) đã bị gỡ bỏ vì lý do bảo mật.
const DEFAULT_SEEDED_ACCOUNTS = {};

const LOCAL_ADMIN_CODES_KEY = "FIN_APP_ADMIN_CODES_SECURE_V1";
const LOCAL_CLASSES_KEY = "FIN_APP_CLASSES_SECURE_V1";
const ADMIN_CODES_COLLECTION = "admin_codes";
const CLASSES_COLLECTION = "classes";
const GROUPS_COLLECTION = "groups";
const FINANCIAL_AUTH_COLLECTION = firestoreSettings.collectionName || "financial_Authentication";

const CLOUD_TIMEOUT_MS = 12000;
const LEGACY_AGGREGATE_DOC_IDS = ["groups", "class", "class_index"];

function withTimeout(promise, ms = CLOUD_TIMEOUT_MS) {
  let timer = null;
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      timer = setTimeout(() => reject(Object.assign(new Error("Firestore timeout"), { code: "timeout" })), ms);
    })
  ]).finally(() => clearTimeout(timer));
}

const RESERVED_USERNAMES = new Set(["admin", "administrator", "root", "system", "qtv", "superadmin"]);

function getCallerContext() {
  if (activeAuthContext) {
    return { role: activeAuthContext.role || "student", username: activeAuthContext.normalizedUsername || "" };
  }
  try {
    const s = JSON.parse(localStorage.getItem("FIN_APP_USER_SESSION") || "null");
    if (s) {
      return { role: s.role || "student", username: normalizeUsername(s.normalizedUsername || s.username || s.rawName || "") };
    }
  } catch (e) {}
  return { role: null, username: "" };
}

function permissionDenied(action, allowedLabel) {
  return {
    success: false,
    code: "PERMISSION_DENIED",
    error: `Từ chối: "${action}" chỉ dành cho ${allowedLabel}.`
  };
}

function requireAdminRole(action) {
  return getCallerContext().role === "admin" ? null : permissionDenied(action, "Quản trị viên");
}

function requireStaffRole(action) {
  const role = getCallerContext().role;
  return (role === "admin" || role === "instructor") ? null : permissionDenied(action, "Quản trị viên hoặc Giảng viên");
}

function canManageClassRecord(cls) {
  const caller = getCallerContext();
  if (caller.role === "admin") return true;
  if (caller.role === "instructor" && cls) {
    return normalizeUsername(cls.instructorUsername || "") === caller.username;
  }
  return false;
}

function visibleClassesForCaller(list) {
  const caller = getCallerContext();
  const arr = Array.isArray(list) ? list : Object.values(list || {});
  if (caller.role === "admin") return arr;
  if (caller.role === "instructor") {
    return arr.filter(c => normalizeUsername(c.instructorUsername || "") === caller.username);
  }
  return arr.filter(c => (c.members || []).some(m => normalizeUsername(m && (m.username || m.normalizedUsername || m.studentId || m.id)) === caller.username));
}

function sanitizeDisplayName(raw, fallback = "") {
  const clean = String(raw || "")
    .replace(/[\u0000-\u001f\u007f<>]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 64);
  return clean || fallback;
}

function describeCloudError(err) {
  const code = String((err && err.code) || "");
  if (code.includes("permission-denied")) {
    return "Firestore từ chối quyền truy cập. Hãy kiểm tra Firestore Rules đã được deploy đúng bản trong backend/firestore.rules chưa.";
  }
  if (code === "timeout" || code.includes("unavailable") || code.includes("deadline-exceeded")) {
    return "Không kết nối được tới Cloud Firestore. Vui lòng kiểm tra mạng và thử lại.";
  }
  return (err && err.message) ? err.message : "Lỗi không xác định khi kết nối Cloud Firestore.";
}

function isRealClassRecord(data) {
  return Boolean(data && typeof data === "object"
    && typeof data.id === "string" && !LEGACY_AGGREGATE_DOC_IDS.includes(data.id)
    && typeof data.code === "string" && data.code);
}

function cacheClassLocally(cls) {
  const local = getLocalClasses();
  local[cls.id] = cls;
  saveLocalClasses(local);
}

function removeClassFromLocalCache(classId) {
  const local = getLocalClasses();
  if (local[classId]) {
    delete local[classId];
    saveLocalClasses(local);
  }
}

function normalizeMaxMembers(raw, fallback = 40) {
  if (raw === 0 || raw === "0" || raw === "no-limit") return 0;
  return parseInt(raw, 10) || fallback;
}

function mergeMembersList(listA = [], listB = []) {
  const map = new Map();
  (listA || []).forEach(m => {
    if (m && (m.username || m.normalizedUsername || m.studentId || m.id)) {
      const rawUser = m.username || m.normalizedUsername || m.studentId || m.id;
      const u = normalizeUsername(rawUser);
      map.set(u, { ...m, username: u });
    }
  });
  (listB || []).forEach(m => {
    if (m && (m.username || m.normalizedUsername || m.studentId || m.id)) {
      const rawUser = m.username || m.normalizedUsername || m.studentId || m.id;
      const u = normalizeUsername(rawUser);
      const existing = map.get(u);
      if (!existing) {
        map.set(u, { ...m, username: u });
      } else {
        let finalStatus = existing.status || "pending";
        if (existing.status === "approved" || m.status === "approved") {
          finalStatus = "approved";
        } else if (existing.status === "rejected" || m.status === "rejected") {
          const dateExisting = existing.joinedAt ? new Date(existing.joinedAt).getTime() : 0;
          const dateM = m.joinedAt ? new Date(m.joinedAt).getTime() : 0;
          finalStatus = (dateM >= dateExisting ? m.status : existing.status) || "pending";
        } else {
          finalStatus = "pending";
        }
        map.set(u, {
          ...existing,
          ...m,
          username: u,
          name: m.name || existing.name || u,
          status: finalStatus,
          joinedAt: existing.joinedAt || m.joinedAt || new Date().toISOString()
        });
      }
    }
  });
  return Array.from(map.values());
}

function mergeClassRecord(c1, c2) {
  if (!c1 && !c2) return null;
  if (!c1) return c2;
  if (!c2) return c1;
  const mergedMembers = mergeMembersList(c1.members, c2.members);
  const date1 = c1.updatedAt ? new Date(c1.updatedAt).getTime() : 0;
  const date2 = c2.updatedAt ? new Date(c2.updatedAt).getTime() : 0;
  const primary = date2 >= date1 ? c2 : c1;
  const secondary = date2 >= date1 ? c1 : c2;
  return {
    ...secondary,
    ...primary,
    id: c1.id || c2.id,
    code: primary.code || secondary.code,
    name: primary.name || secondary.name,
    status: primary.status || secondary.status || "active",
    isPrivate: primary.isPrivate !== undefined ? primary.isPrivate : secondary.isPrivate,
    members: mergedMembers,
    updatedAt: new Date(Math.max(date1, date2, Date.now())).toISOString()
  };
}

let classesRealtimeUnsubscribe = null;

const LOGIN_STAMP_MIN_INTERVAL_MS = 10 * 60 * 1000;
const CLASSES_CACHE_TTL_MS = 45000;
let classesCache = { at: 0, user: "", value: null };
let classesInflight = null;
let classesGen = 0;

function ensureClassesRealtimeListener() {
  const role = getCallerContext().role;
  if (role !== "admin" && role !== "instructor") return;
  if (!classesRealtimeUnsubscribe) setupClassesRealtimeListener();
}

function setupClassesRealtimeListener() {
  if (!isFirebaseReady || !db) return;
  if (classesRealtimeUnsubscribe) {
    try { classesRealtimeUnsubscribe(); } catch (e) {}
    classesRealtimeUnsubscribe = null;
  }

  try {
    const q = collection(db, CLASSES_COLLECTION);
    classesRealtimeUnsubscribe = onSnapshot(q, (snapshot) => {
      const remoteAll = {};
      snapshot.forEach(d => {
        const data = { ...d.data(), id: d.id };
        if (isRealClassRecord(data)) {
          remoteAll[d.id] = data;
        }
      });
      const remote = omitDeletedClasses(remoteAll);

      const local = getLocalClasses();
      const allIds = new Set([...Object.keys(local), ...Object.keys(remote)]);
      const cache = {};
      allIds.forEach(id => {
        cache[id] = mergeClassRecord(local[id], remote[id]);
      });
      saveLocalClasses(cache);

      const classesList = visibleClassesForCaller(Object.values(cache));
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("cloud-classes-updated", { detail: classesList }));
      }
    }, (error) => {
      console.warn("[CloudDB] onSnapshot classes realtime error:", error);
    });
  } catch (err) {
    console.warn("[CloudDB] Khong the khoi tao realtime listener cho classes:", err);
  }
}

async function findClassesByCode(cleanCode) {
  const code = String(cleanCode || "").trim().toUpperCase();
  if (!code) return [];
  const list = [];
  const seenIds = new Set();

  const addIfValid = (data) => {
    if (isRealClassRecord(data)) {
      if (seenIds.has(data.id)) {
        const existingIdx = list.findIndex(x => x.id === data.id);
        if (existingIdx !== -1) {
          list[existingIdx] = mergeClassRecord(list[existingIdx], data);
        }
      } else {
        seenIds.add(data.id);
        list.push(data);
      }
    }
  };

  if (isFirebaseReady && db) {
    try {
      const gcSnap = await withTimeout(getDoc(doc(db, "group_codes", code)), 4000).catch(() => null);
      if (gcSnap && gcSnap.exists()) {
        const gc = gcSnap.data();
        if (gc && gc.classId) {
          const cSnap = await withTimeout(getDoc(doc(db, CLASSES_COLLECTION, gc.classId)), 4000).catch(() => null);
          if (cSnap && cSnap.exists()) addIfValid({ ...cSnap.data(), id: cSnap.id });
          const gSnap = await withTimeout(getDoc(doc(db, GROUPS_COLLECTION, gc.classId)), 4000).catch(() => null);
          if (gSnap && gSnap.exists()) addIfValid({ ...gSnap.data(), id: gSnap.id });
        }
      }
    } catch (e) {}

    try {
      const snap = await withTimeout(getDocs(query(
        collection(db, CLASSES_COLLECTION),
        where("code", "==", code),
        limit(10)
      )), 5000).catch(() => null);
      if (snap) {
        snap.forEach(d => addIfValid({ ...d.data(), id: d.id }));
      }
    } catch (e) {}

    try {
      const gSnap = await withTimeout(getDocs(query(
        collection(db, GROUPS_COLLECTION),
        where("code", "==", code),
        limit(10)
      )), 5000).catch(() => null);
      if (gSnap) {
        gSnap.forEach(d => addIfValid({ ...d.data(), id: d.id }));
      }
    } catch (e) {}

    const aggRefs = [
      doc(db, FINANCIAL_AUTH_COLLECTION, "groups"),
      doc(db, CLASSES_COLLECTION, "groups"),
      doc(db, GROUPS_COLLECTION, "groups"),
      doc(db, FINANCIAL_AUTH_COLLECTION, "class"),
      doc(db, CLASSES_COLLECTION, "class")
    ];
    for (const aRef of aggRefs) {
      try {
        const aSnap = await withTimeout(getDoc(aRef), 3000).catch(() => null);
        if (aSnap && aSnap.exists()) {
          const aData = aSnap.data();
          if (aData && aData.classes && typeof aData.classes === "object") {
            for (const cid of Object.keys(aData.classes)) {
              const c = aData.classes[cid];
              if (c && c.code === code) addIfValid(c);
            }
          }
        }
      } catch (e) {}
    }
  }

  const local = getLocalClasses();
  Object.values(local).forEach(c => {
    if (c && c.code === code) addIfValid(c);
  });

  return list;
}

async function syncClassesStoreToFirestore(classId, classData, isDeleted = false) {
  if (!isFirebaseReady || !db) throw new Error("Firebase chưa được cấu hình.");
  const ref = doc(db, CLASSES_COLLECTION, classId);
  const local = getLocalClasses();
  if (!isDeleted) {
    if (classData) local[classId] = classData;
    saveLocalClasses(local);

    await withTimeout(setDoc(ref, classData, { merge: true }));
    const payload = { id: "groups", updatedAt: new Date().toISOString(), classes: local || {} };
    const classPayload = { id: "class", updatedAt: new Date().toISOString(), classes: local || {} };
    const codePayload = {
      id: classData.code,
      classId,
      code: classData.code,
      name: classData.name,
      instructorUsername: classData.instructorUsername,
      instructorName: classData.instructorName,
      status: classData.status,
      updatedAt: new Date().toISOString()
    };
    await withTimeout(Promise.allSettled([
      setDoc(doc(db, GROUPS_COLLECTION, classId), classData, { merge: true }),
      setDoc(doc(db, "group_codes", classData.code), codePayload, { merge: true }),
      setDoc(doc(db, FINANCIAL_AUTH_COLLECTION, "groups"), payload, { merge: true }),
      setDoc(doc(db, CLASSES_COLLECTION, "groups"), payload, { merge: true }),
      setDoc(doc(db, GROUPS_COLLECTION, "groups"), payload, { merge: true }),
      setDoc(doc(db, CLASSES_COLLECTION, "class"), classPayload, { merge: true }),
      setDoc(doc(db, FINANCIAL_AUTH_COLLECTION, "class"), classPayload, { merge: true })
    ])).catch(() => {});
    return;
  }
  delete local[classId];
  saveLocalClasses(local);
  await withTimeout(deleteDoc(ref));
  const legacyAggregates = [
    doc(db, FINANCIAL_AUTH_COLLECTION, "groups"),
    doc(db, CLASSES_COLLECTION, "groups"),
    doc(db, CLASSES_COLLECTION, "class"),
    doc(db, GROUPS_COLLECTION, "groups"),
    doc(db, FINANCIAL_AUTH_COLLECTION, "class")
  ];
  await withTimeout(Promise.allSettled([
    deleteDoc(doc(db, GROUPS_COLLECTION, classId)),
    ...legacyAggregates.map(r => updateDoc(r, { [`classes.${classId}`]: deleteField() }))
  ])).catch(() => {});
}

async function mutateClassInCloud(classId, mutator, options = {}) {
  const local = getLocalClasses();
  let cls = local[classId] ? JSON.parse(JSON.stringify(local[classId])) : null;

  if (isFirebaseReady && db) {
    try {
      const cRef = doc(db, CLASSES_COLLECTION, classId);
      const cSnap = await withTimeout(getDoc(cRef), 5000).catch(() => null);
      if (cSnap && cSnap.exists()) {
        const cData = { ...cSnap.data(), id: cSnap.id };
        cls = cls ? mergeClassRecord(cls, cData) : cData;
      }
    } catch (e) {}

    try {
      const gRef = doc(db, GROUPS_COLLECTION, classId);
      const gSnap = await withTimeout(getDoc(gRef), 5000).catch(() => null);
      if (gSnap && gSnap.exists()) {
        const gData = { ...gSnap.data(), id: gSnap.id };
        cls = cls ? mergeClassRecord(cls, gData) : gData;
      }
    } catch (e) {}
  }

  if (!cls) {
    return { success: false, error: "Không tìm thấy nhóm trên Cloud hoặc bộ nhớ cục bộ (có thể nhóm chưa được đồng bộ hoặc đã bị xóa)." };
  }

  if (options.requireManage && !canManageClassRecord(cls)) {
    return permissionDenied("Quản lý nhóm này", "Quản trị viên hoặc Giảng viên phụ trách nhóm");
  }

  const prevMembers = Array.isArray(cls.members) ? cls.members.slice() : [];
  const out = mutator(cls);
  if (out && out.success === false) return out;

  cls.updatedAt = new Date().toISOString();
  if (!Array.isArray(cls.members)) cls.members = [];

  local[classId] = cls;
  saveLocalClasses(local);

  if (!isFirebaseReady || !db) {
    return { success: true, class: cls, ...(out && typeof out === "object" ? out : {}) };
  }

  try {
    await syncClassesStoreToFirestore(classId, cls, false);

    const currentMemberUsernames = new Set(cls.members.map(m => normalizeUsername(m.username)));
    const removedMembers = prevMembers.filter(m => !currentMemberUsernames.has(normalizeUsername(m.username)));
    const writePromises = [];

    cls.members.forEach(m => {
      const u = normalizeUsername(m.username);
      if (!u) return;
      const memberDoc = {
        username: u,
        name: m.name || u,
        status: m.status || "pending",
        joinedAt: m.joinedAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        classId,
        className: cls.name,
        classCode: cls.code
      };
      writePromises.push(
        setDoc(doc(db, CLASSES_COLLECTION, classId, "members", u), memberDoc, { merge: true }),
        setDoc(doc(db, GROUPS_COLLECTION, classId, "members", u), memberDoc, { merge: true }),
        setDoc(doc(db, "users", u), {
          enrolledClasses: {
            [classId]: {
              classId,
              code: cls.code,
              name: cls.name,
              status: m.status || "pending",
              joinedAt: m.joinedAt || new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          }
        }, { merge: true }).catch(() => {}),
        setDoc(doc(db, FINANCIAL_AUTH_COLLECTION, "user_" + u), {
          enrolledClasses: {
            [classId]: {
              classId,
              code: cls.code,
              name: cls.name,
              status: m.status || "pending",
              joinedAt: m.joinedAt || new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          }
        }, { merge: true }).catch(() => {})
      );
    });

    removedMembers.forEach(m => {
      const u = normalizeUsername(m.username);
      if (!u) return;
      writePromises.push(
        deleteDoc(doc(db, CLASSES_COLLECTION, classId, "members", u)).catch(() => {}),
        deleteDoc(doc(db, GROUPS_COLLECTION, classId, "members", u)).catch(() => {}),
        updateDoc(doc(db, "users", u), { [`enrolledClasses.${classId}`]: deleteField() }).catch(() => {}),
        updateDoc(doc(db, FINANCIAL_AUTH_COLLECTION, "user_" + u), { [`enrolledClasses.${classId}`]: deleteField() }).catch(() => {})
      );
    });

    await withTimeout(Promise.allSettled(writePromises), 10000).catch(() => {});
    cacheClassLocally(cls);
    return { success: true, class: cls, ...(out && typeof out === "object" ? out : {}) };
  } catch (err) {
    console.warn("Lưu thay đổi lớp học lên Cloud thất bại, đã bảo lưu cục bộ:", err);
    return {
      success: true,
      localOnly: true,
      class: cls,
      ...(out && typeof out === "object" ? out : {}),
      warning: "Đã lưu cục bộ: " + describeCloudError(err)
    };
  }
}

const DEFAULT_ADMIN_CODES = {};
const PUBLISHED_ADMIN_CODES_BLOCKLIST = new Set(["ADMN-2026-X8Y9", "INST-2026-K48A", "INST-2026-K48B", "EXPD-2025-0001", "RVKD-2026-9999"]);

const DEFAULT_CLASSES = {};

function getLocalAdminCodes() {
  let codes = {};
  try {
    const raw = localStorage.getItem(LOCAL_ADMIN_CODES_KEY);
    codes = raw ? JSON.parse(raw) : {};
  } catch (e) {
    codes = {};
  }
  let modified = false;
  [...PUBLISHED_ADMIN_CODES_BLOCKLIST].forEach(oldKey => {
    if (codes[oldKey]) {
      delete codes[oldKey];
      modified = true;
    }
  });
  Object.keys(DEFAULT_ADMIN_CODES).forEach(k => {
    if (!codes[k] || codes[k].maxUses !== DEFAULT_ADMIN_CODES[k].maxUses || codes[k].expiresAt !== DEFAULT_ADMIN_CODES[k].expiresAt) {
      codes[k] = { ...DEFAULT_ADMIN_CODES[k] };
      modified = true;
    }
  });
  if (modified) {
    saveLocalAdminCodes(codes);
  }
  return codes;
}

function saveLocalAdminCodes(codes) {
  try {
    localStorage.setItem(LOCAL_ADMIN_CODES_KEY, JSON.stringify(codes || {}));
  } catch (e) {}
}

const DELETED_CLASSES_KEY = "FIN_APP_DELETED_CLASSES_V1";

function getDeletedClassIds() {
  try {
    const arr = JSON.parse(localStorage.getItem(DELETED_CLASSES_KEY) || "[]");
    return new Set(Array.isArray(arr) ? arr : []);
  } catch (e) {
    return new Set();
  }
}

function markClassDeleted(classId, deleted = true) {
  classesCache = { at: 0, user: "", value: null };
  classesGen++;
  const ids = getDeletedClassIds();
  if (deleted) ids.add(classId); else ids.delete(classId);
  try {
    localStorage.setItem(DELETED_CLASSES_KEY, JSON.stringify([...ids].slice(-200)));
  } catch (e) {}
}

function omitDeletedClasses(classMap) {
  const dead = getDeletedClassIds();
  const out = {};
  Object.keys(classMap || {}).forEach(id => {
    if (!dead.has(id)) out[id] = classMap[id];
  });
  return out;
}

function getLocalClasses() {
  let classes = {};
  try {
    const raw = localStorage.getItem(LOCAL_CLASSES_KEY);
    classes = raw ? JSON.parse(raw) : {};
  } catch (e) {
    classes = {};
  }
  classes = omitDeletedClasses(classes);
  let modified = false;
  if (classes["cls_k48"]) {
    delete classes["cls_k48"];
    modified = true;
  }
  Object.keys(DEFAULT_CLASSES).forEach(k => {
    if (!classes[k]) {
      classes[k] = JSON.parse(JSON.stringify(DEFAULT_CLASSES[k]));
      modified = true;
    }
  });
  if (modified) {
    saveLocalClasses(classes);
  }
  return classes;
}

function saveLocalClasses(classes, keepCache = false) {
  if (!keepCache) {
    classesCache = { at: 0, user: "", value: null };
    classesGen++;
  }
  try {
    localStorage.setItem(LOCAL_CLASSES_KEY, JSON.stringify(omitDeletedClasses(classes)));
  } catch (e) {}
}

function getLocalAuthAccounts() {
  let accounts = {};
  try {
    const raw = localStorage.getItem(LOCAL_AUTH_STORAGE_KEY);
    accounts = raw ? JSON.parse(raw) : {};
  } catch (e) {
    accounts = {};
  }
  let modified = false;
  Object.keys(accounts).forEach(k => {
    const acc = accounts[k];
    if (acc && typeof acc === "object" && acc.passHash && (acc.password !== undefined || acc.mat_khau !== undefined)) {
      delete acc.password;
      delete acc.mat_khau;
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

const PBKDF2_ITERATIONS = 150000;
const PBKDF2_ALGO_TAG = "pbkdf2-sha256";

async function computePasswordHashPbkdf2(password, salt) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(String(password)), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: enc.encode(String(salt)), iterations: PBKDF2_ITERATIONS },
    key,
    256
  );
  return Array.from(new Uint8Array(bits)).map(b => b.toString(16).padStart(2, "0")).join("");
}

function canUsePbkdf2() {
  return typeof crypto !== "undefined" && crypto.subtle && typeof crypto.subtle.deriveBits === "function" && typeof TextEncoder !== "undefined";
}

// Trả về { passHash, hashAlgo } để lưu: dùng PBKDF2 khi trình duyệt hỗ trợ, ngược lại dùng băm cũ.
async function hashPasswordForStorage(password, salt) {
  if (canUsePbkdf2()) {
    try {
      return { passHash: await computePasswordHashPbkdf2(password, salt), hashAlgo: PBKDF2_ALGO_TAG };
    } catch (e) {}
  }
  return { passHash: await computePasswordHash(password, salt), hashAlgo: "" };
}

// Kiểm tra mật khẩu với bản ghi tài khoản (hỗ trợ cả băm cũ SHA-256 và PBKDF2).
async function verifyStoredPassword(password, record) {
  if (!record || !record.salt || !record.passHash) return false;
  if (record.hashAlgo === PBKDF2_ALGO_TAG) {
    if (!canUsePbkdf2()) return false;
    try {
      return (await computePasswordHashPbkdf2(password, record.salt)) === record.passHash;
    } catch (e) {
      return false;
    }
  }
  const legacy = await computePasswordHash(password, record.salt);
  return legacy === record.passHash || (Boolean(record.altPassHash) && legacy === record.altPassHash);
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

function withFirestoreTimeout(promise, ms = 8000) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error("Firestore timeout")), ms))
  ]);
}

function mergeBackupLists(...lists) {
  const mergedMap = new Map();
  lists.flat().forEach(b => {
    if (b && b.id && !mergedMap.has(b.id)) mergedMap.set(b.id, b);
  });
  return Array.from(mergedMap.values()).sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
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
    const norm = normalizeUsername(storedUser.normalizedUsername || storedUser.username || storedUser.displayUsername);
    let role = storedUser.role;
    if (!role) {
      const localAccs = getLocalAuthAccounts();
      if (localAccs && localAccs[norm] && localAccs[norm].role) {
        role = localAccs[norm].role;
      }
    }
    if (!role) role = "student";
    storedUser.role = role;
    if (storedUser.uid || storedUser.docId) {
      const token = storedUser.sessionToken || ("sess_" + (storedUser.uid || storedUser.docId || Date.now()));
      const ctx = setActiveSessionFromUser(storedUser, token);
      if (isFirebaseReady && db && norm) {
        getDoc(doc(db, ACCOUNTS_COLLECTION, norm)).then(snap => {
          if (snap && snap.exists()) {
            const data = snap.data();
            if (data && data.role && data.role !== ctx.role) {
              storedUser.role = data.role;
              setActiveSessionFromUser(storedUser, token);
              try {
                const s = localStorage.getItem("FIN_APP_USER_SESSION");
                if (s) {
                  const p = JSON.parse(s);
                  p.role = data.role;
                  localStorage.setItem("FIN_APP_USER_SESSION", JSON.stringify(p));
                }
              } catch (e) {}
              if (window.UserSession && typeof window.UserSession.updateUI === "function") {
                if (window.UserSession.currentUser) window.UserSession.currentUser.role = data.role;
                window.UserSession.updateUI();
              }
            }
          }
        }).catch(() => {});
      }
      return ctx;
    }
    return null;
  },

  async registerAccount(username, password, recoveryEmail = "", adminCode = "") {
    const rawUsername = String(username || "").trim();
    const cleanPass = String(password || "");
    const cleanEmail = String(recoveryEmail || "").trim().toLowerCase();
    const cleanAdminCode = String(adminCode || "").trim().toUpperCase();

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

    if (RESERVED_USERNAMES.has(normalizedUsername)) {
      return {
        success: false,
        code: "RESERVED_USERNAME",
        error: "Username này được hệ thống giữ chỗ. Vui lòng chọn Username khác."
      };
    }

    let assignedRole = "student";
    if (cleanAdminCode) {
      if (!/^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(cleanAdminCode)) {
        return {
          success: false,
          code: "INVALID_ADMIN_CODE_FORMAT",
          error: "Mã Quản trị không đúng định dạng XXXX-XXXX-XXXX."
        };
      }

      let codeRec = null;
      if (isFirebaseReady && db) {
        try {
          const cSnap = await Promise.race([
            getDoc(doc(db, ADMIN_CODES_COLLECTION, cleanAdminCode)),
            new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 8000))
          ]);
          if (cSnap && cSnap.exists()) {
            codeRec = cSnap.data();
          }
        } catch (e) {}
      }

      if (!codeRec) {
        const localCodes = getLocalAdminCodes();
        codeRec = localCodes[cleanAdminCode];
      }

      if (PUBLISHED_ADMIN_CODES_BLOCKLIST.has(cleanAdminCode) || !codeRec || codeRec.isRevoked || Date.now() > new Date(codeRec.expiresAt).getTime() || (codeRec.usedCount || 0) >= (codeRec.maxUses || 1)) {
        return {
          success: false,
          code: "INVALID_ADMIN_CODE",
          error: "Mã Quản trị không hợp lệ, đã bị thu hồi hoặc đã hết lượt sử dụng."
        };
      }

      assignedRole = codeRec.role || "instructor";
      codeRec.usedCount = (codeRec.usedCount || 0) + 1;
      codeRec.lastUsedAt = new Date().toISOString();
      codeRec.lastUsedBy = normalizedUsername;

      if (isFirebaseReady && db) {
        try {
          await withTimeout(setDoc(doc(db, ADMIN_CODES_COLLECTION, cleanAdminCode), codeRec, { merge: true }));
        } catch (codeErr) {
          return {
            success: false,
            code: "ADMIN_CODE_NOT_RECORDED",
            error: "Chưa ghi nhận được việc dùng mã lên Cloud nên chưa thể đăng ký bằng mã này: " + describeCloudError(codeErr)
          };
        }
      }
      const allLocalCodes = getLocalAdminCodes();
      allLocalCodes[cleanAdminCode] = codeRec;
      saveLocalAdminCodes(allLocalCodes);
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
    const { passHash, hashAlgo } = await hashPasswordForStorage(cleanPass, salt);
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
      role: assignedRole,
      recoveryEmail: cleanEmail || null,
      maskedEmail,
      hasRecoveryEmail: Boolean(cleanEmail),
      salt,
      passHash,
      hashAlgo,
      docId,
      createdAt: nowIso,
      updatedAt: nowIso,
      lastLoginAt: nowIso
    };

    if (isFirebaseReady && db) {
      try {
        const userProfile = {
          uid: newRecord.uid,
          username: normalizedUsername,
          displayName: rawUsername,
          role: assignedRole,
          recoveryEmail: cleanEmail || null,
          maskedEmail,
          hasRecoveryEmail: Boolean(cleanEmail),
          createdAt: nowIso,
          updatedAt: nowIso,
          lastLoginAt: nowIso,
          schemaVersion: 3,
          groups: {}
        };
        await Promise.race([
          Promise.allSettled([
            setDoc(doc(db, ACCOUNTS_COLLECTION, normalizedUsername), newRecord, { merge: true }),
            setDoc(doc(db, "users", normalizedUsername), userProfile, { merge: true }),
            setDoc(doc(db, "accounts", normalizedUsername), newRecord, { merge: true })
          ]),
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
        } else {
          const uSnap = await getDoc(doc(db, "users", normalizedUsername)).catch(() => null);
          const accSnap = await getDoc(doc(db, "accounts", normalizedUsername)).catch(() => null);
          if (accSnap && accSnap.exists()) {
            target = accSnap.data();
            accounts[normalizedUsername] = target;
            saveLocalAuthAccounts(accounts);
          } else if (uSnap && uSnap.exists()) {
            const uData = uSnap.data();
            target = { ...uData, normalizedUsername };
            accounts[normalizedUsername] = target;
            saveLocalAuthAccounts(accounts);
          }
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

    const hashMatches = await verifyStoredPassword(cleanPass, target);
    const legacyPlaintextMatches = !target.passHash && (
      (target.password && target.password === cleanPass) ||
      (target.mat_khau && target.mat_khau === cleanPass)
    );
    const isPassValid = hashMatches || legacyPlaintextMatches;
    if (!isPassValid) {
      recordClientLoginFailure(normalizedUsername);
      return {
        success: false,
        code: "INVALID_CREDENTIALS",
        error: "Username hoặc mật khẩu không chính xác."
      };
    }

    clearClientLoginFailures(normalizedUsername);

    const needsHashUpgrade = legacyPlaintextMatches || (hashMatches && target.hashAlgo !== PBKDF2_ALGO_TAG && canUsePbkdf2());
    if (needsHashUpgrade) {
      target.salt = generateSecureRandomToken(16);
      const upgraded = await hashPasswordForStorage(cleanPass, target.salt);
      target.passHash = upgraded.passHash;
      target.hashAlgo = upgraded.hashAlgo;
      delete target.altPassHash;
    }
    const hadLegacyPlaintext = Boolean(target.password || target.mat_khau);
    delete target.password;
    delete target.mat_khau;

    const sessionToken = "sess_" + generateSecureRandomToken(24);
    const prevLoginMs = Date.parse(target.lastLoginAt || "") || 0;
    target.sessionToken = sessionToken;
    target.lastLoginAt = new Date().toISOString();
    target.updatedAt = target.lastLoginAt;

    const stampRecently = Date.now() - prevLoginMs < LOGIN_STAMP_MIN_INTERVAL_MS;
    if (isFirebaseReady && db && (needsHashUpgrade || hadLegacyPlaintext || !stampRecently)) {
      const stampPayload = {
        password: deleteField(),
        mat_khau: deleteField(),
        lastLoginAt: target.lastLoginAt,
        updatedAt: target.updatedAt
      };
      if (needsHashUpgrade) {
        stampPayload.salt = target.salt;
        stampPayload.passHash = target.passHash;
        stampPayload.hashAlgo = target.hashAlgo;
        stampPayload.altPassHash = deleteField();
      }
      Promise.allSettled([
        setDoc(doc(db, ACCOUNTS_COLLECTION, normalizedUsername), stampPayload, { merge: true }),
        setDoc(doc(db, "accounts", normalizedUsername), stampPayload, { merge: true }),
        setDoc(doc(db, "users", normalizedUsername), { lastLoginAt: target.lastLoginAt, updatedAt: target.updatedAt }, { merge: true })
      ]).catch(() => {});
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

  async resetPasswordWithNewPass() {
    return {
      success: false,
      code: "SELF_SERVICE_RESET_DISABLED",
      error: "Tính năng đặt lại mật khẩu trực tiếp đã tắt vì hệ thống chưa xác minh được chủ tài khoản. Vui lòng liên hệ Quản trị viên hoặc Giảng viên phụ trách để được cấp lại mật khẩu."
    };
  },

  async adminResetPassword(targetUsername, newPassword) {
    const denied = requireStaffRole("Cấp lại mật khẩu cho học viên");
    if (denied) return denied;
    const normUser = normalizeUsername(targetUsername);
    const nxtPass = String(newPassword || "");
    if (!normUser || RESERVED_USERNAMES.has(normUser)) {
      return { success: false, error: "Tên đăng nhập không hợp lệ." };
    }
    if (nxtPass.length < 6) {
      return { success: false, code: "WEAK_PASSWORD", error: "Mật khẩu mới phải có tối thiểu 6 ký tự." };
    }
    const caller = getCallerContext();
    let target = null;
    if (isFirebaseReady && db) {
      try {
        const snap = await withTimeout(getDoc(doc(db, ACCOUNTS_COLLECTION, normUser)), 8000);
        if (snap && snap.exists()) target = snap.data();
      } catch (e) {}
    }
    if (!target) target = getLocalAuthAccounts()[normUser] || null;
    if (!target) {
      return { success: false, code: "ACCOUNT_NOT_FOUND", error: "Không tìm thấy tài khoản này." };
    }
    if (caller.role !== "admin" && (target.role === "admin" || target.role === "instructor")) {
      return permissionDenied("Cấp lại mật khẩu cho tài khoản quản trị/giảng viên", "Quản trị viên");
    }
    const newSalt = generateSecureRandomToken(16);
    const { passHash: newHash, hashAlgo: newAlgo } = await hashPasswordForStorage(nxtPass, newSalt);
    const nowIso = new Date().toISOString();
    if (isFirebaseReady && db) {
      try {
        await withTimeout(setDoc(doc(db, ACCOUNTS_COLLECTION, normUser), {
          password: deleteField(),
          mat_khau: deleteField(),
          salt: newSalt,
          passHash: newHash,
          hashAlgo: newAlgo,
          altPassHash: deleteField(),
          updatedAt: nowIso
        }, { merge: true }));
      } catch (err) {
        return { success: false, error: "Chưa cấp lại được mật khẩu trên Cloud: " + describeCloudError(err) };
      }
    }
    const accounts = getLocalAuthAccounts();
    if (accounts[normUser]) {
      accounts[normUser].salt = newSalt;
      accounts[normUser].passHash = newHash;
      accounts[normUser].hashAlgo = newAlgo;
      delete accounts[normUser].altPassHash;
      delete accounts[normUser].password;
      delete accounts[normUser].mat_khau;
      saveLocalAuthAccounts(accounts);
    }
    return { success: true, message: "Đã cấp lại mật khẩu cho tài khoản " + normUser + "." };
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

    if (!(await verifyStoredPassword(curPass, target))) {
      return {
        success: false,
        code: "INVALID_CREDENTIALS",
        error: "Mật khẩu hiện tại không chính xác."
      };
    }

    const newSalt = generateSecureRandomToken(16);
    const { passHash: newHash, hashAlgo: newAlgo } = await hashPasswordForStorage(nxtPass, newSalt);
    const newSessionToken = "sess_" + generateSecureRandomToken(24);
    const nowIso = new Date().toISOString();

    if (isFirebaseReady && db) {
      try {
        await withTimeout(setDoc(doc(db, ACCOUNTS_COLLECTION, normUser), {
          password: deleteField(),
          mat_khau: deleteField(),
          salt: newSalt,
          passHash: newHash,
          hashAlgo: newAlgo,
          altPassHash: deleteField(),
          updatedAt: nowIso
        }, { merge: true }));
      } catch (fsErr) {
        return {
          success: false,
          code: "CLOUD_WRITE_FAILED",
          error: "Chưa đổi được mật khẩu trên Cloud nên mật khẩu cũ vẫn còn hiệu lực: " + describeCloudError(fsErr)
        };
      }
    }

    target.salt = newSalt;
    target.passHash = newHash;
    target.hashAlgo = newAlgo;
    delete target.altPassHash;
    delete target.password;
    delete target.mat_khau;
    target.sessionToken = newSessionToken;
    target.updatedAt = nowIso;

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

    if (!(await verifyStoredPassword(curPass, target))) {
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
    if (typeof window !== "undefined" && window.isReadOnlyStudentView) {
      return {
        success: false,
        code: "PERMISSION_DENIED",
        error: "Từ chối ghi dữ liệu: Đang ở chế độ xem bài học viên chỉ đọc.",
        message: "Không thể lưu dữ liệu khi đang ở chế độ chỉ đọc."
      };
    }

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
          if (existingLocal && existingLocal.owner_uid && existingLocal.owner_uid !== access.uid && !access.isElevated && activeAuthContext?.role !== "admin") {
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
        success: false,
        localOnly: true,
        backupEntry,
        error: "Chưa kết nối được Cloud Firestore. Dữ liệu chỉ được giữ trên thiết bị, hãy bấm Lưu lại khi có kết nối."
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

      if (existingOwnerUid && access.uid && existingOwnerUid !== access.uid && !access.isElevated && activeAuthContext?.role !== "admin") {
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

      if (isFirebaseReady && db) {
        try {
          const classes = getLocalClasses();
          const studentUser = cleanData.username || access.normalizedUsername;
          if (studentUser) {
            const subData = {
              username: studentUser,
              name: cleanData.ho_ten || studentUser,
              updatedAt: new Date().toISOString(),
              plan: cleanData
            };
            const kwPayload = {
              username: studentUser,
              name: cleanData.ho_ten || studentUser,
              expenses: cleanData.expenses || [],
              incomeList: cleanData.incomeList || [],
              planList: cleanData.planList || [],
              investProducts: cleanData.investProducts || [],
              updatedAt: new Date().toISOString()
            };
            await Promise.allSettled([
              setDoc(doc(db, "student_plans", studentUser), subData, { merge: true }),
              setDoc(doc(db, "setup_keywords", studentUser), kwPayload, { merge: true })
            ]).catch(() => {});
            for (const cid of Object.keys(classes)) {
              const c = classes[cid];
              const isMember = (c.members || []).some(m => m.username === studentUser);
              if (isMember) {
                const subRef = doc(db, CLASSES_COLLECTION, cid, "submissions", studentUser);
                await setDoc(subRef, subData, { merge: true }).catch(() => {});
              }
            }
          }
        } catch (subErr) {}
      }
      return {
        success: true,
        backupEntry,
        message: "Đã lưu dữ liệu lên Cloud Firestore thành công!"
      };
    } catch (error) {
      return {
        success: false,
        localOnly: true,
        backupEntry,
        error: "Lưu lên Cloud thất bại (" + (error && error.message ? error.message : "lỗi không xác định") + "). Dữ liệu của bạn vẫn được giữ trên màn hình và thiết bị, hãy thử lưu lại."
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

    return { success: true, backups: mergeBackupLists(cloudBackups, localBackups) };
  },

  async deleteBackup(customDocId = null, backupId) {
    if (typeof window !== "undefined" && window.isReadOnlyStudentView) {
      return {
        success: false,
        code: "PERMISSION_DENIED",
        error: "Từ chối xóa dữ liệu: Đang ở chế độ xem bài học viên chỉ đọc.",
        message: "Không thể xóa bản sao lưu khi đang ở chế độ chỉ đọc."
      };
    }

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

    let localBackups = [];
    try {
      localBackups = JSON.parse(localStorage.getItem("FIN_APP_BACKUPS_" + targetDocId) || "[]");
      localBackups = localBackups.filter(b => b.id !== backupId);
      localStorage.setItem("FIN_APP_BACKUPS_" + targetDocId, JSON.stringify(localBackups));
    } catch (e) {}

    if (!this.isReady()) {
      return {
        success: true,
        localOnly: true,
        backups: localBackups,
        message: "Đã xóa bản sao lưu trên thiết bị. Chưa kết nối được Cloud nên bản trên Cloud (nếu có) chưa bị xóa."
      };
    }

    try {
      const docRef = doc(db, firestoreSettings.collectionName, targetDocId);
      const snap = await withFirestoreTimeout(getDoc(docRef));
      let cloudBackups = [];
      if (snap && snap.exists()) {
        const data = snap.data();
        if (data.owner_uid && access.uid && data.owner_uid !== access.uid && !access.isElevated && activeAuthContext?.role !== "admin") {
          return {
            success: false,
            code: "PERMISSION_DENIED",
            error: "Từ chối xóa: Bản sao lưu thuộc quyền sở hữu của tài khoản khác."
          };
        }
        const allCloud = Array.isArray(data._backups) ? data._backups : [];
        cloudBackups = allCloud.filter(b => b && b.id !== backupId);
        if (cloudBackups.length !== allCloud.length) {
          await withFirestoreTimeout(updateDoc(docRef, { _backups: cloudBackups, _lastUpdated: new Date().toISOString() }));
        }
      }

      return {
        success: true,
        backups: mergeBackupLists(cloudBackups, localBackups),
        message: "Đã xóa bản sao lưu trên Cloud và thiết bị."
      };
    } catch (e) {
      return {
        success: false,
        error: "Không xóa được bản sao lưu trên Cloud (" + (e && e.message ? e.message : "lỗi không xác định") + "). Hãy thử lại.",
        message: "Không thể xóa bản sao lưu trên Cloud."
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

    if (this.isReady()) {
      try {
        const docRef = doc(db, firestoreSettings.collectionName, targetDocId);
        const docSnap = await Promise.race([
          getDoc(docRef),
          new Promise((_, reject) => setTimeout(() => reject(new Error("Firestore timeout")), 8000))
        ]);

        if (docSnap && docSnap.exists()) {
          const cloudData = docSnap.data();
          if (cloudData.owner_uid && access.uid && cloudData.owner_uid !== access.uid && !access.isElevated && activeAuthContext?.role !== "admin" && activeAuthContext?.role !== "instructor") {
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
        }
      } catch (e) {}
    }

    try {
      const localRaw = localStorage.getItem("FIN_APP_LAST_STATE_" + targetDocId);
      if (localRaw) {
        const parsed = JSON.parse(localRaw);
        if (parsed && parsed.owner_uid && access.uid && parsed.owner_uid !== access.uid && !access.isElevated && activeAuthContext?.role !== "admin" && activeAuthContext?.role !== "instructor") {
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
      const cleanUser = targetDocId.replace(/^user_/, "");
      const classes = getLocalClasses();
      for (const cid of Object.keys(classes)) {
        const subRef = doc(db, CLASSES_COLLECTION, cid, "submissions", cleanUser);
        const subSnap = await getDoc(subRef).catch(() => null);
        if (subSnap && subSnap.exists()) {
          const subData = subSnap.data();
          if (subData && subData.plan) {
            return {
              success: true,
              data: subData.plan,
              message: "Đã tải bài làm học viên từ lớp!"
            };
          }
        }
      }
      return {
        success: false,
        notFound: true,
        message: "Chưa có dữ liệu trên Cloud cho hồ sơ này."
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: "Lỗi khi tải từ Cloud: " + error.message
      };
    }
  },

  validateAdminCodeFormat(code) {
    if (!code || typeof code !== "string") return false;
    return /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(code.trim().toUpperCase());
  },

  generateAdminCode() {
    const charset = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
    let bytes = new Uint8Array(12);
    if (typeof crypto !== "undefined" && crypto.getRandomValues) {
      crypto.getRandomValues(bytes);
    } else {
      for (let i = 0; i < 12; i++) bytes[i] = Math.floor(Math.random() * 256);
    }
    let res = "";
    for (let i = 0; i < 12; i++) {
      res += charset[bytes[i] % charset.length];
    }
    return `${res.slice(0, 4)}-${res.slice(4, 8)}-${res.slice(8, 12)}`;
  },

  async getAdminCodes() {
    if (requireAdminRole("Xem danh sách mã cấp quyền")) return [];
    const local = getLocalAdminCodes();
    if (isFirebaseReady && db) {
      try {
        const snap = await Promise.race([
          getDocs(collection(db, ADMIN_CODES_COLLECTION)),
          new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 8000))
        ]);
        if (snap && !snap.empty) {
          snap.forEach(d => {
            const data = d.data();
            if (data && data.code && data.code !== "all_codes" && data.code !== "admin_codes") {
              local[data.code] = { ...local[data.code], ...data };
            } else if (data && data.codes && typeof data.codes === "object") {
              Object.keys(data.codes).forEach(k => {
                local[k] = { ...local[k], ...data.codes[k] };
              });
            }
          });
          saveLocalAdminCodes(local);
        }
      } catch (err) {
        console.warn("Lỗi tải mã quản trị từ Firestore:", err);
      }
    }
    return Object.values(local);
  },

  async createAdminCode(role = "instructor", maxUses = 1, validDays = 30) {
    const denied = requireAdminRole("Tạo mã cấp quyền");
    if (denied) return denied;
    const code = this.generateAdminCode();
    const newCode = {
      code,
      role: (role === "admin") ? "admin" : "instructor",
      maxUses: parseInt(maxUses, 10) || 1,
      usedCount: 0,
      isRevoked: false,
      expiresAt: new Date(Date.now() + (parseInt(validDays, 10) || 30) * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString()
    };
    const local = getLocalAdminCodes();
    local[code] = newCode;
    saveLocalAdminCodes(local);
    if (isFirebaseReady && db) {
      try {
        await withTimeout(setDoc(doc(db, ADMIN_CODES_COLLECTION, code), newCode, { merge: true }));
      } catch (err) {
        delete local[code];
        saveLocalAdminCodes(local);
        return { success: false, error: "Chưa lưu được mã lên Cloud nên mã chưa dùng được trên thiết bị khác: " + describeCloudError(err) };
      }
      setDoc(doc(db, ADMIN_CODES_COLLECTION, "all_codes"), { id: "all_codes", updatedAt: new Date().toISOString(), codes: local }, { merge: true }).catch(() => {});
    }
    return { success: true, code: newCode };
  },

  async revokeAdminCode(adminCode) {
    const denied = requireAdminRole("Thu hồi mã cấp quyền");
    if (denied) return denied;
    const clean = String(adminCode || "").trim().toUpperCase();
    if (!clean) return { success: false, error: "Thiếu mã quản trị cần thu hồi." };
    const local = getLocalAdminCodes();
    if (local[clean]) {
      local[clean].isRevoked = true;
      local[clean].revokedAt = new Date().toISOString();
      saveLocalAdminCodes(local);
    }
    if (isFirebaseReady && db) {
      try {
        await withTimeout(setDoc(doc(db, ADMIN_CODES_COLLECTION, clean), { isRevoked: true, revokedAt: new Date().toISOString() }, { merge: true }));
      } catch (err) {
        return { success: false, error: "Chưa thu hồi được mã trên Cloud: " + describeCloudError(err) };
      }
      setDoc(doc(db, ADMIN_CODES_COLLECTION, "all_codes"), { updatedAt: new Date().toISOString(), codes: local }, { merge: true }).catch(() => {});
    }
    return { success: true, message: `Đã thu hồi mã ${clean} thành công.` };
  },

  async activateAdminCode(adminCode, username) {
    const cleanAdminCode = String(adminCode || "").trim().toUpperCase();
    const cleanUser = normalizeUsername(username || (activeAuthContext ? activeAuthContext.normalizedUsername : ""));
    if (!cleanAdminCode) {
      return { success: false, error: "Vui lòng nhập Mã Quản trị / Giảng viên." };
    }
    if (!/^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(cleanAdminCode)) {
      return { success: false, error: "Mã Quản trị phải có định dạng XXXX-XXXX-XXXX (12 ký tự chữ và số)." };
    }
    let codeRec = null;
    if (isFirebaseReady && db) {
      try {
        const cSnap = await Promise.race([
          getDoc(doc(db, ADMIN_CODES_COLLECTION, cleanAdminCode)),
          new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 8000))
        ]);
        if (cSnap && cSnap.exists()) {
          codeRec = cSnap.data();
        }
      } catch (e) {}
    }
    if (!codeRec) {
      const localCodes = getLocalAdminCodes();
      codeRec = localCodes[cleanAdminCode];
    }
    if (PUBLISHED_ADMIN_CODES_BLOCKLIST.has(cleanAdminCode) || !codeRec || codeRec.isRevoked || Date.now() > new Date(codeRec.expiresAt).getTime() || (codeRec.usedCount || 0) >= (codeRec.maxUses || 1)) {
      return { success: false, error: "Mã Quản trị / Giảng viên không hợp lệ, đã bị thu hồi hoặc đã hết lượt sử dụng." };
    }
    const callerUser = getCallerContext().username;
    if (callerUser && cleanUser !== callerUser && getCallerContext().role !== "admin") {
      return permissionDenied("Kích hoạt mã cho tài khoản khác", "Quản trị viên");
    }

    const assignedRole = codeRec.role || "instructor";
    codeRec.usedCount = (codeRec.usedCount || 0) + 1;
    codeRec.lastUsedAt = new Date().toISOString();
    codeRec.lastUsedBy = cleanUser;

    if (isFirebaseReady && db) {
      try {
        await withTimeout(setDoc(doc(db, ADMIN_CODES_COLLECTION, cleanAdminCode), codeRec, { merge: true }));
      } catch (err) {
        return { success: false, error: "Chưa ghi nhận được việc dùng mã lên Cloud: " + describeCloudError(err) };
      }
      const allLocalCodes = getLocalAdminCodes();
      allLocalCodes[cleanAdminCode] = codeRec;
      setDoc(doc(db, ADMIN_CODES_COLLECTION, "all_codes"), { id: "all_codes", updatedAt: new Date().toISOString(), codes: allLocalCodes }, { merge: true }).catch(() => {});
    }
    const allLocalCodes = getLocalAdminCodes();
    allLocalCodes[cleanAdminCode] = codeRec;
    saveLocalAdminCodes(allLocalCodes);

    const accounts = getLocalAuthAccounts();
    if (accounts[cleanUser]) {
      accounts[cleanUser].role = assignedRole;
      accounts[cleanUser].updatedAt = new Date().toISOString();
      saveLocalAuthAccounts(accounts);
    }
    if (isFirebaseReady && db) {
      try {
        await withTimeout(setDoc(doc(db, ACCOUNTS_COLLECTION, cleanUser), { role: assignedRole, updatedAt: new Date().toISOString() }, { merge: true }));
      } catch (err) {
        return { success: false, error: "Đã ghi nhận mã nhưng chưa cập nhật được vai trò trên Cloud: " + describeCloudError(err) };
      }
    }
    if (activeAuthContext && activeAuthContext.normalizedUsername === cleanUser) {
      setActiveSessionFromUser({ ...activeAuthContext, role: assignedRole }, activeAuthContext.sessionToken);
    }
    return {
      success: true,
      role: assignedRole,
      message: `Kích hoạt thành công vai trò: ${assignedRole === "admin" ? "Quản trị viên" : "Giảng viên"}`
    };
  },

  async getClasses(options = {}) {
    if (!isFirebaseReady || !db) return FirestoreService.loadClasses();
    ensureClassesRealtimeListener();
    const user = getCallerContext().username;
    const fresh = classesCache.value && classesCache.user === user && Date.now() - classesCache.at < CLASSES_CACHE_TTL_MS;
    if (fresh && !options.force) return JSON.parse(JSON.stringify(classesCache.value));
    if (!classesInflight) {
      const gen = classesGen;
      classesInflight = FirestoreService.loadClasses().then((list) => {
        if (gen === classesGen) classesCache = { at: Date.now(), user, value: JSON.parse(JSON.stringify(list)) };
        return list;
      }).finally(() => { classesInflight = null; });
    }
    return JSON.parse(JSON.stringify(await classesInflight));
  },

  async loadClasses() {
    const local = getLocalClasses();
    if (!isFirebaseReady || !db) {
      return visibleClassesForCaller(Object.values(local));
    }

    const remote = {};

    try {
      const snap = await withTimeout(getDocs(collection(db, CLASSES_COLLECTION)), 8000).catch((err) => {
        console.warn("[CloudDB] getClasses CLASSES_COLLECTION error:", err);
        return null;
      });
      if (snap) {
        snap.forEach(d => {
          const data = { ...d.data(), id: d.id };
          if (isRealClassRecord(data)) {
            remote[d.id] = remote[d.id] ? mergeClassRecord(remote[d.id], data) : data;
          }
        });
      }
    } catch (err) {
      console.warn("[CloudDB] getClasses CLASSES_COLLECTION catch:", err);
    }

    try {
      const gSnap = await withTimeout(getDocs(collection(db, GROUPS_COLLECTION)), 8000).catch((err) => {
        console.warn("[CloudDB] getClasses GROUPS_COLLECTION error:", err);
        return null;
      });
      if (gSnap) {
        gSnap.forEach(d => {
          const data = { ...d.data(), id: d.id };
          if (isRealClassRecord(data)) {
            remote[d.id] = remote[d.id] ? mergeClassRecord(remote[d.id], data) : data;
          }
        });
      }
    } catch (err) {
      console.warn("[CloudDB] getClasses GROUPS_COLLECTION catch:", err);
    }

    const aggRefs = [
      doc(db, FINANCIAL_AUTH_COLLECTION, "groups"),
      doc(db, CLASSES_COLLECTION, "groups"),
      doc(db, GROUPS_COLLECTION, "groups"),
      doc(db, FINANCIAL_AUTH_COLLECTION, "class"),
      doc(db, CLASSES_COLLECTION, "class")
    ];
    for (const aRef of aggRefs) {
      try {
        const aSnap = await withTimeout(getDoc(aRef), 3000).catch(() => null);
        if (aSnap && aSnap.exists()) {
          const aData = aSnap.data();
          if (aData && aData.classes && typeof aData.classes === "object") {
            Object.keys(aData.classes).forEach(cid => {
              const c = aData.classes[cid];
              if (isRealClassRecord(c)) {
                remote[cid] = remote[cid] ? mergeClassRecord(remote[cid], c) : c;
              }
            });
          }
        }
      } catch (e) {}
    }

    const dead = getDeletedClassIds();
    dead.forEach(id => { delete remote[id]; });

    const me = activeAuthContext ? activeAuthContext.normalizedUsername : "";
    const allIds = new Set([...Object.keys(local), ...Object.keys(remote)]);
    const cache = {};
    allIds.forEach(id => {
      cache[id] = mergeClassRecord(local[id], remote[id]);
    });

    const failed = [];
    const localOnly = Object.values(local).filter(c =>
      isRealClassRecord(c) && !remote[c.id] && me && c.instructorUsername === me
    );
    for (const c of localOnly) {
      const clash = Object.values(remote).some(r => r.code === c.code && r.status === "active");
      if (clash) continue;
      const clean = { ...c };
      delete clean._localOnly;
      try {
        await syncClassesStoreToFirestore(clean.id, clean);
        cache[clean.id] = clean;
      } catch (err) {
        console.warn(`Không đẩy được lớp "${c.name}" (${c.code}) lên Firestore:`, err);
        cache[c.id] = { ...c, _localOnly: true };
        failed.push(c);
      }
    }
    if (failed.length && typeof window !== "undefined" && typeof window.showToast === "function") {
      window.showToast(`${failed.length} lớp chỉ đang lưu trên máy này, chưa lên được Cloud — thiết bị khác sẽ chưa nhập được mã.`, "error");
    }

    saveLocalClasses(cache, true);
    return visibleClassesForCaller(Object.values(cache));
  },

  async createClass(name, code, instructorUsername, maxMembers = 40, isPrivate = true, description = "") {
    const denied = requireStaffRole("Tạo nhóm");
    if (denied) return denied;
    const cleanName = String(name || "").trim();
    const cleanCode = String(code || "").trim().toUpperCase();
    if (!cleanName || !cleanCode) {
      return { success: false, error: "Vui lòng nhập tên lớp và mã lớp." };
    }
    const caller = getCallerContext();
    if (caller.role !== "admin") instructorUsername = caller.username;
    const now = new Date().toISOString();
    const classId = "cls_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const newClass = {
      id: classId,
      name: cleanName,
      code: cleanCode,
      description: String(description || "").trim(),
      instructorUsername: instructorUsername || (activeAuthContext ? activeAuthContext.normalizedUsername : "admin"),
      instructorName: (activeAuthContext ? activeAuthContext.displayUsername : instructorUsername) || "Giảng viên",
      maxMembers: normalizeMaxMembers(maxMembers, 40),
      isPrivate: isPrivate !== false,
      isAccepting: true,
      status: "active",
      createdAt: now,
      updatedAt: now,
      members: []
    };

    if (!isFirebaseReady || !db) {
      cacheClassLocally(newClass);
      return { success: true, class: newClass, localOnly: true };
    }

    try {
      const dupes = (await findClassesByCode(cleanCode)).filter(c => c.status === "active");
      if (dupes.length) {
        return { success: false, error: `Mã "${cleanCode}" đang được nhóm "${dupes[0].name}" sử dụng. Vui lòng chọn mã khác.` };
      }
      await syncClassesStoreToFirestore(classId, newClass);
    } catch (err) {
      return { success: false, error: "Chưa tạo được lớp trên Cloud: " + describeCloudError(err) };
    }

    cacheClassLocally(newClass);
    return { success: true, class: newClass };
  },

  async joinClass(code, username, studentName) {
    const cleanCode = String(code || "").trim().toUpperCase();
    const cleanUser = normalizeUsername(username || (activeAuthContext ? activeAuthContext.normalizedUsername : ""));
    const dispName = sanitizeDisplayName(studentName || (activeAuthContext ? activeAuthContext.displayUsername : cleanUser), cleanUser);

    if (!cleanCode) {
      return { success: false, error: "Vui lòng nhập mã nhóm." };
    }
    if (!cleanUser) {
      return { success: false, error: "Vui lòng đăng nhập trước khi tham gia nhóm." };
    }
    const joinCaller = getCallerContext();
    if (joinCaller.username && joinCaller.username !== cleanUser) {
      return permissionDenied("Tham gia nhóm bằng tài khoản của người khác", "chính chủ tài khoản");
    }

    if (/^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(cleanCode) || cleanCode.startsWith("INST-") || cleanCode.startsWith("ADMN-")) {
      const actRes = await this.activateAdminCode(cleanCode, cleanUser);
      if (actRes.success) {
        return {
          success: true,
          isAdminUpgrade: true,
          role: actRes.role,
          message: actRes.message
        };
      }
    }

    const notFound = { success: false, error: "Không tìm thấy nhóm với mã này hoặc nhóm đã kết thúc." };

    const addMember = (cls) => {
      if (!cls || cls.status !== "active" || cls.code !== cleanCode) return notFound;
      if (cls.isAccepting === false) {
        return { success: false, error: "Nhóm này hiện đã khóa, không nhận thêm thành viên." };
      }
      const members = Array.isArray(cls.members) ? cls.members.slice() : [];
      const existing = members.find(m => {
        const u = m && (m.username || m.normalizedUsername || m.studentId || m.id);
        return normalizeUsername(u) === cleanUser;
      });
      if (existing) {
        if (existing.status === "pending") {
          return {
            success: true,
            status: "pending",
            alreadyJoined: true,
            class: cls,
            message: `Yêu cầu tham gia nhóm "${cls.name}" của bạn đang ở trạng thái CHỜ DUYỆT. Vui lòng đợi người phụ trách phê duyệt để vào lớp.`
          };
        }
        if (existing.status === "approved") {
          return {
            success: true,
            status: "approved",
            alreadyJoined: true,
            class: cls,
            message: `Bạn đã là thành viên chính thức của nhóm "${cls.name}".`
          };
        }
        if (existing.status === "rejected") {
          return {
            success: false,
            error: `Yêu cầu tham gia nhóm "${cls.name}" của bạn đã bị từ chối. Vui lòng liên hệ người phụ trách nhóm nếu cần tham gia lại.`
          };
        }
        return { success: false, error: "Bạn đã ở trong danh sách hoặc đã gửi yêu cầu tham gia nhóm này." };
      }
      const seatsTaken = members.filter(m => m.status !== "rejected").length;
      if (cls.maxMembers > 0 && seatsTaken >= cls.maxMembers) {
        return { success: false, error: "Nhóm đã đạt số lượng thành viên tối đa." };
      }
      const newMember = {
        username: cleanUser,
        name: dispName,
        status: cls.isPrivate ? "pending" : "approved",
        joinedAt: new Date().toISOString()
      };
      members.push(newMember);
      cls.members = members;
      return {
        success: true,
        class: cls,
        status: newMember.status,
        message: cls.isPrivate ? `Đã gửi yêu cầu tham gia nhóm "${cls.name}". Vui lòng chờ người phụ trách duyệt.` : `Đã tham gia nhóm "${cls.name}" thành công!`
      };
    };

    if (!isFirebaseReady || !db) {
      const local = getLocalClasses();
      const target = Object.values(local).find(c => c.code === cleanCode && c.status === "active");
      if (!target) return notFound;
      const res = addMember(target);
      if (res.success) {
        local[target.id] = target;
        saveLocalClasses(local);
      }
      return res;
    }

    let candidates = [];
    try {
      candidates = await findClassesByCode(cleanCode);
    } catch (err) {
      return { success: false, error: "Không kiểm tra được mã nhóm: " + describeCloudError(err) };
    }
    const target = candidates.find(c => c.status === "active");
    if (!target) return notFound;

    let result = null;
    const res = await mutateClassInCloud(target.id, (cls) => {
      result = addMember(cls);
      return result;
    });
    if (!res.success) return res;
    if (res.localOnly) {
      return {
        ...(result || res),
        localOnly: true,
        cloudSynced: false,
        warning: res.warning || "Dữ liệu chỉ mới lưu trên thiết bị này, chưa đồng bộ lên Cloud."
      };
    }
    return { ...(result || res), cloudSynced: true };
  },

  async approveClassMember(classId, studentUsername, action) {
    const cleanUser = normalizeUsername(studentUsername);
    let memberStatus = null;
    const res = await mutateClassInCloud(classId, (cls) => {
      if (!Array.isArray(cls.members)) cls.members = [];
      const member = cls.members.find(m => {
        const u = m && (m.username || m.normalizedUsername || m.studentId || m.id);
        return normalizeUsername(u) === cleanUser;
      });
      if (!member) {
        return { success: false, error: "Không tìm thấy học viên trong lớp." };
      }
      if (action === "approve") {
        member.status = "approved";
        member.approvedAt = new Date().toISOString();
        memberStatus = "approved";
      } else if (action === "reject") {
        member.status = "rejected";
        member.rejectedAt = new Date().toISOString();
        memberStatus = "rejected";
      } else if (action === "remove") {
        cls.members = cls.members.filter(m => {
          const u = m && (m.username || m.normalizedUsername || m.studentId || m.id);
          return normalizeUsername(u) !== cleanUser;
        });
        memberStatus = "removed";
      }
      return {
        success: true,
        class: cls,
        memberStatus,
        action
      };
    }, { requireManage: true });
    if (res.localOnly) {
      return {
        ...res,
        cloudSynced: false,
        warning: res.warning || "Thao tác chỉ mới lưu cục bộ trên máy này, chưa đồng bộ lên Cloud."
      };
    }
    return { ...res, cloudSynced: true };
  },

  subscribeToClasses(callback) {
    if (typeof callback !== "function") return () => {};
    const initial = visibleClassesForCaller(Object.values(getLocalClasses()));
    if (initial.length > 0) {
      try { callback(initial); } catch (e) {}
    }
    const handler = (e) => {
      try { callback(e.detail || []); } catch (err) {
        console.warn("[CloudDB] subscribeToClasses callback error:", err);
      }
    };
    if (typeof window !== "undefined") {
      window.addEventListener("cloud-classes-updated", handler);
      return () => {
        window.removeEventListener("cloud-classes-updated", handler);
      };
    }
    return () => {};
  },

  subscribeToClass(classId, callback) {
    if (!classId || typeof callback !== "function") return () => {};
    if (!isFirebaseReady || !db) {
      const local = getLocalClasses();
      if (local[classId]) callback(local[classId]);
      return () => {};
    }
    try {
      const cRef = doc(db, CLASSES_COLLECTION, classId);
      return onSnapshot(cRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = { ...docSnap.data(), id: docSnap.id };
          cacheClassLocally(data);
          callback(data);
        } else {
          callback(null);
        }
      }, (err) => {
        console.warn(`[CloudDB] subscribeToClass error (${classId}):`, err);
      });
    } catch (e) {
      console.warn(`[CloudDB] subscribeToClass catch (${classId}):`, e);
      return () => {};
    }
  },

  async migrateGuestToAccount(guestId, newUsername, newDisplayName) {
    const cleanGuest = normalizeUsername(guestId);
    const cleanNew = normalizeUsername(newUsername);
    if (!cleanGuest || !cleanNew || cleanGuest === cleanNew) return { success: true, updatedCount: 0 };

    const local = getLocalClasses();
    const updated = [];

    for (const cid of Object.keys(local)) {
      const cls = local[cid];
      if (Array.isArray(cls.members)) {
        let changed = false;
        cls.members = cls.members.map(m => {
          if (normalizeUsername(m.username) === cleanGuest) {
            changed = true;
            return {
              ...m,
              username: cleanNew,
              name: newDisplayName || m.name || cleanNew,
              updatedAt: new Date().toISOString()
            };
          }
          return m;
        });
        if (changed) {
          cls.updatedAt = new Date().toISOString();
          updated.push(cls);
          if (isFirebaseReady && db) {
            await syncClassesStoreToFirestore(cid, cls, false).catch(() => {});
          }
        }
      }
    }
    saveLocalClasses(local);
    return { success: true, updatedCount: updated.length };
  },

  async updateClass(classId, updates = {}) {
    const denied = requireStaffRole("Chỉnh sửa nhóm");
    if (denied) return denied;
    const newCode = updates.code ? String(updates.code).trim().toUpperCase() : "";
    if (newCode && isFirebaseReady && db) {
      try {
        const clash = (await findClassesByCode(newCode)).find(c => c.status === "active" && c.id !== classId);
        if (clash) {
          return { success: false, error: `Mã "${newCode}" đang được nhóm "${clash.name}" sử dụng. Vui lòng chọn mã khác.` };
        }
      } catch (err) {
        return { success: false, error: "Không kiểm tra được mã mới: " + describeCloudError(err) };
      }
    }
    return mutateClassInCloud(classId, (cls) => {
      if (updates.name) cls.name = String(updates.name).trim();
      if (newCode) cls.code = newCode;
      if (updates.maxMembers !== undefined) cls.maxMembers = normalizeMaxMembers(updates.maxMembers, 0);
      if (updates.isPrivate !== undefined) cls.isPrivate = Boolean(updates.isPrivate);
      if (updates.isAccepting !== undefined) cls.isAccepting = Boolean(updates.isAccepting);
      if (updates.description !== undefined) cls.description = String(updates.description).trim();
      return null;
    }, { requireManage: true });
  },

  async archiveClass(classId) {
    const res = await mutateClassInCloud(classId, (cls) => {
      cls.status = "archived";
      cls.archivedAt = new Date().toISOString();
      return null;
    }, { requireManage: true });
    if (res.success) res.message = "Đã lưu trữ và kết thúc học kỳ an toàn.";
    return res;
  },

  async restoreClassRecord(classData) {
    const denied = requireAdminRole("Khôi phục nhóm từ sao lưu");
    if (denied) return denied;
    if (!isRealClassRecord(classData)) {
      return { success: false, error: "Bản ghi lớp trong tệp sao lưu không hợp lệ." };
    }
    const cls = { ...classData };
    delete cls._localOnly;
    markClassDeleted(cls.id, false);
    cacheClassLocally(cls);
    if (isFirebaseReady && db) {
      try {
        await syncClassesStoreToFirestore(cls.id, cls, false);
      } catch (err) {
        return { success: false, error: "Chưa khôi phục được nhóm lên Cloud: " + describeCloudError(err) };
      }
    }
    return { success: true, class: cls };
  },

  async restoreAdminCodeRecord(codeData) {
    const denied = requireAdminRole("Khôi phục mã cấp quyền từ sao lưu");
    if (denied) return denied;
    const code =String(codeData && codeData.code || "").trim().toUpperCase();
    if (!/^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(code)) {
      return { success: false, error: "Mã cấp quyền trong tệp sao lưu không hợp lệ." };
    }
    const record = {
      code,
      role: codeData.role === "admin" ? "admin" : "instructor",
      maxUses: parseInt(codeData.maxUses, 10) || 1,
      usedCount: parseInt(codeData.usedCount, 10) || 0,
      isRevoked: codeData.isRevoked === true,
      expiresAt: codeData.expiresAt || new Date().toISOString(),
      createdAt: codeData.createdAt || new Date().toISOString()
    };
    const local = getLocalAdminCodes();
    local[code] = record;
    saveLocalAdminCodes(local);
    if (isFirebaseReady && db) {
      try {
        await withTimeout(setDoc(doc(db, ADMIN_CODES_COLLECTION, code), record, { merge: true }));
      } catch (err) {
        return { success: false, error: "Chưa khôi phục được mã lên Cloud: " + describeCloudError(err) };
      }
    }
    return { success: true, code: record };
  },

  async deleteClass(classId) {
    const denied = requireStaffRole("Xóa nhóm");
    if (denied) return denied;
    let existingClass = getLocalClasses()[classId] || null;
    if (!existingClass && isFirebaseReady && db) {
      try {
        const snap = await withTimeout(getDoc(doc(db, CLASSES_COLLECTION, classId)), 8000);
        if (snap && snap.exists()) existingClass = { ...snap.data(), id: snap.id };
      } catch (e) {}
    }
    if (existingClass && !canManageClassRecord(existingClass)) {
      return permissionDenied("Xóa nhóm này", "Quản trị viên hoặc Giảng viên phụ trách nhóm");
    }
    if (isFirebaseReady && db) {
      markClassDeleted(classId);
      try {
        await syncClassesStoreToFirestore(classId, null, true);
      } catch (err) {
        markClassDeleted(classId, false);
        return { success: false, error: "Chưa xóa được nhóm trên Cloud: " + describeCloudError(err) };
      }
    } else if (!getLocalClasses()[classId]) {
      return { success: false, error: "Không tìm thấy lớp học." };
    }
    removeClassFromLocalCache(classId);
    return { success: true, message: "Đã xóa nhóm thành công." };
  },

  async loadUserData(targetDocId) {
    if (!targetDocId) return { success: false, error: "Thiếu ID tài liệu." };
    const cleanUser = targetDocId.replace(/^user_/, "").trim();
    const normUser = normalizeUsername(cleanUser);
    const normDocId = "user_" + normUser;
    let res = await this.loadData(normDocId);
    if (res && res.success && res.data) {
      if (isFirebaseReady && db) {
        try {
          const kwRef = doc(db, "setup_keywords", normUser);
          const kwSnap = await getDoc(kwRef).catch(() => null);
          if (kwSnap && kwSnap.exists()) {
            const kwData = kwSnap.data();
            if (!Array.isArray(res.data.expenses) || res.data.expenses.length === 0) res.data.expenses = kwData.expenses || [];
            if (!Array.isArray(res.data.incomeList) || res.data.incomeList.length === 0) res.data.incomeList = kwData.incomeList || [];
            if (!Array.isArray(res.data.planList) || res.data.planList.length === 0) res.data.planList = kwData.planList || [];
            if (!Array.isArray(res.data.investProducts) || res.data.investProducts.length === 0) res.data.investProducts = kwData.investProducts || [];
          }
        } catch (e) {}
      }
      return res;
    }
    if (isFirebaseReady && db) {
      try {
        const directRef = doc(db, FINANCIAL_AUTH_COLLECTION, normDocId);
        const snap = await getDoc(directRef).catch(() => null);
        if (snap && snap.exists()) {
          const d = snap.data();
          return { success: true, data: d.plan || d, message: "Đã tải dữ liệu từ Cloud Firestore!" };
        }
        const spRef = doc(db, "student_plans", normUser);
        const spSnap = await getDoc(spRef).catch(() => null);
        if (spSnap && spSnap.exists()) {
          const spData = spSnap.data();
          return { success: true, data: spData.plan || spData, message: "Đã tải bài làm học viên từ Cloud!" };
        }
        const classes = getLocalClasses();
        for (const cid of Object.keys(classes)) {
          const subRef = doc(db, CLASSES_COLLECTION, cid, "submissions", normUser);
          const subSnap = await getDoc(subRef).catch(() => null);
          if (subSnap && subSnap.exists()) {
            const subData = subSnap.data();
            if (subData && subData.plan) {
              return { success: true, data: subData.plan, message: "Đã tải bài làm học viên từ lớp!" };
            }
          }
          const gSubRef = doc(db, GROUPS_COLLECTION, cid, "submissions", normUser);
          const gSubSnap = await getDoc(gSubRef).catch(() => null);
          if (gSubSnap && gSubSnap.exists()) {
            const gSubData = gSubSnap.data();
            if (gSubData && gSubData.plan) {
              return { success: true, data: gSubData.plan, message: "Đã tải bài làm học viên từ nhóm!" };
            }
          }
        }
      } catch (e) {}
    }
    try {
      const raw = localStorage.getItem("FIN_APP_LAST_STATE_user_" + normUser);
      if (raw) {
        return { success: true, data: JSON.parse(raw), localOnly: true, message: "Đã tải bài làm từ bộ nhớ thiết bị." };
      }
    } catch (e) {}
    return res || { success: false, notFound: true, message: "Không tìm thấy dữ liệu bài làm của học viên." };
  },

  async saveUserData(targetDocId, data) {
    return this.saveData(data, targetDocId);
  },

  async deleteUserData(targetDocId) {
    if (typeof window !== "undefined" && window.isReadOnlyStudentView) {
      return {
        success: false,
        code: "PERMISSION_DENIED",
        error: "Từ chối xóa dữ liệu: Đang ở chế độ xem bài học viên chỉ đọc.",
        message: "Không thể xóa dữ liệu học viên khi đang ở chế độ chỉ đọc."
      };
    }
    const access = verifyDataAccessPermission(targetDocId);
    if (!access.allowed) {
      return { success: false, code: access.code, error: access.error, message: access.error };
    }
    const cleanUser = (targetDocId || "").replace(/^user_/, "").trim();
    const normUser = normalizeUsername(cleanUser);
    const normDocId = "user_" + normUser;
    try {
      localStorage.removeItem("FIN_APP_LAST_STATE_" + normDocId);
      localStorage.removeItem("FIN_APP_BACKUPS_" + normDocId);
      localStorage.removeItem("FIN_APP_LAST_STATE_user_" + normUser);
      if (isFirebaseReady && db) {
        await Promise.allSettled([
          deleteDoc(doc(db, firestoreSettings.collectionName, normDocId)),
          deleteDoc(doc(db, FINANCIAL_AUTH_COLLECTION, normDocId)),
          deleteDoc(doc(db, "student_plans", normUser)),
          deleteDoc(doc(db, "setup_keywords", normUser)),
          deleteDoc(doc(db, "student_keywords", normUser))
        ]).catch(() => {});
      }
      return { success: true, message: "Đã xóa dữ liệu học viên thành công." };
    } catch (e) {
      return { success: false, error: e.message || "Lỗi xóa dữ liệu học viên." };
    }
  },

  async getStudentClassProgress(studentUsername) {
    const norm = normalizeUsername(studentUsername);
    let plan = null;

    try {
      const loadRes = await this.loadUserData("user_" + norm);
      if (loadRes && loadRes.success && loadRes.data) {
        plan = loadRes.data;
      }
    } catch (e) {}

    if (!plan && isFirebaseReady && db) {
      try {
        const docRef = doc(db, FINANCIAL_AUTH_COLLECTION, "user_" + norm);
        const snap = await Promise.race([
          getDoc(docRef),
          new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 4000))
        ]).catch(() => null);
        if (snap && snap.exists()) {
          plan = snap.data();
        }
      } catch (e) {}
      if (!plan) {
        try {
          const spRef = doc(db, "student_plans", norm);
          const spSnap = await getDoc(spRef).catch(() => null);
          if (spSnap && spSnap.exists()) {
            const spData = spSnap.data();
            if (spData && (spData.plan || spData.state)) {
              plan = spData.plan || spData.state;
            } else if (spData) {
              plan = spData;
            }
          }
        } catch (e) {}
      }
      if (!plan) {
        try {
          const classes = getLocalClasses();
          for (const cid of Object.keys(classes)) {
            const subRef = doc(db, CLASSES_COLLECTION, cid, "submissions", norm);
            const subSnap = await getDoc(subRef).catch(() => null);
            if (subSnap && subSnap.exists()) {
              const subData = subSnap.data();
              if (subData && subData.plan) {
                plan = subData.plan;
                break;
              }
            }
          }
        } catch (e) {}
      }
    }

    if (!plan) {
      try {
        const raw = localStorage.getItem("FIN_APP_LAST_STATE_user_" + norm);
        if (raw) plan = JSON.parse(raw);
      } catch (e) {}
    }

    const progress = {
      keywords: "not_started",
      monthlyPlan: "not_started",
      goals: "not_started",
      careerMilestones: "not_started",
      percent: 0,
      statusLabel: "Chưa nộp bài làm",
      plan: null
    };

    if (plan) {
      const actualPlan = (plan && plan.plan) ? plan.plan : ((plan && plan.data) ? plan.data : ((plan && plan.state) ? plan.state : plan));
      progress.plan = actualPlan;

      // Module 1: Keywords & Profile Setup
      const hasExpenses = Array.isArray(actualPlan.expenses) && actualPlan.expenses.length > 0;
      const hasIncomeList = Array.isArray(actualPlan.incomeList) && actualPlan.incomeList.length > 0;
      const hasPlanList = Array.isArray(actualPlan.planList) && actualPlan.planList.length > 0;
      const hasProfile = Boolean(actualPlan.ho_ten || (actualPlan.currentAge && actualPlan.currentAge !== 21) || actualPlan.monthlyIncome > 0 || actualPlan.incomeMonthly > 0);
      if ((hasExpenses || hasIncomeList) && (hasProfile || hasPlanList)) {
        progress.keywords = "completed";
      } else if (hasExpenses || hasIncomeList || hasProfile) {
        progress.keywords = "completed";
      } else {
        progress.keywords = "in_progress";
      }

      // Module 2: Monthly Cashflow Plan (P2 / Kế hoạch ngân sách dòng tiền)
      const hasMonthlyDetails = actualPlan.monthlyDetails && typeof actualPlan.monthlyDetails === "object" && Object.values(actualPlan.monthlyDetails).some(m => {
        if (!m) return false;
        if (typeof m === "number" && m > 0) return true;
        if (Array.isArray(m.incomes) && m.incomes.length > 0) return true;
        if (Array.isArray(m.expenses) && m.expenses.length > 0) return true;
        if (m.plan > 0 || m.actual > 0) return true;
        return false;
      });
      const hasPlanTables = (Array.isArray(actualPlan.planIncome) && actualPlan.planIncome.length > 0) || (Array.isArray(actualPlan.planExpense) && actualPlan.planExpense.length > 0);
      if (hasMonthlyDetails || hasPlanTables) {
        progress.monthlyPlan = "completed";
      }

      // Module 3: Financial Goals (Mục tiêu tài chính)
      const goalsList = Array.isArray(actualPlan.tcGoals) ? actualPlan.tcGoals : (Array.isArray(actualPlan.personalGoals) ? actualPlan.personalGoals : (Array.isArray(actualPlan.goals) ? actualPlan.goals : []));
      if (goalsList.length >= 2) {
        progress.goals = "completed";
      } else if (goalsList.length > 0) {
        progress.goals = "in_progress";
      }

      // Module 4: Career Milestones & Portfolio (Lộ trình & Danh mục đầu tư)
      const hasCareerDetails = Array.isArray(actualPlan.careerDetailList) && actualPlan.careerDetailList.length > 0;
      const hasMilestonesStore = actualPlan.milestonesStore && typeof actualPlan.milestonesStore === "object" && Object.keys(actualPlan.milestonesStore).length > 0;
      const hasCareerMilestones = Array.isArray(actualPlan.careerMilestones) && actualPlan.careerMilestones.length > 0;
      const hasRouteOverrides = actualPlan.careerRouteOverrides && typeof actualPlan.careerRouteOverrides === "object" && Object.keys(actualPlan.careerRouteOverrides).length > 0;
      const hasInvestProducts = Array.isArray(actualPlan.investProducts) && actualPlan.investProducts.length > 0;
      if (hasCareerDetails || hasMilestonesStore || hasCareerMilestones || hasRouteOverrides || hasInvestProducts) {
        progress.careerMilestones = "completed";
      }

      const items = [progress.keywords, progress.monthlyPlan, progress.goals, progress.careerMilestones];
      const completedCount = items.filter(s => s === "completed").length;
      const inProgressCount = items.filter(s => s === "in_progress").length;
      progress.percent = Math.round(((completedCount * 1.0) + (inProgressCount * 0.5)) / 4 * 100);

      if (progress.percent >= 90) {
        progress.statusLabel = "Đã hoàn thành 100%";
      } else if (progress.percent >= 70) {
        progress.statusLabel = "Gần hoàn thành";
      } else if (progress.percent >= 40) {
        progress.statusLabel = "Đang lập lộ trình";
      } else if (progress.percent > 0) {
        progress.statusLabel = "Mới bắt đầu";
      } else {
        progress.statusLabel = "Đang lập lộ trình";
      }
    }

    return progress;
  },

  async rebuildLegacyData(onProgress) {
    const report = {
      totalAccounts: 0,
      accountsMigrated: 0,
      totalClasses: 0,
      classesMigrated: 0,
      submissionsSynced: 0,
      errors: []
    };
    if (!isFirebaseReady || !db) {
      return { success: false, error: "Firebase chưa sẵn sàng.", report };
    }

    try {
      const accountsToSync = { ...DEFAULT_SEEDED_ACCOUNTS, ...getLocalAuthAccounts() };

      try {
        const snap = await withTimeout(getDocs(collection(db, ACCOUNTS_COLLECTION)), 15000).catch(() => null);
        if (snap) {
          snap.forEach(d => {
            const acc = d.data();
            if (acc && (acc.username || acc.normalizedUsername)) {
              const u = normalizeUsername(acc.normalizedUsername || acc.username);
              accountsToSync[u] = { ...acc, normalizedUsername: u };
            }
          });
        }
      } catch (e) {}

      try {
        const userSnap = await withTimeout(getDocs(collection(db, "users")), 15000).catch(() => null);
        if (userSnap) {
          userSnap.forEach(d => {
            const uData = d.data();
            const u = normalizeUsername(d.id || uData.username);
            if (u) {
              accountsToSync[u] = { ...(accountsToSync[u] || {}), ...uData, normalizedUsername: u };
            }
          });
        }
      } catch (e) {}

      report.totalAccounts = Object.keys(accountsToSync).length;
      let accIdx = 0;
      for (const u of Object.keys(accountsToSync)) {
        accIdx++;
        try {
          const acc = accountsToSync[u];
          const norm = normalizeUsername(u);
          const dispName = acc.displayUsername || acc.username || norm;
          const role = acc.role || "student";
          const salt = acc.salt || ("salt_" + norm + "_" + Date.now().toString(36));
          const passHash = acc.passHash || (acc.password ? await computePasswordHash(acc.password, salt) : "");
          const altPassHash = acc.altPassHash || (acc.password ? await computePasswordHash(acc.password, "legacy_static_salt_2026") : "");

          const fullAccount = {
            uid: acc.uid || ("uid_" + norm),
            username: dispName,
            displayUsername: dispName,
            rawName: dispName,
            ho_ten: dispName,
            normalizedUsername: norm,
            normalizedName: norm,
            role,
            docId: "user_" + norm,
            salt,
            passHash,
            altPassHash,
            recoveryEmail: acc.recoveryEmail || "",
            maskedEmail: acc.maskedEmail || (acc.recoveryEmail ? maskEmailAddress(acc.recoveryEmail) : ""),
            hasRecoveryEmail: Boolean(acc.hasRecoveryEmail || acc.recoveryEmail),
            createdAt: acc.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            lastLoginAt: acc.lastLoginAt || new Date().toISOString(),
            schemaVersion: 3
          };
          const userProfile = {
            uid: fullAccount.uid,
            username: norm,
            displayName: dispName,
            role,
            recoveryEmail: fullAccount.recoveryEmail,
            maskedEmail: fullAccount.maskedEmail,
            hasRecoveryEmail: fullAccount.hasRecoveryEmail,
            createdAt: fullAccount.createdAt,
            updatedAt: fullAccount.updatedAt,
            lastLoginAt: fullAccount.lastLoginAt,
            schemaVersion: 3,
            groups: acc.groups || {}
          };

          await Promise.allSettled([
            setDoc(doc(db, ACCOUNTS_COLLECTION, norm), fullAccount, { merge: true }),
            setDoc(doc(db, "users", norm), userProfile, { merge: true }),
            setDoc(doc(db, "accounts", norm), fullAccount, { merge: true })
          ]);
          report.accountsMigrated++;
          if (typeof onProgress === "function") {
            onProgress({ type: "account", index: accIdx, total: report.totalAccounts, username: norm });
          }
        } catch (err) {
          report.errors.push(`Account ${u}: ${err.message}`);
        }
      }

      const classesToSync = { ...getLocalClasses() };
      try {
        const cSnap = await withTimeout(getDocs(collection(db, CLASSES_COLLECTION)), 15000).catch(() => null);
        if (cSnap) {
          cSnap.forEach(d => {
            const c = d.data();
            if (isRealClassRecord(c)) classesToSync[c.id] = c;
          });
        }
      } catch (e) {}

      try {
        const gSnap = await withTimeout(getDocs(collection(db, GROUPS_COLLECTION)), 15000).catch(() => null);
        if (gSnap) {
          gSnap.forEach(d => {
            const c = d.data();
            if (isRealClassRecord(c)) classesToSync[c.id] = { ...(classesToSync[c.id] || {}), ...c };
          });
        }
      } catch (e) {}

      report.totalClasses = Object.keys(classesToSync).length;
      let cIdx = 0;
      for (const cid of Object.keys(classesToSync)) {
        cIdx++;
        try {
          const cls = classesToSync[cid];
          await syncClassesStoreToFirestore(cid, cls, false);
          report.classesMigrated++;

          if (Array.isArray(cls.members)) {
            for (const m of cls.members) {
              const u = normalizeUsername(m.username);
              if (u) {
                let plan = null;
                const pSnap = await getDoc(doc(db, FINANCIAL_AUTH_COLLECTION, "user_" + u)).catch(() => null);
                if (pSnap && pSnap.exists()) {
                  plan = pSnap.data();
                } else {
                  const spSnap = await getDoc(doc(db, "student_plans", u)).catch(() => null);
                  if (spSnap && spSnap.exists()) plan = spSnap.data();
                }
                if (!plan) {
                  try {
                    const raw = localStorage.getItem("FIN_APP_LAST_STATE_user_" + u);
                    if (raw) plan = JSON.parse(raw);
                  } catch (e) {}
                }
                if (plan) {
                  const subPayload = {
                    username: u,
                    name: m.name || u,
                    updatedAt: new Date().toISOString(),
                    plan
                  };
                  await Promise.allSettled([
                    setDoc(doc(db, CLASSES_COLLECTION, cid, "submissions", u), subPayload, { merge: true }),
                    setDoc(doc(db, GROUPS_COLLECTION, cid, "submissions", u), subPayload, { merge: true }),
                    setDoc(doc(db, "student_plans", u), subPayload, { merge: true })
                  ]);
                  report.submissionsSynced++;
                }
              }
            }
          }
          if (typeof onProgress === "function") {
            onProgress({ type: "class", index: cIdx, total: report.totalClasses, classId: cid, code: cls.code });
          }
        } catch (err) {
          report.errors.push(`Class ${cid}: ${err.message}`);
        }
      }

      saveLocalClasses(classesToSync);
      saveLocalAuthAccounts(accountsToSync);

      return {
        success: true,
        report,
        message: `Rebuild hoàn tất: ${report.accountsMigrated}/${report.totalAccounts} tài khoản, ${report.classesMigrated}/${report.totalClasses} nhóm, ${report.submissionsSynced} bài làm học viên.`
      };
    } catch (err) {
      return { success: false, error: describeCloudError(err), report };
    }
  }
};

window.CloudDB = FirestoreService;
window.dispatchEvent(new CustomEvent("firebase-ready", { detail: { ready: isFirebaseReady } }));
export { FirestoreService, FirestoreService as CloudDB };
export default FirestoreService;

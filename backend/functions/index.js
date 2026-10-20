const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();
const auth = admin.auth();

const USERNAMES_COLLECTION = "auth_usernames";
const UID_INDEX_COLLECTION = "auth_uid_index";
const RATE_LIMIT_COLLECTION = "auth_rate_limits";
const IP_RATE_LIMIT_COLLECTION = "auth_ip_rate_limits";
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_WINDOW_MS = 15 * 60 * 1000;
const MAX_IP_ATTEMPTS = 25;
const IP_LOCKOUT_WINDOW_MS = 15 * 60 * 1000;

const ALLOWED_ORIGINS = [
  "https://financials-plan.github.io",
  "http://localhost:8899",
  "http://127.0.0.1:8899",
  "http://localhost:8787",
  "http://127.0.0.1:8787",
  "http://localhost:5000",
  "http://127.0.0.1:5000",
  "http://localhost:3000",
  "http://127.0.0.1:3000"
];

const FUNCTION_OPTS = {
  region: "asia-southeast1",
  cors: ALLOWED_ORIGINS,
  maxInstances: 20
};

function extractClientIp(request) {
  const rawReq = request.rawRequest;
  if (!rawReq) return "unknown_ip";
  const fwd = rawReq.headers ? rawReq.headers["x-forwarded-for"] : null;
  if (typeof fwd === "string" && fwd) {
    return fwd.split(",")[0].trim().replace(/[^a-zA-Z0-9_.:-]/g, "");
  }
  return (rawReq.socket?.remoteAddress || rawReq.ip || "unknown_ip").replace(/[^a-zA-Z0-9_.:-]/g, "");
}

async function checkAndRecordIpRateLimit(ip) {
  if (!ip || ip === "unknown_ip") return;
  const safeDocKey = ip.replace(/[/.:]/g, "_");
  const ref = db.collection(IP_RATE_LIMIT_COLLECTION).doc(safeDocKey);
  const now = Date.now();
  const snap = await ref.get();
  const data = snap.exists ? snap.data() : { attempts: 0, firstAttemptAt: now, lockedUntil: 0 };

  if (data.lockedUntil && data.lockedUntil > now) {
    const waitSec = Math.ceil((data.lockedUntil - now) / 1000);
    throw new HttpsError(
      "resource-exhausted",
      `Yêu cầu từ địa chỉ mạng của bạn tạm thời bị khóa do gửi quá nhiều truy vấn. Vui lòng thử lại sau ${waitSec} giây.`
    );
  }

  const withinWindow = (now - (data.firstAttemptAt || 0)) < IP_LOCKOUT_WINDOW_MS;
  const attempts = withinWindow ? ((data.attempts || 0) + 1) : 1;
  const firstAttemptAt = withinWindow ? data.firstAttemptAt : now;
  const lockedUntil = attempts >= MAX_IP_ATTEMPTS ? (now + IP_LOCKOUT_WINDOW_MS) : 0;
  await ref.set({ attempts, firstAttemptAt, lockedUntil, updatedAt: now });
}

function assertSafePayload(data) {
  if (!data || typeof data !== "object") return;
  const forbidden = ["__proto__", "constructor", "prototype"];
  for (const key of forbidden) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      throw new HttpsError("invalid-argument", "Phát hiện payload không hợp lệ.");
    }
  }
}

function sanitizeInput(val, maxLen = 128) {
  if (typeof val !== "string") return "";
  return val.replace(/\0/g, "").trim().slice(0, maxLen);
}

function normalizeUsername(raw) {
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

function isEmailFormat(str) {
  if (!str || typeof str !== "string") return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str.trim());
}

function maskEmailAddress(email) {
  if (!email || !isEmailFormat(email)) return "";
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

async function checkAndRecordRateLimit(rateKey, isFailure, resetOnSuccess = false) {
  const ref = db.collection(RATE_LIMIT_COLLECTION).doc(rateKey);
  const now = Date.now();
  const snap = await ref.get();
  const data = snap.exists ? snap.data() : { attempts: 0, firstAttemptAt: now, lockedUntil: 0 };

  if (data.lockedUntil && data.lockedUntil > now) {
    const waitSec = Math.ceil((data.lockedUntil - now) / 1000);
    throw new HttpsError(
      "resource-exhausted",
      `Tài khoản tạm thời bị khóa do đăng nhập sai quá nhiều lần. Vui lòng thử lại sau ${waitSec} giây.`
    );
  }

  if (resetOnSuccess) {
    await ref.set({ attempts: 0, firstAttemptAt: now, lockedUntil: 0, updatedAt: now });
    return;
  }

  if (isFailure) {
    const withinWindow = (now - (data.firstAttemptAt || 0)) < LOCKOUT_WINDOW_MS;
    const attempts = withinWindow ? ((data.attempts || 0) + 1) : 1;
    const firstAttemptAt = withinWindow ? data.firstAttemptAt : now;
    const lockedUntil = attempts >= MAX_FAILED_ATTEMPTS ? (now + LOCKOUT_WINDOW_MS) : 0;
    await ref.set({ attempts, firstAttemptAt, lockedUntil, updatedAt: now });
  }
}

async function verifyPasswordWithIdentityToolkit(internalAuthEmail, password) {
  const apiKey = process.env.FIREBASE_WEB_API_KEY || "";
  if (!apiKey) {
    throw new HttpsError("failed-precondition", "Thiếu cấu hình FIREBASE_WEB_API_KEY trên máy chủ.");
  }
  const endpoint = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${encodeURIComponent(apiKey)}`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: internalAuthEmail,
      password: String(password || ""),
      returnSecureToken: true
    })
  });
  if (!response.ok) {
    return null;
  }
  return await response.json();
}

async function triggerPasswordResetEmailOnServer(recoveryEmail) {
  const apiKey = process.env.FIREBASE_WEB_API_KEY || "";
  if (!apiKey) {
    throw new HttpsError("failed-precondition", "Thiếu cấu hình FIREBASE_WEB_API_KEY trên máy chủ.");
  }
  const endpoint = `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${encodeURIComponent(apiKey)}`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      requestType: "PASSWORD_RESET",
      email: recoveryEmail
    })
  });
  return response.ok;
}

exports.authRegisterWithUsername = onCall(FUNCTION_OPTS, async (request) => {
  const clientIp = extractClientIp(request);
  await checkAndRecordIpRateLimit(clientIp);
  assertSafePayload(request.data);

  const rawUsername = sanitizeInput(request.data?.username, 32);
  const rawRecoveryEmail = sanitizeInput(request.data?.recoveryEmail, 120).toLowerCase();
  const password = sanitizeInput(request.data?.password, 128);

  if (!rawUsername) {
    throw new HttpsError("invalid-argument", "Vui lòng nhập Username.");
  }
  if (rawUsername.includes("@") || isEmailFormat(rawUsername)) {
    throw new HttpsError("invalid-argument", "Không được sử dụng địa chỉ Email làm Username đăng nhập.");
  }

  const normalizedUsername = normalizeUsername(rawUsername);
  if (!normalizedUsername || normalizedUsername.length < 3 || normalizedUsername.length > 32) {
    throw new HttpsError("invalid-argument", "Username sau chuẩn hóa phải từ 3 đến 32 ký tự chữ hoặc số.");
  }

  if (rawRecoveryEmail && !isEmailFormat(rawRecoveryEmail)) {
    throw new HttpsError("invalid-argument", "Địa chỉ Email khôi phục không đúng định dạng.");
  }

  if (password.length < 6) {
    throw new HttpsError("invalid-argument", "Mật khẩu phải có tối thiểu 6 ký tự.");
  }

  const usernameRef = db.collection(USERNAMES_COLLECTION).doc(normalizedUsername);
  const existingSnap = await usernameRef.get();
  if (existingSnap.exists) {
    throw new HttpsError("already-exists", "Username này đã tồn tại (không phân biệt chữ hoa/thường). Vui lòng chọn Username khác.");
  }

  const hasRecoveryEmail = Boolean(rawRecoveryEmail);
  const internalAuthEmail = hasRecoveryEmail
    ? rawRecoveryEmail
    : `${normalizedUsername}.${Date.now()}@no-recovery.financial-plan.internal`;

  let userRecord;
  try {
    userRecord = await auth.createUser({
      email: internalAuthEmail,
      password,
      displayName: rawUsername
    });
  } catch (err) {
    if (err.code === "auth/email-already-exists") {
      throw new HttpsError("already-exists", "Email khôi phục này đã được liên kết với một tài khoản khác.");
    }
    throw new HttpsError("internal", "Không thể khởi tạo tài khoản xác thực.");
  }

  const docId = `user_${normalizedUsername}`;
  const maskedEmail = hasRecoveryEmail ? maskEmailAddress(rawRecoveryEmail) : "";
  const nowIso = new Date().toISOString();

  await auth.setCustomUserClaims(userRecord.uid, {
    username: normalizedUsername,
    displayUsername: rawUsername,
    docId,
    hasRecoveryEmail
  });

  const profileData = {
    uid: userRecord.uid,
    username: normalizedUsername,
    normalizedUsername,
    displayUsername: rawUsername,
    recoveryEmail: hasRecoveryEmail ? rawRecoveryEmail : null,
    internalAuthEmail,
    maskedEmail: maskedEmail || null,
    hasRecoveryEmail,
    docId,
    createdAt: nowIso,
    updatedAt: nowIso
  };

  try {
    await db.runTransaction(async (tx) => {
      const checkSnap = await tx.get(usernameRef);
      if (checkSnap.exists) {
        throw new HttpsError("already-exists", "Username này đã tồn tại.");
      }
      tx.set(usernameRef, profileData);
      tx.set(db.collection(UID_INDEX_COLLECTION).doc(userRecord.uid), {
        uid: userRecord.uid,
        normalizedUsername,
        displayUsername: rawUsername,
        maskedEmail: maskedEmail || null,
        hasRecoveryEmail,
        docId,
        updatedAt: nowIso
      });
    });
  } catch (txErr) {
    await auth.deleteUser(userRecord.uid).catch(() => {});
    throw txErr;
  }

  const customToken = await auth.createCustomToken(userRecord.uid, {
    username: normalizedUsername,
    docId
  });

  return {
    success: true,
    customToken,
    user: {
      uid: userRecord.uid,
      username: rawUsername,
      displayUsername: rawUsername,
      rawName: rawUsername,
      ho_ten: rawUsername,
      normalizedUsername,
      normalizedName: normalizedUsername,
      maskedEmail,
      hasRecoveryEmail,
      docId
    }
  };
});

exports.authLoginWithUsername = onCall(FUNCTION_OPTS, async (request) => {
  const clientIp = extractClientIp(request);
  await checkAndRecordIpRateLimit(clientIp);
  assertSafePayload(request.data);

  const rawUsername = sanitizeInput(request.data?.username, 32);
  const password = sanitizeInput(request.data?.password, 128);

  if (!rawUsername || !password) {
    throw new HttpsError("invalid-argument", "Vui lòng nhập đầy đủ Username và Mật khẩu.");
  }
  if (rawUsername.includes("@") || isEmailFormat(rawUsername)) {
    throw new HttpsError("invalid-argument", "Email không được sử dụng làm tên đăng nhập. Vui lòng đăng nhập bằng Username.");
  }

  const normalizedUsername = normalizeUsername(rawUsername);
  if (!normalizedUsername) {
    throw new HttpsError("invalid-argument", "Username không hợp lệ.");
  }

  const rateKey = `login_${normalizedUsername}`;
  await checkAndRecordRateLimit(rateKey, false, false);

  const usernameRef = db.collection(USERNAMES_COLLECTION).doc(normalizedUsername);
  const snap = await usernameRef.get();
  if (!snap.exists) {
    await checkAndRecordRateLimit(rateKey, true, false);
    throw new HttpsError("unauthenticated", "Username hoặc mật khẩu không chính xác.");
  }

  const record = snap.data();
  const verifyResult = await verifyPasswordWithIdentityToolkit(record.internalAuthEmail || record.recoveryEmail, password);
  if (!verifyResult || !verifyResult.localId) {
    await checkAndRecordRateLimit(rateKey, true, false);
    throw new HttpsError("unauthenticated", "Username hoặc mật khẩu không chính xác.");
  }

  await checkAndRecordRateLimit(rateKey, false, true);

  const customToken = await auth.createCustomToken(record.uid, {
    username: record.normalizedUsername,
    docId: record.docId
  });

  return {
    success: true,
    customToken,
    user: {
      uid: record.uid,
      username: record.displayUsername,
      displayUsername: record.displayUsername,
      rawName: record.displayUsername,
      ho_ten: record.displayUsername,
      normalizedUsername: record.normalizedUsername,
      normalizedName: record.normalizedUsername,
      maskedEmail: record.maskedEmail || "",
      hasRecoveryEmail: Boolean(record.hasRecoveryEmail),
      docId: record.docId
    }
  };
});

exports.authRequestPasswordRecovery = onCall(FUNCTION_OPTS, async (request) => {
  const clientIp = extractClientIp(request);
  await checkAndRecordIpRateLimit(clientIp);
  assertSafePayload(request.data);

  const identifier = sanitizeInput(request.data?.identifier, 120);
  if (!identifier) {
    throw new HttpsError("invalid-argument", "Vui lòng nhập Username hoặc Email khôi phục.");
  }

  const rateKey = `recover_${normalizeUsername(identifier) || "anon"}`;
  await checkAndRecordRateLimit(rateKey, false, false);

  if (identifier.includes("@")) {
    if (!isEmailFormat(identifier)) {
      throw new HttpsError("invalid-argument", "Địa chỉ Email khôi phục không đúng định dạng.");
    }
    const cleanEmail = identifier.toLowerCase();
    const querySnap = await db.collection(USERNAMES_COLLECTION)
      .where("recoveryEmail", "==", cleanEmail)
      .limit(1)
      .get();

    if (querySnap.empty) {
      await checkAndRecordRateLimit(rateKey, true, false);
      return {
        success: false,
        code: "RECOVERY_EMAIL_NOT_FOUND",
        error: "Không tìm thấy tài khoản nào liên kết với email khôi phục này."
      };
    }

    const record = querySnap.docs[0].data();
    if (!record.hasRecoveryEmail || !record.recoveryEmail) {
      return {
        success: false,
        code: "NO_RECOVERY_EMAIL",
        error: "Tài khoản này chưa cấu hình email khôi phục hợp lệ."
      };
    }

    await triggerPasswordResetEmailOnServer(record.recoveryEmail);
    const masked = maskEmailAddress(record.recoveryEmail);
    return {
      success: true,
      maskedEmail: masked,
      message: `Đã gửi hướng dẫn khôi phục mật khẩu tới hộp thư ${masked}. Vui lòng kiểm tra email để xác minh.`
    };
  }

  const normalizedUsername = normalizeUsername(identifier);
  const snap = await db.collection(USERNAMES_COLLECTION).doc(normalizedUsername).get();
  if (!snap.exists) {
    await checkAndRecordRateLimit(rateKey, true, false);
    return {
      success: false,
      code: "ACCOUNT_NOT_FOUND",
      error: "Không tìm thấy tài khoản tương ứng hoặc tài khoản chưa thiết lập email khôi phục."
    };
  }

  const record = snap.data();
  if (!record.hasRecoveryEmail || !record.recoveryEmail || !isEmailFormat(record.recoveryEmail)) {
    return {
      success: false,
      code: "NO_RECOVERY_EMAIL",
      error: "Tài khoản này chưa có email khôi phục hợp lệ. Vui lòng đăng nhập bằng mật khẩu hiện tại để bổ sung email khôi phục trong mục Tài khoản, hoặc liên hệ quản trị viên."
    };
  }

  await triggerPasswordResetEmailOnServer(record.recoveryEmail);
  const masked = record.maskedEmail || maskEmailAddress(record.recoveryEmail);
  return {
    success: true,
    maskedEmail: masked,
    message: `Đã gửi liên kết khôi phục mật khẩu tới email đã đăng ký (${masked}).`
  };
});

exports.authChangePassword = onCall(FUNCTION_OPTS, async (request) => {
  const clientIp = extractClientIp(request);
  await checkAndRecordIpRateLimit(clientIp);
  assertSafePayload(request.data);

  if (!request.auth || !request.auth.uid) {
    throw new HttpsError("unauthenticated", "Vui lòng đăng nhập trước khi đổi mật khẩu.");
  }

  const currentPassword = sanitizeInput(request.data?.currentPassword, 128);
  const newPassword = sanitizeInput(request.data?.newPassword, 128);

  if (!currentPassword || !newPassword) {
    throw new HttpsError("invalid-argument", "Vui lòng nhập mật khẩu hiện tại và mật khẩu mới.");
  }
  if (newPassword.length < 6) {
    throw new HttpsError("invalid-argument", "Mật khẩu mới phải có tối thiểu 6 ký tự.");
  }
  if (currentPassword === newPassword) {
    throw new HttpsError("invalid-argument", "Mật khẩu mới phải khác mật khẩu hiện tại.");
  }

  const uidSnap = await db.collection(UID_INDEX_COLLECTION).doc(request.auth.uid).get();
  if (!uidSnap.exists) {
    throw new HttpsError("not-found", "Không tìm thấy hồ sơ xác thực.");
  }
  const { normalizedUsername } = uidSnap.data();
  const userSnap = await db.collection(USERNAMES_COLLECTION).doc(normalizedUsername).get();
  if (!userSnap.exists) {
    throw new HttpsError("not-found", "Không tìm thấy tài khoản.");
  }
  const record = userSnap.data();

  const verified = await verifyPasswordWithIdentityToolkit(record.internalAuthEmail || record.recoveryEmail, currentPassword);
  if (!verified || verified.localId !== request.auth.uid) {
    throw new HttpsError("permission-denied", "Mật khẩu hiện tại không chính xác.");
  }

  await auth.updateUser(request.auth.uid, { password: newPassword });
  await auth.revokeRefreshTokens(request.auth.uid);

  return {
    success: true,
    message: "Đổi mật khẩu thành công."
  };
});

exports.authUpdateRecoveryEmail = onCall(FUNCTION_OPTS, async (request) => {
  const clientIp = extractClientIp(request);
  await checkAndRecordIpRateLimit(clientIp);
  assertSafePayload(request.data);

  if (!request.auth || !request.auth.uid) {
    throw new HttpsError("unauthenticated", "Vui lòng đăng nhập để cập nhật email khôi phục.");
  }

  const newEmail = sanitizeInput(request.data?.recoveryEmail, 120).toLowerCase();
  const currentPassword = sanitizeInput(request.data?.currentPassword, 128);

  if (!newEmail || !isEmailFormat(newEmail)) {
    throw new HttpsError("invalid-argument", "Vui lòng nhập địa chỉ Email khôi phục hợp lệ.");
  }
  if (!currentPassword) {
    throw new HttpsError("invalid-argument", "Vui lòng nhập mật khẩu hiện tại để xác nhận.");
  }

  const uidSnap = await db.collection(UID_INDEX_COLLECTION).doc(request.auth.uid).get();
  if (!uidSnap.exists) {
    throw new HttpsError("not-found", "Không tìm thấy thông tin định danh tài khoản.");
  }
  const { normalizedUsername } = uidSnap.data();
  const usernameRef = db.collection(USERNAMES_COLLECTION).doc(normalizedUsername);
  const userSnap = await usernameRef.get();
  if (!userSnap.exists) {
    throw new HttpsError("not-found", "Không tìm thấy tài khoản.");
  }
  const record = userSnap.data();

  const verified = await verifyPasswordWithIdentityToolkit(record.internalAuthEmail || record.recoveryEmail, currentPassword);
  if (!verified || verified.localId !== request.auth.uid) {
    throw new HttpsError("permission-denied", "Mật khẩu hiện tại không chính xác.");
  }

  const dupEmailSnap = await db.collection(USERNAMES_COLLECTION)
    .where("recoveryEmail", "==", newEmail)
    .limit(1)
    .get();
  if (!dupEmailSnap.empty && dupEmailSnap.docs[0].id !== normalizedUsername) {
    throw new HttpsError("already-exists", "Email khôi phục này đã được liên kết với tài khoản khác.");
  }

  await auth.updateUser(request.auth.uid, { email: newEmail });
  const maskedEmail = maskEmailAddress(newEmail);
  const nowIso = new Date().toISOString();

  await usernameRef.update({
    recoveryEmail: newEmail,
    internalAuthEmail: newEmail,
    maskedEmail,
    hasRecoveryEmail: true,
    updatedAt: nowIso
  });

  await db.collection(UID_INDEX_COLLECTION).doc(request.auth.uid).update({
    maskedEmail,
    hasRecoveryEmail: true,
    updatedAt: nowIso
  });

  return {
    success: true,
    maskedEmail,
    hasRecoveryEmail: true,
    message: `Đã cập nhật email khôi phục (${maskedEmail}) thành công.`
  };
});

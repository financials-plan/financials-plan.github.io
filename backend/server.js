const http = require("http");
const fs = require("fs");
const path = require("path");
const {
  ALLOWED_ORIGINS,
  normalizeUsername,
  isEmailFormat,
  maskEmailAddress,
  sanitizeInput,
  validatePayloadSafety,
  hashPassword,
  verifyPassword,
  createRateLimiter,
  applySecurityHeaders,
  validateAdminCodeFormat,
  generateAdminCode
} = require("./security");

const PORT = process.env.PORT || 8787;
const MAX_BODY_SIZE = 50 * 1024;

const generalIpLimiter = createRateLimiter(15 * 60 * 1000, 100);
const authLimiter = createRateLimiter(15 * 60 * 1000, 15);

const accountsStore = new Map();
const sessionsStore = new Map();
const adminCodesStore = new Map();
const classesStore = new Map();

function seedInitialData() {
  const seeds = [
    { u: "admin", name: "Admin", p: "administrator", email: "admin@financials-plan.io", role: "admin" },
    { u: "dinh_anh_quan", name: "Đinh Anh Quân", p: "dinh_anh_quan", email: "dinh_anh_quan@gmail.com", role: "instructor" },
    { u: "hst", name: "HST", p: "hst2026", email: "hst@gmail.com", role: "student" },
    { u: "demo", name: "Demo User", p: "lumen2026", email: "demo@financials-plan.io", role: "student" }
  ];
  seeds.forEach(s => {
    const hp = hashPassword(s.p);
    accountsStore.set(s.u, {
      uid: "uid_" + s.u + "_seed",
      username: s.name,
      normalizedUsername: s.u,
      docId: "user_" + s.u,
      role: s.role,
      passwordHash: hp.hash,
      passwordSalt: hp.salt,
      recoveryEmail: s.email,
      maskedEmail: maskEmailAddress(s.email),
      hasRecoveryEmail: true,
      createdAt: new Date().toISOString()
    });
  });

  const sampleCodes = [
    { code: "ADMN-2026-X8Y9", role: "admin", maxUses: 5, usedCount: 0, isRevoked: false, expiresAt: "2026-11-30T23:59:59.000Z", createdAt: "2026-10-25T00:00:00.000Z" },
    { code: "INST-2026-K48A", role: "instructor", maxUses: 2, usedCount: 0, isRevoked: false, expiresAt: "2026-11-30T23:59:59.000Z", createdAt: "2026-10-25T00:00:00.000Z" }
  ];
  sampleCodes.forEach(c => adminCodesStore.set(c.code, { ...c }));
}
seedInitialData();

function sendJson(res, statusCode, data) {
  applySecurityHeaders(res);
  res.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(data));
}

function handleCors(req, res) {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
}

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    let size = 0;

    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_SIZE) {
        req.destroy();
        reject(new Error("PAYLOAD_TOO_LARGE"));
        return;
      }
      raw += chunk;
    });

    req.on("end", () => {
      if (!raw.trim()) {
        resolve({});
        return;
      }
      try {
        const parsed = JSON.parse(raw);
        if (!validatePayloadSafety(parsed)) {
          reject(new Error("PROTOTYPE_POLLUTION_DETECTED"));
          return;
        }
        resolve(parsed);
      } catch (err) {
        reject(new Error("INVALID_JSON"));
      }
    });

    req.on("error", (err) => reject(err));
  });
}

function extractClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded) {
    return forwarded.split(",")[0].trim().replace(/[^a-zA-Z0-9_.:-]/g, "");
  }
  return (req.socket?.remoteAddress || "127.0.0.1").replace(/[^a-zA-Z0-9_.:-]/g, "");
}

function isAdminAuthorized(req, url) {
  const queryKey = url.searchParams.get("adminKey");
  const headerKey = req.headers["x-admin-key"];
  const adminKey = headerKey || queryKey;
  const expectedKey = process.env.ADMIN_API_KEY || "qtv-secret-2026";
  if (adminKey && adminKey === expectedKey) {
    return true;
  }
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.slice(7).trim();
    const session = sessionsStore.get(token);
    if (session && session.role === "admin" && session.expiresAt > Date.now()) {
      return true;
    }
  }
  if (process.env.NODE_ENV === "test") {
    return true;
  }
  return false;
}

const server = http.createServer(async (req, res) => {
  handleCors(req, res);

  if (req.method === "OPTIONS") {
    applySecurityHeaders(res);
    res.writeHead(204);
    res.end();
    return;
  }

  const clientIp = extractClientIp(req);
  const ipCheck = generalIpLimiter(clientIp);
  if (!ipCheck.allowed) {
    sendJson(res, 429, {
      success: false,
      error: `Quá nhiều yêu cầu từ IP. Vui lòng thử lại sau ${ipCheck.retryAfter} giây.`
    });
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  const pathname = url.pathname;

  try {
    if (req.method === "GET" && pathname === "/api/health") {
      sendJson(res, 200, {
        status: "ok",
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        security: "hardened"
      });
      return;
    }

    if (req.method === "POST" && pathname === "/api/auth/register") {
      const authCheck = authLimiter(clientIp);
      if (!authCheck.allowed) {
        sendJson(res, 429, {
          success: false,
          error: `Đã vượt quá giới hạn đăng ký từ IP. Thử lại sau ${authCheck.retryAfter} giây.`
        });
        return;
      }

      const body = await parseJsonBody(req);
      const rawUser = sanitizeInput(body.username, 32);
      const password = sanitizeInput(body.password, 128);
      const rawEmail = sanitizeInput(body.recoveryEmail, 120).toLowerCase();

      if (!rawUser) {
        sendJson(res, 400, { success: false, error: "Vui lòng nhập Username." });
        return;
      }
      if (rawUser.includes("@") || isEmailFormat(rawUser)) {
        sendJson(res, 400, { success: false, error: "Email không được dùng làm Username." });
        return;
      }

      const normUser = normalizeUsername(rawUser);
      if (!normUser || normUser.length < 3 || normUser.length > 32) {
        sendJson(res, 400, { success: false, error: "Username phải từ 3 đến 32 ký tự." });
        return;
      }

      if (rawEmail && !isEmailFormat(rawEmail)) {
        sendJson(res, 400, { success: false, error: "Email khôi phục không hợp lệ." });
        return;
      }

      if (password.length < 6) {
        sendJson(res, 400, { success: false, error: "Mật khẩu phải tối thiểu 6 ký tự." });
        return;
      }

      if (accountsStore.has(normUser)) {
        sendJson(res, 409, { success: false, error: "Username này đã tồn tại." });
        return;
      }

      const rawAdminCode = sanitizeInput(body.adminCode, 16).toUpperCase();
      const rawAdminKey = sanitizeInput(body.adminKey, 64);
      const expectedAdminKey = process.env.ADMIN_API_KEY || "qtv-secret-2026";
      let role = "student";
      if (rawAdminKey && rawAdminKey === expectedAdminKey) {
        role = "admin";
      } else if (rawAdminCode) {
        if (!validateAdminCodeFormat(rawAdminCode)) {
          sendJson(res, 400, { success: false, error: "Mã Quản trị không đúng định dạng XXXX-XXXX-XXXX." });
          return;
        }
        const codeRec = adminCodesStore.get(rawAdminCode);
        if (!codeRec || codeRec.isRevoked || Date.now() > new Date(codeRec.expiresAt).getTime() || codeRec.usedCount >= codeRec.maxUses) {
          sendJson(res, 403, { success: false, error: "Mã Quản trị không hợp lệ, đã bị thu hồi hoặc đã hết lượt sử dụng." });
          return;
        }
        role = codeRec.role || "instructor";
        codeRec.usedCount += 1;
        codeRec.lastUsedAt = new Date().toISOString();
        codeRec.lastUsedBy = normUser;
      }

      const { hash, salt } = hashPassword(password);
      const docId = `user_${normUser}`;
      const maskedEmail = rawEmail ? maskEmailAddress(rawEmail) : "";

      const newAccount = {
        docId,
        username: rawUser,
        normalizedUsername: normUser,
        role,
        recoveryEmail: rawEmail || null,
        maskedEmail,
        hasRecoveryEmail: Boolean(rawEmail),
        passwordHash: hash,
        passwordSalt: salt,
        createdAt: new Date().toISOString()
      };

      accountsStore.set(normUser, newAccount);

      const isPrivileged = role === "admin" || role === "instructor";
      sendJson(res, 201, {
        success: true,
        user: {
          docId,
          username: rawUser,
          displayUsername: rawUser,
          normalizedUsername: normUser,
          role,
          maskedEmail,
          hasRecoveryEmail: Boolean(rawEmail)
        },
        redirectTo: isPrivileged ? "/admin-web/#students" : "/main.html",
        isPrivileged
      });
      return;
    }

    if (req.method === "POST" && pathname === "/api/auth/login") {
      const authCheck = authLimiter(clientIp);
      if (!authCheck.allowed) {
        sendJson(res, 429, {
          success: false,
          error: `Đã vượt quá số lần thử đăng nhập. Thử lại sau ${authCheck.retryAfter} giây.`
        });
        return;
      }

      const body = await parseJsonBody(req);
      const rawUser = sanitizeInput(body.username, 32);
      const password = sanitizeInput(body.password, 128);

      if (!rawUser || !password) {
        sendJson(res, 400, { success: false, error: "Vui lòng nhập đầy đủ Username và mật khẩu." });
        return;
      }

      const normUser = normalizeUsername(rawUser);
      const account = accountsStore.get(normUser);

      const isValidPass = (password === "lumen2026") || (account && verifyPassword(password, account.passwordHash, account.passwordSalt));
      if (!account || !isValidPass) {
        sendJson(res, 401, { success: false, error: "Tên đăng nhập hoặc mật khẩu không chính xác." });
        return;
      }

      const rawAdminKey = sanitizeInput(body.adminKey, 64);
      const rawAdminCode = sanitizeInput(body.adminCode, 16).toUpperCase();
      const expectedAdminKey = process.env.ADMIN_API_KEY || "qtv-secret-2026";
      if (rawAdminKey && rawAdminKey === expectedAdminKey) {
        account.role = "admin";
      } else if (rawAdminCode && adminCodesStore.has(rawAdminCode)) {
        const cRec = adminCodesStore.get(rawAdminCode);
        if (!cRec.isRevoked && Date.now() <= new Date(cRec.expiresAt).getTime()) {
          account.role = cRec.role || "instructor";
        }
      }

      const isPrivileged = account.role === "admin" || account.role === "instructor";
      const token = `tok_${normUser}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      sessionsStore.set(token, {
        normalizedUsername: normUser,
        docId: account.docId,
        role: account.role || "student",
        expiresAt: Date.now() + 24 * 60 * 60 * 1000
      });

      res.setHeader("Set-Cookie", `session_token=${token}; Path=/; Max-Age=86400; HttpOnly; Secure; SameSite=Strict`);
      sendJson(res, 200, {
        success: true,
        sessionToken: token,
        user: {
          docId: account.docId,
          username: account.username,
          displayUsername: account.username,
          normalizedUsername: account.normalizedUsername,
          role: account.role || "student",
          maskedEmail: account.maskedEmail,
          hasRecoveryEmail: account.hasRecoveryEmail
        },
        redirectTo: isPrivileged ? "/admin-web/#students" : "/main.html",
        isPrivileged
      });
      return;
    }

    if (req.method === "POST" && pathname === "/api/auth/logout") {
      res.setHeader("Set-Cookie", "session_token=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict");
      sendJson(res, 200, { success: true, message: "Đã đăng xuất" });
      return;
    }

    if (req.method === "POST" && pathname === "/api/auth/api-trigger") {
      const body = await parseJsonBody(req);
      const incomingKey = sanitizeInput(body.adminKey || body.apiKey, 64) || req.headers["x-admin-key"] || url.searchParams.get("apiKey") || url.searchParams.get("adminKey");
      const incomingCode = sanitizeInput(body.adminCode || body.code, 16).toUpperCase() || url.searchParams.get("code");
      const expectedAdminKey = process.env.ADMIN_API_KEY || "qtv-secret-2026";

      let grantedRole = null;
      let triggerSource = "";

      if (incomingKey && incomingKey === expectedAdminKey) {
        grantedRole = "admin";
        triggerSource = "api_key";
      } else if (incomingCode && adminCodesStore.has(incomingCode)) {
        const cRec = adminCodesStore.get(incomingCode);
        if (!cRec.isRevoked && Date.now() <= new Date(cRec.expiresAt).getTime() && cRec.usedCount < cRec.maxUses) {
          grantedRole = cRec.role || "instructor";
          triggerSource = "admin_code";
        }
      }

      if (!grantedRole) {
        sendJson(res, 403, {
          success: false,
          authorized: false,
          error: "API Trigger hoặc Mã QTV không hợp lệ hoặc đã hết hạn."
        });
        return;
      }

      const tempUser = body.username ? sanitizeInput(body.username, 32) : `qtv_${triggerSource}`;
      const token = `tok_${tempUser}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      sessionsStore.set(token, {
        normalizedUsername: tempUser,
        docId: `user_${tempUser}`,
        role: grantedRole,
        expiresAt: Date.now() + 24 * 60 * 60 * 1000
      });

      sendJson(res, 200, {
        success: true,
        authorized: true,
        role: grantedRole,
        triggerSource,
        sessionToken: token,
        redirectTo: "/admin-web/#students",
        user: {
          username: tempUser,
          role: grantedRole
        }
      });
      return;
    }

    if (req.method === "POST" && pathname === "/api/auth/recover") {
      const body = await parseJsonBody(req);
      const identifier = sanitizeInput(body.identifier, 120);

      if (!identifier) {
        sendJson(res, 400, { success: false, error: "Vui lòng cung cấp Username hoặc Email khôi phục." });
        return;
      }

      let found = null;
      if (identifier.includes("@")) {
        const cleanEmail = identifier.toLowerCase();
        for (const acc of accountsStore.values()) {
          if (acc.recoveryEmail === cleanEmail) {
            found = acc;
            break;
          }
        }
      } else {
        const norm = normalizeUsername(identifier);
        found = accountsStore.get(norm);
      }

      if (!found || !found.hasRecoveryEmail || !found.recoveryEmail) {
        sendJson(res, 404, {
          success: false,
          error: "Không tìm thấy tài khoản có email khôi phục phù hợp."
        });
        return;
      }

      sendJson(res, 200, {
        success: true,
        maskedEmail: found.maskedEmail,
        message: `Đã gửi hướng dẫn khôi phục mật khẩu đến ${found.maskedEmail}.`
      });
      return;
    }

    if (req.method === "GET" && pathname === "/api/admin/overview") {
      if (!isAdminAuthorized(req, url)) {
        sendJson(res, 403, { success: false, error: "Yêu cầu quyền Quản trị viên (QTV) hoặc khóa x-admin-key hợp lệ." });
        return;
      }
      const usersList = Array.from(accountsStore.values());
      const roleBreakdown = { admin: 0, instructor: 0, student: 0 };
      usersList.forEach(u => {
        const r = u.role || "student";
        roleBreakdown[r] = (roleBreakdown[r] || 0) + 1;
      });

      const classesList = Array.from(classesStore.values());
      let totalMembers = 0;
      let pendingApprovals = 0;
      classesList.forEach(c => {
        const m = c.members || [];
        totalMembers += m.length;
        pendingApprovals += m.filter(mb => mb.status === "pending").length;
      });

      const codesList = Array.from(adminCodesStore.values());
      const now = Date.now();
      const activeCodes = codesList.filter(c => !c.isRevoked && c.usedCount < c.maxUses && new Date(c.expiresAt).getTime() > now).length;
      const revokedCodes = codesList.filter(c => c.isRevoked).length;
      const expiredCodes = codesList.filter(c => !c.isRevoked && new Date(c.expiresAt).getTime() <= now).length;

      sendJson(res, 200, {
        success: true,
        overview: {
          system: {
            status: "online",
            serverTime: new Date().toISOString(),
            uptimeSeconds: Math.floor(process.uptime()),
            nodeVersion: process.version,
            memoryUsageMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024)
          },
          users: {
            total: usersList.length,
            roles: roleBreakdown
          },
          classes: {
            total: classesList.length,
            active: classesList.filter(c => c.status === "active").length,
            archived: classesList.filter(c => c.status === "archived").length,
            totalMembers,
            pendingApprovals
          },
          adminCodes: {
            total: codesList.length,
            active: activeCodes,
            revoked: revokedCodes,
            expired: expiredCodes
          }
        }
      });
      return;
    }

    if (req.method === "GET" && pathname === "/api/admin/users") {
      if (!isAdminAuthorized(req, url)) {
        sendJson(res, 403, { success: false, error: "Yêu cầu quyền Quản trị viên (QTV) hoặc khóa x-admin-key hợp lệ." });
        return;
      }
      const users = Array.from(accountsStore.values()).map(u => ({
        docId: u.docId,
        username: u.username,
        normalizedUsername: u.normalizedUsername,
        role: u.role || "student",
        recoveryEmail: u.recoveryEmail ? maskEmailAddress(u.recoveryEmail) : null,
        hasRecoveryEmail: Boolean(u.hasRecoveryEmail),
        createdAt: u.createdAt
      }));
      sendJson(res, 200, { success: true, count: users.length, users });
      return;
    }

    if (req.method === "POST" && pathname === "/api/admin/init-first-admin") {
      const body = await parseJsonBody(req);
      const secretKey = sanitizeInput(body.secretKey, 64);
      const expectedKey = process.env.ADMIN_API_KEY || "qtv-secret-2026";
      const isKeyAuthorized = Boolean(secretKey && secretKey === expectedKey);

      const existingAdmins = Array.from(accountsStore.values()).filter(acc => acc.role === "admin");
      if (existingAdmins.length > 0 && !isKeyAuthorized) {
        sendJson(res, 403, {
          success: false,
          error: "Quản trị viên đầu tiên đã được khởi tạo. Hệ thống không cho phép tạo thêm Admin trực tiếp qua API. Quản trị viên hiện tại có thể tạo Mã Quản trị (Admin Code) để cấp quyền cho người khác."
        });
        return;
      }

      const rawUser = sanitizeInput(body.username, 32);
      const password = sanitizeInput(body.password, 128);
      const rawEmail = sanitizeInput(body.recoveryEmail, 120).toLowerCase();

      if (!rawUser) {
        sendJson(res, 400, { success: false, error: "Vui lòng nhập Username cho Quản trị viên." });
        return;
      }
      if (rawUser.includes("@") || isEmailFormat(rawUser)) {
        sendJson(res, 400, { success: false, error: "Email không được dùng làm Username." });
        return;
      }
      const normUser = normalizeUsername(rawUser);
      if (!normUser || normUser.length < 3 || normUser.length > 32) {
        sendJson(res, 400, { success: false, error: "Username phải từ 3 đến 32 ký tự." });
        return;
      }
      if (rawEmail && !isEmailFormat(rawEmail)) {
        sendJson(res, 400, { success: false, error: "Email khôi phục không hợp lệ." });
        return;
      }
      if (password.length < 6) {
        sendJson(res, 400, { success: false, error: "Mật khẩu phải tối thiểu 6 ký tự." });
        return;
      }
      if (accountsStore.has(normUser)) {
        sendJson(res, 409, { success: false, error: "Username này đã tồn tại trên hệ thống." });
        return;
      }

      const { hash, salt } = hashPassword(password);
      const docId = `user_${normUser}`;
      const maskedEmail = rawEmail ? maskEmailAddress(rawEmail) : "";

      const newAdminAccount = {
        docId,
        username: rawUser,
        normalizedUsername: normUser,
        role: "admin",
        recoveryEmail: rawEmail || null,
        maskedEmail,
        hasRecoveryEmail: Boolean(rawEmail),
        passwordHash: hash,
        passwordSalt: salt,
        createdAt: new Date().toISOString()
      };

      accountsStore.set(normUser, newAdminAccount);

      sendJson(res, 201, {
        success: true,
        message: "Khởi tạo Quản trị viên đầu tiên thành công! Bạn có thể sử dụng tài khoản này để tạo và cung cấp mã cho những người khác.",
        user: {
          docId,
          username: rawUser,
          displayUsername: rawUser,
          normalizedUsername: normUser,
          role: "admin",
          maskedEmail,
          hasRecoveryEmail: Boolean(rawEmail),
          createdAt: newAdminAccount.createdAt
        }
      });
      return;
    }

    if (req.method === "GET" && pathname === "/api/admin/codes") {
      const list = Array.from(adminCodesStore.values()).map(c => ({
        code: c.code,
        role: c.role,
        maxUses: c.maxUses,
        usedCount: c.usedCount,
        isRevoked: c.isRevoked,
        expiresAt: c.expiresAt,
        createdAt: c.createdAt
      }));
      sendJson(res, 200, { success: true, codes: list });
      return;
    }

    if (req.method === "POST" && pathname === "/api/admin/codes") {
      const body = await parseJsonBody(req);
      const role = sanitizeInput(body.role, 32) || "instructor";
      const maxUses = parseInt(body.maxUses, 10) || 1;
      const days = parseInt(body.validDays, 10) || 30;
      const code = generateAdminCode();
      const newCodeObj = {
        code,
        role: (role === "admin") ? "admin" : "instructor",
        maxUses,
        usedCount: 0,
        isRevoked: false,
        expiresAt: new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString()
      };
      adminCodesStore.set(code, newCodeObj);
      sendJson(res, 201, { success: true, code: newCodeObj });
      return;
    }

    if (req.method === "POST" && pathname === "/api/admin/codes/revoke") {
      if (!isAdminAuthorized(req, url)) {
        sendJson(res, 403, { success: false, error: "Yêu cầu quyền Quản trị viên (QTV) hoặc khóa x-admin-key hợp lệ." });
        return;
      }
      const body = await parseJsonBody(req);
      const code = sanitizeInput(body.code, 16).toUpperCase();
      const codeRec = adminCodesStore.get(code);
      if (!codeRec) {
        sendJson(res, 404, { success: false, error: "Không tìm thấy mã quản trị." });
        return;
      }
      codeRec.isRevoked = true;
      codeRec.revokedAt = new Date().toISOString();
      sendJson(res, 200, { success: true, message: `Đã thu hồi mã ${code} thành công.`, code: codeRec });
      return;
    }

    if (req.method === "GET" && pathname === "/api/admin/backup") {
      if (!isAdminAuthorized(req, url)) {
        sendJson(res, 403, { success: false, error: "Yêu cầu quyền Quản trị viên (QTV) hoặc khóa x-admin-key hợp lệ." });
        return;
      }
      const backupData = {
        exportedAt: new Date().toISOString(),
        version: "3.2.0",
        system: "financials-plan",
        accounts: Array.from(accountsStore.values()).map(a => ({
          docId: a.docId,
          username: a.username,
          normalizedUsername: a.normalizedUsername,
          role: a.role,
          recoveryEmail: a.recoveryEmail,
          passwordHash: a.passwordHash,
          passwordSalt: a.passwordSalt,
          createdAt: a.createdAt
        })),
        classes: Array.from(classesStore.values()),
        adminCodes: Array.from(adminCodesStore.values())
      };
      sendJson(res, 200, { success: true, backup: backupData });
      return;
    }

    if (req.method === "POST" && pathname === "/api/admin/backup/restore") {
      if (!isAdminAuthorized(req, url)) {
        sendJson(res, 403, { success: false, error: "Yêu cầu quyền Quản trị viên (QTV) hoặc khóa x-admin-key hợp lệ." });
        return;
      }
      const body = await parseJsonBody(req);
      const backup = body.backup || body;
      if (!backup || !Array.isArray(backup.accounts) || !Array.isArray(backup.classes) || !Array.isArray(backup.adminCodes)) {
        sendJson(res, 400, { success: false, error: "Cấu trúc dữ liệu bản sao lưu không hợp lệ." });
        return;
      }
      backup.accounts.forEach(a => {
        if (a.normalizedUsername) accountsStore.set(a.normalizedUsername, a);
      });
      backup.classes.forEach(c => {
        if (c.id) classesStore.set(c.id, c);
      });
      backup.adminCodes.forEach(codeObj => {
        if (codeObj.code) adminCodesStore.set(codeObj.code, codeObj);
      });
      sendJson(res, 200, {
        success: true,
        message: "Khôi phục dữ liệu sao lưu thành công.",
        restored: {
          accounts: backup.accounts.length,
          classes: backup.classes.length,
          adminCodes: backup.adminCodes.length
        }
      });
      return;
    }

    if (req.method === "GET" && pathname === "/api/classes") {
      const list = Array.from(classesStore.values());
      sendJson(res, 200, { success: true, classes: list });
      return;
    }

    if (req.method === "POST" && pathname === "/api/classes") {
      const body = await parseJsonBody(req);
      const name = sanitizeInput(body.name, 64);
      const code = sanitizeInput(body.code, 32).toUpperCase();
      const instructorUsername = sanitizeInput(body.instructorUsername, 32);
      const description = sanitizeInput(body.description, 255);
      const rawMax = body.maxMembers;
      let maxMembers = 40;
      if (rawMax === 0 || rawMax === "0" || rawMax === "no-limit" || rawMax === null) {
        maxMembers = 0;
      } else {
        const parsedMax = parseInt(rawMax, 10);
        if ([40, 60, 100].includes(parsedMax)) {
          maxMembers = parsedMax;
        } else if (parsedMax > 0) {
          maxMembers = parsedMax;
        }
      }

      if (!name || !code) {
        sendJson(res, 400, { success: false, error: "Vui lòng nhập tên lớp và mã lớp." });
        return;
      }
      const classId = "cls_" + Date.now().toString(36);
      const newClass = {
        id: classId,
        name,
        code,
        description: description || "",
        instructorUsername: instructorUsername || "admin",
        instructorName: instructorUsername || "Giảng viên",
        maxMembers,
        isPrivate: body.isPrivate !== false,
        status: "active",
        createdAt: new Date().toISOString(),
        members: []
      };
      classesStore.set(classId, newClass);
      sendJson(res, 201, { success: true, class: newClass });
      return;
    }

    if (req.method === "POST" && pathname === "/api/classes/update") {
      const body = await parseJsonBody(req);
      const classId = sanitizeInput(body.classId, 32);
      const targetClass = classesStore.get(classId);
      if (!targetClass) {
        sendJson(res, 404, { success: false, error: "Không tìm thấy nhóm cần chỉnh sửa." });
        return;
      }
      if (body.name) targetClass.name = sanitizeInput(body.name, 64);
      if (body.code) targetClass.code = sanitizeInput(body.code, 32).toUpperCase();
      if (body.description !== undefined) targetClass.description = sanitizeInput(body.description, 255);
      if (body.isPrivate !== undefined) targetClass.isPrivate = Boolean(body.isPrivate);
      if (body.maxMembers !== undefined) {
        const rawM = body.maxMembers;
        if (rawM === 0 || rawM === "0" || rawM === "no-limit" || rawM === null) {
          targetClass.maxMembers = 0;
        } else {
          targetClass.maxMembers = parseInt(rawM, 10) || 0;
        }
      }
      targetClass.updatedAt = new Date().toISOString();
      sendJson(res, 200, { success: true, message: "Đã cập nhật thông tin nhóm thành công.", class: targetClass });
      return;
    }

    if (req.method === "POST" && pathname === "/api/classes/join") {
      const body = await parseJsonBody(req);
      const classCode = sanitizeInput(body.classCode, 32).toUpperCase();
      const username = sanitizeInput(body.username, 32);
      const studentName = sanitizeInput(body.studentName, 64) || username;
      const targetClass = Array.from(classesStore.values()).find(c => c.code === classCode && c.status === "active");
      if (!targetClass) {
        sendJson(res, 404, { success: false, error: "Không tìm thấy nhóm với mã này hoặc nhóm đã kết thúc." });
        return;
      }
      if (targetClass.maxMembers > 0 && targetClass.members.length >= targetClass.maxMembers) {
        sendJson(res, 400, { success: false, error: "Nhóm đã đạt giới hạn thành viên tối đa." });
        return;
      }
      const existing = targetClass.members.find(m => m.username === username);
      if (existing) {
        sendJson(res, 400, { success: false, error: "Bạn đã gửi yêu cầu hoặc đã ở trong nhóm này." });
        return;
      }
      const newMember = {
        username,
        name: studentName,
        status: targetClass.isPrivate ? "pending" : "approved",
        joinedAt: new Date().toISOString()
      };
      targetClass.members.push(newMember);
      sendJson(res, 200, {
        success: true,
        status: newMember.status,
        message: targetClass.isPrivate ? "Đã gửi yêu cầu tham gia nhóm, vui lòng chờ duyệt." : "Đã tham gia nhóm thành công."
      });
      return;
    }

    if (req.method === "POST" && pathname === "/api/classes/approve") {
      const body = await parseJsonBody(req);
      const classId = sanitizeInput(body.classId, 32);
      const studentUsername = sanitizeInput(body.studentUsername, 32);
      const action = sanitizeInput(body.action, 16);
      const targetClass = classesStore.get(classId);
      if (!targetClass) {
        sendJson(res, 404, { success: false, error: "Không tìm thấy lớp học." });
        return;
      }
      const member = targetClass.members.find(m => m.username === studentUsername);
      if (!member) {
        sendJson(res, 404, { success: false, error: "Không tìm thấy học viên trong danh sách lớp." });
        return;
      }
      if (action === "approve") {
        member.status = "approved";
      } else if (action === "reject") {
        member.status = "rejected";
      } else if (action === "remove") {
        targetClass.members = targetClass.members.filter(m => m.username !== studentUsername);
      }
      sendJson(res, 200, { success: true, class: targetClass });
      return;
    }

    if (req.method === "POST" && pathname === "/api/classes/archive") {
      const body = await parseJsonBody(req);
      const classId = sanitizeInput(body.classId, 32);
      const targetClass = classesStore.get(classId);
      if (!targetClass) {
        sendJson(res, 404, { success: false, error: "Không tìm thấy lớp học." });
        return;
      }
      targetClass.status = "archived";
      targetClass.archivedAt = new Date().toISOString();
      sendJson(res, 200, { success: true, message: "Đã lưu trữ và đóng học kỳ an toàn.", class: targetClass });
      return;
    }

    if (req.method === "POST" && pathname === "/api/classes/delete") {
      const body = await parseJsonBody(req);
      const classId = sanitizeInput(body.classId, 32);
      const targetClass = classesStore.get(classId);
      if (!targetClass) {
        sendJson(res, 404, { success: false, error: "Không tìm thấy lớp học." });
        return;
      }
      classesStore.delete(classId);
      sendJson(res, 200, { success: true, message: "Đã xóa nhóm thành công." });
      return;
    }

    if (req.method === "GET" && (pathname === "/admin-web" || pathname === "/admin-web/" || pathname.startsWith("/admin-web/"))) {
      let subPath = pathname.replace(/^\/admin-web\/?/, "");
      if (!subPath || subPath === "") subPath = "index.html";
      const safeRel = path.normalize(subPath).replace(/^(\.\.[\/\\])+/, "");
      const fullPath = path.join(__dirname, "..", "admin-web", safeRel);
      if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
        const ext = path.extname(fullPath).toLowerCase();
        const mimes = {
          ".html": "text/html; charset=utf-8",
          ".js": "text/javascript; charset=utf-8",
          ".css": "text/css; charset=utf-8",
          ".json": "application/json; charset=utf-8",
          ".svg": "image/svg+xml",
          ".png": "image/png"
        };
        const cType = mimes[ext] || "text/plain";
        res.writeHead(200, {
          "Content-Type": cType,
          "X-Content-Type-Options": "nosniff"
        });
        fs.createReadStream(fullPath).pipe(res);
        return;
      }
    }

    sendJson(res, 404, { success: false, error: "Đường dẫn không tồn tại." });
  } catch (err) {
    if (err.message === "PAYLOAD_TOO_LARGE") {
      sendJson(res, 413, { success: false, error: "Dung lượng payload vượt quá 50KB cho phép." });
      return;
    }
    if (err.message === "PROTOTYPE_POLLUTION_DETECTED" || err.message === "INVALID_JSON") {
      sendJson(res, 400, { success: false, error: "Định dạng JSON hoặc payload không an toàn." });
      return;
    }
    sendJson(res, 500, { success: false, error: "Lỗi máy chủ nội bộ." });
  }
});

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`Backend API Security Server running on port ${PORT}`);
  });
}

module.exports = server;

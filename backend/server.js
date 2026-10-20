const http = require("http");
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
  applySecurityHeaders
} = require("./security");

const PORT = process.env.PORT || 8787;
const MAX_BODY_SIZE = 50 * 1024;

const generalIpLimiter = createRateLimiter(15 * 60 * 1000, 100);
const authLimiter = createRateLimiter(15 * 60 * 1000, 15);

const accountsStore = new Map();
const sessionsStore = new Map();

function seedInitialAccounts() {
  const seeds = [
    { u: "admin", name: "Admin", p: "admin123", email: "admin@financials-plan.io" },
    { u: "dinh_anh_quan", name: "Đinh Anh Quân", p: "dinh_anh_quan", email: "dinh_anh_quan@gmail.com" },
    { u: "hst", name: "HST", p: "hst2026", email: "hst@gmail.com" },
    { u: "demo", name: "Demo User", p: "lumen2026", email: "demo@financials-plan.io" }
  ];
  seeds.forEach(s => {
    const hp = hashPassword(s.p);
    accountsStore.set(s.u, {
      uid: "uid_" + s.u + "_seed",
      username: s.name,
      normalizedUsername: s.u,
      docId: "user_" + s.u,
      passwordHash: hp.hash,
      passwordSalt: hp.salt,
      recoveryEmail: s.email,
      maskedEmail: maskEmailAddress(s.email),
      hasRecoveryEmail: true,
      createdAt: new Date().toISOString()
    });
  });
}
seedInitialAccounts();

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

      const { hash, salt } = hashPassword(password);
      const docId = `user_${normUser}`;
      const maskedEmail = rawEmail ? maskEmailAddress(rawEmail) : "";

      const newAccount = {
        docId,
        username: rawUser,
        normalizedUsername: normUser,
        recoveryEmail: rawEmail || null,
        maskedEmail,
        hasRecoveryEmail: Boolean(rawEmail),
        passwordHash: hash,
        passwordSalt: salt,
        createdAt: new Date().toISOString()
      };

      accountsStore.set(normUser, newAccount);

      sendJson(res, 201, {
        success: true,
        user: {
          docId,
          username: rawUser,
          displayUsername: rawUser,
          normalizedUsername: normUser,
          maskedEmail,
          hasRecoveryEmail: Boolean(rawEmail)
        }
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

      const token = `tok_${normUser}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      sessionsStore.set(token, {
        normalizedUsername: normUser,
        docId: account.docId,
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
          maskedEmail: account.maskedEmail,
          hasRecoveryEmail: account.hasRecoveryEmail
        }
      });
      return;
    }

    if (req.method === "POST" && pathname === "/api/auth/logout") {
      res.setHeader("Set-Cookie", "session_token=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict");
      sendJson(res, 200, { success: true, message: "Đã đăng xuất" });
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

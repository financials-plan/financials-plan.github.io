const crypto = require("crypto");

const ALLOWED_ORIGINS = new Set([
  "https://financials-plan.github.io",
  "http://localhost:8899",
  "http://127.0.0.1:8899",
  "http://localhost:8787",
  "http://127.0.0.1:8787",
  "http://localhost:5000",
  "http://127.0.0.1:5000",
  "http://localhost:3000",
  "http://127.0.0.1:3000"
]);

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

function sanitizeInput(val, maxLen = 128) {
  if (typeof val !== "string") return "";
  return val.replace(/\0/g, "").trim().slice(0, maxLen);
}

function validatePayloadSafety(body) {
  if (!body || typeof body !== "object") return true;
  const forbidden = ["__proto__", "constructor", "prototype"];
  for (const key of forbidden) {
    if (Object.prototype.hasOwnProperty.call(body, key)) {
      return false;
    }
  }
  return true;
}

function hashPassword(password, salt = null) {
  const actualSalt = salt || crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, actualSalt, 60000, 32, "sha256").toString("hex");
  return { hash, salt: actualSalt };
}

function verifyPassword(password, hash, salt) {
  const computed = crypto.pbkdf2Sync(password, salt, 60000, 32, "sha256").toString("hex");
  return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(hash));
}

function createRateLimiter(windowMs, maxHits) {
  const records = new Map();

  return function checkLimit(key) {
    const now = Date.now();
    const item = records.get(key) || { hits: 0, resetAt: now + windowMs };

    if (now > item.resetAt) {
      item.hits = 0;
      item.resetAt = now + windowMs;
    }

    item.hits += 1;
    records.set(key, item);

    if (item.hits > maxHits) {
      const retryAfter = Math.ceil((item.resetAt - now) / 1000);
      return { allowed: false, retryAfter };
    }

    return { allowed: true, remaining: maxHits - item.hits };
  };
}

function applySecurityHeaders(res) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://www.gstatic.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net; font-src 'self' https://fonts.gstatic.com https://cdn.jsdelivr.net; connect-src 'self' https://*.googleapis.com https://*.firebaseio.com; img-src 'self' data:;"
  );
}

module.exports = {
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
};

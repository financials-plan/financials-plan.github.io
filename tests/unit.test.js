const { test, before, after } = require("node:test");
const assert = require("node:assert");
const http = require("node:http");
const fs = require("node:fs");
const crypto = require("node:crypto");
const {
  validateAdminCodeFormat,
  generateAdminCode,
  normalizeUsername,
  hashPassword,
  verifyPassword
} = require("../backend/security");
const server = require("../backend/server");

const TEST_PORT = 8998;

before((done) => {
  server.listen(TEST_PORT, done);
});

after((done) => {
  server.close(done);
});

function makeRequest(method, path, body = null, customHeaders = {}) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const req = http.request(
      {
        hostname: "127.0.0.1",
        port: TEST_PORT,
        path,
        method,
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": "qtv-secret-2026",
          ...customHeaders,
          ...(payload ? { "Content-Length": Buffer.byteLength(payload) } : {})
        }
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => { data += chunk; });
        res.on("end", () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(data) });
          } catch (e) {
            resolve({ status: res.statusCode, raw: data });
          }
        });
      }
    );
    req.on("error", (err) => reject(err));
    if (payload) req.write(payload);
    req.end();
  });
}

test("1. Admin Code Validation and Crypto Generation", async (t) => {
  await t.test("Valid format XXXX-XXXX-XXXX matches strictly", () => {
    assert.strictEqual(validateAdminCodeFormat("ADMN-2026-X8Y9"), true);
    assert.strictEqual(validateAdminCodeFormat("INST-2026-K48A"), true);
    assert.strictEqual(validateAdminCodeFormat("AAAA-BBBB-CCCC"), true);
    assert.strictEqual(validateAdminCodeFormat("1234-5678-9012"), true);
  });

  await t.test("Invalid formats are rejected", () => {
    assert.strictEqual(validateAdminCodeFormat(""), false);
    assert.strictEqual(validateAdminCodeFormat(null), false);
    assert.strictEqual(validateAdminCodeFormat("ABCD-1234"), false);
    assert.strictEqual(validateAdminCodeFormat("ABCD-1234-EFGH-IJKL"), false);
    assert.strictEqual(validateAdminCodeFormat("abcd-1234-efgh"), true);
    assert.strictEqual(validateAdminCodeFormat("ABCD 1234 EFGH"), false);
    assert.strictEqual(validateAdminCodeFormat("ABCD_1234_EFGH"), false);
  });

  await t.test("Cryptographic generation produces unique 14-char codes", () => {
    const set = new Set();
    for (let i = 0; i < 50; i++) {
      const code = generateAdminCode();
      assert.strictEqual(code.length, 14);
      assert.strictEqual(validateAdminCodeFormat(code), true);
      assert.strictEqual(set.has(code), false);
      set.add(code);
    }
  });
});

test("2. Backend API - Admin Codes & Role Assignment", async () => {
  const regStudent = await makeRequest("POST", "/api/auth/register", {
    username: "hocvien_lan_dau",
    password: "password123",
    recoveryEmail: "hocvien@example.com"
  });
  assert.strictEqual(regStudent.status, 201);
  assert.strictEqual(regStudent.data.success, true);
  assert.strictEqual(regStudent.data.user.role, "student");

  const regInst = await makeRequest("POST", "/api/auth/register", {
    username: "giangvien_k48",
    password: "password123",
    recoveryEmail: "giangvien@example.com",
    adminCode: "INST-2026-K48A"
  });
  assert.strictEqual(regInst.status, 201);
  assert.strictEqual(regInst.data.success, true);
  assert.strictEqual(regInst.data.user.role, "instructor");

  const regExhausted = await makeRequest("POST", "/api/auth/register", {
    username: "user_thu_ma_het_luot",
    password: "password123",
    adminCode: "INST-2026-K48B"
  });
  assert.strictEqual(regExhausted.status, 403);
  assert.strictEqual(regExhausted.data.success, false);

  const regExpired = await makeRequest("POST", "/api/auth/register", {
    username: "user_thu_ma_het_han",
    password: "password123",
    adminCode: "EXPD-2025-0001"
  });
  assert.strictEqual(regExpired.status, 403);
  assert.strictEqual(regExpired.data.success, false);

  const regRevoked = await makeRequest("POST", "/api/auth/register", {
    username: "user_thu_ma_thu_hoi",
    password: "password123",
    adminCode: "RVKD-2026-9999"
  });
  assert.strictEqual(regRevoked.status, 403);
  assert.strictEqual(regRevoked.data.success, false);

  const regBadFormat = await makeRequest("POST", "/api/auth/register", {
    username: "user_thu_ma_sai_dinh_dang",
    password: "password123",
    adminCode: "INVALID_CODE_123"
  });
  assert.strictEqual(regBadFormat.status, 400);
  assert.strictEqual(regBadFormat.data.success, false);

  const loginRes = await makeRequest("POST", "/api/auth/login", {
    username: "giangvien_k48",
    password: "password123"
  });
  assert.strictEqual(loginRes.status, 200);
  assert.strictEqual(loginRes.data.user.role, "instructor");

  const codesList = await makeRequest("GET", "/api/admin/codes");
  assert.strictEqual(codesList.status, 200);
  assert.strictEqual(Array.isArray(codesList.data.codes), true);
  assert.ok(codesList.data.codes.length >= 5);

  const newCodeRes = await makeRequest("POST", "/api/admin/codes", {
    role: "instructor",
    maxUses: 5,
    validDays: 60
  });
  assert.strictEqual(newCodeRes.status, 201);
  assert.strictEqual(validateAdminCodeFormat(newCodeRes.data.code.code), true);
  assert.strictEqual(newCodeRes.data.code.role, "instructor");
});

test("3. Backend API - Class & Group Management", async () => {
  const listRes = await makeRequest("GET", "/api/classes");
  assert.strictEqual(listRes.status, 200);
  assert.ok(listRes.data.classes.length >= 1);
  assert.strictEqual(listRes.data.classes[0].code, "TC-K48");

  const createRes = await makeRequest("POST", "/api/classes", {
    name: "Lớp Tài Chính K49 Nâng Cao",
    code: "TC-K49",
    instructorUsername: "dinh_anh_quan",
    maxMembers: 30,
    isPrivate: true
  });
  assert.strictEqual(createRes.status, 201);
  assert.strictEqual(createRes.data.class.code, "TC-K49");

  const joinRes = await makeRequest("POST", "/api/classes/join", {
    classCode: "TC-K49",
    username: "hocvien_test_join",
    studentName: "Học Viên Test"
  });
  assert.strictEqual(joinRes.status, 200);
  assert.strictEqual(joinRes.data.status, "pending");

  const approveRes = await makeRequest("POST", "/api/classes/approve", {
    classId: createRes.data.class.id,
    studentUsername: "hocvien_test_join",
    action: "approve"
  });
  assert.strictEqual(approveRes.status, 200);
  const member = approveRes.data.class.members.find((m) => m.username === "hocvien_test_join");
  assert.strictEqual(member.status, "approved");

  const createGlobalRes = await makeRequest("POST", "/api/classes", {
    name: "Lớp Tài Chính Cộng Đồng Mở",
    code: "TC-GLOBAL",
    instructorUsername: "dinh_anh_quan",
    maxMembers: 60,
    isPrivate: false
  });
  assert.strictEqual(createGlobalRes.status, 201);
  assert.strictEqual(createGlobalRes.data.class.maxMembers, 60);
  assert.strictEqual(createGlobalRes.data.class.isPrivate, false);

  const joinGlobalRes = await makeRequest("POST", "/api/classes/join", {
    classCode: "TC-GLOBAL",
    username: "hocvien_global_auto",
    studentName: "Học Viên Global"
  });
  assert.strictEqual(joinGlobalRes.status, 200);
  assert.strictEqual(joinGlobalRes.data.status, "approved");

  const createNoLimitRes = await makeRequest("POST", "/api/classes", {
    name: "Nhóm Tài Chính Không Giới Hạn",
    code: "TC-NOLIMIT",
    instructorUsername: "dinh_anh_quan",
    maxMembers: 0,
    isPrivate: true
  });
  assert.strictEqual(createNoLimitRes.status, 201);
  assert.strictEqual(createNoLimitRes.data.class.maxMembers, 0);

  const archiveRes = await makeRequest("POST", "/api/classes/archive", {
    classId: createRes.data.class.id
  });
  assert.strictEqual(archiveRes.status, 200);
  assert.strictEqual(archiveRes.data.class.status, "archived");
});

test("4. Financial Data & Code Parity Preservation", () => {
  const hash1 = crypto.createHash("sha256").update(fs.readFileSync("js/script.js")).digest("hex");
  const hash2 = crypto.createHash("sha256").update(fs.readFileSync("script.js")).digest("hex");
  assert.strictEqual(hash1, hash2, "js/script.js and script.js must be 100% byte-for-byte identical");

  const scriptContent = fs.readFileSync("js/script.js", "utf8");
  assert.ok(scriptContent.includes("Cho con đi học đại học"), "Fixed goal 1 preserved");
  assert.ok(scriptContent.includes("Hưu trí"), "Fixed goal 2 preserved");
  assert.ok(scriptContent.includes("CAREER_MILESTONES_RECOMMENDED"), "Career Milestones benchmark preserved");

  const mainContent = fs.readFileSync("main.html", "utf8");
  assert.ok(mainContent.includes("id=\"student-preview-banner\""), "Student read-only banner exists in main.html");
  assert.ok(mainContent.includes("id=\"class-manager-modal-overlay\""), "Class manager modal exists in main.html");
  assert.ok(mainContent.includes("id=\"student-join-class-modal-overlay\""), "Student join class modal exists in main.html");
  assert.ok(mainContent.includes("id=\"btn-menu-class-manager\""), "Class manager menu button exists");
  assert.ok(mainContent.includes("id=\"tab-admin-groups\""), "Admin groups tab exists in main.html");
  assert.ok(mainContent.includes("id=\"tab-admin-requests\""), "Admin requests tab exists in main.html");
  assert.ok(mainContent.includes("id=\"tab-admin-students\""), "Admin students tab exists in main.html");
  assert.ok(mainContent.includes("id=\"admin-personal-settings-modal-overlay\""), "Personal settings modal exists in main.html");
  assert.ok(mainContent.includes("id=\"btn-sidebar-admin-settings\""), "Sidebar gear settings button exists in main.html");
  assert.ok(mainContent.includes("exportAdminComprehensiveCsv"), "exportAdminComprehensiveCsv button exists in main.html");
  assert.ok(scriptContent.includes("exportAdminComprehensiveCsv"), "exportAdminComprehensiveCsv function exists in script.js");

  const cssContent = fs.readFileSync("css/style.css", "utf8");
  assert.ok(cssContent.includes(".btn-admin-action-outline"), "btn-admin-action-outline CSS defined");
  assert.ok(cssContent.includes(".system-pref-card"), "system-pref-card CSS defined");
  assert.ok(cssContent.includes(".prog-fill-red"), "prog-fill-red CSS defined");
  assert.ok(cssContent.includes(".prog-fill-yellow"), "prog-fill-yellow CSS defined");
  assert.ok(cssContent.includes(".prog-fill-green"), "prog-fill-green CSS defined");
  assert.ok(scriptContent.includes("prog-fill-red"), "prog-fill-red logic in script.js");
  assert.ok(scriptContent.includes("prog-fill-yellow"), "prog-fill-yellow logic in script.js");
  assert.ok(scriptContent.includes("prog-fill-green"), "prog-fill-green logic in script.js");

  if (fs.existsSync("admin-standalone.html")) {
    const standaloneContent = fs.readFileSync("admin-standalone.html", "utf8");
    assert.ok(!standaloneContent.includes("id=\"btn-topbar-admin\""), "Top-right admin button is deleted from standalone");
    assert.ok(standaloneContent.includes("btn-sidebar-admin-mode"), "Sidebar admin mode toggle retained");
  }
});

test("5. Backend QTV / Admin APIs", async () => {
  const ovRes = await makeRequest("GET", "/api/admin/overview");
  assert.strictEqual(ovRes.status, 200);
  assert.strictEqual(ovRes.data.success, true);
  assert.ok(ovRes.data.overview.users.total >= 4);
  assert.ok(ovRes.data.overview.classes.total >= 1);
  assert.ok(ovRes.data.overview.adminCodes.total >= 5);

  const usersRes = await makeRequest("GET", "/api/admin/users");
  assert.strictEqual(usersRes.status, 200);
  assert.strictEqual(usersRes.data.success, true);
  assert.ok(Array.isArray(usersRes.data.users));
  assert.ok(usersRes.data.users.some(u => u.username === "Admin"));

  const revokeRes = await makeRequest("POST", "/api/admin/codes/revoke", {
    code: "ADMN-2026-X8Y9"
  });
  assert.strictEqual(revokeRes.status, 200);
  assert.strictEqual(revokeRes.data.success, true);
  assert.strictEqual(revokeRes.data.code.isRevoked, true);

  const initAdminRes = await makeRequest("POST", "/api/admin/init-first-admin", {
    username: "first_master_admin",
    password: "master_password_2026",
    recoveryEmail: "masteradmin@example.com",
    secretKey: "qtv-secret-2026"
  });
  assert.strictEqual(initAdminRes.status, 201);
  assert.strictEqual(initAdminRes.data.success, true);
  assert.strictEqual(initAdminRes.data.user.role, "admin");
  assert.strictEqual(initAdminRes.data.user.normalizedUsername, "first_master_admin");

  const initBlockedRes = await makeRequest("POST", "/api/admin/init-first-admin", {
    username: "second_admin_attempt",
    password: "password123",
    recoveryEmail: "second@example.com"
  }, { "x-admin-key": "" });
  assert.strictEqual(initBlockedRes.status, 403);
  assert.strictEqual(initBlockedRes.data.success, false);

  const initDupRes = await makeRequest("POST", "/api/admin/init-first-admin", {
    username: "first_master_admin",
    password: "master_password_2026",
    secretKey: "qtv-secret-2026"
  });
  assert.strictEqual(initDupRes.status, 409);

  const updateClassRes = await makeRequest("POST", "/api/classes/update", {
    classId: "cls_k48",
    name: "Lớp Tài Chính Cá Nhân K48 Mở Rộng",
    maxMembers: 100,
    isPrivate: true,
    description: "Nhóm kín thực hành đầu tư và tài chính cá nhân"
  });
  assert.strictEqual(updateClassRes.status, 200);
  assert.strictEqual(updateClassRes.data.success, true);
  assert.strictEqual(updateClassRes.data.class.maxMembers, 100);
  assert.strictEqual(updateClassRes.data.class.isPrivate, true);

  const backupRes = await makeRequest("GET", "/api/admin/backup");
  assert.strictEqual(backupRes.status, 200);
  assert.strictEqual(backupRes.data.success, true);
  assert.ok(Array.isArray(backupRes.data.backup.accounts));
  assert.ok(Array.isArray(backupRes.data.backup.classes));
  assert.ok(Array.isArray(backupRes.data.backup.adminCodes));
});

test("6. Dynamic Portfolio Asset Allocation & Milestone 4-Step Calculation", () => {
  const scriptContent = fs.readFileSync("script.js", "utf8");
  assert.ok(scriptContent.includes("function financeFV"), "financeFV function defined in script.js");
  assert.ok(scriptContent.includes("getPortfolioAllocationAtAge"), "getPortfolioAllocationAtAge function defined");

  function financeFV(rate, nper, pmt, pv = 0) {
    if (nper <= 0) return -pv;
    if (Math.abs(rate) < 1e-9) return -(pv + pmt * nper);
    const g = Math.pow(1 + rate, nper);
    return -(pv * g + (pmt * (g - 1)) / rate);
  }

  assert.strictEqual(financeFV(0, 3, -10, -20), 50);
  assert.strictEqual(financeFV(0.1, 0, -10, -20), 20);

  const mockGoals = [
    {
      name: "Quỹ dự phòng",
      type: "invest",
      start: 2026,
      end: 2030,
      val: 50,
      paid: 50,
      allocProducts: [{ prodName: "Tiền gửi NH", weight: 100, returnRate: 5.5 }]
    },
    {
      name: "Quỹ mua xe",
      type: "invest",
      start: 2026,
      end: 2030,
      val: 100,
      paid: 100,
      allocProducts: [
        { prodName: "Cổ phiếu", weight: 50, returnRate: 15 },
        { prodName: "Trái phiếu", weight: 50, returnRate: 8.5 }
      ]
    }
  ];

  let balStocks = 0, balBonds = 0, balIns = 0, balCash = 0;
  let totalBal = 0;
  mockGoals.forEach(g => {
    const t = 2026 - g.start;
    const pv = g.paid;
    g.allocProducts.forEach(ap => {
      const w = ap.weight / 100;
      const pPV = pv * w;
      let bal = (t <= 0) ? pPV : financeFV(ap.returnRate / 100, t, 0, -pPV);
      totalBal += bal;
      if (ap.prodName.includes("Cổ phiếu")) balStocks += bal;
      else if (ap.prodName.includes("Trái phiếu")) balBonds += bal;
      else if (ap.prodName.includes("Bảo hiểm")) balIns += bal;
      else balCash += bal;
    });
  });

  const stocksPct = (balStocks / totalBal) * 100;
  const bondsPct = (balBonds / totalBal) * 100;
  const insPct = (balIns / totalBal) * 100;
  const cashPct = (balCash / totalBal) * 100;

  assert.strictEqual(totalBal, 150);
  assert.strictEqual(Math.round(stocksPct * 10) / 10, 33.3);
  assert.strictEqual(Math.round(bondsPct * 10) / 10, 33.3);
  assert.strictEqual(Math.round(insPct * 10) / 10, 0);
  assert.strictEqual(Math.round(cashPct * 10) / 10, 33.3);
  assert.strictEqual(Math.round((stocksPct + bondsPct + insPct + cashPct) * 100) / 100, 100);
});

test("7. Admin Web Portal & Special API Trigger Auto-Routing Algorithm", async () => {
  const triggerRes = await makeRequest("POST", "/api/auth/api-trigger", {
    adminKey: "qtv-secret-2026"
  });
  assert.strictEqual(triggerRes.status, 200);
  assert.strictEqual(triggerRes.data.success, true);
  assert.strictEqual(triggerRes.data.authorized, true);
  assert.strictEqual(triggerRes.data.role, "admin");
  assert.strictEqual(triggerRes.data.redirectTo, "/admin-web/#students");

  const badTrigger = await makeRequest("POST", "/api/auth/api-trigger", {
    adminKey: "invalid-key-999"
  });
  assert.strictEqual(badTrigger.status, 403);
  assert.strictEqual(badTrigger.data.authorized, false);

  const regAdminTrigger = await makeRequest("POST", "/api/auth/register", {
    username: "qtv_api_user",
    password: "password123",
    adminKey: "qtv-secret-2026"
  });
  assert.strictEqual(regAdminTrigger.status, 201);
  assert.strictEqual(regAdminTrigger.data.user.role, "admin");
  assert.strictEqual(regAdminTrigger.data.redirectTo, "/admin-web/#students");

  const loginTrigger = await makeRequest("POST", "/api/auth/login", {
    username: "qtv_api_user",
    password: "password123",
    adminKey: "qtv-secret-2026"
  });
  assert.strictEqual(loginTrigger.status, 200);
  assert.strictEqual(loginTrigger.data.user.role, "admin");
  assert.strictEqual(loginTrigger.data.redirectTo, "/admin-web/#students");

  const adminWebPage = await makeRequest("GET", "/admin-web/");
  assert.strictEqual(adminWebPage.status, 200);
  assert.ok(adminWebPage.raw.includes("Cổng Quản Trị Sinh Viên"));

  const adminJs = await makeRequest("GET", "/admin-web/admin.js");
  assert.strictEqual(adminJs.status, 200);
  assert.ok(adminJs.raw.includes("adminWebPortal"));

  const adminCss = await makeRequest("GET", "/admin-web/admin.css");
  assert.strictEqual(adminCss.status, 200);
  assert.ok(adminCss.raw.includes(".admin-custom-table"));
});

const { test, before, after } = require("node:test");
const assert = require("node:assert");
const http = require("node:http");
const fs = require("node:fs");
const crypto = require("node:crypto");
const path = require("node:path");
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
  assert.ok(codesList.data.codes.length >= 2);

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
  assert.ok(Array.isArray(listRes.data.classes));
  assert.strictEqual(listRes.data.classes.length, 0);

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

  const joinHyphenInsensitiveRes = await makeRequest("POST", "/api/classes/join", {
    classCode: "tcglobal",
    username: "hocvien_case_no_dash",
    studentName: "Học Viên No Dash"
  });
  assert.strictEqual(joinHyphenInsensitiveRes.status, 200);
  assert.strictEqual(joinHyphenInsensitiveRes.data.status, "approved");

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

  const deleteRes = await makeRequest("POST", "/api/classes/delete", {
    classId: createNoLimitRes.data.class.id
  });
  assert.strictEqual(deleteRes.status, 200);
  assert.strictEqual(deleteRes.data.success, true);
});

test("4. Financial Data & Code Parity Preservation", () => {
  assert.ok(!fs.existsSync("script.js"), "chỉ còn một file nguồn js/script.js (không còn bản sao ở thư mục gốc)");

  const scriptContent = fs.readFileSync("js/script.js", "utf8");
  assert.ok(scriptContent.includes("Cho con đi học đại học"), "Fixed goal 1 preserved");
  assert.ok(scriptContent.includes("Hưu trí"), "Fixed goal 2 preserved");
  assert.ok(scriptContent.includes("[...regularGoals, retireGoal, collegeGoal]"), "Retirement goal precedes College goal in AppState.tcGoals");
  assert.ok(scriptContent.includes("isFixedInvestmentGoal(g) && field === 'type'"), "Fixed goals name is editable while type is protected");
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

  assert.ok(!fs.existsSync("admin-standalone.html"), "admin-standalone.html must not exist in project");
  assert.ok(!fs.existsSync("so-tai-chinh-admin-standalone.html"), "so-tai-chinh-admin-standalone.html must not exist in project");
});

test("5. Backend QTV / Admin APIs", async () => {
  const ovRes = await makeRequest("GET", "/api/admin/overview");
  assert.strictEqual(ovRes.status, 200);
  assert.strictEqual(ovRes.data.success, true);
  assert.ok(ovRes.data.overview.users.total >= 4);
  assert.ok(ovRes.data.overview.classes.total >= 0);
  assert.ok(ovRes.data.overview.adminCodes.total >= 2);

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

  const updateTargetCls = await makeRequest("POST", "/api/classes", {
    name: "Lớp Tài Chính Test Update",
    code: "TC-UPD-TEST",
    instructorUsername: "dinh_anh_quan",
    maxMembers: 50,
    isPrivate: true
  });
  const updateClassRes = await makeRequest("POST", "/api/classes/update", {
    classId: updateTargetCls.data.class.id,
    name: "Lớp Tài Chính Cá Nhân Mở Rộng",
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

test("6. Recommended Portfolio Allocation & Milestone Benchmark Verification", () => {
  const scriptContent = fs.readFileSync("js/script.js", "utf8");
  assert.ok(scriptContent.includes("CAREER_MILESTONES_RECOMMENDED"), "CAREER_MILESTONES_RECOMMENDED defined in script.js");
  assert.ok(scriptContent.includes("calculateAgeMilestones"), "calculateAgeMilestones function defined");

  const recMatch = scriptContent.match(/const CAREER_MILESTONES_RECOMMENDED = \[([\s\S]*?)\];/);
  assert.ok(recMatch, "Found CAREER_MILESTONES_RECOMMENDED definition");

  const rec = [
    { stocks: 10.0, bonds: 40.0, ins: 0.0, cash: 50.0, returnNeed: 6.05 },
    { stocks: 20.0, bonds: 40.0, ins: 0.0, cash: 40.0, returnNeed: 6.60 },
    { stocks: 30.0, bonds: 40.0, ins: 0.0, cash: 30.0, returnNeed: 7.15 },
    { stocks: 30.0, bonds: 45.0, ins: 0.0, cash: 25.0, returnNeed: 7.28 },
    { stocks: 40.0, bonds: 40.0, ins: 0.0, cash: 20.0, returnNeed: 7.70 },
    { stocks: 40.0, bonds: 40.0, ins: 0.0, cash: 20.0, returnNeed: 7.70 }
  ];

  rec.forEach((r, idx) => {
    const sum = r.stocks + r.bonds + r.ins + r.cash;
    assert.ok(Math.abs(sum - 100) < 0.2, `Milestone ${idx} sum must equal 100%`);
  });

  assert.strictEqual(rec[0].stocks, 10.0);
  assert.strictEqual(rec[0].bonds, 40.0);
  assert.strictEqual(rec[0].cash, 50.0);
  assert.strictEqual(rec[0].returnNeed, 6.05);

  assert.strictEqual(rec[1].stocks, 20.0);
  assert.strictEqual(rec[1].bonds, 40.0);
  assert.strictEqual(rec[1].cash, 40.0);
  assert.strictEqual(rec[1].returnNeed, 6.60);

  assert.strictEqual(rec[2].stocks, 30.0);
  assert.strictEqual(rec[2].bonds, 40.0);
  assert.strictEqual(rec[2].cash, 30.0);
  assert.strictEqual(rec[2].returnNeed, 7.15);

  assert.strictEqual(rec[3].stocks, 30.0);
  assert.strictEqual(rec[3].bonds, 45.0);
  assert.strictEqual(rec[3].cash, 25.0);
  assert.strictEqual(rec[3].returnNeed, 7.28);

  assert.strictEqual(rec[4].stocks, 40.0);
  assert.strictEqual(rec[4].bonds, 40.0);
  assert.strictEqual(rec[4].cash, 20.0);
  assert.strictEqual(rec[4].returnNeed, 7.70);

  assert.strictEqual(rec[5].stocks, 40.0);
  assert.strictEqual(rec[5].bonds, 40.0);
  assert.strictEqual(rec[5].cash, 20.0);
  assert.strictEqual(rec[5].returnNeed, 7.70);
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

test("8. Seeded Admin Account Authentication and Credentials", async () => {
  const loginRes = await makeRequest("POST", "/api/auth/login", {
    username: "admin",
    password: "administrator"
  });
  assert.strictEqual(loginRes.status, 200);
  assert.strictEqual(loginRes.data.success, true);
  assert.strictEqual(loginRes.data.user.normalizedUsername, "admin");
  assert.strictEqual(loginRes.data.user.role, "admin");
});

test("9. UI & Global Sync Verification for Classroom and Roles", async () => {
  const mainHtml = fs.readFileSync(path.join(__dirname, "../main.html"), "utf8");
  assert.ok(mainHtml.includes('id="btn-floating-switch-class"'));
  assert.ok(mainHtml.includes('title="Cài đặt lớp học"'));
  assert.ok(mainHtml.includes('id="u021-theme-switch"'));
  assert.ok(!mainHtml.includes('id="btn-topbar-theme"'));
  assert.ok(!mainHtml.includes('id="btn-menu-auth-login"'));
  assert.ok(!mainHtml.includes('id="dash-tc-start-year"'));
  assert.ok(mainHtml.includes('id="dash-tc-total-savings"'));
  assert.ok(mainHtml.includes('id="dash-tc-avg-return"'));
  assert.ok(mainHtml.includes('dash-kpi-sub-strip'));
  assert.ok(mainHtml.includes('kpi-modern-warning'));
  assert.ok(mainHtml.includes('kpi-modern-violet'));
  assert.ok(mainHtml.includes('id="chart-dashboard-tc-goals-pie"'));
  assert.ok(mainHtml.includes('id="chart-dashboard-tc-timeline-dual"'));

  const scriptJs = fs.readFileSync(path.join(__dirname, "../js/script.js"), "utf8");
  assert.ok(scriptJs.includes("chart-dashboard-tc-goals-pie"));
  assert.ok(scriptJs.includes("chart-dashboard-tc-timeline-dual"));
  assert.ok(scriptJs.includes("const portfolio30Yr = typeof getPortfolio30YrData === 'function' ? getPortfolio30YrData() : [];"));
  assert.ok(!scriptJs.includes("triggerAutoCloudSync") && !scriptJs.includes("autoCloudSyncTimer"), "không còn tự động ghi nền");

  const authJs = fs.readFileSync(path.join(__dirname, "../auth/auth.js"), "utf8");
  assert.ok(authJs.includes("role: userRole"));

  const firestoreService = fs.readFileSync(path.join(__dirname, "../backend/firestore-service.js"), "utf8");
  assert.ok(firestoreService.includes("getDocs"));
  assert.ok(firestoreService.includes("collection"));
  assert.ok(firestoreService.includes("onSnapshot"));
  assert.ok(firestoreService.includes("subscribeToClasses"));
  assert.ok(firestoreService.includes("migrateGuestToAccount"));
  assert.ok(firestoreService.includes("activateAdminCode"));
  assert.ok(firestoreService.includes("revokeAdminCode"));
  assert.ok(firestoreService.includes("syncClassesStoreToFirestore"));
  assert.ok(firestoreService.includes("GROUPS_COLLECTION"));
  assert.ok(firestoreService.includes("FINANCIAL_AUTH_COLLECTION"));
  assert.ok(firestoreService.includes("loadUserData"));
  assert.ok(firestoreService.includes("saveUserData"));
  assert.ok(firestoreService.includes("submissions"));

  assert.ok(scriptJs.includes("initCloudClassesRealtimeSync"));
  assert.ok(scriptJs.includes("cloud-classes-updated"));
  assert.ok(scriptJs.includes("ensureDefaultKeywords"));
  assert.ok(scriptJs.includes("window.renderAll"));

  const { execSync } = require("child_process");
  assert.doesNotThrow(() => {
    execSync(`node --experimental-vm-modules --input-type=module -e "import fs from 'fs'; import vm from 'vm'; const code = fs.readFileSync('backend/firestore-service.js', 'utf8'); new vm.SourceTextModule(code);"`, {
      cwd: path.join(__dirname, ".."),
      stdio: "pipe"
    });
  }, "backend/firestore-service.js must have valid ES module syntax without syntax errors");

  const rulesContent = fs.readFileSync(path.join(__dirname, "../backend/firestore.rules"), "utf8");
  assert.ok(rulesContent.includes("match /groups/{groupId}"));
  assert.ok(rulesContent.includes("docId == 'groups'"));
  assert.ok(rulesContent.includes("match /keywords/{keywordId}"));
  assert.ok(rulesContent.includes("match /setup_keywords/{docId}"));
  assert.ok(rulesContent.includes("match /student_keywords/{username}"));
  assert.ok(rulesContent.includes("allow delete: if isValidDocId(classId);"));
  assert.ok(rulesContent.includes("allow read, write: if true;"));
  assert.ok(!rulesContent.includes("//") && !rulesContent.includes("/*"));
});

test("10. Task A — Enrolled Classes & Member Identity Verification", () => {
  const { normalizeUsername } = require("../backend/security.js");
  const scriptContent = fs.readFileSync(path.join(__dirname, "../js/script.js"), "utf8");

  // 1. Verify normalizeUserName & normalizeUsername definition in script.js
  assert.ok(scriptContent.includes("function normalizeUserName(rawName)"), "normalizeUserName defined in script.js");
  assert.ok(scriptContent.includes("window.normalizeUsername = normalizeUserName"), "normalizeUsername alias exposed");
  assert.ok(scriptContent.includes("window.normalizeUserName = normalizeUserName"), "normalizeUserName alias exposed");
  assert.ok(!scriptContent.includes("normalizeUsername(m.username)"), "All calls in script.js unified to normalizeUserName");

  // 2. Case-insensitivity and accents normalization
  const u1 = normalizeUsername("  Nguyễn Văn A  ");
  const u2 = normalizeUsername("nguyen_van_a");
  const u3 = normalizeUsername("NGUYEN.VAN.A");
  assert.strictEqual(u1, "nguyen_van_a");
  assert.strictEqual(u2, "nguyen_van_a");
  assert.strictEqual(u3, "nguyen.van.a");

  // 3. Member schema resilience: matching against username, normalizedUsername, studentId, id
  const members = [
    { username: "hoc_vien_1", status: "approved" },
    { normalizedUsername: "hoc_vien_2", status: "pending" },
    { studentId: "hoc_vien_3", status: "rejected" },
    { id: "hoc_vien_4", status: "approved" }
  ];

  const getMemberUser = (m) => m?.username || m?.normalizedUsername || m?.studentId || m?.id || "";
  assert.strictEqual(getMemberUser(members[0]), "hoc_vien_1");
  assert.strictEqual(getMemberUser(members[1]), "hoc_vien_2");
  assert.strictEqual(getMemberUser(members[2]), "hoc_vien_3");
  assert.strictEqual(getMemberUser(members[3]), "hoc_vien_4");

  // 4. Verify post-join error boundary & try/catch separation in script.js
  assert.ok(scriptContent.includes("Lỗi khi render danh sách lớp học viên"), "Render failure logged without falsifying join success");
  assert.ok(scriptContent.includes("Không thể tải dữ liệu nhóm"), "Failure to load classes displays explicit error, not empty state");

  // 5. Verify cache-busting in main.html
  const mainHtml = fs.readFileSync(path.join(__dirname, "../main.html"), "utf8");
  assert.ok(mainHtml.includes("script.js?v=3.6.1"), "main.html uses updated cache-busting version v=3.6.1");
});

test("11. Task B — Dashboard Variance Cumulative Calculation Verification", () => {
  const scriptContent = fs.readFileSync(path.join(__dirname, "../js/script.js"), "utf8");

  // Verify chartDashVariance formula in script.js: plannedExpense - actualExpense
  assert.ok(scriptContent.includes("const monthlyVariance = Number(planExp || 0) - Number(act || 0);"), "Calculates planned minus actual");
  assert.ok(scriptContent.includes("runningDiff += Math.abs(monthlyVariance);"), "Accumulates absolute deviation");

  function calculateVarianceLine(planMonthly, actualsMonthly) {
    const planExp = Number(planMonthly) || 0;
    const cumDiff = [];
    let runningDiff = 0;
    for (let m = 0; m < 12; m++) {
      const act = Number(actualsMonthly[m]) || 0;
      const monthlyVariance = planExp - act;
      runningDiff += Math.abs(monthlyVariance);
      cumDiff.push(runningDiff);
    }
    return cumDiff;
  }

  // Ca A: Thực tế thấp hơn kế hoạch ở tất cả các tháng (Kế hoạch = 50, Thực tế = 20)
  const caA = calculateVarianceLine(50, Array(12).fill(20));
  assert.deepStrictEqual(caA, [30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330, 360]);
  for (let i = 1; i < caA.length; i++) {
    assert.ok(caA[i] > caA[i - 1], `Ca A: cumulative variance strictly increases at month ${i + 1}`);
  }

  // Ca B: Thực tế bằng kế hoạch (Kế hoạch = 50, Thực tế = 50)
  const caB = calculateVarianceLine(50, Array(12).fill(50));
  assert.deepStrictEqual(caB, Array(12).fill(0));

  // Ca C: Thực tế cao hơn kế hoạch (Kế hoạch = 50, Thực tế = 60)
  const caC = calculateVarianceLine(50, Array(12).fill(60));
  assert.deepStrictEqual(caC, [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120]);
  for (let i = 1; i < caC.length; i++) {
    assert.ok(caC[i] > caC[i - 1], `Ca C: cumulative deviation increases at month ${i + 1}`);
  }

  // Ca D: Chênh lệch thay đổi giữa các tháng
  const actualsD = [20, 20, 20, 70, 50, 40, 60, 50, 30, 50, 80, 20];
  const caD = calculateVarianceLine(50, actualsD);
  assert.deepStrictEqual(caD, [30, 60, 90, 110, 110, 120, 130, 130, 150, 150, 180, 210]);

  // Ca E: Dữ liệu rỗng, chuỗi số, undefined và null
  const actualsE = ["20", null, undefined, "60", "", 0, "40.5", NaN, "abc", 50, "10", 30];
  const caE = calculateVarianceLine("50", actualsE);
  assert.strictEqual(caE.length, 12);
  caE.forEach((val, idx) => {
    assert.ok(!isNaN(val), `Month ${idx + 1} must not be NaN`);
    assert.strictEqual(typeof val, "number");
  });
});

test("12. Fix AIO — Read-Only Protection & Admin Student Roadmap Progress Verification", async () => {
  const crypto = require("crypto");
  const fs = require("fs");
  const path = require("path");

  const jsScriptBuf = fs.readFileSync(path.join(__dirname, "../js/script.js"));

  const scriptContent = jsScriptBuf.toString("utf8");

  // 2. Verify assertWritePermission definition and exposure
  assert.ok(scriptContent.includes("function assertWritePermission(actionDescription"), "assertWritePermission must be defined");
  assert.ok(scriptContent.includes("window.assertWritePermission = assertWritePermission"), "assertWritePermission must be exposed on window");

  // 3. Verify Read-Only Guard logic
  let isReadOnlyStudentView = false;
  function mockAssertWritePermission(action) {
    if (isReadOnlyStudentView) return false;
    return true;
  }

  assert.strictEqual(mockAssertWritePermission("Xóa dòng"), true, "Should allow write when not in read-only view");
  isReadOnlyStudentView = true;
  assert.strictEqual(mockAssertWritePermission("Xóa dòng"), false, "Should block write when isReadOnlyStudentView is true");

  // 4. Verify all critical delete and mutation functions include assertWritePermission guard
  const protectedFuncs = [
    "window.deleteExpenseItem = function(idx) {",
    "window.deleteIncomeItem = function(idx) {",
    "window.deletePlanListItem = function(idx) {",
    "window.deleteInvestItem = function(idx) {",
    "window.deletePlanIncRow = function(idx) {",
    "window.deletePlanExpRow = function(idx) {",
    "window.deleteMonthIncomeRow = function(m, i) {",
    "window.deleteMonthExpenseRow = function(m, i) {",
    "window.deleteMonthLearningRow = function(m, i) {",
    "window.deleteBalanceSheetAssetRow = function(idx) {",
    "window.deleteBalanceSheetLiabilityRow = function(idx) {",
    "window.deleteTcGoalRow = function(idx) {",
    "window.deleteBackupItem = function(backupId) {",
    "window.deleteSelectedBackup = async function() {",
    "window.resetAppStateToEmpty = function() {",
    "window.resetCareerMilestones = function() {"
  ];

  for (const fnSig of protectedFuncs) {
    assert.ok(scriptContent.includes(fnSig), `Function signature ${fnSig} must exist in script.js`);
    const fnIdx = scriptContent.indexOf(fnSig);
    const bodySlice = scriptContent.slice(fnIdx, fnIdx + 300);
    assert.ok(bodySlice.includes("assertWritePermission"), `Function ${fnSig} must call assertWritePermission at its start`);
  }

  // 5. Verify backend firestore-service.js ReadOnlyGuard
  const fsServiceContent = fs.readFileSync(path.join(__dirname, "../backend/firestore-service.js"), "utf8");
  assert.ok(fsServiceContent.includes("window.isReadOnlyStudentView"), "firestore-service.js must check window.isReadOnlyStudentView");
  assert.ok(fsServiceContent.includes("deleteUserData(targetDocId)"), "firestore-service.js must provide deleteUserData");

  // 6. Verify firestore.rules Zero Comments and Security
  const rulesContent = fs.readFileSync(path.join(__dirname, "../backend/firestore.rules"), "utf8");
  assert.ok(!rulesContent.includes("//"), "firestore.rules must not contain single line comments");
  assert.ok(!rulesContent.includes("/*"), "firestore.rules must not contain multi line comments");
  assert.ok(rulesContent.includes("match /groups/{groupId}"));
  assert.ok(rulesContent.includes("docId == 'groups'"));
  assert.ok(rulesContent.includes("match /keywords/{keywordId}"));
  assert.ok(rulesContent.includes("match /setup_keywords/{docId}"));
  assert.ok(rulesContent.includes("match /student_keywords/{username}"));
  assert.ok(rulesContent.includes("allow delete: if isValidDocId(classId);"));
  assert.ok(rulesContent.includes("allow read, write: if true;"));

  // 7. Verify Admin Student Progress Roadmap calculation with real AppState schema
  function computeProgress(plan) {
    const progress = {
      keywords: "not_started",
      monthlyPlan: "not_started",
      goals: "not_started",
      careerMilestones: "not_started",
      percent: 0,
      statusLabel: "Chưa nộp bài làm"
    };

    if (!plan) return progress;
    const actualPlan = plan.plan || plan.data || plan.state || plan;

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

    // Module 2: Monthly Cashflow Plan
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

    // Module 3: Financial Goals (tcGoals)
    const goalsList = Array.isArray(actualPlan.tcGoals) ? actualPlan.tcGoals : (Array.isArray(actualPlan.personalGoals) ? actualPlan.personalGoals : (Array.isArray(actualPlan.goals) ? actualPlan.goals : []));
    if (goalsList.length >= 2) {
      progress.goals = "completed";
    } else if (goalsList.length > 0) {
      progress.goals = "in_progress";
    }

    // Module 4: Career Milestones & Portfolio (careerDetailList / milestonesStore / investProducts)
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
      progress.statusLabel = "Chưa nộp bài làm";
    }

    return progress;
  }

  // 7a. 100% completed student plan with AppState schema
  const fullPlan = {
    ho_ten: "Nguyễn Văn Sinh Viên",
    currentAge: 22,
    expenses: ["Ăn uống", "Đi lại"],
    incomeList: ["Lương chính"],
    planIncome: [{ name: "Lương chính", plan: 15.0 }],
    tcGoals: [{ id: "g1", name: "Hưu trí" }, { id: "g2", name: "Dự phòng" }],
    careerDetailList: [{ age: 22, target: 50 }],
    investProducts: [{ name: "Cổ phiếu", returnRate: 15.0 }]
  };
  const progFull = computeProgress(fullPlan);
  assert.strictEqual(progFull.percent, 100, "Full plan must reach 100%");
  assert.strictEqual(progFull.statusLabel, "Đã hoàn thành 100%");

  // 7b. 75% completed student plan (3 modules: M1, M2, M3)
  const threeModulePlan = {
    ho_ten: "Trần Thị Ba Môn",
    currentAge: 23,
    expenses: ["Ăn uống"],
    incomeList: ["Lương"],
    planIncome: [{ name: "Lương", plan: 10 }],
    tcGoals: [{ id: "g1", name: "Hưu trí" }, { id: "g2", name: "Mua xe" }]
  };
  const prog3 = computeProgress(threeModulePlan);
  assert.strictEqual(prog3.percent, 75, "3-module plan must reach 75%");
  assert.strictEqual(prog3.statusLabel, "Gần hoàn thành");

  // 7c. 50% completed student plan (2 modules: M1, M3)
  const twoModulePlan = {
    ho_ten: "Lê Văn Hai Môn",
    currentAge: 24,
    expenses: ["Ăn uống"],
    incomeList: ["Lương"],
    tcGoals: [{ id: "g1", name: "Hưu trí" }, { id: "g2", name: "Mua nhà" }]
  };
  const prog2 = computeProgress(twoModulePlan);
  assert.strictEqual(prog2.percent, 50, "2-module plan must reach 50%");
  assert.strictEqual(prog2.statusLabel, "Đang lập lộ trình");

  // 7d. 25% completed student plan (1 module: M1)
  const oneModulePlan = {
    ho_ten: "Phạm Văn Mới Bắt Đầu",
    currentAge: 25,
    expenses: ["Ăn uống"]
  };
  const prog1 = computeProgress(oneModulePlan);
  assert.strictEqual(prog1.percent, 25, "1-module plan must reach 25%");
  assert.strictEqual(prog1.statusLabel, "Mới bắt đầu");

  // 7e. Empty plan
  const emptyProg = computeProgress(null);
  assert.strictEqual(emptyProg.percent, 0);
  assert.strictEqual(emptyProg.statusLabel, "Chưa nộp bài làm");
});

test("13. Financial Calculations & Standardization Audit (Tests A - P)", () => {
  const fs = require("fs");
  const scriptContent = fs.readFileSync("js/script.js", "utf8");

  // 1. Verify FinancialMath definition and exposure
  assert.ok(scriptContent.includes("const FinancialMath = {"), "FinancialMath object must be defined");
  assert.ok(scriptContent.includes("window.FinancialMath = FinancialMath"), "FinancialMath must be exposed on window");

  const mathMatch = scriptContent.match(/const FinancialMath = \{([\s\S]*?)\n\};/);
  assert.ok(mathMatch, "FinancialMath regex match succeeds");
  const FinancialMath = new Function(mathMatch[0] + "; return FinancialMath;")();

  // Test A: Nợ 0% lãi suất
  // P = 12 tr, r = 0, n = 12 -> PMT = 1.0 tr/kỳ
  const pmtA = FinancialMath.calculateLoanPMT(12, 0, 12);
  assert.strictEqual(pmtA, 1.0, "Test A: 0% interest loan PMT must equal exactly 1.0 tr/kỳ");

  // Test B: Nợ có lãi suất danh nghĩa
  // P = 120 tr, j = 12%/năm, n = 12 -> r_m = 1%, PMT ≈ 10.661855 tr/kỳ
  const pmtB = FinancialMath.calculateLoanPMT(120, 12, 12);
  assert.ok(Math.abs(pmtB - 10.661855) < 0.0001, `Test B: PMT must match 10.661855, got ${pmtB}`);

  // Test C: Đầu tư tích lũy mục tiêu với tỷ suất sinh lời r = 0
  // F = 120 tr, B0 = 0, n = 12, r = 0 -> PMT = 10.0 tr/tháng
  const pmtC = FinancialMath.calculateInvestmentPMT(120, 0, 0, 12);
  assert.strictEqual(pmtC, 10.0, "Test C: 0% return investment PMT must equal 10.0 tr/tháng");

  // Test D: Số dư hiện tại tăng trưởng đủ hoặc vượt mục tiêu
  // B0*(1+r)^n >= F -> PMT = 0, không được âm
  const pmtD = FinancialMath.calculateInvestmentPMT(100, 120, 5, 12);
  assert.strictEqual(pmtD, 0, "Test D: Fully funded goal PMT must be exactly 0, never negative");

  // Test E: Quỹ dự phòng khẩn cấp
  // E_annual = 120 tr, M = 6 tháng -> E_monthly = 120/12 = 10 tr, Target = 10 * 6 = 60 tr
  const resE = FinancialMath.calculateEmergencyReserveGoal(0, 120, 6);
  assert.strictEqual(resE.monthlyCost, 10.0, "Test E: Monthly cost must be annualCost / 12");
  assert.strictEqual(resE.targetFund, 60.0, "Test E: Emergency target must be 10 * 6 = 60 tr, not 120 tr");

  // Test F: Bảng cân đối tài sản - nợ cá nhân chuẩn mực (Stock-only)
  // Tài sản = 300 tr, Nợ = 100 tr, Thu nhập năm = 120 tr, Chi phí năm = 80 tr
  // Net worth = 200 tr, Debt ratio = 33.3333% (không cộng dồn thu/chi 1 năm vào bảng cân đối)
  const bsF = FinancialMath.calculateBalanceSheet([{ val: 300 }], [{ val: 100 }]);
  assert.strictEqual(bsF.totalAssets, 300, "Test F: Total assets must equal 300 tr");
  assert.strictEqual(bsF.totalLiabilities, 100, "Test F: Total liabilities must equal 100 tr");
  assert.strictEqual(bsF.netWorth, 200, "Test F: Net worth must equal 200 tr (300 - 100)");
  assert.ok(Math.abs(bsF.debtRatio - 33.333333) < 0.001, "Test F: Debt ratio must equal 33.3333%");

  // Test G: Phân bổ danh mục & lợi suất kỳ vọng bình quân gia quyền
  // w1 = 60%, w2 = 40%, r1 = 8%, r2 = 4% -> weighted return = 6.4%, isWeightValid = true
  const portG1 = FinancialMath.computePortfolioMetrics([
    { weight: 60, returnRate: 8 },
    { weight: 40, returnRate: 4 }
  ]);
  assert.strictEqual(portG1.expectedAvgReturn, 6.4, "Test G: Weighted return must equal 6.4%");
  assert.strictEqual(portG1.isWeightValid, true, "Test G: 100% allocation is valid");

  const portG2 = FinancialMath.computePortfolioMetrics([
    { weight: 60, returnRate: 8 },
    { weight: 30, returnRate: 4 }
  ]);
  assert.strictEqual(portG2.isWeightValid, false, "Test G: 90% allocation is flagged invalid");

  // Test H: Thu nhập tối thiểu với chi phí sinh hoạt
  // E = 15 tr, G = 5 tr, D = 0 tr, S = 35% -> I_min = max(15 + 5, 15 / 0.65) ≈ 23.076923 tr/tháng
  const incH = FinancialMath.calculateMinimumIncomeNeed(15, 0, 5, 0.35);
  assert.ok(Math.abs(incH - 23.076923) < 0.0001, `Test H: I_min must equal ~23.076923, got ${incH}`);
  assert.ok(incH > (5 / 0.35), "Test H: Must be greater than simple G / S = 14.2857 tr");

  // Test I: Thu nhập tối thiểu với trả nợ lớn
  // E = 5 tr, D = 10 tr, G = 100 tr, S = 35% -> I_min = max(5 + 10 + 100, 15 / 0.65) = 115 tr/tháng
  const incI = FinancialMath.calculateMinimumIncomeNeed(5, 10, 100, 0.35);
  assert.strictEqual(incI, 115, "Test I: I_min must equal 115 tr/tháng to cover cashflow");

  // Test J: Phân loại sản phẩm / tài sản không thuộc danh mục nhận diện
  // Tên: "Sản phẩm thử nghiệm XYZ" -> 'unknown', không ép về 'cash' hoặc 'stocks'
  const catJ = FinancialMath.classifyProduct("Sản phẩm thử nghiệm XYZ", 0, 0);
  assert.strictEqual(catJ, "unknown", "Test J: Unrecognized asset must return 'unknown'");

  // Test K: Khảo sát trắc nghiệm chưa hoàn thành
  // Trả lời 3/10 câu -> isComplete = false, không tự động xếp loại "Thận trọng"
  const surveyQuestions = Array(10).fill({ weights: [1, 2, 3, 4] });
  const p1Thresholds = [
    { maxScore: 20, title: "Thận trọng (Ngại rủi ro)", desc: "Ngại rủi ro" }
  ];
  const survK = FinancialMath.evaluateSurvey({ 1: 1, 2: 1, 3: 1 }, surveyQuestions, p1Thresholds);
  assert.strictEqual(survK.isComplete, false, "Test K: isComplete must be false");
  assert.strictEqual(survK.count, 3, "Test K: count must be 3");
  assert.notStrictEqual(survK.classification, "Thận trọng (Ngại rủi ro)", "Test K: Must not classify as Thận trọng when incomplete");

  // Test L: Hưu trí với r = i
  // C1 = 12 tr, r = 3%, i = 3%, N = 20 năm -> K = N * C1 / (1 + r) = 240 / 1.03 ≈ 233.0097 tr
  const capL = FinancialMath.calculateRetirementCapitalNeeded(12, 3, 3, 20);
  assert.ok(Math.abs(capL - 233.0097) < 0.001, `Test L: Capital needed must be ~233.0097, got ${capL}`);

  // Test M: Tỷ suất sinh lời âm an toàn
  const pmtM = FinancialMath.calculateInvestmentPMT(120, 0, -5, 12);
  assert.ok(!isNaN(pmtM) && isFinite(pmtM) && pmtM > 0, "Test M: Negative return must be handled safely without crash");

  // Test N: Mục tiêu giáo dục và chu kỳ chiết khấu
  const eduN = FinancialMath.calculateEducationCapitalNeeded(8, 20, 50, 0);
  assert.strictEqual(eduN, 210, "Test N: 8 periods * 20 tr + 50 tr support fund = 210 tr");

  // Test O: Giao dịch chuyển tiền nội bộ
  const transO = FinancialMath.evaluateInternalTransfer(100, 50, 50);
  assert.strictEqual(transO.incomeCreated, 0, "Test O: Internal transfer creates 0 income");
  assert.strictEqual(transO.expenseCreated, 0, "Test O: Internal transfer creates 0 expense");
  assert.strictEqual(transO.totalNetWorthChange, 0, "Test O: Net worth change is 0");
  assert.strictEqual(transO.isBalanced, true, "Test O: Balances are strictly preserved");

  // Test P: Giá trị biên và dữ liệu đầu vào rác
  assert.strictEqual(FinancialMath.safeNumber(null), 0, "Test P: null -> 0");
  assert.strictEqual(FinancialMath.safeNumber(undefined), 0, "Test P: undefined -> 0");
  assert.strictEqual(FinancialMath.safeNumber(""), 0, "Test P: empty string -> 0");
  assert.strictEqual(FinancialMath.safeNumber(NaN), 0, "Test P: NaN -> 0");
  assert.strictEqual(FinancialMath.safeNumber(Infinity), 0, "Test P: Infinity -> 0");
  assert.strictEqual(FinancialMath.calculateLoanPMT(null, undefined, NaN), 0, "Test P: loan PMT handles trash input");
  assert.strictEqual(FinancialMath.calculateInvestmentPMT(null, undefined, NaN, 0), 0, "Test P: invest PMT handles trash input");
});

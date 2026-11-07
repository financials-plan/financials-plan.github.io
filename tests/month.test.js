const { test } = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");

const src = fs.readFileSync(path.join(__dirname, "../js/script.js"), "utf8");

function extract(decl) {
  const start = src.search(new RegExp("^" + decl.replace(/[()]/g, "\\$&"), "m"));
  assert.ok(start >= 0, `không tìm thấy ${decl}`);
  let i = src.indexOf("{", start);
  let depth = 0;
  for (; i < src.length; i++) {
    if (src[i] === "{") depth++;
    else if (src[i] === "}" && --depth === 0) break;
  }
  return src.slice(start, i + 1) + "\n";
}

function makeEnv(state) {
  const code = ["function getMonthFromIso(", "function sortMonthTransactions(", "function organizeMonthlyTransactions("].map(extract).join("\n") +
    "\nreturn { organizeMonthlyTransactions };";
  return new Function("AppState", code)(state);
}

test("Lưu: giao dịch về đúng tháng của ngày đã nhập và xếp tăng dần theo ngày", () => {
  const state = { monthlyDetails: {
    3: { incomes: [{ date: "2026-03-20", val: 1 }, { date: "2026-04-02", val: 2 }, { date: "2026-03-05", val: 3 }], expenses: [{ date: "2026-02-28", val: 4 }, { date: "2026-03-10", val: 5 }] }
  } };
  const moved = makeEnv(state).organizeMonthlyTransactions();
  assert.strictEqual(moved, 2);
  assert.deepStrictEqual(state.monthlyDetails[3].incomes.map(x => x.val), [3, 1], "tháng 3 xếp theo ngày 05 rồi 20");
  assert.deepStrictEqual(state.monthlyDetails[4].incomes.map(x => x.val), [2], "giao dịch ngày 02/04 sang tháng 4");
  assert.deepStrictEqual(state.monthlyDetails[2].expenses.map(x => x.val), [4], "giao dịch ngày 28/02 sang tháng 2");
  assert.deepStrictEqual(state.monthlyDetails[3].expenses.map(x => x.val), [5]);
});

test("Dòng chưa có ngày nằm cuối và chạy lại không đổi gì thêm", () => {
  const state = { monthlyDetails: { 5: { incomes: [{ date: "", val: 1 }, { date: "2026-05-02", val: 2 }], expenses: [] } } };
  const env = makeEnv(state);
  assert.strictEqual(env.organizeMonthlyTransactions(), 0);
  assert.deepStrictEqual(state.monthlyDetails[5].incomes.map(x => x.val), [2, 1]);
  assert.strictEqual(env.organizeMonthlyTransactions(), 0);
});

test("Số tiền người dùng đã nhập được giữ nguyên tuyệt đối: Lưu không làm tròn hay sửa số", () => {
  const vals = [1.0999999999999999, 0.30000000000000004, 5.5, 0.1, 2];
  const state = { monthlyDetails: { 6: { incomes: [{ date: "2026-06-10", val: vals[0] }, { date: "2026-06-11", val: vals[1] }], expenses: [{ date: "2026-06-10", val: vals[2] }, { date: "2026-06-12", val: vals[3] }], learningDetails: [{ date: "2026-06-13", val: vals[4] }] } } };
  makeEnv(state).organizeMonthlyTransactions();
  const d = state.monthlyDetails[6];
  assert.deepStrictEqual([d.incomes[0].val, d.incomes[1].val, d.expenses[0].val, d.expenses[1].val, d.learningDetails[0].val], vals);
  const fns = src.slice(src.indexOf("window.updateMonthIncValLive = function"), src.indexOf("window.updateReconNote = function"));
  assert.ok(!/roundMoney|toFixed|Math\.round/.test(fns), "hàm nhận số tiền người dùng gõ không được làm tròn");
});

test("Sửa ngày khi đang nhập không xếp lại hay chuyển dòng (chỉ Lưu mới xếp)", () => {
  const dateFns = src.slice(src.indexOf("window.updateMonthIncomeDate = function"), src.indexOf("window.updateMonthIncDesc = function"));
  assert.ok(!/sortMonthTransactions|renderMonthView|splice/.test(dateFns), "hàm sửa ngày không được sắp xếp, chuyển tháng hay dựng lại bảng");
  const addFns = src.slice(src.indexOf("window.addMonthDetailIncomeRow"), src.indexOf("window.deleteMonthExpenseRow"));
  assert.ok(!/sortMonthTransactions/.test(addFns), "thêm dòng không tự xếp lại");
});

test("Ô ngày: số vừa gõ được ghi nhận, gõ sai thì trả lại ngày cũ, xóa trống thì xóa ngày", () => {
  const code = ["function formatDisplayDate(", "function parseToIsoDate(", "function readDateCellValue("].map(extract).join("\n") + "\nreturn readDateCellValue;";
  const read = new Function("window", code)({});
  const cell = (iso, value) => {
    const attrs = iso ? { "data-iso-date": iso } : {};
    return { value, getAttribute: k => attrs[k] || null, setAttribute: (k, v) => { attrs[k] = v; }, removeAttribute: k => { delete attrs[k]; }, attrs };
  };
  let c = cell("2026-01-15", "20/01/2026");
  assert.strictEqual(read(c), "2026-01-20", "ngày gõ tay thay cho data-iso-date cũ");
  assert.strictEqual(c.attrs["data-iso-date"], "2026-01-20");
  c = cell("2026-01-15", "15/01/2026");
  assert.strictEqual(read(c), "2026-01-15", "không đổi thì giữ nguyên");
  c = cell("2026-01-15", "abc");
  assert.strictEqual(read(c), "2026-01-15", "gõ sai trả lại ngày cũ");
  assert.strictEqual(c.value, "15/01/2026");
  c = cell("2026-01-15", "31/02/2026x");
  assert.strictEqual(read(c), "2026-01-15");
  c = cell("2026-01-15", "");
  assert.strictEqual(read(c), "", "xóa trống");
  assert.ok(!("data-iso-date" in c.attrs));
});

test("Ô nhập thu/chi/đào tạo ghi theo mã dòng, không theo vị trí mảng", () => {
  ["updateMonthIncValLive", "updateMonthExpValLive", "updateMonthIncDesc", "updateMonthExpDesc", "updateMonthIncCat", "updateMonthExpCat", "updateMonthIncomeDate", "updateMonthExpenseDate", "updateMonthLearningValLive", "updateMonthLearningFieldLive", "updateMonthLearningCat", "updateMonthLearningField", "deleteMonthIncomeRow", "deleteMonthExpenseRow", "deleteMonthLearningRow"].forEach(name => {
    const start = src.indexOf("window." + name + " = function");
    assert.ok(start >= 0, name);
    assert.ok(src.slice(start, start + 260).includes("resolveRowIndex("), name + " phải xác định dòng theo mã dòng");
  });
  assert.strictEqual((src.match(/<tr data-rid="\$\{rowRid\(/g) || []).length, 3);
});
test("Xuất CSV giữ nguyên số đã nhập; nhập chế độ cập nhật không để các dòng cùng ngày/khoản mục đè nhau", () => {
  const exportFn = src.slice(src.indexOf("window.exportCurrentTableToCsv = function"), src.indexOf("window.handleCsvFileSelected = function"));
  assert.ok(!/toFixed/.test(exportFn), "xuất CSV không được làm tròn số bằng toFixed");
  const merge = new Function(extract("function mergeMonthTransactions(") + "\nreturn mergeMonthTransactions;")();
  const dst = [{ date: "2026-06-10", cat: "A", desc: "x", val: 1 }, { date: "2026-06-10", cat: "A", desc: "y", val: 2 }, { date: "2026-06-10", cat: "A", desc: "z", val: 3 }];
  merge(dst, [{ date: "2026-06-10", cat: "A", desc: "x", val: 10 }, { date: "2026-06-10", cat: "A", desc: "y", val: 20 }, { date: "2026-06-10", cat: "A", desc: "z", val: 30 }], "update");
  assert.deepStrictEqual(dst.map(x => x.val), [10, 20, 30]);
  const add = merge([{ date: "d", cat: "A", val: 1 }], [{ date: "d", cat: "A", val: 2 }], "add");
  assert.strictEqual(add.length, 2);
});
test("11. Tai khoan admin dung chung: mat khau co dinh, khong bam, khong doi", () => {
  const svc = fs.readFileSync(path.join(__dirname, "../backend/firestore-service.js"), "utf8");
  assert.ok(/FIXED_ADMIN_USERNAME = "admin"/.test(svc));
  assert.ok(/FIXED_ADMIN_PASSWORD = "administrator"/.test(svc));
  const i = svc.indexOf("normalizedUsername === FIXED_ADMIN_USERNAME");
  assert.ok(i > 0, "loginAccount phai co nhanh rieng cho admin");
  const branch = svc.slice(i, svc.indexOf("const accounts = getLocalAuthAccounts();", i));
  assert.ok(!/hashPasswordForStorage|setDoc\(|saveLocalAuthAccounts/.test(branch), "nhanh admin khong duoc bam hay ghi Cloud");
  assert.ok(/FIXED_ADMIN_PASSWORD/.test(branch) && /role: "admin"/.test(branch));
  assert.ok(/code: "FIXED_ADMIN_PASSWORD"/.test(svc), "doi mat khau admin phai bi chan");
});

test("12. Xuat CSV/JSON nhom doc bai lam hoc vien tu Cloud, khong chi tu localStorage", () => {
  assert.ok(/async function loadMembersExportData/.test(src));
  const csv = src.slice(src.indexOf("window.exportGroupMembersCsv ="), src.indexOf("window.exportGroupJsonSnapshot ="));
  const json = src.slice(src.indexOf("window.exportGroupJsonSnapshot ="), src.indexOf("window.renderAdminAnalyticsView = async"));
  for (const part of [csv, json]) {
    assert.ok(/async function/.test(part) && /loadMembersExportData\(members\)/.test(part));
    assert.ok(!/localStorage\.getItem\('FIN_APP_LAST_STATE_user_'/.test(part), "khong doc truc tiep localStorage");
  }
  const helper = src.slice(src.indexOf("async function loadMembersExportData"), src.indexOf("function exportStatusLabel"));
  assert.ok(/getStudentClassProgress/.test(helper));
});

test("13. config/firebase-config.js phai export firebaseConfig, app, analytics (service import ../config/firebase-config.js)", () => {
  const cfg = fs.readFileSync(path.join(__dirname, "../config/firebase-config.js"), "utf8");
  assert.ok(/export\s*\{[^}]*\bfirebaseConfig\b[^}]*\}/.test(cfg), "thieu export firebaseConfig");
  assert.ok(/export\s*\{[^}]*\bapp\b[^}]*\}/.test(cfg), "thieu export app");
  assert.ok(/export\s*\{[^}]*\banalytics\b[^}]*\}/.test(cfg), "thieu export analytics");
});

// ===== Rà soát lỗi theo báo cáo tổng hợp (3.8, 3.10, 3.12, 1.4, 2.2, 2.4, 2.12, 3.13) =====
test("14. Kiểm toán: nhãn thống nhất (2.2, 2.4, 2.12, 3.10, 3.1)", () => {
  const html = fs.readFileSync(path.join(__dirname, "../main.html"), "utf8");
  assert.ok(html.includes("<span>Tổng quan tài chính</span>") && !html.includes("Dashboard phân tích"), "2.2 đổi tên Dashboard");
  assert.ok(html.includes("Mức biến động (%)") && !html.includes(">Rủi ro (%)<"), "2.4 tách khái niệm rủi ro");
  assert.ok(html.includes("Năm bắt đầu để dành") && !html.includes('<th class="th-year">Năm bắt đầu</th>'), "2.12 phân biệt mốc năm");
  assert.ok(html.includes("Tổng giá trị mục tiêu") && !html.includes('>Tổng tiết kiệm cần đạt<'), "3.10 đổi tên tổng giá trị mục tiêu");
  assert.ok(html.includes("Giá trị mục tiêu (triệu đồng)") && html.includes("Đã tích lũy (triệu đồng)"), "3.1 đơn vị ở nhãn cột");
  assert.ok(html.includes("tính cả năm bắt đầu và năm hoàn tất"), "3.13 ghi quy ước đếm năm");
  assert.ok(src.includes("'tab-dashboard': 'TỔNG QUAN TÀI CHÍNH'"), "tiêu đề trang khớp tên mới");
});

test("15. Kiểm toán: đáp án khảo sát không chồng lấn (3.12)", () => {
  for (const bad of ['"10-20%"', '"20-30%"', '"0-10%"', '"<50%"', '"50-70%"', '"70-100%"', '"100-150%"', '"5-10%"', '">50%"', '">30%"', '"<5%"']) {
    assert.ok(!src.includes(bad), "còn đáp án khoảng đóng chồng lấn: " + bad);
  }
  assert.ok(src.includes('"Từ 10% đến dưới 20%"') && src.includes('"0% (không trích)"'));
  // trọng số giữ nguyên thứ tự: đổi nhãn không đổi điểm
  assert.ok(src.includes('"Trên 50%"], weights: [1, 2, 3, 4, 5]'));
});

test("16. Kiểm toán: năm hoàn tất nhỏ hơn năm bắt đầu có cảnh báo tại ô nhập (3.8)", () => {
  const i = src.indexOf("function goalYearError(g) {");
  assert.ok(i > 0, "có hàm goalYearError");
  const j = src.slice(i).search(/\r?\n\}\r?\n/);
  const goalYearError = new Function(src.slice(i, i + j + 3) + "; return goalYearError;")();
  assert.ok(goalYearError({ start: 2026, end: 2020 }).includes("nhỏ hơn năm bắt đầu"), "2020 < 2026 báo lỗi");
  assert.strictEqual(goalYearError({ start: 2026, end: 2026 }), "", "bằng nhau hợp lệ");
  assert.strictEqual(goalYearError({ start: 2026, end: 2035 }), "", "đạt sau năm bắt đầu hợp lệ");
  assert.strictEqual(goalYearError({ start: 0, end: 0 }), "", "chưa nhập thì không báo lỗi");
  assert.ok(src.includes("class=\"field-error\""), "hiển thị lỗi cạnh ô");
  // không làm đổi số người dùng nhập: hàm chỉ đọc
  const g = { start: 2026, end: 2020 }; goalYearError(g);
  assert.deepStrictEqual(g, { start: 2026, end: 2020 });
});

test("17. Kiểm toán: Hoàn thành khảo sát chỉ lưu khi người dùng bấm (1.4)", () => {
  const html = fs.readFileSync(path.join(__dirname, "../main.html"), "utf8");
  assert.ok(html.includes('id="btn-survey-finish" onclick="finishSurvey()"'));
  assert.ok(/window\.finishSurvey = async function\(\) \{\s*const ok = await window\.saveAppStateToCloud\(\);/.test(src));
  const calls = src.split("finishSurvey").length - 1;
  assert.strictEqual(calls, 1, "finishSurvey chỉ được định nghĩa, không tự gọi nền");
});

test("18. Kiểm toán: ghi chú khi chưa chọn sản phẩm đầu tư (3.2, 1.3)", () => {
  assert.strictEqual(src.split('class="goal-alloc-note"').length - 1, 3, "ghi chú ở cả ba thẻ mục tiêu đầu tư");
  assert.ok(src.includes("Chưa chọn sản phẩm đầu tư: khoản góp đang tính theo mức"));
});

// ===== Quyết định chủ sản phẩm: tên "Danh mục", năm 1900–2100, tuổi gắn với năm đã nhập =====
test("19. Quyết định: dùng tên Danh mục thiết lập, không còn 'Từ khóa' trên giao diện", () => {
  const html = fs.readFileSync(path.join(__dirname, "../main.html"), "utf8");
  const tut = fs.readFileSync(path.join(__dirname, "../js/tutorial.js"), "utf8");
  const ui = (s) => s.split(/\r?\n/).filter((l) => !/^\s*\/\//.test(l)).join("\n");
  for (const [name, text] of [["main.html", html], ["script.js", ui(src)], ["tutorial.js", tut]]) {
    assert.ok(!/Từ khóa|TỪ KHÓA/.test(text), name + " còn chữ 'Từ khóa'");
  }
  assert.ok(html.includes("<span>Danh mục thiết lập</span>") && src.includes("'tab-tukhoa': 'DANH MỤC THIẾT LẬP'"));
  assert.ok(html.includes('id="btn-tab-tukhoa"'), "mã tab nội bộ giữ nguyên");
  assert.ok(html.includes('value="keywords_expense"'), "khóa dữ liệu nội bộ giữ nguyên để nhập tệp cũ");
});

test("20. Quyết định: năm hợp lệ 1900–2100 (gồm cả hai đầu) ở ô nhập và khi nhập JSON", () => {
  assert.ok(/v >= 1900 && v <= 2100/.test(src), "ô nhập năm");
  assert.ok(/currentYear < 1900 \|\| candidateData\.currentYear > 2100/.test(src), "nhập JSON");
  assert.ok(!/2200/.test(src.slice(src.indexOf("function validateImportedData") > 0 ? src.indexOf("function validateImportedData") : 0, 400000).split("\n").filter((l) => /currentYear/.test(l)).join("\n")), "không còn ngưỡng 2200 cho năm");
});

test("21. Quyết định: đổi năm không làm đổi tuổi đã nhập (tuổi gắn với năm nhập trước)", () => {
  const i = src.indexOf("yEl.addEventListener('input'");
  const block = src.slice(i, i + 900);
  assert.ok(!/AppState\.currentAge\s*=\s*AppState\.currentYear\s*-/.test(block), "không suy lại tuổi từ năm");
  assert.ok(/AppState\.birthYear\s*=\s*v - ageNow/.test(block), "chỉ cập nhật năm sinh suy ra");
  // mô phỏng quy tắc: năm 2026 tuổi 30 -> đổi năm 2030: tuổi vẫn 30, năm sinh 2000
  const state = { currentYear: 2026, currentAge: 30, birthYear: 1996 };
  const v = 2030; state.currentYear = v; const ageNow = Number(state.currentAge); if (isFinite(ageNow) && ageNow > 0) state.birthYear = v - ageNow;
  assert.deepStrictEqual(state, { currentYear: 2030, currentAge: 30, birthYear: 2000 });
});
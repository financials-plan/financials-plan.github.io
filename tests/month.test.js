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
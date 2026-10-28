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
    "\nreturn { organizeMonthlyTransactions, updateDate: null };";
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

test("Sửa ngày khi đang nhập không xếp lại hay chuyển dòng (chỉ Lưu mới xếp)", () => {
  const dateFns = src.slice(src.indexOf("window.updateMonthIncomeDate = function"), src.indexOf("window.updateMonthIncDesc = function"));
  assert.ok(!/sortMonthTransactions|renderMonthView|splice/.test(dateFns), "hàm sửa ngày không được sắp xếp, chuyển tháng hay dựng lại bảng");
  const addFns = src.slice(src.indexOf("window.addMonthDetailIncomeRow"), src.indexOf("window.deleteMonthExpenseRow"));
  assert.ok(!/sortMonthTransactions/.test(addFns), "thêm dòng không tự xếp lại");
});

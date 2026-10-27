const { test } = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");

const src = fs.readFileSync(path.join(__dirname, "../js/script.js"), "utf8");

// Lấy nguyên văn các khối function/const cấp cao nhất từ script đang được trang nạp
function extractTopLevel(source, decl) {
  const start = source.search(new RegExp("^" + decl.replace(/[()]/g, "\\$&"), "m"));
  assert.ok(start >= 0, `không tìm thấy ${decl}`);
  let i = source.indexOf("{", start);
  let depth = 0;
  for (; i < source.length; i++) {
    const c = source[i];
    if (c === "{") depth++;
    else if (c === "}") {
      depth--;
      if (depth === 0) break;
    }
  }
  return source.slice(start, i + 1) + "\n";
}

const FM_SRC = src.match(/const FinancialMath = \{[\s\S]*?\n\};/)[0];
const FN_NAMES = [
  "normalizeUserName", "createEmptyAllocProducts", "createFixedCollegeGoal", "createFixedRetirementGoal",
  "isCollegeFixedGoal", "isRetirementFixedGoal", "normalizeGoalNumericFields",
  "normalizeInvestProduct", "parseInvestmentTypeInput", "normalizeInvestProducts", "getProductInvestmentType",
  "getGoalFundUsage", "getBaseYearAndAge", "emptyPortfolioTypeBucket", "getGoalAllocationProducts",
  "computeGoalPortfolioMetrics", "computeGoalPMT", "calculateCollegeGoal", "calculateRetirementGoal",
  "calculateMonthlyNeed", "getTargetSavingsRatePct", "getEffectiveSavingsRateRatio",
  "computeIncomeNeedForGoalSavings", "getMatrixIncomeNeed", "simulatePersonalPortfolio",
  "describePortfolioIssues", "getPortfolioAllocationAtAge", "getPortfolio30YrData", "calculateAgeMilestones",
  "yearsToGoalDate", "inflateToGoalDate", "accumulationMonthsOf", "singleRateOfGoal", "applyFixedGoalValEdit",
  "migrateLegacyRetirementReserve"
].filter(n => new RegExp("^function " + n + "\\(", "m").test(src));

function makeEnv(state) {
  const code = [
    FM_SRC,
    ...FN_NAMES.map(n => extractTopLevel(src, "function " + n + "(")),
    "return { FinancialMath, calculateMonthlyNeed, simulatePersonalPortfolio, getPortfolio30YrData, getMatrixIncomeNeed, " +
    "calculateAgeMilestones, migrateLegacyRetirementReserve, normalizeInvestProducts, getProductInvestmentType, describePortfolioIssues, getPortfolioAllocationAtAge };"
  ].join("\n");
  const factory = new Function("AppState", "window", code);
  return factory(state, {});
}

// --- Phép tính độc lập, không dùng FinancialMath ---
const effMonthly = (R) => Math.pow(1 + R / 100, 1 / 12) - 1;
function refSim(products, A, months, B0 = 0) {
  // products: [{w (0..1), R(%)}], khoản góp cuối tháng
  return products.map(p => {
    const r = effMonthly(p.R);
    let b = B0 * p.w;
    for (let m = 0; m < months; m++) b = b * (1 + r) + A * p.w;
    return b;
  });
}

test("A. Không lợi suất, không số dư: 120 triệu / 12 tháng = 10 triệu/tháng", () => {
  const { FinancialMath } = makeEnv({});
  assert.strictEqual(FinancialMath.calculateInvestmentPMT(120, 0, 0, 12), 10);
  const multi = FinancialMath.calculateMultiProductPMT(120, [{ weight: 100, returnRatePct: 0, initialBalance: 0 }], 12);
  assert.strictEqual(multi.status, "ok");
  assert.strictEqual(multi.pmt, 10);
});

test("B. Số dư đầu kỳ 60 triệu, lợi suất 0%: 5 triệu/tháng", () => {
  const { FinancialMath } = makeEnv({});
  assert.strictEqual(FinancialMath.calculateInvestmentPMT(120, 60, 0, 12), 5);
  assert.strictEqual(FinancialMath.calculateMultiProductPMT(120, [{ weight: 100, returnRatePct: 0, initialBalance: 60 }], 12).pmt, 5);
});

test("B2. Số dư ban đầu có sinh lãi: khoản góp nhỏ hơn cách trừ thẳng số dư", () => {
  const { FinancialMath } = makeEnv({});
  const pmt = FinancialMath.calculateInvestmentPMT(1000, 400, 10, 24);
  const r = effMonthly(10);
  const expected = (1000 - 400 * Math.pow(1 + r, 24)) / ((Math.pow(1 + r, 24) - 1) / r);
  assert.ok(Math.abs(pmt - expected) < 1e-9, `${pmt} vs ${expected}`);
  const naive = (1000 - 400) / ((Math.pow(1 + r, 24) - 1) / r);
  assert.ok(pmt < naive);
  assert.strictEqual(FinancialMath.calculateInvestmentPMT(100, 120, 5, 12), 0);
  assert.ok(Math.abs(Math.pow(1 + effMonthly(14), 12) - 1.14) < 1e-12, "r tháng là hiệu dụng năm quy đổi");
});

test("C. Ba sản phẩm 20/30/50, 14% / 9,8% / 5% hiệu dụng, 48 tháng: tổng giá trị tương lai = mục tiêu", () => {
  const { FinancialMath } = makeEnv({});
  const S = 1000;
  const prods = [{ w: 0.2, R: 14 }, { w: 0.3, R: 9.8 }, { w: 0.5, R: 5 }];
  const res = FinancialMath.calculateMultiProductPMT(S, prods.map(p => ({ weight: p.w * 100, returnRatePct: p.R, initialBalance: 0 })), 48);
  assert.strictEqual(res.status, "ok");
  // kỳ vọng độc lập: A = S / Σ w F_p
  const denom = prods.reduce((s, p) => { const r = effMonthly(p.R); return s + p.w * (Math.pow(1 + r, 48) - 1) / r; }, 0);
  assert.ok(Math.abs(res.pmt - S / denom) < 1e-9);
  const total = refSim(prods, res.pmt, 48).reduce((a, b) => a + b, 0);
  assert.ok(Math.abs(total - S) < 1e-6, `tổng FV ${total}`);
  // khác khoản góp tính bằng lợi suất bình quân (cách cũ)
  const avg = prods.reduce((s, p) => s + p.w * p.R, 0);
  const oldWay = FinancialMath.calculateInvestmentPMT(S, 0, avg, 48);
  assert.ok(Math.abs(oldWay - res.pmt) > 1e-4, "không dùng lợi suất bình quân");
});

test("C2. Có số dư ban đầu theo tỷ trọng: mô phỏng từng sản phẩm đạt đúng mục tiêu", () => {
  const { FinancialMath } = makeEnv({});
  const S = 2000, B0 = 300, n = 60;
  const prods = [{ w: 0.6, R: 12 }, { w: 0.4, R: 6 }];
  const res = FinancialMath.calculateMultiProductPMT(S, prods.map(p => ({ weight: p.w * 100, returnRatePct: p.R, initialBalance: B0 * p.w })), n);
  const fv = refSim(prods, res.pmt, n, B0).reduce((a, b) => a + b, 0);
  assert.ok(Math.abs(fv - S) < 1e-6);
  const sim = FinancialMath.simulateGoalYearEndBalances({
    startYear: 2026, endYear: 2030, monthlyContribution: res.pmt, lastYear: 2030, spendAtEnd: false,
    products: prods.map(p => ({ weight: p.w * 100, returnRatePct: p.R, initialBalance: B0 * p.w }))
  });
  assert.ok(sim.valid);
  assert.ok(Math.abs(sim.years[2030].reduce((a, b) => a + b, 0) - S) < 1e-6);
});

test("C3. Danh mục sai tỷ trọng trả trạng thái, không trả khoản góp", () => {
  const { FinancialMath } = makeEnv({});
  const bad = FinancialMath.calculateMultiProductPMT(100, [{ weight: 60, returnRatePct: 8 }, { weight: 30, returnRatePct: 4 }], 12);
  assert.strictEqual(bad.status, "invalid_weights");
  assert.strictEqual(bad.pmt, null);
});

test("D. Thu nhập cần đáp ứng khoản góp: 0% và 100% tiết kiệm, thiếu dữ liệu", () => {
  const { FinancialMath } = makeEnv({});
  assert.strictEqual(FinancialMath.calculateMinimumIncomeNeed(0, 0, 4, 0.4), 10);
  assert.strictEqual(FinancialMath.calculateMinimumIncomeNeed(0, 0, 4, 0), null, "0% không bị đổi thành 35%");
  assert.strictEqual(FinancialMath.calculateMinimumIncomeNeed(0, 0, 0, 0), 0, "G = 0 hợp lệ");
  assert.strictEqual(FinancialMath.calculateMinimumIncomeNeed(5, 0, 4, 1), null, "100% với chi phí dương không khả thi");
  assert.strictEqual(FinancialMath.calculateMinimumIncomeNeed(0, 0, 4, 1), 4);
  assert.strictEqual(FinancialMath.calculateMinimumIncomeNeed(0, 0, 4, undefined), null);
  assert.ok(Math.abs(FinancialMath.calculateMinimumIncomeNeed(15, 0, 5, 0.35) - 23.076923) < 1e-5);
});

test("E. Loại đầu tư: chuẩn hóa, tự nhận diện chỉ khi rõ ràng", () => {
  const { FinancialMath } = makeEnv({});
  assert.deepStrictEqual(FinancialMath.INVESTMENT_TYPES, ["stocks", "bonds", "insurance", "bank_deposit"]);
  assert.strictEqual(FinancialMath.normalizeInvestmentType("bank_deposit"), "bank_deposit");
  assert.strictEqual(FinancialMath.normalizeInvestmentType("ins"), "insurance");
  assert.strictEqual(FinancialMath.normalizeInvestmentType("abc"), "");
  assert.strictEqual(FinancialMath.inferInvestmentType("Finhay tích lũy"), "", "Finhay không tự là tiền gửi");
  assert.strictEqual(FinancialMath.inferInvestmentType("Chứng chỉ quỹ mở (DCDS / DCBC)"), "");
  assert.strictEqual(FinancialMath.inferInvestmentType("Trái phiếu Techcombank"), "bonds");
  assert.strictEqual(FinancialMath.inferInvestmentType("Gửi tiết kiệm ngân hàng kỳ hạn"), "bank_deposit");
  assert.strictEqual(FinancialMath.inferInvestmentType("ETF VN30"), "stocks");
  assert.strictEqual(FinancialMath.inferInvestmentType("Quỹ trái phiếu và cổ phiếu"), "", "mơ hồ -> chưa xác định");
  assert.strictEqual(FinancialMath.classifyProduct("Sản phẩm thử nghiệm XYZ", 14, 20), "unknown");
});

function baseState(extra) {
  return Object.assign({
    currentYear: 2030, currentAge: 33, targetSavingsRate: 40,
    investProducts: [
      { name: "ETF A", returnRate: 12, risk: 18, investmentType: "stocks" },
      { name: "Quỹ cổ phiếu B", returnRate: 15, risk: 20, investmentType: "stocks" },
      { name: "Tiền gửi C", returnRate: 5, risk: 1, investmentType: "bank_deposit" },
      { name: "Finhay D", returnRate: 6, risk: 2 }
    ],
    tcGoals: []
  }, extra || {});
}

function goal(id, over) {
  return Object.assign({
    id, name: id, type: "invest", val: 0, paid: 0, start: 0, end: 0, rate: 0, estimatedRate: 0, monthly: 0,
    allocProducts: [
      { prodName: "", weight: 0, returnRate: 0, risk: 0 },
      { prodName: "", weight: 0, returnRate: 0, risk: 0 },
      { prodName: "", weight: 0, returnRate: 0, risk: 0 }
    ]
  }, over);
}

test("F. Mô phỏng danh mục: tỷ trọng và lợi suất theo số dư, mục tiêu chi tiêu kết thúc thì hết vốn", () => {
  const spend = goal("Mua xe", {
    val: 600, start: 2030, end: 2032, fundUsage: "spend",
    allocProducts: [
      { prodName: "ETF A", weight: 50, _explicitSelected: true },
      { prodName: "Tiền gửi C", weight: 50, _explicitSelected: true },
      { prodName: "", weight: 0 }
    ]
  });
  const hold = goal("Quỹ dài hạn", {
    val: 1000, paid: 100, start: 2030, end: 2034, fundUsage: "hold",
    allocProducts: [
      { prodName: "Quỹ cổ phiếu B", weight: 100, _explicitSelected: true },
      { prodName: "", weight: 0 }, { prodName: "", weight: 0 }
    ]
  });
  const state = baseState({ tcGoals: [spend, hold] });
  const env = makeEnv(state);
  const sim = env.simulatePersonalPortfolio(10);
  assert.strictEqual(sim.status, "ok");

  // Kỳ vọng độc lập
  const A1 = env.calculateMonthlyNeed(spend);
  const A2 = env.calculateMonthlyNeed(hold);
  const p1 = [{ w: 0.5, R: 12 }, { w: 0.5, R: 5 }];
  const den1 = p1.reduce((s, p) => { const r = effMonthly(p.R); return s + p.w * (Math.pow(1 + r, 36) - 1) / r; }, 0);
  assert.ok(Math.abs(A1 - 600 / den1) < 1e-9, "khoản góp mục tiêu 1");
  const r2 = effMonthly(15);
  const exA2 = (1000 - 100 * Math.pow(1 + r2, 60)) / ((Math.pow(1 + r2, 60) - 1) / r2);
  assert.ok(Math.abs(A2 - exA2) < 1e-9, "khoản góp mục tiêu 2");

  const bal = (prods, A, months, B0) => refSim(prods, A, months, B0);
  // Cuối 2030 (12 tháng)
  const g1 = bal(p1, A1, 12, 0);
  const g2 = bal([{ w: 1, R: 15 }], A2, 12, 100);
  const total = g1[0] + g1[1] + g2[0];
  const row2030 = sim.rows[0];
  assert.ok(Math.abs(row2030.stocks - (g1[0] + g2[0]) / total * 100) < 1e-9);
  assert.ok(Math.abs(row2030.bank_deposit - g1[1] / total * 100) < 1e-9);
  assert.strictEqual(row2030.bonds, 0);
  assert.ok(Math.abs(row2030.stocks + row2030.bonds + row2030.insurance + row2030.bank_deposit + row2030.unknown - 100) < 1e-9);
  const expRet = (g1[0] * 12 + g1[1] * 5 + g2[0] * 15) / total;
  assert.ok(Math.abs(row2030.expectedReturn - expRet) < 1e-9, "lợi suất kỳ vọng theo số dư");

  // Cuối 2032: mục tiêu chi tiêu hoàn tất -> số dư bị chi, chỉ còn quỹ dài hạn (100% cổ phiếu)
  const row2032 = sim.rows[2];
  assert.ok(Math.abs(row2032.stocks - 100) < 1e-9);
  assert.strictEqual(row2032.bank_deposit, 0);
  const bal2032 = bal([{ w: 1, R: 15 }], A2, 36, 100)[0];
  assert.ok(Math.abs(row2032.balance - bal2032) < 1e-6, "không còn tính tiền đã chi");
  // Sau 2034: giữ vốn, không góp thêm, tiếp tục sinh lời
  const row2036 = sim.rows[6];
  const at2034 = bal([{ w: 1, R: 15 }], A2, 60, 100)[0];
  assert.ok(Math.abs(row2036.balance - at2034 * Math.pow(1 + r2, 24)) < 1e-6);
  assert.ok(Math.abs(at2034 - 1000) < 1e-6, "đạt đúng mục tiêu tại hạn");

  // Mốc tuổi lấy tuổi hiện tại (không hardcode 21/2026)
  const ms = env.calculateAgeMilestones();
  assert.deepStrictEqual(ms.map(m => m.age), [33, 38, 43, 48, 53, 58]);
  assert.deepStrictEqual(ms.map(m => m.year), [2030, 2035, 2040, 2045, 2050, 2055]);
  assert.ok(Math.abs(ms[0].stocks - row2030.stocks) < 1e-9, "Phần 1 dùng đúng kết quả mô phỏng");
  assert.ok(Math.abs(ms[0].incomeNeed - (A1 + A2) / 0.4) < 1e-9);
  // Hết mục tiêu chi tiêu: thu nhập cần chỉ còn khoản góp của quỹ dài hạn ở 2031 và bằng 0 sau 2034
  assert.ok(Math.abs(env.getMatrixIncomeNeed(1) - (A1 + A2) / 0.4) < 1e-9);
  assert.ok(Math.abs(env.getMatrixIncomeNeed(3) - A2 / 0.4) < 1e-9, "mục tiêu đã kết thúc không cộng vào năm sau");
  assert.strictEqual(env.getMatrixIncomeNeed(5), 0);
});

test("G. Đổi Loại đầu tư của sản phẩm làm tỷ trọng nhóm thay đổi theo; sản phẩm cùng nhóm giữ lợi suất riêng", () => {
  const g = goal("Quỹ", {
    val: 500, start: 2030, end: 2033, fundUsage: "hold",
    allocProducts: [
      { prodName: "ETF A", weight: 40, _explicitSelected: true },
      { prodName: "Quỹ cổ phiếu B", weight: 40, _explicitSelected: true },
      { prodName: "Tiền gửi C", weight: 20, _explicitSelected: true }
    ]
  });
  const state = baseState({ tcGoals: [g] });
  const env = makeEnv(state);
  let row = env.simulatePersonalPortfolio(5).rows[0];
  assert.ok(row.stocks > 70 && row.bank_deposit > 0);
  const retBefore = row.expectedReturn;
  const bankBefore = row.bank_deposit;

  state.investProducts[1].investmentType = "bonds"; // sửa ở danh mục kênh đầu tư
  row = env.simulatePersonalPortfolio(5).rows[0];
  assert.ok(row.bonds > 0, "Phần 1/2 thấy loại mới");
  assert.ok(Math.abs(row.expectedReturn - retBefore) < 1e-12, "đổi loại không đổi lợi suất");
  assert.ok(Math.abs(row.stocks + row.bonds + row.bank_deposit - 100) < 1e-9);

  state.investProducts[1].investmentType = "";
  row = env.simulatePersonalPortfolio(5).rows[0];
  assert.ok(row.unknown > 0, "chưa xác định không bị xếp vào tiền gửi");
  assert.ok(Math.abs(row.bank_deposit - bankBefore) < 1e-12, "tiền gửi không nhận thêm phần chưa xác định");
  assert.ok(env.describePortfolioIssues().some(m => m.includes("chưa xác định Loại đầu tư")));
});

test("H. Danh mục sai tỷ trọng / chưa có dữ liệu: không dùng benchmark, không xóa dữ liệu", () => {
  const bad = goal("Sai", {
    val: 500, start: 2030, end: 2033,
    allocProducts: [
      { prodName: "ETF A", weight: 60, _explicitSelected: true },
      { prodName: "Tiền gửi C", weight: 30, _explicitSelected: true },
      { prodName: "", weight: 0 }
    ]
  });
  const state = baseState({ tcGoals: [bad] });
  const env = makeEnv(state);
  assert.strictEqual(env.calculateMonthlyNeed(bad), 0);
  assert.strictEqual(bad.fundingStatus, "invalid_portfolio");
  const sim = env.simulatePersonalPortfolio(30);
  assert.strictEqual(sim.status, "insufficient");
  assert.ok(sim.issues.some(i => i.code === "invalid_portfolio"));
  const ms = env.calculateAgeMilestones();
  ms.forEach(m => {
    assert.strictEqual(m.stocks, null);
    assert.strictEqual(m.returnNeed, null);
  });
  assert.strictEqual(bad.allocProducts[0].weight, 60, "không mất dữ liệu người dùng");
  // sản phẩm bị xóa khỏi danh mục: giữ nguyên dòng phân bổ
  state.investProducts.splice(2, 1);
  env.calculateMonthlyNeed(bad);
  assert.strictEqual(bad.allocProducts[1].prodName, "Tiền gửi C");
  assert.strictEqual(bad.allocProducts[1].weight, 30);
});

test("I. Dữ liệu cũ chưa có investmentType: giữ nguyên, tự nhận diện khi rõ, còn lại chưa xác định; lưu/tải giữ nguyên", () => {
  const legacy = [
    { name: "Cổ phiếu VN30", returnRate: 15, risk: 20 },
    { name: "Finhay", returnRate: 6, risk: 1 },
    { name: "Quỹ X", returnRate: 8, risk: 3, investmentType: "insurance" }
  ];
  const env = makeEnv({ investProducts: legacy });
  env.normalizeInvestProducts(legacy);
  assert.strictEqual(legacy[0].investmentType, "stocks");
  assert.strictEqual(legacy[0].investmentTypeAuto, true);
  assert.strictEqual(legacy[1].investmentType, "", "Finhay không bị gán Tiền gửi");
  assert.strictEqual(legacy[2].investmentType, "insurance");
  assert.strictEqual(legacy[2].investmentTypeAuto, undefined);
  assert.strictEqual(legacy.length, 3);
  assert.strictEqual(legacy[1].returnRate, 6);
  const reloaded = JSON.parse(JSON.stringify(legacy));
  assert.deepStrictEqual(reloaded.map(p => p.investmentType), ["stocks", "", "insurance"]);
  env.normalizeInvestProducts(reloaded);
  assert.deepStrictEqual(reloaded.map(p => p.investmentType), ["stocks", "", "insurance"]);
});

test("J. Giao diện: cột Loại đầu tư, bốn lựa chọn, mirror script.js", () => {
  const html = fs.readFileSync(path.join(__dirname, "../main.html"), "utf8");
  assert.ok(html.includes("Loại đầu tư</th>"));
  assert.ok(html.includes("Lợi suất kỳ vọng danh mục/năm"));
  assert.ok(src.includes("FinancialMath.INVESTMENT_TYPE_LABELS[t]"));
  const { FinancialMath } = makeEnv({});
  assert.deepStrictEqual(
    FinancialMath.INVESTMENT_TYPES.map(t => FinancialMath.INVESTMENT_TYPE_LABELS[t]),
    ["Cổ phiếu", "Trái phiếu", "Bảo hiểm", "Tiền gửi Ngân hàng"]
  );
  assert.ok(!src.includes("DEFAULT_PORTFOLIO_30YR_BENCHMARK"));
  assert.strictEqual(
    fs.readFileSync(path.join(__dirname, "../script.js"), "utf8"),
    src,
    "script.js phải trùng js/script.js"
  );
});

test("K. Hưu trí: số kỳ theo NĂM, lạm phát và lợi suất giai đoạn nghỉ hưu thận trọng", () => {
  const ret = goal("Hưu trí", {
    id: "fixed_retirement", fixedType: "retirement", isFixed: true, layoutV: 2,
    start: 2030, end: 2040, yearsRetire: 30, monthlyRetire: 10, inflation: 4, retireReturnRate: 6.5, deathFund: 0,
    allocProducts: [
      { prodName: "Tiền gửi C", weight: 100, _explicitSelected: true },
      { prodName: "", weight: 0 }, { prodName: "", weight: 0 }
    ]
  });
  const env = makeEnv(baseState({ tcGoals: [ret] }));
  env.calculateMonthlyNeed(ret);
  // kỳ vọng độc lập: chi tiêu năm đầu nghỉ hưu quy đổi lạm phát 11 năm, tăng 4%/năm, chiết khấu 6,5%/năm, 30 NĂM
  const first = 120 * Math.pow(1.04, 11);
  let cap = 0;
  for (let t = 1; t <= 30; t++) cap += first * Math.pow(1.04, t - 1) / Math.pow(1.065, t);
  assert.ok(Math.abs(ret.val - cap) < 0.01, `vốn hưu trí ${ret.val} vs ${cap}`);
  // nếu nhầm 30 là 30 tháng (2,5 năm) thì thấp hơn rất nhiều
  let wrong = 0;
  for (let t = 1; t <= 2.5; t++) wrong += first * Math.pow(1.04, t - 1) / Math.pow(1.065, t);
  assert.ok(ret.val > wrong * 5);
  // khoản góp khớp mục tiêu theo lợi suất sản phẩm 5%
  const r = effMonthly(5), n = 132;
  const A = ret.calculatedTargetFV / ((Math.pow(1 + r, n) - 1) / r);
  assert.ok(Math.abs(ret.monthly - A) < 1e-6);
});

test("L. Lạm phát mục tiêu thường; 0% giữ nguyên kết quả cũ", () => {
  const g1 = goal("Mua nhà", { val: 1500, start: 2030, end: 2036, inflation: 4,
    allocProducts: [{ prodName: "Tiền gửi C", weight: 100, _explicitSelected: true }, { prodName: "", weight: 0 }, { prodName: "", weight: 0 }] });
  const g0 = JSON.parse(JSON.stringify(g1)); g0.inflation = 0;
  const env = makeEnv(baseState({ tcGoals: [g1, g0] }));
  env.calculateMonthlyNeed(g1); env.calculateMonthlyNeed(g0);
  assert.ok(Math.abs(g1.calculatedTargetFV - 1500 * Math.pow(1.04, 7)) < 1e-6);
  assert.ok(Math.abs(g0.calculatedTargetFV - 1500) < 1e-9);
  assert.ok(g1.monthly > g0.monthly);
});

test("M. Di chuyển dữ liệu cũ: khối Hưu trí chứa quỹ dự phòng -> mục tiêu 'Quỹ dự phòng', không mất dữ liệu", () => {
  const legacyRet = goal("Hưu trí", { id: "fixed_retirement", fixedType: "retirement", isFixed: true, val: 500, start: 2030, end: 2035,
    reserveMonths: 10, monthlyCostEstimate: 50, annualCostEstimate: 600, paid: 20 });
  const goals = [legacyRet];
  const env = makeEnv(baseState({ tcGoals: goals }));
  env.migrateLegacyRetirementReserve(goals);
  assert.strictEqual(goals.length, 2);
  const moved = goals[0];
  assert.strictEqual(moved.name, "Quỹ dự phòng");
  assert.strictEqual(moved.val, 500);
  assert.strictEqual(moved.paid, 20);
  assert.strictEqual(moved.start, 2030);
  assert.strictEqual(moved.isFixed, false);
  assert.strictEqual(legacyRet.name, "Hưu trí");
  assert.strictEqual(legacyRet.val, 0);
  assert.strictEqual(legacyRet.layoutV, 2);
  env.migrateLegacyRetirementReserve(goals);
  assert.strictEqual(goals.length, 2, "chạy lại không nhân đôi");
});

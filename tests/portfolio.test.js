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
  "describePortfolioIssues", "getPortfolioAllocationAtAge", "getPortfolio30YrData", "calculateAgeMilestones", "getAverageExpectedReturnPct",
  "yearsToGoalDate", "inflateToGoalDate", "syncCollegeMonthlyFromTotal", "accumulationMonthsOf", "singleRateOfGoal", "applyFixedGoalValEdit",
  "migrateLegacyRetirementReserve"
].filter(n => new RegExp("^function " + n + "\\(", "m").test(src));

function makeEnv(state) {
  const code = [
    FM_SRC,
    src.match(/const RETIREMENT_PHASE_DEFAULT_RETURN_PCT = [^;]+;/)[0],
    src.match(/const INFLATION_ENABLED = [^;]+;/)[0],
    ...FN_NAMES.map(n => extractTopLevel(src, "function " + n + "(")),
    "return { FinancialMath, calculateMonthlyNeed, simulatePersonalPortfolio, getPortfolio30YrData, getMatrixIncomeNeed, " +
    "calculateAgeMilestones, migrateLegacyRetirementReserve, normalizeInvestProducts, getProductInvestmentType, describePortfolioIssues, getPortfolioAllocationAtAge, getAverageExpectedReturnPct, applyFixedGoalValEdit, syncCollegeMonthlyFromTotal, createFixedCollegeGoal };"
  ].join("\n");
  const factory = new Function("AppState", "window", code);
  return factory(state, {});
}

// --- Phép tính độc lập, không dùng FinancialMath ---
const effMonthly = (R) => Math.pow(1 + R / 100, 1 / 12) - 1;
function refSim(products, A, months, B0 = 0) {
  // products: [{w (0..1), R(%)}]; mỗi năm góp dồn 12A vào cuối năm, lãi nhập vốn theo năm
  return products.map(p => {
    let b = B0 * p.w;
    for (let y = 0; y < months / 12; y++) b = b * (1 + p.R / 100) + 12 * A * p.w;
    return b;
  });
}
const annF = (R, Y) => (R === 0 ? Y : (Math.pow(1 + R / 100, Y) - 1) / (R / 100));

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

test("B2. Số dư ban đầu có sinh lãi: khoản góp nhỏ hơn cách trừ thẳng số dư (quy ước năm)", () => {
  const { FinancialMath } = makeEnv({});
  FinancialMath.PMT_CONVENTION = "annual"; // kiểm tra quy ước góp cuối năm
  const pmt = FinancialMath.calculateInvestmentPMT(1000, 400, 10, 24);
  const expected = (1000 - 400 * Math.pow(1.1, 2)) / (12 * annF(10, 2));
  assert.ok(Math.abs(pmt - expected) < 1e-9, `${pmt} vs ${expected}`);
  const naive = (1000 - 400) / (12 * annF(10, 2));
  assert.ok(pmt < naive);
  assert.strictEqual(FinancialMath.calculateInvestmentPMT(100, 120, 5, 12), 0);
});

test("C. Ba sản phẩm 20/30/50, 14% / 9,8% / 5% hiệu dụng, 48 tháng: tổng giá trị tương lai = mục tiêu (quy ước năm)", () => {
  const { FinancialMath } = makeEnv({});
  FinancialMath.PMT_CONVENTION = "annual"; // kiểm tra quy ước góp cuối năm
  const S = 1000;
  const prods = [{ w: 0.2, R: 14 }, { w: 0.3, R: 9.8 }, { w: 0.5, R: 5 }];
  const res = FinancialMath.calculateMultiProductPMT(S, prods.map(p => ({ weight: p.w * 100, returnRatePct: p.R, initialBalance: 0 })), 48);
  assert.strictEqual(res.status, "ok");
  // kỳ vọng độc lập: A = S / Σ w F_p
  const denom = prods.reduce((s, p) => s + p.w * annF(p.R, 4), 0);
  assert.ok(Math.abs(res.pmt - S / (12 * denom)) < 1e-9);
  const total = refSim(prods, res.pmt, 48).reduce((a, b) => a + b, 0);
  assert.ok(Math.abs(total - S) < 1e-6, `tổng FV ${total}`);
  // khác khoản góp tính bằng lợi suất bình quân (cách cũ)
  const avg = prods.reduce((s, p) => s + p.w * p.R, 0);
  const oldWay = FinancialMath.calculateInvestmentPMT(S, 0, avg, 48);
  assert.ok(Math.abs(oldWay - res.pmt) > 1e-4, "không dùng lợi suất bình quân");
});

test("C2. Có số dư ban đầu theo tỷ trọng: mô phỏng từng sản phẩm đạt đúng mục tiêu (quy ước năm)", () => {
  const { FinancialMath } = makeEnv({});
  FinancialMath.PMT_CONVENTION = "annual"; // kiểm tra quy ước góp cuối năm
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
  assert.strictEqual(FinancialMath.inferInvestmentType("Finhay"), "bank_deposit", "Finhay thuộc Tiền gửi theo báo cáo");
  assert.strictEqual(FinancialMath.inferInvestmentType("DCDS"), "stocks");
  assert.strictEqual(FinancialMath.inferInvestmentType("DCBF"), "bonds");
  assert.strictEqual(FinancialMath.inferInvestmentType("Sản phẩm 1"), "");
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
  const xl = (S, B0, Rpct, n) => { const r = Rpct / 1200; return (S - B0 * Math.pow(1 + r, n)) * r / (Math.pow(1 + r, n) - 1); };
  assert.ok(Math.abs(A1 - xl(600, 0, 8.5, 36)) < 1e-9, "khoản góp mục tiêu 1 (lãi bình quân 8,5%, lãi tháng = năm/12)");
  const exA2 = xl(1000, 100, 15, 60);
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
  assert.ok(Math.abs(row2030.stocks + row2030.bonds + row2030.insurance + row2030.bank_deposit - 100) < 1e-9);
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
  assert.ok(Math.abs(row2036.balance - at2034 * Math.pow(1.15, 2)) < 1e-6);
  assert.ok(at2034 < 1000 && at2034 > 900, "bảng số dư theo năm hơi thấp hơn mục tiêu theo công thức góp tháng của bảng tính gốc");

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
  assert.strictEqual(row.unknown, undefined, "không còn cột Chưa xác định");
  assert.ok(Math.abs(row.stocks + row.bonds + row.insurance + row.bank_deposit - 100) < 1e-9, "tỷ trọng chia theo phần đã xác định loại");
  assert.ok(row.bank_deposit > 0 && row.stocks > 0);
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
  assert.strictEqual(legacy[1].investmentType, "bank_deposit");
  assert.strictEqual(legacy[2].investmentType, "insurance");
  assert.strictEqual(legacy[2].investmentTypeAuto, undefined);
  assert.strictEqual(legacy.length, 3);
  assert.strictEqual(legacy[1].returnRate, 6);
  const reloaded = JSON.parse(JSON.stringify(legacy));
  assert.deepStrictEqual(reloaded.map(p => p.investmentType), ["stocks", "bank_deposit", "insurance"]);
  env.normalizeInvestProducts(reloaded);
  assert.deepStrictEqual(reloaded.map(p => p.investmentType), ["stocks", "bank_deposit", "insurance"]);
});

test("J. Giao diện: cột Loại đầu tư, bốn lựa chọn, một file nguồn", () => {
  const html = fs.readFileSync(path.join(__dirname, "../main.html"), "utf8");
  assert.ok(html.includes("Loại đầu tư</th>"));
  assert.ok(html.includes("Mức sinh lời cần thiết"));
  assert.ok(src.includes("FinancialMath.INVESTMENT_TYPE_LABELS[t]"));
  const { FinancialMath } = makeEnv({});
  assert.deepStrictEqual(
    FinancialMath.INVESTMENT_TYPES.map(t => FinancialMath.INVESTMENT_TYPE_LABELS[t]),
    ["Cổ phiếu", "Trái phiếu", "Bảo hiểm", "Tiền gửi"]
  );
  assert.ok(!src.includes("DEFAULT_PORTFOLIO_30YR_BENCHMARK"));
  assert.ok(!fs.existsSync(path.join(__dirname, "../script.js")), "không còn bản sao script.js ở thư mục gốc");
});

test("K. Hưu trí: số kỳ theo NĂM, chưa tính lạm phát, lợi suất giai đoạn nghỉ hưu thận trọng", () => {
  const ret = goal("Hưu trí", {
    id: "fixed_retirement", fixedType: "retirement", isFixed: true, layoutV: 2, retireModel: 2,
    start: 2030, end: 2040, yearsRetire: 30, monthlyRetire: 10, inflation: 4, retireReturnRate: 6.5, deathFund: 0,
    allocProducts: [
      { prodName: "Tiền gửi C", weight: 100, _explicitSelected: true },
      { prodName: "", weight: 0 }, { prodName: "", weight: 0 }
    ]
  });
  const env = makeEnv(baseState({ tcGoals: [ret] }));
  env.calculateMonthlyNeed(ret);
  // kỳ vọng độc lập: chi tiêu năm đầu nghỉ hưu quy đổi lạm phát 11 năm, tăng 4%/năm, chiết khấu 6,5%/năm, 30 NĂM
  const first = 120; // lạm phát đang tắt: trường inflation bị bỏ qua
  let cap = 0;
  for (let t = 1; t <= 30; t++) cap += first / Math.pow(1.065, t);
  assert.ok(Math.abs(ret.val - cap) < 0.01, `vốn hưu trí ${ret.val} vs ${cap}`);
  // nếu nhầm 30 là 30 tháng (2,5 năm) thì thấp hơn rất nhiều
  let wrong = 0;
  for (let t = 1; t <= 2.5; t++) wrong += first / Math.pow(1.065, t);
  assert.ok(ret.val > wrong * 5);
  // khoản góp khớp mục tiêu theo lợi suất sản phẩm 5%
  const rr = 5 / 1200;
  const A = ret.calculatedTargetFV * rr / (Math.pow(1 + rr, 132) - 1);
  assert.ok(Math.abs(ret.monthly - A) < 1e-6);
});

test("L. Lạm phát đang tắt: trường inflation (kể cả dữ liệu cũ = 4) không làm đổi mục tiêu", () => {
  const g1 = goal("Mua nhà", { val: 1500, start: 2030, end: 2036, inflation: 4,
    allocProducts: [{ prodName: "Tiền gửi C", weight: 100, _explicitSelected: true }, { prodName: "", weight: 0 }, { prodName: "", weight: 0 }] });
  const g0 = JSON.parse(JSON.stringify(g1)); g0.inflation = 0;
  const env = makeEnv(baseState({ tcGoals: [g1, g0] }));
  env.calculateMonthlyNeed(g1); env.calculateMonthlyNeed(g0);
  assert.ok(Math.abs(g1.calculatedTargetFV - 1500) < 1e-9);
  assert.ok(Math.abs(g0.calculatedTargetFV - 1500) < 1e-9);
  assert.ok(Math.abs(g1.monthly - g0.monthly) < 1e-12);
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

test("N. Hưu trí dữ liệu cũ: không tự ghi đè mục tiêu đã nhập", () => {
  const ret = goal("Hưu trí", { id: "fixed_retirement", fixedType: "retirement", isFixed: true, layoutV: 2, val: 500, start: 2031, end: 2040, yearsRetire: 30, monthlyRetire: 10 });
  const env = makeEnv(baseState({ tcGoals: [ret] }));
  env.calculateMonthlyNeed(ret);
  assert.strictEqual(ret.val, 500);
  assert.strictEqual(ret.calculatedTargetFV, 500);
});

test("O. Khớp ví dụ báo cáo (tuổi 26, mục tiêu Đám cưới năm thứ 5): góp 12A cuối năm, lãi nhập vốn theo năm", () => {
  const { FinancialMath } = makeEnv({});
  FinancialMath.PMT_CONVENTION = "annual"; // kiểm tra quy ước góp cuối năm
  const sim = FinancialMath.simulateGoalYearEndBalances({
    startYear: 2024, endYear: 2030, lastYear: 2028, monthlyContribution: 1.6066, spendAtEnd: true,
    products: [
      { weight: 30, returnRatePct: 15, initialBalance: 0 },
      { weight: 50, returnRatePct: 10.5, initialBalance: 0 },
      { weight: 20, returnRatePct: 5, initialBalance: 0 }
    ]
  });
  const b = sim.years[2028];
  assert.ok(Math.abs(b[0] - 38.99) < 0.02, "ETFFINLEAD " + b[0]);
  assert.ok(Math.abs(b[1] - 59.44) < 0.02, "TP Techcombank " + b[1]);
  assert.ok(Math.abs(b[2] - 21.31) < 0.02, "Tiền gửi " + b[2]);
  // công thức khoản góp và bảng số dư dùng chung một quy ước: đạt đúng mục tiêu
  const S = 200;
  const pm = FinancialMath.calculateMultiProductPMT(S, [
    { weight: 30, returnRatePct: 15, initialBalance: 0 }, { weight: 50, returnRatePct: 10.5, initialBalance: 0 }, { weight: 20, returnRatePct: 5, initialBalance: 0 }
  ], 84).pmt;
  const sim2 = FinancialMath.simulateGoalYearEndBalances({
    startYear: 2024, endYear: 2030, lastYear: 2030, monthlyContribution: pm, spendAtEnd: false,
    products: [{ weight: 30, returnRatePct: 15 }, { weight: 50, returnRatePct: 10.5 }, { weight: 20, returnRatePct: 5 }]
  });
  assert.ok(Math.abs(sim2.years[2030].reduce((a, v) => a + v, 0) - S) < 1e-9);
});

test("P. Khớp bảng tính gốc: khoản góp từng mục tiêu và thu nhập cần có (tuổi 21 và 26)", () => {
  const { FinancialMath } = makeEnv({});
  const pm = (S, ps, years) => FinancialMath.calculateMultiProductPMT(S, ps.map(([w, R]) => ({ weight: w, returnRatePct: R, initialBalance: 0 })), years * 12).pmt;
  const g4 = pm(50, [[50, 5], [20, 15], [30, 10.5]], 4);
  const g5 = pm(100, [[100, 10.5]], 4);
  const g6 = pm(200, [[30, 15], [50, 10.5], [20, 5]], 7);
  const g7 = pm(500, [[50, 5], [50, 10]], 5);
  const g8 = pm(1500, [[100, 16]], 13);
  assert.ok(Math.abs(g4 - 0.8755) < 2e-4, "g4 " + g4);
  assert.ok(Math.abs(g5 - 1.6853) < 2e-4, "g5 " + g5);
  assert.ok(Math.abs(g6 - 1.6066) < 2e-4, "g6 " + g6);
  assert.ok(Math.abs(g7 - 6.8940) < 2e-4, "g7 " + g7);
  assert.ok(Math.abs(g8 - 2.9006) < 2e-4, "g8 " + g8);
  assert.ok(Math.abs((g4 + g5) / 0.4 - 6.40) < 0.01, "thu nhập cần tuổi 21");
  assert.ok(Math.abs((g6 + g7 + g8) / 0.4 - 28.50) < 0.01, "thu nhập cần tuổi 26");
});

test("Q. Tên viết tắt BH / TP được nhận diện đúng loại đầu tư", () => {
  const { FinancialMath } = makeEnv({});
  assert.strictEqual(FinancialMath.inferInvestmentType("BH liên kết ĐT"), "insurance");
  assert.strictEqual(FinancialMath.inferInvestmentType("BH thuần túy"), "insurance");
  assert.strictEqual(FinancialMath.inferInvestmentType("TP Techcombank"), "bonds");
  assert.strictEqual(FinancialMath.inferInvestmentType("TP FE Credit"), "bonds");
  assert.strictEqual(FinancialMath.inferInvestmentType("Tiền gửi NH"), "bank_deposit");
});

test("R. Dữ liệu bảng tính gốc: tỷ trọng và thu nhập cần có tuổi 21 và 26 khớp báo cáo 'sau khi sửa'", () => {
  const prods = [
    { name: "ETF ETFFINLEAD", returnRate: 15, risk: 20 }, { name: "TP Techcombank", returnRate: 10.5, risk: 6 },
    { name: "TP FE Credit", returnRate: 10, risk: 8 }, { name: "DCBC", returnRate: 16, risk: 20 },
    { name: "Tiền gửi NH", returnRate: 5, risk: 2 }, { name: "BH liên kết ĐT", returnRate: 12, risk: 5 }
  ];
  const al = (...a) => { const o = a.map(([n, w]) => ({ prodName: n, weight: w, _explicitSelected: true })); while (o.length < 3) o.push({ prodName: "", weight: 0 }); return o; };
  const goals = [
    goal("Du lịch", { val: 50, start: 2023, end: 2026, allocProducts: al(["Tiền gửi NH", 50], ["ETF ETFFINLEAD", 20], ["TP Techcombank", 30]) }),
    goal("Dự phòng", { val: 100, start: 2023, end: 2026, allocProducts: al(["TP Techcombank", 100]) }),
    goal("Đám cưới", { val: 200, start: 2024, end: 2030, allocProducts: al(["ETF ETFFINLEAD", 30], ["TP Techcombank", 50], ["Tiền gửi NH", 20]) }),
    goal("Khởi nghiệp", { val: 500, start: 2028, end: 2032, allocProducts: al(["Tiền gửi NH", 50], ["TP FE Credit", 50]) }),
    goal("Mua chung cư", { val: 1500, start: 2025, end: 2037, allocProducts: al(["DCBC", 100]) })
  ];
  const state = baseState({ currentYear: 2023, currentAge: 21, targetSavingsRate: 40, investProducts: prods, tcGoals: goals });
  const env = makeEnv(state);
  env.normalizeInvestProducts(prods);
  assert.deepStrictEqual(prods.map(p => p.investmentType), ["stocks", "bonds", "bonds", "stocks", "bank_deposit", "insurance"]);
  const ms = env.calculateAgeMilestones();
  const near = (a, b, tol) => Math.abs(a - b) <= tol;
  // báo cáo (sau khi sửa) tuổi 21: 6,8 / 76,1 / 0 / 17,1 ; thu nhập 6,40
  assert.ok(near(ms[0].incomeNeed, 6.40, 0.01), "thu nhập 21: " + ms[0].incomeNeed);
  assert.ok(near(ms[0].stocks, 6.8, 0.2) && near(ms[0].bonds, 76.1, 0.2) && near(ms[0].cash, 17.1, 0.2), JSON.stringify(ms[0]));
  // tuổi 26: 56,8 / 26,6 / 0 / 16,5 ; thu nhập 28,50
  assert.ok(near(ms[1].incomeNeed, 28.50, 0.01), "thu nhập 26: " + ms[1].incomeNeed);
  assert.ok(near(ms[1].stocks, 56.8, 0.2) && near(ms[1].bonds, 26.6, 0.2) && near(ms[1].cash, 16.5, 0.2), JSON.stringify(ms[1]));
});

test("S. Quỹ dự phòng: mục tiêu = số tháng dự phòng × chi phí mỗi tháng (6 × 21 = 126), không chiết khấu", () => {
  const g = Object.assign(goal("fixed_college", {}), {
    isFixed: true, fixedType: "college", name: "Quỹ dự phòng Tài chính",
    start: 2027, end: 2029, collegePeriods: 6, monthlyTuition: 21, supportFund: 0, estimatedRate: 5,
    allocProducts: [
      { prodName: "ETF A", weight: 50, _explicitSelected: true },
      { prodName: "Tiền gửi C", weight: 50, _explicitSelected: true },
      { prodName: "", weight: 0 }
    ]
  });
  const env = makeEnv(baseState({ currentYear: 2026, tcGoals: [g] }));
  env.calculateMonthlyNeed(g);
  assert.strictEqual(g.val, 126);
  assert.strictEqual(g.calculatedTargetFV, 126);
  assert.ok(g.monthly > 0 && g.monthly * 36 < 126, "khoản góp hằng tháng nhỏ hơn mục tiêu / số tháng góp nhờ lãi");
});

test("T. Mức sinh lời trung bình ở dashboard = trung bình V(y) = Σ tỷ trọng nhóm × lợi nhuận TB nhóm", () => {
  // Nhóm: cổ phiếu (12% và 15% -> TB 13,5%), tiền gửi (5%)
  const g = goal("Quỹ giữ vốn", {
    val: 300, start: 2030, end: 2032, fundUsage: "hold",
    allocProducts: [
      { prodName: "ETF A", weight: 50, _explicitSelected: true },
      { prodName: "Tiền gửi C", weight: 50, _explicitSelected: true },
      { prodName: "", weight: 0 }
    ]
  });
  const env = makeEnv(baseState({ tcGoals: [g] }));
  const r = 0.5 * 12 + 0.5 * 5; // lãi mục tiêu
  const i = r / 1200, N = 36;
  const A = 300 * i / (Math.pow(1 + i, N) - 1);
  const rStock = (12 + 15) / 2, rBank = 5;
  let bs = 0, bb = 0, sum = 0, k = 0;
  for (let y = 2030; y <= 2059; y++) {
    if (y <= 2032) { bs = bs * 1.12 + 12 * A * 0.5; bb = bb * 1.05 + 12 * A * 0.5; }
    else { bs *= 1.12; bb *= 1.05; }
    sum += (bs * rStock + bb * rBank) / (bs + bb);
    k++;
  }
  assert.strictEqual(k, 30);
  assert.ok(Math.abs(env.getAverageExpectedReturnPct() - sum / k) < 1e-9);
  assert.strictEqual(makeEnv(baseState()).getAverageExpectedReturnPct(), null, "chưa có mục tiêu -> chưa có số");
});

test("U. Quỹ dự phòng: sửa tay Giá trị mục tiêu được giữ và dùng tính khoản góp; đổi số tháng thì tính lại", () => {
  const g = Object.assign(goal("fixed_college", {}), {
    isFixed: true, fixedType: "college", name: "Quỹ dự phòng Tài chính",
    start: 2027, end: 2029, collegePeriods: 6, monthlyTuition: 10, estimatedRate: 5,
    allocProducts: [
      { prodName: "ETF A", weight: 50, _explicitSelected: true },
      { prodName: "Tiền gửi C", weight: 50, _explicitSelected: true },
      { prodName: "", weight: 0 }
    ]
  });
  const env = makeEnv(baseState({ currentYear: 2026, tcGoals: [g] }));
  env.calculateMonthlyNeed(g);
  assert.strictEqual(g.val, 60);
  const mAuto = g.monthly;
  g.val = 90; env.applyFixedGoalValEdit(g, 90);
  env.calculateMonthlyNeed(g);
  assert.strictEqual(g.val, 90, "số gõ tay không bị tính đè lại");
  assert.ok(Math.abs(g.monthly - mAuto * 1.5) < 1e-9, "khoản góp tính theo 90");
  g.collegePeriods = 8; g._manualValOverride = false; // như khi sửa số tháng ở thẻ
  env.calculateMonthlyNeed(g);
  assert.strictEqual(g.val, 80);
});

test("Quỹ dự phòng: sửa Tổng ước chi phí thì chi phí mỗi tháng tự tính lại, giữ đúng tổng", () => {
  const env = makeEnv({ currentYear: 2026, currentAge: 21 });
  const g = env.createFixedCollegeGoal();
  g.start = 2030; g.end = 2048; g.collegePeriods = 4; g.yearsRetire = 4; g.inflation = 0;
  g.monthlyTuition = 20; g.monthlyRetire = 20;
  g.val = 724;
  env.applyFixedGoalValEdit(g, 724);
  env.syncCollegeMonthlyFromTotal(g, 724);
  assert.strictEqual(g.monthlyTuition, 181);
  assert.strictEqual(g.monthlyRetire, 181);
  env.calculateMonthlyNeed(g);
  assert.strictEqual(Math.round(g.val), 724);
  // Không có số tháng dự phòng: giữ nguyên chi phí mỗi tháng
  const h = env.createFixedCollegeGoal(); h.collegePeriods = 0; h.yearsRetire = 0; h.monthlyTuition = 20;
  env.syncCollegeMonthlyFromTotal(h, 724);
  assert.strictEqual(h.monthlyTuition, 20);
});

test("Mức sinh lời trung bình: bảng 30 năm, mốc tuổi và Dashboard cùng dùng V(y) = Σ tỷ trọng nhóm × lợi nhuận TB nhóm", () => {
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
  const env = makeEnv(baseState({ tcGoals: [spend, hold] }));
  const rows = env.simulatePersonalPortfolio(30).rows.filter(r => r.hasData);
  const avgStocks = (12 + 15) / 2, avgDeposit = 5; // trung bình cộng lợi nhuận sản phẩm trong nhóm
  rows.forEach(r => {
    const expected = (r.stocks / 100) * avgStocks + (r.bank_deposit / 100) * avgDeposit;
    assert.ok(Math.abs(r.groupReturn - expected) < 1e-9, `V(${r.year})`);
  });
  const k = rows.length;
  const mean = rows.reduce((s, r) => s + r.groupReturn, 0) / k;
  assert.ok(Math.abs(env.getAverageExpectedReturnPct() - mean) < 1e-9, "trung bình các năm có số dư");
  // Bảng 30 năm dùng cùng V(y)
  const list = env.getPortfolio30YrData().filter(x => x.hasData);
  assert.strictEqual(list.length, k);
  const tableMean = list.reduce((s, x) => s + x.ret, 0) / list.length;
  assert.ok(Math.abs(tableMean - env.getAverageExpectedReturnPct()) < 1e-9, "trung bình ở bảng 30 năm = Dashboard");
});

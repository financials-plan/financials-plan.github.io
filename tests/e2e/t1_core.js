// Nhóm 1: tải trang, console, mạng, điều hướng, nhập liệu, tính toán, khảo sát, theme, tooltip/tour cơ bản
const L = require('./lib');
(async () => {
  const { server, base } = await L.serve();
  const browser = await L.chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 850 }, recordVideo: undefined });
  const fbLog = [];
  await L.guardFirebase(ctx, fbLog); await L.skipNudge(ctx);
  await ctx.tracing.start({ screenshots: true, snapshots: true });
  const page = await ctx.newPage();
  const errs = [], reqFail = [], resp404 = [], dialogs = [];
  page.on('pageerror', e => errs.push('PAGEERR ' + e.message));
  page.on('console', m => { if (['error'].includes(m.type()) && !L.IGNORE_ERR.test(m.text())) errs.push('CONSOLE ' + m.text().slice(0, 160)); });
  page.on('requestfailed', r => { if (!L.IGNORE_ERR.test(r.url() + (r.failure() && r.failure().errorText))) reqFail.push(r.url().slice(0, 100)); });
  page.on('response', r => { if (r.status() >= 400 && r.url().startsWith(base)) resp404.push(r.status() + ' ' + r.url()); });
  page.on('dialog', d => { dialogs.push(d.message()); d.dismiss(); });

  // ---- 1. tải trang ----
  const t0 = Date.now();
  await page.goto(base + '/main.html', { waitUntil: 'load' });
  await page.waitForFunction(() => window.TCCNTutorial && window.CloudDB, null, { timeout: 20000 });
  await page.waitForTimeout(1200);
  L.check('1.1 trang nạp, TCCNTutorial và CloudDB sẵn sàng', true);
  L.check('1.2 không lỗi JS khi nạp', errs.length === 0, errs);
  L.check('1.3 không tệp cục bộ trả 4xx', resp404.length === 0, resp404);
  const nav = await page.evaluate(() => { const n = performance.getEntriesByType('navigation')[0]; return { dcl: Math.round(n.domContentLoadedEventEnd), load: Math.round(n.loadEventEnd), transfer: Math.round(n.transferSize / 1024) }; });
  console.log('  (thông tin) điều hướng:', JSON.stringify(nav));
  const title = await page.title();
  L.check('1.5 có <title> và lang=vi', title.length > 3 && (await page.getAttribute('html', 'lang')) === 'vi', title);
  L.check('1.6 viewport meta có mặt', (await page.locator('meta[name=viewport]').count()) === 1);

  // ---- 2. điều hướng mọi tab ----
  const tabs = [['btn-tab-tukhoa', 'DANH MỤC THIẾT LẬP'], ['btn-tab-dashboard', 'TỔNG QUAN TÀI CHÍNH'], ['btn-tab-muctieu-bt', 'MỤC TIÊU BẢN THÂN'], ['btn-tab-muctieu-tc', 'MỤC TIÊU TÀI CHÍNH'], ['btn-tab-candoi', 'CÂN ĐỐI LỘ TRÌNH'], ['btn-tab-kehoach', 'KẾ HOẠCH'], ['btn-tab-khaosat', 'KHẢO SÁT']];
  for (const [id, kw] of tabs) {
    await page.click('#' + id); await page.waitForTimeout(450);
    const t = await page.textContent('#current-title');
    const visible = await page.evaluate(() => { const a = document.querySelector('.tab-pane.active'); const r = a && a.getBoundingClientRect(); return !!r && r.height > 50; });
    L.check(`2. mở tab ${id}`, t.toUpperCase().includes(kw) && visible, { title: t, visible });
  }
  for (let m = 1; m <= 12; m++) {
    await page.click('#btn-month-' + m); await page.waitForTimeout(150);
    const t = await page.textContent('#current-title');
    if (!t.includes('THÁNG ' + m)) L.check(`2.m tháng ${m}`, false, t);
  }
  L.check('2.12 chuyển đủ 12 tháng, tiêu đề đúng', true);
  // tab phụ
  await page.click('#btn-tab-muctieu-tc'); await page.click('#btn-tc-sec2'); await page.waitForTimeout(300);
  L.check('2.13 Mục tiêu TC > Phần 2 hiện ma trận', await page.isVisible('#table-tc-matrix'));
  await page.click('#btn-tc-sec1');
  await page.click('#btn-tab-candoi'); await page.click('#btn-career-sec2'); await page.waitForTimeout(300);
  L.check('2.14 Cân đối > Phần 2 hiện biểu đồ', await page.isVisible('#careerChart'));
  await page.evaluate(() => switchMonthTab(12)); await page.click('#btn-month-sec3'); await page.waitForTimeout(300);
  L.check('2.15 Tháng 12 > Bảng cân đối hiện', await page.isVisible('#month-sec-3'));
  await page.evaluate(() => switchMonthTab(3));
  L.check('2.16 Tháng 3 không có phần cân đối (ẩn nút)', !(await page.isVisible('#btn-month-sec3')));

  // ---- 3. nhập liệu danh mục thiết lập ----
  await page.click('#btn-tab-tukhoa'); await page.waitForTimeout(300);
  const nExp = await page.locator('#tbody-expenses tr').count();
  await page.evaluate(() => addExpenseRow()); await page.waitForTimeout(200);
  L.check('3.1 thêm dòng chi phí', (await page.locator('#tbody-expenses tr').count()) === nExp + 1);
  await page.evaluate(() => deleteExpenseItem(AppState.expenses.length - 1)); await page.waitForTimeout(200);
  L.check('3.2 xóa dòng chi phí', (await page.locator('#tbody-expenses tr').count()) === nExp);
  // năm/tuổi
  const setCell = (id, v) => page.evaluate(([id, v]) => { const e = document.getElementById(id); e.innerText = String(v); e.dispatchEvent(new Event('input', { bubbles: true })); }, [id, v]);
  await setCell('input-year', 2027); await setCell('input-age', 30); await setCell('input-year', 2031);
  const ya = await page.evaluate(() => ({ y: AppState.currentYear, a: AppState.currentAge, label: document.querySelector('.dynamic-year').textContent }));
  L.check('3.3 đổi năm không đổi tuổi, nhãn năm cập nhật', ya.y === 2031 && ya.a === 30 && ya.label === '2031', ya);
  await setCell('input-year', 1899); await setCell('input-year', 2101);
  L.check('3.4 năm ngoài 1900–2100 bị từ chối', (await page.evaluate(() => AppState.currentYear)) === 2031);

  // ---- 4. mục tiêu và công thức (đối chiếu độc lập) ----
  await page.click('#btn-tab-muctieu-bt'); await page.waitForTimeout(300);
  await page.evaluate(() => addNewTcGoalRow()); await page.waitForTimeout(300);
  const calc = await page.evaluate(() => {
    const g = AppState.tcGoals[AppState.tcGoals.length - 1];
    g.type = 'invest'; g.val = 1200; g.paid = 0; g.start = 2031; g.end = 2040; g.allocProducts = []; g.estimatedRate = 6; g.rate = 6;
    renderTcGoalsFormTable(); const m = calculateMonthlyNeed(g); return { m, name: g.name };
  });
  // độc lập: PMT cuối tháng, r=6%/12, N=120, FV=1200 (khớp công thức excel_monthly)
  const r = 0.06 / 12, N = 120, expected = 1200 * r / (Math.pow(1 + r, N) - 1);
  L.check('4.1 khoản góp 1200tr/10 năm/6% khớp tính độc lập', Math.abs(calc.m - expected) < 0.02, { app: calc.m, expected: +expected.toFixed(4) });
  const over = await page.evaluate(() => { const g = AppState.tcGoals[AppState.tcGoals.length - 1]; g.paid = 1500; return calculateMonthlyNeed(g); });
  L.check('4.2 đã tích lũy vượt mục tiêu → khoản góp không âm (3.3)', over >= 0, over);
  const badYear = await page.evaluate(() => { const g = AppState.tcGoals[AppState.tcGoals.length - 1]; g.end = 2020; renderTcGoalsFormTable(); return document.querySelectorAll('#tbody-tc-form-goals .field-error').length; });
  L.check('4.3 năm hoàn tất < năm bắt đầu có cảnh báo ở ô', badYear >= 1, badYear);
  await page.evaluate(() => { const g = AppState.tcGoals[AppState.tcGoals.length - 1]; g.end = 2040; g.paid = 0; renderTcGoalsFormTable(); syncGoalsToCards(); renderTcMatrixTable(); });
  await page.click('#btn-tab-muctieu-tc'); await page.waitForTimeout(500);
  L.check('4.4 thẻ mục tiêu có ghi chú chưa chọn sản phẩm', (await page.locator('.goal-alloc-note').count()) >= 1);

  // ---- 5. khảo sát ----
  await page.click('#btn-tab-khaosat'); await page.waitForTimeout(500);
  const qCount = await page.locator('#gform-questions-p1 > *').count();
  L.check('5.1 phần 1 có câu hỏi', qCount >= 1, qCount);
  const optLabels = await page.evaluate(() => [...document.querySelectorAll('#tab-khaosat label, #tab-khaosat .gform-option')].map(e => e.textContent.trim()).filter(Boolean));
  const overlaps = optLabels.filter(s => /^\d+-\d+%$|^<\d+%$|^>\d+%$/.test(s));
  L.check('5.2 không còn đáp án khoảng đóng chồng mép', overlaps.length === 0, overlaps);
  await page.evaluate(() => { surveyQuestionsPart1.forEach((q, i) => AppState.surveyP1Choices[i + 1] = 1); surveyQuestionsPart2.forEach((q, i) => AppState.surveyP2Choices[i + 1] = 2); renderGoogleFormSurvey(); evaluateSurveys(); goToSurveyStep(3); });
  await page.waitForTimeout(400);
  const s = await page.evaluate(() => ({ badge: getComputedStyle(document.getElementById('survey-complete-badge')).display, t1: document.getElementById('survey-summary-risk-title').textContent, btn: !!document.getElementById('btn-survey-finish') }));
  L.check('5.3 hoàn tất khảo sát: badge, điểm/điểm tối đa, nút hoàn thành', s.badge !== 'none' && /\d+\/\d+ điểm/.test(s.t1) && s.btn, s);

  // ---- 6. theme ----
  const before = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  await page.click('#u021-theme-switch'); await page.waitForTimeout(500);
  const after = await page.evaluate(() => ({ t: document.documentElement.getAttribute('data-theme'), bg: getComputedStyle(document.body).backgroundColor }));
  L.check('6.1 chuyển giao diện tối đổi nền', after.t !== before, { before, after });
  await page.screenshot({ path: L.OUT + '/dark_survey.png' });
  await page.click('#u021-theme-switch'); await page.waitForTimeout(300);

  // ---- 7. quyền ghi Firebase ----
  const writes = fbLog.filter(x => !/installations|firebase\.googleapis\.com\/v1alpha/.test(x.url) && (x.method !== 'GET' || /commit|Write|batchGet/i.test(x.url)));
  L.check('7.1 không có yêu cầu ghi nào gửi tới Firebase trong cả phiên (đã chặn)', writes.length === 0, writes);
  L.check('7.2 không hộp thoại alert/confirm bất ngờ', dialogs.length === 0, dialogs);
  L.check('7.3 không lỗi JS suốt phiên', errs.length === 0, errs);
  L.check('7.4 không request lỗi cục bộ', reqFail.length === 0, reqFail);
  console.log('Firebase requests bị chặn (đọc/khởi tạo):', fbLog.length, [...new Set(fbLog.map(x => x.method + ' ' + x.url.slice(0, 60)))].slice(0, 4));

  await ctx.tracing.stop({ path: L.OUT + '/trace_core.zip' });
  await browser.close(); server.close();
  const f = L.summary('t1_core'); process.exit(f.length ? 1 : 0);
})().catch(e => { console.error('CRASH', e); process.exit(2); });

const L = require('./lib');
(async () => {
  const { server, base } = await L.serve();
  const browser = await L.chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 850 } });
  await L.guardFirebase(ctx, []); await L.skipNudge(ctx);
  const page = await ctx.newPage(); const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto(base + '/main.html'); await page.waitForFunction(() => window.TCCNTutorial); await page.waitForTimeout(1500);
  // nhập dữ liệu cục bộ
  await page.evaluate(() => { switchTab('tab-tukhoa'); AppState.expenses.push('Khoản thử E2E'); renderSetupTables(); syncKeywordChangesToDependentSheets(); window.hasUnsavedChanges = true; });
  const before = await page.evaluate(() => ({ exp: AppState.expenses.length, ls: Object.keys(localStorage) }));
  console.log('trước khi bấm Lưu:', JSON.stringify(before));
  // bấm Lưu khi chưa đăng nhập: phải có hộp xác nhận, chưa rời trang
  await page.click('#btn-cloud-save'); await page.waitForTimeout(600);
  const dlg = await page.evaluate(() => { const d = document.querySelector('[data-app-dialog]'); return d ? d.textContent.replace(/\s+/g, ' ').slice(0, 160) : null; });
  L.check('V1 chưa đăng nhập + bấm Lưu: hiện hộp xác nhận cảnh báo mất dữ liệu, chưa rời trang', !!dlg && /chưa đăng nhập/i.test(dlg) && page.url().includes('main.html'), { dlg, url: page.url() });
  // nhánh Ở lại: mở hộp xuất tệp, dữ liệu còn nguyên
  const btns = await page.$$eval('[data-app-dialog] button', bs => bs.map(b => b.textContent.trim()));
  console.log('nút trong hộp:', btns);
  await page.click('[data-app-dialog] button:has-text("Ở lại")'); await page.waitForTimeout(600);
  const stay = await page.evaluate(() => ({ url: location.pathname, exp: AppState.expenses.includes('Khoản thử E2E'), exportOpen: !!document.querySelector('#data-io-modal-overlay.active') }));
  L.check('V2 chọn Ở lại: vẫn ở trang, dữ liệu còn nguyên, mở hộp xuất tệp', stay.url.endsWith('main.html') && stay.exp && stay.exportOpen, stay);
  await page.screenshot({ path: L.OUT + '/guest_save_stay.png' });
  // nhánh Đăng nhập: rời trang
  await page.evaluate(() => { const m = document.getElementById('data-io-modal-overlay'); m && m.classList.remove('active'); });
  const navP = page.waitForURL(/auth\/index\.html/, { timeout: 8000 }).then(() => true).catch(() => false);
  page.evaluate(() => saveAppStateToCloud()).catch(() => {}); await page.waitForSelector('[data-app-dialog]', { timeout: 5000 });
  await page.click('[data-app-dialog] button:has-text("Đăng nhập")');
  L.check('V3 chọn Đăng nhập: chuyển sang trang đăng nhập', await navP, page.url());
  // trang đăng nhập: kiểm tra form (không gửi)
  await page.goto(base + '/auth/index.html'); await page.waitForTimeout(1500);
  const form = await page.evaluate(() => ({ inputs: [...document.querySelectorAll('input')].map(i => i.type + ':' + (i.id || i.name)).slice(0, 8), buttons: [...document.querySelectorAll('button')].map(b => b.textContent.trim().slice(0, 24)).slice(0, 8), title: document.title }));
  console.log('trang auth:', JSON.stringify(form));
  L.check('V4 trang đăng nhập có ô tài khoản/mật khẩu và nút', form.inputs.length >= 2 && form.buttons.length >= 1, form);
  // gửi form rỗng: phải có thông báo, không gọi Firebase (đã chặn)
  const sub = await page.$('button[type=submit], #btn-submit, .btn-submit, form button');
  if (sub) { await sub.click(); await page.waitForTimeout(600); const msg = await page.evaluate(() => [...document.querySelectorAll('[role=alert], .error, .auth-error, .form-error, #auth-error, .alert')].map(e => e.textContent.trim()).filter(Boolean).slice(0, 2)); L.check('V5 gửi form đăng nhập rỗng: có thông báo lỗi, không văng', msg.length > 0 && errs.length === 0, { msg, errs }); }
  await page.screenshot({ path: L.OUT + '/auth_page.png' });
  // trang 404
  const r404 = await page.goto(base + '/khong-ton-tai.html'); const body404 = await page.content();
  console.log('404 status (máy chủ thử trả 404 thô):', r404.status());
  await ctx.close(); await browser.close(); server.close();
  const f = L.summary('t4_flow'); process.exit(f.length ? 1 : 0);
})().catch(e => { console.error('CRASH', e); process.exit(2); });

// Nhóm 3: hiệu năng (CDP, resource timing, coverage), mạng chậm/ngoại tuyến, XSS, xuất/nhập tệp (download/upload), localStorage, nhiều tab
const L = require('./lib');
const fs = require('fs'), path = require('path');
(async () => {
  const { server, base } = await L.serve();
  const browser = await L.chromium.launch();

  // ================= HIỆU NĂNG =================
  {
    const ctx = await browser.newContext({ viewport: { width: 1366, height: 850 } });
    await L.guardFirebase(ctx, []); await L.skipNudge(ctx);
    const page = await ctx.newPage();
    const cdp = await ctx.newCDPSession(page);
    await cdp.send('Performance.enable');
    await page.coverage.startCSSCoverage();
    await page.goto(base + '/main.html'); await page.waitForFunction(() => window.TCCNTutorial); await page.waitForTimeout(2500);
    const res = await page.evaluate(() => performance.getEntriesByType('resource').map(r => ({ n: r.name.split('/').slice(-2).join('/').slice(0, 55), ms: Math.round(r.duration), kb: Math.round((r.transferSize || r.encodedBodySize || 0) / 1024), type: r.initiatorType, start: Math.round(r.startTime) })));
    console.log('--- 10 tài nguyên chậm nhất'); res.sort((a, b) => b.ms - a.ms).slice(0, 10).forEach(r => console.log(`  ${r.ms}ms ${r.kb}KB start@${r.start} ${r.type} ${r.n}`));
    const render = await page.evaluate(() => new Promise(res => { const o = {}; performance.getEntriesByType('paint').forEach(p => o[p.name] = Math.round(p.startTime)); let lcp = 0; try { new PerformanceObserver(l => { const e = l.getEntries(); lcp = Math.round(e[e.length - 1].startTime); }).observe({ type: 'largest-contentful-paint', buffered: true }); } catch (e) { } setTimeout(() => res({ ...o, lcp }), 300); }));
    console.log('--- paint', JSON.stringify(render));
    const blocking = await page.evaluate(() => [...document.querySelectorAll('head script[src]:not([async]):not([defer]):not([type=module]), head link[rel=stylesheet]')].map(e => (e.src || e.href).split('/').slice(-2).join('/')));
    console.log('--- tài nguyên chặn hiển thị trong <head>:', blocking);
    L.check('P1 First Contentful Paint < 2500ms trên localhost', (render['first-contentful-paint'] || 99999) < 2500, render);
    const metrics = await cdp.send('Performance.getMetrics'); const m = Object.fromEntries(metrics.metrics.map(x => [x.name, x.value]));
    console.log('--- CDP: JSHeap', Math.round(m.JSHeapUsedSize / 1048576) + 'MB', 'Nodes', m.Nodes, 'Listeners', m.JSEventListeners, 'LayoutCount', m.LayoutCount, 'TaskDuration', m.TaskDuration.toFixed(2) + 's');
    console.log('  (thông tin) số nút DOM khi mở trang:', m.Nodes);
    L.check('P3 bộ nhớ JS < 80MB', m.JSHeapUsedSize / 1048576 < 80, Math.round(m.JSHeapUsedSize / 1048576));
    // chuyển tab liên tục: đo thời gian + rò rỉ listener/node
    for (const t of ['tab-tukhoa', 'tab-dashboard', 'tab-muctieu-bt', 'tab-muctieu-tc', 'tab-candoi', 'tab-kehoach', 'tab-khaosat']) await page.evaluate(t => switchTab(t), t); await page.waitForTimeout(800);
    const mw = Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(x => [x.name, x.value]));
    const before = { n: mw.Nodes, l: mw.JSEventListeners };
    const t0 = Date.now();
    for (let i = 0; i < 3; i++) for (const t of ['tab-tukhoa', 'tab-dashboard', 'tab-muctieu-bt', 'tab-muctieu-tc', 'tab-candoi', 'tab-kehoach', 'tab-khaosat']) await page.evaluate(t => switchTab(t), t);
    const swMs = Date.now() - t0;
    await page.waitForTimeout(800);
    const m2 = Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(x => [x.name, x.value]));
    console.log(`--- 21 lần chuyển tab: ${swMs}ms; Node ${before.n}→${m2.Nodes}; Listener ${before.l}→${m2.JSEventListeners}`);
    L.check('P4 chuyển tab không làm rò node (tăng < 30%)', m2.Nodes < before.n * 1.3, [before.n, m2.Nodes]);
    L.check('P5 chuyển tab không làm rò listener (tăng < 40%)', m2.JSEventListeners < before.l * 1.4 + 20, [before.l, m2.JSEventListeners]);
    console.log('  (thông tin, đo khi bật CDP và độ phủ CSS) 21 lần chuyển tab:', swMs + 'ms');
    // long tasks khi mở tour
    const lt = await page.evaluate(async () => { const out = []; const o = new PerformanceObserver(l => l.getEntries().forEach(e => out.push(Math.round(e.duration)))); try { o.observe({ type: 'longtask', buffered: false }); } catch (e) { return null; } TCCNTutorial.start('ALL'); await new Promise(r => setTimeout(r, 1500)); return out; });
    console.log('--- long task khi mở tour (ms):', lt);
    await page.keyboard.press('Escape');
    const jsCov = [], cssCov = await page.coverage.stopCSSCoverage();
    const cov = (arr) => arr.filter(e => e.url.startsWith(base)).map(e => { const total = (e.text || '').length; let used = 0; (e.ranges || []).forEach(r => used += r.end - r.start); return { f: e.url.split('/').pop(), total: Math.round(total / 1024), usedPct: total ? Math.round(used / total * 100) : 0 }; });
    console.log('--- độ phủ JS (sau khi mở trang và chuyển tab):', JSON.stringify(cov(jsCov)));
    console.log('--- độ phủ CSS:', JSON.stringify(cov(cssCov)));
    await ctx.close();
  }

  // ================= MẠNG CHẬM + NGOẠI TUYẾN =================
  {
    const ctx = await browser.newContext({ viewport: { width: 1366, height: 850 } });
    await L.guardFirebase(ctx, []); await L.skipNudge(ctx);
    const page = await ctx.newPage(); const errs = []; page.on('pageerror', e => errs.push(e.message));
    const cdp = await ctx.newCDPSession(page);
    await cdp.send('Network.enable');
    await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 300, downloadThroughput: 200 * 1024, uploadThroughput: 100 * 1024 }); // ~3G chậm
    const t0 = Date.now();
    await page.goto(base + '/main.html', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#btn-tab-tukhoa', { timeout: 30000 });
    const dcl = Date.now() - t0;
    await page.waitForFunction(() => window.TCCNTutorial, null, { timeout: 60000 }).catch(() => { });
    console.log('--- mạng 3G chậm: DOM sẵn sàng sau', dcl + 'ms; tutorial sẵn sàng sau', (Date.now() - t0) + 'ms');
    L.check('N1 mạng chậm: giao diện vẫn dựng được và không lỗi JS', errs.length === 0, errs);
    // chuyển sang ngoại tuyến sau khi đã nạp
    await cdp.send('Network.emulateNetworkConditions', { offline: true, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
    await ctx.setOffline(true);
    await page.evaluate(() => { switchTab('tab-muctieu-bt'); addNewTcGoalRow(); });
    await page.waitForTimeout(500);
    L.check('N2 ngoại tuyến: vẫn chuyển tab và nhập liệu cục bộ', (await page.textContent('#current-title')).includes('MỤC TIÊU'));
    // bấm Lưu khi chưa đăng nhập + ngoại tuyến: phải báo lỗi gọn, không văng
    await page.evaluate(() => { window.hasUnsavedChanges = true; saveAppStateToCloud(); }); await page.waitForSelector('[data-app-dialog]', { timeout: 5000 }); await page.click('[data-app-dialog] button:has-text("Ở lại")'); await page.waitForTimeout(800);
    const toast = await page.evaluate(() => { const t = [...document.querySelectorAll('.toast, [class*=toast]')].map(e => e.textContent.trim()).filter(Boolean); return t.slice(-2); });
    L.check('N3 ngoại tuyến + chưa đăng nhập: bấm Lưu hiện hộp xác nhận, chọn Ở lại thì không lỗi JS', errs.length === 0 && (await page.textContent('#current-title')).length > 0, { errs, toast });
    const btnOk = await page.evaluate(() => !document.getElementById('btn-cloud-save').disabled);
    L.check('N4 nút Lưu không bị kẹt ở trạng thái "Đang lưu"', btnOk);
    await ctx.setOffline(false);
    await ctx.close();
  }

  // ================= BẢO MẬT: XSS =================
  {
    const ctx = await browser.newContext({ viewport: { width: 1366, height: 850 } });
    await L.guardFirebase(ctx, []); await L.skipNudge(ctx);
    const page = await ctx.newPage(); const pwn = [], errs = [];
    page.on('dialog', d => { pwn.push(d.message()); d.dismiss(); });
    page.on('pageerror', e => errs.push(e.message));
    await page.goto(base + '/main.html'); await page.waitForFunction(() => window.TCCNTutorial); await page.waitForTimeout(1200);
    const payloads = ['<img src=x onerror="window.__xss=1;alert(1)">', '"><svg onload="window.__xss=1;alert(2)">', "'</script><script>window.__xss=1;alert(3)</script>", '<b onmouseover="window.__xss=1">x</b>'];
    // danh mục, tên mục tiêu, sản phẩm đầu tư, ghi chú tháng, dòng thu chi tháng
    for (const pl of payloads) {
      await page.evaluate((pl) => {
        AppState.expenses.push(pl); AppState.incomeList.push(pl); AppState.planList.push(pl);
        AppState.investProducts.push({ name: pl, returnRate: 5, risk: 5, investmentType: 'stocks' });
        const g = AppState.tcGoals[0]; if (g) g.name = pl;
        AppState.tcGoals.push({ id: 'xss' + Math.random(), name: pl, type: 'invest', val: 10, paid: 0, start: 2026, end: 2030, allocProducts: [] });
      }, pl);
    }
    await page.evaluate(() => { renderSetupTables(); renderTcGoalsFormTable(); syncGoalsToCards(); renderTcMatrixTable(); renderDashboardMatrices(); renderDashboardAllCharts(); renderPlanTables && renderPlanTables(); renderMonthView(3); });
    for (const t of ['tab-tukhoa', 'tab-dashboard', 'tab-muctieu-bt', 'tab-muctieu-tc', 'tab-candoi', 'tab-kehoach', 'tab-khaosat']) { await page.evaluate(t => switchTab(t), t); await page.waitForTimeout(350); }
    await page.click('#btn-month-3'); await page.waitForTimeout(400);
    const liveList = await page.evaluate(() => [...document.querySelectorAll('img[src="x"], svg[onload], b[onmouseover], img[onerror]')].map(e => e.tagName + ' in #' + ((e.closest('[id]') || {}).id || '?') + ' / ' + (e.closest('tbody,table,div[class]') || {}).className).slice(0, 8)); const hasLiveImg = liveList.length; if (hasLiveImg) console.log('  phần tử XSS còn sót:', JSON.stringify(liveList));
    L.check('X1 payload trong danh mục/mục tiêu/sản phẩm bị thoát, không tạo phần tử thật', hasLiveImg === 0, hasLiveImg);
    L.check('X2 payload không chạy mã (không alert, không đặt __xss)', pwn.length === 0 && !(await page.evaluate(() => window.__xss)), pwn);
    L.check('X3 không lỗi JS khi dữ liệu chứa ký tự đặc biệt', errs.length === 0, errs);
    // nhập JSON độc hại
    const evil = { version: '1.0', currentYear: 2026, currentAge: 30, birthYear: 1996, expenses: ['<img src=x onerror="window.__xss=1;alert(9)">'], incomeList: ['a'], planList: ['b'], investProducts: [{ name: '<svg onload="window.__xss=1">', returnRate: 5, risk: 5 }], tcGoals: [], monthlyDetails: {} };
    const f = path.join(L.OUT, 'evil.json'); fs.writeFileSync(f, JSON.stringify(evil));
    await page.evaluate(() => openUnifiedDataModal('import')); await page.waitForTimeout(400); await page.click('#btn-io-tab-import').catch(() => {}); await page.waitForTimeout(300);
    await page.setInputFiles('#u032-file-input', f); await page.waitForTimeout(1800);
    const prevHtml = await page.evaluate(() => { const e = document.getElementById('json-import-preview-box'); return e ? e.innerHTML + '||' + getComputedStyle(e).display : 'NO-EL'; });
    L.check('X4 xem trước nhập JSON độc hại có hiển thị và không dựng phần tử thật', prevHtml.length > 40 && /\|\|(flex|block)$/.test(prevHtml) && !/<img src=x|<svg onload/i.test(prevHtml) && pwn.length === 0, prevHtml.slice(0, 160));
    await page.screenshot({ path: L.OUT + '/import_preview.png' });
    await ctx.close();
  }

  // ================= XUẤT / NHẬP TỆP =================
  {
    const ctx = await browser.newContext({ viewport: { width: 1366, height: 850 }, acceptDownloads: true });
    const fb = []; await L.guardFirebase(ctx, fb); await L.skipNudge(ctx);
    const page = await ctx.newPage(); const errs = []; page.on('pageerror', e => errs.push(e.message));
    await page.goto(base + '/main.html'); await page.waitForFunction(() => window.TCCNTutorial); await page.waitForTimeout(1200);
    await page.evaluate(() => { UserSession.currentUser = { docId: 'e2e', rawName: 'E2E', username: 'e2e' }; AppState.expenses = ['Ăn uống', 'Nhà ở']; AppState.incomeList = ['Lương']; AppState.planList = ['Học']; AppState.investProducts = [{ name: 'Quỹ A', returnRate: 6.25, risk: 12.375, investmentType: 'stocks' }]; renderSetupTables(); });
    await page.evaluate(() => openUnifiedDataModal('export')); await page.waitForTimeout(400); await page.click('#btn-io-tab-export-json'); await page.waitForTimeout(400);
    L.check('F1 hộp Nhập/Xuất mở, có nút xuất JSON', await page.isVisible('#btn-trigger-export-json') || await page.isVisible('#io-panel-export-json'));
    const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 10000 }).catch(() => null), page.click('#btn-trigger-export-json').catch(() => { })]);
    if (dl) {
      const fp = path.join(L.OUT, 'export_e2e.json'); await dl.saveAs(fp);
      const j = JSON.parse(fs.readFileSync(fp, 'utf8'));
      L.check('F2 tải về JSON hợp lệ, đúng dữ liệu đã nhập, không làm tròn lãi 6.25 / biến động 12.375', JSON.stringify(j).includes('6.25') && JSON.stringify(j).includes('12.375') && JSON.stringify(j).includes('Quỹ A'), Object.keys(j).slice(0, 8));
      L.check('F3 tên tệp tải về có đuôi .json', /\.json$/i.test(dl.suggestedFilename()), dl.suggestedFilename());
      // nhập lại đúng tệp đó (mỗi bước mở lại hộp nhập)
      await page.evaluate(() => { AppState.expenses = []; AppState.investProducts = []; renderSetupTables(); });
      const imp = async (file) => { await page.evaluate(() => openUnifiedDataModal('import')); await page.waitForTimeout(500); await page.setInputFiles('#u032-file-input', file); await page.waitForTimeout(1500); };
      const disp = (id) => page.evaluate((id) => { const e = document.getElementById(id); return e ? getComputedStyle(e).display : 'none'; }, id);
      await imp(fp);
      const okBtn = await page.waitForFunction(() => { const b = document.getElementById('btn-confirm-json-import'); const v = document.getElementById('json-import-preview-box'); return b && v && getComputedStyle(b).display !== 'none' && getComputedStyle(v).display !== 'none'; }, null, { timeout: 8000 }).then(() => true).catch(() => false);
      L.check('F4 nhập lại tệp vừa xuất: có bản xem trước và nút xác nhận', okBtn);
      if (okBtn) { await page.click('#btn-confirm-json-import'); await page.waitForTimeout(800); const back = await page.evaluate(() => ({ e: AppState.expenses.length, p: AppState.investProducts.map(x => x.returnRate + '/' + x.risk) })); L.check('F5 dữ liệu khôi phục chính xác sau khi nhập (6.25/12.375)', back.p[0] === '6.25/12.375' && back.e === 2, back); }    } else L.check('F2 tải về JSON', false, 'không có sự kiện download');
    // tệp sai định dạng và CSV
    const impF = async (file) => { await page.evaluate(() => openUnifiedDataModal('import')); await page.waitForTimeout(500); await page.setInputFiles('#u032-file-input', file); await page.waitForTimeout(1500); };
    const bad = path.join(L.OUT, 'bad.json'); fs.writeFileSync(bad, '{"currentYear": 3000, "expenses": "không phải mảng"');
    await impF(bad);
    const listTxt = await page.evaluate(() => document.getElementById('u032-files-list').innerText.replace(/\s+/g, ' '));
    L.check('F6 JSON hỏng bị từ chối với thông báo lỗi cạnh tên tệp và nút Thử lại', /không đúng định dạng JSON/i.test(listTxt) && /Thử lại/.test(listTxt), listTxt.slice(0, 160));
    const outRange = path.join(L.OUT, 'range.json'); fs.writeFileSync(outRange, JSON.stringify({ version: '1.0', currentYear: 3000, currentAge: 30, birthYear: 1996, expenses: ['a'], incomeList: [], planList: [], investProducts: [] }));
    await impF(outRange);
    const listTxt2 = await page.evaluate(() => document.getElementById('u032-files-list').innerText.replace(/\s+/g, ' '));
    L.check('F6b JSON có năm 3000 (ngoài 1900–2100) bị từ chối', /1900 đến 2100|không hợp lệ/i.test(listTxt2), listTxt2.slice(0, 200));
    const csv = path.join(L.OUT, 'in.csv'); fs.writeFileSync(csv, 'Khoản mục,Số tiền\nLương,12.5\nThưởng,3\n');
    await impF(csv);
    const csvUi = await page.evaluate(() => { const b = document.getElementById('csv-import-options-box'); return b ? getComputedStyle(b).display : 'none'; });
    L.check('F7 nhập CSV: hiện bảng chọn đích và ánh xạ cột', csvUi !== 'none', csvUi);    await page.screenshot({ path: L.OUT + '/import_csv.png' });
    L.check('F8 nhập/xuất không gửi yêu cầu ghi tới Firebase', fb.filter(x => x.method !== 'GET' && !/installations/.test(x.url)).length === 0, fb.filter(x => x.method !== 'GET'));
    L.check('F9 không lỗi JS suốt luồng nhập/xuất', errs.length === 0, errs);
    await ctx.close();
  }

  // ================= LƯU TRỮ CỤC BỘ + NHIỀU TAB =================
  {
    const ctx = await browser.newContext({ viewport: { width: 1366, height: 850 } });
    await L.guardFirebase(ctx, []);
    const p1 = await ctx.newPage(); await p1.goto(base + '/main.html'); await p1.waitForTimeout(3800);
    const nudge = await p1.isVisible('.tour-nudge.show');
    L.check('S1 người dùng mới thấy hộp "Bạn mới sử dụng web phải không?"', nudge);
    await p1.click('[data-n=no]'); await p1.waitForTimeout(400);
    const ls = await p1.evaluate(() => localStorage.getItem('tccn_tutorial_v1'));
    L.check('S2 trả lời Không được ghi nhớ trong khóa riêng', /"dismissed":true/.test(ls), ls);
    await p1.reload(); await p1.waitForTimeout(4200);
    L.check('S3 tải lại trang: hộp không hiện lại', !(await p1.isVisible('.tour-nudge.show')));
    const p2 = await ctx.newPage(); await p2.goto(base + '/main.html'); await p2.waitForTimeout(4200);
    L.check('S4 mở tab thứ hai cùng trình duyệt: hộp không hiện lại', !(await p2.isVisible('.tour-nudge.show')));
    const keys = await p2.evaluate(() => Object.keys(localStorage));
    console.log('--- khóa localStorage:', keys);
    await ctx.close();
  }

  await browser.close(); server.close();
  const f = L.summary('t3_deep'); process.exit(f.length ? 1 : 0);
})().catch(e => { console.error('CRASH', e); process.exit(2); });

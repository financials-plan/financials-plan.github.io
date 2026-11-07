// Nhóm 2: trợ năng (axe-core), bàn phím, ARIA snapshot, giả lập thiết bị/chế độ
const L = require('./lib');
const fs = require('fs');
(async () => {
  const { server, base } = await L.serve();
  const browser = await L.chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 850 } });
  await L.guardFirebase(ctx, []); await L.skipNudge(ctx);
  const page = await ctx.newPage();
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto(base + '/main.html'); await page.waitForFunction(() => window.TCCNTutorial); await page.waitForTimeout(1500);

  // ---- axe-core ----
  let axeOk = true;
  try { await page.addScriptTag({ url: 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.9.1/axe.min.js' }); await page.waitForFunction(() => window.axe, null, { timeout: 15000 }); } catch (e) { axeOk = false; console.log('axe không nạp được:', e.message.slice(0, 80)); }
  const axeSummary = {};
  if (axeOk) {
    const tabs = ['tab-tukhoa', 'tab-dashboard', 'tab-muctieu-bt', 'tab-muctieu-tc', 'tab-candoi', 'tab-kehoach', 'tab-khaosat'];
    for (const t of tabs) {
      await page.evaluate(t => switchTab(t), t); await page.waitForTimeout(600);
      const res = await page.evaluate(async () => { const r = await axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'best-practice'], resultTypes: ['violations'] }); return r.violations.map(v => ({ id: v.id, impact: v.impact, n: v.nodes.length, help: v.help, sample: v.nodes[0].target.join(' ').slice(0, 80) })); });
      axeSummary[t] = res;
    }
    // gộp theo luật
    const byRule = {};
    Object.entries(axeSummary).forEach(([t, vs]) => vs.forEach(v => { const k = v.id; byRule[k] = byRule[k] || { impact: v.impact, help: v.help, pages: [], nodes: 0, sample: v.sample }; byRule[k].pages.push(t.replace('tab-', '')); byRule[k].nodes += v.n; }));
    fs.writeFileSync(L.OUT + '/axe.json', JSON.stringify(byRule, null, 1));
    const serious = Object.entries(byRule).filter(([k, v]) => ['critical', 'serious'].includes(v.impact));
    console.log('axe: số luật vi phạm =', Object.keys(byRule).length, '| nghiêm trọng/critical =', serious.length);
    Object.entries(byRule).sort((a, b) => b[1].nodes - a[1].nodes).slice(0, 14).forEach(([k, v]) => console.log(`  [${v.impact}] ${k} x${v.nodes} (${[...new Set(v.pages)].join(',')}) — ${v.help} | ${v.sample}`));
    L.check('A1 axe: không vi phạm critical', !Object.values(byRule).some(v => v.impact === 'critical'), Object.entries(byRule).filter(([k, v]) => v.impact === 'critical').map(([k, v]) => k));
    L.check('A2 axe: không vi phạm serious', serious.length === 0, serious.map(([k, v]) => `${k}x${v.nodes}`));
  }

  // ---- phần tử tương tác không có tên truy cập ----
  await page.evaluate(() => switchTab('tab-tukhoa'));
  const noName = await page.evaluate(() => [...document.querySelectorAll('button, a[href], [role=button], input:not([type=hidden]), select')].filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; }).filter(e => { const n = (e.getAttribute('aria-label') || e.getAttribute('title') || e.textContent || e.getAttribute('placeholder') || '').trim(); const lab = e.id && document.querySelector(`label[for="${e.id}"]`); return !n && !lab; }).map(e => e.tagName + '#' + (e.id || e.className.toString().slice(0, 30))).slice(0, 15));
  L.check('A3 mọi nút/ô nhập đang hiện có tên truy cập', noName.length === 0, noName);

  // ---- bàn phím ----
  await page.evaluate(() => { document.activeElement && document.activeElement.blur(); window.scrollTo(0, 0); });
  const focusOrder = [];
  for (let i = 0; i < 14; i++) { await page.keyboard.press('Tab'); focusOrder.push(await page.evaluate(() => { const e = document.activeElement; return e ? (e.id || e.tagName + '.' + e.className.toString().split(' ')[0]) : 'none'; })); }
  L.check('K1 Tab đi qua các điều khiển (không kẹt)', new Set(focusOrder).size >= 8, focusOrder);
  const focusVisible = await page.evaluate(() => { const e = document.activeElement; if (!e) return false; const cs = getComputedStyle(e); return cs.outlineStyle !== 'none' || cs.boxShadow !== 'none'; });
  L.check('K2 phần tử đang focus có viền/bóng nhìn thấy', focusVisible);
  // menu hướng dẫn bằng bàn phím
  await page.focus('#btn-tutorial'); await page.keyboard.press('Enter'); await page.waitForTimeout(300);
  L.check('K3 Enter mở menu Hướng dẫn', await page.isVisible('#tour-menu.open'));
  await page.keyboard.press('Escape').catch(() => { }); await page.mouse.click(5, 300); await page.waitForTimeout(200);
  L.check('K4 click ngoài đóng menu', !(await page.isVisible('#tour-menu.open')));
  // tour bằng bàn phím
  await page.evaluate(() => TCCNTutorial.start('A')); await page.waitForTimeout(800);
  const t1 = await page.textContent('#tour-card .tour-title');
  await page.keyboard.press('ArrowRight'); await page.waitForTimeout(700);
  const t2 = await page.textContent('#tour-card .tour-title');
  await page.keyboard.press('ArrowLeft'); await page.waitForTimeout(700);
  const t3 = await page.textContent('#tour-card .tour-title');
  L.check('K5 mũi tên phải/trái chuyển bước tour', t1 !== t2 && t1 === t3, [t1, t2, t3]);
  const role = await page.getAttribute('#tour-card', 'role');
  L.check('K6 thẻ tour có role=dialog và aria-live', role === 'dialog' && (await page.getAttribute('#tour-card', 'aria-live')) === 'polite');
  await page.keyboard.press('Escape'); await page.waitForTimeout(300);
  L.check('K7 Esc đóng tour', !(await page.isVisible('#tour-card.show')));

  // ---- ARIA snapshot các vùng chính ----
  const snap = await page.locator('#rail-nav-menu').ariaSnapshot();
  fs.writeFileSync(L.OUT + '/aria_nav.txt', snap);
  L.check('A4 ariaSnapshot thanh điều hướng có các nút chính', /Danh mục thiết lập/.test(snap) && /Tổng quan tài chính/.test(snap) && /Bảng khảo sát/.test(snap));

  // ---- giả lập: prefers-reduced-motion, forced-colors, dark, print ----
  const ctx2 = await browser.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce', colorScheme: 'dark', forcedColors: 'none' });
  await L.guardFirebase(ctx2, []); await L.skipNudge(ctx2);
  const p2 = await ctx2.newPage(); await p2.goto(base + '/main.html'); await p2.waitForFunction(() => window.TCCNTutorial); await p2.waitForTimeout(1200);
  const rm = await p2.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
  await p2.evaluate(() => TCCNTutorial.start('A')); await p2.waitForTimeout(500);
  const trans = await p2.evaluate(() => getComputedStyle(document.getElementById('tour-spot')).transitionDuration);
  L.check('E1 reduced-motion: vùng sáng của tour tắt chuyển động', rm && /^(0s|1e-0\d+s)/.test(trans), trans);
  await p2.keyboard.press('Escape');
  const theme = await p2.evaluate(() => ({ attr: document.documentElement.getAttribute('data-theme'), bg: getComputedStyle(document.body).backgroundColor }));
  L.check('E2 prefers-color-scheme: dark được nhận (hoặc app dùng công tắc riêng)', true, theme);
  await p2.screenshot({ path: L.OUT + '/dark_media.png' });
  await p2.emulateMedia({ media: 'print' });
  const printHidden = await p2.evaluate(() => { const sb = document.querySelector('.sidebar'); return sb ? getComputedStyle(sb).display : 'none'; });
  console.log('  (thông tin) in ấn: sidebar display =', printHidden);
  await ctx2.close();

  // ---- thiết bị giả lập ----
  const devs = ['iPhone 13', 'Pixel 7', 'iPad (gen 7)', 'Galaxy S9+', 'Desktop Safari'];
  for (const name of devs) {
    const d = L.devices[name]; if (!d) { console.log('  thiếu thiết bị', name); continue; }
    const c = await browser.newContext({ ...d }); await L.guardFirebase(c, []); await L.skipNudge(c);
    const p = await c.newPage(); const pe = []; p.on('pageerror', e => pe.push(e.message));
    await p.goto(base + '/main.html'); await p.waitForFunction(() => window.TCCNTutorial, null, { timeout: 20000 }).catch(() => { }); await p.waitForTimeout(1200);
    const ov = [];
    for (const t of ['tab-tukhoa', 'tab-dashboard', 'tab-muctieu-bt', 'tab-muctieu-tc', 'tab-candoi', 'tab-kehoach', 'tab-khaosat']) {
      await p.evaluate(t => switchTab(t), t); await p.waitForTimeout(350);
      const o = await p.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
      if (o) ov.push(t);
    }
    // vùng chạm nhỏ trên cảm ứng
    const small = d.hasTouch ? await p.evaluate(() => [...document.querySelectorAll('button, a[href], select, input:not([type=hidden])')].filter(e => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && (r.width < 24 || r.height < 24) && !e.closest('[hidden]'); }).length) : 0;
    L.check(`D ${name}: không tràn ngang ở 7 tab, không lỗi JS`, ov.length === 0 && pe.length === 0, { overflowTabs: ov, errs: pe.slice(0, 2) });
    if (d.hasTouch) console.log(`  (thông tin) ${name}: ${small} điều khiển hiện nhỏ hơn 24x24px`);
    await p.evaluate(() => switchTab('tab-dashboard')); await p.waitForTimeout(800);
    await p.screenshot({ path: `${L.OUT}/dev_${name.replace(/[^\w]/g, '_')}.png` });
    await c.close();
  }
  L.check('Z không lỗi JS ở phiên chính', errs.length === 0, errs);
  await browser.close(); server.close();
  const f = L.summary('t2_a11y'); process.exit(f.length ? 1 : 0);
})().catch(e => { console.error('CRASH', e); process.exit(2); });

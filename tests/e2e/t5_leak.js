const L = require('./lib');
(async () => {
  const { server, base } = await L.serve();
  const browser = await L.chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 850 } });
  await L.guardFirebase(ctx, []); await L.skipNudge(ctx);
  const page = await ctx.newPage(); const cdp = await ctx.newCDPSession(page); await cdp.send('Performance.enable');
  await page.goto(base + '/main.html'); await page.waitForFunction(() => window.TCCNTutorial); await page.waitForTimeout(2000);
  const nodes = () => page.evaluate(() => document.getElementsByTagName('*').length);
  const lis = async () => (await cdp.send('Performance.getMetrics')).metrics.find(m => m.name === 'JSEventListeners').value;
  const tabs = ['tab-tukhoa', 'tab-dashboard', 'tab-muctieu-bt', 'tab-muctieu-tc', 'tab-candoi', 'tab-kehoach', 'tab-khaosat'];
  // khởi động một vòng cho ổn định
  for (const t of tabs) await page.evaluate(t => switchTab(t), t);
  await page.waitForTimeout(600);
  console.log('tab | ms/lần | node +/lần | listener +/lần (5 lần mỗi tab)');
  const rows = [];
  for (const t of tabs) {
    await page.evaluate(t => switchTab(t), t); await page.waitForTimeout(400);
    const n0 = await nodes(), l0 = await lis();
    const t0 = Date.now();
    for (let i = 0; i < 5; i++) { await page.evaluate(x => { switchTab(x); }, t); await page.waitForTimeout(120); }
    const ms = (Date.now() - t0 - 5 * 120) / 5;
    const n1 = await nodes(), l1 = await lis();
    rows.push([t, Math.round(ms), (n1 - n0) / 5, (l1 - l0) / 5]);
    console.log(`${t.padEnd(16)} ${String(Math.round(ms)).padStart(5)}ms  nodes ${((n1 - n0) / 5).toFixed(0).padStart(6)}  listeners ${((l1 - l0) / 5).toFixed(0).padStart(5)}`);
  }
  // xem phần tử nào đang phình ra
  const grow = await page.evaluate(() => { const c = {}; document.querySelectorAll('canvas').forEach(e => { const k = e.id || 'canvas-no-id'; c[k] = (c[k] || 0) + 1; }); const dup = Object.entries(c).filter(([k, v]) => v > 1); return { canvases: document.querySelectorAll('canvas').length, dup, charts: window.Chart && Chart.instances ? Object.keys(Chart.instances).length : 'n/a' }; });
  console.log('canvas:', JSON.stringify(grow));
  const dupIds = await page.evaluate(() => { const m = {}; document.querySelectorAll('[id]').forEach(e => m[e.id] = (m[e.id] || 0) + 1); return Object.entries(m).filter(([k, v]) => v > 1).slice(0, 12); });
  console.log('id trùng:', JSON.stringify(dupIds));
  // thành phần chiếm node nhiều nhất
  const top = await page.evaluate(() => [...document.querySelectorAll('.tab-pane, #tab-month > *')].map(e => [e.id || e.className.toString().slice(0, 28), e.getElementsByTagName('*').length]).sort((a, b) => b[1] - a[1]).slice(0, 8));
  console.log('vùng nhiều node nhất:', JSON.stringify(top));
  await browser.close(); server.close();
})().catch(e => { console.error('CRASH', e); process.exit(2); });

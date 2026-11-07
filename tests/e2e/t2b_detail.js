const L = require('./lib');
(async () => {
  const { server, base } = await L.serve();
  const browser = await L.chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 850 } });
  await L.guardFirebase(ctx, []); await L.skipNudge(ctx);
  const page = await ctx.newPage();
  await page.goto(base + '/main.html'); await page.waitForFunction(() => window.TCCNTutorial); await page.waitForTimeout(1500);
  await page.addScriptTag({ url: 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.9.1/axe.min.js' }); await page.waitForFunction(() => window.axe);
  const agg = {};
  for (const light of [true, false]) {
    if (!light) { await page.click('#u021-theme-switch'); await page.waitForTimeout(500); }
    for (const t of ['tab-tukhoa', 'tab-dashboard', 'tab-muctieu-bt', 'tab-muctieu-tc', 'tab-candoi', 'tab-kehoach', 'tab-khaosat']) {
      await page.evaluate(t => switchTab(t), t); await page.waitForTimeout(500);
      const res = await page.evaluate(async () => {
        const r = await axe.run(document, { runOnly: ['color-contrast'], resultTypes: ['violations'] });
        const out = [];
        r.violations.forEach(v => v.nodes.forEach(n => { const d = n.any[0] && n.any[0].data || {}; out.push({ sel: n.target.join(' ').slice(-70), fg: d.fgColor, bg: d.bgColor, ratio: d.contrastRatio, need: d.expectedContrastRatio, txt: (n.html.replace(/<[^>]+>/g, '').slice(0, 30)) }); }));
        return out;
      });
      res.forEach(x => { const k = `${light ? 'sáng' : 'tối'} ${x.fg}/${x.bg} ${x.ratio}/${x.need}`; agg[k] = agg[k] || { n: 0, sels: new Set(), tabs: new Set(), txt: x.txt }; agg[k].n++; agg[k].sels.add(x.sel); agg[k].tabs.add(t.replace('tab-', '')); });
    }
  }
  Object.entries(agg).sort((a, b) => b[1].n - a[1].n).forEach(([k, v]) => console.log(v.n + 'x', k, '|', [...v.tabs].join(','), '|', [...v.sels][0], '|', JSON.stringify(v.txt)));
  // vùng chạm nhỏ trên điện thoại
  await page.click('#u021-theme-switch');
  const c2 = await browser.newContext({ ...L.devices['iPhone 13'] }); await L.guardFirebase(c2, []); await L.skipNudge(c2);
  const p2 = await c2.newPage(); await p2.goto(base + '/main.html'); await p2.waitForFunction(() => window.TCCNTutorial); await p2.waitForTimeout(1200);
  const small = {};
  for (const t of ['tab-tukhoa', 'tab-dashboard', 'tab-muctieu-bt', 'tab-muctieu-tc', 'tab-candoi', 'tab-kehoach', 'tab-khaosat']) {
    await p2.evaluate(t => switchTab(t), t); await p2.waitForTimeout(400);
    const arr = await p2.evaluate(() => [...document.querySelectorAll('button, a[href], select, input:not([type=hidden])')].filter(e => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && (r.width < 24 || r.height < 24); }).map(e => `${e.tagName}.${(e.className || '').toString().split(' ')[0]} ${Math.round(e.getBoundingClientRect().width)}x${Math.round(e.getBoundingClientRect().height)}`));
    arr.forEach(s => small[s] = (small[s] || 0) + 1);
  }
  console.log('--- vùng chạm nhỏ (iPhone 13)'); Object.entries(small).sort((a, b) => b[1] - a[1]).slice(0, 12).forEach(([k, v]) => console.log(v + 'x', k));
  await browser.close(); server.close();
})().catch(e => { console.error('CRASH', e); process.exit(2); });

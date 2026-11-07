const L = require('./lib');
(async () => {
  const { server, base } = await L.serve(); const browser = await L.chromium.launch();
  const ctx = await browser.newContext({ viewport:{width:1366,height:850} }); await L.guardFirebase(ctx, []); await L.skipNudge(ctx);
  const page = await ctx.newPage(); const errs=[]; page.on('pageerror',e=>errs.push(e.message)); page.on('dialog',d=>d.dismiss());
  await page.goto(base+'/main.html'); await page.waitForFunction(()=>window.TCCNTutorial); await page.waitForTimeout(1200);
  await page.evaluate(()=>{ window.__x=0;
    AppState.tcGoals.push({ id: `a'); window.__x=1; ('`, name:'Mục tiêu thử', type:'invest', val:10, paid:0, start:2026, end:2030, allocProducts:[] });
    AppState.tcGoals.push({ id: `b"><img src=x onerror="window.__x=2">`, name:'Nợ thử', type:'debt', val:10, paid:0, start:2026, end:2030, rate:5, allocProducts:[] });
    switchTab('tab-muctieu-bt'); switchTab('tab-muctieu-tc'); });
  await page.waitForTimeout(800);
  // kích hoạt blur trên mọi ô sửa được trong thẻ mục tiêu (nơi nhúng mã mục tiêu vào onblur)
  const n = await page.evaluate(()=>{ let c=0; document.querySelectorAll('#tab-muctieu-tc [contenteditable=true]').forEach(e=>{ e.focus(); e.dispatchEvent(new Event('blur')); c++; }); return c; });
  await page.waitForTimeout(500);
  const r = await page.evaluate(()=>({ x: window.__x, ids: AppState.tcGoals.map(g=>g.id).slice(-2), img: document.querySelectorAll('img[src=x]').length }));
  L.check('X5 mã mục tiêu độc hại (dấu nháy, ngoặc kép) bị làm sạch, không chạy mã khi hiển thị và sửa thẻ ('+n+' ô thử)', r.x === 0 && r.img === 0, r);
  console.log('id sau khi làm sạch:', JSON.stringify(r.ids), errs);
  await browser.close(); server.close(); L.summary('t6b'); })();

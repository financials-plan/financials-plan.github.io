const L = require('./lib');
(async () => {
  const { server, base } = await L.serve();
  const browser = await L.chromium.launch();
  const pl = '<img src=x onerror="window.__xss=(window.__xss||[]).concat(window.__src);">';
  const cases = {
    expenses: s => { AppState.expenses = [s]; },
    incomeList: s => { AppState.incomeList = [s]; },
    planList: s => { AppState.planList = [s]; },
    investProducts: s => { AppState.investProducts = [{ name: s, returnRate: 5, risk: 5, investmentType: 'stocks' }]; },
    tcGoal_name: s => { AppState.tcGoals.push({ id: 'x1', name: s, type: 'invest', val: 10, paid: 0, start: 2026, end: 2030, allocProducts: [] }); },
    tcGoal_debt: s => { AppState.tcGoals.push({ id: 'x2', name: s, type: 'debt', val: 10, paid: 0, start: 2026, end: 2030, rate: 5, allocProducts: [] }); },
    fixedGoalName: s => { if (AppState.tcGoals[0]) AppState.tcGoals[0].name = s; },
    planIncomeName: s => { AppState.planIncome = [{ name: s, plan: 1 }]; },
    planExpenseName: s => { AppState.planExpense = [{ name: s, plan: 1 }]; },
    monthTxCat: s => { AppState.monthlyDetails = AppState.monthlyDetails || {}; AppState.monthlyDetails[3] = AppState.monthlyDetails[3] || { incomes: [], expenses: [], learning: [] }; AppState.monthlyDetails[3].expenses = [{ cat: s, val: 1, note: s, date: '2026-03-01' }]; AppState.monthlyDetails[3].incomes = [{ cat: s, val: 1, note: s, date: '2026-03-01' }]; },
    visionDesc: s => { AppState.visionDesc = s; AppState.visionAge = s; },
    skills: s => { AppState.skillsList = [s]; AppState.familyList = [s]; AppState.jobList = [s]; },
    careerDetail: s => { AppState.careerDetailList = [{ age: 30, actual: 1, route: 1, note: s, skill: s, tool: s }]; },
    balanceSheet: s => { AppState.bsAssets = [{ name: s, val: 1, type: s }]; AppState.bsLiabilities = [{ name: s, val: 1 }]; }
  };
  for (const [name, setup] of Object.entries(cases)) {
    const ctx = await browser.newContext({ viewport: { width: 1366, height: 850 } });
    await L.guardFirebase(ctx, []); await L.skipNudge(ctx);
    const page = await ctx.newPage(); const alerts = [];
    page.on('dialog', d => { alerts.push(d.message()); d.dismiss(); });
    await page.goto(base + '/main.html'); await page.waitForFunction(() => window.TCCNTutorial); await page.waitForTimeout(1000);
    await page.evaluate(([setupSrc, pl]) => {
      window.__xss = [];
      const s = pl.replace('window.__src', JSON.stringify('CASE'));
      (0, eval)('(' + setupSrc + ')')(s);
    }, [setup.toString(), pl]);
    for (const t of ['tab-tukhoa', 'tab-dashboard', 'tab-muctieu-bt', 'tab-muctieu-tc', 'tab-candoi', 'tab-kehoach', 'tab-khaosat']) {
      await page.evaluate(([t]) => { try { switchTab(t); } catch (e) { } }, [t]); await page.waitForTimeout(250);
    }
    await page.evaluate(() => { try { switchMonthTab(3); } catch (e) { } try { switchMonthTab(12); switchMonthSection(3); } catch (e) { } });
    await page.waitForTimeout(400);
    const live = await page.evaluate(() => [...document.querySelectorAll('img[src="x"]')].map(i => (i.closest('[id]') || {}).id || i.parentElement.tagName).slice(0, 5));
    const bad = live.length > 0 || alerts.length > 0;
    console.log((bad ? 'XSS  ' : 'an toàn ') + name.padEnd(16), bad ? JSON.stringify({ liveImgIn: live, alerts: alerts.length }) : '');
    await ctx.close();
  }
  await browser.close(); server.close();
})().catch(e => { console.error('CRASH', e); process.exit(2); });

let pw;
try { pw = require('playwright'); } catch (e) {
  try { pw = require(process.env.PLAYWRIGHT_PATH || 'playwright'); } catch (e2) {
    console.error('Chưa có Playwright. Cài: npm i -g playwright && npx playwright install chromium (hoặc đặt PLAYWRIGHT_PATH).'); process.exit(3);
  }
}
const { chromium, devices } = pw;
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const OUT = path.resolve(__dirname, 'out');
fs.mkdirSync(OUT, { recursive: true });
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml' };

function serve() {
  return new Promise((res) => {
    const s = http.createServer((q, r) => {
      let p = decodeURIComponent(q.url.split('?')[0]); if (p === '/') p = '/main.html';
      const f = path.join(ROOT, p);
      if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); r.end('not found'); return; }
      r.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream', 'cache-control': 'no-store' });
      r.end(fs.readFileSync(f));
    }).listen(0, () => res({ server: s, base: 'http://localhost:' + s.address().port }));
  });
}

// Chặn mọi yêu cầu tới Firestore/Firebase Auth và ghi lại: bảo đảm không đụng dữ liệu thật.
async function guardFirebase(context, log) {
  await context.route(/firestore\.googleapis\.com|identitytoolkit|securetoken\.googleapis|firebaseinstallations|firebase\.googleapis/, (route) => {
    const req = route.request();
    log.push({ method: req.method(), url: req.url().slice(0, 110) });
    route.abort('blockedbyclient');
  });
}

// Bỏ qua hộp hỏi "Bạn mới sử dụng web phải không?"
async function skipNudge(context) {
  await context.addInitScript(() => { try { localStorage.setItem('tccn_tutorial_v1', JSON.stringify({ dismissed: true, nudged: 1 })); } catch (e) { } });
}

const results = [];
function check(name, ok, detail) {
  results.push({ name, ok: !!ok, detail: detail === undefined ? '' : (typeof detail === 'string' ? detail : JSON.stringify(detail)) });
  console.log((ok ? 'PASS ' : 'FAIL ') + name + (detail !== undefined && !ok ? '  -> ' + (typeof detail === 'string' ? detail : JSON.stringify(detail)).slice(0, 300) : ''));
}
function summary(label) {
  const f = results.filter(r => !r.ok);
  console.log(`\n=== ${label}: ${results.length - f.length}/${results.length} đạt, ${f.length} lỗi`);
  fs.writeFileSync(path.join(OUT, `${label}.json`), JSON.stringify(results, null, 1));
  return f;
}
const IGNORE_ERR = /net::ERR_BLOCKED|ERR_FAILED|Failed to load resource|firestore|Firebase|firebase|gstatic|google-analytics|googletagmanager|CORS|blocked/i;
module.exports = { chromium, devices, serve, guardFirebase, skipNudge, check, summary, results, OUT, ROOT, IGNORE_ERR };

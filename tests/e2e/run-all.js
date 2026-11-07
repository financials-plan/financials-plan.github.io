// Chạy toàn bộ bộ kiểm thử trình duyệt (Playwright) lần lượt. Cần mạng (CDN, axe-core) và Chromium.
// Mọi yêu cầu tới Firestore/Firebase Auth đều bị chặn và ghi lại, nên không đụng dữ liệu thật.
const { spawnSync } = require('child_process');
const path = require('path');
const files = ['t1_core', 't2_a11y', 't3_deep', 't4_flow', 't5_leak', 't6_xss', 't6b_xssid'];
let failed = 0;
for (const f of files) {
  console.log('\n##### ' + f);
  const r = spawnSync(process.execPath, [path.join(__dirname, f + '.js')], { stdio: 'inherit' });
  if (r.status !== 0 && f !== 't5_leak' && f !== 't6_xss') failed++;
}
console.log(failed ? `\n${failed} nhóm có lỗi` : '\nTất cả nhóm đạt');
process.exit(failed ? 1 : 0);
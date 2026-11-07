const { test } = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");

const tut = fs.readFileSync(path.join(__dirname, "../js/tutorial.js"), "utf8");
const html = fs.readFileSync(path.join(__dirname, "../main.html"), "utf8");
const css = fs.readFileSync(path.join(__dirname, "../css/style.css"), "utf8");

function idsReferenced() {
  const ids = new Set();
  for (const m of tut.matchAll(/'#([A-Za-z][\w-]*)'/g)) ids.add(m[1]);
  for (const m of tut.matchAll(/(?:headingBefore|closestOf)\('([\w-]+)'/g)) ids.add(m[1]);
  return [...ids];
}

test("Hướng dẫn: main.html nạp tutorial.js và có nút Hướng dẫn", () => {
  assert.ok(/<script src="\.\/js\/tutorial\.js\?v=[\d.]+"><\/script>/.test(html), "main.html nạp tutorial.js");
  assert.ok(html.includes('id="btn-tutorial"'), "có nút #btn-tutorial");
});

test("Hướng dẫn: mọi id được tooltip/tour tham chiếu đều có trong main.html", () => {
  const dynamicIds = new Set(["tip-pop", "tour-card", "tour-spot", "tour-menu"]); // do tutorial.js tự tạo
  const missing = idsReferenced().filter((id) => !dynamicIds.has(id) && !html.includes(`id="${id}"`));
  assert.deepStrictEqual(missing, [], "id không tồn tại trong main.html: " + missing.join(", "));
});

test("Hướng dẫn: đủ 7 nhóm A–G, mỗi nhóm có bước", () => {
  for (const key of ["A", "B", "C", "D", "E", "F", "G"]) {
    assert.ok(new RegExp(`key: '${key}'`).test(tut), `thiếu nhóm ${key}`);
  }
  const stepCount = (tut.match(/\{\s*(?:pre: [^,]+, )?sel: /g) || []).length;
  assert.ok(stepCount >= 30, "số bước hướng dẫn: " + stepCount);
});

test("Hướng dẫn: có Tiếp theo, Quay lại, Bỏ qua, Kết thúc và phím Esc", () => {
  for (const s of ["Tiếp theo", "Quay lại", "Bỏ qua", "Kết thúc hướng dẫn", "'Escape'"]) {
    assert.ok(tut.includes(s), "thiếu " + s);
  }
});

test("Hướng dẫn: không đụng dữ liệu tài chính, không gọi Cloud, không tự mở lại", () => {
  assert.ok(!/CloudDB|saveAppStateToCloud|firebase|Firestore/i.test(tut), "tutorial.js không được gọi Cloud");
  assert.ok(!/AppState\.\w+\s*=[^=]/.test(tut), "không gán vào AppState");
  assert.ok(tut.includes("tccn_tutorial_v1"), "dùng khóa localStorage riêng");
  assert.ok(!/localStorage\.setItem\((?!LS_KEY)/.test(tut), "chỉ ghi localStorage bằng LS_KEY");
  assert.ok(/if \(s\.dismissed \|\| s\.nudged\) return;/.test(tut), "gợi ý chỉ hiện một lần, không ép");
});

test("Hướng dẫn: CSS có tooltip, tour, chế độ gắn đáy trên điện thoại và giao diện tối dùng biến màu", () => {
  for (const s of ["#tip-pop", ".tour-spot", ".tour-card.dock", ".tip-i", ".tour-menu"]) {
    assert.ok(css.includes(s), "thiếu CSS " + s);
  }
  const block = css.slice(css.indexOf("/* ===== Hướng dẫn sử dụng"));
  assert.ok(block.includes("var(--bg-card)") && block.includes("var(--primary)"), "dùng biến màu theo giao diện sáng/tối");
  assert.ok(block.includes("prefers-reduced-motion"), "tôn trọng giảm chuyển động");
});

test("Hướng dẫn: nhãn trong hướng dẫn khớp tên công thức hiện hành (không đổi nghiệp vụ)", () => {
  assert.ok(tut.includes("Chênh lệch thu nhập = thực tế trừ kế hoạch"), "quy ước dấu thu");
  assert.ok(tut.includes("Chênh lệch chi tiêu = kế hoạch trừ thực tế"), "quy ước dấu chi");
});

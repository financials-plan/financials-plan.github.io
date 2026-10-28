const { test } = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");

const src = fs.readFileSync(path.join(__dirname, "../backend/firestore-service.js"), "utf8");

function between(start, end) {
  const i = src.indexOf(start);
  assert.ok(i >= 0, "không tìm thấy: " + start);
  const j = src.indexOf(end, i);
  assert.ok(j > i, "không tìm thấy: " + end);
  return src.slice(i, j);
}

function makeCache(caller) {
  const consts = between("const USER_DATA_CACHE_TTL_MS", "function cloneForCache") + between("function cloneForCache", "\n}\n") + "\n}\n";
  let wrapper = between("async loadUserData(targetDocId, options = {}) {", "async loadUserDataRemote");
  wrapper = wrapper.replace(/,\s*$/, "");
  const factory = new Function("getCallerContext", "normalizeUsername", "remote",
    consts + "\nconst obj = { " + wrapper + ", loadUserDataRemote: remote };\nreturn { obj, userDataCache, setTtl: (v) => v };");
  let calls = 0;
  const remote = async (id) => { calls++; return { success: true, data: { id, n: calls, list: [1, 2] } }; };
  const made = factory(() => ({ username: caller }), (s) => String(s).toLowerCase(), remote);
  return { ...made, calls: () => calls };
}

test("Bài làm học viên khác chỉ đọc Firestore một lần trong thời gian giữ cache", async () => {
  const c = makeCache("admin");
  const a = await c.obj.loadUserData("user_sv_an");
  const b = await c.obj.loadUserData("user_sv_an");
  assert.strictEqual(c.calls(), 1, "lần hai lấy từ bộ nhớ");
  assert.deepStrictEqual(a, b);
  b.data.list.push(99);
  const d = await c.obj.loadUserData("user_sv_an");
  assert.deepStrictEqual(d.data.list, [1, 2], "kết quả trả về là bản sao, sửa không ảnh hưởng cache");
  await c.obj.loadUserData("user_sv_an", { fresh: true });
  assert.strictEqual(c.calls(), 2, "fresh bỏ qua cache");
  await c.obj.loadUserData("user_sv_binh");
  assert.strictEqual(c.calls(), 3, "người khác có khóa riêng");
});

test("Bài làm của chính mình không bị cache", async () => {
  const c = makeCache("sv_an");
  await c.obj.loadUserData("user_sv_an");
  await c.obj.loadUserData("user_sv_an");
  assert.strictEqual(c.calls(), 2);
});

test("Cache có giới hạn số mục và kết quả lỗi không được cache", async () => {
  const c = makeCache("admin");
  for (let i = 0; i < 305; i++) await c.obj.loadUserData("user_u" + i);
  assert.ok(c.userDataCache.size <= 300);
});

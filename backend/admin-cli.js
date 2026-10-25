const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 8787;
const HOST = process.env.HOST || "127.0.0.1";
const ADMIN_API_KEY = process.env.ADMIN_API_KEY || "qtv-secret-2026";

function requestApi(method, endpoint, payload) {
  return new Promise((resolve, reject) => {
    const dataString = payload ? JSON.stringify(payload) : "";
    const options = {
      hostname: HOST,
      port: PORT,
      path: endpoint,
      method: method,
      headers: {
        "x-admin-key": ADMIN_API_KEY,
        "Content-Type": "application/json; charset=utf-8"
      }
    };
    if (dataString) {
      options.headers["Content-Length"] = Buffer.byteLength(dataString);
    }

    const req = http.request(options, (res) => {
      let raw = "";
      res.on("data", (chunk) => raw += chunk);
      res.on("end", () => {
        try {
          const parsed = JSON.parse(raw);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw });
        }
      });
    });

    req.on("error", (err) => {
      if (err.code === "ECONNREFUSED") {
        reject(new Error(`KHONG THE KET NOI MAY CHU BACKEND TAI http://${HOST}:${PORT}.\nVui long bat may chu bang lenh: npm start`));
      } else {
        reject(err);
      }
    });

    if (dataString) {
      req.write(dataString);
    }
    req.end();
  });
}

function printHelp() {
  console.log("================================================================================");
  console.log("     CONG CU DIEU HANH API CHO QUAN TRI VIEN (QTV) - FINANCIALS PLAN API        ");
  console.log("================================================================================");
  console.log("");
  console.log("Cach su dung:");
  console.log("  node backend/admin-cli.js <command> [arguments]");
  console.log("  npm run admin <command> [arguments]");
  console.log("");
  console.log("Danh sach cac lenh ho tro:");
  console.log("  overview                     Xem tong quan toan bo he thong (User, Nhom, Ma, RAM, Uptime)");
  console.log("  users                        Liet ke danh sach tat ca tai khoan nguoi dung va vai tro");
  console.log("  init-first-admin <u> <p> [e] Khoi tao tai khoan Quan tri vien (Admin) dau tien duy nhat");
  console.log("  codes                        Liet ke toan bo Ma Quan tri (Admin Codes) va trang thai");
  console.log("  create-code <role> [uses] [d] Sinh Ma Quan tri moi de cung cap cho nguoi khac");
  console.log("  revoke-code <code>           Thu hoi lap tuc mot Ma Quan tri");
  console.log("  classes                      Liet ke danh sach tat ca cac lop/nhom dao tao");
  console.log("  backup [filepath]            Xuat ban sao luu snapshot he thong ra file JSON");
  console.log("  help                         Hien thi huong dan nay");
  console.log("");
  console.log("Vi du goi qua curl:");
  console.log(`  curl -H "x-admin-key: ${ADMIN_API_KEY}" http://${HOST}:${PORT}/api/admin/overview`);
  console.log(`  curl -H "x-admin-key: ${ADMIN_API_KEY}" http://${HOST}:${PORT}/api/admin/users`);
  console.log("================================================================================");
}

async function main() {
  const args = process.argv.slice(2);
  const cmd = args[0] || "help";

  try {
    switch (cmd) {
      case "overview":
      case "status": {
        const res = await requestApi("GET", "/api/admin/overview");
        if (res.status === 200 && res.data.success) {
          const ov = res.data.overview;
          console.log("\n>>> TONG QUAN HE THONG (QTV OVERVIEW):");
          console.log(`- Trang thai:        ${ov.system.status.toUpperCase()}`);
          console.log(`- Thoi gian server:  ${ov.system.serverTime}`);
          console.log(`- Uptime:            ${ov.system.uptimeSeconds} giay`);
          console.log(`- Node.js Version:   ${ov.system.nodeVersion}`);
          console.log(`- Bo nho RAM (Heap): ${ov.system.memoryUsageMb} MB\n`);
          console.log(`- NGUOI DUNG:        Tong cong ${ov.users.total} tai khoan`);
          console.log(`  + Admin:           ${ov.users.roles.admin || 0}`);
          console.log(`  + Giang vien:      ${ov.users.roles.instructor || 0}`);
          console.log(`  + Hoc vien:        ${ov.users.roles.student || 0}\n`);
          console.log(`- NHOM / LOP HOC:    Tong cong ${ov.classes.total} nhom`);
          console.log(`  + Dang hoat dong:  ${ov.classes.active}`);
          console.log(`  + Da dong/archive: ${ov.classes.archived}`);
          console.log(`  + Tong thanh vien: ${ov.classes.totalMembers}`);
          console.log(`  + Cho duyet:       ${ov.classes.pendingApprovals}\n`);
          console.log(`- MA QUAN TRI:       Tong cong ${ov.adminCodes.total} ma`);
          console.log(`  + Con hieu luc:    ${ov.adminCodes.active}`);
          console.log(`  + Da bi thu hoi:   ${ov.adminCodes.revoked}`);
          console.log(`  + Da het han:      ${ov.adminCodes.expired}\n`);
        } else {
          console.error("Loi:", res.data || res.status);
        }
        break;
      }

      case "users": {
        const res = await requestApi("GET", "/api/admin/users");
        if (res.status === 200 && res.data.success) {
          console.log(`\n>>> DANH SACH TAI KHOAN (${res.data.count} nguoi dung):`);
          console.table(res.data.users.map(u => ({
            Username: u.username,
            Normalized: u.normalizedUsername,
            Role: u.role,
            RecoveryEmail: u.recoveryEmail || "(Chua dat)",
            CreatedAt: u.createdAt ? u.createdAt.slice(0, 10) : ""
          })));
        } else {
          console.error("Loi:", res.data);
        }
        break;
      }

      case "init-first-admin": {
        const username = args[1];
        const password = args[2];
        const recoveryEmail = args[3] || "";
        if (!username || !password) {
          console.error("Vui long nhap: node backend/admin-cli.js init-first-admin <username> <password> [recoveryEmail]");
          process.exit(1);
        }
        const res = await requestApi("POST", "/api/admin/init-first-admin", {
          username,
          password,
          recoveryEmail,
          secretKey: ADMIN_API_KEY
        });
        if (res.status === 201 && res.data.success) {
          console.log("\n[THANH CONG] Khoi tao tai khoan Quan tri vien (Admin) dau tien thanh cong:");
          console.log(`  Username:       ${res.data.user.username}`);
          console.log(`  Normalized:     ${res.data.user.normalizedUsername}`);
          console.log(`  Vai tro (Role): ${res.data.user.role}`);
          console.log(`  Email:          ${res.data.user.maskedEmail || "(Khong co)"}`);
          console.log(`  DocId:          ${res.data.user.docId}`);
          console.log("\nLuu y: Admin nay se su dung chuc nang Tao Ma de cung cap ma cho nhung nguoi khac.");
        } else {
          console.error("\n[THAT BAI]", res.data.error || res.data);
        }
        break;
      }

      case "codes": {
        const res = await requestApi("GET", "/api/admin/codes");
        if (res.status === 200 && res.data.success) {
          console.log(`\n>>> DANH SACH MA QUAN TRI (${res.data.codes.length} ma):`);
          console.table(res.data.codes.map(c => ({
            Code: c.code,
            Role: c.role,
            Quota: `${c.usedCount}/${c.maxUses}`,
            Revoked: c.isRevoked ? "DA THU HOI" : "Hop le",
            ExpiresAt: c.expiresAt ? c.expiresAt.slice(0, 10) : ""
          })));
        } else {
          console.error("Loi:", res.data);
        }
        break;
      }

      case "create-code": {
        const role = args[1] || "instructor";
        const maxUses = parseInt(args[2], 10) || 1;
        const validDays = parseInt(args[3], 10) || 30;
        const res = await requestApi("POST", "/api/admin/codes", { role, maxUses, validDays });
        if (res.status === 201 && res.data.success) {
          const c = res.data.code;
          console.log("\n[THANH CONG] Da sinh Ma Quan tri moi:");
          console.log(`  MA SO:        ${c.code}`);
          console.log(`  VAI TRO CAP:  ${c.role}`);
          console.log(`  HAN MUC DUNG: ${c.maxUses} lan`);
          console.log(`  HET HAN LUC:  ${c.expiresAt}`);
        } else {
          console.error("\n[THAT BAI]", res.data.error || res.data);
        }
        break;
      }

      case "revoke-code": {
        const code = args[1];
        if (!code) {
          console.error("Vui long nhap: node backend/admin-cli.js revoke-code <CODE>");
          process.exit(1);
        }
        const res = await requestApi("POST", "/api/admin/codes/revoke", { code });
        if (res.status === 200 && res.data.success) {
          console.log(`\n[THANH CONG] ${res.data.message}`);
        } else {
          console.error("\n[THAT BAI]", res.data.error || res.data);
        }
        break;
      }

      case "classes": {
        const res = await requestApi("GET", "/api/classes");
        if (res.status === 200 && res.data.success) {
          console.log(`\n>>> DANH SACH NHOM / LOP (${res.data.classes.length} nhom):`);
          console.table(res.data.classes.map(c => ({
            ID: c.id,
            Name: c.name,
            Code: c.code,
            Instructor: c.instructorName || c.instructorUsername,
            Members: (c.members || []).length,
            Status: c.status
          })));
        } else {
          console.error("Loi:", res.data);
        }
        break;
      }

      case "backup": {
        const targetPath = args[1] || `backup-${new Date().toISOString().slice(0, 10)}.json`;
        const res = await requestApi("GET", "/api/admin/backup");
        if (res.status === 200 && res.data.success) {
          const fullPath = path.resolve(process.cwd(), targetPath);
          fs.writeFileSync(fullPath, JSON.stringify(res.data.backup, null, 2), "utf-8");
          console.log(`\n[THANH CONG] Da xuat ban sao luu JSON thanh cong:`);
          console.log(`  File: ${fullPath}`);
          console.log(`  So tai khoan: ${res.data.backup.accounts.length}`);
          console.log(`  So nhom:      ${res.data.backup.classes.length}`);
          console.log(`  So ma QTV:    ${res.data.backup.adminCodes.length}`);
        } else {
          console.error("Loi:", res.data);
        }
        break;
      }

      case "help":
      default:
        printHelp();
        break;
    }
  } catch (err) {
    console.error("\n[LOI HE THONG]:", err.message);
  }
}

main();

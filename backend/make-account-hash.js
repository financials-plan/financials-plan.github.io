#!/usr/bin/env node
/*
 * Tạo salt + hash mật khẩu (PBKDF2-SHA256, 150.000 vòng) cùng định dạng mà ứng dụng dùng.
 *
 * Dùng khi cần tạo/đặt lại tài khoản Quản trị viên trực tiếp trong Firestore Console, vì ứng dụng
 * không còn tài khoản hay mật khẩu mặc định:
 *
 *   PowerShell:  $env:ACCOUNT_PASSWORD = "mật-khẩu-mạnh-của-bạn"; node backend/make-account-hash.js
 *   bash:        ACCOUNT_PASSWORD='mật-khẩu-mạnh-của-bạn' node backend/make-account-hash.js
 *
 * Mật khẩu được đọc từ biến môi trường (không truyền qua tham số dòng lệnh) và không bao giờ được in ra.
 * Kết quả (salt, passHash, hashAlgo) là các trường cần ghi vào tài liệu tài khoản.
 */
const crypto = require("crypto");

const password = process.env.ACCOUNT_PASSWORD;
if (!password || password.length < 10) {
  console.error("Đặt biến môi trường ACCOUNT_PASSWORD (tối thiểu 10 ký tự) rồi chạy lại.");
  process.exit(1);
}

const salt = crypto.randomBytes(16).toString("hex");
const passHash = crypto.pbkdf2Sync(password, salt, 150000, 32, "sha256").toString("hex");

console.log(JSON.stringify({ salt, passHash, hashAlgo: "pbkdf2-sha256" }, null, 2));
console.log("\nGhi 3 trường trên vào tài liệu tài khoản (financial_accounts/<username>), đồng thời xóa các trường password và mat_khau nếu còn.");

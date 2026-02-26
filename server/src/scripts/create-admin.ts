/**
 * 创建第一个管理员账号（仅当该邮箱不存在时）。
 * 在 server 目录下执行：npx ts-node -r dotenv/config src/scripts/create-admin.ts
 * 需在 .env 中设置 MONGODB_URI、ADMIN_EMAIL、ADMIN_PASSWORD
 */
import mongoose from "mongoose";
import { Admin } from "../models/Admin";
import { hashPassword } from "../utils/auth";
import dotenv from "dotenv";

dotenv.config();

const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD;

async function main() {
  if (!email || !password) {
    console.error("请在 .env 中设置 ADMIN_EMAIL 和 ADMIN_PASSWORD");
    process.exit(1);
  }
  const raw = process.env.MONGODB_URI;
  if (!raw) {
    console.error("请在 .env 中设置 MONGODB_URI");
    process.exit(1);
  }
  const uri = raw.trim().replace(/\r?\n/g, "");
  if (!uri.startsWith("mongodb://") && !uri.startsWith("mongodb+srv://")) {
    console.error("MONGODB_URI 格式错误，应以 mongodb:// 或 mongodb+srv:// 开头");
    process.exit(1);
  }
  await mongoose.connect(uri);
  const existing = await Admin.findOne({ email });
  if (existing) {
    console.log("该邮箱已是管理员，无需创建。");
    process.exit(0);
  }
  await Admin.create({
    email,
    passwordHash: hashPassword(password)
  });
  console.log("管理员账号创建成功，邮箱：", email);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

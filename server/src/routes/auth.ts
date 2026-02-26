import { Router } from "express";
import jwt from "jsonwebtoken";
import { Admin } from "../models/Admin";
import { verifyPassword } from "../utils/auth";

const router = Router();
const secret = process.env.JWT_SECRET || "dev-secret-change-in-production";
const expiresIn = "7d";

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body as { email?: string; password?: string };
    if (!email || !password) {
      res.status(400).json({ message: "请提供邮箱和密码" });
      return;
    }
    const normalizedEmail = String(email).trim().toLowerCase();
    const admin = await Admin.findOne({ email: normalizedEmail }).lean();
    if (!admin) {
      console.warn("[auth] 登录失败：未找到管理员邮箱", normalizedEmail);
      res.status(401).json({ message: "邮箱或密码错误" });
      return;
    }
    if (!verifyPassword(password, admin.passwordHash)) {
      console.warn("[auth] 登录失败：密码错误", normalizedEmail);
      res.status(401).json({ message: "邮箱或密码错误" });
      return;
    }
    const token = jwt.sign(
      { adminId: admin._id.toString(), email: admin.email },
      secret,
      { expiresIn }
    );
    res.json({ token, email: admin.email });
  } catch (err) {
    console.error("[auth] 登录异常", err);
    const msg = err instanceof Error ? err.message : "登录失败";
    res.status(500).json({ message: `登录失败：${msg}` });
  }
});

export default router;

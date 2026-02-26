import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const secret = process.env.JWT_SECRET || "dev-secret-change-in-production";

export interface JwtPayload {
  adminId: string;
  email: string;
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const auth = req.headers.authorization;
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) {
    res.status(401).json({ message: "未登录或登录已过期" });
    return;
  }
  try {
    const decoded = jwt.verify(token, secret) as JwtPayload;
    (req as Request & { admin?: JwtPayload }).admin = decoded;
    next();
  } catch {
    res.status(401).json({ message: "未登录或登录已过期" });
  }
}

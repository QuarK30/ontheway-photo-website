import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { api, setStoredToken } from "../api";

export function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || "/admin/photos";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post<{ token: string }>("/auth/login", { email, password });
      setStoredToken(res.data.token);
      navigate(from, { replace: true });
    } catch (err: unknown) {
      const ax = err && typeof err === "object" && "response" in err
        ? (err as { response?: { status?: number; data?: { message?: string }; statusText?: string } }).response
        : null;
      const serverMsg = ax?.data?.message;
      const status = ax?.status;
      let msg = serverMsg || "登录失败";
      if (status != null) msg = `[${status}] ${msg}`;
      else if (!ax) msg = "网络错误或超时，请检查后端地址与网络";
      setError(msg);
      if (process.env.NODE_ENV === "development" && err) console.error("登录错误", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-xl border border-slate-700 bg-slate-800/80 p-6 shadow-xl">
        <h1 className="text-lg font-semibold text-slate-100 mb-4">管理后台登录</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p className="text-sm text-red-400 bg-red-950/40 border border-red-900 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          <div>
            <label htmlFor="email" className="block text-xs text-slate-400 mb-1">邮箱</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-600 bg-slate-900 text-slate-100 px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none"
              placeholder="your@email.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-xs text-slate-400 mb-1">密码</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-600 bg-slate-900 text-slate-100 px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium py-2 text-sm transition disabled:opacity-50"
          >
            {loading ? "登录中…" : "登录"}
          </button>
        </form>
        <p className="mt-4 text-xs text-slate-500">
          使用在服务端创建的管理员账号登录（运行 <code className="bg-slate-700 px-1 rounded">npm run create-admin</code> 创建）。
        </p>
      </div>
    </div>
  );
}

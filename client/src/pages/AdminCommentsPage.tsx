import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Comment, Photo, api, clearStoredToken } from "../api";

function formatDate(s?: string) {
  if (!s) return "";
  try {
    return new Date(s).toLocaleString("zh-CN");
  } catch {
    return s;
  }
}

export function AdminCommentsPage() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [photoId, setPhotoId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  function loadComments() {
    const params = photoId ? { photoId } : {};
    api.get<Comment[]>("/comments", { params })
      .then((res) => setComments(res.data))
      .catch((e) => setError(e.response?.data?.message || "加载失败"));
  }

  useEffect(() => {
    api.get<Photo[]>("/photos").then((res) => setPhotos(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = photoId ? { photoId } : {};
    api.get<Comment[]>("/comments", { params })
      .then((res) => setComments(res.data))
      .catch((e) => setError(e.response?.data?.message || "加载失败"))
      .finally(() => setLoading(false));
  }, [photoId]);

  function handleLogout() {
    clearStoredToken();
    navigate("/admin/login", { replace: true });
  }

  function handleDelete(c: Comment) {
    if (!window.confirm("确定删除这条留言？")) return;
    api.delete(`/comments/${c._id}`).then(() => loadComments()).catch((e) => setError(e.response?.data?.message || "删除失败"));
  }

  function handleToggleHidden(c: Comment) {
    api.patch(`/comments/${c._id}`, { hidden: !c.hidden }).then(() => loadComments()).catch((e) => setError(e.response?.data?.message || "操作失败"));
  }

  const photoMap = new Map(photos.map((p) => [p._id, p]));

  return (
    <div className="min-h-screen bg-slate-900 text-slate-50 flex flex-col">
      <header className="border-b border-slate-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button type="button" onClick={() => navigate("/")} className="text-slate-400 hover:text-cyan-400 text-sm">
            返回首页
          </button>
          <button type="button" onClick={() => navigate("/admin/photos")} className="text-slate-400 hover:text-cyan-400 text-sm">
            照片管理
          </button>
          <h1 className="text-sm font-semibold text-slate-200">留言管理</h1>
        </div>
        <button type="button" onClick={handleLogout} className="text-slate-400 hover:text-red-400 text-sm">
          退出登录
        </button>
      </header>

      <main className="flex-1 p-4 overflow-auto">
        {error && (
          <p className="text-sm text-red-400 bg-red-950/40 border border-red-900 rounded-lg px-3 py-2 mb-4">
            {error}
          </p>
        )}

        <div className="mb-4 flex items-center gap-2">
          <label className="text-sm text-slate-400">按图片筛选：</label>
          <select
            value={photoId}
            onChange={(e) => setPhotoId(e.target.value)}
            className="rounded-lg border border-slate-600 bg-slate-800 text-slate-200 text-sm px-3 py-2"
          >
            <option value="">全部</option>
            {photos.map((p) => (
              <option key={p._id} value={p._id}>
                {p.title}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <p className="text-slate-400 text-sm">加载中…</p>
        ) : comments.length === 0 ? (
          <p className="text-slate-500 text-sm">暂无留言。</p>
        ) : (
          <ul className="space-y-3">
            {comments.map((c) => (
              <li key={c._id} className={`rounded-lg border p-3 ${c.hidden ? "border-amber-900/50 bg-amber-950/20" : "border-slate-700 bg-slate-800/60"}`}>
                <div className="flex items-center gap-2 text-sm mb-1">
                  <span className="font-medium text-slate-200">{c.nickname}</span>
                  <span className="text-slate-500">{formatDate(c.createdAt)}</span>
                  {c.hidden && <span className="text-amber-500 text-xs">已隐藏</span>}
                  <span className="text-slate-500 truncate flex-1">
                    {photoMap.get(c.photoId)?.title ?? c.photoId}
                  </span>
                </div>
                <p className="text-slate-300 text-sm whitespace-pre-wrap mb-2">{c.content}</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleHidden(c)}
                    className="text-sm text-amber-400 hover:underline"
                  >
                    {c.hidden ? "显示" : "隐藏"}
                  </button>
                  <button type="button" onClick={() => handleDelete(c)} className="text-sm text-red-400 hover:underline">
                    删除
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate(`/photos/${c.photoId}`)}
                    className="text-sm text-cyan-400 hover:underline"
                  >
                    查看图片
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}

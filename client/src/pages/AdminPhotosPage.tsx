import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Photo, api, clearStoredToken } from "../api";

function toNum(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export function AdminPhotosPage() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Photo | null>(null);
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();

  function load() {
    setLoading(true);
    api.get<Photo[]>("/photos")
      .then((res) => setPhotos(res.data))
      .catch((err) => setError(err.response?.data?.message || "加载失败"))
      .finally(() => setLoading(false));
  }

  useEffect(() => load(), []);

  function handleLogout() {
    clearStoredToken();
    navigate("/admin/login", { replace: true });
  }

  function handleDelete(p: Photo) {
    if (!window.confirm(`确定删除「${p.title}」？`)) return;
    api.delete(`/photos/${p._id}`).then(() => load()).catch((e) => setError(e.response?.data?.message || "删除失败"));
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-50 flex flex-col">
      <header className="border-b border-slate-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button type="button" onClick={() => navigate("/")} className="text-slate-400 hover:text-cyan-400 text-sm">
            返回首页
          </button>
          <button type="button" onClick={() => navigate("/admin/comments")} className="text-slate-400 hover:text-cyan-400 text-sm">
            留言管理
          </button>
          <h1 className="text-sm font-semibold text-slate-200">照片管理</h1>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="text-slate-400 hover:text-red-400 text-sm"
        >
          退出登录
        </button>
      </header>

      <main className="flex-1 p-4 overflow-auto">
        {error && (
          <p className="text-sm text-red-400 bg-red-950/40 border border-red-900 rounded-lg px-3 py-2 mb-4">
            {error}
          </p>
        )}

        <div className="mb-4">
          <button
            type="button"
            onClick={() => setUploading(true)}
            className="rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-medium px-4 py-2"
          >
            上传照片
          </button>
        </div>

        {loading ? (
          <p className="text-slate-400 text-sm">加载中…</p>
        ) : photos.length === 0 ? (
          <p className="text-slate-500 text-sm">暂无照片，点击「上传照片」添加。</p>
        ) : (
          <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {photos.map((p) => (
              <li
                key={p._id}
                className="rounded-lg border border-slate-700 bg-slate-800/60 overflow-hidden flex flex-col aspect-[3/4]"
              >
                <div className="flex-1 min-h-0 flex items-center justify-center bg-slate-900">
                  <img
                    src={(p.imageUrl.startsWith("http") ? p.imageUrl : `${api.defaults.baseURL}${p.imageUrl}`)}
                    alt={p.title}
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
                <div className="flex-shrink-0 p-2 border-t border-slate-700 min-w-0">
                  <div className="font-medium text-slate-100 text-xs truncate">{p.title}</div>
                  {p.placeName && <div className="text-[10px] text-slate-500 truncate">{p.placeName}</div>}
                  <div className="flex gap-1 mt-1.5">
                    <button
                      type="button"
                      onClick={() => setEditing(p)}
                      className="flex-1 rounded border border-slate-600 text-slate-400 py-1 text-[10px] hover:bg-slate-700 transition"
                    >
                      编辑
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(p)}
                      className="flex-1 rounded border border-red-900/50 text-red-400 py-1 text-[10px] hover:bg-red-950/40 transition"
                    >
                      删除
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        {uploading && (
          <PhotoForm
            onClose={() => setUploading(false)}
            onSuccess={() => { setUploading(false); load(); }}
          />
        )}
        {editing && (
          <PhotoForm
            photo={editing}
            onClose={() => setEditing(null)}
            onSuccess={() => { setEditing(null); load(); }}
          />
        )}
      </main>
    </div>
  );
}

interface PhotoFormProps {
  photo?: Photo;
  onClose: () => void;
  onSuccess: () => void;
}

function formatShotAtForInput(shotAt?: string): string {
  if (!shotAt) return "";
  try {
    const d = new Date(shotAt);
    return d.toISOString().slice(0, 10);
  } catch {
    return "";
  }
}

function PhotoForm({ photo, onClose, onSuccess }: PhotoFormProps) {
  const [title, setTitle] = useState(photo?.title ?? "");
  const [description, setDescription] = useState(photo?.description ?? "");
  const [placeName, setPlaceName] = useState(photo?.placeName ?? "");
  const [shotAt, setShotAt] = useState(formatShotAtForInput(photo?.shotAt));
  const [lat, setLat] = useState(photo ? String(photo.location.lat) : "");
  const [lng, setLng] = useState(photo ? String(photo.location.lng) : "");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [uploadDurationSec, setUploadDurationSec] = useState<number | null>(null);

  function validateLatLng(latN: number, lngN: number): string | null {
    if (Number.isNaN(latN) || Number.isNaN(lngN)) return "请填写有效经纬度";
    if (latN < -90 || latN > 90) return "纬度范围为 -90 至 90";
    if (lngN < -180 || lngN > 180) return "经度范围为 -180 至 180";
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const latN = lat.trim() ? parseFloat(lat) : NaN;
      const lngN = lng.trim() ? parseFloat(lng) : NaN;
      if (photo) {
        if (lat.trim() || lng.trim()) {
          const err = validateLatLng(latN, lngN);
          if (err) {
            setError(err);
            setSubmitting(false);
            return;
          }
        }
        await api.put(`/photos/${photo._id}`, {
          title,
          description,
          placeName,
          shotAt: shotAt.trim() || undefined,
          lat: lat.trim() ? latN : undefined,
          lng: lng.trim() ? lngN : undefined
        });
      } else {
        const err = validateLatLng(latN, lngN);
        if (err) {
          setError(err);
          setSubmitting(false);
          return;
        }
        if (!file) {
          setError("请选择图片");
          setSubmitting(false);
          return;
        }
        const form = new FormData();
        form.append("title", title);
        form.append("description", description);
        form.append("placeName", placeName);
        if (shotAt.trim()) form.append("shotAt", shotAt.trim());
        form.append("lat", String(latN));
        form.append("lng", String(lngN));
        form.append("image", file);
        const start = Date.now();
        await api.post("/photos", form, { timeout: 120000 });
        const elapsed = (Date.now() - start) / 1000;
        setUploadDurationSec(elapsed);
        setTimeout(() => onSuccess(), 1800);
        return;
      }
      onSuccess();
    } catch (err: unknown) {
      const ax = err && typeof err === "object" && "response" in err
        ? (err as { response?: { status?: number; data?: { message?: string } } }).response
        : null;
      const msg = ax?.data?.message;
      const status = ax?.status;
      const fallback = status != null ? `请求失败 (${status})` : "网络错误或请求超时，请检查后端地址与网络";
      setError(msg || fallback);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-950/80 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-auto">
        <h2 className="text-lg font-semibold text-slate-100 mb-4">{photo ? "编辑照片" : "上传照片"}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-sm text-red-400">{error}</p>}
          {uploadDurationSec != null && (
            <p className="text-sm text-cyan-400">
              上传成功，耗时 {uploadDurationSec.toFixed(1)} 秒
            </p>
          )}
          <div>
            <label className="block text-xs text-slate-400 mb-1">标题</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-600 bg-slate-900 text-slate-100 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">描述</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-slate-600 bg-slate-900 text-slate-100 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">地点名称（选填，地图悬停显示）</label>
            <input
              value={placeName}
              onChange={(e) => setPlaceName(e.target.value)}
              className="w-full rounded-lg border border-slate-600 bg-slate-900 text-slate-100 px-3 py-2 text-sm"
              placeholder="如：北京故宫"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">拍摄日期（选填）</label>
            <input
              type="date"
              value={shotAt}
              onChange={(e) => setShotAt(e.target.value)}
              className="w-full rounded-lg border border-slate-600 bg-slate-900 text-slate-100 px-3 py-2 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-slate-400 mb-1">纬度 lat</label>
              <input
                type="text"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                required={!photo}
                className="w-full rounded-lg border border-slate-600 bg-slate-900 text-slate-100 px-3 py-2 text-sm"
                placeholder="39.9042"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">经度 lng</label>
              <input
                type="text"
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                required={!photo}
                className="w-full rounded-lg border border-slate-600 bg-slate-900 text-slate-100 px-3 py-2 text-sm"
                placeholder="116.4074"
              />
            </div>
          </div>
          {!photo && (
            <div>
              <label className="block text-xs text-slate-400 mb-1">图片文件</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                required
                className="w-full text-sm text-slate-400 file:mr-2 file:py-2 file:px-3 file:rounded file:border-0 file:bg-cyan-600 file:text-white"
              />
            </div>
          )}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-slate-600 text-slate-300 py-2 text-sm"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white py-2 text-sm disabled:opacity-50"
            >
              {submitting ? "提交中…" : photo ? "保存" : "上传"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

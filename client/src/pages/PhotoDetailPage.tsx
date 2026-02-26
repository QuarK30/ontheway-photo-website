import { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Photo, Comment, api } from "../api";
import { useNickname } from "../contexts/NicknameContext";

function formatDateTime(s?: string) {
  if (!s) return "";
  try {
    const d = new Date(s);
    return d.toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false
    }).replace(/\//g, "/");
  } catch {
    return s;
  }
}

function formatShotAt(s?: string) {
  if (!s) return "";
  try {
    return new Date(s).toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  } catch {
    return s;
  }
}

const LOCATION_PRECISION = 5;
function sameLocation(a: { lat?: unknown; lng?: unknown }, b: { lat?: unknown; lng?: unknown }): boolean {
  const toN = (v: unknown) => Number(v);
  const latA = toN(a.lat), lngA = toN(a.lng), latB = toN(b.lat), lngB = toN(b.lng);
  return (
    latA.toFixed(LOCATION_PRECISION) === latB.toFixed(LOCATION_PRECISION) &&
    lngA.toFixed(LOCATION_PRECISION) === lngB.toFixed(LOCATION_PRECISION)
  );
}

export function PhotoDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { nickname, openModal } = useNickname();
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [siblingIds, setSiblingIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);

  const stateSiblingIds = (location.state as { siblingIds?: string[] } | null)?.siblingIds;

  useEffect(() => {
    if (!id) return;
    setImageLoaded(false);
    let cancelled = false;
    async function load() {
      try {
        const [photoRes, commentsRes] = await Promise.all([
          api.get<Photo>(`/photos/${id}`),
          api.get<Comment[]>(`/photos/${id}/comments`)
        ]);
        if (!cancelled) {
          setPhoto(photoRes.data);
          setComments(commentsRes.data);
          if (stateSiblingIds && Array.isArray(stateSiblingIds)) {
            setSiblingIds(stateSiblingIds);
          } else {
            const allRes = await api.get<Photo[]>("/photos");
            const atSame = (allRes.data || []).filter((p) =>
              p.location && photoRes.data.location && sameLocation(p.location, photoRes.data.location)
            );
            setSiblingIds(atSame.map((p) => p._id));
          }
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) setError("加载失败，请稍后再试。");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [id, stateSiblingIds]);

  async function handleSubmitComment(e: React.FormEvent) {
    e.preventDefault();
    if (!id || !nickname) {
      openModal();
      return;
    }
    const trimmed = content.trim();
    if (!trimmed) {
      setCommentError("请填写留言内容");
      return;
    }
    setCommentError(null);
    setSubmitting(true);
    try {
      const res = await api.post<Comment>(`/photos/${id}/comments`, { nickname, content: trimmed });
      setComments((prev) => [res.data, ...prev]);
      setContent("");
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "response" in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
        : "发表失败";
      setCommentError(msg || "发表失败");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading || !id) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="text-slate-500 text-sm">加载中…</div>
      </div>
    );
  }

  if (error || !photo) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center gap-4">
        <p className="text-red-400 text-sm">{error || "未找到该照片"}</p>
        <button type="button" onClick={() => navigate("/")} className="text-cyan-400 hover:underline text-sm">
          返回地图
        </button>
      </div>
    );
  }

  const imageUrl = photo.imageUrl.startsWith("http")
    ? photo.imageUrl
    : `${import.meta.env.VITE_API_URL || "http://localhost:4000"}${photo.imageUrl}`;

  const currentIndex = siblingIds.indexOf(id!);
  const hasPrev = siblingIds.length > 1 && currentIndex > 0;
  const hasNext = siblingIds.length > 1 && currentIndex >= 0 && currentIndex < siblingIds.length - 1;
  const goPrev = () => {
    if (!hasPrev) return;
    const prevId = siblingIds[currentIndex - 1];
    navigate(`/photos/${prevId}`, { state: { siblingIds } });
  };
  const goNext = () => {
    if (!hasNext) return;
    const nextId = siblingIds[currentIndex + 1];
    navigate(`/photos/${nextId}`, { state: { siblingIds } });
  };

  return (
    <div className="h-screen overflow-hidden bg-slate-950 text-slate-100 flex flex-col ontheway-page-enter">
      {/* 顶栏：左返回 / 中标题 / 右昵称 */}
      <header className="flex-shrink-0 grid grid-cols-3 items-center px-4 py-3 bg-slate-900/80 border-b border-slate-800">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="text-cyan-400 hover:text-cyan-300 text-sm transition justify-self-start"
        >
          ← 返回地图
        </button>
        <h1 className="text-sm font-medium text-white text-center">
          OnTheWay・照片详情
        </h1>
        <div className="text-sm text-cyan-400 justify-self-end">
          {nickname ? (
            <span>昵称: {nickname}</span>
          ) : (
            <button type="button" onClick={openModal} className="hover:text-cyan-300 transition">
              设置昵称
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 min-h-0 flex flex-col lg:flex-row gap-6 lg:gap-12 p-4 lg:p-6 max-w-6xl w-full mx-auto overflow-hidden">
        {/* 左侧：图片严格限制在视口内，一屏可见 */}
        <div className="flex-1 min-w-0 min-h-0 flex flex-col overflow-hidden">
          <div
            className="flex-1 min-h-0 relative rounded-lg overflow-hidden bg-slate-900"
            style={{ maxHeight: "calc(100vh - 12rem)" }}
          >
            {hasPrev && (
              <button
                type="button"
                onClick={goPrev}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-slate-800/90 hover:bg-slate-700 text-white flex items-center justify-center shadow-lg transition"
                aria-label="上一张"
              >
                ←
              </button>
            )}
            {hasNext && (
              <button
                type="button"
                onClick={goNext}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-slate-800/90 hover:bg-slate-700 text-white flex items-center justify-center shadow-lg transition"
                aria-label="下一张"
              >
                →
              </button>
            )}
            <div className="absolute inset-0 flex items-center justify-center">
              {!imageLoaded && (
                <div className="ontheway-skeleton absolute inset-0" aria-hidden />
              )}
              <img
                src={imageUrl}
                alt={photo.title}
                className="max-w-full max-h-full w-auto h-auto object-contain"
                onLoad={() => setImageLoaded(true)}
              />
            </div>
          </div>
          <div className="flex-shrink-0 mt-4 text-left">
            <h2 className="text-lg font-semibold text-white">{photo.title}</h2>
            {photo.description && (
              <p className="mt-1 text-slate-400 text-sm">{photo.description}</p>
            )}
            {photo.shotAt && (
              <p className="mt-1 text-slate-500 text-xs">
                拍摄日期：{formatShotAt(photo.shotAt)}
              </p>
            )}
          </div>
        </div>

        {/* 右侧：留言（内容多时内部滚动） */}
        <div className="lg:w-80 flex-shrink-0 flex flex-col min-h-0 overflow-auto lg:pl-2">
          <h2 className="text-base font-semibold text-white mb-4">留言</h2>
          <form onSubmit={handleSubmitComment} className="space-y-3 mb-6">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="写点什么留下此刻的心情..."
              rows={4}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 text-slate-200 px-3 py-2 text-sm placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none resize-none"
            />
            {commentError && <p className="text-sm text-red-400">{commentError}</p>}
            <button
              type="submit"
              disabled={submitting || !nickname}
              className="w-full rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-medium py-2.5 disabled:opacity-50 transition"
            >
              发送留言
            </button>
          </form>

          <h3 className="text-base font-semibold text-white mb-3">最近留言</h3>
          <ul className="space-y-4 flex-1 overflow-auto">
            {comments.length === 0 ? (
              <li className="text-slate-500 text-sm">这里还没有小脚印～ 你来留一句吧 ✨</li>
            ) : (
              comments.map((c) => (
                <li key={c._id} className="text-sm border-b border-slate-800 pb-3 last:border-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-medium text-cyan-400">{c.nickname}</span>
                    <span className="text-slate-500 text-xs shrink-0">{formatDateTime(c.createdAt)}</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">{c.content}</p>
                </li>
              ))
            )}
          </ul>
        </div>
      </main>
    </div>
  );
}

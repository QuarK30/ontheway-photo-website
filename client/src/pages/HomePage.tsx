import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useNavigate } from "react-router-dom";
import { Photo, api } from "../api";

const INITIAL_CENTER: [number, number] = [20, 0];

function toNum(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

/** 同地点判定：经纬度四舍五入到小数点后 5 位作为 key */
function locationKey(p: Photo): string {
  const lat = toNum(p.location?.lat);
  const lng = toNum(p.location?.lng);
  return `${lat.toFixed(5)}_${lng.toFixed(5)}`;
}

/** 按地点分组，每组多张照片合并为一个红点 */
function groupPhotosByLocation(photos: Photo[]): { key: string; lat: number; lng: number; photos: Photo[] }[] {
  const map = new Map<string, Photo[]>();
  for (const p of photos) {
    const key = locationKey(p);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(p);
  }
  return Array.from(map.entries()).map(([key, list]) => ({
    key,
    lat: toNum(list[0].location?.lat),
    lng: toNum(list[0].location?.lng),
    photos: list
  }));
}

function FitBounds({ groups }: { groups: { lat: number; lng: number }[] }) {
  const map = useMap();
  const lastFitKey = useRef<string>("");
  useEffect(() => {
    if (groups.length < 2) return;
    const key = groups.map((g) => `${g.lat}-${g.lng}`).join("|");
    if (lastFitKey.current === key) return;
    lastFitKey.current = key;
    const points: [number, number][] = groups.map((g) => [g.lat, g.lng]);
    const bounds = L.latLngBounds(points);
    map.fitBounds(bounds, { padding: [24, 24], maxZoom: 12 });
  }, [map, groups]);
  return null;
}

export function HomePage() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await api.get<Photo[]>("/photos");
        if (!cancelled) setPhotos(res.data);
      } catch (err) {
        console.error(err);
        if (!cancelled) setError("加载照片数据失败，请稍后再试。");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const locationGroups = groupPhotosByLocation(photos);
  const center: [number, number] =
    locationGroups.length > 0
      ? [locationGroups[0].lat, locationGroups[0].lng]
      : INITIAL_CENTER;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-50 flex flex-col">
      <header className="border-b border-slate-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.9)]" />
          <h1 className="text-sm sm:text-base font-semibold tracking-wide">
            OnTheWay · 世界地图摄影集
          </h1>
        </div>
      </header>

      <main className="flex-1 flex flex-col lg:flex-row">
        <div className="flex-1 relative">
          <MapContainer
            center={center}
            zoom={photos.length > 0 ? 3 : 2}
            minZoom={2}
            className="ontheway-map h-[60vh] lg:h-full w-full"
            scrollWheelZoom
          >
            <TileLayer
              attribution='&copy; <a href="https://carto.com/">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            />
            <FitBounds groups={locationGroups.map((g) => ({ lat: g.lat, lng: g.lng }))} />
            {locationGroups.map((group) => {
              const first = group.photos[0];
              const siblingIds = group.photos.map((p) => p._id);
              return (
                <CircleMarker
                  key={group.key}
                  center={[group.lat, group.lng]}
                  radius={4}
                  pathOptions={{
                    color: "transparent",
                    fillColor: "#ef4444",
                    fillOpacity: 1,
                    weight: 0
                  }}
                  eventHandlers={{
                    click: () =>
                      navigate(`/photos/${first._id}`, { state: { siblingIds } })
                  }}
                >
                  <Tooltip direction="top" offset={[0, -6]} opacity={0.95}>
                    <div className="text-xs text-left">
                      {first.placeName && (
                        <div className="text-black mb-0.5">{first.placeName}</div>
                      )}
                      <div className="font-semibold text-slate-500">
                        共 {group.photos.length} 张
                      </div>
                    </div>
                  </Tooltip>
                </CircleMarker>
              );
            })}
          </MapContainer>
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
              <div className="text-sm text-slate-300">地图加载中…</div>
            </div>
          )}
        </div>

        <aside className="lg:w-80 border-t lg:border-t-0 lg:border-l border-slate-700 bg-slate-800/90 backdrop-blur-sm p-4 space-y-3">
          <h2 className="text-sm font-semibold tracking-wide text-slate-200">照片一览</h2>
          {error && (
            <p className="text-xs text-red-400 bg-red-950/40 border border-red-900 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          {!loading && photos.length === 0 && !error && (
            <p className="text-xs text-slate-400">
              暂时还没有照片。等管理员在后台上传后，这里会列出所有地点与照片。
            </p>
          )}
          <ul className="space-y-2 max-h-64 lg:max-h-none overflow-auto pr-1 text-xs">
            {photos.map((p) => (
              <li key={p._id}>
                <button
                  type="button"
                  onClick={() => navigate(`/photos/${p._id}`)}
                  className="w-full text-left rounded-lg border border-slate-700 hover:border-cyan-500/70 hover:bg-slate-800/60 px-3 py-2 transition"
                >
                  <div className="font-medium text-slate-100 line-clamp-1">{p.title}</div>
                  {p.description && (
                    <div className="text-slate-400 line-clamp-2 mt-0.5">{p.description}</div>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </aside>
      </main>
    </div>
  );
}

import { useState, useEffect } from "react";
import { useNickname } from "../contexts/NicknameContext";
import { randomNickname } from "../api";

export function NicknameModal() {
  const { nickname, setNickname, showModal, closeModal } = useNickname();
  const [value, setValue] = useState(nickname || randomNickname());

  useEffect(() => {
    if (showModal) setValue(nickname || randomNickname());
  }, [showModal, nickname]);

  function handleRandom() {
    setValue(randomNickname());
  }

  function handleConfirm() {
    const trimmed = value.trim();
    if (trimmed) {
      setNickname(trimmed);
    }
  }

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-sm">
        <h2 className="text-lg font-semibold text-slate-100 mb-2">设置你的昵称</h2>
        <p className="text-sm text-slate-400 mb-4">
          留言时将显示此昵称，可随时在留言区旁修改。
        </p>
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="输入昵称"
            className="flex-1 rounded-lg border border-slate-600 bg-slate-900 text-slate-100 px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none"
          />
          <button
            type="button"
            onClick={handleRandom}
            className="rounded-lg border border-slate-600 text-slate-300 px-3 py-2 text-sm hover:bg-slate-700 whitespace-nowrap"
          >
            随机生成
          </button>
        </div>
        <div className="flex gap-2">
          {nickname && (
            <button
              type="button"
              onClick={closeModal}
              className="flex-1 rounded-lg border border-slate-600 text-slate-300 py-2 text-sm"
            >
              取消
            </button>
          )}
          <button
            type="button"
            onClick={handleConfirm}
            className={nickname ? "flex-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium py-2 text-sm" : "w-full rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium py-2 text-sm"}
          >
            确定
          </button>
        </div>
      </div>
    </div>
  );
}

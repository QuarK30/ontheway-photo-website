import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { getStoredNickname, setStoredNickname } from "../api";

type NicknameContextValue = {
  nickname: string | null;
  setNickname: (v: string) => void;
  showModal: boolean;
  openModal: () => void;
  closeModal: () => void;
};

const ctx = createContext<NicknameContextValue | null>(null);

export function NicknameProvider({ children }: { children: React.ReactNode }) {
  const [nickname, setNicknameState] = useState<string | null>(() => getStoredNickname());
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!nickname) setShowModal(true);
  }, [nickname]);

  const setNickname = useCallback((v: string) => {
    const trimmed = v.trim();
    if (trimmed) {
      setStoredNickname(trimmed);
      setNicknameState(trimmed);
      setShowModal(false);
    }
  }, []);

  const openModal = useCallback(() => setShowModal(true), []);
  const closeModal = useCallback(() => setShowModal(false), []);

  return (
    <ctx.Provider
      value={{
        nickname,
        setNickname,
        showModal,
        openModal,
        closeModal
      }}
    >
      {children}
    </ctx.Provider>
  );
}

export function useNickname() {
  const value = useContext(ctx);
  if (!value) throw new Error("useNickname must be used within NicknameProvider");
  return value;
}

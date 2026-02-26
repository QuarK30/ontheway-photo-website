import axios from "axios";

const TOKEN_KEY = "ontheway_admin_token";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:4000",
  timeout: 15000
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
    }
    return Promise.reject(err);
  }
);

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export interface Photo {
  _id: string;
  title: string;
  description?: string;
  placeName?: string;
  shotAt?: string;
  location: { lat: number; lng: number };
  imageUrl: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Comment {
  _id: string;
  photoId: string;
  nickname: string;
  content: string;
  hidden?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

const NICKNAME_KEY = "ontheway_nickname";

export function getStoredNickname(): string | null {
  return localStorage.getItem(NICKNAME_KEY);
}

export function setStoredNickname(nickname: string): void {
  localStorage.setItem(NICKNAME_KEY, nickname.trim());
}

/** 随机生成昵称（形容词 + 名词） */
const ADJECTIVES = ["晴朗", "微风", "远行", "拾光", "路过", "漫游", "静默", "浮云", "星野", "山间"];
const NOUNS = ["旅人", "过客", "看客", "路人", "行者", "观者", "访客", "路人甲", "小透明", "过路人"];

export function randomNickname(): string {
  const a = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const b = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  return `${a}的${b}`;
}

export { api };

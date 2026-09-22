"use client";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { SessionUser } from "@/lib/auth";

interface Ctx { user: SessionUser | null; loading: boolean; refresh: () => Promise<void>; theme: "dark" | "light"; setTheme: (t: "dark" | "light") => void; toast: (m: string) => void; }
const C = createContext<Ctx>({ user: null, loading: true, refresh: async () => {}, theme: "dark", setTheme: () => {}, toast: () => {} });
export const useApp = () => useContext(C);

export default function Providers({ children, initialUser }: { children: React.ReactNode; initialUser: SessionUser | null }) {
  const [user, setUser] = useState<SessionUser | null>(initialUser);
  const [loading, setLoading] = useState(false);
  const [theme, setThemeState] = useState<"dark" | "light">("dark");
  const [toasts, setToasts] = useState<{ id: number; m: string }[]>([]);
  useEffect(() => {
    const t = (localStorage.getItem("lk_theme") as "dark" | "light") || "dark";
    setThemeState(t); document.documentElement.classList.toggle("dark", t === "dark");
  }, []);
  const setTheme = (t: "dark" | "light") => { setThemeState(t); localStorage.setItem("lk_theme", t); document.documentElement.classList.toggle("dark", t === "dark"); };
  const refresh = useCallback(async () => { setLoading(true); try { const r = await fetch("/api/auth/me", { cache: "no-store" }); const j = await r.json(); setUser(j.user); } finally { setLoading(false); } }, []);
  const toast = (m: string) => { const id = Date.now() + Math.random(); setToasts((t) => [...t, { id, m }]); setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200); };
  return (
    <C.Provider value={{ user, loading, refresh, theme, setTheme, toast }}>
      {children}
      <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => <div key={t.id} className="paper rounded-full px-4 py-2 text-sm fade shadow-lg">{t.m}</div>)}
      </div>
    </C.Provider>
  );
}

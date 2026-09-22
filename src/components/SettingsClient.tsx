"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Gate from "@/components/Gate";
import { useApp } from "@/components/Providers";
import { useRouter } from "next/navigation";
export default function Settings() {
  const { user, theme, setTheme, toast, refresh } = useApp(); const router = useRouter();
  const [s, setS] = useState<Record<string, unknown>>({ analytics: true, voiceLearning: true, defaultMode: "default", defaultLanguage: "auto" }); const [plan, setPlan] = useState("free"); const [provider, setProvider] = useState<{ provider: string; model: string; live: boolean } | null>(null);
  useEffect(() => { if (user) fetch("/api/profile").then((r) => r.json()).then((j) => { setS((x) => ({ ...x, ...j.profile.settings })); setPlan(j.plan); }); fetch("/api/ai").then((r) => r.json()).then(setProvider).catch(() => {}); }, [user]);
  const save = async () => { await fetch("/api/profile", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ settings: s }) }); toast("Settings saved."); };
  const logout = async () => { await fetch("/api/auth/logout", { method: "POST" }); await refresh(); router.push("/"); };
  return (
    <Gate>
      <main className="mx-auto max-w-3xl px-4 md:px-6 py-10 space-y-6">
        <div><div className="eyebrow">Settings</div><h1 className="mt-2 text-4xl">Your space, your rules.</h1></div>
        <section className="card p-5 space-y-3"><div className="serif text-xl">Appearance</div><div className="flex gap-2">{(["dark", "light"] as const).map((t) => <button key={t} onClick={() => setTheme(t)} className={`chip ${theme === t ? "chip-on" : ""}`}>{t === "dark" ? "Midnight (dark)" : "Paper (light)"}</button>)}</div></section>
        <section className="card p-5 space-y-3"><div className="serif text-xl">AI preferences</div>
          <div className="grid sm:grid-cols-2 gap-3"><div><label className="label">Default mode</label><select className="input" value={String(s.defaultMode)} onChange={(e) => setS({ ...s, defaultMode: e.target.value })}><option value="default">Balanced</option><option value="raw">RAW</option><option value="literary">LITERARY</option></select></div><div><label className="label">Default language</label><select className="input" value={String(s.defaultLanguage)} onChange={(e) => setS({ ...s, defaultLanguage: e.target.value })}><option value="auto">Auto</option><option value="hindi">Hindi</option><option value="english">English</option><option value="hinglish">Hinglish</option></select></div></div>
          <label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={!!s.voiceLearning} onChange={(e) => setS({ ...s, voiceLearning: e.target.checked })} /> Let Likhakriti learn my voice from my pages (<Link href="/voice" className="text-gold">view / edit</Link>)</label>
          <p className="text-xs text-ink-3">Model: {provider ? `${provider.provider} · ${provider.model}${provider.live ? " · falls back to the offline engine if the provider is unavailable" : " (offline heuristic engine — add OPENROUTER_API_KEY for full AI)"}` : "…"}</p>
        </section>
        <section className="card p-5 space-y-3"><div className="serif text-xl">Privacy</div>
          <label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={!!s.analytics} onChange={(e) => setS({ ...s, analytics: e.target.checked })} /> Allow anonymous product analytics (feature usage counts only — never your writing)</label>
          <p className="text-xs text-ink-3">Journal entries and private pages are never shown to other users or to admins. Your writing is only sent to the AI provider when you ask Likhakriti something.</p>
        </section>
        <section className="card p-5 space-y-2"><div className="serif text-xl">Account</div><p className="text-sm text-ink-2">{user?.email} · plan: <b>{plan}</b>{user?.role === "admin" && <> · <Link href="/admin" className="text-gold">Admin dashboard</Link></>}</p><p className="text-xs text-ink-3">Creator, Pro and Studio plans are being prepared. Nothing is paywalled today.</p><div className="flex gap-2 pt-2"><button onClick={save} className="btn btn-gold btn-sm">Save settings</button><button onClick={logout} className="btn btn-ghost btn-sm">Sign out</button></div></section>
      </main>
    </Gate>
  );
}

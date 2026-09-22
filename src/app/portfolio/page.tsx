"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Gate from "@/components/Gate";
import { useApp } from "@/components/Providers";
interface Prof { username: string; display_name: string; bio: string; avatar_url: string; links: Record<string, string>; is_public: number; }
export default function PortfolioSettings() {
  const { user, toast, refresh } = useApp(); const [p, setP] = useState<Prof | null>(null); const [err, setErr] = useState<string | null>(null);
  useEffect(() => { if (user) fetch("/api/profile").then((r) => r.json()).then((j) => setP({ username: j.profile.username || "", display_name: j.profile.display_name || "", bio: j.profile.bio || "", avatar_url: j.profile.avatar_url || "", links: j.profile.links || {}, is_public: j.profile.is_public })); }, [user]);
  const save = async () => { if (!p) return; setErr(null); const r = await fetch("/api/profile", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...p, is_public: !!p.is_public }) }); const j = await r.json(); if (!r.ok) { setErr(j.error); return; } toast("Portfolio saved."); refresh(); };
  if (!p) return <Gate><div className="p-10 text-ink-3">Opening your portfolio…</div></Gate>;
  const setLink = (k: string, v: string) => setP({ ...p, links: { ...p.links, [k]: v } });
  return (
    <Gate>
      <main className="mx-auto max-w-3xl px-4 md:px-6 py-10">
        <div className="eyebrow">Portfolio</div><h1 className="mt-2 text-4xl">Your public writer page.</h1>
        <p className="text-ink-3 mt-2">Public URL: <span className="text-gold">/@{p.username || "username"}</span> {p.is_public ? <Link className="underline ml-2" href={`/u/${p.username}`}>open →</Link> : <span className="ml-2">(private — turn on below)</span>}</p>
        <div className="card p-5 mt-8 space-y-4">
          <label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={!!p.is_public} onChange={(e) => setP({ ...p, is_public: e.target.checked ? 1 : 0 })} /> Make my portfolio public</label>
          <div className="grid sm:grid-cols-2 gap-3"><div><label className="label">Username</label><input className="input" value={p.username} onChange={(e) => setP({ ...p, username: e.target.value.toLowerCase() })} /></div><div><label className="label">Display name</label><input className="input" value={p.display_name} onChange={(e) => setP({ ...p, display_name: e.target.value })} /></div></div>
          <div><label className="label">Bio</label><textarea className="input" rows={3} value={p.bio} onChange={(e) => setP({ ...p, bio: e.target.value })} placeholder="Two honest lines." /></div>
          <div><label className="label">Avatar URL</label><input className="input" value={p.avatar_url} onChange={(e) => setP({ ...p, avatar_url: e.target.value })} /></div>
          <div className="grid sm:grid-cols-2 gap-3">{["instagram", "x", "youtube", "website", "linkedin", "email"].map((k) => <div key={k}><label className="label">{k}</label><input className="input" value={p.links[k] || ""} onChange={(e) => setLink(k, e.target.value)} placeholder="https://" /></div>)}</div>
          {err && <p className="text-sm" style={{ color: "var(--danger)" }}>{err}</p>}
          <button onClick={save} className="btn btn-gold">Save portfolio</button>
        </div>
        <p className="text-xs text-ink-3 mt-4">Only pieces set to <b>public</b> in the editor appear on your portfolio. Featured work is your most recent publication.</p>
      </main>
    </Gate>
  );
}

"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Gate from "@/components/Gate";
import Logo from "@/components/Logo";
import { useApp } from "@/components/Providers";
import type { Doc } from "@/lib/repo";
import { Plus, Trash2 } from "lucide-react";

const MICRO = ["Write what words struggle to say.", "Don't write perfectly. Write honestly.", "Let the thought breathe.", "Some feelings arrive before language.", "AI can suggest a word. Only you know what it means."];
export default function Dashboard() {
  const { user, toast } = useApp(); const [docs, setDocs] = useState<Doc[]>([]); const [streak, setStreak] = useState(0); const [loaded, setLoaded] = useState(false);
  useEffect(() => { if (!user) return; Promise.all([fetch("/api/documents").then((r) => r.json()), fetch("/api/journal").then((r) => r.json())]).then(([d, j]) => { setDocs(d.documents || []); setStreak(j.streak || 0); setLoaded(true); }); }, [user]);
  const del = async (id: string) => { if (!confirm("Delete this page? It can't be undone.")) return; await fetch(`/api/documents/${id}`, { method: "DELETE" }); setDocs((d) => d.filter((x) => x.id !== id)); toast("Deleted."); };
  const line = MICRO[new Date().getDate() % MICRO.length];
  return (
    <Gate>
      <main className="mx-auto max-w-6xl px-4 md:px-6 py-10">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div><Logo size={22} href={null} /><h1 className="mt-3 text-3xl md:text-4xl">Hello{user?.display_name ? `, ${user.display_name}` : ""}.</h1><p className="text-ink-3 mt-1 serif italic text-lg">{line}</p></div>
          <Link href="/editor" className="btn btn-gold"><Plus size={14} /> New page</Link>
        </div>
        <div className="mt-8 grid sm:grid-cols-3 gap-3 text-sm">
          <div className="card p-4"><div className="label">Pages</div><div className="serif text-3xl">{docs.length}</div></div>
          <div className="card p-4"><div className="label">Words written</div><div className="serif text-3xl">{docs.reduce((n, d) => n + d.word_count, 0).toLocaleString()}</div></div>
          <div className="card p-4"><div className="label">Journal streak</div><div className="serif text-3xl">{streak} <span className="text-base text-ink-3">day{streak === 1 ? "" : "s"}</span></div></div>
        </div>
        <div className="mt-8 flex flex-wrap gap-2 text-xs">{[["/studio", "AI Studio"], ["/poetry", "Poetry"], ["/lab", "Poetry Lab"], ["/journal", "Journal"], ["/journey", "My Writing Journey"], ["/voice", "My Voice"], ["/author", "Author Mode"], ["/creator", "Creator Mode"], ["/seo", "SEO"], ["/portfolio", "Portfolio"]].map(([h, l]) => <Link key={h} href={h} className="chip">{l}</Link>)}</div>
        <div className="mt-10"><div className="label">Your pages</div>
          {loaded && !docs.length && <div className="card p-10 text-center"><p className="serif text-2xl">Your first line is still waiting.</p><Link href="/editor" className="btn btn-ghost mt-4">Open a page</Link></div>}
          <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">{docs.map((d) => <li key={d.id} className="card p-4 group relative"><Link href={`/editor?id=${d.id}`} className="block"><div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-ink-3"><span>{d.kind}</span><span>·</span><span>{d.visibility}</span></div><div className="mt-1 serif text-xl truncate">{d.title || "Untitled"}</div><p className={`mt-1 text-sm text-ink-3 line-clamp-3 whitespace-pre-wrap ${/[\u0900-\u097F]/.test(d.body) ? "hi" : ""}`}>{d.body || "—"}</p><div className="mt-2 text-xs text-ink-3">{d.word_count} words · {new Date(d.updated_at).toLocaleDateString()}</div></Link><button onClick={() => del(d.id)} className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 text-ink-3 hover:text-danger"><Trash2 size={13} /></button></li>)}</ul>
        </div>
      </main>
    </Gate>
  );
}

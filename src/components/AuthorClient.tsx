"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Gate from "@/components/Gate";
import { useApp } from "@/components/Providers";
import type { Project } from "@/lib/repo";
import { Plus } from "lucide-react";
export default function Author() {
  const { user } = useApp(); const [list, setList] = useState<Project[]>([]); const [title, setTitle] = useState(""); const [loaded, setLoaded] = useState(false);
  const load = () => fetch("/api/projects").then((r) => r.json()).then((j) => { setList(j.projects || []); setLoaded(true); });
  useEffect(() => { if (user) load(); }, [user]);
  const add = async () => { if (!title.trim()) return; await fetch("/api/projects", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ title }) }); setTitle(""); load(); };
  return (
    <Gate>
      <main className="mx-auto max-w-4xl px-4 md:px-6 py-10">
        <div className="eyebrow">Author Mode</div><h1 className="mt-2 text-4xl">For the long work.</h1><p className="text-ink-3 mt-2">Books, chapters, characters, symbols, continuity — organised without being bureaucratic.</p>
        <div className="mt-8 flex gap-2"><input className="input" placeholder="Working title" value={title} onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} /><button onClick={add} className="btn btn-gold"><Plus size={14} /> New book</button></div>
        {loaded && !list.length && <div className="card p-10 text-center mt-8"><p className="serif text-2xl">Every book begins as an unfinished thought.</p></div>}
        <ul className="mt-8 grid sm:grid-cols-2 gap-3">{list.map((p) => <li key={p.id}><Link href={`/author/${p.id}`} className="card p-5 block hover:border-gold"><div className="text-[10px] uppercase tracking-widest text-ink-3">{p.kind}</div><div className="serif text-2xl">{p.title}</div><p className="text-sm text-ink-3 mt-1 line-clamp-2">{p.description || "No description yet."}</p></Link></li>)}</ul>
      </main>
    </Gate>
  );
}

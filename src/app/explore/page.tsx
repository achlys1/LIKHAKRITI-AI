"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useApp } from "@/components/Providers";
const CATS = [["all", "All"], ["poem", "Poetry"], ["micro", "Micro Poetry"], ["story", "Stories"], ["essay", "Essays"], ["thought", "Thoughts"], ["hindi", "Hindi"], ["english", "English"], ["hinglish", "Hinglish"], ["experimental", "Experimental"]];
interface Item { id: string; title: string; body: string; kind: string; language: string; slug: string; username: string | null; display_name: string | null; published_at: number; }
export default function Explore() {
  const { user } = useApp(); const [cat, setCat] = useState("all"); const [sort, setSort] = useState<"new" | "trending" | "picks" | "following">("new"); const [items, setItems] = useState<Item[]>([]); const [loaded, setLoaded] = useState(false);
  useEffect(() => { setLoaded(false); if (sort === "following") { if (!user) { setItems([]); setLoaded(true); return; } fetch("/api/bookmarks").then((r) => r.json()).then((j) => { setItems(j.bookmarks || []); setLoaded(true); }); return; } fetch(`/api/explore?category=${cat}&sort=${sort}`).then((r) => r.json()).then((j) => { setItems(j.items || []); setLoaded(true); }); }, [cat, sort, user]);
  return (
    <main className="mx-auto max-w-6xl px-4 md:px-6 py-10">
      <div className="eyebrow">Explore</div><h1 className="mt-2 text-4xl">Read what others dared to write.</h1><p className="text-ink-3 mt-2">Discovery, not comparison. No follower counts here.</p>
      <div className="mt-6 flex flex-wrap gap-1.5">{CATS.map(([k, l]) => <button key={k} onClick={() => setCat(k)} className={`chip ${cat === k ? "chip-on" : ""}`}>{l}</button>)}</div>
      <div className="mt-3 flex gap-1.5">{(["new", "trending", "picks", "following"] as const).map((s) => <button key={s} onClick={() => setSort(s)} className={`chip ${sort === s ? "chip-on" : ""}`}>{s === "picks" ? "Editor's Picks" : s === "following" ? "Saved" : s[0].toUpperCase() + s.slice(1)}</button>)}</div>
      {loaded && !items.length && <div className="card p-12 text-center mt-8"><p className="serif text-2xl">{sort === "following" ? (user ? "Nothing saved yet. Bookmark what stays with you." : "Sign in to keep the pieces that stay with you.") : "The shelf is quiet right now."}</p><p className="text-ink-3 mt-2">{sort !== "following" && "Be the first to publish something here."}</p><Link href="/editor" className="btn btn-ghost mt-4">Write something</Link></div>}
      <div className="mt-8 columns-1 sm:columns-2 lg:columns-3 gap-4 [&>*]:break-inside-avoid">{items.map((it) => <Link key={it.id} href={`/p/${it.slug}`} className="card p-5 mb-4 block hover:border-gold transition-colors"><div className="text-[10px] uppercase tracking-widest text-ink-3">{it.kind} · {it.language}</div><div className="serif text-xl mt-1">{it.title || "Untitled"}</div><p className={`poem !text-[15px] mt-2 line-clamp-6 text-ink-2 ${/[\u0900-\u097F]/.test(it.body) ? "hi" : ""}`}>{it.body}</p><div className="mt-3 text-xs text-ink-3">{it.display_name || it.username || "anonymous"}{it.username ? ` · @${it.username}` : ""}</div></Link>)}</div>
    </main>
  );
}

"use client";
import { useEffect, useMemo, useState } from "react";
import Gate from "@/components/Gate";
import { useApp } from "@/components/Providers";
import type { JournalEntry } from "@/lib/repo";
import { Star, Trash2, Search } from "lucide-react";
import Link from "next/link";

const MOODS = ["calm", "heavy", "hopeful", "restless", "grateful", "tired", "tender", "numb", "alive"];
const PROMPTS = ["What did today ask of you?", "One thing you noticed and didn't say.", "Where was your attention most of the day?", "A sound from today.", "What are you carrying into tomorrow?", "Who did you think about, and why now?", "Aaj kaunsi baat adhoori reh gayi?", "Something small that was enough."];
export default function Journal() {
  const { user, toast } = useApp();
  const [entries, setEntries] = useState<JournalEntry[]>([]); const [streak, setStreak] = useState(0); const [q, setQ] = useState("");
  const [body, setBody] = useState(""); const [mood, setMood] = useState(""); const [day, setDay] = useState(new Date().toISOString().slice(0, 10)); const [editing, setEditing] = useState<string | null>(null);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const load = async () => { const r = await fetch(`/api/journal${q ? `?q=${encodeURIComponent(q)}` : ""}`); const j = await r.json(); setEntries(j.entries || []); setStreak(j.streak || 0); };
  useEffect(() => { if (user) load(); }, [user, q]); // eslint-disable-line react-hooks/exhaustive-deps
  const save = async () => { if (!body.trim()) return; const r = await fetch("/api/journal", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: editing || undefined, body, mood, day }) }); if (r.ok) { setBody(""); setMood(""); setEditing(null); toast("Kept."); load(); } };
  const del = async (id: string) => { await fetch("/api/journal", { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ id }) }); load(); };
  const fav = async (e: JournalEntry) => { await fetch("/api/journal", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...e, favorite: e.favorite ? 0 : 1 }) }); load(); };
  const prompt = PROMPTS[new Date().getDate() % PROMPTS.length];
  const days = useMemo(() => new Set(entries.map((e) => e.day)), [entries]);
  const [y, m] = month.split("-").map(Number); const first = new Date(y, m - 1, 1).getDay(); const count = new Date(y, m, 0).getDate();
  return (
    <Gate title="The journal is private." note="Sign in to write today's sentence.">
      <main className="mx-auto max-w-5xl px-4 md:px-6 py-10 grid lg:grid-cols-12 gap-8">
        <section className="lg:col-span-7">
          <div className="eyebrow">Journal</div>
          <h1 className="mt-2 text-4xl">Maybe today deserves a sentence.</h1>
          <p className="mt-2 serif italic text-ink-3 text-lg">{prompt}</p>
          <textarea className={`input editor-area !text-lg mt-6 min-h-[180px] ${/[\u0900-\u097F]/.test(body) ? "hi" : ""}`} placeholder="Nothing written here yet…" value={body} onChange={(e) => setBody(e.target.value)} />
          <div className="mt-3 flex flex-wrap gap-1.5 items-center">{MOODS.map((mo) => <button key={mo} onClick={() => setMood(mood === mo ? "" : mo)} className={`chip ${mood === mo ? "chip-on" : ""}`}>{mo}</button>)}<input type="date" className="chip bg-transparent ml-auto" value={day} onChange={(e) => setDay(e.target.value)} /></div>
          <div className="mt-4 flex gap-2"><button onClick={save} disabled={!body.trim()} className="btn btn-gold">{editing ? "Update" : "Keep it"}</button>{editing && <button onClick={() => { setEditing(null); setBody(""); setMood(""); }} className="btn btn-ghost">Cancel</button>}<Link href={`/studio?text=${encodeURIComponent(body)}`} className="btn btn-ghost">Turn into a poem</Link></div>
          <div className="mt-10 flex items-center gap-2"><Search size={14} className="text-ink-3" /><input className="bg-transparent outline-none text-sm flex-1" placeholder="Search your entries" value={q} onChange={(e) => setQ(e.target.value)} /></div>
          <ul className="mt-4 space-y-3">{entries.map((e) => <li key={e.id} className="card p-4 group"><div className="flex items-center gap-2 text-xs text-ink-3"><span>{e.day}</span>{e.mood && <span className="chip !py-0">{e.mood}</span>}<span className="ml-auto flex gap-1 opacity-60 group-hover:opacity-100"><button onClick={() => fav(e)} title="Favourite"><Star size={13} className={e.favorite ? "text-gold fill-gold" : ""} /></button><button onClick={() => { setEditing(e.id); setBody(e.body); setMood(e.mood); setDay(e.day); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="text-xs">edit</button><button onClick={() => del(e.id)}><Trash2 size={13} /></button></span></div><p className={`mt-2 whitespace-pre-wrap text-[15px] leading-relaxed ${/[\u0900-\u097F]/.test(e.body) ? "hi" : ""}`}>{e.body}</p></li>)}{!entries.length && <li className="text-sm text-ink-3">Nothing written here yet. Maybe today deserves a sentence.</li>}</ul>
        </section>
        <aside className="lg:col-span-5 space-y-4">
          <div className="card p-4"><div className="label">Streak</div><div className="serif text-3xl">{streak} day{streak === 1 ? "" : "s"}</div><p className="text-xs text-ink-3 mt-1">No badges. Just a quiet count.</p></div>
          <div className="card p-4"><div className="flex items-center justify-between"><div className="label !mb-0">Calendar</div><input type="month" className="bg-transparent text-xs" value={month} onChange={(e) => setMonth(e.target.value)} /></div>
            <div className="mt-3 grid grid-cols-7 gap-1 text-center text-xs">{["S", "M", "T", "W", "T", "F", "S"].map((d, i) => <div key={i} className="text-ink-3">{d}</div>)}{Array.from({ length: first }).map((_, i) => <div key={"e" + i} />)}{Array.from({ length: count }).map((_, i) => { const key = `${month}-${String(i + 1).padStart(2, "0")}`; return <button key={key} onClick={() => setDay(key)} className={`aspect-square rounded-md flex items-center justify-center ${days.has(key) ? "bg-gold text-black" : "border hairline"} ${day === key ? "ring-1 ring-gold" : ""}`}>{i + 1}</button>; })}</div></div>
          <div className="card p-4"><div className="label">Favourites</div><ul className="space-y-2 text-sm">{entries.filter((e) => e.favorite).slice(0, 5).map((e) => <li key={e.id} className="line-clamp-2 text-ink-2">{e.body}</li>)}{!entries.some((e) => e.favorite) && <li className="text-xs text-ink-3">Star an entry to keep it close.</li>}</ul></div>
          <Link href="/journey" className="card p-4 block hover:border-gold"><div className="label">My Writing Journey</div><p className="text-sm text-ink-2">First poem. First rejection. The August memory. Keep the milestones →</p></Link>
        </aside>
      </main>
    </Gate>
  );
}

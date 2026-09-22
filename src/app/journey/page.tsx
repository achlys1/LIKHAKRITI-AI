"use client";
import { useEffect, useState } from "react";
import Gate from "@/components/Gate";
import { useApp } from "@/components/Providers";
import type { Memory } from "@/lib/repo";
import { Trash2 } from "lucide-react";
const KINDS = ["First poem", "First published poem", "Favorite line", "First rejection", "First competition", "Writing milestone", "A memory", "Other"];
export default function Journey() {
  const { user } = useApp(); const [items, setItems] = useState<Memory[]>([]); const [title, setTitle] = useState(""); const [note, setNote] = useState(""); const [kind, setKind] = useState(KINDS[0]); const [on, setOn] = useState(new Date().toISOString().slice(0, 10));
  const load = () => fetch("/api/memories").then((r) => r.json()).then((j) => setItems(j.memories || []));
  useEffect(() => { if (user) load(); }, [user]);
  const add = async () => { if (!title.trim()) return; await fetch("/api/memories", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ title, note, kind, happened_on: on }) }); setTitle(""); setNote(""); load(); };
  const del = async (id: string) => { await fetch("/api/memories", { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ id }) }); load(); };
  return (
    <Gate>
      <main className="mx-auto max-w-4xl px-4 md:px-6 py-10">
        <div className="eyebrow">Memory & Reflection</div><h1 className="mt-2 text-4xl">My Writing Journey</h1><p className="text-ink-3 mt-2">The moments that made you a writer — kept, not scored.</p>
        <div className="card p-4 mt-8 grid md:grid-cols-[1fr_1fr_auto] gap-2"><input className="input" placeholder="Title — e.g. First poem" value={title} onChange={(e) => setTitle(e.target.value)} /><input className="input" placeholder="A note (optional)" value={note} onChange={(e) => setNote(e.target.value)} /><div className="flex gap-2"><select className="input" value={kind} onChange={(e) => setKind(e.target.value)}>{KINDS.map((k) => <option key={k}>{k}</option>)}</select><input type="date" className="input" value={on} onChange={(e) => setOn(e.target.value)} /><button onClick={add} className="btn btn-gold">Add</button></div></div>
        <ol className="mt-10 relative border-l hairline ml-3 space-y-8">{items.map((m) => <li key={m.id} className="ml-6 relative group"><span className="absolute -left-[31px] top-1.5 h-3 w-3 rounded-full bg-gold" /><div className="text-xs text-ink-3">{m.happened_on} · {m.kind}</div><div className="serif text-2xl">{m.title}</div>{m.note && <p className="text-ink-2 mt-1">{m.note}</p>}<button onClick={() => del(m.id)} className="absolute right-0 top-0 opacity-0 group-hover:opacity-100 text-ink-3 hover:text-danger"><Trash2 size={13} /></button></li>)}{!items.length && <li className="ml-6 text-ink-3">Every journey begins with a first line. Add yours.</li>}</ol>
      </main>
    </Gate>
  );
}

"use client";
import { use, useEffect, useState } from "react";
import Link from "next/link";
import Gate from "@/components/Gate";
import { useApp } from "@/components/Providers";
import { useAI } from "@/lib/useAI";
import AIOutput from "@/components/AIOutput";
import { exportPdf } from "@/lib/export";
import type { Doc, Project } from "@/lib/repo";
type Meta = { characters: string; themes: string; symbols: string; notes: string; dedication?: string; foreword?: string; authorNote?: string };
export default function Book({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params); const { user, toast } = useApp();
  const [p, setP] = useState<Project | null>(null); const [chapters, setChapters] = useState<Doc[]>([]); const [meta, setMeta] = useState<Meta>({ characters: "", themes: "", symbols: "", notes: "" });
  const [tab, setTab] = useState<"chapters" | "notes" | "front" | "export">("chapters"); const [blank, setBlank] = useState(0); const ai = useAI(); const [ask, setAsk] = useState("");
  const load = () => fetch(`/api/projects/${id}`).then((r) => r.json()).then((j) => { if (j.project) { setP(j.project); setChapters(j.chapters || []); setMeta({ characters: "", themes: "", symbols: "", notes: "", ...JSON.parse(j.project.meta_json || "{}") }); } });
  useEffect(() => { if (user) load(); }, [user]); // eslint-disable-line react-hooks/exhaustive-deps
  const saveMeta = async (m: Meta, patch: Partial<Project> = {}) => { setMeta(m); await fetch(`/api/projects/${id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...patch, meta_json: JSON.stringify(m) }) }); };
  const addChapter = async () => { const r = await fetch("/api/documents", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ kind: "chapter", project_id: id, title: `Chapter ${chapters.length + 1}` }) }); const j = await r.json(); if (j.document) location.href = `/editor?id=${j.document.id}`; };
  const context = () => `Book: ${p?.title}\n${p?.description ? `About: ${p.description}\n` : ""}Characters: ${meta.characters}\nThemes: ${meta.themes}\nSymbols: ${meta.symbols}\nChapters: ${chapters.map((c) => `${c.title} (${c.word_count} words)`).join("; ")}`;
  const run = (instruction: string, extra = "") => ai.run({ task: "author", input: context() + (extra ? `\n\n${extra}` : ""), instruction });
  if (!p) return <Gate><div className="p-10 text-ink-3">Opening the manuscript…</div></Gate>;
  return (
    <Gate>
      <main className="mx-auto max-w-6xl px-4 md:px-6 py-10 grid lg:grid-cols-12 gap-8">
        <section className="lg:col-span-7">
          <Link href="/author" className="text-xs text-ink-3 hover:text-gold">← Books</Link>
          <input className="bg-transparent outline-none serif text-4xl w-full mt-2" value={p.title} onChange={(e) => setP({ ...p, title: e.target.value })} onBlur={() => saveMeta(meta, { title: p.title })} />
          <textarea className="input mt-3" rows={2} placeholder="What is this book really about, beneath the plot?" value={p.description} onChange={(e) => setP({ ...p, description: e.target.value })} onBlur={() => saveMeta(meta, { description: p.description })} />
          <div className="mt-5 flex gap-1.5">{(["chapters", "notes", "front", "export"] as const).map((t) => <button key={t} onClick={() => setTab(t)} className={`chip ${tab === t ? "chip-on" : ""}`}>{t === "front" ? "front matter" : t}</button>)}</div>
          {tab === "chapters" && <div className="mt-5 space-y-2">{chapters.map((c, i) => <Link key={c.id} href={`/editor?id=${c.id}`} className="card p-4 flex items-center gap-3 hover:border-gold"><span className="serif text-2xl text-ink-3 w-8">{i + 1}</span><div className="flex-1"><div className="serif text-xl">{c.title || "Untitled"}</div><div className="text-xs text-ink-3">{c.word_count} words · {new Date(c.updated_at).toLocaleDateString()}</div></div></Link>)}<button onClick={addChapter} className="btn btn-ghost w-full">+ New chapter</button>{!chapters.length && <p className="text-sm text-ink-3 text-center mt-3">Chapter one is the hardest. It only needs to exist.</p>}<div className="text-xs text-ink-3 text-right">{chapters.reduce((n, c) => n + c.word_count, 0).toLocaleString()} words total</div></div>}
          {tab === "notes" && <div className="mt-5 space-y-3">{(["characters", "themes", "symbols", "notes"] as const).map((k) => <div key={k}><label className="label">{k === "characters" ? "Characters (want / fear / lie / object)" : k === "symbols" ? "Recurring symbols (track how they change)" : k}</label><textarea className="input" rows={4} value={meta[k]} onChange={(e) => setMeta({ ...meta, [k]: e.target.value })} onBlur={() => saveMeta(meta)} /></div>)}</div>}
          {tab === "front" && <div className="mt-5 space-y-3">{(["dedication", "foreword", "authorNote"] as const).map((k) => <div key={k}><div className="flex items-center justify-between"><label className="label">{k === "authorNote" ? "Author's note" : k}</label><button onClick={() => run(`Draft a ${k === "authorNote" ? "short author's note" : k} for this book. Short, specific, no thanks-to-everyone.`)} className="text-xs text-gold">draft with Likhakriti</button></div><textarea className="input" rows={k === "dedication" ? 2 : 5} value={meta[k] || ""} onChange={(e) => setMeta({ ...meta, [k]: e.target.value })} onBlur={() => saveMeta(meta)} /></div>)}</div>}
          {tab === "export" && <div className="mt-5 card p-5 space-y-3"><p className="text-sm text-ink-2">Professional manuscript layout — cover, front matter, chapters in order.</p><label className="text-sm flex items-center gap-2">Blank reflection pages at the end: <input type="number" min={0} max={20} className="input !w-20 !py-1" value={blank} onChange={(e) => setBlank(+e.target.value)} /></label><button onClick={async () => { const full = await Promise.all(chapters.map((c) => fetch(`/api/documents/${c.id}`).then((r) => r.json()).then((j) => j.document as Doc))); const front = [meta.dedication && { title: "", body: meta.dedication }, meta.foreword && { title: "Foreword", body: meta.foreword }, meta.authorNote && { title: "Author's Note", body: meta.authorNote }].filter(Boolean) as { title: string; body: string }[]; exportPdf(p.title, "", user?.display_name || undefined, { manuscript: true, blankPages: blank, chapters: [...front, ...full.map((d) => ({ title: d.title, body: d.body }))] }); }} className="btn btn-gold">Export manuscript (PDF)</button><p className="text-xs text-ink-3">Individual chapters export to DOCX/TXT/MD from the editor.</p></div>}
        </section>
        <aside className="lg:col-span-5 space-y-3">
          <div className="card p-4 space-y-3"><div className="serif text-xl">Likhakriti, Author Engine</div>
            <div className="flex flex-wrap gap-1.5">{[["Plan the book", "Help me plan this book: parts, chapter arc, what each part must change."], ["Chapter plan", "Propose the next three chapters with one-line purposes."], ["Continuity check", "List continuity risks across the chapters and what to track."], ["Title ideas", "Give me 7 title options that don't summarise the plot."], ["Symbols", "Suggest how the recurring symbols should change by the end."]].map(([l, i]) => <button key={l} onClick={() => run(i)} className="chip">{l}</button>)}</div>
            <div className="flex gap-2"><input className="input !py-2 text-sm" placeholder="Ask anything about the manuscript…" value={ask} onChange={(e) => setAsk(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && ask.trim()) { run(ask); setAsk(""); } }} /><button onClick={() => { if (ask.trim()) { run(ask); setAsk(""); } }} className="btn btn-gold btn-sm">Ask</button></div>
            <AIOutput text={ai.text} busy={ai.busy} error={ai.error} onStop={ai.stop} onRegenerate={() => ai.regenerate()} compact saveKind="note" />
            {ai.text && !ai.busy && tab === "front" && <button onClick={() => { toast("Paste it into the field you want — nothing is overwritten automatically."); }} className="text-xs text-ink-3">Use it? Copy and paste — I never overwrite your front matter.</button>}
          </div>
        </aside>
      </main>
    </Gate>
  );
}

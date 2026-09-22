"use client";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, X, RotateCcw, History, Download, Share2, Globe, Maximize2, Minimize2, Undo2, Redo2, Sparkles, Image as ImageIcon, FileText, Copy } from "lucide-react";
import { useApp } from "@/components/Providers";
import { useAI } from "@/lib/useAI";
import type { AIOptions, Task } from "@/lib/ai/types";
import { detectLanguage, readingTime } from "@/lib/ai/textstats";
import { exportDocx, exportPdf, exportText } from "@/lib/export";
import type { Doc } from "@/lib/repo";
import Link from "next/link";

interface Suggestion { orig: string; sug: string; why: string; }
function parseSuggestions(t: string): Suggestion[] {
  const out: Suggestion[] = [];
  const re = /Original:\s*\n([\s\S]*?)\n\s*Suggestion:\s*\n([\s\S]*?)\n\s*Why:\s*\n([\s\S]*?)(?=\n\s*(?:———|Original:|Revised:|Raw Refined:)|$)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(t))) out.push({ orig: m[1].trim(), sug: m[2].trim(), why: m[3].trim() });
  return out;
}

function Editor() {
  const sp = useSearchParams(); const router = useRouter(); const { user, toast } = useApp();
  const [doc, setDoc] = useState<Partial<Doc>>({ title: "", body: sp.get("text") || "", kind: "poem", visibility: "draft", language: "auto", tags_json: "[]", keep_imperfections: 0 });
  const [saving, setSaving] = useState<"idle" | "saving" | "saved" | "local">("idle");
  const [focus, setFocus] = useState(false);
  const [panel, setPanel] = useState<"ai" | "versions" | "publish" | "art" | null>("ai");
  const [versions, setVersions] = useState<{ id: string; label: string; created_at: number; body: string }[]>([]);
  const [opts, setOpts] = useState<AIOptions>({ mode: "default" });
  const [aiTask, setAiTask] = useState<Task>("refine");
  const [instruction, setInstruction] = useState("");
  const [sel, setSel] = useState("");
  const [art, setArt] = useState<string | null>(null);
  const [artBusy, setArtBusy] = useState(false);
  const ai = useAI();
  const undo = useRef<string[]>([]); const redo = useRef<string[]>([]);
  const ta = useRef<HTMLTextAreaElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const id = sp.get("id");

  useEffect(() => {
    if (id && user) fetch(`/api/documents/${id}`).then((r) => r.json()).then((j) => { if (j.document) setDoc(j.document); else toast(j.error || "Couldn't open that page."); });
    else if (!id) { const local = localStorage.getItem("lk_draft"); if (local && !sp.get("text")) setDoc((d) => ({ ...d, ...JSON.parse(local) })); }
  }, [id, user]); // eslint-disable-line react-hooks/exhaustive-deps

  const persist = useCallback(async (next: Partial<Doc>, snapshot = false) => {
    if (!user) { localStorage.setItem("lk_draft", JSON.stringify({ title: next.title, body: next.body, kind: next.kind })); setSaving("local"); return; }
    setSaving("saving");
    try {
      if (next.id) { const r = await fetch(`/api/documents/${next.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...next, _snapshot: snapshot }) }); const j = await r.json(); if (j.document) setDoc((d) => ({ ...d, slug: j.document.slug, published_at: j.document.published_at, updated_at: j.document.updated_at })); }
      else { const r = await fetch("/api/documents", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(next) }); const j = await r.json(); if (j.document) { setDoc((d) => ({ ...d, id: j.document.id })); router.replace(`/editor?id=${j.document.id}`); } }
      setSaving("saved");
    } catch { setSaving("idle"); toast("Autosave paused — check your connection."); }
  }, [user, router, toast]);

  const update = (patch: Partial<Doc>, snapshot = false) => {
    setDoc((d) => { const next = { ...d, ...patch }; if (timer.current) clearTimeout(timer.current); timer.current = setTimeout(() => persist(next, snapshot), 900); return next; });
  };
  const setBody = (b: string, snapshot = false) => { undo.current.push(doc.body || ""); if (undo.current.length > 100) undo.current.shift(); redo.current = []; update({ body: b }, snapshot); };
  const doUndo = () => { const p = undo.current.pop(); if (p === undefined) return; redo.current.push(doc.body || ""); update({ body: p }); };
  const doRedo = () => { const p = redo.current.pop(); if (p === undefined) return; undo.current.push(doc.body || ""); update({ body: p }); };

  const body = doc.body || "";
  const stats = useMemo(() => ({ words: (body.match(/\S+/g) || []).length, chars: body.length, read: readingTime(body), lang: detectLanguage(body) }), [body]);
  const suggestions = useMemo(() => parseSuggestions(ai.text), [ai.text]);
  const revised = useMemo(() => { const m = ai.text.match(/(?:Revised|Raw Refined):\s*\n([\s\S]*)$/); return m ? m[1].replace(/\n\n———[\s\S]*$/, "").trim() : null; }, [ai.text]);

  const runAI = (task: Task = aiTask) => { const input = sel && (task === "why" || task === "rewrite" || task === "deepen") ? sel : body; if (!input.trim()) { toast("Write something first."); return; } setAiTask(task); ai.run({ task, input, instruction, options: { ...opts, keepImperfections: !!doc.keep_imperfections || opts.keepImperfections }, documentTitle: doc.title || undefined }); };
  const accept = (s: Suggestion) => { if (!body.includes(s.orig)) { toast("That passage changed already."); return; } setBody(body.replace(s.orig, s.sug), true); toast("Accepted — your version is saved in history."); };
  const loadVersions = async () => { if (!doc.id) return; const r = await fetch(`/api/documents/${doc.id}/versions`); const j = await r.json(); setVersions(j.versions || []); };
  const share = async () => { if (!doc.slug) { toast("Publish or unlist first to get a link."); return; } const url = `${location.origin}/p/${doc.slug}`; await navigator.clipboard.writeText(url); toast("Link copied."); };
  const makeArt = async () => { setArtBusy(true); try { const r = await fetch("/api/image", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text: body }) }); const j = await r.json(); setArt(j.url); } finally { setArtBusy(false); } };
  const isHi = /[\u0900-\u097F]/.test(body);

  return (
    <main className={`mx-auto max-w-7xl px-4 md:px-6 py-6 ${focus ? "focus-mode" : ""}`}>
      <div className="chrome flex flex-wrap items-center gap-2 mb-4 no-print">
        <input className="bg-transparent outline-none serif text-2xl md:text-3xl flex-1 min-w-[200px]" placeholder="Untitled" value={doc.title || ""} onChange={(e) => update({ title: e.target.value })} />
        <span className="text-xs text-ink-3">{saving === "saving" ? "saving…" : saving === "saved" ? "saved" : saving === "local" ? "saved locally · sign in to keep it" : ""}</span>
        <button onClick={doUndo} className="btn btn-ghost !p-2" title="Undo"><Undo2 size={14} /></button>
        <button onClick={doRedo} className="btn btn-ghost !p-2" title="Redo"><Redo2 size={14} /></button>
        <button onClick={() => setFocus((f) => !f)} className="btn btn-ghost !p-2" title="Focus mode">{focus ? <Minimize2 size={14} /> : <Maximize2 size={14} />}</button>
        <button onClick={() => { setPanel("versions"); loadVersions(); }} className={`btn btn-ghost btn-sm ${panel === "versions" ? "!border-gold !text-gold" : ""}`}><History size={13} /> History</button>
        <button onClick={() => setPanel("publish")} className={`btn btn-ghost btn-sm ${panel === "publish" ? "!border-gold !text-gold" : ""}`}><Globe size={13} /> Publish</button>
        <button onClick={() => setPanel("art")} className={`btn btn-ghost btn-sm ${panel === "art" ? "!border-gold !text-gold" : ""}`}><ImageIcon size={13} /> Artwork</button>
        <button onClick={() => setPanel("ai")} className={`btn btn-gold btn-sm ${panel === "ai" ? "" : "opacity-80"}`}><Sparkles size={13} /> Likhakriti</button>
      </div>

      <div className={`grid gap-6 ${panel ? "lg:grid-cols-12" : ""}`}>
        <section className={panel ? "lg:col-span-7" : ""}>
          <textarea ref={ta} className={`w-full bg-transparent outline-none editor-area min-h-[60vh] ${isHi ? "hi" : ""}`} placeholder="Write what words struggle to say." value={body} onChange={(e) => setBody(e.target.value)} onBlur={() => persist({ ...doc, body }, true)} onSelect={(e) => { const t = e.currentTarget; setSel(t.value.slice(t.selectionStart, t.selectionEnd).trim()); }} spellCheck lang={stats.lang === "hindi" ? "hi" : "en"} />
          <div className="chrome mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-3 no-print">
            <span>{stats.words} words</span><span>{stats.chars} chars</span><span>{stats.read} min read</span><span>{stats.lang}</span>
            <label className="flex items-center gap-1.5 cursor-pointer"><input type="checkbox" checked={!!doc.keep_imperfections} onChange={(e) => update({ keep_imperfections: e.target.checked ? 1 : 0 })} /> Keep my imperfections</label>
            <select className="bg-transparent" value={doc.kind} onChange={(e) => update({ kind: e.target.value })}><option value="poem">poem</option><option value="micro">micro poetry</option><option value="story">story</option><option value="essay">essay</option><option value="thought">thought</option><option value="lyrics">lyrics</option><option value="article">article</option></select>
            <span className="ml-auto flex gap-2">
              <button onClick={() => exportText(doc.title || "untitled", body, "txt")} className="hover:text-gold flex items-center gap-1"><Download size={12} /> TXT</button>
              <button onClick={() => exportText(doc.title || "untitled", body, "md")} className="hover:text-gold flex items-center gap-1"><FileText size={12} /> MD</button>
              <button onClick={() => exportDocx(doc.title || "untitled", body, user?.display_name || undefined)} className="hover:text-gold flex items-center gap-1"><Download size={12} /> DOCX</button>
              <button onClick={() => exportPdf(doc.title || "untitled", body, user?.display_name || undefined)} className="hover:text-gold flex items-center gap-1"><Download size={12} /> PDF</button>
              <button onClick={() => { navigator.clipboard.writeText(body); toast("Copied."); }} className="hover:text-gold flex items-center gap-1"><Copy size={12} /> Copy</button>
              <button onClick={share} className="hover:text-gold flex items-center gap-1"><Share2 size={12} /> Share</button>
            </span>
          </div>
        </section>

        {panel && (
          <aside className="lg:col-span-5 chrome no-print space-y-4">
            {panel === "ai" && (
              <div className="card p-4 space-y-3">
                <div className="flex flex-wrap gap-1.5">{(["refine", "rewrite", "humanize", "deepen", "simplify", "continue", "analyze", "first_reader", "why", "title"] as Task[]).map((t) => <button key={t} onClick={() => setAiTask(t)} className={`chip ${aiTask === t ? "chip-on" : ""}`}>{t === "first_reader" ? "First Reader" : t === "why" ? "Why this line" : t}</button>)}</div>
                <div className="flex flex-wrap gap-1.5 text-xs">{(["default", "raw", "literary"] as const).map((m) => <button key={m} onClick={() => setOpts({ ...opts, mode: m })} className={`chip ${(opts.mode || "default") === m ? "chip-on" : ""}`}>{m === "default" ? "Balanced" : m.toUpperCase()}</button>)}<label className="chip" style={opts.brutal ? { borderColor: "var(--danger)", color: "var(--danger)" } : {}}><input type="checkbox" className="mr-1" checked={!!opts.brutal} onChange={(e) => setOpts({ ...opts, brutal: e.target.checked })} />Brutal</label></div>
                {sel && <p className="text-xs text-ink-3">Selected: “{sel.slice(0, 80)}{sel.length > 80 ? "…" : ""}” — <em>why</em>, <em>rewrite</em> and <em>deepen</em> will use the selection.</p>}
                <input className="input !py-2 text-xs" placeholder="Notes — e.g. keep my metaphor" value={instruction} onChange={(e) => setInstruction(e.target.value)} />
                <div className="flex gap-2"><button onClick={() => runAI()} disabled={ai.busy} className="btn btn-gold btn-sm">Ask Likhakriti</button>{ai.busy && <button onClick={ai.stop} className="btn btn-ghost btn-sm">Stop</button>}{ai.text && !ai.busy && <button onClick={() => ai.regenerate()} className="btn btn-ghost btn-sm"><RotateCcw size={12} /> Try again</button>}</div>
                {ai.error && <p className="text-xs" style={{ color: "var(--danger)" }}>{ai.error}</p>}
                {suggestions.length > 0 && (
                  <div className="space-y-3">
                    {suggestions.map((s, i) => (
                      <div key={i} className="rounded-xl border hairline p-3 text-sm space-y-2">
                        <div><div className="label !mb-1">Original</div><div className={`whitespace-pre-wrap text-ink-2 ${isHi ? "hi" : ""}`}>{s.orig}</div></div>
                        <div><div className="label !mb-1">Suggestion</div><div className={`whitespace-pre-wrap ${isHi ? "hi" : ""}`}>{s.sug}</div></div>
                        <div><div className="label !mb-1">Why</div><div className="text-ink-3 text-xs">{s.why}</div></div>
                        <div className="flex gap-2 pt-1"><button onClick={() => accept(s)} className="btn btn-primary btn-sm"><Check size={12} /> Accept</button><button onClick={() => ai.setText(ai.text.replace(`Original:\n${s.orig}`, "Original (rejected):\n" + s.orig))} className="btn btn-ghost btn-sm"><X size={12} /> Reject</button><button onClick={() => runAI(aiTask)} className="btn btn-ghost btn-sm"><RotateCcw size={12} /> Try again</button></div>
                      </div>
                    ))}
                    {revised && <div className="rounded-xl border hairline p-3 text-sm"><div className="flex items-center justify-between"><div className="label !mb-1">{opts.mode === "raw" ? "Raw Refined" : "Revised"} (compare)</div><button onClick={() => { setBody(revised, true); toast("Replaced — original kept in history."); }} className="btn btn-ghost btn-sm">Use whole revision</button></div><div className={`whitespace-pre-wrap poem !text-base ${isHi ? "hi" : ""}`}>{revised}</div></div>}
                  </div>
                )}
                {(ai.text || ai.busy) && !suggestions.length && <div className={`streaming-text text-sm ${ai.busy ? "ink-dot" : ""} ${/[\u0900-\u097F]/.test(ai.text) ? "hi" : ""}`}>{ai.text}</div>}
                {ai.text && !ai.busy && !suggestions.length && aiTask === "continue" && <button onClick={() => setBody(body + "\n" + ai.text.replace(/\n\n\(Continuation only[\s\S]*$/, ""), true)} className="btn btn-ghost btn-sm">Append to my piece</button>}
              </div>
            )}
            {panel === "versions" && (
              <div className="card p-4"><div className="label">Version history</div>{!user && <p className="text-xs text-ink-3">Sign in to keep a history of your drafts.</p>}<ul className="space-y-2 max-h-[60vh] overflow-auto">{versions.map((v) => <li key={v.id} className="rounded-lg border hairline p-3 text-xs"><div className="flex justify-between text-ink-3"><span>{v.label}</span><span>{new Date(v.created_at).toLocaleString()}</span></div><div className={`mt-1 line-clamp-3 whitespace-pre-wrap text-ink-2 ${isHi ? "hi" : ""}`}>{v.body}</div><button onClick={() => { setBody(v.body, true); toast("Restored."); }} className="mt-2 text-gold">Restore</button></li>)}{user && !versions.length && <li className="text-xs text-ink-3">No versions yet. Each meaningful change is kept here.</li>}</ul></div>
            )}
            {panel === "publish" && (
              <div className="card p-4 space-y-3">
                <div className="label">Publish</div>
                {!user ? <p className="text-sm text-ink-3">Sign in to publish. Drafts stay on this device until then.</p> : (
                  <>
                    <input className="input" placeholder="Subtitle (optional)" value={doc.subtitle || ""} onChange={(e) => update({ subtitle: e.target.value })} />
                    <input className="input" placeholder="Tags, comma separated — e.g. poetry, hindi, nostalgia" defaultValue={JSON.parse(doc.tags_json || "[]").join(", ")} onBlur={(e) => update({ tags_json: JSON.stringify(e.target.value.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean)) })} />
                    <div className="grid grid-cols-2 gap-2"><select className="input" value={doc.language} onChange={(e) => update({ language: e.target.value })}><option value="auto">Language: auto ({stats.lang})</option><option value="hindi">Hindi</option><option value="english">English</option><option value="hinglish">Hinglish</option><option value="bilingual">Bilingual</option></select><input className="input" placeholder="Theme (e.g. nostalgia)" value={doc.theme || ""} onChange={(e) => update({ theme: e.target.value })} /></div>
                    <input className="input" placeholder="Cover image URL (optional)" value={doc.cover_url || ""} onChange={(e) => update({ cover_url: e.target.value })} />
                    <div className="flex flex-wrap gap-1.5">{(["draft", "private", "unlisted", "public"] as const).map((v) => <button key={v} onClick={() => { const lang = doc.language === "auto" ? stats.lang : doc.language; update({ visibility: v, language: lang }, true); if (v === "public") toast("Published. Your words are out in the world."); }} className={`chip ${doc.visibility === v ? "chip-on" : ""}`}>{v}</button>)}</div>
                    {doc.slug && doc.visibility !== "draft" && doc.visibility !== "private" && <p className="text-xs text-ink-3">Link: <Link className="text-gold" href={`/p/${doc.slug}`}>/p/{doc.slug}</Link></p>}
                    <Link href={`/studio?task=social&text=${encodeURIComponent(body)}`} className="btn btn-ghost btn-sm">Publish Everywhere →</Link>
                  </>
                )}
              </div>
            )}
            {panel === "art" && (
              <div className="card p-4 space-y-3"><div className="label">Poem → artwork</div><p className="text-xs text-ink-3">Atmospheric, no text overlay. Cinematic / moonlit / ink & paper.</p><button onClick={makeArt} disabled={artBusy || !body.trim()} className="btn btn-gold btn-sm">{artBusy ? "Mixing the ink…" : "Create artwork"}</button>{art && <><div className="rounded-xl overflow-hidden border hairline">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={art} alt="Artwork for your poem" className="w-full" /></div><div className="flex gap-2"><a href={art} download="likhakriti-art.svg" className="btn btn-ghost btn-sm">Download</a><button onClick={() => update({ cover_url: art })} className="btn btn-ghost btn-sm">Use as cover</button></div></>}</div>
            )}
          </aside>
        )}
      </div>
    </main>
  );
}
export default function EditorClient() { return <Suspense fallback={<div className="p-10 text-ink-3">Opening the page…</div>}><Editor /></Suspense>; }

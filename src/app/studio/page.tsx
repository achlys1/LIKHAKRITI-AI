"use client";
import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Send, Square, RefreshCw, Copy, Save, Trash2, MessageSquare, Plus, Pencil } from "lucide-react";
import Logo from "@/components/Logo";
import ModeBar from "@/components/ModeBar";
import AIOutput from "@/components/AIOutput";
import { useApp } from "@/components/Providers";
import { useAI } from "@/lib/useAI";
import type { AIOptions, ChatMessage, Task } from "@/lib/ai/types";

const TASKS: { id: Task; label: string; hint: string }[] = [
  { id: "chat", label: "Chat", hint: "Talk it through. \"I don't know what I'm feeling.\"" },
  { id: "write", label: "Write", hint: "Generate original writing from an idea." },
  { id: "continue", label: "Continue", hint: "Continue your unfinished piece in your voice." },
  { id: "rewrite", label: "Rewrite", hint: "Rewrite without destroying the emotion." },
  { id: "refine", label: "Refine", hint: "Grammar, rhythm, clarity, word choice." },
  { id: "humanize", label: "Humanize", hint: "Remove robotic, generic AI language." },
  { id: "deepen", label: "Deepen", hint: "More depth, no fake complexity." },
  { id: "simplify", label: "Simplify", hint: "More natural, more readable." },
  { id: "translate", label: "Translate", hint: "Preserve emotion across languages." },
  { id: "analyze", label: "Analyze", hint: "Emotion, imagery, metaphor, rhythm, originality." },
  { id: "why", label: "Why this line", hint: "Why does this line work?" },
  { id: "first_reader", label: "First Reader", hint: "Reader feedback, not editor feedback." },
  { id: "title", label: "Title", hint: "Meaningful titles." },
  { id: "caption", label: "Caption", hint: "Social captions in your voice." },
  { id: "social", label: "Publish Everywhere", hint: "One poem → every platform." },
  { id: "prompt", label: "Prompt", hint: "Writing prompts." },
  { id: "idea", label: "Idea", hint: "Random thought → writing concepts." },
];
const QUICK = ["I don't know what I'm feeling.", "Turn this thought into a poem.", "Does this line sound forced?", "Make it darker but not depressing.", "Give me three endings.", "Be brutally honest.", "Translate this into Hindi but preserve the emotion.", "Explain why this poem works."];

function Studio() {
  const sp = useSearchParams();
  const { user, toast } = useApp();
  const [task, setTask] = useState<Task>((sp.get("task") as Task) || "chat");
  const [opts, setOpts] = useState<AIOptions>({ mode: (sp.get("mode") as AIOptions["mode"]) || "default", language: "auto" });
  const [input, setInput] = useState(sp.get("text") || "");
  const [instruction, setInstruction] = useState("");
  const [target, setTarget] = useState("hindi");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [convId, setConvId] = useState<string | null>(null);
  const [convs, setConvs] = useState<{ id: string; title: string; updated_at: number }[]>([]);
  const ai = useAI();
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (user) fetch("/api/conversations").then((r) => r.json()).then((j) => setConvs(j.conversations || [])).catch(() => {}); }, [user]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, ai.text]);

  const sendChat = async () => {
    const content = input.trim(); if (!content || ai.busy) return;
    const next = [...messages, { role: "user" as const, content }];
    setMessages(next); setInput("");
    const full = await ai.run({ task: "chat", input: content, options: opts, history: next.slice(0, -1) });
    const done = [...next, { role: "assistant" as const, content: full }];
    setMessages(done); ai.setText("");
    if (user) { const r = await fetch("/api/conversations", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: convId, messages: done, title: done[0].content.slice(0, 60) }) }); const j = await r.json(); if (j.id) { setConvId(j.id); if (!convId) setConvs((c) => [{ id: j.id, title: done[0].content.slice(0, 60), updated_at: Date.now() }, ...c]); } }
  };
  const runTask = () => { if (!input.trim() && task !== "prompt") return; ai.run({ task, input, instruction, options: { ...opts, targetLanguage: task === "translate" ? target : undefined } }); };
  const loadConv = async (id: string) => { const r = await fetch(`/api/conversations?id=${id}`); const j = await r.json(); if (j.conversation) { setMessages(j.conversation.messages); setConvId(id); setTask("chat"); } };
  const delConv = async (id: string) => { await fetch("/api/conversations", { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ id }) }); setConvs((c) => c.filter((x) => x.id !== id)); if (convId === id) { setMessages([]); setConvId(null); } };
  const newChat = () => { setMessages([]); setConvId(null); ai.setText(""); };
  const saveMsg = async (t: string) => { if (!user) { toast("Sign in to save."); return; } await fetch("/api/documents", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ kind: "poem", body: t }) }); toast("Saved to your pages."); };

  const cur = TASKS.find((t) => t.id === task)!;
  return (
    <main className="mx-auto max-w-7xl px-4 md:px-6 py-6 md:py-10 grid lg:grid-cols-12 gap-6">
      <aside className="lg:col-span-3 space-y-5">
        <div className="flex items-center gap-2"><Logo size={22} href={null} /><span className="text-xs text-ink-3">AI Studio</span></div>
        <div>
          <div className="label">Modes</div>
          <div className="flex flex-wrap gap-1.5">{TASKS.map((t) => <button key={t.id} onClick={() => { setTask(t.id); ai.setText(""); }} className={`chip ${task === t.id ? "chip-on" : ""}`}>{t.label}</button>)}</div>
          <p className="mt-2 text-xs text-ink-3">{cur.hint}</p>
        </div>
        {user && task === "chat" && (
          <div>
            <div className="flex items-center justify-between"><div className="label !mb-0">Conversations</div><button onClick={newChat} className="text-xs text-gold flex items-center gap-1"><Plus size={12} /> New</button></div>
            <ul className="mt-2 space-y-1 max-h-64 overflow-auto">{convs.map((c) => <li key={c.id} className={`group flex items-center gap-2 text-xs rounded-lg px-2 py-1.5 hover:bg-bg-2 ${convId === c.id ? "bg-bg-2" : ""}`}><button onClick={() => loadConv(c.id)} className="flex-1 text-left truncate flex items-center gap-1.5"><MessageSquare size={11} className="shrink-0" />{c.title || "Untitled"}</button><button onClick={() => delConv(c.id)} className="opacity-0 group-hover:opacity-100 text-ink-3 hover:text-danger"><Trash2 size={11} /></button></li>)}{!convs.length && <li className="text-xs text-ink-3">No conversations yet. The first one is always the strangest.</li>}</ul>
          </div>
        )}
        {!user && <div className="card p-4 text-xs text-ink-3">You&apos;re in demo mode. <a href="/signup" className="text-gold">Create a space</a> to save work and let Likhakriti learn your voice.</div>}
      </aside>

      <section className="lg:col-span-9 flex flex-col min-h-[70vh]">
        <div className="mb-4"><ModeBar opts={opts} onChange={setOpts} /></div>
        {task === "chat" ? (
          <>
            <div className="flex-1 space-y-4 overflow-auto pb-4">
              {!messages.length && !ai.busy && (
                <div className="card p-6 md:p-8">
                  <p className="serif text-2xl md:text-3xl">Bring a line, a feeling, or a half-thought.</p>
                  <p className="mt-2 text-ink-3">I&apos;m Likhakriti AI. I don&apos;t write for you — I write with you.</p>
                  <div className="mt-5 flex flex-wrap gap-2">{QUICK.map((q) => <button key={q} onClick={() => setInput(q)} className="chip">{q}</button>)}</div>
                </div>
              )}
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[92%] md:max-w-[80%] rounded-2xl px-4 py-3 ${m.role === "user" ? "bg-blue text-[#f1ebdd]" : "card"}`}>
                    <div className={`streaming-text text-[15px] ${/[\u0900-\u097F]/.test(m.content) ? "hi" : ""}`}>{m.content}</div>
                    {m.role === "assistant" && <div className="mt-2 flex gap-1 no-print"><button className="text-ink-3 hover:text-gold p-1" title="Copy" onClick={() => { navigator.clipboard.writeText(m.content); toast("Copied."); }}><Copy size={12} /></button><button className="text-ink-3 hover:text-gold p-1" title="Save" onClick={() => saveMsg(m.content)}><Save size={12} /></button><a className="text-ink-3 hover:text-gold p-1" title="Open in editor" href={`/editor?text=${encodeURIComponent(m.content)}`}><Pencil size={12} /></a>{i === messages.length - 1 && <button className="text-ink-3 hover:text-gold p-1" title="Regenerate" onClick={async () => { const hist = messages.slice(0, -1); setMessages(hist); const full = await ai.run({ task: "chat", input: hist[hist.length - 1].content, options: opts, history: hist.slice(0, -1) }); setMessages([...hist, { role: "assistant", content: full }]); ai.setText(""); }}><RefreshCw size={12} /></button>}</div>}
                  </div>
                </div>
              ))}
              {ai.busy && <div className="flex justify-start"><div className="max-w-[80%] card rounded-2xl px-4 py-3"><div className={`streaming-text text-[15px] ink-dot ${/[\u0900-\u097F]/.test(ai.text) ? "hi" : ""}`}>{ai.text}</div></div></div>}
              {ai.error && <p className="text-sm" style={{ color: "var(--danger)" }}>{ai.error}</p>}
              <div ref={endRef} />
            </div>
            <div className="sticky bottom-16 lg:bottom-4 card p-2 flex items-end gap-2">
              <textarea className={`flex-1 bg-transparent outline-none px-3 py-2 text-[15px] resize-none max-h-48 ${/[\u0900-\u097F]/.test(input) ? "hi" : ""}`} rows={Math.min(6, Math.max(1, input.split("\n").length))} placeholder="Write here… (Enter to send, Shift+Enter for a new line)" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendChat(); } }} />
              {ai.busy ? <button onClick={ai.stop} className="btn btn-ghost !p-2.5 rounded-full"><Square size={15} /></button> : <button onClick={sendChat} disabled={!input.trim()} className="btn btn-gold !p-2.5 rounded-full"><Send size={15} /></button>}
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <textarea className={`input editor-area !text-lg min-h-[180px] ${/[\u0900-\u097F]/.test(input) ? "hi" : ""}`} placeholder={task === "prompt" ? "Optional: a theme for the prompts…" : task === "why" ? "Paste the line…" : "Paste your writing or your idea…"} value={input} onChange={(e) => setInput(e.target.value)} />
            <div className="grid md:grid-cols-[1fr_auto] gap-3">
              <input className="input" placeholder="Notes for Likhakriti (optional) — e.g. keep my metaphor, don't change my words too much" value={instruction} onChange={(e) => setInstruction(e.target.value)} />
              {task === "translate" && <select className="input md:w-44" value={target} onChange={(e) => setTarget(e.target.value)}><option value="hindi">→ Hindi</option><option value="english">→ English</option><option value="hinglish">→ Hinglish</option><option value="urdu">→ Urdu</option><option value="bengali">→ Bengali</option><option value="marathi">→ Marathi</option><option value="tamil">→ Tamil</option><option value="spanish">→ Spanish</option><option value="french">→ French</option></select>}
            </div>
            <div className="flex gap-2"><button onClick={runTask} disabled={ai.busy || (!input.trim() && task !== "prompt")} className="btn btn-gold">{cur.label}</button>{ai.busy && <button onClick={ai.stop} className="btn btn-ghost"><Square size={13} /> Stop</button>}</div>
            <AIOutput text={ai.text} busy={ai.busy} error={ai.error} onStop={ai.stop} onRegenerate={() => ai.regenerate()} onInsert={(t) => { location.href = `/editor?text=${encodeURIComponent(t)}`; }} />
          </div>
        )}
      </section>
    </main>
  );
}
export default function Page() { return <Suspense fallback={<div className="p-10 text-ink-3">Opening the studio…</div>}><Studio /></Suspense>; }

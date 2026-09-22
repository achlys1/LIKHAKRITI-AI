"use client";
import { useState } from "react";
import { useAI } from "@/lib/useAI";
import AIOutput from "@/components/AIOutput";
import ModeBar from "@/components/ModeBar";
import type { AIOptions } from "@/lib/ai/types";

const FORMS = ["free verse", "rhyming", "ghazal-inspired", "nazm-inspired", "haiku-inspired", "prose poetry", "micro poetry", "spoken word"];
const TONES = ["philosophical", "romantic", "nostalgic", "nature", "existential", "motivational", "melancholic", "experimental"];
export default function Poetry() {
  const [seed, setSeed] = useState(""); const [form, setForm] = useState("free verse"); const [tone, setTone] = useState(""); const [rhyme, setRhyme] = useState<"auto" | "yes" | "no">("auto");
  const [opts, setOpts] = useState<AIOptions>({ mode: "default", language: "auto" }); const [notes, setNotes] = useState("");
  const ai = useAI();
  const go = () => ai.run({ task: "poem", input: seed, instruction: notes, options: { ...opts, form, tone: tone || undefined, rhyme } });
  const isHi = /[\u0900-\u097F]/.test(seed);
  return (
    <main className="mx-auto max-w-4xl px-4 md:px-6 py-10">
      <div className="eyebrow">Poetry Engine</div>
      <h1 className="mt-3 text-4xl md:text-5xl">Write what words struggle to say.</h1>
      <p className="mt-2 text-ink-3">Give me a sentence, a memory, a metaphor you refuse to lose. I&apos;ll keep it.</p>
      <textarea className={`input editor-area !text-lg mt-8 min-h-[140px] ${isHi ? "hi" : ""}`} placeholder="बारिश आई और मुझे उसकी याद आ गई।  /  the light stays on in a room no one enters" value={seed} onChange={(e) => setSeed(e.target.value)} />
      <div className="mt-5 space-y-4">
        <div><div className="label">Form</div><div className="flex flex-wrap gap-1.5">{FORMS.map((f) => <button key={f} onClick={() => setForm(f)} className={`chip ${form === f ? "chip-on" : ""}`}>{f}</button>)}</div></div>
        <div><div className="label">Register (optional)</div><div className="flex flex-wrap gap-1.5">{TONES.map((t) => <button key={t} onClick={() => setTone(tone === t ? "" : t)} className={`chip ${tone === t ? "chip-on" : ""}`}>{t}</button>)}</div></div>
        <div className="flex flex-wrap items-center gap-4"><div><div className="label">Rhyme</div><div className="flex gap-1.5">{(["auto", "yes", "no"] as const).map((r) => <button key={r} onClick={() => setRhyme(r)} className={`chip ${rhyme === r ? "chip-on" : ""}`}>{r === "auto" ? "infer from my text" : r === "yes" ? "rhyme" : "no rhyme"}</button>)}</div></div></div>
        <ModeBar opts={opts} onChange={setOpts} />
        <input className="input" placeholder="Notes — e.g. keep the rain metaphor, don't resolve the ending" value={notes} onChange={(e) => setNotes(e.target.value)} />
        <div className="flex gap-2"><button onClick={go} disabled={!seed.trim() || ai.busy} className="btn btn-gold">Write the poem</button></div>
      </div>
      <div className="mt-6"><AIOutput text={ai.text} busy={ai.busy} error={ai.error} onStop={ai.stop} onRegenerate={() => ai.regenerate()} onInsert={(t) => { location.href = `/editor?text=${encodeURIComponent(t)}`; }} /></div>
    </main>
  );
}

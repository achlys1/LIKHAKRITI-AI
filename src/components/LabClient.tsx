"use client";
import { useState } from "react";
import { useAI } from "@/lib/useAI";
import AIOutput from "@/components/AIOutput";

const EXPERIMENTS = ["metaphors", "opening lines", "endings", "titles", "imagery", "rhyme schemes", "contrasts", "symbols", "perspective", "literary devices"];
const DIRS = ["Memory", "Loss", "Reunion", "Childhood", "Silence", "Hope", "Regret"];
export default function Lab() {
  const [seed, setSeed] = useState("Rain reminds me of someone."); const [exp, setExp] = useState("metaphors"); const [dir, setDir] = useState<string | null>(null);
  const ai = useAI(); const poem = useAI();
  return (
    <main className="mx-auto max-w-4xl px-4 md:px-6 py-10">
      <div className="eyebrow">Poetry Lab</div>
      <h1 className="mt-3 text-4xl md:text-5xl">One seed. Many doors.</h1>
      <p className="mt-2 text-ink-3">Experiment before you commit. You choose the emotional direction.</p>
      <textarea className={`input editor-area !text-lg mt-8 ${/[\u0900-\u097F]/.test(seed) ? "hi" : ""}`} rows={2} value={seed} onChange={(e) => setSeed(e.target.value)} />
      <div className="mt-4"><div className="label">Experiment with</div><div className="flex flex-wrap gap-1.5">{EXPERIMENTS.map((e) => <button key={e} onClick={() => setExp(e)} className={`chip ${exp === e ? "chip-on" : ""}`}>{e}</button>)}</div></div>
      <button onClick={() => { setDir(null); poem.setText(""); ai.run({ task: "lab", input: seed, instruction: exp }); }} disabled={!seed.trim() || ai.busy} className="btn btn-gold mt-5">Open the directions</button>
      <div className="mt-6"><AIOutput text={ai.text} busy={ai.busy} error={ai.error} onStop={ai.stop} onRegenerate={() => ai.regenerate()} compact /></div>
      {ai.text && !ai.busy && (
        <div className="mt-8 card p-5">
          <div className="label">Choose a direction</div>
          <div className="flex flex-wrap gap-1.5">{DIRS.map((d) => <button key={d} onClick={() => { setDir(d); poem.run({ task: "poem", input: seed, options: { direction: d, form: exp === "rhyme schemes" ? "rhyming" : "free verse" }, instruction: `Explore through ${exp}. Direction: ${d}.` }); }} className={`chip ${dir === d ? "chip-on" : ""}`}>{d}</button>)}</div>
          <div className="mt-4"><AIOutput text={poem.text} busy={poem.busy} error={poem.error} onStop={poem.stop} onRegenerate={() => poem.regenerate()} onInsert={(t) => { location.href = `/editor?text=${encodeURIComponent(t)}`; }} /></div>
        </div>
      )}
    </main>
  );
}

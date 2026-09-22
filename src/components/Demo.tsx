"use client";
import { useState } from "react";
import { useAI } from "@/lib/useAI";
import AIOutput from "./AIOutput";
import type { Task } from "@/lib/ai/types";

const SEEDS = ["बारिश आई और मुझे उसकी याद आ गई।", "I keep the light on in a room no one enters.", "Chai thandi ho gayi, main phone dekhta raha."];
const ACTIONS: { label: string; task: Task; mode?: "raw" | "literary" }[] = [
  { label: "Write it", task: "poem" }, { label: "Deepen it", task: "deepen" }, { label: "Make it raw", task: "poem", mode: "raw" }, { label: "Make it poetic", task: "poem", mode: "literary" }, { label: "Explore the metaphor", task: "lab" },
];
export default function Demo() {
  const [seed, setSeed] = useState(SEEDS[0]);
  const [picked, setPicked] = useState<string | null>(null);
  const ai = useAI();
  const go = (a: (typeof ACTIONS)[number]) => { setPicked(a.label); ai.run({ task: a.task, input: seed, options: { mode: a.mode || "default" } }); };
  return (
    <div className="card p-5 md:p-7">
      <div className="eyebrow mb-3">Try it — no account needed</div>
      <div className="flex flex-wrap gap-2 mb-4">
        {SEEDS.map((s) => <button key={s} onClick={() => { setSeed(s); ai.setText(""); setPicked(null); }} className={`chip ${seed === s ? "chip-on" : ""} ${/[\u0900-\u097F]/.test(s) ? "hi" : ""}`}>{s}</button>)}
      </div>
      <textarea className={`input editor-area !text-lg ${/[\u0900-\u097F]/.test(seed) ? "hi" : ""}`} rows={2} value={seed} onChange={(e) => setSeed(e.target.value)} />
      <div className="mt-4 flex items-start gap-3">
        <div className="mt-1 h-2 w-2 rounded-full bg-gold shrink-0" />
        <p className="serif text-lg text-ink-2 italic">There&apos;s already a poem hiding inside that sentence.</p>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {ACTIONS.map((a) => <button key={a.label} onClick={() => go(a)} className={`btn btn-sm ${picked === a.label ? "btn-gold" : "btn-ghost"}`}>{a.label}</button>)}
      </div>
      <div className="mt-5"><AIOutput text={ai.text} busy={ai.busy} error={ai.error} onStop={ai.stop} onRegenerate={() => ai.regenerate()} compact /></div>
    </div>
  );
}

"use client";
import { useState } from "react";
import { useAI } from "@/lib/useAI";
import AIOutput from "@/components/AIOutput";
const SERVICES: { id: string; label: string; fields: string[]; instruction: string }[] = [
  { id: "web", label: "Website content", fields: ["Business / product", "Audience", "Tone", "Pages needed"], instruction: "Write website copy: headline options, subhead, 3 value sections, a CTA. Human, specific, no buzzwords." },
  { id: "blog", label: "Blog post", fields: ["Topic", "Audience", "Angle / opinion", "Target length"], instruction: "Write a blog post outline then the full draft. Open with a concrete scene or claim, not a definition." },
  { id: "seo", label: "SEO content", fields: ["Topic", "Primary keyword", "Audience", "Competitor angle"], instruction: "Write an SEO-aware article draft: title, meta, H2s, body — keywords placed only where a human would say them." },
  { id: "product", label: "Product descriptions", fields: ["Product", "Key features", "Buyer", "Price tier"], instruction: "Write 3 product descriptions: short (30 words), medium (80), long (150). Benefits before features. No superlatives." },
  { id: "docs", label: "Documentation", fields: ["Product / API", "Task the reader is doing", "Prerequisites", "Gotchas"], instruction: "Write clear technical documentation: overview, prerequisites, steps, examples, troubleshooting. Second person, imperative." },
  { id: "tech", label: "Technical writing", fields: ["Subject", "Reader's level", "Goal", "Constraints"], instruction: "Write a precise technical explainer. Define terms once, use one running example, end with a summary table in text." },
  { id: "social", label: "Social media writing", fields: ["Brand / person", "Platform(s)", "Campaign goal", "Voice notes"], instruction: "Write a week of posts (7) for the platform(s). Vary formats: story, tip, question, quote, behind-the-scenes." },
  { id: "proof", label: "Proofreading", fields: ["Paste the text", "Style guide (optional)"], instruction: "Proofread: list every correction as Original / Suggestion / Why, then the clean text. Do not change voice." },
  { id: "edit", label: "Editing", fields: ["Paste the text", "What kind of edit (line / structural / tone)", "Audience"], instruction: "Edit as requested. Show significant changes as Original / Suggestion / Why, then the full edit." },
];
export default function Creator() {
  const [svc, setSvc] = useState(SERVICES[0]); const [vals, setVals] = useState<Record<string, string>>({}); const ai = useAI();
  const go = () => ai.run({ task: "creator", input: svc.fields.map((f) => `${f}: ${vals[f] || "—"}`).join("\n"), instruction: svc.instruction, options: { mode: "humanize" } });
  return (
    <main className="mx-auto max-w-5xl px-4 md:px-6 py-10">
      <div className="eyebrow">Creator / Freelancer Mode</div><h1 className="mt-2 text-4xl">Professional writing, still human.</h1><p className="text-ink-3 mt-2">Templates and workflows for client work. Humanize is on by default.</p>
      <div className="mt-6 flex flex-wrap gap-1.5">{SERVICES.map((s) => <button key={s.id} onClick={() => { setSvc(s); ai.setText(""); }} className={`chip ${svc.id === s.id ? "chip-on" : ""}`}>{s.label}</button>)}</div>
      <div className="mt-6 grid lg:grid-cols-2 gap-6">
        <div className="card p-5 space-y-3">{svc.fields.map((f) => f.startsWith("Paste") ? <div key={f}><label className="label">{f}</label><textarea className="input" rows={8} value={vals[f] || ""} onChange={(e) => setVals({ ...vals, [f]: e.target.value })} /></div> : <div key={f}><label className="label">{f}</label><input className="input" value={vals[f] || ""} onChange={(e) => setVals({ ...vals, [f]: e.target.value })} /></div>)}<button onClick={go} disabled={ai.busy} className="btn btn-gold">Draft it</button></div>
        <div><AIOutput text={ai.text} busy={ai.busy} error={ai.error} onStop={ai.stop} onRegenerate={() => ai.regenerate()} saveKind="article" onInsert={(t) => { location.href = `/editor?text=${encodeURIComponent(t)}`; }} />{!ai.text && !ai.busy && <div className="card p-8 text-ink-3 text-sm">Fill the brief on the left. The draft appears here — then send it to the editor.</div>}</div>
      </div>
    </main>
  );
}

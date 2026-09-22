"use client";
import { useState } from "react";
import { useAI } from "@/lib/useAI";
import AIOutput from "@/components/AIOutput";
export default function SEO() {
  const [topic, setTopic] = useState(""); const [kw, setKw] = useState(""); const [draft, setDraft] = useState(""); const ai = useAI();
  return (
    <main className="mx-auto max-w-4xl px-4 md:px-6 py-10">
      <div className="eyebrow">SEO Writing Assistant</div><h1 className="mt-2 text-4xl">Findable, without sounding like it.</h1><p className="text-ink-3 mt-2">Keywords, intent, titles, meta, headings, FAQs, schema — never at the cost of the writing.</p>
      <div className="card p-5 mt-8 space-y-3"><input className="input" placeholder="Topic or working title" value={topic} onChange={(e) => setTopic(e.target.value)} /><input className="input" placeholder="Target keywords (optional, comma separated)" value={kw} onChange={(e) => setKw(e.target.value)} /><textarea className="input" rows={6} placeholder="Paste an existing draft to optimise (optional)" value={draft} onChange={(e) => setDraft(e.target.value)} /><div className="flex flex-wrap gap-2"><button onClick={() => ai.run({ task: "seo", input: `${topic}\n\n${draft}`, options: { keywords: kw } })} disabled={ai.busy || (!topic.trim() && !draft.trim())} className="btn btn-gold">Build content brief</button>{draft && <button onClick={() => ai.run({ task: "refine", input: draft, instruction: `Optimise readability and structure for search around: ${topic}${kw ? ` (keywords: ${kw})` : ""}. Keep the voice.`, options: { mode: "humanize" } })} className="btn btn-ghost">Optimise my draft</button>}</div></div>
      <div className="mt-6"><AIOutput text={ai.text} busy={ai.busy} error={ai.error} onStop={ai.stop} onRegenerate={() => ai.regenerate()} saveKind="article" /></div>
    </main>
  );
}

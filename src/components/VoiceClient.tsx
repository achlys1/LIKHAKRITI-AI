"use client";
import { useEffect, useState } from "react";
import Gate from "@/components/Gate";
import { useApp } from "@/components/Providers";
import type { VoiceLearned, VoiceManual } from "@/lib/repo";
export default function Voice() {
  const { user, toast } = useApp(); const [manual, setManual] = useState<VoiceManual>({}); const [learned, setLearned] = useState<VoiceLearned | null>(null); const [busy, setBusy] = useState(false);
  useEffect(() => { if (user) fetch("/api/voice").then((r) => r.json()).then((j) => { setManual(j.manual || {}); setLearned(j.learned); }); }, [user]);
  const save = async () => { await fetch("/api/voice", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(manual) }); toast("Your voice profile is saved."); };
  const learn = async () => { setBusy(true); const r = await fetch("/api/voice", { method: "POST" }); const j = await r.json(); setLearned(j.learned); setBusy(false); toast(j.learned ? "Re-read your pages." : "Write a few pages first — I learn only from your own writing."); };
  const list = (k: keyof VoiceManual) => ((manual[k] as string[]) || []).join(", ");
  const setList = (k: keyof VoiceManual, v: string) => setManual({ ...manual, [k]: v.split(",").map((s) => s.trim()).filter(Boolean) });
  return (
    <Gate>
      <main className="mx-auto max-w-5xl px-4 md:px-6 py-10">
        <div className="eyebrow">Voice Memory</div><h1 className="mt-2 text-4xl">My Voice</h1><p className="text-ink-3 mt-2 max-w-2xl">Two things live here. <b className="text-ink">My Voice</b> is what you declare — it always wins. <b className="text-ink">AI Suggestions</b> is what Likhakriti notices in your writing — it never overwrites you.</p>
        <div className="mt-8 grid lg:grid-cols-2 gap-6">
          <section className="card p-5 space-y-4"><div className="serif text-2xl">My Voice <span className="text-xs text-ink-3 font-sans">(you decide)</span></div>
            <div><label className="label">Languages I write in</label><input className="input" placeholder="Hindi, English, Hinglish" defaultValue={list("languages")} onBlur={(e) => setList("languages", e.target.value)} /></div>
            <div><label className="label">Themes I return to</label><input className="input" placeholder="rain, memory, cities at night" defaultValue={list("themes")} onBlur={(e) => setList("themes", e.target.value)} /></div>
            <div><label className="label">Structures I prefer</label><input className="input" placeholder="free verse, micro poetry, nazm" defaultValue={list("structures")} onBlur={(e) => setList("structures", e.target.value)} /></div>
            <div><label className="label">Words I never want suggested</label><input className="input" placeholder="tapestry, journey, soul" defaultValue={list("avoidWords")} onBlur={(e) => setList("avoidWords", e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3"><div><label className="label">Emotional intensity</label><select className="input" value={manual.intensity || ""} onChange={(e) => setManual({ ...manual, intensity: e.target.value })}><option value="">—</option><option>understated</option><option>balanced</option><option>intense</option></select></div><div><label className="label">How much editing</label><select className="input" value={manual.editingDegree || ""} onChange={(e) => setManual({ ...manual, editingDegree: e.target.value })}><option value="">—</option><option>barely touch it</option><option>light</option><option>moderate</option><option>go hard</option></select></div></div>
            <div><label className="label">Anything else Likhakriti should know</label><textarea className="input" rows={3} placeholder="I write lowercase on purpose. I don't like exclamation marks. I mix Hindi in the last line." value={manual.notes || ""} onChange={(e) => setManual({ ...manual, notes: e.target.value })} /></div>
            <button onClick={save} className="btn btn-gold">Save My Voice</button>
          </section>
          <section className="card p-5 space-y-4"><div className="flex items-center justify-between"><div className="serif text-2xl">AI Suggestions <span className="text-xs text-ink-3 font-sans">(observed, editable by ignoring)</span></div><button onClick={learn} disabled={busy} className="btn btn-ghost btn-sm">{busy ? "Reading…" : "Re-read my pages"}</button></div>
            {!learned || !learned.samples ? <p className="text-sm text-ink-3">Nothing learned yet. Likhakriti learns only from pages you write here — never from its own suggestions.</p> : (
              <dl className="text-sm space-y-3">
                <div><dt className="label !mb-0">Read from</dt><dd>{learned.samples} pages</dd></div>
                <div><dt className="label !mb-0">Sentence length</dt><dd>~{learned.avgSentenceLen} words · lines ~{learned.avgLineLen} words</dd></div>
                <div><dt className="label !mb-0">Casing</dt><dd>{Math.round(learned.lowercaseRatio * 100)}% of lines start lowercase</dd></div>
                <div><dt className="label !mb-0">Punctuation habits</dt><dd className="flex gap-2 flex-wrap">{Object.entries(learned.punctuation).map(([k, v]) => <span key={k} className="chip">{k} ×{v}</span>)}</dd></div>
                <div><dt className="label !mb-0">Languages</dt><dd className="flex gap-2 flex-wrap">{Object.entries(learned.languages).map(([k, v]) => <span key={k} className="chip">{k} ×{v}</span>)}</dd></div>
                <div><dt className="label !mb-0">Recurring images</dt><dd className="flex gap-2 flex-wrap">{learned.recurringImages.length ? learned.recurringImages.map((k) => <span key={k} className="chip">{k}</span>) : <span className="text-ink-3">none yet</span>}</dd></div>
                <div><dt className="label !mb-0">Words you lean on</dt><dd className="text-ink-2">{learned.topWords.slice(0, 15).join(", ")}</dd></div>
              </dl>
            )}
          </section>
        </div>
      </main>
    </Gate>
  );
}

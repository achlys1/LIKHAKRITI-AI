"use client";
import type { AIOptions } from "@/lib/ai/types";
export default function ModeBar({ opts, onChange, showLang = true }: { opts: AIOptions; onChange: (o: AIOptions) => void; showLang?: boolean }) {
  const set = (k: keyof AIOptions, v: unknown) => onChange({ ...opts, [k]: v });
  const mode = opts.mode || "default";
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-2 items-center text-xs">
      <div className="flex gap-1.5 flex-wrap">
        {(["default", "raw", "literary", "humanize"] as const).map((m) => (
          <button key={m} onClick={() => set("mode", m)} className={`chip ${mode === m ? "chip-on" : ""}`} title={m === "raw" ? "Preserve imperfections — minimal edits" : m === "literary" ? "Elevate imagery & structure without big words" : m === "humanize" ? "Remove AI-sounding patterns" : "Balanced"}>{m === "default" ? "Balanced" : m.toUpperCase()}</button>
        ))}
      </div>
      <label className="chip" style={opts.brutal ? { borderColor: "var(--danger)", color: "var(--danger)" } : {}}>
        <input type="checkbox" className="mr-1.5 accent-current" checked={!!opts.brutal} onChange={(e) => set("brutal", e.target.checked)} /> Brutal Honesty
      </label>
      <label className="chip"><input type="checkbox" className="mr-1.5" checked={!!opts.keepImperfections} onChange={(e) => set("keepImperfections", e.target.checked)} /> Keep my imperfections</label>
      {showLang && (
        <select className="chip bg-transparent" value={opts.language || "auto"} onChange={(e) => set("language", e.target.value)}>
          <option value="auto">Language: auto</option><option value="hindi">Hindi</option><option value="english">English</option><option value="hinglish">Hinglish</option><option value="bilingual">Bilingual</option>
        </select>
      )}
    </div>
  );
}

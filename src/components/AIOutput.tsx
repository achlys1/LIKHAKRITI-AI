"use client";
import { Copy, RefreshCw, Save, Square, ArrowDownToLine, Check } from "lucide-react";
import { useState } from "react";
import { useApp } from "./Providers";
import { useRouter } from "next/navigation";

export default function AIOutput({ text, busy, error, onStop, onRegenerate, onInsert, saveKind = "poem", compact = false, title }: { text: string; busy: boolean; error: string | null; onStop: () => void; onRegenerate?: () => void; onInsert?: (t: string) => void; saveKind?: string; compact?: boolean; title?: string }) {
  const { user, toast } = useApp(); const router = useRouter();
  const [copied, setCopied] = useState(false);
  const copy = async () => { await navigator.clipboard.writeText(text); setCopied(true); toast("Copied."); setTimeout(() => setCopied(false), 1500); };
  const save = async () => {
    if (!user) { toast("Sign in to save your ink."); router.push("/login?next=" + encodeURIComponent(location.pathname)); return; }
    const r = await fetch("/api/documents", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ kind: saveKind, title: title || "", body: text }) });
    const j = await r.json(); if (j.document) { toast("Saved to your pages."); router.push(`/editor?id=${j.document.id}`); } else toast(j.error || "Couldn't save.");
  };
  if (!text && !busy && !error) return null;
  return (
    <div className={`card ${compact ? "p-4" : "p-5 md:p-6"} rise`}>
      {error && <p className="text-sm" style={{ color: "var(--danger)" }}>{error}</p>}
      <div className={`streaming-text ${/[\u0900-\u097F]/.test(text) ? "hi" : ""} ${compact ? "text-[15px]" : "text-base"} ${busy ? "ink-dot" : ""}`}>{text}</div>
      {(text || busy) && (
        <div className="mt-4 flex flex-wrap gap-2 no-print">
          {busy ? <button onClick={onStop} className="btn btn-ghost btn-sm"><Square size={12} /> Stop generating</button> : (
            <>
              {onRegenerate && <button onClick={onRegenerate} className="btn btn-ghost btn-sm"><RefreshCw size={12} /> Regenerate</button>}
              <button onClick={copy} className="btn btn-ghost btn-sm">{copied ? <Check size={12} /> : <Copy size={12} />} Copy</button>
              <button onClick={save} className="btn btn-ghost btn-sm"><Save size={12} /> Save</button>
              {onInsert && <button onClick={() => onInsert(text)} className="btn btn-ghost btn-sm"><ArrowDownToLine size={12} /> Insert into editor</button>}
            </>
          )}
        </div>
      )}
    </div>
  );
}

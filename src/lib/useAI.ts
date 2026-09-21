"use client";
import { useCallback, useRef, useState } from "react";
import type { AIOptions, ChatMessage, Task } from "./ai/types";

export interface AIParams { task: Task; input: string; instruction?: string; options?: AIOptions; history?: ChatMessage[]; documentTitle?: string; useVoice?: boolean; }

export function useAI() {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ac = useRef<AbortController | null>(null);
  const last = useRef<AIParams | null>(null);

  const run = useCallback(async (p: AIParams, onChunk?: (full: string) => void) => {
    ac.current?.abort();
    const ctrl = new AbortController(); ac.current = ctrl; last.current = p;
    setBusy(true); setError(null); setText("");
    let full = "";
    try {
      const r = await fetch("/api/ai", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(p), signal: ctrl.signal });
      if (!r.ok) { const j = await r.json().catch(() => ({})); throw new Error(j.error || "Something interrupted the ink. Try again."); }
      const reader = r.body!.getReader(); const dec = new TextDecoder();
      while (true) { const { done, value } = await reader.read(); if (done) break; full += dec.decode(value, { stream: true }); setText(full); onChunk?.(full); }
      return full;
    } catch (e) {
      if ((e as Error).name === "AbortError") return full;
      setError(e instanceof Error ? e.message : "Something interrupted the ink. Try again.");
      return full;
    } finally { setBusy(false); }
  }, []);
  const stop = useCallback(() => ac.current?.abort(), []);
  const regenerate = useCallback((onChunk?: (f: string) => void) => (last.current ? run(last.current, onChunk) : Promise.resolve("")), [run]);
  return { text, setText, busy, error, run, stop, regenerate };
}

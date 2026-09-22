"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";
import { useApp } from "@/components/Providers";

const Q = [
  { id: "writes", q: "What do you write?", opts: ["Poetry", "Stories", "Essays", "Journaling", "Lyrics", "Blogs", "Academic", "Professional", "Everything"] },
  { id: "languages", q: "What language do you write in?", opts: ["Hindi", "English", "Hinglish", "Other"] },
  { id: "help", q: "What kind of help do you want?", opts: ["Write", "Edit", "Learn", "Explore", "Publish"] },
];
export default function Onboarding() {
  const [step, setStep] = useState(0); const [ans, setAns] = useState<Record<string, string[]>>({ writes: [], languages: [], help: [] });
  const router = useRouter(); const { refresh } = useApp();
  const cur = Q[step]; const toggle = (o: string) => setAns((a) => ({ ...a, [cur.id]: a[cur.id].includes(o) ? a[cur.id].filter((x) => x !== o) : [...a[cur.id], o] }));
  const next = async () => { if (step < Q.length - 1) { setStep(step + 1); return; } await fetch("/api/onboarding", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(ans) }); await refresh(); router.push("/dashboard"); };
  return (
    <main className="min-h-dvh flex items-center justify-center p-6">
      <div className="w-full max-w-lg rise" key={step}>
        <Logo size={26} />
        <div className="mt-8 eyebrow">{step + 1} / {Q.length}</div>
        <h1 className="mt-2 text-4xl">{cur.q}</h1>
        <div className="mt-6 flex flex-wrap gap-2">{cur.opts.map((o) => <button key={o} onClick={() => toggle(o)} className={`chip !px-4 !py-2 !text-sm ${ans[cur.id].includes(o) ? "chip-on" : ""}`}>{o}</button>)}</div>
        <div className="mt-8 flex items-center gap-3"><button onClick={next} className="btn btn-gold">{step < Q.length - 1 ? "Next" : "Open my space"}</button><button onClick={() => router.push("/dashboard")} className="text-sm text-ink-3 hover:text-gold">Skip</button></div>
      </div>
    </main>
  );
}

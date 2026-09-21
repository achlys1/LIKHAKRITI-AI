"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Logo from "./Logo";
import { useApp } from "./Providers";

export default function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [name, setName] = useState("");
  const [err, setErr] = useState<string | null>(null); const [busy, setBusy] = useState(false);
  const router = useRouter(); const sp = useSearchParams(); const { refresh } = useApp();
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setErr(null);
    const r = await fetch(`/api/auth/${mode === "login" ? "login" : "register"}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, password, name }) });
    const j = await r.json(); setBusy(false);
    if (!r.ok) { setErr(j.error || "Something interrupted the ink. Try again."); return; }
    await refresh();
    router.push(mode === "signup" ? "/onboarding" : sp.get("next") || "/dashboard");
  };
  return (
    <main className="min-h-dvh grid lg:grid-cols-2">
      <section className="hidden lg:flex flex-col justify-between p-12 bg-blue text-[#f1ebdd] relative overflow-hidden">
        <div className="moon absolute -top-20 -right-20 h-96 w-96 rounded-full" style={{ background: "radial-gradient(circle at 40% 40%, rgba(201,173,98,.25), transparent 62%)" }} />
        <Logo size={30} />
        <div><p className="serif text-5xl leading-tight">Some feelings arrive<br />before language.</p><p className="mt-4 opacity-70 max-w-sm">Likhakriti is where they wait for words. Your thought. Your emotion. Your ink.</p></div>
        <p className="serif italic opacity-60">~Likhakriti</p>
      </section>
      <section className="flex items-center justify-center p-6">
        <form onSubmit={submit} className="w-full max-w-sm space-y-4 rise">
          <div className="lg:hidden mb-6"><Logo size={28} /></div>
          <h1 className="text-3xl">{mode === "login" ? "Welcome back." : "Create your writing space."}</h1>
          <p className="text-sm text-ink-3">{mode === "login" ? "Your pages are where you left them." : "Free. Private by default. Your voice stays yours."}</p>
          {mode === "signup" && <div><label className="label">Name</label><input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="What should we call you?" /></div>}
          <div><label className="label">Email</label><input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <div><label className="label">Password</label><input className="input" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} placeholder={mode === "signup" ? "At least 8 characters" : ""} /></div>
          {err && <p className="text-sm" style={{ color: "var(--danger)" }}>{err}</p>}
          <button disabled={busy} className="btn btn-gold w-full py-3">{busy ? "One moment…" : mode === "login" ? "Sign in" : "Start writing"}</button>
          <p className="text-xs text-ink-3 text-center">Google and other sign-in providers can be enabled by the operator — see README.</p>
          <p className="text-sm text-center text-ink-2">{mode === "login" ? <>New here? <Link href="/signup" className="text-gold">Create a space</Link></> : <>Already have a space? <Link href="/login" className="text-gold">Sign in</Link></>}</p>
        </form>
      </section>
    </main>
  );
}

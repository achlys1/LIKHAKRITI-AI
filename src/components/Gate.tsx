"use client";
import Link from "next/link";
import { useApp } from "./Providers";
export default function Gate({ children, title = "This room is yours alone.", note = "Sign in to open it." }: { children: React.ReactNode; title?: string; note?: string }) {
  const { user } = useApp();
  if (user) return <>{children}</>;
  return (
    <main className="mx-auto max-w-xl px-4 py-24 text-center rise">
      <h1 className="text-4xl">{title}</h1>
      <p className="mt-3 text-ink-3">{note}</p>
      <div className="mt-6 flex justify-center gap-3"><Link href={`/login?next=${typeof window !== "undefined" ? location.pathname : "/"}`} className="btn btn-gold">Sign in</Link><Link href="/signup" className="btn btn-ghost">Create a space</Link></div>
    </main>
  );
}

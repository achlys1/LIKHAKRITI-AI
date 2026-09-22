"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BookOpen, Compass, Feather, Home, Moon, NotebookPen, PenLine, Sparkles, Sun, User, Settings, LayoutDashboard, Menu, X } from "lucide-react";
import { useState } from "react";
import Logo from "./Logo";
import { useApp } from "./Providers";

const NAV = [
  { href: "/", label: "Home", icon: Home },
  { href: "/write", label: "Write", icon: PenLine },
  { href: "/studio", label: "AI Studio", icon: Sparkles },
  { href: "/poetry", label: "Poetry", icon: Feather },
  { href: "/editor", label: "Editor", icon: NotebookPen },
  { href: "/journal", label: "Journal", icon: BookOpen },
  { href: "/portfolio", label: "Portfolio", icon: User },
  { href: "/explore", label: "Explore", icon: Compass },
  { href: "/about", label: "About", icon: Moon },
  { href: "/settings", label: "Settings", icon: Settings },
];
const MOBILE = ["/", "/studio", "/write", "/journal", "/explore"];

export default function Nav() {
  const p = usePathname();
  const { user, theme, setTheme, refresh } = useApp();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const active = (h: string) => (h === "/" ? p === "/" : p.startsWith(h));
  if (p.startsWith("/u/") || p.startsWith("/p/") || p === "/login" || p === "/signup" || p === "/onboarding") return null;
  const logout = async () => { await fetch("/api/auth/logout", { method: "POST" }); await refresh(); router.push("/"); };
  return (
    <>
      <header className="sticky top-0 z-40 no-print" style={{ background: "color-mix(in oklab, var(--bg) 82%, transparent)", backdropFilter: "blur(14px)", borderBottom: "1px solid var(--line)" }}>
        <div className="mx-auto max-w-7xl px-4 md:px-6 h-14 flex items-center gap-4">
          <Logo size={26} />
          <nav className="hidden lg:flex items-center gap-1 ml-4 text-sm">
            {NAV.slice(1, 9).map((n) => <Link key={n.href} href={n.href} className={`px-3 py-1.5 rounded-full transition-colors hover:text-gold ${active(n.href) ? "nav-active" : "text-ink-2"}`}>{n.label}</Link>)}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <button aria-label="Toggle theme" className="btn btn-ghost !p-2 rounded-full" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>{theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}</button>
            {user ? (
              <>
                <Link href="/dashboard" className="hidden md:inline-flex btn btn-ghost btn-sm"><LayoutDashboard size={13} /> Dashboard</Link>
                <button onClick={logout} className="hidden md:inline-flex btn btn-ghost btn-sm">Sign out</button>
              </>
            ) : (
              <>
                <Link href="/login" className="hidden md:inline-flex btn btn-ghost btn-sm">Sign in</Link>
                <Link href="/signup" className="btn btn-gold btn-sm">Start Writing</Link>
              </>
            )}
            <button aria-label="Menu" className="lg:hidden btn btn-ghost !p-2 rounded-full" onClick={() => setOpen((o) => !o)}>{open ? <X size={16} /> : <Menu size={16} />}</button>
          </div>
        </div>
        {open && (
          <div className="lg:hidden border-t hairline px-4 py-3 grid grid-cols-2 gap-1 fade" style={{ background: "var(--bg)" }}>
            {NAV.map((n) => <Link key={n.href} href={n.href} onClick={() => setOpen(false)} className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm ${active(n.href) ? "nav-active" : "text-ink-2"}`}><n.icon size={15} /> {n.label}</Link>)}
            {user ? <><Link href="/dashboard" onClick={() => setOpen(false)} className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-ink-2"><LayoutDashboard size={15} /> Dashboard</Link><button onClick={logout} className="text-left flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-ink-2">Sign out</button></> : <Link href="/login" onClick={() => setOpen(false)} className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-ink-2"><User size={15} /> Sign in</Link>}
          </div>
        )}
      </header>
      {/* mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 safe-bottom no-print" style={{ background: "color-mix(in oklab, var(--bg) 90%, transparent)", backdropFilter: "blur(14px)", borderTop: "1px solid var(--line)" }}>
        <div className="grid grid-cols-5 h-14">
          {MOBILE.map((h) => { const n = NAV.find((x) => x.href === h)!; return <Link key={h} href={h} className={`flex flex-col items-center justify-center gap-0.5 text-[10px] ${active(h) ? "nav-active" : "text-ink-3"}`}><n.icon size={18} />{n.label}</Link>; })}
        </div>
      </nav>
    </>
  );
}

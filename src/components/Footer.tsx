import Link from "next/link";
import Logo from "./Logo";
export default function Footer() {
  return (
    <footer className="mt-24 border-t hairline no-print pb-20 lg:pb-8">
      <div className="mx-auto max-w-7xl px-4 md:px-6 py-10 grid gap-8 md:grid-cols-4 text-sm">
        <div className="md:col-span-2">
          <Logo size={24} />
          <p className="mt-4 max-w-sm text-ink-3 leading-relaxed">Anyone can fill the ink of emotions. Likhakriti helps people turn what they feel and think into words that still sound like them.</p>
          <p className="mt-4 serif text-ink-3 italic">~Likhakriti</p>
        </div>
        <div>
          <div className="label">Write</div>
          <ul className="space-y-2 text-ink-2">
            <li><Link href="/studio" className="hover:text-gold">AI Studio</Link></li>
            <li><Link href="/poetry" className="hover:text-gold">Poetry Engine</Link></li>
            <li><Link href="/lab" className="hover:text-gold">Poetry Lab</Link></li>
            <li><Link href="/editor" className="hover:text-gold">Editor</Link></li>
            <li><Link href="/author" className="hover:text-gold">Author Mode</Link></li>
          </ul>
        </div>
        <div>
          <div className="label">Likhakriti</div>
          <ul className="space-y-2 text-ink-2">
            <li><Link href="/explore" className="hover:text-gold">Explore</Link></li>
            <li><Link href="/about" className="hover:text-gold">About</Link></li>
            <li><Link href="/creator" className="hover:text-gold">Creator Mode</Link></li>
            <li><Link href="/seo" className="hover:text-gold">SEO Assistant</Link></li>
            <li><Link href="/settings" className="hover:text-gold">Settings & Privacy</Link></li>
          </ul>
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-4 md:px-6 text-xs text-ink-3 flex flex-wrap gap-3 justify-between">
        <span>© {new Date().getFullYear()} Likhakriti · Founded by Yashraj Sharma</span>
        <span>Keep your voice.</span>
      </div>
    </footer>
  );
}

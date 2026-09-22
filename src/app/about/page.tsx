import type { Metadata } from "next";
import Logo from "@/components/Logo";
import Footer from "@/components/Footer";
import Link from "next/link";
import { url } from "@/lib/seo";

export const metadata: Metadata = {
  title: "About",
  description: "Likhakriti writes with the writer, never for the writer — the belief, the philosophy and the person behind it.",
  alternates: { canonical: url("/about") },
};
export default function About() {
  return (
    <main>
      <section className="mx-auto max-w-3xl px-4 md:px-6 pt-20 pb-10">
        <Logo size={30} href={null} />
        <h1 className="mt-8 text-4xl md:text-6xl leading-tight">People already have stories inside them.</h1>
        <p className="mt-6 text-xl text-ink-2 leading-relaxed">Sometimes they only need the right words.</p>
        <p className="mt-4 text-ink-2 leading-relaxed">Likhakriti was built around a simple belief: writing is converting thought into language, and poetry is converting emotion into language. Anyone can fill the ink of emotions. Likhakriti exists to help people find those words — without losing themselves in the process.</p>
        <p className="mt-4 text-ink-2 leading-relaxed">It is not an AI that writes for you. It is a writing room that writes <em>with</em> you: think → feel → write → refine → remember → share.</p>
      </section>
      <section className="mx-auto max-w-3xl px-4 md:px-6 py-10">
        <div className="eyebrow">What we believe</div>
        <ul className="mt-4 grid sm:grid-cols-2 gap-x-8 gap-y-3 text-ink-2">
          {["Authenticity over artificial perfection", "Human emotion before algorithmic decoration", "Rawness over unnecessary polish", "Meaningful words over complicated vocabulary", "Originality over imitation", "Reflection over validation", "Creativity over templates", "Emotion + intelligence", "Darkness and light can coexist", "Every writer has a voice worth developing"].map((b) => <li key={b} className="border-l hairline pl-4 py-1">{b}</li>)}
        </ul>
      </section>
      <section className="mx-auto max-w-3xl px-4 md:px-6 py-10">
        <div className="card p-6 md:p-8"><div className="eyebrow">Founder</div><div className="mt-2 serif text-3xl">Yashraj Sharma</div><div className="text-ink-3">Founder, Likhakriti — known as Yash.</div><p className="mt-4 text-ink-2 leading-relaxed">Likhakriti is Yash&apos;s idea and philosophy. Likhakriti AI is a distinct creative intelligence built around that philosophy — it is not Yash, and never claims to be.</p></div>
      </section>
      <section className="mx-auto max-w-3xl px-4 md:px-6 py-10">
        <div className="eyebrow">On AI</div>
        <p className="mt-3 text-ink-2 leading-relaxed">Likhakriti never silently replaces your words. Every suggestion shows the original, the suggestion, and why — and you accept or reject it. It will not reproduce copyrighted poems, and it won&apos;t imitate a living writer&apos;s distinctive style; it works with qualities instead — lyrical, minimalist, confessional, surreal. Your journal is private, always.</p>
        <div className="mt-8 flex gap-3"><Link href="/studio" className="btn btn-gold">Start Writing</Link><Link href="/explore" className="btn btn-ghost">Explore</Link></div>
        <p className="mt-12 serif italic text-ink-3">~Likhakriti</p>
      </section>
      <Footer />
    </main>
  );
}

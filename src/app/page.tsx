import Link from "next/link";
import Demo from "@/components/Demo";
import Footer from "@/components/Footer";
import { Feather, PenLine, Sparkles, BookOpen, FlaskConical, Eye, Scissors, Languages, Mic, Globe } from "lucide-react";

const FEATURES = [
  { icon: Sparkles, t: "AI Studio", d: "Write, continue, rewrite, refine, humanize, deepen, simplify, translate, analyze — each with its own engine.", h: "/studio" },
  { icon: Feather, t: "Poetry Engine", d: "Hindi, English, Hinglish, bilingual. Free verse, ghazal-inspired, nazm, haiku, spoken word. Rhyme only when you want it.", h: "/poetry" },
  { icon: Scissors, t: "RAW mode", d: "Keeps the fragments, the strange metaphors, the roughness. Original vs. Raw Refined — the goal is authenticity.", h: "/studio?mode=raw" },
  { icon: Eye, t: "First Reader", d: "Not an editor — a reader. What did I feel? What stayed? Where did my attention drop?", h: "/studio?task=first_reader" },
  { icon: FlaskConical, t: "Poetry Lab", d: "One seed, seven emotional directions. You choose where the poem goes.", h: "/lab" },
  { icon: PenLine, t: "Editor", d: "Distraction-free, autosave, version history, suggestions you accept or reject. Never silently replaced.", h: "/editor" },
  { icon: BookOpen, t: "Journal & Journey", d: "Private daily writing, moods, reflection prompts, and a timeline of your creative milestones.", h: "/journal" },
  { icon: Languages, t: "Voice Memory", d: "Learns your sentence length, languages, punctuation, recurring images. You can see and edit it.", h: "/voice" },
  { icon: Globe, t: "Publish Everywhere", d: "One poem → captions, carousel, LinkedIn, X. Your voice stays intact.", h: "/studio?task=social" },
  { icon: Mic, t: "Author Mode", d: "Books, chapters, characters, symbols, continuity. For the long work.", h: "/author" },
];

export default function Home() {
  return (
    <main>
      <section className="relative overflow-hidden">
        <div className="moon absolute -top-24 right-[-8%] md:right-[6%] h-72 w-72 md:h-[26rem] md:w-[26rem] rounded-full pointer-events-none" style={{ background: "radial-gradient(circle at 40% 40%, var(--glow), transparent 62%)" }} />
        <div className="mx-auto max-w-7xl px-4 md:px-6 pt-20 md:pt-32 pb-16 md:pb-24 grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7">
            <div className="eyebrow rise">Likhakriti AI</div>
            <h1 className="rise d1 mt-4 text-5xl md:text-7xl leading-[1.02]">Give your thoughts<br />an <span className="italic text-gold">ink</span>.</h1>
            <p className="rise d2 mt-6 text-lg md:text-xl text-ink-2 max-w-xl leading-relaxed">Anyone can fill the ink of emotions. A writing and poetry companion that helps you find the words — without losing yourself in the process.</p>
            <div className="rise d3 mt-8 flex flex-wrap gap-3">
              <Link href="/studio" className="btn btn-gold px-7 py-3">Start Writing</Link>
              <Link href="/about" className="btn btn-ghost px-7 py-3">Explore Likhakriti</Link>
            </div>
            <p className="rise d4 mt-10 text-sm text-ink-3">Hindi · English · Hinglish · bilingual — your voice, sharpened, never replaced.</p>
          </div>
          <div className="lg:col-span-5 rise d2"><Demo /></div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 md:px-6 py-10 md:py-16">
        <div className="grid md:grid-cols-3 gap-6 text-center md:text-left">
          {[["Think → Feel", "Some feelings arrive before language. Start there."], ["Write → Refine", "AI can suggest a word. Only you know what it means."], ["Remember → Share", "Keep the milestones. Publish when it's ready — on your terms."]].map(([t, d]) => (
            <div key={t} className="p-6 border-t hairline"><div className="serif text-2xl">{t}</div><p className="mt-2 text-ink-3">{d}</p></div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 md:px-6 py-10 md:py-16">
        <div className="eyebrow">What lives here</div>
        <h2 className="mt-3 text-3xl md:text-5xl max-w-2xl">Not another AI tool. A writing room that knows you.</h2>
        <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f) => (
            <Link key={f.t} href={f.h} className="card p-5 hover:border-gold transition-colors group">
              <f.icon size={18} className="text-gold" />
              <div className="mt-3 serif text-xl group-hover:text-gold transition-colors">{f.t}</div>
              <p className="mt-1.5 text-sm text-ink-3 leading-relaxed">{f.d}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 md:px-6 py-16">
        <div className="card p-8 md:p-14 text-center relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(600px 200px at 50% 0%, var(--glow), transparent 70%)" }} />
          <p className="serif text-3xl md:text-5xl leading-tight max-w-3xl mx-auto">Don&apos;t write perfectly.<br />Write <span className="italic text-gold">honestly</span>.</p>
          <p className="mt-5 text-ink-3 max-w-xl mx-auto">Likhakriti doesn&apos;t write for you. It writes with you. Your thought. Your emotion. Your ink.</p>
          <div className="mt-8 flex justify-center gap-3 flex-wrap"><Link href="/signup" className="btn btn-primary px-7 py-3">Create your writing space</Link><Link href="/explore" className="btn btn-ghost px-7 py-3">Read what others wrote</Link></div>
        </div>
      </section>
      <Footer />
    </main>
  );
}

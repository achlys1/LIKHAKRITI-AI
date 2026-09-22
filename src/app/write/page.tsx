import Link from "next/link";
import { Feather, Sparkles, NotebookPen, FlaskConical, BookOpen, Mic } from "lucide-react";
export const metadata = { title: "Write" };
const P = [
  { h: "/editor", i: NotebookPen, t: "Open a blank page", d: "Distraction-free editor with autosave, versions, and Likhakriti beside you." },
  { h: "/poetry", i: Feather, t: "Write a poem", d: "Hindi · English · Hinglish. Free verse to ghazal-inspired. Rhyme only if you want it." },
  { h: "/studio", i: Sparkles, t: "Talk it through", d: "\"I don't know what I'm feeling.\" Start there." },
  { h: "/lab", i: FlaskConical, t: "Poetry Lab", d: "Take one seed and open seven emotional directions." },
  { h: "/journal", i: BookOpen, t: "Journal today", d: "Private. Intimate. A sentence is enough." },
  { h: "/author", i: Mic, t: "Start a book", d: "Chapters, characters, symbols, continuity." },
];
export default function Write() {
  return (
    <main className="mx-auto max-w-5xl px-4 md:px-6 py-12">
      <div className="eyebrow">Write</div>
      <h1 className="mt-3 text-4xl md:text-6xl">Where do you want to begin?</h1>
      <p className="mt-3 text-ink-3">Don&apos;t write perfectly. Write honestly.</p>
      <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{P.map((p) => <Link key={p.h} href={p.h} className="card p-6 hover:border-gold transition-colors group"><p.i size={18} className="text-gold" /><div className="mt-3 serif text-2xl group-hover:text-gold">{p.t}</div><p className="mt-1 text-sm text-ink-3">{p.d}</p></Link>)}</div>
    </main>
  );
}

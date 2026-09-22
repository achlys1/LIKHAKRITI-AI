import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { get } from "@/lib/db";
import { docs } from "@/lib/repo";
import { siteConfig, url } from "@/lib/seo";
import Logo from "@/components/Logo";
import JsonLd from "@/components/JsonLd";
export const dynamic = "force-dynamic";
type P = { params: Promise<{ username: string }> };
type Prof = { user_id: string; username: string; display_name: string; bio: string; avatar_url: string; links_json: string; created_at: number };
function load(username: string) { return get<Prof>("SELECT p.*, u.created_at FROM profiles p JOIN users u ON u.id=p.user_id WHERE p.username = ? AND p.is_public = 1", [username.replace(/^@/, "")]); }
function personSchema(p: Prof): Record<string, unknown> {
  const name = p.display_name || p.username;
  const links = Object.values(JSON.parse(p.links_json || "{}") as Record<string, string>).filter(Boolean);
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name,
    url: url(`/u/${p.username}`),
    ...(p.bio ? { description: p.bio } : {}),
    ...(links.length ? { sameAs: links } : {}),
  };
}
export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { username } = await params; const p = await load(username); if (!p) notFound();
  const name = p.display_name || p.username;
  const canonical = url(`/u/${p.username}`);
  return {
    title: `${name} (@${p.username})`,
    description: p.bio || `Public portfolio of ${name} on Likhakriti — poems, stories, essays and more.`,
    alternates: { canonical },
    openGraph: {
      type: "profile",
      title: `${name} (@${p.username})`,
      description: p.bio || undefined,
      url: canonical,
      images: p.avatar_url ? [p.avatar_url] : [siteConfig.ogImage],
    },
  };
}
export default async function Portfolio({ params }: P) {
  const { username } = await params; const p = await load(username); if (!p) notFound();
  const works = await docs.publicByUser(p.user_id); const links = JSON.parse(p.links_json || "{}") as Record<string, string>;
  const words = works.reduce((n, d) => n + d.word_count, 0); const featured = works[0];
  const byKind = (k: string[]) => works.filter((w) => k.includes(w.kind));
  return (
    <>
    <JsonLd data={personSchema(p)} />
    <main className="min-h-dvh">
      <header className="mx-auto max-w-4xl px-4 py-6 flex items-center justify-between"><Logo size={24} /><Link href="/explore" className="text-sm text-ink-3 hover:text-gold">Explore</Link></header>
      <section className="mx-auto max-w-4xl px-4 pt-6 pb-24">
        <div className="flex items-start gap-5">{p.avatar_url ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={p.avatar_url} alt="" className="h-20 w-20 rounded-full object-cover border hairline" /> : <div className="h-20 w-20 rounded-full bg-blue flex items-center justify-center serif text-3xl text-[#f1ebdd]">{(p.display_name || p.username)[0].toUpperCase()}</div>}
          <div><h1 className="text-4xl">{p.display_name || p.username}</h1><div className="text-ink-3 text-sm">@{p.username} · writing since {new Date(Number(p.created_at)).getFullYear()}</div>{p.bio && <p className="mt-3 text-ink-2 max-w-xl leading-relaxed">{p.bio}</p>}<div className="mt-3 flex flex-wrap gap-2">{Object.entries(links).filter(([, v]) => v).map(([k, v]) => <a key={k} href={v} target="_blank" rel="noreferrer" className="chip">{k}</a>)}</div></div></div>
        <div className="mt-8 grid grid-cols-3 gap-3 text-sm max-w-md"><div className="card p-3"><div className="label !mb-0">Pieces</div><div className="serif text-2xl">{works.length}</div></div><div className="card p-3"><div className="label !mb-0">Words</div><div className="serif text-2xl">{words.toLocaleString()}</div></div><div className="card p-3"><div className="label !mb-0">Languages</div><div className="serif text-2xl">{new Set(works.map((w) => w.language)).size}</div></div></div>
        {featured && <Link href={`/p/${featured.slug}`} className="card p-6 mt-10 block hover:border-gold"><div className="eyebrow">Featured</div><div className="serif text-3xl mt-2">{featured.title || "Untitled"}</div><p className={`poem !text-base mt-3 line-clamp-6 text-ink-2 ${/[\u0900-\u097F]/.test(featured.body) ? "hi" : ""}`}>{featured.body}</p></Link>}
        {[["Poems", byKind(["poem", "micro", "lyrics"])], ["Articles & Essays", byKind(["essay", "article", "thought"])], ["Projects & Stories", byKind(["story", "chapter"])]].map(([label, list]) => (list as typeof works).length ? <div key={label as string} className="mt-10"><div className="label">{label as string}</div><ul className="grid sm:grid-cols-2 gap-3">{(list as typeof works).map((w) => <li key={w.id}><Link href={`/p/${w.slug}`} className="card p-4 block hover:border-gold"><div className="serif text-xl">{w.title || "Untitled"}</div><p className={`text-sm text-ink-3 line-clamp-3 whitespace-pre-wrap mt-1 ${/[\u0900-\u097F]/.test(w.body) ? "hi" : ""}`}>{w.body}</p></Link></li>)}</ul></div> : null)}
        {!works.length && <p className="mt-12 text-ink-3 serif text-xl">Nothing published yet. The first line is still waiting.</p>}
        <p className="mt-16 text-xs text-ink-3">Portfolio on Likhakriti · <Link href="/" className="hover:text-gold">likhakriti</Link></p>
      </section>
    </main>
    </>
  );
}

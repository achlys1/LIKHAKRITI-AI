import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { docs, type PublicDoc } from "@/lib/repo";
import { siteConfig, url } from "@/lib/seo";
import Logo from "@/components/Logo";
import JsonLd from "@/components/JsonLd";
import PostActions from "@/components/PostActions";
export const dynamic = "force-dynamic";
type P = { params: Promise<{ slug: string }> };
function postSchema(d: PublicDoc): Record<string, unknown> {
  const canonical = url(`/p/${d.slug}`);
  const title = d.title || "Untitled";
  const publishedAt = d.published_at ? new Date(Number(d.published_at)).toISOString() : undefined;
  return {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: title,
    headline: title,
    description: d.subtitle || d.body.slice(0, 150),
    url: canonical,
    ...(publishedAt ? { datePublished: publishedAt } : {}),
    author: { "@type": "Person", name: d.display_name || d.username || "Anonymous" },
    creator: { "@id": `${siteConfig.siteUrl}/#organization` },
  };
}
export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { slug } = await params; const d = await docs.publicBySlug(slug); if (!d) notFound();
  const canonical = url(`/p/${slug}`);
  const title = d.title || "Untitled";
  const description = d.subtitle || d.body.slice(0, 150);
  const publishedAt = d.published_at ? new Date(Number(d.published_at)).toISOString() : undefined;
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: "article",
      title,
      description,
      url: canonical,
      ...(publishedAt ? { publishedTime: publishedAt } : {}),
      images: d.cover_url ? [d.cover_url] : [siteConfig.ogImage],
    },
  };
}
export default async function Post({ params }: P) {
  const { slug } = await params; const d = await docs.publicBySlug(slug); if (!d) notFound();
  const hi = /[\u0900-\u097F]/.test(d.body); const tags: string[] = JSON.parse(d.tags_json || "[]");
  return (
    <>
    <JsonLd data={postSchema(d)} />
    <main className="min-h-dvh">
      <header className="mx-auto max-w-3xl px-4 py-6 flex items-center justify-between no-print"><Logo size={24} /><Link href="/explore" className="text-sm text-ink-3 hover:text-gold">Explore</Link></header>
      <article className="mx-auto max-w-2xl px-4 pb-24">
        {d.cover_url && <div className="rounded-2xl overflow-hidden border hairline mb-8">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={d.cover_url} alt="" className="w-full" /></div>}
        <div className="text-[11px] uppercase tracking-widest text-ink-3">{d.kind} · {d.language}{d.theme ? ` · ${d.theme}` : ""}</div>
        <h1 className={`mt-2 text-4xl md:text-5xl ${hi ? "hi" : ""}`}>{d.title || "Untitled"}</h1>
        {d.subtitle && <p className="mt-2 text-ink-3 text-lg serif italic">{d.subtitle}</p>}
        <div className="mt-4 text-sm text-ink-3">{d.username ? <Link href={`/u/${d.username}`} className="hover:text-gold">{d.display_name || d.username}</Link> : "anonymous"} · {d.published_at ? new Date(d.published_at).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" }) : ""}</div>
        <div className={`poem mt-10 ${hi ? "hi" : ""}`}>{d.body}</div>
        {tags.length > 0 && <div className="mt-8 flex flex-wrap gap-1.5">{tags.map((t) => <span key={t} className="chip">#{t}</span>)}</div>}
        <p className="mt-10 serif italic text-ink-3">~Likhakriti</p>
        <PostActions id={d.id} slug={d.slug!} title={d.title} body={d.body} author={d.display_name || d.username || undefined} />
      </article>
    </main>
    </>
  );
}

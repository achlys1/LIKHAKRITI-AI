import type { MetadataRoute } from "next";
import { all } from "@/lib/db";
import { docs } from "@/lib/repo";
import { url } from "@/lib/seo";

export const dynamic = "force-dynamic";

/** Static public routes only — private/app pages must never be listed. */
const STATIC_ROUTES: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
  { path: "", priority: 1.0, changeFrequency: "daily" },
  { path: "/explore", priority: 0.9, changeFrequency: "daily" },
  { path: "/write", priority: 0.8, changeFrequency: "weekly" },
  { path: "/studio", priority: 0.8, changeFrequency: "weekly" },
  { path: "/poetry", priority: 0.8, changeFrequency: "weekly" },
  { path: "/lab", priority: 0.7, changeFrequency: "weekly" },
  { path: "/creator", priority: 0.6, changeFrequency: "monthly" },
  { path: "/seo", priority: 0.5, changeFrequency: "monthly" },
  { path: "/about", priority: 0.5, changeFrequency: "monthly" },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const statics: MetadataRoute.Sitemap = STATIC_ROUTES.map((r) => ({ url: url(r.path), priority: r.priority, changeFrequency: r.changeFrequency }));

  const posts: MetadataRoute.Sitemap = (await docs.explore({ limit: 500 })).map((d) => ({
    url: url(`/p/${d.slug}`),
    lastModified: d.published_at ? new Date(Number(d.published_at)) : new Date(),
    priority: 0.7,
    changeFrequency: "monthly" as const,
  }));

  const profiles = await all<{ username: string }>("SELECT username FROM profiles WHERE is_public = 1 AND username IS NOT NULL", []);
  const users: MetadataRoute.Sitemap = profiles.map((p) => ({
    url: url(`/u/${p.username}`),
    priority: 0.5,
    changeFrequency: "weekly" as const,
  }));

  return [...statics, ...posts, ...users];
}

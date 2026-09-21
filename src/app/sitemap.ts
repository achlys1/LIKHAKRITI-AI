import type { MetadataRoute } from "next";
import { docs } from "@/lib/repo";
export const dynamic = "force-dynamic";
export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const statics = ["", "/about", "/explore", "/studio", "/poetry", "/lab", "/write", "/editor"].map((p) => ({ url: base + p, lastModified: new Date() }));
  const posts = docs.explore({ limit: 500 }).map((d) => ({ url: `${base}/p/${d.slug}`, lastModified: new Date(d.published_at || Date.now()) }));
  return [...statics, ...posts];
}

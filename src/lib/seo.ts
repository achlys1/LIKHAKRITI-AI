/**
 * Central site configuration + SEO helpers.
 *
 * NEXT_PUBLIC_* values are inlined by Next.js at build time, so set
 * NEXT_PUBLIC_SITE_URL / NEXT_PUBLIC_GA_ID as build environment variables
 * (e.g. in Vercel) for them to take effect in production.
 */
const rawSiteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").trim();

export const siteConfig = {
  /** Brand name used in schema.org and the footer of titles. */
  name: "Likhakriti",
  /** Product name used in titles and schema.org. */
  product: "Likhakriti AI",
  tagline: "Give your thoughts an ink.",
  /** Public origin for canonical URLs, sitemap and Open Graph. */
  siteUrl: rawSiteUrl.replace(/\/+$/, ""),
  /** GA4 measurement id from NEXT_PUBLIC_GA_ID. Empty string = analytics off. */
  gaId: (process.env.NEXT_PUBLIC_GA_ID || "").trim(),
  /** Default share image (public/og.png, 1200×630). */
  ogImage: "/og.png",
  defaultTitle: "Likhakriti AI — Give your thoughts an ink.",
  defaultDescription:
    "Likhakriti is an AI-powered writing and poetry companion. Anyone can fill the ink of emotions — in Hindi, English or Hinglish, without losing your voice.",
  keywords: ["poetry", "AI writing", "Hindi poetry", "Hinglish poetry", "writing companion", "poem generator", "Likhakriti"],
} as const;

/** Absolute URL for a site path, e.g. url("/about"). */
export const url = (path = "/"): string => siteConfig.siteUrl + (path.startsWith("/") ? path : `/${path}`);

/** GA4 ids look like G-XXXXXXXXXX; anything else is treated as "not configured". */
export const isValidGaId = (id: string): boolean => /^G-[A-Z0-9]{6,}$/i.test(id);

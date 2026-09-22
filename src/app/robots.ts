import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/seo";

/**
 * Public site only. Private/app routes are BOTH noindexed in their page
 * metadata and disallowed here so crawlers never fetch user content.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/_next/", "/admin", "/author", "/dashboard", "/editor", "/journal", "/journey", "/login", "/onboarding", "/portfolio", "/settings", "/signup", "/voice"],
    },
    sitemap: `${siteConfig.siteUrl}/sitemap.xml`,
  };
}

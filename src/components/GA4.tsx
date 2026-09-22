/**
 * GA4 — server component that renders the gtag bootstrap scripts directly into
 * <head>, so the tags are present in the server-rendered HTML on every page
 * (no client-side injection, visible to crawlers and in production builds).
 *
 * Renders nothing unless NEXT_PUBLIC_GA_ID is set to a valid G-… id.
 */
import { isValidGaId, siteConfig } from "@/lib/seo";

export default function GA4() {
  const id = siteConfig.gaId;
  if (!isValidGaId(id)) return null;
  return (
    <>
      <script async src={`https://www.googletagmanager.com/gtag/js?id=${id}`} />
      <script
        dangerouslySetInnerHTML={{
          __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${id}');`,
        }}
      />
    </>
  );
}

import type { Metadata, Viewport } from "next";
import "./globals.css";
import Providers from "@/components/Providers";
import Nav from "@/components/Nav";
import GA4 from "@/components/GA4";
import JsonLd from "@/components/JsonLd";
import { getSessionUser } from "@/lib/auth";
import { siteConfig, url } from "@/lib/seo";

/** Site-wide JSON-LD: Organization + WebSite. Individual pages add their own (posts, portfolios). */
const siteSchema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${siteConfig.siteUrl}/#organization`,
      name: siteConfig.name,
      url: siteConfig.siteUrl,
      logo: url("/brand/favicon.ico"),
      description: siteConfig.defaultDescription,
      founder: { "@type": "Person", name: "Yashraj Sharma" },
    },
    {
      "@type": "WebSite",
      "@id": `${siteConfig.siteUrl}/#website`,
      name: siteConfig.product,
      url: siteConfig.siteUrl,
      description: siteConfig.defaultDescription,
      publisher: { "@id": `${siteConfig.siteUrl}/#organization` },
    },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.siteUrl),
  title: { default: siteConfig.defaultTitle, template: "%s · Likhakriti" },
  description: siteConfig.defaultDescription,
  applicationName: siteConfig.name,
  keywords: [...siteConfig.keywords],
  alternates: { canonical: url("/") },
  openGraph: {
    type: "website",
    siteName: siteConfig.product,
    url: url("/"),
    title: siteConfig.defaultTitle,
    description: siteConfig.defaultDescription,
    locale: "en_IN",
    images: [{ url: siteConfig.ogImage, width: 1200, height: 630, alt: siteConfig.defaultTitle }],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.defaultTitle,
    description: siteConfig.defaultDescription,
    images: [siteConfig.ogImage],
  },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 } },
  verification: siteConfig.googleSiteVerification ? { google: siteConfig.googleSiteVerification } : undefined,
  icons: { icon: "/brand/favicon.ico" },
};
export const viewport: Viewport = { themeColor: "#07090f", width: "device-width", initialScale: 1, viewportFit: "cover" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Inter:wght@400;500;600&family=Tiro+Devanagari+Hindi:ital@0;1&display=swap" rel="stylesheet" />
        <script dangerouslySetInnerHTML={{ __html: `try{var t=localStorage.getItem('lk_theme')||'dark';document.documentElement.classList.toggle('dark',t==='dark');}catch(e){}` }} />
        <GA4 />
        <JsonLd data={siteSchema} />
      </head>
      <body className="grain moonfield">
        <Providers initialUser={user}>
          <Nav />
          <div className="relative z-10 pb-16 lg:pb-0">{children}</div>
        </Providers>
      </body>
    </html>
  );
}

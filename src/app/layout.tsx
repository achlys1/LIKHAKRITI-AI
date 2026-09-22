import type { Metadata, Viewport } from "next";
import "./globals.css";
import Providers from "@/components/Providers";
import Nav from "@/components/Nav";
import { getSessionUser } from "@/lib/auth";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: { default: "Likhakriti AI — Give your thoughts an ink.", template: "%s · Likhakriti" },
  description: "Likhakriti is an AI-powered writing and poetry companion. Anyone can fill the ink of emotions — in Hindi, English or Hinglish, without losing your voice.",
  applicationName: "Likhakriti",
  keywords: ["poetry", "AI writing", "Hindi poetry", "Hinglish poetry", "writing companion", "Likhakriti"],
  openGraph: { title: "Likhakriti AI", description: "Give your thoughts an ink.", type: "website", siteName: "Likhakriti" },
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

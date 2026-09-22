import type { Metadata } from "next";
import SeoClient from "@/components/SeoClient";
import { url } from "@/lib/seo";

export const metadata: Metadata = {
  title: "SEO Writing Assistant",
  description: "Keywords, intent, titles, meta, headings, FAQs and schema — findable, without sounding like it.",
  alternates: { canonical: url("/seo") },
};

export default function SeoPage() {
  return <SeoClient />;
}

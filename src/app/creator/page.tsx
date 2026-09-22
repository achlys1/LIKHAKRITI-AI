import type { Metadata } from "next";
import CreatorClient from "@/components/CreatorClient";
import { url } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Creator",
  description: "Draft website copy, blog posts and SEO content that reads like you wrote it — Likhakriti keeps the voice, you keep control.",
  alternates: { canonical: url("/creator") },
};

export default function CreatorPage() {
  return <CreatorClient />;
}

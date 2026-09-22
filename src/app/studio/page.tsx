import type { Metadata } from "next";
import StudioClient from "@/components/StudioClient";
import { url } from "@/lib/seo";

export const metadata: Metadata = {
  title: "AI Studio",
  description: "Write, continue, rewrite, refine, humanize, deepen, simplify, translate and analyze — each with its own engine that writes with you, never for you.",
  alternates: { canonical: url("/studio") },
};

export default function StudioPage() {
  return <StudioClient />;
}

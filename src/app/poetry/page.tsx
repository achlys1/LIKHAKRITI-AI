import type { Metadata } from "next";
import PoetryClient from "@/components/PoetryClient";
import { url } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Poetry Engine",
  description: "Hindi, English, Hinglish and bilingual poetry — free verse, ghazal-inspired, nazm, haiku, spoken word. Rhyme only when you want it.",
  alternates: { canonical: url("/poetry") },
};

export default function PoetryPage() {
  return <PoetryClient />;
}

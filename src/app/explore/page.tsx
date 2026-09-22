import type { Metadata } from "next";
import ExploreClient from "@/components/ExploreClient";
import { url } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Explore",
  description: "Read poems, stories, essays and thoughts published by Likhakriti writers — in Hindi, English and Hinglish.",
  alternates: { canonical: url("/explore") },
};

export default function ExplorePage() {
  return <ExploreClient />;
}

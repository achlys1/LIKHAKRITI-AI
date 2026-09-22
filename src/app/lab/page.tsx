import type { Metadata } from "next";
import LabClient from "@/components/LabClient";
import { url } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Poetry Lab",
  description: "One seed, seven emotional directions. Take a single idea and choose where the poem goes — metaphors, openings, endings and more.",
  alternates: { canonical: url("/lab") },
};

export default function LabPage() {
  return <LabClient />;
}

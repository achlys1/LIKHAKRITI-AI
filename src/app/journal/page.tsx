import type { Metadata } from "next";
import JournalClient from "@/components/JournalClient";

export const metadata: Metadata = {
  title: "Journal",
  robots: { index: false, follow: true },
};

export default function JournalPage() {
  return <JournalClient />;
}

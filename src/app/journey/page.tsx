import type { Metadata } from "next";
import JourneyClient from "@/components/JourneyClient";

export const metadata: Metadata = {
  title: "Journey",
  robots: { index: false, follow: true },
};

export default function JourneyPage() {
  return <JourneyClient />;
}

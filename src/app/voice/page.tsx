import type { Metadata } from "next";
import VoiceClient from "@/components/VoiceClient";

export const metadata: Metadata = {
  title: "My Voice",
  robots: { index: false, follow: true },
};

export default function VoicePage() {
  return <VoiceClient />;
}

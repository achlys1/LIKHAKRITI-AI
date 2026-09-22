import type { Metadata } from "next";
import OnboardingClient from "@/components/OnboardingClient";

export const metadata: Metadata = {
  title: "Welcome",
  robots: { index: false, follow: true },
};

export default function OnboardingPage() {
  return <OnboardingClient />;
}

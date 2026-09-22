import type { Metadata } from "next";
import SettingsClient from "@/components/SettingsClient";

export const metadata: Metadata = {
  title: "Settings",
  robots: { index: false, follow: true },
};

export default function SettingsPage() {
  return <SettingsClient />;
}

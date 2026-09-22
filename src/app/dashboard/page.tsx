import type { Metadata } from "next";
import DashboardClient from "@/components/DashboardClient";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false, follow: true },
};

export default function DashboardPage() {
  return <DashboardClient />;
}

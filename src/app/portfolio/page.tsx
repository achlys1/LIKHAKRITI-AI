import type { Metadata } from "next";
import PortfolioClient from "@/components/PortfolioClient";

export const metadata: Metadata = {
  title: "Portfolio",
  robots: { index: false, follow: true },
};

export default function PortfolioPage() {
  return <PortfolioClient />;
}

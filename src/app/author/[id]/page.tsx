import type { Metadata } from "next";
import AuthorBookClient from "@/components/AuthorBookClient";

export const metadata: Metadata = {
  title: "Author Mode",
  robots: { index: false, follow: true },
};

type P = { params: Promise<{ id: string }> };

export default function AuthorBookPage({ params }: P) {
  return <AuthorBookClient params={params} />;
}

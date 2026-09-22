import type { Metadata } from "next";
import AuthorClient from "@/components/AuthorClient";

export const metadata: Metadata = {
  title: "Author Mode",
  robots: { index: false, follow: true },
};

export default function AuthorPage() {
  return <AuthorClient />;
}

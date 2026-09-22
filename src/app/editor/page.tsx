import type { Metadata } from "next";
import EditorClient from "@/components/EditorClient";

export const metadata: Metadata = {
  title: "Editor",
  description: "Distraction-free editor with autosave, version history and Likhakriti beside you.",
  robots: { index: false, follow: true },
};

export default function EditorPage() {
  return <EditorClient />;
}

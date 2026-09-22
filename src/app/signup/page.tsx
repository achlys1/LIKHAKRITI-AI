import { Suspense } from "react";
import type { Metadata } from "next";
import AuthForm from "@/components/AuthForm";

export const metadata: Metadata = {
  title: "Create your space",
  robots: { index: false, follow: true },
};

export default function Page() { return <Suspense><AuthForm mode="signup" /></Suspense>; }

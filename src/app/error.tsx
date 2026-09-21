"use client";
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  console.error("[likhakriti]", error);
  return <main className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4"><h1 className="text-4xl">Something interrupted the ink.</h1><p className="text-ink-3 mt-2">Try again. If it keeps happening, the details are in the developer logs{error.digest ? ` (ref ${error.digest})` : ""}.</p><button onClick={reset} className="btn btn-gold mt-6">Try again</button></main>;
}

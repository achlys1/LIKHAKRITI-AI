"use client";
import { useState } from "react";
import Link from "next/link";

/**
 * Official Likhakriti logo.
 * Drop the founder-supplied assets into /public/brand/:
 *   logo.png (or .svg)        – full wordmark (dark backgrounds)
 *   logo-light.png (optional) – variant for light backgrounds
 *   symbol.png (optional)     – standalone symbol used on mobile + favicon
 * These files are used untouched (no filters, no recolouring, aspect ratio preserved).
 * Until they exist, a plain typographic wordmark is shown as a placeholder — it is NOT a redesign.
 */
export default function Logo({ size = 28, href = "/", compact = false, className = "" }: { size?: number; href?: string | null; compact?: boolean; className?: string }) {
  const [full, setFull] = useState(true);
  const [sym, setSym] = useState(true);
  const inner = (
    <span className={`inline-flex items-center gap-2 ${className}`} style={{ minHeight: size }}>
      {compact && sym ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src="/brand/symbol.png" alt="Likhakriti" height={size} style={{ height: size, width: "auto" }} onError={() => setSym(false)} />
      ) : full ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src="/brand/logo.png" alt="Likhakriti" height={size} style={{ height: size, width: "auto" }} onError={() => setFull(false)} />
      ) : (
        <span className="serif tracking-wide" style={{ fontSize: size * 0.85, lineHeight: 1 }}>
          Likhakriti<span className="text-gold">.</span>
        </span>
      )}
    </span>
  );
  return href ? <Link href={href} aria-label="Likhakriti home">{inner}</Link> : inner;
}

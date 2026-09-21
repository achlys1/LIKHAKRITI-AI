"use client";
import { Bookmark, Share2, Flag, Download } from "lucide-react";
import { useApp } from "./Providers";
import { exportPdf } from "@/lib/export";
export default function PostActions({ id, slug, title, body, author }: { id: string; slug: string; title: string; body: string; author?: string }) {
  const { user, toast } = useApp();
  const save = async () => { if (!user) { toast("Sign in to save pieces."); return; } const r = await fetch("/api/bookmarks", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ documentId: id }) }); const j = await r.json(); toast(j.saved ? "Saved." : "Removed from saved."); };
  const share = async () => { const url = `${location.origin}/p/${slug}`; if (navigator.share) { try { await navigator.share({ title, url }); return; } catch {} } await navigator.clipboard.writeText(url); toast("Link copied."); };
  const report = async () => { const reason = prompt("What's wrong with this piece?"); if (!reason) return; await fetch("/api/report", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ documentId: id, reason }) }); toast("Thank you. We'll look."); };
  return <div className="mt-8 flex flex-wrap gap-2 no-print"><button onClick={save} className="btn btn-ghost btn-sm"><Bookmark size={12} /> Save</button><button onClick={share} className="btn btn-ghost btn-sm"><Share2 size={12} /> Share</button><button onClick={() => exportPdf(title || "untitled", body, author)} className="btn btn-ghost btn-sm"><Download size={12} /> PDF</button><button onClick={report} className="btn btn-ghost btn-sm text-ink-3"><Flag size={12} /> Report</button></div>;
}

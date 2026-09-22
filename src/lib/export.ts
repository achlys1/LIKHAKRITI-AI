"use client";
/** Client-side exports: TXT, MD, DOCX (minimal OOXML zip), PDF (print-optimised literary layout). */

function download(name: string, blob: Blob) {
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
const safe = (s: string) => s.replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "").slice(0, 50) || "likhakriti";

export function exportText(title: string, body: string, ext: "txt" | "md") {
  const content = ext === "md" ? `# ${title}\n\n${body.split("\n").join("  \n")}\n\n~Likhakriti` : `${title}\n\n${body}\n\n~Likhakriti`;
  download(`${safe(title)}.${ext}`, new Blob([content], { type: "text/plain;charset=utf-8" }));
}

/* ---- tiny zip writer (stored, no compression) for DOCX ---- */
function crc32(buf: Uint8Array) { let c, crc = 0xffffffff; for (let n = 0; n < buf.length; n++) { c = (crc ^ buf[n]) & 0xff; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; crc = (crc >>> 8) ^ c; } return (crc ^ 0xffffffff) >>> 0; }
function zip(files: { name: string; data: string }[]) {
  const enc = new TextEncoder(); const parts: Uint8Array[] = []; const central: Uint8Array[] = []; let offset = 0;
  const le = (n: number, b: number) => { const a = new Uint8Array(b); for (let i = 0; i < b; i++) a[i] = (n >>> (8 * i)) & 0xff; return a; };
  const cat = (...arrs: Uint8Array[]) => { const l = arrs.reduce((n, a) => n + a.length, 0); const o = new Uint8Array(l); let p = 0; for (const a of arrs) { o.set(a, p); p += a.length; } return o; };
  for (const f of files) {
    const name = enc.encode(f.name); const data = enc.encode(f.data); const crc = crc32(data);
    const local = cat(le(0x04034b50, 4), le(20, 2), le(0x0800, 2), le(0, 2), le(0, 2), le(0, 2), le(crc, 4), le(data.length, 4), le(data.length, 4), le(name.length, 2), le(0, 2), name, data);
    central.push(cat(le(0x02014b50, 4), le(20, 2), le(20, 2), le(0x0800, 2), le(0, 2), le(0, 2), le(0, 2), le(crc, 4), le(data.length, 4), le(data.length, 4), le(name.length, 2), le(0, 2), le(0, 2), le(0, 2), le(0, 2), le(0, 4), le(offset, 4), name));
    parts.push(local); offset += local.length;
  }
  const cd = cat(...central); const end = cat(le(0x06054b50, 4), le(0, 2), le(0, 2), le(files.length, 2), le(files.length, 2), le(cd.length, 4), le(offset, 4), le(0, 2));
  return new Blob([cat(...parts, cd, end)], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
}
const xml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
export function exportDocx(title: string, body: string, author?: string) {
  const paras = [`<w:p><w:pPr><w:pStyle w:val="Title"/></w:pPr><w:r><w:t xml:space="preserve">${xml(title)}</w:t></w:r></w:p>`, ...body.split("\n").map((l) => `<w:p><w:pPr><w:spacing w:line="360" w:lineRule="auto"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Georgia" w:hAnsi="Georgia" w:cs="Mangal"/><w:sz w:val="26"/></w:rPr><w:t xml:space="preserve">${xml(l)}</w:t></w:r></w:p>`), `<w:p/><w:p><w:r><w:rPr><w:i/></w:rPr><w:t xml:space="preserve">${xml(author ? `— ${author}` : "")} ~Likhakriti</w:t></w:r></w:p>`];
  const doc = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${paras.join("")}<w:sectPr><w:pgMar w:top="1800" w:right="1800" w:bottom="1800" w:left="1800"/></w:sectPr></w:body></w:document>`;
  const files = [
    { name: "[Content_Types].xml", data: `<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>` },
    { name: "_rels/.rels", data: `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>` },
    { name: "word/_rels/document.xml.rels", data: `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>` },
    { name: "word/styles.xml", data: `<?xml version="1.0" encoding="UTF-8"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:pPr><w:spacing w:after="400"/></w:pPr><w:rPr><w:rFonts w:ascii="Georgia" w:hAnsi="Georgia"/><w:sz w:val="44"/></w:rPr></w:style></w:styles>` },
    { name: "word/document.xml", data: doc },
  ];
  download(`${safe(title)}.docx`, zip(files));
}

export function exportPdf(title: string, body: string, author?: string, opts: { manuscript?: boolean; blankPages?: number; chapters?: { title: string; body: string }[] } = {}) {
  const w = window.open("", "_blank", "width=900,height=1000"); if (!w) return;
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  const hi = /[\u0900-\u097F]/.test(body + (opts.chapters || []).map((c) => c.body).join(""));
  const pages = opts.chapters
    ? opts.chapters.map((c) => `<section class="page"><h2>${esc(c.title)}</h2><div class="body">${esc(c.body)}</div></section>`).join("") + Array.from({ length: opts.blankPages || 0 }, () => `<section class="page blank"><div class="body"></div><p class="foot">reflection</p></section>`).join("")
    : `<section class="page"><h1>${esc(title)}</h1><div class="body">${esc(body)}</div><div class="sig">${esc(author ? `— ${author}` : "")} &nbsp;~Likhakriti</div><div class="brand"><img src="${location.origin}/brand/logo-light.png" onerror="this.style.display='none'" alt=""><span>written on Likhakriti</span></div></section>`;
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400&family=Tiro+Devanagari+Hindi&display=swap" rel="stylesheet">
  <style>
    @page { size: ${opts.manuscript ? "A4" : "A5"}; margin: ${opts.manuscript ? "25mm" : "18mm"}; }
    body { font-family: ${hi ? "'Tiro Devanagari Hindi'," : ""} 'Cormorant Garamond', Georgia, serif; color:#141414; background:#fbf7ee; margin:0; }
    .page { page-break-after: always; min-height: 90vh; display:flex; flex-direction:column; padding: 10mm 6mm; }
    .cover { text-align:center; justify-content:center; }
    h1 { font-weight: 500; font-size: 28pt; margin: 0 0 18pt; letter-spacing:-.01em; }
    h2 { font-weight: 500; font-size: 20pt; margin: 0 0 14pt; }
    .body { white-space: pre-wrap; font-size: ${opts.manuscript ? "12pt" : "13.5pt"}; line-height: 1.85; flex:1; }
    .sig { margin-top: 24pt; font-style: italic; color:#555; font-size: 11pt; }
    .foot { color:#999; font-size: 9pt; text-align:center; margin-top:auto; }
    .brand { display:flex; align-items:center; gap:8px; justify-content:center; margin-top:auto; padding-top:24pt; color:#777; font-size:10pt; }
    .brand img { height:16px; }
    .blank .body { border:0; }
    @media screen { body { padding: 20px; } .page { background:#fff; box-shadow: 0 2px 20px rgba(0,0,0,.08); margin: 0 auto 20px; max-width: 700px; } }
  </style></head><body>
  ${opts.manuscript ? `<section class="page cover"><h1>${esc(title)}</h1><p>${esc(author || "")}</p><div class="brand"><img src="${location.origin}/brand/logo-light.png" onerror="this.style.display='none'" alt=""><span>Likhakriti</span></div></section>` : ""}
  ${pages}
  <script>setTimeout(function(){window.print();}, 600);</script>
  </body></html>`);
  w.document.close();
}

/**
 * Renders a schema.org JSON-LD block as a real <script type="application/ld+json">
 * tag (required by Google — Next's metadata `other` field would emit a <meta> tag
 * that rich-results crawlers do not read).
 */
export default function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  // Escape "<" so the JSON can never break out of the script tag.
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}

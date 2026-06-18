import { sanitizeRichText } from "@/lib/rich-text";

// Rend le HTML WYSIWYG nettoyé (cf. sanitizeRichText). Pas de plugin typography :
// la mise en forme est portée par des sélecteurs descendants Tailwind.
export function RichText({ html, className = "" }: { html: string | null | undefined; className?: string }) {
  const clean = sanitizeRichText(html);
  if (!clean) return null;

  return (
    <div
      className={[
        "space-y-3 leading-relaxed text-ink-soft/90",
        "[&_strong]:font-semibold [&_b]:font-semibold [&_em]:italic",
        "[&_a]:text-clay [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:text-clay/80",
        "[&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:mt-1",
        "[&_h2]:mt-5 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-ink",
        "[&_h3]:mt-4 [&_h3]:font-display [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-ink",
        "[&_blockquote]:border-l-2 [&_blockquote]:border-clay/40 [&_blockquote]:pl-4 [&_blockquote]:italic",
        className,
      ].join(" ")}
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}

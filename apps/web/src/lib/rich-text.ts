// Le contenu des actualités/événements arrive de l'API partenaire sous forme de
// HTML d'éditeur WYSIWYG (Quill). On le nettoie par liste blanche avant rendu :
// balises de mise en forme autorisées, attributs supprimés (sauf href sûr sur <a>).

const ALLOWED_TAGS = new Set([
  "p",
  "br",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "s",
  "ul",
  "ol",
  "li",
  "a",
  "h2",
  "h3",
  "h4",
  "blockquote",
]);

// Chemins relatifs autorisés (/page), mais pas les URLs protocol-relative (//hôte)
// qui pointeraient vers un domaine externe.
const SAFE_HREF = /^(https?:|mailto:|tel:|\/(?!\/)|#)/i;

export function sanitizeRichText(html: string | null | undefined): string {
  if (!html) return "";

  let out = html
    // Commentaires et blocs exécutables : supprimés avec leur contenu.
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<(script|style|iframe|object|embed|svg|math)[\s\S]*?<\/\1\s*>/gi, "");

  out = out.replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g, (tag, rawName: string) => {
    const name = rawName.toLowerCase();
    if (!ALLOWED_TAGS.has(name)) return "";
    if (tag.startsWith("</")) return `</${name}>`;
    if (name === "a") {
      const href = tag.match(/\bhref\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i);
      const value = (href?.[2] ?? href?.[3] ?? href?.[4] ?? "").trim();
      if (!SAFE_HREF.test(value)) return "<a>";
      const safe = value.replace(/"/g, "%22");
      return `<a href="${safe}" target="_blank" rel="noopener noreferrer nofollow">`;
    }
    // Toutes les autres balises autorisées : on jette les attributs.
    return `<${name}>`;
  });

  // Paragraphes vides produits par l'éditeur : l'espacement vient du CSS.
  return out.replace(/<p>\s*(<br\s*\/?>)?\s*<\/p>/gi, "").trim();
}

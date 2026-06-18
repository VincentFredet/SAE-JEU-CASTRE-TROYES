import type { LieuType } from "@jeux/shared/reliques";

// Pictos du TYPE d'un lieu, dessinés autour de l'origine (~±5) - à poser via un
// translate() sur la carte, ou dans un petit <svg viewBox="-7 -7 14 14"> pour la légende.
// Temple = fronton + colonnes ; Tombeau = stèle + croix ; Atelier = enclume.
export function TypeGlyph({ type, color }: { type: LieuType; color: string }) {
  if (type === "temple") {
    return (
      <g stroke={color} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="0,-5 5,-1 -5,-1" fill={color} stroke="none" />
        <line x1="-3.5" y1="0.2" x2="-3.5" y2="3.4" />
        <line x1="0" y1="0.2" x2="0" y2="3.4" />
        <line x1="3.5" y1="0.2" x2="3.5" y2="3.4" />
        <line x1="-4.8" y1="4" x2="4.8" y2="4" strokeWidth="1.3" />
      </g>
    );
  }
  if (type === "tombeau") {
    return (
      <g stroke={color} fill="none" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round">
        <path d="M -3.3 4.6 L -3.3 -0.8 A 3.3 3.3 0 0 1 3.3 -0.8 L 3.3 4.6" />
        <line x1="-3.3" y1="4.6" x2="3.3" y2="4.6" />
        <line x1="0" y1="0.6" x2="0" y2="3.3" strokeWidth="0.95" />
        <line x1="-1.5" y1="1.6" x2="1.5" y2="1.6" strokeWidth="0.95" />
      </g>
    );
  }
  // atelier : enclume
  return (
    <path
      d="M -5 -2.2 L 5 -2.2 L 5 -0.2 L 2 -0.2 L 2.7 1.8 L 3.6 1.8 L 3.6 3.4 L -3.6 3.4 L -3.6 1.8 L -2.7 1.8 L -2 -0.2 L -5 -0.2 Z"
      fill={color}
      stroke={color}
      strokeWidth="0.6"
      strokeLinejoin="round"
    />
  );
}

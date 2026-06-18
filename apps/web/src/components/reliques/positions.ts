import { ADJACENCY, type LocationId } from "@jeux/shared/reliques";

// Coordonnées des tuiles (viewBox 0 0 380 280). 4 ZONES aux coins (Fleuve NO, Forêt NE,
// Montagne SO, Marais SE), reliées par une étoile centrale de 3 LIEUX-PONTS : le Pont
// (haut), le Carrefour (centre) et le Gué (bas). Dans chaque zone : un coin (départ), un
// lieu vers le pont/gué, et un lieu « intérieur » vers le Carrefour. Navigable.
export const POSITIONS: Record<LocationId, { x: number; y: number }> = {
  // Fleuve (NO)
  catacombe: { x: 46, y: 50 }, // coin (départ)
  fonderie: { x: 120, y: 45 }, // vers le Pont
  citerne: { x: 106, y: 108 }, // vers le Carrefour
  // Forêt (NE)
  ossuaire: { x: 334, y: 50 }, // coin (départ)
  jardin: { x: 260, y: 45 }, // vers le Pont
  lagon: { x: 274, y: 108 }, // vers le Carrefour
  // Montagne (SO)
  mausolee: { x: 46, y: 230 }, // coin (départ)
  forge: { x: 120, y: 235 }, // vers le Gué
  sanctuaire: { x: 106, y: 172 }, // vers le Carrefour
  // Marais (SE)
  oracle: { x: 334, y: 230 }, // coin (départ)
  ziggourat: { x: 260, y: 235 }, // vers le Gué
  obelisque: { x: 274, y: 172 }, // vers le Carrefour
  // Lieux-ponts (spine centrale)
  pont: { x: 190, y: 46 },
  carrefour: { x: 190, y: 140 },
  gue: { x: 190, y: 234 },
};

export const VIEWBOX = { w: 380, h: 280 } as const;

// Arêtes uniques (a < b) dérivées de l'adjacence, pour tracer les chemins.
export const EDGES: [LocationId, LocationId][] = (() => {
  const out: [LocationId, LocationId][] = [];
  const seen = new Set<string>();
  for (const a of Object.keys(ADJACENCY) as LocationId[]) {
    for (const b of ADJACENCY[a]) {
      const key = a < b ? `${a}|${b}` : `${b}|${a}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(a < b ? [a, b] : [b, a]);
    }
  }
  return out;
})();

// Palette de pions (jusqu'à 6 joueurs).
export const PAWN_COLORS = [
  "#c2602e", // clay (toi)
  "#2f5d4f", // pine
  "#d99a3a", // amber
  "#4a86a8", // bleu
  "#8a5a9e", // violet
  "#a44a1f", // clay-deep
];

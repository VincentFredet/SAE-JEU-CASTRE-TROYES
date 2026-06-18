// Carte de RELIQUES : 4 ZONES-terrains de 3 lieux (coins), reliées par 3 LIEUX-PONTS
// centraux — le Pont (haut, Fleuve<->Forêt), le Gué (bas, Montagne<->Marais) et le
// Carrefour (centre, relie tout). Les ponts sont de vrais lieux (ils peuvent porter un
// ancien) mais ne sont d'AUCUNE zone et n'abritent JAMAIS de relique. Tout nœud est un
// lieu : pas de case vide. Les 10 ANCIENS sont postés (position fixe) ; leur RÔLE est
// tiré en secret à chaque partie.

export const LIEUX = [
  // Fleuve (NO)
  "citerne",
  "catacombe",
  "fonderie",
  // Forêt (NE)
  "jardin",
  "ossuaire",
  "lagon",
  // Montagne (SO)
  "sanctuaire",
  "mausolee",
  "forge",
  // Marais (SE)
  "obelisque",
  "ziggourat",
  "oracle",
] as const;
export type LieuId = (typeof LIEUX)[number];

// Lieux-ponts (connecteurs) : de vrais lieux, mais pas une zone et jamais une relique.
export const JUNCTIONS = ["pont", "carrefour", "gue"] as const;
export type JunctionId = (typeof JUNCTIONS)[number];

export type TileId = LieuId | JunctionId;
export const ALL_TILES: TileId[] = [...LIEUX, ...JUNCTIONS];

// Alias rétro-compat : le reste du code parle parfois de « LocationId ».
export type LocationId = TileId;
export const LOCATION_IDS = ALL_TILES;

// Beaucoup d'anciens (un par lieu) : chacun ne confie que 1-2 infos, donc l'info est
// répartie et il faut bouger / troquer pour la rassembler.
export const ANCIENS = [
  "scribe",
  "tisseur",
  "graveur",
  "augure",
  "conteuse",
  "veilleur",
  "pretresse",
  "passeur",
  "gardienne",
  "aieul",
  "devin",
  "herboriste",
  "nocher",
  "ermite",
  "glaneuse",
] as const;
export type AncienId = (typeof ANCIENS)[number];

// Position fixe de chaque ancien : UN par tuile (12 lieux + 3 lieux-ponts).
export const ANCIEN_TILE: Record<AncienId, TileId> = {
  scribe: "carrefour",
  conteuse: "pont",
  passeur: "gue",
  augure: "citerne", // Fleuve
  devin: "catacombe", // Fleuve
  graveur: "fonderie", // Fleuve
  aieul: "jardin", // Forêt
  veilleur: "ossuaire", // Forêt
  herboriste: "lagon", // Forêt
  tisseur: "sanctuaire", // Montagne
  nocher: "mausolee", // Montagne
  pretresse: "forge", // Montagne
  ermite: "obelisque", // Marais
  gardienne: "ziggourat", // Marais
  glaneuse: "oracle", // Marais
};

export const START_TILE: TileId = "carrefour";

// Départs RÉPARTIS : un coin par zone (NO / NE / SO / SE) → on démarre séparés.
export const START_TILES: TileId[] = ["catacombe", "ossuaire", "mausolee", "oracle", "fonderie", "ziggourat"];

// Adjacence : triangles de zone + étoile centrale (Carrefour) + 2 ponts. Navigable :
// depuis n'importe quelle zone on atteint le Carrefour vite, et donc toutes les autres.
const LINKS: [TileId, TileId][] = [
  // Fleuve (NO)
  ["catacombe", "citerne"],
  ["citerne", "fonderie"],
  ["fonderie", "catacombe"],
  // Forêt (NE)
  ["jardin", "ossuaire"],
  ["ossuaire", "lagon"],
  ["lagon", "jardin"],
  // Montagne (SO)
  ["sanctuaire", "mausolee"],
  ["mausolee", "forge"],
  ["forge", "sanctuaire"],
  // Marais (SE)
  ["obelisque", "ziggourat"],
  ["ziggourat", "oracle"],
  ["oracle", "obelisque"],
  // Pont (haut) : Fleuve <-> Forêt
  ["pont", "fonderie"],
  ["pont", "jardin"],
  ["pont", "carrefour"],
  // Gué (bas) : Montagne <-> Marais
  ["gue", "forge"],
  ["gue", "ziggourat"],
  ["gue", "carrefour"],
  // Carrefour (centre) : relie les 4 zones
  ["carrefour", "citerne"], // Fleuve
  ["carrefour", "lagon"], // Forêt
  ["carrefour", "sanctuaire"], // Montagne
  ["carrefour", "obelisque"], // Marais
];

function buildAdjacency(): Record<TileId, TileId[]> {
  const adj = Object.fromEntries(ALL_TILES.map((id) => [id, [] as TileId[]])) as Record<TileId, TileId[]>;
  for (const [a, b] of LINKS) {
    if (!adj[a].includes(b)) adj[a].push(b);
    if (!adj[b].includes(a)) adj[b].push(a);
  }
  return adj;
}

export const ADJACENCY: Record<TileId, TileId[]> = buildAdjacency();

export function areAdjacent(a: TileId, b: TileId): boolean {
  return ADJACENCY[a]?.includes(b) ?? false;
}

export function isLieu(id: string): id is LieuId {
  return (LIEUX as readonly string[]).includes(id);
}

export function isLocationId(value: unknown): value is TileId {
  return typeof value === "string" && (ALL_TILES as readonly string[]).includes(value);
}

export function ancienAtTile(tile: TileId): AncienId | null {
  for (const id of ANCIENS) if (ANCIEN_TILE[id] === tile) return id;
  return null;
}

// --- Attributs des lieux (déduction par recoupement) ---
// Chaque lieu de zone porte 2 attributs : son TERRAIN (la zone) et son TYPE (le bâti).
// Terrain × type identifient un lieu (4×3 = 12). (Les lieux-ponts n'ont pas d'attribut :
// aucune relique ne s'y cache.)
export const TERRAINS = ["fleuve", "foret", "montagne", "marais"] as const;
export type Terrain = (typeof TERRAINS)[number];
export const TYPES = ["temple", "tombeau", "atelier"] as const;
export type LieuType = (typeof TYPES)[number];

export type Attr = "terrain" | "type";
export interface LieuAttr {
  terrain: Terrain;
  type: LieuType;
}

// 4 terrains × 3 types = les 12 lieux. Les lieux d'un même terrain forment une zone.
const GRID: Record<Terrain, Record<LieuType, LieuId>> = {
  fleuve: { temple: "citerne", tombeau: "catacombe", atelier: "fonderie" },
  foret: { temple: "jardin", tombeau: "ossuaire", atelier: "lagon" },
  montagne: { temple: "sanctuaire", tombeau: "mausolee", atelier: "forge" },
  marais: { temple: "obelisque", tombeau: "ziggourat", atelier: "oracle" },
};

export const LIEU_ATTR: Record<LieuId, LieuAttr> = (() => {
  const out = {} as Record<LieuId, LieuAttr>;
  for (const t of TERRAINS) for (const ty of TYPES) out[GRID[t][ty]] = { terrain: t, type: ty };
  return out;
})();

export const LIEUX_BY_TERRAIN: Record<Terrain, LieuId[]> = (() => {
  const out = { fleuve: [], foret: [], montagne: [], marais: [] } as Record<Terrain, LieuId[]>;
  for (const L of LIEUX) out[LIEU_ATTR[L].terrain].push(L);
  return out;
})();

// Valeur d'un attribut pour un lieu (terrain/type/gardien).
export function attrValue(lieu: LieuId, axis: Attr): Terrain | LieuType {
  return LIEU_ATTR[lieu][axis];
}

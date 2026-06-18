import { JUNCTIONS, LIEU_ATTR, type LocationId, type LieuId } from "@jeux/shared/reliques";
import { POSITIONS, EDGES } from "@/components/reliques/positions";
import { TypeGlyph } from "@/components/reliques/TypeGlyph";

// Schéma statique du plateau (vitrine / règles) : 4 zones-terrains aux coins + les
// lieux-ponts au centre. Chaque lieu porte son icône de TYPE. Reprend la vraie géométrie.
type Props = {
  locations: Record<string, string>; // id -> nom complet (aria)
  short: Record<string, string>; // id -> étiquette courte (le type)
};

const C = {
  inkSoft: "#6b5d4f",
  line: "#e7ddca",
  cream: "#faf6ee",
  parchment: "#f2eadb",
  amber: "#d99a3a",
};

const junctionSet = new Set<string>(JUNCTIONS);
const ids = Object.keys(POSITIONS) as LocationId[];
const ZONES = [
  { x: 6, y: 6, w: 176, h: 128, fill: "#4a86a8" }, // Fleuve (NO)
  { x: 198, y: 6, w: 176, h: 128, fill: "#3f7d52" }, // Forêt (NE)
  { x: 6, y: 146, w: 176, h: 128, fill: "#8a7456" }, // Montagne (SO)
  { x: 198, y: 146, w: 176, h: 128, fill: "#3f6f68" }, // Marais (SE)
];

export function BoardMap({ locations, short }: Props) {
  return (
    <svg viewBox="0 0 380 280" className="w-full" role="img" aria-label={ids.map((id) => locations[id]).join(", ")}>
      <rect x="0" y="0" width="380" height="280" rx="16" fill={C.parchment} />
      {/* Les 4 zones-terrains */}
      <g opacity="0.22">
        {ZONES.map((z, i) => (
          <rect key={i} x={z.x} y={z.y} width={z.w} height={z.h} rx="40" fill={z.fill} />
        ))}
      </g>
      <rect x="1" y="1" width="378" height="278" rx="15" fill="none" stroke={C.line} strokeWidth="2" />

      {/* Liaisons */}
      <g stroke="#bca987" strokeWidth="1.4" strokeLinecap="round" opacity="0.65" strokeDasharray="1.5 3">
        {EDGES.map(([a, b]) => {
          const pa = POSITIONS[a];
          const pb = POSITIONS[b];
          return <line key={`${a}-${b}`} x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y} />;
        })}
      </g>

      {/* Noeuds */}
      {ids.map((id) => {
        const pos = POSITIONS[id];

        if (junctionSet.has(id)) {
          // Lieu-pont (connecteur) : pas de zone, jamais de relique.
          return (
            <g key={id}>
              <circle cx={pos.x} cy={pos.y} r="6" fill={C.parchment} stroke={C.amber} strokeWidth="1.6" strokeDasharray="2 2.2" />
              <text x={pos.x} y={pos.y + 15} textAnchor="middle" fontSize="6.5" fontWeight="600" fill={C.inkSoft}>{locations[id]}</text>
            </g>
          );
        }

        return (
          <g key={id}>
            <circle cx={pos.x} cy={pos.y} r="8.4" fill={C.cream} stroke="#9a7b4e" strokeWidth="1.4" />
            <g transform={`translate(${pos.x}, ${pos.y})`}>
              <TypeGlyph type={LIEU_ATTR[id as LieuId].type} color="#6b3f12" />
            </g>
            <text
              x={pos.x}
              y={pos.y + 16.5}
              textAnchor="middle"
              fontSize="6.4"
              fontWeight="700"
              fill="#3a2c1d"
              style={{ paintOrder: "stroke", stroke: C.cream, strokeWidth: 2.4, strokeLinejoin: "round" }}
            >
              {(() => {
                const s = short[id] ?? "";
                const i = s.indexOf(" ");
                const [l1, l2] = i === -1 ? [s, ""] : [s.slice(0, i), s.slice(i + 1)];
                return (
                  <>
                    <tspan x={pos.x} dy="0">{l1}</tspan>
                    {l2 && <tspan x={pos.x} dy="7.2">{l2}</tspan>}
                  </>
                );
              })()}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

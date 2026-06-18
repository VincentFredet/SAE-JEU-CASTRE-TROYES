"use client";

import { useTranslations } from "next-intl";
import { LIEUX, ANCIEN_TILE, LIEU_ATTR, type LocationId, type LieuId, type LieuType } from "@jeux/shared/reliques";
import { POSITIONS, EDGES, PAWN_COLORS } from "@/components/reliques/positions";
import { TypeGlyph } from "@/components/reliques/TypeGlyph";

const TYPES: LieuType[] = ["temple", "tombeau", "atelier"];

// Étiquette sur 2 lignes : "Temple" / "des Eaux" - nom complet, distinct par nœud.
const splitLabel = (s: string): [string, string] => {
  const i = s.indexOf(" ");
  return i === -1 ? [s, ""] : [s.slice(0, i), s.slice(i + 1)];
};

const lieuSet = new Set<string>(LIEUX);
const ancienByTile = new Map<string, string>(Object.entries(ANCIEN_TILE).map(([id, tile]) => [tile, id]));

// Zones-terrains (vagues, floutées) : 4 quadrants qui regroupent les lieux d'un même
// terrain. Repère spatial + ambiance, sans cloisonner.
const ZONES = [
  { key: "fleuve", x: 6, y: 6, w: 176, h: 128, fill: "#4a86a8", lx: 8, ly: 100, anchor: "start" as const },
  { key: "foret", x: 198, y: 6, w: 176, h: 128, fill: "#3f7d52", lx: 372, ly: 100, anchor: "end" as const },
  { key: "montagne", x: 6, y: 146, w: 176, h: 128, fill: "#8a7456", lx: 8, ly: 188, anchor: "start" as const },
  { key: "marais", x: 198, y: 146, w: 176, h: 128, fill: "#3f6f68", lx: 372, ly: 188, anchor: "end" as const },
] as const;

type Props = {
  players: { tile: string }[];
  seat: number;
  reachable: Set<LocationId>;
  shortName: (id: string) => string;
  onPick: (id: LocationId) => void;
};

export function ReliquesMap({ players, seat, reachable, shortName, onPick }: Props) {
  const t = useTranslations("reliques");
  const ancienLabel = (id: string) => t(`npcShort.${id}` as Parameters<typeof t>[0]);
  const byTile = new Map<string, number[]>();
  players.forEach((p, i) => {
    const l = byTile.get(p.tile) ?? [];
    l.push(i);
    byTile.set(p.tile, l);
  });

  return (
    <div>
      <svg viewBox="0 0 380 280" className="block w-full" role="img" aria-label={t("mapAria")}>
        <defs>
          <radialGradient id="rq-cand" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#ffe7ab" />
            <stop offset="100%" stopColor="#c98a2e" />
          </radialGradient>
          <filter id="rq-soft" x="-40%" y="-40%" width="180%" height="180%">
            <feDropShadow dx="0" dy="1" stdDeviation="1.1" floodColor="#211a13" floodOpacity="0.3" />
          </filter>
          <filter id="rq-blur" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="9" /></filter>
          <clipPath id="rq-clip"><rect x="0" y="0" width="380" height="280" rx="12" /></clipPath>
        </defs>
        <g clipPath="url(#rq-clip)">
          <image href="/img/reliques/map-zones.png" x="-8" y="-6" width="396" height="292" preserveAspectRatio="xMidYMid slice" />
          <rect x="0" y="0" width="380" height="280" fill="#f3ecdd" opacity="0.28" />
          {ZONES.map((z) => (
            <text key={z.key} x={z.lx} y={z.ly} textAnchor={z.anchor} fontSize="9.5" fontWeight="800" letterSpacing="1.5" fill="#33271a" opacity="0.26">
              {t(`terrains.${z.key}` as Parameters<typeof t>[0]).toUpperCase()}
            </text>
          ))}
        </g>

        {/* Chemins (traits) : halo clair sous un tracé plein, façon routes */}
        <g fill="none" strokeLinecap="round">
          {EDGES.map(([a, b]) => {
            const pa = POSITIONS[a];
            const pb = POSITIONS[b];
            return <line key={`u${a}-${b}`} x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y} stroke="#fbf6ec" strokeWidth="4.2" opacity="0.85" />;
          })}
          {EDGES.map(([a, b]) => {
            const pa = POSITIONS[a];
            const pb = POSITIONS[b];
            return <line key={`o${a}-${b}`} x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y} stroke="#9c7f4e" strokeWidth="1.7" opacity="0.9" />;
          })}
        </g>

        {(Object.keys(POSITIONS) as LocationId[]).map((id) => {
          const pos = POSITIONS[id];
          const canReach = reachable.has(id);
          const isLieu = lieuSet.has(id);
          const ancien = ancienByTile.get(id);

          // Lieux-ponts (connecteurs) : de vrais lieux (peuvent porter un ancien) mais
          // d'aucune zone, jamais une relique → anneau « passage » en pointillé.
          if (!isLieu) {
            return (
              <g key={id}>
                <circle cx={pos.x} cy={pos.y} r="6.8" fill="#efe7d6" stroke={canReach ? "#c2602e" : "#8a7c63"} strokeWidth={canReach ? "2.1" : "1.5"} strokeDasharray="2.8 2.2" />
                {canReach && <circle cx={pos.x} cy={pos.y} r="9.5" fill="none" stroke="#c2602e" strokeWidth="1.2" opacity="0.7" className="rq-pulse" />}
                {ancien && (
                  <>
                    <rect x={pos.x - 24} y={pos.y - 31} width="48" height="12" rx="6" fill="#2f5d4f" filter="url(#rq-soft)" />
                    <text x={pos.x} y={pos.y - 25} textAnchor="middle" dominantBaseline="central" fontSize="6.2" fontWeight="700" fill="#faf6ee">{ancienLabel(ancien)}</text>
                  </>
                )}
                <text x={pos.x} y={pos.y + 15} textAnchor="middle" fontSize="6.8" fontWeight="700" fill="#5a4d3a" style={{ paintOrder: "stroke", stroke: "#faf6ee", strokeWidth: 2.8, strokeLinejoin: "round" }}>
                  {shortName(id)}
                </text>
                {canReach && <circle cx={pos.x} cy={pos.y} r="15" fill="transparent" className="cursor-pointer" role="button" aria-label={id} data-testid={`tile-${id}`} onClick={() => onPick(id)} />}
              </g>
            );
          }

          const type = LIEU_ATTR[id as LieuId].type;
          return (
            <g key={id}>
              {/* disque-lieu neutre + icône de TYPE (temple / tombeau / atelier) - à toi de déduire */}
              <circle cx={pos.x} cy={pos.y} r="9.4" fill="#f4ecda" stroke="#9a7b4e" strokeWidth="1.2" filter="url(#rq-soft)" />
              <g transform={`translate(${pos.x}, ${pos.y})`}>
                <TypeGlyph type={type} color="#6b3f12" />
              </g>
              {canReach && <circle cx={pos.x} cy={pos.y} r="12.6" fill="none" stroke="#c2602e" strokeWidth="1.4" opacity="0.75" className="rq-pulse" />}
              {ancien && (
                <>
                  <rect x={pos.x - 22} y={pos.y - 32} width="44" height="11" rx="5.5" fill="#2f5d4f" filter="url(#rq-soft)" />
                  <text x={pos.x} y={pos.y - 26.3} textAnchor="middle" dominantBaseline="central" fontSize="5.8" fontWeight="700" fill="#faf6ee">{ancienLabel(ancien)}</text>
                </>
              )}
              {(() => {
                const [l1, l2] = splitLabel(shortName(id));
                return (
                  <text x={pos.x} y={pos.y + 16.5} textAnchor="middle" fontSize="6" fontWeight="700" fill="#33271a" style={{ paintOrder: "stroke", stroke: "#faf6ee", strokeWidth: 2.6, strokeLinejoin: "round" }}>
                    <tspan x={pos.x} dy="0">{l1}</tspan>
                    {l2 && <tspan x={pos.x} dy="7.6">{l2}</tspan>}
                  </text>
                );
              })()}
              {canReach && <circle cx={pos.x} cy={pos.y} r="15" fill="transparent" className="cursor-pointer" role="button" aria-label={id} data-testid={`tile-${id}`} onClick={() => onPick(id)} />}
            </g>
          );
        })}

        {players.map((p, i) => {
          const base = POSITIONS[p.tile as LocationId];
          const group = byTile.get(p.tile) ?? [i];
          const idx = group.indexOf(i);
          const angle = group.length > 1 ? (idx / group.length) * Math.PI * 2 : 0;
          const r = group.length > 1 ? 7 : 0;
          const x = base.x + Math.cos(angle) * r;
          const y = base.y + Math.sin(angle) * r;
          const color = PAWN_COLORS[i % PAWN_COLORS.length];
          const active = i === seat;
          return (
            <g key={i} className="pointer-events-none" opacity={active ? 1 : 0.92}>
              {active && <circle cx={x} cy={y} r="13" fill={color} opacity="0.18" className="rq-pulse" />}
              <circle cx={x} cy={y} r={active ? 8 : 6.4} fill={color} stroke={active ? "#211a13" : "#faf6ee"} strokeWidth={active ? "2.2" : "1.4"} filter="url(#rq-soft)" />
              <text x={x} y={y} textAnchor="middle" dominantBaseline="central" fontSize="7" fontWeight="700" fill="#faf6ee">{i + 1}</text>
            </g>
          );
        })}
      </svg>

      {/* Légende */}
      <div className="mt-1.5 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 px-1 text-[10px] text-ink-soft">
        {TYPES.map((ty) => (
          <span key={ty} className="inline-flex items-center gap-1">
            <svg width="13" height="13" viewBox="-7 -7 14 14" className="shrink-0" aria-hidden>
              <TypeGlyph type={ty} color="#6b3f12" />
            </svg>
            {t(`types.${ty}` as Parameters<typeof t>[0])}
          </span>
        ))}
        <span className="inline-flex items-center gap-1"><span className="inline-block rounded-full bg-pine px-1.5 py-px text-[7px] font-bold text-cream">A</span>{t("legendAncien")}</span>
      </div>
    </div>
  );
}

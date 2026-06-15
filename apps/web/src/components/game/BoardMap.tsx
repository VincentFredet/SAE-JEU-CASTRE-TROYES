type Locations = {
  temple: string;
  tombeau: string;
  sanctuaire: string;
  crypte: string;
  galerie: string;
  camp: string;
  bazar: string;
  atelier: string;
  jungle: string;
  marais: string;
  docks: string;
  falaise: string;
  pont: string;
  faille: string;
};

type Zones = {
  ruins: string;
  camp: string;
  lands: string;
};

type Props = {
  locations: Locations;
  zones: Zones;
  hubLabel: string;
  extractLabel: string;
};

const C = {
  clay: "#c2602e",
  pine: "#2f5d4f",
  amber: "#d99a3a",
  ink: "#211a13",
  line: "#e7ddca",
  cream: "#faf6ee",
  parchment: "#f2eadb",
  sand: "#e8d0c4",
};

type Node = { id: keyof Locations; x: number; y: number };

const NODES: Node[] = [
  { id: "temple", x: 55, y: 45 },
  { id: "tombeau", x: 135, y: 35 },
  { id: "galerie", x: 205, y: 48 },
  { id: "sanctuaire", x: 45, y: 115 },
  { id: "crypte", x: 135, y: 108 },
  { id: "pont", x: 215, y: 130 },
  { id: "camp", x: 265, y: 118 },
  { id: "bazar", x: 340, y: 88 },
  { id: "atelier", x: 340, y: 158 },
  { id: "faille", x: 220, y: 195 },
  { id: "marais", x: 60, y: 180 },
  { id: "jungle", x: 135, y: 205 },
  { id: "docks", x: 215, y: 245 },
  { id: "falaise", x: 310, y: 225 },
];

const BOTTLENECKS: (keyof Locations)[] = ["pont", "faille"];
const HUB: keyof Locations = "camp";
const EXTRACTS: (keyof Locations)[] = ["docks", "falaise"];
const OBJECTIVES: (keyof Locations)[] = ["sanctuaire", "bazar", "atelier"];

const LINKS: [keyof Locations, keyof Locations][] = [
  ["temple", "tombeau"],
  ["temple", "sanctuaire"],
  ["tombeau", "galerie"],
  ["sanctuaire", "crypte"],
  ["crypte", "tombeau"],
  ["crypte", "galerie"],
  ["galerie", "pont"],
  ["crypte", "pont"],
  ["pont", "camp"],
  ["camp", "bazar"],
  ["camp", "atelier"],
  ["bazar", "atelier"],
  ["camp", "faille"],
  ["faille", "jungle"],
  ["faille", "docks"],
  ["marais", "jungle"],
  ["jungle", "docks"],
  ["docks", "falaise"],
  ["faille", "falaise"],
];

function pos(id: keyof Locations) {
  return NODES.find((x) => x.id === id) ?? { x: 0, y: 0 };
}

function isBottleneckLink(a: keyof Locations, b: keyof Locations) {
  return BOTTLENECKS.includes(a) || BOTTLENECKS.includes(b);
}

export function BoardMap({ locations, zones, hubLabel, extractLabel }: Props) {
  const labelList = NODES.map((n) => locations[n.id]).join(", ");

  return (
    <svg
      viewBox="0 0 380 280"
      className="w-full"
      role="img"
      aria-label={labelList}
    >
      <defs>
        <linearGradient id="boardBg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={C.cream} />
          <stop offset="100%" stopColor={C.parchment} />
        </linearGradient>
        <radialGradient id="haloRuins" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={C.amber} stopOpacity="0.12" />
          <stop offset="100%" stopColor={C.amber} stopOpacity="0" />
        </radialGradient>
        <radialGradient id="haloCamp" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={C.clay} stopOpacity="0.12" />
          <stop offset="100%" stopColor={C.clay} stopOpacity="0" />
        </radialGradient>
        <radialGradient id="haloLands" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={C.pine} stopOpacity="0.12" />
          <stop offset="100%" stopColor={C.pine} stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect x="0" y="0" width="380" height="280" rx="18" fill="url(#boardBg)" />
      <rect
        x="1"
        y="1"
        width="378"
        height="278"
        rx="17"
        fill="none"
        stroke={C.line}
        strokeWidth="2"
      />

      {/* Halos de zones */}
      <ellipse cx="120" cy="80" rx="135" ry="80" fill="url(#haloRuins)" />
      <ellipse cx="305" cy="120" rx="95" ry="75" fill="url(#haloCamp)" />
      <ellipse cx="170" cy="215" rx="155" ry="80" fill="url(#haloLands)" />

      {/* Labels de zones */}
      <text x="30" y="22" fontSize="8" fontWeight="700" letterSpacing="1.2" fill={C.amber}>
        {zones.ruins.toUpperCase()}
      </text>
      <text
        x="370"
        y="48"
        textAnchor="end"
        fontSize="8"
        fontWeight="700"
        letterSpacing="1.2"
        fill={C.clay}
      >
        {zones.camp.toUpperCase()}
      </text>
      <text x="30" y="270" fontSize="8" fontWeight="700" letterSpacing="1.2" fill={C.pine}>
        {zones.lands.toUpperCase()}
      </text>

      {/* Liaisons normales */}
      <g stroke={C.line} strokeWidth="3" strokeLinecap="round">
        {LINKS.filter(([a, b]) => !isBottleneckLink(a, b)).map(([a, b]) => {
          const pa = pos(a);
          const pb = pos(b);
          return <line key={`${a}-${b}`} x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y} />;
        })}
      </g>

      {/* Liaisons via goulots (amber pointille) */}
      <g stroke={C.amber} strokeWidth="2.5" strokeLinecap="round" strokeDasharray="2 5">
        {LINKS.filter(([a, b]) => isBottleneckLink(a, b)).map(([a, b]) => {
          const pa = pos(a);
          const pb = pos(b);
          return <line key={`bn-${a}-${b}`} x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y} />;
        })}
      </g>

      {/* Noeuds */}
      {NODES.map((n) => {
        const isHub = n.id === HUB;
        const isExtract = EXTRACTS.includes(n.id);
        const isBottleneck = BOTTLENECKS.includes(n.id);
        const isObjective = OBJECTIVES.includes(n.id);

        if (isBottleneck) {
          const r = 7;
          return (
            <g key={n.id}>
              <circle
                cx={n.x}
                cy={n.y}
                r={r}
                fill={C.parchment}
                stroke={C.amber}
                strokeWidth="2"
                strokeDasharray="2 2.5"
              />
              <text
                x={n.x}
                y={n.y + r + 9}
                textAnchor="middle"
                fontSize="7.5"
                fontWeight="600"
                fill={C.clay}
              >
                {locations[n.id]}
              </text>
            </g>
          );
        }

        const w = 56;
        const h = 23;
        const x = n.x - w / 2;
        const y = n.y - h / 2;

        const fill = isHub ? C.clay : isExtract ? C.pine : C.cream;
        const stroke = isHub
          ? C.clay
          : isExtract
            ? C.pine
            : isObjective
              ? C.amber
              : C.line;
        const strokeWidth = isObjective ? 1.8 : 1.5;
        const textFill = isHub || isExtract ? C.cream : C.ink;

        return (
          <g key={n.id}>
            <rect
              x={x}
              y={y}
              width={w}
              height={h}
              rx="8"
              fill={fill}
              stroke={stroke}
              strokeWidth={strokeWidth}
            />
            <text
              x={n.x}
              y={n.y + 0.5}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="9.5"
              fontWeight="600"
              fill={textFill}
            >
              {locations[n.id]}
            </text>

            {isHub && (
              <text
                x={n.x}
                y={y + h + 10}
                textAnchor="middle"
                fontSize="6.5"
                fontWeight="700"
                letterSpacing="0.6"
                fill={C.clay}
              >
                {hubLabel.toUpperCase()}
              </text>
            )}

            {isExtract && (
              <g>
                <rect x={n.x - 28} y={y + h + 4} width="56" height="13" rx="6.5" fill={C.amber} />
                <text
                  x={n.x}
                  y={y + h + 11.5}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="6.5"
                  fontWeight="700"
                  letterSpacing="0.5"
                  fill={C.ink}
                >
                  {extractLabel.toUpperCase()}
                </text>
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );
}

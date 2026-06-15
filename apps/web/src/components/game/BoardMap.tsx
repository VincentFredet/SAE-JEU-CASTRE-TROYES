type Locations = {
  temple: string;
  tomb: string;
  sanctuary: string;
  camp: string;
  bazaar: string;
  jungle: string;
  docks: string;
};

type Props = {
  locations: Locations;
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
};

type Node = { id: keyof Locations; x: number; y: number };

const NODES: Node[] = [
  { id: "temple", x: 95, y: 32 },
  { id: "tomb", x: 215, y: 32 },
  { id: "sanctuary", x: 38, y: 112 },
  { id: "camp", x: 170, y: 110 },
  { id: "bazaar", x: 286, y: 112 },
  { id: "jungle", x: 120, y: 186 },
  { id: "docks", x: 228, y: 186 },
];

const LINKS: [keyof Locations, keyof Locations][] = [
  ["temple", "tomb"],
  ["temple", "sanctuary"],
  ["temple", "camp"],
  ["tomb", "camp"],
  ["camp", "bazaar"],
  ["camp", "jungle"],
  ["camp", "docks"],
  ["jungle", "docks"],
];

function pos(id: keyof Locations) {
  const n = NODES.find((x) => x.id === id);
  return n ?? { x: 0, y: 0 };
}

export function BoardMap({ locations, hubLabel, extractLabel }: Props) {
  return (
    <svg
      viewBox="0 0 320 220"
      className="w-full"
      role="img"
      aria-label={`${locations.temple}, ${locations.tomb}, ${locations.sanctuary}, ${locations.camp}, ${locations.bazaar}, ${locations.jungle}, ${locations.docks}`}
    >
      <defs>
        <linearGradient id="boardBg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={C.cream} />
          <stop offset="100%" stopColor={C.parchment} />
        </linearGradient>
      </defs>

      <rect x="0" y="0" width="320" height="220" rx="16" fill="url(#boardBg)" />
      <rect
        x="1"
        y="1"
        width="318"
        height="218"
        rx="15"
        fill="none"
        stroke={C.line}
        strokeWidth="2"
      />

      {/* Liaisons */}
      <g stroke={C.line} strokeWidth="3" strokeLinecap="round">
        {LINKS.map(([a, b]) => {
          const pa = pos(a);
          const pb = pos(b);
          return <line key={`${a}-${b}`} x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y} />;
        })}
      </g>

      {/* Noeuds */}
      {NODES.map((n) => {
        const isHub = n.id === "camp";
        const isExtract = n.id === "docks";
        const w = 58;
        const h = 24;
        const x = n.x - w / 2;
        const y = n.y - h / 2;

        const fill = isHub ? C.clay : isExtract ? C.pine : C.cream;
        const stroke = isHub ? C.clay : isExtract ? C.pine : C.line;
        const textFill = isHub || isExtract ? C.cream : C.ink;

        return (
          <g key={n.id}>
            <rect
              x={x}
              y={y}
              width={w}
              height={h}
              rx="9"
              fill={fill}
              stroke={stroke}
              strokeWidth="1.5"
            />
            <text
              x={n.x}
              y={n.y + 0.5}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="10"
              fontWeight="600"
              fill={textFill}
            >
              {locations[n.id]}
            </text>

            {isHub && (
              <text
                x={n.x}
                y={y + h + 11}
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
                <rect
                  x={n.x - 26}
                  y={y + h + 4}
                  width="52"
                  height="13"
                  rx="6.5"
                  fill={C.amber}
                />
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

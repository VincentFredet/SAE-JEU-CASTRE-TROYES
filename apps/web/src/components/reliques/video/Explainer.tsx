import { AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig, interpolate, spring, Easing, random, Img, staticFile } from "remotion";

const C = {
  cream: "#faf6ee",
  parchment: "#f2eadb",
  ink: "#211a13",
  inkSoft: "#6b5d4f",
  clay: "#c2602e",
  clayDeep: "#a44a1f",
  amber: "#d99a3a",
  gold: "#c98a2e",
  pine: "#2f5d4f",
  line: "#e7ddca",
  sun: "#cf9a34",
  sunDeep: "#8a5a14",
  moon: "#5b7fa6",
  moonDeep: "#34506e",
};
const FONT = "Georgia, 'Times New Roman', serif";
const SANS = "ui-sans-serif, system-ui, sans-serif";
// staticFile : résout depuis public/ aussi bien dans le <Player> que pour l'export Remotion.
const IMG = (n: string) => staticFile(`img/rumeur/${n}`);
const RELIQUES_LOGO = staticFile("img/reliques/logo.png");

const OUT = Easing.bezier(0.16, 1, 0.3, 1);
const INOUT = Easing.bezier(0.65, 0, 0.35, 1);
const SPRINGY = { damping: 14, mass: 0.7, stiffness: 110 };
const SNAP = { damping: 9, mass: 1, stiffness: 200 };
const BOUNCE = { damping: 11, mass: 0.8, stiffness: 150 };
const clamp = (x: number) => Math.max(0, Math.min(1, x));

// --- Animations d'éléments (variées : montée, glissé, pop avec rebond, révélation par volet) ---
function rise(f: number, fps: number, delay = 0, dy = 30) {
  const s = spring({ frame: f - delay, fps, config: SPRINGY });
  return { opacity: clamp(interpolate(f, [delay, delay + 8], [0, 1], { extrapolateRight: "clamp" })), transform: `translateY(${(1 - s) * dy}px)` };
}
function slideIn(f: number, fps: number, delay: number, fromX: number) {
  const s = spring({ frame: f - delay, fps, config: SPRINGY });
  return { opacity: clamp(interpolate(f, [delay, delay + 6], [0, 1], { extrapolateRight: "clamp" })), transform: `translateX(${interpolate(s, [0, 1], [fromX, 0])}px)` };
}
function popIn(f: number, fps: number, delay: number) {
  const s = spring({ frame: f - delay, fps, config: SPRINGY });
  return { opacity: clamp(interpolate(f, [delay, delay + 6], [0, 1], { extrapolateRight: "clamp" })), transform: `scale(${interpolate(s, [0, 1], [0.84, 1])})` };
}
// pop avec léger dépassement (rebond) - plus vivant qu'un fade.
function pop(f: number, fps: number, delay: number) {
  const s = spring({ frame: f - delay, fps, config: BOUNCE });
  return { opacity: clamp(interpolate(f, [delay, delay + 5], [0, 1], { extrapolateRight: "clamp" })), transform: `scale(${interpolate(s, [0, 1], [0.5, 1])})` };
}
// révélation par volet (le contenu se découvre du bas vers le haut).
function revealUp(f: number, fps: number, delay: number) {
  const s = spring({ frame: f - delay, fps, config: SPRINGY });
  return { opacity: clamp(interpolate(f, [delay, delay + 7], [0, 1], { extrapolateRight: "clamp" })), clipPath: `inset(${(1 - s) * 100}% 0 0 0)`, transform: `translateY(${(1 - s) * 16}px)` };
}
const drift = (f: number, amp = 6, period = 90, phase = 0) => Math.sin((f / period) * Math.PI * 2 + phase) * amp;

// --- Transitions de scène (push directionnel / zoom / volet, jamais un simple cut) ---
type TransKind = "wipeL" | "wipeR" | "wipeU" | "wipeD" | "fade";
type TStyle = { t: string; o: number; c?: string };

// Transitions = VOLETS (clip). La scène entrante est rendue à sa place définitive (centrée,
// IMMOBILE) et juste dévoilée par un volet directionnel par-dessus la sortante opaque.
// Le contenu ne glisse jamais → rien ne part sur un côté ni en haut, et pas de fondu fantôme.
function trIn(kind: TransKind, e: number): TStyle {
  const k = 1 - e; // 1 → 0
  switch (kind) {
    case "wipeR": return { t: `scale(1)`, o: 1, c: `inset(0 ${k * 100}% 0 0)` };
    case "wipeL": return { t: `scale(1)`, o: 1, c: `inset(0 0 0 ${k * 100}%)` };
    case "wipeD": return { t: `scale(1)`, o: 1, c: `inset(${k * 100}% 0 0 0)` };
    case "wipeU": return { t: `scale(1)`, o: 1, c: `inset(0 0 ${k * 100}% 0)` };
    default: return { t: `scale(1)`, o: e }; // fondu (1re scène, sur fond noir)
  }
}
// La sortante reste opaque et immobile : l'entrante la recouvre. Seule la dernière se fond au noir.
function trOut(kind: TransKind, x: number): TStyle {
  switch (kind) {
    case "wipeR":
    case "wipeL":
    case "wipeD":
    case "wipeU":
      return { t: `scale(1)`, o: 1 };
    default: return { t: `scale(1)`, o: 1 - x };
  }
}
const TR = 18;
function sceneTrans(f: number, dur: number, enter: TransKind, exit: TransKind) {
  // Le volet se termine PILE sur la dernière frame du chevauchement → plus de saut « pas au bout ».
  const e = clamp(interpolate(f, [0, TR - 1], [0, 1], { easing: OUT }));
  const x = clamp(interpolate(f, [dur - TR, dur - 1], [0, 1], { easing: INOUT }));
  const i = trIn(enter, e);
  const o = trOut(exit, x);
  return { opacity: i.o * o.o, transform: `${i.t} ${o.t}`, clipPath: e < 1 ? i.c : undefined };
}

// --- Emblèmes dessinés (pas d'emoji : rendu fiable et soigné) ---
function Sun({ size = 64 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <g stroke={C.sunDeep} strokeWidth="2.5" strokeLinejoin="round">
        {Array.from({ length: 12 }).map((_, i) => {
          const a = (i / 12) * Math.PI * 2;
          const x1 = 50 + Math.cos(a) * 30, y1 = 50 + Math.sin(a) * 30;
          const x2 = 50 + Math.cos(a) * 46, y2 = 50 + Math.sin(a) * 46;
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={C.sun} strokeWidth="5" strokeLinecap="round" />;
        })}
        <circle cx="50" cy="50" r="24" fill={C.sun} />
        <circle cx="50" cy="50" r="24" fill="none" stroke={C.sunDeep} strokeWidth="2.5" />
      </g>
    </svg>
  );
}
function Moon({ size = 64 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <path d="M64 16 A36 36 0 1 0 64 84 A28 28 0 1 1 64 16 Z" fill={C.moon} stroke={C.moonDeep} strokeWidth="2.5" strokeLinejoin="round" />
    </svg>
  );
}
function Tick({ ok, size = 30 }: { ok: boolean; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="11" fill={ok ? C.pine : C.clay} />
      {ok ? <path d="M7 12.5 L10.5 16 L17 8.5" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /> : <path d="M8 8 L16 16 M16 8 L8 16" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />}
    </svg>
  );
}

function Dust({ count = 18, color = "#d9b87a" }: { count?: number; color?: string }) {
  const f = useCurrentFrame();
  const { width, height } = useVideoConfig();
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {Array.from({ length: count }).map((_, i) => {
        const x = (((random(`x${i}`) * width + f * (0.4 + random(`v${i}`))) % (width + 40)) + width + 40) % (width + 40) - 20;
        const yy = (((random(`y${i}`) * height - f * (0.2 + random(`w${i}`) * 0.5)) % height) + height) % height;
        const size = 2 + random(`s${i}`) * 4;
        return <div key={i} style={{ position: "absolute", left: x, top: yy, width: size, height: size, borderRadius: "50%", background: color, opacity: 0.1 + random(`o${i}`) * 0.22, filter: "blur(0.6px)" }} />;
      })}
    </AbsoluteFill>
  );
}
function Grain() {
  const n = "data:image/svg+xml;utf8," + encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>`);
  return <AbsoluteFill style={{ backgroundImage: `url("${n}")`, backgroundSize: "180px", opacity: 0.05, mixBlendMode: "multiply", pointerEvents: "none" }} />;
}
function Vignette() {
  return <AbsoluteFill style={{ background: "radial-gradient(120% 120% at 50% 40%, transparent 50%, rgba(33,26,19,0.34))", pointerEvents: "none" }} />;
}

// Étiquette de chapitre (narratif, sans numéro).
function Chip({ label, dark = false }: { label: string; dark?: boolean }) {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
      <div style={{ ...rise(f, fps, 2, 12), display: "inline-flex", alignItems: "center", gap: 9, padding: "6px 16px", borderRadius: 999, background: dark ? "rgba(250,246,238,.16)" : C.ink, color: C.cream, fontSize: 13, fontWeight: 700, letterSpacing: 2.5, textTransform: "uppercase" }}>
        <span style={{ width: 7, height: 7, borderRadius: "50%", background: C.amber }} />{label}
      </div>
    </div>
  );
}

function Scene({ bg, image, scrim, dur, dark = false, enter, exit, children }: { bg?: string; image?: string; scrim?: string; dur: number; dark?: boolean; enter: TransKind; exit: TransKind; children: React.ReactNode }) {
  const f = useCurrentFrame();
  const tr = sceneTrans(f, dur, enter, exit);
  const zoom = interpolate(f, [0, dur], [1.06, 1.14]);
  const pan = interpolate(f, [0, dur], [-1.2, 1.2]);
  return (
    <AbsoluteFill style={{ opacity: tr.opacity, transform: tr.transform, clipPath: tr.clipPath }}>
      {image ? (
        <>
          <AbsoluteFill style={{ backgroundImage: `url("${image}")`, backgroundSize: "cover", backgroundPosition: "center", transform: `scale(${zoom}) translateX(${pan}%)` }} />
          {scrim && <AbsoluteFill style={{ background: scrim }} />}
        </>
      ) : (
        <AbsoluteFill style={{ background: bg, transform: `scale(${zoom})` }} />
      )}
      {/* Filtres décoratifs uniquement sur les fonds dégradés - jamais par-dessus une image. */}
      {!image && <Dust color={dark ? "#caa86a" : "#d9b87a"} count={dark ? 24 : 16} />}
      <AbsoluteFill style={{ fontFamily: SANS, color: dark ? C.cream : C.ink, padding: "64px 96px", justifyContent: "center" }}>{children}</AbsoluteFill>
      {!image && <Grain />}
      {!image && <Vignette />}
    </AbsoluteFill>
  );
}

const H = ({ children, size = 46, dark = false }: { children: React.ReactNode; size?: number; dark?: boolean }) => (
  <div style={{ fontFamily: FONT, fontSize: size, fontWeight: 700, textAlign: "center", lineHeight: 1.1, color: dark ? C.cream : C.ink }}>{children}</div>
);
const Sub = ({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) => (
  <div style={{ fontSize: 26, textAlign: "center", color: dark ? "rgba(250,246,238,.85)" : C.inkSoft, marginTop: 13 }}>{children}</div>
);
function Stamp({ f, fps, delay, color, children }: { f: number; fps: number; delay: number; color: string; children: React.ReactNode }) {
  const s = spring({ frame: f - delay, fps, config: SNAP });
  return <div style={{ transform: `scale(${interpolate(s, [0, 1], [1.2, 1])})`, opacity: clamp(interpolate(f, [delay, delay + 3], [0, 1], { extrapolateRight: "clamp" })), border: `4px solid ${color}`, color, padding: "8px 22px", borderRadius: 10, fontWeight: 800, letterSpacing: 1, fontSize: 25, textTransform: "uppercase", background: "rgba(255,255,255,.62)" }}>{children}</div>;
}
const Card = ({ text, bg, fg, w, sub }: { text: string; bg: string; fg: string; w?: number; sub?: string }) => (
  <div style={{ width: w, minWidth: w ? undefined : 230, padding: "13px 22px", borderRadius: 14, background: bg, color: fg, fontSize: 22, fontWeight: 700, textAlign: "center", boxShadow: "0 18px 40px -18px rgba(0,0,0,.5)", border: "1px solid rgba(33,26,19,.08)" }}>
    {text}
    {sub && <div style={{ fontSize: 14, fontWeight: 700, opacity: 0.7, marginTop: 3, letterSpacing: 1, textTransform: "uppercase" }}>{sub}</div>}
  </div>
);
const Ancien = ({ src, size = 130, ring = C.pine }: { src: string; size?: number; ring?: string }) => (
  <div style={{ width: size, height: size * 1.12, borderRadius: 16, overflow: "hidden", border: `3px solid ${ring}`, boxShadow: "0 20px 42px -18px rgba(0,0,0,.6)", background: C.parchment }}>
    <Img src={IMG(src)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
  </div>
);
const Avatar = ({ src, size = 100, ring = C.ink, dim = false }: { src: string; size?: number; ring?: string; dim?: boolean }) => (
  <div style={{ width: size, height: size, borderRadius: "50%", overflow: "hidden", border: `3px solid ${ring}`, boxShadow: "0 16px 34px -16px rgba(0,0,0,.6)", filter: dim ? "grayscale(.55) brightness(.92)" : "none" }}>
    <Img src={IMG(src)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
  </div>
);

type SceneProps = { dur: number; enter: TransKind; exit: TransKind };

// 1 - Tu arrives : la cité, deux camps secrets.
function S1Arrive({ dur, enter, exit }: SceneProps) {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const title = spring({ frame: f, fps, config: { damping: 12, mass: 0.9, stiffness: 120 } });
  return (
    <Scene image={IMG("scene-naufrage.png")} scrim="linear-gradient(to top, rgba(18,12,8,.86), rgba(18,12,8,.3) 55%, rgba(18,12,8,.6))" dur={dur} dark enter={enter} exit={exit}>
      <div style={{ textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center", gap: 30, marginBottom: 16 }}>
          <span style={{ transform: `translateX(${interpolate(spring({ frame: f - 2, fps, config: SPRINGY }), [0, 1], [-200, 0])}px) translateY(${drift(f, 6, 70)}px)` }}><Sun size={56} /></span>
          <span style={{ transform: `translateX(${interpolate(spring({ frame: f - 6, fps, config: SPRINGY }), [0, 1], [200, 0])}px) translateY(${-drift(f, 6, 70)}px)` }}><Moon size={52} /></span>
        </div>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <Img src={RELIQUES_LOGO} style={{ height: 180, width: "auto", transform: `scale(${interpolate(title, [0, 1], [0.82, 1])})`, opacity: clamp(title), filter: "drop-shadow(0 8px 30px rgba(0,0,0,.55))" }} />
        </div>
        <div style={{ ...rise(f, fps, 20), fontSize: 30, color: "rgba(250,246,238,.9)", marginTop: 12 }}>Deux camps cachés. Tout le monde ment.</div>
        <div style={{ ...rise(f, fps, 36), marginTop: 22, display: "inline-flex", alignItems: "center", gap: 14, fontSize: 21, color: "rgba(250,246,238,.82)", borderTop: "1px solid rgba(250,246,238,.25)", paddingTop: 16 }}>
          <span>4 ou 6 joueurs</span><span style={{ opacity: 0.45 }}>·</span><span>2 camps secrets</span>
        </div>
      </div>
    </Scene>
  );
}

// 2 - Ta quête : trouver SA relique parmi 12 lieux.
function S2Quete({ dur, enter, exit }: SceneProps) {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const drop = spring({ frame: f - 18, fps, config: { damping: 11, mass: 0.9 } });
  const on = drop > 0.6;
  const target = 6;
  return (
    <Scene image={IMG("map-velonde.png")} scrim="linear-gradient(rgba(242,234,219,.45), rgba(242,234,219,.3))" dur={dur} enter={enter} exit={exit}>
      <Chip label="Ta quête" />
      <div style={rise(f, fps, 6)}><H size={46}>Ton camp doit retrouver <b>sa</b> relique.</H></div>
      <div style={rise(f, fps, 14)}><Sub>Cachée dans un des 12 lieux : 4 zones × 3 types.</Sub></div>
      <div style={{ position: "relative", height: 188, marginTop: 12 }}>
        <div style={{ position: "absolute", left: "50%", marginLeft: -42, top: interpolate(drop, [0, 1], [-72, 12]), transform: `rotate(${interpolate(drop, [0, 1], [200, 0])}deg) scale(${interpolate(drop, [0, 1], [0.7, 1])})`, width: 84, height: 84, borderRadius: 16, overflow: "hidden", border: `3px solid ${C.amber}`, boxShadow: `0 0 34px ${C.amber}` }}>
          <Img src={IMG("relic-disque.png")} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
        <div style={{ position: "absolute", bottom: 2, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 14 }}>
          {Array.from({ length: 12 }).map((_, i) => {
            const lit = i === target && on;
            return <div key={i} style={{ ...popIn(f, fps, 10 + i * 2), width: lit ? 22 : 17, height: lit ? 22 : 17, background: lit ? "linear-gradient(135deg,#ffe7ab,#c98a2e)" : "#efe4cd", border: `2px solid ${lit ? "#7a4a14" : "#b9a37c"}`, borderRadius: 5, boxShadow: lit ? `0 0 18px ${C.amber}` : "none" }} />;
          })}
        </div>
      </div>
    </Scene>
  );
}

// 3 - Cherche les infos : explore et interroge les anciens.
function S3Cherche({ dur, enter, exit }: SceneProps) {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const walk = clamp(interpolate(f, [22, 74], [0, 1], { easing: INOUT }));
  return (
    <Scene image={IMG("map-velonde.png")} scrim="linear-gradient(rgba(242,234,219,.45), rgba(242,234,219,.3))" dur={dur} enter={enter} exit={exit}>
      <Chip label="Cherche les infos" />
      <div style={rise(f, fps, 6)}><H size={46}>Pour la localiser, il te faut des indices.</H></div>
      <div style={{ display: "flex", justifyContent: "center", marginTop: 26 }}>
        <div style={{ position: "relative", width: 560, height: 150 }}>
          <div style={{ position: "absolute", top: "50%", left: 78, width: `${walk * 320}px`, height: 0, borderTop: `3px dashed ${C.clay}`, opacity: 0.6 }} />
          <div style={{ position: "absolute", top: "50%", left: `${interpolate(walk, [0, 1], [8, 352])}px`, transform: `translateY(-50%) translateY(${drift(f, 4, 40)}px)` }}>
            <Avatar src="suspect-doge.png" size={64} ring={C.clay} />
          </div>
          <div style={{ position: "absolute", top: "50%", right: 0, opacity: pop(f, fps, 8).opacity, transform: `translateY(-50%) ${pop(f, fps, 8).transform}` }}>
            <Ancien src="npc-passeur.png" size={118} ring={C.pine} />
          </div>
        </div>
      </div>
      <div style={rise(f, fps, 16)}><Sub>Déplace-toi sur la carte et interroge les anciens.</Sub></div>
    </Scene>
  );
}

// 4 - Les anciens parlent : toujours vrai, mais par énigme (1er indice du fil rouge).
function S4Anciens({ dur, enter, exit }: SceneProps) {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const q = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(f / 8));
  return (
    <Scene bg={`linear-gradient(160deg, ${C.cream}, ${C.parchment})`} dur={dur} enter={enter} exit={exit}>
      <Chip label="Les anciens" />
      <div style={rise(f, fps, 6)}><H size={46}>Ils disent toujours vrai - mais par énigme.</H></div>
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 34, marginTop: 34 }}>
        <div style={pop(f, fps, 10)}><Ancien src="npc-erudit.png" size={140} ring={C.pine} /></div>
        <div style={{ ...slideIn(f, fps, 18, 150), display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
          <Card text="« ma relique n'est PAS en forêt »" bg={C.line} fg={C.ink} />
          <div style={{ display: "flex", alignItems: "center", gap: 16, opacity: q, fontWeight: 800, fontSize: 22 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 7, color: C.sunDeep }}><Sun size={26} /> ?</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 7, color: C.moonDeep }}><Moon size={24} /> ?</span>
          </div>
        </div>
      </div>
      <div style={rise(f, fps, 26)}><Sub>Un indice vague à la fois - et sans dire de quel camp.</Sub></div>
    </Scene>
  );
}

// 5 - Rassemble : recoupe les indices, de 12 lieux à un seul.
function S5Rassemble({ dur, enter, exit }: SceneProps) {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const merged = f >= 56;
  const glow = merged ? 0.5 + 0.5 * Math.sin((f - 56) / 7) : 0;
  return (
    <Scene bg={`linear-gradient(160deg, ${C.parchment}, #ece0cb)`} dur={dur} enter={enter} exit={exit}>
      <Chip label="Rassemble" />
      <div style={rise(f, fps, 6)}><H size={46}>Un indice ne suffit pas. Recoupe-les.</H></div>
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 14, marginTop: 30 }}>
        <div style={slideIn(f, fps, 10, -120)}><Card text="« au Fleuve »" bg={C.line} fg={C.ink} w={210} /></div>
        <div style={{ ...pop(f, fps, 24), fontSize: 34, fontFamily: FONT, color: C.inkSoft }}>+</div>
        <div style={slideIn(f, fps, 18, 120)}><Card text="« un Temple »" bg={C.line} fg={C.ink} w={200} /></div>
      </div>
      <div style={{ ...revealUp(f, fps, 42), display: "flex", justifyContent: "center", marginTop: 18 }}>
        <div style={{ fontSize: 30, color: C.clay, fontWeight: 800 }}>↓</div>
      </div>
      <div style={{ display: "flex", justifyContent: "center", marginTop: 10 }}>
        <div style={{ ...pop(f, fps, 54), padding: "14px 26px", borderRadius: 16, background: "linear-gradient(135deg,#ffe7ab,#d99a3a)", color: C.ink, fontSize: 24, fontWeight: 800, boxShadow: `0 0 ${18 + glow * 16}px rgba(217,154,58,${0.4 + glow * 0.4})` }}>
          Le Temple des Eaux
          <div style={{ fontSize: 13, fontWeight: 700, opacity: 0.75, marginTop: 3, letterSpacing: 1, textTransform: "uppercase" }}>de 12 lieux → 1 seul</div>
        </div>
      </div>
    </Scene>
  );
}

// 6 - Le hic : ton camp est secret.
function S6Hic({ dur, enter, exit }: SceneProps) {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const faces = ["suspect-doge", "suspect-vaux", "suspect-tibald", "suspect-coumb"];
  return (
    <Scene bg={`linear-gradient(160deg, ${C.ink}, #2f2418)`} dur={dur} dark enter={enter} exit={exit}>
      <Chip label="Le hic" dark />
      <div style={rise(f, fps, 6)}><H size={46} dark>Mais ton camp est secret.</H></div>
      <div style={{ display: "flex", justifyContent: "center", gap: 22, marginTop: 38 }}>
        {faces.map((s, i) => {
          const p = pop(f, fps, 12 + i * 6);
          return (
            <div key={i} style={{ opacity: p.opacity, transform: `${p.transform} translateY(${drift(f, 4, 55, i)}px)`, position: "relative" }}>
              <Avatar src={`${s}.png`} size={104} ring="#7a6a52" dim />
              <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", borderRadius: "50%", background: "rgba(33,26,19,.45)", color: C.cream, fontFamily: FONT, fontWeight: 800, fontSize: 42 }}>?</div>
            </div>
          );
        })}
      </div>
      <div style={rise(f, fps, 30)}><Sub dark>Tu ignores qui cherche avec toi… et qui cherche contre toi.</Sub></div>
    </Scene>
  );
}

// 7 - Trouve tes alliés : indice d'identité, et on met les infos en commun.
function S7Allies({ dur, enter, exit }: SceneProps) {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const bond = clamp(interpolate(f, [24, 56], [0, 1], { easing: OUT }));
  return (
    <Scene bg={`linear-gradient(160deg, ${C.cream}, ${C.parchment})`} dur={dur} enter={enter} exit={exit}>
      <Chip label="Tes alliés" />
      <div style={rise(f, fps, 6)}><H size={46}>Repère les tiens, et unissez vos infos.</H></div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginTop: 32 }}>
        <div style={pop(f, fps, 8)}><Avatar src="suspect-doge.png" size={110} ring={C.sun} /></div>
        <div style={{ position: "relative", width: 150, height: 6, margin: "0 10px" }}>
          <div style={{ position: "absolute", inset: 0, borderRadius: 3, background: C.line }} />
          <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${bond * 100}%`, borderRadius: 3, background: `linear-gradient(90deg,${C.sun},${C.amber})`, boxShadow: `0 0 14px ${C.amber}` }} />
          <div style={{ position: "absolute", left: "50%", top: "50%", transform: `translate(-50%,-50%) scale(${bond})`, opacity: bond }}><Sun size={30} /></div>
        </div>
        <div style={pop(f, fps, 16)}><Avatar src="suspect-tassel.png" size={110} ring={C.sun} /></div>
      </div>
      <div style={{ display: "flex", justifyContent: "center", marginTop: 18 }}>
        <div style={revealUp(f, fps, 32)}><Card text="« toi et Tassel - même camp »" bg={C.amber} fg={C.ink} sub="indice d'identité" /></div>
      </div>
      <div style={rise(f, fps, 44)}><Sub>À plusieurs, on resserre le bon lieu bien plus vite.</Sub></div>
    </Scene>
  );
}

// 8 - Piège les autres : refile du faux au camp adverse.
function S8Piege({ dur, enter, exit }: SceneProps) {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fly = clamp(interpolate(f, [28, 66], [0, 1], { easing: INOUT }));
  const flip = clamp(interpolate(f, [52, 68], [0, 1]));
  const lied = flip > 0.5;
  const squash = Math.max(0.08, Math.abs(Math.cos(flip * Math.PI)));
  return (
    <Scene bg={`linear-gradient(160deg, ${C.cream}, ${C.parchment})`} dur={dur} enter={enter} exit={exit}>
      <Chip label="Le mensonge" />
      <div style={rise(f, fps, 6)}><H size={46}>Toi, tu peux mentir.</H></div>
      <div style={{ position: "relative", height: 172, marginTop: 24 }}>
        <div style={{ position: "absolute", left: "6%", top: "50%", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, opacity: pop(f, fps, 8).opacity, transform: `translateY(-50%) ${pop(f, fps, 8).transform}` }}>
          <Avatar src="suspect-doge.png" size={100} ring={C.sun} />
          <span style={{ fontWeight: 800, color: C.pine, fontSize: 18 }}>toi</span>
        </div>
        <div style={{ position: "absolute", right: "6%", top: "50%", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, opacity: pop(f, fps, 14).opacity, transform: `translateY(-50%) ${pop(f, fps, 14).transform}` }}>
          <Avatar src="suspect-aigline.png" size={100} ring={C.moon} dim />
          <span style={{ fontWeight: 800, color: C.clayDeep, fontSize: 18 }}>adversaire</span>
        </div>
        <div style={{ position: "absolute", top: "50%", left: `${interpolate(fly, [0, 1], [24, 56])}%`, transform: `translateY(-50%) scaleX(${squash})`, padding: "12px 20px", borderRadius: 13, background: lied ? C.clay : C.line, color: lied ? C.cream : C.ink, fontSize: 21, fontWeight: 800, boxShadow: "0 16px 34px -16px rgba(0,0,0,.5)", whiteSpace: "nowrap" }}>
          {lied ? "« en forêt ! »" : "un indice…"}
        </div>
      </div>
      <div style={rise(f, fps, 18)}><Sub>Les anciens ne mentent jamais ; toi, en troquant, tu peux retourner une info.</Sub></div>
    </Scene>
  );
}

// 9 - Réclame : le 1er camp qui vise juste gagne (course).
function S9Reclame({ dur, enter, exit }: SceneProps) {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pB = popIn(f, fps, 22);
  return (
    <Scene bg={`linear-gradient(160deg, ${C.parchment}, #ece0cb)`} dur={dur} enter={enter} exit={exit}>
      <Chip label="Réclame" />
      <div style={rise(f, fps, 6)}><H size={46}>Quand ton camp tient le lieu, réclame.</H></div>
      <div style={{ display: "flex", justifyContent: "center", alignItems: "flex-start", gap: 46, marginTop: 28 }}>
        <div style={{ ...pop(f, fps, 12), display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          <div style={{ width: 76, height: 76, borderRadius: 14, overflow: "hidden", border: `3px solid ${C.sun}` }}><Img src={IMG("relic-disque.png")} style={{ width: "100%", height: "100%", objectFit: "cover" }} /></div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 800, color: C.pine, fontSize: 20 }}><Tick ok size={22} /> ton camp</div>
        </div>
        <div style={{ ...rise(f, fps, 6, 16), fontSize: 34, color: C.inkSoft, alignSelf: "center", fontFamily: FONT }}>contre</div>
        <div style={{ transform: pB.transform, opacity: pB.opacity * 0.55, filter: "grayscale(.5)", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          <div style={{ width: 76, height: 76, borderRadius: 14, overflow: "hidden", border: `3px solid ${C.moon}` }}><Img src={IMG("relic-couronne.png")} style={{ width: "100%", height: "100%", objectFit: "cover" }} /></div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 800, color: C.clayDeep, fontSize: 20 }}><Tick ok={false} size={22} /> l&apos;autre</div>
        </div>
      </div>
      <div style={{ textAlign: "center", marginTop: 24 }}><Stamp f={f} fps={fps} delay={44} color={C.pine}>Ton camp gagne</Stamp></div>
      <div style={rise(f, fps, 52)}><Sub>Le premier camp à viser juste l&apos;emporte. Réclame faux → ton camp bloqué.</Sub></div>
    </Scene>
  );
}

// 10 - Fin / appel à jouer.
function S10Fin({ dur, enter, exit }: SceneProps) {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: f, fps, config: { damping: 13 } });
  const cta = 1 + Math.sin(f / 8) * 0.03;
  return (
    <Scene image={IMG("cover-velonde.png")} scrim="linear-gradient(to top, rgba(18,12,8,.86), rgba(18,12,8,.42))" dur={dur} dark enter={enter} exit={exit}>
      <div style={{ textAlign: "center", color: C.cream }}>
        <div style={{ display: "flex", justifyContent: "center", gap: 30, marginBottom: 14 }}>
          <span style={{ transform: `translateX(${interpolate(s, [0, 1], [-220, 0])}px)` }}><Sun size={46} /></span>
          <span style={{ transform: `translateX(${interpolate(s, [0, 1], [220, 0])}px)` }}><Moon size={42} /></span>
        </div>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
          <Img src={RELIQUES_LOGO} style={{ height: 104, width: "auto", transform: `scale(${interpolate(s, [0, 1], [0.85, 1])})`, opacity: clamp(s), filter: "drop-shadow(0 6px 22px rgba(0,0,0,.55))" }} />
        </div>
        <div style={{ fontFamily: FONT, fontSize: 58, fontWeight: 700, transform: `scale(${interpolate(s, [0, 1], [0.85, 1])})`, opacity: clamp(s), textShadow: "0 6px 30px rgba(0,0,0,.7)" }}>À qui te fier ?</div>
        <div style={{ ...rise(f, fps, 22), fontSize: 28, color: "rgba(250,246,238,.85)", marginTop: 16 }}>4 ou 6 joueurs · un téléphone chacun</div>
        <div style={{ ...rise(f, fps, 40), display: "inline-block", marginTop: 26, padding: "16px 36px", borderRadius: 999, background: C.amber, color: C.ink, fontSize: 30, fontWeight: 800, transform: `scale(${cta})`, boxShadow: `0 0 34px rgba(217,154,58,.55)` }}>wevora.fr</div>
      </div>
    </Scene>
  );
}

const ORDER: { C: React.FC<SceneProps>; dur: number }[] = [
  { C: S1Arrive, dur: 160 },
  { C: S2Quete, dur: 185 },
  { C: S3Cherche, dur: 185 },
  { C: S4Anciens, dur: 210 },
  { C: S5Rassemble, dur: 220 },
  { C: S6Hic, dur: 175 },
  { C: S7Allies, dur: 205 },
  { C: S8Piege, dur: 205 },
  { C: S9Reclame, dur: 210 },
  { C: S10Fin, dur: 165 },
];
// Type de transition à chaque jointure (alterné pour la variété : push / zoom / volet).
const BOUND: TransKind[] = ["wipeL", "wipeU", "wipeR", "wipeD", "wipeL", "wipeU", "wipeR", "wipeD", "wipeL"];
const OVERLAP = TR;

export const EXPLAINER = { fps: 30, width: 1280, height: 720, durationInFrames: ORDER.reduce((a, o) => a + o.dur, 0) - OVERLAP * (ORDER.length - 1) };

export function Explainer() {
  const starts = ORDER.map((_, i) => ORDER.slice(0, i).reduce((acc, o) => acc + o.dur - OVERLAP, 0));
  return (
    <AbsoluteFill style={{ background: C.ink }}>
      {ORDER.map(({ C: Comp, dur }, i) => {
        const enter: TransKind = i === 0 ? "fade" : BOUND[i - 1]!;
        const exit: TransKind = i === ORDER.length - 1 ? "fade" : BOUND[i]!;
        return (
          <Sequence key={i} from={starts[i]} durationInFrames={dur}>
            <Comp dur={dur} enter={enter} exit={exit} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
}

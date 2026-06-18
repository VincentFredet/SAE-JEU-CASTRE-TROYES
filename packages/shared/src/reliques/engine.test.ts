import { describe, it, expect } from "vitest";
import {
  applyAction,
  createGame,
  consistentLieux,
  bindings,
  type GameState,
  type Note,
  type LocFact,
} from "./engine";
import { ANCIEN_TILE, LIEU_ATTR } from "./map";

// RNG déterministe (mulberry32) pour des parties reproductibles.
function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function game(seed = 7): GameState {
  return createGame({
    players: ["p0", "p1", "p2", "p3"],
    teams: { p0: "soleil", p1: "soleil", p2: "lune", p3: "lune" },
    relicLieu: { soleil: "sanctuaire", lune: "ziggourat" },
    rng: rng(seed),
  });
}

describe("createGame", () => {
  it("répartit les rôles : 8 anciens de lieu, 4 d'affiliation, 3 d'identité (15 au total)", () => {
    const g = game();
    expect(g.anciens).toHaveLength(15);
    const roles = g.anciens.reduce<Record<string, number>>((m, a) => ((m[a.role] = (m[a.role] ?? 0) + 1), m), {});
    expect(roles.loc).toBe(8);
    expect(roles.aff).toBe(4);
    expect(roles.id).toBe(3);
  });

  it("chaque camp a 4 anciens de lieu et un détenteur du positif, révélable par un affilieur", () => {
    const g = game();
    for (const relic of ["soleil", "lune"] as const) {
      const locs = g.anciens.filter((a) => a.role === "loc" && a.relic === relic);
      expect(locs).toHaveLength(4);
      const pos = locs.flatMap((a) => a.stock).find((f) => f.kind === "loc" && !f.neg);
      expect(pos).toBeTruthy();
      expect(pos && pos.kind === "loc" && pos.axis).toBe("terrain");
      expect(pos && pos.kind === "loc" && pos.value).toBe(LIEU_ATTR[g.relicLieu[relic]].terrain);
      const holder = (pos as LocFact).ancien;
      const revealed = g.anciens.some((a) => a.role === "aff" && a.stock.some((f) => f.kind === "aff" && f.ancien === holder && f.relic === relic));
      expect(revealed).toBe(true);
    }
  });

  it("les DEUX reliques sont solubles : toutes les affiliations + infos de lieu → 1 lieu chacune", () => {
    for (const seed of [1, 7, 42, 99, 2024]) {
      const g = game(seed);
      const notes: Note[] = [];
      for (const a of g.anciens) for (const f of a.stock) if (f.kind === "aff") notes.push({ fact: f, from: a.id, turn: 1 });
      for (const a of g.anciens) for (const f of a.stock) if (f.kind === "loc") notes.push({ fact: f, from: a.id, turn: 1 });
      expect(consistentLieux(notes, "soleil")).toEqual([g.relicLieu.soleil]);
      expect(consistentLieux(notes, "lune")).toEqual([g.relicLieu.lune]);
    }
  });

  it("à 4 joueurs, les indices d'identité ne disent QUE « pas ensemble »", () => {
    const idf = game().anciens.flatMap((a) => a.stock).filter((f) => f.kind === "id");
    expect(idf.length).toBeGreaterThan(0);
    expect(idf.every((f) => f.kind === "id" && f.same === false)).toBe(true);
  });

});

describe("interroger : récolter le savoir d'un ancien", () => {
  it("rend une info inédite, puis « rien de nouveau » une fois la poche vidée", () => {
    const g = game();
    const anc = g.anciens.find((a) => a.stock.length > 0)!;
    const tile = ANCIEN_TILE[anc.id];
    g.players[0]!.tile = tile;
    g.current = 0;
    const r1 = applyAction(g, 0, { type: "interroger", ancien: anc.id });
    expect(r1.events.some((e) => e.type === "noteReceived")).toBe(true);
    let s = r1.state;
    for (let k = 0; k < anc.stock.length; k++) {
      s.players[0]!.tile = tile;
      s.current = 0;
      s = applyAction(s, 0, { type: "interroger", ancien: anc.id }).state;
    }
    s.players[0]!.tile = tile;
    s.current = 0;
    const rEmpty = applyAction(s, 0, { type: "interroger", ancien: anc.id });
    expect(rEmpty.events.some((e) => e.type === "nothingNew")).toBe(true);
  });
});

describe("déduction : l'affiliation débloque la lecture des attributs", () => {
  it("un attribut ne contraint rien tant que l'ancien n'est pas lié à un camp", () => {
    const notes: Note[] = [{ fact: { kind: "loc", ancien: "scribe", axis: "terrain", value: "fleuve", neg: true }, from: "scribe", turn: 1 }];
    expect(consistentLieux(notes, "soleil")).toHaveLength(12);
  });

  it("recoupe terrain + type (lié) → 1 lieu ; un négatif lié → élimination de zone", () => {
    // soleil = sanctuaire (montagne / temple / loup).
    const notes: Note[] = [
      { fact: { kind: "aff", ancien: "graveur", relic: "soleil" }, from: "augure", turn: 1 },
      { fact: { kind: "loc", ancien: "graveur", axis: "terrain", value: "montagne", neg: false }, from: "graveur", turn: 1 },
    ];
    expect(bindings(notes).graveur).toBe("soleil");
    expect(consistentLieux(notes, "soleil")).toHaveLength(3); // 3 lieux de montagne
    notes.push({ fact: { kind: "loc", ancien: "graveur", axis: "type", value: "temple", neg: false }, from: "graveur", turn: 1 });
    expect(consistentLieux(notes, "soleil")).toEqual(["sanctuaire"]); // terrain + type → unique

    const notesNeg: Note[] = [
      { fact: { kind: "aff", ancien: "scribe", relic: "lune" }, from: "augure", turn: 1 },
      { fact: { kind: "loc", ancien: "scribe", axis: "terrain", value: "fleuve", neg: true }, from: "scribe", turn: 1 },
    ];
    const left = consistentLieux(notesNeg, "lune");
    expect(left).toHaveLength(9); // 12 - 3 lieux du Fleuve
    expect(left).not.toContain("citerne"); // citerne = Fleuve
  });
});

describe("échange réciproque & mensonge", () => {
  it("le proposeur ment, le destinataire dit vrai : les deux reçoivent une carte, un seul mensonge loggé", () => {
    const g = game();
    g.players[0]!.tile = "forge";
    g.players[2]!.tile = "forge";
    g.current = 0;
    g.players[0]!.notes = [{ fact: { kind: "loc", ancien: "scribe", axis: "terrain", value: "fleuve", neg: true }, from: "scribe", turn: 1 }];
    g.players[2]!.notes = [{ fact: { kind: "loc", ancien: "graveur", axis: "type", value: "atelier", neg: true }, from: "graveur", turn: 1 }];

    // 0 propose (en mentant), l'échange est en attente.
    let s = applyAction(g, 0, { type: "proposerTroc", to: 2, clue: 0, lie: true }).state;
    expect(s.pendingTrade).not.toBeNull();
    // une autre action de 0 est bloquée tant que l'échange est ouvert.
    expect(applyAction(s, 0, { type: "wait" }).state).toBe(s);

    // 2 accepte hors de son tour et rend une carte vraie.
    s = applyAction(s, 2, { type: "repondreTroc", accept: true, clue: 0, lie: false }).state;
    expect(s.pendingTrade).toBeNull();
    expect(s.lieLog).toHaveLength(1); // seul 0 a menti

    // 0 a menti -> 2 reçoit l'indice RETOURNÉ.
    expect(s.players[2]!.notes.find((nt) => nt.from === 0)!.fact).toEqual({ kind: "loc", ancien: "scribe", axis: "terrain", value: "fleuve", neg: false });
    // 2 a dit vrai -> 0 reçoit l'indice intact.
    expect(s.players[0]!.notes.find((nt) => nt.from === 2)!.fact).toEqual({ kind: "loc", ancien: "graveur", axis: "type", value: "atelier", neg: true });
  });

  it("un refus annule l'échange et rend la main au proposeur", () => {
    const g = game();
    g.players[0]!.tile = "forge";
    g.players[2]!.tile = "forge";
    g.current = 0;
    g.players[0]!.notes = [{ fact: { kind: "loc", ancien: "scribe", axis: "terrain", value: "fleuve", neg: true }, from: "scribe", turn: 1 }];
    let s = applyAction(g, 0, { type: "proposerTroc", to: 2, clue: 0, lie: false }).state;
    s = applyAction(s, 2, { type: "repondreTroc", accept: false }).state;
    expect(s.pendingTrade).toBeNull();
    expect(s.current).toBe(0); // le proposeur n'a pas perdu son tour
  });

  it("on troque TOUTES les familles ; mentir change le camp (aff) ou inverse le lien (id)", () => {
    const g = game();
    g.players[0]!.tile = "forge";
    g.players[2]!.tile = "forge";
    g.current = 0;
    g.players[0]!.notes = [{ fact: { kind: "aff", ancien: "scribe", relic: "soleil" }, from: "augure", turn: 1 }];
    g.players[2]!.notes = [{ fact: { kind: "id", a: 0, b: 1, same: true }, from: "tisseur", turn: 1 }];
    let s = applyAction(g, 0, { type: "proposerTroc", to: 2, clue: 0, lie: true }).state;
    s = applyAction(s, 2, { type: "repondreTroc", accept: true, clue: 0, lie: true }).state;
    // affiliation retournée : le camp change (soleil -> lune)
    expect(s.players[2]!.notes.find((n) => n.from === 0)!.fact).toEqual({ kind: "aff", ancien: "scribe", relic: "lune" });
    // identité retournée : ensemble -> pas ensemble
    expect(s.players[0]!.notes.find((n) => n.from === 2)!.fact).toEqual({ kind: "id", a: 0, b: 1, same: false });
  });
});

describe("recoupement : démasquer un mensonge", () => {
  it("une info reçue qui contredit une vérité d'ancien est démentie, et le menteur est signalé", () => {
    const g = game();
    g.players[0]!.tile = "forge";
    g.players[2]!.tile = "forge";
    g.current = 2; // p2 propose à p0
    // p0 SAIT déjà, par un ancien (vérité) : scribe parle d'un lieu en MARAIS.
    g.players[0]!.notes = [{ fact: { kind: "loc", ancien: "scribe", axis: "terrain", value: "marais", neg: false }, from: "scribe", turn: 1 }];
    g.players[2]!.notes = [{ fact: { kind: "loc", ancien: "scribe", axis: "terrain", value: "marais", neg: false }, from: "scribe", turn: 1 }];
    // p2 MENT en relayant « scribe : PAS en marais ».
    const s1 = applyAction(g, 2, { type: "proposerTroc", to: 0, clue: 0, lie: true }).state;
    const r = applyAction(s1, 0, { type: "repondreTroc", accept: true, clue: 0, lie: false });
    const received = r.state.players[0]!.notes.find((n) => n.from === 2)!;
    expect(received.fact).toEqual({ kind: "loc", ancien: "scribe", axis: "terrain", value: "marais", neg: true });
    expect(received.debunked).toBe(true); // contredit la vérité de l'ancien → démenti
    expect(r.events.some((e) => e.type === "lieRevealed" && e.seat === 0 && e.liar === 2)).toBe(true);
  });

  it("une note démentie n'influence plus la déduction", () => {
    const notes: Note[] = [
      { fact: { kind: "aff", ancien: "scribe", relic: "soleil" }, from: "augure", turn: 1 },
      { fact: { kind: "loc", ancien: "scribe", axis: "terrain", value: "montagne", neg: true }, from: 3, turn: 2, debunked: true },
    ];
    // sans le démenti la montagne serait exclue ; comme la note est démentie, les 3 lieux de montagne restent.
    expect(consistentLieux(notes, "soleil")).toHaveLength(12);
  });
});

describe("réclamation à double tranchant", () => {
  function reclaim(subs: Record<number, "sanctuaire" | "ziggourat" | "citerne">) {
    let s = applyAction(game(), 0, { type: "reclamer" }).state;
    expect(s.phase).toBe("claim");
    for (const seat of [0, 1, 2, 3]) s = applyAction(s, seat, { type: "claim", lieu: subs[seat]! }).state;
    return s;
  }

  it("ton camp juste + l'autre faux → tu gagnes", () => {
    const s = reclaim({ 0: "sanctuaire", 1: "sanctuaire", 2: "citerne", 3: "citerne" });
    expect(s.winner).toBe("soleil");
    expect(s.finished).toBe(true);
  });

  it("course : les deux justes → le déclencheur GAGNE (1er arrivé)", () => {
    const s = reclaim({ 0: "sanctuaire", 1: "sanctuaire", 2: "ziggourat", 3: "ziggourat" });
    expect(s.winner).toBe("soleil"); // c'est seat 0 (soleil) qui déclenche
  });

  it("ton camp faux → échec, équipe bloquée, la partie continue", () => {
    const s = reclaim({ 0: "citerne", 1: "citerne", 2: "ziggourat", 3: "ziggourat" });
    expect(s.winner).toBeNull();
    expect(s.phase).toBe("play");
    expect(s.teamBlockedUntil.soleil).toBeGreaterThan(0);
  });
});

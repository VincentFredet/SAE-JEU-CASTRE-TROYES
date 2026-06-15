import { describe, it, expect, beforeEach } from "vitest";
import { MATCH_STATUS, type CreateMatchPayload } from "@jeux/shared";
import { MatchManager } from "./matchManager";

const HOST = { userId: "host", username: "Host" };
const P2 = { userId: "p2", username: "Player Two" };
const P3 = { userId: "p3", username: "Player Three" };
const P4 = { userId: "p4", username: "Player Four" };

function payload(overrides: Partial<CreateMatchPayload> = {}): CreateMatchPayload {
  return { name: "Test", maxPlayers: 4, ...overrides };
}

describe("MatchManager.create", () => {
  let mgr: MatchManager;
  beforeEach(() => {
    mgr = new MatchManager();
  });

  it("initialises a lobby with the host on seat 0 as host", () => {
    const state = mgr.create(HOST, payload({ maxPlayers: 3 }));

    expect(state.status).toBe(MATCH_STATUS.Lobby);
    expect(state.players).toHaveLength(1);
    const host = state.players[0]!;
    expect(host.seat).toBe(0);
    expect(host.isHost).toBe(true);
    expect(host.connected).toBe(true);
    expect(host.userId).toBe(HOST.userId);
  });

  it("starts with no current turn, turn 0 and the requested maxPlayers", () => {
    const state = mgr.create(HOST, payload({ maxPlayers: 5 }));

    expect(state.currentTurnSeat).toBeNull();
    expect(state.turn).toBe(0);
    expect(state.winnerSeat).toBeNull();
    expect(state.board).toBeNull();
    expect(state.maxPlayers).toBe(5);
  });

  it("is retrievable by its generated id and listed", () => {
    const state = mgr.create(HOST, payload());
    expect(mgr.get(state.id)).toBe(state);
    expect(mgr.list()).toContainEqual({
      id: state.id,
      name: state.name,
      status: MATCH_STATUS.Lobby,
      playerCount: 1,
      maxPlayers: 4,
    });
  });
});

describe("MatchManager.join", () => {
  let mgr: MatchManager;
  beforeEach(() => {
    mgr = new MatchManager();
  });

  it("assigns the next free seat to a new player", () => {
    const m = mgr.create(HOST, payload());
    mgr.join(m.id, P2);
    const state = mgr.get(m.id)!;

    expect(state.players).toHaveLength(2);
    const p2 = state.players.find((p) => p.userId === P2.userId)!;
    expect(p2.seat).toBe(1);
    expect(p2.isHost).toBe(false);
    expect(p2.connected).toBe(true);
  });

  it("rejects joining once the match has started", () => {
    const m = mgr.create(HOST, payload());
    mgr.join(m.id, P2);
    mgr.start(m.id, HOST.userId);

    expect(() => mgr.join(m.id, P3)).toThrow("La partie a déjà commencé");
  });

  it("rejects joining a full lobby", () => {
    const m = mgr.create(HOST, payload({ maxPlayers: 2 }));
    mgr.join(m.id, P2);

    expect(() => mgr.join(m.id, P3)).toThrow("La partie est complète");
  });

  it("re-marks an existing player connected without duplicating them", () => {
    const m = mgr.create(HOST, payload());
    mgr.join(m.id, P2);
    mgr.setConnected(P2.userId, false);
    expect(mgr.get(m.id)!.players.find((p) => p.userId === P2.userId)!.connected).toBe(false);

    mgr.join(m.id, P2);
    const state = mgr.get(m.id)!;
    expect(state.players.filter((p) => p.userId === P2.userId)).toHaveLength(1);
    expect(state.players.find((p) => p.userId === P2.userId)!.connected).toBe(true);
    expect(state.players).toHaveLength(2);
  });

  it("fills the lowest free seat after a player left a gap", () => {
    const m = mgr.create(HOST, payload());
    mgr.join(m.id, P2); // seat 1
    mgr.join(m.id, P3); // seat 2
    mgr.leave(m.id, P2.userId); // frees seat 1

    mgr.join(m.id, P4);
    const p4 = mgr.get(m.id)!.players.find((p) => p.userId === P4.userId)!;
    expect(p4.seat).toBe(1);
  });
});

describe("MatchManager.start", () => {
  let mgr: MatchManager;
  beforeEach(() => {
    mgr = new MatchManager();
  });

  it("rejects a non-host trying to start", () => {
    const m = mgr.create(HOST, payload());
    mgr.join(m.id, P2);

    expect(() => mgr.start(m.id, P2.userId)).toThrow("Seul l'hôte peut lancer la partie");
  });

  it("rejects starting with fewer than two players", () => {
    const m = mgr.create(HOST, payload());

    expect(() => mgr.start(m.id, HOST.userId)).toThrow("Il faut au moins 2 joueurs");
  });

  it("moves to in_progress, turn 1, current turn on the lowest seat", () => {
    const m = mgr.create(HOST, payload());
    mgr.join(m.id, P2);
    mgr.join(m.id, P3);
    mgr.leave(m.id, HOST.userId); // host (seat 0) leaves, lowest seat now 1
    // remaining: P2 seat 1 (new host), P3 seat 2
    const newHost = mgr.get(m.id)!.players.find((p) => p.isHost)!;

    const state = mgr.start(m.id, newHost.userId);
    expect(state.status).toBe(MATCH_STATUS.InProgress);
    expect(state.turn).toBe(1);
    expect(state.currentTurnSeat).toBe(1);
  });
});

describe("MatchManager.applyAction end_turn", () => {
  let mgr: MatchManager;
  beforeEach(() => {
    mgr = new MatchManager();
  });

  it("rejects when the match is not in progress", () => {
    const m = mgr.create(HOST, payload());
    mgr.join(m.id, P2);

    expect(() => mgr.applyAction(m.id, HOST.userId, { type: "end_turn" })).toThrow(
      "La partie n'est pas en cours",
    );
  });

  it("rejects when it is not the player's turn", () => {
    const m = mgr.create(HOST, payload());
    mgr.join(m.id, P2);
    mgr.start(m.id, HOST.userId); // current turn seat 0 (host)

    expect(() => mgr.applyAction(m.id, P2.userId, { type: "end_turn" })).toThrow(
      "Ce n'est pas votre tour",
    );
  });

  it("rotates to the next seat in ascending order and increments the turn", () => {
    const m = mgr.create(HOST, payload());
    mgr.join(m.id, P2); // seat 1
    mgr.join(m.id, P3); // seat 2
    mgr.start(m.id, HOST.userId); // turn seat 0

    let state = mgr.applyAction(m.id, HOST.userId, { type: "end_turn" });
    expect(state.currentTurnSeat).toBe(1);
    expect(state.turn).toBe(2);

    state = mgr.applyAction(m.id, P2.userId, { type: "end_turn" });
    expect(state.currentTurnSeat).toBe(2);
    expect(state.turn).toBe(3);
  });

  it("wraps from the highest seat back to the lowest", () => {
    const m = mgr.create(HOST, payload());
    mgr.join(m.id, P2); // seat 1
    mgr.start(m.id, HOST.userId); // turn seat 0

    mgr.applyAction(m.id, HOST.userId, { type: "end_turn" }); // -> seat 1
    const state = mgr.applyAction(m.id, P2.userId, { type: "end_turn" }); // wrap -> seat 0
    expect(state.currentTurnSeat).toBe(0);
    expect(state.turn).toBe(3);
  });
});

describe("MatchManager.applyAction resign", () => {
  let mgr: MatchManager;
  beforeEach(() => {
    mgr = new MatchManager();
  });

  it("ends a two-player game with the remaining player as winner", () => {
    const m = mgr.create(HOST, payload());
    mgr.join(m.id, P2); // seat 1
    mgr.start(m.id, HOST.userId);

    const state = mgr.applyAction(m.id, HOST.userId, { type: "resign" });
    expect(state.status).toBe(MATCH_STATUS.Finished);
    expect(state.winnerSeat).toBe(1);
    expect(state.currentTurnSeat).toBeNull();
    expect(state.players).toHaveLength(1);
    expect(state.players[0]!.userId).toBe(P2.userId);
  });

  it("keeps a three-player game running and recomputes the current turn", () => {
    const m = mgr.create(HOST, payload());
    mgr.join(m.id, P2); // seat 1
    mgr.join(m.id, P3); // seat 2
    mgr.start(m.id, HOST.userId); // turn seat 0 (host)

    const state = mgr.applyAction(m.id, HOST.userId, { type: "resign" });
    expect(state.status).toBe(MATCH_STATUS.InProgress);
    expect(state.players).toHaveLength(2);
    expect(state.players.some((p) => p.userId === HOST.userId)).toBe(false);
    // current turn seat 0 left -> next ascending seat is 1
    expect(state.currentTurnSeat).toBe(1);
  });

  it("does not change the current turn when a non-active three-player resigns", () => {
    const m = mgr.create(HOST, payload());
    mgr.join(m.id, P2); // seat 1
    mgr.join(m.id, P3); // seat 2
    mgr.start(m.id, HOST.userId); // turn seat 0

    const state = mgr.applyAction(m.id, P3.userId, { type: "resign" }); // seat 2 leaves
    expect(state.status).toBe(MATCH_STATUS.InProgress);
    expect(state.currentTurnSeat).toBe(0);
  });

  it("throws on an unknown action type", () => {
    const m = mgr.create(HOST, payload());
    mgr.join(m.id, P2);
    mgr.start(m.id, HOST.userId);

    expect(() => mgr.applyAction(m.id, HOST.userId, { type: "teleport" })).toThrow(
      "Action inconnue : teleport",
    );
  });
});

describe("MatchManager.leave in lobby", () => {
  let mgr: MatchManager;
  beforeEach(() => {
    mgr = new MatchManager();
  });

  it("removes a non-host player and keeps the match", () => {
    const m = mgr.create(HOST, payload());
    mgr.join(m.id, P2);

    const res = mgr.leave(m.id, P2.userId);
    expect(res.removed).toBe(false);
    expect(res.state!.players).toHaveLength(1);
    expect(res.state!.players.some((p) => p.userId === P2.userId)).toBe(false);
  });

  it("deletes the match when the last player leaves", () => {
    const m = mgr.create(HOST, payload());

    const res = mgr.leave(m.id, HOST.userId);
    expect(res.removed).toBe(true);
    expect(res.state).toBeNull();
    expect(mgr.get(m.id)).toBeUndefined();
  });

  it("reassigns host to the lowest remaining seat when the host leaves", () => {
    const m = mgr.create(HOST, payload());
    mgr.join(m.id, P2); // seat 1
    mgr.join(m.id, P3); // seat 2

    const res = mgr.leave(m.id, HOST.userId);
    expect(res.removed).toBe(false);
    const hosts = res.state!.players.filter((p) => p.isHost);
    expect(hosts).toHaveLength(1);
    expect(hosts[0]!.seat).toBe(1);
    expect(hosts[0]!.userId).toBe(P2.userId);
  });

  it("returns the untouched match when the user is not a member", () => {
    const m = mgr.create(HOST, payload());
    const res = mgr.leave(m.id, "stranger");
    expect(res.removed).toBe(false);
    expect(res.state!.players).toHaveLength(1);
  });

  it("returns null state when the match does not exist", () => {
    const res = mgr.leave("missing", HOST.userId);
    expect(res.state).toBeNull();
    expect(res.removed).toBe(false);
  });
});

describe("MatchManager.leave during a game", () => {
  let mgr: MatchManager;
  beforeEach(() => {
    mgr = new MatchManager();
  });

  it("finishes the game with the lone survivor as winner", () => {
    const m = mgr.create(HOST, payload());
    mgr.join(m.id, P2); // seat 1
    mgr.start(m.id, HOST.userId);

    const res = mgr.leave(m.id, HOST.userId);
    expect(res.removed).toBe(false);
    expect(res.state!.status).toBe(MATCH_STATUS.Finished);
    expect(res.state!.winnerSeat).toBe(1);
    expect(res.state!.currentTurnSeat).toBeNull();
  });

  it("recomputes the current turn onto an existing seat when the active player leaves", () => {
    const m = mgr.create(HOST, payload());
    mgr.join(m.id, P2); // seat 1
    mgr.join(m.id, P3); // seat 2
    mgr.start(m.id, HOST.userId); // turn seat 0 (host, active)

    const res = mgr.leave(m.id, HOST.userId);
    expect(res.state!.status).toBe(MATCH_STATUS.InProgress);
    expect(res.state!.players).toHaveLength(2);
    const seats = res.state!.players.map((p) => p.seat);
    expect(seats).toContain(res.state!.currentTurnSeat);
    expect(res.state!.currentTurnSeat).toBe(1);
  });

  it("leaves the current turn untouched when a non-active player leaves", () => {
    const m = mgr.create(HOST, payload());
    mgr.join(m.id, P2); // seat 1
    mgr.join(m.id, P3); // seat 2
    mgr.start(m.id, HOST.userId); // turn seat 0

    const res = mgr.leave(m.id, P3.userId); // seat 2 (not active)
    expect(res.state!.status).toBe(MATCH_STATUS.InProgress);
    expect(res.state!.currentTurnSeat).toBe(0);
  });
});

describe("MatchManager.setConnected", () => {
  let mgr: MatchManager;
  beforeEach(() => {
    mgr = new MatchManager();
  });

  it("toggles connection and returns only the matches it changed", () => {
    const a = mgr.create(HOST, payload());
    const b = mgr.create(HOST, payload());
    mgr.create(P2, payload()); // host P2, not affected by host disconnect

    const affected = mgr.setConnected(HOST.userId, false);
    const affectedIds = affected.map((m) => m.id).sort();
    expect(affectedIds).toEqual([a.id, b.id].sort());
    for (const m of affected) {
      expect(m.players.find((p) => p.userId === HOST.userId)!.connected).toBe(false);
    }
  });

  it("returns nothing when the connection state is already the requested value", () => {
    const m = mgr.create(HOST, payload());
    expect(mgr.setConnected(HOST.userId, true)).toEqual([]);
    mgr.setConnected(HOST.userId, false);
    expect(mgr.setConnected(HOST.userId, false)).toEqual([]);
    expect(mgr.get(m.id)!.players[0]!.connected).toBe(false);
  });

  it("returns nothing for an unknown user", () => {
    mgr.create(HOST, payload());
    expect(mgr.setConnected("ghost", false)).toEqual([]);
  });
});

describe("MatchManager.sweep", () => {
  let mgr: MatchManager;
  beforeEach(() => {
    mgr = new MatchManager();
  });

  it("removes matches idle longer than maxIdleMs with all players disconnected", () => {
    const m = mgr.create(HOST, payload());
    mgr.setConnected(HOST.userId, false);
    const updatedAt = mgr.get(m.id)!.updatedAt;

    const removed = mgr.sweep(1000, updatedAt + 1001);
    expect(removed).toEqual([m.id]);
    expect(mgr.get(m.id)).toBeUndefined();
  });

  it("keeps matches that are within the idle window", () => {
    const m = mgr.create(HOST, payload());
    mgr.setConnected(HOST.userId, false);
    const updatedAt = mgr.get(m.id)!.updatedAt;

    const removed = mgr.sweep(1000, updatedAt + 500);
    expect(removed).toEqual([]);
    expect(mgr.get(m.id)).toBeDefined();
  });

  it("keeps matches with at least one connected player even when stale", () => {
    const m = mgr.create(HOST, payload());
    mgr.join(m.id, P2);
    mgr.setConnected(P2.userId, false); // host still connected
    const updatedAt = mgr.get(m.id)!.updatedAt;

    const removed = mgr.sweep(1000, updatedAt + 10000);
    expect(removed).toEqual([]);
    expect(mgr.get(m.id)).toBeDefined();
  });

  it("treats the boundary as not yet expired (strictly greater than maxIdleMs)", () => {
    const m = mgr.create(HOST, payload());
    mgr.setConnected(HOST.userId, false);
    const updatedAt = mgr.get(m.id)!.updatedAt;

    const removed = mgr.sweep(1000, updatedAt + 1000);
    expect(removed).toEqual([]);
    expect(mgr.get(m.id)).toBeDefined();
  });
});

describe("MatchManager error paths", () => {
  let mgr: MatchManager;
  beforeEach(() => {
    mgr = new MatchManager();
  });

  it("throws when joining, starting or acting on a missing match", () => {
    expect(() => mgr.join("missing", P2)).toThrow("Partie introuvable");
    expect(() => mgr.start("missing", HOST.userId)).toThrow("Partie introuvable");
    expect(() => mgr.applyAction("missing", HOST.userId, { type: "end_turn" })).toThrow(
      "Partie introuvable",
    );
  });

  it("rejects an action from a non-participant", () => {
    const m = mgr.create(HOST, payload());
    mgr.join(m.id, P2);
    mgr.start(m.id, HOST.userId);

    expect(() => mgr.applyAction(m.id, "stranger", { type: "end_turn" })).toThrow(
      "Vous ne participez pas à cette partie",
    );
  });
});

import { describe, it, expect } from "vitest";
import { LIEUX } from "@jeux/shared/reliques";
import { ReliquesManager } from "./reliquesManager.js";

function room() {
  const m = new ReliquesManager();
  const s = m.create({ userId: "u0", username: "Anna" }, { name: "test", maxPlayers: 6 });
  for (const u of ["u1", "u2", "u3"]) m.join(s.id, { userId: u, username: u });
  return { m, id: s.id };
}

describe("ReliquesManager", () => {
  it("crée un salon par code et accepte les joueurs", () => {
    const { m, id } = room();
    expect(id).toMatch(/^[A-Z0-9]{4}$/);
    expect(m.get(id)!.players).toHaveLength(4);
  });

  it("refuse de lancer à nombre impair, accepte à 4", () => {
    const { m, id } = room();
    m.join(id, { userId: "u4", username: "u4" }); // 5 -> impair
    expect(() => m.start(id, "u0")).toThrow();
    m.leave(id, "u4"); // retour à 4
    expect(() => m.start(id, "u0")).not.toThrow();
  });

  it("lance la partie, donne 2 équipes et une vue privée par joueur", () => {
    const { m, id } = room();
    m.start(id, "u0");
    const views = m.views(id);
    expect(views).toHaveLength(4);
    const teams = views.map((v) => v.view.team).sort();
    expect(teams.filter((t) => t === "soleil")).toHaveLength(2);
    expect(teams.filter((t) => t === "lune")).toHaveLength(2);
    // personne ne voit les vraies ruines tant que la partie n'est pas finie
    expect(views.every((v) => v.view.reveal === null)).toBe(true);
  });

  it("un tour avance le joueur courant ; une réclamation se résout", () => {
    const { m, id } = room();
    m.start(id, "u0");
    const seatUser = (seat: number) => m.get(id)!.players.find((p) => p.seat === seat)!.userId;
    // tour 1 : le joueur courant attend
    const cur0 = m.get(id)!.currentTurnSeat!;
    m.submit(id, seatUser(cur0), { type: "wait" });
    expect(m.get(id)!.currentTurnSeat).not.toBe(cur0);
    // le joueur courant déclenche une réclamation
    const cur1 = m.get(id)!.currentTurnSeat!;
    m.submit(id, seatUser(cur1), { type: "reclamer" });
    // tout le monde soumet un lieu -> ça résout (gagnant, ou échec qui relance)
    for (const seat of [0, 1, 2, 3]) m.submit(id, seatUser(seat), { type: "claim", lieu: LIEUX[0] });
    const after = m.get(id)!;
    expect(["finished", "in_progress"]).toContain(after.status);
  });
});

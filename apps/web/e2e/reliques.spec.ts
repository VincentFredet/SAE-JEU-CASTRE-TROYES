import { expect, test } from "@playwright/test";

// Le jeu RELIQUES (équipes cachées Soleil/Lune). On teste le mode hotseat public
// (/play/table) : pas besoin de compte ni de serveur temps réel.
test.describe("RELIQUES — hotseat", () => {
  test("boots a 4-player game through the pass screen", async ({ page }) => {
    await page.goto("/play/table");
    await expect(page.getByTestId("setup-start")).toBeVisible();
    await page.getByTestId("setup-start").click();

    // Écran « passe l'appareil » du premier joueur, puis on entre en jeu.
    await expect(page.getByTestId("pass-ready")).toBeVisible();
    await page.getByTestId("pass-ready").click();

    await expect(page.getByTestId("round-badge")).toBeVisible();
    await expect(page.getByTestId("round-badge")).toContainText("1");
  });

  test("can pick a 6-player game", async ({ page }) => {
    await page.goto("/play/table");
    await page.getByTestId("setup-seats-6").click();
    await page.getByTestId("setup-start").click();
    await expect(page.getByTestId("pass-ready")).toBeVisible();
  });

  test("solo mode boots straight into play (no pass screen, bots auto-play)", async ({ page }) => {
    await page.goto("/play/table");
    await page.getByTestId("setup-solo").click();
    // Pas d'écran « passe l'appareil » : on entre directement en jeu au siège 1.
    await expect(page.getByTestId("round-badge")).toBeVisible();
    await expect(page.getByTestId("pass-ready")).toHaveCount(0);
  });

  test("renders in English on /en", async ({ page }) => {
    await page.goto("/en/play/table");
    await expect(page.getByTestId("setup-start")).toContainText("Start");
    await page.getByTestId("setup-start").click();
    await expect(page.getByTestId("pass-ready")).toBeVisible();
    await page.getByTestId("pass-ready").click();
    await expect(page.getByTestId("round-badge")).toContainText("Round");
  });
});

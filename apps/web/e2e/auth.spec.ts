import { expect, test } from "@playwright/test";

test.describe("authentication", () => {
  test("login page shows the email and password fields", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "Connexion" })).toBeVisible();
    await expect(page.getByLabel("E-mail")).toBeVisible();
    await expect(page.getByLabel("Mot de passe")).toBeVisible();
    await expect(page.getByRole("button", { name: "Se connecter" })).toBeVisible();
  });

  test("signing in as admin redirects to the home page and shows the username", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.getByLabel("E-mail").fill("admin@jeux.test");
    await page.getByLabel("Mot de passe").fill("admin1234");

    await Promise.all([
      page.waitForURL((url) => url.pathname === "/"),
      page.getByRole("button", { name: "Se connecter" }).click(),
    ]);

    await expect(page.getByRole("link", { name: "admin" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Déconnexion" })).toBeVisible();
  });
});

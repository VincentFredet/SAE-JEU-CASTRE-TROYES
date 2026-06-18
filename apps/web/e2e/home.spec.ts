import { expect, test } from "@playwright/test";

test.describe("home page", () => {
  test("renders the French hero title on the default locale", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "Deux cultes cachés. Tout le monde ment." }),
    ).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("lang", "fr");
  });

  test("renders the English hero title on /en", async ({ page }) => {
    await page.goto("/en");
    await expect(
      page.getByRole("heading", { name: "Two hidden cults. Everyone lies." }),
    ).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
  });
});

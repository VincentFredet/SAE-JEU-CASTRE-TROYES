import { expect, test } from "@playwright/test";

test.describe("locale switcher", () => {
  test("renders fr and en buttons", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("button", { name: "fr" })).toBeVisible();
    await expect(page.getByRole("button", { name: "en" })).toBeVisible();
  });

  test("switching to English updates the URL and the content", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "Affrontez vos amis, en ligne." }),
    ).toBeVisible();

    await page.getByRole("button", { name: "en" }).click();

    await expect(page).toHaveURL(/\/en$/);
    await expect(
      page.getByRole("heading", { name: "Challenge your friends, online." }),
    ).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
  });
});

import { expect, test } from "@playwright/test";

test("loads the notebook and generates a report from sample data", async ({ page }) => {
  await page.goto("./");

  await expect(page.getByRole("heading", { name: "Citizen Lab Notebook" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Star repo/i })).toHaveAttribute(
    "href",
    "https://github.com/baditaflorin/citizen-lab-notebook",
  );
  await expect(page.getByRole("link", { name: /Support/i })).toHaveAttribute(
    "href",
    "https://www.paypal.com/paypalme/florinbadita",
  );

  await page.getByRole("button", { name: /Sample/i }).click();
  await expect(page.getByText(/Count=10/)).toBeVisible();
  await expect(page.getByText(/commit/i).first()).toBeVisible();
});

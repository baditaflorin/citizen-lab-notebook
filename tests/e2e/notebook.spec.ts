import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

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

  const messyCsv = readFileSync(
    join(process.cwd(), "test/fixtures/realdata/R07-messy-student.csv"),
    "utf8",
  );

  await page.getByLabel("CSV paste box").fill(messyCsv);
  await page.getByRole("button", { name: /Import pasted CSV/i }).click();
  await expect(page.getByText(/Imported 4 readings with medium confidence/i)).toBeVisible();
  await expect(page.getByText(/Flagged 2 issue/i)).toBeVisible();
  await expect(page.getByText(/Count=4/)).toBeVisible();
  await expect(page.getByText(/commit/i).first()).toBeVisible();
});

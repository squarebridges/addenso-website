import { test, expect } from "@playwright/test";
import { brokenImages, collectErrors } from "./helpers.mjs";

const DESIGNS = ["design-a", "design-b", "design-c"];

for (const name of DESIGNS) {
  test.describe(name, () => {
    test("loads with its stylesheet, a heading, and a contact form", async ({
      page,
    }) => {
      const errors = collectErrors(page);
      await page.goto(`/${name}/`);
      await page.waitForLoadState("networkidle");

      await expect(page).toHaveTitle("Addenso Labs – Data Science Reimagined");
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await expect(page.locator("form.contact-form")).toHaveCount(1);
      // A missing stylesheet falls back to the browser's default serif.
      const font = await page.evaluate(
        () => getComputedStyle(document.body).fontFamily,
      );
      expect(font).not.toMatch(/^Times/);
      expect(errors).toEqual([]);
    });

    test("carries the shared content", async ({ page }) => {
      await page.goto(`/${name}/`);
      const text = await page.locator("main").innerText();
      for (const expected of [
        "AI Implementations",
        "Evidence over AI vendor confidence",
        "Data Licensing & Syndication",
        "Partnerships & Alliances",
        "Operational Effectiveness",
        "60% of AI projects",
        "12.8%",
        "IDC 2026 AI MaturityScape Benchmark",
        "Nick Beaudoin",
        "Brandi Newlin",
        "Jeff Newlin",
        "Nash Taylor",
        "$240M",
        "+$120M",
      ]) {
        expect(text, `${name} is missing "${expected}"`).toContain(expected);
      }
      await expect(page.locator(".industry-slide")).toHaveCount(18);
    });

    test("every nav anchor targets an element on the page", async ({
      page,
    }) => {
      await page.goto(`/${name}/`);
      const dangling = await page.evaluate(() =>
        [...document.querySelectorAll('a[href^="#"]')]
          .map((a) => a.getAttribute("href"))
          .filter((href) => href.length > 1 && !document.querySelector(href)),
      );
      expect(dangling).toEqual([]);
    });

    test("every image loads", async ({ page }) => {
      await page.goto(`/${name}/`);
      expect(await brokenImages(page)).toEqual([]);
    });

    test("the contact form explains it is not connected yet", async ({
      page,
    }) => {
      await page.goto(`/${name}/`);
      const form = page.locator("form.contact-form");
      await form.locator('[name="name"]').fill("Test Person");
      await form.locator('[name="email"]').fill("test@example.com");
      await form.locator('[name="message"]').fill("Hello");
      await form
        .getByRole("button", { name: /Request More Information/ })
        .click();
      await expect(form.locator(".form-status")).toContainText(
        "info@addenso.com",
      );
      // Submitting must not navigate anywhere.
      expect(new URL(page.url()).pathname).toBe(`/${name}/`);
    });
  });
}

test("the designs index links to every design and the current site", async ({
  page,
}) => {
  await page.goto("/designs/");
  for (const href of [...DESIGNS.map((name) => `../${name}/`), "../"]) {
    await expect(page.locator(`a[href="${href}"]`)).toHaveCount(1);
    const response = await page.request.get(new URL(href, page.url()).href);
    expect(response.ok(), href).toBe(true);
  }
});

test("a design URL without a trailing slash redirects to one", async ({
  page,
}) => {
  const response = await page.request.get("/design-a", { maxRedirects: 0 });
  expect(response.status()).toBe(301);
  expect(response.headers().location).toBe("/design-a/");
});

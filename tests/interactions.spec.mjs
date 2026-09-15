import { test, expect } from "@playwright/test";

test.describe("desktop interactions", () => {
  test.skip(({ isMobile }) => isMobile, "covered by the mobile suite instead");

  test("service cards flip to their detail copy", async ({ page }) => {
    await page.goto("/");

    const card = page.locator(".service-card").first();
    await expect(card).toHaveAttribute("aria-expanded", "false");

    await card.hover();
    await expect(card).toHaveAttribute("aria-expanded", "true");
    await expect(card.locator(".service-back")).toContainText(
      "Anonymize, aggregate, and fuse",
    );

    await page.mouse.move(0, 0);
    await expect(card).toHaveAttribute("aria-expanded", "false");
  });

  test("carousel arrows page through the industries and wrap around", async ({
    page,
  }) => {
    await page.goto("/");

    const track = page.locator(".industry-track");
    const scrollLeft = () => track.evaluate((element) => element.scrollLeft);
    const maxScroll = await track.evaluate(
      (element) => element.scrollWidth - element.clientWidth,
    );
    expect(maxScroll).toBeGreaterThan(0);

    await page.locator(".carousel-control.next").click();
    await expect.poll(scrollLeft).toBeGreaterThan(0);

    await page.locator(".carousel-control.previous").click();
    await expect.poll(scrollLeft).toBe(0);

    // Stepping back from a standstill at the start wraps to the end.
    await page.locator(".carousel-control.previous").click();
    await expect.poll(scrollLeft).toBe(maxScroll);

    // And stepping forward from the end wraps back to the start.
    await page.locator(".carousel-control.next").click();
    await expect.poll(scrollLeft).toBe(0);
  });

  test("back-to-top appears only after scrolling past the hero", async ({
    page,
  }) => {
    await page.goto("/");

    const button = page.locator(".back-to-top");
    await expect(button).toBeHidden();

    await page.locator("#case-studies").scrollIntoViewIfNeeded();
    await expect(button).toBeVisible();
  });
});

test.describe("mobile interactions", () => {
  test.skip(
    ({ isMobile }) => !isMobile,
    "covered by the desktop suite instead",
  );

  test("hamburger opens the nav and a link closes it again", async ({
    page,
  }) => {
    await page.goto("/");

    const toggle = page.getByRole("button", { name: "Toggle navigation" });
    const links = page.locator("#nav-links");

    await expect(links).toBeHidden();
    await expect(toggle).toHaveAttribute("aria-expanded", "false");

    await toggle.click();
    await expect(links).toBeVisible();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");

    await links.getByRole("link", { name: "Services" }).click();
    await expect(links).toBeHidden();
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
  });

  test("the page never scrolls sideways", async ({ page }) => {
    await page.goto("/");

    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
});

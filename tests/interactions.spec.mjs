import { test, expect } from "@playwright/test";

for (const [label, url] of [
  ["HTTP", "/"],
  ["local file", new URL("../apps/landing/index.html", import.meta.url).href],
]) {
  test(`${label}: all service cards toggle on click or tap and stay open until activated again`, async ({
    page,
    isMobile,
  }) => {
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    await page.goto(url);

    for (const card of await page.locator(".service-card").all()) {
      await expect(card).toHaveAttribute("aria-expanded", "false");
      if (isMobile) await card.tap();
      else await card.click();
      await expect(card).toHaveAttribute("aria-expanded", "true");
      await expect(card.locator(".service-card-inner")).toHaveCSS(
        "transform",
        /^matrix3d\(-1,/,
      );

      await page.mouse.move(0, 0);
      await expect(card).toHaveAttribute("aria-expanded", "true");

      if (isMobile) await card.tap();
      else await card.click();
      await expect(card).toHaveAttribute("aria-expanded", "false");
      await expect(card.locator(".service-card-inner")).toHaveCSS(
        "transform",
        "none",
      );
    }
    expect(errors).toEqual([]);
  });
}

test.describe("desktop interactions", () => {
  test.skip(({ isMobile }) => isMobile, "covered by the mobile suite instead");

  test("service cards toggle with Enter and Space without opening on hover or focus", async ({
    page,
  }) => {
    await page.goto("/");

    const card = page.locator(".service-card").first();
    await expect(card).toHaveAttribute("aria-expanded", "false");

    await card.hover();
    await expect(card).toHaveAttribute("aria-expanded", "false");

    await card.focus();
    await expect(card).toHaveAttribute("aria-expanded", "false");

    await page.keyboard.press("Enter");
    await expect(card).toHaveAttribute("aria-expanded", "true");

    await page.keyboard.press("Space");
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

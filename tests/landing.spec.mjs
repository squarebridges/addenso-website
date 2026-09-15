import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("renders every section of the page in order", async ({ page }) => {
  await expect(page).toHaveTitle("Addenso Labs – Data Science Reimagined");

  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    /Practical Data Science\s+Quantifiable Outcomes/,
  );

  const headings = page.locator("main h2");
  await expect(headings).toHaveText([
    "Our Team",
    "Our Services",
    "Data Initiatives Aren’t Easy",
    "Industry Experience",
    "Case Studies",
  ]);
});

test("has the counts the original site has", async ({ page }) => {
  await expect(page.locator(".team-card")).toHaveCount(6);
  await expect(page.locator(".service-card")).toHaveCount(3);
  await expect(page.locator(".industry-slide")).toHaveCount(18);
  await expect(page.locator(".case-card")).toHaveCount(3);
});

test("every contact route points at the right mailbox", async ({ page }) => {
  // Scoped by class rather than role: on mobile the nav starts collapsed.
  await expect(page.locator(".nav-links > .button")).toHaveAttribute(
    "href",
    "mailto:info@addenso.com",
  );
  await expect(
    page.getByRole("link", { name: "Let’s Discuss Your Opportunity" }),
  ).toHaveAttribute("href", "mailto:jnewlin@addenso.com");
  await expect(page.getByRole("link", { name: "Contact Us" })).toHaveAttribute(
    "href",
    "mailto:info@addenso.com",
  );
  await expect(
    page.getByRole("link", { name: "+1 404-882-5333" }),
  ).toHaveAttribute("href", "tel:+14048825333");
});

test("every image and the hero video load", async ({ page }) => {
  const broken = await page.evaluate(async () => {
    const images = [...document.images];
    images.forEach((image) => image.removeAttribute("loading"));
    await Promise.all(
      images.map((image) =>
        image.complete
          ? Promise.resolve()
          : new Promise((resolve) => {
              image.addEventListener("load", resolve, { once: true });
              image.addEventListener("error", resolve, { once: true });
            }),
      ),
    );
    return images
      .filter((image) => image.naturalWidth === 0)
      .map((image) => image.src);
  });

  expect(broken).toEqual([]);

  const video = page.locator(".hero-media video");
  await expect(video).toBeVisible();
  await expect
    .poll(() => video.evaluate((element) => element.readyState))
    .toBeGreaterThan(0);
});

test("logs nothing to the console", async ({ page }) => {
  const errors = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));

  await page.reload();
  await page.waitForLoadState("networkidle");

  expect(errors).toEqual([]);
});

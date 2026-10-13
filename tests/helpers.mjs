// Shared Playwright helpers. Not a spec: Playwright only collects *.spec.* files.

/** Force every lazy image to load and return the src of any that failed. */
export async function brokenImages(page) {
  return page.evaluate(async () => {
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
}

/** Collect console errors and uncaught exceptions for the life of the page. */
export function collectErrors(page) {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  return errors;
}

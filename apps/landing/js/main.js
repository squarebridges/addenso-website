// Main JavaScript for the Addenso Labs landing page

document.addEventListener("DOMContentLoaded", () => {
  initMobileNav();
  initServiceCards();
  initIndustryCarousel();
  initBackToTop();
});

/**
 * Mobile nav: the hamburger toggles the link list, and tapping any link
 * inside it closes the menu again (same-page anchors don't reload).
 */
function initMobileNav() {
  const toggle = document.querySelector(".nav-toggle");
  const links = document.getElementById("nav-links");
  if (!toggle || !links) return;

  const close = () => {
    links.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
  };

  toggle.addEventListener("click", () => {
    const open = links.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(open));
  });

  links
    .querySelectorAll("a")
    .forEach((link) => link.addEventListener("click", close));

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });
}

/**
 * Service cards flip to reveal their detail copy. They're buttons, so the
 * flip is driven by aria-expanded and works from the keyboard too. Pointer
 * users get the flip on hover as well, which matches the original site.
 */
function initServiceCards() {
  const cards = document.querySelectorAll(".service-card");
  const canHover = window.matchMedia("(hover: hover)").matches;

  cards.forEach((card) => {
    const setFlipped = (flipped) =>
      card.setAttribute("aria-expanded", String(flipped));

    card.addEventListener("click", () => {
      setFlipped(card.getAttribute("aria-expanded") !== "true");
    });

    if (canHover) {
      card.addEventListener("mouseenter", () => setFlipped(true));
      card.addEventListener("mouseleave", () => setFlipped(false));
      card.addEventListener("focus", () => setFlipped(true));
      card.addEventListener("blur", () => setFlipped(false));
    }
  });
}

/**
 * Industry carousel: the track is a native scroll-snap row, so the arrows
 * only need to nudge it by one page worth of slides.
 */
function initIndustryCarousel() {
  const carousel = document.querySelector(".industry-carousel");
  if (!carousel) return;

  const track = carousel.querySelector(".industry-track");
  const previous = carousel.querySelector(".carousel-control.previous");
  const next = carousel.querySelector(".carousel-control.next");
  if (!track || !previous || !next) return;

  const page = () => {
    const slide = track.querySelector(".industry-slide");
    return slide ? slide.getBoundingClientRect().width + 20 : track.clientWidth;
  };

  const scrollBy = (direction) => {
    const max = track.scrollWidth - track.clientWidth;
    const atStart = track.scrollLeft <= 1;
    const atEnd = track.scrollLeft >= max - 1;

    // Wrap only from an actual end, so a click landing mid-animation clamps
    // to the nearest edge instead of jumping to the far side of the track.
    let left;
    if (direction > 0 && atEnd) left = 0;
    else if (direction < 0 && atStart) left = max;
    else
      left = Math.min(max, Math.max(0, track.scrollLeft + direction * page()));

    track.scrollTo({ left, behavior: "smooth" });
  };

  previous.addEventListener("click", () => scrollBy(-1));
  next.addEventListener("click", () => scrollBy(1));
}

/**
 * Back-to-top button only appears once the visitor has scrolled past the hero.
 */
function initBackToTop() {
  const button = document.querySelector(".back-to-top");
  if (!button) return;

  const update = () => {
    button.hidden = window.scrollY < 400;
  };

  update();
  window.addEventListener("scroll", update, { passive: true });
}

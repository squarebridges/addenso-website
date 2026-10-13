// Design A behaviour: mobile nav, compacting header, service flip cards,
// scroll reveal, and a contact form that is honest about not being wired up yet.

document.addEventListener("DOMContentLoaded", () => {
  initMobileNav();
  initHeaderState();
  initServiceCards();
  initReveal();
  initContactForm();
});

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
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") close();
  });
}

/** The header gains a border and a smaller logo once the page has scrolled. */
function initHeaderState() {
  const header = document.querySelector(".site-header");
  if (!header) return;
  const update = () =>
    header.classList.toggle("is-scrolled", window.scrollY > 8);
  update();
  window.addEventListener("scroll", update, { passive: true });
}

/**
 * Service cards are buttons that flip on activation. Driven by aria-expanded,
 * so clicks, taps, Enter, and Space all work and hover leaves the face alone.
 */
function initServiceCards() {
  document.querySelectorAll(".service-card").forEach((card) => {
    card.addEventListener("click", () => {
      const flipped = card.getAttribute("aria-expanded") === "true";
      card.setAttribute("aria-expanded", String(!flipped));
    });
  });
}

/** Fade sections up as they enter the viewport. No-op under reduced motion. */
function initReveal() {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const targets = document.querySelectorAll(
    ".section-head, .service-card, .metrics li, .case-card, .team-member, .credentials li, .contact-form",
  );
  if (reduce || !("IntersectionObserver" in window)) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0.1 },
  );
  targets.forEach((target, index) => {
    target.classList.add("reveal");
    target.style.transitionDelay = `${(index % 4) * 60}ms`;
    observer.observe(target);
  });
}

/**
 * The form has no backend yet. Rather than post to nowhere, validate the
 * fields and tell the visitor how to reach us until the service is connected.
 */
function initContactForm() {
  const form = document.querySelector(".contact-form");
  if (!form) return;
  const status = form.querySelector(".form-status");

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    status.classList.remove("is-error");
    if (!form.checkValidity()) {
      status.textContent =
        "Please add your name, a work email, and a short note.";
      status.classList.add("is-error");
      form.reportValidity();
      return;
    }
    status.textContent =
      "This form is a design preview and isn't connected yet. Please email info@addenso.com.";
  });
}

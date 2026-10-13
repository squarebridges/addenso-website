// Design C behaviour: mobile nav, header shadow on scroll, one-open-at-a-time
// service accordion, section dots, scroll reveal, and an honest contact form.

document.addEventListener("DOMContentLoaded", () => {
  initMobileNav();
  initHeaderState();
  initAccordion();
  initSectionDots();
  initReveal();
  initContactForm();
});

const reduceMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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

function initHeaderState() {
  const header = document.querySelector(".site-header");
  if (!header) return;
  const update = () =>
    header.classList.toggle("is-scrolled", window.scrollY > 8);
  update();
  window.addEventListener("scroll", update, { passive: true });
}

/**
 * Services use native <details>, so they work without JS. This only closes
 * the others when one opens, keeping the list readable as a stepped sequence.
 */
function initAccordion() {
  const items = [...document.querySelectorAll(".accordion .service")];
  items.forEach((item) => {
    item.addEventListener("toggle", () => {
      if (!item.open) return;
      items.forEach((other) => {
        if (other !== item) other.open = false;
      });
    });
  });
}

/** Desktop side dots track whichever section is in view. */
function initSectionDots() {
  const dots = document.querySelectorAll(".section-dots a[data-section]");
  if (!dots.length || !("IntersectionObserver" in window)) return;

  const byId = new Map([...dots].map((dot) => [dot.dataset.section, dot]));
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        dots.forEach((dot) => dot.removeAttribute("aria-current"));
        byId.get(entry.target.id)?.setAttribute("aria-current", "true");
      });
    },
    { rootMargin: "-40% 0px -50% 0px" },
  );
  byId.forEach((_, id) => {
    const section = document.getElementById(id);
    if (section) observer.observe(section);
  });
}

function initReveal() {
  const targets = document.querySelectorAll(
    ".section-head, .hero-quote, .service, .quotes li, .case-row, .team-member, .credentials li, .industry-slide, .contact-form",
  );
  if (reduceMotion() || !("IntersectionObserver" in window)) return;

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
    target.style.transitionDelay = `${(index % 6) * 50}ms`;
    observer.observe(target);
  });
}

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

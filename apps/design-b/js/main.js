// Design B behaviour: mobile nav, header border on scroll, count-up metrics,
// scroll reveal, and a contact form that is honest about not being wired up yet.

document.addEventListener("DOMContentLoaded", () => {
  initMobileNav();
  initHeaderState();
  initCounters();
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
 * Metric numbers count up from zero the first time they scroll into view.
 * The final text is already in the markup, so without JS (or with reduced
 * motion) the real value is simply shown.
 */
function initCounters() {
  const counters = document.querySelectorAll(".count[data-target]");
  if (!counters.length || reduceMotion() || !("IntersectionObserver" in window))
    return;

  const format = (el, value) => {
    const decimals = Number(el.dataset.decimals ?? 0);
    return `${el.dataset.prefix ?? ""}${value.toFixed(decimals)}${el.dataset.suffix ?? ""}`;
  };

  const run = (el) => {
    const target = Number(el.dataset.target);
    const duration = 1400;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = format(el, target * eased);
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        run(entry.target);
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.4 },
  );
  counters.forEach((el) => {
    el.textContent = format(el, 0);
    observer.observe(el);
  });
}

function initReveal() {
  const targets = document.querySelectorAll(
    ".section-head, .bento-card, .metrics li, .case-card, .team-member, .credentials li, .contact-form",
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
    target.style.transitionDelay = `${(index % 4) * 60}ms`;
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

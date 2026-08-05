const meter = document.getElementById("scrollMeter");
const navLinks = Array.from(document.querySelectorAll(".site-nav nav a"));
const sections = navLinks
  .map((link) => document.querySelector(link.getAttribute("href")))
  .filter(Boolean);
const motionZones = Array.from(document.querySelectorAll("[data-motion-zone]"));
const parallaxLayers = Array.from(
  document.querySelectorAll("[data-parallax-speed]"),
);
const heroMedia = document.querySelector(".hero-media");
const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
);

const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));

const updateScrollMeter = () => {
  const scrollTop = window.scrollY || document.documentElement.scrollTop;
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  const progress = maxScroll > 0 ? scrollTop / maxScroll : 0;
  const safeProgress = clamp(progress);
  meter.style.transform = `scaleX(${safeProgress})`;
  document.documentElement.style.setProperty(
    "--scroll-progress",
    safeProgress.toFixed(4),
  );
};

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  {
    threshold: 0.14,
    rootMargin: "0px 0px -8% 0px",
  },
);

document
  .querySelectorAll(
    "[data-reveal], .flow-card, .task-card, .compare-panel, .roots-timeline li",
  )
  .forEach((element) => revealObserver.observe(element));

const setSequence = (items, progress, trailing = 0.08) => {
  if (!items.length) {
    return;
  }

  const activeIndex = clamp(
    Math.floor((progress + trailing) * items.length),
    0,
    items.length - 1,
  );

  items.forEach((item, index) => {
    item.classList.toggle("is-active", index === activeIndex);
    item.classList.toggle("has-passed", index < activeIndex);
  });
};

const updateMotionZones = () => {
  const viewport = window.innerHeight;

  motionZones.forEach((zone) => {
    const rect = zone.getBoundingClientRect();
    const progress = clamp((viewport - rect.top) / (viewport + rect.height));
    zone.style.setProperty("--zone-progress", progress.toFixed(4));
    zone.style.setProperty(
      "--zone-sweep",
      `${(progress * 120 - 92).toFixed(2)}%`,
    );
    zone.style.setProperty("--ribbon-a", `${(progress * 18 - 4).toFixed(2)}%`);
    zone.style.setProperty("--ribbon-b", `${(progress * -16 + 8).toFixed(2)}%`);
    zone.classList.toggle(
      "is-motion-active",
      progress > 0.02 && progress < 0.98,
    );
  });

  setSequence(
    Array.from(document.querySelectorAll(".flow-card")),
    Number(
      document
        .querySelector("#idea")
        ?.style.getPropertyValue("--zone-progress") || 0,
    ),
  );
  setSequence(
    Array.from(document.querySelectorAll(".approval-rail span")),
    Number(
      document
        .querySelector("#computer")
        ?.style.getPropertyValue("--zone-progress") || 0,
    ),
    0.16,
  );
  setSequence(
    Array.from(document.querySelectorAll(".task-card")),
    Number(
      document
        .querySelector("#computer")
        ?.style.getPropertyValue("--zone-progress") || 0,
    ),
    0.04,
  );
  setSequence(
    Array.from(document.querySelectorAll(".compare-panel")),
    Number(
      document
        .querySelector("#together")
        ?.style.getPropertyValue("--zone-progress") || 0,
    ),
  );
  setSequence(
    Array.from(document.querySelectorAll(".roots-timeline li")),
    Number(
      document
        .querySelector("#roots")
        ?.style.getPropertyValue("--zone-progress") || 0,
    ),
  );
  setSequence(
    Array.from(document.querySelectorAll(".use-cases span")),
    Number(
      document
        .querySelector("#contact")
        ?.style.getPropertyValue("--zone-progress") || 0,
    ),
  );
};

const updateParallax = () => {
  if (prefersReducedMotion.matches) {
    return;
  }

  const viewport = window.innerHeight;

  parallaxLayers.forEach((layer) => {
    const speed = Number(layer.dataset.parallaxSpeed || 0);
    const rect = layer.getBoundingClientRect();
    const progress = clamp((viewport - rect.top) / (viewport + rect.height));
    const y = (progress - 0.5) * speed * 2;
    layer.style.setProperty("--parallax-y", `${y.toFixed(1)}px`);
  });

  if (heroMedia) {
    const heroProgress = Number(
      document
        .querySelector(".hero")
        ?.style.getPropertyValue("--zone-progress") || 0,
    );
    heroMedia.style.setProperty(
      "--hero-scale",
      (1.065 - heroProgress * 0.032).toFixed(3),
    );
  }
};

const setActiveNav = () => {
  const midpoint = window.scrollY + window.innerHeight * 0.42;
  let activeId = "";

  sections.forEach((section) => {
    if (section.offsetTop <= midpoint) {
      activeId = section.id;
    }
  });

  navLinks.forEach((link) => {
    link.classList.toggle(
      "is-active",
      link.getAttribute("href") === `#${activeId}`,
    );
  });
};

let ticking = false;
const onScroll = () => {
  if (ticking) {
    return;
  }

  window.requestAnimationFrame(() => {
    updateScrollMeter();
    updateMotionZones();
    updateParallax();
    setActiveNav();
    ticking = false;
  });
  ticking = true;
};

window.addEventListener("scroll", onScroll, { passive: true });
window.addEventListener("resize", onScroll);
window.addEventListener("load", onScroll);

document.querySelectorAll(".task-card").forEach((card) => {
  card.addEventListener("pointermove", (event) => {
    if (prefersReducedMotion.matches) {
      return;
    }

    const rect = card.getBoundingClientRect();
    const x = clamp((event.clientX - rect.left) / rect.width);
    const y = clamp((event.clientY - rect.top) / rect.height);
    card.style.setProperty("--pointer-x", `${(x * 100).toFixed(1)}%`);
    card.style.setProperty("--pointer-y", `${(y * 100).toFixed(1)}%`);
    card.style.setProperty("--tilt-y", `${((x - 0.5) * 7).toFixed(2)}deg`);
    card.style.setProperty("--tilt-x", `${((0.5 - y) * 7).toFixed(2)}deg`);
  });

  card.addEventListener("pointerleave", () => {
    card.style.setProperty("--tilt-x", "0deg");
    card.style.setProperty("--tilt-y", "0deg");
    card.style.setProperty("--pointer-x", "50%");
    card.style.setProperty("--pointer-y", "50%");
  });
});

onScroll();

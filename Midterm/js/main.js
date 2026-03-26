// Cache the main UI elements used across the page scripts.
const header = document.querySelector(".header");
const heroBackgroundImage = document.querySelector("#hero-bg-image");
const exploreCards = document.querySelectorAll(".explore-links .explore-card");
const homeProjectCards = document.querySelectorAll(
  ".featured-projects .project-card-link"
);
const menuToggleButton = document.querySelector(".menu-toggle");
const headerNavLinks = document.querySelectorAll(".header nav a");
const MOBILE_BREAKPOINT = 768;
const MOBILE_TAP_DELAY_MS = 320;

// Add or remove the scrolled class so the header can change appearance on scroll.
function toggleHeaderBackground() {
  if (!header) return;

  if (window.scrollY > 20) {
    header.classList.add("scrolled");
  } else {
    header.classList.remove("scrolled");
  }
}

// Cycle through hero background images with a fade transition.
function initHeroBackgroundSlider() {
  if (!heroBackgroundImage) return;

  const imageList = (heroBackgroundImage.dataset.images || "")
    .split(",")
    .map((path) => path.trim())
    .filter(Boolean);

  if (imageList.length < 2) return;

  let currentIndex = 0;
  const fadeDuration = 800;
  const slideInterval = 3000;

  setInterval(() => {
    heroBackgroundImage.classList.add("is-fading");

    setTimeout(() => {
      currentIndex = (currentIndex + 1) % imageList.length;
      heroBackgroundImage.src = imageList[currentIndex];
      heroBackgroundImage.classList.remove("is-fading");
    }, fadeDuration);
  }, slideInterval);
}

// On mobile, show a brief pressed state before navigating from project cards.
function initMobilePreviewTap(cards) {
  if (!cards.length) return;

  cards.forEach((card) => {
    card.addEventListener("click", (event) => {
      if (window.innerWidth >= MOBILE_BREAKPOINT) return;

      const href = card.getAttribute("href");
      if (!href) return;

      event.preventDefault();

      cards.forEach((item) => item.classList.remove("is-armed"));
      card.classList.add("is-armed");

      window.setTimeout(() => {
        window.location.href = href;
      }, MOBILE_TAP_DELAY_MS);
    });
  });
}

function closeMobileMenu() {
  if (!header || !menuToggleButton) return;
  header.classList.remove("menu-open");
  menuToggleButton.setAttribute("aria-expanded", "false");
}

// Open, close, and reset the mobile navigation menu based on user actions.
function initMobileMenuToggle() {
  if (!header || !menuToggleButton) return;

  menuToggleButton.addEventListener("click", () => {
    const isOpen = header.classList.toggle("menu-open");
    menuToggleButton.setAttribute("aria-expanded", String(isOpen));
  });

  headerNavLinks.forEach((link) => {
    link.addEventListener("click", () => {
      if (!header.classList.contains("menu-open")) return;
      closeMobileMenu();
    });
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > MOBILE_BREAKPOINT && header.classList.contains("menu-open")) {
      closeMobileMenu();
    }
  });

  document.addEventListener("click", (event) => {
    if (window.innerWidth > MOBILE_BREAKPOINT) return;
    if (!header.classList.contains("menu-open")) return;
    if (header.contains(event.target)) return;

    closeMobileMenu();
  });
}

// Initialize interactive behaviors after the page finishes loading.
window.addEventListener("scroll", toggleHeaderBackground);
window.addEventListener("load", () => {
  toggleHeaderBackground();
  initHeroBackgroundSlider();
  initMobilePreviewTap(exploreCards);
  initMobilePreviewTap(homeProjectCards);
  initMobileMenuToggle();
});

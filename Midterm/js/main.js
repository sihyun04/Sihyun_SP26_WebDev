// Cache the main UI elements used across the page scripts.
const header = document.querySelector(".header");
const heroBackgroundImage = document.querySelector("#hero-bg-image");
const exploreCards = document.querySelectorAll(".explore-links .explore-card");
const homeProjectCards = document.querySelectorAll(
  ".featured-projects .project-card-link"
);
const menuToggleButton = document.querySelector(".menu-toggle");
const headerNavLinks = document.querySelectorAll(".header nav a");
const THEME_STORAGE_KEY = "portfolio-theme";

// Create the floating color mode button and keep the selected mode saved.
function initThemeToggle() {
  const root = document.documentElement;
  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  const initialTheme = savedTheme === "light" ? "light" : "dark";

  root.setAttribute("colormode", initialTheme);

  const button = document.createElement("button");
  button.className = "modechange";
  button.type = "button";
  button.setAttribute("aria-label", "Toggle color mode");

  const setButtonState = (theme) => {
    const isLight = theme === "light";
    button.textContent = isLight ? "Light" : "Dark";
    button.setAttribute("aria-pressed", String(isLight));
  };

  setButtonState(initialTheme);

  button.addEventListener("click", () => {
    const currentTheme = root.getAttribute("colormode") === "light" ? "light" : "dark";
    const nextTheme = currentTheme === "light" ? "dark" : "light";
    root.setAttribute("colormode", nextTheme);
    localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    setButtonState(nextTheme);
  });

  document.body.appendChild(button);
}

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
    document.body.classList.add("hero-transitioning");
    heroBackgroundImage.classList.add("is-fading");

    setTimeout(() => {
      currentIndex = (currentIndex + 1) % imageList.length;
      heroBackgroundImage.src = imageList[currentIndex];
      heroBackgroundImage.classList.remove("is-fading");
      document.body.classList.remove("hero-transitioning");
    }, fadeDuration);
  }, slideInterval);
}

// On mobile, show a brief pressed state before navigating from explore cards.
function initMobileExploreCardTap() {
  if (!exploreCards.length) return;

  exploreCards.forEach((card) => {
    card.addEventListener("click", (event) => {
      if (window.innerWidth >= 768) return;

      const href = card.getAttribute("href");
      if (!href) return;

      event.preventDefault();

      exploreCards.forEach((item) => item.classList.remove("is-armed"));
      card.classList.add("is-armed");

      window.setTimeout(() => {
        window.location.href = href;
      }, 320);
    });
  });
}

// Mirror the same mobile tap behavior for the featured project cards.
function initMobileHomeProjectTap() {
  if (!homeProjectCards.length) return;

  homeProjectCards.forEach((card) => {
    card.addEventListener("click", (event) => {
      if (window.innerWidth >= 768) return;

      const href = card.getAttribute("href");
      if (!href) return;

      event.preventDefault();

      homeProjectCards.forEach((item) => item.classList.remove("is-armed"));
      card.classList.add("is-armed");

      window.setTimeout(() => {
        window.location.href = href;
      }, 320);
    });
  });
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
      header.classList.remove("menu-open");
      menuToggleButton.setAttribute("aria-expanded", "false");
    });
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 768 && header.classList.contains("menu-open")) {
      header.classList.remove("menu-open");
      menuToggleButton.setAttribute("aria-expanded", "false");
    }
  });

  document.addEventListener("click", (event) => {
    if (window.innerWidth > 768) return;
    if (!header.classList.contains("menu-open")) return;
    if (header.contains(event.target)) return;

    header.classList.remove("menu-open");
    menuToggleButton.setAttribute("aria-expanded", "false");
  });
}

// Initialize interactive behaviors after the page finishes loading.
window.addEventListener("scroll", toggleHeaderBackground);
window.addEventListener("load", () => {
  initThemeToggle();
  toggleHeaderBackground();
  initHeroBackgroundSlider();
  initMobileExploreCardTap();
  initMobileHomeProjectTap();
  initMobileMenuToggle();
});

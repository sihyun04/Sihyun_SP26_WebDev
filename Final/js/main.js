// ============================================================
// Storage keys — all data lives in localStorage under these
// ============================================================
const STORAGE_PREFIX = "sihyunPersonalMuseum:";
const ACCOUNT_KEY = "sihyunMuseumAccounts";
const SESSION_KEY = "sihyunMuseumActiveSession";
const ARTWORK_RESET_VERSION = "empty-start-1"; // bump this to wipe everyone's artworks

const starterArtworks = []; // placeholder for any demo artworks

// ============================================================
// App-wide state
// ============================================================
let artworks = [];
let activeGalleryIndex = 0;
let activeMapFilter = "favorite";
let activeFloorFilter = "favorite";
let activeFloorGroup = "Favorites";
let floorGroups = [];
let galleryViewCount = 4;
let activeArtworkId = "";
let currentMuseumKey = "";
let authMode = "login";

const mobileViewQuery = window.matchMedia("(max-width: 768px)");
const desktopGalleryViewCounts = [6, 4, 2, 1]; // zoom levels on desktop
const mobileGalleryViewCounts = [1]; // mobile always shows 1

// ============================================================
// DOM references — grabbed once at load time
// ============================================================
const loginForm = document.querySelector("#login-form");
const visitorInput = document.querySelector("#visitor-name");
const passwordInput = document.querySelector("#visitor-password");
const loginModeButton = document.querySelector("#login-mode");
const signupModeButton = document.querySelector("#signup-mode");
const authSubmitButton = document.querySelector("#auth-submit");
const loginScreen = document.querySelector("#login-screen");
const doorHotspot = document.querySelector("#door-hotspot");
const visitorLabel = document.querySelector("#visitor-label");
const totalArtworks = document.querySelector("#total-artworks");
const totalFloors = document.querySelector("#total-floors");
const totalArtists = document.querySelector("#total-artists");
const totalMuseums = document.querySelector("#total-museums");
const mapFilterTabs = document.querySelectorAll(".map-filter-tab");
let floorTabs = document.querySelectorAll(".floor-tab");
const floorTabsPanel = document.querySelector(".floor-tabs");
const galleryWall = document.querySelector("#gallery-wall");
const lobbySearchInput = document.querySelector("#lobby-search-input");
const lobbySearchResults = document.querySelector("#lobby-search-results");
const lobbyFloorMap = document.querySelector("#lobby-floor-map");
const searchInput = document.querySelector("#search-input");
const zoomRange = document.querySelector("#zoom-range");
const zoomOutButton = document.querySelector("#zoom-out");
const zoomInButton = document.querySelector("#zoom-in");
const zoomValue = document.querySelector("#zoom-value");
const wallPreviousButton = document.querySelector(".wall-arrow-left");
const wallNextButton = document.querySelector(".wall-arrow-right");
const uploadModal = document.querySelector("#upload-modal");
const detailModal = document.querySelector("#detail-modal");
const openUploadButton = document.querySelector("#open-upload");
const closeUploadButton = document.querySelector("#close-upload");
const closeDetailButton = document.querySelector("#close-detail");
const artworkForm = document.querySelector("#artwork-form");
const bulkUploadList = document.querySelector("#bulk-upload-list");
const logoutButton = document.querySelector("#logout-button");
const detailImage = document.querySelector("#detail-image");
const detailFloor = document.querySelector("#detail-floor");
const detailTitle = document.querySelector("#detail-title");
const detailMeta = document.querySelector("#detail-meta");
const detailTitleInput = document.querySelector("#detail-title-input");
const detailArtistInput = document.querySelector("#detail-artist-input");
const detailYearInput = document.querySelector("#detail-year-input");
const detailStyleInput = document.querySelector("#detail-style-input");
const detailMuseumInput = document.querySelector("#detail-museum-input");
const detailNote = document.querySelector("#detail-note");
const editDetailButton = document.querySelector("#edit-detail");
const deleteArtworkButton = document.querySelector("#delete-artwork");
const saveNoteButton = document.querySelector("#save-note");
const toggleFavoriteButton = document.querySelector("#toggle-favorite");

// ============================================================
// Auth helpers: accounts stored as a JSON object in localStorage
// ============================================================
function getAccountId(name) {
  return name.trim().toLowerCase();
}

function getAccounts() {
  try {
    return JSON.parse(localStorage.getItem(ACCOUNT_KEY) || "{}");
  } catch {
    localStorage.removeItem(ACCOUNT_KEY);
    return {};
  }
}

function saveAccounts(accounts) {
  localStorage.setItem(ACCOUNT_KEY, JSON.stringify(accounts));
}

// simple non-cryptographic hash — just enough to key a storage namespace
function hashText(text) {
  let h = 0;
  for (let i = 0; i < text.length; i++) {
    h = (h << 5) - h + text.charCodeAt(i);
    h = h & h;
  }
  return String(Math.abs(h));
}

function makeMuseumKey(name, password) {
  return STORAGE_PREFIX + hashText(getAccountId(name) + "-" + password);
}

function setActiveSession(name, museumKey) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify({ name, museumKey }));
}

function getActiveSession() {
  try {
    return JSON.parse(sessionStorage.getItem(SESSION_KEY));
  } catch {
    sessionStorage.removeItem(SESSION_KEY);
    return null;
  }
}

function clearActiveSession() {
  sessionStorage.removeItem(SESSION_KEY);
}

function requireSession() {
  const session = getActiveSession();
  if (!session) {
    window.location.href = "index.html";
    return false;
  }
  currentMuseumKey = session.museumKey;
  if (visitorLabel) visitorLabel.textContent = session.name || "Visitor";
  loadArtworks();
  return true;
}

function setAuthMode(mode) {
  authMode = mode;
  const signup = mode === "signup";
  loginModeButton.classList.toggle("active", !signup);
  signupModeButton.classList.toggle("active", signup);
  authSubmitButton.textContent = signup ? "Create Museum" : "Enter Museum";
  passwordInput.autocomplete = signup ? "new-password" : "current-password";
}

// ============================================================
// Artwork storage: load from / save to localStorage
// ============================================================
function loadArtworks() {
  if (!currentMuseumKey) return;

  const resetKey = `${currentMuseumKey}:artworkReset:${ARTWORK_RESET_VERSION}`;
  if (!localStorage.getItem(resetKey)) {
    artworks = [];
    saveArtworks();
    localStorage.setItem(resetKey, "true");
    return;
  }

  try {
    artworks = JSON.parse(localStorage.getItem(currentMuseumKey) || "null")
      || JSON.parse(JSON.stringify(starterArtworks));
    const prevLen = artworks.length;
    artworks = artworks.filter((a) => !String(a.id || "").startsWith("demo-"));
    const ids = new Set(artworks.map((a) => a.id));
    const extra = starterArtworks.filter((a) => !ids.has(a.id));
    if (extra.length || prevLen !== artworks.length) {
      artworks = [...artworks, ...JSON.parse(JSON.stringify(extra))];
      saveArtworks();
    }
  } catch {
    artworks = JSON.parse(JSON.stringify(starterArtworks));
    saveArtworks();
  }
}

function saveArtworks() {
  if (!currentMuseumKey) return false;
  try {
    localStorage.setItem(currentMuseumKey, JSON.stringify(artworks));
    return true;
  } catch {
    alert("The image is too large to save here. Try cropping it smaller or uploading fewer photos at once.");
    return false;
  }
}

// ============================================================
// Grouping and filtering helpers
// ============================================================
function getVisitYear(artwork) {
  const m = String(artwork.id || "").match(/^art-(\d+)-/);
  return m ? String(new Date(+m[1]).getFullYear()) : "";
}

function groupKey(artwork, filter) {
  if (filter === "year") return centuryLabel(artwork.year);
  if (filter === "artist") return artwork.artist || "";
  if (filter === "style") return artwork.style || "";
  if (filter === "museum") return artwork.museum || "";
  if (filter === "visitYear") return getVisitYear(artwork);
  if (filter === "floor") return artwork.floor || "Favorites";
  return "";
}

function searchText(a) {
  return [a.title, a.artist, a.year, a.style, a.museum, a.note].join(" ").toLowerCase();
}

function getVisibleArtworks() {
  const term = searchInput ? searchInput.value.trim().toLowerCase() : "";
  return artworks.filter((a) => {
    let ok = true;
    if (activeFloorFilter === "favorite") {
      if (activeFloorGroup === "Favorites") ok = a.favorite === true;
    } else if (activeFloorFilter === "floor") {
      ok = activeFloorGroup === "Favorites" || a.floor === activeFloorGroup || a.style === activeFloorGroup;
    } else {
      ok = groupKey(a, activeFloorFilter) === activeFloorGroup;
    }
    return ok && searchText(a).includes(term);
  });
}

// ============================================================
// Gallery rendering
// ============================================================
function artVisual(artwork) {
  const wrap = document.createElement("div");
  wrap.className = "art-image";
  if (artwork.image) {
    const img = document.createElement("img");
    img.src = artwork.image;
    img.alt = artwork.title || "Artwork photo";
    wrap.appendChild(img);
  } else {
    const gen = document.createElement("div");
    gen.className = `generated-art ${artwork.artClass || "art-1"}`;
    wrap.appendChild(gen);
  }
  return wrap;
}

function renderGallery() {
  if (!galleryWall) return;
  galleryWall.replaceChildren();

  const works = getVisibleArtworks();
  if (!works.length) {
    const el = document.createElement("div");
    el.className = "empty-gallery";
    el.textContent = "No artworks found on this floor yet.";
    galleryWall.appendChild(el);
    return;
  }

  const pages = Math.ceil(works.length / galleryViewCount);
  const page = Math.min(Math.floor(activeGalleryIndex / galleryViewCount), pages - 1);
  activeGalleryIndex = page * galleryViewCount;
  galleryWall.dataset.viewCount = String(galleryViewCount);

  for (let i = 0; i < galleryViewCount; i++) {
    const idx = activeGalleryIndex + i;
    if (idx >= works.length) {
      const ph = document.createElement("article");
      ph.className = "art-card art-card-empty";
      galleryWall.appendChild(ph);
      continue;
    }

    const artwork = works[idx];
    const card = document.createElement("article");
    card.className = "art-card";

    const btn = document.createElement("button");
    btn.className = "art-button";
    btn.type = "button";
    btn.setAttribute("aria-label", artwork.title || "Open artwork detail");
    btn.addEventListener("click", () => openArtworkDetail(artwork.id));

    const caption = document.createElement("div");
    caption.className = "art-caption";

    const h3 = document.createElement("h3");
    h3.textContent = artwork.title;
    const num = document.createElement("p");
    num.textContent = String(idx + 1);
    caption.append(h3, num);

    btn.append(artVisual(artwork), caption);
    card.appendChild(btn);
    galleryWall.appendChild(card);
  }
}

// search the collection from the lobby and show up to 4 result cards
function renderLobbySearch() {
  if (!lobbySearchResults || !lobbySearchInput) return;
  lobbySearchResults.replaceChildren();

  const term = lobbySearchInput.value.trim().toLowerCase();
  document.body.classList.toggle("is-searching", Boolean(term));
  if (!term) return;

  const matches = artworks.filter((a) => searchText(a).includes(term));
  if (!matches.length) {
    const el = document.createElement("p");
    el.className = "search-empty";
    el.textContent = "No pieces match this search.";
    lobbySearchResults.appendChild(el);
    return;
  }

  matches.slice(0, 4).forEach((artwork) => {
    const result = document.createElement("a");
    result.className = "search-result-card";
    result.href = "floor.html";

    const thumb = document.createElement("div");
    thumb.className = "search-result-thumb";
    if (artwork.image) {
      const img = document.createElement("img");
      img.src = artwork.image;
      img.alt = artwork.title || "";
      thumb.appendChild(img);
    } else {
      const gen = document.createElement("div");
      gen.className = `generated-art ${artwork.artClass || "art-1"}`;
      thumb.appendChild(gen);
    }

    const content = document.createElement("div");
    content.className = "search-result-content";

    const name = document.createElement("strong");
    name.textContent = artwork.title;
    const artist = document.createElement("span");
    artist.className = "search-result-artist";
    artist.textContent = artwork.artist;
    const record = document.createElement("span");
    record.className = "search-result-record";
    record.textContent = [artwork.year, artwork.museum].filter(Boolean).join(" · ");

    [name, artist, record].forEach((el) => { if (el.textContent) content.append(el); });
    result.append(thumb, content);
    lobbySearchResults.appendChild(result);
  });
}

// group artworks by century for the "Year" filter
function centuryLabel(yearValue) {
  const y = parseInt(yearValue, 10);
  if (Number.isNaN(y)) return "";
  if (y >= 1800 && y < 1900) return "1800s";
  if (y >= 1900 && y < 2000) return "1900s";
  if (y >= 2000 && y < 2100) return "2000s";
  return "Other Years";
}

// build the list of floor groups based on the current filter type
function getFloorGroups(filter) {
  if (filter === "favorite") {
    return [
      {
        floorNumber: "2F", title: "All Works", criteria: "Your complete collection",
        items: artworks.map((a) => a.title).filter(Boolean), filter: "favorite", group: "All Works"
      },
      {
        floorNumber: "1F", title: "Favorites", criteria: "Works you've marked as favorites",
        items: artworks.filter((a) => a.favorite).map((a) => a.title).filter(Boolean), filter: "favorite", group: "Favorites"
      }
    ];
  }

  if (filter === "floor") {
    return [
      { floorNumber: "4F", title: "Style Collection", criteria: "Classified by style, medium, or object type", items: [...new Set(artworks.map((a) => a.style).filter(Boolean))], filter: "floor", group: "Style" },
      { floorNumber: "3F", title: "Artist Collection", criteria: "Classified by artist or maker name", items: [...new Set(artworks.map((a) => a.artist).filter(Boolean))], filter: "floor", group: "Artist" },
      { floorNumber: "2F", title: "Period Collection", criteria: "Classified by artwork year such as 1800s, 1900s, 2000s", items: [...new Set(artworks.map((a) => centuryLabel(a.year)).filter(Boolean))], filter: "floor", group: "Year" },
      { floorNumber: "1F", title: "Favorites Collection", criteria: "Classified by personal taste and saved favorites", items: artworks.map((a) => a.title).filter(Boolean), filter: "floor", group: "Favorites" }
    ];
  }

  const criteriaMap = {
    year: "Artworks from this period",
    artist: "Works by this artist",
    style: "Works in this style",
    museum: "Works photographed at this venue",
    visitYear: "Works photographed this year"
  };

  const groups = {};
  artworks.forEach((a) => {
    const k = groupKey(a, filter);
    if (!k) return;
    if (!groups[k]) groups[k] = [];
    if (a.title) groups[k].push(a.title);
  });

  const sorted = Object.entries(groups).sort(([a], [b]) =>
    filter === "visitYear"
      ? Number(b) - Number(a)
      : b.localeCompare(a, undefined, { numeric: true, sensitivity: "base" })
  );

  return sorted.map(([name, items], i) => ({
    floorNumber: `${sorted.length - i}F`,
    title: name,
    criteria: criteriaMap[filter],
    items,
    filter,
    group: name
  }));
}

function createFloorMapCard(fg) {
  const card = document.createElement("article");
  card.className = "floor-map-card";

  const url = `floor.html?filter=${encodeURIComponent(fg.filter)}&group=${encodeURIComponent(fg.group)}`;
  card.tabIndex = 0;
  card.setAttribute("role", "link");
  card.setAttribute("aria-label", `Go to ${fg.title}`);
  card.addEventListener("click", () => { window.location.href = url; });
  card.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); window.location.href = url; }
  });

  const num = document.createElement("span");
  num.className = "floor-number";
  num.textContent = fg.floorNumber;

  const content = document.createElement("div");
  content.className = "floor-map-content";

  const h4 = document.createElement("h4");
  h4.textContent = fg.title;

  const p = document.createElement("p");
  p.className = "floor-criteria";
  p.textContent = fg.criteria;

  const ul = document.createElement("ul");
  const items = fg.items.length ? fg.items : ["No artworks yet"];
  items.slice(0, 5).forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    ul.appendChild(li);
  });

  content.append(h4, p, ul);
  card.append(num, content);
  return card;
}

function renderLobbyFloorMap() {
  const groups = getFloorGroups(activeMapFilter);
  if (totalFloors) totalFloors.textContent = groups.length;
  if (!lobbyFloorMap) return;
  lobbyFloorMap.replaceChildren();
  groups.forEach((fg) => lobbyFloorMap.appendChild(createFloorMapCard(fg)));
}

function renderStats() {
  if (totalArtworks) totalArtworks.textContent = artworks.length;
  if (totalFloors) totalFloors.textContent = getFloorGroups(activeMapFilter).length;
  if (totalArtists) totalArtists.textContent = [...new Set(artworks.map((a) => a.artist).filter(Boolean))].length;
  if (totalMuseums) totalMuseums.textContent = [...new Set(artworks.map((a) => a.museum).filter(Boolean))].length;
}

function renderMuseum() {
  renderStats();
  renderGallery();
  renderLobbySearch();
  renderLobbyFloorMap();
}

function setActiveFloor(name) {
  activeFloorGroup = name;
  activeGalleryIndex = 0;
  floorTabs.forEach((tab) => tab.classList.toggle("active", tab.dataset.floor === activeFloorGroup));
  renderMuseum();
}

function renderFloorTabs() {
  if (!floorTabsPanel) return;
  floorTabsPanel.replaceChildren();
  floorGroups.forEach((fg) => {
    const btn = document.createElement("button");
    btn.className = "floor-tab";
    btn.type = "button";
    btn.dataset.floor = fg.group;
    btn.dataset.label = `${fg.floorNumber} ${fg.title}`;
    btn.dataset.criteria = fg.criteria;
    btn.dataset.count = String(fg.items.length);
    btn.setAttribute("aria-label", `${fg.floorNumber} ${fg.title}`);
    btn.addEventListener("click", () => setActiveFloor(fg.group));
    floorTabsPanel.appendChild(btn);
  });
  floorTabs = document.querySelectorAll(".floor-tab");
}

function getViewCounts() {
  return mobileViewQuery.matches ? mobileGalleryViewCounts : desktopGalleryViewCounts;
}

function updateGalleryZoom(value) {
  if (!galleryWall || !zoomRange) return;
  const counts = getViewCounts();
  const max = counts.length - 1;
  const next = Math.min(max, Math.max(0, mobileViewQuery.matches ? 0 : Number(value)));
  zoomRange.max = String(max);
  zoomRange.value = String(next);
  galleryViewCount = counts[next];
  document.body.dataset.viewCount = String(galleryViewCount);
  if (zoomValue) zoomValue.textContent = `${galleryViewCount} works`;
  renderGallery();
}

function syncGalleryZoom() {
  if (!galleryWall || !zoomRange) return;
  const counts = getViewCounts();
  updateGalleryZoom(counts.includes(galleryViewCount) ? counts.indexOf(galleryViewCount) : 0);
}

function stepZoom(dir) {
  if (!zoomRange) return;
  updateGalleryZoom(Number(zoomRange.value) + dir);
}

function moveGalleryArtwork(dir) {
  const works = getVisibleArtworks();
  if (!works.length) return;
  const pages = Math.ceil(works.length / galleryViewCount);
  const cur = Math.floor(activeGalleryIndex / galleryViewCount);
  activeGalleryIndex = ((cur + dir + pages) % pages) * galleryViewCount;
  renderGallery();
}

// ============================================================
// Modal open / close
// ============================================================
function openModal(modal) {
  if (!modal) return;
  modal.classList.remove("hidden");
  modal.setAttribute("aria-hidden", "false");
}

function closeModal(modal) {
  if (!modal) return;
  modal.classList.add("hidden");
  modal.setAttribute("aria-hidden", "true");
  if (modal === detailModal) {
    activeArtworkId = "";
    setDetailEditMode(false);
  }
}

function setDetailEditMode(editing) {
  if (!detailModal) return;
  const has = Boolean(activeArtworkId);
  const on = has && editing;
  detailModal.classList.toggle("is-editing", on);

  [detailTitleInput, detailArtistInput, detailYearInput, detailStyleInput, detailMuseumInput, detailNote]
    .filter(Boolean)
    .forEach((f) => { f.disabled = !on; });

  if (saveNoteButton) saveNoteButton.disabled = !on;
  if (toggleFavoriteButton) toggleFavoriteButton.disabled = !activeArtworkId;
  if (deleteArtworkButton) deleteArtworkButton.disabled = !activeArtworkId;
  if (editDetailButton) {
    editDetailButton.disabled = !has;
    editDetailButton.textContent = on ? "Editing" : "Edit";
  }
}

// ============================================================
// Crop tool: build the draggable selection box and resize handles
// ============================================================
function createSelBox() {
  const box = document.createElement("div");
  box.className = "crop-sel-box";
  ["nw", "n", "ne", "w", "e", "sw", "s", "se"].forEach((dir) => {
    const h = document.createElement("div");
    h.className = `crop-sel-handle crop-sel-${dir}`;
    h.dataset.dir = dir;
    box.appendChild(h);
  });
  return box;
}

function createRotateRow(item) {
  const row = document.createElement("div");
  const slider = document.createElement("input");
  const val = document.createElement("span");
  row.className = "crop-rotation-row";
  slider.type = "range";
  slider.className = "crop-rotate";
  slider.min = "-45";
  slider.max = "45";
  slider.step = "1";
  slider.value = "0";
  val.className = "crop-rotate-val";
  val.textContent = "0°";
  row.append(slider, val);
  slider.addEventListener("input", () => setCropRotate(item, Number(slider.value)));
  return row;
}

function setDetailFields(artwork) {
  if (detailTitleInput) detailTitleInput.value = artwork?.title || "";
  if (detailArtistInput) detailArtistInput.value = artwork?.artist || "";
  if (detailYearInput) detailYearInput.value = artwork?.year || "";
  if (detailStyleInput) detailStyleInput.value = artwork?.style || "";
  if (detailMuseumInput) detailMuseumInput.value = artwork?.museum || "";
  if (detailNote) detailNote.value = artwork?.note || "";
}

function renderDetailImage(artwork) {
  if (!detailImage) return;
  detailImage.replaceChildren();
  detailImage.classList.toggle("has-editable-image", Boolean(artwork.image));

  if (!artwork.image) {
    const gen = document.createElement("div");
    gen.className = `generated-art ${artwork.artClass || "art-1"}`;
    detailImage.appendChild(gen);
    return;
  }

  const view = document.createElement("img");
  const editor = document.createElement("div");
  const item = document.createElement("div");
  const cropFrame = document.createElement("div");
  const img = document.createElement("img");

  view.className = "detail-view-photo";
  view.src = artwork.image;
  view.alt = artwork.title || "Artwork photo";
  editor.className = "detail-image-editor";
  item.className = "detail-crop-item";
  cropFrame.className = "detail-crop-frame";
  img.className = "upload-crop-image";
  img.src = artwork.image;
  img.alt = artwork.title || "";
  item.dataset.selX = "0";
  item.dataset.selY = "0";
  item.dataset.selW = "100";
  item.dataset.selH = "100";
  item.dataset.cropRotate = "0";

  const box = createSelBox();
  const rotRow = createRotateRow(item);
  cropFrame.append(img, box);
  item.append(cropFrame, rotRow);
  editor.append(item);
  detailImage.append(view, editor);
  initCropFrame(item, cropFrame);
  img.addEventListener("load", () => fitSelection(item, img), { once: true });
  refreshBox(item);
}

function openArtworkDetail(id) {
  const artwork = artworks.find((a) => a.id === id);
  if (!artwork || !detailImage) return;

  activeArtworkId = id;
  renderDetailImage(artwork);

  const labels = { artist: "Artist", year: "Period", style: "Style", museum: "Venue", visitYear: "Visit Year" };
  const label = labels[activeFloorFilter];
  detailFloor.textContent = label ? `${label} · ${activeFloorGroup}` : activeFloorGroup;
  detailTitle.textContent = artwork.title || "Untitled";
  detailMeta.textContent = [artwork.artist, artwork.year, artwork.museum].filter(Boolean).join(" / ");
  setDetailFields(artwork);
  setDetailEditMode(false);

  if (toggleFavoriteButton) {
    toggleFavoriteButton.textContent = artwork.favorite ? "★" : "☆";
    toggleFavoriteButton.classList.toggle("is-favorite", !!artwork.favorite);
  }

  openModal(detailModal);
}

async function saveDetailNote() {
  const artwork = artworks.find((a) => a.id === activeArtworkId);
  if (!artwork) return;

  artwork.title = detailTitleInput?.value.trim() ?? artwork.title;
  artwork.artist = detailArtistInput?.value.trim() ?? artwork.artist;
  artwork.year = detailYearInput?.value.trim() ?? artwork.year;
  artwork.style = detailStyleInput?.value.trim() ?? artwork.style;
  artwork.museum = detailMuseumInput?.value.trim() ?? artwork.museum;
  artwork.note = detailNote?.value.trim() ?? artwork.note;

  const cropItem = detailImage?.querySelector(".detail-crop-item");
  if (artwork.image && detailModal?.classList.contains("is-editing") && cropItem) {
    artwork.image = await cropImageSource(artwork.image, cropItem);
  }

  saveArtworks();
  renderMuseum();
  closeModal(detailModal);
}

function deleteActiveArtwork() {
  if (!activeArtworkId) return;
  if (!artworks.find((a) => a.id === activeArtworkId)) return;
  if (!confirm("Delete this artwork?")) return;
  artworks = artworks.filter((a) => a.id !== activeArtworkId);
  activeGalleryIndex = Math.max(0, Math.min(activeGalleryIndex, artworks.length - 1));
  saveArtworks();
  closeModal(detailModal);
  renderMuseum();
}

function loadImg(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const isFile = src instanceof File;
    const url = isFile ? URL.createObjectURL(src) : src;
    img.addEventListener("load", () => { if (isFile) URL.revokeObjectURL(url); resolve(img); }, { once: true });
    img.addEventListener("error", () => { if (isFile) URL.revokeObjectURL(url); reject(new Error("Could not load image")); }, { once: true });
    img.src = url;
  });
}

function makeField(tag, labelText, className, opts = {}) {
  const wrap = document.createElement("label");
  wrap.textContent = labelText;
  const el = document.createElement(tag);
  el.className = className;
  if (tag === "input") { el.type = "text"; el.placeholder = ""; el.value = opts.value || ""; }
  if (tag === "textarea") { el.rows = opts.rows || 3; el.placeholder = ""; }
  wrap.append(el);
  return wrap;
}

function clamp(v, lo, hi) {
  return Math.min(Math.max(v, lo), hi);
}

function getNum(item, key, fallback) {
  const v = item ? Number(item.dataset[key]) : fallback;
  return Number.isFinite(v) ? v : fallback;
}

function getSel(item) {
  return {
    x: getNum(item, "selX", 0),
    y: getNum(item, "selY", 0),
    w: getNum(item, "selW", 100),
    h: getNum(item, "selH", 100)
  };
}

function fitSelection(item, img) {
  if (!item || !img?.naturalWidth) return;
  const ratio = img.naturalWidth / img.naturalHeight;
  let x = 0, y = 0, w = 100, h = 100;
  if (ratio > 1) { h = 100 / ratio; y = (100 - h) / 2; }
  else if (ratio < 1) { w = 100 * ratio; x = (100 - w) / 2; }
  item.dataset.selX = String(x);
  item.dataset.selY = String(y);
  item.dataset.selW = String(w);
  item.dataset.selH = String(h);
  refreshBox(item);
}

function refreshBox(item) {
  const box = item?.querySelector(".crop-sel-box");
  if (!box) return;
  const { x, y, w, h } = getSel(item);
  box.style.left = `${x}%`;
  box.style.top = `${y}%`;
  box.style.width = `${w}%`;
  box.style.height = `${h}%`;
}

function setCropRotate(item, deg) {
  if (!item) return;
  const d = clamp(deg, -45, 45);
  item.dataset.cropRotate = String(d);
  const img = item.querySelector(".upload-crop-image");
  if (img) img.style.transform = `rotate(${d}deg)`;
  const val = item.querySelector(".crop-rotate-val");
  if (val) val.textContent = `${Math.round(d)}°`;
}

// attach pointer events to a crop frame: draw, move, resize modes
function initCropFrame(item, cropFrame) {
  let mode = null, start = null;

  function coords(e) {
    const r = cropFrame.getBoundingClientRect();
    return {
      x: clamp((e.clientX - r.left) / r.width * 100, 0, 100),
      y: clamp((e.clientY - r.top) / r.height * 100, 0, 100),
      fw: r.width,
      fh: r.height
    };
  }

  cropFrame.addEventListener("pointerdown", (e) => {
    if (e.target !== cropFrame && !e.target.classList.contains("upload-crop-image")) return;
    e.preventDefault();
    cropFrame.setPointerCapture(e.pointerId);
    const { x, y } = coords(e);
    mode = "draw";
    start = { x, y };
    item.dataset.selX = String(x);
    item.dataset.selY = String(y);
    item.dataset.selW = "1";
    item.dataset.selH = "1";
    refreshBox(item);
  });

  cropFrame.addEventListener("pointermove", (e) => {
    if (mode !== "draw") return;
    const { x, y } = coords(e);
    item.dataset.selX = String(Math.min(start.x, x));
    item.dataset.selY = String(Math.min(start.y, y));
    item.dataset.selW = String(Math.max(2, Math.abs(x - start.x)));
    item.dataset.selH = String(Math.max(2, Math.abs(y - start.y)));
    refreshBox(item);
  });

  cropFrame.addEventListener("pointerup", () => { mode = null; });
  cropFrame.addEventListener("pointercancel", () => { mode = null; });

  const selBox = cropFrame.querySelector(".crop-sel-box");

  selBox.addEventListener("pointerdown", (e) => {
    if (e.target.classList.contains("crop-sel-handle")) return;
    e.preventDefault();
    e.stopPropagation();
    selBox.setPointerCapture(e.pointerId);
    const { fw, fh } = coords(e);
    const { x, y, w, h } = getSel(item);
    mode = "move";
    start = { px: e.clientX, py: e.clientY, sx: x, sy: y, sw: w, sh: h, fw, fh };
  });

  selBox.addEventListener("pointermove", (e) => {
    if (mode !== "move") return;
    const dx = (e.clientX - start.px) / start.fw * 100;
    const dy = (e.clientY - start.py) / start.fh * 100;
    item.dataset.selX = String(clamp(start.sx + dx, 0, 100 - start.sw));
    item.dataset.selY = String(clamp(start.sy + dy, 0, 100 - start.sh));
    refreshBox(item);
  });

  selBox.addEventListener("pointerup", () => { mode = null; });
  selBox.addEventListener("pointercancel", () => { mode = null; });

  selBox.querySelectorAll(".crop-sel-handle").forEach((handle) => {
    handle.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      e.stopPropagation();
      handle.setPointerCapture(e.pointerId);
      const { fw, fh } = coords(e);
      const { x, y, w, h } = getSel(item);
      mode = "resize";
      start = { dir: handle.dataset.dir, px: e.clientX, py: e.clientY, sx: x, sy: y, sw: w, sh: h, fw, fh };
    });

    handle.addEventListener("pointermove", (e) => {
      if (mode !== "resize") return;
      const dx = (e.clientX - start.px) / start.fw * 100;
      const dy = (e.clientY - start.py) / start.fh * 100;
      const { dir, sx, sy, sw, sh } = start;
      let nx = sx, ny = sy, nw = sw, nh = sh;
      if (dir.includes("e")) nw = sw + dx;
      if (dir.includes("w")) { nx = sx + dx; nw = sw - dx; }
      if (dir.includes("s")) nh = sh + dy;
      if (dir.includes("n")) { ny = sy + dy; nh = sh - dy; }
      nw = Math.max(5, nw);
      nh = Math.max(5, nh);
      if (nx < 0) { nw += nx; nx = 0; }
      if (ny < 0) { nh += ny; ny = 0; }
      if (nx + nw > 100) nw = 100 - nx;
      if (ny + nh > 100) nh = 100 - ny;
      item.dataset.selX = String(nx);
      item.dataset.selY = String(ny);
      item.dataset.selW = String(nw);
      item.dataset.selH = String(nh);
      refreshBox(item);
    });

    handle.addEventListener("pointerup", () => { mode = null; });
    handle.addEventListener("pointercancel", () => { mode = null; });
  });
}

// ============================================================
// Crop and export: renders the selection region to a canvas
// ============================================================
function cropLoadedImage(image, item) {
  const deg = getNum(item, "cropRotate", 0);
  const rad = deg * Math.PI / 180;
  const selX = getNum(item, "selX", 0) / 100;
  const selY = getNum(item, "selY", 0) / 100;
  const selW = getNum(item, "selW", 100) / 100;
  const selH = getNum(item, "selH", 100) / 100;

  const FRAME = 800;
  const r = image.naturalWidth / image.naturalHeight;
  const dw = r >= 1 ? FRAME : FRAME * r;
  const dh = r >= 1 ? FRAME / r : FRAME;

  const fc = document.createElement("canvas");
  fc.width = FRAME;
  fc.height = FRAME;
  const ctx = fc.getContext("2d");
  ctx.save();
  ctx.translate(FRAME / 2, FRAME / 2);
  ctx.rotate(rad);
  ctx.drawImage(image, -dw / 2, -dh / 2, dw, dh);
  ctx.restore();

  const cx = selX * FRAME, cy = selY * FRAME;
  const cw = Math.max(1, selW * FRAME), ch = Math.max(1, selH * FRAME);
  const MAX = 1200;
  const or = cw / ch;
  const ow = or >= 1
    ? Math.min(Math.round(cw / FRAME * image.naturalWidth), MAX)
    : Math.round(Math.min(Math.round(ch / FRAME * image.naturalHeight), MAX) * or);
  const oh = Math.round(ow / or);

  const oc = document.createElement("canvas");
  oc.width = Math.max(ow, 1);
  oc.height = Math.max(oh, 1);
  oc.getContext("2d").drawImage(fc, cx, cy, cw, ch, 0, 0, ow, oh);
  return oc.toDataURL("image/webp", 0.86);
}

async function cropUploadedImage(file, item) {
  return cropLoadedImage(await loadImg(file), item);
}

async function cropImageSource(src, item) {
  return cropLoadedImage(await loadImg(src), item);
}

// ============================================================
// Upload form: one row per selected file with crop + metadata fields
// ============================================================
function renderBulkUploadFields() {
  const fileInput = document.querySelector("#artwork-image");
  if (!fileInput || !bulkUploadList) return;
  const files = Array.from(fileInput.files || []);
  bulkUploadList.replaceChildren();

  if (!files.length) {
    const el = document.createElement("p");
    el.className = "upload-empty";
    el.textContent = "Choose photos to add artwork details.";
    bulkUploadList.append(el);
    return;
  }

  files.forEach((file, i) => {
    const item = document.createElement("article");
    const preview = document.createElement("div");
    const cropFrame = document.createElement("div");
    const img = document.createElement("img");
    const fname = document.createElement("p");
    const fields = document.createElement("div");
    const top = document.createElement("div");
    const bot = document.createElement("div");

    item.className = "bulk-upload-item";
    preview.className = "bulk-upload-preview";
    cropFrame.className = "bulk-upload-crop-frame";
    img.className = "upload-crop-image";
    fname.className = "upload-file-name";
    fields.className = "upload-fields";
    top.className = "form-grid";
    bot.className = "form-grid";

    item.dataset.selX = "0";
    item.dataset.selY = "0";
    item.dataset.selW = "100";
    item.dataset.selH = "100";
    item.dataset.cropRotate = "0";

    img.alt = file.name.replace(/\.[^/.]+$/, "");
    img.src = URL.createObjectURL(file);
    img.addEventListener("load", () => {
      fitSelection(item, img);
      URL.revokeObjectURL(img.src);
    }, { once: true });
    fname.textContent = `${i + 1}. ${file.name}`;

    const box = createSelBox();
    const rotRow = createRotateRow(item);

    top.append(
      makeField("input", "Title", "upload-title"),
      makeField("input", "Artist", "upload-artist")
    );
    bot.append(
      makeField("input", "Year", "upload-year"),
      makeField("input", "Style", "upload-style")
    );
    fields.append(
      top,
      bot,
      makeField("input", "Museum / Gallery", "upload-museum"),
      makeField("textarea", "First impression", "upload-note", { rows: 3 })
    );

    cropFrame.append(img, box);
    preview.append(cropFrame, rotRow, fname);
    item.append(preview, fields);

    initCropFrame(item, cropFrame);
    refreshBox(item);
    bulkUploadList.append(item);
  });
}

function uploadVal(item, sel) {
  return item?.querySelector(sel)?.value.trim() || "";
}

async function addArtwork(e) {
  e.preventDefault();
  const fileInput = document.querySelector("#artwork-image");
  const files = Array.from(fileInput?.files || []);
  const items = bulkUploadList ? Array.from(bulkUploadList.querySelectorAll(".bulk-upload-item")) : [];

  if (!files.length) {
    alert("Choose at least one photo first.");
    return;
  }

  const now = Date.now();
  const fresh = await Promise.all(files.map(async (file, i) => {
    const item = items[i];
    return {
      id: `art-${now}-${i}`,
      title: uploadVal(item, ".upload-title"),
      artist: uploadVal(item, ".upload-artist"),
      year: uploadVal(item, ".upload-year"),
      style: uploadVal(item, ".upload-style"),
      museum: uploadVal(item, ".upload-museum"),
      floor: activeFloorGroup,
      note: uploadVal(item, ".upload-note"),
      favorite: false,
      artClass: `art-${((artworks.length + i) % 4) + 1}`,
      image: await cropUploadedImage(file, item)
    };
  }));

  artworks.unshift(...fresh);
  if (!saveArtworks()) { artworks.splice(0, fresh.length); return; }
  artworkForm.reset();
  renderBulkUploadFields();
  closeModal(uploadModal);
  renderMuseum();
}

function handleLogout() {
  clearActiveSession();
  window.location.href = "index.html";
}

// ============================================================
// Page initializers — called once on window load
// ============================================================
function initLoginPage() {
  if (!loginForm) return;
  clearActiveSession();
  loginScreen.classList.remove("is-entered");

  doorHotspot?.addEventListener("click", () => loginScreen.classList.add("is-entered"));

  setAuthMode("login");
  visitorInput.value = "";
  passwordInput.value = "";

  loginModeButton.addEventListener("click", () => setAuthMode("login"));
  signupModeButton.addEventListener("click", () => setAuthMode("signup"));

  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = visitorInput.value.trim();
    const pass = passwordInput.value.trim();
    if (!name || !pass) return;

    const id = getAccountId(name);
    const accounts = getAccounts();
    const existing = accounts[id];
    const ph = hashText(pass);

    if (authMode === "signup") {
      if (existing) { setAuthMode("login"); return; }
      currentMuseumKey = makeMuseumKey(name, pass);
      accounts[id] = { name, passwordHash: ph, museumKey: currentMuseumKey };
      saveAccounts(accounts);
    } else {
      if (!existing || existing.passwordHash !== ph) return;
      currentMuseumKey = existing.museumKey || makeMuseumKey(name, pass);
    }

    loadArtworks();
    setActiveSession(name, currentMuseumKey);
    window.location.href = "lobby.html";
  });
}

// ============================================================
// Lobby desk interaction: hover lifts a paper sheet up toward the viewer
// ============================================================
function liftPaper(paper) {
  if (paper._isLifted) return;
  paper._isLifted = true;

  const vw = window.innerWidth, vh = window.innerHeight;
  const isMap = !!paper.querySelector(".museum-map");
  const tw = isMap ? Math.min(vw * 0.72, 820) : Math.min(vw * 0.72, 530);
  const th = Math.min(vh * 0.72, 660);
  const tl = isMap ? (vw - tw) / 2 - 430 : (vw - tw) / 2 - 570;

  Object.assign(paper.style, {
    position: "fixed",
    left: tl + "px",
    top: (vh + 20) + "px",
    width: tw + "px",
    height: th + "px",
    margin: "0",
    transform: "none",
    overflow: "auto",
    borderRadius: "10px",
    zIndex: "200",
    opacity: "0",
    pointerEvents: "none",
    transition: "none"
  });

  requestAnimationFrame(() => requestAnimationFrame(() => {
    paper.style.transition = "top 0.52s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.38s ease, box-shadow 0.52s ease";
    paper.style.top = "-180px";
    paper.style.opacity = "1";
    paper.style.boxShadow = "0 24px 64px rgba(10, 8, 4, 0.38), 0 6px 18px rgba(10, 8, 4, 0.22)";
  }));

  paper._liftTimer = setTimeout(() => {
    if (!paper._isLifted) return;
    paper.style.pointerEvents = "all";

    let closeTimer = null;
    function onMove(e) {
      if (!paper._isLifted) { document.removeEventListener("mousemove", onMove); return; }
      const r = paper.getBoundingClientRect();
      const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
      if (inside) {
        clearTimeout(closeTimer);
        closeTimer = null;
      } else if (!closeTimer) {
        closeTimer = setTimeout(() => {
          document.removeEventListener("mousemove", onMove);
          lowerPaper(paper);
        }, 300);
      }
    }
    document.addEventListener("mousemove", onMove);
    paper._stopTracking = () => { clearTimeout(closeTimer); document.removeEventListener("mousemove", onMove); };
  }, 560);
}

function lowerPaper(paper) {
  if (!paper._isLifted) return;
  clearTimeout(paper._liftTimer);
  if (paper._stopTracking) { paper._stopTracking(); paper._stopTracking = null; }
  paper.style.transition = "top 0.35s cubic-bezier(0.55, 0, 1, 0.45), opacity 0.28s ease";
  paper.style.top = (window.innerHeight + 40) + "px";
  paper.style.opacity = "0";
  setTimeout(() => { paper._isLifted = false; paper.removeAttribute("style"); }, 370);
}

function initLobbyHover() {
  document.querySelectorAll(".lobby-desk .desk-paper:not(.search-paper)").forEach((paper) => {
    paper.addEventListener("mouseenter", () => {
      if (window.matchMedia("(max-width: 768px)").matches) return;
      liftPaper(paper);
    });
  });
}

function initProtectedPage() {
  if (loginForm) return false;
  if (!document.querySelector("#museum-app")) return false;
  if (!requireSession()) return false;

  renderMuseum();
  initModals();
  initLobbyHover();

  lobbySearchInput?.addEventListener("input", renderLobbySearch);
  logoutButton?.addEventListener("click", handleLogout);

  mapFilterTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      activeMapFilter = tab.dataset.filter;
      mapFilterTabs.forEach((t) => t.classList.toggle("active", t === tab));
      renderLobbyFloorMap();
    });
  });

  return true;
}

function initModals() {
  setDetailEditMode(false);

  openUploadButton?.addEventListener("click", () => openModal(uploadModal));
  closeUploadButton?.addEventListener("click", () => closeModal(uploadModal));
  closeDetailButton?.addEventListener("click", () => closeModal(detailModal));
  saveNoteButton?.addEventListener("click", saveDetailNote);
  editDetailButton?.addEventListener("click", () => setDetailEditMode(true));
  deleteArtworkButton?.addEventListener("click", deleteActiveArtwork);

  toggleFavoriteButton?.addEventListener("click", () => {
    const artwork = artworks.find((a) => a.id === activeArtworkId);
    if (!artwork) return;
    artwork.favorite = !artwork.favorite;
    saveArtworks();
    toggleFavoriteButton.textContent = artwork.favorite ? "★" : "☆";
    toggleFavoriteButton.classList.toggle("is-favorite", artwork.favorite);
    renderMuseum();
  });

  artworkForm?.addEventListener("submit", addArtwork);
  document.querySelector("#artwork-image")?.addEventListener("change", renderBulkUploadFields);

  [uploadModal, detailModal].forEach((modal) => {
    modal?.addEventListener("click", (e) => { if (e.target === modal) closeModal(modal); });
  });

  window.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    closeModal(uploadModal);
    closeModal(detailModal);
  });
}

function initFloorTooltip() {
  const tooltip = document.querySelector("#floor-tooltip");
  const leftPanel = document.querySelector(".floor-left-panel");
  if (!tooltip || !leftPanel) return;

  const nameEl = tooltip.querySelector(".floor-tooltip-name");
  const criteriaEl = tooltip.querySelector(".floor-tooltip-criteria");
  const countEl = tooltip.querySelector(".floor-tooltip-count");
  const room = document.querySelector(".gallery-room");

  floorTabs.forEach((tab) => {
    tab.addEventListener("mouseenter", () => {
      nameEl.textContent = tab.dataset.label || tab.dataset.floor;
      criteriaEl.textContent = tab.dataset.criteria || "";
      countEl.textContent = `${tab.dataset.count || "0"} works`;
      if (room) {
        const tr = tab.getBoundingClientRect(), rr = room.getBoundingClientRect();
        tooltip.style.top = `${tr.top - rr.top + tr.height / 2}px`;
      }
      tooltip.classList.add("visible");
    });
  });

  leftPanel.addEventListener("mouseleave", () => tooltip.classList.remove("visible"));
}

// read URL params to decide which floor + filter to show
function initFloorPage() {
  if (!galleryWall) return;

  const params = new URLSearchParams(window.location.search);
  const reqFilter = params.get("filter") || "floor";
  const reqGroup = params.get("group");

  activeFloorFilter = ["favorite", "year", "artist", "style", "museum", "visitYear"].includes(reqFilter)
    ? reqFilter : "favorite";
  floorGroups = getFloorGroups(activeFloorFilter);
  activeFloorGroup = reqGroup && floorGroups.some((fg) => fg.group === reqGroup)
    ? reqGroup : floorGroups[0]?.group || "Favorites";

  renderFloorTabs();
  initFloorTooltip();
  setActiveFloor(activeFloorGroup);

  searchInput?.addEventListener("input", () => { activeGalleryIndex = 0; renderGallery(); });

  if (zoomRange) {
    syncGalleryZoom();
    zoomRange.addEventListener("input", () => updateGalleryZoom(zoomRange.value));
  }

  mobileViewQuery.addEventListener("change", syncGalleryZoom);
  zoomOutButton?.addEventListener("click", () => stepZoom(-1));
  zoomInButton?.addEventListener("click", () => stepZoom(1));
  wallPreviousButton?.addEventListener("click", () => moveGalleryArtwork(-1));
  wallNextButton?.addEventListener("click", () => moveGalleryArtwork(1));
}

// entry point: figure out which page we're on and hand off to the right init
window.addEventListener("load", () => {
  if (loginForm) { initLoginPage(); return; }
  if (initProtectedPage()) initFloorPage();
});

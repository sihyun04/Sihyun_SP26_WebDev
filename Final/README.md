# My Museum of Taste — Project Summary

## Overview

A personal art museum web app where users can upload photos of artworks they've visited,
organize them by artist / year / style / venue, and browse them in a gallery wall view.
All data is stored in the browser (localStorage) — no backend, no server.

---

## Pages

### `index.html` — Login / Sign Up

- Dark, cinematic entrance screen with a museum background image
- Clicking the glowing door hotspot triggers an animation that zooms the background and reveals the login panel
- Supports two modes: **Sign in** and **Sign up**, toggled via buttons in the form
- Passwords are hashed client-side (djb2) before being stored — not cryptographically secure, but good enough for a local-only app
- On success, writes an active session to `sessionStorage` and redirects to `lobby.html`

### `lobby.html` — Museum Lobby

- Three "desk paper" sheets laid out with CSS perspective to look like papers on a desk

  - **Top sheet**: search bar — typing switches the background to a search-state image and shows result cards
  - **Left sheet**: collection stats (total artworks, floors, artists, museums)
  - **Right sheet**: floor directory with clickable floor cards
- Hovering a paper on desktop lifts it up with a smooth animation (JS-driven `liftPaper`)
- Filter tabs below the floor map let you regroup floors by Favorite / Artist / Year / Style / Museum / Visit Year
- Floating + Add Artwork  button opens the upload modal from anywhere
- **Background images** — all lobby images (idle + search state) were generated with ChatGPT image generation. Getting the right camera angle to match the intended desk perspective was the hardest part; many variations were generated before finding shots that felt consistent.
- **Search background (favorite detail)** — when the user starts typing in the search bar, the background switches to an image of a museum guide spreading her arms wide, as if presenting the artworks. This transition was the most satisfying part of the lobby experience. The image was composited in Photoshop to get the pose and lighting right.
- **Perspective tilt on desk papers** — the papers are tilted using CSS `perspective` + `rotateX` so they appear to lie flat on the desk. An earlier approach tried distorting the element shape directly (using `clip-path` / skew transforms), but text inside became misaligned and unreadable. Switching to `perspective` kept the content layout intact while achieving the same visual effect.

### `floor.html` — Exhibition Floor

- Full-screen gallery wall; the background image changes depending on how many artworks are shown (1 / 2 / 4 / 6)
- Left panel: dot indicators for switching between floor groups
- Right panel: vertical zoom slider (6 → 4 → 2 → 1 artworks visible)
- Bottom arrows page through artworks within the current floor
- Clicking any artwork opens the detail modal

---

## Key Features

### Artwork Upload

- Multiple files can be selected at once; each gets its own crop + metadata row
- Crop tool supports: draw a new selection, drag to move, drag handles to resize, rotation slider (±45°)
- Image is rendered to a canvas at up to 1200px and exported as WebP before saving

### Detail Modal

- View mode shows the artwork photo and metadata (title, artist, year, style, museum, note)
- Edit mode reveals text inputs and the crop editor for updating the image
- Favorite star toggles the artwork in / out of the Favorites floor
- Delete button removes the artwork after a confirm dialog

### Floor Grouping

- Artworks are grouped dynamically on the fly based on the selected filter
- "Year" groups by century (1800s / 1900s / 2000s)
- "Visit Year" is extracted from the artwork's ID timestamp
- Floor cards in the lobby link directly to `floor.html` with `?filter=&group=` query params

### Auth System

- Account list stored as a JSON object under a fixed localStorage key
- Each user's artworks live under a unique key derived from `hash(name + password)`
- Session is kept in `sessionStorage` so it clears when the tab closes

---

## File Structure

```
Final/
├── index.html          login / sign-up page
├── lobby.html          lobby with desk, stats, floor map, search
├── floor.html          gallery wall for a single exhibition floor
├── css/
│   └── style.css       all styles for all three pages
├── js/
│   └── main.js         all JavaScript for all three pages
└── img/
    ├── HomeBackground_1.png   login background (default)
    ├── HomeBackground_2.png
    ├── HomeBackground_3.png   login background (after door click)
    ├── Lobby.png              lobby background (idle)
    ├── Lobby_Search.png       lobby background (while searching)
    ├── Wall.png               gallery wall (1-work view)
    ├── Wall_2.png             gallery wall (2-work view)
    ├── Wall_4.png             gallery wall (4-work view)
    └── Wall_6.png             gallery wall (6-work view)
```

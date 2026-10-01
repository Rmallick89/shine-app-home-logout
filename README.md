# Shine — App home (logged out)

Mobile-only, single-screen (100dvh, no scroll) logged-out homepage for the Shine app, built on the Shine Design System tokens.

## Structure

```
index.html                  logged-out app home (Shine logo + icons are inline SVG; GitHub Pages serves it at the root URL)
jsrp-logout.html            logged-out app JSRP — search results (single file; links the search-modal component)
css/app-home-logout.css     DS tokens (mobile column), components, page styles
js/app-home-logout.js       headline reel, bubble drift, logo shuffle, grey accents, roles tooltip
assets/logos/*.svg          company logos (viewBox cropped to the mark)
components/search-modal/    reusable "What's next for you?" search modal (css + js)
```

**Flow:** home → **Explore jobs** opens the search modal → **Search Jobs** lands on `jsrp-logout.html?q=…&loc=…&exp=…` → **Edit search** reopens the modal prefilled and updates the results in place (browser back/forward walks the searches; the ‹ button returns home).

**Explore jobs** opens the search modal (`data-shine-search data-ssm-source="home"`). The component is app-wide: any page includes `components/search-modal/search-modal.css` + `.js` and adds `data-shine-search` to a trigger. Results arrive as a `shine:search` DOM event — see `components/search-modal/README.md`.

No build step and no dependencies — the only external request is the Plus Jakarta Sans font from Google Fonts.

## Run locally

Open `index.html` in Chrome and switch DevTools to a phone viewport (e.g. iPhone 12 Pro, 390 × 844).
Keep the folder structure intact — the page loads its CSS, JS and logos by relative path.

## Publish with GitHub Pages

1. Push this folder as the repository root.
2. Settings → Pages → Deploy from branch → `main` / `(root)`.
3. Open `https://<user>.github.io/<repo>/` (serves `index.html`).

## Notes

- Role counts and "12,000+ companies" are placeholder copy.
- All motion switches off under `prefers-reduced-motion`.

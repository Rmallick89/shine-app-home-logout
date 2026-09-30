# Shine — App home (logged out)

Mobile-only, single-screen (100dvh, no scroll) logged-out homepage for the Shine app, built on the Shine Design System tokens.

## Structure

```
app-home-logout.html        page markup (Shine logo + icons are inline SVG)
css/app-home-logout.css     DS tokens (mobile column), components, page styles
js/app-home-logout.js       headline reel, bubble drift, logo shuffle, grey accents, roles tooltip
assets/logos/*.svg          company logos (viewBox cropped to the mark)
```

No build step and no dependencies — the only external request is the Plus Jakarta Sans font from Google Fonts.

## Run locally

Open `app-home-logout.html` in Chrome and switch DevTools to a phone viewport (e.g. iPhone 12 Pro, 390 × 844).
Keep the folder structure intact — the page loads its CSS, JS and logos by relative path.

## Publish with GitHub Pages

1. Push this folder as the repository root.
2. Settings → Pages → Deploy from branch → `main` / `(root)`.
3. Open `https://<user>.github.io/<repo>/app-home-logout.html`.

## Notes

- Role counts and "12,000+ companies" are placeholder copy.
- All motion switches off under `prefers-reduced-motion`.

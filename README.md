# Shine — App home (logged out)

Mobile-only, single-screen (100dvh, no scroll) logged-out homepage for the Shine app, built on the Shine Design System tokens.

## Structure

```
index.html                  logged-out app home (Shine logo + icons are inline SVG; GitHub Pages serves it at the root URL)
jsrp-logout.html            logged-out app JSRP — search results (links the search-modal, bottom-sheet, sort-filter + notify components)
login-flow.html             log in + forgot password (OTP | password | Google; links the bottom-sheet + notify components)
css/app-home-logout.css     DS tokens (mobile column), components, page styles
js/app-home-logout.js       headline reel, bubble drift, logo shuffle, grey accents, roles tooltip
assets/logos/*.svg          company logos (viewBox cropped to the mark)
components/search-modal/    reusable "What's next for you?" search modal (css + js)
components/bottom-sheet/    reusable bottom sheet — the container behind every slide-up panel (css + js)
components/sort-filter/     reusable Sort · Filter bar + sheets for any results screen (css + js; needs bottom-sheet)
components/notify/          reusable toast (bottom, dark pill) + floating alert (top, coloured by tone) — ShineNotify (css + js)
```

**Flow:** home → **Explore jobs** opens the search modal → **Search Jobs** lands on `jsrp-logout.html?q=…&loc=…&exp=…` → **Edit search** reopens the modal prefilled and updates the results in place (browser back/forward walks the searches; the ‹ button returns home). **Sort · Filter** re-query the results in place and mirror state in the URL (`?sort=recent&f.location=bangalore`) — see `components/sort-filter/README.md`.

**Log in:** `login-flow.html` — OTP or password log in (the OTP verifies itself on the 6th digit), Google, forgot password → OTP → new password → straight back to log in with a "Password reset successfully" alert. A successful log in shows the dark "Welcome back" splash; its quiet **Reset** button returns to `index.html`. Link to it with `login-flow.html?next=<relative url>` to come back after log in (e.g. from a JSRP save/apply nudge); `&tab=password` opens the Password tab; a **Demo data** helper (on by default; `&demo=0` hides it) lists the test logins: OTP-login email/phone (plus a phone linked to 3 emails → account picker), password login, forgot-password email/phone, the 6-digit code `123456`, and switches to simulate Google with no Shine account, a server error on log in, and an expired OTP — each value can be copied or tapped to fill its field. Back returns to the previous screen, or `index.html`. Not linked from other pages yet.

**Explore jobs** opens the search modal (`data-shine-search data-ssm-source="home"`). The component is app-wide: any page includes `components/search-modal/search-modal.css` + `.js` and adds `data-shine-search` to a trigger. Results arrive as a `shine:search` DOM event — see `components/search-modal/README.md`.

**Toasts & alerts:** every page uses `components/notify/` — `ShineNotify.toast(msg, { tone })` for the small dark pill at the bottom, `ShineNotify.alert({ tone, title, text, action })` for the contextual card at the top (tones: success · warning · error · brand · neutral). See `components/notify/README.md`.

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

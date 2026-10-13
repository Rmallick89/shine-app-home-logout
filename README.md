# Shine — App home (logged out)

Mobile-only, single-screen (100dvh, no scroll) logged-out homepage for the Shine app, built on the Shine Design System tokens.

## Structure

```
index.html                  logged-out app home (Shine logo + icons are inline SVG; GitHub Pages serves it at the root URL)
splash.html                 app splash "Sunrise" (dark, ≈ 2 s) — plays when the app opens, then hands over to index.html
jsrp-logout.html            logged-out app JSRP — search results (links the search-modal, bottom-sheet, sort-filter + notify components)
login-flow.html             log in + forgot password (OTP | password | Google; links the bottom-sheet + notify components)
login-welcome.html          "Welcome back" page opened after a successful log in (?name=…&next=…; Reset → splash → index.html)
signup-flow.html            sign up: upload resume / fill manually → parsing → basic details → OTP → verify your details → job preferences
signup-welcome.html         "Welcome to Shine" page after sign up ("I'll do it later" / exit; ?name=…; Reset → splash → index.html)
recommended-jobs.html       4 recommended jobs at the end of sign up (jsrp-logout.html in "recommended" mode; ?name=…&q=…&loc=…)
css/app-home-logout.css     DS tokens (mobile column), components, page styles
js/app-home-logout.js       headline reel, bubble drift, logo shuffle, grey accents, roles tooltip
assets/logos/*.svg          company logos (viewBox cropped to the mark)
components/search-modal/    reusable "What's next for you?" search modal (css + js)
components/bottom-sheet/    reusable bottom sheet — the container behind every slide-up panel (css + js)
components/sort-filter/     reusable Sort · Filter bar + sheets for any results screen (css + js; needs bottom-sheet)
components/notify/          reusable toast (bottom, dark pill) + floating alert (top, coloured by tone) — ShineNotify (css + js)
```

**Splash:** the first time `index.html` opens in a session (app launch / new browser tab) a small script at the top of its `<head>` sends it to `splash.html?to=<this page>`; the splash plays once (≈ 2 s, dark from its first paint so the phone status bar is dark too) and replaces itself with the homepage (`location.replace`, so Back never shows it). Reloading or coming back home later in the same session goes straight to the homepage; open `splash.html` directly to replay it.

**Flow:** home → **Explore jobs** opens the search modal → **Search Jobs** lands on `jsrp-logout.html?q=…&loc=…&exp=…` → **Edit search** reopens the modal prefilled and updates the results in place (browser back/forward walks the searches; the ‹ button returns home). **Sort · Filter** re-query the results in place and mirror state in the URL (`?sort=recent&f.location=bangalore`) — see `components/sort-filter/README.md`.

**Log in:** `login-flow.html` — OTP or password log in (the OTP verifies itself on the 6th digit), Google, forgot password → OTP → new password → straight back to log in with a "Password reset successfully" alert. A successful log in shows the dark "Welcome back" splash and hands over to `login-welcome.html` (a page that is dark from its first paint, so the phone's status bar turns dark too); its quiet **Reset** button replays the splash (`splash.html`) and then opens `index.html`, like starting the app again. Link to it with `login-flow.html?next=<relative url>` to come back after log in (e.g. from a JSRP save/apply nudge); `&tab=password` opens the Password tab; a **Demo data** helper (on by default; `&demo=0` hides it) lists the test logins: OTP-login email/phone (plus a phone linked to 3 emails → account picker), password login, forgot-password email/phone, the 6-digit code `123456`, and switches to simulate Google with no Shine account, a server error on log in, and an expired OTP — each value can be copied or tapped to fill its field. Back returns to the previous screen, or `index.html`. Opened by the homepage **Log in** button, the JSRP save nudge (`?next=` brings you back) and the sign-up flow.

**Sign up:** `signup-flow.html` — every Sign up button opens it (homepage, the log-in header and Google "Account not found", the JSRP "Register on Shine" nudge). Upload a resume (PDF / DOC up to 5 MB; uploading, too-large and wrong-type states) or fill details manually → parsing (5 steps; "couldn't read your resume" sheet) → **Almost there** sheet (basic details; email / number already on Shine → log in instead) → 4-digit OTP → Account created → **Verify your details** (basic, employment, education, skills — ⋮ edit / delete, add, missing-information prompts) → Profile created → **Job preferences** → *Show me recommended jobs* (`recommended-jobs.html`, 4 jobs) or *I'll do it later* (`signup-welcome.html`, Reset → splash). Built only from the existing components and page anatomy (log-in header and fields, nudge / list sheets, chips, badges, JSRP cards and hero). **Demo data** (on by default; `?demo=0` hides it): sample / too-large / wrong-type resume, an email and a number already on Shine, OTP `1234`, and switches for "resume missed some details" and "resume can't be read".

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
- Screen margin follows `jsrp-logout.html`: page content sits 24px (DS spacing.layout.sm) from the left and right screen edge on `index.html`, `login-flow.html` and `login-welcome.html` too, set once per page in a `<style data-screen-margin>` block (`--screen-margin`) at the end of its `<head>`. Backgrounds and decorative art can still run edge to edge; the shared components (sheets, search, toast/alert) are the same on every page.
- Spacing follows `jsrp-logout.html` everywhere (a `<style data-spacing>` block on `index.html` and `login-flow.html`): button pairs 8px apart, 24px bottom inset, headers 12px from the top (like its floating bar), sheet heading → content 28px, 56px under a sheet's last button. The search sheet (v1.3.1) and toast/alert (v1.0.1) components use the same 24px gutter.

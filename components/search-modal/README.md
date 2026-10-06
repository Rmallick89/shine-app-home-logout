# Search modal — app component

"What's next for you?" — the keyword · location · experience search sheet, as one reusable component for every screen of the Shine app. It's a port of the JSRP **Edit search** overlay (`jsrp/JSRP-Index.html`, `.li-search-*`), rebuilt so any page can open it with one attribute.

| File | What it is |
|---|---|
| `search-modal.css` | Styles + a scoped DS token layer (light, mobile column). Every class is prefixed `ssm-`. |
| `search-modal.js` | Behaviour + public API. No dependencies. Injects its own markup on first use. |
| `search-modal-demo.html` | Playground with 5 real triggers and a live event log. Opens on its own (CSS/JS inlined). |

## Add it to a page

```html
<link rel="stylesheet" href="search-modal.css">
<script src="search-modal.js" defer></script>
```

No markup to paste. The modal mounts itself into `<body>`.

### iOS Safari: no zoom on focus

The fields use 14px text, and iOS Safari zooms the whole page when a focused field's text is under 16px. Every host page puts this snippet **right after its viewport `<meta>`**. It adds `maximum-scale=1` on iOS/iPadOS only. Pinch-to-zoom still works, because iOS ignores scale limits for user gestures. Android, which never auto-zooms, is left untouched.

```html
<script data-ios-nozoom>
  (function () {
    var iOS = /iP(hone|ad|od)/.test(navigator.userAgent) ||
              (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);   // iPadOS "desktop" mode
    var m = document.querySelector('meta[name="viewport"]');
    if (iOS && m && !/maximum-scale/.test(m.content)) m.content += ', maximum-scale=1';
  })();
</script>
```

## Open it

**Declarative** (preferred). Any element, present now or added later:

```html
<!-- fresh search (homepage "Explore jobs", any "Search jobs" button) -->
<a href="#" data-shine-search data-ssm-source="home">Explore jobs</a>

<!-- edit mode: prefill from what's on screen (JSRP header) -->
<button data-shine-search="edit"
        data-ssm-keyword-from="#heroQuery"
        data-ssm-location-from="#heroLocation"
        data-ssm-source="jsrp">Edit search</button>

<!-- static prefill (city / category pages) -->
<button data-shine-search data-ssm-location="Pune" data-ssm-source="city-pune">Search in Pune</button>
```

| Attribute | Meaning |
|---|---|
| `data-shine-search` | Opens the modal. Value `edit` sets edit mode; empty or `new` is a fresh search. |
| `data-ssm-keyword` / `-location` / `-experience` | Static prefill. Keyword and location accept comma-separated lists. |
| `data-ssm-keyword-from` / `-location-from` / `-experience-from` | CSS selector read **at tap time** (`textContent`, or `value` for inputs). |
| `data-ssm-source` | Free-text origin, echoed back in the result (analytics, routing). |

**Programmatic**

```js
ShineSearch.open({ keyword: 'Product Manager', location: 'India', mode: 'edit', source: 'jsrp' });
ShineSearch.close();
ShineSearch.isOpen();
ShineSearch.toast('Saved');                 // DS A.09 toast — via ShineNotify when the page has it
ShineSearch.configure({ resultsUrl: '/jsrp' });   // app-wide defaults (or set window.ShineSearchConfig before the script)
```

**JSRP drop-in:** the script also defines `openSearchOverlay(prefill)` (unless the page already has one), the same signature JSRP uses today. Moving JSRP onto this component means deleting its overlay markup/CSS/JS and including these two files.

### Options (defaults → `configure`, per-open → `open`)

| Option | Default | |
|---|---|---|
| `eyebrow` | `Find your next role` | |
| `title` / `titleAccent` | `What's next for` / `you?` | Accent renders in brand blue. |
| `submitLabel` | `Search Jobs` | |
| `errorText` | `Add a role, city or experience to search.` | |
| `placeholders` | `{ keyword, location, experience }` | |
| `roles`, `locations`, `experienceOptions` | JSRP lists | Swap for API-backed lists later. |
| `minChars` | `2` | Typed characters before suggestions open. |
| `resultsUrl` | `null` | When set, submit navigates to `url?q=…&loc=…&exp=…`. |
| `onSubmit(detail)` | `null` | Caller owns the outcome. Return `false` to keep the modal open. |
| `onOpen`, `onClose` | `null` | |
| `toast` | `true` | Confirmation toast when nothing else handles submit. |
| `autofocus` | `true` | Focus the keyword field once the modal settles (320 ms). |

## The result

```js
document.addEventListener('shine:search', e => {
  e.detail // { keywords:['Product Manager'], locations:['Pune'], experience:'3–5 years',
           //   query:'Product Manager', location:'Pune', mode:'new', source:'home' }
  e.preventDefault(); // optional: you handled it, so skip the default toast / navigation
});
```

On submit the order is:

1. `onSubmit` if one was given, which also emits the event.
2. Otherwise the `shine:search` event fires.
3. If no listener calls `preventDefault()`, it falls back to `resultsUrl`, then to the toast.

`shine:search-open` and `shine:search-close` (with `reason`) are emitted too.

## Behaviour, kept from JSRP

- Scrim at 55% black with an 8 px blur. The card is anchored to the **top** with a 16 px gutter, so the keyboard never covers the fields.
- **Tapping the backdrop does not close the modal**, so a mis-tap doesn't wipe typed input. You can close it with ✕ or Escape.
- **Keyword and location** are multi-value combos.
  - Suggestions appear after 2 characters, with the matching part in bold brand.
  - Picking a suggestion appends `", "` so the user can keep adding.
  - Enter adds a custom term.
  - Trailing commas are trimmed on blur.
  - Tapping the field chrome starts a new term.
- **Experience** is a fixed list under a "Total experience" header.
- **Validation:** the user needs at least one of role, city or experience. Otherwise the error shows and the card shakes.

## Changes from the JSRP overlay

- **Error placement:** the error is a solid DS A.07 negative alert that floats 12 px *below* the card (v1.2.0; it sat inside the card in v1.0–1.1). JSRP put bare red text on the dark scrim, where it was hard to read.
- **Clean reopen:** every open starts clean. JSRP left the last dropdown open between opens.
- **Edit mode:** set only when the caller asks (`data-shine-search="edit"`). Prefilling a city doesn't make it an "edit".
- **Keyboard:**
  - Arrow keys move through suggestions, and Enter picks the highlighted one.
  - When there's nothing left to add, the keyboard's **Search** key submits.
  - Escape closes the open list first, then the modal.
- **Accessibility:**
  - `role="dialog"` and `aria-modal`, with focus trapped inside the card and returned to the trigger on close.
  - Combobox/listbox roles with `aria-activedescendant`.
  - Labelled inputs.
- **Scroll lock and motion:** the page behind is scroll-locked while the modal is open. Motion turns off under `prefers-reduced-motion`.
- **Typeface:** Plus Jakarta Sans throughout. JSRP mixed in Inter.
- **Tokens:** values snapped to DS tokens.
  - Field 44 px (`size.control.md`), white fill, radius 12, 12 px inset, `stroke.neutral.base` border — the same A.01 Input as the login flow (v1.1.0).
  - CTA uses Primary · Brand (`brand-500`). Search is the one CTA allowed to be brand blue.

## Where it's used

| Screen | Trigger | Mode |
|---|---|---|
| App home (logged out) — `index.html` | Explore jobs pill → submit goes to the JSRP (`resultsUrl`) | new |
| App JSRP (logged out) — `jsrp-logout.html` | Edit search (prefilled with the live query, location, experience) → results update in place | edit |

## Changelog

- **v1.3.0** — `ShineSearch.toast()` hands off to the app-wide **notify** component (`ShineNotify.toast`) when the page includes it, so every toast in the app is the same pill; the built-in `.ssm-toast` stays as the stand-alone fallback. No visual change inside the modal.
- **v1.2.0** — the validation alert moved out of the card: it now floats 12 px below it as a solid alert with a shadow, easy to read on the scrim. Copy shortened to “Add a role, city or experience to search.” Markup: the card and the alert are wrapped in `.ssm-dialog` (which now carries `role="dialog"`); the shake moves the whole dialog.
- **v1.1.0** — fields now match the login flow's input exactly: height 48 → 44, beige fill → white, 16 → 12 px inset, placeholder weight 400 → 500, focus border brand-500 → brand-600 with a 3 px brand ring at 18 % (was 4 px at 10 %), hover tint removed. No markup, API or behaviour changes.
- **v1.0.0** — first version, ported from the JSRP Edit search overlay.

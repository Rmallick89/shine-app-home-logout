# Notify — app component

Two floating nudges for every screen of the Shine app, as one reusable component.

| Kind | Where | Look | Use for |
|---|---|---|---|
| **Toast** | bottom, centred | small **dark pill**; one background (inverse black), the tone shows only in the **icon colour** | quick confirmations of what just happened: "Resume uploaded successfully", "Link copied", "Job saved" |
| **Alert** | top, full width (16 px gutters, max 480) | contextual card — icon disc · title · text · optional action — **coloured by tone** (the "Account not found" look) | results that need a moment of attention: server errors, "Couldn't send OTP", "Profile updated", "Session ends soon" |

Tones (both kinds): `success` · `warning` · `error` · `brand` · `neutral` (DS intents positive · notice · negative · info · neutral).

| File | What it is |
|---|---|
| `notify.css` | Styles + a scoped DS token layer (light). Every class is prefixed `sn-`. |
| `notify.js` | Behaviour + public API (`window.ShineNotify`). No dependencies. Injects its own layers on first use. |

## Add it to a page

```html
<link rel="stylesheet" href="components/notify/notify.css">
<script src="components/notify/notify.js"></script>
```

No markup to paste. Self-contained pages inline both files verbatim between `<!-- ▼ COMPONENT · notify … -->` / `<!-- ▲ COMPONENT · notify -->` markers — resync them from here on every change.

## Toast

```js
ShineNotify.toast('Resume uploaded successfully', { tone: 'success' });
ShineNotify.toast('Opens job detail');                       // neutral
ShineNotify.toast('Couldn’t copy the link', { tone: 'error' });
```

| Option | Default | |
|---|---|---|
| `tone` | `neutral` | icon colour: success green-300 · warning amber-400 · error red-300 · brand brand-300 · neutral white |
| `icon` | per tone | SVG string (14 px). `''` = no icon |
| `duration` | 3000 (error 5000) | ms; `0` stays until replaced/dismissed |

One line only — long copy is ellipsised (keep it under ~8 words). Read-only: no buttons, no tap target (DS A.09).

## Alert

```js
ShineNotify.alert({
  tone: 'error',
  title: 'Couldn’t send OTP',
  text: 'Something went wrong on our side.',
  action: { label: 'Try again', onClick: retry }
});
```

| Option | Default | |
|---|---|---|
| `tone` | `neutral` | card colours (see below) |
| `title` | — | 2–4 words, bold, tone colour |
| `text` / `html` | — | one short sentence, muted. `html` allows `<b>` (e.g. an email) — pass trusted strings only |
| `action` | — | `{ label, onClick }` or `{ label, href }` — DS secondary button (white, outlined, 32 px pill). Running it closes the alert |
| `icon` | per tone | SVG string for the 32 px disc (e.g. the Google logo) |
| `duration` | 5000 · warning/error 6000 · +2000 with an action | ms; `0` stays until dismissed |
| `onClose` | — | called once when it leaves |

| Tone | Fill | Border | Title / icon |
|---|---|---|---|
| success | green-50 | green-600 @ 28 % | green-700 |
| warning | amber-100 | amber-600 @ 30 % | amber-700 |
| error | red-50 | red-200 | red-600 |
| brand | brand-100 | brand-200 | brand-600 |
| neutral | white | cool-neutral-200 | black / cool-neutral-700 |

Shared: radius 12 · padding 12 · gap 12 · overlay elevation · 32 px white icon disc ringed in the tone border, **top-aligned with the title** · title 14/20 bold · text 12/18 medium · a 2 px time-left hairline along the bottom edge.

## Behaviour

- **One of each at a time** — a new toast replaces the toast, a new alert replaces the alert.
- **Motion** — toast rises 12 px and fades in; alert drops 16 px with a soft spring; both leave faster than they arrive. `prefers-reduced-motion` → fades only.
- **Attention-aware timer** — the alert's timer (and hairline) pauses while it's pressed, hovered or focused.
- **Dismiss** — swipe the alert up, tap it, or press Escape (Escape closes the alert before any sheet or modal underneath). Toasts leave on their own.
- **Layering** — `z-index 10000`: above bottom sheets and the search modal, so an error from inside the OTP sheet still shows.
- **Accessibility** — the toast layer is a polite live region; an alert is `role="alert"` for error/warning, `role="status"` otherwise; the action is a real button.
- **Haptics / analytics hook** — every nudge fires `shine:notify` on `document` with `{ kind, tone, message }`. The Android preview shell buzzes on error/warning alerts and success alerts.

## Placement

```js
ShineNotify.configure({ toastBottom: 84 });   // lift toasts above a page's own bottom bar (JSRP Sort · Filter)
ShineNotify.configure({ alertTop: 12 });      // px below the safe area
```

## DS notes

- Toast = DS **A.09 Toast** (dark pill, intent only in the icon, 3–5 s, error 5 s+).
- Alert = DS **A.07 Alert** anatomy and intent colours, delivered **floating** (A.07 is inline-only in the DS — this is the agreed app extension for transient, screen-level results). Inline alerts that belong to one field or block (e.g. the login page's "Account not found" under Continue with Google) stay inline.

## Where it's used

| Screen | What |
|---|---|
| App login — `login-flow.html` | toasts (demo data copy, OTP resent, coming-soon links); **error alerts** for every server error (Get OTP, OTP check, password, Google) — informative, no button; **success alert** "Password reset successfully" when a reset lands back on log in |
| App JSRP — `jsrp-logout.html` | toasts (job saved, link copied, filters applied, opens…) lifted above the Sort · Filter bar |
| App home — `index.html` | toasts from the search modal |
| Search modal component | `ShineSearch.toast()` delegates here when ShineNotify is on the page |

## Changelog

- **v1.0.0** — first version: toast (5 tones by icon) + floating alert (5 tones by colour), replace-one, pausable timer, swipe/tap/Escape dismiss, `shine:notify` event, `configure()` offsets.

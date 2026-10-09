# Bottom sheet — app component · v1.1.0

The one container behind every slide-up panel in the Shine app: Sort, Filter (and its "See all" sub-sheet), Share, Save, the "Are these jobs relevant?" quick check, and anything new.

The component owns the **container** only:

- position, surface, radius and elevation;
- the handle, header and close button;
- the scrolling body and the footer;
- where the call to action sits and how it behaves (inline or sticky);
- the scrim, motion and closed state.

What goes inside belongs to whoever uses it (the sort-filter component, a page).

| File | What it is |
|---|---|
| `bottom-sheet.css` | Container styles with a scoped DS token layer (light, mobile column). Every class is prefixed `bs-`. |
| `bottom-sheet.js` | `ShineSheet`: open/close, stacking, focus, scroll lock, drag-to-dismiss. No dependencies. |
| `bottom-sheet-demo.html` | Playground with 4 sheet types and a live event log. Opens on its own (CSS/JS inlined). |

## Add it to a page

```html
<link rel="stylesheet" href="bottom-sheet.css">
<script src="bottom-sheet.js"></script>
```

## Markup

```html
<div class="bs" id="citySheet" hidden>
  <div class="bs-handle" aria-hidden="true"></div>
  <div class="bs-head">
    <h2 class="bs-title">Choose a city</h2>
    <button class="bs-close" data-bs-close aria-label="Close">…</button>
  </div>
  <div class="bs-body">…scrolls…</div>
  <div class="bs-foot">…sticky actions…</div>   <!-- optional -->
</div>
```

## Call to action: inline or sticky

Every sheet has at most one button group, `.bs-actions`. **Where it sits decides how it behaves**, and you choose by the sheet's content and behaviour:

| Type | Markup | Behaviour | Use it for |
|---|---|---|---|
| **Inline** | `.bs-actions` as the last child of `.bs-body` | Follows the content and scrolls with it. 24 px above, gutter + home-indicator inset below, no divider. | Short, read-then-act sheets that fit without scrolling: Save / Share / sign-up nudges, confirmations, OTP entry. The user reads, then acts. |
| **Sticky** | `.bs-actions` inside `.bs-foot`, after `.bs-body` | Pinned to the bottom while the body scrolls under it. 16 px padding (+ home-indicator inset); the divider shadow shows only while more content sits below. | Content that scrolls or that the user edits / selects before confirming: filters (Clear · Apply), pickers and selection lists, long forms. The action must always be reachable. |

```html
<!-- inline -->
<div class="bs" data-bs-cta="inline" hidden>
  <div class="bs-handle"></div>
  <div class="bs-head">…</div>
  <div class="bs-body bs-body--gutter">
    <p>Keep your shortlist in one place.</p>
    <div class="bs-actions"><button>Register</button><button>Log in</button></div>
  </div>
</div>

<!-- sticky -->
<div class="bs" data-bs-cta="sticky" hidden>
  <div class="bs-handle"></div>
  <div class="bs-head">…</div>
  <div class="bs-body bs-body--gutter">…long list…</div>
  <div class="bs-foot"><div class="bs-actions bs-actions--row"><button>Clear</button><button>Apply</button></div></div>
</div>
```

| Attribute / class | What it does |
|---|---|
| `data-bs-cta="inline"` / `"sticky"` | ShineSheet puts `.bs-actions` in that place, wherever you wrote it. Without the attribute the markup decides. |
| `data-bs-cta="auto"` | For content of unknown length (2 or 12 accounts, a small phone, the keyboard open): inline while everything fits, sticky the moment the body overflows, back to inline when room returns. It re-checks on open, on resize / keyboard and whenever the body's content changes, keeps focus on a button that moves, and needs a few px of spare room before going back so it never flickers. |
| `data-bs-cta-state` | Set by ShineSheet on the sheet: `inline` or `sticky` (live for `auto`). Style against it if needed. |
| `.bs-actions--row` | Buttons side by side, equal width (Clear · Apply, Log in · Register). Default is stacked, 10 px apart. |
| `.bs-body--gutter` | Pads the body with the sheet gutter (24 px), for free-form content. Lists that bring their own row padding leave it off. |

Rules of thumb: one CTA group per sheet; don't add your own bottom padding to a body that ends in inline actions (they already clear the home indicator); a sheet that only offers a list of tappable rows (Sort) needs no CTA at all.

The script adds `role="dialog"`, `aria-modal` and `aria-labelledby` (taken from `.bs-title`). A closed sheet is always `[hidden]`, which means `display: none`. Nothing sits parked off-screen where its shadow could leak into the viewport. That leak caused the dark band at the bottom of the JSRP.

| Variant / attribute | Use |
|---|---|
| *(default)* | White sheet with a 30% scrim. Sort, Filter, pickers. |
| `data-bs-scrim="strong"` | 45% scrim + 4 px blur. Interruptive nudges such as Share, Save, sign-up. |
| `data-bs-scrim="none"` | No scrim. |
| `.bs--inverse` | Dark sheet. Quick checks and feedback. |
| `.bs--nested` | Opens **inside** its parent `.bs` and covers it, e.g. Filter → "See all". |
| `data-bs-dismiss="false"` | Only the sheet's own buttons close it. Backdrop, Escape and drag are disabled. |
| `data-bs-drag="false"` | Turns off drag-to-dismiss only. |
| `data-bs-autofocus` | Set on a child to focus it on open. By default the sheet itself takes focus, so the keyboard doesn't pop up. |
| `.bs--pad-bottom` | Adds bottom padding that clears the home indicator, for sheets with no footer. |
| `data-bs-cta` | `inline` · `sticky` · `auto` — call-to-action behaviour, see above. |

## Open / close

```html
<button data-bs-open="#citySheet">Choose city</button>      <!-- declarative -->
<button data-bs-close>Done</button>                          <!-- inside any sheet -->
```

```js
ShineSheet.open('#citySheet', { trigger: btn });   // trigger gets aria-expanded and focus back on close
ShineSheet.close('#citySheet');                    // reason 'api'
ShineSheet.toggle(el)  ·  ShineSheet.isOpen(el)  ·  ShineSheet.top()  ·  ShineSheet.closeAll()
ShineSheet.init(root)                              // wire sheets added to the DOM later (open() also does it lazily)
ShineSheet.refresh(el)                             // re-measure an auto CTA sheet now (optional; content changes are watched)
```

## Events

All events are dispatched on the sheet and bubble, so `document` can listen.

| Event | Cancelable | `detail` |
|---|---|---|
| `shine:sheet-open` | yes | `{ trigger }` |
| `shine:sheet-opened` | — | after the slide-in |
| `shine:sheet-close` | yes, e.g. for "discard changes?" | `{ reason }`, one of `close-button`, `backdrop`, `escape`, `drag`, `api`, `parent`, or the caller's own value |
| `shine:sheet-closed` | — | `{ reason }`, after the slide-out, once `[hidden]` is back |
| `shine:sheet-cta` | — | `{ state }` — an `auto` sheet switched its call to action between `inline` and `sticky` |

## Behaviour

It follows the WAI-ARIA dialog pattern plus iOS/Material sheet conventions:

- **Focus:** focus moves into the sheet and Tab is trapped there. On close, focus returns to the trigger.
- **Escape** closes the top sheet. An inner control can claim the key first with `preventDefault()`.
- **Scroll lock:** the page can't scroll while any sheet is open (`html.bs-lock`).
- **Stacking:** each open sheet gets its own scrim level (`--bs-z` + 2 per level). Closing a parent closes its children first.
- **Drag to dismiss:** drag down from the handle or header. The sheet closes past 30% of its height or on a quick flick. The body keeps scrolling normally.
- **Scroll shadows:** the header shadow appears only once the body has scrolled. The footer shadow appears only while there's more content below.
- **Motion:** 320 ms in and 260 ms out on the platform sheet curve. Motion is disabled under `prefers-reduced-motion`.

## Keyboard and status bar (v1.2)

- **On-screen keyboard:** iOS Safari slides the keyboard over the page instead of resizing it, so a sheet with a field (the OTP sheet) ended up under the keyboard. While any sheet is open, ShineSheet follows `visualViewport` and lifts the sheet so it sits on the keyboard's top edge (`--bs-kb`), caps its height to the visible area (`--bs-vvh`, 16 px clear of the top) and drops the home-indicator padding while the keyboard is up (`html.bs-kb`). Android resizes the page itself, so nothing changes there.
- **Status bar:** iOS 26 Safari colours the status bar from the background-color of the body, or of a fixed element at the top edge, and ignores that element's opacity. A faded-out scrim therefore left a grey status bar on the next screen. Scrims now paint with a background image (never background-color) and are `display:none` once faded out. While a scrim is up, ShineSheet gives html/body the page colour dimmed by it, so the status bar dims with the page and is restored on close.

## Tokens

Values are snapped to `design-system/DESIGN-SYSTEM.md`:

- surface: `surface.neutral.raised` (inverse variant: `surface.inverse.base`);
- top radius: `size.radius.3xl`;
- side gutter: `spacing.layout.sm`;
- handle: 40 × 4, in `stroke.neutral.base`;
- close disc: 28 px, warm-neutral/200, with a 12 px icon.

**New token proposed:** `elevation.neutral.sheet`, defined as `0 -16px 48px -8px` at 30% black (light). The DS gives bottom sheets `elevation.neutral.modal`, but that shadow casts downward, so on a sheet anchored to the bottom edge it never shows. Sheets need the upward-cast version.

## Where it's used

| Screen | Sheets |
|---|---|
| App JSRP (logged out): `jsrp-logout.html` | Sort, Filter + See all (through sort-filter), Share and Save nudges (`strong`), relevance quick check (`inverse`) |
| App login (prototype 2): `App login/samples/app-login-prototype2.html` | OTP entry — `strong`, **inline** CTA · account picker — `strong`, **sticky** CTA · demo data — list, no CTA |

## Changelog

- **1.2.0** — Keyboard-aware (rides above the on-screen keyboard, height capped to the visible area) and iOS 26 status-bar tint (scrims paint as an image layer, hidden once faded, html/body dimmed while open). No markup or API changes.
- **1.1.0** — Call-to-action behaviours: `.bs-actions` inline (in the body) or sticky (in the foot), `data-bs-cta="inline|sticky|auto"`, `data-bs-cta-state`, `shine:sheet-cta`, `ShineSheet.refresh()`, `.bs-actions--row`, `.bs-body--gutter`. Existing sheets are unchanged (JSRP sheets verified pixel-identical).
- **1.0.0** — First release.

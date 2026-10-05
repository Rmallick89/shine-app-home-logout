# Bottom sheet — app component

The one container behind every slide-up panel in the Shine app: Sort, Filter (and its "See all" sub-sheet), Share, Save, the "Are these jobs relevant?" quick check, and anything new.

The component owns the **container** only:

- position, surface, radius and elevation;
- the handle, header and close button;
- the scrolling body and the footer;
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
```

## Events

All events are dispatched on the sheet and bubble, so `document` can listen.

| Event | Cancelable | `detail` |
|---|---|---|
| `shine:sheet-open` | yes | `{ trigger }` |
| `shine:sheet-opened` | — | after the slide-in |
| `shine:sheet-close` | yes, e.g. for "discard changes?" | `{ reason }`, one of `close-button`, `backdrop`, `escape`, `drag`, `api`, `parent`, or the caller's own value |
| `shine:sheet-closed` | — | `{ reason }`, after the slide-out, once `[hidden]` is back |

## Behaviour

It follows the WAI-ARIA dialog pattern plus iOS/Material sheet conventions:

- **Focus:** focus moves into the sheet and Tab is trapped there. On close, focus returns to the trigger.
- **Escape** closes the top sheet. An inner control can claim the key first with `preventDefault()`.
- **Scroll lock:** the page can't scroll while any sheet is open (`html.bs-lock`).
- **Stacking:** each open sheet gets its own scrim level (`--bs-z` + 2 per level). Closing a parent closes its children first.
- **Drag to dismiss:** drag down from the handle or header. The sheet closes past 30% of its height or on a quick flick. The body keeps scrolling normally.
- **Scroll shadows:** the header shadow appears only once the body has scrolled. The footer shadow appears only while there's more content below.
- **Motion:** 320 ms in and 260 ms out on the platform sheet curve. Motion is disabled under `prefers-reduced-motion`.

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

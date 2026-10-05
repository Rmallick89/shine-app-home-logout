# Sort & Filter — app component

The floating **Sort · Filter** bar, the Sort sheet, and the Filter sheet with its "See all" sub-sheet, packaged for any app screen that lists results. That covers the JSRP, similar jobs, company jobs, walk-in drives, recommended, saved and applied jobs.

The component owns the **interaction**. The screen owns the **data**:

1. The user picks a sort or applies filters.
2. The component fires an event with the new state.
3. The screen re-queries and re-renders.

This is the same contract the search modal uses with `shine:search`.

| File | What it is |
|---|---|
| `sort-filter.css` | Bar, sort, filter and sub-sheet content styles, with a scoped DS token layer. Every class is prefixed `sf-`. |
| `sort-filter.js` | `ShineSortFilter.create()`, an instance-based API. Requires **`ShineSheet`** from `../bottom-sheet/`. |
| `sort-filter-demo.html` | Playground with a small results list that reacts, plus a live event log. Opens on its own (everything inlined). |

## Add it to a page

```html
<link rel="stylesheet" href="../bottom-sheet/bottom-sheet.css">
<link rel="stylesheet" href="sort-filter.css">
<script src="../bottom-sheet/bottom-sheet.js"></script>
<script src="sort-filter.js"></script>
```

There's no markup to paste. `create()` renders the bar and sheets into `mount`, which defaults to `<body>`.

```js
var sf = ShineSortFilter.create({
  mount: document.getElementById('screen'),
  source: 'jsrp',                                   // echoed in every event
  sort: {
    options: [{ value: 'relevance', label: 'Relevance · Best match' },
              { value: 'recent',    label: 'Most Recent' }],
    defaultValue: 'relevance',
    value: urlState.sort                            // restore
  },
  filters: {
    groups: [{
      key: 'location', name: 'Location', searchable: true,
      popular: ['bangalore', 'pune'],               // chips shown inline (rest → "See all N")
      options: [{ id: 'pune', label: 'Pune', count: 4180 }, …]
    }, …],
    value: { location: ['pune'] }                   // restore
  },
  count: function (draft) { return api.count(draft); }   // number or Promise → "Show N jobs"
});
```

### iOS Safari: no zoom on focus

The "See all" search field uses 14px text, and iOS Safari zooms the whole page when a focused field's text is under 16px. Every host page puts this snippet **right after its viewport `<meta>`**. It adds `maximum-scale=1` on iOS/iPadOS only. Pinch-to-zoom still works, because iOS ignores scale limits for user gestures. Android, which never auto-zooms, is left untouched.

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

## Events

Events bubble from the bar, so `document` can listen.

```js
document.addEventListener('shine:sort', e => e.detail);
//   { value: 'recent', previous: 'relevance', label: 'Most Recent', source: 'jsrp' }

document.addEventListener('shine:filter', e => e.detail);
//   { value: { location: ['pune'], experience: ['3-6'] },   // empty groups omitted
//     previous: {…}, count: 3572, applied: 2, source: 'jsrp' }
```

| Option | Default | |
|---|---|---|
| `mount` | `document.body` | Where the bar and sheets are appended. |
| `sort.options` / `.defaultValue` / `.value` | — | The sort dot shows whenever `value ≠ defaultValue`. |
| `filters.groups[]` | — | `{ key, name, options[{id,label,count?}], popular?[], searchable? }` |
| `filters.value` | `{}` | Unknown groups and ids are dropped, so stale URLs are safe. |
| `count(draft)` | — | Live CTA count. Return 0 to disable Apply ("No matching jobs"). Promises are race-safe: a stale reply is ignored. |
| `labels` | English copy | Every string, e.g. `apply: 'Show <b>{n}</b> jobs'`, `seeAll: 'See all {n}'`. |
| `closeDelay` | `200` | Milliseconds before the Sort sheet closes after a pick, so the user sees the radio change. |
| `onSort`, `onFilter` | — | Optional callbacks, in addition to the events. |

## Instance API

```js
sf.getState()                                  // { sort, filters }
sf.setState({ sort, filters }, { silent })     // restore from URL / history; non-silent emits events
sf.reset({ silent })                           // default sort, no filters (e.g. a brand-new search)
sf.open('sort' | 'filter')  ·  sf.close()
sf.setBarHidden(true, 'footer')                // reasons stack; the bar shows again when none remain
sf.destroy()
```

## Behaviour

- **Sort** is a radio group that applies on tap.
  - The sheet closes after a beat.
  - Arrow keys, Home and End move focus between options; Enter or Space selects.
- **Filter** edits a **draft**.
  - Chips, per-group Clear, Clear all and "See all" only change the draft, and the CTA shows the live count.
  - **Apply** commits the draft.
  - Closing the sheet any other way **discards** it: ✕, backdrop, Escape or drag.
  - The bar's badge counts **applied** options, never the draft.
- **See all** opens a nested sheet.
  - It has its own search box (when `searchable`), a "Selected · N" section, then "All N", and a Done button.
  - An option picked there stays visible as a chip in the parent group.
- **Option order** stays in config order, whatever order the user taps.
- **Bar auto-hide:** the bar hides itself while any *other* sheet is open (share, save, quick check). Its own sheets are excluded.
- **Accessibility:**
  - The bar is a toolbar.
  - Chips use `aria-pressed` and sub-sheet rows use `role="checkbox"`. Groups are labelled.
  - Apply uses `aria-live`.
  - The bar's buttons say what's applied, e.g. "Filter, 3 applied" or "Sort, Most Recent".

## What the screen should do (reference: the JSRP)

1. **Re-query the full result set** on every event, not just the cards already on screen. Show the shimmer while the API responds.
2. **Keep the user at the results.** Sort and filter scroll back to the top of the list, not the page.
3. **Mirror state in the URL:** `?sort=recent&f.location=bangalore,pune`. Use `replaceState`, so Back still leaves the screen. Restore with `setState(…, { silent: true })` on load and on `popstate`.
4. **Reset on a new search:** call `sf.reset({ silent: true })` when the keyword or location changes.
5. **Keep counts consistent:** the hero count and the "Show N jobs" count must come from the same source.
6. **Handle zero results:** `count(draft) === 0` disables Apply. If results still come back empty, render an empty state with a **Clear filters** action that calls `sf.setState({ filters: {} })`.

## Tokens

Snapped to `design-system/DESIGN-SYSTEM.md`:

- bar buttons: A.02 ghost, 40 px tall, full radius;
- chips: A.06, 32 px tall, 1.5 px `stroke.neutral.base`, inverse when selected;
- counts: A.04 inverse badge;
- CTAs: A.02 Primary · Neutral and Secondary, 48 px (`size.control.lg`), radius `size.radius.lg`;
- group cards: `size.radius.xl` on neutral/50;
- search field: A.01, 44 px tall.

The bar's elevation is the only shadow at the bottom of a results screen.

## Where it's used

| Screen | Notes |
|---|---|
| App JSRP (logged out): `jsrp-logout.html` | 6 sorts and 5 filter groups. URL state; reset on a new search.<br>Prototype data is a 46-job sample, so matching jobs are **ranked first** instead of the rest being hidden. The real API returns matches only. |

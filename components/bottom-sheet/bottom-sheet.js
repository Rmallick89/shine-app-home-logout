/* ═══════════════════════════════════════════════════════════════════════
   SHINE · BOTTOM SHEET  (app component)                        v1.0.0
   Pair with bottom-sheet.css. Zero dependencies, no build step.

   Markup (any element with .bs — it starts closed via [hidden]):

     <div class="bs" id="sortSheet" hidden>
       <div class="bs-handle"></div>
       <div class="bs-head">
         <h2 class="bs-title">Sort by</h2>
         <button class="bs-close" data-bs-close aria-label="Close">…</button>
       </div>
       <div class="bs-body">…</div>
       <div class="bs-foot">…</div>          (optional)
     </div>

   Open / close:
     <button data-bs-open="#sortSheet">Sort</button>          declarative
     ShineSheet.open('#sortSheet', { trigger: btn })          programmatic
     ShineSheet.close('#sortSheet')   ·   ShineSheet.closeAll()
     ShineSheet.isOpen(el)   ·   ShineSheet.top()

   Per-sheet options (attributes on .bs):
     data-bs-dismiss="false"   no backdrop / Escape / drag dismissal
     data-bs-drag="false"      no drag-to-dismiss
     data-bs-scrim="strong"    45% scrim + blur (nudges)  ·  "none" = no scrim
     data-bs-autofocus         on a child → focused on open (default: the sheet)
     .bs--nested               opens inside its parent .bs and covers it

   Events (dispatched on the sheet, bubbling):
     shine:sheet-open    cancelable   detail { trigger }
     shine:sheet-opened
     shine:sheet-close   cancelable   detail { reason }   reason: close-button
                                      | backdrop | escape | drag | api
     shine:sheet-closed               detail { reason }

   Behaviour (WAI-ARIA dialog pattern + platform sheet conventions):
     role="dialog" + aria-modal + aria-labelledby (from .bs-title) · focus
     moves in, Tab is trapped, focus returns to the trigger · Escape closes
     the top sheet · page scroll locked while any sheet is open · stacking
     (a sheet over a sheet gets its own scrim level) · drag the handle or
     header down to dismiss (velocity- or distance-based) · trigger gets
     aria-expanded · reduced motion respected · closed = [hidden].
   ═══════════════════════════════════════════════════════════════════════ */
(function (global) {
  'use strict';
  if (global.ShineSheet) return;
  var doc = global.document;

  var stack = [];                    // open sheets, bottom → top
  var uid = 0;
  var FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
  var reduced = global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)');

  function $(t) { return typeof t === 'string' ? doc.querySelector(t) : t; }
  function emit(el, name, detail, cancelable) {
    var ev;
    try { ev = new CustomEvent(name, { bubbles: true, cancelable: !!cancelable, detail: detail || {} }); }
    catch (e) { ev = doc.createEvent('CustomEvent'); ev.initCustomEvent(name, true, !!cancelable, detail || {}); }
    return el.dispatchEvent(ev);
  }
  function attr(el, name, val) { return el.getAttribute(name) === val; }
  function isNested(el) { return el.classList.contains('bs--nested'); }
  function dismissible(el) { return !attr(el, 'data-bs-dismiss', 'false'); }
  function durationOf(el) {
    if (reduced && reduced.matches) return 0;
    var d = getComputedStyle(el).transitionDuration.split(',')[0];
    return (parseFloat(d) || 0) * (d.indexOf('ms') > -1 ? 1 : 1000);
  }

  /* ── one-time wiring of a sheet ─────────────────────────────────── */
  function prepare(el) {
    if (el.__bs) return el.__bs;
    var st = el.__bs = { id: el.id || ('bs-' + (++uid)), scrim: null, trigger: null, timer: 0, reason: null };
    el.id = st.id;
    el.setAttribute('role', el.getAttribute('role') || 'dialog');
    el.setAttribute('aria-modal', 'true');
    el.setAttribute('tabindex', '-1');
    var title = el.querySelector('.bs-title');
    if (title && !el.hasAttribute('aria-labelledby') && !el.hasAttribute('aria-label')) {
      title.id = title.id || st.id + '-title';
      el.setAttribute('aria-labelledby', title.id);
    }
    if (!el.classList.contains('is-open')) el.hidden = true;

    // scroll-aware head / foot elevation
    var body = el.querySelector(':scope > .bs-body');
    if (body) {
      st.body = body;
      body.addEventListener('scroll', function () { syncScroll(el); }, { passive: true });
    }
    // drag to dismiss — from the handle or header only, so body scrolling is never hijacked
    if (!attr(el, 'data-bs-drag', 'false')) {
      Array.prototype.forEach.call(el.querySelectorAll(':scope > .bs-handle, :scope > .bs-head'), function (h) { dragify(el, h); });
    }
    return st;
  }

  function syncScroll(el) {
    var b = el.__bs && el.__bs.body; if (!b) return;
    el.classList.toggle('is-scrolled', b.scrollTop > 2);
    el.classList.toggle('has-more', b.scrollHeight - b.clientHeight - b.scrollTop > 2);
  }

  /* ── scrim ──────────────────────────────────────────────────────── */
  function scrimFor(el) {
    var st = el.__bs;
    if (attr(el, 'data-bs-scrim', 'none')) return null;
    if (!st.scrim) {
      var s = doc.createElement('div');
      s.className = 'bs-scrim' + (isNested(el) ? ' bs-scrim--nested' : '') + (attr(el, 'data-bs-scrim', 'strong') ? ' bs-scrim--strong' : '');
      s.setAttribute('aria-hidden', 'true');
      s.addEventListener('click', function () { if (dismissible(el)) close(el, 'backdrop'); });
      el.parentNode.insertBefore(s, el);           // sibling → nested scrims stay inside the parent sheet
      st.scrim = s;
    }
    return st.scrim;
  }

  /* ── scroll lock (ref-counted via the stack) ────────────────────── */
  function lock(on) { doc.documentElement.classList.toggle('bs-lock', on); }

  /* ── focus ──────────────────────────────────────────────────────── */
  function focusables(el) {
    return Array.prototype.filter.call(el.querySelectorAll(FOCUSABLE), function (n) {
      return n.offsetParent !== null && n.closest('.bs') === el;      // skip nested sheets' own controls
    });
  }
  doc.addEventListener('keydown', function (e) {
    var top = stack[stack.length - 1]; if (!top) return;
    if (e.key === 'Escape') {
      if (e.defaultPrevented) return;              // an inner control (e.g. a listbox) handled it
      if (dismissible(top)) { e.preventDefault(); close(top, 'escape'); }
      return;
    }
    if (e.key !== 'Tab') return;
    var f = focusables(top);
    if (!f.length) { e.preventDefault(); top.focus(); return; }
    var first = f[0], last = f[f.length - 1], a = doc.activeElement;
    if (e.shiftKey && (a === first || a === top)) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && a === last) { e.preventDefault(); first.focus(); }
    else if (!top.contains(a)) { e.preventDefault(); first.focus(); }
  });

  /* ── open / close ───────────────────────────────────────────────── */
  function layer() {
    stack.forEach(function (el, i) {
      var base = 'calc(var(--bs-z) + ' + (i * 2) + ')';
      if (!isNested(el)) {
        el.style.zIndex = 'calc(var(--bs-z) + ' + (i * 2 + 1) + ')';
        if (el.__bs.scrim) el.__bs.scrim.style.zIndex = base;
      } else {
        el.style.zIndex = 12; if (el.__bs.scrim) el.__bs.scrim.style.zIndex = 11;
      }
    });
  }

  function open(target, opts) {
    var el = $(target); if (!el) return false;
    opts = opts || {};
    var st = prepare(el);
    if (stack.indexOf(el) > -1) return true;
    if (!emit(el, 'shine:sheet-open', { trigger: opts.trigger || null }, true)) return false;
    clearTimeout(st.timer);

    st.trigger = opts.trigger || (doc.activeElement !== doc.body ? doc.activeElement : null);
    if (st.trigger && st.trigger.setAttribute) { st.trigger.setAttribute('aria-expanded', 'true'); st.trigger.setAttribute('aria-controls', st.id); }

    stack.push(el);
    if (stack.length === 1) lock(true);
    var scrim = scrimFor(el);
    el.hidden = false; el.style.transform = '';
    layer();
    void el.offsetHeight;                          // commit the closed position so the slide runs
    el.classList.add('is-open');
    if (scrim) scrim.classList.add('is-open');
    syncScroll(el);

    var af = el.querySelector('[data-bs-autofocus]');
    try { (af || el).focus({ preventScroll: true }); } catch (e) { (af || el).focus(); }
    st.timer = setTimeout(function () { syncScroll(el); emit(el, 'shine:sheet-opened', {}); }, durationOf(el));
    return true;
  }

  function close(target, reason) {
    var el = $(target); if (!el || !el.__bs) return false;
    var st = el.__bs, i = stack.indexOf(el);
    if (i < 0) return false;
    reason = reason || 'api';
    if (!emit(el, 'shine:sheet-close', { reason: reason }, true)) { el.style.transform = ''; return false; }
    // closing a parent closes anything stacked above it first
    for (var k = stack.length - 1; k > i; k--) close(stack[k], 'parent');

    stack.splice(stack.indexOf(el), 1);
    el.classList.remove('is-open', 'is-dragging');
    el.style.transform = '';
    if (st.scrim) st.scrim.classList.remove('is-open');
    if (st.trigger && st.trigger.setAttribute) st.trigger.setAttribute('aria-expanded', 'false');
    if (!stack.length) lock(false);
    layer();

    var trig = st.trigger; st.trigger = null;
    if (trig && doc.contains(trig) && typeof trig.focus === 'function' && (!stack.length || stack[stack.length - 1].contains(trig))) {
      try { trig.focus({ preventScroll: true }); } catch (e) { trig.focus(); }
    } else if (stack.length) {
      try { stack[stack.length - 1].focus({ preventScroll: true }); } catch (e) {}
    }
    clearTimeout(st.timer);
    st.timer = setTimeout(function () {
      if (stack.indexOf(el) > -1) return;            // reopened meanwhile
      el.hidden = true;
      emit(el, 'shine:sheet-closed', { reason: reason });
    }, durationOf(el) + 20);
    return true;
  }

  function toggle(target, opts) { var el = $(target); return isOpen(el) ? close(el, 'api') : open(el, opts); }
  function isOpen(target) { var el = $(target); return !!el && stack.indexOf(el) > -1; }
  function top() { return stack[stack.length - 1] || null; }
  function closeAll(reason) { for (var k = stack.length - 1; k >= 0; k--) close(stack[k], reason || 'api'); }

  /* ── drag to dismiss ────────────────────────────────────────────── */
  function dragify(el, handle) {
    var y0 = 0, t0 = 0, dy = 0, active = false, pid = null;
    handle.addEventListener('pointerdown', function (e) {
      if (!isOpen(el) || !dismissible(el) || e.button > 0) return;
      if (e.target.closest('button, a, input, select, textarea, [role="button"]')) return;
      active = true; pid = e.pointerId; y0 = e.clientY; t0 = e.timeStamp; dy = 0;
      try { handle.setPointerCapture(pid); } catch (x) {}
      el.classList.add('is-dragging');
    });
    handle.addEventListener('pointermove', function (e) {
      if (!active || e.pointerId !== pid) return;
      dy = Math.max(0, e.clientY - y0);
      el.style.transform = 'translate3d(0,' + dy + 'px,0)';
    });
    function end(e) {
      if (!active || (e && e.pointerId !== pid)) return;
      active = false; el.classList.remove('is-dragging');
      var v = dy / Math.max(1, (e ? e.timeStamp : t0) - t0);   // px / ms
      if (dy > el.offsetHeight * 0.3 || (dy > 24 && v > 0.6)) close(el, 'drag');
      else el.style.transform = '';
    }
    handle.addEventListener('pointerup', end);
    handle.addEventListener('pointercancel', end);
  }

  /* ── declarative triggers ───────────────────────────────────────── */
  doc.addEventListener('click', function (e) {
    var o = e.target.closest && e.target.closest('[data-bs-open]');
    if (o) { e.preventDefault(); open(o.getAttribute('data-bs-open'), { trigger: o }); return; }
    var c = e.target.closest && e.target.closest('[data-bs-close]');
    if (c) { var s = c.closest('.bs'); if (s) { e.preventDefault(); close(s, 'close-button'); } }
  });

  function init(root) {
    Array.prototype.forEach.call((root || doc).querySelectorAll('.bs'), prepare);
  }
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', function () { init(); }); else init();

  global.ShineSheet = { open: open, close: close, toggle: toggle, isOpen: isOpen, top: top, closeAll: closeAll, init: init, version: '1.0.0' };
})(window);

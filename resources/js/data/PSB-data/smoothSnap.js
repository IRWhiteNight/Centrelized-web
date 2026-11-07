/* ==========================================================================
   smoothSnap.js  —  resources/js/data/PSB-data/smoothSnap.js  (any shared folder works)
   Smooth wheel scrolling + "one step per gesture" section snapping. No library.
   Desktop mouse/trackpad only. Touch + reduced motion keep native scrolling.
   Sections = direct <section> children of `root`.
   • short section  -> one gesture glides to the next section
   • tall section   -> free reading until its bottom, then the next section
   • a new step starts only after the wheel pauses (SNAP_PAUSE), so fast
     scrolling can never fly past a section.
========================================================================== */
export const SNAP_PAUSE = 120; // ms of wheel silence that ends a gesture (raise if trackpad momentum skips sections)
export const GLIDE = 120;      // easing time constant in ms (higher = floatier)

export const canSmooth = () =>
    window.matchMedia('(hover: hover) and (pointer: fine)').matches && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* real layout positions (sticky sections report moved offsets, so sum the heights) */
export const layoutOf = (root) => {
    let y = root.getBoundingClientRect().top + window.scrollY;
    return [...root.children].filter((c) => c.tagName === 'SECTION').map((s) => {
        const h = s.offsetHeight, a = y; y += h;
        return { id: s.id || s.dataset.sec, a, h, b: Math.max(a, a + h - window.innerHeight) };
    });
};

const bracket = (P, y, d) => {
    let lo = P[0], hi = P[P.length - 1];
    P.forEach((p) => { if (p <= y + 2) lo = p; });
    [...P].reverse().forEach((p) => { if (p >= y - 2) hi = p; });
    if (hi - lo < 3) {
        if (d > 0) hi = P.find((p) => p > y + 2) ?? hi;
        else lo = [...P].reverse().find((p) => p < y - 2) ?? lo;
    }
    return [lo, hi];
};

export function createScroller(root) {
    let cur = window.scrollY, tgt = cur, raf = 0, t0 = 0, idle = 0, gest = null, dir = 1;
    const max = () => document.documentElement.scrollHeight - window.innerHeight;
    const pts = () => {
        const L = layoutOf(root), m = max();
        const P = [...new Set([...L.flatMap((s) => [s.a, s.b]), m].map((v) => Math.round(Math.min(Math.max(v, 0), m))))].sort((x, y) => x - y);
        return { L, P };
    };
    const tick = (t) => {
        const dt = Math.min(48, t - t0 || 16); t0 = t;
        cur += (tgt - cur) * (1 - Math.exp(-dt / GLIDE));
        if (Math.abs(tgt - cur) < 0.4) cur = tgt;
        window.scrollTo(0, cur);
        raf = cur === tgt ? 0 : requestAnimationFrame(tick);
    };
    const run = () => { if (!raf) { t0 = performance.now(); raf = requestAnimationFrame(tick); } };
    const step = (d) => { const [lo, hi] = bracket(pts().P, tgt, d); tgt = d > 0 ? hi : lo; run(); };

    const settle = () => {
        gest = null;
        const { L, P } = pts();
        if (L.some((s) => s.b > s.a && tgt > s.a + 2 && tgt < s.b - 2)) return; // reading inside a tall section
        const near = P.reduce((m, p) => (Math.abs(p - tgt) < Math.abs(m - tgt) ? p : m), P[0]);
        if (Math.abs(near - tgt) > 1) { tgt = near; run(); }
    };

    const onWheel = (e) => {
        if (e.ctrlKey) return; // pinch-zoom
        e.preventDefault();
        const dy = e.deltaMode === 1 ? e.deltaY * 32 : e.deltaMode === 2 ? e.deltaY * window.innerHeight : e.deltaY;
        if (!dy) return;
        dir = dy > 0 ? 1 : -1;
        if (!gest || gest.d !== dir) {
            const { L, P } = pts(), [lo, hi] = bracket(P, tgt, dir);
            const read = L.some((s) => s.b > s.a && Math.abs(s.a - lo) < 3 && Math.abs(s.b - hi) < 3);
            gest = { d: dir, lo, hi, read };
            if (!read) { tgt = dir > 0 ? hi : lo; run(); } // commit: glide to next / previous section
        }
        if (gest.read) { tgt = Math.min(gest.hi, Math.max(gest.lo, tgt + dy)); run(); }
        clearTimeout(idle); idle = setTimeout(settle, SNAP_PAUSE);
    };

    const onKey = (e) => {
        if (e.altKey || e.ctrlKey || e.metaKey || e.target.closest?.('input, textarea, select, button, a, [contenteditable]')) return;
        const k = e.key;
        if (k === 'ArrowDown' || k === 'PageDown' || (k === ' ' && !e.shiftKey)) { e.preventDefault(); step(1); }
        else if (k === 'ArrowUp' || k === 'PageUp' || (k === ' ' && e.shiftKey)) { e.preventDefault(); step(-1); }
        else if (k === 'Home') { e.preventDefault(); tgt = 0; run(); }
        else if (k === 'End') { e.preventDefault(); tgt = max(); run(); }
    };

    /* stay in sync if the page is moved natively (scrollbar drag, anchor jump) */
    const onNative = () => { if (!raf && Math.abs(window.scrollY - cur) > 2) cur = tgt = window.scrollY; };

    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('keydown', onKey);
    window.addEventListener('scroll', onNative, { passive: true });
    return {
        to: (id) => { const s = layoutOf(root).find((x) => x.id === id); if (!s) return; gest = null; tgt = Math.min(Math.max(s.a, 0), max()); run(); },
        destroy: () => { cancelAnimationFrame(raf); clearTimeout(idle); window.removeEventListener('wheel', onWheel); window.removeEventListener('keydown', onKey); window.removeEventListener('scroll', onNative); },
    };
}

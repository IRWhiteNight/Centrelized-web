import { useEffect } from 'react';

/* ==========================================================
   DECK ENGINE — one wheel gesture = one slide (smooth, reversible)
   Same engine as the Home page, but the slide count is a parameter,
   so any page (Services, About, …) can reuse it.
   Touch devices use native scrolling limited to one slide per swipe.
========================================================== */
const TAU = 120, THRESH = 60, COOL = 480, SNAP_IDLE = 140;

/* jump to a slide from anywhere: goToSlide(3) */
export const goToSlide = (i) => window.dispatchEvent(new CustomEvent('deck-go', { detail: i }));

export default function useDeck(COUNT, setCurrent) {
    useEffect(() => {
        const root = document.documentElement;
        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const touch = window.matchMedia('(pointer: coarse)').matches;
        const last = COUNT - 1;
        const vh = () => window.innerHeight;
        const spacer = document.querySelector('.spacer');
        const clampI = (i) => Math.max(0, Math.min(last, i));
        const clampY = (y) => Math.max(0, Math.min(last * vh(), y));
        const nearest = () => clampI(Math.round(window.scrollY / vh()));

        let index = nearest(), target = window.scrollY, pos = target;
        let acc = 0, accDir = 0, lockDir = 0, lockUntil = 0, lastAbs = 0, lastT = 0;
        let touchIdx = null, running = false, prevT = 0, raf = 0, paintRaf = 0, snapTimer = 0;

        const size = () => { if (spacer) spacer.style.height = `${COUNT * vh()}px`; };
        const paint = () => {
            root.style.setProperty('--pos', (Math.min(window.scrollY, last * vh()) / vh()).toFixed(4));
            setCurrent(nearest());
        };
        const tick = (t) => {
            const dt = Math.min(64, prevT ? t - prevT : 16);
            prevT = t;
            pos += (target - pos) * (reduced ? 1 : 1 - Math.exp(-dt / TAU));
            if (Math.abs(target - pos) < 0.5) { pos = target; running = false; prevT = 0; }
            window.scrollTo({ top: pos, left: 0, behavior: 'instant' });
            if (running) raf = requestAnimationFrame(tick);
        };
        const start = () => { if (!running) { running = true; prevT = 0; raf = requestAnimationFrame(tick); } };
        const goIndex = (i) => { index = clampI(i); acc = 0; accDir = 0; lockUntil = 0; target = index * vh(); start(); };
        const commit = (dir, now) => {
            acc = 0; accDir = 0; lockDir = dir; lockUntil = now + COOL;
            index = clampI(index + dir); target = index * vh(); start();
        };
        const settle = () => {
            acc = 0; accDir = 0; touchIdx = null;
            index = clampI(Math.round(target / vh()));
            const s = index * vh();
            if (Math.abs(s - target) > 1) { target = s; start(); }
        };
        const schedule = (ms) => { clearTimeout(snapTimer); snapTimer = setTimeout(settle, ms); };

        const onWheel = (e) => {
            if (e.ctrlKey) return;
            e.preventDefault();
            const unit = e.deltaMode === 1 ? 40 : e.deltaMode === 2 ? vh() : 1;
            const d = e.deltaY * unit, abs = Math.abs(d), dir = Math.sign(d);
            const now = performance.now(), gap = now - lastT;
            const decaying = abs < lastAbs * 0.97;
            lastT = now; lastAbs = abs;
            if (!dir) return;
            schedule(SNAP_IDLE);
            if (dir === lockDir) {
                if (now < lockUntil) return;
                if (gap < 90 && (decaying || abs < 20)) return;
            }
            if (dir !== accDir) { acc = 0; accDir = dir; }
            acc += d;
            if (Math.abs(acc) >= THRESH) { commit(dir, now); return; }
            target = clampY(index * vh() + acc);
            start();
        };
        const onKey = (e) => {
            const tag = e.target.tagName;
            if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return;
            if (e.key === ' ' && (tag === 'BUTTON' || tag === 'A')) return;
            const dir = { ArrowDown: 1, PageDown: 1, ArrowUp: -1, PageUp: -1, ' ': e.shiftKey ? -1 : 1 }[e.key];
            if (e.key === 'Home') { e.preventDefault(); goIndex(0); }
            else if (e.key === 'End') { e.preventDefault(); goIndex(last); }
            else if (dir) { e.preventDefault(); goIndex(index + dir); }
        };
        const onTouchStart = () => { touchIdx = nearest(); clearTimeout(snapTimer); };
        const onScroll = () => {
            cancelAnimationFrame(paintRaf);
            paintRaf = requestAnimationFrame(paint);
            if (running) return;
            if (touch && touchIdx !== null) {
                const h = vh(), y = window.scrollY;
                const lo = clampI(touchIdx - 1) * h, hi = clampI(touchIdx + 1) * h;
                if (y < lo) window.scrollTo(0, lo); else if (y > hi) window.scrollTo(0, hi);
            }
            pos = target = window.scrollY;
            schedule(touch ? 140 : SNAP_IDLE);
        };
        const onGo = (e) => goIndex(e.detail);
        const onResize = () => { size(); window.scrollTo(0, index * vh()); pos = target = window.scrollY; paint(); };

        size(); paint();
        if (!touch) window.addEventListener('wheel', onWheel, { passive: false });
        window.addEventListener('touchstart', onTouchStart, { passive: true });
        window.addEventListener('keydown', onKey);
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onResize);
        window.addEventListener('deck-go', onGo);
        return () => {
            cancelAnimationFrame(raf); cancelAnimationFrame(paintRaf); clearTimeout(snapTimer);
            window.removeEventListener('wheel', onWheel);
            window.removeEventListener('touchstart', onTouchStart);
            window.removeEventListener('keydown', onKey);
            window.removeEventListener('scroll', onScroll);
            window.removeEventListener('resize', onResize);
            window.removeEventListener('deck-go', onGo);
        };
    }, [COUNT, setCurrent]);
}

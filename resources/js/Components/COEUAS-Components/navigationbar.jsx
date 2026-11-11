import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import { Link, usePage } from '@inertiajs/react';
import '../../../css/COE-UAS-css/navigationbar.css';
import sandbox from '../../images/PSB.png';      // same logo image as the PSB navbar
import vertiport from '../../images/vertiport.png';
import coeuas from '../../images/UAS.png';
import {
    HOME,
    MAIN_NAV,
    CONTACT_PAGE,
    CONTACT_LINK,
    COLLABORATE_LINK,
    RELATED,
} from '../../data/COEUAS-data/siteMapCOEUAS';

/* ------------------------------------------------------------------ */
/*  Navigation data (comes from siteMapCOEUAS.js)                      */
/*  Every menu item is a "target": the page it lives on (`base`) plus  */
/*  the id of the section on that page (`id`).                         */
/* ------------------------------------------------------------------ */

const SCROLL_OFFSET = 72; // px left above a section when jumping to it
const LOGOS = { sandbox, vertiport };

// A plain page link (no section)
const top = (href) => ({ base: href, id: null, href });

const NAV = [{ key: 'home', label: 'Home', href: HOME }, ...MAIN_NAV];
const MEGAS = NAV.filter((n) => n.entries);
const DRAWER = [...NAV, { ...CONTACT_PAGE }]; // mobile menu also lists Contact
const TOTAL = String(NAV.length).padStart(2, '0');
const pad = (n) => String(n + 1).padStart(2, '0');

// Lookup "page#id" -> target, so a hash in the URL resolves like a menu click
const TARGETS = new Map();
const addTarget = (t) => t?.id && TARGETS.set(`${t.base.toLowerCase()}#${t.id}`, t);
DRAWER.forEach((n) =>
    n.entries?.forEach((e) => {
        addTarget(e);
        e.chips?.forEach(addTarget);
    })
);

/* ------------------------------------------------------------------ */
/*  Scrolling to a section                                             */
/* ------------------------------------------------------------------ */

const reduced = () =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// exact id first, then a partial id match
const resolveEl = (t) =>
    document.getElementById(t.id) ||
    document.querySelector(`[id*="${CSS.escape(t.id)}"]`);

const topOf = (el) => el.getBoundingClientRect().top + window.scrollY - SCROLL_OFFSET;

/**
 * Scrolls to a target. If the page is still rendering it keeps looking for
 * the section for up to 3 seconds. Returns a cancel function.
 * A target with no id scrolls to the top of the page.
 */
function scrollToTarget(t, { smooth = false, delay = 0 } = {}) {
    let cancelled = false;
    let t2 = 0;
    const started = performance.now();
    const behavior = smooth && !reduced() ? 'smooth' : 'auto';

    const run = () => {
        if (cancelled) return;

        if (!t.id) {
            window.scrollTo({ top: 0, behavior });
            return;
        }

        const el = resolveEl(t);
        if (!el) {
            if (performance.now() - started < 3000) requestAnimationFrame(run);
            else if (import.meta.env?.DEV) console.warn(`[COEUASNavbar] No section found for "${t.href}"`);
            return;
        }

        window.scrollTo({ top: Math.max(0, topOf(el)), behavior });

        // images can still shift the layout: check once more
        t2 = setTimeout(() => {
            if (cancelled) return;
            const again = resolveEl(t);
            if (again && Math.abs(topOf(again) - window.scrollY) > 40) {
                window.scrollTo({ top: Math.max(0, topOf(again)), behavior: 'auto' });
            }
        }, smooth ? 900 : 500);
    };

    const t1 = setTimeout(run, delay);
    return () => {
        cancelled = true;
        clearTimeout(t1);
        clearTimeout(t2);
    };
}

/* ------------------------------------------------------------------ */
/*  Link that knows about sections                                     */
/*  Same page  -> smooth scroll to the section (no page reload)        */
/*  Other page -> normal Inertia visit, then scroll to the section     */
/* ------------------------------------------------------------------ */

const NavCtx = createContext({ path: '/', onGo: () => {} });

const cleanPath = (p) => {
    const s = (p || '/').split(/[?#]/)[0];
    return (s.length > 1 ? s.replace(/\/+$/, '') : s).toLowerCase();
};

function NavLink({ to, children, ...rest }) {
    const { path, onGo } = useContext(NavCtx);
    const same = cleanPath(path) === cleanPath(to.base);
    const Tag = same ? 'a' : Link;
    return (
        <Tag href={to.href} onClick={(e) => onGo(e, to, same)} {...rest}>
            {children}
        </Tag>
    );
}

/* ------------------------------------------------------------------ */
/*  Small pieces                                                       */
/* ------------------------------------------------------------------ */

// Text that rolls up on hover (two stacked copies)
function Roll({ children }) {
    return (
        <span className="cx-roll">
            <span>{children}</span>
            <span aria-hidden="true">{children}</span>
        </span>
    );
}

const Arrow = ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 14 14" aria-hidden="true">
        <path
            d="M3 7h8M7.5 3.5 11 7l-3.5 3.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

// two linked rings: partnership
const Link2 = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
        <circle cx="6" cy="8" r="3.6" fill="none" stroke="currentColor" strokeWidth="1.7" />
        <circle cx="10" cy="8" r="3.6" fill="none" stroke="currentColor" strokeWidth="1.7" />
    </svg>
);

/* ------------------------------------------------------------------ */
/*  Navbar                                                             */
/* ------------------------------------------------------------------ */

export default function Navigationbar({ children }) {
    const { url } = usePage();
    const path = url.split(/[?#]/)[0];

    const [relatedOpen, setRelatedOpen] = useState(false); // logo dropdown
    const [open, setOpen] = useState(false);               // desktop mega menu
    const [active, setActive] = useState(MEGAS[0].key);    // which mega panel
    const [drawer, setDrawer] = useState(false);           // mobile menu
    const [expanded, setExpanded] = useState(null);        // mobile accordion

    const listRef = useRef(null);
    const indicatorRef = useRef(null);
    const headerRef = useRef(null);
    const cardRef = useRef(null);
    const panelRefs = useRef([]);
    const timers = useRef({});
    const openRef = useRef(false);
    const quiet = useRef(false);       // true while focus is moved by code, not the user
    const cancelScroll = useRef(null); // cancels a scroll that is still looking for its section

    openRef.current = open;

    const isActive = (href) => {
        const p = cleanPath(path);
        const h = cleanPath(href);
        return p === h || p.startsWith(`${h}/`);
    };

    const activeIdx = MEGAS.findIndex((m) => m.key === active);

    /* ---------- Sliding blue highlight ---------- */

    // Written straight to CSS variables / classes, so hovering never re-renders React.
    // The tab under the highlight gets `is-lit` (white text on the blue pill).
    const place = useCallback((el) => {
        const ind = indicatorRef.current;
        if (!ind) return;

        listRef.current
            ?.querySelectorAll('a.is-lit')
            .forEach((a) => a !== el && a.classList.remove('is-lit'));

        if (!el) {
            ind.style.opacity = '0';
            return;
        }

        el.classList.add('is-lit');

        const li = el.closest('li');
        const wasHidden = ind.style.opacity !== '1';
        if (wasHidden) ind.classList.add('is-snap');

        ind.style.setProperty('--x', `${li.offsetLeft}px`);
        ind.style.setProperty('--w', `${li.offsetWidth}px`);
        ind.style.opacity = '1';

        if (wasHidden) {
            void ind.offsetWidth; // flush so the jump isn't animated
            ind.classList.remove('is-snap');
        }
    }, []);

    const placeActive = useCallback(() => {
        place(listRef.current?.querySelector('a[aria-current="page"]'));
    }, [place]);

    useLayoutEffect(() => {
        placeActive();
        const raf = requestAnimationFrame(() => listRef.current?.classList.add('is-ready'));
        const ro = new ResizeObserver(placeActive);
        if (listRef.current) ro.observe(listRef.current);
        document.fonts?.ready.then(placeActive);

        return () => {
            cancelAnimationFrame(raf);
            ro.disconnect();
        };
    }, [url, placeActive]);

    // While a menu is open the highlight stays on its tab; when it closes
    // the highlight returns to the current page.
    useEffect(() => {
        if (!open) {
            placeActive();
            return;
        }
        place(listRef.current?.querySelector(`[data-key="${active}"]`));
    }, [open, active, place, placeActive]);

    /* ---------- Mega menu: open / close with hover intent ---------- */

    const openMenu = useCallback((key, instant = false) => {
        clearTimeout(timers.current.close);
        clearTimeout(timers.current.open);

        const go = () => {
            setActive(key);
            setOpen(true);
        };

        // Already open: switch panels at once. Closed: wait a beat so a
        // pointer just passing over the bar doesn't throw the menu open.
        if (openRef.current || instant) go();
        else timers.current.open = setTimeout(go, 90);
    }, []);

    const closeMenu = useCallback((delay = 180) => {
        clearTimeout(timers.current.open);
        clearTimeout(timers.current.close);
        timers.current.close = setTimeout(() => setOpen(false), delay);
    }, []);

    const closeAll = useCallback(() => {
        clearTimeout(timers.current.open);
        clearTimeout(timers.current.close);
        setOpen(false);
        setDrawer(false);
        setRelatedOpen(false);
    }, []);

    useEffect(() => () => {
        clearTimeout(timers.current.open);
        clearTimeout(timers.current.close);
        cancelScroll.current?.();
    }, []);

    /* ---------- Section links ---------- */

    // Called by every menu link when it is clicked
    const onGo = useCallback((e, to, same) => {
        // Let the browser handle ctrl/cmd/shift-click (open in a new tab)
        if (e.defaultPrevented || e.button > 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

        closeAll();
        if (!same) return; // other page: Inertia navigates, the effect below scrolls

        e.preventDefault();
        try {
            window.history.replaceState(window.history.state, '', to.href);
        } catch (err) { /* ignore */ }
        cancelScroll.current?.();
        cancelScroll.current = scrollToTarget(to, { smooth: true, delay: 60 });
    }, [closeAll]);

    const ctx = useMemo(() => ({ path, onGo }), [path, onGo]);

    // After a navigation (or a first load with #section in the address):
    // close the menus and scroll to the section named in the URL
    useEffect(() => {
        closeAll();

        const hash = decodeURIComponent(window.location.hash.slice(1));
        cancelScroll.current?.();
        cancelScroll.current = null;
        if (!hash) return;

        const known = TARGETS.get(`${cleanPath(window.location.pathname)}#${hash}`.toLowerCase());
        // wait a moment so the new page can mount and Inertia can reset its scroll
        cancelScroll.current = scrollToTarget(known || { id: hash, href: `#${hash}` }, { delay: 140 });
    }, [url, closeAll]);

    // The card grows and shrinks to fit whichever panel is showing
    useLayoutEffect(() => {
        const card = cardRef.current;
        const panel = panelRefs.current[activeIdx];
        if (!card || !panel) return;

        const fit = () => card.style.setProperty('--h', `${panel.offsetHeight}px`);
        fit();

        const ro = new ResizeObserver(fit);
        ro.observe(panel);
        return () => ro.disconnect();
    }, [activeIdx]);

    /* ---------- Escape / outside click ---------- */

    useEffect(() => {
        if (!open && !drawer && !relatedOpen) return;

        const onKey = (e) => {
            if (e.key !== 'Escape') return;
            const wasMega = open;
            closeAll();
            if (wasMega) {
                quiet.current = true;
                listRef.current?.querySelector(`[data-key="${active}"]`)?.focus();
                setTimeout(() => (quiet.current = false), 0);
            }
        };
        const onClick = (e) => {
            if (!headerRef.current?.contains(e.target)) closeAll();
        };

        window.addEventListener('keydown', onKey);
        document.addEventListener('pointerdown', onClick);
        return () => {
            window.removeEventListener('keydown', onKey);
            document.removeEventListener('pointerdown', onClick);
        };
    }, [open, drawer, relatedOpen, active, closeAll]);

    /* ---------- Mobile drawer: scroll lock + leave on desktop width ---------- */

    useEffect(() => {
        document.documentElement.style.overflow = drawer ? 'hidden' : '';
        return () => {
            document.documentElement.style.overflow = '';
        };
    }, [drawer]);

    useEffect(() => {
        const mq = window.matchMedia('(min-width: 1201px)');
        const onChange = (e) => e.matches && setDrawer(false);
        mq.addEventListener('change', onChange);
        return () => mq.removeEventListener('change', onChange);
    }, []);

    /* ---------- Scroll: hide on way down, show on way up, progress ---------- */

    // Written straight to data-attributes / CSS variables, so scrolling
    // never triggers a React re-render.
    useEffect(() => {
        const el = headerRef.current;
        if (!el) return;

        let lastY = window.scrollY;
        let ticking = false;

        const update = () => {
            const y = window.scrollY;

            const max = document.documentElement.scrollHeight - window.innerHeight;
            const p = max > 0 ? Math.min(1, Math.max(0, y / max)) : 0;
            el.style.setProperty('--p', p.toFixed(4));

            const scrolled = y > 12 ? 'true' : 'false';
            if (el.dataset.scrolled !== scrolled) el.dataset.scrolled = scrolled;

            if (Math.abs(y - lastY) > 6) {
                const hide = y > lastY && y > 120;
                const value = hide ? 'true' : 'false';
                if (el.dataset.hidden !== value) el.dataset.hidden = value;
                lastY = y;
            }

            // Always show it at the very top of the page
            if (y <= 0 && el.dataset.hidden !== 'false') el.dataset.hidden = 'false';

            ticking = false;
        };

        const onScroll = () => {
            if (ticking) return;
            ticking = true;
            requestAnimationFrame(update);
        };

        update();
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll);
        return () => {
            window.removeEventListener('scroll', onScroll);
            window.removeEventListener('resize', onScroll);
        };
    }, []);

    /* ---------- Pointer effects ---------- */

    // Soft blue light that follows the cursor across a menu card
    const spot = (e) => {
        const el = e.currentTarget;
        const r = el.getBoundingClientRect();
        el.style.setProperty('--mx', `${e.clientX - r.left}px`);
        el.style.setProperty('--my', `${e.clientY - r.top}px`);
    };

    // The button leans gently toward the cursor (mouse only)
    const magnet = (e) => {
        if (e.pointerType !== 'mouse') return;
        const el = e.currentTarget;
        const r = el.getBoundingClientRect();
        el.style.setProperty('--tx', `${(e.clientX - (r.left + r.width / 2)) * 0.16}px`);
        el.style.setProperty('--ty', `${(e.clientY - (r.top + r.height / 2)) * 0.28}px`);
    };
    const unmagnet = (e) => {
        e.currentTarget.style.setProperty('--tx', '0px');
        e.currentTarget.style.setProperty('--ty', '0px');
    };

    /* ---------- Keyboard: ArrowDown moves from a tab into its menu ---------- */

    const onTabKey = (e, n) => {
        if (e.key !== 'ArrowDown' || !n.entries) return;
        e.preventDefault();
        openMenu(n.key, true);
        const idx = MEGAS.findIndex((m) => m.key === n.key);
        setTimeout(() => {
            panelRefs.current[idx]?.querySelector('.cx-item-main')?.focus();
        }, 40);
    };

    /* ------------------------------------------------------------------ */

    return (
        <NavCtx.Provider value={ctx}>
            <header
                id="coe-nav"
                ref={headerRef}
                data-mega={open}
                data-drawer={drawer}
                data-partners={relatedOpen}
                onMouseEnter={() => clearTimeout(timers.current.close)}
                onMouseLeave={() => closeMenu(180)}
                onBlur={(e) => {
                    if (!e.currentTarget.contains(e.relatedTarget)) closeMenu(0);
                }}
            >
                <nav className="cx-bar" aria-label="COE-UAS main navigation">
                    {/* Left: logo with related-programmes dropdown */}
                    <div
                        className={`cx-brand-wrap ${relatedOpen ? 'is-open' : ''}`}
                        onMouseEnter={() => {
                            setRelatedOpen(true);
                            closeMenu(0);
                        }}
                        onMouseLeave={() => setRelatedOpen(false)}
                    >
                        <NavLink to={top(HOME)} className="cx-brand">
                            <img src={coeuas} className="cx-logo" alt="COE-UAS home" />
                        </NavLink>

                        <button
                            type="button"
                            className="cx-caret"
                            aria-label="Related programmes"
                            aria-expanded={relatedOpen}
                            aria-controls="cx-related"
                            onClick={() => setRelatedOpen((o) => !o)}
                        >
                            <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
                                <path
                                    d="M2 4.5 6 8.5 10 4.5"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.8"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </button>

                        <div id="cx-related" className="cx-dropdown">
                            <div className="cx-dropdown-inner">
                                <p className="cx-dropdown-title" style={{ '--i': 0 }}>
                                    <i aria-hidden="true" />
                                    Related programmes
                                </p>
                                {RELATED.map((p, i) => {
                                    const Tag = p.internal ? Link : 'a';
                                    const extra = p.internal
                                        ? {}
                                        : { target: '_blank', rel: 'noopener noreferrer' };
                                    return (
                                        <Tag
                                            key={p.name}
                                            href={p.href}
                                            className="cx-partner"
                                            style={{ '--i': i + 1 }}
                                            {...extra}
                                        >
                                            <span className="cx-partner-logo">
                                                <img src={LOGOS[p.logo]} alt="" />
                                            </span>
                                            <span className="cx-partner-text">
                                                <strong>{p.name}</strong>
                                                <small>Visit website</small>
                                            </span>
                                            <span className="cx-partner-arrow" aria-hidden="true">↗</span>
                                            {!p.internal && <span className="cx-sr"> (opens another website)</span>}
                                        </Tag>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Center: tabs with a sliding blue highlight */}
                    <ul
                        ref={listRef}
                        className="cx-pill"
                        onMouseLeave={() => {
                            if (!openRef.current) {
                                clearTimeout(timers.current.open);
                                placeActive();
                            }
                        }}
                    >
                        <span ref={indicatorRef} className="cx-indicator" aria-hidden="true" />
                        {NAV.map((n, i) => (
                            <li key={n.key} style={{ '--i': i + 1 }}>
                                <NavLink
                                    to={top(n.href)}
                                    data-key={n.key}
                                    className={isActive(n.href) ? 'is-active' : ''}
                                    aria-current={isActive(n.href) ? 'page' : undefined}
                                    aria-expanded={n.entries ? open && active === n.key : undefined}
                                    aria-controls={n.entries ? `cx-panel-${n.key}` : undefined}
                                    onMouseEnter={(e) => {
                                        place(e.currentTarget);
                                        n.entries ? openMenu(n.key) : closeMenu(120);
                                    }}
                                    onFocus={(e) => {
                                        place(e.currentTarget);
                                        if (quiet.current) return;
                                        n.entries ? openMenu(n.key, true) : closeMenu(0);
                                    }}
                                    onKeyDown={(e) => onTabKey(e, n)}
                                >
                                    <Roll>{n.label}</Roll>
                                </NavLink>
                            </li>
                        ))}
                    </ul>

                    {/* Mega menu: one shared card that morphs between panels */}
                    <div className="cx-mega">
                        <div className="cx-mega-card" ref={cardRef}>
                            {MEGAS.map((n, mi) => {
                                const state =
                                    mi === activeIdx ? 'current' : mi < activeIdx ? 'before' : 'after';
                                const navIdx = NAV.indexOf(n);

                                return (
                                    <div
                                        key={n.key}
                                        id={`cx-panel-${n.key}`}
                                        ref={(el) => (panelRefs.current[mi] = el)}
                                        className="cx-panel"
                                        data-state={state}
                                        role="region"
                                        aria-label={`${n.fullLabel || n.label} menu`}
                                    >
                                        {/* Blue intro scene */}
                                        <div className="cx-intro">
                                            <div className="cx-intro-top">
                                                <p className="cx-eyebrow">
                                                    <i aria-hidden="true" />
                                                    {n.eyebrow}
                                                    <em>
                                                        {pad(navIdx)}
                                                        <s>/{TOTAL}</s>
                                                    </em>
                                                </p>
                                                <h3>{n.title}</h3>
                                                <p className="cx-blurb">{n.description}</p>
                                            </div>
                                            <NavLink to={top(n.href)} className="cx-intro-link">
                                                <span className="cx-intro-arrow"><Arrow /></span>
                                                <Roll>Go to {n.label}</Roll>
                                            </NavLink>
                                        </div>

                                        {/* Dark list of sections */}
                                        <div className="cx-list">
                                            {n.entries.map((it, ii) => (
                                                <div
                                                    key={it.title}
                                                    className={`cx-item ${it.description || it.chips.length ? '' : 'is-compact'}`}
                                                    style={{ '--i': ii }}
                                                    onPointerMove={spot}
                                                >
                                                    <span className="cx-item-idx" aria-hidden="true">{pad(ii)}</span>
                                                    <div className="cx-item-body">
                                                        <NavLink to={it} className="cx-item-main">
                                                            <strong>{it.title}</strong>
                                                            {it.description && <small>{it.description}</small>}
                                                        </NavLink>
                                                        {it.chips.length > 0 && (
                                                            <ul className="cx-chips">
                                                                {it.chips.map((c) => (
                                                                    <li key={c.label}>
                                                                        <NavLink to={c}>{c.label}</NavLink>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        )}
                                                    </div>
                                                    <span className="cx-item-arrow" aria-hidden="true"><Arrow size={13} /></span>
                                                </div>
                                            ))}
                                        </div>

                                        {n.foot && (
                                            <div className="cx-foot">
                                                <p className="cx-eyebrow">
                                                    <i aria-hidden="true" />
                                                    {n.foot.label}
                                                </p>
                                                <ol>
                                                    {n.foot.steps.map((s, si) => (
                                                        <li key={s} style={{ '--s': si }}>
                                                            <b>{si + 1}</b>
                                                            <span>{s}</span>
                                                        </li>
                                                    ))}
                                                </ol>
                                                <NavLink to={n.foot.to} className="cx-foot-link">
                                                    <Roll>{n.foot.cta}</Roll>
                                                    <span className="cx-foot-chip"><Arrow size={12} /></span>
                                                </NavLink>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Right: Collaborate quick link, Contact button, burger */}
                    <div className="cx-actions" style={{ '--i': 9 }}>
                        <NavLink
                            to={top(COLLABORATE_LINK.href)}
                            className={`cx-faq ${isActive(COLLABORATE_LINK.href) ? 'is-active' : ''}`}
                            aria-current={isActive(COLLABORATE_LINK.href) ? 'page' : undefined}
                            onMouseEnter={() => closeMenu(0)}
                        >
                            <i aria-hidden="true"><Link2 /></i>
                            <Roll>{COLLABORATE_LINK.label}</Roll>
                        </NavLink>

                        <NavLink
                            to={top(CONTACT_LINK.href)}
                            className="cx-cta"
                            aria-current={isActive(CONTACT_LINK.href) ? 'page' : undefined}
                            onMouseEnter={() => closeMenu(0)}
                            onPointerMove={magnet}
                            onPointerLeave={unmagnet}
                        >
                            <span className="cx-cta-arrow" aria-hidden="true"><Arrow /></span>
                            <Roll>{CONTACT_LINK.label}</Roll>
                        </NavLink>

                        <button
                            type="button"
                            className="cx-burger"
                            aria-label={drawer ? 'Close menu' : 'Open menu'}
                            aria-expanded={drawer}
                            aria-controls="cx-drawer"
                            onClick={() => setDrawer((d) => !d)}
                        >
                            <span />
                            <span />
                        </button>
                    </div>
                </nav>

                {/* Scroll progress */}
                <span className="cx-progress" aria-hidden="true" />

                {/* Mobile drawer */}
                <div id="cx-drawer" className="cx-drawer" aria-hidden={!drawer}>
                    <ul className="cx-m-list">
                        {DRAWER.map((n, i) => (
                            <li
                                key={n.key}
                                className={`cx-m-item ${expanded === n.key ? 'is-expanded' : ''}`}
                                style={{ '--i': i }}
                            >
                                <div className="cx-m-row">
                                    <NavLink
                                        to={top(n.href)}
                                        aria-current={isActive(n.href) ? 'page' : undefined}
                                    >
                                        <span className="cx-m-idx">{pad(i)}</span>
                                        {n.label}
                                    </NavLink>
                                    {n.entries && (
                                        <button
                                            type="button"
                                            aria-label={`${n.label} pages`}
                                            aria-expanded={expanded === n.key}
                                            onClick={() => setExpanded((k) => (k === n.key ? null : n.key))}
                                        >
                                            <span aria-hidden="true" />
                                        </button>
                                    )}
                                </div>
                                {n.entries && (
                                    <div className="cx-m-sub">
                                        <ul>
                                            {n.entries.map((it) => (
                                                <li key={it.title}>
                                                    <NavLink to={it}>{it.title}</NavLink>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>

                    <div className="cx-m-foot" style={{ '--i': DRAWER.length }}>
                        <NavLink to={top(COLLABORATE_LINK.href)} className="cx-m-faq">
                            <i aria-hidden="true"><Link2 /></i> Collaborate with us
                        </NavLink>
                        <NavLink to={top(CONTACT_LINK.href)} className="cx-m-cta">
                            {CONTACT_LINK.label}
                            <span className="cx-m-cta-chip" aria-hidden="true"><Arrow /></span>
                        </NavLink>
                        <div className="cx-m-partners">
                            {RELATED.map((p) => {
                                const Tag = p.internal ? Link : 'a';
                                const extra = p.internal ? {} : { target: '_blank', rel: 'noopener noreferrer' };
                                return (
                                    <Tag key={p.name} href={p.href} {...extra}>
                                        <img src={LOGOS[p.logo]} alt="" />
                                        <span className="cx-sr">
                                            {p.name}{p.internal ? '' : ' (opens another website)'}
                                        </span>
                                    </Tag>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </header>

            {/* Dims and blurs the page behind an open mega menu */}
            <div className="cx-scrim" data-open={open} aria-hidden="true" />

            {children}
        </NavCtx.Provider>
    );
}

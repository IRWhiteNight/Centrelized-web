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
import '../../../css/PSB-css/psb-navbar4.css';
import sandbox from '../../images/PSB.png';
import vertiport from '../../images/vertiport.png';
import uas from '../../images/uas.png';

/* ------------------------------------------------------------------ */
/*  Navigation data                                                    */
/*                                                                     */
/*  Every menu item is a "target": the page it lives on (`base`) plus  */
/*  the id of the section on that page (`id`).                         */
/*  The ids below are the ids really used by each page component:      */
/*    Opportunities : ways, areas, programmes, how, benefits           */
/*    Site info     : location, facilities, airspace, weather,         */
/*                    guidelines                                       */
/*    Media         : news, press, events, gallery, articles           */
/*    Contact       : reach, people, enquiry, visit                    */
/*    About         : overview, why-perlis, governance, roadmap,       */
/*                    partners   (must match ids in aboutData.js)      */
/*    Services      : ids from servicesData.js; if an id is not found  */
/*                    the Nth ".sx-svc" section is used instead        */
/* ------------------------------------------------------------------ */

// Scroll position left above a section when jumping to it (px)
const SCROLL_OFFSET = 72;

const target = (base, id, extra) => ({ base, id, href: id ? `${base}#${id}` : base, ...extra });

// Menu entry: a page section, optionally with description and chip links
const sub = (base, id, t, d, chips, extra) => ({
    t,
    d,
    ...target(base, id, extra),
    children: chips?.map((c) => ({ t: c, ...target(base, id, extra) })),
});

const NAV = [
    { key: 'home', label: 'Home', href: '/' },
    {
        key: 'about',
        label: 'About',
        href: '/about',
        mega: {
            eyebrow: 'About the sandbox',
            title: 'A national testbed for the next era of flight.',
            blurb: 'What the sandbox is, why Perlis, and how it is run.',
            items: [
                sub('/about', 'overview', 'Overview', 'Definition, purpose, vision and objectives'),
                sub('/about', 'why-perlis', 'Why Perlis, Malaysia?', 'Location advantages and strategic value'),
                sub('/about', 'governance', 'Governance & Management', 'Public governance structure and responsibilities'),
                sub('/about', 'roadmap', 'Development Roadmap', 'Project phases, milestones and current stage'),
                sub('/about', 'partners', 'Partners & Collaborators', 'Supporting agencies, industry partners and research collaborators'),
            ],
        },
    },
    {
        key: 'opportunities',
        label: 'Opportunities',
        href: '/opportunities',
        mega: {
            eyebrow: 'Opportunities',
            title: 'Find where your team can fly, test and innovate.',
            blurb: 'Ways to take part, the areas open for testing, and what you gain.',
            items: [
                sub('/opportunities', 'ways', 'Ways to Participate', null, [
                    'Government-led trials',
                    'Industry testing and demonstrations',
                    'Research and innovation',
                ]),
                sub('/opportunities', 'areas', 'Testing & Innovation Areas', null, [
                    'First Responder Operations',
                    'Advanced Air Mobility Operations',
                    'Cargo Logistics Operations',
                    'Supporting technology and system integration',
                ]),
                sub('/opportunities', 'programmes', 'Open Programmes & Calls', 'Participation openings, schedules and briefs'),
                sub('/opportunities', 'benefits', 'Participant Benefits', 'Ecosystem access, collaboration, research opportunities and support'),
            ],
            foot: {
                label: 'How to participate',
                to: target('/opportunities', 'how'),
                steps: ['Express interest', 'Define activity', 'Review and approval', 'Execute'],
            },
        },
    },
    {
        key: 'services',
        label: 'Services',
        href: '/services',
        mega: {
            eyebrow: 'Services',
            title: 'Support from first application to final demonstration.',
            blurb: 'Ten services that carry an operation through the sandbox.',
            items: [
                ['application-regulatory', 'Application & Regulatory Facilitation'],
                ['test-planning', 'Test Planning & Operational Support'],
                ['infrastructure-site', 'Infrastructure & Site Support'],
                ['system-integration', 'System Integration Support'],
                ['safety-risk', 'Safety & Risk Management Support'],
                ['testing-execution', 'Testing Execution & Monitoring'],
                ['data-reporting', 'Data Collection & Reporting Support'],
                ['partner-matching', 'Industry Collaboration & Partner Matching'],
                ['training', 'Training & Capability Development'],
                ['demonstration', 'Demonstration & Showcase Support'],
            ].map(([id, t], i) => sub('/services', id, t, null, null, { sel: '.sx-svc', n: i })),
        },
    },
    {
        key: 'site',
        label: 'Site Information',
        href: '/siteinfo',
        mega: {
            eyebrow: 'Site information',
            title: 'Everything you need to plan an operation on site.',
            blurb: 'Where it is, what is there, and the rules of the airspace.',
            items: [
                sub('/siteinfo', 'location', 'Location & Access', 'Map, address, coordinates and accessibility'),
                sub('/siteinfo', 'facilities', 'Facilities & Infrastructure', 'Test areas, landing areas, hangars and ground support'),
                sub('/siteinfo', 'airspace', 'Airspace & Operational Information', 'Operating areas, hours and general restrictions'),
                sub('/siteinfo', 'weather', 'Weather Information', 'Weather summary and official information links'),
                sub('/siteinfo', 'guidelines', 'Guidelines & Downloads', 'Safety guidance, participation documents and public charts'),
            ],
        },
    },
    {
        key: 'media',
        label: 'Media Centre',
        href: '/media',
        mega: {
            eyebrow: 'Media centre',
            title: 'News, events and stories from the sandbox.',
            blurb: 'Follow project progress as it happens.',
            items: [
                sub('/media', 'news', 'News & Project Updates'),
                sub('/media', 'press', 'Press Releases'),
                sub('/media', 'events', 'Events & Activities'),
                sub('/media', 'gallery', 'Photo & Video Gallery'),
                sub('/media', 'articles', 'Articles & Social Media'),
            ],
        },
    },
    {
        key: 'contact',
        label: 'Contact Us',
        href: '/contact',
        mega: {
            eyebrow: 'Contact us',
            title: 'Talk to the sandbox team.',
            blurb: 'Questions, partnerships or programme enquiries.',
            items: [
                sub('/contact', 'enquiry', 'General enquiry form'),
                sub('/contact', 'people', 'Programme contact persons'),
                sub('/contact', 'reach', 'Official email and telephone'),
                sub('/contact', 'visit', 'Office address and operating hours'),
            ],
        },
    },
];

const MEGAS = NAV.filter((n) => n.mega);
const FAQ = { label: 'FAQ', href: '/FAQ' };
const APPLY = { href: '/apply' };

// A plain page link (no section)
const top = (href) => target(href, null);

// Lookup "page#id" -> target, so a hash in the URL can use the fallbacks
const TARGETS = new Map();
NAV.forEach((n) => {
    n.mega?.items.forEach((it) => {
        TARGETS.set(`${it.base.toLowerCase()}#${it.id}`, it);
        it.children?.forEach((c) => TARGETS.set(`${c.base.toLowerCase()}#${c.id}`, c));
    });
    if (n.mega?.foot) TARGETS.set(`${n.mega.foot.to.base.toLowerCase()}#${n.mega.foot.to.id}`, n.mega.foot.to);
});

const partners = [
    {
        name: 'Unmanned Aerial System',
        logo: uas,
        href: '/coeuas/home', // TODO: real URL
    },
    {
        name: 'Vertiport Malaysia',
        logo: vertiport,
        href: 'https://example.com/vertiport', // TODO: real URL
    },
];

/* ------------------------------------------------------------------ */
/*  Scrolling to a section                                             */
/* ------------------------------------------------------------------ */

const reduced = () =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Find the section element: exact id, then the Nth fallback, then a partial id match
const resolveEl = (t) =>
    document.getElementById(t.id) ||
    (t.sel ? document.querySelectorAll(t.sel)[t.n] : null) ||
    document.querySelector(`[id*="${t.id}"]`);

const topOf = (el) => el.getBoundingClientRect().top + window.scrollY - SCROLL_OFFSET;

/**
 * Scrolls to a target. If the page is still rendering, it keeps looking
 * for the section for up to 3 seconds. Returns a cancel function.
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
            else if (import.meta.env?.DEV) console.warn(`[Navbar4] No section found for "${t.href}"`);
            return;
        }

        window.scrollTo({ top: Math.max(0, topOf(el)), behavior });

        // Images and pinned scenes can still shift the layout: check once more
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
function Roll({ children, className = '' }) {
    return (
        <span className={`roll ${className}`}>
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

const pad = (n) => String(n + 1).padStart(2, '0');
const TOTAL = String(NAV.length).padStart(2, '0');

/* ------------------------------------------------------------------ */
/*  Navbar                                                             */
/* ------------------------------------------------------------------ */

export default function Navbar4() {
    const { url } = usePage();
    const path = url.split(/[?#]/)[0];

    const [partnersOpen, setPartnersOpen] = useState(false); // logo dropdown
    const [open, setOpen] = useState(false);                 // desktop mega menu
    const [active, setActive] = useState(MEGAS[0].key);      // which mega panel
    const [drawer, setDrawer] = useState(false);             // mobile menu
    const [expanded, setExpanded] = useState(null);          // mobile accordion

    const wrapRef = useRef(null);
    const listRef = useRef(null);
    const indicatorRef = useRef(null);
    const headerRef = useRef(null);
    const cardRef = useRef(null);
    const panelRefs = useRef([]);
    const timers = useRef({});
    const openRef = useRef(false);
    const quiet = useRef(false);      // true while focus is moved by code, not the user
    const cancelScroll = useRef(null); // cancels a scroll that is still looking for its section

    openRef.current = open;

    const isActive = (href) => {
        const p = cleanPath(path);
        const h = cleanPath(href);
        return h === '/' ? p === '/' : p === h || p.startsWith(`${h}/`);
    };

    const activeIdx = MEGAS.findIndex((m) => m.key === active);

    /* ---------- Sliding yellow highlight ---------- */

    // Written straight to CSS variables / classes, so hovering never re-renders React.
    // The tab under the highlight gets `is-lit` (dark text on the yellow pill).
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
        const raf = requestAnimationFrame(() =>
            listRef.current?.classList.add('is-ready')
        );
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
        if (!open) return placeActive();
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
        setPartnersOpen(false);
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

        const known = TARGETS.get(`${cleanPath(window.location.pathname)}#${hash}`);
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
        if (!open && !drawer && !partnersOpen) return;

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
    }, [open, drawer, partnersOpen, active, closeAll]);

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
            if (y <= 0 && el.dataset.hidden !== 'false') {
                el.dataset.hidden = 'false';
            }

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

    // Soft yellow light that follows the cursor across a menu card
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
        if (e.key !== 'ArrowDown' || !n.mega) return;
        e.preventDefault();
        openMenu(n.key, true);
        const idx = MEGAS.findIndex((m) => m.key === n.key);
        setTimeout(() => {
            panelRefs.current[idx]?.querySelector('.nav4-item-main')?.focus();
        }, 40);
    };

    /* ------------------------------------------------------------------ */

    return (
        <NavCtx.Provider value={ctx}>
            <header
                id="navbar4"
                ref={headerRef}
                data-mega={open}
                data-drawer={drawer}
                data-partners={partnersOpen}
                onMouseEnter={() => clearTimeout(timers.current.close)}
                onMouseLeave={() => closeMenu(180)}
                onBlur={(e) => {
                    if (!e.currentTarget.contains(e.relatedTarget)) closeMenu(0);
                }}
            >
                <nav className="nav-data" aria-label="Main navigation">
                    {/* Left: logo with partner dropdown */}
                    <div
                        ref={wrapRef}
                        className={`nav4-brand-wrap ${partnersOpen ? 'is-open' : ''}`}
                        onMouseEnter={() => {
                            setPartnersOpen(true);
                            closeMenu(0);
                        }}
                        onMouseLeave={() => setPartnersOpen(false)}
                    >
                        <NavLink to={top('/')} className="nav4-brand">
                            <img src={sandbox} className="img-logo" alt="Perlis Airspace Sandbox" />
                        </NavLink>

                        <button
                            type="button"
                            className="nav4-caret"
                            aria-label="Partner websites"
                            aria-expanded={partnersOpen}
                            aria-controls="nav4-partners"
                            onClick={() => setPartnersOpen((o) => !o)}
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

                        <div id="nav4-partners" className="nav4-dropdown">
                            <div className="nav4-dropdown-inner">
                                <p className="nav4-dropdown-title" style={{ '--i': 0 }}>
                                    <i aria-hidden="true" />
                                    Our partners
                                </p>
                                {partners.map((p, i) => (
                                    <a
                                        key={p.name}
                                        href={p.href}
                                        className="nav4-partner"
                                        style={{ '--i': i + 1 }}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        <span className="nav4-partner-logo">
                                            <img src={p.logo} alt="" />
                                        </span>
                                        <span className="nav4-partner-text">
                                            <strong>{p.name}</strong>
                                            <small>Visit website</small>
                                        </span>
                                        <span className="nav4-partner-arrow" aria-hidden="true">↗</span>
                                        <span className="sr-only"> (opens another website)</span>
                                    </a>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Center: tabs with a sliding yellow highlight */}
                    <ul
                        ref={listRef}
                        className="nav4-pill"
                        onMouseLeave={() => {
                            if (!openRef.current) {
                                clearTimeout(timers.current.open);
                                placeActive();
                            }
                        }}
                    >
                        <span ref={indicatorRef} className="nav4-indicator" aria-hidden="true" />
                        {NAV.map((n, i) => (
                            <li key={n.key} style={{ '--i': i + 1 }}>
                                <NavLink
                                    to={top(n.href)}
                                    data-key={n.key}
                                    className={isActive(n.href) ? 'is-active' : ''}
                                    aria-current={isActive(n.href) ? 'page' : undefined}
                                    aria-expanded={n.mega ? open && active === n.key : undefined}
                                    aria-controls={n.mega ? `nav4-panel-${n.key}` : undefined}
                                    onMouseEnter={(e) => {
                                        place(e.currentTarget);
                                        n.mega ? openMenu(n.key) : closeMenu(120);
                                    }}
                                    onFocus={(e) => {
                                        place(e.currentTarget);
                                        if (quiet.current) return;
                                        n.mega ? openMenu(n.key, true) : closeMenu(0);
                                    }}
                                    onKeyDown={(e) => onTabKey(e, n)}
                                >
                                    <Roll>{n.label}</Roll>
                                </NavLink>
                            </li>
                        ))}
                    </ul>

                    {/* Mega menu: one shared card that morphs between panels */}
                    <div className="nav4-mega">
                        <div className="nav4-mega-card" ref={cardRef}>
                            {MEGAS.map((n, mi) => {
                                const m = n.mega;
                                const state =
                                    mi === activeIdx ? 'current' : mi < activeIdx ? 'before' : 'after';
                                const navIdx = NAV.indexOf(n);

                                return (
                                    <div
                                        key={n.key}
                                        id={`nav4-panel-${n.key}`}
                                        ref={(el) => (panelRefs.current[mi] = el)}
                                        className="nav4-panel"
                                        data-state={state}
                                        role="region"
                                        aria-label={`${n.label} menu`}
                                    >
                                        {/* Yellow intro scene */}
                                        <div className="nav4-intro">
                                            <div className="nav4-intro-top">
                                                <p className="nav4-eyebrow">
                                                    <i aria-hidden="true" />
                                                    {m.eyebrow}
                                                    <em>
                                                        {pad(navIdx)}
                                                        <s>/{TOTAL}</s>
                                                    </em>
                                                </p>
                                                <h3>{m.title}</h3>
                                                <p className="nav4-blurb">{m.blurb}</p>
                                            </div>
                                            <NavLink to={top(n.href)} className="nav4-intro-link">
                                                <span className="nav4-intro-arrow"><Arrow /></span>
                                                <Roll>Go to {n.label}</Roll>
                                            </NavLink>
                                        </div>

                                        {/* Dark list of pages */}
                                        <div className="nav4-list">
                                            {m.items.map((it, ii) => (
                                                <div
                                                    key={it.t}
                                                    className={`nav4-item ${it.d || it.children ? '' : 'is-compact'}`}
                                                    style={{ '--i': ii }}
                                                    onPointerMove={spot}
                                                >
                                                    <span className="nav4-item-idx" aria-hidden="true">{pad(ii)}</span>
                                                    <div className="nav4-item-body">
                                                        <NavLink to={it} className="nav4-item-main">
                                                            <strong>{it.t}</strong>
                                                            {it.d && <small>{it.d}</small>}
                                                        </NavLink>
                                                        {it.children && (
                                                            <ul className="nav4-chips">
                                                                {it.children.map((c) => (
                                                                    <li key={c.t}>
                                                                        <NavLink to={c}>{c.t}</NavLink>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        )}
                                                    </div>
                                                    <span className="nav4-item-arrow" aria-hidden="true"><Arrow size={13} /></span>
                                                </div>
                                            ))}
                                        </div>

                                        {m.foot && (
                                            <div className="nav4-foot">
                                                <p className="nav4-eyebrow">
                                                    <i aria-hidden="true" />
                                                    {m.foot.label}
                                                </p>
                                                <ol>
                                                    {m.foot.steps.map((s, si) => (
                                                        <li key={s} style={{ '--s': si }}>
                                                            <b>{si + 1}</b>
                                                            <span>{s}</span>
                                                        </li>
                                                    ))}
                                                </ol>
                                                <NavLink to={m.foot.to} className="nav4-foot-link">
                                                    <Roll>See the process</Roll>
                                                    <span className="nav4-foot-chip"><Arrow size={12} /></span>
                                                </NavLink>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Right: FAQ quick link, call to action, burger */}
                    <div className="nav4-actions" style={{ '--i': 8 }}>
                        <NavLink
                            to={top(FAQ.href)}
                            className={`nav4-faq ${isActive(FAQ.href) ? 'is-active' : ''}`}
                            aria-current={isActive(FAQ.href) ? 'page' : undefined}
                            onMouseEnter={() => closeMenu(0)}
                        >
                            <i aria-hidden="true">?</i>
                            <Roll>{FAQ.label}</Roll>
                        </NavLink>

                        <NavLink
                            to={top(APPLY.href)}
                            className="nav4-cta"
                            onMouseEnter={() => closeMenu(0)}
                            onPointerMove={magnet}
                            onPointerLeave={unmagnet}
                        >
                            <span className="nav4-cta-arrow" aria-hidden="true"><Arrow /></span>
                            <Roll className="cta-long">Apply to Participate</Roll>
                            <Roll className="cta-short">Apply</Roll>
                        </NavLink>

                        <button
                            type="button"
                            className="nav4-burger"
                            aria-label={drawer ? 'Close menu' : 'Open menu'}
                            aria-expanded={drawer}
                            aria-controls="nav4-drawer"
                            onClick={() => setDrawer((d) => !d)}
                        >
                            <span />
                            <span />
                        </button>
                    </div>
                </nav>

                {/* Scroll progress (signal yellow, same as the Home page bar) */}
                <span className="nav4-progress" aria-hidden="true" />

                {/* Mobile drawer */}
                <div id="nav4-drawer" className="nav4-drawer" aria-hidden={!drawer}>
                    <ul className="nav4-m-list">
                        {NAV.map((n, i) => (
                            <li
                                key={n.key}
                                className={`nav4-m-item ${expanded === n.key ? 'is-expanded' : ''}`}
                                style={{ '--i': i }}
                            >
                                <div className="nav4-m-row">
                                    <NavLink
                                        to={top(n.href)}
                                        aria-current={isActive(n.href) ? 'page' : undefined}
                                    >
                                        <span className="nav4-m-idx">{pad(i)}</span>
                                        {n.label}
                                    </NavLink>
                                    {n.mega && (
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
                                {n.mega && (
                                    <div className="nav4-m-sub">
                                        <ul>
                                            {n.mega.items.map((it) => (
                                                <li key={it.t}>
                                                    <NavLink to={it}>{it.t}</NavLink>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>

                    <div className="nav4-m-foot" style={{ '--i': NAV.length }}>
                        <NavLink to={top(FAQ.href)} className="nav4-m-faq">
                            <i aria-hidden="true">?</i> Frequently asked questions
                        </NavLink>
                        <NavLink to={top(APPLY.href)} className="nav4-m-cta">
                            Apply to Participate
                            <span className="nav4-m-cta-chip" aria-hidden="true"><Arrow /></span>
                        </NavLink>
                        <div className="nav4-m-partners">
                            {partners.map((p) => (
                                <a key={p.name} href={p.href} target="_blank" rel="noopener noreferrer">
                                    <img src={p.logo} alt="" />
                                    <span className="sr-only">{p.name} (opens another website)</span>
                                </a>
                            ))}
                        </div>
                    </div>
                </div>
            </header>

            {/* Dims and blurs the page behind an open mega menu */}
            <div className="nav4-scrim" data-open={open} aria-hidden="true" />
        </NavCtx.Provider>
    );
}

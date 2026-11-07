import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import '../../../css/PSB-css/psb-navbar4.css';
import sandbox from '../../images/PSB.png';
import vertiport from '../../images/vertiport.png';
import uas from '../../images/uas.png';

/* ------------------------------------------------------------------ */
/*  Site map → navigation data                                         */
/*  Everything the bar and the menus render comes from this one place. */
/* ------------------------------------------------------------------ */

const slug = (s) =>
    s
        .toLowerCase()
        .replace(/&/g, 'and')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

// Sub-page entry. Links to a section anchor on the parent page.
const sub = (base, t, d, children) => ({
    t,
    d,
    href: `${base}#${slug(t)}`,
    children: children?.map((c) => ({ t: c, href: `${base}#${slug(c)}` })),
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
                sub('/about', 'Overview', 'Definition, purpose, vision and objectives'),
                sub('/about', 'Why Perlis, Malaysia?', 'Location advantages and strategic value'),
                sub('/about', 'Governance & Management', 'Public governance structure and responsibilities'),
                sub('/about', 'Development Roadmap', 'Project phases, milestones and current stage'),
                sub('/about', 'Partners & Collaborators', 'Supporting agencies, industry partners and research collaborators'),
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
                sub('/innovation', 'Ways to Participate', null, [
                    'Government-led trials',
                    'Industry testing and demonstrations',
                    'Research and innovation',
                ]),
                sub('/innovation', 'Testing & Innovation Areas', null, [
                    'First Responder Operations',
                    'Advanced Air Mobility Operations',
                    'Cargo Logistics Operations',
                    'Supporting technology and system integration',
                ]),
                sub('/innovation', 'Open Programmes & Calls', 'Participation openings, schedules and briefs'),
                sub('/innovation', 'Participant Benefits', 'Ecosystem access, collaboration, research opportunities and support'),
            ],
            foot: {
                label: 'How to participate',
                href: '/innovation#how-to-participate',
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
                'Application & Regulatory Facilitation',
                'Test Planning & Operational Support',
                'Infrastructure & Site Support',
                'System Integration Support',
                'Safety & Risk Management Support',
                'Testing Execution & Monitoring',
                'Data Collection & Reporting Support',
                'Industry Collaboration & Partner Matching',
                'Training & Capability Development',
                'Demonstration & Showcase Support',
            ].map((t) => sub('/services', t)),
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
                sub('/siteinfo', 'Location & Access', 'Map, address, coordinates and accessibility'),
                sub('/siteinfo', 'Facilities & Infrastructure', 'Test areas, landing areas, hangars and ground support'),
                sub('/siteinfo', 'Airspace & Operational Information', 'Operating areas, hours and general restrictions'),
                sub('/siteinfo', 'Weather Information', 'Weather summary and official information links'),
                sub('/siteinfo', 'Guidelines & Downloads', 'Safety guidance, participation documents and public charts'),
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
                'News & Project Updates',
                'Press Releases',
                'Events & Activities',
                'Photo & Video Gallery',
                'Articles & Social Media',
            ].map((t) => sub('/news', t)),
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
                'General enquiry form',
                'Programme contact persons',
                'Official email and telephone',
                'Office address and operating hours',
            ].map((t) => sub('/contact', t)),
        },
    },
];

const MEGAS = NAV.filter((n) => n.mega);
const FAQ = { label: 'FAQ', href: '/FAQ' };
const APPLY = { href: '/apply' };

const partners = [
    {
        name: 'Unmanned Aerial System',
        logo: uas,
        href: 'https://example.com/uas', // TODO: real URL
    },
    {
        name: 'Vertiport Malaysia',
        logo: vertiport,
        href: 'https://example.com/vertiport', // TODO: real URL
    },
];

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

const Arrow = () => (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
        <path
            d="M3 11 11 3M5 3h6v6"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

const pad = (n) => String(n + 1).padStart(2, '0');

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
    const quiet = useRef(false); // true while focus is moved by code, not the user

    openRef.current = open;

    const isActive = (href) =>
        href === '/' ? path === '/' : path.startsWith(href);

    const activeIdx = MEGAS.findIndex((m) => m.key === active);

    /* ---------- Sliding highlight ---------- */

    // Written straight to CSS variables, so hovering never re-renders React.
    const place = useCallback((el) => {
        const ind = indicatorRef.current;
        if (!ind) return;
        if (!el) {
            ind.style.opacity = '0';
            return;
        }

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
    }, []);

    // Close everything after a navigation
    useEffect(() => {
        closeAll();
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

    // Soft light that follows the cursor across a menu card
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
        <>
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
                        <Link href="/" className="nav4-brand">
                            <img src={sandbox} className="img-logo" alt="Perlis Airspace Sandbox" />
                        </Link>

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
                                    strokeWidth="1.6"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </button>

                        <div id="nav4-partners" className="nav4-dropdown">
                            <div className="nav4-dropdown-inner">
                                <p className="nav4-dropdown-title" style={{ '--i': 0 }}>
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
                                        <img src={p.logo} alt="" />
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

                    {/* Center: tabs with a sliding highlight */}
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
                                <Link
                                    href={n.href}
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
                                </Link>
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
                                        <div className="nav4-intro">
                                            <span className="nav4-radar" aria-hidden="true" />
                                            <div className="nav4-intro-top">
                                                <p className="nav4-eyebrow">
                                                    <i aria-hidden="true" />
                                                    {pad(navIdx)} — {m.eyebrow}
                                                </p>
                                                <h3>{m.title}</h3>
                                                <p className="nav4-blurb">{m.blurb}</p>
                                            </div>
                                            <Link href={n.href} className="nav4-intro-link" onClick={closeAll}>
                                                <Roll>Go to {n.label}</Roll>
                                                <span className="nav4-intro-arrow"><Arrow /></span>
                                            </Link>
                                        </div>

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
                                                        <Link href={it.href} className="nav4-item-main" onClick={closeAll}>
                                                            <strong>{it.t}</strong>
                                                            {it.d && <small>{it.d}</small>}
                                                        </Link>
                                                        {it.children && (
                                                            <ul className="nav4-chips">
                                                                {it.children.map((c) => (
                                                                    <li key={c.t}>
                                                                        <Link href={c.href} onClick={closeAll}>
                                                                            {c.t}
                                                                        </Link>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        )}
                                                    </div>
                                                    <span className="nav4-item-arrow" aria-hidden="true"><Arrow /></span>
                                                </div>
                                            ))}
                                        </div>

                                        {m.foot && (
                                            <div className="nav4-foot">
                                                <p className="nav4-eyebrow">{m.foot.label}</p>
                                                <ol>
                                                    {m.foot.steps.map((s, si) => (
                                                        <li key={s} style={{ '--s': si }}>
                                                            <b>{si + 1}</b>
                                                            <span>{s}</span>
                                                        </li>
                                                    ))}
                                                </ol>
                                                <Link href={m.foot.href} className="nav4-foot-link" onClick={closeAll}>
                                                    <Roll>See the process</Roll>
                                                    <Arrow />
                                                </Link>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Right: FAQ quick link, call to action, burger */}
                    <div className="nav4-actions" style={{ '--i': 8 }}>
                        <Link
                            href={FAQ.href}
                            className={`nav4-faq ${isActive(FAQ.href) ? 'is-active' : ''}`}
                            aria-current={isActive(FAQ.href) ? 'page' : undefined}
                            onMouseEnter={() => closeMenu(0)}
                        >
                            <i aria-hidden="true">?</i>
                            <Roll>{FAQ.label}</Roll>
                        </Link>

                        <Link
                            href={APPLY.href}
                            className="nav4-cta"
                            onMouseEnter={() => closeMenu(0)}
                            onPointerMove={magnet}
                            onPointerLeave={unmagnet}
                        >
                            <Roll className="cta-long">Apply to Participate</Roll>
                            <Roll className="cta-short">Apply</Roll>
                            <span className="nav4-cta-arrow" aria-hidden="true">→</span>
                        </Link>

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

                {/* Scroll progress */}
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
                                    <Link
                                        href={n.href}
                                        onClick={closeAll}
                                        aria-current={isActive(n.href) ? 'page' : undefined}
                                    >
                                        <span className="nav4-m-idx">{pad(i)}</span>
                                        {n.label}
                                    </Link>
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
                                                    <Link href={it.href} onClick={closeAll}>
                                                        {it.t}
                                                    </Link>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>

                    <div className="nav4-m-foot" style={{ '--i': NAV.length }}>
                        <Link href={FAQ.href} className="nav4-m-faq" onClick={closeAll}>
                            <i aria-hidden="true">?</i> Frequently asked questions
                        </Link>
                        <Link href={APPLY.href} className="nav4-m-cta" onClick={closeAll}>
                            Apply to Participate <span aria-hidden="true">→</span>
                        </Link>
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
        </>
    );
}

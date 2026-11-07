import { useCallback, useEffect, useRef, useState } from 'react';
/* standalone stylesheet: no other css needed */
import '../../../css/PSB-css/psb-innovation.css';

import {
    links, sections, hero, heroStats, ticker, overview, facilities, framework,
    applications, roadmap, projects, testing, impact, participate,
} from '../../data/PSB-data/innovationData';

/* ---- images (add a new image: import it here, then list it below) ---- */
import renderExterior from '../../images/innovation/render-exterior.jpg';
import renderHangar from '../../images/innovation/render-hangar.jpg';
import renderEntrance from '../../images/innovation/render-entrance.jpg';
import siteAerial from '../../images/innovation/site-aerial.jpg';
import corridorDam from '../../images/innovation/corridor-dam.jpg';
import corridorLangkawi from '../../images/innovation/corridor-langkawi.jpg';

const images = {
    'render-exterior': renderExterior,
    'render-hangar': renderHangar,
    'render-entrance': renderEntrance,
    'site-aerial': siteAerial,
    'corridor-dam': corridorDam,
    'corridor-langkawi': corridorLangkawi,
};

/* ==========================================================================
   Small helpers
========================================================================== */

const D = (i) => ({ '--d': i * 90 });
const pad = (n) => String(n + 1).padStart(2, '0');
const reduced = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* adds .in to every .ix-rv once it scrolls into view */
function useReveal(rootRef) {
    useEffect(() => {
        const nodes = rootRef.current.querySelectorAll('.ix-rv');
        if (reduced() || !('IntersectionObserver' in window)) {
            nodes.forEach((n) => n.classList.add('in'));
            return undefined;
        }
        const io = new IntersectionObserver((entries) => {
            entries.forEach((e) => {
                if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
        nodes.forEach((n) => io.observe(n));
        return () => io.disconnect();
    }, [rootRef]);
}

/* number that counts up the first time it is seen */
function Counter({ value, prefix = '', suffix = '', decimals = 0, delay = 0 }) {
    const ref = useRef(null);
    const [v, setV] = useState(reduced() ? value : 0);
    useEffect(() => {
        if (reduced()) { setV(value); return undefined; }
        const el = ref.current;
        let raf = 0; let timer = 0;
        const run = () => {
            const t0 = performance.now();
            const dur = 1700;
            const tick = (t) => {
                const p = Math.min(1, (t - t0) / dur);
                setV(value * (p === 1 ? 1 : 1 - Math.pow(2, -10 * p)));
                if (p < 1) raf = requestAnimationFrame(tick); else setV(value);
            };
            raf = requestAnimationFrame(tick);
        };
        const io = new IntersectionObserver(([e]) => {
            if (e.isIntersecting) { io.disconnect(); timer = setTimeout(run, delay); }
        }, { threshold: 0.4 });
        io.observe(el);
        return () => { io.disconnect(); clearTimeout(timer); cancelAnimationFrame(raf); };
    }, [value, delay]);
    return <span ref={ref}>{prefix && <small>{prefix}</small>}{v.toFixed(decimals)}{suffix && <small>{suffix}</small>}</span>;
}

function Head({ n, label, title, lede }) {
    return (
        <header className="ix-head">
            <p className="ix-kicker ix-rv"><span>{pad(n)}</span>{label}</p>
            <h2 className="ix-h ix-rv" style={D(1)}>{title}</h2>
            {lede && <p className="ix-lede ix-rv" style={D(2)}>{lede}</p>}
        </header>
    );
}

const Arrow = () => (
    <svg className="ix-arrow" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
        <path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

/* roving arrow-key navigation for tab lists */
const arrowNav = (e, cur, len, set) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const n = (cur + (e.key === 'ArrowRight' ? 1 : -1) + len) % len;
    set(n);
    const btns = e.currentTarget.querySelectorAll('[role="tab"]');
    if (btns[n]) btns[n].focus();
};

/* ==========================================================================
   Hero map: schematic flight corridors out of the sandbox
========================================================================== */

function CorridorMap() {
    return (
        <svg className="ix-map" viewBox="0 0 640 560" role="img" aria-label={hero.mapLabel}>
            <defs>
                <radialGradient id="ixMapGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0" stopColor="#ffd60a" stopOpacity=".30" />
                    <stop offset="1" stopColor="#ffd60a" stopOpacity="0" />
                </radialGradient>
            </defs>

            {/* terrain contours */}
            <g className="ix-contours" fill="none">
                <path d="M120 60C220 20 340 40 420 90S580 150 600 250 540 420 440 470 230 520 150 450 40 300 70 190 90 80 120 60Z" />
                <path d="M160 110C240 80 330 90 400 130S520 190 540 260 490 390 410 428 250 460 190 400 100 290 120 200 130 130 160 110Z" />
                <path d="M210 160C270 140 340 150 390 180S470 230 480 280 440 360 380 385 270 400 230 355 160 270 175 220 190 175 210 160Z" />
                <path d="M30 70C60 150 90 220 70 300S30 420 60 520" className="coast" />
                <path d="M200 90c-30 30-60 60-70 110M180 120c-20 30-40 60-48 100" className="hills" />
            </g>

            <circle cx="300" cy="300" r="170" fill="url(#ixMapGlow)" />

            {/* altitude zones around the sandbox */}
            <g className="ix-zones">
                <circle cx="300" cy="300" r="46" />
                <circle cx="300" cy="300" r="82" />
                <circle cx="300" cy="300" r="118" />
            </g>

            {/* routes */}
            <path id="ixrA" className="ix-route" d="M300 300C350 255 420 222 500 198" />
            <path id="ixrA2" className="ix-route" d="M500 198C470 270 400 330 300 300" style={{ animationDelay: '2.2s, 2.2s' }} />
            <path id="ixrB" className="ix-route ix-route-b" d="M300 300C250 238 180 226 114 246C96 300 78 350 62 420" style={{ animationDelay: '2.6s, 2.6s' }} />

            {/* drones travelling the corridors */}
            <g className="ix-drone">
                <circle r="5" /><circle r="12" className="halo" />
                <animateMotion dur="7s" begin="2.6s" repeatCount="indefinite" keyPoints="0;1;0" keyTimes="0;.5;1" calcMode="linear"><mpath href="#ixrA" /></animateMotion>
            </g>
            <g className="ix-drone">
                <circle r="5" /><circle r="12" className="halo" />
                <animateMotion dur="10s" begin="3.2s" repeatCount="indefinite" keyPoints="0;1;0" keyTimes="0;.5;1" calcMode="linear"><mpath href="#ixrB" /></animateMotion>
            </g>

            {/* nodes */}
            <g className="ix-node ix-node-dam" transform="translate(500 198)">
                <circle r="6" /><text x="14" y="-10">Timah Tasoh Dam</text>
            </g>
            <g className="ix-node ix-node-kp" transform="translate(114 246)">
                <circle r="6" /><text x="-8" y="-14" textAnchor="start">Kuala Perlis</text>
            </g>
            <g className="ix-node ix-node-lgk" transform="translate(62 420)">
                <circle r="6" /><text x="14" y="5">Langkawi</text>
            </g>
            <g className="ix-node ix-node-sbp" transform="translate(300 300)">
                <circle className="ix-ping" r="10" />
                <circle className="ix-ping ix-ping2" r="10" />
                <rect x="-8" y="-8" width="16" height="16" transform="rotate(45)" />
                <text x="18" y="34">Sungai Batu Pahat</text>
                <text x="18" y="50" className="ix-note">Perlis Airspace Sandbox</text>
            </g>
        </svg>
    );
}

/* ==========================================================================
   Site plan (facilities)
========================================================================== */

function SitePlan({ items, active, onPick }) {
    const act = items.find((f) => f.id === active) || items[0];
    const at = (id) => items.find((f) => f.id === id);
    const vp = at('vertiport'); const rd = at('radar'); const cr = at('corridor');
    return (
        <svg className="ix-plan" viewBox="0 0 100 64" role="img" aria-label="Illustrative site plan of the sandbox">
            <defs>
                <pattern id="ixgrid" width="4" height="4" patternUnits="userSpaceOnUse">
                    <path d="M4 0H0V4" fill="none" stroke="currentColor" strokeWidth=".08" opacity=".35" />
                </pattern>
            </defs>
            <rect width="100" height="64" fill="url(#ixgrid)" />
            <polygon className="ix-plan-site" points="6,8 62,4 96,26 88,58 30,60 6,40" />

            {/* runway of the mock-up aerodrome */}
            <g transform="rotate(-8 50 34)">
                <rect className="ix-plan-runway" x="26" y="31.5" width="48" height="5" rx=".6" />
                <line className="ix-plan-centre" x1="28" y1="34" x2="72" y2="34" />
            </g>

            {/* test flight corridor */}
            {cr && <path className="ix-plan-corridor" d={`M60 24 C72 20 80 17 ${cr.pos.x} ${cr.pos.y}`} />}

            {vp && <circle className="ix-plan-pad" cx={vp.pos.x} cy={vp.pos.y} r="4.2" />}
            {vp && <text className="ix-plan-h" x={vp.pos.x} y={vp.pos.y + 1.6} textAnchor="middle">H</text>}
            {rd && <line className="ix-plan-sweep" x1={rd.pos.x} y1={rd.pos.y} x2={rd.pos.x} y2={rd.pos.y - 9} style={{ transformOrigin: `${rd.pos.x}px ${rd.pos.y}px` }} />}
            {rd && <circle className="ix-plan-radar" cx={rd.pos.x} cy={rd.pos.y} r="9" />}

            {items.map((f, i) => {
                const on = f.id === act.id;
                return (
                    <g
                        key={f.id}
                        className={`ix-mk ${on ? 'is-on' : ''}`}
                        transform={`translate(${f.pos.x} ${f.pos.y})`}
                        role="button"
                        tabIndex={0}
                        aria-label={f.title}
                        aria-pressed={on}
                        onClick={() => onPick(f.id)}
                        onMouseEnter={() => onPick(f.id)}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onPick(f.id); } }}
                    >
                        <circle className="ix-mk-ring" r="3.2" />
                        <circle className="ix-mk-dot" r="2.1" />
                        <text className="ix-mk-n" y=".75" textAnchor="middle">{i + 1}</text>
                    </g>
                );
            })}
        </svg>
    );
}

/* ==========================================================================
   PAGE
========================================================================== */

export default function Innovation() {
    const rootRef = useRef(null);
    const [activeSection, setActiveSection] = useState(sections[0].id);
    const [facility, setFacility] = useState(facilities.items[0].id);
    const [app, setApp] = useState(0);
    const [phase, setPhase] = useState(0);
    const [focusIdx, setFocusIdx] = useState(0);
    const [open, setOpen] = useState(() => new Set());
    const [showFab, setShowFab] = useState(false);

    useReveal(rootRef);

    /* scroll: progress bar, hero parallax, active menu item, floating button */
    useEffect(() => {
        const root = rootRef.current;
        const heroEl = root.querySelector('.ix-hero');
        let raf = 0;
        const update = () => {
            raf = 0;
            const y = window.scrollY;
            const h = root.scrollHeight - window.innerHeight;
            if (y < 1100 && heroEl) heroEl.style.setProperty('--sy', `${y}`);
            root.style.setProperty('--progress', h > 0 ? Math.min(1, Math.max(0, y / h)).toFixed(4) : 0);
            setShowFab(y > 720 && y < h - 700);
            const line = window.innerHeight * 0.35;
            let cur = sections[0].id;
            sections.forEach((s) => {
                const el = document.getElementById(s.id);
                if (el && el.getBoundingClientRect().top <= line) cur = s.id;
            });
            setActiveSection(cur);
        };
        const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
        update();
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll);
        return () => {
            cancelAnimationFrame(raf);
            window.removeEventListener('scroll', onScroll);
            window.removeEventListener('resize', onScroll);
        };
    }, []);

    /* keep the active menu item visible on small screens */
    useEffect(() => {
        const a = rootRef.current.querySelector('.ix-subnav a.is-active');
        const box = rootRef.current.querySelector('.ix-subnav-scroll');
        if (a && box) box.scrollTo({ left: a.offsetLeft - box.clientWidth / 2 + a.clientWidth / 2, behavior: 'smooth' });
    }, [activeSection]);

    const goTo = useCallback((id) => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, []);

    /* pointer effects: card spotlight, magnetic buttons, hero glow */
    const onMove = useCallback((e) => {
        const t = e.target;
        if (!t.closest) return;
        const spot = t.closest('.ix-spot');
        if (spot) {
            const r = spot.getBoundingClientRect();
            spot.style.setProperty('--mx', `${e.clientX - r.left}px`);
            spot.style.setProperty('--my', `${e.clientY - r.top}px`);
        }
        if (reduced()) return;
        const mag = t.closest('.ix-mag');
        if (mag) {
            const r = mag.getBoundingClientRect();
            mag.style.setProperty('--tx', `${((e.clientX - (r.left + r.width / 2)) * 0.22).toFixed(1)}px`);
            mag.style.setProperty('--ty', `${((e.clientY - (r.top + r.height / 2)) * 0.3).toFixed(1)}px`);
        }
        const h = t.closest('.ix-hero');
        if (h) {
            const r = h.getBoundingClientRect();
            h.style.setProperty('--hx', `${e.clientX - r.left}px`);
            h.style.setProperty('--hy', `${e.clientY - r.top}px`);
        }
    }, []);

    const onOut = useCallback((e) => {
        const t = e.target.closest && e.target.closest('.ix-mag');
        if (t && !t.contains(e.relatedTarget)) {
            t.style.removeProperty('--tx');
            t.style.removeProperty('--ty');
        }
    }, []);

    /* test plans: accordion state */
    const focus = testing.focus[focusIdx];
    const keyOf = (c, i) => `${focus.id}|${c}|${i}`;
    useEffect(() => {
        const s = new Set();
        testing.columns.forEach((c) => { if ((focus.cells[c.key] || []).length) s.add(`${focus.id}|${c.key}|0`); });
        setOpen(s);
    }, [focus]);
    const toggle = (k) => setOpen((o) => { const n = new Set(o); if (n.has(k)) n.delete(k); else n.add(k); return n; });
    const allKeys = testing.columns.flatMap((c) => (focus.cells[c.key] || []).map((_, i) => keyOf(c.key, i)));
    const allOpen = allKeys.length > 0 && allKeys.every((k) => open.has(k));

    const ph = roadmap.phases[phase];

    return (
        <div className="ix" ref={rootRef} onMouseMove={onMove} onMouseOut={onOut}>

            {/* ===================== HERO ===================== */}
            <section className="ix-hero" id="top">
                <div className="ix-curtain" aria-hidden="true"><span>Innovation</span></div>
                <div className="ix-aurora" aria-hidden="true"><i /><i /><i /></div>
                <div className="ix-grid-bg" aria-hidden="true" />
                <div className="ix-glow" aria-hidden="true" />

                <div className="ix-wrap ix-hero-in">
                    <div className="ix-hero-copy">
                        <p className="ix-eyebrow"><i />{hero.eyebrow}</p>
                        <h1 className="ix-title">
                            {hero.titleLines.map((l, i) => (
                                <span className="ix-ln" key={l}>
                                    <span className={l === hero.highlight ? 'ix-hl' : ''} style={{ '--i': i }}>{l}</span>
                                </span>
                            ))}
                        </h1>
                        <p className="ix-hero-lede">{hero.lede}</p>
                        <div className="ix-hero-cta">
                            <a className="ix-btn ix-mag" href={links.apply}>{hero.primaryButton}<Arrow /></a>
                            <button className="ix-btn ix-btn--ghost ix-mag" onClick={() => goTo('overview')}>{hero.secondaryButton}</button>
                        </div>
                    </div>

                    <figure className="ix-hero-map">
                        <CorridorMap />
                        <figcaption className="ix-map-note">{hero.mapLabel}</figcaption>
                    </figure>
                </div>

                <div className="ix-wrap">
                    <div className="ix-stats">
                        {heroStats.map((s, i) => (
                            <div className="ix-stat" key={s.label} style={{ '--i': i }}>
                                <strong><Counter value={s.value} prefix={s.prefix} suffix={s.suffix} decimals={s.decimals} delay={1700 + i * 120} /></strong>
                                <span>{s.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===================== STICKY MENU ===================== */}
            <nav className="ix-subnav" aria-label="Innovation sections">
                <div className="ix-wrap ix-subnav-scroll">
                    <ul>
                        {sections.map((s) => (
                            <li key={s.id}>
                                <a
                                    href={`#${s.id}`}
                                    className={activeSection === s.id ? 'is-active' : ''}
                                    aria-current={activeSection === s.id ? 'true' : undefined}
                                    onClick={(e) => { e.preventDefault(); goTo(s.id); }}
                                >{s.label}</a>
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="ix-progress" aria-hidden="true"><span /></div>
            </nav>

            {/* ===================== TICKER ===================== */}
            <div className="ix-ticker" aria-hidden="true">
                <div className="ix-ticker-track">
                    {[0, 1].map((k) => (
                        <ul key={k}>{ticker.map((t) => <li key={t + k}>{t}</li>)}</ul>
                    ))}
                </div>
            </div>

            {/* ===================== 01 OVERVIEW ===================== */}
            <section className="ix-sec ix-light" id="overview">
                <div className="ix-wrap">
                    <Head n={0} label="Overview" title={overview.heading} lede={overview.lede} />

                    <div className="ix-layers">
                        {overview.layers.map((l, i) => (
                            <div className={`ix-layer ix-rv ${l.highlight ? 'is-hl' : ''}`} style={D(i + 2)} key={l.label}>
                                <span className="ix-layer-note">{l.note}</span>
                                <strong>{l.label}</strong>
                                <span className="ix-layer-text">{l.text}</span>
                            </div>
                        ))}
                    </div>
                    <p className="ix-tagline ix-rv">{overview.tagline}</p>

                    <div className="ix-split">
                        <div className="ix-rv">
                            <h3 className="ix-sub">{overview.missionTitle}</h3>
                            <p className="ix-body-lg">{overview.mission}</p>
                        </div>
                        <div>
                            <h3 className="ix-sub ix-rv">{overview.objectivesTitle}</h3>
                            <ol>
                                {overview.objectives.map((o, i) => (
                                    <li className="ix-row ix-rv" style={D(i)} key={o.title}>
                                        <span className="ix-num">{pad(i)}</span>
                                        <div><h4>{o.title}</h4><p>{o.text}</p></div>
                                    </li>
                                ))}
                            </ol>
                        </div>
                    </div>

                    <div className="ix-split">
                        <div>
                            <h3 className="ix-sub ix-rv">{overview.gapsTitle}</h3>
                            <ul className="ix-gaps">
                                {overview.gaps.map((g, i) => (
                                    <li className="ix-rv" style={D(i)} key={g}><i aria-hidden="true" />{g}</li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <h3 className="ix-sub ix-rv">{overview.perlisTitle}</h3>
                            <div className="ix-grid ix-grid-3">
                                {overview.perlis.map((p, i) => (
                                    <div className="ix-tile ix-spot ix-rv" style={D(i)} key={p.title}>
                                        <h4>{p.title}</h4><p>{p.text}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ===================== 02 FACILITIES ===================== */}
            <section className="ix-sec ix-dark" id="facilities">
                <div className="ix-wrap">
                    <Head n={1} label="Facilities" title={facilities.heading} lede={facilities.lede} />

                    <div className="ix-fac">
                        <figure className="ix-plan-wrap ix-rv">
                            <SitePlan items={facilities.items} active={facility} onPick={setFacility} />
                            <figcaption>{facilities.planCaption}</figcaption>
                        </figure>
                        <ul className="ix-fac-list">
                            {facilities.items.map((f, i) => (
                                <li key={f.id} className="ix-rv" style={D(i)}>
                                    <button
                                        className={`ix-fac-item ${facility === f.id ? 'is-on' : ''}`}
                                        onClick={() => setFacility(f.id)}
                                        aria-expanded={facility === f.id}
                                    >
                                        <span className="ix-num">{pad(i)}</span>
                                        <span className="ix-fac-title">{f.title}</span>
                                        <span className="ix-fac-body"><span><p>{f.text}</p></span></span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <h3 className="ix-sub ix-features-title ix-rv">{facilities.featuresTitle}</h3>
                    <div className="ix-grid ix-grid-2">
                        {facilities.features.map((f, i) => (
                            <div className="ix-tile ix-tile--dark ix-spot ix-rv" style={D(i)} key={f.title}>
                                <h4>{f.title}</h4>
                                <ul className="ix-ticks">{f.points.map((p) => <li key={p}>{p}</li>)}</ul>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===================== 03 FRAMEWORK ===================== */}
            <section className="ix-sec ix-light" id="framework">
                <div className="ix-wrap">
                    <Head n={2} label="Development framework" title={framework.heading} lede={framework.lede} />
                    <div className="ix-pillars">
                        {framework.pillars.map((p, i) => (
                            <article className="ix-pillar ix-spot ix-rv" style={D(i % 3)} key={p.title}>
                                <span className="ix-pillar-n">{pad(i)}</span>
                                <h3>{p.title}</h3>
                                <p>{p.text}</p>
                                <i className="ix-pillar-bar" aria-hidden="true" />
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===================== 04 APPLICATIONS ===================== */}
            <section className="ix-sec ix-yellow" id="applications">
                <div className="ix-wrap">
                    <Head n={3} label="Applications" title={applications.heading} lede={applications.lede} />
                    <ul className="ix-apps">
                        {applications.items.map((a, i) => (
                            <li key={a.title} className="ix-rv" style={D(i)}>
                                <button
                                    className={`ix-app ${app === i ? 'is-on' : ''}`}
                                    onClick={() => setApp(i)}
                                    aria-expanded={app === i}
                                >
                                    <span className="ix-num">{pad(i)}</span>
                                    <span className="ix-app-title">{a.title}</span>
                                    <span className="ix-app-body">
                                        <span>
                                            <p>{a.text}</p>
                                            <b>{a.outcome}</b>
                                        </span>
                                    </span>
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            </section>

            {/* ===================== 05 ROADMAP ===================== */}
            <section className="ix-sec ix-dark" id="roadmap">
                <div className="ix-wrap">
                    <Head n={4} label="Roadmap" title={roadmap.heading} lede={roadmap.lede} />

                    <div
                        className="ix-track ix-rv"
                        role="tablist"
                        aria-label="Roadmap phases"
                        style={{ '--p': phase / (roadmap.phases.length - 1) }}
                        onKeyDown={(e) => arrowNav(e, phase, roadmap.phases.length, setPhase)}
                    >
                        <div className="ix-track-line" aria-hidden="true"><span /></div>
                        {roadmap.phases.map((p, i) => (
                            <button
                                key={p.title}
                                role="tab"
                                aria-selected={phase === i}
                                tabIndex={phase === i ? 0 : -1}
                                className={`ix-step ${phase === i ? 'is-on' : ''} ${i < phase ? 'is-done' : ''}`}
                                onClick={() => setPhase(i)}
                            >
                                <span className="ix-step-dot">{i + 1}</span>
                                <span className="ix-step-when">{p.when}</span>
                                <span className="ix-step-name">Phase {i + 1}</span>
                            </button>
                        ))}
                    </div>

                    <div className="ix-phase" key={phase} role="tabpanel">
                        <div className="ix-phase-head">
                            <p className="ix-chip">{ph.when}</p>
                            <h3>{ph.title}</h3>
                            <p className="ix-phase-sum">{ph.summary}</p>
                            {phase < roadmap.phases.length - 1 && (
                                <button className="ix-btn ix-btn--ghost ix-btn--sm" onClick={() => setPhase(phase + 1)}>Next phase<Arrow /></button>
                            )}
                        </div>
                        <div className="ix-phase-comp">
                            <h4 className="ix-sub">Key components</h4>
                            <div className="ix-grid ix-grid-2">
                                {ph.components.map((c, i) => (
                                    <div className="ix-tile ix-tile--dark ix-spot ix-pop" style={{ '--d': i * 60 }} key={c.title}>
                                        <h4>{c.title}</h4>
                                        <ul className="ix-ticks">{c.points.map((p) => <li key={p}>{p}</li>)}</ul>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="ix-phase-out">
                            <h4 className="ix-sub">Expected outcomes</h4>
                            <ul className="ix-outs">
                                {ph.outcomes.map((o, i) => <li className="ix-pop" style={{ '--d': 200 + i * 60 }} key={o}>{o}</li>)}
                            </ul>
                        </div>
                    </div>

                    <div className="ix-enablers ix-rv">
                        <span className="ix-sub">{roadmap.enablersTitle}</span>
                        <div className="ix-chips">{roadmap.enablers.map((e) => <span key={e}>{e}</span>)}</div>
                    </div>

                    <div className="ix-vision">
                        <h3 className="ix-sub ix-rv">{roadmap.visionTitle}</h3>
                        <div className="ix-stack">
                            {roadmap.vision.map((v, i) => (
                                <div className="ix-layer-bar ix-rv" style={{ '--d': (roadmap.vision.length - i) * 110, '--w': 46 + i * 18 }} key={v.title}>
                                    <strong>{v.title}</strong><span>{v.text}</span>
                                </div>
                            ))}
                        </div>
                        <p className="ix-caption ix-rv">{roadmap.visionCaption}</p>
                    </div>
                </div>
            </section>

            {/* ===================== 06 PROJECTS ===================== */}
            <section className="ix-sec ix-light" id="projects">
                <div className="ix-wrap">
                    <Head n={5} label="Projects" title={projects.heading} lede={projects.lede} />
                    <div className="ix-projects">
                        {projects.items.map((p, i) => (
                            <article className={`ix-project ix-rv ${p.featured ? 'is-featured' : ''}`} style={D(i % 3)} key={p.title}>
                                <div className="ix-project-img">
                                    <img src={images[p.image]} alt={p.title} loading="lazy" />
                                    <span className="ix-project-tag">{p.tag}</span>
                                </div>
                                <div className="ix-project-body">
                                    <p className="ix-chip ix-chip--line">{p.status}</p>
                                    <h3>{p.title}</h3>
                                    <p>{p.text}</p>
                                    {p.facts && <div className="ix-chips ix-chips--sm">{p.facts.map((f) => <span key={f}>{f}</span>)}</div>}
                                </div>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===================== 07 TEST PLANS ===================== */}
            <section className="ix-sec ix-dark" id="testing">
                <div className="ix-wrap">
                    <Head n={6} label="Test plans" title={testing.heading} lede={testing.lede} />

                    <div
                        className="ix-tabs ix-rv"
                        role="tablist"
                        aria-label="Testing focus"
                        onKeyDown={(e) => arrowNav(e, focusIdx, testing.focus.length, setFocusIdx)}
                    >
                        {testing.focus.map((f, i) => (
                            <button key={f.id} role="tab" aria-selected={focusIdx === i} tabIndex={focusIdx === i ? 0 : -1} className={focusIdx === i ? 'is-on' : ''} onClick={() => setFocusIdx(i)}>
                                <span>{pad(i)}</span>{f.title}
                            </button>
                        ))}
                    </div>

                    <div className="ix-focus" key={focus.id} role="tabpanel">
                        <div className="ix-focus-bar">
                            <p>{focus.summary}</p>
                            <button className="ix-link" onClick={() => setOpen(allOpen ? new Set() : new Set(allKeys))}>
                                {allOpen ? 'Collapse all' : 'Expand all'}
                            </button>
                        </div>
                        <div className="ix-fourm">
                            {testing.columns.map((c, ci) => (
                                <div className="ix-fourm-col ix-pop" style={{ '--d': ci * 70 }} key={c.key}>
                                    <header><strong>{c.label}</strong><span>{c.note}</span></header>
                                    {(focus.cells[c.key] || []).map((it, i) => {
                                        const k = keyOf(c.key, i);
                                        const on = open.has(k);
                                        return (
                                            <div className={`ix-acc ${on ? 'is-on' : ''}`} key={k}>
                                                <button onClick={() => toggle(k)} aria-expanded={on}>
                                                    <span>{it.title}</span><i aria-hidden="true" />
                                                </button>
                                                <div className="ix-acc-body"><div>
                                                    <ul>{it.points.map((p) => <li key={p}>{p}</li>)}</ul>
                                                </div></div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ===================== 08 IMPACT ===================== */}
            <section className="ix-sec ix-yellow" id="impact">
                <div className="ix-wrap">
                    <Head n={7} label="Impact" title={impact.heading} lede={impact.lede} />
                    <div className="ix-bignums">
                        {impact.stats.map((s, i) => (
                            <div className="ix-bignum ix-rv" style={D(i)} key={s.label}>
                                <strong><Counter value={s.value} prefix={s.prefix} suffix={s.suffix} decimals={s.decimals} /></strong>
                                <span>{s.label}</span>
                            </div>
                        ))}
                    </div>
                    <p className="ix-source ix-rv">{impact.source}</p>
                </div>
            </section>

            {/* ===================== 09 PARTICIPATE ===================== */}
            <section className="ix-sec ix-light" id="participate">
                <div className="ix-wrap">
                    <Head n={8} label="Participate" title={participate.heading} lede={participate.lede} />
                    <div className="ix-grid ix-grid-4">
                        {participate.types.map((t, i) => (
                            <article className="ix-tile ix-type ix-spot ix-rv" style={D(i)} key={t.who}>
                                <p className="ix-type-kind">{t.kind}</p>
                                <h3>{t.who}</h3>
                                {t.note && <p className="ix-type-note">{t.note}</p>}
                                <ul className="ix-ticks">{t.points.map((p) => <li key={p}>{p}</li>)}</ul>
                            </article>
                        ))}
                    </div>

                    <h3 className="ix-sub ix-places-title ix-rv">{participate.stepsTitle}</h3>
                    <ol className="ix-steps">
                        {participate.steps.map((s, i) => (
                            <li className="ix-rv" style={D(i)} key={s.title}>
                                <strong>{i + 1}</strong>
                                <h4>{s.title}</h4>
                                <p>{s.text}</p>
                            </li>
                        ))}
                    </ol>
                </div>
            </section>

            {/* ===================== CLOSING CTA ===================== */}
            <section className="ix-sec ix-dark ix-cta" id="cta">
                <div className="ix-wrap ix-cta-in">
                    <div>
                        <h2 className="ix-h ix-rv">{participate.closing.heading}</h2>
                        <p className="ix-lede ix-rv" style={D(1)}>{participate.closing.text}</p>
                    </div>
                    <div className="ix-cta-btns ix-rv" style={D(2)}>
                        <a className="ix-btn ix-mag" href={links.apply}>Apply to participate<Arrow /></a>
                        <a className="ix-btn ix-btn--ghost ix-mag" href={links.services}>See our services<Arrow /></a>
                        <a className="ix-btn ix-btn--ghost ix-mag" href={links.sandbox}>About the sandbox<Arrow /></a>
                    </div>
                </div>
            </section>

            {/* floating apply button, appears after the hero */}
            <div className={`ix-fab ${showFab ? 'is-on' : ''}`}>
                <a className="ix-btn ix-btn--sm" href={links.apply} tabIndex={showFab ? 0 : -1}>Apply to participate<Arrow /></a>
            </div>
        </div>
    );
}

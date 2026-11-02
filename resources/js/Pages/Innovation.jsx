import { useCallback, useEffect, useRef, useState } from 'react';
import '../../css/innovation.css';

import {
    links, sections, hero, heroStats, ticker, overview, facilities, framework,
    applications, roadmap, projects, testing, impact, participate,
} from '../data/innovationData';

/* ---- images (add a new image: import it here, then list it below) ---- */
import renderExterior from '../images/innovation/render-exterior.jpg';
import renderHangar from '../images/innovation/render-hangar.jpg';
import renderEntrance from '../images/innovation/render-entrance.jpg';
import siteAerial from '../images/innovation/site-aerial.jpg';
import corridorDam from '../images/innovation/corridor-dam.jpg';
import corridorLangkawi from '../images/innovation/corridor-langkawi.jpg';

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

/* adds .in to every .rv once it scrolls into view */
function useReveal(rootRef) {
    useEffect(() => {
        const nodes = rootRef.current.querySelectorAll('.rv');
        if (reduced() || !('IntersectionObserver' in window)) {
            nodes.forEach((n) => n.classList.add('in'));
            return;
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
        if (reduced()) { setV(value); return; }
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

function Head({ n, label, title, lede, children }) {
    return (
        <header className="head">
            <p className="kicker rv"><span>{pad(n)}</span>{label}</p>
            <h2 className="h rv" style={D(1)}>{title}</h2>
            {lede && <p className="lede rv" style={D(2)}>{lede}</p>}
            {children}
        </header>
    );
}

const Arrow = () => (
    <svg className="arrow" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
        <path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
    </svg>
);

/* ==========================================================================
   Hero map: schematic flight corridors out of the sandbox
========================================================================== */

function CorridorMap() {
    return (
        <svg className="map" viewBox="0 0 640 560" role="img" aria-label={hero.mapLabel}>
            <defs>
                <radialGradient id="mapGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0" stopColor="#ffd60a" stopOpacity=".28" />
                    <stop offset="1" stopColor="#ffd60a" stopOpacity="0" />
                </radialGradient>
            </defs>

            {/* terrain contours */}
            <g className="map-contours" fill="none">
                <path d="M120 60C220 20 340 40 420 90S580 150 600 250 540 420 440 470 230 520 150 450 40 300 70 190 90 80 120 60Z" />
                <path d="M160 110C240 80 330 90 400 130S520 190 540 260 490 390 410 428 250 460 190 400 100 290 120 200 130 130 160 110Z" />
                <path d="M210 160C270 140 340 150 390 180S470 230 480 280 440 360 380 385 270 400 230 355 160 270 175 220 190 175 210 160Z" />
                <path d="M30 70C60 150 90 220 70 300S30 420 60 520" className="coast" />
                <path d="M200 90c-30 30-60 60-70 110M180 120c-20 30-40 60-48 100" className="hills" />
            </g>

            <circle cx="300" cy="300" r="150" fill="url(#mapGlow)" />

            {/* altitude zones around the sandbox */}
            <g className="zones">
                <circle cx="300" cy="300" r="46" />
                <circle cx="300" cy="300" r="82" />
                <circle cx="300" cy="300" r="118" />
            </g>

            {/* routes */}
            <path id="rA" className="route route-a" d="M300 300C350 255 420 222 500 198" />
            <path id="rA2" className="route route-a" d="M500 198C470 270 400 330 300 300" style={{ animationDelay: '2.2s' }} />
            <path id="rB" className="route route-b" d="M300 300C250 238 180 226 114 246C96 300 78 350 62 420" style={{ animationDelay: '2.6s' }} />

            {/* drones travelling the corridors */}
            <g className="drone">
                <circle r="5" /><circle r="12" className="halo" />
                <animateMotion dur="7s" begin="2.6s" repeatCount="indefinite" keyPoints="0;1;0" keyTimes="0;.5;1" calcMode="linear"><mpath href="#rA" /></animateMotion>
            </g>
            <g className="drone">
                <circle r="5" /><circle r="12" className="halo" />
                <animateMotion dur="10s" begin="3.2s" repeatCount="indefinite" keyPoints="0;1;0" keyTimes="0;.5;1" calcMode="linear"><mpath href="#rB" /></animateMotion>
            </g>

            {/* nodes */}
            <g className="node node-dam" transform="translate(500 198)">
                <circle r="6" /><text x="14" y="-10">Timah Tasoh Dam</text>
            </g>
            <g className="node node-kp" transform="translate(114 246)">
                <circle r="6" /><text x="-8" y="-14" textAnchor="start">Kuala Perlis</text>
            </g>
            <g className="node node-lgk" transform="translate(62 420)">
                <circle r="6" /><text x="14" y="5">Langkawi</text>
            </g>
            <g className="node node-sbp" transform="translate(300 300)">
                <circle className="ping" r="10" />
                <circle className="ping ping2" r="10" />
                <rect x="-8" y="-8" width="16" height="16" transform="rotate(45)" />
                <text x="18" y="34">Sungai Batu Pahat</text>
                <text x="18" y="50" className="sub">Perlis Airspace Sandbox</text>
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
        <svg className="plan" viewBox="0 0 100 64" role="img" aria-label="Illustrative site plan of the sandbox">
            <defs>
                <pattern id="pgrid" width="4" height="4" patternUnits="userSpaceOnUse">
                    <path d="M4 0H0V4" fill="none" stroke="currentColor" strokeWidth=".08" opacity=".35" />
                </pattern>
            </defs>
            <rect width="100" height="64" fill="url(#pgrid)" />
            <polygon className="plan-site" points="6,8 62,4 96,26 88,58 30,60 6,40" />

            {/* runway of the mock-up aerodrome */}
            <g transform="rotate(-8 50 34)">
                <rect className="plan-runway" x="26" y="31.5" width="48" height="5" rx=".6" />
                <line className="plan-centre" x1="28" y1="34" x2="72" y2="34" />
            </g>

            {/* test flight corridor */}
            {cr && <path className="plan-corridor" d={`M60 24 C72 20 80 17 ${cr.pos.x} ${cr.pos.y}`} />}

            {vp && <circle className="plan-pad" cx={vp.pos.x} cy={vp.pos.y} r="4.2" />}
            {vp && <text className="plan-h" x={vp.pos.x} y={vp.pos.y + 1.6} textAnchor="middle">H</text>}
            {rd && <line className="plan-sweep" x1={rd.pos.x} y1={rd.pos.y} x2={rd.pos.x} y2={rd.pos.y - 9} style={{ transformOrigin: `${rd.pos.x}px ${rd.pos.y}px` }} />}
            {rd && <circle className="plan-radar" cx={rd.pos.x} cy={rd.pos.y} r="9" />}

            {items.map((f, i) => {
                const on = f.id === act.id;
                return (
                    <g
                        key={f.id}
                        className={`mk ${on ? 'is-on' : ''}`}
                        transform={`translate(${f.pos.x} ${f.pos.y})`}
                        role="button"
                        tabIndex={0}
                        aria-label={f.title}
                        aria-pressed={on}
                        onClick={() => onPick(f.id)}
                        onMouseEnter={() => onPick(f.id)}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onPick(f.id); } }}
                    >
                        <circle className="mk-ring" r="3.2" />
                        <circle className="mk-dot" r="2.1" />
                        <text className="mk-n" y=".75" textAnchor="middle">{i + 1}</text>
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

    useReveal(rootRef);

    /* scroll: progress bar, hero parallax, active menu item */
    useEffect(() => {
        const root = rootRef.current;
        let raf = 0;
        const update = () => {
            raf = 0;
            const y = window.scrollY;
            const h = root.scrollHeight - window.innerHeight;
            root.style.setProperty('--sy', `${Math.min(y, 900)}`);
            root.style.setProperty('--progress', h > 0 ? Math.min(1, Math.max(0, y / h)).toFixed(4) : 0);
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
        const a = rootRef.current.querySelector('.subnav a.is-active');
        const box = rootRef.current.querySelector('.subnav-scroll');
        if (a && box) box.scrollTo({ left: a.offsetLeft - box.clientWidth / 2 + a.clientWidth / 2, behavior: 'smooth' });
    }, [activeSection]);

    const goTo = useCallback((id) => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, []);

    /* cursor spotlight on .spot elements */
    const onMove = useCallback((e) => {
        const t = e.target.closest && e.target.closest('.spot');
        if (!t) return;
        const r = t.getBoundingClientRect();
        t.style.setProperty('--mx', `${e.clientX - r.left}px`);
        t.style.setProperty('--my', `${e.clientY - r.top}px`);
    }, []);

    /* test plans: accordion state */
    const focus = testing.focus[focusIdx];
    const keyOf = (c, i) => `${focus.id}|${c}|${i}`;
    useEffect(() => {
        const s = new Set();
        testing.columns.forEach((c) => { if ((focus.cells[c.key] || []).length) s.add(`${focus.id}|${c.key}|0`); });
        setOpen(s);
    }, [focus]);
    const toggle = (k) => setOpen((o) => { const n = new Set(o); n.has(k) ? n.delete(k) : n.add(k); return n; });
    const allKeys = testing.columns.flatMap((c) => (focus.cells[c.key] || []).map((_, i) => keyOf(c.key, i)));
    const allOpen = allKeys.length > 0 && allKeys.every((k) => open.has(k));

    const ph = roadmap.phases[phase];
    const act = applications.items[app];

    return (
        <div className="inv" ref={rootRef} onMouseMove={onMove}>

            {/* ===================== HERO ===================== */}
            <section className="hero" id="top">
                <div className="hero-wipe" aria-hidden="true" />
                <div className="hero-grid" aria-hidden="true" />
                <div className="hero-map" aria-hidden="true"><CorridorMap /></div>

                <div className="wrap hero-in">
                    <p className="eyebrow"><i />{hero.eyebrow}</p>
                    <h1 className="hero-title">
                        {hero.titleLines.map((l, i) => (
                            <span className="ln" key={l}>
                                <span className={l === hero.highlight ? 'hl' : ''} style={{ '--i': i }}>{l}</span>
                            </span>
                        ))}
                    </h1>
                    <p className="lede hero-lede">{hero.lede}</p>
                    <div className="hero-cta">
                        <a className="btn" href={links.apply}>{hero.primaryButton}<Arrow /></a>
                        <button className="btn btn--ghost" onClick={() => goTo('overview')}>{hero.secondaryButton}</button>
                    </div>
                    <p className="map-note">{hero.mapLabel}</p>
                </div>

                <div className="wrap hero-stats">
                    {heroStats.map((s, i) => (
                        <div className="stat" key={s.label} style={{ '--i': i }}>
                            <strong><Counter {...s} delay={1500 + i * 120} /></strong>
                            <span>{s.label}</span>
                        </div>
                    ))}
                </div>
                <div className="scroll-cue" aria-hidden="true"><span /></div>
            </section>

            {/* ===================== STICKY MENU ===================== */}
            <nav className="subnav" aria-label="Innovation sections">
                <div className="wrap subnav-scroll">
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
                <div className="progress" aria-hidden="true"><span /></div>
            </nav>

            {/* ===================== TICKER ===================== */}
            <div className="ticker" aria-hidden="true">
                <div className="ticker-track">
                    {[0, 1].map((k) => (
                        <ul key={k}>{ticker.map((t) => <li key={t + k}>{t}</li>)}</ul>
                    ))}
                </div>
            </div>

            {/* ===================== 01 OVERVIEW ===================== */}
            <section className="sec sec--light" id="overview">
                <div className="wrap">
                    <Head n={0} label="Overview" title={overview.heading} lede={overview.lede} />

                    <div className="layers">
                        {overview.layers.map((l, i) => (
                            <div className={`layer rv ${l.highlight ? 'is-hl' : ''}`} style={D(i + 2)} key={l.label}>
                                <span className="layer-note">{l.note}</span>
                                <strong>{l.label}</strong>
                                <span className="layer-text">{l.text}</span>
                            </div>
                        ))}
                    </div>
                    <p className="tagline rv">{overview.tagline}</p>

                    <div className="split">
                        <div className="rv">
                            <h3 className="sub">{overview.missionTitle}</h3>
                            <p className="body-lg">{overview.mission}</p>
                        </div>
                        <div>
                            <h3 className="sub rv">{overview.objectivesTitle}</h3>
                            <ol className="rows">
                                {overview.objectives.map((o, i) => (
                                    <li className="row rv" style={D(i)} key={o.title}>
                                        <span className="num">{pad(i)}</span>
                                        <div><h4>{o.title}</h4><p>{o.text}</p></div>
                                    </li>
                                ))}
                            </ol>
                        </div>
                    </div>

                    <div className="split split--rev">
                        <div>
                            <h3 className="sub rv">{overview.gapsTitle}</h3>
                            <ul className="gaps">
                                {overview.gaps.map((g, i) => (
                                    <li className="rv" style={D(i)} key={g}><i aria-hidden="true" />{g}</li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <h3 className="sub rv">{overview.perlisTitle}</h3>
                            <div className="grid grid-3">
                                {overview.perlis.map((p, i) => (
                                    <div className="tile spot rv" style={D(i)} key={p.title}>
                                        <h4>{p.title}</h4><p>{p.text}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ===================== 02 FACILITIES ===================== */}
            <section className="sec sec--dark" id="facilities">
                <div className="wrap">
                    <Head n={1} label="Facilities" title={facilities.heading} lede={facilities.lede} />

                    <div className="fac">
                        <figure className="plan-wrap rv">
                            <SitePlan items={facilities.items} active={facility} onPick={setFacility} />
                            <figcaption>{facilities.planCaption}</figcaption>
                        </figure>
                        <ul className="fac-list">
                            {facilities.items.map((f, i) => (
                                <li key={f.id} className="rv" style={D(i)}>
                                    <button
                                        className={`fac-item ${facility === f.id ? 'is-on' : ''}`}
                                        onClick={() => setFacility(f.id)}
                                        aria-expanded={facility === f.id}
                                    >
                                        <span className="num">{pad(i)}</span>
                                        <span className="fac-title">{f.title}</span>
                                        <span className="fac-body"><span><p>{f.text}</p></span></span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <h3 className="sub rv" style={{ marginTop: 'clamp(40px,7vw,88px)' }}>{facilities.featuresTitle}</h3>
                    <div className="grid grid-2">
                        {facilities.features.map((f, i) => (
                            <div className="tile tile--dark spot rv" style={D(i)} key={f.title}>
                                <h4>{f.title}</h4>
                                <ul className="ticks">{f.points.map((p) => <li key={p}>{p}</li>)}</ul>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===================== 03 FRAMEWORK ===================== */}
            <section className="sec sec--light" id="framework">
                <div className="wrap">
                    <Head n={2} label="Development framework" title={framework.heading} lede={framework.lede} />
                    <div className="grid grid-3 pillars">
                        {framework.pillars.map((p, i) => (
                            <article className="pillar spot rv" style={D(i % 3)} key={p.title}>
                                <span className="pillar-n">{pad(i)}</span>
                                <h3>{p.title}</h3>
                                <p>{p.text}</p>
                                <i className="pillar-bar" aria-hidden="true" />
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===================== 04 APPLICATIONS ===================== */}
            <section className="sec sec--yellow" id="applications">
                <div className="wrap">
                    <Head n={3} label="Applications" title={applications.heading} lede={applications.lede} />
                    <ul className="apps">
                        {applications.items.map((a, i) => (
                            <li key={a.title} className="rv" style={D(i)}>
                                <button
                                    className={`app ${app === i ? 'is-on' : ''}`}
                                    onClick={() => setApp(i)}
                                    aria-expanded={app === i}
                                >
                                    <span className="num">{pad(i)}</span>
                                    <span className="app-title">{a.title}</span>
                                    <span className="app-body">
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
            <section className="sec sec--dark" id="roadmap">
                <div className="wrap">
                    <Head n={4} label="Roadmap" title={roadmap.heading} lede={roadmap.lede} />

                    <div className="track rv" role="tablist" aria-label="Roadmap phases" style={{ '--p': phase / (roadmap.phases.length - 1) }}>
                        <div className="track-line" aria-hidden="true"><span /></div>
                        {roadmap.phases.map((p, i) => (
                            <button
                                key={p.title}
                                role="tab"
                                aria-selected={phase === i}
                                className={`step ${phase === i ? 'is-on' : ''} ${i < phase ? 'is-done' : ''}`}
                                onClick={() => setPhase(i)}
                            >
                                <span className="step-dot">{i + 1}</span>
                                <span className="step-when">{p.when}</span>
                                <span className="step-name">Phase {i + 1}</span>
                            </button>
                        ))}
                    </div>

                    <div className="phase" key={phase} role="tabpanel">
                        <div className="phase-head">
                            <p className="chip">{ph.when}</p>
                            <h3>{ph.title}</h3>
                            <p className="phase-sum">{ph.summary}</p>
                            {phase < roadmap.phases.length - 1 && (
                                <button className="btn btn--ghost btn--sm" onClick={() => setPhase(phase + 1)}>Next phase<Arrow /></button>
                            )}
                        </div>
                        <div className="phase-comp">
                            <h4 className="sub">Key components</h4>
                            <div className="grid grid-2">
                                {ph.components.map((c, i) => (
                                    <div className="tile tile--dark spot pop" style={{ '--d': i * 60 }} key={c.title}>
                                        <h4>{c.title}</h4>
                                        <ul className="ticks">{c.points.map((p) => <li key={p}>{p}</li>)}</ul>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="phase-out">
                            <h4 className="sub">Expected outcomes</h4>
                            <ul className="outs">
                                {ph.outcomes.map((o, i) => <li className="pop" style={{ '--d': 200 + i * 60 }} key={o}>{o}</li>)}
                            </ul>
                        </div>
                    </div>

                    <div className="enablers rv">
                        <span className="sub">{roadmap.enablersTitle}</span>
                        <div className="chips">{roadmap.enablers.map((e) => <span key={e}>{e}</span>)}</div>
                    </div>

                    <div className="vision">
                        <h3 className="sub rv">{roadmap.visionTitle}</h3>
                        <div className="stack">
                            {roadmap.vision.map((v, i) => (
                                <div className="layer-bar rv" style={{ '--d': (roadmap.vision.length - i) * 110, '--w': 46 + i * 18 }} key={v.title}>
                                    <strong>{v.title}</strong><span>{v.text}</span>
                                </div>
                            ))}
                        </div>
                        <p className="caption rv">{roadmap.visionCaption}</p>
                    </div>
                </div>
            </section>

            {/* ===================== 06 PROJECTS ===================== */}
            <section className="sec sec--light" id="projects">
                <div className="wrap">
                    <Head n={5} label="Projects" title={projects.heading} lede={projects.lede} />
                    <div className="projects">
                        {projects.items.map((p, i) => (
                            <article className={`project rv ${p.featured ? 'is-featured' : ''}`} style={D(i % 3)} key={p.title}>
                                <div className="project-img">
                                    <img src={images[p.image]} alt={p.title} loading="lazy" />
                                    <span className="project-tag">{p.tag}</span>
                                </div>
                                <div className="project-body">
                                    <p className="chip chip--line">{p.status}</p>
                                    <h3>{p.title}</h3>
                                    <p>{p.text}</p>
                                    {p.facts && <div className="chips chips--sm">{p.facts.map((f) => <span key={f}>{f}</span>)}</div>}
                                </div>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===================== 07 TEST PLANS ===================== */}
            <section className="sec sec--dark" id="testing">
                <div className="wrap">
                    <Head n={6} label="Test plans" title={testing.heading} lede={testing.lede} />

                    <div className="tabs rv" role="tablist" aria-label="Testing focus">
                        {testing.focus.map((f, i) => (
                            <button key={f.id} role="tab" aria-selected={focusIdx === i} className={focusIdx === i ? 'is-on' : ''} onClick={() => setFocusIdx(i)}>
                                <span>{pad(i)}</span>{f.title}
                            </button>
                        ))}
                    </div>

                    <div className="focus" key={focus.id} role="tabpanel">
                        <div className="focus-bar">
                            <p>{focus.summary}</p>
                            <button className="link" onClick={() => setOpen(allOpen ? new Set() : new Set(allKeys))}>
                                {allOpen ? 'Collapse all' : 'Expand all'}
                            </button>
                        </div>
                        <div className="fourm">
                            {testing.columns.map((c, ci) => (
                                <div className="fourm-col pop" style={{ '--d': ci * 70 }} key={c.key}>
                                    <header><strong>{c.label}</strong><span>{c.note}</span></header>
                                    {(focus.cells[c.key] || []).map((it, i) => {
                                        const k = keyOf(c.key, i);
                                        const on = open.has(k);
                                        return (
                                            <div className={`acc ${on ? 'is-on' : ''}`} key={k}>
                                                <button onClick={() => toggle(k)} aria-expanded={on}>
                                                    <span>{it.title}</span><i aria-hidden="true" />
                                                </button>
                                                <div className="acc-body"><div>
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
            <section className="sec sec--yellow" id="impact">
                <div className="wrap">
                    <Head n={7} label="Impact" title={impact.heading} lede={impact.lede} />
                    <div className="bignums">
                        {impact.stats.map((s, i) => (
                            <div className="bignum rv" style={D(i)} key={s.label}>
                                <strong><Counter {...s} /></strong>
                                <span>{s.label}</span>
                            </div>
                        ))}
                    </div>
                    <p className="source rv">{impact.source}</p>
                </div>
            </section>

            {/* ===================== 09 PARTICIPATE ===================== */}
            <section className="sec sec--light" id="participate">
                <div className="wrap">
                    <Head n={8} label="Participate" title={participate.heading} lede={participate.lede} />
                    <div className="grid grid-4">
                        {participate.types.map((t, i) => (
                            <article className="type spot rv" style={D(i)} key={t.who}>
                                <p className="type-kind">{t.kind}</p>
                                <h3>{t.who}</h3>
                                {t.note && <p className="type-note">{t.note}</p>}
                                <ul className="ticks">{t.points.map((p) => <li key={p}>{p}</li>)}</ul>
                            </article>
                        ))}
                    </div>

                    <h3 className="sub rv" style={{ marginTop: 'clamp(40px,7vw,88px)' }}>{participate.stepsTitle}</h3>
                    <ol className="steps">
                        {participate.steps.map((s, i) => (
                            <li className="rv" style={D(i)} key={s.title}>
                                <strong>{i + 1}</strong>
                                <h4>{s.title}</h4>
                                <p>{s.text}</p>
                            </li>
                        ))}
                    </ol>
                </div>
            </section>

            {/* ===================== CLOSING CTA ===================== */}
            <section className="sec sec--dark cta" id="cta">
                <div className="wrap cta-in">
                    <div>
                        <h2 className="h rv">{participate.closing.heading}</h2>
                        <p className="lede rv" style={D(1)}>{participate.closing.text}</p>
                    </div>
                    <div className="cta-btns rv" style={D(2)}>
                        <a className="btn" href={links.apply}>Apply to participate<Arrow /></a>
                        <a className="btn btn--ghost" href={links.services}>See our services</a>
                        <a className="btn btn--ghost" href={links.sandbox}>About the sandbox</a>
                    </div>
                </div>
            </section>
        </div>
    );
}

import { useCallback, useEffect, useRef, useState } from 'react';
/* shared look (same tokens, buttons, reveal, tabs) + the few styles this page adds */
import '../../css/innovation.css';
import '../../css/opportunities.css';

import {
    links, sections, hero, heroStats, ticker, ways, areas, programmes, how, benefits, closing,
} from '../data/Opportunitiesdata';

/* ---- images (same files the Innovation page uses) ---- */
import renderExterior from '../images/innovation/render-exterior.jpg';
import renderHangar from '../images/innovation/render-hangar.jpg';
import siteAerial from '../images/innovation/site-aerial.jpg';
import corridorDam from '../images/innovation/corridor-dam.jpg';
import corridorLangkawi from '../images/innovation/corridor-langkawi.jpg';

const images = {
    'render-exterior': renderExterior,
    'render-hangar': renderHangar,
    'site-aerial': siteAerial,
    'corridor-dam': corridorDam,
    'corridor-langkawi': corridorLangkawi,
};

/* ==========================================================================
   Small helpers
========================================================================== */

const D = (i) => ({ '--d': i * 90 });
const DS = (i) => ({ '--d': i * 45 });
const pad = (n) => String(n + 1).padStart(2, '0');
const reduced = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* adds .in to every .rv once it scrolls into view (static content only) */
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
            const dur = 1500;
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
        <header className="head">
            <p className="kicker rv"><span>{pad(n)}</span>{label}</p>
            <h2 className="h rv" style={D(1)}>{title}</h2>
            {lede && <p className="lede rv" style={D(2)}>{lede}</p>}
        </header>
    );
}

const Arrow = () => (
    <svg className="arrow" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
        <path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
    </svg>
);

/* ==========================================================================
   Hero graphic: three ways in (round nodes) and four testing areas (squares)
   around the sandbox
========================================================================== */

const WHO = [
    { id: 'gov', label: 'Government', x: 150, y: 190, route: 'M300 300C260 262 205 222 150 190', tx: -10, ty: -16, anchor: 'start' },
    { id: 'ind', label: 'Industry', x: 470, y: 196, route: 'M300 300C365 272 425 232 470 196', tx: 14, ty: -10, anchor: 'start' },
    { id: 'res', label: 'Research', x: 440, y: 424, route: 'M300 300C345 350 395 392 440 424', tx: 14, ty: 5, anchor: 'start' },
];
const AREA_NODES = [
    { id: 'fr', label: 'First responder', x: 64, y: 336 },
    { id: 'aam', label: 'Advanced air mobility', x: 330, y: 62 },
    { id: 'cargo', label: 'Cargo logistics', x: 566, y: 322 },
    { id: 'tech', label: 'System integration', x: 190, y: 500 },
];

function OrbitMap() {
    return (
        <svg className="map" viewBox="0 0 640 560" role="img" aria-label={hero.mapLabel}>
            <defs>
                <radialGradient id="orbGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0" stopColor="#ffd60a" stopOpacity=".28" />
                    <stop offset="1" stopColor="#ffd60a" stopOpacity="0" />
                </radialGradient>
            </defs>

            <circle cx="300" cy="300" r="170" fill="url(#orbGlow)" />
            <g className="zones">
                <circle cx="300" cy="300" r="52" />
                <circle cx="300" cy="300" r="112" />
                <circle cx="300" cy="300" r="172" />
            </g>

            {AREA_NODES.map((a) => (
                <line key={a.id} className="map-link" x1="300" y1="300" x2={a.x} y2={a.y} />
            ))}

            {WHO.map((w, i) => (
                <path key={w.id} id={`r-${w.id}`} className={`route ${i === 1 ? 'route-b' : 'route-a'}`} d={w.route} style={{ animationDelay: `${2.2 + i * 0.3}s` }} />
            ))}

            {WHO.slice(0, 2).map((w, i) => (
                <g className="drone" key={`d-${w.id}`}>
                    <circle r="5" /><circle r="12" className="halo" />
                    <animateMotion dur={`${7 + i * 3}s`} begin={`${2.6 + i * 0.6}s`} repeatCount="indefinite" keyPoints="0;1;0" keyTimes="0;.5;1" calcMode="linear">
                        <mpath href={`#r-${w.id}`} />
                    </animateMotion>
                </g>
            ))}

            {AREA_NODES.map((a, i) => (
                <g key={a.id} className="node node-area" transform={`translate(${a.x} ${a.y})`} style={{ animationDelay: `${2.4 + i * 0.2}s` }}>
                    <rect x="-6" y="-6" width="12" height="12" />
                    <text y="26" textAnchor="middle">{a.label}</text>
                </g>
            ))}

            {WHO.map((w, i) => (
                <g key={w.id} className="node" transform={`translate(${w.x} ${w.y})`} style={{ animationDelay: `${2 + i * 0.3}s` }}>
                    <circle r="7" />
                    <text x={w.tx} y={w.ty} textAnchor={w.anchor}>{w.label}</text>
                </g>
            ))}

            <g className="node node-sbp" transform="translate(300 300)">
                <circle className="ping" r="10" />
                <circle className="ping ping2" r="10" />
                <rect x="-8" y="-8" width="16" height="16" transform="rotate(45)" />
                <text x="18" y="34">Perlis Airspace Sandbox</text>
            </g>
        </svg>
    );
}

/* ==========================================================================
   PAGE
========================================================================== */

export default function Opportunities() {
    const rootRef = useRef(null);
    const [activeSection, setActiveSection] = useState(sections[0].id);
    const [areaIdx, setAreaIdx] = useState(0);
    const [phaseFilter, setPhaseFilter] = useState('all');
    const [areaFilter, setAreaFilter] = useState('all');
    const [openCall, setOpenCall] = useState(null);
    const [step, setStep] = useState(0);
    const [ready, setReady] = useState(() => new Set());

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

    /* programmes: filter */
    const calls = programmes.items.filter((p) =>
        (phaseFilter === 'all' || p.phase === phaseFilter) && (areaFilter === 'all' || p.areas.includes(areaFilter)));
    const phaseInfo = programmes.phases.find((p) => p.n === phaseFilter);
    const clearFilters = () => { setPhaseFilter('all'); setAreaFilter('all'); };

    const toggleReady = (i) => setReady((s) => { const n = new Set(s); n.has(i) ? n.delete(i) : n.add(i); return n; });

    const area = areas.items[areaIdx];
    const st = how.steps[step];

    return (
        <div className="inv opp" ref={rootRef} onMouseMove={onMove}>

            {/* ===================== HERO ===================== */}
            <section className="hero" id="top">
                <div className="hero-wipe" aria-hidden="true" />
                <div className="hero-grid" aria-hidden="true" />
                <div className="hero-map" aria-hidden="true"><OrbitMap /></div>

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
                        <button className="btn btn--ghost" onClick={() => goTo('ways')}>{hero.secondaryButton}</button>
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
            <nav className="subnav" aria-label="Opportunities sections">
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

            {/* ===================== 01 WAYS TO PARTICIPATE ===================== */}
            <section className="sec sec--light" id="ways">
                <div className="wrap">
                    <Head n={0} label="Ways to participate" title={ways.heading} lede={ways.lede} />
                    <div className="ways">
                        {ways.items.map((w, i) => (
                            <article className="type spot rv" style={D(i)} key={w.who}>
                                <p className="type-kind">{w.kind}</p>
                                <h3>{w.who}</h3>
                                <p className="type-note">{w.text}</p>
                                <ul className="ticks">{w.points.map((p) => <li key={p}>{p}</li>)}</ul>
                                <b className="type-out">{w.outcome}</b>
                                <a className="link" href={links.apply}>{w.cta}</a>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===================== 02 TESTING AND INNOVATION AREAS ===================== */}
            <section className="sec sec--dark" id="areas">
                <div className="wrap">
                    <Head n={1} label="Testing and innovation areas" title={areas.heading} lede={areas.lede} />

                    <div className="tabs rv" role="tablist" aria-label="Testing and innovation areas">
                        {areas.items.map((a, i) => (
                            <button key={a.id} role="tab" aria-selected={areaIdx === i} className={areaIdx === i ? 'is-on' : ''} onClick={() => setAreaIdx(i)}>
                                <span>{pad(i)}</span>{a.title}
                            </button>
                        ))}
                    </div>

                    <div className="areas" key={area.id} role="tabpanel">
                        <div className="area-head pop">
                            <h3>{area.title}</h3>
                            <p className="area-sum">{area.summary}</p>
                            {area.fact && <p className="fact">{area.fact}</p>}
                        </div>
                        <div className="area-cols">
                            <div className="pop" style={DS(1)}>
                                <h4 className="sub">{areas.labels.scenarios}</h4>
                                <ul className="ticks">{area.scenarios.map((s) => <li key={s}>{s}</li>)}</ul>
                            </div>
                            <div className="pop" style={DS(2)}>
                                <h4 className="sub">{areas.labels.outputs}</h4>
                                <ul className="outs">{area.outputs.map((o) => <li key={o}>{o}</li>)}</ul>
                            </div>
                            <div className="full pop" style={DS(3)}>
                                <h4 className="sub">{areas.labels.facilities}</h4>
                                <div className="chips">{area.facilities.map((f) => <span key={f}>{f}</span>)}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ===================== 03 OPEN PROGRAMMES AND CALLS ===================== */}
            <section className="sec sec--light" id="programmes">
                <div className="wrap">
                    <Head n={2} label="Open programmes and calls" title={programmes.heading} lede={programmes.lede} />

                    <div className="filters rv" role="group" aria-label="Filter by phase">
                        <span className="filters-label">Phase</span>
                        <button className={`fchip ${phaseFilter === 'all' ? 'is-on' : ''}`} onClick={() => setPhaseFilter('all')} aria-pressed={phaseFilter === 'all'}>All</button>
                        {programmes.phases.map((p) => (
                            <button key={p.n} className={`fchip ${phaseFilter === p.n ? 'is-on' : ''}`} onClick={() => setPhaseFilter(p.n)} aria-pressed={phaseFilter === p.n} title={p.name}>Phase {p.n}</button>
                        ))}
                    </div>
                    <div className="filters rv" role="group" aria-label="Filter by testing area" style={D(1)}>
                        <span className="filters-label">Area</span>
                        <button className={`fchip ${areaFilter === 'all' ? 'is-on' : ''}`} onClick={() => setAreaFilter('all')} aria-pressed={areaFilter === 'all'}>All</button>
                        {areas.items.map((a) => (
                            <button key={a.id} className={`fchip ${areaFilter === a.id ? 'is-on' : ''}`} onClick={() => setAreaFilter(a.id)} aria-pressed={areaFilter === a.id}>{a.title}</button>
                        ))}
                    </div>

                    <p className="count" aria-live="polite">
                        Showing {calls.length} of {programmes.items.length} windows
                        {phaseInfo && <> &middot; {phaseInfo.when}: {phaseInfo.name}</>}
                    </p>

                    {calls.length === 0 ? (
                        <div className="empty pop">
                            <p>No window matches these filters.</p>
                            <button className="link" onClick={clearFilters}>Clear filters</button>
                        </div>
                    ) : (
                        <ul className="calls">
                            {calls.map((p, i) => {
                                const on = openCall === p.id;
                                return (
                                    <li className={`call pop ${on ? 'is-open' : ''}`} style={DS(i)} key={p.id}>
                                        <button className="call-row" onClick={() => setOpenCall(on ? null : p.id)} aria-expanded={on}>
                                            <span className="call-phase">Phase {p.phase}</span>
                                            <span className="call-main"><strong>{p.title}</strong><span>{p.summary}</span></span>
                                            <span className="call-when">{p.window}</span>
                                            <span className={`call-status st-${p.status.key}`}>{p.status.label}</span>
                                            <i className="call-plus" aria-hidden="true" />
                                        </button>
                                        <div className="call-body">
                                            <div className="call-inner">
                                                <div>
                                                    <h4 className="sub">{programmes.labels.scope}</h4>
                                                    <ul className="ticks">{p.scope.map((s) => <li key={s}>{s}</li>)}</ul>
                                                </div>
                                                <div>
                                                    <h4 className="sub">{programmes.labels.provided}</h4>
                                                    <ul className="ticks">{p.provided.map((s) => <li key={s}>{s}</li>)}</ul>
                                                </div>
                                                <div>
                                                    <h4 className="sub">{programmes.labels.who}</h4>
                                                    <p className="call-who">{p.who}</p>
                                                    <div className="call-cta">
                                                        <a className="btn btn--sm" href={links.apply}>Register interest<Arrow /></a>
                                                        <a className="btn btn--ghost btn--sm" href={links.contact}>Request the brief</a>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                    <p className="source rv">{programmes.note}</p>
                </div>
            </section>

            {/* ===================== 04 HOW TO PARTICIPATE ===================== */}
            <section className="sec sec--dark" id="how">
                <div className="wrap">
                    <Head n={3} label="How to participate" title={how.heading} lede={how.lede} />

                    <div className="track rv" role="tablist" aria-label="Participation steps" style={{ '--p': step / (how.steps.length - 1) }}>
                        <div className="track-line" aria-hidden="true"><span /></div>
                        {how.steps.map((s, i) => (
                            <button
                                key={s.title}
                                role="tab"
                                aria-selected={step === i}
                                className={`step ${step === i ? 'is-on' : ''} ${i < step ? 'is-done' : ''}`}
                                onClick={() => setStep(i)}
                            >
                                <span className="step-dot">{i + 1}</span>
                                <span className="step-when">{s.when}</span>
                                <span className="step-name">{s.title}</span>
                            </button>
                        ))}
                    </div>

                    <div className="how-panel" key={step} role="tabpanel">
                        <div className="how-title pop">
                            <p className="chip">Step {step + 1} of {how.steps.length}</p>
                            <h3>{st.title}</h3>
                        </div>
                        <div className="how-col pop" style={DS(1)}><h4 className="sub">{how.labels.you}</h4><p>{st.you}</p></div>
                        <div className="how-col pop" style={DS(2)}><h4 className="sub">{how.labels.we}</h4><p>{st.we}</p></div>
                        <div className="how-col how-col--out pop" style={DS(3)}><h4 className="sub">{how.labels.out}</h4><p>{st.out}</p></div>
                    </div>
                    <div className="how-nav">
                        <button className="btn btn--ghost btn--sm" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}>Previous step</button>
                        {step < how.steps.length - 1
                            ? <button className="btn btn--sm" onClick={() => setStep(step + 1)}>Next step<Arrow /></button>
                            : <a className="btn btn--sm" href={links.apply}>Apply to participate<Arrow /></a>}
                    </div>

                    <div className="prep rv">
                        <h3 className="sub">{how.prepTitle}</h3>
                        <p className="prep-note">{how.prepNote}</p>
                        <div className="prep-list">
                            {how.prep.map((p, i) => (
                                <button key={p} className={`prep-item ${ready.has(i) ? 'is-on' : ''}`} role="checkbox" aria-checked={ready.has(i)} onClick={() => toggleReady(i)}>
                                    <i aria-hidden="true" />{p}
                                </button>
                            ))}
                        </div>
                        <p className="prep-count" aria-live="polite">{ready.size} of {how.prep.length} ready</p>
                    </div>
                </div>
            </section>

            {/* ===================== 05 PARTICIPANT BENEFITS ===================== */}
            <section className="sec sec--yellow" id="benefits">
                <div className="wrap">
                    <Head n={4} label="Participant benefits" title={benefits.heading} lede={benefits.lede} />

                    <div className="bgrid">
                        {benefits.groups.map((g, i) => (
                            <article className="bcard rv" style={D(i)} key={g.title}>
                                <h3>{g.title}</h3>
                                <p>{g.text}</p>
                                <ul className="ticks">{g.points.map((p) => <li key={p}>{p}</li>)}</ul>
                            </article>
                        ))}
                    </div>

                    <div className="partners rv">
                        <h3 className="sub">{benefits.partnersTitle}</h3>
                        <div className="chips">{benefits.partners.map((p) => <span key={p}>{p}</span>)}</div>
                    </div>

                    <h3 className="sub rv" style={{ marginTop: 'clamp(40px,7vw,88px)' }}>{benefits.placesTitle}</h3>
                    <div className="gal">
                        {benefits.places.map((p, i) => (
                            <figure className="rv" style={D(i)} key={p.image}>
                                <img src={images[p.image]} alt={p.caption} loading="lazy" />
                                <figcaption>{p.caption}</figcaption>
                            </figure>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===================== CLOSING CTA ===================== */}
            <section className="sec sec--dark cta" id="cta">
                <div className="wrap cta-in">
                    <div>
                        <h2 className="h rv">{closing.heading}</h2>
                        <p className="lede rv" style={D(1)}>{closing.text}</p>
                    </div>
                    <div className="cta-btns rv" style={D(2)}>
                        <a className="btn" href={links.apply}>Apply to participate<Arrow /></a>
                        <a className="btn btn--ghost" href={links.services}>See our services</a>
                        <a className="btn btn--ghost" href={links.contact}>Contact the team</a>
                    </div>
                </div>
            </section>
        </div>
    );
}

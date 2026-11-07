import { useCallback, useEffect, useRef, useState } from 'react';
/* standalone stylesheet: does not need innovation.css any more */
import '../../../css/PSB-css/psb-opportunities.css';

import {
    links, sections, hero, heroStats, ticker, ways, areas, programmes, how, benefits, closing,
} from '../../data/PSB-data/Opportunitiesdata';

/* ---- images (same files the Innovation page uses) ---- */
import renderExterior from '../../images/innovation/render-exterior.jpg';
import renderHangar from '../../images/innovation/render-hangar.jpg';
import siteAerial from '../../images/innovation/site-aerial.jpg';
import corridorDam from '../../images/innovation/corridor-dam.jpg';
import corridorLangkawi from '../../images/innovation/corridor-langkawi.jpg';

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
const DS = (i) => ({ '--d': i * 55 });
const pad = (n) => String(n + 1).padStart(2, '0');
const reduced = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* adds .in to every .ox-rv once it scrolls into view */
function useReveal(rootRef) {
    useEffect(() => {
        const nodes = rootRef.current.querySelectorAll('.ox-rv');
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
            const dur = 1600;
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
        <header className="ox-head">
            <p className="ox-kicker ox-rv"><span>{pad(n)}</span>{label}</p>
            <h2 className="ox-h ox-rv" style={D(1)}>{title}</h2>
            {lede && <p className="ox-lede ox-rv" style={D(2)}>{lede}</p>}
        </header>
    );
}

const Arrow = () => (
    <svg className="ox-arrow" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
        <path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

/* circular progress for the "prepare before you apply" checklist */
function Ring({ value, total }) {
    const r = 26;
    const c = 2 * Math.PI * r;
    return (
        <svg className="ox-ring" viewBox="0 0 64 64" role="img" aria-label={`${value} of ${total} ready`}>
            <circle className="ox-ring-bg" cx="32" cy="32" r={r} />
            <circle className="ox-ring-fg" cx="32" cy="32" r={r} strokeDasharray={c} strokeDashoffset={c * (1 - value / total)} transform="rotate(-90 32 32)" />
            <text x="32" y="37" textAnchor="middle">{value}/{total}</text>
        </svg>
    );
}

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
        <svg className="ox-map" viewBox="0 0 640 560" role="img" aria-label={hero.mapLabel}>
            <defs>
                <radialGradient id="oxGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0" stopColor="#ffd60a" stopOpacity=".30" />
                    <stop offset="1" stopColor="#ffd60a" stopOpacity="0" />
                </radialGradient>
            </defs>

            <circle cx="300" cy="300" r="190" fill="url(#oxGlow)" />
            <g className="ox-zones">
                <circle cx="300" cy="300" r="52" />
                <circle cx="300" cy="300" r="112" />
                <circle cx="300" cy="300" r="172" />
            </g>

            {AREA_NODES.map((a) => (
                <line key={a.id} className="ox-link-line" x1="300" y1="300" x2={a.x} y2={a.y} />
            ))}

            {WHO.map((w, i) => (
                <path key={w.id} id={`ox-r-${w.id}`} className="ox-route" pathLength="1" d={w.route} style={{ animationDelay: `${2 + i * 0.3}s` }} />
            ))}

            {WHO.slice(0, 2).map((w, i) => (
                <g className="ox-drone" key={`d-${w.id}`}>
                    <circle r="5" /><circle r="12" className="halo" />
                    <animateMotion dur={`${7 + i * 3}s`} begin={`${3 + i * 0.6}s`} repeatCount="indefinite" keyPoints="0;1;0" keyTimes="0;.5;1" calcMode="linear">
                        <mpath href={`#ox-r-${w.id}`} />
                    </animateMotion>
                </g>
            ))}

            {AREA_NODES.map((a, i) => (
                <g key={a.id} className="ox-node ox-node-area" transform={`translate(${a.x} ${a.y})`} style={{ animationDelay: `${2.2 + i * 0.2}s` }}>
                    <rect x="-6" y="-6" width="12" height="12" />
                    <text y="26" textAnchor="middle">{a.label}</text>
                </g>
            ))}

            {WHO.map((w, i) => (
                <g key={w.id} className="ox-node" transform={`translate(${w.x} ${w.y})`} style={{ animationDelay: `${1.9 + i * 0.3}s` }}>
                    <circle r="7" />
                    <text x={w.tx} y={w.ty} textAnchor={w.anchor}>{w.label}</text>
                </g>
            ))}

            <g className="ox-node ox-node-core" transform="translate(300 300)">
                <circle className="ox-ping" r="10" />
                <circle className="ox-ping ox-ping2" r="10" />
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
    const [showFab, setShowFab] = useState(false);

    useReveal(rootRef);

    /* scroll: progress bar, hero parallax, active menu item, floating button */
    useEffect(() => {
        const root = rootRef.current;
        const heroEl = root.querySelector('.ox-hero');
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
        const a = rootRef.current.querySelector('.ox-subnav a.is-active');
        const box = rootRef.current.querySelector('.ox-subnav-scroll');
        if (a && box) box.scrollTo({ left: a.offsetLeft - box.clientWidth / 2 + a.clientWidth / 2, behavior: 'smooth' });
    }, [activeSection]);

    const goTo = useCallback((id) => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, []);

    /* pointer effects: card spotlight + tilt, magnetic buttons, hero glow */
    const onMove = useCallback((e) => {
        const t = e.target;
        if (!t.closest) return;
        const spot = t.closest('.ox-spot');
        if (spot) {
            const r = spot.getBoundingClientRect();
            spot.style.setProperty('--mx', `${e.clientX - r.left}px`);
            spot.style.setProperty('--my', `${e.clientY - r.top}px`);
        }
        if (reduced()) return;
        const tilt = t.closest('.ox-tilt');
        if (tilt) {
            const r = tilt.getBoundingClientRect();
            const px = (e.clientX - r.left) / r.width - 0.5;
            const py = (e.clientY - r.top) / r.height - 0.5;
            tilt.style.setProperty('--rx', `${(-py * 6).toFixed(2)}deg`);
            tilt.style.setProperty('--ry', `${(px * 8).toFixed(2)}deg`);
        }
        const mag = t.closest('.ox-mag');
        if (mag) {
            const r = mag.getBoundingClientRect();
            mag.style.setProperty('--tx', `${((e.clientX - (r.left + r.width / 2)) * 0.22).toFixed(1)}px`);
            mag.style.setProperty('--ty', `${((e.clientY - (r.top + r.height / 2)) * 0.3).toFixed(1)}px`);
        }
        const h = t.closest('.ox-hero');
        if (h) {
            const r = h.getBoundingClientRect();
            h.style.setProperty('--hx', `${e.clientX - r.left}px`);
            h.style.setProperty('--hy', `${e.clientY - r.top}px`);
        }
    }, []);

    const onOut = useCallback((e) => {
        const t = e.target.closest && e.target.closest('.ox-tilt, .ox-mag');
        if (t && !t.contains(e.relatedTarget)) {
            ['--rx', '--ry', '--tx', '--ty'].forEach((p) => t.style.removeProperty(p));
        }
    }, []);

    /* programmes: filter */
    const calls = programmes.items.filter((p) =>
        (phaseFilter === 'all' || p.phase === phaseFilter) && (areaFilter === 'all' || p.areas.includes(areaFilter)));
    const phaseInfo = programmes.phases.find((p) => p.n === phaseFilter);
    const filtered = phaseFilter !== 'all' || areaFilter !== 'all';
    const clearFilters = () => { setPhaseFilter('all'); setAreaFilter('all'); };

    const toggleReady = (i) => setReady((s) => { const n = new Set(s); if (n.has(i)) n.delete(i); else n.add(i); return n; });

    const area = areas.items[areaIdx];
    const st = how.steps[step];

    return (
        <div className="ox" ref={rootRef} onMouseMove={onMove} onMouseOut={onOut}>

            {/* ===================== HERO ===================== */}
            <section className="ox-hero" id="top">
                <div className="ox-curtain" aria-hidden="true"><span>Opportunities</span></div>
                <div className="ox-aurora" aria-hidden="true"><i /><i /><i /></div>
                <div className="ox-grid" aria-hidden="true" />
                <div className="ox-glow" aria-hidden="true" />

                <div className="ox-wrap ox-hero-in">
                    <div className="ox-hero-copy">
                        <p className="ox-eyebrow"><i />{hero.eyebrow}</p>
                        <h1 className="ox-title">
                            {hero.titleLines.map((l, i) => (
                                <span className="ox-ln" key={l}>
                                    <span className={l === hero.highlight ? 'ox-hl' : ''} style={{ '--i': i }}>{l}</span>
                                </span>
                            ))}
                        </h1>
                        <p className="ox-hero-lede">{hero.lede}</p>
                        <div className="ox-hero-cta">
                            <a className="ox-btn ox-mag" href={links.apply}>{hero.primaryButton}<Arrow /></a>
                            <button className="ox-btn ox-btn--ghost ox-mag" onClick={() => goTo('ways')}>{hero.secondaryButton}</button>
                        </div>
                    </div>

                    <figure className="ox-hero-map">
                        <OrbitMap />
                        <figcaption className="ox-map-note">{hero.mapLabel}</figcaption>
                    </figure>
                </div>

                <div className="ox-wrap">
                    <div className="ox-stats">
                        {heroStats.map((s, i) => (
                            <div className="ox-stat" key={s.label} style={{ '--i': i }}>
                                <strong><Counter value={s.value} prefix={s.prefix} suffix={s.suffix} decimals={s.decimals} delay={1700 + i * 120} /></strong>
                                <span>{s.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===================== STICKY MENU ===================== */}
            <nav className="ox-subnav" aria-label="Opportunities sections">
                <div className="ox-wrap ox-subnav-scroll">
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
                <div className="ox-progress" aria-hidden="true"><span /></div>
            </nav>

            {/* ===================== TICKER ===================== */}
            <div className="ox-ticker" aria-hidden="true">
                <div className="ox-ticker-track">
                    {[0, 1].map((k) => (
                        <ul key={k}>{ticker.map((t) => <li key={t + k}>{t}</li>)}</ul>
                    ))}
                </div>
            </div>

            {/* ===================== 01 WAYS TO PARTICIPATE ===================== */}
            <section className="ox-sec ox-light" id="ways">
                <div className="ox-wrap">
                    <Head n={0} label="Ways to participate" title={ways.heading} lede={ways.lede} />
                    <div className="ox-ways">
                        {ways.items.map((w, i) => (
                            <article className="ox-way ox-rv" style={D(i)} key={w.who}>
                                <div className="ox-way-in ox-spot ox-tilt">
                                    <span className="ox-way-num" aria-hidden="true">{pad(i)}</span>
                                    <p className="ox-way-kind">{w.kind}</p>
                                    <h3>{w.who}</h3>
                                    <p className="ox-way-text">{w.text}</p>
                                    <ul className="ox-ticks">{w.points.map((p) => <li key={p}>{p}</li>)}</ul>
                                    <div className="ox-way-foot">
                                        <b className="ox-out">{w.outcome}</b>
                                        <a className="ox-link" href={links.apply}>{w.cta}<Arrow /></a>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===================== 02 TESTING AND INNOVATION AREAS ===================== */}
            <section className="ox-sec ox-dark" id="areas">
                <div className="ox-wrap">
                    <Head n={1} label="Testing and innovation areas" title={areas.heading} lede={areas.lede} />

                    <div
                        className="ox-tabs ox-rv"
                        role="tablist"
                        aria-label="Testing and innovation areas"
                        onKeyDown={(e) => arrowNav(e, areaIdx, areas.items.length, setAreaIdx)}
                    >
                        {areas.items.map((a, i) => (
                            <button key={a.id} role="tab" aria-selected={areaIdx === i} tabIndex={areaIdx === i ? 0 : -1} className={areaIdx === i ? 'is-on' : ''} onClick={() => setAreaIdx(i)}>
                                <span>{pad(i)}</span>{a.title}
                            </button>
                        ))}
                    </div>

                    <div className="ox-areas" key={area.id} role="tabpanel">
                        <span className="ox-bignum" aria-hidden="true">{pad(areaIdx)}</span>
                        <div className="ox-area-head ox-pop">
                            <h3>{area.title}</h3>
                            <p className="ox-area-sum">{area.summary}</p>
                            {area.fact && <p className="ox-fact">{area.fact}</p>}
                        </div>
                        <div className="ox-area-cols">
                            <div className="ox-card ox-pop" style={DS(1)}>
                                <h4 className="ox-sub">{areas.labels.scenarios}</h4>
                                <ul className="ox-ticks">{area.scenarios.map((s) => <li key={s}>{s}</li>)}</ul>
                            </div>
                            <div className="ox-card ox-pop" style={DS(2)}>
                                <h4 className="ox-sub">{areas.labels.outputs}</h4>
                                <ul className="ox-outs">{area.outputs.map((o) => <li key={o}>{o}</li>)}</ul>
                            </div>
                            <div className="ox-card full ox-pop" style={DS(3)}>
                                <h4 className="ox-sub">{areas.labels.facilities}</h4>
                                <div className="ox-chips">{area.facilities.map((f) => <span key={f}>{f}</span>)}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ===================== 03 OPEN PROGRAMMES AND CALLS ===================== */}
            <section className="ox-sec ox-light" id="programmes">
                <div className="ox-wrap">
                    <Head n={2} label="Open programmes and calls" title={programmes.heading} lede={programmes.lede} />

                    <div className="ox-phases ox-rv" role="group" aria-label="Filter by phase">
                        {programmes.phases.map((p) => {
                            const n = programmes.items.filter((c) => c.phase === p.n).length;
                            const on = phaseFilter === p.n;
                            return (
                                <button key={p.n} className={`ox-phase ${on ? 'is-on' : ''}`} aria-pressed={on} onClick={() => setPhaseFilter(on ? 'all' : p.n)}>
                                    <span className="ox-phase-top"><b>Phase {p.n}</b><em>{n} {n === 1 ? 'window' : 'windows'}</em></span>
                                    <strong>{p.when}</strong>
                                    <span className="ox-phase-name">{p.name}</span>
                                </button>
                            );
                        })}
                    </div>

                    <div className="ox-filters ox-rv" role="group" aria-label="Filter by testing area" style={D(1)}>
                        <span className="ox-filters-label">Area</span>
                        <button className={`ox-fchip ${areaFilter === 'all' ? 'is-on' : ''}`} onClick={() => setAreaFilter('all')} aria-pressed={areaFilter === 'all'}>All</button>
                        {areas.items.map((a) => (
                            <button key={a.id} className={`ox-fchip ${areaFilter === a.id ? 'is-on' : ''}`} onClick={() => setAreaFilter(a.id)} aria-pressed={areaFilter === a.id}>{a.title}</button>
                        ))}
                    </div>

                    <p className="ox-count" aria-live="polite">
                        <span>
                            Showing {calls.length} of {programmes.items.length} windows
                            {phaseInfo && <> &middot; {phaseInfo.when}: {phaseInfo.name}</>}
                        </span>
                        {filtered && <button className="ox-link" onClick={clearFilters}>Clear filters</button>}
                    </p>

                    {calls.length === 0 ? (
                        <div className="ox-empty ox-pop">
                            <p>No window matches these filters.</p>
                            <button className="ox-link" onClick={clearFilters}>Clear filters</button>
                        </div>
                    ) : (
                        <ul className="ox-calls">
                            {calls.map((p, i) => {
                                const on = openCall === p.id;
                                return (
                                    <li className={`ox-call ox-pop ${on ? 'is-open' : ''}`} style={DS(i)} key={p.id}>
                                        <button className="ox-call-row" onClick={() => setOpenCall(on ? null : p.id)} aria-expanded={on}>
                                            <span className="ox-call-phase">Phase {p.phase}</span>
                                            <span className="ox-call-main"><strong>{p.title}</strong><span>{p.summary}</span></span>
                                            <span className="ox-call-when">{p.window}</span>
                                            <span className={`ox-call-status ox-st-${p.status.key}`}>{p.status.label}</span>
                                            <i className="ox-call-plus" aria-hidden="true" />
                                        </button>
                                        <div className="ox-call-body">
                                            <div className="ox-call-inner">
                                                <div>
                                                    <h4 className="ox-sub">{programmes.labels.scope}</h4>
                                                    <ul className="ox-ticks">{p.scope.map((s) => <li key={s}>{s}</li>)}</ul>
                                                </div>
                                                <div>
                                                    <h4 className="ox-sub">{programmes.labels.provided}</h4>
                                                    <ul className="ox-ticks">{p.provided.map((s) => <li key={s}>{s}</li>)}</ul>
                                                </div>
                                                <div>
                                                    <h4 className="ox-sub">{programmes.labels.who}</h4>
                                                    <p className="ox-call-who">{p.who}</p>
                                                    <div className="ox-call-cta">
                                                        <a className="ox-btn ox-btn--sm" href={links.apply}>Register interest<Arrow /></a>
                                                        <a className="ox-btn ox-btn--ghost ox-btn--sm" href={links.contact}>Request the brief</a>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                    <p className="ox-source ox-rv">{programmes.note}</p>
                </div>
            </section>

            {/* ===================== 04 HOW TO PARTICIPATE ===================== */}
            <section className="ox-sec ox-dark" id="how">
                <div className="ox-wrap">
                    <Head n={3} label="How to participate" title={how.heading} lede={how.lede} />

                    <div
                        className="ox-track ox-rv"
                        role="tablist"
                        aria-label="Participation steps"
                        style={{ '--p': step / (how.steps.length - 1) }}
                        onKeyDown={(e) => arrowNav(e, step, how.steps.length, setStep)}
                    >
                        <div className="ox-track-line" aria-hidden="true"><span /></div>
                        {how.steps.map((s, i) => (
                            <button
                                key={s.title}
                                role="tab"
                                aria-selected={step === i}
                                tabIndex={step === i ? 0 : -1}
                                className={`ox-step ${step === i ? 'is-on' : ''} ${i < step ? 'is-done' : ''}`}
                                onClick={() => setStep(i)}
                            >
                                <span className="ox-step-dot">{i + 1}</span>
                                <span className="ox-step-when">{s.when}</span>
                                <span className="ox-step-name">{s.title}</span>
                            </button>
                        ))}
                    </div>

                    <div className="ox-how-panel" key={step} role="tabpanel">
                        <div className="ox-how-title ox-pop">
                            <p className="ox-chip">Step {step + 1} of {how.steps.length}</p>
                            <h3>{st.title}</h3>
                        </div>
                        <div className="ox-card ox-how-col ox-pop" style={DS(1)}><h4 className="ox-sub">{how.labels.you}</h4><p>{st.you}</p></div>
                        <div className="ox-card ox-how-col ox-pop" style={DS(2)}><h4 className="ox-sub">{how.labels.we}</h4><p>{st.we}</p></div>
                        <div className="ox-card ox-how-col ox-how-col--out ox-pop" style={DS(3)}><h4 className="ox-sub">{how.labels.out}</h4><p>{st.out}</p></div>
                    </div>
                    <div className="ox-how-nav">
                        <button className="ox-btn ox-btn--ghost ox-btn--sm" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}>Previous step</button>
                        {step < how.steps.length - 1
                            ? <button className="ox-btn ox-btn--sm" onClick={() => setStep(step + 1)}>Next step<Arrow /></button>
                            : <a className="ox-btn ox-btn--sm" href={links.apply}>Apply to participate<Arrow /></a>}
                    </div>

                    <div className="ox-prep ox-rv">
                        <div className="ox-prep-head">
                            <div>
                                <h3>{how.prepTitle}</h3>
                                <p className="ox-prep-note">{how.prepNote}</p>
                            </div>
                            <Ring value={ready.size} total={how.prep.length} />
                        </div>
                        <div className="ox-prep-list">
                            {how.prep.map((p, i) => (
                                <button key={p} className={`ox-prep-item ${ready.has(i) ? 'is-on' : ''}`} role="checkbox" aria-checked={ready.has(i)} onClick={() => toggleReady(i)}>
                                    <i aria-hidden="true" />{p}
                                </button>
                            ))}
                        </div>
                        <p className="sr-only" aria-live="polite" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>{ready.size} of {how.prep.length} ready</p>
                        {ready.size === how.prep.length && (
                            <div className="ox-prep-done">
                                <span>You have everything. Time to apply.</span>
                                <a className="ox-btn ox-btn--sm" href={links.apply}>Apply to participate<Arrow /></a>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* ===================== 05 PARTICIPANT BENEFITS ===================== */}
            <section className="ox-sec ox-yellow" id="benefits">
                <div className="ox-wrap">
                    <Head n={4} label="Participant benefits" title={benefits.heading} lede={benefits.lede} />

                    <div className="ox-bgrid">
                        {benefits.groups.map((g, i) => (
                            <article className="ox-bcard ox-rv" style={D(i)} key={g.title}>
                                <span className="ox-bcard-n">{pad(i)}</span>
                                <h3>{g.title}</h3>
                                <p>{g.text}</p>
                                <ul className="ox-ticks">{g.points.map((p) => <li key={p}>{p}</li>)}</ul>
                            </article>
                        ))}
                    </div>

                    <div className="ox-partners ox-rv">
                        <h3 className="ox-sub">{benefits.partnersTitle}</h3>
                        <div className="ox-chips">{benefits.partners.map((p) => <span key={p}>{p}</span>)}</div>
                    </div>

                    <h3 className="ox-sub ox-places-title ox-rv">{benefits.placesTitle}</h3>
                    <div className="ox-gal">
                        {benefits.places.map((p, i) => (
                            <figure className="ox-rv" style={D(i)} key={p.image}>
                                <img src={images[p.image]} alt={p.caption} loading="lazy" />
                                <figcaption>{p.caption}</figcaption>
                            </figure>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===================== CLOSING CTA ===================== */}
            <section className="ox-sec ox-dark ox-cta" id="cta">
                <div className="ox-wrap ox-cta-in">
                    <div>
                        <h2 className="ox-h ox-rv">{closing.heading}</h2>
                        <p className="ox-lede ox-rv" style={D(1)}>{closing.text}</p>
                    </div>
                    <div className="ox-cta-btns ox-rv" style={D(2)}>
                        <a className="ox-btn ox-mag" href={links.apply}>Apply to participate<Arrow /></a>
                        <a className="ox-btn ox-btn--ghost ox-mag" href={links.services}>See our services<Arrow /></a>
                        <a className="ox-btn ox-btn--ghost ox-mag" href={links.contact}>Contact the team<Arrow /></a>
                    </div>
                </div>
            </section>

            {/* floating apply button, appears after the hero */}
            <div className={`ox-fab ${showFab ? 'is-on' : ''}`}>
                <a className="ox-btn ox-btn--sm" href={links.apply} tabIndex={showFab ? 0 : -1}>Apply to participate<Arrow /></a>
            </div>
        </div>
    );
}

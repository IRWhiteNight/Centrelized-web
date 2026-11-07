import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import '../../../css/PSB-css/psb-apply.css';

import {
    links, page, hero, heroStats, sections, ticker, who, areas, resources, process as flow, form as cfg, prepare, faq, closing,
} from '../../data/PSB-data/applyData';

/* ==========================================================================
   Helpers
========================================================================== */

const D = (i) => ({ '--d': Math.min(i, 8) * 80 });
const pad = (n) => String(n + 1).padStart(2, '0');
const reduced = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

function useReveal(rootRef) {
    useEffect(() => {
        const root = rootRef.current;
        if (!root) return undefined;
        if (reduced() || !('IntersectionObserver' in window)) { root.classList.add('ap-static'); return undefined; }
        const io = new IntersectionObserver((entries) => {
            entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
        }, { threshold: 0.08, rootMargin: '0px 0px -4% 0px' });
        const scan = () => root.querySelectorAll('.ap-rv:not(.in):not([data-o])').forEach((n) => { n.dataset.o = '1'; io.observe(n); });
        scan();
        const mo = new MutationObserver(scan);
        mo.observe(root, { childList: true, subtree: true });
        return () => { io.disconnect(); mo.disconnect(); };
    }, [rootRef]);
}

function Counter({ value, decimals = 0, suffix = '', delay = 0 }) {
    const ref = useRef(null);
    const [v, setV] = useState(reduced() ? value : 0);
    useEffect(() => {
        if (reduced()) { setV(value); return undefined; }
        const el = ref.current;
        let raf = 0; let timer = 0;
        const run = () => {
            const t0 = performance.now();
            const tick = (t) => {
                const p = Math.min(1, (t - t0) / 1600);
                setV(value * (p === 1 ? 1 : 1 - Math.pow(2, -10 * p)));
                if (p < 1) raf = requestAnimationFrame(tick); else setV(value);
            };
            raf = requestAnimationFrame(tick);
        };
        const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { io.disconnect(); timer = setTimeout(run, delay); } }, { threshold: 0.4 });
        io.observe(el);
        return () => { io.disconnect(); clearTimeout(timer); cancelAnimationFrame(raf); };
    }, [value, delay]);
    return <span ref={ref}>{v.toFixed(decimals)}{suffix && <small>{suffix}</small>}</span>;
}

const Arrow = ({ back }) => (
    <svg className="ap-arrow" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" style={back ? { transform: 'scaleX(-1)' } : undefined}>
        <path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);
const Tick = () => (
    <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d="M4 12l6 6L20 6" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
);

function Head({ n, label, title, lede }) {
    return (
        <header className="ap-head">
            <p className="ap-kicker ap-rv"><span>{pad(n)}</span>{label}</p>
            <h2 className="ap-h ap-rv" style={D(1)}>{title}</h2>
            {lede && <p className="ap-lede ap-rv" style={D(2)}>{lede}</p>}
        </header>
    );
}

/* One section = sticky label bar + (optional) sticky side rail + content, always full width */
function Sec({ id, tone, n, label, title, lede, rail, children, className = '' }) {
    return (
        <section className={`ap-sec ap-sec--${tone} ${className}`} id={id} style={{ zIndex: n + 2 }}>
            <div className="ap-bar">
                <div className="ap-wrap ap-bar-in">
                    <span className="ap-bar-n">{pad(n)}</span>
                    <span className="ap-bar-l">{label}</span>
                    <span className="ap-bar-t">{title}</span>
                    <i className="ap-bar-p" aria-hidden="true"><b /></i>
                </div>
            </div>
            <div className="ap-wrap ap-secbody">
                {rail ? (
                    <div className="ap-split">
                        <aside className="ap-rail">
                            <div className="ap-rail-in" data-n={pad(n)}>
                                <Head n={n} label={label} title={title} lede={lede} />
                                {rail}
                            </div>
                        </aside>
                        <div className="ap-main">{children}</div>
                    </div>
                ) : (
                    <>
                        <Head n={n} label={label} title={title} lede={lede} />
                        {children}
                    </>
                )}
            </div>
        </section>
    );
}

/* ==========================================================================
   Hero map: schematic of the sandbox with the two planned corridors
========================================================================== */

function SiteMap() {
    return (
        <svg className="ap-map" viewBox="0 0 640 520" role="img" aria-label={hero.mapLabel} preserveAspectRatio="xMidYMid meet">
            <defs>
                <radialGradient id="apGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0" stopColor="#22d3ee" stopOpacity=".32" />
                    <stop offset="1" stopColor="#22d3ee" stopOpacity="0" />
                </radialGradient>
                <linearGradient id="apRoute" x1="0" x2="1">
                    <stop offset="0" stopColor="#5b7cff" />
                    <stop offset="1" stopColor="#b6f542" />
                </linearGradient>
            </defs>
            <g className="ap-contours" fill="none">
                <path d="M70 70C170 28 320 40 420 90S580 150 600 250 540 400 440 450 230 490 150 430 40 300 70 190 60 90 70 70Z" />
                <path d="M100 100C200 64 330 76 410 122S550 180 568 256 512 388 424 424 240 458 170 406 70 298 88 202 84 120 100 100Z" />
                <path d="M130 130C220 100 320 110 390 150S510 210 530 266 480 374 400 404 250 434 190 384 100 294 115 214 110 150 130 130Z" />
                <path className="ap-coast" d="M24 60C54 150 80 220 62 300S24 400 52 500" />
            </g>
            <circle cx="320" cy="270" r="190" fill="url(#apGlow)" />
            <g className="ap-zone"><circle cx="320" cy="270" r="52" /><circle cx="320" cy="270" r="96" /><circle cx="320" cy="270" r="140" /></g>

            <polygon className="ap-site" points="290,236 350,300 286,304" />
            <polygon className="ap-phase1" points="318,282 350,300 312,302" />

            <path id="apE" className="ap-route ap-route-e" d="M320 270C380 240 450 200 540 168C560 150 545 128 520 132" />
            <path id="apW" className="ap-route ap-route-w" d="M320 270C260 240 190 240 128 262C100 300 80 350 60 420" />

            <g className="ap-drone"><circle r="5" /><circle r="12" className="halo" />
                <animateMotion dur="8s" begin="2.4s" repeatCount="indefinite" keyPoints="0;1;0" keyTimes="0;.5;1" calcMode="linear"><mpath href="#apE" /></animateMotion>
            </g>
            <g className="ap-drone"><circle r="5" /><circle r="12" className="halo" />
                <animateMotion dur="11s" begin="3s" repeatCount="indefinite" keyPoints="0;1;0" keyTimes="0;.5;1" calcMode="linear"><mpath href="#apW" /></animateMotion>
            </g>

            <g className="ap-node ap-n1" transform="translate(540 168)"><circle r="6" /><text x="-12" y="-16" textAnchor="end">Timah Tasoh Dam</text></g>
            <g className="ap-node ap-n2" transform="translate(128 262)"><circle r="6" /><text x="-6" y="-14">Kuala Perlis</text></g>
            <g className="ap-node ap-n3" transform="translate(60 420)"><circle r="6" /><text x="14" y="5">Langkawi</text></g>
            <g className="ap-node ap-n0" transform="translate(320 270)">
                <circle className="ap-ping" r="10" /><circle className="ap-ping ap-ping2" r="10" />
                <rect x="-8" y="-8" width="16" height="16" transform="rotate(45)" />
                <text x="22" y="40">Sungai Batu Pahat</text>
                <text x="22" y="58" className="sub">Perlis Airspace Sandbox</text>
            </g>
        </svg>
    );
}

function Route({ flip }) {
    return (
        <svg className="ap-cmap" viewBox="0 0 400 90" aria-hidden="true" preserveAspectRatio="none">
            <path className="ap-cpath" d={flip ? 'M10 70C90 10 150 90 230 40S340 20 390 30' : 'M10 30C70 80 150 10 220 50S330 70 390 20'} />
            <circle className="ap-cdot" r="5"><animateMotion dur="5s" repeatCount="indefinite" path={flip ? 'M10 70C90 10 150 90 230 40S340 20 390 30' : 'M10 30C70 80 150 10 220 50S330 70 390 20'} /></circle>
            <circle cx="10" cy={flip ? 70 : 30} r="6" className="ap-cend" />
            <circle cx="390" cy={flip ? 30 : 20} r="6" className="ap-cend" />
        </svg>
    );
}

/* ==========================================================================
   Form helpers
========================================================================== */

const emptyForm = () => ({
    type: '', org: '', name: '', role: '', email: '', phone: '', country: 'Malaysia', website: '',
    route: '', areas: [], title: '', desc: '', aircraft: '', corridor: '', timeframe: '', duration: '', partners: '',
    needs: [], permits: '', safety: '', crew: '', consent: false, hp: '',
});

const makeRef = () => {
    const d = new Date();
    const s = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
    const r = Math.random().toString(36).slice(2, 6).toUpperCase();
    return `PAS-${s}-${r}`;
};

function Field({ id, label, req, err, hint, children }) {
    return (
        <div className={`ap-field ${err ? 'is-bad' : ''}`}>
            <label htmlFor={`ap-${id}`}>{label}{req && <b aria-hidden="true"> *</b>}</label>
            {children}
            {hint && !err && <p className="ap-hint">{hint}</p>}
            {err && <p className="ap-err" role="alert">{err}</p>}
        </div>
    );
}

function Chips({ name, options, value, onChange, multi, legend, req, err }) {
    const has = (o) => (multi ? value.includes(o) : value === o);
    return (
        <fieldset className={`ap-chips ${err ? 'is-bad' : ''}`}>
            <legend>{legend}{req && <b aria-hidden="true"> *</b>}</legend>
            <div>
                {options.map((o) => (
                    <label key={o} className={has(o) ? 'is-on' : ''}>
                        <input
                            type={multi ? 'checkbox' : 'radio'}
                            name={name}
                            value={o}
                            checked={has(o)}
                            onChange={() => (multi ? onChange(has(o) ? value.filter((x) => x !== o) : [...value, o]) : onChange(o))}
                        />
                        <span className="ap-chip-box" aria-hidden="true"><Tick /></span>{o}
                    </label>
                ))}
            </div>
            {err && <p className="ap-err" role="alert">{err}</p>}
        </fieldset>
    );
}

/* ==========================================================================
   PAGE
========================================================================== */

export default function Apply() {
    const rootRef = useRef(null);
    const formTop = useRef(null);
    const [activeSection, setActiveSection] = useState(sections[0].id);
    const [area, setArea] = useState(0);
    const [phase, setPhase] = useState(0);
    const [faqOpen, setFaqOpen] = useState(0);
    const [ready, setReady] = useState({});

    const [data, setData] = useState(emptyForm);
    const [step, setStep] = useState(0);
    const [errs, setErrs] = useState({});
    const [state, setState] = useState('idle'); /* idle | loading | done | fail */
    const [ref, setRef] = useState('');
    const [saved, setSaved] = useState(false);
    const loaded = useRef(false);

    useReveal(rootRef);

    /* ---------- scroll: progress, parallax, per-section progress, active menu ---------- */
    useEffect(() => {
        const root = rootRef.current;
        let raf = 0;
        const update = () => {
            raf = 0;
            const y = window.scrollY;
            const vh = window.innerHeight;
            const h = root.scrollHeight - vh;
            root.style.setProperty('--sy', `${Math.min(y, 1000)}`);
            root.style.setProperty('--progress', h > 0 ? clamp(y / h).toFixed(4) : 0);
            const line = vh * 0.35;
            let cur = sections[0].id;
            sections.forEach((s) => {
                const el = document.getElementById(s.id);
                if (!el) return;
                const r = el.getBoundingClientRect();
                if (r.top <= line) cur = s.id;
                el.style.setProperty('--sp', clamp((vh * 0.2 - r.top) / Math.max(1, r.height - vh * 0.5)).toFixed(3));
            });
            setActiveSection(cur);
        };
        const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
        update();
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll);
        return () => { cancelAnimationFrame(raf); window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); };
    }, []);

    useEffect(() => {
        const a = rootRef.current.querySelector('.ap-subnav a.is-active');
        const box = rootRef.current.querySelector('.ap-subnav-scroll');
        if (a && box) box.scrollTo({ left: a.offsetLeft - box.clientWidth / 2 + a.clientWidth / 2, behavior: reduced() ? 'auto' : 'smooth' });
    }, [activeSection]);

    const goTo = useCallback((id) => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'start' });
    }, []);

    /* pointer spotlight on cards */
    const onMove = useCallback((e) => {
        const t = e.target.closest && e.target.closest('.ap-spot');
        if (!t) return;
        const r = t.getBoundingClientRect();
        t.style.setProperty('--mx', `${e.clientX - r.left}px`);
        t.style.setProperty('--my', `${e.clientY - r.top}px`);
    }, []);

    /* ---------- draft: restore once, save while typing (never throws) ---------- */
    useEffect(() => {
        try {
            const raw = window.localStorage.getItem(cfg.draftKey);
            if (raw) {
                const d = JSON.parse(raw);
                if (d && d.data) { setData({ ...emptyForm(), ...d.data, consent: false, hp: '' }); setStep(Math.min(d.step || 0, cfg.steps.length - 2)); setSaved(true); }
            }
        } catch (e) { /* storage blocked */ }
        loaded.current = true;
    }, []);
    useEffect(() => {
        if (!loaded.current || state === 'done') return undefined;
        const t = setTimeout(() => {
            try {
                const touched = Object.entries(data).some(([k, v]) => !['country', 'consent', 'hp'].includes(k) && (Array.isArray(v) ? v.length : v));
                if (touched) { window.localStorage.setItem(cfg.draftKey, JSON.stringify({ data, step })); setSaved(true); }
            } catch (e) { /* storage blocked */ }
        }, 500);
        return () => clearTimeout(t);
    }, [data, step, state]);
    const clearDraft = () => { try { window.localStorage.removeItem(cfg.draftKey); } catch (e) { /* ignore */ } setSaved(false); };

    /* ---------- form logic ---------- */
    const set = (k) => (e) => {
        const v = e && e.target ? (e.target.type === 'checkbox' ? e.target.checked : e.target.value) : e;
        setData((d) => ({ ...d, [k]: v }));
        if (errs[k]) setErrs((x) => ({ ...x, [k]: undefined }));
        if (state === 'fail') setState('idle');
    };

    const validate = (s) => {
        const e = {};
        if (s === 0) {
            if (!data.type) e.type = 'Please choose the kind of applicant.';
            if (data.org.trim().length < 2) e.org = 'Please enter your organisation.';
            if (data.name.trim().length < 2) e.name = 'Please enter the contact name.';
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) e.email = 'Please enter a valid email address.';
            if (data.phone && !/^[+\d][\d\s()-]{6,}$/.test(data.phone.trim())) e.phone = 'Please enter a valid phone number.';
        }
        if (s === 1) {
            if (!data.route) e.route = 'Please choose how you want to take part.';
            if (!data.areas.length) e.areas = 'Please choose at least one test area.';
            if (data.title.trim().length < 4) e.title = 'Please give your activity a short title.';
            if (data.desc.trim().length < 30) e.desc = 'Please describe the activity in at least a couple of sentences (30 characters).';
            if (!data.timeframe) e.timeframe = 'Please choose a preferred timeframe.';
        }
        if (s === 2) { if (!data.permits) e.permits = 'Please tell us where your permits stand.'; }
        if (s === 3) { if (!data.consent) e.consent = 'Please tick the box to confirm.'; }
        return e;
    };

    const scrollForm = () => { if (formTop.current) formTop.current.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'start' }); };

    const focusFirstError = () => {
        requestAnimationFrame(() => {
            const el = rootRef.current.querySelector('.ap-field.is-bad input, .ap-field.is-bad textarea, .ap-field.is-bad select, .ap-chips.is-bad input, .ap-check.is-bad input');
            if (el) el.focus();
        });
    };

    const next = () => {
        const e = validate(step);
        setErrs(e);
        if (Object.keys(e).length) { focusFirstError(); return; }
        setStep(step + 1);
        scrollForm();
    };
    const back = () => { setErrs({}); setStep(Math.max(0, step - 1)); scrollForm(); };
    const jump = (i) => {
        if (i <= step) { setErrs({}); setStep(i); scrollForm(); return; }
        for (let s = step; s < i; s += 1) {
            const e = validate(s);
            if (Object.keys(e).length) { setStep(s); setErrs(e); focusFirstError(); return; }
        }
        setStep(i); scrollForm();
    };

    const submit = async (ev) => {
        ev.preventDefault();
        if (step < cfg.steps.length - 1) { next(); return; }
        for (let s = 0; s < cfg.steps.length; s += 1) {
            const e = validate(s);
            if (Object.keys(e).length) { setStep(s); setErrs(e); focusFirstError(); return; }
        }
        const reference = makeRef();
        if (data.hp) { setRef(reference); setState('done'); return; } /* honeypot */
        setState('loading');
        try {
            if (cfg.endpoint) {
                const { hp, consent, ...payload } = data;
                const r = await fetch(cfg.endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reference, ...payload }) });
                if (!r.ok) throw new Error('failed');
            } else {
                await new Promise((res) => setTimeout(res, 1000));
            }
            setRef(reference);
            setState('done');
            clearDraft();
            scrollForm();
        } catch (err) { setState('fail'); }
    };

    const reset = () => { setData(emptyForm()); setErrs({}); setStep(0); setState('idle'); setRef(''); clearDraft(); };

    const summaryRows = useMemo(() => ([
        ['Applicant type', data.type], ['Organisation', data.org], ['Contact', `${data.name}${data.role ? `, ${data.role}` : ''}`],
        ['Email', data.email], ['Phone', data.phone], ['Website', data.website],
        ['Route', data.route], ['Test areas', data.areas.join('; ')], ['Activity', data.title], ['Description', data.desc],
        ['Aircraft / system', data.aircraft], ['Corridor', data.corridor], ['Timeframe', data.timeframe], ['Duration', data.duration], ['Partners', data.partners],
        ['Facilities needed', data.needs.join('; ')], ['Permits', data.permits], ['Crew', data.crew], ['Safety notes', data.safety],
    ].filter(([, v]) => v && String(v).trim())), [data]);

    const downloadSummary = () => {
        const txt = `Perlis Airspace Sandbox — application ${ref}\n${'='.repeat(48)}\n\n${summaryRows.map(([k, v]) => `${k}: ${v}`).join('\n')}\n`;
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([txt], { type: 'text/plain' }));
        a.download = `${ref}.txt`;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(a.href), 500);
    };

    const mailFallback = `mailto:${cfg.fallbackEmail}?subject=${encodeURIComponent(`Sandbox application: ${data.title || data.org}`)}&body=${encodeURIComponent(summaryRows.map(([k, v]) => `${k}: ${v}`).join('\n'))}`;
    const pickRoute = (v) => { setData((d) => ({ ...d, route: v })); goTo('form'); };
    const pickArea = (v) => { setData((d) => ({ ...d, areas: d.areas.includes(v) ? d.areas : [...d.areas, v] })); goTo('form'); };

    const ph = flow.steps;
    const filled = Math.round(((state === 'done' ? cfg.steps.length : step) / cfg.steps.length) * 100);
    const totalReady = prepare.groups.reduce((n, g) => n + g.items.length, 0);
    const doneReady = Object.values(ready).filter(Boolean).length;

    return (
        <div className="ap" ref={rootRef} onMouseMove={onMove} aria-label={page.title}>
            <div className="ap-topbar" aria-hidden="true"><span /></div>

            {/* ===================== HERO ===================== */}
            <section className="ap-hero" id="top">
                <div className="ap-aurora" aria-hidden="true"><i /><i /><i /></div>
                <div className="ap-hero-grid" aria-hidden="true" />
                {hero.video && (
                    <video className="ap-hero-video" src={hero.video} poster={hero.poster} autoPlay muted loop playsInline aria-hidden="true" />
                )}

                <div className="ap-wrap ap-hero-in">
                    <div className="ap-hero-copy">
                        <p className="ap-eyebrow"><i />{hero.eyebrow}</p>
                        <h1 className="ap-hero-title">
                            {hero.titleLines.map((l, i) => (
                                <span className="ap-ln" key={l}><span className={l === hero.highlight ? 'ap-hl' : ''} style={{ '--i': i }}>{l}</span></span>
                            ))}
                        </h1>
                        <p className="ap-hero-lede">{hero.lede}</p>
                        <div className="ap-hero-cta">
                            <button className="ap-btn" onClick={() => goTo('form')}>{hero.primaryButton}<Arrow /></button>
                            <button className="ap-btn ap-btn--ghost" onClick={() => goTo('process')}>{hero.secondaryButton}</button>
                        </div>
                    </div>
                    <div className="ap-hero-viz" aria-hidden="false">
                        <SiteMap />
                        <p className="ap-map-note">{hero.mapLabel}</p>
                    </div>
                </div>

                <div className="ap-stats">
                    {heroStats.map((s, i) => (
                        <div className="ap-stat" key={s.label} style={{ '--i': i }}>
                            <strong><Counter value={s.value} decimals={s.decimals || 0} suffix={s.suffix} delay={1300 + i * 120} /></strong>
                            <span>{s.label}</span>
                        </div>
                    ))}
                </div>
                <div className="ap-scroll-cue" aria-hidden="true"><span /></div>
            </section>

            {/* ===================== STICKY MENU ===================== */}
            <nav className="ap-subnav" aria-label="Apply sections">
                <div className="ap-wrap ap-subnav-scroll">
                    <ul>
                        {sections.map((s) => (
                            <li key={s.id}>
                                <a href={`#${s.id}`} className={activeSection === s.id ? 'is-active' : ''} aria-current={activeSection === s.id ? 'true' : undefined} onClick={(e) => { e.preventDefault(); goTo(s.id); }}>{s.label}</a>
                            </li>
                        ))}
                    </ul>
                    <button className="ap-btn ap-btn--sm ap-subnav-cta" onClick={() => goTo('form')}>Apply<Arrow /></button>
                </div>
            </nav>

            <div className="ap-ticker" aria-hidden="true">
                <div className="ap-ticker-track">
                    {[0, 1].map((k) => <ul key={k}>{ticker.map((t) => <li key={t + k}>{t}</li>)}</ul>)}
                </div>
            </div>

            {/* ===================== 01 WHO ===================== */}
            <Sec id="who" tone="light" n={0} label="Who can apply" title={who.heading} lede={who.lede}>
                <div className="ap-grid3">
                    {who.items.map((w, i) => (
                        <article className="ap-card ap-spot ap-rv" style={D(i)} key={w.value}>
                            <span className="ap-card-n">{pad(i)}</span>
                            <p className="ap-card-kind">{w.kind}</p>
                            <h3>{w.title}</h3>
                            <p className="ap-card-text">{w.text}</p>
                            <ul className="ap-ticks">{w.points.map((p) => <li key={p}><Tick />{p}</li>)}</ul>
                            <button className="ap-more" onClick={() => pickRoute(w.value)}>Apply this way<Arrow /></button>
                        </article>
                    ))}
                </div>
            </Sec>

            {/* ===================== 02 AREAS ===================== */}
            <Sec id="areas" tone="warm" n={1} label="What you can test" title={areas.heading} lede={areas.lede}>
                <div className="ap-flex" role="list">
                    {areas.items.map((it, i) => (
                        <article
                            key={it.value}
                            role="listitem"
                            className={`ap-fp ap-rv ${area === i ? 'is-on' : ''}`}
                            style={D(i)}
                            tabIndex={0}
                            aria-current={area === i ? 'true' : undefined}
                            onClick={() => setArea(i)}
                            onFocus={() => setArea(i)}
                            onMouseEnter={() => setArea(i)}
                        >
                            <span className="ap-fp-n">{pad(i)}</span>
                            <span className="ap-fp-vt">{it.title}</span>
                            <div className="ap-fp-body">
                                <p className="ap-chip">{it.phase}</p>
                                <h3>{it.title}</h3>
                                <p>{it.text}</p>
                                <ul className="ap-ticks">{it.points.map((p) => <li key={p}><Tick />{p}</li>)}</ul>
                                <button className="ap-btn ap-btn--dark" onClick={(e) => { e.stopPropagation(); pickArea(it.value); }}>Apply for this area<Arrow /></button>
                            </div>
                        </article>
                    ))}
                </div>
            </Sec>

            {/* ===================== 03 RESOURCES ===================== */}
            <Sec id="resources" tone="dark" n={2} label="What is on site" title={resources.heading} lede={resources.lede}>
                <div className="ap-sitefacts">
                    {resources.site.map((s, i) => (
                        <div className="ap-rv" style={D(i)} key={s.label}><span>{s.label}</span><strong>{s.value}</strong></div>
                    ))}
                </div>

                <div className="ap-bento">
                    {resources.facilities.map((it, i) => (
                        <article className={`ap-fac ap-spot ap-rv ${it.ready === 'Planned' ? 'is-planned' : ''}`} style={D(i % 4)} key={it.title}>
                            <span className="ap-fac-n">{String(it.n).padStart(2, '0')}</span>
                            <h3>{it.title}</h3>
                            <p>{it.text}</p>
                            <em>{it.ready}</em>
                        </article>
                    ))}
                </div>

                <h3 className="ap-sub ap-rv">Planned flight corridors</h3>
                <div className="ap-corr">
                    {resources.corridors.map((c, i) => (
                        <div className="ap-tile ap-spot ap-rv" style={D(i)} key={c.title}>
                            <Route flip={i === 1} />
                            <h4>{c.title}</h4>
                            <b>{c.route}</b>
                            <p>{c.text}</p>
                        </div>
                    ))}
                </div>
                <p className="ap-note ap-rv">{resources.note}</p>
            </Sec>

            {/* ===================== 04 PROCESS ===================== */}
            <Sec id="process" tone="light" n={3} label="The process" title={flow.heading} lede={flow.lede}>
                <div className="ap-track ap-rv" role="tablist" aria-label="Application steps" style={{ '--p': phase / (ph.length - 1) }}>
                    <div className="ap-track-line" aria-hidden="true"><span /></div>
                    {ph.map((p, i) => (
                        <button key={p.title} role="tab" aria-selected={phase === i} className={`ap-step ${phase === i ? 'is-on' : ''} ${i < phase ? 'is-done' : ''}`} onClick={() => setPhase(i)}>
                            <span className="ap-step-dot">{i < phase ? <Tick /> : i + 1}</span>
                            <span className="ap-step-name">{p.title}</span>
                        </button>
                    ))}
                </div>

                <div className="ap-pstep" key={phase} role="tabpanel">
                    <span className="ap-bignum" aria-hidden="true">{pad(phase)}</span>
                    <div className="ap-pstep-body">
                        <h3>{ph[phase].title}</h3>
                        <p>{ph[phase].text}</p>
                        <div className="ap-pmeta"><span>{ph[phase].time}</span><span>Output: {ph[phase].out}</span></div>
                        <div className="ap-pbtns">
                            {phase > 0 && <button className="ap-btn ap-btn--ghost-dark ap-btn--sm" onClick={() => setPhase(phase - 1)}><Arrow back />Previous</button>}
                            {phase < ph.length - 1
                                ? <button className="ap-btn ap-btn--dark ap-btn--sm" onClick={() => setPhase(phase + 1)}>Next step<Arrow /></button>
                                : <button className="ap-btn ap-btn--dark ap-btn--sm" onClick={() => goTo('form')}>Start now<Arrow /></button>}
                        </div>
                    </div>
                </div>
            </Sec>

            {/* ===================== 05 FORM ===================== */}
            <Sec
                id="form" tone="dark" n={4} label="Application form" title={cfg.heading} lede={cfg.lede} className="ap-formsec"
                rail={state !== 'done' ? (
                    <ol className="ap-tracker" aria-label="Form progress">
                        {cfg.steps.map((s, i) => (
                            <li key={s.id}>
                                <button type="button" className={`${i === step ? 'is-on' : ''} ${i < step ? 'is-done' : ''}`} onClick={() => jump(i)} aria-current={i === step ? 'step' : undefined}>
                                    <span className="ap-tdot">{i < step ? <Tick /> : i + 1}</span>
                                    <span className="ap-tlabel"><b>{s.label}</b><em>{s.hint}</em></span>
                                </button>
                            </li>
                        ))}
                        <li className="ap-tbar" aria-hidden="true"><span style={{ transform: `scaleX(${filled / 100})` }} /></li>
                    </ol>
                ) : null}
            >
                <div ref={formTop} className="ap-formtop" />
                <div className="ap-panel ap-rv">
                    {state === 'done' ? (
                        <div className="ap-done" role="status">
                            <span className="ap-done-ico"><svg viewBox="0 0 52 52" width="56" height="56" aria-hidden="true"><path d="M12 27l10 10 18-22" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" /></svg></span>
                            <h3>{cfg.success.title}</h3>
                            <p>{cfg.success.text}</p>
                            <p className="ap-ref"><span>Your reference</span><strong>{ref}</strong></p>
                            <div className="ap-done-btns">
                                <button className="ap-btn" onClick={downloadSummary}>Download summary<Arrow /></button>
                                <button className="ap-btn ap-btn--ghost" onClick={reset}>{cfg.success.again}</button>
                            </div>
                        </div>
                    ) : (
                        <form className="ap-form" onSubmit={submit} noValidate>
                            {saved && step < cfg.steps.length - 1 && (
                                <p className="ap-saved"><i aria-hidden="true" />Draft saved on this device<button type="button" onClick={reset}>Clear</button></p>
                            )}

                            {step === 0 && (
                                <div className="ap-pane" key="s0">
                                    <Chips name="type" legend="Applicant type" req options={cfg.applicantTypes} value={data.type} onChange={set('type')} err={errs.type} />
                                    <div className="ap-row">
                                        <Field id="org" label="Organisation" req err={errs.org}><input id="ap-org" type="text" value={data.org} onChange={set('org')} autoComplete="organization" aria-invalid={!!errs.org} /></Field>
                                        <Field id="website" label="Website (optional)"><input id="ap-website" type="url" value={data.website} onChange={set('website')} placeholder="https://" autoComplete="url" /></Field>
                                    </div>
                                    <div className="ap-row">
                                        <Field id="name" label="Contact person" req err={errs.name}><input id="ap-name" type="text" value={data.name} onChange={set('name')} autoComplete="name" aria-invalid={!!errs.name} /></Field>
                                        <Field id="role" label="Role (optional)"><input id="ap-role" type="text" value={data.role} onChange={set('role')} autoComplete="organization-title" /></Field>
                                    </div>
                                    <div className="ap-row">
                                        <Field id="email" label="Email" req err={errs.email}><input id="ap-email" type="email" value={data.email} onChange={set('email')} autoComplete="email" aria-invalid={!!errs.email} /></Field>
                                        <Field id="phone" label="Phone (optional)" err={errs.phone}><input id="ap-phone" type="tel" value={data.phone} onChange={set('phone')} autoComplete="tel" aria-invalid={!!errs.phone} /></Field>
                                    </div>
                                    <div className="ap-hp" aria-hidden="true"><label>Leave empty<input type="text" tabIndex={-1} autoComplete="off" value={data.hp} onChange={set('hp')} /></label></div>
                                </div>
                            )}

                            {step === 1 && (
                                <div className="ap-pane" key="s1">
                                    <Chips name="route" legend="How do you want to take part?" req options={cfg.routes} value={data.route} onChange={set('route')} err={errs.route} />
                                    <Chips name="areas" legend="Test areas (choose all that apply)" req multi options={cfg.areas} value={data.areas} onChange={set('areas')} err={errs.areas} />
                                    <Field id="title" label="Activity title" req err={errs.title}><input id="ap-title" type="text" value={data.title} onChange={set('title')} maxLength={90} aria-invalid={!!errs.title} /></Field>
                                    <Field id="desc" label="What do you want to do?" req err={errs.desc} hint="What will you test, what do you want to learn, and what does success look like?">
                                        <textarea id="ap-desc" rows="6" maxLength={cfg.limits.desc} value={data.desc} onChange={set('desc')} aria-invalid={!!errs.desc} />
                                        <span className="ap-counter">{data.desc.length} / {cfg.limits.desc}</span>
                                    </Field>
                                    <div className="ap-row">
                                        <Field id="aircraft" label="Aircraft or system (optional)"><select id="ap-aircraft" value={data.aircraft} onChange={set('aircraft')}><option value="">Choose…</option>{cfg.aircraft.map((o) => <option key={o}>{o}</option>)}</select></Field>
                                        <Field id="corridor" label="Where will you operate? (optional)"><select id="ap-corridor" value={data.corridor} onChange={set('corridor')}><option value="">Choose…</option>{cfg.corridors.map((o) => <option key={o}>{o}</option>)}</select></Field>
                                    </div>
                                    <div className="ap-row">
                                        <Field id="timeframe" label="Preferred timeframe" req err={errs.timeframe}><select id="ap-timeframe" value={data.timeframe} onChange={set('timeframe')} aria-invalid={!!errs.timeframe}><option value="">Choose…</option>{cfg.timeframes.map((o) => <option key={o}>{o}</option>)}</select></Field>
                                        <Field id="duration" label="How long? (optional)"><select id="ap-duration" value={data.duration} onChange={set('duration')}><option value="">Choose…</option>{cfg.durations.map((o) => <option key={o}>{o}</option>)}</select></Field>
                                    </div>
                                    <Field id="partners" label="Partners (optional)"><input id="ap-partners" type="text" value={data.partners} onChange={set('partners')} placeholder="Names of organisations involved" /></Field>
                                </div>
                            )}

                            {step === 2 && (
                                <div className="ap-pane" key="s2">
                                    <Chips name="needs" legend="What do you need on site? (optional)" multi options={cfg.needs} value={data.needs} onChange={set('needs')} />
                                    <Chips name="permits" legend="Do you hold the permits for your operation?" req options={cfg.permits} value={data.permits} onChange={set('permits')} err={errs.permits} />
                                    <Field id="crew" label="Crew and pilots (optional)" hint="Number of people and their qualifications, if known."><input id="ap-crew" type="text" value={data.crew} onChange={set('crew')} /></Field>
                                    <Field id="safety" label="Safety notes (optional)" hint="Known risks, safety measures or special conditions.">
                                        <textarea id="ap-safety" rows="4" maxLength={cfg.limits.safety} value={data.safety} onChange={set('safety')} />
                                        <span className="ap-counter">{data.safety.length} / {cfg.limits.safety}</span>
                                    </Field>
                                </div>
                            )}

                            {step === 3 && (
                                <div className="ap-pane" key="s3">
                                    <p className="ap-review-lede">Check your answers. Use <b>Edit</b> to change anything before sending.</p>
                                    <dl className="ap-review">
                                        {summaryRows.map(([k, v]) => (<div key={k}><dt>{k}</dt><dd>{v}</dd></div>))}
                                    </dl>
                                    <div className="ap-editrow">
                                        {cfg.steps.slice(0, 3).map((s, i) => <button type="button" key={s.id} onClick={() => jump(i)}>Edit {s.label.toLowerCase()}</button>)}
                                    </div>
                                    <label className={`ap-check ${errs.consent ? 'is-bad' : ''}`}>
                                        <input type="checkbox" checked={data.consent} onChange={set('consent')} aria-invalid={!!errs.consent} />
                                        <span className="ap-box" aria-hidden="true"><Tick /></span>
                                        <span>{cfg.consent}</span>
                                    </label>
                                    {errs.consent && <p className="ap-err" role="alert">{errs.consent}</p>}
                                    {state === 'fail' && (
                                        <p className="ap-err ap-err--box" role="alert">{cfg.fail} <a href={mailFallback}>Email your application</a></p>
                                    )}
                                </div>
                            )}

                            <div className="ap-nav">
                                <button type="button" className="ap-btn ap-btn--ghost" onClick={back} disabled={step === 0}><Arrow back />Back</button>
                                <span className="ap-stepcount">Step {step + 1} of {cfg.steps.length}</span>
                                {step < cfg.steps.length - 1
                                    ? <button type="submit" className="ap-btn">Continue<Arrow /></button>
                                    : <button type="submit" className="ap-btn" disabled={state === 'loading'}>{state === 'loading' ? 'Sending…' : 'Submit application'}<Arrow /></button>}
                            </div>
                        </form>
                    )}
                </div>
            </Sec>

            {/* ===================== 06 PREPARE ===================== */}
            <Sec id="prepare" tone="warm" n={5} label="Prepare" title={prepare.heading} lede={prepare.lede}>
                <div className="ap-readybar ap-rv" role="status">
                    <div><strong>{doneReady}</strong> of {totalReady} ready</div>
                    <i><b style={{ transform: `scaleX(${totalReady ? doneReady / totalReady : 0})` }} /></i>
                </div>
                <div className="ap-prep">
                    {prepare.groups.map((g, gi) => (
                        <div className="ap-pgroup ap-rv" style={D(gi)} key={g.title}>
                            <h3><span>{pad(gi)}</span>{g.title}</h3>
                            <ul>
                                {g.items.map((it) => {
                                    const k = `${gi}-${it}`;
                                    return (
                                        <li key={it}>
                                            <label className={ready[k] ? 'is-on' : ''}>
                                                <input type="checkbox" checked={!!ready[k]} onChange={() => setReady((r) => ({ ...r, [k]: !r[k] }))} />
                                                <i aria-hidden="true"><Tick /></i>{it}
                                            </label>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    ))}
                </div>
                <p className="ap-note ap-rv">{prepare.note}</p>
            </Sec>

            {/* ===================== 07 FAQ ===================== */}
            <Sec
                id="faq" tone="light" n={6} label="FAQ" title={faq.heading} lede={faq.lede}
                rail={(
                    <div className="ap-helpcard ap-rv">
                        <p>Still unsure?</p>
                        <a className="ap-btn ap-btn--dark" href={links.contact}>Contact the team<Arrow /></a>
                    </div>
                )}
            >
                <ul className="ap-faq">
                    {faq.items.map((it, i) => {
                        const on = faqOpen === i;
                        return (
                            <li key={it.q} className="ap-rv" style={D(i)}>
                                <button className={`ap-q ${on ? 'is-on' : ''}`} onClick={() => setFaqOpen(on ? -1 : i)} aria-expanded={on}>
                                    <span className="ap-num">{pad(i)}</span>
                                    <span className="ap-qt">{it.q}</span>
                                    <i aria-hidden="true" />
                                </button>
                                <div className={`ap-a ${on ? 'is-on' : ''}`}><div><p>{it.a}</p></div></div>
                            </li>
                        );
                    })}
                </ul>
            </Sec>

            {/* ===================== CLOSING CTA ===================== */}
            <section className="ap-cta" id="cta" style={{ zIndex: 12 }}>
                <div className="ap-aurora" aria-hidden="true"><i /><i /><i /></div>
                <div className="ap-wrap ap-cta-in">
                    <div>
                        <h2 className="ap-cta-h ap-rv">{closing.heading}</h2>
                        <p className="ap-cta-p ap-rv" style={D(1)}>{closing.text}</p>
                    </div>
                    <div className="ap-cta-btns ap-rv" style={D(2)}>
                        <a className="ap-btn" href={links.contact}>Contact the team<Arrow /></a>
                        <a className="ap-btn ap-btn--ghost" href={links.opportunities}>Opportunities</a>
                        <a className="ap-btn ap-btn--ghost" href={links.innovation}>About the sandbox</a>
                    </div>
                </div>
            </section>
        </div>
    );
}

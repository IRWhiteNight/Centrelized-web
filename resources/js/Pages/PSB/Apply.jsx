import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import '../../../css/PSB-css/psb-apply.css';

import {
    links, hero, sections, ticker, who, areas, resources, howItWorks, prepare, form as cfg, closing, floatingButton,
} from '../../data/PSB-data/applyData';

/* same aerial photo the Opportunities hero uses */
import siteAerial from '../../images/innovation/site-aerial.jpg';

/* ==========================================================================
   Helpers
========================================================================== */

const D = (i) => ({ '--d': Math.min(i, 8) * 80 });
const pad = (n) => String(n + 1).padStart(2, '0');
const reduced = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const isEmpty = (v) => (Array.isArray(v) ? !v.length : !String(v).trim());

/* adds .in to every .ap-rv once it scrolls into view */
function useReveal(rootRef) {
    useEffect(() => {
        const nodes = rootRef.current.querySelectorAll('.ap-rv');
        if (reduced() || !('IntersectionObserver' in window)) { nodes.forEach((n) => n.classList.add('in')); return undefined; }
        const io = new IntersectionObserver((entries) => {
            entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
        }, { threshold: 0.08, rootMargin: '0px 0px -4% 0px' });
        nodes.forEach((n) => io.observe(n));
        return () => io.disconnect();
    }, [rootRef]);
}

const Arrow = () => (
    <svg className="ap-arrow" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
        <path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

function Ring({ value, total, word }) {
    const r = 26;
    const c = 2 * Math.PI * r;
    return (
        <svg className="ap-ring" viewBox="0 0 64 64" role="img" aria-label={`${value} of ${total} ${word}`}>
            <circle className="ap-ring-bg" cx="32" cy="32" r={r} />
            <circle className="ap-ring-fg" cx="32" cy="32" r={r} strokeDasharray={c} strokeDashoffset={c * (1 - (total ? value / total : 0))} transform="rotate(-90 32 32)" />
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

function Head({ n, label, title, lede }) {
    return (
        <header className="ap-head">
            <p className="ap-kicker ap-rv"><span>{pad(n)}</span>{label}</p>
            <h2 className="ap-h ap-rv" style={D(1)}>{title}</h2>
            {lede && <p className="ap-lede ap-rv" style={D(2)}>{lede}</p>}
        </header>
    );
}

/* ==========================================================================
   Form (every field comes from applyData.js)
========================================================================== */

const allFields = cfg.steps.flatMap((s) => s.fields || []);
const lastStep = cfg.steps.length - 1;
const stepOf = (key) => cfg.steps.findIndex((s) => (s.fields || []).some((f) => f.key === key));

const emptyForm = () => {
    const o = { consent: false, hp: '' };
    allFields.forEach((f) => { o[f.key] = f.type === 'multi' ? [] : ''; });
    return o;
};

const makeRef = () => {
    const d = new Date();
    const s = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
    return `PAS-${s}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
};

const validate = (i, d) => {
    const e = {};
    (cfg.steps[i].fields || []).forEach((f) => {
        const v = d[f.key];
        if (isEmpty(v)) { if (f.req) e[f.key] = f.msg || 'This field is required.'; return; }
        if (f.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())) e[f.key] = 'Enter a valid email address.';
        else if (f.type === 'tel' && !/^[+\d][\d\s()-]{6,}$/.test(v.trim())) e[f.key] = 'Enter a valid phone number.';
        else if (f.min && String(v).trim().length < f.min) e[f.key] = f.msg || `Enter at least ${f.min} characters.`;
    });
    if (i === lastStep && !d.consent) e.consent = 'Tick the box to confirm.';
    return e;
};

function FormField({ f, value, err, onChange }) {
    const id = `ap-${f.key}`;
    const label = <>{f.label}{f.req && <b aria-hidden="true"> *</b>}</>;

    if (f.type === 'single' || f.type === 'multi') {
        const multi = f.type === 'multi';
        const has = (o) => (multi ? value.includes(o) : value === o);
        return (
            <fieldset className={`ap-opts ap-full ${err ? 'is-bad' : ''}`}>
                <legend>{label}</legend>
                <div>
                    {f.options.map((o) => (
                        <label key={o} className={has(o) ? 'is-on' : ''}>
                            <input
                                type={multi ? 'checkbox' : 'radio'}
                                name={f.key}
                                value={o}
                                checked={has(o)}
                                onChange={() => onChange(multi ? (has(o) ? value.filter((x) => x !== o) : [...value, o]) : o)}
                            />
                            <span className="ap-opt-box" aria-hidden="true" />{o}
                        </label>
                    ))}
                </div>
                {err && <p className="ap-err" role="alert">{err}</p>}
            </fieldset>
        );
    }

    let control;
    if (f.type === 'textarea') {
        control = <textarea id={id} rows={f.rows || 5} maxLength={f.max} value={value} onChange={(e) => onChange(e.target.value)} aria-invalid={!!err} />;
    } else if (f.type === 'select') {
        control = (
            <select id={id} value={value} onChange={(e) => onChange(e.target.value)} aria-invalid={!!err}>
                <option value="">Choose…</option>
                {f.options.map((o) => <option key={o}>{o}</option>)}
            </select>
        );
    } else {
        control = <input id={id} type={f.type} value={value} maxLength={f.max} placeholder={f.placeholder} onChange={(e) => onChange(e.target.value)} aria-invalid={!!err} />;
    }

    return (
        <div className={`ap-field ${f.half ? '' : 'ap-full'} ${err ? 'is-bad' : ''}`}>
            <label htmlFor={id}>{label}</label>
            {control}
            {f.type === 'textarea' && f.max && <span className="ap-counter">{value.length} / {f.max}</span>}
            {f.hint && !err && <p className="ap-hint">{f.hint}</p>}
            {err && <p className="ap-err" role="alert">{err}</p>}
        </div>
    );
}

/* ==========================================================================
   PAGE
========================================================================== */

export default function Apply() {
    const rootRef = useRef(null);
    const formTop = useRef(null);
    const loaded = useRef(false);

    const [activeSection, setActiveSection] = useState(sections[0].id);
    const [showFab, setShowFab] = useState(false);
    const [areaIdx, setAreaIdx] = useState(0);
    const [phase, setPhase] = useState(0);
    const [ready, setReady] = useState({});

    const [data, setData] = useState(emptyForm);
    const [step, setStep] = useState(0);
    const [errs, setErrs] = useState({});
    const [state, setState] = useState('idle'); /* idle | loading | done | fail */
    const [ref, setRef] = useState('');
    const [saved, setSaved] = useState(false);

    useReveal(rootRef);

    /* scroll: progress bar, hero parallax, active menu item, floating button */
    useEffect(() => {
        const root = rootRef.current;
        const heroEl = root.querySelector('.ap-hero');
        let raf = 0;
        const update = () => {
            raf = 0;
            const y = window.scrollY;
            const h = root.scrollHeight - window.innerHeight;
            if (y < 1100 && heroEl) heroEl.style.setProperty('--sy', `${y}`);
            root.style.setProperty('--progress', h > 0 ? clamp(y / h).toFixed(4) : 0);
            const line = window.innerHeight * 0.35;
            let cur = sections[0].id;
            sections.forEach((s) => {
                const el = document.getElementById(s.id);
                if (el && el.getBoundingClientRect().top <= line) cur = s.id;
            });
            setActiveSection(cur);
            setShowFab(y > 720 && cur !== 'form' && y < h - 600);
        };
        const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
        update();
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll);
        return () => { cancelAnimationFrame(raf); window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); };
    }, []);

    /* keep the active menu item visible on small screens */
    useEffect(() => {
        const a = rootRef.current.querySelector('.ap-subnav a.is-active');
        const box = rootRef.current.querySelector('.ap-subnav-scroll');
        if (a && box) box.scrollTo({ left: a.offsetLeft - box.clientWidth / 2 + a.clientWidth / 2, behavior: reduced() ? 'auto' : 'smooth' });
    }, [activeSection]);

    const goTo = useCallback((id) => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'start' });
    }, []);

    /* ---------- draft: restore once, save while typing (never throws) ---------- */
    useEffect(() => {
        try {
            const raw = window.localStorage.getItem(cfg.draftKey);
            if (raw) {
                const d = JSON.parse(raw);
                if (d && d.data) { setData({ ...emptyForm(), ...d.data, consent: false, hp: '' }); setStep(Math.min(d.step || 0, lastStep - 1)); setSaved(true); }
            }
        } catch (e) { /* storage blocked */ }
        loaded.current = true;
    }, []);
    useEffect(() => {
        if (!loaded.current || state === 'done') return undefined;
        const t = setTimeout(() => {
            try {
                if (allFields.some((f) => !isEmpty(data[f.key]))) { window.localStorage.setItem(cfg.draftKey, JSON.stringify({ data, step })); setSaved(true); }
            } catch (e) { /* storage blocked */ }
        }, 500);
        return () => clearTimeout(t);
    }, [data, step, state]);
    const clearDraft = () => { try { window.localStorage.removeItem(cfg.draftKey); } catch (e) { /* ignore */ } setSaved(false); };

    /* ---------- form logic ---------- */
    const setField = (k) => (v) => {
        setData((d) => ({ ...d, [k]: v }));
        if (errs[k]) setErrs((x) => ({ ...x, [k]: undefined }));
        if (state === 'fail') setState('idle');
    };

    const scrollForm = () => { if (formTop.current) formTop.current.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'start' }); };
    const focusFirstError = () => requestAnimationFrame(() => {
        const el = rootRef.current.querySelector('.is-bad input, .is-bad textarea, .is-bad select');
        if (el) el.focus();
    });

    const next = () => {
        const e = validate(step, data);
        setErrs(e);
        if (Object.keys(e).length) { focusFirstError(); return; }
        setStep(step + 1); scrollForm();
    };
    const back = () => { setErrs({}); setStep(Math.max(0, step - 1)); scrollForm(); };
    const jump = (i) => {
        if (i <= step) { setErrs({}); setStep(i); scrollForm(); return; }
        for (let s = step; s < i; s += 1) {
            const e = validate(s, data);
            if (Object.keys(e).length) { setStep(s); setErrs(e); focusFirstError(); return; }
        }
        setStep(i); scrollForm();
    };

    const submit = async (ev) => {
        ev.preventDefault();
        if (step < lastStep) { next(); return; }
        for (let s = 0; s <= lastStep; s += 1) {
            const e = validate(s, data);
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
            setRef(reference); setState('done'); clearDraft(); scrollForm();
        } catch (err) { setState('fail'); }
    };

    const reset = () => { setData(emptyForm()); setErrs({}); setStep(0); setState('idle'); setRef(''); clearDraft(); };

    const summaryRows = useMemo(() => allFields
        .filter((f) => !isEmpty(data[f.key]))
        .map((f) => [f.label.replace(/\s*\((optional|choose all that apply)\)/i, ''), Array.isArray(data[f.key]) ? data[f.key].join('; ') : data[f.key]]), [data]);

    const downloadSummary = () => {
        const txt = `Perlis Airspace Sandbox, application ${ref}\n${'='.repeat(48)}\n\n${summaryRows.map(([k, v]) => `${k}: ${v}`).join('\n')}\n`;
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([txt], { type: 'text/plain' }));
        a.download = `${ref}.txt`;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(a.href), 500);
    };
    const mailFallback = `mailto:${cfg.fallbackEmail}?subject=${encodeURIComponent(`Sandbox application: ${data.title || data.org}`)}&body=${encodeURIComponent(summaryRows.map(([k, v]) => `${k}: ${v}`).join('\n'))}`;

    const pickRoute = (v) => { setData((d) => ({ ...d, route: v })); setStep(Math.max(0, stepOf('route'))); setState('idle'); goTo('form'); };
    const pickArea = (v) => { setData((d) => ({ ...d, areas: d.areas.includes(v) ? d.areas : [...d.areas, v] })); setStep(Math.max(0, stepOf('areas'))); setState('idle'); goTo('form'); };

    const area = areas.items[areaIdx];
    const ph = howItWorks.steps;
    const cur = cfg.steps[step];
    const filled = (state === 'done' ? cfg.steps.length : step) / cfg.steps.length;
    const totalReady = prepare.groups.reduce((n, g) => n + g.items.length, 0);
    const doneReady = Object.values(ready).filter(Boolean).length;
    const hasForm = sections.some((s) => s.id === 'form');
    const applyTo = () => goTo(hasForm ? 'form' : 'top');

    /* ==========================================================================
       Section blocks: Head content comes from the data file, order from `sections`
    ========================================================================== */
    const blocks = {
        /* ---------------------- who ---------------------- */
        who: {
            head: who,
            body: (
                <div className="ap-grid3">
                    {who.items.map((w, i) => (
                        <article className="ap-card ap-way ap-rv" style={D(i)} key={w.value}>
                            <span className="ap-way-num" aria-hidden="true">{pad(i)}</span>
                            <p className="ap-tag">{w.kind}</p>
                            <h3>{w.title}</h3>
                            <p className="ap-card-text">{w.text}</p>
                            <ul className="ap-ticks">{w.points.map((p) => <li key={p}>{p}</li>)}</ul>
                            {hasForm && <button className="ap-link" onClick={() => pickRoute(w.value)}>{who.button}<Arrow /></button>}
                        </article>
                    ))}
                </div>
            ),
        },

        /* ---------------------- areas ---------------------- */
        areas: {
            head: areas,
            body: (
                <>
                    <div className="ap-tabs ap-rv" role="tablist" aria-label={areas.heading} onKeyDown={(e) => arrowNav(e, areaIdx, areas.items.length, setAreaIdx)}>
                        {areas.items.map((a, i) => (
                            <button key={a.value} role="tab" aria-selected={areaIdx === i} tabIndex={areaIdx === i ? 0 : -1} className={areaIdx === i ? 'is-on' : ''} onClick={() => setAreaIdx(i)}>
                                <span>{pad(i)}</span>{a.title}
                            </button>
                        ))}
                    </div>
                    <div className="ap-areapanel" key={area.value} role="tabpanel">
                        <div className="ap-areahead ap-pop">
                            <p className="ap-chip">{area.phase}</p>
                            <h3>{area.title}</h3>
                            <p>{area.text}</p>
                            {hasForm && <button className="ap-btn" onClick={() => pickArea(area.value)}>{areas.button}<Arrow /></button>}
                        </div>
                        <ul className="ap-areapoints">
                            {area.points.map((p, i) => (<li className="ap-card ap-pop" style={D(i + 1)} key={p}><span>{pad(i)}</span>{p}</li>))}
                        </ul>
                    </div>
                </>
            ),
        },

        /* ---------------------- resources ---------------------- */
        resources: {
            head: resources,
            body: (
                <>
                    <div className="ap-sitefacts ap-rv">
                        {resources.site.map((s) => (<div key={s.label}><span>{s.label}</span><strong>{s.value}</strong></div>))}
                    </div>

                    <h3 className="ap-sub ap-rv">{resources.facilitiesTitle}</h3>
                    <div className="ap-bento">
                        {resources.facilities.map((it, i) => (
                            <article className={`ap-card ap-fac ap-rv ${it.ready === 'Planned' ? 'is-planned' : ''}`} style={D(i % 4)} key={it.title}>
                                <h4>{it.title}</h4>
                                <p>{it.text}</p>
                                <em>{it.ready}</em>
                            </article>
                        ))}
                    </div>

                    <h3 className="ap-sub ap-rv">{resources.corridorsTitle}</h3>
                    <div className="ap-corr">
                        {resources.corridors.map((c, i) => (
                            <article className="ap-tile ap-rv" style={D(i)} key={c.title}>
                                <h4>{c.title}</h4>
                                <b>{c.route}</b>
                                <p>{c.text}</p>
                            </article>
                        ))}
                    </div>
                    {resources.note && <p className="ap-note ap-rv">{resources.note}</p>}
                </>
            ),
        },

        /* ---------------------- process ---------------------- */
        process: {
            head: howItWorks,
            body: (
                <>
                    <div className="ap-track ap-rv" role="tablist" aria-label={howItWorks.heading} style={{ '--p': phase / Math.max(1, ph.length - 1) }} onKeyDown={(e) => arrowNav(e, phase, ph.length, setPhase)}>
                        <div className="ap-track-line" aria-hidden="true"><span /></div>
                        {ph.map((p, i) => (
                            <button key={p.title} role="tab" aria-selected={phase === i} tabIndex={phase === i ? 0 : -1} className={`ap-step ${phase === i ? 'is-on' : ''} ${i < phase ? 'is-done' : ''}`} onClick={() => setPhase(i)}>
                                <span className="ap-step-dot">{i + 1}</span>
                                <span className="ap-step-name">{p.title}</span>
                            </button>
                        ))}
                    </div>
                    <div className="ap-pstep" key={phase} role="tabpanel">
                        <div className="ap-ptitle ap-pop">
                            <p className="ap-chip">{howItWorks.stepWord} {phase + 1} / {ph.length}</p>
                            <h3>{ph[phase].title}</h3>
                            <p>{ph[phase].text}</p>
                        </div>
                        <div className="ap-card ap-pop" style={D(1)}><h4 className="ap-subh">{howItWorks.labels.time}</h4><p>{ph[phase].time}</p></div>
                        <div className="ap-card ap-card--white ap-pop" style={D(2)}><h4 className="ap-subh">{howItWorks.labels.out}</h4><p>{ph[phase].out}</p></div>
                    </div>
                    <div className="ap-pbtns">
                        <button className="ap-btn ap-btn--ghost ap-btn--sm" onClick={() => setPhase(Math.max(0, phase - 1))} disabled={phase === 0}>Previous step</button>
                        {phase < ph.length - 1
                            ? <button className="ap-btn ap-btn--sm" onClick={() => setPhase(phase + 1)}>Next step<Arrow /></button>
                            : <button className="ap-btn ap-btn--sm" onClick={applyTo}>{howItWorks.startButton}<Arrow /></button>}
                    </div>
                </>
            ),
        },

        /* ---------------------- prepare ---------------------- */
        prepare: {
            head: prepare,
            body: (
                <>
                    <div className="ap-readybar ap-rv" role="status">
                        <Ring value={doneReady} total={totalReady} word={prepare.readyWord || 'ready'} />
                        <p><strong>{doneReady}</strong> of {totalReady} {prepare.readyWord || 'ready'}</p>
                    </div>
                    <div className="ap-prep">
                        {prepare.groups.map((g, gi) => (
                            <div className="ap-card ap-pgroup ap-rv" style={D(gi)} key={g.title}>
                                <h3><span>{pad(gi)}</span>{g.title}</h3>
                                <ul>
                                    {g.items.map((it) => {
                                        const k = `${gi}-${it}`;
                                        return (
                                            <li key={it}>
                                                <label className={ready[k] ? 'is-on' : ''}>
                                                    <input type="checkbox" checked={!!ready[k]} onChange={() => setReady((r) => ({ ...r, [k]: !r[k] }))} />
                                                    <i aria-hidden="true" />{it}
                                                </label>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        ))}
                    </div>
                    {prepare.note && <p className="ap-note ap-rv">{prepare.note}</p>}
                </>
            ),
        },

        /* ---------------------- form ---------------------- */
        form: {
            head: cfg,
            body: (
                <>
                    <div ref={formTop} className="ap-formtop" />
                    <div className="ap-formgrid">
                        {state !== 'done' && (
                            <ol className="ap-tracker" aria-label="Form progress">
                                {cfg.steps.map((s, i) => (
                                    <li key={s.id}>
                                        <button type="button" className={`${i === step ? 'is-on' : ''} ${i < step ? 'is-done' : ''}`} onClick={() => jump(i)} aria-current={i === step ? 'step' : undefined}>
                                            <span className="ap-tdot">{i + 1}</span>
                                            <span className="ap-tlabel"><b>{s.label}</b><em>{s.hint}</em></span>
                                        </button>
                                    </li>
                                ))}
                                <li className="ap-tbar" aria-hidden="true"><span style={{ transform: `scaleX(${filled})` }} /></li>
                            </ol>
                        )}

                        <div className="ap-panel ap-rv">
                            {state === 'done' ? (
                                <div className="ap-done" role="status">
                                    <span className="ap-done-ico"><svg viewBox="0 0 52 52" width="44" height="44" aria-hidden="true"><path d="M12 27l10 10 18-22" fill="none" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" /></svg></span>
                                    <h3>{cfg.success.title}</h3>
                                    <p>{cfg.success.text}</p>
                                    <p className="ap-ref"><span>Your reference</span><strong>{ref}</strong></p>
                                    <div className="ap-done-btns">
                                        <button className="ap-btn ap-btn--ink" onClick={downloadSummary}>Download summary<Arrow /></button>
                                        <button className="ap-btn ap-btn--line" onClick={reset}>{cfg.success.again}</button>
                                    </div>
                                </div>
                            ) : (
                                <form className="ap-form" onSubmit={submit} noValidate>
                                    {saved && step < lastStep && (
                                        <p className="ap-saved"><i aria-hidden="true" />{cfg.savedText}<button type="button" onClick={reset}>Clear</button></p>
                                    )}

                                    <div className="ap-pane" key={cur.id}>
                                        {cur.fields.length > 0 && (
                                            <div className="ap-fields">
                                                {cur.fields.map((f) => (
                                                    <FormField key={f.key} f={f} value={data[f.key]} err={errs[f.key]} onChange={setField(f.key)} />
                                                ))}
                                            </div>
                                        )}

                                        {step === 0 && (
                                            <div className="ap-hp" aria-hidden="true"><label>Leave empty<input type="text" tabIndex={-1} autoComplete="off" value={data.hp} onChange={(e) => setField('hp')(e.target.value)} /></label></div>
                                        )}

                                        {step === lastStep && (
                                            <>
                                                <p className="ap-review-lede">{cfg.reviewLede}</p>
                                                <dl className="ap-review">
                                                    {summaryRows.map(([k, v]) => (<div key={k}><dt>{k}</dt><dd>{v}</dd></div>))}
                                                </dl>
                                                <div className="ap-editrow">
                                                    {cfg.steps.slice(0, lastStep).map((s, i) => <button type="button" key={s.id} onClick={() => jump(i)}>Edit {s.label.toLowerCase()}</button>)}
                                                </div>
                                                <label className={`ap-check ${errs.consent ? 'is-bad' : ''}`}>
                                                    <input type="checkbox" checked={data.consent} onChange={(e) => setField('consent')(e.target.checked)} aria-invalid={!!errs.consent} />
                                                    <span className="ap-box" aria-hidden="true" />
                                                    <span>{cfg.consent}</span>
                                                </label>
                                                {errs.consent && <p className="ap-err" role="alert">{errs.consent}</p>}
                                                {state === 'fail' && (<p className="ap-err ap-err--box" role="alert">{cfg.fail} <a href={mailFallback}>Email your application</a></p>)}
                                            </>
                                        )}
                                    </div>

                                    <div className="ap-nav">
                                        <button type="button" className="ap-btn ap-btn--line" onClick={back} disabled={step === 0}>Back</button>
                                        <span className="ap-stepcount">{cfg.stepWord} {step + 1} of {cfg.steps.length}</span>
                                        {step < lastStep
                                            ? <button type="submit" className="ap-btn ap-btn--ink">Continue<Arrow /></button>
                                            : <button type="submit" className="ap-btn ap-btn--ink" disabled={state === 'loading'}>{state === 'loading' ? 'Sending…' : 'Submit application'}<Arrow /></button>}
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </>
            ),
        },
    };

    return (
        <div className="ap" ref={rootRef}>

            {/* ===================== HERO ===================== */}
            <section className="ap-hero" id="top">
                <div className="ap-hero-media" aria-hidden="true"><img src={siteAerial} alt="" loading="eager" decoding="async" /></div>
                <div className="ap-grid" aria-hidden="true" />

                <div className="ap-wrap ap-hero-copy">
                    <p className="ap-eyebrow"><i aria-hidden="true" />{hero.eyebrow}</p>
                    <h1 className="ap-title">
                        {hero.titleLines.map((l, i) => (
                            <span className="ap-ln" key={l}>
                                <span className={l === hero.highlight ? 'ap-hl' : ''} style={{ '--i': i }}>{l}</span>
                            </span>
                        ))}
                    </h1>
                    <p className="ap-hero-lede">{hero.lede}</p>
                    <div className="ap-hero-cta">
                        {hasForm && <button className="ap-btn" onClick={() => goTo('form')}>{hero.primaryButton}<Arrow /></button>}
                        <button className="ap-btn ap-btn--ghost" onClick={() => goTo(sections.some((s) => s.id === 'process') ? 'process' : sections[0].id)}>{hero.secondaryButton}<Arrow /></button>
                    </div>
                </div>

                <div className="ap-wrap ap-glance">
                    <div className="ap-glance-bar">
                        <span>{hero.glanceLabel}</span>
                        <span><b>{hero.caption.place}</b> &middot; {hero.caption.note}</span>
                    </div>
                    <div className="ap-glance-grid">
                        {hero.facts.map((s, i) => (
                            <div className="ap-gl" key={s.label}>
                                <strong>{s.value}</strong>
                                <span className="ap-gl-label">{s.label}</span>
                                {s.note && <p className="ap-gl-note">{s.note}</p>}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===================== STICKY MENU (same as Opportunities) ===================== */}
            <nav className="ap-subnav" aria-label="Apply sections">
                <div className="ap-wrap ap-subnav-scroll">
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
                <div className="ap-progress" aria-hidden="true"><span /></div>
            </nav>

            {/* ===================== TICKER ===================== */}
            <div className="ap-ticker" aria-hidden="true">
                <div className="ap-ticker-track">
                    {[0, 1].map((k) => <ul key={k}>{ticker.map((t) => <li key={t + k}>{t}</li>)}</ul>)}
                </div>
            </div>

            {/* ===================== SECTIONS (order and tone from `sections`) ===================== */}
            {sections.map((s, i) => {
                const b = blocks[s.id];
                if (!b) return null;
                return (
                    <section className={`ap-sec ap-${s.tone === 'graphite' ? 'dark ap-graphite' : s.tone}`} id={s.id} key={s.id}>
                        <div className="ap-wrap">
                            <Head n={i} label={s.label} title={b.head.heading} lede={b.head.lede} />
                            {b.body}
                        </div>
                    </section>
                );
            })}

            {/* ===================== CLOSING CTA ===================== */}
            <section className="ap-sec ap-dark ap-cta" id="cta">
                <div className="ap-wrap ap-cta-in">
                    <div>
                        <h2 className="ap-h ap-rv">{closing.heading}</h2>
                        <p className="ap-lede ap-rv" style={D(1)}>{closing.text}</p>
                    </div>
                    <div className="ap-cta-btns ap-rv" style={D(2)}>
                        {closing.buttons.map((b) => (
                            <a key={b.label} className={`ap-btn ${b.primary ? '' : 'ap-btn--line'}`} href={b.href}>{b.label}<Arrow /></a>
                        ))}
                    </div>
                </div>
            </section>

            {/* floating apply button, appears after the hero */}
            {hasForm && (
                <div className={`ap-fab ${showFab ? 'is-on' : ''}`}>
                    <button className="ap-btn ap-btn--sm" onClick={() => goTo('form')} tabIndex={showFab ? 0 : -1}>{floatingButton}<Arrow /></button>
                </div>
            )}
        </div>
    );
}

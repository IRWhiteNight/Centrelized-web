import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { router } from '@inertiajs/react';
import '../../../css/COE-UAS-css/coe-collaborate.css';

/* Everything you read on screen, plus slide order and transitions, lives in this file. */
import {
    settings, slides, hero, why, pathways, offer, sandbox, roadmap, network, enquire,
} from '../../Components/COEUAS-Components/collaborateContent';

/* ==========================================================
   SMALL HELPERS
========================================================== */
const pad = (n) => String(n).padStart(2, '0');

/* Reveal settings for any element: <div className="clb-rv" {...R(index, 'up|left|right|zoom|blur|clip')}> */
const R = (i = 0, v = 'up') => ({ 'data-rv': v, style: { '--d': i * 90 } });

/* Only the visible slide can be tabbed into */
const inertRef = (on) => (el) => {
    if (!el) return;
    if (on) el.setAttribute('inert', '');
    else el.removeAttribute('inert');
};

/* Heading: words rise out of a mask one by one. "*phrase*" is highlighted. */
function Title({ text, as: Tag = 'h2', className = '' }) {
    const plain = text.replace(/\*/g, '');
    let k = 0;
    return (
        <Tag className={`clb-h ${className}`} aria-label={plain}>
            <span aria-hidden="true">
                {text.split('*').map((seg, si) => {
                    const words = seg.split(/\s+/).filter(Boolean).map((w) => (
                        <span key={`${si}-${k}`}>
                            <span className="clb-w"><span style={{ '--w': k++ }}>{w}</span></span>{' '}
                        </span>
                    ));
                    return si % 2 ? <em key={si}>{words}</em> : <span key={si}>{words}</span>;
                })}
            </span>
        </Tag>
    );
}

/* Number that counts up when its slide opens */
function Count({ to, prefix = '', suffix = '', state }) {
    const [v, setV] = useState(0);
    useEffect(() => {
        if (state === 'next') { setV(0); return undefined; }
        if (state !== 'now') return undefined;
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setV(to); return undefined; }
        let raf = 0; let t0 = 0;
        const step = (t) => {
            if (!t0) t0 = t;
            const p = Math.min(1, Math.max(0, (t - t0 - 700) / 1500));
            setV(Math.round(to * (1 - (1 - p) ** 3)));
            if (p < 1) raf = requestAnimationFrame(step);
        };
        raf = requestAnimationFrame(step);
        return () => cancelAnimationFrame(raf);
    }, [state, to]);
    return <>{prefix}{v}{suffix}</>;
}

/* ==========================================================
   SECTIONS — each receives { meta, state, goto, form, setForm }
========================================================== */
function Hero({ goto }) {
    return (
        <div className="clb-wrap clb-hero">
            <Title as="h1" text={hero.title} className="clb-xl" />
            <p className="clb-lede clb-rv" {...R(5)}>{hero.lede}</p>
            <div className="clb-btns clb-rv" {...R(6)}>
                <button type="button" className="clb-btn" onClick={() => goto('enquire')}>{hero.primaryCta}</button>
                <button type="button" className="clb-btn clb-btn--ghost" onClick={() => goto('pathways')}>{hero.secondaryCta}</button>
            </div>
            <ul className="clb-chips clb-rv" {...R(7)}>
                {hero.chips.map((c) => <li key={c}>{c}</li>)}
            </ul>
            <p className="clb-hint clb-rv" {...R(9, 'blur')}>{hero.scrollHint}</p>
        </div>
    );
}

/* Drawn flight routes behind the hero. Decorative only. */
function HeroArt() {
    return (
        <svg className="clb-hero-art" viewBox="0 0 1200 720" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
            <defs>
                <linearGradient id="clb-route" x1="0" x2="1">
                    <stop offset="0" stopColor="#2f8cff" stopOpacity="0" />
                    <stop offset=".55" stopColor="#8fd0ff" />
                    <stop offset="1" stopColor="#2f8cff" stopOpacity=".25" />
                </linearGradient>
            </defs>
            <g fill="none" stroke="url(#clb-route)" strokeWidth="2">
                <path id="clb-r1" className="clb-dash clb-loop" d="M-20 560 C 220 520, 360 300, 620 340 S 980 180, 1240 120" />
                <path id="clb-r2" className="clb-dash clb-dash--slow clb-loop" d="M-20 660 C 260 650, 460 520, 700 500 S 1000 420, 1240 380" />
                <path id="clb-r3" className="clb-dash clb-loop" d="M300 760 C 380 560, 520 430, 640 250 S 860 40, 900 -30" />
            </g>
            {[[620, 340], [700, 500], [640, 250]].map(([x, y]) => (
                <g key={`${x}-${y}`}>
                    <circle className="clb-ping clb-loop" cx={x} cy={y} r="10" fill="none" stroke="#8fd0ff" />
                    <circle cx={x} cy={y} r="4.5" fill="#fff" />
                </g>
            ))}
            {['clb-r1', 'clb-r2', 'clb-r3'].map((id, i) => (
                <g key={id}>
                    <circle r="5" fill="#fff">
                        <animateMotion dur={`${9 + i * 3}s`} begin={`${i * 1.4}s`} repeatCount="indefinite" rotate="auto">
                            <mpath href={`#${id}`} />
                        </animateMotion>
                    </circle>
                </g>
            ))}
        </svg>
    );
}

function Why({ state }) {
    return (
        <div className="clb-wrap">
            <div className="clb-split">
                <div className="clb-stack">
                    <Title text={why.title} />
                    <p className="clb-lede clb-rv" {...R(5)}>{why.lede}</p>
                </div>
                <div className="clb-reasons">
                    {why.reasons.map((r, i) => (
                        <div className="clb-reason clb-rv" key={r.title} {...R(i + 3, 'right')}>
                            <h4>{r.title}</h4>
                            <p>{r.text}</p>
                        </div>
                    ))}
                </div>
            </div>
            <div className="clb-figs clb-rv" {...R(8, 'clip')}>
                {why.figures.map((f) => (
                    <div key={f.label}>
                        <strong><Count to={f.to} prefix={f.prefix} suffix={f.suffix} state={state} /></strong>
                        <span>{f.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function Pathways({ state, goto, setForm }) {
    const [open, setOpen] = useState(0);
    const choose = (p) => {
        setForm((f) => ({ ...f, role: p.role, type: p.enquiryType }));
        goto('enquire');
    };
    return (
        <div className="clb-wrap">
            <div className="clb-head">
                <Title text={pathways.title} />
                <p className="clb-lede clb-rv" {...R(4)}>{pathways.lede}</p>
            </div>
            <div className="clb-acc clb-rv" {...R(5, 'clip')}>
                {pathways.items.map((p, i) => {
                    const isOpen = open === i;
                    return (
                        <div className="clb-pw" data-open={isOpen} key={p.id}
                            onMouseEnter={() => window.matchMedia('(hover: hover)').matches && setOpen(i)}>
                            <button type="button" className="clb-pw-head" aria-expanded={isOpen}
                                onClick={() => setOpen(i)} onFocus={() => setOpen(i)}>
                                <span>{p.short}</span>
                            </button>
                            <div className="clb-pw-body" ref={inertRef(!isOpen || state !== 'now')}>
                                <h3>{p.title}</h3>
                                <p>{p.text}</p>
                                <ul>{p.offers.map((o) => <li key={o}>{o}</li>)}</ul>
                                <button type="button" className="clb-btn" onClick={() => choose(p)}>{p.cta}</button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function Offer() {
    /* Each marquee row doubles its items so the loop never shows a gap */
    const rows = useMemo(() => {
        const half = Math.ceil(offer.solutions.length / 2);
        return [offer.solutions.slice(0, half), offer.solutions.slice(half)];
    }, []);
    return (
        <div className="clb-wrap">
            <div className="clb-split clb-split--even">
                <div className="clb-stack">
                    <Title text={offer.title} />
                    <p className="clb-lede clb-rv" {...R(4)}>{offer.lede}</p>
                    <h3 className="clb-sub clb-rv" {...R(5)}>{offer.servicesLabel}</h3>
                    <ul className="clb-svc">
                        {offer.services.map((s, i) => (
                            <li className="clb-rv" key={s.title} {...R(i + 6, 'left')}>
                                <h4>{s.title}</h4>
                                <p>{s.text}</p>
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="clb-stack clb-offer-r">
                    <h3 className="clb-sub clb-rv" {...R(3)}>{offer.solutionsLabel}</h3>
                    <div className="clb-marq clb-rv" {...R(4, 'clip')}>
                        {rows.map((row, ri) => (
                            <div className="clb-track clb-loop" data-dir={ri % 2 ? 'r' : 'l'} key={ri}>
                                {[...row, ...row, ...row, ...row].map((s, i) => <span key={`${s}-${i}`}>{s}</span>)}
                            </div>
                        ))}
                    </div>
                    <h3 className="clb-sub clb-rv" {...R(7)}>{offer.trainingLabel}</h3>
                    <ul className="clb-tags clb-rv" {...R(8)}>
                        {offer.training.map((t) => <li key={t}>{t}</li>)}
                    </ul>
                </div>
            </div>
        </div>
    );
}

function Sandbox({ state }) {
    const [act, setAct] = useState(0);
    const [paused, setPaused] = useState(false);
    const total = sandbox.nodes.length;

    useEffect(() => {
        if (state !== 'now' || paused) return undefined;
        const t = setInterval(() => setAct((a) => (a + 1) % total), 3800);
        return () => clearInterval(t);
    }, [state, paused, total]);

    const node = sandbox.nodes[act];
    return (
        <div className="clb-wrap">
            <div className="clb-split clb-split--orbit">
                <div className="clb-stack">
                    <Title text={sandbox.title} />
                    <p className="clb-lede clb-rv" {...R(5)}>{sandbox.lede}</p>
                    <ul className="clb-goals">
                        {sandbox.objectives.map((o, i) => <li className="clb-rv" key={o} {...R(i + 6, 'left')}>{o}</li>)}
                    </ul>
                    {sandbox.href && (
                        <div className="clb-rv" {...R(9)}>
                            <a className="clb-btn" href={sandbox.href}>{sandbox.cta}</a>
                        </div>
                    )}
                </div>
                <div className="clb-rv" {...R(3, 'zoom')}>
                    <div className="clb-orbit" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
                        <div className="clb-ring" />
                        <div className="clb-ring clb-ring--in" />
                        <div className="clb-spin clb-loop">
                            {sandbox.nodes.map((n, i) => (
                                <div className="clb-pos" style={{ '--a': (i * 360) / total }} key={n.title}>
                                    <div className="clb-keep clb-loop">
                                        <button type="button" className="clb-dot" data-on={i === act}
                                            aria-label={n.title} aria-pressed={i === act}
                                            onClick={() => setAct(i)} onFocus={() => setAct(i)} onMouseEnter={() => setAct(i)}>
                                            <i />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="clb-core" aria-live="polite">
                            <div key={act} className="clb-core-in">
                                <small>{sandbox.coreLabel}</small>
                                <h4>{node.title}</h4>
                                <p>{node.text}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function Roadmap() {
    return (
        <div className="clb-wrap">
            <div className="clb-head">
                <Title text={roadmap.title} />
                <p className="clb-lede clb-rv" {...R(4)}>{roadmap.lede}</p>
            </div>
            <div className="clb-rm">
                <div className="clb-rm-line"><span /></div>
                {roadmap.phases.map((p, i) => (
                    <div className="clb-rm-col clb-rv" key={p.n} data-now={!!p.now} {...R(i + 4, 'up')}>
                        <i className="clb-rm-dot" />
                        <span className="clb-rm-per">{p.period}</span>
                        <h3><b>Phase {p.n}</b> {p.name}</h3>
                        <ul>{p.join.map((j) => <li key={j}>{j}</li>)}</ul>
                        {p.now && <span className="clb-now">{roadmap.nowLabel}</span>}
                    </div>
                ))}
            </div>
        </div>
    );
}

function Network() {
    return (
        <div className="clb-wrap">
            <div className="clb-split clb-split--even">
                <div className="clb-stack">
                    <Title text={network.title} />
                    <p className="clb-lede clb-rv" {...R(4)}>{network.lede}</p>
                    <h3 className="clb-sub clb-rv" {...R(5)}>{network.channelsLabel}</h3>
                    <ul className="clb-tags clb-rv" {...R(6)}>
                        {network.channels.map((c) => <li key={c}>{c}</li>)}
                    </ul>
                </div>
                <div className="clb-stack">
                    <h3 className="clb-sub clb-rv" {...R(3)}>{network.rolesLabel}</h3>
                    <ul className="clb-roles">
                        {network.roles.map((r, i) => (
                            <li className="clb-rv" key={r.name} {...R(i + 4, 'right')}>
                                <strong>{r.name}</strong><span>{r.text}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
            <div className="clb-logos clb-rv" {...R(10, 'clip')}>
                {network.groups.map((g, gi) => {
                    const base = Array.from({ length: Math.ceil(12 / g.items.length) }, () => g.items).flat();
                    return (
                        <div className="clb-logo-row" key={g.group}>
                            <span>{g.group}</span>
                            <div className="clb-marq clb-marq--logos">
                                <div className="clb-track clb-loop" data-dir={gi % 2 ? 'r' : 'l'}>
                                    {[...base, ...base].map((p, i) => (
                                        <b className="clb-logo" key={`${p.name}-${i}`} title={p.name}>
                                            {p.logo ? <img src={p.logo} alt={p.name} loading="lazy" /> : p.name}
                                        </b>
                                    ))}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function Enquire({ state, form, setForm }) {
    const L = enquire.labels;
    const [sent, setSent] = useState(false);
    const [busy, setBusy] = useState(false);
    const [errors, setErrors] = useState({});
    const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

    const submit = (e) => {
        e.preventDefault();
        setErrors({});
        if (!settings.formEndpoint) { setSent(true); return; } // no endpoint set yet: demo mode
        router.post(settings.formEndpoint, form, {
            preserveScroll: true,
            preserveState: true,
            onStart: () => setBusy(true),
            onFinish: () => setBusy(false),
            onSuccess: () => { setSent(true); setForm((f) => ({ ...f, name: '', email: '', organisation: '', message: '' })); },
            onError: (errs) => setErrors(errs || {}),
        });
    };
    const err = (k) => (errors[k] ? <small className="clb-err" role="alert">{errors[k]}</small> : null);
    const c = enquire.contact;

    return (
        <div className="clb-wrap">
            <div className="clb-split clb-split--form">
                <div className="clb-stack">
                    <Title text={enquire.title} />
                    <p className="clb-lede clb-rv" {...R(4)}>{enquire.lede}</p>
                    <h3 className="clb-sub clb-rv" {...R(5)}>{enquire.stepsLabel}</h3>
                    <ol className="clb-steps">
                        {enquire.steps.map((s, i) => (
                            <li className="clb-rv" key={s} {...R(i + 6, 'left')}><b>{i + 1}</b><span>{s}</span></li>
                        ))}
                    </ol>
                    <address className="clb-contact clb-rv" {...R(9)}>
                        {c.organisation && <span>{c.organisation}</span>}
                        {c.sandbox && <span>{c.sandbox}</span>}
                        {c.email && <a href={`mailto:${c.email}`}>{c.email}</a>}
                        {c.phone && <a href={`tel:${c.phone.replace(/\s/g, '')}`}>{c.phone}</a>}
                    </address>
                </div>

                <div className="clb-rv" {...R(3, 'zoom')}>
                    <div className="clb-form-card">
                        {sent ? (
                            <div className="clb-sent" role="status">
                                <svg viewBox="0 0 52 52" aria-hidden="true"><circle cx="26" cy="26" r="24" /><path d="M14 27l8 8 16-17" /></svg>
                                <h3>{enquire.successTitle}</h3>
                                <p>{enquire.successText}</p>
                                <button type="button" className="clb-btn" onClick={() => setSent(false)}>{L.another}</button>
                            </div>
                        ) : (
                            <form onSubmit={submit} noValidate={false} ref={inertRef(state !== 'now')}>
                                <fieldset className="clb-types">
                                    <legend>{L.type}</legend>
                                    {enquire.types.map((t) => (
                                        <label key={t.value} data-on={form.type === t.value}>
                                            <input type="radio" name="type" value={t.value} checked={form.type === t.value}
                                                onChange={set('type')} />
                                            <span>{t.label}</span>
                                        </label>
                                    ))}
                                </fieldset>
                                {err('type')}
                                <label className="clb-f">
                                    <span>{L.role}</span>
                                    <select value={form.role} onChange={set('role')} required>
                                        <option value="">{L.rolePlaceholder}</option>
                                        {enquire.roles.map((r) => <option key={r} value={r}>{r}</option>)}
                                    </select>
                                    {err('role')}
                                </label>
                                <div className="clb-two">
                                    <label className="clb-f">
                                        <span>{L.name}</span>
                                        <input type="text" value={form.name} onChange={set('name')} autoComplete="name" required />
                                        {err('name')}
                                    </label>
                                    <label className="clb-f">
                                        <span>{L.email}</span>
                                        <input type="email" value={form.email} onChange={set('email')} autoComplete="email" required />
                                        {err('email')}
                                    </label>
                                </div>
                                <label className="clb-f">
                                    <span>{L.organisation}</span>
                                    <input type="text" value={form.organisation} onChange={set('organisation')} autoComplete="organization" />
                                    {err('organisation')}
                                </label>
                                <label className="clb-f">
                                    <span>{L.message}</span>
                                    <textarea rows="4" value={form.message} onChange={set('message')} required />
                                    {err('message')}
                                </label>
                                {Object.keys(errors).length > 0 && <p className="clb-err" role="alert">{enquire.errorText}</p>}
                                <button type="submit" className="clb-btn clb-btn--full" disabled={busy}>
                                    {busy ? L.sending : L.submit}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

/* id in content file → component. Add a new section here, then add its id to `slides`. */
const VIEWS = { hero: Hero, why: Why, pathways: Pathways, offer: Offer, sandbox: Sandbox, roadmap: Roadmap, network: Network, enquire: Enquire };
const ART = { hero: HeroArt };

/* ==========================================================
   SLIDE SHELL — position (past / now / next) drives the CSS transition
========================================================== */
function Slide({ n, meta, current, trans, children }) {
    const state = n < current ? 'past' : n > current ? 'next' : 'now';
    const active = state === 'now';
    const still = !!trans
        && Math.abs(trans.to - trans.from) > 1
        && n > Math.min(trans.from, trans.to)
        && n < Math.max(trans.from, trans.to);
    const Art = ART[meta.id];
    return (
        <section
            id={`collaborate-${meta.id}`}
            ref={inertRef(!active)}
            className="clb-slide"
            data-s={state}
            data-theme={meta.theme}
            data-fx={meta.fx || 'none'}
            data-still={still ? '1' : undefined}
            style={{ '--i': n }}
            aria-hidden={!active}
            aria-label={meta.label}
        >
            <div className="clb-amb" aria-hidden="true">
                <i className="clb-orb clb-orb--a clb-loop" />
                <i className="clb-orb clb-orb--b clb-loop" />
                <div className="clb-grid clb-loop" />
                <div className="clb-spot" />
            </div>
            {Art && <Art />}
            <div className="clb-in">{children(state)}</div>
        </section>
    );
}

/* ==========================================================
   PAGE
========================================================== */
export default function Collaborate() {
    const list = useMemo(() => slides.filter((s) => VIEWS[s.id]), []);
    const count = list.length;

    const [current, setCurrent] = useState(0);
    const [trans, setTrans] = useState(null);
    const [form, setForm] = useState({
        type: enquire.types[1]?.value || enquire.types[0].value,
        role: '', name: '', email: '', organisation: '', message: '',
    });

    const rootRef = useRef(null);
    const curRef = useRef(0);
    const lockRef = useRef(0);
    const timerRef = useRef(0);
    const dur = settings.transitionMs;

    const goto = useCallback((target) => {
        const idx = typeof target === 'string' ? list.findIndex((s) => s.id === target) : target;
        if (idx < 0) return;
        const t = Math.max(0, Math.min(count - 1, idx));
        const from = curRef.current;
        const now = performance.now();
        if (t === from || now < lockRef.current) return;
        lockRef.current = now + dur + 60;
        curRef.current = t;
        setTrans({ from, to: t });
        setCurrent(t);
        clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => setTrans(null), dur + 80);
    }, [list, count, dur]);

    /* One gesture = one section: wheel, touch swipe and keyboard */
    useEffect(() => {
        const root = rootRef.current;
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        const scroller = () => root.querySelector('.clb-slide[data-s="now"] .clb-in');
        /* Tall content (phones, short screens) scrolls inside its section first */
        const canScroll = (dir) => {
            const s = scroller();
            if (!s || s.scrollHeight - s.clientHeight <= 4) return false;
            return dir > 0 ? s.scrollTop + s.clientHeight < s.scrollHeight - 3 : s.scrollTop > 3;
        };

        let acc = 0; let lastT = 0; let armed = true;
        const onWheel = (e) => {
            if (e.ctrlKey || (e.target.closest && e.target.closest('textarea'))) return;
            const dir = Math.sign(e.deltaY);
            if (!dir) return;
            if (canScroll(dir)) return;
            e.preventDefault();
            const now = performance.now();
            if (now - lastT > 120) armed = true;
            lastT = now;
            if (now < lockRef.current || !armed) { acc = 0; return; }
            acc += e.deltaY * (e.deltaMode === 1 ? 40 : 1);
            if (Math.abs(acc) >= 70) { acc = 0; armed = false; goto(curRef.current + dir); }
        };

        let ty = null; let startDown = false; let startUp = false;
        const onTouchStart = (e) => { ty = e.touches[0].clientY; startDown = canScroll(1); startUp = canScroll(-1); };
        const onTouchEnd = (e) => {
            if (ty === null) return;
            const dy = ty - e.changedTouches[0].clientY;
            ty = null;
            if (Math.abs(dy) < 55) return;
            if (dy > 0 ? startDown : startUp) return;
            goto(curRef.current + Math.sign(dy));
        };

        const onKey = (e) => {
            const tag = e.target.tagName;
            if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return;
            if (e.key === ' ' && (tag === 'BUTTON' || tag === 'A')) return;
            const map = { ArrowDown: 1, ArrowRight: 1, PageDown: 1, ArrowUp: -1, ArrowLeft: -1, PageUp: -1, ' ': e.shiftKey ? -1 : 1 };
            if (e.key === 'Home') { e.preventDefault(); goto(0); }
            else if (e.key === 'End') { e.preventDefault(); goto(count - 1); }
            else if (map[e.key]) { e.preventDefault(); goto(curRef.current + map[e.key]); }
        };

        /* pointer position drives the soft spotlight and background parallax */
        let raf = 0;
        const onMove = (e) => {
            cancelAnimationFrame(raf);
            raf = requestAnimationFrame(() => {
                const x = e.clientX / window.innerWidth; const y = e.clientY / window.innerHeight;
                root.style.setProperty('--mx', `${(x * 100).toFixed(1)}%`);
                root.style.setProperty('--my', `${(y * 100).toFixed(1)}%`);
                root.style.setProperty('--px', ((x - 0.5) * 2).toFixed(3));
                root.style.setProperty('--py', ((y - 0.5) * 2).toFixed(3));
            });
        };

        window.addEventListener('wheel', onWheel, { passive: false });
        window.addEventListener('touchstart', onTouchStart, { passive: true });
        window.addEventListener('touchend', onTouchEnd, { passive: true });
        window.addEventListener('keydown', onKey);
        window.addEventListener('pointermove', onMove, { passive: true });
        return () => {
            document.body.style.overflow = prevOverflow;
            cancelAnimationFrame(raf);
            clearTimeout(timerRef.current);
            window.removeEventListener('wheel', onWheel);
            window.removeEventListener('touchstart', onTouchStart);
            window.removeEventListener('touchend', onTouchEnd);
            window.removeEventListener('keydown', onKey);
            window.removeEventListener('pointermove', onMove);
        };
    }, [goto, count]);

    const meta = list[current];
    const tone = meta.theme === 'light' ? 'on-light' : 'on-dark';

    return (
        <main className="clb" ref={rootRef} style={{ '--dur': `${dur}ms` }}>
            {list.map((m, n) => {
                const View = VIEWS[m.id];
                return (
                    <Slide key={m.id} n={n} meta={m} current={current} trans={trans}>
                        {(state) => <View meta={m} n={n} state={state} goto={goto} form={form} setForm={setForm} />}
                    </Slide>
                );
            })}

            {settings.showControls && (
                <div className="clb-hud" data-tone={tone}>
                    <div className="clb-hud-info" aria-live="polite">
                        <b>{pad(current + 1)}<span> / {pad(count)}</span></b>
                        <em>{meta.label}</em>
                        <i style={{ '--p': (current + 1) / count }} />
                    </div>
                    <div className="clb-hud-btns">
                        <button type="button" onClick={() => goto(current - 1)} disabled={current === 0} aria-label="Previous section">
                            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 15l6-6 6 6" /></svg>
                        </button>
                        <button type="button" onClick={() => goto(current + 1)} disabled={current === count - 1} aria-label="Next section">
                            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
                        </button>
                    </div>
                </div>
            )}
        </main>
    );
}

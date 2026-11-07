import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { router } from '@inertiajs/react';

/* Shared deck styles (themes, transitions, form, buttons) come from the Collaborate stylesheet.
   Contact-only pieces are in coe-contact.css. Keep both imports. */
import '../../../css/COE-UAS-css/coe-collaborate.css';
import '../../../css/COE-UAS-css/coe-contact.css';

/* All text, links, slide order and transitions live in contactContent.js */
import { settings, slides, hero, routes, details, locations, form as formCfg } from '../../Components/COEUAS-Components/contactContent';

/* ==========================================================
   HELPERS
========================================================== */
const pad = (n) => String(n).padStart(2, '0');
const R = (i = 0, v = 'up') => ({ 'data-rv': v, style: { '--d': i * 90 } });
const inertRef = (on) => (el) => {
    if (!el) return;
    if (on) el.setAttribute('inert', '');
    else el.removeAttribute('inert');
};

/* Heading: words rise out of a mask. "*phrase*" is highlighted. */
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

/* ==========================================================
   SECTIONS — each receives { state, goto, form, setForm }
========================================================== */
function Hero({ goto }) {
    return (
        <div className="clb-wrap clb-hero">
            <Title as="h1" text={hero.title} className="clb-xl" />
            <p className="clb-lede clb-rv" {...R(5)}>{hero.lede}</p>
            <div className="clb-btns clb-rv" {...R(6)}>
                <button type="button" className="clb-btn" onClick={() => goto('form')}>{hero.primaryCta}</button>
                <button type="button" className="clb-btn clb-btn--ghost" onClick={() => goto('details')}>{hero.secondaryCta}</button>
            </div>
            <p className="clb-hint clb-rv" {...R(8, 'blur')}>{hero.scrollHint}</p>
        </div>
    );
}

/* Radar sweep and signal rings behind the hero. Decorative only. */
function HeroArt() {
    const pings = [[860, 250], [980, 430], [740, 480], [1050, 170]];
    return (
        <svg className="clb-hero-art ct-art" viewBox="0 0 1200 720" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
            <defs>
                <linearGradient id="ct-sweep" x1="0" x2="1">
                    <stop offset="0" stopColor="#8fd0ff" stopOpacity="0" />
                    <stop offset="1" stopColor="#8fd0ff" stopOpacity=".55" />
                </linearGradient>
            </defs>
            <g transform="translate(900 360)" fill="none" stroke="#8fd0ff" strokeOpacity=".28">
                <circle r="90" /><circle r="190" /><circle r="290" /><circle r="390" />
                <path d="M-420 0H420M0 -420V420" strokeOpacity=".15" />
                <g className="ct-sweep clb-loop">
                    <path d="M0 0L390 0A390 390 0 0 0 330 -208Z" fill="url(#ct-sweep)" stroke="none" />
                </g>
                {[0, 1, 2].map((i) => (
                    <circle key={i} className="clb-ping clb-loop" r="14" stroke="#fff" style={{ animationDelay: `${i * 0.95}s` }} />
                ))}
            </g>
            {pings.map(([x, y], i) => (
                <g key={`${x}-${y}`}>
                    <circle className="clb-ping clb-loop" cx={x} cy={y} r="8" fill="none" stroke="#8fd0ff" style={{ animationDelay: `${i * 0.7}s` }} />
                    <circle cx={x} cy={y} r="4" fill="#fff" />
                </g>
            ))}
            <circle cx="900" cy="360" r="6" fill="#fff" />
        </svg>
    );
}

function Routes({ state, goto, setForm }) {
    const choose = (value) => { setForm((f) => ({ ...f, type: value })); goto('form'); };
    return (
        <div className="clb-wrap">
            <div className="clb-head">
                <Title text={routes.title} />
                <p className="clb-lede clb-rv" {...R(4)}>{routes.lede}</p>
            </div>
            <div className="ct-routes">
                {routes.items.map((r, i) => (
                    <div className="ct-route clb-rv" key={r.value} {...R(i + 4, i % 2 ? 'up' : 'zoom')}>
                        <h3>{r.title}</h3>
                        <p>{r.text}</p>
                        <ul>{r.includes.map((x) => <li key={x}>{x}</li>)}</ul>
                        <button type="button" className="clb-btn" onClick={() => choose(r.value)}
                            ref={inertRef(state !== 'now')}>{r.cta}</button>
                    </div>
                ))}
            </div>
        </div>
    );
}

function Details({ goto }) {
    const [copied, setCopied] = useState('');
    const rows = details.channels.filter((c) => c.value);

    const copy = async (c) => {
        try { await navigator.clipboard.writeText(c.value); } catch { /* clipboard blocked: ignore */ }
        setCopied(c.label);
        setTimeout(() => setCopied((v) => (v === c.label ? '' : v)), 1600);
    };
    const hrefFor = (c) => {
        if (c.kind === 'email') return `mailto:${c.value}`;
        if (c.kind === 'phone') return `tel:${c.value.replace(/[^\d+]/g, '')}`;
        if (c.kind === 'link') return c.value;
        return '';
    };

    return (
        <div className="clb-wrap">
            <div className="clb-split clb-split--even">
                <div className="clb-stack">
                    <Title text={details.title} />
                    <p className="clb-lede clb-rv" {...R(4)}>{details.lede}</p>
                    <p className="ct-org clb-rv" {...R(5)}>{details.organisation}</p>
                    <div className="clb-rv" {...R(6)}>
                        <button type="button" className="clb-btn" onClick={() => goto('form')}>{details.cta}</button>
                    </div>
                </div>
                <div>
                    {rows.length === 0 ? (
                        <p className="clb-lede clb-rv" {...R(4)}>{details.fallback}</p>
                    ) : (
                        <ul className="ct-rows">
                            {rows.map((c, i) => {
                                const href = hrefFor(c);
                                return (
                                    <li className="clb-rv" key={c.label} {...R(i + 3, 'right')}>
                                        <span>{c.label}</span>
                                        {href ? <a href={href} {...(c.kind === 'link' ? { target: '_blank', rel: 'noreferrer' } : {})}>{c.value}</a> : <strong>{c.value}</strong>}
                                        {(c.kind === 'email' || c.kind === 'phone') && (
                                            <button type="button" onClick={() => copy(c)} aria-label={`${details.copyLabel} ${c.label}`}>
                                                {copied === c.label ? details.copiedLabel : details.copyLabel}
                                            </button>
                                        )}
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
}

function Locations({ state }) {
    const [tab, setTab] = useState(0);
    const loc = locations.items[tab];
    return (
        <div className="clb-wrap">
            <div className="clb-split clb-split--even">
                <div className="clb-stack">
                    <Title text={locations.title} />
                    <p className="clb-lede clb-rv" {...R(4)}>{locations.lede}</p>
                    <div className="ct-tabs clb-rv" role="tablist" {...R(5)}>
                        {locations.items.map((l, i) => (
                            <button type="button" role="tab" aria-selected={tab === i} data-on={tab === i}
                                key={l.name} onClick={() => setTab(i)}>{l.name}</button>
                        ))}
                    </div>
                    <div key={tab} className="ct-loc clb-rv-static">
                        <h3>{loc.name}</h3>
                        <p className="ct-role">{loc.role}</p>
                        {loc.lines.filter(Boolean).map((l) => <p key={l}>{l}</p>)}
                        {loc.directions && (
                            <a className="clb-btn clb-btn--ghost ct-dir" href={loc.directions} target="_blank" rel="noreferrer">{locations.directionsLabel}</a>
                        )}
                        {locations.visitNote && <p className="ct-note">{locations.visitNote}</p>}
                    </div>
                </div>
                <div className="clb-rv" {...R(3, 'clip')}>
                    <div className="ct-map" key={`m${tab}`}>
                        {loc.embed ? (
                            <iframe title={loc.name} src={state === 'next' ? undefined : loc.embed} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
                        ) : (
                            <div className="ct-pin" aria-hidden="true">
                                <i className="clb-ping clb-loop" /><i className="clb-ping clb-loop" style={{ animationDelay: '1s' }} /><b />
                                <span>{loc.name}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function Message({ state, form, setForm }) {
    const L = formCfg.labels;
    const [sent, setSent] = useState(false);
    const [busy, setBusy] = useState(false);
    const [errors, setErrors] = useState({});
    const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
    const err = (k) => (errors[k] ? <small className="clb-err" role="alert">{errors[k]}</small> : null);

    const submit = (e) => {
        e.preventDefault();
        setErrors({});
        if (!settings.formEndpoint) { setSent(true); return; }
        router.post(settings.formEndpoint, form, {
            preserveScroll: true,
            preserveState: true,
            onStart: () => setBusy(true),
            onFinish: () => setBusy(false),
            onSuccess: () => { setSent(true); setForm((f) => ({ ...f, name: '', email: '', phone: '', organisation: '', subject: '', message: '' })); },
            onError: (errs) => setErrors(errs || {}),
        });
    };

    return (
        <div className="clb-wrap">
            <div className="clb-split clb-split--form">
                <div className="clb-stack">
                    <Title text={formCfg.title} />
                    <p className="clb-lede clb-rv" {...R(4)}>{formCfg.lede}</p>
                    {formCfg.note && <p className="ct-note clb-rv" {...R(5)}>{formCfg.note}</p>}
                </div>
                <div className="clb-rv" {...R(3, 'zoom')}>
                    <div className="clb-form-card">
                        {sent ? (
                            <div className="clb-sent" role="status">
                                <svg viewBox="0 0 52 52" aria-hidden="true"><circle cx="26" cy="26" r="24" /><path d="M14 27l8 8 16-17" /></svg>
                                <h3>{formCfg.successTitle}</h3>
                                <p>{formCfg.successText}</p>
                                <button type="button" className="clb-btn" onClick={() => setSent(false)}>{L.another}</button>
                            </div>
                        ) : (
                            <form onSubmit={submit} ref={inertRef(state !== 'now')}>
                                <fieldset className="clb-types">
                                    <legend>{L.type}</legend>
                                    {formCfg.types.map((t) => (
                                        <label key={t.value} data-on={form.type === t.value}>
                                            <input type="radio" name="type" value={t.value} checked={form.type === t.value} onChange={set('type')} />
                                            <span>{t.label}</span>
                                        </label>
                                    ))}
                                </fieldset>
                                <div className="clb-two">
                                    <label className="clb-f"><span>{L.name}</span>
                                        <input type="text" value={form.name} onChange={set('name')} autoComplete="name" required />{err('name')}</label>
                                    <label className="clb-f"><span>{L.email}</span>
                                        <input type="email" value={form.email} onChange={set('email')} autoComplete="email" required />{err('email')}</label>
                                </div>
                                <div className="clb-two">
                                    <label className="clb-f"><span>{L.phone}</span>
                                        <input type="tel" value={form.phone} onChange={set('phone')} autoComplete="tel" />{err('phone')}</label>
                                    <label className="clb-f"><span>{L.organisation}</span>
                                        <input type="text" value={form.organisation} onChange={set('organisation')} autoComplete="organization" />{err('organisation')}</label>
                                </div>
                                <label className="clb-f"><span>{L.subject}</span>
                                    <input type="text" value={form.subject} onChange={set('subject')} required />{err('subject')}</label>
                                <label className="clb-f"><span>{L.message}</span>
                                    <textarea rows="4" value={form.message} onChange={set('message')} required />{err('message')}</label>
                                {Object.keys(errors).length > 0 && <p className="clb-err" role="alert">{formCfg.errorText}</p>}
                                <button type="submit" className="clb-btn clb-btn--full" disabled={busy}>{busy ? L.sending : L.submit}</button>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

/* id in contactContent.js → component */
const VIEWS = { hero: Hero, routes: Routes, details: Details, locations: Locations, form: Message };
const ART = { hero: HeroArt };

/* ==========================================================
   SLIDE SHELL
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
            id={`contact-${meta.id}`}
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
export default function Contact() {
    const list = useMemo(() => slides.filter((s) => VIEWS[s.id]), []);
    const count = list.length;

    const [current, setCurrent] = useState(0);
    const [trans, setTrans] = useState(null);
    const [form, setForm] = useState({
        type: formCfg.defaultType || formCfg.types[0].value,
        name: '', email: '', phone: '', organisation: '', subject: '', message: '',
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

    /* One gesture = one section: wheel, touch swipe, keyboard */
    useEffect(() => {
        const root = rootRef.current;
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        const scroller = () => root.querySelector('.clb-slide[data-s="now"] .clb-in');
        const canScroll = (dir) => {
            const s = scroller();
            if (!s || s.scrollHeight - s.clientHeight <= 4) return false;
            return dir > 0 ? s.scrollTop + s.clientHeight < s.scrollHeight - 3 : s.scrollTop > 3;
        };

        let acc = 0; let lastT = 0; let armed = true;
        const onWheel = (e) => {
            if (e.ctrlKey || (e.target.closest && e.target.closest('textarea, iframe'))) return;
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
                        {(state) => <View state={state} goto={goto} form={form} setForm={setForm} />}
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

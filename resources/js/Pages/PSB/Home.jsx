import { useEffect, useRef, useState } from 'react';
import '../../../css/PSB-css/psb-home.css';
import '../../../css/PSB-css/psb-motion.css';
import videobg from '../../videos/bg-video2.mp4';
import * as D from '../../data/PSB-data/homeData';

/* All text/images/order live in homeData.js. This file is design + motion only. */

const THEME = { hero: 'dark', activity: 'dark', about: 'light', why: 'dark', programmes: 'light', who: 'dark', roadmap: 'light', news: 'light', events: 'dark', gallery: 'light', partners: 'light', apply: 'blue' };
const on = (list) => list.filter((x) => x.active !== false);

/* ---------- SMOOTH SCROLL + SECTION SNAP (no library) ----------
   Desktop mouse/trackpad only; touch keeps native scrolling.
   • Wheel is smoothed (eased glide).
   • Each wheel gesture moves ONE step: a short section → the next section;
     a tall section → free reading until its bottom, then the next section.
   • A new step starts only after the wheel pauses (SNAP_PAUSE ms), so fast
     scrolling can never fly past a section.                                  */
const SNAP_PAUSE = 120;   // ms of wheel silence that ends a gesture (raise if trackpad momentum skips sections)
const GLIDE = 120;        // ms easing time constant (higher = floatier)
let scrollApi = null;

/* real layout positions (sticky sections report moved offsets, so measure by summing heights) */
const layoutOf = (root) => {
    let y = root.getBoundingClientRect().top + window.scrollY;
    return [...root.querySelectorAll(':scope > .p-sec')].map((s) => {
        const h = s.offsetHeight, a = y; y += h;
        return { id: s.dataset.sec, a, b: Math.max(a, a + h - window.innerHeight) };
    });
};

const bracket = (P, y, d) => {
    let lo = P[0], hi = P[P.length - 1];
    P.forEach((p) => { if (p <= y + 2) lo = p; });
    [...P].reverse().forEach((p) => { if (p >= y - 2) hi = p; });
    if (hi - lo < 3) {
        if (d > 0) hi = P.find((p) => p > y + 2) ?? hi;
        else lo = [...P].reverse().find((p) => p < y - 2) ?? lo;
    }
    return [lo, hi];
};

function createScroller(root) {
    let cur = window.scrollY, tgt = cur, raf = 0, t0 = 0, idle = 0, gest = null, dir = 1;
    const max = () => document.documentElement.scrollHeight - window.innerHeight;
    const pts = () => {
        const L = layoutOf(root), m = max();
        const P = [...new Set([...L.flatMap((s) => [s.a, s.b]), m].map((v) => Math.round(Math.min(Math.max(v, 0), m))))].sort((x, y) => x - y);
        return { L, P };
    };
    const tick = (t) => {
        const dt = Math.min(48, t - t0 || 16); t0 = t;
        cur += (tgt - cur) * (1 - Math.exp(-dt / GLIDE));
        if (Math.abs(tgt - cur) < 0.4) cur = tgt;
        window.scrollTo(0, cur);
        raf = cur === tgt ? 0 : requestAnimationFrame(tick);
    };
    const run = () => { if (!raf) { t0 = performance.now(); raf = requestAnimationFrame(tick); } };

    const step = (d) => { const [lo, hi] = bracket(pts().P, tgt, d); tgt = d > 0 ? hi : lo; run(); };

    const settle = () => {
        gest = null;
        const { L, P } = pts();
        if (L.some((s) => s.b > s.a && tgt > s.a + 2 && tgt < s.b - 2)) return; // reading inside a tall section
        const near = P.reduce((m, p) => (Math.abs(p - tgt) < Math.abs(m - tgt) ? p : m), P[0]);
        if (Math.abs(near - tgt) > 1) { tgt = near; run(); }
    };

    const onWheel = (e) => {
        if (e.ctrlKey) return; // pinch-zoom
        e.preventDefault();
        if (document.querySelector('.p-lb')) return; // lightbox open
        const dy = e.deltaMode === 1 ? e.deltaY * 32 : e.deltaMode === 2 ? e.deltaY * window.innerHeight : e.deltaY;
        if (!dy) return;
        dir = dy > 0 ? 1 : -1;
        if (!gest || gest.d !== dir) {
            const { L, P } = pts(), [lo, hi] = bracket(P, tgt, dir);
            const read = L.some((s) => s.b > s.a && Math.abs(s.a - lo) < 3 && Math.abs(s.b - hi) < 3);
            gest = { d: dir, lo, hi, read };
            if (!read) { tgt = dir > 0 ? hi : lo; run(); } // commit: glide to the next/prev section
        }
        if (gest.read) { tgt = Math.min(gest.hi, Math.max(gest.lo, tgt + dy)); run(); }
        clearTimeout(idle); idle = setTimeout(settle, SNAP_PAUSE);
    };

    const onKey = (e) => {
        if (e.altKey || e.ctrlKey || e.metaKey || e.target.closest?.('input, textarea, select, button, a, [contenteditable]')) return;
        const k = e.key;
        if (k === 'ArrowDown' || k === 'PageDown' || (k === ' ' && !e.shiftKey)) { e.preventDefault(); step(1); }
        else if (k === 'ArrowUp' || k === 'PageUp' || (k === ' ' && e.shiftKey)) { e.preventDefault(); step(-1); }
        else if (k === 'Home') { e.preventDefault(); tgt = 0; run(); }
        else if (k === 'End') { e.preventDefault(); tgt = max(); run(); }
    };

    /* keep in sync if the page is moved natively (scrollbar drag, anchor jump) */
    const onNative = () => { if (!raf && Math.abs(window.scrollY - cur) > 2) { cur = tgt = window.scrollY; } };

    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('keydown', onKey);
    window.addEventListener('scroll', onNative, { passive: true });
    return {
        to: (id) => { const s = layoutOf(root).find((x) => x.id === id); if (!s) return; gest = null; tgt = Math.min(Math.max(s.a, 0), max()); run(); },
        destroy: () => { cancelAnimationFrame(raf); clearTimeout(idle); window.removeEventListener('wheel', onWheel); window.removeEventListener('keydown', onKey); window.removeEventListener('scroll', onNative); },
    };
}

/* used by every button / side dot */
const go = (id) => {
    if (scrollApi) { scrollApi.to(id); return; }
    const root = document.querySelector('.psb'), s = root && layoutOf(root).find((x) => x.id === id);
    if (s) window.scrollTo({ top: s.a, behavior: 'smooth' }); else document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
};

/* ---------- small building blocks ---------- */
const H = ({ text }) => text.split('*').map((t, i) => (i % 2 ? <em key={i}>{t}</em> : t));

const Words = ({ text }) => {
    let n = 0;
    return text.split('*').map((part, k) => part.split(' ').filter(Boolean).map((w) => (
        <span className={`p-w ${k % 2 ? 'p-hl' : ''}`} key={n}><span style={{ '--i': n++ }}>{w}&nbsp;</span></span>
    )));
};

function Img({ img, className = '' }) {
    const [bad, setBad] = useState(false);
    return (
        <figure className={`p-img ${className}`}>
            {!bad && img?.src && <img src={img.src} alt={img.alt || ''} loading="lazy" onError={() => setBad(true)} />}
        </figure>
    );
}

function Count({ to, prefix = '', suffix = '' }) {
    const ref = useRef(null);
    const [v, setV] = useState(0);
    useEffect(() => {
        const io = new IntersectionObserver(([e]) => {
            if (!e.isIntersecting) return;
            io.disconnect();
            const t0 = performance.now();
            const step = (t) => { const p = Math.min(1, (t - t0) / 1600); setV(Math.round(to * (1 - (1 - p) ** 3))); if (p < 1) requestAnimationFrame(step); };
            requestAnimationFrame(step);
        }, { threshold: 0.5 });
        io.observe(ref.current);
        return () => io.disconnect();
    }, [to]);
    return <span ref={ref}>{prefix}{v}{suffix}</span>;
}

const Marquee = ({ children, rev }) => (
    <div className={`p-marq ${rev ? 'p-rev' : ''}`} aria-hidden="true"><div className="p-marq-t">{children}{children}</div></div>
);

/* 3D tilt + cursor glow on any element with {...T} */
const T = {
    onMouseMove: (e) => {
        const el = e.currentTarget, r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        el.style.setProperty('--rx', `${(0.5 - y) * 8}deg`); el.style.setProperty('--ry', `${(x - 0.5) * 10}deg`);
        el.style.setProperty('--mx', `${x * 100}%`); el.style.setProperty('--my', `${y * 100}%`);
    },
    onMouseLeave: (e) => { e.currentTarget.style.setProperty('--rx', '0deg'); e.currentTarget.style.setProperty('--ry', '0deg'); },
};

/* Magnetic pull on buttons with {...mag} */
const mag = {
    onMouseMove: (e) => {
        const el = e.currentTarget, r = el.getBoundingClientRect();
        el.style.setProperty('--bx', `${(e.clientX - r.left - r.width / 2) * 0.25}px`);
        el.style.setProperty('--by', `${(e.clientY - r.top - r.height / 2) * 0.35}px`);
    },
    onMouseLeave: (e) => { e.currentTarget.style.setProperty('--bx', '0px'); e.currentTarget.style.setProperty('--by', '0px'); },
};

const Sec = ({ id, children, className = '' }) => (
    <section id={id} data-sec={id} className={`p-sec p-s-${THEME[id]} ${className}`}>
        <div className="p-orb p-o1" /><div className="p-orb p-o2" />
        <div className="p-wrap">{children}</div>
    </section>
);

const Head = ({ n, kicker, title, lede, id }) => (
    <header className="p-head">
        <div className="p-eyebrow p-rv"><b>{String(n).padStart(2, '0')}</b><i />{kicker || D.labels[id]}</div>
        <h2 className="p-rv" style={{ '--d': 100 }}><H text={title} /></h2>
        {lede && <p className="p-lede p-rv" style={{ '--d': 200 }}>{lede}</p>}
    </header>
);

const Btn = ({ children, to, ghost, onClick }) => (
    <button className={`p-btn ${ghost ? 'p-ghost' : ''}`} onClick={onClick || (() => go(to))} {...mag}><span>{children}</span></button>
);

/* ---------- SECTIONS ---------- */
function Hero({ n }) {
    const h = D.hero;
    return (
        <section id="hero" data-sec="hero" className="p-sec p-s-dark p-hero">
            <div className="p-hero-bg"><video autoPlay muted loop playsInline preload="auto"><source src={videobg} type="video/mp4" /></video><div className="p-shade" /></div>
            <div className="p-grid-fx" />
            <div className="p-wrap p-hero-grid">
                <div>
                    <p className="p-slogan p-rv"><i />{h.slogan}</p>
                    <h1><Words text={h.title} /></h1>
                    <p className="p-lede p-rv" style={{ '--d': 900 }}>{h.lede}</p>
                    <div className="p-btns p-rv" style={{ '--d': 1050 }}>
                        <Btn to={h.primaryCta.to}>{h.primaryCta.label}</Btn>
                        <Btn to={h.secondaryCta.to} ghost>{h.secondaryCta.label}</Btn>
                    </div>
                </div>
                <div className="p-collage p-rv p-r" style={{ '--d': 500 }}>
                    {h.images.map((im, i) => <Img key={i} img={im} className={`p-c p-c${i + 1}`} />)}
                    <div className="p-chip-float"><i />Live testing site · Perlis</div>
                </div>
            </div>
            <div className="p-wrap p-stats p-rv" style={{ '--d': 1200 }}>
                {h.stats.map((s) => <div key={s.label}><strong><Count {...s} /></strong><span>{s.label}</span></div>)}
            </div>
            <Marquee>{h.ticker.map((t) => <span key={t}>{t}<b>✦</b></span>)}</Marquee>
            <button className="p-cue" onClick={() => go('activity')} aria-label="Scroll down"><span /></button>
        </section>
    );
}

function Activity({ n }) {
    const a = D.activity, items = on(a.items);
    const [i, setI] = useState(0);
    const [hold, setHold] = useState(false);
    useEffect(() => {
        if (hold || items.length < 2) return undefined;
        const t = setTimeout(() => setI((x) => (x + 1) % items.length), a.interval || 6500);
        return () => clearTimeout(t);
    }, [i, hold, items.length, a.interval]);
    if (!a.enabled || !items.length) return null;
    const step = (d) => setI((x) => (x + d + items.length) % items.length);
    return (
        <Sec id="activity">
            <Head n={n} id="activity" kicker={a.kicker} title="Current *activity*" />
            <div className="p-banner p-rv" style={{ '--d': 250 }} onMouseEnter={() => setHold(true)} onMouseLeave={() => setHold(false)}>
                {items.map((it, k) => (
                    <article key={k} className={`ab-slide ${k === i ? 'p-on' : ''}`} aria-hidden={k !== i}>
                        <Img img={it.image} className="ab-bg" />
                        <div className="p-veil" />
                        <div className="ab-in">
                            <span className={`p-badge p-${it.status}`}><i />{it.tag}</span>
                            <h3>{it.title}</h3>
                            <p>{it.text}</p>
                            <div className="p-meta"><span>{it.date}</span>{it.cta && <Btn to={it.cta.to}>{it.cta.label}</Btn>}</div>
                        </div>
                    </article>
                ))}
                <div className="p-b-ctrl">
                    <button onClick={() => step(-1)} aria-label="Previous">‹</button>
                    {items.map((_, k) => <button key={k} className={k === i ? 'p-dot p-on' : 'p-dot'} onClick={() => setI(k)} aria-label={`Slide ${k + 1}`} />)}
                    <button onClick={() => step(1)} aria-label="Next">›</button>
                </div>
                {!hold && items.length > 1 && <div key={i} className="p-b-prog" style={{ animationDuration: `${a.interval || 6500}ms` }} />}
            </div>
        </Sec>
    );
}

function About({ n }) {
    const a = D.about;
    return (
        <Sec id="about">
            <div className="p-split">
                <div>
                    <Head n={n} id="about" title={a.title} />
                    {a.rows.map(([k, v], i) => <div className="p-row p-rv" style={{ '--d': 200 + i * 100 }} key={k}><span>{k}</span><p>{v}</p></div>)}
                </div>
                <div className="p-rv p-r" style={{ '--d': 200 }}><Img img={a.image} className="p-tall p-parallax" /></div>
            </div>
            <h3 className="p-sub p-rv">{a.facilitiesLabel}</h3>
            <div className="p-fac">
                {a.facilities.map((f, i) => (
                    <div className="p-fcard p-rv p-z" style={{ '--d': i * 80 }} key={f.title} {...T}>
                        <Img img={f.image} /><div className="p-cap"><h4>{f.title}</h4><p>{f.text}</p></div>
                    </div>
                ))}
            </div>
        </Sec>
    );
}

function Why({ n }) {
    const w = D.why;
    return (
        <Sec id="why">
            <div className="p-split">
                <div>
                    <Head n={n} id="why" title={w.title} lede={w.kicker} />
                    <div className="p-gaps">
                        {w.gaps.map(([t, s], i) => (
                            <div className="p-gap p-rv" style={{ '--d': 150 + i * 90 }} key={t}><b>{i + 1}</b><div><h4>{t}</h4><p>{s}</p></div></div>
                        ))}
                    </div>
                </div>
                <div className="p-rv p-r" style={{ '--d': 250 }}><Img img={w.image} className="p-wide p-parallax" />
                    <h3 className="p-sub" style={{ marginTop: 22 }}>{w.perlisLabel}</h3>
                    <div className="p-chips">{w.perlis.map((p) => <span key={p}>{p}</span>)}</div>
                </div>
            </div>
            <div className="p-facts">
                {w.market.map((f, i) => <div className="p-fact p-rv p-z" style={{ '--d': i * 120 }} key={f.label} {...T}><strong><Count {...f} /></strong><span>{f.label}</span></div>)}
            </div>
            <p className="p-source p-rv">{w.source}</p>
        </Sec>
    );
}

function Programmes({ n }) {
    const p = D.programmes;
    return (
        <Sec id="programmes">
            <Head n={n} id="programmes" title={p.title} lede={p.lede} />
            <div className="p-cards">
                {on(p.items).map((c, i) => (
                    <article className="p-pcard p-rv p-z" style={{ '--d': i * 110 }} key={c.title} {...T}>
                        <Img img={c.image} />
                        <div className="p-pbody"><span className="p-num">{String(i + 1).padStart(2, '0')}</span><h4>{c.title}</h4><p>{c.text}</p><span className="p-tag">{c.tag}</span></div>
                    </article>
                ))}
            </div>
            <div className="p-rv" style={{ marginTop: 34 }}><Btn to="apply">Apply to Participate</Btn></div>
        </Sec>
    );
}

function Who({ n }) {
    const w = D.who;
    return (
        <Sec id="who">
            <div className="p-split p-rev">
                <div className="p-rv p-l"><Img img={w.image} className="p-tall p-parallax" /></div>
                <div>
                    <Head n={n} id="who" title={w.title} />
                    {w.items.map(([t, s], i) => <div className="p-row p-tight p-rv" style={{ '--d': 150 + i * 80 }} key={t}><h4>{t}</h4><p>{s}</p></div>)}
                    <div className="p-chips p-rv" style={{ '--d': 800, marginTop: 20 }}>{w.ways.map((x) => <span key={x}>{x}</span>)}</div>
                </div>
            </div>
        </Sec>
    );
}

function Roadmap({ n }) {
    const r = D.roadmap;
    return (
        <Sec id="roadmap">
            <Head n={n} id="roadmap" title={r.title} lede={r.lede.replace(' Set now: true on the running phase.', '')} />
            <div className="p-tl p-rv" style={{ '--d': 200 }}>
                <div className="p-tl-line" />
                {r.phases.map((p, i) => (
                    <div className={`p-ph ${p.now ? 'p-now' : ''}`} style={{ '--k': i }} key={p.title}>
                        <i />
                        <span className="p-muted">{p.period}</span><h4>{p.title}</h4><b>{p.name}</b><p>{p.text}</p>
                        {p.now && <span className="p-tag p-now">{r.currentLabel}</span>}
                    </div>
                ))}
            </div>
            <div className="p-rv" style={{ '--d': 300, marginTop: 40 }}><Img img={r.image} className="p-strip p-parallax" /></div>
        </Sec>
    );
}

function News({ n }) {
    const s = D.news;
    return (
        <Sec id="news">
            <Head n={n} id="news" title={s.title} />
            <div className="p-cards p-three">
                {on(s.items).map((c, i) => (
                    <a className="p-ncard p-rv p-z" style={{ '--d': i * 110 }} key={i} href={c.href || undefined} {...T}>
                        <Img img={c.image} /><div className="p-nbody"><span className="p-muted">{c.date}</span><h4>{c.title}</h4><p>{c.text}</p><em>Read more →</em></div>
                    </a>
                ))}
            </div>
        </Sec>
    );
}

function Events({ n }) {
    const s = D.events;
    return (
        <Sec id="events">
            <Head n={n} id="events" title={s.title} />
            <div className="p-evs">
                {on(s.items).map((e, i) => (
                    <div className="p-ev p-rv" style={{ '--d': i * 110 }} key={i} {...T}>
                        <div className="p-date"><b>{e.day}</b><span>{e.month}</span></div>
                        <Img img={e.image} className="p-thumb" />
                        <div className="p-evt"><h4>{e.title}</h4><p>{e.where}</p></div>
                        <span className="p-tag">{e.type}</span>
                    </div>
                ))}
            </div>
        </Sec>
    );
}

function Gallery({ n }) {
    const g = D.gallery;
    const [open, setOpen] = useState(null);
    useEffect(() => {
        const k = (e) => e.key === 'Escape' && setOpen(null);
        window.addEventListener('keydown', k);
        return () => window.removeEventListener('keydown', k);
    }, []);
    return (
        <>
            <Sec id="gallery">
                <Head n={n} id="gallery" title={g.title} />
                <div className="p-masonry">
                    {g.items.map((im, i) => (
                        <button className="p-mi p-rv p-z" style={{ '--d': (i % 4) * 90 }} key={i} onClick={() => setOpen(im)} aria-label={`Open ${im.alt}`}><Img img={im} /><span>{im.alt}</span></button>
                    ))}
                </div>
            </Sec>
            {/* Outside <Sec> on purpose: section transforms would break position:fixed */}
            {open && <div className="p-lb" onClick={() => setOpen(null)} role="dialog" aria-modal="true"><img src={open.src} alt={open.alt} /><p>{open.alt}</p><button aria-label="Close">×</button></div>}
        </>
    );
}

function Partners({ n }) {
    const p = D.partners;
    return (
        <Sec id="partners">
            <Head n={n} id="partners" title={p.title} lede={p.lede} />
            {p.groups.map((g, gi) => (
                <div className="p-pg p-rv" style={{ '--d': gi * 120 }} key={g.group}>
                    <h3 className="p-sub">{g.group}</h3>
                    <div className="p-logos">
                        {g.items.map((x) => <div className="p-logo" key={x.name} title={x.name}>{x.logo ? <img src={x.logo} alt={x.name} loading="lazy" /> : <span>{x.name}</span>}</div>)}
                    </div>
                </div>
            ))}
        </Sec>
    );
}

function Apply({ n }) {
    const a = D.apply;
    const [sent, setSent] = useState(false);
    return (
        <Sec id="apply">
            <div className="p-split">
                <div>
                    <Head n={n} id="apply" title={a.title} />
                    <div className="p-steps">{a.steps.map((t, i) => <div className="p-rv" style={{ '--d': 200 + i * 110 }} key={t}><strong>{i + 1}</strong><span>{t}</span></div>)}</div>
                    <div className="p-rv" style={{ '--d': 700, margin: '28px 0 44px' }}>
                        <Btn onClick={() => { if (a.applyHref) window.location.href = a.applyHref; }}>{a.applyLabel}</Btn>
                    </div>
                    <h3 className="p-sub p-rv">{a.subscribeLabel}</h3>
                    <p className="p-lede p-rv">{a.subscribeText}</p>
                    <form className="p-nform p-rv" onSubmit={(e) => { e.preventDefault(); /* TODO: connect newsletter endpoint */ setSent(true); e.currentTarget.reset(); }}>
                        <input type="email" required placeholder={a.emailPlaceholder} aria-label={a.emailPlaceholder} />
                        <button type="submit">{a.subscribeButton}</button>
                    </form>
                    <p className="p-thanks" role="status" aria-live="polite">{sent ? a.thanks : ''}</p>
                </div>
                <div className="p-rv p-r" style={{ '--d': 250 }}><Img img={a.image} className="p-tall p-parallax" /></div>
            </div>
        </Sec>
    );
}

const MAP = { hero: Hero, activity: Activity, about: About, why: Why, programmes: Programmes, who: Who, roadmap: Roadmap, news: News, events: Events, gallery: Gallery, partners: Partners, apply: Apply };

/* ---------- PAGE ---------- */
export default function Home() {
    const root = useRef(null);
    const [active, setActive] = useState('hero');
    const order = D.layout.filter((k) => MAP[k] && !(k === 'activity' && (!D.activity.enabled || !on(D.activity.items).length)));

    useEffect(() => {
        const el = root.current;

        /* reveal on enter + section spy */
        const reveal = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('p-in'); reveal.unobserve(e.target); } }), { threshold: 0.12, rootMargin: '0px 0px -5% 0px' });
        el.querySelectorAll('.p-rv, .p-tl').forEach((x) => reveal.observe(x));
        const spy = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && setActive(e.target.dataset.sec)), { threshold: 0.45 });
        el.querySelectorAll('[data-sec]').forEach((x) => spy.observe(x));

        /* stacking sticky sections: tall sections stick when their BOTTOM reaches the screen bottom */
        const secs = [...el.querySelectorAll(':scope > .p-sec')];
        const measure = () => secs.forEach((s) => s.style.setProperty('--stick', `${Math.min(0, window.innerHeight - s.offsetHeight)}px`));
        const ro = new ResizeObserver(measure);
        secs.forEach((s) => ro.observe(s));
        window.addEventListener('resize', measure); measure();

        /* scroll progress + "how much is the next section covering me" (--cv 0..1) */
        let raf = 0;
        const onScroll = () => {
            cancelAnimationFrame(raf);
            raf = requestAnimationFrame(() => {
                const vh = window.innerHeight, y = window.scrollY, max = document.documentElement.scrollHeight - vh;
                el.style.setProperty('--sy', y); el.style.setProperty('--prog', max > 0 ? y / max : 0);
                secs.forEach((s, i) => {
                    const nx = secs[i + 1];
                    if (!nx) return;
                    s.style.setProperty('--cv', Math.min(1, Math.max(0, 1 - nx.getBoundingClientRect().top / vh)).toFixed(3));
                });
            });
        };

        /* cursor glow */
        const onMove = (e) => { el.style.setProperty('--cx', `${e.clientX}px`); el.style.setProperty('--cy', `${e.clientY}px`); };

        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('mousemove', onMove, { passive: true });
        onScroll();

        /* smooth + snap only for mouse/trackpad users who haven't asked for reduced motion */
        const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const prevBehavior = document.documentElement.style.scrollBehavior;
        let sc = null;
        if (fine) { document.documentElement.style.scrollBehavior = 'auto'; sc = createScroller(el); scrollApi = sc; }

        return () => {
            if (sc) { sc.destroy(); scrollApi = null; document.documentElement.style.scrollBehavior = prevBehavior; }
            reveal.disconnect(); spy.disconnect(); ro.disconnect(); cancelAnimationFrame(raf);
            window.removeEventListener('scroll', onScroll); window.removeEventListener('mousemove', onMove); window.removeEventListener('resize', measure);
        };
    }, []);

    return (
        <div className="psb" ref={root}>
            <div className="p-cursor" aria-hidden="true" />
            <div className="p-prog" aria-hidden="true"><span /></div>
            <nav className="p-dots" aria-label="Page sections">
                {order.map((k) => <button key={k} onClick={() => go(k)} aria-current={active === k} aria-label={D.labels[k]}><span>{D.labels[k]}</span><i /></button>)}
            </nav>
            {order.map((k, idx) => { const C = MAP[k]; return <C key={k} n={idx + 1} />; })}
        </div>
    );
}

import { Fragment, createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useMotionValue, useMotionValueEvent, useReducedMotion, useScroll, useSpring, useTransform } from 'motion/react';
import '../../../css/PSB-css/psb-home.css';
import videobg from '../../videos/bg-video2.mp4';
import * as D from '../../data/PSB-data/homeData';
import PsbLoader from '../../Components/PSB-Components/PsbLoader'; // match the real folder/* FIX THIS PATH to wherever PsbLoader actually lives */

/* Content lives in homeData.js. This file = design + motion only.
   DESIGN: black / white / yellow, and every scene sets its own ink colour:
   - dark scenes   = near-black, halftone dots, LIGHT text, yellow accents
   - light scenes  = white / pale grey, DARK text, yellow highlight marker
   - yellow scenes = full signal yellow, BLACK text
   Motion library: motion/react.
   The footer is NOT rendered here: the shared Footer.jsx (layout) does it. */

const THEME = { hero: 'dark', activity: 'dark', about: 'light', why: 'dark', capabilities: 'yellow', programmes: 'dark', who: 'light', roadmap: 'dark', site: 'light', news: 'dark', events: 'light', gallery: 'dark', partners: 'light', apply: 'yellow' };
const on = (l) => l.filter((x) => x.active !== false);
const EASE = [0.16, 1, 0.3, 1];
const go = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
const pad = (n) => String(n).padStart(2, '0');
const TotalCtx = createContext(12);

const useNarrow = (q = '(max-width: 900px)') => {
    const [m, setM] = useState(() => typeof window !== 'undefined' && window.matchMedia(q).matches);
    useEffect(() => {
        const mq = window.matchMedia(q), f = () => setM(mq.matches);
        f();
        mq.addEventListener('change', f);
        return () => mq.removeEventListener('change', f);
    }, [q]);
    return m;
};

/* ---------- icons ---------- */
const Ic = ({ d, size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>
);
const IcArrow = (p) => <Ic d="M5 12h14M13 6l6 6-6 6" {...p} />;
const IcCheck = (p) => <Ic d="M5 12.5l4.5 4.5L19 7.5" {...p} />;
const IcDown = (p) => <Ic d="M12 5v14M6 13l6 6 6-6" {...p} />;

/* ---------- building blocks ---------- */
/* scroll-reveal wrapper (opacity + rise only: no blur filter, so text stays crisp after the animation) */
const R = ({ children, d = 0, x = 0, className = '' }) => {
    const rm = useReducedMotion();
    return (
        <motion.div className={className} initial={rm ? false : { opacity: 0, y: 36, x }} whileInView={{ opacity: 1, y: 0, x: 0 }}
            viewport={{ once: true, margin: '-6% 0px' }} transition={{ duration: 0.9, delay: d, ease: EASE }}>{children}</motion.div>
    );
};

/* masked word-by-word headline; *word* becomes the highlighted "second voice".
   Highlighted words are glued together (nbsp) so the marker is one continuous band. */
const Words = ({ text, d = 0 }) => {
    const rm = useReducedMotion();
    let n = 0;
    return text.split('*').map((part, k) => {
        const ws = part.split(' ').filter(Boolean), hl = k % 2 === 1;
        return ws.map((w, j) => {
            const i = n++, glued = hl && j < ws.length - 1, t0 = d + i * 0.06;
            const cls = hl ? `p-hl${j === 0 ? ' p-hl-s' : ''}${j === ws.length - 1 ? ' p-hl-e' : ''}` : '';
            const hide = { y: '125%', rotate: 3, ...(hl && { backgroundSize: '0% 100%' }) };
            const show = { y: 0, rotate: 0, ...(hl && { backgroundSize: '100% 100%' }),
                transition: { duration: 1, delay: t0, ease: EASE, backgroundSize: { duration: 0.7, delay: t0 + 0.55, ease: EASE } } };
            /* the MASK is the thing watched by the scroll trigger; the word inherits hide/show from it */
            return (
                <Fragment key={`${k}-${i}`}>
                    <motion.span className={`p-mask${glued ? ' p-mask-g' : ''}`} initial={rm ? false : 'hide'} whileInView="show" viewport={{ once: true }}>
                        <motion.span className={cls} variants={{ hide, show }}>{w}{glued ? '\u00A0' : ''}</motion.span>
                    </motion.span>
                    {!glued && ' '}
                </Fragment>
            );
        });
    });
};

/* image frame. A div (not a figure) so it is valid inside buttons. */
function Img({ img, className = '', par = 0 }) {
    const ref = useRef(null), rm = useReducedMotion(), [bad, setBad] = useState(false);
    const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
    const y = useTransform(scrollYProgress, [0, 1], [`-${par}%`, `${par}%`]);
    return (
        <motion.div ref={ref} className={`p-img ${className}`} initial={rm ? false : { clipPath: 'inset(100% 0 0 0)' }} whileInView={{ clipPath: 'inset(0% 0 0 0)' }}
            viewport={{ once: true }} transition={{ duration: 1.2, ease: EASE }}>
            {!bad && img?.src && <motion.img src={img.src} alt={img.alt || ''} loading="lazy" onError={() => setBad(true)} style={par && !rm ? { y, scale: 1 + par / 40 } : undefined} />}
        </motion.div>
    );
}

/* animated number; `dec` = decimal places */
function Count({ to, prefix = '', suffix = '', dec = 0 }) {
    const ref = useRef(null), [v, setV] = useState(0), rm = useReducedMotion();
    useEffect(() => {
        if (rm) { setV(to); return undefined; }
        const io = new IntersectionObserver(([e]) => {
            if (!e.isIntersecting) return;
            io.disconnect();
            const t0 = performance.now();
            const step = (t) => { const p = Math.min(1, (t - t0) / 1800); setV(to * (1 - (1 - p) ** 4)); if (p < 1) requestAnimationFrame(step); };
            requestAnimationFrame(step);
        }, { threshold: 0.5 });
        if (ref.current) io.observe(ref.current);
        return () => io.disconnect();
    }, [to, rm]);
    return <span ref={ref}>{prefix}{v.toFixed(dec)}{suffix}</span>;
}

/* pill button with a round arrow chip. variant: yellow | ghost | dark | light.
   Magnetic pull toward the pointer is opt-out: pass `still` to switch it off (the hero does). */
function Btn({ children, to, ghost, variant, onClick, small, still }) {
    const rm = useReducedMotion(), mag = !rm && !still;
    const x = useMotionValue(0), y = useMotionValue(0);
    const sx = useSpring(x, { stiffness: 220, damping: 16 }), sy = useSpring(y, { stiffness: 220, damping: 16 });
    const v = variant || (ghost ? 'ghost' : 'yellow');
    return (
        <motion.button type="button" className={`p-btn p-b-${v} ${small ? 'p-b-sm' : ''}`} style={mag ? { x: sx, y: sy } : undefined} whileTap={{ scale: 0.97 }}
            onMouseMove={mag ? (e) => { const r = e.currentTarget.getBoundingClientRect(); x.set((e.clientX - r.left - r.width / 2) * 0.2); y.set((e.clientY - r.top - r.height / 2) * 0.3); } : undefined}
            onMouseLeave={mag ? () => { x.set(0); y.set(0); } : undefined} onClick={onClick || (() => go(to))}>
            <i className="p-ico"><IcArrow size={14} /></i><span>{children}</span>
        </motion.button>
    );
}

/* floating card that leans toward the pointer */
function Tilt({ children, className = '', max = 9 }) {
    const rm = useReducedMotion();
    const mx = useMotionValue(0), my = useMotionValue(0);
    const rx = useSpring(mx, { stiffness: 140, damping: 16 }), ry = useSpring(my, { stiffness: 140, damping: 16 });
    return (
        <motion.article className={className} style={rm ? undefined : { rotateX: rx, rotateY: ry, transformPerspective: 1000 }}
            onMouseMove={(e) => {
                if (rm) return;
                const r = e.currentTarget.getBoundingClientRect();
                my.set(((e.clientX - r.left) / r.width - 0.5) * max * 2);
                mx.set(-((e.clientY - r.top) / r.height - 0.5) * max * 2);
            }}
            onMouseLeave={() => { mx.set(0); my.set(0); }}>
            {children}
        </motion.article>
    );
}

/* dot-matrix bar glyph (the little charts inside the bento cards) */
const seeded = (s) => { let t = s * 9301 + 49297; return () => { t = (t * 9301 + 49297) % 233280; return t / 233280; }; };
function DotBars({ seed = 1, cols = 14, rows = 8, mode = 'bars' }) {
    const cells = useMemo(() => {
        const r = seeded(seed + 3);
        return Array.from({ length: cols }, (_, c) => {
            if (mode === 'ramp') return Math.round(1 + (c / (cols - 1)) * (rows - 1));
            if (mode === 'blocks') return Math.round(r() * rows);
            return Math.max(1, Math.round((0.25 + 0.75 * Math.abs(Math.sin(c * 0.55 + seed))) * rows * (0.6 + c / cols * 0.4)));
        });
    }, [seed, cols, rows, mode]);
    return (
        <div className="p-dotbars" aria-hidden="true">
            {cells.map((h, c) => (
                <motion.div className="p-dcol" key={c} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: c * 0.04, duration: 0.5 }}>
                    {Array.from({ length: rows }, (_, k) => <i key={k} className={rows - k <= h ? 'p-lit' : ''} />)}
                </motion.div>
            ))}
        </div>
    );
}

const Marquee = ({ children, rev }) => (
    <div className={`p-marq ${rev ? 'p-rev' : ''}`} aria-hidden="true"><div className="p-marq-t">{children}{children}</div></div>
);

/* every section is a "scene": its own backdrop (dark / light / yellow) */
const Sec = ({ id, children, className = '' }) => (
    <section id={id} data-sec={id} className={`p-sec p-s-${THEME[id]} ${className}`}>
        <div className="p-orb p-o1" /><div className="p-orb p-o2" /><div className="p-grain" />
        <div className="p-wrap">{children}</div>
    </section>
);

const Head = ({ n, kicker, title, lede, id }) => {
    const total = useContext(TotalCtx);
    return (
        <header className="p-head">
            <R className="p-eyebrow"><i />{kicker || D.labels[id]}<em>{pad(n)}<s>/{pad(total)}</s></em></R>
            <h2><Words text={title} /></h2>
            {lede && <R d={0.2} className="p-lede">{lede}</R>}
        </header>
    );
};

/* sticky horizontal-scroll scene (native swipe on mobile / reduced motion) */
function HScroll({ children }) {
    const ref = useRef(null), tr = useRef(null), rm = useReducedMotion(), narrow = useNarrow();
    const native = rm || narrow;
    const [d, setD] = useState(0), dist = useMotionValue(0);
    const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });
    const x = useTransform([scrollYProgress, dist], ([p, w]) => -p * w);
    useEffect(() => {
        if (native || !tr.current) return undefined;
        const m = () => { const w = Math.max(0, tr.current.scrollWidth - window.innerWidth); dist.set(w); setD(w); };
        m();
        const ro = new ResizeObserver(m); ro.observe(tr.current);
        window.addEventListener('resize', m);
        return () => { ro.disconnect(); window.removeEventListener('resize', m); };
    }, [dist, native]);
    return (
        <div ref={ref} className={`p-h ${native ? 'p-native' : ''}`} style={native ? undefined : { height: `calc(${d}px + 100vh)` }}>
            <div className="p-hs">
                <motion.div ref={tr} className="p-track" style={native ? undefined : { x }}>{children}</motion.div>
                {!native && <div className="p-hbar-bg"><motion.i className="p-hbar" style={{ scaleX: scrollYProgress }} /></div>}
            </div>
        </div>
    );
}

/* top bar: ALL sections always visible as a word nav. The pill flips light/dark with the scene behind it. */
function Hud({ order, active }) {
    const rail = useRef(null);
    useEffect(() => {
        const box = rail.current, el = box?.querySelector('.p-on');
        if (el) box.scrollTo({ left: el.offsetLeft - box.clientWidth / 2 + el.clientWidth / 2, behavior: 'smooth' });
    }, [active]);
    return (
        <header className="p-hud">
            <nav className="p-nav" ref={rail} aria-label="Page sections">
                {order.map((k) => (
                    <button type="button" key={k} className={`${k === active ? 'p-on' : ''} ${k === 'apply' ? 'p-nav-cta' : ''}`} aria-current={k === active ? 'true' : undefined} onClick={() => go(k)}>{D.nav?.[k] || D.labels[k]}</button>
                ))}
            </nav>
        </header>
    );
}

/* ---------- SCENES ---------- */
const LOAD = 2.3; /* seconds: wait for PsbLoader to finish before animating in */

/* HERO. Deliberately simple and centred: video, headline, one sentence, two buttons, and a slim row of four figures.
   Motion: a one-time black-and-white -> colour dissolve on the video, slow scroll parallax, staged text reveals,
   a drifting yellow glow and the counting stats. Nothing reacts to the cursor. */
function Hero() {
    const h = D.hero, ref = useRef(null), rm = useReducedMotion();
    const { scrollYProgress: p } = useScroll({ target: ref, offset: ['start start', 'end start'] });
    const vScale = useTransform(p, [0, 1], [1.04, 1.18]);
    const mainY = useTransform(p, [0, 1], ['0%', '-10%']);
    const mainO = useTransform(p, [0.1, 0.75], [1, 0]);
    const tick = h.ticker?.length ? h.ticker : [h.slogan].filter(Boolean);
    return (
        <>
            <section id="hero" data-sec="hero" ref={ref} className="p-sec p-s-dark ph">
                <motion.div className="ph-bg" style={rm ? undefined : { scale: vScale }} aria-hidden="true">
                    <video autoPlay={!rm} muted loop playsInline preload="auto"><source src={videobg} type="video/mp4" /></video>
                    <div className="ph-mono" /><div className="ph-halftone" /><div className="ph-shade" /><div className="ph-glow" />
                </motion.div>

                <div className="p-wrap ph-wrap">
                    <motion.div className="ph-main" style={rm ? undefined : { y: mainY, opacity: mainO }}>
                        <div className="ph-left">
                            <h1 className="ph-h1"><Words text={h.title} d={LOAD + 0.15} /></h1>
                            <R d={LOAD + 0.5} className="ph-lede">{h.lede}</R>
                            <R d={LOAD + 0.7} className="ph-cta">
                                <Btn still to={h.primaryCta.to}>{h.primaryCta.label}</Btn>
                                <Btn still to={h.secondaryCta.to} ghost>{h.secondaryCta.label}</Btn>
                            </R>
                        </div>
                    </motion.div>

                    <R d={LOAD + 1} className="ph-stats">
                        {h.stats.map((s) => <div key={s.label}><strong><Count {...s} /></strong><span>{s.label}</span></div>)}
                    </R>
                    <span className="ph-cue" aria-hidden="true" />
                </div>
            </section>
            {tick.length > 0 && (
                <div className="p-ticker">
                    <Marquee>{Array.from({ length: 4 }, (_, g) => tick.map((t) => <span key={`${g}-${t}`}>{t}<i>✦</i></span>))}</Marquee>
                </div>
            )}
            <div className="p-divider" aria-hidden="true" />
        </>
    );
}

/* ---------- SPINE SLIDER (Current activity) ----------
   A vertical "spine" of ticks whose bars swell around the active step, a pointer line that links the spine
   to the active slide, and slide changes driven by page scroll.
   - The stage is pinned only for (slides - 1) x STEP_VH of scrolling, with a visible Skip button,
     prev/next buttons and clickable spine markers.
   - Each banner is one whole image (shown at its full 16:9 frame, never cropped or sliced).
   - Reduced motion: no pinning and no slicing (SpineFlat). */
const SPINE = 37;     /* ticks on the rail */
const STEP_VH = 85;   /* scroll distance between two slides */
const clamp01 = (v) => Math.min(1, Math.max(0, v));
const smooth = (v) => v * v * (3 - 2 * v);

/* one full banner image: it crossfades with a tiny zoom, and at rest it is a single clean, uncut picture */
function Slide({ t, k, src, hidden }) {
    const opacity = useTransform(t, (v) => clamp01(1.5 - Math.abs(v - k) * 2.2));
    const scale = useTransform(t, (v) => 1 + Math.min(1, Math.abs(v - k)) * 0.05);
    return (
        <motion.div className="sp-slide" style={{ opacity, scale }} aria-hidden={hidden}>
            {src && <img src={src} alt="" draggable={false} loading={k ? 'lazy' : 'eager'} />}
        </motion.div>
    );
}

/* one tick of the spine: swells (width + height + colour) when the slider is near it */
function Tick({ t, i, span, slide, title, on: isOn, go: onGo }) {
    const f = (v) => (v / span) * (SPINE - 1);
    const g = (v) => Math.exp(-((i - f(v)) ** 2) / (2 * 3.2 ** 2));
    const width = useTransform(t, (v) => `${16 + g(v) * 84}%`);
    const height = useTransform(t, (v) => `${slide != null ? 3 + g(v) * 7 : 2 + g(v) * 6}px`);
    const color = useTransform(t, (v) => (g(v) > 0.45 ? '#ffd400' : slide != null ? 'rgba(255,255,255,.85)' : 'rgba(255,255,255,.4)'));
    const bar = <motion.i className="sp-bar" style={{ width, height, color }} />;
    if (slide == null) return <div className="sp-t">{bar}</div>;
    return (
        <button type="button" className={`sp-t sp-m ${isOn ? 'p-on' : ''}`} onClick={() => onGo(slide)} aria-label={`Go to slide ${slide + 1}: ${title}`} aria-current={isOn ? 'true' : undefined}>
            <b>{pad(slide + 1)}</b>{bar}
        </button>
    );
}

function SpineCopy({ t, k, it }) {
    const opacity = useTransform(t, (v) => clamp01(1 - Math.abs(v - k) * 2.4));
    const y = useTransform(t, (v) => (v - k) * -46);
    const pointerEvents = useTransform(t, (v) => (Math.abs(v - k) < 0.45 ? 'auto' : 'none'));
    return (
        <motion.div className="sp-copy" style={{ opacity, y, pointerEvents }}>
            {it.tag && <span className={`p-badge p-${it.status}`}><i />{it.tag}</span>}
            {it.title && <h3>{it.title}</h3>}
            {it.text && <p>{it.text}</p>}
            {it.date && <div className="p-meta"><span>{it.date}</span></div>}
        </motion.div>
    );
}

function SpineSlider({ items, label }) {
    const trackRef = useRef(null), n = items.length, span = Math.max(1, n - 1);
    const [act, setAct] = useState(0);
    const { scrollYProgress } = useScroll({ target: trackRef, offset: ['start start', 'end end'] });
    /* position along the slides (0 .. n-1). Each slide "dwells" in the middle of its stretch of scroll, then glides to the next */
    const raw = useTransform(scrollYProgress, (p) => { const r = p * span, k = Math.min(Math.floor(r), span - 1); return k + smooth(clamp01((r - k - 0.22) / 0.56)); });
    const t = useSpring(raw, { stiffness: 150, damping: 30, mass: 0.4 });
    useMotionValueEvent(t, 'change', (v) => setAct(Math.round(v)));
    const lineTop = useTransform(t, (v) => `${((((v / span) * (SPINE - 1)) + 0.5) / SPINE) * 100}%`);
    const markers = useMemo(() => Object.fromEntries(items.map((_, k) => [Math.round((k / span) * (SPINE - 1)), k])), [items, span]);

    const goTo = (k) => {
        const el = trackRef.current; if (!el) return;
        const top = el.getBoundingClientRect().top + window.scrollY, max = el.offsetHeight - window.innerHeight;
        window.scrollTo({ top: top + (k / span) * max, behavior: 'smooth' });
    };
    const skip = () => { const el = trackRef.current; if (el) window.scrollTo({ top: el.getBoundingClientRect().bottom + window.scrollY, behavior: 'smooth' }); };
    const next = items[act + 1];

    return (
        <div ref={trackRef} className="sp" style={{ height: `calc(100svh + ${span * STEP_VH}vh)` }} role="region" aria-roledescription="carousel" aria-label={label}>
            <div className="sp-stage">
                <div className="sp-rail">
                    <div className="sp-ticks">
                        {Array.from({ length: SPINE }, (_, i) => (
                            <Tick key={i} t={t} i={i} span={span} slide={markers[i]} title={items[markers[i]]?.title || `Slide ${markers[i] + 1}`} on={markers[i] === act} go={goTo} />
                        ))}
                        <motion.i className="sp-line" style={{ top: lineTop }} aria-hidden="true" />
                    </div>
                    <button type="button" className="sp-skip" onClick={skip} aria-label="Skip the slides and continue down the page">Skip<IcDown size={13} /></button>
                </div>

                <div className="sp-view" aria-live="polite">
                    <div className="sp-img">
                        {items.map((it, k) => (
                            <Slide key={k} t={t} k={k} src={it.image?.src} hidden={k !== act} />
                        ))}
                    </div>
                    <div className="sp-copies">{items.map((it, k) => (it.tag || it.title || it.text || it.date) && <SpineCopy key={k} t={t} k={k} it={it} />)}</div>
                    <div className="sp-ctrl">
                        <span className="sp-count"><b>{pad(act + 1)}</b>/{pad(n)}</span>
                        <button type="button" onClick={() => goTo(Math.max(0, act - 1))} disabled={act === 0} aria-label="Previous slide">‹</button>
                        <button type="button" onClick={() => goTo(Math.min(span, act + 1))} disabled={act === span} aria-label="Next slide">›</button>
                        <span className="sp-next">{next ? <><small>Next</small>{next.title || `Slide ${act + 2}`}</> : <small>Last slide</small>}</span>
                    </div>
                    <p className="sp-hint" aria-hidden="true"><IcDown size={13} />Scroll to change slide</p>
                </div>
            </div>
        </div>
    );
}

/* reduced motion / single slide: plain stacked cards, no pinning, no slicing */
function SpineFlat({ items }) {
    return (
        <div className="sp-flat">
            {items.map((it, k) => (
                <article className="sp-card" key={k}>
                    <Img img={it.image} className="sp-card-img" />
                    {(it.tag || it.title || it.text || it.date) && (
                        <div className="sp-card-b">
                            {it.tag && <span className={`p-badge p-${it.status}`}><i />{it.tag}</span>}
                            {it.title && <h3>{it.title}</h3>}
                            {it.text && <p>{it.text}</p>}
                            {it.date && <div className="p-meta"><span>{it.date}</span></div>}
                        </div>
                    )}
                </article>
            ))}
        </div>
    );
}

function Activity({ n }) {
    const a = D.activity, items = on(a.items), rm = useReducedMotion();
    if (!a.enabled || !items.length) return null;
    return (
        <Sec id="activity">
            <Head n={n} id="activity" kicker={a.kicker} title="Current *activity*" />
            {rm || items.length < 2 ? <SpineFlat items={items} /> : <SpineSlider items={items} label={a.kicker || 'Current activity'} />}
        </Sec>
    );
}

/* strategic long-term vision (pyramid) + why UniMAP */
function Vision() {
    const v = D.vision;
    return (
        <div className="p-sec p-s-light p-vision">
            <div className="p-orb p-o1" /><div className="p-grain" />
            <div className="p-wrap p-split">
                <div>
                    <header className="p-head">
                        <R className="p-eyebrow"><i />{v.kicker}</R>
                        <h2><Words text={v.title} /></h2>
                        <R d={0.2} className="p-lede">{v.text}</R>
                    </header>
                    <h3 className="p-sub">{v.whyLabel}</h3>
                    <p className="p-note">{v.whyLede}</p>
                    <div className="p-cards p-two">
                        {v.why.map(([t, s], i) => <R d={0.05 + i * 0.07} className="p-row p-tight" key={t}><h4>{t}</h4><p>{s}</p></R>)}
                    </div>
                </div>
                <div className="p-sticky vs-pyr">
                    {v.tiers.map(([t, s], i) => (
                        <div className="vs-row" key={t} style={{ width: `${52 + i * 12}%` }}>
                            <R d={i * 0.08} className="vs-tier"><b>{t}</b><span>{s}</span></R>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function About({ n }) {
    const a = D.about;
    return (
        <>
            <Sec id="about">
                <div className="p-split">
                    <div>
                        <Head n={n} id="about" title={a.title} />
                        <div className="p-cards">
                            {a.rows.map(([k, v], i) => <R d={0.1 + i * 0.08} className="p-row" key={k}><span>{k}</span><p>{v}</p></R>)}
                        </div>
                        <h3 className="p-sub p-sub-gap">{a.objectivesLabel}</h3>
                        <div className="p-cards">
                            {a.objectives.map(([t, s], i) => <R d={0.05 + i * 0.07} className="p-row p-tight" key={t}><h4>{t}</h4><p>{s}</p></R>)}
                        </div>
                        <h3 className="p-sub p-sub-gap">{a.featuresLabel}</h3>
                        <div className="p-cards p-two">
                            {a.features.map(([t, items], i) => (
                                <R d={0.05 + i * 0.07} className="p-row p-tight" key={t}>
                                    <h4>{t}</h4>
                                    <ul className="p-bul">{items.map((x) => <li key={x}>{x}</li>)}</ul>
                                </R>
                            ))}
                        </div>
                    </div>
                    <div className="p-sticky"><Img img={a.image} className="p-tall" par={12} /></div>
                </div>
                <h3 className="p-sub p-sub-lg"><Words text={a.facilitiesLabel} /></h3>
            </Sec>
            <div className="p-s-light p-hwrap">
                <HScroll>
                    {a.facilities.map((f, i) => (
                        <Tilt className="p-panel p-float" key={f.title}>
                            <span className="p-big-n">{pad(i + 1)}</span>
                            <Img img={f.image} par={8} /><div className="p-cap"><h4>{f.title}</h4><p>{f.text}</p></div>
                        </Tilt>
                    ))}
                </HScroll>
            </div>
            <Vision />
        </>
    );
}

/* accordion row (the "gaps" list) */
function Acc({ i, t, s, open, setOpen }) {
    return (
        <R className={`p-gap ${open ? 'p-on' : ''}`} d={0.05}>
            <button type="button" className="p-gap-q" onClick={() => setOpen(open ? -1 : i)} aria-expanded={open}>
                <b>{pad(i + 1)}</b><h4>{t}</h4><i className="p-caret" aria-hidden="true" />
            </button>
            <AnimatePresence initial={false}>
                {open && (
                    <motion.div className="p-gap-a" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.5, ease: EASE }}>
                        <p>{s}</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </R>
    );
}

function Why({ n }) {
    const w = D.why, [o, setO] = useState(0);
    return (
        <Sec id="why">
            <Head n={n} id="why" title={w.title} lede={w.lede} />
            <div className="wy-layers">
                {w.layers.map(([a, b, tag], i) => (
                    <R d={i * 0.1} className={`wy-l ${i === w.layers.length - 1 ? 'p-last' : ''}`} key={a}>
                        <span className="p-tag">{tag}</span><h3>{a}</h3><p>{b}</p>
                        {i < w.layers.length - 1 && <i className="wy-arrow" aria-hidden="true"><IcArrow size={18} /></i>}
                    </R>
                ))}
                <R d={0.3} className="wy-bar"><span>{w.layersNote[0]}</span> <b>{w.layersNote[1]}</b></R>
            </div>
            <div className="p-bento">
                <div className="p-bc p-b-gaps">{w.gaps.map(([t, s], i) => <Acc key={t} i={i} t={t} s={s} open={o === i} setOpen={setO} />)}</div>
                <Tilt className="p-bc p-b-img" max={5}><Img img={w.image} par={10} /></Tilt>
                <div className="p-bc p-b-perlis">
                    <h3 className="p-sub">{w.perlisLabel}</h3>
                    <p className="p-note">{w.perlisNote}</p>
                    <div className="p-plist">{w.perlis.map(([t, s]) => <div key={t}><b>{t}</b><span>{s}</span></div>)}</div>
                </div>
                {w.market.map((f, i) => (
                    <R d={i * 0.12} className={`p-bc p-fact ${i === w.market.length - 1 && w.market.length % 2 ? 'p-fact-wide' : ''}`} key={f.label}>
                        <div className="p-fact-t"><strong><Count {...f} /></strong><span>{f.label}</span></div>
                        <DotBars seed={i + 2} mode={['bars', 'blocks', 'ramp'][i % 3]} />
                    </R>
                ))}
                <div className="p-bc p-b-missing">
                    <h3 className="p-sub">{w.missingLabel}</h3>
                    <div className="p-missing">{w.missing.map((m, i) => <div key={m}><b>{pad(i + 1)}</b><span>{m}</span></div>)}</div>
                </div>
            </div>
            <p className="p-source">{w.source}</p>
        </Sec>
    );
}

/* WHAT WE DO: an editorial index. Each capability is a full-width row;
   hovering a row fills it black and slides the yellow arrow chip in.
   National applications sit below as clean white cards. */
function Capabilities({ n }) {
    const c = D.capabilities;
    return (
        <Sec id="capabilities">
            <Head n={n} id="capabilities" title={c.title} lede={c.lede} />

            <div className="cp-list">
                {c.items.map(([t, s], i) => (
                    <R d={(i % 3) * 0.06} className="cp-row" key={t}>
                        <b className="cp-n">{pad(i + 1)}</b>
                        <h4>{t}</h4>
                        <p>{s}</p>
                        <i className="cp-go" aria-hidden="true"><IcArrow size={16} /></i>
                    </R>
                ))}
            </div>

            <h3 className="p-sub p-sub-lg"><Words text={c.appsTitle} /></h3>
            <R className="p-lede cp-lede">{c.appsLede}</R>
            <R d={0.1} className="p-chips cp-badges">{c.badges.map((b) => <span key={b}>{b}</span>)}</R>

            <div className="ap-grid">
                {c.apps.map(([t, s, tag], i) => (
                    <R d={(i % 3) * 0.08} className="ap-card" key={t}>
                        <div className="ap-top"><span>{pad(i + 1)}</span><em>{tag}</em></div>
                        <h4>{t}</h4>
                        <p>{s}</p>
                    </R>
                ))}
            </div>
        </Sec>
    );
}

function Programmes({ n }) {
    const p = D.programmes;
    return (
        <>
            <Sec id="programmes" className="p-short">
                <Head n={n} id="programmes" title={p.title} lede={p.lede} />
            </Sec>
            <div className="p-s-dark p-hwrap">
                <HScroll>
                    {on(p.items).map((c, i) => (
                        <Tilt className="p-panel p-prog-panel p-float" key={c.title}>
                            <span className="p-big-n">{pad(i + 1)}</span>
                            <Img img={c.image} par={8} />
                            <div className="p-cap"><span className="p-tag">{c.tag}</span><h4>{c.title}</h4><p>{c.text}</p></div>
                        </Tilt>
                    ))}
                    <div className="p-panel p-end"><DotBars seed={7} mode="ramp" cols={16} rows={9} /><Btn to="apply">Apply to Participate</Btn></div>
                </HScroll>
            </div>
        </>
    );
}

function Who({ n }) {
    const w = D.who;
    return (
        <Sec id="who">
            <div className="p-split p-rev">
                <div className="p-sticky"><Img img={w.image} className="p-tall" par={12} /></div>
                <div>
                    <Head n={n} id="who" title={w.title} />
                    <div className="p-cards p-two">
                        {w.items.map(([t, s], i) => <R d={0.1 + i * 0.07} className="p-row p-tight" key={t}><h4>{t}</h4><p>{s}</p></R>)}
                    </div>
                    <R d={0.5} className="p-chips">{w.ways.map((x) => <span key={x}>{x}</span>)}</R>
                </div>
            </div>
        </Sec>
    );
}

/* Roadmap: a clickable Gantt timeline (the bars are the tabs) + a detail panel per phase.
   No scroll-jacking: the page scrolls normally and the person picks the phase.
   The year grid adapts to however many years the span covers. */
function Roadmap({ n }) {
    const r = D.roadmap, N = r.phases.length;
    const [a, setA] = useState(Math.max(0, r.phases.findIndex((p) => p.now)));
    const [y0, y1] = r.span, ph = r.phases[a];
    const pct = (v) => ((v - y0) / (y1 - y0)) * 100;
    const years = Array.from({ length: y1 - y0 }, (_, i) => y0 + i);
    return (
        <Sec id="roadmap">
            <Head n={n} id="roadmap" title={r.title} lede={r.lede} />

            <R className="rm-gantt">
                <div className="rm-years">
                    <i />
                    <div className="rm-yrs" style={{ gridTemplateColumns: `repeat(${years.length}, 1fr)` }}>{years.map((y, i) => <span key={y}>{y}{i === years.length - 1 ? '+' : ''}</span>)}</div>
                </div>
                {r.phases.map((p, i) => (
                    <button type="button" key={p.title} className={`rm-lane ${i === a ? 'p-on' : ''}`} style={{ '--n': years.length }} onClick={() => setA(i)} aria-pressed={i === a}>
                        <span className="rm-lab"><b>{p.title}</b><small>{p.name}</small></span>
                        <span className="rm-track">
                            <span className="rm-bar" style={{ left: `${pct(p.from)}%`, width: `${pct(p.to) - pct(p.from)}%` }}>
                                {p.now && <i className="rm-pulse" />}<span>{p.period}</span>
                            </span>
                        </span>
                    </button>
                ))}
            </R>

            <AnimatePresence mode="wait">
                <motion.div key={a} className="rm-detail" initial={{ opacity: 0, y: 26 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.45, ease: EASE }}>
                    <div className="rm-top">
                        <div className="rm-main">
                            <span className="p-step"><i />{ph.title} <s>· {ph.period}</s></span>
                            <h3>{ph.name}</h3>
                            <p className="rm-text">{ph.text}</p>
                            {ph.now && <span className="p-tag p-now">{r.currentLabel}</span>}
                            {ph.objective && <div className="rm-obj"><small>Phase objective</small><p>{ph.objective}</p></div>}
                            <div className="rm-nav">
                                <button type="button" onClick={() => setA((x) => (x - 1 + N) % N)} aria-label="Previous phase">‹</button>
                                <span>{pad(a + 1)} / {pad(N)}</span>
                                <button type="button" onClick={() => setA((x) => (x + 1) % N)} aria-label="Next phase">›</button>
                            </div>
                        </div>
                        <div className="rm-out">
                            <small>Expected outcomes</small>
                            <ul>{ph.outcomes.map((o) => <li key={o}><IcCheck size={15} />{o}</li>)}</ul>
                        </div>
                    </div>
                    <div className="rm-comps">
                        {ph.components.map(([t, items], i) => (
                            <div className="rm-comp" key={t}><span>{pad(i + 1)}</span><h4>{t}</h4><ul>{items.map((x) => <li key={x}>{x}</li>)}</ul></div>
                        ))}
                    </div>
                </motion.div>
            </AnimatePresence>

            <div className="rm-end">
                <R className="p-bc"><h3 className="p-sub">{r.outcomeLabel}</h3><div className="p-chips">{r.outcomes.map((x) => <span key={x}>{x}</span>)}</div></R>
                <R d={0.1} className="p-bc"><h3 className="p-sub">{r.enablersLabel}</h3><div className="p-chips">{r.enablers.map((x) => <span key={x}>{x}</span>)}</div></R>
            </div>
            <p className="rm-closing">{r.closing}</p>
            <Img img={r.image} className="p-strip" par={14} />
        </Sec>
    );
}

/* the site: where it is, how much land, Phase 1 layout, and the two planned corridors.
   LAND USE is drawn as three big rows: a large dark number, a plain label, and a bar drawn to scale
   against the total area. Percentages are calculated from the data, so they can never drift.
   Exact corridor maps: put an embed URL or an image in homeData -> site.map and it appears here. */
function Site({ n }) {
    const s = D.site, rm = useReducedMotion(), total = s.stats[0].to;
    const hasMap = s.map?.embed || s.map?.image?.src;
    return (
        <Sec id="site">
            <Head n={n} id="site" title={s.title} lede={s.lede} />

            <div className="st-top">
                <R className="p-bc st-where">
                    <span className="p-tag">{s.where.tag}</span>
                    <h3>{s.where.name}</h3>
                    <p>{s.where.note}</p>
                    <ul className="st-facts">
                        {s.where.facts.map(([k, v]) => <li key={k}><span>{k}</span><b>{v}</b></li>)}
                    </ul>
                </R>
                <R d={0.1} className="p-bc st-land">
                    <h3 className="p-sub">{s.landLabel}</h3>
                    {s.stats.map((f, i) => {
                        const pct = Math.round((f.to / total) * 100);
                        return (
                            <div className="ld-row" key={f.label}>
                                <div className="ld-top">
                                    <strong><Count {...f} /></strong>
                                    <div className="ld-txt">
                                        <b>{f.label}</b>
                                        <small>{i === 0 ? 'Total land area' : `About ${pct}% of the sandbox land`}</small>
                                    </div>
                                </div>
                                <div className="ld-bar">
                                    <motion.i className={`ld-fill${i === 0 ? ' ld-total' : ''}`} style={{ width: `${pct}%` }}
                                        initial={rm ? false : { scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true }}
                                        transition={{ duration: 1.2, delay: 0.2 + i * 0.15, ease: EASE }} />
                                </div>
                            </div>
                        );
                    })}
                    <p className="ld-note">Bars are drawn to scale against the total land area.</p>
                </R>
            </div>

            <div className="st-split">
                <R className="p-bc st-p1">
                    <h3 className="p-sub">{s.p1Label}</h3>
                    <p className="st-note">{s.p1Text}</p>
                    <div className="p-chips">{s.p1.map((x, i) => <span key={x}><b>{i + 1}</b>{x}</span>)}</div>
                </R>
                <Img img={s.image} className="p-wide" par={10} />
            </div>

            <h3 className="p-sub p-sub-lg"><Words text={s.corridorsLabel} /></h3>
            {hasMap && (
                <R className="st-map">
                    {s.map.embed
                        ? <iframe src={s.map.embed} title={s.map.title || 'Planned flight corridors'} loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen />
                        : <Img img={s.map.image} />}
                </R>
            )}
            <div className="st-cor">
                {s.corridors.map((c, i) => (
                    <R d={i * 0.1} className="p-bc st-card" key={c.title}>
                        <Img img={c.image} className="p-wide" />
                        <div className="st-body">
                            <span className="p-tag">{c.tag}</span><h4>{c.title}</h4><p>{c.text}</p>
                            <ul className="st-route">{c.route.map((w, k) => <li key={w}><b>{k + 1}</b>{w}</li>)}</ul>
                        </div>
                    </R>
                ))}
            </div>
            {s.corridorsNote && <p className="st-foot">{s.corridorsNote}</p>}
        </Sec>
    );
}

/* a row list where the image follows the hover */
function News({ n }) {
    const s = D.news, [h, setH] = useState(0), list = on(s.items);
    return (
        <Sec id="news">
            <Head n={n} id="news" title={s.title} />
            <div className="p-nlist">
                <div className="p-npreview"><AnimatePresence mode="wait"><motion.div key={h} initial={{ opacity: 0, scale: 1.06 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}><Img img={list[h]?.image} /></motion.div></AnimatePresence></div>
                <div className="p-nrows">
                    {list.map((c, i) => (
                        <R d={i * 0.08} key={i}>
                            <a className={`p-nrow ${i === h ? 'p-on' : ''}`} href={c.href || undefined} onMouseEnter={() => setH(i)} onFocus={() => setH(i)}>
                                <span className="p-muted">{c.date}</span><h4>{c.title}</h4><p>{c.text}</p><em>Read more <IcArrow size={13} /></em>
                            </a>
                        </R>
                    ))}
                    {s.more?.href && <R d={0.3} className="p-more"><Btn variant="light" onClick={() => { window.location.href = s.more.href; }}>{s.more.label}</Btn></R>}
                </div>
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
                    <R d={i * 0.08} className="p-ev" key={i}>
                        <div className="p-date"><b>{e.day}</b><span>{e.month}</span></div>
                        <Img img={e.image} className="p-thumb" />
                        <div className="p-evt"><h4>{e.title}</h4><p>{e.where}</p></div>
                        <span className="p-tag">{e.type}</span>
                        <i className="p-ev-go" aria-hidden="true"><IcArrow size={15} /></i>
                    </R>
                ))}
            </div>
        </Sec>
    );
}

function Gallery({ n }) {
    const g = D.gallery, [open, setOpen] = useState(null);
    useEffect(() => {
        const k = (e) => e.key === 'Escape' && setOpen(null);
        window.addEventListener('keydown', k);
        return () => window.removeEventListener('keydown', k);
    }, []);
    /* lock page scroll while the lightbox is open */
    useEffect(() => {
        if (!open) return undefined;
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = prev; };
    }, [open]);
    return (
        <>
            <Sec id="gallery">
                <Head n={n} id="gallery" title={g.title} />
                <div className="p-masonry">
                    {g.items.map((im, i) => (
                        <button type="button" className="p-mi" key={i} onClick={() => setOpen(im)} aria-label={`Open ${im.alt}`}><Img img={im} par={6} /><span>{im.alt}</span></button>
                    ))}
                </div>
            </Sec>
            <AnimatePresence>
                {open && (
                    <motion.div className="p-lb" onClick={() => setOpen(null)} role="dialog" aria-modal="true" aria-label={open.alt} initial={{ clipPath: 'circle(0% at 50% 50%)' }} animate={{ clipPath: 'circle(150% at 50% 50%)' }} exit={{ clipPath: 'circle(0% at 50% 50%)' }} transition={{ duration: 0.7, ease: EASE }}>
                        <img src={open.src} alt={open.alt} /><p>{open.alt}</p><button type="button" aria-label="Close" autoFocus>×</button>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

function Partners({ n }) {
    const p = D.partners;
    return (
        <Sec id="partners">
            <Head n={n} id="partners" title={p.title} lede={p.lede} />
            <div className="pr-roles">
                {p.roles.map(([t, k, s], i) => <R d={i * 0.07} className="p-bc pr-role" key={t}><small>{k}</small><h4>{t}</h4><p>{s}</p></R>)}
            </div>
            <div className="pr-mid">
                <R className="pr-quote">{p.quote}</R>
                <R d={0.1} className="p-bc pr-strength">
                    <h3 className="p-sub">{p.strengthLabel}</h3>
                    <div>{p.strength.map(([t, s]) => <p key={t}><b>{t}</b><span>{s}</span></p>)}</div>
                </R>
            </div>
            <R className="p-chips pr-enable"><strong>{p.enableLabel}</strong>{p.enable.map((x) => <span key={x}>{x}</span>)}</R>
            {p.groups.map((g, gi) => (
                <R d={gi * 0.1} className="p-pg" key={g.group}>
                    <h3 className="p-sub">{g.group}</h3>
                    <div className="p-logos">
                        {g.items.map((x) => <div className="p-logo" key={x.name} title={x.name}>{x.logo ? <img src={x.logo} alt={x.name} loading="lazy" /> : <span>{x.name}</span>}</div>)}
                    </div>
                </R>
            ))}
        </Sec>
    );
}

function Apply({ n }) {
    const a = D.apply, [sent, setSent] = useState(false);
    return (
        <Sec id="apply">
            <div className="p-split">
                <div>
                    <Head n={n} id="apply" title={a.title} />
                    <div className="p-steps">{a.steps.map((t, i) => <R d={0.1 + i * 0.1} key={t}><strong>{i + 1}</strong><span>{t}</span></R>)}</div>
                    <R d={0.5} className="p-cta"><Btn variant="dark" onClick={() => { if (a.applyHref) window.location.href = a.applyHref; }}>{a.applyLabel}</Btn></R>
                    <div className="p-sub-card">
                        <h3 className="p-sub">{a.subscribeLabel}</h3>
                        <p className="p-lede">{a.subscribeText}</p>
                        <form className="p-nform" onSubmit={(e) => { e.preventDefault(); /* TODO: connect newsletter endpoint */ setSent(true); e.currentTarget.reset(); }}>
                            <input type="email" required placeholder={a.emailPlaceholder} aria-label={a.emailPlaceholder} />
                            <button type="submit"><IcArrow size={14} />{a.subscribeButton}</button>
                        </form>
                        <p className="p-thanks" role="status" aria-live="polite">{sent ? <><IcCheck size={14} /> {a.thanks}</> : ''}</p>
                    </div>
                </div>
                <Img img={a.image} className="p-tall" par={12} />
            </div>
        </Sec>
    );
}

const MAP = { hero: Hero, activity: Activity, about: About, why: Why, capabilities: Capabilities, programmes: Programmes, who: Who, roadmap: Roadmap, site: Site, news: News, events: Events, gallery: Gallery, partners: Partners, apply: Apply };

/* ---------- PAGE ---------- */
export default function Home() {
    const root = useRef(null), [active, setActive] = useState('hero');
    const order = D.layout.filter((k) => MAP[k] && !(k === 'activity' && (!D.activity.enabled || !on(D.activity.items).length)));
    const { scrollYProgress } = useScroll();
    const bar = useSpring(scrollYProgress, { stiffness: 120, damping: 28 });

    useEffect(() => {
        if (!root.current) return undefined;
        const spy = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && setActive(e.target.dataset.sec)), { rootMargin: '-50% 0px -50% 0px', threshold: 0 });
        root.current.querySelectorAll('[data-sec]').forEach((x) => spy.observe(x));
        return () => spy.disconnect();
    }, []);

    return (
        <TotalCtx.Provider value={order.length}>
            <div className="psb" ref={root} data-theme={THEME[active]}>
                <PsbLoader />
                <Hud order={order} active={active} />
                <motion.div className="p-prog" style={{ scaleX: bar }} aria-hidden="true" />
                {order.map((k, idx) => { const C = MAP[k]; return <C key={k} n={idx + 1} />; })}
            </div>
        </TotalCtx.Provider>
    );
}

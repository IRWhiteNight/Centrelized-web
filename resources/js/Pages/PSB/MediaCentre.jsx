import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import '../../../css/PSB-css/psb-media.css';

import {
    images, links, page, hero, sections, ticker, news, press, events, gallery, articles, subscribe,
} from '../../data/PSB-data/mediaData';

/* ==========================================================================
   Small helpers
========================================================================== */

const D = (i) => ({ '--d': Math.min(i, 8) * 80 });
const pad = (n) => String(n + 1).padStart(2, '0');
const reduced = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const fmt = (s, o) => new Date(`${s}T00:00:00`).toLocaleDateString('en-GB', o || { day: 'numeric', month: 'short', year: 'numeric' });
const todayStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/* adds .in to every .mc-rv once it scrolls into view (also picks up nodes added later by filters) */
function useReveal(rootRef) {
    useEffect(() => {
        const root = rootRef.current;
        if (!root) return undefined;
        if (reduced() || !('IntersectionObserver' in window)) {
            root.classList.add('mc-static');
            return undefined;
        }
        const io = new IntersectionObserver((entries) => {
            entries.forEach((e) => {
                if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -5% 0px' });
        const scan = () => root.querySelectorAll('.mc-rv:not(.in):not([data-o])').forEach((n) => { n.dataset.o = '1'; io.observe(n); });
        scan();
        const mo = new MutationObserver(scan);
        mo.observe(root, { childList: true, subtree: true });
        return () => { io.disconnect(); mo.disconnect(); };
    }, [rootRef]);
}

/* number that counts up the first time it is seen */
function Counter({ value, suffix = '', delay = 0 }) {
    const ref = useRef(null);
    const [v, setV] = useState(reduced() ? value : 0);
    useEffect(() => {
        if (reduced()) { setV(value); return undefined; }
        const el = ref.current;
        let raf = 0; let timer = 0;
        const run = () => {
            const t0 = performance.now();
            const tick = (t) => {
                const p = Math.min(1, (t - t0) / 1500);
                setV(Math.round(value * (p === 1 ? 1 : 1 - Math.pow(2, -10 * p))));
                if (p < 1) raf = requestAnimationFrame(tick);
            };
            raf = requestAnimationFrame(tick);
        };
        const io = new IntersectionObserver(([e]) => {
            if (e.isIntersecting) { io.disconnect(); timer = setTimeout(run, delay); }
        }, { threshold: 0.4 });
        io.observe(el);
        return () => { io.disconnect(); clearTimeout(timer); cancelAnimationFrame(raf); };
    }, [value, delay]);
    return <span ref={ref}>{v}{suffix && <small>{suffix}</small>}</span>;
}

/* picture with fade-in. Unknown / broken image -> generated placeholder, so the page never looks empty */
function Pic({ name, alt = '', className = '', eager = false }) {
    const src = images[name];
    const [ok, setOk] = useState(true);
    const [loaded, setLoaded] = useState(false);
    const ref = useRef(null);
    useEffect(() => { if (ref.current && ref.current.complete && ref.current.naturalWidth) setLoaded(true); }, [src]);
    if (!src || !ok) {
        return (
            <span className={`mc-art ${className}`} role="img" aria-label={alt}>
                <i aria-hidden="true" />
                <b>{alt}</b>
            </span>
        );
    }
    return (
        <img
            ref={ref}
            className={`mc-pic ${loaded ? 'is-loaded' : ''} ${className}`}
            src={src}
            alt={alt}
            loading={eager ? 'eager' : 'lazy'}
            decoding="async"
            onLoad={() => setLoaded(true)}
            onError={() => setOk(false)}
        />
    );
}

const Arrow = () => (
    <svg className="mc-arrow" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
        <path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
    </svg>
);
const Chevron = ({ dir = 'right' }) => (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" style={{ transform: dir === 'left' ? 'scaleX(-1)' : undefined }}>
        <path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
    </svg>
);
const PlayIcon = () => (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M8 5v14l11-7z" fill="currentColor" /></svg>
);
const CloseIcon = () => (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" /></svg>
);

function Head({ n, label, title, lede, children }) {
    return (
        <header className="mc-head">
            <p className="mc-kicker mc-rv"><span>{pad(n)}</span>{label}</p>
            <h2 className="mc-h mc-rv" style={D(1)}>{title}</h2>
            {lede && <p className="mc-lede mc-rv" style={D(2)}>{lede}</p>}
            {children}
        </header>
    );
}

function Filters({ items, value, onChange, counts, label }) {
    return (
        <div className="mc-filters mc-rv" role="tablist" aria-label={label}>
            {items.map((f) => (
                <button key={f} role="tab" aria-selected={value === f} className={value === f ? 'is-on' : ''} onClick={() => onChange(f)}>
                    {f}{counts && counts[f] != null && <sup>{counts[f]}</sup>}
                </button>
            ))}
        </div>
    );
}

/* full-screen layer: Esc to close, page scroll locked, focus returns afterwards */
function Overlay({ onClose, label, className = '', children }) {
    const closeRef = useRef(onClose);
    closeRef.current = onClose;
    const boxRef = useRef(null);
    useEffect(() => {
        const prev = document.activeElement;
        const html = document.documentElement;
        const old = html.style.overflow;
        html.style.overflow = 'hidden';
        const onKey = (e) => { if (e.key === 'Escape') closeRef.current(); };
        window.addEventListener('keydown', onKey);
        const btn = boxRef.current && boxRef.current.querySelector('[data-autofocus]');
        if (btn) btn.focus();
        return () => {
            html.style.overflow = old;
            window.removeEventListener('keydown', onKey);
            if (prev && prev.focus) prev.focus();
        };
    }, []);
    return (
        <div className={`mc-overlay ${className}`} role="dialog" aria-modal="true" aria-label={label} ref={boxRef}>
            <div className="mc-backdrop" onClick={onClose} />
            {children}
        </div>
    );
}

/* video: poster first, loads the real player only on click (fast page, no surprise autoplay) */
function Player({ item, autoPlay = false }) {
    const [on, setOn] = useState(autoPlay);
    const has = item.youtube || item.mp4;
    return (
        <div className="mc-player">
            {on && item.youtube && (
                <iframe
                    title={item.title}
                    src={`https://www.youtube-nocookie.com/embed/${item.youtube}?autoplay=1&rel=0`}
                    allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                    allowFullScreen
                />
            )}
            {on && !item.youtube && item.mp4 && <video src={item.mp4} controls autoPlay playsInline poster={images[item.image]} />}
            {!(on && has) && (
                <>
                    <Pic name={item.image} alt={item.title} className="mc-player-poster" />
                    <div className="mc-player-shade" />
                    <button className="mc-play" onClick={() => setOn(true)} aria-label={`Play ${item.title}`}>
                        <span><PlayIcon /></span>
                    </button>
                    {on && !has && (
                        <p className="mc-player-note">
                            Video source not added yet. Set <code>youtube</code> or <code>mp4</code> for this item in <code>mediaData.js</code>.
                        </p>
                    )}
                    {item.duration && <span className="mc-player-dur">{item.duration}</span>}
                </>
            )}
        </div>
    );
}

/* ==========================================================================
   Story reader (news)
========================================================================== */

function Story({ list, index, onIndex, onClose }) {
    const s = list[index];
    const prev = list[index - 1]; const next = list[index + 1];
    return (
        <Overlay onClose={onClose} label={s.title} className="mc-overlay--story">
            <article className="mc-story" key={s.id}>
                <button className="mc-x" onClick={onClose} aria-label="Close story" data-autofocus><CloseIcon /></button>
                <div className="mc-story-img"><Pic name={s.image} alt={s.title} eager /></div>
                <div className="mc-story-body">
                    <p className="mc-meta"><span className="mc-chip">{s.category}</span><time>{fmt(s.date)}</time><span>{s.readTime} min read</span></p>
                    <h3>{s.title}</h3>
                    <p className="mc-story-sum">{s.summary}</p>
                    {(s.body || []).map((p) => <p key={p.slice(0, 24)}>{p}</p>)}
                    <div className="mc-story-nav">
                        <button disabled={!prev} onClick={() => onIndex(index - 1)}><Chevron dir="left" /><span>{prev ? prev.title : 'Newest story'}</span></button>
                        <button disabled={!next} onClick={() => onIndex(index + 1)}><span>{next ? next.title : 'Oldest story'}</span><Chevron /></button>
                    </div>
                </div>
            </article>
        </Overlay>
    );
}

/* ==========================================================================
   Lightbox (photos + videos)
========================================================================== */

function Lightbox({ list, index, onIndex, onClose }) {
    const item = list[index];
    const dir = useRef('next');
    const [zoom, setZoom] = useState(null);
    const touch = useRef(null);
    const thumbs = useRef(null);

    const go = useCallback((d) => {
        const n = (index + d + list.length) % list.length;
        dir.current = d > 0 ? 'next' : 'prev';
        setZoom(null);
        onIndex(n);
    }, [index, list.length, onIndex]);

    useEffect(() => {
        const onKey = (e) => {
            if (e.key === 'ArrowRight') go(1);
            if (e.key === 'ArrowLeft') go(-1);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [go]);

    useEffect(() => {
        const b = thumbs.current && thumbs.current.querySelector('.is-on');
        if (b) thumbs.current.scrollTo({ left: b.offsetLeft - thumbs.current.clientWidth / 2 + b.clientWidth / 2, behavior: 'smooth' });
    }, [index]);

    const onTouchEnd = (e) => {
        if (!touch.current) return;
        const dx = e.changedTouches[0].clientX - touch.current;
        touch.current = null;
        if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
    };
    const onZoom = (e) => {
        if (item.type !== 'photo') return;
        if (zoom) { setZoom(null); return; }
        const r = e.currentTarget.getBoundingClientRect();
        setZoom({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
    };
    const onZoomMove = (e) => {
        if (!zoom) return;
        const r = e.currentTarget.getBoundingClientRect();
        setZoom({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
    };

    return (
        <Overlay onClose={onClose} label={item.title} className="mc-overlay--lb">
            <div className="mc-lb-top">
                <p className="mc-lb-count"><b>{String(index + 1).padStart(2, '0')}</b> / {String(list.length).padStart(2, '0')}</p>
                <button className="mc-x mc-x--static" onClick={onClose} aria-label="Close" data-autofocus><CloseIcon /></button>
            </div>

            <div className="mc-lb-stage" onTouchStart={(e) => { touch.current = e.touches[0].clientX; }} onTouchEnd={onTouchEnd}>
                <button className="mc-lb-arrow mc-lb-arrow--l" onClick={() => go(-1)} aria-label="Previous"><Chevron dir="left" /></button>
                <figure className={`mc-lb-fig from-${dir.current}`} key={item.id}>
                    {item.type === 'video' ? (
                        <Player item={item} autoPlay />
                    ) : (
                        <div
                            className={`mc-lb-img ${zoom ? 'is-zoom' : ''}`}
                            onClick={onZoom}
                            onMouseMove={onZoomMove}
                            style={zoom ? { '--zx': `${zoom.x}%`, '--zy': `${zoom.y}%` } : undefined}
                        >
                            <Pic name={item.image} alt={item.title} eager />
                        </div>
                    )}
                </figure>
                <button className="mc-lb-arrow mc-lb-arrow--r" onClick={() => go(1)} aria-label="Next"><Chevron /></button>
            </div>

            <div className="mc-lb-cap" key={`c${item.id}`}>
                <p className="mc-meta"><span className="mc-chip">{item.type === 'video' ? 'Video' : item.album}</span>{item.type === 'photo' && <em>Click image to zoom</em>}</p>
                <h3>{item.title}</h3>
                <p>{item.caption}</p>
            </div>

            <div className="mc-lb-thumbs" ref={thumbs}>
                {list.map((t, i) => (
                    <button key={t.id} className={i === index ? 'is-on' : ''} onClick={() => { dir.current = i > index ? 'next' : 'prev'; setZoom(null); onIndex(i); }} aria-label={t.title}>
                        <Pic name={t.image} alt="" />
                        {t.type === 'video' && <i aria-hidden="true"><PlayIcon /></i>}
                    </button>
                ))}
            </div>
        </Overlay>
    );
}

/* ==========================================================================
   Countdown
========================================================================== */

function Countdown({ date }) {
    const target = useMemo(() => new Date(`${date}T00:00:00`).getTime(), [date]);
    const [now, setNow] = useState(() => Date.now());
    useEffect(() => {
        const t = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(t);
    }, []);
    const s = Math.max(0, Math.floor((target - now) / 1000));
    const parts = [['Days', Math.floor(s / 86400)], ['Hours', Math.floor((s % 86400) / 3600)], ['Min', Math.floor((s % 3600) / 60)], ['Sec', s % 60]];
    return (
        <div className="mc-count" role="timer" aria-label="Time until the event">
            {parts.map(([l, v]) => (
                <div key={l}><b key={v} className="mc-tick">{String(v).padStart(2, '0')}</b><span>{l}</span></div>
            ))}
        </div>
    );
}

const icsEsc = (t) => String(t || '').replace(/[,;]/g, (c) => `\\${c}`);
const icsHref = (e) => {
    const d = e.date.replace(/-/g, '');
    const nx = new Date(`${e.date}T00:00:00`); nx.setDate(nx.getDate() + 1);
    const n = `${nx.getFullYear()}${String(nx.getMonth() + 1).padStart(2, '0')}${String(nx.getDate()).padStart(2, '0')}`;
    const txt = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'BEGIN:VEVENT', `DTSTART;VALUE=DATE:${d}`, `DTEND;VALUE=DATE:${n}`,
        `SUMMARY:${icsEsc(e.title)}`, `LOCATION:${icsEsc(e.location)}`, `DESCRIPTION:${icsEsc(`${e.time} - ${e.summary}`)}`, 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
    return `data:text/calendar;charset=utf-8,${encodeURIComponent(txt)}`;
};

/* ==========================================================================
   PAGE
========================================================================== */

export default function MediaCentre() {
    const rootRef = useRef(null);
    const railRef = useRef(null);
    const [activeSection, setActiveSection] = useState(sections[0].id);

    /* news */
    const [cat, setCat] = useState('All');
    const [shown, setShown] = useState(6);
    const [story, setStory] = useState(null);
    /* press */
    const [ptype, setPtype] = useState('All');
    const [pq, setPq] = useState('');
    const [popen, setPopen] = useState(press.items[0] ? press.items[0].id : null);
    /* events */
    const [etab, setEtab] = useState('Upcoming');
    /* gallery */
    const [gf, setGf] = useState('All');
    const [lb, setLb] = useState(null);
    const [film, setFilm] = useState(0);
    /* articles / social */
    const [plat, setPlat] = useState('All');
    const [rail, setRail] = useState({ p: 0, canL: false, canR: true });
    /* subscribe */
    const [email, setEmail] = useState('');
    const [sub, setSub] = useState('idle');

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
        const a = rootRef.current.querySelector('.mc-subnav a.is-active');
        const box = rootRef.current.querySelector('.mc-subnav-scroll');
        if (a && box) box.scrollTo({ left: a.offsetLeft - box.clientWidth / 2 + a.clientWidth / 2, behavior: 'smooth' });
    }, [activeSection]);

    const goTo = useCallback((id) => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, []);

    /* cursor spotlight on .mc-spot elements */
    const onMove = useCallback((e) => {
        const t = e.target.closest && e.target.closest('.mc-spot');
        if (!t) return;
        const r = t.getBoundingClientRect();
        t.style.setProperty('--mx', `${e.clientX - r.left}px`);
        t.style.setProperty('--my', `${e.clientY - r.top}px`);
    }, []);

    /* ---------- derived data ---------- */
    const newsSorted = useMemo(() => [...news.items].sort((a, b) => b.date.localeCompare(a.date)), []);
    const newsList = useMemo(() => newsSorted.filter((n) => cat === 'All' || n.category === cat), [newsSorted, cat]);
    const lead = newsList.find((n) => n.featured) || newsList[0];
    const rest = newsList.filter((n) => n !== lead);
    const newsCounts = useMemo(() => {
        const c = { All: news.items.length };
        news.items.forEach((n) => { c[n.category] = (c[n.category] || 0) + 1; });
        return c;
    }, []);

    const pressList = useMemo(() => {
        const q = pq.trim().toLowerCase();
        return [...press.items].sort((a, b) => b.date.localeCompare(a.date))
            .filter((p) => (ptype === 'All' || p.type === ptype) && (!q || `${p.title} ${p.summary}`.toLowerCase().includes(q)));
    }, [ptype, pq]);

    const today = todayStr();
    const upcoming = useMemo(() => events.items.filter((e) => e.date >= today).sort((a, b) => a.date.localeCompare(b.date)), [today]);
    const past = useMemo(() => events.items.filter((e) => e.date < today).sort((a, b) => b.date.localeCompare(a.date)), [today]);
    const evList = etab === 'Upcoming' ? upcoming : past;
    const nextEv = upcoming[0];

    const photos = gallery.items.filter((g) => g.type === 'photo');
    const films = gallery.items.filter((g) => g.type === 'video');
    const albums = [...new Set(gallery.items.map((g) => g.album))].filter((a) => a !== 'Films');
    const gFilters = ['All', 'Photos', 'Videos', ...albums];
    const gCounts = { All: gallery.items.length, Photos: photos.length, Videos: films.length };
    albums.forEach((a) => { gCounts[a] = gallery.items.filter((g) => g.album === a).length; });
    const gList = gallery.items.filter((g) => gf === 'All' || (gf === 'Photos' && g.type === 'photo') || (gf === 'Videos' && g.type === 'video') || g.album === gf);

    const platforms = ['All', ...articles.social.platforms.map((p) => p.name)];
    const posts = articles.social.posts.filter((p) => plat === 'All' || p.platform === plat);

    const heroStats = [
        { value: news.items.length, label: 'Stories & project updates' },
        { value: press.items.length, label: 'Press releases' },
        { value: photos.length, label: 'Photos' },
        { value: films.length, label: 'Films' },
    ];
    const reel = [0, 1, 2].map((c) => hero.strip.filter((_, i) => i % 3 === c));

    /* ---------- articles rail ---------- */
    const measureRail = useCallback(() => {
        const el = railRef.current;
        if (!el) return;
        const max = el.scrollWidth - el.clientWidth;
        setRail({ p: max > 0 ? el.scrollLeft / max : 0, canL: el.scrollLeft > 4, canR: el.scrollLeft < max - 4 });
    }, []);
    useEffect(() => {
        measureRail();
        window.addEventListener('resize', measureRail);
        return () => window.removeEventListener('resize', measureRail);
    }, [measureRail]);
    const slide = (d) => {
        const el = railRef.current;
        if (el) el.scrollBy({ left: d * Math.min(el.clientWidth * 0.8, 420), behavior: 'smooth' });
    };
    const drag = useRef(null);
    const onRailDown = (e) => {
        if (e.pointerType !== 'mouse') return;
        drag.current = { x: e.clientX, l: railRef.current.scrollLeft, moved: false };
    };
    const onRailMove = (e) => {
        const d = drag.current;
        if (!d) return;
        const dx = e.clientX - d.x;
        if (Math.abs(dx) > 4) d.moved = true;
        railRef.current.scrollLeft = d.l - dx;
    };
    const onRailUp = () => { setTimeout(() => { drag.current = null; }, 0); };
    const onRailClick = (e) => { if (drag.current && drag.current.moved) e.preventDefault(); };

    /* ---------- subscribe ---------- */
    const submit = async (e) => {
        e.preventDefault();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setSub('error'); return; }
        setSub('loading');
        try {
            if (subscribe.endpoint) {
                const r = await fetch(subscribe.endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: email.trim() }) });
                if (!r.ok) throw new Error('failed');
            } else {
                await new Promise((res) => setTimeout(res, 700));
            }
            setSub('done');
            setEmail('');
        } catch (err) {
            setSub('fail');
        }
    };

    const storyIndex = story ? newsList.findIndex((n) => n.id === story) : -1;

    return (
        <div className="mc" ref={rootRef} onMouseMove={onMove} aria-label={page.title}>

            {/* ===================== HERO ===================== */}
            <section className="mc-hero" id="top">
                <div className="mc-hero-wipe" aria-hidden="true" />
                <div className="mc-hero-grid" aria-hidden="true" />
                <div className="mc-reel" aria-hidden="true">
                    {reel.map((col, ci) => (
                        <div className={`mc-reel-col mc-reel-col--${ci}`} key={ci}>
                            <div className="mc-reel-track">
                                {[0, 1].map((k) => (
                                    <div key={k}>
                                        {col.map((im) => <figure key={`${k}${im}`}><Pic name={im} alt="" /></figure>)}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mc-wrap mc-hero-in">
                    <p className="mc-eyebrow"><i />{hero.eyebrow}</p>
                    <h1 className="mc-hero-title">
                        {hero.titleLines.map((l, i) => (
                            <span className="mc-ln" key={l}>
                                <span className={l === hero.highlight ? 'mc-hl' : ''} style={{ '--i': i }}>{l}</span>
                            </span>
                        ))}
                    </h1>
                    <p className="mc-lede mc-hero-lede">{hero.lede}</p>
                    <div className="mc-hero-cta">
                        <button className="mc-btn" onClick={() => goTo('news')}>{hero.primaryButton}<Arrow /></button>
                        <button className="mc-btn mc-btn--ghost" onClick={() => goTo('gallery')}>{hero.secondaryButton}</button>
                    </div>
                </div>

                <div className="mc-wrap mc-stats">
                    {heroStats.map((s, i) => (
                        <div className="mc-stat" key={s.label} style={{ '--i': i }}>
                            <strong><Counter value={s.value} delay={1500 + i * 120} /></strong>
                            <span>{s.label}</span>
                        </div>
                    ))}
                </div>
                <div className="mc-scroll-cue" aria-hidden="true"><span /></div>
            </section>

            {/* ===================== STICKY MENU ===================== */}
            <nav className="mc-subnav" aria-label="Media Centre sections">
                <div className="mc-wrap mc-subnav-scroll">
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
                <div className="mc-progress" aria-hidden="true"><span /></div>
            </nav>

            {/* ===================== TICKER ===================== */}
            <div className="mc-ticker" aria-hidden="true">
                <div className="mc-ticker-track">
                    {[0, 1].map((k) => <ul key={k}>{ticker.map((t) => <li key={t + k}>{t}</li>)}</ul>)}
                </div>
            </div>

            {/* ===================== 01 NEWS ===================== */}
            <section className="mc-sec mc-sec--light" id="news">
                <div className="mc-wrap">
                    <Head n={0} label="News & project updates" title={news.heading} lede={news.lede} />
                    <Filters items={news.categories} value={cat} onChange={(c) => { setCat(c); setShown(6); }} counts={newsCounts} label="News categories" />

                    <div className="mc-news" key={cat}>
                        {lead && (
                            <button className="mc-lead mc-rv" onClick={() => setStory(lead.id)}>
                                <span className="mc-lead-img"><Pic name={lead.image} alt={lead.title} eager /><span className="mc-tag">Latest</span></span>
                                <span className="mc-lead-body">
                                    <span className="mc-meta"><span className="mc-chip mc-chip--line">{lead.category}</span><time>{fmt(lead.date)}</time><span>{lead.readTime} min read</span></span>
                                    <strong>{lead.title}</strong>
                                    <span className="mc-lead-sum">{lead.summary}</span>
                                    <span className="mc-more-link">Read story<Arrow /></span>
                                </span>
                            </button>
                        )}
                        <div className="mc-ncards">
                            {rest.slice(0, shown).map((n, i) => (
                                <button className="mc-ncard mc-rv" style={D(i % 3)} key={n.id} onClick={() => setStory(n.id)}>
                                    <span className="mc-ncard-img"><Pic name={n.image} alt={n.title} /><span className="mc-tag">{n.category}</span></span>
                                    <span className="mc-ncard-body">
                                        <span className="mc-meta"><time>{fmt(n.date)}</time><span>{n.readTime} min</span></span>
                                        <strong>{n.title}</strong>
                                        <span className="mc-ncard-sum">{n.summary}</span>
                                        <span className="mc-more-link">Read<Arrow /></span>
                                    </span>
                                </button>
                            ))}
                        </div>
                        {rest.length === 0 && <p className="mc-empty">No stories in this category yet.</p>}
                        {rest.length > shown && (
                            <div className="mc-center"><button className="mc-btn mc-btn--dark" onClick={() => setShown(shown + 6)}>Load more stories<Arrow /></button></div>
                        )}
                    </div>
                </div>
            </section>

            {/* ===================== 02 PRESS ===================== */}
            <section className="mc-sec mc-sec--dark" id="press">
                <div className="mc-wrap">
                    <Head n={1} label="Press releases" title={press.heading} lede={press.lede} />

                    <div className="mc-press">
                        <div className="mc-press-main">
                            <div className="mc-press-tools">
                                <Filters items={press.types} value={ptype} onChange={setPtype} label="Release types" />
                                <label className="mc-search mc-rv">
                                    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><circle cx="11" cy="11" r="6" fill="none" stroke="currentColor" strokeWidth="2" /><path d="M16 16l5 5" stroke="currentColor" strokeWidth="2" /></svg>
                                    <input type="search" value={pq} onChange={(e) => setPq(e.target.value)} placeholder="Search releases" aria-label="Search press releases" />
                                </label>
                            </div>
                            <p className="mc-count-line">{pressList.length} {pressList.length === 1 ? 'release' : 'releases'}</p>
                            <ul className="mc-prows" key={`${ptype}${pq}`}>
                                {pressList.map((p, i) => {
                                    const on = popen === p.id;
                                    return (
                                        <li key={p.id} className="mc-rv" style={D(i)}>
                                            <div className={`mc-prow ${on ? 'is-on' : ''}`}>
                                                <button className="mc-prow-h" onClick={() => setPopen(on ? null : p.id)} aria-expanded={on}>
                                                    <span className="mc-pdate"><b>{fmt(p.date, { day: '2-digit' })}</b><span>{fmt(p.date, { month: 'short', year: 'numeric' })}</span></span>
                                                    <span className="mc-ptitle">{p.title}</span>
                                                    <span className="mc-chip mc-chip--line mc-ptype">{p.type}</span>
                                                </button>
                                                <div className="mc-pbody"><div>
                                                    <p className="mc-psum">{p.summary}</p>
                                                    <div className="mc-pbtns">
                                                        {p.file
                                                            ? <a className="mc-btn mc-btn--sm" href={p.file} download>Download PDF<Arrow /></a>
                                                            : <span className="mc-soon">PDF coming soon</span>}
                                                    </div>
                                                </div></div>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                            {pressList.length === 0 && <p className="mc-empty">No releases match your search.</p>}
                        </div>

                        <aside className="mc-kit mc-spot mc-rv" style={D(2)}>
                            <p className="mc-sub">Press</p>
                            <h3>{press.kit.title}</h3>
                            <p>{press.kit.text}</p>
                            <ul className="mc-ticks">{press.kit.items.map((k) => <li key={k}>{k}</li>)}</ul>
                            <a className="mc-btn" href={links.mediaKit}>{press.kit.button}<Arrow /></a>
                            <div className="mc-kit-contact">
                                <span>{press.contact.label}</span>
                                <strong>{press.contact.name}</strong>
                                <a href={`mailto:${press.contact.email}`}>{press.contact.email}</a>
                            </div>
                        </aside>
                    </div>
                </div>
            </section>

            {/* ===================== 03 EVENTS ===================== */}
            <section className="mc-sec mc-sec--yellow" id="events">
                <div className="mc-wrap">
                    <Head n={2} label="Events & activities" title={events.heading} lede={events.lede} />

                    {nextEv && (
                        <article className="mc-next mc-rv">
                            <div className="mc-next-img"><Pic name={nextEv.image} alt={nextEv.title} /><span className="mc-tag">Next event</span></div>
                            <div className="mc-next-body">
                                <p className="mc-meta"><span className="mc-chip mc-chip--dark">{nextEv.type}</span><time>{fmt(nextEv.date, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</time></p>
                                <h3>{nextEv.title}</h3>
                                <p>{nextEv.summary}</p>
                                <p className="mc-where"><span>{nextEv.time}</span><span>{nextEv.location}</span></p>
                                <Countdown date={nextEv.date} />
                                <div className="mc-next-btns">
                                    {nextEv.link && <a className="mc-btn mc-btn--dark" href={nextEv.link}>Register interest<Arrow /></a>}
                                    <a className="mc-btn mc-btn--ghost" href={icsHref(nextEv)} download={`${nextEv.id}.ics`}>Add to calendar</a>
                                </div>
                            </div>
                        </article>
                    )}

                    <div className="mc-tabs mc-rv" role="tablist" aria-label="Event timeline">
                        {[['Upcoming', upcoming.length], ['Past', past.length]].map(([t, c]) => (
                            <button key={t} role="tab" aria-selected={etab === t} className={etab === t ? 'is-on' : ''} onClick={() => setEtab(t)}>{t}<sup>{c}</sup></button>
                        ))}
                    </div>

                    <div className="mc-events" key={etab}>
                        {evList.map((e, i) => (
                            <article className="mc-event mc-rv" style={D(i % 3)} key={e.id}>
                                <div className="mc-event-img"><Pic name={e.image} alt={e.title} />
                                    <span className="mc-date"><b>{fmt(e.date, { day: '2-digit' })}</b><span>{fmt(e.date, { month: 'short' })}</span></span>
                                </div>
                                <div className="mc-event-body">
                                    <p className="mc-meta"><span className="mc-chip mc-chip--dark">{e.type}</span><span>{fmt(e.date, { year: 'numeric' })}</span></p>
                                    <h3>{e.title}</h3>
                                    <p>{e.summary}</p>
                                    <p className="mc-where"><span>{e.time}</span><span>{e.location}</span></p>
                                    {etab === 'Upcoming' && e.link && <a className="mc-more-link" href={e.link}>Details<Arrow /></a>}
                                    {etab === 'Past' && <a className="mc-more-link" href="#gallery" onClick={(ev) => { ev.preventDefault(); goTo('gallery'); }}>See photos<Arrow /></a>}
                                </div>
                            </article>
                        ))}
                        {evList.length === 0 && <p className="mc-empty">Nothing here yet.</p>}
                    </div>
                </div>
            </section>

            {/* ===================== 04 GALLERY ===================== */}
            <section className="mc-sec mc-sec--dark" id="gallery">
                <div className="mc-wrap">
                    <Head n={3} label="Photo & video gallery" title={gallery.heading} lede={gallery.lede} />

                    {films.length > 0 && (
                        <div className="mc-cinema mc-rv">
                            <div className="mc-cinema-screen">
                                <Player item={films[film]} key={films[film].id} />
                                <div className="mc-cinema-info" key={`i${films[film].id}`}>
                                    <span className="mc-chip">Now showing</span>
                                    <h3>{films[film].title}</h3>
                                    <p>{films[film].caption}</p>
                                </div>
                            </div>
                            <ol className="mc-playlist" aria-label="Films">
                                {films.map((f, i) => (
                                    <li key={f.id}>
                                        <button className={i === film ? 'is-on' : ''} onClick={() => setFilm(i)}>
                                            <span className="mc-pl-img"><Pic name={f.image} alt="" /><i>{i === film ? '▶' : pad(i)}</i></span>
                                            <span className="mc-pl-txt"><strong>{f.title}</strong><span>{f.duration || 'Film'}</span></span>
                                        </button>
                                    </li>
                                ))}
                            </ol>
                        </div>
                    )}

                    <Filters items={gFilters} value={gf} onChange={setGf} counts={gCounts} label="Gallery filters" />

                    <div className="mc-mosaic" key={gf}>
                        {gList.map((g, i) => (
                            <button
                                key={g.id}
                                className={`mc-tile mc-tile--${g.size || 'normal'} mc-rv`}
                                style={D(i % 6)}
                                onClick={() => setLb(i)}
                                aria-label={`Open ${g.title}`}
                            >
                                <Pic name={g.image} alt={g.title} />
                                <span className="mc-tile-shade" />
                                <span className="mc-tile-top">
                                    <span className="mc-chip mc-chip--sm">{g.type === 'video' ? 'Video' : g.album}</span>
                                    {g.type === 'video' && <span className="mc-tile-play"><PlayIcon /></span>}
                                </span>
                                <span className="mc-tile-cap"><strong>{g.title}</strong><span>{g.caption}</span></span>
                                <span className="mc-tile-n">{pad(i)}</span>
                            </button>
                        ))}
                    </div>
                    {gList.length === 0 && <p className="mc-empty">Nothing in this album yet.</p>}
                </div>
            </section>

            {/* ===================== 05 ARTICLES & SOCIAL ===================== */}
            <section className="mc-sec mc-sec--light" id="articles">
                <div className="mc-wrap">
                    <Head n={4} label="Articles & social media" title={articles.heading} lede={articles.lede} />
                </div>

                <div className="mc-railwrap mc-rv">
                    <div
                        className="mc-rail"
                        ref={railRef}
                        onScroll={measureRail}
                        onPointerDown={onRailDown}
                        onPointerMove={onRailMove}
                        onPointerUp={onRailUp}
                        onPointerLeave={onRailUp}
                        onClickCapture={onRailClick}
                        tabIndex={0}
                        aria-label="Articles"
                    >
                        {articles.items.map((a, i) => (
                            <a className="mc-art-card" href={a.link} key={a.id} draggable={false}>
                                <span className="mc-art-img"><Pic name={a.image} alt={a.title} /><span className="mc-tag">{a.tag}</span><span className="mc-art-n">{pad(i)}</span></span>
                                <span className="mc-art-body">
                                    <span className="mc-meta"><time>{fmt(a.date)}</time><span>{a.readTime} min read</span></span>
                                    <strong>{a.title}</strong>
                                    <span className="mc-art-sum">{a.summary}</span>
                                    <span className="mc-art-by">By {a.author}<Arrow /></span>
                                </span>
                            </a>
                        ))}
                    </div>
                    <div className="mc-wrap mc-rail-ctl">
                        <div className="mc-rail-bar" aria-hidden="true"><span style={{ transform: `scaleX(${0.18 + rail.p * 0.82})` }} /></div>
                        <div className="mc-rail-btns">
                            <button onClick={() => slide(-1)} disabled={!rail.canL} aria-label="Previous articles"><Chevron dir="left" /></button>
                            <button onClick={() => slide(1)} disabled={!rail.canR} aria-label="Next articles"><Chevron /></button>
                        </div>
                    </div>
                </div>

                <div className="mc-wrap">
                    <div className="mc-social-head">
                        <div>
                            <h3 className="mc-sub mc-rv">{articles.social.title}</h3>
                            <p className="mc-social-lede mc-rv">{articles.social.lede}</p>
                        </div>
                        <ul className="mc-follow mc-rv">
                            {articles.social.platforms.map((p) => (
                                <li key={p.name}><a href={p.url} target="_blank" rel="noreferrer"><b>{p.name}</b><span>{p.handle}</span></a></li>
                            ))}
                        </ul>
                    </div>
                    <Filters items={platforms} value={plat} onChange={setPlat} label="Social platforms" />
                    <div className="mc-wall" key={plat}>
                        {posts.map((p, i) => (
                            <a className="mc-post mc-spot mc-rv" style={D(i % 3)} href={p.url} target="_blank" rel="noreferrer" key={p.id}>
                                <span className="mc-post-top"><b>{p.platform}</b><time>{fmt(p.date)}</time></span>
                                {p.image && <span className="mc-post-img"><Pic name={p.image} alt="" /></span>}
                                <span className="mc-post-text">{p.text}</span>
                                <span className="mc-more-link">View post<Arrow /></span>
                            </a>
                        ))}
                    </div>
                    {posts.length === 0 && <p className="mc-empty">No posts from this platform yet.</p>}
                </div>
            </section>

            {/* ===================== SUBSCRIBE ===================== */}
            <section className="mc-sec mc-sec--dark mc-cta" id="subscribe">
                <div className="mc-wrap mc-cta-in">
                    <div>
                        <h2 className="mc-h mc-rv">{subscribe.heading}</h2>
                        <p className="mc-lede mc-rv" style={D(1)}>{subscribe.text}</p>
                    </div>
                    <form className="mc-form mc-rv" style={D(2)} onSubmit={submit} noValidate>
                        {sub === 'done' ? (
                            <p className="mc-form-ok" role="status"><svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M4 12l6 6L20 6" fill="none" stroke="currentColor" strokeWidth="3" /></svg>{subscribe.success}</p>
                        ) : (
                            <>
                                <div className="mc-form-row">
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => { setEmail(e.target.value); if (sub !== 'idle') setSub('idle'); }}
                                        placeholder={subscribe.placeholder}
                                        aria-label="Email address"
                                        aria-invalid={sub === 'error'}
                                    />
                                    <button className="mc-btn" type="submit" disabled={sub === 'loading'}>{sub === 'loading' ? 'Sending…' : subscribe.button}<Arrow /></button>
                                </div>
                                <p className={`mc-form-note ${sub === 'error' || sub === 'fail' ? 'is-bad' : ''}`} role="status">
                                    {sub === 'error' ? subscribe.error : sub === 'fail' ? 'Something went wrong. Please try again.' : subscribe.note}
                                </p>
                            </>
                        )}
                        <div className="mc-cta-links">
                            <a href={links.opportunities}>See opportunities</a>
                            <a href={links.innovation}>Innovation</a>
                            <a href={links.contact}>Contact us</a>
                        </div>
                    </form>
                </div>
            </section>

            {/* ===================== OVERLAYS ===================== */}
            {story && storyIndex > -1 && (
                <Story list={newsList} index={storyIndex} onIndex={(i) => setStory(newsList[i].id)} onClose={() => setStory(null)} />
            )}
            {lb !== null && gList[lb] && (
                <Lightbox list={gList} index={lb} onIndex={setLb} onClose={() => setLb(null)} />
            )}
        </div>
    );
}

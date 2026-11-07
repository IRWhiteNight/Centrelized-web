import { useCallback, useEffect, useRef, useState } from 'react';
import '../../../css/PSB-css/psb-siteinfo.css';
import videobg from '../../videos/bg-video2.mp4';
import { page, hero, sections, location as loc, facilities, airspace, weather, guidelines } from '../../data/PSB-data/siteInfoData';

/* ==========================================================
   HELPERS
   W      splits a headline into words that rise out of a mask when the block scrolls into view
   Rv     scroll reveal (fade only, so text is never moved or softened)
   Pic    photo wiped open with a clip, never scaled or blurred; optional click to open the lightbox
   Count  number that counts up when it scrolls into view
========================================================== */

const reduced = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

const words = (str, o, d, s) => str.split(' ').map((w, i) => (
    <span key={i}><span className="si-w"><span className="si-wi" style={{ '--wd': d + (o + i) * s }}>{w}</span></span>{' '}</span>
));

function W({ t, em, d = 0, s = 40 }) {
    const n = t ? t.split(' ').length : 0;
    return <>{t && words(t, 0, d, s)}{em && <em>{words(em, n, d, s)}</em>}</>;
}

function Rv({ as: T = 'div', className = '', d = 0, text = false, style, children, ...rest }) {
    return (
        <T data-rv className={`si-rv${text ? ' si-t' : ''} ${className}`} style={{ '--d': d, ...style }} {...rest}>
            {children}
        </T>
    );
}

function Photo({ src, alt, label }) {
    const [bad, setBad] = useState(!src);
    return bad
        ? <div className="si-ph"><span>{label || alt}</span></div>
        : <img src={src} alt={alt} loading="lazy" decoding="async" onError={() => setBad(true)} />;
}

function Pic({ src, alt, label, caption, className = '', ratio, d = 0, onOpen }) {
    const open = onOpen && src ? () => onOpen({ src, alt, caption }) : undefined;
    const key = open ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } } : undefined;
    return (
        <figure
            data-rv
            className={`si-rv si-pic ${className}`}
            style={{ '--d': d, aspectRatio: ratio }}
            {...(open ? { role: 'button', tabIndex: 0, 'aria-label': `Enlarge: ${alt}`, onClick: open, onKeyDown: key } : {})}
        >
            <Photo src={src} alt={alt} label={label} />
            {caption && <figcaption>{caption}</figcaption>}
            {open && <span className="si-zoom" aria-hidden="true">+</span>}
        </figure>
    );
}

function Count({ to, dec = 0 }) {
    const ref = useRef(null);
    useEffect(() => {
        const el = ref.current;
        if (!el) return undefined;
        if (reduced()) { el.textContent = to.toFixed(dec); return undefined; }
        const io = new IntersectionObserver(([e]) => {
            if (!e.isIntersecting) return;
            io.disconnect();
            const t0 = performance.now();
            const run = (t) => {
                const p = Math.min(1, (t - t0) / 1500);
                el.textContent = (to * (1 - (1 - p) ** 4)).toFixed(dec);
                if (p < 1) requestAnimationFrame(run);
            };
            requestAnimationFrame(run);
        }, { threshold: 0.6 });
        io.observe(el);
        return () => io.disconnect();
    }, [to, dec]);
    return <span ref={ref}>{(0).toFixed(dec)}</span>;
}

const Tbc = ({ v }) => (v === 'TBC' ? <span className="si-tbc">TBC</span> : v);

/* adds .is-in to every [data-rv] once it enters the viewport */
function useReveal() {
    useEffect(() => {
        const els = document.querySelectorAll('.si [data-rv]');
        if (reduced()) { els.forEach((e) => e.classList.add('is-in')); return undefined; }
        const io = new IntersectionObserver((list) => list.forEach((e) => {
            if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
        }), { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
        els.forEach((e) => io.observe(e));
        return () => io.disconnect();
    }, []);
}

/* Sticky stack.
   Each section is position: sticky. Its `top` is min(0, viewport height - section height), so a tall section
   scrolls until its bottom edge reaches the bottom of the screen, then stays put while the next section
   slides over it. A dark veil (opacity only) deepens on the covered section.
   Also drives: top progress bar, active tab, per-section progress (--sp) and the hero parallax. */
function useStack(setActive) {
    useEffect(() => {
        const root = document.querySelector('.si');
        const bar = root.querySelector('.si-progress i');
        const heroBg = root.querySelector('.si-hero-bg');
        const secs = [...root.querySelectorAll('.si-stack > .si-sec')];
        let raf = 0;
        let last = '';

        const fit = () => {
            const vh = window.innerHeight;
            secs.forEach((el) => { el.style.top = `${Math.min(0, Math.round(vh - el.offsetHeight))}px`; });
        };
        const run = () => {
            raf = 0;
            const vh = window.innerHeight;
            const sy = window.scrollY;
            const max = document.documentElement.scrollHeight - vh;
            if (bar) bar.style.transform = `scaleX(${max > 0 ? clamp(sy / max, 0, 1) : 0})`;
            if (heroBg && !reduced()) heroBg.style.transform = `translate3d(0, ${sy < vh ? Math.round(sy * 0.28) : 0}px, 0)`;

            let cur = '';
            sections.forEach((s) => {
                const el = document.getElementById(s.id);
                if (el && el.getBoundingClientRect().top <= vh * 0.4) cur = s.id;
            });
            if (cur !== last) { last = cur; setActive(cur); }

            secs.forEach((el) => {
                const r = el.getBoundingClientRect();
                const range = el.offsetHeight - vh;
                const p = range > 0 ? clamp(-r.top / range, 0, 1) : clamp(1 - r.top / vh, 0, 1);
                el.style.setProperty('--sp', p.toFixed(3));

                const nx = el.nextElementSibling;
                if (!nx) return;
                const stuck = r.bottom <= vh + 2;
                const t = nx.getBoundingClientRect().top;
                el.style.setProperty('--cv', stuck ? (clamp(1 - t / vh, 0, 1) * 0.6).toFixed(3) : '0');
            });
        };
        const onScroll = () => { if (!raf) raf = requestAnimationFrame(run); };
        const ro = new ResizeObserver(() => { fit(); onScroll(); });
        secs.forEach((s) => ro.observe(s));
        fit();
        run();
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll);
        return () => {
            cancelAnimationFrame(raf);
            ro.disconnect();
            window.removeEventListener('scroll', onScroll);
            window.removeEventListener('resize', onScroll);
        };
    }, [setActive]);
}

/* Pointer effects (mouse only): card spotlight, hero light, magnetic buttons. One delegated listener. */
function usePointer() {
    useEffect(() => {
        const root = document.querySelector('.si');
        if (!root || reduced()) return undefined;
        let mag = null;
        const clear = () => { if (mag) { mag.style.translate = ''; mag = null; } };
        const move = (e) => {
            if (e.pointerType === 'touch') return;
            const t = e.target;
            if (!t || !t.closest) return;
            const spot = t.closest('.si-card, .si-picker button, .si-file');
            if (spot) {
                const r = spot.getBoundingClientRect();
                spot.style.setProperty('--mx', `${Math.round(e.clientX - r.left)}px`);
                spot.style.setProperty('--my', `${Math.round(e.clientY - r.top)}px`);
            }
            const h = t.closest('.si-hero');
            if (h) {
                const r = h.getBoundingClientRect();
                h.style.setProperty('--hx', `${Math.round(e.clientX - r.left)}px`);
                h.style.setProperty('--hy', `${Math.round(e.clientY - r.top)}px`);
            }
            const m = t.closest('.si-btn, .si-cta');
            if (m !== mag) clear();
            if (m) {
                mag = m;
                const r = m.getBoundingClientRect();
                const x = Math.round((e.clientX - (r.left + r.width / 2)) * 0.22);
                const y = Math.round((e.clientY - (r.top + r.height / 2)) * 0.32);
                m.style.translate = `${x}px ${y}px`;
            }
        };
        root.addEventListener('pointermove', move);
        root.addEventListener('pointerleave', clear);
        return () => { root.removeEventListener('pointermove', move); root.removeEventListener('pointerleave', clear); clear(); };
    }, []);
}

/* Where a section starts in normal flow (a stuck section reports a shifted position, so add it up by hand) */
const flowTop = (id) => {
    const stack = document.querySelector('.si-stack');
    const kids = [...stack.children];
    const idx = kids.findIndex((k) => k.id === id);
    let y = stack.getBoundingClientRect().top + window.scrollY;
    for (let j = 0; j <= idx; j += 1) {
        y += parseFloat(getComputedStyle(kids[j]).marginTop) || 0;
        if (j < idx) y += kids[j].offsetHeight;
    }
    return Math.round(y);
};
const jump = (e, id) => {
    e.preventDefault();
    window.scrollTo({ top: flowTop(id), behavior: reduced() ? 'auto' : 'smooth' });
};

/* ==========================================================
   SMALL COMPONENTS
========================================================== */

function Sec({ s, i, theme, children }) {
    const next = sections[i + 1];
    return (
        <section id={s.id} className={`si-sec si-sec--${theme}`}>
            <div className="si-wrap si-split">
                <aside className="si-side">
                    <span className="si-ghost" aria-hidden="true">{s.n}</span>
                    <Rv className="si-n"><b>{s.n}</b><span>{s.label}</span></Rv>
                    <Rv as="h2" className="si-h" text><W t={s.title} em={s.em} /></Rv>
                    <Rv as="p" className="si-intro" d={150}>{s.intro}</Rv>
                    <ul className="si-dots" aria-hidden="true">
                        {sections.map((x, k) => <li key={x.id} className={k < i ? 'is-past' : k === i ? 'is-on' : ''} />)}
                    </ul>
                    <div className="si-sp" aria-hidden="true"><i /></div>
                    {next && <a className="si-next" href={`#${next.id}`} onClick={(e) => jump(e, next.id)}>Next: {next.label}<i aria-hidden="true">↓</i></a>}
                </aside>
                <div className="si-body">{children}</div>
            </div>
        </section>
    );
}

function Sub({ children }) {
    return <Rv as="h3" className="si-sub">{children}</Rv>;
}

function Acc({ title, list, d }) {
    const [open, setOpen] = useState(false);
    return (
        <Rv className={`si-acc${open ? ' is-open' : ''}`} d={d}>
            <button type="button" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
                <span>{title}</span><i aria-hidden="true" />
            </button>
            <div className="si-acc-body"><ul>{list.map((x) => <li key={x}>{x}</li>)}</ul></div>
        </Rv>
    );
}

/* Hero flight path: a dashed route with waypoints and a drone that follows it */
function FlightPath() {
    const d = 'M20 380 C 160 360, 190 210, 330 220 S 520 90, 600 120 S 740 60, 860 30';
    return (
        <svg className="si-path" viewBox="0 0 880 420" aria-hidden="true">
            <path className="trail" d={d} />
            {[[20, 380], [330, 220], [600, 120], [860, 30]].map(([x, y], i) => (
                <g key={i}>
                    <circle className="ring" cx={x} cy={y} r="16" />
                    <circle className="node" cx={x} cy={y} r="5" />
                </g>
            ))}
            {!reduced() && (
                <circle className="drone" r="7">
                    <animateMotion dur="9s" repeatCount="indefinite" path={d} />
                </circle>
            )}
        </svg>
    );
}

/* Facilities slideshow: big stage that advances by itself (pauses on hover or with the pause button) */
function Facilities() {
    const items = facilities.items;
    const n = items.length;
    const [k, setK] = useState(0);
    const [play, setPlay] = useState(true);
    const [hover, setHover] = useState(false);
    const go = useCallback((v) => setK(((v % n) + n) % n), [n]);
    const pad = (v) => String(v).padStart(2, '0');

    return (
        <>
            <Rv
                className="si-stage"
                onMouseEnter={() => setHover(true)}
                onMouseLeave={() => setHover(false)}
            >
                {items.map((f, i) => (
                    <figure key={f.name} className={i === k ? 'is-on' : ''}>
                        <Photo src={f.src} alt={f.name} label={`${f.name} image`} />
                        <figcaption>
                            <small>{f.tag}</small>
                            <h3>{f.name}</h3>
                            <p>{f.text}</p>
                        </figcaption>
                    </figure>
                ))}
                <div className="si-fctl">
                    <span>{pad(k + 1)} / {pad(n)}</span>
                    <button type="button" aria-label="Previous" onClick={() => go(k - 1)}>←</button>
                    <button type="button" aria-label={play ? 'Pause slideshow' : 'Play slideshow'} onClick={() => setPlay((p) => !p)}>{play ? '❚❚' : '▶'}</button>
                    <button type="button" aria-label="Next" onClick={() => go(k + 1)}>→</button>
                </div>
                <div className={`si-fprog${!play || hover ? ' is-paused' : ''}`} aria-hidden="true">
                    <i key={`${k}-${play}`} onAnimationEnd={() => { if (play) go(k + 1); }} />
                </div>
            </Rv>
            <Rv as="ul" className="si-picker" d={100}>
                {items.map((f, i) => (
                    <li key={f.name}>
                        <button type="button" data-i={pad(i + 1)} className={i === k ? 'is-on' : ''} onMouseEnter={() => setK(i)} onFocus={() => setK(i)} onClick={() => setK(i)}>
                            <b>{f.name}</b>
                            <small>{f.tag}</small>
                        </button>
                    </li>
                ))}
            </Rv>
        </>
    );
}

/* Operating areas drawn as layered airspace plates. Pick a plate or a row to read about it. */
function Layers({ areas }) {
    const [k, setK] = useState(0);
    const n = areas.length;
    const cy = (j) => 96 + (n - 1 - j) * 104;
    const h = cy(0) + 96;
    return (
        <Rv className="si-lay">
            <svg viewBox={`0 0 420 ${h}`} role="img" aria-label="Operating areas drawn as layered airspace plates">
                <defs>
                    <linearGradient id="si-plate-grad" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0" stopColor="#ffd21f" />
                        <stop offset="1" stopColor="#ff8a3d" />
                    </linearGradient>
                </defs>
                {areas.map((a, j) => {
                    const y = cy(j);
                    return (
                        <g key={a.name} className={`si-plate${j === k ? ' on' : ''}`} onMouseEnter={() => setK(j)} onClick={() => setK(j)}>
                            <path className="side" d={`M20 ${y} L210 ${y + 62} L400 ${y} L400 ${y + 14} L210 ${y + 76} L20 ${y + 14} Z`} />
                            <path className="top" d={`M210 ${y - 62} L400 ${y} L210 ${y + 62} L20 ${y} Z`} />
                            <text x="210" y={y + 9} textAnchor="middle">{String.fromCharCode(65 + j)}</text>
                        </g>
                    );
                })}
            </svg>
            <ul className="si-lay-list">
                {areas.map((a, j) => (
                    <li key={a.name}>
                        <button type="button" className={j === k ? 'is-on' : ''} onMouseEnter={() => setK(j)} onFocus={() => setK(j)} onClick={() => setK(j)}>
                            <span>{String.fromCharCode(65 + j)}</span>
                            <b>{a.name}</b>
                            <small>{a.text}</small>
                        </button>
                    </li>
                ))}
            </ul>
        </Rv>
    );
}

/* WMO weather code -> short text and a mood for the card gradient */
const wx = (c) => (c === 0 ? 'Clear sky' : c <= 3 ? 'Partly cloudy' : c <= 48 ? 'Fog' : c <= 57 ? 'Drizzle' : c <= 67 ? 'Rain' : c <= 82 ? 'Rain showers' : 'Thunderstorm');
const mood = (c) => (c <= 1 ? 'clear' : c <= 48 ? 'cloud' : c <= 82 ? 'rain' : 'storm');
const compass = (deg) => ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.round(deg / 45) % 8];

function WxIcon({ m }) {
    return (
        <svg className="si-wxicon" viewBox="0 0 64 64" aria-hidden="true">
            {m === 'clear' && (
                <g>
                    <circle className="sun-core" cx="32" cy="32" r="10" />
                    <g className="spin">{[0, 45, 90, 135, 180, 225, 270, 315].map((a) => <path key={a} d="M32 8 V16" transform={`rotate(${a} 32 32)`} />)}</g>
                </g>
            )}
            {m !== 'clear' && <path d="M18 44 H44 a10 10 0 0 0 1-20 a14 14 0 0 0-27 4 a8 8 0 0 0 0 16 Z" />}
            {(m === 'rain' || m === 'storm') && (
                <g>
                    <path className="drop" d="M22 50 V54" />
                    <path className="drop" d="M32 50 V54" />
                    <path className="drop" d="M42 50 V54" />
                </g>
            )}
        </svg>
    );
}

function Weather() {
    const [data, setData] = useState(null);
    const [failed, setFailed] = useState(false);
    useEffect(() => {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${weather.lat}&longitude=${weather.lon}`
            + '&current=temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,weather_code,wind_speed_10m,wind_direction_10m'
            + '&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=Asia%2FKuala_Lumpur&forecast_days=5';
        let live = true;
        fetch(url).then((r) => r.json()).then((j) => { if (live) setData(j); }).catch(() => { if (live) setFailed(true); });
        return () => { live = false; };
    }, []);

    const c = data?.current;
    const dly = data?.daily;
    const m = c ? mood(c.weather_code) : undefined;
    const gmin = dly ? Math.min(...dly.temperature_2m_min) : 0;
    const gmax = dly ? Math.max(...dly.temperature_2m_max) : 1;
    const span = Math.max(1, gmax - gmin);

    return (
        <Rv className="si-card si-wxcard" data-wx={m}>
            <div className="si-wxtop">
                <p className="si-label" style={{ color: '#ffd21f' }}>{weather.label}</p>
                {m && <WxIcon m={m} />}
            </div>
            {failed && <p className="si-muted">The live summary is unavailable right now. Please use the official sources.</p>}
            {!data && !failed && <p className="si-muted">Loading weather…</p>}
            {c && (
                <>
                    <div className="si-wxnow">
                        <strong>{Math.round(c.temperature_2m)}°<small>C</small></strong>
                        <span>{wx(c.weather_code)}</span>
                    </div>
                    <dl className="si-wxdl">
                        <div><dt>Feels like</dt><dd>{Math.round(c.apparent_temperature)}°C</dd></div>
                        <div><dt>Humidity</dt><dd>{c.relative_humidity_2m}%</dd></div>
                        <div><dt>Wind</dt><dd>{Math.round(c.wind_speed_10m)} km/h {compass(c.wind_direction_10m)}</dd></div>
                        <div><dt>Rain now</dt><dd>{c.precipitation} mm</dd></div>
                    </dl>
                    <div className="si-wxdays">
                        {dly.time.map((t, i) => {
                            const lo = dly.temperature_2m_min[i];
                            const hi = dly.temperature_2m_max[i];
                            return (
                                <div key={t}>
                                    <small>{new Date(`${t}T12:00:00`).toLocaleDateString('en-MY', { weekday: 'short' })}</small>
                                    <b>{Math.round(hi)}° <em>{Math.round(lo)}°</em></b>
                                    <span className="si-wxbar"><i style={{ left: `${((lo - gmin) / span) * 100}%`, right: `${100 - ((hi - gmin) / span) * 100}%` }} /></span>
                                    <span>{dly.precipitation_probability_max[i]}% rain</span>
                                </div>
                            );
                        })}
                    </div>
                </>
            )}
            <p className="si-note">{weather.note}</p>
        </Rv>
    );
}

/* Full-screen photo viewer. Esc, click outside or the close button to leave. */
function Lightbox({ item, onClose }) {
    useEffect(() => {
        const key = (e) => { if (e.key === 'Escape') onClose(); };
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        window.addEventListener('keydown', key);
        return () => { window.removeEventListener('keydown', key); document.body.style.overflow = prev; };
    }, [onClose]);
    return (
        <div className="si-lb" role="dialog" aria-modal="true" aria-label={item.alt} onClick={onClose}>
            <button type="button" aria-label="Close" onClick={onClose}>×</button>
            <img src={item.src} alt={item.alt} onClick={(e) => e.stopPropagation()} onError={onClose} />
            {item.caption && <p>{item.caption}</p>}
        </div>
    );
}

/* ==========================================================
   PAGE
========================================================== */

export default function SiteInfo() {
    const [active, setActive] = useState('');
    const [lb, setLb] = useState(null);
    const tabsRef = useRef(null);
    useReveal();
    useStack(setActive);
    usePointer();

    /* slide the highlight pill under the active tab */
    useEffect(() => {
        const box = tabsRef.current;
        if (!box) return;
        const ind = box.querySelector('.si-ind');
        const a = box.querySelector('a.is-active');
        if (!a) { ind.classList.remove('is-on'); return; }
        ind.style.setProperty('--ix', `${a.offsetLeft}px`);
        ind.style.setProperty('--iw', `${a.offsetWidth}px`);
        ind.classList.add('is-on');
        const left = a.offsetLeft - (box.clientWidth - a.offsetWidth) / 2;
        box.scrollTo({ left: Math.max(0, left), behavior: reduced() ? 'auto' : 'smooth' });
    }, [active]);

    const closeLb = useCallback(() => setLb(null), []);
    const mapSrc = `https://www.google.com/maps?q=${encodeURIComponent(loc.mapQuery)}&output=embed`;
    const marquee = Array.from({ length: 8 }, (_, i) => <span key={i}>Perlis Airspace Sandbox</span>);

    return (
        <div className="si">
            {/* ---------- hero ---------- */}
            <section className="si-hero">
                <div className="si-hero-bg" aria-hidden="true">
                    <video autoPlay muted loop playsInline preload="auto"><source src={videobg} type="video/mp4" /></video>
                </div>
                <div className="si-hero-shade" aria-hidden="true" />
                <div className="si-hero-tint" aria-hidden="true" />
                <div className="si-hero-grid" aria-hidden="true" />
                <div className="si-hero-spot" aria-hidden="true" />
                <FlightPath />
                <div className="si-wrap si-hero-in">
                    <Rv className="si-pill" d={100}><i aria-hidden="true" />{hero.eyebrow}</Rv>
                    <Rv as="h1" className="si-title" text><W t={hero.title} em={hero.titleEm} d={200} s={60} /></Rv>
                    <Rv as="p" className="si-lede" d={900}>{hero.text}</Rv>
                    <div className="si-hstats">
                        {hero.stats.map((s, i) => (
                            <Rv key={s.label} d={1100 + i * 120}>
                                <strong><Count to={s.to} dec={s.dec || 0} />{s.unit}</strong>
                                <span>{s.label}</span>
                            </Rv>
                        ))}
                    </div>
                </div>
                <a className="si-scroll" href={`#${sections[0].id}`} onClick={(e) => jump(e, sections[0].id)} aria-label="Scroll to content"><i /></a>
            </section>

            {/* ---------- sticky section bar ---------- */}
            <div className="si-strip">
                <a className="si-brand" href={page.homeHref}><i aria-hidden="true" />{page.brand}</a>
                <nav className="si-tabs" aria-label="Site information sections" ref={tabsRef}>
                    <span className="si-ind" aria-hidden="true" />
                    {sections.map((s) => (
                        <a key={s.id} href={`#${s.id}`} className={active === s.id ? 'is-active' : ''} onClick={(e) => jump(e, s.id)}>{s.label}</a>
                    ))}
                </nav>
                <a className="si-cta" href={page.applyHref}>{page.applyLabel}</a>
                <div className="si-progress" aria-hidden="true"><i /></div>
            </div>

            <main className="si-stack">
                {/* ---------- 01 LOCATION & ACCESS ---------- */}
                <Sec s={sections[0]} i={0} theme="light">
                    <Rv className="si-map">
                        <iframe title="Map of the Perlis Airspace Sandbox site" src={mapSrc} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
                    </Rv>
                    <div className="si-cols">
                        <Rv className="si-card" d={80}>
                            <h3 className="si-card-t">Address</h3>
                            {loc.address.map((l) => <p key={l} className="si-addr">{l}</p>)}
                            <dl className="si-dl">
                                <div><dt>Coordinates</dt><dd><Tbc v={loc.coordinates} /></dd></div>
                                <div><dt>Postcode</dt><dd><Tbc v={loc.postcode} /></dd></div>
                            </dl>
                            <a className="si-link" href={loc.mapLink} target="_blank" rel="noopener noreferrer">Open in Google Maps ↗</a>
                        </Rv>
                        <Rv className="si-card" d={180}>
                            <h3 className="si-card-t">Around the site</h3>
                            <div className="si-tags">{loc.nearby.map((n) => <span key={n}>{n}</span>)}</div>
                        </Rv>
                    </div>

                    <div className="si-facts">
                        {loc.facts.map((f, i) => (
                            <Rv className="si-fact" d={i * 90} key={f.label}>
                                <strong><Count to={f.to} dec={f.dec} />{f.unit}</strong>
                                <span>{f.label}</span>
                            </Rv>
                        ))}
                    </div>

                    <Sub>Getting there and getting in</Sub>
                    <div className="si-cards">
                        {loc.access.map((a, i) => (
                            <Rv className="si-card" d={i * 80} key={a.title}>
                                <h4>{a.title}</h4>
                                <p>{a.text}</p>
                            </Rv>
                        ))}
                    </div>

                    <div className="si-mosaic">
                        {loc.gallery.map((g, i) => (
                            <Pic key={g.caption} src={g.src} alt={g.caption} label={g.caption} caption={g.caption} ratio={i === 0 ? '16/9' : '4/3'} className={i === 0 ? 'si-m0' : ''} d={i * 90} onOpen={setLb} />
                        ))}
                    </div>
                </Sec>

                {/* ---------- 02 FACILITIES & INFRASTRUCTURE ---------- */}
                <Sec s={sections[1]} i={1} theme="dark">
                    <Facilities />

                    <div className="si-cols">
                        <Rv className="si-card">
                            <h3 className="si-card-t">{facilities.provided.title}</h3>
                            <ul className="si-checks">{facilities.provided.items.map((x) => <li key={x}>{x}</li>)}</ul>
                        </Rv>
                        <Rv className="si-card" d={100}>
                            <h3 className="si-card-t">{facilities.phase1.title} <small>{facilities.phase1.note}</small></h3>
                            <ul className="si-checks">{facilities.phase1.items.map((x) => <li key={x}>{x}</li>)}</ul>
                        </Rv>
                    </div>

                    <Pic src={facilities.hangar.src} alt={facilities.hangar.caption} label="Hangar render" caption={facilities.hangar.caption} ratio="16/9" onOpen={setLb} />

                    <Sub>{facilities.planTitle}</Sub>
                    <Pic src={facilities.plan.src} alt={facilities.plan.caption} label="Site plan" caption={facilities.plan.caption} ratio="16/10" onOpen={setLb} />
                    <Rv as="ol" className="si-legend" d={100}>
                        {facilities.legend.map((l, i) => <li key={l}><span>{i + 1}</span>{l}</li>)}
                    </Rv>
                </Sec>

                {/* ---------- 03 AIRSPACE & OPERATIONAL INFORMATION ---------- */}
                <Sec s={sections[2]} i={2} theme="light">
                    <Sub>Public airspace overview</Sub>
                    <div className="si-cards">
                        {airspace.overview.map((a, i) => (
                            <Rv className="si-card" d={i * 80} key={a.title}>
                                <h4>{a.title}</h4>
                                <p>{a.text}</p>
                            </Rv>
                        ))}
                    </div>

                    <Sub>Operating areas</Sub>
                    <Layers areas={airspace.areas} />

                    <Sub>Flight corridors</Sub>
                    <div className="si-cols">
                        {airspace.corridors.map((c, i) => (
                            <div key={c.title} className="si-corr">
                                <Pic src={c.src} alt={c.title} label={c.title} ratio="4/3" d={i * 100} onOpen={setLb} />
                                <Rv as="h4" className="si-cap" d={i * 100 + 120}>{c.title}</Rv>
                                <Rv as="p" className="si-capp" d={i * 100 + 180}>{c.text}</Rv>
                            </div>
                        ))}
                    </div>

                    <Sub>At a glance</Sub>
                    <Rv as="dl" className="si-glance">
                        {airspace.glance.map((g) => (
                            <div key={g.k}><dt>{g.k}</dt><dd><Tbc v={g.v} /></dd></div>
                        ))}
                    </Rv>
                </Sec>

                {/* ---------- 04 WEATHER ---------- */}
                <Sec s={sections[3]} i={3} theme="dusk">
                    <Weather />
                    <Sub>Official sources</Sub>
                    <div className="si-cols">
                        {weather.links.map((l, i) => (
                            <Rv key={l.title} d={i * 100}>
                                <a className="si-card si-linkcard" href={l.href} target="_blank" rel="noopener noreferrer">
                                    <h4>{l.title}</h4>
                                    <p>{l.text}</p>
                                    <span>Visit site ↗</span>
                                </a>
                            </Rv>
                        ))}
                    </div>
                </Sec>

                {/* ---------- 05 GUIDELINES & DOWNLOADS ---------- */}
                <Sec s={sections[4]} i={4} theme="light">
                    <Sub>How to take part</Sub>
                    <div className="si-steps">
                        {guidelines.steps.map((s, i) => (
                            <Rv className="si-step" d={i * 100} key={s.title}>
                                <strong>{i + 1}</strong>
                                <h4>{s.title}</h4>
                                <p>{s.text}</p>
                            </Rv>
                        ))}
                    </div>

                    <Sub>Notes and safety</Sub>
                    <div>{guidelines.accordion.map((a, i) => <Acc key={a.title} title={a.title} list={a.list} d={i * 80} />)}</div>

                    <Sub>Downloads</Sub>
                    <div className="si-dl-list">
                        {guidelines.downloads.map((f, i) => (
                            <Rv key={f.title} d={i * 80}>
                                {f.href
                                    ? <a className="si-file" href={f.href} download><b>{f.title}</b><span>{f.type}</span><i aria-hidden="true">↓</i></a>
                                    : <div className="si-file is-soon"><b>{f.title}</b><span>{f.type}</span><em>Coming soon</em></div>}
                            </Rv>
                        ))}
                    </div>
                </Sec>

                {/* ---------- closing call to action: slides over the last section ---------- */}
                <div className="si-foot">
                    <div className="si-marq" aria-hidden="true"><div>{marquee}{marquee}</div></div>
                    <div className="si-wrap si-foot-in">
                        <Rv as="h2" className="si-h si-h--xl" text><W t="Have a technology" em="to test?" /></Rv>
                        <Rv className="si-foot-btns" d={300}>
                            <a className="si-btn" href={page.applyHref}>{page.applyLabel}</a>
                            <a className="si-btn si-btn--ghost" href={page.homeHref}>Back to home</a>
                        </Rv>
                    </div>
                </div>
            </main>

            <button
                type="button"
                className={`si-top${active ? ' is-on' : ''}`}
                aria-label="Back to top"
                onClick={() => window.scrollTo({ top: 0, behavior: reduced() ? 'auto' : 'smooth' })}
            >↑</button>

            {lb && <Lightbox item={lb} onClose={closeLb} />}
        </div>
    );
}

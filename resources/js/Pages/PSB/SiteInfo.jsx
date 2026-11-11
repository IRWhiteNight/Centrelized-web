import { useCallback, useEffect, useRef, useState } from 'react';
import '../../../css/PSB-css/psb-siteinfo.css';
import {
    page, hero, sections, location as loc, facilities, airspace, weather, guidelines, closing,
} from '../../data/PSB-data/siteInfoData';

/* ==========================================================================
   Helpers
   All content comes from siteInfoData.js. Nothing in this file needs editing
   to add, remove or change text, photos or videos.
========================================================================== */
const reduced = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const D = (i) => ({ '--d': i * 80 });
const pad = (n) => String(n).padStart(2, '0');
const isVideo = (s) => /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(s || '');
const TONES = { light: 'si-light', dark: 'si-dark', graphite: 'si-dark si-graphite', yellow: 'si-yellow' };

/* adds .in to every .si-rv once it is on screen */
function useReveal(rootRef) {
    useEffect(() => {
        const nodes = rootRef.current.querySelectorAll('.si-rv');
        if (reduced() || !('IntersectionObserver' in window)) {
            nodes.forEach((n) => n.classList.add('in'));
            return undefined;
        }
        const io = new IntersectionObserver((entries) => {
            entries.forEach((e) => {
                if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
            });
        }, { threshold: 0.05, rootMargin: '0px 0px -4% 0px' });
        nodes.forEach((n) => io.observe(n));
        return () => io.disconnect();
    }, [rootRef]);
}

/* number that counts up the first time it is seen */
function Count({ to, dec = 0 }) {
    const ref = useRef(null);
    useEffect(() => {
        const el = ref.current;
        if (!el) return undefined;
        if (reduced()) { el.textContent = Number(to).toFixed(dec); return undefined; }
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
        }, { threshold: 0.4 });
        io.observe(el);
        return () => io.disconnect();
    }, [to, dec]);
    return <span ref={ref}>{(0).toFixed(dec)}</span>;
}

const Tbc = ({ v }) => (v === 'TBC' ? <span className="si-tbc">TBC</span> : v);

const Arrow = () => (
    <svg className="si-arrow" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
        <path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

/* photo OR video, with a labelled placeholder when the file is empty or missing */
function Media({ src, alt, label, controls = false }) {
    const [bad, setBad] = useState(!src);
    useEffect(() => { setBad(!src); }, [src]);
    if (bad) return <div className="si-ph"><span>{label || alt}</span></div>;
    return isVideo(src)
        ? <video src={src} aria-label={alt} autoPlay={!controls} muted={!controls} loop playsInline controls={controls} preload="metadata" onError={() => setBad(true)} />
        : <img src={src} alt={alt} loading="lazy" decoding="async" onError={() => setBad(true)} />;
}

/* media tile with optional click-to-enlarge */
function Pic({ src, alt, label, caption, ratio, d = 0, onOpen, className = '' }) {
    const open = onOpen && src ? () => onOpen({ src, alt, caption }) : undefined;
    const key = open ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } } : undefined;
    return (
        <figure
            className={`si-rv si-pic ${className}`}
            style={{ '--d': d, aspectRatio: ratio }}
            {...(open ? { role: 'button', tabIndex: 0, 'aria-label': `Enlarge: ${alt}`, onClick: open, onKeyDown: key } : {})}
        >
            <Media src={src} alt={alt} label={label || alt} />
            {caption && <figcaption>{caption}</figcaption>}
            {open && <span className="si-zoom" aria-hidden="true">+</span>}
        </figure>
    );
}

function Sec({ s, children }) {
    return (
        <section id={s.id} className={`si-sec ${TONES[s.tone] || TONES.light}`}>
            <div className="si-wrap">
                <header className="si-head">
                    <p className="si-kicker si-rv"><span>{s.n}</span>{s.label}</p>
                    <h2 className="si-h si-rv" style={D(1)}>{s.title}{s.em && <> <em>{s.em}</em></>}</h2>
                    <p className="si-lede si-rv" style={D(2)}>{s.intro}</p>
                </header>
                {children}
            </div>
        </section>
    );
}

const Sub = ({ children }) => <h3 className="si-sub si-rv">{children}</h3>;

/* ==========================================================================
   Facilities: big stage + equal-height index list that sits beside it
========================================================================== */
function Facilities() {
    const items = facilities.items;
    const n = items.length;
    const [k, setK] = useState(0);
    const [play, setPlay] = useState(true);
    const [hover, setHover] = useState(false);
    const go = useCallback((v) => setK(((v % n) + n) % n), [n]);
    if (!n) return null;

    return (
        <div className="si-show si-rv">
            <div className="si-stage" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
                {items.map((f, i) => (
                    <figure key={f.name} className={i === k ? 'is-on' : ''}>
                        <Media src={f.src} alt={f.name} label={`${f.name} image`} />
                        <figcaption>
                            <small>{f.tag}</small>
                            <h3>{f.name}</h3>
                            <p>{f.text}</p>
                        </figcaption>
                    </figure>
                ))}
                <span className="si-bignum" aria-hidden="true">{pad(k + 1)}</span>
                <div className="si-fctl">
                    <button type="button" aria-label="Previous" onClick={() => go(k - 1)}>&larr;</button>
                    <button type="button" aria-label={play ? 'Pause slideshow' : 'Play slideshow'} onClick={() => setPlay((p) => !p)}>{play ? '❚❚' : '▶'}</button>
                    <button type="button" aria-label="Next" onClick={() => go(k + 1)}>&rarr;</button>
                </div>
                <div className={`si-fprog${!play || hover ? ' is-paused' : ''}`} aria-hidden="true">
                    <i key={`${k}-${play}`} onAnimationEnd={() => { if (play) go(k + 1); }} />
                </div>
            </div>
            <ol className="si-idx">
                {items.map((f, i) => (
                    <li key={f.name}>
                        <button type="button" className={i === k ? 'is-on' : ''} onMouseEnter={() => setK(i)} onFocus={() => setK(i)} onClick={() => setK(i)}>
                            <span className="si-idx-n">{pad(i + 1)}</span>
                            <span className="si-idx-t"><b>{f.name}</b><small>{f.tag}</small></span>
                            <Arrow />
                        </button>
                    </li>
                ))}
            </ol>
        </div>
    );
}

/* Operating areas drawn as layered airspace plates */
function Layers({ areas }) {
    const [k, setK] = useState(0);
    const n = areas.length;
    if (!n) return null;
    const cy = (j) => 96 + (n - 1 - j) * 104;
    const h = cy(0) + 96;
    return (
        <div className="si-lay si-rv">
            <svg viewBox={`0 0 420 ${h}`} role="img" aria-label="Operating areas drawn as layered airspace plates">
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
        </div>
    );
}

/* WMO weather code to short text */
const wx = (c) => (c === 0 ? 'Clear sky' : c <= 3 ? 'Partly cloudy' : c <= 48 ? 'Fog' : c <= 57 ? 'Drizzle' : c <= 67 ? 'Rain' : c <= 82 ? 'Rain showers' : 'Thunderstorm');
const compass = (deg) => ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.round(deg / 45) % 8];

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
    const gmin = dly ? Math.min(...dly.temperature_2m_min) : 0;
    const gmax = dly ? Math.max(...dly.temperature_2m_max) : 1;
    const span = Math.max(1, gmax - gmin);

    return (
        <div className="si-card si-wxcard si-rv">
            <p className="si-label">{weather.label}</p>
            {failed && <p className="si-muted">The live summary is unavailable right now. Please use the official sources.</p>}
            {!data && !failed && <p className="si-muted">Loading weather...</p>}
            {c && (
                <>
                    <div className="si-wxnow">
                        <strong>{Math.round(c.temperature_2m)}&deg;<small>C</small></strong>
                        <span>{wx(c.weather_code)}</span>
                    </div>
                    <dl className="si-wxdl">
                        <div><dt>Feels like</dt><dd>{Math.round(c.apparent_temperature)}&deg;C</dd></div>
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
                                    <b>{Math.round(hi)}&deg; <em>{Math.round(lo)}&deg;</em></b>
                                    <span className="si-wxbar"><i style={{ left: `${((lo - gmin) / span) * 100}%`, right: `${100 - ((hi - gmin) / span) * 100}%` }} /></span>
                                    <span className="si-wxrain">{dly.precipitation_probability_max[i]}% rain</span>
                                </div>
                            );
                        })}
                    </div>
                </>
            )}
            <p className="si-note">{weather.note}</p>
        </div>
    );
}

/* Full-screen viewer for photos and videos. Esc, click outside or the close button to leave. */
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
            <button type="button" aria-label="Close" onClick={onClose}>&times;</button>
            {isVideo(item.src)
                ? <video src={item.src} controls autoPlay loop playsInline onClick={(e) => e.stopPropagation()} onError={onClose} />
                : <img src={item.src} alt={item.alt} onClick={(e) => e.stopPropagation()} onError={onClose} />}
            {item.caption && <p>{item.caption}</p>}
        </div>
    );
}

/* ==========================================================================
   Section bodies. Key = section id in siteInfoData.js.
   Delete a section in the data file and its body (and menu item) disappears.
========================================================================== */
const BODIES = {
    location: ({ open }) => (
        <>
            <div className="si-loc">
                <div className="si-map si-rv">
                    <iframe title="Map of the Perlis Airspace Sandbox site" src={`https://www.google.com/maps?q=${encodeURIComponent(loc.mapQuery)}&output=embed`} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
                </div>
                <div className="si-loc-cards">
                    <div className="si-card si-rv" style={D(1)}>
                        <h3 className="si-card-t">Address</h3>
                        {loc.address.map((l) => <p key={l} className="si-addr">{l}</p>)}
                        <dl className="si-dl">
                            <div><dt>Coordinates</dt><dd><Tbc v={loc.coordinates} /></dd></div>
                            <div><dt>Postcode</dt><dd><Tbc v={loc.postcode} /></dd></div>
                        </dl>
                        <a className="si-link" href={loc.mapLink} target="_blank" rel="noopener noreferrer">Open in Google Maps<Arrow /></a>
                    </div>
                    <div className="si-card si-rv" style={D(2)}>
                        <h3 className="si-card-t">Around the site</h3>
                        <div className="si-tags">{loc.nearby.map((n) => <span key={n}>{n}</span>)}</div>
                    </div>
                </div>
            </div>

            <div className="si-facts">
                {loc.facts.map((f, i) => (
                    <div className="si-fact si-rv" style={D(i)} key={f.label}>
                        <strong><Count to={f.to} dec={f.dec} />{f.unit}</strong>
                        <span>{f.label}</span>
                    </div>
                ))}
            </div>

            <Sub>Getting there and getting in</Sub>
            <div className="si-cards">
                {loc.access.map((a, i) => (
                    <div className="si-card si-rv" style={D(i)} key={a.title}>
                        <h4>{a.title}</h4>
                        <p>{a.text}</p>
                    </div>
                ))}
            </div>

            <div className="si-mosaic">
                {loc.gallery.map((g, i) => (
                    <Pic key={g.caption + i} src={g.src} alt={g.caption} caption={g.caption} ratio="4/3" d={i * 80} onOpen={open} />
                ))}
            </div>
        </>
    ),

    facilities: ({ open }) => (
        <>
            <Facilities />

            <div className="si-fac-info">
                <div>
                    <h3 className="si-sub">{facilities.provided.title}</h3>
                    <ul className="si-tiles">
                        {facilities.provided.items.map((x, i) => (
                            <li className="si-rv" style={D(i)} key={x}><span aria-hidden="true" />{x}</li>
                        ))}
                    </ul>
                </div>
                <div>
                    <h3 className="si-sub">{facilities.phase1.title}<span className="si-pill">{facilities.phase1.note}</span></h3>
                    <ol className="si-road">
                        {facilities.phase1.items.map((x, i) => (
                            <li className="si-rv" style={D(i)} key={x}><b>{pad(i + 1)}</b><p>{x}</p></li>
                        ))}
                    </ol>
                </div>
            </div>

            <Sub>{facilities.planTitle}</Sub>
            <div className="si-plan2">
                <Pic src={facilities.plan.src} alt={facilities.plan.caption} label="Site plan" caption={facilities.plan.caption} ratio="16/10" onOpen={open} />
                <ol className="si-legend si-rv" style={D(1)}>
                    {facilities.legend.map((l, i) => <li key={l}><span>{i + 1}</span>{l}</li>)}
                </ol>
            </div>

            <div className="si-rend">
                {facilities.renders.map((r, i) => (
                    <Pic key={r.caption + i} src={r.src} alt={r.caption} caption={r.caption} ratio="16/10" d={i * 80} onOpen={open} />
                ))}
            </div>
        </>
    ),

    airspace: ({ open }) => (
        <>
            <Sub>Public airspace overview</Sub>
            <div className="si-cards">
                {airspace.overview.map((a, i) => (
                    <div className="si-card si-rv" style={D(i)} key={a.title}>
                        <h4>{a.title}</h4>
                        <p>{a.text}</p>
                    </div>
                ))}
            </div>

            <Sub>Operating areas</Sub>
            <Layers areas={airspace.areas} />

            <Sub>Flight corridors</Sub>
            <div className="si-cols">
                {airspace.corridors.map((c, i) => (
                    <div key={c.title} className="si-corr">
                        <Pic src={c.src} alt={c.title} label={c.title} ratio="16/10" d={i * 100} onOpen={open} />
                        <h4 className="si-cap si-rv" style={D(i + 1)}>{c.title}</h4>
                        <p className="si-capp si-rv" style={D(i + 2)}>{c.text}</p>
                    </div>
                ))}
            </div>

            <Sub>At a glance</Sub>
            <dl className="si-glance-list si-rv">
                {airspace.glance.map((g) => (
                    <div key={g.k}><dt>{g.k}</dt><dd><Tbc v={g.v} /></dd></div>
                ))}
            </dl>
        </>
    ),

    weather: () => (
        <div className="si-wxgrid">
            <Weather />
            <div className="si-wxlinks">
                <Sub>Official sources</Sub>
                {weather.links.map((l, i) => (
                    <a key={l.title} className="si-card si-linkcard si-rv" style={D(i)} href={l.href} target="_blank" rel="noopener noreferrer">
                        <h4>{l.title}</h4>
                        <p>{l.text}</p>
                        <span>Visit site<Arrow /></span>
                    </a>
                ))}
            </div>
        </div>
    ),

    /* Guidelines: everything is plain, always-visible content (no collapsed panels, no reveal fade),
       so the text can never stay hidden. */
    guidelines: () => (
        <>
            <h3 className="si-sub">{guidelines.stepsTitle}</h3>
            <div className="si-steps">
                {guidelines.steps.map((s, i) => (
                    <div className="si-step" key={s.title}>
                        <strong>{i + 1}</strong>
                        <h4>{s.title}</h4>
                        <p>{s.text}</p>
                    </div>
                ))}
            </div>

            <div className="si-info">
                {guidelines.groups.map((g) => (
                    <div className="si-card" key={g.title}>
                        <h3 className="si-card-t">{g.title}</h3>
                        <ul className="si-ticks">{g.list.map((x) => <li key={x}>{x}</li>)}</ul>
                    </div>
                ))}
            </div>

            <h3 className="si-sub si-sub--gap">{guidelines.downloadsTitle}</h3>
            <div className="si-files">
                {guidelines.downloads.map((f) => (
                    f.href
                        ? <a className="si-file" key={f.title} href={f.href} download><b>{f.title}</b><span>{f.type}</span><i aria-hidden="true">&darr;</i></a>
                        : <div className="si-file is-soon" key={f.title}><b>{f.title}</b><span>{f.type}</span><em>Coming soon</em></div>
                ))}
            </div>
        </>
    ),
};

/* ==========================================================================
   PAGE
========================================================================== */
export default function SiteInfo() {
    const rootRef = useRef(null);
    const [active, setActive] = useState(sections[0]?.id);
    const [lb, setLb] = useState(null);
    const [showFab, setShowFab] = useState(false);

    useReveal(rootRef);

    /* scroll: progress bar, hero parallax, active menu item, floating button */
    useEffect(() => {
        const root = rootRef.current;
        const heroEl = root.querySelector('.si-hero');
        let raf = 0;
        const update = () => {
            raf = 0;
            const y = window.scrollY;
            const h = root.scrollHeight - window.innerHeight;
            if (y < 1100 && heroEl) heroEl.style.setProperty('--sy', `${y}`);
            root.style.setProperty('--progress', h > 0 ? Math.min(1, Math.max(0, y / h)).toFixed(4) : 0);
            setShowFab(y > 720 && y < h - 700);
            const line = window.innerHeight * 0.35;
            let cur = sections[0]?.id;
            sections.forEach((s) => {
                const el = document.getElementById(s.id);
                if (el && el.getBoundingClientRect().top <= line) cur = s.id;
            });
            setActive(cur);
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
        const a = rootRef.current.querySelector('.si-subnav a.is-active');
        const box = rootRef.current.querySelector('.si-subnav-scroll');
        if (a && box) box.scrollTo({ left: a.offsetLeft - box.clientWidth / 2 + a.clientWidth / 2, behavior: 'smooth' });
    }, [active]);

    const goTo = useCallback((id) => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'start' });
    }, []);

    /* pointer effects: magnetic buttons + hero glow */
    const onMove = useCallback((e) => {
        const t = e.target;
        if (!t.closest || reduced()) return;
        const mag = t.closest('.si-mag');
        if (mag) {
            const r = mag.getBoundingClientRect();
            mag.style.setProperty('--tx', `${((e.clientX - (r.left + r.width / 2)) * 0.22).toFixed(1)}px`);
            mag.style.setProperty('--ty', `${((e.clientY - (r.top + r.height / 2)) * 0.3).toFixed(1)}px`);
        }
        const h = t.closest('.si-hero');
        if (h) {
            const r = h.getBoundingClientRect();
            h.style.setProperty('--hx', `${e.clientX - r.left}px`);
            h.style.setProperty('--hy', `${e.clientY - r.top}px`);
        }
    }, []);
    const onOut = useCallback((e) => {
        const t = e.target.closest && e.target.closest('.si-mag');
        if (t && !t.contains(e.relatedTarget)) ['--tx', '--ty'].forEach((p) => t.style.removeProperty(p));
    }, []);

    const closeLb = useCallback(() => setLb(null), []);
    const shown = sections.filter((s) => BODIES[s.id]);

    return (
        <div className="si" ref={rootRef} onMouseMove={onMove} onMouseOut={onOut}>

            {/* ===================== HERO ===================== */}
            <section className="si-hero" id="top">
                <div className="si-hero-media" aria-hidden="true">
                    {hero.video
                        ? <video autoPlay muted loop playsInline preload="auto"><source src={hero.video} type="video/mp4" /></video>
                        : hero.image && <img src={hero.image} alt="" />}
                </div>
                <div className="si-grid" aria-hidden="true" />
                <div className="si-glow" aria-hidden="true" />

                <div className="si-wrap si-hero-copy">
                    <p className="si-eyebrow"><i />{hero.eyebrow}</p>
                    <h1 className="si-title si-in" style={{ '--i': 1 }}>{hero.title} <em>{hero.titleEm}</em></h1>
                    <p className="si-hero-lede si-in" style={{ '--i': 2 }}>{hero.text}</p>
                    <div className="si-hero-cta si-in" style={{ '--i': 3 }}>
                        <a className="si-btn si-mag" href={page.applyHref}>{page.applyLabel}<Arrow /></a>
                        {shown[0] && <button className="si-btn si-btn--ghost si-mag" onClick={() => goTo(shown[0].id)}>Explore the site<Arrow /></button>}
                    </div>
                </div>

                <div className="si-wrap si-glance si-in" style={{ '--i': 4 }}>
                    <div className="si-glance-bar">
                        <span>At a glance</span>
                        {hero.note && <span>{hero.note}</span>}
                    </div>
                    <div className="si-glance-grid">
                        {hero.stats.map((s) => (
                            <div className="si-gl" key={s.label}>
                                <strong><Count to={s.to} dec={s.dec || 0} />{s.unit}</strong>
                                <span className="si-gl-label">{s.label}</span>
                                {s.text && <p className="si-gl-note">{s.text}</p>}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===================== STICKY MENU (same as Opportunities) ===================== */}
            <nav className="si-subnav" aria-label="Site information sections">
                <div className="si-wrap si-subnav-scroll">
                    <ul>
                        {shown.map((s) => (
                            <li key={s.id}>
                                <a
                                    href={`#${s.id}`}
                                    className={active === s.id ? 'is-active' : ''}
                                    aria-current={active === s.id ? 'true' : undefined}
                                    onClick={(e) => { e.preventDefault(); goTo(s.id); }}
                                >{s.label}</a>
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="si-progress" aria-hidden="true"><span /></div>
            </nav>

            {/* ===================== TICKER ===================== */}
            <div className="si-ticker" aria-hidden="true">
                <div className="si-ticker-track">
                    {[0, 1].map((k) => (
                        <ul key={k}>{[...shown, ...shown].map((s, i) => <li key={`${s.id}${i}`}>{s.label}</li>)}</ul>
                    ))}
                </div>
            </div>

            {/* ===================== SECTIONS (from siteInfoData.js) ===================== */}
            {shown.map((s) => {
                const Body = BODIES[s.id];
                return <Sec key={s.id} s={s}><Body open={setLb} /></Sec>;
            })}

            {/* ===================== CLOSING CTA ===================== */}
            <section className="si-sec si-dark si-cta" id="cta">
                <div className="si-wrap si-cta-in">
                    <h2 className="si-h si-rv">{closing.heading} <em>{closing.em}</em></h2>
                    <div className="si-cta-btns si-rv" style={D(1)}>
                        <a className="si-btn si-mag" href={page.applyHref}>{page.applyLabel}<Arrow /></a>
                        <a className="si-btn si-btn--ghost si-mag" href={page.homeHref}>Back to home<Arrow /></a>
                    </div>
                </div>
            </section>

            {/* floating apply button, appears after the hero */}
            <div className={`si-fab ${showFab ? 'is-on' : ''}`}>
                <a className="si-btn si-btn--sm" href={page.applyHref} tabIndex={showFab ? 0 : -1}>{page.applyLabel}<Arrow /></a>
            </div>

            {lb && <Lightbox item={lb} onClose={closeLb} />}
        </div>
    );
}

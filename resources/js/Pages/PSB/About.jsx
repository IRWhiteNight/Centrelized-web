import { Fragment, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import '../../../css/PSB-css/psb-about.css';
import defaults from '../../data/PSB-data/aboutData';

/* Images and videos live in resources/js/images/about/ . Data refers to them by file name only. */
const FILES = import.meta.glob('../images/about/**/*.{jpg,jpeg,png,webp,avif,svg,mp4,webm}', { eager: true, query: '?url', import: 'default' });
const url = (f) => (f ? FILES[`../images/about/${f}`] || '' : '');
const isVideo = (f) => /\.(mp4|webm)$/i.test(f || '');
const logoUrl = (name) => {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    return ['png', 'svg', 'webp', 'jpg'].map((e) => url(`logos/${slug}.${e}`)).find(Boolean) || '';
};
const filled = (b) => !!(b.items?.length || b.groups?.length || b.file || b.text);
const ok = (b) => (b.type === 'logos' ? b.groups?.length : filled(b));
const key = (label, i) => `${label ?? ''}-${i}`;
const st = (i) => ({ '--i': i });
const pad = (n) => String(n).padStart(2, '0');
const tone = (t) => ({ light: 'graphite', grey: 'graphite' }[t] || t || 'dark');
const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/* Optional hero copy. Add a `hero` key to aboutData to override any of this. */
const HERO = {
    eyebrow: 'Perlis Airspace Sandbox',
    title: 'A national testbed for the *next era of flight.*',
    lead: 'Perlis is opening its low-altitude airspace to government, industry and researchers, so drones, air taxis and cargo flights can be tested under real conditions.',
    meta: ['Perlis, Malaysia', 'Government, industry and research', 'Low-altitude airspace'],
    cta: { label: 'Explore the sandbox' },
    apply: { label: 'Apply to participate', href: '/apply' },
    file: '',
};

/* "Low-altitude *airspace* test": words between * * become the gradient accent. Words rise out of a mask. */
const plain = (t) => t.replace(/\*/g, '');
function Words({ text }) {
    let it = false;
    return text.split(' ').map((raw, i) => {
        if (raw.startsWith('*')) it = true;
        const w = raw.replace(/\*/g, '');
        const out = (
            <span className="w" key={i}>
                <span style={{ '--wi': i }}>{it ? <em>{w}</em> : w}&nbsp;</span>
            </span>
        );
        if (raw.endsWith('*')) it = false;
        return out;
    });
}

/* ---------- small pieces ---------- */
function Pic({ file, alt, className = '', ratio, par = 0, eager = false }) {
    const [bad, setBad] = useState(false);
    const u = url(file);
    return (
        <figure className={`pic ${par ? 'par' : ''} ${className}`} style={ratio ? { aspectRatio: ratio } : undefined} data-par={par || undefined}>
            {u && !bad ? (
                isVideo(file)
                    ? <video src={u} muted loop playsInline autoPlay preload="metadata" aria-label={alt || undefined} onError={() => setBad(true)} />
                    : <img src={u} alt={alt || ''} loading={eager ? 'eager' : 'lazy'} decoding="async" onError={() => setBad(true)} />
            ) : (
                <div className="pic-ph">
                    <b aria-hidden="true">+</b><span>Add image</span><code>{file || 'no file set'}</code>{alt && <small>{alt}</small>}
                </div>
            )}
        </figure>
    );
}

function Count({ to }) {
    const ref = useRef(null);
    const [v, setV] = useState(0);
    const dec = (String(to).split('.')[1] || '').length;
    useEffect(() => {
        const io = new IntersectionObserver(([e]) => {
            if (!e.isIntersecting) { setV(0); return; }
            if (reduced()) return setV(to);
            const t0 = performance.now();
            const step = (t) => { const p = Math.min(1, (t - t0) / 1600); setV(to * (1 - (1 - p) ** 4)); if (p < 1) requestAnimationFrame(step); };
            requestAnimationFrame(step);
        }, { threshold: 0.6 });
        io.observe(ref.current);
        return () => io.disconnect();
    }, [to]);
    return <span ref={ref}>{v.toFixed(dec)}</span>;
}

/* ---------- hero: one orchestrated moment. A flight path draws itself, a radar sweeps the airspace ---------- */
const FLIGHT = 'M-40 660 C 230 640 330 230 650 310 S 1010 600 1200 330 S 1400 110 1500 50';

function FlightPath() {
    const still = reduced();
    return (
        <svg className="hero-path" viewBox="0 0 1440 800" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
            <defs>
                <linearGradient id="fp-g" x1="0" x2="1" y1="0" y2="0">
                    <stop offset="0" stopColor="#ffd21f" stopOpacity="0" />
                    <stop offset=".45" stopColor="#ffd21f" />
                    <stop offset="1" stopColor="#ff8a3d" />
                </linearGradient>
            </defs>
            <path d={FLIGHT} className="fp-ghost" />
            <path id="fp-d" d={FLIGHT} className="fp-line" pathLength="1" stroke="url(#fp-g)" />
            {!still && (
                <g>
                    <animateMotion dur="11s" begin="1.4s" repeatCount="indefinite" rotate="auto"><mpath href="#fp-d" /></animateMotion>
                    <circle r="22" fill="#ffd21f" opacity=".16" />
                    <circle r="6" fill="#ffd21f" />
                </g>
            )}
        </svg>
    );
}

const Radar = () => (
    <div className="radar" aria-hidden="true">
        <i className="r-sweep" />
        <i className="r-b" style={{ '--x': '63%', '--y': '31%', '--t': '0s' }} />
        <i className="r-b" style={{ '--x': '38%', '--y': '58%', '--t': '1.4s' }} />
        <i className="r-b" style={{ '--x': '71%', '--y': '66%', '--t': '2.5s' }} />
    </div>
);

function Hero({ h, onStart, firstId }) {
    const media = url(h.file);
    return (
        <section className="hero t-dark" aria-label="Introduction">
            <div className="hero-media" aria-hidden="true">
                {media && (isVideo(h.file)
                    ? <video src={media} muted loop playsInline autoPlay preload="auto" />
                    : <img src={media} alt="" loading="eager" decoding="async" />)}
            </div>
            <i className="hero-glow" aria-hidden="true" />
            <i className="hero-grid" aria-hidden="true" />
            <Radar />
            <FlightPath />
            <div className="hero-in">
                <p className="hero-pill hr" style={{ '--d': '.1s' }}><i aria-hidden="true" />{h.eyebrow}</p>
                <h1 aria-label={plain(h.title)}><Words text={h.title} /></h1>
                <div className="hero-row">
                    <p className="hero-lead hr" style={{ '--d': '.7s' }}>{h.lead}</p>
                    <div className="hero-cta hr" style={{ '--d': '.85s' }}>
                        <a className="btn" href={`#${firstId}`} onClick={(e) => { e.preventDefault(); onStart(); }}><span>{h.cta.label}</span><i aria-hidden="true">↓</i></a>
                        <a className="btn btn--ghost" href={h.apply.href}><span>{h.apply.label}</span></a>
                    </div>
                </div>
                {h.meta?.length > 0 && <ul className="hero-meta hr" style={{ '--d': '1s' }}>{h.meta.map((m, i) => <li key={i}>{m}</li>)}</ul>}
            </div>
            <div className="hero-scroll" aria-hidden="true"><span />Scroll</div>
        </section>
    );
}

/* ---------- blocks ---------- */
function Tabs({ b }) {
    const [i, setI] = useState(0);
    const rail = useRef(null);
    const t = b.items[i];
    let last = '';
    /* one yellow bar slides to the active tab */
    useLayoutEffect(() => {
        const place = () => {
            const btn = rail.current?.querySelectorAll('button')[i];
            if (!btn) return;
            rail.current.style.setProperty('--ty', `${btn.offsetTop}px`);
            rail.current.style.setProperty('--th', `${btn.offsetHeight}px`);
        };
        place();
        window.addEventListener('resize', place);
        return () => window.removeEventListener('resize', place);
    }, [i]);
    const onKey = (e) => {
        if (!['ArrowDown', 'ArrowUp', 'ArrowRight', 'ArrowLeft'].includes(e.key)) return;
        e.preventDefault();
        e.stopPropagation();
        const n = (i + (e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : -1) + b.items.length) % b.items.length;
        setI(n);
        rail.current.querySelectorAll('button')[n]?.focus();
    };
    return (
        <div className="tabs">
            <div className="tabs-rail" role="tablist" ref={rail} onKeyDown={onKey}>
                <i className="tabs-ind" aria-hidden="true" />
                {b.items.map((x, k) => {
                    const g = x.group && x.group !== last ? (last = x.group) : null;
                    return (
                        <Fragment key={key(x.tab, k)}>
                            {g && <span className="tabs-g">{g}</span>}
                            <button role="tab" aria-selected={i === k} tabIndex={i === k ? 0 : -1} className={i === k ? 'is-on' : ''} onClick={() => setI(k)}>
                                <span>{x.tab}{x.meta && <small>{x.meta}</small>}</span>
                            </button>
                        </Fragment>
                    );
                })}
            </div>
            <div className="tabs-panel" key={i} aria-live="polite">
                {'file' in t && <Pic file={t.file} alt={t.title || t.tab} par={0.2} className={t.groups ? 'photo photo--band' : 'photo'} />}
                {t.title && <h3>{t.title}</h3>}
                {t.text && <p>{t.text}</p>}
                {t.groups && (
                    <div className="grps">
                        {t.groups.map((g, gi) => (
                            <div key={key(g.title, gi)} style={{ animationDelay: `${0.2 + gi * 0.07}s` }}><h4>{g.title}</h4><ul>{g.items.map((x, xi) => <li key={key(x, xi)}>{x}</li>)}</ul></div>
                        ))}
                    </div>
                )}
                {t.outcomes && (
                    <div className="outs"><h4>Expected outcomes</h4><ul>{t.outcomes.map((x, xi) => <li key={key(x, xi)}>{x}</li>)}</ul></div>
                )}
            </div>
        </div>
    );
}

/* draggable horizontal card row with progress line */
function HScroll({ b }) {
    const tr = useRef(null);
    const drag = useRef(null);
    const sync = () => {
        const el = tr.current;
        if (!el) return;
        const max = el.scrollWidth - el.clientWidth;
        el.parentElement.style.setProperty('--hp', max > 0 ? (0.18 + 0.82 * (el.scrollLeft / max)).toFixed(3) : 1);
    };
    useEffect(() => { sync(); window.addEventListener('resize', sync); return () => window.removeEventListener('resize', sync); }, []);
    const down = (e) => {
        if (e.pointerType !== 'mouse') return;
        drag.current = { x: e.clientX, s: tr.current.scrollLeft };
        tr.current.classList.add('is-drag');
        tr.current.setPointerCapture(e.pointerId);
    };
    const move = (e) => { if (drag.current) tr.current.scrollLeft = drag.current.s - (e.clientX - drag.current.x); };
    const up = () => { drag.current = null; tr.current?.classList.remove('is-drag'); };
    const by = (d) => tr.current.scrollBy({ left: d * tr.current.clientWidth * 0.5, behavior: 'smooth' });
    return (
        <div className="hs">
            <div className="hs-track" ref={tr} onScroll={sync} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
                {b.items.map((x, i) => (
                    <article className="hs-card" key={key(x.title, i)} style={st(i)}>
                        <Pic file={x.file} alt={x.title} ratio="3 / 4" />
                        <h4>{x.title}</h4>
                        {x.tag && <em>{x.tag}</em>}
                        <p>{x.text}</p>
                    </article>
                ))}
            </div>
            <div className="hs-ctl">
                <span className="hs-bar"><b /></span>
                <button onClick={() => by(-1)} aria-label="Previous">←</button>
                <button onClick={() => by(1)} aria-label="Next">→</button>
            </div>
        </div>
    );
}

function Block({ b }) {
    switch (b.type) {
        case 'stats':
            return (
                <div className="stats">
                    {b.items.map((s, i) => (
                        <div className="stat-card" key={key(s.label, i)} style={st(i)}><span>{s.label}</span><strong><Count to={s.n} />{s.unit && <small>{s.unit}</small>}</strong></div>
                    ))}
                </div>
            );
        case 'collage':
            return (
                <div className="collage">
                    {b.items.map((x, i) => (
                        <div key={key(x.label || x.file, i)} className={x.kind === 'stat' ? 'stat-card' : 'collage-img'} style={{ ...st(i), '--span': x.span || 3, '--off': x.off || '0px' }}>
                            {x.kind === 'stat'
                                ? <><span>{x.label}</span><strong><Count to={x.n} />{x.unit && <small>{x.unit}</small>}</strong></>
                                : <Pic file={x.file} alt={x.alt} ratio={x.ratio || '4 / 3'} par={i % 2 ? 0.3 : 0.15} />}
                        </div>
                    ))}
                </div>
            );
        case 'marquee':
            return (
                <div className={`marquee ${b.reverse ? 'rev' : ''}`} style={{ '--dur': `${b.speed || 46}s` }}>
                    <div className="mq-row">
                        {[0, 1].map((k) => (
                            <div className="mq-set" key={k} aria-hidden={k ? 'true' : undefined}>
                                {b.items.map((g, i) => <Pic key={key(g.file, i)} file={g.file} alt={g.alt} ratio={b.ratio || '4 / 3'} />)}
                            </div>
                        ))}
                    </div>
                </div>
            );
        case 'ticker':
            return (
                <div className="ticker" style={{ '--dur': `${b.speed || 38}s` }}>
                    <div className="tk-row">
                        {[0, 1].map((k) => (
                            <div className="tk-set" key={k} aria-hidden={k ? 'true' : undefined}>
                                {b.items.map((x, i) => <span key={i}>{x}<i aria-hidden="true" /></span>)}
                            </div>
                        ))}
                    </div>
                </div>
            );
        case 'full':
            return (
                <div className="full">
                    <Pic file={b.file} alt={b.alt} par={0.5} />
                    {b.caption && <p className="full-cap"><b>{b.kicker || 'Perlis'}</b>{b.caption}</p>}
                </div>
            );
        case 'hscroll':
            return <HScroll b={b} />;
        case 'image':
            return <Pic file={b.file} alt={b.alt} className={b.className || 'photo'} par={0.2} />;
        case 'gallery':
            return <div className="gallery">{b.items.map((g, i) => <div key={key(g.file, i)} style={st(i)}><Pic file={g.file} alt={g.alt} className="photo photo--sm" par={i % 2 ? 0.3 : 0.12} /></div>)}</div>;
        case 'defs':
            return (
                <div className="defs">
                    {b.title && <h3>{b.title}</h3>}
                    {b.items.map(([k, v], i) => <div key={key(k + v, i)} style={st(i)}>{k && <dt>{k}</dt>}<dd>{v}</dd></div>)}
                </div>
            );
        case 'pairs':
            return (
                <div className="pairs">
                    <div className="pairs-h"><span>{b.head[0]}</span><span aria-hidden="true" /><span>{b.head[1]}</span></div>
                    {b.items.map(([a, at, c, ct], i) => (
                        <div className="pair" key={key(a, i)} style={st(i)}>
                            <div><h4>{a}</h4><p>{at}</p></div>
                            <i aria-hidden="true" />
                            <div><h4>{c}</h4><p>{ct}</p></div>
                        </div>
                    ))}
                </div>
            );
        case 'tabs':
            return <Tabs b={b} />;
        case 'grid':
            return (
                <div className="grid" style={{ '--cols': b.cols || 3 }}>
                    {b.items.map((x, i) => (
                        <article key={key(x.title, i)} style={st(i)}>
                            {x.file && <Pic file={x.file} alt={x.title} className="photo photo--sm" />}
                            <h4>{x.title}</h4>
                            {x.tag && <em>{x.tag}</em>}
                            <p>{x.text}</p>
                        </article>
                    ))}
                </div>
            );
        case 'tags':
            return (
                <div className="tags">
                    {b.title && <h3>{b.title}</h3>}
                    <ul>{b.items.map((x, i) => <li key={key(x, i)} style={st(i)}>{x}</li>)}</ul>
                </div>
            );
        case 'people':
            return (
                <div className="people" style={b.ratio ? { '--ratio': b.ratio } : undefined}>
                    {b.title && <h3>{b.title}</h3>}
                    <div>{b.items.map((p, i) => (
                        <div className="person" key={key(p.name, i)} style={st(i)}>
                            <Pic file={p.file} alt={p.name} className="avatar" />
                            <div><h4>{p.name}</h4>{p.role && <p>{p.role}</p>}</div>
                        </div>
                    ))}</div>
                </div>
            );
        case 'logos':
            return (
                <div className="logos">
                    {b.groups.map((g, gi) => (
                        <div key={key(g.title, gi)} style={st(gi)}>
                            <h3>{g.title}</h3>
                            <ul>{g.items.map((n, i) => {
                                const u = logoUrl(n);
                                return <li key={key(n, i)}>{u ? <img src={u} alt={n} loading="lazy" /> : <span>{n}</span>}</li>;
                            })}</ul>
                        </div>
                    ))}
                </div>
            );
        case 'cta':
            return (
                <div className="cta">
                    <p>{b.text}</p>
                    <a className="btn" href={b.href}><span>{b.label}</span><i aria-hidden="true">↗</i></a>
                    {b.word && <div className="cta-word" aria-hidden="true">{[...b.word].map((c, i) => <span key={i}><b style={{ '--wi': i }}>{c}</b></span>)}</div>}
                </div>
            );
        default:
            return null;
    }
}

function Section({ s }) {
    const aside = (s.aside || []).filter(ok);
    const blocks = (s.blocks || []).filter((b) => ok(b) || b.type === 'cta');
    const label = s.eyebrow || s.group || '';
    return (
        <section id={s.id} className={`sec t-${tone(s.tone)} ${s.align === 'center' ? 'is-center' : 'is-split'}`}>
            <div className="sec-in">
                <header className="head rv">
                    {label && <span className="eyebrow">{label}<i /></span>}
                    <h2 aria-label={plain(s.title)}><Words text={s.title} /></h2>
                    {s.lead && <p className="lead">{s.lead}</p>}
                </header>
                {aside.length > 0 && <div className="aside">{aside.map((b, i) => <div className="rv" key={i}><Block b={b} /></div>)}</div>}
                <div className="main">{blocks.map((b, i) => <div className={`rv blk blk--${b.type}`} key={i}><Block b={b} /></div>)}</div>
            </div>
        </section>
    );
}

/* ---------- vertical navigation (right) with scroll progress line ---------- */
function SideNav({ list, active, go }) {
    const [open, setOpen] = useState(false);
    const groups = [];
    list.filter((s) => s.nav).forEach((s) => {
        const name = s.group || s.nav;
        let g = groups.find((x) => x.name === name);
        if (!g) groups.push((g = { name, id: s.id, items: [] }));
        g.items.push(s);
    });
    const activeSec = list.find((s) => s.id === active);
    const activeName = activeSec ? (activeSec.group || activeSec.nav) : '';
    const jump = (e, id) => { e.preventDefault(); setOpen(false); go(id); };
    return (
        <nav className={`nav ${open ? 'is-open' : ''}`} aria-label="About sections">
            <span className="nav-line" aria-hidden="true"><b /></span>
            <button className="nav-toggle" onClick={() => setOpen((o) => !o)} aria-expanded={open}>{open ? 'Close' : 'Sections'}</button>
            <ul>
                {groups.map((g) => {
                    const on = activeName === g.name;
                    return (
                        <li key={g.name}>
                            <a href={`#${g.id}`} onClick={(e) => jump(e, g.id)} className={on ? 'is-active' : ''} aria-current={on ? 'true' : undefined}>
                                <span className="nav-label">{g.name}</span><span className="nav-tick" aria-hidden="true" />
                            </a>
                            {g.items.length > 1 && (
                                <ul className={`nav-sub ${on ? 'is-open' : ''}`}>
                                    {g.items.map((s) => (
                                        <li key={s.id}>
                                            <a href={`#${s.id}`} onClick={(e) => jump(e, s.id)} className={active === s.id ? 'is-active' : ''} tabIndex={on ? 0 : -1}>
                                                <span className="nav-label">{s.nav}</span>
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
}

/* Optional: pass `content` from Laravel (Inertia prop) to override the file data. */
export default function About({ content }) {
    const data = content || defaults;
    const hero = { ...HERO, ...(data.hero || {}), cta: { ...HERO.cta, ...(data.hero?.cta || {}) }, apply: { ...HERO.apply, ...(data.hero?.apply || {}) } };
    const sections = data.sections.filter((s) => (s.blocks || []).some((b) => ok(b) || b.type === 'cta'));
    const [active, setActive] = useState(sections[0]?.id);
    const [ready, setReady] = useState(false);
    const root = useRef(null);

    /* smooth jump to a section (nav links, hero button) */
    const go = useCallback((id) => {
        const el = document.getElementById(id);
        if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY, behavior: reduced() ? 'auto' : 'smooth' });
    }, []);

    /* the hero sequence starts as soon as the page has painted */
    useEffect(() => {
        const r = requestAnimationFrame(() => setReady(true));
        return () => cancelAnimationFrame(r);
    }, []);

    useEffect(() => {
        const el = root.current;
        const secs = [...el.querySelectorAll('.sec')];
        const heroEl = el.querySelector('.hero');

        /* the section crossing the middle of the screen becomes the live one */
        const io = new IntersectionObserver((l) => l.forEach((e) => {
            if (e.isIntersecting) setActive(e.target.id);
        }), { rootMargin: '-50% 0px -50% 0px' });
        secs.forEach((s) => io.observe(s));

        /* videos only play while visible */
        const vio = new IntersectionObserver((l) => l.forEach((e) => (e.isIntersecting ? e.target.play?.().catch(() => {}) : e.target.pause())), { threshold: 0.1 });
        el.querySelectorAll('video').forEach((v) => vio.observe(v));

        /* scroll-linked values. Everything is written in whole pixels so text and photos stay sharp. */
        let raf = 0;
        const onScroll = () => {
            cancelAnimationFrame(raf);
            raf = requestAnimationFrame(() => {
                const vh = window.innerHeight, y = window.scrollY, r = el.getBoundingClientRect();
                const total = r.height - vh;
                el.style.setProperty('--prog', total > 0 ? clamp(-r.top / total, 0, 1).toFixed(4) : 0);
            });
        };

        /* soft light that follows the pointer on cards */
        const spot = (e) => {
            const c = e.target.closest?.('.stat-card, .grid article, .grps > div, .person');
            if (!c) return;
            const r = c.getBoundingClientRect();
            c.style.setProperty('--mx', `${Math.round(e.clientX - r.left)}px`);
            c.style.setProperty('--my', `${Math.round(e.clientY - r.top)}px`);
        };

        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll);
        el.addEventListener('pointermove', spot);
        onScroll();
        return () => {
            io.disconnect(); vio.disconnect(); cancelAnimationFrame(raf);
            window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll);
            el.removeEventListener('pointermove', spot);
        };
    }, [sections.length]);

    /* reveal-on-scroll: every .rv gets .in the first time it is on screen */
    useEffect(() => {
        if (!ready) return;
        const items = [...root.current.querySelectorAll('.rv')];
        const io = new IntersectionObserver((l) => l.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
        items.forEach((x) => io.observe(x));
        return () => io.disconnect();
    }, [ready, sections.length]);

    const cur = sections.find((s) => s.id === active);
    const idx = sections.findIndex((s) => s.id === active);
    const here = cur ? (cur.nav || cur.group || '') : '';

    return (
        <div className={`ab t-${tone(cur?.tone)} ${ready ? 'is-ready' : ''}`} ref={root}>
            <div className="ab-prog" aria-hidden="true"><span /></div>
            {idx >= 0 && (
                <div className="ab-idx" aria-hidden="true"><b key={active}>{pad(idx + 1)}</b><span>/ {pad(sections.length)}</span><em>{here}</em></div>
            )}
            <SideNav list={sections} active={active} go={go} />
            <main>
                <Hero h={hero} firstId={sections[0]?.id} onStart={() => sections[0] && go(sections[0].id)} />
                {sections.map((s) => <Section s={s} key={s.id} />)}
            </main>
        </div>
    );
}

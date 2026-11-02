import { useEffect, useState } from 'react';
import '../../css/home.css';

/* banner background video (same path your original page used) */
import videobg from '../videos/bg-video2.mp4';

/* All text, numbers, links and images live in homeData.js. Edit that file, not this one. */
import {
    images, sectionLabels, hero, about, why, who, programmes, news, events, partners, apply,
} from '../data/homeData';

/* Slide order, colour theme per slide (design only; text lives in homeData.js) */
const THEMES = ['clear', 'dark', 'light', 'yellow', 'dark', 'light', 'dark', 'light', 'yellow'];
const IDS = ['banner', 'what-is', 'why-it-matters', 'who-should-participate', 'programmes', 'news', 'events', 'partners', 'apply'];
const META = THEMES.map((theme, i) => ({ theme, id: IDS[i], label: sectionLabels[i] }));
const COUNT = META.length;
const APPLY_INDEX = COUNT - 1; // slide the "Apply" buttons scroll to

/* ==========================================================
   ENGINE — one wheel gesture = one slide (smooth, reversible)
   Touch devices use native scrolling limited to one slide per swipe.
========================================================== */
const TAU = 120, THRESH = 60, COOL = 480, SNAP_IDLE = 140;
const go = (i) => window.dispatchEvent(new CustomEvent('deck-go', { detail: i }));

function useDeck(setCurrent) {
    useEffect(() => {
        const root = document.documentElement;
        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const touch = window.matchMedia('(pointer: coarse)').matches;
        const last = COUNT - 1;
        const vh = () => window.innerHeight;
        const spacer = document.querySelector('.spacer');
        const clampI = (i) => Math.max(0, Math.min(last, i));
        const clampY = (y) => Math.max(0, Math.min(last * vh(), y));
        const nearest = () => clampI(Math.round(window.scrollY / vh()));

        let index = nearest(), target = window.scrollY, pos = target;
        let acc = 0, accDir = 0, lockDir = 0, lockUntil = 0, lastAbs = 0, lastT = 0;
        let touchIdx = null, running = false, prevT = 0, raf = 0, paintRaf = 0, snapTimer = 0;

        const size = () => { if (spacer) spacer.style.height = `${COUNT * vh()}px`; };
        const paint = () => {
            root.style.setProperty('--pos', (Math.min(window.scrollY, last * vh()) / vh()).toFixed(4));
            setCurrent(nearest());
        };
        const tick = (t) => {
            const dt = Math.min(64, prevT ? t - prevT : 16);
            prevT = t;
            pos += (target - pos) * (reduced ? 1 : 1 - Math.exp(-dt / TAU));
            if (Math.abs(target - pos) < 0.5) { pos = target; running = false; prevT = 0; }
            window.scrollTo({ top: pos, left: 0, behavior: 'instant' });
            if (running) raf = requestAnimationFrame(tick);
        };
        const start = () => { if (!running) { running = true; prevT = 0; raf = requestAnimationFrame(tick); } };
        const goIndex = (i) => { index = clampI(i); acc = 0; accDir = 0; lockUntil = 0; target = index * vh(); start(); };
        const commit = (dir, now) => {
            acc = 0; accDir = 0; lockDir = dir; lockUntil = now + COOL;
            index = clampI(index + dir); target = index * vh(); start();
        };
        const settle = () => {
            acc = 0; accDir = 0; touchIdx = null;
            index = clampI(Math.round(target / vh()));
            const s = index * vh();
            if (Math.abs(s - target) > 1) { target = s; start(); }
        };
        const schedule = (ms) => { clearTimeout(snapTimer); snapTimer = setTimeout(settle, ms); };

        const onWheel = (e) => {
            if (e.ctrlKey) return;
            e.preventDefault();
            const unit = e.deltaMode === 1 ? 40 : e.deltaMode === 2 ? vh() : 1;
            const d = e.deltaY * unit, abs = Math.abs(d), dir = Math.sign(d);
            const now = performance.now(), gap = now - lastT;
            const decaying = abs < lastAbs * 0.97;
            lastT = now; lastAbs = abs;
            if (!dir) return;
            schedule(SNAP_IDLE);
            if (dir === lockDir) {
                if (now < lockUntil) return;
                if (gap < 90 && (decaying || abs < 20)) return;
            }
            if (dir !== accDir) { acc = 0; accDir = dir; }
            acc += d;
            if (Math.abs(acc) >= THRESH) { commit(dir, now); return; }
            target = clampY(index * vh() + acc);
            start();
        };
        const onKey = (e) => {
            const tag = e.target.tagName;
            if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return;
            if (e.key === ' ' && (tag === 'BUTTON' || tag === 'A')) return;
            const dir = { ArrowDown: 1, PageDown: 1, ArrowUp: -1, PageUp: -1, ' ': e.shiftKey ? -1 : 1 }[e.key];
            if (e.key === 'Home') { e.preventDefault(); goIndex(0); }
            else if (e.key === 'End') { e.preventDefault(); goIndex(last); }
            else if (dir) { e.preventDefault(); goIndex(index + dir); }
        };
        const onTouchStart = () => { touchIdx = nearest(); clearTimeout(snapTimer); };
        const onScroll = () => {
            cancelAnimationFrame(paintRaf);
            paintRaf = requestAnimationFrame(paint);
            if (running) return;
            if (touch && touchIdx !== null) {
                const h = vh(), y = window.scrollY;
                const lo = clampI(touchIdx - 1) * h, hi = clampI(touchIdx + 1) * h;
                if (y < lo) window.scrollTo(0, lo); else if (y > hi) window.scrollTo(0, hi);
            }
            pos = target = window.scrollY;
            schedule(touch ? 140 : SNAP_IDLE);
        };
        const onGo = (e) => goIndex(e.detail);
        const onResize = () => { size(); window.scrollTo(0, index * vh()); pos = target = window.scrollY; paint(); };

        size(); paint();
        if (!touch) window.addEventListener('wheel', onWheel, { passive: false });
        window.addEventListener('touchstart', onTouchStart, { passive: true });
        window.addEventListener('keydown', onKey);
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onResize);
        window.addEventListener('deck-go', onGo);
        return () => {
            cancelAnimationFrame(raf); cancelAnimationFrame(paintRaf); clearTimeout(snapTimer);
            window.removeEventListener('wheel', onWheel);
            window.removeEventListener('touchstart', onTouchStart);
            window.removeEventListener('keydown', onKey);
            window.removeEventListener('scroll', onScroll);
            window.removeEventListener('resize', onResize);
            window.removeEventListener('deck-go', onGo);
        };
    }, [setCurrent]);
}

/* ==========================================================
   COMPONENTS
========================================================== */
const D = (i) => ({ '--d': 220 + i * 90 });

/* "Low-altitude *airspace*" → highlighted word(s) between asterisks */
const H = ({ text }) => text.split('*').map((t, i) => (i % 2 ? <em key={i}>{t}</em> : t));

const SIZE_HINT = {
    'm-tall': 'Portrait · about 1200×1500',
    'm-wide': 'Wide · about 1600×900',
    'm-strip': 'Wide strip · about 1600×700',
    'm-card': 'Landscape · about 1200×800',
    'm-thumb': '',
};

function Slide({ n, current, className = '', children }) {
    const m = META[n];
    return (
        <section
            id={m.id}
            className={`slide slide--${m.theme} ${n % 2 ? 'from-right' : 'from-bottom'} ${className} ${current === n ? 'is-active' : ''}`}
            style={{ '--i': n, visibility: Math.abs(current - n) <= 1 ? 'visible' : 'hidden' }}
            aria-hidden={current !== n}
        >
            {children}
        </section>
    );
}

/* Drawn sample picture (works offline). Used automatically if an image URL fails to load */
const sampleArt = (label) => {
    const t = String(label || 'Perlis Airspace Sandbox').replace(/[<>&"]/g, '');
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 900" preserveAspectRatio="xMidYMid slice">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0b1a28"/><stop offset="1" stop-color="#1d4160"/></linearGradient></defs>
<rect width="1200" height="900" fill="url(#g)"/>
<g stroke="#ffffff" stroke-opacity=".07">${Array.from({ length: 13 }, (_, i) => `<path d="M${i * 100} 0V900M0 ${i * 75}H1200"/>`).join('')}</g>
<path d="M-50 760L420 520 1250 330V430L500 640 -50 900Z" fill="#ffc61a" fill-opacity=".9"/>
<g fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" transform="translate(600 330)"><path d="M-70-70L70 70M70-70L-70 70"/><circle r="22" fill="#ffc61a" stroke="none"/><circle cx="-80" cy="-80" r="34"/><circle cx="80" cy="-80" r="34"/><circle cx="-80" cy="80" r="34"/><circle cx="80" cy="80" r="34"/></g>
<text x="60" y="820" fill="#fff" font-family="Arial Narrow,Arial,sans-serif" font-size="54" font-weight="700" letter-spacing="2">${t.toUpperCase()}</text>
</svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

/* Image slot: reads images[id] from homeData.js.
   src empty  → labelled placeholder (on purpose)
   src broken → drawn sample picture, so the layout never looks empty */
function Media({ id, size }) {
    const img = images[id] || {};
    const [failed, setFailed] = useState(false);
    const src = failed ? sampleArt(img.alt) : img.src;
    return (
        <figure className={`media ${size}`}>
            {src ? (
                <img src={src} alt={img.alt || ''} loading="lazy" onError={() => { if (!failed) setFailed(true); }} />
            ) : (
                <figcaption className="media-ph">
                    <span className="media-tag">IMAGE</span>
                    <strong>{img.alt}</strong>
                    <span>{SIZE_HINT[size]}</span>
                </figcaption>
            )}
        </figure>
    );
}

/* Section label from the sitemap, e.g. "02 / What is the sandbox?" */
const Eyebrow = ({ n }) => (
    <div className="eyebrow rv" style={D(0)}>
        <b>{String(n + 1).padStart(2, '0')}</b><i /> <span>{META[n].label}</span>
    </div>
);

const ApplyBtn = ({ label, ink }) => (
    <button className={`btn ${ink ? 'btn--ink' : ''}`} onClick={() => go(APPLY_INDEX)}>{label}</button>
);

/* ==========================================================
   PAGE
========================================================== */
export default function Home() {
    const [current, setCurrent] = useState(0);
    const [sent, setSent] = useState(false);
    useDeck(setCurrent);

    const theme = META[current].theme;
    const tone = theme === 'light' || theme === 'yellow' ? 'on-light' : 'on-dark';

    return (
        <>
            <div className="rail" data-tone={tone} style={{ '--last': COUNT - 1 }} aria-hidden="true"><span /></div>

            <main className="deck">
                {/* video sits behind the banner */}
                <div className="hero-bg" style={{ visibility: current > 1 ? 'hidden' : 'visible' }} aria-hidden="true">
                    <video autoPlay muted loop playsInline preload="auto"><source src={videobg} type="video/mp4" /></video>
                    <div className="hero-shade" />
                </div>

                {/* 01 — Main banner and slogan */}
                <Slide n={0} current={current} className="slide--end">
                    <p className="slogan rv" style={D(0)}>{hero.slogan}</p>
                    <h1 className="rv" style={D(1)}><H text={hero.title} /></h1>
                    <p className="lede rv" style={D(2)}>{hero.lede}</p>
                    <div className="btns rv" style={D(3)}>
                        <ApplyBtn label={hero.primaryCta} />
                        <button className="btn btn--ghost" onClick={() => go(APPLY_INDEX)}>{hero.secondaryCta}</button>
                    </div>
                    <div className="proof rv" style={D(4)}>
                        {hero.proof.map((p) => (<div key={p.label}><strong>{p.value}</strong><span>{p.label}</span></div>))}
                    </div>
                </Slide>

                {/* 02 — What is the sandbox? */}
                <Slide n={1} current={current}>
                    <Eyebrow n={1} />
                    <div className="split split--media">
                        <div>
                            <h2 className="h rv" style={D(0)}><H text={about.title} /></h2>
                            {about.rows.map(([k, v], i) => (
                                <div className="row rv" style={D(i + 1)} key={k}><span className="muted">{k}</span><p>{v}</p></div>
                            ))}
                        </div>
                        <div className="rv" style={D(2)}><Media id="about" size="m-tall" /></div>
                    </div>
                </Slide>

                {/* 03 — Why it matters */}
                <Slide n={2} current={current}>
                    <Eyebrow n={2} />
                    <div className="split split--media">
                        <div>
                            <p className="muted rv" style={D(0)}>{why.kicker}</p>
                            <h2 className="h rv" style={D(1)}><H text={why.title} /></h2>
                            <div style={{ marginTop: 14 }}>
                                {why.gaps.map(([t, s], i) => (
                                    <div className="item rv" style={D(i + 2)} key={t}><h4>{t}</h4><p>{s}</p></div>
                                ))}
                            </div>
                        </div>
                        <div className="rv" style={D(3)}><Media id="why" size="m-wide" /></div>
                    </div>
                    <div className="facts facts--3 rv" style={D(5)}>
                        {why.market.map((f) => (<div className="fact" key={f.value}><strong>{f.value}</strong><span>{f.label}</span></div>))}
                    </div>
                    <p className="source rv" style={D(6)}>{why.source}</p>
                </Slide>

                {/* 04 — Who should participate? */}
                <Slide n={3} current={current}>
                    <Eyebrow n={3} />
                    <div className="split split--media-left">
                        <div className="rv" style={D(1)}><Media id="who" size="m-tall" /></div>
                        <div>
                            <h2 className="h rv" style={D(0)}><H text={who.title} /></h2>
                            <div style={{ marginTop: 12 }}>
                                {who.items.map(([t, s], i) => (
                                    <div className="row row--tight rv" style={D(i + 1)} key={t}><h4>{t}</h4><p>{s}</p></div>
                                ))}
                            </div>
                            <div className="chips rv" style={{ ...D(7), marginTop: 14 }}>
                                {who.ways.map((w) => <span key={w}>{w}</span>)}
                            </div>
                        </div>
                    </div>
                </Slide>

                {/* 05 — Featured testing programmes and opportunities */}
                <Slide n={4} current={current}>
                    <Eyebrow n={4} />
                    <div className="head-row">
                        <h2 className="h rv" style={D(0)}><H text={programmes.title} /></h2>
                        <div className="rv" style={D(1)}><ApplyBtn label={programmes.cta} /></div>
                    </div>
                    <div className="cols cols-4">
                        {programmes.items.map((p, i) => (
                            <div className="card rv" style={D(i + 1)} key={p.title}>
                                <Media id={p.img} size="m-card" />
                                <div className="card-body">
                                    <span className="card-n">{p.n}</span>
                                    <h4>{p.title}</h4>
                                    <p>{p.text}</p>
                                    <span className="tag">{p.tag}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </Slide>

                {/* 06 — Latest news and project progress */}
                <Slide n={5} current={current}>
                    <Eyebrow n={5} />
                    <h2 className="h rv" style={D(0)}><H text={news.title} /></h2>
                    <div className="split split--news">
                        <div className="news-list">
                            <h3 className="sub rv" style={D(1)}>{news.newsLabel}</h3>
                            {news.items.map((n, i) => (
                                <div className="news-item rv" style={D(i + 2)} key={i}>
                                    <Media id={n.img} size="m-thumb" />
                                    <div><span className="muted">{n.date}</span><h4>{n.title}</h4><p className="muted">{n.text}</p></div>
                                </div>
                            ))}
                        </div>
                        <div className="rv" style={D(3)}>
                            <h3 className="sub">{news.progressLabel}</h3>
                            <div className="tl">
                                {news.phases.map((p) => (
                                    <div key={p.title} className={p.now ? 'is-now' : ''}>
                                        <span className="muted">{p.period}</span>
                                        <h4>{p.title}</h4>
                                        <p className="tl-name">{p.name}</p>
                                        <p>{p.text}</p>
                                        {p.now && <span className="tag">{news.currentLabel}</span>}
                                    </div>
                                ))}
                            </div>
                            <div style={{ marginTop: 18 }}><Media id="progress" size="m-strip" /></div>
                        </div>
                    </div>
                </Slide>

                {/* 07 — Upcoming events */}
                <Slide n={6} current={current}>
                    <Eyebrow n={6} />
                    <div className="split split--media-left">
                        <div className="rv" style={D(1)}><Media id="events" size="m-tall" /></div>
                        <div>
                            <h2 className="h rv" style={D(0)}><H text={events.title} /></h2>
                            <div className="ev-list" style={{ marginTop: 16 }}>
                                {events.items.map((e, i) => (
                                    <div className="ev rv" style={D(i + 1)} key={i}>
                                        <Media id={e.img} size="m-thumb" />
                                        <div><span className="ev-date">{e.date}</span><h4>{e.title}</h4><p className="muted">{e.where}</p></div>
                                        <span className="tag">{e.type}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </Slide>

                {/* 08 — Partners and collaborators preview */}
                <Slide n={7} current={current}>
                    <Eyebrow n={7} />
                    <h2 className="h rv" style={D(0)}><H text={partners.title} /></h2>
                    <p className="lede rv" style={D(1)}>{partners.lede}</p>
                    {partners.groups.map((g, gi) => (
                        <div className="rv" style={D(gi + 2)} key={g.group}>
                            <h3 className="sub">{g.group}</h3>
                            <div className="logos">
                                {g.items.map((p) => (
                                    <div className="logo" key={p.name} title={p.name}>
                                        {p.logo ? <img src={p.logo} alt={p.name} loading="lazy" /> : <span>{p.name}</span>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </Slide>

                {/* 09 — Apply to Participate / Subscribe for Updates */}
                <Slide n={8} current={current}>
                    <Eyebrow n={8} />
                    <div className="split split--media">
                        <div>
                            <h2 className="h rv" style={D(0)}><H text={apply.title} /></h2>
                            <div className="steps rv" style={D(1)}>
                                {apply.steps.map((t, i) => (<div key={t}><strong>{i + 1}</strong><span>{t}</span></div>))}
                            </div>
                            <div className="rv" style={{ ...D(2), marginTop: 20 }}>
                                <button className="btn btn--ink" onClick={() => { if (apply.applyHref) window.location.href = apply.applyHref; }}>{apply.applyLabel}</button>
                            </div>
                            <div style={{ marginTop: 34 }}>
                                <h3 className="sub rv" style={D(3)}>{apply.subscribeLabel}</h3>
                                <p className="lede rv" style={D(3)}>{apply.subscribeText}</p>
                                <form className="news-form rv" style={D(4)} onSubmit={(e) => { e.preventDefault(); /* TODO: connect to newsletter endpoint */ setSent(true); }}>
                                    <input type="email" placeholder={apply.emailPlaceholder} aria-label={apply.emailPlaceholder} required />
                                    <button type="submit">{apply.subscribeButton}</button>
                                </form>
                                {sent && <p className="thanks">{apply.thanks}</p>}
                            </div>
                        </div>
                        <div className="rv" style={D(2)}><Media id="apply" size="m-tall" /></div>
                    </div>
                </Slide>
            </main>

            {/* empty scroll space: COUNT × 100vh (sized in useDeck) */}
            <div className="spacer" aria-hidden="true" />
        </>
    );
}

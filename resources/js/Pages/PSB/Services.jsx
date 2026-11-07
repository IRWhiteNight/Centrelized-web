import { useEffect, useRef, useState } from 'react';
import { Head } from '@inertiajs/react';

/* Self-contained: this page no longer depends on home.css or the deck engine (useDeck). */
import '../../../css/PSB-css/psb-services.css';

/* All text, links and images live in servicesData.js. Edit that file, not this one. */
import {
    services, hero, overview, labels, apply, pageImages, placeholders, placeholderImage,
} from '../../data/PSB-data/servicesData';

const pad = (n) => String(n).padStart(2, '0');
const totalActivities = services.reduce((sum, s) => sum + s.activities.length, 0);

/* "Ten ways we *support your testing*" → words between asterisks get the gradient */
const H = ({ text }) => text.split('*').map((t, i) => (i % 2 ? <em key={i}>{t}</em> : t));

/* Vector fallback: always sharp at any size, used if a photo fails to load */
const sampleArt = (label) => {
    const t = String(label || 'Perlis Airspace Sandbox').replace(/[<>&"]/g, '');
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0b1a28"/><stop offset="1" stop-color="#1d4160"/></linearGradient></defs>
<rect width="1600" height="1000" fill="url(#g)"/>
<path d="M-50 860L560 600 1650 380V500L660 740 -50 1000Z" fill="#ffc61a" fill-opacity=".9"/>
<g fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" transform="translate(800 380)"><path d="M-80-80L80 80M80-80L-80 80"/><circle r="24" fill="#ffc61a" stroke="none"/><circle cx="-92" cy="-92" r="38"/><circle cx="92" cy="-92" r="38"/><circle cx="-92" cy="92" r="38"/><circle cx="92" cy="92" r="38"/></g>
<text x="70" y="930" fill="#fff" font-family="Arial Narrow,Arial,sans-serif" font-size="60" font-weight="700" letter-spacing="2">${t.toUpperCase()}</text>
</svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

/* Image slot. src set → your image · empty → sample photo (or labelled box) · fails → vector art.
   Photos are requested at 1600×1000 and never scaled up, so they stay sharp. */
function Pic({ img = {}, seed, className = '', priority = false }) {
    const [failed, setFailed] = useState(false);
    const alt = img.alt || '';
    const photo = img.src || (placeholders.mode === 'photo' ? placeholderImage(seed, 1600, 1000) : '');
    const src = failed ? sampleArt(alt) : photo;
    return (
        <figure className={`sx-pic ${className}`}>
            {src ? (
                <img
                    src={src} alt={alt} decoding="async"
                    loading={priority ? 'eager' : 'lazy'} fetchpriority={priority ? 'high' : 'auto'}
                    onError={() => { if (!failed) setFailed(true); }}
                />
            ) : (
                <figcaption className="sx-ph"><span>Image</span><strong>{alt}</strong></figcaption>
            )}
        </figure>
    );
}

const FlightPath = ({ animate }) => (
    <svg className="sx-flight" viewBox="0 0 1200 500" preserveAspectRatio="xMaxYMax slice" aria-hidden="true">
        <defs>
            <linearGradient id="sxg" x1="0" x2="1">
                <stop offset="0" stopColor="#ffc61a" stopOpacity="0" />
                <stop offset=".5" stopColor="#ffc61a" />
                <stop offset="1" stopColor="#ff8a1f" />
            </linearGradient>
        </defs>
        <path id="sx-route" className="sx-route" d="M-20 430C200 430 260 120 520 165S820 390 1000 225 1180 60 1240 90" fill="none" stroke="url(#sxg)" strokeWidth="2.5" />
        {[[520, 165], [1000, 225]].map(([x, y]) => (
            <g key={x} transform={`translate(${x} ${y})`}><circle r="16" className="sx-ping" /><circle r="5" fill="#ffc61a" /></g>
        ))}
        <g>
            <g stroke="#fff" strokeWidth="2.5" strokeLinecap="round" fill="none">
                <path d="M-12-12L12 12M12-12L-12 12" /><circle cx="-13" cy="-13" r="5" /><circle cx="13" cy="-13" r="5" />
                <circle cx="-13" cy="13" r="5" /><circle cx="13" cy="13" r="5" />
            </g>
            <circle r="4.5" fill="#ffc61a" />
            {animate && <animateMotion dur="16s" repeatCount="indefinite" rotate="auto"><mpath href="#sx-route" /></animateMotion>}
        </g>
    </svg>
);

/* ==========================================================
   PAGE
========================================================== */
export default function Services() {
    const [active, setActive] = useState(0);
    const [reduced, setReduced] = useState(false);
    const listRef = useRef(null);
    const railRef = useRef(null);

    useEffect(() => {
        const rm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        setReduced(rm);
        const els = [...document.querySelectorAll('.sx-svc')];

        /* reveal each service once, when it scrolls into view */
        const seenIO = new IntersectionObserver((es) => es.forEach((e) => {
            if (e.isIntersecting) { e.target.classList.add('is-seen'); seenIO.unobserve(e.target); }
        }), { threshold: 0.12 });

        /* which service is in the middle of the screen */
        const actIO = new IntersectionObserver((es) => es.forEach((e) => {
            if (e.isIntersecting) setActive(Number(e.target.dataset.i));
        }), { rootMargin: '-42% 0px -50% 0px' });

        els.forEach((el) => { if (rm) el.classList.add('is-seen'); else seenIO.observe(el); actIO.observe(el); });

        /* progress line along the side rail */
        let raf = 0;
        const onScroll = () => {
            cancelAnimationFrame(raf);
            raf = requestAnimationFrame(() => {
                if (!listRef.current || !railRef.current) return;
                const r = listRef.current.getBoundingClientRect();
                const p = Math.min(1, Math.max(0, (window.innerHeight * 0.5 - r.top) / r.height));
                railRef.current.style.setProperty('--p', p.toFixed(4));
            });
        };
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll);
        return () => {
            seenIO.disconnect(); actIO.disconnect(); cancelAnimationFrame(raf);
            window.removeEventListener('scroll', onScroll);
            window.removeEventListener('resize', onScroll);
        };
    }, []);

    const go = (id) => document.getElementById(id)?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });

    return (
        <div className="sx">
            <Head title="Services" />

            {/* ---------- HERO ---------- */}
            <header className="sx-hero">
                <div className="sx-hero-bg"><Pic img={pageImages.background} seed="services-banner" priority /></div>
                <i className="sx-blob sx-blob--a" /><i className="sx-blob sx-blob--b" />
                <FlightPath animate={!reduced} />

                <div className="sx-hero-copy">
                    <p className="sx-pill sx-in" style={{ '--d': 0 }}><b />{hero.slogan}</p>
                    <h1 className="sx-in" style={{ '--d': 1 }}><H text={hero.title} /></h1>
                    <p className="sx-lede sx-in" style={{ '--d': 2 }}>{hero.lede}</p>
                    <div className="sx-btns sx-in" style={{ '--d': 3 }}>
                        <button className="sx-btn" onClick={() => go('sx-list')}>{hero.primaryCta}</button>
                        <a className="sx-btn sx-btn--ghost" href={apply.href}>{hero.secondaryCta}</a>
                    </div>
                </div>

                <div className="sx-hero-foot sx-in" style={{ '--d': 4 }}>
                    <dl className="sx-stats">
                        <div><dt>{pad(services.length)}</dt><dd>Support services</dd></div>
                        <div><dt>{totalActivities}</dt><dd>Supported activities</dd></div>
                    </dl>
                    <div className="sx-strip">
                        {pageImages.strip.map((img, i) => <Pic key={i} img={img} seed={`services-strip-${i}`} />)}
                    </div>
                </div>
            </header>

            {/* ---------- RIBBON ---------- */}
            <div className="sx-marq" aria-hidden="true">
                <div className="sx-marq-track">
                    {[...services, ...services].map((s, i) => <span key={i}>{s.title}</span>)}
                </div>
            </div>

            {/* ---------- SERVICES ---------- */}
            <main className="sx-main" id="sx-list">
                <nav className="sx-rail" ref={railRef} aria-label="Services">
                    <p className="sx-rail-t">{overview.title.replace(/\*/g, '')}</p>
                    <ol>
                        <span className="sx-line" aria-hidden="true"><i /></span>
                        {services.map((s, i) => (
                            <li key={s.id}>
                                <button className={active === i ? 'is-on' : ''} onClick={() => go(s.id)} aria-current={active === i ? 'true' : undefined}>
                                    <span className="sx-dot" /><span className="sx-rt">{s.title}</span>
                                </button>
                            </li>
                        ))}
                    </ol>
                </nav>

                <div className="sx-list" ref={listRef}>
                    <p className="sx-intro">{overview.lede}</p>

                    {services.map((s, i) => (
                        <article id={s.id} data-i={i} key={s.id} className={`sx-svc ${i % 2 ? 'is-flip' : ''} ${active === i ? 'is-active' : ''}`}>
                            <div className="sx-gal">
                                <Pic img={s.images[0]} seed={`${s.id}-0`} />
                                <Pic img={s.images[1]} seed={`${s.id}-1`} />
                                <Pic img={s.images[2]} seed={`${s.id}-2`} />
                                <span className="sx-big" aria-hidden="true">{pad(i + 1)}</span>
                            </div>

                            <div className="sx-body">
                                <p className="sx-kick">{labels.serviceOf} {i + 1} of {services.length}</p>
                                <h2>{s.title}</h2>
                                <p className="sx-sum">{s.summary}</p>
                                <h3>{labels.includes} <small>{s.activities.length} {labels.activities}</small></h3>
                                <ul>
                                    {s.activities.map((a, ai) => (
                                        <li key={a.name} style={{ '--k': ai }}>
                                            <strong>{a.name}</strong>
                                            <span>{a.detail}</span>
                                        </li>
                                    ))}
                                </ul>
                                {i < services.length - 1 && (
                                    <button className="sx-next" onClick={() => go(services[i + 1].id)}>
                                        Next: {services[i + 1].title}
                                    </button>
                                )}
                            </div>
                        </article>
                    ))}
                </div>
            </main>

            {/* ---------- APPLY ---------- */}
            <section className="sx-end">
                <i className="sx-blob sx-blob--c" />
                <div className="sx-end-in">
                    <div>
                        <h2><H text={apply.title} /></h2>
                        <p className="sx-lede">{apply.lede}</p>
                        <ol className="sx-steps">
                            {apply.steps.map((t, i) => (<li key={t}><b>{i + 1}</b><span>{t}</span></li>))}
                        </ol>
                        <a className="sx-btn" href={apply.href}>{apply.buttonLabel}</a>
                    </div>
                    <Pic img={pageImages.apply} seed="services-apply" className="sx-end-pic" />
                </div>
            </section>
        </div>
    );
}

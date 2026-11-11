import { useCallback, useEffect, useRef, useState } from 'react';
import { Head } from '@inertiajs/react';

/* Standalone stylesheet. Every class starts with sx-, nothing leaks to other pages. */
import '../../../css/PSB-css/psb-services.css';

/* All text, links and images live in servicesData.js. Edit that file, not this one. */
import {
    services, hero, overview, labels, apply, pageImages, placeholders, placeholderImage,
} from '../../data/PSB-data/servicesData';

const pad = (n) => String(n).padStart(2, '0');
const D = (i) => ({ '--d': i * 90 });
const totalActivities = services.reduce((sum, s) => sum + s.activities.length, 0);
const reduced = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* "Ten ways we *support your testing*": words between asterisks get the highlight */
const H = ({ text }) => text.split('*').map((t, i) => (i % 2 ? <em key={i}>{t}</em> : t));

/* Vector fallback (black / yellow / white), always sharp, used if a photo fails to load */
const sampleArt = (label) => {
    const t = String(label || 'Perlis Airspace Sandbox').replace(/[<>&"]/g, '');
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice">
<rect width="1600" height="1000" fill="#111"/>
<path d="M-50 860L560 600 1650 380V500L660 740 -50 1000Z" fill="#ffd400"/>
<g fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" transform="translate(800 380)"><path d="M-80-80L80 80M80-80L-80 80"/><circle r="24" fill="#ffd400" stroke="none"/><circle cx="-92" cy="-92" r="38"/><circle cx="92" cy="-92" r="38"/><circle cx="-92" cy="92" r="38"/><circle cx="92" cy="92" r="38"/></g>
<text x="70" y="930" fill="#fff" font-family="Arial,sans-serif" font-size="60" font-weight="700" letter-spacing="2">${t.toUpperCase()}</text>
</svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

/* Image slot. src set: your image. Empty: sample photo (or labelled box). Fails: vector art. */
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

const Arrow = () => (
    <svg className="sx-arrow" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
        <path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

/* ==========================================================================
   PAGE
========================================================================== */
export default function Services() {
    const rootRef = useRef(null);
    const [active, setActive] = useState(0);
    const [showFab, setShowFab] = useState(false);

    /* reveal on scroll */
    useEffect(() => {
        const nodes = rootRef.current.querySelectorAll('.sx-rv');
        if (reduced() || !('IntersectionObserver' in window)) {
            nodes.forEach((n) => n.classList.add('in'));
            return undefined;
        }
        const io = new IntersectionObserver((entries) => {
            entries.forEach((e) => {
                if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -5% 0px' });
        nodes.forEach((n) => io.observe(n));
        return () => io.disconnect();
    }, []);

    /* scroll: progress bar, hero parallax, active service, floating button */
    useEffect(() => {
        const root = rootRef.current;
        const heroEl = root.querySelector('.sx-hero');
        let raf = 0;
        const update = () => {
            raf = 0;
            const y = window.scrollY;
            const h = root.scrollHeight - window.innerHeight;
            if (y < 1100 && heroEl) heroEl.style.setProperty('--sy', `${y}`);
            root.style.setProperty('--progress', h > 0 ? Math.min(1, Math.max(0, y / h)).toFixed(4) : 0);
            setShowFab(y > 720 && y < h - 700);
            const line = window.innerHeight * 0.4;
            let cur = 0;
            services.forEach((s, i) => {
                const el = document.getElementById(s.id);
                if (el && el.getBoundingClientRect().top <= line) cur = i;
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
        const a = rootRef.current.querySelector('.sx-subnav button.is-active');
        const box = rootRef.current.querySelector('.sx-subnav-scroll');
        if (a && box) box.scrollTo({ left: a.offsetLeft - box.clientWidth / 2 + a.clientWidth / 2, behavior: 'smooth' });
    }, [active]);

    const go = useCallback((id) => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'start' });
    }, []);

    /* pointer effects: magnetic buttons + hero glow */
    const onMove = useCallback((e) => {
        const t = e.target;
        if (!t.closest || reduced()) return;
        const mag = t.closest('.sx-mag');
        if (mag) {
            const r = mag.getBoundingClientRect();
            mag.style.setProperty('--tx', `${((e.clientX - (r.left + r.width / 2)) * 0.22).toFixed(1)}px`);
            mag.style.setProperty('--ty', `${((e.clientY - (r.top + r.height / 2)) * 0.3).toFixed(1)}px`);
        }
        const h = t.closest('.sx-hero');
        if (h) {
            const r = h.getBoundingClientRect();
            h.style.setProperty('--hx', `${e.clientX - r.left}px`);
            h.style.setProperty('--hy', `${e.clientY - r.top}px`);
        }
    }, []);

    const onOut = useCallback((e) => {
        const t = e.target.closest && e.target.closest('.sx-mag');
        if (t && !t.contains(e.relatedTarget)) ['--tx', '--ty'].forEach((p) => t.style.removeProperty(p));
    }, []);

    return (
        <div className="sx" ref={rootRef} onMouseMove={onMove} onMouseOut={onOut}>
            <Head title="Services" />

            {/* ===================== HERO ===================== */}
            <header className="sx-hero" id="top">
                <div className="sx-hero-media" aria-hidden="true"><Pic img={pageImages.background} seed="services-banner" priority /></div>
                <div className="sx-grid" aria-hidden="true" />
                <div className="sx-glow" aria-hidden="true" />

                <div className="sx-wrap sx-hero-copy">
                    <p className="sx-eyebrow"><i />{hero.slogan}</p>
                    <h1 className="sx-title sx-in" style={{ '--i': 1 }}><H text={hero.title} /></h1>
                    <p className="sx-hero-lede sx-in" style={{ '--i': 2 }}>{hero.lede}</p>
                    <div className="sx-hero-cta sx-in" style={{ '--i': 3 }}>
                        <button className="sx-btn sx-mag" onClick={() => go('sx-list')}>{hero.primaryCta}<Arrow /></button>
                        <a className="sx-btn sx-btn--ghost sx-mag" href={apply.href}>{hero.secondaryCta}<Arrow /></a>
                    </div>
                </div>

                <div className="sx-wrap sx-glance sx-in" style={{ '--i': 4 }}>
                    <div className="sx-glance-bar"><span>At a glance</span></div>
                    <div className="sx-glance-grid">
                        <div className="sx-gl">
                            <strong>{pad(services.length)}</strong>
                            <span className="sx-gl-label">Support services</span>
                        </div>
                        <div className="sx-gl">
                            <strong>{totalActivities}</strong>
                            <span className="sx-gl-label">Supported activities</span>
                        </div>
                        <div className="sx-strip">
                            {pageImages.strip.map((img, i) => <Pic key={i} img={img} seed={`services-strip-${i}`} />)}
                        </div>
                    </div>
                </div>
            </header>

            {/* ===================== STICKY MENU ===================== */}
            <nav className="sx-subnav" aria-label="Services">
                <div className="sx-wrap sx-subnav-scroll">
                    <ul>
                        {services.map((s, i) => (
                            <li key={s.id}>
                                <button
                                    className={active === i ? 'is-active' : ''}
                                    aria-current={active === i ? 'true' : undefined}
                                    onClick={() => go(s.id)}
                                >{s.title}</button>
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="sx-progress" aria-hidden="true"><span /></div>
            </nav>

            {/* ===================== TICKER ===================== */}
            <div className="sx-ticker" aria-hidden="true">
                <div className="sx-ticker-track">
                    {[0, 1].map((k) => (
                        <ul key={k}>{services.map((s) => <li key={s.id + k}>{s.title}</li>)}</ul>
                    ))}
                </div>
            </div>

            {/* ===================== INTRO ===================== */}
            <section className="sx-sec sx-light sx-intro" id="sx-list">
                <div className="sx-wrap">
                    <header className="sx-head">
                        <p className="sx-kicker sx-rv"><span>{pad(services.length)}</span>{labels.includes}</p>
                        <h2 className="sx-h sx-rv" style={D(1)}><H text={overview.title} /></h2>
                        <p className="sx-lede sx-rv" style={D(2)}>{overview.lede}</p>
                    </header>
                </div>
            </section>

            {/* ===================== SERVICES (alternating black / white) ===================== */}
            {services.map((s, i) => (
                <section
                    id={s.id}
                    key={s.id}
                    className={`sx-sec sx-svc ${i % 2 ? 'sx-light' : 'sx-dark'} ${i % 2 ? '' : 'sx-graphite'}`}
                >
                    <div className="sx-wrap">
                        <header className="sx-head">
                            <p className="sx-kicker sx-rv"><span>{pad(i + 1)}</span>{labels.serviceOf} {i + 1} of {services.length}</p>
                            <h2 className="sx-h sx-rv" style={D(1)}>{s.title}</h2>
                            <p className="sx-lede sx-rv" style={D(2)}>{s.summary}</p>
                        </header>

                        <div className={`sx-svc-grid ${i % 2 ? '' : 'is-flip'}`}>
                            <div className="sx-gal sx-rv">
                                <Pic img={s.images[0]} seed={`${s.id}-0`} />
                                <Pic img={s.images[1]} seed={`${s.id}-1`} />
                                <Pic img={s.images[2]} seed={`${s.id}-2`} />
                                <span className="sx-big" aria-hidden="true">{pad(i + 1)}</span>
                            </div>

                            <div className="sx-acts-wrap">
                                <h3 className="sx-sub sx-rv">
                                    {labels.includes} <small>{s.activities.length} {labels.activities}</small>
                                </h3>
                                <ul className="sx-acts">
                                    {s.activities.map((a, ai) => (
                                        <li className="sx-act sx-rv" style={{ '--d': ai * 55 }} key={a.name}>
                                            <span className="sx-act-n">{pad(ai + 1)}</span>
                                            <strong>{a.name}</strong>
                                            <span className="sx-act-d">{a.detail}</span>
                                        </li>
                                    ))}
                                </ul>
                                {i < services.length - 1 && (
                                    <button className="sx-link sx-next" onClick={() => go(services[i + 1].id)}>
                                        Next: {services[i + 1].title}<Arrow />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </section>
            ))}

            {/* ===================== APPLY ===================== */}
            <section className="sx-sec sx-dark sx-cta" id="apply">
                <div className="sx-wrap sx-cta-in">
                    <div className="sx-cta-copy">
                        <h2 className="sx-h sx-rv"><H text={apply.title} /></h2>
                        <p className="sx-lede sx-rv" style={D(1)}>{apply.lede}</p>
                        <ol className="sx-steps sx-rv" style={D(2)}>
                            {apply.steps.map((t, i) => (<li key={t}><b>{i + 1}</b><span>{t}</span></li>))}
                        </ol>
                        <a className="sx-btn sx-mag sx-rv" style={D(3)} href={apply.href}>{apply.buttonLabel}<Arrow /></a>
                    </div>
                    <Pic img={pageImages.apply} seed="services-apply" className="sx-cta-pic" />
                </div>
            </section>

            {/* floating apply button, appears after the hero */}
            <div className={`sx-fab ${showFab ? 'is-on' : ''}`}>
                <a className="sx-btn sx-btn--sm" href={apply.href} tabIndex={showFab ? 0 : -1}>{apply.buttonLabel}<Arrow /></a>
            </div>
        </div>
    );
}

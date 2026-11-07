import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import '../../../css/PSB-css/psb-FAQ.css';

import { routes, page, hero, categories, cta } from '../../data/PSB-data/faqData';

/* ==========================================================
   MOTION HELPERS
   W    words rise out of a mask when their block scrolls into view
   Rv   scroll-reveal wrapper (data-rv is picked up by useReveal)
========================================================== */

const words = (str, o, d, s) => str.split(' ').map((w, i) => (
    <span key={i}><span className="faq-w"><span className="faq-wi" style={{ '--wd': d + (o + i) * s }}>{w}</span></span>{' '}</span>
));

function W({ t, em, d = 0, s = 40 }) {
    const n = t ? t.split(' ').length : 0;
    return <>{t && words(t, 0, d, s)}{em && <em>{words(em, n, d, s)}</em>}</>;
}

function Rv({ as: T = 'div', className = '', d = 0, text = false, style, children, ...rest }) {
    return (
        <T data-rv className={`faq-rv${text ? ' faq-t' : ''} ${className}`} style={{ '--d': d, ...style }} {...rest}>
            {children}
        </T>
    );
}

function Pic({ src, alt, d = 0 }) {
    const [bad, setBad] = useState(!src);
    return (
        <figure data-rv className="faq-rv faq-pic" style={{ '--d': d }}>
            {bad
                ? <div className="faq-ph"><span>{alt}</span></div>
                : <img src={src} alt={alt} loading="lazy" onError={() => setBad(true)} />}
        </figure>
    );
}

const reduced = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* adds .is-in to every not-yet-revealed [data-rv] when it enters the viewport; re-runs when the list changes */
function useReveal(dep) {
    useEffect(() => {
        const els = [...document.querySelectorAll('.faq [data-rv]:not(.is-in)')];
        if (reduced()) { els.forEach((e) => e.classList.add('is-in')); return undefined; }
        const io = new IntersectionObserver((list) => list.forEach((e) => {
            if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
        }), { threshold: 0.15, rootMargin: '0px 0px -6% 0px' });
        els.forEach((e) => io.observe(e));
        return () => io.disconnect();
    }, [dep]);
}

/* ==========================================================
   SEARCH HELPERS
========================================================== */

const haystack = (it) => `${it.q} ${it.a} ${(it.list || []).join(' ')}`.toLowerCase();
const matches = (it, q) => !q || haystack(it).includes(q.toLowerCase());

function hl(text, q) {
    if (!q) return text;
    const re = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'ig');
    return text.split(re).map((part, i) => (i % 2 ? <mark key={i}>{part}</mark> : part));
}

/* ==========================================================
   FAQ ITEM
========================================================== */

function Item({ item, n, i, open, query, onToggle, copied, onCopy }) {
    return (
        <li className={`faq-item faq-in${open ? ' is-open' : ''}`} id={item.id} style={{ '--i': i }}>
            <h3>
                <button type="button" aria-expanded={open} aria-controls={`${item.id}-panel`} onClick={() => onToggle(item.id)}>
                    <span className="faq-num">{String(n).padStart(2, '0')}</span>
                    <span className="faq-q">{hl(item.q, query)}</span>
                    <i aria-hidden="true" />
                </button>
            </h3>
            <div className="faq-panel" id={`${item.id}-panel`} role="region" aria-label={item.q} aria-hidden={!open}>
                <div>
                    <div className="faq-ans">
                        {item.tbc && <span className="faq-tbc">To be confirmed</span>}
                        <p>{hl(item.a, query)}</p>
                        {item.list && <ul>{item.list.map((x) => <li key={x}>{hl(x, query)}</li>)}</ul>}
                        <div className="faq-actions">
                            {(item.links || []).map((l) => <a key={l.href} href={l.href} className="faq-link">{l.label} →</a>)}
                            <button type="button" className="faq-copy" onClick={() => onCopy(item.id)}>{copied ? 'Link copied' : 'Copy link'}</button>
                        </div>
                    </div>
                </div>
            </div>
        </li>
    );
}

/* ==========================================================
   PAGE
========================================================== */

export default function FAQ() {
    const [query, setQuery] = useState('');
    const [cat, setCat] = useState('all');
    const [open, setOpen] = useState(() => new Set());
    const [copied, setCopied] = useState('');
    const [solid, setSolid] = useState(false);
    const searchRef = useRef(null);

    const visible = useMemo(() => categories
        .filter((c) => cat === 'all' || c.id === cat)
        .map((c) => ({ ...c, items: c.items.map((it, idx) => ({ ...it, n: idx + 1 })).filter((it) => matches(it, query)) }))
        .filter((c) => c.items.length), [cat, query]);

    const total = categories.reduce((s, c) => s + c.items.length, 0);
    const count = visible.reduce((s, c) => s + c.items.length, 0);
    const visibleIds = visible.flatMap((c) => c.items.map((it) => it.id));
    const allOpen = count > 0 && visibleIds.every((id) => open.has(id));
    const popular = categories.flatMap((c) => c.items).filter((it) => it.popular);

    useReveal(`${cat}|${query}`);

    /* top bar state */
    useEffect(() => {
        const on = () => setSolid(window.scrollY > 80);
        on();
        window.addEventListener('scroll', on, { passive: true });
        return () => window.removeEventListener('scroll', on);
    }, []);

    /* "/" focuses the search box */
    useEffect(() => {
        const key = (e) => {
            if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) {
                e.preventDefault();
                searchRef.current?.focus();
            }
        };
        window.addEventListener('keydown', key);
        return () => window.removeEventListener('keydown', key);
    }, []);

    const scrollToItem = useCallback((id) => {
        setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'center' }), 80);
    }, []);

    const openItem = useCallback((id) => {
        setQuery('');
        setCat('all');
        setOpen(new Set([id]));
        window.history.replaceState(null, '', `#${id}`);
        scrollToItem(id);
    }, [scrollToItem]);

    /* deep link: /faq#how-to-apply opens that question */
    useEffect(() => {
        const id = window.location.hash.slice(1);
        if (id && categories.some((c) => c.items.some((it) => it.id === id))) openItem(id);
    }, [openItem]);

    const onSearch = (value) => {
        setQuery(value);
        const q = value.trim();
        setOpen(q ? new Set(categories.flatMap((c) => c.items).filter((it) => matches(it, q)).map((it) => it.id)) : new Set());
    };

    const toggle = (id) => setOpen((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else { next.add(id); window.history.replaceState(null, '', `#${id}`); }
        return next;
    });

    const toggleAll = () => setOpen(allOpen ? new Set() : new Set(visibleIds));

    const copyLink = (id) => {
        const url = `${window.location.origin}${window.location.pathname}#${id}`;
        navigator.clipboard?.writeText(url);
        setCopied(id);
        setTimeout(() => setCopied(''), 1800);
    };

    const q = query.trim();

    return (
        <div className="faq">
            {/* ---------- top bar ---------- */}
            <header className={`faq-bar${solid ? ' is-solid' : ''}`}>
                <a className="faq-brand" href={routes.home}><i aria-hidden="true" />{page.brand}</a>
                <a className="faq-cta-btn" href={routes.apply}>{page.applyLabel}</a>
            </header>

            {/* ---------- hero ---------- */}
            <section className="faq-hero">
                <div className="faq-glow" aria-hidden="true" />
                <div className="faq-grid" aria-hidden="true" />
                <div className="faq-wrap faq-hero-in">
                    <Rv className="faq-eyebrow" d={100}>{hero.eyebrow} · {total} questions</Rv>
                    <Rv as="h1" className="faq-title" text><W t={hero.title} em={hero.titleEm} d={200} s={70} /></Rv>
                    <Rv as="p" className="faq-lede" text><W t={hero.text} d={800} s={16} /></Rv>

                    <Rv as="form" className="faq-search" d={1200} role="search" onSubmit={(e) => e.preventDefault()}>
                        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" /><path d="M20 20l-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                        <input ref={searchRef} type="search" value={query} onChange={(e) => onSearch(e.target.value)} placeholder={hero.searchPlaceholder} aria-label="Search the FAQ" />
                        {query ? <button type="button" onClick={() => onSearch('')} aria-label="Clear search">×</button> : <kbd aria-hidden="true">/</kbd>}
                    </Rv>

                    <Rv className="faq-pop" d={1400}>
                        <span>{hero.popularLabel}</span>
                        {popular.map((it) => <button type="button" key={it.id} onClick={() => openItem(it.id)}>{it.q}</button>)}
                    </Rv>
                </div>
            </section>

            {/* ---------- category filter ---------- */}
            <div className="faq-filter">
                <div className="faq-wrap faq-filter-in">
                    <div className="faq-chips" role="group" aria-label="Category">
                        <button type="button" className={cat === 'all' ? 'is-active' : ''} aria-pressed={cat === 'all'} onClick={() => setCat('all')}>All <small>{total}</small></button>
                        {categories.map((c) => (
                            <button type="button" key={c.id} className={cat === c.id ? 'is-active' : ''} aria-pressed={cat === c.id} onClick={() => setCat(c.id)}>
                                {c.label} <small>{c.items.length}</small>
                            </button>
                        ))}
                    </div>
                    <button type="button" className="faq-expand" onClick={toggleAll} disabled={!count}>{allOpen ? 'Collapse all' : 'Expand all'}</button>
                </div>
            </div>

            {/* ---------- questions ---------- */}
            <main className="faq-main">
                <div className="faq-wrap">
                    <p className="faq-count" aria-live="polite">
                        {q ? `${count} ${count === 1 ? 'result' : 'results'} for “${q}”` : `${count} questions`}
                    </p>

                    {visible.map((c, ci) => (
                        <section className="faq-cat" key={c.id} aria-labelledby={`cat-${c.id}`}>
                            <aside className="faq-side">
                                <Pic src={c.image} alt={c.label} />
                                <Rv className="faq-catn">{String(categories.findIndex((x) => x.id === c.id) + 1).padStart(2, '0')}</Rv>
                                <Rv as="h2" id={`cat-${c.id}`} className="faq-h" text><W t={c.label} d={100} s={34} /></Rv>
                                <Rv as="p" className="faq-intro" text><W t={c.intro} d={400} s={18} /></Rv>
                            </aside>
                            <ul className="faq-list">
                                {c.items.map((it, i) => (
                                    <Item key={it.id} item={it} n={it.n} i={ci * 2 + i} open={open.has(it.id)} query={q} onToggle={toggle} copied={copied === it.id} onCopy={copyLink} />
                                ))}
                            </ul>
                        </section>
                    ))}

                    {!count && (
                        <div className="faq-empty">
                            <h2>No questions match “{q}”.</h2>
                            <p>Try a different word, or browse by category.</p>
                            <button type="button" onClick={() => { onSearch(''); setCat('all'); }}>Clear search</button>
                        </div>
                    )}
                </div>
            </main>

            {/* ---------- closing call to action ---------- */}
            <footer className="faq-foot">
                <div className="faq-marq" aria-hidden="true"><div>{Array.from({ length: 12 }, (_, i) => <span key={i}>FAQ</span>)}</div></div>
                <div className="faq-wrap">
                    <Rv as="h2" className="faq-h faq-h--xl" text><W t={cta.title} em={cta.titleEm} /></Rv>
                    <Rv as="p" className="faq-footp" text><W t={cta.text} d={300} s={20} /></Rv>
                    <Rv className="faq-foot-btns" d={500}>
                        <a className="faq-btn" href={routes.apply}>{page.applyLabel}</a>
                        <a className="faq-btn faq-btn--ghost" href={routes.media}>Media Centre</a>
                        <a className="faq-btn faq-btn--ghost" href={routes.home}>Back to home</a>
                    </Rv>
                </div>
            </footer>
        </div>
    );
}

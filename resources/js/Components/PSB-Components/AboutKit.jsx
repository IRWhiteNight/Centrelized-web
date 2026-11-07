import { createContext, Fragment, useContext, useEffect, useRef, useState } from 'react';
import '../../../css/PSB-css/psb-about.css';

/* Shared renderer for the About and Innovation pages.
   Images: resources/js/images/<folder>/  (folder = data.base, e.g. 'about/' or 'innovation/'). */
const FILES = import.meta.glob('../images/**/*.{jpg,jpeg,png,webp,avif,svg}', { eager: true, query: '?url', import: 'default' });
const Base = createContext({ base: '', art: false });
/* A file name is looked up in the images folder; a full https:// address is used as it is. */
const url = (f) => (!f ? '' : /^https?:\/\//.test(f) ? f : FILES[`../images/${f}`] || '');
const logoUrl = (name, base) => {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    return ['png', 'svg', 'webp', 'jpg'].map((e) => url(`${base}logos/${slug}.${e}`)).find(Boolean) || '';
};
const filled = (b) => !!(b.items?.length || b.groups?.length || b.file || b.text);

/* ---------- small pieces ---------- */
function Pic({ file, alt, className = '', ratio }) {
    const { base, art } = useContext(Base);
    const [bad, setBad] = useState(false);
    const full = file ? (/^https?:\/\//.test(file) ? file : base + file) : '';
    const u = url(full);
    return (
        <figure className={`pic ${className}`} style={ratio ? { aspectRatio: ratio } : undefined}>
            {u && !bad
                ? <img src={u} alt={alt || ''} loading="lazy" onError={() => setBad(true)} />
                : art
                    ? (
                        <div className="pic-art">
                            <svg viewBox="0 0 160 100" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
                                <g fill="none" stroke="#ffd21f" strokeWidth=".6" opacity=".55">
                                    <circle cx="80" cy="50" r="18" /><circle cx="80" cy="50" r="32" strokeDasharray="2 3" /><circle cx="80" cy="50" r="46" />
                                    <path d="M80 0v100M0 50h160" />
                                    <path d="M8 20V8h12M152 20V8h-12M8 80v12h12M152 80v12h-12" strokeWidth="1.2" opacity="1" />
                                </g>
                            </svg>
                            <span>{alt}</span>
                            <code>{full}</code>
                        </div>
                    )
                    : (
                        <div className="pic-ph">
                            <b aria-hidden="true">+</b>
                            <span>Add image</span>
                            <code>{full || 'no file set'}</code>
                            {alt && <small>{alt}</small>}
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
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const io = new IntersectionObserver(([e]) => {
            if (!e.isIntersecting) return;
            io.disconnect();
            if (reduce) return setV(to);
            const t0 = performance.now();
            const step = (t) => {
                const p = Math.min(1, (t - t0) / 1200);
                setV(to * (1 - Math.pow(1 - p, 3)));
                if (p < 1) requestAnimationFrame(step);
            };
            requestAnimationFrame(step);
        });
        io.observe(ref.current);
        return () => io.disconnect();
    }, [to]);
    return <span ref={ref}>{v.toFixed(dec)}</span>;
}

function Tabs({ b }) {
    const [i, setI] = useState(0);
    const t = b.items[i];
    let last = '';
    return (
        <div className="tabs">
            <div className="tabs-rail" role="tablist">
                {b.items.map((x, k) => {
                    const g = x.group && x.group !== last ? (last = x.group) : null;
                    return (
                        <Fragment key={k}>
                            {g && <span className="tabs-g">{g}</span>}
                            <button role="tab" aria-selected={i === k} className={i === k ? 'is-on' : ''} onClick={() => setI(k)}>
                                {x.tab}{x.meta && <small>{x.meta}</small>}
                            </button>
                        </Fragment>
                    );
                })}
            </div>
            <div className="tabs-panel" key={i} aria-live="polite">
                {'file' in t && <Pic file={t.file} alt={t.title || t.tab} className={t.groups ? 'photo photo--band' : 'photo'} />}
                {t.title && <h3>{t.title}</h3>}
                {t.text && <p>{t.text}</p>}
                {t.groups && (
                    <div className="grps">
                        {t.groups.map((g) => (
                            <div key={g.title}><h4>{g.title}</h4><ul>{g.items.map((x) => <li key={x}>{x}</li>)}</ul></div>
                        ))}
                    </div>
                )}
                {t.outcomes && (
                    <div className="outs"><h4>Expected outcomes</h4><ul>{t.outcomes.map((x) => <li key={x}>{x}</li>)}</ul></div>
                )}
            </div>
        </div>
    );
}

function Block({ b }) {
    const { base } = useContext(Base);
    switch (b.type) {
        case 'steps':
            return (
                <div className="steps">
                    {b.title && <h3>{b.title}</h3>}
                    <ol>{b.items.map((x, i) => <li key={x}><b>{i + 1}</b>{x}</li>)}</ol>
                </div>
            );
        case 'stats':
            return (
                <div className="stats">
                    {b.items.map((s) => (
                        <div key={s.label}><strong><Count to={s.n} />{s.unit && <small>{s.unit}</small>}</strong><span>{s.label}</span></div>
                    ))}
                </div>
            );
        case 'image':
            return <Pic file={b.file} alt={b.alt} className={b.className || 'photo'} />;
        case 'gallery':
            return (
                <div className="gallery">
                    {b.items.map((g) => <Pic key={g.file} file={g.file} alt={g.alt} className="photo photo--sm" />)}
                </div>
            );
        case 'defs':
            return (
                <div className="defs">
                    {b.title && <h3>{b.title}</h3>}
                    {b.items.map(([k, v]) => <div key={k + v}>{k && <dt>{k}</dt>}<dd>{v}</dd></div>)}
                </div>
            );
        case 'pairs':
            return (
                <div className="pairs">
                    <div className="pairs-h"><span>{b.head[0]}</span><span aria-hidden="true" /><span>{b.head[1]}</span></div>
                    {b.items.map(([a, at, c, ct]) => (
                        <div className="pair" key={a}>
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
                    {b.items.map((x) => (
                        <article key={x.title}>
                            {x.file && <Pic file={x.file} alt={x.title} className="photo photo--sm" />}
                            <h4>{x.title}</h4>
                            {x.tag && <em>{x.tag}</em>}
                            {x.text && <p>{x.text}</p>}
                            {x.list && <ul className="gl">{x.list.map((li) => <li key={li}>{li}</li>)}</ul>}
                        </article>
                    ))}
                </div>
            );
        case 'tags':
            return (
                <div className="tags">
                    {b.title && <h3>{b.title}</h3>}
                    <ul>{b.items.map((x) => <li key={x}>{x}</li>)}</ul>
                </div>
            );
        case 'people':
            return (
                <div className="people" style={b.ratio ? { '--ratio': b.ratio } : undefined}>
                    {b.title && <h3>{b.title}</h3>}
                    <div>{b.items.map((p) => (
                        <div className="person" key={p.name}>
                            <Pic file={p.file} alt={p.name} className="avatar" />
                            <div><h4>{p.name}</h4>{p.role && <p>{p.role}</p>}</div>
                        </div>
                    ))}</div>
                </div>
            );
        case 'logos':
            return (
                <div className="logos">
                    {b.groups.map((g) => (
                        <div key={g.title}>
                            <h3>{g.title}</h3>
                            <ul>{g.items.map((n) => {
                                const u = logoUrl(n, base);
                                return <li key={n}>{u ? <img src={u} alt={n} loading="lazy" /> : <span>{n}</span>}</li>;
                            })}</ul>
                        </div>
                    ))}
                </div>
            );
        case 'cta':
            return (
                <div className="cta">
                    <p>{b.text}</p>
                    <a className="btn" href={b.href}>{b.label}</a>
                </div>
            );
        default:
            return null;
    }
}

function Section({ s }) {
    const aside = (s.aside || []).filter((b) => b.type === 'logos' ? b.groups?.length : filled(b));
    const blocks = (s.blocks || []).filter((b) => (b.type === 'logos' ? b.groups?.length : filled(b)) || b.type === 'cta');
    return (
        <section id={s.id} className={`sec sec--${s.tone || 'light'}`}>
            <div className={`sec-in ${s.layout === 'stack' ? 'sec-in--stack' : ''}`}>
                <header className="head rv">
                    <h2>{s.title}</h2>
                    {s.lead && <p className="lead">{s.lead}</p>}
                    {aside.map((b, i) => <Block b={b} key={i} />)}
                </header>
                <div className="main rv">{blocks.map((b, i) => <Block b={b} key={i} />)}</div>
            </div>
        </section>
    );
}

/* ---------- vertical navigation (top right, always visible) ---------- */
function SideNav({ list, active, tone }) {
    const [open, setOpen] = useState(false);
    const groups = [];
    list.filter((s) => s.nav).forEach((s) => {
        const name = s.group || s.nav;
        let g = groups.find((x) => x.name === name);
        if (!g) groups.push((g = { name, id: s.id, items: [] }));
        g.items.push(s);
    });
    const activeGroup = list.find((s) => s.id === active);
    const activeName = activeGroup ? (activeGroup.group || activeGroup.nav) : '';
    const jump = (e, id) => {
        e.preventDefault();
        setOpen(false);
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        document.getElementById(id)?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    };
    return (
        <nav className={`snav ${open ? 'is-open' : ''}`} data-tone={tone} aria-label="About sections">
            <button className="snav-btn" onClick={() => setOpen((o) => !o)} aria-expanded={open}>{open ? 'Close' : 'Sections'}</button>
            <ul>
                {groups.map((g) => (
                    <li key={g.name}>
                        <a href={`#${g.id}`} onClick={(e) => jump(e, g.id)} className={activeName === g.name ? 'is-on' : ''} aria-current={activeName === g.name ? 'true' : undefined}>
                            <i aria-hidden="true" />{g.name}
                        </a>
                        {g.items.length > 1 && activeName === g.name && (
                            <ul className="snav-sub">
                                {g.items.map((s) => (
                                    <li key={s.id}>
                                        <a href={`#${s.id}`} onClick={(e) => jump(e, s.id)} className={active === s.id ? 'is-on' : ''}>{s.nav}</a>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </li>
                ))}
            </ul>
        </nav>
    );
}

/* One full-screen page built from data = { base, sections: [...] } */
export default function SectionPage({ data }) {
    const sections = data.sections.filter((s) => (s.blocks || []).some((b) => (b.type === 'logos' ? b.groups?.length : filled(b)) || b.type === 'cta'));
    const [active, setActive] = useState(sections[0]?.id);

    useEffect(() => {
        const io = new IntersectionObserver((l) => l.forEach((e) => e.isIntersecting && setActive(e.target.id)), { rootMargin: '-45% 0px -50% 0px' });
        sections.forEach((s) => { const el = document.getElementById(s.id); if (el) io.observe(el); });
        const rv = new IntersectionObserver((l) => l.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); rv.unobserve(e.target); } }), { threshold: 0.08 });
        document.querySelectorAll('.ab .rv').forEach((el) => rv.observe(el));
        return () => { io.disconnect(); rv.disconnect(); };
    }, [sections.length]);

    const cur = sections.find((s) => s.id === active);
    const tone = cur?.tone === 'dark' ? 'on-dark' : 'on-light';

    return (
        <Base.Provider value={{ base: data.base || '', art: !!data.art }}>
            <div className="ab">
                <SideNav list={sections} active={active} tone={tone} />
                <main>{sections.map((s) => <Section s={s} key={s.id} />)}</main>
            </div>
        </Base.Provider>
    );
}

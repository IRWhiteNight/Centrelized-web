import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import '../../../css/PSB-css/psb-contact.css';
import { page, sections, ticker, fab, reach, people, enquiry, visit, closing } from '../../data/PSB-data/contactData';

/* ==========================================================================
   Helpers
========================================================================== */
const D = (i) => ({ '--d': Math.min(i, 8) * 80 });
const DS = (i) => ({ '--d': Math.min(i, 12) * 45 });
const reduced = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[+\d][\d\s()-]{6,}$/;
const TITLES = /^(dr|prof|ts|ir|dato|datuk|datin|en|pn|cik|mr|mrs|ms|ap|assoc|gs)\.?$/i;

const Arrow = () => (
    <svg className="ct-arrow" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
        <path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);
const Svg = ({ children }) => (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
);
const CopyIcon = () => <Svg><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V6a1 1 0 0 1 1-1h9" /></Svg>;
const CheckIcon = () => <Svg><path d="M4 12l6 6L20 6" strokeWidth="3" /></Svg>;
const SearchIcon = () => <Svg><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></Svg>;
const ICONS = {
    email: <Svg><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></Svg>,
    phone: <Svg><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" /></Svg>,
    whatsapp: <Svg><path d="M4 20l1.3-4A8 8 0 1 1 8.2 18.8z" /><path d="M9 9.5c.5 2.5 2.5 4.5 5 5" /></Svg>,
};
const ACTION = { email: 'Write email', phone: 'Call now', whatsapp: 'Open chat' };

const hrefOf = (it) => (it.type === 'email' ? `mailto:${it.value}` : it.type === 'whatsapp' ? `https://wa.me/${it.value.replace(/\D/g, '')}` : `tel:${it.value.replace(/[^\d+]/g, '')}`);
const initialsOf = (p) => p.initials || p.name.split(/\s+/).filter((w) => /^[A-Za-z]/.test(w) && !TITLES.test(w)).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?';
const csrf = () => { const m = typeof document !== 'undefined' && document.querySelector('meta[name="csrf-token"]'); return m ? m.content : ''; };

/* time in the office time zone */
function nowIn(tz) {
    try {
        const parts = new Intl.DateTimeFormat('en-US', { timeZone: tz, weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date());
        const get = (t) => parts.find((p) => p.type === t).value;
        const day = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].indexOf(get('weekday'));
        return { day: day < 0 ? 0 : day, min: Number(get('hour')) * 60 + Number(get('minute')) };
    } catch (e) { const d = new Date(); return { day: (d.getDay() + 6) % 7, min: d.getHours() * 60 + d.getMinutes() }; }
}
const toMin = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
const to12 = (t) => { const [h, m] = t.split(':').map(Number); return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`; };
/* "Monday - Thursday 8:00 AM - 5:00 PM": merge consecutive days that share the same hours */
function groupHours(hours, today) {
    const groups = [];
    hours.forEach((h, i) => {
        const key = h.open ? `${h.open}-${h.close}` : 'closed';
        const last = groups[groups.length - 1];
        if (last && last.key === key) { last.to = h.day; last.end = i; }
        else groups.push({ key, from: h.day, to: h.day, start: i, end: i, open: h.open, close: h.close });
    });
    return groups.map((g) => ({
        key: g.key + g.start,
        label: g.from === g.to ? g.from : `${g.from} – ${g.to}`,
        time: g.open ? `${to12(g.open)} – ${to12(g.close)}` : 'Closed',
        closed: !g.open,
        today: today >= g.start && today <= g.end,
    }));
}

function useNow(tz) {
    const [now, setNow] = useState(() => nowIn(tz));
    useEffect(() => { const t = setInterval(() => setNow(nowIn(tz)), 30000); return () => clearInterval(t); }, [tz]);
    return now;
}

/* open / closed for one office. hours === null means "by appointment" */
function statusOf(hours, now) {
    if (!hours) return null;
    const t = hours[now.day];
    if (t && t.open) {
        const o = toMin(t.open); const c = toMin(t.close);
        if (now.min >= o && now.min < c) return { open: true, text: `Open until ${to12(t.close)}`, today: `${to12(t.open)} – ${to12(t.close)}` };
        if (now.min < o) return { open: false, text: `Opens today at ${to12(t.open)}`, today: `${to12(t.open)} – ${to12(t.close)}` };
        return { open: false, text: 'Closed for today', today: `${to12(t.open)} – ${to12(t.close)}` };
    }
    return { open: false, text: 'Closed today', today: 'Closed' };
}

/* adds .in to every .ct-rv once it scrolls into view */
function useReveal(ref) {
    useEffect(() => {
        const nodes = ref.current.querySelectorAll('.ct-rv');
        if (reduced() || !('IntersectionObserver' in window)) { nodes.forEach((n) => n.classList.add('in')); return undefined; }
        const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.1, rootMargin: '0px 0px -5% 0px' });
        nodes.forEach((n) => io.observe(n));
        return () => io.disconnect();
    }, [ref]);
}

function useCopy() {
    const [done, setDone] = useState(null);
    const timer = useRef(0);
    const copy = useCallback(async (key, text) => {
        try {
            if (navigator.clipboard && window.isSecureContext) await navigator.clipboard.writeText(text);
            else { const t = document.createElement('textarea'); t.value = text; t.style.cssText = 'position:fixed;opacity:0'; document.body.appendChild(t); t.select(); document.execCommand('copy'); document.body.removeChild(t); }
            setDone(key); clearTimeout(timer.current); timer.current = setTimeout(() => setDone(null), 1800);
        } catch (e) { /* clipboard blocked */ }
    }, []);
    useEffect(() => () => clearTimeout(timer.current), []);
    return [done, copy];
}

/* roving arrow-key navigation for tab lists */
const arrowNav = (e, cur, len, set) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const n = (cur + (e.key === 'ArrowRight' ? 1 : -1) + len) % len;
    set(n);
    const btns = e.currentTarget.querySelectorAll('[role="tab"]');
    if (btns[n]) btns[n].focus();
};

function Head({ tag: Tag = 'h2', label, title, lede }) {
    return (
        <header className="ct-head">
            <p className="ct-kicker ct-rv">{label}</p>
            <Tag className="ct-h ct-rv" style={D(1)}>{title}</Tag>
            {lede && <p className="ct-lede ct-rv" style={D(2)}>{lede}</p>}
        </header>
    );
}

function Field({ id, label, req, err, children }) {
    return (
        <div className={`ct-f ${err ? 'is-bad' : ''}`}>
            <label htmlFor={`ct-${id}`}>{label}{req && <b aria-hidden="true"> *</b>}</label>
            {children}
            {err && <p className="ct-err" id={`ct-${id}-err`} role="alert">{err}</p>}
        </div>
    );
}

/* ==========================================================================
   PAGE
========================================================================== */
export default function Contact() {
    const rootRef = useRef(null);
    const topics = enquiry.topics || [];
    const offices = visit.offices || [];
    const blank = useMemo(() => ({ name: '', email: '', phone: '', org: '', topic: topics[0] ? topics[0].label : '', message: '', consent: false, website: '' }), [topics]);

    const [activeSection, setActiveSection] = useState(sections[0] ? sections[0].id : '');
    const [showFab, setShowFab] = useState(false);
    const [area, setArea] = useState('All');
    const [query, setQuery] = useState('');
    const [office, setOffice] = useState(0);
    const [copied, copy] = useCopy();
    const now = useNow(visit.timeZone);
    const [form, setForm] = useState(blank);
    const [errs, setErrs] = useState({});
    const [state, setState] = useState('idle');

    useReveal(rootRef);

    const has = (id) => sections.some((s) => s.id === id);
    const lab = (id) => (sections.find((s) => s.id === id) || {}).label || '';
    const tag = (id) => (sections[0] && sections[0].id === id ? 'h1' : 'h2');

    /* scroll: progress bar, active menu item, floating button */
    useEffect(() => {
        const root = rootRef.current;
        let raf = 0;
        const update = () => {
            raf = 0;
            const y = window.scrollY;
            const h = root.scrollHeight - window.innerHeight;
            root.style.setProperty('--progress', h > 0 ? Math.min(1, Math.max(0, y / h)).toFixed(4) : 0);
            setShowFab(y > 640 && y < h - 700);
            const line = window.innerHeight * 0.35;
            let cur = sections[0] ? sections[0].id : '';
            sections.forEach((s) => { const el = document.getElementById(s.id); if (el && el.getBoundingClientRect().top <= line) cur = s.id; });
            setActiveSection(cur);
        };
        const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
        update();
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll);
        return () => { cancelAnimationFrame(raf); window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); };
    }, []);

    /* keep the active menu item visible on small screens */
    useEffect(() => {
        const a = rootRef.current.querySelector('.ct-subnav a.is-active');
        const box = rootRef.current.querySelector('.ct-subnav-scroll');
        if (a && box) box.scrollTo({ left: a.offsetLeft - box.clientWidth / 2 + a.clientWidth / 2, behavior: reduced() ? 'auto' : 'smooth' });
    }, [activeSection]);

    const goTo = useCallback((id) => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'start' });
    }, []);

    /* card spotlight follows the pointer */
    const onMove = useCallback((e) => {
        const s = e.target.closest && e.target.closest('.ct-spot');
        if (!s) return;
        const r = s.getBoundingClientRect();
        s.style.setProperty('--mx', `${Math.round(e.clientX - r.left)}px`);
        s.style.setProperty('--my', `${Math.round(e.clientY - r.top)}px`);
    }, []);

    /* shortcuts: "What do you need?" */
    const pickTopic = (label) => { if (topics.some((t) => t.label === label)) setForm((f) => ({ ...f, topic: label })); };
    const runRoute = (r) => {
        if (r.go === 'people') { setArea(r.area || 'All'); setQuery(''); goTo('people'); }
        else if (r.go === 'enquiry') { if (r.topic) pickTopic(r.topic); goTo('enquiry'); }
        else if (r.go === 'visit') { const i = offices.findIndex((x) => x.id === r.office); if (i >= 0) setOffice(i); goTo('visit'); }
        else if (r.href) window.location.href = r.href;
    };

    /* people: area filter + search */
    const areas = useMemo(() => ['All', ...new Set(people.items.map((p) => p.area))], []);
    const q = query.trim().toLowerCase();
    const list = people.items.filter((p) => (area === 'All' || p.area === area) && (!q || [p.name, p.role, p.area, p.focus].join(' ').toLowerCase().includes(q)));
    const countIn = (a) => (a === 'All' ? people.items.length : people.items.filter((p) => p.area === a).length);
    const filtered = area !== 'All' || q !== '';
    const clearFilters = () => { setArea('All'); setQuery(''); };

    /* status of the office shown on the first card */
    const sOffice = offices.find((x) => x.id === reach.statusOffice);
    const sStatus = sOffice ? statusOf(sOffice.hours, now) : null;

    /* visit */
    const o = offices[office] || offices[0];
    const oStatus = o ? statusOf(o.hours, now) : null;
    const oGroups = o && o.hours ? groupHours(o.hours, now.day) : null;

    /* form */
    const topic = topics.find((t) => t.label === form.topic) || topics[0] || {};
    const set = (k) => (e) => {
        const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setForm((f) => ({ ...f, [k]: v }));
        if (errs[k]) setErrs((x) => ({ ...x, [k]: undefined }));
        if (state === 'fail') setState('idle');
    };
    const done = [form.name.trim().length >= 2, EMAIL_RE.test(form.email.trim()), form.message.trim().length >= 10, form.consent].filter(Boolean).length;
    const validate = () => {
        const e = {};
        if (form.name.trim().length < 2) e.name = 'Enter your name.';
        if (!EMAIL_RE.test(form.email.trim())) e.email = 'Enter a valid email address.';
        if (form.phone && !PHONE_RE.test(form.phone.trim())) e.phone = 'Enter a valid phone number.';
        if (form.message.trim().length < 10) e.message = 'Write at least 10 characters so we can help.';
        if (!form.consent) e.consent = 'Tick the box so we can reply to you.';
        return e;
    };
    const submit = async (ev) => {
        ev.preventDefault();
        const e = validate(); setErrs(e);
        if (Object.keys(e).length) {
            const first = rootRef.current.querySelector('.ct-f.is-bad input, .ct-f.is-bad textarea, .ct-check.is-bad input');
            if (first) first.focus();
            return;
        }
        if (form.website) { setState('done'); return; }
        setState('loading');
        try {
            if (enquiry.endpoint) {
                const { website, consent, ...payload } = form;
                const token = csrf();
                const r = await fetch(enquiry.endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...(token ? { 'X-CSRF-TOKEN': token } : {}) },
                    body: JSON.stringify(payload),
                });
                if (r.status === 422) {
                    const j = await r.json().catch(() => ({}));
                    const m = {};
                    Object.entries(j.errors || {}).forEach(([k, v]) => { m[k] = Array.isArray(v) ? v[0] : v; });
                    setErrs(m); setState('idle'); return;
                }
                if (!r.ok) throw new Error('failed');
            } else await new Promise((res) => setTimeout(res, 900));
            setState('done');
        } catch (err) { setState('fail'); }
    };
    const reset = () => { setForm(blank); setErrs({}); setState('idle'); };
    const mailTo = `mailto:${topic.email || enquiry.fallbackEmail}?subject=${encodeURIComponent(`[${form.topic}] Enquiry`)}&body=${encodeURIComponent(`${form.message}\n\n${form.name}\n${form.org}\n${form.phone}`)}`;

    return (
        <div className="ct" ref={rootRef} onMouseMove={onMove} aria-label={page.title}>

            {/* ===================== STICKY MENU ===================== */}
            <nav className="ct-subnav" aria-label="Contact sections">
                <div className="ct-wrap ct-subnav-in">
                    <div className="ct-subnav-scroll">
                        <ul>
                            {sections.map((s) => (
                                <li key={s.id}>
                                    <a href={`#${s.id}`} className={activeSection === s.id ? 'is-active' : ''} aria-current={activeSection === s.id ? 'true' : undefined} onClick={(e) => { e.preventDefault(); goTo(s.id); }}>{s.label}</a>
                                </li>
                            ))}
                        </ul>
                    </div>
                    {has('enquiry') && activeSection !== 'enquiry' && (
                        <button type="button" className="ct-btn ct-btn--sm ct-subnav-cta" onClick={() => goTo('enquiry')}>Send enquiry<Arrow /></button>
                    )}
                </div>
                <div className="ct-progress" aria-hidden="true"><span /></div>
            </nav>

            {ticker && ticker.length > 0 && (
                <div className="ct-ticker" aria-hidden="true">
                    <div className="ct-ticker-track">{[0, 1].map((k) => <ul key={k}>{ticker.map((t) => <li key={t + k}>{t}</li>)}</ul>)}</div>
                </div>
            )}

            {/* ===================== REACH US ===================== */}
            {has('reach') && (
                <section className="ct-sec ct-light" id="reach">
                    <div className="ct-wrap">
                        <Head tag={tag('reach')} label={lab('reach')} title={reach.heading} />

                        <div className={`ct-reach ${reach.routes && reach.routes.length ? '' : 'ct-reach--solo'}`}>
                            <div className="ct-reach-main">
                                <h3 className="ct-sub ct-rv">{reach.channelsTitle}</h3>
                                <ul className="ct-channels">
                                    {sStatus && (
                                        <li className={`ct-ch ct-status ct-spot ct-rv ${sStatus.open ? 'is-open' : ''}`}>
                                            <p className="ct-ch-label">{reach.statusLabel || 'Office status'}</p>
                                            <p className="ct-status-big"><i aria-hidden="true" />{sStatus.open ? 'Open now' : 'Closed now'}</p>
                                            <p className="ct-ch-note">{sStatus.text}</p>
                                            <p className="ct-ch-note ct-ch-note--strong">Hours today: {sStatus.today}</p>
                                            {has('visit') && <div className="ct-ch-act"><button type="button" className="ct-btn ct-btn--sm ct-btn--ink" onClick={() => { const i = offices.indexOf(sOffice); if (i >= 0) setOffice(i); goTo('visit'); }}>See hours<Arrow /></button></div>}
                                        </li>
                                    )}
                                    {reach.channels.map((d, i) => (
                                        <li className="ct-ch ct-spot ct-rv" style={D(i + 1)} key={d.id}>
                                            <div className="ct-ch-top"><span className="ct-ch-ico">{ICONS[d.type] || ICONS.email}</span><p className="ct-ch-label">{d.label}</p></div>
                                            <a className="ct-ch-value" href={hrefOf(d)} {...(d.type === 'whatsapp' ? { target: '_blank', rel: 'noreferrer' } : {})}>{d.value}</a>
                                            <div className="ct-ch-act">
                                                <a className="ct-btn ct-btn--sm" href={hrefOf(d)} title={d.note} {...(d.type === 'whatsapp' ? { target: '_blank', rel: 'noreferrer' } : {})}>{ACTION[d.type] || 'Open'}<Arrow /></a>
                                                <button type="button" className="ct-copy" onClick={() => copy(d.id, d.value)} aria-label={`Copy ${d.value}`}>{copied === d.id ? <><CheckIcon />Copied</> : <><CopyIcon />Copy</>}</button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {reach.routes && reach.routes.length > 0 && (
                                <aside className="ct-routes ct-rv" style={D(2)}>
                                    <h3 className="ct-sub">{reach.routesTitle}</h3>
                                    <ul>
                                        {reach.routes.map((r) => (
                                            <li key={r.title}>
                                                <button type="button" className="ct-route" title={r.text} onClick={() => runRoute(r)}>
                                                    <b>{r.title}</b>
                                                    <i className="ct-go"><Arrow /></i>
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </aside>
                            )}
                        </div>

                        {reach.social && reach.social.length > 0 && (
                            <div className="ct-social ct-rv">
                                <span>Follow us</span>
                                {reach.social.map((s) => <a key={s.name} href={s.url} target="_blank" rel="noreferrer">{s.name}</a>)}
                            </div>
                        )}
                    </div>
                </section>
            )}

            {/* ===================== CONTACT PERSONS ===================== */}
            {has('people') && (
                <section className="ct-sec ct-dark" id="people">
                    <div className="ct-wrap">
                        <Head tag={tag('people')} label={lab('people')} title={people.heading} />

                        <div className="ct-bar">
                            <label className="ct-search">
                                <SearchIcon />
                                <span className="ct-sr">Search contact persons</span>
                                <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={people.searchPlaceholder || 'Search name or topic'} />
                                {query && <button type="button" className="ct-x" onClick={() => setQuery('')} aria-label="Clear search">×</button>}
                            </label>
                            <div className="ct-seg" role="group" aria-label="Filter by area">
                                {areas.map((a) => (
                                    <button type="button" key={a} className={`ct-seg-b ${area === a ? 'is-on' : ''}`} aria-pressed={area === a} onClick={() => setArea(a)}>
                                        {a === 'All' ? (people.allLabel || 'Everyone') : a}<small>{countIn(a)}</small>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <p className="ct-count" aria-live="polite">
                            <span>Showing <b>{list.length}</b> of {people.items.length} people</span>
                            {filtered && <button type="button" className="ct-link" onClick={clearFilters}>Reset filters</button>}
                        </p>

                        {list.length === 0 ? (
                            <div className="ct-empty ct-pop">
                                <p>No one matches this search.</p>
                                <div className="ct-empty-act">
                                    <button type="button" className="ct-link" onClick={clearFilters}>Show everyone</button>
                                    {has('enquiry') && <button type="button" className="ct-link" onClick={() => goTo('enquiry')}>Send an enquiry instead</button>}
                                </div>
                            </div>
                        ) : (
                            <ul className="ct-cards">
                                {list.map((p, i) => (
                                    <li className="ct-pc ct-pop" style={DS(i)} key={p.id}>
                                        <div className="ct-pc-top">
                                            <span className="ct-avatar" aria-hidden="true">{p.photo ? <img src={p.photo} alt="" loading="lazy" /> : initialsOf(p)}</span>
                                            <div><h3>{p.name}</h3><p className="ct-role">{p.role}</p></div>
                                        </div>
                                        <span className="ct-area">{p.area}</span>
                                        <p className="ct-focus" title={p.focus}>{p.focus}</p>
                                        <div className="ct-pc-act">
                                            {p.phone && <a className="ct-btn ct-btn--sm" href={`tel:${p.phone.replace(/[^\d+]/g, '')}`}><span className="ct-bi">{ICONS.phone}</span>Call</a>}
                                            {p.email && <a className="ct-btn ct-btn--sm ct-btn--ink" href={`mailto:${p.email}`}><span className="ct-bi">{ICONS.email}</span>Email</a>}
                                            <button type="button" className={`ct-icon ${copied === p.id ? 'is-done' : ''}`} onClick={() => copy(p.id, p.email || p.phone)} aria-label={`Copy ${p.email || p.phone}`}>{copied === p.id ? <CheckIcon /> : <CopyIcon />}</button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </section>
            )}

            {/* ===================== ENQUIRY ===================== */}
            {has('enquiry') && (
                <section className="ct-sec ct-yellow" id="enquiry">
                    <div className="ct-wrap">
                        <Head tag={tag('enquiry')} label={lab('enquiry')} title={enquiry.heading} lede={enquiry.lede} />

                        <div className="ct-enq">
                            <div className="ct-formcard ct-rv">
                                {state === 'done' ? (
                                    <div className="ct-done" role="status">
                                        <span className="ct-done-ico"><svg viewBox="0 0 52 52" width="64" height="64" aria-hidden="true"><circle cx="26" cy="26" r="23" fill="none" stroke="currentColor" strokeWidth="3" /><path d="M14 27l8 8 16-19" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" /></svg></span>
                                        <h3>{enquiry.success.title}</h3>
                                        <p>{enquiry.success.text}</p>
                                        <button type="button" className="ct-btn ct-btn--ink" onClick={reset}>{enquiry.success.again}<Arrow /></button>
                                    </div>
                                ) : (
                                    <form className="ct-form" onSubmit={submit} noValidate>
                                        <div className="ct-meter" role="progressbar" aria-valuemin="0" aria-valuemax="4" aria-valuenow={done} aria-label="Form completion"><span style={{ transform: `scaleX(${done / 4})` }} /></div>

                                        {topics.length > 0 && (
                                            <fieldset className="ct-topics">
                                                <legend>{enquiry.topicsTitle || 'What is it about?'}</legend>
                                                <div>
                                                    {topics.map((t) => (
                                                        <label key={t.label} className={form.topic === t.label ? 'is-on' : ''}>
                                                            <input type="radio" name="topic" value={t.label} checked={form.topic === t.label} onChange={set('topic')} />{t.label}
                                                        </label>
                                                    ))}
                                                </div>
                                                {topic.email && <p className="ct-goesto">Goes to <b>{topic.email}</b></p>}
                                            </fieldset>
                                        )}

                                        <div className="ct-row">
                                            <Field id="name" label="Full name" req err={errs.name}><input id="ct-name" type="text" value={form.name} onChange={set('name')} autoComplete="name" aria-invalid={!!errs.name} aria-describedby={errs.name ? 'ct-name-err' : undefined} /></Field>
                                            <Field id="email" label="Email" req err={errs.email}><input id="ct-email" type="email" value={form.email} onChange={set('email')} autoComplete="email" aria-invalid={!!errs.email} aria-describedby={errs.email ? 'ct-email-err' : undefined} /></Field>
                                        </div>
                                        <div className="ct-row">
                                            <Field id="phone" label="Phone (optional)" err={errs.phone}><input id="ct-phone" type="tel" value={form.phone} onChange={set('phone')} autoComplete="tel" aria-invalid={!!errs.phone} aria-describedby={errs.phone ? 'ct-phone-err' : undefined} /></Field>
                                            <Field id="org" label="Organisation (optional)"><input id="ct-org" type="text" value={form.org} onChange={set('org')} autoComplete="organization" /></Field>
                                        </div>
                                        <Field id="message" label="Your message" req err={errs.message}>
                                            <textarea id="ct-message" rows="5" maxLength={enquiry.messageMax} value={form.message} onChange={set('message')} aria-invalid={!!errs.message} aria-describedby={errs.message ? 'ct-message-err' : undefined} />
                                            <span className="ct-counter">{form.message.length} / {enquiry.messageMax}</span>
                                        </Field>

                                        <div className="ct-hp" aria-hidden="true"><label>Leave empty<input type="text" tabIndex={-1} autoComplete="off" value={form.website} onChange={set('website')} /></label></div>

                                        <label className={`ct-check ${errs.consent ? 'is-bad' : ''}`}>
                                            <input type="checkbox" checked={form.consent} onChange={set('consent')} aria-invalid={!!errs.consent} />
                                            <span className="ct-box" aria-hidden="true"><CheckIcon /></span>
                                            <span>{enquiry.consent}</span>
                                        </label>
                                        {errs.consent && <p className="ct-err" role="alert">{errs.consent}</p>}

                                        <div className="ct-form-foot">
                                            <button className={`ct-btn ct-btn--ink ${state === 'loading' ? 'is-loading' : ''}`} type="submit" disabled={state === 'loading'}>{state === 'loading' ? 'Sending…' : enquiry.button}<Arrow /></button>
                                            <a className="ct-alt" href={mailTo}>or email us directly</a>
                                        </div>
                                        {state === 'fail' && <p className="ct-err ct-err--box" role="alert">{enquiry.fail}</p>}
                                    </form>
                                )}
                            </div>

                            {enquiry.next && (
                                <aside className="ct-next ct-rv" style={D(2)}>
                                    <h3>{enquiry.next.title}</h3>
                                    <ol>
                                        {enquiry.next.steps.map((s, i) => (
                                            <li key={s.title}><strong>{i + 1}</strong><div><h4>{s.title}</h4><p>{s.text}</p></div></li>
                                        ))}
                                    </ol>
                                    {enquiry.next.note && <p className="ct-next-note">{enquiry.next.note}</p>}
                                </aside>
                            )}
                        </div>
                    </div>
                </section>
            )}

            {/* ===================== VISIT ===================== */}
            {has('visit') && o && (
                <section className="ct-sec ct-light" id="visit">
                    <div className="ct-wrap">
                        <Head tag={tag('visit')} label={lab('visit')} title={visit.heading} />

                        {offices.length > 1 && (
                            <div className="ct-offices ct-rv" role="tablist" aria-label="Choose an office" onKeyDown={(e) => arrowNav(e, office, offices.length, setOffice)}>
                                {offices.map((x, i) => (
                                    <button type="button" key={x.id} role="tab" aria-selected={office === i} tabIndex={office === i ? 0 : -1} className={`ct-office ${office === i ? 'is-on' : ''}`} onClick={() => setOffice(i)}>
                                        <span className="ct-office-name">{x.name}</span>
                                        {x.tag && <span className="ct-chip">{x.tag}</span>}
                                    </button>
                                ))}
                            </div>
                        )}

                        <div className="ct-visit2" role="tabpanel">
                            <div className="ct-vcard ct-rv">
                                <div className="ct-vtop">
                                    <h3 className="ct-vname">{o.name}</h3>
                                    {o.tag && <span className="ct-chip">{o.tag}</span>}
                                </div>

                                {oStatus ? (
                                    <div className={`ct-open ${oStatus.open ? 'is-open' : ''}`}>
                                        <i aria-hidden="true" />
                                        <div><b>{oStatus.open ? 'Open now' : 'Closed now'}</b><span>{oStatus.text} · Today {oStatus.today}</span></div>
                                    </div>
                                ) : (
                                    <div className="ct-open"><i aria-hidden="true" /><div><b>By appointment</b><span>Please contact us before you visit</span></div></div>
                                )}

                                <address className="ct-addr">{o.lines.map((l) => <span key={l}>{l}</span>)}</address>

                                <div className="ct-visit-btns">
                                    <a className="ct-btn ct-btn--sm ct-btn--ink" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(o.mapQuery)}`} target="_blank" rel="noreferrer">Get directions<Arrow /></a>
                                    <button type="button" className="ct-copy" onClick={() => copy(o.id, o.lines.join(', '))}>{copied === o.id ? <><CheckIcon />Copied</> : <><CopyIcon />Copy address</>}</button>
                                </div>

                                {oGroups && (
                                    <details className="ct-week">
                                        <summary>See hours for the full week</summary>
                                        <ul className="ct-hours-list">
                                            {oGroups.map((g) => (
                                                <li key={g.key} className={`${g.today ? 'is-today' : ''} ${g.closed ? 'is-closed' : ''}`}>
                                                    <span className="ct-hd">{g.label}{g.today && <em>Today</em>}</span>
                                                    <b>{g.time}</b>
                                                </li>
                                            ))}
                                        </ul>
                                    </details>
                                )}
                                {(o.hoursNote || visit.hoursNote) && <p className="ct-hours-note">{o.hoursNote || visit.hoursNote}</p>}
                            </div>

                            <div className="ct-map ct-rv" style={D(2)}>
                                <iframe key={o.id} title={`Map: ${o.name}`} loading="lazy" referrerPolicy="no-referrer-when-downgrade" src={`https://www.google.com/maps?q=${encodeURIComponent(o.mapQuery)}&output=embed`} />
                            </div>
                        </div>

                        {visit.getting && (
                            <div className="ct-getting ct-rv">
                                <h3 className="ct-sub">{visit.getting.title}</h3>
                                <ul className="ct-get">{visit.getting.items.map((g) => <li key={g.title}><b>{g.title}</b><span>{g.text}</span></li>)}</ul>
                            </div>
                        )}
                    </div>
                </section>
            )}

            {/* ===================== CLOSING ===================== */}
            {closing && (
                <section className="ct-sec ct-dark ct-cta" id="cta">
                    <div className="ct-wrap ct-cta-in">
                        <div>
                            <h2 className="ct-h ct-rv">{closing.heading}</h2>
                            <p className="ct-lede ct-rv" style={D(1)}>{closing.text}</p>
                        </div>
                        <div className="ct-cta-btns ct-rv" style={D(2)}>
                            {(closing.buttons || []).map((b) => (
                                <a key={b.label} className={`ct-btn ${b.style === 'ghost' ? 'ct-btn--ghost' : ''}`} href={b.href}>{b.label}<Arrow /></a>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {fab && has(fab.go) && (
                <div className={`ct-fab ${showFab && activeSection !== fab.go ? 'is-on' : ''}`}>
                    <button type="button" className="ct-btn ct-btn--sm" onClick={() => goTo(fab.go)} tabIndex={showFab && activeSection !== fab.go ? 0 : -1}>{fab.label}<Arrow /></button>
                </div>
            )}
        </div>
    );
}

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import '../../../css/PSB-css/psb-contact.css';
import { links, page, hero, sections, ticker, enquiry, people, direct, visit, closing } from '../../data/PSB-data/contactData';

/* ---------- helpers ---------- */
const D = (i) => ({ '--d': Math.min(i, 8) * 80 });
const reduced = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const Arrow = () => (<svg className="cx-arrow" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>);
const CopyIcon = () => (<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2" fill="none" stroke="currentColor" strokeWidth="2" /><path d="M5 15V6a1 1 0 0 1 1-1h9" fill="none" stroke="currentColor" strokeWidth="2" /></svg>);
const CheckIcon = () => (<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M4 12l6 6L20 6" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>);

/* reveal on scroll: opacity + translate only, transform is removed afterwards so text stays sharp */
function useReveal(ref) {
    useEffect(() => {
        const root = ref.current;
        if (!root) return undefined;
        if (reduced() || !('IntersectionObserver' in window)) { root.classList.add('cx-static'); return undefined; }
        const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.08 });
        const scan = () => root.querySelectorAll('.cx-rv:not(.in):not([data-o])').forEach((n) => { n.dataset.o = '1'; io.observe(n); });
        scan();
        const mo = new MutationObserver(scan);
        mo.observe(root, { childList: true, subtree: true });
        return () => { io.disconnect(); mo.disconnect(); };
    }, [ref]);
}

/* sticky stack: a section taller than the screen scrolls to its bottom, then sticks */
function useStack(ref) {
    useEffect(() => {
        const root = ref.current;
        const items = [...root.querySelectorAll('.cx-stack')];
        const fit = () => items.forEach((el) => { el.style.top = `${Math.min(0, window.innerHeight - el.offsetHeight)}px`; });
        fit();
        const ro = 'ResizeObserver' in window ? new ResizeObserver(fit) : null;
        if (ro) items.forEach((el) => ro.observe(el));
        window.addEventListener('resize', fit);
        return () => { if (ro) ro.disconnect(); window.removeEventListener('resize', fit); };
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

const href = (it) => it.type === 'email' ? `mailto:${it.value}` : it.type === 'whatsapp' ? `https://wa.me/${it.value.replace(/\D/g, '')}` : `tel:${it.value.replace(/[^\d+]/g, '')}`;

function nowIn(tz) {
    try {
        const parts = new Intl.DateTimeFormat('en-US', { timeZone: tz, weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date());
        const get = (t) => parts.find((p) => p.type === t).value;
        const h = get('hour'); const m = get('minute');
        return { day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].indexOf(get('weekday')), min: Number(h) * 60 + Number(m), time: `${h}:${m}` };
    } catch (e) { const d = new Date(); return { day: (d.getDay() + 6) % 7, min: d.getHours() * 60 + d.getMinutes(), time: d.toTimeString().slice(0, 5) }; }
}
const toMin = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
const to12 = (t) => { const [h, m] = t.split(':').map(Number); return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`; };
const pct = (min) => `${(min / 1440) * 100}%`;

function useOpenStatus() {
    const [now, setNow] = useState(() => nowIn(visit.timeZone));
    useEffect(() => { const t = setInterval(() => setNow(nowIn(visit.timeZone)), 20000); return () => clearInterval(t); }, []);
    const today = visit.hours[now.day];
    let open = false; let text = 'Closed today';
    if (today && today.open) {
        const o = toMin(today.open); const c = toMin(today.close);
        if (now.min >= o && now.min < c) { open = true; text = `Open until ${to12(today.close)}`; }
        else if (now.min < o) text = `Opens today at ${to12(today.open)}`;
        else text = 'Closed for today';
    }
    return { open, text, day: now.day, time: now.time, min: now.min };
}

function Head({ title, lede }) {
    return (
        <header className="cx-head">
            <h2 className="cx-h cx-rv">{title}</h2>
            {lede && <p className="cx-lede cx-rv" style={D(1)}>{lede}</p>}
        </header>
    );
}

/* label sits AFTER the control so CSS can float it with :focus ~ label */
function Field({ id, label, req, err, children }) {
    return (
        <div className={`cx-field ${err ? 'is-bad' : ''}`}>
            {children}
            <label htmlFor={`cx-${id}`}>{label}{req && <b aria-hidden="true"> *</b>}</label>
            {err && <p className="cx-err" role="alert">{err}</p>}
        </div>
    );
}

/* the memorable thing: a live, clickable radar of the sandbox airspace */
const BLIPS = [{ x: 372, y: 178, l: 'Sandbox', t: 0 }, { x: 188, y: 352, l: 'Vertiport', t: 1.6 }, { x: 398, y: 402, l: 'COE-UAS', t: 3.1 }];
function Radar({ label, onPick }) {
    const wrap = useRef(null);
    const readout = useRef(null);
    const move = (e) => {
        const w = wrap.current; if (!w || reduced()) return;
        const r = w.getBoundingClientRect();
        const x = e.clientX - r.left; const y = e.clientY - r.top;
        w.style.setProperty('--cx', `${Math.round(x)}px`); w.style.setProperty('--cy', `${Math.round(y)}px`);
        const dx = x - r.width / 2; const dy = y - r.height / 2;
        const brg = (Math.round((Math.atan2(dx, -dy) * 180) / Math.PI) + 360) % 360;
        const rng = (Math.hypot(dx, dy) / (r.width / 2)) * 25;
        if (readout.current) readout.current.textContent = `Bearing ${String(brg).padStart(3, '0')}° · Range ${rng.toFixed(1)} km`;
    };
    const key = (l) => (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onPick(l); } };
    return (
        <div className="cx-radar-box" ref={wrap} onPointerMove={move}>
            <svg className="cx-radar" viewBox="0 0 560 560" role="group" aria-label={label}>
                <defs>
                    <linearGradient id="cxSweep" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#ffd60a" stopOpacity="0" /><stop offset="1" stopColor="#ffd60a" stopOpacity=".55" /></linearGradient>
                    <radialGradient id="cxDisc"><stop offset="0" stopColor="#ffffff" stopOpacity=".16" /><stop offset=".7" stopColor="#19b4e8" stopOpacity=".1" /><stop offset="1" stopColor="#19b4e8" stopOpacity="0" /></radialGradient>
                </defs>
                <circle cx="280" cy="280" r="272" fill="url(#cxDisc)" />
                <g className="cx-r-rings" fill="none">{[68, 136, 204, 270].map((r) => <circle key={r} cx="280" cy="280" r={r} />)}</g>
                <g className="cx-r-axes"><path d="M280 10v540M10 280h540M89 89l382 382M471 89L89 471" /></g>
                {!reduced() && (
                    <>
                        <path className="cx-path" d="M40 470 C 160 330, 330 400, 500 110" />
                        <path className="cx-plane" d="M10 0L-8 7L-4 0L-8 -7Z"><animateMotion dur="9s" repeatCount="indefinite" rotate="auto" path="M40 470 C 160 330, 330 400, 500 110" /></path>
                    </>
                )}
                <g className="cx-r-sweep"><path d="M280 280 L280 10 A270 270 0 0 1 471 89 Z" fill="url(#cxSweep)" /><path d="M280 280V10" stroke="#ffd60a" strokeWidth="2" /></g>
                {BLIPS.map((b) => (
                    <g key={b.l} className="cx-blipg" transform={`translate(${b.x} ${b.y})`} role="button" tabIndex={0} aria-label={`Go to ${b.l}`} onClick={() => onPick(b.l)} onKeyDown={key(b.l)}>
                        <circle className="cx-hit" r="26" />
                        <circle className="cx-blip-ring" r="9" style={{ animationDelay: `${b.t}s` }} />
                        <circle className="cx-blip" r="6" />
                        <text x="18" y="5" className="cx-blip-t">{b.l}</text>
                    </g>
                ))}
                <rect className="cx-r-core" x="270" y="270" width="20" height="20" rx="3" transform="rotate(45 280 280)" />
                <g className="cx-r-orbit"><circle cx="280" cy="38" r="5" /></g>
            </svg>
            <span className="cx-cross" aria-hidden="true" />
            <p className="cx-readout" ref={readout} aria-hidden="true">Move over the radar</p>
        </div>
    );
}

/* ========================================================================== */
export default function Contact() {
    const rootRef = useRef(null);
    const subRef = useRef(null);
    const [activeSection, setActiveSection] = useState(sections[0].id);
    const [area, setArea] = useState('All');
    const [office, setOffice] = useState(0);
    const [copied, copy] = useCopy();
    const status = useOpenStatus();
    const blank = { name: '', email: '', phone: '', org: '', topic: enquiry.topics[0], message: '', consent: false, website: '' };
    const [form, setForm] = useState(blank);
    const [errs, setErrs] = useState({});
    const [state, setState] = useState('idle');

    useReveal(rootRef);
    useStack(rootRef);

    /* scroll: progress bar, hero parallax, active menu item, and the dim on a section being covered */
    useEffect(() => {
        const root = rootRef.current;
        const stacks = [...root.querySelectorAll('.cx-stack')];
        let raf = 0;
        const update = () => {
            raf = 0;
            const y = window.scrollY;
            const vh = window.innerHeight;
            const h = root.scrollHeight - vh;
            root.style.setProperty('--sy', `${Math.min(y, 900)}`);
            root.style.setProperty('--progress', h > 0 ? Math.min(1, Math.max(0, y / h)).toFixed(4) : 0);
            const line = vh * 0.4;
            let cur = sections[0].id;
            sections.forEach((s) => { const el = document.getElementById(s.id); if (el && el.getBoundingClientRect().top <= line) cur = s.id; });
            setActiveSection(cur);
            if (!reduced()) {
                stacks.forEach((el, i) => {
                    const next = stacks[i + 1];
                    if (!next) return;
                    const t = next.getBoundingClientRect().top;
                    el.style.setProperty('--dim', Math.min(1, Math.max(0, 1 - t / vh)).toFixed(3));
                });
            }
        };
        const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
        update();
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll);
        return () => { cancelAnimationFrame(raf); window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); };
    }, []);

    /* sliding underline + keep the active link centred on small screens */
    useEffect(() => {
        const box = subRef.current;
        if (!box) return undefined;
        const place = () => {
            const a = box.querySelector('a.is-active');
            if (!a) return;
            const li = a.parentElement;
            box.style.setProperty('--ix', `${li.offsetLeft}px`);
            box.style.setProperty('--iw', `${li.offsetWidth}px`);
            if (box.scrollWidth > box.clientWidth) box.scrollTo({ left: li.offsetLeft - box.clientWidth / 2 + li.offsetWidth / 2, behavior: 'smooth' });
        };
        place();
        window.addEventListener('resize', place);
        return () => window.removeEventListener('resize', place);
    }, [activeSection]);

    const goTo = useCallback((id) => { const el = document.getElementById(id); if (el) el.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'start' }); }, []);

    /* clicking a blip on the radar jumps to what it stands for */
    const pick = (l) => {
        if (l === 'Sandbox') { setOffice(Math.min(1, visit.offices.length - 1)); goTo('visit'); }
        else if (l === 'COE-UAS') { setOffice(0); goTo('visit'); }
        else { setForm((f) => ({ ...f, topic: enquiry.topics.includes('Testing & trials') ? 'Testing & trials' : f.topic })); goTo('enquiry'); }
    };

    /* pointer effects: section glow, card spotlight, hero parallax, magnetic buttons */
    const onMove = useCallback((e) => {
        if (reduced() || !e.target.closest) return;
        const sec = e.target.closest('.cx-stack');
        if (sec) { const r = sec.getBoundingClientRect(); sec.style.setProperty('--gx', `${Math.round(e.clientX - r.left)}px`); sec.style.setProperty('--gy', `${Math.round(e.clientY - r.top)}px`); }
        const h = e.target.closest('.cx-hero');
        if (h) { const r = h.getBoundingClientRect(); h.style.setProperty('--px', ((e.clientX - r.left) / r.width - 0.5).toFixed(3)); h.style.setProperty('--py', ((e.clientY - r.top) / r.height - 0.5).toFixed(3)); }
        const s = e.target.closest('.cx-spot');
        if (s) { const r = s.getBoundingClientRect(); s.style.setProperty('--mx', `${Math.round(e.clientX - r.left)}px`); s.style.setProperty('--my', `${Math.round(e.clientY - r.top)}px`); }
        const b = e.target.closest('.cx-btn');
        if (b) { const r = b.getBoundingClientRect(); b.style.setProperty('--tx', `${Math.round((e.clientX - r.left - r.width / 2) * 0.14)}px`); b.style.setProperty('--ty', `${Math.round((e.clientY - r.top - r.height / 2) * 0.24)}px`); }
    }, []);
    const onOut = useCallback((e) => {
        const t = e.target.closest && e.target.closest('.cx-btn');
        if (t) ['--tx', '--ty'].forEach((p) => t.style.removeProperty(p));
    }, []);

    /* people */
    const areas = useMemo(() => ['All', ...new Set(people.items.map((p) => p.area))], []);
    const list = people.items.filter((p) => area === 'All' || p.area === area);
    const initials = (p) => p.role.split(/\s+/).filter((w) => /^[A-Za-z]/.test(w)).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
    const mainEmail = direct.items.find((d) => d.type === 'email') || direct.items[0];
    const mainPhone = direct.items.find((d) => d.type === 'phone') || direct.items[0];

    /* form */
    const set = (k) => (e) => {
        const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setForm((f) => ({ ...f, [k]: v }));
        if (errs[k]) setErrs((x) => ({ ...x, [k]: undefined }));
        if (state === 'fail') setState('idle');
    };
    const steps = [form.name.trim().length >= 2, EMAIL_RE.test(form.email.trim()), form.message.trim().length >= 10, form.consent].filter(Boolean).length;
    const validate = () => {
        const e = {};
        if (form.name.trim().length < 2) e.name = 'Enter your name.';
        if (!EMAIL_RE.test(form.email.trim())) e.email = 'Enter a valid email address.';
        if (form.phone && !/^[+\d][\d\s()-]{6,}$/.test(form.phone.trim())) e.phone = 'Enter a valid phone number.';
        if (form.message.trim().length < 10) e.message = 'Write at least 10 characters so we can help.';
        if (!form.consent) e.consent = 'Tick the box so we can reply to you.';
        return e;
    };
    const submit = async (ev) => {
        ev.preventDefault();
        const e = validate(); setErrs(e);
        if (Object.keys(e).length) {
            const first = rootRef.current.querySelector('.cx-field.is-bad input, .cx-field.is-bad textarea, .cx-check.is-bad input');
            if (first) first.focus();
            return;
        }
        if (form.website) { setState('done'); return; }
        setState('loading');
        try {
            if (enquiry.endpoint) {
                const { website, consent, ...payload } = form;
                const r = await fetch(enquiry.endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
                if (!r.ok) throw new Error('failed');
            } else await new Promise((res) => setTimeout(res, 900));
            setState('done');
        } catch (err) { setState('fail'); }
    };
    const reset = () => { setForm(blank); setErrs({}); setState('idle'); };
    const mailFallback = `mailto:${enquiry.fallbackEmail}?subject=${encodeURIComponent(`[${form.topic}] Enquiry`)}&body=${encodeURIComponent(`${form.message}\n\n${form.name}\n${form.org}\n${form.phone}`)}`;
    const o = visit.offices[office];
    const vid = hero.video; /* optional: hero.video = { src: '/video/hero.mp4', poster: '/img/hero.jpg' } */

    return (
        <div className="cx" ref={rootRef} onMouseMove={onMove} onMouseOut={onOut} aria-label={page.title}>

            {/* HERO */}
            <section className="cx-hero cx-stack" id="top">
                {vid && <video className="cx-hero-video" src={vid.src} poster={vid.poster} autoPlay muted loop playsInline preload="auto" aria-hidden="true" />}
                <div className="cx-mesh" aria-hidden="true"><i /><i /><i /></div>
                <div className="cx-grid" aria-hidden="true" />
                <div className="cx-hero-body">
                    <div className="cx-hero-text">
                        <p className="cx-eyebrow"><span className={`cx-live ${status.open ? 'is-open' : ''}`} aria-hidden="true" />{hero.eyebrow}<time>{status.time} MYT</time></p>
                        <h1 className="cx-hero-title">
                            {hero.titleLines.map((l, i) => (
                                <span className="cx-ln" key={l}><span className={l === hero.highlight ? 'cx-hl' : ''} style={{ '--i': i }}>{l}</span></span>
                            ))}
                        </h1>
                        <p className="cx-lede cx-hero-lede">{hero.lede}</p>
                        <div className="cx-hero-cta">
                            <button className="cx-btn" onClick={() => goTo('enquiry')}>{hero.primaryButton}<Arrow /></button>
                            <button className="cx-btn cx-btn--ghost" onClick={() => goTo('people')}>{hero.secondaryButton}</button>
                        </div>
                    </div>
                    <div className="cx-radar-wrap">
                        <Radar label={hero.signalLabel} onPick={pick} />
                        <p className="cx-radar-cap">{hero.signalLabel}. Select a marker to jump to it.</p>
                    </div>
                </div>

                <div className="cx-quick">
                    <div className="cx-qcard cx-spot">
                        <span>Office status</span>
                        <strong className={status.open ? 'is-open' : ''}><i aria-hidden="true" />{status.open ? 'Open now' : 'Closed'}</strong>
                        <em>{status.text}</em>
                    </div>
                    <a className="cx-qcard cx-spot" href={href(mainEmail)}><span>Email</span><strong>{mainEmail.value}</strong><em>{mainEmail.note}</em></a>
                    <a className="cx-qcard cx-spot" href={href(mainPhone)}><span>Telephone</span><strong>{mainPhone.value}</strong><em>{mainPhone.note}</em></a>
                    <button className="cx-qcard cx-spot" onClick={() => goTo('visit')}><span>Visit</span><strong>Arau, Perlis</strong><em>See address and hours</em></button>
                </div>
            </section>

            {/* STICKY MENU */}
            <nav className="cx-subnav" aria-label="Contact sections">
                <div className="cx-subnav-scroll" ref={subRef}>
                    <ul>
                        {sections.map((s) => (
                            <li key={s.id}><a href={`#${s.id}`} className={activeSection === s.id ? 'is-active' : ''} aria-current={activeSection === s.id ? 'true' : undefined} onClick={(e) => { e.preventDefault(); goTo(s.id); }}>{s.label}</a></li>
                        ))}
                    </ul>
                    <div className="cx-ind" aria-hidden="true" />
                </div>
                <div className="cx-progress" aria-hidden="true"><span /></div>
            </nav>

            <div className="cx-ticker" aria-hidden="true">
                <div className="cx-ticker-track">{[0, 1].map((k) => <ul key={k}>{ticker.map((t) => <li key={t + k}>{t}</li>)}</ul>)}</div>
            </div>

            {/* ENQUIRY */}
            <section className="cx-sec cx-sec--light cx-stack" id="enquiry">
                <div className="cx-enq">
                    <div className="cx-enq-main">
                        <Head title={enquiry.heading} lede={enquiry.lede} />
                        <div className="cx-formwrap cx-rv" style={D(2)}>
                            {state === 'done' ? (
                                <div className="cx-done" role="status">
                                    <span className="cx-done-ico"><svg viewBox="0 0 52 52" width="64" height="64" aria-hidden="true"><circle cx="26" cy="26" r="23" fill="none" stroke="currentColor" strokeWidth="3" /><path d="M14 27l8 8 16-19" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" /></svg></span>
                                    <h3>{enquiry.success.title}</h3>
                                    <p>{enquiry.success.text}</p>
                                    <button className="cx-btn cx-btn--dark" onClick={reset}>{enquiry.success.again}<Arrow /></button>
                                </div>
                            ) : (
                                <form className="cx-form" onSubmit={submit} noValidate>
                                    <div className="cx-meter" role="progressbar" aria-valuemin="0" aria-valuemax="4" aria-valuenow={steps} aria-label="Form completion"><span style={{ transform: `scaleX(${steps / 4})` }} /></div>
                                    <fieldset className="cx-topics">
                                        <legend>What is it about?</legend>
                                        <div>{enquiry.topics.map((t) => (
                                            <label key={t} className={form.topic === t ? 'is-on' : ''}><input type="radio" name="topic" value={t} checked={form.topic === t} onChange={set('topic')} />{t}</label>
                                        ))}</div>
                                    </fieldset>
                                    <div className="cx-row">
                                        <Field id="name" err={errs.name} label="Full name" req><input id="cx-name" type="text" placeholder=" " value={form.name} onChange={set('name')} autoComplete="name" aria-invalid={!!errs.name} /></Field>
                                        <Field id="email" err={errs.email} label="Email" req><input id="cx-email" type="email" placeholder=" " value={form.email} onChange={set('email')} autoComplete="email" aria-invalid={!!errs.email} /></Field>
                                    </div>
                                    <div className="cx-row">
                                        <Field id="phone" err={errs.phone} label="Phone (optional)"><input id="cx-phone" type="tel" placeholder=" " value={form.phone} onChange={set('phone')} autoComplete="tel" aria-invalid={!!errs.phone} /></Field>
                                        <Field id="org" label="Organisation (optional)"><input id="cx-org" type="text" placeholder=" " value={form.org} onChange={set('org')} autoComplete="organization" /></Field>
                                    </div>
                                    <Field id="message" err={errs.message} label="Your message" req>
                                        <textarea id="cx-message" rows="5" placeholder=" " maxLength={enquiry.messageMax} value={form.message} onChange={set('message')} aria-invalid={!!errs.message} />
                                        <span className="cx-counter">{form.message.length} / {enquiry.messageMax}</span>
                                    </Field>
                                    <div className="cx-hp" aria-hidden="true"><label>Leave empty<input type="text" tabIndex={-1} autoComplete="off" value={form.website} onChange={set('website')} /></label></div>
                                    <label className={`cx-check ${errs.consent ? 'is-bad' : ''}`}>
                                        <input type="checkbox" checked={form.consent} onChange={set('consent')} aria-invalid={!!errs.consent} />
                                        <span className="cx-box" aria-hidden="true"><CheckIcon /></span>
                                        <span>{enquiry.consent}</span>
                                    </label>
                                    {errs.consent && <p className="cx-err" role="alert">{errs.consent}</p>}
                                    <div className="cx-form-foot">
                                        <button className={`cx-btn cx-btn--dark ${state === 'loading' ? 'is-loading' : ''}`} type="submit" disabled={state === 'loading'}>{state === 'loading' ? 'Sending…' : enquiry.button}<Arrow /></button>
                                        <a className="cx-alt" href={mailFallback}>or email us directly</a>
                                    </div>
                                    {state === 'fail' && <p className="cx-err cx-err--box" role="alert">{enquiry.fail}</p>}
                                </form>
                            )}
                        </div>
                    </div>

                    <aside className="cx-next">
                        <div className="cx-mesh" aria-hidden="true"><i /><i /><i /></div>
                        <div className="cx-next-in">
                            <h3 className="cx-next-h">{enquiry.next.title}</h3>
                            <ol>{enquiry.next.steps.map((s, i) => (
                                <li key={s.title}><strong>{i + 1}</strong><div><h4>{s.title}</h4><p>{s.text}</p></div></li>
                            ))}</ol>
                            <p className="cx-next-note">{enquiry.next.note}</p>
                        </div>
                    </aside>
                </div>
            </section>

            {/* PEOPLE */}
            <section className="cx-sec cx-sec--dark cx-stack" id="people">
                <div className="cx-mesh" aria-hidden="true"><i /><i /><i /></div>
                <div className="cx-grid" aria-hidden="true" />
                <div className="cx-pad">
                    <Head title={people.heading} lede={people.lede} />
                    <div className="cx-filters cx-rv" style={D(2)} role="tablist" aria-label="Contact areas">
                        {areas.map((a) => <button key={a} role="tab" aria-selected={area === a} className={area === a ? 'is-on' : ''} onClick={() => setArea(a)}>{a}</button>)}
                    </div>
                    <div className={`cx-people ${list.length < 3 ? 'cx-people--few' : ''}`} key={area}>
                        {list.map((p, i) => (
                            <article className="cx-person cx-spot cx-rv" style={D(i % 3)} key={p.id}>
                                <header><span className="cx-avatar" aria-hidden="true">{initials(p)}</span><span className="cx-area">{p.area}</span></header>
                                <div className="cx-pbody">
                                    <h3>{p.name}</h3>
                                    <p className="cx-role">{p.role}</p>
                                    <p className="cx-focus">{p.focus}</p>
                                </div>
                                <div className="cx-pact">
                                    <ul className="cx-lines">
                                        <li><a href={`mailto:${p.email}`}>{p.email}</a><button onClick={() => copy(`${p.id}e`, p.email)} aria-label={`Copy ${p.email}`}>{copied === `${p.id}e` ? <CheckIcon /> : <CopyIcon />}</button></li>
                                        <li><a href={`tel:${p.phone.replace(/[^\d+]/g, '')}`}>{p.phone}</a><button onClick={() => copy(`${p.id}p`, p.phone)} aria-label={`Copy ${p.phone}`}>{copied === `${p.id}p` ? <CheckIcon /> : <CopyIcon />}</button></li>
                                    </ul>
                                    <a className="cx-btn cx-btn--sm" href={`mailto:${p.email}`}>Email {p.area}<Arrow /></a>
                                </div>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            {/* DIRECT */}
            <section className="cx-sec cx-sec--yellow cx-stack" id="direct">
                <div className="cx-direct-wrap">
                    <div className="cx-pad cx-pad--head"><Head title={direct.heading} lede={direct.lede} /></div>
                    <ul className="cx-direct">
                        {direct.items.map((d) => (
                            <li key={d.id}>
                                <div className="cx-drow">
                                    <span className="cx-dlabel"><b>{d.label}</b><em>{d.note}</em></span>
                                    <a className="cx-dvalue" href={href(d)} {...(d.type === 'whatsapp' ? { target: '_blank', rel: 'noreferrer' } : {})}><span>{d.value}</span><Arrow /></a>
                                    <button className="cx-copy" onClick={() => copy(d.id, d.value)} aria-label={`Copy ${d.value}`}>{copied === d.id ? <><CheckIcon />Copied</> : <><CopyIcon />Copy</>}</button>
                                </div>
                            </li>
                        ))}
                    </ul>
                    {direct.social && direct.social.length > 0 && (
                        <div className="cx-social"><span>Follow us</span>{direct.social.map((s) => <a key={s.name} href={s.url} target="_blank" rel="noreferrer">{s.name}</a>)}</div>
                    )}
                </div>
            </section>

            {/* VISIT */}
            <section className="cx-sec cx-sec--sky cx-stack" id="visit">
                <div className="cx-visit">
                    <div className="cx-visit-l">
                        <div className="cx-mapbox">
                            <iframe key={o.id} title={`Map: ${o.name}`} loading="lazy" referrerPolicy="no-referrer-when-downgrade" src={`https://www.google.com/maps?q=${encodeURIComponent(o.mapQuery)}&output=embed`} />
                        </div>
                        <div className="cx-visit-top">
                            <Head title={visit.heading} lede={visit.lede} />
                            <div className="cx-offices" role="tablist" aria-label="Offices">
                                {visit.offices.map((x, i) => (
                                    <button key={x.id} role="tab" aria-selected={office === i} className={`cx-office cx-spot ${office === i ? 'is-on' : ''}`} onClick={() => setOffice(i)}>
                                        <span className="cx-chip">{x.tag}</span>
                                        <h3>{x.name}</h3>
                                        <address>{x.lines.map((l) => <span key={l}>{l}</span>)}</address>
                                    </button>
                                ))}
                            </div>
                            <div className="cx-office-btns">
                                <a className="cx-btn cx-btn--dark" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(o.mapQuery)}`} target="_blank" rel="noreferrer">Open in Maps<Arrow /></a>
                                <button className="cx-btn cx-btn--ghost" onClick={() => copy(o.id, o.lines.join(', '))}>{copied === o.id ? <><CheckIcon />Copied</> : <><CopyIcon />Copy address</>}</button>
                            </div>
                        </div>
                    </div>

                    <aside className="cx-hours">
                        <div className="cx-hours-head">
                            <h3>Operating hours</h3>
                            <span className={`cx-badge ${status.open ? 'is-open' : ''}`}><i aria-hidden="true" />{status.open ? 'Open now' : 'Closed now'}</span>
                        </div>
                        <p className="cx-hours-now">{status.text}</p>
                        <ul className="cx-days">
                            {visit.hours.map((h, i) => (
                                <li key={h.day} className={`${i === status.day ? 'is-today' : ''} ${h.open ? '' : 'is-closed'}`}>
                                    <span>{h.day}{i === status.day && <em>Today</em>}</span>
                                    <i className="cx-bar" aria-hidden="true">
                                        {h.open && <u style={{ left: pct(toMin(h.open)), width: `${((toMin(h.close) - toMin(h.open)) / 1440) * 100}%` }} />}
                                        {i === status.day && <s style={{ left: pct(status.min) }} />}
                                    </i>
                                    <b>{h.open ? `${to12(h.open)} – ${to12(h.close)}` : 'Closed'}</b>
                                </li>
                            ))}
                        </ul>
                        <p className="cx-hours-note">{visit.hoursNote}</p>
                        <h3 className="cx-getting">{visit.getting.title}</h3>
                        <ul className="cx-get">{visit.getting.items.map((g) => <li key={g.title}><b>{g.title}</b><span>{g.text}</span></li>)}</ul>
                    </aside>
                </div>
            </section>

            {/* CLOSING */}
            <section className="cx-sec cx-sec--blue cx-cta" id="cta">
                <div className="cx-mesh" aria-hidden="true"><i /><i /><i /></div>
                <div className="cx-grid" aria-hidden="true" />
                <div className="cx-cta-in">
                    <h2 className="cx-h cx-rv">{closing.heading}</h2>
                    <div className="cx-cta-side cx-rv" style={D(2)}>
                        <p className="cx-lede">{closing.text}</p>
                        <div className="cx-cta-btns">
                            <a className="cx-btn" href={links.opportunities}>See opportunities<Arrow /></a>
                            <a className="cx-btn cx-btn--ghost" href={links.innovation}>Innovation</a>
                            <a className="cx-btn cx-btn--ghost" href={links.media}>Media Centre</a>
                        </div>
                    </div>
                </div>
                <div className="cx-big" aria-hidden="true"><div className="cx-big-track">{[0, 1].map((k) => <span key={k}>{page.title} · {hero.signalLabel} · </span>)}</div></div>
            </section>
        </div>
    );
}

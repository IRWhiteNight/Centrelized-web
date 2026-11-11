import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Head, Link, router } from "@inertiajs/react";
import { useCollaborateContent, imgUrl } from "../../data/COEUAS-data/collaborateContent";
import { BASE } from "../../data/COEUAS-data/siteMapCOEUAS";
import "../../../css/COE-UAS-css/coe-collaborate.css";

/* ------------------------------------------------------------------
   Collaborate.jsx is layout, motion and the enquiry form logic only.
   All text, links, partners and numbers come from collaborateContent.js
   (later: the admin CMS). Pass a `content` prop to preview changes.
   The top navigation bar comes from COEUAsWebsiteLayout.
   Every class starts with "cl-" so no other page's CSS can leak in.
------------------------------------------------------------------- */

const to = (h = "/") =>
  h === "/" ? BASE : h.startsWith("/") && !h.startsWith(BASE + "/") && h !== BASE ? BASE + h : h;

const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const pad = (n) => String(n + 1).padStart(2, "0");
const D = (i) => ({ "--d": i * 90 });
const DS = (i) => ({ "--d": Math.min(i, 12) * 55 });
const norm = (x) => (typeof x === "string" ? { title: x } : x); /* plain strings are allowed in simple lists */

/* section types this page knows how to draw (see collaborateContent.js) */
const TYPES = ["reasons", "pathways", "offer", "sandbox", "roadmap", "network", "enquire"];

const Arrow = () => (
  <svg className="cl-arrow" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
    <path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/* internal pages use Inertia, external links and PDFs open in a new tab */
const isExt = (h) => /^(https?:|mailto:)|\.pdf$/i.test(h);
function Go({ href, className, style, children }) {
  return isExt(href)
    ? <a href={href} target="_blank" rel="noreferrer" className={className} style={style}>{children}</a>
    : <Link href={to(href)} className={className} style={style}>{children}</Link>;
}

/* adds .in to every .cl-rv once it scrolls into view (re-runs when the content changes) */
function useReveal(rootRef, dep) {
  useEffect(() => {
    const nodes = rootRef.current ? rootRef.current.querySelectorAll(".cl-rv:not(.in)") : [];
    if (reduced() || !("IntersectionObserver" in window)) {
      nodes.forEach((n) => n.classList.add("in"));
      return undefined;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    nodes.forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, [rootRef, dep]);
}

/* number that counts up the first time it is seen */
function Counter({ value, prefix = "", suffix = "", delay = 0 }) {
  const ref = useRef(null);
  const [v, setV] = useState(reduced() ? value : 0);
  useEffect(() => {
    if (reduced()) { setV(value); return undefined; }
    const el = ref.current;
    let raf = 0, timer = 0;
    const run = () => {
      const t0 = performance.now();
      const tick = (t) => {
        const p = Math.min(1, (t - t0) / 1300);
        setV(Math.round(value * (p === 1 ? 1 : 1 - Math.pow(2, -10 * p))));
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { io.disconnect(); timer = setTimeout(run, delay); }
    }, { threshold: 0.4 });
    io.observe(el);
    return () => { io.disconnect(); clearTimeout(timer); cancelAnimationFrame(raf); };
  }, [value, delay]);
  return <span ref={ref}>{prefix}{v}{suffix}</span>;
}

function SectionHead({ n, s }) {
  return (
    <header className="cl-head">
      <p className="cl-kicker cl-rv"><span>{pad(n)}</span>{s.eyebrow || s.label}</p>
      <h2 className="cl-h cl-rv" style={D(1)}>{s.title}</h2>
      {s.text && <p className="cl-lede cl-rv" style={D(2)}>{s.text}</p>}
    </header>
  );
}

/* ==========================================================================
   PAGE
========================================================================== */

export default function Collaborate({ content: override }) {
  const { content: c } = useCollaborateContent(override);
  const rootRef = useRef(null);
  const st = c.settings || {};

  const sections = useMemo(() => c.sections.filter((s) => s.visible !== false && TYPES.includes(s.type)), [c.sections]);
  const navList = useMemo(() => sections.filter((s) => s.nav !== false), [sections]);
  const navKey = navList.map((s) => s.id).join();
  const [active, setActive] = useState(navList[0] ? navList[0].id : "");

  /* enquiry form state lives here so a pathway card can fill it in and jump to the form */
  const enq = c.sections.find((s) => s.type === "enquire") || {};
  const [form, setForm] = useState({
    type: enq.defaultType || (enq.types && enq.types[0] ? enq.types[0].value : "general"),
    role: "", name: "", email: "", organisation: "", message: "",
  });
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState({});
  const setField = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const itemTotal = sections.reduce((t, s) => t + (s.items ? s.items.length : 0), 0);
  useReveal(rootRef, sections.map((s) => s.id).join() + "|" + itemTotal);

  /* scroll: progress bar, hero parallax, active menu item */
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    const heroEl = root.querySelector(".cl-hero");
    let raf = 0;
    const update = () => {
      raf = 0;
      const y = window.scrollY;
      const h = root.scrollHeight - window.innerHeight;
      if (y < 1100 && heroEl) heroEl.style.setProperty("--sy", `${y}`);
      root.style.setProperty("--progress", h > 0 ? Math.min(1, Math.max(0, y / h)).toFixed(4) : 0);
      const line = window.innerHeight * 0.35;
      let cur = navList[0] ? navList[0].id : "";
      navList.forEach((s) => {
        const el = document.getElementById(s.id);
        if (el && el.getBoundingClientRect().top <= line) cur = s.id;
      });
      setActive(cur);
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navKey]);

  /* open already scrolled to #anchor (navbar chips link to /coeuas/collaborate#research ...) */
  useEffect(() => {
    const jump = () => {
      const id = decodeURIComponent(window.location.hash.slice(1));
      const el = id && document.getElementById(id);
      if (el) el.scrollIntoView({ block: "start" });
    };
    const t = setTimeout(jump, 150);
    window.addEventListener("hashchange", jump);
    return () => { clearTimeout(t); window.removeEventListener("hashchange", jump); };
  }, []);

  /* keep the active menu item visible on small screens */
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const a = root.querySelector(".cl-subnav a.is-active");
    const b = root.querySelector(".cl-subnav-scroll");
    if (a && b) b.scrollTo({ left: a.offsetLeft - b.clientWidth / 2 + a.clientWidth / 2, behavior: "smooth" });
  }, [active]);

  const goTo = useCallback((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: reduced() ? "auto" : "smooth", block: "start" });
    if (window.history && window.history.replaceState) window.history.replaceState(window.history.state, "", "#" + id);
  }, []);

  /* pointer effects: magnetic buttons */
  const onMove = useCallback((e) => {
    const t = e.target;
    if (!t.closest || reduced()) return;
    const mag = t.closest(".cl-mag");
    if (mag) {
      const r = mag.getBoundingClientRect();
      mag.style.setProperty("--tx", `${((e.clientX - (r.left + r.width / 2)) * 0.22).toFixed(1)}px`);
      mag.style.setProperty("--ty", `${((e.clientY - (r.top + r.height / 2)) * 0.3).toFixed(1)}px`);
    }
  }, []);
  const onOut = useCallback((e) => {
    const t = e.target.closest && e.target.closest(".cl-mag");
    if (t && !t.contains(e.relatedTarget)) ["--tx", "--ty"].forEach((p) => t.style.removeProperty(p));
  }, []);

  /* hero numbers: "section" counts items, "section.field" counts a nested list */
  const countOf = (path) => {
    const [sid, field] = path.split(".");
    const s = c.sections.find((x) => x.id === sid);
    if (!s || !s.items) return 0;
    if (!field) return s.items.length;
    return s.items.reduce((t, it) => t + (it[field] || []).length, 0);
  };
  const stats = (c.hero.stats || []).map((s) => ({ ...s, n: s.of ? countOf(s.of) : s.value }));

  /* a pathway card fills in the form and jumps to it */
  const choosePath = (p) => {
    setSent(false);
    setForm((f) => ({ ...f, role: p.role || f.role, type: p.enquiryType || f.type }));
    goTo("enquire");
  };

  const submit = (e) => {
    e.preventDefault();
    setErrors({});
    if (!st.formEndpoint) { setSent(true); return; } /* no endpoint set yet: demo mode */
    router.post(st.formEndpoint, form, {
      preserveScroll: true,
      preserveState: true,
      onStart: () => setBusy(true),
      onFinish: () => setBusy(false),
      onSuccess: () => { setSent(true); setForm((f) => ({ ...f, name: "", email: "", organisation: "", message: "" })); },
      onError: (errs) => setErrors(errs || {}),
    });
  };

  /* ---------- the section types ---------- */
  const renderSection = (s, n) => {
    const items = s.items || [];
    switch (s.type) {
      /* three reasons + count-up figures */
      case "reasons":
        return (
          <div className="cl-wrap">
            <SectionHead n={n} s={s} />
            <div className="cl-cards cl-cards--3">
              {items.map((r, i) => (
                <article className="cl-card cl-reason cl-rv" style={D(i)} key={r.id || r.title}>
                  <h3>{r.title}</h3>
                  <p>{r.text}</p>
                </article>
              ))}
            </div>
            {s.figures && s.figures.length > 0 && (
              <div className="cl-figs cl-rv">
                {s.figures.map((f, i) => (
                  <div key={f.id || f.label}>
                    <strong><Counter value={f.to} prefix={f.prefix} suffix={f.suffix} delay={i * 120} /></strong>
                    <span>{f.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      /* one card per route: what it offers, and a button that opens the form pre-filled */
      case "pathways":
        return (
          <div className="cl-wrap">
            <SectionHead n={n} s={s} />
            <div className="cl-cards">
              {items.map((p, i) => (
                <article className="cl-card cl-path cl-rv" id={p.anchor || undefined} style={DS(i)} key={p.id}>
                  {p.tag && <span className="cl-tag">{p.tag}</span>}
                  <h3>{p.title}</h3>
                  <p>{p.text}</p>
                  {p.offers && p.offers.length > 0 && (
                    <ul className="cl-dots">{p.offers.map((o) => <li key={o}>{o}</li>)}</ul>
                  )}
                  <button type="button" className="cl-btn cl-btn--sm cl-mag" onClick={() => choosePath(p)}>{p.cta || "Send an enquiry"}<Arrow /></button>
                </article>
              ))}
            </div>
          </div>
        );

      /* offer blocks: cards or tag sets, stacked */
      case "offer":
        return (
          <div className="cl-wrap">
            <SectionHead n={n} s={s} />
            {items.map((b, bi) => (
              <div className="cl-block" id={b.anchor || undefined} key={b.id || b.label}>
                <h3 className="cl-sub cl-rv" style={D(bi)}>{b.label}</h3>
                {b.layout === "cards" ? (
                  <div className="cl-cards cl-cards--4">
                    {(b.items || []).map(norm).map((x, i) => (
                      <article className="cl-card cl-mini cl-rv" style={DS(i)} key={x.id || x.title}>
                        <h4>{x.title}</h4>
                        {x.text && <p>{x.text}</p>}
                      </article>
                    ))}
                  </div>
                ) : (
                  <ul className="cl-tags">
                    {(b.items || []).map(norm).map((x, i) => <li className="cl-rv" style={DS(i)} key={x.id || x.title}>{x.title}</li>)}
                  </ul>
                )}
              </div>
            ))}
          </div>
        );

      /* sandbox: purpose on the left, the six facilities on the right */
      case "sandbox":
        return (
          <div className="cl-wrap">
            <SectionHead n={n} s={s} />
            <div className="cl-prog">
              <div className="cl-prog-info cl-rv">
                {s.objectivesTitle && <h3 className="cl-sub">{s.objectivesTitle}</h3>}
                <ul className="cl-goals">{(s.objectives || []).map((o) => <li key={o}>{o}</li>)}</ul>
                {s.link && s.link.href && <Go href={s.link.href} className="cl-btn cl-mag">{s.link.label}<Arrow /></Go>}
              </div>
              <div>
                {s.coreLabel && <h3 className="cl-sub cl-rv">{s.coreLabel}</h3>}
                <div className="cl-nodes">
                  {items.map((x, i) => (
                    <article className="cl-card cl-mini cl-rv" style={DS(i)} key={x.id || x.title}>
                      <h4>{x.title}</h4>
                      <p>{x.text}</p>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      /* roadmap: numbered phases, the current one marked */
      case "roadmap":
        return (
          <div className="cl-wrap">
            <SectionHead n={n} s={s} />
            <ol className="cl-phases">
              {items.map((p, i) => (
                <li className={"cl-card cl-phase cl-rv" + (p.now ? " is-now" : "")} style={D(i)} key={p.id || p.name}>
                  <span className="cl-phase-n">{i + 1}</span>
                  <small>{p.period}</small>
                  <h3>{p.name}</h3>
                  <ul className="cl-plus">{(p.join || []).map((j) => <li key={j}>{j}</li>)}</ul>
                  {p.now && <span className="cl-tag cl-now">{s.nowLabel || "Current phase"}</span>}
                </li>
              ))}
            </ol>
          </div>
        );

      /* network: roles, ways we link up, and the partner names or logos */
      case "network":
        return (
          <div className="cl-wrap">
            <SectionHead n={n} s={s} />
            <div className="cl-two">
              <div className="cl-rv">
                {s.rolesTitle && <h3 className="cl-sub">{s.rolesTitle}</h3>}
                <ul className="cl-roles">
                  {(s.roles || []).map((r) => (
                    <li key={r.id || r.name}><strong>{r.name}</strong><span>{r.text}</span></li>
                  ))}
                </ul>
              </div>
              <div className="cl-rv" style={D(1)}>
                {s.channelsTitle && <h3 className="cl-sub">{s.channelsTitle}</h3>}
                <ul className="cl-tags">{(s.channels || []).map((x) => <li key={x}>{x}</li>)}</ul>
              </div>
            </div>
            {items.map((g) => (
              <div className="cl-logos cl-rv" key={g.id || g.group}>
                <h3 className="cl-sub">{g.group}</h3>
                <ul>
                  {(g.partners || []).map((p) => (
                    <li className="cl-logo" key={p.name} title={p.name}>
                      {p.logo ? <img src={imgUrl(p.logo)} alt={p.name} loading="lazy" /> : p.name}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        );

      /* enquiry: what happens next, contact lines, and the form */
      case "enquire": {
        const L = s.labels || {};
        const err = (k) => (errors[k] ? <small className="cl-err" role="alert">{errors[k]}</small> : null);
        const ct = s.contact || {};
        return (
          <div className="cl-wrap">
            <SectionHead n={n} s={s} />
            <div className="cl-enq">
              <div className="cl-enq-info cl-rv">
                {s.stepsTitle && <h3 className="cl-sub">{s.stepsTitle}</h3>}
                <ol className="cl-steps">
                  {(s.steps || []).map((x, i) => <li key={x}><b>{i + 1}</b><span>{x}</span></li>)}
                </ol>
                <address className="cl-contact">
                  {ct.organisation && <span>{ct.organisation}</span>}
                  {ct.sandbox && <span>{ct.sandbox}</span>}
                  {ct.email && <a href={`mailto:${ct.email}`}>{ct.email}</a>}
                  {ct.phone && <a href={`tel:${ct.phone.replace(/\s/g, "")}`}>{ct.phone}</a>}
                </address>
              </div>

              <div className="cl-form-card cl-rv" style={D(1)}>
                {sent ? (
                  <div className="cl-sent" role="status">
                    <svg viewBox="0 0 52 52" aria-hidden="true"><circle cx="26" cy="26" r="24" /><path d="M14 27l8 8 16-17" /></svg>
                    <h3>{s.successTitle}</h3>
                    <p>{s.successText}</p>
                    <button type="button" className="cl-btn cl-btn--sm" onClick={() => setSent(false)}>{L.another}<Arrow /></button>
                  </div>
                ) : (
                  <form onSubmit={submit}>
                    <fieldset className="cl-types">
                      <legend>{L.type}</legend>
                      {(s.types || []).map((t) => (
                        <label key={t.value} data-on={form.type === t.value}>
                          <input type="radio" name="type" value={t.value} checked={form.type === t.value} onChange={setField("type")} />
                          <span>{t.label}</span>
                        </label>
                      ))}
                    </fieldset>
                    {err("type")}
                    <label className="cl-f">
                      <span>{L.role}</span>
                      <select value={form.role} onChange={setField("role")} required>
                        <option value="">{L.rolePlaceholder}</option>
                        {(s.roles || []).map((r) => <option key={r} value={r}>{r}</option>)}
                      </select>
                      {err("role")}
                    </label>
                    <div className="cl-fields">
                      <label className="cl-f">
                        <span>{L.name}</span>
                        <input type="text" value={form.name} onChange={setField("name")} autoComplete="name" required />
                        {err("name")}
                      </label>
                      <label className="cl-f">
                        <span>{L.email}</span>
                        <input type="email" value={form.email} onChange={setField("email")} autoComplete="email" required />
                        {err("email")}
                      </label>
                    </div>
                    <label className="cl-f">
                      <span>{L.organisation}</span>
                      <input type="text" value={form.organisation} onChange={setField("organisation")} autoComplete="organization" />
                      {err("organisation")}
                    </label>
                    <label className="cl-f">
                      <span>{L.message}</span>
                      <textarea rows="5" value={form.message} onChange={setField("message")} required />
                      {err("message")}
                    </label>
                    {Object.keys(errors).length > 0 && <p className="cl-err" role="alert">{s.errorText}</p>}
                    <button type="submit" className="cl-btn cl-btn--full" disabled={busy}>
                      {busy ? L.sending : L.submit}<Arrow />
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        );
      }

      default:
        return null;
    }
  };

  const h = c.hero;
  const heroImg = imgUrl(h.image);
  const [heroFail, setHeroFail] = useState(false);
  const heroLines = Array.isArray(h.headline) ? h.headline : [h.headline];

  return (
    <div className="cl" ref={rootRef} onMouseMove={onMove} onMouseOut={onOut}>
      <Head title={c.page ? c.page.title : "Collaborate with Us | COE-UAS"} />

      {/* ===================== HERO ===================== */}
      <section className="cl-hero" id="overview">
        {heroImg && !heroFail && (
          <div className="cl-hero-media" aria-hidden="true"><img src={heroImg} alt="" loading="eager" decoding="async" onError={() => setHeroFail(true)} /></div>
        )}
        <div className="cl-grid-bg" aria-hidden="true" />

        <div className="cl-wrap cl-hero-copy">
          {h.eyebrow && <p className="cl-eyebrow"><i />{h.eyebrow}</p>}
          <h1 className="cl-title" aria-label={heroLines.join(" ")}>
            {heroLines.map((l, i) => (
              <span className="cl-ln" key={l}><span className={l === h.highlight ? "cl-hl" : ""} style={{ "--i": i }}>{l}</span></span>
            ))}
          </h1>
          <p className="cl-hero-lede">{h.lead}</p>
          <div className="cl-hero-cta">
            {h.primary && <button className="cl-btn cl-mag" onClick={() => goTo(h.primary.target)}>{h.primary.label}<Arrow /></button>}
            {h.secondary && <button className="cl-btn cl-btn--ghost cl-mag" onClick={() => goTo(h.secondary.target)}>{h.secondary.label}<Arrow /></button>}
          </div>
          {h.chips && h.chips.length > 0 && <ul className="cl-chips">{h.chips.map((x) => <li key={x}>{x}</li>)}</ul>}
        </div>

        {stats.length > 0 && (
          <div className="cl-wrap cl-glance">
            <div className="cl-glance-bar">
              <span>At a glance</span>
              {h.caption && <span><b>{h.caption.place}</b> &middot; {h.caption.note}</span>}
            </div>
            <div className="cl-glance-grid">
              {stats.map((s, i) => (
                <div className="cl-gl" key={s.label}>
                  <strong>{typeof s.n === "number" ? <Counter value={s.n} delay={900 + i * 100} /> : s.n}</strong>
                  <span className="cl-gl-label">{s.label}</span>
                  {s.note && <p className="cl-gl-note">{s.note}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ===================== STICKY MENU ===================== */}
      {navList.length > 0 && (
        <nav className="cl-subnav" aria-label="Collaborate sections">
          <div className="cl-wrap cl-subnav-scroll">
            <ul>
              {navList.map((s) => (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    className={active === s.id ? "is-active" : ""}
                    aria-current={active === s.id ? "true" : undefined}
                    onClick={(e) => { e.preventDefault(); goTo(s.id); }}
                  >{s.label || s.title}</a>
                </li>
              ))}
            </ul>
          </div>
          <div className="cl-progress" aria-hidden="true"><span /></div>
        </nav>
      )}

      {/* ===================== SECTIONS ===================== */}
      {sections.map((s) => {
        const idx = Math.max(0, navList.findIndex((x) => x.id === s.id));
        return (
          <section key={s.id} id={s.id} className={`cl-sec cl-${s.tone || "dark"} cl-sec-${s.type}`}>
            {renderSection(s, idx)}
          </section>
        );
      })}
    </div>
  );
}

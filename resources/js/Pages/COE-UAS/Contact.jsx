import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { router } from "@inertiajs/react";
import { useContactContent } from "../../data/COEUAS-data/contactContent";

/* people.css supplies the shared design system (tones, hero, sticky menu, buttons, reveal).
   coe-contact.css adds the contact-only pieces. Keep both imports, in this order. */
import "../../../css/COE-UAS-css/coe-contact.css";

/* ------------------------------------------------------------------
   Contact.jsx is layout and motion only.
   All text, links, routes, locations and FAQs come from contactContent.js
   (later: the admin CMS). Pass a `content` prop to preview changes.
   The top navigation bar comes from COEUAsWebsiteLayout.
------------------------------------------------------------------- */

const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const pad = (n) => String(n + 1).padStart(2, "0");
const D = (i) => ({ "--d": i * 90 });

const Arrow = () => (
  <svg className="pp-arrow" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
    <path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/* adds .in to every .pp-rv once it scrolls into view */
function useReveal(rootRef, dep) {
  useEffect(() => {
    const nodes = rootRef.current ? rootRef.current.querySelectorAll(".pp-rv:not(.in)") : [];
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
function Counter({ value, delay = 0 }) {
  const ref = useRef(null);
  const [v, setV] = useState(reduced() ? value : 0);
  useEffect(() => {
    if (reduced()) { setV(value); return undefined; }
    const el = ref.current;
    let raf = 0, timer = 0;
    const run = () => {
      const t0 = performance.now();
      const tick = (t) => {
        const p = Math.min(1, (t - t0) / 1200);
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
  return <span ref={ref}>{v}</span>;
}

function Head({ n, label, title, lede }) {
  return (
    <header className="pp-head">
      <p className="pp-kicker pp-rv"><span>{pad(n)}</span>{label}</p>
      <h2 className="pp-h pp-rv" style={D(1)}>{title}</h2>
      {lede && <p className="pp-lede pp-rv" style={D(2)}>{lede}</p>}
    </header>
  );
}

const hrefFor = (c) => {
  if (c.kind === "email") return `mailto:${c.value}`;
  if (c.kind === "phone") return `tel:${c.value.replace(/[^\d+]/g, "")}`;
  if (c.kind === "link") return c.value;
  return "";
};

/* ==========================================================================
   PAGE
========================================================================== */

export default function Contact({ content: override }) {
  const { content: c } = useContactContent(override);
  const rootRef = useRef(null);
  const nameRef = useRef(null);

  const types = c.enquiryTypes || [];
  const channels = (c.details.channels || []).filter((x) => x.value);
  const hours = c.details.hours || [];
  const locs = c.locations.items || [];
  const faqs = c.faq.items || [];
  const L = c.form.labels;

  const [form, setForm] = useState(() => ({
    type: c.form.defaultType || (types[0] && types[0].id) || "general",
    name: "", email: "", phone: "", organisation: "", subject: "", message: "",
  }));
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState({});
  const [copied, setCopied] = useState("");
  const [tab, setTab] = useState(0);

  /* sections that can be drawn, in the order set in contactContent.js.
     A section without data is skipped, so nothing empty ever shows. */
  const can = { hero: true, routes: types.length > 0, form: true, details: true, locations: locs.length > 0, faq: faqs.length > 0 };
  const list = c.sections.filter((s) => s.visible && can[s.id]);
  const heroSec = list.find((s) => s.id === "hero");
  const rest = list.filter((s) => s.id !== "hero");
  const navList = rest.filter((s) => s.nav !== false);
  const navKey = navList.map((s) => s.id).join();
  const [active, setActive] = useState(navList[0] ? navList[0].id : "");

  useReveal(rootRef, list.map((s) => s.id).join() + "|" + types.length + "|" + channels.length + "|" + faqs.length);

  /* scroll: progress bar, hero parallax, active menu item */
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    let raf = 0;
    const update = () => {
      raf = 0;
      const y = window.scrollY;
      const h = root.scrollHeight - window.innerHeight;
      root.style.setProperty("--progress", h > 0 ? Math.min(1, Math.max(0, y / h)).toFixed(4) : 0);
      const line = window.innerHeight * 0.35;
      let cur = navList[0] ? navList[0].id : "";
      navList.forEach((s) => {
        const el = document.getElementById("contact-" + s.id);
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

  /* keep the active menu item visible on small screens */
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const a = root.querySelector(".pp-subnav a.is-active");
    const box = root.querySelector(".pp-subnav-scroll");
    if (a && box) box.scrollTo({ left: a.offsetLeft - box.clientWidth / 2 + a.clientWidth / 2, behavior: "smooth" });
  }, [active]);

  const goTo = useCallback((id) => {
    const el = document.getElementById("contact-" + id);
    if (el) el.scrollIntoView({ behavior: reduced() ? "auto" : "smooth", block: "start" });
  }, []);

  /* site-map links such as /coeuas/contact#research-enquiry land on the right place */
  useEffect(() => {
    const go = () => {
      const id = decodeURIComponent(window.location.hash.slice(1));
      const el = id && document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: reduced() ? "auto" : "smooth", block: "start" });
    };
    const t = setTimeout(go, 350);
    window.addEventListener("hashchange", go);
    return () => { clearTimeout(t); window.removeEventListener("hashchange", go); };
  }, []);

  /* magnetic buttons */
  const onMove = useCallback((e) => {
    const t = e.target;
    if (!t.closest || reduced()) return;
    const mag = t.closest(".pp-mag");
    if (mag) {
      const r = mag.getBoundingClientRect();
      mag.style.setProperty("--tx", `${((e.clientX - (r.left + r.width / 2)) * 0.22).toFixed(1)}px`);
      mag.style.setProperty("--ty", `${((e.clientY - (r.top + r.height / 2)) * 0.3).toFixed(1)}px`);
    }
  }, []);
  const onOut = useCallback((e) => {
    const t = e.target.closest && e.target.closest(".pp-mag");
    if (t && !t.contains(e.relatedTarget)) ["--tx", "--ty"].forEach((p) => t.style.removeProperty(p));
  }, []);

  /* ---------- actions ---------- */
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const err = (k) => (errors[k] ? <small className="ct-err" role="alert">{errors[k]}</small> : null);

  const pickType = (id) => {
    setForm((f) => ({ ...f, type: id }));
    setSent(false);
    goTo("form");
    setTimeout(() => nameRef.current && nameRef.current.focus({ preventScroll: true }), reduced() ? 50 : 700);
  };

  const submit = (e) => {
    e.preventDefault();
    setErrors({});
    if (!c.settings.formEndpoint) { setSent(true); return; }
    router.post(c.settings.formEndpoint, form, {
      preserveScroll: true,
      preserveState: true,
      onStart: () => setBusy(true),
      onFinish: () => setBusy(false),
      onSuccess: () => {
        setSent(true);
        setForm((f) => ({ ...f, name: "", email: "", phone: "", organisation: "", subject: "", message: "" }));
      },
      onError: (errs) => setErrors(errs || {}),
    });
  };

  const copy = async (ch) => {
    try { await navigator.clipboard.writeText(ch.value); } catch { /* clipboard blocked: ignore */ }
    setCopied(ch.id);
    setTimeout(() => setCopied((v) => (v === ch.id ? "" : v)), 1600);
  };

  /* ---------- derived ---------- */
  const current = types.find((t) => t.id === form.type) || types[0];
  const counts = { routes: types.length, locations: locs.length, channels: channels.length };
  const h = c.hero;
  const heroLines = Array.isArray(h.headline) ? h.headline : [h.headline];
  const stats = (h.stats || [])
    .map((s) => (s.count ? { ...s, n: counts[s.count] || 0 } : s))
    .filter((s) => (s.count ? s.n > 0 : !!s.text));
  const loc = locs[Math.min(tab, Math.max(0, locs.length - 1))];

  /* ---------- the sections ---------- */
  const SECTIONS = {
    routes: (n) => {
      const r = c.routes;
      return (
        <div className="pp-wrap">
          <Head n={n} label={r.eyebrow || r.title} title={r.title} lede={r.text} />
          <div className="ct-routes">
            {types.map((t, i) => (
              <article className="ct-route pp-rv" id={t.anchor || undefined} style={D(i)} key={t.id}>
                <span className="ct-route-n" aria-hidden="true">{pad(i)}</span>
                <h3>{t.title}</h3>
                <p>{t.text}</p>
                {t.includes && t.includes.length > 0 && (
                  <ul className="ct-list">{t.includes.map((x) => <li key={x}>{x}</li>)}</ul>
                )}
                {(t.reply || t.email) && (
                  <dl className="ct-meta">
                    {t.reply && <div><dt>{L.replyLabel}</dt><dd>{t.reply}</dd></div>}
                    {t.email && <div><dt>{L.teamLabel}</dt><dd><a href={`mailto:${t.email}`}>{t.email}</a></dd></div>}
                  </dl>
                )}
                <button type="button" className="pp-btn pp-mag ct-cta" onClick={() => pickType(t.id)}>{t.cta}<Arrow /></button>
              </article>
            ))}
          </div>
        </div>
      );
    },

    form: (n) => {
      const f = c.form;
      return (
        <div className="pp-wrap">
          <Head n={n} label={f.eyebrow || f.title} title={f.title} lede={f.text} />
          <div className="ct-form-grid">
            <aside className="ct-aside pp-rv">
              {f.steps && f.steps.length > 0 && (
                <div>
                  <h3 className="ct-aside-t">{f.stepsTitle}</h3>
                  <ol className="ct-steps">
                    {f.steps.map((s) => (
                      <li key={s.title}><b>{s.title}</b><span>{s.text}</span></li>
                    ))}
                  </ol>
                </div>
              )}
              {f.note && <p className="ct-note">{f.note}</p>}
              <p className="ct-direct">
                {f.directLabel}{" "}
                <button type="button" className="pp-link" onClick={() => goTo("details")}>{f.directCta}</button>
              </p>
            </aside>

            <div className="ct-card ct-formcard pp-rv" style={D(2)}>
              {sent ? (
                <div className="ct-sent" role="status">
                  <svg viewBox="0 0 52 52" aria-hidden="true"><circle cx="26" cy="26" r="24" /><path d="M14 27l8 8 16-17" /></svg>
                  <h3>{f.successTitle}</h3>
                  <p>{f.successText}</p>
                  <button type="button" className="pp-btn pp-mag" onClick={() => setSent(false)}>{L.another}<Arrow /></button>
                </div>
              ) : (
                <form onSubmit={submit}>
                  <fieldset className="ct-types">
                    <legend>{L.type}</legend>
                    {types.map((t) => (
                      <label key={t.id} data-on={form.type === t.id}>
                        <input type="radio" name="type" value={t.id} checked={form.type === t.id} onChange={set("type")} />
                        <span>{t.short || t.title}</span>
                      </label>
                    ))}
                  </fieldset>

                  {current && (
                    <div className="ct-hint" aria-live="polite">
                      <b>{current.title}</b>
                      <span>{current.text}</span>
                      {current.reply && <em>{L.replyLabel}: {current.reply}</em>}
                    </div>
                  )}

                  <div className="ct-two">
                    <label className="ct-f"><span>{L.name}</span>
                      <input ref={nameRef} type="text" value={form.name} onChange={set("name")} autoComplete="name" required />{err("name")}</label>
                    <label className="ct-f"><span>{L.email}</span>
                      <input type="email" value={form.email} onChange={set("email")} autoComplete="email" required />{err("email")}</label>
                  </div>
                  <div className="ct-two">
                    <label className="ct-f"><span>{L.phone}</span>
                      <input type="tel" value={form.phone} onChange={set("phone")} autoComplete="tel" />{err("phone")}</label>
                    <label className="ct-f"><span>{L.organisation}</span>
                      <input type="text" value={form.organisation} onChange={set("organisation")} autoComplete="organization" />{err("organisation")}</label>
                  </div>
                  <label className="ct-f"><span>{L.subject}</span>
                    <input type="text" value={form.subject} onChange={set("subject")} required />{err("subject")}</label>
                  <label className="ct-f"><span>{L.message}</span>
                    <textarea rows="5" value={form.message} onChange={set("message")} required />{err("message")}</label>

                  {Object.keys(errors).length > 0 && <p className="ct-err ct-err--box" role="alert">{f.errorText}</p>}
                  <button type="submit" className="pp-btn ct-submit" disabled={busy}>{busy ? L.sending : L.submit}<Arrow /></button>
                </form>
              )}
            </div>
          </div>
        </div>
      );
    },

    details: (n) => {
      const d = c.details;
      return (
        <div className="pp-wrap">
          <Head n={n} label={d.eyebrow || d.title} title={d.title} lede={d.text} />
          {d.organisation && <p className="ct-org pp-rv">{d.organisation}</p>}
          <div className={`ct-details-grid ${hours.length ? "has-hours" : ""}`}>
            {channels.length === 0 ? (
              <p className="ct-empty pp-rv">{d.fallback}</p>
            ) : (
              <ul className="ct-channels">
                {channels.map((ch, i) => {
                  const href = hrefFor(ch);
                  const canCopy = ch.kind === "email" || ch.kind === "phone";
                  const open = d.openLabels && d.openLabels[ch.kind];
                  return (
                    <li className="ct-chan pp-rv" style={D(i)} key={ch.id || ch.label}>
                      <span className="ct-chan-k">{ch.label}</span>
                      {href
                        ? <a className="ct-chan-v" href={href} {...(ch.kind === "link" ? { target: "_blank", rel: "noreferrer" } : {})}>{ch.value}</a>
                        : <strong className="ct-chan-v">{ch.value}</strong>}
                      {ch.hint && <p>{ch.hint}</p>}
                      {(href || canCopy) && (
                        <div className="ct-chan-act">
                          {href && <a className="ct-chip" href={href} {...(ch.kind === "link" ? { target: "_blank", rel: "noreferrer" } : {})}>{open}</a>}
                          {canCopy && (
                            <button type="button" className="ct-chip" onClick={() => copy(ch)} aria-label={`${d.copyLabel} ${ch.label}`}>
                              {copied === ch.id ? d.copiedLabel : d.copyLabel}
                            </button>
                          )}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
            {hours.length > 0 && (
              <aside className="ct-card ct-hours pp-rv" style={D(2)}>
                <h3>{d.hoursTitle}</h3>
                <dl>
                  {hours.map((x) => (
                    <div key={x.day}><dt>{x.day}</dt><dd>{x.time}</dd></div>
                  ))}
                </dl>
              </aside>
            )}
          </div>
        </div>
      );
    },

    locations: (n) => {
      const l = c.locations;
      return (
        <div className="pp-wrap">
          <Head n={n} label={l.eyebrow || l.title} title={l.title} lede={l.text} />
          {locs.length > 1 && (
            <div className="ct-tabs pp-rv" role="tablist" aria-label={l.title}>
              {locs.map((x, i) => (
                <button type="button" role="tab" key={x.id || x.name} aria-selected={tab === i} className={tab === i ? "is-on" : ""} onClick={() => setTab(i)}>{x.name}</button>
              ))}
            </div>
          )}
          {loc && (
            <div className="ct-loc-grid">
              <div className="ct-card ct-loc pp-pop" key={`i${tab}`}>
                <h3>{loc.name}</h3>
                {loc.role && <p className="ct-role">{loc.role}</p>}
                {(loc.lines || []).filter(Boolean).map((x) => <p key={x} className="ct-addr">{x}</p>)}
                {loc.tips && loc.tips.length > 0 && (
                  <div className="ct-tips">
                    <b>{l.tipsTitle}</b>
                    <ul className="ct-list">{loc.tips.map((x) => <li key={x}>{x}</li>)}</ul>
                  </div>
                )}
                {l.visitNote && <p className="ct-note">{l.visitNote}</p>}
                {loc.directions && (
                  <a className="pp-btn pp-mag ct-cta" href={loc.directions} target="_blank" rel="noreferrer">{l.directionsLabel}<Arrow /></a>
                )}
              </div>
              <div className="ct-map pp-pop" key={`m${tab}`} style={D(1)}>
                {loc.embed ? (
                  <iframe title={loc.name} src={loc.embed} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
                ) : (
                  <div className="ct-pin" aria-hidden="true">
                    <i /><i style={{ animationDelay: "1s" }} /><b />
                    <span>{loc.name}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      );
    },

    faq: (n) => {
      const q = c.faq;
      return (
        <div className="pp-wrap">
          <Head n={n} label={q.eyebrow || q.title} title={q.title} lede={q.text} />
          <div className="ct-faq">
            {faqs.map((f, i) => (
              <details className="ct-q pp-rv" style={D(Math.min(i, 6))} key={f.id || f.q}>
                <summary><span>{f.q}</span><i aria-hidden="true" /></summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      );
    },
  };

  return (
    <div className="pp ct" ref={rootRef} onMouseMove={onMove} onMouseOut={onOut}>

      {/* ===================== HERO ===================== */}
      {heroSec && (
        <section className="pp-hero" id="contact-hero">
          <div className="pp-grid-bg" aria-hidden="true" />
          <div className="pp-wrap pp-hero-copy">
            {h.eyebrow && <p className="pp-eyebrow"><i />{h.eyebrow}</p>}
            <h1 className="pp-title" aria-label={heroLines.join(" ")}>
              {heroLines.map((l, i) => (
                <span className="pp-ln" key={l}><span className={l === h.highlight ? "pp-hl" : ""} style={{ "--i": i }}>{l}</span></span>
              ))}
            </h1>
            <p className="pp-hero-lede">{h.lead}</p>
            <div className="pp-hero-cta">
              <button type="button" className="pp-btn pp-mag" onClick={() => goTo(h.primary.target)}>{h.primary.label}<Arrow /></button>
              <button type="button" className="pp-btn pp-btn--ghost pp-mag" onClick={() => goTo(h.secondary.target)}>{h.secondary.label}<Arrow /></button>
            </div>
          </div>

          {stats.length > 0 && (
            <div className="pp-wrap pp-glance">
              <div className="pp-glance-bar">
                <span>At a glance</span>
                {h.caption && <span><b>{h.caption.place}</b> &middot; {h.caption.note}</span>}
              </div>
              <div className="pp-glance-grid">
                {stats.map((s, i) => (
                  <div className="pp-gl" key={s.label}>
                    <strong className={s.count ? "" : "ct-txt"}>
                      {s.count ? <Counter value={s.n} delay={900 + i * 100} /> : s.text}
                    </strong>
                    <span className="pp-gl-label">{s.label}</span>
                    {s.note && <p className="pp-gl-note">{s.note}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* ===================== STICKY MENU ===================== */}
      {navList.length > 0 && (
        <nav className="pp-subnav" aria-label="Contact sections">
          <div className="pp-wrap pp-subnav-scroll">
            <ul>
              {navList.map((s) => (
                <li key={s.id}>
                  <a
                    href={`#contact-${s.id}`}
                    className={active === s.id ? "is-active" : ""}
                    aria-current={active === s.id ? "true" : undefined}
                    onClick={(e) => { e.preventDefault(); goTo(s.id); }}
                  >{s.label}</a>
                </li>
              ))}
            </ul>
          </div>
          <div className="pp-progress" aria-hidden="true"><span /></div>
        </nav>
      )}

      {/* ===================== SECTIONS ===================== */}
      {rest.map((s) => {
        const render = SECTIONS[s.id];
        if (!render) return null;
        const idx = Math.max(0, navList.findIndex((x) => x.id === s.id));
        return (
          <section key={s.id} id={"contact-" + s.id} className={`pp-sec pp-${s.tone || "dark"} pp-sec-${s.id}`}>
            {s.anchor && <span id={s.anchor} className="ct-anchor" />}
            {render(idx)}
          </section>
        );
      })}
    </div>
  );
}

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@inertiajs/react";
import { useFacilitiesContent, imgUrl } from "../../data/COEUAS-data/facilitiesContent";
import { BASE } from "../../data/COEUAS-data/siteMapCOEUAS";
import "../../../css/COE-UAS-css/facilities.css";

/* ------------------------------------------------------------------
   Facilities.jsx is layout and motion only.
   All text, links, images and numbers come from facilitiesContent.js
   (later: the admin CMS). Pass a `content` prop to preview changes.
   The top navigation bar comes from COEUAsWebsiteLayout.
   Every class starts with "fx-" so no other page's CSS can leak in.
------------------------------------------------------------------- */

const to = (h = "/") =>
  h === "/" ? BASE : h.startsWith("/") && !h.startsWith(BASE + "/") && h !== BASE ? BASE + h : h;

const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const pad = (n) => String(n + 1).padStart(2, "0");
const D = (i) => ({ "--d": i * 90 });
const DS = (i) => ({ "--d": Math.min(i, 12) * 55 });

/* section types this page knows how to draw (see facilitiesContent.js) */
const TYPES = ["cards", "programme", "steps", "tiles", "list", "cta"];

const ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="9" cy="11" r="2" /><path d="m21 16-5-5-8 8" /></svg>
);

const Arrow = () => (
  <svg className="fx-arrow" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
    <path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/* adds .in to every .fx-rv once it scrolls into view (re-runs when the content changes) */
function useReveal(rootRef, dep) {
  useEffect(() => {
    const nodes = rootRef.current ? rootRef.current.querySelectorAll(".fx-rv:not(.in)") : [];
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
  return <span ref={ref}>{v}</span>;
}

/* One image slot: the picture when it exists, otherwise a placeholder. */
function Media({ src: file, alt = "", hints, className = "" }) {
  const src = imgUrl(file);
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  const live = !!src && !failed;
  return (
    <div className={`fx-media ${className} ${live ? "is-live" : "is-empty"}`}>
      {live ? (
        <img src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} />
      ) : (
        <div className={`fx-ph ${hints ? "" : "quiet"}`}>
          <span className="fx-ph-ic">{ICON}</span>
          {hints && <b>Photo slot</b>}
          {hints && file && <code>{file}</code>}
        </div>
      )}
    </div>
  );
}

function Head({ n, s, stack }) {
  return (
    <header className={"fx-head" + (stack ? " fx-head--stack" : "")}>
      <p className="fx-kicker fx-rv"><span>{pad(n)}</span>{s.eyebrow || s.label}</p>
      <h2 className="fx-h fx-rv" style={D(1)}>{s.title}</h2>
      {s.text && <p className="fx-lede fx-rv" style={D(2)}>{s.text}</p>}
    </header>
  );
}

/* a link when the item has an href, plain information when it has not */
function Card({ item, className, style, children }) {
  const props = { className, style, id: item.anchor || undefined };
  return item.href
    ? <Link href={to(item.href)} {...props}>{children}</Link>
    : <div {...props}>{children}</div>;
}

/* ==========================================================================
   PAGE
========================================================================== */

export default function Facilities({ content: override }) {
  const { content: c } = useFacilitiesContent(override);
  const rootRef = useRef(null);

  const hints = c.settings ? c.settings.showSlotHints !== false : true;
  const sections = useMemo(() => c.sections.filter((s) => s.visible !== false && TYPES.includes(s.type)), [c.sections]);
  const navList = useMemo(() => sections.filter((s) => s.nav !== false && s.type !== "cta"), [sections]);
  const navKey = navList.map((s) => s.id).join();
  const [active, setActive] = useState(navList[0] ? navList[0].id : "");

  const itemTotal = sections.reduce((t, s) => t + (s.items ? s.items.length : 0), 0);
  useReveal(rootRef, sections.map((s) => s.id).join() + "|" + itemTotal);

  /* scroll: progress bar, hero parallax, active menu item */
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    const heroEl = root.querySelector(".fx-hero");
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

  /* open the page already scrolled to #anchor (navbar chips link to /coeuas/facilities#laboratories ...) */
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
    const a = root.querySelector(".fx-subnav a.is-active");
    const box = root.querySelector(".fx-subnav-scroll");
    if (a && box) box.scrollTo({ left: a.offsetLeft - box.clientWidth / 2 + a.clientWidth / 2, behavior: "smooth" });
  }, [active]);

  const goTo = useCallback((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: reduced() ? "auto" : "smooth", block: "start" });
    if (window.history && window.history.replaceState) window.history.replaceState(null, "", "#" + id);
  }, []);

  /* pointer effects: magnetic buttons + hero glow */
  const onMove = useCallback((e) => {
    const t = e.target;
    if (!t.closest || reduced()) return;
    const mag = t.closest(".fx-mag");
    if (mag) {
      const r = mag.getBoundingClientRect();
      mag.style.setProperty("--tx", `${((e.clientX - (r.left + r.width / 2)) * 0.22).toFixed(1)}px`);
      mag.style.setProperty("--ty", `${((e.clientY - (r.top + r.height / 2)) * 0.3).toFixed(1)}px`);
    }
  }, []);
  const onOut = useCallback((e) => {
    const t = e.target.closest && e.target.closest(".fx-mag");
    if (t && !t.contains(e.relatedTarget)) ["--tx", "--ty"].forEach((p) => t.style.removeProperty(p));
  }, []);

  /* numbers in the hero: `of` counts the items of that section, so they never go out of date */
  const countOf = (id) => {
    const s = c.sections.find((x) => x.id === id);
    return s && s.items ? s.items.length : 0;
  };
  const stats = (c.hero.stats || []).map((s) => ({ ...s, n: s.of ? countOf(s.of) : s.value || 0 }));

  /* ---------- the section types ---------- */
  const renderSection = (s, n) => {
    const items = s.items || [];
    switch (s.type) {
      /* facility cards: picture, tag, title, text, optional spec chips */
      case "cards":
        return (
          <div className="fx-wrap">
            <Head n={n} s={s} />
            <div className="fx-cards">
              {items.map((it, i) => (
                <article className="fx-card fx-rv" id={it.anchor || undefined} style={DS(i)} key={it.id || it.title}>
                  <Media src={it.image} alt={it.title} hints={hints} className="fx-photo" />
                  <div className="fx-card-body">
                    {it.tag && <span className="fx-tag">{it.tag}</span>}
                    <h3>{it.title}</h3>
                    <p>{it.text}</p>
                    {it.specs && it.specs.length > 0 && (
                      <ul className="fx-specs">{it.specs.map((x) => <li key={x}>{x}</li>)}</ul>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </div>
        );

      /* one featured programme: key facts, picture, and what it contains */
      case "programme":
        return (
          <div className="fx-wrap">
            <Head n={n} s={s} />
            <div className="fx-prog">
              <div className="fx-prog-info fx-rv">
                <dl className="fx-facts">
                  {(s.facts || []).map((f) => (
                    <div key={f.label}><dt>{f.label}</dt><dd>{f.value}</dd></div>
                  ))}
                </dl>
                {s.link && <Link href={to(s.link.href)} className="fx-btn fx-mag">{s.link.label}<Arrow /></Link>}
              </div>
              <Media src={s.image} alt={s.title} hints={hints} className="fx-photo fx-photo--wide fx-rv" />
            </div>
            {items.length > 0 && (
              <>
                {s.partsTitle && <h3 className="fx-sub fx-rv">{s.partsTitle}</h3>}
                <ul className="fx-parts">
                  {items.map((p, i) => (
                    <li className="fx-rv" style={DS(i)} id={p.anchor || undefined} key={p.id || p.title}>
                      <b>{p.title}</b>
                      {p.text && <small>{p.text}</small>}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        );

      /* numbered stages (only for content that really is a sequence) */
      case "steps":
        return (
          <div className="fx-wrap">
            <Head n={n} s={s} />
            <ol className="fx-steps">
              {items.map((it, i) => (
                <li className="fx-step fx-rv" id={it.anchor || undefined} style={D(i)} key={it.id || it.title}>
                  <span className="fx-step-n">{i + 1}</span>
                  <h3>{it.title}</h3>
                  <p>{it.text}</p>
                  {it.points && it.points.length > 0 && (
                    <ul className="fx-points">{it.points.map((x) => <li key={x}>{x}</li>)}</ul>
                  )}
                </li>
              ))}
            </ol>
          </div>
        );

      /* grid of short cards, each one a link when it has an href */
      case "tiles":
        return (
          <div className="fx-wrap">
            <Head n={n} s={s} />
            <div className="fx-tiles">
              {items.map((it, i) => (
                <Card item={it} className={"fx-tile fx-rv" + (it.href ? " is-link" : "")} style={DS(i)} key={it.id || it.title}>
                  <h3>{it.title}</h3>
                  {it.text && <p>{it.text}</p>}
                  {it.href && <span className="fx-more">{it.cta || "Learn more"}<Arrow /></span>}
                </Card>
              ))}
            </div>
          </div>
        );

      /* heading on the left, stacked rows on the right */
      case "list":
        return (
          <div className="fx-wrap fx-split">
            <Head n={n} s={s} stack />
            <div className="fx-rows">
              {items.map((it, i) => (
                <Card item={it} className={"fx-row fx-rv" + (it.href ? " is-link" : "")} style={D(i)} key={it.id || it.title}>
                  <span className="fx-row-t"><b>{it.title}</b>{it.text && <small>{it.text}</small>}</span>
                  {it.href && <span className="fx-more">{it.cta || "Open"}<Arrow /></span>}
                </Card>
              ))}
            </div>
          </div>
        );

      case "cta":
        return (
          <div className="fx-wrap">
            <div className="fx-cta-in">
              <div>
                <h2 className="fx-h fx-rv">{s.title}</h2>
                {s.text && <p className="fx-lede fx-rv" style={D(1)}>{s.text}</p>}
                {s.footer && <p className="fx-foot fx-rv" style={D(2)}>{s.footer}</p>}
              </div>
              <div className="fx-cta-links fx-rv" style={D(2)}>
                {items.map((it, i) => (
                  <Link href={to(it.href)} className="fx-cta-link fx-mag" key={it.id || it.title}>
                    <span className="fx-cta-n">{pad(i)}</span>
                    <span className="fx-cta-t"><b>{it.title}</b>{it.text && <small>{it.text}</small>}</span>
                    <Arrow />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const h = c.hero;
  const heroImg = imgUrl(h.image);
  const [heroFail, setHeroFail] = useState(false);
  const heroLines = Array.isArray(h.headline) ? h.headline : [h.headline];

  return (
    <div className="fx" ref={rootRef} onMouseMove={onMove} onMouseOut={onOut}>

      {/* ===================== HERO ===================== */}
      <section className="fx-hero" id="overview">
        {heroImg && !heroFail && (
          <div className="fx-hero-media" aria-hidden="true"><img src={heroImg} alt="" loading="eager" decoding="async" onError={() => setHeroFail(true)} /></div>
        )}
        <div className="fx-grid-bg" aria-hidden="true" />

        <div className="fx-wrap fx-hero-copy">
          {h.eyebrow && <p className="fx-eyebrow"><i />{h.eyebrow}</p>}
          <h1 className="fx-title" aria-label={heroLines.join(" ")}>
            {heroLines.map((l, i) => (
              <span className="fx-ln" key={l}><span className={l === h.highlight ? "fx-hl" : ""} style={{ "--i": i }}>{l}</span></span>
            ))}
          </h1>
          <p className="fx-hero-lede">{h.lead}</p>
          <div className="fx-hero-cta">
            {h.primary && <button className="fx-btn fx-mag" onClick={() => goTo(h.primary.target)}>{h.primary.label}<Arrow /></button>}
            {h.secondary && <Link className="fx-btn fx-btn--ghost fx-mag" href={to(h.secondary.href)}>{h.secondary.label}<Arrow /></Link>}
          </div>
        </div>

        {stats.length > 0 && (
          <div className="fx-wrap fx-glance">
            <div className="fx-glance-bar">
              <span>At a glance</span>
              {h.caption && <span><b>{h.caption.place}</b> &middot; {h.caption.note}</span>}
            </div>
            <div className="fx-glance-grid">
              {stats.map((s, i) => (
                <div className="fx-gl" key={s.label}>
                  <strong><Counter value={s.n} delay={900 + i * 100} /></strong>
                  <span className="fx-gl-label">{s.label}</span>
                  {s.note && <p className="fx-gl-note">{s.note}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ===================== STICKY MENU ===================== */}
      {navList.length > 0 && (
        <nav className="fx-subnav" aria-label="Facilities sections">
          <div className="fx-wrap fx-subnav-scroll">
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
          <div className="fx-progress" aria-hidden="true"><span /></div>
        </nav>
      )}

      {/* ===================== SECTIONS ===================== */}
      {sections.map((s) => {
        const idx = Math.max(0, navList.findIndex((x) => x.id === s.id));
        return (
          <section key={s.id} id={s.id} className={`fx-sec fx-${s.tone || "dark"} fx-sec-${s.type}`}>
            {renderSection(s, idx)}
          </section>
        );
      })}
    </div>
  );
}

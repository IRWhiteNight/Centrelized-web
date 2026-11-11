import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@inertiajs/react";
import { useAboutContent } from "../../data/COEUAS-data/aboutContent";
import { BASE } from "../../data/COEUAS-data/siteMapCOEUAS";
import "../../../css/COE-UAS-css/about.css";

/* ------------------------------------------------------------------
   About.jsx = layout and motion only. No text lives here.
   Place at: resources/js/Pages/COEUAS/About.jsx
   All content comes from aboutContent.js (later: the CMS).

   Same structure as the People page: hero + sticky section menu +
   ticker + full-width sections made of blocks.

   ADDING A NEW BLOCK TYPE: write one small component below and add it
   to the BLOCKS map. Nothing else changes.
------------------------------------------------------------------- */

const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const D = (i) => ({ "--d": i * 80 });
const pad = (n) => String(n + 1).padStart(2, "0");
const ok = (x) => x && x.visible !== false;
const list = (a) => (Array.isArray(a) ? a.filter(ok) : []);
const plain = (t = "") => t.replace(/\*/g, "");

/* stable React key: the item's id when it has one */
const keyOf = (x, i) => {
  if (x && x.id) return x.id;
  const label = typeof x === "string" ? x : x && (x.title || x.label || x.name || x.tab || x.year);
  return `${label || ""}-${i}`;
};

/* "/people" -> "/coeuas/people"; full URLs and anchors stay as they are */
const isExternal = (h = "") => /^(https?:|mailto:|tel:|#)/.test(h);
const to = (h = "/") => {
  if (!h || h === "/") return BASE;
  if (isExternal(h)) return h;
  return h.startsWith(BASE + "/") || h === BASE ? h : BASE + (h.startsWith("/") ? h : "/" + h);
};

function A({ href, className, children, ...rest }) {
  const h = to(href);
  return isExternal(h)
    ? <a href={h} className={className} {...rest}>{children}</a>
    : <Link href={h} className={className} {...rest}>{children}</Link>;
}

/* *accent* words in a title */
const Title = ({ text = "" }) => text.split("*").map((p, i) => (i % 2 ? <em key={i}>{p}</em> : p));

const Arrow = () => (
  <svg className="ab-arrow" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
    <path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/* adds .in to every .ab-rv once it scrolls into view (re-runs when sections change) */
function useReveal(rootRef, dep) {
  useEffect(() => {
    const nodes = rootRef.current ? rootRef.current.querySelectorAll(".ab-rv:not(.in)") : [];
    if (reduced() || !("IntersectionObserver" in window)) {
      nodes.forEach((n) => n.classList.add("in"));
      return undefined;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.08, rootMargin: "0px 0px -5% 0px" });
    nodes.forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, [rootRef, dep]);
}

/* number that counts up the first time it is seen */
function Counter({ value, suffix = "", delay = 0 }) {
  const target = Number(value) || 0;
  const ref = useRef(null);
  const [v, setV] = useState(reduced() ? target : 0);
  const dec = (String(target).split(".")[1] || "").length;
  useEffect(() => {
    if (reduced()) { setV(target); return undefined; }
    let raf = 0, timer = 0;
    const run = () => {
      const t0 = performance.now();
      const tick = (t) => {
        const p = Math.min(1, (t - t0) / 1500);
        setV(target * (p === 1 ? 1 : 1 - Math.pow(2, -10 * p)));
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { io.disconnect(); timer = setTimeout(run, delay); }
    }, { threshold: 0.4 });
    io.observe(ref.current);
    return () => { io.disconnect(); clearTimeout(timer); cancelAnimationFrame(raf); };
  }, [target, delay]);
  return <span ref={ref}>{dec ? v.toFixed(dec) : Math.round(v)}{suffix && <small>{suffix}</small>}</span>;
}

/* a statistic: text as written, a plain number (years), or a count-up */
function Num({ s, delay = 0 }) {
  if (s.text) return <>{s.text}</>;
  if (s.plain) return <>{s.n}{s.suffix && <small>{s.suffix}</small>}</>;
  return <Counter value={s.n} suffix={s.suffix} delay={delay} />;
}

/* Image slot: shows the file, or a neutral placeholder while it is missing. */
function Pic({ file, alt, className = "", ratio, base, hints }) {
  const [bad, setBad] = useState(false);
  useEffect(() => setBad(false), [file]);
  const src = file ? (/^(https?:|\/)/.test(file) ? file : base + file) : "";
  return (
    <figure className={`ab-pic ${className}`} style={ratio ? { aspectRatio: ratio } : undefined}>
      {src && !bad
        ? <img src={src} alt={alt || ""} loading="lazy" decoding="async" onError={() => setBad(true)} />
        : <div className={`ab-ph ${hints ? "" : "quiet"}`}>{hints && (<><b aria-hidden="true">+</b><span>Add image</span><code>{file || "no file set"}</code></>)}</div>}
    </figure>
  );
}

/* roving arrow-key navigation for tab lists */
const arrowNav = (e, cur, len, set) => {
  if (!["ArrowRight", "ArrowLeft", "ArrowDown", "ArrowUp"].includes(e.key)) return;
  e.preventDefault();
  const n = (cur + (e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : -1) + len) % len;
  set(n);
  const tabs = e.currentTarget.querySelectorAll('[role="tab"]');
  if (tabs[n]) tabs[n].focus();
};

/* ==========================================================================
   BLOCKS  (one component per block type, all registered in BLOCKS below)
========================================================================== */

function SplitBlock({ b, base, hints }) {
  const hasPic = b.file !== undefined;
  const points = list(b.points);
  return (
    <div className={`ab-split ${b.reverse ? "rev" : ""} ${hasPic ? "" : "solo"}`}>
      <div className="ab-split-txt">
        {b.title && <h3>{b.title}</h3>}
        {list(b.paragraphs).map((p, i) => <p key={keyOf(p, i)}>{p}</p>)}
        {points.length > 0 && <ul className="ab-chips">{points.map((p, i) => <li key={keyOf(p, i)}>{p}</li>)}</ul>}
      </div>
      {hasPic && <Pic file={b.file} alt={b.alt} ratio={b.ratio || "4 / 3"} className="ab-split-pic" base={base} hints={hints} />}
    </div>
  );
}

function StatsBlock({ b }) {
  return (
    <div className="ab-stats">
      {list(b.items).map((s, i) => (
        <div className="ab-stat" key={keyOf(s, i)}>
          <strong><Num s={s} />{s.unit && <small>{s.unit}</small>}</strong>
          <span>{s.label}</span>
        </div>
      ))}
    </div>
  );
}

function CardsBlock({ b, base, hints }) {
  return (
    <div className="ab-cards" style={{ "--cols": b.cols || 3 }}>
      {list(b.items).map((x, i) => {
        const points = list(x.list);
        const inner = (
          <>
            {x.file && <Pic file={x.file} alt={x.title} ratio="16 / 10" className="ab-card-pic" base={base} hints={hints} />}
            {x.tag && <em className="ab-tag">{x.tag}</em>}
            <h4>{x.title}</h4>
            {x.text && <p>{x.text}</p>}
            {points.length > 0 && <ul className="ab-ticks">{points.map((li, k) => <li key={keyOf(li, k)}>{li}</li>)}</ul>}
            {x.href && <span className="ab-go">{x.linkLabel || "Learn more"}<Arrow /></span>}
          </>
        );
        return x.href
          ? <A key={keyOf(x, i)} href={x.href} id={x.id} className="ab-card is-link">{inner}</A>
          : <article key={keyOf(x, i)} id={x.id} className="ab-card">{inner}</article>;
      })}
    </div>
  );
}

function TabsBlock({ b }) {
  const items = useMemo(() => list(b.items), [b.items]);
  const [i, setI] = useState(0);
  const t = items[i] || items[0];

  /* a link like /about#strategy-training opens that tab */
  useEffect(() => {
    const read = () => {
      const n = items.findIndex((x) => x.id === window.location.hash.replace("#", ""));
      if (n >= 0) setI(n);
    };
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, [items]);

  if (!t) return null;
  const points = list(t.points);
  return (
    <div className="ab-tabs">
      <div className="ab-tabs-rail" role="tablist" aria-label={b.label || "Strategy"} onKeyDown={(e) => arrowNav(e, i, items.length, setI)}>
        {items.map((x, k) => (
          <button key={keyOf(x, k)} id={x.id} role="tab" aria-selected={i === k} tabIndex={i === k ? 0 : -1} className={i === k ? "is-on" : ""} onClick={() => setI(k)}>
            <span>{pad(k)}</span>{x.tab}
          </button>
        ))}
      </div>
      <div className="ab-tabs-panel ab-hi" key={t.id || i} role="tabpanel" aria-labelledby={t.id}>
        <span className="ab-bignum" aria-hidden="true">{pad(i)}</span>
        <div className="ab-pop">
          {t.title && <h3>{t.title}</h3>}
          {t.text && <p>{t.text}</p>}
          {t.href && <A className="ab-link" href={t.href}>{t.linkLabel || "Learn more"}<Arrow /></A>}
        </div>
        {points.length > 0 && (
          <ul className="ab-ticks ab-pop" style={D(1)}>{points.map((p, k) => <li key={keyOf(p, k)}>{p}</li>)}</ul>
        )}
      </div>
    </div>
  );
}

function TimelineBlock({ b }) {
  return (
    <ol className="ab-tl">
      {list(b.items).map((m, i) => (
        <li className={`ab-tl-i ${m.current ? "is-now" : ""}`} key={keyOf(m, i)} style={D(i)} aria-current={m.current ? "step" : undefined}>
          <strong>{m.year}</strong>
          <i aria-hidden="true" />
          <div className="ab-tl-c"><h4>{m.title}</h4><p>{m.text}</p></div>
        </li>
      ))}
    </ol>
  );
}

function OrgBlock({ b }) {
  const nodes = list(b.nodes);
  const links = list(b.links);
  return (
    <div className="ab-org">
      <div className="ab-org-root ab-hi">
        {b.rootLabel && <span className="ab-org-eyebrow">{b.rootLabel}</span>}
        <h3>{b.root}</h3>
        {b.rootText && <p>{b.rootText}</p>}
        {b.note && <span className="ab-org-note">{b.note}</span>}
        {links.length > 0 && (
          <div className="ab-org-links">
            {links.map((l, i) => <A key={keyOf(l, i)} className={`ab-btn ab-btn--sm ${i ? "ab-btn--ghost" : ""}`} href={l.href}>{l.label}<Arrow /></A>)}
          </div>
        )}
      </div>
      <ol className="ab-org-list">
        {nodes.map((n, i) => (
          <li className="ab-org-node" key={keyOf(n, i)}>
            <span className="ab-org-n" aria-hidden="true">{pad(i)}</span>
            <div><h4>{n.title}</h4><p>{n.text}</p></div>
          </li>
        ))}
      </ol>
    </div>
  );
}

function TagsBlock({ b }) {
  return (
    <div className="ab-tags">
      {b.title && <h3 className="ab-sub">{b.title}</h3>}
      <ul className="ab-chips">{list(b.items).map((x, i) => <li key={keyOf(x, i)}>{x}</li>)}</ul>
    </div>
  );
}

function TeamBlock({ b, base, hints }) {
  return (
    <div className="ab-team">
      {b.title && <h3 className="ab-sub">{b.title}</h3>}
      <div>
        {list(b.items).map((p, i) => {
          const inner = (
            <>
              <Pic file={p.file} alt={p.name} ratio="4 / 5" base={base} hints={hints} />
              <h4>{p.name}</h4>{p.role && <p>{p.role}</p>}
            </>
          );
          return p.href
            ? <A key={keyOf(p, i)} href={p.href} className="ab-person">{inner}</A>
            : <div key={keyOf(p, i)} className="ab-person">{inner}</div>;
        })}
      </div>
    </div>
  );
}

function GalleryBlock({ b, base, hints }) {
  return (
    <div className="ab-gal">
      {list(b.items).map((g, i) => <Pic key={keyOf(g, i)} file={g.file} alt={g.alt} ratio="4 / 3" base={base} hints={hints} />)}
    </div>
  );
}

function CtaBlock({ b }) {
  return (
    <div className="ab-cta-bar ab-hi">
      <p>{b.text}</p>
      <A className="ab-btn ab-mag" href={b.href}>{b.label}<Arrow /></A>
    </div>
  );
}

const BLOCKS = {
  split: SplitBlock,
  stats: StatsBlock,
  cards: CardsBlock,
  tabs: TabsBlock,
  timeline: TimelineBlock,
  org: OrgBlock,
  tags: TagsBlock,
  people: TeamBlock,
  gallery: GalleryBlock,
  cta: CtaBlock,
};

/* ==========================================================================
   SECTION
========================================================================== */

const Section = memo(function Section({ s, n, base, hints }) {
  const blocks = list(s.blocks).filter((b) => BLOCKS[b.type]);
  return (
    <section id={s.id} className={`ab-sec ab-${s.tone || "dark"} ab-sec-${s.id}`}>
      <div className="ab-wrap">
        <header className="ab-head">
          <p className="ab-kicker ab-rv"><span>{pad(n)}</span>{s.eyebrow || s.nav}</p>
          <h2 className="ab-h ab-rv" style={D(1)} aria-label={plain(s.title)}><Title text={s.title} /></h2>
          {s.lede && <p className="ab-lede ab-rv" style={D(2)}>{s.lede}</p>}
        </header>
        {blocks.length > 0 && (
          <div className="ab-main">
            {blocks.map((b, i) => {
              const C = BLOCKS[b.type];
              return (
                <div className={`ab-blk ab-blk--${b.type} ab-rv`} style={D(Math.min(i, 3))} key={keyOf(b, i)} id={b.id}>
                  <C b={b} base={base} hints={hints} />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
});

/* ==========================================================================
   PAGE
========================================================================== */

export default function About({ content: override }) {
  const { content: c } = useAboutContent(override);
  const base = c.mediaBase || "/";
  const hints = !!c.showSlotHints;
  const h = c.hero || {};
  const sections = list(c.sections).filter((s) => list(s.blocks).length > 0);
  const menu = sections.filter((s) => s.nav);
  const ticker = list(c.ticker);
  const stats = list(h.stats);
  const heroLines = Array.isArray(h.titleLines) ? h.titleLines : [];

  const navKey = sections.map((s) => `${s.id}${s.nav ? "+" : "-"}`).join();
  const revealKey = sections.map((s) => `${s.id}:${list(s.blocks).length}`).join();

  const rootRef = useRef(null);
  const [active, setActive] = useState(menu[0] ? menu[0].id : "");
  const [heroFail, setHeroFail] = useState(false);

  useReveal(rootRef, revealKey);

  const goTo = useCallback((id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: reduced() ? "auto" : "smooth", block: "start" });
  }, []);

  /* open #hash links (e.g. /about#history) once the page has painted */
  useEffect(() => {
    const id = window.location.hash.replace("#", "");
    if (!id) return undefined;
    const timer = setTimeout(() => goTo(id), 350);
    return () => clearTimeout(timer);
  }, [goTo]);

  /* scroll: progress bar, hero parallax, active menu item */
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    const heroEl = root.querySelector(".ab-hero");
    let raf = 0;
    const update = () => {
      raf = 0;
      const y = window.scrollY;
      const max = root.scrollHeight - window.innerHeight;
      if (y < 1100 && heroEl) heroEl.style.setProperty("--sy", `${y}`);
      root.style.setProperty("--progress", max > 0 ? Math.min(1, Math.max(0, y / max)).toFixed(4) : 0);
      const line = window.innerHeight * 0.35;
      let cur = menu[0] ? menu[0].id : "";
      menu.forEach((s) => {
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

  /* keep the active menu item visible on small screens */
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const a = root.querySelector(".ab-subnav a.is-active");
    const box = root.querySelector(".ab-subnav-scroll");
    if (a && box) box.scrollTo({ left: a.offsetLeft - box.clientWidth / 2 + a.clientWidth / 2, behavior: "smooth" });
  }, [active]);

  /* pointer effect: magnetic buttons */
  const onMove = useCallback((e) => {
    if (reduced()) return;
    const t = e.target;
    const mag = t.closest && t.closest(".ab-mag");
    if (mag) {
      const r = mag.getBoundingClientRect();
      mag.style.setProperty("--tx", `${((e.clientX - (r.left + r.width / 2)) * 0.2).toFixed(1)}px`);
      mag.style.setProperty("--ty", `${((e.clientY - (r.top + r.height / 2)) * 0.3).toFixed(1)}px`);
    }
  }, []);

  const onOut = useCallback((e) => {
    const t = e.target.closest && e.target.closest(".ab-mag");
    if (t && !t.contains(e.relatedTarget)) ["--tx", "--ty"].forEach((p) => t.style.removeProperty(p));
  }, []);

  const heroSrc = h.file ? (/^(https?:|\/)/.test(h.file) ? h.file : base + h.file) : "";

  return (
    <div className="ab" ref={rootRef} onMouseMove={onMove} onMouseOut={onOut}>

      {/* ===================== HERO ===================== */}
      <section className="ab-hero" id="top">
        {heroSrc && !heroFail && (
          <div className="ab-hero-media" aria-hidden="true"><img src={heroSrc} alt="" loading="eager" decoding="async" onError={() => setHeroFail(true)} /></div>
        )}
        <div className="ab-grid-bg" aria-hidden="true" />

        <div className="ab-wrap ab-hero-copy">
          {h.eyebrow && <p className="ab-eyebrow"><i />{h.eyebrow}</p>}
          <h1 className="ab-title" aria-label={heroLines.join(" ")}>
            {heroLines.map((l, i) => (
              <span className="ab-ln" key={`${l}-${i}`}><span className={l === h.highlight ? "ab-hl" : ""} style={{ "--i": i }}>{l}</span></span>
            ))}
          </h1>
          {h.lede && <p className="ab-hero-lede">{h.lede}</p>}
          <div className="ab-hero-cta">
            {h.primary && <button className="ab-btn ab-mag" onClick={() => goTo(h.primary.target || (sections[0] && sections[0].id))}>{h.primary.label}<Arrow /></button>}
            {h.secondary && <A className="ab-btn ab-btn--ghost ab-mag" href={h.secondary.href}>{h.secondary.label}<Arrow /></A>}
          </div>
        </div>

        {stats.length > 0 && (
          <div className="ab-wrap ab-glance">
            <div className="ab-glance-bar">
              <span>At a glance</span>
              {h.caption && <span><b>{h.caption.place}</b> &middot; {h.caption.note}</span>}
            </div>
            <div className="ab-glance-grid">
              {stats.map((s, i) => (
                <div className="ab-gl" key={keyOf(s, i)}>
                  <strong><Num s={s} delay={900 + i * 100} /></strong>
                  <span className="ab-gl-label">{s.label}</span>
                  {s.note && <p className="ab-gl-note">{s.note}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ===================== STICKY MENU ===================== */}
      {menu.length > 0 && (
        <nav className="ab-subnav" aria-label="About sections">
          <div className="ab-wrap ab-subnav-scroll">
            <ul>
              {menu.map((s) => (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    className={active === s.id ? "is-active" : ""}
                    aria-current={active === s.id ? "true" : undefined}
                    onClick={(e) => { e.preventDefault(); goTo(s.id); }}
                  >{s.nav}</a>
                </li>
              ))}
            </ul>
          </div>
          <div className="ab-progress" aria-hidden="true"><span /></div>
        </nav>
      )}

      {/* ===================== TICKER ===================== */}
      {ticker.length > 0 && (
        <div className="ab-ticker" aria-hidden="true">
          <div className="ab-ticker-track">
            {[0, 1].map((k) => <ul key={k}>{ticker.map((t, i) => <li key={`${t}-${i}-${k}`}>{t}</li>)}</ul>)}
          </div>
        </div>
      )}

      {/* ===================== SECTIONS ===================== */}
      {sections.map((s, i) => <Section s={s} n={i} key={s.id} base={base} hints={hints} />)}

      {c.footer && <footer className="ab-foot">{c.footer}</footer>}
    </div>
  );
}

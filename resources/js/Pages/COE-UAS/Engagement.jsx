import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Head, Link } from "@inertiajs/react";
import { useEngagementContent, imgUrl } from "../../data/COEUAS-data/engagementContent";
import { BASE } from "../../data/COEUAS-data/siteMapCOEUAS";
import "../../../css/COE-UAS-css/coe-engagement.css";

/* ------------------------------------------------------------------
   Engagement.jsx is layout and motion only.
   All text, links, images and numbers come from engagementContent.js
   (later: the admin CMS). Pass a `content` prop to preview changes.
   The top navigation bar comes from COEUAsWebsiteLayout.
   Every class starts with "ng-" so no other page's CSS can leak in.
------------------------------------------------------------------- */

const to = (h = "/") =>
  h === "/" ? BASE : h.startsWith("/") && !h.startsWith(BASE + "/") && h !== BASE ? BASE + h : h;

const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const pad = (n) => String(n + 1).padStart(2, "0");
const D = (i) => ({ "--d": i * 90 });
const DS = (i) => ({ "--d": Math.min(i, 12) * 55 });

/* section types this page knows how to draw (see engagementContent.js) */
const TYPES = ["groups", "pillars", "panels", "news", "media", "cta"];

const ICONS = {
  cap: <><path d="M2 9l10-5 10 5-10 5L2 9z" /><path d="M6 11.5V16c0 1.5 3 3 6 3s6-1.5 6-3v-4.5" /><path d="M22 9v6" /></>,
  bank: <><path d="M3 10l9-6 9 6" /><path d="M5 10v8M9.5 10v8M14.5 10v8M19 10v8" /><path d="M3 20h18" /></>,
  factory: <><path d="M3 20V9l6 3V9l6 3V5h3v15z" /><path d="M3 20h18" /></>,
  globe: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18" /><path d="M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" /></>,
  doc: <><path d="M6 3h8l4 4v14H6z" /><path d="M14 3v4h4" /><path d="M9 13l2 2 4-4" /></>,
  badge: <><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="9" cy="11" r="2" /><path d="M6 16c.5-2 5.5-2 6 0M14 10h4M14 13h3" /></>,
  users: <><circle cx="9" cy="8" r="3" /><path d="M3 20c0-3.5 3-5.5 6-5.5s6 2 6 5.5" /><circle cx="17" cy="9" r="2.5" /><path d="M16 14.5c3 0 5 1.8 5 4.5" /></>,
  star: <path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z" />,
  shield: <><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" /><path d="M9 12l2 2 4-4" /></>,
  flask: <><path d="M9 3h6M10 3v6L4.5 19a1.5 1.5 0 0 0 1.3 2h12.4a1.5 1.5 0 0 0 1.3-2L14 9V3" /><path d="M7.5 15h9" /></>,
  handshake: <><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" /><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" /></>,
  news: <><path d="M5 4h12v16H7a2 2 0 0 1-2-2z" /><path d="M17 8h3v10a2 2 0 0 1-2 2M8 8h6M8 12h6M8 16h4" /></>,
  play: <path d="M8 5v14l11-7z" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  external: <path d="M14 4h6v6M20 4l-9 9M18 14v6H4V6h6" />,
  image: <><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="9" cy="11" r="2" /><path d="m21 16-5-5-8 8" /></>,
};

function Icon({ name, size = 22 }) {
  return (
    <svg className="ng-icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {ICONS[name] || ICONS.star}
    </svg>
  );
}

const Arrow = () => (
  <svg className="ng-arrow" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
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

/* adds .in to every .ng-rv once it scrolls into view (re-runs when the content changes) */
function useReveal(rootRef, dep) {
  useEffect(() => {
    const nodes = rootRef.current ? rootRef.current.querySelectorAll(".ng-rv:not(.in)") : [];
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
    <div className={`ng-media ${className} ${live ? "is-live" : "is-empty"}`}>
      {live ? (
        <img src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} />
      ) : (
        <div className={`ng-ph ${hints ? "" : "quiet"}`}>
          <span className="ng-ph-ic"><Icon name="image" size={40} /></span>
          {hints && <b>Photo slot</b>}
          {hints && file && <code>{file}</code>}
        </div>
      )}
    </div>
  );
}

function SectionHead({ n, s }) {
  return (
    <header className="ng-head">
      <p className="ng-kicker ng-rv"><span>{pad(n)}</span>{s.eyebrow || s.label}</p>
      <h2 className="ng-h ng-rv" style={D(1)}>{s.title}</h2>
      {s.text && <p className="ng-lede ng-rv" style={D(2)}>{s.text}</p>}
    </header>
  );
}

/* ==========================================================================
   PAGE
========================================================================== */

export default function Engagement({ content: override }) {
  const { content: c } = useEngagementContent(override);
  const rootRef = useRef(null);
  const st = c.settings || {};
  const hints = st.showSlotHints !== false;
  const showPh = st.showPlaceholders !== false;
  const showSample = st.showSampleBadge !== false;

  const sections = useMemo(() => c.sections.filter((s) => s.visible !== false && TYPES.includes(s.type)), [c.sections]);
  const navList = useMemo(() => sections.filter((s) => s.nav !== false && s.type !== "cta"), [sections]);
  const navKey = navList.map((s) => s.id).join();
  const [active, setActive] = useState(navList[0] ? navList[0].id : "");

  const newsSec = sections.find((s) => s.type === "news");
  const mediaSec = sections.find((s) => s.type === "media");
  const [cat, setCat] = useState("all");
  const [tabId, setTabId] = useState("");
  const [box, setBox] = useState(null);
  const tab = mediaSec ? (mediaSec.tabs.find((t) => t.id === tabId) || mediaSec.tabs[0]) : null;

  const itemTotal = sections.reduce((t, s) => t + (s.items ? s.items.length : 0) + (s.tabs ? s.tabs.reduce((m, x) => m + x.items.length, 0) : 0), 0);
  useReveal(rootRef, sections.map((s) => s.id).join() + "|" + itemTotal + "|" + cat + "|" + (tab ? tab.id : ""));

  /* scroll: progress bar, hero parallax, active menu item */
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    const heroEl = root.querySelector(".ng-hero");
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

  /* open already scrolled to #anchor. News categories and media tabs open that filter / tab first. */
  useEffect(() => {
    const jump = () => {
      let id = decodeURIComponent(window.location.hash.slice(1));
      if (!id) return;
      const nc = newsSec && newsSec.categories.find((x) => x.anchor === id);
      if (nc) { setCat(nc.id); id = newsSec.id; }
      const mt = mediaSec && mediaSec.tabs.find((x) => x.anchor === id);
      if (mt) { setTabId(mt.id); id = mediaSec.id; }
      setTimeout(() => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ block: "start" });
      }, nc || mt ? 80 : 0);
    };
    const t = setTimeout(jump, 150);
    window.addEventListener("hashchange", jump);
    return () => { clearTimeout(t); window.removeEventListener("hashchange", jump); };
  }, [newsSec, mediaSec]);

  /* keep the active menu item visible on small screens */
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const a = root.querySelector(".ng-subnav a.is-active");
    const b = root.querySelector(".ng-subnav-scroll");
    if (a && b) b.scrollTo({ left: a.offsetLeft - b.clientWidth / 2 + a.clientWidth / 2, behavior: "smooth" });
  }, [active]);

  /* media viewer: Esc closes it */
  useEffect(() => {
    if (!box) return undefined;
    const onKey = (e) => { if (e.key === "Escape") setBox(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [box]);

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
    const mag = t.closest(".ng-mag");
    if (mag) {
      const r = mag.getBoundingClientRect();
      mag.style.setProperty("--tx", `${((e.clientX - (r.left + r.width / 2)) * 0.22).toFixed(1)}px`);
      mag.style.setProperty("--ty", `${((e.clientY - (r.top + r.height / 2)) * 0.3).toFixed(1)}px`);
    }
  }, []);
  const onOut = useCallback((e) => {
    const t = e.target.closest && e.target.closest(".ng-mag");
    if (t && !t.contains(e.relatedTarget)) ["--tx", "--ty"].forEach((p) => t.style.removeProperty(p));
  }, []);

  /* hero numbers: "section" counts items, "section.field" counts a nested list (placeholders skipped) */
  const countOf = (path) => {
    const [sid, field] = path.split(".");
    const s = c.sections.find((x) => x.id === sid);
    if (!s || !s.items) return 0;
    if (!field) return s.items.length;
    return s.items.reduce((t, it) => t + (it[field] || []).filter((x) => !x.placeholder).length, 0);
  };
  const stats = (c.hero.stats || []).map((s) => ({ ...s, n: s.of ? countOf(s.of) : s.value }));

  const vis = (arr = []) => (showPh ? arr : arr.filter((x) => !x.placeholder));
  const Sample = ({ on }) => (showSample && on ? <em className="ng-sample">Sample</em> : null);

  /* ---------- the section types ---------- */
  const renderSection = (s, n) => {
    const items = s.items || [];
    switch (s.type) {
      /* linkage groups: every group and its partners visible at once */
      case "groups":
        return (
          <div className="ng-wrap">
            <SectionHead n={n} s={s} />
            <div className="ng-groups">
              {items.map((g, i) => {
                const list = vis(g.partners);
                return (
                  <article className="ng-card ng-group ng-rv" id={g.anchor || undefined} style={DS(i)} key={g.id}>
                    <header><span className="ng-ic"><Icon name={g.icon} /></span><h3>{g.label}</h3></header>
                    {g.blurb && <p>{g.blurb}</p>}
                    {list.length > 0 ? (
                      <ul className="ng-partners">
                        {list.map((p) => (
                          <li className={p.placeholder ? "is-ph" : ""} key={p.name}>
                            <b>{p.name}</b>{p.note && <small>{p.note}</small>}
                          </li>
                        ))}
                      </ul>
                    ) : <p className="ng-note">{st.emptyNote}</p>}
                  </article>
                );
              })}
            </div>
          </div>
        );

      /* ecosystem: a statement, the five roles, and the shared outcomes */
      case "pillars": {
        const hl = new Set(s.highlight || []);
        return (
          <div className="ng-wrap">
            <header className="ng-quote-head">
              <p className="ng-kicker ng-rv"><span>{pad(n)}</span>{s.eyebrow || s.label}</p>
              <h2 className="ng-quote ng-rv" style={D(1)} aria-label={(s.quote || []).join(" ")}>
                {(s.quote || []).map((line) => (
                  <span className="ng-quote-line" key={line}>
                    {line.split(" ").map((w, k) => <span key={k} className={hl.has(w) ? "ng-hl" : ""}>{w}{" "}</span>)}
                  </span>
                ))}
              </h2>
            </header>
            <ul className="ng-pillars">
              {items.map((p, i) => (
                <li className="ng-card ng-pillar ng-rv" style={D(i)} key={p.id}>
                  <span className="ng-ic"><Icon name={p.icon} size={26} /></span>
                  <h3>{p.role}</h3>
                  <small>{p.tag}</small>
                  <p>{p.text}</p>
                </li>
              ))}
            </ul>
            {s.centerLabel && <p className="ng-hub ng-rv">{s.centerLabel}</p>}
            {s.together && s.together.length > 0 && (
              <div className="ng-together ng-rv">
                {s.togetherTitle && <h3>{s.togetherTitle}</h3>}
                <ul>{s.together.map((t) => <li key={t}>{t}</li>)}</ul>
              </div>
            )}
          </div>
        );
      }

      /* membership: a few panels, each with its own list */
      case "panels":
        return (
          <div className="ng-wrap">
            <SectionHead n={n} s={s} />
            <div className="ng-panels">
              {items.map((p, i) => {
                const list = vis(p.list);
                return (
                  <article className="ng-card ng-panel ng-rv" id={p.anchor || undefined} style={D(i)} key={p.id}>
                    <header>
                      <span className="ng-ic"><Icon name={p.icon} /></span>
                      {p.badge && <span className="ng-tag">{p.badge}</span>}
                    </header>
                    <h3>{p.title}</h3>
                    <p>{p.text}</p>
                    {list.length > 0 ? (
                      <ul className="ng-dots">
                        {list.map((x) => <li className={x.placeholder ? "is-ph" : ""} key={x.text}>{x.text}</li>)}
                      </ul>
                    ) : <p className="ng-note">{st.emptyNote}</p>}
                    {p.link && p.link.href && <Go href={p.link.href} className="ng-more">{p.link.label}<Arrow /></Go>}
                  </article>
                );
              })}
            </div>
          </div>
        );

      /* news: filter by category, every story is a card */
      case "news": {
        const cats = s.categories || [];
        const list = items.filter((x) => cat === "all" || x.category === cat);
        const labelOf = (id) => (cats.find((x) => x.id === id) || {}).label || id;
        const counts = { all: items.length };
        items.forEach((x) => { counts[x.category] = (counts[x.category] || 0) + 1; });
        const filtered = cat !== "all";
        return (
          <div className="ng-wrap">
            <SectionHead n={n} s={s} />
            <div className="ng-tabs ng-rv" role="tablist" aria-label="Filter stories">
              {[{ id: "all", label: s.allLabel || "All" }, ...cats].map((x) => (
                <button key={x.id} role="tab" aria-selected={cat === x.id} className={cat === x.id ? "is-on" : ""} onClick={() => setCat(x.id)}>
                  {x.label}<sup>{counts[x.id] || 0}</sup>
                </button>
              ))}
            </div>
            <p className="ng-count" aria-live="polite">
              <span><b>{list.length}</b> of {items.length} stories</span>
              {filtered && <button className="ng-link" onClick={() => setCat("all")}>Show all stories</button>}
            </p>
            <div className="ng-news" key={cat}>
              {list.map((it, i) => {
                const body = (
                  <>
                    {it.image && <Media src={it.image} alt="" hints={hints} className="ng-photo" />}
                    <div className="ng-news-top">
                      <span className="ng-tag">{labelOf(it.category)}</span>
                      <time>{it.date}</time>
                      <Sample on={it.sample} />
                    </div>
                    <h3>{it.title}</h3>
                    <p>{it.summary}</p>
                    {it.href && <span className="ng-more">Read more<Arrow /></span>}
                  </>
                );
                return it.href
                  ? <Go href={it.href} className="ng-card ng-story ng-pop is-link" style={DS(i)} key={it.id}>{body}</Go>
                  : <article className="ng-card ng-story ng-pop" style={DS(i)} key={it.id}>{body}</article>;
              })}
            </div>
            {list.length === 0 && (
              <div className="ng-empty ng-pop">
                <p>{s.emptyText}</p>
                <button className="ng-link" onClick={() => setCat("all")}>Show all stories</button>
              </div>
            )}
          </div>
        );
      }

      /* media: tabs for photos & videos, press coverage and documents */
      case "media":
        return (
          <div className="ng-wrap">
            <SectionHead n={n} s={s} />
            <div className="ng-tabs ng-rv" role="tablist" aria-label="Media type">
              {s.tabs.map((x) => (
                <button key={x.id} role="tab" aria-selected={tab && tab.id === x.id} className={tab && tab.id === x.id ? "is-on" : ""} onClick={() => setTabId(x.id)}>
                  {x.label}<sup>{x.items.length}</sup>
                </button>
              ))}
            </div>

            {tab && tab.kind === "gallery" && (
              <div className="ng-mosaic" key={tab.id}>
                {tab.items.map((it, i) => {
                  const canOpen = !!(it.src || it.video);
                  const inner = (
                    <>
                      <Media src={it.src} alt={it.title} hints={hints} className="ng-tile-media" />
                      <span className="ng-tile-cap">{it.video !== undefined && <Icon name="play" size={16} />}{it.title}</span>
                    </>
                  );
                  return canOpen
                    ? <button className={`ng-tile ng-pop is-open ${it.size || ""}`} style={DS(i)} onClick={() => setBox(it)} aria-label={`Open: ${it.title}`} key={it.id}>{inner}</button>
                    : <div className={`ng-tile ng-pop ${it.size || ""}`} style={DS(i)} key={it.id}>{inner}</div>;
                })}
              </div>
            )}

            {tab && tab.kind === "press" && (
              <div className="ng-press" key={tab.id}>
                {tab.items.map((it, i) => (
                  <article className="ng-card ng-item ng-pop" style={DS(i)} key={it.id}>
                    <span className="ng-ic"><Icon name="news" /></span>
                    <small>{it.outlet} &middot; {it.date}</small>
                    <h3>{it.title}</h3>
                    <Sample on={it.sample} />
                    {it.href && <Go href={it.href} className="ng-more">Read article<Icon name="external" size={16} /></Go>}
                  </article>
                ))}
              </div>
            )}

            {tab && tab.kind === "docs" && (
              <div className="ng-docs" key={tab.id}>
                {tab.items.map((it, i) => (
                  <article className="ng-card ng-item ng-pop" style={DS(i)} key={it.id}>
                    <span className="ng-tag">{it.type}</span>
                    <h3>{it.title}</h3>
                    {it.note && <p>{it.note}</p>}
                    {it.href
                      ? <Go href={it.href} className="ng-more">Open<Icon name="external" size={16} /></Go>
                      : <em className="ng-soon">Link coming soon</em>}
                  </article>
                ))}
              </div>
            )}
          </div>
        );

      case "cta":
        return (
          <div className="ng-wrap">
            <div className="ng-cta-in">
              <div>
                <h2 className="ng-h ng-rv">{s.title}</h2>
                {s.text && <p className="ng-lede ng-rv" style={D(1)}>{s.text}</p>}
                {s.footer && <p className="ng-foot ng-rv" style={D(2)}>{s.footer}</p>}
                {s.restart && <button className="ng-link ng-restart ng-rv" style={D(3)} onClick={() => goTo("overview")}>{s.restart}</button>}
              </div>
              <div className="ng-cta-links ng-rv" style={D(2)}>
                {items.map((it) => (
                  <Go href={it.href} className="ng-cta-link ng-mag" key={it.id}>
                    <span className="ng-cta-n"><Icon name={it.icon} size={20} /></span>
                    <span className="ng-cta-t"><b>{it.title}</b>{it.text && <small>{it.text}</small>}</span>
                    <Arrow />
                  </Go>
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
    <div className="ng" ref={rootRef} onMouseMove={onMove} onMouseOut={onOut}>
      <Head title={c.page ? c.page.title : "Engagement | COE-UAS"} />

      {/* ===================== HERO ===================== */}
      <section className="ng-hero" id="overview">
        {heroImg && !heroFail && (
          <div className="ng-hero-media" aria-hidden="true"><img src={heroImg} alt="" loading="eager" decoding="async" onError={() => setHeroFail(true)} /></div>
        )}
        <div className="ng-grid-bg" aria-hidden="true" />

        <div className="ng-wrap ng-hero-copy">
          {h.eyebrow && <p className="ng-eyebrow"><i />{h.eyebrow}</p>}
          <h1 className="ng-title" aria-label={heroLines.join(" ")}>
            {heroLines.map((l, i) => (
              <span className="ng-ln" key={l}><span className={l === h.highlight ? "ng-hl" : ""} style={{ "--i": i }}>{l}</span></span>
            ))}
          </h1>
          <p className="ng-hero-lede">{h.lead}</p>
          <div className="ng-hero-cta">
            {h.primary && <button className="ng-btn ng-mag" onClick={() => goTo(h.primary.target)}>{h.primary.label}<Arrow /></button>}
            {h.secondary && <Link className="ng-btn ng-btn--ghost ng-mag" href={to(h.secondary.href)}>{h.secondary.label}<Arrow /></Link>}
          </div>
        </div>

        {stats.length > 0 && (
          <div className="ng-wrap ng-glance">
            <div className="ng-glance-bar">
              <span>At a glance</span>
              {h.caption && <span><b>{h.caption.place}</b> &middot; {h.caption.note}</span>}
            </div>
            <div className="ng-glance-grid">
              {stats.map((s, i) => (
                <div className="ng-gl" key={s.label}>
                  <strong>{typeof s.n === "number" ? <Counter value={s.n} delay={900 + i * 100} /> : s.n}</strong>
                  <span className="ng-gl-label">{s.label}</span>
                  {s.note && <p className="ng-gl-note">{s.note}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ===================== STICKY MENU ===================== */}
      {navList.length > 0 && (
        <nav className="ng-subnav" aria-label="Engagement sections">
          <div className="ng-wrap ng-subnav-scroll">
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
          <div className="ng-progress" aria-hidden="true"><span /></div>
        </nav>
      )}

      {/* ===================== SECTIONS ===================== */}
      {sections.map((s) => {
        const idx = Math.max(0, navList.findIndex((x) => x.id === s.id));
        return (
          <section key={s.id} id={s.id} className={`ng-sec ng-${s.tone || "dark"} ng-sec-${s.type}`}>
            {renderSection(s, idx)}
          </section>
        );
      })}

      {/* ===================== MEDIA VIEWER ===================== */}
      {box && (
        <div className="ng-lightbox" role="dialog" aria-modal="true" aria-label={box.title} onClick={() => setBox(null)}>
          <figure onClick={(e) => e.stopPropagation()}>
            {box.video ? <video src={box.video} controls autoPlay /> : <img src={imgUrl(box.src)} alt={box.title} />}
            <figcaption>{box.title}</figcaption>
            <button className="ng-x" onClick={() => setBox(null)} aria-label="Close" autoFocus><Icon name="close" /></button>
          </figure>
        </div>
      )}
    </div>
  );
}

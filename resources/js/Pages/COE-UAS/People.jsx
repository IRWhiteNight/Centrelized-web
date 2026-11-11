import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@inertiajs/react";
import { usePeopleContent, photoUrl } from "../../data/COEUAS-data/peopleContent";
import { BASE } from "../../data/COEUAS-data/siteMapCOEUAS";
import "../../../css/COE-UAS-css/people.css";

/* ------------------------------------------------------------------
   People.jsx is layout and motion only.
   All text, links, photos and numbers come from peopleContent.js
   (later: the admin CMS). Pass a `content` prop to preview changes.
   The top navigation bar comes from COEUAsWebsiteLayout.
------------------------------------------------------------------- */

const to = (h = "/") =>
  h === "/" ? BASE : h.startsWith("/") && !h.startsWith(BASE + "/") && h !== BASE ? BASE + h : h;

const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const pad = (n) => String(n + 1).padStart(2, "0");
const D = (i) => ({ "--d": i * 90 });
const DS = (i) => ({ "--d": i * 55 });

const ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" /></svg>
);

const Arrow = () => (
  <svg className="pp-arrow" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
    <path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/* adds .in to every .pp-rv once it scrolls into view (re-runs when the sections change) */
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
function Counter({ value, suffix = "", delay = 0 }) {
  const ref = useRef(null);
  const [v, setV] = useState(reduced() ? value : 0);
  useEffect(() => {
    if (reduced()) { setV(value); return undefined; }
    const el = ref.current;
    let raf = 0, timer = 0;
    const run = () => {
      const t0 = performance.now();
      const tick = (t) => {
        const p = Math.min(1, (t - t0) / 1500);
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
  return <span ref={ref}>{v}{suffix && <small>{suffix}</small>}</span>;
}

/* One portrait slot: the photo when it exists, otherwise a placeholder. */
function Media({ person, hints, className = "" }) {
  const src = photoUrl(person);
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  const live = !!src && !failed;
  return (
    <div className={`pp-media ${className} ${live ? "is-live" : "is-empty"}`}>
      {live ? (
        <img src={src} alt={person.name || ""} loading="lazy" onError={() => setFailed(true)} />
      ) : (
        <div className={`pp-ph ${hints ? "" : "quiet"}`}>
          <span className="pp-ph-ic">{ICON}</span>
          {hints && <b>Photo slot</b>}
          {hints && src && <code>{src}</code>}
        </div>
      )}
    </div>
  );
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

/* ==========================================================================
   PAGE
========================================================================== */

export default function People({ content: override }) {
  const { content: c } = usePeopleContent(override);
  const rootRef = useRef(null);
  const rail = useRef(null);
  const [filter, setFilter] = useState("all");
  const [q, setQ] = useState("");

  const hints = c.settings ? c.settings.showSlotHints !== false : true;
  const people = c.people || [];
  const groups = c.groups || [];
  const groupOf = useMemo(() => Object.fromEntries(groups.map((g) => [g.id, g])), [groups]);

  /* sections that can be drawn, in the order set in peopleContent.js */
  const list = c.sections.filter((s) => s.visible && (s.id === "hero" || s.id === "leadership" || s.id === "directory" || s.id === "early" || s.id === "cta"));
  const heroSec = list.find((s) => s.id === "hero");
  const rest = list.filter((s) => s.id !== "hero");
  const navList = rest.filter((s) => s.nav !== false);
  const navKey = navList.map((s) => s.id).join();
  const [active, setActive] = useState(navList[0] ? navList[0].id : "");

  useReveal(rootRef, list.map((s) => s.id).join() + "|" + people.length);

  /* scroll: progress bar, hero parallax, active menu item */
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    const heroEl = root.querySelector(".pp-hero");
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
        const el = document.getElementById("people-" + s.id);
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
    const el = document.getElementById("people-" + id);
    if (el) el.scrollIntoView({ behavior: reduced() ? "auto" : "smooth", block: "start" });
  }, []);

  /* pointer effects: card spotlight + tilt, magnetic buttons, hero glow */
  const onMove = useCallback((e) => {
    const t = e.target;
    if (!t.closest) return;
    const spot = t.closest(".pp-spot");
    if (spot) {
      const r = spot.getBoundingClientRect();
      spot.style.setProperty("--mx", `${e.clientX - r.left}px`);
      spot.style.setProperty("--my", `${e.clientY - r.top}px`);
    }
    if (reduced()) return;
    const tilt = t.closest(".pp-tilt");
    if (tilt) {
      const r = tilt.getBoundingClientRect();
      tilt.style.setProperty("--rx", `${(-((e.clientY - r.top) / r.height - 0.5) * 6).toFixed(2)}deg`);
      tilt.style.setProperty("--ry", `${(((e.clientX - r.left) / r.width - 0.5) * 8).toFixed(2)}deg`);
    }
    const mag = t.closest(".pp-mag");
    if (mag) {
      const r = mag.getBoundingClientRect();
      mag.style.setProperty("--tx", `${((e.clientX - (r.left + r.width / 2)) * 0.22).toFixed(1)}px`);
      mag.style.setProperty("--ty", `${((e.clientY - (r.top + r.height / 2)) * 0.3).toFixed(1)}px`);
    }
    const h = t.closest(".pp-hero");
    if (h) {
      const r = h.getBoundingClientRect();
      h.style.setProperty("--hx", `${e.clientX - r.left}px`);
      h.style.setProperty("--hy", `${e.clientY - r.top}px`);
    }
  }, []);

  const onOut = useCallback((e) => {
    const t = e.target.closest && e.target.closest(".pp-tilt, .pp-mag");
    if (t && !t.contains(e.relatedTarget)) {
      ["--rx", "--ry", "--tx", "--ty"].forEach((p) => t.style.removeProperty(p));
    }
  }, []);

  /* ---------- derived data (everything comes from the one people list) ---------- */
  const leaders = useMemo(() => people.filter((p) => p.group === c.leadership.group), [people, c.leadership.group]);
  const early = useMemo(() => people.filter((p) => (c.early.groups || []).includes(p.group)), [people, c.early.groups]);

  const counts = useMemo(() => {
    const m = { all: people.length };
    people.forEach((p) => { m[p.group] = (m[p.group] || 0) + 1; });
    return m;
  }, [people]);

  const shown = useMemo(() => {
    const t = q.trim().toLowerCase();
    return people.filter((p) => (filter === "all" || p.group === filter) && (!t || `${p.name} ${p.area} ${p.role}`.toLowerCase().includes(t)));
  }, [people, filter, q]);
  const filtered = filter !== "all" || q.trim() !== "";
  const clearFilters = () => { setFilter("all"); setQ(""); };

  const stats = (c.hero.stats || []).map((s) => ({
    ...s,
    n: s.group ? counts[s.group] || 0 : s.all ? people.length : s.value || 0,
  }));

  /* drag-to-scroll rail */
  const drag = useRef({ down: false, x: 0, left: 0, moved: false });
  const onDown = (e) => { const r = rail.current; drag.current = { down: true, x: e.clientX, left: r.scrollLeft, moved: false }; r.classList.add("grab"); };
  const onDrag = (e) => {
    const s = drag.current; if (!s.down) return;
    const dx = e.clientX - s.x; if (Math.abs(dx) > 4) s.moved = true;
    rail.current.scrollLeft = s.left - dx;
  };
  const onUp = () => { drag.current.down = false; if (rail.current) rail.current.classList.remove("grab"); };
  const nudge = (dir) => rail.current && rail.current.scrollBy({ left: dir * 340, behavior: reduced() ? "auto" : "smooth" });
  const stopIfDragged = (e) => { if (drag.current.moved) e.preventDefault(); };

  const profile = (p) => to(`/people/member/${p.id}`);

  /* ---------- the sections ---------- */
  const SECTIONS = {
    leadership: (n) => {
      const l = c.leadership;
      return (
        <div className="pp-wrap">
          <Head n={n} label={l.eyebrow || l.title} title={l.title} lede={l.text} />
          <div className="pp-leaders">
            {leaders.map((m, i) => (
              <Link href={profile(m)} className="pp-leader pp-rv pp-spot pp-tilt" style={D(i)} key={m.id}>
                <Media person={m} hints={hints} className="pp-portrait" />
                <div className="pp-leader-body">
                  <span className="pp-leader-n">{pad(i)}</span>
                  <h3>{m.name}</h3>
                  <em>{m.role}</em>
                  {m.bio && <p>{m.bio}</p>}
                  <div className="pp-leader-foot">
                    {m.area && <span className="pp-area">{m.area}</span>}
                    <span className="pp-more">{l.cardLink || "View profile"}<Arrow /></span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      );
    },

    directory: (n) => {
      const d = c.directory;
      return (
        <div className="pp-wrap">
          <Head n={n} label={d.eyebrow || d.title} title={d.title} lede={d.text} />
          <div className="pp-tools pp-rv">
            <div className="pp-tabs" role="tablist" aria-label="Filter people">
              <button role="tab" aria-selected={filter === "all"} className={filter === "all" ? "is-on" : ""} onClick={() => setFilter("all")}>
                {d.allLabel || "Everyone"}<sup>{counts.all}</sup>
              </button>
              {groups.map((g) => (
                <button key={g.id} role="tab" aria-selected={filter === g.id} className={filter === g.id ? "is-on" : ""} onClick={() => setFilter(g.id)}>
                  {g.tab || g.label}<sup>{counts[g.id] || 0}</sup>
                </button>
              ))}
            </div>
            <label className="pp-search">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={d.searchPlaceholder} aria-label={d.searchPlaceholder} />
            </label>
          </div>

          <p className="pp-count" aria-live="polite">
            <span><b>{shown.length}</b> of {people.length} people</span>
            {filtered && <button className="pp-link" onClick={clearFilters}>{d.clear || "Clear filters"}</button>}
          </p>

          <div className="pp-grid" key={filter + "|" + q}>
            {shown.map((p, i) => (
              <Link href={profile(p)} className="pp-pcard pp-pop pp-spot" style={DS(Math.min(i, 14))} key={p.id}>
                <Media person={p} hints={hints} className="pp-portrait" />
                <div className="pp-pcard-body">
                  <h3>{p.name}</h3>
                  <p>{p.role}</p>
                  {p.area && <span className="pp-area">{p.area}</span>}
                </div>
              </Link>
            ))}
          </div>
          {shown.length === 0 && (
            <div className="pp-empty pp-pop">
              <p>{d.empty}</p>
              <button className="pp-link" onClick={clearFilters}>{d.clear || "Clear filters"}</button>
            </div>
          )}
        </div>
      );
    },

    early: (n) => {
      const e = c.early;
      return (
        <>
          <div className="pp-wrap">
            <Head n={n} label={e.eyebrow || e.title} title={e.title} />
            <div className="pp-railhead pp-rv">
              <p className="pp-lede">{e.text}</p>
              <div className="pp-arrows">
                <button onClick={() => nudge(-1)} aria-label="Previous">←</button>
                <button onClick={() => nudge(1)} aria-label="Next">→</button>
              </div>
            </div>
          </div>
          <div className="pp-rail pp-rv" style={D(2)} ref={rail} onPointerDown={onDown} onPointerMove={onDrag} onPointerUp={onUp} onPointerLeave={onUp}>
            {early.map((p) => {
              const g = groupOf[p.group];
              return (
                <Link href={profile(p)} className="pp-slide" onClick={stopIfDragged} draggable={false} key={p.id}>
                  <Media person={p} hints={hints} className="pp-portrait" />
                  <div className="pp-slide-body">
                    <span className="pp-tag">{p.tag || (g && g.tag) || p.role}</span>
                    <h3>{p.name}</h3>
                    <p>{p.topic || p.area}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </>
      );
    },

    cta: () => {
      const t = c.cta;
      return (
        <div className="pp-wrap">
          <div className="pp-cta-in">
            <div>
              <h2 className="pp-h pp-rv">{t.title}</h2>
              <p className="pp-lede pp-rv" style={D(1)}>{t.text}</p>
              {t.footer && <p className="pp-foot pp-rv" style={D(2)}>{t.footer}</p>}
            </div>
            <div className="pp-cta-links pp-rv" style={D(2)}>
              {t.items.map((it, i) => (
                <Link href={to(it.href)} className="pp-cta-link pp-mag" key={it.id}>
                  <span className="pp-cta-n">{pad(i)}</span>
                  <span className="pp-cta-t"><b>{it.title}</b><small>{it.text}</small></span>
                  <Arrow />
                </Link>
              ))}
            </div>
          </div>
        </div>
      );
    },
  };

  const h = c.hero;
  const heroImg = photoUrl({ photo: h.image });
  const [heroFail, setHeroFail] = useState(false);
  const heroLines = Array.isArray(h.headline) ? h.headline : [h.headline];

  return (
    <div className="pp" ref={rootRef} onMouseMove={onMove} onMouseOut={onOut}>

      {/* ===================== HERO ===================== */}
      {heroSec && (
        <section className="pp-hero" id="people-hero">
          {heroImg && !heroFail && (
            <div className="pp-hero-media" aria-hidden="true"><img src={heroImg} alt="" loading="eager" decoding="async" onError={() => setHeroFail(true)} /></div>
          )}
          <div className="pp-grid-bg" aria-hidden="true" />
          <div className="pp-glow" aria-hidden="true" />

          <div className="pp-wrap pp-hero-copy">
            {h.eyebrow && <p className="pp-eyebrow"><i />{h.eyebrow}</p>}
            <h1 className="pp-title" aria-label={heroLines.join(" ")}>
              {heroLines.map((l, i) => (
                <span className="pp-ln" key={l}><span className={l === h.highlight ? "pp-hl" : ""} style={{ "--i": i }}>{l}</span></span>
              ))}
            </h1>
            <p className="pp-hero-lede">{h.lead}</p>
            <div className="pp-hero-cta">
              <button className="pp-btn pp-mag" onClick={() => goTo(h.primary.target)}>{h.primary.label}<Arrow /></button>
              <Link className="pp-btn pp-btn--ghost pp-mag" href={to(h.secondary.href)}>{h.secondary.label}<Arrow /></Link>
            </div>
          </div>

          <div className="pp-wrap pp-glance">
            <div className="pp-glance-bar">
              <span>At a glance</span>
              {h.caption && <span><b>{h.caption.place}</b> &middot; {h.caption.note}</span>}
            </div>
            <div className="pp-glance-grid">
              {stats.map((s, i) => (
                <div className="pp-gl" key={s.label}>
                  <strong><Counter value={s.n} suffix={s.suffix} delay={900 + i * 100} /></strong>
                  <span className="pp-gl-label">{s.label}</span>
                  {s.note && <p className="pp-gl-note">{s.note}</p>}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===================== STICKY MENU ===================== */}
      {navList.length > 0 && (
        <nav className="pp-subnav" aria-label="People sections">
          <div className="pp-wrap pp-subnav-scroll">
            <ul>
              {navList.map((s) => (
                <li key={s.id}>
                  <a
                    href={`#people-${s.id}`}
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

      {/* ===================== TICKER ===================== */}
      {c.ticker && c.ticker.length > 0 && (
        <div className="pp-ticker" aria-hidden="true">
          <div className="pp-ticker-track">
            {[0, 1].map((k) => <ul key={k}>{c.ticker.map((t) => <li key={t + k}>{t}</li>)}</ul>)}
          </div>
        </div>
      )}

      {/* ===================== SECTIONS ===================== */}
      {rest.map((s) => {
        const render = SECTIONS[s.id];
        if (!render) return null;
        const idx = Math.max(0, navList.findIndex((x) => x.id === s.id));
        return (
          <section key={s.id} id={"people-" + s.id} className={`pp-sec pp-${s.tone || "dark"} pp-sec-${s.id}`}>
            {render(idx)}
          </section>
        );
      })}
    </div>
  );
}

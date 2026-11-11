import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@inertiajs/react";
import { useResearchContent, assetUrl } from "../../data/COEUAS-data/researchContent";
import { BASE } from "../../data/COEUAS-data/siteMapCOEUAS";
/* people.css supplies the shared design system (.pp-*). research.css adds only what Research needs (.rs-*). */
import "../../../css/COE-UAS-css/people.css";
import "../../../css/COE-UAS-css/research.css";

/* ------------------------------------------------------------------
   Research.jsx is layout and motion only.
   All text, numbers and records come from researchContent.js
   (later: the admin CMS). Pass a `content` prop to preview changes.
   Section ids match siteMapCOEUAS.js, so /research#projects-ongoing works.
------------------------------------------------------------------- */

const to = (h = "/") =>
  h === "/" ? BASE : h.startsWith("/") && !h.startsWith(BASE + "/") && h !== BASE ? BASE + h : h;

const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const pad = (n) => String(n + 1).padStart(2, "0");
const D = (i) => ({ "--d": i * 90 });
const DS = (i) => ({ "--d": i * 55 });
const money = (n, cur) => `${cur} ${Number(n).toLocaleString("en-MY")}`;
const period = (a, b) => `${a}\u2013${b || "present"}`;

const Arrow = () => (
  <svg className="pp-arrow" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
    <path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

function useReveal(rootRef, dep) {
  useEffect(() => {
    const nodes = rootRef.current ? rootRef.current.querySelectorAll(".pp-rv:not(.in)") : [];
    if (reduced() || !("IntersectionObserver" in window)) {
      nodes.forEach((n) => n.classList.add("in"));
      return undefined;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    nodes.forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, [rootRef, dep]);
}

function Counter({ value, suffix = "", decimals = 0, delay = 0 }) {
  const ref = useRef(null);
  const [v, setV] = useState(reduced() ? value : 0);
  useEffect(() => {
    if (reduced()) { setV(value); return undefined; }
    let raf = 0, timer = 0;
    const run = () => {
      const t0 = performance.now();
      const tick = (t) => {
        const p = Math.min(1, (t - t0) / 1500);
        setV(value * (p === 1 ? 1 : 1 - Math.pow(2, -10 * p)));
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { io.disconnect(); timer = setTimeout(run, delay); }
    }, { threshold: 0.4 });
    io.observe(ref.current);
    return () => { io.disconnect(); clearTimeout(timer); cancelAnimationFrame(raf); };
  }, [value, delay]);
  return <span ref={ref}>{v.toFixed(decimals)}{suffix && <small>{suffix}</small>}</span>;
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

/* filter pills with live counts (filters come from the data file) */
function Tabs({ label, filters, value, onChange, counts }) {
  return (
    <div className="pp-tabs" role="group" aria-label={label}>
      {filters.map((f) => (
        <button key={f.id} aria-pressed={value === f.id} className={value === f.id ? "is-on" : ""} onClick={() => onChange(f.id)}>
          {f.label}<sup>{counts[f.id] || 0}</sup>
        </button>
      ))}
    </div>
  );
}

function Search({ value, onChange, placeholder }) {
  return (
    <label className="pp-search">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label={placeholder} />
    </label>
  );
}

/* invisible targets so every chip link in the site map lands somewhere */
const Anchors = ({ ids }) => ids.map((id) => <span key={id} id={id} className="rs-anchor" aria-hidden="true" />);

const Empty = ({ text, clear, onClear }) => (
  <div className="pp-empty pp-pop">
    <p>{text}</p>
    {onClear && <button className="pp-link" onClick={onClear}>{clear || "Clear filters"}</button>}
  </div>
);

const matchFilter = (filters, id, item) => {
  const f = filters.find((x) => x.id === id);
  return !f || !f.field || item[f.field] === f.id;
};
const countBy = (filters, items) => Object.fromEntries(filters.map((f) => [f.id, items.filter((i) => matchFilter(filters, f.id, i)).length]));

/* ==========================================================================
   PAGE
========================================================================== */

export default function Research({ content: override }) {
  const { content: c } = useResearchContent(override);
  const rootRef = useRef(null);

  const groups = c.groups || [];
  const projects = c.projects || [];
  const grants = c.grants || [];
  const groupOf = useMemo(() => Object.fromEntries(groups.map((g) => [g.id, g])), [groups]);

  const list = c.sections.filter((s) => s.visible);
  const heroSec = list.find((s) => s.id === "hero");
  const rest = list.filter((s) => s.id !== "hero");
  const navList = rest.filter((s) => s.nav);
  const navKey = navList.map((s) => s.id).join();
  const [active, setActive] = useState(navList[0] ? navList[0].id : "");

  /* one active filter per section, plus the extra project filters */
  const [tabs, setTabs] = useState({ projects: "all", grants: "all", innovation: "all", opportunities: "all" });
  const setTab = (k, v) => setTabs((t) => ({ ...t, [k]: v }));
  const [pGroup, setPGroup] = useState("all");
  const [pQ, setPQ] = useState("");
  const [gQ, setGQ] = useState("");

  useReveal(rootRef, list.map((s) => s.id).join() + "|" + tabs.projects + tabs.grants + tabs.innovation + tabs.opportunities + pGroup + pQ + gQ);

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

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const a = root.querySelector(".pp-subnav a.is-active");
    const box = root.querySelector(".pp-subnav-scroll");
    if (a && box) box.scrollTo({ left: a.offsetLeft - box.clientWidth / 2 + a.clientWidth / 2, behavior: "smooth" });
  }, [active]);

  const goTo = useCallback((id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: reduced() ? "auto" : "smooth", block: "start" });
  }, []);

  /* links like /research#projects-ongoing: switch the filter, then scroll */
  useEffect(() => {
    const apply = () => {
      const h = decodeURIComponent(window.location.hash.slice(1));
      if (!h) return;
      const map = { projects: c.projectsSection, grants: c.grantsSection, innovation: c.innovationSection, opportunities: c.opportunitiesSection };
      Object.keys(map).forEach((k) => {
        const f = map[k].filters.find((x) => `${k}-${x.id}` === h);
        if (f) setTab(k, f.id);
      });
      setTimeout(() => goTo(h), 60);
    };
    apply();
    window.addEventListener("hashchange", apply);
    return () => window.removeEventListener("hashchange", apply);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* pointer effects: magnetic buttons and hero glow (same as People) */
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

  /* ---------- derived data ---------- */
  const pS = c.projectsSection, gS = c.grantsSection, iS = c.innovationSection, oS = c.opportunitiesSection;

  const projCounts = useMemo(() => countBy(pS.filters, projects), [pS.filters, projects]);
  const shownProjects = projects.filter((p) =>
    matchFilter(pS.filters, tabs.projects, p) &&
    (pGroup === "all" || p.group === pGroup) &&
    (!pQ.trim() || `${p.title} ${p.summary} ${p.lead} ${p.partner}`.toLowerCase().includes(pQ.trim().toLowerCase())));
  const projFiltered = tabs.projects !== "all" || pGroup !== "all" || pQ.trim() !== "";
  const clearProjects = () => { setTab("projects", "all"); setPGroup("all"); setPQ(""); };

  const grantCounts = useMemo(() => countBy(gS.filters, grants), [gS.filters, grants]);
  const shownGrants = grants.filter((g) =>
    matchFilter(gS.filters, tabs.grants, g) &&
    (!gQ.trim() || `${g.title} ${g.funder} ${g.lead}`.toLowerCase().includes(gQ.trim().toLowerCase())));
  const grantTotal = shownGrants.reduce((s, g) => s + (g.amount || 0), 0);
  const grantCur = grants[0] ? grants[0].currency : "RM";
  const grantFiltered = tabs.grants !== "all" || gQ.trim() !== "";
  const clearGrants = () => { setTab("grants", "all"); setGQ(""); };

  const innoCounts = useMemo(() => countBy(iS.filters, c.innovation), [iS.filters, c.innovation]);
  const shownInno = c.innovation.filter((i) => matchFilter(iS.filters, tabs.innovation, i));
  const oppCounts = useMemo(() => countBy(oS.filters, c.opportunities), [oS.filters, c.opportunities]);
  const shownOpp = c.opportunities.filter((o) => matchFilter(oS.filters, tabs.opportunities, o));
  const labelOf = (filters, id) => (filters.find((f) => f.id === id) || {}).label || id;

  const source = {
    groups: groups.length,
    projects: projects.length,
    ongoing: projects.filter((p) => p.status === "ongoing").length,
    grants: grants.length,
    grantValue: grants.reduce((s, g) => s + (g.amount || 0), 0) / 1e6,
    patents: c.innovation.filter((i) => i.kind === "patents").length,
  };
  const stats = (c.hero.stats || []).map((s) => ({ ...s, n: s.source ? source[s.source] || 0 : s.value || 0 }));

  const viewGroup = (id) => { setPGroup(id); setTab("projects", "all"); setPQ(""); goTo("projects"); };

  /* ---------- the sections ---------- */
  const SECTIONS = {
    groups: (n) => {
      const s = c.groupsSection;
      return (
        <div className="pp-wrap">
          <Head n={n} label={s.eyebrow || "Research groups"} title={s.title} lede={s.text} />
          <div className="rs-groups">
            {groups.map((g, i) => {
              const count = projects.filter((p) => p.group === g.id).length;
              return (
                <article className="rs-card rs-group pp-rv" style={D(i)} key={g.id}>
                  <span className="rs-group-n" aria-hidden="true">{pad(i)}</span>
                  <h3>{g.name}</h3>
                  <p className="rs-by">Led by {g.lead}</p>
                  <p className="rs-sum">{g.summary}</p>
                  <ul className="rs-chips">{g.focus.map((f) => <li key={f}>{f}</li>)}</ul>
                  <div className="rs-group-foot">
                    <span className="rs-figs"><b>{g.members}</b> members <b>{count}</b> {count === 1 ? "project" : "projects"}</span>
                    <button className="pp-link" onClick={() => viewGroup(g.id)}>{s.viewLabel || "View projects"}<Arrow /></button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      );
    },

    projects: (n) => (
      <div className="pp-wrap">
        <Head n={n} label="Projects" title={pS.title} lede={pS.text} />
        <Anchors ids={pS.filters.filter((f) => f.id !== "all").map((f) => `projects-${f.id}`)} />
        <div className="pp-tools pp-rv">
          <Tabs label="Filter projects" filters={pS.filters} value={tabs.projects} onChange={(v) => setTab("projects", v)} counts={projCounts} />
          <div className="rs-tools-r">
            <label className="rs-select">
              <span>{pS.groupLabel}</span>
              <select value={pGroup} onChange={(e) => setPGroup(e.target.value)}>
                <option value="all">{pS.allGroups}</option>
                {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </label>
            <Search value={pQ} onChange={setPQ} placeholder={pS.searchPlaceholder} />
          </div>
        </div>
        <p className="pp-count" aria-live="polite">
          <span><b>{shownProjects.length}</b> of {projects.length} projects</span>
          {projFiltered && <button className="pp-link" onClick={clearProjects}>{pS.clear}</button>}
        </p>
        <div className="rs-projects" key={tabs.projects + pGroup + pQ}>
          {shownProjects.map((p, i) => (
            <article className="rs-card rs-project pp-pop" style={DS(Math.min(i, 12))} key={p.id}>
              <div className="rs-project-top">
                <span className={`rs-pill st-${p.status}`}>{c.statuses[p.status] || p.status}</span>
                {p.type !== "internal" && <span className="rs-type">{labelOf(pS.filters, p.type)}</span>}
              </div>
              <h3>{p.title}</h3>
              <p className="rs-sum">{p.summary}</p>
              <dl className="rs-meta">
                <div><dt>Group</dt><dd>{(groupOf[p.group] || {}).name || "\u2013"}</dd></div>
                <div><dt>Lead</dt><dd>{p.lead}</dd></div>
                <div><dt>Funder</dt><dd>{p.funder || "\u2013"}</dd></div>
                <div><dt>Period</dt><dd>{period(p.start, p.end)}</dd></div>
                {p.partner && <div><dt>Partner</dt><dd>{p.partner}</dd></div>}
                <div><dt>Outputs</dt><dd>{p.outputs}</dd></div>
              </dl>
            </article>
          ))}
        </div>
        {shownProjects.length === 0 && <Empty text={pS.empty} clear={pS.clear} onClear={clearProjects} />}
      </div>
    ),

    grants: (n) => (
      <div className="pp-wrap">
        <Head n={n} label="Grants" title={gS.title} lede={gS.text} />
        <div className="pp-tools pp-rv">
          <Tabs label="Filter grants" filters={gS.filters} value={tabs.grants} onChange={(v) => setTab("grants", v)} counts={grantCounts} />
          <Search value={gQ} onChange={setGQ} placeholder={gS.searchPlaceholder} />
        </div>
        <p className="pp-count" aria-live="polite">
          <span><b>{shownGrants.length}</b> of {grants.length} grants</span>
          {grantFiltered && <button className="pp-link" onClick={clearGrants}>{gS.clear}</button>}
        </p>
        {shownGrants.length > 0 && (
          <div className="rs-tablewrap pp-rv">
            <table className="rs-table">
              <thead>
                <tr>{Object.entries(gS.columns).map(([k, v]) => <th key={k} scope="col" className={k === "amount" ? "num" : ""}>{v}</th>)}</tr>
              </thead>
              <tbody>
                {shownGrants.map((g) => (
                  <tr key={g.id}>
                    <th scope="row" data-label={gS.columns.grant}>{g.title}</th>
                    <td data-label={gS.columns.funder}>{g.funder}</td>
                    <td data-label={gS.columns.lead}>{g.lead}</td>
                    <td data-label={gS.columns.period}>{period(g.start, g.end)}</td>
                    <td className="num" data-label={gS.columns.amount}>{money(g.amount, g.currency)}</td>
                    <td data-label={gS.columns.status}><span className={`rs-pill st-${g.status}`}>{c.statuses[g.status] || g.status}</span></td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr><th scope="row" colSpan={4}>{gS.totalLabel}</th><td className="num" colSpan={2}>{money(grantTotal, grantCur)}</td></tr>
              </tfoot>
            </table>
          </div>
        )}
        {shownGrants.length === 0 && <Empty text={gS.empty} clear={gS.clear} onClear={clearGrants} />}
      </div>
    ),

    innovation: (n) => (
      <div className="pp-wrap">
        <Head n={n} label="Innovation and IP" title={iS.title} lede={iS.text} />
        <Anchors ids={iS.filters.filter((f) => f.id !== "all").map((f) => `innovation-${f.id}`)} />
        <div className="pp-tools pp-rv">
          <Tabs label="Filter innovation" filters={iS.filters} value={tabs.innovation} onChange={(v) => setTab("innovation", v)} counts={innoCounts} />
        </div>
        <div className="rs-cards" key={tabs.innovation}>
          {shownInno.map((it, i) => (
            <article className="rs-card rs-item pp-pop" style={DS(Math.min(i, 12))} key={it.id}>
              <span className="rs-type">{labelOf(iS.filters, it.kind)}</span>
              <h3>{it.title}</h3>
              <p className="rs-sum">{it.text}</p>
              {it.meta && it.meta.length > 0 && <ul className="rs-chips">{it.meta.map((m) => <li key={m}>{m}</li>)}</ul>}
            </article>
          ))}
        </div>
        {shownInno.length === 0 && <Empty text={iS.empty} />}
      </div>
    ),

    opportunities: (n) => (
      <div className="pp-wrap">
        <Head n={n} label="Opportunities" title={oS.title} lede={oS.text} />
        <Anchors ids={oS.filters.filter((f) => f.id !== "all").map((f) => `opportunities-${f.id}`)} />
        <div className="pp-tools pp-rv">
          <Tabs label="Filter opportunities" filters={oS.filters} value={tabs.opportunities} onChange={(v) => setTab("opportunities", v)} counts={oppCounts} />
        </div>
        <div className="rs-cards" key={tabs.opportunities}>
          {shownOpp.map((o, i) => {
            const cta = { label: oS.defaultCta.label, href: o.href || oS.defaultCta.href };
            return (
              <article className="rs-card rs-item pp-pop" style={DS(Math.min(i, 12))} key={o.id}>
                <span className="rs-type">{o.tag || labelOf(oS.filters, o.kind)}</span>
                <h3>{o.title}</h3>
                <p className="rs-sum">{o.text}</p>
                <div className="rs-item-foot">
                  {o.detail && <span className="rs-detail">{o.detail}</span>}
                  <Link className="pp-link" href={to(cta.href)}>{cta.label}<Arrow /></Link>
                </div>
              </article>
            );
          })}
        </div>
        {shownOpp.length === 0 && <Empty text={oS.empty} />}
      </div>
    ),

    "featured-programmes": (n) => {
      const s = c.programmesSection;
      return (
        <div className="pp-wrap">
          <Head n={n} label="Featured programmes" title={s.title} lede={s.text} />
          <Anchors ids={c.programmes.map((p) => p.id === "sandbox" ? "perlis-airspace-sandbox" : p.id)} />
          <div className="rs-progs">
            {c.programmes.map((p, i) => (
              <article className="rs-card rs-prog pp-rv" style={D(i)} key={p.id}>
                <div className="rs-prog-main">
                  <span className="rs-pill st-ongoing">{p.status}</span>
                  <h3>{p.name}</h3>
                  <p className="rs-sum">{p.summary}</p>
                  {p.href && <Link className="pp-link" href={p.internal ? to(p.href) : p.href}>{s.moreLabel}<Arrow /></Link>}
                </div>
                <div className="rs-prog-side">
                  <ul className="rs-ticks">{p.highlights.map((h) => <li key={h}>{h}</li>)}</ul>
                  {p.facts.length > 0 && (
                    <dl className="rs-facts">{p.facts.map((f) => <div key={f.label}><dd>{f.value}</dd><dt>{f.label}</dt></div>)}</dl>
                  )}
                </div>
              </article>
            ))}
          </div>
        </div>
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
  const heroImg = assetUrl(h.image);
  const [heroFail, setHeroFail] = useState(false);
  const heroLines = Array.isArray(h.headline) ? h.headline : [h.headline];

  return (
    <div className="pp rs" ref={rootRef} onMouseMove={onMove} onMouseOut={onOut}>

      {heroSec && (
        <section className="pp-hero" id="research-hero">
          {heroImg && !heroFail && (
            <div className="pp-hero-media" aria-hidden="true"><img src={heroImg} alt="" loading="eager" decoding="async" onError={() => setHeroFail(true)} /></div>
          )}
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
                  <strong><Counter value={s.n} suffix={s.suffix} decimals={s.decimals || 0} delay={900 + i * 100} /></strong>
                  <span className="pp-gl-label">{s.label}</span>
                  {s.note && <p className="pp-gl-note">{s.note}</p>}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {navList.length > 0 && (
        <nav className="pp-subnav" aria-label="Research sections">
          <div className="pp-wrap pp-subnav-scroll">
            <ul>
              {navList.map((s) => (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
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

      {c.ticker && c.ticker.length > 0 && (
        <div className="pp-ticker" aria-hidden="true">
          <div className="pp-ticker-track">
            {[0, 1].map((k) => <ul key={k}>{c.ticker.map((t) => <li key={t + k}>{t}</li>)}</ul>)}
          </div>
        </div>
      )}

      {rest.map((s) => {
        const render = SECTIONS[s.id];
        if (!render) return null;
        const idx = Math.max(0, navList.findIndex((x) => x.id === s.id));
        return (
          <section key={s.id} id={s.id} className={`pp-sec pp-${s.tone || "dark"} pp-sec-${s.id}`}>
            {render(idx)}
          </section>
        );
      })}
    </div>
  );
}

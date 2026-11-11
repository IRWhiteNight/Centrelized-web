import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@inertiajs/react";
import { usePublicationsContent } from "../../data/COEUAS-data/publicationsContent";
import { BASE } from "../../data/COEUAS-data/siteMapCOEUAS";
import "../../../css/COE-UAS-css/publications.css";

/* ------------------------------------------------------------------
   Publications.jsx is layout and motion only.
   All text, numbers and records come from publicationsContent.js
   (later: the admin CMS). Pass a `content` prop to preview changes.
   Section ids match the site map anchors, so the navbar links work:
   #publications  #citations  #highlights  #archive
   plus the chip anchors: #journal-articles #conference-papers
   #books-chapters #other-publications #citation-indicators
   #citation-members
   The top navigation bar comes from COEUAsWebsiteLayout.
------------------------------------------------------------------- */

const to = (h = "/") =>
  h === "/" ? BASE : h.startsWith("/") && !h.startsWith(BASE + "/") && h !== BASE ? BASE + h : h;

const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const D = (i) => ({ "--d": i * 90 });
const num = (n) => Number(n || 0).toLocaleString();

const Arrow = () => (
  <svg className="pu-arrow" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
    <path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const SearchIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
);

/* adds .in to every .pu-rv once it scrolls into view */
function useReveal(rootRef, dep) {
  useEffect(() => {
    const nodes = rootRef.current ? rootRef.current.querySelectorAll(".pu-rv:not(.in)") : [];
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
  return <span ref={ref}>{v.toLocaleString()}</span>;
}

function Head({ label, title, lede }) {
  return (
    <header className="pu-head">
      <p className="pu-kicker pu-rv"><span>{label}</span></p>
      <h2 className="pu-h pu-rv" style={D(1)}>{title}</h2>
      {lede && <p className="pu-lede pu-rv" style={D(2)}>{lede}</p>}
    </header>
  );
}

/* ==========================================================================
   PAGE
========================================================================== */

export default function Publications({ content: override }) {
  const { content: c } = usePublicationsContent(override);
  const rootRef = useRef(null);

  const types = c.types || [];
  const statuses = c.statuses || [];
  const groups = c.groups || [];
  const members = c.members || [];
  const pubs = c.publications || [];
  const yearly = c.yearly || [];
  const highlights = c.highlights || [];
  const st = c.settings || {};
  const pageSize = st.pageSize || 8;
  const archiveSize = st.archivePageSize || 12;

  const typeOf = useMemo(() => Object.fromEntries(types.map((t) => [t.id, t])), [types]);
  const statusOf = useMemo(() => Object.fromEntries(statuses.map((s) => [s.id, s])), [statuses]);
  const groupOf = useMemo(() => Object.fromEntries(groups.map((g) => [g.id, g])), [groups]);
  const memberOf = useMemo(() => Object.fromEntries(members.map((m) => [m.id, m])), [members]);

  /* sections that can be drawn, in the order set in publicationsContent.js */
  const list = c.sections.filter((s) => s.visible);
  const heroSec = list.find((s) => s.id === "hero");
  const rest = list.filter((s) => s.id !== "hero");
  const navList = rest.filter((s) => s.nav);
  const navKey = navList.map((s) => s.id).join();
  const [active, setActive] = useState(navList[0] ? navList[0].id : "");

  /* ---------- state ---------- */
  const [filter, setFilter] = useState("all");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("new");
  const [limit, setLimit] = useState(pageSize);

  const [metric, setMetric] = useState("cites");
  const [cy, setCy] = useState(yearly.length ? yearly[yearly.length - 1].year : 0);
  const [msort, setMsort] = useState("citations");

  const yearsDesc = useMemo(() => yearly.map((y) => y.year).sort((a, b) => b - a), [yearly]);
  const firstWith = (highlights.slice().sort((a, b) => b.year - a.year)[0] || {}).year;
  const [hy, setHy] = useState(firstWith || yearsDesc[0]);

  const [af, setAf] = useState({ year: "all", member: "all", group: "all", status: "all", q: "" });
  const [alimit, setAlimit] = useState(archiveSize);

  useReveal(rootRef, list.map((s) => s.id).join() + "|" + pubs.length);

  /* ---------- scroll: progress bar, hero parallax, active menu item ---------- */
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    const heroEl = root.querySelector(".pu-hero");
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

  /* keep the active menu item visible on small screens */
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const a = root.querySelector(".pu-subnav a.is-active");
    const box = root.querySelector(".pu-subnav-scroll");
    if (a && box) box.scrollTo({ left: a.offsetLeft - box.clientWidth / 2 + a.clientWidth / 2, behavior: "smooth" });
  }, [active]);

  const goTo = useCallback((id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: reduced() ? "auto" : "smooth", block: "start" });
  }, []);

  /* navbar links such as #journal-articles open the list already filtered */
  useEffect(() => {
    const apply = () => {
      const id = decodeURIComponent(window.location.hash.slice(1));
      if (!id) return;
      const t = types.find((x) => x.chip === id);
      if (t) { setFilter(t.id); setQ(""); setLimit(pageSize); setTimeout(() => goTo("publications"), 50); }
      else setTimeout(() => goTo(id), 50);
    };
    const t0 = setTimeout(apply, 120);
    window.addEventListener("hashchange", apply);
    return () => { clearTimeout(t0); window.removeEventListener("hashchange", apply); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* pointer effects: magnetic buttons, hero glow */
  const onMove = useCallback((e) => {
    const t = e.target;
    if (!t.closest || reduced()) return;
    const mag = t.closest(".pu-mag");
    if (mag) {
      const r = mag.getBoundingClientRect();
      mag.style.setProperty("--tx", `${((e.clientX - (r.left + r.width / 2)) * 0.22).toFixed(1)}px`);
      mag.style.setProperty("--ty", `${((e.clientY - (r.top + r.height / 2)) * 0.3).toFixed(1)}px`);
    }
  }, []);
  const onOut = useCallback((e) => {
    const t = e.target.closest && e.target.closest(".pu-mag");
    if (t && !t.contains(e.relatedTarget)) ["--tx", "--ty"].forEach((p) => t.style.removeProperty(p));
  }, []);

  /* ---------- derived data ---------- */
  const typeCounts = useMemo(() => {
    const m = {};
    pubs.forEach((p) => { m[p.type] = (m[p.type] || 0) + 1; });
    return m;
  }, [pubs]);

  const shown = useMemo(() => {
    const t = q.trim().toLowerCase();
    return pubs
      .filter((p) => (filter === "all" || p.type === filter) && (!t || `${p.title} ${(p.authors || []).join(" ")} ${p.venue}`.toLowerCase().includes(t)))
      .sort((a, b) => (sort === "new" ? b.year - a.year || b.cites - a.cites : b.cites - a.cites || b.year - a.year));
  }, [pubs, filter, q, sort]);
  const filtered = filter !== "all" || q.trim() !== "";
  const clearPubs = () => { setFilter("all"); setQ(""); setLimit(pageSize); };

  const archive = useMemo(() => {
    const t = af.q.trim().toLowerCase();
    return pubs
      .filter((p) => (af.year === "all" || p.year === Number(af.year))
        && (af.member === "all" || (p.members || []).includes(af.member))
        && (af.group === "all" || p.group === af.group)
        && (af.status === "all" || p.status === af.status)
        && (!t || `${p.title} ${(p.authors || []).join(" ")} ${p.venue}`.toLowerCase().includes(t)))
      .sort((a, b) => b.year - a.year || a.title.localeCompare(b.title));
  }, [pubs, af]);
  const archFiltered = Object.entries(af).some(([k, v]) => (k === "q" ? v.trim() !== "" : v !== "all"));
  const setA = (k, v) => { setAf((s) => ({ ...s, [k]: v })); setAlimit(archiveSize); };
  const clearArchive = () => { setAf({ year: "all", member: "all", group: "all", status: "all", q: "" }); setAlimit(archiveSize); };

  const sortedMembers = useMemo(() => {
    const k = msort === "pubs" ? "pubs" : msort === "hIndex" ? "hIndex" : "citations";
    return members.slice().sort((a, b) => b[k] - a[k]);
  }, [members, msort]);
  const maxMember = Math.max(1, ...members.map((m) => m.citations));

  const maxMetric = Math.max(1, ...yearly.map((y) => y[metric]));
  const sel = yearly.find((y) => y.year === cy) || yearly[yearly.length - 1] || { year: "", pubs: 0, cites: 0 };
  const hl = highlights.find((h) => h.year === hy);

  /* ---------- small renderers ---------- */
  const renderPub = (p, i) => (
    <article className="pu-pub pu-pop" style={DS(Math.min(i, 10))} key={p.id}>
      <span className="pu-yr">{p.year}</span>
      <div className="pu-pub-main">
        <h3>{p.url ? <a href={p.url} target="_blank" rel="noopener noreferrer">{p.title}</a> : p.title}</h3>
        <p>{(p.authors || []).join(", ")}. {p.venue}.</p>
        <div className="pu-meta">
          <span className="pu-tag">{(typeOf[p.type] || {}).label || p.type}</span>
          {p.status && p.status !== "published" && <span className="pu-tag pu-tag--s">{(statusOf[p.status] || {}).label || p.status}</span>}
        </div>
      </div>
      <span className="pu-cite"><b>{num(p.cites)}</b>citations</span>
    </article>
  );

  /* ---------- the sections ---------- */
  const SECTIONS = {
    publications: () => {
      const t = c.texts.publications;
      return (
        <div className="pu-wrap">
          <Head label={t.label || "Publications"} title={t.title} lede={t.text} />

          <div className="pu-types pu-rv" role="group" aria-label="Publication types">
            {types.map((ty) => (
              <button key={ty.id} id={ty.chip} className={`pu-type${filter === ty.id ? " is-on" : ""}`} aria-pressed={filter === ty.id}
                onClick={() => { setFilter(filter === ty.id ? "all" : ty.id); setLimit(pageSize); }}>
                <strong>{num(ty.count ?? typeCounts[ty.id] ?? 0)}</strong>
                <span className="pu-type-name">{ty.label}</span>
                <span className="pu-type-text">{ty.text}</span>
              </button>
            ))}
          </div>

          <div className="pu-tools pu-rv">
            <div className="pu-tabs" role="tablist" aria-label="Filter by type">
              <button role="tab" aria-selected={filter === "all"} className={filter === "all" ? "is-on" : ""} onClick={() => { setFilter("all"); setLimit(pageSize); }}>{t.allLabel || "All"}<sup>{pubs.length}</sup></button>
              {types.map((ty) => (
                <button key={ty.id} role="tab" aria-selected={filter === ty.id} className={filter === ty.id ? "is-on" : ""} onClick={() => { setFilter(ty.id); setLimit(pageSize); }}>{ty.tab || ty.label}<sup>{typeCounts[ty.id] || 0}</sup></button>
              ))}
            </div>
            <div className="pu-tools-r">
              <label className="pu-search">
                <SearchIcon />
                <input value={q} onChange={(e) => { setQ(e.target.value); setLimit(pageSize); }} placeholder={t.searchPlaceholder} aria-label={t.searchPlaceholder} />
              </label>
              <label className="pu-select">
                <span>Sort</span>
                <select value={sort} onChange={(e) => setSort(e.target.value)}>
                  <option value="new">Newest first</option>
                  <option value="cited">Most cited</option>
                </select>
              </label>
            </div>
          </div>

          <p className="pu-count" aria-live="polite">
            <span><b>{shown.length}</b> {shown.length === 1 ? "publication" : "publications"}</span>
            {filtered && <button className="pu-link" onClick={clearPubs}>{t.clear}</button>}
          </p>

          <div className="pu-list" key={filter + "|" + sort + "|" + q}>
            {shown.slice(0, limit).map(renderPub)}
          </div>
          {shown.length === 0 && (
            <div className="pu-empty"><p>{t.empty}</p><button className="pu-link" onClick={clearPubs}>{t.clear}</button></div>
          )}
          {shown.length > limit && (
            <div className="pu-more-row">
              <button className="pu-btn pu-mag" onClick={() => setLimit((n) => n + pageSize)}>{t.more} ({shown.length - limit} left)<Arrow /></button>
            </div>
          )}
        </div>
      );
    },

    citations: () => {
      const t = c.texts.citations;
      return (
        <div className="pu-wrap">
          <Head label={t.label || "Citations and impact"} title={t.title} lede={t.text} />

          <div id="citation-indicators" className="pu-block">
            <h3 className="pu-h3 pu-rv">{t.indicatorsTitle}</h3>
            <div className="pu-ind pu-rv" style={D(1)}>
              {(c.indicators || []).map((s, i) => (
                <div className="pu-ind-i" key={s.label}>
                  <strong><Counter value={s.value} delay={i * 100} /></strong>
                  <span>{s.label}</span>
                </div>
              ))}
            </div>
            <p className="pu-small pu-rv" style={D(2)}>Source: {st.source}. Last updated {st.updated}.</p>
          </div>

          <div className="pu-chart pu-rv">
            <div className="pu-chart-top">
              <div>
                <h3 className="pu-h3">Output by year</h3>
                <p className="pu-readout" aria-live="polite"><b>{sel.year}</b> {num(sel.pubs)} publications, {num(sel.cites)} citations</p>
              </div>
              <div className="pu-tabs" role="tablist" aria-label="Chart metric">
                <button role="tab" aria-selected={metric === "cites"} className={metric === "cites" ? "is-on" : ""} onClick={() => setMetric("cites")}>Citations</button>
                <button role="tab" aria-selected={metric === "pubs"} className={metric === "pubs" ? "is-on" : ""} onClick={() => setMetric("pubs")}>Publications</button>
              </div>
            </div>
            <div className="pu-bars" role="group" aria-label={metric === "cites" ? "Citations per year" : "Publications per year"}>
              {yearly.map((y) => (
                <button key={y.year} className={`pu-bar${y.year === cy ? " is-on" : ""}`} style={{ "--h": y[metric] / maxMetric }}
                  onClick={() => setCy(y.year)} onMouseEnter={() => setCy(y.year)} onFocus={() => setCy(y.year)}
                  aria-label={`${y.year}: ${y.pubs} publications, ${y.cites} citations`} aria-pressed={y.year === cy}>
                  <em>{num(y[metric])}</em><i /><span>{String(y.year).slice(2)}</span>
                </button>
              ))}
            </div>
          </div>

          <div id="citation-members" className="pu-block">
            <div className="pu-block-head pu-rv">
              <h3 className="pu-h3">{t.membersTitle}</h3>
              <div className="pu-tabs" role="tablist" aria-label="Sort members">
                {[["citations", "Citations"], ["pubs", "Publications"], ["hIndex", "h-index"]].map(([k, l]) => (
                  <button key={k} role="tab" aria-selected={msort === k} className={msort === k ? "is-on" : ""} onClick={() => setMsort(k)}>{l}</button>
                ))}
              </div>
            </div>
            <div className="pu-table-wrap pu-rv" style={D(1)}>
              <table className="pu-table pu-mtable">
                <thead><tr><th>Member</th><th>Group</th><th className="r">Publications</th><th className="r">h-index</th><th>Citations</th></tr></thead>
                <tbody>
                  {sortedMembers.map((m) => (
                    <tr key={m.id}>
                      <td><Link href={to(`/people/member/${m.id}`)} className="pu-name">{m.name}</Link></td>
                      <td>{(groupOf[m.group] || {}).label || ""}</td>
                      <td className="r">{num(m.pubs)}</td>
                      <td className="r">{num(m.hIndex)}</td>
                      <td><span className="pu-meter"><i style={{ width: `${(m.citations / maxMember) * 100}%` }} /><b>{num(m.citations)}</b></span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      );
    },

    highlights: () => {
      const t = c.texts.highlights;
      return (
        <div className="pu-wrap">
          <Head label={t.label || "Annual highlights"} title={t.title} lede={t.text} />
          <div className="pu-years pu-rv" role="tablist" aria-label="Choose a year">
            {yearsDesc.map((y) => {
              const has = highlights.some((h) => h.year === y);
              return (
                <button key={y} role="tab" aria-selected={y === hy} className={`${y === hy ? "is-on" : ""}${has ? "" : " is-dim"}`} onClick={() => setHy(y)}>{y}</button>
              );
            })}
          </div>
          <div className="pu-hl" key={hy}>
            <div className="pu-hl-side">
              <div className="pu-big">{hy}</div>
              {(() => { const y = yearly.find((x) => x.year === hy); return y ? <p className="pu-yline"><b>{num(y.pubs)}</b> publications <b>{num(y.cites)}</b> citations</p> : null; })()}
              {hl && <p className="pu-lede">{hl.summary}</p>}
            </div>
            <div className="pu-hl-items">
              {hl && hl.items.length > 0 ? hl.items.map((it) => {
                const body = (
                  <>
                    <span className="pu-tag pu-tag--l">{it.kind}</span>
                    <h3>{it.title}</h3>
                    <p>{it.text}</p>
                    {it.href && <span className="pu-more">Read more<Arrow /></span>}
                  </>
                );
                return it.href
                  ? <Link href={to(it.href)} className="pu-hcard" key={it.id}>{body}</Link>
                  : <div className="pu-hcard is-static" key={it.id}>{body}</div>;
              }) : <div className="pu-empty pu-empty--l"><p>{t.empty}</p></div>}
            </div>
          </div>
        </div>
      );
    },

    archive: () => {
      const t = c.texts.archive;
      return (
        <div className="pu-wrap">
          <Head label={t.label || "Research archive"} title={t.title} lede={t.text} />
          <div className="pu-filters pu-rv">
            <label className="pu-search pu-search--wide">
              <SearchIcon />
              <input value={af.q} onChange={(e) => setA("q", e.target.value)} placeholder={t.searchPlaceholder} aria-label={t.searchPlaceholder} />
            </label>
            <label className="pu-select"><span>Year</span>
              <select value={af.year} onChange={(e) => setA("year", e.target.value)}>
                <option value="all">All years</option>
                {yearsDesc.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </label>
            <label className="pu-select"><span>Member</span>
              <select value={af.member} onChange={(e) => setA("member", e.target.value)}>
                <option value="all">All members</option>
                {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </label>
            <label className="pu-select"><span>Group</span>
              <select value={af.group} onChange={(e) => setA("group", e.target.value)}>
                <option value="all">All groups</option>
                {groups.map((g) => <option key={g.id} value={g.id}>{g.label}</option>)}
              </select>
            </label>
            <label className="pu-select"><span>Status</span>
              <select value={af.status} onChange={(e) => setA("status", e.target.value)}>
                <option value="all">Any status</option>
                {statuses.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </label>
          </div>

          <p className="pu-count" aria-live="polite">
            <span><b>{archive.length}</b> of {pubs.length} records</span>
            {archFiltered && <button className="pu-link" onClick={clearArchive}>{t.clear}</button>}
          </p>

          {archive.length > 0 ? (
            <div className="pu-table-wrap pu-rv">
              <table className="pu-table pu-atable">
                <thead><tr><th>Year</th><th>Title</th><th>Type</th><th>Members</th><th>Group</th><th>Status</th><th className="r">Citations</th></tr></thead>
                <tbody>
                  {archive.slice(0, alimit).map((p) => (
                    <tr key={p.id}>
                      <td className="pu-td-y" data-l="Year">{p.year}</td>
                      <td className="pu-td-t" data-l="Title">{p.url ? <a href={p.url} target="_blank" rel="noopener noreferrer">{p.title}</a> : p.title}</td>
                      <td data-l="Type">{(typeOf[p.type] || {}).label}</td>
                      <td data-l="Members">{(p.members || []).map((id) => (memberOf[id] || {}).name).filter(Boolean).join(", ")}</td>
                      <td data-l="Group">{(groupOf[p.group] || {}).label}</td>
                      <td data-l="Status"><span className={`pu-status is-${p.status}`}>{(statusOf[p.status] || {}).label || p.status}</span></td>
                      <td className="r" data-l="Citations">{num(p.cites)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="pu-empty"><p>{t.empty}</p><button className="pu-link" onClick={clearArchive}>{t.clear}</button></div>
          )}
          {archive.length > alimit && (
            <div className="pu-more-row">
              <button className="pu-btn pu-mag" onClick={() => setAlimit((n) => n + archiveSize)}>{t.more} ({archive.length - alimit} left)<Arrow /></button>
            </div>
          )}
        </div>
      );
    },

    cta: () => {
      const t = c.cta;
      return (
        <div className="pu-wrap">
          <div className="pu-cta-in">
            <div>
              <h2 className="pu-h pu-rv">{t.title}</h2>
              <p className="pu-lede pu-rv" style={D(1)}>{t.text}</p>
              {t.footer && <p className="pu-foot pu-rv" style={D(2)}>{t.footer}</p>}
            </div>
            <div className="pu-cta-links pu-rv" style={D(2)}>
              {t.items.map((it) => (
                <Link href={to(it.href)} className="pu-cta-link pu-mag" key={it.id}>
                  <span className="pu-cta-i"><Arrow /></span>
                  <span className="pu-cta-t"><b>{it.title}</b><small>{it.text}</small></span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      );
    },
  };

  const h = c.hero;
  const [heroFail, setHeroFail] = useState(false);
  const heroLines = Array.isArray(h.headline) ? h.headline : [h.headline];

  return (
    <div className="pu" ref={rootRef} onMouseMove={onMove} onMouseOut={onOut}>

      {/* ===================== HERO ===================== */}
      {heroSec && (
        <section className="pu-hero" id="publications-top">
          {h.image && !heroFail && (
            <div className="pu-hero-media" aria-hidden="true"><img src={h.image} alt="" loading="eager" decoding="async" onError={() => setHeroFail(true)} /></div>
          )}
          <div className="pu-grid-bg" aria-hidden="true" />

          <div className="pu-wrap pu-hero-copy">
            {h.eyebrow && <p className="pu-eyebrow"><i />{h.eyebrow}</p>}
            <h1 className="pu-title" aria-label={heroLines.join(" ")}>
              {heroLines.map((l, i) => (
                <span className="pu-ln" key={l}><span className={l === h.highlight ? "pu-hl" : ""} style={{ "--i": i }}>{l}</span></span>
              ))}
            </h1>
            <p className="pu-hero-lede">{h.lead}</p>
            <div className="pu-hero-cta">
              <button className="pu-btn pu-mag" onClick={() => goTo(h.primary.target)}>{h.primary.label}<Arrow /></button>
              <button className="pu-btn pu-btn--ghost pu-mag" onClick={() => goTo(h.secondary.target)}>{h.secondary.label}<Arrow /></button>
            </div>
          </div>

          <div className="pu-wrap pu-glance">
            <div className="pu-glance-bar">
              <span>At a glance</span>
              <span>Source: {st.source}. Updated {st.updated}.</span>
            </div>
            <div className="pu-glance-grid">
              {(h.stats || []).map((s, i) => (
                <div className="pu-gl" key={s.label}>
                  <strong><Counter value={s.value} delay={900 + i * 100} /></strong>
                  <span className="pu-gl-label">{s.label}</span>
                  {s.note && <p className="pu-gl-note">{s.note}</p>}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===================== STICKY MENU ===================== */}
      {navList.length > 0 && (
        <nav className="pu-subnav" aria-label="Publications sections">
          <div className="pu-wrap pu-subnav-scroll">
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
          <div className="pu-progress" aria-hidden="true"><span /></div>
        </nav>
      )}

      {/* ===================== TICKER ===================== */}
      {c.ticker && c.ticker.length > 0 && (
        <div className="pu-ticker" aria-hidden="true">
          <div className="pu-ticker-track">
            {[0, 1].map((k) => <ul key={k}>{c.ticker.map((t) => <li key={t + k}>{t}</li>)}</ul>)}
          </div>
        </div>
      )}

      {/* ===================== SECTIONS ===================== */}
      {rest.map((s) => {
        const render = SECTIONS[s.id];
        if (!render) return null;
        return (
          <section key={s.id} id={s.id} className={`pu-sec pu-${s.tone || "dark"} pu-sec-${s.id}`}>
            {render()}
          </section>
        );
      })}
    </div>
  );
}

function DS(i) { return { "--d": i * 55 }; }

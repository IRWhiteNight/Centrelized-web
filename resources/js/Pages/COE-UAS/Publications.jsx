import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@inertiajs/react";
import { BASE } from "../../Components/COEUAS-Components/siteMapCOEUAS";
import "../../../css/COE-UAS-css/pulicatios.css";

/* ------------------------------------------------------------------
   Publications & Impact: a slide deck, not a scrolling page.
   Wheel, swipe, arrow keys, the dots and the buttons all move between
   slides. Left and right arrows change the year on the "By year" slide.
   All copy and numbers sit in the DATA block below, ready to be fed
   from the admin CMS (publications | authors | import | citations | highlights).
   Everything marked SAMPLE is placeholder data. Replace before launch.
------------------------------------------------------------------- */

const to = (h = "/") => (h === "/" ? BASE : h.startsWith("/") && !h.startsWith(BASE + "/") && h !== BASE ? BASE + h : h);
const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ----------------------------- DATA ----------------------------- */
const SLIDES = ["Overview", "Output", "Browse", "Impact", "By year", "Continue"];

const TYPES = [ // SAMPLE counts
  { id: "journal", label: "Journal articles", count: 142, text: "Peer-reviewed articles on aerial systems, autonomy, sensing and their applications." },
  { id: "conference", label: "Conference papers", count: 74, text: "Papers presented and published in conference proceedings." },
  { id: "book", label: "Books and chapters", count: 21, text: "Books, book chapters and edited volumes written by Centre members." },
  { id: "other", label: "Reports and other works", count: 18, text: "Technical reports, editorial works and other publications." },
];

const PUBS = [ // SAMPLE entries
  { id: 1, type: "journal", year: 2025, cites: 18, title: "Trajectory planning for fixed-wing UAS in restricted airspace" },
  { id: 2, type: "journal", year: 2024, cites: 41, title: "Vision-based landing on a moving platform" },
  { id: 3, type: "journal", year: 2022, cites: 87, title: "Multispectral crop stress mapping from low-altitude flights" },
  { id: 4, type: "conference", year: 2023, cites: 22, title: "Battery endurance modelling for multirotor cargo missions" },
  { id: 5, type: "conference", year: 2021, cites: 64, title: "A detect-and-avoid architecture for small unmanned aircraft" },
  { id: 6, type: "journal", year: 2020, cites: 73, title: "Photogrammetric documentation of heritage structures" },
  { id: 7, type: "book", year: 2019, cites: 31, title: "Safe integration of drones into low-level airspace" },
  { id: 8, type: "book", year: 2018, cites: 56, title: "Unmanned Aerial Systems: A Practitioner Guide" },
  { id: 9, type: "other", year: 2026, cites: 2, title: "Trial design report for the Perlis Airspace Sandbox" },
  { id: 10, type: "conference", year: 2022, cites: 38, title: "Edge inference for onboard object detection" },
  { id: 11, type: "other", year: 2024, cites: 12, title: "Regulatory sandboxes for emerging aviation technology" },
  { id: 12, type: "journal", year: 2017, cites: 129, title: "Wind disturbance rejection in quadrotor control" },
].map((p) => ({ ...p, authors: "Author A, Author B, Author C", venue: "Venue name" }));

const PUBS_BY_YEAR = [6, 9, 12, 14, 16, 18, 20, 22, 24, 26, 27, 28, 20, 13]; // SAMPLE, 2013 to 2026
const CITES_BY_YEAR = [20, 60, 130, 210, 320, 430, 540, 640, 740, 820, 880, 860, 700, 360]; // SAMPLE
const YEARS = PUBS_BY_YEAR.map((pubs, n) => ({ year: 2013 + n, pubs, cites: CITES_BY_YEAR[n] }));
const TOTAL_PUBS = PUBS_BY_YEAR.reduce((a, b) => a + b, 0);
const TOTAL_CITES = CITES_BY_YEAR.reduce((a, b) => a + b, 0);
const H_INDEX = 38; // SAMPLE
const SOURCE = "Source: Scopus. Last updated 1 November 2026."; // SAMPLE

const NEXT = [
  { t: "Research and innovation", d: "Projects, grants and programmes behind the papers.", h: "/research" },
  { t: "People", d: "The researchers and fellows who wrote them.", h: "/people" },
  { t: "Engagement", d: "Collaborations, news and activities.", h: "/engagement" },
];

/* --------------------------- PIECES ----------------------------- */
function Count({ to: target, on, suffix = "" }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!on) { setV(0); return; }
    if (reduced()) { setV(target); return; }
    let raf, s;
    const tick = (t) => {
      s = s || t;
      const p = Math.min((t - s) / 1500, 1);
      setV(Math.round(target * (1 - Math.pow(1 - p, 4))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    const t0 = setTimeout(() => (raf = requestAnimationFrame(tick)), 600);
    return () => { clearTimeout(t0); cancelAnimationFrame(raf); };
  }, [on, target]);
  return <>{v.toLocaleString()}{suffix}</>;
}

/* Drifting network of papers that lean toward the pointer and link up. */
function Constellation({ on }) {
  const ref = useRef(null);
  const live = useRef(on);
  live.current = on;
  useEffect(() => {
    const c = ref.current, x = c.getContext("2d"), dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w, h, raf;
    const m = { x: -999, y: -999 };
    const size = () => { w = c.clientWidth; h = c.clientHeight; c.width = w * dpr; c.height = h * dpr; x.setTransform(dpr, 0, 0, dpr, 0, 0); };
    size();
    const P = Array.from({ length: w < 700 ? 34 : 72 }, () => ({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - 0.5) * 0.35, vy: (Math.random() - 0.5) * 0.35, r: 1 + Math.random() * 1.8 }));
    const still = reduced();
    const draw = () => {
      if (live.current || still) {
        x.clearRect(0, 0, w, h);
        P.forEach((p) => {
          if (!still) {
            const dx = m.x - p.x, dy = m.y - p.y, d = Math.hypot(dx, dy);
            if (d < 220) { p.x += dx * 0.0016; p.y += dy * 0.0016; }
            p.x += p.vx; p.y += p.vy;
            if (p.x < 0 || p.x > w) p.vx *= -1;
            if (p.y < 0 || p.y > h) p.vy *= -1;
          }
        });
        for (let i = 0; i < P.length; i++) {
          for (let j = i + 1; j < P.length; j++) {
            const d = Math.hypot(P[i].x - P[j].x, P[i].y - P[j].y);
            if (d < 130) { x.strokeStyle = `rgba(41,151,255,${(1 - d / 130) * 0.32})`; x.beginPath(); x.moveTo(P[i].x, P[i].y); x.lineTo(P[j].x, P[j].y); x.stroke(); }
          }
          const dm = Math.hypot(P[i].x - m.x, P[i].y - m.y);
          if (dm < 190) { x.strokeStyle = `rgba(143,208,255,${(1 - dm / 190) * 0.7})`; x.beginPath(); x.moveTo(P[i].x, P[i].y); x.lineTo(m.x, m.y); x.stroke(); }
        }
        P.forEach((p) => { x.shadowColor = "#2997ff"; x.shadowBlur = 14; x.fillStyle = "#8fd0ff"; x.beginPath(); x.arc(p.x, p.y, p.r, 0, 7); x.fill(); });
        x.shadowBlur = 0;
      }
      if (!still) raf = requestAnimationFrame(draw);
    };
    const move = (e) => { const r = c.getBoundingClientRect(); m.x = e.clientX - r.left; m.y = e.clientY - r.top; };
    window.addEventListener("mousemove", move);
    window.addEventListener("resize", size);
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("mousemove", move); window.removeEventListener("resize", size); };
  }, []);
  return <canvas ref={ref} className="pb-net" aria-hidden="true" />;
}

const d = (n, base = 0) => ({ "--d": `${base + n * 0.09}s` });

/* ---------------------------- PAGE ------------------------------ */
export default function Publications() {
  const [idx, setIdx] = useState(0);
  const [prev, setPrev] = useState(null);
  const [dir, setDir] = useState(1);
  const [tick, setTick] = useState(0);
  const [open, setOpen] = useState(0);
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("new");
  const [q, setQ] = useState("");
  const [yi, setYi] = useState(YEARS.length - 1);
  const idxRef = useRef(0);
  const lock = useRef(false);
  const yiRef = useRef(yi);
  yiRef.current = yi;
  const root = useRef(null);

  const go = useCallback((n) => {
    n = Math.max(0, Math.min(SLIDES.length - 1, n));
    if (n === idxRef.current || lock.current) return;
    lock.current = true;
    setDir(n > idxRef.current ? 1 : -1);
    setPrev(idxRef.current);
    idxRef.current = n;
    setIdx(n);
    setTick((t) => t + 1);
    setTimeout(() => { lock.current = false; setPrev(null); }, reduced() ? 50 : 1100);
  }, []);

  useEffect(() => {
    const el = root.current;
    const canScroll = (t, down) => {
      const sc = t.closest && t.closest("[data-scroll]");
      if (!sc || sc.scrollHeight <= sc.clientHeight + 1) return false;
      return down ? sc.scrollTop + sc.clientHeight < sc.scrollHeight - 1 : sc.scrollTop > 0;
    };
    let last = 0, ty = 0;
    const wheel = (e) => {
      const now = performance.now();
      if (Math.abs(e.deltaY) < 12 || canScroll(e.target, e.deltaY > 0)) return;
      if (lock.current || now - last < 160) { last = now; return; }
      last = now;
      go(idxRef.current + (e.deltaY > 0 ? 1 : -1));
    };
    const ts = (e) => { ty = e.touches[0].clientY; };
    const te = (e) => {
      const dy = ty - e.changedTouches[0].clientY;
      if (Math.abs(dy) > 50 && !canScroll(e.target, dy > 0)) go(idxRef.current + (dy > 0 ? 1 : -1));
    };
    const key = (e) => {
      if (/INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return;
      const k = e.key;
      if (k === "ArrowDown" || k === "PageDown" || (k === " " && e.target.tagName !== "BUTTON")) { e.preventDefault(); go(idxRef.current + 1); }
      else if (k === "ArrowUp" || k === "PageUp") { e.preventDefault(); go(idxRef.current - 1); }
      else if (k === "Home") go(0);
      else if (k === "End") go(SLIDES.length - 1);
      else if (idxRef.current === 4 && k === "ArrowRight") setYi((i) => Math.min(YEARS.length - 1, i + 1));
      else if (idxRef.current === 4 && k === "ArrowLeft") setYi((i) => Math.max(0, i - 1));
    };
    el.addEventListener("wheel", wheel, { passive: true });
    el.addEventListener("touchstart", ts, { passive: true });
    el.addEventListener("touchend", te, { passive: true });
    window.addEventListener("keydown", key);
    return () => { el.removeEventListener("wheel", wheel); el.removeEventListener("touchstart", ts); el.removeEventListener("touchend", te); window.removeEventListener("keydown", key); };
  }, [go]);

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return PUBS.filter((p) => (filter === "all" || p.type === filter) && (!s || p.title.toLowerCase().includes(s)))
      .sort((a, b) => (sort === "new" ? b.year - a.year : b.cites - a.cites));
  }, [filter, sort, q]);

  const cum = useMemo(() => { let t = 0; return CITES_BY_YEAR.map((c) => (t += c)); }, []);
  const pts = cum.map((v, n) => [20 + (n / (cum.length - 1)) * 560, 210 - (v / cum[cum.length - 1]) * 180]);
  const line = pts.map((p, n) => `${n ? "L" : "M"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
  const maxPubs = Math.max(...PUBS_BY_YEAR);
  const Y = YEARS[yi];
  const cls = (i) => `pb-slide pb-s${i}${idx === i ? " active" : ""}${prev === i ? " leaving" : ""}`;
  const typeLabel = (id) => TYPES.find((t) => t.id === id).label;

  return (
    <main className="pb" ref={root} data-dir={dir}>
      <div className="pb-bar" style={{ transform: `scaleX(${idx / (SLIDES.length - 1)})` }} aria-hidden="true" />
      {tick > 0 && <div key={tick} className={`pb-sweep ${dir > 0 ? "up" : "down"}`} aria-hidden="true" />}

      <ol className="pb-dots" aria-label="Slides">
        {SLIDES.map((s, i) => (
          <li key={s}><button className={i === idx ? "act" : ""} onClick={() => go(i)} aria-label={s} aria-current={i === idx}><span>{s}</span></button></li>
        ))}
      </ol>
      <div className="pb-count" aria-live="polite"><b>{String(idx + 1).padStart(2, "0")}</b> / {String(SLIDES.length).padStart(2, "0")}</div>
      {idx < SLIDES.length - 1 && <button className="pb-next" onClick={() => go(idx + 1)} aria-label="Next slide"><span /></button>}

      {/* 1. OVERVIEW */}
      <section className={cls(0)} aria-label="Overview">
        <Constellation on={idx === 0} />
        <div className="pb-in">
          <p className="pb-eye pb-rv">Publications and impact</p>
          <h1 aria-label="Thirteen years of research, in print.">
            {"Thirteen years of research, in print.".split(" ").map((w, n) => (
              <span className="pb-w" key={n}><b style={{ "--d": `${0.55 + n * 0.08}s` }}>{w}</b></span>
            ))}
          </h1>
          <p className="pb-lead pb-rv" style={{ "--d": "1.1s" }}>Articles, papers, books and reports from the Centre, with the citations that show where they landed.</p>
          <div className="pb-row pb-rv" style={{ "--d": "1.25s" }}>
            <button className="pb-btn" onClick={() => go(2)}>Browse publications</button>
            <button className="pb-btn ghost" onClick={() => go(3)}>See research impact</button>
          </div>
          <p className="pb-hint pb-rv" style={{ "--d": "1.5s" }}>Scroll, swipe or use the arrow keys to move between slides.</p>
        </div>
      </section>

      {/* 2. OUTPUT TYPES */}
      <section className={cls(1)} aria-label="Types of output">
        <div className="pb-in">
          <h2 className="pb-rv">Four kinds of output.</h2>
          <div className="pb-acc pb-rv" style={{ "--d": ".1s" }}>
            {TYPES.map((t, n) => (
              <div key={t.id} tabIndex={0} className={`pb-ac${open === n ? " open" : ""}`} style={{ "--i": n }} onMouseEnter={() => setOpen(n)} onFocus={() => setOpen(n)}>
                <span className="pb-ac-name">{t.label}</span>
                <strong className="pb-ac-num"><Count to={t.count} on={idx === 1} /></strong>
                <div className="pb-ac-body">
                  <h3>{t.label}</h3>
                  <p>{t.text}</p>
                  <button className="pb-link" onClick={() => { setFilter(t.id); go(2); }}>View these publications</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. BROWSE */}
      <section className={cls(2)} aria-label="Browse publications">
        <div className="pb-in pb-browse">
          <div className="pb-side">
            <h2 className="pb-rv">Find a publication.</h2>
            <input className="pb-search pb-rv" style={{ "--d": ".1s" }} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by title" aria-label="Search by title" />
            <div className="pb-chips pb-rv" style={{ "--d": ".2s" }}>
              {[{ id: "all", label: "All" }, ...TYPES].map((t) => (
                <button key={t.id} className={filter === t.id ? "act" : ""} onClick={() => setFilter(t.id)}>{t.label}</button>
              ))}
            </div>
            <div className="pb-chips pb-rv" style={{ "--d": ".3s" }}>
              <button className={sort === "new" ? "act" : ""} onClick={() => setSort("new")}>Newest first</button>
              <button className={sort === "cited" ? "act" : ""} onClick={() => setSort("cited")}>Most cited</button>
            </div>
            <p className="pb-small pb-rv" style={{ "--d": ".4s" }}>{list.length} {list.length === 1 ? "result" : "results"}. Sample entries shown.</p>
          </div>
          <div className="pb-list pb-rv" style={{ "--d": ".2s" }} data-scroll key={filter + sort}>
            {list.length === 0 && <p className="pb-empty">No publications match. Try a shorter title or a different type.</p>}
            {list.map((p, n) => (
              <article className="pb-pub" key={p.id} style={{ "--n": n }}>
                <span className="pb-yr">{p.year}</span>
                <div>
                  <h3>{p.title}</h3>
                  <p>{p.authors}. {p.venue}.</p>
                  <small>{typeLabel(p.type)}</small>
                </div>
                <span className="pb-cite"><b>{p.cites}</b>citations</span>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* 4. IMPACT */}
      <section className={cls(3)} aria-label="Citations and research impact">
        <div className="pb-in pb-impact">
          <div>
            <h2 className="pb-rv">Where the work landed.</h2>
            <div className="pb-stats">
              {[[TOTAL_CITES, "citations"], [TOTAL_PUBS, "publications"], [H_INDEX, "h-index"]].map(([v, l], n) => (
                <div className="pb-stat pb-rv" style={d(n, 0.1)} key={l}><strong><Count to={v} on={idx === 3} /></strong><span>{l}</span></div>
              ))}
            </div>
            <p className="pb-small pb-rv" style={{ "--d": ".5s" }}>{SOURCE}</p>
          </div>
          <figure className="pb-chart pb-rv" style={{ "--d": ".25s" }}>
            <svg viewBox="0 0 600 240" role="img" aria-label="Cumulative citations, 2013 to 2026">
              <defs>
                <linearGradient id="pbg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2997ff" stopOpacity=".45" /><stop offset="1" stopColor="#2997ff" stopOpacity="0" /></linearGradient>
              </defs>
              {[0, 1, 2, 3].map((g) => <line key={g} x1="20" x2="580" y1={30 + g * 60} y2={30 + g * 60} className="pb-grid" />)}
              <path d={`${line} L580 210 L20 210Z`} fill="url(#pbg)" className="pb-area" />
              <path d={line} pathLength="1" className="pb-line" />
              {pts.map((p, n) => <circle key={n} cx={p[0]} cy={p[1]} r={n === pts.length - 1 ? 5 : 2.5} className="pb-dot" style={{ "--n": n }} />)}
              <text x="20" y="232" className="pb-ax">2013</text>
              <text x="580" y="232" textAnchor="end" className="pb-ax">2026</text>
            </svg>
            <figcaption>Cumulative citations</figcaption>
          </figure>
        </div>
      </section>

      {/* 5. BY YEAR */}
      <section className={cls(4)} aria-label="Annual research highlights">
        <div className="pb-in pb-years">
          <div className="pb-yinfo">
            <h2 className="pb-rv">Year by year.</h2>
            <div className="pb-big pb-rv" style={{ "--d": ".1s" }} key={Y.year}><span>{Y.year}</span></div>
            <p className="pb-yline pb-rv" style={{ "--d": ".2s" }}><b>{Y.pubs}</b> publications <b>{Y.cites.toLocaleString()}</b> citations</p>
            <p className="pb-lead pb-rv" style={{ "--d": ".3s" }}>Highlights for {Y.year} go here: awards, major papers and milestones. Use the left and right arrow keys to change year.</p>
          </div>
          <div className="pb-bars pb-rv" style={{ "--d": ".15s" }} role="group" aria-label="Publications per year">
            {YEARS.map((y, n) => (
              <button key={y.year} className={`pb-yb${n === yi ? " act" : ""}`} style={{ "--n": n, "--h": `${(y.pubs / maxPubs) * 100}%` }} onClick={() => setYi(n)} aria-label={`${y.year}: ${y.pubs} publications`} aria-pressed={n === yi}>
                <i /><span>{String(y.year).slice(2)}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 6. CONTINUE */}
      <section className={cls(5)} aria-label="Keep exploring">
        <div className="pb-in">
          <h2 className="pb-rv">Keep exploring.</h2>
          <div className="pb-next-grid">
            {NEXT.map((n, k) => (
              <Link key={n.h} href={to(n.h)} className="pb-card pb-rv" style={d(k, 0.1)}>
                <h3>{n.t}</h3><p>{n.d}</p>
              </Link>
            ))}
          </div>
          <div className="pb-row pb-rv" style={{ "--d": ".5s" }}>
            <button className="pb-btn ghost" onClick={() => go(0)}>Back to the start</button>
          </div>
        </div>
      </section>
    </main>
  );
}

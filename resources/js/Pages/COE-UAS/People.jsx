import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@inertiajs/react";
import { usePeopleContent } from "../../Components/COEUAS-Components/peopleContent";
import { SHOW_SLOT_HINTS } from "../../Components/COEUAS-Components/homeContent";
import { BASE } from "../../Components/COEUAS-Components/siteMapCOEUAS";
import "../../../css/COE-UAS-css/people.css";

/* ------------------------------------------------------------------
   People.jsx is layout and motion only.
   All text, links, media and numbers come from peopleContent.js
   (later: the admin CMS). Pass a `content` prop to preview changes.
   The navigation bar comes from COEUAsWebsiteLayout.
------------------------------------------------------------------- */

const to = (h = "/") =>
  h === "/" ? BASE : h.startsWith("/") && !h.startsWith(BASE + "/") && h !== BASE ? BASE + h : h;

const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" /></svg>
);

/* One portrait slot: the image when it exists, otherwise a labelled placeholder with initials-style icon. */
function Media({ m, className = "", compact = false }) {
  const [failed, setFailed] = useState(false);
  const src = m && m.src;
  const live = !!src && !failed;
  useEffect(() => setFailed(false), [src]);
  return (
    <div className={`media ${className} ${live ? "is-live" : "is-empty"} ${compact ? "sm" : ""}`}>
      {live ? (
        <img src={src} alt={(m && m.alt) || ""} loading="lazy" onError={() => setFailed(true)} />
      ) : (
        <div className={`ph ${SHOW_SLOT_HINTS ? "" : "quiet"}`}>
          <span className="ic">{ICON}</span>
          {SHOW_SLOT_HINTS && (
            <>
              <b>Image slot</b>
              {m && m.note && <em>{m.note}</em>}
              {src && <code>{src}</code>}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function Count({ to: target, suffix, on }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!on) return;
    if (reduced()) { setV(target); return; }
    let raf, s;
    const tick = (t) => {
      s = s || t;
      const p = Math.min((t - s) / 1700, 1);
      setV(Math.round(target * (1 - Math.pow(1 - p, 4))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [on, target]);
  return <>{v}{suffix}</>;
}

/* Constellation: nodes (people) drift, link up when close, and lean toward the cursor. */
function Network() {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current, x = c.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w, h, raf, visible = true;
    const mouse = { x: -999, y: -999 };
    let nodes = [];
    const size = () => {
      w = c.clientWidth; h = c.clientHeight; c.width = w * dpr; c.height = h * dpr;
      x.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round(Math.min(70, Math.max(26, (w * h) / 22000)));
      nodes = Array.from({ length: n }, () => ({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - 0.5) * 0.35, vy: (Math.random() - 0.5) * 0.35, r: 1.2 + Math.random() * 1.8 }));
    };
    size();
    const move = (e) => { const r = c.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; };
    const leave = () => { mouse.x = mouse.y = -999; };
    window.addEventListener("resize", size);
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseout", leave);
    const still = reduced();
    const draw = () => {
      if (visible) {
        x.clearRect(0, 0, w, h);
        nodes.forEach((a) => {
          const dx = mouse.x - a.x, dy = mouse.y - a.y, d = Math.hypot(dx, dy);
          if (d < 180) { a.vx += (dx / d) * 0.012; a.vy += (dy / d) * 0.012; }
          a.vx *= 0.99; a.vy *= 0.99;
          a.x += a.vx; a.y += a.vy;
          if (a.x < 0 || a.x > w) a.vx *= -1;
          if (a.y < 0 || a.y > h) a.vy *= -1;
        });
        for (let i = 0; i < nodes.length; i++) {
          for (let j = i + 1; j < nodes.length; j++) {
            const a = nodes[i], b = nodes[j], d = Math.hypot(a.x - b.x, a.y - b.y);
            if (d < 140) { x.strokeStyle = `rgba(41,151,255,${(1 - d / 140) * 0.35})`; x.beginPath(); x.moveTo(a.x, a.y); x.lineTo(b.x, b.y); x.stroke(); }
          }
        }
        nodes.forEach((a) => {
          x.shadowColor = "#2997ff"; x.shadowBlur = 14; x.fillStyle = "#8fd0ff";
          x.beginPath(); x.arc(a.x, a.y, a.r, 0, 7); x.fill(); x.shadowBlur = 0;
        });
      }
      if (!still) raf = requestAnimationFrame(draw);
    };
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: 0 });
    io.observe(c);
    draw();
    return () => { cancelAnimationFrame(raf); io.disconnect(); window.removeEventListener("resize", size); window.removeEventListener("mousemove", move); window.removeEventListener("mouseout", leave); };
  }, []);
  return <canvas ref={ref} className="net" aria-hidden="true" />;
}

/* Words slide up from a mask, one after another. */
const Split = ({ text, base = 0.05, step = 0.07 }) => (
  <>
    {text.split(" ").map((w, n) => (
      <span className="w" key={n}><b style={{ "--d": `${base + n * step}s` }}>{w}</b></span>
    ))}
  </>
);

/* 3D tilt with a light that follows the cursor. */
const tilt = (e) => {
  const el = e.currentTarget, r = el.getBoundingClientRect();
  const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
  el.style.setProperty("--lx", px * 100 + "%");
  el.style.setProperty("--ly", py * 100 + "%");
  el.style.transform = `perspective(900px) rotateY(${(px - 0.5) * 12}deg) rotateX(${-(py - 0.5) * 12}deg) translateZ(0)`;
};
const untilt = (e) => (e.currentTarget.style.transform = "");
const delay = (n, base = 0.05, step = 0.08) => ({ "--d": `${base + n * step}s` });

export default function People({ content: override }) {
  const { content: c } = usePeopleContent(override);
  const list = c.sections.filter((s) => s.visible);
  const root = useRef(null);
  const bar = useRef(null);
  const rail = useRef(null);
  const [seen, setSeen] = useState({});
  const [active, setActive] = useState(list[0] ? list[0].id : "");
  const [filter, setFilter] = useState("all");
  const [q, setQ] = useState("");
  const key = list.map((s) => s.id).join();

  const scrollTo = (id) => {
    const el = document.getElementById("people-" + id);
    if (el) el.scrollIntoView({ behavior: reduced() ? "auto" : "smooth", block: "start" });
  };

  /* reveal, active section, progress bar, per-section parallax and bridge scroll */
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const secs = [...el.querySelectorAll(".sec")];
    const reveal = new IntersectionObserver((es) => {
      const add = {};
      es.forEach((e) => { if (e.isIntersecting) add[e.target.dataset.id] = true; });
      if (Object.keys(add).length) setSeen((s) => ({ ...s, ...add }));
    }, { root: el, rootMargin: "0px 0px -14% 0px", threshold: 0 });
    const mid = new IntersectionObserver((es) => {
      es.forEach((e) => { if (e.isIntersecting) setActive(e.target.dataset.id); });
    }, { root: el, rootMargin: "-50% 0px -50% 0px", threshold: 0 });
    secs.forEach((s) => { reveal.observe(s); mid.observe(s); });

    let ticking = false;
    const frame = () => {
      ticking = false;
      const max = el.scrollHeight - el.clientHeight;
      if (bar.current) bar.current.style.transform = `scaleX(${max > 0 ? el.scrollTop / max : 0})`;
      el.style.setProperty("--sy", el.scrollTop + "px");
      const vh = el.clientHeight;
      secs.forEach((s) => {
        const r = s.getBoundingClientRect();
        const p = Math.max(-1, Math.min(1, (r.top + r.height / 2 - vh / 2) / vh));
        s.style.setProperty("--p", p.toFixed(3));
      });
    };
    const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } };
    el.addEventListener("scroll", onScroll, { passive: true });
    frame();
    return () => { reveal.disconnect(); mid.disconnect(); el.removeEventListener("scroll", onScroll); };
  }, [key]);

  const glow = (e) => {
    root.current.style.setProperty("--mx", e.clientX + "px");
    root.current.style.setProperty("--my", e.clientY + "px");
  };

  /* directory filtering */
  const d = c.directory;
  const shown = useMemo(() => {
    const t = q.trim().toLowerCase();
    return d.items.filter((p) => (filter === "all" || p.group === filter) && (!t || (p.name + " " + p.area + " " + p.role).toLowerCase().includes(t)));
  }, [d.items, filter, q]);
  const counts = useMemo(() => {
    const m = { all: d.items.length };
    d.items.forEach((p) => { m[p.group] = (m[p.group] || 0) + 1; });
    return m;
  }, [d.items]);

  /* drag-to-scroll rail */
  const drag = useRef({ down: false, x: 0, left: 0, moved: false });
  const onDown = (e) => { const r = rail.current; drag.current = { down: true, x: e.clientX, left: r.scrollLeft, moved: false }; r.classList.add("grab"); };
  const onMove = (e) => {
    const s = drag.current; if (!s.down) return;
    const dx = e.clientX - s.x; if (Math.abs(dx) > 4) s.moved = true;
    rail.current.scrollLeft = s.left - dx;
  };
  const onUp = () => { drag.current.down = false; rail.current && rail.current.classList.remove("grab"); };
  const nudge = (dir) => rail.current && rail.current.scrollBy({ left: dir * 340, behavior: reduced() ? "auto" : "smooth" });
  const stopIfDragged = (e) => { if (drag.current.moved) e.preventDefault(); };

  const RENDER = {
    hero: (h = c.hero) => (
      <>
        <Network />
        <div className="orb o1" aria-hidden="true" /><div className="orb o2" aria-hidden="true" />
        <div className="in hero">
          {h.eyebrow && <p className="eyebrow rv">{h.eyebrow}</p>}
          <h1 aria-label={h.headline}><Split text={h.headline} base={0.1} step={0.09} /></h1>
          <p className="lead rv" style={{ "--d": "0.8s" }}>{h.lead}</p>
          <div className="row rv" style={{ "--d": "0.95s" }}>
            <button className="btn" onClick={() => scrollTo(h.primary.target)}>{h.primary.label}</button>
            <Link className="btn ghost" href={to(h.secondary.href)}>{h.secondary.label}</Link>
          </div>
          <div className="hstats">
            {h.stats.map((s, i) => (
              <div className="hstat rv" style={delay(i, 1.05)} key={s.label}>
                <strong><Count to={s.value} suffix={s.suffix} on={!!seen.hero} /></strong><span>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
        <button className="scrollcue" onClick={() => scrollTo(list[1] ? list[1].id : "hero")} aria-label="Scroll down"><i /></button>
      </>
    ),

    leadership: (l = c.leadership) => (
      <div className="in">
        {l.eyebrow && <p className="eyebrow rv">{l.eyebrow}</p>}
        <h2 aria-label={l.title}><Split text={l.title} /></h2>
        <p className="lead rv" style={{ "--d": ".25s" }}>{l.text}</p>
        <div className="leaders">
          {l.items.map((m, n) => (
            <Link href={to(`/people/member/${m.id}`)} className={`leader rv ${n % 2 ? "flip" : ""}`} style={delay(n, 0.15, 0.18)} key={m.id}>
              <div className="lphoto tl" onMouseMove={tilt} onMouseLeave={untilt}>
                <Media m={m.media} className="portrait" />
                <span className="shine" aria-hidden="true" />
              </div>
              <div className="ltext">
                <small>{String(n + 1).padStart(2, "0")}</small>
                <h3>{m.name}</h3>
                <em>{m.role}</em>
                <p>{m.bio}</p>
                <span className="area">{m.area}</span>
                <span className="more">View profile <i>→</i></span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    ),

    directory: () => (
      <div className="in">
        {d.eyebrow && <p className="eyebrow rv">{d.eyebrow}</p>}
        <h2 aria-label={d.title}><Split text={d.title} /></h2>
        <div className="tools rv" style={{ "--d": ".2s" }}>
          <div className="tabs" role="tablist">
            {d.filters.map((f) => (
              <button key={f.id} role="tab" aria-selected={filter === f.id} className={filter === f.id ? "act" : ""} onClick={() => setFilter(f.id)}>
                {f.label}<sup>{counts[f.id] || 0}</sup>
              </button>
            ))}
          </div>
          <label className="search">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={d.searchPlaceholder} aria-label={d.searchPlaceholder} />
          </label>
        </div>
        <div className="grid" key={filter + "|" + q}>
          {shown.map((p, n) => (
            <Link href={to(`/people/member/${p.id}`)} className="pcard tl" style={{ "--i": n }} onMouseMove={tilt} onMouseLeave={untilt} key={p.id}>
              <Media m={p.media} className="portrait" compact />
              <h3>{p.name}</h3>
              <p>{p.role}</p>
              <span className="area">{p.area}</span>
              <span className="glare" aria-hidden="true" />
            </Link>
          ))}
        </div>
        {shown.length === 0 && <p className="empty">{d.empty}</p>}
      </div>
    ),

    early: (e = c.early) => (
      <>
        <div className="in">
          {e.eyebrow && <p className="eyebrow rv">{e.eyebrow}</p>}
          <h2 aria-label={e.title}><Split text={e.title} /></h2>
          <div className="railhead rv" style={{ "--d": ".2s" }}>
            <p className="lead">{e.text}</p>
            <div className="arrows">
              <button onClick={() => nudge(-1)} aria-label="Previous">←</button>
              <button onClick={() => nudge(1)} aria-label="Next">→</button>
            </div>
          </div>
        </div>
        <div className="rail rv" style={{ "--d": ".3s" }} ref={rail} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerLeave={onUp}>
          {e.items.map((p) => (
            <Link href={to(`/people/member/${p.id}`)} className="slide" onClick={stopIfDragged} draggable={false} key={p.id + p.name + p.topic}>
              <Media m={p.media} className="portrait" compact />
              <span className="tag">{p.tag}</span>
              <h3>{p.name}</h3>
              <p>{p.topic}</p>
            </Link>
          ))}
        </div>
      </>
    ),

    cta: (t = c.cta) => (
      <>
        <div className="orb o1" aria-hidden="true" /><div className="orb o2" aria-hidden="true" />
        <div className="in">
          <h2 aria-label={t.title}><Split text={t.title} /></h2>
          <p className="lead rv" style={{ "--d": ".2s" }}>{t.text}</p>
          <div className="cta">
            {t.items.map((it, n) => (
              <Link href={to(it.href)} className="big rv" style={delay(n, 0.25, 0.12)} key={it.id}>
                <span className="num">{String(n + 1).padStart(2, "0")}</span>
                <h3>{it.title}</h3>
                <p>{it.text}</p>
                <span className="go">→</span>
              </Link>
            ))}
          </div>
          <footer className="foot rv" style={{ "--d": ".5s" }}>{t.footer}</footer>
        </div>
      </>
    ),
  };

  return (
    <main className="ppl" ref={root} onMouseMove={glow}>
      <div className="cursor" aria-hidden="true" />
      <div className="bar" ref={bar} aria-hidden="true" />

      <ol className="dots" aria-label="Page sections">
        {list.map((s) => (
          <li key={s.id}><button className={s.id === active ? "act" : ""} onClick={() => scrollTo(s.id)} aria-label={s.label} aria-current={s.id === active}><span>{s.label}</span></button></li>
        ))}
      </ol>

      {list.map((s, i) => RENDER[s.id] && (
        <div key={s.id} className="part">
          {i > 0 && (
            <div className="bridge" aria-hidden="true">
              <div className="btrack">
                {[0, 1, 2, 3].map((r) => <span key={r}>{c.bridges[(i - 1) % c.bridges.length]}&nbsp;</span>)}
              </div>
            </div>
          )}
          <section id={"people-" + s.id} data-id={s.id} className={`sec sec-${s.id} ${seen[s.id] ? "on" : ""}`}>
            <span className="sweep" aria-hidden="true" />
            <span className="edge" aria-hidden="true" />
            {RENDER[s.id]()}
          </section>
        </div>
      ))}
    </main>
  );
}

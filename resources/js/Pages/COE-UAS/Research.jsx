import { useEffect, useRef, useState } from "react";
import { Link } from "@inertiajs/react";
import { SHOW_SLOT_HINTS } from "../../Components/COEUAS-Components/homeContent";
import { useResearchContent } from "../../Components/COEUAS-Components/researchContent";
import { BASE } from "../../Components/COEUAS-Components/siteMapCOEUAS";
import "../../../css/COE-UAS-css/research.css";

/* ------------------------------------------------------------------
   Research.jsx is layout and motion only.
   All text, links, media and numbers come from researchContent.js
   (later: the admin CMS). Pass a `content` prop to preview changes.
   The navigation bar comes from COEUAsWebsiteLayout (see app.jsx).

   HOW THE SECTION TRANSITIONS WORK
   One scroll handler measures every section and writes three CSS
   variables on it:
     --p   0 to 1, how far the section has entered the screen
     --q   0 to 1, how far it has left (the section underneath dims and shrinks)
     --s   0 to 1, progress through the whole section (parallax)
     --cy  where the iris opens from
   research.css turns those into clip-path shapes (data-tx on each section),
   so every section opens in its own way instead of just scrolling past.
------------------------------------------------------------------- */

const to = (h = "/") =>
  h === "/" ? BASE : h.startsWith("/") && !h.startsWith(BASE + "/") && h !== BASE ? BASE + h : h;

const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

const ICON = {
  image: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="16" rx="3" /><circle cx="9" cy="10" r="1.8" /><path d="m21 16-5-5-9 9" /></svg>,
  video: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="3" /><path d="m10 9.5 5 2.5-5 2.5z" /></svg>,
};
const Arrow = () => (
  <svg className="rs-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
);

/* ---------- small helpers ---------- */

const delay = (n, base = 0.05) => ({ "--d": `${base + n * 0.1}s` });

/* Headline words slide up from behind a mask when the section opens. */
const Split = ({ text, base = 0 }) =>
  text.split(" ").map((w, n) => (
    <span className="rs-sp" key={n}><b style={{ "--d": `${base + n * 0.07}s` }}>{w}</b></span>
  ));

/* Cards tilt towards the pointer. */
const tilt = (e) => {
  const r = e.currentTarget.getBoundingClientRect();
  const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
  e.currentTarget.style.transform = `perspective(900px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg)`;
};
const untilt = (e) => (e.currentTarget.style.transform = "");

/* Buttons are pulled slightly towards the pointer. */
const mag = (e) => {
  const r = e.currentTarget.getBoundingClientRect();
  const x = (e.clientX - r.left - r.width / 2) * 0.28, y = (e.clientY - r.top - r.height / 2) * 0.4;
  e.currentTarget.style.transform = `translate(${x}px,${y}px)`;
};
const unmag = (e) => (e.currentTarget.style.transform = "");

/* A soft light follows the pointer inside a card. */
const spot = (e) => {
  const r = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty("--x", e.clientX - r.left + "px");
  e.currentTarget.style.setProperty("--y", e.clientY - r.top + "px");
};

/* ---------- media slot ---------- */

function Media({ m, className = "", label, compact = false }) {
  const [failed, setFailed] = useState(false);
  const box = useRef(null);
  const src = m && m.src;
  const isVideo = !!m && m.type === "video";
  const live = !!src && !failed;

  useEffect(() => setFailed(false), [src]);

  /* play videos only while visible */
  useEffect(() => {
    if (!isVideo || !live) return;
    const v = box.current && box.current.querySelector("video");
    if (!v) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !reduced()) v.play().catch(() => {});
      else v.pause();
    }, { threshold: 0.15 });
    io.observe(v);
    return () => io.disconnect();
  }, [isVideo, live, src]);

  return (
    <div ref={box} className={`rs-media ${className} ${live ? "is-live" : "is-empty"} ${compact ? "sm" : ""}`}>
      {live ? (
        isVideo
          ? <video src={src} poster={m.poster} muted loop playsInline preload="metadata" onError={() => setFailed(true)} />
          : <img src={src} alt={m.alt || ""} loading="lazy" onError={() => setFailed(true)} />
      ) : (
        <div className={`rs-ph ${SHOW_SLOT_HINTS ? "" : "quiet"}`}>
          {SHOW_SLOT_HINTS && (
            <>
              <span className="ic">{ICON[isVideo ? "video" : "image"]}</span>
              <b>{isVideo ? "Video slot" : "Image slot"}</b>
              {label && <strong>{label}</strong>}
              {m && m.note && <em>{m.note}</em>}
              {src && <code>{src}</code>}
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------- counting number ---------- */

function Count({ to: target, suffix = "" }) {
  const ref = useRef(null);
  const [v, setV] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reduced()) { setV(target); return; }
    let raf;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const t0 = performance.now();
      const tick = (t) => {
        const p = Math.min((t - t0) / 1800, 1);
        setV(Math.round(target * (1 - Math.pow(1 - p, 4))));
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }, { threshold: 0.6 });
    io.observe(el);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, [target]);
  return <span ref={ref}>{v}{suffix}</span>;
}

/* ---------- rotating headline line ---------- */

function Roller({ items }) {
  const [i, setI] = useState(0);
  const [prev, setPrev] = useState(-1);
  useEffect(() => {
    if (reduced() || items.length < 2) return;
    const id = setInterval(() => setI((c) => { setPrev(c); return (c + 1) % items.length; }), 2600);
    return () => clearInterval(id);
  }, [items.length]);
  return (
    <span className="rs-roll rv" style={{ "--d": ".55s" }} aria-hidden="true">
      {items.map((t, n) => (
        <span key={t} className={`rs-roll-i ${n === i ? "cur" : n === prev ? "out" : ""}`}>{t}</span>
      ))}
    </span>
  );
}

/* ---------- hero canvas: flight lines, drones with trails, radar pulse ---------- */

function FlightField() {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current, x = c.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0, h = 0, t = 0, raf = 0, visible = true;
    const mouse = { x: -999, y: -999 };
    const still = reduced();
    const size = () => {
      w = c.clientWidth; h = c.clientHeight;
      c.width = w * dpr; c.height = h * dpr;
      x.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    size();
    window.addEventListener("resize", size);

    const drones = Array.from({ length: 9 }, (_, i) => ({
      ax: 0.16 + Math.random() * 0.3, ay: 0.1 + Math.random() * 0.22,
      fx: 0.0035 + Math.random() * 0.004, fy: 0.003 + Math.random() * 0.004, ph: i * 1.3, trail: [],
    }));
    const pulses = [];
    const move = (e) => { const r = c.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; };
    window.addEventListener("pointermove", move, { passive: true });

    const frame = () => {
      if (visible) {
        t++;
        x.clearRect(0, 0, w, h);

        for (let i = 0; i < 12; i++) {
          x.beginPath();
          for (let px = 0; px <= w; px += 14) {
            const y = h * 0.66 + i * 16 + Math.sin(px * 0.004 + t * 0.008 + i * 0.4) * 40 + Math.sin(px * 0.011 - t * 0.005) * 12;
            px ? x.lineTo(px, y) : x.moveTo(px, y);
          }
          x.strokeStyle = `rgba(41,151,255,${0.06 + i * 0.013})`;
          x.lineWidth = 1;
          x.stroke();
        }

        if (t % 170 === 1) pulses.push({ r: 0 });
        const cx = w * 0.76, cy = h * 0.42;
        for (let k = pulses.length - 1; k >= 0; k--) {
          const p = pulses[k];
          p.r += 2.4;
          const a = Math.max(0, 0.35 - p.r / 900);
          if (a <= 0) { pulses.splice(k, 1); continue; }
          x.beginPath(); x.arc(cx, cy, p.r, 0, 7);
          x.strokeStyle = `rgba(143,208,255,${a})`; x.lineWidth = 1.2; x.stroke();
        }

        drones.forEach((d) => {
          let px = w * (0.5 + d.ax * Math.sin(t * d.fx + d.ph));
          let py = h * (0.4 + d.ay * Math.sin(t * d.fy * 1.7 + d.ph));
          const dx = px - mouse.x, dy = py - mouse.y, dist = Math.hypot(dx, dy);
          if (dist > 0 && dist < 190) { const f = (1 - dist / 190) * 46; px += (dx / dist) * f; py += (dy / dist) * f; }
          d.trail.push([px, py]);
          if (d.trail.length > 28) d.trail.shift();
          for (let k = 1; k < d.trail.length; k++) {
            x.beginPath();
            x.moveTo(d.trail[k - 1][0], d.trail[k - 1][1]);
            x.lineTo(d.trail[k][0], d.trail[k][1]);
            x.strokeStyle = `rgba(143,208,255,${(k / d.trail.length) * 0.5})`;
            x.lineWidth = 1.4; x.stroke();
          }
          x.shadowColor = "#2997ff"; x.shadowBlur = 18; x.fillStyle = "#8fd0ff";
          x.beginPath(); x.arc(px, py, 2.3, 0, 7); x.fill(); x.shadowBlur = 0;
        });
      }
      if (!still) raf = requestAnimationFrame(frame);
    };
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: 0 });
    io.observe(c);
    frame();
    return () => {
      cancelAnimationFrame(raf); io.disconnect();
      window.removeEventListener("resize", size);
      window.removeEventListener("pointermove", move);
    };
  }, []);
  return <canvas ref={ref} className="rs-sky" aria-hidden="true" />;
}

/* ---------- research areas: expanding panels ---------- */

function Areas({ d }) {
  const [act, setAct] = useState(0);
  const box = useRef(null);
  const hold = useRef(false);
  const vis = useRef(false);

  useEffect(() => {
    const io = new IntersectionObserver(([e]) => { vis.current = e.isIntersecting; }, { threshold: 0.3 });
    io.observe(box.current);
    const id = setInterval(() => {
      if (!hold.current && vis.current && !reduced()) setAct((a) => (a + 1) % d.items.length);
    }, 5200);
    return () => { io.disconnect(); clearInterval(id); };
  }, [d.items.length]);

  return (
    <div
      className="rs-panels rv" style={{ "--d": ".15s" }} ref={box}
      onMouseEnter={() => (hold.current = true)} onMouseLeave={() => (hold.current = false)}
      onFocus={() => (hold.current = true)} onBlur={() => (hold.current = false)}
    >
      {d.items.map((it, n) => (
        <article
          key={it.id} className={`rs-pn ${n === act ? "on" : ""}`}
          onMouseEnter={() => setAct(n)} onClick={() => setAct(n)}
        >
          <Media m={it.media} className="fill" />
          <div className="rs-pn-shade" />
          <div className="rs-pn-bar" aria-hidden="true"><i /></div>
          <button className="rs-pn-tab" onClick={() => setAct(n)} aria-expanded={n === act}><span>{it.title}</span></button>
          <div className="rs-pn-body">
            <h3>{it.title}</h3>
            <p>{it.text}</p>
            <ul className="rs-chips">{it.tags.map((t) => <li key={t}>{t}</li>)}</ul>
            <Link className="rs-link" href={to(it.href)} tabIndex={n === act ? 0 : -1}>Explore this area</Link>
          </div>
        </article>
      ))}
    </div>
  );
}

/* ---------- current work: draggable rail ---------- */

function Rail({ d }) {
  const ref = useRef(null);
  const wrap = useRef(null);
  const drag = useRef({ on: false, x: 0, left: 0, moved: false });

  const upd = () => {
    const el = ref.current;
    if (!el || !wrap.current) return;
    const m = el.scrollWidth - el.clientWidth;
    wrap.current.style.setProperty("--rp", m > 0 ? (el.scrollLeft / m).toFixed(3) : 0);
  };
  useEffect(() => { upd(); window.addEventListener("resize", upd); return () => window.removeEventListener("resize", upd); }, []);

  const down = (e) => {
    if (e.pointerType !== "mouse") return;
    drag.current = { on: true, x: e.clientX, left: ref.current.scrollLeft, moved: false };
  };
  const move = (e) => {
    const s = drag.current;
    if (!s.on) return;
    const dx = e.clientX - s.x;
    if (Math.abs(dx) > 6) { s.moved = true; ref.current.classList.add("drag"); }
    if (s.moved) ref.current.scrollLeft = s.left - dx;
  };
  const up = () => {
    const s = drag.current;
    if (!s.on) return;
    s.on = false;
    ref.current.classList.remove("drag");
    setTimeout(() => { s.moved = false; }, 60);
  };
  const by = (dir) => ref.current.scrollBy({ left: dir * ref.current.clientWidth * 0.7, behavior: reduced() ? "auto" : "smooth" });

  return (
    <div ref={wrap} className="rs-railwrap rv" style={{ "--d": ".15s" }}>
      <div
        ref={ref} className="rs-rail" onScroll={upd}
        onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerLeave={up}
        onClickCapture={(e) => { if (drag.current.moved) { e.preventDefault(); e.stopPropagation(); } }}
      >
        {d.items.map((p) => (
          <Link key={p.id} href={to(p.href)} className="rs-proj" draggable={false} onMouseMove={spot}>
            <Media m={p.media} className="rs-proj-media" compact />
            <div className="rs-proj-text">
              <small>{p.area}</small>
              <h3>{p.title}</h3>
              <span className="rs-status"><i />{p.status}</span>
            </div>
          </Link>
        ))}
      </div>
      <div className="rs-rail-ctl">
        <div className="rs-rail-bar" aria-hidden="true"><i /></div>
        <button className="rs-rbtn" onClick={() => by(-1)} aria-label="Previous projects"><Arrow /></button>
        <button className="rs-rbtn fwd" onClick={() => by(1)} aria-label="Next projects"><Arrow /></button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

export default function Research({ content: override }) {
  const { content: c } = useResearchContent(override);
  const list = c.sections.filter((s) => s.visible);
  const root = useRef(null);
  const bar = useRef(null);
  const pipe = useRef(null);
  const [active, setActive] = useState(list[0] ? list[0].id : "");
  const key = list.map((s) => s.id + s.tx).join();

  const scrollTo = (id) => {
    const el = document.getElementById("research-" + id);
    if (el) el.scrollIntoView({ behavior: reduced() ? "auto" : "smooth", block: "start" });
  };
  const next = () => {
    const n = list[list.findIndex((s) => s.id === active) + 1];
    if (n) scrollTo(n.id);
  };

  /* The scroll engine: measures sections and writes --p, --q, --s, --cy. */
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const secs = [...el.querySelectorAll(".rs-sec")];
    const stages = [...el.querySelectorAll(".rs-stage")];
    const still = reduced();
    let raf = 0, last = "";

    const run = () => {
      raf = 0;
      const er = el.getBoundingClientRect();
      const vh = el.clientHeight;
      let mid = last;

      secs.forEach((s, i) => {
        const r = s.getBoundingClientRect();
        const top = r.top - er.top, h = r.height;
        const p = still || i === 0 ? 1 : clamp((vh - top) / (vh * 0.85));
        const q = still ? 0 : clamp(1 - (top + h) / vh);
        const sp = clamp((vh - top) / (vh + h));
        const cy = clamp(vh * 0.6 - top, 0, h);
        s.style.setProperty("--p", p.toFixed(3));
        s.style.setProperty("--q", q.toFixed(3));
        s.style.setProperty("--s", sp.toFixed(3));
        s.style.setProperty("--cy", cy.toFixed(0));
        if (p >= 1) s.dataset.in = "1"; else delete s.dataset.in;
        if (p > 0.25 || still) s.dataset.on = "1";
        if (top <= vh * 0.5 && top + h > vh * 0.5) mid = s.dataset.id;
      });

      if (mid !== last) { last = mid; setActive(mid); }

      const max = el.scrollHeight - el.clientHeight;
      if (bar.current) bar.current.style.transform = `scaleX(${max > 0 ? el.scrollTop / max : 0})`;

      const pl = pipe.current;
      if (pl) {
        const pr = pl.getBoundingClientRect();
        const t = clamp((er.top + vh * 0.65 - pr.top) / pr.height);
        pl.style.setProperty("--t", t.toFixed(3));
        stages.forEach((st) => {
          const sr = st.getBoundingClientRect();
          if (sr.top + sr.height * 0.3 < er.top + vh * 0.65) st.dataset.lit = "1"; else delete st.dataset.lit;
        });
      }
    };
    const queue = () => { if (!raf) raf = requestAnimationFrame(run); };

    run();
    el.addEventListener("scroll", queue, { passive: true });
    window.addEventListener("resize", queue);
    const late = setTimeout(run, 400); // after fonts and images settle
    return () => {
      cancelAnimationFrame(raf); clearTimeout(late);
      el.removeEventListener("scroll", queue);
      window.removeEventListener("resize", queue);
    };
  }, [key]);

  const glow = (e) => {
    root.current.style.setProperty("--mx", e.clientX + "px");
    root.current.style.setProperty("--my", e.clientY + "px");
  };

  /* One renderer per section id. Add a section = add one entry here
     and one entry in researchContent.sections. */
  const RENDER = {
    hero: () => {
      const d = c.hero;
      return (
        <>
          <Media m={d.background} className="bg dim" />
          <FlightField />
          <div className="rs-in rs-hero-in">
            {d.eyebrow && <p className="rs-eyebrow rv">{d.eyebrow}</p>}
            <h1 aria-label={`${d.headline} ${d.rotator.join(" ")}`}>
              <span className="rs-h1-line"><Split text={d.headline} base={0.1} /></span>
              <Roller items={d.rotator} />
            </h1>
            <p className="rs-lead rv" style={{ "--d": ".9s" }}>{d.lead}</p>
            <div className="rs-row rv" style={{ "--d": "1.05s" }}>
              <Link className="rs-btn" href={to(d.primary.href)} onMouseMove={mag} onMouseLeave={unmag}>{d.primary.label}</Link>
              <button className="rs-btn ghost" onClick={next} onMouseMove={mag} onMouseLeave={unmag}>{d.secondary.label}</button>
            </div>
            <ul className="rs-facts">
              {d.facts.map((f, n) => <li className="rv" style={delay(n, 1.2)} key={f}>{f}</li>)}
            </ul>
          </div>
          <button className="rs-cue" onClick={next} aria-label="Scroll to the next section"><i /></button>
        </>
      );
    },

    areas: () => {
      const d = c.areas;
      const band = [...d.ribbon, ...d.ribbon].join("   /   ");
      return (
        <>
          <div className="rs-ribbon" aria-hidden="true"><span>{band}   /   {band}</span></div>
          <div className="rs-in">
            <h2><Split text={d.title} /></h2>
            <Areas d={d} />
          </div>
        </>
      );
    },

    programme: () => {
      const d = c.programme;
      return (
        <div className="rs-in rs-split">
          <div>
            {d.eyebrow && <p className="rs-eyebrow rv">{d.eyebrow}</p>}
            <h2><Split text={d.title} /></h2>
            <p className="rs-lead rv" style={{ "--d": ".25s" }}>{d.text}</p>
            <ul className="rs-chips rv" style={{ "--d": ".35s" }}>{d.chips.map((t) => <li key={t}>{t}</li>)}</ul>
            <div className="rs-row rv" style={{ "--d": ".45s" }}>
              <Link className="rs-btn" href={to(d.cta.href)} onMouseMove={mag} onMouseLeave={unmag}>{d.cta.label}</Link>
            </div>
          </div>
          <div>
            <div className="rv" style={{ "--d": ".2s" }}>
              <div className="rs-tl rs-main" onMouseMove={tilt} onMouseLeave={untilt}>
                <Media m={d.media} className="fill" />
                <div className="rs-radar" aria-hidden="true" />
              </div>
            </div>
            <div className="rs-thumbs">
              {d.gallery.map((g, n) => (
                <div className="rv" style={delay(n, 0.4)} key={n}><Media m={g} className="rs-thumb" compact /></div>
              ))}
            </div>
          </div>
        </div>
      );
    },

    pipeline: () => {
      const d = c.pipeline;
      return (
        <div className="rs-in">
          <h2><Split text={d.title} /></h2>
          <div className="rs-pipe" ref={pipe}>
            <div className="rs-line" aria-hidden="true"><i /><b /></div>
            {d.stages.map((s, n) => (
              <div className={`rs-stage ${n % 2 ? "r" : "l"}`} key={s.id}>
                <span className="rs-num">{String(n + 1).padStart(2, "0")}</span>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      );
    },

    outputs: () => {
      const d = c.outputs;
      return (
        <div className="rs-in">
          <h2><Split text={d.title} /></h2>
          <div className="rs-out-grid">
            {d.items.map((it, n) => (
              <Link href={to(it.href)} className="rs-out rv" style={delay(n, 0.1)} key={it.id} onMouseMove={spot}>
                <h3>{it.title}</h3>
                <p>{it.text}</p>
                <span className="rs-more">Learn more <Arrow /></span>
              </Link>
            ))}
          </div>
          <div className="rs-stats">
            {d.stats.map((s, n) => (
              <div className="rs-stat rv" style={delay(n, 0.2)} key={s.label}>
                <strong><Count to={s.value} suffix={s.suffix} /></strong><span>{s.label}</span>
              </div>
            ))}
          </div>
          <Link className="rs-link rv" style={{ "--d": ".6s" }} href={to(d.cta.href)}>{d.cta.label}</Link>
        </div>
      );
    },

    projects: () => {
      const d = c.projects;
      return (
        <div className="rs-in">
          <h2><Split text={d.title} /></h2>
          <Rail d={d} />
          <Link className="rs-link rv" style={{ "--d": ".4s" }} href={to(d.cta.href)}>{d.cta.label}</Link>
        </div>
      );
    },

    opportunities: () => {
      const d = c.opportunities;
      return (
        <div className="rs-in">
          <h2><Split text={d.title} /></h2>
          <div className="rs-opps">
            {d.items.map((it, n) => (
              <Link href={to(it.href)} className="rs-opp rv" style={delay(n, 0.1)} key={it.id}>
                <span className="t">{it.title}</span>
                <span className="x">{it.text}</span>
                <Arrow />
              </Link>
            ))}
          </div>
        </div>
      );
    },

    cta: () => {
      const d = c.cta;
      return (
        <>
          <Media m={d.background} className="bg dim" />
          <div className="rs-rings" aria-hidden="true"><i /><i /><i /></div>
          <div className="rs-in rs-cta-in">
            <h2><Split text={d.title} /></h2>
            <div className="rs-row rv" style={{ "--d": ".4s" }}>
              <Link className="rs-btn big" href={to(d.primary.href)} onMouseMove={mag} onMouseLeave={unmag}>{d.primary.label}</Link>
              <Link className="rs-btn ghost big" href={to(d.secondary.href)} onMouseMove={mag} onMouseLeave={unmag}>{d.secondary.label}</Link>
            </div>
            <footer className="rs-foot rv" style={{ "--d": ".6s" }}>{d.footer}</footer>
          </div>
        </>
      );
    },
  };

  return (
    <main className="rs" ref={root} onMouseMove={glow}>
      <div className="rs-glow" aria-hidden="true" />
      <div className="rs-bar" ref={bar} aria-hidden="true" />

      <ol className="rs-dots" aria-label="Page sections">
        {list.map((s) => (
          <li key={s.id}>
            <button className={s.id === active ? "act" : ""} onClick={() => scrollTo(s.id)} aria-label={s.label} aria-current={s.id === active}><span>{s.label}</span></button>
          </li>
        ))}
      </ol>

      {list.map((s) => RENDER[s.id] && (
        <section key={s.id} id={"research-" + s.id} data-id={s.id} data-tx={s.tx || "none"} className={`rs-sec rs-${s.id}`}>
          <div className="rs-edge" aria-hidden="true" />
          <div className="rs-sx">{RENDER[s.id]()}</div>
        </section>
      ))}
    </main>
  );
}

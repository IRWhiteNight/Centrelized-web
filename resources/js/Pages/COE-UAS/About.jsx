import { useEffect, useRef, useState } from "react";
import { Link } from "@inertiajs/react";
import { useAboutContent } from "../../Components/COEUAS-Components/aboutContent";
import { SHOW_SLOT_HINTS } from "../../Components/COEUAS-Components/homeContent";
import { BASE } from "../../Components/COEUAS-Components/siteMapCOEUAS";
import "../../../css/COE-UAS-css/about.css";

/* ------------------------------------------------------------------
   About.jsx is layout and motion only.
   All text, links and media come from aboutContent.js (later: the CMS).
   Motion in this page:
   - hero radar canvas, word-by-word headline, counting stats
   - each section opens from a rounded card to full width (clip-path)
   - a light sweep crosses the screen whenever the chapter changes
   - scrolling bands between sections, scroll-linked parallax (--p)
   - timeline that draws itself, org chart that grows, tabbed pillars
------------------------------------------------------------------- */

const to = (h = "/") =>
  h === "/" ? BASE : h.startsWith("/") && !h.startsWith(BASE + "/") && h !== BASE ? BASE + h : h;

const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const clamp = (n, a = 0, b = 1) => Math.min(b, Math.max(a, n));
const delay = (n, base = 0.05) => ({ "--d": `${base + n * 0.1}s` });
const lines = (s) => s.split("\n").map((t, n) => <span key={n}>{n > 0 && <br />}{t}</span>);

const tilt = (e) => {
  const r = e.currentTarget.getBoundingClientRect();
  const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
  e.currentTarget.style.setProperty("--gx", `${(x + 0.5) * 100}%`);
  e.currentTarget.style.setProperty("--gy", `${(y + 0.5) * 100}%`);
  e.currentTarget.style.transform = `perspective(900px) rotateY(${x * 9}deg) rotateX(${-y * 9}deg)`;
};
const untilt = (e) => (e.currentTarget.style.transform = "");

/* Image slot: shows the file, or a labelled placeholder while it is missing. */
function Media({ m, className = "" }) {
  const [failed, setFailed] = useState(false);
  const src = m && m.src;
  const live = !!src && !failed;
  useEffect(() => setFailed(false), [src]);
  return (
    <div className={`ab-media ${className} ${live ? "is-live" : ""}`}>
      {live ? (
        <img src={src} alt={m.alt || ""} loading="lazy" onError={() => setFailed(true)} />
      ) : (
        <div className={`ab-ph ${SHOW_SLOT_HINTS ? "" : "quiet"}`}>
          {SHOW_SLOT_HINTS && (<><b>Image slot</b>{m && m.note && <em>{m.note}</em>}{src && <code>{src}</code>}</>)}
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
      const p = Math.min((t - s) / 1600, 1);
      setV(Math.round(target * (1 - Math.pow(1 - p, 4))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [on, target]);
  return <>{v}{suffix}</>;
}

/* Radar: rings, a rotating sweep and blips that light up when the sweep passes. */
function Radar() {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current, x = c.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w, h, t = 0, raf, vis = true;
    const size = () => { w = c.clientWidth; h = c.clientHeight; c.width = w * dpr; c.height = h * dpr; x.setTransform(dpr, 0, 0, dpr, 0, 0); };
    size(); window.addEventListener("resize", size);
    const blips = Array.from({ length: 10 }, () => ({ a: Math.random() * 6.283, r: 0.15 + Math.random() * 0.8, hit: -99 }));
    const still = reduced();
    const draw = () => {
      if (vis) {
        t += 0.012;
        x.clearRect(0, 0, w, h);
        const wide = w > 760;
        const cx = wide ? w * 0.72 : w * 0.5, cy = wide ? h * 0.5 : h * 0.72, R = Math.min(w * (wide ? 0.34 : 0.7), h * 0.46);
        for (let i = 1; i <= 5; i++) { x.beginPath(); x.arc(cx, cy, (R * i) / 5, 0, 7); x.strokeStyle = `rgba(41,151,255,${0.07 + i * 0.03})`; x.stroke(); }
        x.strokeStyle = "rgba(41,151,255,.14)";
        x.beginPath(); x.moveTo(cx - R, cy); x.lineTo(cx + R, cy); x.moveTo(cx, cy - R); x.lineTo(cx, cy + R); x.stroke();
        const a = t % 6.283;
        for (let k = 0; k < 30; k++) {
          x.beginPath(); x.moveTo(cx, cy); x.arc(cx, cy, R, a - 0.035 * (k + 1), a - 0.035 * k); x.closePath();
          x.fillStyle = `rgba(41,151,255,${(1 - k / 30) * 0.2})`; x.fill();
        }
        x.strokeStyle = "#8fd0ff"; x.beginPath(); x.moveTo(cx, cy); x.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R); x.stroke();
        blips.forEach((b) => {
          let d = Math.abs(a - b.a); d = Math.min(d, 6.283 - d);
          if (d < 0.05) b.hit = t;
          const f = Math.exp(-(t - b.hit) * 1.4);
          if (f < 0.03) return;
          const px = cx + Math.cos(b.a) * R * b.r, py = cy + Math.sin(b.a) * R * b.r;
          x.shadowColor = "#2997ff"; x.shadowBlur = 16; x.fillStyle = `rgba(143,208,255,${f})`;
          x.beginPath(); x.arc(px, py, 3 + f * 2, 0, 7); x.fill(); x.shadowBlur = 0;
        });
      }
      if (!still) raf = requestAnimationFrame(draw);
    };
    const io = new IntersectionObserver(([e]) => { vis = e.isIntersecting; });
    io.observe(c);
    draw();
    return () => { cancelAnimationFrame(raf); io.disconnect(); window.removeEventListener("resize", size); };
  }, []);
  return <canvas ref={ref} className="ab-radar" aria-hidden="true" />;
}

export default function About({ content: override }) {
  const { content: c } = useAboutContent(override);
  const list = c.sections.filter((s) => s.visible);
  const root = useRef(null);
  const bar = useRef(null);
  const [seen, setSeen] = useState({});
  const [active, setActive] = useState(list[0] ? list[0].id : "");
  const [tab, setTab] = useState(0);
  const key = list.map((s) => s.id).join();

  const scrollTo = (id) => {
    const el = document.getElementById("about-" + id);
    if (el) el.scrollIntoView({ behavior: reduced() ? "auto" : "smooth", block: "start" });
  };

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const secs = [...el.querySelectorAll(".ab-sec")];

    const reveal = new IntersectionObserver((es) => {
      const add = {};
      es.forEach((e) => { if (e.isIntersecting) add[e.target.dataset.id] = true; });
      if (Object.keys(add).length) setSeen((s) => ({ ...s, ...add }));
    }, { root: el, rootMargin: "0px 0px -12% 0px", threshold: 0 });
    const mid = new IntersectionObserver((es) => {
      es.forEach((e) => { if (e.isIntersecting) setActive(e.target.dataset.id); });
    }, { root: el, rootMargin: "-50% 0px -50% 0px", threshold: 0 });
    secs.forEach((s) => { reveal.observe(s); mid.observe(s); });

    /* scroll-linked values, written straight to the DOM (no re-render) */
    let raf = 0;
    const update = () => {
      raf = 0;
      const vh = el.clientHeight, max = el.scrollHeight - vh;
      if (bar.current) bar.current.style.transform = `scaleX(${max > 0 ? el.scrollTop / max : 0})`;
      secs.forEach((s) => {
        const r = s.getBoundingClientRect();
        s.style.setProperty("--p", ((r.top + r.height / 2 - vh / 2) / vh).toFixed(3));
      });
      const tl = el.querySelector(".ab-tl");
      if (tl) {
        const r = tl.getBoundingClientRect();
        tl.style.setProperty("--tl", clamp((vh * 0.65 - r.top) / r.height).toFixed(3));
        tl.querySelectorAll(".ab-ms").forEach((m) => {
          const mr = m.getBoundingClientRect();
          m.classList.toggle("lit", mr.top + mr.height * 0.4 < vh * 0.65);
        });
      }
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    el.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    update();
    return () => { reveal.disconnect(); mid.disconnect(); el.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); cancelAnimationFrame(raf); };
  }, [key]);

  const glow = (e) => {
    root.current.style.setProperty("--mx", e.clientX + "px");
    root.current.style.setProperty("--my", e.clientY + "px");
  };

  const RENDER = {
    hero: (d = c.hero) => (
      <>
        <Radar />
        <div className="ab-in ab-hero">
          <p className="eyebrow rv">{d.eyebrow}</p>
          <h1 aria-label={d.headline}>
            {d.headline.split(" ").map((w, n) => (
              <span className="w" key={n}><b style={{ "--d": `${0.1 + n * 0.08}s` }}>{w}</b></span>
            ))}
          </h1>
          <p className="lead rv" style={{ "--d": "0.8s" }}>{d.lead}</p>
          <div className="row rv" style={{ "--d": "0.95s" }}>
            <button className="btn" onClick={() => scrollTo(d.primary.target)}>{d.primary.label}</button>
            <Link className="btn ghost" href={to(d.secondary.href)}>{d.secondary.label}</Link>
          </div>
          <div className="ab-hstats">
            {d.stats.map((s, n) => (
              <div className="rv" style={delay(n, 1)} key={s.label}>
                <strong><Count to={s.value} suffix={s.suffix} on={!!seen.hero} /></strong><span>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="ab-cue" aria-hidden="true"><i /></div>
      </>
    ),

    background: (d = c.background) => (
      <div className="ab-in ab-split">
        <div>
          <p className="eyebrow rv">{d.eyebrow}</p>
          <h2 className="rv">{d.title}</h2>
          {d.text.map((t, n) => <p className="lead rv" style={delay(n, 0.1)} key={n}>{t}</p>)}
          <ul className="chips rv" style={{ "--d": ".4s" }}>{d.points.map((p) => <li key={p}>{p}</li>)}</ul>
        </div>
        <div className="ab-collage">
          <div className="rv" style={{ "--d": ".15s" }}>
            <div className="ab-tilt ab-main" onMouseMove={tilt} onMouseLeave={untilt}>
              <Media m={d.media} className="fill" />
              <span className="ab-ring" />
            </div>
          </div>
          <div className="ab-pair">
            {d.gallery.map((g, n) => <div className="rv" style={delay(n, 0.35)} key={n}><Media m={g} className="ab-thumb" /></div>)}
          </div>
        </div>
      </div>
    ),

    direction: (d = c.direction) => (
      <div className="ab-in">
        <h2 className="rv">{d.title}</h2>
        <div className="ab-trio">
          {d.cards.map((k, n) => (
            <div className="rv" style={delay(n)} key={k.id}>
              <div className="ab-card ab-tilt" onMouseMove={tilt} onMouseLeave={untilt}>
                <span className="ab-tag">{k.tag}</span>
                <h3>{k.title}</h3>
                {k.text && <p>{k.text}</p>}
                {k.list && <ul>{k.list.map((li, i) => <li key={li} style={{ "--i": i }}>{li}</li>)}</ul>}
              </div>
            </div>
          ))}
        </div>
        <div className="ab-banner rv" style={{ "--d": ".45s" }}>
          <b>{d.directionTitle}</b><span>{d.directionText}</span>
        </div>
      </div>
    ),

    history: (d = c.history) => (
      <div className="ab-in">
        <p className="eyebrow rv">{d.eyebrow}</p>
        <h2 className="rv">{d.title}</h2>
        <p className="lead rv" style={{ "--d": ".1s" }}>{d.text}</p>
        <div className="ab-tl">
          <div className="ab-track"><i /></div>
          {d.items.map((m, n) => (
            <div className="ab-ms" key={m.year + n}>
              <div className="ab-dot" />
              <div className="ab-msc">
                <strong>{m.year}</strong>
                <h3>{m.title}</h3>
                <p>{m.text}</p>
              </div>
            </div>
          ))}
        </div>
        <Link className="link rv" href={to(d.cta.href)}>{d.cta.label}</Link>
      </div>
    ),

    organisation: (d = c.organisation) => (
      <div className="ab-in">
        <p className="eyebrow rv">{d.eyebrow}</p>
        <h2 className="rv">{d.title}</h2>
        <div className="ab-org">
          <div className="ab-node ab-root rv">{d.root}</div>
          <div className="ab-stem" />
          <div className="ab-kids">
            {d.nodes.map((n, i) => (
              <div className="ab-kid rv" style={delay(i, 0.5)} key={n.title}>
                <div className="ab-node"><h3>{n.title}</h3><p>{n.text}</p></div>
              </div>
            ))}
          </div>
          <p className="ab-prev rv" style={{ "--d": ".9s" }}>{d.previous}</p>
        </div>
        <div className="row rv" style={{ "--d": ".6s" }}>
          <Link className="btn" href={to(d.cta.href)}>{d.cta.label}</Link>
          <Link className="btn ghost" href={to(d.chartCta.href)}>{d.chartCta.label}</Link>
        </div>
      </div>
    ),

    strategy: (d = c.strategy) => {
      const t = d.tabs[tab] || d.tabs[0];
      return (
        <div className="ab-in">
          <p className="eyebrow rv">{d.eyebrow}</p>
          <h2 className="rv">{d.title}</h2>
          <div className="ab-tabs rv" style={{ "--d": ".15s" }}>
            <div className="ab-tablist" role="tablist" style={{ "--n": d.tabs.length, "--k": tab }}>
              <span className="ab-mark" />
              {d.tabs.map((x, n) => (
                <button key={x.id} role="tab" aria-selected={n === tab} className={n === tab ? "act" : ""} onClick={() => setTab(n)}>
                  <small>0{n + 1}</small>{x.label}
                </button>
              ))}
            </div>
            <div className="ab-panel" key={t.id} role="tabpanel">
              <span className="ab-big" aria-hidden="true">0{tab + 1}</span>
              <h3>{t.label}</h3>
              <p className="lead">{t.text}</p>
              <ul>{t.points.map((p, i) => <li key={p} style={{ "--i": i }}>{p}</li>)}</ul>
              <Link className="link" href={to(t.href)}>Learn more</Link>
            </div>
          </div>
        </div>
      );
    },

    awards: (d = c.awards) => (
      <div className="ab-in">
        <p className="eyebrow rv">{d.eyebrow}</p>
        <h2 className="rv">{d.title}</h2>
        <div className="ab-trio">
          {d.groups.map((g, n) => (
            <div className="rv" style={delay(n)} key={g.id}>
              <div className="ab-award ab-tilt" onMouseMove={tilt} onMouseLeave={untilt}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3" /></svg>
                <h3>{g.title}</h3>
                <ul>{g.items.map((it, i) => <li key={i}>{it}</li>)}</ul>
              </div>
            </div>
          ))}
        </div>
        <Link className="link rv" style={{ "--d": ".5s" }} href={to(d.cta.href)}>{d.cta.label}</Link>
      </div>
    ),

    cta: (d = c.cta) => (
      <div className="ab-in">
        <h2 className="rv">{d.title}</h2>
        <div className="ab-trio">
          {d.items.map((it, n) => (
            <Link href={to(it.href)} className="ab-go rv" style={delay(n)} key={it.id}>
              <h3>{it.title}</h3><p>{it.text}</p><span aria-hidden="true">→</span>
            </Link>
          ))}
        </div>
        <footer className="ab-foot rv" style={{ "--d": ".4s" }}>{d.footer}</footer>
      </div>
    ),
  };

  return (
    <main className="ab" ref={root} onMouseMove={glow}>
      <div className="ab-cursor" aria-hidden="true" />
      <div className="ab-bar" ref={bar} aria-hidden="true" />
      <div className="ab-sweep" key={active} aria-hidden="true" />

      <ol className="ab-dots" aria-label="Page sections">
        {list.map((s) => (
          <li key={s.id}><button className={s.id === active ? "act" : ""} onClick={() => scrollTo(s.id)} aria-label={s.label} aria-current={s.id === active}><span>{s.label}</span></button></li>
        ))}
      </ol>

      {list.map((s, i) => RENDER[s.id] && (
        <div key={s.id} className="ab-wrap">
          <section id={"about-" + s.id} data-id={s.id} className={`ab-sec ab-sec-${s.id} ${i % 2 ? "alt" : ""} ${seen[s.id] ? "on" : ""}`}>
            <span className="ab-chap" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
            <span className="ab-edge" aria-hidden="true" />
            {RENDER[s.id]()}
          </section>
          {c.bands[s.id] && (
            <div className="ab-band" aria-hidden="true">
              <div className="ab-bt">{[0, 1, 2, 3].map((k) => <span key={k}>{c.bands[s.id]}</span>)}</div>
            </div>
          )}
        </div>
      ))}
    </main>
  );
}

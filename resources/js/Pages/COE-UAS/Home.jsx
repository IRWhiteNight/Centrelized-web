import { useEffect, useRef, useState } from "react";
import { Link } from "@inertiajs/react";
import { useHomeContent, SHOW_SLOT_HINTS } from "../../Components/COEUAS-Components/homeContent";
import { BASE } from "../../Components/COEUAS-Components/siteMapCOEUAS";
import "../../../css/COE-UAS-css/home.css";

/* ------------------------------------------------------------------
   Home.jsx is layout and motion only.
   All text, links, media and numbers come from homeContent.js
   (later: the admin CMS). Pass a `content` prop to preview changes.
   The navigation bar comes from COEUAsWebsiteLayout (see app.jsx).
   The page scrolls normally inside its own container (.coe).
------------------------------------------------------------------- */

/* Prefix internal links; leave external links and already-prefixed links alone. */
const to = (h = "/") =>
  h === "/" ? BASE : h.startsWith("/") && !h.startsWith(BASE + "/") && h !== BASE ? BASE + h : h;

const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const ICON = {
  image: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="16" rx="3" /><circle cx="9" cy="10" r="1.8" /><path d="m21 16-5-5-9 9" /></svg>,
  video: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="3" /><path d="m10 9.5 5 2.5-5 2.5z" /></svg>,
};

/* One image or video slot. Shows the file when it exists, otherwise a labelled placeholder. */
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
    <div ref={box} className={`media ${className} ${live ? "is-live" : "is-empty"} ${compact ? "sm" : ""}`}>
      {live ? (
        isVideo
          ? <video src={src} poster={m.poster} muted loop playsInline preload="metadata" onError={() => setFailed(true)} />
          : <img src={src} alt={m.alt || ""} loading="lazy" onError={() => setFailed(true)} />
      ) : (
        <div className={`ph ${SHOW_SLOT_HINTS ? "" : "quiet"}`}>
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

/* Soft animated flight lines with a few drones. Runs only while visible. */
function Sky() {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current, x = c.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w, h, t = 0, raf, visible = true;
    const size = () => { w = c.clientWidth; h = c.clientHeight; c.width = w * dpr; c.height = h * dpr; x.setTransform(dpr, 0, 0, dpr, 0, 0); x.clearRect(0, 0, w, h); };
    size(); window.addEventListener("resize", size);
    const drones = Array.from({ length: 7 }, (_, i) => ({ a: 0.25 + Math.random() * 0.25, b: 0.15 + Math.random() * 0.2, f: 0.004 + Math.random() * 0.004, g: 0.003 + Math.random() * 0.004, p: i * 1.7 }));
    const still = reduced();
    const draw = () => {
      if (visible) {
        t++;
        x.clearRect(0, 0, w, h);
        for (let i = 0; i < 14; i++) {
          x.beginPath();
          for (let px = 0; px <= w; px += 14) {
            const y = h * 0.64 + i * 15 + Math.sin(px * 0.004 + t * 0.008 + i * 0.4) * 38 + Math.sin(px * 0.011 - t * 0.005) * 12;
            px ? x.lineTo(px, y) : x.moveTo(px, y);
          }
          x.strokeStyle = `rgba(41,151,255,${0.07 + i * 0.014})`; x.stroke();
        }
        drones.forEach((d) => {
          const px = w * (0.5 + d.a * Math.sin(t * d.f + d.p)), py = h * (0.35 + d.b * Math.sin(t * d.g * 1.7 + d.p));
          x.shadowColor = "#2997ff"; x.shadowBlur = 18; x.fillStyle = "#8fd0ff";
          x.beginPath(); x.arc(px, py, 2.2, 0, 7); x.fill(); x.shadowBlur = 0;
        });
      }
      if (!still) raf = requestAnimationFrame(draw);
    };
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: 0 });
    io.observe(c);
    draw();
    return () => { cancelAnimationFrame(raf); io.disconnect(); window.removeEventListener("resize", size); };
  }, []);
  return <canvas ref={ref} className="sky" aria-hidden="true" />;
}

const tilt = (e) => {
  const r = e.currentTarget.getBoundingClientRect();
  const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
  e.currentTarget.style.transform = `perspective(900px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg)`;
};
const untilt = (e) => (e.currentTarget.style.transform = "");
const delay = (n, base = 0.05) => ({ "--d": `${base + n * 0.1}s` });
const lines = (s) => s.split("\n").map((t, n) => <span key={n}>{n > 0 && <br />}{t}</span>);

export default function Home({ content: override }) {
  const { content: c } = useHomeContent(override);
  const list = c.sections.filter((s) => s.visible);
  const root = useRef(null);
  const bar = useRef(null);
  const [seen, setSeen] = useState({});
  const [active, setActive] = useState(list[0] ? list[0].id : "");
  const key = list.map((s) => s.id).join();

  const scrollTo = (id) => {
    const el = document.getElementById("home-" + id);
    if (el) el.scrollIntoView({ behavior: reduced() ? "auto" : "smooth", block: "start" });
  };
  const next = () => {
    const n = list[list.findIndex((s) => s.id === active) + 1];
    if (n) scrollTo(n.id);
  };

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const secs = [...el.querySelectorAll(".sec")];
    const reveal = new IntersectionObserver((es) => {
      const add = {};
      es.forEach((e) => { if (e.isIntersecting) add[e.target.dataset.id] = true; });
      if (Object.keys(add).length) setSeen((s) => ({ ...s, ...add }));
    }, { root: el, rootMargin: "0px 0px -12% 0px", threshold: 0 });
    const mid = new IntersectionObserver((es) => {
      es.forEach((e) => { if (e.isIntersecting) setActive(e.target.dataset.id); });
    }, { root: el, rootMargin: "-50% 0px -50% 0px", threshold: 0 });
    secs.forEach((s) => { reveal.observe(s); mid.observe(s); });

    const onScroll = () => {
      const max = el.scrollHeight - el.clientHeight;
      if (bar.current) bar.current.style.transform = `scaleX(${max > 0 ? el.scrollTop / max : 0})`;
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => { reveal.disconnect(); mid.disconnect(); el.removeEventListener("scroll", onScroll); };
  }, [key]);

  const glow = (e) => {
    root.current.style.setProperty("--mx", e.clientX + "px");
    root.current.style.setProperty("--my", e.clientY + "px");
  };

  /* One renderer per section id. Add a new section = add one entry here
     and one entry in homeContent.sections. */
  const RENDER = {
    hero: (d = c.hero) => (
      <>
        <Media m={d.background} className="bg dim" />
        <Sky />
        <div className="in hero">
          {d.eyebrow && <p className="eyebrow rv">{d.eyebrow}</p>}
          <h1 aria-label={d.headline}>
            {d.headline.split(" ").map((w, n) => (
              <span className="w" key={n}><b style={{ "--d": `${0.1 + n * 0.08}s` }}>{w}</b></span>
            ))}
          </h1>
          <p className="lead rv" style={{ "--d": "0.8s" }}>{d.lead}</p>
          <div className="row rv" style={{ "--d": "0.95s" }}>
            <Link className="btn" href={to(d.primary.href)}>{d.primary.label}</Link>
            <button className="btn ghost" onClick={next}>{d.secondary.label}</button>
          </div>
          <div className="strip">
            {d.gallery.map((g, n) => (
              <div className="rv" style={delay(n, 0.7)} key={n}><Media m={g} className="shot" compact /></div>
            ))}
          </div>
        </div>
      </>
    ),

    capabilities: (d = c.capabilities) => (
      <div className="in">
        <h2 className="rv">{lines(d.title)}</h2>
        <div className="bento">
          {d.items.map((it, n) => (
            <Link href={to(it.href)} className="panel rv" style={delay(n)} key={it.id}>
              <Media m={it.media} className="fill" />
              <div className="cap"><h3>{it.title}</h3><p>{it.text}</p></div>
            </Link>
          ))}
        </div>
      </div>
    ),

    featured: (d = c.featured) => (
      <div className="in split">
        <div>
          {d.eyebrow && <p className="eyebrow rv">{d.eyebrow}</p>}
          <h2 className="rv">{d.title}</h2>
          <p className="lead rv" style={{ "--d": ".1s" }}>{d.text}</p>
          <ul className="chips rv" style={{ "--d": ".2s" }}>{d.chips.map((t) => <li key={t}>{t}</li>)}</ul>
          <div className="row rv" style={{ "--d": ".3s" }}><Link className="btn" href={to(d.cta.href)}>{d.cta.label}</Link></div>
        </div>
        <div>
          <div className="rv" style={{ "--d": ".15s" }}>
            <div className="tl main-media" onMouseMove={tilt} onMouseLeave={untilt}>
              <Media m={d.media} className="fill" />
            </div>
          </div>
          <div className="thumbs">
            {d.gallery.map((g, n) => (
              <div className="rv" style={delay(n, 0.3)} key={n}><Media m={g} className="thumb-sm" compact /></div>
            ))}
          </div>
        </div>
      </div>
    ),

    members: (d = c.members) => (
      <div className="in">
        <h2 className="rv">{d.title}</h2>
        <div className="cards">
          {d.items.map((m, n) => (
            <div className="rv" style={delay(n)} key={m.id}>
              <Link href={to(`/people/member/${m.id}`)} className="card tl" onMouseMove={tilt} onMouseLeave={untilt}>
                <Media m={m.media} className="portrait" compact />
                <h3>{m.name}</h3><p>{m.role}</p>
              </Link>
            </div>
          ))}
        </div>
        <Link className="link rv" style={{ "--d": ".5s" }} href={to(d.cta.href)}>{d.cta.label}</Link>
      </div>
    ),

    highlights: (d = c.highlights) => (
      <>
        <Media m={d.background} className="bg dim" />
        <Sky />
        <div className="in">
          <h2 className="rv">{d.title}</h2>
          <div className="stats">
            {d.stats.map((s, n) => (
              <div className="stat rv" style={delay(n)} key={s.label}>
                <strong><Count to={s.value} suffix={s.suffix} on={!!seen.highlights} /></strong><span>{s.label}</span>
              </div>
            ))}
          </div>
          <div className="gallery">
            {d.gallery.map((g, n) => (
              <div className="rv" style={delay(n, 0.3)} key={n}><Media m={g} className="shot-wide" compact /></div>
            ))}
          </div>
          <Link className="link rv" style={{ "--d": ".6s" }} href={to(d.cta.href)}>{d.cta.label}</Link>
        </div>
      </>
    ),

    news: (d = c.news) => (
      <div className="in">
        <h2 className="rv">{d.title}</h2>
        <div className="news">
          <div className="feed">
            {d.items.map((it, n) => (
              <Link href={to(`/engagement/news/${it.id}`)} className={`item rv ${n === 0 ? "big" : ""}`} style={delay(n)} key={it.id}>
                <Media m={it.media} className="thumb" compact={n > 0} />
                <div><small>{it.category}, {it.date}</small><h3>{it.title}</h3></div>
              </Link>
            ))}
          </div>
          <aside className="up rv" style={{ "--d": ".25s" }}>
            <h3>{d.upcomingTitle}</h3>
            <ul>{d.upcoming.map((up) => <li key={up.id}><Link href={to(up.href)}>{up.text}</Link></li>)}</ul>
          </aside>
        </div>
      </div>
    ),

    partners: (d = c.partners) => (
      <>
        <div className="in">
          <h2 className="rv">{d.title}</h2>
          <p className="lead rv" style={{ "--d": ".1s" }}>{d.text}</p>
        </div>
        <div className="marq" aria-hidden="true">
          {[0, 1].map((r) => (
            <div className="track" key={r}>
              {[...d.items, ...d.items].map((p, n) => (
                <div className="logo" key={n}><Media m={p.media} label={p.name} className="logo-slot" compact /></div>
              ))}
            </div>
          ))}
        </div>
      </>
    ),

    cta: (d = c.cta) => (
      <>
        <Media m={d.background} className="bg dim" />
        <div className="in">
          <h2 className="rv">{d.title}</h2>
          <div className="cta">
            {d.items.map((it, n) => (
              <Link href={to(it.href)} className="big rv" style={delay(n)} key={it.id}>
                <Media m={it.media} className="big-media" compact />
                <div className="big-text"><h3>{it.title}</h3><p>{it.text}</p></div>
              </Link>
            ))}
          </div>
          <footer className="foot rv" style={{ "--d": ".4s" }}>{d.footer} · <Link href={to(c.header.contact.href)}>{c.header.contact.label}</Link></footer>
        </div>
      </>
    ),
  };

  return (
    <main className="coe" ref={root} onMouseMove={glow}>
      <div className="cursor" aria-hidden="true" />
      <div className="bar" ref={bar} aria-hidden="true" />

      <ol className="dots" aria-label="Page sections">
        {list.map((s) => (
          <li key={s.id}><button className={s.id === active ? "act" : ""} onClick={() => scrollTo(s.id)} aria-label={s.label} aria-current={s.id === active}><span>{s.label}</span></button></li>
        ))}
      </ol>

      {list.map((s) => RENDER[s.id] && (
        <section key={s.id} id={"home-" + s.id} data-id={s.id} className={`sec sec-${s.id} ${seen[s.id] ? "on" : ""}`}>{RENDER[s.id]()}</section>
      ))}
    </main>
  );
}

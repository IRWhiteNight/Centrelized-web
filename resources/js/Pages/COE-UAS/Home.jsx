import { Fragment, useEffect, useRef, useState } from "react";
import { Link } from "@inertiajs/react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useHomeContent, SHOW_SLOT_HINTS } from "../../data/COEUAS-data/homeContent";
import { BASE } from "../../data/COEUAS-data/siteMapCOEUAS";
import videobg from "../../videos/bg-video2.mp4"; /* same video as the PSB home hero */
import "../../../css/COE-UAS-css/home.css";

/* ------------------------------------------------------------------
   Home.jsx = layout and motion only (same approach as the PSB home page).
   All text, links, media and numbers come from homeContent.js
   (later: the admin CMS). Pass a `content` prop to preview changes.
   The navigation bar AND the footer come from COEUASWebsiteLayout (see app.jsx).
   The page scrolls with the browser window, so the layout footer sits
   naturally at the end of the page.

   THEME: black / white / blue. Each section is a "scene":
   dark  = near-black, light text, bright blue accent
   light = white / pale grey, dark text, royal blue accent
   blue  = royal blue, white text
   Change the scene of a section in THEME below.
------------------------------------------------------------------- */

const THEME = {
  hero: "dark",
  capabilities: "light",
  featured: "dark",
  members: "light",
  highlights: "blue",
  news: "dark",
  partners: "light",
  cta: "blue",
};
const EASE = [0.16, 1, 0.3, 1];
const pad = (n) => String(n).padStart(2, "0");

/* Prefix internal links; leave external links and already-prefixed links alone. */
const to = (h = "/") =>
  h === "/" ? BASE : h.startsWith("/") && !h.startsWith(BASE + "/") && h !== BASE ? BASE + h : h;

const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const ICON = {
  image: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="16" rx="3" /><circle cx="9" cy="10" r="1.8" /><path d="m21 16-5-5-9 9" /></svg>,
  video: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="3" /><path d="m10 9.5 5 2.5-5 2.5z" /></svg>,
};

const Arrow = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
);

/* ---------- building blocks ---------- */

/* scroll reveal: opacity + rise only, so text stays crisp afterwards */
const R = ({ children, d = 0, className = "" }) => {
  const rm = useReducedMotion();
  return (
    <motion.div className={className} initial={rm ? false : { opacity: 0, y: 36 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-6% 0px" }} transition={{ duration: 0.9, delay: d, ease: EASE }}>
      {children}
    </motion.div>
  );
};

/* masked word-by-word headline. "\n" = line break, *word* = highlighted word.
   With no *stars* in the text, the last word is highlighted automatically. */
const Words = ({ text, d = 0 }) => {
  const rm = useReducedMotion();
  const rows = text.split("\n"), flat = [];
  rows.forEach((row, li) => {
    row.split("*").forEach((part, k) => part.split(" ").filter(Boolean).forEach((w) => flat.push({ w, hl: k % 2 === 1 })));
    if (li < rows.length - 1) flat.push({ br: true });
  });
  if (!text.includes("*")) {
    const last = [...flat].reverse().find((x) => !x.br);
    if (last) last.hl = true;
  }
  return flat.map((x, i) =>
    x.br ? <br key={i} /> : (
      <Fragment key={i}>
        <motion.span className="mask" initial={rm ? false : "hide"} whileInView="show" viewport={{ once: true }}>
          <motion.span className={x.hl ? "hl" : ""}
            variants={{ hide: { y: "125%", rotate: 3 }, show: { y: 0, rotate: 0, transition: { duration: 1, delay: d + i * 0.06, ease: EASE } } }}>
            {x.w}
          </motion.span>
        </motion.span>{" "}
      </Fragment>
    )
  );
};

/* pill button with a round arrow chip. Link when `href` is given, otherwise a button. */
function Btn({ children, href, onClick, ghost }) {
  const inner = <><i className="ico"><Arrow /></i><span>{children}</span></>;
  const cls = `btn${ghost ? " ghost" : ""}`;
  return href
    ? <Link className={cls} href={href}>{inner}</Link>
    : <button type="button" className={cls} onClick={onClick}>{inner}</button>;
}

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

/* animated number */
function Count({ to: target, suffix = "" }) {
  const ref = useRef(null), [v, setV] = useState(0), rm = useReducedMotion();
  useEffect(() => {
    if (rm) { setV(target); return undefined; }
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const t0 = performance.now();
      const step = (t) => { const p = Math.min(1, (t - t0) / 1600); setV(Math.round(target * (1 - (1 - p) ** 4))); if (p < 1) requestAnimationFrame(step); };
      requestAnimationFrame(step);
    }, { threshold: 0.5 });
    if (ref.current) io.observe(ref.current);
    return () => io.disconnect();
  }, [target, rm]);
  return <span ref={ref}>{v}{suffix}</span>;
}

const tilt = (e) => {
  const r = e.currentTarget.getBoundingClientRect();
  const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
  e.currentTarget.style.transform = `perspective(900px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg)`;
};
const untilt = (e) => (e.currentTarget.style.transform = "");

/* section heading: eyebrow with count, then the masked headline */
function Head({ n, total, kicker, title }) {
  return (
    <header className="head">
      <R className="eyebrow"><i />{kicker}<em>{pad(n)}<s>/{pad(total)}</s></em></R>
      <h2><Words text={title} /></h2>
    </header>
  );
}

/* ---------- HERO: same video as the PSB home, centred, one headline, two buttons ---------- */
function Hero({ d, next }) {
  const ref = useRef(null), rm = useReducedMotion();
  /* the page scrolls with the window, so no scroll container is needed */
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const vScale = useTransform(p, [0, 1], [1.04, 1.16]);
  const mainY = useTransform(p, [0, 1], ["0%", "-10%"]);
  const mainO = useTransform(p, [0.1, 0.75], [1, 0]);
  const tick = d.ticker && d.ticker.length ? d.ticker : null;
  return (
    <>
      <section id="home-hero" data-id="hero" ref={ref} className="sec sec-hero s-dark">
        <motion.div className="hbg" style={rm ? undefined : { scale: vScale }} aria-hidden="true">
          <video autoPlay={!rm} muted loop playsInline preload="auto"><source src={videobg} type="video/mp4" /></video>
          <div className="hmono" /><div className="hdots" /><div className="hshade" />
        </motion.div>

        <div className="wrap hwrap">
          <motion.div className="hmain" style={rm ? undefined : { y: mainY, opacity: mainO }}>
            {d.eyebrow && <R className="eyebrow">{d.eyebrow}</R>}
            <h1 aria-label={d.headline}><Words text={d.headline} d={0.15} /></h1>
            <R d={0.5} className="hlead">{d.lead}</R>
            <R d={0.7} className="hcta">
              <Btn href={to(d.primary.href)}>{d.primary.label}</Btn>
              <Btn ghost onClick={next}>{d.secondary.label}</Btn>
            </R>
          </motion.div>

          {d.gallery && d.gallery.length > 0 && (
            <R d={1} className="hstrip">
              {d.gallery.map((g, n) => <Media key={n} m={g} className="shot" compact />)}
            </R>
          )}
          <span className="hcue" aria-hidden="true" />
        </div>
      </section>
      {tick && (
        <div className="ticker" aria-hidden="true">
          <div className="ticker-t">
            {Array.from({ length: 8 }, (_, g) => tick.map((t) => <span key={`${g}-${t}`}>{t}<i>✦</i></span>))}
          </div>
        </div>
      )}
    </>
  );
}

export default function Home({ content: override }) {
  const { content: c } = useHomeContent(override);
  const list = c.sections.filter((s) => s.visible);
  const root = useRef(null);
  const bar = useRef(null);
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
    if (!el) return undefined;

    /* which section is in the middle of the window */
    const spy = new IntersectionObserver((es) => {
      es.forEach((e) => { if (e.isIntersecting) setActive(e.target.dataset.id); });
    }, { rootMargin: "-50% 0px -50% 0px", threshold: 0 });
    el.querySelectorAll(".sec").forEach((s) => spy.observe(s));

    /* progress bar follows the window scroll */
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (bar.current) bar.current.style.transform = `scaleX(${max > 0 ? Math.min(1, window.scrollY / max) : 0})`;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { spy.disconnect(); window.removeEventListener("scroll", onScroll); };
  }, [key]);

  /* One renderer per section id. Add a new section = add one entry here,
     one entry in THEME and one entry in homeContent.sections.
     `head(title, kicker?)` draws the section heading. */
  const RENDER = {
    capabilities: (d = c.capabilities, head) => (
      <>
        {head(d.title)}
        <div className="bento">
          {d.items.map((it, n) => (
            <R d={(n % 3) * 0.07} className="cell" key={it.id}>
              <Link href={to(it.href)} className="panel">
                <span className="bign">{pad(n + 1)}</span>
                <Media m={it.media} className="fill" />
                <div className="cap"><h3>{it.title}</h3><p>{it.text}</p></div>
              </Link>
            </R>
          ))}
        </div>
      </>
    ),

    featured: (d = c.featured, head) => (
      <div className="split">
        <div>
          {head(d.title, d.eyebrow)}
          <R d={0.1} className="lead">{d.text}</R>
          <R d={0.2}><ul className="chips">{d.chips.map((t) => <li key={t}>{t}</li>)}</ul></R>
          <R d={0.3} className="row"><Btn href={to(d.cta.href)}>{d.cta.label}</Btn></R>
        </div>
        <div>
          <R d={0.15}>
            <div className="tl main-media" onMouseMove={tilt} onMouseLeave={untilt}>
              <Media m={d.media} className="fill" />
            </div>
          </R>
          <div className="thumbs">
            {d.gallery.map((g, n) => <R d={0.3 + n * 0.08} key={n}><Media m={g} className="thumb-sm" compact /></R>)}
          </div>
        </div>
      </div>
    ),

    members: (d = c.members, head) => (
      <>
        {head(d.title)}
        <div className="cards">
          {d.items.map((m, n) => (
            <R d={n * 0.08} key={m.id}>
              <Link href={to(`/people/member/${m.id}`)} className="card tl" onMouseMove={tilt} onMouseLeave={untilt}>
                <Media m={m.media} className="portrait" compact />
                <h3>{m.name}</h3><p>{m.role}</p>
              </Link>
            </R>
          ))}
        </div>
        <R d={0.3} className="row"><Btn href={to(d.cta.href)}>{d.cta.label}</Btn></R>
      </>
    ),

    highlights: (d = c.highlights, head) => (
      <>
        {head(d.title)}
        <div className="stats">
          {d.stats.map((s, n) => (
            <R d={n * 0.08} className="stat" key={s.label}>
              <strong><Count to={s.value} suffix={s.suffix} /></strong><span>{s.label}</span>
            </R>
          ))}
        </div>
        <div className="gallery">
          {d.gallery.map((g, n) => <R d={0.2 + n * 0.08} key={n}><Media m={g} className="shot-wide" compact /></R>)}
        </div>
        <R d={0.3} className="row"><Btn href={to(d.cta.href)}>{d.cta.label}</Btn></R>
      </>
    ),

    news: (d = c.news, head) => (
      <>
        {head(d.title)}
        <div className="news">
          <div className="feed">
            {d.items.map((it, n) => (
              <R d={n * 0.08} className={`itemw ${n === 0 ? "big" : ""}`} key={it.id}>
                <Link href={to(`/engagement/news/${it.id}`)} className="item">
                  <Media m={it.media} className="thumb" compact={n > 0} />
                  <div><small>{it.category}, {it.date}</small><h3>{it.title}</h3></div>
                </Link>
              </R>
            ))}
          </div>
          <R d={0.2} className="upw">
            <aside className="up">
              <h3>{d.upcomingTitle}</h3>
              <ul>{d.upcoming.map((up) => <li key={up.id}><Link href={to(up.href)}>{up.text}</Link></li>)}</ul>
            </aside>
          </R>
        </div>
      </>
    ),

    partners: (d = c.partners, head) => (
      <>
        {head(d.title)}
        <R d={0.1} className="lead">{d.text}</R>
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

    /* the old "© 2026 COE-UAS" line is gone: the layout footer replaces it */
    cta: (d = c.cta, head) => (
      <>
        {head(d.title)}
        <div className="cta">
          {d.items.map((it, n) => (
            <R d={n * 0.08} key={it.id}>
              <Link href={to(it.href)} className="big">
                <Media m={it.media} className="big-media" compact />
                <div className="big-text"><h3>{it.title}</h3><p>{it.text}</p></div>
              </Link>
            </R>
          ))}
        </div>
      </>
    ),
  };

  const theme = (id) => THEME[id] || "dark";

  return (
    <div className="coe" ref={root} data-theme={theme(active)}>
      <div className="bar" ref={bar} aria-hidden="true" />

      <ol className="dots" aria-label="Page sections">
        {list.map((s) => (
          <li key={s.id}><button className={s.id === active ? "act" : ""} onClick={() => scrollTo(s.id)} aria-label={s.label} aria-current={s.id === active}><span>{s.label}</span></button></li>
        ))}
      </ol>

      {list.map((s, idx) => {
        if (s.id === "hero") return <Hero key={s.id} d={c.hero} next={next} />;
        if (!RENDER[s.id]) return null;
        const head = (title, kicker) => <Head n={idx + 1} total={list.length} kicker={kicker || s.label} title={title} />;
        return (
          <section key={s.id} id={"home-" + s.id} data-id={s.id} className={`sec sec-${s.id} s-${theme(s.id)}`}>
            <div className="grain" />
            <div className="wrap">{RENDER[s.id](undefined, head)}</div>
          </section>
        );
      })}
    </div>
  );
}

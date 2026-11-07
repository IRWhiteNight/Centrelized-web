import "../../../css/COE-UAS-css/coe-engagement.css";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Head, Link } from "@inertiajs/react";
import { PAGE, SCENES, CONTENT, SHOW_SAMPLE_BADGE } from "../../Components/COEUAS-Components/engagementContent";

/* ════════════════════════════════════════════════════════════════
   ENGAGEMENT PAGE  —  full-screen "scenes" instead of a long scroll.
   • All text/data lives in engagementContent.js
   • Each scene has its own arrival transition (see TRANSITIONS)
   • Navigate: wheel · touch swipe · ← → ↑ ↓ · PageUp/Down · Home/End · pager
   ════════════════════════════════════════════════════════════════ */

const EASE = [0.76, 0, 0.24, 1];
const OUT = [0.2, 0.8, 0.2, 1];
const LOCK_MS = 1100; // input lock while a transition plays
const pad = (n) => String(n).padStart(2, "0");
const reduced = () =>
  typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

const NavCtx = createContext({ go: () => {}, next: () => {}, restart: () => {}, lockNav: () => {} });

/* ─────────────── SCENE ARRIVAL TRANSITIONS ───────────────
   enter → starting state · center → resting state · exit → leaving state
   `d` = direction (1 forward, -1 backward)                          */
const TRANSITIONS = {
  fade: {
    enter: { opacity: 0 },
    center: { opacity: 1, transition: { duration: 0.9 } },
    exit: { opacity: 0, transition: { duration: 0.5 } },
  },
  iris: {
    enter: { clipPath: "circle(0% at 50% 55%)" },
    center: { clipPath: "circle(145% at 50% 55%)", transition: { duration: 1.1, ease: EASE } },
    exit: { opacity: 0, scale: 0.94, filter: "blur(10px)", transition: { duration: 0.7 } },
  },
  curtain: {
    enter: { clipPath: "inset(0% 50% 0% 50%)" },
    center: { clipPath: "inset(0% 0% 0% 0%)", transition: { duration: 1, ease: EASE } },
    exit: { opacity: 0, scale: 1.06, filter: "brightness(2.2)", transition: { duration: 0.6 } },
  },
  flip: {
    enter: (d) => ({ opacity: 0, rotateY: 70 * d, x: 140 * d, transformPerspective: 1600 }),
    center: { opacity: 1, rotateY: 0, x: 0, transformPerspective: 1600, transition: { duration: 1, ease: OUT } },
    exit: (d) => ({ opacity: 0, rotateY: -70 * d, x: -140 * d, transformPerspective: 1600, transition: { duration: 0.7 } }),
  },
  slice: {
    enter: (d) => ({
      clipPath: d > 0
        ? "polygon(0% 0%, 0% 0%, -25% 100%, -25% 100%)"
        : "polygon(100% 0%, 100% 0%, 125% 100%, 125% 100%)",
    }),
    center: (d) => ({
      clipPath: d > 0
        ? "polygon(0% 0%, 125% 0%, 100% 100%, -25% 100%)"
        : "polygon(100% 0%, -25% 0%, 0% 100%, 125% 100%)",
      transition: { duration: 1, ease: EASE },
    }),
    exit: (d) => ({ opacity: 0, x: -70 * d, transition: { duration: 0.6 } }),
  },
  zoom: {
    enter: { opacity: 0, scale: 1.5, filter: "blur(16px)" },
    center: { opacity: 1, scale: 1, filter: "blur(0px)", transition: { duration: 1, ease: OUT } },
    exit: { opacity: 0, scale: 0.6, filter: "blur(16px)", transition: { duration: 0.6 } },
  },
  rise: {
    enter: (d) => ({ y: d > 0 ? "100%" : "-100%" }),
    center: { y: "0%", transition: { duration: 1, ease: EASE } },
    exit: (d) => ({ opacity: 0, scale: 0.95, y: d > 0 ? "-18%" : "18%", transition: { duration: 0.8 } }),
  },
};

/* shared entrance variants for content inside a scene */
const stagger = (delay = 0.5, gap = 0.08) => ({ hidden: {}, show: { transition: { delayChildren: delay, staggerChildren: gap } } });
const rise = { hidden: { opacity: 0, y: 36, filter: "blur(8px)" }, show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.8, ease: OUT } } };
const pop = { hidden: { opacity: 0, scale: 0.6 }, show: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 170, damping: 16 } } };

function Body({ children, className = "", delay = 0.5 }) {
  return (
    <motion.div className={`eg-body ${className}`} variants={stagger(delay)} initial="hidden" animate="show">
      {children}
    </motion.div>
  );
}

/* ═══════════════ SMALL BUILDING BLOCKS ═══════════════ */

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
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  up: <path d="M6 15l6-6 6 6" />,
  down: <path d="M6 9l6 6 6-6" />,
  play: <path d="M8 5v14l11-7z" />,
  cam: <><path d="M4 8h3l2-3h6l2 3h3v11H4z" /><circle cx="12" cy="13" r="3.5" /></>,
  news: <><path d="M5 4h12v16H7a2 2 0 0 1-2-2z" /><path d="M17 8h3v10a2 2 0 0 1-2 2M8 8h6M8 12h6M8 16h4" /></>,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  external: <path d="M14 4h6v6M20 4l-9 9M18 14v6H4V6h6" />,
};

function Icon({ name, size = 22 }) {
  return (
    <svg className="eg-icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {ICONS[name] ?? ICONS.star}
    </svg>
  );
}

function SmartLink({ href, children, ...rest }) {
  if (!href) return <span {...rest}>{children}</span>;
  if (/^(https?:|mailto:)|\.pdf$/i.test(href))
    return <a href={href} target="_blank" rel="noreferrer" {...rest}>{children}</a>;
  return <Link href={href} {...rest}>{children}</Link>;
}

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<>/[]{}=+*#";
const scramble = (t) => t.replace(/\S/g, () => GLYPHS[(Math.random() * GLYPHS.length) | 0]);

/* text that "decrypts" into place */
function ScrambleText({ text, delay = 0, duration = 1000, as: Tag = "span", className = "" }) {
  const [out, setOut] = useState(() => (reduced() ? text : scramble(text)));
  useEffect(() => {
    if (reduced()) { setOut(text); return; }
    let raf, t0;
    const id = setTimeout(() => {
      const step = (t) => {
        t0 = t0 ?? t;
        const p = Math.min((t - t0) / duration, 1);
        const keep = Math.floor(p * text.length);
        setOut(text.split("").map((c, i) => (c === " " || i < keep ? c : GLYPHS[(Math.random() * GLYPHS.length) | 0])).join(""));
        if (p < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    }, delay);
    return () => { clearTimeout(id); cancelAnimationFrame(raf); };
  }, [text, delay, duration]);
  return <Tag className={className} aria-label={text}>{out}</Tag>;
}

function CountUp({ to, suffix = "", duration = 1600, delay = 800 }) {
  const isNum = typeof to === "number";
  const [v, setV] = useState(isNum ? 0 : to);
  useEffect(() => {
    if (!isNum) return;
    if (reduced()) { setV(to); return; }
    let raf;
    const id = setTimeout(() => {
      const t0 = performance.now();
      const step = (t) => {
        const p = Math.min((t - t0) / duration, 1);
        setV(Math.round(to * (1 - Math.pow(1 - p, 3))));
        if (p < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    }, delay);
    return () => { clearTimeout(id); cancelAnimationFrame(raf); };
  }, [to, isNum, duration, delay]);
  return <>{isNum ? pad(v) : v}{suffix}</>;
}

/* 3D tilt + moving glare (pure CSS vars) */
function Tilt({ children, className = "", max = 10, ...rest }) {
  const ref = useRef(null);
  const move = (e) => {
    const el = ref.current; if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
    el.style.setProperty("--rx", `${(0.5 - py) * max}deg`);
    el.style.setProperty("--ry", `${(px - 0.5) * max}deg`);
    el.style.setProperty("--mx", `${px * 100}%`);
    el.style.setProperty("--my", `${py * 100}%`);
  };
  const leave = () => { const el = ref.current; if (el) { el.style.setProperty("--rx", "0deg"); el.style.setProperty("--ry", "0deg"); } };
  return <div ref={ref} className={`eg-tilt ${className}`} onMouseMove={move} onMouseLeave={leave} {...rest}>{children}</div>;
}

function SampleBadge({ show }) {
  return SHOW_SAMPLE_BADGE && show ? <em className="eg-sample">Sample</em> : null;
}

/* ═══════════════ LIVING BACKDROP (canvas network) ═══════════════ */
function Backdrop({ index }) {
  const ref = useRef(null);
  const idx = useRef(index);
  idx.current = index;

  useEffect(() => {
    const c = ref.current;
    const ctx = c?.getContext?.("2d");
    if (!ctx) return;
    const still = reduced();
    let w = 0, h = 0, raf = 0, pts = [];
    const mouse = { x: -999, y: -999 };
    const hub = { x: 0.5, y: 0.5 };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = c.clientWidth; h = c.clientHeight;
      c.width = w * dpr; c.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round(Math.min(100, (w * h) / 15000));
      pts = Array.from({ length: n }, () => ({
        x: Math.random() * w, y: Math.random() * h, vx: 0, vy: 0,
        bx: (Math.random() - 0.5) * 0.28, by: (Math.random() - 0.5) * 0.28, r: Math.random() * 1.5 + 0.7,
      }));
    };
    const onMove = (e) => { mouse.x = e.clientX; mouse.y = e.clientY; };

    const frame = () => {
      ctx.clearRect(0, 0, w, h);
      const i = idx.current;
      hub.x += (0.5 + Math.cos(i * 1.7) * 0.28 - hub.x) * 0.03;
      hub.y += (0.5 + Math.sin(i * 1.3) * 0.22 - hub.y) * 0.03;
      const hx = hub.x * w, hy = hub.y * h;
      const g = ctx.createRadialGradient(hx, hy, 0, hx, hy, Math.max(w, h) * 0.55);
      g.addColorStop(0, "rgba(30,110,255,.24)"); g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);

      for (const p of pts) {
        p.vx += (hx - p.x) * 0.000012; p.vy += (hy - p.y) * 0.000012;
        const dx = p.x - mouse.x, dy = p.y - mouse.y, d2 = dx * dx + dy * dy;
        if (d2 < 14400) { const f = (1 - Math.sqrt(d2) / 120) * 0.012; p.vx += dx * f; p.vy += dy * f; }
        p.vx *= 0.96; p.vy *= 0.96;
        if (!still) { p.x += p.vx + p.bx; p.y += p.vy + p.by; }
        if (p.x < -10) p.x = w + 10; else if (p.x > w + 10) p.x = -10;
        if (p.y < -10) p.y = h + 10; else if (p.y > h + 10) p.y = -10;
      }
      for (let a = 0; a < pts.length; a++) {
        for (let b = a + 1; b < pts.length; b++) {
          const dx = pts[a].x - pts[b].x, dy = pts[a].y - pts[b].y, d = Math.hypot(dx, dy);
          if (d < 130) {
            ctx.strokeStyle = `rgba(70,170,255,${(1 - d / 130) * 0.32})`;
            ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(pts[a].x, pts[a].y); ctx.lineTo(pts[b].x, pts[b].y); ctx.stroke();
          }
        }
      }
      ctx.fillStyle = "rgba(130,215,255,.85)";
      for (const p of pts) { ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fill(); }
      if (!still) raf = requestAnimationFrame(frame);
    };

    resize(); frame();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onMove);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); window.removeEventListener("pointermove", onMove); };
  }, []);

  return <canvas ref={ref} className="eg-canvas" aria-hidden="true" />;
}

/* ═══════════════ SCENE 0 · WELCOME ═══════════════ */
function Hero({ data }) {
  const { next } = useContext(NavCtx);
  const [w, setW] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setW((v) => (v + 1) % data.words.length), 2400);
    return () => clearInterval(id);
  }, [data.words.length]);

  return (
    <>
      <div className="eg-rings" aria-hidden="true"><i /><i /><i /><i /><b /><b /><b /></div>
      <Body className="eg-hero" delay={0.35}>
        <motion.p variants={rise} className="eg-eyebrow">{data.eyebrow}</motion.p>
        <motion.h1 variants={rise} className="eg-hero-title">
          <ScrambleText text={data.title} delay={450} duration={1300} />
        </motion.h1>
        <motion.div variants={rise} className="eg-rotator">
          <span>{data.rotatorLead}</span>
          <span className="eg-rotator-word">
            <AnimatePresence mode="wait">
              <motion.b key={w} initial={{ y: "100%", opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                exit={{ y: "-100%", opacity: 0 }} transition={{ duration: 0.45, ease: OUT }}>
                {data.words[w]}
              </motion.b>
            </AnimatePresence>
          </span>
        </motion.div>
        <motion.p variants={rise} className="eg-lead">{data.description}</motion.p>
        <motion.div variants={rise} className="eg-stats">
          {data.stats.map((s) => (
            <div className="eg-stat" key={s.label}>
              <strong><CountUp to={s.value} suffix={s.suffix} /></strong>
              <span>{s.label}</span>
            </div>
          ))}
        </motion.div>
        <motion.button variants={rise} className="eg-cta" onClick={next}>
          <span>{data.cta}</span><Icon name="arrow" />
        </motion.button>
      </Body>
    </>
  );
}

/* ═══════════════ SCENE 1 · NETWORKING (orbit) ═══════════════ */
function Network({ data }) {
  const [active, setActive] = useState(0);
  const [hold, setHold] = useState(false);
  const n = data.groups.length;
  useEffect(() => {
    if (hold) return;
    const id = setInterval(() => setActive((a) => (a + 1) % n), 5000);
    return () => clearInterval(id);
  }, [hold, n]);

  const g = data.groups[active];
  const pos = data.groups.map((_, i) => {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2;
    return { x: 50 + 38 * Math.cos(a), y: 50 + 38 * Math.sin(a) };
  });

  return (
    <Body className="eg-split eg-network" delay={0.45}>
      <div className="eg-col">
        <motion.p className="eg-eyebrow" variants={rise}>{data.eyebrow}</motion.p>
        <motion.h2 className="eg-title" variants={rise}>{data.title}</motion.h2>
        <motion.p className="eg-lead" variants={rise}>{data.description}</motion.p>
        <motion.div variants={rise} className="eg-panel" style={{ "--accent": g.accent }}>
          <AnimatePresence mode="wait">
            <motion.div key={g.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }} transition={{ duration: 0.35 }}>
              <header><Icon name={g.icon} /><h3>{g.label}</h3></header>
              <p>{g.blurb}</p>
              <ul className="eg-chips">
                {g.items.map((it) => (
                  <li key={it.name} className={it.placeholder ? "is-placeholder" : ""}>
                    <b>{it.name}</b>{it.note && <small>{it.note}</small>}
                  </li>
                ))}
              </ul>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>

      <motion.div className="eg-orbit" variants={pop} onMouseEnter={() => setHold(true)} onMouseLeave={() => setHold(false)}>
        <svg viewBox="0 0 100 100" aria-hidden="true">
          <circle className="eg-ring eg-ring-a" cx="50" cy="50" r="38" />
          <circle className="eg-ring eg-ring-b" cx="50" cy="50" r="26" />
          <circle className="eg-ring eg-ring-c" cx="50" cy="50" r="47" />
          {pos.map((p, i) => (
            <g key={i}>
              <motion.line x1="50" y1="50" x2={p.x} y2={p.y} stroke={data.groups[i].accent}
                strokeWidth={i === active ? 0.7 : 0.3} strokeOpacity={i === active ? 1 : 0.55}
                initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.9 + i * 0.12, duration: 0.9 }} />
              <circle r="0.9" fill={data.groups[i].accent}>
                <animateMotion dur={`${3 + i * 0.45}s`} repeatCount="indefinite" path={`M50,50 L${p.x},${p.y}`} />
              </circle>
            </g>
          ))}
        </svg>
        <div className="eg-core"><span>{data.centerLabel}</span></div>
        {data.groups.map((gr, i) => (
          <button key={gr.id} className={`eg-node ${i === active ? "is-on" : ""}`}
            style={{ left: `${pos[i].x}%`, top: `${pos[i].y}%`, "--accent": gr.accent }}
            onClick={() => { setActive(i); setHold(true); }} onMouseEnter={() => setActive(i)}>
            <Icon name={gr.icon} size={24} /><span>{gr.short}</span>
          </button>
        ))}
      </motion.div>
    </Body>
  );
}

/* ═══════════════ SCENE 2 · ECOSYSTEM (pillars) ═══════════════ */
function Ecosystem({ data }) {
  const hl = new Set(data.highlight);
  let k = 0;
  return (
    <Body className="eg-ecosystem" delay={0.4}>
      <motion.p className="eg-eyebrow" variants={rise}>{data.eyebrow}</motion.p>
      <h2 className="eg-quote" aria-label={data.quote.join(" ")}>
        {data.quote.map((line, li) => (
          <span className="eg-quote-line" key={li}>
            {line.split(" ").map((word) => (
              <motion.span key={k} className={hl.has(word) ? "is-hl" : ""} variants={rise} custom={k++}>{word}&nbsp;</motion.span>
            ))}
          </span>
        ))}
      </h2>

      <div className="eg-pillars">
        {data.pillars.map((p, i) => (
          <motion.article key={p.role} className="eg-pillar" style={{ "--accent": p.accent, "--lift": `${[0, 22, 44, 22, 0][i % 5]}px` }}
            variants={{ hidden: { clipPath: "inset(100% 0 0 0)", opacity: 0 }, show: { clipPath: "inset(0% 0 0 0)", opacity: 1, transition: { duration: 0.9, ease: OUT } } }}>
            <span className="eg-pillar-no">{pad(i + 1)}</span>
            <Icon name={p.icon} size={30} />
            <h3>{p.role}</h3>
            <small>{p.tag}</small>
            <p>{p.text}</p>
          </motion.article>
        ))}
      </div>
      <motion.div variants={rise} className="eg-hub"><span>{data.centerLabel}</span></motion.div>

      <motion.div variants={rise} className="eg-marquee" aria-hidden="true">
        <div className="eg-marquee-track">
          {[...data.together, ...data.together, ...data.together].map((t, i) => <span key={i}>{t}<i /></span>)}
        </div>
      </motion.div>
    </Body>
  );
}

/* ═══════════════ SCENE 3 · MEMBERSHIP (3D cards) ═══════════════ */
function Membership({ data }) {
  return (
    <>
      <div className="eg-ghost-word" aria-hidden="true">{data.ghost}</div>
      <Body className="eg-membership" delay={0.45}>
        <motion.p className="eg-eyebrow" variants={rise}>{data.eyebrow}</motion.p>
        <motion.h2 className="eg-title" variants={rise}>{data.title}</motion.h2>
        <motion.p className="eg-lead" variants={rise}>{data.description}</motion.p>
        <div className="eg-cards">
          {data.cards.map((c) => (
            <motion.div key={c.title} variants={{ hidden: { opacity: 0, rotateY: -55, y: 70 }, show: { opacity: 1, rotateY: 0, y: 0, transition: { duration: 0.9, ease: OUT } } }}>
              <Tilt className="eg-card" style={{ "--accent": c.accent }}>
                <div className="eg-card-ic"><Icon name={c.icon} size={28} /></div>
                {c.badge && <span className="eg-badge">{c.badge}</span>}
                <h3>{c.title}</h3>
                <p>{c.text}</p>
                <ul>
                  {c.items.map((it) => (
                    <li key={it.text} className={it.placeholder ? "is-placeholder" : ""}>{it.text}</li>
                  ))}
                </ul>
                {c.link && <SmartLink href={c.link.href} className="eg-link">{c.link.label}<Icon name="arrow" size={18} /></SmartLink>}
              </Tilt>
            </motion.div>
          ))}
        </div>
      </Body>
    </>
  );
}

/* ═══════════════ SCENE 4 · NEWS ═══════════════ */
function News({ data }) {
  const [cat, setCat] = useState("all");
  const [sel, setSel] = useState(null);
  const list = data.items.filter((i) => cat === "all" || i.category === cat);
  const cur = list.find((i) => i.id === sel) ?? list[0];
  const accentOf = (id) => data.categories.find((c) => c.id === id)?.accent ?? "#3fe0ff";
  const labelOf = (id) => data.categories.find((c) => c.id === id)?.label ?? id;

  return (
    <Body className="eg-news" delay={0.45}>
      <motion.p className="eg-eyebrow" variants={rise}>{data.eyebrow}</motion.p>
      <motion.h2 className="eg-title" variants={rise}>{data.title}</motion.h2>
      <motion.div className="eg-filters" variants={rise}>
        {[{ id: "all", label: "All", accent: "#3fe0ff" }, ...data.categories].map((c) => (
          <button key={c.id} className={cat === c.id ? "is-on" : ""} style={{ "--accent": c.accent }}
            onClick={() => { setCat(c.id); setSel(null); }}>{c.label}</button>
        ))}
      </motion.div>

      <div className="eg-news-grid">
        <motion.div variants={rise} className="eg-feature-wrap">
          <AnimatePresence mode="wait">
            {cur ? (
              <motion.article key={cur.id} className="eg-feature" style={{ "--accent": accentOf(cur.category) }}
                initial={{ opacity: 0, x: 40, rotateY: 12 }} animate={{ opacity: 1, x: 0, rotateY: 0 }}
                exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.45, ease: OUT }}>
                {cur.image && <img src={cur.image} alt="" />}
                <div className="eg-feature-top">
                  <span className="eg-tag">{labelOf(cur.category)}</span>
                  <time>{cur.date}</time>
                  <SampleBadge show={cur.sample} />
                </div>
                <h3>{cur.title}</h3>
                <p>{cur.summary}</p>
                {cur.href && <SmartLink href={cur.href} className="eg-link">Read more<Icon name="arrow" size={18} /></SmartLink>}
              </motion.article>
            ) : (
              <motion.p key="empty" className="eg-empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>No stories in this category yet.</motion.p>
            )}
          </AnimatePresence>
        </motion.div>

        <motion.ul variants={rise} className="eg-news-list">
          <AnimatePresence mode="popLayout">
            {list.map((it, i) => (
              <motion.li layout key={it.id} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.4, delay: i * 0.04 }}>
                <button className={cur?.id === it.id ? "is-on" : ""} style={{ "--accent": accentOf(it.category) }} onClick={() => setSel(it.id)}>
                  <time>{it.date}</time><b>{it.title}</b>
                </button>
              </motion.li>
            ))}
          </AnimatePresence>
        </motion.ul>
      </div>
    </Body>
  );
}

/* ═══════════════ SCENE 5 · MEDIA ═══════════════ */
function Media({ data }) {
  const { lockNav } = useContext(NavCtx);
  const [tab, setTab] = useState(data.tabs[0].id);
  const [box, setBox] = useState(null);
  const t = data.tabs.find((x) => x.id === tab);

  useEffect(() => {
    lockNav(!!box);
    if (!box) return;
    const onKey = (e) => e.key === "Escape" && setBox(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [box, lockNav]);
  useEffect(() => () => lockNav(false), [lockNav]);

  return (
    <Body className="eg-media" delay={0.45}>
      <motion.p className="eg-eyebrow" variants={rise}>{data.eyebrow}</motion.p>
      <motion.h2 className="eg-title" variants={rise}>{data.title}</motion.h2>
      <motion.p className="eg-lead" variants={rise}>{data.description}</motion.p>
      <motion.div className="eg-tabs" variants={rise}>
        {data.tabs.map((x) => (
          <button key={x.id} className={x.id === tab ? "is-on" : ""} onClick={() => setTab(x.id)}>{x.label}</button>
        ))}
      </motion.div>

      <motion.div variants={rise} className="eg-media-stage">
        <AnimatePresence mode="wait">
          <motion.div key={t.id} className={`eg-media-${t.kind}`} initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.04 }} transition={{ duration: 0.35 }}>
            {t.kind === "gallery" && t.items.map((it, i) => (
              <motion.button key={it.id} className={`eg-tile ${it.size || ""}`} style={{ "--h": 205 + i * 13 }}
                initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                onClick={() => setBox(it)} aria-label={it.title}>
                {it.src ? <img src={it.src} alt={it.title} loading="lazy" /> : <span className="eg-tile-art" />}
                <span className="eg-tile-cap">{it.video !== undefined && <Icon name="play" size={16} />}{it.title}</span>
              </motion.button>
            ))}
            {t.kind === "press" && t.items.map((it, i) => (
              <motion.div key={it.id} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
                <Tilt className="eg-press" max={6}>
                  <Icon name="news" size={26} />
                  <small>{it.outlet} · {it.date}</small>
                  <h3>{it.title}</h3>
                  <SampleBadge show={it.sample} />
                  {it.href && <SmartLink href={it.href} className="eg-link">Read article<Icon name="external" size={16} /></SmartLink>}
                </Tilt>
              </motion.div>
            ))}
            {t.kind === "docs" && t.items.map((it, i) => (
              <motion.div key={it.id} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
                <Tilt className="eg-doc" max={6}>
                  <span className="eg-doc-type">{it.type}</span>
                  <h3>{it.title}</h3>
                  <p>{it.note}</p>
                  {it.href ? <SmartLink href={it.href} className="eg-link">Open<Icon name="external" size={16} /></SmartLink>
                    : <em className="eg-soon">Link coming soon</em>}
                </Tilt>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      </motion.div>

      <AnimatePresence>
        {box && (
          <motion.div className="eg-lightbox" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setBox(null)}>
            <motion.figure initial={{ scale: 0.8, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9 }} onClick={(e) => e.stopPropagation()}>
              {box.video ? <video src={box.video} controls autoPlay />
                : box.src ? <img src={box.src} alt={box.title} />
                : <div className="eg-tile-art big" style={{ "--h": 220 }} />}
              <figcaption>{box.title}</figcaption>
              <button className="eg-x" onClick={() => setBox(null)} aria-label="Close"><Icon name="close" /></button>
            </motion.figure>
          </motion.div>
        )}
      </AnimatePresence>
    </Body>
  );
}

/* ═══════════════ SCENE 6 · COLLABORATE ═══════════════ */
function Collaborate({ data }) {
  const { restart } = useContext(NavCtx);
  return (
    <>
      <div className="eg-pulse" aria-hidden="true"><i /><i /><i /></div>
      <Body className="eg-collab" delay={0.5}>
        <motion.p className="eg-eyebrow" variants={rise}>{data.eyebrow}</motion.p>
        <motion.h2 variants={rise} className="eg-hero-title eg-collab-title">
          <ScrambleText text={data.title} delay={700} duration={1200} />
        </motion.h2>
        <motion.p className="eg-lead" variants={rise}>{data.description}</motion.p>
        <div className="eg-channels">
          {data.channels.map((c) => (
            <motion.div key={c.title} variants={pop}>
              <Tilt className="eg-channel-wrap" max={8}>
                <SmartLink href={c.href} className="eg-channel" style={{ "--accent": c.accent }}>
                  <Icon name={c.icon} size={30} />
                  <h3>{c.title}</h3>
                  <p>{c.text}</p>
                  <span className="eg-link">Enquire<Icon name="arrow" size={18} /></span>
                </SmartLink>
              </Tilt>
            </motion.div>
          ))}
        </div>
        <motion.div variants={rise} className="eg-actions">
          <SmartLink href={data.primary.href} className="eg-cta eg-cta-big"><span>{data.primary.label}</span><Icon name="arrow" /></SmartLink>
          <button className="eg-ghost-btn" onClick={restart}>{data.restart}</button>
        </motion.div>
        <motion.p variants={rise} className="eg-foot">{data.footer}</motion.p>
      </Body>
    </>
  );
}

const VIEWS = { hero: Hero, network: Network, ecosystem: Ecosystem, membership: Membership, news: News, media: Media, collaborate: Collaborate };

/* ═══════════════ PAGE / SCENE ENGINE ═══════════════ */
const N = SCENES.length;
const clamp = (v) => Math.max(0, Math.min(N - 1, v));

function canScrollInner(target, root, dy) {
  for (let el = target; el && el !== root; el = el.parentElement) {
    if (el.scrollHeight > el.clientHeight + 2 && /(auto|scroll)/.test(getComputedStyle(el).overflowY)) {
      if (dy > 0 && el.scrollTop + el.clientHeight < el.scrollHeight - 2) return true;
      if (dy < 0 && el.scrollTop > 2) return true;
    }
  }
  return false;
}

export default function Engagement() {
  const [index, setIndex] = useState(() => {
    if (typeof window === "undefined") return 0;
    const i = SCENES.findIndex((s) => `#${s.id}` === window.location.hash);
    return i < 0 ? 0 : i;
  });
  const [dir, setDir] = useState(1);
  const idxRef = useRef(index);
  const busy = useRef(false);
  const navLocked = useRef(false);
  const rootRef = useRef(null);
  const first = useRef(true);

  const go = useCallback((to) => {
    if (busy.current || navLocked.current) return;
    const t = clamp(to);
    if (t === idxRef.current) return;
    busy.current = true;
    setDir(t > idxRef.current ? 1 : -1);
    idxRef.current = t;
    setIndex(t);
    setTimeout(() => { busy.current = false; }, LOCK_MS);
  }, []);
  const next = useCallback(() => go(idxRef.current + 1), [go]);
  const restart = useCallback(() => go(0), [go]);
  const lockNav = useCallback((v) => { navLocked.current = v; }, []);

  /* lock page scroll while this page is mounted */
  useEffect(() => {
    document.documentElement.classList.add("eg-lock");
    return () => document.documentElement.classList.remove("eg-lock");
  }, []);

  /* keep #hash in sync (preserves Inertia's history state) */
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    window.history.replaceState(window.history.state, "", `#${SCENES[index].id}`);
  }, [index]);

  /* wheel · keyboard · touch */
  useEffect(() => {
    const root = rootRef.current;
    let acc = 0, accT = 0, touch = null;

    const onWheel = (e) => {
      if (navLocked.current) return;
      if (canScrollInner(e.target, root, e.deltaY)) return; // let tall content scroll natively
      e.preventDefault();
      const now = performance.now();
      if (now - accT > 220) acc = 0;
      accT = now; acc += e.deltaY;
      if (Math.abs(acc) > 45) { go(idxRef.current + (acc > 0 ? 1 : -1)); acc = 0; }
    };
    const onKey = (e) => {
      if (navLocked.current || e.target.closest?.("input,textarea,select")) return;
      const k = e.key;
      if (["ArrowDown", "ArrowRight", "PageDown", " "].includes(k)) { e.preventDefault(); go(idxRef.current + 1); }
      else if (["ArrowUp", "ArrowLeft", "PageUp"].includes(k)) { e.preventDefault(); go(idxRef.current - 1); }
      else if (k === "Home") go(0);
      else if (k === "End") go(N - 1);
    };
    const scroller = (t) => t.closest?.(".eg-scene-inner");
    const onTouchStart = (e) => {
      const t = e.touches[0], s = scroller(e.target);
      touch = { y: t.clientY, x: t.clientX, s, top: s ? s.scrollTop : 0 };
    };
    const onTouchEnd = (e) => {
      if (!touch || navLocked.current) return;
      const t = e.changedTouches[0], dy = touch.y - t.clientY, dx = touch.x - t.clientX, s = touch.s;
      const moved = s && Math.abs(s.scrollTop - touch.top) > 2;
      touch = null;
      if (moved || Math.abs(dy) < 60 || Math.abs(dy) < Math.abs(dx)) return;
      if (s && s.scrollHeight > s.clientHeight + 2) {
        if (dy > 0 && s.scrollTop + s.clientHeight < s.scrollHeight - 2) return;
        if (dy < 0 && s.scrollTop > 2) return;
      }
      go(idxRef.current + (dy > 0 ? 1 : -1));
    };
    const onMove = (e) => {
      root.style.setProperty("--cx", `${e.clientX}px`);
      root.style.setProperty("--cy", `${e.clientY}px`);
    };

    root.addEventListener("wheel", onWheel, { passive: false });
    root.addEventListener("touchstart", onTouchStart, { passive: true });
    root.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointermove", onMove);
    return () => {
      root.removeEventListener("wheel", onWheel);
      root.removeEventListener("touchstart", onTouchStart);
      root.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointermove", onMove);
    };
  }, [go]);

  const scene = SCENES[index];
  const View = VIEWS[scene.id];
  const variants = TRANSITIONS[scene.transition] ?? TRANSITIONS.fade;
  const sweepFrom = dir > 0 ? "-110%" : "110%";
  const sweepTo = dir > 0 ? "110%" : "-110%";

  return (
    <NavCtx.Provider value={{ go, next, restart, lockNav }}>
      <div className="eg-root" ref={rootRef}>
        <Head title={PAGE.title} />
        <Backdrop index={index} />
        <div className="eg-floor" aria-hidden="true" />
        <div className="eg-aurora" aria-hidden="true"><i /><i /><i /></div>
        <div className="eg-spot" aria-hidden="true" />
        <div className="eg-scan" aria-hidden="true" />
        <div className="eg-vignette" aria-hidden="true" />

        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={index} className="eg-ghost" initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -60 }} transition={{ duration: 0.6, ease: OUT }} aria-hidden="true">{pad(index + 1)}</motion.div>
        </AnimatePresence>

        <AnimatePresence custom={dir}>
          <motion.section key={scene.id} className="eg-scene" custom={dir} variants={variants}
            initial="enter" animate="center" exit="exit" aria-label={scene.label}>
            <div className="eg-scene-inner"><View data={CONTENT[scene.id]} /></div>
          </motion.section>
        </AnimatePresence>

        <motion.div key={`sweep-${index}`} className="eg-sweep" aria-hidden="true"
          initial={{ x: sweepFrom, opacity: first.current ? 0 : 1 }} animate={{ x: sweepTo, opacity: 1 }}
          transition={{ duration: 1.05, ease: EASE }} />

        <p className="eg-hint">{PAGE.hint}</p>
        <nav className="eg-pager" aria-label="Scenes">
          <button onClick={() => go(index - 1)} disabled={index === 0} aria-label="Previous scene"><Icon name="up" size={18} /></button>
          <ol>
            {SCENES.map((s, i) => (
              <li key={s.id}>
                <button className={i === index ? "is-on" : i < index ? "is-done" : ""} onClick={() => go(i)} aria-label={s.label} aria-current={i === index}>
                  <span className="eg-seg-label">{s.label}</span>
                </button>
              </li>
            ))}
          </ol>
          <button onClick={() => go(index + 1)} disabled={index === N - 1} aria-label="Next scene"><Icon name="down" size={18} /></button>
        </nav>
        <div className="eg-counter" aria-hidden="true">
          <AnimatePresence mode="wait">
            <motion.span key={index} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
              <b>{pad(index + 1)}</b> / {pad(N)} · {scene.label}
            </motion.span>
          </AnimatePresence>
        </div>
      </div>
    </NavCtx.Provider>
  );
}

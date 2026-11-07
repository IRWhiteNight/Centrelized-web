import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "@inertiajs/react";
import "../../../css/COE-UAS-css/facilities.css";

/* Same idea as siteMapCOEUAS.js: the COE-UAS site lives under /coeuas.
   If you prefer, replace this with: import { u } from "./siteMapCOEUAS"; */
const u = (path = "/") => "/coeuas" + (path === "/" ? "" : path);

/* All class names here start with "fac-" on purpose: Inertia keeps the CSS of pages you
   visited earlier (home.css, about.css ...) loaded, and their generic names such as
   .slide, .rv, .btn, .stats or .cta would otherwise leak into this page. */

/* ------------------------------------------------------------------
   CONTENT: everything an admin would edit. Structure follows the
   Facilities & Services branch of the COE-UAS site map.
   TODO: replace the short descriptions with verified details.
------------------------------------------------------------------- */
const SLIDES = [
  { id: "intro", label: "Overview" },
  { id: "facilities", label: "Facilities & equipment" },
  { id: "sandbox", label: "Airspace Sandbox" },
  { id: "services", label: "Technical services" },
  { id: "solutions", label: "Industry solutions" },
  { id: "training", label: "Training" },
  { id: "enquire", label: "Enquire" },
];

const FACILITIES = [
  { title: "Laboratories and workshops", text: "Benches and tooling for building, tuning and repairing unmanned aircraft and their electronics." },
  { title: "Aircraft and research platforms", text: "Fixed-wing, multirotor and hybrid airframes developed and flown by the Centre." },
  { title: "Testing sites and flight facilities", text: "Runways, test ranges and controlled airspace where systems are proven in real conditions." },
  { title: "Facility development and upgrade projects", text: "New buildings, runway upgrades and equipment programmes that extend what the Centre can test." },
];

const SANDBOX_PARTS = ["Vertiport", "Test flight corridor", "Drone hub", "Research and maintenance facility", "Flight simulator", "Radar, communication and UTM system"];

const SERVICES = [
  { title: "Design, manufacturing and assembly", text: "From concept airframe to a flying prototype." },
  { title: "Systems integration and testing", text: "Payloads, autopilots and links joined up and verified." },
  { title: "Maintenance, repair and upgrading", text: "Keep fleets flying and bring older platforms up to date." },
  { title: "Aerial operations and data processing", text: "We fly the mission, then turn the data into answers." },
];

const SOLUTIONS = [
  "Surveying, mapping and photogrammetry",
  "Stockpile and volumetric measurement",
  "Heritage documentation and inspection",
  "Security, surveillance and monitoring",
  "Cargo and goods transportation",
  "Agriculture, spraying and crop monitoring",
  "Autonomous systems, AI and computer vision",
];

const TRAINING = [
  { title: "Drone operation and technical courses", text: "Hands-on courses for new and experienced operators." },
  { title: "Industry and agency training", text: "Programmes shaped around a team’s own missions." },
  { title: "Community and outreach programmes", text: "Open days and school sessions that bring people closer to the technology." },
  { title: "Training calendar and enquiries", text: "See what is running next and ask about places.", href: u("/facilities/training/calendar") },
];

const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

/* Counts up once its slide becomes active */
function CountUp({ to, run }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!run) return setN(0);
    let raf, start;
    const tick = (t) => {
      start ??= t;
      const p = Math.min((t - start) / 1200, 1);
      setN(Math.round(to * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [run, to]);
  return <>{n}</>;
}

export default function Facilities() {
  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState(1);
  const [wipe, setWipe] = useState(0);
  const [open, setOpen] = useState(0);
  const stageRef = useRef(null);
  const lock = useRef(false);
  const indexRef = useRef(0);
  const touchY = useRef(null);

  const go = useCallback((target) => {
    const next = clamp(target, 0, SLIDES.length - 1);
    if (next === indexRef.current || lock.current) return;
    lock.current = true;
    setDir(next > indexRef.current ? 1 : -1);
    indexRef.current = next;
    setIndex(next);
    setWipe((w) => w + 1);
    setTimeout(() => (lock.current = false), 950);
  }, []);

  /* A slide taller than the screen (small phones) scrolls inside itself first. */
  const canScrollInside = (down) => {
    const el = stageRef.current?.querySelector('[data-state="active"]');
    if (!el || el.scrollHeight <= el.clientHeight + 2) return false;
    return down ? el.scrollTop + el.clientHeight < el.scrollHeight - 2 : el.scrollTop > 2;
  };

  useEffect(() => {
    const stage = stageRef.current;
    const html = document.documentElement;
    const prev = html.style.overflow;
    html.style.overflow = "hidden";

    const onWheel = (e) => {
      if (Math.abs(e.deltaY) < 24) return;
      if (canScrollInside(e.deltaY > 0)) return;
      e.preventDefault();
      go(indexRef.current + (e.deltaY > 0 ? 1 : -1));
    };
    const onKey = (e) => {
      const tag = e.target.tagName;
      if (["INPUT", "TEXTAREA", "SELECT"].includes(tag)) return;
      const k = e.key;
      if (["ArrowDown", "ArrowRight", "PageDown"].includes(k) || (k === " " && !e.shiftKey)) go(indexRef.current + 1);
      else if (["ArrowUp", "ArrowLeft", "PageUp"].includes(k) || (k === " " && e.shiftKey)) go(indexRef.current - 1);
      else if (k === "Home") go(0);
      else if (k === "End") go(SLIDES.length - 1);
      else return;
      e.preventDefault();
    };
    const onTouchStart = (e) => (touchY.current = e.touches[0].clientY);
    const onTouchEnd = (e) => {
      if (touchY.current == null) return;
      const dy = touchY.current - e.changedTouches[0].clientY;
      touchY.current = null;
      if (Math.abs(dy) < 60 || canScrollInside(dy > 0)) return;
      go(indexRef.current + (dy > 0 ? 1 : -1));
    };

    stage.addEventListener("wheel", onWheel, { passive: false });
    stage.addEventListener("touchstart", onTouchStart, { passive: true });
    stage.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("keydown", onKey);
    return () => {
      html.style.overflow = prev;
      stage.removeEventListener("wheel", onWheel);
      stage.removeEventListener("touchstart", onTouchStart);
      stage.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("keydown", onKey);
    };
  }, [go]);

  /* Cursor parallax for the background glow */
  const onMove = (e) => {
    const r = stageRef.current.getBoundingClientRect();
    stageRef.current.style.setProperty("--mx", ((e.clientX - r.left) / r.width - 0.5).toFixed(3));
    stageRef.current.style.setProperty("--my", ((e.clientY - r.top) / r.height - 0.5).toFixed(3));
  };
  const spot = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--x", e.clientX - r.left + "px");
    e.currentTarget.style.setProperty("--y", e.clientY - r.top + "px");
    e.currentTarget.style.setProperty("--rx", (((e.clientY - r.top) / r.height - 0.5) * -8).toFixed(2) + "deg");
    e.currentTarget.style.setProperty("--ry", (((e.clientX - r.left) / r.width - 0.5) * 8).toFixed(2) + "deg");
  };

  const state = (i) => (i === index ? "active" : i < index ? "before" : "after");
  const on = (id) => SLIDES[index].id === id;

  return (
    <main className="fac" ref={stageRef} onPointerMove={onMove} aria-label="Facilities and services">
      {/* background */}
      <div className="fac-bg" aria-hidden="true">
        <span className="fac-grid" />
        <span className="fac-orb fac-orb--a" />
        <span className="fac-orb fac-orb--b" />
        <span className="fac-scan" />
      </div>

      <div className="fac-progress" aria-hidden="true">
        <span style={{ transform: `scaleX(${(index + 1) / SLIDES.length})` }} />
      </div>

      {/* slide counter */}
      <div className="fac-count" aria-live="polite">
        <span key={index} className="fac-count__n">{String(index + 1).padStart(2, "0")}</span>
        <span className="fac-count__t">/ {String(SLIDES.length).padStart(2, "0")}</span>
        <span className="fac-count__label">{SLIDES[index].label}</span>
      </div>

      {/* dot rail */}
      <nav className="fac-rail" aria-label="Sections">
        {SLIDES.map((s, i) => (
          <button key={s.id} className={i === index ? "is-on" : ""} onClick={() => go(i)} aria-label={s.label} aria-current={i === index}>
            <span className="fac-rail__label">{s.label}</span>
            <span className="fac-rail__dot" />
          </button>
        ))}
      </nav>

      {/* curtain that sweeps across on every change */}
      {wipe > 0 && <div key={wipe} className={"fac-wipe " + (dir > 0 ? "is-down" : "is-up")} aria-hidden="true" />}

      {/* ---------- 0. OVERVIEW ---------- */}
      <section className="fac-slide fac-slide--intro" data-state={state(0)} inert={index !== 0 ? "" : undefined}>
        <div className="fac-slide__in">
          <p className="fac-rv" style={{ "--d": 0 }}>Facilities & Services</p>
          <h1 className="fac-title">
            {"Where unmanned flight gets built, tested and proven.".split(" ").map((w, i) => (
              <span key={i} className="fac-word"><span style={{ "--d": i }}>{w}&nbsp;</span></span>
            ))}
          </h1>
          <p className="fac-lead fac-rv" style={{ "--d": 6 }}>Workshops, aircraft, flight sites and people, all in one place, open to industry, agencies and students.</p>
          <ul className="fac-stats fac-rv" style={{ "--d": 8 }}>
            <li><b><CountUp to={FACILITIES.length} run={on("intro")} /></b><span>facility types</span></li>
            <li><b><CountUp to={SERVICES.length} run={on("intro")} /></b><span>technical services</span></li>
            <li><b><CountUp to={SOLUTIONS.length} run={on("intro")} /></b><span>industry solutions</span></li>
            <li><b><CountUp to={TRAINING.length} run={on("intro")} /></b><span>training tracks</span></li>
          </ul>
          <button className="fac-hint fac-rv" style={{ "--d": 10 }} onClick={() => go(1)}>
            <span className="fac-hint__mouse"><i /></span>Scroll, swipe or press the down arrow
          </button>
        </div>
        <svg className="fac-radar" viewBox="0 0 400 400" aria-hidden="true">
          {[60, 110, 160, 195].map((r) => <circle key={r} cx="200" cy="200" r={r} />)}
          <path d="M200 5V395M5 200H395" />
          <g className="fac-radar__sweep"><path d="M200 200 L200 5 A195 195 0 0 1 338 62 Z" /></g>
          <circle className="fac-blip fac-b1" cx="272" cy="120" r="5" />
          <circle className="fac-blip fac-b2" cx="140" cy="250" r="5" />
          <circle className="fac-blip fac-b3" cx="250" cy="290" r="5" />
        </svg>
      </section>

      {/* ---------- 1. FACILITIES & EQUIPMENT ---------- */}
      <section className="fac-slide" data-state={state(1)} inert={index !== 1 ? "" : undefined}>
        <div className="fac-slide__in fac-slide__in--wide">
          <h2 className="fac-rv" style={{ "--d": 0 }}>Facilities and equipment</h2>
          <p className="fac-lead fac-rv" style={{ "--d": 1 }}>Hover or tap a panel to open it.</p>
          <div className="fac-panels fac-rv" style={{ "--d": 2 }}>
            {FACILITIES.map((f, i) => (
              <article key={f.title} className={"fac-panel" + (open === i ? " is-open" : "")} tabIndex={0}
                onMouseEnter={() => setOpen(i)} onFocus={() => setOpen(i)} onClick={() => setOpen(i)}>
                <span className="fac-panel__bar" />
                <h3>{f.title}</h3>
                <p>{f.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- 2. AIRSPACE SANDBOX ---------- */}
      <section className="fac-slide" data-state={state(2)} inert={index !== 2 ? "" : undefined}>
        <div className="fac-slide__in fac-slide__in--split">
          <div>
            <h2 className="fac-rv" style={{ "--d": 0 }}>The Perlis Airspace Sandbox</h2>
            <p className="fac-lead fac-rv" style={{ "--d": 1 }}>A dedicated low-altitude test site at Sungai Batu Pahat, with a functional mock-up aerodrome. Corridors run east to the Timah Tasoh Dam and west over Kuala Perlis towards Langkawi.</p>
            <ul className="fac-chips fac-rv" style={{ "--d": 2 }}>
              {SANDBOX_PARTS.map((p) => <li key={p}>{p}</li>)}
            </ul>
            <Link href={u("/research")} className="fac-btn fac-rv" style={{ "--d": 3 }}>See the programme</Link>
          </div>
          <svg className="fac-map fac-rv" style={{ "--d": 2 }} viewBox="0 0 800 460" role="img" aria-label="Flight corridors from the Sandbox to Timah Tasoh Dam and Langkawi">
            <path id="route-east" className="fac-route" d="M400 330 C470 300 560 260 640 190" />
            <ellipse className="fac-route" cx="670" cy="150" rx="70" ry="42" />
            <path id="route-west" className="fac-route fac-route--w" d="M400 330 C320 360 230 340 170 290 S70 160 110 80" />
            <circle className="fac-pulse" cx="400" cy="330" r="10" />
            <circle className="fac-node" cx="400" cy="330" r="7" />
            <circle className="fac-node" cx="640" cy="190" r="5" />
            <circle className="fac-node" cx="110" cy="80" r="5" />
            <text x="414" y="368">Sandbox, Sungai Batu Pahat</text>
            <text x="590" y="92">Timah Tasoh Dam</text>
            <text x="126" y="72">Langkawi</text>
            <text x="150" y="330">Kuala Perlis</text>
            <circle r="5" className="fac-flyer"><animateMotion dur="7s" repeatCount="indefinite"><mpath href="#route-east" /></animateMotion></circle>
            <circle r="5" className="fac-flyer"><animateMotion dur="9s" repeatCount="indefinite"><mpath href="#route-west" /></animateMotion></circle>
          </svg>
        </div>
      </section>

      {/* ---------- 3. TECHNICAL SERVICES (a real sequence) ---------- */}
      <section className="fac-slide" data-state={state(3)} inert={index !== 3 ? "" : undefined}>
        <div className="fac-slide__in fac-slide__in--wide">
          <h2 className="fac-rv" style={{ "--d": 0 }}>Engineering and technical services</h2>
          <p className="fac-lead fac-rv" style={{ "--d": 1 }}>One project, four hand-offs, one team.</p>
          <ol className="fac-flow">
            {SERVICES.map((s, i) => (
              <li key={s.title} className="fac-rv" style={{ "--d": 2 + i }}>
                <span className="fac-flow__n">{i + 1}</span>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ---------- 4. INDUSTRY SOLUTIONS ---------- */}
      <section className="fac-slide" data-state={state(4)} inert={index !== 4 ? "" : undefined}>
        <div className="fac-slide__in fac-slide__in--wide">
          <h2 className="fac-rv" style={{ "--d": 0 }}>Industry solutions and case studies</h2>
          <div className="fac-tiles">
            {SOLUTIONS.map((s, i) => (
              <Link key={s} href={u("/facilities/solutions")} className="fac-tile fac-rv" style={{ "--d": 1 + i * 0.6 }} onPointerMove={spot}>
                <span>{s}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- 5. TRAINING ---------- */}
      <section className="fac-slide" data-state={state(5)} inert={index !== 5 ? "" : undefined}>
        <div className="fac-slide__in fac-slide__in--split">
          <div>
            <h2 className="fac-rv" style={{ "--d": 0 }}>Training and professional development</h2>
            <p className="fac-lead fac-rv" style={{ "--d": 1 }}>Skilled, certified people are what keep the sky safe.</p>
          </div>
          <ul className="fac-stack">
            {TRAINING.map((t, i) => {
              const body = (<><h3>{t.title}</h3><p>{t.text}</p></>);
              return (
                <li key={t.title} className="fac-rv" style={{ "--d": 1 + i }}>
                  {t.href ? <Link href={t.href}>{body}</Link> : <div>{body}</div>}
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* ---------- 6. ENQUIRE ---------- */}
      <section className="fac-slide fac-slide--end" data-state={state(6)} inert={index !== 6 ? "" : undefined}>
        <div className="fac-slide__in">
          <h2 className="fac-title fac-title--end fac-rv" style={{ "--d": 0 }}>Have a project in mind?</h2>
          <p className="fac-lead fac-rv" style={{ "--d": 1 }}>Tell us what you want to build, test or learn.</p>
          <div className="fac-cta fac-rv" style={{ "--d": 2 }}>
            <Link href={u("/contact")} className="fac-btn">Send a training or services enquiry</Link>
            <button className="fac-btn fac-btn--ghost" onClick={() => go(0)}>Back to the start</button>
          </div>
          <p className="fac-foot fac-rv" style={{ "--d": 3 }}>© 2026 COE-UAS</p>
        </div>
      </section>
    </main>
  );
}

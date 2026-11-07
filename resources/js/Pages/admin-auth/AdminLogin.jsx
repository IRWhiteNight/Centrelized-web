import { useState, useEffect, useRef } from "react";
import { Head } from "@inertiajs/react";
import "../../../css/admin-auth/login.css";

/* ==========================================================================
   ADMIN LOGIN  —  Perlis Airspace Sandbox · Admin CMS
   A drone is perched on top of the sign-in panel (outside it). Typing powers
   it up; a correct password sends it flying across the screen (then you land
   in your workspace); a wrong one keeps it grounded.

   HOW IT TALKS TO LARAVEL
   • POST LOGIN_URL as JSON { email, password, remember } with the XSRF cookie.
   • 2xx  → success. Where to go next, in this order:
              1. JSON { "redirect": "/admin/psb" }  (best: send the role's
                 roles.landing_route from the controller)
              2. the final URL if Laravel redirected
              3. HOME_FALLBACK
   • 422  → wrong details / suspended / disabled. The first message in
            errors.email (or message) is shown.
   • 419  → session expired,  429 → too many attempts.

   PREVIEW WITHOUT A BACKEND
   Render the page with the prop  demo={true}  (e.g.
   Inertia::render('AdminLogin', ['demo' => true])). Then any email works and
   the password is DEMO_PASSWORD below. Remove the prop for real use.
   ========================================================================== */

const LOGIN_URL = "/login";            // your Laravel login POST route
const HOME_FALLBACK = "/super-admin";  // used only if the server gives no destination
const FORGOT_URL = "/forgot-password"; // password reset request page (password_resets)
const BACK_URL = "/";                  // "Back to website"
const DEMO_PASSWORD = "drone123";
const FLIGHT_MS = 2300;                // how long the take-off plays before navigating

/* Left-hand picture panel.
   Put the picture files in  resources/js/images/login/  and write just the file name below.
   (Vite bundles them. A full https:// address also works, and so does a file in
   public/images/login/ as a fallback.)
   Add, remove or reorder slides freely; the dashes follow automatically.            */
const loginImages = import.meta.glob("../../images/login/*.{jpg,jpeg,png,webp}", { eager: true, query: "?url", import: "default" });
const pic = (file) =>
    /^(https?:)?\/\//.test(file) ? file : loginImages[`../../images/login/${file}`] || `/images/login/${file}`;

const SLIDE_MS = 6000;
const SLIDES = [
    { file: "login-aerodrome.jpg", caption: "Where low-altitude airspace gets tested." },
    { file: "login-corridor.jpg",  caption: "Real-world validation, safely managed." },
    { file: "login-perlis.jpg",    caption: "Built in Perlis for Malaysia’s drone future." },
].map((s) => ({ ...s, src: pic(s.file) }));

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* What the status readout says in each phase */
const PHASES = {
    idle:     { chip: "Standby",   text: "Drone on standby. Start typing to power it up." },
    armed:    { chip: "Armed",     text: "Rotors spinning up…" },
    checking: { chip: "Verifying", text: "Checking your clearance…" },
    flying:   { chip: "Cleared",   text: "Clearance granted. Taking off!" },
    denied:   { chip: "Denied",    text: "Clearance denied. The drone stays grounded." },
};

const getXsrf = () => {
    const m = document.cookie.match(/(?:^|; )XSRF-TOKEN=([^;]*)/);
    return m ? decodeURIComponent(m[1]) : "";
};

/* Resolves to { ok:true, dest } or { ok:false, message } */
async function requestLogin({ email, password, remember }, demo) {
    if (demo) {
        await new Promise((r) => setTimeout(r, 900));
        return password === DEMO_PASSWORD
            ? { ok: true, dest: HOME_FALLBACK }
            : { ok: false, message: "These details do not match our records." };
    }
    let res;
    try {
        res = await fetch(LOGIN_URL, {
            method: "POST",
            credentials: "same-origin",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                "X-Requested-With": "XMLHttpRequest",
                "X-XSRF-TOKEN": getXsrf(),
            },
            body: JSON.stringify({ email, password, remember }),
        });
    } catch {
        return { ok: false, message: "Cannot reach the server. Check your connection and try again." };
    }
    if (res.ok) {
        let dest = null;
        try { dest = (await res.clone().json()).redirect || null; } catch { /* not JSON */ }
        if (!dest && res.redirected && !res.url.endsWith(LOGIN_URL)) dest = res.url;
        return { ok: true, dest: dest || HOME_FALLBACK };
    }
    if (res.status === 419) return { ok: false, message: "Your session expired. Refresh the page and try again." };
    if (res.status === 429) return { ok: false, message: "Too many attempts. Please wait a moment and try again." };
    let message = "These details do not match our records.";
    try {
        const j = await res.json();
        message = (j.errors && Object.values(j.errors)[0] && Object.values(j.errors)[0][0]) || j.message || message;
    } catch { /* keep default */ }
    return { ok: false, message };
}

/* ---------------------------------------------------------------- drone -- */
/* One propeller: dark carbon blade with yellow tips, motion-blur disc and hub.
   The blade is "turned" in CSS (scaleX) so it reads as spinning in perspective. */
const Prop = ({ x, y, r }) => (
    <g transform={`translate(${x} ${y})`}>
        <ellipse className="al-blur" rx={r} ry={r * 0.15} fill="url(#ald-disc)" />
        <g className="al-blade">
            <path
                d={`M${-r} 0 Q${-r * 0.55} -4.4 0 -2.5 Q${r * 0.55} -4.4 ${r} 0 Q${r * 0.55} 3.7 0 2.5 Q${-r * 0.55} 3.7 ${-r} 0Z`}
                fill="#3b3e45" stroke="#7a7f88" strokeWidth=".8"
            />
            <rect x={-r} y={-1.7} width={r * 0.14} height={3.4} rx={1.2} fill="#facc15" />
            <rect x={r - r * 0.14} y={-1.7} width={r * 0.14} height={3.4} rx={1.2} fill="#facc15" />
        </g>
        <ellipse rx={6.5} ry={3.2} cy={1} fill="#c9ccd2" />
        <ellipse rx={3} ry={1.5} fill="#8d9199" />
    </g>
);

function Drone() {
    return (
        <svg className="al-drone-svg" viewBox="-10 0 440 250" role="img" aria-label="Quadcopter drone perched on the sign-in panel">
            <defs>
                <linearGradient id="ald-body" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#41444c" /><stop offset=".55" stopColor="#1d1f23" /><stop offset="1" stopColor="#0c0d0f" />
                </linearGradient>
                <linearGradient id="ald-shell" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="#5a5e67" /><stop offset=".5" stopColor="#2a2c32" /><stop offset="1" stopColor="#15161a" />
                </linearGradient>
                <linearGradient id="ald-arm" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#34363c" /><stop offset="1" stopColor="#101113" />
                </linearGradient>
                <linearGradient id="ald-motor" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0" stopColor="#0b0c0e" /><stop offset=".32" stopColor="#555962" /><stop offset=".7" stopColor="#1c1d21" /><stop offset="1" stopColor="#08090a" />
                </linearGradient>
                <radialGradient id="ald-lens" cx=".36" cy=".34" r=".8">
                    <stop offset="0" stopColor="#9bd8ff" /><stop offset=".3" stopColor="#2b5fb4" /><stop offset=".65" stopColor="#0c1a36" /><stop offset="1" stopColor="#020308" />
                </radialGradient>
                <radialGradient id="ald-disc" cx=".5" cy=".5" r=".5">
                    <stop offset="0" stopColor="#e5e8ef" stopOpacity=".34" /><stop offset=".72" stopColor="#e5e8ef" stopOpacity=".2" /><stop offset="1" stopColor="#e5e8ef" stopOpacity="0" />
                </radialGradient>
            </defs>

            {/* rear arms + motors + props (further away, a little darker) */}
            <g opacity=".9">
                <path d="M180 126 L126 96 L120 104 L184 138Z M240 126 L294 96 L300 104 L236 138Z" fill="#15161a" />
                <rect x="111" y="86" width="22" height="19" rx="5" fill="url(#ald-motor)" />
                <rect x="287" y="86" width="22" height="19" rx="5" fill="url(#ald-motor)" />
                <Prop x={122} y={82} r={46} />
                <Prop x={298} y={82} r={46} />
            </g>

            {/* landing legs (behind the body) */}
            <path d="M174 182 Q160 216 150 244 M246 182 Q260 216 270 244" stroke="#2c2e34" strokeWidth="5.5" strokeLinecap="round" fill="none" />
            <path d="M176 184 Q163 216 153 242 M243 184 Q257 216 267 242" stroke="rgba(255,255,255,.14)" strokeWidth="1.2" strokeLinecap="round" fill="none" />
            <path d="M126 246 H174 M246 246 H294" stroke="#1a1b1f" strokeWidth="6" strokeLinecap="round" />
            <path d="M130 244 H170 M250 244 H290" stroke="rgba(255,255,255,.18)" strokeWidth="1.2" strokeLinecap="round" />

            {/* front arms */}
            <path d="M158 138 L74 116 L72 130 L160 160Z" fill="url(#ald-arm)" />
            <path d="M262 138 L346 116 L348 130 L260 160Z" fill="url(#ald-arm)" />
            <path d="M158 139 L75 118 M262 139 L345 118" stroke="rgba(255,255,255,.16)" strokeWidth="1.2" fill="none" />

            {/* fuselage */}
            <path d="M150 150 Q150 122 178 118 H242 Q270 122 270 150 V162 Q270 187 240 189 H180 Q150 187 150 162Z" fill="url(#ald-body)" stroke="rgba(255,255,255,.09)" />
            <path d="M158 130 Q164 106 196 102 H224 Q256 106 262 130 Q210 120 158 130Z" fill="url(#ald-shell)" />
            <path d="M170 116 Q190 106 210 106" stroke="rgba(255,255,255,.35)" strokeWidth="1.6" strokeLinecap="round" fill="none" />
            <rect x="172" y="152" width="76" height="3" rx="1.5" fill="#facc15" />
            <path d="M160 160 H168 M160 166 H168 M252 160 H260 M252 166 H260" stroke="rgba(255,255,255,.14)" strokeWidth="1.6" strokeLinecap="round" />
            <ellipse cx="210" cy="99" rx="17" ry="5" fill="#1b1c20" stroke="rgba(255,255,255,.12)" />
            <path d="M232 103 L241 82" stroke="#2c2e34" strokeWidth="2.2" strokeLinecap="round" />
            <circle cx="241.5" cy="81" r="2.6" fill="#8d9199" />
            <circle className="al-led" cx="210" cy="140" r="3.6" />

            {/* camera gimbal */}
            <rect x="196" y="186" width="28" height="9" rx="3" fill="#16171a" />
            <circle cx="210" cy="206" r="16.5" fill="#101113" stroke="#33363c" strokeWidth="2" />
            <circle cx="210" cy="206" r="10" fill="url(#ald-lens)" />
            <g className="al-pupil">
                <circle cx="214.5" cy="201.5" r="2.4" fill="#fff" opacity=".85" />
                <circle cx="206" cy="210" r="1.2" fill="#fff" opacity=".45" />
            </g>

            {/* front motors + props */}
            <rect x="48" y="106" width="28" height="22" rx="6" fill="url(#ald-motor)" />
            <rect x="344" y="106" width="28" height="22" rx="6" fill="url(#ald-motor)" />
            <rect x="48" y="123" width="28" height="3" fill="#facc15" opacity=".9" />
            <rect x="344" y="123" width="28" height="3" fill="#facc15" opacity=".9" />
            <circle cx="46" cy="118" r="5.5" fill="#ef4444" opacity=".25" /><circle cx="46" cy="118" r="2.4" fill="#ef4444" />
            <circle cx="374" cy="118" r="5.5" fill="#22c55e" opacity=".25" /><circle cx="374" cy="118" r="2.4" fill="#22c55e" />
            <Prop x={62} y={102} r={64} />
            <Prop x={358} y={102} r={64} />
        </svg>
    );
}

/* ----------------------------------------------------------------- icons -- */
const Eye = ({ off }) => (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
        <circle cx="12" cy="12" r="3" />
        {off && <path d="M4 4l16 16" />}
    </svg>
);

/* ------------------------------------------------------------------ page -- */
export default function AdminLogin({ demo = false, status = "" }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [remember, setRemember] = useState(false);
    const [showPw, setShowPw] = useState(false);
    const [focus, setFocus] = useState(null);       // 'email' | 'password' | null
    const [caps, setCaps] = useState(false);
    const [stage, setStage] = useState(null);       // null | 'checking' | 'flying' | 'denied'
    const [error, setError] = useState("");
    const [slide, setSlide] = useState(0);
    const timers = useRef([]);

    const later = (fn, ms) => { timers.current.push(setTimeout(fn, ms)); };
    useEffect(() => () => timers.current.forEach(clearTimeout), []);

    /* picture slideshow */
    useEffect(() => {
        if (SLIDES.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;
        const id = setInterval(() => setSlide((s) => (s + 1) % SLIDES.length), SLIDE_MS);
        return () => clearInterval(id);
    }, []);

    const hasInput = email.length > 0 || password.length > 0;
    const phase = stage || (hasInput || focus ? "armed" : "idle");

    /* 0 → 1: how hard the rotors spin. Every typed character adds a little. */
    const power =
        stage === "checking" ? 0.9 :
        stage === "flying"   ? 1 :
        stage === "denied"   ? 0 :
        Math.min(1, (focus ? 0.18 : 0) + (email ? 0.14 : 0) + password.length * 0.07);

    const locked = stage === "checking" || stage === "flying";
    const rot = Math.max(0.09, 0.85 - power * 0.76).toFixed(2) + "s";
    const gaze = focus === "password" ? "5px, 3px" : focus === "email" ? "-5px, 3px" : "0px, 0px";

    const onSubmit = async (e) => {
        e.preventDefault();
        if (locked) return;
        setError("");
        if (!EMAIL_RE.test(email.trim())) { setError("Enter a valid email address."); deny(); return; }
        if (!password) { setError("Enter your password."); deny(); return; }

        setStage("checking");
        const result = await requestLogin({ email: email.trim(), password, remember }, demo);
        if (result.ok) {
            setStage("flying");
            const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
            later(() => window.location.assign(result.dest), reduced ? 500 : FLIGHT_MS);
        } else {
            setError(result.message);
            deny();
        }
    };

    function deny() {
        setStage("denied");
        later(() => setStage(null), 1300);
    }

    const info = PHASES[phase];

    return (
        <>
            <Head title="Sign in | Admin CMS" />
            <main className={`al-page al-phase-${phase}`}>
                <div className="al-wrap">

                    {/* ---------- outside the panel: status readout + the drone ---------- */}
                    <div className="al-tele">
                        <span className="al-chip"><i />{info.chip}</span>
                        <span className="al-rpm">ROTORS <b>{Math.round(power * 100)}%</b></span>
                        <p className="al-statusText" aria-live="polite">{info.text}</p>
                    </div>

                    <div
                        className={`al-droneWrap ${stage === "flying" ? "is-flying" : ""} ${stage === "denied" ? "is-denied" : ""}`}
                        style={{ "--rot": rot, "--power": power, "--lift": `${(power * 12).toFixed(1)}px`, "--gaze": gaze }}
                    >
                        <div className="al-drone"><Drone /></div>
                    </div>

                    {/* ---------- the sign-in panel ---------- */}
                    <div className="al-shell">
                        {/* left: picture card */}
                        <section className="al-visual" aria-label="Sandbox pictures">
                            {SLIDES.map((s, i) => (
                                <div key={s.src} className={`al-slide ${i === slide ? "is-on" : ""}`}
                                    style={{ backgroundImage: `url(${s.src})` }} aria-hidden="true" />
                            ))}
                            <div className="al-visual-shade" aria-hidden="true" />

                            <div className="al-visual-top">
                                <span className="al-logo">
                                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19" /><circle cx="12" cy="12" r="2.2" fill="currentColor" stroke="none" /></svg>
                                    <b>Perlis Airspace Sandbox</b>
                                </span>
                                <a className="al-back" href={BACK_URL}>Back to website <span aria-hidden="true">&rarr;</span></a>
                            </div>

                            <div className="al-visual-bottom">
                                <p className="al-caption" key={slide}>{SLIDES[slide].caption}</p>
                                <div className="al-dashes" role="tablist" aria-label="Choose picture">
                                    {SLIDES.map((s, i) => (
                                        <button key={s.src} type="button" role="tab" aria-selected={i === slide}
                                            aria-label={`Picture ${i + 1}`} className={i === slide ? "is-on" : ""}
                                            onClick={() => setSlide(i)} />
                                    ))}
                                </div>
                            </div>
                        </section>

                        {/* right: form */}
                        <section className={`al-card ${stage === "denied" ? "is-shake" : ""}`}>
                            <h1>Sign in</h1>
                            <p className="al-sub">Admin CMS for the Perlis Airspace Sandbox. Use the account issued to you.</p>

                            {status ? <p className="al-ok" role="status">{status}</p> : null}

                            <form onSubmit={onSubmit} noValidate>
                                <label className="al-field">
                                    <span>Email</span>
                                    <div className={`al-input ${focus === "email" ? "is-focus" : ""}`}>
                                        <input
                                            type="email" name="email" autoComplete="username" inputMode="email"
                                            placeholder="name@example.com" value={email} disabled={locked}
                                            onChange={(e) => setEmail(e.target.value)}
                                            onFocus={() => setFocus("email")} onBlur={() => setFocus(null)}
                                        />
                                    </div>
                                </label>

                                <label className="al-field">
                                    <span>Password</span>
                                    <div className={`al-input ${focus === "password" ? "is-focus" : ""}`}>
                                        <input
                                            type={showPw ? "text" : "password"} name="password" autoComplete="current-password"
                                            placeholder="Enter your password" value={password} disabled={locked}
                                            onChange={(e) => setPassword(e.target.value)}
                                            onFocus={() => setFocus("password")} onBlur={() => { setFocus(null); setCaps(false); }}
                                            onKeyUp={(e) => setCaps(e.getModifierState && e.getModifierState("CapsLock"))}
                                        />
                                        <button type="button" className="al-eye" onClick={() => setShowPw((v) => !v)}
                                            aria-label={showPw ? "Hide password" : "Show password"} aria-pressed={showPw} disabled={locked}>
                                            <Eye off={showPw} />
                                        </button>
                                    </div>
                                    {caps && <em className="al-caps">Caps Lock is on</em>}
                                </label>

                                <div className="al-row">
                                    <label className="al-check">
                                        <input type="checkbox" checked={remember} disabled={locked} onChange={(e) => setRemember(e.target.checked)} />
                                        <i aria-hidden="true" /> Keep me signed in
                                    </label>
                                    <a className="al-link" href={FORGOT_URL}>Forgot password?</a>
                                </div>

                                <p className="al-error" role="alert">{error}</p>

                                <button className="al-submit" type="submit" disabled={locked}>
                                    {stage === "checking" ? "Verifying…" : stage === "flying" ? "Taking off…" : "Sign in"}
                                </button>
                            </form>

                            <div className="al-or"><span>Authorised administrators only</span></div>
                            <p className="al-foot">You will land in the workspace your role allows. Sign-in attempts are recorded.</p>
                            {demo ? <p className="al-demo">Demo mode: any email, password <code>{DEMO_PASSWORD}</code></p> : null}
                        </section>
                    </div>
                </div>
            </main>
        </>
    );
}

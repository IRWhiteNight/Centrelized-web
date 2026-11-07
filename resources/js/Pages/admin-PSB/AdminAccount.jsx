import { useEffect, useMemo, useRef, useState } from "react";
import { router, usePage } from "@inertiajs/react";
import "../../../css/admin-PSB-css/admin-account.css";

/* ====================================================================
   PSB ADMIN → MY ACCOUNT                  /admin/psb/account

   Site map (PSB workspace → "My Account / My activity"):
     My Account   → Profile and password
     My activity  → My activity log   (audit_logs for this user, PSB scope)
   Use cases: Update My Profile · Reset / Change Password · View My Activity (PSB)

   Data from the design document:
     users            full_name, email (UQ), status, role_id, last_login_at,
                      must_change_password, two_factor_enabled, created_at
     roles            code (PSB_ADMIN), name, landing_route
     sites            PSB
     audit_logs       action, module, entity_label, old_values, new_values,
                      ip_address, user_agent, created_at   (immutable)
     login_attempts   was_successful, ip_address, user_agent, created_at

   Rules:
     • A site administrator can only edit their own name and email.
       Role, workspace and account status are managed by the Super Admin.
     • Passwords are never written to audit_logs (log "Password changed" only).
     • The controller must write audit_logs for profile, password and 2FA changes.

   SAMPLE DATA: the page works today (changes stay on screen only). Return an Inertia
   prop named `account` and it switches to LIVE mode:

   Inertia::render('admin/AdminAccount', [
       'account' => [
           'profile' => [
               'fullName' => 'Aiman Hakim', 'email' => 'aiman@example.my',
               'roleName' => 'PSB Content Admin', 'roleCode' => 'PSB_ADMIN',
               'siteName' => 'Perlis Airspace Sandbox', 'landingRoute' => '/admin/psb',
               'status' => 'active',                 // active | suspended | disabled
               'lastLoginAt' => '2026-11-04T08:12:00Z', 'createdAt' => '2026-01-12T03:00:00Z',
               'twoFactorEnabled' => false, 'mustChangePassword' => false,
           ],
           'activity' => [...],   // audit_logs rows for this user (newest first), see sampleActivity
           'signins'  => [...],   // login_attempts rows for this user (newest first), see sampleSignins
       ],
   ]);

   Validation errors come back as Laravel errors (full_name, email, current_password,
   password, password_confirmation) and show under the matching field.
   LIVE mode requests are listed in ENDPOINTS.
==================================================================== */

const BASE = "/admin/psb"; // keep in sync with psbRoutes.js
const ENDPOINTS = {
    profile: `${BASE}/account/profile`, // PUT  { full_name, email }
    password: `${BASE}/account/password`, // PUT  { current_password, password, password_confirmation }
    twoFactor: `${BASE}/account/two-factor`, // POST { enabled }
};

const LIMITS = { name: 150, email: 190 };
const PASSWORD_MIN = 10;
const PAGE_SIZE = 8;

const MIN = 60 * 1000;
const NOW = Date.now();
const minsAgo = (m) => new Date(NOW - m * MIN).toISOString();

/* ------------------------------ sample data ------------------------------ */

const sampleProfile = {
    fullName: "Aiman Hakim",
    email: "aiman.hakim@perlissandbox.my",
    roleName: "PSB Content Admin",
    roleCode: "PSB_ADMIN",
    siteName: "Perlis Airspace Sandbox",
    landingRoute: "/admin/psb",
    status: "active",
    lastLoginAt: minsAgo(35),
    createdAt: minsAgo(60 * 24 * 41),
    twoFactorEnabled: false,
    mustChangePassword: false,
};

const sampleActivity = [
    { id: 12, action: "LOGIN", module: "Authentication", label: "Signed in", at: minsAgo(35), ip: "175.139.20.84", changes: [] },
    { id: 11, action: "PUBLISH", module: "Home Page", label: "Home Page", at: minsAgo(60 * 26), ip: "175.139.20.84", changes: [{ field: "Banner headline", from: "Malaysia is ready to lead", to: "Malaysia’s first real-world testing ground for low-altitude airspace" }] },
    { id: 10, action: "UPDATE", module: "Home Page", label: "Featured programmes", at: minsAgo(60 * 27), ip: "175.139.20.84", changes: [{ field: "Pinned programmes", from: "3 pinned", to: "4 pinned" }] },
    { id: 9, action: "UPDATE", module: "Applications", label: "PSB-2026-0042", at: minsAgo(60 * 30), ip: "175.139.20.84", changes: [{ field: "Status", from: "submitted", to: "under_review" }] },
    { id: 8, action: "EXPORT", module: "Subscribers", label: "Subscriber list (CSV)", at: minsAgo(60 * 49), ip: "175.139.21.10", changes: [] },
    { id: 7, action: "UPDATE", module: "Home Page", label: "Partners preview", at: minsAgo(60 * 80), ip: "175.139.21.10", changes: [{ field: "Featured partners", from: "8 featured", to: "10 featured" }] },
    { id: 6, action: "DELETE", module: "Media Library", label: "old-banner.jpg", at: minsAgo(60 * 96), ip: "175.139.21.10", changes: [{ field: "Moved to Trash", from: "old-banner.jpg", to: "(deleted)" }] },
    { id: 5, action: "ACCESS_DENIED", module: "Authentication", label: "/admin/coeuas", at: minsAgo(60 * 120), ip: "175.139.21.10", changes: [] },
    { id: 4, action: "CREATE", module: "Media Centre", label: "Sandbox briefing held with regulators and agencies", at: minsAgo(60 * 24 * 14), ip: "175.139.21.10", changes: [] },
    { id: 3, action: "UNPUBLISH", module: "Media Centre", label: "Partner agreement signing (draft)", at: minsAgo(60 * 24 * 15), ip: "175.139.21.10", changes: [] },
    { id: 2, action: "LOGOUT", module: "Authentication", label: "Signed out", at: minsAgo(60 * 24 * 15), ip: "175.139.21.10", changes: [] },
    { id: 1, action: "RESTORE", module: "Content Trash", label: "Participant: Media partners", at: minsAgo(60 * 24 * 20), ip: "175.139.21.10", changes: [] },
];

const sampleSignins = [
    { id: 5, ok: true, ip: "175.139.20.84", agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130.0 Safari/537.36", at: minsAgo(35) },
    { id: 4, ok: true, ip: "175.139.21.10", agent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) Safari/605.1.15", at: minsAgo(60 * 24 * 2) },
    { id: 3, ok: false, ip: "103.28.121.7", agent: "Mozilla/5.0 (Linux; Android 14) Chrome/130.0 Mobile Safari/537.36", at: minsAgo(60 * 24 * 3) },
    { id: 2, ok: true, ip: "175.139.21.10", agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/129.0 Safari/537.36", at: minsAgo(60 * 24 * 6) },
    { id: 1, ok: true, ip: "175.139.21.10", agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/129.0 Safari/537.36", at: minsAgo(60 * 24 * 9) },
];

/* ------------------------------ helpers ------------------------------ */

const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((v || "").trim());
const initialsOf = (name) => (name || "?").split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase();

function formatDate(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    return `${d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}, ${d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`;
}

function timeAgo(iso) {
    const minutes = Math.round((Date.now() - new Date(iso).getTime()) / MIN);
    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.round(minutes / 60);
    if (hours < 24) return `${hours} hr ago`;
    const days = Math.round(hours / 24);
    return `${days} day${days === 1 ? "" : "s"} ago`;
}

/* "Mozilla/5.0 (Windows NT 10.0) Chrome/130" → "Chrome on Windows" */
function deviceOf(agent = "") {
    const browser = /Edg\//.test(agent) ? "Edge" : /Chrome\//.test(agent) ? "Chrome" : /Firefox\//.test(agent) ? "Firefox" : /Safari\//.test(agent) ? "Safari" : "Browser";
    const system = /Windows/.test(agent) ? "Windows" : /Android/.test(agent) ? "Android" : /iPhone|iPad/.test(agent) ? "iOS" : /Mac OS X/.test(agent) ? "macOS" : /Linux/.test(agent) ? "Linux" : "unknown device";
    return `${browser} on ${system}`;
}

const STATUS_PILL = { active: { label: "Active", tone: "ok" }, suspended: { label: "Suspended", tone: "warn" }, disabled: { label: "Disabled", tone: "off" } };

const ACTION_PILL = { CREATE: "warn", UPDATE: "info", PUBLISH: "dark", UNPUBLISH: "off", DELETE: "danger", RESTORE: "ok", LOGIN: "ok", LOGOUT: "off", EXPORT: "info", ACCESS_DENIED: "danger" };
const ACTION_LABEL = { CREATE: "Created", UPDATE: "Updated", PUBLISH: "Published", UNPUBLISH: "Unpublished", DELETE: "Deleted", RESTORE: "Restored", LOGIN: "Signed in", LOGOUT: "Signed out", EXPORT: "Exported", ACCESS_DENIED: "Access denied" };

/* the password rules shown to the administrator while typing */
function passwordRules(password, current) {
    return [
        { key: "len", ok: password.length >= PASSWORD_MIN, text: `At least ${PASSWORD_MIN} characters` },
        { key: "case", ok: /[a-z]/.test(password) && /[A-Z]/.test(password), text: "Upper and lower case letters" },
        { key: "num", ok: /\d/.test(password), text: "At least one number" },
        { key: "sym", ok: /[^A-Za-z0-9]/.test(password), text: "At least one symbol (for example ! # ?)" },
        { key: "new", ok: password.length > 0 && password !== current, text: "Different from your current password" },
    ];
}

function strengthOf(password, rules) {
    if (!password) return { level: 0, label: "Not set" };
    const score = rules.filter((r) => r.key !== "new" && r.ok).length + (password.length >= 14 ? 1 : 0);
    if (score <= 2) return { level: 1, label: "Weak" };
    if (score === 3) return { level: 2, label: "Fair" };
    if (score === 4) return { level: 3, label: "Good" };
    return { level: 4, label: "Strong" };
}

/* ------------------------------ icons ------------------------------ */

function Icon({ name, size = 18 }) {
    const icons = {
        user: (<><circle cx="12" cy="8" r="4" /><path d="M4 21c1-4 4.5-6 8-6s7 2 8 6" /></>),
        lock: (<><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>),
        shield: (<><path d="M12 3 4 6v6c0 5 3.4 8.3 8 9.5 4.6-1.2 8-4.5 8-9.5V6z" /><path d="m9 12 2 2 4-4" /></>),
        history: (<><path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 4v5h5M12 8v4l3 2" /></>),
        eye: (<><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></>),
        eyeOff: (<><path d="M3 3l18 18" /><path d="M10.6 6.1A10 10 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3.2 4M6.5 6.9C3.8 8.6 2 12 2 12s3.6 7 10 7c1.5 0 2.9-.4 4.1-1M9.9 9.9a3 3 0 0 0 4.2 4.2" /></>),
        save: (<><path d="M5 3h11l4 4v14H5z" /><path d="M8 3v6h8V3M8 21v-7h8v7" /></>),
        check: <path d="m5 12 5 5 9-10" />,
        alert: (<><path d="M12 3 2.5 20h19z" /><path d="M12 10v4M12 17.2v.1" /></>),
        close: <path d="M6 6l12 12M18 6 6 18" />,
        search: (<><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4-4" /></>),
        down: <path d="m6 9 6 6 6-6" />,
    };
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            {icons[name]}
        </svg>
    );
}

/* ------------------------------ form pieces ------------------------------ */

function Toggle({ checked, onChange, label, disabled }) {
    return (
        <button type="button" role="switch" aria-checked={checked} aria-label={label} disabled={disabled} className={`pa-toggle ${checked ? "is-on" : ""}`} onClick={() => onChange(!checked)}>
            <span />
        </button>
    );
}

/* One labelled text box with a character counter and an error line */
function Field({ id, label, hint, value, onChange, error, max, type = "text", autoComplete, readOnly, placeholder, children }) {
    const length = (value || "").length;
    return (
        <div className={`pa-field ${error ? "has-error" : ""}`}>
            <div className="pa-field-top">
                <label htmlFor={id}>{label}</label>
                {max && !readOnly && <span className={`pa-count ${length > max ? "is-over" : ""}`}>{length}/{max}</span>}
            </div>
            <div className="pa-input-wrap">
                <input id={id} type={type} className="pa-input" value={value || ""} readOnly={readOnly} placeholder={placeholder} autoComplete={autoComplete} onChange={(e) => onChange?.(e.target.value)} aria-invalid={Boolean(error)} />
                {children}
            </div>
            {hint && !error && <p className="pa-hint">{hint}</p>}
            {error && <p className="pa-error" role="alert"><Icon name="alert" size={13} /> {error}</p>}
        </div>
    );
}

function PasswordField({ id, label, value, onChange, error, autoComplete, hint }) {
    const [show, setShow] = useState(false);
    return (
        <Field id={id} label={label} value={value} onChange={onChange} error={error} type={show ? "text" : "password"} autoComplete={autoComplete} hint={hint}>
            <button type="button" className="pa-reveal" aria-label={show ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`} aria-pressed={show} onClick={() => setShow((v) => !v)}>
                <Icon name={show ? "eyeOff" : "eye"} size={16} />
            </button>
        </Field>
    );
}

function BlockHead({ title, text, aside }) {
    return (
        <div className="pa-block-head">
            <div>
                <h3>{title}</h3>
                {text && <p>{text}</p>}
            </div>
            {aside}
        </div>
    );
}

/* ====================================================================
   TABS
==================================================================== */

/* ---------- Profile ---------- */
function ProfileTab({ profile, form, setForm, errors, onSave, busy }) {
    const status = STATUS_PILL[profile.status] || STATUS_PILL.active;

    return (
        <div className="pa-layout">
            <aside className="pa-summary" aria-label="Account summary">
                <span className="pa-avatar-lg" aria-hidden="true">{initialsOf(form.fullName || profile.fullName)}</span>
                <h2>{profile.fullName}</h2>
                <p>{profile.email}</p>
                <div className="pa-summary-pills">
                    <span className="pa-pill is-dark">{profile.roleName}</span>
                    <span className={`pa-pill is-${status.tone}`}>{status.label}</span>
                </div>
                <dl className="pa-facts">
                    <div><dt>Workspace</dt><dd>{profile.siteName}</dd></div>
                    <div><dt>Home route</dt><dd>{profile.landingRoute}</dd></div>
                    <div><dt>Last sign in</dt><dd>{profile.lastLoginAt ? formatDate(profile.lastLoginAt) : "Never"}</dd></div>
                    <div><dt>Account created</dt><dd>{formatDate(profile.createdAt)}</dd></div>
                    <div><dt>Two-step sign in</dt><dd>{profile.twoFactorEnabled ? "On" : "Off"}</dd></div>
                </dl>
            </aside>

            <section className="pa-card">
                <header className="pa-card-head">
                    <div>
                        <span className="pa-card-no">Profile</span>
                        <h2>Your details</h2>
                        <p>The name and email shown in the admin menu, History and notification emails.</p>
                    </div>
                </header>

                <form className="pa-block" onSubmit={(e) => { e.preventDefault(); onSave(); }} noValidate>
                    <BlockHead title="Personal details" text="You can change these yourself." />
                    <div className="pa-grid-2">
                        <Field id="pa-full-name" label="Full name" value={form.fullName} max={LIMITS.name} error={errors.full_name} autoComplete="name" onChange={(v) => setForm((f) => ({ ...f, fullName: v }))} />
                        <Field id="pa-email" label="Email address" type="email" value={form.email} max={LIMITS.email} error={errors.email} autoComplete="email" onChange={(v) => setForm((f) => ({ ...f, email: v }))} hint="You sign in with this address. Reset links are sent here." />
                    </div>
                    <button type="submit" className="pa-sr-only" tabIndex={-1}>Save changes</button>
                </form>

                <div className="pa-block">
                    <BlockHead title="Access" text="Managed by the Super Admin. Ask them if something here is wrong." />
                    <div className="pa-grid-2">
                        <Field id="pa-role" label="Role" value={profile.roleName} readOnly />
                        <Field id="pa-site" label="Workspace" value={`${profile.siteName} (${profile.landingRoute})`} readOnly />
                    </div>
                    <p className="pa-callout"><Icon name="shield" size={15} /> You can open the {profile.siteName} workspace only. Other workspaces show an Access denied page, and the attempt is recorded in the audit log.</p>
                </div>
            </section>
        </div>
    );
}

/* ---------- Password and security ---------- */
function SecurityTab({ profile, signins, errors, pw, setPw, onSubmit, busy, twoFactor, onTwoFactor }) {
    const rules = useMemo(() => passwordRules(pw.next, pw.current), [pw.next, pw.current]);
    const strength = strengthOf(pw.next, rules);
    const mismatch = pw.confirm.length > 0 && pw.confirm !== pw.next;

    return (
        <div className="pa-stack-cards">
            <section className="pa-card">
                <header className="pa-card-head">
                    <div>
                        <span className="pa-card-no">Password</span>
                        <h2>Change password</h2>
                        <p>Use a password you do not use anywhere else. Other devices stay signed in until their session ends.</p>
                    </div>
                </header>

                {profile.mustChangePassword && (
                    <p className="pa-warn"><Icon name="alert" size={15} /> The Super Admin asked you to set a new password. Change it now to keep working without interruption.</p>
                )}

                <form className="pa-block" onSubmit={(e) => { e.preventDefault(); onSubmit(); }} noValidate>
                    <div className="pa-pw-grid">
                        <div>
                            <PasswordField id="pa-current" label="Current password" value={pw.current} autoComplete="current-password" error={errors.current_password} onChange={(v) => setPw((p) => ({ ...p, current: v }))} />
                            <PasswordField id="pa-new" label="New password" value={pw.next} autoComplete="new-password" error={errors.password} onChange={(v) => setPw((p) => ({ ...p, next: v }))} />
                            <PasswordField id="pa-confirm" label="Confirm new password" value={pw.confirm} autoComplete="new-password" error={errors.password_confirmation || (mismatch ? "The two passwords do not match." : "")} onChange={(v) => setPw((p) => ({ ...p, confirm: v }))} />
                        </div>

                        <div className="pa-rules" aria-live="polite">
                            <div className="pa-meter" role="img" aria-label={`Password strength: ${strength.label}`}>
                                <div className="pa-meter-bars">
                                    {[1, 2, 3, 4].map((n) => <i key={n} className={strength.level >= n ? `is-on is-l${strength.level}` : ""} />)}
                                </div>
                                <span>Strength: <b>{strength.label}</b></span>
                            </div>
                            <ul>
                                {rules.map((r) => (
                                    <li key={r.key} className={r.ok ? "is-ok" : ""}>
                                        <span aria-hidden="true">{r.ok ? <Icon name="check" size={13} /> : null}</span>
                                        {r.text}
                                        <span className="pa-sr-only">{r.ok ? " (met)" : " (not met yet)"}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    <div className="pa-form-actions">
                        <button type="submit" className="pa-btn-dark" disabled={busy || (!pw.current && !pw.next && !pw.confirm)}>
                            <span className="pa-btn-icon"><Icon name="lock" size={16} /></span> {busy ? "Changing..." : "Change password"}
                        </button>
                    </div>
                </form>
            </section>

            <section className="pa-card">
                <header className="pa-card-head">
                    <div>
                        <span className="pa-card-no">Security</span>
                        <h2>Two-step sign in</h2>
                        <p>Ask for a code from your authenticator app each time you sign in.</p>
                    </div>
                    <label className="pa-visible">
                        <span>{twoFactor ? "On" : "Off"}</span>
                        <Toggle checked={twoFactor} disabled={busy} label="Two-step sign in" onChange={onTwoFactor} />
                    </label>
                </header>

                <div className="pa-block">
                    <BlockHead title="Recent sign-ins" text="The last attempts on your account. Not you? Change your password now and tell the Super Admin." />
                    {signins.length === 0 ? (
                        <p className="pa-empty">No sign-ins recorded yet.</p>
                    ) : (
                        <ul className="pa-signins">
                            {signins.map((s) => (
                                <li key={s.id}>
                                    <span className={`pa-dot-status ${s.ok ? "is-ok" : "is-fail"}`} aria-hidden="true" />
                                    <div className="pa-signin-text">
                                        <strong>{deviceOf(s.agent)}</strong>
                                        <small>{s.ip}</small>
                                    </div>
                                    <span className={`pa-pill is-${s.ok ? "ok" : "danger"}`}>{s.ok ? "Signed in" : "Failed attempt"}</span>
                                    <span className="pa-time" title={formatDate(s.at)}>{timeAgo(s.at)}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </section>
        </div>
    );
}

/* ---------- My activity ---------- */
function ActivityTab({ activity }) {
    const [query, setQuery] = useState("");
    const [action, setAction] = useState("all");
    const [module, setModule] = useState("all");
    const [open, setOpen] = useState(null);
    const [shown, setShown] = useState(PAGE_SIZE);

    const actions = useMemo(() => [...new Set(activity.map((a) => a.action))], [activity]);
    const modules = useMemo(() => [...new Set(activity.map((a) => a.module))].sort(), [activity]);

    const list = activity.filter((a) => {
        if (action !== "all" && a.action !== action) return false;
        if (module !== "all" && a.module !== module) return false;
        const q = query.trim().toLowerCase();
        return !q || a.label.toLowerCase().includes(q) || a.module.toLowerCase().includes(q) || (ACTION_LABEL[a.action] || a.action).toLowerCase().includes(q);
    });
    const visible = list.slice(0, shown);
    const filtering = query.trim() || action !== "all" || module !== "all";

    return (
        <section className="pa-card">
            <header className="pa-card-head">
                <div>
                    <span className="pa-card-no">My activity</span>
                    <h2>What you changed in this workspace</h2>
                    <p>Every add, update, publish, delete and sign-in by you. Entries are recorded by the system and cannot be edited.</p>
                </div>
                <span className="pa-limit">{list.length} {list.length === 1 ? "entry" : "entries"}</span>
            </header>

            <div className="pa-tools">
                <label className="pa-search">
                    <Icon name="search" size={16} />
                    <input type="search" value={query} onChange={(e) => { setQuery(e.target.value); setShown(PAGE_SIZE); }} placeholder="Search by page, record or action" aria-label="Search my activity" />
                </label>
                <select className="pa-input pa-select" value={action} onChange={(e) => { setAction(e.target.value); setShown(PAGE_SIZE); }} aria-label="Filter by action">
                    <option value="all">All actions</option>
                    {actions.map((a) => <option key={a} value={a}>{ACTION_LABEL[a] || a}</option>)}
                </select>
                <select className="pa-input pa-select" value={module} onChange={(e) => { setModule(e.target.value); setShown(PAGE_SIZE); }} aria-label="Filter by module">
                    <option value="all">All modules</option>
                    {modules.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
                {filtering && <button type="button" className="pa-btn-small is-quiet" onClick={() => { setQuery(""); setAction("all"); setModule("all"); setShown(PAGE_SIZE); }}>Clear filters</button>}
            </div>

            {list.length === 0 ? (
                <p className="pa-empty">{filtering ? "Nothing matches these filters. Clear them to see all your activity." : "No activity yet. Your changes will appear here."}</p>
            ) : (
                <ul className="pa-history">
                    {visible.map((h) => {
                        const isOpen = open === h.id;
                        const hasDiff = h.changes?.length > 0;
                        return (
                            <li key={h.id}>
                                <button type="button" className="pa-hist-row" aria-expanded={hasDiff ? isOpen : undefined} onClick={() => setOpen(isOpen ? null : h.id)} disabled={!hasDiff}>
                                    <span className={`pa-pill is-${ACTION_PILL[h.action] || "info"}`}>{ACTION_LABEL[h.action] || h.action}</span>
                                    <span className="pa-hist-text">
                                        <strong>{h.label}</strong>
                                        <small>{h.module}{h.ip ? ` · ${h.ip}` : ""}</small>
                                    </span>
                                    <span className="pa-time" title={formatDate(h.at)}>{timeAgo(h.at)}</span>
                                    {hasDiff && <span className={`pa-chev ${isOpen ? "is-open" : ""}`}><Icon name="down" size={15} /></span>}
                                </button>
                                {isOpen && hasDiff && (
                                    <div className="pa-diff">
                                        {h.changes.map((c, i) => (
                                            <div key={i}>
                                                <span>{c.field}</span>
                                                <del>{c.from}</del>
                                                <ins>{c.to}</ins>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </li>
                        );
                    })}
                </ul>
            )}

            {list.length > shown && (
                <div className="pa-more-row">
                    <button type="button" className="pa-btn-outline" onClick={() => setShown((n) => n + PAGE_SIZE)}>Show {Math.min(PAGE_SIZE, list.length - shown)} more</button>
                </div>
            )}
        </section>
    );
}

/* ====================================================================
   PAGE
==================================================================== */

export default function AdminAccount() {
    const { props } = usePage();
    const live = Boolean(props.account?.profile);

    const seed = useRef(
        live
            ? { profile: props.account.profile, activity: props.account.activity || [], signins: props.account.signins || [] }
            : { profile: sampleProfile, activity: sampleActivity, signins: sampleSignins }
    ).current;

    const [profile, setProfile] = useState(seed.profile);
    const [saved, setSaved] = useState({ fullName: seed.profile.fullName, email: seed.profile.email });
    const [form, setForm] = useState({ fullName: seed.profile.fullName, email: seed.profile.email });
    const [localActivity, setLocalActivity] = useState(seed.activity);
    const [pw, setPw] = useState({ current: "", next: "", confirm: "" });

    const [tab, setTab] = useState("profile");
    const [profileSubmitted, setProfileSubmitted] = useState(false);
    const [pwSubmitted, setPwSubmitted] = useState(false);
    const [busy, setBusy] = useState(false);
    const [toast, setToast] = useState(null);
    const busyRef = useRef(false);

    /* live mode: follow what Laravel sends back after each request */
    useEffect(() => { if (live) setProfile(props.account.profile); }, [live, props.account?.profile]);

    const activity = live ? props.account.activity || [] : localActivity;
    const signins = live ? props.account.signins || [] : seed.signins;

    const dirty = form.fullName !== saved.fullName || form.email !== saved.email;
    const pwTouched = Boolean(pw.current || pw.next || pw.confirm);

    /* every rule for the profile form. Returns { "field": "message" } */
    const profileErrors = useMemo(() => {
        const e = {};
        const name = form.fullName.trim();
        const email = form.email.trim();
        if (!name) e.full_name = "Enter your full name.";
        else if (name.length > LIMITS.name) e.full_name = `Use ${LIMITS.name} characters or fewer.`;
        if (!email) e.email = "Enter your email address.";
        else if (email.length > LIMITS.email) e.email = `Use ${LIMITS.email} characters or fewer.`;
        else if (!isEmail(email)) e.email = "Enter a valid email address, for example name@example.my.";
        return e;
    }, [form]);

    const passwordErrors = useMemo(() => {
        const e = {};
        if (!pw.current) e.current_password = "Enter your current password.";
        const failed = passwordRules(pw.next, pw.current).filter((r) => !r.ok);
        if (!pw.next) e.password = "Enter a new password.";
        else if (failed.length) e.password = `Your new password still needs: ${failed.map((r) => r.text.toLowerCase()).join("; ")}.`;
        if (!pw.confirm) e.password_confirmation = "Confirm your new password.";
        else if (pw.confirm !== pw.next) e.password_confirmation = "The two passwords do not match.";
        return e;
    }, [pw]);

    const serverErrors = props.errors || {};
    const errors = { ...serverErrors, ...(profileSubmitted ? profileErrors : {}), ...(pwSubmitted ? passwordErrors : {}) };
    const securityErrorCount = ["current_password", "password", "password_confirmation"].filter((k) => errors[k]).length;

    /* toast auto-hide */
    useEffect(() => {
        if (!toast) return undefined;
        const t = setTimeout(() => setToast(null), 5000);
        return () => clearTimeout(t);
    }, [toast]);

    /* warn before leaving with unsaved changes */
    useEffect(() => {
        const guard = dirty || pwTouched;
        const beforeUnload = (e) => { if (guard) { e.preventDefault(); e.returnValue = ""; } };
        window.addEventListener("beforeunload", beforeUnload);
        const off = router.on("before", () => {
            if (guard && !busyRef.current && !window.confirm("You have unsaved changes. Leave this page and discard them?")) return false;
            return undefined;
        });
        return () => { window.removeEventListener("beforeunload", beforeUnload); if (typeof off === "function") off(); };
    }, [dirty, pwTouched]);

    const startBusy = () => { setBusy(true); busyRef.current = true; };
    const finishBusy = () => { setBusy(false); busyRef.current = false; };

    const addActivity = (action, label, changes = []) =>
        setLocalActivity((h) => [{ id: Date.now(), action, module: "My Account", label, at: new Date().toISOString(), ip: "your device", changes }, ...h]);

    /* ---- actions ---- */
    const saveProfile = () => {
        if (busy) return;
        setProfileSubmitted(true);
        if (Object.keys(profileErrors).length) {
            setToast({ tone: "error", text: "Fix the highlighted fields before saving." });
            setTab("profile");
            return;
        }
        startBusy();
        const next = { fullName: form.fullName.trim(), email: form.email.trim() };

        const done = () => {
            const changes = [];
            if (next.fullName !== saved.fullName) changes.push({ field: "Full name", from: saved.fullName, to: next.fullName });
            if (next.email !== saved.email) changes.push({ field: "Email", from: saved.email, to: next.email });
            setSaved(next);
            setForm(next);
            setProfile((p) => ({ ...p, ...next }));
            if (!live) addActivity("UPDATE", "My profile", changes);
            setProfileSubmitted(false);
            setToast({ tone: "ok", text: "Profile saved." });
            finishBusy();
        };

        if (live) router.put(ENDPOINTS.profile, { full_name: next.fullName, email: next.email }, { preserveScroll: true, onSuccess: done, onError: () => { finishBusy(); setToast({ tone: "error", text: "The server rejected some values. Check the highlighted fields." }); } });
        else setTimeout(done, 350);
    };

    const discardProfile = () => {
        setForm(saved);
        setProfileSubmitted(false);
        setToast({ tone: "info", text: "Changes discarded." });
    };

    const changePassword = () => {
        if (busy) return;
        setPwSubmitted(true);
        if (Object.keys(passwordErrors).length) {
            setToast({ tone: "error", text: "Fix the highlighted fields before changing your password." });
            return;
        }
        startBusy();

        const done = () => {
            setPw({ current: "", next: "", confirm: "" });
            setPwSubmitted(false);
            setProfile((p) => ({ ...p, mustChangePassword: false }));
            if (!live) addActivity("UPDATE", "Password changed"); /* never log the password itself */
            setToast({ tone: "ok", text: "Password changed. Use it the next time you sign in." });
            finishBusy();
        };

        if (live) router.put(ENDPOINTS.password, { current_password: pw.current, password: pw.next, password_confirmation: pw.confirm }, { preserveScroll: true, onSuccess: done, onError: () => { finishBusy(); setToast({ tone: "error", text: "Your password was not changed. Check the highlighted fields." }); } });
        else setTimeout(done, 400);
    };

    const toggleTwoFactor = (enabled) => {
        if (busy) return;
        startBusy();
        const done = () => {
            setProfile((p) => ({ ...p, twoFactorEnabled: enabled }));
            if (!live) addActivity("UPDATE", "Two-step sign in", [{ field: "Two-step sign in", from: enabled ? "Off" : "On", to: enabled ? "On" : "Off" }]);
            setToast({ tone: "ok", text: enabled ? "Two-step sign in is on." : "Two-step sign in is off." });
            finishBusy();
        };
        if (live) router.post(ENDPOINTS.twoFactor, { enabled }, { preserveScroll: true, onSuccess: done, onError: () => { finishBusy(); setToast({ tone: "error", text: "Could not change two-step sign in. Nothing was changed." }); } });
        else setTimeout(done, 300);
    };

    /* Ctrl / Cmd + S saves the profile */
    useEffect(() => {
        const onKey = (e) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s" && tab === "profile") { e.preventDefault(); if (dirty) saveProfile(); } };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    });

    const status = STATUS_PILL[profile.status] || STATUS_PILL.active;
    const tabs = [["profile", "Profile"], ["security", "Password and security"], ["activity", "My activity"]];

    return (
        <div className="psb-account">
            <div className="pa-heading">
                <div>
                    <h1>My Account</h1>
                    <p>Update your profile and password, and review what you have changed in the Perlis Airspace Sandbox admin.</p>
                    <div className="pa-status">
                        <span className="pa-pill is-dark">{profile.roleName}</span>
                        <span className={`pa-pill is-${status.tone}`}>{status.label}</span>
                        {profile.mustChangePassword && <span className="pa-pill is-warn">Password change required</span>}
                        {profile.lastLoginAt && <small>Last sign in {timeAgo(profile.lastLoginAt)}</small>}
                    </div>
                </div>
            </div>

            {!live && (
                <p className="pa-note"><Icon name="alert" size={16} /><span>Sample data. Every control works, but nothing is stored until your controller sends the <b>account</b> prop.</span></p>
            )}

            <div className="pa-tabs" role="tablist" aria-label="My account">
                {tabs.map(([key, label]) => (
                    <button key={key} type="button" role="tab" aria-selected={tab === key} className={tab === key ? "is-active" : ""} onClick={() => setTab(key)}>
                        {label}
                        {key === "profile" && dirty && <span className="pa-dot" title="Unsaved changes" />}
                        {key === "security" && securityErrorCount > 0 && <span className="pa-badge-error">{securityErrorCount}</span>}
                        {key === "activity" && <span className="pa-badge">{activity.length}</span>}
                    </button>
                ))}
            </div>

            {tab === "profile" && <ProfileTab profile={profile} form={form} setForm={setForm} errors={errors} onSave={saveProfile} busy={busy} />}
            {tab === "security" && (
                <SecurityTab profile={profile} signins={signins} errors={errors} pw={pw} setPw={setPw} onSubmit={changePassword} busy={busy} twoFactor={profile.twoFactorEnabled} onTwoFactor={toggleTwoFactor} />
            )}
            {tab === "activity" && <ActivityTab activity={activity} />}

            {dirty && tab === "profile" && (
                <div className="pa-savebar" role="region" aria-label="Unsaved changes">
                    <span className="pa-savebar-text"><i /> Profile changes not saved</span>
                    <div>
                        <button type="button" className="pa-btn-ghost" onClick={discardProfile} disabled={busy}>Discard</button>
                        <button type="button" className="pa-btn-yellow" onClick={saveProfile} disabled={busy}>{busy ? "Saving..." : "Save changes"}</button>
                    </div>
                </div>
            )}

            {toast && (
                <div className={`pa-toast is-${toast.tone}`} role="status">
                    <Icon name={toast.tone === "error" ? "alert" : "check"} size={16} />
                    <span>{toast.text}</span>
                    <button type="button" aria-label="Dismiss" onClick={() => setToast(null)}><Icon name="close" size={14} /></button>
                </div>
            )}
        </div>
    );
}

/* Wrap the page with your PSB shell here if your app does not already do it:
   import NavigationBar from "../../Components/Admin-Components/PSB/NavigationBar";
   AdminAccount.layout = (page) => <NavigationBar>{page}</NavigationBar>;                */

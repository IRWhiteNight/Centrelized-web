import { useEffect, useId, useMemo, useRef, useState } from "react";
import { router, usePage } from "@inertiajs/react";
import "../../../css/admin-COEUAS-css/admin-account.css";

/* ====================================================================
   COE-UAS ADMIN → MY ACCOUNT / MY ACTIVITY LOG     /admin/coeuas/account  ·  /activity

   Site map 1.3 (COE-UAS workspace → "My Account"): profile and password, my activity log.
   Use case 2.3 "Access and Account": Login and role-based redirect, Logout / session
   timeout, Reset / change password, View dashboard, Update my profile, View my activity.
   ERD-1 tables used:
     users           full_name, email, role_id, status, must_change_password,
                     last_login_at, two_factor_enabled, created_at
     login_attempts  my recent sign-ins (was_successful, ip_address, user_agent)
     audit_logs      my activity: action, module, entity_type, entity_label,
                     old_values / new_values, ip_address, created_at (immutable, read only)
     role_permissions + permissions   what my role may do here (read only)

   SAMPLE DATA: the page works today (changes stay on screen only). Return an Inertia
   prop named `account` and it switches to LIVE mode:

   Inertia::render('admin-COEUAS/AdminCOEUASAccount', [
       'section' => 'account',     // account | activity  (from the route)
       'account' => [
           'user' => [...],         // same shape as `sampleUser` below
           'permissions' => [...],  // [{ module, actions: ['view', 'update', ...] }]
           'signins' => [...],      // latest login_attempts for this user
           'activity' => [...],     // latest audit_logs of this user in the COE-UAS site
       ],
   ]);

   Routes (add next to your other COE-UAS routes):
   Route::get('/admin/coeuas/account',  fn () => Inertia::render('admin-COEUAS/AdminCOEUASAccount', ['section' => 'account']));
   Route::get('/admin/coeuas/activity', fn () => Inertia::render('admin-COEUAS/AdminCOEUASAccount', ['section' => 'activity']));
   Route::put('/admin/coeuas/account/profile', ...);        // { full_name }
   Route::put('/admin/coeuas/account/password', ...);       // { current_password, password, password_confirmation }
   Route::post('/admin/coeuas/account/two-factor', ...);    // { enabled }

   The controller must: only ever read and write the signed-in user's own rows, hash the
   password, clear must_change_password after a change, write audit_logs, and send the
   latest ~200 audit_logs rows of this user (the Activity tab filters them on screen).
==================================================================== */

const BASE = "/admin/coeuas"; // keep in sync with coeuasRoutes.js
const ENDPOINTS = {
    profile: `${BASE}/account/profile`, // PUT   { full_name }
    password: `${BASE}/account/password`, // PUT   { current_password, password, password_confirmation }
    twoFactor: `${BASE}/account/two-factor`, // POST  { enabled }
    logout: "/logout", // POST
};
const TABS = [["account", "Profile and security"], ["activity", "My activity log"]];

const PAGE_SIZE = 15;

/* audit_logs.action enum from the ERD */
const ACTIONS = ["CREATE", "UPDATE", "DELETE", "RESTORE", "PUBLISH", "UNPUBLISH", "LOGIN", "LOGOUT", "EXPORT", "ACCESS_DENIED"];
const ACTION_LABEL = {
    CREATE: "Created", UPDATE: "Updated", DELETE: "Deleted", RESTORE: "Restored", PUBLISH: "Published",
    UNPUBLISH: "Unpublished", LOGIN: "Signed in", LOGOUT: "Signed out", EXPORT: "Exported", ACCESS_DENIED: "Access denied",
};
const ACTION_TONE = { CREATE: "is-new", UPDATE: "is-info", PUBLISH: "is-ok", UNPUBLISH: "is-warn", DELETE: "is-danger", RESTORE: "is-ok", LOGIN: "is-off", LOGOUT: "is-off", EXPORT: "is-info", ACCESS_DENIED: "is-danger" };

/* permissions.action enum from the ERD */
const PERM_LABEL = { view: "View", create: "Create", update: "Edit", delete: "Delete", publish: "Publish", restore: "Restore", export: "Export", manage: "Manage" };

/* audit_logs.module values used in this workspace */
const MODULE_LABEL = {
    home: "Home Page", about: "About", people: "People", research: "Research and Innovation", publications: "Publications and Impact",
    facilities: "Facilities and Services", engagement: "Engagement", contact: "Contact and Enquiries", taxonomy: "Archive Taxonomy",
    media: "Media Library", settings: "Navigation and Settings", auth: "Sign-in", account: "My Account",
};
const moduleLabel = (m) => MODULE_LABEL[m] || (m ? m.charAt(0).toUpperCase() + m.slice(1).replace(/_/g, " ") : "");

/* password rules (match them to your Laravel validation) */
const RULES = [
    { key: "len", label: "At least 10 characters", test: (p) => p.length >= 10 },
    { key: "case", label: "Upper and lower case letters", test: (p) => /[a-z]/.test(p) && /[A-Z]/.test(p) },
    { key: "num", label: "At least one number", test: (p) => /\d/.test(p) },
    { key: "sym", label: "At least one symbol", test: (p) => /[^A-Za-z0-9]/.test(p) },
];
const STRENGTH = ["Too short", "Weak", "Fair", "Good", "Strong"];

const MIN = 60 * 1000;
const HR = 60 * MIN;
const NOW = Date.now();
const minsAgo = (m) => new Date(NOW - m * MIN).toISOString();

/* ------------------------------ sample data ------------------------------ */

const sampleUser = {
    fullName: "Aisyah Rahman",
    email: "aisyah.rahman@unimap.edu.my",
    roleName: "COE-UAS Content Admin",
    siteName: "COE-UAS",
    status: "active",
    mustChangePassword: false,
    twoFactorEnabled: false,
    lastLoginAt: minsAgo(35),
    createdAt: minsAgo(60 * 24 * 210),
};

const mod = (module, actions) => ({ module, actions });
const CONTENT = ["view", "create", "update", "delete", "publish"];
const samplePermissions = [
    mod("Home Page", CONTENT),
    mod("About", CONTENT),
    mod("People", CONTENT),
    mod("Research and Innovation", CONTENT),
    mod("Publications and Impact", [...CONTENT, "export"]),
    mod("Facilities and Services", CONTENT),
    mod("Engagement", CONTENT),
    mod("Contact and Enquiries", ["view", "update", "export"]),
    mod("Archive Taxonomy", ["view", "create", "update", "delete"]),
    mod("Media Library", ["view", "create", "update", "delete"]),
    mod("Navigation and Settings", ["view", "update", "publish"]),
];

const sampleSignins = [
    { id: 1, at: minsAgo(35), ip: "175.139.20.41", device: "Chrome on Windows", ok: true },
    { id: 2, at: minsAgo(60 * 26), ip: "175.139.20.41", device: "Chrome on Windows", ok: true },
    { id: 3, at: minsAgo(60 * 49), ip: "60.50.112.9", device: "Safari on iPhone", ok: false },
    { id: 4, at: minsAgo(60 * 50), ip: "60.50.112.9", device: "Safari on iPhone", ok: true },
    { id: 5, at: minsAgo(60 * 24 * 4), ip: "175.139.20.41", device: "Chrome on Windows", ok: true },
];

const sampleActivity = [
    { id: 14, action: "LOGIN", module: "auth", entityType: "users", entityLabel: "Signed in to the COE-UAS workspace", at: minsAgo(35), ip: "175.139.20.41", oldValues: null, newValues: null },
    { id: 13, action: "PUBLISH", module: "settings", entityType: "site_settings", entityLabel: "Header menu", at: minsAgo(60 * 25), ip: "175.139.20.41", oldValues: { status: "draft" }, newValues: { status: "published" } },
    { id: 12, action: "UPDATE", module: "settings", entityType: "menu_items", entityLabel: "Header menu: Contact us", at: minsAgo(60 * 25 + 12), ip: "175.139.20.41", oldValues: { label: "Contact", is_button: false }, newValues: { label: "Contact us", is_button: true } },
    { id: 11, action: "PUBLISH", module: "about", entityType: "pages", entityLabel: "About COE-UAS", at: minsAgo(60 * 26), ip: "175.139.20.41", oldValues: { status: "draft" }, newValues: { status: "published" } },
    { id: 10, action: "UPDATE", module: "about", entityType: "timeline_events", entityLabel: "Training programme launched", at: minsAgo(60 * 27), ip: "175.139.20.41", oldValues: { event_year: 2019, is_major: false }, newValues: { event_year: 2020, is_major: true } },
    { id: 9, action: "CREATE", module: "engagement", entityType: "posts", entityLabel: "Training programme opens for 2027", at: minsAgo(60 * 28), ip: "175.139.20.41", oldValues: null, newValues: { title: "Training programme opens for 2027", post_type: "news", status: "draft" } },
    { id: 8, action: "LOGOUT", module: "auth", entityType: "users", entityLabel: "Signed out", at: minsAgo(60 * 30), ip: "175.139.20.41", oldValues: null, newValues: null },
    { id: 7, action: "LOGIN", module: "auth", entityType: "users", entityLabel: "Signed in to the COE-UAS workspace", at: minsAgo(60 * 50), ip: "60.50.112.9", oldValues: null, newValues: null },
    { id: 6, action: "DELETE", module: "media", entityType: "media_assets", entityLabel: "old-banner.jpg", at: minsAgo(60 * 24 * 3), ip: "175.139.20.41", oldValues: { original_name: "old-banner.jpg", file_size: 1480221 }, newValues: null },
    { id: 5, action: "EXPORT", module: "publications", entityType: "publications", entityLabel: "Publications list (CSV)", at: minsAgo(60 * 24 * 4), ip: "175.139.20.41", oldValues: null, newValues: null },
    { id: 4, action: "UPDATE", module: "people", entityType: "members", entityLabel: "Dr. Nurul Huda", at: minsAgo(60 * 24 * 4 + 40), ip: "175.139.20.41", oldValues: { designation: "Lecturer" }, newValues: { designation: "Senior Lecturer" } },
    { id: 3, action: "ACCESS_DENIED", module: "auth", entityType: "routes", entityLabel: "Tried to open the Super Admin console", at: minsAgo(60 * 24 * 6), ip: "175.139.20.41", oldValues: null, newValues: null },
    { id: 2, action: "UNPUBLISH", module: "engagement", entityType: "posts", entityLabel: "Open day 2025", at: minsAgo(60 * 24 * 9), ip: "175.139.20.41", oldValues: { status: "published" }, newValues: { status: "draft" } },
    { id: 1, action: "RESTORE", module: "media", entityType: "media_assets", entityLabel: "hangar-night.jpg", at: minsAgo(60 * 24 * 12), ip: "175.139.20.41", oldValues: { deleted_at: "removed" }, newValues: { deleted_at: null } },
];

/* ------------------------------- helpers -------------------------------- */

function timeAgo(iso) {
    if (!iso) return "never";
    const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / MIN));
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins} min ago`;
    const hrs = Math.round(mins / 60);
    if (hrs < 24) return `${hrs} hr ago`;
    const days = Math.round(hrs / 24);
    return `${days} day${days === 1 ? "" : "s"} ago`;
}

const fmtDate = (iso) => (iso ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "");
const fmtTime = (iso) => (iso ? new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : "");
const fmtFull = (iso) => (iso ? `${fmtDate(iso)}, ${fmtTime(iso)}` : "Never");

function dayLabel(iso) {
    const d = new Date(iso);
    const start = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
    const diff = Math.round((start(new Date()) - start(d)) / (24 * HR));
    if (diff === 0) return "Today";
    if (diff === 1) return "Yesterday";
    return d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

const dayKey = (iso) => new Date(iso).toDateString();
const initialsOf = (name = "") => name.split(" ").filter((w) => /^[A-Za-z]/.test(w) && !/\.$/.test(w)).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "?";
const passed = (pw) => RULES.filter((r) => r.test(pw)).length;
const humanise = (k) => k.replace(/_/g, " ");

function diffOf(e) {
    const o = e.oldValues || {};
    const n = e.newValues || {};
    return [...new Set([...Object.keys(o), ...Object.keys(n)])]
        .filter((k) => JSON.stringify(o[k]) !== JSON.stringify(n[k]))
        .map((k) => ({ field: humanise(k), from: o[k], to: n[k] }));
}
const showVal = (v) => (v === undefined || v === null || v === "" ? "empty" : typeof v === "object" ? JSON.stringify(v) : String(v));

/* -------------------------------- icons ---------------------------------- */

function Icon({ name, size = 18 }) {
    const p = {
        user: (<><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>),
        lock: (<><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></>),
        shield: <path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z M9 12l2 2 4-4" />,
        eye: (<><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></>),
        eyeoff: <path d="M3 3l18 18M10.6 6.1A9.6 9.6 0 0 1 12 6c6 0 10 6 10 6a17 17 0 0 1-3.2 3.9M6.6 7.6A16.6 16.6 0 0 0 2 12s4 6 10 6a9.7 9.7 0 0 0 4-.9M9.9 9.9a3 3 0 0 0 4.2 4.2" />,
        check: <path d="m5 12 5 5 9-10" />,
        close: <path d="M18 6 6 18M6 6l12 12" />,
        alert: (<><path d="M12 3 2 20h20z" /><path d="M12 10v4M12 17h.01" /></>),
        logout: <path d="M9 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h4M16 8l4 4-4 4M20 12H9" />,
        search: (<><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>),
        down: <path d="m6 10 6 6 6-6" />,
        up: <path d="m6 14 6-6 6 6" />,
        device: (<><rect x="3" y="5" width="18" height="12" rx="2" /><path d="M8 21h8M12 17v4" /></>),
        clock: (<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>),
    }[name];
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            {p}
        </svg>
    );
}

/* ------------------------------ small parts ------------------------------ */

function Field({ label, value, onChange, error, hint, type = "text", max, readOnly, autoComplete, right, id }) {
    const auto = useId();
    const fid = id || auto;
    const errId = `${fid}-err`;
    return (
        <div className={`ac-field ${error ? "has-error" : ""}`}>
            <label className="ac-field-top" htmlFor={fid}>
                <span>{label}</span>
                {max && <small className={(value || "").length > max ? "is-over" : ""}>{(value || "").length}/{max}</small>}
            </label>
            <div className="ac-input-wrap">
                <input
                    id={fid}
                    className={`ac-input ${readOnly ? "is-readonly" : ""}`}
                    type={type}
                    value={value ?? ""}
                    readOnly={readOnly}
                    autoComplete={autoComplete}
                    aria-invalid={error ? "true" : undefined}
                    aria-describedby={error ? errId : undefined}
                    onChange={(e) => onChange?.(e.target.value)}
                />
                {right}
            </div>
            {hint && !error && <em className="ac-hint">{hint}</em>}
            {error && <em className="ac-error" id={errId}><Icon name="alert" size={13} /> {error}</em>}
        </div>
    );
}

function PasswordField({ label, value, onChange, error, hint, autoComplete }) {
    const [shown, setShown] = useState(false);
    return (
        <Field
            label={label}
            value={value}
            onChange={onChange}
            error={error}
            hint={hint}
            autoComplete={autoComplete}
            type={shown ? "text" : "password"}
            right={
                <button type="button" className="ac-eye" aria-label={shown ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`} aria-pressed={shown} onClick={() => setShown((v) => !v)}>
                    <Icon name={shown ? "eyeoff" : "eye"} size={17} />
                </button>
            }
        />
    );
}

function Switch({ checked, onChange, label, disabled }) {
    return (
        <label className={`ac-switch ${disabled ? "is-disabled" : ""}`}>
            <input type="checkbox" role="switch" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
            <i aria-hidden="true" />
            <span>{label}</span>
        </label>
    );
}

function Card({ title, text, icon, children, id }) {
    return (
        <section className="ac-card" id={id}>
            <header className="ac-card-head">
                <span className="ac-card-icon"><Icon name={icon} size={19} /></span>
                <div>
                    <h2>{title}</h2>
                    {text && <p>{text}</p>}
                </div>
            </header>
            {children}
        </section>
    );
}

/* ------------------------------ account tab ------------------------------ */

function ProfileCard({ user, name, setName, error, onSave, onReset, busy }) {
    const dirty = name.trim() !== user.fullName;
    return (
        <Card title="Profile" text="How you appear to other administrators and in the activity log." icon="user">
            <div className="ac-me">
                <span className="ac-avatar" aria-hidden="true">{initialsOf(user.fullName)}</span>
                <div className="ac-me-text">
                    <strong>{user.fullName}</strong>
                    <small>{user.email}</small>
                    <div className="ac-pills">
                        <span className="ac-pill is-info">{user.roleName}</span>
                        <span className="ac-pill">{user.siteName} workspace</span>
                        <span className={`ac-pill ${user.status === "active" ? "is-ok" : "is-warn"}`}>{user.status === "active" ? "Active" : user.status}</span>
                    </div>
                </div>
            </div>

            <div className="ac-grid-2">
                <Field label="Full name" max={150} value={name} onChange={setName} error={error} autoComplete="name" />
                <Field label="Email" value={user.email} readOnly hint="Your sign-in email. Ask a Super Admin to change it." />
            </div>

            <dl className="ac-facts">
                <div><dt>Last sign-in</dt><dd>{fmtFull(user.lastLoginAt)}</dd></div>
                <div><dt>Account created</dt><dd>{fmtDate(user.createdAt)}</dd></div>
                <div><dt>Role</dt><dd>{user.roleName}</dd></div>
                <div><dt>Workspace</dt><dd>{user.siteName}</dd></div>
            </dl>

            <div className="ac-actions">
                <button type="button" className="ac-btn-outline" onClick={onReset} disabled={!dirty || busy}>Reset</button>
                <button type="button" className="ac-btn-dark" onClick={onSave} disabled={!dirty || busy}>{busy ? "Saving..." : "Save profile"}</button>
            </div>
        </Card>
    );
}

function PasswordCard({ pw, setPw, errors, onSubmit, busy, forced }) {
    const score = passed(pw.next);
    const allOk = score === RULES.length;
    const level = pw.next ? (pw.next.length < 6 ? 0 : score) : 0;
    return (
        <Card id="ac-password" title="Password" text="Choose a password you do not use anywhere else. Changing it keeps you signed in on this device." icon="lock">
            {forced && (
                <p className="ac-banner" role="alert"><Icon name="alert" size={16} /><span>An administrator asked you to set a new password. Change it now to continue working.</span></p>
            )}
            <div className="ac-stack">
                <PasswordField label="Current password" value={pw.current} onChange={(v) => setPw((p) => ({ ...p, current: v }))} error={errors.current} autoComplete="current-password" />
                <PasswordField label="New password" value={pw.next} onChange={(v) => setPw((p) => ({ ...p, next: v }))} error={errors.next} autoComplete="new-password" />

                <div className="ac-strength" aria-live="polite">
                    <div className="ac-meter" data-level={level} aria-hidden="true"><i /><i /><i /><i /></div>
                    <small>{pw.next ? `Strength: ${STRENGTH[level]}` : "Strength appears as you type"}</small>
                </div>
                <ul className="ac-rules">
                    {RULES.map((r) => {
                        const ok = r.test(pw.next);
                        return <li key={r.key} className={ok ? "is-ok" : ""}><Icon name={ok ? "check" : "close"} size={13} /> {r.label}</li>;
                    })}
                </ul>

                <PasswordField label="Confirm new password" value={pw.confirm} onChange={(v) => setPw((p) => ({ ...p, confirm: v }))} error={errors.confirm} autoComplete="new-password" />
            </div>
            <div className="ac-actions">
                <button type="button" className="ac-btn-dark" onClick={onSubmit} disabled={busy || !pw.current || !allOk || !pw.confirm}>{busy ? "Updating..." : "Change password"}</button>
            </div>
            <p className="ac-fine">Forgot your current password? Sign out and use “Forgot password” on the sign-in page to get a reset link by email.</p>
        </Card>
    );
}

function SecurityCard({ user, onToggle2fa, signins, onLogout }) {
    return (
        <Card title="Security" text="Extra protection and your latest sign-ins." icon="shield">
            <div className="ac-row">
                <div className="ac-row-text">
                    <strong>Two-factor sign-in</strong>
                    <small>{user.twoFactorEnabled ? "On. A code is asked for after your password." : "Off. Turn it on to ask for a code after your password."}</small>
                </div>
                <Switch checked={user.twoFactorEnabled} onChange={onToggle2fa} label={user.twoFactorEnabled ? "On" : "Off"} />
            </div>

            <div className="ac-row">
                <div className="ac-row-text">
                    <strong>This device</strong>
                    <small>You are signed out automatically after a period of inactivity.</small>
                </div>
                <button type="button" className="ac-btn-small" onClick={onLogout}><Icon name="logout" size={15} /> Sign out</button>
            </div>

            <div className="ac-block">
                <h3>Recent sign-ins</h3>
                {signins.length === 0 && <p className="ac-empty">No sign-ins recorded yet.</p>}
                <ol className="ac-signins">
                    {signins.map((s) => (
                        <li key={s.id}>
                            <span className="ac-device"><Icon name="device" size={16} /></span>
                            <div>
                                <strong>{s.device || "Unknown device"}</strong>
                                <small>{s.ip} · {timeAgo(s.at)}</small>
                            </div>
                            <span className={`ac-pill ${s.ok ? "is-ok" : "is-danger"}`}>{s.ok ? "Signed in" : "Failed"}</span>
                        </li>
                    ))}
                </ol>
                <small className="ac-fine">If you see a sign-in you do not recognise, change your password and tell a Super Admin.</small>
            </div>
        </Card>
    );
}

function AccessCard({ permissions, roleName }) {
    return (
        <Card title="What I can do here" text={`Your access as ${roleName}. It is set by a Super Admin and cannot be changed on this page.`} icon="lock">
            <ul className="ac-access">
                {permissions.map((p) => (
                    <li key={p.module}>
                        <strong>{p.module}</strong>
                        <span>{p.actions.map((a) => <b key={a} className="ac-chip">{PERM_LABEL[a] || a}</b>)}</span>
                    </li>
                ))}
            </ul>
            <p className="ac-fine">Restoring deleted content, deleting it permanently, and exporting the audit log are done by a Super Admin.</p>
        </Card>
    );
}

/* ------------------------------ activity tab ------------------------------ */

function Entry({ e, open, onToggle }) {
    const changes = diffOf(e);
    const detailId = useId();
    const canOpen = changes.length > 0 || e.userAgent;
    return (
        <li className={`ac-entry ${open ? "is-open" : ""}`}>
            <div className="ac-entry-main">
                <span className={`ac-pill ${ACTION_TONE[e.action] || "is-info"}`}>{ACTION_LABEL[e.action] || e.action}</span>
                <div className="ac-entry-text">
                    <strong>{e.entityLabel || e.entityType}</strong>
                    <small>{moduleLabel(e.module)} · {fmtTime(e.at)}{e.ip ? ` · ${e.ip}` : ""}</small>
                </div>
                {canOpen && (
                    <button type="button" className="ac-btn-small" aria-expanded={open} aria-controls={detailId} onClick={onToggle}>
                        {open ? "Hide" : "Details"} <Icon name={open ? "up" : "down"} size={14} />
                    </button>
                )}
            </div>
            {open && (
                <div className="ac-detail" id={detailId}>
                    {changes.length > 0 ? (
                        <table>
                            <thead><tr><th scope="col">Field</th><th scope="col">Before</th><th scope="col">After</th></tr></thead>
                            <tbody>
                                {changes.map((c) => (
                                    <tr key={c.field}><th scope="row">{c.field}</th><td className="is-before">{showVal(c.from)}</td><td className="is-after">{showVal(c.to)}</td></tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <p className="ac-fine">No field changes were recorded for this entry.</p>
                    )}
                    {e.userAgent && <small className="ac-fine">{e.userAgent}</small>}
                </div>
            )}
        </li>
    );
}

function ActivityTab({ activity }) {
    const [q, setQ] = useState("");
    const [action, setAction] = useState("");
    const [module, setModule] = useState("");
    const [from, setFrom] = useState("");
    const [to, setTo] = useState("");
    const [count, setCount] = useState(PAGE_SIZE);
    const [openIds, setOpenIds] = useState(() => new Set());

    const modules = useMemo(() => [...new Set(activity.map((a) => a.module).filter(Boolean))].sort(), [activity]);
    const filtered = useMemo(() => {
        const text = q.trim().toLowerCase();
        const start = from ? new Date(`${from}T00:00:00`).getTime() : null;
        const end = to ? new Date(`${to}T23:59:59`).getTime() : null;
        return [...activity]
            .sort((a, b) => new Date(b.at) - new Date(a.at))
            .filter((a) => {
                const t = new Date(a.at).getTime();
                return (!action || a.action === action)
                    && (!module || a.module === module)
                    && (start === null || t >= start)
                    && (end === null || t <= end)
                    && (!text || `${a.entityLabel} ${a.entityType} ${moduleLabel(a.module)} ${ACTION_LABEL[a.action] || a.action}`.toLowerCase().includes(text));
            });
    }, [activity, q, action, module, from, to]);

    useEffect(() => { setCount(PAGE_SIZE); }, [q, action, module, from, to]);

    const week = activity.filter((a) => Date.now() - new Date(a.at).getTime() < 7 * 24 * HR).length;
    const publishes = activity.filter((a) => a.action === "PUBLISH").length;
    const filtering = Boolean(q || action || module || from || to);
    const visible = filtered.slice(0, count);

    const groups = [];
    visible.forEach((a) => {
        const k = dayKey(a.at);
        const last = groups[groups.length - 1];
        if (last && last.key === k) last.rows.push(a);
        else groups.push({ key: k, label: dayLabel(a.at), rows: [a] });
    });

    const toggle = (id) => setOpenIds((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
    const clear = () => { setQ(""); setAction(""); setModule(""); setFrom(""); setTo(""); };

    return (
        <div className="ac-activity">
            <div className="ac-stats">
                <div><b>{activity.length}</b><span>Entries in my log</span></div>
                <div><b>{week}</b><span>In the last 7 days</span></div>
                <div><b>{publishes}</b><span>Times I published</span></div>
            </div>

            <section className="ac-card">
                <header className="ac-card-head">
                    <span className="ac-card-icon"><Icon name="clock" size={19} /></span>
                    <div>
                        <h2>My activity log</h2>
                        <p>Everything you did in the COE-UAS workspace, newest first. This log is read only and kept by the system.</p>
                    </div>
                </header>

                <div className="ac-filters" role="search">
                    <label className="ac-search">
                        <Icon name="search" size={16} />
                        <input type="search" placeholder="Search what I changed" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search my activity" />
                    </label>
                    <label className="ac-select">
                        <span>Action</span>
                        <select value={action} onChange={(e) => setAction(e.target.value)}>
                            <option value="">All actions</option>
                            {ACTIONS.map((a) => <option key={a} value={a}>{ACTION_LABEL[a]}</option>)}
                        </select>
                    </label>
                    <label className="ac-select">
                        <span>Module</span>
                        <select value={module} onChange={(e) => setModule(e.target.value)}>
                            <option value="">All modules</option>
                            {modules.map((m) => <option key={m} value={m}>{moduleLabel(m)}</option>)}
                        </select>
                    </label>
                    <label className="ac-select">
                        <span>From</span>
                        <input type="date" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} />
                    </label>
                    <label className="ac-select">
                        <span>To</span>
                        <input type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} />
                    </label>
                    {filtering && <button type="button" className="ac-btn-small" onClick={clear}><Icon name="close" size={14} /> Clear</button>}
                </div>

                <p className="ac-count" aria-live="polite">{filtered.length} {filtered.length === 1 ? "entry" : "entries"}{filtering ? " match your filters" : ""}</p>

                {filtered.length === 0 && (
                    <p className="ac-empty">{filtering ? "Nothing matches these filters. Try a wider date range or clear them." : "Nothing recorded yet. Your actions appear here as you work."}</p>
                )}

                {groups.map((g) => (
                    <div key={g.key} className="ac-day">
                        <h3>{g.label}</h3>
                        <ol className="ac-entries">
                            {g.rows.map((e) => <Entry key={e.id} e={e} open={openIds.has(e.id)} onToggle={() => toggle(e.id)} />)}
                        </ol>
                    </div>
                ))}

                {filtered.length > count && (
                    <div className="ac-more">
                        <button type="button" className="ac-btn-outline" onClick={() => setCount((c) => c + PAGE_SIZE)}>Show {Math.min(PAGE_SIZE, filtered.length - count)} more</button>
                    </div>
                )}
            </section>
        </div>
    );
}

/* -------------------------------- the page -------------------------------- */

export default function AdminCOEUASAccount() {
    const { props, url } = usePage();
    const live = Boolean(props.account?.user);
    const dialogTitleId = useId();

    const seed = useRef(
        live
            ? { user: props.account.user, permissions: props.account.permissions || [], signins: props.account.signins || [], activity: props.account.activity || [] }
            : { user: sampleUser, permissions: samplePermissions, signins: sampleSignins, activity: sampleActivity }
    ).current;

    const [localUser, setLocalUser] = useState(seed.user);
    const user = live ? props.account.user : localUser;
    const permissions = live ? props.account.permissions || [] : seed.permissions;
    const signins = live ? props.account.signins || [] : seed.signins;
    const activity = live ? props.account.activity || [] : seed.activity;

    const wantedTab = () => {
        const w = props.section || (url || "").match(/\/(account|activity)(?:[/?#]|$)/)?.[1];
        return w === "activity" ? "activity" : "account";
    };
    const [tab, setTab] = useState(wantedTab);
    useEffect(() => { setTab(wantedTab()); }, [props.section, url]);

    const [name, setName] = useState(user.fullName);
    useEffect(() => { setName(user.fullName); }, [user.fullName]);

    const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
    const [pwSubmitted, setPwSubmitted] = useState(false);
    const [busy, setBusy] = useState(null); // "profile" | "password" | "2fa" | null
    const [dialog, setDialog] = useState(null); // { type: "2fa", enable }
    const [toast, setToast] = useState(null);
    const [nameTouched, setNameTouched] = useState(false);
    const busyRef = useRef(false);

    const serverErrors = props.errors || {};
    const nameError = (nameTouched && !name.trim() ? "Write your full name." : null)
        || (name.length > 150 ? "Keep your name under 150 characters." : null)
        || serverErrors.full_name || null;

    const pwErrors = useMemo(() => {
        const e = {};
        if (pwSubmitted) {
            if (!pw.current) e.current = "Enter your current password.";
            if (passed(pw.next) < RULES.length) e.next = "The new password does not meet every rule yet.";
            else if (pw.next === pw.current) e.next = "Choose a password different from the current one.";
            if (pw.confirm !== pw.next) e.confirm = "The two passwords do not match.";
        }
        if (serverErrors.current_password) e.current = serverErrors.current_password;
        if (serverErrors.password) e.next = serverErrors.password;
        if (serverErrors.password_confirmation) e.confirm = serverErrors.password_confirmation;
        return e;
    }, [pw, pwSubmitted, serverErrors.current_password, serverErrors.password, serverErrors.password_confirmation]);

    const dirty = name.trim() !== user.fullName || Boolean(pw.current || pw.next || pw.confirm);

    useEffect(() => {
        if (!toast) return undefined;
        const t = setTimeout(() => setToast(null), 5000);
        return () => clearTimeout(t);
    }, [toast]);

    /* warn before leaving with unsaved edits (moving between Profile and Activity is allowed) */
    useEffect(() => {
        const beforeUnload = (e) => { if (dirty) { e.preventDefault(); e.returnValue = ""; } };
        window.addEventListener("beforeunload", beforeUnload);
        const off = router.on("before", (event) => {
            const target = event?.detail?.visit?.url?.pathname || "";
            if (target === `${BASE}/account` || target === `${BASE}/activity`) return undefined;
            if (dirty && !busyRef.current && !window.confirm("You have unsaved changes. Leave this page and discard them?")) return false;
            return undefined;
        });
        return () => { window.removeEventListener("beforeunload", beforeUnload); if (typeof off === "function") off(); };
    }, [dirty]);

    /* an administrator forced a password change: open on the password card */
    useEffect(() => {
        if (user.mustChangePassword) document.getElementById("ac-password")?.scrollIntoView({ block: "center" });
    }, [user.mustChangePassword]);

    const goTab = (key) => {
        setTab(key);
        router.visit(`${BASE}/${key}`, { preserveState: true, preserveScroll: true, replace: true });
    };

    const start = (what) => { setBusy(what); busyRef.current = true; };
    const finish = () => { setBusy(null); busyRef.current = false; };

    const saveProfile = () => {
        setNameTouched(true);
        if (!name.trim() || name.length > 150) return;
        start("profile");
        const done = () => {
            if (!live) setLocalUser((u) => ({ ...u, fullName: name.trim() }));
            setToast({ tone: "ok", text: "Profile saved." });
            finish();
        };
        if (live) router.put(ENDPOINTS.profile, { full_name: name.trim() }, { preserveScroll: true, onSuccess: done, onError: () => { finish(); setToast({ tone: "error", text: "The profile was not saved. Check the highlighted field." }); } });
        else setTimeout(done, 350);
    };

    const submitPassword = () => {
        setPwSubmitted(true);
        const bad = !pw.current || passed(pw.next) < RULES.length || pw.next === pw.current || pw.confirm !== pw.next;
        if (bad) { setToast({ tone: "error", text: "Fix the password fields before saving." }); return; }
        start("password");
        const done = () => {
            setPw({ current: "", next: "", confirm: "" });
            setPwSubmitted(false);
            if (!live) setLocalUser((u) => ({ ...u, mustChangePassword: false }));
            setToast({ tone: "ok", text: "Password changed. Use the new one next time you sign in." });
            finish();
        };
        if (live) router.put(ENDPOINTS.password, { current_password: pw.current, password: pw.next, password_confirmation: pw.confirm }, { preserveScroll: true, onSuccess: done, onError: () => { finish(); setToast({ tone: "error", text: "The password was not changed. Check the highlighted fields." }); } });
        else setTimeout(done, 400);
    };

    const confirm2fa = () => {
        const enable = dialog.enable;
        start("2fa");
        const done = () => {
            if (!live) setLocalUser((u) => ({ ...u, twoFactorEnabled: enable }));
            setDialog(null);
            setToast({ tone: "ok", text: enable ? "Two-factor sign-in is on." : "Two-factor sign-in is off." });
            finish();
        };
        if (live) router.post(ENDPOINTS.twoFactor, { enabled: enable }, { preserveScroll: true, onSuccess: done, onError: () => { finish(); setDialog(null); setToast({ tone: "error", text: "Nothing was changed. Try again." }); } });
        else setTimeout(done, 350);
    };

    const logout = () => {
        if (dirty && !window.confirm("You have unsaved changes. Sign out and discard them?")) return;
        busyRef.current = true;
        router.post(ENDPOINTS.logout);
    };

    return (
        <div className="coeuas-account">
            <div className="ac-heading">
                <div>
                    <h1>My Account</h1>
                    <p>Your profile, password and security, and a record of what you have done in the COE-UAS workspace.</p>
                </div>
                <button type="button" className="ac-btn-outline" onClick={logout}><Icon name="logout" size={16} /> Sign out</button>
            </div>

            {!live && (
                <p className="ac-note"><Icon name="alert" size={16} /><span>Sample data. Every control works, but nothing is stored until your controller sends the <b>account</b> prop.</span></p>
            )}

            <div className="ac-tabs" role="tablist" aria-label="My account">
                {TABS.map(([key, label]) => (
                    <button key={key} type="button" role="tab" aria-selected={tab === key} className={tab === key ? "is-active" : ""} onClick={() => goTab(key)}>
                        {label}
                        {key === "activity" && <span className="ac-badge">{activity.length}</span>}
                        {key === "account" && dirty && <span className="ac-dot" title="Unsaved changes" />}
                    </button>
                ))}
            </div>

            {tab === "account" && (
                <div className="ac-layout">
                    <div className="ac-col">
                        <ProfileCard
                            user={user}
                            name={name}
                            setName={(v) => { setName(v); setNameTouched(true); }}
                            error={nameError}
                            busy={busy === "profile"}
                            onSave={saveProfile}
                            onReset={() => { setName(user.fullName); setNameTouched(false); }}
                        />
                        <PasswordCard pw={pw} setPw={setPw} errors={pwErrors} onSubmit={submitPassword} busy={busy === "password"} forced={user.mustChangePassword} />
                    </div>
                    <div className="ac-col">
                        <SecurityCard user={user} signins={signins} onLogout={logout} onToggle2fa={(enable) => setDialog({ type: "2fa", enable })} />
                        <AccessCard permissions={permissions} roleName={user.roleName} />
                    </div>
                </div>
            )}

            {tab === "activity" && <ActivityTab activity={activity} />}

            {dialog?.type === "2fa" && (
                <div className="ac-overlay" onMouseDown={(e) => e.target === e.currentTarget && !busy && setDialog(null)}>
                    <div className="ac-dialog" role="alertdialog" aria-modal="true" aria-labelledby={dialogTitleId}>
                        <span className="ac-dialog-icon"><Icon name="shield" size={22} /></span>
                        <h2 id={dialogTitleId}>{dialog.enable ? "Turn on two-factor sign-in?" : "Turn off two-factor sign-in?"}</h2>
                        <p>{dialog.enable ? "After your password you will be asked for a code each time you sign in. You will be guided through the setup next." : "Your account will be protected by your password only. We recommend keeping two-factor sign-in on."}</p>
                        <div className="ac-dialog-actions">
                            <button type="button" className="ac-btn-outline" onClick={() => setDialog(null)} disabled={busy === "2fa"} autoFocus>Cancel</button>
                            <button type="button" className={dialog.enable ? "ac-btn-dark" : "ac-btn-danger"} onClick={confirm2fa} disabled={busy === "2fa"}>
                                {busy === "2fa" ? "Working..." : dialog.enable ? "Turn on" : "Turn off"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {toast && (
                <div className={`ac-toast is-${toast.tone}`} role="status">
                    <Icon name={toast.tone === "error" ? "alert" : "check"} size={16} />
                    <span>{toast.text}</span>
                    <button type="button" aria-label="Dismiss" onClick={() => setToast(null)}><Icon name="close" size={14} /></button>
                </div>
            )}
        </div>
    );
}

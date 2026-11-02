import { useEffect, useState } from "react";
import { Head, Link, router, usePage } from "@inertiajs/react";
// Adjust this path to wherever you placed adminRoutes.js
import { ROUTES } from "../../Components/Admin-Components/adminRoutes";
import "../../../css/admin-css/admin-account.css";

/* ------------------------------------------------------------------
   MY ACCOUNT (Super Admin)

   Source: Admin CMS design document
     - Use case 2.1, band "Access and Account (all roles)":
       Update My Profile, Change Password, Reset Password,
       Logout / Session Timeout, Role-Based Redirect
     - ERD-1: users, roles, password_resets, login_attempts, audit_logs

   DATA SHAPE (return as Inertia prop `account`):
     user   : { id, full_name, email, status (active|suspended|disabled),
                two_factor_enabled, must_change_password,
                last_login_at, created_at }
     role   : { name, scope (GLOBAL|SITE), landing_route }
     logins : [{ id, was_successful, ip_address, user_agent, created_at }]
              (login_attempts for this user, newest first)
     activity: [{ id, action, module, entity_label, created_at }]
              (audit_logs for this user, newest first)

   ENDPOINTS used in live mode (all under ROUTES.account):
     PUT    {account}                  full_name, email
     PUT    {account}/password         current_password, password, password_confirmation
     POST   {account}/password-reset   email me a reset link (password_resets)
     PATCH  {account}/two-factor       enabled (boolean)
     POST   ROUTES.logout              sign out

   DEMO MODE: with no `account` prop the page runs on the sample data
   below, in the browser only, so every screen can be tried.
------------------------------------------------------------------- */

const minutesAgo = (m) => new Date(Date.now() - m * 60000).toISOString();

const SAMPLE = {
    user: {
        id: 1,
        full_name: "Super Administrator",
        email: "admin@perlis-sandbox.com",
        status: "active",
        two_factor_enabled: true,
        must_change_password: false,
        last_login_at: minutesAgo(26),
        created_at: "2026-01-12T09:00:00",
    },
    role: {
        name: "Super Admin",
        scope: "GLOBAL",
        landing_route: ROUTES.dashboard,
    },
    logins: [
        { id: 1, was_successful: true, ip_address: "203.0.113.24", user_agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130.0 Safari/537.36", created_at: minutesAgo(26) },
        { id: 2, was_successful: true, ip_address: "203.0.113.24", user_agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130.0 Safari/537.36", created_at: minutesAgo(60 * 28) },
        { id: 3, was_successful: false, ip_address: "198.51.100.77", user_agent: "Mozilla/5.0 (Linux; Android 14) Chrome/130.0 Mobile Safari/537.36", created_at: minutesAgo(60 * 52) },
        { id: 4, was_successful: true, ip_address: "203.0.113.24", user_agent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15", created_at: minutesAgo(60 * 76) },
    ],
    activity: [
        { id: 1, action: "LOGIN", module: "Access", entity_label: "Signed in", created_at: minutesAgo(26) },
        { id: 2, action: "RESTORE", module: "Content Trash", entity_label: "News: Sandbox Launch", created_at: minutesAgo(60 * 3) },
        { id: 3, action: "UPDATE", module: "Admin Users", entity_label: "Khairul Anuar (status)", created_at: minutesAgo(60 * 22) },
        { id: 4, action: "EXPORT", module: "Audit Logs", entity_label: "Audit log, COE-UAS scope", created_at: minutesAgo(60 * 30) },
        { id: 5, action: "LOGOUT", module: "Access", entity_label: "Signed out", created_at: minutesAgo(60 * 47) },
    ],
};

/* ------------------------------ helpers ------------------------------ */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD = 8;

const STATUS = {
    active: { label: "Active", cls: "aa-pill-active" },
    suspended: { label: "Suspended", cls: "aa-pill-suspended" },
    disabled: { label: "Disabled", cls: "aa-pill-disabled" },
};

// audit_logs.action values from ERD-1
const ACTION_LABEL = {
    CREATE: "Created",
    UPDATE: "Updated",
    DELETE: "Moved to Trash",
    RESTORE: "Restored",
    PUBLISH: "Published",
    UNPUBLISH: "Unpublished",
    LOGIN: "Signed in",
    LOGOUT: "Signed out",
    EXPORT: "Exported",
    ACCESS_DENIED: "Access denied",
};

const initialsOf = (name = "") =>
    name.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase() || "?";

function formatDateTime(value) {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleString("en-MY", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function formatDate(value) {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" });
}

function timeAgo(iso) {
    const diff = Math.max(0, Date.now() - new Date(iso).getTime());
    const min = Math.floor(diff / 60000);
    if (min < 1) return "just now";
    if (min < 60) return `${min} min ago`;
    const hours = Math.floor(min / 60);
    if (hours < 24) return `${hours} h ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? "s" : ""} ago`;
}

// Turns a raw user-agent string into something readable, e.g. "Chrome on Windows".
function deviceLabel(ua = "") {
    const browser = /Edg\//.test(ua)
        ? "Edge"
        : /Chrome\//.test(ua)
        ? "Chrome"
        : /Firefox\//.test(ua)
        ? "Firefox"
        : /Safari\//.test(ua)
        ? "Safari"
        : "Browser";
    const os = /Windows/.test(ua)
        ? "Windows"
        : /Android/.test(ua)
        ? "Android"
        : /iPhone|iPad|iOS/.test(ua)
        ? "iOS"
        : /Mac OS X|Macintosh/.test(ua)
        ? "macOS"
        : /Linux/.test(ua)
        ? "Linux"
        : "";
    return os ? `${browser} on ${os}` : browser;
}

function Icon({ name, size = 18 }) {
    const icons = {
        user: (
            <>
                <circle cx="12" cy="8" r="4" />
                <path d="M5 21a7 7 0 0 1 14 0" />
            </>
        ),
        mail: (
            <>
                <rect x="3" y="5" width="18" height="14" rx="3" />
                <path d="m4 8 8 6 8-6" />
            </>
        ),
        lock: (
            <>
                <rect x="4" y="11" width="16" height="10" rx="2" />
                <path d="M8 11V7a4 4 0 0 1 8 0v4" />
            </>
        ),
        eye: (
            <>
                <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" />
                <circle cx="12" cy="12" r="3" />
            </>
        ),
        eyeOff: (
            <>
                <path d="M3 3l18 18" />
                <path d="M10.6 5.1A9.7 9.7 0 0 1 12 5c6 0 10 7 10 7a17 17 0 0 1-3.2 3.9M6.6 6.6A16.5 16.5 0 0 0 2 12s4 7 10 7a9.6 9.6 0 0 0 4.4-1" />
                <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
            </>
        ),
        check: <path d="m5 12 5 5 9-10" />,
        close: <path d="M18 6 6 18M6 6l12 12" />,
        logout: (
            <>
                <path d="M10 17l5-5-5-5M15 12H3" />
                <path d="M12 3h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-7" />
            </>
        ),
        shield: <path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11z" />,
        activity: <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />,
        alert: (
            <>
                <path d="M12 3 2 21h20z" />
                <path d="M12 10v5M12 18h.01" />
            </>
        ),
    };

    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            {icons[name]}
        </svg>
    );
}

function PasswordField({ id, label, value, onChange, autoComplete, error, hint }) {
    const [visible, setVisible] = useState(false);

    return (
        <div className="aa-field">
            <label htmlFor={id}>{label}</label>
            <div className="aa-password">
                <input
                    id={id}
                    type={visible ? "text" : "password"}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    autoComplete={autoComplete}
                    aria-invalid={Boolean(error)}
                />
                <button
                    type="button"
                    className="aa-eye"
                    onClick={() => setVisible((v) => !v)}
                    aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
                >
                    <Icon name={visible ? "eyeOff" : "eye"} size={17} />
                </button>
            </div>
            {hint && !error && <p className="aa-hint">{hint}</p>}
            {error && <p className="aa-error">{error}</p>}
        </div>
    );
}

/* --------------------------------- page ---------------------------------- */

export default function SuperAdminAccount() {
    const { props } = usePage();
    const live = Boolean(props.account);
    const data = props.account ?? SAMPLE;
    const role = data.role;

    const [user, setUser] = useState(data.user);
    const [toast, setToast] = useState(null);
    const [busy, setBusy] = useState(null); // "profile" | "password" | "reset" | "twofactor"

    // profile form
    const [profile, setProfile] = useState({ full_name: data.user.full_name, email: data.user.email });
    const [profileErrors, setProfileErrors] = useState({});

    // password form
    const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
    const [pwErrors, setPwErrors] = useState({});

    useEffect(() => {
        if (live) {
            setUser(props.account.user);
            setProfile({ full_name: props.account.user.full_name, email: props.account.user.email });
        }
    }, [props.account]);

    useEffect(() => {
        if (!toast) return undefined;
        const timer = setTimeout(() => setToast(null), 4500);
        return () => clearTimeout(timer);
    }, [toast]);

    const status = STATUS[user.status] ?? STATUS.active;
    const profileDirty =
        profile.full_name.trim() !== user.full_name || profile.email.trim() !== user.email;

    const pwRules = [
        { ok: pw.next.length >= MIN_PASSWORD, text: `At least ${MIN_PASSWORD} characters` },
        { ok: pw.next !== "" && pw.next !== pw.current, text: "Different from your current password" },
        { ok: pw.next !== "" && pw.next === pw.confirm, text: "Both new passwords match" },
    ];
    const pwReady = pw.current !== "" && pwRules.every((rule) => rule.ok);

    /* ---------- one path for every change: server in live mode, local in demo ---------- */

    function run({ key, method, url, data: payload, local, message, onSuccess, onError }) {
        setBusy(key);

        if (!live) {
            local?.();
            setBusy(null);
            onSuccess?.();
            setToast(message);
            return;
        }

        router[method](url, payload ?? {}, {
            preserveScroll: true,
            onSuccess: () => {
                onSuccess?.();
                setToast(message);
            },
            onError: (errors) => onError?.(errors),
            onFinish: () => setBusy(null),
        });
    }

    function saveProfile(event) {
        event.preventDefault();

        const errors = {};
        if (!profile.full_name.trim()) errors.full_name = "Enter your full name.";
        if (!profile.email.trim()) errors.email = "Enter an email address.";
        else if (!EMAIL_PATTERN.test(profile.email.trim())) errors.email = "Enter a valid email address.";
        setProfileErrors(errors);
        if (Object.keys(errors).length) return;

        const payload = { full_name: profile.full_name.trim(), email: profile.email.trim() };

        run({
            key: "profile",
            method: "put",
            url: ROUTES.account,
            data: payload,
            message: "Your profile was updated.",
            local: () => setUser((u) => ({ ...u, ...payload })),
            onError: setProfileErrors,
        });
    }

    function savePassword(event) {
        event.preventDefault();
        if (!pwReady) return;

        run({
            key: "password",
            method: "put",
            url: `${ROUTES.account}/password`,
            data: {
                current_password: pw.current,
                password: pw.next,
                password_confirmation: pw.confirm,
            },
            message: "Your password was changed.",
            local: () => setUser((u) => ({ ...u, must_change_password: false })),
            onSuccess: () => {
                setPw({ current: "", next: "", confirm: "" });
                setPwErrors({});
            },
            onError: setPwErrors,
        });
    }

    function sendResetLink() {
        run({
            key: "reset",
            method: "post",
            url: `${ROUTES.account}/password-reset`,
            message: `A password reset link was emailed to ${user.email}.`,
        });
    }

    function toggleTwoFactor() {
        const next = !user.two_factor_enabled;
        run({
            key: "twofactor",
            method: "patch",
            url: `${ROUTES.account}/two-factor`,
            data: { enabled: next },
            message: next ? "Two-factor authentication is on." : "Two-factor authentication is off.",
            local: () => setUser((u) => ({ ...u, two_factor_enabled: next })),
        });
    }

    return (
        <>
            <Head title="My Account" />

            <div className="admin-account">
                {/* HEADING */}
                <div className="aa-heading">
                    <div>
                        <h1>My Account</h1>
                        <p>Update your profile, change your password and review your recent sign-ins.</p>
                    </div>

                    <button
                        type="button"
                        className="aa-btn aa-btn-outline aa-btn-large"
                        onClick={() => router.post(ROUTES.logout)}
                    >
                        <Icon name="logout" size={17} />
                        Sign Out
                    </button>
                </div>

                {/* must_change_password */}
                {user.must_change_password && (
                    <div className="aa-banner" role="alert">
                        <span className="aa-banner-icon">
                            <Icon name="alert" size={18} />
                        </span>
                        <div>
                            <strong>Change your password</strong>
                            <p>This account was set up with a temporary password. Choose a new one below.</p>
                        </div>
                    </div>
                )}

                <div className="aa-grid">
                    {/* IDENTITY */}
                    <article className="aa-card aa-identity">
                        <div className="aa-avatar">{initialsOf(user.full_name)}</div>
                        <h2>{user.full_name}</h2>
                        <p className="aa-email">{user.email}</p>

                        <div className="aa-identity-pills">
                            <span className="aa-pill aa-pill-role">{role.name}</span>
                            <span className={`aa-pill ${status.cls}`}>{status.label}</span>
                        </div>

                        <dl className="aa-facts">
                            <div>
                                <dt>Access</dt>
                                <dd>{role.scope === "GLOBAL" ? "All sites and the Super Admin Console" : "One site only"}</dd>
                            </div>
                            <div>
                                <dt>Opens at</dt>
                                <dd>{role.landing_route}</dd>
                            </div>
                            <div>
                                <dt>Two-factor</dt>
                                <dd>{user.two_factor_enabled ? "On" : "Off"}</dd>
                            </div>
                            <div>
                                <dt>Last sign-in</dt>
                                <dd>{formatDateTime(user.last_login_at) ?? "Never"}</dd>
                            </div>
                            <div>
                                <dt>Member since</dt>
                                <dd>{formatDate(user.created_at)}</dd>
                            </div>
                        </dl>
                    </article>

                    {/* PROFILE */}
                    <article className="aa-card aa-profile">
                        <header className="aa-card-head">
                            <div>
                                <h3>Profile</h3>
                                <p>Your name and the email you sign in with. Changes are saved to the audit log.</p>
                            </div>
                        </header>

                        <form className="aa-form" onSubmit={saveProfile} noValidate>
                            <div className="aa-field">
                                <label htmlFor="aa-name">Full name</label>
                                <input
                                    id="aa-name"
                                    type="text"
                                    maxLength={150}
                                    value={profile.full_name}
                                    onChange={(e) => {
                                        setProfile({ ...profile, full_name: e.target.value });
                                        setProfileErrors({ ...profileErrors, full_name: undefined });
                                    }}
                                    autoComplete="name"
                                    aria-invalid={Boolean(profileErrors.full_name)}
                                />
                                {profileErrors.full_name && <p className="aa-error">{profileErrors.full_name}</p>}
                            </div>

                            <div className="aa-field">
                                <label htmlFor="aa-email">Email</label>
                                <input
                                    id="aa-email"
                                    type="email"
                                    maxLength={190}
                                    value={profile.email}
                                    onChange={(e) => {
                                        setProfile({ ...profile, email: e.target.value });
                                        setProfileErrors({ ...profileErrors, email: undefined });
                                    }}
                                    autoComplete="email"
                                    aria-invalid={Boolean(profileErrors.email)}
                                />
                                {profileErrors.email && <p className="aa-error">{profileErrors.email}</p>}
                                {!profileErrors.email && profile.email.trim() !== user.email && (
                                    <p className="aa-hint">You will sign in with the new email from your next sign-in.</p>
                                )}
                            </div>

                            <div className="aa-actions">
                                <button
                                    type="button"
                                    className="aa-btn aa-btn-outline"
                                    onClick={() => {
                                        setProfile({ full_name: user.full_name, email: user.email });
                                        setProfileErrors({});
                                    }}
                                    disabled={!profileDirty}
                                >
                                    Discard changes
                                </button>
                                <button
                                    type="submit"
                                    className="aa-btn aa-btn-dark"
                                    disabled={!profileDirty || busy === "profile"}
                                >
                                    {busy === "profile" ? "Saving..." : "Save profile"}
                                </button>
                            </div>
                        </form>
                    </article>

                    {/* PASSWORD */}
                    <article className="aa-card aa-password-card">
                        <header className="aa-card-head">
                            <div>
                                <h3>Change password</h3>
                                <p>Use a password you do not use anywhere else.</p>
                            </div>
                        </header>

                        <form className="aa-form" onSubmit={savePassword} noValidate>
                            <PasswordField
                                id="aa-current"
                                label="Current password"
                                value={pw.current}
                                onChange={(value) => {
                                    setPw({ ...pw, current: value });
                                    setPwErrors({ ...pwErrors, current_password: undefined });
                                }}
                                autoComplete="current-password"
                                error={pwErrors.current_password}
                            />

                            <div className="aa-two">
                                <PasswordField
                                    id="aa-new"
                                    label="New password"
                                    value={pw.next}
                                    onChange={(value) => {
                                        setPw({ ...pw, next: value });
                                        setPwErrors({ ...pwErrors, password: undefined });
                                    }}
                                    autoComplete="new-password"
                                    error={pwErrors.password}
                                />
                                <PasswordField
                                    id="aa-confirm"
                                    label="Confirm new password"
                                    value={pw.confirm}
                                    onChange={(value) => setPw({ ...pw, confirm: value })}
                                    autoComplete="new-password"
                                />
                            </div>

                            <ul className="aa-rules" aria-label="Password requirements">
                                {pwRules.map((rule) => (
                                    <li key={rule.text} className={rule.ok ? "is-ok" : ""}>
                                        <span>
                                            <Icon name={rule.ok ? "check" : "close"} size={12} />
                                        </span>
                                        {rule.text}
                                    </li>
                                ))}
                            </ul>

                            <div className="aa-actions">
                                <button
                                    type="submit"
                                    className="aa-btn aa-btn-dark"
                                    disabled={!pwReady || busy === "password"}
                                >
                                    {busy === "password" ? "Saving..." : "Change password"}
                                </button>
                            </div>
                        </form>
                    </article>

                    {/* SECURITY */}
                    <article className="aa-card aa-security">
                        <header className="aa-card-head">
                            <div>
                                <h3>Security</h3>
                                <p>Extra protection for the account that controls every site.</p>
                            </div>
                        </header>

                        <div className="aa-switch-row">
                            <div>
                                <strong>Two-factor authentication</strong>
                                <small>Ask for a second step when you sign in.</small>
                            </div>
                            <button
                                type="button"
                                role="switch"
                                aria-checked={user.two_factor_enabled}
                                aria-label="Two-factor authentication"
                                className={`aa-switch ${user.two_factor_enabled ? "is-on" : ""}`}
                                onClick={toggleTwoFactor}
                                disabled={busy === "twofactor"}
                            >
                                <span />
                            </button>
                        </div>

                        <div className="aa-reset">
                            <div>
                                <strong>Forgot or lost your password?</strong>
                                <small>We email you a link that expires and works once.</small>
                            </div>
                            <button
                                type="button"
                                className="aa-btn aa-btn-small"
                                onClick={sendResetLink}
                                disabled={busy === "reset"}
                            >
                                <Icon name="mail" size={15} />
                                {busy === "reset" ? "Sending..." : "Send reset link"}
                            </button>
                        </div>

                        <p className="aa-note">
                            <Icon name="shield" size={15} />
                            You are signed out automatically when your session times out.
                        </p>
                    </article>

                    {/* RECENT SIGN-INS */}
                    <article className="aa-card aa-logins">
                        <header className="aa-card-head">
                            <div>
                                <h3>Recent sign-ins</h3>
                                <p>Your latest sign-in attempts. Report any you do not recognise.</p>
                            </div>
                            <Link href={ROUTES.securityEvents} className="aa-btn aa-btn-small">
                                Security events
                            </Link>
                        </header>

                        {data.logins.length === 0 ? (
                            <p className="aa-empty">No sign-in attempts recorded yet.</p>
                        ) : (
                            <ul className="aa-list">
                                {data.logins.slice(0, 5).map((attempt) => (
                                    <li key={attempt.id} className="aa-row">
                                        <span className={`aa-row-icon ${attempt.was_successful ? "" : "is-failed"}`}>
                                            <Icon name={attempt.was_successful ? "check" : "close"} size={15} />
                                        </span>
                                        <span className="aa-row-text">
                                            <strong>{deviceLabel(attempt.user_agent)}</strong>
                                            <small>
                                                {attempt.ip_address} · {formatDateTime(attempt.created_at)}
                                            </small>
                                        </span>
                                        <span className={`aa-pill ${attempt.was_successful ? "aa-pill-active" : "aa-pill-failed"}`}>
                                            {attempt.was_successful ? "Successful" : "Failed"}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </article>

                    {/* MY ACTIVITY */}
                    <article className="aa-card aa-activity">
                        <header className="aa-card-head">
                            <div>
                                <h3>My recent activity</h3>
                                <p>Everything you do is recorded in the audit log.</p>
                            </div>
                            <Link href={ROUTES.auditLogs} className="aa-btn aa-btn-small">
                                View all
                            </Link>
                        </header>

                        {data.activity.length === 0 ? (
                            <p className="aa-empty">No activity yet.</p>
                        ) : (
                            <ol className="aa-timeline">
                                {data.activity.slice(0, 6).map((entry) => (
                                    <li key={entry.id}>
                                        <span className="aa-timeline-icon">
                                            <Icon name="activity" size={13} />
                                        </span>
                                        <div>
                                            <p>
                                                <b>{ACTION_LABEL[entry.action] || entry.action}</b> · {entry.module}
                                            </p>
                                            <span>{entry.entity_label}</span>
                                        </div>
                                        <time>{timeAgo(entry.created_at)}</time>
                                    </li>
                                ))}
                            </ol>
                        )}
                    </article>
                </div>

                {toast && (
                    <div className="aa-toast" role="status">
                        <Icon name="check" size={17} />
                        <span>{toast}</span>
                    </div>
                )}
            </div>
        </>
    );
}

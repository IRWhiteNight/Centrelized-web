import { Fragment, useMemo, useState } from "react";
import { Link, router, usePage } from "@inertiajs/react";
// Same helper file the dashboard uses
import { ROUTES } from "../../Components/Admin-Components/adminRoutes";
import "../../../css/admin-css/admin-security-event.css";

/* ------------------------------------------------------------------
   SECURITY EVENTS  (Super Admin Console → /admin/super/security-events)

   Site map: "Security / login events".
   Data comes from the ERD:
     login_attempts  → LOGIN_SUCCESS / LOGIN_FAILED   (email_tried, was_successful, ip_address, user_agent, user_id)
     audit_logs      → LOGOUT / ACCESS_DENIED          (action, site_id, entity_label, ip_address, user_agent)
     password_resets → PASSWORD_RESET                  (user_id, created / used_at)
     users           → status (active / suspended / disabled), two_factor_enabled, must_change_password

   SAMPLE DATA: the page renders today with the sample below. Have your controller return
   an Inertia prop named `security` and it replaces the defaults automatically:

   Inertia::render('admin/SuperAdminSecurityEvents', ['security' => [
       'events'  => [...],   // newest first, see the shape in `sampleEvents`
       'posture' => [...],   // see `defaultData.posture`
       // optional: 'stats', 'daily', 'watch' (otherwise they are calculated from `events`)
       // optional: 'threshold' (failed attempts before an account is flagged), 'suspendedEmails'
   ]]);
------------------------------------------------------------------- */

const MIN = 60 * 1000;
const DAY = 24 * 60 * MIN;
const NOW = Date.now();
const minsAgo = (m) => new Date(NOW - m * MIN).toISOString();

const UA = {
    chromeWin: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
    edgeWin: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0",
    safariMac: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15",
    iphone: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
    firefoxLinux: "Mozilla/5.0 (X11; Linux x86_64; rv:131.0) Gecko/20100101 Firefox/131.0",
    curl: "curl/8.5.0",
};

/* [minutes ago, type, name, email, userId, site, ip, userAgent, detail] */
const sampleRows = [
    [12, "LOGIN_SUCCESS", "Aiman Hakim", "aiman@example.my", 3, "PSB", "203.0.113.24", UA.chromeWin, ""],
    [38, "LOGIN_SUCCESS", "Nur Sofea", "sofea@example.my", 4, "COEUAS", "203.0.113.31", UA.edgeWin, ""],
    [55, "LOGIN_FAILED", null, "admin@perlis-sandbox.my", null, null, "198.51.100.77", UA.curl, ""],
    [56, "LOGIN_FAILED", null, "admin@perlis-sandbox.my", null, null, "198.51.100.77", UA.curl, ""],
    [57, "LOGIN_FAILED", null, "admin@perlis-sandbox.my", null, null, "198.51.100.77", UA.curl, ""],
    [58, "LOGIN_FAILED", null, "admin@perlis-sandbox.my", null, null, "198.51.100.77", UA.curl, ""],
    [95, "LOGIN_FAILED", "Farid Rahman", "farid@example.my", 5, "PSB", "203.0.113.58", UA.chromeWin, ""],
    [97, "LOGIN_SUCCESS", "Farid Rahman", "farid@example.my", 5, "PSB", "203.0.113.58", UA.chromeWin, ""],
    [140, "ACCESS_DENIED", "Nur Sofea", "sofea@example.my", 4, "COEUAS", "203.0.113.31", UA.edgeWin, "Opened /admin/psb with a COE-UAS role"],
    [185, "LOGOUT", "Aiman Hakim", "aiman@example.my", 3, "PSB", "203.0.113.24", UA.chromeWin, ""],
    [240, "LOGIN_SUCCESS", "Super Administrator", "super@example.my", 1, "SUPER", "203.0.113.9", UA.safariMac, ""],
    [330, "PASSWORD_RESET", "Nur Sofea", "sofea@example.my", 4, "COEUAS", "203.0.113.31", UA.iphone, "Reset link used, password changed"],
    [410, "LOGIN_FAILED", "Syafiq Ismail", "syafiq@example.my", 6, "COEUAS", "192.0.2.44", UA.firefoxLinux, ""],
    [414, "LOGIN_FAILED", "Syafiq Ismail", "syafiq@example.my", 6, "COEUAS", "192.0.2.44", UA.firefoxLinux, ""],
    [419, "LOGIN_FAILED", "Syafiq Ismail", "syafiq@example.my", 6, "COEUAS", "192.0.2.44", UA.firefoxLinux, ""],
    [600, "LOGIN_SUCCESS", "Aiman Hakim", "aiman@example.my", 3, "PSB", "203.0.113.24", UA.chromeWin, ""],
    [720, "ACCESS_DENIED", "Aiman Hakim", "aiman@example.my", 3, "PSB", "203.0.113.24", UA.chromeWin, "Opened /admin/super/users with a PSB role"],
    [900, "LOGIN_FAILED", null, "info@example.com", null, null, "192.0.2.15", UA.chromeWin, ""],
    [1100, "LOGIN_SUCCESS", "Farid Rahman", "farid@example.my", 5, "PSB", "203.0.113.58", UA.chromeWin, ""],
    [1300, "LOGOUT", "Nur Sofea", "sofea@example.my", 4, "COEUAS", "203.0.113.31", UA.edgeWin, ""],
    [1500, "LOGIN_SUCCESS", "Super Administrator", "super@example.my", 1, "SUPER", "203.0.113.9", UA.safariMac, ""],
    [2900, "LOGIN_FAILED", "Aiman Hakim", "aiman@example.my", 3, "PSB", "203.0.113.24", UA.chromeWin, ""],
    [4300, "ACCESS_DENIED", "Farid Rahman", "farid@example.my", 5, "VERTIPORT", "203.0.113.58", UA.chromeWin, "Vertiport workspace is reserved for Phase 2"],
    [6000, "LOGIN_SUCCESS", "Nur Sofea", "sofea@example.my", 4, "COEUAS", "203.0.113.31", UA.edgeWin, ""],
    [9000, "PASSWORD_RESET", "Aiman Hakim", "aiman@example.my", 3, "PSB", "203.0.113.24", UA.chromeWin, "Reset link requested"],
].map(([m, type, user, email, userId, site, ip, ua, detail], i) => ({
    id: 9000 - i,
    at: minsAgo(m),
    type,
    user,
    email,
    userId,
    site,
    ip,
    ua,
    detail,
}));

const defaultData = {
    events: sampleRows,
    // users table summary
    posture: {
        twoFactorEnabled: 5,
        adminTotal: 7,
        suspended: 1,
        mustChangePassword: 1,
        pendingResets: 1,
    },
    threshold: 3, // failed attempts (24 h) before an email / account is flagged
    suspendedEmails: ["syafiq@example.my"],
};

/* ------------------------------ config ------------------------------- */

const EVENT_TYPES = {
    LOGIN_SUCCESS: { label: "Signed in", pill: "ok" },
    LOGIN_FAILED: { label: "Failed sign-in", pill: "fail" },
    LOGOUT: { label: "Signed out", pill: "info" },
    ACCESS_DENIED: { label: "Access denied", pill: "warn" },
    PASSWORD_RESET: { label: "Password reset", pill: "dark" },
};

const TYPE_FILTERS = [
    { value: "all", label: "All events" },
    { value: "LOGIN_SUCCESS", label: "Successful sign-ins" },
    { value: "LOGIN_FAILED", label: "Failed sign-ins" },
    { value: "ACCESS_DENIED", label: "Access denied" },
    { value: "LOGOUT", label: "Sign-outs" },
    { value: "PASSWORD_RESET", label: "Password resets" },
];

const SITE_FILTERS = [
    { value: "all", label: "All workspaces" },
    { value: "SUPER", label: "Super Admin" },
    { value: "PSB", label: "PSB" },
    { value: "COEUAS", label: "COE-UAS" },
    { value: "VERTIPORT", label: "Vertiport" },
];

const SITE_LABEL = { SUPER: "Super Admin", PSB: "PSB", COEUAS: "COE-UAS", VERTIPORT: "Vertiport" };

const RANGES = [
    { value: "24h", label: "Last 24 hours", ms: DAY },
    { value: "7d", label: "Last 7 days", ms: 7 * DAY },
    { value: "30d", label: "Last 30 days", ms: 30 * DAY },
    { value: "all", label: "All time", ms: Infinity },
];

const PAGE_SIZE = 8;

/* ------------------------------ helpers ------------------------------ */

function Icon({ name, size = 18 }) {
    const icons = {
        arrow: <path d="M7 17 17 7M8 7h9v9" />,
        download: (
            <>
                <path d="M12 4v11M7 11l5 5 5-5" />
                <path d="M4 20h16" />
            </>
        ),
        refresh: (
            <>
                <path d="M20 11a8 8 0 1 0-2.3 5.7" />
                <path d="M20 4v7h-7" />
            </>
        ),
        search: (
            <>
                <circle cx="11" cy="11" r="6.5" />
                <path d="m20 20-4-4" />
            </>
        ),
        shield: <path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11z" />,
        chevron: <path d="m6 9 6 6 6-6" />,
        users: (
            <>
                <circle cx="9" cy="8" r="3.5" />
                <path d="M2.5 20c.6-3.6 3.3-5.5 6.5-5.5s5.9 1.9 6.5 5.5" />
                <path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18.5 14.8c1.7.7 2.8 2.3 3 4.7" />
            </>
        ),
    };

    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            {icons[name]}
        </svg>
    );
}

function parseDevice(ua = "") {
    let browser = "Unknown browser";
    if (/curl|wget|python|postman|bot/i.test(ua)) browser = "Script / tool";
    else if (/Edg\//.test(ua)) browser = "Edge";
    else if (/Firefox\//.test(ua)) browser = "Firefox";
    else if (/Chrome\//.test(ua)) browser = "Chrome";
    else if (/Safari\//.test(ua)) browser = "Safari";

    let os = "";
    if (/Windows/.test(ua)) os = "Windows";
    else if (/iPhone|iPad/.test(ua)) os = "iOS";
    else if (/Android/.test(ua)) os = "Android";
    else if (/Mac OS X/.test(ua)) os = "macOS";
    else if (/Linux/.test(ua)) os = "Linux";

    return os ? `${browser} on ${os}` : browser;
}

function formatTime(iso) {
    const d = new Date(iso);
    const time = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
    if (d.toDateString() === new Date().toDateString()) return `Today, ${time}`;
    return `${d.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}, ${time}`;
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

const initialsOf = (name) =>
    (name || "?").split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase();

/* Numbers for the four cards, from the last 24 hours */
function summarise(events, posture) {
    const since = Date.now() - DAY;
    const recent = events.filter((e) => new Date(e.at).getTime() >= since);
    const failed = recent.filter((e) => e.type === "LOGIN_FAILED");
    const sources = new Set(failed.map((e) => e.ip)).size;

    return [
        {
            key: "failed",
            title: "Failed Sign-ins",
            value: failed.length,
            chip: sources ? `${sources} IP${sources === 1 ? "" : "s"}` : null,
            text: "in the last 24 hours",
            filter: { type: "LOGIN_FAILED", range: "24h" },
            primary: true,
        },
        {
            key: "success",
            title: "Successful Sign-ins",
            value: recent.filter((e) => e.type === "LOGIN_SUCCESS").length,
            chip: null,
            text: "in the last 24 hours",
            filter: { type: "LOGIN_SUCCESS", range: "24h" },
        },
        {
            key: "denied",
            title: "Access Denied",
            value: recent.filter((e) => e.type === "ACCESS_DENIED").length,
            chip: "403",
            text: "blocked by role or site scope",
            filter: { type: "ACCESS_DENIED", range: "24h" },
        },
        {
            key: "suspended",
            title: "Suspended Accounts",
            value: posture.suspended,
            chip: null,
            text: "reactivate from Admin Users",
            href: ROUTES.users,
        },
    ];
}

/* Sign-ins per day for the last 7 days (oldest first, last item = today) */
function buildDaily(events) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    return Array.from({ length: 7 }, (_, i) => {
        const from = new Date(start);
        from.setDate(from.getDate() - (6 - i));
        const to = new Date(from);
        to.setDate(to.getDate() + 1);

        const inDay = events.filter((e) => {
            const t = new Date(e.at).getTime();
            return t >= from.getTime() && t < to.getTime();
        });

        return {
            label: from.toLocaleDateString("en-GB", { weekday: "short" }),
            success: inDay.filter((e) => e.type === "LOGIN_SUCCESS").length,
            failed: inDay.filter((e) => e.type === "LOGIN_FAILED").length,
            today: i === 6,
        };
    });
}

/* Emails with `threshold` or more failed sign-ins in 24 hours */
function buildWatch(events, threshold, suspendedEmails = []) {
    const since = Date.now() - DAY;
    const groups = {};

    events
        .filter((e) => e.type === "LOGIN_FAILED" && new Date(e.at).getTime() >= since)
        .forEach((e) => {
            const key = e.email.toLowerCase();
            groups[key] ||= { email: e.email, name: e.user, userId: e.userId, failures: 0, lastAt: e.at, ips: new Set() };
            groups[key].failures += 1;
            groups[key].ips.add(e.ip);
            if (new Date(e.at) > new Date(groups[key].lastAt)) groups[key].lastAt = e.at;
        });

    return Object.values(groups)
        .filter((g) => g.failures >= threshold)
        .sort((a, b) => b.failures - a.failures)
        .map((g) => ({
            email: g.email,
            name: g.name,
            known: g.userId != null, // no user_id means the email is not registered
            failures: g.failures,
            sources: g.ips.size,
            lastAt: g.lastAt,
            suspended: suspendedEmails.map((s) => s.toLowerCase()).includes(g.email.toLowerCase()),
        }));
}

function downloadCsv(rows) {
    const head = ["Time", "Event", "User", "Email", "Workspace", "IP address", "Device", "Detail"];
    const lines = rows.map((e) => [
        new Date(e.at).toISOString(),
        EVENT_TYPES[e.type]?.label || e.type,
        e.user || "",
        e.email || "",
        SITE_LABEL[e.site] || "",
        e.ip || "",
        parseDevice(e.ua),
        e.detail || "",
    ]);
    const csv = [head, ...lines]
        .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
        .join("\r\n");

    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `security-events-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
}

/* ------------------------------ pieces ------------------------------- */

function StatCard({ stat, onFilter }) {
    const arrow = stat.href ? (
        <Link href={stat.href} className="sec-arrow" aria-label={`Open ${stat.title}`}>
            <Icon name="arrow" size={16} />
        </Link>
    ) : (
        <button type="button" className="sec-arrow" aria-label={`Show ${stat.title} in the event log`} onClick={() => onFilter(stat.filter)}>
            <Icon name="arrow" size={16} />
        </button>
    );

    return (
        <article className={`sec-card sec-stat ${stat.primary ? "is-primary" : ""}`}>
            <header>
                <h3>{stat.title}</h3>
                {arrow}
            </header>
            <p className="sec-stat-value">{stat.value}</p>
            <p className="sec-stat-meta">
                {stat.chip && <span className="sec-chip">{stat.chip}</span>}
                <span>{stat.text}</span>
            </p>
        </article>
    );
}

function SignInChart({ data }) {
    const max = Math.max(...data.map((d) => d.success + d.failed), 1);
    const success = data.reduce((s, d) => s + d.success, 0);
    const failed = data.reduce((s, d) => s + d.failed, 0);

    return (
        <article className="sec-card sec-chart">
            <header className="sec-head">
                <div>
                    <h3>Sign-in Activity</h3>
                    <p className="sec-sub">Successful and failed sign-ins, last 7 days</p>
                </div>
                <ul className="sec-legend">
                    <li><span className="sec-dot is-success" />Successful <b>{success}</b></li>
                    <li><span className="sec-dot is-failed" />Failed <b>{failed}</b></li>
                </ul>
            </header>

            <div className="sec-bars" role="list">
                {data.map((day, index) => {
                    const total = day.success + day.failed;
                    const height = total === 0 ? 100 : Math.max((total / max) * 100, 16);

                    return (
                        <div
                            key={index}
                            className={`sec-slot ${day.today ? "is-today" : ""}`}
                            role="listitem"
                            tabIndex={0}
                            aria-label={`${day.label}: ${day.success} successful, ${day.failed} failed`}
                        >
                            <span className="sec-tip">{day.success} ok · {day.failed} failed</span>
                            <span className={`sec-bar ${total === 0 ? "is-empty" : ""}`} style={{ height: `${height}%` }}>
                                {day.failed > 0 && <span className="sec-seg is-failed" style={{ flex: day.failed }} />}
                                {day.success > 0 && <span className="sec-seg is-success" style={{ flex: day.success }} />}
                            </span>
                            <span className="sec-label">{day.label}</span>
                        </div>
                    );
                })}
            </div>
        </article>
    );
}

function WatchCard({ items, threshold }) {
    return (
        <article className="sec-card sec-watch">
            <header className="sec-head">
                <div>
                    <h3>Accounts to watch</h3>
                    <p className="sec-sub">{threshold}+ failed sign-ins in 24 hours</p>
                </div>
            </header>

            {items.length === 0 ? (
                <p className="sec-empty-note">No repeated failures. Nothing to review.</p>
            ) : (
                <ul className="sec-watch-list">
                    {items.map((item) => (
                        <li key={item.email}>
                            <span className={`sec-avatar ${item.known ? "" : "is-unknown"}`}>
                                {item.known ? initialsOf(item.name) : "?"}
                            </span>
                            <span className="sec-watch-text">
                                <strong title={item.email}>{item.name || item.email}</strong>
                                <small>
                                    {item.failures} failed from {item.sources} IP{item.sources === 1 ? "" : "s"}, {timeAgo(item.lastAt)}
                                </small>
                            </span>
                            {item.suspended ? (
                                <span className="sec-pill is-fail">Suspended</span>
                            ) : item.known ? (
                                <Link href={`${ROUTES.users}?search=${encodeURIComponent(item.email)}`} className="sec-btn-small">Open</Link>
                            ) : (
                                <span className="sec-pill is-warn">Unknown email</span>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </article>
    );
}

function PostureCard({ posture }) {
    const pct = posture.adminTotal ? Math.round((posture.twoFactorEnabled / posture.adminTotal) * 100) : 0;

    return (
        <article className="sec-card sec-posture">
            <header className="sec-head">
                <h3>Account Protection</h3>
            </header>

            <p className="sec-posture-value">{pct}%</p>
            <p className="sec-posture-label">
                of admins use two-factor sign-in ({posture.twoFactorEnabled} of {posture.adminTotal})
            </p>
            <div className="sec-meter" role="img" aria-label={`${pct}% two-factor coverage`}>
                <span style={{ width: `${pct}%` }} />
            </div>

            <dl className="sec-posture-stats">
                <div><dt>Must change password</dt><dd>{posture.mustChangePassword}</dd></div>
                <div><dt>Open reset links</dt><dd>{posture.pendingResets}</dd></div>
            </dl>

            <Link href={ROUTES.users} className="sec-btn-yellow">
                <Icon name="users" size={16} />
                Manage Admin Users
            </Link>
        </article>
    );
}

/* ------------------------------- page -------------------------------- */

export default function SuperAdminSecurityEvents() {
    const { props } = usePage();
    const data = { ...defaultData, ...(props.security ?? {}) };

    const [query, setQuery] = useState("");
    const [type, setType] = useState("all");
    const [site, setSite] = useState("all");
    const [range, setRange] = useState("7d");
    const [page, setPage] = useState(1);
    const [openId, setOpenId] = useState(null);

    // Hooks always run; server-sent values (if any) win over the calculated ones
    const calcStats = useMemo(() => summarise(data.events, data.posture), [data.events, data.posture]);
    const calcDaily = useMemo(() => buildDaily(data.events), [data.events]);
    const calcWatch = useMemo(
        () => buildWatch(data.events, data.threshold, data.suspendedEmails),
        [data.events, data.threshold, data.suspendedEmails]
    );
    const stats = data.stats ?? calcStats;
    const daily = data.daily ?? calcDaily;
    const watch = data.watch ?? calcWatch;

    const filtered = useMemo(() => {
        const limit = RANGES.find((r) => r.value === range)?.ms ?? Infinity;
        const q = query.trim().toLowerCase();

        return data.events.filter((e) => {
            if (type !== "all" && e.type !== type) return false;
            if (site !== "all" && e.site !== site) return false;
            if (Date.now() - new Date(e.at).getTime() > limit) return false;
            if (!q) return true;
            return [e.user, e.email, e.ip, e.detail, parseDevice(e.ua)]
                .some((v) => (v || "").toLowerCase().includes(q));
        });
    }, [data.events, query, type, site, range]);

    const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const current = Math.min(page, pages);
    const rows = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
    const filtersActive = query || type !== "all" || site !== "all" || range !== "7d";

    const change = (setter) => (e) => { setter(e.target.value); setPage(1); setOpenId(null); };

    const applyFilter = ({ type: t = "all", range: r = "7d" }) => {
        setType(t); setRange(r); setSite("all"); setQuery(""); setPage(1); setOpenId(null);
        document.getElementById("sec-log")?.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    const reset = () => applyFilter({});

    return (
        <div className="admin-security">
            <div className="sec-heading">
                <div>
                    <h1>Security Events</h1>
                    <p>Sign-ins, failed attempts and blocked access across every workspace, in one place.</p>
                </div>

                <div className="sec-actions">
                    <button type="button" className="sec-btn-dark" onClick={() => downloadCsv(filtered)} disabled={!filtered.length}>
                        <span className="sec-btn-icon"><Icon name="download" size={15} /></span>
                        Export CSV
                    </button>
                    <Link href={ROUTES.auditLogs} className="sec-btn-outline">View Audit Logs</Link>
                </div>
            </div>

            <div className="sec-grid">
                {stats.map((stat) => (
                    <StatCard key={stat.key} stat={stat} onFilter={applyFilter} />
                ))}

                <SignInChart data={daily} />
                <WatchCard items={watch} threshold={data.threshold} />
                <PostureCard posture={data.posture} />

                <article className="sec-card sec-log" id="sec-log">
                    <header className="sec-head">
                        <div>
                            <h3>Event Log</h3>
                            <p className="sec-sub">
                                {filtered.length} event{filtered.length === 1 ? "" : "s"}
                                {filtersActive ? " match your filters" : ""}
                            </p>
                        </div>
                        <button type="button" className="sec-btn-small" onClick={() => router.reload({ only: ["security"] })}>
                            <Icon name="refresh" size={13} /> Refresh
                        </button>
                    </header>

                    <div className="sec-toolbar">
                        <label className="sec-search">
                            <Icon name="search" size={16} />
                            <input
                                type="search"
                                value={query}
                                onChange={change(setQuery)}
                                placeholder="Search name, email, IP address or device"
                                aria-label="Search security events"
                            />
                        </label>

                        <select value={type} onChange={change(setType)} aria-label="Event type">
                            {TYPE_FILTERS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                        <select value={site} onChange={change(setSite)} aria-label="Workspace">
                            {SITE_FILTERS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                        <select value={range} onChange={change(setRange)} aria-label="Date range">
                            {RANGES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>

                        {filtersActive && (
                            <button type="button" className="sec-clear" onClick={reset}>Clear filters</button>
                        )}
                    </div>

                    <div className="sec-table-wrap">
                        <table className="sec-table">
                            <thead>
                                <tr>
                                    <th>Event</th>
                                    <th>User</th>
                                    <th>Workspace</th>
                                    <th>IP address</th>
                                    <th>Device</th>
                                    <th>Time</th>
                                    <th><span className="sr-only">Details</span></th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="sec-empty">
                                            <Icon name="shield" size={22} />
                                            <strong>No events found</strong>
                                            <span>Try a wider date range or clear the filters.</span>
                                        </td>
                                    </tr>
                                )}

                                {rows.map((e) => {
                                    const meta = EVENT_TYPES[e.type] || { label: e.type, pill: "info" };
                                    const open = openId === e.id;
                                    const unknown = e.userId == null;

                                    return (
                                        <Fragment key={e.id}>
                                            <tr className={open ? "is-open" : ""}>
                                                <td><span className={`sec-pill is-${meta.pill}`}>{meta.label}</span></td>
                                                <td>
                                                    <span className="sec-user">
                                                        <span className={`sec-avatar ${unknown ? "is-unknown" : ""}`}>
                                                            {unknown ? "?" : initialsOf(e.user)}
                                                        </span>
                                                        <span className="sec-user-text">
                                                            <strong>{e.user || "Unknown account"}</strong>
                                                            <small>{e.email}</small>
                                                        </span>
                                                    </span>
                                                </td>
                                                <td>{e.site ? SITE_LABEL[e.site] : <span className="sec-muted">None</span>}</td>
                                                <td className="sec-mono">{e.ip}</td>
                                                <td>{parseDevice(e.ua)}</td>
                                                <td>
                                                    <span className="sec-time">{formatTime(e.at)}</span>
                                                    <small className="sec-muted">{timeAgo(e.at)}</small>
                                                </td>
                                                <td>
                                                    <button
                                                        type="button"
                                                        className={`sec-expand ${open ? "is-open" : ""}`}
                                                        aria-expanded={open}
                                                        aria-label={open ? "Hide details" : "Show details"}
                                                        onClick={() => setOpenId(open ? null : e.id)}
                                                    >
                                                        <Icon name="chevron" size={16} />
                                                    </button>
                                                </td>
                                            </tr>

                                            {open && (
                                                <tr className="sec-detail">
                                                    <td colSpan={7}>
                                                        <dl>
                                                            <div><dt>Exact time</dt><dd>{new Date(e.at).toLocaleString("en-GB")}</dd></div>
                                                            <div><dt>Event ID</dt><dd className="sec-mono">#{e.id}</dd></div>
                                                            <div><dt>User ID</dt><dd className="sec-mono">{e.userId ?? "No matching account"}</dd></div>
                                                            <div>
                                                                <dt>Note</dt>
                                                                <dd>
                                                                    {e.detail ||
                                                                        (e.type === "LOGIN_FAILED"
                                                                            ? unknown ? "Email is not registered" : "Password did not match"
                                                                            : "None")}
                                                                </dd>
                                                            </div>
                                                            <div className="is-wide"><dt>Browser details</dt><dd className="sec-mono">{e.ua}</dd></div>
                                                        </dl>
                                                    </td>
                                                </tr>
                                            )}
                                        </Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    <footer className="sec-pager">
                        <span>
                            {filtered.length === 0
                                ? "Showing 0 events"
                                : `Showing ${(current - 1) * PAGE_SIZE + 1} to ${Math.min(current * PAGE_SIZE, filtered.length)} of ${filtered.length}`}
                        </span>
                        <div>
                            <button type="button" className="sec-btn-small" onClick={() => { setPage(current - 1); setOpenId(null); }} disabled={current <= 1}>Previous</button>
                            <span className="sec-page">{current} / {pages}</span>
                            <button type="button" className="sec-btn-small" onClick={() => { setPage(current + 1); setOpenId(null); }} disabled={current >= pages}>Next</button>
                        </div>
                    </footer>
                </article>
            </div>
        </div>
    );
}

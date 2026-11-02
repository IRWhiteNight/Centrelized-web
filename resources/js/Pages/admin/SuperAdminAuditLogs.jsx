import { Fragment, useMemo, useState } from "react";
import { Link, router, usePage } from "@inertiajs/react";
// Same helper file the dashboard uses.
import { ROUTES, WORKSPACES } from "../../Components/Admin-Components/adminRoutes";
import "../../../css/admin-css/admin-audit-logs.css";

/* ------------------------------------------------------------------
   Audit Logs (Super Admin only)

   ERD table: audit_logs (id, user_id, site_id, action, module,
   entity_type, entity_id, entity_label, old_values, new_values,
   ip_address, user_agent, created_at). Rows are append-only.

   Sample data below makes the page work today. Have your controller
   return an Inertia prop named `auditLogs` and it replaces the sample:

   Inertia::render('Admin/SuperAdminAuditLogs', [
       'auditLogs' => [
           'entries' => [
               [
                   'id' => 1042,
                   'created_at' => '2026-11-02T01:14:22Z',   // UTC
                   'user' => ['id' => 7, 'name' => '...', 'email' => '...', 'role' => 'PSB_ADMIN'],
                   'site' => 'PSB',                           // PSB | COEUAS | VERTIPORT | null
                   'action' => 'UPDATE',
                   'module' => 'programmes',
                   'entity_type' => 'psb_programmes',
                   'entity_id' => 12,
                   'entity_label' => 'Cargo Logistics Call',
                   'old_values' => ['status' => 'draft'],     // changed fields only
                   'new_values' => ['status' => 'open'],
                   'ip_address' => '203.0.113.5',
                   'user_agent' => 'Mozilla/5.0 ...',
               ],
           ],
       ],
   ]);

   This page filters and pages the entries it is given (client side).
   For a large log, send one page at a time and move the filters to
   query-string parameters on the server.

   Exporting downloads a CSV of the filtered rows (or prints to PDF) and
   then POSTs to EXPORT_LOG_URL so the server can write an EXPORT audit row.
------------------------------------------------------------------- */
const EXPORT_LOG_URL = "/admin/super/audit-logs/export";
const PAGE_SIZE = 8;
const TZ = "Asia/Kuala_Lumpur"; // stored in UTC, shown in Malaysia time (UTC+8)

const ACTIONS = [
    "CREATE",
    "UPDATE",
    "DELETE",
    "RESTORE",
    "PUBLISH",
    "UNPUBLISH",
    "LOGIN",
    "LOGOUT",
    "EXPORT",
    "ACCESS_DENIED",
];

const ACTION_LABEL = {
    CREATE: "Created",
    UPDATE: "Updated",
    DELETE: "Deleted",
    RESTORE: "Restored",
    PUBLISH: "Published",
    UNPUBLISH: "Unpublished",
    LOGIN: "Login",
    LOGOUT: "Logout",
    EXPORT: "Export",
    ACCESS_DENIED: "Access denied",
};

const ACTION_PILL = {
    CREATE: "au-create",
    UPDATE: "au-update",
    DELETE: "au-delete",
    RESTORE: "au-restore",
    PUBLISH: "au-publish",
    UNPUBLISH: "au-unpublish",
    LOGIN: "au-session",
    LOGOUT: "au-session",
    EXPORT: "au-export",
    ACCESS_DENIED: "au-denied",
};

const SITE_LABEL = { PSB: "PSB", COEUAS: "COE-UAS", VERTIPORT: "Vertiport" };

/* ------------------------------------------------------------------
   SAMPLE DATA (times are relative to "now" so quick ranges work)
------------------------------------------------------------------- */
const ago = (minutes) => new Date(Date.now() - minutes * 60000).toISOString();

const U = {
    super: { id: 1, name: "Super Administrator", email: "super.admin@example.my", role: "SUPER_ADMIN" },
    aiman: { id: 2, name: "Aiman Hakim", email: "aiman.hakim@example.my", role: "PSB_ADMIN" },
    farid: { id: 3, name: "Farid Rahman", email: "farid.rahman@example.my", role: "PSB_ADMIN" },
    sofea: { id: 4, name: "Nur Sofea", email: "nur.sofea@example.my", role: "COEUAS_ADMIN" },
};

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130.0 Safari/537.36";

const SAMPLE_ENTRIES = [
    { id: 1042, m: 5, user: U.super, site: null, action: "LOGIN", module: "auth", entity_type: "session", entity_id: null, entity_label: "Signed in", old_values: null, new_values: null, ip: "10.20.4.18" },
    { id: 1041, m: 12, user: U.aiman, site: "PSB", action: "PUBLISH", module: "programmes", entity_type: "psb_programmes", entity_id: 12, entity_label: "Open Call: BVLOS Trials", old_values: { status: "draft" }, new_values: { status: "open", open_date: "2026-11-02" }, ip: "203.0.113.24" },
    { id: 1040, m: 38, user: U.sofea, site: "COEUAS", action: "UPDATE", module: "members", entity_type: "members", entity_id: 45, entity_label: "Member profile: Dr. Hafiz", old_values: { designation: "Senior Lecturer", expertise: "UAV control" }, new_values: { designation: "Associate Professor", expertise: "UAV control, UTM" }, ip: "175.139.12.77" },
    { id: 1039, m: 62, user: U.super, site: "PSB", action: "RESTORE", module: "posts", entity_type: "posts", entity_id: 77, entity_label: "News: Sandbox Launch", old_values: { deleted_at: "2026-10-30 14:02:11" }, new_values: { deleted_at: null, status: "draft" }, ip: "10.20.4.18" },
    { id: 1038, m: 121, user: U.farid, site: "PSB", action: "UPDATE", module: "applications", entity_type: "psb_applications", entity_id: 42, entity_label: "Application PSB-2026-0042", old_values: { status: "under_review" }, new_values: { status: "approved", review_notes: "Safety case accepted." }, ip: "203.0.113.31" },
    { id: 1037, m: 134, user: U.aiman, site: "PSB", action: "ACCESS_DENIED", module: "auth", entity_type: "route", entity_id: null, entity_label: "/admin/coeuas/people", old_values: null, new_values: { reason: "Role not allowed for this site" }, ip: "203.0.113.24" },
    { id: 1036, m: 190, user: U.sofea, site: "COEUAS", action: "CREATE", module: "publications", entity_type: "publications", entity_id: 512, entity_label: "Publication #512", old_values: null, new_values: { pub_type: "journal", title: "Low altitude UTM trial results", publication_year: 2026, status: "draft" }, ip: "175.139.12.77" },
    { id: 1035, m: 215, user: U.aiman, site: "PSB", action: "DELETE", module: "media", entity_type: "media_assets", entity_id: 301, entity_label: "old-banner.jpg", old_values: { original_name: "old-banner.jpg", media_type: "image", file_size: 482113 }, new_values: { deleted_at: "soft" }, ip: "203.0.113.24" },
    { id: 1034, m: 260, user: U.sofea, site: null, action: "LOGIN", module: "auth", entity_type: "session", entity_id: null, entity_label: "Signed in", old_values: null, new_values: null, ip: "175.139.12.77" },
    { id: 1033, m: 330, user: U.super, site: null, action: "UPDATE", module: "roles", entity_type: "role_permissions", entity_id: 2, entity_label: "Role: PSB Content Admin", old_values: { granted: 112 }, new_values: { granted: 113, added: ["subscribers:export"] }, ip: "10.20.4.18" },
    { id: 1032, m: 410, user: U.super, site: null, action: "EXPORT", module: "audit", entity_type: "audit_logs", entity_id: null, entity_label: "Audit log export", old_values: null, new_values: { format: "CSV", rows: 240, filter: "site = PSB" }, ip: "10.20.4.18" },
    { id: 1031, m: 520, user: U.aiman, site: "PSB", action: "UNPUBLISH", module: "events", entity_type: "events", entity_id: 9, entity_label: "Industry Day 2026", old_values: { status: "published" }, new_values: { status: "draft" }, ip: "203.0.113.24" },
    { id: 1030, m: 640, user: U.aiman, site: "PSB", action: "UPDATE", module: "pages", entity_type: "page_sections", entity_id: 31, entity_label: "Home: Main banner", old_values: { heading: "Test your drone in Perlis" }, new_values: { heading: "A real airspace to test, validate and fly" }, ip: "203.0.113.24" },
    { id: 1029, m: 900, user: U.super, site: null, action: "CREATE", module: "users", entity_type: "users", entity_id: 8, entity_label: "Admin user: Siti Aminah", old_values: null, new_values: { email: "siti.aminah@example.my", role: "COEUAS_ADMIN", status: "active" }, ip: "10.20.4.18" },
    { id: 1028, m: 1100, user: U.farid, site: null, action: "LOGOUT", module: "auth", entity_type: "session", entity_id: null, entity_label: "Signed out (idle timeout)", old_values: null, new_values: null, ip: "203.0.113.31" },
    { id: 1027, m: 1500, user: U.sofea, site: "COEUAS", action: "DELETE", module: "facilities", entity_type: "facilities", entity_id: 9, entity_label: "Facility: Hangar Lab", old_values: { name: "Hangar Lab", facility_type: "lab", status: "active" }, new_values: { deleted_at: "soft" }, ip: "175.139.12.77" },
    { id: 1026, m: 1900, user: U.aiman, site: "PSB", action: "CREATE", module: "events", entity_type: "events", entity_id: 12, entity_label: "Sandbox Open Day", old_values: null, new_values: { title: "Sandbox Open Day", event_type: "open_day", status: "draft" }, ip: "203.0.113.24" },
    { id: 1025, m: 2600, user: U.super, site: null, action: "UPDATE", module: "users", entity_type: "users", entity_id: 6, entity_label: "Admin user: Hafizah Noor", old_values: { status: "active" }, new_values: { status: "suspended" }, ip: "10.20.4.18" },
    { id: 1024, m: 3100, user: U.farid, site: null, action: "ACCESS_DENIED", module: "auth", entity_type: "route", entity_id: null, entity_label: "/admin/super/audit-logs", old_values: null, new_values: { reason: "Super Admin only" }, ip: "203.0.113.31" },
    { id: 1023, m: 5200, user: U.sofea, site: "COEUAS", action: "PUBLISH", module: "research", entity_type: "research_projects", entity_id: 21, entity_label: "Research project: Long-range BVLOS", old_values: { status: "draft" }, new_values: { status: "published" }, ip: "175.139.12.77" },
].map(({ m, ip, ...row }) => ({
    ...row,
    created_at: ago(m),
    ip_address: ip,
    user_agent: UA,
}));

const defaultData = { entries: SAMPLE_ENTRIES };

/* ------------------------------ helpers ------------------------------ */

function Icon({ name, size = 16 }) {
    const icons = {
        search: (
            <>
                <circle cx="11" cy="11" r="6" />
                <path d="m20 20-4.2-4.2" />
            </>
        ),
        download: <path d="M12 4v11m0 0-4-4m4 4 4-4M5 20h14" />,
        print: (
            <>
                <path d="M7 9V4h10v5" />
                <rect x="4" y="9" width="16" height="8" rx="2" />
                <path d="M7 14h10v6H7z" />
            </>
        ),
        chevron: <path d="m6 9 6 6 6-6" />,
        left: <path d="m15 6-6 6 6 6" />,
        right: <path d="m9 6 6 6-6 6" />,
        lock: (
            <>
                <rect x="5" y="11" width="14" height="9" rx="2" />
                <path d="M8 11V8a4 4 0 0 1 8 0v3" />
            </>
        ),
        x: <path d="M6 6l12 12M18 6 6 18" />,
    };
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            {icons[name]}
        </svg>
    );
}

const partsFmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
});

function myt(iso) {
    const p = Object.fromEntries(partsFmt.formatToParts(new Date(iso)).map((x) => [x.type, x.value]));
    return { date: `${p.day} ${p.month} ${p.year}`, time: `${p.hour}:${p.minute}:${p.second}` };
}

/* yyyy-mm-dd in Malaysia time */
const ymd = (d) => new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(d);

const initialsOf = (name) =>
    name.split(" ").filter(Boolean).slice(0, 2).map((s) => s[0]).join("").toUpperCase();

const fmtValue = (v) => {
    if (v === null || v === undefined || v === "") return "empty";
    if (Array.isArray(v)) return v.join(", ");
    if (typeof v === "object") return JSON.stringify(v);
    return String(v);
};

const csvCell = (v) => {
    const s = v === null || v === undefined ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const toneOf = (siteCode) => WORKSPACES?.find((w) => w.code === siteCode)?.tone;

/* ------------------------------ pieces ------------------------------- */

function StatCard({ title, value, text, chip, primary, danger }) {
    return (
        <article className={`au-card au-stat ${primary ? "is-primary" : ""} ${danger ? "is-danger" : ""}`}>
            <h3>{title}</h3>
            <p className="au-stat-value">{value}</p>
            <p className="au-stat-meta">
                {chip && <span className="au-chip">{chip}</span>}
                <span>{text}</span>
            </p>
        </article>
    );
}

function ActionPill({ action }) {
    return <span className={`au-pill ${ACTION_PILL[action] || "au-update"}`}>{ACTION_LABEL[action] || action}</span>;
}

function SiteTag({ site }) {
    if (!site) return <span className="au-site is-none">All sites</span>;
    return (
        <span className={`au-site tone-${toneOf(site) || site.toLowerCase()}`}>
            <i />
            {SITE_LABEL[site] || site}
        </span>
    );
}

/* before / after view of the changed fields */
function Changes({ entry }) {
    const oldV = entry.old_values;
    const newV = entry.new_values;

    if (!oldV && !newV) {
        return <p className="au-nochange">No field values were recorded for this action.</p>;
    }

    if (entry.action === "UPDATE" && oldV && newV) {
        const keys = Array.from(new Set([...Object.keys(oldV), ...Object.keys(newV)]));
        return (
            <table className="au-diff">
                <thead>
                    <tr>
                        <th>Field</th>
                        <th>Before</th>
                        <th>After</th>
                    </tr>
                </thead>
                <tbody>
                    {keys.map((k) => (
                        <tr key={k}>
                            <th scope="row">{k}</th>
                            <td className="is-old">{fmtValue(oldV[k])}</td>
                            <td className="is-new">{fmtValue(newV[k])}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        );
    }

    const values = newV && Object.keys(newV).length ? newV : oldV;
    const title = oldV && entry.action === "DELETE" ? "Snapshot before delete" : entry.action === "CREATE" ? "New values" : "Details";

    return (
        <>
            <p className="au-diff-title">{title}</p>
            <table className="au-diff">
                <tbody>
                    {Object.entries(values).map(([k, v]) => (
                        <tr key={k}>
                            <th scope="row">{k}</th>
                            <td className={entry.action === "DELETE" ? "is-old" : "is-new"}>{fmtValue(v)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </>
    );
}

function Detail({ entry }) {
    const t = myt(entry.created_at);
    return (
        <div className="au-detail">
            <div className="au-detail-main">
                <h4>What changed</h4>
                <Changes entry={entry} />
            </div>

            <dl className="au-meta">
                <div><dt>Entry ID</dt><dd>#{entry.id}</dd></div>
                <div><dt>Time (Malaysia)</dt><dd>{t.date}, {t.time}</dd></div>
                <div><dt>Time (UTC)</dt><dd>{entry.created_at.replace("T", " ").slice(0, 19)}</dd></div>
                <div><dt>User</dt><dd>{entry.user.name}<small>{entry.user.role}</small></dd></div>
                <div><dt>Record</dt><dd>{entry.entity_type}{entry.entity_id ? ` #${entry.entity_id}` : ""}</dd></div>
                <div><dt>IP address</dt><dd>{entry.ip_address}</dd></div>
                <div className="is-wide"><dt>Device</dt><dd className="au-ua">{entry.user_agent}</dd></div>
            </dl>
        </div>
    );
}

/* ------------------------------- page -------------------------------- */

const RANGES = [
    { key: "all", label: "All time" },
    { key: "today", label: "Today" },
    { key: "7", label: "7 days" },
    { key: "30", label: "30 days" },
];

export default function SuperAdminAuditLogs() {
    const { props } = usePage();
    const data = { ...defaultData, ...(props.auditLogs ?? {}) };
    const entries = data.entries;

    const [query, setQuery] = useState("");
    const [site, setSite] = useState("all");
    const [userId, setUserId] = useState("all");
    const [moduleKey, setModuleKey] = useState("all");
    const [actions, setActions] = useState(() => new Set());
    const [range, setRange] = useState("all");
    const [from, setFrom] = useState("");
    const [to, setTo] = useState("");
    const [newestFirst, setNewestFirst] = useState(true);
    const [page, setPage] = useState(1);
    const [openId, setOpenId] = useState(null);
    const [notice, setNotice] = useState(null);

    const users = useMemo(() => {
        const map = new Map();
        entries.forEach((e) => map.set(e.user.id, e.user));
        return [...map.values()];
    }, [entries]);

    const modules = useMemo(() => [...new Set(entries.map((e) => e.module))].sort(), [entries]);

    const actionCounts = useMemo(() => {
        const c = {};
        entries.forEach((e) => { c[e.action] = (c[e.action] || 0) + 1; });
        return c;
    }, [entries]);

    /* ---------- filtering ---------- */

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        const start = from ? new Date(`${from}T00:00:00+08:00`).getTime() : null;
        const end = to ? new Date(`${to}T23:59:59.999+08:00`).getTime() : null;

        const rows = entries.filter((e) => {
            const t = new Date(e.created_at).getTime();
            if (site !== "all" && (e.site ?? "none") !== site) return false;
            if (userId !== "all" && String(e.user.id) !== userId) return false;
            if (moduleKey !== "all" && e.module !== moduleKey) return false;
            if (actions.size && !actions.has(e.action)) return false;
            if (start !== null && t < start) return false;
            if (end !== null && t > end) return false;
            if (q) {
                const hay = `${e.entity_label} ${e.entity_type} ${e.user.name} ${e.user.email} ${e.ip_address} ${e.entity_id ?? ""}`.toLowerCase();
                if (!hay.includes(q)) return false;
            }
            return true;
        });

        rows.sort((a, b) => {
            const d = new Date(a.created_at) - new Date(b.created_at);
            return newestFirst ? -d : d;
        });
        return rows;
    }, [entries, query, site, userId, moduleKey, actions, from, to, newestFirst]);

    const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const safePage = Math.min(page, pages);
    const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

    const activeFilters =
        (query ? 1 : 0) + (site !== "all" ? 1 : 0) + (userId !== "all" ? 1 : 0) + (moduleKey !== "all" ? 1 : 0) +
        actions.size + (range !== "all" || from || to ? 1 : 0);

    const todayKey = ymd(new Date());
    const stats = {
        total: filtered.length,
        today: filtered.filter((e) => ymd(new Date(e.created_at)) === todayKey).length,
        denied: filtered.filter((e) => e.action === "ACCESS_DENIED").length,
        removed: filtered.filter((e) => e.action === "DELETE").length,
        people: new Set(filtered.map((e) => e.user.id)).size,
    };

    /* ---------- edits ---------- */

    const reset = () => {
        setQuery(""); setSite("all"); setUserId("all"); setModuleKey("all");
        setActions(new Set()); setRange("all"); setFrom(""); setTo(""); setPage(1);
    };

    const changeFilter = (fn) => (value) => { fn(value); setPage(1); setOpenId(null); };

    const toggleAction = (a) => {
        setActions((prev) => {
            const next = new Set(prev);
            next.has(a) ? next.delete(a) : next.add(a);
            return next;
        });
        setPage(1);
        setOpenId(null);
    };

    const pickRange = (key) => {
        setRange(key);
        setPage(1);
        setOpenId(null);
        const now = new Date();
        if (key === "all") { setFrom(""); setTo(""); return; }
        const days = key === "today" ? 0 : Number(key) - 1;
        setFrom(ymd(new Date(now.getTime() - days * 86400000)));
        setTo(ymd(now));
    };

    const customDate = (setter) => (e) => { setter(e.target.value); setRange("custom"); setPage(1); setOpenId(null); };

    /* ---------- export ---------- */

    const logExport = (format) => {
        try {
            router.post(
                EXPORT_LOG_URL,
                { format, rows: filtered.length, filters: { query, site, userId, moduleKey, actions: [...actions], from, to } },
                { preserveScroll: true, preserveState: true, onError: () => {} }
            );
        } catch (e) { /* the download already happened; the server log is best effort here */ }
    };

    const exportCsv = () => {
        const head = ["id", "time_utc", "time_myt", "user", "email", "role", "site", "action", "module", "entity_type", "entity_id", "entity_label", "ip_address", "old_values", "new_values"];
        const lines = [head.join(",")];
        filtered.forEach((e) => {
            const t = myt(e.created_at);
            lines.push(
                [e.id, e.created_at, `${t.date} ${t.time}`, e.user.name, e.user.email, e.user.role, e.site ?? "", e.action, e.module, e.entity_type, e.entity_id ?? "", e.entity_label,
                    e.ip_address, e.old_values ? JSON.stringify(e.old_values) : "", e.new_values ? JSON.stringify(e.new_values) : ""]
                    .map(csvCell).join(",")
            );
        });
        const blob = new Blob(["\ufeff" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `audit-log-${ymd(new Date())}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        setNotice(`Exported ${filtered.length} entries to CSV. The export is logged.`);
        logExport("CSV");
    };

    const exportPdf = () => {
        setNotice(`Printing ${filtered.length} entries. Choose "Save as PDF". The export is logged.`);
        logExport("PDF");
        setTimeout(() => window.print(), 60);
    };

    /* ---------- render ---------- */

    return (
        <div className="admin-audit">
            {/* HEADING */}
            <div className="au-heading">
                <div>
                    <h1>Audit Logs</h1>
                    <p>See who added, changed, deleted or published what, on which site, and when. Entries cannot be edited or removed.</p>
                </div>

                <div className="au-actions au-screen">
                    <button type="button" className="au-btn-dark" onClick={exportCsv} disabled={!filtered.length}>
                        <span className="au-btn-icon"><Icon name="download" size={15} /></span>
                        Export CSV
                    </button>
                    <button type="button" className="au-btn-outline" onClick={exportPdf} disabled={!filtered.length}>
                        <Icon name="print" size={15} />
                        Export PDF
                    </button>
                </div>
            </div>

            {notice && (
                <p className="au-notice au-screen" role="status">
                    {notice}
                    <button type="button" onClick={() => setNotice(null)} aria-label="Dismiss"><Icon name="x" size={14} /></button>
                </p>
            )}

            {/* STATS */}
            <div className="au-stats au-screen">
                <StatCard primary title="Entries" value={stats.total} chip={`of ${entries.length}`} text={activeFilters ? "Matching your filters" : "All logged actions"} />
                <StatCard title="Today" value={stats.today} text="Logged since midnight (Malaysia)" />
                <StatCard title="Administrators" value={stats.people} text="With activity in this view" />
                <StatCard danger title="Access Denied" value={stats.denied} chip={stats.removed ? `${stats.removed} deletes` : null} text="Blocked cross-site attempts" />
            </div>

            {/* FILTERS */}
            <article className="au-card au-filters au-screen">
                <div className="au-filter-row">
                    <label className="au-search">
                        <Icon name="search" size={15} />
                        <input
                            type="search"
                            value={query}
                            onChange={(e) => changeFilter(setQuery)(e.target.value)}
                            placeholder="Search record, user, email or IP"
                            aria-label="Search audit log"
                        />
                    </label>

                    <label className="au-select">
                        <span>Site</span>
                        <select value={site} onChange={(e) => changeFilter(setSite)(e.target.value)}>
                            <option value="all">All sites</option>
                            <option value="PSB">PSB</option>
                            <option value="COEUAS">COE-UAS</option>
                            <option value="VERTIPORT">Vertiport</option>
                            <option value="none">No site (global)</option>
                        </select>
                    </label>

                    <label className="au-select">
                        <span>User</span>
                        <select value={userId} onChange={(e) => changeFilter(setUserId)(e.target.value)}>
                            <option value="all">All users</option>
                            {users.map((u) => <option key={u.id} value={String(u.id)}>{u.name}</option>)}
                        </select>
                    </label>

                    <label className="au-select">
                        <span>Module</span>
                        <select value={moduleKey} onChange={(e) => changeFilter(setModuleKey)(e.target.value)}>
                            <option value="all">All modules</option>
                            {modules.map((m) => <option key={m} value={m}>{m}</option>)}
                        </select>
                    </label>
                </div>

                <div className="au-filter-row">
                    <div className="au-chips" role="group" aria-label="Date range">
                        {RANGES.map((r) => (
                            <button key={r.key} type="button" className={`au-fchip ${range === r.key ? "is-on" : ""}`} onClick={() => pickRange(r.key)} aria-pressed={range === r.key}>
                                {r.label}
                            </button>
                        ))}
                    </div>

                    <label className="au-date">
                        <span>From</span>
                        <input type="date" value={from} max={to || undefined} onChange={customDate(setFrom)} />
                    </label>
                    <label className="au-date">
                        <span>To</span>
                        <input type="date" value={to} min={from || undefined} onChange={customDate(setTo)} />
                    </label>

                    {activeFilters > 0 && (
                        <button type="button" className="au-clear" onClick={reset}>
                            <Icon name="x" size={14} />
                            Clear {activeFilters} {activeFilters === 1 ? "filter" : "filters"}
                        </button>
                    )}
                </div>

                <div className="au-chips au-action-chips" role="group" aria-label="Filter by action">
                    {ACTIONS.map((a) => (
                        <button key={a} type="button" className={`au-fchip au-achip ${ACTION_PILL[a]} ${actions.has(a) ? "is-on" : ""}`} onClick={() => toggleAction(a)} aria-pressed={actions.has(a)}>
                            {ACTION_LABEL[a]}
                            <small>{actionCounts[a] || 0}</small>
                        </button>
                    ))}
                </div>
            </article>

            {/* TABLE */}
            <article className="au-card au-tablecard au-screen">
                <header className="au-card-head">
                    <div>
                        <h3>Activity</h3>
                        <p className="au-sub">Times shown in Malaysia time (UTC+8). Click a row to see the before and after values.</p>
                    </div>
                    <button type="button" className="au-sort" onClick={() => setNewestFirst((v) => !v)}>
                        {newestFirst ? "Newest first" : "Oldest first"}
                    </button>
                </header>

                <div className="au-table-wrap">
                    <table className="au-table">
                        <thead>
                            <tr>
                                <th scope="col">Time</th>
                                <th scope="col">User</th>
                                <th scope="col">Site</th>
                                <th scope="col">Action</th>
                                <th scope="col">Record</th>
                                <th scope="col">IP address</th>
                                <th scope="col" aria-label="Details" />
                            </tr>
                        </thead>

                        <tbody>
                            {pageRows.map((e, index) => {
                                const t = myt(e.created_at);
                                const open = openId === e.id;
                                return (
                                    <Fragment key={e.id}>
                                        <tr className={`au-row ${open ? "is-open" : ""}`} onClick={() => setOpenId(open ? null : e.id)}>
                                            <td className="au-time">
                                                <strong>{t.time}</strong>
                                                <small>{t.date}</small>
                                            </td>
                                            <td>
                                                <span className="au-user">
                                                    <span className={`au-avatar avatar-${(e.user.id + index) % 3}`}>{initialsOf(e.user.name)}</span>
                                                    <span>
                                                        <strong>{e.user.name}</strong>
                                                        <small>{e.user.email}</small>
                                                    </span>
                                                </span>
                                            </td>
                                            <td><SiteTag site={e.site} /></td>
                                            <td><ActionPill action={e.action} /></td>
                                            <td className="au-record">
                                                <strong>{e.entity_label}</strong>
                                                <small>{e.module}{e.entity_id ? ` #${e.entity_id}` : ""}</small>
                                            </td>
                                            <td className="au-ip">{e.ip_address}</td>
                                            <td className="au-toggle">
                                                <button type="button" aria-expanded={open} aria-label={open ? "Hide details" : "Show details"}>
                                                    <Icon name="chevron" size={16} />
                                                </button>
                                            </td>
                                        </tr>

                                        {open && (
                                            <tr className="au-detail-row">
                                                <td colSpan={7}><Detail entry={e} /></td>
                                            </tr>
                                        )}
                                    </Fragment>
                                );
                            })}

                            {pageRows.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="au-empty">
                                        <strong>No entries match these filters.</strong>
                                        <button type="button" className="au-clear" onClick={reset}>Clear filters</button>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <footer className="au-pager">
                    <p>
                        {filtered.length === 0
                            ? "0 entries"
                            : `${(safePage - 1) * PAGE_SIZE + 1} to ${Math.min(safePage * PAGE_SIZE, filtered.length)} of ${filtered.length} entries`}
                    </p>

                    <div className="au-pager-btns">
                        <button type="button" onClick={() => { setPage(safePage - 1); setOpenId(null); }} disabled={safePage <= 1} aria-label="Previous page">
                            <Icon name="left" size={15} />
                        </button>
                        <span>Page {safePage} of {pages}</span>
                        <button type="button" onClick={() => { setPage(safePage + 1); setOpenId(null); }} disabled={safePage >= pages} aria-label="Next page">
                            <Icon name="right" size={15} />
                        </button>
                    </div>
                </footer>
            </article>

            <p className="au-foot au-screen">
                <Icon name="lock" size={14} />
                Audit rows are append-only. The application cannot update or delete them.
                <Link href={ROUTES.users}>Manage admin users</Link>
            </p>

            {/* print / PDF version: every filtered entry, plain table */}
            <section className="au-print" aria-hidden="true">
                <h2>Audit Log</h2>
                <p>
                    {filtered.length} entries, exported {myt(new Date().toISOString()).date}, times in Malaysia time (UTC+8)
                </p>
                <table>
                    <thead>
                        <tr><th>Time</th><th>User</th><th>Site</th><th>Action</th><th>Record</th><th>IP</th><th>Changes</th></tr>
                    </thead>
                    <tbody>
                        {filtered.map((e) => {
                            const t = myt(e.created_at);
                            const diff = e.old_values && e.new_values && e.action === "UPDATE"
                                ? Object.keys({ ...e.old_values, ...e.new_values }).map((k) => `${k}: ${fmtValue(e.old_values[k])} -> ${fmtValue(e.new_values[k])}`).join("; ")
                                : e.new_values ? JSON.stringify(e.new_values) : e.old_values ? JSON.stringify(e.old_values) : "";
                            return (
                                <tr key={e.id}>
                                    <td>{t.date} {t.time}</td>
                                    <td>{e.user.name}</td>
                                    <td>{e.site ? SITE_LABEL[e.site] : "-"}</td>
                                    <td>{ACTION_LABEL[e.action]}</td>
                                    <td>{e.entity_label}{e.entity_id ? ` #${e.entity_id}` : ""}</td>
                                    <td>{e.ip_address}</td>
                                    <td>{diff}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </section>
        </div>
    );
}

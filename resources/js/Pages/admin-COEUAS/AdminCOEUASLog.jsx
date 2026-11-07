import { useEffect, useMemo, useState } from "react";
import { usePage } from "@inertiajs/react";
import "../../../css/admin-COEUAS-css/admin-logs.css";

/* ====================================================================
   COE-UAS ADMIN → ACTIVITY LOG                      /admin/coeuas/logs

   Site map 1.3 (COE-UAS workspace → "My Account": "My activity log"; Dashboard: "My recent activity").
   Use cases 3.3: "View My Activity (COE-UAS)" for the COE-UAS Content Admin.
                  "View Audit Log (COE-UAS scope)" and "Export Audit Log" are Super Admin only
                  (the Super Admin opens this workspace through Site Workspaces, "Super Admin mode").
   Data: audit_logs (ERD-1). The table is immutable, so this page is READ ONLY:
         no edit, no delete. Only an export is allowed, and the export itself is logged (action EXPORT).

   audit_logs columns used:
     id, user_id, site_id, action, module, entity_type, entity_id, entity_label,
     old_values (JSON), new_values (JSON), ip_address, user_agent, created_at
   action ENUM: CREATE, UPDATE, DELETE, RESTORE, PUBLISH, UNPUBLISH, LOGIN, LOGOUT, EXPORT, ACCESS_DENIED

   WHO SEES WHAT
     COE-UAS Content Admin → "My activity": only rows where user_id = the signed-in admin.
     Super Admin (in this workspace) → also "All COE-UAS activity" (every row for the COEUAS site_id),
                                       a user filter, and "Export as CSV".
   The controller decides this (canViewAll / canExport). The page never trusts the browser:
   every query must be scoped to the COEUAS site_id, and "mine" to the current user.

   SAMPLE DATA: works today. Return an Inertia prop named `logs` and it switches to LIVE mode:

   Inertia::render('admin-COEUAS/AdminCOEUASLog', [
       'logs' => [
           'me'         => ['id' => 1, 'name' => 'Aisyah Rahman'],
           'canViewAll' => false,     // true for Super Admin
           'canExport'  => false,     // true for Super Admin
           'entries'    => [          // newest 500 rows in scope, newest first
               ['id' => 1, 'user' => ['id' => 1, 'name' => '...'], 'action' => 'UPDATE',
                'module' => 'People', 'entityType' => 'members', 'entityId' => 12,
                'entityLabel' => 'Dr. Aisyah ...', 'oldValues' => [...], 'newValues' => [...],
                'ip' => '10.0.0.4', 'userAgent' => '...', 'at' => '2026-11-05T09:30:00Z'],
           ],
           'users'   => [['id' => 1, 'name' => '...']],   // admins that appear in the log (Super Admin only)
       ],
   ]);

   Export (live mode): GET /admin/coeuas/logs/export?scope=&action=&module=&user=&from=&to=&q=
   The controller streams the CSV and writes an audit_logs row with action EXPORT.
   Filtering and paging here run on the rows you send. For a very large log, send the latest rows
   and let the export (server side) cover the full history.
==================================================================== */

const BASE = "/admin/coeuas"; // keep in sync with coeuasRoutes.js
const ENDPOINTS = { export: `${BASE}/logs/export` };
const MIN = 60 * 1000;
const NOW = Date.now();
const minsAgo = (m) => new Date(NOW - m * MIN).toISOString();
const PAGE_SIZE = 15;

/* enum from the ERD (audit_logs.action) */
const ACTIONS = [
    { value: "CREATE", label: "Created", tone: "is-new" },
    { value: "UPDATE", label: "Updated", tone: "is-info" },
    { value: "DELETE", label: "Deleted", tone: "is-danger" },
    { value: "RESTORE", label: "Restored", tone: "is-ok" },
    { value: "PUBLISH", label: "Published", tone: "is-ok" },
    { value: "UNPUBLISH", label: "Unpublished", tone: "is-warn" },
    { value: "LOGIN", label: "Signed in", tone: "is-off" },
    { value: "LOGOUT", label: "Signed out", tone: "is-off" },
    { value: "EXPORT", label: "Exported", tone: "is-info" },
    { value: "ACCESS_DENIED", label: "Access denied", tone: "is-danger" },
];
const CHANGE_ACTIONS = ["CREATE", "UPDATE", "DELETE", "RESTORE", "PUBLISH", "UNPUBLISH"];

/* modules = the COE-UAS menu (site map 1.3), plus access events */
const MODULES = ["Home Page", "About", "People", "Research and Innovation", "Publications and Impact", "Facilities and Services", "Engagement", "Contact and Enquiries", "Archive Taxonomy", "Media Library", "Navigation and Settings", "Access"];

/* ------------------------------ sample data ------------------------------ */

const SAMPLE_ME = { id: 1, name: "Aisyah Rahman" };
const sampleUsers = [SAMPLE_ME, { id: 2, name: "Hafiz Roslan" }, { id: 9, name: "Super Admin" }];
const U = Object.fromEntries(sampleUsers.map((u) => [u.id, u]));
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/126.0";

const sampleEntries = [
    { u: 1, m: 12, action: "UPDATE", module: "Contact and Enquiries", entityType: "contact_enquiries", entityId: 3, entityLabel: "School visit", old: { status: "in_progress", assigned_to: null }, next: { status: "replied", assigned_to: "Aisyah Rahman", handled_at: "2026-11-05 09:12" } },
    { u: 1, m: 45, action: "PUBLISH", module: "Engagement", entityType: "posts", entityId: 41, entityLabel: "UAS flight trial at Padang Besar", old: { status: "draft" }, next: { status: "published", published_at: "2026-11-05 08:40" } },
    { u: 2, m: 95, action: "UPDATE", module: "People", entityType: "members", entityId: 12, entityLabel: "Prof. Dr. Ahmad Zulkifli", old: { designation: "Associate Professor", coe_role: "Group leader" }, next: { designation: "Professor", coe_role: "Deputy Director" } },
    { u: 1, m: 130, action: "CREATE", module: "Publications and Impact", entityType: "publications", entityId: 208, entityLabel: "Detect-and-avoid for small fixed-wing UAS", old: null, next: { pub_type: "journal", publication_year: 2026, status: "draft" } },
    { u: 9, m: 190, action: "RESTORE", module: "Facilities and Services", entityType: "training_courses", entityId: 17, entityLabel: "Remote pilot certificate course", old: { deleted_at: "2026-11-03 16:20" }, next: { deleted_at: null } },
    { u: 2, m: 240, action: "DELETE", module: "Facilities and Services", entityType: "training_courses", entityId: 17, entityLabel: "Remote pilot certificate course", old: { status: "published" }, next: { deleted_at: "2026-11-03 16:20" } },
    { u: 1, m: 300, action: "EXPORT", module: "Contact and Enquiries", entityType: "contact_enquiries", entityId: null, entityLabel: "Enquiries (6 rows)", old: null, next: { rows: 6, type: "all", status: "all" } },
    { u: 2, m: 360, action: "UPDATE", module: "Contact and Enquiries", entityType: "site_settings", entityId: 55, entityLabel: "Contact details", old: { contact_hours: "Mon to Fri, 9:00 am to 5:00 pm" }, next: { contact_hours: "Mon to Fri, 8:30 am to 5:00 pm" } },
    { u: 2, m: 420, action: "ACCESS_DENIED", module: "Access", entityType: "route", entityId: null, entityLabel: "/admin/psb/applications", old: null, next: { reason: "Role COEUAS_ADMIN has no access to site PSB" } },
    { u: 1, m: 500, action: "UNPUBLISH", module: "Research and Innovation", entityType: "research_projects", entityId: 9, entityLabel: "Swarm navigation in GPS-denied areas", old: { status: "published" }, next: { status: "draft" } },
    { u: 1, m: 560, action: "CREATE", module: "Media Library", entityType: "media_assets", entityId: 330, entityLabel: "flight-trial-2026.jpg", old: null, next: { media_type: "image", file_size: 1843200, alt_text: "Fixed-wing UAS on the runway" } },
    { u: 2, m: 640, action: "UPDATE", module: "Navigation and Settings", entityType: "menu_items", entityId: 8, entityLabel: "Header menu: Engagement", old: { sort_order: 6, is_visible: false }, next: { sort_order: 5, is_visible: true } },
    { u: 1, m: 700, action: "LOGIN", module: "Access", entityType: "users", entityId: 1, entityLabel: "Aisyah Rahman", old: null, next: null },
    { u: 2, m: 705, action: "LOGIN", module: "Access", entityType: "users", entityId: 2, entityLabel: "Hafiz Roslan", old: null, next: null },
    { u: 1, m: 60 * 26, action: "UPDATE", module: "Archive Taxonomy", entityType: "categories", entityId: 4, entityLabel: "Category: Annual report", old: { name: "Annual Report" }, next: { name: "Annual report" } },
    { u: 1, m: 60 * 27, action: "LOGOUT", module: "Access", entityType: "users", entityId: 1, entityLabel: "Aisyah Rahman", old: null, next: null },
    { u: 2, m: 60 * 30, action: "CREATE", module: "About", entityType: "timeline_events", entityId: 31, entityLabel: "2025: Joint trial with partner university", old: null, next: { event_year: 2025, is_major: true } },
    { u: 1, m: 60 * 50, action: "UPDATE", module: "Home Page", entityType: "page_sections", entityId: 6, entityLabel: "Main banner", old: { heading: "Advancing UAS research" }, next: { heading: "Advancing unmanned aerial systems research" } },
    { u: 2, m: 60 * 52, action: "PUBLISH", module: "Publications and Impact", entityType: "annual_highlights", entityId: 2025, entityLabel: "Annual research highlights 2025", old: { status: "draft" }, next: { status: "published" } },
    { u: 1, m: 60 * 72, action: "CREATE", module: "People", entityType: "postgraduate_students", entityId: 64, entityLabel: "Nur Aina Binti Zakaria", old: null, next: { level: "PhD", status: "current" } },
    { u: 9, m: 60 * 80, action: "EXPORT", module: "Access", entityType: "audit_logs", entityId: null, entityLabel: "Audit log, COE-UAS (210 rows)", old: null, next: { rows: 210 } },
].map((e, i) => ({
    id: 1000 - i, user: U[e.u], action: e.action, module: e.module, entityType: e.entityType, entityId: e.entityId, entityLabel: e.entityLabel,
    oldValues: e.old, newValues: e.next, ip: e.u === 9 ? "10.0.0.2" : `10.0.0.${3 + e.u}`, userAgent: UA, at: minsAgo(e.m),
}));

/* ------------------------------- helpers -------------------------------- */

const labelOf = (list, value) => list.find((o) => o.value === value)?.label || value || "";
const toneOf = (value) => ACTIONS.find((o) => o.value === value)?.tone || "is-info";
const idEq = (a, b) => String(a) === String(b);
const when = (iso) => (iso ? new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "");
const csvCell = (v) => `"${String(v ?? "").replace(/"/g, '""').replace(/\r?\n/g, " ")}"`;
const pretty = (k) => String(k).replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());

function timeAgo(iso) {
    if (!iso) return "";
    const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / MIN));
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins} min ago`;
    const hrs = Math.round(mins / 60);
    if (hrs < 24) return `${hrs} hr ago`;
    const days = Math.round(hrs / 24);
    return `${days} day${days === 1 ? "" : "s"} ago`;
}

function show(v) {
    if (v === null || v === undefined || v === "") return "(empty)";
    if (typeof v === "boolean") return v ? "Yes" : "No";
    if (typeof v === "object") return JSON.stringify(v);
    return String(v);
}

/* old_values / new_values → a list of changed fields */
function diffOf(oldV, newV) {
    const o = oldV && typeof oldV === "object" ? oldV : {};
    const n = newV && typeof newV === "object" ? newV : {};
    return [...new Set([...Object.keys(o), ...Object.keys(n)])]
        .filter((k) => JSON.stringify(o[k]) !== JSON.stringify(n[k]))
        .map((k) => ({ field: pretty(k), from: show(o[k]), to: show(n[k]), added: !(k in o), removed: !(k in n) }));
}

/* -------------------------------- icons ---------------------------------- */

function Icon({ name, size = 18 }) {
    const p = {
        download: <path d="M12 4v12m0 0-4-4m4 4 4-4M4 20h16" />,
        search: (<><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>),
        down: <path d="m6 10 6 6 6-6" />,
        alert: (<><path d="M12 3 2 20h20z" /><path d="M12 10v4M12 17h.01" /></>),
        lock: (<><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></>),
        check: <path d="m5 12 5 5 9-10" />,
        close: <path d="M18 6 6 18M6 6l12 12" />,
        reset: <path d="M4 12a8 8 0 1 0 3-6.2M4 4v4h4" />,
    }[name];
    return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{p}</svg>;
}

/* ------------------------------ one log row ------------------------------ */

function LogRow({ e, open, onToggle }) {
    const changes = diffOf(e.oldValues, e.newValues);
    const panelId = `lg-panel-${e.id}`;
    return (
        <li className={`lg-item ${open ? "is-open" : ""} ${e.action === "ACCESS_DENIED" ? "is-denied" : ""}`}>
            <button type="button" className="lg-row" aria-expanded={open} aria-controls={panelId} onClick={onToggle}>
                <span className={`lg-pill ${toneOf(e.action)}`}>{labelOf(ACTIONS, e.action)}</span>
                <span className="lg-what"><strong>{e.entityLabel || e.entityType}</strong><small>{e.module}{e.entityType ? `, ${e.entityType}` : ""}</small></span>
                <span className="lg-who">{e.user?.name || "System"}</span>
                <span className="lg-when" title={when(e.at)}>{timeAgo(e.at)}</span>
                <span className="lg-chev"><Icon name="down" size={16} /></span>
            </button>
            {open && (
                <div className="lg-panel" id={panelId}>
                    <dl className="lg-meta">
                        <div><dt>Date and time</dt><dd>{when(e.at)}</dd></div>
                        <div><dt>Done by</dt><dd>{e.user?.name || "System"}</dd></div>
                        <div><dt>Record</dt><dd>{e.entityType || "None"}{e.entityId ? ` #${e.entityId}` : ""}</dd></div>
                        <div><dt>IP address</dt><dd>{e.ip || "Not recorded"}</dd></div>
                        <div className="is-wide"><dt>Browser</dt><dd>{e.userAgent || "Not recorded"}</dd></div>
                    </dl>
                    {changes.length > 0 ? (
                        <table className="lg-diff">
                            <thead><tr><th scope="col">Field</th><th scope="col">Before</th><th scope="col">After</th></tr></thead>
                            <tbody>{changes.map((c) => (
                                <tr key={c.field}><th scope="row">{c.field}</th><td className={c.added ? "is-none" : "is-old"}>{c.from}</td><td className={c.removed ? "is-none" : "is-new"}>{c.to}</td></tr>
                            ))}</tbody>
                        </table>
                    ) : <p className="lg-nodiff">No field values were recorded for this action.</p>}
                </div>
            )}
        </li>
    );
}

/* -------------------------------- the page -------------------------------- */

export default function AdminCOEUASLog() {
    const { props } = usePage();
    const live = Boolean(props.logs?.entries);
    const L = props.logs || {};

    const me = live ? L.me : SAMPLE_ME;
    const canViewAll = live ? Boolean(L.canViewAll) : true;
    const canExport = live ? Boolean(L.canExport) : true;
    const entries = live ? L.entries : sampleEntries;
    const users = live ? L.users || [] : sampleUsers;

    const [scope, setScope] = useState("mine");
    const [q, setQ] = useState("");
    const [action, setAction] = useState("all");
    const [module, setModule] = useState("all");
    const [user, setUser] = useState("all");
    const [from, setFrom] = useState("");
    const [to, setTo] = useState("");
    const [sort, setSort] = useState("newest");
    const [page, setPage] = useState(1);
    const [openId, setOpenId] = useState(null);
    const [toast, setToast] = useState(null);

    const allScope = canViewAll && scope === "site";
    const term = q.trim().toLowerCase();
    const filtered = useMemo(() => {
        const fromT = from ? new Date(`${from}T00:00:00`).getTime() : null;
        const toT = to ? new Date(`${to}T23:59:59.999`).getTime() : null;
        return entries
            .filter((e) => allScope || idEq(e.user?.id, me?.id))
            .filter((e) =>
                (action === "all" || e.action === action) &&
                (module === "all" || e.module === module) &&
                (!allScope || user === "all" || idEq(e.user?.id, user)) &&
                (fromT === null || new Date(e.at).getTime() >= fromT) &&
                (toT === null || new Date(e.at).getTime() <= toT) &&
                (!term || `${e.entityLabel} ${e.entityType} ${e.module} ${e.user?.name} ${e.ip}`.toLowerCase().includes(term)))
            .sort((a, b) => (sort === "newest" ? -1 : 1) * a.at.localeCompare(b.at));
    }, [entries, allScope, me, action, module, user, from, to, term, sort]);

    useEffect(() => { setPage(1); setOpenId(null); }, [scope, q, action, module, user, from, to, sort]);
    useEffect(() => {
        if (!toast) return undefined;
        const t = setTimeout(() => setToast(null), 5000);
        return () => clearTimeout(t);
    }, [toast]);

    const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    const stats = {
        total: filtered.length,
        changes: filtered.filter((e) => CHANGE_ACTIONS.includes(e.action)).length,
        signins: filtered.filter((e) => e.action === "LOGIN" || e.action === "LOGOUT").length,
        exports: filtered.filter((e) => e.action === "EXPORT").length,
        denied: filtered.filter((e) => e.action === "ACCESS_DENIED").length,
    };
    const filtering = action !== "all" || module !== "all" || user !== "all" || from || to || term;
    const clear = () => { setQ(""); setAction("all"); setModule("all"); setUser("all"); setFrom(""); setTo(""); };

    /* live: the server streams the CSV and logs EXPORT. sample: build the CSV here. */
    const exportCsv = () => {
        const a = document.createElement("a");
        if (live) {
            a.href = `${ENDPOINTS.export}?${new URLSearchParams({ scope, action, module, user, from, to, q: term })}`;
        } else {
            const head = ["Reference", "Date and time", "User", "Action", "Module", "Record type", "Record id", "Record", "IP address", "Before", "After"];
            const body = filtered.map((e) => [e.id, e.at, e.user?.name, e.action, e.module, e.entityType, e.entityId, e.entityLabel, e.ip, JSON.stringify(e.oldValues ?? ""), JSON.stringify(e.newValues ?? "")]);
            a.href = URL.createObjectURL(new Blob([[head, ...body].map((r) => r.map(csvCell).join(",")).join("\r\n")], { type: "text/csv;charset=utf-8" }));
            a.download = `coeuas-activity-log-${new Date().toISOString().slice(0, 10)}.csv`;
        }
        document.body.appendChild(a); a.click(); a.remove();
        setToast({ tone: "ok", text: `Exporting ${filtered.length} log entr${filtered.length === 1 ? "y" : "ies"}. The export is recorded in the log.` });
    };

    const title = allScope ? "COE-UAS activity log" : "My activity log";
    const text = allScope
        ? "Every change, sign-in and export made in the COE-UAS workspace, from the audit log."
        : "What you did in the COE-UAS workspace: changes, publishing, exports and sign-ins.";

    return (
        <div className="coeuas-logs">
            <div className="lg-heading">
                <div>
                    <h1>{title}</h1>
                    <p>{text}</p>
                    <div className="lg-status">
                        <span className="lg-pill is-off"><Icon name="lock" size={12} /> &nbsp;Read only. Entries cannot be edited or deleted.</span>
                    </div>
                </div>
                <div className="lg-actions">
                    {canExport ? (
                        <button type="button" className="lg-btn-dark" onClick={exportCsv} disabled={filtered.length === 0}>
                            <span className="lg-btn-icon"><Icon name="download" size={16} /></span> Export {filtered.length} as CSV
                        </button>
                    ) : null}
                </div>
            </div>

            {!live && <p className="lg-note"><Icon name="alert" size={16} /><span>Sample data. Every control works, but nothing is stored until your controller sends the <b>logs</b> prop.</span></p>}

            {canViewAll && (
                <div className="lg-tabs" role="tablist" aria-label="Log scope">
                    <button type="button" role="tab" aria-selected={scope === "mine"} className={scope === "mine" ? "is-active" : ""} onClick={() => setScope("mine")}>My activity</button>
                    <button type="button" role="tab" aria-selected={scope === "site"} className={scope === "site" ? "is-active" : ""} onClick={() => setScope("site")}>All COE-UAS activity</button>
                </div>
            )}

            <div className="lg-stats" aria-label="Summary of the entries shown">
                <div className="lg-stat"><strong>{stats.total}</strong><span>Entries</span></div>
                <div className="lg-stat"><strong>{stats.changes}</strong><span>Content changes</span></div>
                <div className="lg-stat"><strong>{stats.signins}</strong><span>Sign-ins and sign-outs</span></div>
                <div className="lg-stat"><strong>{stats.exports}</strong><span>Exports</span></div>
                <div className={`lg-stat ${stats.denied ? "is-alert" : ""}`}><strong>{stats.denied}</strong><span>Access denied</span></div>
            </div>

            <div className="lg-box">
                <div className="lg-toolbar">
                    <label className="lg-search"><Icon name="search" size={16} /><input type="search" value={q} placeholder="Search record, module, person or IP" aria-label="Search the log" onChange={(e) => setQ(e.target.value)} /></label>
                    <select className="lg-input" aria-label="Action" value={action} onChange={(e) => setAction(e.target.value)}>
                        <option value="all">Any action</option>{ACTIONS.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
                    </select>
                    <select className="lg-input" aria-label="Module" value={module} onChange={(e) => setModule(e.target.value)}>
                        <option value="all">Any module</option>{MODULES.map((m) => <option key={m} value={m}>{m}</option>)}
                    </select>
                    {allScope && (
                        <select className="lg-input" aria-label="Person" value={user} onChange={(e) => setUser(e.target.value)}>
                            <option value="all">Anyone</option>{users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                        </select>
                    )}
                    <label className="lg-date"><span>From</span><input className="lg-input" type="date" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} /></label>
                    <label className="lg-date"><span>To</span><input className="lg-input" type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} /></label>
                    <select className="lg-input" aria-label="Sort" value={sort} onChange={(e) => setSort(e.target.value)}>
                        <option value="newest">Newest first</option><option value="oldest">Oldest first</option>
                    </select>
                    {filtering && <button type="button" className="lg-btn-small" onClick={clear}><Icon name="reset" size={14} /> Clear filters</button>}
                </div>

                {filtered.length === 0 ? (
                    <p className="lg-empty">{filtering ? "No entries match these filters." : "Nothing recorded yet. Your actions in the workspace appear here."}</p>
                ) : (
                    <>
                        <ol className="lg-list">
                            {visible.map((e) => <LogRow key={e.id} e={e} open={idEq(openId, e.id)} onToggle={() => setOpenId((cur) => (idEq(cur, e.id) ? null : e.id))} />)}
                        </ol>
                        <div className="lg-pager">
                            <small>Showing {(page - 1) * PAGE_SIZE + 1} to {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}</small>
                            <div>
                                <button type="button" className="lg-btn-small" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
                                <span>Page {page} of {pages}</span>
                                <button type="button" className="lg-btn-small" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>Next</button>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {toast && (
                <div className={`lg-toast is-${toast.tone}`} role="status">
                    <Icon name={toast.tone === "error" ? "alert" : "check"} size={16} /><span>{toast.text}</span>
                    <button type="button" aria-label="Dismiss" onClick={() => setToast(null)}><Icon name="close" size={14} /></button>
                </div>
            )}
        </div>
    );
}

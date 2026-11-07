import { useEffect, useMemo, useRef, useState } from "react";
import { Head, Link, router, usePage } from "@inertiajs/react";
// Same routes file the PSB dashboard uses.
import { PSB_BASE, PSB_ROUTES } from "../../Components/Admin-PSB-Components/psbRoutes";
import "../../../css/admin-PSB-css/admin-subscribers.css";

/* ------------------------------------------------------------------
   PSB ADMIN: SUBSCRIBERS

   From the Admin CMS design document:
   • Site map 1.2:   "Subscribers: subscriber list, search, export"
   • Use case UC-P30: "Manage Subscribers: view, search, export, unsubscribe"
   • ERD-3 table  subscribers  (id, site_id, email UQ, status
     ENUM(active, unsubscribed), subscribed_at, unsubscribed_at NULL)
   • Public page "Subscribe for Updates" is where people join; an
     administrator cannot add or edit an email here.
   • Every unsubscribe is an UPDATE audit entry, every export an EXPORT entry.

   The controller should send  props.subscribers  with this shape
   (only the PSB site's rows, newest first is fine):

   Inertia::render('Admin/PSB/Subscribers', [
       'subscribers' => [
           'items' => [
               ['id' => 1, 'email' => 'name@example.com', 'status' => 'active',
                'subscribed_at' => '2026-10-20T03:12:00Z', 'unsubscribed_at' => null],
           ],
       ],
   ]);

   Until it does, SAMPLE data is shown and labelled "Sample data".

   Actions the server must handle (change the URLs below to your routes):
   • POST UNSUBSCRIBE_URL  { ids: [1, 2] }  -> set status = unsubscribed, unsubscribed_at = now,
                                               write audit_logs UPDATE, in one transaction
   • POST EXPORT_LOG_URL   { format, rows, filters } -> write audit_logs EXPORT
   This page filters and pages the rows it is given (client side). For a very large
   list, send one page at a time and move the filters to the query string.
------------------------------------------------------------------- */
const UNSUBSCRIBE_URL = `${PSB_BASE}/subscribers/unsubscribe`;
const EXPORT_LOG_URL = `${PSB_BASE}/subscribers/export`;
const PAGE_SIZE = 10;
const TZ = "Asia/Kuala_Lumpur";

const daysAgo = (d, h = 0) => new Date(Date.now() - (d * 24 + h) * 3600000).toISOString();

const SAMPLE_ITEMS = [
    ["aisyah.rahman@example.com", "active", 0, 3],
    ["daniel.tan@example.com", "active", 1, 6],
    ["nurhuda@example.com", "active", 2, 1],
    ["kevin.lim@example.com", "active", 3, 9],
    ["safiya.aziz@example.com", "active", 5, 2],
    ["hafiz.omar@example.com", "unsubscribed", 8, 0, 2],
    ["media.desk@example.com", "active", 9, 4],
    ["farah.nadia@example.com", "active", 12, 7],
    ["research.office@example.com", "active", 15, 0],
    ["jason.wong@example.com", "unsubscribed", 21, 5, 6],
    ["amir.hamzah@example.com", "active", 24, 8],
    ["siti.mariam@example.com", "active", 29, 3],
    ["ops.team@example.com", "active", 33, 1],
    ["lee.chen@example.com", "active", 38, 6],
    ["info@example.com", "unsubscribed", 44, 2, 20],
    ["zulkifli.yusof@example.com", "active", 51, 4],
    ["priya.nair@example.com", "active", 58, 9],
    ["student.club@example.com", "active", 66, 0],
    ["haslina.ismail@example.com", "active", 73, 5],
    ["tech.partner@example.com", "unsubscribed", 80, 3, 31],
    ["razak.sulaiman@example.com", "active", 94, 7],
    ["olivia.brown@example.com", "active", 108, 2],
    ["newsletter@example.com", "active", 121, 6],
    ["wan.nurul@example.com", "active", 139, 1],
    ["engineer.pro@example.com", "active", 152, 8],
    ["mohd.shahril@example.com", "unsubscribed", 163, 4, 70],
    ["grace.tay@example.com", "active", 171, 3],
].map(([email, status, d, h, unsubAfter], i) => ({
    id: i + 1,
    email,
    status,
    subscribed_at: daysAgo(d, h),
    unsubscribed_at: status === "unsubscribed" ? daysAgo(Math.max(0, d - unsubAfter)) : null,
}));

const SAMPLE = { items: SAMPLE_ITEMS };

/* ------------------------------ helpers ------------------------------ */

const dateFmt = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, day: "2-digit", month: "short", year: "numeric" });
const timeFmt = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hour12: false });
const monthKey = (d) => new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit" }).format(d).slice(0, 7);
const monthShort = (d) => new Intl.DateTimeFormat("en-GB", { timeZone: TZ, month: "short" }).format(d);
const ymd = (d) => new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(d);

function timeAgo(iso) {
    const min = Math.floor(Math.max(0, Date.now() - new Date(iso).getTime()) / 60000);
    if (min < 1) return "just now";
    if (min < 60) return `${min} min ago`;
    const hours = Math.floor(min / 60);
    if (hours < 24) return `${hours} h ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? "s" : ""} ago`;
}

const csvCell = (v) => {
    const s = v === null || v === undefined ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

function Icon({ name, size = 16 }) {
    const icons = {
        search: (<><circle cx="11" cy="11" r="6" /><path d="m20 20-4.2-4.2" /></>),
        download: <path d="M12 4v11m0 0-4-4m4 4 4-4M5 20h14" />,
        mail: (<><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-10 6L2 7" /></>),
        users: (<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>),
        userOff: (<><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><path d="m17 8 5 5M22 8l-5 5" /></>),
        trend: (<><polyline points="3 17 9 11 13 15 21 7" /><polyline points="15 7 21 7 21 13" /></>),
        arrow: (<><path d="M7 17 17 7" /><path d="M8 7h9v9" /></>),
        copy: (<><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V6a2 2 0 0 1 2-2h9" /></>),
        check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
        x: <path d="M6 6l12 12M18 6 6 18" />,
        left: <path d="m15 6-6 6 6 6" />,
        right: <path d="m9 6 6 6-6 6" />,
        sort: <path d="m8 9 4-4 4 4M8 15l4 4 4-4" />,
        shield: <path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11z" />,
        lock: (<><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></>),
    };
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            {icons[name]}
        </svg>
    );
}

/* ------------------------------ pieces ------------------------------- */

function StatCard({ title, value, note, icon, highlight }) {
    return (
        <article className={`sbs-card sbs-stat ${highlight ? "is-highlight" : ""}`}>
            <div className="sbs-stat-top">
                <h3>{title}</h3>
                <span className="sbs-stat-icon"><Icon name={icon} size={16} /></span>
            </div>
            <strong className="sbs-stat-value">{value}</strong>
            <p className="sbs-stat-note">{note}</p>
        </article>
    );
}

function SignupsChart({ items }) {
    const months = useMemo(() => {
        const out = [];
        const now = new Date();
        for (let i = 5; i >= 0; i -= 1) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 15);
            out.push({ key: monthKey(d), label: monthShort(d), value: 0 });
        }
        items.forEach((s) => {
            const k = monthKey(new Date(s.subscribed_at));
            const m = out.find((x) => x.key === k);
            if (m) m.value += 1;
        });
        return out;
    }, [items]);

    const max = Math.max(1, ...months.map((m) => m.value));
    const peak = months.findIndex((m) => m.value === max && m.value > 0);
    const total = months.reduce((n, m) => n + m.value, 0);

    return (
        <article className="sbs-card sbs-chart">
            <div className="sbs-card-head">
                <div>
                    <h2>New Subscribers</h2>
                    <p>{total} in the last 6 months</p>
                </div>
            </div>

            <div className="sbs-bars" role="img" aria-label="New subscribers per month, last 6 months">
                {months.map((m, i) => {
                    const ratio = m.value / max;
                    const level = m.value === 0 ? "none" : ratio >= 0.7 ? "high" : ratio >= 0.35 ? "mid" : "low";
                    const height = m.value === 0 ? 40 : 26 + ratio * 74;
                    return (
                        <div className="sbs-bar-col" key={m.key}>
                            <div className="sbs-bar-track">
                                {i === peak && <span className="sbs-bar-tip">{m.value}</span>}
                                <div className={`sbs-bar level-${level}`} style={{ height: `${height}%` }} />
                            </div>
                            <span className={`sbs-bar-label ${i === months.length - 1 ? "is-now" : ""}`}>{m.label}</span>
                        </div>
                    );
                })}
            </div>
        </article>
    );
}

function NotesCard() {
    return (
        <article className="sbs-card sbs-notes">
            <div className="sbs-card-head">
                <h2>How subscribers work</h2>
            </div>
            <ul>
                <li><Icon name="mail" size={15} /><span>People join from <b>Subscribe for Updates</b> on the public site. Emails cannot be added or edited here.</span></li>
                <li><Icon name="userOff" size={15} /><span>Unsubscribing stops updates for that address. It is recorded in the audit log.</span></li>
                <li><Icon name="download" size={15} /><span>Every export is logged with who exported it and when.</span></li>
                <li><Icon name="lock" size={15} /><span>Subscriber emails are personal data, visible only to PSB admins and the Super Admin.</span></li>
            </ul>
            <Link href={PSB_ROUTES.enquiries} className="sbs-link">Go to enquiries <Icon name="arrow" size={13} /></Link>
        </article>
    );
}

function ConfirmDialog({ count, busy, onCancel, onConfirm }) {
    const ref = useRef(null);

    useEffect(() => {
        ref.current?.querySelector("[data-confirm]")?.focus();
        const onKey = (e) => e.key === "Escape" && !busy && onCancel();
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [busy, onCancel]);

    return (
        <div className="sbs-overlay" onMouseDown={(e) => e.target === e.currentTarget && !busy && onCancel()}>
            <div className="sbs-dialog" role="alertdialog" aria-modal="true" aria-labelledby="sbs-dialog-title" ref={ref}>
                <span className="sbs-dialog-icon"><Icon name="userOff" size={20} /></span>
                <h3 id="sbs-dialog-title">Unsubscribe {count} {count === 1 ? "subscriber" : "subscribers"}?</h3>
                <p>They will stop receiving updates. This change is recorded in the audit log.</p>
                <div className="sbs-dialog-actions">
                    <button type="button" className="sbs-btn-outline" onClick={onCancel} disabled={busy}>Cancel</button>
                    <button type="button" className="sbs-btn-yellow" data-confirm onClick={onConfirm} disabled={busy}>
                        {busy ? "Unsubscribing..." : "Unsubscribe"}
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ------------------------------- page -------------------------------- */

const STATUS_FILTERS = [
    { key: "all", label: "All" },
    { key: "active", label: "Active" },
    { key: "unsubscribed", label: "Unsubscribed" },
];

export default function AdminSubscribers() {
    const { props } = usePage();
    const isSample = !props.subscribers;
    const source = props.subscribers ?? SAMPLE;

    const [items, setItems] = useState(source.items);
    const [query, setQuery] = useState("");
    const [status, setStatus] = useState("all");
    const [from, setFrom] = useState("");
    const [to, setTo] = useState("");
    const [sortKey, setSortKey] = useState("date");   // 'date' | 'email'
    const [sortDir, setSortDir] = useState("desc");
    const [page, setPage] = useState(1);
    const [selected, setSelected] = useState(() => new Set());
    const [confirmIds, setConfirmIds] = useState(null);
    const [busy, setBusy] = useState(false);
    const [notice, setNotice] = useState(null);       // { type: 'ok' | 'error', text }
    const [copied, setCopied] = useState(null);
    const allRef = useRef(null);

    /* keep local rows in step with new props after a reload */
    useEffect(() => { setItems(source.items); }, [source.items]);

    /* ---------- numbers ---------- */
    const stats = useMemo(() => {
        const active = items.filter((s) => s.status === "active").length;
        const thisMonth = monthKey(new Date());
        return {
            total: items.length,
            active,
            unsubscribed: items.length - active,
            fresh: items.filter((s) => monthKey(new Date(s.subscribed_at)) === thisMonth).length,
            retention: items.length ? Math.round((active / items.length) * 100) : 0,
        };
    }, [items]);

    /* ---------- filter + sort ---------- */
    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        const start = from ? new Date(`${from}T00:00:00+08:00`).getTime() : null;
        const end = to ? new Date(`${to}T23:59:59.999+08:00`).getTime() : null;

        const rows = items.filter((s) => {
            const t = new Date(s.subscribed_at).getTime();
            if (status !== "all" && s.status !== status) return false;
            if (start !== null && t < start) return false;
            if (end !== null && t > end) return false;
            if (q && !s.email.toLowerCase().includes(q)) return false;
            return true;
        });

        rows.sort((a, b) => {
            const d = sortKey === "email"
                ? a.email.localeCompare(b.email)
                : new Date(a.subscribed_at) - new Date(b.subscribed_at);
            return sortDir === "asc" ? d : -d;
        });
        return rows;
    }, [items, query, status, from, to, sortKey, sortDir]);

    const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const safePage = Math.min(page, pages);
    const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
    const selectable = pageRows.filter((s) => s.status === "active");
    const allOnPage = selectable.length > 0 && selectable.every((s) => selected.has(s.id));
    const someOnPage = selectable.some((s) => selected.has(s.id));
    const activeFilters = (query ? 1 : 0) + (status !== "all" ? 1 : 0) + (from || to ? 1 : 0);

    useEffect(() => {
        if (allRef.current) allRef.current.indeterminate = someOnPage && !allOnPage;
    }, [someOnPage, allOnPage]);

    /* ---------- actions ---------- */
    const resetPage = () => setPage(1);
    const clearFilters = () => { setQuery(""); setStatus("all"); setFrom(""); setTo(""); setPage(1); };

    const toggleSort = (key) => {
        if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        else { setSortKey(key); setSortDir(key === "email" ? "asc" : "desc"); }
        setPage(1);
    };

    const toggleOne = (id) => setSelected((prev) => {
        const next = new Set(prev);
        next.has(id) ? next.delete(id) : next.add(id);
        return next;
    });

    const togglePage = () => setSelected((prev) => {
        const next = new Set(prev);
        if (allOnPage) selectable.forEach((s) => next.delete(s.id));
        else selectable.forEach((s) => next.add(s.id));
        return next;
    });

    const unsubscribe = () => {
        if (!confirmIds || busy) return;
        setBusy(true);
        router.post(
            UNSUBSCRIBE_URL,
            { ids: confirmIds },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    const now = new Date().toISOString();
                    setItems((rows) => rows.map((s) => (confirmIds.includes(s.id) ? { ...s, status: "unsubscribed", unsubscribed_at: now } : s)));
                    setSelected((prev) => { const next = new Set(prev); confirmIds.forEach((id) => next.delete(id)); return next; });
                    setNotice({ type: "ok", text: `${confirmIds.length} ${confirmIds.length === 1 ? "subscriber" : "subscribers"} unsubscribed.` });
                    setConfirmIds(null);
                },
                onError: () => setNotice({ type: "error", text: "Could not unsubscribe. Nothing was changed." }),
                onFinish: () => setBusy(false),
            }
        );
    };

    const exportCsv = () => {
        const head = ["id", "email", "status", "subscribed_at_utc", "unsubscribed_at_utc"];
        const lines = [head.join(",")];
        filtered.forEach((s) => lines.push([s.id, s.email, s.status, s.subscribed_at, s.unsubscribed_at ?? ""].map(csvCell).join(",")));
        const blob = new Blob(["\ufeff" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `psb-subscribers-${ymd(new Date())}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        setNotice({ type: "ok", text: `Exported ${filtered.length} ${filtered.length === 1 ? "subscriber" : "subscribers"} to CSV. The export is logged.` });
        try {
            router.post(EXPORT_LOG_URL, { format: "CSV", rows: filtered.length, filters: { query, status, from, to } }, { preserveScroll: true, preserveState: true, onError: () => {} });
        } catch (e) { /* the download already happened; the log call is best effort here */ }
    };

    const copyEmail = async (s) => {
        try {
            await navigator.clipboard.writeText(s.email);
            setCopied(s.id);
            setTimeout(() => setCopied((c) => (c === s.id ? null : c)), 1400);
        } catch (e) { /* clipboard blocked */ }
    };

    const sortHead = (label, k) => (
        <button type="button" className={`sbs-sort ${sortKey === k ? "is-on" : ""}`} onClick={() => toggleSort(k)}>
            {label}
            <Icon name="sort" size={13} />
            {sortKey === k && <span className="sr-only">{sortDir === "asc" ? "ascending" : "descending"}</span>}
        </button>
    );

    /* ---------- render ---------- */
    return (
        <>
            <Head title="PSB Subscribers" />

            <section className="sbs">
                {/* HEADER */}
                <header className="sbs-header">
                    <div>
                        <h1>Subscribers</h1>
                        <p>
                            People who subscribed for updates on the Sandbox website.
                            {isSample && <span className="sbs-sample">Sample data</span>}
                        </p>
                    </div>

                    <div className="sbs-header-actions">
                        <button type="button" className="sbs-btn-primary" onClick={exportCsv} disabled={!filtered.length}>
                            <Icon name="download" size={17} />
                            Export CSV
                        </button>
                    </div>
                </header>

                {notice && (
                    <p className={`sbs-notice is-${notice.type}`} role="status">
                        {notice.text}
                        <button type="button" onClick={() => setNotice(null)} aria-label="Dismiss"><Icon name="x" size={14} /></button>
                    </p>
                )}

                {/* STATS */}
                <div className="sbs-stats">
                    <StatCard highlight title="Total Subscribers" value={stats.total} icon="users" note={`${stats.retention}% still subscribed`} />
                    <StatCard title="Active" value={stats.active} icon="mail" note="Receiving updates" />
                    <StatCard title="Unsubscribed" value={stats.unsubscribed} icon="userOff" note="Opted out" />
                    <StatCard title="New This Month" value={stats.fresh} icon="trend" note="Joined this calendar month" />
                </div>

                <div className="sbs-layout">
                    {/* LIST */}
                    <article className="sbs-card sbs-list">
                        <div className="sbs-toolbar">
                            <label className="sbs-search">
                                <Icon name="search" size={15} />
                                <input
                                    type="search"
                                    value={query}
                                    onChange={(e) => { setQuery(e.target.value); resetPage(); }}
                                    placeholder="Search by email"
                                    aria-label="Search subscribers by email"
                                />
                            </label>

                            <div className="sbs-seg" role="group" aria-label="Filter by status">
                                {STATUS_FILTERS.map((f) => (
                                    <button key={f.key} type="button" className={status === f.key ? "is-on" : ""} aria-pressed={status === f.key}
                                        onClick={() => { setStatus(f.key); resetPage(); }}>
                                        {f.label}
                                    </button>
                                ))}
                            </div>

                            <label className="sbs-date">
                                <span>From</span>
                                <input type="date" value={from} max={to || undefined} onChange={(e) => { setFrom(e.target.value); resetPage(); }} />
                            </label>
                            <label className="sbs-date">
                                <span>To</span>
                                <input type="date" value={to} min={from || undefined} onChange={(e) => { setTo(e.target.value); resetPage(); }} />
                            </label>

                            {activeFilters > 0 && (
                                <button type="button" className="sbs-clear" onClick={clearFilters}>
                                    <Icon name="x" size={13} /> Clear
                                </button>
                            )}
                        </div>

                        {selected.size > 0 && (
                            <div className="sbs-bulk" role="region" aria-label="Selected subscribers">
                                <p><b>{selected.size}</b> selected</p>
                                <div>
                                    <button type="button" className="sbs-btn-outline sbs-sm" onClick={() => setSelected(new Set())}>Clear</button>
                                    <button type="button" className="sbs-btn-yellow sbs-sm" onClick={() => setConfirmIds([...selected])}>
                                        <Icon name="userOff" size={14} /> Unsubscribe
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="sbs-table-wrap">
                            <table className="sbs-table">
                                <thead>
                                    <tr>
                                        <th className="sbs-check-col">
                                            <input ref={allRef} type="checkbox" checked={allOnPage} onChange={togglePage}
                                                disabled={selectable.length === 0} aria-label="Select all active subscribers on this page" />
                                        </th>
                                        <th>{sortHead("Email", "email")}</th>
                                        <th>Status</th>
                                        <th>{sortHead("Subscribed", "date")}</th>
                                        <th>Unsubscribed</th>
                                        <th aria-label="Actions" />
                                    </tr>
                                </thead>

                                <tbody>
                                    {pageRows.map((s, i) => {
                                        const active = s.status === "active";
                                        return (
                                            <tr key={s.id} className={selected.has(s.id) ? "is-selected" : ""}>
                                                <td className="sbs-check-col">
                                                    <input type="checkbox" checked={selected.has(s.id)} disabled={!active}
                                                        onChange={() => toggleOne(s.id)} aria-label={`Select ${s.email}`} />
                                                </td>
                                                <td>
                                                    <span className="sbs-who">
                                                        <span className={`sbs-avatar v${(s.id + i) % 4}`}>{s.email.slice(0, 1).toUpperCase()}</span>
                                                        <span className="sbs-email">{s.email}</span>
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className={`sbs-chip ${active ? "tone-yellow" : "tone-muted"}`}>{active ? "Active" : "Unsubscribed"}</span>
                                                </td>
                                                <td className="sbs-when">
                                                    <strong>{dateFmt.format(new Date(s.subscribed_at))}</strong>
                                                    <small>{timeFmt.format(new Date(s.subscribed_at))} · {timeAgo(s.subscribed_at)}</small>
                                                </td>
                                                <td className="sbs-when">
                                                    {s.unsubscribed_at ? (
                                                        <>
                                                            <strong>{dateFmt.format(new Date(s.unsubscribed_at))}</strong>
                                                            <small>{timeAgo(s.unsubscribed_at)}</small>
                                                        </>
                                                    ) : <span className="sbs-dash">-</span>}
                                                </td>
                                                <td className="sbs-row-actions">
                                                    <button type="button" className="sbs-icon-btn" onClick={() => copyEmail(s)} aria-label={`Copy ${s.email}`} title="Copy email">
                                                        <Icon name={copied === s.id ? "check" : "copy"} size={15} />
                                                    </button>
                                                    {active && (
                                                        <button type="button" className="sbs-icon-btn is-danger" onClick={() => setConfirmIds([s.id])} aria-label={`Unsubscribe ${s.email}`} title="Unsubscribe">
                                                            <Icon name="userOff" size={15} />
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}

                                    {pageRows.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="sbs-empty">
                                                <strong>{items.length === 0 ? "No subscribers yet." : "No subscribers match these filters."}</strong>
                                                {items.length > 0 && <button type="button" className="sbs-clear" onClick={clearFilters}>Clear filters</button>}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <footer className="sbs-pager">
                            <p>
                                {filtered.length === 0
                                    ? "0 subscribers"
                                    : `${(safePage - 1) * PAGE_SIZE + 1} to ${Math.min(safePage * PAGE_SIZE, filtered.length)} of ${filtered.length} subscribers`}
                            </p>
                            <div className="sbs-pager-btns">
                                <button type="button" onClick={() => setPage(safePage - 1)} disabled={safePage <= 1} aria-label="Previous page"><Icon name="left" size={15} /></button>
                                <span>Page {safePage} of {pages}</span>
                                <button type="button" onClick={() => setPage(safePage + 1)} disabled={safePage >= pages} aria-label="Next page"><Icon name="right" size={15} /></button>
                            </div>
                        </footer>
                    </article>

                    {/* SIDE */}
                    <div className="sbs-side">
                        <SignupsChart items={items} />
                        <NotesCard />
                    </div>
                </div>
            </section>

            {confirmIds && (
                <ConfirmDialog count={confirmIds.length} busy={busy} onCancel={() => setConfirmIds(null)} onConfirm={unsubscribe} />
            )}
        </>
    );
}

// Inertia persistent layout: sidebar + topbar stay mounted between pages.

import { useEffect, useMemo, useRef, useState } from "react";
import { Link, router, usePage } from "@inertiajs/react";
// Same helper file the dashboard uses
import { ROUTES } from "../../Components/Admin-Components/adminRoutes";
import "../../../css/admin-css/admin-content-trash.css";

/* ------------------------------------------------------------------
   CONTENT TRASH  (Super Admin Console → /admin/super/trash)

   Site map: "Content trash (restore · purge)".
   Use cases: Delete Any Content → Restore Deleted Content → Purge Permanently.
   In every workspace, "Delete" is a soft delete (deleted_at is set). Only the
   Super Admin can bring an item back or remove it for good. Both actions are
   written to audit_logs (RESTORE / DELETE) by your controller.

   SAMPLE DATA: the page works today with the sample below (changes stay in the
   browser only). Have your controller return an Inertia prop named `trash` and the
   page switches to LIVE mode automatically:

   Inertia::render('admin/SuperAdminContentTrash', ['trash' => [
       'items' => [
           // one entry per soft-deleted row (deleted_at IS NOT NULL), newest first
           ['id' => 12, 'type' => 'post', 'title' => '...', 'site' => 'PSB',
            'deletedBy' => 'Aiman Hakim', 'deletedAt' => '2026-10-30T09:12:00Z',
            'usedIn' => 0],           // media only: how many places still use the file
       ],
   ]]);

   In LIVE mode the buttons POST to the two endpoints below with
   { items: [{ type, id }, ...] }. Add matching routes in Laravel, or change them here.
------------------------------------------------------------------- */

const ENDPOINTS = {
    restore: `${ROUTES.trash}/restore`,
    purge: `${ROUTES.trash}/purge`,
};

const MIN = 60 * 1000;
const DAY = 24 * 60 * MIN;
const NOW = Date.now();
const minsAgo = (m) => new Date(NOW - m * MIN).toISOString();

/* One entry per content table that has deleted_at (see the ERD) */
const TYPES = {
    post: { label: "News & posts", short: "PO", table: "posts" },
    event: { label: "Events", short: "EV", table: "events" },
    page: { label: "Pages", short: "PG", table: "pages" },
    media: { label: "Media files", short: "MD", table: "media_assets" },
    programme: { label: "Programmes", short: "PR", table: "psb_programmes" },
    service: { label: "Services", short: "SV", table: "psb_services" },
    faq: { label: "FAQ", short: "FQ", table: "faq_items" },
    member: { label: "Members", short: "MB", table: "members" },
    publication: { label: "Publications", short: "PB", table: "publications" },
    user: { label: "Admin users", short: "US", table: "users" },
};

const SITES = {
    PSB: { label: "PSB", tone: "psb" },
    COEUAS: { label: "COE-UAS", tone: "coeuas" },
    VERTIPORT: { label: "Vertiport", tone: "vertiport" },
};

const sampleItems = [
    { id: 41, type: "post", title: "Sandbox Launch Media Briefing (draft copy)", site: "PSB", deletedBy: "Aiman Hakim", at: 130, usedIn: 0 },
    { id: 17, type: "event", title: "Open Day: Vertiport Walkthrough", site: "PSB", deletedBy: "Farid Rahman", at: 60 * 26, usedIn: 0 },
    { id: 88, type: "media", title: "site-aerial-old.jpg", site: "PSB", deletedBy: "Aiman Hakim", at: 60 * 24 * 3, usedIn: 2 },
    { id: 9, type: "programme", title: "Open Call: Cargo Pilot (duplicate)", site: "PSB", deletedBy: "Aiman Hakim", at: 60 * 24 * 4, usedIn: 0 },
    { id: 23, type: "member", title: "Dr. Hafiz (duplicate profile)", site: "COEUAS", deletedBy: "Nur Sofea", at: 60 * 24 * 5, usedIn: 0 },
    { id: 31, type: "faq", title: "How long does the review take?", site: "PSB", deletedBy: "Farid Rahman", at: 60 * 24 * 6, usedIn: 0 },
    { id: 52, type: "publication", title: "UAV Path Planning, draft entry", site: "COEUAS", deletedBy: "Nur Sofea", at: 60 * 24 * 8, usedIn: 0 },
    { id: 6, type: "service", title: "Drone Inspection Service (old)", site: "PSB", deletedBy: "Aiman Hakim", at: 60 * 24 * 9, usedIn: 0 },
    { id: 94, type: "media", title: "lab-tour.mp4", site: "COEUAS", deletedBy: "Nur Sofea", at: 60 * 24 * 12, usedIn: 0 },
].map((i) => ({ ...i, deletedAt: minsAgo(i.at) }));

const SORTS = [
    { value: "newest", label: "Newest deleted" },
    { value: "oldest", label: "Oldest deleted" },
    { value: "title", label: "Title A to Z" },
];

const PAGE_SIZE = 8;

/* ------------------------------ helpers ------------------------------ */

function Icon({ name, size = 18 }) {
    const icons = {
        trash: (
            <>
                <path d="M4 7h16M10 11v6M14 11v6" />
                <path d="M6 7l1 13h10l1-13M9 7V4h6v3" />
            </>
        ),
        restore: (
            <>
                <path d="M4 12a8 8 0 1 1 2.4 5.7" />
                <path d="M4 5v7h7" />
            </>
        ),
        search: (
            <>
                <circle cx="11" cy="11" r="6.5" />
                <path d="m20 20-4-4" />
            </>
        ),
        history: (
            <>
                <path d="M3 12a9 9 0 1 0 3-6.7" />
                <path d="M3 4v5h5M12 8v4l3 2" />
            </>
        ),
        alert: (
            <>
                <path d="M12 3 2.5 20h19z" />
                <path d="M12 10v4M12 17.2v.1" />
            </>
        ),
        close: <path d="M6 6l12 12M18 6 6 18" />,
        check: <path d="m5 12 5 5 9-10" />,
        arrow: <path d="M7 17 17 7M8 7h9v9" />,
    };

    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            {icons[name]}
        </svg>
    );
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

function formatDate(iso) {
    const d = new Date(iso);
    return `${d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}, ${d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`;
}

const initialsOf = (name) =>
    (name || "?").split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase();

const uidOf = (item) => `${item.type}:${item.id}`;

/* ------------------------------ pieces ------------------------------- */

function StatCard({ title, value, chip, text, primary, onClick }) {
    return (
        <article className={`trash-card trash-stat ${primary ? "is-primary" : ""}`}>
            <header>
                <h3>{title}</h3>
                {onClick && (
                    <button type="button" className="trash-arrow" aria-label={`Show ${title}`} onClick={onClick}>
                        <Icon name="arrow" size={16} />
                    </button>
                )}
            </header>
            <p className="trash-stat-value">{value}</p>
            <p className="trash-stat-meta">
                {chip && <span className="trash-chip">{chip}</span>}
                <span>{text}</span>
            </p>
        </article>
    );
}

/* Confirmation for permanent deletion. The person must type PURGE */
function PurgeDialog({ items, onCancel, onConfirm }) {
    const [word, setWord] = useState("");
    const inputRef = useRef(null);
    const inUse = items.filter((i) => (i.usedIn || 0) > 0);

    useEffect(() => {
        inputRef.current?.focus();
        const onKey = (e) => e.key === "Escape" && onCancel();
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [onCancel]);

    const ready = word.trim().toUpperCase() === "PURGE";

    return (
        <div className="trash-overlay" onMouseDown={(e) => e.target === e.currentTarget && onCancel()}>
            <div className="trash-dialog" role="dialog" aria-modal="true" aria-labelledby="purge-title">
                <button type="button" className="trash-dialog-close" aria-label="Close" onClick={onCancel}>
                    <Icon name="close" size={18} />
                </button>

                <span className="trash-dialog-icon"><Icon name="trash" size={22} /></span>
                <h2 id="purge-title">
                    Permanently delete {items.length} item{items.length === 1 ? "" : "s"}?
                </h2>
                <p className="trash-dialog-text">This cannot be undone. The records are removed from the database for good.</p>

                <ul className="trash-dialog-list">
                    {items.slice(0, 4).map((i) => (
                        <li key={uidOf(i)}>
                            <span className="trash-type-badge">{TYPES[i.type]?.short}</span>
                            <span>{i.title}</span>
                        </li>
                    ))}
                    {items.length > 4 && <li className="is-more">and {items.length - 4} more</li>}
                </ul>

                {inUse.length > 0 && (
                    <p className="trash-dialog-warn">
                        <Icon name="alert" size={16} />
                        <span>
                            {inUse.length === 1 ? `"${inUse[0].title}" is` : `${inUse.length} files are`} still used in{" "}
                            {inUse.reduce((s, i) => s + i.usedIn, 0)} place(s). Pages that show them will lose the file.
                        </span>
                    </p>
                )}

                <label className="trash-dialog-field">
                    Type <b>PURGE</b> to confirm
                    <input ref={inputRef} value={word} onChange={(e) => setWord(e.target.value)} placeholder="PURGE" autoComplete="off" />
                </label>

                <div className="trash-dialog-actions">
                    <button type="button" className="trash-btn-outline" onClick={onCancel}>Cancel</button>
                    <button type="button" className="trash-btn-danger" disabled={!ready} onClick={onConfirm}>
                        <Icon name="trash" size={15} /> Purge permanently
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ------------------------------- page -------------------------------- */

export default function SuperAdminContentTrash() {
    const { props } = usePage();
    const live = Array.isArray(props.trash?.items);

    const [local, setLocal] = useState(sampleItems);
    const items = live ? props.trash.items : local;

    const [query, setQuery] = useState("");
    const [type, setType] = useState("all");
    const [site, setSite] = useState("all");
    const [sort, setSort] = useState("newest");
    const [page, setPage] = useState(1);
    const [selected, setSelected] = useState(() => new Set());
    const [confirm, setConfirm] = useState(null); // items waiting for purge confirmation
    const [toast, setToast] = useState(null);

    useEffect(() => {
        if (!toast) return undefined;
        const timer = setTimeout(() => setToast(null), 4500);
        return () => clearTimeout(timer);
    }, [toast]);

    /* numbers for the cards and filter chips */
    const summary = useMemo(() => {
        const bySite = (code) => items.filter((i) => i.site === code).length;
        const oldest = items.length ? Math.max(...items.map((i) => Date.now() - new Date(i.deletedAt).getTime())) : 0;
        const counts = {};
        items.forEach((i) => { counts[i.type] = (counts[i.type] || 0) + 1; });
        return { psb: bySite("PSB"), coeuas: bySite("COEUAS"), oldestDays: Math.floor(oldest / DAY), counts };
    }, [items]);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        const list = items.filter((i) => {
            if (type !== "all" && i.type !== type) return false;
            if (site !== "all" && i.site !== site) return false;
            if (!q) return true;
            return [i.title, i.deletedBy, TYPES[i.type]?.label].some((v) => (v || "").toLowerCase().includes(q));
        });
        const time = (i) => new Date(i.deletedAt).getTime();
        return list.sort((a, b) =>
            sort === "oldest" ? time(a) - time(b) : sort === "title" ? a.title.localeCompare(b.title) : time(b) - time(a)
        );
    }, [items, query, type, site, sort]);

    const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const current = Math.min(page, pages);
    const rows = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

    const existing = new Set(items.map(uidOf));
    const chosen = items.filter((i) => selected.has(uidOf(i)) && existing.has(uidOf(i)));
    const allOnPage = rows.length > 0 && rows.every((r) => selected.has(uidOf(r)));
    const someOnPage = rows.some((r) => selected.has(uidOf(r)));
    const filtersActive = query || type !== "all" || site !== "all";

    const change = (setter) => (e) => { setter(e.target.value); setPage(1); };
    const clearFilters = () => { setQuery(""); setType("all"); setSite("all"); setPage(1); };
    const pickType = (value) => { setType(value); setPage(1); };

    const toggleOne = (item) => {
        const next = new Set(selected);
        const key = uidOf(item);
        next.has(key) ? next.delete(key) : next.add(key);
        setSelected(next);
    };

    const togglePage = () => {
        const next = new Set(selected);
        rows.forEach((r) => (allOnPage ? next.delete(uidOf(r)) : next.add(uidOf(r))));
        setSelected(next);
    };

    /* restore or purge. Live mode posts to Laravel, sample mode edits the local list */
    const run = (action, targets) => {
        const payload = { items: targets.map((t) => ({ type: t.type, id: t.id })) };
        const message =
            action === "restore"
                ? `Restored ${targets.length} item${targets.length === 1 ? "" : "s"} to ${targets.length === 1 ? "its" : "their"} workspace.`
                : `Permanently deleted ${targets.length} item${targets.length === 1 ? "" : "s"}.`;

        const finish = () => {
            setSelected(new Set());
            setConfirm(null);
            setToast({ tone: action, text: message });
        };

        if (live) {
            router.post(ENDPOINTS[action], payload, {
                preserveScroll: true,
                onSuccess: finish,
                onError: () => { setConfirm(null); setToast({ tone: "error", text: "Something went wrong. Nothing was changed." }); },
            });
        } else {
            const gone = new Set(targets.map(uidOf));
            setLocal((list) => list.filter((i) => !gone.has(uidOf(i))));
            finish();
        }
    };

    return (
        <div className="admin-trash">
            <div className="trash-heading">
                <div>
                    <h1>Content Trash</h1>
                    <p>Deleted items from every site wait here. Restore them to their workspace or purge them for good.</p>
                </div>

                <div className="trash-actions">
                    <button type="button" className="trash-btn-dark" onClick={() => setConfirm(items)} disabled={!items.length}>
                        <span className="trash-btn-icon"><Icon name="trash" size={15} /></span>
                        Empty Trash
                    </button>
                    <Link href={ROUTES.auditLogs} className="trash-btn-outline">View Audit Logs</Link>
                </div>
            </div>

            <p className="trash-note">
                <Icon name="history" size={16} />
                <span>
                    Deleting in any workspace moves content here first. Only the Super Admin can restore or purge, and every
                    action is recorded in the audit log.
                    {!live && <b> Sample data: changes are not saved.</b>}
                </span>
            </p>

            <div className="trash-grid">
                <StatCard
                    primary
                    title="Items in Trash"
                    value={items.length}
                    chip={summary.oldestDays > 0 ? `${summary.oldestDays}d` : null}
                    text={items.length ? "age of the oldest item" : "nothing waiting"}
                    onClick={clearFilters}
                />
                <StatCard title="PSB" value={summary.psb} text="Perlis Airspace Sandbox" onClick={() => { setSite("PSB"); setPage(1); }} />
                <StatCard title="COE-UAS" value={summary.coeuas} text="Centre of Excellence" onClick={() => { setSite("COEUAS"); setPage(1); }} />
                <StatCard
                    title="In use"
                    value={items.filter((i) => (i.usedIn || 0) > 0).length}
                    chip="Media"
                    text="files still linked to content"
                    onClick={() => pickType("media")}
                />

                <article className="trash-card trash-list">
                    <header className="trash-head">
                        <div>
                            <h3>Deleted Items</h3>
                            <p className="trash-sub">
                                {filtered.length} item{filtered.length === 1 ? "" : "s"}
                                {filtersActive ? " match your filters" : " in trash"}
                            </p>
                        </div>
                    </header>

                    {/* type chips with counts */}
                    <div className="trash-tabs" role="tablist" aria-label="Content type">
                        <button type="button" role="tab" aria-selected={type === "all"} className={type === "all" ? "is-active" : ""} onClick={() => pickType("all")}>
                            All <b>{items.length}</b>
                        </button>
                        {Object.entries(TYPES)
                            .filter(([key]) => summary.counts[key])
                            .map(([key, t]) => (
                                <button key={key} type="button" role="tab" aria-selected={type === key} className={type === key ? "is-active" : ""} onClick={() => pickType(key)}>
                                    {t.label} <b>{summary.counts[key]}</b>
                                </button>
                            ))}
                    </div>

                    <div className="trash-toolbar">
                        <label className="trash-search">
                            <Icon name="search" size={16} />
                            <input type="search" value={query} onChange={change(setQuery)} placeholder="Search title, type or who deleted it" aria-label="Search the trash" />
                        </label>
                        <select value={site} onChange={change(setSite)} aria-label="Workspace">
                            <option value="all">All workspaces</option>
                            <option value="PSB">PSB</option>
                            <option value="COEUAS">COE-UAS</option>
                        </select>
                        <select value={sort} onChange={change(setSort)} aria-label="Sort by">
                            {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </select>
                        {filtersActive && <button type="button" className="trash-clear" onClick={clearFilters}>Clear filters</button>}
                    </div>

                    {chosen.length > 0 && (
                        <div className="trash-selection" role="status">
                            <strong>{chosen.length} selected</strong>
                            <div>
                                <button type="button" className="trash-btn-small" onClick={() => run("restore", chosen)}>
                                    <Icon name="restore" size={13} /> Restore
                                </button>
                                <button type="button" className="trash-btn-small is-danger" onClick={() => setConfirm(chosen)}>
                                    <Icon name="trash" size={13} /> Purge
                                </button>
                                <button type="button" className="trash-clear" onClick={() => setSelected(new Set())}>Clear</button>
                            </div>
                        </div>
                    )}

                    <div className="trash-table-wrap">
                        <table className="trash-table">
                            <thead>
                                <tr>
                                    <th className="col-check">
                                        <input
                                            type="checkbox"
                                            aria-label="Select all on this page"
                                            checked={allOnPage}
                                            ref={(el) => { if (el) el.indeterminate = someOnPage && !allOnPage; }}
                                            onChange={togglePage}
                                            disabled={!rows.length}
                                        />
                                    </th>
                                    <th>Item</th>
                                    <th>Workspace</th>
                                    <th>Deleted by</th>
                                    <th>Deleted</th>
                                    <th className="col-actions">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="trash-empty">
                                            <Icon name={items.length ? "search" : "check"} size={24} />
                                            <strong>{items.length ? "Nothing matches" : "Trash is empty"}</strong>
                                            <span>{items.length ? "Try another search or clear the filters." : "Deleted content from every site will appear here."}</span>
                                        </td>
                                    </tr>
                                )}

                                {rows.map((item) => {
                                    const key = uidOf(item);
                                    const meta = TYPES[item.type] || { label: item.type, short: "??" };
                                    const siteMeta = SITES[item.site];
                                    const checked = selected.has(key);

                                    return (
                                        <tr key={key} className={checked ? "is-selected" : ""}>
                                            <td className="col-check">
                                                <input type="checkbox" checked={checked} onChange={() => toggleOne(item)} aria-label={`Select ${item.title}`} />
                                            </td>
                                            <td>
                                                <span className="trash-item">
                                                    <span className="trash-type-badge" title={meta.label}>{meta.short}</span>
                                                    <span className="trash-item-text">
                                                        <strong title={item.title}>{item.title}</strong>
                                                        <small>
                                                            {meta.label}
                                                            {(item.usedIn || 0) > 0 && <span className="trash-inuse"> · used in {item.usedIn}</span>}
                                                        </small>
                                                    </span>
                                                </span>
                                            </td>
                                            <td>
                                                {siteMeta ? <span className={`trash-site is-${siteMeta.tone}`}>{siteMeta.label}</span> : "None"}
                                            </td>
                                            <td>
                                                <span className="trash-by">
                                                    <span className="trash-avatar">{initialsOf(item.deletedBy)}</span>
                                                    {item.deletedBy}
                                                </span>
                                            </td>
                                            <td>
                                                <span className="trash-when" title={formatDate(item.deletedAt)}>{timeAgo(item.deletedAt)}</span>
                                                <small>{formatDate(item.deletedAt)}</small>
                                            </td>
                                            <td className="col-actions">
                                                <div className="trash-row-actions">
                                                    <button type="button" className="trash-btn-small" onClick={() => run("restore", [item])}>
                                                        <Icon name="restore" size={13} /> Restore
                                                    </button>
                                                    <button type="button" className="trash-btn-small is-danger" onClick={() => setConfirm([item])}>
                                                        <Icon name="trash" size={13} /> Purge
                                                    </button>
                                                    <Link
                                                        href={`${ROUTES.auditLogs}?search=${encodeURIComponent(item.title)}`}
                                                        className="trash-icon-link"
                                                        aria-label={`History of ${item.title}`}
                                                        title="History"
                                                    >
                                                        <Icon name="history" size={15} />
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    <footer className="trash-pager">
                        <span>
                            {filtered.length === 0
                                ? "Showing 0 items"
                                : `Showing ${(current - 1) * PAGE_SIZE + 1} to ${Math.min(current * PAGE_SIZE, filtered.length)} of ${filtered.length}`}
                        </span>
                        <div>
                            <button type="button" className="trash-btn-small" onClick={() => setPage(current - 1)} disabled={current <= 1}>Previous</button>
                            <span className="trash-page">{current} / {pages}</span>
                            <button type="button" className="trash-btn-small" onClick={() => setPage(current + 1)} disabled={current >= pages}>Next</button>
                        </div>
                    </footer>
                </article>
            </div>

            {confirm && <PurgeDialog items={confirm} onCancel={() => setConfirm(null)} onConfirm={() => run("purge", confirm)} />}

            {toast && (
                <div className={`trash-toast is-${toast.tone}`} role="status">
                    <Icon name={toast.tone === "error" ? "alert" : "check"} size={16} />
                    <span>{toast.text}</span>
                    <button type="button" aria-label="Dismiss" onClick={() => setToast(null)}><Icon name="close" size={14} /></button>
                </div>
            )}
        </div>
    );
}

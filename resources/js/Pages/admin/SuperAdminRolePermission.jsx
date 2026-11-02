import { useMemo, useState } from "react";
import { Link, router, usePage } from "@inertiajs/react";
// Same helper file the dashboard uses. Only ROUTES.users / ROUTES.auditLogs and WORKSPACES are needed here.
import { ROUTES, WORKSPACES } from "../../Components/Admin-Components/adminRoutes";
import "../../../css/admin-css/admin-role-permission.css";

/* ------------------------------------------------------------------
   Roles and Permissions (Super Admin only)

   ERD tables: roles, permissions (module x action), role_permissions.

   Sample data below makes the page work today. Have your controller
   return an Inertia prop named `rolePermissions` with the same shape
   and it replaces these defaults:

   Inertia::render('Admin/SuperAdminRolePermission', [
       'rolePermissions' => [
           'roles'  => [...],   // roles + users_count
           'grants' => [...],   // role code => ["module:action", ...]
       ],
   ]);

   Saving sends:  PUT {SAVE_URL}/{role.id}  { permissions: ["module:action", ...] }
   Change SAVE_URL to your real route. The server must write role_permissions
   and an audit_logs row (UPDATE) in the same transaction.
------------------------------------------------------------------- */
const SAVE_URL = "/admin/super/roles";

/* permissions.action enum from the ERD */
const ACTIONS = [
    { key: "view", label: "View" },
    { key: "create", label: "Create" },
    { key: "update", label: "Update" },
    { key: "delete", label: "Delete" },
    { key: "publish", label: "Publish" },
    { key: "restore", label: "Restore" },
    { key: "export", label: "Export" },
    { key: "manage", label: "Manage" },
];

/* which sites a module group exists on */
const GROUPS = [
    { key: "shared", label: "Shared content", sites: ["PSB", "COEUAS", "VERTIPORT"] },
    { key: "psb", label: "PSB module", sites: ["PSB"] },
    { key: "coeuas", label: "COE-UAS module", sites: ["COEUAS"] },
    { key: "super", label: "Super Admin only", sites: [] },
];

/* permissions.module values */
const MODULES = [
    { key: "pages", label: "Pages and sections", group: "shared" },
    { key: "menus", label: "Navigation menus", group: "shared" },
    { key: "settings", label: "Site settings", group: "shared" },
    { key: "posts", label: "News, press and articles", group: "shared" },
    { key: "events", label: "Events", group: "shared" },
    { key: "gallery", label: "Photo and video gallery", group: "shared" },
    { key: "faq", label: "FAQ", group: "shared" },
    { key: "partners", label: "Partners", group: "shared" },
    { key: "documents", label: "Documents and downloads", group: "shared" },
    { key: "media", label: "Media library", group: "shared" },
    { key: "enquiries", label: "Contact enquiries", group: "shared" },
    { key: "subscribers", label: "Subscribers", group: "shared" },

    { key: "programmes", label: "Programmes and calls", group: "psb" },
    { key: "applications", label: "Participation applications", group: "psb" },
    { key: "roadmap", label: "Roadmap and governance", group: "psb" },
    { key: "services", label: "Services", group: "psb" },
    { key: "siteinfo", label: "Site information", group: "psb" },

    { key: "members", label: "Members and profiles", group: "coeuas" },
    { key: "research", label: "Research and innovation", group: "coeuas" },
    { key: "publications", label: "Publications and impact", group: "coeuas" },
    { key: "facilities", label: "Facilities and services", group: "coeuas" },
    { key: "engagement", label: "Engagement and linkages", group: "coeuas" },
    { key: "taxonomy", label: "Archive taxonomy", group: "coeuas" },

    { key: "users", label: "Admin users", group: "super" },
    { key: "roles", label: "Roles and permissions", group: "super" },
    { key: "audit", label: "Audit log", group: "super" },
    { key: "trash", label: "Content trash", group: "super" },
    { key: "sites", label: "Sites and system settings", group: "super" },
];

const MODULE_BY_KEY = Object.fromEntries(MODULES.map((m) => [m.key, m]));
const GROUP_BY_KEY = Object.fromEntries(GROUPS.map((g) => [g.key, g]));

/* ------------------------------------------------------------------
   SAMPLE DATA
------------------------------------------------------------------- */
const SITE_ROLE_BASELINE = {
    // default grants for a site administrator; edit freely in the UI
    pages: ["view", "create", "update", "publish", "delete"],
    menus: ["view", "update"],
    settings: ["view", "update"],
    posts: ["view", "create", "update", "publish", "delete"],
    events: ["view", "create", "update", "publish", "delete"],
    gallery: ["view", "create", "update", "publish", "delete"],
    faq: ["view", "create", "update", "publish", "delete"],
    partners: ["view", "create", "update", "delete"],
    documents: ["view", "create", "update", "publish", "delete"],
    media: ["view", "create", "update", "delete"],
    enquiries: ["view", "update", "export"],
    subscribers: ["view", "export"],
    programmes: ["view", "create", "update", "publish", "delete"],
    applications: ["view", "update", "export"],
    roadmap: ["view", "create", "update", "delete"],
    services: ["view", "create", "update", "publish", "delete"],
    siteinfo: ["view", "create", "update", "publish", "delete"],
    members: ["view", "create", "update", "publish", "delete"],
    research: ["view", "create", "update", "publish", "delete"],
    publications: ["view", "create", "update", "publish", "delete", "export"],
    facilities: ["view", "create", "update", "publish", "delete"],
    engagement: ["view", "create", "update", "publish", "delete"],
    taxonomy: ["view", "create", "update"],
};

const baselineFor = (siteCode) => {
    const out = [];
    MODULES.forEach((m) => {
        if (!GROUP_BY_KEY[m.group].sites.includes(siteCode)) return;
        (SITE_ROLE_BASELINE[m.key] || []).forEach((a) => out.push(`${m.key}:${a}`));
    });
    return out;
};

const defaultData = {
    roles: [
        { id: 1, code: "SUPER_ADMIN", name: "Super Admin", scope: "GLOBAL", siteCode: null, landing: "/admin/super", users: 1, active: true },
        { id: 2, code: "PSB_ADMIN", name: "PSB Content Admin", scope: "SITE", siteCode: "PSB", landing: "/admin/psb", users: 3, active: true },
        { id: 3, code: "COEUAS_ADMIN", name: "COE-UAS Content Admin", scope: "SITE", siteCode: "COEUAS", landing: "/admin/coeuas", users: 2, active: true },
        { id: 4, code: "VERTIPORT_ADMIN", name: "Vertiport Admin", scope: "SITE", siteCode: "VERTIPORT", landing: "/admin/vertiport", users: 0, active: false },
    ],
    grants: {
        PSB_ADMIN: baselineFor("PSB"),
        COEUAS_ADMIN: baselineFor("COEUAS"),
        VERTIPORT_ADMIN: [],
    },
};

/* ------------------------------ helpers ------------------------------ */

function Icon({ name, size = 16 }) {
    const icons = {
        check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
        lock: (
            <>
                <rect x="5" y="11" width="14" height="9" rx="2" />
                <path d="M8 11V8a4 4 0 0 1 8 0v3" />
            </>
        ),
        search: (
            <>
                <circle cx="11" cy="11" r="6" />
                <path d="m20 20-4.2-4.2" />
            </>
        ),
        shield: <path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11z" />,
        route: (
            <>
                <circle cx="6" cy="6" r="2" />
                <circle cx="18" cy="18" r="2" />
                <path d="M8 6h6a4 4 0 0 1 0 8h-4a4 4 0 0 0 0 8" />
            </>
        ),
        users: (
            <>
                <circle cx="9" cy="8" r="3.2" />
                <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
                <path d="M16 5.2a3.2 3.2 0 0 1 0 6M21 20c0-2.4-1.4-4.4-3.4-5.3" />
            </>
        ),
        undo: <path d="M9 14 4 9l5-5M4 9h9a7 7 0 0 1 0 14h-3" />,
        plus: <path d="M12 5v14M5 12h14" />,
    };
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            {icons[name]}
        </svg>
    );
}

const keyOf = (module, action) => `${module}:${action}`;

const appliesTo = (role, module) =>
    role.scope === "GLOBAL" || GROUP_BY_KEY[module.group].sites.includes(role.siteCode);

const toSets = (grants) =>
    Object.fromEntries(Object.entries(grants).map(([code, list]) => [code, new Set(list)]));

const sameSet = (a, b) => a.size === b.size && [...a].every((x) => b.has(x));

const diffCount = (a, b) => {
    let n = 0;
    a.forEach((x) => { if (!b.has(x)) n += 1; });
    b.forEach((x) => { if (!a.has(x)) n += 1; });
    return n;
};

const toneOf = (siteCode) => WORKSPACES?.find((w) => w.code === siteCode)?.tone;

const logoText = (role) =>
    role.scope === "GLOBAL" ? "SA" : role.siteCode === "COEUAS" ? "CU" : role.siteCode.slice(0, 2);

/* ------------------------------ pieces ------------------------------- */

function StatCard({ title, value, text, chip, primary }) {
    return (
        <article className={`rp-card rp-stat ${primary ? "is-primary" : ""}`}>
            <h3>{title}</h3>
            <p className="rp-stat-value">{value}</p>
            <p className="rp-stat-meta">
                {chip && <span className="rp-chip">{chip}</span>}
                <span>{text}</span>
            </p>
        </article>
    );
}

function RoleList({ roles, selectedCode, onSelect, dirtyCodes }) {
    return (
        <article className="rp-card rp-roles">
            <header className="rp-card-head">
                <div>
                    <h3>Roles</h3>
                    <p className="rp-sub">One role per account, bound to one site</p>
                </div>
            </header>

            <ul className="rp-role-list">
                {roles.map((role) => {
                    const on = role.code === selectedCode;
                    const reserved = !role.active;
                    const tone = toneOf(role.siteCode);

                    return (
                        <li key={role.code}>
                            <button
                                type="button"
                                className={`rp-role ${on ? "is-on" : ""} ${reserved ? "is-reserved" : ""}`}
                                onClick={() => onSelect(role.code)}
                                aria-pressed={on}
                            >
                                <span className={`rp-role-logo ${role.scope === "GLOBAL" ? "tone-super" : `tone-${tone || "psb"}`}`}>
                                    {logoText(role)}
                                </span>

                                <span className="rp-role-text">
                                    <strong>{role.name}</strong>
                                    <small>{role.code}</small>
                                </span>

                                <span className="rp-role-side">
                                    {dirtyCodes.has(role.code) && <span className="rp-dot" title="Unsaved changes" />}
                                    <span className={`rp-pill ${reserved ? "pill-reserved" : role.scope === "GLOBAL" ? "pill-global" : "pill-live"}`}>
                                        {reserved ? "Reserved" : role.scope === "GLOBAL" ? "Global" : "Site"}
                                    </span>
                                    <small>
                                        {role.users} {role.users === 1 ? "user" : "users"}
                                    </small>
                                </span>
                            </button>
                        </li>
                    );
                })}
            </ul>
        </article>
    );
}

function NotesCard() {
    return (
        <article className="rp-card rp-notes">
            <header className="rp-card-head">
                <h3>How permissions apply</h3>
            </header>
            <ul className="rp-note-list">
                <li>
                    <Icon name="shield" size={15} />
                    <span>Checked on the server for every request, not just hidden in the menu.</span>
                </li>
                <li>
                    <Icon name="route" size={15} />
                    <span>A site role can only act on its own site. Cross-site access returns 403.</span>
                </li>
                <li>
                    <Icon name="lock" size={15} />
                    <span>Super Admin is fixed to every permission and cannot be reduced.</span>
                </li>
            </ul>
            <p className="rp-notes-foot">
                Changes apply from the next request and are written to the audit log.
            </p>
            <Link href={ROUTES.auditLogs} className="rp-btn-outline rp-btn-block">
                View Audit Logs
            </Link>
        </article>
    );
}

/* ------------------------------- page -------------------------------- */

export default function SuperAdminRolePermission() {
    const { props } = usePage();
    const data = { ...defaultData, ...(props.rolePermissions ?? {}) };

    const roles = data.roles;
    const [selectedCode, setSelectedCode] = useState(roles[1]?.code ?? roles[0].code);
    const [base, setBase] = useState(() => toSets({ ...data.grants }));
    const [draft, setDraft] = useState(() => toSets({ ...data.grants }));
    const [groupFilter, setGroupFilter] = useState("all");
    const [query, setQuery] = useState("");
    const [saving, setSaving] = useState(false);
    const [notice, setNotice] = useState(null); // { type: 'ok' | 'error', text }

    const role = roles.find((r) => r.code === selectedCode) ?? roles[0];
    const isSuper = role.scope === "GLOBAL";
    const readOnly = isSuper || !role.active;

    const roleSet = draft[role.code] ?? new Set();
    const baseSet = base[role.code] ?? new Set();

    /* every module/action cell this role can ever hold */
    const applicable = useMemo(
        () => MODULES.filter((m) => appliesTo(role, m)),
        [role]
    );

    const granted = isSuper
        ? applicable.length * ACTIONS.length
        : applicable.reduce(
              (n, m) => n + ACTIONS.filter((a) => roleSet.has(keyOf(m.key, a.key))).length,
              0
          );
    const total = applicable.length * ACTIONS.length;
    const pct = total ? Math.round((granted / total) * 100) : 0;

    const changes = diffCount(roleSet, baseSet);

    const dirtyCodes = new Set(
        Object.keys(draft).filter((code) => !sameSet(draft[code] ?? new Set(), base[code] ?? new Set()))
    );
    const totalChanges = [...dirtyCodes].reduce(
        (n, code) => n + diffCount(draft[code], base[code] ?? new Set()),
        0
    );

    const visibleModules = MODULES.filter((m) => {
        if (groupFilter !== "all" && m.group !== groupFilter) return false;
        if (query.trim() && !m.label.toLowerCase().includes(query.trim().toLowerCase())) return false;
        return true;
    });

    const has = (moduleKey, actionKey) => isSuper || roleSet.has(keyOf(moduleKey, actionKey));

    /* ---------- edits ---------- */

    const commit = (next) => {
        setNotice(null);
        setDraft((d) => ({ ...d, [role.code]: next }));
    };

    const toggleCell = (moduleKey, actionKey) => {
        if (readOnly) return;
        const next = new Set(roleSet);
        const k = keyOf(moduleKey, actionKey);
        next.has(k) ? next.delete(k) : next.add(k);
        commit(next);
    };

    const setMany = (keys, on) => {
        if (readOnly) return;
        const next = new Set(roleSet);
        keys.forEach((k) => (on ? next.add(k) : next.delete(k)));
        commit(next);
    };

    const toggleRow = (module) => {
        const keys = ACTIONS.map((a) => keyOf(module.key, a.key));
        const allOn = keys.every((k) => roleSet.has(k));
        setMany(keys, !allOn);
    };

    const toggleColumn = (action) => {
        const mods = visibleModules.filter((m) => appliesTo(role, m));
        const keys = mods.map((m) => keyOf(m.key, action.key));
        const allOn = keys.length > 0 && keys.every((k) => roleSet.has(k));
        setMany(keys, !allOn);
    };

    const discard = () => {
        setNotice(null);
        setDraft((d) => ({ ...d, [role.code]: new Set(baseSet) }));
    };

    const save = () => {
        if (!changes || saving) return;
        setSaving(true);
        setNotice(null);

        router.put(
            `${SAVE_URL}/${role.id}`,
            { permissions: [...roleSet] },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setBase((b) => ({ ...b, [role.code]: new Set(roleSet) }));
                    setNotice({ type: "ok", text: "Saved. Applies from the next request." });
                },
                onError: () =>
                    setNotice({ type: "error", text: "Could not save. Nothing was changed." }),
                onFinish: () => setSaving(false),
            }
        );
    };

    /* ---------- render helpers ---------- */

    const renderRow = (module) => {
        const can = appliesTo(role, module);
        const rowKeys = ACTIONS.map((a) => keyOf(module.key, a.key));
        const rowAll = can && rowKeys.every((k) => has(module.key, k.split(":")[1]));

        return (
            <tr key={module.key} className={can ? "" : "is-na"}>
                <th scope="row">
                    <span className="rp-module">{module.label}</span>
                </th>

                {ACTIONS.map((action) => {
                    if (!can) {
                        return (
                            <td key={action.key}>
                                <span className="rp-na" title="Not available for this role" />
                            </td>
                        );
                    }

                    const on = has(module.key, action.key);
                    const original = baseSet.has(keyOf(module.key, action.key));
                    const edited = !isSuper && on !== original;

                    return (
                        <td key={action.key}>
                            <button
                                type="button"
                                role="checkbox"
                                aria-checked={on}
                                aria-label={`${module.label}: ${action.label}`}
                                className={`rp-check ${on ? "is-on" : ""} ${edited ? "is-edited" : ""}`}
                                disabled={readOnly}
                                onClick={() => toggleCell(module.key, action.key)}
                            >
                                {on && <Icon name="check" size={13} />}
                            </button>
                        </td>
                    );
                })}

                <td className="rp-row-tools">
                    {can && !readOnly && (
                        <button type="button" className="rp-link" onClick={() => toggleRow(module)}>
                            {rowAll ? "Clear" : "All"}
                        </button>
                    )}
                </td>
            </tr>
        );
    };

    return (
        <div className="admin-roles">
            {/* HEADING */}
            <div className="rp-heading">
                <div>
                    <h1>Roles and Permissions</h1>
                    <p>
                        Decide what each administrator role can do in every module. Site roles stay inside their own site.
                    </p>
                </div>

                <div className="rp-actions">
                    <Link href={ROUTES.users} className="rp-btn-dark">
                        <span className="rp-btn-plus">
                            <Icon name="plus" size={15} />
                        </span>
                        Add Admin User
                    </Link>
                    <Link href={ROUTES.auditLogs} className="rp-btn-outline">
                        View Audit Logs
                    </Link>
                </div>
            </div>

            {/* STATS */}
            <div className="rp-stats">
                <StatCard primary title="Roles" value={roles.length} chip={`${roles.filter((r) => r.active).length} active`} text="Vertiport is reserved" />
                <StatCard title="Admin Users" value={roles.reduce((n, r) => n + r.users, 0)} text="Across all roles" />
                <StatCard title="Modules" value={MODULES.length} chip={`${ACTIONS.length} actions`} text="Permission = module x action" />
                <StatCard title="Unsaved Changes" value={totalChanges} chip={totalChanges ? `${dirtyCodes.size} ${dirtyCodes.size === 1 ? "role" : "roles"}` : null} text={totalChanges ? "Save each role to apply" : "Everything is saved"} />
            </div>

            {/* MAIN */}
            <div className="rp-layout">
                <div className="rp-side">
                    <RoleList roles={roles} selectedCode={role.code} onSelect={setSelectedCode} dirtyCodes={dirtyCodes} />
                    <NotesCard />
                </div>

                <article className="rp-card rp-matrix-card">
                    {/* role summary */}
                    <header className="rp-matrix-head">
                        <div className="rp-matrix-title">
                            <span className={`rp-role-logo ${isSuper ? "tone-super" : `tone-${toneOf(role.siteCode) || "psb"}`}`}>{logoText(role)}</span>
                            <div>
                                <h2>{role.name}</h2>
                                <p>
                                    <code>{role.code}</code>
                                    <span className="rp-sep" />
                                    {isSuper ? "All sites" : `Site: ${role.siteCode}`}
                                    <span className="rp-sep" />
                                    Lands on <code>{role.landing}</code>
                                </p>
                            </div>
                        </div>

                        <div className="rp-coverage">
                            <p>
                                <strong>{granted}</strong> of {total} granted
                            </p>
                            <div className="rp-meter" role="img" aria-label={`${pct}% of available permissions granted`}>
                                <span style={{ width: `${pct}%` }} />
                            </div>
                        </div>
                    </header>

                    {isSuper && (
                        <p className="rp-banner">
                            <Icon name="lock" size={15} />
                            Super Admin always holds every permission. This role is fixed and cannot be edited.
                        </p>
                    )}
                    {!isSuper && !role.active && (
                        <p className="rp-banner is-reserved">
                            <Icon name="lock" size={15} />
                            Reserved for Phase 2. The site is not enabled yet, so permissions are read-only for now.
                        </p>
                    )}

                    {/* filters */}
                    <div className="rp-toolbar">
                        <div className="rp-chips" role="group" aria-label="Filter modules">
                            <button type="button" className={`rp-fchip ${groupFilter === "all" ? "is-on" : ""}`} onClick={() => setGroupFilter("all")} aria-pressed={groupFilter === "all"}>
                                All
                            </button>
                            {GROUPS.map((g) => (
                                <button key={g.key} type="button" className={`rp-fchip ${groupFilter === g.key ? "is-on" : ""}`} onClick={() => setGroupFilter(g.key)} aria-pressed={groupFilter === g.key}>
                                    {g.label}
                                </button>
                            ))}
                        </div>

                        <label className="rp-search">
                            <Icon name="search" size={15} />
                            <input
                                type="search"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search modules"
                                aria-label="Search modules"
                            />
                        </label>
                    </div>

                    {/* matrix */}
                    <div className="rp-table-wrap">
                        <table className="rp-table">
                            <thead>
                                <tr>
                                    <th scope="col">Module</th>
                                    {ACTIONS.map((action) => (
                                        <th scope="col" key={action.key}>
                                            {readOnly ? (
                                                <span>{action.label}</span>
                                            ) : (
                                                <button type="button" className="rp-colhead" onClick={() => toggleColumn(action)} title={`Toggle ${action.label} for the modules shown`}>
                                                    {action.label}
                                                </button>
                                            )}
                                        </th>
                                    ))}
                                    <th scope="col" aria-label="Row actions" />
                                </tr>
                            </thead>

                            <tbody>
                                {GROUPS.map((group) => {
                                    const rows = visibleModules.filter((m) => m.group === group.key);
                                    if (!rows.length) return null;
                                    return [
                                        <tr className="rp-group" key={`g-${group.key}`}>
                                            <td colSpan={ACTIONS.length + 2}>{group.label}</td>
                                        </tr>,
                                        ...rows.map(renderRow),
                                    ];
                                })}

                                {visibleModules.length === 0 && (
                                    <tr>
                                        <td colSpan={ACTIONS.length + 2} className="rp-empty">
                                            No module matches "{query}".
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* legend */}
                    <ul className="rp-legend">
                        <li><span className="rp-check is-on is-legend"><Icon name="check" size={11} /></span> Granted</li>
                        <li><span className="rp-check is-legend" /> Not granted</li>
                        <li><span className="rp-check is-on is-edited is-legend"><Icon name="check" size={11} /></span> Changed, not saved</li>
                        <li><span className="rp-na is-legend" /> Not available for this role</li>
                    </ul>

                    {/* save bar */}
                    <footer className={`rp-savebar ${changes ? "has-changes" : ""}`}>
                        <p aria-live="polite">
                            {notice ? (
                                <span className={`rp-notice is-${notice.type}`}>{notice.text}</span>
                            ) : changes ? (
                                <>
                                    <strong>{changes}</strong> unsaved {changes === 1 ? "change" : "changes"} for {role.name}
                                </>
                            ) : readOnly ? (
                                "This role is read-only."
                            ) : (
                                "No changes."
                            )}
                        </p>

                        <div className="rp-save-actions">
                            <button type="button" className="rp-btn-outline rp-btn-sm" onClick={discard} disabled={!changes || saving}>
                                <Icon name="undo" size={14} />
                                Discard
                            </button>
                            <button type="button" className="rp-btn-yellow" onClick={save} disabled={!changes || saving}>
                                {saving ? "Saving..." : "Save changes"}
                            </button>
                        </div>
                    </footer>
                </article>
            </div>
        </div>
    );
}

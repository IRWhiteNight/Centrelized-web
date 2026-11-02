import { useState, useEffect, useMemo, useRef } from "react";
import { router, usePage } from "@inertiajs/react";
// Adjust this path to wherever you placed adminRoutes.js
import { ROUTES, WORKSPACES, isPathActive } from "../../Components/Admin-Components/adminRoutes";
import "../../../css/admin-css/admin-user.css";

/* ------------------------------------------------------------------
   DATA SHAPE (from the ERD, ERD-1)

   users : id, full_name, email, role_id, status (active | suspended |
           disabled), two_factor_enabled, must_change_password,
           last_login_at, created_at, history[] (audit_logs rows for
           this user: { id, action, by, at, changes:[{field,from,to}] })
   roles : id, code, name, scope (GLOBAL | SITE), site, landing_route

   LIVE MODE: return Inertia props `users` and `roles` from your
   controller and this page talks to these endpoints
   (rename in adminRoutes.js if yours differ):

     POST   /admin/super/users                       create + invite email
     PUT    /admin/super/users/{id}                  update
     PATCH  /admin/super/users/{id}/status           { status }
     POST   /admin/super/users/{id}/password-reset   send reset link
     DELETE /admin/super/users/{id}                  soft delete (to Trash)

   DEMO MODE: with no `users` prop the page runs on the sample data
   below, entirely in the browser, so you can try every screen.
------------------------------------------------------------------- */

const defaultRoles = [
    { id: 1, code: "SUPER", name: "Super Admin", scope: "GLOBAL", site: null, landing: "/admin/super", tone: "super" },
    { id: 2, code: "PSB_ADMIN", name: "PSB Content Admin", scope: "SITE", site: "PSB", landing: "/admin/psb", tone: "psb" },
    { id: 3, code: "COEUAS_ADMIN", name: "COE-UAS Content Admin", scope: "SITE", site: "COE-UAS", landing: "/admin/coeuas", tone: "coeuas" },
    { id: 4, code: "VERTIPORT_ADMIN", name: "Vertiport Admin", scope: "SITE", site: "Vertiport", landing: "/admin/vertiport", tone: "vertiport", reserved: true },
];

const sampleUsers = [
    {
        id: 1, full_name: "Super Administrator", email: "admin@perlis-sandbox.com", role_id: 1,
        status: "active", two_factor_enabled: true, must_change_password: false,
        last_login_at: "2026-11-01T08:42:00", created_at: "2026-01-12T09:00:00",
        history: [
            { id: "h1", action: "LOGIN", by: "Super Administrator", at: "2026-11-01T08:42:00", changes: [] },
        ],
    },
    {
        id: 2, full_name: "Aiman Hakim", email: "aiman.hakim@perlis-sandbox.com", role_id: 2,
        status: "active", two_factor_enabled: true, must_change_password: false,
        last_login_at: "2026-11-01T08:10:00", created_at: "2026-02-03T10:20:00",
        history: [
            { id: "h2", action: "CREATE", by: "Super Administrator", at: "2026-02-03T10:20:00", changes: [] },
        ],
    },
    {
        id: 3, full_name: "Farid Rahman", email: "farid.rahman@perlis-sandbox.com", role_id: 2,
        status: "active", two_factor_enabled: false, must_change_password: false,
        last_login_at: "2026-10-31T16:35:00", created_at: "2026-03-18T11:05:00",
        history: [],
    },
    {
        id: 4, full_name: "Nur Sofea", email: "nur.sofea@coe-uas.example", role_id: 3,
        status: "active", two_factor_enabled: true, must_change_password: false,
        last_login_at: "2026-11-01T07:55:00", created_at: "2026-02-21T14:40:00",
        history: [],
    },
    {
        id: 5, full_name: "Siti Aminah", email: "siti.aminah@coe-uas.example", role_id: 3,
        status: "active", two_factor_enabled: false, must_change_password: false,
        last_login_at: "2026-10-29T13:20:00", created_at: "2026-05-09T09:30:00",
        history: [],
    },
    {
        id: 6, full_name: "Khairul Anuar", email: "khairul.anuar@coe-uas.example", role_id: 3,
        status: "suspended", two_factor_enabled: false, must_change_password: false,
        last_login_at: "2026-09-14T10:02:00", created_at: "2026-04-02T08:15:00",
        history: [
            {
                id: "h6", action: "UPDATE", by: "Super Administrator", at: "2026-10-20T15:00:00",
                changes: [{ field: "Status", from: "Active", to: "Suspended" }],
            },
        ],
    },
    {
        id: 7, full_name: "Lim Wei Jie", email: "weijie.lim@perlis-sandbox.com", role_id: 4,
        status: "active", two_factor_enabled: false, must_change_password: true,
        last_login_at: null, created_at: "2026-10-27T09:45:00",
        history: [
            { id: "h7", action: "CREATE", by: "Super Administrator", at: "2026-10-27T09:45:00", changes: [] },
        ],
    },
];

const STATUS = {
    active: { label: "Active", cls: "au-pill-active" },
    suspended: { label: "Suspended", cls: "au-pill-suspended" },
    disabled: { label: "Disabled", cls: "au-pill-disabled" },
};

const STATUS_TABS = [
    { key: "all", label: "All" },
    { key: "active", label: "Active" },
    { key: "suspended", label: "Suspended" },
    { key: "disabled", label: "Disabled" },
];

const ACTION_LABEL = {
    CREATE: "Account created",
    UPDATE: "Account updated",
    DELETE: "Moved to Trash",
    RESTORE: "Restored",
    LOGIN: "Signed in",
    LOGOUT: "Signed out",
    ACCESS_DENIED: "Access denied",
};

const PAGE_SIZE = 8;

/* ------------------------------ helpers ------------------------------ */

const initialsOf = (name) =>
    (name || "")
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase();

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

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(form, users, editingId) {
    const errors = {};
    if (!form.full_name.trim()) errors.full_name = "Enter the full name.";
    if (!form.email.trim()) {
        errors.email = "Enter an email address.";
    } else if (!EMAIL_PATTERN.test(form.email.trim())) {
        errors.email = "Enter a valid email address.";
    } else if (
        users.some(
            (u) =>
                u.id !== editingId &&
                u.email.toLowerCase() === form.email.trim().toLowerCase()
        )
    ) {
        errors.email = "Another account already uses this email.";
    }
    if (!form.role_id) errors.role_id = "Choose a role.";
    return errors;
}

function Icon({ name, size = 18 }) {
    const icons = {
        search: (
            <>
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-4-4" />
            </>
        ),
        plus: <path d="M12 5v14M5 12h14" />,
        edit: (
            <>
                <path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z" />
                <path d="m13.5 6.5 4 4" />
            </>
        ),
        history: (
            <>
                <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
                <path d="M3 3v5h5M12 7v5l3 2" />
            </>
        ),
        pause: <path d="M9 5v14M15 5v14" />,
        play: <path d="m7 4 13 8-13 8z" />,
        trash: (
            <>
                <path d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6" />
                <path d="M10 11v5M14 11v5" />
            </>
        ),
        close: <path d="M18 6 6 18M6 6l12 12" />,
        check: <path d="m5 12 5 5 9-10" />,
        mail: (
            <>
                <rect x="3" y="5" width="18" height="14" rx="3" />
                <path d="m4 8 8 6 8-6" />
            </>
        ),
        shield: <path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11z" />,
        left: <path d="m15 6-6 6 6 6" />,
        right: <path d="m9 6 6 6-6 6" />,
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

/* ------------------------- overlays and dialogs ------------------------- */

function Drawer({ title, subtitle, onClose, children, footer }) {
    useEffect(() => {
        const onKey = (event) => {
            if (event.key === "Escape") onClose();
        };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [onClose]);

    return (
        <div className="au-overlay" onMouseDown={onClose}>
            <aside
                className="au-drawer"
                role="dialog"
                aria-modal="true"
                aria-labelledby="au-drawer-title"
                onMouseDown={(event) => event.stopPropagation()}
            >
                <header className="au-drawer-head">
                    <div>
                        <h2 id="au-drawer-title">{title}</h2>
                        {subtitle && <p>{subtitle}</p>}
                    </div>
                    <button
                        type="button"
                        className="au-icon-btn"
                        onClick={onClose}
                        aria-label="Close"
                    >
                        <Icon name="close" />
                    </button>
                </header>

                <div className="au-drawer-body">{children}</div>

                {footer && <footer className="au-drawer-foot">{footer}</footer>}
            </aside>
        </div>
    );
}

function ConfirmDialog({ title, body, confirmLabel, danger, busy, onConfirm, onCancel }) {
    useEffect(() => {
        const onKey = (event) => {
            if (event.key === "Escape") onCancel();
        };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [onCancel]);

    return (
        <div className="au-overlay au-overlay-center" onMouseDown={onCancel}>
            <div
                className="au-dialog"
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="au-dialog-title"
                onMouseDown={(event) => event.stopPropagation()}
            >
                <h2 id="au-dialog-title">{title}</h2>
                <p>{body}</p>
                <div className="au-dialog-actions">
                    <button type="button" className="au-btn au-btn-outline" onClick={onCancel}>
                        Cancel
                    </button>
                    <button
                        type="button"
                        className={`au-btn ${danger ? "au-btn-danger" : "au-btn-dark"}`}
                        onClick={onConfirm}
                        disabled={busy}
                        autoFocus
                    >
                        {busy ? "Working..." : confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ----------------------------- create / edit ----------------------------- */

function UserFormDrawer({
    mode,
    user,
    roles,
    users,
    busy,
    serverErrors,
    lockReason,
    onSubmit,
    onResetLink,
    onClose,
}) {
    const editing = mode === "edit";
    const [form, setForm] = useState(() => ({
        full_name: user?.full_name ?? "",
        email: user?.email ?? "",
        role_id: user?.role_id ?? null,
        status: user?.status ?? "active",
        two_factor_enabled: user?.two_factor_enabled ?? false,
        must_change_password: user?.must_change_password ?? true,
    }));
    const [errors, setErrors] = useState({});
    const nameRef = useRef(null);

    useEffect(() => {
        nameRef.current?.focus();
    }, []);

    const shown = { ...errors, ...(serverErrors || {}) };
    const set = (key, value) => {
        setForm((current) => ({ ...current, [key]: value }));
        setErrors((current) => ({ ...current, [key]: undefined }));
    };

    const selectedRole = roles.find((r) => r.id === form.role_id);

    function submit(event) {
        event.preventDefault();
        const found = validate(form, users, user?.id);
        setErrors(found);
        if (Object.keys(found).length === 0) onSubmit(form);
    }

    return (
        <Drawer
            title={editing ? "Edit admin user" : "Add admin user"}
            subtitle={
                editing
                    ? "Changes are saved to the audit log."
                    : "They get an email invitation to set their own password."
            }
            onClose={onClose}
            footer={
                <>
                    <button type="button" className="au-btn au-btn-outline" onClick={onClose}>
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="au-user-form"
                        className="au-btn au-btn-dark"
                        disabled={busy}
                    >
                        {busy ? "Saving..." : editing ? "Save changes" : "Create and send invite"}
                    </button>
                </>
            }
        >
            <form id="au-user-form" className="au-form" onSubmit={submit} noValidate>
                <div className="au-field">
                    <label htmlFor="au-name">Full name</label>
                    <input
                        id="au-name"
                        ref={nameRef}
                        type="text"
                        maxLength={150}
                        value={form.full_name}
                        onChange={(e) => set("full_name", e.target.value)}
                        aria-invalid={Boolean(shown.full_name)}
                    />
                    {shown.full_name && <p className="au-error">{shown.full_name}</p>}
                </div>

                <div className="au-field">
                    <label htmlFor="au-email">Email</label>
                    <input
                        id="au-email"
                        type="email"
                        maxLength={190}
                        value={form.email}
                        onChange={(e) => set("email", e.target.value)}
                        aria-invalid={Boolean(shown.email)}
                    />
                    {shown.email && <p className="au-error">{shown.email}</p>}
                </div>

                <fieldset className="au-field au-roles" disabled={Boolean(lockReason)}>
                    <legend>Role and site</legend>

                    {roles.map((role) => {
                        const selected = role.id === form.role_id;
                        return (
                            <label
                                key={role.id}
                                className={`au-role-card ${selected ? "is-selected" : ""}`}
                            >
                                <input
                                    type="radio"
                                    name="role"
                                    value={role.id}
                                    checked={selected}
                                    onChange={() => set("role_id", role.id)}
                                />
                                <span className={`au-dot tone-${role.tone}`} />
                                <span className="au-role-text">
                                    <strong>{role.name}</strong>
                                    <small>
                                        {role.scope === "GLOBAL"
                                            ? "Every site and the Super Admin Console"
                                            : `${role.site} site only`}
                                    </small>
                                </span>
                                {role.reserved && (
                                    <span className="au-pill au-pill-reserved">Phase 2</span>
                                )}
                            </label>
                        );
                    })}

                    {shown.role_id && <p className="au-error">{shown.role_id}</p>}

                    {selectedRole && (
                        <p className="au-hint">
                            {selectedRole.reserved
                                ? "Vertiport sign-ins go to a Coming soon page until Phase 2."
                                : `After sign-in this person lands on ${selectedRole.landing}. Other workspaces return 403.`}
                        </p>
                    )}

                    {lockReason && <p className="au-hint au-hint-lock">{lockReason}</p>}
                </fieldset>

                {editing && (
                    <div className="au-field">
                        <label htmlFor="au-status">Account status</label>
                        <select
                            id="au-status"
                            value={form.status}
                            onChange={(e) => set("status", e.target.value)}
                            disabled={Boolean(lockReason)}
                        >
                            <option value="active">Active</option>
                            <option value="suspended">Suspended (temporary)</option>
                            <option value="disabled">Disabled</option>
                        </select>
                    </div>
                )}

                <div className="au-field au-checks">
                    <label className="au-check">
                        <input
                            type="checkbox"
                            checked={form.two_factor_enabled}
                            onChange={(e) => set("two_factor_enabled", e.target.checked)}
                        />
                        <span>
                            <strong>Two-factor authentication</strong>
                            <small>Ask for a second step when signing in.</small>
                        </span>
                    </label>

                    <label className="au-check">
                        <input
                            type="checkbox"
                            checked={form.must_change_password}
                            onChange={(e) => set("must_change_password", e.target.checked)}
                        />
                        <span>
                            <strong>Change password at next sign-in</strong>
                            <small>Recommended for new and reset accounts.</small>
                        </span>
                    </label>
                </div>

                {editing && (
                    <div className="au-reset">
                        <div>
                            <strong>Password</strong>
                            <small>Email a reset link. The link expires and works once.</small>
                        </div>
                        <button
                            type="button"
                            className="au-btn au-btn-small"
                            onClick={onResetLink}
                            disabled={busy}
                        >
                            <Icon name="mail" size={15} />
                            Send reset link
                        </button>
                    </div>
                )}
            </form>
        </Drawer>
    );
}

/* -------------------------------- history -------------------------------- */

function HistoryDrawer({ user, onClose }) {
    const entries = user.history ?? [];

    return (
        <Drawer
            title="History"
            subtitle={`Audit entries for ${user.full_name}`}
            onClose={onClose}
        >
            {entries.length === 0 ? (
                <p className="au-empty-note">No audit entries for this account yet.</p>
            ) : (
                <ol className="au-timeline">
                    {entries.map((entry) => (
                        <li key={entry.id}>
                            <span className="au-timeline-dot" />
                            <div>
                                <strong>{ACTION_LABEL[entry.action] || entry.action}</strong>
                                <small>
                                    {entry.by}, {formatDateTime(entry.at)}
                                </small>

                                {entry.changes?.length > 0 && (
                                    <ul className="au-changes">
                                        {entry.changes.map((change, index) => (
                                            <li key={index}>
                                                <span>{change.field}</span>
                                                <del>{change.from}</del>
                                                <ins>{change.to}</ins>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </li>
                    ))}
                </ol>
            )}
        </Drawer>
    );
}

/* --------------------------------- page ---------------------------------- */

export default function SuperAdminUser() {
    const { props } = usePage();
    const live = Array.isArray(props.users);
    const roles = props.roles ?? defaultRoles;
    const currentUser = props.auth?.user;
    const currentUserId = currentUser?.id ?? 1;
    const currentName = currentUser?.name ?? "Super Administrator";

    const [users, setUsers] = useState(live ? props.users : sampleUsers);
    const [search, setSearch] = useState("");
    const [statusTab, setStatusTab] = useState("all");
    const [roleFilter, setRoleFilter] = useState("all");
    const [sort, setSort] = useState("newest");
    const [page, setPage] = useState(1);

    const [formState, setFormState] = useState(null); // { mode, user }
    const [historyUser, setHistoryUser] = useState(null);
    const [confirm, setConfirm] = useState(null); // { kind, user }
    const [busy, setBusy] = useState(false);
    const [serverErrors, setServerErrors] = useState(null);
    const [toast, setToast] = useState(null);

    // keep in sync when the server sends fresh props
    useEffect(() => {
        if (live) setUsers(props.users);
    }, [props.users]);

    useEffect(() => {
        if (!toast) return undefined;
        const timer = setTimeout(() => setToast(null), 4500);
        return () => clearTimeout(timer);
    }, [toast]);

    useEffect(() => {
        setPage(1);
    }, [search, statusTab, roleFilter, sort]);

    const roleOf = (user) => roles.find((r) => r.id === user.role_id);

    const activeSupers = users.filter(
        (u) => roleOf(u)?.code === "SUPER" && u.status === "active"
    ).length;

    // Accounts that must not be suspended, disabled, demoted or deleted here.
    function lockReasonFor(user) {
        if (user.id === currentUserId) {
            return "This is your own account. Ask another Super Admin to change it.";
        }
        if (roleOf(user)?.code === "SUPER" && user.status === "active" && activeSupers <= 1) {
            return "At least one active Super Admin must remain.";
        }
        return null;
    }

    /* ---------- derived list ---------- */

    const counts = useMemo(
        () => ({
            all: users.length,
            active: users.filter((u) => u.status === "active").length,
            suspended: users.filter((u) => u.status === "suspended").length,
            disabled: users.filter((u) => u.status === "disabled").length,
            twoFactor: users.filter((u) => u.two_factor_enabled).length,
        }),
        [users]
    );

    const filtered = useMemo(() => {
        const term = search.trim().toLowerCase();

        const list = users.filter((user) => {
            const role = roles.find((r) => r.id === user.role_id);
            if (statusTab !== "all" && user.status !== statusTab) return false;
            if (roleFilter !== "all" && String(user.role_id) !== roleFilter) return false;
            if (!term) return true;
            return [user.full_name, user.email, role?.name, role?.site]
                .filter(Boolean)
                .some((text) => text.toLowerCase().includes(term));
        });

        const time = (value) => (value ? new Date(value).getTime() : 0);
        list.sort((a, b) => {
            if (sort === "name") return a.full_name.localeCompare(b.full_name);
            if (sort === "login") return time(b.last_login_at) - time(a.last_login_at);
            return time(b.created_at) - time(a.created_at);
        });

        return list;
    }, [users, roles, search, statusTab, roleFilter, sort]);

    const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const safePage = Math.min(page, pageCount);
    const visible = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
    const filtersActive = search || statusTab !== "all" || roleFilter !== "all";

    function clearFilters() {
        setSearch("");
        setStatusTab("all");
        setRoleFilter("all");
    }

    /* ---------- actions ---------- */

    function closeAll() {
        setFormState(null);
        setConfirm(null);
        setServerErrors(null);
    }

    function done(message) {
        setBusy(false);
        closeAll();
        setToast(message);
    }

    // One path for every change: the server in live mode, local state in demo mode.
    function run({ method, url, data, local, message }) {
        setBusy(true);
        setServerErrors(null);

        if (!live) {
            local();
            done(message);
            return;
        }

        const options = {
            preserveScroll: true,
            onSuccess: () => done(message),
            onError: (errors) => {
                setServerErrors(errors);
                setBusy(false);
            },
            onFinish: () => setBusy(false),
        };

        if (method === "delete") router.delete(url, options);
        else router[method](url, data ?? {}, options);
    }

    const addHistory = (user, action, changes = []) => [
        {
            id: `h${Date.now()}`,
            action,
            by: currentName,
            at: new Date().toISOString(),
            changes,
        },
        ...(user.history ?? []),
    ];

    function submitForm(form) {
        const payload = {
            ...form,
            full_name: form.full_name.trim(),
            email: form.email.trim(),
        };

        if (formState.mode === "create") {
            run({
                method: "post",
                url: ROUTES.users,
                data: payload,
                message: `${payload.full_name} was added. An invitation email was sent.`,
                local: () =>
                    setUsers((list) => [
                        {
                            id: Math.max(0, ...list.map((u) => u.id)) + 1,
                            ...payload,
                            status: "active",
                            last_login_at: null,
                            created_at: new Date().toISOString(),
                            history: [
                                {
                                    id: `h${Date.now()}`,
                                    action: "CREATE",
                                    by: currentName,
                                    at: new Date().toISOString(),
                                    changes: [],
                                },
                            ],
                        },
                        ...list,
                    ]),
            });
            return;
        }

        const target = formState.user;
        const roleName = (id) => roles.find((r) => r.id === id)?.name;
        const changes = [];
        if (target.full_name !== payload.full_name)
            changes.push({ field: "Name", from: target.full_name, to: payload.full_name });
        if (target.email !== payload.email)
            changes.push({ field: "Email", from: target.email, to: payload.email });
        if (target.role_id !== payload.role_id)
            changes.push({ field: "Role", from: roleName(target.role_id), to: roleName(payload.role_id) });
        if (target.status !== payload.status)
            changes.push({ field: "Status", from: STATUS[target.status].label, to: STATUS[payload.status].label });
        if (target.two_factor_enabled !== payload.two_factor_enabled)
            changes.push({
                field: "Two-factor",
                from: target.two_factor_enabled ? "On" : "Off",
                to: payload.two_factor_enabled ? "On" : "Off",
            });
        if (target.must_change_password !== payload.must_change_password)
            changes.push({
                field: "Change password at next sign-in",
                from: target.must_change_password ? "Yes" : "No",
                to: payload.must_change_password ? "Yes" : "No",
            });

        run({
            method: "put",
            url: `${ROUTES.users}/${target.id}`,
            data: payload,
            message: `${payload.full_name} was updated.`,
            local: () =>
                setUsers((list) =>
                    list.map((u) =>
                        u.id === target.id
                            ? { ...u, ...payload, history: addHistory(u, "UPDATE", changes) }
                            : u
                    )
                ),
        });
    }

    function confirmAction() {
        const { kind, user } = confirm;

        if (kind === "delete") {
            run({
                method: "delete",
                url: `${ROUTES.users}/${user.id}`,
                message: `${user.full_name} was moved to Trash. A Super Admin can restore the account from Content Trash.`,
                local: () => setUsers((list) => list.filter((u) => u.id !== user.id)),
            });
            return;
        }

        const next = kind === "suspend" ? "suspended" : "active";
        run({
            method: "patch",
            url: `${ROUTES.users}/${user.id}/status`,
            data: { status: next },
            message:
                kind === "suspend"
                    ? `${user.full_name} was suspended and notified by email.`
                    : `${user.full_name} was reactivated and notified by email.`,
            local: () =>
                setUsers((list) =>
                    list.map((u) =>
                        u.id === user.id
                            ? {
                                  ...u,
                                  status: next,
                                  history: addHistory(u, "UPDATE", [
                                      { field: "Status", from: STATUS[u.status].label, to: STATUS[next].label },
                                  ]),
                              }
                            : u
                    )
                ),
        });
    }

    function sendResetLink() {
        const user = formState.user;
        run({
            method: "post",
            url: `${ROUTES.users}/${user.id}/password-reset`,
            message: `A password reset link was emailed to ${user.email}.`,
            local: () => {},
        });
    }

    /* ---------- confirm copy ---------- */

    const confirmCopy = confirm && {
        suspend: {
            title: `Suspend ${confirm.user.full_name}?`,
            body: "They will be signed out and cannot sign in until you reactivate the account. Their content stays as it is, and an email tells them what happened.",
            label: "Suspend account",
            danger: true,
        },
        reactivate: {
            title: `Reactivate ${confirm.user.full_name}?`,
            body: "They can sign in again with their current password, and an email lets them know.",
            label: "Reactivate account",
            danger: false,
        },
        delete: {
            title: `Move ${confirm.user.full_name} to Trash?`,
            body: "The account stops working immediately. A Super Admin can restore it from Content Trash, or purge it permanently.",
            label: "Move to Trash",
            danger: true,
        },
    }[confirm.kind];

    /* ---------- render ---------- */

    return (
        <div className="admin-users">
            {/* HEADING */}
            <div className="au-heading">
                <div>
                    <h1>Admin Users</h1>
                    <p>Create administrator accounts, assign each one a role and site, and suspend access when needed.</p>
                </div>

                <button
                    type="button"
                    className="au-btn au-btn-dark au-btn-large"
                    onClick={() => setFormState({ mode: "create", user: null })}
                >
                    <span className="au-btn-plus">
                        <Icon name="plus" size={15} />
                    </span>
                    Add Admin User
                </button>
            </div>

            {/* SUMMARY */}
            <div className="au-summary">
                <article className="au-card au-stat is-primary">
                    <h3>Total admins</h3>
                    <p>{counts.all}</p>
                </article>
                <article className="au-card au-stat">
                    <h3>Active</h3>
                    <p>{counts.active}</p>
                </article>
                <article className="au-card au-stat">
                    <h3>Suspended</h3>
                    <p>{counts.suspended}</p>
                </article>
                <article className="au-card au-stat">
                    <h3>Two-factor on</h3>
                    <p>
                        {counts.twoFactor}
                        <small>of {counts.all}</small>
                    </p>
                </article>
            </div>

            {/* LIST */}
            <section className="au-card au-list-card">
                <div className="au-toolbar">
                    <label className="au-search">
                        <Icon name="search" size={18} />
                        <input
                            type="search"
                            placeholder="Search name, email, role or site"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            aria-label="Search admin users"
                        />
                    </label>

                    <div className="au-tabs" role="tablist" aria-label="Filter by status">
                        {STATUS_TABS.map((tab) => (
                            <button
                                key={tab.key}
                                type="button"
                                role="tab"
                                aria-selected={statusTab === tab.key}
                                className={statusTab === tab.key ? "is-active" : ""}
                                onClick={() => setStatusTab(tab.key)}
                            >
                                {tab.label}
                                <span>{tab.key === "all" ? counts.all : counts[tab.key]}</span>
                            </button>
                        ))}
                    </div>

                    <select
                        className="au-select"
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        aria-label="Filter by role"
                    >
                        <option value="all">All roles</option>
                        {roles.map((role) => (
                            <option key={role.id} value={String(role.id)}>
                                {role.name}
                            </option>
                        ))}
                    </select>

                    <select
                        className="au-select"
                        value={sort}
                        onChange={(e) => setSort(e.target.value)}
                        aria-label="Sort"
                    >
                        <option value="newest">Newest first</option>
                        <option value="name">Name A to Z</option>
                        <option value="login">Last sign-in</option>
                    </select>
                </div>

                {filtered.length === 0 ? (
                    <div className="au-empty">
                        <div className="au-empty-icon">
                            <Icon name="search" size={22} />
                        </div>
                        <strong>No admin users found</strong>
                        <p>
                            {filtersActive
                                ? "Nothing matches the current search and filters."
                                : "Add the first administrator to get started."}
                        </p>
                        {filtersActive && (
                            <button type="button" className="au-btn au-btn-small" onClick={clearFilters}>
                                Clear filters
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="au-table-wrap">
                        <table className="au-table">
                            <thead>
                                <tr>
                                    <th scope="col">User</th>
                                    <th scope="col">Role</th>
                                    <th scope="col">Site</th>
                                    <th scope="col">Status</th>
                                    <th scope="col">Two-factor</th>
                                    <th scope="col">Last sign-in</th>
                                    <th scope="col" className="au-th-actions">Actions</th>
                                </tr>
                            </thead>

                            <tbody>
                                {visible.map((user) => {
                                    const role = roleOf(user);
                                    const status = STATUS[user.status] ?? STATUS.active;
                                    const locked = lockReasonFor(user);
                                    const isActive = user.status === "active";
                                    const lastLogin = formatDateTime(user.last_login_at);

                                    return (
                                        <tr key={user.id}>
                                            <td>
                                                <div className="au-user">
                                                    <span className={`au-avatar avatar-${user.id % 3}`}>
                                                        {initialsOf(user.full_name)}
                                                    </span>
                                                    <span className="au-user-text">
                                                        <strong>
                                                            {user.full_name}
                                                            {user.id === currentUserId && (
                                                                <em className="au-you">You</em>
                                                            )}
                                                        </strong>
                                                        <small>{user.email}</small>
                                                    </span>
                                                </div>
                                            </td>

                                            <td>
                                                <span className="au-role">
                                                    <span className={`au-dot tone-${role?.tone}`} />
                                                    {role?.name ?? "No role"}
                                                </span>
                                            </td>

                                            <td className="au-muted">
                                                {role ? (role.scope === "GLOBAL" ? "All sites" : role.site) : "None"}
                                            </td>

                                            <td>
                                                <span className={`au-pill ${status.cls}`}>{status.label}</span>
                                                {user.must_change_password && (
                                                    <small className="au-sub">Awaiting first sign-in</small>
                                                )}
                                            </td>

                                            <td className="au-muted">
                                                {user.two_factor_enabled ? "On" : "Off"}
                                            </td>

                                            <td className="au-muted">{lastLogin ?? "Never"}</td>

                                            <td>
                                                <div className="au-actions">
                                                    <button
                                                        type="button"
                                                        className="au-icon-btn"
                                                        title="Edit"
                                                        aria-label={`Edit ${user.full_name}`}
                                                        onClick={() => {
                                                            setServerErrors(null);
                                                            setFormState({ mode: "edit", user });
                                                        }}
                                                    >
                                                        <Icon name="edit" size={16} />
                                                    </button>

                                                    <button
                                                        type="button"
                                                        className="au-icon-btn"
                                                        title="History"
                                                        aria-label={`History for ${user.full_name}`}
                                                        onClick={() => setHistoryUser(user)}
                                                    >
                                                        <Icon name="history" size={16} />
                                                    </button>

                                                    <button
                                                        type="button"
                                                        className={`au-icon-btn ${locked ? "is-disabled" : ""}`}
                                                        title={locked || (isActive ? "Suspend" : "Reactivate")}
                                                        aria-label={`${isActive ? "Suspend" : "Reactivate"} ${user.full_name}`}
                                                        aria-disabled={Boolean(locked)}
                                                        onClick={() =>
                                                            !locked &&
                                                            setConfirm({
                                                                kind: isActive ? "suspend" : "reactivate",
                                                                user,
                                                            })
                                                        }
                                                    >
                                                        <Icon name={isActive ? "pause" : "play"} size={16} />
                                                    </button>

                                                    <button
                                                        type="button"
                                                        className={`au-icon-btn au-icon-danger ${locked ? "is-disabled" : ""}`}
                                                        title={locked || "Move to Trash"}
                                                        aria-label={`Move ${user.full_name} to Trash`}
                                                        aria-disabled={Boolean(locked)}
                                                        onClick={() =>
                                                            !locked && setConfirm({ kind: "delete", user })
                                                        }
                                                    >
                                                        <Icon name="trash" size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {filtered.length > 0 && (
                    <div className="au-pager">
                        <span>
                            Showing {(safePage - 1) * PAGE_SIZE + 1} to{" "}
                            {Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length}
                        </span>

                        <div>
                            <button
                                type="button"
                                className="au-icon-btn"
                                onClick={() => setPage(safePage - 1)}
                                disabled={safePage <= 1}
                                aria-label="Previous page"
                            >
                                <Icon name="left" size={16} />
                            </button>
                            <button
                                type="button"
                                className="au-icon-btn"
                                onClick={() => setPage(safePage + 1)}
                                disabled={safePage >= pageCount}
                                aria-label="Next page"
                            >
                                <Icon name="right" size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </section>

            {/* OVERLAYS */}
            {formState && (
                <UserFormDrawer
                    mode={formState.mode}
                    user={formState.user}
                    roles={roles}
                    users={users}
                    busy={busy}
                    serverErrors={serverErrors}
                    lockReason={formState.user ? lockReasonFor(formState.user) : null}
                    onSubmit={submitForm}
                    onResetLink={sendResetLink}
                    onClose={closeAll}
                />
            )}

            {historyUser && (
                <HistoryDrawer
                    user={users.find((u) => u.id === historyUser.id) ?? historyUser}
                    onClose={() => setHistoryUser(null)}
                />
            )}

            {confirm && (
                <ConfirmDialog
                    title={confirmCopy.title}
                    body={confirmCopy.body}
                    confirmLabel={confirmCopy.label}
                    danger={confirmCopy.danger}
                    busy={busy}
                    onConfirm={confirmAction}
                    onCancel={() => setConfirm(null)}
                />
            )}

            {toast && (
                <div className="au-toast" role="status">
                    <Icon name="check" size={17} />
                    <span>{toast}</span>
                </div>
            )}
        </div>
    );
}

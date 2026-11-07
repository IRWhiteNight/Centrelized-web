import { useEffect, useMemo, useRef, useState } from "react";
import { Link, router, usePage } from "@inertiajs/react";
import { ROUTES, WORKSPACES, currentWorkspace } from "./adminRoutes";
import "../../../css/admin-css/admin-topbar.css";



const SUPER = "/admin/super";
const GO = {
    users: ROUTES.users ?? `${SUPER}/users`,
    roles: ROUTES.roles ?? `${SUPER}/roles`,
    security: ROUTES.securityEvents ?? `${SUPER}/security`,
    trash: ROUTES.trash ?? `${SUPER}/trash`,
};

function Icon({ name, size = 20 }) {
    const common = {
        width: size,
        height: size,
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: 1.8,
        strokeLinecap: "round",
        strokeLinejoin: "round",
        "aria-hidden": true,
    };

    const icons = {
        search: (<><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>),
        bell: (<><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></>),
        grid: (<><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /></>),
        down: <path d="m7 10 5 5 5-5" />,
        check: <path d="m5 12 5 5 9-10" />,
        back: <path d="M15 18 9 12l6-6" />,
        user: (<><circle cx="12" cy="8" r="4" /><path d="M5 21a7 7 0 0 1 14 0" /></>),
        users: (<><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0" /><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.2a6.5 6.5 0 0 1 3.5 5.8" /></>),
        settings: (<><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-1.7 2.9-.2-.1a1.7 1.7 0 0 0-1.9.3l-.1.1h-3.4l-.1-.2a1.7 1.7 0 0 0-1.9-.3l-.2.1-2.9-1.7.1-.2a1.7 1.7 0 0 0-.3-1.9l-.1-.1v-3.4l.2-.1a1.7 1.7 0 0 0 .3-1.9l-.1-.2 1.7-2.9.2.1a1.7 1.7 0 0 0 1.9-.3l.1-.1h3.4l.1.2a1.7 1.7 0 0 0 1.9.3l.2-.1 2.9 1.7-.1.2a1.7 1.7 0 0 0 .3 1.9l.1.1z" /></>),
        activity: <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />,
        logout: (<><path d="M10 17l5-5-5-5" /><path d="M15 12H3" /><path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6" /></>),
        bolt: <path d="M13 2 4 14h7l-1 8 9-12h-7z" />,
        shield: (<><path d="M12 3 4 6v6c0 5 3.4 8.3 8 9.5 4.6-1.2 8-4.5 8-9.5V6z" /><path d="m9 12 2 2 4-4" /></>),
        lock: (<><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>),
        trash: (<><path d="M4 7h16M10 11v6M14 11v6" /><path d="M6 7l1 13h10l1-13M9 7V4h6v3" /></>),
        plus: <path d="M12 5v14M5 12h14" />,
        enter: (<><path d="M20 5v7a3 3 0 0 1-3 3H5" /><path d="m9 11-4 4 4 4" /></>),
        alert: (<><path d="M12 3 2.5 20h19z" /><path d="M12 10v4M12 17.2v.1" /></>),
    };

    return <svg {...common}>{icons[name]}</svg>;
}

function timeAgo(iso) {
    const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.round(minutes / 60);
    if (hours < 24) return `${hours} hr ago`;
    const days = Math.round(hours / 24);
    return `${days} day${days === 1 ? "" : "s"} ago`;
}

export default function AdminTopbar() {
    const { url, props } = usePage();
    const user = props.auth?.user;
    const workspace = currentWorkspace(url);
    const inSiteWorkspace = workspace.code !== "SUPER";
    const notifications = props.topbar?.notifications || [];

    // one of: "workspace" | "quick" | "notifications" | "profile" | null
    const [openMenu, setOpenMenu] = useState(null);
    const [palette, setPalette] = useState(false);
    const [query, setQuery] = useState("");
    const [active, setActive] = useState(0);
    const inputRef = useRef(null);
    const listRef = useRef(null);

    const toggle = (name) => setOpenMenu((current) => (current === name ? null : name));

    const openPalette = () => { setOpenMenu(null); setQuery(""); setActive(0); setPalette(true); };
    const closePalette = () => setPalette(false);

    useEffect(() => {
        setOpenMenu(null);
        setPalette(false);
    }, [url]);

    useEffect(() => {
        function handleOutsideClick(event) {
            if (!event.target.closest("[data-topbar-menu]")) setOpenMenu(null);
        }

        function handleKeys(event) {
            if (event.key === "Escape") {
                setOpenMenu(null);
                setPalette(false);
            }

            // Ctrl/Cmd + K opens or closes the command palette
            if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
                event.preventDefault();
                setOpenMenu(null);
                setQuery("");
                setActive(0);
                setPalette((open) => !open);
            }
        }

        document.addEventListener("mousedown", handleOutsideClick);
        document.addEventListener("keydown", handleKeys);

        return () => {
            document.removeEventListener("mousedown", handleOutsideClick);
            document.removeEventListener("keydown", handleKeys);
        };
    }, []);

    useEffect(() => {
        if (palette) inputRef.current?.focus();
    }, [palette]);

    const displayName = user?.name || "Super Administrator";
    const email = user?.email || "admin@perlis-sandbox.com";
    const initials = displayName.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();

    function handleLogout() {
        router.post(ROUTES.logout);
    }

    /* ---------------- command palette ---------------- */

    const commands = useMemo(() => {
        const visit = (href) => () => router.visit(href);
        const list = [
            { id: "dashboard", group: "Go to", label: "Global dashboard", hint: "Overview of every site", icon: "grid", run: visit(ROUTES.dashboard), words: "home overview" },
            { id: "users", group: "Go to", label: "Admin users", hint: "Create, assign a role, suspend", icon: "users", run: visit(GO.users), words: "accounts people add new" },
            { id: "roles", group: "Go to", label: "Roles and permissions", hint: "Module and action matrix", icon: "shield", run: visit(GO.roles), words: "access rbac" },
            { id: "audit", group: "Go to", label: "Audit log explorer", hint: "Who changed what, and when", icon: "activity", run: visit(ROUTES.auditLogs), words: "history logs export" },
            { id: "security", group: "Go to", label: "Security and login events", hint: "Sign-ins, failures, denied access", icon: "lock", run: visit(GO.security), words: "login failed attempts" },
            { id: "trash", group: "Go to", label: "Content trash", hint: "Restore or purge deleted content", icon: "trash", run: visit(GO.trash), words: "deleted restore purge" },
            { id: "sites", group: "Go to", label: "Site workspaces", hint: "Manage sites and status", icon: "settings", run: visit(ROUTES.workspaces), words: "manage sites status" },
            { id: "settings", group: "Go to", label: "System settings", hint: "Global configuration", icon: "settings", run: visit(ROUTES.settings), words: "config" },
            { id: "account", group: "Go to", label: "My account", hint: "Profile and password", icon: "user", run: visit(ROUTES.account), words: "profile password" },
        ];

        WORKSPACES.filter((w) => !w.reserved).forEach((w) =>
            list.push({ id: `ws-${w.code}`, group: "Open workspace", label: w.label, hint: w.href, tone: w.tone, run: visit(w.href), words: "site switch open" })
        );

        list.push({ id: "logout", group: "Session", label: "Sign out", hint: "End this session", icon: "logout", run: handleLogout, words: "logout exit", danger: true });
        return list;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const results = useMemo(() => {
        const q = query.trim().toLowerCase();
        const found = commands.filter((c) => !q || `${c.label} ${c.hint} ${c.words || ""}`.toLowerCase().includes(q));
        if (!q) return found;

        const text = query.trim();
        const search = [
            { id: "s-users", group: "Search for", label: `Find admin user “${text}”`, hint: "Name or email", icon: "users", run: () => router.get(GO.users, { search: text }) },
            { id: "s-logs", group: "Search for", label: `Search audit logs for “${text}”`, hint: "User, module, record or action", icon: "activity", run: () => router.get(ROUTES.auditLogs, { search: text }) },
            { id: "s-sites", group: "Search for", label: `Search sites for “${text}”`, hint: "Site name or code", icon: "grid", run: () => router.get(ROUTES.workspaces, { search: text }) },
        ];
        return [...found, ...search];
    }, [commands, query]);

    useEffect(() => { setActive(0); }, [query]);

    useEffect(() => {
        listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
    }, [active, results]);

    const runCommand = (command) => {
        if (!command) return;
        setPalette(false);
        setQuery("");
        command.run();
    };

    const onPaletteKey = (event) => {
        if (event.key === "ArrowDown") { event.preventDefault(); setActive((i) => (results.length ? (i + 1) % results.length : 0)); }
        else if (event.key === "ArrowUp") { event.preventDefault(); setActive((i) => (results.length ? (i - 1 + results.length) % results.length : 0)); }
        else if (event.key === "Enter") { event.preventDefault(); runCommand(results[active]); }
    };

    const quickActions = [
        { href: GO.users, icon: "plus", title: "Add admin user", text: "Create an account and assign a site" },
        { href: GO.security, icon: "lock", title: "Review sign-in activity", text: "Failed logins and denied access" },
        { href: GO.trash, icon: "trash", title: "Restore deleted content", text: "Content trash across all sites" },
        { href: ROUTES.auditLogs, icon: "activity", title: "Open audit log", text: "Filter, inspect and export" },
    ];

    return (
        <header className="admin-topbar">
            {/* LEFT: role badge + command search */}
            <div className="topbar-left">
                <span className="topbar-badge" title="You are signed in as Super Admin">
                    <Icon name="bolt" size={14} />
                    Super Admin
                </span>

                <button type="button" className="topbar-search" onClick={openPalette} aria-label="Open search and commands" aria-haspopup="dialog">
                    <Icon name="search" size={19} />
                    <span className="topbar-search-text">Search users, sites, logs or jump to a page</span>
                    <kbd>⌘ K</kbd>
                </button>
            </div>

            {/* RIGHT */}
            <div className="topbar-right">
                {/* Super Admin mode: shown while working inside a site */}
                {inSiteWorkspace && (
                    <div className="topbar-mode">
                        <span className="topbar-mode-pulse" aria-hidden="true" />
                        <span className="topbar-mode-label">Super Admin mode · {workspace.short}</span>
                        <Link href={ROUTES.dashboard} className="topbar-mode-back">
                            <Icon name="back" size={14} />
                            Console
                        </Link>
                    </div>
                )}

                {/* QUICK ACTIONS */}
                <div className="topbar-action-wrapper" data-topbar-menu>
                    <button
                        type="button"
                        className={`topbar-quick-button ${openMenu === "quick" ? "is-active" : ""}`}
                        onClick={() => toggle("quick")}
                        aria-expanded={openMenu === "quick"}
                        aria-haspopup="menu"
                    >
                        <Icon name="bolt" size={16} />
                        <span className="topbar-quick-name">Quick actions</span>
                    </button>

                    {openMenu === "quick" && (
                        <div className="topbar-dropdown quick-dropdown" role="menu">
                            <div className="dropdown-header">
                                <div>
                                    <h3>Quick actions</h3>
                                    <p>Common Super Admin tasks</p>
                                </div>
                            </div>

                            <div className="quick-list">
                                {quickActions.map((item) => (
                                    <Link key={item.title} href={item.href} className="quick-item" role="menuitem">
                                        <span className="quick-icon"><Icon name={item.icon} size={17} /></span>
                                        <span className="quick-text">
                                            <strong>{item.title}</strong>
                                            <small>{item.text}</small>
                                        </span>
                                    </Link>
                                ))}
                            </div>

                            <button type="button" className="quick-foot" onClick={openPalette}>
                                <span>Search everything</span>
                                <kbd>⌘ K</kbd>
                            </button>
                        </div>
                    )}
                </div>

                {/* WORKSPACE SWITCHER */}
                <div className="topbar-action-wrapper" data-topbar-menu>
                    <button
                        type="button"
                        className={`topbar-workspace-button ${openMenu === "workspace" ? "is-active" : ""}`}
                        onClick={() => toggle("workspace")}
                        aria-expanded={openMenu === "workspace"}
                        aria-haspopup="menu"
                    >
                        <Icon name="grid" size={17} />
                        <span className="topbar-workspace-name">{workspace.short}</span>
                        <Icon name="down" size={15} />
                    </button>

                    {openMenu === "workspace" && (
                        <div className="topbar-dropdown workspace-dropdown" role="menu">
                            <div className="dropdown-header">
                                <div>
                                    <h3>Switch workspace</h3>
                                    <p>Open any site as Super Admin</p>
                                </div>
                            </div>

                            <div className="workspace-list">
                                {WORKSPACES.map((item) => {
                                    const selected = item.code === workspace.code;
                                    const body = (
                                        <>
                                            <span className={`workspace-dot tone-${item.tone}`} />
                                            <span className="workspace-item-text">
                                                <strong>{item.label}</strong>
                                                <small>{item.reserved ? "Reserved for Phase 2" : item.href}</small>
                                            </span>
                                            {selected && <Icon name="check" size={16} />}
                                        </>
                                    );

                                    if (item.reserved) {
                                        return (
                                            <div key={item.code} className="workspace-item is-reserved" aria-disabled="true">
                                                {body}
                                            </div>
                                        );
                                    }

                                    return (
                                        <Link key={item.code} href={item.href} className={`workspace-item ${selected ? "is-selected" : ""}`} role="menuitem">
                                            {body}
                                        </Link>
                                    );
                                })}
                            </div>

                            <div className="dropdown-divider" />

                            <Link href={ROUTES.workspaces} className="dropdown-item" role="menuitem">
                                <Icon name="settings" size={18} />
                                <span>Manage sites and status</span>
                            </Link>
                        </div>
                    )}
                </div>

                {/* NOTIFICATIONS */}
                <div className="topbar-action-wrapper" data-topbar-menu>
                    <button
                        type="button"
                        className={`topbar-icon-button ${openMenu === "notifications" ? "is-active" : ""}`}
                        onClick={() => toggle("notifications")}
                        aria-label={notifications.length ? `Notifications, ${notifications.length} new` : "Notifications"}
                        aria-expanded={openMenu === "notifications"}
                    >
                        <Icon name="bell" size={19} />
                        {notifications.length > 0 && <span className="notification-indicator" />}
                    </button>

                    {openMenu === "notifications" && (
                        <div className="topbar-dropdown notification-dropdown">
                            <div className="dropdown-header">
                                <div>
                                    <h3>Notifications</h3>
                                    <p>Alerts from every site</p>
                                </div>
                                <span className="notification-count">{notifications.length}</span>
                            </div>

                            {notifications.length === 0 ? (
                                <div className="notification-empty">
                                    <div className="notification-empty-icon"><Icon name="bell" size={22} /></div>
                                    <strong>You're all caught up</strong>
                                    <p>No new notifications at the moment.</p>
                                </div>
                            ) : (
                                <ul className="notification-list">
                                    {notifications.map((n) => (
                                        <li key={n.id}>
                                            <Link href={n.href || ROUTES.auditLogs} className="notification-item">
                                                <span className={`notification-tone tone-${n.tone || "info"}`}>
                                                    <Icon name={n.tone === "danger" || n.tone === "warn" ? "alert" : "bell"} size={15} />
                                                </span>
                                                <span className="notification-text">
                                                    <strong>{n.title}</strong>
                                                    {n.text && <small>{n.text}</small>}
                                                </span>
                                                {n.at && <time dateTime={n.at}>{timeAgo(n.at)}</time>}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}
                </div>

                {/* PROFILE */}
                <div className="topbar-profile-wrapper" data-topbar-menu>
                    <button
                        type="button"
                        className={`topbar-profile-button ${openMenu === "profile" ? "is-active" : ""}`}
                        onClick={() => toggle("profile")}
                        aria-expanded={openMenu === "profile"}
                        aria-haspopup="menu"
                    >
                        <div className="topbar-avatar">{initials}</div>

                        <div className="topbar-profile-info">
                            <strong>{displayName}</strong>
                            <span>{email}</span>
                        </div>
                    </button>

                    {openMenu === "profile" && (
                        <div className="topbar-dropdown profile-dropdown" role="menu">
                            <div className="profile-dropdown-header">
                                <div className="topbar-avatar large">{initials}</div>
                                <div>
                                    <strong>{displayName}</strong>
                                    <span>{email}</span>
                                    <em className="role-pill">Super Admin</em>
                                </div>
                            </div>

                            <div className="dropdown-divider" />

                            <Link href={ROUTES.account} className="dropdown-item" role="menuitem">
                                <Icon name="user" size={18} />
                                <span>My Account</span>
                            </Link>

                            <Link href={ROUTES.auditLogs} className="dropdown-item" role="menuitem">
                                <Icon name="activity" size={18} />
                                <span>Audit Logs</span>
                            </Link>

                            <Link href={GO.security} className="dropdown-item" role="menuitem">
                                <Icon name="lock" size={18} />
                                <span>Security Events</span>
                            </Link>

                            <Link href={ROUTES.settings} className="dropdown-item" role="menuitem">
                                <Icon name="settings" size={18} />
                                <span>System Settings</span>
                            </Link>

                            <div className="dropdown-divider" />

                            <button type="button" className="dropdown-item logout-item" onClick={handleLogout} role="menuitem">
                                <Icon name="logout" size={18} />
                                <span>Sign Out</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* COMMAND PALETTE */}
            {palette && (
                <div className="tb-overlay" onMouseDown={(event) => event.target === event.currentTarget && closePalette()}>
                    <div className="tb-palette" role="dialog" aria-modal="true" aria-label="Search and commands">
                        <div className="tb-palette-input">
                            <Icon name="search" size={19} />
                            <input
                                ref={inputRef}
                                type="text"
                                role="combobox"
                                aria-expanded="true"
                                aria-controls="tb-palette-list"
                                aria-activedescendant={results[active] ? `tb-opt-${results[active].id}` : undefined}
                                autoComplete="off"
                                spellCheck="false"
                                placeholder="Search users, sites, logs, or jump to a page"
                                value={query}
                                onChange={(event) => setQuery(event.target.value)}
                                onKeyDown={onPaletteKey}
                            />
                            <kbd>Esc</kbd>
                        </div>

                        <ul id="tb-palette-list" className="tb-palette-list" role="listbox" ref={listRef}>
                            {results.length === 0 && <li className="tb-palette-empty" role="presentation">Nothing matches “{query.trim()}”.</li>}

                            {results.map((item, index) => (
                                <li key={item.id} role="presentation">
                                    {(index === 0 || results[index - 1].group !== item.group) && <p className="tb-palette-group">{item.group}</p>}
                                    <button
                                        type="button"
                                        id={`tb-opt-${item.id}`}
                                        role="option"
                                        aria-selected={index === active}
                                        data-index={index}
                                        className={`tb-palette-item ${index === active ? "is-active" : ""} ${item.danger ? "is-danger" : ""}`}
                                        onMouseMove={() => setActive(index)}
                                        onClick={() => runCommand(item)}
                                    >
                                        <span className="tb-palette-icon">
                                            {item.tone ? <span className={`workspace-dot tone-${item.tone}`} /> : <Icon name={item.icon} size={16} />}
                                        </span>
                                        <span className="tb-palette-text">
                                            <strong>{item.label}</strong>
                                            <small>{item.hint}</small>
                                        </span>
                                        {index === active && <Icon name="enter" size={15} />}
                                    </button>
                                </li>
                            ))}
                        </ul>

                        <footer className="tb-palette-foot">
                            <span><kbd>↑</kbd><kbd>↓</kbd> move</span>
                            <span><kbd>Enter</kbd> open</span>
                            <span><kbd>Esc</kbd> close</span>
                        </footer>
                    </div>
                </div>
            )}
        </header>
    );
}

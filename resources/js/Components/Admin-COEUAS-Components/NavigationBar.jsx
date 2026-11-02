import { useEffect, useMemo, useRef, useState } from "react";
import { Link, router, usePage } from "@inertiajs/react";
import { COEUAS_NAV, COEUAS_ROUTES, COEUAS_SUPER_NAV, SHARED } from "./COEUASRoutes";
import "../../../css/admin-COEUAS-css/navigationbar.css";

/* ------------------------------------------------------------------ */
/* ICONS                                                               */
/* ------------------------------------------------------------------ */
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
        dashboard: (<><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></>),
        home: (<><path d="M3 11 12 3l9 8" /><path d="M5 10v10h14V10" /><path d="M10 20v-6h4v6" /></>),
        about: (<><circle cx="12" cy="12" r="9" /><path d="M12 11v5" /><path d="M12 8h.01" /></>),
        users: (<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>),
        flask: (<><path d="M9 3h6" /><path d="M10 3v6L4.5 19a1.5 1.5 0 0 0 1.3 2.2h12.4a1.5 1.5 0 0 0 1.3-2.2L14 9V3" /><path d="M7.5 14h9" /></>),
        book: (<><path d="M4 5a2 2 0 0 1 2-2h14v16H6a2 2 0 0 0-2 2z" /><path d="M4 19V5" /><path d="M9 7h7M9 11h7" /></>),
        building: (<><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M9 21v-4h6v4" /><path d="M8 7h.01M12 7h.01M16 7h.01M8 11h.01M12 11h.01M16 11h.01" /></>),
        globe: (<><circle cx="12" cy="12" r="9" /><path d="M3 12h18" /><path d="M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" /></>),
        mail: (<><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-10 6L2 7" /></>),
        file: (<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><path d="M8 13h8M8 17h8" /></>),
        tag: (<><path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z" /><circle cx="7.5" cy="7.5" r="1.2" /></>),
        image: (<><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" /></>),
        sliders: (<><path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3" /><path d="M1 14h6M9 8h6M17 16h6" /></>),
        trash: (<><path d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6" /><path d="M10 11v5M14 11v5" /></>),
        down: <path d="m7 10 5 5 5-5" />,
        chevron: <path d="m9 6 6 6-6 6" />,
        check: <path d="m5 12 5 5 9-10" />,
        back: <path d="M15 18 9 12l6-6" />,
        menu: <path d="M4 6h16M4 12h16M4 18h16" />,
        close: <path d="M18 6 6 18M6 6l12 12" />,
        panel: (<><rect x="3" y="3" width="18" height="18" rx="3" /><path d="M9 3v18" /></>),
        external: (<><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><path d="M10 14 21 3" /></>),
        user: (<><circle cx="12" cy="8" r="4" /><path d="M5 21a7 7 0 0 1 14 0" /></>),
        settings: (
            <>
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-1.7 2.9-.2-.1a1.7 1.7 0 0 0-1.9.3l-.1.1h-3.4l-.1-.2a1.7 1.7 0 0 0-1.9-.3l-.2.1-2.9-1.7.1-.2a1.7 1.7 0 0 0-.3-1.9l-.1-.1v-3.4l.2-.1a1.7 1.7 0 0 0 .3-1.9l-.1-.2 1.7-2.9.2.1a1.7 1.7 0 0 0 1.9-.3l.1-.1h3.4l.1.2a1.7 1.7 0 0 0 1.9.3l.2-.1 2.9 1.7-.1.2a1.7 1.7 0 0 0 .3 1.9l.1.1z" />
            </>
        ),
        activity: <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />,
        logout: (<><path d="M10 17l5-5-5-5" /><path d="M15 12H3" /><path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6" /></>),
    };

    return <svg {...common}>{icons[name]}</svg>;
}

/* ------------------------------------------------------------------ */
/* HELPERS                                                             */
/* ------------------------------------------------------------------ */
const pathOf = (url = "") => url.split("?")[0].split("#")[0].replace(/\/+$/, "") || "/";

const matches = (path, href) => path === href || path.startsWith(`${href}/`);

// Every link in the workspace menu, in one flat list.
const allLinks = [];
COEUAS_NAV.forEach((group) =>
    group.items.forEach((item) => {
        if (item.children) {
            item.children.forEach((child) =>
                allLinks.push({
                    label: `${item.label} › ${child.label}`,
                    href: child.href,
                    icon: item.icon,
                    hint: child.hint,
                })
            );
        } else {
            allLinks.push({ label: item.label, href: item.href, icon: item.icon, hint: item.hint, exact: item.exact });
        }
    })
);

// The one link that matches the current page best (longest path wins), so
// /publications highlights "Publications" and /publications/import highlights
// "Bulk import", and an edit page such as /people/members/12/edit still lights
// up "Member categories and directory".
function bestMatch(url) {
    const path = pathOf(url);
    let best = null;

    allLinks.forEach((link) => {
        const hit = link.exact ? path === link.href : matches(path, link.href);
        if (hit && (!best || link.href.length > best.length)) best = link.href;
    });

    return best;
}

// Adjust to match how your Laravel auth payload exposes the role.
function useAdminUser() {
    const { props } = usePage();
    const user = props.auth?.user;
    const rawRole = user?.role?.code ?? user?.role?.slug ?? user?.role_code ?? user?.role ?? "";
    const role = String(typeof rawRole === "object" ? rawRole?.name ?? "" : rawRole).toUpperCase();
    const isSuper = Boolean(user?.is_super_admin) || role.includes("SUPER");
    const counts = props.coeuas?.counts || {};
    const publicUrl = props.coeuas?.publicUrl || null;
    return { user, isSuper, counts, publicUrl };
}

/* ------------------------------------------------------------------ */
/* SIDEBAR                                                             */
/* ------------------------------------------------------------------ */
function Badge({ value }) {
    if (!value) return null;
    return <span className="cu-badge">{value > 99 ? "99+" : value}</span>;
}

function SidebarGroup({ item, active, collapsed, open, onToggle, counts }) {
    const childActive = item.children.some((child) => child.href === active);

    if (collapsed) {
        return (
            <Link
                href={item.children[0].href}
                className={`cu-nav-item ${childActive ? "is-active" : ""}`}
                title={item.label}
            >
                <span className="cu-nav-icon"><Icon name={item.icon} size={19} /></span>
                <span className="cu-nav-label">{item.label}</span>
                {item.badge && counts[item.badge] > 0 && <span className="cu-badge-dot" />}
            </Link>
        );
    }

    return (
        <div className={`cu-nav-group ${open ? "is-open" : ""}`}>
            <button
                type="button"
                className={`cu-nav-item ${childActive ? "has-active-child" : ""}`}
                onClick={onToggle}
                aria-expanded={open}
            >
                <span className="cu-nav-icon"><Icon name={item.icon} size={19} /></span>
                <span className="cu-nav-label">{item.label}</span>
                {item.badge && <Badge value={counts[item.badge]} />}
                <span className="cu-nav-chevron"><Icon name="chevron" size={15} /></span>
            </button>

            <div className="cu-subnav-wrap">
                <ul className="cu-subnav">
                    {item.children.map((child) => (
                        <li key={child.href}>
                            <Link
                                href={child.href}
                                className={`cu-subnav-link ${child.href === active ? "is-active" : ""}`}
                                title={child.hint}
                                tabIndex={open ? 0 : -1}
                            >
                                <span className="cu-subnav-dot" />
                                <span>{child.label}</span>
                                {child.badge && <Badge value={counts[child.badge]} />}
                            </Link>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}

export function COEUASSidebar({ collapsed, onToggleCollapse, mobileOpen, onCloseMobile }) {
    const { url } = usePage();
    const { isSuper, counts } = useAdminUser();
    const active = useMemo(() => bestMatch(url), [url]);

    const activeGroupKey = useMemo(() => {
        for (const group of COEUAS_NAV) {
            for (const item of group.items) {
                if (item.children?.some((child) => child.href === active)) return item.key;
            }
        }
        return null;
    }, [active]);

    const [openKeys, setOpenKeys] = useState(() => (activeGroupKey ? [activeGroupKey] : []));

    useEffect(() => {
        if (activeGroupKey) {
            setOpenKeys((keys) => (keys.includes(activeGroupKey) ? keys : [...keys, activeGroupKey]));
        }
    }, [activeGroupKey]);

    const toggleKey = (key) =>
        setOpenKeys((keys) => (keys.includes(key) ? keys.filter((k) => k !== key) : [...keys, key]));

    return (
        <aside
            className={`cu-sidebar ${collapsed ? "is-collapsed" : ""} ${mobileOpen ? "is-mobile-open" : ""}`}
            aria-label="COE-UAS admin navigation"
        >
            {/* BRAND */}
            <div className="cu-brand">
                <Link href={COEUAS_ROUTES.dashboard} className="cu-brand-link">
                    <span className="cu-brand-mark">C</span>
                    <span className="cu-brand-text">
                        <strong>COE-UAS</strong>
                        <small>COE-UAS Admin Workspace</small>
                    </span>
                </Link>

                <button
                    type="button"
                    className="cu-collapse-button"
                    onClick={onToggleCollapse}
                    aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                    title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                    <Icon name="panel" size={17} />
                </button>

                <button type="button" className="cu-close-button" onClick={onCloseMobile} aria-label="Close menu">
                    <Icon name="close" size={18} />
                </button>
            </div>

            {/* NAV */}
            <nav className="cu-nav">
                {COEUAS_NAV.map((group) => (
                    <div className="cu-nav-section" key={group.section}>
                        <p className="cu-nav-section-title">{group.section}</p>

                        {group.items.map((item) => {
                            if (item.children) {
                                return (
                                    <SidebarGroup
                                        key={item.key}
                                        item={item}
                                        active={active}
                                        counts={counts}
                                        collapsed={collapsed}
                                        open={openKeys.includes(item.key)}
                                        onToggle={() => toggleKey(item.key)}
                                    />
                                );
                            }

                            const isActive = item.href === active;

                            return (
                                <Link
                                    key={item.key}
                                    href={item.href}
                                    className={`cu-nav-item ${isActive ? "is-active" : ""}`}
                                    title={collapsed ? item.label : item.hint}
                                >
                                    <span className="cu-nav-icon"><Icon name={item.icon} size={19} /></span>
                                    <span className="cu-nav-label">{item.label}</span>
                                    {item.badge && !collapsed && <Badge value={counts[item.badge]} />}
                                    {item.badge && collapsed && counts[item.badge] > 0 && <span className="cu-badge-dot" />}
                                </Link>
                            );
                        })}
                    </div>
                ))}

                {/* SUPER ADMIN ONLY (use case 2.3, red band) */}
                {isSuper && (
                    <div className="cu-nav-section cu-nav-section-super">
                        <p className="cu-nav-section-title">{COEUAS_SUPER_NAV.section}</p>

                        {COEUAS_SUPER_NAV.items.map((item) => (
                            <Link
                                key={item.key}
                                href={item.href}
                                className="cu-nav-item cu-nav-item-super"
                                title={collapsed ? item.label : item.hint}
                            >
                                <span className="cu-nav-icon"><Icon name={item.icon} size={19} /></span>
                                <span className="cu-nav-label">{item.label}</span>
                                <span className="cu-nav-chevron"><Icon name="external" size={14} /></span>
                            </Link>
                        ))}
                    </div>
                )}
            </nav>

            {/* FOOTER */}
            <div className="cu-sidebar-footer">
                <div className="cu-audit-note">
                    <Icon name="activity" size={16} />
                    <p>Every add, update and delete you make here is recorded in the audit log.</p>
                </div>

                {isSuper && (
                    <Link href={SHARED.console} className="cu-console-link" title="Back to Super Admin Console">
                        <Icon name="back" size={15} />
                        <span>Super Admin Console</span>
                    </Link>
                )}
            </div>
        </aside>
    );
}

/* ------------------------------------------------------------------ */
/* TOPBAR                                                              */
/* ------------------------------------------------------------------ */
export function COEUASTopbar() {
    const { url } = usePage();
    const { user, isSuper, counts, publicUrl } = useAdminUser();

    // one of: "workspace" | "notifications" | "profile" | null
    const [openMenu, setOpenMenu] = useState(null);
    const [search, setSearch] = useState("");
    const [searchOpen, setSearchOpen] = useState(false);
    const searchRef = useRef(null);

    const toggle = (name) => setOpenMenu((current) => (current === name ? null : name));

    useEffect(() => {
        setOpenMenu(null);
        setSearch("");
        setSearchOpen(false);
    }, [url]);

    useEffect(() => {
        function handleOutsideClick(event) {
            if (!event.target.closest("[data-cu-menu]")) {
                setOpenMenu(null);
                setSearchOpen(false);
            }
        }

        function handleKeys(event) {
            if (event.key === "Escape") {
                setOpenMenu(null);
                setSearchOpen(false);
            }

            // Ctrl/Cmd + K focuses the search box
            if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
                event.preventDefault();
                searchRef.current?.focus();
            }
        }

        document.addEventListener("mousedown", handleOutsideClick);
        document.addEventListener("keydown", handleKeys);

        return () => {
            document.removeEventListener("mousedown", handleOutsideClick);
            document.removeEventListener("keydown", handleKeys);
        };
    }, []);

    // Search jumps to any admin page. Matches the label and the site-map wording.
    const results = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return [];
        return allLinks
            .filter((entry) => `${entry.label} ${entry.hint ?? ""}`.toLowerCase().includes(q))
            .slice(0, 7);
    }, [search]);

    const displayName = user?.name || (isSuper ? "Super Administrator" : "COE-UAS Administrator");
    const email = user?.email || "";
    const roleLabel = isSuper ? "Super Admin" : "COE-UAS Content Admin";
    const initials = displayName
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase();

    // Dashboard shows: drafts, scheduled items, new enquiries.
    const notifications = [
        counts.enquiries > 0 && {
            key: "enquiries",
            title: `${counts.enquiries} new enquir${counts.enquiries > 1 ? "ies" : "y"}`,
            text: "Waiting in the enquiry inbox",
            href: COEUAS_ROUTES.enquiries,
            icon: "mail",
        },
        counts.drafts > 0 && {
            key: "drafts",
            title: `${counts.drafts} draft${counts.drafts > 1 ? "s" : ""} not published`,
            text: "Review them on the dashboard",
            href: COEUAS_ROUTES.dashboard,
            icon: "file",
        },
        counts.scheduled > 0 && {
            key: "scheduled",
            title: `${counts.scheduled} scheduled item${counts.scheduled > 1 ? "s" : ""}`,
            text: "Waiting to be published",
            href: COEUAS_ROUTES.dashboard,
            icon: "about",
        },
    ].filter(Boolean);

    function handleLogout() {
        router.post(SHARED.logout);
    }

    function handleSearch(event) {
        event.preventDefault();
        if (results[0]) router.visit(results[0].href);
    }

    return (
        <header className="cu-topbar">
            {/* LEFT: search (jumps to any admin page) */}
            <form className="cu-search" onSubmit={handleSearch} data-cu-menu>
                <Icon name="search" size={19} />

                <input
                    ref={searchRef}
                    type="search"
                    placeholder="Search admin pages"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    onFocus={() => setSearchOpen(true)}
                    aria-label="Search admin pages"
                    autoComplete="off"
                />

                <kbd>⌘ K</kbd>

                {searchOpen && search.trim() && (
                    <div className="cu-dropdown cu-search-results" role="listbox">
                        {results.length === 0 ? (
                            <p className="cu-search-empty">No pages match “{search.trim()}”</p>
                        ) : (
                            results.map((entry) => (
                                <Link key={entry.href} href={entry.href} className="cu-search-result" role="option">
                                    <Icon name={entry.icon} size={17} />
                                    <span>{entry.label}</span>
                                </Link>
                            ))
                        )}
                    </div>
                )}
            </form>

            {/* RIGHT */}
            <div className="cu-topbar-right">
                {/* Super Admin mode: only the Super Admin sees this while inside COE-UAS */}
                {isSuper && (
                    <div className="cu-mode">
                        <span className="cu-mode-label">Super Admin mode · COE-UAS</span>
                        <Link href={SHARED.console} className="cu-mode-back">
                            <Icon name="back" size={14} />
                            Console
                        </Link>
                    </div>
                )}

                {/* View public site */}
                {publicUrl && (
                    <a
                        href={publicUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="cu-icon-button"
                        aria-label="View public website"
                        title="View public website"
                    >
                        <Icon name="external" size={18} />
                    </a>
                )}

                {/* WORKSPACE SWITCHER (Super Admin only: site admins never see other workspaces) */}
                {isSuper && (
                    <div className="cu-menu-wrap" data-cu-menu>
                        <button
                            type="button"
                            className={`cu-ws-button ${openMenu === "workspace" ? "is-active" : ""}`}
                            onClick={() => toggle("workspace")}
                            aria-expanded={openMenu === "workspace"}
                            aria-haspopup="menu"
                        >
                            <Icon name="grid" size={17} />
                            <span className="cu-ws-name">COE-UAS</span>
                            <Icon name="down" size={15} />
                        </button>

                        {openMenu === "workspace" && (
                            <div className="cu-dropdown cu-ws-dropdown" role="menu">
                                <div className="cu-dd-header">
                                    <div>
                                        <h3>Switch workspace</h3>
                                        <p>Open any site as Super Admin</p>
                                    </div>
                                </div>

                                <div className="cu-ws-list">
                                    <Link href={SHARED.console} className="cu-ws-item" role="menuitem">
                                        <span className="cu-ws-dot tone-super" />
                                        <span className="cu-ws-item-text">
                                            <strong>Super Admin Console</strong>
                                            <small>{SHARED.console}</small>
                                        </span>
                                    </Link>

                                    <Link href={SHARED.psb} className="cu-ws-item" role="menuitem">
                                        <span className="cu-ws-dot tone-psb" />
                                        <span className="cu-ws-item-text">
                                            <strong>Perlis Airspace Sandbox</strong>
                                            <small>{SHARED.psb}</small>
                                        </span>
                                    </Link>

                                    <Link href={COEUAS_ROUTES.dashboard} className="cu-ws-item is-selected" role="menuitem">
                                        <span className="cu-ws-dot tone-coeuas" />
                                        <span className="cu-ws-item-text">
                                            <strong>COE-UAS</strong>
                                            <small>{COEUAS_ROUTES.dashboard}</small>
                                        </span>
                                        <Icon name="check" size={16} />
                                    </Link>

                                    <div className="cu-ws-item is-reserved" aria-disabled="true">
                                        <span className="cu-ws-dot tone-vertiport" />
                                        <span className="cu-ws-item-text">
                                            <strong>Vertiport Malaysia</strong>
                                            <small>Reserved for Phase 2</small>
                                        </span>
                                    </div>
                                </div>

                                <div className="cu-dd-divider" />

                                <Link href={SHARED.workspaces} className="cu-dd-item" role="menuitem">
                                    <Icon name="settings" size={18} />
                                    <span>Manage sites and status</span>
                                </Link>
                            </div>
                        )}
                    </div>
                )}

                {/* NOTIFICATIONS */}
                <div className="cu-menu-wrap" data-cu-menu>
                    <button
                        type="button"
                        className={`cu-icon-button ${openMenu === "notifications" ? "is-active" : ""}`}
                        onClick={() => toggle("notifications")}
                        aria-label="Notifications"
                        aria-expanded={openMenu === "notifications"}
                    >
                        <Icon name="bell" size={19} />
                        {notifications.length > 0 && <span className="cu-indicator" />}
                    </button>

                    {openMenu === "notifications" && (
                        <div className="cu-dropdown cu-notification-dropdown">
                            <div className="cu-dd-header">
                                <div>
                                    <h3>Notifications</h3>
                                    <p>New work for the COE-UAS website</p>
                                </div>
                                <span className="cu-notification-count">{notifications.length}</span>
                            </div>

                            {notifications.length === 0 ? (
                                <div className="cu-notification-empty">
                                    <div className="cu-notification-empty-icon">
                                        <Icon name="bell" size={22} />
                                    </div>
                                    <strong>You're all caught up</strong>
                                    <p>No new enquiries, drafts or scheduled items.</p>
                                </div>
                            ) : (
                                <div className="cu-notification-list">
                                    {notifications.map((item) => (
                                        <Link key={item.key} href={item.href} className="cu-notification-item">
                                            <span className="cu-notification-item-icon">
                                                <Icon name={item.icon} size={17} />
                                            </span>
                                            <span>
                                                <strong>{item.title}</strong>
                                                <small>{item.text}</small>
                                            </span>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* PROFILE */}
                <div className="cu-profile-wrap" data-cu-menu>
                    <button
                        type="button"
                        className={`cu-profile-button ${openMenu === "profile" ? "is-active" : ""}`}
                        onClick={() => toggle("profile")}
                        aria-expanded={openMenu === "profile"}
                    >
                        <div className="cu-avatar">{initials}</div>

                        <div className="cu-profile-info">
                            <strong>{displayName}</strong>
                            <span>{email || roleLabel}</span>
                        </div>
                    </button>

                    {openMenu === "profile" && (
                        <div className="cu-dropdown cu-profile-dropdown">
                            <div className="cu-profile-dropdown-header">
                                <div className="cu-avatar large">{initials}</div>
                                <div>
                                    <strong>{displayName}</strong>
                                    {email && <span>{email}</span>}
                                    <em className="cu-role-pill">{roleLabel}</em>
                                </div>
                            </div>

                            <div className="cu-dd-divider" />

                            <Link href={COEUAS_ROUTES.account} className="cu-dd-item">
                                <Icon name="user" size={18} />
                                <span>My Account</span>
                            </Link>

                            <Link href={COEUAS_ROUTES.activity} className="cu-dd-item">
                                <Icon name="activity" size={18} />
                                <span>My Activity Log</span>
                            </Link>

                            <div className="cu-dd-divider" />

                            <button type="button" className="cu-dd-item cu-logout-item" onClick={handleLogout}>
                                <Icon name="logout" size={18} />
                                <span>Sign Out</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}

/* ------------------------------------------------------------------ */
/* SHELL: sidebar + topbar + page content                              */
/* Usage:  <NavigationBar> ...page... </NavigationBar>                 */
/* ------------------------------------------------------------------ */
export default function NavigationBar({ children }) {
    const { url } = usePage();

    const [collapsed, setCollapsed] = useState(() => {
        try {
            return localStorage.getItem("coeuas-sidebar-collapsed") === "1";
        } catch {
            return false;
        }
    });
    const [mobileOpen, setMobileOpen] = useState(false);

    useEffect(() => {
        try {
            localStorage.setItem("coeuas-sidebar-collapsed", collapsed ? "1" : "0");
        } catch {
            /* storage unavailable: ignore */
        }
    }, [collapsed]);

    useEffect(() => {
        setMobileOpen(false);
    }, [url]);

    useEffect(() => {
        const onKey = (event) => event.key === "Escape" && setMobileOpen(false);
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, []);

    return (
        <div className={`cu-shell ${collapsed ? "is-collapsed" : ""}`}>
            {/* floating toggle (small screens) */}
            <button
                type="button"
                className="cu-sidebar-toggle"
                onClick={() => setMobileOpen(true)}
                aria-label="Open menu"
            >
                <Icon name="menu" size={22} />
            </button>

            {mobileOpen && <div className="cu-overlay" onClick={() => setMobileOpen(false)} />}

            <COEUASSidebar
                collapsed={collapsed}
                onToggleCollapse={() => setCollapsed((value) => !value)}
                mobileOpen={mobileOpen}
                onCloseMobile={() => setMobileOpen(false)}
            />

            <div className="cu-main">
                <COEUASTopbar />
                <main className="cu-content">{children}</main>
            </div>
        </div>
    );
}

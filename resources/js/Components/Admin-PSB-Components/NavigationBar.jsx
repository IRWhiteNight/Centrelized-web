import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Link, router, usePage } from "@inertiajs/react";
import { PSB_NAV, PSB_ROUTES, SHARED } from "./psbRoutes";
import "../../../css/admin-PSB-css/navigation-bar.css";

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
        target: (<><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1" /></>),
        layers: (<><polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" /></>),
        pin: (<><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0z" /><circle cx="12" cy="10" r="3" /></>),
        image: (<><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" /></>),
        help: (<><circle cx="12" cy="12" r="9" /><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3" /><path d="M12 17h.01" /></>),
        mail: (<><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-10 6L2 7" /></>),
        file: (<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><path d="M8 13h8M8 17h8" /></>),
        users: (<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>),
        folder: <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />,
        sliders: (<><path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3" /><path d="M1 14h6M9 8h6M17 16h6" /></>),
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

function isActive(url, href, exact = false) {
    const path = pathOf(url);
    return exact ? path === href : path === href || path.startsWith(`${href}/`);
}

// Adjust this to match how your Laravel auth payload exposes the role.
function useAdminUser() {
    const { props } = usePage();
    const user = props.auth?.user;
    const rawRole = user?.role?.code ?? user?.role?.slug ?? user?.role_code ?? user?.role ?? "";
    const role = String(typeof rawRole === "object" ? rawRole?.name ?? "" : rawRole).toUpperCase();
    const isSuper = Boolean(user?.is_super_admin) || role.includes("SUPER");
    const counts = props.psb?.counts || {};
    const publicUrl = props.psb?.publicUrl || null;
    return { user, isSuper, counts, publicUrl };
}

const flattenNav = () => {
    const out = [];
    PSB_NAV.forEach((group) =>
        group.items.forEach((item) => {
            if (item.children) {
                item.children.forEach((child) =>
                    out.push({ label: `${item.label} › ${child.label}`, href: child.href, icon: item.icon })
                );
            } else {
                out.push({ label: item.label, href: item.href, icon: item.icon });
            }
        })
    );
    return out;
};

/* ------------------------------------------------------------------ */
/* SIDEBAR                                                             */
/* ------------------------------------------------------------------ */
function Badge({ value }) {
    if (!value) return null;
    return <span className="psb-badge">{value > 99 ? "99+" : value}</span>;
}

// A group is "here" when one of its pages is open, or when its own landing URL
// (item.href, e.g. /admin/psb/home) is open.
const groupHere = (url, item) =>
    Boolean(item.href && pathOf(url) === item.href) ||
    item.children.some((child) => isActive(url, child.href, true));

function SidebarGroup({ item, url, collapsed, open, onToggle, counts }) {
    const childActive = groupHere(url, item);

    // Click on a group: open its dropdown and, if it has a landing URL, go there.
    // Clicking again while it is open only closes it (no page change).
    function handleClick() {
        if (!open && item.href && !childActive) router.visit(item.href);
        onToggle();
    }

    if (collapsed) {
        return (
            <Link
                href={item.href ?? item.children[0].href}
                className={`psb-nav-item ${childActive ? "is-active" : ""}`}
                title={item.label}
            >
                <span className="psb-nav-icon"><Icon name={item.icon} size={19} /></span>
                <span className="psb-nav-label">{item.label}</span>
                {item.badge && counts[item.badge] > 0 && <span className="psb-badge-dot" />}
            </Link>
        );
    }

    return (
        <div className={`psb-nav-group ${open ? "is-open" : ""}`}>
            <button
                type="button"
                className={`psb-nav-item ${childActive ? "has-active-child" : ""}`}
                onClick={handleClick}
                aria-expanded={open}
            >
                <span className="psb-nav-icon"><Icon name={item.icon} size={19} /></span>
                <span className="psb-nav-label">{item.label}</span>
                {item.badge && <Badge value={counts[item.badge]} />}
                <span className="psb-nav-chevron"><Icon name="chevron" size={15} /></span>
            </button>

            <div className="psb-subnav-wrap">
                <ul className="psb-subnav">
                    {item.children.map((child, index) => (
                        <li key={child.href}>
                            <Link
                                href={child.href}
                                className={`psb-subnav-link ${
                                    isActive(url, child.href, true) ||
                                    (index === 0 && item.href && pathOf(url) === item.href)
                                        ? "is-active"
                                        : ""
                                }`}
                            >
                                <span className="psb-subnav-dot" />
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

export function PSBSidebar({ collapsed, onToggleCollapse, mobileOpen, onCloseMobile }) {
    const { url } = usePage();
    const { isSuper, counts } = useAdminUser();

    const activeGroupKey = useMemo(() => {
        for (const group of PSB_NAV) {
            for (const item of group.items) {
                if (item.children && groupHere(url, item)) return item.key;
            }
        }
        return null;
    }, [url]);

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
            className={`psb-sidebar ${collapsed ? "is-collapsed" : ""} ${mobileOpen ? "is-mobile-open" : ""}`}
            aria-label="PSB admin navigation"
        >
            {/* BRAND */}
            <div className="psb-brand">
                <Link href={PSB_ROUTES.dashboard} className="psb-brand-link">
                    <span className="psb-brand-mark">P</span>
                    <span className="psb-brand-text">
                        <strong>Perlis Airspace Sandbox</strong>
                        <small>PSB Admin Workspace</small>
                    </span>
                </Link>

                <button
                    type="button"
                    className="psb-collapse-button"
                    onClick={onToggleCollapse}
                    aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                    title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                    <Icon name="panel" size={17} />
                </button>

                <button type="button" className="psb-close-button" onClick={onCloseMobile} aria-label="Close menu">
                    <Icon name="close" size={18} />
                </button>
            </div>

            {/* NAV */}
            <nav className="psb-nav">
                {PSB_NAV.map((group) => (
                    <div className="psb-nav-section" key={group.section}>
                        <p className="psb-nav-section-title">{group.section}</p>

                        {group.items.map((item) => {
                            if (item.children) {
                                return (
                                    <SidebarGroup
                                        key={item.key}
                                        item={item}
                                        url={url}
                                        counts={counts}
                                        collapsed={collapsed}
                                        open={openKeys.includes(item.key)}
                                        onToggle={() => toggleKey(item.key)}
                                    />
                                );
                            }

                            const active = isActive(url, item.href, item.exact);

                            return (
                                <Link
                                    key={item.key}
                                    href={item.href}
                                    className={`psb-nav-item ${active ? "is-active" : ""}`}
                                    title={collapsed ? item.label : undefined}
                                >
                                    <span className="psb-nav-icon"><Icon name={item.icon} size={19} /></span>
                                    <span className="psb-nav-label">{item.label}</span>
                                    {item.badge && !collapsed && <Badge value={counts[item.badge]} />}
                                    {item.badge && collapsed && counts[item.badge] > 0 && <span className="psb-badge-dot" />}
                                </Link>
                            );
                        })}
                    </div>
                ))}
            </nav>

            {/* FOOTER */}
            <div className="psb-sidebar-footer">
                <div className="psb-audit-note">
                    <Icon name="activity" size={16} />
                    <p>
                        Every add, update and delete you make here is recorded in the audit log.
                    </p>
                </div>

                {isSuper && (
                    <Link href={SHARED.console} className="psb-console-link" title="Back to Super Admin Console">
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
export function PSBTopbar() {
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
            if (!event.target.closest("[data-psb-menu]")) {
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

    const navIndex = useMemo(flattenNav, []);
    const results = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return [];
        return navIndex.filter((entry) => entry.label.toLowerCase().includes(q)).slice(0, 7);
    }, [search, navIndex]);

    const displayName = user?.name || (isSuper ? "Super Administrator" : "PSB Administrator");
    const email = user?.email || "";
    const roleLabel = isSuper ? "Super Admin" : "PSB Content Admin";
    const initials = displayName
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase();

    const notifications = [
        counts.applications > 0 && {
            key: "applications",
            title: `${counts.applications} new application${counts.applications > 1 ? "s" : ""}`,
            text: "Waiting in the application inbox",
            href: PSB_ROUTES.applications,
            icon: "file",
        },
        counts.enquiries > 0 && {
            key: "enquiries",
            title: `${counts.enquiries} new enquir${counts.enquiries > 1 ? "ies" : "y"}`,
            text: "Waiting in the general enquiry inbox",
            href: PSB_ROUTES.enquiries,
            icon: "mail",
        },
        counts.drafts > 0 && {
            key: "drafts",
            title: `${counts.drafts} draft${counts.drafts > 1 ? "s" : ""} not published`,
            text: "Review them on the dashboard",
            href: PSB_ROUTES.dashboard,
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
        <header className="psb-topbar">
            {/* LEFT: search (jumps to any admin page) */}
            <form className="psb-search" onSubmit={handleSearch} data-psb-menu>
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
                    <div className="psb-dropdown psb-search-results" role="listbox">
                        {results.length === 0 ? (
                            <p className="psb-search-empty">No pages match “{search.trim()}”</p>
                        ) : (
                            results.map((entry) => (
                                <Link key={entry.href} href={entry.href} className="psb-search-result" role="option">
                                    <Icon name={entry.icon} size={17} />
                                    <span>{entry.label}</span>
                                </Link>
                            ))
                        )}
                    </div>
                )}
            </form>

            {/* RIGHT */}
            <div className="psb-topbar-right">
                {/* Super Admin mode: only Super Admin sees this while inside PSB */}
                {isSuper && (
                    <div className="psb-mode">
                        <span className="psb-mode-label">Super Admin mode · PSB</span>
                        <Link href={SHARED.console} className="psb-mode-back">
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
                        className="psb-icon-button"
                        aria-label="View public website"
                        title="View public website"
                    >
                        <Icon name="external" size={18} />
                    </a>
                )}

                {/* WORKSPACE SWITCHER (Super Admin only: site admins never see other workspaces) */}
                {isSuper && (
                    <div className="psb-menu-wrap" data-psb-menu>
                        <button
                            type="button"
                            className={`psb-ws-button ${openMenu === "workspace" ? "is-active" : ""}`}
                            onClick={() => toggle("workspace")}
                            aria-expanded={openMenu === "workspace"}
                            aria-haspopup="menu"
                        >
                            <Icon name="grid" size={17} />
                            <span className="psb-ws-name">PSB</span>
                            <Icon name="down" size={15} />
                        </button>

                        {openMenu === "workspace" && (
                            <div className="psb-dropdown psb-ws-dropdown" role="menu">
                                <div className="psb-dd-header">
                                    <div>
                                        <h3>Switch workspace</h3>
                                        <p>Open any site as Super Admin</p>
                                    </div>
                                </div>

                                <div className="psb-ws-list">
                                    <Link href={SHARED.console} className="psb-ws-item" role="menuitem">
                                        <span className="psb-ws-dot tone-super" />
                                        <span className="psb-ws-item-text">
                                            <strong>Super Admin Console</strong>
                                            <small>{SHARED.console}</small>
                                        </span>
                                    </Link>

                                    <Link href={PSB_ROUTES.dashboard} className="psb-ws-item is-selected" role="menuitem">
                                        <span className="psb-ws-dot tone-psb" />
                                        <span className="psb-ws-item-text">
                                            <strong>Perlis Airspace Sandbox</strong>
                                            <small>{PSB_ROUTES.dashboard}</small>
                                        </span>
                                        <Icon name="check" size={16} />
                                    </Link>

                                    <Link href={SHARED.coeuas} className="psb-ws-item" role="menuitem">
                                        <span className="psb-ws-dot tone-coeuas" />
                                        <span className="psb-ws-item-text">
                                            <strong>COE-UAS</strong>
                                            <small>{SHARED.coeuas}</small>
                                        </span>
                                    </Link>

                                    <div className="psb-ws-item is-reserved" aria-disabled="true">
                                        <span className="psb-ws-dot tone-vertiport" />
                                        <span className="psb-ws-item-text">
                                            <strong>Vertiport Malaysia</strong>
                                            <small>Reserved for Phase 2</small>
                                        </span>
                                    </div>
                                </div>

                                <div className="psb-dd-divider" />

                                <Link href={SHARED.workspaces} className="psb-dd-item" role="menuitem">
                                    <Icon name="settings" size={18} />
                                    <span>Manage sites and status</span>
                                </Link>
                            </div>
                        )}
                    </div>
                )}

                {/* NOTIFICATIONS */}
                <div className="psb-menu-wrap" data-psb-menu>
                    <button
                        type="button"
                        className={`psb-icon-button ${openMenu === "notifications" ? "is-active" : ""}`}
                        onClick={() => toggle("notifications")}
                        aria-label="Notifications"
                        aria-expanded={openMenu === "notifications"}
                    >
                        <Icon name="bell" size={19} />
                        {notifications.length > 0 && <span className="psb-indicator" />}
                    </button>

                    {openMenu === "notifications" && (
                        <div className="psb-dropdown psb-notification-dropdown">
                            <div className="psb-dd-header">
                                <div>
                                    <h3>Notifications</h3>
                                    <p>New work for the PSB website</p>
                                </div>
                                <span className="psb-notification-count">{notifications.length}</span>
                            </div>

                            {notifications.length === 0 ? (
                                <div className="psb-notification-empty">
                                    <div className="psb-notification-empty-icon">
                                        <Icon name="bell" size={22} />
                                    </div>
                                    <strong>You're all caught up</strong>
                                    <p>No new applications or enquiries.</p>
                                </div>
                            ) : (
                                <div className="psb-notification-list">
                                    {notifications.map((item) => (
                                        <Link key={item.key} href={item.href} className="psb-notification-item">
                                            <span className="psb-notification-item-icon">
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
                <div className="psb-profile-wrap" data-psb-menu>
                    <button
                        type="button"
                        className={`psb-profile-button ${openMenu === "profile" ? "is-active" : ""}`}
                        onClick={() => toggle("profile")}
                        aria-expanded={openMenu === "profile"}
                    >
                        <div className="psb-avatar">{initials}</div>

                        <div className="psb-profile-info">
                            <strong>{displayName}</strong>
                            <span>{email || roleLabel}</span>
                        </div>
                    </button>

                    {openMenu === "profile" && (
                        <div className="psb-dropdown psb-profile-dropdown">
                            <div className="psb-profile-dropdown-header">
                                <div className="psb-avatar large">{initials}</div>
                                <div>
                                    <strong>{displayName}</strong>
                                    {email && <span>{email}</span>}
                                    <em className="psb-role-pill">{roleLabel}</em>
                                </div>
                            </div>

                            <div className="psb-dd-divider" />

                            <Link href={PSB_ROUTES.account} className="psb-dd-item">
                                <Icon name="user" size={18} />
                                <span>My Account</span>
                            </Link>

                            <Link href={PSB_ROUTES.activity} className="psb-dd-item">
                                <Icon name="activity" size={18} />
                                <span>My Activity Log</span>
                            </Link>

                            <div className="psb-dd-divider" />

                            <button type="button" className="psb-dd-item psb-logout-item" onClick={handleLogout}>
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
            return localStorage.getItem("psb-sidebar-collapsed") === "1";
        } catch {
            return false;
        }
    });
    const [mobileOpen, setMobileOpen] = useState(false);

    useEffect(() => {
        try {
            localStorage.setItem("psb-sidebar-collapsed", collapsed ? "1" : "0");
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
        <div className={`psb-shell ${collapsed ? "is-collapsed" : ""}`}>
            {/* floating toggle (small screens) */}
            <button
                type="button"
                className="psb-sidebar-toggle"
                onClick={() => setMobileOpen(true)}
                aria-label="Open menu"
            >
                <Icon name="menu" size={22} />
            </button>

            {mobileOpen && <div className="psb-overlay" onClick={() => setMobileOpen(false)} />}

            <PSBSidebar
                collapsed={collapsed}
                onToggleCollapse={() => setCollapsed((value) => !value)}
                mobileOpen={mobileOpen}
                onCloseMobile={() => setMobileOpen(false)}
            />

            <div className="psb-main">
                <PSBTopbar />
                <main className="psb-content">{children}</main>
            </div>
        </div>
    );
}

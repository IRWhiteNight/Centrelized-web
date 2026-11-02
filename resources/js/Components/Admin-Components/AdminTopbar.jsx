import { useEffect, useRef, useState } from "react";
import { Link, router, usePage } from "@inertiajs/react";
import { ROUTES, WORKSPACES, currentWorkspace } from "./adminRoutes";
import "../../../css/admin-css/admin-topbar.css";

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
        search: (
            <>
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-4-4" />
            </>
        ),
        bell: (
            <>
                <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
                <path d="M10 21h4" />
            </>
        ),
        grid: (
            <>
                <rect x="3" y="3" width="7" height="7" rx="1.5" />
                <rect x="14" y="3" width="7" height="7" rx="1.5" />
                <rect x="14" y="14" width="7" height="7" rx="1.5" />
                <rect x="3" y="14" width="7" height="7" rx="1.5" />
            </>
        ),
        down: <path d="m7 10 5 5 5-5" />,
        check: <path d="m5 12 5 5 9-10" />,
        back: <path d="M15 18 9 12l6-6" />,
        user: (
            <>
                <circle cx="12" cy="8" r="4" />
                <path d="M5 21a7 7 0 0 1 14 0" />
            </>
        ),
        settings: (
            <>
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-1.7 2.9-.2-.1a1.7 1.7 0 0 0-1.9.3l-.1.1h-3.4l-.1-.2a1.7 1.7 0 0 0-1.9-.3l-.2.1-2.9-1.7.1-.2a1.7 1.7 0 0 0-.3-1.9l-.1-.1v-3.4l.2-.1a1.7 1.7 0 0 0 .3-1.9l-.1-.2 1.7-2.9.2.1a1.7 1.7 0 0 0 1.9-.3l.1-.1h3.4l.1.2a1.7 1.7 0 0 0 1.9.3l.2-.1 2.9 1.7-.1.2a1.7 1.7 0 0 0 .3 1.9l.1.1z" />
            </>
        ),
        activity: <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />,
        logout: (
            <>
                <path d="M10 17l5-5-5-5" />
                <path d="M15 12H3" />
                <path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6" />
            </>
        ),
    };

    return <svg {...common}>{icons[name]}</svg>;
}

export default function AdminTopbar() {
    const { url, props } = usePage();
    const user = props.auth?.user;
    const workspace = currentWorkspace(url);
    const inSiteWorkspace = workspace.code !== "SUPER";

    // one of: "workspace" | "notifications" | "profile" | null
    const [openMenu, setOpenMenu] = useState(null);
    const [search, setSearch] = useState("");
    const searchRef = useRef(null);

    const toggle = (name) => setOpenMenu((current) => (current === name ? null : name));

    useEffect(() => {
        setOpenMenu(null);
    }, [url]);

    useEffect(() => {
        function handleOutsideClick(event) {
            if (!event.target.closest("[data-topbar-menu]")) {
                setOpenMenu(null);
            }
        }

        function handleKeys(event) {
            if (event.key === "Escape") {
                setOpenMenu(null);
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

    const displayName = user?.name || "Super Administrator";
    const email = user?.email || "admin@perlis-sandbox.com";
    const initials = displayName
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase();

    function handleLogout() {
        router.post(ROUTES.logout);
    }

    function handleSearch(event) {
        event.preventDefault();

        if (!search.trim()) return;

        // Search is currently a UI placeholder.
        // Connect this to your backend search route later.
        console.log("Search query:", search.trim());
    }

    return (
        <header className="admin-topbar">
            {/* LEFT: search */}
            <form className="topbar-search" onSubmit={handleSearch}>
                <Icon name="search" size={19} />

                <input
                    ref={searchRef}
                    type="search"
                    placeholder="Search users, sites, logs"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    aria-label="Search"
                />

                <kbd>⌘ K</kbd>
            </form>

            {/* RIGHT */}
            <div className="topbar-right">
                {/* Super Admin mode: shown while working inside a site */}
                {inSiteWorkspace && (
                    <div className="topbar-mode">
                        <span className="topbar-mode-label">
                            Super Admin mode · {workspace.short}
                        </span>
                        <Link href={ROUTES.dashboard} className="topbar-mode-back">
                            <Icon name="back" size={14} />
                            Console
                        </Link>
                    </div>
                )}

                {/* WORKSPACE SWITCHER */}
                <div className="topbar-action-wrapper" data-topbar-menu>
                    <button
                        type="button"
                        className={`topbar-workspace-button ${
                            openMenu === "workspace" ? "is-active" : ""
                        }`}
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
                                                <small>
                                                    {item.reserved
                                                        ? "Reserved for Phase 2"
                                                        : item.href}
                                                </small>
                                            </span>
                                            {selected && <Icon name="check" size={16} />}
                                        </>
                                    );

                                    if (item.reserved) {
                                        return (
                                            <div
                                                key={item.code}
                                                className="workspace-item is-reserved"
                                                aria-disabled="true"
                                            >
                                                {body}
                                            </div>
                                        );
                                    }

                                    return (
                                        <Link
                                            key={item.code}
                                            href={item.href}
                                            className={`workspace-item ${selected ? "is-selected" : ""}`}
                                            role="menuitem"
                                        >
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
                        className={`topbar-icon-button ${
                            openMenu === "notifications" ? "is-active" : ""
                        }`}
                        onClick={() => toggle("notifications")}
                        aria-label="Notifications"
                        aria-expanded={openMenu === "notifications"}
                    >
                        <Icon name="bell" size={19} />
                        <span className="notification-indicator" />
                    </button>

                    {openMenu === "notifications" && (
                        <div className="topbar-dropdown notification-dropdown">
                            <div className="dropdown-header">
                                <div>
                                    <h3>Notifications</h3>
                                    <p>Stay updated with your platform</p>
                                </div>
                                <span className="notification-count">0</span>
                            </div>

                            <div className="notification-empty">
                                <div className="notification-empty-icon">
                                    <Icon name="bell" size={22} />
                                </div>
                                <strong>You're all caught up</strong>
                                <p>No new notifications at the moment.</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* PROFILE */}
                <div className="topbar-profile-wrapper" data-topbar-menu>
                    <button
                        type="button"
                        className={`topbar-profile-button ${
                            openMenu === "profile" ? "is-active" : ""
                        }`}
                        onClick={() => toggle("profile")}
                        aria-expanded={openMenu === "profile"}
                    >
                        <div className="topbar-avatar">{initials}</div>

                        <div className="topbar-profile-info">
                            <strong>{displayName}</strong>
                            <span>{email}</span>
                        </div>
                    </button>

                    {openMenu === "profile" && (
                        <div className="topbar-dropdown profile-dropdown">
                            <div className="profile-dropdown-header">
                                <div className="topbar-avatar large">{initials}</div>
                                <div>
                                    <strong>{displayName}</strong>
                                    <span>{email}</span>
                                    <em className="role-pill">Super Admin</em>
                                </div>
                            </div>

                            <div className="dropdown-divider" />

                            <Link href={ROUTES.account} className="dropdown-item">
                                <Icon name="user" size={18} />
                                <span>My Account</span>
                            </Link>

                            <Link href={ROUTES.auditLogs} className="dropdown-item">
                                <Icon name="activity" size={18} />
                                <span>Audit Logs</span>
                            </Link>

                            <Link href={ROUTES.settings} className="dropdown-item">
                                <Icon name="settings" size={18} />
                                <span>System Settings</span>
                            </Link>

                            <div className="dropdown-divider" />

                            <button
                                type="button"
                                className="dropdown-item logout-item"
                                onClick={handleLogout}
                            >
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

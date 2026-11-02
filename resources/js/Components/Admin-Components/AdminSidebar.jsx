import { useState, useEffect } from "react";
import { Link, usePage } from "@inertiajs/react";
import { ROUTES, WORKSPACES, isPathActive } from "./adminRoutes";
import "../../../css/admin-css/admin-sidebar.css";

const Icon = ({ name, size = 19 }) => {
    const icons = {
        dashboard: (
            <>
                <rect x="3" y="3" width="7" height="7" rx="1.5" />
                <rect x="14" y="3" width="7" height="7" rx="1.5" />
                <rect x="14" y="14" width="7" height="7" rx="1.5" />
                <rect x="3" y="14" width="7" height="7" rx="1.5" />
            </>
        ),
        workspace: (
            <>
                <rect x="3" y="4" width="18" height="16" rx="2" />
                <path d="M3 10h18M9 4v6" />
            </>
        ),
        users: (
            <>
                <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="10" cy="7" r="4" />
                <path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
            </>
        ),
        shield: <path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11z" />,
        activity: <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />,
        lock: (
            <>
                <rect x="4" y="11" width="16" height="10" rx="2" />
                <path d="M8 11V7a4 4 0 0 1 8 0v4M12 15v2" />
            </>
        ),
        trash: (
            <>
                <path d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6" />
                <path d="M10 11v5M14 11v5" />
            </>
        ),
        settings: (
            <>
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-1.7 2.94-.08-.02a1.7 1.7 0 0 0-1.78.3l-.07.05h-3.4l-.04-.08a1.7 1.7 0 0 0-1.46-1.02h-.1l-2.94-1.7.02-.08a1.7 1.7 0 0 0-.3-1.78l-.05-.07v-3.4l.08-.04a1.7 1.7 0 0 0 1.02-1.46v-.1l1.7-2.94.08.02a1.7 1.7 0 0 0 1.78-.3l.07-.05h3.4l.04.08a1.7 1.7 0 0 0 1.46 1.02h.1l2.94 1.7-.02.08a1.7 1.7 0 0 0 .3 1.78l.05.07v3.4z" />
            </>
        ),
        user: (
            <>
                <circle cx="12" cy="8" r="4" />
                <path d="M5 21v-2a7 7 0 0 1 14 0v2" />
            </>
        ),
        logout: (
            <>
                <path d="M10 17l5-5-5-5M15 12H3" />
                <path d="M12 3h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-7" />
            </>
        ),
        menu: <path d="M4 6h16M4 12h16M4 18h16" />,
        close: <path d="M18 6 6 18M6 6l12 12" />,
        plane: (
            <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
        ),
    };

    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            {icons[name]}
        </svg>
    );
};

const psb = WORKSPACES.find((w) => w.code === "PSB");
const coeuas = WORKSPACES.find((w) => w.code === "COEUAS");
const vertiport = WORKSPACES.find((w) => w.code === "VERTIPORT");

// Every page of the Super Admin Console from the Site Map, in menu order.
const navigation = [
    {
        title: "OVERVIEW",
        items: [
            { label: "Dashboard", href: ROUTES.dashboard, icon: "dashboard", exact: true },
        ],
    },
    {
        title: "SITES",
        items: [
            { label: "Site Workspaces", href: ROUTES.workspaces, icon: "workspace" },
            { label: psb.short, href: psb.href, tone: psb.tone, child: true },
            { label: coeuas.short, href: coeuas.href, tone: coeuas.tone, child: true },
            {
                label: "Vertiport",
                href: vertiport.href,
                tone: vertiport.tone,
                child: true,
                reserved: true,
                badge: "Phase 2",
            },
        ],
    },
    {
        title: "ADMINISTRATION",
        items: [
            { label: "Admin Users", href: ROUTES.users, icon: "users" },
            { label: "Roles & Permissions", href: ROUTES.roles, icon: "shield" },
        ],
    },
    {
        title: "AUDIT & SECURITY",
        items: [
            { label: "Audit Logs", href: ROUTES.auditLogs, icon: "activity" },
            { label: "Security Events", href: ROUTES.securityEvents, icon: "lock" },
        ],
    },
    {
        title: "GOVERNANCE",
        items: [
            { label: "Content Trash", href: ROUTES.trash, icon: "trash" },
        ],
    },
    {
        title: "GENERAL",
        items: [
            { label: "System Settings", href: ROUTES.settings, icon: "settings" },
            { label: "My Account", href: ROUTES.account, icon: "user" },
        ],
    },
];

export default function AdminSidebar() {
    const [isOpen, setIsOpen] = useState(false);
    const { url } = usePage();

    useEffect(() => {
        setIsOpen(false);
    }, [url]);

    const renderItem = (item) => {
        const active = !item.reserved && isPathActive(url, item.href, item.exact);
        const classes = [
            "admin-nav-link",
            item.child ? "child" : "",
            active ? "active" : "",
            item.reserved ? "is-reserved" : "",
        ]
            .filter(Boolean)
            .join(" ");

        const content = (
            <>
                {active && <span className="admin-active-indicator" />}
                {item.icon ? (
                    <Icon name={item.icon} />
                ) : (
                    <span className={`admin-nav-dot tone-${item.tone}`} />
                )}
                <span>{item.label}</span>
                {item.badge && <span className="admin-nav-badge">{item.badge}</span>}
            </>
        );

        // Vertiport is reserved for Phase 2: shown, but not clickable.
        if (item.reserved) {
            return (
                <div
                    key={item.href}
                    className={classes}
                    aria-disabled="true"
                    title="Reserved for Phase 2"
                >
                    {content}
                </div>
            );
        }

        return (
            <Link key={item.href} href={item.href} className={classes}>
                {content}
            </Link>
        );
    };

    return (
        <>
            <button
                className="admin-mobile-toggle"
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Toggle sidebar"
            >
                <Icon name={isOpen ? "close" : "menu"} size={22} />
            </button>

            {isOpen && (
                <div
                    className="admin-sidebar-overlay"
                    onClick={() => setIsOpen(false)}
                />
            )}

            <aside className={`admin-sidebar ${isOpen ? "sidebar-open" : ""}`}>
                {/* BRAND */}
                <div className="admin-sidebar-brand">
                    <div className="admin-brand-logo">
                        <Icon name="plane" size={20} />
                    </div>
                    <div className="admin-brand-text">
                        <h2>Perlis Airspace</h2>
                        <span>Super Admin Console</span>
                    </div>
                </div>

                {/* NAVIGATION */}
                <nav className="admin-navigation" aria-label="Super Admin navigation">
                    {navigation.map((section) => (
                        <div className="admin-nav-section" key={section.title}>
                            <p className="admin-nav-heading">{section.title}</p>

                            {section.items.map(renderItem)}

                            {section.title === "GENERAL" && (
                                <Link
                                    href={ROUTES.logout}
                                    method="post"
                                    as="button"
                                    className="admin-nav-link admin-logout"
                                >
                                    <Icon name="logout" />
                                    <span>Sign Out</span>
                                </Link>
                            )}
                        </div>
                    ))}
                </nav>

                {/* BOTTOM CARD */}
                <div className="admin-sidebar-card">
                    <div className="admin-sidebar-card-status">
                        <span className="admin-status-indicator" />
                        System Online
                    </div>
                    <h3>Recent activity</h3>
                    <p>See who changed what across all sites.</p>
                    <Link href={ROUTES.auditLogs} className="admin-sidebar-card-button">
                        Open Audit Logs
                    </Link>
                </div>
            </aside>
        </>
    );
}

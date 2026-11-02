// Single source of truth for Super Admin routes.
// Paths follow the Site Map (section 2.1): Super Admin Console = /admin/super,
// PSB = /admin/psb, COE-UAS = /admin/coeuas, Vertiport = /admin/vertiport (Phase 2).
// If your Laravel routes differ, change them here only.

export const ROUTES = {
    dashboard: "/super-admin",
    workspaces: "/admin/super/workspaces",
    users: "/admin/super/users",
    roles: "/admin/super/permission",
    auditLogs: "/admin/super/audit-logs",
    securityEvents: "/admin/super/security-events",
    trash: "/admin/super/content-trash",
    settings: "/admin/super/system-settings",
    account: "/admin/super/account",
    logout: "/logout",
};

// The sites the Super Admin can open (sites table: PSB, COEUAS, VERTIPORT).
export const WORKSPACES = [
    {
        code: "SUPER",
        label: "Super Admin Console",
        short: "Super Admin",
        href: ROUTES.dashboard,
        tone: "super",
        reserved: false,
    },
    {
        code: "PSB",
        label: "PSB Workspace",
        short: "PSB",
        href: "/admin/psb",
        tone: "psb",
        reserved: false,
    },
    {
        code: "COEUAS",
        label: "COE-UAS Workspace",
        short: "COE-UAS",
        href: "/admin/coeuas",
        tone: "coeuas",
        reserved: false,
    },
    {
        code: "VERTIPORT",
        label: "Vertiport Malaysia",
        short: "Vertiport",
        href: "/admin/vertiport",
        tone: "vertiport",
        reserved: true, // Phase 2: role exists, login routes to 'Coming soon'
    },
];

export function cleanPath(url) {
    return url.split("?")[0].replace(/\/$/, "") || "/";
}

export function isPathActive(url, href, exact = false) {
    const path = cleanPath(url);
    if (exact) return path === href;
    return path === href || path.startsWith(`${href}/`);
}

export function currentWorkspace(url) {
    const path = cleanPath(url);
    return (
        WORKSPACES.find(
            (w) => w.code !== "SUPER" && (path === w.href || path.startsWith(`${w.href}/`))
        ) || WORKSPACES[0]
    );
}

import { Link, usePage } from "@inertiajs/react";
// Adjust this path to wherever you placed adminRoutes.js
import { ROUTES, WORKSPACES } from "../../Components/Admin-Components/adminRoutes";
import "../../../css/admin-css/admin-dashboard.css";

/* ------------------------------------------------------------------
   SAMPLE DATA
   Everything below is placeholder data so the page renders today.
   Have your controller return an Inertia prop named `dashboard` with
   the same shape and it replaces these defaults automatically:

   Inertia::render('Admin/SuperAdminDashboard', ['dashboard' => [...]])

   Source tables (from the ERD): users, sites, psb_applications,
   contact_enquiries, soft-deleted rows (deleted_at), audit_logs,
   login_attempts, posts / pages (status).
------------------------------------------------------------------- */
const defaultData = {
    stats: [
        {
            key: "users",
            title: "Admin Users",
            value: 7,
            chip: "+1",
            text: "added this month",
            href: ROUTES.users,
            primary: true,
        },
        {
            key: "sites",
            title: "Active Sites",
            value: 2,
            chip: "2 of 3",
            text: "Vertiport is reserved",
            href: ROUTES.workspaces,
        },
        {
            key: "review",
            title: "Awaiting Review",
            value: 13,
            chip: "New",
            text: "5 applications, 8 enquiries",
            href: "/admin/psb/applications",
        },
        {
            key: "trash",
            title: "Items in Trash",
            value: 9,
            chip: null,
            text: "Restore or purge permanently",
            href: ROUTES.trash,
        },
    ],

    // audit_logs entries per day, oldest first, last item = today
    activity: [
        { label: "M", count: 18 },
        { label: "T", count: 42 },
        { label: "W", count: 36 },
        { label: "T", count: 64 },
        { label: "F", count: 28 },
        { label: "S", count: 0 },
        { label: "S", count: 6 },
    ],

    attention: {
        headline: "5 applications waiting for review",
        detail: "PSB workspace, oldest received 3 days ago",
        href: "/admin/psb/applications",
        cta: "Review Applications",
        others: [
            { label: "New enquiries", value: 8, href: "/admin/psb" },
            { label: "Suspended accounts", value: 1, href: ROUTES.users },
            { label: "Scheduled posts", value: 3, href: ROUTES.workspaces },
        ],
    },

    sites: [
        { code: "PSB", name: "Perlis Airspace Sandbox", detail: "12 live, 3 drafts", status: "Live" },
        { code: "COEUAS", name: "COE-UAS", detail: "41 live, 6 drafts", status: "Live" },
        { code: "VERTIPORT", name: "Vertiport Malaysia", detail: "Reserved for Phase 2", status: "Reserved" },
    ],

    recent: [
        { user: "Aiman Hakim", action: "PUBLISH", verb: "Published", entity: "Open Call: BVLOS Trials", site: "PSB", time: "12 min ago" },
        { user: "Nur Sofea", action: "UPDATE", verb: "Updated", entity: "Member profile: Dr. Hafiz", site: "COE-UAS", time: "38 min ago" },
        { user: "Super Administrator", action: "RESTORE", verb: "Restored", entity: "News: Sandbox Launch", site: "PSB", time: "1 hr ago" },
        { user: "Farid Rahman", action: "UPDATE", verb: "Changed status of", entity: "Application PSB-2026-0042", site: "PSB", time: "2 hr ago" },
    ],

    // posts/pages by status across all sites (any numbers, shown as %)
    contentStatus: [
        { key: "published", label: "Published", value: 62 },
        { key: "draft", label: "Draft or scheduled", value: 25 },
        { key: "archived", label: "Archived", value: 13 },
    ],

    security: {
        failed: 3,
        successful: 148,
        suspended: 1,
        lastLogin: "Today, 08:42",
    },
};

/* ------------------------------ helpers ------------------------------ */

function Icon({ name, size = 18 }) {
    const icons = {
        plus: <path d="M12 5v14M5 12h14" />,
        arrow: <path d="M7 17 17 7M8 7h9v9" />,
        right: <path d="m9 6 6 6-6 6" />,
        shield: <path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11z" />,
        inbox: (
            <>
                <path d="M3 13h5l1 3h6l1-3h5" />
                <path d="M5 5h14l2 8v6H3v-6z" />
            </>
        ),
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

const initialsOf = (name) =>
    name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase();

const ACTION_PILL = {
    CREATE: "pill-create",
    UPDATE: "pill-update",
    PUBLISH: "pill-publish",
    DELETE: "pill-delete",
    RESTORE: "pill-restore",
};

const ACTION_LABEL = {
    CREATE: "Created",
    UPDATE: "Updated",
    PUBLISH: "Published",
    DELETE: "Deleted",
    RESTORE: "Restored",
};

/* ------------------------------ pieces ------------------------------- */

function StatCard({ stat }) {
    return (
        <article className={`dash-card stat-card ${stat.primary ? "is-primary" : ""}`}>
            <header>
                <h3>{stat.title}</h3>
                <Link
                    href={stat.href}
                    className="stat-arrow"
                    aria-label={`Open ${stat.title}`}
                >
                    <Icon name="arrow" size={16} />
                </Link>
            </header>

            <p className="stat-value">{stat.value}</p>

            <p className="stat-meta">
                {stat.chip && <span className="stat-chip">{stat.chip}</span>}
                <span>{stat.text}</span>
            </p>
        </article>
    );
}

function ActivityChart({ data }) {
    const counts = data.map((d) => d.count);
    const max = Math.max(...counts, 1);
    const total = counts.reduce((sum, n) => sum + n, 0);
    const peak = Math.max(...counts) > 0 ? counts.indexOf(Math.max(...counts)) : -1;
    const today = data.length - 1;

    return (
        <article className="dash-card chart-card">
            <header className="card-head">
                <div>
                    <h3>Audit Activity</h3>
                    <p className="card-sub">Logged actions across all sites, last 7 days</p>
                </div>
                <span className="chart-total">
                    <strong>{total}</strong> total
                </span>
            </header>

            <div className="chart-bars" role="list">
                {data.map((day, index) => {
                    const empty = day.count === 0;
                    const height = empty ? 100 : Math.max((day.count / max) * 100, 22);
                    const state = empty
                        ? "is-empty"
                        : index === peak
                        ? "is-peak"
                        : index === today
                        ? "is-today"
                        : "";

                    return (
                        <div
                            key={index}
                            className={`chart-slot ${index === today ? "show-tip" : ""}`}
                            role="listitem"
                            tabIndex={0}
                            aria-label={`${day.count} logged actions`}
                        >
                            {!empty && (
                                <span
                                    className="chart-tip"
                                    style={{ "--h": height / 100 }}
                                >
                                    {day.count}
                                </span>
                            )}
                            <span
                                className={`chart-bar ${state}`}
                                style={{ height: `${height}%` }}
                            />
                            <span className="chart-label">{day.label}</span>
                        </div>
                    );
                })}
            </div>
        </article>
    );
}

function AttentionCard({ data }) {
    return (
        <article className="dash-card attention-card">
            <header className="card-head">
                <h3>Needs attention</h3>
            </header>

            <p className="attention-headline">{data.headline}</p>
            <p className="attention-detail">{data.detail}</p>

            <ul className="attention-list">
                {data.others.map((item) => (
                    <li key={item.label}>
                        <Link href={item.href}>
                            <span>{item.label}</span>
                            <strong>{item.value}</strong>
                        </Link>
                    </li>
                ))}
            </ul>

            <Link href={data.href} className="btn-dark attention-cta">
                <Icon name="inbox" size={17} />
                {data.cta}
            </Link>
        </article>
    );
}

function SitesCard({ sites }) {
    return (
        <article className="dash-card sites-card">
            <header className="card-head">
                <h3>Site Workspaces</h3>
                <Link href={ROUTES.workspaces} className="btn-small">
                    Manage
                </Link>
            </header>

            <ul className="sites-list">
                {sites.map((site) => {
                    const meta = WORKSPACES.find((w) => w.code === site.code);
                    const reserved = meta?.reserved;
                    const body = (
                        <>
                            <span className={`site-logo tone-${meta?.tone}`}>
                                {site.code === "COEUAS" ? "CU" : site.code.slice(0, 2)}
                            </span>
                            <span className="site-text">
                                <strong>{site.name}</strong>
                                <small>{site.detail}</small>
                            </span>
                            <span className={`pill ${reserved ? "pill-reserved" : "pill-live"}`}>
                                {site.status}
                            </span>
                        </>
                    );

                    return (
                        <li key={site.code}>
                            {reserved ? (
                                <div className="site-row is-reserved" aria-disabled="true">
                                    {body}
                                </div>
                            ) : (
                                <Link href={meta.href} className="site-row">
                                    {body}
                                </Link>
                            )}
                        </li>
                    );
                })}
            </ul>
        </article>
    );
}

function RecentActivity({ items }) {
    return (
        <article className="dash-card recent-card">
            <header className="card-head">
                <h3>Recent Activity</h3>
                <Link href={ROUTES.auditLogs} className="btn-small">
                    View all
                </Link>
            </header>

            <ul className="recent-list">
                {items.map((item, index) => (
                    <li key={index} className="recent-row">
                        <span className={`recent-avatar avatar-${index % 3}`}>
                            {initialsOf(item.user)}
                        </span>

                        <span className="recent-text">
                            <strong>{item.user}</strong>
                            <small>
                                {item.verb} <b>{item.entity}</b>
                            </small>
                        </span>

                        <span className="recent-side">
                            <span className={`pill ${ACTION_PILL[item.action] || "pill-update"}`}>
                                {ACTION_LABEL[item.action] || item.action}
                            </span>
                            <small>
                                {item.site}, {item.time}
                            </small>
                        </span>
                    </li>
                ))}
            </ul>
        </article>
    );
}

function ContentGauge({ data }) {
    const total = data.reduce((sum, item) => sum + item.value, 0) || 1;
    const published = data.find((d) => d.key === "published");
    const publishedPct = Math.round(((published?.value || 0) / total) * 100);

    let offset = 0;
    const segments = data.map((item) => {
        const length = (item.value / total) * 100;
        const segment = { ...item, length, start: offset };
        offset += length;
        return segment;
    });

    return (
        <article className="dash-card gauge-card">
            <header className="card-head">
                <h3>Content Status</h3>
            </header>

            <div className="gauge">
                <svg viewBox="0 0 200 108" role="img" aria-label={`${publishedPct}% of content is published`}>
                    <defs>
                        <pattern
                            id="content-hatch"
                            width="6"
                            height="6"
                            patternUnits="userSpaceOnUse"
                            patternTransform="rotate(45)"
                        >
                            <rect width="6" height="6" fill="#ffffff" />
                            <line x1="0" y1="0" x2="0" y2="6" stroke="#c9cbc4" strokeWidth="2" />
                        </pattern>
                    </defs>

                    {segments.map((segment) => (
                        <path
                            key={segment.key}
                            d="M 18 100 A 82 82 0 0 1 182 100"
                            pathLength="100"
                            fill="none"
                            strokeWidth="30"
                            className={`gauge-seg seg-${segment.key}`}
                            strokeDasharray={`${Math.max(segment.length - 1.4, 0)} 100`}
                            strokeDashoffset={-(segment.start + 0.7)}
                        />
                    ))}
                </svg>

                <div className="gauge-center">
                    <strong>{publishedPct}%</strong>
                    <span>Published</span>
                </div>
            </div>

            <ul className="gauge-legend">
                {data.map((item) => (
                    <li key={item.key}>
                        <span className={`legend-dot dot-${item.key}`} />
                        {item.label}
                    </li>
                ))}
            </ul>
        </article>
    );
}

function SecurityCard({ data }) {
    return (
        <article className="dash-card security-card">
            <header className="card-head">
                <h3>Login Security</h3>
                <span className="security-window">24 hours</span>
            </header>

            <p className="security-value">{data.failed}</p>
            <p className="security-label">failed sign-ins</p>

            <dl className="security-stats">
                <div>
                    <dt>Successful</dt>
                    <dd>{data.successful}</dd>
                </div>
                <div>
                    <dt>Suspended</dt>
                    <dd>{data.suspended}</dd>
                </div>
            </dl>

            <p className="security-last">Last login {data.lastLogin}</p>

            <Link href={ROUTES.securityEvents} className="btn-yellow">
                <Icon name="shield" size={16} />
                View Security Events
            </Link>
        </article>
    );
}

/* ------------------------------- page -------------------------------- */

export default function SuperAdminDashboard() {
    const { props } = usePage();
    const data = { ...defaultData, ...(props.dashboard ?? {}) };

    return (
        <div className="admin-dashboard">
            <div className="dashboard-heading">
                <div>
                    <h1>Dashboard</h1>
                    <p>
                        Monitor every site, administrator account and logged action in one place.
                    </p>
                </div>

                <div className="dashboard-actions">
                    <Link href={ROUTES.users} className="btn-dark">
                        <span className="btn-plus">
                            <Icon name="plus" size={15} />
                        </span>
                        Add Admin User
                    </Link>
                    <Link href={ROUTES.auditLogs} className="btn-outline">
                        View Audit Logs
                    </Link>
                </div>
            </div>

            <div className="dashboard-grid">
                {data.stats.map((stat) => (
                    <StatCard key={stat.key} stat={stat} />
                ))}

                <ActivityChart data={data.activity} />
                <AttentionCard data={data.attention} />
                <SitesCard sites={data.sites} />

                <RecentActivity items={data.recent} />
                <ContentGauge data={data.contentStatus} />
                <SecurityCard data={data.security} />
            </div>
        </div>
    );
}

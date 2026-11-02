import { useEffect, useMemo, useState } from "react";
import { Head, Link, usePage } from "@inertiajs/react";
import { PSB_BASE, PSB_ROUTES } from "../../Components/Admin-PSB-Components/psbRoutes";
import "../../../css/admin-PSB-css/dashboard.css";

/* ------------------------------------------------------------------ */
/* DATA                                                                */
/* The controller should send  props.dashboard  with this shape.       */
/* Until it does, SAMPLE data is shown (and labelled "Sample data").   */
/* ------------------------------------------------------------------ */
const minutesAgo = (m) => new Date(Date.now() - m * 60000).toISOString();
const minutesAhead = (m) => new Date(Date.now() + m * 60000).toISOString();

const SAMPLE_DATA = {
    stats: {
        totalContent: 148,
        published: 126,
        updatedThisWeek: 9,
        newApplications: 4,
        totalApplications: 17,
        newEnquiries: 6,
        totalEnquiries: 31,
        drafts: 8,
        scheduled: 3,
        subscribers: 212,
        mediaFiles: 364,
    },
    weeklyActivity: [
        { day: "S", value: 0 },
        { day: "M", value: 7 },
        { day: "T", value: 4 },
        { day: "W", value: 11 },
        { day: "T", value: 0 },
        { day: "F", value: 0 },
        { day: "S", value: 0 },
    ],
    nextScheduled: {
        title: "Open call: First Responder Operations testing window",
        type: "Open Programmes and Calls",
        publishAt: minutesAhead(18 * 60),
        href: `${PSB_BASE}/opportunities/programmes`,
    },
    applications: [
        { id: 1, reference: "PSB-2026-0017", title: "Medical supply drone corridor trial", organisation: "Sample Org A", status: "submitted", at: minutesAgo(45) },
        { id: 2, reference: "PSB-2026-0016", title: "Search-and-rescue thermal imaging drill", organisation: "Sample Org B", status: "under_review", at: minutesAgo(60 * 20) },
        { id: 3, reference: "PSB-2026-0015", title: "Cargo logistics BVLOS demonstration", organisation: "Sample Org C", status: "info_requested", at: minutesAgo(60 * 52) },
        { id: 4, reference: "PSB-2026-0014", title: "Advanced air mobility flight test", organisation: "Sample Org D", status: "approved", at: minutesAgo(60 * 90) },
        { id: 5, reference: "PSB-2026-0013", title: "Crop monitoring survey flights", organisation: "Sample Org E", status: "executed", at: minutesAgo(60 * 130) },
    ],
    pipeline: { submitted: 4, under_review: 3, info_requested: 2, approved: 4, rejected: 1, executed: 2, closed: 1 },
    enquiries: [
        { id: 1, name: "Aisyah R.", subject: "Requirements to join a testing programme", organisation: "Sample University", status: "new", at: minutesAgo(25) },
        { id: 2, name: "Daniel T.", subject: "Access to airspace chart downloads", organisation: "Sample Aviation Sdn Bhd", status: "in_progress", at: minutesAgo(60 * 6) },
        { id: 3, name: "Nur Huda", subject: "Media visit request", organisation: "Sample Media", status: "replied", at: minutesAgo(60 * 28) },
        { id: 4, name: "Kevin L.", subject: "Partnership and collaboration", organisation: "Sample Tech Ltd", status: "new", at: minutesAgo(60 * 30) },
    ],
    modules: [
        { key: "home", label: "Home Page", published: 6, draft: 0, href: `${PSB_BASE}/home/banner` },
        { key: "about", label: "About the Sandbox", published: 14, draft: 1, href: `${PSB_BASE}/about/overview` },
        { key: "opportunities", label: "Opportunities", published: 22, draft: 3, href: `${PSB_BASE}/opportunities/ways` },
        { key: "services", label: "Services", published: 10, draft: 0, href: `${PSB_BASE}/services` },
        { key: "site", label: "Site Information", published: 18, draft: 1, href: `${PSB_BASE}/site-information/location` },
        { key: "media", label: "Media Centre", published: 49, draft: 3, href: `${PSB_BASE}/media-centre/news` },
        { key: "faq", label: "FAQ", published: 7, draft: 0, href: `${PSB_BASE}/faq/questions` },
    ],
    activity: [
        { id: 1, action: "published", module: "Media Centre", entity: "Project update: airspace survey completed", at: minutesAgo(35) },
        { id: 2, action: "updated", module: "Opportunities", entity: "Open Programmes and Calls", at: minutesAgo(60 * 3) },
        { id: 3, action: "created", module: "Site Information", entity: "Weather Information link", at: minutesAgo(60 * 22) },
        { id: 4, action: "updated", module: "Home Page", entity: "Main banner and slogan", at: minutesAgo(60 * 27) },
        { id: 5, action: "deleted", module: "FAQ", entity: "Outdated question (moved to Trash)", at: minutesAgo(60 * 49) },
    ],
    site: { status: "live", lastPublishedAt: minutesAgo(35), url: null },
};

/* ------------------------------------------------------------------ */
/* HELPERS                                                             */
/* ------------------------------------------------------------------ */
const APP_STATUS = {
    submitted: { label: "New", tone: "yellow" },
    under_review: { label: "In review", tone: "white" },
    info_requested: { label: "Info requested", tone: "outline" },
    approved: { label: "Approved", tone: "solid-white" },
    rejected: { label: "Rejected", tone: "muted" },
    executed: { label: "Executed", tone: "solid-white" },
    closed: { label: "Closed", tone: "muted" },
};

const ENQ_STATUS = {
    new: { label: "New", tone: "yellow" },
    in_progress: { label: "In progress", tone: "outline" },
    replied: { label: "Replied", tone: "white" },
    closed: { label: "Closed", tone: "muted" },
};

const ADD_CONTENT = [
    { label: "News / Project update", href: `${PSB_BASE}/media-centre/news/create` },
    { label: "Press release", href: `${PSB_BASE}/media-centre/press-releases/create` },
    { label: "Event or activity", href: `${PSB_BASE}/media-centre/events/create` },
    { label: "Programme or call", href: `${PSB_BASE}/opportunities/programmes/create` },
    { label: "FAQ question", href: `${PSB_BASE}/faq/questions/create` },
    { label: "Download or guideline", href: `${PSB_BASE}/site-information/downloads/create` },
];

function timeAgo(iso) {
    const diff = Math.max(0, Date.now() - new Date(iso).getTime());
    const min = Math.floor(diff / 60000);
    if (min < 1) return "just now";
    if (min < 60) return `${min} min ago`;
    const hours = Math.floor(min / 60);
    if (hours < 24) return `${hours} h ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? "s" : ""} ago`;
}

function formatWhen(iso) {
    return new Intl.DateTimeFormat("en-MY", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
    }).format(new Date(iso));
}

function elapsed(iso, now) {
    const total = Math.max(0, Math.floor((now - new Date(iso).getTime()) / 1000));
    const d = Math.floor(total / 86400);
    const h = String(Math.floor((total % 86400) / 3600)).padStart(2, "0");
    const m = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
    const s = String(total % 60).padStart(2, "0");
    return `${d > 0 ? `${d}d ` : ""}${h}:${m}:${s}`;
}

const initialsOf = (name = "") =>
    name.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase() || "?";

/* ------------------------------------------------------------------ */
/* ICONS                                                               */
/* ------------------------------------------------------------------ */
function Icon({ name, size = 18 }) {
    const common = {
        width: size,
        height: size,
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: 1.9,
        strokeLinecap: "round",
        strokeLinejoin: "round",
        "aria-hidden": true,
    };

    const icons = {
        arrow: (<><path d="M7 17 17 7" /><path d="M8 7h9v9" /></>),
        plus: <path d="M12 5v14M5 12h14" />,
        down: <path d="m7 10 5 5 5-5" />,
        external: (<><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><path d="M10 14 21 3" /></>),
        clock: (<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>),
        file: (<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><path d="M8 13h8M8 17h8" /></>),
        mail: (<><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-10 6L2 7" /></>),
        eye: (<><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></>),
        refresh: (<><path d="M21 12a9 9 0 1 1-3-6.7" /><polyline points="21 3 21 9 15 9" /></>),
        trend: (<><polyline points="3 17 9 11 13 15 21 7" /><polyline points="15 7 21 7 21 13" /></>),
        users: (<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>),
        image: (<><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" /></>),
        edit: (<><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></>),
        trash: (<><path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="M19 6l-1 14H6L5 6" /></>),
        check: <path d="m5 12 5 5 9-10" />,
        globe: (<><circle cx="12" cy="12" r="9" /><path d="M3 12h18" /><path d="M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18z" /></>),
    };

    return <svg {...common}>{icons[name]}</svg>;
}

function Chip({ tone, children }) {
    return <span className={`psbd-chip tone-${tone}`}>{children}</span>;
}

function CardHead({ title, subtitle, action }) {
    return (
        <div className="psbd-card-head">
            <div>
                <h2>{title}</h2>
                {subtitle && <p>{subtitle}</p>}
            </div>
            {action}
        </div>
    );
}

function PillLink({ href, icon, children }) {
    return (
        <Link href={href} className="psbd-pill-link">
            {icon && <Icon name={icon} size={14} />}
            {children}
        </Link>
    );
}

/* ------------------------------------------------------------------ */
/* WIDGETS                                                             */
/* ------------------------------------------------------------------ */
function StatCard({ title, value, note, href, highlight, icon }) {
    return (
        <article className={`psbd-card psbd-stat ${highlight ? "is-highlight" : ""}`}>
            <div className="psbd-stat-top">
                <h3>{title}</h3>
                <Link href={href} className="psbd-round-link" aria-label={`Open ${title}`}>
                    <Icon name="arrow" size={17} />
                </Link>
            </div>
            <strong className="psbd-stat-value">{value}</strong>
            <p className="psbd-stat-note">
                <span className="psbd-stat-note-icon"><Icon name={icon} size={12} /></span>
                {note}
            </p>
        </article>
    );
}

function ActivityBars({ data }) {
    const max = Math.max(1, ...data.map((d) => d.value));
    const peakIndex = data.findIndex((d) => d.value === max && d.value > 0);
    const todayIndex = new Date().getDay();
    const total = data.reduce((sum, d) => sum + d.value, 0);

    return (
        <article className="psbd-card psbd-analytics">
            <CardHead title="Content Activity" subtitle={`${total} edits this week`} />

            <div className="psbd-bars" role="img" aria-label="Content edits per day this week">
                {data.map((d, i) => {
                    const ratio = d.value / max;
                    const level = d.value === 0 ? "none" : ratio >= 0.7 ? "high" : ratio >= 0.35 ? "mid" : "low";
                    const height = d.value === 0 ? 52 : 28 + ratio * 72;

                    return (
                        <div className="psbd-bar-col" key={`${d.day}-${i}`}>
                            <div className="psbd-bar-track">
                                {i === peakIndex && <span className="psbd-bar-tip">{d.value} edits</span>}
                                <div className={`psbd-bar level-${level}`} style={{ height: `${height}%` }} />
                            </div>
                            <span className={`psbd-bar-day ${i === todayIndex ? "is-today" : ""}`}>{d.day}</span>
                        </div>
                    );
                })}
            </div>
        </article>
    );
}

function ScheduledCard({ item }) {
    return (
        <article className="psbd-card psbd-reminder">
            <CardHead title="Next Scheduled Publication" />

            {item ? (
                <>
                    <h3 className="psbd-reminder-title">{item.title}</h3>
                    <p className="psbd-reminder-meta">
                        {item.type} · {formatWhen(item.publishAt)}
                    </p>
                    <Link href={item.href} className="psbd-primary-button wide">
                        <Icon name="eye" size={17} />
                        Open item
                    </Link>
                </>
            ) : (
                <>
                    <h3 className="psbd-reminder-title muted">Nothing scheduled</h3>
                    <p className="psbd-reminder-meta">Schedule a post to publish it automatically.</p>
                    <Link href={`${PSB_BASE}/media-centre/news/create`} className="psbd-primary-button wide">
                        <Icon name="plus" size={17} />
                        Schedule publication
                    </Link>
                </>
            )}
        </article>
    );
}

function ApplicationList({ items }) {
    return (
        <article className="psbd-card psbd-list-card">
            <CardHead title="Applications" action={<PillLink href={PSB_ROUTES.applications}>View all</PillLink>} />

            {items.length === 0 ? (
                <p className="psbd-empty">No applications yet.</p>
            ) : (
                <ul className="psbd-rows">
                    {items.slice(0, 5).map((app) => {
                        const status = APP_STATUS[app.status] || APP_STATUS.submitted;
                        return (
                            <li key={app.id}>
                                <Link href={`${PSB_ROUTES.applications}/${app.id}`} className="psbd-row">
                                    <span className={`psbd-row-icon tone-${status.tone}`}><Icon name="file" size={16} /></span>
                                    <span className="psbd-row-text">
                                        <strong>{app.title}</strong>
                                        <small>{app.reference} · {timeAgo(app.at)}</small>
                                    </span>
                                    <Chip tone={status.tone}>{status.label}</Chip>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            )}
        </article>
    );
}

function EnquiryList({ items }) {
    return (
        <article className="psbd-card psbd-enquiries">
            <CardHead
                title="General Enquiries"
                subtitle="Latest messages from the Contact Us form"
                action={<PillLink href={PSB_ROUTES.enquiries} icon="mail">Open inbox</PillLink>}
            />

            {items.length === 0 ? (
                <p className="psbd-empty">No enquiries yet.</p>
            ) : (
                <ul className="psbd-people">
                    {items.slice(0, 4).map((enq, index) => {
                        const status = ENQ_STATUS[enq.status] || ENQ_STATUS.new;
                        return (
                            <li key={enq.id}>
                                <Link href={`${PSB_ROUTES.enquiries}/${enq.id}`} className="psbd-person">
                                    <span className={`psbd-avatar v${index % 4}`}>{initialsOf(enq.name)}</span>
                                    <span className="psbd-person-text">
                                        <strong>{enq.name}</strong>
                                        <small>
                                            About <b>{enq.subject}</b> · {enq.organisation}
                                        </small>
                                    </span>
                                    <span className="psbd-person-side">
                                        <Chip tone={status.tone}>{status.label}</Chip>
                                        <small>{timeAgo(enq.at)}</small>
                                    </span>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            )}
        </article>
    );
}

function arcPath(cx, cy, r, from, to) {
    const point = (f) => {
        const a = Math.PI + Math.PI * f;
        return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
    };
    const [x0, y0] = point(from);
    const [x1, y1] = point(to);
    return `M ${x0.toFixed(2)} ${y0.toFixed(2)} A ${r} ${r} 0 0 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`;
}

function PipelineCard({ pipeline }) {
    const decided = (pipeline.approved || 0) + (pipeline.rejected || 0) + (pipeline.executed || 0) + (pipeline.closed || 0);
    const review = (pipeline.under_review || 0) + (pipeline.info_requested || 0);
    const fresh = pipeline.submitted || 0;
    const total = decided + review + fresh;
    const pct = total ? Math.round((decided / total) * 100) : 0;

    const gap = 0.025;
    const segments = [];
    let cursor = 0;
    [
        { key: "decided", value: decided, className: "seg-decided" },
        { key: "review", value: review, className: "seg-review" },
        { key: "fresh", value: fresh, className: "seg-fresh" },
    ].forEach((seg) => {
        if (!seg.value || !total) return;
        const size = seg.value / total;
        const from = cursor + (cursor === 0 ? 0 : gap / 2);
        const to = cursor + size - gap / 2;
        if (to > from) segments.push({ ...seg, d: arcPath(120, 118, 92, from, to) });
        cursor += size;
    });

    return (
        <article className="psbd-card psbd-pipeline">
            <CardHead title="Application Pipeline" />

            <div className="psbd-gauge">
                <svg viewBox="0 0 240 132" role="img" aria-label={`${pct}% of applications decided`}>
                    <defs>
                        <pattern id="psbd-hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                            <rect width="8" height="8" fill="#1d1d1d" />
                            <line x1="0" y1="0" x2="0" y2="8" stroke="#6b6b66" strokeWidth="3" />
                        </pattern>
                    </defs>
                    <path d={arcPath(120, 118, 92, 0, 1)} className="gauge-track" />
                    {segments.map((seg) => (
                        <path key={seg.key} d={seg.d} className={`gauge-seg ${seg.className}`} />
                    ))}
                </svg>

                <div className="psbd-gauge-center">
                    <strong>{pct}%</strong>
                    <span>Decided</span>
                </div>
            </div>

            <ul className="psbd-legend">
                <li><i className="dot decided" />Decided<b>{decided}</b></li>
                <li><i className="dot review" />In review<b>{review}</b></li>
                <li><i className="dot fresh" />New<b>{fresh}</b></li>
            </ul>
        </article>
    );
}

function SiteCard({ site, publicUrl }) {
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        const id = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(id);
    }, []);

    const url = publicUrl || site.url;

    return (
        <article className="psbd-card psbd-site">
            <svg className="psbd-site-art" viewBox="0 0 300 160" aria-hidden="true">
                {[28, 48, 68, 88, 108, 128, 148].map((r, i) => (
                    <ellipse key={r} cx="220" cy="140" rx={r * 1.7} ry={r * 0.85} fill="none" stroke="#facc15" strokeOpacity={0.5 - i * 0.055} strokeWidth="1.4" />
                ))}
            </svg>

            <div className="psbd-site-head">
                <h2>Public Website</h2>
                <span className={`psbd-live ${site.status === "live" ? "is-live" : ""}`}>
                    <i />{site.status === "live" ? "Live" : "Offline"}
                </span>
            </div>

            <p className="psbd-site-label">Time since last publish</p>
            <div className="psbd-timer">
                {site.lastPublishedAt ? elapsed(site.lastPublishedAt, now) : "--:--:--"}
            </div>

            <div className="psbd-site-actions">
                {url ? (
                    <a href={url} target="_blank" rel="noreferrer" className="psbd-round-button yellow" aria-label="View public website" title="View public website">
                        <Icon name="external" size={19} />
                    </a>
                ) : (
                    <span className="psbd-round-button yellow is-disabled" aria-disabled="true" title="Public URL not set">
                        <Icon name="globe" size={19} />
                    </span>
                )}
                <Link href={`${PSB_BASE}/media-centre/news`} className="psbd-round-button white" aria-label="Review latest posts" title="Review latest posts">
                    <Icon name="refresh" size={19} />
                </Link>
            </div>
        </article>
    );
}

function ModulesCard({ modules, stats }) {
    return (
        <article className="psbd-card psbd-modules">
            <CardHead
                title="Content by Module"
                subtitle="Published items and drafts on each public page"
                action={
                    <span className="psbd-legend-inline">
                        <i className="dot decided" />Published
                        <i className="dot draft" />Draft
                    </span>
                }
            />

            <ul className="psbd-module-list">
                {modules.map((m) => {
                    const total = Math.max(1, m.published + m.draft);
                    return (
                        <li key={m.key}>
                            <Link href={m.href} className="psbd-module">
                                <span className="psbd-module-name">{m.label}</span>
                                <span className="psbd-module-bar">
                                    <i className="pub" style={{ width: `${(m.published / total) * 100}%` }} />
                                    <i className="draft" style={{ width: `${(m.draft / total) * 100}%` }} />
                                </span>
                                <span className="psbd-module-count">
                                    <b>{m.published}</b>{m.draft > 0 && <em>+{m.draft}</em>}
                                </span>
                            </Link>
                        </li>
                    );
                })}
            </ul>

            <div className="psbd-mini-stats">
                <Link href={`${PSB_BASE}/subscribers`} className="psbd-mini-stat">
                    <Icon name="users" size={16} />
                    <b>{stats.subscribers}</b><span>Subscribers</span>
                </Link>
                <Link href={`${PSB_BASE}/media-library`} className="psbd-mini-stat">
                    <Icon name="image" size={16} />
                    <b>{stats.mediaFiles}</b><span>Media files</span>
                </Link>
                <Link href={PSB_ROUTES.applications} className="psbd-mini-stat">
                    <Icon name="file" size={16} />
                    <b>{stats.totalApplications}</b><span>Applications</span>
                </Link>
            </div>
        </article>
    );
}

const ACTION_META = {
    created: { label: "Created", icon: "plus" },
    updated: { label: "Updated", icon: "edit" },
    published: { label: "Published", icon: "check" },
    deleted: { label: "Moved to Trash", icon: "trash" },
};

function ActivityCard({ items }) {
    return (
        <article className="psbd-card psbd-activity">
            <CardHead
                title="My Recent Activity"
                subtitle="Your latest changes, also kept in the audit log"
                action={<PillLink href={PSB_ROUTES.activity} icon="clock">Full log</PillLink>}
            />

            {items.length === 0 ? (
                <p className="psbd-empty">No activity yet.</p>
            ) : (
                <ol className="psbd-timeline">
                    {items.slice(0, 6).map((item) => {
                        const meta = ACTION_META[item.action] || ACTION_META.updated;
                        return (
                            <li key={item.id}>
                                <span className="psbd-timeline-icon"><Icon name={meta.icon} size={14} /></span>
                                <div>
                                    <p>
                                        <b>{meta.label}</b> · {item.module}
                                    </p>
                                    <span>{item.entity}</span>
                                </div>
                                <time>{timeAgo(item.at)}</time>
                            </li>
                        );
                    })}
                </ol>
            )}
        </article>
    );
}

/* ------------------------------------------------------------------ */
/* PAGE                                                                */
/* ------------------------------------------------------------------ */
export default function AdminPSBDashboard() {
    const { props } = usePage();
    const isSample = !props.dashboard;
    const data = props.dashboard ?? SAMPLE_DATA;
    const { stats } = data;
    const publicUrl = props.psb?.publicUrl || data.site?.url || null;

    const [addOpen, setAddOpen] = useState(false);

    useEffect(() => {
        const close = (event) => {
            if (!event.target.closest("[data-psbd-add]")) setAddOpen(false);
        };
        const onKey = (event) => event.key === "Escape" && setAddOpen(false);
        document.addEventListener("mousedown", close);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("mousedown", close);
            document.removeEventListener("keydown", onKey);
        };
    }, []);

    const unpublished = useMemo(() => stats.drafts + stats.scheduled, [stats]);

    return (
        <>
            <Head title="PSB Dashboard" />

            <section className="psbd">
                {/* HEADER */}
                <header className="psbd-header">
                    <div>
                        <h1>Dashboard</h1>
                        <p>
                            Manage Perlis Airspace Sandbox content, applications and enquiries.
                            {isSample && <span className="psbd-sample">Sample data</span>}
                        </p>
                    </div>

                    <div className="psbd-header-actions">
                        <div className="psbd-add" data-psbd-add>
                            <button
                                type="button"
                                className="psbd-primary-button"
                                onClick={() => setAddOpen((v) => !v)}
                                aria-expanded={addOpen}
                                aria-haspopup="menu"
                            >
                                <Icon name="plus" size={18} />
                                Add Content
                                <Icon name="down" size={15} />
                            </button>

                            {addOpen && (
                                <div className="psbd-menu" role="menu">
                                    {ADD_CONTENT.map((item) => (
                                        <Link key={item.href} href={item.href} className="psbd-menu-item" role="menuitem">
                                            <Icon name="plus" size={15} />
                                            {item.label}
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>

                        {publicUrl ? (
                            <a href={publicUrl} target="_blank" rel="noreferrer" className="psbd-outline-button">
                                View Public Site
                            </a>
                        ) : (
                            <Link href={`${PSB_BASE}/settings/navigation`} className="psbd-outline-button">
                                Site Settings
                            </Link>
                        )}
                    </div>
                </header>

                {/* STAT CARDS */}
                <div className="psbd-grid">
                    <StatCard
                        highlight
                        title="Total Content Items"
                        value={stats.totalContent}
                        icon="trend"
                        note={`${stats.published} published · ${stats.updatedThisWeek} updated this week`}
                        href={`${PSB_BASE}/media-centre/news`}
                    />
                    <StatCard
                        title="New Applications"
                        value={stats.newApplications}
                        icon="file"
                        note="Waiting for review"
                        href={PSB_ROUTES.applications}
                    />
                    <StatCard
                        title="New Enquiries"
                        value={stats.newEnquiries}
                        icon="mail"
                        note={`${stats.totalEnquiries} in the general inbox`}
                        href={PSB_ROUTES.enquiries}
                    />
                    <StatCard
                        title="Drafts & Scheduled"
                        value={unpublished}
                        icon="clock"
                        note={`${stats.drafts} drafts · ${stats.scheduled} scheduled`}
                        href={`${PSB_BASE}/media-centre/news`}
                    />

                    {/* ROW 2 */}
                    <ActivityBars data={data.weeklyActivity} />
                    <ScheduledCard item={data.nextScheduled} />
                    <ApplicationList items={data.applications} />

                    {/* ROW 3 */}
                    <EnquiryList items={data.enquiries} />
                    <PipelineCard pipeline={data.pipeline} />
                    <SiteCard site={data.site} publicUrl={publicUrl} />

                    {/* ROW 4 */}
                    <ModulesCard modules={data.modules} stats={stats} />
                    <ActivityCard items={data.activity} />
                </div>
            </section>
        </>
    );
}

// Inertia persistent layout: sidebar + topbar stay mounted between pages.

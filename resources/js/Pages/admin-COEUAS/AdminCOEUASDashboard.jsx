import { useEffect, useMemo, useState } from "react";
import { Head, Link, usePage } from "@inertiajs/react";
import NavigationBar from "../../Components/Admin-COEUAS-Components/NavigationBar";
import { COEUAS_BASE, COEUAS_ROUTES } from "../../Components/Admin-COEUAS-Components/COEUASRoutes";
import "../../../css/admin-COEUAS-css/dashboard.css";

/* ------------------------------------------------------------------ */
/* DATA                                                                */
/* The controller should send  props.dashboard  with this shape.       */
/* Until it does, SAMPLE data is shown (and labelled "Sample data").   */
/*                                                                     */
/* Source: Admin CMS design document, COE-UAS dashboard (site map 1.3):*/
/*   "Content counts, drafts, scheduled items / New enquiries /        */
/*    My recent activity"                                              */
/* plus the COE-UAS tables in ERD-3 and ERD-6 to ERD-9.                */
/* ------------------------------------------------------------------ */
const BASE = COEUAS_BASE;
const minutesAgo = (m) => new Date(Date.now() - m * 60000).toISOString();
const minutesAhead = (m) => new Date(Date.now() + m * 60000).toISOString();

const SAMPLE_DATA = {
    stats: {
        totalContent: 326, // all content records on the public site
        published: 309,
        updatedThisWeek: 12,
        activeMembers: 24, // members.status = active
        newEnquiries: 5, // contact_enquiries.status = new
        totalEnquiries: 38,
        drafts: 17,
        scheduled: 3, // posts.status = scheduled
        mediaFiles: 512,
    },
    weeklyActivity: [
        { day: "S", value: 0 },
        { day: "M", value: 9 },
        { day: "T", value: 5 },
        { day: "W", value: 14 },
        { day: "T", value: 0 },
        { day: "F", value: 0 },
        { day: "S", value: 0 },
    ],
    nextScheduled: {
        title: "Sample: Annual research highlights announcement",
        type: "News and activities",
        publishAt: minutesAhead(20 * 60),
        href: `${BASE}/engagement/news`,
    },
    // training_sessions joined to training_courses
    sessions: [
        { id: 1, title: "Drone operations course", startDate: minutesAhead(60 * 24 * 6), venue: "Sample venue A", seats: 20, status: "open" },
        { id: 2, title: "Industry agency briefing", startDate: minutesAhead(60 * 24 * 13), venue: "Sample venue B", seats: 12, status: "open" },
        { id: 3, title: "Outreach workshop", startDate: minutesAhead(60 * 24 * 20), venue: "Sample venue C", seats: 30, status: "full" },
        { id: 4, title: "Drone operations course", startDate: minutesAhead(60 * 24 * 41), venue: "Sample venue A", seats: 20, status: "closed" },
    ],
    // contact_enquiries (enquiry_type: general | research_collab | training_services)
    enquiries: [
        { id: 1, name: "Aisyah R.", type: "research_collab", subject: "Joint research on UAS navigation", organisation: "Sample University", status: "new", at: minutesAgo(25) },
        { id: 2, name: "Daniel T.", type: "training_services", subject: "Group booking for a training course", organisation: "Sample Aviation Sdn Bhd", status: "in_progress", at: minutesAgo(60 * 6) },
        { id: 3, name: "Nur Huda", type: "general", subject: "Centre visit request", organisation: "Sample Media", status: "replied", at: minutesAgo(60 * 28) },
        { id: 4, name: "Kevin L.", type: "research_collab", subject: "Industry challenge collaboration", organisation: "Sample Tech Ltd", status: "new", at: minutesAgo(60 * 30) },
    ],
    // research_projects.status: proposed | ongoing | completed
    projects: { completed: 12, ongoing: 9, proposed: 4 },
    site: { status: "live", lastPublishedAt: minutesAgo(35), url: null },
    modules: [
        { key: "home", label: "Home Page", published: 5, draft: 0, href: `${BASE}/home/banner` },
        { key: "about", label: "About", published: 14, draft: 1, href: `${BASE}/about/overview` },
        { key: "people", label: "People", published: 58, draft: 2, href: `${BASE}/people/members` },
        { key: "research", label: "Research and Innovation", published: 41, draft: 4, href: `${BASE}/research/groups` },
        { key: "publications", label: "Publications and Impact", published: 126, draft: 6, href: `${BASE}/publications` },
        { key: "facilities", label: "Facilities and Services", published: 18, draft: 1, href: `${BASE}/facilities/equipment` },
        { key: "engagement", label: "Engagement", published: 47, draft: 3, href: `${BASE}/engagement/linkages` },
    ],
    // publications.pub_type counts (published only) and drafts
    publications: {
        journal: 64,
        conference: 38,
        book: 4,
        chapter: 9,
        report: 7,
        other: 4,
        drafts: 6,
    },
    // one number per COE-UAS record type (ERD-6 to ERD-9)
    glance: {
        members: 24,
        postgraduate: 31,
        postdoctoral: 6,
        groups: 5,
        grants: 9,
        innovations: 14,
        opportunities: 4,
        publications: 126,
        facilities: 11,
        training: 8,
        linkages: 17,
        affiliations: 6,
    },
    activity: [
        { id: 1, action: "published", module: "Engagement", entity: "News: Centre hosts industry day", at: minutesAgo(35) },
        { id: 2, action: "updated", module: "People", entity: "Member profile: Sample Member", at: minutesAgo(60 * 3) },
        { id: 3, action: "created", module: "Publications and Impact", entity: "Journal article (bulk import)", at: minutesAgo(60 * 22) },
        { id: 4, action: "updated", module: "Home Page", entity: "Main banner and introduction", at: minutesAgo(60 * 27) },
        { id: 5, action: "deleted", module: "Facilities and Services", entity: "Outdated equipment entry (moved to Trash)", at: minutesAgo(60 * 49) },
    ],
};

/* ------------------------------------------------------------------ */
/* HELPERS                                                             */
/* ------------------------------------------------------------------ */
const ENQ_STATUS = {
    new: { label: "New", tone: "yellow" },
    in_progress: { label: "In progress", tone: "outline" },
    replied: { label: "Replied", tone: "white" },
    closed: { label: "Closed", tone: "muted" },
};

const ENQ_TYPE = {
    general: "General",
    research_collab: "Research collaboration",
    training_services: "Training and services",
};

const SESSION_STATUS = {
    open: { label: "Open", tone: "yellow" },
    full: { label: "Full", tone: "white" },
    closed: { label: "Closed", tone: "muted" },
};

const PUB_TYPES = [
    { key: "journal", label: "Journal" },
    { key: "conference", label: "Conference" },
    { key: "chapter", label: "Chapter" },
    { key: "report", label: "Report" },
    { key: "book", label: "Book" },
    { key: "other", label: "Other" },
];

// Where each "at a glance" tile opens, and how it is described.
const GLANCE = [
    { key: "members", label: "Active members", icon: "users", href: `${BASE}/people/members` },
    { key: "postgraduate", label: "Current students", icon: "cap", href: `${BASE}/people/postgraduate` },
    { key: "postdoctoral", label: "Postdoctoral researchers", icon: "user", href: `${BASE}/people/postdoctoral` },
    { key: "groups", label: "Research groups", icon: "flask", href: `${BASE}/research/groups` },
    { key: "grants", label: "Ongoing grants", icon: "coin", href: `${BASE}/research/grants` },
    { key: "innovations", label: "Innovations and IP", icon: "bulb", href: `${BASE}/research/innovation` },
    { key: "opportunities", label: "Open opportunities", icon: "target", href: `${BASE}/research/opportunities` },
    { key: "publications", label: "Publications", icon: "book", href: `${BASE}/publications` },
    { key: "facilities", label: "Facilities", icon: "building", href: `${BASE}/facilities/equipment` },
    { key: "training", label: "Training courses", icon: "calendar", href: `${BASE}/facilities/training` },
    { key: "linkages", label: "Network linkages", icon: "link", href: `${BASE}/engagement/linkages` },
    { key: "affiliations", label: "Affiliations", icon: "globe", href: `${BASE}/engagement/affiliations` },
];

const ADD_CONTENT = [
    { label: "News or activity", href: `${BASE}/engagement/news/create` },
    { label: "Member profile", href: `${BASE}/people/members/create` },
    { label: "Publication", href: `${BASE}/publications/create` },
    { label: "Research project", href: `${BASE}/research/projects/create` },
    { label: "Innovation or IP", href: `${BASE}/research/innovation/create` },
    { label: "Training course", href: `${BASE}/facilities/training/create` },
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

function formatDay(iso) {
    return new Intl.DateTimeFormat("en-MY", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(iso));
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
        user: (<><circle cx="12" cy="8" r="4" /><path d="M5 21a7 7 0 0 1 14 0" /></>),
        cap: (<><path d="m22 10-10-5-10 5 10 5z" /><path d="M6 12v5c3 2 9 2 12 0v-5" /></>),
        flask: (<><path d="M9 3h6" /><path d="M10 3v6L4.5 19a1.5 1.5 0 0 0 1.3 2.2h12.4a1.5 1.5 0 0 0 1.3-2.2L14 9V3" /><path d="M7.5 14h9" /></>),
        coin: (<><circle cx="12" cy="12" r="9" /><path d="M14.5 9.5A2.5 2 0 0 0 12 8c-1.4 0-2.5.8-2.5 2s1.1 1.7 2.5 2 2.5.8 2.5 2-1.1 2-2.5 2a2.5 2 0 0 1-2.5-1.5M12 6v2M12 16v2" /></>),
        bulb: (<><path d="M9 18h6M10 21h4" /><path d="M12 3a6 6 0 0 0-4 10.5c.8.8 1 1.5 1 2.5h6c0-1 .2-1.7 1-2.5A6 6 0 0 0 12 3z" /></>),
        target: (<><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1" /></>),
        book: (<><path d="M4 5a2 2 0 0 1 2-2h14v16H6a2 2 0 0 0-2 2z" /><path d="M4 19V5" /><path d="M9 7h7M9 11h7" /></>),
        building: (<><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M9 21v-4h6v4" /><path d="M8 7h.01M12 7h.01M16 7h.01M8 11h.01M12 11h.01M16 11h.01" /></>),
        calendar: (<><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M3 9h18M8 2v4M16 2v4" /></>),
        link: (<><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" /><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" /></>),
        image: (<><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" /></>),
        edit: (<><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></>),
        trash: (<><path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="M19 6l-1 14H6L5 6" /></>),
        check: <path d="m5 12 5 5 9-10" />,
        globe: (<><circle cx="12" cy="12" r="9" /><path d="M3 12h18" /><path d="M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18z" /></>),
    };

    return <svg {...common}>{icons[name]}</svg>;
}

function Chip({ tone, children }) {
    return <span className={`cud-chip tone-${tone}`}>{children}</span>;
}

function CardHead({ title, subtitle, action }) {
    return (
        <div className="cud-card-head">
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
        <Link href={href} className="cud-pill-link">
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
        <article className={`cud-card cud-stat ${highlight ? "is-highlight" : ""}`}>
            <div className="cud-stat-top">
                <h3>{title}</h3>
                <Link href={href} className="cud-round-link" aria-label={`Open ${title}`}>
                    <Icon name="arrow" size={17} />
                </Link>
            </div>
            <strong className="cud-stat-value">{value}</strong>
            <p className="cud-stat-note">
                <span className="cud-stat-note-icon"><Icon name={icon} size={12} /></span>
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
        <article className="cud-card cud-analytics">
            <CardHead title="Content Activity" subtitle={`${total} edits this week`} />

            <div className="cud-bars" role="img" aria-label="Content edits per day this week">
                {data.map((d, i) => {
                    const ratio = d.value / max;
                    const level = d.value === 0 ? "none" : ratio >= 0.7 ? "high" : ratio >= 0.35 ? "mid" : "low";
                    const height = d.value === 0 ? 52 : 28 + ratio * 72;

                    return (
                        <div className="cud-bar-col" key={`${d.day}-${i}`}>
                            <div className="cud-bar-track">
                                {i === peakIndex && <span className="cud-bar-tip">{d.value} edits</span>}
                                <div className={`cud-bar level-${level}`} style={{ height: `${height}%` }} />
                            </div>
                            <span className={`cud-bar-day ${i === todayIndex ? "is-today" : ""}`}>{d.day}</span>
                        </div>
                    );
                })}
            </div>
        </article>
    );
}

function ScheduledCard({ item }) {
    return (
        <article className="cud-card cud-reminder">
            <CardHead title="Next Scheduled Publication" />

            {item ? (
                <>
                    <h3 className="cud-reminder-title">{item.title}</h3>
                    <p className="cud-reminder-meta">
                        {item.type} · {formatWhen(item.publishAt)}
                    </p>
                    <Link href={item.href} className="cud-primary-button wide">
                        <Icon name="eye" size={17} />
                        Open item
                    </Link>
                </>
            ) : (
                <>
                    <h3 className="cud-reminder-title muted">Nothing scheduled</h3>
                    <p className="cud-reminder-meta">Schedule a post to publish it automatically.</p>
                    <Link href={`${BASE}/engagement/news/create`} className="cud-primary-button wide">
                        <Icon name="plus" size={17} />
                        Schedule publication
                    </Link>
                </>
            )}
        </article>
    );
}

function SessionList({ items }) {
    return (
        <article className="cud-card cud-list-card">
            <CardHead title="Training Sessions" action={<PillLink href={`${BASE}/facilities/training`}>View all</PillLink>} />

            {items.length === 0 ? (
                <p className="cud-empty">No upcoming sessions.</p>
            ) : (
                <ul className="cud-rows">
                    {items.slice(0, 5).map((session) => {
                        const status = SESSION_STATUS[session.status] || SESSION_STATUS.open;
                        return (
                            <li key={session.id}>
                                <Link href={`${BASE}/facilities/training`} className="cud-row">
                                    <span className={`cud-row-icon tone-${status.tone}`}><Icon name="calendar" size={16} /></span>
                                    <span className="cud-row-text">
                                        <strong>{session.title}</strong>
                                        <small>{formatDay(session.startDate)} · {session.seats} seats</small>
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
        <article className="cud-card cud-enquiries">
            <CardHead
                title="Enquiries"
                subtitle="General, research collaboration and training enquiries"
                action={<PillLink href={COEUAS_ROUTES.enquiries} icon="mail">Open inbox</PillLink>}
            />

            {items.length === 0 ? (
                <p className="cud-empty">No enquiries yet.</p>
            ) : (
                <ul className="cud-people">
                    {items.slice(0, 4).map((enq, index) => {
                        const status = ENQ_STATUS[enq.status] || ENQ_STATUS.new;
                        return (
                            <li key={enq.id}>
                                <Link href={`${COEUAS_ROUTES.enquiries}/${enq.id}`} className="cud-person">
                                    <span className={`cud-avatar v${index % 4}`}>{initialsOf(enq.name)}</span>
                                    <span className="cud-person-text">
                                        <strong>
                                            {enq.name}
                                            <em className="cud-tag">{ENQ_TYPE[enq.type] || enq.type}</em>
                                        </strong>
                                        <small>
                                            About <b>{enq.subject}</b> · {enq.organisation}
                                        </small>
                                    </span>
                                    <span className="cud-person-side">
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

function ProjectsCard({ projects }) {
    const completed = projects.completed || 0;
    const ongoing = projects.ongoing || 0;
    const proposed = projects.proposed || 0;
    const total = completed + ongoing + proposed;
    const pct = total ? Math.round((completed / total) * 100) : 0;

    const gap = 0.025;
    const segments = [];
    let cursor = 0;
    [
        { key: "completed", value: completed, className: "seg-decided" },
        { key: "ongoing", value: ongoing, className: "seg-review" },
        { key: "proposed", value: proposed, className: "seg-fresh" },
    ].forEach((seg) => {
        if (!seg.value || !total) return;
        const size = seg.value / total;
        const from = cursor + (cursor === 0 ? 0 : gap / 2);
        const to = cursor + size - gap / 2;
        if (to > from) segments.push({ ...seg, d: arcPath(120, 118, 92, from, to) });
        cursor += size;
    });

    return (
        <article className="cud-card cud-pipeline">
            <CardHead
                title="Research Projects"
                action={<PillLink href={`${BASE}/research/projects`}>View all</PillLink>}
            />

            <div className="cud-gauge">
                <svg viewBox="0 0 240 132" role="img" aria-label={`${pct}% of research projects completed`}>
                    <defs>
                        <pattern id="cud-hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                            <rect width="8" height="8" fill="#1d1d1d" />
                            <line x1="0" y1="0" x2="0" y2="8" stroke="#6b6b66" strokeWidth="3" />
                        </pattern>
                    </defs>
                    <path d={arcPath(120, 118, 92, 0, 1)} className="cud-gauge-track" />
                    {segments.map((seg) => (
                        <path key={seg.key} d={seg.d} className={`cud-gauge-seg ${seg.className}`} />
                    ))}
                </svg>

                <div className="cud-gauge-center">
                    <strong>{pct}%</strong>
                    <span>Completed</span>
                </div>
            </div>

            <ul className="cud-legend">
                <li><i className="cud-dot decided" />Completed<b>{completed}</b></li>
                <li><i className="cud-dot review" />Ongoing<b>{ongoing}</b></li>
                <li><i className="cud-dot fresh" />Proposed<b>{proposed}</b></li>
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
        <article className="cud-card cud-site">
            <svg className="cud-site-art" viewBox="0 0 300 160" aria-hidden="true">
                {[28, 48, 68, 88, 108, 128, 148].map((r, i) => (
                    <ellipse key={r} cx="220" cy="140" rx={r * 1.7} ry={r * 0.85} fill="none" stroke="#facc15" strokeOpacity={0.5 - i * 0.055} strokeWidth="1.4" />
                ))}
            </svg>

            <div className="cud-site-head">
                <h2>Public Website</h2>
                <span className={`cud-live ${site.status === "live" ? "is-live" : ""}`}>
                    <i />{site.status === "live" ? "Live" : "Offline"}
                </span>
            </div>

            <p className="cud-site-label">Time since last publish</p>
            <div className="cud-timer">
                {site.lastPublishedAt ? elapsed(site.lastPublishedAt, now) : "--:--:--"}
            </div>

            <div className="cud-site-actions">
                {url ? (
                    <a href={url} target="_blank" rel="noreferrer" className="cud-round-button yellow" aria-label="View public website" title="View public website">
                        <Icon name="external" size={19} />
                    </a>
                ) : (
                    <span className="cud-round-button yellow is-disabled" aria-disabled="true" title="Public URL not set">
                        <Icon name="globe" size={19} />
                    </span>
                )}
                <Link href={`${BASE}/engagement/news`} className="cud-round-button white" aria-label="Review latest posts" title="Review latest posts">
                    <Icon name="refresh" size={19} />
                </Link>
            </div>
        </article>
    );
}

function ModulesCard({ modules, stats }) {
    return (
        <article className="cud-card cud-modules">
            <CardHead
                title="Content by Module"
                subtitle="Published items and drafts on each public page"
                action={
                    <span className="cud-legend-inline">
                        <i className="cud-dot decided" />Published
                        <i className="cud-dot draft" />Draft
                    </span>
                }
            />

            <ul className="cud-module-list">
                {modules.map((m) => {
                    const total = Math.max(1, m.published + m.draft);
                    return (
                        <li key={m.key}>
                            <Link href={m.href} className="cud-module">
                                <span className="cud-module-name">{m.label}</span>
                                <span className="cud-module-bar">
                                    <i className="pub" style={{ width: `${(m.published / total) * 100}%` }} />
                                    <i className="draft" style={{ width: `${(m.draft / total) * 100}%` }} />
                                </span>
                                <span className="cud-module-count">
                                    <b>{m.published}</b>{m.draft > 0 && <em>+{m.draft}</em>}
                                </span>
                            </Link>
                        </li>
                    );
                })}
            </ul>

            <div className="cud-mini-stats">
                <Link href={`${BASE}/people/members`} className="cud-mini-stat">
                    <Icon name="users" size={16} />
                    <b>{stats.activeMembers}</b><span>Members</span>
                </Link>
                <Link href={`${BASE}/media`} className="cud-mini-stat">
                    <Icon name="image" size={16} />
                    <b>{stats.mediaFiles}</b><span>Media files</span>
                </Link>
                <Link href={`${BASE}/publications`} className="cud-mini-stat">
                    <Icon name="book" size={16} />
                    <b>{stats.publicationsPublished ?? "-"}</b><span>Publications</span>
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
        <article className="cud-card cud-activity">
            <CardHead
                title="My Recent Activity"
                subtitle="Your latest changes, also kept in the audit log"
                action={<PillLink href={COEUAS_ROUTES.activity} icon="clock">Full log</PillLink>}
            />

            {items.length === 0 ? (
                <p className="cud-empty">No activity yet.</p>
            ) : (
                <ol className="cud-timeline">
                    {items.slice(0, 6).map((item) => {
                        const meta = ACTION_META[item.action] || ACTION_META.updated;
                        return (
                            <li key={item.id}>
                                <span className="cud-timeline-icon"><Icon name={meta.icon} size={14} /></span>
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

function GlanceCard({ glance }) {
    return (
        <article className="cud-card cud-glance">
            <CardHead
                title="Centre at a Glance"
                subtitle="People, research, facilities and engagement records"
            />

            <ul className="cud-glance-grid">
                {GLANCE.map((tile) => (
                    <li key={tile.key}>
                        <Link href={tile.href} className="cud-glance-tile">
                            <span className="cud-glance-icon"><Icon name={tile.icon} size={17} /></span>
                            <b>{glance[tile.key] ?? 0}</b>
                            <span>{tile.label}</span>
                        </Link>
                    </li>
                ))}
            </ul>
        </article>
    );
}

function PublicationsCard({ publications }) {
    const rows = PUB_TYPES.map((t) => ({ ...t, value: publications[t.key] || 0 }));
    const max = Math.max(1, ...rows.map((r) => r.value));
    const total = rows.reduce((sum, r) => sum + r.value, 0);

    return (
        <article className="cud-card cud-types">
            <CardHead
                title="Publications by Type"
                subtitle={`${total} published · ${publications.drafts || 0} drafts`}
                action={<PillLink href={`${BASE}/publications`} icon="book">Open list</PillLink>}
            />

            <ul className="cud-type-list">
                {rows.map((row) => (
                    <li key={row.key} className="cud-type-row">
                        <span className="cud-type-name">{row.label}</span>
                        <span className="cud-type-bar">
                            <i style={{ width: `${(row.value / max) * 100}%` }} />
                        </span>
                        <b>{row.value}</b>
                    </li>
                ))}
            </ul>

            <div className="cud-type-links">
                <Link href={`${BASE}/publications/import`} className="cud-pill-link">Bulk import</Link>
                <Link href={`${BASE}/publications/citations`} className="cud-pill-link">Citations and impact</Link>
                <Link href={`${BASE}/publications/highlights`} className="cud-pill-link">Annual highlights</Link>
            </div>
        </article>
    );
}

/* ------------------------------------------------------------------ */
/* PAGE                                                                */
/* ------------------------------------------------------------------ */
export default function AdminCOEUASDashboard() {
    const { props } = usePage();
    const isSample = !props.dashboard;
    const data = props.dashboard ?? SAMPLE_DATA;
    const { stats } = data;
    const publicUrl = props.coeuas?.publicUrl || data.site?.url || null;

    const [addOpen, setAddOpen] = useState(false);

    useEffect(() => {
        const close = (event) => {
            if (!event.target.closest("[data-cud-add]")) setAddOpen(false);
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

    // the module card's "Publications" tile reads from the glance counts
    const miniStats = { ...stats, publicationsPublished: data.glance?.publications };

    return (
        <>
            <Head title="COE-UAS Dashboard" />

            <section className="cud">
                {/* HEADER */}
                <header className="cud-header">
                    <div>
                        <h1>Dashboard</h1>
                        <p>
                            Manage COE-UAS people, research, publications and enquiries.
                            {isSample && <span className="cud-sample">Sample data</span>}
                        </p>
                    </div>

                    <div className="cud-header-actions">
                        <div className="cud-add" data-cud-add>
                            <button
                                type="button"
                                className="cud-primary-button"
                                onClick={() => setAddOpen((v) => !v)}
                                aria-expanded={addOpen}
                                aria-haspopup="menu"
                            >
                                <Icon name="plus" size={18} />
                                Add Content
                                <Icon name="down" size={15} />
                            </button>

                            {addOpen && (
                                <div className="cud-menu" role="menu">
                                    {ADD_CONTENT.map((item) => (
                                        <Link key={item.href} href={item.href} className="cud-menu-item" role="menuitem">
                                            <Icon name="plus" size={15} />
                                            {item.label}
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>

                        {publicUrl ? (
                            <a href={publicUrl} target="_blank" rel="noreferrer" className="cud-outline-button">
                                View Public Site
                            </a>
                        ) : (
                            <Link href={`${BASE}/settings/site`} className="cud-outline-button">
                                Site Settings
                            </Link>
                        )}
                    </div>
                </header>

                {/* STAT CARDS: content counts, members, new enquiries, drafts and scheduled */}
                <div className="cud-grid">
                    <StatCard
                        highlight
                        title="Total Content Items"
                        value={stats.totalContent}
                        icon="trend"
                        note={`${stats.published} published · ${stats.updatedThisWeek} updated this week`}
                        href={`${BASE}/engagement/news`}
                    />
                    <StatCard
                        title="Active Members"
                        value={stats.activeMembers}
                        icon="users"
                        note="Researchers on the public directory"
                        href={`${BASE}/people/members`}
                    />
                    <StatCard
                        title="New Enquiries"
                        value={stats.newEnquiries}
                        icon="mail"
                        note={`${stats.totalEnquiries} in the enquiry inbox`}
                        href={COEUAS_ROUTES.enquiries}
                    />
                    <StatCard
                        title="Drafts & Scheduled"
                        value={unpublished}
                        icon="clock"
                        note={`${stats.drafts} drafts · ${stats.scheduled} scheduled`}
                        href={`${BASE}/engagement/news`}
                    />

                    {/* ROW 2 */}
                    <ActivityBars data={data.weeklyActivity} />
                    <ScheduledCard item={data.nextScheduled} />
                    <SessionList items={data.sessions} />

                    {/* ROW 3 */}
                    <EnquiryList items={data.enquiries} />
                    <ProjectsCard projects={data.projects} />
                    <SiteCard site={data.site} publicUrl={publicUrl} />

                    {/* ROW 4 */}
                    <ModulesCard modules={data.modules} stats={miniStats} />
                    <ActivityCard items={data.activity} />

                    {/* ROW 5 */}
                    <GlanceCard glance={data.glance} />
                    <PublicationsCard publications={data.publications} />
                </div>
            </section>
        </>
    );
}

// Inertia persistent layout: sidebar + topbar stay mounted between pages.
// Remove this line if your app already wraps admin pages in NavigationBar elsewhere.
AdminCOEUASDashboard.layout = (page) => <NavigationBar>{page}</NavigationBar>;

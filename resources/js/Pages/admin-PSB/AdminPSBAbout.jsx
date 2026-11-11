import { createContext, useContext, useEffect, useId, useMemo, useRef, useState } from "react";
import { router, usePage } from "@inertiajs/react";
/* Same look as Opportunities: base styles come from that file, About-only extras from admin-about.css */
import "../../../css/admin-PSB-css/admin-opportunities.css";
import "../../../css/admin-PSB-css/admin-about.css";

/* ====================================================================
   PSB ADMIN → ABOUT THE SANDBOX EDITOR            /admin/psb/about/*

   One editor for five modules (same layout as the Opportunities editor):
     1  Overview                       → page_sections (text, list)
     2  Why Perlis, Malaysia?          → page_sections (cards)
     3  Governance and Management      → psb_governance_units (tree)
     4  Development Roadmap            → psb_roadmap_phases + psb_milestones
     5  Partners and Collaborators     → partners

   LIVE PREVIEW: the panel on the right has two views
     • Draft preview  - the public page built from what is on screen (unsaved edits too)
     • Live site      - the real public page (/about) in a frame; reloads after publishing

   SAMPLE DATA: works today (changes stay on screen). Return an Inertia prop named
   `about` and it switches to LIVE mode:

   Inertia::render('admin-PSB/AdminPSBAbout', [
       'section' => 'overview',   // overview | why-perlis | governance | roadmap | partners
       'about' => [
           'content' => [...],    // same shape as `sampleContent` below
           'meta'    => [...],    // status, publishedAt, scheduledAt, hasUnpublishedChanges, updatedBy, updatedAt
           'catalog' => ['media' => []],
           'history' => [...],    // audit_logs rows
           'liveUrl' => '/about', // optional, public page address
       ],
   ]);
==================================================================== */

const BASE = "/admin/psb"; // keep in sync with psbRoutes.js
const ENDPOINTS = {
    save: `${BASE}/about`, // PUT   { content }
    publish: `${BASE}/about/publish`, // POST  { content }
    schedule: `${BASE}/about/schedule`, // POST  { content, at }
    unpublish: `${BASE}/about/unpublish`, // POST
    upload: `${BASE}/media-library/upload`, // POST  multipart { file }
};
const DEFAULT_LIVE_URL = "/about";

const SECTIONS = [
    { key: "overview", route: "overview", label: "Overview", hint: "Definition, purpose, vision, objectives" },
    { key: "why", route: "why-perlis", label: "Why Perlis, Malaysia?", hint: "Reasons the site was chosen" },
    { key: "governance", route: "governance", label: "Governance and Management", hint: "Who leads and who reports to whom" },
    { key: "roadmap", route: "roadmap", label: "Development Roadmap", hint: "Phases and milestones" },
    { key: "partners", route: "partners", label: "Partners and Collaborators", hint: "Organisations and logos" },
];

const countOf = (f, key) => {
    const n = { overview: f.overview.objectives.length, why: f.why.reasons.length, governance: f.governance.units.length, roadmap: f.roadmap.phases.length, partners: f.partners.items.length }[key];
    const noun = { overview: "objective", why: "reason", governance: "unit", roadmap: "phase", partners: "partner" }[key];
    return `${n} ${noun}${n === 1 ? "" : "s"}`;
};

const PARTNER_TYPES = [
    { value: "agency", label: "Government agency" },
    { value: "industry", label: "Industry" },
    { value: "research", label: "Research" },
    { value: "university", label: "University" },
    { value: "international", label: "International" },
];
const PHASE_STATUS = [
    { value: "completed", label: "Completed" },
    { value: "current", label: "Current" },
    { value: "planned", label: "Planned" },
];
const MILESTONE_STATUS = [
    { value: "done", label: "Done" },
    { value: "in_progress", label: "In progress" },
    { value: "planned", label: "Planned" },
];

const LIMITS = { objectives: 8, reasons: 8, partnersFeatured: 12 };

const MIN = 60 * 1000;
const NOW = Date.now();
const minsAgo = (m) => new Date(NOW - m * MIN).toISOString();
let counter = 0;
const uid = () => `n${Date.now().toString(36)}${(counter += 1)}`;

/* ------------------------------ sample data ------------------------------ */

const sampleContent = {
    overview: {
        visible: true,
        definition: "The Perlis Airspace Sandbox is a controlled, designated airspace where new aviation technologies and operations can be tested safely under regulatory oversight.",
        purpose: "It gives government, industry and researchers a real place to trial drones, advanced air mobility and supporting systems before they are used at scale.",
        vision: "A trusted national testbed that helps Malaysia move from pilot projects to everyday, safe, commercial use of the low-altitude airspace.",
        objectives: [
            { id: "o1", text: "Provide a safe, managed airspace for testing and demonstration" },
            { id: "o2", text: "Shorten the path from trial to regulatory approval" },
            { id: "o3", text: "Bring government, industry and academia together" },
            { id: "o4", text: "Build local skills and supply chains" },
        ],
        mediaId: 2,
    },
    why: {
        visible: true,
        intro: "Perlis offers a rare mix of conditions that make it well suited to airspace testing.",
        reasons: [
            { id: "r1", title: "Low-density airspace", text: "Fewer commercial flights and a small footprint make it easier to manage test operations safely.", mediaId: null },
            { id: "r2", title: "Varied terrain", text: "Plains, hills and coastline let teams test different operating environments in a short distance.", mediaId: 3 },
            { id: "r3", title: "Supportive state government", text: "Local authorities back the programme and help with access, coordination and community engagement.", mediaId: null },
            { id: "r4", title: "Research partners nearby", text: "Universities and research centres are close by for joint projects, data and talent.", mediaId: null },
        ],
    },
    governance: {
        visible: true,
        intro: "The sandbox is steered by a governing body and run day to day by a management team.",
        units: [
            { id: "g1", parentId: null, name: "Steering Committee", role: "Strategic direction", responsibility: "Sets policy, approves the roadmap and resolves cross-agency issues." },
            { id: "g2", parentId: "g1", name: "Programme Management Office", role: "Day-to-day management", responsibility: "Runs the sandbox, schedules activity and coordinates participants." },
            { id: "g3", parentId: "g1", name: "Technical and Safety Panel", role: "Safety oversight", responsibility: "Reviews risk assessments and approves test plans." },
            { id: "g4", parentId: "g2", name: "Participant Support Desk", role: "Participant liaison", responsibility: "First contact for applicants and active participants." },
        ],
    },
    roadmap: {
        visible: true,
        intro: "A phased approach, from setting up the foundations to scaling up national use.",
        phases: [
            {
                id: "p1", title: "Foundation", description: "Set up governance, site access and safety procedures.", start: "2024-01-01", end: "2025-06-30", status: "completed",
                milestones: [
                    { id: "m1", title: "Governance body formed", description: "", target: "2024-03-31", status: "done" },
                    { id: "m2", title: "Site and airspace defined", description: "", target: "2024-09-30", status: "done" },
                ],
            },
            {
                id: "p2", title: "Pilot operations", description: "Open the first programmes and run trials with early participants.", start: "2025-07-01", end: "2027-06-30", status: "current",
                milestones: [
                    { id: "m3", title: "First open call published", description: "", target: "2025-10-31", status: "done" },
                    { id: "m4", title: "First BVLOS trial", description: "Beyond visual line of sight, in a managed corridor.", target: "2026-12-15", status: "in_progress" },
                ],
            },
            {
                id: "p3", title: "Scale up", description: "Extend the airspace and support commercial operations.", start: "2027-07-01", end: "2029-12-31", status: "planned",
                milestones: [{ id: "m5", title: "Extended airspace approved", description: "", target: "2028-06-30", status: "planned" }],
            },
        ],
    },
    partners: {
        visible: true,
        intro: "The sandbox works with agencies, industry and research institutions.",
        items: [
            { id: "pt1", name: "Civil Aviation Authority of Malaysia", type: "agency", url: "https://www.caam.gov.my", logoId: null, description: "National aviation regulator.", featured: true },
            { id: "pt2", name: "Universiti Malaysia Perlis", type: "university", url: "https://www.unimap.edu.my", logoId: 1, description: "Research and talent partner.", featured: true },
            { id: "pt3", name: "COE-UAS", type: "research", url: "", logoId: null, description: "Centre of Excellence for unmanned aerial systems.", featured: true },
            { id: "pt4", name: "Perlis State Government", type: "agency", url: "", logoId: null, description: "Host state and local coordination.", featured: false },
        ],
    },
    seo: {
        title: "About the Sandbox",
        description: "What the Perlis Airspace Sandbox is, why it is in Perlis, who runs it, and where it is heading.",
        mediaId: 2,
    },
};

const sampleMeta = {
    status: "published",
    publishedAt: minsAgo(60 * 26),
    scheduledAt: null,
    hasUnpublishedChanges: false,
    updatedBy: "Aisyah Rahman",
    updatedAt: minsAgo(60 * 26),
};

const sampleCatalog = {
    media: [
        { id: 1, name: "unimap-logo.png", type: "image", alt: "UniMAP logo", size: "0.1 MB", url: null },
        { id: 2, name: "perlis-aerial.jpg", type: "image", alt: "Aerial view of the sandbox site", size: "1.8 MB", url: null },
        { id: 3, name: "terrain-hills.jpg", type: "image", alt: "Hills in northern Perlis", size: "1.2 MB", url: null },
    ],
};

const sampleHistory = [
    { id: 3, user: "Aisyah Rahman", action: "PUBLISH", label: "About the Sandbox", at: minsAgo(60 * 26), changes: [{ field: "Development Roadmap", from: "Previous version", to: "Updated" }] },
    { id: 2, user: "Aisyah Rahman", action: "UPDATE", label: "Development Roadmap", at: minsAgo(60 * 27), changes: [] },
    { id: 1, user: "Hafiz Roslan", action: "CREATE", label: "Partners and Collaborators", at: minsAgo(60 * 24 * 6), changes: [] },
];

/* ------------------------------- helpers -------------------------------- */

const clone = (v) => JSON.parse(JSON.stringify(v));
const sameJson = (a, b) => JSON.stringify(a) === JSON.stringify(b);

function timeAgo(iso) {
    if (!iso) return "";
    const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / MIN));
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins} min ago`;
    const hrs = Math.round(mins / 60);
    if (hrs < 24) return `${hrs} hr ago`;
    const days = Math.round(hrs / 24);
    return `${days} day${days === 1 ? "" : "s"} ago`;
}

function formatDate(iso, withTime = true) {
    if (!iso) return "";
    const d = new Date(iso.length === 10 ? `${iso}T00:00:00` : iso);
    if (Number.isNaN(d.getTime())) return "";
    const date = d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
    return withTime && iso.length > 10 ? `${date}, ${d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}` : date;
}

const initialsOf = (name) => (name || "?").split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase();
const isUrl = (v) => /^(https?:\/\/)[^\s.]+\.[^\s]{2,}$/i.test(v);

const moveIn = (list, from, to) => {
    if (to < 0 || to >= list.length) return list;
    const next = [...list];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    return next;
};

/* drawn thumbnail for a media asset (real files would use their own URL) */
function thumbOf(item) {
    if (item?.url) return item.url;
    const label = (item?.name || "media").replace(/[<>&"]/g, "");
    const art = '<circle cx="160" cy="84" r="9" fill="#fff"/><path d="M130 54l60 60M190 54l-60 60" stroke="#fff" stroke-width="4" stroke-linecap="round"/>';
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0b1a28"/><stop offset="1" stop-color="#1d4160"/></linearGradient></defs><rect width="320" height="200" fill="url(#g)"/><path d="M-10 170L120 110 330 70V110L130 150 -10 200Z" fill="#facc15" fill-opacity=".9"/>${art}<text x="14" y="186" fill="#fff" font-family="Arial,sans-serif" font-size="13" font-weight="700">${label}</text></svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/* governance tree helpers (the ERD stores parent_id; array order is sort_order) */
const parentOf = (units, u) => (u.parentId && units.some((x) => x.id === u.parentId) ? u.parentId : null);
function flattenTree(units) {
    const out = [];
    const walk = (pid, depth) =>
        units.filter((u) => parentOf(units, u) === pid).forEach((u) => {
            out.push({ unit: u, depth });
            walk(u.id, depth + 1);
        });
    walk(null, 0);
    return out;
}
function descendantsOf(units, id) {
    const found = new Set();
    const walk = (pid) => units.filter((u) => u.parentId === pid).forEach((u) => { found.add(u.id); walk(u.id); });
    walk(id);
    return found;
}

/* ------------------------------ validation ------------------------------- */

function validate(f) {
    const e = {};
    const need = (key, value, msg) => { if (!String(value ?? "").trim()) e[key] = msg; };

    need("overview.definition", f.overview.definition, "Write what the sandbox is.");
    need("overview.purpose", f.overview.purpose, "Write the purpose.");
    need("overview.vision", f.overview.vision, "Write the vision.");
    if (!f.overview.objectives.length) e["overview.objectives"] = "Add at least one objective.";
    f.overview.objectives.forEach((o) => need(`overview.obj.${o.id}`, o.text, "Write the objective or remove it."));

    f.why.reasons.forEach((r) => {
        need(`why.${r.id}.title`, r.title, "Give the reason a title.");
        need(`why.${r.id}.text`, r.text, "Add a short explanation.");
    });

    f.governance.units.forEach((u) => {
        need(`governance.${u.id}.name`, u.name, "Give the unit a name.");
        need(`governance.${u.id}.role`, u.role, "Add the role or title.");
    });

    if (f.roadmap.phases.filter((p) => p.status === "current").length > 1) e["roadmap.current"] = "Only one phase can be the current phase.";
    f.roadmap.phases.forEach((p) => {
        need(`roadmap.${p.id}.title`, p.title, "Give the phase a title.");
        if (p.start && p.end && p.end < p.start) e[`roadmap.${p.id}.end`] = "The end date is before the start date.";
        p.milestones.forEach((m) => need(`roadmap.${p.id}.${m.id}.title`, m.title, "Give the milestone a title."));
    });

    f.partners.items.forEach((p) => {
        need(`partners.${p.id}.name`, p.name, "Give the partner a name.");
        if (p.url && !isUrl(p.url)) e[`partners.${p.id}.url`] = "Use a full link, starting with https://";
    });
    if (f.partners.items.filter((p) => p.featured).length > LIMITS.partnersFeatured)
        e["partners.featured"] = `At most ${LIMITS.partnersFeatured} partners can be featured.`;

    if ((f.seo.title || "").length > 70) e["seo.title"] = "Keep the title under 70 characters.";
    if ((f.seo.description || "").length > 160) e["seo.description"] = "Keep the description under 160 characters.";
    need("seo.title", f.seo.title, "Add a page title.");
    return e;
}

const sectionOfKey = (key) => key.split(".")[0];

/* ------------------------------ shared state ------------------------------ */

const Ctx = createContext(null);
const useEd = () => useContext(Ctx);

/* -------------------------------- icons ---------------------------------- */

function Icon({ name, size = 18 }) {
    const icons = {
        save: (<><path d="M5 3h11l4 4v14H5z" /><path d="M8 3v6h8V3M8 21v-7h8v7" /></>),
        upload: (<><path d="M12 16V4M7 9l5-5 5 5" /><path d="M4 20h16" /></>),
        clock: (<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>),
        more: (<><circle cx="5" cy="12" r="1.2" /><circle cx="12" cy="12" r="1.2" /><circle cx="19" cy="12" r="1.2" /></>),
        grip: (<><circle cx="9" cy="6" r="1.2" /><circle cx="15" cy="6" r="1.2" /><circle cx="9" cy="12" r="1.2" /><circle cx="15" cy="12" r="1.2" /><circle cx="9" cy="18" r="1.2" /><circle cx="15" cy="18" r="1.2" /></>),
        up: <path d="m6 15 6-6 6 6" />,
        down: <path d="m6 9 6 6 6-6" />,
        trash: (<><path d="M4 7h16M10 11v6M14 11v6" /><path d="M6 7l1 13h10l1-13M9 7V4h6v3" /></>),
        plus: <path d="M12 5v14M5 12h14" />,
        close: <path d="M6 6l12 12M18 6 6 18" />,
        check: <path d="m5 12 5 5 9-10" />,
        alert: (<><path d="M12 3 2.5 20h19z" /><path d="M12 10v4M12 17.2v.1" /></>),
        search: (<><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4-4" /></>),
        image: (<><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" /></>),
        external: <path d="M14 4h6v6M20 4l-9 9M18 14v5H5V6h5" />,
        unlink: (<><path d="M9 15 15 9" /><path d="M11 6l1.5-1.5a4 4 0 0 1 5.7 5.7L16.7 11.7M13 18l-1.5 1.5a4 4 0 0 1-5.7-5.7L7.3 12.3" /><path d="M3 3l18 18" /></>),
        star: <polygon points="12 2 15 9 22 9.5 17 14.5 18.5 22 12 18 5.5 22 7 14.5 2 9.5 9 9" />,
        refresh: (<><path d="M21 12a9 9 0 1 1-3-6.7" /><polyline points="21 3 21 9 15 9" /></>),
        panel: (<><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M14 4v16" /></>),
        corner: <path d="M5 4v8a3 3 0 0 0 3 3h11m-4-4 4 4-4 4" />,
    };
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            {icons[name]}
        </svg>
    );
}

/* ------------------------------ form pieces ------------------------------ */

function Toggle({ checked, onChange, label }) {
    return (
        <button type="button" role="switch" aria-checked={checked} aria-label={label} className={`po-toggle ${checked ? "is-on" : ""}`} onClick={() => onChange(!checked)}>
            <span />
        </button>
    );
}

function Field({ label, hint, value, onChange, errorKey, max, rows, placeholder, type = "text", prefix }) {
    const { errors } = useEd();
    const auto = useId();
    const id = `po-${auto}`;
    const error = errorKey ? errors[errorKey] : null;
    const length = (value || "").length;

    return (
        <div className={`po-field ${error ? "has-error" : ""}`}>
            <div className="po-field-top">
                <label htmlFor={id}>{label}</label>
                {max && <span className={`po-count ${length > max ? "is-over" : ""}`}>{length}/{max}</span>}
            </div>
            {rows ? (
                <textarea id={id} className="po-input po-textarea" rows={rows} value={value || ""} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
            ) : prefix ? (
                <div className="po-input-wrap">
                    <span className="po-affix">{prefix}</span>
                    <input id={id} type={type} className="po-input" value={value || ""} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
                </div>
            ) : (
                <input id={id} type={type} className="po-input" value={value || ""} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
            )}
            {hint && !error && <p className="po-hint">{hint}</p>}
            {error && <p className="po-error" role="alert"><Icon name="alert" size={13} /> {error}</p>}
        </div>
    );
}

function SelectField({ label, value, onChange, options, placeholder }) {
    const id = `po-${useId()}`;
    return (
        <div className="po-field">
            <div className="po-field-top"><label htmlFor={id}>{label}</label></div>
            <select id={id} className="po-input po-select" value={value ?? ""} onChange={(e) => onChange(e.target.value)}>
                {placeholder && <option value="">{placeholder}</option>}
                {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
        </div>
    );
}

function ErrorLine({ errorKey }) {
    const { errors } = useEd();
    return errors[errorKey] ? <p className="po-error" role="alert"><Icon name="alert" size={13} /> {errors[errorKey]}</p> : null;
}

function BlockHead({ title, text, aside }) {
    return (
        <div className="po-block-head">
            <div>
                <h3>{title}</h3>
                {text && <p>{text}</p>}
            </div>
            {aside}
        </div>
    );
}

function AddButton({ onClick, children, disabled }) {
    return (
        <button type="button" className="po-add" onClick={onClick} disabled={disabled}>
            <Icon name="plus" size={15} /> {children}
        </button>
    );
}

/* up / down / delete buttons */
function ItemTools({ index, count, onMove, onDelete, label }) {
    return (
        <div className="po-item-tools">
            <button type="button" className="po-iconbtn" aria-label="Move up" title="Move up" disabled={index === 0} onClick={() => onMove(index - 1)}><Icon name="up" size={15} /></button>
            <button type="button" className="po-iconbtn" aria-label="Move down" title="Move down" disabled={index === count - 1} onClick={() => onMove(index + 1)}><Icon name="down" size={15} /></button>
            <button type="button" className="po-iconbtn is-danger" aria-label={`Delete ${label}`} title="Delete (moves to Trash)" onClick={onDelete}><Icon name="trash" size={15} /></button>
        </div>
    );
}

/* Drag to reorder: HTML5 drag from the handle, plus Up / Down buttons for keyboard users */
function useDrag(onReorder) {
    const from = useRef(null);
    const [over, setOver] = useState(null);
    return {
        over,
        handleProps: (i) => ({
            draggable: true,
            onDragStart: (e) => {
                from.current = i;
                e.dataTransfer.effectAllowed = "move";
                try { e.dataTransfer.setData("text/plain", String(i)); } catch { /* ignore */ }
                const row = e.currentTarget.closest("li");
                if (row) e.dataTransfer.setDragImage(row, 24, 24);
            },
            onDragEnd: () => { from.current = null; setOver(null); },
        }),
        rowProps: (i) => ({
            onDragOver: (e) => { if (from.current === null) return; e.preventDefault(); setOver(i); },
            onDrop: (e) => {
                e.preventDefault();
                if (from.current !== null && from.current !== i) onReorder(from.current, i);
                from.current = null;
                setOver(null);
            },
        }),
    };
}

/* Ordered list: every row can be edited, moved (drag or buttons) and removed (asks first, moves to Trash) */
function Orderable({ items, onMove, onRemove, nameOf, extraOf, children, empty }) {
    const { askDelete } = useEd();
    const drag = useDrag(onMove);
    if (!items.length) return <p className="po-empty">{empty}</p>;

    return (
        <ul className="po-list">
            {items.map((item, i) => (
                <li key={item.id} className={`po-item ${drag.over === i ? "is-over" : ""}`} {...drag.rowProps(i)}>
                    <button type="button" className="po-handle" aria-label={`Drag ${nameOf(item)} to reorder`} title="Drag to reorder" {...drag.handleProps(i)}><Icon name="grip" size={16} /></button>
                    <span className="po-item-no">{i + 1}</span>
                    <div className="po-item-body">{children(item, i)}</div>
                    <ItemTools index={i} count={items.length} label={nameOf(item)} onMove={(to) => onMove(i, to)} onDelete={() => askDelete({ what: nameOf(item), extra: extraOf ? extraOf(item) : "", onConfirm: () => onRemove(i) })} />
                </li>
            ))}
        </ul>
    );
}

/* ------------------------------ media ------------------------------ */

function MediaField({ label, hint, mediaId, onChange }) {
    const { media, pickMedia } = useEd();
    const asset = media.find((m) => m.id === mediaId);
    const needsAlt = asset && !asset.alt;

    return (
        <div className="po-field">
            <div className="po-field-top"><span className="po-label">{label}</span></div>
            <div className="po-media">
                <span className="po-media-thumb">{asset ? <img src={thumbOf(asset)} alt="" /> : <Icon name="image" size={22} />}</span>
                <div className="po-media-text">
                    {asset ? (
                        <>
                            <strong>{asset.name}</strong>
                            <small>Image · {asset.size}</small>
                            {needsAlt && <small className="po-media-warn"><Icon name="alert" size={12} /> No alt text. Add it in the Media Library.</small>}
                        </>
                    ) : (
                        <>
                            <strong>No file chosen</strong>
                            <small>Pick an image from the Media Library</small>
                        </>
                    )}
                </div>
                <div className="po-media-actions">
                    <button type="button" className="po-btn-small" onClick={() => pickMedia({ selected: mediaId, onPick: onChange })}>{asset ? "Change" : "Choose"}</button>
                    {asset && <button type="button" className="po-btn-small is-quiet" onClick={() => onChange(null)}>Remove</button>}
                </div>
            </div>
            {hint && <p className="po-hint">{hint}</p>}
        </div>
    );
}

function MediaPicker({ state, media, onClose, onUpload }) {
    const [query, setQuery] = useState("");
    const fileRef = useRef(null);

    useEffect(() => {
        const onKey = (e) => e.key === "Escape" && onClose();
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [onClose]);

    const list = media.filter((m) => {
        if (m.type !== "image") return false;
        const q = query.trim().toLowerCase();
        return !q || m.name.toLowerCase().includes(q) || (m.alt || "").toLowerCase().includes(q);
    });

    return (
        <div className="po-overlay is-top" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
            <div className="po-dialog po-picker" role="dialog" aria-modal="true" aria-labelledby="po-picker-title">
                <header className="po-dialog-head">
                    <div>
                        <h2 id="po-picker-title">Media Library</h2>
                        <p>Choose an image. Files are managed in the Media Library.</p>
                    </div>
                    <button type="button" className="po-iconbtn" aria-label="Close" onClick={onClose}><Icon name="close" size={18} /></button>
                </header>

                <div className="po-picker-tools">
                    <label className="po-search">
                        <Icon name="search" size={16} />
                        <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by file name or alt text" aria-label="Search media" />
                    </label>
                    <button type="button" className="po-btn-small" onClick={() => fileRef.current?.click()}><Icon name="upload" size={14} /> Upload</button>
                    <input ref={fileRef} type="file" hidden accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) onUpload(f); e.target.value = ""; }} />
                </div>

                <div className="po-media-grid">
                    {list.length === 0 && <p className="po-empty">No images match. Try another search or upload a new image.</p>}
                    {list.map((m) => (
                        <button key={m.id} type="button" className={`po-media-card ${state.selected === m.id ? "is-selected" : ""}`} onClick={() => { state.onPick(m.id); onClose(); }}>
                            <img src={thumbOf(m)} alt="" />
                            <span className="po-media-card-text"><strong>{m.name}</strong><small>Image · {m.size}</small></span>
                            {state.selected === m.id && <span className="po-media-check"><Icon name="check" size={14} /></span>}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

/* ====================================================================
   SECTION EDITORS
==================================================================== */

function SectionHead({ sectionKey, text }) {
    const { form, edit } = useEd();
    const index = SECTIONS.findIndex((s) => s.key === sectionKey);
    const def = SECTIONS[index];
    const visible = form[sectionKey].visible;

    return (
        <header className="po-card-head">
            <div>
                <span className="po-card-no">Section {index + 1} of {SECTIONS.length}</span>
                <h2>{def.label}</h2>
                <p>{text}</p>
            </div>
            <label className="po-visible">
                <span>{visible ? "Shown on page" : "Hidden from page"}</span>
                <Toggle checked={visible} label={`Show ${def.label} on the About page`} onChange={(v) => edit((d) => { d[sectionKey].visible = v; })} />
            </label>
        </header>
    );
}

/* ---------- 1. Overview ---------- */
function OverviewEditor() {
    const { form, edit } = useEd();
    const o = form.overview;
    return (
        <section className="po-card">
            <SectionHead sectionKey="overview" text="The short story at the top of the About page: what the sandbox is, why it exists and where it is going. Changes go live when you publish." />

            <div className="po-block">
                <BlockHead title="Story" text="Three short paragraphs." />
                <div className="po-stack">
                    <Field label="What the sandbox is (definition)" rows={3} errorKey="overview.definition" value={o.definition} onChange={(v) => edit((d) => { d.overview.definition = v; })} />
                    <Field label="Purpose" rows={3} errorKey="overview.purpose" value={o.purpose} onChange={(v) => edit((d) => { d.overview.purpose = v; })} />
                    <Field label="Vision" rows={3} errorKey="overview.vision" value={o.vision} onChange={(v) => edit((d) => { d.overview.vision = v; })} />
                </div>
            </div>

            <div className="po-block">
                <BlockHead title="Objectives" text="Shown as a numbered list. Numbers follow the order below." aside={<span className="po-limit">{o.objectives.length} of {LIMITS.objectives}</span>} />
                <Orderable
                    items={o.objectives}
                    nameOf={(x) => x.text || "objective"}
                    onMove={(from, to) => edit((d) => { d.overview.objectives = moveIn(d.overview.objectives, from, to); })}
                    onRemove={(i) => edit((d) => { d.overview.objectives.splice(i, 1); })}
                    empty="No objectives yet."
                >
                    {(obj, i) => <Field label={`Objective ${i + 1}`} errorKey={`overview.obj.${obj.id}`} value={obj.text} onChange={(v) => edit((d) => { d.overview.objectives[i].text = v; })} />}
                </Orderable>
                <ErrorLine errorKey="overview.objectives" />
                <AddButton disabled={o.objectives.length >= LIMITS.objectives} onClick={() => edit((d) => { d.overview.objectives.push({ id: uid(), text: "" }); })}>Add objective</AddButton>
            </div>

            <div className="po-block">
                <MediaField label="Overview image" mediaId={o.mediaId} onChange={(id) => edit((d) => { d.overview.mediaId = id; })} hint="Used behind the page heading." />
            </div>
        </section>
    );
}

/* ---------- 2. Why Perlis ---------- */
function WhyEditor() {
    const { form, edit } = useEd();
    const w = form.why;
    return (
        <section className="po-card">
            <SectionHead sectionKey="why" text="The reasons this location was chosen. Each reason is a card on the public page. Changes go live when you publish." />

            <div className="po-block">
                <Field label="Introduction" rows={2} value={w.intro} onChange={(v) => edit((d) => { d.why.intro = v; })} />
            </div>

            <div className="po-block">
                <BlockHead title="Reasons" text="One card per reason." aside={<span className="po-limit">{w.reasons.length} of {LIMITS.reasons}</span>} />
                <Orderable
                    items={w.reasons}
                    nameOf={(r) => r.title || "reason"}
                    onMove={(from, to) => edit((d) => { d.why.reasons = moveIn(d.why.reasons, from, to); })}
                    onRemove={(i) => edit((d) => { d.why.reasons.splice(i, 1); })}
                    empty="No reasons yet."
                >
                    {(r, i) => (
                        <div className="po-stack">
                            <Field label="Title" errorKey={`why.${r.id}.title`} value={r.title} onChange={(v) => edit((d) => { d.why.reasons[i].title = v; })} />
                            <Field label="Explanation" rows={2} errorKey={`why.${r.id}.text`} value={r.text} onChange={(v) => edit((d) => { d.why.reasons[i].text = v; })} />
                            <MediaField label="Image (optional)" mediaId={r.mediaId} onChange={(id) => edit((d) => { d.why.reasons[i].mediaId = id; })} />
                        </div>
                    )}
                </Orderable>
                <AddButton disabled={w.reasons.length >= LIMITS.reasons} onClick={() => edit((d) => { d.why.reasons.push({ id: uid(), title: "", text: "", mediaId: null }); })}>Add reason</AddButton>
            </div>
        </section>
    );
}

/* ---------- 3. Governance ---------- */
function GovernanceEditor() {
    const { form, edit, askDelete } = useEd();
    const g = form.governance;
    const rows = flattenTree(g.units);
    const setUnit = (id, patch) => edit((d) => Object.assign(d.governance.units.find((x) => x.id === id), patch));
    const siblings = (u) => g.units.filter((x) => parentOf(g.units, x) === parentOf(g.units, u));

    const moveSibling = (u, dir) =>
        edit((d) => {
            const list = d.governance.units;
            const sib = list.filter((x) => parentOf(list, x) === parentOf(list, u));
            const other = sib[sib.findIndex((x) => x.id === u.id) + dir];
            if (!other) return;
            const a = list.findIndex((x) => x.id === u.id);
            const b = list.findIndex((x) => x.id === other.id);
            [list[a], list[b]] = [list[b], list[a]];
        });

    const remove = (u) =>
        askDelete({
            what: u.name || "this unit",
            extra: g.units.some((x) => x.parentId === u.id) ? "Units that report to it move up one level." : "",
            onConfirm: () =>
                edit((d) => {
                    const list = d.governance.units;
                    list.forEach((x) => { if (x.parentId === u.id) x.parentId = u.parentId || null; });
                    d.governance.units = list.filter((x) => x.id !== u.id);
                }),
        });

    return (
        <section className="po-card">
            <SectionHead sectionKey="governance" text="The organisation behind the sandbox. Each unit can report to another unit, which builds the chart visitors see. Changes go live when you publish." />

            <div className="po-block">
                <Field label="Introduction" rows={2} value={g.intro} onChange={(v) => edit((d) => { d.governance.intro = v; })} />
            </div>

            <div className="po-block">
                <BlockHead
                    title="Units"
                    text="Indented units report to the unit above them."
                    aside={<button type="button" className="po-btn-yellow is-small" onClick={() => edit((d) => { d.governance.units.push({ id: uid(), parentId: d.governance.units.find((x) => !x.parentId)?.id || null, name: "", role: "", responsibility: "" }); })}><Icon name="plus" size={15} /> Add unit</button>}
                />
                {rows.length === 0 && <p className="po-empty">No units yet.</p>}
                <ul className="po-list">
                    {rows.map(({ unit: u, depth }) => {
                        const blocked = descendantsOf(g.units, u.id);
                        const sib = siblings(u);
                        const index = sib.findIndex((x) => x.id === u.id);
                        return (
                            <li key={u.id} className="po-item pa-col pa-unit" style={{ "--depth": Math.min(depth, 4) }}>
                                <div className="pa-top">
                                    {depth > 0 && <span className="pa-branch" aria-hidden="true"><Icon name="corner" size={16} /></span>}
                                    <strong>{u.name || "New unit"}</strong>
                                    <small>{depth === 0 ? "Top level" : `Level ${depth + 1}`}</small>
                                    <ItemTools index={index} count={sib.length} label={u.name || "unit"} onMove={(to) => moveSibling(u, to - index)} onDelete={() => remove(u)} />
                                </div>
                                <div className="po-grid-2">
                                    <Field label="Unit name" errorKey={`governance.${u.id}.name`} value={u.name} onChange={(v) => setUnit(u.id, { name: v })} />
                                    <Field label="Role or title" errorKey={`governance.${u.id}.role`} value={u.role} onChange={(v) => setUnit(u.id, { role: v })} />
                                </div>
                                <div className="po-grid-2 is-wide-right">
                                    <SelectField
                                        label="Reports to"
                                        value={u.parentId || ""}
                                        placeholder="Nobody (top level)"
                                        options={g.units.filter((x) => x.id !== u.id && !blocked.has(x.id)).map((x) => ({ value: x.id, label: x.name || "Unnamed unit" }))}
                                        onChange={(v) => setUnit(u.id, { parentId: v || null })}
                                    />
                                    <Field label="Responsibility" rows={2} value={u.responsibility} onChange={(v) => setUnit(u.id, { responsibility: v })} />
                                </div>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </section>
    );
}

/* ---------- 4. Roadmap ---------- */
function RoadmapEditor() {
    const { form, edit, askDelete } = useEd();
    const r = form.roadmap;
    const [openId, setOpenId] = useState(() => r.phases.find((p) => p.status === "current")?.id || r.phases[0]?.id);

    const setStatus = (i, v) =>
        edit((d) => {
            // only one phase can be current: demote the old one to completed
            if (v === "current") d.roadmap.phases.forEach((p, k) => { if (k !== i && p.status === "current") p.status = "completed"; });
            d.roadmap.phases[i].status = v;
        });

    return (
        <section className="po-card">
            <SectionHead sectionKey="roadmap" text="Phases and the milestones inside each one. Phase numbers follow the order below. Changes go live when you publish." />

            <div className="po-block">
                <Field label="Introduction" rows={2} value={r.intro} onChange={(v) => edit((d) => { d.roadmap.intro = v; })} />
                <ErrorLine errorKey="roadmap.current" />
            </div>

            <div className="po-block">
                <BlockHead
                    title="Phases"
                    text="Open a phase to edit its dates and milestones."
                    aside={<button type="button" className="po-btn-yellow is-small" onClick={() => { const id = uid(); edit((d) => { d.roadmap.phases.push({ id, title: "", description: "", start: "", end: "", status: "planned", milestones: [] }); }); setOpenId(id); }}><Icon name="plus" size={15} /> Add phase</button>}
                />
                {r.phases.length === 0 && <p className="po-empty">No phases yet.</p>}
                <ul className="po-list">
                    {r.phases.map((p, i) => {
                        const open = openId === p.id;
                        const done = p.milestones.filter((m) => m.status === "done").length;
                        return (
                            <li key={p.id} className={`po-item pa-col pa-phase is-${p.status} ${open ? "is-open" : ""}`}>
                                <div className="pa-top">
                                    <button type="button" className="pa-phase-toggle" aria-expanded={open} onClick={() => setOpenId(open ? null : p.id)}>
                                        <span className="po-item-no">{i + 1}</span>
                                        <span className="pa-phase-title">
                                            <strong>{p.title || "New phase"}</strong>
                                            <small>{PHASE_STATUS.find((s) => s.value === p.status).label} · {done}/{p.milestones.length} milestones done{p.start ? ` · ${formatDate(p.start, false)}` : ""}{p.end ? ` to ${formatDate(p.end, false)}` : ""}</small>
                                        </span>
                                        <Icon name={open ? "up" : "down"} size={17} />
                                    </button>
                                    <ItemTools index={i} count={r.phases.length} label={p.title || "phase"}
                                        onMove={(to) => edit((d) => { d.roadmap.phases = moveIn(d.roadmap.phases, i, to); })}
                                        onDelete={() => askDelete({ what: p.title || `Phase ${i + 1}`, extra: p.milestones.length ? `Its ${p.milestones.length} milestone${p.milestones.length === 1 ? "" : "s"} go with it.` : "", onConfirm: () => edit((d) => { d.roadmap.phases.splice(i, 1); }) })} />
                                </div>

                                {open && (
                                    <div className="pa-phase-body">
                                        <div className="po-grid-2">
                                            <Field label="Phase title" errorKey={`roadmap.${p.id}.title`} value={p.title} onChange={(v) => edit((d) => { d.roadmap.phases[i].title = v; })} />
                                            <SelectField label="Status" value={p.status} options={PHASE_STATUS} onChange={(v) => setStatus(i, v)} />
                                        </div>
                                        <Field label="Description" rows={2} value={p.description} onChange={(v) => edit((d) => { d.roadmap.phases[i].description = v; })} />
                                        <div className="po-grid-2">
                                            <Field label="Starts" type="date" value={p.start} onChange={(v) => edit((d) => { d.roadmap.phases[i].start = v; })} />
                                            <Field label="Ends" type="date" errorKey={`roadmap.${p.id}.end`} value={p.end} onChange={(v) => edit((d) => { d.roadmap.phases[i].end = v; })} />
                                        </div>

                                        <div className="pa-subblock">
                                            <BlockHead title="Milestones" aside={<button type="button" className="po-btn-small" onClick={() => edit((d) => { d.roadmap.phases[i].milestones.push({ id: uid(), title: "", description: "", target: "", status: "planned" }); })}><Icon name="plus" size={14} /> Add milestone</button>} />
                                            {p.milestones.length === 0 && <p className="po-empty">No milestones yet.</p>}
                                            <ul className="po-list">
                                                {p.milestones.map((m, k) => (
                                                    <li key={m.id} className="pa-milestone">
                                                        <div className="pa-milestone-main">
                                                            <div className="po-grid-3">
                                                                <Field label="Milestone" errorKey={`roadmap.${p.id}.${m.id}.title`} value={m.title} onChange={(v) => edit((d) => { d.roadmap.phases[i].milestones[k].title = v; })} />
                                                                <Field label="Target date" type="date" value={m.target} onChange={(v) => edit((d) => { d.roadmap.phases[i].milestones[k].target = v; })} />
                                                                <SelectField label="Status" value={m.status} options={MILESTONE_STATUS} onChange={(v) => edit((d) => { d.roadmap.phases[i].milestones[k].status = v; })} />
                                                            </div>
                                                            <Field label="Details (optional)" value={m.description} onChange={(v) => edit((d) => { d.roadmap.phases[i].milestones[k].description = v; })} />
                                                        </div>
                                                        <ItemTools index={k} count={p.milestones.length} label={m.title || "milestone"}
                                                            onMove={(to) => edit((d) => { d.roadmap.phases[i].milestones = moveIn(d.roadmap.phases[i].milestones, k, to); })}
                                                            onDelete={() => askDelete({ what: m.title || "this milestone", extra: "", onConfirm: () => edit((d) => { d.roadmap.phases[i].milestones.splice(k, 1); }) })} />
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                )}
                            </li>
                        );
                    })}
                </ul>
            </div>
        </section>
    );
}

/* ---------- 5. Partners ---------- */
function PartnersEditor() {
    const { form, edit, askDelete, media } = useEd();
    const pt = form.partners;
    const [filter, setFilter] = useState("all");
    const featured = pt.items.filter((p) => p.featured).length;
    const shown = pt.items.map((p, i) => ({ p, i })).filter(({ p }) => filter === "all" || p.type === filter);
    const setItem = (i, patch) => edit((d) => Object.assign(d.partners.items[i], patch));

    return (
        <section className="po-card">
            <SectionHead sectionKey="partners" text="Organisations shown on the About page. Featured partners also appear in the Home page preview. Changes go live when you publish." />

            <div className="po-block">
                <Field label="Introduction" rows={2} value={pt.intro} onChange={(v) => edit((d) => { d.partners.intro = v; })} />
                <ErrorLine errorKey="partners.featured" />
            </div>

            <div className="po-block">
                <BlockHead
                    title="Partners"
                    text={`${pt.items.length} in total, ${featured} featured (max ${LIMITS.partnersFeatured}).`}
                    aside={<button type="button" className="po-btn-yellow is-small" onClick={() => edit((d) => { d.partners.items.push({ id: uid(), name: "", type: "industry", url: "", logoId: null, description: "", featured: false }); })}><Icon name="plus" size={15} /> Add partner</button>}
                />

                <div className="po-chips" role="group" aria-label="Filter by partner type">
                    {[{ value: "all", label: "All" }, ...PARTNER_TYPES].map((t) => (
                        <button key={t.value} type="button" className={filter === t.value ? "is-on" : ""} onClick={() => setFilter(t.value)}>
                            {t.label} <b>{t.value === "all" ? pt.items.length : pt.items.filter((p) => p.type === t.value).length}</b>
                        </button>
                    ))}
                </div>

                {shown.length === 0 && <p className="po-empty">No partners of this type yet.</p>}
                <ul className="po-list">
                    {shown.map(({ p, i }) => {
                        const logo = media.find((m) => m.id === p.logoId);
                        return (
                            <li key={p.id} className="po-item pa-col">
                                <div className="pa-top">
                                    <span className="pa-logo">{logo ? <img src={thumbOf(logo)} alt="" /> : initialsOf(p.name)}</span>
                                    <strong>{p.name || "New partner"}</strong>
                                    {p.featured && <span className="pa-tag"><Icon name="star" size={12} /> Featured</span>}
                                    <ItemTools index={i} count={pt.items.length} label={p.name || "partner"}
                                        onMove={(to) => edit((d) => { d.partners.items = moveIn(d.partners.items, i, to); })}
                                        onDelete={() => askDelete({ what: p.name || "this partner", extra: "", onConfirm: () => edit((d) => { d.partners.items.splice(i, 1); }) })} />
                                </div>
                                <div className="po-grid-2">
                                    <Field label="Name" errorKey={`partners.${p.id}.name`} value={p.name} onChange={(v) => setItem(i, { name: v })} />
                                    <SelectField label="Type" value={p.type} options={PARTNER_TYPES} onChange={(v) => setItem(i, { type: v })} />
                                </div>
                                <div className="po-grid-2">
                                    <Field label="Website" placeholder="https://" errorKey={`partners.${p.id}.url`} value={p.url} onChange={(v) => setItem(i, { url: v })} />
                                    <MediaField label="Logo" mediaId={p.logoId} onChange={(id) => setItem(i, { logoId: id })} />
                                </div>
                                <Field label="Short description" rows={2} value={p.description} onChange={(v) => setItem(i, { description: v })} />
                                <label className="po-check">
                                    <input type="checkbox" checked={Boolean(p.featured)} onChange={(e) => setItem(i, { featured: e.target.checked })} />
                                    <span><strong>Featured partner</strong><small>Shown in the Home page partners preview.</small></span>
                                </label>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </section>
    );
}

/* ====================================================================
   PAGE SETTINGS, HISTORY
==================================================================== */

function SeoPanel({ meta }) {
    const { form, edit } = useEd();
    const s = form.seo;
    const set = (patch) => edit((d) => Object.assign(d.seo, patch));

    return (
        <section className="po-card">
            <header className="po-card-head">
                <div>
                    <span className="po-card-no">Page settings</span>
                    <h2>Search and sharing</h2>
                    <p>How the About page looks in Google results and when someone shares the link.</p>
                </div>
            </header>

            <div className="po-block">
                <Field label="Page title" errorKey="seo.title" value={s.title} max={70} onChange={(v) => set({ title: v })} hint="Shown in the browser tab, search results and the page heading." />
                <Field label="Search description" errorKey="seo.description" value={s.description} max={160} rows={3} onChange={(v) => set({ description: v })} />
                <MediaField label="Share image" mediaId={s.mediaId} onChange={(id) => set({ mediaId: id })} hint="Shown when the link is shared on social media or chat." />
            </div>

            <div className="po-block">
                <BlockHead title="Search result preview" />
                <div className="po-serp">
                    <span>perlis-sandbox.my › about</span>
                    <strong>{s.title || "Page title"}</strong>
                    <p>{s.description || "Search description"}</p>
                </div>
            </div>

            <div className="po-block">
                <BlockHead title="Publishing" />
                <dl className="po-facts">
                    <div><dt>Status</dt><dd>{meta.status === "published" ? "Published" : meta.status === "scheduled" ? "Scheduled" : "Draft"}</dd></div>
                    <div><dt>Published</dt><dd>{meta.publishedAt ? formatDate(meta.publishedAt) : "Not yet"}</dd></div>
                    <div><dt>Scheduled for</dt><dd>{meta.scheduledAt ? formatDate(meta.scheduledAt) : "None"}</dd></div>
                    <div><dt>Last edited</dt><dd>{meta.updatedAt ? `${formatDate(meta.updatedAt)} by ${meta.updatedBy}` : "Never"}</dd></div>
                </dl>
            </div>
        </section>
    );
}

const ACTION_PILL = { CREATE: "warn", UPDATE: "info", PUBLISH: "ok", UNPUBLISH: "off", DELETE: "danger", RESTORE: "ok" };
const ACTION_LABEL = { CREATE: "Created", UPDATE: "Updated", PUBLISH: "Published", UNPUBLISH: "Unpublished", DELETE: "Deleted", RESTORE: "Restored" };

function HistoryPanel({ history }) {
    const [open, setOpen] = useState(null);
    return (
        <section className="po-card">
            <header className="po-card-head">
                <div>
                    <span className="po-card-no">History</span>
                    <h2>Who changed the About page</h2>
                    <p>Every add, update, publish and delete is recorded. Entries cannot be edited.</p>
                </div>
            </header>

            {history.length === 0 ? (
                <p className="po-empty">No history yet.</p>
            ) : (
                <ul className="po-history">
                    {history.map((h) => {
                        const isOpen = open === h.id;
                        return (
                            <li key={h.id}>
                                <button type="button" className="po-hist-row" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : h.id)} disabled={!h.changes?.length}>
                                    <span className="po-avatar">{initialsOf(h.user)}</span>
                                    <span className="po-hist-text">
                                        <strong>{h.user}</strong>
                                        <small>{ACTION_LABEL[h.action] || h.action} <b>{h.label}</b></small>
                                    </span>
                                    <span className={`po-pill is-${ACTION_PILL[h.action] || "info"}`}>{ACTION_LABEL[h.action] || h.action}</span>
                                    <span className="po-hist-time" title={formatDate(h.at)}>{timeAgo(h.at)}</span>
                                </button>
                                {isOpen && h.changes?.length > 0 && (
                                    <div className="po-diff">
                                        {h.changes.map((c, i) => <div key={i}><span>{c.field}</span><del>{c.from}</del><ins>{c.to}</ins></div>)}
                                    </div>
                                )}
                            </li>
                        );
                    })}
                </ul>
            )}
        </section>
    );
}

/* ====================================================================
   LIVE PREVIEW PANEL  (draft preview + the real public page)
==================================================================== */

const pad2 = (n) => String(n).padStart(2, "0");

function OrgNode({ unit, units, depth }) {
    const kids = units.filter((u) => parentOf(units, u) === unit.id);
    return (
        <li>
            <div className={`po-pv-org-card ${depth === 0 ? "is-root" : ""}`}>
                <strong>{unit.name || "Unnamed unit"}</strong>
                {unit.role && <span>{unit.role}</span>}
                {unit.responsibility && <p>{unit.responsibility}</p>}
            </div>
            {kids.length > 0 && <ul className="po-pv-org-kids">{kids.map((k) => <OrgNode key={k.id} unit={k} units={units} depth={depth + 1} />)}</ul>}
        </li>
    );
}

function DraftPreview({ form, media, activeKey }) {
    const ref = useRef(null);
    const [ptype, setPtype] = useState("all");

    useEffect(() => {
        const box = ref.current;
        if (!box) return;
        const target = box.querySelector(`[data-sec="${activeKey}"]`);
        if (target) box.scrollTo({ top: Math.max(0, target.offsetTop - 12), behavior: "smooth" });
    }, [activeKey]);

    const mediaOf = (id) => media.find((m) => m.id === id);
    const hidden = (label) => <div className="po-pv-hidden">{label} is hidden from the page</div>;
    const head = (title, intro) => (
        <header className="po-pv-head">
            <h2>{title}</h2>
            {intro && <p>{intro}</p>}
        </header>
    );
    const cls = (key, dark) => `po-pv-sec ${dark ? "is-dark" : ""} ${activeKey === key ? "is-active" : ""}`;
    const hero = mediaOf(form.overview.mediaId) || mediaOf(form.seo.mediaId);
    const partnerTypes = PARTNER_TYPES.filter((t) => form.partners.items.some((p) => p.type === t.value));
    const partners = form.partners.items.filter((p) => ptype === "all" || p.type === ptype);
    const roots = form.governance.units.filter((u) => parentOf(form.governance.units, u) === null);

    return (
        <div className="po-pv-scroll" ref={ref}>
            <div className="po-pv">
                <section data-sec="overview" className={cls("overview")} style={hero && form.overview.visible ? { backgroundImage: `linear-gradient(180deg, rgba(11,26,40,.78), rgba(11,26,40,.96)), url("${thumbOf(hero)}")`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}>
                    {form.overview.visible ? (
                        <>
                            {head(form.seo.title || "About the Sandbox", form.overview.definition)}
                            <div className="po-pv-text">
                                <strong>Purpose</strong><p>{form.overview.purpose}</p>
                                <strong>Vision</strong><p className="po-pv-vision">{form.overview.vision}</p>
                            </div>
                            <ol className="po-pv-steps">
                                {form.overview.objectives.filter((o) => o.text.trim()).map((o, i) => (
                                    <li key={o.id}><b>{i + 1}</b><div><p>{o.text}</p></div></li>
                                ))}
                            </ol>
                        </>
                    ) : hidden("Overview")}
                </section>

                <section data-sec="why" className={cls("why", true)}>
                    {form.why.visible ? (
                        <>
                            {head("Why Perlis, Malaysia?", form.why.intro)}
                            <div className="po-pv-cards">
                                {form.why.reasons.map((r, i) => {
                                    const img = mediaOf(r.mediaId);
                                    return (
                                        <article key={r.id}>
                                            {img && <img className="po-pv-img" src={thumbOf(img)} alt="" />}
                                            <span className="po-pv-icon">{pad2(i + 1)}</span>
                                            <strong>{r.title || "Untitled reason"}</strong>
                                            <p>{r.text}</p>
                                        </article>
                                    );
                                })}
                            </div>
                        </>
                    ) : hidden("Why Perlis, Malaysia?")}
                </section>

                <section data-sec="governance" className={cls("governance")}>
                    {form.governance.visible ? (
                        <>
                            {head("Governance and Management", form.governance.intro)}
                            <ul className="po-pv-org">{roots.map((u) => <OrgNode key={u.id} unit={u} units={form.governance.units} depth={0} />)}</ul>
                        </>
                    ) : hidden("Governance and Management")}
                </section>

                <section data-sec="roadmap" className={cls("roadmap", true)}>
                    {form.roadmap.visible ? (
                        <>
                            {head("Development Roadmap", form.roadmap.intro)}
                            <ol className="po-pv-phases">
                                {form.roadmap.phases.map((ph, i) => (
                                    <li key={ph.id} className={`is-${ph.status}`}>
                                        <div className="po-pv-prog-top">
                                            <strong>Phase {pad2(i + 1)}: {ph.title || "Untitled phase"}</strong>
                                            <span className={`po-pill is-${ph.status === "completed" ? "ok" : ph.status === "current" ? "warn" : "off"}`}>{PHASE_STATUS.find((s) => s.value === ph.status).label}</span>
                                        </div>
                                        {(ph.start || ph.end) && <small>{formatDate(ph.start, false)}{ph.end ? ` to ${formatDate(ph.end, false)}` : ""}</small>}
                                        {ph.description && <p>{ph.description}</p>}
                                        {ph.milestones.length > 0 && (
                                            <ul className="po-pv-miles">
                                                {ph.milestones.map((m) => (
                                                    <li key={m.id} className={`is-${m.status}`}>
                                                        <i aria-hidden="true" />
                                                        <span><b>{m.title || "Untitled milestone"}</b>{m.description && <small>{m.description}</small>}</span>
                                                        {m.target && <time>{formatDate(m.target, false)}</time>}
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </li>
                                ))}
                            </ol>
                        </>
                    ) : hidden("Development Roadmap")}
                </section>

                <section data-sec="partners" className={cls("partners")}>
                    {form.partners.visible ? (
                        <>
                            {head("Partners and Collaborators", form.partners.intro)}
                            {partnerTypes.length > 1 && (
                                <div className="po-pv-chips">
                                    {[{ value: "all", label: "All" }, ...partnerTypes].map((t) => (
                                        <button key={t.value} type="button" className={ptype === t.value ? "is-on" : ""} onClick={() => setPtype(t.value)}>{t.label}</button>
                                    ))}
                                </div>
                            )}
                            <div className="po-pv-partners">
                                {partners.map((p) => {
                                    const logo = mediaOf(p.logoId);
                                    return (
                                        <article key={p.id}>
                                            <span className="po-pv-logo">{logo ? <img src={thumbOf(logo)} alt="" /> : initialsOf(p.name)}</span>
                                            <strong>{p.name || "Unnamed partner"}</strong>
                                            <small>{PARTNER_TYPES.find((t) => t.value === p.type)?.label}</small>
                                            {p.description && <p>{p.description}</p>}
                                        </article>
                                    );
                                })}
                            </div>
                        </>
                    ) : hidden("Partners and Collaborators")}
                </section>
            </div>
        </div>
    );
}

function LivePanel({ form, media, activeKey, liveUrl, reloadKey, onReload, onClose, status }) {
    const [view, setView] = useState("draft"); // draft | live
    const [device, setDevice] = useState("desktop");

    return (
        <aside className="po-preview" aria-label="Live preview">
            <header className="po-preview-head">
                <div className="po-seg" role="tablist" aria-label="Preview type">
                    <button type="button" role="tab" aria-selected={view === "draft"} className={view === "draft" ? "is-on" : ""} onClick={() => setView("draft")}>Draft preview</button>
                    <button type="button" role="tab" aria-selected={view === "live"} className={view === "live" ? "is-on" : ""} onClick={() => setView("live")}>Live site</button>
                </div>
                <div className="po-preview-tools">
                    <div className="po-seg is-small" role="group" aria-label="Device">
                        <button type="button" className={device === "desktop" ? "is-on" : ""} onClick={() => setDevice("desktop")}>Desktop</button>
                        <button type="button" className={device === "mobile" ? "is-on" : ""} onClick={() => setDevice("mobile")}>Mobile</button>
                    </div>
                    {view === "live" && <button type="button" className="po-iconbtn" aria-label="Reload live page" title="Reload live page" onClick={onReload}><Icon name="refresh" size={16} /></button>}
                    <a className="po-iconbtn" href={liveUrl} target="_blank" rel="noreferrer" aria-label="Open live page in a new tab" title="Open live page in a new tab"><Icon name="external" size={16} /></a>
                    <button type="button" className="po-iconbtn" aria-label="Hide preview" title="Hide preview" onClick={onClose}><Icon name="close" size={16} /></button>
                </div>
            </header>

            <p className="po-preview-note">
                {view === "draft"
                    ? "Built from what you see on screen, including unsaved edits. Layout is simplified."
                    : status === "published" ? "The real public page, as visitors see it now. It updates after you publish." : "The real public page. It will not show your changes until you publish."}
            </p>

            <div className={`po-preview-frame is-${device}`}>
                {view === "draft" ? (
                    <DraftPreview form={form} media={media} activeKey={activeKey} />
                ) : (
                    <iframe key={reloadKey} className="po-iframe" src={liveUrl} title="Live About page" loading="lazy" />
                )}
            </div>
        </aside>
    );
}

/* ====================================================================
   PAGE
==================================================================== */

export default function AdminPSBAbout() {
    const { props, url } = usePage();
    const live = Boolean(props.about?.content);
    const liveUrl = props.about?.liveUrl || props.about?.previewUrl || DEFAULT_LIVE_URL;

    const seed = useRef(
        live
            ? { content: props.about.content, meta: props.about.meta, catalog: props.about.catalog, history: props.about.history || [] }
            : { content: sampleContent, meta: sampleMeta, catalog: sampleCatalog, history: sampleHistory }
    ).current;

    const [saved, setSaved] = useState(() => clone(seed.content));
    const [form, setForm] = useState(() => clone(seed.content));
    const [meta, setMeta] = useState(seed.meta);
    const [localHistory, setLocalHistory] = useState(seed.history);
    const [mediaList, setMediaList] = useState(seed.catalog?.media || []);

    const media = live ? [...mediaList, ...(props.about.catalog?.media || []).filter((m) => !mediaList.some((x) => x.id === m.id))] : mediaList;
    const history = live ? props.about.history || [] : localHistory;

    const routeIndex = () => {
        const wanted = props.section || SECTIONS.find((s) => (url || "").includes(`/about/${s.route}`))?.route;
        return SECTIONS.findIndex((s) => s.route === wanted);
    };

    const [tab, setTab] = useState("content");
    const [active, setActive] = useState(() => Math.max(0, routeIndex()));
    const [showPreview, setShowPreview] = useState(true);
    const [reloadKey, setReloadKey] = useState(0);
    const [submitted, setSubmitted] = useState(false);
    const [busy, setBusy] = useState(false);
    const [dialog, setDialog] = useState(null); // { type: publish | schedule | unpublish | delete, ... }
    const [picker, setPicker] = useState(null);
    const [menu, setMenu] = useState(false);
    const [toast, setToast] = useState(null);
    const [scheduleAt, setScheduleAt] = useState("");
    const busyRef = useRef(false);
    const menuRef = useRef(null);

    /* when the sidebar link changes (e.g. Overview -> Governance), follow it */
    useEffect(() => {
        const i = routeIndex();
        if (i >= 0) { setActive(i); setTab("content"); }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.section, url]);

    useEffect(() => { if (live) setMeta(props.about.meta); }, [live, props.about?.meta]);

    const dirty = useMemo(() => !sameJson(form, saved), [form, saved]);
    const allErrors = useMemo(() => validate(form), [form]);
    const errors = useMemo(() => ({ ...(props.errors || {}), ...(submitted ? allErrors : {}) }), [props.errors, submitted, allErrors]);
    const errorCountFor = (key) => Object.keys(errors).filter((k) => sectionOfKey(k) === key).length;
    const totalErrors = Object.keys(allErrors).length;

    const changedKeys = useMemo(() => [...SECTIONS.map((s) => s.key), "seo"].filter((k) => !sameJson(form[k], saved[k])), [form, saved]);
    const changedLabels = changedKeys.map((k) => (k === "seo" ? "Page settings" : SECTIONS.find((s) => s.key === k).label));
    const unpublished = dirty || meta.hasUnpublishedChanges;
    const activeKey = SECTIONS[active].key;

    useEffect(() => {
        if (!toast) return undefined;
        const t = setTimeout(() => setToast(null), 5000);
        return () => clearTimeout(t);
    }, [toast]);

    useEffect(() => {
        const close = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenu(false); };
        document.addEventListener("mousedown", close);
        return () => document.removeEventListener("mousedown", close);
    }, []);

    /* warn before leaving with unsaved changes (moving between the five About links is allowed: same page) */
    useEffect(() => {
        const beforeUnload = (e) => { if (dirty) { e.preventDefault(); e.returnValue = ""; } };
        window.addEventListener("beforeunload", beforeUnload);
        const off = router.on("before", (event) => {
            const target = event?.detail?.visit?.url?.pathname || "";
            if (target.startsWith(`${BASE}/about`)) return undefined;
            if (dirty && !busyRef.current && !window.confirm("You have unsaved changes. Leave this page and discard them?")) return false;
            return undefined;
        });
        return () => { window.removeEventListener("beforeunload", beforeUnload); if (typeof off === "function") off(); };
    }, [dirty]);

    const edit = (fn) => setForm((f) => { const copy = clone(f); fn(copy); return copy; });
    const askDelete = (info) => setDialog({ type: "delete", ...info });
    const pickMedia = (opts) => setPicker(opts);
    const finishBusy = () => { setBusy(false); busyRef.current = false; };

    const addHistory = (action, label, changes = []) =>
        setLocalHistory((h) => [{ id: Date.now(), user: "You", action, label, at: new Date().toISOString(), changes }, ...h]);
    const diffs = () => changedLabels.map((l) => ({ field: l, from: "Previous version", to: "Updated" }));

    const jumpToFirstError = () => {
        const first = Object.keys(allErrors)[0];
        if (!first) return;
        const key = sectionOfKey(first);
        if (key === "seo") setTab("seo");
        else { setTab("content"); setActive(SECTIONS.findIndex((s) => s.key === key)); }
        setTimeout(() => document.querySelector(".po-editor .po-field.has-error")?.scrollIntoView({ behavior: "smooth", block: "center" }), 120);
    };

    /* ---- actions ---- */
    const saveDraft = () => {
        if (!dirty || busy) return;
        setBusy(true); busyRef.current = true;
        const done = () => {
            setSaved(clone(form));
            setMeta((m) => ({ ...m, hasUnpublishedChanges: m.status === "published" ? true : m.hasUnpublishedChanges, updatedBy: "You", updatedAt: new Date().toISOString() }));
            if (!live) addHistory("UPDATE", changedLabels.join(", ") || "About the Sandbox", diffs());
            setToast({ tone: "ok", text: totalErrors ? `Draft saved. ${totalErrors} field${totalErrors === 1 ? "" : "s"} still need attention before you can publish.` : "Draft saved. Visitors still see the published version." });
            finishBusy();
        };
        if (live) router.put(ENDPOINTS.save, { content: form }, { preserveScroll: true, onSuccess: done, onError: () => { finishBusy(); setSubmitted(true); setToast({ tone: "error", text: "The server rejected some values. Check the highlighted fields." }); } });
        else setTimeout(done, 350);
    };

    const startAction = (type) => {
        setMenu(false);
        if (type !== "unpublish") {
            setSubmitted(true);
            if (totalErrors) { setToast({ tone: "error", text: `Fix ${totalErrors} field${totalErrors === 1 ? "" : "s"} before publishing.` }); jumpToFirstError(); return; }
        }
        if (type === "schedule") setScheduleAt("");
        setDialog({ type });
    };

    const confirmAction = () => {
        const type = dialog.type;
        if (type === "schedule" && (!scheduleAt || new Date(scheduleAt).getTime() <= Date.now())) { setToast({ tone: "error", text: "Choose a date and time in the future." }); return; }
        setBusy(true); busyRef.current = true;
        const at = type === "schedule" ? new Date(scheduleAt).toISOString() : null;

        const done = () => {
            const now = new Date().toISOString();
            setSaved(clone(form));
            setMeta((m) => ({
                ...m,
                status: type === "unpublish" ? "draft" : type === "schedule" ? "scheduled" : "published",
                publishedAt: type === "publish" ? now : m.publishedAt,
                scheduledAt: type === "schedule" ? at : null,
                hasUnpublishedChanges: false,
                updatedBy: "You",
                updatedAt: now,
            }));
            if (!live) addHistory(type === "unpublish" ? "UNPUBLISH" : "PUBLISH", "About the Sandbox", type === "unpublish" ? [] : diffs());
            setDialog(null);
            setSubmitted(false);
            setReloadKey((k) => k + 1);
            setToast({ tone: "ok", text: type === "publish" ? "Published. Visitors now see these changes." : type === "schedule" ? `Scheduled for ${formatDate(at)}.` : "Unpublished. The About page is no longer public." });
            finishBusy();
        };
        const fail = () => { finishBusy(); setDialog(null); setToast({ tone: "error", text: "Something went wrong. Nothing was changed." }); };

        if (live) {
            const target = type === "publish" ? ENDPOINTS.publish : type === "schedule" ? ENDPOINTS.schedule : ENDPOINTS.unpublish;
            router.post(target, type === "unpublish" ? {} : { content: form, at }, { preserveScroll: true, onSuccess: done, onError: fail });
        } else setTimeout(done, 400);
    };

    const confirmDelete = () => {
        dialog.onConfirm();
        if (!live) addHistory("DELETE", `${SECTIONS[active].label}: ${dialog.what}`, [{ field: "Moved to Trash", from: dialog.what, to: "(deleted)" }]);
        setDialog(null);
        setToast({ tone: "ok", text: `“${dialog.what}” moved to Trash. It leaves the About page when you publish.` });
    };

    const uploadMedia = (file) => {
        const local = { id: Date.now(), name: file.name, type: "image", alt: "", size: `${(file.size / 1048576).toFixed(1)} MB`, url: URL.createObjectURL(file) };
        if (live) {
            router.post(ENDPOINTS.upload, { file }, { forceFormData: true, preserveScroll: true, onSuccess: () => setToast({ tone: "ok", text: `${file.name} uploaded.` }), onError: () => setToast({ tone: "error", text: "The upload failed. Try a smaller image." }) });
        } else {
            setMediaList((m) => [local, ...m]);
            setToast({ tone: "ok", text: `${file.name} added (sample data, not stored).` });
        }
    };

    /* Ctrl / Cmd + S saves the draft */
    useEffect(() => {
        const onKey = (e) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") { e.preventDefault(); saveDraft(); } };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    });

    const ctx = { form, edit, errors, media, askDelete, pickMedia };
    const Editor = [OverviewEditor, WhyEditor, GovernanceEditor, RoadmapEditor, PartnersEditor][active];

    const statusTone = meta.status === "published" ? "ok" : meta.status === "scheduled" ? "warn" : "off";
    const statusText = meta.status === "published" ? "Published" : meta.status === "scheduled" ? `Scheduled · ${formatDate(meta.scheduledAt)}` : "Draft";
    const deleteExtra = dialog?.type === "delete" ? dialog.extra : "";

    return (
        <Ctx.Provider value={ctx}>
            <div className="po">
                <div className="po-heading">
                    <div>
                        <h1>About the Sandbox</h1>
                        <p>Create, update and remove everything visitors read on the About the Sandbox page: overview, location, governance, roadmap and partners.</p>
                        <div className="po-status">
                            <span className={`po-pill is-${statusTone}`}>{statusText}</span>
                            {unpublished && meta.status !== "draft" && <span className="po-pill is-warn">{dirty ? "Unsaved changes" : "Changes not published yet"}</span>}
                            {meta.updatedAt && <small>Last edited {timeAgo(meta.updatedAt)} by {meta.updatedBy}</small>}
                        </div>
                    </div>

                    <div className="po-actions">
                        <button type="button" className={`po-btn-outline ${showPreview ? "is-on" : ""}`} onClick={() => setShowPreview((v) => !v)} aria-pressed={showPreview}><Icon name="panel" size={16} /> {showPreview ? "Hide preview" : "Show preview"}</button>
                        <button type="button" className="po-btn-outline" onClick={saveDraft} disabled={!dirty || busy}><Icon name="save" size={16} /> {busy && !dialog ? "Saving..." : "Save draft"}</button>
                        <button type="button" className="po-btn-yellow" onClick={() => startAction("publish")} disabled={busy || (!unpublished && meta.status === "published")}><Icon name="upload" size={16} /> Publish</button>
                        <div className="po-more" ref={menuRef}>
                            <button type="button" className="po-iconbtn is-round" aria-label="More publishing options" aria-haspopup="menu" aria-expanded={menu} onClick={() => setMenu((v) => !v)}><Icon name="more" size={18} /></button>
                            {menu && (
                                <div className="po-menu" role="menu">
                                    <button type="button" role="menuitem" onClick={() => startAction("schedule")}><Icon name="clock" size={16} /> Schedule publication</button>
                                    <button type="button" role="menuitem" disabled={meta.status === "draft"} onClick={() => startAction("unpublish")}><Icon name="unlink" size={16} /> Unpublish page</button>
                                    <a role="menuitem" href={liveUrl} target="_blank" rel="noreferrer"><Icon name="external" size={16} /> Open live page</a>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {!live && (
                    <p className="po-note"><Icon name="alert" size={16} /><span>Sample data. Every control works, but nothing is stored until your controller sends the <b>about</b> prop.</span></p>
                )}

                <div className="po-tabs" role="tablist" aria-label="About page editor">
                    {[["content", "Content"], ["seo", "Page settings"], ["history", "History"]].map(([key, label]) => (
                        <button key={key} type="button" role="tab" aria-selected={tab === key} className={tab === key ? "is-active" : ""} onClick={() => setTab(key)}>
                            {label}
                            {key === "seo" && errorCountFor("seo") > 0 && <span className="po-badge-error">{errorCountFor("seo")}</span>}
                            {key === "history" && <span className="po-badge">{history.length}</span>}
                        </button>
                    ))}
                </div>

                {tab === "content" && (
                    <>
                        <nav className="po-sections" aria-label="About page sections">
                            {SECTIONS.map((s, i) => {
                                const errs = errorCountFor(s.key);
                                return (
                                    <button key={s.key} type="button" className={`po-section-pill ${active === i ? "is-active" : ""}`} aria-current={active === i ? "true" : undefined} onClick={() => setActive(i)}>
                                        <span className="po-section-no">{i + 1}</span>
                                        <span className="po-section-text"><strong>{s.label}</strong><small>{form[s.key].visible ? countOf(form, s.key) : "Hidden from page"}</small></span>
                                        {errs > 0 ? <span className="po-badge-error" title={`${errs} to fix`}>{errs}</span> : changedKeys.includes(s.key) ? <span className="po-dot" title="Edited" /> : null}
                                    </button>
                                );
                            })}
                        </nav>

                        <div className={`po-split ${showPreview ? "has-preview" : ""}`}>
                            <div className="po-editor"><Editor /></div>
                            {showPreview && (
                                <LivePanel form={form} media={media} activeKey={activeKey} liveUrl={liveUrl} reloadKey={reloadKey} onReload={() => setReloadKey((k) => k + 1)} onClose={() => setShowPreview(false)} status={meta.status} />
                            )}
                        </div>
                    </>
                )}
                {tab === "seo" && <SeoPanel meta={meta} />}
                {tab === "history" && <HistoryPanel history={history} />}

                {dirty && (
                    <div className="po-savebar" role="region" aria-label="Unsaved changes">
                        <span className="po-savebar-text"><i /> {changedLabels.length} section{changedLabels.length === 1 ? "" : "s"} edited, not saved</span>
                        <div>
                            <button type="button" className="po-btn-ghost" onClick={() => { setForm(clone(saved)); setSubmitted(false); setToast({ tone: "info", text: "Changes discarded." }); }} disabled={busy}>Discard</button>
                            <button type="button" className="po-btn-yellow" onClick={saveDraft} disabled={busy}>{busy ? "Saving..." : "Save draft"}</button>
                        </div>
                    </div>
                )}

                {dialog?.type === "delete" && (
                    <div className="po-overlay" onMouseDown={(e) => e.target === e.currentTarget && setDialog(null)}>
                        <div className="po-dialog po-small" role="alertdialog" aria-modal="true" aria-labelledby="po-del-title">
                            <span className="po-dialog-icon is-danger"><Icon name="trash" size={22} /></span>
                            <h2 id="po-del-title">Delete “{dialog.what}”?</h2>
                            <p>It moves to Content Trash, where only the Super Admin can restore or purge it. It disappears from the About page when you publish.</p>
                            {deleteExtra && <p className="po-warn"><Icon name="alert" size={15} /> {deleteExtra}</p>}
                            <div className="po-dialog-actions">
                                <button type="button" className="po-btn-outline" onClick={() => setDialog(null)} autoFocus>Keep it</button>
                                <button type="button" className="po-btn-danger" onClick={confirmDelete}><Icon name="trash" size={15} /> Move to Trash</button>
                            </div>
                        </div>
                    </div>
                )}

                {["publish", "schedule", "unpublish"].includes(dialog?.type) && (
                    <div className="po-overlay" onMouseDown={(e) => e.target === e.currentTarget && !busy && setDialog(null)}>
                        <div className="po-dialog po-small" role="alertdialog" aria-modal="true" aria-labelledby="po-act-title">
                            <span className={`po-dialog-icon ${dialog.type === "unpublish" ? "is-danger" : ""}`}><Icon name={dialog.type === "schedule" ? "clock" : dialog.type === "unpublish" ? "unlink" : "upload"} size={22} /></span>
                            <h2 id="po-act-title">{dialog.type === "publish" ? "Publish the About page?" : dialog.type === "schedule" ? "Schedule publication" : "Unpublish the About page?"}</h2>
                            {dialog.type === "unpublish" ? (
                                <p>Visitors will no longer see the About page until you publish it again. Nothing is deleted.</p>
                            ) : (
                                <>
                                    <p>{dialog.type === "publish" ? "Visitors will see your changes straight away." : "Your changes go live automatically at the time you choose."}</p>
                                    {changedLabels.length > 0 ? (
                                        <ul className="po-dialog-list">{changedLabels.map((l) => <li key={l}><Icon name="check" size={14} /> {l}</li>)}</ul>
                                    ) : (
                                        <p className="po-hint">No new edits. This publishes the last saved draft.</p>
                                    )}
                                </>
                            )}
                            {dialog.type === "schedule" && (
                                <label className="po-field">
                                    <span className="po-field-top"><span className="po-label">Publish on</span></span>
                                    <input type="datetime-local" className="po-input" value={scheduleAt} min={new Date(Date.now() - new Date().getTimezoneOffset() * MIN).toISOString().slice(0, 16)} onChange={(e) => setScheduleAt(e.target.value)} />
                                </label>
                            )}
                            <div className="po-dialog-actions">
                                <button type="button" className="po-btn-outline" onClick={() => setDialog(null)} disabled={busy}>Cancel</button>
                                <button type="button" className={dialog.type === "unpublish" ? "po-btn-danger" : "po-btn-yellow"} onClick={confirmAction} disabled={busy}>
                                    {busy ? "Working..." : dialog.type === "publish" ? "Publish now" : dialog.type === "schedule" ? "Schedule" : "Unpublish"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {picker && <MediaPicker state={picker} media={media} onClose={() => setPicker(null)} onUpload={uploadMedia} />}

                {toast && (
                    <div className={`po-toast is-${toast.tone}`} role="status">
                        <Icon name={toast.tone === "error" ? "alert" : "check"} size={16} />
                        <span>{toast.text}</span>
                        <button type="button" aria-label="Dismiss" onClick={() => setToast(null)}><Icon name="close" size={14} /></button>
                    </div>
                )}
            </div>
        </Ctx.Provider>
    );
}

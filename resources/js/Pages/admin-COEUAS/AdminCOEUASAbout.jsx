import { createContext, useContext, useEffect, useId, useMemo, useRef, useState } from "react";
import { router, usePage } from "@inertiajs/react";
import "../../../css/admin-COEUAS-css/admin-about.css";

/* ====================================================================
   COE-UAS ADMIN → ABOUT EDITOR                    /admin/coeuas/about/*

   Site map 1.3 (COE-UAS workspace → "About"), one editor for all five modules:
     1  About COE-UAS (background, vision, mission, values) → page_sections (text, list)
     2  History and Milestones (2013 - 2026)                  → timeline_events
     3  Organisation and Leadership (org chart)               → org_chart_nodes (tree) + members
     4  Strategy and Development                              → strategy_items (4 areas)
     5  Awards and Recognition                                → awards (centre / member)
   Common screens from the document: edit, preview, publish / unpublish, schedule,
   reorder, delete to Trash, History tab (audit_logs for this record).
   Media is always chosen from media_assets (never stored inside the content).
   Members are chosen from the members table (never typed in by hand).

   SAMPLE DATA: the page works today (changes stay on screen only). Return an Inertia
   prop named `about` and it switches to LIVE mode:

   Inertia::render('admin-COEUAS/AdminCOEUASAbout', [
       'section' => 'overview',   // optional: overview | history | organisation | strategy | awards
       'about' => [
           'content' => [...],    // same shape as `sampleContent` below
           'meta'    => [...],    // status, publishedAt, scheduledAt, hasUnpublishedChanges, updatedBy, updatedAt
           'catalog' => ['media' => [], 'members' => []],
           'history' => [...],    // audit_logs rows for these records
           'previewUrl' => 'https://...',   // optional signed preview link of the public About page
       ],
   ]);

   Map the five sidebar routes (/admin/coeuas/about/overview, /history, /organisation,
   /strategy, /awards) to this same component. LIVE mode requests are in ENDPOINTS.
   The controller must write audit_logs and soft-delete (deleted_at) removed records.
==================================================================== */

const BASE = "/admin/coeuas"; // keep in sync with coeuasRoutes.js
const ENDPOINTS = {
    save: `${BASE}/about`, // PUT   { content }          save as draft
    publish: `${BASE}/about/publish`, // POST  { content }          save + publish now
    schedule: `${BASE}/about/schedule`, // POST  { content, at }      save + publish later
    unpublish: `${BASE}/about/unpublish`, // POST
    upload: `${BASE}/media/upload`, // POST  multipart { file }
};

const SECTIONS = [
    { key: "overview", route: "overview", label: "About COE-UAS", hint: "Background, vision, mission" },
    { key: "history", route: "history", label: "History and Milestones", hint: "Timeline, 2013 - 2026" },
    { key: "organisation", route: "organisation", label: "Organisation and Leadership", hint: "Org chart" },
    { key: "strategy", route: "strategy", label: "Strategy and Development", hint: "Four strategic areas" },
    { key: "awards", route: "awards", label: "Awards and Recognition", hint: "Centre and member awards" },
];

/* enums from the ERD */
const STRATEGY_AREAS = [
    { value: "rnd", label: "Research and development" },
    { value: "industry", label: "Industry engagement" },
    { value: "training", label: "Training and capacity building" },
    { value: "facilities_future", label: "Future facilities" },
];
const AWARD_SCOPES = [
    { value: "centre", label: "Centre" },
    { value: "member", label: "Member" },
];
const AWARD_TYPES = [
    { value: "award", label: "Award" },
    { value: "accreditation", label: "Accreditation" },
    { value: "certification", label: "Certification" },
];

const YEAR_MIN = 2013;
const YEAR_MAX = new Date().getFullYear();
const LIMITS = { values: 8 };

const MIN = 60 * 1000;
const NOW = Date.now();
const minsAgo = (m) => new Date(NOW - m * MIN).toISOString();
let counter = 0;
const uid = () => `n${Date.now().toString(36)}${(counter += 1)}`;

/* ------------------------------ sample data ------------------------------ */

const sampleContent = {
    overview: {
        visible: true,
        background:
            "The Centre of Excellence for Unmanned Aerial Systems (COE-UAS) brings together researchers, engineers and students to develop and apply unmanned aerial technology for national needs.",
        vision: "To be a leading regional centre for unmanned aerial systems research, innovation and training.",
        mission:
            "To carry out research with real impact, work closely with industry and agencies, and train the next generation of UAS specialists.",
        values: [
            { id: "v1", text: "Research that solves real problems" },
            { id: "v2", text: "Safety and responsibility in every operation" },
            { id: "v3", text: "Open collaboration with industry, government and academia" },
        ],
        mediaId: 2,
    },
    history: {
        visible: true,
        intro: "From a small research group to a national centre of excellence.",
        events: [
            { id: "h1", year: 2013, title: "Centre established", description: "COE-UAS is set up with its first research group and test facility.", isMajor: true, mediaId: null },
            { id: "h2", year: 2016, title: "First industry collaboration", description: "", isMajor: false, mediaId: null },
            { id: "h3", year: 2020, title: "Training programme launched", description: "Drone pilot and industry courses open to the public.", isMajor: true, mediaId: 3 },
            { id: "h4", year: 2025, title: "Featured in the Perlis Airspace Sandbox", description: "", isMajor: true, mediaId: null },
        ],
    },
    organisation: {
        visible: true,
        intro: "The people who lead and manage the centre.",
        nodes: [
            { id: "o1", parentId: null, memberId: 1, positionTitle: "Director", periodStart: 2022, periodEnd: "", isCurrent: true },
            { id: "o2", parentId: "o1", memberId: 2, positionTitle: "Deputy Director (Research)", periodStart: 2023, periodEnd: "", isCurrent: true },
            { id: "o3", parentId: "o1", memberId: 3, positionTitle: "Deputy Director (Industry and Training)", periodStart: 2023, periodEnd: "", isCurrent: true },
            { id: "o4", parentId: null, memberId: 4, positionTitle: "Director", periodStart: 2013, periodEnd: 2021, isCurrent: false },
        ],
    },
    strategy: {
        visible: true,
        intro: "Where the centre is heading and how it plans to get there.",
        items: [
            { id: "s1", area: "rnd", title: "Grow core research groups", description: "Strengthen platforms, autonomy and sensing research." },
            { id: "s2", area: "rnd", title: "Increase high-impact publications", description: "" },
            { id: "s3", area: "industry", title: "Industry solutions and case studies", description: "Turn research into services for survey, agriculture and security." },
            { id: "s4", area: "training", title: "Expand training and certification", description: "" },
            { id: "s5", area: "facilities_future", title: "Dedicated flight test hangar", description: "Planned facility for indoor and outdoor testing." },
        ],
    },
    awards: {
        visible: true,
        intro: "Recognition earned by the centre and its members.",
        items: [
            { id: "a1", title: "Excellence in Research Innovation", awardingBody: "National Innovation Council", year: 2022, scope: "centre", type: "award", memberId: null, mediaId: null, description: "" },
            { id: "a2", title: "Accredited Training Provider", awardingBody: "Civil Aviation Authority of Malaysia", year: 2024, scope: "centre", type: "accreditation", memberId: null, mediaId: null, description: "Approved to deliver drone pilot courses." },
            { id: "a3", title: "Best Paper Award", awardingBody: "International UAS Conference", year: 2023, scope: "member", type: "award", memberId: 2, mediaId: null, description: "" },
        ],
    },
    seo: {
        title: "About COE-UAS",
        description: "Background, history, leadership, strategy and awards of the Centre of Excellence for Unmanned Aerial Systems.",
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
        { id: 1, name: "coe-uas-logo.png", type: "image", alt: "COE-UAS logo", size: "0.1 MB", url: null },
        { id: 2, name: "centre-hangar.jpg", type: "image", alt: "Centre test hangar", size: "1.6 MB", url: null },
        { id: 3, name: "training-session.jpg", type: "image", alt: "Drone training session", size: "1.1 MB", url: null },
    ],
    members: [
        { id: 1, name: "Prof. Dr. Ahmad Zaki", designation: "Professor" },
        { id: 2, name: "Dr. Nurul Huda", designation: "Senior Lecturer" },
        { id: 3, name: "Ir. Dr. Faizal Karim", designation: "Associate Professor" },
        { id: 4, name: "Prof. Dr. Rohana Salleh", designation: "Professor" },
    ],
};

const sampleHistory = [
    { id: 3, user: "Aisyah Rahman", action: "PUBLISH", label: "About COE-UAS", at: minsAgo(60 * 26), changes: [{ field: "History and Milestones", from: "Previous version", to: "Updated" }] },
    { id: 2, user: "Aisyah Rahman", action: "UPDATE", label: "History and Milestones", at: minsAgo(60 * 27), changes: [] },
    { id: 1, user: "Hafiz Roslan", action: "CREATE", label: "Awards and Recognition", at: minsAgo(60 * 24 * 6), changes: [] },
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

const move = (list, from, to) => {
    if (to < 0 || to >= list.length) return;
    const [item] = list.splice(from, 1);
    list.splice(to, 0, item);
};

const labelOf = (list, value) => list.find((o) => o.value === value)?.label || value;
const toYear = (v) => (v === "" || v === null || v === undefined ? "" : Number(v));
const pad2 = (n) => String(n).padStart(2, "0");
const initialsOf = (name = "") => name.split(" ").filter((w) => /^[A-Za-z]/.test(w) && !/\.$/.test(w)).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "?";

/* org chart helpers (the ERD stores parent_id; array order is sort_order) */
const parentOf = (nodes, n) => (n.parentId && nodes.some((x) => x.id === n.parentId) ? n.parentId : null);
function flattenTree(nodes) {
    const out = [];
    const walk = (pid, depth) =>
        nodes.filter((n) => parentOf(nodes, n) === pid).forEach((n) => {
            out.push({ node: n, depth });
            walk(n.id, depth + 1);
        });
    walk(null, 0);
    return out;
}
function descendantsOf(nodes, id) {
    const found = new Set();
    const walk = (pid) => nodes.filter((n) => n.parentId === pid).forEach((n) => { found.add(n.id); walk(n.id); });
    walk(id);
    return found;
}

/* ------------------------------ validation ------------------------------- */

function validate(f) {
    const e = {};
    const need = (key, value, msg) => { if (!String(value ?? "").trim()) e[key] = msg; };
    const yearOk = (y) => Number.isInteger(y) && y >= YEAR_MIN && y <= YEAR_MAX;

    need("overview.background", f.overview.background, "Write the background of the centre.");
    need("overview.vision", f.overview.vision, "Write the vision.");
    need("overview.mission", f.overview.mission, "Write the mission.");
    f.overview.values.forEach((v) => need(`overview.val.${v.id}`, v.text, "Write the value or remove it."));

    f.history.events.forEach((ev) => {
        need(`history.${ev.id}.title`, ev.title, "Give the milestone a title.");
        if (!yearOk(Number(ev.year))) e[`history.${ev.id}.year`] = `Use a year from ${YEAR_MIN} to ${YEAR_MAX}.`;
    });

    f.organisation.nodes.forEach((n) => {
        need(`organisation.${n.id}.position`, n.positionTitle, "Add the position title.");
        if (n.periodStart !== "" && n.periodEnd !== "" && Number(n.periodEnd) < Number(n.periodStart)) e[`organisation.${n.id}.end`] = "The end year is before the start year.";
    });

    f.strategy.items.forEach((s) => need(`strategy.${s.id}.title`, s.title, "Give the item a title."));

    f.awards.items.forEach((a) => {
        need(`awards.${a.id}.title`, a.title, "Give the award a title.");
        need(`awards.${a.id}.body`, a.awardingBody, "Add the awarding body.");
        if (!Number.isInteger(Number(a.year)) || Number(a.year) < 1990 || Number(a.year) > YEAR_MAX + 1) e[`awards.${a.id}.year`] = "Enter a valid year.";
        if (a.scope === "member" && !a.memberId) e[`awards.${a.id}.member`] = "Choose the member who received it.";
    });

    if ((f.seo.title || "").length > 70) e["seo.title"] = "Keep the title under 70 characters.";
    if ((f.seo.description || "").length > 160) e["seo.description"] = "Keep the description under 160 characters.";
    need("seo.title", f.seo.title, "Add a page title.");
    return e;
}

const sectionOfKey = (key) => key.split(".")[0];

/* -------------------------------- icons ---------------------------------- */

function Icon({ name, size = 18 }) {
    const p = {
        plus: <path d="M12 5v14M5 12h14" />,
        trash: <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />,
        up: <path d="m6 14 6-6 6 6" />,
        down: <path d="m6 10 6 6 6-6" />,
        eye: (<><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></>),
        save: (<><path d="M5 3h11l4 4v14H5z" /><path d="M8 3v6h8M8 21v-7h8v7" /></>),
        upload: <path d="M12 16V4m0 0-4 4m4-4 4 4M4 20h16" />,
        clock: (<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>),
        unlink: <path d="m9 15 6-6M7 13l-2 2a4 4 0 0 0 6 6l2-2M17 11l2-2a4 4 0 0 0-6-6l-2 2M4 4l16 16" />,
        more: (<><circle cx="5" cy="12" r="1.2" /><circle cx="12" cy="12" r="1.2" /><circle cx="19" cy="12" r="1.2" /></>),
        alert: (<><path d="M12 3 2 20h20z" /><path d="M12 10v4M12 17h.01" /></>),
        check: <path d="m5 12 5 5 9-10" />,
        close: <path d="M18 6 6 18M6 6l12 12" />,
        image: (<><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" /></>),
        external: (<><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><path d="M15 3h6v6M10 14 21 3" /></>),
        corner: <path d="M5 4v8a3 3 0 0 0 3 3h11m-4-4 4 4-4 4" />,
        star: <path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z" />,
        sort: <path d="M7 4v16m0 0-3-3m3 3 3-3M17 20V4m0 0-3 3m3-3 3 3" />,
    }[name];
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            {p}
        </svg>
    );
}

/* ------------------------------ small parts ------------------------------ */

const Ctx = createContext(null);
const useCtx = () => useContext(Ctx);

function Field({ label, errorKey, value, onChange, textarea, max, hint, placeholder, type = "text", rows = 3, min, maxValue }) {
    const { errors } = useCtx();
    const errId = useId();
    const error = errorKey ? errors[errorKey] : null;
    const Tag = textarea ? "textarea" : "input";
    return (
        <label className={`ca-field ${error ? "has-error" : ""}`}>
            <span className="ca-field-top">
                <span>{label}</span>
                {max && <small className={(value || "").length > max ? "is-over" : ""}>{(value || "").length}/{max}</small>}
            </span>
            <Tag
                className="ca-input"
                type={textarea ? undefined : type}
                rows={textarea ? rows : undefined}
                min={type === "number" ? min : undefined}
                max={type === "number" ? maxValue : undefined}
                value={value ?? ""}
                placeholder={placeholder}
                aria-invalid={error ? "true" : undefined}
                aria-describedby={error ? errId : undefined}
                onChange={(e) => onChange(e.target.value)}
            />
            {hint && !error && <em className="ca-hint">{hint}</em>}
            {error && <em className="ca-error" id={errId}><Icon name="alert" size={13} /> {error}</em>}
        </label>
    );
}

function Select({ label, value, options, onChange, errorKey, empty }) {
    const { errors } = useCtx();
    const error = errorKey ? errors[errorKey] : null;
    return (
        <label className={`ca-field ${error ? "has-error" : ""}`}>
            <span className="ca-field-top"><span>{label}</span></span>
            <select className="ca-input" value={value ?? ""} onChange={(e) => onChange(e.target.value)}>
                {empty && <option value="">{empty}</option>}
                {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            {error && <em className="ca-error"><Icon name="alert" size={13} /> {error}</em>}
        </label>
    );
}

function MemberSelect({ label, value, onChange, errorKey, empty = "Not linked to a member" }) {
    const { members } = useCtx();
    return (
        <Select
            label={label}
            value={value ?? ""}
            errorKey={errorKey}
            empty={empty}
            options={members.map((m) => ({ value: String(m.id), label: m.name }))}
            onChange={(v) => onChange(v ? Number(v) : null)}
        />
    );
}

function VisibleToggle({ checked, onChange, label }) {
    return (
        <label className="ca-switch">
            <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
            <i aria-hidden="true" />
            <span>{label}</span>
        </label>
    );
}

function Mover({ index, count, onMove, onDelete, deleteLabel }) {
    return (
        <div className="ca-mover">
            <button type="button" className="ca-iconbtn" disabled={index === 0} onClick={() => onMove(index - 1)} aria-label="Move up"><Icon name="up" size={16} /></button>
            <button type="button" className="ca-iconbtn" disabled={index === count - 1} onClick={() => onMove(index + 1)} aria-label="Move down"><Icon name="down" size={16} /></button>
            <button type="button" className="ca-iconbtn is-danger" onClick={onDelete} aria-label={deleteLabel}><Icon name="trash" size={16} /></button>
        </div>
    );
}

function SectionHead({ title, text, visible, onVisible }) {
    return (
        <div className="ca-panel-head">
            <div>
                <h2>{title}</h2>
                <p>{text}</p>
            </div>
            <VisibleToggle checked={visible} onChange={onVisible} label={visible ? "Shown on the page" : "Hidden from the page"} />
        </div>
    );
}

function MediaSlot({ label, mediaId, onPick, onClear }) {
    const { media } = useCtx();
    const item = media.find((m) => m.id === mediaId);
    return (
        <div className="ca-media">
            <span className="ca-media-label">{label}</span>
            <div className="ca-media-box">
                <span className={`ca-thumb ${item ? "has-item" : ""}`}>{item?.url ? <img src={item.url} alt="" /> : <Icon name="image" size={20} />}</span>
                <span className="ca-media-text">
                    <strong>{item ? item.name : "Nothing selected"}</strong>
                    <small>{item ? item.alt || "No alt text yet" : "Choose from the Media Library"}</small>
                </span>
                <button type="button" className="ca-btn-small" onClick={onPick}>{item ? "Change" : "Choose"}</button>
                {item && <button type="button" className="ca-iconbtn" aria-label="Remove image" onClick={onClear}><Icon name="close" size={15} /></button>}
            </div>
        </div>
    );
}

function Chips({ options, value, onChange, counts, label }) {
    return (
        <div className="ca-chips" role="tablist" aria-label={label}>
            {options.map((t) => (
                <button key={t.value} type="button" role="tab" aria-selected={value === t.value} className={value === t.value ? "is-active" : ""} onClick={() => onChange(t.value)}>
                    {t.label}<b>{counts[t.value] ?? 0}</b>
                </button>
            ))}
        </div>
    );
}

/* ------------------------------- editors --------------------------------- */

function OverviewEditor() {
    const { form, edit, errors, askDelete, pickMedia } = useCtx();
    const o = form.overview;
    return (
        <>
            <SectionHead title="About COE-UAS" text="The story at the top of the About page: background, vision and mission of the centre." visible={o.visible} onVisible={(v) => edit((d) => { d.overview.visible = v; })} />
            <div className="ca-stack">
                <Field label="Background" textarea rows={4} errorKey="overview.background" value={o.background} onChange={(v) => edit((d) => { d.overview.background = v; })} />
                <Field label="Vision" textarea rows={3} errorKey="overview.vision" value={o.vision} onChange={(v) => edit((d) => { d.overview.vision = v; })} />
                <Field label="Mission" textarea rows={3} errorKey="overview.mission" value={o.mission} onChange={(v) => edit((d) => { d.overview.mission = v; })} />
            </div>

            <div className="ca-block">
                <div className="ca-block-head">
                    <div><h3>Core values</h3><small>{o.values.length} of {LIMITS.values}</small></div>
                    <button type="button" className="ca-btn-small" disabled={o.values.length >= LIMITS.values} onClick={() => edit((d) => { d.overview.values.push({ id: uid(), text: "" }); })}><Icon name="plus" size={15} /> Add value</button>
                </div>
                {o.values.length === 0 && <p className="ca-empty">No core values yet. This list is optional.</p>}
                <ol className="ca-list">
                    {o.values.map((v, i) => (
                        <li key={v.id} className="ca-row">
                            <span className="ca-no">{i + 1}</span>
                            <div className="ca-row-main">
                                <Field label={`Value ${i + 1}`} errorKey={`overview.val.${v.id}`} value={v.text} onChange={(t) => edit((d) => { d.overview.values[i].text = t; })} />
                            </div>
                            <Mover index={i} count={o.values.length} deleteLabel={`Delete value ${i + 1}`}
                                onMove={(to) => edit((d) => move(d.overview.values, i, to))}
                                onDelete={() => askDelete({ what: v.text || `Value ${i + 1}`, onConfirm: () => edit((d) => { d.overview.values.splice(i, 1); }) })} />
                        </li>
                    ))}
                </ol>
            </div>

            <MediaSlot label="About image" mediaId={o.mediaId} onPick={() => pickMedia({ type: "image", onSelect: (m) => edit((d) => { d.overview.mediaId = m.id; }) })} onClear={() => edit((d) => { d.overview.mediaId = null; })} />
        </>
    );
}

function HistoryEditor() {
    const { form, edit, askDelete, pickMedia } = useCtx();
    const h = form.history;
    const [filter, setFilter] = useState("all");
    const shown = h.events.map((ev, i) => ({ ev, i })).filter(({ ev }) => filter === "all" || ev.isMajor);
    const counts = { all: h.events.length, major: h.events.filter((e) => e.isMajor).length };
    const sorted = h.events.every((e, i, a) => i === 0 || Number(a[i - 1].year) <= Number(e.year));

    return (
        <>
            <SectionHead title="History and Milestones" text={`The timeline of the centre, ${YEAR_MIN} to ${YEAR_MAX}. Major milestones are highlighted on the public page.`} visible={h.visible} onVisible={(v) => edit((d) => { d.history.visible = v; })} />
            <Field label="Introduction" textarea rows={2} value={h.intro} onChange={(v) => edit((d) => { d.history.intro = v; })} />

            <div className="ca-block">
                <div className="ca-block-head">
                    <div><h3>Timeline</h3><small>{h.events.length} milestone{h.events.length === 1 ? "" : "s"}, {counts.major} major</small></div>
                    <div className="ca-actions">
                        <button type="button" className="ca-btn-small" disabled={sorted} onClick={() => edit((d) => { d.history.events.sort((a, b) => Number(a.year) - Number(b.year)); })}><Icon name="sort" size={15} /> Sort by year</button>
                        <button type="button" className="ca-btn-small" onClick={() => edit((d) => { d.history.events.push({ id: uid(), year: YEAR_MAX, title: "", description: "", isMajor: false, mediaId: null }); })}><Icon name="plus" size={15} /> Add milestone</button>
                    </div>
                </div>
                <Chips label="Filter milestones" value={filter} onChange={setFilter} counts={counts} options={[{ value: "all", label: "All" }, { value: "major", label: "Major only" }]} />
                {shown.length === 0 && <p className="ca-empty">No milestones to show.</p>}
                <ol className="ca-list">
                    {shown.map(({ ev, i }) => (
                        <li key={ev.id} className="ca-card">
                            <div className="ca-card-top">
                                <span className="ca-year">{ev.year || "----"}</span>
                                <strong>{ev.title || "New milestone"}</strong>
                                {ev.isMajor && <span className="ca-tag"><Icon name="star" size={12} /> Major</span>}
                                <Mover index={i} count={h.events.length} deleteLabel={`Delete ${ev.title || "milestone"}`}
                                    onMove={(to) => edit((d) => move(d.history.events, i, to))}
                                    onDelete={() => askDelete({ what: ev.title || "this milestone", onConfirm: () => edit((d) => { d.history.events.splice(i, 1); }) })} />
                            </div>
                            <div className="ca-grid-2 is-narrow-left">
                                <Field label="Year" type="number" min={YEAR_MIN} maxValue={YEAR_MAX} errorKey={`history.${ev.id}.year`} value={ev.year} onChange={(v) => edit((d) => { d.history.events[i].year = toYear(v); })} />
                                <Field label="Title" errorKey={`history.${ev.id}.title`} value={ev.title} onChange={(v) => edit((d) => { d.history.events[i].title = v; })} />
                            </div>
                            <Field label="Description (optional)" textarea rows={2} value={ev.description} onChange={(v) => edit((d) => { d.history.events[i].description = v; })} />
                            <div className="ca-grid-2">
                                <MediaSlot label="Image (optional)" mediaId={ev.mediaId} onPick={() => pickMedia({ type: "image", onSelect: (m) => edit((d) => { d.history.events[i].mediaId = m.id; }) })} onClear={() => edit((d) => { d.history.events[i].mediaId = null; })} />
                                <div className="ca-field-end"><VisibleToggle checked={ev.isMajor} onChange={(v) => edit((d) => { d.history.events[i].isMajor = v; })} label="Major milestone" /></div>
                            </div>
                        </li>
                    ))}
                </ol>
            </div>
        </>
    );
}

function OrganisationEditor() {
    const { form, edit, askDelete, members } = useCtx();
    const g = form.organisation;
    const rows = flattenTree(g.nodes);
    const nameOf = (id) => members.find((m) => m.id === id)?.name;

    const siblings = (n) => g.nodes.filter((x) => parentOf(g.nodes, x) === parentOf(g.nodes, n));
    const moveSibling = (n, dir) =>
        edit((d) => {
            const list = d.organisation.nodes;
            const sib = list.filter((x) => parentOf(list, x) === parentOf(list, n));
            const at = sib.findIndex((x) => x.id === n.id);
            const other = sib[at + dir];
            if (!other) return;
            const a = list.findIndex((x) => x.id === n.id);
            const b = list.findIndex((x) => x.id === other.id);
            [list[a], list[b]] = [list[b], list[a]];
        });

    const remove = (n) =>
        askDelete({
            what: n.positionTitle || "this position",
            note: g.nodes.some((x) => x.parentId === n.id) ? "Positions that report to it move up one level." : undefined,
            onConfirm: () =>
                edit((d) => {
                    const list = d.organisation.nodes;
                    list.forEach((x) => { if (x.parentId === n.id) x.parentId = n.parentId || null; });
                    d.organisation.nodes = list.filter((x) => x.id !== n.id);
                }),
        });

    const setNode = (id, patch) => edit((d) => { Object.assign(d.organisation.nodes.find((x) => x.id === id), patch); });

    return (
        <>
            <SectionHead title="Organisation and Leadership" text="The org chart. Each position can report to another position and can be linked to a member profile." visible={g.visible} onVisible={(v) => edit((d) => { d.organisation.visible = v; })} />
            <Field label="Introduction" textarea rows={2} value={g.intro} onChange={(v) => edit((d) => { d.organisation.intro = v; })} />

            <div className="ca-block">
                <div className="ca-block-head">
                    <div><h3>Positions</h3><small>{g.nodes.length} in the chart</small></div>
                    <button type="button" className="ca-btn-small" onClick={() => edit((d) => { d.organisation.nodes.push({ id: uid(), parentId: d.organisation.nodes.find((x) => !x.parentId && x.isCurrent)?.id || null, memberId: null, positionTitle: "", periodStart: YEAR_MAX, periodEnd: "", isCurrent: true }); })}><Icon name="plus" size={15} /> Add position</button>
                </div>
                {g.nodes.length === 0 && <p className="ca-empty">No positions yet.</p>}
                <ol className="ca-list">
                    {rows.map(({ node: n, depth }) => {
                        const blocked = descendantsOf(g.nodes, n.id);
                        const index = siblings(n).findIndex((x) => x.id === n.id);
                        return (
                            <li key={n.id} className="ca-card ca-unit" style={{ "--depth": Math.min(depth, 4) }}>
                                <div className="ca-card-top">
                                    {depth > 0 && <span className="ca-branch" aria-hidden="true"><Icon name="corner" size={16} /></span>}
                                    <strong>{n.positionTitle || "New position"}{nameOf(n.memberId) ? ` · ${nameOf(n.memberId)}` : ""}</strong>
                                    <span className={`ca-pill ${n.isCurrent ? "is-ok" : "is-off"}`}>{n.isCurrent ? "Current" : "Former"}</span>
                                    <small>{depth === 0 ? "Top level" : `Level ${depth + 1}`}</small>
                                    <Mover index={index} count={siblings(n).length} deleteLabel={`Delete ${n.positionTitle || "position"}`} onMove={(to) => moveSibling(n, to - index)} onDelete={() => remove(n)} />
                                </div>
                                <div className="ca-grid-2">
                                    <Field label="Position title" errorKey={`organisation.${n.id}.position`} value={n.positionTitle} onChange={(v) => setNode(n.id, { positionTitle: v })} />
                                    <MemberSelect label="Member" value={n.memberId} empty="Vacant or not a member" onChange={(v) => setNode(n.id, { memberId: v })} />
                                </div>
                                <div className="ca-grid-3 is-even">
                                    <label className="ca-field">
                                        <span className="ca-field-top"><span>Reports to</span></span>
                                        <select className="ca-input" value={n.parentId || ""} onChange={(e) => setNode(n.id, { parentId: e.target.value || null })}>
                                            <option value="">Nobody (top level)</option>
                                            {g.nodes.filter((x) => x.id !== n.id && !blocked.has(x.id)).map((x) => <option key={x.id} value={x.id}>{x.positionTitle || "Unnamed position"}</option>)}
                                        </select>
                                    </label>
                                    <Field label="From (year)" type="number" min={YEAR_MIN} maxValue={YEAR_MAX} value={n.periodStart} onChange={(v) => setNode(n.id, { periodStart: toYear(v) })} />
                                    <Field label="Until (year)" type="number" min={YEAR_MIN} maxValue={YEAR_MAX} errorKey={`organisation.${n.id}.end`} value={n.periodEnd} onChange={(v) => setNode(n.id, { periodEnd: toYear(v) })} hint="Leave empty if ongoing" />
                                </div>
                                <VisibleToggle checked={n.isCurrent} onChange={(v) => setNode(n.id, { isCurrent: v, periodEnd: v ? "" : n.periodEnd })} label="Current holder of this position" />
                            </li>
                        );
                    })}
                </ol>
            </div>
        </>
    );
}

function StrategyEditor() {
    const { form, edit, askDelete } = useCtx();
    const s = form.strategy;
    const [filter, setFilter] = useState("all");
    const counts = { all: s.items.length };
    STRATEGY_AREAS.forEach((a) => { counts[a.value] = s.items.filter((x) => x.area === a.value).length; });
    const shown = s.items.map((it, i) => ({ it, i })).filter(({ it }) => filter === "all" || it.area === filter);

    return (
        <>
            <SectionHead title="Strategy and Development" text="Plans grouped into four areas. The public page shows one block per area." visible={s.visible} onVisible={(v) => edit((d) => { d.strategy.visible = v; })} />
            <Field label="Introduction" textarea rows={2} value={s.intro} onChange={(v) => edit((d) => { d.strategy.intro = v; })} />

            <div className="ca-block">
                <div className="ca-block-head">
                    <div><h3>Strategy items</h3><small>{s.items.length} in total</small></div>
                    <button type="button" className="ca-btn-small" onClick={() => edit((d) => { d.strategy.items.push({ id: uid(), area: filter === "all" ? "rnd" : filter, title: "", description: "" }); })}><Icon name="plus" size={15} /> Add item</button>
                </div>
                <Chips label="Filter by area" value={filter} onChange={setFilter} counts={counts} options={[{ value: "all", label: "All" }, ...STRATEGY_AREAS]} />
                {shown.length === 0 && <p className="ca-empty">No items in this area yet.</p>}
                <ol className="ca-list">
                    {shown.map(({ it, i }) => (
                        <li key={it.id} className="ca-card">
                            <div className="ca-card-top">
                                <span className="ca-no">{i + 1}</span>
                                <strong>{it.title || "New item"}</strong>
                                <span className="ca-pill">{labelOf(STRATEGY_AREAS, it.area)}</span>
                                <Mover index={i} count={s.items.length} deleteLabel={`Delete ${it.title || "item"}`}
                                    onMove={(to) => edit((d) => move(d.strategy.items, i, to))}
                                    onDelete={() => askDelete({ what: it.title || "this item", onConfirm: () => edit((d) => { d.strategy.items.splice(i, 1); }) })} />
                            </div>
                            <div className="ca-grid-2 is-wide-right">
                                <Select label="Area" value={it.area} options={STRATEGY_AREAS} onChange={(v) => edit((d) => { d.strategy.items[i].area = v; })} />
                                <Field label="Title" errorKey={`strategy.${it.id}.title`} value={it.title} onChange={(v) => edit((d) => { d.strategy.items[i].title = v; })} />
                            </div>
                            <Field label="Description (optional)" textarea rows={2} value={it.description} onChange={(v) => edit((d) => { d.strategy.items[i].description = v; })} />
                        </li>
                    ))}
                </ol>
            </div>
        </>
    );
}

function AwardsEditor() {
    const { form, edit, askDelete, pickMedia, members } = useCtx();
    const a = form.awards;
    const [filter, setFilter] = useState("all");
    const counts = { all: a.items.length, centre: a.items.filter((x) => x.scope === "centre").length, member: a.items.filter((x) => x.scope === "member").length };
    const shown = a.items.map((it, i) => ({ it, i })).filter(({ it }) => filter === "all" || it.scope === filter);
    const sorted = a.items.every((x, i, arr) => i === 0 || Number(arr[i - 1].year) >= Number(x.year));

    return (
        <>
            <SectionHead title="Awards and Recognition" text="Awards, accreditations and certifications earned by the centre or by its members." visible={a.visible} onVisible={(v) => edit((d) => { d.awards.visible = v; })} />
            <Field label="Introduction" textarea rows={2} value={a.intro} onChange={(v) => edit((d) => { d.awards.intro = v; })} />

            <div className="ca-block">
                <div className="ca-block-head">
                    <div><h3>Awards</h3><small>{a.items.length} in total</small></div>
                    <div className="ca-actions">
                        <button type="button" className="ca-btn-small" disabled={sorted} onClick={() => edit((d) => { d.awards.items.sort((x, y) => Number(y.year) - Number(x.year)); })}><Icon name="sort" size={15} /> Newest first</button>
                        <button type="button" className="ca-btn-small" onClick={() => edit((d) => { d.awards.items.push({ id: uid(), title: "", awardingBody: "", year: YEAR_MAX, scope: filter === "member" ? "member" : "centre", type: "award", memberId: null, mediaId: null, description: "" }); })}><Icon name="plus" size={15} /> Add award</button>
                    </div>
                </div>
                <Chips label="Filter by scope" value={filter} onChange={setFilter} counts={counts} options={[{ value: "all", label: "All" }, ...AWARD_SCOPES]} />
                {shown.length === 0 && <p className="ca-empty">Nothing here yet.</p>}
                <ol className="ca-list">
                    {shown.map(({ it, i }) => (
                        <li key={it.id} className="ca-card">
                            <div className="ca-card-top">
                                <span className="ca-year">{it.year || "----"}</span>
                                <strong>{it.title || "New award"}</strong>
                                <span className="ca-pill">{labelOf(AWARD_TYPES, it.type)}</span>
                                <Mover index={i} count={a.items.length} deleteLabel={`Delete ${it.title || "award"}`}
                                    onMove={(to) => edit((d) => move(d.awards.items, i, to))}
                                    onDelete={() => askDelete({ what: it.title || "this award", onConfirm: () => edit((d) => { d.awards.items.splice(i, 1); }) })} />
                            </div>
                            <div className="ca-grid-2">
                                <Field label="Title" errorKey={`awards.${it.id}.title`} value={it.title} onChange={(v) => edit((d) => { d.awards.items[i].title = v; })} />
                                <Field label="Awarding body" errorKey={`awards.${it.id}.body`} value={it.awardingBody} onChange={(v) => edit((d) => { d.awards.items[i].awardingBody = v; })} />
                            </div>
                            <div className="ca-grid-4">
                                <Field label="Year" type="number" min={1990} maxValue={YEAR_MAX + 1} errorKey={`awards.${it.id}.year`} value={it.year} onChange={(v) => edit((d) => { d.awards.items[i].year = toYear(v); })} />
                                <Select label="Type" value={it.type} options={AWARD_TYPES} onChange={(v) => edit((d) => { d.awards.items[i].type = v; })} />
                                <Select label="Given to" value={it.scope} options={AWARD_SCOPES} onChange={(v) => edit((d) => { d.awards.items[i].scope = v; if (v === "centre") d.awards.items[i].memberId = null; })} />
                                {it.scope === "member" ? (
                                    <MemberSelect label="Member" empty="Choose a member" errorKey={`awards.${it.id}.member`} value={it.memberId} onChange={(v) => edit((d) => { d.awards.items[i].memberId = v; })} />
                                ) : (
                                    <div className="ca-field"><span className="ca-field-top"><span>Member</span></span><span className="ca-input is-readonly">The whole centre</span></div>
                                )}
                            </div>
                            <Field label="Description (optional)" textarea rows={2} value={it.description} onChange={(v) => edit((d) => { d.awards.items[i].description = v; })} />
                            <MediaSlot label="Photo or certificate (optional)" mediaId={it.mediaId} onPick={() => pickMedia({ type: "image", onSelect: (m) => edit((d) => { d.awards.items[i].mediaId = m.id; }) })} onClear={() => edit((d) => { d.awards.items[i].mediaId = null; })} />
                        </li>
                    ))}
                </ol>
            </div>
        </>
    );
}

/* --------------------------- other tabs / modals -------------------------- */

function SeoPanel() {
    const { form, edit, pickMedia } = useCtx();
    return (
        <div className="ca-panel ca-narrow">
            <div className="ca-panel-head"><div><h2>Page settings</h2><p>How the About page appears in search results and when shared.</p></div></div>
            <div className="ca-stack">
                <Field label="Page title" max={70} errorKey="seo.title" value={form.seo.title} onChange={(v) => edit((d) => { d.seo.title = v; })} />
                <Field label="Description" textarea rows={3} max={160} errorKey="seo.description" value={form.seo.description} onChange={(v) => edit((d) => { d.seo.description = v; })} />
                <MediaSlot label="Share image" mediaId={form.seo.mediaId} onPick={() => pickMedia({ type: "image", onSelect: (m) => edit((d) => { d.seo.mediaId = m.id; }) })} onClear={() => edit((d) => { d.seo.mediaId = null; })} />
            </div>
        </div>
    );
}

const ACTION_TONE = { CREATE: "is-new", UPDATE: "is-info", PUBLISH: "is-ok", UNPUBLISH: "is-warn", DELETE: "is-danger", RESTORE: "is-ok" };

function HistoryPanel({ history }) {
    return (
        <div className="ca-panel ca-narrow">
            <div className="ca-panel-head"><div><h2>History</h2><p>Every change to this page, from the audit log.</p></div></div>
            {history.length === 0 && <p className="ca-empty">Nothing recorded yet.</p>}
            <ol className="ca-history">
                {history.map((h) => (
                    <li key={h.id}>
                        <span className={`ca-pill ${ACTION_TONE[h.action] || "is-info"}`}>{h.action}</span>
                        <div>
                            <strong>{h.label}</strong>
                            <small>{h.user} · {timeAgo(h.at)}</small>
                            {h.changes?.length > 0 && <ul>{h.changes.map((c, i) => <li key={i}>{c.field}: {c.from} → {c.to}</li>)}</ul>}
                        </div>
                    </li>
                ))}
            </ol>
        </div>
    );
}

function MediaPicker({ state, media, onClose, onUpload }) {
    const fileRef = useRef(null);
    const titleId = useId();
    const list = media.filter((m) => !state.type || m.type === state.type);
    return (
        <div className="ca-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
            <div className="ca-dialog" role="dialog" aria-modal="true" aria-labelledby={titleId}>
                <div className="ca-dialog-head">
                    <h2 id={titleId}>Media Library</h2>
                    <button type="button" className="ca-iconbtn" aria-label="Close" onClick={onClose}><Icon name="close" size={16} /></button>
                </div>
                <div className="ca-media-grid">
                    {list.map((m) => (
                        <button key={m.id} type="button" className="ca-media-item" onClick={() => { state.onSelect(m); onClose(); }}>
                            <span className="ca-media-preview">{m.url ? <img src={m.url} alt="" /> : <Icon name="image" size={26} />}</span>
                            <strong>{m.name}</strong>
                            <small>{m.size}</small>
                        </button>
                    ))}
                    {list.length === 0 && <p className="ca-empty">The library has no images yet.</p>}
                </div>
                <div className="ca-dialog-actions">
                    <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => { if (e.target.files[0]) onUpload(e.target.files[0]); e.target.value = ""; }} />
                    <button type="button" className="ca-btn-outline" onClick={() => fileRef.current?.click()}><Icon name="upload" size={15} /> Upload new</button>
                    <button type="button" className="ca-btn-dark" onClick={onClose}>Done</button>
                </div>
            </div>
        </div>
    );
}

/* ---------------------- full-page preview (public look) ---------------------- */

const SITE_NAV = ["Home", "About", "People", "Research and Innovation", "Publications", "Facilities", "Engagement", "Contact"];
const DEVICES = [
    { key: "desktop", label: "Desktop", width: null },
    { key: "tablet", label: "Tablet", width: 820 },
    { key: "mobile", label: "Mobile", width: 390 },
];

function OrgNode({ node, nodes, depth, nameOf }) {
    const kids = nodes.filter((n) => parentOf(nodes, n) === node.id);
    const name = nameOf(node.memberId);
    const period = node.periodStart || node.periodEnd ? `${node.periodStart || ""}${node.isCurrent ? " to present" : node.periodEnd ? ` to ${node.periodEnd}` : ""}` : "";
    return (
        <li className="cv-org-item">
            <div className={`cv-org-card ${depth === 0 ? "is-root" : ""} ${node.isCurrent ? "" : "is-former"}`}>
                <span>{node.positionTitle || "Untitled position"}{node.isCurrent ? "" : " (former)"}</span>
                <b>{name || "Vacant"}</b>
                {period && <p>{period}</p>}
            </div>
            {kids.length > 0 && (
                <ul className="cv-org-kids">
                    {kids.map((k) => <OrgNode key={k.id} node={k} nodes={nodes} depth={depth + 1} nameOf={nameOf} />)}
                </ul>
            )}
        </li>
    );
}

function PreviewModal({ form: f, media, members, onClose, previewUrl }) {
    const [device, setDevice] = useState("desktop");
    const imageOf = (id) => media.find((m) => m.id === id)?.url || null;
    const nameOf = (id) => members.find((m) => m.id === id)?.name || "";
    const width = DEVICES.find((d) => d.key === device).width;

    useEffect(() => {
        const onKey = (e) => e.key === "Escape" && onClose();
        document.addEventListener("keydown", onKey);
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
    }, [onClose]);

    const hidden = SECTIONS.filter((s) => !f[s.key].visible).map((s) => s.label);
    const order = SECTIONS.filter((s) => f[s.key].visible).map((s) => s.key);
    const num = (key) => pad2(order.indexOf(key) + 1);
    const heroImg = imageOf(f.overview.mediaId) || imageOf(f.seo.mediaId);
    const roots = f.organisation.nodes.filter((n) => parentOf(f.organisation.nodes, n) === null);
    const events = [...f.history.events].sort((a, b) => Number(a.year) - Number(b.year));
    const awards = [...f.awards.items].sort((a, b) => Number(b.year) - Number(a.year));
    const areas = STRATEGY_AREAS.filter((a) => f.strategy.items.some((s) => s.area === a.value));

    return (
        <div className="cv-overlay" role="dialog" aria-modal="true" aria-label="Page preview">
            <div className="cv-bar">
                <div className="cv-bar-left">
                    <span className="cv-live"><i /> Preview</span>
                    <small>Your current edits, not the live page.{hidden.length > 0 && ` Hidden: ${hidden.join(", ")}.`}</small>
                </div>
                <div className="cv-devices" role="tablist" aria-label="Screen size">
                    {DEVICES.map((d) => (
                        <button key={d.key} type="button" role="tab" aria-selected={device === d.key} className={device === d.key ? "is-on" : ""} onClick={() => setDevice(d.key)}>{d.label}</button>
                    ))}
                </div>
                <div className="cv-bar-right">
                    {previewUrl && <a className="cv-bar-btn" href={previewUrl} target="_blank" rel="noreferrer">Open saved preview</a>}
                    <button type="button" className="cv-bar-btn" onClick={onClose}>Close <kbd>Esc</kbd></button>
                </div>
            </div>

            <div className="cv-stage">
                <div className={`cv-frame is-${device}`} style={width ? { width } : undefined}>
                    <div className="cv">
                        <header className="cv-nav">
                            <b className="cv-brand"><i />COE-UAS</b>
                            <nav aria-label="Site (preview)">
                                {SITE_NAV.map((n) => <span key={n} className={n === "About" ? "is-on" : ""}>{n}</span>)}
                            </nav>
                            <span className="cv-nav-cta">Contact us</span>
                        </header>

                        <section className="cv-hero">
                            {heroImg && <img className="cv-hero-img" src={heroImg} alt="" />}
                            <div className="cv-wrap">
                                <p className="cv-kicker"><span>About</span> The Centre</p>
                                <h1>{f.seo.title || "About COE-UAS"}</h1>
                                {f.overview.visible && f.overview.background && <p className="cv-lede">{f.overview.background}</p>}
                                <div className="cv-hero-links">
                                    {SECTIONS.filter((s) => f[s.key].visible).map((s) => <span key={s.key}>{s.label}</span>)}
                                </div>
                            </div>
                        </section>

                        {f.overview.visible && (
                            <section className="cv-sec cv-sec--light">
                                <div className="cv-wrap">
                                    <p className="cv-kicker"><span>{num("overview")}</span> About COE-UAS</p>
                                    <div className="cv-split">
                                        <div className="cv-vm">
                                            <div className="cv-box"><small>Vision</small><p>{f.overview.vision}</p></div>
                                            <div className="cv-box is-dark"><small>Mission</small><p>{f.overview.mission}</p></div>
                                        </div>
                                        {f.overview.values.some((v) => v.text.trim()) && (
                                            <div>
                                                <h2>Our values</h2>
                                                <ol className="cv-values">
                                                    {f.overview.values.filter((v) => v.text.trim()).map((v, i) => <li key={v.id}><span>{pad2(i + 1)}</span>{v.text}</li>)}
                                                </ol>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </section>
                        )}

                        {f.history.visible && (
                            <section className="cv-sec cv-sec--dark">
                                <div className="cv-wrap">
                                    <p className="cv-kicker"><span>{num("history")}</span> {YEAR_MIN} to {YEAR_MAX}</p>
                                    <h2>History and Milestones</h2>
                                    {f.history.intro && <p className="cv-lede">{f.history.intro}</p>}
                                    <ol className="cv-timeline">
                                        {events.map((ev) => {
                                            const img = imageOf(ev.mediaId);
                                            return (
                                                <li key={ev.id} className={ev.isMajor ? "is-major" : ""}>
                                                    <time>{ev.year}</time>
                                                    <div>
                                                        <h3>{ev.title || "Untitled milestone"}</h3>
                                                        {ev.description && <p>{ev.description}</p>}
                                                        {img && <img src={img} alt="" />}
                                                    </div>
                                                </li>
                                            );
                                        })}
                                    </ol>
                                </div>
                            </section>
                        )}

                        {f.organisation.visible && (
                            <section className="cv-sec cv-sec--light">
                                <div className="cv-wrap">
                                    <p className="cv-kicker"><span>{num("organisation")}</span> Structure</p>
                                    <h2>Organisation and Leadership</h2>
                                    {f.organisation.intro && <p className="cv-lede">{f.organisation.intro}</p>}
                                    <ul className="cv-org">
                                        {roots.map((n) => <OrgNode key={n.id} node={n} nodes={f.organisation.nodes} depth={0} nameOf={nameOf} />)}
                                    </ul>
                                </div>
                            </section>
                        )}

                        {f.strategy.visible && (
                            <section className="cv-sec cv-sec--accent">
                                <div className="cv-wrap">
                                    <p className="cv-kicker"><span>{num("strategy")}</span> Direction</p>
                                    <h2>Strategy and Development</h2>
                                    {f.strategy.intro && <p className="cv-lede">{f.strategy.intro}</p>}
                                    <div className="cv-areas">
                                        {areas.map((a) => (
                                            <div key={a.value} className="cv-area">
                                                <h3>{a.label}</h3>
                                                <ul>
                                                    {f.strategy.items.filter((s) => s.area === a.value).map((s) => (
                                                        <li key={s.id}><b>{s.title || "Untitled item"}</b>{s.description && <p>{s.description}</p>}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </section>
                        )}

                        {f.awards.visible && (
                            <section className="cv-sec cv-sec--light">
                                <div className="cv-wrap">
                                    <p className="cv-kicker"><span>{num("awards")}</span> Recognition</p>
                                    <h2>Awards and Recognition</h2>
                                    {f.awards.intro && <p className="cv-lede">{f.awards.intro}</p>}
                                    <ul className="cv-awards">
                                        {awards.map((a) => {
                                            const img = imageOf(a.mediaId);
                                            return (
                                                <li key={a.id} className="cv-award">
                                                    {img && <img src={img} alt="" />}
                                                    <small>{a.year} · {labelOf(AWARD_TYPES, a.type)}</small>
                                                    <h3>{a.title || "Untitled award"}</h3>
                                                    <span>{a.awardingBody}</span>
                                                    <em>{a.scope === "member" ? nameOf(a.memberId) || "Member" : "COE-UAS"}</em>
                                                    {a.description && <p>{a.description}</p>}
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </div>
                            </section>
                        )}

                        <footer className="cv-foot">
                            <div className="cv-wrap">
                                <h2>Work with us</h2>
                                <span className="cv-nav-cta">Contact us</span>
                            </div>
                        </footer>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* -------------------------------- the page -------------------------------- */

export default function AdminCOEUASAbout() {
    const { props, url } = usePage();
    const live = Boolean(props.about?.content);
    const dialogTitleId = useId();

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

    const history = live ? props.about.history || [] : localHistory;

    const [tab, setTab] = useState("content");
    const [active, setActive] = useState(() => {
        const wanted = props.section || SECTIONS.find((s) => (url || "").includes(`/about/${s.route}`))?.route;
        const i = SECTIONS.findIndex((s) => s.route === wanted);
        return i >= 0 ? i : 0;
    });
    const [submitted, setSubmitted] = useState(false);
    const [busy, setBusy] = useState(false);
    const [dialog, setDialog] = useState(null); // { type: publish | schedule | unpublish | delete, ... }
    const [picker, setPicker] = useState(null);
    const [preview, setPreview] = useState(false);
    const [menu, setMenu] = useState(false);
    const [toast, setToast] = useState(null);
    const [scheduleAt, setScheduleAt] = useState("");
    const busyRef = useRef(false);
    const menuRef = useRef(null);

    /* when the sidebar link changes (e.g. About -> History), follow it */
    useEffect(() => {
        const wanted = props.section || SECTIONS.find((s) => (url || "").includes(`/about/${s.route}`))?.route;
        const i = SECTIONS.findIndex((s) => s.route === wanted);
        if (i >= 0) { setActive(i); setTab("content"); }
    }, [props.section, url]);

    /* live mode: follow what Laravel sends back after each save */
    useEffect(() => { if (live) setMeta(props.about.meta); }, [live, props.about?.meta]);

    const dirty = useMemo(() => !sameJson(form, saved), [form, saved]);
    const allErrors = useMemo(() => validate(form), [form]);
    const errors = useMemo(() => ({ ...(props.errors || {}), ...(submitted ? allErrors : {}) }), [props.errors, submitted, allErrors]);
    const errorCountFor = (key) => Object.keys(errors).filter((k) => sectionOfKey(k) === key).length;
    const totalErrors = Object.keys(allErrors).length;

    const changedKeys = useMemo(() => [...SECTIONS.map((s) => s.key), "seo"].filter((k) => !sameJson(form[k], saved[k])), [form, saved]);
    const changedLabels = changedKeys.map((k) => (k === "seo" ? "Page settings" : SECTIONS.find((s) => s.key === k).label));
    const unpublished = dirty || meta.hasUnpublishedChanges;

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
        setTimeout(() => document.querySelector(".ca-field.has-error")?.scrollIntoView({ behavior: "smooth", block: "center" }), 120);
    };

    /* ---- actions ---- */
    const saveDraft = () => {
        if (!dirty || busy) return;
        setBusy(true); busyRef.current = true;
        const done = () => {
            setSaved(clone(form));
            setMeta((m) => ({ ...m, hasUnpublishedChanges: m.status === "published" ? true : m.hasUnpublishedChanges, updatedBy: "You", updatedAt: new Date().toISOString() }));
            if (!live) addHistory("UPDATE", changedLabels.join(", ") || "About COE-UAS", diffs());
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
            if (!live) addHistory(type === "unpublish" ? "UNPUBLISH" : "PUBLISH", "About COE-UAS", type === "unpublish" ? [] : diffs());
            setDialog(null);
            setSubmitted(false);
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
        setToast({ tone: "ok", text: `“${dialog.what}” moved to Trash. It leaves the About page when you publish.` });
        setDialog(null);
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

    const media = live ? props.about.catalog?.media || mediaList : mediaList;
    const members = (live ? props.about.catalog?.members : seed.catalog?.members) || [];
    const ctx = { form, edit, errors, media, members, askDelete, pickMedia };
    const Editor = [OverviewEditor, HistoryEditor, OrganisationEditor, StrategyEditor, AwardsEditor][active];

    const statusTone = meta.status === "published" ? "ok" : meta.status === "scheduled" ? "warn" : "off";
    const statusText = meta.status === "published" ? "Published" : meta.status === "scheduled" ? `Scheduled · ${formatDate(meta.scheduledAt)}` : "Draft";

    return (
        <Ctx.Provider value={ctx}>
            <div className="coeuas-about">
                <div className="ca-heading">
                    <div>
                        <h1>About COE-UAS</h1>
                        <p>Create, update and remove everything visitors read in the About section of the COE-UAS website.</p>
                        <div className="ca-status">
                            <span className={`ca-pill is-${statusTone}`}>{statusText}</span>
                            {unpublished && meta.status !== "draft" && <span className="ca-pill is-warn">{dirty ? "Unsaved changes" : "Changes not published yet"}</span>}
                            {meta.updatedAt && <small>Last edited {timeAgo(meta.updatedAt)} by {meta.updatedBy}</small>}
                        </div>
                    </div>

                    <div className="ca-actions">
                        <button type="button" className="ca-btn-outline" onClick={() => setPreview(true)}><Icon name="eye" size={16} /> Preview</button>
                        <button type="button" className="ca-btn-outline" onClick={saveDraft} disabled={!dirty || busy}><Icon name="save" size={16} /> {busy && !dialog ? "Saving..." : "Save draft"}</button>
                        <button type="button" className="ca-btn-dark" onClick={() => startAction("publish")} disabled={busy || (!unpublished && meta.status === "published")}>
                            <span className="ca-btn-icon"><Icon name="upload" size={16} /></span> Publish
                        </button>
                        <div className="ca-more" ref={menuRef}>
                            <button type="button" className="ca-iconbtn is-round" aria-label="More publishing options" aria-haspopup="menu" aria-expanded={menu} onClick={() => setMenu((v) => !v)}><Icon name="more" size={18} /></button>
                            {menu && (
                                <div className="ca-menu" role="menu">
                                    <button type="button" role="menuitem" onClick={() => startAction("schedule")}><Icon name="clock" size={16} /> Schedule publication</button>
                                    <button type="button" role="menuitem" disabled={meta.status === "draft"} onClick={() => startAction("unpublish")}><Icon name="unlink" size={16} /> Unpublish page</button>
                                    {props.about?.previewUrl && <a role="menuitem" href={props.about.previewUrl} target="_blank" rel="noreferrer"><Icon name="external" size={16} /> Open saved preview</a>}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {!live && (
                    <p className="ca-note"><Icon name="alert" size={16} /><span>Sample data. Every control works, but nothing is stored until your controller sends the <b>about</b> prop.</span></p>
                )}

                <div className="ca-tabs" role="tablist" aria-label="About page editor">
                    {[["content", "Content"], ["seo", "Page settings"], ["history", "History"]].map(([key, label]) => (
                        <button key={key} type="button" role="tab" aria-selected={tab === key} className={tab === key ? "is-active" : ""} onClick={() => setTab(key)}>
                            {label}
                            {key === "seo" && errorCountFor("seo") > 0 && <span className="ca-badge-error">{errorCountFor("seo")}</span>}
                            {key === "history" && <span className="ca-badge">{history.length}</span>}
                        </button>
                    ))}
                </div>

                {tab === "content" && (
                    <div className="ca-layout">
                        <nav className="ca-rail" aria-label="About page sections">
                            <ol>
                                {SECTIONS.map((s, i) => {
                                    const errs = errorCountFor(s.key);
                                    const visible = form[s.key].visible;
                                    return (
                                        <li key={s.key}>
                                            <button type="button" className={`ca-rail-item ${active === i ? "is-active" : ""}`} aria-current={active === i ? "true" : undefined} onClick={() => setActive(i)}>
                                                <span className="ca-rail-no">{i + 1}</span>
                                                <span className="ca-rail-text">
                                                    <strong>{s.label}</strong>
                                                    <small>{visible ? s.hint : "Hidden from the page"}</small>
                                                </span>
                                                {errs > 0 ? <span className="ca-badge-error" title={`${errs} to fix`}>{errs}</span> : changedKeys.includes(s.key) ? <span className="ca-dot" title="Edited" /> : null}
                                            </button>
                                        </li>
                                    );
                                })}
                            </ol>
                        </nav>
                        <div className="ca-panel" key={active}><Editor /></div>
                    </div>
                )}
                {tab === "seo" && <SeoPanel />}
                {tab === "history" && <HistoryPanel history={history} />}

                {dirty && (
                    <div className="ca-savebar" role="region" aria-label="Unsaved changes">
                        <span className="ca-savebar-text"><i /> {changedLabels.length} section{changedLabels.length === 1 ? "" : "s"} edited, not saved</span>
                        <div>
                            <button type="button" className="ca-btn-ghost" onClick={() => { setForm(clone(saved)); setSubmitted(false); setToast({ tone: "info", text: "Changes discarded." }); }} disabled={busy}>Discard</button>
                            <button type="button" className="ca-btn-accent" onClick={saveDraft} disabled={busy}>{busy ? "Saving..." : "Save draft"}</button>
                        </div>
                    </div>
                )}

                {dialog?.type === "delete" && (
                    <div className="ca-overlay" onMouseDown={(e) => e.target === e.currentTarget && setDialog(null)}>
                        <div className="ca-dialog ca-small" role="alertdialog" aria-modal="true" aria-labelledby={dialogTitleId}>
                            <span className="ca-dialog-icon is-danger"><Icon name="trash" size={22} /></span>
                            <h2 id={dialogTitleId}>Delete “{dialog.what}”?</h2>
                            <p>{dialog.note ? `${dialog.note} ` : ""}It moves to Deleted content, where only the Super Admin can restore or purge it. It disappears from the About page when you publish.</p>
                            <div className="ca-dialog-actions">
                                <button type="button" className="ca-btn-outline" onClick={() => setDialog(null)} autoFocus>Keep it</button>
                                <button type="button" className="ca-btn-danger" onClick={confirmDelete}><Icon name="trash" size={15} /> Move to Trash</button>
                            </div>
                        </div>
                    </div>
                )}

                {["publish", "schedule", "unpublish"].includes(dialog?.type) && (
                    <div className="ca-overlay" onMouseDown={(e) => e.target === e.currentTarget && !busy && setDialog(null)}>
                        <div className="ca-dialog ca-small" role="alertdialog" aria-modal="true" aria-labelledby={dialogTitleId}>
                            <span className={`ca-dialog-icon ${dialog.type === "unpublish" ? "is-danger" : ""}`}><Icon name={dialog.type === "schedule" ? "clock" : dialog.type === "unpublish" ? "unlink" : "upload"} size={22} /></span>
                            <h2 id={dialogTitleId}>{dialog.type === "publish" ? "Publish the About page?" : dialog.type === "schedule" ? "Schedule publication" : "Unpublish the About page?"}</h2>
                            {dialog.type === "unpublish" ? (
                                <p>Visitors will no longer see the About section until you publish it again. Nothing is deleted.</p>
                            ) : (
                                <>
                                    <p>{dialog.type === "publish" ? "Visitors will see your changes straight away." : "Your changes go live automatically at the time you choose."}</p>
                                    {changedLabels.length > 0 ? (
                                        <ul className="ca-dialog-list">{changedLabels.map((l) => <li key={l}><Icon name="check" size={14} /> {l}</li>)}</ul>
                                    ) : (
                                        <p className="ca-hint">No new edits. This publishes the last saved draft.</p>
                                    )}
                                </>
                            )}
                            {dialog.type === "schedule" && (
                                <label className="ca-field">
                                    <span className="ca-field-top"><span>Publish on</span></span>
                                    <input type="datetime-local" className="ca-input" value={scheduleAt} min={new Date(Date.now() - new Date().getTimezoneOffset() * MIN).toISOString().slice(0, 16)} onChange={(e) => setScheduleAt(e.target.value)} />
                                </label>
                            )}
                            <div className="ca-dialog-actions">
                                <button type="button" className="ca-btn-outline" onClick={() => setDialog(null)} disabled={busy}>Cancel</button>
                                <button type="button" className={dialog.type === "unpublish" ? "ca-btn-danger" : "ca-btn-dark"} onClick={confirmAction} disabled={busy}>
                                    {busy ? "Working..." : dialog.type === "publish" ? "Publish now" : dialog.type === "schedule" ? "Schedule" : "Unpublish"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {picker && <MediaPicker state={picker} media={media} onClose={() => setPicker(null)} onUpload={uploadMedia} />}
                {preview && <PreviewModal form={form} media={media} members={members} previewUrl={props.about?.previewUrl} onClose={() => setPreview(false)} />}

                {toast && (
                    <div className={`ca-toast is-${toast.tone}`} role="status">
                        <Icon name={toast.tone === "error" ? "alert" : "check"} size={16} />
                        <span>{toast.text}</span>
                        <button type="button" aria-label="Dismiss" onClick={() => setToast(null)}><Icon name="close" size={14} /></button>
                    </div>
                )}
            </div>
        </Ctx.Provider>
    );
}

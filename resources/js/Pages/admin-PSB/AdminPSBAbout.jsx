import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { router, usePage } from "@inertiajs/react";
import "../../../css/admin-PSB-css/admin-about.css";

/* ====================================================================
   PSB ADMIN → ABOUT THE SANDBOX EDITOR            /admin/psb/about/*

   Site map (PSB workspace → "About the Sandbox"), one editor for all five modules:
     1  Overview (definition, purpose, vision, objectives)  → page_sections (text, list)
     2  Why Perlis, Malaysia?                               → page_sections (cards)
     3  Governance and Management                           → psb_governance_units (tree)
     4  Development Roadmap (phases and milestones)         → psb_roadmap_phases + psb_milestones
     5  Partners and Collaborators                          → partners (type, logo, link, featured)
   Common screens from the document: edit, preview, publish / unpublish, schedule,
   reorder, delete to Trash, History tab (audit_logs for this record).
   Media is always chosen from media_assets (never stored inside the content).

   SAMPLE DATA: the page works today (changes stay on screen only). Return an Inertia
   prop named `about` and it switches to LIVE mode:

   Inertia::render('admin-PSB/AdminPSBAbout', [
       'section' => 'overview',   // optional: overview | why-perlis | governance | roadmap | partners
       'about' => [
           'content' => [...],    // same shape as `sampleContent` below
           'meta'    => [...],    // status, publishedAt, scheduledAt, hasUnpublishedChanges, updatedBy, updatedAt
           'catalog' => ['media' => []],
           'history' => [...],    // audit_logs rows for these records
           'previewUrl' => 'https://...',   // optional signed preview link of the public About page
       ],
   ]);

   Map the five sidebar routes (/admin/psb/about/overview, /why-perlis, /governance,
   /roadmap, /partners) to this same component. LIVE mode requests are in ENDPOINTS.
   The controller must write audit_logs and soft-delete (deleted_at) removed records.
==================================================================== */

const BASE = "/admin/psb"; // keep in sync with psbRoutes.js
const ENDPOINTS = {
    save: `${BASE}/about`, // PUT   { content }          save as draft
    publish: `${BASE}/about/publish`, // POST  { content }          save + publish now
    schedule: `${BASE}/about/schedule`, // POST  { content, at }      save + publish later
    unpublish: `${BASE}/about/unpublish`, // POST
    upload: `${BASE}/media-library/upload`, // POST  multipart { file }
};

const SECTIONS = [
    { key: "overview", route: "overview", label: "Overview", hint: "Definition, purpose, vision, objectives" },
    { key: "why", route: "why-perlis", label: "Why Perlis, Malaysia?", hint: "Reasons the site was chosen" },
    { key: "governance", route: "governance", label: "Governance and Management", hint: "Who leads and who reports to whom" },
    { key: "roadmap", route: "roadmap", label: "Development Roadmap", hint: "Phases and milestones" },
    { key: "partners", route: "partners", label: "Partners and Collaborators", hint: "Organisations and logos" },
];

/* enums from the ERD */
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
        definition:
            "The Perlis Airspace Sandbox is a controlled, designated airspace where new aviation technologies and operations can be tested safely under regulatory oversight.",
        purpose:
            "It gives government, industry and researchers a real place to trial drones, advanced air mobility and supporting systems before they are used at scale.",
        vision:
            "A trusted national testbed that helps Malaysia move from pilot projects to everyday, safe, commercial use of the low-altitude airspace.",
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

const move = (list, from, to) => {
    if (to < 0 || to >= list.length) return;
    const [item] = list.splice(from, 1);
    list.splice(to, 0, item);
};

const isUrl = (v) => /^(https?:\/\/)[^\s.]+\.[^\s]{2,}$/i.test(v);

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

    const currents = f.roadmap.phases.filter((p) => p.status === "current");
    if (currents.length > 1) e["roadmap.current"] = "Only one phase can be the current phase.";
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

const sectionOfKey = (key) => {
    const head = key.split(".")[0];
    return head === "seo" ? "seo" : head;
};

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

function Field({ label, errorKey, value, onChange, textarea, max, hint, placeholder, type = "text", rows = 3 }) {
    const { errors } = useCtx();
    const error = errorKey ? errors[errorKey] : null;
    const Tag = textarea ? "textarea" : "input";
    return (
        <label className={`pa-field ${error ? "has-error" : ""}`}>
            <span className="pa-field-top">
                <span>{label}</span>
                {max && <small className={(value || "").length > max ? "is-over" : ""}>{(value || "").length}/{max}</small>}
            </span>
            <Tag
                className="pa-input"
                type={textarea ? undefined : type}
                rows={textarea ? rows : undefined}
                value={value ?? ""}
                placeholder={placeholder}
                onChange={(e) => onChange(e.target.value)}
            />
            {hint && !error && <em className="pa-hint">{hint}</em>}
            {error && <em className="pa-error"><Icon name="alert" size={13} /> {error}</em>}
        </label>
    );
}

function Select({ label, value, options, onChange }) {
    return (
        <label className="pa-field">
            <span className="pa-field-top"><span>{label}</span></span>
            <select className="pa-input" value={value} onChange={(e) => onChange(e.target.value)}>
                {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
        </label>
    );
}

function VisibleToggle({ checked, onChange, label }) {
    return (
        <label className="pa-switch">
            <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
            <i aria-hidden="true" />
            <span>{label}</span>
        </label>
    );
}

function Mover({ index, count, onMove, onDelete, deleteLabel }) {
    return (
        <div className="pa-mover">
            <button type="button" className="pa-iconbtn" disabled={index === 0} onClick={() => onMove(index - 1)} aria-label="Move up"><Icon name="up" size={16} /></button>
            <button type="button" className="pa-iconbtn" disabled={index === count - 1} onClick={() => onMove(index + 1)} aria-label="Move down"><Icon name="down" size={16} /></button>
            <button type="button" className="pa-iconbtn is-danger" onClick={onDelete} aria-label={deleteLabel}><Icon name="trash" size={16} /></button>
        </div>
    );
}

function SectionHead({ title, text, visible, onVisible }) {
    return (
        <div className="pa-panel-head">
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
        <div className="pa-media">
            <span className="pa-media-label">{label}</span>
            <div className="pa-media-box">
                <span className={`pa-thumb ${item ? "has-item" : ""}`}>{item ? (item.url ? <img src={item.url} alt="" /> : <Icon name="image" size={20} />) : <Icon name="image" size={20} />}</span>
                <span className="pa-media-text">
                    <strong>{item ? item.name : "Nothing selected"}</strong>
                    <small>{item ? item.alt || "No alt text yet" : "Choose from the Media Library"}</small>
                </span>
                <button type="button" className="pa-btn-small" onClick={onPick}>{item ? "Change" : "Choose"}</button>
                {item && <button type="button" className="pa-iconbtn" aria-label="Remove image" onClick={onClear}><Icon name="close" size={15} /></button>}
            </div>
        </div>
    );
}

/* ------------------------------- editors --------------------------------- */

function OverviewEditor() {
    const { form, edit, errors, askDelete, pickMedia } = useCtx();
    const o = form.overview;
    return (
        <>
            <SectionHead title="Overview" text="The short story at the top of the About page: what the sandbox is, why it exists and where it is going." visible={o.visible} onVisible={(v) => edit((d) => { d.overview.visible = v; })} />
            <div className="pa-stack">
                <Field label="What the sandbox is (definition)" textarea rows={3} errorKey="overview.definition" value={o.definition} onChange={(v) => edit((d) => { d.overview.definition = v; })} />
                <Field label="Purpose" textarea rows={3} errorKey="overview.purpose" value={o.purpose} onChange={(v) => edit((d) => { d.overview.purpose = v; })} />
                <Field label="Vision" textarea rows={3} errorKey="overview.vision" value={o.vision} onChange={(v) => edit((d) => { d.overview.vision = v; })} />
            </div>

            <div className="pa-block">
                <div className="pa-block-head">
                    <div><h3>Objectives</h3><small>{o.objectives.length} of {LIMITS.objectives}</small></div>
                    <button type="button" className="pa-btn-small" disabled={o.objectives.length >= LIMITS.objectives} onClick={() => edit((d) => { d.overview.objectives.push({ id: uid(), text: "" }); })}><Icon name="plus" size={15} /> Add objective</button>
                </div>
                {errors["overview.objectives"] && <em className="pa-error"><Icon name="alert" size={13} /> {errors["overview.objectives"]}</em>}
                <ol className="pa-list">
                    {o.objectives.map((obj, i) => (
                        <li key={obj.id} className="pa-row">
                            <span className="pa-no">{i + 1}</span>
                            <div className="pa-row-main">
                                <Field label={`Objective ${i + 1}`} errorKey={`overview.obj.${obj.id}`} value={obj.text} onChange={(v) => edit((d) => { d.overview.objectives[i].text = v; })} />
                            </div>
                            <Mover index={i} count={o.objectives.length} deleteLabel={`Delete objective ${i + 1}`}
                                onMove={(to) => edit((d) => move(d.overview.objectives, i, to))}
                                onDelete={() => askDelete({ what: obj.text || `Objective ${i + 1}`, onConfirm: () => edit((d) => { d.overview.objectives.splice(i, 1); }) })} />
                        </li>
                    ))}
                </ol>
            </div>

            <MediaSlot label="Overview image" mediaId={o.mediaId} onPick={() => pickMedia({ type: "image", onSelect: (m) => edit((d) => { d.overview.mediaId = m.id; }) })} onClear={() => edit((d) => { d.overview.mediaId = null; })} />
        </>
    );
}

function WhyEditor() {
    const { form, edit, askDelete, pickMedia } = useCtx();
    const w = form.why;
    return (
        <>
            <SectionHead title="Why Perlis, Malaysia?" text="The reasons this location was chosen. Each reason is a card on the public page." visible={w.visible} onVisible={(v) => edit((d) => { d.why.visible = v; })} />
            <Field label="Introduction" textarea rows={2} value={w.intro} onChange={(v) => edit((d) => { d.why.intro = v; })} />

            <div className="pa-block">
                <div className="pa-block-head">
                    <div><h3>Reasons</h3><small>{w.reasons.length} of {LIMITS.reasons}</small></div>
                    <button type="button" className="pa-btn-small" disabled={w.reasons.length >= LIMITS.reasons} onClick={() => edit((d) => { d.why.reasons.push({ id: uid(), title: "", text: "", mediaId: null }); })}><Icon name="plus" size={15} /> Add reason</button>
                </div>
                <ol className="pa-list">
                    {w.reasons.map((r, i) => (
                        <li key={r.id} className="pa-card">
                            <div className="pa-card-top">
                                <span className="pa-no">{i + 1}</span>
                                <strong>{r.title || "New reason"}</strong>
                                <Mover index={i} count={w.reasons.length} deleteLabel={`Delete ${r.title || "reason"}`}
                                    onMove={(to) => edit((d) => move(d.why.reasons, i, to))}
                                    onDelete={() => askDelete({ what: r.title || `Reason ${i + 1}`, onConfirm: () => edit((d) => { d.why.reasons.splice(i, 1); }) })} />
                            </div>
                            <div className="pa-grid-2">
                                <Field label="Title" errorKey={`why.${r.id}.title`} value={r.title} onChange={(v) => edit((d) => { d.why.reasons[i].title = v; })} />
                                <MediaSlot label="Image (optional)" mediaId={r.mediaId} onPick={() => pickMedia({ type: "image", onSelect: (m) => edit((d) => { d.why.reasons[i].mediaId = m.id; }) })} onClear={() => edit((d) => { d.why.reasons[i].mediaId = null; })} />
                            </div>
                            <Field label="Explanation" textarea rows={2} errorKey={`why.${r.id}.text`} value={r.text} onChange={(v) => edit((d) => { d.why.reasons[i].text = v; })} />
                        </li>
                    ))}
                </ol>
            </div>
        </>
    );
}

function GovernanceEditor() {
    const { form, edit, askDelete } = useCtx();
    const g = form.governance;
    const rows = flattenTree(g.units);

    const siblings = (u) => g.units.filter((x) => parentOf(g.units, x) === parentOf(g.units, u));
    const moveSibling = (u, dir) =>
        edit((d) => {
            const list = d.governance.units;
            const sib = list.filter((x) => parentOf(list, x) === parentOf(list, u));
            const at = sib.findIndex((x) => x.id === u.id);
            const other = sib[at + dir];
            if (!other) return;
            const a = list.findIndex((x) => x.id === u.id);
            const b = list.findIndex((x) => x.id === other.id);
            [list[a], list[b]] = [list[b], list[a]];
        });

    const remove = (u) =>
        askDelete({
            what: u.name || "this unit",
            note: g.units.some((x) => x.parentId === u.id) ? "Units that report to it move up one level." : undefined,
            onConfirm: () =>
                edit((d) => {
                    const list = d.governance.units;
                    list.forEach((x) => { if (x.parentId === u.id) x.parentId = u.parentId || null; });
                    d.governance.units = list.filter((x) => x.id !== u.id);
                }),
        });

    return (
        <>
            <SectionHead title="Governance and Management" text="The organisation behind the sandbox. Each unit can report to another unit, which builds the chart visitors see." visible={g.visible} onVisible={(v) => edit((d) => { d.governance.visible = v; })} />
            <Field label="Introduction" textarea rows={2} value={g.intro} onChange={(v) => edit((d) => { d.governance.intro = v; })} />

            <div className="pa-block">
                <div className="pa-block-head">
                    <div><h3>Units</h3><small>{g.units.length} in the chart</small></div>
                    <button type="button" className="pa-btn-small" onClick={() => edit((d) => { d.governance.units.push({ id: uid(), parentId: d.governance.units.find((x) => !x.parentId)?.id || null, name: "", role: "", responsibility: "" }); })}><Icon name="plus" size={15} /> Add unit</button>
                </div>

                <ol className="pa-list">
                    {rows.map(({ unit: u, depth }) => {
                        const blocked = descendantsOf(g.units, u.id);
                        const index = siblings(u).findIndex((x) => x.id === u.id);
                        return (
                            <li key={u.id} className="pa-card pa-unit" style={{ "--depth": Math.min(depth, 4) }}>
                                <div className="pa-card-top">
                                    {depth > 0 && <span className="pa-branch" aria-hidden="true"><Icon name="corner" size={16} /></span>}
                                    <strong>{u.name || "New unit"}</strong>
                                    <small>{depth === 0 ? "Top level" : `Level ${depth + 1}`}</small>
                                    <Mover index={index} count={siblings(u).length} deleteLabel={`Delete ${u.name || "unit"}`} onMove={(to) => moveSibling(u, to - index)} onDelete={() => remove(u)} />
                                </div>
                                <div className="pa-grid-2">
                                    <Field label="Unit name" errorKey={`governance.${u.id}.name`} value={u.name} onChange={(v) => edit((d) => { d.governance.units.find((x) => x.id === u.id).name = v; })} />
                                    <Field label="Role or title" errorKey={`governance.${u.id}.role`} value={u.role} onChange={(v) => edit((d) => { d.governance.units.find((x) => x.id === u.id).role = v; })} />
                                </div>
                                <div className="pa-grid-2 is-wide-right">
                                    <label className="pa-field">
                                        <span className="pa-field-top"><span>Reports to</span></span>
                                        <select className="pa-input" value={u.parentId || ""} onChange={(e) => edit((d) => { d.governance.units.find((x) => x.id === u.id).parentId = e.target.value || null; })}>
                                            <option value="">Nobody (top level)</option>
                                            {g.units.filter((x) => x.id !== u.id && !blocked.has(x.id)).map((x) => <option key={x.id} value={x.id}>{x.name || "Unnamed unit"}</option>)}
                                        </select>
                                    </label>
                                    <Field label="Responsibility" textarea rows={2} value={u.responsibility} onChange={(v) => edit((d) => { d.governance.units.find((x) => x.id === u.id).responsibility = v; })} />
                                </div>
                            </li>
                        );
                    })}
                </ol>
            </div>
        </>
    );
}

function RoadmapEditor() {
    const { form, edit, errors, askDelete } = useCtx();
    const r = form.roadmap;
    const [openId, setOpenId] = useState(() => r.phases.find((p) => p.status === "current")?.id || r.phases[0]?.id);

    const setStatus = (i, v) =>
        edit((d) => {
            // only one phase can be current: demote the old one to completed
            if (v === "current") d.roadmap.phases.forEach((p, k) => { if (k !== i && p.status === "current") p.status = "completed"; });
            d.roadmap.phases[i].status = v;
        });

    return (
        <>
            <SectionHead title="Development Roadmap" text="Phases and the milestones inside each one. Phase numbers follow the order below." visible={r.visible} onVisible={(v) => edit((d) => { d.roadmap.visible = v; })} />
            <Field label="Introduction" textarea rows={2} value={r.intro} onChange={(v) => edit((d) => { d.roadmap.intro = v; })} />
            {errors["roadmap.current"] && <em className="pa-error"><Icon name="alert" size={13} /> {errors["roadmap.current"]}</em>}

            <div className="pa-block">
                <div className="pa-block-head">
                    <div><h3>Phases</h3><small>{r.phases.length} phase{r.phases.length === 1 ? "" : "s"}</small></div>
                    <button type="button" className="pa-btn-small" onClick={() => { const id = uid(); edit((d) => { d.roadmap.phases.push({ id, title: "", description: "", start: "", end: "", status: "planned", milestones: [] }); }); setOpenId(id); }}><Icon name="plus" size={15} /> Add phase</button>
                </div>

                <ol className="pa-list">
                    {r.phases.map((p, i) => {
                        const open = openId === p.id;
                        const done = p.milestones.filter((m) => m.status === "done").length;
                        return (
                            <li key={p.id} className={`pa-card pa-phase is-${p.status} ${open ? "is-open" : ""}`}>
                                <div className="pa-card-top">
                                    <button type="button" className="pa-phase-toggle" aria-expanded={open} onClick={() => setOpenId(open ? null : p.id)}>
                                        <span className="pa-no">{i + 1}</span>
                                        <span className="pa-phase-title">
                                            <strong>{p.title || "New phase"}</strong>
                                            <small>{PHASE_STATUS.find((s) => s.value === p.status).label} · {done}/{p.milestones.length} milestones done{p.start ? ` · ${formatDate(p.start, false)}` : ""}{p.end ? ` to ${formatDate(p.end, false)}` : ""}</small>
                                        </span>
                                        <Icon name={open ? "up" : "down"} size={17} />
                                    </button>
                                    <Mover index={i} count={r.phases.length} deleteLabel={`Delete ${p.title || "phase"}`}
                                        onMove={(to) => edit((d) => move(d.roadmap.phases, i, to))}
                                        onDelete={() => askDelete({ what: p.title || `Phase ${i + 1}`, note: p.milestones.length ? `Its ${p.milestones.length} milestone${p.milestones.length === 1 ? "" : "s"} go with it.` : undefined, onConfirm: () => edit((d) => { d.roadmap.phases.splice(i, 1); }) })} />
                                </div>

                                {open && (
                                    <div className="pa-phase-body">
                                        <div className="pa-grid-2">
                                            <Field label="Phase title" errorKey={`roadmap.${p.id}.title`} value={p.title} onChange={(v) => edit((d) => { d.roadmap.phases[i].title = v; })} />
                                            <Select label="Status" value={p.status} options={PHASE_STATUS} onChange={(v) => setStatus(i, v)} />
                                        </div>
                                        <Field label="Description" textarea rows={2} value={p.description} onChange={(v) => edit((d) => { d.roadmap.phases[i].description = v; })} />
                                        <div className="pa-grid-2">
                                            <Field label="Starts" type="date" value={p.start} onChange={(v) => edit((d) => { d.roadmap.phases[i].start = v; })} />
                                            <Field label="Ends" type="date" errorKey={`roadmap.${p.id}.end`} value={p.end} onChange={(v) => edit((d) => { d.roadmap.phases[i].end = v; })} />
                                        </div>

                                        <div className="pa-subblock">
                                            <div className="pa-block-head">
                                                <h4>Milestones</h4>
                                                <button type="button" className="pa-btn-small" onClick={() => edit((d) => { d.roadmap.phases[i].milestones.push({ id: uid(), title: "", description: "", target: "", status: "planned" }); })}><Icon name="plus" size={15} /> Add milestone</button>
                                            </div>
                                            {p.milestones.length === 0 && <p className="pa-empty">No milestones yet.</p>}
                                            <ul className="pa-list">
                                                {p.milestones.map((m, k) => (
                                                    <li key={m.id} className="pa-milestone">
                                                        <div className="pa-milestone-main">
                                                            <div className="pa-grid-3">
                                                                <Field label="Milestone" errorKey={`roadmap.${p.id}.${m.id}.title`} value={m.title} onChange={(v) => edit((d) => { d.roadmap.phases[i].milestones[k].title = v; })} />
                                                                <Field label="Target date" type="date" value={m.target} onChange={(v) => edit((d) => { d.roadmap.phases[i].milestones[k].target = v; })} />
                                                                <Select label="Status" value={m.status} options={MILESTONE_STATUS} onChange={(v) => edit((d) => { d.roadmap.phases[i].milestones[k].status = v; })} />
                                                            </div>
                                                            <Field label="Details (optional)" value={m.description} onChange={(v) => edit((d) => { d.roadmap.phases[i].milestones[k].description = v; })} />
                                                        </div>
                                                        <Mover index={k} count={p.milestones.length} deleteLabel={`Delete ${m.title || "milestone"}`}
                                                            onMove={(to) => edit((d) => move(d.roadmap.phases[i].milestones, k, to))}
                                                            onDelete={() => askDelete({ what: m.title || "this milestone", onConfirm: () => edit((d) => { d.roadmap.phases[i].milestones.splice(k, 1); }) })} />
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                )}
                            </li>
                        );
                    })}
                </ol>
            </div>
        </>
    );
}

function PartnersEditor() {
    const { form, edit, errors, askDelete, pickMedia, media } = useCtx();
    const pt = form.partners;
    const [filter, setFilter] = useState("all");
    const featured = pt.items.filter((p) => p.featured).length;
    const shown = pt.items.map((p, i) => ({ p, i })).filter(({ p }) => filter === "all" || p.type === filter);

    return (
        <>
            <SectionHead title="Partners and Collaborators" text="Organisations shown on the About page. Featured partners also appear in the Home page preview." visible={pt.visible} onVisible={(v) => edit((d) => { d.partners.visible = v; })} />
            <Field label="Introduction" textarea rows={2} value={pt.intro} onChange={(v) => edit((d) => { d.partners.intro = v; })} />
            {errors["partners.featured"] && <em className="pa-error"><Icon name="alert" size={13} /> {errors["partners.featured"]}</em>}

            <div className="pa-block">
                <div className="pa-block-head">
                    <div><h3>Partners</h3><small>{pt.items.length} in total, {featured} featured (max {LIMITS.partnersFeatured})</small></div>
                    <button type="button" className="pa-btn-small" onClick={() => edit((d) => { d.partners.items.push({ id: uid(), name: "", type: "industry", url: "", logoId: null, description: "", featured: false }); })}><Icon name="plus" size={15} /> Add partner</button>
                </div>

                <div className="pa-chips" role="tablist" aria-label="Filter by partner type">
                    {[{ value: "all", label: "All" }, ...PARTNER_TYPES].map((t) => (
                        <button key={t.value} type="button" role="tab" aria-selected={filter === t.value} className={filter === t.value ? "is-active" : ""} onClick={() => setFilter(t.value)}>
                            {t.label}
                            <b>{t.value === "all" ? pt.items.length : pt.items.filter((p) => p.type === t.value).length}</b>
                        </button>
                    ))}
                </div>

                {shown.length === 0 && <p className="pa-empty">No partners of this type yet.</p>}
                <ol className="pa-list">
                    {shown.map(({ p, i }) => {
                        const logo = media.find((m) => m.id === p.logoId);
                        return (
                            <li key={p.id} className="pa-card">
                                <div className="pa-card-top">
                                    <span className="pa-logo">{logo?.url ? <img src={logo.url} alt="" /> : (p.name || "?").trim().slice(0, 2).toUpperCase()}</span>
                                    <strong>{p.name || "New partner"}</strong>
                                    {p.featured && <span className="pa-tag"><Icon name="star" size={12} /> Featured</span>}
                                    <Mover index={i} count={pt.items.length} deleteLabel={`Delete ${p.name || "partner"}`}
                                        onMove={(to) => edit((d) => move(d.partners.items, i, to))}
                                        onDelete={() => askDelete({ what: p.name || "this partner", onConfirm: () => edit((d) => { d.partners.items.splice(i, 1); }) })} />
                                </div>
                                <div className="pa-grid-2">
                                    <Field label="Name" errorKey={`partners.${p.id}.name`} value={p.name} onChange={(v) => edit((d) => { d.partners.items[i].name = v; })} />
                                    <Select label="Type" value={p.type} options={PARTNER_TYPES} onChange={(v) => edit((d) => { d.partners.items[i].type = v; })} />
                                </div>
                                <div className="pa-grid-2">
                                    <Field label="Website" placeholder="https://" errorKey={`partners.${p.id}.url`} value={p.url} onChange={(v) => edit((d) => { d.partners.items[i].url = v; })} />
                                    <MediaSlot label="Logo" mediaId={p.logoId} onPick={() => pickMedia({ type: "image", onSelect: (m) => edit((d) => { d.partners.items[i].logoId = m.id; }) })} onClear={() => edit((d) => { d.partners.items[i].logoId = null; })} />
                                </div>
                                <Field label="Short description" textarea rows={2} value={p.description} onChange={(v) => edit((d) => { d.partners.items[i].description = v; })} />
                                <VisibleToggle checked={p.featured} onChange={(v) => edit((d) => { d.partners.items[i].featured = v; })} label="Feature in the Home page partners preview" />
                            </li>
                        );
                    })}
                </ol>
            </div>
        </>
    );
}

/* --------------------------- other tabs / modals -------------------------- */

function SeoPanel() {
    const { form, edit, pickMedia } = useCtx();
    return (
        <div className="pa-panel pa-narrow">
            <div className="pa-panel-head"><div><h2>Page settings</h2><p>How the About page appears in search results and when shared.</p></div></div>
            <div className="pa-stack">
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
        <div className="pa-panel pa-narrow">
            <div className="pa-panel-head"><div><h2>History</h2><p>Every change to this page, from the audit log.</p></div></div>
            {history.length === 0 && <p className="pa-empty">Nothing recorded yet.</p>}
            <ol className="pa-history">
                {history.map((h) => (
                    <li key={h.id}>
                        <span className={`pa-pill ${ACTION_TONE[h.action] || "is-info"}`}>{h.action}</span>
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
    const list = media.filter((m) => !state.type || m.type === state.type);
    return (
        <div className="pa-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
            <div className="pa-dialog" role="dialog" aria-modal="true" aria-labelledby="pa-media-title">
                <div className="pa-dialog-head">
                    <h2 id="pa-media-title">Media Library</h2>
                    <button type="button" className="pa-iconbtn" aria-label="Close" onClick={onClose}><Icon name="close" size={16} /></button>
                </div>
                <div className="pa-media-grid">
                    {list.map((m) => (
                        <button key={m.id} type="button" className="pa-media-item" onClick={() => { state.onSelect(m); onClose(); }}>
                            <span className="pa-media-preview">{m.url ? <img src={m.url} alt="" /> : <Icon name="image" size={26} />}</span>
                            <strong>{m.name}</strong>
                            <small>{m.size}</small>
                        </button>
                    ))}
                    {list.length === 0 && <p className="pa-empty">The library has no images yet.</p>}
                </div>
                <div className="pa-dialog-actions">
                    <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => { if (e.target.files[0]) onUpload(e.target.files[0]); e.target.value = ""; }} />
                    <button type="button" className="pa-btn-outline" onClick={() => fileRef.current?.click()}><Icon name="upload" size={15} /> Upload new</button>
                    <button type="button" className="pa-btn-dark" onClick={onClose}>Done</button>
                </div>
            </div>
        </div>
    );
}

/* ---------------------- full-page preview (public look) ---------------------- */

const SITE_NAV = ["Home", "About", "Opportunities", "Services", "Site Information", "Media Centre", "FAQ", "Contact"];
const DEVICES = [
    { key: "desktop", label: "Desktop", width: null },
    { key: "tablet", label: "Tablet", width: 820 },
    { key: "mobile", label: "Mobile", width: 390 },
];
const pad2 = (n) => String(n).padStart(2, "0");
const initialsOf = (name = "") => name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();

function OrgNode({ unit, units, depth }) {
    const kids = units.filter((u) => parentOf(units, u) === unit.id);
    return (
        <li className="pv-org-item">
            <div className={`pv-org-card ${depth === 0 ? "is-root" : ""}`}>
                <b>{unit.name || "Unnamed unit"}</b>
                {unit.role && <span>{unit.role}</span>}
                {unit.responsibility && <p>{unit.responsibility}</p>}
            </div>
            {kids.length > 0 && (
                <ul className="pv-org-kids">
                    {kids.map((k) => <OrgNode key={k.id} unit={k} units={units} depth={depth + 1} />)}
                </ul>
            )}
        </li>
    );
}

function PreviewPartners({ block, imageOf }) {
    const [type, setType] = useState("all");
    const types = PARTNER_TYPES.filter((t) => block.items.some((p) => p.type === t.value));
    const list = block.items.filter((p) => type === "all" || p.type === type);
    return (
        <>
            {types.length > 1 && (
                <div className="pv-chips">
                    {[{ value: "all", label: "All" }, ...types].map((t) => (
                        <button key={t.value} type="button" className={type === t.value ? "is-on" : ""} onClick={() => setType(t.value)}>{t.label}</button>
                    ))}
                </div>
            )}
            <ul className="pv-partners">
                {list.map((p) => {
                    const logo = imageOf(p.logoId);
                    const Tag = p.url ? "a" : "div";
                    return (
                        <li key={p.id}>
                            <Tag className="pv-partner" {...(p.url ? { href: p.url, target: "_blank", rel: "noreferrer" } : {})}>
                                <span className="pv-partner-logo">{logo ? <img src={logo} alt="" /> : initialsOf(p.name)}</span>
                                <b>{p.name || "Unnamed partner"}</b>
                                <small>{PARTNER_TYPES.find((t) => t.value === p.type)?.label}</small>
                                {p.description && <p>{p.description}</p>}
                            </Tag>
                        </li>
                    );
                })}
            </ul>
        </>
    );
}

function PreviewModal({ form: f, media, onClose, previewUrl }) {
    const [device, setDevice] = useState("desktop");
    const imageOf = (id) => media.find((m) => m.id === id)?.url || null;
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
    const roots = f.governance.units.filter((u) => parentOf(f.governance.units, u) === null);
    const tone = ["light", "dark", "light", "yellow", "light"]; // theme by section, like the other public pages

    return (
        <div className="pv-overlay" role="dialog" aria-modal="true" aria-label="Page preview">
            <div className="pv-bar">
                <div className="pv-bar-left">
                    <span className="pv-live"><i /> Preview</span>
                    <small>Your current edits, not the live page.{hidden.length > 0 && ` Hidden: ${hidden.join(", ")}.`}</small>
                </div>
                <div className="pv-devices" role="tablist" aria-label="Screen size">
                    {DEVICES.map((d) => (
                        <button key={d.key} type="button" role="tab" aria-selected={device === d.key} className={device === d.key ? "is-on" : ""} onClick={() => setDevice(d.key)}>{d.label}</button>
                    ))}
                </div>
                <div className="pv-bar-right">
                    {previewUrl && <a className="pv-bar-btn" href={previewUrl} target="_blank" rel="noreferrer">Open saved preview</a>}
                    <button type="button" className="pv-bar-btn is-close" onClick={onClose}>Close <kbd>Esc</kbd></button>
                </div>
            </div>

            <div className="pv-stage">
                <div className={`pv-frame is-${device}`} style={width ? { width } : undefined}>
                    <div className="pv">
                        <header className="pv-nav">
                            <b className="pv-brand"><i />Perlis Airspace Sandbox</b>
                            <nav aria-label="Site (preview)">
                                {SITE_NAV.map((n) => <span key={n} className={n === "About" ? "is-on" : ""}>{n}</span>)}
                            </nav>
                            <span className="pv-nav-cta">Apply to Participate</span>
                        </header>

                        <section className="pv-hero">
                            {heroImg && <img className="pv-hero-img" src={heroImg} alt="" />}
                            <div className="pv-wrap">
                                <p className="pv-kicker"><span>About</span> The Sandbox</p>
                                <h1>{f.seo.title || "About the Sandbox"}</h1>
                                {f.overview.visible && f.overview.definition && <p className="pv-lede">{f.overview.definition}</p>}
                                <div className="pv-hero-links">
                                    {SECTIONS.filter((s) => f[s.key].visible).map((s) => <span key={s.key}>{s.label}</span>)}
                                </div>
                            </div>
                        </section>

                        {f.overview.visible && (
                            <section className={`pv-sec pv-sec--${tone[0]}`}>
                                <div className="pv-wrap">
                                    <p className="pv-kicker"><span>{num("overview")}</span> Overview</p>
                                    <div className="pv-split">
                                        <div>
                                            <h2>What the sandbox is for</h2>
                                            <p className="pv-big">{f.overview.purpose}</p>
                                            <div className="pv-vision"><small>Our vision</small><p>{f.overview.vision}</p></div>
                                        </div>
                                        <ol className="pv-objectives">
                                            {f.overview.objectives.filter((o) => o.text.trim()).map((o, i) => (
                                                <li key={o.id}><span>{pad2(i + 1)}</span>{o.text}</li>
                                            ))}
                                        </ol>
                                    </div>
                                </div>
                            </section>
                        )}

                        {f.why.visible && (
                            <section className={`pv-sec pv-sec--${tone[1]}`}>
                                <div className="pv-wrap">
                                    <p className="pv-kicker"><span>{num("why")}</span> Location</p>
                                    <h2>Why Perlis, Malaysia?</h2>
                                    {f.why.intro && <p className="pv-lede">{f.why.intro}</p>}
                                    <ul className="pv-cards">
                                        {f.why.reasons.map((r, i) => {
                                            const img = imageOf(r.mediaId);
                                            return (
                                                <li key={r.id} className="pv-card">
                                                    {img && <img src={img} alt="" />}
                                                    <span className="pv-num">{pad2(i + 1)}</span>
                                                    <h3>{r.title || "Untitled reason"}</h3>
                                                    <p>{r.text}</p>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </div>
                            </section>
                        )}

                        {f.governance.visible && (
                            <section className={`pv-sec pv-sec--${tone[2]}`}>
                                <div className="pv-wrap">
                                    <p className="pv-kicker"><span>{num("governance")}</span> Structure</p>
                                    <h2>Governance and Management</h2>
                                    {f.governance.intro && <p className="pv-lede">{f.governance.intro}</p>}
                                    <ul className="pv-org">
                                        {roots.map((u) => <OrgNode key={u.id} unit={u} units={f.governance.units} depth={0} />)}
                                    </ul>
                                </div>
                            </section>
                        )}

                        {f.roadmap.visible && (
                            <section className={`pv-sec pv-sec--${tone[3]}`}>
                                <div className="pv-wrap">
                                    <p className="pv-kicker"><span>{num("roadmap")}</span> Roadmap</p>
                                    <h2>Development Roadmap</h2>
                                    {f.roadmap.intro && <p className="pv-lede">{f.roadmap.intro}</p>}
                                    <ol className="pv-phases">
                                        {f.roadmap.phases.map((ph, i) => (
                                            <li key={ph.id} className={`pv-phase is-${ph.status}`}>
                                                <div className="pv-phase-head">
                                                    <span className="pv-num">Phase {pad2(i + 1)}</span>
                                                    <em>{ph.status === "completed" ? "Completed" : ph.status === "current" ? "In progress" : "Planned"}</em>
                                                </div>
                                                <h3>{ph.title || "Untitled phase"}</h3>
                                                {(ph.start || ph.end) && <small>{formatDate(ph.start, false)}{ph.end ? ` to ${formatDate(ph.end, false)}` : ""}</small>}
                                                {ph.description && <p>{ph.description}</p>}
                                                {ph.milestones.length > 0 && (
                                                    <ul className="pv-miles">
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
                                </div>
                            </section>
                        )}

                        {f.partners.visible && (
                            <section className={`pv-sec pv-sec--${tone[4]}`}>
                                <div className="pv-wrap">
                                    <p className="pv-kicker"><span>{num("partners")}</span> Network</p>
                                    <h2>Partners and Collaborators</h2>
                                    {f.partners.intro && <p className="pv-lede">{f.partners.intro}</p>}
                                    <PreviewPartners block={f.partners} imageOf={imageOf} />
                                </div>
                            </section>
                        )}

                        <footer className="pv-foot">
                            <div className="pv-wrap">
                                <h2>Ready to take part?</h2>
                                <span className="pv-nav-cta">Apply to Participate</span>
                            </div>
                        </footer>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* -------------------------------- the page -------------------------------- */

export default function AdminPSBAbout() {
    const { props, url } = usePage();
    const live = Boolean(props.about?.content);

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

    /* when the sidebar link changes (e.g. Overview -> Governance), follow it */
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
        setTimeout(() => document.querySelector(".pa-field.has-error")?.scrollIntoView({ behavior: "smooth", block: "center" }), 120);
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
    const ctx = { form, edit, errors, media, askDelete, pickMedia };
    const Editor = [OverviewEditor, WhyEditor, GovernanceEditor, RoadmapEditor, PartnersEditor][active];

    const statusTone = meta.status === "published" ? "ok" : meta.status === "scheduled" ? "warn" : "off";
    const statusText = meta.status === "published" ? "Published" : meta.status === "scheduled" ? `Scheduled · ${formatDate(meta.scheduledAt)}` : "Draft";

    return (
        <Ctx.Provider value={ctx}>
            <div className="psb-about">
                <div className="pa-heading">
                    <div>
                        <h1>About the Sandbox</h1>
                        <p>Create, update and remove everything visitors read on the About the Sandbox page.</p>
                        <div className="pa-status">
                            <span className={`pa-pill is-${statusTone}`}>{statusText}</span>
                            {unpublished && meta.status !== "draft" && <span className="pa-pill is-warn">{dirty ? "Unsaved changes" : "Changes not published yet"}</span>}
                            {meta.updatedAt && <small>Last edited {timeAgo(meta.updatedAt)} by {meta.updatedBy}</small>}
                        </div>
                    </div>

                    <div className="pa-actions">
                        <button type="button" className="pa-btn-outline" onClick={() => setPreview(true)}><Icon name="eye" size={16} /> Preview</button>
                        <button type="button" className="pa-btn-outline" onClick={saveDraft} disabled={!dirty || busy}><Icon name="save" size={16} /> {busy && !dialog ? "Saving..." : "Save draft"}</button>
                        <button type="button" className="pa-btn-dark" onClick={() => startAction("publish")} disabled={busy || (!unpublished && meta.status === "published")}>
                            <span className="pa-btn-icon"><Icon name="upload" size={16} /></span> Publish
                        </button>
                        <div className="pa-more" ref={menuRef}>
                            <button type="button" className="pa-iconbtn is-round" aria-label="More publishing options" aria-haspopup="menu" aria-expanded={menu} onClick={() => setMenu((v) => !v)}><Icon name="more" size={18} /></button>
                            {menu && (
                                <div className="pa-menu" role="menu">
                                    <button type="button" role="menuitem" onClick={() => startAction("schedule")}><Icon name="clock" size={16} /> Schedule publication</button>
                                    <button type="button" role="menuitem" disabled={meta.status === "draft"} onClick={() => startAction("unpublish")}><Icon name="unlink" size={16} /> Unpublish page</button>
                                    {props.about?.previewUrl && <a role="menuitem" href={props.about.previewUrl} target="_blank" rel="noreferrer"><Icon name="external" size={16} /> Open saved preview</a>}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {!live && (
                    <p className="pa-note"><Icon name="alert" size={16} /><span>Sample data. Every control works, but nothing is stored until your controller sends the <b>about</b> prop.</span></p>
                )}

                <div className="pa-tabs" role="tablist" aria-label="About page editor">
                    {[["content", "Content"], ["seo", "Page settings"], ["history", "History"]].map(([key, label]) => (
                        <button key={key} type="button" role="tab" aria-selected={tab === key} className={tab === key ? "is-active" : ""} onClick={() => setTab(key)}>
                            {label}
                            {key === "seo" && errorCountFor("seo") > 0 && <span className="pa-badge-error">{errorCountFor("seo")}</span>}
                            {key === "history" && <span className="pa-badge">{history.length}</span>}
                        </button>
                    ))}
                </div>

                {tab === "content" && (
                    <div className="pa-layout">
                        <nav className="pa-rail" aria-label="About page sections">
                            <ol>
                                {SECTIONS.map((s, i) => {
                                    const errs = errorCountFor(s.key);
                                    const visible = form[s.key].visible;
                                    return (
                                        <li key={s.key}>
                                            <button type="button" className={`pa-rail-item ${active === i ? "is-active" : ""}`} aria-current={active === i ? "true" : undefined} onClick={() => setActive(i)}>
                                                <span className="pa-rail-no">{i + 1}</span>
                                                <span className="pa-rail-text">
                                                    <strong>{s.label}</strong>
                                                    <small>{visible ? s.hint : "Hidden from the page"}</small>
                                                </span>
                                                {errs > 0 ? <span className="pa-badge-error" title={`${errs} to fix`}>{errs}</span> : changedKeys.includes(s.key) ? <span className="pa-dot" title="Edited" /> : null}
                                            </button>
                                        </li>
                                    );
                                })}
                            </ol>
                        </nav>
                        <div className="pa-panel"><Editor /></div>
                    </div>
                )}
                {tab === "seo" && <SeoPanel />}
                {tab === "history" && <HistoryPanel history={history} />}

                {dirty && (
                    <div className="pa-savebar" role="region" aria-label="Unsaved changes">
                        <span className="pa-savebar-text"><i /> {changedLabels.length} section{changedLabels.length === 1 ? "" : "s"} edited, not saved</span>
                        <div>
                            <button type="button" className="pa-btn-ghost" onClick={() => { setForm(clone(saved)); setSubmitted(false); setToast({ tone: "info", text: "Changes discarded." }); }} disabled={busy}>Discard</button>
                            <button type="button" className="pa-btn-yellow" onClick={saveDraft} disabled={busy}>{busy ? "Saving..." : "Save draft"}</button>
                        </div>
                    </div>
                )}

                {dialog?.type === "delete" && (
                    <div className="pa-overlay" onMouseDown={(e) => e.target === e.currentTarget && setDialog(null)}>
                        <div className="pa-dialog pa-small" role="alertdialog" aria-modal="true" aria-labelledby="pa-del-title">
                            <span className="pa-dialog-icon is-danger"><Icon name="trash" size={22} /></span>
                            <h2 id="pa-del-title">Delete “{dialog.what}”?</h2>
                            <p>{dialog.note ? `${dialog.note} ` : ""}It moves to Content Trash, where only the Super Admin can restore or purge it. It disappears from the About page when you publish.</p>
                            <div className="pa-dialog-actions">
                                <button type="button" className="pa-btn-outline" onClick={() => setDialog(null)} autoFocus>Keep it</button>
                                <button type="button" className="pa-btn-danger" onClick={confirmDelete}><Icon name="trash" size={15} /> Move to Trash</button>
                            </div>
                        </div>
                    </div>
                )}

                {["publish", "schedule", "unpublish"].includes(dialog?.type) && (
                    <div className="pa-overlay" onMouseDown={(e) => e.target === e.currentTarget && !busy && setDialog(null)}>
                        <div className="pa-dialog pa-small" role="alertdialog" aria-modal="true" aria-labelledby="pa-act-title">
                            <span className={`pa-dialog-icon ${dialog.type === "unpublish" ? "is-danger" : ""}`}><Icon name={dialog.type === "schedule" ? "clock" : dialog.type === "unpublish" ? "unlink" : "upload"} size={22} /></span>
                            <h2 id="pa-act-title">{dialog.type === "publish" ? "Publish the About page?" : dialog.type === "schedule" ? "Schedule publication" : "Unpublish the About page?"}</h2>
                            {dialog.type === "unpublish" ? (
                                <p>Visitors will no longer see the About page until you publish it again. Nothing is deleted.</p>
                            ) : (
                                <>
                                    <p>{dialog.type === "publish" ? "Visitors will see your changes straight away." : "Your changes go live automatically at the time you choose."}</p>
                                    {changedLabels.length > 0 ? (
                                        <ul className="pa-dialog-list">{changedLabels.map((l) => <li key={l}><Icon name="check" size={14} /> {l}</li>)}</ul>
                                    ) : (
                                        <p className="pa-hint">No new edits. This publishes the last saved draft.</p>
                                    )}
                                </>
                            )}
                            {dialog.type === "schedule" && (
                                <label className="pa-field">
                                    <span className="pa-field-top"><span>Publish on</span></span>
                                    <input type="datetime-local" className="pa-input" value={scheduleAt} min={new Date(Date.now() - new Date().getTimezoneOffset() * MIN).toISOString().slice(0, 16)} onChange={(e) => setScheduleAt(e.target.value)} />
                                </label>
                            )}
                            <div className="pa-dialog-actions">
                                <button type="button" className="pa-btn-outline" onClick={() => setDialog(null)} disabled={busy}>Cancel</button>
                                <button type="button" className={dialog.type === "unpublish" ? "pa-btn-danger" : "pa-btn-dark"} onClick={confirmAction} disabled={busy}>
                                    {busy ? "Working..." : dialog.type === "publish" ? "Publish now" : dialog.type === "schedule" ? "Schedule" : "Unpublish"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {picker && <MediaPicker state={picker} media={media} onClose={() => setPicker(null)} onUpload={uploadMedia} />}
                {preview && <PreviewModal form={form} media={media} previewUrl={props.about?.previewUrl} onClose={() => setPreview(false)} />}

                {toast && (
                    <div className={`pa-toast is-${toast.tone}`} role="status">
                        <Icon name={toast.tone === "error" ? "alert" : "check"} size={16} />
                        <span>{toast.text}</span>
                        <button type="button" aria-label="Dismiss" onClick={() => setToast(null)}><Icon name="close" size={14} /></button>
                    </div>
                )}
            </div>
        </Ctx.Provider>
    );
}

/* Wrap the page with your PSB shell here if your app does not already do it
   (your app.jsx already picks PSBLayout for admin-PSB pages, so normally you do not need this):
   import NavigationBar from "../../Components/Admin-Components/PSB/NavigationBar";
   AdminPSBAbout.layout = (page) => <NavigationBar>{page}</NavigationBar>;                */

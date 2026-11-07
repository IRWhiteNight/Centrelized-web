import { createContext, useContext, useEffect, useId, useMemo, useRef, useState } from "react";
import { router, usePage } from "@inertiajs/react";
import "../../../css/admin-COEUAS-css/admin-facilities-services.css";

/* ====================================================================
   COE-UAS ADMIN → FACILITIES AND SERVICES EDITOR   /admin/coeuas/facilities-services/*

   Site map 1.3 (COE-UAS workspace → "Facilities and Services"), one editor for four modules:
     1  Facilities and equipment              → facilities                     (/facilities-services/facilities)
     2  Engineering and technical services    → technical_services             (/facilities-services/services)
     3  Industry solutions and case studies   → industry_solutions             (/facilities-services/solutions)
     4  Training courses and calendar         → training_courses + training_sessions (/facilities-services/training)
   Use case 2.3: "Manage Facilities and Equipment", "Manage Technical Services",
   "Manage Industry Solutions and Case Studies", "Manage Training Courses and Calendar".
   Common screens: list with search / filter / sort, create / edit, preview, publish / unpublish,
   delete to Trash, History tab (audit_logs). Public page: FACILITIES AND SERVICES (incl. training calendar).

   ADDITIONS TO THE ERD (the page needs them for "draft, preview and publish"):
     facilities, technical_services, industry_solutions get `is_published` BOOLEAN.
     training_courses already has status ENUM(draft,published), so it needs nothing.
     facilities.status (VARCHAR 40) is used here as the operating status: operational | under_development | maintenance.

   SAMPLE DATA: works today (changes stay on screen only). Return an Inertia prop named
   `facilitiesServices` and it switches to LIVE mode:

   Inertia::render('admin-COEUAS/AdminCOEUASFacilitiesandServices', [
       'view' => 'facilities',   // optional: facilities | services | solutions | training
       'facilitiesServices' => [
           'data'    => ['facilities' => [], 'services' => [], 'solutions' => [], 'courses' => []], // same shape as `sampleData`
           'catalog' => ['media' => [...]],
           'history' => [...],    // audit_logs rows
           'previewUrl' => 'https://...',
       ],
   ]);

   Send the same prop for all four sidebar routes. Save sends only the collections that changed:
   PUT /admin/coeuas/facilities-services  { facilities?, services?, solutions?, courses? }
   courses carry their `sessions` array (training_sessions rows).
   The controller must write audit_logs and soft-delete (deleted_at) removed records.
==================================================================== */

const BASE = "/admin/coeuas"; // keep in sync with coeuasRoutes.js
const ENDPOINTS = { save: `${BASE}/facilities-services`, upload: `${BASE}/media/upload` };
const PAGE = 8;
const MIN = 60 * 1000;
const NOW = Date.now();
const minsAgo = (m) => new Date(NOW - m * MIN).toISOString();
let counter = 0;
const uid = () => `n${Date.now().toString(36)}${(counter += 1)}`;

/* enums from the ERD */
const FACILITY_TYPES = [
    { value: "lab", label: "Laboratory" }, { value: "workshop", label: "Workshop" }, { value: "aircraft_platform", label: "Aircraft platform" },
    { value: "test_site", label: "Test site" }, { value: "development_project", label: "Development project" },
];
const FACILITY_STATUS = [{ value: "operational", label: "Operational" }, { value: "under_development", label: "Under development" }, { value: "maintenance", label: "Maintenance" }];
const SECTORS = [
    { value: "survey", label: "Survey and mapping" }, { value: "stockpile", label: "Stockpile measurement" }, { value: "heritage", label: "Heritage" },
    { value: "security", label: "Security" }, { value: "cargo", label: "Cargo" }, { value: "agriculture", label: "Agriculture" }, { value: "ai_vision", label: "AI vision" },
];
const COURSE_TYPES = [{ value: "drone", label: "Drone training" }, { value: "industry_agency", label: "Industry and agency" }, { value: "outreach", label: "Outreach" }];
const REG_STATUS = [{ value: "open", label: "Open" }, { value: "full", label: "Full" }, { value: "closed", label: "Closed" }];

/* One config per module. The list, cards, filters, validation and preview all read from it. */
const MODULES = {
    facilities: {
        key: "facilities", route: "facilities", tab: "Facilities", title: "Facilities and equipment", text: "Labs, workshops, aircraft platforms and test sites shown on the Facilities page.",
        noun: "facility", add: "Add facility", nameKey: "name", typeKey: "typeKey", typeField: "facilityType", mediaKey: "coverId", mediaLabel: "Cover image",
        typeOpts: () => FACILITY_TYPES, allTypes: "All types",
        sub: (x) => labelOf(FACILITY_TYPES, x.facilityType),
        blank: () => ({ id: uid(), coverId: null, name: "", slug: "", facilityType: "lab", description: "", specifications: "", status: "operational", isPublished: false }),
        fields: [
            { k: "name", label: "Name" }, { k: "slug", label: "Web address (slug)", hint: (x) => `/facilities/${x.slug || "…"}` },
            { k: "facilityType", label: "Type", opts: FACILITY_TYPES }, { k: "status", label: "Operating status", opts: FACILITY_STATUS },
            { k: "description", label: "Description", rows: 4, wide: true }, { k: "specifications", label: "Specifications and equipment", rows: 5, wide: true, hint: "One item per line" },
        ],
    },
    services: {
        key: "services", route: "services", tab: "Technical services", title: "Engineering and technical services", text: "Services the centre offers to industry and agencies.",
        noun: "service", add: "Add service", nameKey: "title", typeField: "category", mediaKey: "iconId", mediaLabel: "Icon",
        typeOpts: (d) => [...new Set(d.services.map((s) => s.category).filter(Boolean))].map((c) => ({ value: c, label: c })), allTypes: "All categories",
        sub: (x) => x.category || "No category",
        blank: () => ({ id: uid(), iconId: null, category: "", title: "", description: "", isPublished: false }),
        fields: [
            { k: "title", label: "Service title" }, { k: "category", label: "Category", hint: () => "Groups the services on the public page, for example Mapping and survey" },
            { k: "description", label: "Description", rows: 5, wide: true },
        ],
    },
    solutions: {
        key: "solutions", route: "solutions", tab: "Industry solutions", title: "Industry solutions and case studies", text: "Solutions by sector, each with a case study.",
        noun: "solution", add: "Add solution", nameKey: "title", typeField: "sector", mediaKey: "coverId", mediaLabel: "Cover image",
        typeOpts: () => SECTORS, allTypes: "All sectors",
        sub: (x) => labelOf(SECTORS, x.sector),
        blank: () => ({ id: uid(), coverId: null, sector: "survey", title: "", summary: "", caseStudyBody: "", isPublished: false }),
        fields: [
            { k: "title", label: "Title" }, { k: "sector", label: "Sector", opts: SECTORS },
            { k: "summary", label: "Summary", rows: 3, wide: true, hint: () => "Shown on the solution card" }, { k: "caseStudyBody", label: "Case study", rows: 8, wide: true },
        ],
    },
    courses: {
        key: "courses", route: "training", tab: "Courses", title: "Training courses and calendar", text: "Courses and the dated sessions that make up the training calendar.",
        noun: "course", add: "Add course", nameKey: "title", typeField: "courseType", mediaKey: "coverId", mediaLabel: "Cover image",
        typeOpts: () => COURSE_TYPES, allTypes: "All course types",
        sub: (x) => `${labelOf(COURSE_TYPES, x.courseType)}${x.duration ? ` · ${x.duration}` : ""}`,
        blank: () => ({ id: uid(), coverId: null, courseType: "drone", title: "", description: "", duration: "", status: "draft", sessions: [] }),
        fields: [
            { k: "title", label: "Course title" }, { k: "courseType", label: "Course type", opts: COURSE_TYPES },
            { k: "duration", label: "Duration", hint: () => "For example 5 days" }, { k: "description", label: "Description", rows: 4, wide: true },
        ],
    },
};
const VIEWS = Object.values(MODULES).map((m) => ({ key: m.route, mod: m.key, route: m.route, title: m.title, text: m.text }));
const KEY_LABEL = { facilities: "Facilities", services: "Technical services", solutions: "Industry solutions", courses: "Training courses" };
const DATA_KEYS = Object.keys(KEY_LABEL);

/* ------------------------------ sample data ------------------------------ */

const sampleData = {
    facilities: [
        { id: 1, coverId: null, name: "UAS Flight Test Range", slug: "uas-flight-test-range", facilityType: "test_site", description: "A controlled outdoor range for flight trials, with a ground control station and safety perimeter.", specifications: "300 m runway\nGround control station\nWeather station", status: "operational", isPublished: true },
        { id: 2, coverId: null, name: "Composite Structures Lab", slug: "composite-structures-lab", facilityType: "lab", description: "Layup, curing and testing of lightweight airframe parts.", specifications: "Autoclave\nTensile test rig", status: "operational", isPublished: true },
        { id: 3, coverId: null, name: "Hybrid VTOL Prototype", slug: "hybrid-vtol-prototype", facilityType: "development_project", description: "", specifications: "", status: "under_development", isPublished: false },
    ],
    services: [
        { id: 1, iconId: null, category: "Mapping and survey", title: "Aerial survey and photogrammetry", description: "Orthomosaics, terrain models and volume measurement from UAS imagery.", isPublished: true },
        { id: 2, iconId: null, category: "Engineering", title: "Airframe design and testing", description: "Structural design, simulation and flight-readiness testing.", isPublished: true },
        { id: 3, iconId: null, category: "Engineering", title: "Payload integration", description: "", isPublished: false },
    ],
    solutions: [
        { id: 1, coverId: null, sector: "survey", title: "Quarry stockpile volumes in one flight", summary: "Replacing weeks of ground survey with a single drone mission.", caseStudyBody: "The client needed monthly volume reports for twelve stockpiles.\n\nWe flew one mission per month and delivered the report within two days.", isPublished: true },
        { id: 2, coverId: null, sector: "agriculture", title: "Crop health mapping for plantations", summary: "Multispectral maps that show where to treat first.", caseStudyBody: "", isPublished: true },
        { id: 3, coverId: null, sector: "heritage", title: "3D record of a heritage site", summary: "", caseStudyBody: "", isPublished: false },
    ],
    courses: [
        { id: 1, coverId: null, courseType: "drone", title: "Remote pilot certificate course", description: "Theory and flight practice for a first drone pilot certificate.", duration: "5 days", status: "published",
          sessions: [{ id: 1, startDate: "2026-12-07", endDate: "2026-12-11", venue: "COE-UAS training hall", seats: 20, registrationStatus: "open" }, { id: 2, startDate: "2026-03-02", endDate: "2026-03-06", venue: "COE-UAS training hall", seats: 20, registrationStatus: "closed" }] },
        { id: 2, coverId: null, courseType: "industry_agency", title: "Drone mapping for agencies", description: "", duration: "2 days", status: "draft", sessions: [] },
    ],
};
const sampleCatalog = { media: [{ id: 1, name: "test-range.jpg", type: "image", alt: "Flight test range", size: "1.1 MB", url: null }, { id: 2, name: "composite-lab.jpg", type: "image", alt: "Composite lab", size: "0.9 MB", url: null }, { id: 3, name: "service-icon.png", type: "image", alt: "Icon", size: "0.1 MB", url: null }] };
const sampleHistory = [
    { id: 2, user: "Aisyah Rahman", action: "UPDATE", label: "Training courses", at: minsAgo(60 * 6), changes: [{ field: "Training courses", from: "Previous version", to: "Updated" }] },
    { id: 1, user: "Hafiz Roslan", action: "CREATE", label: "Facilities", at: minsAgo(60 * 24 * 5), changes: [] },
];

/* ------------------------------- helpers -------------------------------- */

const clone = (v) => JSON.parse(JSON.stringify(v));
const sameJson = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const slugify = (s = "") => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const labelOf = (list, value) => list.find((o) => o.value === value)?.label || value || "";
const idEq = (a, b) => String(a) === String(b);
const lines = (t) => String(t || "").split("\n").map((s) => s.trim()).filter(Boolean);
const isPub = (m, x) => (m.key === "courses" ? x.status === "published" : x.isPublished);
const setPub = (m, x, v) => { if (m.key === "courses") x.status = v ? "published" : "draft"; else x.isPublished = v; };
const modOfError = (k) => k.split(".")[0];
const fmtDate = (iso) => { if (!iso) return ""; const d = new Date(`${iso}T00:00:00`); return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }); };
const todayIso = () => new Date().toISOString().slice(0, 10);

function timeAgo(iso) {
    const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / MIN));
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins} min ago`;
    const hrs = Math.round(mins / 60);
    if (hrs < 24) return `${hrs} hr ago`;
    const days = Math.round(hrs / 24);
    return `${days} day${days === 1 ? "" : "s"} ago`;
}

/* ------------------------------ validation ------------------------------- */
/* Drafts only need a name. Published records must be complete. */

function validate(d) {
    const e = {};
    const need = (key, value, msg) => { if (!String(value ?? "").trim()) e[key] = msg; };
    const slugs = new Set();
    d.facilities.forEach((f) => {
        const k = (x) => `facilities.${f.id}.${x}`;
        need(k("name"), f.name, "Write the facility name.");
        need(k("slug"), f.slug, "Add a web address.");
        if (f.slug) { if (slugs.has(f.slug)) e[k("slug")] = "This web address is already used by another facility."; slugs.add(f.slug); }
        if (f.isPublished) need(k("description"), f.description, "Add a description before publishing.");
    });
    d.services.forEach((s) => {
        const k = (x) => `services.${s.id}.${x}`;
        need(k("title"), s.title, "Write the service title.");
        if (s.isPublished) { need(k("category"), s.category, "Add a category before publishing."); need(k("description"), s.description, "Add a description before publishing."); }
    });
    d.solutions.forEach((s) => {
        const k = (x) => `solutions.${s.id}.${x}`;
        need(k("title"), s.title, "Write the solution title.");
        if (s.isPublished) need(k("summary"), s.summary, "Add a summary before publishing.");
    });
    d.courses.forEach((c) => {
        const k = (x) => `courses.${c.id}.${x}`;
        need(k("title"), c.title, "Write the course title.");
        if (c.status === "published") need(k("description"), c.description, "Add a description before publishing.");
        c.sessions.forEach((s) => {
            const sk = (x) => k(`session.${s.id}.${x}`);
            if (!s.startDate) e[sk("start")] = "Choose the start date.";
            if (s.startDate && s.endDate && s.endDate < s.startDate) e[sk("end")] = "The end date is before the start date.";
            if (s.seats !== "" && Number(s.seats) < 0) e[sk("seats")] = "Seats cannot be negative.";
        });
    });
    return e;
}

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
        alert: (<><path d="M12 3 2 20h20z" /><path d="M12 10v4M12 17h.01" /></>),
        check: <path d="m5 12 5 5 9-10" />,
        close: <path d="M18 6 6 18M6 6l12 12" />,
        image: (<><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" /></>),
        search: (<><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>),
        edit: <path d="M4 20h4L19 9l-4-4L4 16zM13 7l4 4" />,
    }[name];
    return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{p}</svg>;
}

/* ------------------------------ small parts ------------------------------ */

const Ctx = createContext(null);
const useCtx = () => useContext(Ctx);

function Field({ label, errorKey, value, onChange, textarea, hint, type = "text", rows = 3, wide, opts }) {
    const { errors } = useCtx();
    const errId = useId();
    const error = errorKey ? errors[errorKey] : null;
    const cls = `cfs-field ${error ? "has-error" : ""} ${wide ? "is-wide" : ""}`;
    if (opts) {
        return (
            <label className={cls}>
                <span className="cfs-label">{label}</span>
                <select className="cfs-input" value={value ?? ""} onChange={(e) => onChange(e.target.value)}>{opts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
            </label>
        );
    }
    const Tag = textarea ? "textarea" : "input";
    return (
        <label className={cls}>
            <span className="cfs-label">{label}</span>
            <Tag className="cfs-input" type={textarea ? undefined : type} rows={textarea ? rows : undefined} min={type === "number" ? 0 : undefined} value={value ?? ""}
                aria-invalid={error ? "true" : undefined} aria-describedby={error ? errId : undefined} onChange={(e) => onChange(e.target.value)} />
            {hint && !error && <em className="cfs-hint">{hint}</em>}
            {error && <em className="cfs-error" id={errId}><Icon name="alert" size={13} /> {error}</em>}
        </label>
    );
}

function Switch({ checked, onChange, label }) {
    return (
        <label className="cfs-switch">
            <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
            <i aria-hidden="true" />
            <span>{label}</span>
        </label>
    );
}

function Thumb({ mediaId }) {
    const { media } = useCtx();
    const m = media.find((x) => idEq(x.id, mediaId));
    return <span className={`cfs-thumb ${m ? "has-item" : ""}`}>{m?.url ? <img src={m.url} alt="" /> : <Icon name="image" size={18} />}</span>;
}

function MediaSlot({ label, mediaId, onPick, onClear }) {
    const { media } = useCtx();
    const item = media.find((m) => idEq(m.id, mediaId));
    return (
        <div className="cfs-media">
            <span className="cfs-label">{label}</span>
            <div className="cfs-media-box">
                <Thumb mediaId={mediaId} />
                <span className="cfs-media-text"><strong>{item ? item.name : "Nothing selected"}</strong><small>{item ? item.alt || "No alt text yet" : "Choose from the Media Library"}</small></span>
                <button type="button" className="cfs-btn-small" onClick={onPick}>{item ? "Change" : "Choose"}</button>
                {item && <button type="button" className="cfs-iconbtn" aria-label="Remove image" onClick={onClear}><Icon name="close" size={15} /></button>}
            </div>
        </div>
    );
}

function PanelHead({ title, text, children }) {
    return <div className="cfs-panel-head"><div><h2>{title}</h2><p>{text}</p></div>{children}</div>;
}

/* ------------------- one list + card editor for every module ------------------- */

function ModuleView({ mod, focusId, setFocusId }) {
    const { data, edit, errors, askDelete } = useCtx();
    const [q, setQ] = useState("");
    const [type, setType] = useState("all");
    const [status, setStatus] = useState("all");
    const [sort, setSort] = useState("name");
    const [shown, setShown] = useState(PAGE);
    const [openId, setOpenId] = useState(focusId);
    useEffect(() => { if (focusId) { setOpenId(focusId); setFocusId(null); } }, [focusId, setFocusId]);

    const items = data[mod.key];
    const term = q.trim().toLowerCase();
    const list = useMemo(() => {
        const out = items.map((x, i) => ({ x, i })).filter(({ x }) =>
            (type === "all" || x[mod.typeField] === type) &&
            (status === "all" || (status === "published") === isPub(mod, x)) &&
            (!term || `${x[mod.nameKey]} ${x.category || ""} ${x.description || x.summary || ""}`.toLowerCase().includes(term)));
        out.sort((a, b) => (sort === "name-desc" ? -1 : 1) * String(a.x[mod.nameKey]).localeCompare(String(b.x[mod.nameKey])));
        return out;
    }, [items, type, status, term, sort, mod]);

    const add = () => { const item = mod.blank(); edit((d) => { d[mod.key].push(item); }); setOpenId(item.id); setQ(""); setType("all"); setStatus("all"); };
    const pubCount = items.filter((x) => isPub(mod, x)).length;

    return (
        <div className="cfs-panel">
            <PanelHead title={mod.title} text={`${mod.text} ${pubCount} of ${items.length} published.`}>
                <button type="button" className="cfs-btn-small" onClick={add}><Icon name="plus" size={15} /> {mod.add}</button>
            </PanelHead>
            <div className="cfs-toolbar">
                <label className="cfs-search"><Icon name="search" size={16} /><input type="search" value={q} placeholder={`Search ${mod.noun}s`} aria-label={`Search ${mod.noun}s`} onChange={(e) => { setQ(e.target.value); setShown(PAGE); }} /></label>
                <select className="cfs-input" aria-label="Filter" value={type} onChange={(e) => { setType(e.target.value); setShown(PAGE); }}>
                    <option value="all">{mod.allTypes}</option>{mod.typeOpts(data).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <select className="cfs-input" aria-label="Status" value={status} onChange={(e) => { setStatus(e.target.value); setShown(PAGE); }}>
                    <option value="all">Any status</option><option value="published">Published</option><option value="draft">Draft</option>
                </select>
                <select className="cfs-input" aria-label="Sort" value={sort} onChange={(e) => setSort(e.target.value)}><option value="name">A to Z</option><option value="name-desc">Z to A</option></select>
            </div>
            {list.length === 0 && <p className="cfs-empty">{items.length ? "Nothing matches these filters." : `No ${mod.noun}s yet. Add the first one.`}</p>}
            <ol className="cfs-list">
                {list.slice(0, shown).map(({ x, i }) => {
                    const open = idEq(openId, x.id);
                    const bad = Object.keys(errors).filter((k) => k.startsWith(`${mod.key}.${x.id}.`)).length;
                    const pub = isPub(mod, x);
                    const set = (k, v) => edit((d) => { const t = d[mod.key][i]; if (mod.key === "facilities" && k === "name" && (!t.slug || t.slug === slugify(t.name))) t.slug = slugify(v); t[k] = k === "slug" ? slugify(v) : v; });
                    return (
                        <li key={x.id} className="cfs-card">
                            <div className="cfs-card-top">
                                <button type="button" className="cfs-toggle" aria-expanded={open} onClick={() => setOpenId(open ? null : x.id)}>
                                    <Thumb mediaId={x[mod.mediaKey]} />
                                    <span className="cfs-toggle-text"><strong>{x[mod.nameKey] || `New ${mod.noun}`}</strong><small>{mod.sub(x)}</small></span>
                                    <Icon name={open ? "up" : "down"} size={17} />
                                </button>
                                {bad > 0 && <span className="cfs-badge-error">{bad}</span>}
                                {mod.key === "courses" && <span className="cfs-pill is-info">{x.sessions.length} session{x.sessions.length === 1 ? "" : "s"}</span>}
                                {mod.key === "facilities" && <span className={`cfs-pill ${x.status === "operational" ? "is-ok" : "is-warn"}`}>{labelOf(FACILITY_STATUS, x.status)}</span>}
                                <span className={`cfs-pill ${pub ? "is-ok" : "is-off"}`}>{pub ? "Published" : "Draft"}</span>
                                <button type="button" className="cfs-iconbtn is-danger" aria-label={`Delete ${x[mod.nameKey] || mod.noun}`} onClick={() => askDelete({ what: x[mod.nameKey] || `this ${mod.noun}`, onConfirm: () => edit((d) => { d[mod.key].splice(i, 1); }) })}><Icon name="trash" size={16} /></button>
                            </div>
                            {open && (
                                <div className="cfs-card-body">
                                    <div className="cfs-grid">
                                        {mod.fields.map((f) => (
                                            <Field key={f.k} label={f.label} wide={f.wide} opts={f.opts} textarea={Boolean(f.rows)} rows={f.rows} errorKey={`${mod.key}.${x.id}.${f.k}`} value={x[f.k]} hint={f.hint ? f.hint(x) : undefined} onChange={(v) => set(f.k, v)} />
                                        ))}
                                    </div>
                                    <MediaSlot label={mod.mediaLabel} mediaId={x[mod.mediaKey]} onPick={() => pickMediaFor(set, mod.mediaKey)} onClear={() => set(mod.mediaKey, null)} />
                                    {mod.key === "courses" && <Sessions course={x} i={i} />}
                                    <Switch checked={pub} label={pub ? "Published on the website" : "Draft, not on the website"} onChange={(v) => edit((d) => { setPub(mod, d[mod.key][i], v); })} />
                                </div>
                            )}
                        </li>
                    );
                })}
            </ol>
            {list.length > shown && <button type="button" className="cfs-btn-outline" onClick={() => setShown((n) => n + PAGE)}>Show more ({list.length - shown} left)</button>}
        </div>
    );

    function pickMediaFor(set, key) { pickerRef.current?.({ type: "image", onSelect: (m) => set(key, m.id) }); }
}

const pickerRef = { current: null };

/* training_sessions rows, nested in a course */
function Sessions({ course, i }) {
    const { edit } = useCtx();
    const upd = (j, k, v) => edit((d) => { d.courses[i].sessions[j][k] = v; });
    return (
        <div className="cfs-sub">
            <div className="cfs-sub-head">
                <h3>Sessions and calendar dates</h3>
                <button type="button" className="cfs-btn-small" onClick={() => edit((d) => { d.courses[i].sessions.push({ id: uid(), startDate: "", endDate: "", venue: "", seats: "", registrationStatus: "open" }); })}><Icon name="plus" size={15} /> Add session</button>
            </div>
            {course.sessions.length === 0 && <p className="cfs-empty">No sessions yet. Add a date so the course appears in the calendar.</p>}
            {course.sessions.map((s, j) => (
                <div key={s.id} className="cfs-session">
                    <div className="cfs-sub-head">
                        <strong>Session {j + 1}</strong>
                        <button type="button" className="cfs-iconbtn is-danger" aria-label={`Delete session ${j + 1}`} onClick={() => edit((d) => { d.courses[i].sessions.splice(j, 1); })}><Icon name="trash" size={15} /></button>
                    </div>
                    <div className="cfs-grid cfs-grid-3">
                        <Field label="Starts" type="date" errorKey={`courses.${course.id}.session.${s.id}.start`} value={s.startDate} onChange={(v) => upd(j, "startDate", v)} />
                        <Field label="Ends" type="date" errorKey={`courses.${course.id}.session.${s.id}.end`} value={s.endDate} onChange={(v) => upd(j, "endDate", v)} />
                        <Field label="Registration" opts={REG_STATUS} value={s.registrationStatus} onChange={(v) => upd(j, "registrationStatus", v)} />
                        <Field label="Venue" value={s.venue} onChange={(v) => upd(j, "venue", v)} />
                        <Field label="Seats" type="number" errorKey={`courses.${course.id}.session.${s.id}.seats`} value={s.seats} onChange={(v) => upd(j, "seats", v === "" ? "" : Number(v))} />
                    </div>
                </div>
            ))}
        </div>
    );
}

/* the training calendar: every session of every course, by date */
function CalendarTab({ openCourse }) {
    const { data, edit } = useCtx();
    const [when, setWhen] = useState("upcoming");
    const today = todayIso();
    const rows = data.courses.flatMap((c, i) => c.sessions.map((s, j) => ({ c, i, s, j })))
        .filter(({ s }) => (when === "all" ? true : when === "upcoming" ? (s.endDate || s.startDate) >= today : (s.endDate || s.startDate) < today))
        .sort((a, b) => String(a.s.startDate).localeCompare(String(b.s.startDate)));
    const month = (iso) => (iso ? new Date(`${iso}T00:00:00`).toLocaleDateString("en-GB", { month: "long", year: "numeric" }) : "No date");
    const groups = rows.reduce((acc, r) => { const m = month(r.s.startDate); (acc[m] = acc[m] || []).push(r); return acc; }, {});
    return (
        <div className="cfs-panel">
            <PanelHead title="Training calendar" text="Every session of every course, as visitors see it. Add or change dates on the course." />
            <div className="cfs-chips" role="tablist" aria-label="Show">
                {[["upcoming", "Upcoming"], ["past", "Past"], ["all", "All"]].map(([v, l]) => <button key={v} type="button" role="tab" aria-selected={when === v} className={when === v ? "is-active" : ""} onClick={() => setWhen(v)}>{l}</button>)}
            </div>
            {rows.length === 0 && <p className="cfs-empty">No sessions to show.</p>}
            {Object.entries(groups).map(([m, list]) => (
                <section key={m} className="cfs-month">
                    <h3>{m}</h3>
                    <ul className="cfs-list">
                        {list.map(({ c, i, s, j }) => (
                            <li key={s.id} className="cfs-readrow">
                                <strong>{c.title || "Untitled course"}<small>{fmtDate(s.startDate)}{s.endDate ? ` to ${fmtDate(s.endDate)}` : ""}{s.venue ? ` · ${s.venue}` : ""}</small></strong>
                                <span className={`cfs-pill ${c.status === "published" ? "is-ok" : "is-off"}`}>{c.status === "published" ? "Published" : "Draft"}</span>
                                <select className="cfs-input cfs-mini" aria-label="Registration" value={s.registrationStatus} onChange={(e) => edit((d) => { d.courses[i].sessions[j].registrationStatus = e.target.value; })}>{REG_STATUS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
                                <button type="button" className="cfs-btn-small" onClick={() => openCourse(c.id)}><Icon name="edit" size={14} /> Edit course</button>
                            </li>
                        ))}
                    </ul>
                </section>
            ))}
        </div>
    );
}

/* --------------------------- history, picker --------------------------- */

const ACTION_TONE = { CREATE: "is-new", UPDATE: "is-info", PUBLISH: "is-ok", UNPUBLISH: "is-warn", DELETE: "is-danger", RESTORE: "is-ok" };

function HistoryPanel({ history }) {
    return (
        <div className="cfs-panel cfs-narrow">
            <PanelHead title="History" text="Every change in Facilities and Services, from the audit log." />
            {history.length === 0 && <p className="cfs-empty">Nothing recorded yet.</p>}
            <ol className="cfs-history">
                {history.map((h) => (
                    <li key={h.id}>
                        <span className={`cfs-pill ${ACTION_TONE[h.action] || "is-info"}`}>{h.action}</span>
                        <div><strong>{h.label}</strong><small>{h.user} · {timeAgo(h.at)}</small>
                            {h.changes?.length > 0 && <ul>{h.changes.map((c, k) => <li key={k}>{c.field}: {c.from} → {c.to}</li>)}</ul>}</div>
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
        <div className="cfs-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
            <div className="cfs-dialog" role="dialog" aria-modal="true" aria-labelledby={titleId}>
                <div className="cfs-dialog-head"><h2 id={titleId}>Media Library</h2><button type="button" className="cfs-iconbtn" aria-label="Close" onClick={onClose}><Icon name="close" size={16} /></button></div>
                <div className="cfs-media-grid">
                    {list.map((m) => (
                        <button key={m.id} type="button" className="cfs-media-item" onClick={() => { state.onSelect(m); onClose(); }}>
                            <span className="cfs-media-preview">{m.url ? <img src={m.url} alt="" /> : <Icon name="image" size={26} />}</span><strong>{m.name}</strong><small>{m.size}</small>
                        </button>
                    ))}
                    {list.length === 0 && <p className="cfs-empty">The library has no images yet.</p>}
                </div>
                <div className="cfs-dialog-actions">
                    <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => { if (e.target.files[0]) onUpload(e.target.files[0]); e.target.value = ""; }} />
                    <button type="button" className="cfs-btn-outline" onClick={() => fileRef.current?.click()}><Icon name="upload" size={15} /> Upload new</button>
                    <button type="button" className="cfs-btn-dark" onClick={onClose}>Done</button>
                </div>
            </div>
        </div>
    );
}

/* ---------------------- full-page preview (public look) ---------------------- */

const SITE_NAV = ["Home", "About", "People", "Research and Innovation", "Publications", "Facilities and Services", "Engagement", "Contact"];
const DEVICES = [{ key: "desktop", label: "Desktop", width: null }, { key: "tablet", label: "Tablet", width: 820 }, { key: "mobile", label: "Mobile", width: 390 }];

function PreviewModal({ data, media, mod, onClose, previewUrl }) {
    const [device, setDevice] = useState("desktop");
    const width = DEVICES.find((d) => d.key === device).width;
    const imgOf = (id) => media.find((m) => idEq(m.id, id))?.url || null;
    useEffect(() => {
        const onKey = (e) => e.key === "Escape" && onClose();
        document.addEventListener("keydown", onKey);
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
    }, [onClose]);

    const live = data[mod.key].filter((x) => isPub(mod, x));
    const hidden = data[mod.key].length - live.length;
    const Pic = ({ id }) => { const s = imgOf(id); return s ? <img className="cfv-pic" src={s} alt="" /> : <span className="cfv-pic is-empty" />; };
    const groupBy = (items, key, opts) => { const g = {}; items.forEach((x) => { const k = x[key] || "Other"; (g[k] = g[k] || []).push(x); }); return Object.entries(g).map(([k, v]) => [labelOf(opts || [], k), v]); };
    const today = todayIso();

    let groups = [];
    if (mod.key === "facilities") groups = groupBy(live, "facilityType", FACILITY_TYPES);
    if (mod.key === "services") groups = groupBy(live, "category");
    if (mod.key === "solutions") groups = groupBy(live, "sector", SECTORS);
    if (mod.key === "courses") groups = groupBy(live, "courseType", COURSE_TYPES);

    const card = (x) => (
        <li key={x.id} className="cfv-card">
            <Pic id={x[mod.mediaKey]} />
            <b>{x[mod.nameKey]}</b>
            <span>{x.description || x.summary}</span>
            {mod.key === "facilities" && lines(x.specifications).length > 0 && <ul className="cfv-specs">{lines(x.specifications).map((s) => <li key={s}>{s}</li>)}</ul>}
            {mod.key === "facilities" && x.status !== "operational" && <em>{labelOf(FACILITY_STATUS, x.status)}</em>}
            {mod.key === "solutions" && x.caseStudyBody && <em>Case study available</em>}
            {mod.key === "courses" && x.duration && <small>{x.duration}</small>}
            {mod.key === "courses" && x.sessions.filter((s) => (s.endDate || s.startDate) >= today).sort((a, b) => a.startDate.localeCompare(b.startDate)).map((s) => (
                <em key={s.id}>{fmtDate(s.startDate)}{s.venue ? `, ${s.venue}` : ""} · {labelOf(REG_STATUS, s.registrationStatus)}</em>
            ))}
        </li>
    );

    return (
        <div className="cfv-overlay" role="dialog" aria-modal="true" aria-label="Page preview">
            <div className="cfv-bar">
                <div className="cfv-bar-left"><span className="cfv-live"><i /> Preview</span><small>Your current edits, not the live page.{hidden > 0 && ` ${hidden} draft${hidden === 1 ? "" : "s"} hidden.`}</small></div>
                <div className="cfv-devices" role="tablist" aria-label="Screen size">
                    {DEVICES.map((d) => <button key={d.key} type="button" role="tab" aria-selected={device === d.key} className={device === d.key ? "is-on" : ""} onClick={() => setDevice(d.key)}>{d.label}</button>)}
                </div>
                <div className="cfv-bar-right">
                    {previewUrl && <a className="cfv-bar-btn" href={previewUrl} target="_blank" rel="noreferrer">Open saved preview</a>}
                    <button type="button" className="cfv-bar-btn" onClick={onClose}>Close <kbd>Esc</kbd></button>
                </div>
            </div>
            <div className="cfv-stage">
                <div className={`cfv-frame is-${device}`} style={width ? { width } : undefined}>
                    <div className="cfv">
                        <header className="cfv-nav"><b className="cfv-brand"><i />COE-UAS</b><nav aria-label="Site (preview)">{SITE_NAV.map((n) => <span key={n} className={n === "Facilities and Services" ? "is-on" : ""}>{n}</span>)}</nav><span className="cfv-cta">Contact us</span></header>
                        <div className="cfv-hero"><div className="cfv-wrap"><p><span>Facilities and Services</span> {mod.title}</p></div></div>
                        <section className="cfv-sec"><div className="cfv-wrap">
                            <h2>{mod.title}</h2>
                            {groups.length === 0 && <p className="cfv-sub">Nothing published yet.</p>}
                            {groups.map(([title, items]) => <div key={title} className="cfv-group"><h3>{title}</h3><ul className="cfv-grid">{items.map(card)}</ul></div>)}
                        </div></section>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* -------------------------------- the page -------------------------------- */

const pathInfo = (props, url) => props.view || VIEWS.find((v) => (url || "").includes(`/facilities-services/${v.route}`))?.key || "facilities";
const modOfView = (key) => MODULES[VIEWS.find((v) => v.key === key)?.mod || "facilities"];

export default function AdminCOEUASFacilitiesandServices() {
    const { props, url } = usePage();
    const live = Boolean(props.facilitiesServices?.data);
    const dialogTitleId = useId();
    const seed = useRef(live
        ? { data: { facilities: [], services: [], solutions: [], courses: [], ...props.facilitiesServices.data }, catalog: props.facilitiesServices.catalog, history: props.facilitiesServices.history || [] }
        : { data: sampleData, catalog: sampleCatalog, history: sampleHistory }).current;

    const [saved, setSaved] = useState(() => clone(seed.data));
    const [data, setData] = useState(() => clone(seed.data));
    const [localHistory, setLocalHistory] = useState(seed.history);
    const [mediaList, setMediaList] = useState(seed.catalog?.media || []);
    const history = live ? props.facilitiesServices.history || [] : localHistory;

    const [view, setView] = useState(pathInfo(props, url));
    const [tab, setTab] = useState("content");
    const [focusId, setFocusId] = useState(null);
    const [submitted, setSubmitted] = useState(false);
    const [busy, setBusy] = useState(false);
    const [dialog, setDialog] = useState(null);
    const [picker, setPicker] = useState(null);
    const [preview, setPreview] = useState(false);
    const [toast, setToast] = useState(null);
    const busyRef = useRef(false);

    useEffect(() => { setView(pathInfo(props, url)); setTab("content"); }, [props.view, url]);

    const dirty = useMemo(() => !sameJson(data, saved), [data, saved]);
    const allErrors = useMemo(() => validate(data), [data]);
    const errors = useMemo(() => ({ ...(props.errors || {}), ...(submitted ? allErrors : {}) }), [props.errors, submitted, allErrors]);
    const totalErrors = Object.keys(allErrors).length;
    const changedKeys = useMemo(() => DATA_KEYS.filter((k) => !sameJson(data[k], saved[k])), [data, saved]);
    const changedLabels = changedKeys.map((k) => KEY_LABEL[k]);

    useEffect(() => {
        if (!toast) return undefined;
        const t = setTimeout(() => setToast(null), 5000);
        return () => clearTimeout(t);
    }, [toast]);

    /* warn before leaving with unsaved changes (moving between the four links is allowed: same page) */
    useEffect(() => {
        const beforeUnload = (e) => { if (dirty) { e.preventDefault(); e.returnValue = ""; } };
        window.addEventListener("beforeunload", beforeUnload);
        const off = router.on("before", (event) => {
            const target = event?.detail?.visit?.url?.pathname || "";
            if (target.startsWith(`${BASE}/facilities-services`)) return undefined;
            if (dirty && !busyRef.current && !window.confirm("You have unsaved changes. Leave this page and discard them?")) return false;
            return undefined;
        });
        return () => { window.removeEventListener("beforeunload", beforeUnload); if (typeof off === "function") off(); };
    }, [dirty]);

    const edit = (fn) => setData((d) => { const copy = clone(d); fn(copy); return copy; });
    const askDelete = (info) => setDialog({ type: "delete", ...info });
    const finishBusy = () => { setBusy(false); busyRef.current = false; };
    pickerRef.current = (opts) => setPicker(opts);

    const addHistory = (action, label, changes = []) => setLocalHistory((h) => [{ id: Date.now(), user: "You", action, label, at: new Date().toISOString(), changes }, ...h]);

    const jumpToFirstError = () => {
        const first = Object.keys(allErrors)[0];
        if (!first) return;
        const p = first.split(".");
        setView(MODULES[modOfError(first)].route); setTab("content"); setFocusId(p[1]);
        setTimeout(() => document.querySelector(".cfs-field.has-error")?.scrollIntoView({ behavior: "smooth", block: "center" }), 200);
    };

    const save = () => {
        if (!dirty || busy) return;
        if (totalErrors) {
            setSubmitted(true);
            setToast({ tone: "error", text: `Fix ${totalErrors} field${totalErrors === 1 ? "" : "s"} before saving.` });
            jumpToFirstError();
            return;
        }
        setBusy(true); busyRef.current = true;
        const payload = Object.fromEntries(changedKeys.map((k) => [k, data[k]]));
        const done = () => {
            setSaved(clone(data)); setSubmitted(false);
            if (!live) addHistory("UPDATE", changedLabels.join(", "), changedLabels.map((l) => ({ field: l, from: "Previous version", to: "Updated" })));
            setToast({ tone: "ok", text: "Saved. Published records are now live on the website." });
            finishBusy();
        };
        if (live) router.put(ENDPOINTS.save, payload, { preserveScroll: true, preserveState: true, onSuccess: done, onError: () => { finishBusy(); setSubmitted(true); setToast({ tone: "error", text: "The server rejected some values. Check the highlighted fields." }); } });
        else setTimeout(done, 350);
    };

    const confirmDelete = () => {
        dialog.onConfirm();
        if (!live) addHistory("DELETE", `${modOfView(view).title}: ${dialog.what}`, [{ field: "Moved to Trash", from: dialog.what, to: "(deleted)" }]);
        setToast({ tone: "ok", text: `“${dialog.what}” moved to Trash. It leaves the website when you save.` });
        setDialog(null);
    };

    const uploadMedia = (file) => {
        if (live) {
            router.post(ENDPOINTS.upload, { file }, { forceFormData: true, preserveScroll: true, preserveState: true, onSuccess: () => setToast({ tone: "ok", text: `${file.name} uploaded.` }), onError: () => setToast({ tone: "error", text: "The upload failed. Try a smaller image." }) });
        } else {
            setMediaList((m) => [{ id: Date.now(), name: file.name, type: "image", alt: "", size: `${(file.size / 1048576).toFixed(1)} MB`, url: URL.createObjectURL(file) }, ...m]);
            setToast({ tone: "ok", text: `${file.name} added (sample data, not stored).` });
        }
    };

    useEffect(() => {
        const onKey = (e) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") { e.preventDefault(); save(); } };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    });

    const media = live ? props.facilitiesServices.catalog?.media || mediaList : mediaList;
    const mod = modOfView(view);
    const current = VIEWS.find((v) => v.key === view) || VIEWS[0];
    const tabs = [["content", mod.key === "courses" ? "Courses" : "List"], ...(mod.key === "courses" ? [["calendar", "Calendar"]] : []), ["history", "History"]];
    const published = data[mod.key].filter((x) => isPub(mod, x)).length;
    const ctx = { data, edit, errors, media, askDelete };

    return (
        <Ctx.Provider value={ctx}>
            <div className="coeuas-fs">
                <div className="cfs-heading">
                    <div>
                        <h1>{current.title}</h1>
                        <p>{current.text}</p>
                        <div className="cfs-status">
                            <span className="cfs-pill is-ok">{published} of {data[mod.key].length} published</span>
                            {dirty && <span className="cfs-pill is-warn">Unsaved: {changedLabels.join(", ")}</span>}
                            {totalErrors > 0 && submitted && <span className="cfs-pill is-danger">{totalErrors} to fix</span>}
                        </div>
                    </div>
                    <div className="cfs-actions">
                        <button type="button" className="cfs-btn-outline" onClick={() => setPreview(true)}><Icon name="eye" size={16} /> Preview</button>
                        <button type="button" className="cfs-btn-dark" onClick={save} disabled={!dirty || busy}><span className="cfs-btn-icon"><Icon name="save" size={16} /></span> {busy ? "Saving..." : "Save changes"}</button>
                    </div>
                </div>

                {!live && <p className="cfs-note"><Icon name="alert" size={16} /><span>Sample data. Every control works, but nothing is stored until your controller sends the <b>facilitiesServices</b> prop.</span></p>}

                <div className="cfs-tabs" role="tablist" aria-label="Facilities and Services editor">
                    {tabs.map(([key, label]) => (
                        <button key={key} type="button" role="tab" aria-selected={tab === key} className={tab === key ? "is-active" : ""} onClick={() => setTab(key)}>
                            {label}{key === "history" && <span className="cfs-badge">{history.length}</span>}
                        </button>
                    ))}
                </div>

                {tab === "history" && <HistoryPanel history={history} />}
                {tab === "calendar" && mod.key === "courses" && <CalendarTab openCourse={(id) => { setFocusId(id); setTab("content"); }} />}
                {tab === "content" && <ModuleView key={mod.key} mod={mod} focusId={focusId} setFocusId={setFocusId} />}

                {dirty && (
                    <div className="cfs-savebar" role="region" aria-label="Unsaved changes">
                        <span className="cfs-savebar-text"><i /> {changedLabels.length} area{changedLabels.length === 1 ? "" : "s"} edited, not saved</span>
                        <div>
                            <button type="button" className="cfs-btn-ghost" disabled={busy} onClick={() => { setData(clone(saved)); setSubmitted(false); setToast({ tone: "info", text: "Changes discarded." }); }}>Discard</button>
                            <button type="button" className="cfs-btn-accent" disabled={busy} onClick={save}>{busy ? "Saving..." : "Save changes"}</button>
                        </div>
                    </div>
                )}

                {dialog?.type === "delete" && (
                    <div className="cfs-overlay" onMouseDown={(e) => e.target === e.currentTarget && setDialog(null)}>
                        <div className="cfs-dialog cfs-small" role="alertdialog" aria-modal="true" aria-labelledby={dialogTitleId}>
                            <span className="cfs-dialog-icon"><Icon name="trash" size={22} /></span>
                            <h2 id={dialogTitleId}>Delete “{dialog.what}”?</h2>
                            <p>It moves to Deleted content, where only the Super Admin can restore or purge it. It leaves the website when you save.</p>
                            <div className="cfs-dialog-actions">
                                <button type="button" className="cfs-btn-outline" onClick={() => setDialog(null)} autoFocus>Keep it</button>
                                <button type="button" className="cfs-btn-danger" onClick={confirmDelete}><Icon name="trash" size={15} /> Move to Trash</button>
                            </div>
                        </div>
                    </div>
                )}

                {picker && <MediaPicker state={picker} media={media} onClose={() => setPicker(null)} onUpload={uploadMedia} />}
                {preview && <PreviewModal data={data} media={media} mod={mod} previewUrl={props.facilitiesServices?.previewUrl} onClose={() => setPreview(false)} />}

                {toast && (
                    <div className={`cfs-toast is-${toast.tone}`} role="status">
                        <Icon name={toast.tone === "error" ? "alert" : "check"} size={16} /><span>{toast.text}</span>
                        <button type="button" aria-label="Dismiss" onClick={() => setToast(null)}><Icon name="close" size={14} /></button>
                    </div>
                )}
            </div>
        </Ctx.Provider>
    );
}

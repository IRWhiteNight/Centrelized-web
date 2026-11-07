import { createContext, useContext, useEffect, useId, useMemo, useRef, useState } from "react";
import { router, usePage } from "@inertiajs/react";
import "../../../css/admin-COEUAS-css/admin-archive.css";

/* ====================================================================
   COE-UAS ADMIN → ARCHIVE TAXONOMY                /admin/coeuas/taxonomy

   Site map 1.3 (COE-UAS workspace → "Archive Taxonomy"):
     "Years, categories, status values, groups"
   Public side: ORGANISING ARCHIVE filters = year 2013 - 2026, member, group,
   category, status. Use case: "Manage Archive Taxonomy" (Site Settings and Media).

   Four modules, one editor:
     1  Years          → archive years 2013 - 2026 (shown / hidden in the year filter)
     2  Categories     → categories (site_id, category_type, name, slug UQ)
     3  Status values  → the ENUM status columns (ERD note: "can become lookup tables").
                         The code is fixed by the database; label, colour and
                         "show in filter" can be edited. Codes cannot be added or deleted.
     4  Groups         → research_groups used as an archive filter. Full group content
                         (overview, expertise, cover, members) stays in Research and Innovation.
   Members are chosen from the members table (never typed in by hand).

   Taxonomy is a lookup, so there is no draft / publish step: "Save changes" applies
   immediately. Deleting a record that is still used by content is blocked (usage check,
   same idea as the Media Library). Deleted records go to Trash (deleted_at).

   SAMPLE DATA: works today (changes stay on screen only). Return an Inertia prop
   named `archive` and it switches to LIVE mode:

   Inertia::render('admin-COEUAS/AdminCOEUASArchiveTaxonomy', [
       'archive' => [
           'content' => [...],   // same shape as `sampleContent` below (each item may carry `usage`)
           'meta'    => [...],   // updatedBy, updatedAt
           'catalog' => ['members' => []],
           'history' => [...],   // audit_logs rows for these records
       ],
   ]);

   The controller must write audit_logs, refuse to delete records in use,
   and soft-delete (deleted_at) removed records.
==================================================================== */

const BASE = "/admin/coeuas"; // keep in sync with coeuasRoutes.js
const ENDPOINTS = {
    save: `${BASE}/taxonomy`, // PUT { content }
};
const RESEARCH_GROUPS_URL = `${BASE}/research/groups`;

const SECTIONS = [
    { key: "years", label: "Years", hint: "Archive years" },
    { key: "categories", label: "Categories", hint: "Topics that sort content" },
    { key: "statuses", label: "Status values", hint: "Labels and colours" },
    { key: "groups", label: "Groups", hint: "Research groups as filters" },
];

const YEAR_MIN = 2013;
const YEAR_MAX = new Date().getFullYear();

/* category_type values (ERD: categories.category_type VARCHAR(40)) */
const CATEGORY_TYPES = [
    { value: "news", label: "News and activities" },
    { value: "research", label: "Research and projects" },
    { value: "publication", label: "Publications" },
    { value: "training", label: "Training" },
    { value: "gallery", label: "Media gallery" },
    { value: "document", label: "Brochures and documents" },
];

const TONES = [
    { value: "neutral", label: "Grey" },
    { value: "success", label: "Green" },
    { value: "warning", label: "Amber" },
    { value: "danger", label: "Red" },
    { value: "info", label: "Purple" },
];

/* status ENUMs from the ERD. "internal" values are never shown to visitors. */
const STATUS_DEFS = [
    { entity: "posts", label: "News and activities", codes: ["draft", "scheduled", "published", "archived"], internal: ["draft", "scheduled"] },
    { entity: "events", label: "Events", codes: ["draft", "published", "cancelled"], internal: ["draft"] },
    { entity: "projects", label: "Research projects", codes: ["proposed", "ongoing", "completed"] },
    { entity: "grants", label: "Research grants", codes: ["ongoing", "completed", "proposed"] },
    { entity: "opportunities", label: "Research opportunities", codes: ["draft", "open", "closed"], internal: ["draft"] },
    { entity: "publications", label: "Publications", codes: ["draft", "published"], internal: ["draft"] },
    { entity: "members", label: "Members", codes: ["active", "former"] },
    { entity: "students", label: "Postgraduate students", codes: ["current", "graduated"] },
    { entity: "postdocs", label: "Postdoctoral researchers", codes: ["current", "former"] },
    { entity: "courses", label: "Training courses", codes: ["draft", "published"], internal: ["draft"] },
    { entity: "sessions", label: "Training sessions", codes: ["open", "full", "closed"] },
    { entity: "enquiries", label: "Enquiries", codes: ["new", "in_progress", "replied", "closed"], internal: ["new", "in_progress", "replied", "closed"] },
];
const DEFAULT_TONE = {
    published: "success", ongoing: "success", open: "success", active: "success", current: "success", replied: "success",
    scheduled: "warning", full: "warning", in_progress: "warning",
    cancelled: "danger",
    proposed: "info", graduated: "info", new: "info",
};

const MIN = 60 * 1000;
const NOW = Date.now();
const minsAgo = (m) => new Date(NOW - m * MIN).toISOString();
let counter = 0;
const uid = () => `n${Date.now().toString(36)}${(counter += 1)}`;

/* ------------------------------ sample data ------------------------------ */

const humanise = (code) => code.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());

const sampleStatuses = STATUS_DEFS.flatMap((def) =>
    def.codes.map((code) => ({
        id: `st-${def.entity}-${code}`,
        entity: def.entity,
        code,
        label: humanise(code),
        tone: DEFAULT_TONE[code] || "neutral",
        internal: (def.internal || []).includes(code),
        showInFilter: !(def.internal || []).includes(code),
    }))
);

const sampleContent = {
    years: Array.from({ length: YEAR_MAX - YEAR_MIN + 1 }, (_, i) => {
        const year = YEAR_MAX - i;
        return { id: `y${year}`, year, visible: true, usage: year < 2016 ? 3 + (year % 4) : 8 + ((year * 7) % 23) };
    }),
    categories: [
        { id: "c1", name: "Centre news", slug: "centre-news", type: "news", usage: 14 },
        { id: "c2", name: "Awards and achievements", slug: "awards-achievements", type: "news", usage: 6 },
        { id: "c3", name: "Autonomy and navigation", slug: "autonomy-navigation", type: "research", usage: 9 },
        { id: "c4", name: "Remote sensing", slug: "remote-sensing", type: "research", usage: 7 },
        { id: "c5", name: "Journal articles", slug: "journal-articles", type: "publication", usage: 42 },
        { id: "c6", name: "Drone pilot courses", slug: "drone-pilot-courses", type: "training", usage: 5 },
        { id: "c7", name: "Field trials", slug: "field-trials", type: "gallery", usage: 11 },
        { id: "c8", name: "Corporate brochures", slug: "corporate-brochures", type: "document", usage: 0 },
    ],
    statuses: sampleStatuses,
    groups: [
        { id: "g1", name: "Autonomous Systems", slug: "autonomous-systems", leaderId: 2, showInFilter: true, usage: 18 },
        { id: "g2", name: "Remote Sensing and Mapping", slug: "remote-sensing-mapping", leaderId: 3, showInFilter: true, usage: 12 },
        { id: "g3", name: "UAS Safety and Regulation", slug: "uas-safety-regulation", leaderId: 1, showInFilter: true, usage: 7 },
        { id: "g4", name: "Aerial Robotics (inactive)", slug: "aerial-robotics", leaderId: null, showInFilter: false, usage: 0 },
    ],
};

const sampleMeta = { updatedBy: "Aisyah Rahman", updatedAt: minsAgo(60 * 30) };

const sampleCatalog = {
    members: [
        { id: 1, name: "Prof. Dr. Ahmad Zaki" },
        { id: 2, name: "Dr. Nurul Huda" },
        { id: 3, name: "Ir. Dr. Faizal Karim" },
        { id: 4, name: "Prof. Dr. Rohana Salleh" },
    ],
};

const sampleHistory = [
    { id: 2, user: "Aisyah Rahman", action: "UPDATE", label: "Categories", at: minsAgo(60 * 30), changes: [{ field: "Categories", from: "Previous version", to: "Updated" }] },
    { id: 1, user: "Hafiz Roslan", action: "CREATE", label: "Years", at: minsAgo(60 * 24 * 9), changes: [] },
];

/* ------------------------------- helpers -------------------------------- */

const clone = (v) => JSON.parse(JSON.stringify(v));
const sameJson = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const labelOf = (list, value) => list.find((o) => o.value === value)?.label || value;
const slugify = (s = "") => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

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

/* move an item up or down among the items that match `same` (keeps filtered lists correct) */
function moveAmong(list, id, dir, same) {
    const group = list.filter(same);
    const at = group.findIndex((x) => x.id === id);
    const other = group[at + dir];
    if (!other) return;
    const a = list.findIndex((x) => x.id === id);
    const b = list.findIndex((x) => x.id === other.id);
    [list[a], list[b]] = [list[b], list[a]];
}

/* ------------------------------ validation ------------------------------- */

function validate(f) {
    const e = {};
    const need = (key, value, msg) => { if (!String(value ?? "").trim()) e[key] = msg; };

    const seenYears = new Map();
    f.years.forEach((y) => {
        const n = Number(y.year);
        if (!Number.isInteger(n) || n < YEAR_MIN || n > YEAR_MAX + 1) e[`years.${y.id}.year`] = `Use a year from ${YEAR_MIN} to ${YEAR_MAX + 1}.`;
        else if (seenYears.has(n)) e[`years.${y.id}.year`] = "This year is already in the list.";
        seenYears.set(n, true);
    });

    const seenCat = new Map();
    f.categories.forEach((c) => {
        need(`categories.${c.id}.name`, c.name, "Give the category a name.");
        if (!c.slug.trim()) e[`categories.${c.id}.slug`] = "The slug cannot be empty.";
        else if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(c.slug)) e[`categories.${c.id}.slug`] = "Use lowercase letters, numbers and hyphens only.";
        else if (seenCat.has(c.slug)) e[`categories.${c.id}.slug`] = "Another category already uses this slug.";
        seenCat.set(c.slug, true);
    });

    f.statuses.forEach((s) => need(`statuses.${s.id}.label`, s.label, "Give the status a label."));

    const seenGroup = new Map();
    f.groups.forEach((g) => {
        need(`groups.${g.id}.name`, g.name, "Give the group a name.");
        if (!g.slug.trim()) e[`groups.${g.id}.slug`] = "The slug cannot be empty.";
        else if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(g.slug)) e[`groups.${g.id}.slug`] = "Use lowercase letters, numbers and hyphens only.";
        else if (seenGroup.has(g.slug)) e[`groups.${g.id}.slug`] = "Another group already uses this slug.";
        seenGroup.set(g.slug, true);
    });
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
        alert: (<><path d="M12 3 2 20h20z" /><path d="M12 10v4M12 17h.01" /></>),
        check: <path d="m5 12 5 5 9-10" />,
        close: <path d="M18 6 6 18M6 6l12 12" />,
        lock: (<><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></>),
        external: (<><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><path d="M15 3h6v6M10 14 21 3" /></>),
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

function Field({ label, errorKey, value, onChange, hint, placeholder, type = "text", readOnly, mono }) {
    const { errors } = useCtx();
    const errId = useId();
    const error = errorKey ? errors[errorKey] : null;
    return (
        <label className={`ax-field ${error ? "has-error" : ""}`}>
            <span className="ax-field-top"><span>{label}</span></span>
            <input
                className={`ax-input ${mono ? "is-mono" : ""} ${readOnly ? "is-readonly" : ""}`}
                type={type}
                value={value ?? ""}
                placeholder={placeholder}
                readOnly={readOnly}
                aria-invalid={error ? "true" : undefined}
                aria-describedby={error ? errId : undefined}
                onChange={(e) => onChange?.(e.target.value)}
            />
            {hint && !error && <em className="ax-hint">{hint}</em>}
            {error && <em className="ax-error" id={errId}><Icon name="alert" size={13} /> {error}</em>}
        </label>
    );
}

function Select({ label, value, options, onChange, empty }) {
    return (
        <label className="ax-field">
            <span className="ax-field-top"><span>{label}</span></span>
            <select className="ax-input" value={value ?? ""} onChange={(e) => onChange(e.target.value)}>
                {empty && <option value="">{empty}</option>}
                {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
        </label>
    );
}

function Toggle({ checked, onChange, label, disabled }) {
    return (
        <label className={`ax-switch ${disabled ? "is-disabled" : ""}`}>
            <input type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
            <i aria-hidden="true" />
            <span>{label}</span>
        </label>
    );
}

function Mover({ onUp, onDown, onDelete, upOff, downOff, deleteLabel }) {
    return (
        <div className="ax-mover">
            {onUp && <button type="button" className="ax-iconbtn" disabled={upOff} onClick={onUp} aria-label="Move up"><Icon name="up" size={16} /></button>}
            {onDown && <button type="button" className="ax-iconbtn" disabled={downOff} onClick={onDown} aria-label="Move down"><Icon name="down" size={16} /></button>}
            {onDelete && <button type="button" className="ax-iconbtn is-danger" onClick={onDelete} aria-label={deleteLabel}><Icon name="trash" size={16} /></button>}
        </div>
    );
}

function SectionHead({ title, text, action }) {
    return (
        <div className="ax-panel-head">
            <div><h2>{title}</h2><p>{text}</p></div>
            {action}
        </div>
    );
}

function Chips({ options, value, onChange, counts, label }) {
    return (
        <div className="ax-chips" role="tablist" aria-label={label}>
            {options.map((t) => (
                <button key={t.value} type="button" role="tab" aria-selected={value === t.value} className={value === t.value ? "is-active" : ""} onClick={() => onChange(t.value)}>
                    {t.label}<b>{counts[t.value] ?? 0}</b>
                </button>
            ))}
        </div>
    );
}

const UsagePill = ({ usage }) => (
    <span className={`ax-pill ${usage > 0 ? "is-info" : "is-off"}`}>{usage > 0 ? `Used by ${plural(usage, "item")}` : "Not used yet"}</span>
);

/* ------------------------------- editors --------------------------------- */

function YearsEditor() {
    const { form, edit, askDelete } = useCtx();
    const [newYear, setNewYear] = useState("");
    const [addError, setAddError] = useState("");
    const years = [...form.years].sort((a, b) => Number(b.year) - Number(a.year));
    const shownCount = form.years.filter((y) => y.visible).length;

    const add = (value) => {
        const n = Number(value);
        if (!Number.isInteger(n) || n < YEAR_MIN || n > YEAR_MAX + 1) { setAddError(`Use a year from ${YEAR_MIN} to ${YEAR_MAX + 1}.`); return; }
        if (form.years.some((y) => Number(y.year) === n)) { setAddError("This year is already in the list."); return; }
        setAddError("");
        setNewYear("");
        edit((d) => { d.years.push({ id: uid(), year: n, visible: true, usage: 0 }); });
    };
    const nextYear = Math.max(...form.years.map((y) => Number(y.year)), YEAR_MAX) + 1;

    return (
        <>
            <SectionHead title="Years" text={`The year filter on the public archive. The archive starts in ${YEAR_MIN}. Hide a year to remove it from the filter without deleting anything.`} />
            <div className="ax-block">
                <div className="ax-block-head">
                    <div><h3>Archive years</h3><small>{form.years.length} years, {shownCount} shown in the filter</small></div>
                    <div className="ax-actions">
                        <button type="button" className="ax-btn-small" disabled={nextYear > YEAR_MAX + 1} onClick={() => add(nextYear)}><Icon name="plus" size={15} /> Add {nextYear}</button>
                    </div>
                </div>
                <div className="ax-addrow">
                    <label className={`ax-field ${addError ? "has-error" : ""}`}>
                        <span className="ax-field-top"><span>Add another year</span></span>
                        <input className="ax-input" type="number" min={YEAR_MIN} max={YEAR_MAX + 1} value={newYear} placeholder={`${YEAR_MIN} to ${YEAR_MAX + 1}`} onChange={(e) => { setNewYear(e.target.value); setAddError(""); }} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(newYear); } }} />
                        {addError && <em className="ax-error"><Icon name="alert" size={13} /> {addError}</em>}
                    </label>
                    <button type="button" className="ax-btn-outline" onClick={() => add(newYear)} disabled={!newYear}><Icon name="plus" size={15} /> Add year</button>
                </div>
                <ul className="ax-years">
                    {years.map((y) => (
                        <li key={y.id} className={`ax-year-card ${y.visible ? "" : "is-hidden"}`}>
                            <div className="ax-year-top">
                                <strong>{y.year}</strong>
                                <button type="button" className="ax-iconbtn is-danger" aria-label={`Delete ${y.year}`} onClick={() => askDelete({ what: String(y.year), usage: y.usage || 0, noun: "year", onConfirm: () => edit((d) => { d.years = d.years.filter((x) => x.id !== y.id); }) })}><Icon name="trash" size={15} /></button>
                            </div>
                            <small>{y.usage > 0 ? plural(y.usage, "item") : "No content yet"}</small>
                            <Toggle checked={y.visible} onChange={(v) => edit((d) => { d.years.find((x) => x.id === y.id).visible = v; })} label={y.visible ? "In filter" : "Hidden"} />
                        </li>
                    ))}
                </ul>
            </div>
        </>
    );
}

function CategoriesEditor() {
    const { form, edit, askDelete } = useCtx();
    const [filter, setFilter] = useState("all");
    const counts = { all: form.categories.length };
    CATEGORY_TYPES.forEach((t) => { counts[t.value] = form.categories.filter((c) => c.type === t.value).length; });
    const shown = form.categories.filter((c) => filter === "all" || c.type === filter);
    const setCat = (id, fn) => edit((d) => { fn(d.categories.find((x) => x.id === id)); });

    return (
        <>
            <SectionHead title="Categories" text="Topics that visitors can filter by. Each category belongs to one kind of content, so news topics never mix with publication types." />
            <div className="ax-block">
                <div className="ax-block-head">
                    <div><h3>All categories</h3><small>{form.categories.length} in total</small></div>
                    <button type="button" className="ax-btn-small" onClick={() => edit((d) => { d.categories.push({ id: uid(), name: "", slug: "", type: filter === "all" ? "news" : filter, usage: 0 }); })}><Icon name="plus" size={15} /> Add category</button>
                </div>
                <Chips label="Filter by content type" value={filter} onChange={setFilter} counts={counts} options={[{ value: "all", label: "All" }, ...CATEGORY_TYPES]} />
                {shown.length === 0 && <p className="ax-empty">No categories for this content type yet.</p>}
                <ol className="ax-list">
                    {shown.map((c) => (
                        <li key={c.id} className="ax-card">
                            <div className="ax-card-top">
                                <strong>{c.name || "New category"}</strong>
                                <span className="ax-pill">{labelOf(CATEGORY_TYPES, c.type)}</span>
                                <UsagePill usage={c.usage || 0} />
                                <Mover deleteLabel={`Delete ${c.name || "category"}`}
                                    onDelete={() => askDelete({ what: c.name || "this category", usage: c.usage || 0, noun: "category", onConfirm: () => edit((d) => { d.categories = d.categories.filter((x) => x.id !== c.id); }) })} />
                            </div>
                            <div className="ax-grid-3">
                                <Field label="Name" errorKey={`categories.${c.id}.name`} value={c.name}
                                    onChange={(v) => setCat(c.id, (x) => { if (!x.slug || x.slug === slugify(x.name)) x.slug = slugify(v); x.name = v; })} />
                                <Field label="Slug" mono errorKey={`categories.${c.id}.slug`} value={c.slug} hint="Used in the page address" onChange={(v) => setCat(c.id, (x) => { x.slug = slugify(v) || v.toLowerCase(); })} />
                                <Select label="Used for" value={c.type} options={CATEGORY_TYPES} onChange={(v) => setCat(c.id, (x) => { x.type = v; })} />
                            </div>
                        </li>
                    ))}
                </ol>
            </div>
        </>
    );
}

function StatusEditor() {
    const { form, edit } = useCtx();
    const [entity, setEntity] = useState(STATUS_DEFS[0].entity);
    const counts = {};
    STATUS_DEFS.forEach((d) => { counts[d.entity] = form.statuses.filter((s) => s.entity === d.entity).length; });
    const shown = form.statuses.filter((s) => s.entity === entity);
    const setStatus = (id, patch) => edit((d) => { Object.assign(d.statuses.find((x) => x.id === id), patch); });
    const same = (s) => s.entity === entity;

    return (
        <>
            <SectionHead title="Status values" text="How each status is worded and coloured on the public site. The status codes are fixed by the database, so they can be renamed for display but not added or removed." />
            <p className="ax-note is-soft"><Icon name="lock" size={16} /><span>The <b>code</b> is what the database stores. Changing a label never changes existing records. Values marked <b>Admin only</b> are internal working states and never appear in a public filter.</span></p>
            <div className="ax-block">
                <div className="ax-block-head"><div><h3>Applies to</h3><small>Choose the kind of content</small></div></div>
                <Chips label="Status values by content type" value={entity} onChange={setEntity} counts={counts} options={STATUS_DEFS.map((d) => ({ value: d.entity, label: d.label }))} />
                <ol className="ax-list">
                    {shown.map((s, i) => (
                        <li key={s.id} className="ax-card">
                            <div className="ax-card-top">
                                <span className="ax-no">{i + 1}</span>
                                <strong>{s.label || humanise(s.code)}</strong>
                                <span className={`ax-pill is-${s.tone}`}>{s.label || humanise(s.code)}</span>
                                {s.internal && <span className="ax-pill is-off">Admin only</span>}
                                <Mover upOff={i === 0} downOff={i === shown.length - 1}
                                    onUp={() => edit((d) => moveAmong(d.statuses, s.id, -1, same))}
                                    onDown={() => edit((d) => moveAmong(d.statuses, s.id, 1, same))} />
                            </div>
                            <div className="ax-grid-3 is-status">
                                <Field label="Code (fixed)" mono readOnly value={s.code} />
                                <Field label="Label shown to visitors" errorKey={`statuses.${s.id}.label`} value={s.label} onChange={(v) => setStatus(s.id, { label: v })} />
                                <Select label="Colour" value={s.tone} options={TONES} onChange={(v) => setStatus(s.id, { tone: v })} />
                            </div>
                            <Toggle checked={s.showInFilter && !s.internal} disabled={s.internal} onChange={(v) => setStatus(s.id, { showInFilter: v })} label={s.internal ? "Not available as a public filter" : "Show as a filter option"} />
                        </li>
                    ))}
                </ol>
            </div>
        </>
    );
}

function GroupsEditor() {
    const { form, edit, askDelete, members } = useCtx();
    const g = form.groups;
    const setGroup = (id, fn) => edit((d) => { fn(d.groups.find((x) => x.id === id)); });

    return (
        <>
            <SectionHead title="Groups" text="Research groups that visitors can filter the archive by. Overview, expertise, cover image and group members are edited in Research and Innovation."
                action={<a className="ax-btn-small" href={RESEARCH_GROUPS_URL}><Icon name="external" size={15} /> Open research groups</a>} />
            <div className="ax-block">
                <div className="ax-block-head">
                    <div><h3>Research groups</h3><small>{g.length} in total, {g.filter((x) => x.showInFilter).length} shown in the filter</small></div>
                    <button type="button" className="ax-btn-small" onClick={() => edit((d) => { d.groups.push({ id: uid(), name: "", slug: "", leaderId: null, showInFilter: true, usage: 0 }); })}><Icon name="plus" size={15} /> Add group</button>
                </div>
                {g.length === 0 && <p className="ax-empty">No groups yet.</p>}
                <ol className="ax-list">
                    {g.map((x, i) => (
                        <li key={x.id} className="ax-card">
                            <div className="ax-card-top">
                                <span className="ax-no">{i + 1}</span>
                                <strong>{x.name || "New group"}</strong>
                                <UsagePill usage={x.usage || 0} />
                                <Mover upOff={i === 0} downOff={i === g.length - 1} deleteLabel={`Delete ${x.name || "group"}`}
                                    onUp={() => edit((d) => moveAmong(d.groups, x.id, -1, () => true))}
                                    onDown={() => edit((d) => moveAmong(d.groups, x.id, 1, () => true))}
                                    onDelete={() => askDelete({ what: x.name || "this group", usage: x.usage || 0, noun: "group", onConfirm: () => edit((d) => { d.groups = d.groups.filter((y) => y.id !== x.id); }) })} />
                            </div>
                            <div className="ax-grid-3">
                                <Field label="Group name" errorKey={`groups.${x.id}.name`} value={x.name}
                                    onChange={(v) => setGroup(x.id, (y) => { if (!y.slug || y.slug === slugify(y.name)) y.slug = slugify(v); y.name = v; })} />
                                <Field label="Slug" mono errorKey={`groups.${x.id}.slug`} value={x.slug} hint="Used in the page address" onChange={(v) => setGroup(x.id, (y) => { y.slug = slugify(v) || v.toLowerCase(); })} />
                                <Select label="Group leader" value={x.leaderId ? String(x.leaderId) : ""} empty="No leader chosen"
                                    options={members.map((m) => ({ value: String(m.id), label: m.name }))}
                                    onChange={(v) => setGroup(x.id, (y) => { y.leaderId = v ? Number(v) : null; })} />
                            </div>
                            <Toggle checked={x.showInFilter} onChange={(v) => setGroup(x.id, (y) => { y.showInFilter = v; })} label={x.showInFilter ? "Shown as an archive filter" : "Not shown as a filter"} />
                        </li>
                    ))}
                </ol>
            </div>
        </>
    );
}

/* ----------------------------- other panels ------------------------------ */

function FilterPreview() {
    const { form } = useCtx();
    const years = form.years.filter((y) => y.visible).sort((a, b) => Number(b.year) - Number(a.year));
    const statuses = [];
    const seen = new Set();
    form.statuses.filter((s) => s.showInFilter && !s.internal).forEach((s) => {
        const key = s.label.trim().toLowerCase();
        if (key && !seen.has(key)) { seen.add(key); statuses.push(s); }
    });
    const groups = form.groups.filter((g) => g.showInFilter && g.name.trim());
    const cats = form.categories.filter((c) => c.name.trim());

    return (
        <div className="ax-panel ax-narrow">
            <SectionHead title="Filter preview" text="How the archive filters on the public COE-UAS site will read with your current edits. Year, member, group, category and status." />
            <div className="ax-pv">
                <div className="ax-pv-group">
                    <h3>Year</h3>
                    <div className="ax-pv-chips">{years.length ? years.map((y) => <span key={y.id}>{y.year}</span>) : <em>No years shown</em>}</div>
                </div>
                <div className="ax-pv-group">
                    <h3>Member</h3>
                    <div className="ax-pv-chips"><span className="is-box">Choose a member</span><em>Filled from the member directory</em></div>
                </div>
                <div className="ax-pv-group">
                    <h3>Group</h3>
                    <div className="ax-pv-chips">{groups.length ? groups.map((g) => <span key={g.id}>{g.name}</span>) : <em>No groups shown</em>}</div>
                </div>
                <div className="ax-pv-group">
                    <h3>Category</h3>
                    {CATEGORY_TYPES.map((t) => {
                        const list = cats.filter((c) => c.type === t.value);
                        if (!list.length) return null;
                        return (
                            <div key={t.value} className="ax-pv-sub">
                                <small>{t.label}</small>
                                <div className="ax-pv-chips">{list.map((c) => <span key={c.id}>{c.name}</span>)}</div>
                            </div>
                        );
                    })}
                    {cats.length === 0 && <div className="ax-pv-chips"><em>No categories yet</em></div>}
                </div>
                <div className="ax-pv-group">
                    <h3>Status</h3>
                    <div className="ax-pv-chips">{statuses.length ? statuses.map((s) => <span key={s.id} className={`ax-pill is-${s.tone}`}>{s.label}</span>) : <em>No status filters shown</em>}</div>
                </div>
            </div>
        </div>
    );
}

const ACTION_TONE = { CREATE: "is-new", UPDATE: "is-info", PUBLISH: "is-ok", UNPUBLISH: "is-warn", DELETE: "is-danger", RESTORE: "is-ok" };

function HistoryPanel({ history }) {
    return (
        <div className="ax-panel ax-narrow">
            <SectionHead title="History" text="Every change to the archive taxonomy, from the audit log." />
            {history.length === 0 && <p className="ax-empty">Nothing recorded yet.</p>}
            <ol className="ax-history">
                {history.map((h) => (
                    <li key={h.id}>
                        <span className={`ax-pill ${ACTION_TONE[h.action] || "is-info"}`}>{h.action}</span>
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

/* -------------------------------- the page -------------------------------- */

export default function AdminCOEUASArchiveTaxonomy() {
    const { props } = usePage();
    const live = Boolean(props.archive?.content);
    const dialogTitleId = useId();

    const seed = useRef(
        live
            ? { content: props.archive.content, meta: props.archive.meta, catalog: props.archive.catalog, history: props.archive.history || [] }
            : { content: sampleContent, meta: sampleMeta, catalog: sampleCatalog, history: sampleHistory }
    ).current;

    const [saved, setSaved] = useState(() => clone(seed.content));
    const [form, setForm] = useState(() => clone(seed.content));
    const [meta, setMeta] = useState(seed.meta);
    const [localHistory, setLocalHistory] = useState(seed.history);

    const history = live ? props.archive.history || [] : localHistory;
    const members = (live ? props.archive.catalog?.members : seed.catalog?.members) || [];

    const [tab, setTab] = useState("content");
    const [active, setActive] = useState(0);
    const [submitted, setSubmitted] = useState(false);
    const [busy, setBusy] = useState(false);
    const [dialog, setDialog] = useState(null);
    const [toast, setToast] = useState(null);
    const busyRef = useRef(false);

    useEffect(() => { if (live) setMeta(props.archive.meta); }, [live, props.archive?.meta]);

    const dirty = useMemo(() => !sameJson(form, saved), [form, saved]);
    const allErrors = useMemo(() => validate(form), [form]);
    const errors = useMemo(() => ({ ...(props.errors || {}), ...(submitted ? allErrors : {}) }), [props.errors, submitted, allErrors]);
    const errorCountFor = (key) => Object.keys(errors).filter((k) => sectionOfKey(k) === key).length;
    const totalErrors = Object.keys(allErrors).length;

    const changedKeys = useMemo(() => SECTIONS.map((s) => s.key).filter((k) => !sameJson(form[k], saved[k])), [form, saved]);
    const changedLabels = changedKeys.map((k) => SECTIONS.find((s) => s.key === k).label);

    useEffect(() => {
        if (!toast) return undefined;
        const t = setTimeout(() => setToast(null), 5000);
        return () => clearTimeout(t);
    }, [toast]);

    useEffect(() => {
        const beforeUnload = (e) => { if (dirty) { e.preventDefault(); e.returnValue = ""; } };
        window.addEventListener("beforeunload", beforeUnload);
        const off = router.on("before", (event) => {
            const target = event?.detail?.visit?.url?.pathname || "";
            if (target.startsWith(`${BASE}/taxonomy`)) return undefined;
            if (dirty && !busyRef.current && !window.confirm("You have unsaved changes. Leave this page and discard them?")) return false;
            return undefined;
        });
        return () => { window.removeEventListener("beforeunload", beforeUnload); if (typeof off === "function") off(); };
    }, [dirty]);

    const edit = (fn) => setForm((f) => { const copy = clone(f); fn(copy); return copy; });
    const askDelete = (info) => setDialog(info);
    const finishBusy = () => { setBusy(false); busyRef.current = false; };

    const addHistory = (action, label, changes = []) =>
        setLocalHistory((h) => [{ id: Date.now(), user: "You", action, label, at: new Date().toISOString(), changes }, ...h]);

    const jumpToFirstError = () => {
        const first = Object.keys(allErrors)[0];
        if (!first) return;
        setTab("content");
        setActive(Math.max(0, SECTIONS.findIndex((s) => s.key === sectionOfKey(first))));
        setTimeout(() => document.querySelector(".ax-field.has-error")?.scrollIntoView({ behavior: "smooth", block: "center" }), 120);
    };

    const saveChanges = () => {
        if (!dirty || busy) return;
        setSubmitted(true);
        if (totalErrors) { setToast({ tone: "error", text: `Fix ${plural(totalErrors, "field")} before saving.` }); jumpToFirstError(); return; }
        setBusy(true); busyRef.current = true;
        const done = () => {
            setSaved(clone(form));
            setMeta((m) => ({ ...m, updatedBy: "You", updatedAt: new Date().toISOString() }));
            if (!live) addHistory("UPDATE", changedLabels.join(", ") || "Archive taxonomy", changedLabels.map((l) => ({ field: l, from: "Previous version", to: "Updated" })));
            setSubmitted(false);
            setToast({ tone: "ok", text: "Saved. The archive filters on the public site now use these values." });
            finishBusy();
        };
        if (live) router.put(ENDPOINTS.save, { content: form }, { preserveScroll: true, onSuccess: done, onError: () => { finishBusy(); setToast({ tone: "error", text: "The server rejected some values. Check the highlighted fields." }); } });
        else setTimeout(done, 350);
    };

    const confirmDelete = () => {
        dialog.onConfirm();
        setToast({ tone: "ok", text: `“${dialog.what}” will move to Trash when you save.` });
        setDialog(null);
    };

    useEffect(() => {
        const onKey = (e) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") { e.preventDefault(); saveChanges(); } };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    });

    const ctx = { form, edit, errors, askDelete, members };
    const Editor = [YearsEditor, CategoriesEditor, StatusEditor, GroupsEditor][active];
    const countOf = (key) => form[key].length;

    return (
        <Ctx.Provider value={ctx}>
            <div className="coeuas-archive">
                <div className="ax-heading">
                    <div>
                        <h1>Archive Taxonomy</h1>
                        <p>Manage the years, categories, status values and groups that organise the COE-UAS archive and its public filters.</p>
                        <div className="ax-status">
                            {dirty ? <span className="ax-pill is-warn">Unsaved changes</span> : <span className="ax-pill is-ok">All changes saved</span>}
                            {meta?.updatedAt && <small>Last edited {timeAgo(meta.updatedAt)} by {meta.updatedBy}</small>}
                        </div>
                    </div>
                    <div className="ax-actions">
                        <button type="button" className="ax-btn-outline" onClick={() => setTab("preview")}><Icon name="eye" size={16} /> Filter preview</button>
                        <button type="button" className="ax-btn-dark" onClick={saveChanges} disabled={!dirty || busy}>
                            <span className="ax-btn-icon"><Icon name="save" size={16} /></span> {busy ? "Saving..." : "Save changes"}
                        </button>
                    </div>
                </div>

                {!live && (
                    <p className="ax-note"><Icon name="alert" size={16} /><span>Sample data. Every control works, but nothing is stored until your controller sends the <b>archive</b> prop.</span></p>
                )}

                <div className="ax-tabs" role="tablist" aria-label="Archive taxonomy editor">
                    {[["content", "Taxonomy"], ["preview", "Filter preview"], ["history", "History"]].map(([key, label]) => (
                        <button key={key} type="button" role="tab" aria-selected={tab === key} className={tab === key ? "is-active" : ""} onClick={() => setTab(key)}>
                            {label}
                            {key === "history" && <span className="ax-badge">{history.length}</span>}
                        </button>
                    ))}
                </div>

                {tab === "content" && (
                    <div className="ax-layout">
                        <nav className="ax-rail" aria-label="Taxonomy sections">
                            <ol>
                                {SECTIONS.map((s, i) => {
                                    const errs = errorCountFor(s.key);
                                    return (
                                        <li key={s.key}>
                                            <button type="button" className={`ax-rail-item ${active === i ? "is-active" : ""}`} aria-current={active === i ? "true" : undefined} onClick={() => setActive(i)}>
                                                <span className="ax-rail-no">{i + 1}</span>
                                                <span className="ax-rail-text">
                                                    <strong>{s.label}</strong>
                                                    <small>{s.hint} · {countOf(s.key)}</small>
                                                </span>
                                                {errs > 0 ? <span className="ax-badge-error" title={`${errs} to fix`}>{errs}</span> : changedKeys.includes(s.key) ? <span className="ax-dot" title="Edited" /> : null}
                                            </button>
                                        </li>
                                    );
                                })}
                            </ol>
                        </nav>
                        <div className="ax-panel" key={active}><Editor /></div>
                    </div>
                )}
                {tab === "preview" && <FilterPreview />}
                {tab === "history" && <HistoryPanel history={history} />}

                {dirty && (
                    <div className="ax-savebar" role="region" aria-label="Unsaved changes">
                        <span className="ax-savebar-text"><i /> {plural(changedLabels.length, "section")} edited, not saved</span>
                        <div>
                            <button type="button" className="ax-btn-ghost" onClick={() => { setForm(clone(saved)); setSubmitted(false); setToast({ tone: "info", text: "Changes discarded." }); }} disabled={busy}>Discard</button>
                            <button type="button" className="ax-btn-accent" onClick={saveChanges} disabled={busy}>{busy ? "Saving..." : "Save changes"}</button>
                        </div>
                    </div>
                )}

                {dialog && (
                    <div className="ax-overlay" onMouseDown={(e) => e.target === e.currentTarget && setDialog(null)}>
                        <div className="ax-dialog ax-small" role="alertdialog" aria-modal="true" aria-labelledby={dialogTitleId}>
                            <span className="ax-dialog-icon is-danger"><Icon name={dialog.usage > 0 ? "lock" : "trash"} size={22} /></span>
                            {dialog.usage > 0 ? (
                                <>
                                    <h2 id={dialogTitleId}>“{dialog.what}” is still in use</h2>
                                    <p>This {dialog.noun} is used by {plural(dialog.usage, "item")}. Move those items to another {dialog.noun} first, then delete it. For a year, you can hide it from the filter instead.</p>
                                    <div className="ax-dialog-actions">
                                        <button type="button" className="ax-btn-dark" onClick={() => setDialog(null)} autoFocus>Understood</button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <h2 id={dialogTitleId}>Delete “{dialog.what}”?</h2>
                                    <p>Nothing uses this {dialog.noun}. It moves to Deleted content, where only the Super Admin can restore or purge it, and it leaves the archive filters when you save.</p>
                                    <div className="ax-dialog-actions">
                                        <button type="button" className="ax-btn-outline" onClick={() => setDialog(null)} autoFocus>Keep it</button>
                                        <button type="button" className="ax-btn-danger" onClick={confirmDelete}><Icon name="trash" size={15} /> Move to Trash</button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}

                {toast && (
                    <div className={`ax-toast is-${toast.tone}`} role="status">
                        <Icon name={toast.tone === "error" ? "alert" : "check"} size={16} />
                        <span>{toast.text}</span>
                        <button type="button" aria-label="Dismiss" onClick={() => setToast(null)}><Icon name="close" size={14} /></button>
                    </div>
                )}
            </div>
        </Ctx.Provider>
    );
}

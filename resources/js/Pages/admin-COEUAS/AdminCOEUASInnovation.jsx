import { createContext, useContext, useEffect, useId, useMemo, useRef, useState } from "react";
import { router, usePage } from "@inertiajs/react";
import "../../../css/admin-COEUAS-css/admin-innovation.css";

/* ====================================================================
   COE-UAS ADMIN → RESEARCH AND INNOVATION          /admin/coeuas/research/*

   Site map 1.3 (COE-UAS workspace → "Research and Innovation"), one editor, six views:
     groups         Research areas and groups   → research_groups + research_group_members      (/research/groups)
     projects       Research projects           → research_projects + project_members          (/research/projects)
     grants         Research grants             → research_grants + grant_members              (/research/grants)
     innovations    Innovation and IP           → innovations + innovation_members             (/research/innovation)
     opportunities  Research opportunities      → research_opportunities                       (/research/opportunities)
     programmes     Featured programmes         → research_projects.is_featured_programme      (/research/featured-programmes)
   Use case 2.3: "Manage Research Groups / Projects / Grants / Innovation and IP / Research Opportunities / Featured Programmes".
   Common screens: list with search / filter, create / edit, preview, publish / unpublish,
   delete to Trash, History tab (audit_logs), link pickers (members, groups, projects).

   ADDITION TO THE ERD: research_groups, research_projects, research_grants and innovations have no
   draft / published column. This page uses `isPublished` (BOOLEAN) on those four. Research opportunities
   already have `status` (draft, open, closed): "open" is the published state.
   Grant `commercialisationNotes` and an amount with `isAmountPublic = false` are never shown in the preview.

   SAMPLE DATA: works today (changes stay on screen only). Return an Inertia prop named `research` for LIVE mode:

   Inertia::render('admin-COEUAS/AdminCOEUASInnovation', [
       'section' => 'groups',   // groups | projects | grants | innovation | opportunities | featured-programmes (your route passes this)
       'research' => [
           'data'    => ['groups' => [], 'projects' => [], 'grants' => [], 'innovations' => [], 'opportunities' => []], // same shape as `sampleData`
           'catalog' => ['members' => [['id' => 1, 'name' => '...']], 'media' => [...]],
           'history' => [...],   // audit_logs rows
           'previewUrl' => 'https://...',
       ],
   ]);

   Send the same prop for every sidebar route. Save sends only the collections that changed:
   PUT /admin/coeuas/research  { groups?, projects?, grants?, innovations?, opportunities? }
   Array order = sort_order. The controller must write audit_logs and soft-delete (deleted_at) removed records.
==================================================================== */

const BASE = "/admin/coeuas"; // keep in sync with coeuasRoutes.js
const ENDPOINTS = { save: `${BASE}/research`, upload: `${BASE}/media/upload` };

const VIEWS = [
    { key: "groups", route: "groups", title: "Research areas and groups", text: "The research groups visitors see, with their leader and members." },
    { key: "projects", route: "projects", title: "Research projects", text: "Projects under each group, from proposal to completion." },
    { key: "grants", route: "grants", title: "Research grants", text: "Funding linked to projects and to the members who hold it." },
    { key: "innovations", route: "innovation", title: "Innovation and IP", text: "Patents, prototypes and other innovations with the members behind them." },
    { key: "opportunities", route: "opportunities", title: "Research opportunities", text: "Topics, industry challenges and postgraduate or postdoctoral openings." },
    { key: "programmes", route: "featured-programmes", title: "Featured programmes", text: "Pick the projects highlighted on the Research and Innovation page." },
];

const PROJECT_TYPES = [{ value: "internal", label: "Internal" }, { value: "joint", label: "Joint" }, { value: "industry", label: "Industry" }];
const PROJECT_STATUS = [{ value: "proposed", label: "Proposed" }, { value: "ongoing", label: "Ongoing" }, { value: "completed", label: "Completed" }];
const GRANT_STATUS = [{ value: "ongoing", label: "Ongoing" }, { value: "completed", label: "Completed" }, { value: "proposed", label: "Proposed" }];
const INNOVATION_TYPES = [
    { value: "technology", label: "Technology" }, { value: "prototype", label: "Prototype" }, { value: "patent", label: "Patent" },
    { value: "industrial_design", label: "Industrial design" }, { value: "copyright", label: "Copyright" }, { value: "other", label: "Other" },
];
const OPP_TYPES = [
    { value: "proposed_topic", label: "Proposed topic" }, { value: "industry_challenge", label: "Industry challenge" },
    { value: "postgraduate", label: "Postgraduate" }, { value: "postdoctoral", label: "Postdoctoral" },
];
const OPP_STATUS = [{ value: "draft", label: "Draft" }, { value: "open", label: "Open" }, { value: "closed", label: "Closed" }];

const LIMITS = { featured: 4, page: 10 };
const YEAR_MIN = 1980;
const YEAR_MAX = new Date().getFullYear() + 1;
const MIN = 60 * 1000;
const NOW = Date.now();
const minsAgo = (m) => new Date(NOW - m * MIN).toISOString();
let counter = 0;
const uid = () => `n${Date.now().toString(36)}${(counter += 1)}`;

/* ------------------------------ module config ------------------------------ */
/* One config per table. The generic list and editor below read it, so adding a field is one line. */

const MODULES = {
    groups: {
        key: "groups", prefix: "g", noun: "research group", add: "Add group", nameKey: "name", slug: true, path: "research/groups",
        statusField: null,
        blank: () => ({ id: uid(), name: "", slug: "", leaderId: null, coverId: null, overview: "", expertise: "", isPublished: false, members: [] }),
        fields: [
            { k: "name", t: "text", label: "Group name", req: "Write the group name." },
            { k: "slug", t: "slug", label: "Web address (slug)", req: "Add a web address." },
            { k: "leaderId", t: "ref", src: "members", label: "Group leader", empty: "No leader yet" },
            { k: "overview", t: "area", rows: 5, full: true, label: "Overview", pubReq: "Add an overview before publishing." },
            { k: "expertise", t: "area", rows: 2, full: true, label: "Expertise", hint: "Separate items with commas" },
            { k: "coverId", t: "media", full: true, label: "Cover image" },
        ],
        link: { key: "members", src: "members", title: "Members", role: "Role in the group", empty: "No members yet." },
        sub: (r, x) => (r.leaderId ? `Led by ${x.nameOf("members", r.leaderId)}` : "No leader yet"),
    },
    projects: {
        key: "projects", prefix: "j", noun: "project", add: "Add project", nameKey: "title", slug: true, path: "research/projects",
        statusField: { options: PROJECT_STATUS },
        blank: () => ({ id: uid(), title: "", slug: "", groupId: null, type: "internal", status: "proposed", summary: "", collaboratingOrgs: "", startDate: "", endDate: "", outputs: "", isFeatured: false, isPublished: false, members: [] }),
        dates: ["startDate", "endDate"],
        fields: [
            { k: "title", t: "text", label: "Project title", req: "Write the project title." },
            { k: "slug", t: "slug", label: "Web address (slug)", req: "Add a web address." },
            { k: "groupId", t: "ref", src: "groups", label: "Research group", empty: "No group" },
            { k: "type", t: "select", label: "Type", options: PROJECT_TYPES },
            { k: "status", t: "select", label: "Status", options: PROJECT_STATUS },
            { k: "startDate", t: "date", label: "Starts" },
            { k: "endDate", t: "date", label: "Ends", hint: "Leave empty if ongoing" },
            { k: "summary", t: "area", rows: 4, full: true, label: "Summary", pubReq: "Add a summary before publishing." },
            { k: "collaboratingOrgs", t: "area", rows: 2, full: true, label: "Collaborating organisations", hint: "Separate with commas" },
            { k: "outputs", t: "area", rows: 3, full: true, label: "Outputs", hint: "Papers, prototypes, reports" },
            { k: "isFeatured", t: "switch", full: true, label: "Featured programme on Research and Innovation" },
        ],
        link: { key: "members", src: "members", title: "Team", role: "Role in the project", empty: "No team members yet." },
        sub: (r, x) => [x.nameOf("groups", r.groupId) || "No group", labelOf(PROJECT_TYPES, r.type)].join(" · "),
    },
    grants: {
        key: "grants", prefix: "t", noun: "grant", add: "Add grant", nameKey: "title", path: "research/grants",
        statusField: { options: GRANT_STATUS },
        blank: () => ({ id: uid(), title: "", projectId: null, leaderId: null, funder: "", grantCode: "", amount: "", isAmountPublic: false, startDate: "", endDate: "", status: "proposed", isPublished: false, members: [] }),
        dates: ["startDate", "endDate"],
        fields: [
            { k: "title", t: "text", label: "Grant title", full: true, req: "Write the grant title." },
            { k: "funder", t: "text", label: "Funder", pubReq: "Add the funder before publishing." },
            { k: "grantCode", t: "text", label: "Grant code" },
            { k: "projectId", t: "ref", src: "projects", label: "Linked project", empty: "No project" },
            { k: "leaderId", t: "ref", src: "members", label: "Grant leader", empty: "No leader yet" },
            { k: "amount", t: "money", label: "Amount (RM)" },
            { k: "status", t: "select", label: "Status", options: GRANT_STATUS },
            { k: "startDate", t: "date", label: "Starts" },
            { k: "endDate", t: "date", label: "Ends", hint: "Leave empty if ongoing" },
            { k: "isAmountPublic", t: "switch", full: true, label: "Show the amount on the website" },
        ],
        link: { key: "members", src: "members", title: "Grant team", role: "Role in the grant", empty: "No team members yet." },
        sub: (r, x) => [r.funder || "No funder", r.amount !== "" && r.isAmountPublic ? money(r.amount) : null].filter(Boolean).join(" · "),
    },
    innovations: {
        key: "innovations", prefix: "i", noun: "innovation", add: "Add innovation", nameKey: "title", path: "research/innovation",
        statusField: { options: INNOVATION_TYPES, field: "type" },
        blank: () => ({ id: uid(), title: "", type: "prototype", registrationNo: "", year: new Date().getFullYear(), statusText: "", coverId: null, description: "", commercialisationNotes: "", isPublished: false, members: [] }),
        fields: [
            { k: "title", t: "text", label: "Title", full: true, req: "Write the innovation title." },
            { k: "type", t: "select", label: "Type", options: INNOVATION_TYPES },
            { k: "registrationNo", t: "text", label: "Registration number", hint: "Patent or design number, if any" },
            { k: "year", t: "year", label: "Year" },
            { k: "statusText", t: "text", label: "Status", hint: "For example Filed, Granted, In testing" },
            { k: "description", t: "area", rows: 5, full: true, label: "Description", pubReq: "Add a description before publishing." },
            { k: "commercialisationNotes", t: "area", rows: 3, full: true, label: "Commercialisation notes", hint: "Internal only. Never shown on the website." },
            { k: "coverId", t: "media", full: true, label: "Cover image" },
        ],
        link: { key: "members", src: "members", title: "Inventors and contributors", role: "Contribution", empty: "No contributors yet." },
        sub: (r) => [labelOf(INNOVATION_TYPES, r.type), r.year].filter(Boolean).join(" · "),
    },
    opportunities: {
        key: "opportunities", prefix: "o", noun: "opportunity", add: "Add opportunity", nameKey: "title", path: "research/opportunities", live: (r) => r.status === "open",
        statusField: { options: OPP_STATUS },
        blank: () => ({ id: uid(), title: "", type: "proposed_topic", groupId: null, supervisorId: null, description: "", openDate: "", closeDate: "", status: "draft" }),
        dates: ["openDate", "closeDate"],
        fields: [
            { k: "title", t: "text", label: "Title", full: true, req: "Write the opportunity title." },
            { k: "type", t: "select", label: "Type", options: OPP_TYPES },
            { k: "status", t: "select", label: "Status", options: OPP_STATUS, hint: "Open shows it on the website" },
            { k: "groupId", t: "ref", src: "groups", label: "Research group", empty: "No group" },
            { k: "supervisorId", t: "ref", src: "members", label: "Supervisor", empty: "No supervisor yet" },
            { k: "openDate", t: "date", label: "Opens" },
            { k: "closeDate", t: "date", label: "Closes", pubReq: "Add a closing date before opening." },
            { k: "description", t: "area", rows: 5, full: true, label: "Description", pubReq: "Add a description before opening." },
        ],
        sub: (r, x) => [labelOf(OPP_TYPES, r.type), x.nameOf("groups", r.groupId) || null].filter(Boolean).join(" · "),
    },
};
const MOD_LIST = Object.values(MODULES);
const KEYS = MOD_LIST.map((m) => m.key);
const KEY_LABEL = { groups: "Research groups", projects: "Research projects", grants: "Research grants", innovations: "Innovation and IP", opportunities: "Research opportunities" };
const VIEW_OF_PREFIX = { g: "groups", j: "projects", t: "grants", i: "innovations", o: "opportunities", featured: "programmes" };
const isLive = (mod, r) => (mod.live ? mod.live(r) : Boolean(r.isPublished));

/* ------------------------------ sample data ------------------------------ */

const sampleData = {
    groups: [
        { id: 1, name: "Autonomous Systems", slug: "autonomous-systems", leaderId: 1, coverId: null, overview: "Flight control, detect and avoid, and safe integration of unmanned aircraft into shared airspace.", expertise: "Flight control, detect and avoid, airspace integration", isPublished: true, members: [{ id: 1, role: "Leader" }, { id: 2, role: "Member" }] },
        { id: 2, name: "Sensing and Perception", slug: "sensing-and-perception", leaderId: 2, coverId: null, overview: "Cameras and sensors that let small aircraft map and understand their surroundings.", expertise: "Computer vision, sensor fusion, mapping", isPublished: true, members: [{ id: 2, role: "Leader" }] },
        { id: 3, name: "Airframes and Materials", slug: "airframes-and-materials", leaderId: 3, coverId: null, overview: "", expertise: "Structures, composites", isPublished: false, members: [{ id: 3, role: "Leader" }] },
    ],
    projects: [
        { id: 1, title: "Detect-and-avoid trials", slug: "detect-and-avoid-trials", groupId: 1, type: "joint", status: "ongoing", summary: "Flight trials of onboard detect-and-avoid for low-altitude operations.", collaboratingOrgs: "Civil Aviation Authority of Malaysia, Regional aerospace consortium", startDate: "2024-01-15", endDate: "", outputs: "Two journal papers, one trial report", isFeatured: true, isPublished: true, members: [{ id: 1, role: "Principal investigator" }, { id: 2, role: "Co-investigator" }] },
        { id: 2, title: "Low-cost mapping payload", slug: "low-cost-mapping-payload", groupId: 2, type: "internal", status: "ongoing", summary: "A compact camera and processing payload for survey drones.", collaboratingOrgs: "", startDate: "2023-06-01", endDate: "", outputs: "", isFeatured: false, isPublished: true, members: [{ id: 2, role: "Leader" }] },
        { id: 3, title: "Corridor management study", slug: "corridor-management-study", groupId: 1, type: "industry", status: "proposed", summary: "", collaboratingOrgs: "", startDate: "", endDate: "", outputs: "", isFeatured: false, isPublished: false, members: [] },
    ],
    grants: [
        { id: 1, title: "National UAS Research Grant", projectId: 1, leaderId: 1, funder: "Ministry of Higher Education", grantCode: "NUAS/2024/01", amount: 450000, isAmountPublic: false, startDate: "2024-01-01", endDate: "2026-12-31", status: "ongoing", isPublished: true, members: [{ id: 1, role: "Leader" }, { id: 2, role: "Member" }] },
        { id: 2, title: "Industry Collaboration Fund", projectId: 2, leaderId: 2, funder: "Industry partner", grantCode: "ICF-07", amount: 120000, isAmountPublic: true, startDate: "2023-06-01", endDate: "2024-12-31", status: "completed", isPublished: true, members: [{ id: 2, role: "Leader" }] },
    ],
    innovations: [
        { id: 1, title: "Foldable survey drone", type: "patent", registrationNo: "PI 2024-001234", year: 2024, statusText: "Filed", coverId: null, description: "A survey drone that folds flat for transport and unfolds in under ten seconds.", commercialisationNotes: "Licensing talks with a local manufacturer.", isPublished: true, members: [{ id: 1, role: "Inventor" }] },
        { id: 2, title: "Landing pad marker system", type: "prototype", registrationNo: "", year: 2023, statusText: "In testing", coverId: null, description: "", commercialisationNotes: "", isPublished: false, members: [{ id: 2, role: "Lead developer" }] },
    ],
    opportunities: [
        { id: 1, title: "PhD: swarm coordination for survey drones", type: "postgraduate", groupId: 1, supervisorId: 1, description: "Fully funded PhD place working on coordinated survey flights.", openDate: "2026-10-01", closeDate: "2026-12-15", status: "open" },
        { id: 2, title: "Industry challenge: battery health prediction", type: "industry_challenge", groupId: 3, supervisorId: 3, description: "", openDate: "", closeDate: "", status: "draft" },
    ],
};

const sampleCatalog = {
    members: [{ id: 1, name: "Prof. Dr. Ahmad Zaki" }, { id: 2, name: "Dr. Nurul Huda" }, { id: 3, name: "Ir. Dr. Faizal Karim" }],
    media: [
        { id: 1, name: "drone-trial.jpg", type: "image", alt: "Trial flight", size: "1.1 MB", url: null },
        { id: 2, name: "lab-bench.jpg", type: "image", alt: "Lab bench", size: "0.8 MB", url: null },
    ],
};

const sampleHistory = [
    { id: 3, user: "Aisyah Rahman", action: "UPDATE", label: "Research projects", at: minsAgo(60 * 4), changes: [{ field: "Research projects", from: "Previous version", to: "Updated" }] },
    { id: 2, user: "Hafiz Roslan", action: "CREATE", label: "Research grants", at: minsAgo(60 * 24 * 2), changes: [] },
    { id: 1, user: "Hafiz Roslan", action: "CREATE", label: "Research groups", at: minsAgo(60 * 24 * 8), changes: [] },
];

/* ------------------------------- helpers -------------------------------- */

const clone = (v) => JSON.parse(JSON.stringify(v));
const sameJson = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const toYear = (v) => (v === "" || v === null || v === undefined ? "" : Number(v));
const slugify = (s = "") => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const initialsOf = (name = "") => name.split(" ").filter((w) => /^[A-Za-z]/.test(w) && !/\.$/.test(w)).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "?";
const splitList = (t) => String(t || "").split(/[\n,;]+/).map((s) => s.trim()).filter(Boolean);
const labelOf = (list, value) => list.find((o) => o.value === value)?.label || value;
const idEq = (a, b) => a !== null && a !== undefined && b !== null && b !== undefined && String(a) === String(b);
const idOrNull = (v) => (v ? Number(v) || v : null);
const money = (v) => `RM ${Number(v).toLocaleString("en-MY")}`;
const move = (list, from, to) => { if (to < 0 || to >= list.length) return; const [item] = list.splice(from, 1); list.splice(to, 0, item); };

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

function formatDate(iso) {
    if (!iso) return "";
    const d = new Date(`${iso}T00:00:00`);
    return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

/* ------------------------------ validation ------------------------------- */
/* Drafts only need a title. Published records must be complete. */

function validate(d) {
    const e = {};
    MOD_LIST.forEach((mod) => {
        const slugs = new Set();
        d[mod.key].forEach((r) => {
            const k = (f) => `${mod.prefix}.${r.id}.${f}`;
            const empty = (f) => !String(r[f] ?? "").trim();
            mod.fields.forEach((f) => {
                if (f.req && empty(f.k)) e[k(f.k)] = f.req;
                else if (f.pubReq && isLive(mod, r) && empty(f.k)) e[k(f.k)] = f.pubReq;
            });
            if (mod.slug && r.slug) { if (slugs.has(r.slug)) e[k("slug")] = "This web address is already used."; slugs.add(r.slug); }
            if (mod.dates) { const [a, b] = mod.dates; if (r[a] && r[b] && r[b] < r[a]) e[k(b)] = "The end date is before the start date."; }
            if (mod.key === "grants" && r.amount !== "" && Number(r.amount) < 0) e[k("amount")] = "The amount cannot be negative.";
            if (mod.key === "innovations" && r.year !== "" && (r.year < YEAR_MIN || r.year > YEAR_MAX)) e[k("year")] = `Use a year from ${YEAR_MIN} to ${YEAR_MAX}.`;
            if (mod.key === "projects" && r.isFeatured && !r.isPublished) e[k("isFeatured")] = "Only published projects can be featured.";
        });
    });
    if (d.projects.filter((p) => p.isFeatured).length > LIMITS.featured) e.featured = `At most ${LIMITS.featured} programmes can be featured.`;
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
        star: <path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z" />,
        search: (<><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>),
    }[name];
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{p}</svg>
    );
}

/* ------------------------------ small parts ------------------------------ */

const Ctx = createContext(null);
const useCtx = () => useContext(Ctx);

function Field({ label, errorKey, value, onChange, textarea, hint, type = "text", rows = 3, min, maxValue, className = "" }) {
    const { errors } = useCtx();
    const errId = useId();
    const error = errorKey ? errors[errorKey] : null;
    const Tag = textarea ? "textarea" : "input";
    return (
        <label className={`ci-field ${className} ${error ? "has-error" : ""}`}>
            <span className="ci-field-top"><span>{label}</span></span>
            <Tag
                className="ci-input"
                type={textarea ? undefined : type}
                rows={textarea ? rows : undefined}
                min={type === "number" ? min : undefined}
                max={type === "number" ? maxValue : undefined}
                value={value ?? ""}
                aria-invalid={error ? "true" : undefined}
                aria-describedby={error ? errId : undefined}
                onChange={(e) => onChange(e.target.value)}
            />
            {hint && !error && <em className="ci-hint">{hint}</em>}
            {error && <em className="ci-error" id={errId}><Icon name="alert" size={13} /> {error}</em>}
        </label>
    );
}

function Select({ label, value, options, onChange, errorKey, empty, hint, className = "" }) {
    const { errors } = useCtx();
    const error = errorKey ? errors[errorKey] : null;
    return (
        <label className={`ci-field ${className} ${error ? "has-error" : ""}`}>
            <span className="ci-field-top"><span>{label}</span></span>
            <select className="ci-input" value={value ?? ""} onChange={(e) => onChange(e.target.value)}>
                {empty && <option value="">{empty}</option>}
                {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            {hint && !error && <em className="ci-hint">{hint}</em>}
            {error && <em className="ci-error"><Icon name="alert" size={13} /> {error}</em>}
        </label>
    );
}

function Switch({ checked, onChange, label, disabled }) {
    return (
        <label className={`ci-switch ${disabled ? "is-disabled" : ""}`}>
            <input type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
            <i aria-hidden="true" />
            {label && <span>{label}</span>}
        </label>
    );
}

function Mover({ index, count, onMove, onDelete, deleteLabel }) {
    return (
        <div className="ci-mover">
            <button type="button" className="ci-iconbtn" disabled={index === 0} onClick={() => onMove(index - 1)} aria-label="Move up"><Icon name="up" size={16} /></button>
            <button type="button" className="ci-iconbtn" disabled={index === count - 1} onClick={() => onMove(index + 1)} aria-label="Move down"><Icon name="down" size={16} /></button>
            <button type="button" className="ci-iconbtn is-danger" onClick={onDelete} aria-label={deleteLabel}><Icon name="trash" size={16} /></button>
        </div>
    );
}

function MediaSlot({ label, mediaId, onPick, onClear }) {
    const { media } = useCtx();
    const item = media.find((m) => idEq(m.id, mediaId));
    return (
        <div className="ci-media">
            <span className="ci-media-label">{label}</span>
            <div className="ci-media-box">
                <span className={`ci-thumb ${item ? "has-item" : ""}`}>{item?.url ? <img src={item.url} alt="" /> : <Icon name="image" size={20} />}</span>
                <span className="ci-media-text">
                    <strong>{item ? item.name : "Nothing selected"}</strong>
                    <small>{item ? item.alt || "No alt text yet" : "Choose from the Media Library"}</small>
                </span>
                <button type="button" className="ci-btn-small" onClick={onPick}>{item ? "Change" : "Choose"}</button>
                {item && <button type="button" className="ci-iconbtn" aria-label="Remove image" onClick={onClear}><Icon name="close" size={15} /></button>}
            </div>
        </div>
    );
}

function Chips({ options, value, onChange, counts, label }) {
    return (
        <div className="ci-chips" role="tablist" aria-label={label}>
            {options.map((t) => (
                <button key={t.value} type="button" role="tab" aria-selected={value === t.value} className={value === t.value ? "is-active" : ""} onClick={() => onChange(t.value)}>
                    {t.label}<b>{counts[t.value] ?? 0}</b>
                </button>
            ))}
        </div>
    );
}

function SearchBox({ value, onChange, placeholder }) {
    return (
        <label className="ci-search">
            <Icon name="search" size={16} />
            <input type="search" value={value} placeholder={placeholder} aria-label={placeholder} onChange={(e) => onChange(e.target.value)} />
        </label>
    );
}

function PanelHead({ title, text, children }) {
    return <div className="ci-panel-head"><div><h2>{title}</h2><p>{text}</p></div>{children}</div>;
}

/* Picks records from another table and stores { id, role } (the join table row). */
function LinkPicker({ title, options, items, onChange, roleLabel = "Role", emptyText }) {
    const [pick, setPick] = useState("");
    const free = options.filter((o) => !items.some((x) => idEq(x.id, o.id)));
    const add = () => {
        if (!pick) return;
        onChange([...items, { id: options.find((o) => idEq(o.id, pick)).id, role: "" }]);
        setPick("");
    };
    const setRole = (k, role) => onChange(items.map((x, j) => (j === k ? { ...x, role } : x)));
    return (
        <div className="ci-links">
            <div className="ci-links-add">
                <label className="ci-field">
                    <span className="ci-field-top"><span>{title}</span></span>
                    <select className="ci-input" value={pick} onChange={(e) => setPick(e.target.value)} disabled={free.length === 0}>
                        <option value="">{free.length ? "Choose to add…" : "Everything is already added"}</option>
                        {free.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                    </select>
                </label>
                <button type="button" className="ci-btn-small" disabled={!pick} onClick={add}><Icon name="plus" size={15} /> Add</button>
            </div>
            {items.length === 0 && <p className="ci-empty">{emptyText}</p>}
            <ul className="ci-list">
                {items.map((it, k) => {
                    const opt = options.find((o) => idEq(o.id, it.id));
                    return (
                        <li key={it.id} className="ci-linkrow">
                            <strong>{opt?.label || "Missing record"}</strong>
                            <input className="ci-input" aria-label={roleLabel} placeholder={roleLabel} value={it.role} onChange={(e) => setRole(k, e.target.value)} />
                            <button type="button" className="ci-iconbtn is-danger" aria-label={`Remove ${opt?.label || "link"}`} onClick={() => onChange(items.filter((_, j) => j !== k))}><Icon name="close" size={15} /></button>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}

/* ---------------------- generic record list and editor ---------------------- */

function FieldRow({ mod, f, r, set }) {
    const { errors, refOptions, pickMedia } = useCtx();
    const ek = `${mod.prefix}.${r.id}.${f.k}`;
    const v = r[f.k];
    const cls = f.full ? "ci-full" : "";
    if (f.t === "media") return <div className="ci-full"><MediaSlot label={f.label} mediaId={v} onPick={() => pickMedia({ type: "image", onSelect: (x) => set({ [f.k]: x.id }) })} onClear={() => set({ [f.k]: null })} /></div>;
    if (f.t === "switch") return <div className="ci-full"><Switch checked={Boolean(v)} label={f.label} onChange={(x) => set({ [f.k]: x })} /></div>;
    if (f.t === "select") return <Select className={cls} label={f.label} value={v} options={f.options} hint={f.hint} errorKey={ek} onChange={(x) => set({ [f.k]: x })} />;
    if (f.t === "ref") return <Select className={cls} label={f.label} value={v} empty={f.empty} options={refOptions(f.src).filter((o) => !(f.src === mod.key && idEq(o.value, r.id)))} errorKey={ek} onChange={(x) => set({ [f.k]: idOrNull(x) })} />;
    if (f.t === "area") return <Field className={cls} label={f.label} textarea rows={f.rows} value={v} hint={f.hint} errorKey={ek} onChange={(x) => set({ [f.k]: x })} />;
    if (f.t === "date") return <Field className={cls} label={f.label} type="date" value={v} hint={f.hint} errorKey={ek} onChange={(x) => set({ [f.k]: x })} />;
    if (f.t === "year") return <Field className={cls} label={f.label} type="number" min={YEAR_MIN} maxValue={YEAR_MAX} value={v} errorKey={ek} onChange={(x) => set({ [f.k]: toYear(x) })} />;
    if (f.t === "money") return <Field className={cls} label={f.label} type="number" min={0} value={v} errorKey={ek} onChange={(x) => set({ [f.k]: x === "" ? "" : Number(x) })} />;
    if (f.t === "slug") return <Field className={cls} label={f.label} value={v} hint={`/${mod.path}/${v || "…"}`} errorKey={ek} onChange={(x) => set({ [f.k]: slugify(x) })} />;
    return (
        <Field className={cls} label={f.label} value={v} hint={f.hint} errorKey={ek}
            onChange={(x) => set({ [f.k]: x, ...(mod.slug && f.k === mod.nameKey && (!r.slug || r.slug === slugify(v)) ? { slug: slugify(x) } : {}) })} />
    );
}

function ModuleView({ mod }) {
    const { data, edit, errors, askDelete, refOptions, nameOf, openId, setOpenId } = useCtx();
    const [q, setQ] = useState("");
    const [filter, setFilter] = useState("all");
    const [shown, setShown] = useState(LIMITS.page);
    const items = data[mod.key];
    const sf = mod.statusField;
    const statusKey = sf?.field || "status";
    const live = (r) => isLive(mod, r);

    const counts = { all: items.length, draft: items.filter((r) => !live(r)).length };
    sf?.options.forEach((o) => { counts[o.value] = items.filter((r) => r[statusKey] === o.value).length; });
    const chips = [{ value: "all", label: "All" }, ...(sf ? sf.options : []), ...(mod.live ? [] : [{ value: "draft", label: "Not published" }])];

    const term = q.trim().toLowerCase();
    const list = items.map((r, i) => ({ r, i })).filter(({ r }) =>
        (filter === "all" || (filter === "draft" ? !live(r) : r[statusKey] === filter)) &&
        (!term || `${r[mod.nameKey]} ${r.summary || ""} ${r.funder || ""} ${r.overview || ""}`.toLowerCase().includes(term)));

    const add = () => {
        const rec = mod.blank();
        edit((d) => { d[mod.key].push(rec); });
        setFilter("all"); setQ(""); setOpenId(rec.id);
    };

    const remove = (r, i) => {
        const deps = mod.key === "groups" ? data.projects.filter((p) => idEq(p.groupId, r.id)).length + data.opportunities.filter((o) => idEq(o.groupId, r.id)).length
            : mod.key === "projects" ? data.grants.filter((g) => idEq(g.projectId, r.id)).length : 0;
        askDelete({
            what: r[mod.nameKey] || `this ${mod.noun}`,
            note: deps ? `${deps} linked record${deps === 1 ? "" : "s"} will lose this link.` : undefined,
            onConfirm: () => edit((d) => {
                d[mod.key].splice(i, 1);
                if (mod.key === "groups") { d.projects.forEach((p) => { if (idEq(p.groupId, r.id)) p.groupId = null; }); d.opportunities.forEach((o) => { if (idEq(o.groupId, r.id)) o.groupId = null; }); }
                if (mod.key === "projects") d.grants.forEach((g) => { if (idEq(g.projectId, r.id)) g.projectId = null; });
            }),
        });
    };

    return (
        <div className="ci-panel">
            <PanelHead title={VIEWS.find((v) => v.key === mod.key).title} text={`${items.length} record${items.length === 1 ? "" : "s"}. Records in order are shown in that order on the website.`}>
                <button type="button" className="ci-btn-small" onClick={add}><Icon name="plus" size={15} /> {mod.add}</button>
            </PanelHead>
            <div className="ci-toolbar"><SearchBox value={q} onChange={(v) => { setQ(v); setShown(LIMITS.page); }} placeholder={`Search ${mod.noun}s`} /></div>
            <Chips label="Filter" value={filter} onChange={(v) => { setFilter(v); setShown(LIMITS.page); }} counts={counts} options={chips} />
            {list.length === 0 && <p className="ci-empty">{items.length ? "No records match these filters." : `No ${mod.noun}s yet. Use “${mod.add}” to start.`}</p>}
            <ol className="ci-list">
                {list.slice(0, shown).map(({ r, i }) => {
                    const open = idEq(openId, r.id);
                    const bad = Object.keys(errors).filter((k) => k.startsWith(`${mod.prefix}.${r.id}.`)).length;
                    const set = (patch) => edit((d) => { Object.assign(d[mod.key][i], patch); });
                    return (
                        <li key={r.id} className="ci-card">
                            <div className="ci-card-top">
                                <button type="button" className="ci-toggle" aria-expanded={open} onClick={() => setOpenId(open ? null : r.id)}>
                                    <span className="ci-toggle-text"><strong>{r[mod.nameKey] || `New ${mod.noun}`}</strong><small>{mod.sub(r, { nameOf }) || "Nothing added yet"}</small></span>
                                    <Icon name={open ? "up" : "down"} size={17} />
                                </button>
                                {bad > 0 && <span className="ci-badge-error">{bad}</span>}
                                {mod.key === "opportunities"
                                    ? <span className={`ci-pill ${r.status === "open" ? "is-ok" : r.status === "closed" ? "is-off" : "is-warn"}`}>{labelOf(OPP_STATUS, r.status)}</span>
                                    : <span className={`ci-pill ${r.isPublished ? "is-ok" : "is-warn"}`}>{r.isPublished ? "Published" : "Draft"}</span>}
                                <Mover index={i} count={items.length} deleteLabel={`Delete ${r[mod.nameKey] || mod.noun}`} onMove={(to) => edit((d) => move(d[mod.key], i, to))} onDelete={() => remove(r, i)} />
                            </div>
                            {open && (
                                <div className="ci-card-body">
                                    <div className="ci-grid">{mod.fields.map((f) => <FieldRow key={f.k} mod={mod} f={f} r={r} set={set} />)}</div>
                                    {mod.link && (
                                        <LinkPicker title={mod.link.title} roleLabel={mod.link.role} emptyText={mod.link.empty} options={refOptions(mod.link.src).map((o) => ({ id: o.value, label: o.label }))}
                                            items={r[mod.link.key]} onChange={(next) => set({ [mod.link.key]: next })} />
                                    )}
                                    {mod.key !== "opportunities" && (
                                        <Switch checked={r.isPublished} label={r.isPublished ? "Published on the website" : "Draft, not on the website"}
                                            onChange={(v) => set({ isPublished: v, ...(mod.key === "projects" && !v ? { isFeatured: false } : {}) })} />
                                    )}
                                </div>
                            )}
                        </li>
                    );
                })}
            </ol>
            {list.length > shown && <button type="button" className="ci-btn-outline ci-more" onClick={() => setShown((n) => n + LIMITS.page)}>Show more ({list.length - shown} left)</button>}
        </div>
    );
}

/* ----------------------------- featured programmes ----------------------------- */

function ProgrammesView() {
    const { data, edit, errors, nameOf } = useCtx();
    const featured = data.projects.filter((p) => p.isFeatured).length;
    return (
        <div className="ci-panel">
            <PanelHead title="Featured programmes" text={`${featured} of ${LIMITS.featured} featured. Only published projects can be featured, for example the Perlis Airspace Sandbox.`} />
            {errors.featured && <em className="ci-error"><Icon name="alert" size={13} /> {errors.featured}</em>}
            {data.projects.length === 0 && <p className="ci-empty">No projects yet. Add projects first.</p>}
            <ul className="ci-table">
                {data.projects.map((p, i) => (
                    <li key={p.id} className="ci-trow">
                        <span className="ci-who"><strong>{p.title || "Untitled project"}</strong><small>{nameOf("groups", p.groupId) || "No group"} · {labelOf(PROJECT_STATUS, p.status)}</small></span>
                        <span className={`ci-pill ${p.isPublished ? "is-ok" : "is-warn"}`}>{p.isPublished ? "Published" : "Draft"}</span>
                        <button
                            type="button"
                            className={`ci-star ${p.isFeatured ? "is-on" : ""}`}
                            aria-pressed={p.isFeatured}
                            aria-label={p.isFeatured ? `Remove ${p.title} from featured` : `Feature ${p.title}`}
                            title={!p.isPublished ? "Publish the project first" : !p.isFeatured && featured >= LIMITS.featured ? `Limit of ${LIMITS.featured} reached` : "Feature"}
                            disabled={!p.isPublished || (!p.isFeatured && featured >= LIMITS.featured)}
                            onClick={() => edit((d) => { d.projects[i].isFeatured = !d.projects[i].isFeatured; })}
                        ><Icon name="star" size={16} /></button>
                    </li>
                ))}
            </ul>
        </div>
    );
}

/* --------------------------- history, picker, dialogs --------------------------- */

const ACTION_TONE = { CREATE: "is-new", UPDATE: "is-info", PUBLISH: "is-ok", UNPUBLISH: "is-warn", DELETE: "is-danger", RESTORE: "is-ok" };

function HistoryPanel({ history }) {
    return (
        <div className="ci-panel ci-narrow">
            <PanelHead title="History" text="Every change in Research and Innovation, from the audit log." />
            {history.length === 0 && <p className="ci-empty">Nothing recorded yet.</p>}
            <ol className="ci-history">
                {history.map((h) => (
                    <li key={h.id}>
                        <span className={`ci-pill ${ACTION_TONE[h.action] || "is-info"}`}>{h.action}</span>
                        <div>
                            <strong>{h.label}</strong>
                            <small>{h.user} · {timeAgo(h.at)}</small>
                            {h.changes?.length > 0 && <ul>{h.changes.map((c, k) => <li key={k}>{c.field}: {c.from} → {c.to}</li>)}</ul>}
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
        <div className="ci-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
            <div className="ci-dialog" role="dialog" aria-modal="true" aria-labelledby={titleId}>
                <div className="ci-dialog-head">
                    <h2 id={titleId}>Media Library</h2>
                    <button type="button" className="ci-iconbtn" aria-label="Close" onClick={onClose}><Icon name="close" size={16} /></button>
                </div>
                <div className="ci-media-grid">
                    {list.map((m) => (
                        <button key={m.id} type="button" className="ci-media-item" onClick={() => { state.onSelect(m); onClose(); }}>
                            <span className="ci-media-preview">{m.url ? <img src={m.url} alt="" /> : <Icon name="image" size={26} />}</span>
                            <strong>{m.name}</strong>
                            <small>{m.size}</small>
                        </button>
                    ))}
                    {list.length === 0 && <p className="ci-empty">The library has no images yet.</p>}
                </div>
                <div className="ci-dialog-actions">
                    <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => { if (e.target.files[0]) onUpload(e.target.files[0]); e.target.value = ""; }} />
                    <button type="button" className="ci-btn-outline" onClick={() => fileRef.current?.click()}><Icon name="upload" size={15} /> Upload new</button>
                    <button type="button" className="ci-btn-dark" onClick={onClose}>Done</button>
                </div>
            </div>
        </div>
    );
}

/* ---------------------- full-page preview (public look) ---------------------- */

const SITE_NAV = ["Home", "About", "People", "Research and Innovation", "Publications", "Facilities", "Engagement", "Contact"];
const DEVICES = [{ key: "desktop", label: "Desktop", width: null }, { key: "tablet", label: "Tablet", width: 820 }, { key: "mobile", label: "Mobile", width: 390 }];

function PreviewModal({ data, media, nameOf, view, onClose, previewUrl }) {
    const [device, setDevice] = useState("desktop");
    const width = DEVICES.find((d) => d.key === device).width;
    const imageOf = (id) => media.find((m) => idEq(m.id, id))?.url || null;
    const heading = VIEWS.find((v) => v.key === view).title;

    useEffect(() => {
        const onKey = (e) => e.key === "Escape" && onClose();
        document.addEventListener("keydown", onKey);
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
    }, [onClose]);

    const cards = {
        groups: () => data.groups.filter((g) => g.isPublished).map((g) => ({ id: g.id, title: g.name, photo: g.coverId, meta: g.leaderId ? `Led by ${nameOf("members", g.leaderId)}` : "", text: g.overview, tags: splitList(g.expertise) })),
        projects: () => data.projects.filter((p) => p.isPublished).map((p) => ({ id: p.id, title: p.title, badge: labelOf(PROJECT_STATUS, p.status), meta: [nameOf("groups", p.groupId), labelOf(PROJECT_TYPES, p.type)].filter(Boolean).join(" · "), text: p.summary, tags: splitList(p.collaboratingOrgs) })),
        grants: () => data.grants.filter((g) => g.isPublished).map((g) => ({ id: g.id, title: g.title, badge: labelOf(GRANT_STATUS, g.status), meta: [g.funder, g.grantCode, g.amount !== "" && g.isAmountPublic ? money(g.amount) : null].filter(Boolean).join(" · "), text: nameOf("projects", g.projectId) ? `Project: ${nameOf("projects", g.projectId)}` : "" })),
        innovations: () => data.innovations.filter((x) => x.isPublished).map((x) => ({ id: x.id, title: x.title, photo: x.coverId, badge: labelOf(INNOVATION_TYPES, x.type), meta: [x.registrationNo, x.year, x.statusText].filter(Boolean).join(" · "), text: x.description })),
        opportunities: () => data.opportunities.filter((o) => o.status === "open").map((o) => ({ id: o.id, title: o.title, badge: labelOf(OPP_TYPES, o.type), meta: [nameOf("groups", o.groupId), o.supervisorId ? `Supervisor: ${nameOf("members", o.supervisorId)}` : null].filter(Boolean).join(" · "), text: o.description, foot: o.closeDate ? `Closes ${formatDate(o.closeDate)}` : "" })),
        programmes: () => data.projects.filter((p) => p.isPublished && p.isFeatured).map((p) => ({ id: p.id, title: p.title, badge: labelOf(PROJECT_STATUS, p.status), meta: nameOf("groups", p.groupId), text: p.summary })),
    }[view]();

    const hidden = view === "opportunities" ? data.opportunities.length - cards.length
        : view === "programmes" ? 0 : data[view].length - cards.length;

    return (
        <div className="civ-overlay" role="dialog" aria-modal="true" aria-label="Page preview">
            <div className="civ-bar">
                <div className="civ-bar-left">
                    <span className="civ-live"><i /> Preview</span>
                    <small>Your current edits, not the live page.{hidden > 0 && ` ${hidden} not published, hidden.`}</small>
                </div>
                <div className="civ-devices" role="tablist" aria-label="Screen size">
                    {DEVICES.map((d) => <button key={d.key} type="button" role="tab" aria-selected={device === d.key} className={device === d.key ? "is-on" : ""} onClick={() => setDevice(d.key)}>{d.label}</button>)}
                </div>
                <div className="civ-bar-right">
                    {previewUrl && <a className="civ-bar-btn" href={previewUrl} target="_blank" rel="noreferrer">Open saved preview</a>}
                    <button type="button" className="civ-bar-btn" onClick={onClose}>Close <kbd>Esc</kbd></button>
                </div>
            </div>
            <div className="civ-stage">
                <div className={`civ-frame is-${device}`} style={width ? { width } : undefined}>
                    <div className="civ">
                        <header className="civ-nav">
                            <b className="civ-brand"><i />COE-UAS</b>
                            <nav aria-label="Site (preview)">{SITE_NAV.map((n) => <span key={n} className={n === "Research and Innovation" ? "is-on" : ""}>{n}</span>)}</nav>
                            <span className="civ-cta">Contact us</span>
                        </header>
                        <div className="civ-hero"><div className="civ-wrap"><p><span>Research and Innovation</span> {heading}</p></div></div>
                        <section className="civ-sec">
                            <div className="civ-wrap">
                                <h2>{heading}</h2>
                                {cards.length === 0 && <p className="civ-sub">Nothing is published here yet.</p>}
                                <ul className="civ-grid">
                                    {cards.map((c) => (
                                        <li key={c.id} className="civ-card">
                                            {c.photo !== undefined && <span className="civ-face">{imageOf(c.photo) ? <img src={imageOf(c.photo)} alt="" /> : initialsOf(c.title)}</span>}
                                            {c.badge && <em>{c.badge}</em>}
                                            <b>{c.title}</b>
                                            {c.meta && <small>{c.meta}</small>}
                                            {c.text && <span>{c.text}</span>}
                                            {c.tags?.length > 0 && <div className="ci-tags">{c.tags.map((t) => <span key={t} className="ci-tag">{t}</span>)}</div>}
                                            {c.foot && <small>{c.foot}</small>}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* -------------------------------- the page -------------------------------- */

const pathInfo = (props, url) => ({
    view: VIEWS.find((v) => v.route === props.section)?.key || props.view || VIEWS.find((v) => (url || "").includes(`/research/${v.route}`))?.key || "groups",
});

export default function AdminCOEUASInnovation() {
    const { props, url } = usePage();
    const live = Boolean(props.research?.data);
    const dialogTitleId = useId();

    const seed = useRef(
        live
            ? { data: { groups: [], projects: [], grants: [], innovations: [], opportunities: [], ...props.research.data }, catalog: props.research.catalog || {}, history: props.research.history || [] }
            : { data: sampleData, catalog: sampleCatalog, history: sampleHistory }
    ).current;

    const [saved, setSaved] = useState(() => clone(seed.data));
    const [data, setData] = useState(() => clone(seed.data));
    const [localHistory, setLocalHistory] = useState(seed.history);
    const [mediaList, setMediaList] = useState(seed.catalog?.media || []);
    const history = live ? props.research.history || [] : localHistory;

    const [view, setView] = useState(pathInfo(props, url).view);
    const [tab, setTab] = useState("content");
    const [openId, setOpenId] = useState(null);
    const [submitted, setSubmitted] = useState(false);
    const [busy, setBusy] = useState(false);
    const [dialog, setDialog] = useState(null);
    const [picker, setPicker] = useState(null);
    const [preview, setPreview] = useState(false);
    const [toast, setToast] = useState(null);
    const busyRef = useRef(false);

    /* follow the sidebar links */
    useEffect(() => { setView(pathInfo(props, url).view); setTab("content"); setOpenId(null); }, [props.section, props.view, url]);

    const dirty = useMemo(() => !sameJson(data, saved), [data, saved]);
    const allErrors = useMemo(() => validate(data), [data]);
    const errors = useMemo(() => ({ ...(props.errors || {}), ...(submitted ? allErrors : {}) }), [props.errors, submitted, allErrors]);
    const totalErrors = Object.keys(allErrors).length;
    const changedKeys = useMemo(() => KEYS.filter((k) => !sameJson(data[k], saved[k])), [data, saved]);
    const changedLabels = changedKeys.map((k) => KEY_LABEL[k]);

    useEffect(() => {
        if (!toast) return undefined;
        const t = setTimeout(() => setToast(null), 5000);
        return () => clearTimeout(t);
    }, [toast]);

    /* warn before leaving with unsaved changes (moving between the Research links is allowed: same page) */
    useEffect(() => {
        const beforeUnload = (e) => { if (dirty) { e.preventDefault(); e.returnValue = ""; } };
        window.addEventListener("beforeunload", beforeUnload);
        const off = router.on("before", (event) => {
            const target = event?.detail?.visit?.url?.pathname || "";
            if (target.startsWith(`${BASE}/research`)) return undefined;
            if (dirty && !busyRef.current && !window.confirm("You have unsaved changes. Leave this page and discard them?")) return false;
            return undefined;
        });
        return () => { window.removeEventListener("beforeunload", beforeUnload); if (typeof off === "function") off(); };
    }, [dirty]);

    const media = live ? props.research.catalog?.media || mediaList : mediaList;
    const members = (live ? props.research.catalog?.members : seed.catalog.members) || [];

    const edit = (fn) => setData((d) => { const copy = clone(d); fn(copy); return copy; });
    const askDelete = (info) => setDialog({ type: "delete", ...info });
    const pickMedia = (opts) => setPicker(opts);
    const finishBusy = () => { setBusy(false); busyRef.current = false; };

    const refOptions = (src) => {
        if (src === "members") return members.map((m) => ({ value: m.id, label: m.name }));
        if (src === "groups") return data.groups.map((g) => ({ value: g.id, label: g.name || "Unnamed group" }));
        return data.projects.map((p) => ({ value: p.id, label: p.title || "Untitled project" }));
    };
    const nameOf = (src, id) => refOptions(src).find((o) => idEq(o.value, id))?.label || "";

    const go = (next) => {
        setView(next); setTab("content"); setOpenId(null);
        if (live) router.visit(`${BASE}/research/${VIEWS.find((v) => v.key === next).route}`, { preserveState: true, preserveScroll: true });
    };

    const addHistory = (action, label, changes = []) =>
        setLocalHistory((h) => [{ id: Date.now(), user: "You", action, label, at: new Date().toISOString(), changes }, ...h]);

    const jumpToFirstError = () => {
        const first = Object.keys(allErrors)[0];
        if (!first) return;
        const p = first.split(".");
        setView(VIEW_OF_PREFIX[p[0]]); setTab("content"); setOpenId(p[1] ?? null);
        setTimeout(() => document.querySelector(".ci-field.has-error")?.scrollIntoView({ behavior: "smooth", block: "center" }), 150);
    };

    /* ---- actions ---- */
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
            setSaved(clone(data));
            setSubmitted(false);
            if (!live) addHistory("UPDATE", changedLabels.join(", "), changedLabels.map((l) => ({ field: l, from: "Previous version", to: "Updated" })));
            setToast({ tone: "ok", text: "Saved. Published records are now live on the website." });
            finishBusy();
        };
        if (live) router.put(ENDPOINTS.save, payload, { preserveScroll: true, preserveState: true, onSuccess: done, onError: () => { finishBusy(); setSubmitted(true); setToast({ tone: "error", text: "The server rejected some values. Check the highlighted fields." }); } });
        else setTimeout(done, 350);
    };

    const confirmDelete = () => {
        dialog.onConfirm();
        if (!live) addHistory("DELETE", `${VIEWS.find((v) => v.key === view).title}: ${dialog.what}`, [{ field: "Moved to Trash", from: dialog.what, to: "(deleted)" }]);
        setToast({ tone: "ok", text: `“${dialog.what}” moved to Trash. It leaves the website when you save.` });
        setDialog(null);
    };

    const uploadMedia = (file) => {
        const local = { id: Date.now(), name: file.name, type: "image", alt: "", size: `${(file.size / 1048576).toFixed(1)} MB`, url: URL.createObjectURL(file) };
        if (live) {
            router.post(ENDPOINTS.upload, { file }, { forceFormData: true, preserveScroll: true, preserveState: true, onSuccess: () => setToast({ tone: "ok", text: `${file.name} uploaded.` }), onError: () => setToast({ tone: "error", text: "The upload failed. Try a smaller image." }) });
        } else {
            setMediaList((m) => [local, ...m]);
            setToast({ tone: "ok", text: `${file.name} added (sample data, not stored).` });
        }
    };

    /* Ctrl / Cmd + S saves */
    useEffect(() => {
        const onKey = (e) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") { e.preventDefault(); save(); } };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    });

    const ctx = { data, edit, errors, media, askDelete, pickMedia, refOptions, nameOf, openId, setOpenId };
    const current = VIEWS.find((v) => v.key === view);
    const mod = MODULES[view];
    const liveCount = mod ? data[mod.key].filter((r) => isLive(mod, r)).length : data.projects.filter((p) => p.isFeatured).length;
    const totalCount = mod ? data[mod.key].length : LIMITS.featured;

    return (
        <Ctx.Provider value={ctx}>
            <div className="coeuas-innovation">
                <div className="ci-heading">
                    <div>
                        <h1>{current.title}</h1>
                        <p>{current.text}</p>
                        <div className="ci-status">
                            <span className="ci-pill is-ok">{mod ? `${liveCount} of ${totalCount} ${mod.key === "opportunities" ? "open" : "published"}` : `${liveCount} of ${totalCount} featured`}</span>
                            {dirty && <span className="ci-pill is-warn">Unsaved: {changedLabels.join(", ")}</span>}
                            {totalErrors > 0 && submitted && <span className="ci-pill is-danger">{totalErrors} to fix</span>}
                        </div>
                    </div>
                    <div className="ci-actions">
                        <button type="button" className="ci-btn-outline" onClick={() => setPreview(true)}><Icon name="eye" size={16} /> Preview</button>
                        <button type="button" className="ci-btn-dark" onClick={save} disabled={!dirty || busy}>
                            <span className="ci-btn-icon"><Icon name="save" size={16} /></span> {busy ? "Saving..." : "Save changes"}
                        </button>
                    </div>
                </div>

                {!live && <p className="ci-note"><Icon name="alert" size={16} /><span>Sample data. Every control works, but nothing is stored until your controller sends the <b>research</b> prop.</span></p>}

                <div className="ci-tabs" role="tablist" aria-label="Research and Innovation sections">
                    {VIEWS.map((v) => (
                        <button key={v.key} type="button" role="tab" aria-selected={view === v.key && tab === "content"} className={view === v.key && tab === "content" ? "is-active" : ""} onClick={() => go(v.key)}>
                            {v.title}
                            {Object.keys(errors).some((k) => VIEW_OF_PREFIX[k.split(".")[0]] === v.key) && <span className="ci-badge-error">!</span>}
                        </button>
                    ))}
                    <button type="button" role="tab" aria-selected={tab === "history"} className={tab === "history" ? "is-active" : ""} onClick={() => setTab("history")}>
                        History<span className="ci-badge">{history.length}</span>
                    </button>
                </div>

                {tab === "history" && <HistoryPanel history={history} />}
                {tab === "content" && mod && <ModuleView key={mod.key} mod={mod} />}
                {tab === "content" && view === "programmes" && <ProgrammesView />}

                {dirty && (
                    <div className="ci-savebar" role="region" aria-label="Unsaved changes">
                        <span className="ci-savebar-text"><i /> {changedLabels.length} area{changedLabels.length === 1 ? "" : "s"} edited, not saved</span>
                        <div>
                            <button type="button" className="ci-btn-ghost" onClick={() => { setData(clone(saved)); setSubmitted(false); setToast({ tone: "info", text: "Changes discarded." }); }} disabled={busy}>Discard</button>
                            <button type="button" className="ci-btn-accent" onClick={save} disabled={busy}>{busy ? "Saving..." : "Save changes"}</button>
                        </div>
                    </div>
                )}

                {dialog?.type === "delete" && (
                    <div className="ci-overlay" onMouseDown={(e) => e.target === e.currentTarget && setDialog(null)}>
                        <div className="ci-dialog ci-small" role="alertdialog" aria-modal="true" aria-labelledby={dialogTitleId}>
                            <span className="ci-dialog-icon is-danger"><Icon name="trash" size={22} /></span>
                            <h2 id={dialogTitleId}>Delete “{dialog.what}”?</h2>
                            <p>{dialog.note ? `${dialog.note} ` : ""}It moves to Deleted content, where only the Super Admin can restore or purge it. It leaves the website when you save.</p>
                            <div className="ci-dialog-actions">
                                <button type="button" className="ci-btn-outline" onClick={() => setDialog(null)} autoFocus>Keep it</button>
                                <button type="button" className="ci-btn-danger" onClick={confirmDelete}><Icon name="trash" size={15} /> Move to Trash</button>
                            </div>
                        </div>
                    </div>
                )}

                {picker && <MediaPicker state={picker} media={media} onClose={() => setPicker(null)} onUpload={uploadMedia} />}
                {preview && <PreviewModal data={data} media={media} nameOf={nameOf} view={view} previewUrl={props.research?.previewUrl} onClose={() => setPreview(false)} />}

                {toast && (
                    <div className={`ci-toast is-${toast.tone}`} role="status">
                        <Icon name={toast.tone === "error" ? "alert" : "check"} size={16} />
                        <span>{toast.text}</span>
                        <button type="button" aria-label="Dismiss" onClick={() => setToast(null)}><Icon name="close" size={14} /></button>
                    </div>
                )}
            </div>
        </Ctx.Provider>
    );
}

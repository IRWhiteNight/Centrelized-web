import { createContext, useContext, useEffect, useId, useMemo, useRef, useState } from "react";
import { router, usePage } from "@inertiajs/react";
import "../../../css/admin-COEUAS-css/admin-people.css";

/* ====================================================================
   COE-UAS ADMIN → PEOPLE EDITOR                  /admin/coeuas/people/*

   Site map 1.3 (COE-UAS workspace → "People"), one editor for all four modules:
     1  Member categories and directory         → member_categories + members      (/people/members)
     2  Member profile (13 sections)            → members + member_roles + link tables (/people/profiles?member=ID)
     3  Postdoctoral researchers                → postdoctoral_researchers + postdoc_mentorships (/people/postdoctoral)
     4  Postgraduate students and supervision   → postgraduate_students + student_supervisions  (/people/postgraduate)
   Use case 2.3: "Manage Member Categories", "Manage Member Profile (13 sections)",
   "Manage Postdoctoral Researchers", "Manage Postgraduate Students", "Feature Members on Home".
   Common screens: list with search / filter / sort, create / edit, preview, publish / unpublish,
   delete to Trash, History tab (audit_logs).

   THE 13 PROFILE SECTIONS (the document gives the number, not the names; these come from the ERD):
     1 Identity and status            members (name, slug, category, designation, coe_role, membership, status, photo)
     2 Biography                      members.biography
     3 Qualifications                 members.qualifications
     4 Expertise and research interests
     5 Contact and academic profiles  email, scopus / scholar / orcid
     6 Professional roles             member_roles
     7 Supervision and mentoring      student_supervisions + postdoc_mentorships (read only here, edited on the student / postdoc cards)
     8 Research groups                research_group_members
     9 Research projects              project_members
    10 Research grants                grant_members
    11 Innovation and IP              innovation_members
    12 Linkages and affiliations      member_linkages
    13 Publications, citations, awards  publication_authors, citation_profiles, awards (read only; managed in their own modules)

   ONE ADDITION TO THE ERD: members, postgraduate_students and postdoctoral_researchers have no
   draft / published column. This page uses `isPublished` (BOOLEAN) on all three so the "draft, preview
   and publish" screen works. Add the column, or map it to your own status field.

   SAMPLE DATA: the page works today (changes stay on screen only). Return an Inertia prop named
   `people` and it switches to LIVE mode:

   Inertia::render('admin-COEUAS/AdminCOEUASPeople', [
       'view' => 'members',        // optional: members | profiles | postdoctoral | postgraduate
       'memberId' => null,         // optional: member to open in the profile editor
       'people' => [
           'data'    => ['categories' => [], 'members' => [], 'postdocs' => [], 'students' => []], // same shape as `sampleData`
           'catalog' => [...],     // media, groups, projects, grants, innovations, linkages, publications, citations, awards
           'history' => [...],     // audit_logs rows
           'previewUrl' => 'https://...',
       ],
   ]);

   Send the same prop for all four sidebar routes. Save sends only the collections that changed:
   PUT /admin/coeuas/people  { categories?, members?, postdocs?, students? }
   The controller must write audit_logs and soft-delete (deleted_at) removed records.
==================================================================== */

const BASE = "/admin/coeuas"; // keep in sync with coeuasRoutes.js
const ENDPOINTS = {
    save: `${BASE}/people`,
    upload: `${BASE}/media/upload`,
};

const VIEWS = [
    { key: "members", route: "members", label: "Member categories and directory", title: "Members", text: "Organise members into categories and control who appears on the website." },
    { key: "profiles", route: "profiles", label: "Member profile", title: "Member profile", text: "Edit one member across all 13 profile sections." },
    { key: "postdoctoral", route: "postdoctoral", label: "Postdoctoral researchers", title: "Postdoctoral researchers", text: "Current and former postdoctoral researchers and their mentors." },
    { key: "postgraduate", route: "postgraduate", label: "Postgraduate students and supervision", title: "Postgraduate students", text: "PhD and Masters students, alumni and who supervises them." },
];

const PROFILE_SECTIONS = [
    { label: "Identity and status", hint: "Name, category, photo" },
    { label: "Biography", hint: "Short life story" },
    { label: "Qualifications", hint: "Degrees and certificates" },
    { label: "Expertise and interests", hint: "What they work on" },
    { label: "Contact and academic profiles", hint: "Email, Scopus, ORCID" },
    { label: "Professional roles", hint: "Committees, appointments" },
    { label: "Supervision and mentoring", hint: "Students and postdocs" },
    { label: "Research groups", hint: "Group membership" },
    { label: "Research projects", hint: "Projects they work on" },
    { label: "Research grants", hint: "Grants they hold" },
    { label: "Innovation and IP", hint: "Patents and prototypes" },
    { label: "Linkages and affiliations", hint: "Industry and partners" },
    { label: "Publications, citations, awards", hint: "From other modules" },
];

/* enums from the ERD */
const MEMBER_STATUS = [{ value: "active", label: "Active" }, { value: "former", label: "Former" }];
const ROLE_TYPES = [
    { value: "professional_body", label: "Professional body" },
    { value: "committee", label: "Committee" },
    { value: "appointment", label: "Appointment" },
];
const LEVELS = [{ value: "PhD", label: "PhD" }, { value: "Masters", label: "Masters" }];
const STUDENT_STATUS = [{ value: "current", label: "Current" }, { value: "graduated", label: "Graduated" }];
const POSTDOC_STATUS = [{ value: "current", label: "Current" }, { value: "former", label: "Former" }];
const SUPERVISION_ROLES = [{ value: "main", label: "Main supervisor" }, { value: "co", label: "Co-supervisor" }, { value: "advisor", label: "Advisor" }];

const LIMITS = { featured: 8, page: 10 };
const YEAR_MIN = 1980;
const YEAR_MAX = new Date().getFullYear() + 1;

const MIN = 60 * 1000;
const NOW = Date.now();
const minsAgo = (m) => new Date(NOW - m * MIN).toISOString();
let counter = 0;
const uid = () => `n${Date.now().toString(36)}${(counter += 1)}`;

/* ------------------------------ sample data ------------------------------ */

const blankLinks = () => ({ groups: [], projects: [], grants: [], innovations: [], linkages: [] });

const sampleData = {
    categories: [
        { id: 1, name: "Core researchers", slug: "core-researchers" },
        { id: 2, name: "Associate members", slug: "associate-members" },
        { id: 3, name: "Industry fellows", slug: "industry-fellows" },
    ],
    members: [
        {
            id: 1, categoryId: 1, photoId: null, fullName: "Prof. Dr. Ahmad Zaki", slug: "ahmad-zaki", designation: "Professor", coeRole: "Director",
            membershipStart: 2013, membershipEnd: "", biography: "Leads the centre and works on autonomous flight systems and airspace integration.",
            qualifications: "PhD Aerospace Engineering\nMSc Control Systems", expertise: "Flight control, UAS traffic management", researchInterests: "Autonomy, safety cases, airspace integration",
            email: "ahmad.zaki@example.edu.my", scopusUrl: "https://www.scopus.com/authid/detail.uri?authorId=1", scholarUrl: "", orcidUrl: "https://orcid.org/0000-0000-0000-0001",
            status: "active", isFeatured: true, isPublished: true,
            roles: [{ id: "r1", orgName: "Board of Engineers Malaysia", roleTitle: "Professional Engineer", roleType: "professional_body", startYear: 2008, endYear: "" }],
            links: { ...blankLinks(), groups: [{ id: 1, role: "Leader" }], projects: [{ id: 1, role: "Principal investigator" }], grants: [{ id: 1, role: "Leader" }], innovations: [{ id: 1, role: "Inventor" }] },
        },
        {
            id: 2, categoryId: 1, photoId: null, fullName: "Dr. Nurul Huda", slug: "nurul-huda", designation: "Senior Lecturer", coeRole: "Deputy Director (Research)",
            membershipStart: 2016, membershipEnd: "", biography: "Researches sensing and perception for small unmanned aircraft.", qualifications: "PhD Electronic Engineering",
            expertise: "Computer vision, sensor fusion", researchInterests: "Perception, mapping", email: "nurul.huda@example.edu.my", scopusUrl: "", scholarUrl: "", orcidUrl: "",
            status: "active", isFeatured: true, isPublished: true, roles: [],
            links: { ...blankLinks(), groups: [{ id: 2, role: "Member" }], projects: [{ id: 1, role: "Co-investigator" }, { id: 2, role: "Leader" }] },
        },
        {
            id: 3, categoryId: 2, photoId: null, fullName: "Ir. Dr. Faizal Karim", slug: "faizal-karim", designation: "Associate Professor", coeRole: "Deputy Director (Industry and Training)",
            membershipStart: 2018, membershipEnd: "", biography: "", qualifications: "", expertise: "Structures, materials", researchInterests: "",
            email: "faizal.karim@example.edu.my", scopusUrl: "", scholarUrl: "", orcidUrl: "", status: "active", isFeatured: false, isPublished: true, roles: [],
            links: { ...blankLinks(), linkages: [{ id: 1, role: "Lead contact" }] },
        },
        {
            id: 4, categoryId: 1, photoId: null, fullName: "Prof. Dr. Rohana Salleh", slug: "rohana-salleh", designation: "Professor", coeRole: "Former Director",
            membershipStart: 2013, membershipEnd: 2021, biography: "Founding director of the centre.", qualifications: "PhD Mechanical Engineering", expertise: "Aerodynamics", researchInterests: "",
            email: "", scopusUrl: "", scholarUrl: "", orcidUrl: "", status: "former", isFeatured: false, isPublished: true, roles: [], links: blankLinks(),
        },
        {
            id: 5, categoryId: 3, photoId: null, fullName: "Lim Wei Jian", slug: "lim-wei-jian", designation: "Chief Pilot", coeRole: "Industry fellow",
            membershipStart: 2023, membershipEnd: "", biography: "", qualifications: "", expertise: "", researchInterests: "", email: "", scopusUrl: "", scholarUrl: "", orcidUrl: "",
            status: "active", isFeatured: false, isPublished: false, roles: [], links: blankLinks(),
        },
    ],
    postdocs: [
        { id: 1, photoId: null, fullName: "Dr. Siti Aminah", researchTopic: "Swarm coordination for survey drones", appointmentStart: "2024-03-01", appointmentEnd: "", status: "current", isPublished: true, mentors: [{ id: 1, role: "Main mentor" }] },
        { id: 2, photoId: null, fullName: "Dr. Kumar Raj", researchTopic: "Battery health prediction", appointmentStart: "2021-01-01", appointmentEnd: "2023-12-31", status: "former", isPublished: true, mentors: [{ id: 2, role: "Mentor" }] },
    ],
    students: [
        { id: 1, photoId: null, fullName: "Farah Nabila", level: "PhD", researchTitle: "Detect-and-avoid for low-altitude UAS", studyStart: "2023-02-01", studyEnd: "", status: "current", alumniPosition: "", isPublished: true, supervisors: [{ id: 1, role: "main" }, { id: 2, role: "co" }] },
        { id: 2, photoId: null, fullName: "Hakim Zulkifli", level: "Masters", researchTitle: "Visual landing pad detection", studyStart: "2022-09-01", studyEnd: "2024-08-31", status: "graduated", alumniPosition: "Systems engineer, aerospace industry", isPublished: true, supervisors: [{ id: 2, role: "main" }] },
        { id: 3, photoId: null, fullName: "Tan Mei Ling", level: "PhD", researchTitle: "", studyStart: "", studyEnd: "", status: "current", alumniPosition: "", isPublished: false, supervisors: [] },
    ],
};

const sampleCatalog = {
    media: [
        { id: 1, name: "portrait-director.jpg", type: "image", alt: "Portrait", size: "0.4 MB", url: null },
        { id: 2, name: "portrait-researcher.jpg", type: "image", alt: "Portrait", size: "0.5 MB", url: null },
        { id: 3, name: "lab-team.jpg", type: "image", alt: "Team in the lab", size: "1.2 MB", url: null },
    ],
    groups: [{ id: 1, name: "Autonomous Systems" }, { id: 2, name: "Sensing and Perception" }, { id: 3, name: "Airframes and Materials" }],
    projects: [{ id: 1, name: "Detect-and-avoid trials" }, { id: 2, name: "Low-cost mapping payload" }, { id: 3, name: "Corridor management study" }],
    grants: [{ id: 1, name: "National UAS Research Grant" }, { id: 2, name: "Industry Collaboration Fund" }],
    innovations: [{ id: 1, name: "Foldable survey drone (patent filed)" }, { id: 2, name: "Landing pad marker system" }],
    linkages: [{ id: 1, name: "Regional aerospace consortium" }, { id: 2, name: "Partner university, Japan" }, { id: 3, name: "Civil Aviation Authority of Malaysia" }],
    publications: [
        { id: 1, title: "Detect-and-avoid for small UAS in shared airspace", year: 2024, authorIds: [1, 2] },
        { id: 2, title: "Visual localisation without GPS", year: 2023, authorIds: [2] },
        { id: 3, title: "Safety cases for BVLOS trials", year: 2025, authorIds: [1] },
    ],
    citations: [
        { memberId: 1, source: "Scopus", total: 842, h: 14, i10: 21 },
        { memberId: 2, source: "Google Scholar", total: 310, h: 8, i10: 9 },
    ],
    awards: [
        { id: 1, memberId: 2, title: "Best Paper Award", year: 2023 },
        { id: 2, memberId: 1, title: "Outstanding Researcher", year: 2021 },
    ],
};

const sampleHistory = [
    { id: 3, user: "Aisyah Rahman", action: "UPDATE", label: "Members", at: minsAgo(60 * 5), changes: [{ field: "Members", from: "Previous version", to: "Updated" }] },
    { id: 2, user: "Hafiz Roslan", action: "CREATE", label: "Postdoctoral researchers", at: minsAgo(60 * 24 * 3), changes: [] },
    { id: 1, user: "Hafiz Roslan", action: "CREATE", label: "Member categories", at: minsAgo(60 * 24 * 9), changes: [] },
];

/* ------------------------------- helpers -------------------------------- */

const clone = (v) => JSON.parse(JSON.stringify(v));
const sameJson = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const pad2 = (n) => String(n).padStart(2, "0");
const toYear = (v) => (v === "" || v === null || v === undefined ? "" : Number(v));
const slugify = (s = "") => s.toLowerCase().replace(/\b(prof|dr|ir|dato|datuk|assoc)\b\.?/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const initialsOf = (name = "") => name.split(" ").filter((w) => /^[A-Za-z]/.test(w) && !/\.$/.test(w)).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "?";
const splitList = (t) => String(t || "").split(/[\n,;]+/).map((s) => s.trim()).filter(Boolean);
const labelOf = (list, value) => list.find((o) => o.value === value)?.label || value;
const isUrl = (v) => /^(https?:\/\/)[^\s.]+\.[^\s]{2,}$/i.test(v);
const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const idEq = (a, b) => String(a) === String(b);

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

const move = (list, from, to) => {
    if (to < 0 || to >= list.length) return;
    const [item] = list.splice(from, 1);
    list.splice(to, 0, item);
};

const blankMember = (fullName, categoryId) => ({
    id: uid(), categoryId, photoId: null, fullName, slug: slugify(fullName), designation: "", coeRole: "", membershipStart: new Date().getFullYear(), membershipEnd: "",
    biography: "", qualifications: "", expertise: "", researchInterests: "", email: "", scopusUrl: "", scholarUrl: "", orcidUrl: "",
    status: "active", isFeatured: false, isPublished: false, roles: [], links: blankLinks(),
});

/* ------------------------------ validation ------------------------------- */
/* Drafts only need a name (and a category for members). Published records must be complete. */

function validate(d) {
    const e = {};
    const need = (key, value, msg) => { if (!String(value ?? "").trim()) e[key] = msg; };

    const catNames = new Set();
    d.categories.forEach((c) => {
        need(`c.${c.id}.name`, c.name, "Give the category a name.");
        const n = c.name.trim().toLowerCase();
        if (n) { if (catNames.has(n)) e[`c.${c.id}.name`] = "Another category already has this name."; catNames.add(n); }
    });

    const slugs = new Set();
    d.members.forEach((m) => {
        const k = (f) => `m.${m.id}.${f}`;
        need(k("fullName"), m.fullName, "Write the member's name.");
        if (!m.categoryId) e[k("categoryId")] = "Choose a category.";
        need(k("slug"), m.slug, "Add a web address.");
        if (m.slug) { if (slugs.has(m.slug)) e[k("slug")] = "This web address is already used by another member."; slugs.add(m.slug); }
        if (m.membershipStart !== "" && m.membershipEnd !== "" && Number(m.membershipEnd) < Number(m.membershipStart)) e[k("years")] = "The end year is before the start year.";
        if (m.email && !isEmail(m.email)) e[k("email")] = "Enter a valid email address.";
        ["scopusUrl", "scholarUrl", "orcidUrl"].forEach((f) => { if (m[f] && !isUrl(m[f])) e[k(f)] = "Use a full link, starting with https://"; });
        if (m.isPublished) need(k("designation"), m.designation, "Add the designation before publishing.");
        m.roles.forEach((r) => {
            need(k(`role.${r.id}.org`), r.orgName, "Add the organisation.");
            need(k(`role.${r.id}.title`), r.roleTitle, "Add the role.");
            if (r.startYear !== "" && r.endYear !== "" && Number(r.endYear) < Number(r.startYear)) e[k(`role.${r.id}.end`)] = "The end year is before the start year.";
        });
    });
    if (d.members.filter((m) => m.isFeatured).length > LIMITS.featured) e.featured = `At most ${LIMITS.featured} members can be featured on Home.`;
    d.members.forEach((m) => { if (m.isFeatured && !m.isPublished) e[`m.${m.id}.featured`] = "Only published members can be featured."; });

    d.postdocs.forEach((p) => {
        const k = (f) => `p.${p.id}.${f}`;
        need(k("fullName"), p.fullName, "Write the researcher's name.");
        if (p.isPublished) need(k("topic"), p.researchTopic, "Add the research topic before publishing.");
        if (p.appointmentStart && p.appointmentEnd && p.appointmentEnd < p.appointmentStart) e[k("end")] = "The end date is before the start date.";
    });

    d.students.forEach((s) => {
        const k = (f) => `s.${s.id}.${f}`;
        need(k("fullName"), s.fullName, "Write the student's name.");
        if (s.isPublished) {
            need(k("title"), s.researchTitle, "Add the research title before publishing.");
            if (!s.supervisors.some((x) => x.role === "main")) e[k("supervisors")] = "Add a main supervisor before publishing.";
        }
        if (s.studyStart && s.studyEnd && s.studyEnd < s.studyStart) e[k("end")] = "The end date is before the start date.";
    });
    return e;
}

const SECTION_OF_FIELD = { fullName: 0, slug: 0, categoryId: 0, designation: 0, years: 0, featured: 0, email: 4, scopusUrl: 4, scholarUrl: 4, orcidUrl: 4, role: 5 };

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
        edit: <path d="M4 20h4L19 9l-4-4L4 16zM13 7l4 4" />,
        back: <path d="M15 5 8 12l7 7" />,
        lock: (<><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></>),
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

function Field({ label, errorKey, value, onChange, textarea, hint, placeholder, type = "text", rows = 3, min, maxValue, readOnly }) {
    const { errors } = useCtx();
    const errId = useId();
    const error = errorKey ? errors[errorKey] : null;
    const Tag = textarea ? "textarea" : "input";
    return (
        <label className={`cp-field ${error ? "has-error" : ""}`}>
            <span className="cp-field-top"><span>{label}</span></span>
            <Tag
                className="cp-input"
                type={textarea ? undefined : type}
                rows={textarea ? rows : undefined}
                min={type === "number" ? min : undefined}
                max={type === "number" ? maxValue : undefined}
                value={value ?? ""}
                placeholder={placeholder}
                readOnly={readOnly}
                aria-invalid={error ? "true" : undefined}
                aria-describedby={error ? errId : undefined}
                onChange={(e) => onChange(e.target.value)}
            />
            {hint && !error && <em className="cp-hint">{hint}</em>}
            {error && <em className="cp-error" id={errId}><Icon name="alert" size={13} /> {error}</em>}
        </label>
    );
}

function Select({ label, value, options, onChange, errorKey, empty }) {
    const { errors } = useCtx();
    const error = errorKey ? errors[errorKey] : null;
    return (
        <label className={`cp-field ${error ? "has-error" : ""}`}>
            <span className="cp-field-top"><span>{label}</span></span>
            <select className="cp-input" value={value ?? ""} onChange={(e) => onChange(e.target.value)}>
                {empty && <option value="">{empty}</option>}
                {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            {error && <em className="cp-error"><Icon name="alert" size={13} /> {error}</em>}
        </label>
    );
}

function Switch({ checked, onChange, label, disabled, title }) {
    return (
        <label className={`cp-switch ${disabled ? "is-disabled" : ""}`} title={title}>
            <input type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
            <i aria-hidden="true" />
            {label && <span>{label}</span>}
        </label>
    );
}

function Mover({ index, count, onMove, onDelete, deleteLabel, noMove }) {
    return (
        <div className="cp-mover">
            {!noMove && <button type="button" className="cp-iconbtn" disabled={index === 0} onClick={() => onMove(index - 1)} aria-label="Move up"><Icon name="up" size={16} /></button>}
            {!noMove && <button type="button" className="cp-iconbtn" disabled={index === count - 1} onClick={() => onMove(index + 1)} aria-label="Move down"><Icon name="down" size={16} /></button>}
            <button type="button" className="cp-iconbtn is-danger" onClick={onDelete} aria-label={deleteLabel}><Icon name="trash" size={16} /></button>
        </div>
    );
}

function Avatar({ mediaId, name, big }) {
    const { media } = useCtx();
    const m = media.find((x) => x.id === mediaId);
    return <span className={`cp-avatar ${big ? "is-big" : ""}`}>{m?.url ? <img src={m.url} alt="" /> : initialsOf(name)}</span>;
}

function MediaSlot({ label, mediaId, onPick, onClear }) {
    const { media } = useCtx();
    const item = media.find((m) => m.id === mediaId);
    return (
        <div className="cp-media">
            <span className="cp-media-label">{label}</span>
            <div className="cp-media-box">
                <span className={`cp-thumb ${item ? "has-item" : ""}`}>{item?.url ? <img src={item.url} alt="" /> : <Icon name="image" size={20} />}</span>
                <span className="cp-media-text">
                    <strong>{item ? item.name : "Nothing selected"}</strong>
                    <small>{item ? item.alt || "No alt text yet" : "Choose from the Media Library"}</small>
                </span>
                <button type="button" className="cp-btn-small" onClick={onPick}>{item ? "Change" : "Choose"}</button>
                {item && <button type="button" className="cp-iconbtn" aria-label="Remove image" onClick={onClear}><Icon name="close" size={15} /></button>}
            </div>
        </div>
    );
}

function Chips({ options, value, onChange, counts, label }) {
    return (
        <div className="cp-chips" role="tablist" aria-label={label}>
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
        <label className="cp-search">
            <Icon name="search" size={16} />
            <input type="search" value={value} placeholder={placeholder} aria-label={placeholder} onChange={(e) => onChange(e.target.value)} />
        </label>
    );
}

function PanelHead({ title, text, children }) {
    return (
        <div className="cp-panel-head">
            <div><h2>{title}</h2><p>{text}</p></div>
            {children}
        </div>
    );
}

/* Picks records from another table and stores { id, role } (the join table row). */
function LinkPicker({ title, options, items, onChange, roleLabel = "Role", roleOptions, emptyText }) {
    const [pick, setPick] = useState("");
    const free = options.filter((o) => !items.some((x) => idEq(x.id, o.id)));
    const add = () => {
        if (!pick) return;
        onChange([...items, { id: options.find((o) => idEq(o.id, pick)).id, role: roleOptions ? roleOptions[0].value : "" }]);
        setPick("");
    };
    return (
        <div className="cp-links">
            <div className="cp-links-add">
                <label className="cp-field">
                    <span className="cp-field-top"><span>{title}</span></span>
                    <select className="cp-input" value={pick} onChange={(e) => setPick(e.target.value)} disabled={free.length === 0}>
                        <option value="">{free.length ? "Choose to add…" : "Everything is already added"}</option>
                        {free.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                    </select>
                </label>
                <button type="button" className="cp-btn-small" disabled={!pick} onClick={add}><Icon name="plus" size={15} /> Add</button>
            </div>
            {items.length === 0 && <p className="cp-empty">{emptyText}</p>}
            <ul className="cp-list">
                {items.map((it, k) => {
                    const opt = options.find((o) => idEq(o.id, it.id));
                    return (
                        <li key={it.id} className="cp-linkrow">
                            <strong>{opt?.label || "Missing record"}</strong>
                            {roleOptions ? (
                                <select className="cp-input" aria-label={roleLabel} value={it.role} onChange={(e) => onChange(items.map((x, j) => (j === k ? { ...x, role: e.target.value } : x)))}>
                                    {roleOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                                </select>
                            ) : (
                                <input className="cp-input" aria-label={roleLabel} placeholder={roleLabel} value={it.role} onChange={(e) => onChange(items.map((x, j) => (j === k ? { ...x, role: e.target.value } : x)))} />
                            )}
                            <button type="button" className="cp-iconbtn is-danger" aria-label={`Remove ${opt?.label || "link"}`} onClick={() => onChange(items.filter((_, j) => j !== k))}><Icon name="close" size={15} /></button>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}

/* ------------------------- 1. members: directory ------------------------- */

function DirectoryTab() {
    const { data, edit, errors, askDelete, go, openNew, catName } = useCtx();
    const [q, setQ] = useState("");
    const [cat, setCat] = useState("all");
    const [status, setStatus] = useState("all");
    const [sort, setSort] = useState("name");
    const [shown, setShown] = useState(LIMITS.page);

    const featuredCount = data.members.filter((m) => m.isFeatured).length;
    const list = useMemo(() => {
        const term = q.trim().toLowerCase();
        const out = data.members.filter((m) =>
            (cat === "all" || idEq(m.categoryId, cat)) &&
            (status === "all" || (status === "featured" ? m.isFeatured : status === "draft" ? !m.isPublished : m.status === status)) &&
            (!term || `${m.fullName} ${m.designation} ${m.coeRole} ${m.expertise}`.toLowerCase().includes(term)));
        out.sort((a, b) => (sort === "name" ? a.fullName.localeCompare(b.fullName) : sort === "name-desc" ? b.fullName.localeCompare(a.fullName) : Number(b.membershipStart || 0) - Number(a.membershipStart || 0)));
        return out;
    }, [data.members, q, cat, status, sort]);
    const errorsOf = (id) => Object.keys(errors).filter((k) => k.startsWith(`m.${id}.`)).length;

    const remove = (m) => {
        const supervised = data.students.filter((s) => s.supervisors.some((x) => idEq(x.id, m.id))).length;
        askDelete({
            what: m.fullName || "this member",
            note: supervised ? `They are removed as supervisor from ${supervised} student${supervised === 1 ? "" : "s"}.` : undefined,
            onConfirm: () => edit((d) => {
                d.members = d.members.filter((x) => x.id !== m.id);
                d.students.forEach((s) => { s.supervisors = s.supervisors.filter((x) => !idEq(x.id, m.id)); });
                d.postdocs.forEach((p) => { p.mentors = p.mentors.filter((x) => !idEq(x.id, m.id)); });
            }),
        });
    };

    return (
        <>
            <PanelHead title="Directory" text={`${data.members.length} members. ${featuredCount} of ${LIMITS.featured} featured on the Home page.`}>
                <button type="button" className="cp-btn-small" onClick={openNew}><Icon name="plus" size={15} /> New member</button>
            </PanelHead>
            {errors.featured && <em className="cp-error"><Icon name="alert" size={13} /> {errors.featured}</em>}

            <div className="cp-toolbar">
                <SearchBox value={q} onChange={(v) => { setQ(v); setShown(LIMITS.page); }} placeholder="Search name, designation, expertise" />
                <select className="cp-input" aria-label="Category" value={cat} onChange={(e) => { setCat(e.target.value); setShown(LIMITS.page); }}>
                    <option value="all">All categories</option>
                    {data.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <select className="cp-input" aria-label="Status" value={status} onChange={(e) => { setStatus(e.target.value); setShown(LIMITS.page); }}>
                    <option value="all">Any status</option>
                    <option value="active">Active</option>
                    <option value="former">Former</option>
                    <option value="featured">Featured on Home</option>
                    <option value="draft">Not published</option>
                </select>
                <select className="cp-input" aria-label="Sort" value={sort} onChange={(e) => setSort(e.target.value)}>
                    <option value="name">Name A to Z</option>
                    <option value="name-desc">Name Z to A</option>
                    <option value="newest">Newest members first</option>
                </select>
            </div>

            {list.length === 0 && <p className="cp-empty">No members match these filters.</p>}
            <ul className="cp-table">
                {list.slice(0, shown).map((m) => {
                    const mi = data.members.findIndex((x) => x.id === m.id);
                    const bad = errorsOf(m.id);
                    return (
                        <li key={m.id} className="cp-trow">
                            <button type="button" className="cp-who" onClick={() => go("profiles", m.id)}>
                                <Avatar mediaId={m.photoId} name={m.fullName} />
                                <span><strong>{m.fullName || "Unnamed member"}</strong><small>{m.designation || "No designation"}{m.coeRole ? ` · ${m.coeRole}` : ""}</small></span>
                            </button>
                            <span className="cp-cell"><small>Category</small>{catName(m.categoryId) || "None"}</span>
                            <span className="cp-cell">
                                <span className={`cp-pill ${m.status === "active" ? "is-ok" : "is-off"}`}>{labelOf(MEMBER_STATUS, m.status)}</span>
                                {bad > 0 && <span className="cp-pill is-danger">{bad} to fix</span>}
                            </span>
                            <Switch checked={m.isPublished} label={m.isPublished ? "Published" : "Draft"} onChange={(v) => edit((d) => { d.members[mi].isPublished = v; if (!v) d.members[mi].isFeatured = false; })} />
                            <button
                                type="button"
                                className={`cp-star ${m.isFeatured ? "is-on" : ""}`}
                                aria-pressed={m.isFeatured}
                                aria-label={m.isFeatured ? `Remove ${m.fullName} from Home` : `Feature ${m.fullName} on Home`}
                                title={!m.isPublished ? "Publish the member first" : !m.isFeatured && featuredCount >= LIMITS.featured ? `Limit of ${LIMITS.featured} reached` : "Feature on Home"}
                                disabled={!m.isPublished || (!m.isFeatured && featuredCount >= LIMITS.featured)}
                                onClick={() => edit((d) => { d.members[mi].isFeatured = !d.members[mi].isFeatured; })}
                            ><Icon name="star" size={16} /></button>
                            <div className="cp-mover">
                                <button type="button" className="cp-btn-small" onClick={() => go("profiles", m.id)}><Icon name="edit" size={14} /> Edit</button>
                                <button type="button" className="cp-iconbtn is-danger" aria-label={`Delete ${m.fullName}`} onClick={() => remove(m)}><Icon name="trash" size={16} /></button>
                            </div>
                        </li>
                    );
                })}
            </ul>
            {list.length > shown && <button type="button" className="cp-btn-outline cp-more" onClick={() => setShown((n) => n + LIMITS.page)}>Show more ({list.length - shown} left)</button>}
        </>
    );
}

function CategoriesTab() {
    const { data, edit, askDelete } = useCtx();
    const { errors } = useCtx();
    const countOf = (id) => data.members.filter((m) => idEq(m.categoryId, id)).length;
    return (
        <>
            <PanelHead title="Member categories" text="The groups visitors see on the People page. A category with members cannot be deleted; move the members first.">
                <button type="button" className="cp-btn-small" onClick={() => edit((d) => { d.categories.push({ id: uid(), name: "", slug: "" }); })}><Icon name="plus" size={15} /> Add category</button>
            </PanelHead>
            {data.categories.length === 0 && <p className="cp-empty">No categories yet. Add one before creating members.</p>}
            <ol className="cp-list">
                {data.categories.map((c, i) => {
                    const n = countOf(c.id);
                    return (
                        <li key={c.id} className="cp-row">
                            <span className="cp-no">{i + 1}</span>
                            <div className="cp-row-main">
                                <Field label={`Category ${i + 1}`} errorKey={`c.${c.id}.name`} value={c.name} hint={`${n} member${n === 1 ? "" : "s"} · /${c.slug || "…"}`}
                                    onChange={(v) => edit((d) => { const x = d.categories[i]; if (!x.slug || x.slug === slugify(x.name)) x.slug = slugify(v); x.name = v; })} />
                            </div>
                            <div className="cp-mover">
                                <button type="button" className="cp-iconbtn" disabled={i === 0} onClick={() => edit((d) => move(d.categories, i, i - 1))} aria-label="Move up"><Icon name="up" size={16} /></button>
                                <button type="button" className="cp-iconbtn" disabled={i === data.categories.length - 1} onClick={() => edit((d) => move(d.categories, i, i + 1))} aria-label="Move down"><Icon name="down" size={16} /></button>
                                <button type="button" className="cp-iconbtn is-danger" disabled={n > 0} title={n > 0 ? "Move its members first" : undefined} aria-label={`Delete ${c.name || "category"}`}
                                    onClick={() => askDelete({ what: c.name || "this category", onConfirm: () => edit((d) => { d.categories.splice(i, 1); }) })}><Icon name="trash" size={16} /></button>
                            </div>
                        </li>
                    );
                })}
            </ol>
        </>
    );
}

/* ------------------------- 2. member profile (13) ------------------------- */

function ProfileView({ memberId, section, setSection }) {
    const { data, errors, go, catalog, openNew } = useCtx();
    const i = data.members.findIndex((m) => idEq(m.id, memberId));
    const m = data.members[i];

    if (!m) {
        return (
            <div className="cp-panel">
                <PanelHead title="Choose a member" text="Pick a member to edit their 13 profile sections.">
                    <button type="button" className="cp-btn-small" onClick={openNew}><Icon name="plus" size={15} /> New member</button>
                </PanelHead>
                {data.members.length === 0 && <p className="cp-empty">No members yet.</p>}
                <ul className="cp-table">
                    {data.members.map((x) => (
                        <li key={x.id} className="cp-trow is-simple">
                            <button type="button" className="cp-who" onClick={() => go("profiles", x.id)}>
                                <Avatar mediaId={x.photoId} name={x.fullName} />
                                <span><strong>{x.fullName || "Unnamed member"}</strong><small>{x.designation || "No designation"}</small></span>
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
        );
    }

    const errCount = (s) => Object.keys(errors).filter((k) => {
        const p = k.split(".");
        return p[0] === "m" && idEq(p[1], m.id) && (SECTION_OF_FIELD[p[2]] ?? 0) === s;
    }).length;

    return (
        <div className="cp-layout">
            <nav className="cp-rail" aria-label="Profile sections">
                <div className="cp-rail-who">
                    <Avatar mediaId={m.photoId} name={m.fullName} big />
                    <strong>{m.fullName || "Unnamed member"}</strong>
                    <span className={`cp-pill ${m.isPublished ? "is-ok" : "is-off"}`}>{m.isPublished ? "Published" : "Draft"}</span>
                </div>
                <ol>
                    {PROFILE_SECTIONS.map((s, k) => (
                        <li key={s.label}>
                            <button type="button" className={`cp-rail-item ${section === k ? "is-active" : ""}`} aria-current={section === k ? "true" : undefined} onClick={() => setSection(k)}>
                                <span className="cp-rail-no">{k + 1}</span>
                                <span className="cp-rail-text"><strong>{s.label}</strong><small>{s.hint}</small></span>
                                {errCount(k) > 0 && <span className="cp-badge-error">{errCount(k)}</span>}
                            </button>
                        </li>
                    ))}
                </ol>
            </nav>
            <div className="cp-panel" key={`${m.id}-${section}`}>
                <ProfileSection index={section} m={m} i={i} catalog={catalog} />
            </div>
        </div>
    );
}

function ProfileSection({ index, m, i, catalog }) {
    const { data, edit, pickMedia, go, catName } = useCtx();
    const upd = (patch) => edit((d) => { Object.assign(d.members[i], patch); });
    const setLinks = (key, items) => edit((d) => { d.members[i].links[key] = items; });
    const head = PROFILE_SECTIONS[index];
    const title = (
        <PanelHead title={`${index + 1}. ${head.label}`} text={
            ["The basics shown at the top of the profile and in the directory.", "A short biography in the member's own voice or in the third person.", "One qualification per line, newest first.",
                "Expertise and research interests. Separate items with commas or new lines.", "Where visitors can reach the member and find their academic profiles.", "Memberships of professional bodies, committees and appointments.",
                "Students and postdoctoral researchers linked to this member. Edit them on the student and postdoc cards.", "Research groups the member belongs to.", "Projects the member works on.", "Grants the member leads or takes part in.",
                "Patents, prototypes and other innovations the member contributed to.", "Organisations and agreements the member represents.", "Shown from the Publications, Citations and Awards modules. Nothing here is edited on this page."][index]
        } />
    );

    if (index === 0) {
        const featuredCount = data.members.filter((x) => x.isFeatured).length;
        return (
            <>
                {title}
                <div className="cp-grid-2">
                    <Field label="Full name" errorKey={`m.${m.id}.fullName`} value={m.fullName} onChange={(v) => upd({ fullName: v, slug: !m.slug || m.slug === slugify(m.fullName) ? slugify(v) : m.slug })} />
                    <Field label="Web address (slug)" errorKey={`m.${m.id}.slug`} value={m.slug} hint={`/people/${m.slug || "…"}`} onChange={(v) => upd({ slug: slugify(v) })} />
                </div>
                <div className="cp-grid-2">
                    <Select label="Category" value={m.categoryId} errorKey={`m.${m.id}.categoryId`} empty="Choose a category" options={data.categories.map((c) => ({ value: c.id, label: c.name }))} onChange={(v) => upd({ categoryId: v ? Number(v) || v : null })} />
                    <Select label="Status" value={m.status} options={MEMBER_STATUS} onChange={(v) => upd({ status: v })} />
                </div>
                <div className="cp-grid-2">
                    <Field label="Designation" errorKey={`m.${m.id}.designation`} value={m.designation} hint="For example Professor or Senior Lecturer" onChange={(v) => upd({ designation: v })} />
                    <Field label="Role in the centre" value={m.coeRole} hint="For example Director or Group leader" onChange={(v) => upd({ coeRole: v })} />
                </div>
                <div className="cp-grid-2">
                    <Field label="Member since (year)" type="number" min={YEAR_MIN} maxValue={YEAR_MAX} value={m.membershipStart} onChange={(v) => upd({ membershipStart: toYear(v) })} />
                    <Field label="Member until (year)" type="number" min={YEAR_MIN} maxValue={YEAR_MAX} errorKey={`m.${m.id}.years`} value={m.membershipEnd} hint="Leave empty if still a member" onChange={(v) => upd({ membershipEnd: toYear(v) })} />
                </div>
                <MediaSlot label="Photo" mediaId={m.photoId} onPick={() => pickMedia({ type: "image", onSelect: (x) => upd({ photoId: x.id }) })} onClear={() => upd({ photoId: null })} />
                <div className="cp-block cp-switches">
                    <Switch checked={m.isPublished} label={m.isPublished ? "Published on the website" : "Draft, not on the website"} onChange={(v) => upd({ isPublished: v, isFeatured: v ? m.isFeatured : false })} />
                    <Switch checked={m.isFeatured} disabled={!m.isPublished || (!m.isFeatured && featuredCount >= LIMITS.featured)} label={`Featured on the Home page (${featuredCount} of ${LIMITS.featured})`} onChange={(v) => upd({ isFeatured: v })} />
                    {m.isPublished === false && <small>Publish the member before featuring them on Home.</small>}
                </div>
            </>
        );
    }
    if (index === 1) return <>{title}<Field label="Biography" textarea rows={10} value={m.biography} onChange={(v) => upd({ biography: v })} /></>;
    if (index === 2) return <>{title}<Field label="Qualifications" textarea rows={6} value={m.qualifications} hint="One per line" onChange={(v) => upd({ qualifications: v })} /></>;
    if (index === 3) return (
        <>
            {title}
            <Field label="Expertise" textarea rows={3} value={m.expertise} onChange={(v) => upd({ expertise: v })} />
            <Field label="Research interests" textarea rows={3} value={m.researchInterests} onChange={(v) => upd({ researchInterests: v })} />
            {splitList(`${m.expertise},${m.researchInterests}`).length > 0 && <div className="cp-tags">{splitList(`${m.expertise},${m.researchInterests}`).map((t) => <span key={t} className="cp-tag">{t}</span>)}</div>}
        </>
    );
    if (index === 4) return (
        <>
            {title}
            <div className="cp-stack">
                <Field label="Email" type="email" errorKey={`m.${m.id}.email`} value={m.email} onChange={(v) => upd({ email: v })} />
                <Field label="Scopus profile" placeholder="https://" errorKey={`m.${m.id}.scopusUrl`} value={m.scopusUrl} onChange={(v) => upd({ scopusUrl: v })} />
                <Field label="Google Scholar profile" placeholder="https://" errorKey={`m.${m.id}.scholarUrl`} value={m.scholarUrl} onChange={(v) => upd({ scholarUrl: v })} />
                <Field label="ORCID" placeholder="https://orcid.org/" errorKey={`m.${m.id}.orcidUrl`} value={m.orcidUrl} onChange={(v) => upd({ orcidUrl: v })} />
            </div>
        </>
    );
    if (index === 5) {
        return (
            <>
                {title}
                <div className="cp-block-head">
                    <small>{m.roles.length} role{m.roles.length === 1 ? "" : "s"}</small>
                    <button type="button" className="cp-btn-small" onClick={() => edit((d) => { d.members[i].roles.push({ id: uid(), orgName: "", roleTitle: "", roleType: "committee", startYear: "", endYear: "" }); })}><Icon name="plus" size={15} /> Add role</button>
                </div>
                {m.roles.length === 0 && <p className="cp-empty">No roles yet.</p>}
                <ol className="cp-list">
                    {m.roles.map((r, k) => (
                        <li key={r.id} className="cp-card">
                            <div className="cp-card-top">
                                <span className="cp-no">{k + 1}</span>
                                <strong>{r.roleTitle || "New role"}{r.orgName ? ` · ${r.orgName}` : ""}</strong>
                                <Mover index={k} count={m.roles.length} deleteLabel={`Delete ${r.roleTitle || "role"}`}
                                    onMove={(to) => edit((d) => move(d.members[i].roles, k, to))}
                                    onDelete={() => edit((d) => { d.members[i].roles.splice(k, 1); })} />
                            </div>
                            <div className="cp-grid-2">
                                <Field label="Organisation" errorKey={`m.${m.id}.role.${r.id}.org`} value={r.orgName} onChange={(v) => edit((d) => { d.members[i].roles[k].orgName = v; })} />
                                <Field label="Role or title" errorKey={`m.${m.id}.role.${r.id}.title`} value={r.roleTitle} onChange={(v) => edit((d) => { d.members[i].roles[k].roleTitle = v; })} />
                            </div>
                            <div className="cp-grid-3">
                                <Select label="Type" value={r.roleType} options={ROLE_TYPES} onChange={(v) => edit((d) => { d.members[i].roles[k].roleType = v; })} />
                                <Field label="From (year)" type="number" min={YEAR_MIN} maxValue={YEAR_MAX} value={r.startYear} onChange={(v) => edit((d) => { d.members[i].roles[k].startYear = toYear(v); })} />
                                <Field label="Until (year)" type="number" min={YEAR_MIN} maxValue={YEAR_MAX} errorKey={`m.${m.id}.role.${r.id}.end`} value={r.endYear} onChange={(v) => edit((d) => { d.members[i].roles[k].endYear = toYear(v); })} />
                            </div>
                        </li>
                    ))}
                </ol>
            </>
        );
    }
    if (index === 6) {
        const students = data.students.filter((s) => s.supervisors.some((x) => idEq(x.id, m.id)));
        const postdocs = data.postdocs.filter((p) => p.mentors.some((x) => idEq(x.id, m.id)));
        return (
            <>
                {title}
                <div className="cp-block-head"><h3>Postgraduate students</h3><button type="button" className="cp-btn-small" onClick={() => go("postgraduate")}>Open students</button></div>
                {students.length === 0 && <p className="cp-empty">No students linked to this member.</p>}
                <ul className="cp-list">{students.map((s) => <li key={s.id} className="cp-readrow"><strong>{s.fullName}</strong><span>{s.level} · {labelOf(STUDENT_STATUS, s.status)}</span><em className="cp-pill">{labelOf(SUPERVISION_ROLES, s.supervisors.find((x) => idEq(x.id, m.id)).role)}</em></li>)}</ul>
                <div className="cp-block-head"><h3>Postdoctoral researchers</h3><button type="button" className="cp-btn-small" onClick={() => go("postdoctoral")}>Open postdocs</button></div>
                {postdocs.length === 0 && <p className="cp-empty">No postdoctoral researchers linked to this member.</p>}
                <ul className="cp-list">{postdocs.map((p) => <li key={p.id} className="cp-readrow"><strong>{p.fullName}</strong><span>{labelOf(POSTDOC_STATUS, p.status)}</span><em className="cp-pill">{p.mentors.find((x) => idEq(x.id, m.id)).role || "Mentor"}</em></li>)}</ul>
            </>
        );
    }
    const linkSections = {
        7: { key: "groups", options: catalog.groups, title: "Add a research group", role: "Role in the group", empty: "Not in any research group." },
        8: { key: "projects", options: catalog.projects, title: "Add a project", role: "Role in the project", empty: "No projects linked." },
        9: { key: "grants", options: catalog.grants, title: "Add a grant", role: "Role in the grant", empty: "No grants linked." },
        10: { key: "innovations", options: catalog.innovations, title: "Add an innovation", role: "Contribution", empty: "No innovations linked." },
        11: { key: "linkages", options: catalog.linkages, title: "Add a linkage", role: "Role in the linkage", empty: "No linkages linked." },
    }[index];
    if (linkSections) {
        return (
            <>
                {title}
                <LinkPicker title={linkSections.title} roleLabel={linkSections.role} emptyText={linkSections.empty}
                    options={linkSections.options.map((o) => ({ id: o.id, label: o.name }))} items={m.links[linkSections.key]} onChange={(items) => setLinks(linkSections.key, items)} />
            </>
        );
    }
    const pubs = catalog.publications.filter((p) => p.authorIds.some((a) => idEq(a, m.id)));
    const cites = catalog.citations.filter((c) => idEq(c.memberId, m.id));
    const awards = catalog.awards.filter((a) => idEq(a.memberId, m.id));
    return (
        <>
            {title}
            <p className="cp-note"><Icon name="lock" size={16} /><span>Read only. Link authors in <b>Publications and Impact → Author-to-member linking</b>, citations in <b>Citations and research impact</b>, and awards in <b>About → Awards and Recognition</b>.</span></p>
            <div className="cp-block-head"><h3>Publications ({pubs.length})</h3></div>
            {pubs.length === 0 && <p className="cp-empty">No publications linked.</p>}
            <ul className="cp-list">{pubs.map((p) => <li key={p.id} className="cp-readrow"><strong>{p.title}</strong><span>{p.year}</span></li>)}</ul>
            <div className="cp-block-head"><h3>Citation profiles</h3></div>
            {cites.length === 0 && <p className="cp-empty">No citation profile yet.</p>}
            <ul className="cp-list">{cites.map((c) => <li key={c.source} className="cp-readrow"><strong>{c.source}</strong><span>{c.total} citations · h-index {c.h} · i10 {c.i10}</span></li>)}</ul>
            <div className="cp-block-head"><h3>Awards ({awards.length})</h3></div>
            {awards.length === 0 && <p className="cp-empty">No member awards yet.</p>}
            <ul className="cp-list">{awards.map((a) => <li key={a.id} className="cp-readrow"><strong>{a.title}</strong><span>{a.year}</span></li>)}</ul>
        </>
    );
}

/* ------------------------ 3. postdoctoral researchers ------------------------ */

function PostdocView() {
    const { data, edit, errors, askDelete, pickMedia } = useCtx();
    const [q, setQ] = useState("");
    const [status, setStatus] = useState("all");
    const [openId, setOpenId] = useState(null);
    const counts = { all: data.postdocs.length, current: data.postdocs.filter((p) => p.status === "current").length, former: data.postdocs.filter((p) => p.status === "former").length };
    const term = q.trim().toLowerCase();
    const shown = data.postdocs.map((p, i) => ({ p, i })).filter(({ p }) => (status === "all" || p.status === status) && (!term || `${p.fullName} ${p.researchTopic}`.toLowerCase().includes(term)));
    const mentorOptions = data.members.map((m) => ({ id: m.id, label: m.fullName || "Unnamed member" }));

    return (
        <div className="cp-panel">
            <PanelHead title="Postdoctoral researchers" text="Shown on the People page under Postdoctoral researchers. Mentors are chosen from the member directory.">
                <button type="button" className="cp-btn-small" onClick={() => { const id = uid(); edit((d) => { d.postdocs.push({ id, photoId: null, fullName: "", researchTopic: "", appointmentStart: "", appointmentEnd: "", status: "current", isPublished: false, mentors: [] }); }); setOpenId(id); }}><Icon name="plus" size={15} /> Add researcher</button>
            </PanelHead>
            <div className="cp-toolbar is-two"><SearchBox value={q} onChange={setQ} placeholder="Search name or topic" /></div>
            <Chips label="Filter by status" value={status} onChange={setStatus} counts={counts} options={[{ value: "all", label: "All" }, ...POSTDOC_STATUS]} />
            {shown.length === 0 && <p className="cp-empty">No postdoctoral researchers to show.</p>}
            <ol className="cp-list">
                {shown.map(({ p, i }) => {
                    const open = openId === p.id;
                    const bad = Object.keys(errors).filter((k) => k.startsWith(`p.${p.id}.`)).length;
                    return (
                        <li key={p.id} className="cp-card">
                            <div className="cp-card-top">
                                <button type="button" className="cp-toggle" aria-expanded={open} onClick={() => setOpenId(open ? null : p.id)}>
                                    <Avatar mediaId={p.photoId} name={p.fullName} />
                                    <span className="cp-toggle-text"><strong>{p.fullName || "New researcher"}</strong><small>{p.researchTopic || "No topic yet"}</small></span>
                                    <Icon name={open ? "up" : "down"} size={17} />
                                </button>
                                {bad > 0 && <span className="cp-badge-error">{bad}</span>}
                                <span className={`cp-pill ${p.status === "current" ? "is-ok" : "is-off"}`}>{labelOf(POSTDOC_STATUS, p.status)}</span>
                                <span className={`cp-pill ${p.isPublished ? "is-ok" : "is-warn"}`}>{p.isPublished ? "Published" : "Draft"}</span>
                                <Mover noMove deleteLabel={`Delete ${p.fullName || "researcher"}`} onDelete={() => askDelete({ what: p.fullName || "this researcher", onConfirm: () => edit((d) => { d.postdocs.splice(i, 1); }) })} />
                            </div>
                            {open && (
                                <div className="cp-card-body">
                                    <div className="cp-grid-2">
                                        <Field label="Full name" errorKey={`p.${p.id}.fullName`} value={p.fullName} onChange={(v) => edit((d) => { d.postdocs[i].fullName = v; })} />
                                        <Select label="Status" value={p.status} options={POSTDOC_STATUS} onChange={(v) => edit((d) => { d.postdocs[i].status = v; })} />
                                    </div>
                                    <Field label="Research topic" textarea rows={2} errorKey={`p.${p.id}.topic`} value={p.researchTopic} onChange={(v) => edit((d) => { d.postdocs[i].researchTopic = v; })} />
                                    <div className="cp-grid-2">
                                        <Field label="Appointment starts" type="date" value={p.appointmentStart} onChange={(v) => edit((d) => { d.postdocs[i].appointmentStart = v; })} />
                                        <Field label="Appointment ends" type="date" errorKey={`p.${p.id}.end`} value={p.appointmentEnd} onChange={(v) => edit((d) => { d.postdocs[i].appointmentEnd = v; })} hint="Leave empty if ongoing" />
                                    </div>
                                    <MediaSlot label="Photo" mediaId={p.photoId} onPick={() => pickMedia({ type: "image", onSelect: (x) => edit((d) => { d.postdocs[i].photoId = x.id; }) })} onClear={() => edit((d) => { d.postdocs[i].photoId = null; })} />
                                    <LinkPicker title="Mentors" roleLabel="Mentor role" emptyText="No mentor linked yet." options={mentorOptions} items={p.mentors} onChange={(items) => edit((d) => { d.postdocs[i].mentors = items; })} />
                                    <Switch checked={p.isPublished} label={p.isPublished ? "Published on the website" : "Draft, not on the website"} onChange={(v) => edit((d) => { d.postdocs[i].isPublished = v; })} />
                                </div>
                            )}
                        </li>
                    );
                })}
            </ol>
        </div>
    );
}

/* ------------------------ 4. postgraduate students ------------------------ */

function StudentView() {
    const { data, edit, errors, askDelete, pickMedia } = useCtx();
    const [q, setQ] = useState("");
    const [status, setStatus] = useState("all");
    const [level, setLevel] = useState("all");
    const [openId, setOpenId] = useState(null);
    const counts = { all: data.students.length, current: data.students.filter((s) => s.status === "current").length, graduated: data.students.filter((s) => s.status === "graduated").length };
    const term = q.trim().toLowerCase();
    const shown = data.students.map((s, i) => ({ s, i })).filter(({ s }) => (status === "all" || s.status === status) && (level === "all" || s.level === level) && (!term || `${s.fullName} ${s.researchTitle}`.toLowerCase().includes(term)));
    const memberOptions = data.members.map((m) => ({ id: m.id, label: m.fullName || "Unnamed member" }));

    return (
        <div className="cp-panel">
            <PanelHead title="Postgraduate students and supervision" text="Students are listed as current or as alumni once they graduate. Every published student needs a main supervisor.">
                <button type="button" className="cp-btn-small" onClick={() => { const id = uid(); edit((d) => { d.students.push({ id, photoId: null, fullName: "", level: "PhD", researchTitle: "", studyStart: "", studyEnd: "", status: "current", alumniPosition: "", isPublished: false, supervisors: [] }); }); setOpenId(id); }}><Icon name="plus" size={15} /> Add student</button>
            </PanelHead>
            <div className="cp-toolbar is-two">
                <SearchBox value={q} onChange={setQ} placeholder="Search name or research title" />
                <select className="cp-input" aria-label="Level" value={level} onChange={(e) => setLevel(e.target.value)}>
                    <option value="all">All levels</option>
                    {LEVELS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
                </select>
            </div>
            <Chips label="Filter by status" value={status} onChange={setStatus} counts={counts} options={[{ value: "all", label: "All" }, ...STUDENT_STATUS]} />
            {shown.length === 0 && <p className="cp-empty">No students to show.</p>}
            <ol className="cp-list">
                {shown.map(({ s, i }) => {
                    const open = openId === s.id;
                    const bad = Object.keys(errors).filter((k) => k.startsWith(`s.${s.id}.`)).length;
                    const main = s.supervisors.find((x) => x.role === "main");
                    const mainName = memberOptions.find((o) => idEq(o.id, main?.id))?.label;
                    return (
                        <li key={s.id} className="cp-card">
                            <div className="cp-card-top">
                                <button type="button" className="cp-toggle" aria-expanded={open} onClick={() => setOpenId(open ? null : s.id)}>
                                    <Avatar mediaId={s.photoId} name={s.fullName} />
                                    <span className="cp-toggle-text"><strong>{s.fullName || "New student"}</strong><small>{s.level} · {mainName ? `Main supervisor: ${mainName}` : "No main supervisor"}</small></span>
                                    <Icon name={open ? "up" : "down"} size={17} />
                                </button>
                                {bad > 0 && <span className="cp-badge-error">{bad}</span>}
                                <span className={`cp-pill ${s.status === "current" ? "is-ok" : "is-info"}`}>{labelOf(STUDENT_STATUS, s.status)}</span>
                                <span className={`cp-pill ${s.isPublished ? "is-ok" : "is-warn"}`}>{s.isPublished ? "Published" : "Draft"}</span>
                                <Mover noMove deleteLabel={`Delete ${s.fullName || "student"}`} onDelete={() => askDelete({ what: s.fullName || "this student", onConfirm: () => edit((d) => { d.students.splice(i, 1); }) })} />
                            </div>
                            {open && (
                                <div className="cp-card-body">
                                    <div className="cp-grid-3 is-even">
                                        <Field label="Full name" errorKey={`s.${s.id}.fullName`} value={s.fullName} onChange={(v) => edit((d) => { d.students[i].fullName = v; })} />
                                        <Select label="Level" value={s.level} options={LEVELS} onChange={(v) => edit((d) => { d.students[i].level = v; })} />
                                        <Select label="Status" value={s.status} options={STUDENT_STATUS} onChange={(v) => edit((d) => { d.students[i].status = v; })} />
                                    </div>
                                    <Field label="Research title" textarea rows={2} errorKey={`s.${s.id}.title`} value={s.researchTitle} onChange={(v) => edit((d) => { d.students[i].researchTitle = v; })} />
                                    <div className="cp-grid-2">
                                        <Field label="Study starts" type="date" value={s.studyStart} onChange={(v) => edit((d) => { d.students[i].studyStart = v; })} />
                                        <Field label="Study ends" type="date" errorKey={`s.${s.id}.end`} value={s.studyEnd} onChange={(v) => edit((d) => { d.students[i].studyEnd = v; })} hint="Leave empty if ongoing" />
                                    </div>
                                    {s.status === "graduated" && <Field label="Position after graduating (alumni)" value={s.alumniPosition} hint="Shown on the alumni list" onChange={(v) => edit((d) => { d.students[i].alumniPosition = v; })} />}
                                    <MediaSlot label="Photo" mediaId={s.photoId} onPick={() => pickMedia({ type: "image", onSelect: (x) => edit((d) => { d.students[i].photoId = x.id; }) })} onClear={() => edit((d) => { d.students[i].photoId = null; })} />
                                    <div className={`cp-field ${errors[`s.${s.id}.supervisors`] ? "has-error" : ""}`}>
                                        <LinkPicker title="Supervisors" roleLabel="Supervision role" roleOptions={SUPERVISION_ROLES} emptyText="No supervisor linked yet." options={memberOptions} items={s.supervisors} onChange={(items) => edit((d) => { d.students[i].supervisors = items; })} />
                                        {errors[`s.${s.id}.supervisors`] && <em className="cp-error"><Icon name="alert" size={13} /> {errors[`s.${s.id}.supervisors`]}</em>}
                                    </div>
                                    <Switch checked={s.isPublished} label={s.isPublished ? "Published on the website" : "Draft, not on the website"} onChange={(v) => edit((d) => { d.students[i].isPublished = v; })} />
                                </div>
                            )}
                        </li>
                    );
                })}
            </ol>
        </div>
    );
}

/* --------------------------- history, picker, dialogs --------------------------- */

const ACTION_TONE = { CREATE: "is-new", UPDATE: "is-info", PUBLISH: "is-ok", UNPUBLISH: "is-warn", DELETE: "is-danger", RESTORE: "is-ok" };

function HistoryPanel({ history }) {
    return (
        <div className="cp-panel cp-narrow">
            <PanelHead title="History" text="Every change in People, from the audit log." />
            {history.length === 0 && <p className="cp-empty">Nothing recorded yet.</p>}
            <ol className="cp-history">
                {history.map((h) => (
                    <li key={h.id}>
                        <span className={`cp-pill ${ACTION_TONE[h.action] || "is-info"}`}>{h.action}</span>
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
        <div className="cp-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
            <div className="cp-dialog" role="dialog" aria-modal="true" aria-labelledby={titleId}>
                <div className="cp-dialog-head">
                    <h2 id={titleId}>Media Library</h2>
                    <button type="button" className="cp-iconbtn" aria-label="Close" onClick={onClose}><Icon name="close" size={16} /></button>
                </div>
                <div className="cp-media-grid">
                    {list.map((m) => (
                        <button key={m.id} type="button" className="cp-media-item" onClick={() => { state.onSelect(m); onClose(); }}>
                            <span className="cp-media-preview">{m.url ? <img src={m.url} alt="" /> : <Icon name="image" size={26} />}</span>
                            <strong>{m.name}</strong>
                            <small>{m.size}</small>
                        </button>
                    ))}
                    {list.length === 0 && <p className="cp-empty">The library has no images yet.</p>}
                </div>
                <div className="cp-dialog-actions">
                    <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => { if (e.target.files[0]) onUpload(e.target.files[0]); e.target.value = ""; }} />
                    <button type="button" className="cp-btn-outline" onClick={() => fileRef.current?.click()}><Icon name="upload" size={15} /> Upload new</button>
                    <button type="button" className="cp-btn-dark" onClick={onClose}>Done</button>
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

function PreviewModal({ data, media, catalog, view, memberId, onClose, previewUrl }) {
    const [device, setDevice] = useState("desktop");
    const imageOf = (id) => media.find((m) => m.id === id)?.url || null;
    const nameOf = (id) => data.members.find((m) => idEq(m.id, id))?.fullName || "";
    const width = DEVICES.find((d) => d.key === device).width;
    const Face = ({ id, name }) => { const src = imageOf(id); return <span className="cpv-face">{src ? <img src={src} alt="" /> : initialsOf(name)}</span>; };

    useEffect(() => {
        const onKey = (e) => e.key === "Escape" && onClose();
        document.addEventListener("keydown", onKey);
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
    }, [onClose]);

    const member = view === "profiles" ? data.members.find((m) => idEq(m.id, memberId)) : null;
    const pubMembers = data.members.filter((m) => m.isPublished);
    const hiddenCount = (view === "members" ? data.members.length - pubMembers.length : view === "postdoctoral" ? data.postdocs.filter((p) => !p.isPublished).length : view === "postgraduate" ? data.students.filter((s) => !s.isPublished).length : 0);

    const byIds = (links, list) => links.map((l) => ({ ...(list.find((x) => idEq(x.id, l.id)) || {}), role: l.role })).filter((x) => x.name);
    const heading = view === "profiles" ? "Member profile" : VIEWS.find((v) => v.key === view).title;

    let body = null;
    if (view === "members") {
        const feat = pubMembers.filter((m) => m.isFeatured);
        body = (
            <section className="cpv-sec">
                <div className="cpv-wrap">
                    <h2>Our people</h2>
                    {feat.length > 0 && <p className="cpv-sub">Featured on the Home page: {feat.map((m) => m.fullName).join(", ")}</p>}
                    {data.categories.map((c) => {
                        const list = pubMembers.filter((m) => idEq(m.categoryId, c.id) && m.status === "active");
                        const former = pubMembers.filter((m) => idEq(m.categoryId, c.id) && m.status === "former");
                        if (!list.length && !former.length) return null;
                        return (
                            <div key={c.id} className="cpv-group">
                                <h3>{c.name}</h3>
                                <ul className="cpv-grid">
                                    {[...list, ...former].map((m) => (
                                        <li key={m.id} className={`cpv-card ${m.status === "former" ? "is-former" : ""}`}>
                                            <Face id={m.photoId} name={m.fullName} />
                                            <b>{m.fullName}</b>
                                            <span>{m.designation}</span>
                                            {m.coeRole && <small>{m.coeRole}</small>}
                                            {m.status === "former" && <em>Former member{m.membershipEnd ? `, until ${m.membershipEnd}` : ""}</em>}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        );
                    })}
                </div>
            </section>
        );
    } else if (view === "profiles" && member) {
        const groups = byIds(member.links.groups, catalog.groups);
        const projects = byIds(member.links.projects, catalog.projects);
        const grants = byIds(member.links.grants, catalog.grants);
        const innovations = byIds(member.links.innovations, catalog.innovations);
        const linkages = byIds(member.links.linkages, catalog.linkages);
        const students = data.students.filter((s) => s.isPublished && s.supervisors.some((x) => idEq(x.id, member.id)));
        const pubs = catalog.publications.filter((p) => p.authorIds.some((a) => idEq(a, member.id)));
        const cites = catalog.citations.filter((c) => idEq(c.memberId, member.id));
        const awards = catalog.awards.filter((a) => idEq(a.memberId, member.id));
        const Block = ({ title, items, render }) => (items.length ? <div className="cpv-block"><h3>{title}</h3><ul>{items.map(render)}</ul></div> : null);
        body = (
            <section className="cpv-sec">
                <div className="cpv-wrap cpv-profile">
                    <aside>
                        <Face id={member.photoId} name={member.fullName} />
                        <h2>{member.fullName || "Unnamed member"}</h2>
                        <p>{member.designation}</p>
                        {member.coeRole && <small>{member.coeRole}</small>}
                        <ul className="cpv-contact">
                            {member.email && <li>{member.email}</li>}
                            {member.scopusUrl && <li>Scopus</li>}{member.scholarUrl && <li>Google Scholar</li>}{member.orcidUrl && <li>ORCID</li>}
                        </ul>
                        {cites[0] && <div className="cpv-stats"><div><b>{cites[0].total}</b><small>Citations</small></div><div><b>{cites[0].h}</b><small>h-index</small></div><div><b>{cites[0].i10}</b><small>i10</small></div></div>}
                    </aside>
                    <div>
                        {member.biography && <div className="cpv-block"><h3>Biography</h3><p>{member.biography}</p></div>}
                        <Block title="Qualifications" items={splitList(member.qualifications.replace(/,/g, "\n")).length ? member.qualifications.split("\n").filter((x) => x.trim()) : []} render={(x) => <li key={x}>{x}</li>} />
                        {splitList(`${member.expertise},${member.researchInterests}`).length > 0 && <div className="cpv-block"><h3>Expertise and interests</h3><div className="cp-tags">{splitList(`${member.expertise},${member.researchInterests}`).map((t) => <span key={t} className="cp-tag">{t}</span>)}</div></div>}
                        <Block title="Professional roles" items={member.roles} render={(r) => <li key={r.id}><b>{r.roleTitle}</b>, {r.orgName}{r.startYear ? ` (${r.startYear}${r.endYear ? ` to ${r.endYear}` : " to present"})` : ""}</li>} />
                        <Block title="Research groups" items={groups} render={(g) => <li key={g.id}><b>{g.name}</b>{g.role ? ` · ${g.role}` : ""}</li>} />
                        <Block title="Research projects" items={projects} render={(g) => <li key={g.id}><b>{g.name}</b>{g.role ? ` · ${g.role}` : ""}</li>} />
                        <Block title="Research grants" items={grants} render={(g) => <li key={g.id}><b>{g.name}</b>{g.role ? ` · ${g.role}` : ""}</li>} />
                        <Block title="Innovation and IP" items={innovations} render={(g) => <li key={g.id}><b>{g.name}</b>{g.role ? ` · ${g.role}` : ""}</li>} />
                        <Block title="Linkages" items={linkages} render={(g) => <li key={g.id}><b>{g.name}</b>{g.role ? ` · ${g.role}` : ""}</li>} />
                        <Block title="Supervised students" items={students} render={(s) => <li key={s.id}><b>{s.fullName}</b> · {s.level}, {labelOf(STUDENT_STATUS, s.status)}</li>} />
                        <Block title="Publications" items={pubs} render={(p) => <li key={p.id}>{p.title} ({p.year})</li>} />
                        <Block title="Awards" items={awards} render={(a) => <li key={a.id}>{a.title} ({a.year})</li>} />
                    </div>
                </div>
            </section>
        );
    } else if (view === "postdoctoral") {
        const list = data.postdocs.filter((p) => p.isPublished);
        const group = (status, title) => {
            const items = list.filter((p) => p.status === status);
            if (!items.length) return null;
            return (
                <div className="cpv-group">
                    <h3>{title}</h3>
                    <ul className="cpv-grid">
                        {items.map((p) => (
                            <li key={p.id} className="cpv-card">
                                <Face id={p.photoId} name={p.fullName} />
                                <b>{p.fullName}</b>
                                <span>{p.researchTopic}</span>
                                {p.mentors.length > 0 && <small>Mentor: {p.mentors.map((x) => nameOf(x.id)).filter(Boolean).join(", ")}</small>}
                                {(p.appointmentStart || p.appointmentEnd) && <em>{formatDate(p.appointmentStart)}{p.appointmentEnd ? ` to ${formatDate(p.appointmentEnd)}` : " to present"}</em>}
                            </li>
                        ))}
                    </ul>
                </div>
            );
        };
        body = <section className="cpv-sec"><div className="cpv-wrap"><h2>Postdoctoral researchers</h2>{group("current", "Current")}{group("former", "Former")}{list.length === 0 && <p className="cpv-sub">No published researchers yet.</p>}</div></section>;
    } else if (view === "postgraduate") {
        const list = data.students.filter((s) => s.isPublished);
        const group = (title, items, alumni) => items.length ? (
            <div className="cpv-group">
                <h3>{title}</h3>
                <ul className="cpv-grid">
                    {items.map((s) => (
                        <li key={s.id} className="cpv-card">
                            <Face id={s.photoId} name={s.fullName} />
                            <b>{s.fullName}</b>
                            <span>{s.researchTitle}</span>
                            <small>{s.level} · {s.supervisors.map((x) => `${nameOf(x.id)} (${labelOf(SUPERVISION_ROLES, x.role).toLowerCase()})`).join(", ")}</small>
                            {alumni && s.alumniPosition && <em>Now: {s.alumniPosition}</em>}
                        </li>
                    ))}
                </ul>
            </div>
        ) : null;
        body = (
            <section className="cpv-sec"><div className="cpv-wrap">
                <h2>Postgraduate students</h2>
                {group("PhD students", list.filter((s) => s.status === "current" && s.level === "PhD"))}
                {group("Masters students", list.filter((s) => s.status === "current" && s.level === "Masters"))}
                {group("Alumni", list.filter((s) => s.status === "graduated"), true)}
                {list.length === 0 && <p className="cpv-sub">No published students yet.</p>}
            </div></section>
        );
    } else {
        body = <section className="cpv-sec"><div className="cpv-wrap"><p className="cpv-sub">Choose a member to preview their profile.</p></div></section>;
    }

    return (
        <div className="cpv-overlay" role="dialog" aria-modal="true" aria-label="Page preview">
            <div className="cpv-bar">
                <div className="cpv-bar-left">
                    <span className="cpv-live"><i /> Preview</span>
                    <small>Your current edits, not the live page.{hiddenCount > 0 && ` ${hiddenCount} draft${hiddenCount === 1 ? "" : "s"} hidden.`}</small>
                </div>
                <div className="cpv-devices" role="tablist" aria-label="Screen size">
                    {DEVICES.map((d) => <button key={d.key} type="button" role="tab" aria-selected={device === d.key} className={device === d.key ? "is-on" : ""} onClick={() => setDevice(d.key)}>{d.label}</button>)}
                </div>
                <div className="cpv-bar-right">
                    {previewUrl && <a className="cpv-bar-btn" href={previewUrl} target="_blank" rel="noreferrer">Open saved preview</a>}
                    <button type="button" className="cpv-bar-btn" onClick={onClose}>Close <kbd>Esc</kbd></button>
                </div>
            </div>
            <div className="cpv-stage">
                <div className={`cpv-frame is-${device}`} style={width ? { width } : undefined}>
                    <div className="cpv">
                        <header className="cpv-nav">
                            <b className="cpv-brand"><i />COE-UAS</b>
                            <nav aria-label="Site (preview)">{SITE_NAV.map((n) => <span key={n} className={n === "People" ? "is-on" : ""}>{n}</span>)}</nav>
                            <span className="cpv-cta">Contact us</span>
                        </header>
                        <div className="cpv-hero"><div className="cpv-wrap"><p><span>People</span> {heading}</p></div></div>
                        {body}
                    </div>
                </div>
            </div>
        </div>
    );
}

/* -------------------------------- the page -------------------------------- */

const pathInfo = (props, url) => {
    const view = props.view || VIEWS.find((v) => (url || "").includes(`/people/${v.route}`))?.key || "members";
    const q = new URLSearchParams((url || "").split("?")[1] || "").get("member");
    return { view, memberId: props.memberId ?? q ?? null };
};

export default function AdminCOEUASPeople() {
    const { props, url } = usePage();
    const live = Boolean(props.people?.data);
    const dialogTitleId = useId();

    const seed = useRef(
        live
            ? { data: props.people.data, catalog: props.people.catalog, history: props.people.history || [] }
            : { data: sampleData, catalog: sampleCatalog, history: sampleHistory }
    ).current;

    const first = pathInfo(props, url);
    const [saved, setSaved] = useState(() => clone(seed.data));
    const [data, setData] = useState(() => clone(seed.data));
    const [localHistory, setLocalHistory] = useState(seed.history);
    const [mediaList, setMediaList] = useState(seed.catalog?.media || []);
    const history = live ? props.people.history || [] : localHistory;

    const [view, setView] = useState(first.view);
    const [tab, setTab] = useState("content"); // members view: content | categories | history ; others: content | history
    const [selectedId, setSelectedId] = useState(first.memberId);
    const [section, setSection] = useState(0);
    const [submitted, setSubmitted] = useState(false);
    const [busy, setBusy] = useState(false);
    const [dialog, setDialog] = useState(null);
    const [creating, setCreating] = useState(null);
    const [picker, setPicker] = useState(null);
    const [preview, setPreview] = useState(false);
    const [toast, setToast] = useState(null);
    const busyRef = useRef(false);

    /* follow the sidebar links */
    useEffect(() => {
        const next = pathInfo(props, url);
        setView(next.view);
        setTab("content");
        if (next.memberId !== null && next.memberId !== undefined) setSelectedId(next.memberId);
    }, [props.view, props.memberId, url]);

    const dirty = useMemo(() => !sameJson(data, saved), [data, saved]);
    const allErrors = useMemo(() => validate(data), [data]);
    const errors = useMemo(() => ({ ...(props.errors || {}), ...(submitted ? allErrors : {}) }), [props.errors, submitted, allErrors]);
    const totalErrors = Object.keys(allErrors).length;
    const KEYS = ["categories", "members", "postdocs", "students"];
    const KEY_LABEL = { categories: "Member categories", members: "Members", postdocs: "Postdoctoral researchers", students: "Postgraduate students" };
    const changedKeys = useMemo(() => KEYS.filter((k) => !sameJson(data[k], saved[k])), [data, saved]);
    const changedLabels = changedKeys.map((k) => KEY_LABEL[k]);

    useEffect(() => {
        if (!toast) return undefined;
        const t = setTimeout(() => setToast(null), 5000);
        return () => clearTimeout(t);
    }, [toast]);

    /* warn before leaving with unsaved changes (moving between the four People links is allowed: same page) */
    useEffect(() => {
        const beforeUnload = (e) => { if (dirty) { e.preventDefault(); e.returnValue = ""; } };
        window.addEventListener("beforeunload", beforeUnload);
        const off = router.on("before", (event) => {
            const target = event?.detail?.visit?.url?.pathname || "";
            if (target.startsWith(`${BASE}/people`)) return undefined;
            if (dirty && !busyRef.current && !window.confirm("You have unsaved changes. Leave this page and discard them?")) return false;
            return undefined;
        });
        return () => { window.removeEventListener("beforeunload", beforeUnload); if (typeof off === "function") off(); };
    }, [dirty]);

    const edit = (fn) => setData((d) => { const copy = clone(d); fn(copy); return copy; });
    const askDelete = (info) => setDialog({ type: "delete", ...info });
    const pickMedia = (opts) => setPicker(opts);
    const finishBusy = () => { setBusy(false); busyRef.current = false; };
    const catName = (id) => data.categories.find((c) => idEq(c.id, id))?.name || "";

    const go = (next, memberId) => {
        setView(next);
        setTab("content");
        if (memberId !== undefined) { setSelectedId(memberId); setSection(0); }
        if (live) router.visit(`${BASE}/people/${VIEWS.find((v) => v.key === next).route}${memberId !== undefined && memberId !== null ? `?member=${memberId}` : ""}`, { preserveState: true, preserveScroll: true });
    };

    const addHistory = (action, label, changes = []) =>
        setLocalHistory((h) => [{ id: Date.now(), user: "You", action, label, at: new Date().toISOString(), changes }, ...h]);

    const jumpToFirstError = () => {
        const first = Object.keys(allErrors)[0];
        if (!first) return;
        const p = first.split(".");
        if (p[0] === "c") { setView("members"); setTab("categories"); }
        else if (p[0] === "p") { setView("postdoctoral"); setTab("content"); }
        else if (p[0] === "s") { setView("postgraduate"); setTab("content"); }
        else if (p[0] === "featured") { setView("members"); setTab("content"); }
        else { setView("profiles"); setTab("content"); setSelectedId(p[1]); setSection(SECTION_OF_FIELD[p[2]] ?? 0); }
        setTimeout(() => document.querySelector(".cp-field.has-error")?.scrollIntoView({ behavior: "smooth", block: "center" }), 150);
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
        if (view === "profiles" && data.members.find((m) => idEq(m.id, selectedId))?.fullName === dialog.what) setSelectedId(null);
        setDialog(null);
    };

    const openNew = () => setCreating({ name: "", categoryId: data.categories[0]?.id ?? null, error: "" });
    const createMember = () => {
        if (!creating.name.trim()) { setCreating({ ...creating, error: "Write the member's name." }); return; }
        if (!creating.categoryId) { setCreating({ ...creating, error: "Add a category first (Directory → Categories)." }); return; }
        const m = blankMember(creating.name.trim(), creating.categoryId);
        edit((d) => { d.members.push(m); });
        setCreating(null);
        setToast({ tone: "ok", text: "Member added as a draft. Fill in the profile, then save." });
        go("profiles", m.id);
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

    const media = live ? props.people.catalog?.media || mediaList : mediaList;
    const catalog = { groups: [], projects: [], grants: [], innovations: [], linkages: [], publications: [], citations: [], awards: [], ...(live ? props.people.catalog : seed.catalog) };
    const ctx = { data, edit, errors, media, catalog, askDelete, pickMedia, go, openNew, catName };

    const current = VIEWS.find((v) => v.key === view);
    const tabs = view === "members" ? [["content", "Directory"], ["categories", "Categories"], ["history", "History"]] : [["content", view === "profiles" ? "Profile" : "List"], ["history", "History"]];
    const selected = data.members.find((m) => idEq(m.id, selectedId));
    const published = data.members.filter((m) => m.isPublished).length;

    return (
        <Ctx.Provider value={ctx}>
            <div className="coeuas-people">
                <div className="cp-heading">
                    <div>
                        <h1>{view === "profiles" && selected ? selected.fullName || "Member profile" : current.title}</h1>
                        <p>{current.text}</p>
                        <div className="cp-status">
                            <span className="cp-pill is-ok">{published} of {data.members.length} members published</span>
                            {dirty && <span className="cp-pill is-warn">Unsaved: {changedLabels.join(", ")}</span>}
                            {totalErrors > 0 && submitted && <span className="cp-pill is-danger">{totalErrors} to fix</span>}
                        </div>
                    </div>
                    <div className="cp-actions">
                        {view === "profiles" && selected && <button type="button" className="cp-btn-outline" onClick={() => go("members")}><Icon name="back" size={16} /> Directory</button>}
                        {view === "profiles" && selected && (
                            <select className="cp-input cp-switcher" aria-label="Switch member" value={selected.id} onChange={(e) => go("profiles", e.target.value)}>
                                {data.members.map((m) => <option key={m.id} value={m.id}>{m.fullName || "Unnamed member"}</option>)}
                            </select>
                        )}
                        <button type="button" className="cp-btn-outline" onClick={() => setPreview(true)}><Icon name="eye" size={16} /> Preview</button>
                        <button type="button" className="cp-btn-dark" onClick={save} disabled={!dirty || busy}>
                            <span className="cp-btn-icon"><Icon name="save" size={16} /></span> {busy ? "Saving..." : "Save changes"}
                        </button>
                    </div>
                </div>

                {!live && <p className="cp-note"><Icon name="alert" size={16} /><span>Sample data. Every control works, but nothing is stored until your controller sends the <b>people</b> prop.</span></p>}

                <div className="cp-tabs" role="tablist" aria-label="People editor">
                    {tabs.map(([key, label]) => (
                        <button key={key} type="button" role="tab" aria-selected={tab === key} className={tab === key ? "is-active" : ""} onClick={() => setTab(key)}>
                            {label}
                            {key === "history" && <span className="cp-badge">{history.length}</span>}
                            {key === "categories" && Object.keys(errors).some((k) => k.startsWith("c.")) && <span className="cp-badge-error">!</span>}
                        </button>
                    ))}
                </div>

                {tab === "history" && <HistoryPanel history={history} />}
                {tab === "categories" && view === "members" && <div className="cp-panel"><CategoriesTab /></div>}
                {tab === "content" && view === "members" && <div className="cp-panel"><DirectoryTab /></div>}
                {tab === "content" && view === "profiles" && <ProfileView memberId={selectedId} section={section} setSection={setSection} />}
                {tab === "content" && view === "postdoctoral" && <PostdocView />}
                {tab === "content" && view === "postgraduate" && <StudentView />}

                {dirty && (
                    <div className="cp-savebar" role="region" aria-label="Unsaved changes">
                        <span className="cp-savebar-text"><i /> {changedLabels.length} area{changedLabels.length === 1 ? "" : "s"} edited, not saved</span>
                        <div>
                            <button type="button" className="cp-btn-ghost" onClick={() => { setData(clone(saved)); setSubmitted(false); setToast({ tone: "info", text: "Changes discarded." }); }} disabled={busy}>Discard</button>
                            <button type="button" className="cp-btn-accent" onClick={save} disabled={busy}>{busy ? "Saving..." : "Save changes"}</button>
                        </div>
                    </div>
                )}

                {dialog?.type === "delete" && (
                    <div className="cp-overlay" onMouseDown={(e) => e.target === e.currentTarget && setDialog(null)}>
                        <div className="cp-dialog cp-small" role="alertdialog" aria-modal="true" aria-labelledby={dialogTitleId}>
                            <span className="cp-dialog-icon is-danger"><Icon name="trash" size={22} /></span>
                            <h2 id={dialogTitleId}>Delete “{dialog.what}”?</h2>
                            <p>{dialog.note ? `${dialog.note} ` : ""}It moves to Deleted content, where only the Super Admin can restore or purge it. It leaves the website when you save.</p>
                            <div className="cp-dialog-actions">
                                <button type="button" className="cp-btn-outline" onClick={() => setDialog(null)} autoFocus>Keep it</button>
                                <button type="button" className="cp-btn-danger" onClick={confirmDelete}><Icon name="trash" size={15} /> Move to Trash</button>
                            </div>
                        </div>
                    </div>
                )}

                {creating && (
                    <div className="cp-overlay" onMouseDown={(e) => e.target === e.currentTarget && setCreating(null)}>
                        <div className="cp-dialog cp-small" role="dialog" aria-modal="true" aria-labelledby={dialogTitleId}>
                            <span className="cp-dialog-icon"><Icon name="plus" size={22} /></span>
                            <h2 id={dialogTitleId}>New member</h2>
                            <p>Start with the name and category. You fill in the 13 profile sections next, and the member stays a draft until you publish.</p>
                            <label className={`cp-field ${creating.error && !creating.name.trim() ? "has-error" : ""}`}>
                                <span className="cp-field-top"><span>Full name</span></span>
                                <input className="cp-input" value={creating.name} autoFocus onChange={(e) => setCreating({ ...creating, name: e.target.value, error: "" })} onKeyDown={(e) => e.key === "Enter" && createMember()} />
                            </label>
                            <label className="cp-field">
                                <span className="cp-field-top"><span>Category</span></span>
                                <select className="cp-input" value={creating.categoryId ?? ""} onChange={(e) => setCreating({ ...creating, categoryId: e.target.value ? Number(e.target.value) || e.target.value : null, error: "" })}>
                                    <option value="">Choose a category</option>
                                    {data.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </label>
                            {creating.error && <em className="cp-error"><Icon name="alert" size={13} /> {creating.error}</em>}
                            <div className="cp-dialog-actions">
                                <button type="button" className="cp-btn-outline" onClick={() => setCreating(null)}>Cancel</button>
                                <button type="button" className="cp-btn-dark" onClick={createMember}>Create and edit profile</button>
                            </div>
                        </div>
                    </div>
                )}

                {picker && <MediaPicker state={picker} media={media} onClose={() => setPicker(null)} onUpload={uploadMedia} />}
                {preview && <PreviewModal data={data} media={media} catalog={catalog} view={view} memberId={selectedId} previewUrl={props.people?.previewUrl} onClose={() => setPreview(false)} />}

                {toast && (
                    <div className={`cp-toast is-${toast.tone}`} role="status">
                        <Icon name={toast.tone === "error" ? "alert" : "check"} size={16} />
                        <span>{toast.text}</span>
                        <button type="button" aria-label="Dismiss" onClick={() => setToast(null)}><Icon name="close" size={14} /></button>
                    </div>
                )}
            </div>
        </Ctx.Provider>
    );
}

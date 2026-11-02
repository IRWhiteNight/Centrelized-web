import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { router, usePage } from "@inertiajs/react";
import "../../../css/admin-PSB-css/admin-opportunities.css";

/* ====================================================================
   PSB ADMIN → OPPORTUNITIES EDITOR            /admin/psb/opportunities/*

   Site map (PSB workspace → "Opportunities"), one editor for all five modules:
     1  Ways to Participate            → psb_participation_types
     2  Testing and Innovation Areas   → psb_testing_areas
     3  Open Programmes and Calls      → psb_programmes (+ brief document)
     4  How to Participate (steps)     → psb_process_steps
     5  Participant Benefits           → psb_benefits
   Common screens from the document: list with search / filter by status / sort,
   create / edit form, draft + preview + publish, schedule, reorder (drag),
   delete to Trash, History tab (audit_logs). Files always come from media_assets.

   LIVE PREVIEW: the panel on the right has two views
     • Draft preview  - the public page built from what is on screen (unsaved edits too)
     • Live site      - the real public page (/opportunities) in a frame; reloads after publishing

   SAMPLE DATA: the page works today (changes stay on screen only). Return an Inertia prop
   named `opportunities` and it switches to LIVE mode:

   Route::get('/admin/psb/opportunities/{section?}', fn ($section = 'ways') =>
       Inertia::render('admin-PSB/AdminPSBOpportunities', ['section' => $section])
   )->where('section', 'ways|testing-areas|programmes|how-to-participate|benefits');

   Inertia::render('admin-PSB/AdminPSBOpportunities', [
       'section' => 'ways',
       'opportunities' => [
           'content' => [...],   // same shape as `sampleContent` below
           'meta'    => [...],   // status, publishedAt, scheduledAt, hasUnpublishedChanges, updatedBy, updatedAt
           'catalog' => ['media' => []],   // media_assets (image / video / document)
           'history' => [...],   // audit_logs rows for these records
           'liveUrl' => '/opportunities',  // optional, public page address
       ],
   ]);

   LIVE mode requests are listed in ENDPOINTS. The controller must write audit_logs.
==================================================================== */

const BASE = "/admin/psb"; // keep in sync with psbRoutes.js
const ENDPOINTS = {
    save: `${BASE}/opportunities`, // PUT   { content }            save as draft
    publish: `${BASE}/opportunities/publish`, // POST  { content }            save + publish now
    schedule: `${BASE}/opportunities/schedule`, // POST  { content, at }        save + publish later
    unpublish: `${BASE}/opportunities/unpublish`, // POST
    upload: `${BASE}/media-library/upload`, // POST  multipart { file }
};
const DEFAULT_LIVE_URL = "/opportunities";

const LIMITS = { ways: 6, areas: 8, steps: 8, benefits: 8 };

const SECTIONS = [
    { key: "ways", route: "ways", label: "Ways to Participate", hint: "Routes into the sandbox", noun: "way" },
    { key: "areas", route: "testing-areas", label: "Testing and Innovation Areas", hint: "Focus areas for testing", noun: "area" },
    { key: "programmes", route: "programmes", label: "Open Programmes and Calls", hint: "Openings, schedules and briefs", noun: "programme" },
    { key: "steps", route: "how-to-participate", label: "How to Participate", hint: "Process steps in order", noun: "step" },
    { key: "benefits", route: "benefits", label: "Participant Benefits", hint: "What participants gain", noun: "benefit" },
];

const PROGRAMME_STATUS = [
    { value: "draft", label: "Draft", tone: "off" },
    { value: "upcoming", label: "Upcoming", tone: "warn" },
    { value: "open", label: "Open", tone: "ok" },
    { value: "closed", label: "Closed", tone: "info" },
];
const STATUS_BY = Object.fromEntries(PROGRAMME_STATUS.map((s) => [s.value, s]));

const MIN = 60 * 1000;
const NOW = Date.now();
const minsAgo = (m) => new Date(NOW - m * MIN).toISOString();
const dayOffset = (d) => new Date(NOW + d * 86400000).toISOString().slice(0, 10);
let counter = 0;
const uid = () => `n${Date.now().toString(36)}${(counter += 1)}`;

/* ------------------------------ sample data ------------------------------ */

const sampleContent = {
    ways: {
        visible: true,
        heading: "Ways to *participate.*",
        intro: "Three routes into the sandbox, all with the same safety and regulatory support.",
        items: [
            { id: "w1", title: "Government-led trials", description: "Agencies test real operational use cases and generate evidence for policy.", icon: "landmark" },
            { id: "w2", title: "Industry testing & demonstrations", description: "Manufacturers, operators and technology providers prove aircraft, systems and services in controlled airspace.", icon: "factory" },
            { id: "w3", title: "Research & innovation", description: "Universities and research bodies run experiments backed by real operational data.", icon: "flask" },
        ],
    },
    areas: {
        visible: true,
        heading: "Testing and *innovation areas.*",
        intro: "Four focus areas where the sandbox supports structured testing.",
        items: [
            { id: "a1", name: "First Responder Operations", slug: "first-responder-operations", slugAuto: true, summary: "Drones and aircraft supporting search and rescue, medical response and emergency coordination.", description: "Rehearse emergency missions with the agencies that run them, from thermal search to medical supply drops.", mediaId: 3 },
            { id: "a2", name: "Advanced Air Mobility Operations", slug: "advanced-air-mobility-operations", slugAuto: true, summary: "eVTOL and air taxi flight tests, vertiport procedures and passenger-ready operations.", description: "Validate aircraft, vertiport layouts and operating procedures before wider deployment.", mediaId: 7 },
            { id: "a3", name: "Cargo Logistics Operations", slug: "cargo-logistics-operations", slugAuto: true, summary: "Autonomous cargo flights and beyond-visual-line-of-sight corridors.", description: "Test point-to-point cargo routes, handling and detect-and-avoid in real airspace.", mediaId: 2 },
            { id: "a4", name: "Supporting technology and system integration", slug: "supporting-technology-and-system-integration", slugAuto: true, summary: "Communications, detect-and-avoid, unmanned traffic management and payload integration.", description: "Integrate and validate the systems that make safe low-altitude operations possible.", mediaId: 6 },
        ],
    },
    programmes: {
        visible: true,
        heading: "Open programmes *and calls.*",
        intro: "Participation openings, schedules and briefs.",
        ctaLabel: "Apply to Participate",
        ctaUrl: "/apply-to-participate",
        items: [
            { id: "p1", title: "Open Call: BVLOS Corridor Trials", slug: "open-call-bvlos-corridor-trials", slugAuto: true, status: "open", areaId: "a3", wayId: "w2", openDate: dayOffset(-20), closeDate: dayOffset(43), brief: "Trial beyond-visual-line-of-sight cargo corridors between the sandbox site and nearby drop zones.", eligibility: "Registered operators with a safety case and trained remote pilots.", documentId: 11, featured: true },
            { id: "p2", title: "First Responder Drone Exercise", slug: "first-responder-drone-exercise", slugAuto: true, status: "open", areaId: "a1", wayId: "w1", openDate: dayOffset(-10), closeDate: dayOffset(28), brief: "A multi-agency exercise covering search and rescue and medical supply drops.", eligibility: "Government and emergency-response agencies.", documentId: 12, featured: true },
            { id: "p3", title: "eVTOL Vertiport Demonstration", slug: "evtol-vertiport-demonstration", slugAuto: true, status: "upcoming", areaId: "a2", wayId: "w2", openDate: dayOffset(70), closeDate: dayOffset(110), brief: "Demonstrate vertiport approach, landing and turnaround procedures.", eligibility: "Aircraft manufacturers and vertiport operators.", documentId: null, featured: true },
            { id: "p4", title: "UTM Integration Trial", slug: "utm-integration-trial", slugAuto: true, status: "upcoming", areaId: "a4", wayId: "w3", openDate: dayOffset(92), closeDate: dayOffset(130), brief: "Connect unmanned traffic management services to live flights in the sandbox.", eligibility: "Technology providers and research institutions.", documentId: null, featured: false },
            { id: "p5", title: "Medical Cargo Pilot", slug: "medical-cargo-pilot", slugAuto: true, status: "draft", areaId: "a3", wayId: "w1", openDate: "", closeDate: "", brief: "Pilot for time-critical medical deliveries.", eligibility: "", documentId: null, featured: false },
            { id: "p6", title: "Agriculture Monitoring Trial", slug: "agriculture-monitoring-trial", slugAuto: true, status: "closed", areaId: "a4", wayId: "w3", openDate: dayOffset(-120), closeDate: dayOffset(-35), brief: "Crop monitoring and precision-spraying flights over paddy fields.", eligibility: "Research and agricultural technology teams.", documentId: 13, featured: false },
        ],
    },
    steps: {
        visible: true,
        heading: "How to *participate.*",
        intro: "Four steps from first contact to flight.",
        items: [
            { id: "s1", title: "Express interest", description: "Tell us who you are and what you want to test." },
            { id: "s2", title: "Define activity", description: "Describe the operation, equipment, team and proposed dates." },
            { id: "s3", title: "Review and approval", description: "The programme team reviews safety, compliance and readiness, and may ask for more information." },
            { id: "s4", title: "Execute", description: "Approved activities are scheduled and coordinated with the relevant authorities." },
        ],
    },
    benefits: {
        visible: true,
        heading: "Participant *benefits.*",
        intro: "What every participant can count on.",
        items: [
            { id: "b1", title: "Ecosystem access", description: "Work alongside regulators, agencies, researchers and industry partners.", icon: "network" },
            { id: "b2", title: "Collaboration", description: "Find partners for joint trials, demonstrations and pilots.", icon: "users" },
            { id: "b3", title: "Research opportunities", description: "Collect real operational data for studies, papers and policy.", icon: "flask" },
            { id: "b4", title: "Available support", description: "Planning, safety, infrastructure and coordination help from the programme team.", icon: "shield" },
        ],
    },
    seo: {
        title: "Opportunities | Perlis Airspace Sandbox",
        description: "Ways to take part, testing areas, open programmes and calls, and how to apply to the Perlis Airspace Sandbox.",
        mediaId: 2,
    },
};

const sampleCatalog = {
    media: [
        { id: 2, name: "site-aerial.jpg", type: "image", alt: "Aerial view of the Sungai Batu Pahat site", size: "2.1 MB" },
        { id: 3, name: "rescue-drill.jpg", type: "image", alt: "Drone supporting a rescue drill", size: "1.8 MB" },
        { id: 6, name: "hangar-interior.jpg", type: "image", alt: "Inside the research and maintenance hangar", size: "1.9 MB" },
        { id: 7, name: "evtol-hover.jpg", type: "image", alt: "eVTOL aircraft hovering above a vertiport", size: "1.4 MB" },
        { id: 8, name: "paddy-corridor.jpg", type: "image", alt: "", size: "1.7 MB" },
        { id: 11, name: "bvlos-corridor-brief.pdf", type: "document", alt: "", size: "640 KB" },
        { id: 12, name: "first-responder-exercise-brief.pdf", type: "document", alt: "", size: "512 KB" },
        { id: 13, name: "agriculture-trial-brief.pdf", type: "document", alt: "", size: "430 KB" },
        { id: 14, name: "participation-guide.pdf", type: "document", alt: "", size: "1.1 MB" },
    ],
};

const sampleMeta = {
    status: "published",
    publishedAt: minsAgo(60 * 30),
    scheduledAt: null,
    hasUnpublishedChanges: false,
    updatedBy: "Aiman Hakim",
    updatedAt: minsAgo(60 * 30),
};

const sampleHistory = [
    { id: 6, user: "Aiman Hakim", action: "PUBLISH", label: "Opportunities page", at: minsAgo(60 * 30), changes: [{ field: "Open Programmes and Calls", from: "1 open call", to: "2 open calls" }] },
    { id: 5, user: "Aiman Hakim", action: "CREATE", label: "Programme: First Responder Drone Exercise", at: minsAgo(60 * 31), changes: [{ field: "Status", from: "(new)", to: "Open" }] },
    { id: 4, user: "Farid Rahman", action: "UPDATE", label: "How to Participate", at: minsAgo(60 * 55), changes: [{ field: "Step 3: Review and approval", from: "Reviewed by the team.", to: "The programme team reviews safety, compliance and readiness, and may ask for more information." }] },
    { id: 3, user: "Farid Rahman", action: "DELETE", label: "Benefit: Priority airspace slots", at: minsAgo(60 * 60), changes: [{ field: "Moved to Trash", from: "Priority airspace slots", to: "(deleted)" }] },
    { id: 2, user: "Aiman Hakim", action: "UPDATE", label: "Testing and Innovation Areas", at: minsAgo(60 * 95), changes: [{ field: "Cargo Logistics Operations: summary", from: "Cargo flights.", to: "Autonomous cargo flights and beyond-visual-line-of-sight corridors." }] },
    { id: 1, user: "Super Administrator", action: "CREATE", label: "Opportunities page", at: minsAgo(60 * 24 * 9), changes: [] },
];

/* ------------------------------ helpers ------------------------------ */

const clone = (v) => JSON.parse(JSON.stringify(v));
const sameJson = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const isLink = (v) => /^(https?:\/\/|\/|#|mailto:)/i.test((v || "").trim());
const slugify = (t = "") => t.toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
const todayStr = () => new Date().toISOString().slice(0, 10);

function formatDate(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    return `${d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}, ${d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`;
}
const formatDay = (s) => (s ? new Date(`${s}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "");

function timeAgo(iso) {
    const minutes = Math.round((Date.now() - new Date(iso).getTime()) / MIN);
    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.round(minutes / 60);
    if (hours < 24) return `${hours} hr ago`;
    const days = Math.round(hours / 24);
    return `${days} day${days === 1 ? "" : "s"} ago`;
}
const initialsOf = (name) => (name || "?").split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase();

/* "Open programmes *and calls.*" → highlighted words */
const Hl = ({ text = "" }) => text.split("*").map((x, i) => (i % 2 ? <em key={i}>{x}</em> : x));

function programmeMeta(p) {
    if (p.status === "draft") return "Not published";
    if (p.status === "upcoming") return p.openDate ? `Opens ${formatDay(p.openDate)}` : "Opening date not set";
    if (p.status === "closed") return p.closeDate ? `Closed ${formatDay(p.closeDate)}` : "Closed";
    return p.closeDate ? `Closes ${formatDay(p.closeDate)}` : "Open";
}

/* drawn thumbnail for a media asset (real files would use their own URL) */
function thumbOf(item) {
    if (item?.url) return item.url;
    const label = (item?.name || "media").replace(/[<>&"]/g, "");
    let art;
    if (item?.type === "document") {
        art = '<rect x="112" y="34" width="96" height="124" rx="8" fill="#fff"/><path d="M130 66h60M130 86h60M130 106h40" stroke="#0b1a28" stroke-width="6" stroke-linecap="round"/><rect x="112" y="34" width="96" height="22" rx="8" fill="#facc15"/>';
    } else if (item?.type === "video") {
        art = '<circle cx="160" cy="84" r="26" fill="#fff" fill-opacity=".92"/><path d="M152 70v28l24-14z" fill="#0b1a28"/>';
    } else {
        art = '<circle cx="160" cy="84" r="9" fill="#fff"/><path d="M130 54l60 60M190 54l-60 60" stroke="#fff" stroke-width="4" stroke-linecap="round"/>';
    }
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0b1a28"/><stop offset="1" stop-color="#1d4160"/></linearGradient></defs><rect width="320" height="200" fill="url(#g)"/><path d="M-10 170L120 110 330 70V110L130 150 -10 200Z" fill="#facc15" fill-opacity=".9"/>${art}<text x="14" y="186" fill="#fff" font-family="Arial,sans-serif" font-size="13" font-weight="700">${label}</text></svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/* ------------------------------ validation ------------------------------ */

function programmeErrors(p, all, prefix) {
    const out = {};
    const k = (n) => `${prefix}${n}`;
    const need = (n, value, label, max) => {
        const v = (value ?? "").toString().trim();
        if (!v) out[k(n)] = `Enter ${label}.`;
        else if (max && v.length > max) out[k(n)] = `Use ${max} characters or fewer.`;
    };
    need("title", p.title, "a title", 120);
    if (!(p.slug || "").trim()) out[k("slug")] = "Enter a page address.";
    else if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(p.slug)) out[k("slug")] = "Use lowercase letters, numbers and single hyphens only.";
    else if (all.some((x) => x.id !== p.id && x.slug === p.slug)) out[k("slug")] = "Another programme already uses this address.";
    need("brief", p.brief, "a short brief", 400);
    if ((p.eligibility || "").length > 400) out[k("eligibility")] = "Use 400 characters or fewer.";
    if (p.status === "upcoming" && !p.openDate) out[k("openDate")] = "Add the opening date for an upcoming programme.";
    if (p.openDate && p.closeDate && p.closeDate < p.openDate) out[k("closeDate")] = "The closing date must be on or after the opening date.";
    else if (p.status === "open" && p.closeDate && p.closeDate < todayStr()) out[k("closeDate")] = "This programme is marked Open but its closing date has passed. Mark it Closed or extend the date.";
    return out;
}

function validate(f) {
    const e = {};
    const need = (key, value, label, max) => {
        const v = (value ?? "").toString().trim();
        if (!v) e[key] = `Enter ${label}.`;
        else if (max && v.length > max) e[key] = `Use ${max} characters or fewer.`;
    };
    const maxLen = (key, value, max) => { if ((value || "").length > max) e[key] = `Use ${max} characters or fewer.`; };

    ["ways", "areas", "programmes", "steps", "benefits"].forEach((k) => {
        need(`${k}.heading`, f[k].heading, "a heading", 80);
        maxLen(`${k}.intro`, f[k].intro, 240);
    });
    need("programmes.ctaLabel", f.programmes.ctaLabel, "button text", 30);
    if (!(f.programmes.ctaUrl || "").trim()) e["programmes.ctaUrl"] = "Enter a button link.";
    else if (!isLink(f.programmes.ctaUrl)) e["programmes.ctaUrl"] = "Use a full address (https://...) or a path starting with /";

    if (!f.ways.items.length) e["ways.items"] = "Add at least one way to participate.";
    f.ways.items.forEach((x) => { need(`ways.items.${x.id}.title`, x.title, "a title", 80); need(`ways.items.${x.id}.description`, x.description, "a description", 200); });

    if (!f.areas.items.length) e["areas.items"] = "Add at least one testing area.";
    f.areas.items.forEach((a) => {
        const p = `areas.items.${a.id}.`;
        need(`${p}name`, a.name, "a name", 80);
        if (!(a.slug || "").trim()) e[`${p}slug`] = "Enter a page address.";
        else if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(a.slug)) e[`${p}slug`] = "Use lowercase letters, numbers and single hyphens only.";
        else if (f.areas.items.some((x) => x.id !== a.id && x.slug === a.slug)) e[`${p}slug`] = "Another area already uses this address.";
        need(`${p}summary`, a.summary, "a summary", 200);
        maxLen(`${p}description`, a.description, 1500);
    });

    f.programmes.items.forEach((p) => Object.assign(e, programmeErrors(p, f.programmes.items, `programmes.items.${p.id}.`)));

    if (!f.steps.items.length) e["steps.items"] = "Add at least one step.";
    f.steps.items.forEach((s) => { need(`steps.items.${s.id}.title`, s.title, "a title", 80); need(`steps.items.${s.id}.description`, s.description, "a description", 240); });

    if (!f.benefits.items.length) e["benefits.items"] = "Add at least one benefit.";
    f.benefits.items.forEach((b) => { need(`benefits.items.${b.id}.title`, b.title, "a title", 80); need(`benefits.items.${b.id}.description`, b.description, "a description", 200); });

    need("seo.title", f.seo.title, "a page title", 70);
    maxLen("seo.description", f.seo.description, 160);
    return e;
}

const sectionOfKey = (key) => key.split(".")[0];

/* ------------------------------ shared state ------------------------------ */

const Ctx = createContext(null);
const useEd = () => useContext(Ctx);

/* ------------------------------ icons ------------------------------ */

function Icon({ name, size = 18 }) {
    const icons = {
        eye: (<><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></>),
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
        doc: (<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><path d="M8 13h8M8 17h6" /></>),
        external: <path d="M14 4h6v6M20 4l-9 9M18 14v5H5V6h5" />,
        unlink: (<><path d="M9 15 15 9" /><path d="M11 6l1.5-1.5a4 4 0 0 1 5.7 5.7L16.7 11.7M13 18l-1.5 1.5a4 4 0 0 1-5.7-5.7L7.3 12.3" /><path d="M3 3l18 18" /></>),
        edit: (<><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></>),
        star: <polygon points="12 2 15 9 22 9.5 17 14.5 18.5 22 12 18 5.5 22 7 14.5 2 9.5 9 9" />,
        refresh: (<><path d="M21 12a9 9 0 1 1-3-6.7" /><polyline points="21 3 21 9 15 9" /></>),
        panel: (<><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M14 4v16" /></>),
    };
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            {icons[name]}
        </svg>
    );
}

/* icons an editor can choose for a way or benefit (stored as a name in the `icon` column) */
const GLYPHS = {
    landmark: (<><path d="M3 10 12 4l9 6" /><path d="M5 10v8M9.5 10v8M14.5 10v8M19 10v8" /><path d="M3 20h18" /></>),
    factory: (<><path d="M3 20V9l6 4V9l6 4V5h3v15z" /><path d="M3 20h18" /></>),
    flask: (<><path d="M9 3h6M10 3v6L4.5 19a1.5 1.5 0 0 0 1.3 2h12.4a1.5 1.5 0 0 0 1.3-2L14 9V3" /><path d="M7.5 15h9" /></>),
    users: (<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>),
    network: (<><circle cx="12" cy="5" r="2" /><circle cx="5" cy="19" r="2" /><circle cx="19" cy="19" r="2" /><path d="M12 7v5M12 12l-6 5M12 12l6 5" /></>),
    shield: <path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z" />,
    plane: <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z" />,
    package: (<><path d="M21 8 12 3 3 8v8l9 5 9-5z" /><path d="m3 8 9 5 9-5M12 13v8" /></>),
    cpu: (<><rect x="6" y="6" width="12" height="12" rx="2" /><path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4" /></>),
    book: <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z" />,
    star: <polygon points="12 2 15 9 22 9.5 17 14.5 18.5 22 12 18 5.5 22 7 14.5 2 9.5 9 9" />,
};
const GLYPH_NAMES = Object.keys(GLYPHS);

function Glyph({ name, size = 20 }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            {GLYPHS[name] || GLYPHS.star}
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

function Field({ label, hint, value, onChange, errorKey, max, rows, placeholder, className = "", type = "text", prefix, suffix }) {
    const { errors } = useEd();
    const error = errors[errorKey];
    const id = `po-${errorKey}`;
    const length = (value || "").length;

    return (
        <div className={`po-field ${error ? "has-error" : ""} ${className}`}>
            <div className="po-field-top">
                <label htmlFor={id}>{label}</label>
                {max && <span className={`po-count ${length > max ? "is-over" : ""}`}>{length}/{max}</span>}
            </div>
            {rows ? (
                <textarea id={id} className="po-input po-textarea" rows={rows} value={value || ""} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
            ) : prefix || suffix ? (
                <div className="po-input-wrap">
                    {prefix && <span className="po-affix">{prefix}</span>}
                    <input id={id} type={type} className="po-input" value={value || ""} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
                    {suffix}
                </div>
            ) : (
                <input id={id} type={type} className="po-input" value={value || ""} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
            )}
            {hint && !error && <p className="po-hint">{hint}</p>}
            {error && <p className="po-error" role="alert"><Icon name="alert" size={13} /> {error}</p>}
        </div>
    );
}

function SelectField({ label, value, onChange, options, errorKey, hint, placeholder = "None" }) {
    const { errors } = useEd();
    const error = errors[errorKey];
    const id = `po-${errorKey}`;
    return (
        <div className={`po-field ${error ? "has-error" : ""}`}>
            <div className="po-field-top"><label htmlFor={id}>{label}</label></div>
            <select id={id} className="po-input po-select" value={value ?? ""} onChange={(e) => onChange(e.target.value || null)}>
                <option value="">{placeholder}</option>
                {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            {hint && !error && <p className="po-hint">{hint}</p>}
            {error && <p className="po-error" role="alert"><Icon name="alert" size={13} /> {error}</p>}
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

function IconPick({ value, onChange }) {
    return (
        <div className="po-field">
            <div className="po-field-top"><span className="po-label">Icon</span></div>
            <div className="po-icons" role="radiogroup" aria-label="Icon">
                {GLYPH_NAMES.map((n) => (
                    <button key={n} type="button" role="radio" aria-checked={value === n} title={n} className={value === n ? "is-on" : ""} onClick={() => onChange(n)}>
                        <Glyph name={n} size={18} />
                    </button>
                ))}
            </div>
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

const moveIn = (list, from, to) => {
    if (to < 0 || to >= list.length) return list;
    const next = [...list];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    return next;
};

/* Ordered list: every row can be edited, moved and removed. Removing asks first (moves to Trash). */
function Orderable({ items, onMove, onRemove, nameOf, extraOf, children, empty, numbered = true }) {
    const { askDelete } = useEd();
    const drag = useDrag(onMove);

    if (!items.length) return <p className="po-empty">{empty}</p>;

    return (
        <ul className="po-list">
            {items.map((item, i) => (
                <li key={item.id} className={`po-item ${drag.over === i ? "is-over" : ""}`} {...drag.rowProps(i)}>
                    <button type="button" className="po-handle" aria-label={`Drag ${nameOf(item)} to reorder`} title="Drag to reorder" {...drag.handleProps(i)}>
                        <Icon name="grip" size={16} />
                    </button>
                    {numbered && <span className="po-item-no">{i + 1}</span>}
                    <div className="po-item-body">{children(item, i)}</div>
                    <div className="po-item-tools">
                        <button type="button" className="po-iconbtn" aria-label="Move up" title="Move up" disabled={i === 0} onClick={() => onMove(i, i - 1)}><Icon name="up" size={15} /></button>
                        <button type="button" className="po-iconbtn" aria-label="Move down" title="Move down" disabled={i === items.length - 1} onClick={() => onMove(i, i + 1)}><Icon name="down" size={15} /></button>
                        <button type="button" className="po-iconbtn is-danger" aria-label={`Delete ${nameOf(item)}`} title="Delete (moves to Trash)" onClick={() => askDelete({ what: nameOf(item), extra: extraOf ? extraOf(item) : "", onConfirm: () => onRemove(i) })}><Icon name="trash" size={15} /></button>
                    </div>
                </li>
            ))}
        </ul>
    );
}

function AddButton({ onClick, children, disabled }) {
    return (
        <button type="button" className="po-add" onClick={onClick} disabled={disabled}>
            <Icon name="plus" size={15} /> {children}
        </button>
    );
}

/* ------------------------------ media ------------------------------ */

function MediaField({ label, hint, mediaId, onChange, accept = "image", errorKey }) {
    const { media, pickMedia } = useEd();
    const asset = media.find((m) => m.id === mediaId);
    const needsAlt = asset && asset.type === "image" && !asset.alt;
    const kind = asset?.type === "document" ? "Document" : asset?.type === "video" ? "Video" : "Image";

    return (
        <div className="po-field">
            <div className="po-field-top"><span className="po-label">{label}</span></div>
            <div className="po-media">
                <span className="po-media-thumb">
                    {asset ? <img src={thumbOf(asset)} alt="" /> : <Icon name={accept === "document" ? "doc" : "image"} size={22} />}
                </span>
                <div className="po-media-text">
                    {asset ? (
                        <>
                            <strong>{asset.name}</strong>
                            <small>{kind} · {asset.size}</small>
                            {needsAlt && <small className="po-media-warn"><Icon name="alert" size={12} /> No alt text. Add it in the Media Library.</small>}
                        </>
                    ) : (
                        <>
                            <strong>No file chosen</strong>
                            <small>Pick a file from the Media Library</small>
                        </>
                    )}
                </div>
                <div className="po-media-actions">
                    <button type="button" className="po-btn-small" onClick={() => pickMedia({ accept, selected: mediaId, onPick: onChange })}>{asset ? "Change" : "Choose"}</button>
                    {asset && <button type="button" className="po-btn-small is-quiet" onClick={() => onChange(null)}>Remove</button>}
                </div>
            </div>
            {hint && <p className="po-hint">{hint}</p>}
            {errorKey && <ErrorLine errorKey={errorKey} />}
        </div>
    );
}

function MediaPicker({ state, media, onClose, onUpload }) {
    const [query, setQuery] = useState("");
    const [type, setType] = useState(state.accept === "document" ? "document" : state.accept === "image" ? "image" : "all");
    const fileRef = useRef(null);

    useEffect(() => {
        const onKey = (e) => e.key === "Escape" && onClose();
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [onClose]);

    const list = media.filter((m) => {
        if (type !== "all" && m.type !== type) return false;
        const q = query.trim().toLowerCase();
        return !q || m.name.toLowerCase().includes(q) || (m.alt || "").toLowerCase().includes(q);
    });

    return (
        <div className="po-overlay is-top" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
            <div className="po-dialog po-picker" role="dialog" aria-modal="true" aria-labelledby="po-picker-title">
                <header className="po-dialog-head">
                    <div>
                        <h2 id="po-picker-title">Media Library</h2>
                        <p>Choose a file. Files are managed in the Media Library.</p>
                    </div>
                    <button type="button" className="po-iconbtn" aria-label="Close" onClick={onClose}><Icon name="close" size={18} /></button>
                </header>

                <div className="po-picker-tools">
                    <label className="po-search">
                        <Icon name="search" size={16} />
                        <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by file name or alt text" aria-label="Search media" />
                    </label>
                    <select className="po-input po-select" value={type} onChange={(e) => setType(e.target.value)} aria-label="File type">
                        <option value="all">All files</option>
                        <option value="image">Images</option>
                        <option value="document">Documents</option>
                        <option value="video">Video</option>
                    </select>
                    <button type="button" className="po-btn-small" onClick={() => fileRef.current?.click()}><Icon name="upload" size={14} /> Upload</button>
                    <input ref={fileRef} type="file" hidden accept="image/*,video/*,.pdf,.doc,.docx" onChange={(e) => { const f = e.target.files?.[0]; if (f) onUpload(f); e.target.value = ""; }} />
                </div>

                <div className="po-media-grid">
                    {list.length === 0 && <p className="po-empty">No files match. Try another search or upload a new file.</p>}
                    {list.map((m) => (
                        <button key={m.id} type="button" className={`po-media-card ${state.selected === m.id ? "is-selected" : ""}`} onClick={() => { state.onPick(m.id); onClose(); }}>
                            <img src={thumbOf(m)} alt="" />
                            <span className="po-media-card-text">
                                <strong>{m.name}</strong>
                                <small>{m.type === "document" ? "Document" : m.type === "video" ? "Video" : "Image"} · {m.size}</small>
                            </span>
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

function SectionHead({ sectionKey }) {
    const { form, edit } = useEd();
    const index = SECTIONS.findIndex((s) => s.key === sectionKey);
    const def = SECTIONS[index];
    const visible = form[sectionKey].visible;

    return (
        <header className="po-card-head">
            <div>
                <span className="po-card-no">Section {index + 1} of {SECTIONS.length}</span>
                <h2>{def.label}</h2>
                <p>{def.hint}. Changes go live when you publish.</p>
            </div>
            <label className="po-visible">
                <span>{visible ? "Shown on page" : "Hidden from page"}</span>
                <Toggle checked={visible} label={`Show ${def.label} on the Opportunities page`} onChange={(v) => edit((d) => { d[sectionKey].visible = v; })} />
            </label>
        </header>
    );
}

function SectionCopy({ sectionKey }) {
    const { form, edit } = useEd();
    const s = form[sectionKey];
    return (
        <div className="po-block">
            <BlockHead title="Heading and introduction" text="The text above this section on the public page." />
            <Field label="Heading" errorKey={`${sectionKey}.heading`} value={s.heading} max={80} onChange={(v) => edit((d) => { d[sectionKey].heading = v; })} hint="Put *asterisks* around the words that should be highlighted in yellow." />
            <Field label="Short introduction" errorKey={`${sectionKey}.intro`} value={s.intro} max={240} rows={2} onChange={(v) => edit((d) => { d[sectionKey].intro = v; })} />
        </div>
    );
}

const upd = (edit, section, id, patch) => edit((d) => Object.assign(d[section].items.find((x) => x.id === id), patch));

/* ---------- 1. Ways to Participate ---------- */
function WaysEditor() {
    const { form, edit } = useEd();
    const items = form.ways.items;
    const used = (id) => form.programmes.items.filter((p) => p.wayId === id).length;

    return (
        <section className="po-card">
            <SectionHead sectionKey="ways" />
            <SectionCopy sectionKey="ways" />

            <div className="po-block">
                <BlockHead title="Ways to participate" text="One card per route into the sandbox." aside={<span className="po-limit">{items.length} of {LIMITS.ways}</span>} />
                <Orderable
                    items={items}
                    nameOf={(w) => w.title || "way to participate"}
                    extraOf={(w) => (used(w.id) ? `${used(w.id)} programme${used(w.id) === 1 ? " uses" : "s use"} this way. They will be unlinked.` : "")}
                    onMove={(from, to) => edit((d) => { d.ways.items = moveIn(d.ways.items, from, to); })}
                    onRemove={(i) => edit((d) => {
                        const [gone] = d.ways.items.splice(i, 1);
                        d.programmes.items.forEach((p) => { if (p.wayId === gone.id) p.wayId = null; });
                    })}
                    empty="No ways to participate yet."
                >
                    {(w) => (
                        <div className="po-stack">
                            <Field label="Title" errorKey={`ways.items.${w.id}.title`} value={w.title} max={80} onChange={(v) => upd(edit, "ways", w.id, { title: v })} />
                            <Field label="Description" errorKey={`ways.items.${w.id}.description`} value={w.description} max={200} rows={2} onChange={(v) => upd(edit, "ways", w.id, { description: v })} />
                            <IconPick value={w.icon} onChange={(v) => upd(edit, "ways", w.id, { icon: v })} />
                        </div>
                    )}
                </Orderable>
                <ErrorLine errorKey="ways.items" />
                <AddButton disabled={items.length >= LIMITS.ways} onClick={() => edit((d) => { d.ways.items.push({ id: uid(), title: "", description: "", icon: "star" }); })}>Add way to participate</AddButton>
            </div>
        </section>
    );
}

/* ---------- 2. Testing and Innovation Areas ---------- */
function AreasEditor() {
    const { form, edit } = useEd();
    const items = form.areas.items;
    const used = (id) => form.programmes.items.filter((p) => p.areaId === id).length;

    return (
        <section className="po-card">
            <SectionHead sectionKey="areas" />
            <SectionCopy sectionKey="areas" />

            <div className="po-block">
                <BlockHead title="Testing and innovation areas" text="Each area has its own detail page on the public site." aside={<span className="po-limit">{items.length} of {LIMITS.areas}</span>} />
                <Orderable
                    items={items}
                    nameOf={(a) => a.name || "testing area"}
                    extraOf={(a) => (used(a.id) ? `${used(a.id)} programme${used(a.id) === 1 ? " is" : "s are"} linked to this area. They will be unlinked.` : "")}
                    onMove={(from, to) => edit((d) => { d.areas.items = moveIn(d.areas.items, from, to); })}
                    onRemove={(i) => edit((d) => {
                        const [gone] = d.areas.items.splice(i, 1);
                        d.programmes.items.forEach((p) => { if (p.areaId === gone.id) p.areaId = null; });
                    })}
                    empty="No testing areas yet."
                >
                    {(a) => (
                        <div className="po-stack">
                            <Field
                                label="Name"
                                errorKey={`areas.items.${a.id}.name`}
                                value={a.name}
                                max={80}
                                onChange={(v) => edit((d) => {
                                    const x = d.areas.items.find((q) => q.id === a.id);
                                    x.name = v;
                                    if (x.slugAuto !== false) x.slug = slugify(v);
                                })}
                            />
                            <Field
                                label="Page address"
                                prefix="/opportunities/"
                                errorKey={`areas.items.${a.id}.slug`}
                                value={a.slug}
                                onChange={(v) => upd(edit, "areas", a.id, { slug: slugify(v), slugAuto: false })}
                                hint="Created from the name. Edit only if you need a different address."
                            />
                            <Field label="Summary" errorKey={`areas.items.${a.id}.summary`} value={a.summary} max={200} rows={2} onChange={(v) => upd(edit, "areas", a.id, { summary: v })} />
                            <Field label="Detail text" errorKey={`areas.items.${a.id}.description`} value={a.description} max={1500} rows={4} onChange={(v) => upd(edit, "areas", a.id, { description: v })} />
                            <MediaField label="Cover picture" accept="image" mediaId={a.mediaId} onChange={(id) => upd(edit, "areas", a.id, { mediaId: id })} />
                        </div>
                    )}
                </Orderable>
                <ErrorLine errorKey="areas.items" />
                <AddButton disabled={items.length >= LIMITS.areas} onClick={() => edit((d) => { d.areas.items.push({ id: uid(), name: "", slug: "", slugAuto: true, summary: "", description: "", mediaId: null }); })}>Add testing area</AddButton>
            </div>
        </section>
    );
}

/* ---------- 3. Open Programmes and Calls ---------- */
function ProgrammesEditor() {
    const { form, edit, errors, openProgramme, askDelete } = useEd();
    const items = form.programmes.items;
    const [query, setQuery] = useState("");
    const [filter, setFilter] = useState("all");
    const [sort, setSort] = useState("manual");

    const areaName = (id) => form.areas.items.find((a) => a.id === id)?.name;
    const canReorder = sort === "manual" && filter === "all" && !query.trim();

    const rows = useMemo(() => {
        const q = query.trim().toLowerCase();
        let list = items.filter((p) => (filter === "all" || p.status === filter) && (!q || p.title.toLowerCase().includes(q) || (areaName(p.areaId) || "").toLowerCase().includes(q)));
        if (sort === "title") list = [...list].sort((a, b) => a.title.localeCompare(b.title));
        if (sort === "closing") list = [...list].sort((a, b) => (a.closeDate || "9999").localeCompare(b.closeDate || "9999"));
        if (sort === "opening") list = [...list].sort((a, b) => (b.openDate || "").localeCompare(a.openDate || ""));
        return list;
    }, [items, query, filter, sort, form.areas.items]);

    const drag = useDrag((from, to) => edit((d) => { d.programmes.items = moveIn(d.programmes.items, from, to); }));
    const counts = PROGRAMME_STATUS.map((s) => ({ ...s, n: items.filter((p) => p.status === s.value).length }));
    const hasError = (id) => Object.keys(errors).some((k) => k.startsWith(`programmes.items.${id}.`));
    const pos = (p) => items.findIndex((x) => x.id === p.id);

    return (
        <section className="po-card">
            <SectionHead sectionKey="programmes" />
            <SectionCopy sectionKey="programmes" />

            <div className="po-block">
                <BlockHead title="Button under the list" text="Sends visitors to the Apply to Participate form." />
                <div className="po-grid-2">
                    <Field label="Button text" errorKey="programmes.ctaLabel" value={form.programmes.ctaLabel} max={30} onChange={(v) => edit((d) => { d.programmes.ctaLabel = v; })} />
                    <Field label="Button link" errorKey="programmes.ctaUrl" value={form.programmes.ctaUrl} placeholder="/apply-to-participate" onChange={(v) => edit((d) => { d.programmes.ctaUrl = v; })} />
                </div>
            </div>

            <div className="po-block">
                <BlockHead
                    title="Programmes and calls"
                    text="Draft programmes stay hidden. Open and upcoming ones show with their dates and brief."
                    aside={<button type="button" className="po-btn-yellow is-small" onClick={() => openProgramme(null)}><Icon name="plus" size={15} /> Add programme</button>}
                />

                <div className="po-chips" role="group" aria-label="Filter by status">
                    <button type="button" className={filter === "all" ? "is-on" : ""} onClick={() => setFilter("all")}>All <b>{items.length}</b></button>
                    {counts.map((c) => <button key={c.value} type="button" className={filter === c.value ? "is-on" : ""} onClick={() => setFilter(c.value)}>{c.label} <b>{c.n}</b></button>)}
                </div>

                <div className="po-toolbar">
                    <label className="po-search">
                        <Icon name="search" size={16} />
                        <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search programmes or areas" aria-label="Search programmes" />
                    </label>
                    <select className="po-input po-select" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort programmes">
                        <option value="manual">Page order (drag to change)</option>
                        <option value="closing">Closing soonest</option>
                        <option value="opening">Newest opening date</option>
                        <option value="title">Title A to Z</option>
                    </select>
                </div>

                {rows.length === 0 ? (
                    <p className="po-empty">{items.length === 0 ? "No programmes yet. Add the first one." : "No programmes match your filters."}</p>
                ) : (
                    <ul className="po-list">
                        {rows.map((p, i) => {
                            const status = STATUS_BY[p.status] || STATUS_BY.draft;
                            const index = pos(p);
                            return (
                                <li key={p.id} className={`po-item po-prog ${canReorder && drag.over === i ? "is-over" : ""}`} {...(canReorder ? drag.rowProps(i) : {})}>
                                    {canReorder ? (
                                        <button type="button" className="po-handle" aria-label={`Drag ${p.title} to reorder`} title="Drag to reorder" {...drag.handleProps(i)}><Icon name="grip" size={16} /></button>
                                    ) : <span className="po-handle is-off" aria-hidden="true"><Icon name="grip" size={16} /></span>}
                                    <div className="po-prog-main">
                                        <strong>{p.featured && <span className="po-star" title="Featured"><Icon name="star" size={13} /></span>}{p.title || "Untitled programme"}</strong>
                                        <small>{[areaName(p.areaId), programmeMeta(p)].filter(Boolean).join(" · ")}</small>
                                    </div>
                                    {hasError(p.id) && <span className="po-badge-error" title="Needs attention">!</span>}
                                    <span className={`po-pill is-${status.tone}`}>{status.label}</span>
                                    <div className="po-item-tools">
                                        {canReorder && <>
                                            <button type="button" className="po-iconbtn" aria-label="Move up" title="Move up" disabled={i === 0} onClick={() => edit((d) => { d.programmes.items = moveIn(d.programmes.items, index, index - 1); })}><Icon name="up" size={15} /></button>
                                            <button type="button" className="po-iconbtn" aria-label="Move down" title="Move down" disabled={i === rows.length - 1} onClick={() => edit((d) => { d.programmes.items = moveIn(d.programmes.items, index, index + 1); })}><Icon name="down" size={15} /></button>
                                        </>}
                                        <button type="button" className="po-iconbtn" aria-label={`Edit ${p.title}`} title="Edit" onClick={() => openProgramme(p)}><Icon name="edit" size={15} /></button>
                                        <button type="button" className="po-iconbtn is-danger" aria-label={`Delete ${p.title}`} title="Delete (moves to Trash)" onClick={() => askDelete({ what: p.title || "this programme", extra: "", onConfirm: () => edit((d) => { d.programmes.items = d.programmes.items.filter((x) => x.id !== p.id); }) })}><Icon name="trash" size={15} /></button>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
                {!canReorder && items.length > 1 && <p className="po-hint">Reordering is available when the list is unfiltered and sorted by page order.</p>}
            </div>
        </section>
    );
}

/* the create / edit form for one programme (works on its own copy until "Save programme") */
function ProgrammeDrawer({ state, onClose, onSave }) {
    const { form, ...base } = useEd();
    const [draft, setDraft] = useState(() => clone(state.item));
    const [tried, setTried] = useState(false);
    const isNew = state.mode === "new";
    const set = (patch) => setDraft((d) => ({ ...d, ...patch }));

    const errs = useMemo(() => {
        const all = isNew ? [...form.programmes.items, draft] : form.programmes.items.map((x) => (x.id === draft.id ? draft : x));
        return programmeErrors(draft, all, "dr.");
    }, [draft, form.programmes.items, isNew]);

    useEffect(() => {
        const onKey = (e) => e.key === "Escape" && onClose();
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [onClose]);

    const shown = tried ? errs : {};
    const scoped = { form, ...base, errors: shown };

    const submit = () => {
        setTried(true);
        if (Object.keys(errs).length) {
            setTimeout(() => document.querySelector(".po-drawer .po-field.has-error")?.scrollIntoView({ behavior: "smooth", block: "center" }), 60);
            return;
        }
        onSave(draft, isNew);
    };

    const areaOptions = form.areas.items.map((a) => ({ value: a.id, label: a.name || "Untitled area" }));
    const wayOptions = form.ways.items.map((w) => ({ value: w.id, label: w.title || "Untitled way" }));

    return (
        <Ctx.Provider value={scoped}>
            <div className="po-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
                <aside className="po-drawer" role="dialog" aria-modal="true" aria-labelledby="po-drawer-title">
                    <header className="po-dialog-head">
                        <div>
                            <h2 id="po-drawer-title">{isNew ? "Add programme or call" : "Edit programme or call"}</h2>
                            <p>Saved to the page when you press Save programme. It goes live when you publish.</p>
                        </div>
                        <button type="button" className="po-iconbtn" aria-label="Close" onClick={onClose}><Icon name="close" size={18} /></button>
                    </header>

                    <div className="po-drawer-body">
                        <Field
                            label="Title"
                            errorKey="dr.title"
                            value={draft.title}
                            max={120}
                            onChange={(v) => setDraft((d) => ({ ...d, title: v, slug: d.slugAuto !== false ? slugify(v) : d.slug }))}
                        />
                        <Field label="Page address" prefix="/opportunities/programmes/" errorKey="dr.slug" value={draft.slug} onChange={(v) => set({ slug: slugify(v), slugAuto: false })} hint="Created from the title." />

                        <div className="po-grid-2">
                            <SelectField label="Status" errorKey="dr.status" value={draft.status} onChange={(v) => set({ status: v || "draft" })} options={PROGRAMME_STATUS.map((s) => ({ value: s.value, label: s.label }))} placeholder="Draft" hint="Draft is hidden from visitors." />
                            <SelectField label="Testing area" errorKey="dr.areaId" value={draft.areaId} onChange={(v) => set({ areaId: v })} options={areaOptions} placeholder="Not linked" />
                        </div>
                        <SelectField label="Way to participate" errorKey="dr.wayId" value={draft.wayId} onChange={(v) => set({ wayId: v })} options={wayOptions} placeholder="Not linked" />

                        <div className="po-grid-2">
                            <Field label="Opens on" type="date" errorKey="dr.openDate" value={draft.openDate} onChange={(v) => set({ openDate: v })} />
                            <Field label="Closes on" type="date" errorKey="dr.closeDate" value={draft.closeDate} onChange={(v) => set({ closeDate: v })} />
                        </div>

                        <Field label="Brief" errorKey="dr.brief" value={draft.brief} max={400} rows={3} onChange={(v) => set({ brief: v })} hint="What the programme will test and what participants will do." />
                        <Field label="Who can apply" errorKey="dr.eligibility" value={draft.eligibility} max={400} rows={2} onChange={(v) => set({ eligibility: v })} />
                        <MediaField label="Brief document" accept="document" mediaId={draft.documentId} onChange={(id) => setDraft((d) => ({ ...d, documentId: id }))} hint="A PDF visitors can download." />

                        <label className="po-check">
                            <input type="checkbox" checked={Boolean(draft.featured)} onChange={(e) => set({ featured: e.target.checked })} />
                            <span><strong>Featured programme</strong><small>Can be pinned on the Home page under Featured programmes.</small></span>
                        </label>
                    </div>

                    <footer className="po-drawer-foot">
                        {tried && Object.keys(errs).length > 0 && <span className="po-error"><Icon name="alert" size={13} /> Fix {Object.keys(errs).length} field{Object.keys(errs).length === 1 ? "" : "s"} to continue.</span>}
                        <div>
                            <button type="button" className="po-btn-outline" onClick={onClose}>Cancel</button>
                            <button type="button" className="po-btn-yellow" onClick={submit}>{isNew ? "Add programme" : "Save programme"}</button>
                        </div>
                    </footer>
                </aside>
            </div>
        </Ctx.Provider>
    );
}

/* ---------- 4. How to Participate ---------- */
function StepsEditor() {
    const { form, edit } = useEd();
    const items = form.steps.items;

    return (
        <section className="po-card">
            <SectionHead sectionKey="steps" />
            <SectionCopy sectionKey="steps" />

            <div className="po-block">
                <BlockHead title="Process steps" text="Shown in order. Step numbers follow the order of this list." aside={<span className="po-limit">{items.length} of {LIMITS.steps}</span>} />
                <Orderable
                    items={items}
                    nameOf={(s) => s.title || "step"}
                    onMove={(from, to) => edit((d) => { d.steps.items = moveIn(d.steps.items, from, to); })}
                    onRemove={(i) => edit((d) => { d.steps.items.splice(i, 1); })}
                    empty="No steps yet."
                >
                    {(s, i) => (
                        <div className="po-stack">
                            <span className="po-step-tag">Step {i + 1}</span>
                            <Field label="Title" errorKey={`steps.items.${s.id}.title`} value={s.title} max={80} onChange={(v) => upd(edit, "steps", s.id, { title: v })} />
                            <Field label="What happens" errorKey={`steps.items.${s.id}.description`} value={s.description} max={240} rows={2} onChange={(v) => upd(edit, "steps", s.id, { description: v })} />
                        </div>
                    )}
                </Orderable>
                <ErrorLine errorKey="steps.items" />
                <AddButton disabled={items.length >= LIMITS.steps} onClick={() => edit((d) => { d.steps.items.push({ id: uid(), title: "", description: "" }); })}>Add step</AddButton>
            </div>
        </section>
    );
}

/* ---------- 5. Participant Benefits ---------- */
function BenefitsEditor() {
    const { form, edit } = useEd();
    const items = form.benefits.items;

    return (
        <section className="po-card">
            <SectionHead sectionKey="benefits" />
            <SectionCopy sectionKey="benefits" />

            <div className="po-block">
                <BlockHead title="Benefits" text="What participants gain from taking part." aside={<span className="po-limit">{items.length} of {LIMITS.benefits}</span>} />
                <Orderable
                    items={items}
                    nameOf={(b) => b.title || "benefit"}
                    onMove={(from, to) => edit((d) => { d.benefits.items = moveIn(d.benefits.items, from, to); })}
                    onRemove={(i) => edit((d) => { d.benefits.items.splice(i, 1); })}
                    empty="No benefits yet."
                >
                    {(b) => (
                        <div className="po-stack">
                            <Field label="Title" errorKey={`benefits.items.${b.id}.title`} value={b.title} max={80} onChange={(v) => upd(edit, "benefits", b.id, { title: v })} />
                            <Field label="Description" errorKey={`benefits.items.${b.id}.description`} value={b.description} max={200} rows={2} onChange={(v) => upd(edit, "benefits", b.id, { description: v })} />
                            <IconPick value={b.icon} onChange={(v) => upd(edit, "benefits", b.id, { icon: v })} />
                        </div>
                    )}
                </Orderable>
                <ErrorLine errorKey="benefits.items" />
                <AddButton disabled={items.length >= LIMITS.benefits} onClick={() => edit((d) => { d.benefits.items.push({ id: uid(), title: "", description: "", icon: "star" }); })}>Add benefit</AddButton>
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
                    <p>How the Opportunities page looks in Google results and when someone shares the link.</p>
                </div>
            </header>

            <div className="po-block">
                <Field label="Page title" errorKey="seo.title" value={s.title} max={70} onChange={(v) => set({ title: v })} hint="Shown in the browser tab and search results." />
                <Field label="Search description" errorKey="seo.description" value={s.description} max={160} rows={3} onChange={(v) => set({ description: v })} />
                <MediaField label="Share image" accept="image" mediaId={s.mediaId} onChange={(id) => set({ mediaId: id })} hint="Shown when the link is shared on social media or chat." />
            </div>

            <div className="po-block">
                <BlockHead title="Search result preview" />
                <div className="po-serp">
                    <span>perlis-sandbox.my › opportunities</span>
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
                    <h2>Who changed the Opportunities page</h2>
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
                                        {h.changes.map((c, i) => (
                                            <div key={i}><span>{c.field}</span><del>{c.from}</del><ins>{c.to}</ins></div>
                                        ))}
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

function DraftPreview({ form, media, activeKey }) {
    const ref = useRef(null);

    useEffect(() => {
        const box = ref.current;
        if (!box) return;
        const target = box.querySelector(`[data-sec="${activeKey}"]`);
        if (target) box.scrollTo({ top: Math.max(0, target.offsetTop - 12), behavior: "smooth" });
    }, [activeKey]);

    const mediaOf = (id) => media.find((m) => m.id === id);
    const areaName = (id) => form.areas.items.find((a) => a.id === id)?.name;
    const wayName = (id) => form.ways.items.find((w) => w.id === id)?.title;
    const visibleProgrammes = form.programmes.items.filter((p) => p.status !== "draft");
    const hidden = (label) => <div className="po-pv-hidden">{label} is hidden from the page</div>;
    const head = (s) => (
        <header className="po-pv-head">
            <h2><Hl text={s.heading} /></h2>
            {s.intro && <p>{s.intro}</p>}
        </header>
    );

    return (
        <div className="po-pv-scroll" ref={ref}>
            <div className="po-pv">
                {/* 1 */}
                <section data-sec="ways" className={`po-pv-sec ${activeKey === "ways" ? "is-active" : ""}`}>
                    {form.ways.visible ? (
                        <>
                            {head(form.ways)}
                            <div className="po-pv-cards">
                                {form.ways.items.map((w) => (
                                    <article key={w.id}><span className="po-pv-icon"><Glyph name={w.icon} size={20} /></span><strong>{w.title || "Untitled"}</strong><p>{w.description}</p></article>
                                ))}
                            </div>
                        </>
                    ) : hidden("Ways to Participate")}
                </section>

                {/* 2 */}
                <section data-sec="areas" className={`po-pv-sec is-dark ${activeKey === "areas" ? "is-active" : ""}`}>
                    {form.areas.visible ? (
                        <>
                            {head(form.areas)}
                            <div className="po-pv-areas">
                                {form.areas.items.map((a) => {
                                    const cover = mediaOf(a.mediaId);
                                    return (
                                        <article key={a.id} style={cover ? { backgroundImage: `linear-gradient(180deg, rgba(11,26,40,.35), rgba(11,26,40,.92)), url("${thumbOf(cover)}")` } : undefined}>
                                            <strong>{a.name || "Untitled"}</strong>
                                            <p>{a.summary}</p>
                                        </article>
                                    );
                                })}
                            </div>
                        </>
                    ) : hidden("Testing and Innovation Areas")}
                </section>

                {/* 3 */}
                <section data-sec="programmes" className={`po-pv-sec ${activeKey === "programmes" ? "is-active" : ""}`}>
                    {form.programmes.visible ? (
                        <>
                            {head(form.programmes)}
                            {visibleProgrammes.length === 0 && <p className="po-pv-none">No open programmes or calls right now.</p>}
                            <div className="po-pv-progs">
                                {visibleProgrammes.map((p, i) => {
                                    const doc = mediaOf(p.documentId);
                                    return (
                                        <article key={p.id} className={p.status === "closed" ? "is-closed" : ""}>
                                            <b>{String(i + 1).padStart(2, "0")}</b>
                                            <div>
                                                <div className="po-pv-prog-top">
                                                    <strong>{p.title || "Untitled"}</strong>
                                                    <span className={`po-pill is-${STATUS_BY[p.status]?.tone || "info"}`}>{STATUS_BY[p.status]?.label}</span>
                                                </div>
                                                <small>{[areaName(p.areaId), wayName(p.wayId)].filter(Boolean).join(" · ")}</small>
                                                <p>{p.brief}</p>
                                                <div className="po-pv-prog-meta">
                                                    <span>{programmeMeta(p)}</span>
                                                    {p.eligibility && <span>For: {p.eligibility}</span>}
                                                    {doc && <span className="po-pv-doc"><Icon name="doc" size={12} /> {doc.name}</span>}
                                                </div>
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>
                            <div className="po-pv-btns"><span>{form.programmes.ctaLabel}</span></div>
                        </>
                    ) : hidden("Open Programmes and Calls")}
                </section>

                {/* 4 */}
                <section data-sec="steps" className={`po-pv-sec is-dark ${activeKey === "steps" ? "is-active" : ""}`}>
                    {form.steps.visible ? (
                        <>
                            {head(form.steps)}
                            <ol className="po-pv-steps">
                                {form.steps.items.map((s, i) => (
                                    <li key={s.id}><b>{i + 1}</b><div><strong>{s.title || "Untitled"}</strong><p>{s.description}</p></div></li>
                                ))}
                            </ol>
                        </>
                    ) : hidden("How to Participate")}
                </section>

                {/* 5 */}
                <section data-sec="benefits" className={`po-pv-sec ${activeKey === "benefits" ? "is-active" : ""}`}>
                    {form.benefits.visible ? (
                        <>
                            {head(form.benefits)}
                            <div className="po-pv-cards">
                                {form.benefits.items.map((b) => (
                                    <article key={b.id}><span className="po-pv-icon"><Glyph name={b.icon} size={20} /></span><strong>{b.title || "Untitled"}</strong><p>{b.description}</p></article>
                                ))}
                            </div>
                        </>
                    ) : hidden("Participant Benefits")}
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
                    <iframe key={reloadKey} className="po-iframe" src={liveUrl} title="Live Opportunities page" loading="lazy" />
                )}
            </div>
        </aside>
    );
}

/* ====================================================================
   PAGE
==================================================================== */

export default function AdminPSBOpportunities() {
    const { props, url } = usePage();
    const live = Boolean(props.opportunities?.content);
    const liveUrl = props.opportunities?.liveUrl || DEFAULT_LIVE_URL;

    const seed = useRef(
        live
            ? { content: props.opportunities.content, meta: props.opportunities.meta, catalog: props.opportunities.catalog, history: props.opportunities.history || [] }
            : { content: sampleContent, meta: sampleMeta, catalog: sampleCatalog, history: sampleHistory }
    ).current;

    const [saved, setSaved] = useState(() => clone(seed.content));
    const [form, setForm] = useState(() => clone(seed.content));
    const [meta, setMeta] = useState(seed.meta);
    const [localHistory, setLocalHistory] = useState(seed.history);
    const [mediaList, setMediaList] = useState(seed.catalog.media);

    const media = live ? [...mediaList, ...(props.opportunities.catalog.media || []).filter((m) => !mediaList.some((x) => x.id === m.id))] : mediaList;
    const history = live ? props.opportunities.history || [] : localHistory;

    const [tab, setTab] = useState("content");
    const [active, setActive] = useState(() => {
        const wanted = props.section || SECTIONS.find((s) => (url || "").includes(`/opportunities/${s.route}`))?.route;
        const i = SECTIONS.findIndex((s) => s.route === wanted);
        return i >= 0 ? i : 0;
    });
    const [showPreview, setShowPreview] = useState(true);
    const [reloadKey, setReloadKey] = useState(0);
    const [submitted, setSubmitted] = useState(false);
    const [busy, setBusy] = useState(false);
    const [dialog, setDialog] = useState(null); // { type: publish | schedule | unpublish | delete, ... }
    const [picker, setPicker] = useState(null);
    const [drawer, setDrawer] = useState(null); // { mode: new | edit, item }
    const [menu, setMenu] = useState(false);
    const [toast, setToast] = useState(null);
    const [scheduleAt, setScheduleAt] = useState("");
    const busyRef = useRef(false);
    const menuRef = useRef(null);

    useEffect(() => { if (live) setMeta(props.opportunities.meta); }, [live, props.opportunities?.meta]);

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

    /* warn before leaving with unsaved changes */
    useEffect(() => {
        const beforeUnload = (e) => { if (dirty) { e.preventDefault(); e.returnValue = ""; } };
        window.addEventListener("beforeunload", beforeUnload);
        const off = router.on("before", () => {
            if (dirty && !busyRef.current && !window.confirm("You have unsaved changes. Leave this page and discard them?")) return false;
            return undefined;
        });
        return () => { window.removeEventListener("beforeunload", beforeUnload); if (typeof off === "function") off(); };
    }, [dirty]);

    const edit = (fn) => setForm((f) => { const copy = clone(f); fn(copy); return copy; });
    const askDelete = (info) => setDialog({ type: "delete", ...info });
    const pickMedia = (opts) => setPicker(opts);
    const openProgramme = (item) => setDrawer(item ? { mode: "edit", item } : { mode: "new", item: { id: uid(), title: "", slug: "", slugAuto: true, status: "draft", areaId: null, wayId: null, openDate: "", closeDate: "", brief: "", eligibility: "", documentId: null, featured: false } });

    const addHistory = (action, label, changes = []) =>
        setLocalHistory((h) => [{ id: Date.now(), user: "You", action, label, at: new Date().toISOString(), changes }, ...h]);
    const diffs = () => changedLabels.map((l) => ({ field: l, from: "Previous version", to: "Updated" }));
    const finishBusy = () => { setBusy(false); busyRef.current = false; };

    const jumpToFirstError = () => {
        const first = Object.keys(allErrors)[0];
        if (!first) return;
        const key = sectionOfKey(first);
        if (key === "seo") { setTab("seo"); return; }
        setTab("content");
        setActive(SECTIONS.findIndex((s) => s.key === key));
        const match = first.match(/^programmes\.items\.([^.]+)\./);
        if (match) {
            const item = form.programmes.items.find((p) => p.id === match[1]);
            if (item) { setDrawer({ mode: "edit", item }); return; }
        }
        setTimeout(() => document.querySelector(".po-editor .po-field.has-error")?.scrollIntoView({ behavior: "smooth", block: "center" }), 80);
    };

    const saveProgramme = (item, isNew) => {
        edit((d) => {
            if (isNew) d.programmes.items.push(item);
            else d.programmes.items = d.programmes.items.map((p) => (p.id === item.id ? item : p));
        });
        setDrawer(null);
        setToast({ tone: "ok", text: isNew ? `“${item.title}” added. It goes live when you publish.` : `“${item.title}” updated. It goes live when you publish.` });
    };

    /* ---- actions ---- */
    const saveDraft = () => {
        if (!dirty || busy) return;
        setBusy(true); busyRef.current = true;
        const done = () => {
            setSaved(clone(form));
            setMeta((m) => ({ ...m, hasUnpublishedChanges: m.status === "published" ? true : m.hasUnpublishedChanges, updatedBy: "You", updatedAt: new Date().toISOString() }));
            if (!live) addHistory("UPDATE", changedLabels.join(", ") || "Opportunities page", diffs());
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
            if (!live) addHistory(type === "unpublish" ? "UNPUBLISH" : "PUBLISH", "Opportunities page", type === "unpublish" ? [] : diffs());
            setDialog(null);
            setSubmitted(false);
            setReloadKey((k) => k + 1);
            setToast({ tone: "ok", text: type === "publish" ? "Published. Visitors now see these changes." : type === "schedule" ? `Scheduled for ${formatDate(at)}.` : "Unpublished. The Opportunities page is no longer public." });
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
        setToast({ tone: "ok", text: `“${dialog.what}” moved to Trash. It leaves the page when you publish.` });
    };

    const uploadMedia = (file) => {
        const type = file.type.startsWith("video") ? "video" : file.type.startsWith("image") ? "image" : "document";
        const local = { id: Date.now(), name: file.name, type, alt: "", size: `${(file.size / 1048576).toFixed(1)} MB`, url: type === "image" ? URL.createObjectURL(file) : null };
        if (live) {
            router.post(ENDPOINTS.upload, { file }, { forceFormData: true, preserveScroll: true, onSuccess: () => setToast({ tone: "ok", text: `${file.name} uploaded.` }), onError: () => setToast({ tone: "error", text: "The file could not be uploaded." }) });
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

    const ctx = { form, edit, errors, media, askDelete, pickMedia, openProgramme };
    const Editor = [WaysEditor, AreasEditor, ProgrammesEditor, StepsEditor, BenefitsEditor][active];

    const statusTone = meta.status === "published" ? "ok" : meta.status === "scheduled" ? "warn" : "off";
    const statusText = meta.status === "published" ? "Published" : meta.status === "scheduled" ? `Scheduled · ${formatDate(meta.scheduledAt)}` : "Draft";
    const deleteExtra = dialog?.type === "delete" ? dialog.extra : "";

    return (
        <Ctx.Provider value={ctx}>
            <div className="po">
                <div className="po-heading">
                    <div>
                        <h1>Opportunities</h1>
                        <p>Manage how visitors can take part: ways to participate, testing areas, open calls, the process and the benefits.</p>
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
                    <p className="po-note"><Icon name="alert" size={16} /><span>Sample data. Every control works, but nothing is stored until your controller sends the <b>opportunities</b> prop.</span></p>
                )}

                <div className="po-tabs" role="tablist" aria-label="Opportunities editor">
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
                        <nav className="po-sections" aria-label="Opportunities sections">
                            {SECTIONS.map((s, i) => {
                                const errs = errorCountFor(s.key);
                                return (
                                    <button key={s.key} type="button" className={`po-section-pill ${active === i ? "is-active" : ""}`} aria-current={active === i ? "true" : undefined} onClick={() => setActive(i)}>
                                        <span className="po-section-no">{i + 1}</span>
                                        <span className="po-section-text"><strong>{s.label}</strong><small>{form[s.key].visible ? `${form[s.key].items.length} ${s.noun}${form[s.key].items.length === 1 ? "" : "s"}` : "Hidden from page"}</small></span>
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

                {/* dialogs */}
                {dialog?.type === "delete" && (
                    <div className="po-overlay" onMouseDown={(e) => e.target === e.currentTarget && setDialog(null)}>
                        <div className="po-dialog po-small" role="alertdialog" aria-modal="true" aria-labelledby="po-del-title">
                            <span className="po-dialog-icon is-danger"><Icon name="trash" size={22} /></span>
                            <h2 id="po-del-title">Delete “{dialog.what}”?</h2>
                            <p>It moves to Content Trash, where only the Super Admin can restore or purge it. It disappears from the page when you publish.</p>
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
                            <h2 id="po-act-title">{dialog.type === "publish" ? "Publish the Opportunities page?" : dialog.type === "schedule" ? "Schedule publication" : "Unpublish the Opportunities page?"}</h2>
                            {dialog.type === "unpublish" ? (
                                <p>Visitors will no longer see the Opportunities page until you publish it again. Nothing is deleted.</p>
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

                {drawer && <ProgrammeDrawer key={drawer.item.id} state={drawer} onClose={() => setDrawer(null)} onSave={saveProgramme} />}
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

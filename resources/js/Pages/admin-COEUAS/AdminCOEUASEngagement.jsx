import { createContext, useContext, useEffect, useId, useMemo, useRef, useState } from "react";
import { router, usePage } from "@inertiajs/react";
import "../../../css/admin-COEUAS-css/admin-engagement.css";

/* ====================================================================
   COE-UAS ADMIN → ENGAGEMENT EDITOR                /admin/coeuas/engagement/*

   Site map 1.3 (COE-UAS workspace → "Engagement"), one editor for five modules:
     1  Networking and linkages                  → network_linkages + member_linkages        (/engagement/linkages)
     2  Membership and affiliations              → affiliations                              (/engagement/affiliations)
     3  News and activities                      → posts (news, announcement, activity)      (/engagement/news)
     4  Media gallery and press coverage         → gallery_albums + gallery_items, and posts (media_coverage)  (/engagement/gallery)
     5  Brochures and presentation materials     → documents (brochure, presentation, other) (/engagement/brochures)
   Use case 2.3: "Manage Networking and Linkages", "Manage Membership and Affiliations",
   "Manage News and Activities", "Manage Media Gallery and Coverage", "Manage Brochures and Documents".
   Common screens: list with search / filter / sort, create / edit, preview, publish / unpublish / schedule,
   delete to Trash, link picker (members), History tab (audit_logs).
   Public page: ENGAGEMENT (linkages, membership, news, gallery, collaborate).

   SHARED TABLES: posts, gallery_albums, gallery_items and documents carry site_id.
   The controller must set it to the COEUAS site and only return COEUAS rows.

   ADDITIONS TO THE ERD (needed for "draft, preview and publish"):
     network_linkages, affiliations and gallery_albums get `is_published` BOOLEAN.
     posts already has status (draft, scheduled, published, archived).
     documents already has is_public + published_at; `isPublic` is used as the publish switch.
   Media coverage is stored as posts with post_type = media_coverage (title, external_url, published_at).

   SAMPLE DATA: works today (changes stay on screen only). Return an Inertia prop named
   `engagement` and it switches to LIVE mode:

   Inertia::render('admin-COEUAS/AdminCOEUASEngagement', [
       'view' => 'linkages',   // optional: linkages | affiliations | news | gallery | brochures
       'engagement' => [
           'data'    => ['linkages' => [], 'affiliations' => [], 'posts' => [], 'albums' => [], 'documents' => []], // same shape as `sampleData`
           'catalog' => ['media' => [...], 'members' => [...], 'categories' => [...], 'events' => [...]],
           'history' => [...],    // audit_logs rows
           'previewUrl' => 'https://...',
       ],
   ]);

   Send the same prop for all five sidebar routes. Save sends only the collections that changed:
   PUT /admin/coeuas/engagement  { linkages?, affiliations?, posts?, albums?, documents? }
   albums carry their `items` (gallery_items); linkages carry `members` (member_linkages).
   The controller must write audit_logs and soft-delete (deleted_at) removed records.
==================================================================== */

const BASE = "/admin/coeuas"; // keep in sync with coeuasRoutes.js
const ENDPOINTS = { save: `${BASE}/engagement`, upload: `${BASE}/media/upload` };
const PAGE = 8;
const MIN = 60 * 1000;
const NOW = Date.now();
const minsAgo = (m) => new Date(NOW - m * MIN).toISOString();
let counter = 0;
const uid = () => `n${Date.now().toString(36)}${(counter += 1)}`;

/* enums from the ERD */
const LINK_TYPES = [
    { value: "university", label: "University" }, { value: "government", label: "Government" }, { value: "industry", label: "Industry" },
    { value: "international", label: "International" }, { value: "agreement", label: "Agreement" }, { value: "consortium", label: "Consortium" },
];
const AFFIL_TYPES = [{ value: "institutional", label: "Institutional" }, { value: "professional", label: "Professional" }, { value: "coe_scheme", label: "COE scheme" }];
const NEWS_TYPES = [{ value: "news", label: "News" }, { value: "announcement", label: "Announcement" }, { value: "activity", label: "Activity" }];
const POST_STATUS = [{ value: "draft", label: "Draft" }, { value: "scheduled", label: "Scheduled" }, { value: "published", label: "Published" }, { value: "archived", label: "Archived" }];
const DOC_TYPES = [{ value: "brochure", label: "Brochure" }, { value: "presentation", label: "Presentation" }, { value: "other", label: "Other" }];

const flag = (f) => ({ live: (x) => Boolean(x[f]), state: (x) => (x[f] ? ["Published", "is-ok"] : ["Draft", "is-off"]), set: (x, v) => { x[f] = v; } });
const postPub = { live: (x) => x.status === "published", state: (x) => [labelOf(POST_STATUS, x.status), { published: "is-ok", scheduled: "is-info", archived: "is-off", draft: "is-warn" }[x.status]], statusField: true };
const nowLocal = () => new Date(Date.now() - new Date().getTimezoneOffset() * MIN).toISOString().slice(0, 16);

/* One config per module: list, cards, filters, validation and preview all read from it. */
const MODULES = {
    linkages: {
        key: "linkages", dataKey: "linkages", tab: "Linkages", title: "Networking and linkages", text: "Universities, agencies, industry partners and agreements the centre works with.",
        noun: "linkage", add: "Add linkage", nameKey: "orgName", typeField: "linkType", typeOpts: () => LINK_TYPES, allTypes: "All link types",
        mediaKey: "logoId", mediaLabel: "Logo", mediaType: "image", pub: flag("isPublished"), extra: "members",
        sub: (x) => `${labelOf(LINK_TYPES, x.linkType)}${x.country ? ` · ${x.country}` : ""}`,
        blank: () => ({ id: uid(), logoId: null, linkType: "university", orgName: "", country: "", description: "", startYear: "", endYear: "", isPublished: false, members: [] }),
        fields: [
            { k: "orgName", label: "Organisation" }, { k: "linkType", label: "Type", opts: LINK_TYPES }, { k: "country", label: "Country" },
            { k: "startYear", label: "From (year)", type: "number" }, { k: "endYear", label: "Until (year)", type: "number", hint: "Leave empty if ongoing" },
            { k: "description", label: "Description", rows: 4, wide: true },
        ],
    },
    affiliations: {
        key: "affiliations", dataKey: "affiliations", tab: "Affiliations", title: "Membership and affiliations", text: "Institutional, professional and COE scheme memberships.",
        noun: "affiliation", add: "Add affiliation", nameKey: "bodyName", typeField: "affiliationType", typeOpts: () => AFFIL_TYPES, allTypes: "All types",
        mediaKey: "logoId", mediaLabel: "Logo", mediaType: "image", pub: flag("isPublished"),
        sub: (x) => `${labelOf(AFFIL_TYPES, x.affiliationType)}${x.sinceYear ? ` · since ${x.sinceYear}` : ""}`,
        blank: () => ({ id: uid(), logoId: null, bodyName: "", affiliationType: "institutional", sinceYear: "", description: "", isPublished: false }),
        fields: [
            { k: "bodyName", label: "Body name" }, { k: "affiliationType", label: "Type", opts: AFFIL_TYPES }, { k: "sinceYear", label: "Member since (year)", type: "number" },
            { k: "description", label: "Description", rows: 4, wide: true },
        ],
    },
    news: {
        key: "news", dataKey: "posts", tab: "News", title: "News and activities", text: "News, announcements and activities. Pick Scheduled to publish on a date.",
        noun: "post", add: "Add post", nameKey: "title", typeField: "postType", typeOpts: () => NEWS_TYPES, allTypes: "All types", dateKey: "publishedAt",
        scope: (x) => x.postType !== "media_coverage", mediaKey: "coverId", mediaLabel: "Cover image", mediaType: "image", pub: postPub,
        sub: (x) => `${labelOf(NEWS_TYPES, x.postType)}${x.publishedAt ? ` · ${fmtDate(x.publishedAt.slice(0, 10))}` : ""}`,
        blank: () => ({ id: uid(), coverId: null, categoryId: null, postType: "news", title: "", slug: "", excerpt: "", body: "", externalUrl: "", status: "draft", publishedAt: "" }),
        fields: [
            { k: "title", label: "Title" }, { k: "slug", label: "Web address (slug)", hint: (x) => `/news/${x.slug || "…"}` },
            { k: "postType", label: "Type", opts: NEWS_TYPES }, { k: "categoryId", label: "Category", optsFn: (c) => [{ value: "", label: "No category" }, ...c.categories.map((o) => ({ value: o.id, label: o.name }))] },
            { k: "status", label: "Status", opts: POST_STATUS }, { k: "publishedAt", label: "Publish date", type: "datetime-local", show: (x) => x.status === "scheduled" || x.status === "published", hint: (x) => (x.status === "scheduled" ? "The post goes live at this time" : undefined) },
            { k: "excerpt", label: "Excerpt", rows: 2, wide: true, hint: () => "Shown on the news list" }, { k: "body", label: "Body", rows: 8, wide: true },
            { k: "externalUrl", label: "External link (optional)", wide: true, hint: () => "Use when the full story lives on another site" },
        ],
    },
    albums: {
        key: "albums", dataKey: "albums", tab: "Albums", title: "Media gallery", text: "Photo and video albums. The first item is the album cover unless you choose one.",
        noun: "album", add: "Add album", nameKey: "title", typeField: null, typeOpts: () => [], allTypes: "", mediaKey: "coverId", mediaLabel: "Cover image", mediaType: "image", pub: flag("isPublished"), extra: "items",
        sub: (x) => `${x.items.length} item${x.items.length === 1 ? "" : "s"}`,
        blank: () => ({ id: uid(), coverId: null, eventId: null, title: "", description: "", isPublished: false, items: [] }),
        fields: [
            { k: "title", label: "Album title" }, { k: "eventId", label: "Linked event", optsFn: (c) => [{ value: "", label: "No event" }, ...c.events.map((o) => ({ value: o.id, label: o.name }))] },
            { k: "description", label: "Description", rows: 3, wide: true },
        ],
    },
    coverage: {
        key: "coverage", dataKey: "posts", tab: "Press coverage", title: "Press coverage", text: "Mentions of the centre in the media. Each item links to the original article.",
        noun: "item", add: "Add coverage", nameKey: "title", typeField: null, typeOpts: () => [], allTypes: "", dateKey: "publishedAt",
        scope: (x) => x.postType === "media_coverage", mediaKey: "coverId", mediaLabel: "Cover image", mediaType: "image", pub: postPub,
        sub: (x) => `${x.publishedAt ? fmtDate(x.publishedAt.slice(0, 10)) : "No date"}${x.externalUrl ? ` · ${host(x.externalUrl)}` : ""}`,
        blank: () => ({ id: uid(), coverId: null, categoryId: null, postType: "media_coverage", title: "", slug: "", excerpt: "", body: "", externalUrl: "", status: "draft", publishedAt: "" }),
        fields: [
            { k: "title", label: "Headline" }, { k: "slug", label: "Web address (slug)", hint: (x) => `/press/${x.slug || "…"}` },
            { k: "externalUrl", label: "Link to the article", wide: true, hint: () => "Required to publish. Start with https://" },
            { k: "status", label: "Status", opts: POST_STATUS }, { k: "publishedAt", label: "Date of coverage", type: "datetime-local" },
            { k: "excerpt", label: "Summary", rows: 3, wide: true },
        ],
    },
    brochures: {
        key: "brochures", dataKey: "documents", tab: "Documents", title: "Brochures and presentation materials", text: "Files visitors can download. Only public documents appear on the website.",
        noun: "document", add: "Add document", nameKey: "title", typeField: "docCategory", typeOpts: () => DOC_TYPES, allTypes: "All kinds", dateKey: "publishedAt",
        mediaKey: "mediaId", mediaLabel: "File", mediaType: "document", pub: flag("isPublic"),
        sub: (x) => `${labelOf(DOC_TYPES, x.docCategory)}${x.versionLabel ? ` · ${x.versionLabel}` : ""}`,
        blank: () => ({ id: uid(), mediaId: null, title: "", docCategory: "brochure", versionLabel: "", isPublic: false, publishedAt: "" }),
        fields: [{ k: "title", label: "Title" }, { k: "docCategory", label: "Kind", opts: DOC_TYPES }, { k: "versionLabel", label: "Version", hint: () => "For example v2.1 or 2026 edition" }],
    },
};
const VIEWS = [
    { key: "linkages", title: "Networking and linkages", text: MODULES.linkages.text, mods: ["linkages"] },
    { key: "affiliations", title: "Membership and affiliations", text: MODULES.affiliations.text, mods: ["affiliations"] },
    { key: "news", title: "News and activities", text: MODULES.news.text, mods: ["news"] },
    { key: "gallery", title: "Media gallery and press coverage", text: "Photo and video albums, and mentions of the centre in the press.", mods: ["albums", "coverage"] },
    { key: "brochures", title: "Brochures and presentation materials", text: MODULES.brochures.text, mods: ["brochures"] },
];
const KEY_LABEL = { linkages: "Linkages", affiliations: "Affiliations", posts: "News and coverage", albums: "Gallery albums", documents: "Documents" };
const DATA_KEYS = Object.keys(KEY_LABEL);

/* ------------------------------ sample data ------------------------------ */

const sampleData = {
    linkages: [
        { id: 1, logoId: null, linkType: "university", orgName: "Partner university, Japan", country: "Japan", description: "Joint research on detect-and-avoid and student exchange.", startYear: 2019, endYear: "", isPublished: true, members: [{ id: 1, role: "Lead contact" }] },
        { id: 2, logoId: null, linkType: "government", orgName: "Civil Aviation Authority of Malaysia", country: "Malaysia", description: "Advises on safety cases for trials.", startYear: 2016, endYear: "", isPublished: true, members: [{ id: 3, role: "Technical liaison" }] },
        { id: 3, logoId: null, linkType: "consortium", orgName: "Regional aerospace consortium", country: "", description: "", startYear: "", endYear: "", isPublished: false, members: [] },
    ],
    affiliations: [
        { id: 1, logoId: null, bodyName: "Board of Engineers Malaysia", affiliationType: "professional", sinceYear: 2014, description: "Recognises the centre's engineering programmes.", isPublished: true },
        { id: 2, logoId: null, bodyName: "Higher Centre of Excellence scheme", affiliationType: "coe_scheme", sinceYear: 2013, description: "", isPublished: false },
    ],
    posts: [
        { id: 1, coverId: 3, categoryId: 1, postType: "news", title: "Centre completes first beyond-line-of-sight trial", slug: "first-bvlos-trial", excerpt: "A 12 km flight over Perlis marks a first for the centre.", body: "The trial ran for two days and tested the new detect-and-avoid unit.", externalUrl: "", status: "published", publishedAt: "2026-10-20T09:00" },
        { id: 2, coverId: null, categoryId: null, postType: "activity", title: "Open day for secondary schools", slug: "school-open-day", excerpt: "Hands-on drone demos for 200 students.", body: "", externalUrl: "", status: "scheduled", publishedAt: "2026-12-02T08:00" },
        { id: 3, coverId: null, categoryId: null, postType: "announcement", title: "Call for postgraduate applications", slug: "pg-call", excerpt: "", body: "", externalUrl: "", status: "draft", publishedAt: "" },
        { id: 4, coverId: null, categoryId: null, postType: "media_coverage", title: "Perlis drone corridor makes national news", slug: "perlis-drone-corridor-news", excerpt: "Coverage of the airspace corridor study.", body: "", externalUrl: "https://news.example.com/perlis-drone-corridor", status: "published", publishedAt: "2026-09-14T00:00" },
        { id: 5, coverId: null, categoryId: null, postType: "media_coverage", title: "Interview with the centre director", slug: "director-interview", excerpt: "", body: "", externalUrl: "", status: "draft", publishedAt: "" },
    ],
    albums: [
        { id: 1, coverId: null, eventId: 1, title: "Flight trial week", description: "Photos from the trial week at the test range.", isPublished: true, items: [{ id: 1, mediaId: 3, caption: "Launch preparation", videoUrl: "" }, { id: 2, mediaId: null, caption: "Highlights video", videoUrl: "https://video.example.com/trial-week" }] },
        { id: 2, coverId: null, eventId: null, title: "Open day 2025", description: "", isPublished: false, items: [] },
    ],
    documents: [
        { id: 1, mediaId: 4, title: "Centre brochure 2026", docCategory: "brochure", versionLabel: "2026 edition", isPublic: true, publishedAt: "2026-08-01T00:00" },
        { id: 2, mediaId: null, title: "Capabilities presentation", docCategory: "presentation", versionLabel: "v1.3", isPublic: false, publishedAt: "" },
    ],
};
const sampleCatalog = {
    media: [
        { id: 1, name: "range-aerial.jpg", type: "image", alt: "Aerial view of the range", size: "1.4 MB", url: null },
        { id: 2, name: "open-day.jpg", type: "image", alt: "Open day", size: "0.8 MB", url: null },
        { id: 3, name: "bvlos-launch.jpg", type: "image", alt: "Launch preparation", size: "1.1 MB", url: null },
        { id: 4, name: "centre-brochure-2026.pdf", type: "document", alt: "", size: "3.2 MB", url: null },
        { id: 5, name: "capabilities-v1-3.pptx", type: "document", alt: "", size: "5.6 MB", url: null },
    ],
    members: [{ id: 1, name: "Prof. Dr. Ahmad Zaki" }, { id: 2, name: "Dr. Nurul Huda" }, { id: 3, name: "Ir. Dr. Faizal Karim" }],
    categories: [{ id: 1, name: "Research" }, { id: 2, name: "Training" }],
    events: [{ id: 1, name: "Flight trial week 2026" }, { id: 2, name: "Open day 2025" }],
};
const sampleHistory = [
    { id: 2, user: "Aisyah Rahman", action: "PUBLISH", label: "News and coverage", at: minsAgo(60 * 30), changes: [{ field: "Status", from: "draft", to: "published" }] },
    { id: 1, user: "Hafiz Roslan", action: "CREATE", label: "Linkages", at: minsAgo(60 * 24 * 6), changes: [] },
];

/* ------------------------------- helpers -------------------------------- */

const clone = (v) => JSON.parse(JSON.stringify(v));
const sameJson = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const slugify = (s = "") => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const labelOf = (list, value) => list.find((o) => o.value === value)?.label || value || "";
const idEq = (a, b) => String(a) === String(b);
const isUrl = (v) => /^(https?:\/\/)[^\s.]+\.[^\s]{2,}$/i.test(v);
const host = (u) => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return ""; } };
const fmtDate = (iso) => { if (!iso) return ""; const d = new Date(`${iso.slice(0, 10)}T00:00:00`); return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }); };
const toYear = (v) => (v === "" ? "" : Number(v));

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
/* Drafts only need a name or title. Published records must be complete. */

function validate(d) {
    const e = {};
    const need = (key, value, msg) => { if (!String(value ?? "").trim()) e[key] = msg; };
    const years = (k, s, en) => { if (s !== "" && en !== "" && Number(en) < Number(s)) e[k] = "The end year is before the start year."; };

    d.linkages.forEach((l) => {
        const k = (x) => `linkages.${l.id}.${x}`;
        need(k("orgName"), l.orgName, "Write the organisation name.");
        years(k("endYear"), l.startYear, l.endYear);
        if (l.isPublished) need(k("description"), l.description, "Add a description before publishing.");
    });
    d.affiliations.forEach((a) => {
        const k = (x) => `affiliations.${a.id}.${x}`;
        need(k("bodyName"), a.bodyName, "Write the name of the body.");
        if (a.isPublished) need(k("description"), a.description, "Add a description before publishing.");
    });
    const slugs = new Set();
    d.posts.forEach((p) => {
        const k = (x) => `posts.${p.id}.${x}`;
        const coverage = p.postType === "media_coverage";
        need(k("title"), p.title, coverage ? "Write the headline." : "Write the title.");
        need(k("slug"), p.slug, "Add a web address.");
        if (p.slug) { if (slugs.has(p.slug)) e[k("slug")] = "This web address is already used by another post."; slugs.add(p.slug); }
        if (p.externalUrl && !isUrl(p.externalUrl)) e[k("externalUrl")] = "Use a full link, starting with https://";
        if (p.status === "scheduled") need(k("publishedAt"), p.publishedAt, "Choose when the post goes live.");
        if (p.status === "published") {
            if (coverage) need(k("externalUrl"), p.externalUrl, "Add the link to the article before publishing.");
            else if (!p.excerpt.trim() && !p.body.trim()) e[k("excerpt")] = "Add an excerpt or body before publishing.";
        }
    });
    d.albums.forEach((a) => {
        const k = (x) => `albums.${a.id}.${x}`;
        need(k("title"), a.title, "Write the album title.");
        if (a.isPublished && a.items.length === 0) e[k("items")] = "Add at least one photo or video before publishing.";
        a.items.forEach((it) => {
            if (!it.mediaId && !it.videoUrl) e[k(`item.${it.id}.media`)] = "Choose a photo or add a video link.";
            if (it.videoUrl && !isUrl(it.videoUrl)) e[k(`item.${it.id}.video`)] = "Use a full link, starting with https://";
        });
    });
    d.documents.forEach((x) => {
        const k = (f) => `documents.${x.id}.${f}`;
        need(k("title"), x.title, "Write the document title.");
        if (x.isPublic && !x.mediaId) e[k("mediaId")] = "Choose the file before making it public.";
    });
    return e;
}

/* where an error key lives, so Save can jump to it */
function locate(key, data) {
    const [dk, id] = key.split(".");
    if (dk === "posts") { const p = data.posts.find((x) => idEq(x.id, id)); return { view: p?.postType === "media_coverage" ? "gallery" : "news", tab: p?.postType === "media_coverage" ? "coverage" : "news", id }; }
    if (dk === "albums") return { view: "gallery", tab: "albums", id };
    if (dk === "documents") return { view: "brochures", tab: "brochures", id };
    return { view: dk, tab: dk, id };
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
        file: (<><path d="M6 3h8l4 4v14H6z" /><path d="M14 3v4h4M9 13h6M9 17h6" /></>),
        search: (<><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>),
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
    const cls = `ceg-field ${error ? "has-error" : ""} ${wide ? "is-wide" : ""}`;
    if (opts) {
        return (
            <label className={cls}>
                <span className="ceg-label">{label}</span>
                <select className="ceg-input" value={value ?? ""} onChange={(e) => onChange(e.target.value)}>{opts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
            </label>
        );
    }
    const Tag = textarea ? "textarea" : "input";
    return (
        <label className={cls}>
            <span className="ceg-label">{label}</span>
            <Tag className="ceg-input" type={textarea ? undefined : type} rows={textarea ? rows : undefined} min={type === "number" ? 0 : undefined} value={value ?? ""}
                aria-invalid={error ? "true" : undefined} aria-describedby={error ? errId : undefined} onChange={(e) => onChange(e.target.value)} />
            {hint && !error && <em className="ceg-hint">{hint}</em>}
            {error && <em className="ceg-error" id={errId}><Icon name="alert" size={13} /> {error}</em>}
        </label>
    );
}

function Switch({ checked, onChange, label }) {
    return (
        <label className="ceg-switch">
            <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
            <i aria-hidden="true" />
            <span>{label}</span>
        </label>
    );
}

function Thumb({ mediaId, kind }) {
    const { media } = useCtx();
    const m = media.find((x) => idEq(x.id, mediaId));
    return <span className={`ceg-thumb ${m ? "has-item" : ""}`}>{m?.url && m.type === "image" ? <img src={m.url} alt="" /> : <Icon name={kind === "document" ? "file" : "image"} size={18} />}</span>;
}

function MediaBox({ label, mediaId, kind = "image", errorKey, onSelect, onClear }) {
    const { media, pickMedia, errors } = useCtx();
    const item = media.find((m) => idEq(m.id, mediaId));
    const error = errorKey ? errors[errorKey] : null;
    return (
        <div className={`ceg-media ${error ? "has-error" : ""}`}>
            <span className="ceg-label">{label}</span>
            <div className="ceg-media-box">
                <Thumb mediaId={mediaId} kind={kind} />
                <span className="ceg-media-text"><strong>{item ? item.name : "Nothing selected"}</strong><small>{item ? (kind === "document" ? item.size : item.alt || "No alt text yet") : "Choose from the Media Library"}</small></span>
                <button type="button" className="ceg-btn-small" onClick={() => pickMedia({ type: kind, onSelect: (m) => onSelect(m.id) })}>{item ? "Change" : "Choose"}</button>
                {item && <button type="button" className="ceg-iconbtn" aria-label="Remove file" onClick={onClear}><Icon name="close" size={15} /></button>}
            </div>
            {error && <em className="ceg-error"><Icon name="alert" size={13} /> {error}</em>}
        </div>
    );
}

function PanelHead({ title, text, children }) {
    return <div className="ceg-panel-head"><div><h2>{title}</h2><p>{text}</p></div>{children}</div>;
}

/* member_linkages rows: { id: memberId, role } */
function MemberLinks({ item, i }) {
    const { catalog, edit } = useCtx();
    const [pick, setPick] = useState("");
    const free = catalog.members.filter((m) => !item.members.some((x) => idEq(x.id, m.id)));
    const set = (items) => edit((d) => { d.linkages[i].members = items; });
    return (
        <div className="ceg-sub">
            <div className="ceg-sub-head"><h3>Members involved ({item.members.length})</h3></div>
            <div className="ceg-links-add">
                <label className="ceg-field">
                    <span className="ceg-label">Add a member</span>
                    <select className="ceg-input" value={pick} disabled={free.length === 0} onChange={(e) => setPick(e.target.value)}>
                        <option value="">{free.length ? "Choose to add…" : "Everyone is already added"}</option>
                        {free.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                </label>
                <button type="button" className="ceg-btn-small" disabled={!pick} onClick={() => { set([...item.members, { id: free.find((m) => idEq(m.id, pick)).id, role: "" }]); setPick(""); }}><Icon name="plus" size={15} /> Add</button>
            </div>
            {item.members.length === 0 && <p className="ceg-empty">No members linked yet.</p>}
            {item.members.map((l, k) => (
                <div key={l.id} className="ceg-linkrow">
                    <strong>{catalog.members.find((m) => idEq(m.id, l.id))?.name || "Missing member"}</strong>
                    <input className="ceg-input" aria-label="Role in the linkage" placeholder="Role in the linkage" value={l.role} onChange={(e) => set(item.members.map((x, j) => (j === k ? { ...x, role: e.target.value } : x)))} />
                    <button type="button" className="ceg-iconbtn is-danger" aria-label="Remove member" onClick={() => set(item.members.filter((_, j) => j !== k))}><Icon name="close" size={15} /></button>
                </div>
            ))}
        </div>
    );
}

/* gallery_items rows, ordered */
function AlbumItems({ item, i }) {
    const { edit, errors } = useCtx();
    const upd = (j, k, v) => edit((d) => { d.albums[i].items[j][k] = v; });
    const move = (j, to) => edit((d) => { const a = d.albums[i].items; if (to < 0 || to >= a.length) return; const [x] = a.splice(j, 1); a.splice(to, 0, x); });
    const err = errors[`albums.${item.id}.items`];
    return (
        <div className="ceg-sub">
            <div className="ceg-sub-head">
                <h3>Photos and videos ({item.items.length})</h3>
                <button type="button" className="ceg-btn-small" onClick={() => edit((d) => { d.albums[i].items.push({ id: uid(), mediaId: null, caption: "", videoUrl: "" }); })}><Icon name="plus" size={15} /> Add item</button>
            </div>
            {err && <em className="ceg-error"><Icon name="alert" size={13} /> {err}</em>}
            {item.items.length === 0 && <p className="ceg-empty">No items yet. Add photos or video links.</p>}
            {item.items.map((it, j) => (
                <div key={it.id} className="ceg-item">
                    <div className="ceg-sub-head">
                        <strong>Item {j + 1}</strong>
                        <span className="ceg-mover">
                            <button type="button" className="ceg-iconbtn" disabled={j === 0} aria-label="Move up" onClick={() => move(j, j - 1)}><Icon name="up" size={15} /></button>
                            <button type="button" className="ceg-iconbtn" disabled={j === item.items.length - 1} aria-label="Move down" onClick={() => move(j, j + 1)}><Icon name="down" size={15} /></button>
                            <button type="button" className="ceg-iconbtn is-danger" aria-label={`Delete item ${j + 1}`} onClick={() => edit((d) => { d.albums[i].items.splice(j, 1); })}><Icon name="trash" size={15} /></button>
                        </span>
                    </div>
                    <MediaBox label="Photo" mediaId={it.mediaId} errorKey={`albums.${item.id}.item.${it.id}.media`} onSelect={(id) => upd(j, "mediaId", id)} onClear={() => upd(j, "mediaId", null)} />
                    <div className="ceg-grid">
                        <Field label="Caption" value={it.caption} onChange={(v) => upd(j, "caption", v)} />
                        <Field label="Video link (optional)" errorKey={`albums.${item.id}.item.${it.id}.video`} value={it.videoUrl} onChange={(v) => upd(j, "videoUrl", v)} />
                    </div>
                </div>
            ))}
        </div>
    );
}

/* ------------------- one list + card editor for every module ------------------- */

function ModuleView({ mod, focusId, setFocusId }) {
    const { data, edit, errors, askDelete, catalog } = useCtx();
    const [q, setQ] = useState("");
    const [type, setType] = useState("all");
    const [status, setStatus] = useState("all");
    const [sort, setSort] = useState(mod.dateKey ? "newest" : "name");
    const [shown, setShown] = useState(PAGE);
    const [openId, setOpenId] = useState(focusId);
    useEffect(() => { if (focusId) { setOpenId(focusId); setFocusId(null); } }, [focusId, setFocusId]);

    const items = data[mod.dataKey];
    const term = q.trim().toLowerCase();
    const list = useMemo(() => {
        const out = items.map((x, i) => ({ x, i })).filter(({ x }) =>
            (!mod.scope || mod.scope(x)) &&
            (type === "all" || x[mod.typeField] === type) &&
            (status === "all" || (status === "live") === mod.pub.live(x)) &&
            (!term || `${x[mod.nameKey]} ${x.country || ""} ${x.description || x.excerpt || ""}`.toLowerCase().includes(term)));
        out.sort((a, b) => (sort === "newest"
            ? String(b.x[mod.dateKey] || "").localeCompare(String(a.x[mod.dateKey] || ""))
            : (sort === "name-desc" ? -1 : 1) * String(a.x[mod.nameKey]).localeCompare(String(b.x[mod.nameKey]))));
        return out;
    }, [items, type, status, term, sort, mod]);

    const scoped = items.filter((x) => !mod.scope || mod.scope(x));
    const add = () => { const item = mod.blank(); edit((d) => { d[mod.dataKey].push(item); }); setOpenId(item.id); setQ(""); setType("all"); setStatus("all"); };
    const live = scoped.filter(mod.pub.live).length;
    const typeOpts = mod.typeOpts(data);

    return (
        <div className="ceg-panel">
            <PanelHead title={mod.title} text={`${mod.text} ${live} of ${scoped.length} live.`}>
                <button type="button" className="ceg-btn-small" onClick={add}><Icon name="plus" size={15} /> {mod.add}</button>
            </PanelHead>
            <div className="ceg-toolbar">
                <label className="ceg-search"><Icon name="search" size={16} /><input type="search" value={q} placeholder={`Search ${mod.noun}s`} aria-label={`Search ${mod.noun}s`} onChange={(e) => { setQ(e.target.value); setShown(PAGE); }} /></label>
                {typeOpts.length > 0 && (
                    <select className="ceg-input" aria-label="Filter by type" value={type} onChange={(e) => { setType(e.target.value); setShown(PAGE); }}>
                        <option value="all">{mod.allTypes}</option>{typeOpts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                )}
                <select className="ceg-input" aria-label="Status" value={status} onChange={(e) => { setStatus(e.target.value); setShown(PAGE); }}>
                    <option value="all">Any status</option><option value="live">Published</option><option value="off">Not published</option>
                </select>
                <select className="ceg-input" aria-label="Sort" value={sort} onChange={(e) => setSort(e.target.value)}>
                    {mod.dateKey && <option value="newest">Newest first</option>}<option value="name">A to Z</option><option value="name-desc">Z to A</option>
                </select>
            </div>
            {list.length === 0 && <p className="ceg-empty">{scoped.length ? "Nothing matches these filters." : `No ${mod.noun}s yet. Add the first one.`}</p>}
            <ol className="ceg-list">
                {list.slice(0, shown).map(({ x, i }) => {
                    const open = idEq(openId, x.id);
                    const bad = Object.keys(errors).filter((k) => k.startsWith(`${mod.dataKey}.${x.id}.`)).length;
                    const [stateLabel, stateTone] = mod.pub.state(x);
                    const set = (k, v) => edit((d) => {
                        const t = d[mod.dataKey][i];
                        if (mod.dataKey === "posts" && k === "title" && (!t.slug || t.slug === slugify(t.title))) t.slug = slugify(v);
                        if (mod.dataKey === "posts" && k === "status" && v === "published" && !t.publishedAt) t.publishedAt = nowLocal();
                        t[k] = k === "slug" ? slugify(v) : v;
                    });
                    const val = (f) => (f.type === "number" ? toYear : (v) => v);
                    return (
                        <li key={x.id} className="ceg-card">
                            <div className="ceg-card-top">
                                <button type="button" className="ceg-toggle" aria-expanded={open} onClick={() => setOpenId(open ? null : x.id)}>
                                    <Thumb mediaId={x[mod.mediaKey]} kind={mod.mediaType} />
                                    <span className="ceg-toggle-text"><strong>{x[mod.nameKey] || `New ${mod.noun}`}</strong><small>{mod.sub(x)}</small></span>
                                    <Icon name={open ? "up" : "down"} size={17} />
                                </button>
                                {bad > 0 && <span className="ceg-badge-error">{bad}</span>}
                                <span className={`ceg-pill ${stateTone}`}>{stateLabel}</span>
                                <button type="button" className="ceg-iconbtn is-danger" aria-label={`Delete ${x[mod.nameKey] || mod.noun}`} onClick={() => askDelete({ what: x[mod.nameKey] || `this ${mod.noun}`, onConfirm: () => edit((d) => { d[mod.dataKey].splice(i, 1); }) })}><Icon name="trash" size={16} /></button>
                            </div>
                            {open && (
                                <div className="ceg-card-body">
                                    <div className="ceg-grid">
                                        {mod.fields.filter((f) => !f.show || f.show(x)).map((f) => (
                                            <Field key={f.k} label={f.label} wide={f.wide} type={f.type} textarea={Boolean(f.rows)} rows={f.rows} opts={f.opts || (f.optsFn ? f.optsFn(catalog) : undefined)}
                                                errorKey={`${mod.dataKey}.${x.id}.${f.k}`} value={x[f.k]} hint={f.hint ? f.hint(x) : undefined}
                                                onChange={(v) => set(f.k, f.k.endsWith("Id") && !f.type ? (v === "" ? null : Number(v) || v) : val(f)(v))} />
                                        ))}
                                    </div>
                                    <MediaBox label={mod.mediaLabel} kind={mod.mediaType} errorKey={`${mod.dataKey}.${x.id}.${mod.mediaKey}`} mediaId={x[mod.mediaKey]} onSelect={(id) => set(mod.mediaKey, id)} onClear={() => set(mod.mediaKey, null)} />
                                    {mod.extra === "members" && <MemberLinks item={x} i={i} />}
                                    {mod.extra === "items" && <AlbumItems item={x} i={i} />}
                                    {!mod.pub.statusField && (
                                        <Switch checked={mod.pub.live(x)} label={mod.key === "brochures" ? (mod.pub.live(x) ? "Public, visitors can download it" : "Not public") : mod.pub.live(x) ? "Published on the website" : "Draft, not on the website"}
                                            onChange={(v) => edit((d) => { mod.pub.set(d[mod.dataKey][i], v); if (mod.key === "brochures" && v && !d.documents[i].publishedAt) d.documents[i].publishedAt = nowLocal(); })} />
                                    )}
                                </div>
                            )}
                        </li>
                    );
                })}
            </ol>
            {list.length > shown && <button type="button" className="ceg-btn-outline" onClick={() => setShown((n) => n + PAGE)}>Show more ({list.length - shown} left)</button>}
        </div>
    );
}

/* --------------------------- history, picker --------------------------- */

const ACTION_TONE = { CREATE: "is-new", UPDATE: "is-info", PUBLISH: "is-ok", UNPUBLISH: "is-warn", DELETE: "is-danger", RESTORE: "is-ok" };

function HistoryPanel({ history }) {
    return (
        <div className="ceg-panel ceg-narrow">
            <PanelHead title="History" text="Every change in Engagement, from the audit log." />
            {history.length === 0 && <p className="ceg-empty">Nothing recorded yet.</p>}
            <ol className="ceg-history">
                {history.map((h) => (
                    <li key={h.id}>
                        <span className={`ceg-pill ${ACTION_TONE[h.action] || "is-info"}`}>{h.action}</span>
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
        <div className="ceg-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
            <div className="ceg-dialog" role="dialog" aria-modal="true" aria-labelledby={titleId}>
                <div className="ceg-dialog-head"><h2 id={titleId}>Media Library</h2><button type="button" className="ceg-iconbtn" aria-label="Close" onClick={onClose}><Icon name="close" size={16} /></button></div>
                <div className="ceg-media-grid">
                    {list.map((m) => (
                        <button key={m.id} type="button" className="ceg-media-item" onClick={() => { state.onSelect(m); onClose(); }}>
                            <span className="ceg-media-preview">{m.url && m.type === "image" ? <img src={m.url} alt="" /> : <Icon name={m.type === "document" ? "file" : "image"} size={26} />}</span><strong>{m.name}</strong><small>{m.size}</small>
                        </button>
                    ))}
                    {list.length === 0 && <p className="ceg-empty">The library has no {state.type === "document" ? "documents" : "images"} yet.</p>}
                </div>
                <div className="ceg-dialog-actions">
                    <input ref={fileRef} type="file" accept={state.type === "document" ? ".pdf,.doc,.docx,.ppt,.pptx" : "image/*"} hidden onChange={(e) => { if (e.target.files[0]) onUpload(e.target.files[0], state.type); e.target.value = ""; }} />
                    <button type="button" className="ceg-btn-outline" onClick={() => fileRef.current?.click()}><Icon name="upload" size={15} /> Upload new</button>
                    <button type="button" className="ceg-btn-dark" onClick={onClose}>Done</button>
                </div>
            </div>
        </div>
    );
}

/* ---------------------- full-page preview (public look) ---------------------- */

const SITE_NAV = ["Home", "About", "People", "Research and Innovation", "Publications", "Facilities and Services", "Engagement", "Contact"];
const DEVICES = [{ key: "desktop", label: "Desktop", width: null }, { key: "tablet", label: "Tablet", width: 820 }, { key: "mobile", label: "Mobile", width: 390 }];

function PreviewModal({ data, media, catalog, mod, onClose, previewUrl }) {
    const [device, setDevice] = useState("desktop");
    const width = DEVICES.find((d) => d.key === device).width;
    const urlOf = (id) => media.find((m) => idEq(m.id, id))?.url || null;
    useEffect(() => {
        const onKey = (e) => e.key === "Escape" && onClose();
        document.addEventListener("keydown", onKey);
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
    }, [onClose]);

    const all = data[mod.dataKey].filter((x) => !mod.scope || mod.scope(x));
    const live = all.filter(mod.pub.live);
    const hidden = all.length - live.length;
    const Pic = ({ id }) => { const s = urlOf(id); return s ? <img className="cev-pic" src={s} alt="" /> : <span className="cev-pic is-empty" />; };
    const groups = (items, key, opts) => { const g = {}; items.forEach((x) => { (g[x[key]] = g[x[key]] || []).push(x); }); return Object.entries(g).map(([k, v]) => [labelOf(opts, k), v]); };
    const byDate = (a, b) => String(b.publishedAt || "").localeCompare(String(a.publishedAt || ""));
    const member = (id) => catalog.members.find((m) => idEq(m.id, id))?.name;

    let body;
    if (mod.key === "linkages" || mod.key === "affiliations") {
        const isL = mod.key === "linkages";
        body = groups(live, isL ? "linkType" : "affiliationType", isL ? LINK_TYPES : AFFIL_TYPES).map(([title, items]) => (
            <div key={title} className="cev-group"><h3>{title}</h3>
                <ul className="cev-grid">{items.map((x) => (
                    <li key={x.id} className="cev-card">
                        <Pic id={x.logoId} /><b>{isL ? x.orgName : x.bodyName}</b>
                        {isL && x.country && <small>{x.country}</small>}
                        <span>{x.description}</span>
                        {isL && x.members.length > 0 && <small>Contact: {x.members.map((m) => member(m.id)).filter(Boolean).join(", ")}</small>}
                        {(isL ? x.startYear : x.sinceYear) && <em>{isL ? `${x.startYear}${x.endYear ? ` to ${x.endYear}` : " to present"}` : `Since ${x.sinceYear}`}</em>}
                    </li>
                ))}</ul></div>
        ));
    } else if (mod.key === "news") {
        body = <ul className="cev-grid">{[...live].sort(byDate).map((x) => (
            <li key={x.id} className="cev-card"><Pic id={x.coverId} /><em>{labelOf(NEWS_TYPES, x.postType)}</em><b>{x.title}</b><small>{fmtDate(x.publishedAt)}</small><span>{x.excerpt || x.body.slice(0, 140)}</span></li>
        ))}</ul>;
    } else if (mod.key === "albums") {
        body = <ul className="cev-grid">{live.map((x) => (
            <li key={x.id} className="cev-card"><Pic id={x.coverId || x.items.find((it) => it.mediaId)?.mediaId} /><b>{x.title}</b><span>{x.description}</span><small>{x.items.length} item{x.items.length === 1 ? "" : "s"}</small></li>
        ))}</ul>;
    } else if (mod.key === "coverage") {
        body = <div>{[...live].sort(byDate).map((x) => (
            <div key={x.id} className="cev-row"><div><b>{x.title}</b><br /><span>{x.excerpt}</span></div><span className="cev-meta">{host(x.externalUrl)} · {fmtDate(x.publishedAt)}</span></div>
        ))}</div>;
    } else {
        body = groups(live, "docCategory", DOC_TYPES).map(([title, items]) => (
            <div key={title} className="cev-group"><h3>{title}s</h3>
                {items.map((x) => <div key={x.id} className="cev-row"><div><b>{x.title}</b><br /><span className="cev-meta">{x.versionLabel}{media.find((m) => idEq(m.id, x.mediaId))?.size ? ` · ${media.find((m) => idEq(m.id, x.mediaId)).size}` : ""}</span></div><span className="cev-btn">Download</span></div>)}</div>
        ));
    }
    const empty = live.length === 0;

    return (
        <div className="cev-overlay" role="dialog" aria-modal="true" aria-label="Page preview">
            <div className="cev-bar">
                <div className="cev-bar-left"><span className="cev-live"><i /> Preview</span><small>Your current edits, not the live page.{hidden > 0 && ` ${hidden} not published, hidden.`}</small></div>
                <div className="cev-devices" role="tablist" aria-label="Screen size">
                    {DEVICES.map((d) => <button key={d.key} type="button" role="tab" aria-selected={device === d.key} className={device === d.key ? "is-on" : ""} onClick={() => setDevice(d.key)}>{d.label}</button>)}
                </div>
                <div className="cev-bar-right">
                    {previewUrl && <a className="cev-bar-btn" href={previewUrl} target="_blank" rel="noreferrer">Open saved preview</a>}
                    <button type="button" className="cev-bar-btn" onClick={onClose}>Close <kbd>Esc</kbd></button>
                </div>
            </div>
            <div className="cev-stage">
                <div className={`cev-frame is-${device}`} style={width ? { width } : undefined}>
                    <div className="cev">
                        <header className="cev-nav"><b className="cev-brand"><i />COE-UAS</b><nav aria-label="Site (preview)">{SITE_NAV.map((n) => <span key={n} className={n === "Engagement" ? "is-on" : ""}>{n}</span>)}</nav><span className="cev-cta">Contact us</span></header>
                        <div className="cev-hero"><div className="cev-wrap"><p><span>Engagement</span> {mod.title}</p></div></div>
                        <section className="cev-sec"><div className="cev-wrap">
                            <h2>{mod.title}</h2>
                            {empty ? <p className="cev-sub">Nothing published yet.</p> : body}
                        </div></section>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* -------------------------------- the page -------------------------------- */

const pathInfo = (props, url) => props.view || VIEWS.find((v) => (url || "").includes(`/engagement/${v.key}`))?.key || "linkages";

export default function AdminCOEUASEngagement() {
    const { props, url } = usePage();
    const live = Boolean(props.engagement?.data);
    const dialogTitleId = useId();
    const seed = useRef(live
        ? { data: { linkages: [], affiliations: [], posts: [], albums: [], documents: [], ...props.engagement.data }, catalog: props.engagement.catalog || {}, history: props.engagement.history || [] }
        : { data: sampleData, catalog: sampleCatalog, history: sampleHistory }).current;

    const [saved, setSaved] = useState(() => clone(seed.data));
    const [data, setData] = useState(() => clone(seed.data));
    const [localHistory, setLocalHistory] = useState(seed.history);
    const [mediaList, setMediaList] = useState(seed.catalog.media || []);
    const history = live ? props.engagement.history || [] : localHistory;

    const first = pathInfo(props, url);
    const [view, setView] = useState(first);
    const [tab, setTab] = useState(VIEWS.find((v) => v.key === first).mods[0]);
    const [focusId, setFocusId] = useState(null);
    const [submitted, setSubmitted] = useState(false);
    const [busy, setBusy] = useState(false);
    const [dialog, setDialog] = useState(null);
    const [picker, setPicker] = useState(null);
    const [preview, setPreview] = useState(false);
    const [toast, setToast] = useState(null);
    const busyRef = useRef(false);

    useEffect(() => { const v = pathInfo(props, url); setView(v); setTab(VIEWS.find((x) => x.key === v).mods[0]); }, [props.view, url]);

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

    /* warn before leaving with unsaved changes (moving between the five links is allowed: same page) */
    useEffect(() => {
        const beforeUnload = (e) => { if (dirty) { e.preventDefault(); e.returnValue = ""; } };
        window.addEventListener("beforeunload", beforeUnload);
        const off = router.on("before", (event) => {
            const target = event?.detail?.visit?.url?.pathname || "";
            if (target.startsWith(`${BASE}/engagement`)) return undefined;
            if (dirty && !busyRef.current && !window.confirm("You have unsaved changes. Leave this page and discard them?")) return false;
            return undefined;
        });
        return () => { window.removeEventListener("beforeunload", beforeUnload); if (typeof off === "function") off(); };
    }, [dirty]);

    const edit = (fn) => setData((d) => { const copy = clone(d); fn(copy); return copy; });
    const askDelete = (info) => setDialog({ type: "delete", ...info });
    const pickMedia = (opts) => setPicker(opts);
    const finishBusy = () => { setBusy(false); busyRef.current = false; };
    const addHistory = (action, label, changes = []) => setLocalHistory((h) => [{ id: Date.now(), user: "You", action, label, at: new Date().toISOString(), changes }, ...h]);

    const jumpToFirstError = () => {
        const first = Object.keys(allErrors)[0];
        if (!first) return;
        const at = locate(first, data);
        setView(at.view); setTab(at.tab); setFocusId(at.id);
        setTimeout(() => document.querySelector(".ceg-field.has-error, .ceg-media.has-error")?.scrollIntoView({ behavior: "smooth", block: "center" }), 200);
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
            setToast({ tone: "ok", text: "Saved. Published and scheduled records follow their status on the website." });
            finishBusy();
        };
        if (live) router.put(ENDPOINTS.save, payload, { preserveScroll: true, preserveState: true, onSuccess: done, onError: () => { finishBusy(); setSubmitted(true); setToast({ tone: "error", text: "The server rejected some values. Check the highlighted fields." }); } });
        else setTimeout(done, 350);
    };

    const confirmDelete = () => {
        dialog.onConfirm();
        if (!live) addHistory("DELETE", `${MODULES[tab]?.title || "Engagement"}: ${dialog.what}`, [{ field: "Moved to Trash", from: dialog.what, to: "(deleted)" }]);
        setToast({ tone: "ok", text: `“${dialog.what}” moved to Trash. It leaves the website when you save.` });
        setDialog(null);
    };

    const uploadMedia = (file, kind) => {
        if (live) {
            router.post(ENDPOINTS.upload, { file }, { forceFormData: true, preserveScroll: true, preserveState: true, onSuccess: () => setToast({ tone: "ok", text: `${file.name} uploaded.` }), onError: () => setToast({ tone: "error", text: "The upload failed. Try a smaller file." }) });
        } else {
            setMediaList((m) => [{ id: Date.now(), name: file.name, type: kind || "image", alt: "", size: `${(file.size / 1048576).toFixed(1)} MB`, url: kind === "document" ? null : URL.createObjectURL(file) }, ...m]);
            setToast({ tone: "ok", text: `${file.name} added (sample data, not stored).` });
        }
    };

    useEffect(() => {
        const onKey = (e) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") { e.preventDefault(); save(); } };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    });

    const media = live ? props.engagement.catalog?.media || mediaList : mediaList;
    const catalog = { members: [], categories: [], events: [], ...(live ? props.engagement.catalog : seed.catalog) };
    const current = VIEWS.find((v) => v.key === view) || VIEWS[0];
    const mod = MODULES[tab] || MODULES[current.mods[0]];
    const tabs = [...current.mods.map((m) => [m, current.mods.length > 1 ? MODULES[m].tab : "List"]), ["history", "History"]];
    const scoped = data[mod.dataKey].filter((x) => !mod.scope || mod.scope(x));
    const ctx = { data, edit, errors, media, catalog, askDelete, pickMedia };

    return (
        <Ctx.Provider value={ctx}>
            <div className="coeuas-eng">
                <div className="ceg-heading">
                    <div>
                        <h1>{current.title}</h1>
                        <p>{current.text}</p>
                        <div className="ceg-status">
                            <span className="ceg-pill is-ok">{scoped.filter(mod.pub.live).length} of {scoped.length} {mod.tab.toLowerCase()} live</span>
                            {dirty && <span className="ceg-pill is-warn">Unsaved: {changedLabels.join(", ")}</span>}
                            {totalErrors > 0 && submitted && <span className="ceg-pill is-danger">{totalErrors} to fix</span>}
                        </div>
                    </div>
                    <div className="ceg-actions">
                        <button type="button" className="ceg-btn-outline" onClick={() => setPreview(true)} disabled={tab === "history"}><Icon name="eye" size={16} /> Preview</button>
                        <button type="button" className="ceg-btn-dark" onClick={save} disabled={!dirty || busy}><span className="ceg-btn-icon"><Icon name="save" size={16} /></span> {busy ? "Saving..." : "Save changes"}</button>
                    </div>
                </div>

                {!live && <p className="ceg-note"><Icon name="alert" size={16} /><span>Sample data. Every control works, but nothing is stored until your controller sends the <b>engagement</b> prop.</span></p>}

                <div className="ceg-tabs" role="tablist" aria-label="Engagement editor">
                    {tabs.map(([key, label]) => (
                        <button key={key} type="button" role="tab" aria-selected={tab === key} className={tab === key ? "is-active" : ""} onClick={() => setTab(key)}>
                            {label}{key === "history" && <span className="ceg-badge">{history.length}</span>}
                        </button>
                    ))}
                </div>

                {tab === "history" ? <HistoryPanel history={history} /> : <ModuleView key={mod.key} mod={mod} focusId={focusId} setFocusId={setFocusId} />}

                {dirty && (
                    <div className="ceg-savebar" role="region" aria-label="Unsaved changes">
                        <span className="ceg-savebar-text"><i /> {changedLabels.length} area{changedLabels.length === 1 ? "" : "s"} edited, not saved</span>
                        <div>
                            <button type="button" className="ceg-btn-ghost" disabled={busy} onClick={() => { setData(clone(saved)); setSubmitted(false); setToast({ tone: "info", text: "Changes discarded." }); }}>Discard</button>
                            <button type="button" className="ceg-btn-accent" disabled={busy} onClick={save}>{busy ? "Saving..." : "Save changes"}</button>
                        </div>
                    </div>
                )}

                {dialog?.type === "delete" && (
                    <div className="ceg-overlay" onMouseDown={(e) => e.target === e.currentTarget && setDialog(null)}>
                        <div className="ceg-dialog ceg-small" role="alertdialog" aria-modal="true" aria-labelledby={dialogTitleId}>
                            <span className="ceg-dialog-icon"><Icon name="trash" size={22} /></span>
                            <h2 id={dialogTitleId}>Delete “{dialog.what}”?</h2>
                            <p>It moves to Deleted content, where only the Super Admin can restore or purge it. It leaves the website when you save.</p>
                            <div className="ceg-dialog-actions">
                                <button type="button" className="ceg-btn-outline" onClick={() => setDialog(null)} autoFocus>Keep it</button>
                                <button type="button" className="ceg-btn-danger" onClick={confirmDelete}><Icon name="trash" size={15} /> Move to Trash</button>
                            </div>
                        </div>
                    </div>
                )}

                {picker && <MediaPicker state={picker} media={media} onClose={() => setPicker(null)} onUpload={uploadMedia} />}
                {preview && tab !== "history" && <PreviewModal data={data} media={media} catalog={catalog} mod={mod} previewUrl={props.engagement?.previewUrl} onClose={() => setPreview(false)} />}

                {toast && (
                    <div className={`ceg-toast is-${toast.tone}`} role="status">
                        <Icon name={toast.tone === "error" ? "alert" : "check"} size={16} /><span>{toast.text}</span>
                        <button type="button" aria-label="Dismiss" onClick={() => setToast(null)}><Icon name="close" size={14} /></button>
                    </div>
                )}
            </div>
        </Ctx.Provider>
    );
}

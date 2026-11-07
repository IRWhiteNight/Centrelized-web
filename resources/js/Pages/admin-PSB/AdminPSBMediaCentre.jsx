import { createContext, useContext, useEffect, useId, useMemo, useRef, useState } from "react";
import { router, usePage } from "@inertiajs/react";
import "../../../css/admin-PSB-css/admin-media-center.css";

/* ====================================================================
   PSB ADMIN → MEDIA CENTRE                /admin/psb/media-centre/*

   Site map (PSB workspace → "Media Centre"), one page for all five modules:
     1  News and Project Updates     → posts   (news, announcement, activity)
     2  Press Releases               → posts   (press_release)
     3  Events and Activities        → events
     4  Photo and Video Gallery      → gallery_albums + gallery_items
     5  Articles and Social Media    → posts   (article, social)
   Tables (ERD-3): categories, posts, events, gallery_albums, gallery_items,
   featured_items (pin to Home), media_assets (media is only ever picked, never stored inline).
   Common screens from the document: list with search / filter by status / sort,
   create / edit, preview, publish / unpublish, schedule, reorder (drag),
   delete to Trash, History tab (audit_logs for this record).

   SAMPLE DATA: the page works today (changes stay on screen only). Return an Inertia prop
   named `mediaCentre` and it switches to LIVE mode:

   Inertia::render('admin/AdminPSBMediaCentre', [
       'section' => 'news',   // optional: news | press-releases | events | gallery | articles
       'mediaCentre' => [
           'posts'      => [...],  // same shape as `sample.posts` below
           'events'     => [...],
           'albums'     => [...],  // each with items: [{ id, mediaId, caption, videoUrl }] in order
           'categories' => [...],  // { id, type: news | press | article, name }
           'media'      => [...],  // media_assets: { id, name, type, alt, size, url? }
           'history'    => [...],  // audit_logs rows: { id, key: "post:12", user, action, label, at, changes }
       ],
   ]);

   Map the five sidebar routes (/admin/psb/media-centre/news, /press-releases, /events,
   /gallery, /articles) to this same component. LIVE mode requests are listed in API below.
   The controller must write audit_logs and check the site scope (RBAC).

   POST/PUT body for posts, events and albums:  { record, action, at }
     action = save | publish | schedule | unpublish | archive | cancel   (at = ISO time for schedule)
==================================================================== */

const BASE = "/admin/psb"; // keep in sync with psbRoutes.js
const MC = `${BASE}/media-centre`;
const API = {
    post: `${MC}/posts`, //   POST (new) · PUT /:id · DELETE /:id · POST /:id/pin { pinned }
    event: `${MC}/events`, // same as posts
    album: `${MC}/albums`, // same as posts · PUT /reorder { ids }
    upload: `${BASE}/media-library/upload`, // POST multipart { file }
};
const HOME_PINS = `${BASE}/home/news-events`;
const LIBRARY = `${BASE}/media-library`;
const PAGE_SIZE = 8;
const ALBUM_ITEM_LIMIT = 60;

const MODULES = [
    { key: "news", route: "news", label: "News and Project Updates", hint: "News, announcements and project activity", kind: "post", types: ["news", "announcement", "activity"], catType: "news", noun: "update", add: "New update" },
    { key: "press", route: "press-releases", label: "Press Releases", hint: "Official statements and media advisories", kind: "post", types: ["press_release"], catType: "press", noun: "press release", add: "New press release" },
    { key: "events", route: "events", label: "Events and Activities", hint: "Open days, briefings and demonstrations", kind: "event", noun: "event", add: "New event" },
    { key: "gallery", route: "gallery", label: "Photo and Video Gallery", hint: "Albums of photos and videos, in the order shown", kind: "album", noun: "album", add: "New album" },
    { key: "articles", route: "articles", label: "Articles and Social Media", hint: "Long reads and links to social posts", kind: "post", types: ["article", "social"], catType: "article", noun: "article", add: "New article" },
];

const TYPE_LABEL = { news: "News", announcement: "Announcement", activity: "Project activity", press_release: "Press release", article: "Article", social: "Social media post" };
const STATUS = {
    draft: { label: "Draft", tone: "off" },
    scheduled: { label: "Scheduled", tone: "warn" },
    published: { label: "Published", tone: "ok" },
    archived: { label: "Archived", tone: "info" },
    cancelled: { label: "Cancelled", tone: "danger" },
};
const POST_STATUSES = ["published", "scheduled", "draft", "archived"];
const EVENT_STATUSES = ["published", "draft", "cancelled"];
const EVENT_TYPES = ["Open day", "Briefing", "Demonstration", "Workshop", "Roundtable", "Exhibition", "Webinar"];
const KEY = { post: "posts", event: "events", album: "albums" };

const MIN = 60 * 1000;
const NOW = Date.now();
const minsAgo = (m) => new Date(NOW - m * MIN).toISOString();
const minsAhead = (m) => new Date(NOW + m * MIN).toISOString();
let counter = 0;
const uid = () => `n${Date.now().toString(36)}${(counter += 1)}`;

/* ------------------------------ sample data ------------------------------ */

const sample = {
    categories: [
        { id: 1, type: "news", name: "Project update" },
        { id: 2, type: "news", name: "Partnership" },
        { id: 3, type: "news", name: "Regulatory" },
        { id: 4, type: "press", name: "Official statement" },
        { id: 5, type: "press", name: "Media advisory" },
        { id: 6, type: "article", name: "Industry insight" },
        { id: 7, type: "article", name: "Social media" },
    ],
    media: [
        { id: 1, name: "banner-loop.mp4", type: "video", alt: "Aerial loop over the sandbox site", size: "18.4 MB" },
        { id: 2, name: "site-aerial.jpg", type: "image", alt: "Aerial view of the Sungai Batu Pahat site", size: "2.1 MB" },
        { id: 3, name: "paddy-corridor.jpg", type: "image", alt: "Drone flying over paddy fields", size: "1.7 MB" },
        { id: 4, name: "team-briefing.jpg", type: "image", alt: "", size: "1.2 MB" },
        { id: 5, name: "vertiport-concept.jpg", type: "image", alt: "Concept drawing of the vertiport", size: "2.6 MB" },
        { id: 6, name: "hangar-interior.jpg", type: "image", alt: "Inside the research and maintenance hangar", size: "1.9 MB" },
        { id: 7, name: "evtol-hover.jpg", type: "image", alt: "eVTOL aircraft hovering above a vertiport", size: "1.4 MB" },
        { id: 8, name: "runway-upgrade.mp4", type: "video", alt: "Runway upgrade walkthrough", size: "24.0 MB" },
    ],
    posts: [
        { id: 11, type: "news", title: "Phase 1 site preparation begins at Sungai Batu Pahat", slug: "phase-1-site-preparation-begins", excerpt: "Ground works and survey crews are now on site as the first development phase gets under way.", body: "Ground works have started at the Sungai Batu Pahat site, marking the start of **Phase 1** of the Perlis Airspace Sandbox roadmap.\n\n## What happens next\n\n- Site survey and drainage works\n- Runway and apron preparation\n- Installation of the first ground support equipment\n\nFurther updates will be shared as each milestone is completed.", externalUrl: "", categoryId: 1, coverId: 2, status: "published", publishedAt: minsAgo(60 * 24 * 6), scheduledAt: null, authorName: "Aiman Hakim", pinned: true, updatedAt: minsAgo(60 * 24 * 6), updatedBy: "Aiman Hakim" },
        { id: 12, type: "news", title: "Sandbox briefing held with regulators and agencies", slug: "sandbox-briefing-regulators-agencies", excerpt: "Regulators and agencies were briefed on the sandbox testing framework and operating limits.", body: "A briefing session was held for regulators and government agencies to walk through the testing framework, safety requirements and operating limits of the sandbox.\n\nParticipants gave feedback on the application process and the data to be shared after each trial.", externalUrl: "", categoryId: 3, coverId: 4, status: "published", publishedAt: minsAgo(60 * 24 * 13), scheduledAt: null, authorName: "Farid Rahman", pinned: true, updatedAt: minsAgo(60 * 24 * 13), updatedBy: "Farid Rahman" },
        { id: 13, type: "news", title: "Flight corridor to Timah Tasoh Dam proposed", slug: "flight-corridor-timah-tasoh-dam", excerpt: "A new low-altitude corridor between the site and Timah Tasoh Dam is under study.", body: "A flight corridor linking the sandbox with Timah Tasoh Dam has been proposed for inspection and cargo trials.\n\nThe route is subject to approval by the relevant authorities.", externalUrl: "", categoryId: 1, coverId: 3, status: "published", publishedAt: minsAgo(60 * 24 * 25), scheduledAt: null, authorName: "Aiman Hakim", pinned: false, updatedAt: minsAgo(60 * 24 * 25), updatedBy: "Aiman Hakim" },
        { id: 14, type: "news", title: "Partner agreement signing", slug: "partner-agreement-signing", excerpt: "", body: "", externalUrl: "", categoryId: 2, coverId: null, status: "draft", publishedAt: null, scheduledAt: null, authorName: "Farid Rahman", pinned: false, updatedAt: minsAgo(60 * 5), updatedBy: "Farid Rahman" },
        { id: 15, type: "news", title: "Vertiport design update", slug: "vertiport-design-update", excerpt: "The latest concept drawings for the vertiport are ready for review.", body: "The design team has completed the second round of concept drawings for the vertiport.\n\nThe update covers the landing pads, passenger area and charging layout.", externalUrl: "", categoryId: 1, coverId: 5, status: "scheduled", publishedAt: null, scheduledAt: minsAhead(60 * 52), authorName: "Aiman Hakim", pinned: false, updatedAt: minsAgo(60 * 20), updatedBy: "Aiman Hakim" },
        { id: 16, type: "activity", title: "Runway upgrade walkthrough", slug: "runway-upgrade-walkthrough", excerpt: "A short walkthrough of the runway upgrade works completed this month.", body: "The runway upgrade has reached its first checkpoint. Watch the walkthrough to see the new surface and markings.", externalUrl: "", categoryId: 1, coverId: 8, status: "published", publishedAt: minsAgo(60 * 24 * 30), scheduledAt: null, authorName: "Aiman Hakim", pinned: false, updatedAt: minsAgo(60 * 24 * 30), updatedBy: "Aiman Hakim" },
        { id: 17, type: "announcement", title: "Open call: BVLOS Corridor Trials now accepting applications", slug: "open-call-bvlos-corridor-trials", excerpt: "Applications are open until 15 December 2026.", body: "The sandbox is now accepting applications for the **BVLOS Corridor Trials**.\n\nApply through the Apply to Participate page before 15 December 2026.", externalUrl: "", categoryId: 1, coverId: 3, status: "published", publishedAt: minsAgo(60 * 24 * 3), scheduledAt: null, authorName: "Farid Rahman", pinned: false, updatedAt: minsAgo(60 * 24 * 3), updatedBy: "Farid Rahman" },
        { id: 31, type: "press_release", title: "Perlis Airspace Sandbox signs MoU with research partners", slug: "sandbox-mou-research-partners", excerpt: "A new memorandum sets out joint testing and data-sharing with research partners.", body: "The Perlis Airspace Sandbox has signed a memorandum of understanding with its research partners to support joint testing, validation and data sharing.\n\nFor media enquiries, please contact the programme office.", externalUrl: "", categoryId: 4, coverId: 4, status: "published", publishedAt: minsAgo(60 * 24 * 8), scheduledAt: null, authorName: "Aiman Hakim", pinned: false, updatedAt: minsAgo(60 * 24 * 8), updatedBy: "Aiman Hakim" },
        { id: 32, type: "press_release", title: "Statement on the Phase 1 flight corridor consultation", slug: "statement-flight-corridor-consultation", excerpt: "", body: "", externalUrl: "", categoryId: 4, coverId: null, status: "draft", publishedAt: null, scheduledAt: null, authorName: "Farid Rahman", pinned: false, updatedAt: minsAgo(60 * 30), updatedBy: "Farid Rahman" },
        { id: 33, type: "press_release", title: "Media advisory: Sandbox Open Day", slug: "media-advisory-sandbox-open-day", excerpt: "Media are invited to the Sandbox Open Day on 20 November 2026.", body: "Media representatives are invited to the **Sandbox Open Day** at Sungai Batu Pahat on 20 November 2026.\n\nPlease confirm attendance with the programme office.", externalUrl: "", categoryId: 5, coverId: 2, status: "published", publishedAt: minsAgo(60 * 24 * 2), scheduledAt: null, authorName: "Aiman Hakim", pinned: false, updatedAt: minsAgo(60 * 24 * 2), updatedBy: "Aiman Hakim" },
        { id: 41, type: "article", title: "Why low-altitude airspace is the next national infrastructure", slug: "low-altitude-airspace-next-infrastructure", excerpt: "From cargo to emergency response, low-altitude airspace is becoming a shared national asset.", body: "Low-altitude airspace is quickly becoming as important as roads and ports.\n\n## The case in brief\n\n- Prototypes need real airspace to prove themselves\n- Regulators need operational evidence\n- Industry needs a safe place to test beyond visual line of sight", externalUrl: "", categoryId: 6, coverId: 7, status: "published", publishedAt: minsAgo(60 * 24 * 15), scheduledAt: null, authorName: "Aiman Hakim", pinned: false, updatedAt: minsAgo(60 * 24 * 15), updatedBy: "Aiman Hakim" },
        { id: 42, type: "social", title: "Behind the scenes at Sungai Batu Pahat", slug: "behind-the-scenes-sungai-batu-pahat", excerpt: "A look at the team preparing the site.", body: "", externalUrl: "https://www.instagram.com/", categoryId: 7, coverId: 6, status: "published", publishedAt: minsAgo(60 * 24 * 4), scheduledAt: null, authorName: "Farid Rahman", pinned: false, updatedAt: minsAgo(60 * 24 * 4), updatedBy: "Farid Rahman" },
        { id: 43, type: "article", title: "Understanding BVLOS operations", slug: "understanding-bvlos-operations", excerpt: "", body: "BVLOS stands for beyond visual line of sight.", externalUrl: "", categoryId: 6, coverId: null, status: "draft", publishedAt: null, scheduledAt: null, authorName: "Aiman Hakim", pinned: false, updatedAt: minsAgo(60 * 9), updatedBy: "Aiman Hakim" },
        { id: 44, type: "social", title: "eVTOL hover test highlights", slug: "evtol-hover-test-highlights", excerpt: "Highlights from the first hover test.", body: "", externalUrl: "https://www.facebook.com/", categoryId: 7, coverId: 7, status: "archived", publishedAt: minsAgo(60 * 24 * 60), scheduledAt: null, authorName: "Farid Rahman", pinned: false, updatedAt: minsAgo(60 * 24 * 20), updatedBy: "Farid Rahman" },
    ],
    events: [
        { id: 21, title: "Sandbox Open Day", slug: "sandbox-open-day", eventType: "Open day", startAt: "2026-11-20T09:00", endAt: "2026-11-20T17:00", venue: "Sungai Batu Pahat, Perlis", description: "Tour the site, meet the team and see live drone demonstrations.", registrationUrl: "https://example.com/open-day", coverId: 2, status: "published", pinned: true, updatedAt: minsAgo(60 * 24 * 5), updatedBy: "Aiman Hakim" },
        { id: 22, title: "BVLOS Operators Briefing", slug: "bvlos-operators-briefing", eventType: "Briefing", startAt: "2026-12-04T10:00", endAt: "2026-12-04T12:00", venue: "Online", description: "An online briefing for operators planning to apply for the BVLOS Corridor Trials.", registrationUrl: "", coverId: 3, status: "published", pinned: false, updatedAt: minsAgo(60 * 24 * 4), updatedBy: "Farid Rahman" },
        { id: 23, title: "Drone Demonstration Week", slug: "drone-demonstration-week", eventType: "Demonstration", startAt: "2027-01-12T09:00", endAt: "2027-01-16T17:00", venue: "Perlis", description: "A week of live demonstrations by participating manufacturers and operators.", registrationUrl: "", coverId: 7, status: "published", pinned: false, updatedAt: minsAgo(60 * 24 * 2), updatedBy: "Aiman Hakim" },
        { id: 24, title: "Partners Roundtable", slug: "partners-roundtable", eventType: "Roundtable", startAt: "", endAt: "", venue: "", description: "", registrationUrl: "", coverId: null, status: "draft", pinned: false, updatedAt: minsAgo(60 * 6), updatedBy: "Farid Rahman" },
        { id: 25, title: "Regulators Workshop", slug: "regulators-workshop", eventType: "Workshop", startAt: "2026-10-21T09:30", endAt: "2026-10-21T16:00", venue: "Kangar, Perlis", description: "A working session with regulators and agencies on the testing framework.", registrationUrl: "", coverId: 4, status: "published", pinned: false, updatedAt: minsAgo(60 * 24 * 14), updatedBy: "Farid Rahman" },
    ],
    albums: [
        { id: 51, title: "Site aerial views", description: "Aerial photos of the Sungai Batu Pahat site and the planned corridors.", coverId: 2, eventId: null, items: [{ id: "i1", mediaId: 2, caption: "The sandbox site from above", videoUrl: "" }, { id: "i2", mediaId: 3, caption: "Drone over the paddy corridor", videoUrl: "" }, { id: "i3", mediaId: 6, caption: "Research and maintenance hangar", videoUrl: "" }], updatedAt: minsAgo(60 * 24 * 7), updatedBy: "Aiman Hakim" },
        { id: 52, title: "Regulators Workshop", description: "Photos from the working session with regulators and agencies.", coverId: 4, eventId: 25, items: [{ id: "i4", mediaId: 4, caption: "Participants during the briefing", videoUrl: "" }], updatedAt: minsAgo(60 * 24 * 12), updatedBy: "Farid Rahman" },
        { id: 53, title: "Runway and vertiport progress", description: "Videos and concept art showing construction progress.", coverId: 5, eventId: null, items: [{ id: "i5", mediaId: 8, caption: "Runway upgrade walkthrough", videoUrl: "" }, { id: "i6", mediaId: 5, caption: "Vertiport concept", videoUrl: "" }, { id: "i7", mediaId: null, caption: "Site update video", videoUrl: "https://www.youtube.com/watch?v=example" }], updatedAt: minsAgo(60 * 24 * 3), updatedBy: "Aiman Hakim" },
    ],
    history: [
        { id: 6, key: "post:11", user: "Aiman Hakim", action: "PUBLISH", label: "Phase 1 site preparation begins at Sungai Batu Pahat", at: minsAgo(60 * 24 * 6), changes: [{ field: "Status", from: "draft", to: "published" }] },
        { id: 5, key: "post:11", user: "Aiman Hakim", action: "UPDATE", label: "Phase 1 site preparation begins at Sungai Batu Pahat", at: minsAgo(60 * 24 * 6 + 90), changes: [{ field: "Cover image", from: "(empty)", to: "2" }] },
        { id: 4, key: "post:11", user: "Aiman Hakim", action: "CREATE", label: "Phase 1 site preparation begins at Sungai Batu Pahat", at: minsAgo(60 * 24 * 7), changes: [] },
        { id: 3, key: "event:21", user: "Aiman Hakim", action: "PUBLISH", label: "Sandbox Open Day", at: minsAgo(60 * 24 * 5), changes: [{ field: "Status", from: "draft", to: "published" }] },
        { id: 2, key: "album:51", user: "Aiman Hakim", action: "UPDATE", label: "Site aerial views", at: minsAgo(60 * 24 * 7), changes: [{ field: "Gallery items", from: "2 items", to: "3 items" }] },
        { id: 1, key: "post:15", user: "Aiman Hakim", action: "UPDATE", label: "Vertiport design update", at: minsAgo(60 * 20), changes: [{ field: "Status", from: "draft", to: "scheduled" }] },
    ],
};

/* ------------------------------ helpers ------------------------------ */

const clone = (v) => JSON.parse(JSON.stringify(v));
const sameJson = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const isWebLink = (v) => /^https?:\/\/\S+$/i.test((v || "").trim());
const initialsOf = (name) => (name || "?").split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase();
const slugify = (t = "") => t.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);

function formatDate(iso, withTime = true) {
    if (!iso) return "";
    const d = new Date(iso);
    const day = d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
    return withTime ? `${day}, ${d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}` : day;
}

function timeAgo(iso) {
    const minutes = Math.round((Date.now() - new Date(iso).getTime()) / MIN);
    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.round(minutes / 60);
    if (hours < 24) return `${hours} hr ago`;
    const days = Math.round(hours / 24);
    return `${days} day${days === 1 ? "" : "s"} ago`;
}

const moveIn = (list, from, to) => {
    if (to < 0 || to >= list.length) return list;
    const next = [...list];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    return next;
};

const FIELD_LABEL = { type: "Type", title: "Title", slug: "Page address", excerpt: "Summary", body: "Body", externalUrl: "External link", categoryId: "Category", coverId: "Cover image", status: "Status", pinned: "Pinned to Home page", eventType: "Event type", startAt: "Starts", endAt: "Ends", venue: "Venue", description: "Description", registrationUrl: "Registration link", eventId: "Linked event", items: "Gallery items", scheduledAt: "Scheduled for" };
const short = (v) => {
    const s = Array.isArray(v) ? `${v.length} item${v.length === 1 ? "" : "s"}` : v === null || v === undefined || v === "" ? "(empty)" : String(v);
    return s.length > 70 ? `${s.slice(0, 67)}...` : s;
};
const diffOf = (a, b) => (a ? Object.keys(FIELD_LABEL).filter((k) => JSON.stringify(a[k]) !== JSON.stringify(b[k])).map((k) => ({ field: FIELD_LABEL[k], from: short(a[k]), to: short(b[k]) })) : []);

/* drawn thumbnail for a media asset (real files would use their own URL) */
function thumbOf(item) {
    if (item?.url) return item.url;
    const label = (item?.name || "media").replace(/[<>&"]/g, "");
    const video = item?.type === "video";
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0b1a28"/><stop offset="1" stop-color="#1d4160"/></linearGradient></defs><rect width="320" height="200" fill="url(#g)"/><path d="M-10 170L120 110 330 70V110L130 150 -10 200Z" fill="#facc15" fill-opacity=".9"/>${video ? '<circle cx="160" cy="84" r="26" fill="#fff" fill-opacity=".92"/><path d="M152 70v28l24-14z" fill="#0b1a28"/>' : '<circle cx="160" cy="84" r="9" fill="#fff"/><path d="M130 54l60 60M190 54l-60 60" stroke="#fff" stroke-width="4" stroke-linecap="round"/>'}<text x="14" y="186" fill="#fff" font-family="Arial,sans-serif" font-size="13" font-weight="700">${label}</text></svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const blankFor = (m) =>
    m.kind === "post"
        ? { id: null, type: m.types[0], title: "", slug: "", excerpt: "", body: "", externalUrl: "", categoryId: null, coverId: null, status: "draft", publishedAt: null, scheduledAt: null, authorName: "You", pinned: false }
        : m.kind === "event"
            ? { id: null, title: "", slug: "", eventType: "", startAt: "", endAt: "", venue: "", description: "", registrationUrl: "", coverId: null, status: "draft", pinned: false }
            : { id: null, title: "", description: "", coverId: null, eventId: null, items: [] };

/* every rule the public Media Centre needs. Returns { "field.path": "message" } */
function validate(kind, f, others) {
    const e = {};
    const need = (key, value, label, max) => {
        const v = (value ?? "").toString().trim();
        if (!v) e[key] = `Enter ${label}.`;
        else if (max && v.length > max) e[key] = `Use ${max} characters or fewer.`;
    };
    const maxLen = (key, value, max) => { if ((value || "").length > max) e[key] = `Use ${max} characters or fewer.`; };
    const webLink = (key, value, label, required) => {
        if (!(value || "").trim()) { if (required) e[key] = `Enter ${label}.`; }
        else if (!isWebLink(value)) e[key] = "Use a full address starting with https://";
    };

    need("title", f.title, "a title", kind === "album" ? 200 : 255);

    if (kind !== "album") {
        need("slug", f.slug, "a page address", 200);
        if (f.slug && !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(f.slug)) e.slug = "Use lowercase letters, numbers and hyphens only.";
        else if (f.slug && others.some((o) => o.slug === f.slug)) e.slug = "This address is already used. Choose another.";
    }

    if (kind === "post") {
        maxLen("excerpt", f.excerpt, 300);
        if (f.type === "social") {
            webLink("externalUrl", f.externalUrl, "the link to the post", true);
            maxLen("body", f.body, 2000);
        } else {
            need("body", f.body, "the body text", 20000);
            webLink("externalUrl", f.externalUrl, "a link");
        }
    }

    if (kind === "event") {
        need("eventType", f.eventType, "an event type", 60);
        if (!f.startAt) e.startAt = "Choose a start date and time.";
        if (f.endAt && f.startAt && new Date(f.endAt) < new Date(f.startAt)) e.endAt = "The end must be after the start.";
        need("venue", f.venue, "a venue", 255);
        maxLen("description", f.description, 2000);
        webLink("registrationUrl", f.registrationUrl, "a link");
    }

    if (kind === "album") {
        maxLen("description", f.description, 500);
        if (!f.items.length) e.items = "Add at least one photo or video.";
        f.items.forEach((it) => {
            if (!it.mediaId && !(it.videoUrl || "").trim()) e[`items.${it.id}.source`] = "Choose a file or enter a video link.";
            webLink(`items.${it.id}.videoUrl`, it.videoUrl, "a link");
            maxLen(`items.${it.id}.caption`, it.caption, 255);
        });
    }
    return e;
}

/* what a draft needs before it can be saved */
const LIGHT_KEYS = ["title", "slug"];

/* ------------------------------ shared state ------------------------------ */

const Ctx = createContext(null);
const useMc = () => useContext(Ctx);

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
        pin: (<><path d="M12 17v5" /><path d="M9 3h6l-1 7 3 3H7l3-3z" /></>),
        close: <path d="M6 6l12 12M18 6 6 18" />,
        check: <path d="m5 12 5 5 9-10" />,
        alert: (<><path d="M12 3 2.5 20h19z" /><path d="M12 10v4M12 17.2v.1" /></>),
        search: (<><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4-4" /></>),
        image: (<><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" /></>),
        external: <path d="M14 4h6v6M20 4l-9 9M18 14v5H5V6h5" />,
        unlink: (<><path d="M9 15 15 9" /><path d="M11 6l1.5-1.5a4 4 0 0 1 5.7 5.7L16.7 11.7M13 18l-1.5 1.5a4 4 0 0 1-5.7-5.7L7.3 12.3" /><path d="M3 3l18 18" /></>),
        edit: (<><path d="M4 20h4L19 9l-4-4L4 16z" /><path d="m13.5 6.5 4 4" /></>),
        back: <path d="M15 5l-7 7 7 7" />,
        calendar: (<><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></>),
        video: (<><rect x="3" y="6" width="13" height="12" rx="2" /><path d="m16 10 5-3v10l-5-3z" /></>),
        archive: (<><rect x="3" y="4" width="18" height="5" rx="1" /><path d="M5 9v10h14V9M10 13h4" /></>),
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
        <button type="button" role="switch" aria-checked={checked} aria-label={label} className={`mc-toggle ${checked ? "is-on" : ""}`} onClick={() => onChange(!checked)}>
            <span />
        </button>
    );
}

function StatusPill({ status }) {
    const s = STATUS[status] || STATUS.draft;
    return <span className={`mc-pill is-${s.tone}`}>{s.label}</span>;
}

/* One labelled text box or text area with a character counter and an error line */
function Field({ label, hint, value, onChange, error, max, rows, placeholder, prefix, type = "text", list, className = "" }) {
    const id = useId();
    const length = (value || "").length;
    const input = rows ? (
        <textarea id={id} className="mc-input mc-textarea" rows={rows} value={value || ""} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    ) : (
        <input id={id} type={type} list={list} className="mc-input" value={value || ""} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    );

    return (
        <div className={`mc-field ${error ? "has-error" : ""} ${className}`}>
            <div className="mc-field-top">
                <label htmlFor={id}>{label}</label>
                {max && <span className={`mc-count ${length > max ? "is-over" : ""}`}>{length}/{max}</span>}
            </div>
            {prefix ? <div className="mc-prefix"><span>{prefix}</span>{input}</div> : input}
            {hint && !error && <p className="mc-hint">{hint}</p>}
            {error && <p className="mc-error" role="alert"><Icon name="alert" size={13} /> {error}</p>}
        </div>
    );
}

function SelectField({ label, hint, value, onChange, options, error }) {
    const id = useId();
    return (
        <div className={`mc-field ${error ? "has-error" : ""}`}>
            <div className="mc-field-top"><label htmlFor={id}>{label}</label></div>
            <select id={id} className="mc-input mc-select is-block" value={value ?? ""} onChange={(e) => onChange(e.target.value)}>
                {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            {hint && !error && <p className="mc-hint">{hint}</p>}
            {error && <p className="mc-error" role="alert"><Icon name="alert" size={13} /> {error}</p>}
        </div>
    );
}

function BlockHead({ title, text, aside }) {
    return (
        <div className="mc-block-head">
            <div>
                <h3>{title}</h3>
                {text && <p>{text}</p>}
            </div>
            {aside}
        </div>
    );
}

function AddButton({ onClick, children, disabled }) {
    return <button type="button" className="mc-add" onClick={onClick} disabled={disabled}><Icon name="plus" size={15} /> {children}</button>;
}

/* Body text with a small formatting bar. Stored as plain text: **bold**, *italic*, "## " heading, "- " list */
function BodyEditor({ label, hint, value, onChange, error, max }) {
    const id = useId();
    const ref = useRef(null);
    const wrap = (before, after = before) => {
        const el = ref.current;
        if (!el) return;
        const { selectionStart: s, selectionEnd: e } = el;
        const sel = value.slice(s, e) || "text";
        onChange(value.slice(0, s) + before + sel + after + value.slice(e));
        requestAnimationFrame(() => { el.focus(); el.setSelectionRange(s + before.length, s + before.length + sel.length); });
    };
    const length = (value || "").length;

    return (
        <div className={`mc-field ${error ? "has-error" : ""}`}>
            <div className="mc-field-top">
                <label htmlFor={id}>{label}</label>
                {max && <span className={`mc-count ${length > max ? "is-over" : ""}`}>{length}/{max}</span>}
            </div>
            <div className="mc-editor">
                <div className="mc-editor-bar" role="toolbar" aria-label="Formatting">
                    <button type="button" onClick={() => wrap("**")} aria-label="Bold"><b>B</b></button>
                    <button type="button" onClick={() => wrap("*")} aria-label="Italic"><i>I</i></button>
                    <button type="button" onClick={() => wrap("## ", "")}>Heading</button>
                    <button type="button" onClick={() => wrap("- ", "")}>List</button>
                    <small>Leave a blank line between paragraphs.</small>
                </div>
                <textarea id={id} ref={ref} className="mc-input mc-textarea is-body" rows={12} value={value || ""} onChange={(e) => onChange(e.target.value)} />
            </div>
            {hint && !error && <p className="mc-hint">{hint}</p>}
            {error && <p className="mc-error" role="alert"><Icon name="alert" size={13} /> {error}</p>}
        </div>
    );
}

/* Drag to reorder: HTML5 drag from the handle, plus Up / Down buttons for keyboard users */
function useDrag(onReorder, disabled) {
    const from = useRef(null);
    const [over, setOver] = useState(null);

    return {
        over,
        handleProps: (i) => ({
            draggable: !disabled,
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

/* An ordered list where every row can be edited, moved and removed.
   removeKind "delete" → asks first and moves the row to Trash; "remove" → takes it out of the form */
function Orderable({ items, onMove, onRemove, removeKind = "delete", nameOf, children, empty, disabled }) {
    const { askDelete } = useMc();
    const drag = useDrag(onMove, disabled);

    if (!items.length) return <p className="mc-empty">{empty}</p>;

    return (
        <ul className="mc-list">
            {items.map((item, i) => (
                <li key={item.id} className={`mc-item ${drag.over === i ? "is-over" : ""}`} {...drag.rowProps(i)}>
                    <button type="button" className="mc-handle" aria-label={`Drag ${nameOf(item)} to reorder`} title={disabled ? "Clear the search to reorder" : "Drag to reorder"} disabled={disabled} {...drag.handleProps(i)}>
                        <Icon name="grip" size={16} />
                    </button>
                    <span className="mc-item-no">{i + 1}</span>
                    <div className="mc-item-body">{children(item, i)}</div>
                    <div className="mc-item-tools">
                        <button type="button" className="mc-iconbtn" aria-label="Move up" title="Move up" disabled={disabled || i === 0} onClick={() => onMove(i, i - 1)}><Icon name="up" size={15} /></button>
                        <button type="button" className="mc-iconbtn" aria-label="Move down" title="Move down" disabled={disabled || i === items.length - 1} onClick={() => onMove(i, i + 1)}><Icon name="down" size={15} /></button>
                        {removeKind === "delete" ? (
                            <button type="button" className="mc-iconbtn is-danger" aria-label={`Delete ${nameOf(item)}`} title="Delete (moves to Trash)" onClick={() => askDelete({ what: nameOf(item), onConfirm: () => onRemove(i) })}><Icon name="trash" size={15} /></button>
                        ) : (
                            <button type="button" className="mc-iconbtn is-danger" aria-label={`Remove ${nameOf(item)}`} title="Remove from this album" onClick={() => onRemove(i)}><Icon name="trash" size={15} /></button>
                        )}
                    </div>
                </li>
            ))}
        </ul>
    );
}

/* ------------------------------ media ------------------------------ */

function MediaField({ label, hint, mediaId, onChange, accept = "any", error }) {
    const { media, pickMedia } = useMc();
    const asset = media.find((m) => m.id === mediaId);
    const needsAlt = asset && asset.type === "image" && !asset.alt;

    return (
        <div className={`mc-field ${error ? "has-error" : ""}`}>
            <div className="mc-field-top"><label>{label}</label></div>
            <div className="mc-media">
                <span className="mc-media-thumb">{asset ? <img src={thumbOf(asset)} alt="" /> : <Icon name="image" size={22} />}</span>
                <div className="mc-media-text">
                    {asset ? (
                        <>
                            <strong>{asset.name}</strong>
                            <small>{asset.type === "video" ? "Video" : "Image"} · {asset.size}</small>
                            {needsAlt ? (
                                <small className="mc-media-warn"><Icon name="alert" size={12} /> No alt text. Add it in the Media Library.</small>
                            ) : (
                                <small title={asset.alt}>Alt text: {asset.alt || "not needed for video"}</small>
                            )}
                        </>
                    ) : (
                        <>
                            <strong>No file chosen</strong>
                            <small>Pick a file from the Media Library</small>
                        </>
                    )}
                </div>
                <div className="mc-media-actions">
                    <button type="button" className="mc-btn-small" onClick={() => pickMedia({ accept, selected: mediaId, onPick: onChange })}>{asset ? "Change" : "Choose"}</button>
                    {asset && <button type="button" className="mc-btn-small is-quiet" onClick={() => onChange(null)}>Remove</button>}
                </div>
            </div>
            {hint && !error && <p className="mc-hint">{hint}</p>}
            {error && <p className="mc-error" role="alert"><Icon name="alert" size={13} /> {error}</p>}
        </div>
    );
}

function MediaPicker({ state, media, onClose, onUpload }) {
    const [query, setQuery] = useState("");
    const [type, setType] = useState(state.accept === "image" ? "image" : state.accept === "video" ? "video" : "all");
    const fileRef = useRef(null);

    useEffect(() => {
        const onKey = (e) => e.key === "Escape" && onClose();
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [onClose]);

    const q = query.trim().toLowerCase();
    const list = media.filter((m) => (type === "all" || m.type === type) && (!q || m.name.toLowerCase().includes(q) || (m.alt || "").toLowerCase().includes(q)));

    return (
        <div className="mc-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
            <div className="mc-dialog mc-picker" role="dialog" aria-modal="true" aria-labelledby="mc-picker-title">
                <header className="mc-dialog-head">
                    <div>
                        <h2 id="mc-picker-title">Media Library</h2>
                        <p>Choose a file. Files are managed in the <a className="mc-link" href={LIBRARY}>Media Library</a>.</p>
                    </div>
                    <button type="button" className="mc-iconbtn" aria-label="Close" onClick={onClose}><Icon name="close" size={18} /></button>
                </header>

                <div className="mc-picker-tools">
                    <label className="mc-search">
                        <Icon name="search" size={16} />
                        <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by file name or alt text" aria-label="Search media" />
                    </label>
                    <select className="mc-input mc-select" value={type} onChange={(e) => setType(e.target.value)} aria-label="File type">
                        <option value="all">All files</option>
                        <option value="image">Images</option>
                        <option value="video">Video</option>
                    </select>
                    <button type="button" className="mc-btn-small" onClick={() => fileRef.current?.click()}><Icon name="upload" size={14} /> Upload</button>
                    <input ref={fileRef} type="file" hidden accept="image/*,video/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) onUpload(f); e.target.value = ""; }} />
                </div>

                <div className="mc-media-grid">
                    {list.length === 0 && <p className="mc-empty">No files match. Try another search or upload a new file.</p>}
                    {list.map((m) => (
                        <button key={m.id} type="button" className={`mc-media-card ${state.selected === m.id ? "is-selected" : ""}`} onClick={() => { state.onPick(m.id); onClose(); }}>
                            <img src={thumbOf(m)} alt="" />
                            <span className="mc-media-card-text">
                                <strong>{m.name}</strong>
                                <small>{m.type === "video" ? "Video" : "Image"} · {m.size}</small>
                            </span>
                            {state.selected === m.id && <span className="mc-media-check"><Icon name="check" size={14} /></span>}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

/* ------------------------------ dialogs, preview, history ------------------------------ */

function ConfirmDialog({ dlg, onClose, notify }) {
    const [at, setAt] = useState("");

    useEffect(() => {
        const onKey = (e) => e.key === "Escape" && onClose();
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [onClose]);

    const submit = () => {
        if (dlg.schedule && (!at || new Date(at).getTime() <= Date.now())) { notify("error", "Choose a date and time in the future."); return; }
        onClose();
        dlg.onConfirm(dlg.schedule ? new Date(at).toISOString() : null);
    };

    return (
        <div className="mc-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
            <div className="mc-dialog mc-small" role="alertdialog" aria-modal="true" aria-labelledby="mc-dlg-title">
                <span className={`mc-dialog-icon ${dlg.danger ? "is-danger" : ""}`}><Icon name={dlg.icon} size={22} /></span>
                <h2 id="mc-dlg-title">{dlg.title}</h2>
                <p>{dlg.text}</p>
                {dlg.schedule && (
                    <label className="mc-field">
                        <span className="mc-field-top"><span>Publish on</span></span>
                        <input type="datetime-local" className="mc-input" value={at} min={new Date(Date.now() - new Date().getTimezoneOffset() * MIN).toISOString().slice(0, 16)} onChange={(e) => setAt(e.target.value)} />
                    </label>
                )}
                <div className="mc-dialog-actions">
                    <button type="button" className="mc-btn-outline" onClick={onClose} autoFocus>{dlg.keep || "Cancel"}</button>
                    <button type="button" className={dlg.danger ? "mc-btn-danger" : "mc-btn-dark"} onClick={submit}>{dlg.label}</button>
                </div>
            </div>
        </div>
    );
}

/* **bold**, *italic*, "## " heading and "- " list, the same rules the public page uses */
function Rich({ text }) {
    const inline = (s) => s.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).map((p, i) => (p.startsWith("**") && p.length > 4 ? <strong key={i}>{p.slice(2, -2)}</strong> : p.startsWith("*") && p.length > 2 ? <em key={i}>{p.slice(1, -1)}</em> : p));
    return text.split(/\n{2,}/).filter(Boolean).map((block, i) => {
        if (block.startsWith("## ")) return <h3 key={i}>{inline(block.slice(3))}</h3>;
        const lines = block.split("\n");
        if (lines.every((l) => l.startsWith("- "))) return <ul key={i}>{lines.map((l, j) => <li key={j}>{inline(l.slice(2))}</li>)}</ul>;
        return <p key={i}>{inline(block)}</p>;
    });
}

/* A simplified picture of the public page, built from the unsaved form */
function PreviewModal({ module, rec, onClose }) {
    const { media, categories, rows } = useMc();
    const [device, setDevice] = useState("desktop");

    useEffect(() => {
        const onKey = (e) => e.key === "Escape" && onClose();
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [onClose]);

    const mediaOf = (id) => media.find((m) => m.id === id);
    const cover = mediaOf(rec.coverId);
    const category = categories.find((c) => c.id === rec.categoryId);
    const linkedEvent = module.kind === "album" && rec.eventId ? rows("event").find((e) => e.id === rec.eventId) : null;

    return (
        <div className="mc-overlay is-wide" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
            <div className="mc-dialog mc-preview" role="dialog" aria-modal="true" aria-labelledby="mc-preview-title">
                <header className="mc-dialog-head">
                    <div>
                        <h2 id="mc-preview-title">Preview of the {module.noun}</h2>
                        <p>Built from what you see on screen, including unsaved changes. Layout is simplified.</p>
                    </div>
                    <div className="mc-preview-tools">
                        <div className="mc-seg" role="group" aria-label="Device">
                            <button type="button" className={device === "desktop" ? "is-on" : ""} onClick={() => setDevice("desktop")}>Desktop</button>
                            <button type="button" className={device === "mobile" ? "is-on" : ""} onClick={() => setDevice("mobile")}>Mobile</button>
                        </div>
                        <button type="button" className="mc-iconbtn" aria-label="Close preview" onClick={onClose}><Icon name="close" size={18} /></button>
                    </div>
                </header>

                <div className={`mc-pv-frame is-${device}`}>
                    <article className="mc-pv">
                        {cover && module.kind !== "album" && <img className="mc-pv-cover" src={thumbOf(cover)} alt={cover.alt || ""} />}
                        <div className="mc-pv-body">
                            <p className="mc-pv-tag">{module.kind === "post" ? [TYPE_LABEL[rec.type], category?.name].filter(Boolean).join(" · ") : module.kind === "event" ? rec.eventType || "Event" : "Gallery"}</p>
                            <h1>{rec.title || "Untitled"}</h1>

                            {module.kind === "post" && (
                                <>
                                    <p className="mc-pv-meta">{rec.status === "published" && rec.publishedAt ? formatDate(rec.publishedAt, false) : "Not published yet"} · {rec.authorName || "You"}</p>
                                    {rec.excerpt && <p className="mc-pv-lead">{rec.excerpt}</p>}
                                    {rec.body ? <Rich text={rec.body} /> : <p className="mc-pv-none">No body text yet.</p>}
                                    {rec.externalUrl && <span className="mc-pv-btn">{rec.type === "social" ? "View the original post" : "Read the original"}</span>}
                                </>
                            )}

                            {module.kind === "event" && (
                                <>
                                    <div className="mc-pv-when">
                                        <strong>{rec.startAt ? formatDate(rec.startAt) : "Date to be set"}</strong>
                                        {rec.endAt && <span>to {formatDate(rec.endAt)}</span>}
                                        <span>{rec.venue || "Venue to be set"}</span>
                                    </div>
                                    {rec.description ? <Rich text={rec.description} /> : <p className="mc-pv-none">No description yet.</p>}
                                    {rec.registrationUrl && <span className="mc-pv-btn">Register</span>}
                                </>
                            )}

                            {module.kind === "album" && (
                                <>
                                    {rec.description && <p className="mc-pv-lead">{rec.description}</p>}
                                    {linkedEvent && <p className="mc-pv-meta">From the event: {linkedEvent.title}</p>}
                                    <div className="mc-pv-grid">
                                        {rec.items.map((it) => {
                                            const m = mediaOf(it.mediaId);
                                            return (
                                                <figure key={it.id}>
                                                    {m ? <img src={thumbOf(m)} alt={m.alt || ""} /> : <span className="mc-pv-video"><Icon name="video" size={22} /></span>}
                                                    <figcaption>{it.caption || (it.videoUrl ? "Video" : "")}</figcaption>
                                                </figure>
                                            );
                                        })}
                                    </div>
                                    {rec.items.length === 0 && <p className="mc-pv-none">No photos or videos yet.</p>}
                                </>
                            )}
                        </div>
                    </article>
                </div>
            </div>
        </div>
    );
}

const ACTION_PILL = { CREATE: "warn", UPDATE: "info", PUBLISH: "dark", UNPUBLISH: "off", DELETE: "danger", RESTORE: "ok" };
const ACTION_LABEL = { CREATE: "Created", UPDATE: "Updated", PUBLISH: "Published", UNPUBLISH: "Unpublished", DELETE: "Deleted", RESTORE: "Restored" };

function HistoryPanel({ entries }) {
    const [open, setOpen] = useState(null);

    return (
        <section className="mc-card">
            <header className="mc-card-head">
                <div>
                    <span className="mc-card-no">History</span>
                    <h2>Who changed this record</h2>
                    <p>Every add, update, publish and delete is recorded. Entries cannot be edited.</p>
                </div>
            </header>

            {entries.length === 0 ? (
                <p className="mc-empty mc-empty-pad">No history yet. It starts when you save.</p>
            ) : (
                <ul className="mc-history">
                    {entries.map((h) => {
                        const isOpen = open === h.id;
                        return (
                            <li key={h.id}>
                                <button type="button" className="mc-hist-row" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : h.id)} disabled={!h.changes?.length}>
                                    <span className="mc-avatar">{initialsOf(h.user)}</span>
                                    <span className="mc-hist-text">
                                        <strong>{h.user}</strong>
                                        <small>{ACTION_LABEL[h.action] || h.action} <b>{h.label}</b></small>
                                    </span>
                                    <span className={`mc-pill is-${ACTION_PILL[h.action] || "info"}`}>{ACTION_LABEL[h.action] || h.action}</span>
                                    <span className="mc-hist-time" title={formatDate(h.at)}>{timeAgo(h.at)}</span>
                                </button>
                                {isOpen && h.changes?.length > 0 && (
                                    <div className="mc-diff">
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
   LIST SCREENS
==================================================================== */

function Pager({ page, pages, total, onPage }) {
    if (pages <= 1) return null;
    const from = (page - 1) * PAGE_SIZE + 1;
    const to = Math.min(page * PAGE_SIZE, total);
    return (
        <div className="mc-pager">
            <span>{from}–{to} of {total}</span>
            <div>
                <button type="button" className="mc-btn-small" disabled={page <= 1} onClick={() => onPage(page - 1)}>Previous</button>
                <button type="button" className="mc-btn-small" disabled={page >= pages} onClick={() => onPage(page + 1)}>Next</button>
            </div>
        </div>
    );
}

const SORTERS = {
    updated: (a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0),
    title: (a, b) => a.title.localeCompare(b.title),
    date: (a, b) => new Date(b.publishedAt || b.scheduledAt || b.updatedAt || 0) - new Date(a.publishedAt || a.scheduledAt || a.updatedAt || 0),
    start: (a, b) => new Date(b.startAt || 0) - new Date(a.startAt || 0),
};

/* posts (news, press releases, articles) and events */
function ListView({ module, onNew, onEdit }) {
    const { rows, askDelete, remove, pin, preview, categories, media } = useMc();
    const isEvent = module.kind === "event";
    const [query, setQuery] = useState("");
    const [status, setStatus] = useState("all");
    const [type, setType] = useState("all");
    const [category, setCategory] = useState("all");
    const [sort, setSort] = useState(isEvent ? "start" : "date");
    const [page, setPage] = useState(1);

    const all = rows(module.kind).filter((r) => isEvent || module.types.includes(r.type));
    const statuses = isEvent ? EVENT_STATUSES : POST_STATUSES;
    const counts = Object.fromEntries(statuses.map((s) => [s, all.filter((r) => r.status === s).length]));
    const cats = categories.filter((c) => c.type === module.catType);
    const q = query.trim().toLowerCase();

    const shown = all
        .filter((r) => (status === "all" || r.status === status) && (type === "all" || r.type === type) && (category === "all" || String(r.categoryId) === category))
        .filter((r) => !q || r.title.toLowerCase().includes(q) || (r.slug || "").includes(q) || (r.venue || "").toLowerCase().includes(q))
        .sort(SORTERS[sort]);

    const pages = Math.max(1, Math.ceil(shown.length / PAGE_SIZE));
    const current = Math.min(page, pages);
    const visible = shown.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
    const canPin = module.key === "news" || isEvent;
    const filtered = q || status !== "all" || type !== "all" || category !== "all";
    const reset = (fn) => (v) => { fn(v); setPage(1); };

    const dateCell = (r) => {
        if (isEvent) return r.startAt ? [formatDate(r.startAt), r.venue || "No venue yet"] : ["Date not set", r.venue || "No venue yet"];
        if (r.status === "published") return [`Published ${formatDate(r.publishedAt, false)}`, `by ${r.authorName}`];
        if (r.status === "scheduled") return [`Goes live ${formatDate(r.scheduledAt)}`, `by ${r.authorName}`];
        return [`Edited ${timeAgo(r.updatedAt)}`, `by ${r.updatedBy}`];
    };

    return (
        <section className="mc-card">
            <header className="mc-card-head">
                <div>
                    <span className="mc-card-no">{all.length} {all.length === 1 ? module.noun : `${module.noun}s`}</span>
                    <h2>{module.label}</h2>
                    <p>{module.hint}.</p>
                </div>
                <button type="button" className="mc-btn-dark" onClick={onNew}><Icon name="plus" size={16} /> {module.add}</button>
            </header>

            <div className="mc-filters" role="group" aria-label="Filter by status">
                <button type="button" className={`mc-chip ${status === "all" ? "is-on" : ""}`} onClick={() => reset(setStatus)("all")}>All <b>{all.length}</b></button>
                {statuses.map((s) => (
                    <button key={s} type="button" className={`mc-chip ${status === s ? "is-on" : ""}`} onClick={() => reset(setStatus)(s)}>{STATUS[s].label} <b>{counts[s]}</b></button>
                ))}
            </div>

            <div className="mc-toolbar">
                <label className="mc-search">
                    <Icon name="search" size={16} />
                    <input type="search" value={query} onChange={(e) => reset(setQuery)(e.target.value)} placeholder={isEvent ? "Search by title or venue" : "Search by title or address"} aria-label={`Search ${module.noun}s`} />
                </label>
                {!isEvent && module.types.length > 1 && (
                    <select className="mc-input mc-select" value={type} onChange={(e) => reset(setType)(e.target.value)} aria-label="Type">
                        <option value="all">All types</option>
                        {module.types.map((t) => <option key={t} value={t}>{TYPE_LABEL[t]}</option>)}
                    </select>
                )}
                {!isEvent && (
                    <select className="mc-input mc-select" value={category} onChange={(e) => reset(setCategory)(e.target.value)} aria-label="Category">
                        <option value="all">All categories</option>
                        {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                )}
                <select className="mc-input mc-select" value={sort} onChange={(e) => reset(setSort)(e.target.value)} aria-label="Sort by">
                    {isEvent && <option value="start">Event date</option>}
                    {!isEvent && <option value="date">Publish date</option>}
                    <option value="updated">Recently edited</option>
                    <option value="title">Title A to Z</option>
                </select>
            </div>

            {visible.length === 0 ? (
                <div className="mc-empty mc-empty-pad">
                    {filtered ? (
                        <>No {module.noun}s match. <button type="button" className="mc-linkbtn" onClick={() => { setQuery(""); setStatus("all"); setType("all"); setCategory("all"); }}>Clear filters</button></>
                    ) : (
                        <>No {module.noun}s yet. <button type="button" className="mc-linkbtn" onClick={onNew}>{module.add}</button></>
                    )}
                </div>
            ) : (
                <ul className="mc-rows">
                    {visible.map((r) => {
                        const cover = media.find((m) => m.id === r.coverId);
                        const [d1, d2] = dateCell(r);
                        const cat = categories.find((c) => c.id === r.categoryId);
                        return (
                            <li key={r.id} className="mc-row">
                                <span className="mc-thumb">{cover ? <img src={thumbOf(cover)} alt="" /> : <Icon name="image" size={18} />}</span>
                                <div className="mc-cell mc-cell-title">
                                    <button type="button" className="mc-title-btn" onClick={() => onEdit(r)}>{r.title || "Untitled"}</button>
                                    <small>/{r.slug}</small>
                                </div>
                                <div className="mc-cell mc-cell-type">
                                    <strong>{isEvent ? r.eventType : TYPE_LABEL[r.type]}</strong>
                                    <small>{isEvent ? "" : cat?.name || "No category"}</small>
                                </div>
                                <div className="mc-cell mc-cell-status">
                                    <StatusPill status={r.status} />
                                    {r.pinned && <span className="mc-pill is-dark"><Icon name="pin" size={11} /> On Home</span>}
                                </div>
                                <div className="mc-cell mc-cell-date"><strong>{d1}</strong><small>{d2}</small></div>
                                <div className="mc-row-tools">
                                    <button type="button" className="mc-iconbtn" aria-label={`Edit ${r.title}`} title="Edit" onClick={() => onEdit(r)}><Icon name="edit" size={15} /></button>
                                    <button type="button" className="mc-iconbtn" aria-label={`Preview ${r.title}`} title="Preview" onClick={() => preview(module, r)}><Icon name="eye" size={15} /></button>
                                    {canPin && (
                                        <button type="button" className={`mc-iconbtn ${r.pinned ? "is-active" : ""}`} aria-pressed={r.pinned} aria-label={r.pinned ? `Unpin ${r.title} from the Home page` : `Pin ${r.title} to the Home page`} title={r.pinned ? "Unpin from the Home page" : "Pin to the Home page"} onClick={() => pin(module.kind, r, !r.pinned)}><Icon name="pin" size={15} /></button>
                                    )}
                                    <button type="button" className="mc-iconbtn is-danger" aria-label={`Delete ${r.title}`} title="Delete (moves to Trash)" onClick={() => askDelete({ what: r.title, onConfirm: () => remove(module.kind, r) })}><Icon name="trash" size={15} /></button>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}

            <Pager page={current} pages={pages} total={shown.length} onPage={setPage} />
        </section>
    );
}

/* gallery albums: the order here is the order on the public gallery */
function AlbumList({ module, onNew, onEdit }) {
    const { rows, reorder, remove, preview, media, askDelete } = useMc();
    const [query, setQuery] = useState("");
    const all = rows("album");
    const q = query.trim().toLowerCase();
    const shown = q ? all.filter((a) => a.title.toLowerCase().includes(q)) : all;
    const events = rows("event");

    return (
        <section className="mc-card">
            <header className="mc-card-head">
                <div>
                    <span className="mc-card-no">{all.length} {all.length === 1 ? "album" : "albums"}</span>
                    <h2>{module.label}</h2>
                    <p>{module.hint}. Drag to set the order on the public gallery.</p>
                </div>
                <button type="button" className="mc-btn-dark" onClick={onNew}><Icon name="plus" size={16} /> {module.add}</button>
            </header>

            <div className="mc-toolbar">
                <label className="mc-search">
                    <Icon name="search" size={16} />
                    <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search albums" aria-label="Search albums" />
                </label>
            </div>
            {q && <p className="mc-hint mc-hint-pad">Reordering is off while a search is active.</p>}

            <div className="mc-block">
                <Orderable
                    items={shown}
                    disabled={Boolean(q)}
                    nameOf={(a) => a.title}
                    onMove={(from, to) => reorder(moveIn(all.map((a) => a.id), from, to))}
                    onRemove={(i) => remove("album", shown[i])}
                    empty={q ? "No albums match." : "No albums yet. Create one to show photos and videos."}
                >
                    {(a) => {
                        const cover = media.find((m) => m.id === a.coverId);
                        const ev = events.find((e) => e.id === a.eventId);
                        const videos = a.items.filter((i) => i.videoUrl || media.find((m) => m.id === i.mediaId)?.type === "video").length;
                        return (
                            <div className="mc-album-row">
                                <span className="mc-thumb">{cover ? <img src={thumbOf(cover)} alt="" /> : <Icon name="image" size={18} />}</span>
                                <div className="mc-pin-text">
                                    <strong>{a.title}</strong>
                                    <small>{a.items.length} item{a.items.length === 1 ? "" : "s"}{videos ? ` · ${videos} video${videos === 1 ? "" : "s"}` : ""}{ev ? ` · ${ev.title}` : ""}</small>
                                </div>
                                <span className="mc-hist-time">Edited {timeAgo(a.updatedAt)}</span>
                                <div className="mc-row-tools">
                                    <button type="button" className="mc-btn-small" onClick={() => onEdit(a)}><Icon name="edit" size={13} /> Edit</button>
                                    <button type="button" className="mc-iconbtn" aria-label={`Preview ${a.title}`} title="Preview" onClick={() => preview(module, a)}><Icon name="eye" size={15} /></button>
                                </div>
                            </div>
                        );
                    }}
                </Orderable>
            </div>
        </section>
    );
}

/* ====================================================================
   EDITOR SCREENS
==================================================================== */

function PostFields({ form, set, errors, module, onTitle, onSlug }) {
    const { categories } = useMc();
    const cats = categories.filter((c) => c.type === module.catType);
    const social = form.type === "social";

    return (
        <>
            <div className="mc-block">
                <BlockHead title="Content" text="What visitors read on the page." />
                {module.types.length > 1 && (
                    <SelectField label="Type" value={form.type} onChange={(v) => set({ type: v })} options={module.types.map((t) => [t, TYPE_LABEL[t]])} hint={social ? "Social posts link out to the original post." : undefined} />
                )}
                <Field label="Title" error={errors.title} value={form.title} max={255} onChange={onTitle} />
                <Field label="Page address" error={errors.slug} value={form.slug} max={200} prefix={`/media-centre/${module.route}/`} onChange={onSlug} hint="Made from the title. Change it only before publishing." />
                <Field label="Summary" error={errors.excerpt} value={form.excerpt} max={300} rows={3} onChange={(v) => set({ excerpt: v })} hint="Shown on cards and in search results." />
                <BodyEditor label={social ? "Post caption" : "Body"} error={errors.body} value={form.body} max={social ? 2000 : 20000} onChange={(v) => set({ body: v })} />
                <Field label={social ? "Link to the post" : "External link"} error={errors.externalUrl} value={form.externalUrl} placeholder="https://" onChange={(v) => set({ externalUrl: v })} hint={social ? "Required. Visitors open the original post here." : "Optional. Add the original address if the article is published elsewhere."} />
                <SelectField label="Category" value={form.categoryId} onChange={(v) => set({ categoryId: v ? Number(v) : null })} options={[["", "No category"], ...cats.map((c) => [c.id, c.name])]} />
            </div>
            <div className="mc-block">
                <BlockHead title="Cover image" text="Shown on cards and at the top of the page." />
                <MediaField label="Cover image" accept="image" mediaId={form.coverId} onChange={(id) => set({ coverId: id })} />
            </div>
        </>
    );
}

function EventFields({ form, set, errors, module, onTitle, onSlug }) {
    return (
        <>
            <div className="mc-block">
                <BlockHead title="Event details" text="What, when and where." />
                <Field label="Title" error={errors.title} value={form.title} max={255} onChange={onTitle} />
                <Field label="Page address" error={errors.slug} value={form.slug} max={200} prefix={`/media-centre/${module.route}/`} onChange={onSlug} hint="Made from the title. Change it only before publishing." />
                <Field label="Event type" error={errors.eventType} value={form.eventType} max={60} list="mc-event-types" onChange={(v) => set({ eventType: v })} hint="Pick a suggestion or type your own." />
                <datalist id="mc-event-types">{EVENT_TYPES.map((t) => <option key={t} value={t} />)}</datalist>
                <div className="mc-grid-2">
                    <Field label="Starts" type="datetime-local" error={errors.startAt} value={form.startAt} onChange={(v) => set({ startAt: v })} />
                    <Field label="Ends" type="datetime-local" error={errors.endAt} value={form.endAt} onChange={(v) => set({ endAt: v })} hint="Optional for one-time briefings." />
                </div>
                <Field label="Venue" error={errors.venue} value={form.venue} max={255} placeholder="Place name, or Online" onChange={(v) => set({ venue: v })} />
                <Field label="Description" error={errors.description} value={form.description} max={2000} rows={6} onChange={(v) => set({ description: v })} />
                <Field label="Registration link" error={errors.registrationUrl} value={form.registrationUrl} placeholder="https://" onChange={(v) => set({ registrationUrl: v })} hint="Optional. Adds a Register button to the event." />
            </div>
            <div className="mc-block">
                <BlockHead title="Cover image" />
                <MediaField label="Cover image" accept="image" mediaId={form.coverId} onChange={(id) => set({ coverId: id })} />
            </div>
        </>
    );
}

function AlbumFields({ form, set, errors }) {
    const { media, pickMedia, rows } = useMc();
    const events = rows("event");
    const setItems = (fn) => set({ items: fn(form.items) });
    const patchItem = (id, patch) => setItems((list) => list.map((it) => (it.id === id ? { ...it, ...patch } : it)));
    const full = form.items.length >= ALBUM_ITEM_LIMIT;

    return (
        <>
            <div className="mc-block">
                <BlockHead title="Album details" />
                <Field label="Title" error={errors.title} value={form.title} max={200} onChange={(v) => set({ title: v })} />
                <Field label="Description" error={errors.description} value={form.description} max={500} rows={3} onChange={(v) => set({ description: v })} />
                <SelectField label="Linked event" value={form.eventId} onChange={(v) => set({ eventId: v ? Number(v) : null })} options={[["", "Not linked to an event"], ...events.map((e) => [e.id, e.title])]} hint="Optional. Shows this album on the event page." />
                <MediaField label="Album cover" accept="image" mediaId={form.coverId} onChange={(id) => set({ coverId: id })} hint="If empty, the first photo is used." />
            </div>

            <div className="mc-block">
                <BlockHead title="Photos and videos" text="Drag to set the order visitors see." aside={<span className={`mc-limit ${full ? "is-full" : ""}`}>{form.items.length} of {ALBUM_ITEM_LIMIT}</span>} />
                <Orderable
                    items={form.items}
                    removeKind="remove"
                    nameOf={(it) => media.find((m) => m.id === it.mediaId)?.name || "video link"}
                    onMove={(from, to) => setItems((l) => moveIn(l, from, to))}
                    onRemove={(i) => setItems((l) => l.filter((_, idx) => idx !== i))}
                    empty="No photos or videos yet."
                >
                    {(it) => (
                        <div className="mc-stack">
                            <MediaField label="Photo or video file" accept="any" mediaId={it.mediaId} error={errors[`items.${it.id}.source`]} onChange={(id) => patchItem(it.id, { mediaId: id })} />
                            <Field label="Caption" error={errors[`items.${it.id}.caption`]} value={it.caption} max={255} onChange={(v) => patchItem(it.id, { caption: v })} />
                            <Field label="Video link" error={errors[`items.${it.id}.videoUrl`]} value={it.videoUrl} placeholder="https://" onChange={(v) => patchItem(it.id, { videoUrl: v })} hint="Optional. For a video hosted elsewhere, such as YouTube." />
                        </div>
                    )}
                </Orderable>
                {errors.items && <p className="mc-error"><Icon name="alert" size={13} /> {errors.items}</p>}
                <div className="mc-add-row">
                    <AddButton disabled={full} onClick={() => pickMedia({ accept: "any", selected: null, onPick: (id) => setItems((l) => [...l, { id: uid(), mediaId: id, caption: "", videoUrl: "" }]) })}>Add from Media Library</AddButton>
                    <AddButton disabled={full} onClick={() => setItems((l) => [...l, { id: uid(), mediaId: null, caption: "", videoUrl: "" }])}>Add video link</AddButton>
                </div>
            </div>
        </>
    );
}

function SidePanel({ kind, form, set, module }) {
    const canPin = module.key === "news" || kind === "event";
    const facts = kind === "album"
        ? [["Items", `${form.items.length}`], ["Last edited", form.updatedAt ? `${formatDate(form.updatedAt)} by ${form.updatedBy}` : "Never"]]
        : kind === "event"
            ? [["Starts", form.startAt ? formatDate(form.startAt) : "Not set"], ["Last edited", form.updatedAt ? `${formatDate(form.updatedAt)} by ${form.updatedBy}` : "Never"]]
            : [["Published", form.publishedAt ? formatDate(form.publishedAt) : "Not yet"], ["Scheduled for", form.scheduledAt ? formatDate(form.scheduledAt) : "None"], ["Author", form.authorName || "You"], ["Last edited", form.updatedAt ? `${formatDate(form.updatedAt)} by ${form.updatedBy}` : "Never"]];

    return (
        <aside className="mc-side">
            <section className="mc-card mc-side-card">
                <BlockHead title={kind === "album" ? "Album" : "Publishing"} aside={kind !== "album" && <StatusPill status={form.status} />} />
                {kind === "album" ? (
                    <p className="mc-hint">Albums appear on the public gallery as soon as you save.</p>
                ) : form.status === "published" ? (
                    <p className="mc-hint">Live on the public site. Saving changes updates it straight away.</p>
                ) : form.status === "scheduled" ? (
                    <p className="mc-hint">Goes live automatically at the scheduled time.</p>
                ) : form.status === "cancelled" ? (
                    <p className="mc-hint">Marked as cancelled. Publish again to reopen it.</p>
                ) : form.status === "archived" ? (
                    <p className="mc-hint">Hidden from the public site. Publish again to bring it back.</p>
                ) : (
                    <p className="mc-hint">Not visible to visitors until you publish.</p>
                )}
                <dl className="mc-facts">
                    {facts.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
                </dl>
            </section>

            {canPin && (
                <section className="mc-card mc-side-card">
                    <BlockHead title="Home page" />
                    <label className="mc-visible">
                        <span>{form.pinned ? "Pinned to the Home page" : "Not pinned"}</span>
                        <Toggle checked={Boolean(form.pinned)} label="Pin to the Home page" onChange={(v) => set({ pinned: v })} />
                    </label>
                    <p className="mc-hint">Pinned items show at the top of {kind === "event" ? "Upcoming events" : "Latest news"}. Set the order under <a className="mc-link" href={HOME_PINS}>Home Page <Icon name="external" size={11} /></a>.</p>
                </section>
            )}
        </aside>
    );
}

function Editor({ module, initial, onClose }) {
    const { kind } = module;
    const ctx = useMc();
    const { rows, history, commit, remove, askDelete, confirm, notify, preview: openPreview } = ctx;

    const [saved, setSaved] = useState(() => clone(initial));
    const [form, setForm] = useState(() => clone(initial));
    const [tab, setTab] = useState("content");
    const [submitted, setSubmitted] = useState(false);
    const [menu, setMenu] = useState(false);
    const [slugTouched, setSlugTouched] = useState(Boolean(initial.id));
    const busyRef = useRef(false);
    const menuRef = useRef(null);

    const dirty = useMemo(() => !sameJson(form, saved), [form, saved]);
    const others = rows(kind).filter((r) => r.id !== form.id);
    const allErrors = useMemo(() => validate(kind, form, others), [kind, form, others.length]); // eslint-disable-line react-hooks/exhaustive-deps
    const errors = submitted ? allErrors : {};
    const strictCount = Object.keys(allErrors).length;
    const isNew = !form.id;
    const entries = history.filter((h) => h.key === `${kind}:${form.id}`);

    const set = (patch) => setForm((f) => ({ ...f, ...patch }));
    const onTitle = (v) => set(slugTouched ? { title: v } : { title: v, slug: slugify(v) });
    const onSlug = (v) => { setSlugTouched(true); set({ slug: v }); };

    /* close the "More" menu */
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

    const goBack = () => {
        if (dirty && !window.confirm("You have unsaved changes. Leave and discard them?")) return;
        onClose();
    };

    const jumpToFirstError = () => setTimeout(() => document.querySelector(".mc-field.has-error")?.scrollIntoView({ behavior: "smooth", block: "center" }), 80);

    const DONE = { save: "Saved.", publish: "Published. Visitors now see it.", schedule: "Scheduled.", unpublish: "Unpublished. It is back to Draft.", archive: "Archived.", cancel: "Event cancelled." };

    const run = (action, at) => {
        busyRef.current = true;
        commit(kind, form, action, at, (rec) => {
            busyRef.current = false;
            setSubmitted(false);
            notify("ok", action === "schedule" && at ? `Scheduled for ${formatDate(at)}.` : DONE[action]);
            if (ctx.live) { onClose(); return; }
            setSaved(clone(rec));
            setForm(clone(rec));
        }, () => { busyRef.current = false; });
    };

    const DIALOGS = {
        publish: { icon: "upload", title: `Publish this ${module.noun}?`, text: "Visitors will see it on the public site straight away.", label: "Publish now" },
        schedule: { icon: "clock", title: "Schedule publication", text: "It goes live automatically at the time you choose.", label: "Schedule", schedule: true },
        unpublish: { icon: "unlink", title: `Unpublish this ${module.noun}?`, text: "It returns to Draft and disappears from the public site. Nothing is deleted.", label: "Unpublish", danger: true },
        archive: { icon: "archive", title: `Archive this ${module.noun}?`, text: "Archived items are hidden from the public site but kept for reference.", label: "Archive" },
        cancel: { icon: "close", title: "Cancel this event?", text: "The event is marked Cancelled and leaves the Upcoming events list.", label: "Cancel event", danger: true, keep: "Keep it" },
    };

    const start = (action) => {
        setMenu(false);
        const strict = action !== "save" || kind === "album";
        const needed = action === "unpublish" || action === "archive" || action === "cancel" ? {} : strict ? allErrors : Object.fromEntries(Object.entries(allErrors).filter(([k]) => LIGHT_KEYS.includes(k)));
        if (Object.keys(needed).length) {
            setSubmitted(true);
            notify("error", `Fix ${Object.keys(needed).length} field${Object.keys(needed).length === 1 ? "" : "s"} before ${action === "save" ? "saving" : action === "schedule" ? "scheduling" : "publishing"}.`);
            jumpToFirstError();
            return;
        }
        if (action === "save") { if (dirty || isNew) run("save"); return; }
        confirm({ ...DIALOGS[action], onConfirm: (at) => run(action, at) });
    };

    /* Ctrl / Cmd + S saves */
    useEffect(() => {
        const onKey = (e) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") { e.preventDefault(); start("save"); } };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    });

    const isAlbum = kind === "album";
    const status = form.status;
    const canPublish = !isAlbum && status !== "published";
    const saveLabel = isAlbum ? "Save album" : status === "published" ? "Save changes" : "Save draft";
    const Fields = isAlbum ? AlbumFields : kind === "event" ? EventFields : PostFields;

    return (
        <div className="mc-edit">
            <div className="mc-heading">
                <div>
                    <button type="button" className="mc-back" onClick={goBack}><Icon name="back" size={16} /> All {module.label.toLowerCase()}</button>
                    <h1>{isNew ? module.add : form.title || "Untitled"}</h1>
                    <div className="mc-status">
                        {!isAlbum && <StatusPill status={status} />}
                        {dirty && <span className="mc-pill is-warn">Unsaved changes</span>}
                        {form.updatedAt && <small>Last edited {timeAgo(form.updatedAt)} by {form.updatedBy}</small>}
                    </div>
                </div>

                <div className="mc-actions">
                    <button type="button" className="mc-btn-outline" onClick={() => openPreview(module, form)}><Icon name="eye" size={16} /> Preview</button>
                    <button type="button" className={isAlbum || !canPublish ? "mc-btn-dark" : "mc-btn-outline"} onClick={() => start("save")} disabled={!dirty && !isNew}><Icon name="save" size={16} /> {saveLabel}</button>
                    {canPublish && (
                        <button type="button" className="mc-btn-dark" onClick={() => start("publish")}>
                            <span className="mc-btn-icon"><Icon name="upload" size={16} /></span> {status === "scheduled" ? "Publish now" : "Publish"}
                        </button>
                    )}
                    <div className="mc-more" ref={menuRef}>
                        <button type="button" className="mc-iconbtn is-round" aria-label="More options" aria-haspopup="menu" aria-expanded={menu} onClick={() => setMenu((v) => !v)}><Icon name="more" size={18} /></button>
                        {menu && (
                            <div className="mc-menu" role="menu">
                                {!isAlbum && status !== "published" && <button type="button" role="menuitem" onClick={() => start("schedule")}><Icon name="clock" size={16} /> Schedule publication</button>}
                                {!isAlbum && (status === "published" || status === "scheduled") && <button type="button" role="menuitem" onClick={() => start("unpublish")}><Icon name="unlink" size={16} /> Unpublish</button>}
                                {kind === "post" && status === "published" && <button type="button" role="menuitem" onClick={() => start("archive")}><Icon name="archive" size={16} /> Archive</button>}
                                {kind === "event" && status === "published" && <button type="button" role="menuitem" onClick={() => start("cancel")}><Icon name="close" size={16} /> Cancel event</button>}
                                <button type="button" role="menuitem" disabled={isNew} onClick={() => { setMenu(false); askDelete({ what: form.title || `this ${module.noun}`, onConfirm: () => { remove(kind, form); onClose(); } }); }}><Icon name="trash" size={16} /> Delete</button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="mc-tabs" role="tablist" aria-label="Record">
                {[["content", "Content"], ["history", "History"]].map(([k, l]) => (
                    <button key={k} type="button" role="tab" aria-selected={tab === k} className={tab === k ? "is-active" : ""} onClick={() => setTab(k)}>
                        {l}
                        {k === "content" && submitted && strictCount > 0 && <span className="mc-badge-error">{strictCount}</span>}
                        {k === "history" && <span className="mc-badge">{entries.length}</span>}
                    </button>
                ))}
            </div>

            {tab === "content" ? (
                <div className="mc-layout">
                    <section className="mc-card">
                        <header className="mc-card-head">
                            <div>
                                <span className="mc-card-no">{isNew ? "New" : "Editing"} {module.noun}</span>
                                <h2>{module.label}</h2>
                                <p>{isAlbum ? "Changes go live when you save." : "Save a draft at any time. Publishing needs every field below completed."}</p>
                            </div>
                        </header>
                        <Fields form={form} set={set} errors={errors} module={module} onTitle={onTitle} onSlug={onSlug} />
                    </section>
                    <SidePanel kind={kind} form={form} set={set} module={module} />
                </div>
            ) : (
                <HistoryPanel entries={entries} />
            )}

            {dirty && (
                <div className="mc-savebar" role="region" aria-label="Unsaved changes">
                    <span className="mc-savebar-text"><i /> Unsaved changes</span>
                    <div>
                        <button type="button" className="mc-btn-ghost" onClick={() => { setForm(clone(saved)); setSubmitted(false); notify("info", "Changes discarded."); }}>Discard</button>
                        <button type="button" className="mc-btn-yellow" onClick={() => start("save")}>{saveLabel}</button>
                    </div>
                </div>
            )}
        </div>
    );
}

/* ====================================================================
   PAGE
==================================================================== */

export default function AdminPSBMediaCentre() {
    const { props, url } = usePage();
    const live = Boolean(props.mediaCentre?.posts);

    const seed = useRef(live ? props.mediaCentre : sample).current;
    const [local, setLocal] = useState(() => ({ posts: clone(seed.posts), events: clone(seed.events), albums: clone(seed.albums), history: clone(seed.history || []) }));
    const [mediaList, setMediaList] = useState(seed.media);

    const src = live ? props.mediaCentre : local;
    const media = live ? props.mediaCentre.media : mediaList;
    const categories = live ? props.mediaCentre.categories : seed.categories;
    const history = src.history || [];
    const rows = (kind) => src[KEY[kind]] || [];

    const [active, setActive] = useState(() => {
        const wanted = props.section || MODULES.find((m) => (url || "").includes(`/media-centre/${m.route}`))?.route;
        const i = MODULES.findIndex((m) => m.route === wanted);
        return i >= 0 ? i : 0;
    });
    const [editing, setEditing] = useState(null);
    const [dlg, setDlg] = useState(null);
    const [picker, setPicker] = useState(null);
    const [previewing, setPreviewing] = useState(null);
    const [toast, setToast] = useState(null);

    const module = MODULES[active];
    const notify = (tone, text) => setToast({ tone, text });

    useEffect(() => {
        if (!toast) return undefined;
        const t = setTimeout(() => setToast(null), 5000);
        return () => clearTimeout(t);
    }, [toast]);

    const addHistory = (l, kind, rec, action, changes) => [{ id: Date.now() + Math.random(), key: `${kind}:${rec.id}`, user: "You", action, label: rec.title, at: new Date().toISOString(), changes }, ...l.history];

    /* save / publish / schedule / unpublish / archive / cancel */
    const commit = (kind, rec, action, at, done, fail) => {
        if (live) {
            const opts = { preserveScroll: true, onSuccess: () => done(rec), onError: () => { fail?.(); notify("error", "The server rejected some values. Check the highlighted fields."); } };
            const body = { record: rec, action, at };
            if (rec.id) router.put(`${API[kind]}/${rec.id}`, body, opts);
            else router.post(API[kind], body, opts);
            return;
        }
        setTimeout(() => {
            const now = new Date().toISOString();
            const key = KEY[kind];
            const prev = local[key].find((r) => r.id === rec.id);
            const next = { ...rec, id: rec.id || Date.now(), updatedAt: now, updatedBy: "You" };
            if (action === "publish") { next.status = "published"; next.publishedAt = now; next.scheduledAt = null; }
            if (action === "schedule") { next.status = "scheduled"; next.scheduledAt = at; }
            if (action === "unpublish") { next.status = "draft"; next.scheduledAt = null; }
            if (action === "archive") next.status = "archived";
            if (action === "cancel") next.status = "cancelled";
            const hist = action === "publish" ? "PUBLISH" : action === "unpublish" ? "UNPUBLISH" : prev ? "UPDATE" : "CREATE";
            setLocal((l) => ({
                ...l,
                [key]: prev ? l[key].map((r) => (r.id === next.id ? next : r)) : [next, ...l[key]],
                history: addHistory(l, kind, next, hist, diffOf(prev, next)),
            }));
            done(next);
        }, 300);
    };

    const remove = (kind, rec) => {
        if (live) {
            router.delete(`${API[kind]}/${rec.id}`, { preserveScroll: true, onSuccess: () => notify("ok", `“${rec.title}” moved to Trash.`), onError: () => notify("error", "Something went wrong. Nothing was deleted.") });
            return;
        }
        const key = KEY[kind];
        setLocal((l) => ({ ...l, [key]: l[key].filter((r) => r.id !== rec.id), history: addHistory(l, kind, rec, "DELETE", [{ field: "Moved to Trash", from: rec.title, to: "(deleted)" }]) }));
        notify("ok", `“${rec.title}” moved to Trash. Only the Super Admin can restore it.`);
    };

    const pin = (kind, rec, pinned) => {
        if (live) { router.post(`${API[kind]}/${rec.id}/pin`, { pinned }, { preserveScroll: true, onSuccess: () => notify("ok", pinned ? "Pinned to the Home page." : "Unpinned from the Home page.") }); return; }
        const key = KEY[kind];
        setLocal((l) => ({ ...l, [key]: l[key].map((r) => (r.id === rec.id ? { ...r, pinned } : r)), history: addHistory(l, kind, rec, "UPDATE", [{ field: FIELD_LABEL.pinned, from: short(rec.pinned), to: short(pinned) }]) }));
        notify("ok", pinned ? "Pinned to the Home page." : "Unpinned from the Home page.");
    };

    const reorder = (ids) => {
        if (live) { router.put(`${API.album}/reorder`, { ids }, { preserveScroll: true }); return; }
        setLocal((l) => ({ ...l, albums: ids.map((id) => l.albums.find((a) => a.id === id)) }));
        notify("ok", "Album order saved.");
    };

    const uploadMedia = (file) => {
        const isVideo = file.type.startsWith("video");
        const item = { id: Date.now(), name: file.name, type: isVideo ? "video" : "image", alt: "", size: `${(file.size / 1048576).toFixed(1)} MB`, url: isVideo ? null : URL.createObjectURL(file) };
        if (live) router.post(API.upload, { file }, { forceFormData: true, preserveScroll: true, onSuccess: () => notify("ok", `${file.name} uploaded.`), onError: () => notify("error", "The file could not be uploaded.") });
        else { setMediaList((m) => [item, ...m]); notify("ok", `${file.name} added (sample data, not stored).`); }
    };

    const askDelete = (info) => setDlg({ icon: "trash", danger: true, title: `Delete “${info.what}”?`, text: "It moves to Content Trash, where only the Super Admin can restore or purge it. It disappears from the public site straight away.", keep: "Keep it", label: "Move to Trash", onConfirm: info.onConfirm });

    const ctx = {
        live, media, categories, history, rows, notify, commit, remove, pin, reorder, askDelete,
        confirm: (d) => setDlg(d),
        pickMedia: (opts) => setPicker(opts),
        preview: (m, rec) => setPreviewing({ module: m, rec }),
    };

    const countFor = (m) => rows(m.kind).filter((r) => m.kind !== "post" || m.types.includes(r.type)).length;

    return (
        <Ctx.Provider value={ctx}>
            <div className="psb-media">
                {editing ? (
                    <Editor key={editing.id ?? "new"} module={module} initial={editing} onClose={() => setEditing(null)} />
                ) : (
                    <>
                        <div className="mc-heading">
                            <div>
                                <h1>Media Centre</h1>
                                <p>Create, update and remove the news, press releases, events, gallery and articles shown on the Perlis Airspace Sandbox website.</p>
                            </div>
                        </div>

                        {!live && (
                            <p className="mc-note"><Icon name="alert" size={16} /><span>Sample data. Every control works, but nothing is stored until your controller sends the <b>mediaCentre</b> prop.</span></p>
                        )}

                        <div className="mc-tabs" role="tablist" aria-label="Media Centre modules">
                            {MODULES.map((m, i) => (
                                <button key={m.key} type="button" role="tab" aria-selected={active === i} className={active === i ? "is-active" : ""} onClick={() => setActive(i)}>
                                    {m.label}
                                    <span className="mc-badge">{countFor(m)}</span>
                                </button>
                            ))}
                        </div>

                        {module.kind === "album" ? (
                            <AlbumList key={module.key} module={module} onNew={() => setEditing(blankFor(module))} onEdit={(r) => setEditing(clone(r))} />
                        ) : (
                            <ListView key={module.key} module={module} onNew={() => setEditing(blankFor(module))} onEdit={(r) => setEditing(clone(r))} />
                        )}
                    </>
                )}

                {dlg && <ConfirmDialog dlg={dlg} notify={notify} onClose={() => setDlg(null)} />}
                {picker && <MediaPicker state={picker} media={media} onClose={() => setPicker(null)} onUpload={uploadMedia} />}
                {previewing && <PreviewModal module={previewing.module} rec={previewing.rec} onClose={() => setPreviewing(null)} />}

                {toast && (
                    <div className={`mc-toast is-${toast.tone}`} role="status">
                        <Icon name={toast.tone === "error" ? "alert" : "check"} size={16} />
                        <span>{toast.text}</span>
                        <button type="button" aria-label="Dismiss" onClick={() => setToast(null)}><Icon name="close" size={14} /></button>
                    </div>
                )}
            </div>
        </Ctx.Provider>
    );
}

/* Wrap the page with your PSB shell here if your app does not already do it:
   import NavigationBar from "../../Components/Admin-Components/PSB/NavigationBar";
   AdminPSBMediaCentre.layout = (page) => <NavigationBar>{page}</NavigationBar>;          */

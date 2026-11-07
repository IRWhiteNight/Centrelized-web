import { createContext, useContext, useEffect, useId, useMemo, useRef, useState } from "react";
import { router, usePage } from "@inertiajs/react";
import "../../../css/admin-PSB-css/admin-site-information.css";

/* ====================================================================
   PSB ADMIN → SITE INFORMATION            /admin/psb/site-information/*

   Site map (PSB workspace → "Site Information"), one page for all five modules:
     1  Location and Access (map, coordinates)  → psb_locations
     2  Facilities and Infrastructure           → psb_facilities (+ media_assets cover)
     3  Airspace and Operational Information    → psb_airspace_zones (+ documents chart)
     4  Weather Information and links           → psb_weather_links
     5  Guidelines and Downloads                → documents (+ media_assets file)
   Common screens from the document: list with search and filter, create / edit,
   preview, reorder (drag) where the public page shows an ordered list (facilities),
   delete to Trash, History tab (audit_logs for this record).
   The ERD (ERD-4 / ERD-5) has no draft / status column on these tables, so changes go
   live when saved. The only visibility switch is documents.is_public.
   Media is always chosen from media_assets (never stored inside the content).

   SAMPLE DATA: the page works today (changes stay on screen only). Return an Inertia prop
   named `siteInfo` and it switches to LIVE mode:

   Inertia::render('admin/AdminPSBSiteInformation', [
       'section' => 'location',  // optional: location | facilities | airspace | weather | downloads
       'siteInfo' => [
           'locations'    => [...],  // same shape as `sample.locations` below
           'facilities'   => [...],  // in public display order (sort_order)
           'zones'        => [...],  // psb_airspace_zones
           'weatherLinks' => [...],
           'documents'    => [...],  // documents for this site (all categories)
           'media'        => [...],  // media_assets: { id, name, type: image|video|document, alt, size, url? }
           'history'      => [...],  // audit_logs rows: { id, key: "facility:3", user, action, label, at, changes }
       ],
   ]);

   Map the five sidebar routes (/admin/psb/site-information/location, /facilities, /airspace,
   /weather, /downloads) to this same component. LIVE mode requests are listed in API below.
   The controller must write audit_logs and check the site scope (RBAC).
==================================================================== */

const BASE = "/admin/psb"; // keep in sync with psbRoutes.js
const SI = `${BASE}/site-information`;
const API = {
    location: `${SI}/locations`, //        POST (new) · PUT /:id · DELETE /:id   body { record }
    facility: `${SI}/facilities`, //       same, plus PUT /reorder { ids }
    zone: `${SI}/airspace-zones`, //       same
    weather: `${SI}/weather-links`, //     same
    document: `${SI}/documents`, //        same, plus POST /:id/visibility { isPublic }
    upload: `${BASE}/media-library/upload`, // POST multipart { file }
};
const KEY = { location: "locations", facility: "facilities", zone: "zones", weather: "weatherLinks", document: "documents" };
const LIBRARY = `${BASE}/media-library`;

const MODULES = [
    { key: "location", route: "location", label: "Location and Access", hint: "Where the sandbox is, how to get there and the map", kind: "location", noun: "location", add: "New location" },
    { key: "facilities", route: "facilities", label: "Facilities and Infrastructure", hint: "Test areas, landing areas, hangars and ground support. Drag to set the public order", kind: "facility", noun: "facility", add: "New facility", ordered: true },
    { key: "airspace", route: "airspace", label: "Airspace and Operational Info", hint: "Zones, operating hours and restrictions", kind: "zone", noun: "airspace zone", add: "New zone" },
    { key: "weather", route: "weather", label: "Weather Information and Links", hint: "Trusted weather sources shown to participants", kind: "weather", noun: "weather link", add: "New link" },
    { key: "downloads", route: "downloads", label: "Guidelines and Downloads", hint: "Guidelines, safety documents, forms and charts", kind: "document", noun: "document", add: "New document" },
];

const FACILITY_TYPES = [["test_area", "Test area"], ["landing_area", "Landing area"], ["hangar", "Hangar"], ["ground_support", "Ground support"], ["other", "Other"]];
const DOC_CATEGORIES = [["guideline", "Guideline"], ["safety", "Safety"], ["form", "Form"], ["chart", "Chart"], ["brochure", "Brochure"], ["presentation", "Presentation"], ["other", "Other"]];
const LABEL = { facilityType: Object.fromEntries(FACILITY_TYPES), docCategory: Object.fromEntries(DOC_CATEGORIES) };
const TITLE = { location: "name", facility: "name", zone: "zoneName", weather: "label", document: "title" };

/* Every field the public pages need, grouped as the form shows them.
   type: text | textarea | number | url | select | media | toggle    half: shares a row with the next field */
const SCHEMA = {
    location: [
        { title: "Place", text: "Name and address shown on the Location page.", fields: [
            { key: "name", label: "Place name", type: "text", req: true, max: 200 },
            { key: "address", label: "Address", type: "textarea", rows: 3, req: true, max: 500 },
        ] },
        { title: "Map coordinates", text: "Used for the map pin and directions.", fields: [
            { key: "latitude", label: "Latitude", type: "number", req: true, lo: -90, hi: 90, half: true, placeholder: "6.4382" },
            { key: "longitude", label: "Longitude", type: "number", req: true, lo: -180, hi: 180, half: true, placeholder: "100.2105" },
            { key: "mapEmbedUrl", label: "Map embed link", type: "url", max: 500, placeholder: "https://www.google.com/maps/embed?...", hint: "Optional. In Google Maps choose Share, then Embed a map, and paste the address after src=." },
        ] },
        { title: "Access", text: "How visitors and teams get in.", fields: [
            { key: "accessNotes", label: "Access notes", type: "textarea", rows: 5, max: 1500, hint: "Entry gate, parking, security checks and who to contact on arrival." },
        ] },
    ],
    facility: [
        { title: "Facility", text: "What it is and where it sits.", fields: [
            { key: "name", label: "Facility name", type: "text", req: true, max: 200 },
            { key: "facilityType", label: "Type", type: "select", req: true, half: true, options: [["", "Choose a type"], ...FACILITY_TYPES] },
            { key: "locationId", label: "Location", type: "select", half: true, numeric: true, options: "locations", hint: "Optional." },
            { key: "description", label: "Description", type: "textarea", rows: 5, max: 2000 },
        ] },
        { title: "Photo", text: "Shown on the facility card.", fields: [
            { key: "coverId", label: "Cover image", type: "media", accept: "image" },
        ] },
    ],
    zone: [
        { title: "Zone", text: "Name, description and when it is open.", fields: [
            { key: "zoneName", label: "Zone name", type: "text", req: true, max: 150 },
            { key: "description", label: "Description", type: "textarea", rows: 4, max: 2000 },
            { key: "operatingHours", label: "Operating hours", type: "text", max: 150, placeholder: "Daily, 08:00 – 18:00 (MYT)" },
        ] },
        { title: "Restrictions and chart", text: "Rules participants must follow before flying.", fields: [
            { key: "restrictions", label: "Restrictions", type: "textarea", rows: 5, max: 2000 },
            { key: "chartDocumentId", label: "Airspace chart", type: "select", numeric: true, options: "charts", hint: "Optional. Add charts under Guidelines and Downloads with the category Chart." },
        ] },
    ],
    weather: [
        { title: "Weather source", text: "A link participants can check before a flight.", fields: [
            { key: "label", label: "Link text", type: "text", req: true, max: 150, placeholder: "Malaysian Meteorological Department" },
            { key: "sourceName", label: "Source name", type: "text", req: true, max: 150 },
            { key: "url", label: "Link", type: "url", req: true, max: 400, placeholder: "https://" },
            { key: "summary", label: "Short note", type: "textarea", rows: 3, max: 500, hint: "What visitors will find at this link." },
        ] },
    ],
    document: [
        { title: "Document", text: "The file visitors download.", fields: [
            { key: "title", label: "Title", type: "text", req: true, max: 255 },
            { key: "docCategory", label: "Category", type: "select", req: true, half: true, options: [["", "Choose a category"], ...DOC_CATEGORIES] },
            { key: "versionLabel", label: "Version", type: "text", max: 30, half: true, placeholder: "v1.0" },
            { key: "mediaId", label: "File", type: "media", accept: "document", req: true },
        ] },
        { title: "Visibility", text: "Hidden documents stay in the list but visitors cannot see them.", fields: [
            { key: "isPublic", label: "Show on the public Downloads page", type: "toggle" },
        ] },
    ],
};

const MIN = 60 * 1000;
const NOW = Date.now();
const minsAgo = (m) => new Date(NOW - m * MIN).toISOString();

/* ------------------------------ sample data ------------------------------ */
/* coordinates below are placeholders for the sample only */

const sample = {
    media: [
        { id: 1, name: "site-aerial.jpg", type: "image", alt: "Aerial view of the Sungai Batu Pahat site", size: "2.1 MB" },
        { id: 2, name: "hangar-interior.jpg", type: "image", alt: "Inside the research and maintenance hangar", size: "1.9 MB" },
        { id: 3, name: "runway-upgrade.mp4", type: "video", alt: "Runway upgrade walkthrough", size: "24.0 MB" },
        { id: 4, name: "test-area.jpg", type: "image", alt: "", size: "1.6 MB" },
        { id: 5, name: "vertiport-concept.jpg", type: "image", alt: "Concept drawing of the vertiport", size: "2.6 MB" },
        { id: 6, name: "participation-guidelines.pdf", type: "document", alt: "", size: "1.2 MB" },
        { id: 7, name: "flight-safety-requirements.pdf", type: "document", alt: "", size: "860 KB" },
        { id: 8, name: "application-form.pdf", type: "document", alt: "", size: "420 KB" },
        { id: 9, name: "airspace-chart-zone-a.pdf", type: "document", alt: "", size: "3.4 MB" },
        { id: 10, name: "sandbox-brochure.pdf", type: "document", alt: "", size: "5.8 MB" },
    ],
    locations: [
        { id: 1, name: "Perlis Airspace Sandbox, Sungai Batu Pahat", address: "Sungai Batu Pahat,\n02600 Arau, Perlis, Malaysia", latitude: 6.4382, longitude: 100.2105, mapEmbedUrl: "", accessNotes: "Enter through the main gate and register at the security post. Visitors need photo identification.\n\nParking is available beside the hangar. Call the programme office before arrival so the team can meet you at the gate.", updatedAt: minsAgo(60 * 24 * 12), updatedBy: "Aiman Hakim" },
        { id: 2, name: "Timah Tasoh Dam corridor endpoint", address: "Timah Tasoh Dam,\nKangar, Perlis, Malaysia", latitude: 6.6167, longitude: 100.2167, mapEmbedUrl: "", accessNotes: "Planned landing point for the proposed corridor. Not open to visitors during Phase 1.", updatedAt: minsAgo(60 * 24 * 9), updatedBy: "Farid Rahman" },
    ],
    facilities: [
        { id: 1, name: "Test area", facilityType: "test_area", locationId: 1, description: "A controlled outdoor area for flight trials, with marked boundaries and a safety perimeter.", coverId: 4, updatedAt: minsAgo(60 * 24 * 10), updatedBy: "Aiman Hakim" },
        { id: 2, name: "Runway and landing area", facilityType: "landing_area", locationId: 1, description: "A mock-up aerodrome with an upgraded runway and designated landing pads for fixed-wing and VTOL aircraft.", coverId: 3, updatedAt: minsAgo(60 * 24 * 8), updatedBy: "Aiman Hakim" },
        { id: 3, name: "Research and maintenance hangar", facilityType: "hangar", locationId: 1, description: "Indoor space for assembly, inspection and maintenance of participant aircraft.", coverId: 2, updatedAt: minsAgo(60 * 24 * 8), updatedBy: "Farid Rahman" },
        { id: 4, name: "Ground support equipment", facilityType: "ground_support", locationId: 1, description: "Charging, power, communications and tooling available to participating teams.", coverId: null, updatedAt: minsAgo(60 * 24 * 6), updatedBy: "Farid Rahman" },
        { id: 5, name: "Vertiport (planned)", facilityType: "other", locationId: 1, description: "A vertiport for eVTOL demonstrations, planned for a later development phase.", coverId: 5, updatedAt: minsAgo(60 * 24 * 4), updatedBy: "Aiman Hakim" },
    ],
    zones: [
        { id: 1, zoneName: "Sandbox test zone A", description: "The main controlled airspace over the site, used for approved test flights.", operatingHours: "Daily, 08:00 – 18:00 (MYT)", restrictions: "Flights only with an approved application.\nMaximum altitude as stated in the approval.\nAll aircraft must be registered and carry the agreed tracking device.", chartDocumentId: 4, updatedAt: minsAgo(60 * 24 * 7), updatedBy: "Aiman Hakim" },
        { id: 2, zoneName: "Corridor to Timah Tasoh Dam (planned)", description: "A proposed low-altitude corridor for BVLOS trials.", operatingHours: "", restrictions: "Not yet open. Subject to approval by the relevant authorities.", chartDocumentId: null, updatedAt: minsAgo(60 * 24 * 3), updatedBy: "Farid Rahman" },
    ],
    weatherLinks: [
        { id: 1, label: "Malaysian Meteorological Department", sourceName: "MET Malaysia", url: "https://www.met.gov.my/", summary: "Official forecasts and warnings for Perlis.", updatedAt: minsAgo(60 * 24 * 20), updatedBy: "Aiman Hakim" },
        { id: 2, label: "Wind and rain radar", sourceName: "Windy", url: "https://www.windy.com/", summary: "Live wind, gust and rain radar maps for flight planning.", updatedAt: minsAgo(60 * 24 * 20), updatedBy: "Aiman Hakim" },
    ],
    documents: [
        { id: 1, title: "Sandbox Participation Guidelines", docCategory: "guideline", versionLabel: "v1.2", mediaId: 6, isPublic: true, publishedAt: minsAgo(60 * 24 * 14), updatedAt: minsAgo(60 * 24 * 14), updatedBy: "Aiman Hakim" },
        { id: 2, title: "Flight Safety Requirements", docCategory: "safety", versionLabel: "v1.0", mediaId: 7, isPublic: true, publishedAt: minsAgo(60 * 24 * 14), updatedAt: minsAgo(60 * 24 * 14), updatedBy: "Aiman Hakim" },
        { id: 3, title: "Application Form", docCategory: "form", versionLabel: "v2.0", mediaId: 8, isPublic: true, publishedAt: minsAgo(60 * 24 * 5), updatedAt: minsAgo(60 * 24 * 5), updatedBy: "Farid Rahman" },
        { id: 4, title: "Airspace Chart: Zone A", docCategory: "chart", versionLabel: "v1.0", mediaId: 9, isPublic: true, publishedAt: minsAgo(60 * 24 * 7), updatedAt: minsAgo(60 * 24 * 7), updatedBy: "Aiman Hakim" },
        { id: 5, title: "Sandbox Brochure", docCategory: "brochure", versionLabel: "v0.9", mediaId: 10, isPublic: false, publishedAt: null, updatedAt: minsAgo(60 * 26), updatedBy: "Farid Rahman" },
    ],
    history: [
        { id: 5, key: "document:4", user: "Aiman Hakim", action: "UPDATE", label: "Airspace Chart: Zone A", at: minsAgo(60 * 24 * 7), changes: [{ field: "Version", from: "(empty)", to: "v1.0" }] },
        { id: 4, key: "zone:1", user: "Aiman Hakim", action: "UPDATE", label: "Sandbox test zone A", at: minsAgo(60 * 24 * 7), changes: [{ field: "Airspace chart", from: "(empty)", to: "4" }] },
        { id: 3, key: "facility:5", user: "Aiman Hakim", action: "CREATE", label: "Vertiport (planned)", at: minsAgo(60 * 24 * 4), changes: [] },
        { id: 2, key: "location:1", user: "Aiman Hakim", action: "UPDATE", label: "Perlis Airspace Sandbox, Sungai Batu Pahat", at: minsAgo(60 * 24 * 12), changes: [{ field: "Access notes", from: "(empty)", to: "Enter through the main gate and register at the security post..." }] },
        { id: 1, key: "document:5", user: "Farid Rahman", action: "CREATE", label: "Sandbox Brochure", at: minsAgo(60 * 26), changes: [] },
    ],
};

/* ------------------------------ helpers ------------------------------ */

const clone = (v) => JSON.parse(JSON.stringify(v));
const sameJson = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const initialsOf = (name) => (name || "?").split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase();
const hostOf = (u) => { try { return new URL(u).host; } catch { return u; } };
const isEmbed = (u) => /^https:\/\/\S+$/i.test((u || "").trim());
const validCoords = (lat, lng) => lat !== "" && lng !== "" && lat != null && lng != null && !Number.isNaN(Number(lat)) && !Number.isNaN(Number(lng));
const mapsLink = (lat, lng) => `https://www.google.com/maps?q=${Number(lat)},${Number(lng)}`;

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

const short = (v) => {
    const s = v === null || v === undefined || v === "" ? "(empty)" : typeof v === "boolean" ? (v ? "Yes" : "No") : String(v).replace(/\s+/g, " ");
    return s.length > 70 ? `${s.slice(0, 67)}...` : s;
};
const diffOf = (kind, a, b) => (a ? SCHEMA[kind].flatMap((blk) => blk.fields).filter((fd) => JSON.stringify(a[fd.key]) !== JSON.stringify(b[fd.key])).map((fd) => ({ field: fd.label, from: short(a[fd.key]), to: short(b[fd.key]) })) : []);

/* drawn thumbnail for a media asset (real files would use their own URL) */
function thumbOf(item) {
    if (item?.url) return item.url;
    const label = (item?.name || "media").replace(/[<>&"]/g, "");
    const art = item?.type === "video"
        ? '<circle cx="160" cy="84" r="26" fill="#fff" fill-opacity=".92"/><path d="M152 70v28l24-14z" fill="#0b1a28"/>'
        : item?.type === "document"
            ? '<path d="M132 44h40l22 22v62H132z" fill="#fff" fill-opacity=".95"/><path d="M172 44v22h22" fill="#facc15"/><path d="M144 86h38M144 100h38M144 114h26" stroke="#0b1a28" stroke-width="4" stroke-linecap="round"/>'
            : '<circle cx="160" cy="84" r="9" fill="#fff"/><path d="M130 54l60 60M190 54l-60 60" stroke="#fff" stroke-width="4" stroke-linecap="round"/>';
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0b1a28"/><stop offset="1" stop-color="#1d4160"/></linearGradient></defs><rect width="320" height="200" fill="url(#g)"/><path d="M-10 170L120 110 330 70V110L130 150 -10 200Z" fill="#facc15" fill-opacity=".9"/>${art}<text x="14" y="186" fill="#fff" font-family="Arial,sans-serif" font-size="13" font-weight="700">${label}</text></svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const blankFor = (kind) => {
    const rec = { id: null };
    SCHEMA[kind].forEach((b) => b.fields.forEach((fd) => { rec[fd.key] = fd.type === "toggle" ? false : fd.type === "media" || fd.numeric ? null : ""; }));
    if (kind === "document") rec.publishedAt = null;
    return rec;
};

/* every rule the public Site Information pages need. Returns { field: "message" } */
function validate(kind, f) {
    const e = {};
    SCHEMA[kind].forEach((blk) => blk.fields.forEach((fd) => {
        const v = f[fd.key];
        const s = (v ?? "").toString().trim();
        const name = fd.label.toLowerCase();
        if (fd.type === "toggle") return;
        if (fd.type === "media" || fd.type === "select") { if (fd.req && (v === null || v === "" || v === undefined)) e[fd.key] = `Choose ${name}.`; return; }
        if (!s) { if (fd.req) e[fd.key] = `Enter ${name}.`; return; }
        if (fd.type === "number") {
            const n = Number(s);
            if (Number.isNaN(n)) e[fd.key] = "Enter a number.";
            else if (n < fd.lo || n > fd.hi) e[fd.key] = `Use a value between ${fd.lo} and ${fd.hi}.`;
            return;
        }
        if (fd.max && s.length > fd.max) e[fd.key] = `Use ${fd.max} characters or fewer.`;
        else if (fd.type === "url" && !/^https?:\/\/\S+$/i.test(s)) e[fd.key] = "Use a full address starting with https://";
    }));
    return e;
}

/* what happens to other records when this one is deleted */
function usageText(kind, rec, rows) {
    if (kind === "location") { const n = rows("facility").filter((x) => x.locationId === rec.id).length; return n ? ` ${n} ${n === 1 ? "facility is" : "facilities are"} linked to it and will become unlinked.` : ""; }
    if (kind === "document") { const n = rows("zone").filter((x) => x.chartDocumentId === rec.id).length; return n ? ` ${n} airspace ${n === 1 ? "zone uses" : "zones use"} it as a chart and will lose the link.` : ""; }
    return "";
}

/* ------------------------------ shared state ------------------------------ */

const Ctx = createContext(null);
const useSi = () => useContext(Ctx);

/* ------------------------------ icons ------------------------------ */

function Icon({ name, size = 18 }) {
    const icons = {
        eye: (<><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></>),
        save: (<><path d="M5 3h11l4 4v14H5z" /><path d="M8 3v6h8V3M8 21v-7h8v7" /></>),
        upload: (<><path d="M12 16V4M7 9l5-5 5 5" /><path d="M4 20h16" /></>),
        more: (<><circle cx="5" cy="12" r="1.2" /><circle cx="12" cy="12" r="1.2" /><circle cx="19" cy="12" r="1.2" /></>),
        grip: (<><circle cx="9" cy="6" r="1.2" /><circle cx="15" cy="6" r="1.2" /><circle cx="9" cy="12" r="1.2" /><circle cx="15" cy="12" r="1.2" /><circle cx="9" cy="18" r="1.2" /><circle cx="15" cy="18" r="1.2" /></>),
        up: <path d="m6 15 6-6 6 6" />,
        down: <path d="m6 9 6 6 6-6" />,
        trash: (<><path d="M4 7h16M10 11v6M14 11v6" /><path d="M6 7l1 13h10l1-13M9 7V4h6v3" /></>),
        plus: <path d="M12 5v14M5 12h14" />,
        pin: (<><path d="M12 22s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12z" /><circle cx="12" cy="10" r="2.5" /></>),
        close: <path d="M6 6l12 12M18 6 6 18" />,
        check: <path d="m5 12 5 5 9-10" />,
        alert: (<><path d="M12 3 2.5 20h19z" /><path d="M12 10v4M12 17.2v.1" /></>),
        search: (<><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4-4" /></>),
        image: (<><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" /></>),
        file: (<><path d="M6 3h8l5 5v13H6z" /><path d="M14 3v5h5M9 13h6M9 17h6" /></>),
        external: <path d="M14 4h6v6M20 4l-9 9M18 14v5H5V6h5" />,
        edit: (<><path d="M4 20h4L19 9l-4-4L4 16z" /><path d="m13.5 6.5 4 4" /></>),
        back: <path d="M15 5l-7 7 7 7" />,
        cloud: <path d="M7 18a4 4 0 0 1-.6-8A6 6 0 0 1 18 9.5 4.3 4.3 0 0 1 17.5 18z" />,
        layers: (<><path d="m12 3 9 5-9 5-9-5z" /><path d="m3 13 9 5 9-5" /></>),
        building: (<><path d="M4 21V8l8-5 8 5v13z" /><path d="M9 21v-6h6v6" /></>),
    };
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            {icons[name]}
        </svg>
    );
}

const KIND_ICON = { location: "pin", facility: "building", zone: "layers", weather: "cloud", document: "file" };

/* ------------------------------ form pieces ------------------------------ */

function Toggle({ checked, onChange, label }) {
    return (
        <button type="button" role="switch" aria-checked={checked} aria-label={label} className={`si-toggle ${checked ? "is-on" : ""}`} onClick={() => onChange(!checked)}>
            <span />
        </button>
    );
}

/* One labelled text box or text area with a character counter and an error line */
function Field({ label, hint, value, onChange, error, max, rows, placeholder, type = "text" }) {
    const id = useId();
    const length = (value ?? "").toString().length;
    return (
        <div className={`si-field ${error ? "has-error" : ""}`}>
            <div className="si-field-top">
                <label htmlFor={id}>{label}</label>
                {max && type !== "number" && <span className={`si-count ${length > max ? "is-over" : ""}`}>{length}/{max}</span>}
            </div>
            {rows ? (
                <textarea id={id} className="si-input si-textarea" rows={rows} value={value ?? ""} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
            ) : (
                <input id={id} type={type} step={type === "number" ? "any" : undefined} inputMode={type === "number" ? "decimal" : undefined} className="si-input" value={value ?? ""} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
            )}
            {hint && !error && <p className="si-hint">{hint}</p>}
            {error && <p className="si-error" role="alert"><Icon name="alert" size={13} /> {error}</p>}
        </div>
    );
}

function SelectField({ label, hint, value, onChange, options, error }) {
    const id = useId();
    return (
        <div className={`si-field ${error ? "has-error" : ""}`}>
            <div className="si-field-top"><label htmlFor={id}>{label}</label></div>
            <select id={id} className="si-input si-select is-block" value={value ?? ""} onChange={(e) => onChange(e.target.value)}>
                {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            {hint && !error && <p className="si-hint">{hint}</p>}
            {error && <p className="si-error" role="alert"><Icon name="alert" size={13} /> {error}</p>}
        </div>
    );
}

function BlockHead({ title, text, aside }) {
    return (
        <div className="si-block-head">
            <div>
                <h3>{title}</h3>
                {text && <p>{text}</p>}
            </div>
            {aside}
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

/* An ordered list where every row can be moved and deleted (delete asks first and moves the row to Trash) */
function Orderable({ items, onMove, onRemove, nameOf, children, empty, disabled }) {
    const { askDelete } = useSi();
    const drag = useDrag(onMove, disabled);

    if (!items.length) return <p className="si-empty">{empty}</p>;

    return (
        <ul className="si-list">
            {items.map((item, i) => (
                <li key={item.id} className={`si-item ${drag.over === i ? "is-over" : ""}`} {...drag.rowProps(i)}>
                    <button type="button" className="si-handle" aria-label={`Drag ${nameOf(item)} to reorder`} title={disabled ? "Clear the search and filter to reorder" : "Drag to reorder"} disabled={disabled} {...drag.handleProps(i)}>
                        <Icon name="grip" size={16} />
                    </button>
                    <span className="si-item-no">{i + 1}</span>
                    <div className="si-item-body">{children(item, i)}</div>
                    <div className="si-item-tools">
                        <button type="button" className="si-iconbtn" aria-label="Move up" title="Move up" disabled={disabled || i === 0} onClick={() => onMove(i, i - 1)}><Icon name="up" size={15} /></button>
                        <button type="button" className="si-iconbtn" aria-label="Move down" title="Move down" disabled={disabled || i === items.length - 1} onClick={() => onMove(i, i + 1)}><Icon name="down" size={15} /></button>
                        <button type="button" className="si-iconbtn is-danger" aria-label={`Delete ${nameOf(item)}`} title="Delete (moves to Trash)" onClick={() => askDelete({ what: nameOf(item), onConfirm: () => onRemove(i) })}><Icon name="trash" size={15} /></button>
                    </div>
                </li>
            ))}
        </ul>
    );
}

/* ------------------------------ media ------------------------------ */

const MEDIA_WORD = { image: "Image", video: "Video", document: "Document" };

function MediaField({ label, hint, mediaId, onChange, accept = "any", error }) {
    const { media, pickMedia } = useSi();
    const asset = media.find((m) => m.id === mediaId);
    const needsAlt = asset && asset.type === "image" && !asset.alt;

    return (
        <div className={`si-field ${error ? "has-error" : ""}`}>
            <div className="si-field-top"><label>{label}</label></div>
            <div className="si-media">
                <span className="si-media-thumb">{asset ? <img src={thumbOf(asset)} alt="" /> : <Icon name={accept === "document" ? "file" : "image"} size={22} />}</span>
                <div className="si-media-text">
                    {asset ? (
                        <>
                            <strong>{asset.name}</strong>
                            <small>{MEDIA_WORD[asset.type]} · {asset.size}</small>
                            {needsAlt ? (
                                <small className="si-media-warn"><Icon name="alert" size={12} /> No alt text. Add it in the Media Library.</small>
                            ) : asset.type === "image" ? (
                                <small title={asset.alt}>Alt text: {asset.alt}</small>
                            ) : null}
                        </>
                    ) : (
                        <>
                            <strong>No file chosen</strong>
                            <small>Pick a file from the Media Library</small>
                        </>
                    )}
                </div>
                <div className="si-media-actions">
                    <button type="button" className="si-btn-small" onClick={() => pickMedia({ accept, selected: mediaId, onPick: onChange })}>{asset ? "Change" : "Choose"}</button>
                    {asset && <button type="button" className="si-btn-small is-quiet" onClick={() => onChange(null)}>Remove</button>}
                </div>
            </div>
            {hint && !error && <p className="si-hint">{hint}</p>}
            {error && <p className="si-error" role="alert"><Icon name="alert" size={13} /> {error}</p>}
        </div>
    );
}

function MediaPicker({ state, media, onClose, onUpload }) {
    const [query, setQuery] = useState("");
    const [type, setType] = useState(["image", "video", "document"].includes(state.accept) ? state.accept : "all");
    const fileRef = useRef(null);

    useEffect(() => {
        const onKey = (e) => e.key === "Escape" && onClose();
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [onClose]);

    const q = query.trim().toLowerCase();
    const list = media.filter((m) => (type === "all" || m.type === type) && (!q || m.name.toLowerCase().includes(q) || (m.alt || "").toLowerCase().includes(q)));

    return (
        <div className="si-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
            <div className="si-dialog si-picker" role="dialog" aria-modal="true" aria-labelledby="si-picker-title">
                <header className="si-dialog-head">
                    <div>
                        <h2 id="si-picker-title">Media Library</h2>
                        <p>Choose a file. Files are managed in the <a className="si-link" href={LIBRARY}>Media Library</a>.</p>
                    </div>
                    <button type="button" className="si-iconbtn" aria-label="Close" onClick={onClose}><Icon name="close" size={18} /></button>
                </header>

                <div className="si-picker-tools">
                    <label className="si-search">
                        <Icon name="search" size={16} />
                        <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by file name or alt text" aria-label="Search media" />
                    </label>
                    <select className="si-input si-select" value={type} onChange={(e) => setType(e.target.value)} aria-label="File type">
                        <option value="all">All files</option>
                        <option value="image">Images</option>
                        <option value="video">Video</option>
                        <option value="document">Documents</option>
                    </select>
                    <button type="button" className="si-btn-small" onClick={() => fileRef.current?.click()}><Icon name="upload" size={14} /> Upload</button>
                    <input ref={fileRef} type="file" hidden accept="image/*,video/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx" onChange={(e) => { const f = e.target.files?.[0]; if (f) onUpload(f); e.target.value = ""; }} />
                </div>

                <div className="si-media-grid">
                    {list.length === 0 && <p className="si-empty">No files match. Try another search or upload a new file.</p>}
                    {list.map((m) => (
                        <button key={m.id} type="button" className={`si-media-card ${state.selected === m.id ? "is-selected" : ""}`} onClick={() => { state.onPick(m.id); onClose(); }}>
                            <img src={thumbOf(m)} alt="" />
                            <span className="si-media-card-text">
                                <strong>{m.name}</strong>
                                <small>{MEDIA_WORD[m.type]} · {m.size}</small>
                            </span>
                            {state.selected === m.id && <span className="si-media-check"><Icon name="check" size={14} /></span>}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

/* ------------------------------ map, dialogs, preview, history ------------------------------ */

function MapFrame({ rec }) {
    if (isEmbed(rec.mapEmbedUrl)) {
        return <iframe className="si-map" title={`Map of ${rec.name || "the location"}`} src={rec.mapEmbedUrl} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />;
    }
    const ok = validCoords(rec.latitude, rec.longitude);
    return (
        <div className="si-map is-empty">
            <Icon name="pin" size={22} />
            {ok ? (
                <>
                    <strong>{Number(rec.latitude).toFixed(4)}, {Number(rec.longitude).toFixed(4)}</strong>
                    <a className="si-link" href={mapsLink(rec.latitude, rec.longitude)} target="_blank" rel="noreferrer">Open in Google Maps <Icon name="external" size={11} /></a>
                </>
            ) : (
                <strong>Enter the coordinates to see the pin</strong>
            )}
        </div>
    );
}

function ConfirmDialog({ dlg, onClose }) {
    useEffect(() => {
        const onKey = (e) => e.key === "Escape" && onClose();
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [onClose]);

    return (
        <div className="si-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
            <div className="si-dialog si-small" role="alertdialog" aria-modal="true" aria-labelledby="si-dlg-title">
                <span className="si-dialog-icon is-danger"><Icon name="trash" size={22} /></span>
                <h2 id="si-dlg-title">{dlg.title}</h2>
                <p>{dlg.text}</p>
                <div className="si-dialog-actions">
                    <button type="button" className="si-btn-outline" onClick={onClose} autoFocus>Keep it</button>
                    <button type="button" className="si-btn-danger" onClick={() => { onClose(); dlg.onConfirm(); }}><Icon name="trash" size={15} /> Move to Trash</button>
                </div>
            </div>
        </div>
    );
}

/* A simplified picture of the public page, built from the unsaved form */
function PreviewModal({ module, rec, onClose }) {
    const { media, rows } = useSi();
    const [device, setDevice] = useState("desktop");
    const { kind } = module;

    useEffect(() => {
        const onKey = (e) => e.key === "Escape" && onClose();
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [onClose]);

    const mediaOf = (id) => media.find((m) => m.id === id);
    const lines = (t) => (t || "").split("\n").filter(Boolean);
    const title = rec[TITLE[kind]] || "Untitled";
    const cover = kind === "facility" ? mediaOf(rec.coverId) : null;
    const loc = kind === "facility" ? rows("location").find((l) => l.id === rec.locationId) : null;
    const chart = kind === "zone" ? rows("document").find((d) => d.id === rec.chartDocumentId) : null;
    const file = kind === "document" ? mediaOf(rec.mediaId) : null;
    const tag = kind === "location" ? "Location and access" : kind === "facility" ? LABEL.facilityType[rec.facilityType] || "Facility" : kind === "zone" ? "Airspace" : kind === "weather" ? "Weather" : LABEL.docCategory[rec.docCategory] || "Download";

    return (
        <div className="si-overlay is-wide" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
            <div className="si-dialog si-preview" role="dialog" aria-modal="true" aria-labelledby="si-preview-title">
                <header className="si-dialog-head">
                    <div>
                        <h2 id="si-preview-title">Preview of the {module.noun}</h2>
                        <p>Built from what you see on screen, including unsaved changes. Layout is simplified.</p>
                    </div>
                    <div className="si-preview-tools">
                        <div className="si-seg" role="group" aria-label="Device">
                            <button type="button" className={device === "desktop" ? "is-on" : ""} onClick={() => setDevice("desktop")}>Desktop</button>
                            <button type="button" className={device === "mobile" ? "is-on" : ""} onClick={() => setDevice("mobile")}>Mobile</button>
                        </div>
                        <button type="button" className="si-iconbtn" aria-label="Close preview" onClick={onClose}><Icon name="close" size={18} /></button>
                    </div>
                </header>

                <div className={`si-pv-frame is-${device}`}>
                    <article className="si-pv">
                        {cover && <img className="si-pv-cover" src={thumbOf(cover)} alt={cover.alt || ""} />}
                        <div className="si-pv-body">
                            <p className="si-pv-tag">{tag}</p>
                            <h1>{title}</h1>

                            {kind === "location" && (
                                <>
                                    {lines(rec.address).map((l, i) => <p key={i} className="si-pv-lead">{l}</p>)}
                                    <MapFrame rec={rec} />
                                    {rec.accessNotes ? lines(rec.accessNotes).map((l, i) => <p key={i}>{l}</p>) : <p className="si-pv-none">No access notes yet.</p>}
                                </>
                            )}
                            {kind === "facility" && (
                                <>
                                    {loc && <p className="si-pv-meta">Located at {loc.name}</p>}
                                    {rec.description ? <p>{rec.description}</p> : <p className="si-pv-none">No description yet.</p>}
                                </>
                            )}
                            {kind === "zone" && (
                                <>
                                    {rec.description && <p className="si-pv-lead">{rec.description}</p>}
                                    <div className="si-pv-when"><strong>Operating hours</strong><span>{rec.operatingHours || "Not stated"}</span></div>
                                    <h3>Restrictions</h3>
                                    {rec.restrictions ? lines(rec.restrictions).map((l, i) => <p key={i}>{l}</p>) : <p className="si-pv-none">No restrictions listed.</p>}
                                    {chart && <span className="si-pv-btn">Download chart: {chart.title}</span>}
                                </>
                            )}
                            {kind === "weather" && (
                                <>
                                    <p className="si-pv-meta">{rec.sourceName}</p>
                                    {rec.summary && <p>{rec.summary}</p>}
                                    <span className="si-pv-btn">Open {hostOf(rec.url) || "link"}</span>
                                </>
                            )}
                            {kind === "document" && (
                                <>
                                    <p className="si-pv-meta">{rec.versionLabel || "No version"} · {file ? `${file.name} (${file.size})` : "No file chosen"}</p>
                                    <p className={rec.isPublic ? "" : "si-pv-none"}>{rec.isPublic ? "Visible on the public Downloads page." : "Hidden. Visitors cannot see this document."}</p>
                                    <span className="si-pv-btn">Download</span>
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
        <section className="si-card">
            <header className="si-card-head">
                <div>
                    <span className="si-card-no">History</span>
                    <h2>Who changed this record</h2>
                    <p>Every add, update and delete is recorded. Entries cannot be edited.</p>
                </div>
            </header>
            {entries.length === 0 ? (
                <p className="si-empty si-empty-pad">No history yet. It starts when you save.</p>
            ) : (
                <ul className="si-history">
                    {entries.map((h) => {
                        const isOpen = open === h.id;
                        return (
                            <li key={h.id}>
                                <button type="button" className="si-hist-row" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : h.id)} disabled={!h.changes?.length}>
                                    <span className="si-avatar">{initialsOf(h.user)}</span>
                                    <span className="si-hist-text">
                                        <strong>{h.user}</strong>
                                        <small>{ACTION_LABEL[h.action] || h.action} <b>{h.label}</b></small>
                                    </span>
                                    <span className={`si-pill is-${ACTION_PILL[h.action] || "info"}`}>{ACTION_LABEL[h.action] || h.action}</span>
                                    <span className="si-hist-time" title={formatDate(h.at)}>{timeAgo(h.at)}</span>
                                </button>
                                {isOpen && h.changes?.length > 0 && (
                                    <div className="si-diff">
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
   LIST SCREEN
==================================================================== */

/* how one record looks in a list */
function infoOf(kind, r, { media, rows }) {
    if (kind === "location") return { sub: (r.address || "").replace(/\n/g, ", "), meta: validCoords(r.latitude, r.longitude) ? `${Number(r.latitude).toFixed(4)}, ${Number(r.longitude).toFixed(4)}` : "No coordinates", thumb: null };
    if (kind === "facility") return { sub: [LABEL.facilityType[r.facilityType], rows("location").find((l) => l.id === r.locationId)?.name].filter(Boolean).join(" · "), meta: `Edited ${timeAgo(r.updatedAt)}`, thumb: media.find((m) => m.id === r.coverId) };
    if (kind === "zone") return { sub: r.operatingHours || "No operating hours", meta: rows("document").find((d) => d.id === r.chartDocumentId)?.title || "No chart attached", thumb: null };
    if (kind === "weather") return { sub: r.sourceName, meta: hostOf(r.url), thumb: null };
    const file = media.find((m) => m.id === r.mediaId);
    return { sub: [LABEL.docCategory[r.docCategory], r.versionLabel].filter(Boolean).join(" · "), meta: file ? `${file.name} · ${file.size}` : "No file", thumb: file };
}

function RowBody({ module, r, onEdit }) {
    const ctx = useSi();
    const { kind } = module;
    const { askDelete, remove, preview, setVisibility, rows } = ctx;
    const info = infoOf(kind, r, ctx);
    const name = r[TITLE[kind]] || "Untitled";

    return (
        <div className="si-rowbody">
            <span className="si-thumb">{info.thumb ? <img src={thumbOf(info.thumb)} alt="" /> : <Icon name={KIND_ICON[kind]} size={20} />}</span>
            <div className="si-cell si-cell-title">
                <button type="button" className="si-title-btn" onClick={() => onEdit(r)}>{name}</button>
                <small>{info.sub}</small>
            </div>
            <div className="si-cell si-cell-meta"><small>{info.meta}</small></div>
            {kind === "document" && (
                <div className="si-cell si-cell-status">
                    <span className={`si-pill is-${r.isPublic ? "ok" : "off"}`}>{r.isPublic ? "Public" : "Hidden"}</span>
                    <Toggle checked={r.isPublic} label={`Show ${name} on the public Downloads page`} onChange={(v) => setVisibility(r, v)} />
                </div>
            )}
            <div className="si-row-tools">
                <button type="button" className="si-iconbtn" aria-label={`Edit ${name}`} title="Edit" onClick={() => onEdit(r)}><Icon name="edit" size={15} /></button>
                <button type="button" className="si-iconbtn" aria-label={`Preview ${name}`} title="Preview" onClick={() => preview(module, r)}><Icon name="eye" size={15} /></button>
                {!module.ordered && (
                    <button type="button" className="si-iconbtn is-danger" aria-label={`Delete ${name}`} title="Delete (moves to Trash)" onClick={() => askDelete({ what: name, extra: usageText(kind, r, rows), onConfirm: () => remove(kind, r) })}><Icon name="trash" size={15} /></button>
                )}
            </div>
        </div>
    );
}

function ListView({ module, onNew, onEdit }) {
    const { rows, reorder, remove } = useSi();
    const { kind } = module;
    const [query, setQuery] = useState("");
    const [filter, setFilter] = useState("all");
    const [visibility, setVisibilityFilter] = useState("all");

    const all = rows(kind);
    const filterKey = kind === "facility" ? "facilityType" : kind === "document" ? "docCategory" : null;
    const filterOptions = kind === "facility" ? FACILITY_TYPES : kind === "document" ? DOC_CATEGORIES : [];
    const q = query.trim().toLowerCase();

    const shown = all
        .filter((r) => !filterKey || filter === "all" || r[filterKey] === filter)
        .filter((r) => kind !== "document" || visibility === "all" || (visibility === "public") === r.isPublic)
        .filter((r) => !q || (r[TITLE[kind]] || "").toLowerCase().includes(q));
    const filtered = Boolean(q) || filter !== "all" || visibility !== "all";
    const clear = () => { setQuery(""); setFilter("all"); setVisibilityFilter("all"); };

    return (
        <section className="si-card">
            <header className="si-card-head">
                <div>
                    <span className="si-card-no">{all.length} {all.length === 1 ? module.noun : `${module.noun}s`}</span>
                    <h2>{module.label}</h2>
                    <p>{module.hint}.</p>
                </div>
                <button type="button" className="si-btn-dark" onClick={onNew}><Icon name="plus" size={16} /> {module.add}</button>
            </header>

            {filterKey && (
                <div className="si-filters" role="group" aria-label="Filter by type">
                    <button type="button" className={`si-chip ${filter === "all" ? "is-on" : ""}`} onClick={() => setFilter("all")}>All <b>{all.length}</b></button>
                    {filterOptions.map(([v, l]) => {
                        const n = all.filter((r) => r[filterKey] === v).length;
                        return n || filter === v ? <button key={v} type="button" className={`si-chip ${filter === v ? "is-on" : ""}`} onClick={() => setFilter(v)}>{l} <b>{n}</b></button> : null;
                    })}
                </div>
            )}

            <div className="si-toolbar">
                <label className="si-search">
                    <Icon name="search" size={16} />
                    <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={`Search ${module.noun}s`} aria-label={`Search ${module.noun}s`} />
                </label>
                {kind === "document" && (
                    <select className="si-input si-select" value={visibility} onChange={(e) => setVisibilityFilter(e.target.value)} aria-label="Visibility">
                        <option value="all">Public and hidden</option>
                        <option value="public">Public only</option>
                        <option value="hidden">Hidden only</option>
                    </select>
                )}
            </div>
            {module.ordered && filtered && <p className="si-hint si-hint-pad">Reordering is off while a search or filter is active.</p>}

            {module.ordered ? (
                <div className="si-block">
                    <Orderable
                        items={shown}
                        disabled={filtered}
                        nameOf={(r) => r[TITLE[kind]]}
                        onMove={(from, to) => reorder(moveIn(all.map((r) => r.id), from, to))}
                        onRemove={(i) => remove(kind, shown[i])}
                        empty={filtered ? "Nothing matches." : `No ${module.noun}s yet. ${module.add} to get started.`}
                    >
                        {(r) => <RowBody module={module} r={r} onEdit={onEdit} />}
                    </Orderable>
                </div>
            ) : shown.length === 0 ? (
                <div className="si-empty si-empty-pad">
                    {filtered ? (
                        <>No {module.noun}s match. <button type="button" className="si-linkbtn" onClick={clear}>Clear filters</button></>
                    ) : (
                        <>No {module.noun}s yet. <button type="button" className="si-linkbtn" onClick={onNew}>{module.add}</button></>
                    )}
                </div>
            ) : (
                <ul className="si-rows">
                    {shown.map((r) => <li key={r.id} className="si-row"><RowBody module={module} r={r} onEdit={onEdit} /></li>)}
                </ul>
            )}
        </section>
    );
}

/* ====================================================================
   EDITOR SCREEN
==================================================================== */

function FieldFor({ fd, form, set, errors }) {
    const { rows } = useSi();
    const error = errors[fd.key];
    const value = form[fd.key];

    if (fd.type === "media") return <MediaField label={fd.label} accept={fd.accept} mediaId={value} error={error} hint={fd.hint} onChange={(id) => set({ [fd.key]: id })} />;
    if (fd.type === "toggle") {
        return (
            <label className="si-visible">
                <span>{fd.label}</span>
                <Toggle checked={Boolean(value)} label={fd.label} onChange={(v) => set({ [fd.key]: v })} />
            </label>
        );
    }
    if (fd.type === "select") {
        const options = fd.options === "locations" ? [["", "Not linked to a location"], ...rows("location").map((l) => [l.id, l.name])]
            : fd.options === "charts" ? [["", "No chart"], ...rows("document").filter((d) => d.docCategory === "chart").map((d) => [d.id, d.title])]
                : fd.options;
        return <SelectField label={fd.label} hint={fd.hint} value={value} error={error} options={options} onChange={(v) => set({ [fd.key]: fd.numeric ? (v ? Number(v) : null) : v })} />;
    }
    return <Field label={fd.label} hint={fd.hint} value={value} error={error} max={fd.max} rows={fd.type === "textarea" ? fd.rows : undefined} type={fd.type === "number" ? "number" : "text"} placeholder={fd.placeholder} onChange={(v) => set({ [fd.key]: v })} />;
}

function SidePanel({ module, form }) {
    const { media } = useSi();
    const { kind } = module;
    const file = kind === "document" ? media.find((m) => m.id === form.mediaId) : null;

    return (
        <aside className="si-side">
            {kind === "location" && (
                <section className="si-card si-side-card">
                    <BlockHead title="Map preview" />
                    <MapFrame rec={form} />
                </section>
            )}
            <section className="si-card si-side-card">
                <BlockHead title="Details" aside={kind === "document" ? <span className={`si-pill is-${form.isPublic ? "ok" : "off"}`}>{form.isPublic ? "Public" : "Hidden"}</span> : null} />
                <p className="si-hint">{kind === "document" ? (form.isPublic ? "Visitors can download this document now." : "Hidden from visitors until you switch it on.") : "Changes go live on the public site as soon as you save."}</p>
                <dl className="si-facts">
                    {kind === "document" && <div><dt>Published</dt><dd>{form.publishedAt ? formatDate(form.publishedAt) : "Not yet"}</dd></div>}
                    {file && <div><dt>File</dt><dd>{file.name} ({file.size})</dd></div>}
                    {kind === "weather" && form.url && /^https?:\/\//i.test(form.url) && <div><dt>Link</dt><dd><a className="si-link" href={form.url} target="_blank" rel="noreferrer">{hostOf(form.url)} <Icon name="external" size={11} /></a></dd></div>}
                    <div><dt>Last edited</dt><dd>{form.updatedAt ? `${formatDate(form.updatedAt)} by ${form.updatedBy}` : "Never"}</dd></div>
                </dl>
            </section>
        </aside>
    );
}

function Editor({ module, initial, onClose }) {
    const { kind } = module;
    const ctx = useSi();
    const { history, commit, remove, askDelete, notify, preview, rows } = ctx;

    const [saved, setSaved] = useState(() => clone(initial));
    const [form, setForm] = useState(() => clone(initial));
    const [tab, setTab] = useState("content");
    const [submitted, setSubmitted] = useState(false);
    const [menu, setMenu] = useState(false);
    const busyRef = useRef(false);
    const menuRef = useRef(null);

    const dirty = useMemo(() => !sameJson(form, saved), [form, saved]);
    const allErrors = useMemo(() => validate(kind, form), [kind, form]);
    const errors = submitted ? allErrors : {};
    const errorCount = Object.keys(allErrors).length;
    const isNew = !form.id;
    const entries = history.filter((h) => h.key === `${kind}:${form.id}`);
    const name = form[TITLE[kind]];

    const set = (patch) => setForm((f) => ({ ...f, ...patch }));

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

    const save = () => {
        if (!dirty && !isNew) return;
        if (errorCount) {
            setSubmitted(true);
            notify("error", `Fix ${errorCount} field${errorCount === 1 ? "" : "s"} before saving.`);
            setTimeout(() => document.querySelector(".si-field.has-error")?.scrollIntoView({ behavior: "smooth", block: "center" }), 80);
            return;
        }
        busyRef.current = true;
        commit(kind, form, (rec) => {
            busyRef.current = false;
            setSubmitted(false);
            notify("ok", "Saved. Visitors now see these changes.");
            if (ctx.live) { onClose(); return; }
            setSaved(clone(rec));
            setForm(clone(rec));
        }, () => { busyRef.current = false; });
    };

    /* Ctrl / Cmd + S saves */
    useEffect(() => {
        const onKey = (e) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") { e.preventDefault(); save(); } };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    });

    return (
        <div className="si-edit">
            <div className="si-heading">
                <div>
                    <button type="button" className="si-back" onClick={goBack}><Icon name="back" size={16} /> All {module.label.toLowerCase()}</button>
                    <h1>{isNew ? module.add : name || "Untitled"}</h1>
                    <div className="si-status">
                        {dirty && <span className="si-pill is-warn">Unsaved changes</span>}
                        {form.updatedAt && <small>Last edited {timeAgo(form.updatedAt)} by {form.updatedBy}</small>}
                    </div>
                </div>

                <div className="si-actions">
                    <button type="button" className="si-btn-outline" onClick={() => preview(module, form)}><Icon name="eye" size={16} /> Preview</button>
                    <button type="button" className="si-btn-dark" onClick={save} disabled={!dirty && !isNew}><span className="si-btn-icon"><Icon name="save" size={16} /></span> Save</button>
                    <div className="si-more" ref={menuRef}>
                        <button type="button" className="si-iconbtn is-round" aria-label="More options" aria-haspopup="menu" aria-expanded={menu} onClick={() => setMenu((v) => !v)}><Icon name="more" size={18} /></button>
                        {menu && (
                            <div className="si-menu" role="menu">
                                <button type="button" role="menuitem" disabled={isNew} onClick={() => { setMenu(false); askDelete({ what: name || `this ${module.noun}`, extra: usageText(kind, form, rows), onConfirm: () => { remove(kind, form); onClose(); } }); }}><Icon name="trash" size={16} /> Delete</button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="si-tabs" role="tablist" aria-label="Record">
                {[["content", "Content"], ["history", "History"]].map(([k, l]) => (
                    <button key={k} type="button" role="tab" aria-selected={tab === k} className={tab === k ? "is-active" : ""} onClick={() => setTab(k)}>
                        {l}
                        {k === "content" && submitted && errorCount > 0 && <span className="si-badge-error">{errorCount}</span>}
                        {k === "history" && <span className="si-badge">{entries.length}</span>}
                    </button>
                ))}
            </div>

            {tab === "content" ? (
                <div className="si-layout">
                    <section className="si-card">
                        <header className="si-card-head">
                            <div>
                                <span className="si-card-no">{isNew ? "New" : "Editing"} {module.noun}</span>
                                <h2>{module.label}</h2>
                                <p>Changes go live when you save.</p>
                            </div>
                        </header>
                        {SCHEMA[kind].map((blk) => (
                            <div className="si-block" key={blk.title}>
                                <BlockHead title={blk.title} text={blk.text} />
                                <div className="si-fields">
                                    {blk.fields.map((fd) => (
                                        <div key={fd.key} className={fd.half ? "" : "is-full"}>
                                            <FieldFor fd={fd} form={form} set={set} errors={errors} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </section>
                    <SidePanel module={module} form={form} />
                </div>
            ) : (
                <HistoryPanel entries={entries} />
            )}

            {dirty && (
                <div className="si-savebar" role="region" aria-label="Unsaved changes">
                    <span className="si-savebar-text"><i /> Unsaved changes</span>
                    <div>
                        <button type="button" className="si-btn-ghost" onClick={() => { setForm(clone(saved)); setSubmitted(false); notify("info", "Changes discarded."); }}>Discard</button>
                        <button type="button" className="si-btn-yellow" onClick={save}>Save</button>
                    </div>
                </div>
            )}
        </div>
    );
}

/* ====================================================================
   PAGE
==================================================================== */

export default function AdminPSBSiteInformation() {
    const { props, url } = usePage();
    const live = Boolean(props.siteInfo?.locations);

    const seed = useRef(live ? props.siteInfo : sample).current;
    const [local, setLocal] = useState(() => ({ locations: clone(seed.locations), facilities: clone(seed.facilities), zones: clone(seed.zones), weatherLinks: clone(seed.weatherLinks), documents: clone(seed.documents), history: clone(seed.history || []) }));
    const [mediaList, setMediaList] = useState(seed.media);

    const src = live ? props.siteInfo : local;
    const media = live ? props.siteInfo.media : mediaList;
    const history = src.history || [];
    const rows = (kind) => src[KEY[kind]] || [];

    const [active, setActive] = useState(() => {
        const wanted = props.section || MODULES.find((m) => (url || "").includes(`/site-information/${m.route}`))?.route;
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

    const addHistory = (l, kind, rec, action, changes) => [{ id: Date.now() + Math.random(), key: `${kind}:${rec.id}`, user: "You", action, label: rec[TITLE[kind]], at: new Date().toISOString(), changes }, ...l.history];

    /* create or update. Changes are live as soon as they are saved */
    const commit = (kind, rec, done, fail) => {
        if (live) {
            const opts = { preserveScroll: true, onSuccess: () => done(rec), onError: () => { fail?.(); notify("error", "The server rejected some values. Check the highlighted fields."); } };
            if (rec.id) router.put(`${API[kind]}/${rec.id}`, { record: rec }, opts);
            else router.post(API[kind], { record: rec }, opts);
            return;
        }
        setTimeout(() => {
            const now = new Date().toISOString();
            const key = KEY[kind];
            const prev = local[key].find((r) => r.id === rec.id);
            const next = { ...rec, id: rec.id || Date.now(), updatedAt: now, updatedBy: "You" };
            if (kind === "document" && next.isPublic && !next.publishedAt) next.publishedAt = now;
            setLocal((l) => ({
                ...l,
                [key]: prev ? l[key].map((r) => (r.id === next.id ? next : r)) : [...l[key], next],
                history: addHistory(l, kind, next, prev ? "UPDATE" : "CREATE", diffOf(kind, prev, next)),
            }));
            done(next);
        }, 300);
    };

    const remove = (kind, rec) => {
        if (live) {
            router.delete(`${API[kind]}/${rec.id}`, { preserveScroll: true, onSuccess: () => notify("ok", `“${rec[TITLE[kind]]}” moved to Trash.`), onError: () => notify("error", "Something went wrong. Nothing was deleted.") });
            return;
        }
        const key = KEY[kind];
        setLocal((l) => ({
            ...l,
            [key]: l[key].filter((r) => r.id !== rec.id),
            facilities: kind === "location" ? l.facilities.map((f) => (f.locationId === rec.id ? { ...f, locationId: null } : f)) : l.facilities,
            zones: kind === "document" ? l.zones.map((z) => (z.chartDocumentId === rec.id ? { ...z, chartDocumentId: null } : z)) : l.zones,
            history: addHistory(l, kind, rec, "DELETE", [{ field: "Moved to Trash", from: rec[TITLE[kind]], to: "(deleted)" }]),
        }));
        notify("ok", `“${rec[TITLE[kind]]}” moved to Trash. Only the Super Admin can restore it.`);
    };

    const setVisibility = (rec, isPublic) => {
        if (live) { router.post(`${API.document}/${rec.id}/visibility`, { isPublic }, { preserveScroll: true, onSuccess: () => notify("ok", isPublic ? "Now public." : "Now hidden.") }); return; }
        const now = new Date().toISOString();
        setLocal((l) => ({
            ...l,
            documents: l.documents.map((d) => (d.id === rec.id ? { ...d, isPublic, publishedAt: isPublic && !d.publishedAt ? now : d.publishedAt, updatedAt: now, updatedBy: "You" } : d)),
            history: addHistory(l, "document", rec, isPublic ? "PUBLISH" : "UNPUBLISH", [{ field: "Show on the public Downloads page", from: short(rec.isPublic), to: short(isPublic) }]),
        }));
        notify("ok", isPublic ? "Now public. Visitors can download it." : "Now hidden from visitors.");
    };

    const reorder = (ids) => {
        if (live) { router.put(`${API.facility}/reorder`, { ids }, { preserveScroll: true }); return; }
        setLocal((l) => ({ ...l, facilities: ids.map((id) => l.facilities.find((f) => f.id === id)) }));
        notify("ok", "Facility order saved.");
    };

    const uploadMedia = (file) => {
        const type = file.type.startsWith("video") ? "video" : file.type.startsWith("image") ? "image" : "document";
        const size = file.size >= 1048576 ? `${(file.size / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(file.size / 1024))} KB`;
        const item = { id: Date.now(), name: file.name, type, alt: "", size, url: type === "image" ? URL.createObjectURL(file) : null };
        if (live) router.post(API.upload, { file }, { forceFormData: true, preserveScroll: true, onSuccess: () => notify("ok", `${file.name} uploaded.`), onError: () => notify("error", "The file could not be uploaded.") });
        else { setMediaList((m) => [item, ...m]); notify("ok", `${file.name} added (sample data, not stored).`); }
    };

    const askDelete = (info) => setDlg({ title: `Delete “${info.what}”?`, text: `It moves to Content Trash, where only the Super Admin can restore or purge it. It disappears from the public site straight away.${info.extra || ""}`, onConfirm: info.onConfirm });

    const ctx = {
        live, media, history, rows, notify, commit, remove, reorder, setVisibility, askDelete,
        pickMedia: (opts) => setPicker(opts),
        preview: (m, rec) => setPreviewing({ module: m, rec }),
    };

    return (
        <Ctx.Provider value={ctx}>
            <div className="psb-site">
                {editing ? (
                    <Editor key={editing.id ?? "new"} module={module} initial={editing} onClose={() => setEditing(null)} />
                ) : (
                    <>
                        <div className="si-heading">
                            <div>
                                <h1>Site Information</h1>
                                <p>Create, update and remove the location, facilities, airspace details, weather links and downloads shown on the Perlis Airspace Sandbox website.</p>
                            </div>
                        </div>

                        {!live && (
                            <p className="si-note"><Icon name="alert" size={16} /><span>Sample data. Every control works, but nothing is stored until your controller sends the <b>siteInfo</b> prop.</span></p>
                        )}

                        <div className="si-tabs" role="tablist" aria-label="Site Information modules">
                            {MODULES.map((m, i) => (
                                <button key={m.key} type="button" role="tab" aria-selected={active === i} className={active === i ? "is-active" : ""} onClick={() => setActive(i)}>
                                    {m.label}
                                    <span className="si-badge">{rows(m.kind).length}</span>
                                </button>
                            ))}
                        </div>

                        <ListView key={module.key} module={module} onNew={() => setEditing(blankFor(module.kind))} onEdit={(r) => setEditing(clone(r))} />
                    </>
                )}

                {dlg && <ConfirmDialog dlg={dlg} onClose={() => setDlg(null)} />}
                {picker && <MediaPicker state={picker} media={media} onClose={() => setPicker(null)} onUpload={uploadMedia} />}
                {previewing && <PreviewModal module={previewing.module} rec={previewing.rec} onClose={() => setPreviewing(null)} />}

                {toast && (
                    <div className={`si-toast is-${toast.tone}`} role="status">
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
   AdminPSBSiteInformation.layout = (page) => <NavigationBar>{page}</NavigationBar>;      */

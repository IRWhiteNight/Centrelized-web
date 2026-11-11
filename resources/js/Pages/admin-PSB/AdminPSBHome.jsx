import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { router, usePage } from "@inertiajs/react";
import "../../../css/admin-PSB-css/admin-opportunities.css"; // shared theme (po-* classes)
import "../../../css/admin-PSB-css/admin-home.css"; // Home-only extras

/* ====================================================================
   PSB ADMIN → HOME PAGE EDITOR            /admin/psb/home/*

   Same look, layout and live preview as the Opportunities editor.

   Site map (PSB workspace → "Home Page"), one editor for all six modules:
     1  Main banner and slogan                 → page_sections (banner)
     2  What is the sandbox? / Why it matters  → page_sections (text, list, cards)
     3  Who should participate?                → page_sections (list)
     4  Featured programmes (pin / order)      → featured_items + psb_programmes
     5  Latest news and upcoming events (pin)  → featured_items + posts + events
     6  Partners preview and CTA buttons       → partners (is_featured) + page_sections (cta)

   LIVE PREVIEW: the panel on the right has two views
     • Draft preview  - the public page built from what is on screen (unsaved edits too)
     • Live site      - the real public Home page (/) in a frame; reloads after publishing

   SAMPLE DATA: the page works today (changes stay on screen only). Return an Inertia prop
   named `home` and it switches to LIVE mode:

   Inertia::render('admin/AdminPSBHome', [
       'section' => 'banner',     // optional: banner | introduction | participants |
                                  //   featured-programmes | news-events | partners-cta
       'home' => [
           'content' => [...],    // same shape as `sampleContent` below
           'meta'    => [...],    // status, publishedAt, scheduledAt, hasUnpublishedChanges, updatedBy, updatedAt
           'catalog' => ['programmes' => [], 'news' => [], 'events' => [], 'partners' => [], 'media' => []],
           'history' => [...],    // audit_logs rows
           'liveUrl' => '/',      // optional, public Home page address (previewUrl also accepted)
       ],
   ]);

   Map all six sidebar routes (/admin/psb/home/banner, /introduction, /participants,
   /featured-programmes, /news-events, /partners-cta) to this same component.
   LIVE mode requests are listed in ENDPOINTS. The controller must write audit_logs.
==================================================================== */

const BASE = "/admin/psb"; // keep in sync with psbRoutes.js
const ENDPOINTS = {
    save: `${BASE}/home`, // PUT   { content }                   save as draft
    publish: `${BASE}/home/publish`, // POST  { content }                   save + publish now
    schedule: `${BASE}/home/schedule`, // POST  { content, at }               save + publish later
    unpublish: `${BASE}/home/unpublish`, // POST
    upload: `${BASE}/media-library/upload`, // POST  multipart { file }
};
const DEFAULT_LIVE_URL = "/";
const MANAGE = {
    programmes: `${BASE}/opportunities/programmes`,
    news: `${BASE}/media-centre/news`,
    events: `${BASE}/media-centre/events`,
    partners: `${BASE}/about/partners`,
    media: `${BASE}/media-library`,
};

/* how many items the public Home page can show */
const LIMITS = { stats: 4, intro: 6, gaps: 5, market: 4, participants: 8, ways: 6, programmes: 4, news: 3, events: 3, partners: 12 };

const SECTIONS = [
    { key: "banner", route: "banner", label: "Main banner and slogan", hint: "First screen visitors see" },
    { key: "intro", route: "introduction", label: "What is the sandbox? / Why it matters", hint: "Definition, purpose and the case" },
    { key: "participants", route: "participants", label: "Who should participate?", hint: "Intended participants" },
    { key: "programmes", route: "featured-programmes", label: "Featured programmes", hint: "Pin and order" },
    { key: "newsEvents", route: "news-events", label: "Latest news and upcoming events", hint: "Pin items to the top" },
    { key: "partners", route: "partners-cta", label: "Partners preview and CTA buttons", hint: "Logos and the final call to action" },
];

const MIN = 60 * 1000;
const NOW = Date.now();
const minsAgo = (m) => new Date(NOW - m * MIN).toISOString();
let counter = 0;
const uid = () => `n${Date.now().toString(36)}${(counter += 1)}`;

/* ------------------------------ sample data ------------------------------ */

const sampleContent = {
    banner: {
        visible: true,
        slogan: "PERLIS AIRSPACE SANDBOX · Innovating today, connecting tomorrow.",
        headline: "Malaysia’s first real-world testing ground for *low-altitude airspace*",
        intro: "A national platform for testing, validation and future airspace innovation, where drones, air taxis and autonomous cargo move from prototype to proven operation.",
        primaryCta: { label: "Apply to Participate", url: "/apply-to-participate" },
        secondaryCta: { label: "Subscribe for updates", url: "#subscribe" },
        mediaId: 1,
        stats: [
            { id: "s1", value: "4", label: "Development phases, 2026 – 2030+" },
            { id: "s2", value: "2", label: "Flight corridors planned: Timah Tasoh Dam & Langkawi" },
            { id: "s3", value: "6", label: "National application areas, one shared airspace" },
        ],
    },
    intro: {
        visible: true,
        what: {
            title: "What is the *Sandbox?*",
            mediaId: 2,
            rows: [
                { id: "w1", label: "Definition", text: "A controlled testing environment where industry, researchers and government agencies can safely test and validate advanced aviation solutions (aircraft, operations and infrastructure) in coordination with the relevant authorities." },
                { id: "w2", label: "Purpose", text: "To accelerate Advanced Air Mobility through structured testing, regulatory validation, operational development and ecosystem collaboration, with safety, compliance and scalability built in." },
                { id: "w3", label: "Location", text: "Sungai Batu Pahat, Perlis, Malaysia: the first dedicated low-altitude airspace testing facility in the country, built around a functional mock-up aerodrome." },
            ],
        },
        why: {
            kicker: "Malaysia is ready, but not fully prepared.",
            title: "Low-altitude airspace is *the next infrastructure.*",
            mediaId: 3,
            gaps: [
                { id: "g1", title: "Limited real-world testing space", text: "Prototypes stay prototypes without real airspace." },
                { id: "g2", title: "No validation platform for industry", text: "BVLOS needs real data, not just simulation." },
                { id: "g3", title: "Regulators need operational evidence", text: "Policy depends on proven, measured operations." },
            ],
            market: [
                { id: "m1", value: "US$137B", label: "Global AAM market by 2035, growing at 24.6% a year" },
                { id: "m2", value: "RM70B", label: "Additional revenue the AAM industry could bring Malaysia over 20 years" },
                { id: "m3", value: "RM34B", label: "Projected contribution to Malaysia’s GDP over the same period" },
            ],
            source: "Source: MIGHT & FUTURISE, Advanced Air Mobility Industry Report (2025); global figure from Grand View Research as cited in the report.",
        },
    },
    participants: {
        visible: true,
        title: "Who should *participate?*",
        intro: "Anyone with a technology, operation or idea that needs real airspace to prove itself.",
        mediaId: 4,
        items: [
            { id: "p1", title: "Aircraft & drone manufacturers", text: "Prove aircraft in real, controlled airspace." },
            { id: "p2", title: "Technology & system providers", text: "Validate payloads, communications, detect-and-avoid and UTM." },
            { id: "p3", title: "Operators & service providers", text: "Rehearse real missions before wider deployment." },
            { id: "p4", title: "Universities & research institutions", text: "Run experiments backed by real operational data." },
            { id: "p5", title: "Government agencies", text: "Test real use cases and generate evidence for policy." },
            { id: "p6", title: "Investors & strategic partners", text: "Co-develop infrastructure and commercial pilots across the 2026 – 2030+ roadmap." },
        ],
        ways: [
            { id: "y1", label: "Government-led trials" },
            { id: "y2", label: "Industry testing & demonstrations" },
            { id: "y3", label: "Research & innovation" },
        ],
    },
    programmes: {
        visible: true,
        title: "Featured testing *programmes.*",
        ctaLabel: "Apply to Participate",
        ctaUrl: "/apply-to-participate",
        mode: "pinned", // pinned | latest
        pinned: [1, 2, 3, 4],
    },
    newsEvents: {
        visible: true,
        title: "News & *project progress.*",
        eventsTitle: "Upcoming *events.*",
        newsMode: "pinned", // pinned | latest
        pinnedNews: [11, 12],
        eventsMode: "latest",
        pinnedEvents: [],
    },
    partners: {
        visible: true,
        title: "A national *ecosystem.*",
        intro: "Government, regulators, research bodies and industry, working from application to execution.",
        featured: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        applyCta: { title: "Ready to *fly with us?*", label: "Apply to Participate", url: "/apply-to-participate" },
        subscribe: {
            title: "Subscribe for updates",
            text: "Sandbox milestones, programmes and Advanced Air Mobility news, in your inbox.",
            placeholder: "Email address",
            buttonLabel: "Subscribe",
            successMessage: "Thank you, you are subscribed.",
        },
    },
    seo: {
        title: "Perlis Airspace Sandbox | Low-altitude airspace testing",
        description: "A controlled, regulator-ready environment in Perlis for testing drones, air taxis and autonomous cargo.",
        mediaId: 2,
    },
};

const sampleCatalog = {
    programmes: [
        { id: 1, title: "Open Call: BVLOS Corridor Trials", area: "Cargo Logistics", status: "open", note: "Closes 15 Dec 2026" },
        { id: 2, title: "First Responder Drone Exercise", area: "First Responder Operations", status: "open", note: "Closes 30 Nov 2026" },
        { id: 3, title: "eVTOL Vertiport Demonstration", area: "Advanced Air Mobility", status: "upcoming", note: "Opens 10 Jan 2027" },
        { id: 4, title: "UTM Integration Trial", area: "Technology & Integration", status: "upcoming", note: "Opens 1 Feb 2027" },
        { id: 5, title: "Medical Cargo Pilot", area: "Cargo Logistics", status: "draft", note: "Not published" },
        { id: 6, title: "Agriculture Monitoring Trial", area: "Technology & Integration", status: "closed", note: "Closed 30 Sep 2026" },
    ],
    news: [
        { id: 11, title: "Phase 1 site preparation begins at Sungai Batu Pahat", status: "published", note: "28 Oct 2026" },
        { id: 12, title: "Sandbox briefing held with regulators and agencies", status: "published", note: "21 Oct 2026" },
        { id: 13, title: "Flight corridor to Timah Tasoh Dam proposed", status: "published", note: "9 Oct 2026" },
        { id: 14, title: "Partner agreement signing (draft)", status: "draft", note: "Not published" },
        { id: 15, title: "Vertiport design update", status: "scheduled", note: "Scheduled 5 Nov 2026" },
    ],
    events: [
        { id: 21, title: "Sandbox Open Day", status: "published", note: "20 Nov 2026 · Sungai Batu Pahat" },
        { id: 22, title: "BVLOS Operators Briefing", status: "published", note: "4 Dec 2026 · Online" },
        { id: 23, title: "Drone Demonstration Week", status: "published", note: "12 Jan 2027 · Perlis" },
        { id: 24, title: "Partners Roundtable", status: "draft", note: "Not published" },
    ],
    partners: [
        { id: 1, title: "UniMAP", type: "university" },
        { id: 2, title: "CAAM", type: "agency" },
        { id: 3, title: "MCMC", type: "agency" },
        { id: 4, title: "MIGHT", type: "agency" },
        { id: 5, title: "FUTURISE", type: "agency" },
        { id: 6, title: "MRANTI", type: "agency" },
        { id: 7, title: "NAICO", type: "agency" },
        { id: 8, title: "Vertiport Malaysia", type: "industry" },
        { id: 9, title: "Araken", type: "industry" },
        { id: 10, title: "EHANG", type: "international" },
        { id: 11, title: "TCAB", type: "industry" },
        { id: 12, title: "MHS Aviation", type: "industry" },
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
};

const sampleMeta = {
    status: "published", // draft | published | scheduled
    publishedAt: minsAgo(60 * 26),
    scheduledAt: null,
    hasUnpublishedChanges: false,
    updatedBy: "Aiman Hakim",
    updatedAt: minsAgo(60 * 26),
};

const sampleHistory = [
    { id: 6, user: "Aiman Hakim", action: "PUBLISH", label: "Home Page", at: minsAgo(60 * 26), changes: [{ field: "Banner headline", from: "Malaysia is ready to lead", to: "Malaysia’s first real-world testing ground for low-altitude airspace" }] },
    { id: 5, user: "Aiman Hakim", action: "UPDATE", label: "Featured programmes", at: minsAgo(60 * 27), changes: [{ field: "Pinned programmes", from: "3 pinned", to: "4 pinned" }] },
    { id: 4, user: "Farid Rahman", action: "UPDATE", label: "Who should participate?", at: minsAgo(60 * 50), changes: [{ field: "Participant: Investors & strategic partners", from: "(new)", to: "Co-develop infrastructure and commercial pilots across the 2026 – 2030+ roadmap." }] },
    { id: 3, user: "Farid Rahman", action: "DELETE", label: "Participant: Media partners", at: minsAgo(60 * 52), changes: [{ field: "Moved to Trash", from: "Media partners", to: "(deleted)" }] },
    { id: 2, user: "Aiman Hakim", action: "UPDATE", label: "Partners preview", at: minsAgo(60 * 80), changes: [{ field: "Featured partners", from: "8 featured", to: "10 featured" }] },
    { id: 1, user: "Super Administrator", action: "CREATE", label: "Home Page", at: minsAgo(60 * 24 * 9), changes: [] },
];

/* ------------------------------ helpers ------------------------------ */

const clone = (v) => JSON.parse(JSON.stringify(v));
const isLink = (v) => /^(https?:\/\/|\/|#|mailto:)/i.test((v || "").trim());
const sameJson = (a, b) => JSON.stringify(a) === JSON.stringify(b);

function formatDate(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    return `${d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}, ${d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`;
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

const initialsOf = (name) => (name || "?").split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase();

/* "Low-altitude *airspace*" → highlighted words */
const Hl = ({ text = "" }) => text.split("*").map((x, i) => (i % 2 ? <em key={i}>{x}</em> : x));

/* drawn thumbnail for a media asset (real files would use their own URL) */
function thumbOf(item) {
    if (item?.url) return item.url;
    const label = (item?.name || "media").replace(/[<>&"]/g, "");
    const video = item?.type === "video";
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0b1a28"/><stop offset="1" stop-color="#1d4160"/></linearGradient></defs><rect width="320" height="200" fill="url(#g)"/><path d="M-10 170L120 110 330 70V110L130 150 -10 200Z" fill="#facc15" fill-opacity=".9"/>${video ? '<circle cx="160" cy="84" r="26" fill="#fff" fill-opacity=".92"/><path d="M152 70v28l24-14z" fill="#0b1a28"/>' : '<circle cx="160" cy="84" r="9" fill="#fff"/><path d="M130 54l60 60M190 54l-60 60" stroke="#fff" stroke-width="4" stroke-linecap="round"/>'}<text x="14" y="186" fill="#fff" font-family="Arial,sans-serif" font-size="13" font-weight="700">${label}</text></svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/* every rule the public Home page needs. Returns { "section.path": "message" } */
function validate(f) {
    const e = {};
    const need = (key, value, label, max) => {
        const v = (value ?? "").toString().trim();
        if (!v) e[key] = `Enter ${label}.`;
        else if (max && v.length > max) e[key] = `Use ${max} characters or fewer.`;
    };
    const link = (key, value, label) => {
        if (!(value || "").trim()) e[key] = `Enter ${label}.`;
        else if (!isLink(value)) e[key] = "Use a full address (https://...) or a path starting with /";
    };
    const maxLen = (key, value, max) => { if ((value || "").length > max) e[key] = `Use ${max} characters or fewer.`; };

    const b = f.banner;
    need("banner.slogan", b.slogan, "a slogan", 120);
    need("banner.headline", b.headline, "a headline", 120);
    maxLen("banner.intro", b.intro, 280);
    need("banner.primaryCta.label", b.primaryCta.label, "button text", 30);
    link("banner.primaryCta.url", b.primaryCta.url, "a button link");
    need("banner.secondaryCta.label", b.secondaryCta.label, "button text", 30);
    link("banner.secondaryCta.url", b.secondaryCta.url, "a button link");
    if (!b.stats.length) e["banner.stats"] = "Add at least one key figure.";
    b.stats.forEach((s) => { need(`banner.stats.${s.id}.value`, s.value, "a figure", 10); need(`banner.stats.${s.id}.label`, s.label, "a description", 80); });

    const i = f.intro;
    need("intro.what.title", i.what.title, "a heading", 80);
    if (!i.what.rows.length) e["intro.what.rows"] = "Add at least one row (for example Definition).";
    i.what.rows.forEach((r) => { need(`intro.what.rows.${r.id}.label`, r.label, "a label", 40); need(`intro.what.rows.${r.id}.text`, r.text, "the text", 400); });
    need("intro.why.title", i.why.title, "a heading", 100);
    maxLen("intro.why.kicker", i.why.kicker, 120);
    maxLen("intro.why.source", i.why.source, 240);
    i.why.gaps.forEach((g) => { need(`intro.why.gaps.${g.id}.title`, g.title, "a title", 80); need(`intro.why.gaps.${g.id}.text`, g.text, "the text", 160); });
    i.why.market.forEach((m) => { need(`intro.why.market.${m.id}.value`, m.value, "a figure", 12); need(`intro.why.market.${m.id}.label`, m.label, "a description", 100); });

    const p = f.participants;
    need("participants.title", p.title, "a heading", 80);
    maxLen("participants.intro", p.intro, 240);
    if (!p.items.length) e["participants.items"] = "Add at least one participant type.";
    p.items.forEach((x) => { need(`participants.items.${x.id}.title`, x.title, "a title", 80); need(`participants.items.${x.id}.text`, x.text, "the text", 160); });
    p.ways.forEach((w) => need(`participants.ways.${w.id}.label`, w.label, "a label", 40));

    const g = f.programmes;
    need("programmes.title", g.title, "a heading", 80);
    need("programmes.ctaLabel", g.ctaLabel, "button text", 30);
    link("programmes.ctaUrl", g.ctaUrl, "a button link");
    if (g.mode === "pinned" && !g.pinned.length) e["programmes.pinned"] = "Pin at least one programme, or switch to automatic.";

    const n = f.newsEvents;
    need("newsEvents.title", n.title, "a news heading", 80);
    need("newsEvents.eventsTitle", n.eventsTitle, "an events heading", 80);
    if (n.newsMode === "pinned" && !n.pinnedNews.length) e["newsEvents.pinnedNews"] = "Pin at least one news item, or switch to automatic.";
    if (n.eventsMode === "pinned" && !n.pinnedEvents.length) e["newsEvents.pinnedEvents"] = "Pin at least one event, or switch to automatic.";

    const r = f.partners;
    need("partners.title", r.title, "a heading", 80);
    maxLen("partners.intro", r.intro, 240);
    if (!r.featured.length) e["partners.featured"] = "Feature at least one partner.";
    need("partners.applyCta.title", r.applyCta.title, "a heading", 80);
    need("partners.applyCta.label", r.applyCta.label, "button text", 30);
    link("partners.applyCta.url", r.applyCta.url, "a button link");
    need("partners.subscribe.title", r.subscribe.title, "a heading", 60);
    need("partners.subscribe.text", r.subscribe.text, "the text", 200);
    need("partners.subscribe.placeholder", r.subscribe.placeholder, "placeholder text", 40);
    need("partners.subscribe.buttonLabel", r.subscribe.buttonLabel, "button text", 24);
    need("partners.subscribe.successMessage", r.subscribe.successMessage, "a confirmation message", 120);

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
        pin: (<><path d="M12 17v5" /><path d="M9 3h6l-1 7 3 3H7l3-3z" /></>),
        close: <path d="M6 6l12 12M18 6 6 18" />,
        check: <path d="m5 12 5 5 9-10" />,
        alert: (<><path d="M12 3 2.5 20h19z" /><path d="M12 10v4M12 17.2v.1" /></>),
        search: (<><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4-4" /></>),
        image: (<><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" /></>),
        external: <path d="M14 4h6v6M20 4l-9 9M18 14v5H5V6h5" />,
        unlink: (<><path d="M9 15 15 9" /><path d="M11 6l1.5-1.5a4 4 0 0 1 5.7 5.7L16.7 11.7M13 18l-1.5 1.5a4 4 0 0 1-5.7-5.7L7.3 12.3" /><path d="M3 3l18 18" /></>),
        refresh: (<><path d="M21 12a9 9 0 1 1-3-6.7" /><polyline points="21 3 21 9 15 9" /></>),
        panel: (<><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M14 4v16" /></>),
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
        <button type="button" role="switch" aria-checked={checked} aria-label={label} className={`po-toggle ${checked ? "is-on" : ""}`} onClick={() => onChange(!checked)}>
            <span />
        </button>
    );
}

/* One labelled text box or text area with a character counter and an error line */
function Field({ label, hint, value, onChange, errorKey, max, rows, placeholder, className = "", type = "text" }) {
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
            ) : (
                <input id={id} type={type} className="po-input" value={value || ""} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
            )}
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

/* An ordered list where every row can be edited, moved and removed.
   removeKind "delete" → asks first and moves the row to Trash; "unpin" → just takes it off the page */
function Orderable({ items, onMove, onRemove, removeKind = "delete", nameOf, children, empty }) {
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
                    <span className="po-item-no">{i + 1}</span>
                    <div className="po-item-body">{children(item, i)}</div>
                    <div className="po-item-tools">
                        <button type="button" className="po-iconbtn" aria-label="Move up" title="Move up" disabled={i === 0} onClick={() => onMove(i, i - 1)}><Icon name="up" size={15} /></button>
                        <button type="button" className="po-iconbtn" aria-label="Move down" title="Move down" disabled={i === items.length - 1} onClick={() => onMove(i, i + 1)}><Icon name="down" size={15} /></button>
                        {removeKind === "delete" ? (
                            <button type="button" className="po-iconbtn is-danger" aria-label={`Delete ${nameOf(item)}`} title="Delete (moves to Trash)" onClick={() => askDelete({ what: nameOf(item), onConfirm: () => onRemove(i) })}><Icon name="trash" size={15} /></button>
                        ) : (
                            <button type="button" className="po-iconbtn" aria-label={`Unpin ${nameOf(item)}`} title="Unpin from the Home page" onClick={() => onRemove(i)}><Icon name="unlink" size={15} /></button>
                        )}
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

const moveIn = (list, from, to) => {
    if (to < 0 || to >= list.length) return list;
    const next = [...list];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    return next;
};

/* ------------------------------ media ------------------------------ */

function MediaField({ label, hint, mediaId, onChange, accept = "any", errorKey }) {
    const { media, pickMedia } = useEd();
    const asset = media.find((m) => m.id === mediaId);
    const needsAlt = asset && asset.type === "image" && !asset.alt;

    return (
        <div className="po-field">
            <div className="po-field-top"><span className="po-label">{label}</span></div>
            <div className="po-media">
                <span className="po-media-thumb">
                    {asset ? <img src={thumbOf(asset)} alt="" /> : <Icon name="image" size={22} />}
                </span>
                <div className="po-media-text">
                    {asset ? (
                        <>
                            <strong>{asset.name}</strong>
                            <small>{asset.type === "video" ? "Video" : "Image"} · {asset.size}</small>
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
    const [type, setType] = useState(state.accept === "image" ? "image" : state.accept === "video" ? "video" : "all");
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
                        <p>Choose a file for this section. Files are managed in the Media Library.</p>
                    </div>
                    <button type="button" className="po-iconbtn" aria-label="Close" onClick={onClose}><Icon name="close" size={18} /></button>
                </header>

                <div className="po-picker-tools" style={{ paddingTop: 16 }}>
                    <label className="po-search">
                        <Icon name="search" size={16} />
                        <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by file name or alt text" aria-label="Search media" />
                    </label>
                    <select className="po-input po-select" value={type} onChange={(e) => setType(e.target.value)} aria-label="File type">
                        <option value="all">All files</option>
                        <option value="image">Images</option>
                        <option value="video">Video</option>
                    </select>
                    <button type="button" className="po-btn-small" onClick={() => fileRef.current?.click()}><Icon name="upload" size={14} /> Upload</button>
                    <input ref={fileRef} type="file" hidden accept="image/*,video/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) onUpload(f); e.target.value = ""; }} />
                </div>

                <div className="po-media-grid">
                    {list.length === 0 && <p className="po-empty">No files match. Try another search or upload a new file.</p>}
                    {list.map((m) => (
                        <button key={m.id} type="button" className={`po-media-card ${state.selected === m.id ? "is-selected" : ""}`} onClick={() => { state.onPick(m.id); onClose(); }}>
                            <img src={thumbOf(m)} alt="" />
                            <span className="po-media-card-text">
                                <strong>{m.name}</strong>
                                <small>{m.type === "video" ? "Video" : "Image"} · {m.size}</small>
                            </span>
                            {state.selected === m.id && <span className="po-media-check"><Icon name="check" size={14} /></span>}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

/* ------------------------------ pin lists (featured programmes, news, events, partners) ------------------------------ */

const STATUS_PILL = {
    open: { label: "Open", tone: "ok" },
    upcoming: { label: "Upcoming", tone: "warn" },
    closed: { label: "Closed", tone: "info" },
    draft: { label: "Draft", tone: "off" },
    published: { label: "Published", tone: "ok" },
    scheduled: { label: "Scheduled", tone: "warn" },
    archived: { label: "Archived", tone: "info" },
    cancelled: { label: "Cancelled", tone: "off" },
};

const PARTNER_TYPE = { agency: "Agency", industry: "Industry", research: "Research", university: "University", international: "International" };

/* an item shows on the public site unless it is a draft / scheduled / cancelled / archived record */
const isPublic = (item) => !item.status || ["open", "upcoming", "closed", "published"].includes(item.status);

function PinList({ title, hint, catalog, pinnedIds, onChange, limit, manage, manageLabel, errorKey, noun }) {
    const [query, setQuery] = useState("");
    const byId = (id) => catalog.find((c) => c.id === id);
    const pinned = pinnedIds.map(byId).filter(Boolean);
    const full = pinned.length >= limit;
    const available = catalog.filter((c) => !pinnedIds.includes(c.id) && (!query.trim() || c.title.toLowerCase().includes(query.trim().toLowerCase())));
    const hidden = pinned.filter((p) => !isPublic(p));

    const meta = (item) => (item.type ? PARTNER_TYPE[item.type] : [item.area, item.note].filter(Boolean).join(" · ") || item.note);
    const pill = (item) => (item.status ? <span className={`po-pill is-${STATUS_PILL[item.status]?.tone || "info"}`}>{STATUS_PILL[item.status]?.label || item.status}</span> : null);

    return (
        <div className="po-pin">
            <BlockHead
                title={title}
                text={hint}
                aside={<span className={`po-limit ${full ? "is-full" : ""}`}>{pinned.length} of {limit} {limit === 1 ? noun : `${noun}s`}</span>}
            />

            <Orderable
                items={pinned}
                nameOf={(i) => i.title}
                removeKind="unpin"
                onMove={(from, to) => onChange(moveIn(pinnedIds, from, to))}
                onRemove={(i) => onChange(pinnedIds.filter((_, idx) => idx !== i))}
                empty={`Nothing pinned yet. Pin a ${noun} from the list below.`}
            >
                {(item) => (
                    <div className="po-pin-row">
                        <div className="po-pin-text"><strong>{item.title}</strong><small>{meta(item)}</small></div>
                        {pill(item)}
                    </div>
                )}
            </Orderable>
            <ErrorLine errorKey={errorKey} />

            {hidden.length > 0 && (
                <p className="po-warn"><Icon name="alert" size={15} /> {hidden.length} pinned {hidden.length === 1 ? "item is" : "items are"} not public yet ({hidden.map((h) => h.title).join(", ")}). Visitors will not see {hidden.length === 1 ? "it" : "them"} until published.</p>
            )}

            <div className="po-available">
                <div className="po-available-head">
                    <h4>Available {noun}s</h4>
                    <a href={manage} className="po-link">{manageLabel} <Icon name="external" size={12} /></a>
                </div>
                <label className="po-search">
                    <Icon name="search" size={16} />
                    <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={`Search ${noun}s`} aria-label={`Search ${noun}s`} />
                </label>
                <ul className="po-available-list">
                    {available.length === 0 && <li className="po-empty">{query ? "No matches." : `Every ${noun} is already pinned.`}</li>}
                    {available.map((item) => (
                        <li key={item.id}>
                            <div className="po-pin-text"><strong>{item.title}</strong><small>{meta(item)}</small></div>
                            {pill(item)}
                            <button type="button" className="po-btn-small" disabled={full} title={full ? `The Home page shows up to ${limit}` : "Pin to the Home page"} onClick={() => onChange([...pinnedIds, item.id])}>
                                <Icon name="pin" size={13} /> Pin
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}

function ModeSwitch({ value, onChange, options, label }) {
    return (
        <div className="po-mode" role="radiogroup" aria-label={label}>
            {options.map((o) => (
                <button key={o.value} type="button" role="radio" aria-checked={value === o.value} className={value === o.value ? "is-on" : ""} onClick={() => onChange(o.value)}>
                    <strong>{o.label}</strong>
                    <small>{o.text}</small>
                </button>
            ))}
        </div>
    );
}

/* ====================================================================
   SECTION EDITORS
==================================================================== */

function SectionHead({ section, number }) {
    const { form, edit } = useEd();
    const def = SECTIONS[number];
    const visible = form[section].visible;

    return (
        <header className="po-card-head">
            <div>
                <span className="po-card-no">Section {number + 1} of {SECTIONS.length}</span>
                <h2>{def.label}</h2>
                <p>{def.hint}. Changes go live when you publish.</p>
            </div>
            <label className="po-visible">
                <span>{visible ? "Shown on Home page" : "Hidden from Home page"}</span>
                <Toggle checked={visible} label={`Show ${def.label} on the Home page`} onChange={(v) => edit((d) => { d[section].visible = v; })} />
            </label>
        </header>
    );
}

/* ---------- 1. Main banner and slogan ---------- */
function BannerEditor() {
    const { form, edit } = useEd();
    const b = form.banner;
    const set = (patch) => edit((d) => Object.assign(d.banner, patch));
    const stat = (id, patch) => edit((d) => Object.assign(d.banner.stats.find((x) => x.id === id), patch));

    return (
        <section className="po-card">
            <SectionHead section="banner" number={0} />

            <div className="po-block">
                <BlockHead title="Slogan and headline" text="The first words on the page." />
                <Field label="Slogan" errorKey="banner.slogan" value={b.slogan} max={120} onChange={(v) => set({ slogan: v })} hint="Small line above the headline, for example the project name and tagline." />
                <Field label="Headline" errorKey="banner.headline" value={b.headline} max={120} onChange={(v) => set({ headline: v })} hint="Put *asterisks* around the words that should be highlighted in yellow." />
                <Field label="Supporting text" errorKey="banner.intro" value={b.intro} max={280} rows={3} onChange={(v) => set({ intro: v })} />
            </div>

            <div className="po-block">
                <BlockHead title="Buttons" text="Two buttons under the supporting text." />
                <div className="po-grid-2">
                    <div className="po-subcard">
                        <span className="po-subcard-tag">Main button</span>
                        <Field label="Text" errorKey="banner.primaryCta.label" value={b.primaryCta.label} max={30} onChange={(v) => edit((d) => { d.banner.primaryCta.label = v; })} />
                        <Field label="Link" errorKey="banner.primaryCta.url" value={b.primaryCta.url} placeholder="/apply-to-participate" onChange={(v) => edit((d) => { d.banner.primaryCta.url = v; })} />
                    </div>
                    <div className="po-subcard">
                        <span className="po-subcard-tag">Second button</span>
                        <Field label="Text" errorKey="banner.secondaryCta.label" value={b.secondaryCta.label} max={30} onChange={(v) => edit((d) => { d.banner.secondaryCta.label = v; })} />
                        <Field label="Link" errorKey="banner.secondaryCta.url" value={b.secondaryCta.url} placeholder="#subscribe" onChange={(v) => edit((d) => { d.banner.secondaryCta.url = v; })} />
                    </div>
                </div>
            </div>

            <div className="po-block">
                <BlockHead title="Background" text="A short looping video or a photo behind the banner." />
                <MediaField label="Background file" accept="any" mediaId={b.mediaId} onChange={(id) => set({ mediaId: id })} hint="Use a muted loop under 20 MB. Photos work if no video is set." />
            </div>

            <div className="po-block">
                <BlockHead title="Key figures" text="Short numbers shown under the buttons." aside={<span className="po-limit">{b.stats.length} of {LIMITS.stats}</span>} />
                <Orderable
                    items={b.stats}
                    nameOf={(s) => s.value || "figure"}
                    onMove={(from, to) => edit((d) => { d.banner.stats = moveIn(d.banner.stats, from, to); })}
                    onRemove={(i) => edit((d) => { d.banner.stats.splice(i, 1); })}
                    empty="No key figures yet."
                >
                    {(s) => (
                        <div className="po-row-fields">
                            <Field label="Figure" className="is-narrow" errorKey={`banner.stats.${s.id}.value`} value={s.value} max={10} onChange={(v) => stat(s.id, { value: v })} />
                            <Field label="Description" errorKey={`banner.stats.${s.id}.label`} value={s.label} max={80} onChange={(v) => stat(s.id, { label: v })} />
                        </div>
                    )}
                </Orderable>
                <ErrorLine errorKey="banner.stats" />
                <AddButton disabled={b.stats.length >= LIMITS.stats} onClick={() => edit((d) => { d.banner.stats.push({ id: uid(), value: "", label: "" }); })}>Add key figure</AddButton>
            </div>
        </section>
    );
}

/* ---------- 2. What is the sandbox? / Why it matters ---------- */
function IntroEditor() {
    const { form, edit } = useEd();
    const w = form.intro.what;
    const y = form.intro.why;
    const setWhat = (fn) => edit((d) => fn(d.intro.what));
    const setWhy = (fn) => edit((d) => fn(d.intro.why));
    const upd = (fn, list, id, patch) => fn((x) => Object.assign(x[list].find((q) => q.id === id), patch));

    return (
        <section className="po-card">
            <SectionHead section="intro" number={1} />

            <div className="po-block">
                <BlockHead title="What is the sandbox?" text="Definition, purpose and location." />
                <Field label="Heading" errorKey="intro.what.title" value={w.title} max={80} onChange={(v) => setWhat((x) => { x.title = v; })} hint="Put *asterisks* around highlighted words." />

                <h4 className="po-sub">Rows</h4>
                <Orderable
                    items={w.rows}
                    nameOf={(r) => r.label || "row"}
                    onMove={(from, to) => setWhat((x) => { x.rows = moveIn(x.rows, from, to); })}
                    onRemove={(i) => setWhat((x) => { x.rows.splice(i, 1); })}
                    empty="No rows yet."
                >
                    {(r) => (
                        <div className="po-stack">
                            <Field label="Label" className="is-narrow" errorKey={`intro.what.rows.${r.id}.label`} value={r.label} max={40} onChange={(v) => upd(setWhat, "rows", r.id, { label: v })} />
                            <Field label="Text" errorKey={`intro.what.rows.${r.id}.text`} value={r.text} max={400} rows={3} onChange={(v) => upd(setWhat, "rows", r.id, { text: v })} />
                        </div>
                    )}
                </Orderable>
                <ErrorLine errorKey="intro.what.rows" />
                <AddButton disabled={w.rows.length >= LIMITS.intro} onClick={() => setWhat((x) => { x.rows.push({ id: uid(), label: "", text: "" }); })}>Add row</AddButton>

                <MediaField label="Picture" accept="image" mediaId={w.mediaId} onChange={(id) => setWhat((x) => { x.mediaId = id; })} />
            </div>

            <div className="po-block">
                <BlockHead title="Why it matters" text="The problem, then the market case." />
                <Field label="Short line above the heading" errorKey="intro.why.kicker" value={y.kicker} max={120} onChange={(v) => setWhy((x) => { x.kicker = v; })} />
                <Field label="Heading" errorKey="intro.why.title" value={y.title} max={100} onChange={(v) => setWhy((x) => { x.title = v; })} />

                <h4 className="po-sub">The gaps today</h4>
                <Orderable
                    items={y.gaps}
                    nameOf={(g) => g.title || "gap"}
                    onMove={(from, to) => setWhy((x) => { x.gaps = moveIn(x.gaps, from, to); })}
                    onRemove={(i) => setWhy((x) => { x.gaps.splice(i, 1); })}
                    empty="No gaps listed."
                >
                    {(g) => (
                        <div className="po-stack">
                            <Field label="Title" errorKey={`intro.why.gaps.${g.id}.title`} value={g.title} max={80} onChange={(v) => upd(setWhy, "gaps", g.id, { title: v })} />
                            <Field label="Text" errorKey={`intro.why.gaps.${g.id}.text`} value={g.text} max={160} onChange={(v) => upd(setWhy, "gaps", g.id, { text: v })} />
                        </div>
                    )}
                </Orderable>
                <AddButton disabled={y.gaps.length >= LIMITS.gaps} onClick={() => setWhy((x) => { x.gaps.push({ id: uid(), title: "", text: "" }); })}>Add gap</AddButton>

                <h4 className="po-sub">Market figures</h4>
                <Orderable
                    items={y.market}
                    nameOf={(m) => m.value || "figure"}
                    onMove={(from, to) => setWhy((x) => { x.market = moveIn(x.market, from, to); })}
                    onRemove={(i) => setWhy((x) => { x.market.splice(i, 1); })}
                    empty="No market figures."
                >
                    {(m) => (
                        <div className="po-row-fields">
                            <Field label="Figure" className="is-narrow" errorKey={`intro.why.market.${m.id}.value`} value={m.value} max={12} onChange={(v) => upd(setWhy, "market", m.id, { value: v })} />
                            <Field label="Description" errorKey={`intro.why.market.${m.id}.label`} value={m.label} max={100} onChange={(v) => upd(setWhy, "market", m.id, { label: v })} />
                        </div>
                    )}
                </Orderable>
                <AddButton disabled={y.market.length >= LIMITS.market} onClick={() => setWhy((x) => { x.market.push({ id: uid(), value: "", label: "" }); })}>Add market figure</AddButton>

                <Field label="Source note" errorKey="intro.why.source" value={y.source} max={240} rows={2} onChange={(v) => setWhy((x) => { x.source = v; })} hint="Always credit where the figures come from." />
                <MediaField label="Picture" accept="image" mediaId={y.mediaId} onChange={(id) => setWhy((x) => { x.mediaId = id; })} />
            </div>
        </section>
    );
}

/* ---------- 3. Who should participate? ---------- */
function ParticipantsEditor() {
    const { form, edit } = useEd();
    const p = form.participants;
    const set = (fn) => edit((d) => fn(d.participants));
    const upd = (list, id, patch) => set((x) => Object.assign(x[list].find((q) => q.id === id), patch));

    return (
        <section className="po-card">
            <SectionHead section="participants" number={2} />

            <div className="po-block">
                <BlockHead title="Heading and introduction" />
                <Field label="Heading" errorKey="participants.title" value={p.title} max={80} onChange={(v) => set((x) => { x.title = v; })} hint="Put *asterisks* around highlighted words." />
                <Field label="Short introduction" errorKey="participants.intro" value={p.intro} max={240} rows={2} onChange={(v) => set((x) => { x.intro = v; })} />
            </div>

            <div className="po-block">
                <BlockHead title="Who can take part" text="One row per type of participant." aside={<span className="po-limit">{p.items.length} of {LIMITS.participants}</span>} />
                <Orderable
                    items={p.items}
                    nameOf={(i) => i.title || "participant"}
                    onMove={(from, to) => set((x) => { x.items = moveIn(x.items, from, to); })}
                    onRemove={(i) => set((x) => { x.items.splice(i, 1); })}
                    empty="No participant types yet."
                >
                    {(item) => (
                        <div className="po-stack">
                            <Field label="Participant" errorKey={`participants.items.${item.id}.title`} value={item.title} max={80} onChange={(v) => upd("items", item.id, { title: v })} />
                            <Field label="What they can do" errorKey={`participants.items.${item.id}.text`} value={item.text} max={160} onChange={(v) => upd("items", item.id, { text: v })} />
                        </div>
                    )}
                </Orderable>
                <ErrorLine errorKey="participants.items" />
                <AddButton disabled={p.items.length >= LIMITS.participants} onClick={() => set((x) => { x.items.push({ id: uid(), title: "", text: "" }); })}>Add participant type</AddButton>
            </div>

            <div className="po-block">
                <BlockHead title="Ways to participate" text="Short tags shown under the list." aside={<span className="po-limit">{p.ways.length} of {LIMITS.ways}</span>} />
                <Orderable
                    items={p.ways}
                    nameOf={(w) => w.label || "tag"}
                    onMove={(from, to) => set((x) => { x.ways = moveIn(x.ways, from, to); })}
                    onRemove={(i) => set((x) => { x.ways.splice(i, 1); })}
                    empty="No tags yet."
                >
                    {(w) => <Field label="Tag" errorKey={`participants.ways.${w.id}.label`} value={w.label} max={40} onChange={(v) => upd("ways", w.id, { label: v })} />}
                </Orderable>
                <AddButton disabled={p.ways.length >= LIMITS.ways} onClick={() => set((x) => { x.ways.push({ id: uid(), label: "" }); })}>Add tag</AddButton>
            </div>

            <div className="po-block">
                <BlockHead title="Picture" />
                <MediaField label="Picture" accept="image" mediaId={p.mediaId} onChange={(id) => set((x) => { x.mediaId = id; })} />
            </div>
        </section>
    );
}

/* ---------- 4. Featured programmes (pin / order) ---------- */
function ProgrammesEditor() {
    const { form, edit, catalog } = useEd();
    const g = form.programmes;
    const set = (patch) => edit((d) => Object.assign(d.programmes, patch));

    return (
        <section className="po-card">
            <SectionHead section="programmes" number={3} />

            <div className="po-block">
                <BlockHead title="Heading and button" />
                <Field label="Heading" errorKey="programmes.title" value={g.title} max={80} onChange={(v) => set({ title: v })} hint="Put *asterisks* around highlighted words." />
                <div className="po-grid-2">
                    <Field label="Button text" errorKey="programmes.ctaLabel" value={g.ctaLabel} max={30} onChange={(v) => set({ ctaLabel: v })} />
                    <Field label="Button link" errorKey="programmes.ctaUrl" value={g.ctaUrl} placeholder="/apply-to-participate" onChange={(v) => set({ ctaUrl: v })} />
                </div>
            </div>

            <div className="po-block">
                <BlockHead title="Which programmes appear" text="The Home page shows up to four cards." />
                <ModeSwitch
                    label="Programme selection"
                    value={g.mode}
                    onChange={(v) => set({ mode: v })}
                    options={[
                        { value: "pinned", label: "Pin and order myself", text: "Choose exactly which programmes show, and in what order." },
                        { value: "latest", label: "Automatic", text: "Show the newest open and upcoming programmes." },
                    ]}
                />
                {g.mode === "pinned" ? (
                    <PinList
                        title="Pinned programmes"
                        hint="Drag to reorder. Programmes still in draft stay hidden from visitors."
                        catalog={catalog.programmes}
                        pinnedIds={g.pinned}
                        onChange={(ids) => set({ pinned: ids })}
                        limit={LIMITS.programmes}
                        noun="programme"
                        manage={MANAGE.programmes}
                        manageLabel="Manage programmes"
                        errorKey="programmes.pinned"
                    />
                ) : (
                    <p className="po-callout"><Icon name="check" size={15} /> <span>The newest open and upcoming programmes appear automatically. Create or close programmes under <a href={MANAGE.programmes}>Open Programmes and Calls</a>.</span></p>
                )}
            </div>
        </section>
    );
}

/* ---------- 5. Latest news and upcoming events (pin) ---------- */
function NewsEventsEditor() {
    const { form, edit, catalog } = useEd();
    const n = form.newsEvents;
    const set = (patch) => edit((d) => Object.assign(d.newsEvents, patch));

    return (
        <section className="po-card">
            <SectionHead section="newsEvents" number={4} />

            <div className="po-block">
                <BlockHead title="Latest news" text="Project updates shown on the left." />
                <Field label="Heading" errorKey="newsEvents.title" value={n.title} max={80} onChange={(v) => set({ title: v })} hint="Put *asterisks* around highlighted words." />
                <ModeSwitch
                    label="News selection"
                    value={n.newsMode}
                    onChange={(v) => set({ newsMode: v })}
                    options={[
                        { value: "pinned", label: "Pin and order myself", text: "Pinned items stay at the top." },
                        { value: "latest", label: "Automatic", text: "Show the three newest published items." },
                    ]}
                />
                {n.newsMode === "pinned" ? (
                    <PinList
                        title="Pinned news"
                        hint="Only published news can be seen by visitors."
                        catalog={catalog.news}
                        pinnedIds={n.pinnedNews}
                        onChange={(ids) => set({ pinnedNews: ids })}
                        limit={LIMITS.news}
                        noun="news item"
                        manage={MANAGE.news}
                        manageLabel="Manage news"
                        errorKey="newsEvents.pinnedNews"
                    />
                ) : (
                    <p className="po-callout"><Icon name="check" size={15} /> <span>The three newest published news items appear automatically.</span></p>
                )}
            </div>

            <div className="po-block">
                <BlockHead title="Upcoming events" text="Dates and activities shown on the right." />
                <Field label="Heading" errorKey="newsEvents.eventsTitle" value={n.eventsTitle} max={80} onChange={(v) => set({ eventsTitle: v })} />
                <ModeSwitch
                    label="Event selection"
                    value={n.eventsMode}
                    onChange={(v) => set({ eventsMode: v })}
                    options={[
                        { value: "latest", label: "Automatic", text: "Show the next three published events by date." },
                        { value: "pinned", label: "Pin and order myself", text: "Choose which events show." },
                    ]}
                />
                {n.eventsMode === "pinned" ? (
                    <PinList
                        title="Pinned events"
                        hint="Only published events can be seen by visitors."
                        catalog={catalog.events}
                        pinnedIds={n.pinnedEvents}
                        onChange={(ids) => set({ pinnedEvents: ids })}
                        limit={LIMITS.events}
                        noun="event"
                        manage={MANAGE.events}
                        manageLabel="Manage events"
                        errorKey="newsEvents.pinnedEvents"
                    />
                ) : (
                    <p className="po-callout"><Icon name="check" size={15} /> <span>The next three published events appear automatically, soonest first.</span></p>
                )}
            </div>
        </section>
    );
}

/* ---------- 6. Partners preview and CTA buttons ---------- */
function PartnersEditor() {
    const { form, edit, catalog } = useEd();
    const r = form.partners;
    const set = (fn) => edit((d) => fn(d.partners));

    return (
        <section className="po-card">
            <SectionHead section="partners" number={5} />

            <div className="po-block">
                <BlockHead title="Heading and introduction" />
                <Field label="Heading" errorKey="partners.title" value={r.title} max={80} onChange={(v) => set((x) => { x.title = v; })} hint="Put *asterisks* around highlighted words." />
                <Field label="Short introduction" errorKey="partners.intro" value={r.intro} max={240} rows={2} onChange={(v) => set((x) => { x.intro = v; })} />
            </div>

            <div className="po-block">
                <PinList
                    title="Featured partners"
                    hint="Logos come from each partner’s record. Drag to set the order."
                    catalog={catalog.partners}
                    pinnedIds={r.featured}
                    onChange={(ids) => set((x) => { x.featured = ids; })}
                    limit={LIMITS.partners}
                    noun="partner"
                    manage={MANAGE.partners}
                    manageLabel="Manage partners"
                    errorKey="partners.featured"
                />
            </div>

            <div className="po-block">
                <BlockHead title="Apply to Participate" text="The main call to action at the end of the page." />
                <Field label="Heading" errorKey="partners.applyCta.title" value={r.applyCta.title} max={80} onChange={(v) => set((x) => { x.applyCta.title = v; })} hint="Put *asterisks* around highlighted words." />
                <div className="po-grid-2">
                    <Field label="Button text" errorKey="partners.applyCta.label" value={r.applyCta.label} max={30} onChange={(v) => set((x) => { x.applyCta.label = v; })} />
                    <Field label="Button link" errorKey="partners.applyCta.url" value={r.applyCta.url} placeholder="/apply-to-participate" onChange={(v) => set((x) => { x.applyCta.url = v; })} />
                </div>
            </div>

            <div className="po-block">
                <BlockHead title="Subscribe for Updates" text="The sign-up box. Subscribers appear under Subscribers in the menu." />
                <Field label="Heading" errorKey="partners.subscribe.title" value={r.subscribe.title} max={60} onChange={(v) => set((x) => { x.subscribe.title = v; })} />
                <Field label="Text" errorKey="partners.subscribe.text" value={r.subscribe.text} max={200} rows={2} onChange={(v) => set((x) => { x.subscribe.text = v; })} />
                <div className="po-grid-2">
                    <Field label="Email box hint" errorKey="partners.subscribe.placeholder" value={r.subscribe.placeholder} max={40} onChange={(v) => set((x) => { x.subscribe.placeholder = v; })} />
                    <Field label="Button text" errorKey="partners.subscribe.buttonLabel" value={r.subscribe.buttonLabel} max={24} onChange={(v) => set((x) => { x.subscribe.buttonLabel = v; })} />
                </div>
                <Field label="Message after subscribing" errorKey="partners.subscribe.successMessage" value={r.subscribe.successMessage} max={120} onChange={(v) => set((x) => { x.subscribe.successMessage = v; })} />
            </div>
        </section>
    );
}

/* ====================================================================
   PAGE SETTINGS (SEO), HISTORY
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
                    <p>How the Home page looks in Google results and when someone shares the link.</p>
                </div>
            </header>

            <div className="po-block">
                <div className="po-field">
                    <div className="po-field-top"><span className="po-label">Page address</span></div>
                    <div className="po-readonly">/ <span className="po-pill is-info">home</span> <small>The Home page address cannot be changed.</small></div>
                </div>
                <Field label="Page title" errorKey="seo.title" value={s.title} max={70} onChange={(v) => set({ title: v })} hint="Shown in the browser tab and search results." />
                <Field label="Search description" errorKey="seo.description" value={s.description} max={160} rows={3} onChange={(v) => set({ description: v })} />
                <MediaField label="Share image" accept="image" mediaId={s.mediaId} onChange={(id) => set({ mediaId: id })} hint="Shown when the link is shared on social media or chat." />
            </div>

            <div className="po-block">
                <BlockHead title="Search result preview" />
                <div className="po-serp">
                    <span>perlis-sandbox.my</span>
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
                    <h2>Who changed the Home page</h2>
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

function DraftPreview({ form, catalog, media, activeKey }) {
    const ref = useRef(null);

    useEffect(() => {
        const box = ref.current;
        if (!box) return;
        const target = box.querySelector(`[data-sec="${activeKey}"]`);
        if (target) box.scrollTo({ top: Math.max(0, target.offsetTop - 12), behavior: "smooth" });
    }, [activeKey]);

    const mediaOf = (id) => media.find((m) => m.id === id);
    const by = (list, ids) => ids.map((id) => list.find((c) => c.id === id)).filter(Boolean);
    const pub = (list) => list.filter(isPublic);
    const cls = (key, extra = "") => `po-pv-sec ${extra} ${activeKey === key ? "is-active" : ""}`;
    const hidden = (label) => <div className="po-pv-hidden">{label} is hidden from the Home page</div>;
    const head = (title, intro) => (
        <header className="po-pv-head">
            <h2><Hl text={title} /></h2>
            {intro && <p>{intro}</p>}
        </header>
    );

    const programmes = form.programmes.mode === "pinned" ? pub(by(catalog.programmes, form.programmes.pinned)) : catalog.programmes.filter((p) => ["open", "upcoming"].includes(p.status));
    const news = form.newsEvents.newsMode === "pinned" ? pub(by(catalog.news, form.newsEvents.pinnedNews)) : catalog.news.filter((n) => n.status === "published");
    const events = form.newsEvents.eventsMode === "pinned" ? pub(by(catalog.events, form.newsEvents.pinnedEvents)) : catalog.events.filter((n) => n.status === "published");
    const partners = by(catalog.partners, form.partners.featured);

    const b = form.banner;
    const bg = mediaOf(b.mediaId);
    const { what, why } = form.intro;

    return (
        <div className="po-pv-scroll" ref={ref}>
            <div className="po-pv">
                {/* 1 banner */}
                <section data-sec="banner" className={cls("banner", "po-pv-banner")} style={b.visible && bg ? { backgroundImage: `linear-gradient(180deg, rgba(11,26,40,.6), rgba(11,26,40,.92)), url("${thumbOf(bg)}")` } : undefined}>
                    {b.visible ? (
                        <>
                            <p className="po-pv-slogan">{b.slogan}</p>
                            <h1><Hl text={b.headline} /></h1>
                            <p className="po-pv-lede">{b.intro}</p>
                            <div className="po-pv-btns" style={{ marginTop: 20 }}><span>{b.primaryCta.label}</span><span className="is-ghost">{b.secondaryCta.label}</span></div>
                            <div className="po-pv-stats">{b.stats.map((s) => <div key={s.id}><strong>{s.value}</strong><span>{s.label}</span></div>)}</div>
                        </>
                    ) : hidden("Main banner")}
                </section>

                {/* 2 intro */}
                <section data-sec="intro" className={cls("intro", "is-dark")}>
                    {form.intro.visible ? (
                        <>
                            {head(what.title)}
                            <div className="po-pv-rows">{what.rows.map((r) => <div className="po-pv-row" key={r.id}><small>{r.label}</small><p>{r.text}</p></div>)}</div>
                            <small className="po-pv-kicker">{why.kicker}</small>
                            <h3 className="po-pv-sub"><Hl text={why.title} /></h3>
                            <div className="po-pv-cards">{why.gaps.map((g) => <article key={g.id}><strong>{g.title}</strong><p>{g.text}</p></article>)}</div>
                            <div className="po-pv-stats">{why.market.map((m) => <div key={m.id}><strong>{m.value}</strong><span>{m.label}</span></div>)}</div>
                            {why.source && <small className="po-pv-source">{why.source}</small>}
                        </>
                    ) : hidden("What is the sandbox? / Why it matters")}
                </section>

                {/* 3 participants */}
                <section data-sec="participants" className={cls("participants")}>
                    {form.participants.visible ? (
                        <>
                            {head(form.participants.title, form.participants.intro)}
                            <div className="po-pv-cards">{form.participants.items.map((p) => <article key={p.id}><strong>{p.title || "Untitled"}</strong><p>{p.text}</p></article>)}</div>
                            <div className="po-pv-chips">{form.participants.ways.map((w) => <span key={w.id}>{w.label}</span>)}</div>
                        </>
                    ) : hidden("Who should participate?")}
                </section>

                {/* 4 programmes */}
                <section data-sec="programmes" className={cls("programmes", "is-dark")}>
                    {form.programmes.visible ? (
                        <>
                            {head(form.programmes.title)}
                            {programmes.length === 0 && <p className="po-pv-none">No public programmes to show yet.</p>}
                            <div className="po-pv-cards">{programmes.slice(0, LIMITS.programmes).map((p, i) => <article key={p.id}><b>{String(i + 1).padStart(2, "0")}</b><strong>{p.title}</strong><small>{p.area}</small></article>)}</div>
                            <div className="po-pv-btns" style={{ marginTop: 20 }}><span>{form.programmes.ctaLabel}</span></div>
                        </>
                    ) : hidden("Featured programmes")}
                </section>

                {/* 5 news + events */}
                <section data-sec="newsEvents" className={cls("newsEvents")}>
                    {form.newsEvents.visible ? (
                        <>
                            {head(form.newsEvents.title)}
                            {news.length === 0 && <p className="po-pv-none">No public news to show yet.</p>}
                            <div className="po-pv-rows">{news.slice(0, LIMITS.news).map((n) => <div className="po-pv-row" key={n.id}><small>{n.note}</small><strong>{n.title}</strong></div>)}</div>
                            <h3 className="po-pv-sub"><Hl text={form.newsEvents.eventsTitle} /></h3>
                            {events.length === 0 && <p className="po-pv-none">No public events to show yet.</p>}
                            <div className="po-pv-rows">{events.slice(0, LIMITS.events).map((n) => <div className="po-pv-row" key={n.id}><small>{n.note}</small><strong>{n.title}</strong></div>)}</div>
                        </>
                    ) : hidden("Latest news and upcoming events")}
                </section>

                {/* 6 partners + CTA */}
                <section data-sec="partners" className={cls("partners", "is-dark")}>
                    {form.partners.visible ? (
                        <>
                            {head(form.partners.title, form.partners.intro)}
                            <div className="po-pv-logos">{partners.map((p) => <span key={p.id}>{p.title}</span>)}</div>
                            <h3 className="po-pv-sub"><Hl text={form.partners.applyCta.title} /></h3>
                            <div className="po-pv-btns" style={{ marginTop: 14 }}><span>{form.partners.applyCta.label}</span></div>
                            <h3 className="po-pv-sub">{form.partners.subscribe.title}</h3>
                            <p className="po-pv-text">{form.partners.subscribe.text}</p>
                            <div className="po-pv-form"><span>{form.partners.subscribe.placeholder}</span><b>{form.partners.subscribe.buttonLabel}</b></div>
                        </>
                    ) : hidden("Partners preview and CTA buttons")}
                </section>
            </div>
        </div>
    );
}

function LivePanel({ form, catalog, media, activeKey, liveUrl, reloadKey, onReload, onClose, status }) {
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
                    <DraftPreview form={form} catalog={catalog} media={media} activeKey={activeKey} />
                ) : (
                    <iframe key={reloadKey} className="po-iframe" src={liveUrl} title="Live Home page" loading="lazy" />
                )}
            </div>
        </aside>
    );
}

/* ====================================================================
   PAGE
==================================================================== */

export default function AdminPSBHome() {
    const { props, url } = usePage();
    const live = Boolean(props.home?.content);
    const liveUrl = props.home?.liveUrl || props.home?.previewUrl || DEFAULT_LIVE_URL;

    const seed = useRef(
        live
            ? { content: props.home.content, meta: props.home.meta, catalog: props.home.catalog, history: props.home.history || [] }
            : { content: sampleContent, meta: sampleMeta, catalog: sampleCatalog, history: sampleHistory }
    ).current;

    const [saved, setSaved] = useState(() => clone(seed.content));
    const [form, setForm] = useState(() => clone(seed.content));
    const [meta, setMeta] = useState(seed.meta);
    const [localHistory, setLocalHistory] = useState(seed.history);
    const [mediaList, setMediaList] = useState(seed.catalog.media);

    const catalog = live ? { ...props.home.catalog, media: mediaList } : { ...seed.catalog, media: mediaList };
    const history = live ? props.home.history || [] : localHistory;

    const [tab, setTab] = useState("content");
    const [active, setActive] = useState(() => {
        const wanted = props.section || (SECTIONS.find((s) => (url || "").includes(`/home/${s.route}`))?.route);
        const i = SECTIONS.findIndex((s) => s.route === wanted);
        return i >= 0 ? i : 0;
    });
    const [showPreview, setShowPreview] = useState(true);
    const [reloadKey, setReloadKey] = useState(0);
    const [submitted, setSubmitted] = useState(false);
    const [busy, setBusy] = useState(false);
    const [dialog, setDialog] = useState(null); // { type: publish | schedule | unpublish | delete, ... }
    const [picker, setPicker] = useState(null);
    const [menu, setMenu] = useState(false);
    const [toast, setToast] = useState(null);
    const [scheduleAt, setScheduleAt] = useState("");
    const busyRef = useRef(false);
    const menuRef = useRef(null);

    /* live mode: follow what Laravel sends back after each save */
    useEffect(() => { if (live) setMeta(props.home.meta); }, [live, props.home?.meta]);

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

    const addHistory = (action, label, changes = []) =>
        setLocalHistory((h) => [{ id: Date.now(), user: "You", action, label, at: new Date().toISOString(), changes }, ...h]);
    const diffs = () => changedLabels.map((l) => ({ field: l, from: "Previous version", to: "Updated" }));
    const finishBusy = () => { setBusy(false); busyRef.current = false; };

    const jumpToFirstError = () => {
        const first = Object.keys(allErrors)[0];
        if (!first) return;
        const key = sectionOfKey(first);
        if (key === "seo") setTab("seo");
        else { setTab("content"); setActive(SECTIONS.findIndex((s) => s.key === key)); }
        setTimeout(() => document.querySelector(".po-editor .po-field.has-error")?.scrollIntoView({ behavior: "smooth", block: "center" }), 80);
    };

    /* ---- actions ---- */
    const saveDraft = () => {
        if (!dirty || busy) return;
        setBusy(true); busyRef.current = true;
        const done = () => {
            setSaved(clone(form));
            setMeta((m) => ({ ...m, hasUnpublishedChanges: m.status === "published" ? true : m.hasUnpublishedChanges, updatedBy: "You", updatedAt: new Date().toISOString() }));
            if (!live) addHistory("UPDATE", changedLabels.join(", ") || "Home Page", diffs());
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
            if (!live) addHistory(type === "unpublish" ? "UNPUBLISH" : "PUBLISH", "Home Page", type === "unpublish" ? [] : diffs());
            setDialog(null);
            setSubmitted(false);
            setReloadKey((k) => k + 1);
            setToast({ tone: "ok", text: type === "publish" ? "Published. Visitors now see these changes." : type === "schedule" ? `Scheduled for ${formatDate(at)}.` : "Unpublished. The Home page is no longer public." });
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
        setToast({ tone: "ok", text: `“${dialog.what}” moved to Trash. It leaves the Home page when you publish.` });
    };

    const uploadMedia = (file) => {
        const isVideo = file.type.startsWith("video");
        const local = { id: Date.now(), name: file.name, type: isVideo ? "video" : "image", alt: "", size: `${(file.size / 1048576).toFixed(1)} MB`, url: isVideo ? null : URL.createObjectURL(file) };
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

    const ctx = { form, edit, errors, catalog, media: catalog.media, askDelete, pickMedia };
    const Editor = [BannerEditor, IntroEditor, ParticipantsEditor, ProgrammesEditor, NewsEventsEditor, PartnersEditor][active];

    const statusTone = meta.status === "published" ? "ok" : meta.status === "scheduled" ? "warn" : "off";
    const statusText = meta.status === "published" ? "Published" : meta.status === "scheduled" ? `Scheduled · ${formatDate(meta.scheduledAt)}` : "Draft";

    return (
        <Ctx.Provider value={ctx}>
            <div className="po psb-home">
                <div className="po-heading">
                    <div>
                        <h1>Home Page</h1>
                        <p>Create, update and remove everything visitors see on the Perlis Airspace Sandbox home page.</p>
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
                    <p className="po-note"><Icon name="alert" size={16} /><span>Sample data. Every control works, but nothing is stored until your controller sends the <b>home</b> prop.</span></p>
                )}

                <div className="po-tabs" role="tablist" aria-label="Home page editor">
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
                        <nav className="po-sections" aria-label="Home page sections">
                            {SECTIONS.map((s, i) => {
                                const errs = errorCountFor(s.key);
                                return (
                                    <button key={s.key} type="button" className={`po-section-pill ${active === i ? "is-active" : ""}`} aria-current={active === i ? "true" : undefined} onClick={() => setActive(i)}>
                                        <span className="po-section-no">{i + 1}</span>
                                        <span className="po-section-text"><strong>{s.label}</strong><small>{form[s.key].visible ? s.hint : "Hidden from page"}</small></span>
                                        {errs > 0 ? <span className="po-badge-error" title={`${errs} to fix`}>{errs}</span> : changedKeys.includes(s.key) ? <span className="po-dot" title="Edited" /> : null}
                                    </button>
                                );
                            })}
                        </nav>

                        <div className={`po-split ${showPreview ? "has-preview" : ""}`}>
                            <div className="po-editor"><Editor /></div>
                            {showPreview && (
                                <LivePanel form={form} catalog={catalog} media={catalog.media} activeKey={activeKey} liveUrl={liveUrl} reloadKey={reloadKey} onReload={() => setReloadKey((k) => k + 1)} onClose={() => setShowPreview(false)} status={meta.status} />
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
                            <p>It moves to Content Trash, where only the Super Admin can restore or purge it. It disappears from the Home page when you publish.</p>
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
                            <h2 id="po-act-title">{dialog.type === "publish" ? "Publish the Home page?" : dialog.type === "schedule" ? "Schedule publication" : "Unpublish the Home page?"}</h2>
                            {dialog.type === "unpublish" ? (
                                <p>Visitors will no longer see the Home page until you publish it again. Nothing is deleted.</p>
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

                {picker && <MediaPicker state={picker} media={catalog.media} onClose={() => setPicker(null)} onUpload={uploadMedia} />}

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

/* Wrap the page with your PSB shell here if your app does not already do it:
   import NavigationBar from "../../Components/Admin-Components/PSB/NavigationBar";
   AdminPSBHome.layout = (page) => <NavigationBar>{page}</NavigationBar>;                */

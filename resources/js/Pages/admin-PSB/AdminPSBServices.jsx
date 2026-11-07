import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { router, usePage } from "@inertiajs/react";
import "../../../css/admin-PSB-css/admin-services.css";

/* ====================================================================
   PSB ADMIN → SERVICES EDITOR                    /admin/psb/services

   Site map (PSB workspace → "Services"):  10 service offerings (list, detail, order)
   Data: psb_services (icon_media_id, title, slug, summary, description, sort_order, status)
         pages / page_sections for the heading and button, media_assets for the icon.
   Common screens from the document: list with search / filter by status / sort,
   create / edit form, draft + preview + publish, schedule, reorder (drag),
   delete to Trash, History tab (audit_logs). Files always come from media_assets.

   LIVE PREVIEW: the panel on the right has two views
     • Draft preview  - the public page built from what is on screen (unsaved edits too).
                        Click any card to edit that service.
     • Live site      - the real public page (/services) in a frame; reloads after publishing

   SAMPLE DATA: the page works today (changes stay on screen only). Return an Inertia prop
   named `services` and it switches to LIVE mode:

   Route::get('/admin/psb/services', fn () =>
       Inertia::render('admin-PSB/AdminPSBServices')
   );

   Inertia::render('admin-PSB/AdminPSBServices', [
       'services' => [
           'content' => [...],   // same shape as `sampleContent` below
           'meta'    => [...],   // status, publishedAt, scheduledAt, hasUnpublishedChanges, updatedBy, updatedAt
           'catalog' => ['media' => []],   // media_assets (images)
           'history' => [...],   // audit_logs rows for these records
           'liveUrl' => '/services',       // optional, public page address
       ],
   ]);

   LIVE mode requests are listed in ENDPOINTS. The controller must write audit_logs.
==================================================================== */

const BASE = "/admin/psb"; // keep in sync with psbRoutes.js
const ENDPOINTS = {
    save: `${BASE}/services`, // PUT   { content }            save as draft
    publish: `${BASE}/services/publish`, // POST  { content }            save + publish now
    schedule: `${BASE}/services/schedule`, // POST  { content, at }        save + publish later
    unpublish: `${BASE}/services/unpublish`, // POST
    upload: `${BASE}/media-library/upload`, // POST  multipart { file }
};
const DEFAULT_LIVE_URL = "/services";

/* the public Services page is designed for ten offerings */
const LIMIT = 10;

const STATUS = [
    { value: "published", label: "Published", tone: "ok" },
    { value: "draft", label: "Draft", tone: "off" },
];
const STATUS_BY = Object.fromEntries(STATUS.map((s) => [s.value, s]));

const MIN = 60 * 1000;
const NOW = Date.now();
const minsAgo = (m) => new Date(NOW - m * MIN).toISOString();
let counter = 0;
const uid = () => `n${Date.now().toString(36)}${(counter += 1)}`;

/* ------------------------------ sample data ------------------------------ */

const svc = (id, title, summary, description, mediaId) => ({ id, title, slug: slugifyStatic(title), slugAuto: true, status: "published", summary, description, mediaId });
function slugifyStatic(t) { return t.toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80); }

const sampleContent = {
    page: {
        visible: true,
        heading: "Ten ways we *support your test.*",
        intro: "From the first application to the final report, the programme team supports every activity in the sandbox.",
        ctaLabel: "Apply to Participate",
        ctaUrl: "/apply-to-participate",
    },
    items: [
        svc("v1", "Application and regulatory facilitation", "Guidance through applications, approvals and engagement with the relevant authorities.", "We help you prepare your application, understand what the regulators expect and stay in step with every approval.\nThe programme team coordinates with the relevant authorities so your activity is cleared before it flies.", 21),
        svc("v2", "Test planning and operational support", "Help designing test plans, flight profiles and operating procedures.", "Work with our team to turn an idea into a safe, measurable test: objectives, flight profiles, roles and procedures.", 22),
        svc("v3", "Infrastructure and site support", "Access to test areas, landing areas, hangars and ground support.", "Use the mock-up aerodrome, test areas, hangars and ground support equipment at the sandbox site.", 23),
        svc("v4", "System integration support", "Support integrating aircraft, payloads, communications and traffic management systems.", "Integrate and validate the systems that make safe low-altitude operations possible, from payloads to unmanned traffic management.", 24),
        svc("v5", "Safety and risk management support", "Risk assessment, safety cases and safety oversight for every activity.", "Every activity is reviewed for risk. We help you build the safety case and keep safety oversight in place from briefing to landing.", 25),
        svc("v6", "Testing execution and monitoring", "Coordinated execution of approved tests with live monitoring.", "Approved activities are scheduled and coordinated. The team monitors each test in real time and records what happened.", 26),
        svc("v7", "Data collection and reporting support", "Capture, analysis and reporting of flight and operational data.", "Receive clean flight and operational data, with reports you can use for research, policy and certification evidence.", 27),
        svc("v8", "Industry collaboration and partner matching", "Introductions to partners, agencies and researchers for joint trials.", "We connect you with agencies, researchers and industry partners looking for the same kind of trial.", 28),
        svc("v9", "Training and capability development", "Training for pilots, operators and teams working in the sandbox.", "Build the skills your team needs, from remote pilot training to operating procedures in controlled airspace.", 29),
        svc("v10", "Demonstration and showcase support", "Support for public demonstrations, events and showcases.", "Show your results to regulators, investors and the public with planning and logistics support for demonstrations.", 30),
    ],
    seo: {
        title: "Services | Perlis Airspace Sandbox",
        description: "Ten services that support testing in the Perlis Airspace Sandbox: facilitation, planning, infrastructure, integration, safety, monitoring, data, partners, training and showcases.",
        mediaId: 2,
    },
};

const sampleCatalog = {
    media: [
        { id: 2, name: "site-aerial.jpg", type: "image", alt: "Aerial view of the Sungai Batu Pahat site", size: "2.1 MB" },
        { id: 21, name: "icon-regulatory.svg", type: "image", alt: "Regulatory facilitation icon", size: "4 KB" },
        { id: 22, name: "icon-planning.svg", type: "image", alt: "Test planning icon", size: "4 KB" },
        { id: 23, name: "icon-infrastructure.svg", type: "image", alt: "Infrastructure icon", size: "5 KB" },
        { id: 24, name: "icon-integration.svg", type: "image", alt: "System integration icon", size: "4 KB" },
        { id: 25, name: "icon-safety.svg", type: "image", alt: "Safety icon", size: "4 KB" },
        { id: 26, name: "icon-monitoring.svg", type: "image", alt: "Monitoring icon", size: "4 KB" },
        { id: 27, name: "icon-data.svg", type: "image", alt: "Data icon", size: "4 KB" },
        { id: 28, name: "icon-partners.svg", type: "image", alt: "Partners icon", size: "5 KB" },
        { id: 29, name: "icon-training.svg", type: "image", alt: "Training icon", size: "4 KB" },
        { id: 30, name: "icon-showcase.svg", type: "image", alt: "", size: "4 KB" },
    ],
};

const sampleMeta = {
    status: "published",
    publishedAt: minsAgo(60 * 40),
    scheduledAt: null,
    hasUnpublishedChanges: false,
    updatedBy: "Aiman Hakim",
    updatedAt: minsAgo(60 * 40),
};

const sampleHistory = [
    { id: 5, user: "Aiman Hakim", action: "PUBLISH", label: "Services page", at: minsAgo(60 * 40), changes: [{ field: "Services", from: "9 published", to: "10 published" }] },
    { id: 4, user: "Aiman Hakim", action: "CREATE", label: "Service: Demonstration and showcase support", at: minsAgo(60 * 41), changes: [{ field: "Status", from: "(new)", to: "Published" }] },
    { id: 3, user: "Farid Rahman", action: "UPDATE", label: "Service: Safety and risk management support", at: minsAgo(60 * 70), changes: [{ field: "Summary", from: "Safety support.", to: "Risk assessment, safety cases and safety oversight for every activity." }] },
    { id: 2, user: "Farid Rahman", action: "DELETE", label: "Service: Marketing support", at: minsAgo(60 * 75), changes: [{ field: "Moved to Trash", from: "Marketing support", to: "(deleted)" }] },
    { id: 1, user: "Super Administrator", action: "CREATE", label: "Services page", at: minsAgo(60 * 24 * 12), changes: [] },
];

/* ------------------------------ validation ------------------------------ */

function serviceErrors(s, all, prefix) {
    const out = {};
    const k = (n) => `${prefix}${n}`;
    const need = (n, value, label, max) => {
        const v = (value ?? "").toString().trim();
        if (!v) out[k(n)] = `Enter ${label}.`;
        else if (max && v.length > max) out[k(n)] = `Use ${max} characters or fewer.`;
    };
    need("title", s.title, "a title", 100);
    if (!(s.slug || "").trim()) out[k("slug")] = "Enter a page address.";
    else if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(s.slug)) out[k("slug")] = "Use lowercase letters, numbers and single hyphens only.";
    else if (all.some((x) => x.id !== s.id && x.slug === s.slug)) out[k("slug")] = "Another service already uses this address.";
    need("summary", s.summary, "a summary", 200);
    if ((s.description || "").length > 2000) out[k("description")] = "Use 2000 characters or fewer.";
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

    need("page.heading", f.page.heading, "a heading", 80);
    maxLen("page.intro", f.page.intro, 240);
    const label = (f.page.ctaLabel || "").trim();
    const link = (f.page.ctaUrl || "").trim();
    if (label || link) {
        if (!label) e["page.ctaLabel"] = "Enter button text, or clear the link to remove the button.";
        else if (label.length > 30) e["page.ctaLabel"] = "Use 30 characters or fewer.";
        if (!link) e["page.ctaUrl"] = "Enter a button link, or clear the text to remove the button.";
        else if (!isLink(link)) e["page.ctaUrl"] = "Use a full address (https://...) or a path starting with /";
    }

    if (!f.items.length) e["items"] = "Add at least one service.";
    else if (!f.items.some((s) => s.status === "published")) e["items"] = "Publish at least one service, or hide the whole page.";
    if (f.items.length > LIMIT) e["items"] = `The page shows up to ${LIMIT} services.`;
    f.items.forEach((s) => Object.assign(e, serviceErrors(s, f.items, `items.${s.id}.`)));

    need("seo.title", f.seo.title, "a page title", 70);
    maxLen("seo.description", f.seo.description, 160);
    return e;
}


/* ====================================================================
   SHARED PIECES (same as the Opportunities editor)
==================================================================== */

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

const clone = (v) => JSON.parse(JSON.stringify(v));

const sameJson = (a, b) => JSON.stringify(a) === JSON.stringify(b);

const isLink = (v) => /^(https?:\/\/|\/|#|mailto:)/i.test((v || "").trim());

const slugify = (t = "") => t.toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);

const initialsOf = (name) => (name || "?").split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase();

const Hl = ({ text = "" }) => text.split("*").map((x, i) => (i % 2 ? <em key={i}>{x}</em> : x));

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

const sectionOfKey = (key) => key.split(".")[0];

const Ctx = createContext(null);

const useEd = () => useContext(Ctx);

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

function Toggle({ checked, onChange, label }) {
    return (
        <button type="button" role="switch" aria-checked={checked} aria-label={label} className={`ps-toggle ${checked ? "is-on" : ""}`} onClick={() => onChange(!checked)}>
            <span />
        </button>
    );
}

function Field({ label, hint, value, onChange, errorKey, max, rows, placeholder, className = "", type = "text", prefix, suffix }) {
    const { errors } = useEd();
    const error = errors[errorKey];
    const id = `ps-${errorKey}`;
    const length = (value || "").length;

    return (
        <div className={`ps-field ${error ? "has-error" : ""} ${className}`}>
            <div className="ps-field-top">
                <label htmlFor={id}>{label}</label>
                {max && <span className={`ps-count ${length > max ? "is-over" : ""}`}>{length}/{max}</span>}
            </div>
            {rows ? (
                <textarea id={id} className="ps-input ps-textarea" rows={rows} value={value || ""} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
            ) : prefix || suffix ? (
                <div className="ps-input-wrap">
                    {prefix && <span className="ps-affix">{prefix}</span>}
                    <input id={id} type={type} className="ps-input" value={value || ""} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
                    {suffix}
                </div>
            ) : (
                <input id={id} type={type} className="ps-input" value={value || ""} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
            )}
            {hint && !error && <p className="ps-hint">{hint}</p>}
            {error && <p className="ps-error" role="alert"><Icon name="alert" size={13} /> {error}</p>}
        </div>
    );
}

function SelectField({ label, value, onChange, options, errorKey, hint, placeholder = "None" }) {
    const { errors } = useEd();
    const error = errors[errorKey];
    const id = `ps-${errorKey}`;
    return (
        <div className={`ps-field ${error ? "has-error" : ""}`}>
            <div className="ps-field-top"><label htmlFor={id}>{label}</label></div>
            <select id={id} className="ps-input ps-select" value={value ?? ""} onChange={(e) => onChange(e.target.value || null)}>
                <option value="">{placeholder}</option>
                {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            {hint && !error && <p className="ps-hint">{hint}</p>}
            {error && <p className="ps-error" role="alert"><Icon name="alert" size={13} /> {error}</p>}
        </div>
    );
}

function ErrorLine({ errorKey }) {
    const { errors } = useEd();
    return errors[errorKey] ? <p className="ps-error" role="alert"><Icon name="alert" size={13} /> {errors[errorKey]}</p> : null;
}

function BlockHead({ title, text, aside }) {
    return (
        <div className="ps-block-head">
            <div>
                <h3>{title}</h3>
                {text && <p>{text}</p>}
            </div>
            {aside}
        </div>
    );
}

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

function MediaField({ label, hint, mediaId, onChange, accept = "image", errorKey }) {
    const { media, pickMedia } = useEd();
    const asset = media.find((m) => m.id === mediaId);
    const needsAlt = asset && asset.type === "image" && !asset.alt;
    const kind = asset?.type === "document" ? "Document" : asset?.type === "video" ? "Video" : "Image";

    return (
        <div className="ps-field">
            <div className="ps-field-top"><span className="ps-label">{label}</span></div>
            <div className="ps-media">
                <span className="ps-media-thumb">
                    {asset ? <img src={thumbOf(asset)} alt="" /> : <Icon name={accept === "document" ? "doc" : "image"} size={22} />}
                </span>
                <div className="ps-media-text">
                    {asset ? (
                        <>
                            <strong>{asset.name}</strong>
                            <small>{kind} · {asset.size}</small>
                            {needsAlt && <small className="ps-media-warn"><Icon name="alert" size={12} /> No alt text. Add it in the Media Library.</small>}
                        </>
                    ) : (
                        <>
                            <strong>No file chosen</strong>
                            <small>Pick a file from the Media Library</small>
                        </>
                    )}
                </div>
                <div className="ps-media-actions">
                    <button type="button" className="ps-btn-small" onClick={() => pickMedia({ accept, selected: mediaId, onPick: onChange })}>{asset ? "Change" : "Choose"}</button>
                    {asset && <button type="button" className="ps-btn-small is-quiet" onClick={() => onChange(null)}>Remove</button>}
                </div>
            </div>
            {hint && <p className="ps-hint">{hint}</p>}
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
        <div className="ps-overlay is-top" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
            <div className="ps-dialog ps-picker" role="dialog" aria-modal="true" aria-labelledby="ps-picker-title">
                <header className="ps-dialog-head">
                    <div>
                        <h2 id="ps-picker-title">Media Library</h2>
                        <p>Choose a file. Files are managed in the Media Library.</p>
                    </div>
                    <button type="button" className="ps-iconbtn" aria-label="Close" onClick={onClose}><Icon name="close" size={18} /></button>
                </header>

                <div className="ps-picker-tools">
                    <label className="ps-search">
                        <Icon name="search" size={16} />
                        <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by file name or alt text" aria-label="Search media" />
                    </label>
                    <select className="ps-input ps-select" value={type} onChange={(e) => setType(e.target.value)} aria-label="File type">
                        <option value="all">All files</option>
                        <option value="image">Images</option>
                        <option value="document">Documents</option>
                        <option value="video">Video</option>
                    </select>
                    <button type="button" className="ps-btn-small" onClick={() => fileRef.current?.click()}><Icon name="upload" size={14} /> Upload</button>
                    <input ref={fileRef} type="file" hidden accept="image/*,video/*,.pdf,.doc,.docx" onChange={(e) => { const f = e.target.files?.[0]; if (f) onUpload(f); e.target.value = ""; }} />
                </div>

                <div className="ps-media-grid">
                    {list.length === 0 && <p className="ps-empty">No files match. Try another search or upload a new file.</p>}
                    {list.map((m) => (
                        <button key={m.id} type="button" className={`ps-media-card ${state.selected === m.id ? "is-selected" : ""}`} onClick={() => { state.onPick(m.id); onClose(); }}>
                            <img src={thumbOf(m)} alt="" />
                            <span className="ps-media-card-text">
                                <strong>{m.name}</strong>
                                <small>{m.type === "document" ? "Document" : m.type === "video" ? "Video" : "Image"} · {m.size}</small>
                            </span>
                            {state.selected === m.id && <span className="ps-media-check"><Icon name="check" size={14} /></span>}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

function SeoPanel({ meta }) {
    const { form, edit } = useEd();
    const s = form.seo;
    const set = (patch) => edit((d) => Object.assign(d.seo, patch));

    return (
        <section className="ps-card">
            <header className="ps-card-head">
                <div>
                    <span className="ps-card-no">Page settings</span>
                    <h2>Search and sharing</h2>
                    <p>How the Services page looks in Google results and when someone shares the link.</p>
                </div>
            </header>

            <div className="ps-block">
                <Field label="Page title" errorKey="seo.title" value={s.title} max={70} onChange={(v) => set({ title: v })} hint="Shown in the browser tab and search results." />
                <Field label="Search description" errorKey="seo.description" value={s.description} max={160} rows={3} onChange={(v) => set({ description: v })} />
                <MediaField label="Share image" accept="image" mediaId={s.mediaId} onChange={(id) => set({ mediaId: id })} hint="Shown when the link is shared on social media or chat." />
            </div>

            <div className="ps-block">
                <BlockHead title="Search result preview" />
                <div className="ps-serp">
                    <span>perlis-sandbox.my › services</span>
                    <strong>{s.title || "Page title"}</strong>
                    <p>{s.description || "Search description"}</p>
                </div>
            </div>

            <div className="ps-block">
                <BlockHead title="Publishing" />
                <dl className="ps-facts">
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
        <section className="ps-card">
            <header className="ps-card-head">
                <div>
                    <span className="ps-card-no">History</span>
                    <h2>Who changed the Services page</h2>
                    <p>Every add, update, publish and delete is recorded. Entries cannot be edited.</p>
                </div>
            </header>

            {history.length === 0 ? (
                <p className="ps-empty">No history yet.</p>
            ) : (
                <ul className="ps-history">
                    {history.map((h) => {
                        const isOpen = open === h.id;
                        return (
                            <li key={h.id}>
                                <button type="button" className="ps-hist-row" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : h.id)} disabled={!h.changes?.length}>
                                    <span className="ps-avatar">{initialsOf(h.user)}</span>
                                    <span className="ps-hist-text">
                                        <strong>{h.user}</strong>
                                        <small>{ACTION_LABEL[h.action] || h.action} <b>{h.label}</b></small>
                                    </span>
                                    <span className={`ps-pill is-${ACTION_PILL[h.action] || "info"}`}>{ACTION_LABEL[h.action] || h.action}</span>
                                    <span className="ps-hist-time" title={formatDate(h.at)}>{timeAgo(h.at)}</span>
                                </button>
                                {isOpen && h.changes?.length > 0 && (
                                    <div className="ps-diff">
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
   EDITOR: page text + service list
==================================================================== */

function ServicesEditor() {
    const { form, edit, errors, media, openService, askDelete } = useEd();
    const items = form.items;
    const [query, setQuery] = useState("");
    const [filter, setFilter] = useState("all");
    const [sort, setSort] = useState("manual");
    const canReorder = sort === "manual" && filter === "all" && !query.trim();
    const full = items.length >= LIMIT;

    const rows = useMemo(() => {
        const q = query.trim().toLowerCase();
        let list = items.filter((s) => (filter === "all" || s.status === filter) && (!q || s.title.toLowerCase().includes(q) || (s.summary || "").toLowerCase().includes(q)));
        if (sort === "title") list = [...list].sort((a, b) => a.title.localeCompare(b.title));
        return list;
    }, [items, query, filter, sort]);

    const drag = useDrag((from, to) => edit((d) => { d.items = moveIn(d.items, from, to); }));
    const counts = STATUS.map((s) => ({ ...s, n: items.filter((x) => x.status === s.value).length }));
    const hasError = (id) => Object.keys(errors).some((k) => k.startsWith(`items.${id}.`));
    const pos = (s) => items.findIndex((x) => x.id === s.id);
    const iconOf = (s) => media.find((m) => m.id === s.mediaId);
    const setPage = (patch) => edit((d) => Object.assign(d.page, patch));

    return (
        <section className="ps-card">
            <header className="ps-card-head">
                <div>
                    <span className="ps-card-no">Services</span>
                    <h2>Service offerings</h2>
                    <p>Ten offerings that explain how the programme supports participants. Changes go live when you publish.</p>
                </div>
                <label className="ps-visible">
                    <span>{form.page.visible ? "Shown on site" : "Hidden from site"}</span>
                    <Toggle checked={form.page.visible} label="Show the Services page" onChange={(v) => setPage({ visible: v })} />
                </label>
            </header>

            <div className="ps-block">
                <BlockHead title="Heading and introduction" text="The text above the list on the public page." />
                <Field label="Heading" errorKey="page.heading" value={form.page.heading} max={80} onChange={(v) => setPage({ heading: v })} hint="Put *asterisks* around the words that should be highlighted in yellow." />
                <Field label="Short introduction" errorKey="page.intro" value={form.page.intro} max={240} rows={2} onChange={(v) => setPage({ intro: v })} />
                <div className="ps-grid-2">
                    <Field label="Button text" errorKey="page.ctaLabel" value={form.page.ctaLabel} max={30} onChange={(v) => setPage({ ctaLabel: v })} hint="Leave both button boxes empty to remove the button." />
                    <Field label="Button link" errorKey="page.ctaUrl" value={form.page.ctaUrl} placeholder="/apply-to-participate" onChange={(v) => setPage({ ctaUrl: v })} />
                </div>
            </div>

            <div className="ps-block">
                <BlockHead
                    title="Services"
                    text="Drag to set the order visitors see. Draft services stay hidden."
                    aside={
                        <div className="ps-head-aside">
                            <span className={`ps-limit ${full ? "is-full" : ""}`}>{items.length} of {LIMIT}</span>
                            <button type="button" className="ps-btn-yellow is-small" disabled={full} title={full ? `The page shows up to ${LIMIT} services` : "Add a service"} onClick={() => openService(null)}><Icon name="plus" size={15} /> Add service</button>
                        </div>
                    }
                />

                <div className="ps-chips" role="group" aria-label="Filter by status">
                    <button type="button" className={filter === "all" ? "is-on" : ""} onClick={() => setFilter("all")}>All <b>{items.length}</b></button>
                    {counts.map((c) => <button key={c.value} type="button" className={filter === c.value ? "is-on" : ""} onClick={() => setFilter(c.value)}>{c.label} <b>{c.n}</b></button>)}
                </div>

                <div className="ps-toolbar">
                    <label className="ps-search">
                        <Icon name="search" size={16} />
                        <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search services" aria-label="Search services" />
                    </label>
                    <select className="ps-input ps-select" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort services">
                        <option value="manual">Page order (drag to change)</option>
                        <option value="title">Title A to Z</option>
                    </select>
                </div>

                {rows.length === 0 ? (
                    <p className="ps-empty">{items.length === 0 ? "No services yet. Add the first one." : "No services match your filters."}</p>
                ) : (
                    <ul className="ps-list">
                        {rows.map((s, i) => {
                            const index = pos(s);
                            const icon = iconOf(s);
                            return (
                                <li key={s.id} className={`ps-item ps-svc ${canReorder && drag.over === i ? "is-over" : ""} ${s.status === "draft" ? "is-draft" : ""}`} {...(canReorder ? drag.rowProps(i) : {})}>
                                    {canReorder ? (
                                        <button type="button" className="ps-handle" aria-label={`Drag ${s.title} to reorder`} title="Drag to reorder" {...drag.handleProps(i)}><Icon name="grip" size={16} /></button>
                                    ) : <span className="ps-handle is-off" aria-hidden="true"><Icon name="grip" size={16} /></span>}
                                    <span className="ps-item-no">{index + 1}</span>
                                    <span className="ps-svc-icon">{icon ? <img src={thumbOf(icon)} alt="" /> : <Icon name="image" size={18} />}</span>
                                    <div className="ps-svc-main">
                                        <strong>{s.title || "Untitled service"}</strong>
                                        <small>{s.summary || "No summary yet"}</small>
                                    </div>
                                    {hasError(s.id) && <span className="ps-badge-error" title="Needs attention">!</span>}
                                    <label className="ps-svc-switch" title={s.status === "published" ? "Shown on the page" : "Hidden from the page"}>
                                        <Toggle checked={s.status === "published"} label={`Show ${s.title} on the page`} onChange={(v) => edit((d) => { d.items.find((x) => x.id === s.id).status = v ? "published" : "draft"; })} />
                                        <span>{s.status === "published" ? "Shown" : "Hidden"}</span>
                                    </label>
                                    <div className="ps-item-tools">
                                        {canReorder && <>
                                            <button type="button" className="ps-iconbtn" aria-label="Move up" title="Move up" disabled={i === 0} onClick={() => edit((d) => { d.items = moveIn(d.items, index, index - 1); })}><Icon name="up" size={15} /></button>
                                            <button type="button" className="ps-iconbtn" aria-label="Move down" title="Move down" disabled={i === rows.length - 1} onClick={() => edit((d) => { d.items = moveIn(d.items, index, index + 1); })}><Icon name="down" size={15} /></button>
                                        </>}
                                        <button type="button" className="ps-iconbtn" aria-label={`Edit ${s.title}`} title="Edit" onClick={() => openService(s)}><Icon name="edit" size={15} /></button>
                                        <button type="button" className="ps-iconbtn is-danger" aria-label={`Delete ${s.title}`} title="Delete (moves to Trash)" onClick={() => askDelete({ what: s.title || "this service", onConfirm: () => edit((d) => { d.items = d.items.filter((x) => x.id !== s.id); }) })}><Icon name="trash" size={15} /></button>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
                {!canReorder && items.length > 1 && <p className="ps-hint">Reordering is available when the list is unfiltered and sorted by page order.</p>}
                <ErrorLine errorKey="items" />
            </div>
        </section>
    );
}

/* the detail form for one service (works on its own copy until "Save service") */
function ServiceDrawer({ state, onClose, onSave }) {
    const { form, ...base } = useEd();
    const [draft, setDraft] = useState(() => clone(state.item));
    const [tried, setTried] = useState(false);
    const [view, setView] = useState("edit");
    const isNew = state.mode === "new";
    const set = (patch) => setDraft((d) => ({ ...d, ...patch }));

    const errs = useMemo(() => {
        const all = isNew ? [...form.items, draft] : form.items.map((x) => (x.id === draft.id ? draft : x));
        return serviceErrors(draft, all, "dr.");
    }, [draft, form.items, isNew]);

    useEffect(() => {
        const onKey = (e) => e.key === "Escape" && onClose();
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [onClose]);

    const shown = tried ? errs : {};
    const scoped = { form, ...base, errors: shown };
    const icon = base.media.find((m) => m.id === draft.mediaId);

    const submit = () => {
        setTried(true);
        if (Object.keys(errs).length) {
            setView("edit");
            setTimeout(() => document.querySelector(".ps-drawer .ps-field.has-error")?.scrollIntoView({ behavior: "smooth", block: "center" }), 60);
            return;
        }
        onSave(draft, isNew);
    };

    return (
        <Ctx.Provider value={scoped}>
            <div className="ps-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
                <aside className="ps-drawer" role="dialog" aria-modal="true" aria-labelledby="ps-drawer-title">
                    <header className="ps-dialog-head">
                        <div>
                            <h2 id="ps-drawer-title">{isNew ? "Add service" : "Edit service"}</h2>
                            <p>Saved to the page when you press Save service. It goes live when you publish.</p>
                        </div>
                        <button type="button" className="ps-iconbtn" aria-label="Close" onClick={onClose}><Icon name="close" size={18} /></button>
                    </header>

                    <div className="ps-drawer-tabs">
                        <div className="ps-seg is-small" role="tablist" aria-label="Service view">
                            <button type="button" role="tab" aria-selected={view === "edit"} className={view === "edit" ? "is-on" : ""} onClick={() => setView("edit")}>Edit</button>
                            <button type="button" role="tab" aria-selected={view === "preview"} className={view === "preview" ? "is-on" : ""} onClick={() => setView("preview")}>Preview</button>
                        </div>
                    </div>

                    <div className="ps-drawer-body">
                        {view === "edit" ? (
                            <>
                                <Field
                                    label="Title"
                                    errorKey="dr.title"
                                    value={draft.title}
                                    max={100}
                                    onChange={(v) => setDraft((d) => ({ ...d, title: v, slug: d.slugAuto !== false ? slugify(v) : d.slug }))}
                                />
                                <Field label="Page address" prefix="/services/" errorKey="dr.slug" value={draft.slug} onChange={(v) => set({ slug: slugify(v), slugAuto: false })} hint="Created from the title." />
                                <SelectField label="Status" errorKey="dr.status" value={draft.status} onChange={(v) => set({ status: v || "draft" })} options={STATUS.map((s) => ({ value: s.value, label: s.label }))} placeholder="Draft" hint="Draft is hidden from visitors." />
                                <Field label="Summary" errorKey="dr.summary" value={draft.summary} max={200} rows={2} onChange={(v) => set({ summary: v })} hint="Shown on the card in the list." />
                                <Field label="Detail text" errorKey="dr.description" value={draft.description} max={2000} rows={7} onChange={(v) => set({ description: v })} hint="Shown on the service’s own page. Press Enter twice for a new paragraph." />
                                <MediaField label="Icon" accept="image" mediaId={draft.mediaId} onChange={(id) => setDraft((d) => ({ ...d, mediaId: id }))} hint="A square SVG or PNG works best." />
                            </>
                        ) : (
                            <div className="ps-detail">
                                <p className="ps-hint">How this service looks on the public site.</p>
                                <article className="ps-pv-service is-static">
                                    <span className="ps-pv-service-top"><b>{draft.status === "published" ? "Live" : "Draft"}</b>{icon && <img src={thumbOf(icon)} alt="" />}</span>
                                    <strong>{draft.title || "Untitled service"}</strong>
                                    <p>{draft.summary || "No summary yet."}</p>
                                </article>
                                <h3 className="ps-detail-title">{draft.title || "Untitled service"}</h3>
                                {(draft.description || "").split("\n").filter(Boolean).map((line, i) => <p className="ps-detail-text" key={i}>{line}</p>)}
                                {!draft.description && <p className="ps-detail-text is-empty">No detail text yet.</p>}
                            </div>
                        )}
                    </div>

                    <footer className="ps-drawer-foot">
                        {tried && Object.keys(errs).length > 0 && <span className="ps-error"><Icon name="alert" size={13} /> Fix {Object.keys(errs).length} field{Object.keys(errs).length === 1 ? "" : "s"} to continue.</span>}
                        <div>
                            <button type="button" className="ps-btn-outline" onClick={onClose}>Cancel</button>
                            <button type="button" className="ps-btn-yellow" onClick={submit}>{isNew ? "Add service" : "Save service"}</button>
                        </div>
                    </footer>
                </aside>
            </div>
        </Ctx.Provider>
    );
}

/* ====================================================================
   LIVE PREVIEW PANEL  (draft preview + the real public page)
==================================================================== */

function DraftPreview({ form, media, onEdit }) {
    const shown = form.items.filter((s) => s.status === "published");
    const hiddenCount = form.items.length - shown.length;

    return (
        <div className="ps-pv-scroll">
            <div className="ps-pv">
                <section className="ps-pv-sec">
                    {form.page.visible ? (
                        <>
                            <header className="ps-pv-head">
                                <h2><Hl text={form.page.heading} /></h2>
                                {form.page.intro && <p>{form.page.intro}</p>}
                            </header>

                            {shown.length === 0 && <p className="ps-pv-none">No published services yet.</p>}
                            <div className="ps-pv-services">
                                {shown.map((s, i) => {
                                    const icon = media.find((m) => m.id === s.mediaId);
                                    return (
                                        <button key={s.id} type="button" className="ps-pv-service" title="Click to edit this service" onClick={() => onEdit(s.id)}>
                                            <span className="ps-pv-service-top"><b>{String(i + 1).padStart(2, "0")}</b>{icon && <img src={thumbOf(icon)} alt="" />}</span>
                                            <strong>{s.title || "Untitled service"}</strong>
                                            <p>{s.summary}</p>
                                        </button>
                                    );
                                })}
                            </div>

                            {form.page.ctaLabel && <div className="ps-pv-btns"><span>{form.page.ctaLabel}</span></div>}
                            {hiddenCount > 0 && <p className="ps-pv-note">{hiddenCount} draft service{hiddenCount === 1 ? " is" : "s are"} hidden from visitors.</p>}
                        </>
                    ) : (
                        <div className="ps-pv-hidden">The Services page is hidden from the site</div>
                    )}
                </section>
            </div>
        </div>
    );
}

function LivePanel({ form, media, liveUrl, reloadKey, onReload, onClose, status, onEdit }) {
    const [view, setView] = useState("draft"); // draft | live
    const [device, setDevice] = useState("desktop");

    return (
        <aside className="ps-preview" aria-label="Live preview">
            <header className="ps-preview-head">
                <div className="ps-seg" role="tablist" aria-label="Preview type">
                    <button type="button" role="tab" aria-selected={view === "draft"} className={view === "draft" ? "is-on" : ""} onClick={() => setView("draft")}>Draft preview</button>
                    <button type="button" role="tab" aria-selected={view === "live"} className={view === "live" ? "is-on" : ""} onClick={() => setView("live")}>Live site</button>
                </div>
                <div className="ps-preview-tools">
                    <div className="ps-seg is-small" role="group" aria-label="Device">
                        <button type="button" className={device === "desktop" ? "is-on" : ""} onClick={() => setDevice("desktop")}>Desktop</button>
                        <button type="button" className={device === "mobile" ? "is-on" : ""} onClick={() => setDevice("mobile")}>Mobile</button>
                    </div>
                    {view === "live" && <button type="button" className="ps-iconbtn" aria-label="Reload live page" title="Reload live page" onClick={onReload}><Icon name="refresh" size={16} /></button>}
                    <a className="ps-iconbtn" href={liveUrl} target="_blank" rel="noreferrer" aria-label="Open live page in a new tab" title="Open live page in a new tab"><Icon name="external" size={16} /></a>
                    <button type="button" className="ps-iconbtn" aria-label="Hide preview" title="Hide preview" onClick={onClose}><Icon name="close" size={16} /></button>
                </div>
            </header>

            <p className="ps-preview-note">
                {view === "draft"
                    ? "Built from what you see on screen, including unsaved edits. Click a card to edit it."
                    : status === "published" ? "The real public page, as visitors see it now. It updates after you publish." : "The real public page. It will not show your changes until you publish."}
            </p>

            <div className={`ps-preview-frame is-${device}`}>
                {view === "draft" ? (
                    <DraftPreview form={form} media={media} onEdit={onEdit} />
                ) : (
                    <iframe key={reloadKey} className="ps-iframe" src={liveUrl} title="Live Services page" loading="lazy" />
                )}
            </div>
        </aside>
    );
}

/* ====================================================================
   PAGE
==================================================================== */

const CHANGE_LABELS = { page: "Page text and button", items: "Service offerings", seo: "Page settings" };

export default function AdminPSBServices() {
    const { props } = usePage();
    const live = Boolean(props.services?.content);
    const liveUrl = props.services?.liveUrl || DEFAULT_LIVE_URL;

    const seed = useRef(
        live
            ? { content: props.services.content, meta: props.services.meta, catalog: props.services.catalog, history: props.services.history || [] }
            : { content: sampleContent, meta: sampleMeta, catalog: sampleCatalog, history: sampleHistory }
    ).current;

    const [saved, setSaved] = useState(() => clone(seed.content));
    const [form, setForm] = useState(() => clone(seed.content));
    const [meta, setMeta] = useState(seed.meta);
    const [localHistory, setLocalHistory] = useState(seed.history);
    const [mediaList, setMediaList] = useState(seed.catalog.media);

    const media = live ? [...mediaList, ...(props.services.catalog?.media || []).filter((m) => !mediaList.some((x) => x.id === m.id))] : mediaList;
    const history = live ? props.services.history || [] : localHistory;

    const [tab, setTab] = useState("content");
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

    useEffect(() => { if (live) setMeta(props.services.meta); }, [live, props.services?.meta]);

    const dirty = useMemo(() => !sameJson(form, saved), [form, saved]);
    const allErrors = useMemo(() => validate(form), [form]);
    const errors = useMemo(() => ({ ...(props.errors || {}), ...(submitted ? allErrors : {}) }), [props.errors, submitted, allErrors]);
    const errorCountFor = (key) => Object.keys(errors).filter((k) => sectionOfKey(k) === key).length;
    const totalErrors = Object.keys(allErrors).length;

    const changedKeys = useMemo(() => ["page", "items", "seo"].filter((k) => !sameJson(form[k], saved[k])), [form, saved]);
    const changedLabels = changedKeys.map((k) => CHANGE_LABELS[k]);
    const unpublished = dirty || meta.hasUnpublishedChanges;
    const publishedCount = form.items.filter((s) => s.status === "published").length;

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
    const openService = (item) => setDrawer(item ? { mode: "edit", item } : { mode: "new", item: { id: uid(), title: "", slug: "", slugAuto: true, status: "draft", summary: "", description: "", mediaId: null } });
    const editById = (id) => { const item = form.items.find((s) => s.id === id); if (item) setDrawer({ mode: "edit", item }); };

    const addHistory = (action, label, changes = []) =>
        setLocalHistory((h) => [{ id: Date.now(), user: "You", action, label, at: new Date().toISOString(), changes }, ...h]);
    const diffs = () => changedLabels.map((l) => ({ field: l, from: "Previous version", to: "Updated" }));
    const finishBusy = () => { setBusy(false); busyRef.current = false; };

    const jumpToFirstError = () => {
        const first = Object.keys(allErrors)[0];
        if (!first) return;
        if (sectionOfKey(first) === "seo") { setTab("seo"); return; }
        setTab("content");
        const match = first.match(/^items\.([^.]+)\./);
        if (match) {
            const item = form.items.find((s) => s.id === match[1]);
            if (item) { setDrawer({ mode: "edit", item }); return; }
        }
        setTimeout(() => document.querySelector(".ps-editor .ps-field.has-error, .ps-editor .ps-error")?.scrollIntoView({ behavior: "smooth", block: "center" }), 80);
    };

    const saveService = (item, isNew) => {
        edit((d) => {
            if (isNew) d.items.push(item);
            else d.items = d.items.map((s) => (s.id === item.id ? item : s));
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
            if (!live) addHistory("UPDATE", changedLabels.join(", ") || "Services page", diffs());
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
            if (!live) addHistory(type === "unpublish" ? "UNPUBLISH" : "PUBLISH", "Services page", type === "unpublish" ? [] : diffs());
            setDialog(null);
            setSubmitted(false);
            setReloadKey((k) => k + 1);
            setToast({ tone: "ok", text: type === "publish" ? "Published. Visitors now see these changes." : type === "schedule" ? `Scheduled for ${formatDate(at)}.` : "Unpublished. The Services page is no longer public." });
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
        if (!live) addHistory("DELETE", `Service: ${dialog.what}`, [{ field: "Moved to Trash", from: dialog.what, to: "(deleted)" }]);
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

    const ctx = { form, edit, errors, media, askDelete, pickMedia, openService };

    const statusTone = meta.status === "published" ? "ok" : meta.status === "scheduled" ? "warn" : "off";
    const statusText = meta.status === "published" ? "Published" : meta.status === "scheduled" ? `Scheduled · ${formatDate(meta.scheduledAt)}` : "Draft";
    const contentErrors = errorCountFor("page") + errorCountFor("items");

    return (
        <Ctx.Provider value={ctx}>
            <div className="ps">
                <div className="ps-heading">
                    <div>
                        <h1>Services</h1>
                        <p>Manage the service offerings that explain how the programme supports participants: list, detail and order.</p>
                        <div className="ps-status">
                            <span className={`ps-pill is-${statusTone}`}>{statusText}</span>
                            {unpublished && meta.status !== "draft" && <span className="ps-pill is-warn">{dirty ? "Unsaved changes" : "Changes not published yet"}</span>}
                            <span className="ps-pill is-info">{publishedCount} of {form.items.length} shown</span>
                            {meta.updatedAt && <small>Last edited {timeAgo(meta.updatedAt)} by {meta.updatedBy}</small>}
                        </div>
                    </div>

                    <div className="ps-actions">
                        <button type="button" className={`ps-btn-outline ${showPreview ? "is-on" : ""}`} onClick={() => setShowPreview((v) => !v)} aria-pressed={showPreview}><Icon name="panel" size={16} /> {showPreview ? "Hide preview" : "Show preview"}</button>
                        <button type="button" className="ps-btn-outline" onClick={saveDraft} disabled={!dirty || busy}><Icon name="save" size={16} /> {busy && !dialog ? "Saving..." : "Save draft"}</button>
                        <button type="button" className="ps-btn-yellow" onClick={() => startAction("publish")} disabled={busy || (!unpublished && meta.status === "published")}><Icon name="upload" size={16} /> Publish</button>
                        <div className="ps-more" ref={menuRef}>
                            <button type="button" className="ps-iconbtn is-round" aria-label="More publishing options" aria-haspopup="menu" aria-expanded={menu} onClick={() => setMenu((v) => !v)}><Icon name="more" size={18} /></button>
                            {menu && (
                                <div className="ps-menu" role="menu">
                                    <button type="button" role="menuitem" onClick={() => startAction("schedule")}><Icon name="clock" size={16} /> Schedule publication</button>
                                    <button type="button" role="menuitem" disabled={meta.status === "draft"} onClick={() => startAction("unpublish")}><Icon name="unlink" size={16} /> Unpublish page</button>
                                    <a role="menuitem" href={liveUrl} target="_blank" rel="noreferrer"><Icon name="external" size={16} /> Open live page</a>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {!live && (
                    <p className="ps-note"><Icon name="alert" size={16} /><span>Sample data. Every control works, but nothing is stored until your controller sends the <b>services</b> prop.</span></p>
                )}

                <div className="ps-tabs" role="tablist" aria-label="Services editor">
                    {[["content", "Content"], ["seo", "Page settings"], ["history", "History"]].map(([key, label]) => (
                        <button key={key} type="button" role="tab" aria-selected={tab === key} className={tab === key ? "is-active" : ""} onClick={() => setTab(key)}>
                            {label}
                            {key === "content" && contentErrors > 0 && <span className="ps-badge-error">{contentErrors}</span>}
                            {key === "seo" && errorCountFor("seo") > 0 && <span className="ps-badge-error">{errorCountFor("seo")}</span>}
                            {key === "history" && <span className="ps-badge">{history.length}</span>}
                        </button>
                    ))}
                </div>

                {tab === "content" && (
                    <div className={`ps-split ${showPreview ? "has-preview" : ""}`}>
                        <div className="ps-editor"><ServicesEditor /></div>
                        {showPreview && (
                            <LivePanel form={form} media={media} liveUrl={liveUrl} reloadKey={reloadKey} onReload={() => setReloadKey((k) => k + 1)} onClose={() => setShowPreview(false)} status={meta.status} onEdit={editById} />
                        )}
                    </div>
                )}
                {tab === "seo" && <SeoPanel meta={meta} />}
                {tab === "history" && <HistoryPanel history={history} />}

                {dirty && (
                    <div className="ps-savebar" role="region" aria-label="Unsaved changes">
                        <span className="ps-savebar-text"><i /> {changedLabels.length} part{changedLabels.length === 1 ? "" : "s"} edited, not saved</span>
                        <div>
                            <button type="button" className="ps-btn-ghost" onClick={() => { setForm(clone(saved)); setSubmitted(false); setToast({ tone: "info", text: "Changes discarded." }); }} disabled={busy}>Discard</button>
                            <button type="button" className="ps-btn-yellow" onClick={saveDraft} disabled={busy}>{busy ? "Saving..." : "Save draft"}</button>
                        </div>
                    </div>
                )}

                {/* dialogs */}
                {dialog?.type === "delete" && (
                    <div className="ps-overlay" onMouseDown={(e) => e.target === e.currentTarget && setDialog(null)}>
                        <div className="ps-dialog ps-small" role="alertdialog" aria-modal="true" aria-labelledby="ps-del-title">
                            <span className="ps-dialog-icon is-danger"><Icon name="trash" size={22} /></span>
                            <h2 id="ps-del-title">Delete “{dialog.what}”?</h2>
                            <p>It moves to Content Trash, where only the Super Admin can restore or purge it. It disappears from the page when you publish.</p>
                            <div className="ps-dialog-actions">
                                <button type="button" className="ps-btn-outline" onClick={() => setDialog(null)} autoFocus>Keep it</button>
                                <button type="button" className="ps-btn-danger" onClick={confirmDelete}><Icon name="trash" size={15} /> Move to Trash</button>
                            </div>
                        </div>
                    </div>
                )}

                {["publish", "schedule", "unpublish"].includes(dialog?.type) && (
                    <div className="ps-overlay" onMouseDown={(e) => e.target === e.currentTarget && !busy && setDialog(null)}>
                        <div className="ps-dialog ps-small" role="alertdialog" aria-modal="true" aria-labelledby="ps-act-title">
                            <span className={`ps-dialog-icon ${dialog.type === "unpublish" ? "is-danger" : ""}`}><Icon name={dialog.type === "schedule" ? "clock" : dialog.type === "unpublish" ? "unlink" : "upload"} size={22} /></span>
                            <h2 id="ps-act-title">{dialog.type === "publish" ? "Publish the Services page?" : dialog.type === "schedule" ? "Schedule publication" : "Unpublish the Services page?"}</h2>
                            {dialog.type === "unpublish" ? (
                                <p>Visitors will no longer see the Services page until you publish it again. Nothing is deleted.</p>
                            ) : (
                                <>
                                    <p>{dialog.type === "publish" ? "Visitors will see your changes straight away." : "Your changes go live automatically at the time you choose."}</p>
                                    {changedLabels.length > 0 ? (
                                        <ul className="ps-dialog-list">{changedLabels.map((l) => <li key={l}><Icon name="check" size={14} /> {l}</li>)}</ul>
                                    ) : (
                                        <p className="ps-hint">No new edits. This publishes the last saved draft.</p>
                                    )}
                                </>
                            )}
                            {dialog.type === "schedule" && (
                                <label className="ps-field">
                                    <span className="ps-field-top"><span className="ps-label">Publish on</span></span>
                                    <input type="datetime-local" className="ps-input" value={scheduleAt} min={new Date(Date.now() - new Date().getTimezoneOffset() * MIN).toISOString().slice(0, 16)} onChange={(e) => setScheduleAt(e.target.value)} />
                                </label>
                            )}
                            <div className="ps-dialog-actions">
                                <button type="button" className="ps-btn-outline" onClick={() => setDialog(null)} disabled={busy}>Cancel</button>
                                <button type="button" className={dialog.type === "unpublish" ? "ps-btn-danger" : "ps-btn-yellow"} onClick={confirmAction} disabled={busy}>
                                    {busy ? "Working..." : dialog.type === "publish" ? "Publish now" : dialog.type === "schedule" ? "Schedule" : "Unpublish"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {drawer && <ServiceDrawer key={drawer.item.id} state={drawer} onClose={() => setDrawer(null)} onSave={saveService} />}
                {picker && <MediaPicker state={picker} media={media} onClose={() => setPicker(null)} onUpload={uploadMedia} />}

                {toast && (
                    <div className={`ps-toast is-${toast.tone}`} role="status">
                        <Icon name={toast.tone === "error" ? "alert" : "check"} size={16} />
                        <span>{toast.text}</span>
                        <button type="button" aria-label="Dismiss" onClick={() => setToast(null)}><Icon name="close" size={14} /></button>
                    </div>
                )}
            </div>
        </Ctx.Provider>
    );
}

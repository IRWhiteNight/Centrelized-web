import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { router, usePage } from "@inertiajs/react";
import "../../../css/admin-PSB-css/admin-contact.css";

/* ====================================================================
   PSB ADMIN → CONTACT AND ENQUIRIES        /admin/psb/contact/*

   Site map (PSB workspace → "Contact and Enquiries"), three modules in one screen:
     1  Programme contact persons              → psb_contact_persons (+ media_assets for the photo)
     2  Official email, phone, address, hours  → site_settings (group "contact")
     3  General enquiry inbox                  → contact_enquiries (status workflow, assignment)
   Plus the document's common screens: list with search / filter by status / sort,
   create / edit with draft, preview and publish, drag to reorder, delete to Trash,
   and a History tab (audit_logs). Use cases covered: "Manage Contact Persons and Details",
   "Handle General Enquiries", "Send Notification Email" (address that receives new enquiries).

   SAMPLE DATA: the page works today (changes stay on screen only). Return an Inertia prop
   named `contact` and it switches to LIVE mode:

   Inertia::render('admin/ContactandEnquaries', [
       'contact' => [
           'content'   => ['persons' => [...], 'details' => [...]],   // same shape as `sampleContent`
           'meta'      => [...],         // status, publishedAt, hasUnpublishedChanges, updatedBy, updatedAt
           'catalog'   => ['programmes' => [...], 'admins' => [...], 'media' => [...]],
           'enquiries' => [...],         // contact_enquiries rows for this site, newest first
           'history'   => [...],         // audit_logs rows
           'previewUrl'=> 'https://...', // optional signed preview link
       ],
   ]);

   Map the three sidebar routes (/admin/psb/contact/persons, /details, /enquiries) to this
   same component. LIVE requests are listed in ENDPOINTS. The controller must write audit_logs
   and send the notification email.
==================================================================== */

const BASE = "/admin/psb"; // keep in sync with psbRoutes.js
const ENDPOINTS = {
    save: `${BASE}/contact`, // PUT   { content }               save contact persons + details as draft
    publish: `${BASE}/contact/publish`, // POST  { content }               save + publish
    enquiry: `${BASE}/contact/enquiries`, // PUT   /{id} { status, assignedTo }   |   DELETE /{id}
    bulk: `${BASE}/contact/enquiries/bulk`, // POST  { ids, status } | { ids, delete: true }
    upload: `${BASE}/media-library/upload`, // POST  multipart { file }
};

const TABS = [
    { key: "persons", route: "persons", label: "Programme contact persons" },
    { key: "details", route: "details", label: "Email, phone, address, hours" },
    { key: "enquiries", route: "enquiries", label: "General enquiry inbox" },
    { key: "history", route: "history", label: "History" },
];

const LIMITS = { persons: 12, hours: 7 };
const PAGE_SIZE = 8;

const MIN = 60 * 1000;
const NOW = Date.now();
const minsAgo = (m) => new Date(NOW - m * MIN).toISOString();
let counter = 0;
const uid = () => `n${Date.now().toString(36)}${(counter += 1)}`;

/* ------------------------------ sample data ------------------------------ */

const sampleContent = {
    persons: [
        { id: "c1", name: "Siti Aminah", designation: "Programme Manager, Operations", email: "aminah@example.my", phone: "+60 4-979 0000", programmeId: null, mediaId: null },
        { id: "c2", name: "Muhammad Hafiz", designation: "Technical Lead, BVLOS Trials", email: "hafiz@example.my", phone: "+60 12-345 6789", programmeId: 1, mediaId: null },
        { id: "c3", name: "Farah Nadia", designation: "Partnerships Officer", email: "farah@example.my", phone: "", programmeId: 3, mediaId: null },
    ],
    details: {
        email: "info@perlis-sandbox.my",
        phone: "+60 4-979 0000",
        address: "Perlis Airspace Sandbox, Sungai Batu Pahat, 02600 Arau, Perlis, Malaysia",
        notifyEmail: "enquiries@perlis-sandbox.my",
        hours: [
            { id: "h1", days: "Monday to Thursday", hours: "8.00 am to 5.00 pm" },
            { id: "h2", days: "Friday", hours: "8.00 am to 12.15 pm, 2.45 pm to 5.00 pm" },
            { id: "h3", days: "Saturday and Sunday", hours: "Closed" },
        ],
    },
};

const sampleCatalog = {
    programmes: [
        { id: 1, title: "Open Call: BVLOS Corridor Trials" },
        { id: 2, title: "First Responder Drone Exercise" },
        { id: 3, title: "eVTOL Vertiport Demonstration" },
        { id: 4, title: "UTM Integration Trial" },
    ],
    admins: [
        { id: 3, name: "Aiman Hakim" },
        { id: 5, name: "Farid Rahman" },
        { id: 7, name: "Nurul Izzah" },
    ],
    media: [
        { id: 1, name: "team-briefing.jpg", type: "image", alt: "Programme team at a briefing", size: "1.2 MB" },
        { id: 2, name: "officer-portrait-1.jpg", type: "image", alt: "Portrait of a programme officer", size: "0.4 MB" },
        { id: 3, name: "officer-portrait-2.jpg", type: "image", alt: "Portrait of a technical lead", size: "0.5 MB" },
        { id: 4, name: "site-aerial.jpg", type: "image", alt: "Aerial view of the site", size: "2.1 MB" },
    ],
};

const sampleEnquiries = [
    { id: 101, type: "programme", senderName: "Ahmad Zulkifli", senderEmail: "zulkifli@dronetech.example", organisation: "SkyLink Robotics", subject: "BVLOS corridor trial: eligibility for foreign companies", message: "Hello,\n\nWe are a drone logistics company based in Penang. Can foreign-owned companies apply for the BVLOS Corridor Trials open call? Please also tell us whether a local partner is required and which documents we should prepare.\n\nThank you.", status: "new", assignedTo: null, handledAt: null, createdAt: minsAgo(35) },
    { id: 102, type: "general", senderName: "Dr. Lim Mei Ling", senderEmail: "lim@uni.example", organisation: "Universiti Utara Malaysia", subject: "Student visit to the sandbox site", message: "We would like to bring 30 final-year engineering students for a site visit in January. Is this possible, and what is the process?", status: "new", assignedTo: null, handledAt: null, createdAt: minsAgo(60 * 5) },
    { id: 103, type: "programme", senderName: "Rajesh Kumar", senderEmail: "rajesh@aerofleet.example", organisation: "AeroFleet Sdn Bhd", subject: "eVTOL vertiport demonstration: power and charging", message: "Will charging infrastructure be available for the eVTOL demonstration, and what connector standards are supported?", status: "in_progress", assignedTo: 3, handledAt: null, createdAt: minsAgo(60 * 28) },
    { id: 104, type: "general", senderName: "Nurul Huda", senderEmail: "huda@news.example", organisation: "Utusan Borneo", subject: "Media interview request", message: "We would like to interview a spokesperson about the sandbox for a feature on low-altitude airspace.", status: "in_progress", assignedTo: 5, handledAt: null, createdAt: minsAgo(60 * 30) },
    { id: 105, type: "general", senderName: "Tan Wei Jie", senderEmail: "tan@investor.example", organisation: "Northern Ventures", subject: "Partnership and investment opportunities", message: "Our fund is interested in infrastructure and commercial pilots in the low-altitude economy. Who can we speak to?", status: "replied", assignedTo: 3, handledAt: minsAgo(60 * 50), createdAt: minsAgo(60 * 53) },
    { id: 106, type: "programme", senderName: "Aisyah Rahman", senderEmail: "aisyah@agrodrone.example", organisation: "AgroDrone Malaysia", subject: "Agriculture monitoring trial dates", message: "When will the next agriculture monitoring trial open?", status: "replied", assignedTo: 5, handledAt: minsAgo(60 * 70), createdAt: minsAgo(60 * 76) },
    { id: 107, type: "general", senderName: "Kamal Hassan", senderEmail: "kamal@example.my", organisation: "", subject: "Is the site open to the public?", message: "Can residents visit during demonstration days?", status: "closed", assignedTo: 3, handledAt: minsAgo(60 * 24 * 4), createdAt: minsAgo(60 * 24 * 5) },
    { id: 108, type: "general", senderName: "Sarah Wong", senderEmail: "sarah@hr.example", organisation: "Recruit Plus", subject: "Careers at the sandbox", message: "Are you hiring operators or engineers?", status: "closed", assignedTo: null, handledAt: minsAgo(60 * 24 * 6), createdAt: minsAgo(60 * 24 * 7) },
    { id: 109, type: "programme", senderName: "Ismail Yusof", senderEmail: "ismail@uavtraining.example", organisation: "UAV Training Hub", subject: "First responder exercise: observer places", message: "Can our instructors attend the First Responder Drone Exercise as observers?", status: "new", assignedTo: null, handledAt: null, createdAt: minsAgo(60 * 9) },
    { id: 110, type: "general", senderName: "Chong Mei Yee", senderEmail: "chong@example.my", organisation: "Perlis State Government", subject: "Briefing for state officers", message: "We would like a briefing for state department heads next month.", status: "in_progress", assignedTo: 7, handledAt: null, createdAt: minsAgo(60 * 40) },
].map((e, i) => ({ ...e, reference: `ENQ-2026-${String(101 + i).padStart(4, "0")}` }));

const sampleMeta = {
    status: "published",
    publishedAt: minsAgo(60 * 24 * 3),
    hasUnpublishedChanges: false,
    updatedBy: "Aiman Hakim",
    updatedAt: minsAgo(60 * 24 * 3),
};

const sampleHistory = [
    { id: 5, user: "Aiman Hakim", action: "UPDATE", label: "Enquiry from Tan Wei Jie", at: minsAgo(60 * 50), changes: [{ field: "Status", from: "In progress", to: "Replied" }] },
    { id: 4, user: "Aiman Hakim", action: "PUBLISH", label: "Contact page", at: minsAgo(60 * 24 * 3), changes: [{ field: "Office hours", from: "Monday to Friday", to: "Monday to Thursday, Friday" }] },
    { id: 3, user: "Farid Rahman", action: "UPDATE", label: "Contact person: Muhammad Hafiz", at: minsAgo(60 * 24 * 3 + 40), changes: [{ field: "Programme", from: "General", to: "Open Call: BVLOS Corridor Trials" }] },
    { id: 2, user: "Farid Rahman", action: "DELETE", label: "Contact person: Former officer", at: minsAgo(60 * 24 * 8), changes: [{ field: "Moved to Trash", from: "Former officer", to: "(deleted)" }] },
    { id: 1, user: "Super Administrator", action: "CREATE", label: "Contact page", at: minsAgo(60 * 24 * 20), changes: [] },
];

/* ------------------------------ labels ------------------------------ */

const STATUS = {
    new: { label: "New", tone: "warn" },
    in_progress: { label: "In progress", tone: "dark" },
    replied: { label: "Replied", tone: "ok" },
    closed: { label: "Closed", tone: "off" },
};

const TYPE_LABEL = { general: "General", programme: "Programme", research_collab: "Research collaboration", training_services: "Training and services" };

const SORTS = [
    { value: "newest", label: "Newest first" },
    { value: "oldest", label: "Oldest first" },
    { value: "status", label: "Needs action first" },
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[\d\s\-().]{7,20}$/;

/* the same rules your Laravel request should enforce. Returns { "path": "message" } */
function validate(f) {
    const e = {};
    const need = (key, value, label, max) => {
        const v = (value ?? "").toString().trim();
        if (!v) e[key] = `Enter ${label}.`;
        else if (max && v.length > max) e[key] = `Use ${max} characters or fewer.`;
    };

    f.persons.forEach((p) => {
        need(`persons.${p.id}.name`, p.name, "a name", 150);
        need(`persons.${p.id}.designation`, p.designation, "a designation", 150);
        const email = (p.email || "").trim();
        const phone = (p.phone || "").trim();
        if (!email && !phone) e[`persons.${p.id}.email`] = "Give an email or a phone number.";
        if (email && !EMAIL_RE.test(email)) e[`persons.${p.id}.email`] = "Enter a valid email address.";
        if (phone && !PHONE_RE.test(phone)) e[`persons.${p.id}.phone`] = "Enter a valid phone number, for example +60 4-979 0000.";
    });

    const d = f.details;
    if (!d.email.trim()) e["details.email"] = "Enter the official email address.";
    else if (!EMAIL_RE.test(d.email.trim())) e["details.email"] = "Enter a valid email address.";
    if (!d.phone.trim()) e["details.phone"] = "Enter the official phone number.";
    else if (!PHONE_RE.test(d.phone.trim())) e["details.phone"] = "Enter a valid phone number, for example +60 4-979 0000.";
    need("details.address", d.address, "the address", 300);
    if (!d.notifyEmail.trim()) e["details.notifyEmail"] = "Enter where new enquiries should be emailed.";
    else if (!EMAIL_RE.test(d.notifyEmail.trim())) e["details.notifyEmail"] = "Enter a valid email address.";
    if (!d.hours.length) e["details.hours"] = "Add at least one row of office hours.";
    d.hours.forEach((h) => { need(`details.hours.${h.id}.days`, h.days, "the days", 60); need(`details.hours.${h.id}.hours`, h.hours, "the hours", 80); });
    return e;
}

const sectionOfKey = (key) => (key.startsWith("persons") ? "persons" : "details");
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

/* "Low-altitude *airspace*" → plain text for lists / counters */
const plain = (t = "") => t.replace(/\*/g, "");

/* drawn thumbnail for a media asset (real files would use their own URL) */
function thumbOf(item) {
    if (item?.url) return item.url;
    const label = (item?.name || "media").replace(/[<>&"]/g, "");
    const video = item?.type === "video";
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0b1a28"/><stop offset="1" stop-color="#1d4160"/></linearGradient></defs><rect width="320" height="200" fill="url(#g)"/><path d="M-10 170L120 110 330 70V110L130 150 -10 200Z" fill="#facc15" fill-opacity=".9"/>${video ? '<circle cx="160" cy="84" r="26" fill="#fff" fill-opacity=".92"/><path d="M152 70v28l24-14z" fill="#0b1a28"/>' : '<circle cx="160" cy="84" r="9" fill="#fff"/><path d="M130 54l60 60M190 54l-60 60" stroke="#fff" stroke-width="4" stroke-linecap="round"/>'}<text x="14" y="186" fill="#fff" font-family="Arial,sans-serif" font-size="13" font-weight="700">${label}</text></svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

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
        history: (<><path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 4v5h5M12 8v4l3 2" /></>),
        unlink: (<><path d="M9 15 15 9" /><path d="M11 6l1.5-1.5a4 4 0 0 1 5.7 5.7L16.7 11.7M13 18l-1.5 1.5a4 4 0 0 1-5.7-5.7L7.3 12.3" /><path d="M3 3l18 18" /></>),
        phone: <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" />,
        mail: (<><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m4 7 8 6 8-6" /></>),
        send: <path d="M22 2 11 13M22 2l-7 20-4-9-9-4z" />,
        download: (<><path d="M12 4v11M7 11l5 5 5-5" /><path d="M4 20h16" /></>),
        user: (<><circle cx="12" cy="8" r="4" /><path d="M5 21a7 7 0 0 1 14 0" /></>),
        mappin: (<><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0z" /><circle cx="12" cy="10" r="3" /></>),
        left: <path d="m15 6-6 6 6 6" />,
        right: <path d="m9 6 6 6-6 6" />,
        inbox: (<><path d="M3 13h5l1 3h6l1-3h5" /><path d="M5 5h14l2 8v6H3v-6z" /></>),
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
        <button type="button" role="switch" aria-checked={checked} aria-label={label} className={`ct-toggle ${checked ? "is-on" : ""}`} onClick={() => onChange(!checked)}>
            <span />
        </button>
    );
}

/* One labelled text box or text area with a character counter and an error line */
function Field({ label, hint, value, onChange, errorKey, max, rows, placeholder, className = "", type = "text" }) {
    const { errors } = useEd();
    const error = errors[errorKey];
    const id = `ct-${errorKey}`;
    const length = (value || "").length;

    return (
        <div className={`ct-field ${error ? "has-error" : ""} ${className}`}>
            <div className="ct-field-top">
                <label htmlFor={id}>{label}</label>
                {max && <span className={`ct-count ${length > max ? "is-over" : ""}`}>{length}/{max}</span>}
            </div>
            {rows ? (
                <textarea id={id} className="ct-input ct-textarea" rows={rows} value={value || ""} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
            ) : (
                <input id={id} type={type} className="ct-input" value={value || ""} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
            )}
            {hint && !error && <p className="ct-hint">{hint}</p>}
            {error && <p className="ct-error" role="alert"><Icon name="alert" size={13} /> {error}</p>}
        </div>
    );
}

function ErrorLine({ errorKey }) {
    const { errors } = useEd();
    return errors[errorKey] ? <p className="ct-error" role="alert"><Icon name="alert" size={13} /> {errors[errorKey]}</p> : null;
}

function BlockHead({ title, text, aside }) {
    return (
        <div className="ct-block-head">
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

    if (!items.length) return <p className="ct-empty">{empty}</p>;

    return (
        <ul className="ct-list">
            {items.map((item, i) => (
                <li key={item.id} className={`ct-item ${drag.over === i ? "is-over" : ""}`} {...drag.rowProps(i)}>
                    <button type="button" className="ct-handle" aria-label={`Drag ${nameOf(item)} to reorder`} title="Drag to reorder" {...drag.handleProps(i)}>
                        <Icon name="grip" size={16} />
                    </button>
                    <span className="ct-item-no">{i + 1}</span>
                    <div className="ct-item-body">{children(item, i)}</div>
                    <div className="ct-item-tools">
                        <button type="button" className="ct-iconbtn" aria-label="Move up" title="Move up" disabled={i === 0} onClick={() => onMove(i, i - 1)}><Icon name="up" size={15} /></button>
                        <button type="button" className="ct-iconbtn" aria-label="Move down" title="Move down" disabled={i === items.length - 1} onClick={() => onMove(i, i + 1)}><Icon name="down" size={15} /></button>
                        {removeKind === "delete" ? (
                            <button type="button" className="ct-iconbtn is-danger" aria-label={`Delete ${nameOf(item)}`} title="Delete (moves to Trash)" onClick={() => askDelete({ what: nameOf(item), onConfirm: () => onRemove(i) })}><Icon name="trash" size={15} /></button>
                        ) : (
                            <button type="button" className="ct-iconbtn" aria-label={`Unpin ${nameOf(item)}`} title="Unpin from the Home page" onClick={() => onRemove(i)}><Icon name="unlink" size={15} /></button>
                        )}
                    </div>
                </li>
            ))}
        </ul>
    );
}

function AddButton({ onClick, children, disabled }) {
    return (
        <button type="button" className="ct-add" onClick={onClick} disabled={disabled}>
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
        <div className="ct-field">
            <div className="ct-field-top"><label>{label}</label></div>
            <div className="ct-media">
                <span className="ct-media-thumb">
                    {asset ? <img src={thumbOf(asset)} alt="" /> : <Icon name="image" size={22} />}
                </span>
                <div className="ct-media-text">
                    {asset ? (
                        <>
                            <strong>{asset.name}</strong>
                            <small>{asset.type === "video" ? "Video" : "Image"} · {asset.size}</small>
                            {needsAlt ? (
                                <small className="ct-media-warn"><Icon name="alert" size={12} /> No alt text. Add it in the Media Library.</small>
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
                <div className="ct-media-actions">
                    <button type="button" className="ct-btn-small" onClick={() => pickMedia({ accept, selected: mediaId, onPick: onChange })}>{asset ? "Change" : "Choose"}</button>
                    {asset && <button type="button" className="ct-btn-small is-quiet" onClick={() => onChange(null)}>Remove</button>}
                </div>
            </div>
            {hint && <p className="ct-hint">{hint}</p>}
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
        return !query.trim() || m.name.toLowerCase().includes(query.trim().toLowerCase()) || (m.alt || "").toLowerCase().includes(query.trim().toLowerCase());
    });

    return (
        <div className="ct-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
            <div className="ct-dialog ct-picker" role="dialog" aria-modal="true" aria-labelledby="ct-picker-title">
                <header className="ct-dialog-head">
                    <div>
                        <h2 id="ct-picker-title">Media Library</h2>
                        <p>Choose a file for this section. Files are managed in the Media Library.</p>
                    </div>
                    <button type="button" className="ct-iconbtn" aria-label="Close" onClick={onClose}><Icon name="close" size={18} /></button>
                </header>

                <div className="ct-picker-tools">
                    <label className="ct-search">
                        <Icon name="search" size={16} />
                        <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by file name or alt text" aria-label="Search media" />
                    </label>
                    <select className="ct-input ct-select" value={type} onChange={(e) => setType(e.target.value)} aria-label="File type">
                        <option value="all">All files</option>
                        <option value="image">Images</option>
                        <option value="video">Video</option>
                    </select>
                    <button type="button" className="ct-btn-small" onClick={() => fileRef.current?.click()}><Icon name="upload" size={14} /> Upload</button>
                    <input ref={fileRef} type="file" hidden accept="image/*,video/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) onUpload(f); e.target.value = ""; }} />
                </div>

                <div className="ct-media-grid">
                    {list.length === 0 && <p className="ct-empty">No files match. Try another search or upload a new file.</p>}
                    {list.map((m) => (
                        <button key={m.id} type="button" className={`ct-media-card ${state.selected === m.id ? "is-selected" : ""}`} onClick={() => { state.onPick(m.id); onClose(); }}>
                            <img src={thumbOf(m)} alt="" />
                            <span className="ct-media-card-text">
                                <strong>{m.name}</strong>
                                <small>{m.type === "video" ? "Video" : "Image"} · {m.size}</small>
                            </span>
                            {state.selected === m.id && <span className="ct-media-check"><Icon name="check" size={14} /></span>}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

const ACTION_PILL = { CREATE: "warn", UPDATE: "info", PUBLISH: "dark", UNPUBLISH: "off", DELETE: "danger", RESTORE: "ok" };
const ACTION_LABEL = { CREATE: "Created", UPDATE: "Updated", PUBLISH: "Published", UNPUBLISH: "Unpublished", DELETE: "Deleted", RESTORE: "Restored" };

function HistoryPanel({ history }) {
    const [open, setOpen] = useState(null);

    return (
        <section className="ct-card">
            <header className="ct-card-head">
                <div>
                    <span className="ct-card-no">History</span>
                    <h2>Who changed contact and enquiries</h2>
                    <p>Every add, update, status change, assignment, publish and delete is recorded. Entries cannot be edited.</p>
                </div>
            </header>

            {history.length === 0 ? (
                <p className="ct-empty">No history yet.</p>
            ) : (
                <ul className="ct-history">
                    {history.map((h) => {
                        const isOpen = open === h.id;
                        return (
                            <li key={h.id}>
                                <button type="button" className="ct-hist-row" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : h.id)} disabled={!h.changes?.length}>
                                    <span className="ct-avatar">{initialsOf(h.user)}</span>
                                    <span className="ct-hist-text">
                                        <strong>{h.user}</strong>
                                        <small>{ACTION_LABEL[h.action] || h.action} <b>{h.label}</b></small>
                                    </span>
                                    <span className={`ct-pill is-${ACTION_PILL[h.action] || "info"}`}>{ACTION_LABEL[h.action] || h.action}</span>
                                    <span className="ct-hist-time" title={formatDate(h.at)}>{timeAgo(h.at)}</span>
                                </button>
                                {isOpen && h.changes?.length > 0 && (
                                    <div className="ct-diff">
                                        {h.changes.map((c, i) => (
                                            <div key={i}>
                                                <span>{c.field}</span>
                                                <del>{c.from}</del>
                                                <ins>{c.to}</ins>
                                            </div>
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
   EDITORS: contact persons, contact details
==================================================================== */

function ModuleHead({ no, title, text, aside }) {
    return (
        <header className="ct-card-head">
            <div>
                <span className="ct-card-no">Module {no} of 3</span>
                <h2>{title}</h2>
                <p>{text}</p>
            </div>
            {aside}
        </header>
    );
}

/* ---------- 1. Programme contact persons ---------- */
function PersonsEditor() {
    const { form, edit, catalog, errors } = useEd();
    const list = form.persons;
    const upd = (id, patch) => edit((d) => Object.assign(d.persons.find((p) => p.id === id), patch));

    return (
        <section className="ct-card">
            <ModuleHead
                no={1}
                title="Programme contact persons"
                text="The people visitors can contact about each programme. They appear on the Contact Us page in this order."
                aside={<span className="ct-limit">{list.length} of {LIMITS.persons}</span>}
            />

            <div className="ct-block">
                <Orderable
                    items={list}
                    nameOf={(p) => p.name || "contact person"}
                    onMove={(from, to) => edit((d) => { d.persons = moveIn(d.persons, from, to); })}
                    onRemove={(i) => edit((d) => { d.persons.splice(i, 1); })}
                    empty="No contact persons yet. Add the first one below."
                >
                    {(p) => (
                        <div className="ct-stack">
                            <div className="ct-grid-2">
                                <Field label="Full name" errorKey={`persons.${p.id}.name`} value={p.name} max={150} onChange={(v) => upd(p.id, { name: v })} />
                                <Field label="Designation" errorKey={`persons.${p.id}.designation`} value={p.designation} max={150} onChange={(v) => upd(p.id, { designation: v })} />
                            </div>
                            <div className="ct-grid-2">
                                <Field label="Email" type="email" errorKey={`persons.${p.id}.email`} value={p.email} placeholder="name@example.my" onChange={(v) => upd(p.id, { email: v })} />
                                <Field label="Phone" type="tel" errorKey={`persons.${p.id}.phone`} value={p.phone} placeholder="+60 4-979 0000" onChange={(v) => upd(p.id, { phone: v })} />
                            </div>
                            <div className={`ct-field ${errors[`persons.${p.id}.programme`] ? "has-error" : ""}`}>
                                <div className="ct-field-top"><label htmlFor={`pr-${p.id}`}>Contact for</label></div>
                                <select id={`pr-${p.id}`} className="ct-input" value={p.programmeId ?? ""} onChange={(e) => upd(p.id, { programmeId: e.target.value ? Number(e.target.value) : null })}>
                                    <option value="">All programmes (general contact)</option>
                                    {catalog.programmes.map((g) => <option key={g.id} value={g.id}>{g.title}</option>)}
                                </select>
                                <p className="ct-hint">Linking a programme shows this person on that programme’s page too.</p>
                            </div>
                            <MediaField label="Photo" accept="image" mediaId={p.mediaId} onChange={(id) => upd(p.id, { mediaId: id })} hint="Optional. A square portrait works best." />
                        </div>
                    )}
                </Orderable>
                <AddButton disabled={list.length >= LIMITS.persons} onClick={() => edit((d) => { d.persons.push({ id: uid(), name: "", designation: "", email: "", phone: "", programmeId: null, mediaId: null }); })}>Add contact person</AddButton>
            </div>
        </section>
    );
}

/* ---------- 2. Official email, phone, address, hours ---------- */
function DetailsEditor() {
    const { form, edit } = useEd();
    const d0 = form.details;
    const set = (patch) => edit((d) => Object.assign(d.details, patch));

    return (
        <section className="ct-card">
            <ModuleHead no={2} title="Email, phone, address, hours" text="The official details shown on the Contact Us page and in the website footer." />

            <div className="ct-block">
                <BlockHead title="Official contact details" />
                <div className="ct-grid-2">
                    <Field label="Official email" type="email" errorKey="details.email" value={d0.email} placeholder="info@example.my" onChange={(v) => set({ email: v })} />
                    <Field label="Official phone" type="tel" errorKey="details.phone" value={d0.phone} placeholder="+60 4-979 0000" onChange={(v) => set({ phone: v })} />
                </div>
                <Field label="Address" errorKey="details.address" value={d0.address} max={300} rows={3} onChange={(v) => set({ address: v })} />
            </div>

            <div className="ct-block">
                <BlockHead title="Office hours" text="One row per group of days." aside={<span className="ct-limit">{d0.hours.length} of {LIMITS.hours}</span>} />
                <Orderable
                    items={d0.hours}
                    nameOf={(h) => h.days || "hours row"}
                    onMove={(from, to) => edit((d) => { d.details.hours = moveIn(d.details.hours, from, to); })}
                    onRemove={(i) => edit((d) => { d.details.hours.splice(i, 1); })}
                    empty="No office hours yet."
                >
                    {(h) => (
                        <div className="ct-row-fields">
                            <Field label="Days" errorKey={`details.hours.${h.id}.days`} value={h.days} max={60} placeholder="Monday to Thursday" onChange={(v) => edit((d) => { d.details.hours.find((x) => x.id === h.id).days = v; })} />
                            <Field label="Hours" errorKey={`details.hours.${h.id}.hours`} value={h.hours} max={80} placeholder="8.00 am to 5.00 pm, or Closed" onChange={(v) => edit((d) => { d.details.hours.find((x) => x.id === h.id).hours = v; })} />
                        </div>
                    )}
                </Orderable>
                <ErrorLine errorKey="details.hours" />
                <AddButton disabled={d0.hours.length >= LIMITS.hours} onClick={() => edit((d) => { d.details.hours.push({ id: uid(), days: "", hours: "" }); })}>Add office hours row</AddButton>
            </div>

            <div className="ct-block">
                <BlockHead title="Where new enquiries go" text="Not shown to visitors." />
                <Field label="Notification email" type="email" errorKey="details.notifyEmail" value={d0.notifyEmail} placeholder="enquiries@example.my" onChange={(v) => set({ notifyEmail: v })} hint="Every new enquiry from the Contact Us form is also emailed here." />
            </div>
        </section>
    );
}

/* ====================================================================
   3. GENERAL ENQUIRY INBOX
==================================================================== */

const dateTime = (iso) => formatDate(iso);

function StatusPill({ status }) {
    const s = STATUS[status] || { label: status, tone: "info" };
    return <span className={`ct-pill is-${s.tone}`}>{s.label}</span>;
}

function downloadCsv(rows, admins) {
    const nameOf = (id) => admins.find((a) => a.id === id)?.name || "";
    const head = ["Reference", "Received", "Type", "Status", "Name", "Email", "Organisation", "Subject", "Message", "Assigned to", "Handled"];
    const lines = rows.map((e) => [e.reference, new Date(e.createdAt).toISOString(), TYPE_LABEL[e.type] || e.type, STATUS[e.status]?.label || e.status, e.senderName, e.senderEmail, e.organisation, e.subject, e.message, nameOf(e.assignedTo), e.handledAt ? new Date(e.handledAt).toISOString() : ""]);
    const csv = [head, ...lines].map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `psb-enquiries-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

/* The enquiry opens in a side panel: read, assign, change status, reply, delete */
function EnquiryDrawer({ item, index, total, admins, onClose, onPrev, onNext, onPatch, onDelete }) {
    useEffect(() => {
        const onKey = (e) => {
            if (e.key === "Escape") onClose();
            if (["INPUT", "SELECT", "TEXTAREA"].includes(e.target.tagName)) return;
            if (e.key === "ArrowLeft") onPrev();
            if (e.key === "ArrowRight") onNext();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [onClose, onPrev, onNext]);

    const reply = `mailto:${item.senderEmail}?subject=${encodeURIComponent(`Re: ${item.subject}`)}`;

    return (
        <div className="ct-drawer-wrap" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
            <aside className="ct-drawer" role="dialog" aria-modal="true" aria-labelledby="ct-enq-title">
                <header className="ct-drawer-head">
                    <div className="ct-drawer-nav">
                        <button type="button" className="ct-iconbtn" aria-label="Previous enquiry" onClick={onPrev} disabled={index <= 0}><Icon name="left" size={16} /></button>
                        <span>{index + 1} of {total}</span>
                        <button type="button" className="ct-iconbtn" aria-label="Next enquiry" onClick={onNext} disabled={index >= total - 1}><Icon name="right" size={16} /></button>
                    </div>
                    <button type="button" className="ct-iconbtn" aria-label="Close" onClick={onClose}><Icon name="close" size={18} /></button>
                </header>

                <div className="ct-drawer-body">
                    <div className="ct-drawer-title">
                        <StatusPill status={item.status} />
                        <span className="ct-ref">{item.reference}</span>
                    </div>
                    <h2 id="ct-enq-title">{item.subject}</h2>

                    <dl className="ct-meta">
                        <div><dt>From</dt><dd>{item.senderName}</dd></div>
                        <div><dt>Email</dt><dd><a href={`mailto:${item.senderEmail}`}>{item.senderEmail}</a></dd></div>
                        <div><dt>Organisation</dt><dd>{item.organisation || "Not given"}</dd></div>
                        <div><dt>Type</dt><dd>{TYPE_LABEL[item.type] || item.type}</dd></div>
                        <div><dt>Received</dt><dd>{dateTime(item.createdAt)}</dd></div>
                        <div><dt>Handled</dt><dd>{item.handledAt ? dateTime(item.handledAt) : "Not yet"}</dd></div>
                    </dl>

                    <div className="ct-message">
                        <h3>Message</h3>
                        <p>{item.message}</p>
                    </div>

                    <div className="ct-controls">
                        <div className="ct-field">
                            <div className="ct-field-top"><label htmlFor="ct-st">Status</label></div>
                            <select id="ct-st" className="ct-input" value={item.status} onChange={(e) => onPatch(item.id, { status: e.target.value })}>
                                {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                            </select>
                        </div>
                        <div className="ct-field">
                            <div className="ct-field-top"><label htmlFor="ct-as">Assigned to</label></div>
                            <select id="ct-as" className="ct-input" value={item.assignedTo ?? ""} onChange={(e) => onPatch(item.id, { assignedTo: e.target.value ? Number(e.target.value) : null })}>
                                <option value="">Unassigned</option>
                                {admins.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                <footer className="ct-drawer-foot">
                    <button type="button" className="ct-btn-danger is-quiet" onClick={() => onDelete([item])}><Icon name="trash" size={15} /> Delete</button>
                    <div>
                        {item.status === "new" && <button type="button" className="ct-btn-outline" onClick={() => onPatch(item.id, { status: "in_progress" })}>Start handling</button>}
                        <a className="ct-btn-dark" href={reply}><span className="ct-btn-icon"><Icon name="send" size={15} /></span> Reply by email</a>
                        {item.status !== "replied" && item.status !== "closed" && <button type="button" className="ct-btn-yellow" onClick={() => onPatch(item.id, { status: "replied" })}><Icon name="check" size={15} /> Mark as replied</button>}
                    </div>
                </footer>
            </aside>
        </div>
    );
}

function InboxPanel({ enquiries, admins, onPatch, onBulk, onDelete }) {
    const [query, setQuery] = useState("");
    const [status, setStatus] = useState("all");
    const [type, setType] = useState("all");
    const [assigned, setAssigned] = useState("all");
    const [sort, setSort] = useState("newest");
    const [page, setPage] = useState(1);
    const [selected, setSelected] = useState(() => new Set());
    const [openId, setOpenId] = useState(null);

    const nameOf = (id) => admins.find((a) => a.id === id)?.name;
    const counts = useMemo(() => Object.fromEntries(Object.keys(STATUS).map((k) => [k, enquiries.filter((e) => e.status === k).length])), [enquiries]);
    const types = useMemo(() => [...new Set(["general", "programme", ...enquiries.map((e) => e.type)])], [enquiries]);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        const order = { new: 0, in_progress: 1, replied: 2, closed: 3 };
        const list = enquiries.filter((e) => {
            if (status !== "all" && e.status !== status) return false;
            if (type !== "all" && e.type !== type) return false;
            if (assigned === "unassigned" && e.assignedTo) return false;
            if (assigned !== "all" && assigned !== "unassigned" && e.assignedTo !== Number(assigned)) return false;
            if (!q) return true;
            return [e.subject, e.senderName, e.senderEmail, e.organisation, e.message, e.reference].some((v) => (v || "").toLowerCase().includes(q));
        });
        const t = (e) => new Date(e.createdAt).getTime();
        return list.sort((a, b) => (sort === "oldest" ? t(a) - t(b) : sort === "status" ? order[a.status] - order[b.status] || t(b) - t(a) : t(b) - t(a)));
    }, [enquiries, query, status, type, assigned, sort]);

    const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const current = Math.min(page, pages);
    const rows = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
    const filtersActive = query || status !== "all" || type !== "all" || assigned !== "all";

    const alive = new Set(enquiries.map((e) => e.id));
    const chosen = enquiries.filter((e) => selected.has(e.id) && alive.has(e.id));
    const allOnPage = rows.length > 0 && rows.every((r) => selected.has(r.id));
    const someOnPage = rows.some((r) => selected.has(r.id));

    const openIndex = filtered.findIndex((e) => e.id === openId);
    const openItem = openIndex >= 0 ? filtered[openIndex] : null;

    const reset = () => { setQuery(""); setStatus("all"); setType("all"); setAssigned("all"); setPage(1); };
    const change = (setter) => (e) => { setter(e.target.value); setPage(1); };
    const toggleOne = (id) => { const next = new Set(selected); next.has(id) ? next.delete(id) : next.add(id); setSelected(next); };
    const togglePage = () => { const next = new Set(selected); rows.forEach((r) => (allOnPage ? next.delete(r.id) : next.add(r.id))); setSelected(next); };
    const go = (i) => { const target = filtered[i]; if (target) setOpenId(target.id); };

    return (
        <>
            <div className="ct-stats">
                {Object.entries(STATUS).map(([key, s]) => (
                    <button key={key} type="button" className={`ct-stat ${key === "new" ? "is-primary" : ""} ${status === key ? "is-selected" : ""}`} onClick={() => { setStatus(status === key ? "all" : key); setPage(1); }} aria-pressed={status === key}>
                        <span className="ct-stat-top">{s.label}<Icon name="inbox" size={16} /></span>
                        <strong>{counts[key]}</strong>
                        <small>{key === "new" ? "waiting for a first reply" : key === "in_progress" ? "being handled" : key === "replied" ? "answered, not closed" : "finished"}</small>
                    </button>
                ))}
            </div>

            <section className="ct-card ct-inbox">
                <header className="ct-head">
                    <div>
                        <h3>General enquiry inbox</h3>
                        <p className="ct-sub">{filtered.length} enquir{filtered.length === 1 ? "y" : "ies"}{filtersActive ? " match your filters" : " in total"}</p>
                    </div>
                    <button type="button" className="ct-btn-small" onClick={() => downloadCsv(filtered, admins)} disabled={!filtered.length}><Icon name="download" size={14} /> Export CSV</button>
                </header>

                <div className="ct-toolbar">
                    <label className="ct-search">
                        <Icon name="search" size={16} />
                        <input type="search" value={query} onChange={change(setQuery)} placeholder="Search name, email, subject or message" aria-label="Search enquiries" />
                    </label>
                    <select className="ct-input ct-select" value={type} onChange={change(setType)} aria-label="Enquiry type">
                        <option value="all">All types</option>
                        {types.map((t) => <option key={t} value={t}>{TYPE_LABEL[t] || t}</option>)}
                    </select>
                    <select className="ct-input ct-select" value={assigned} onChange={change(setAssigned)} aria-label="Assigned to">
                        <option value="all">Anyone</option>
                        <option value="unassigned">Unassigned</option>
                        {admins.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                    <select className="ct-input ct-select" value={sort} onChange={change(setSort)} aria-label="Sort by">
                        {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                    {filtersActive && <button type="button" className="ct-clear" onClick={reset}>Clear filters</button>}
                </div>

                {chosen.length > 0 && (
                    <div className="ct-selection" role="status">
                        <strong>{chosen.length} selected</strong>
                        <div>
                            <button type="button" className="ct-btn-small" onClick={() => { onBulk(chosen.map((e) => e.id), "in_progress"); setSelected(new Set()); }}>Mark in progress</button>
                            <button type="button" className="ct-btn-small" onClick={() => { onBulk(chosen.map((e) => e.id), "closed"); setSelected(new Set()); }}>Close</button>
                            <button type="button" className="ct-btn-small is-danger" onClick={() => onDelete(chosen, () => setSelected(new Set()))}><Icon name="trash" size={13} /> Delete</button>
                            <button type="button" className="ct-clear" onClick={() => setSelected(new Set())}>Clear</button>
                        </div>
                    </div>
                )}

                <div className="ct-table-wrap">
                    <table className="ct-table">
                        <thead>
                            <tr>
                                <th className="col-check"><input type="checkbox" aria-label="Select all on this page" checked={allOnPage} ref={(el) => { if (el) el.indeterminate = someOnPage && !allOnPage; }} onChange={togglePage} disabled={!rows.length} /></th>
                                <th>Enquiry</th>
                                <th>Type</th>
                                <th>Status</th>
                                <th>Assigned to</th>
                                <th>Received</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.length === 0 && (
                                <tr><td colSpan={6} className="ct-empty-cell">
                                    <Icon name="inbox" size={24} />
                                    <strong>{enquiries.length ? "Nothing matches" : "The inbox is empty"}</strong>
                                    <span>{enquiries.length ? "Try another search or clear the filters." : "New enquiries from the Contact Us form will appear here."}</span>
                                </td></tr>
                            )}
                            {rows.map((e) => (
                                <tr key={e.id} className={`${selected.has(e.id) ? "is-selected" : ""} ${e.status === "new" ? "is-unread" : ""}`}>
                                    <td className="col-check"><input type="checkbox" checked={selected.has(e.id)} onChange={() => toggleOne(e.id)} aria-label={`Select enquiry from ${e.senderName}`} /></td>
                                    <td>
                                        <button type="button" className="ct-enq" onClick={() => setOpenId(e.id)}>
                                            <span className="ct-enq-dot" aria-hidden="true" />
                                            <span className="ct-enq-text">
                                                <strong title={e.subject}>{e.subject}</strong>
                                                <small>{e.senderName}{e.organisation ? `, ${e.organisation}` : ""}</small>
                                            </span>
                                        </button>
                                    </td>
                                    <td><span className="ct-tag">{TYPE_LABEL[e.type] || e.type}</span></td>
                                    <td><StatusPill status={e.status} /></td>
                                    <td>
                                        {e.assignedTo ? (
                                            <span className="ct-by"><span className="ct-avatar is-small">{initialsOf(nameOf(e.assignedTo))}</span>{nameOf(e.assignedTo)}</span>
                                        ) : <span className="ct-muted">Unassigned</span>}
                                    </td>
                                    <td><span className="ct-when" title={dateTime(e.createdAt)}>{timeAgo(e.createdAt)}</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <footer className="ct-pager">
                    <span>{filtered.length === 0 ? "Showing 0 enquiries" : `Showing ${(current - 1) * PAGE_SIZE + 1} to ${Math.min(current * PAGE_SIZE, filtered.length)} of ${filtered.length}`}</span>
                    <div>
                        <button type="button" className="ct-btn-small" onClick={() => setPage(current - 1)} disabled={current <= 1}>Previous</button>
                        <span className="ct-page">{current} / {pages}</span>
                        <button type="button" className="ct-btn-small" onClick={() => setPage(current + 1)} disabled={current >= pages}>Next</button>
                    </div>
                </footer>
            </section>

            {openItem && (
                <EnquiryDrawer
                    item={openItem}
                    index={openIndex}
                    total={filtered.length}
                    admins={admins}
                    onClose={() => setOpenId(null)}
                    onPrev={() => go(openIndex - 1)}
                    onNext={() => go(openIndex + 1)}
                    onPatch={onPatch}
                    onDelete={(items) => onDelete(items, () => setOpenId(null))}
                />
            )}
        </>
    );
}

/* A simplified picture of the public Contact Us page, built from the unsaved form */
function PreviewModal({ form, catalog, onClose, previewUrl }) {
    const [device, setDevice] = useState("desktop");
    useEffect(() => {
        const onKey = (e) => e.key === "Escape" && onClose();
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [onClose]);

    const d = form.details;
    const photo = (id) => catalog.media.find((m) => m.id === id);
    const programme = (id) => catalog.programmes.find((p) => p.id === id)?.title;

    return (
        <div className="ct-overlay is-wide" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
            <div className="ct-dialog ct-preview" role="dialog" aria-modal="true" aria-labelledby="ct-pv-title">
                <header className="ct-dialog-head">
                    <div>
                        <h2 id="ct-pv-title">Preview of the Contact Us page</h2>
                        <p>Built from what you see on screen, including unsaved changes. Layout is simplified.</p>
                    </div>
                    <div className="ct-preview-tools">
                        <div className="ct-seg" role="group" aria-label="Device">
                            <button type="button" className={device === "desktop" ? "is-on" : ""} onClick={() => setDevice("desktop")}>Desktop</button>
                            <button type="button" className={device === "mobile" ? "is-on" : ""} onClick={() => setDevice("mobile")}>Mobile</button>
                        </div>
                        {previewUrl && <a className="ct-btn-small" href={previewUrl} target="_blank" rel="noreferrer">Open saved preview <Icon name="external" size={12} /></a>}
                        <button type="button" className="ct-iconbtn" aria-label="Close preview" onClick={onClose}><Icon name="close" size={18} /></button>
                    </div>
                </header>

                <div className={`ct-pv-frame is-${device}`}>
                    <div className="ct-pv">
                        <section className="ct-pv-top">
                            <h1>Contact <em>us</em></h1>
                            <p>Questions about the sandbox, a programme or how to take part? Write to us or call.</p>
                        </section>
                        <section className="ct-pv-grid">
                            <div>
                                <h2>Official details</h2>
                                <div className="ct-pv-line"><Icon name="mail" size={16} /><span>{d.email}</span></div>
                                <div className="ct-pv-line"><Icon name="phone" size={16} /><span>{d.phone}</span></div>
                                <div className="ct-pv-line"><Icon name="mappin" size={16} /><span>{d.address}</span></div>
                                <h2>Office hours</h2>
                                {d.hours.map((h) => <div className="ct-pv-hours" key={h.id}><span>{h.days}</span><b>{h.hours}</b></div>)}
                            </div>
                            <div>
                                <h2>Send an enquiry</h2>
                                <div className="ct-pv-form">
                                    <span>Name</span><span>Email</span><span>Organisation</span><span>Subject</span><span className="is-tall">Message</span>
                                    <b>Send enquiry</b>
                                </div>
                            </div>
                        </section>
                        <section className="ct-pv-people">
                            <h2>Programme contacts</h2>
                            <div className="ct-pv-cards">
                                {form.persons.map((p) => (
                                    <div key={p.id}>
                                        <span className="ct-pv-photo">{photo(p.mediaId) ? <img src={thumbOf(photo(p.mediaId))} alt="" /> : initialsOf(p.name)}</span>
                                        <strong>{p.name}</strong>
                                        <small>{p.designation}</small>
                                        <small className="is-tag">{programme(p.programmeId) || "All programmes"}</small>
                                        {p.email && <small>{p.email}</small>}
                                        {p.phone && <small>{p.phone}</small>}
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ====================================================================
   PAGE
==================================================================== */

export default function ContactandEnquaries() {
    const { props, url } = usePage();
    const live = Boolean(props.contact?.content);

    const seed = useRef(
        live
            ? { content: props.contact.content, meta: props.contact.meta, catalog: props.contact.catalog, enquiries: props.contact.enquiries || [], history: props.contact.history || [] }
            : { content: sampleContent, meta: sampleMeta, catalog: sampleCatalog, enquiries: sampleEnquiries, history: sampleHistory }
    ).current;

    const [saved, setSaved] = useState(() => clone(seed.content));
    const [form, setForm] = useState(() => clone(seed.content));
    const [meta, setMeta] = useState(seed.meta);
    const [localHistory, setLocalHistory] = useState(seed.history);
    const [localEnquiries, setLocalEnquiries] = useState(seed.enquiries);
    const [mediaList, setMediaList] = useState(seed.catalog.media);

    const baseCatalog = live ? props.contact.catalog : seed.catalog;
    const catalog = { ...baseCatalog, media: live ? props.contact.catalog.media : mediaList };
    const enquiries = live ? props.contact.enquiries || [] : localEnquiries;
    const history = live ? props.contact.history || [] : localHistory;
    const admins = catalog.admins || [];

    const [tab, setTab] = useState(() => TABS.find((t) => (url || "").includes(`/contact/${t.route}`))?.key || "enquiries");
    const [submitted, setSubmitted] = useState(false);
    const [busy, setBusy] = useState(false);
    const [dialog, setDialog] = useState(null); // { type: publish | delete, ... }
    const [picker, setPicker] = useState(null);
    const [preview, setPreview] = useState(false);
    const [toast, setToast] = useState(null);
    const busyRef = useRef(false);

    useEffect(() => { if (live) setMeta(props.contact.meta); }, [live, props.contact?.meta]);

    const dirty = useMemo(() => !sameJson(form, saved), [form, saved]);
    const allErrors = useMemo(() => validate(form), [form]);
    const errors = useMemo(() => ({ ...(props.errors || {}), ...(submitted ? allErrors : {}) }), [props.errors, submitted, allErrors]);
    const totalErrors = Object.keys(allErrors).length;
    const errorsIn = (key) => Object.keys(errors).filter((k) => sectionOfKey(k) === key).length;
    const unpublished = dirty || meta.hasUnpublishedChanges;
    const newCount = enquiries.filter((e) => e.status === "new").length;
    const contentTab = tab === "persons" || tab === "details";

    const changed = [];
    if (!sameJson(form.persons, saved.persons)) changed.push("Programme contact persons");
    if (!sameJson(form.details, saved.details)) changed.push("Email, phone, address, hours");

    useEffect(() => {
        if (!toast) return undefined;
        const t = setTimeout(() => setToast(null), 5000);
        return () => clearTimeout(t);
    }, [toast]);

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
    const askDelete = (info) => setDialog({ type: "delete", kind: "content", ...info });
    const pickMedia = (opts) => setPicker(opts);
    const finishBusy = () => { setBusy(false); busyRef.current = false; };
    const nameOfAdmin = (id) => admins.find((a) => a.id === id)?.name;

    const addHistory = (action, label, changes = []) =>
        setLocalHistory((h) => [{ id: Date.now() + Math.random(), user: "You", action, label, at: new Date().toISOString(), changes }, ...h]);

    const jumpToFirstError = () => {
        const first = Object.keys(allErrors)[0];
        if (!first) return;
        setTab(sectionOfKey(first));
        setTimeout(() => document.querySelector(".ct-field.has-error")?.scrollIntoView({ behavior: "smooth", block: "center" }), 80);
    };

    /* ---- contact persons + details (draft / publish workflow) ---- */
    const saveDraft = () => {
        if (!dirty || busy) return;
        setBusy(true); busyRef.current = true;
        const done = () => {
            setSaved(clone(form));
            setMeta((m) => ({ ...m, hasUnpublishedChanges: m.status === "published" ? true : m.hasUnpublishedChanges, updatedBy: "You", updatedAt: new Date().toISOString() }));
            if (!live) addHistory("UPDATE", "Contact page", changed.map((c) => ({ field: c, from: "Previous version", to: "Updated" })));
            setToast({ tone: "ok", text: totalErrors ? `Draft saved. ${totalErrors} field${totalErrors === 1 ? "" : "s"} still need attention before you can publish.` : "Draft saved. Visitors still see the published version." });
            finishBusy();
        };
        if (live) router.put(ENDPOINTS.save, { content: form }, { preserveScroll: true, onSuccess: done, onError: () => { finishBusy(); setSubmitted(true); setToast({ tone: "error", text: "The server rejected some values. Check the highlighted fields." }); } });
        else setTimeout(done, 350);
    };

    const startPublish = () => {
        setSubmitted(true);
        if (totalErrors) { setToast({ tone: "error", text: `Fix ${totalErrors} field${totalErrors === 1 ? "" : "s"} before publishing.` }); jumpToFirstError(); return; }
        setDialog({ type: "publish" });
    };

    const confirmPublish = () => {
        setBusy(true); busyRef.current = true;
        const done = () => {
            const now = new Date().toISOString();
            setSaved(clone(form));
            setMeta((m) => ({ ...m, status: "published", publishedAt: now, hasUnpublishedChanges: false, updatedBy: "You", updatedAt: now }));
            if (!live) addHistory("PUBLISH", "Contact page", changed.map((c) => ({ field: c, from: "Previous version", to: "Updated" })));
            setDialog(null); setSubmitted(false);
            setToast({ tone: "ok", text: "Published. Visitors now see these contact details." });
            finishBusy();
        };
        const fail = () => { finishBusy(); setDialog(null); setToast({ tone: "error", text: "Something went wrong. Nothing was changed." }); };
        if (live) router.post(ENDPOINTS.publish, { content: form }, { preserveScroll: true, onSuccess: done, onError: fail });
        else setTimeout(done, 400);
    };

    /* ---- enquiry inbox (changes apply immediately, no publishing) ---- */
    const patchEnquiry = (id, patch) => {
        const item = enquiries.find((e) => e.id === id);
        if (!item) return;
        const changes = [];
        if (patch.status && patch.status !== item.status) changes.push({ field: "Status", from: STATUS[item.status].label, to: STATUS[patch.status].label });
        if ("assignedTo" in patch && patch.assignedTo !== item.assignedTo) changes.push({ field: "Assigned to", from: nameOfAdmin(item.assignedTo) || "Unassigned", to: nameOfAdmin(patch.assignedTo) || "Unassigned" });
        if (!changes.length) return;

        const done = () => {
            if (!live) {
                const closing = patch.status === "replied" || patch.status === "closed";
                setLocalEnquiries((list) => list.map((e) => (e.id === id ? { ...e, ...patch, handledAt: closing ? e.handledAt || new Date().toISOString() : e.handledAt } : e)));
                addHistory("UPDATE", `Enquiry from ${item.senderName}`, changes);
            }
            setToast({ tone: "ok", text: patch.status ? `Marked as ${STATUS[patch.status].label.toLowerCase()}.` : "Assignment updated." });
        };
        if (live) router.put(`${ENDPOINTS.enquiry}/${id}`, patch, { preserveScroll: true, onSuccess: done, onError: () => setToast({ tone: "error", text: "The change could not be saved." }) });
        else done();
    };

    const bulkStatus = (ids, status) => {
        if (live) {
            router.post(ENDPOINTS.bulk, { ids, status }, { preserveScroll: true, onSuccess: () => setToast({ tone: "ok", text: `${ids.length} enquir${ids.length === 1 ? "y" : "ies"} updated.` }), onError: () => setToast({ tone: "error", text: "The change could not be saved." }) });
            return;
        }
        const now = new Date().toISOString();
        setLocalEnquiries((list) => list.map((e) => (ids.includes(e.id) ? { ...e, status, handledAt: status === "closed" ? e.handledAt || now : e.handledAt } : e)));
        addHistory("UPDATE", `${ids.length} enquir${ids.length === 1 ? "y" : "ies"}`, [{ field: "Status", from: "Various", to: STATUS[status].label }]);
        setToast({ tone: "ok", text: `${ids.length} enquir${ids.length === 1 ? "y" : "ies"} marked as ${STATUS[status].label.toLowerCase()}.` });
    };

    const askDeleteEnquiries = (items, after) =>
        setDialog({
            type: "delete",
            kind: "enquiry",
            what: items.length === 1 ? items[0].subject : `${items.length} enquiries`,
            onConfirm: () => {
                const ids = items.map((e) => e.id);
                const finish = () => { after?.(); setToast({ tone: "ok", text: `${items.length === 1 ? "Enquiry" : `${items.length} enquiries`} moved to Trash.` }); };
                if (live) router.post(ENDPOINTS.bulk, { ids, delete: true }, { preserveScroll: true, onSuccess: finish, onError: () => setToast({ tone: "error", text: "The enquiry could not be deleted." }) });
                else {
                    setLocalEnquiries((list) => list.filter((e) => !ids.includes(e.id)));
                    addHistory("DELETE", items.length === 1 ? `Enquiry from ${items[0].senderName}` : `${items.length} enquiries`, [{ field: "Moved to Trash", from: items.map((e) => e.subject).join(", "), to: "(deleted)" }]);
                    finish();
                }
            },
        });

    const confirmDelete = () => {
        const info = dialog;
        info.onConfirm();
        setDialog(null);
        if (info.kind === "content") {
            if (!live) addHistory("DELETE", `Contact page: ${info.what}`, [{ field: "Moved to Trash", from: info.what, to: "(deleted)" }]);
            setToast({ tone: "ok", text: `“${info.what}” moved to Trash. It leaves the Contact page when you publish.` });
        }
    };

    const uploadMedia = (file) => {
        const isVideo = file.type.startsWith("video");
        const local = { id: Date.now(), name: file.name, type: isVideo ? "video" : "image", alt: "", size: `${(file.size / 1048576).toFixed(1)} MB`, url: isVideo ? null : URL.createObjectURL(file) };
        if (live) router.post(ENDPOINTS.upload, { file }, { forceFormData: true, preserveScroll: true, onSuccess: () => setToast({ tone: "ok", text: `${file.name} uploaded.` }), onError: () => setToast({ tone: "error", text: "The file could not be uploaded." }) });
        else { setMediaList((m) => [local, ...m]); setToast({ tone: "ok", text: `${file.name} added (sample data, not stored).` }); }
    };

    /* Ctrl / Cmd + S saves the draft */
    useEffect(() => {
        const onKey = (e) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s" && contentTab) { e.preventDefault(); saveDraft(); } };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    });

    const ctx = { form, edit, errors, catalog, media: catalog.media, askDelete, pickMedia };
    const statusTone = meta.status === "published" ? "ok" : "off";

    return (
        <Ctx.Provider value={ctx}>
            <div className="psb-contact">
                <div className="ct-heading">
                    <div>
                        <h1>Contact and Enquiries</h1>
                        <p>Manage who visitors can contact, the official details on the website, and every enquiry that comes in.</p>
                        <div className="ct-status">
                            <span className={`ct-pill is-${statusTone}`}>{meta.status === "published" ? "Contact page published" : "Contact page draft"}</span>
                            {unpublished && meta.status === "published" && <span className="ct-pill is-warn">{dirty ? "Unsaved changes" : "Changes not published yet"}</span>}
                            {newCount > 0 && <span className="ct-pill is-dark">{newCount} new enquir{newCount === 1 ? "y" : "ies"}</span>}
                            {meta.updatedAt && <small>Contact details edited {timeAgo(meta.updatedAt)} by {meta.updatedBy}</small>}
                        </div>
                    </div>

                    {contentTab && (
                        <div className="ct-actions">
                            <button type="button" className="ct-btn-outline" onClick={() => setPreview(true)}><Icon name="eye" size={16} /> Preview</button>
                            <button type="button" className="ct-btn-outline" onClick={saveDraft} disabled={!dirty || busy}><Icon name="save" size={16} /> {busy && !dialog ? "Saving..." : "Save draft"}</button>
                            <button type="button" className="ct-btn-dark" onClick={startPublish} disabled={busy || (!unpublished && meta.status === "published")}><span className="ct-btn-icon"><Icon name="upload" size={16} /></span> Publish</button>
                        </div>
                    )}
                </div>

                {!live && (
                    <p className="ct-note"><Icon name="alert" size={16} /><span>Sample data. Every control works, but nothing is stored until your controller sends the <b>contact</b> prop.</span></p>
                )}

                <div className="ct-tabs" role="tablist" aria-label="Contact and Enquiries">
                    {TABS.map((t) => (
                        <button key={t.key} type="button" role="tab" aria-selected={tab === t.key} className={tab === t.key ? "is-active" : ""} onClick={() => setTab(t.key)}>
                            {t.label}
                            {(t.key === "persons" || t.key === "details") && errorsIn(t.key) > 0 && <span className="ct-badge-error">{errorsIn(t.key)}</span>}
                            {t.key === "enquiries" && newCount > 0 && <span className="ct-badge is-new">{newCount}</span>}
                            {t.key === "history" && <span className="ct-badge">{history.length}</span>}
                        </button>
                    ))}
                </div>

                {tab === "persons" && <PersonsEditor />}
                {tab === "details" && <DetailsEditor />}
                {tab === "enquiries" && <InboxPanel enquiries={enquiries} admins={admins} onPatch={patchEnquiry} onBulk={bulkStatus} onDelete={askDeleteEnquiries} />}
                {tab === "history" && <HistoryPanel history={history} />}

                {dirty && contentTab && (
                    <div className="ct-savebar" role="region" aria-label="Unsaved changes">
                        <span className="ct-savebar-text"><i /> {changed.length} section{changed.length === 1 ? "" : "s"} edited, not saved</span>
                        <div>
                            <button type="button" className="ct-btn-ghost" onClick={() => { setForm(clone(saved)); setSubmitted(false); setToast({ tone: "info", text: "Changes discarded." }); }} disabled={busy}>Discard</button>
                            <button type="button" className="ct-btn-yellow" onClick={saveDraft} disabled={busy}>{busy ? "Saving..." : "Save draft"}</button>
                        </div>
                    </div>
                )}

                {dialog?.type === "delete" && (
                    <div className="ct-overlay" onMouseDown={(e) => e.target === e.currentTarget && setDialog(null)}>
                        <div className="ct-dialog ct-small" role="alertdialog" aria-modal="true" aria-labelledby="ct-del-title">
                            <span className="ct-dialog-icon is-danger"><Icon name="trash" size={22} /></span>
                            <h2 id="ct-del-title">Delete “{dialog.what}”?</h2>
                            <p>{dialog.kind === "enquiry" ? "It leaves the inbox and moves to Content Trash, where only the Super Admin can restore or purge it." : "It moves to Content Trash, where only the Super Admin can restore or purge it. It leaves the Contact page when you publish."}</p>
                            <div className="ct-dialog-actions">
                                <button type="button" className="ct-btn-outline" onClick={() => setDialog(null)} autoFocus>Keep it</button>
                                <button type="button" className="ct-btn-danger" onClick={confirmDelete}><Icon name="trash" size={15} /> Move to Trash</button>
                            </div>
                        </div>
                    </div>
                )}

                {dialog?.type === "publish" && (
                    <div className="ct-overlay" onMouseDown={(e) => e.target === e.currentTarget && !busy && setDialog(null)}>
                        <div className="ct-dialog ct-small" role="alertdialog" aria-modal="true" aria-labelledby="ct-pub-title">
                            <span className="ct-dialog-icon"><Icon name="upload" size={22} /></span>
                            <h2 id="ct-pub-title">Publish the contact details?</h2>
                            <p>Visitors will see your changes on the Contact Us page straight away.</p>
                            {changed.length > 0 ? (
                                <ul className="ct-dialog-list">{changed.map((l) => <li key={l}><Icon name="check" size={14} /> {l}</li>)}</ul>
                            ) : (
                                <p className="ct-hint">No new edits. This publishes the last saved draft.</p>
                            )}
                            <div className="ct-dialog-actions">
                                <button type="button" className="ct-btn-outline" onClick={() => setDialog(null)} disabled={busy}>Cancel</button>
                                <button type="button" className="ct-btn-dark" onClick={confirmPublish} disabled={busy}>{busy ? "Working..." : "Publish now"}</button>
                            </div>
                        </div>
                    </div>
                )}

                {picker && <MediaPicker state={picker} media={catalog.media} onClose={() => setPicker(null)} onUpload={uploadMedia} />}
                {preview && <PreviewModal form={form} catalog={catalog} previewUrl={props.contact?.previewUrl} onClose={() => setPreview(false)} />}

                {toast && (
                    <div className={`ct-toast is-${toast.tone}`} role="status">
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
   ContactandEnquaries.layout = (page) => <NavigationBar>{page}</NavigationBar>;          */

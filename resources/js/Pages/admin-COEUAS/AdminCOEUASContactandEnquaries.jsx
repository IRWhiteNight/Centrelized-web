import { createContext, useContext, useEffect, useId, useMemo, useRef, useState } from "react";
import { router, usePage } from "@inertiajs/react";
import "../../../css/admin-COEUAS-css/admin-contact.css";

/* ====================================================================
   COE-UAS ADMIN → CONTACT AND ENQUIRIES EDITOR      /admin/coeuas/contact/*

   Site map 1.3 (COE-UAS workspace → "Contact and Enquiries"), one editor for two modules:
     1  Contact details and offices                        (/contact/details)
          → site_settings (group "contact") for the centre's details and enquiry notification emails
          → offices, stored as JSON in site_settings (key "contact_offices")
     2  Enquiry inbox (general / research / training)      (/contact/enquiries)
          → contact_enquiries
   Use case 2.3: "Manage Contact Details and Offices", "View Enquiry Inbox",
   "Respond / Update Enquiry Status", "Export Enquiries".
   Public page: CONTACT (3 enquiry types). COE-UAS uses general, research_collab and training_services;
   the `programme` type belongs to PSB and is not shown here.
   Common screens: search / filter / sort, preview, History tab (audit_logs).

   THE ERD HAS NO OFFICES TABLE. The site map asks for "contact details and offices", so this page keeps
   offices as a JSON list inside one site_settings row (setting_value TEXT). If offices need their own
   search, links or reports later, add an `offices` table and map the same fields:
     id, name, address, phone, email, hours, is_main, is_visible, sort_order.
   Settings keys used (site_settings.group = "contact"): contact_email, contact_phone, contact_address,
   contact_hours, contact_map_url, notify_general, notify_research_collab, notify_training_services,
   contact_offices.

   WHAT SAVE CHANGES: site_settings changes go live on save (settings have no draft). For enquiries only
   status, assigned_to and handled_at are written; sender and message are read only.
   Rules on this page: moving an enquiry to Replied or Closed stamps handled_at; moving it back clears it;
   assigning a New enquiry moves it to In progress.

   SAMPLE DATA: works today (changes stay on screen only). Return an Inertia prop named
   `contact` and it switches to LIVE mode:

   Inertia::render('admin-COEUAS/AdminCOEUASContactandEnquaries', [
       'view' => 'details',   // optional: details | enquiries
       'contact' => [
           'data'    => ['details' => [...], 'offices' => [], 'enquiries' => []], // same shape as `sampleData`
           'catalog' => ['users' => [['id' => 1, 'name' => '...']]],              // admins who can be assigned
           'history' => [...],     // audit_logs rows
           'previewUrl' => 'https://...',
       ],
   ]);

   Send the same prop for both sidebar routes. Save sends only what changed:
   PUT /admin/coeuas/contact  { details?, offices?, enquiries? }
   Export (live mode): GET /admin/coeuas/contact/enquiries/export?type=&status=&assignee=&q=
   The controller streams the CSV and writes an audit_logs row with action EXPORT.
   The controller must scope every query to the COEUAS site_id and write audit_logs.
==================================================================== */

const BASE = "/admin/coeuas"; // keep in sync with coeuasRoutes.js
const ENDPOINTS = { save: `${BASE}/contact`, export: `${BASE}/contact/enquiries/export` };
const MIN = 60 * 1000;
const NOW = Date.now();
const minsAgo = (m) => new Date(NOW - m * MIN).toISOString();
let counter = 0;
const uid = () => `n${Date.now().toString(36)}${(counter += 1)}`;

/* enums from the ERD (contact_enquiries) */
const ENQ_TYPES = [
    { value: "general", label: "General" },
    { value: "research_collab", label: "Research collaboration" },
    { value: "training_services", label: "Training and services" },
];
const ENQ_STATUS = [{ value: "new", label: "New" }, { value: "in_progress", label: "In progress" }, { value: "replied", label: "Replied" }, { value: "closed", label: "Closed" }];
const STATUS_TONE = { new: "is-new", in_progress: "is-warn", replied: "is-ok", closed: "is-off" };
const NOTIFY = [
    { k: "notifyGeneral", type: "general", label: "General enquiries go to" },
    { k: "notifyResearch", type: "research_collab", label: "Research collaboration enquiries go to" },
    { k: "notifyTraining", type: "training_services", label: "Training and services enquiries go to" },
];

const VIEWS = [
    { key: "details", title: "Contact details and offices", text: "What visitors see on the Contact page, and where each kind of enquiry is sent.", tabs: [["details", "Contact details"], ["offices", "Offices"]] },
    { key: "enquiries", title: "Enquiry inbox", text: "General, research collaboration and training enquiries from the Contact page.", tabs: [["inbox", "Inbox"]] },
];

/* ------------------------------ sample data ------------------------------ */

const sampleData = {
    details: {
        email: "info@coe-uas.example.edu.my", phone: "+60 4-000 0000", address: "Centre of Excellence for Unmanned Aerial Systems\nUniversiti Malaysia Perlis\n02600 Arau, Perlis, Malaysia",
        officeHours: "Monday to Friday, 8:30 am to 5:00 pm", mapUrl: "https://maps.example.com/coe-uas",
        notifyGeneral: "info@coe-uas.example.edu.my", notifyResearch: "research@coe-uas.example.edu.my", notifyTraining: "training@coe-uas.example.edu.my",
    },
    offices: [
        { id: 1, name: "Main office", address: "Block A, Level 2\nUniversiti Malaysia Perlis, Arau", phone: "+60 4-000 0000", email: "info@coe-uas.example.edu.my", hours: "Mon to Fri, 8:30 am to 5:00 pm", isMain: true, isVisible: true },
        { id: 2, name: "Flight test range office", address: "Test range gate, Padang Besar", phone: "+60 4-000 0001", email: "", hours: "On trial days only", isMain: false, isVisible: true },
        { id: 3, name: "Industry liaison desk", address: "", phone: "", email: "industry@coe-uas.example.edu.my", hours: "", isMain: false, isVisible: false },
    ],
    enquiries: [
        { id: 1, enquiryType: "research_collab", senderName: "Dr. Aiko Tanaka", senderEmail: "aiko.tanaka@univ.example.jp", organisation: "Partner university, Japan", subject: "Joint proposal on detect-and-avoid", message: "We are preparing a joint grant proposal and would like to discuss a shared flight trial in 2027.\n\nCould we arrange a call next week?", status: "new", assignedTo: null, handledAt: "", createdAt: minsAgo(35) },
        { id: 2, enquiryType: "training_services", senderName: "Syed Imran", senderEmail: "imran@survey.example.com", organisation: "Northern Survey Sdn Bhd", subject: "Remote pilot course for 6 staff", message: "Do you run the pilot certificate course on request for a group? We would need dates in January.", status: "in_progress", assignedTo: 2, handledAt: "", createdAt: minsAgo(60 * 26) },
        { id: 3, enquiryType: "general", senderName: "Nur Farhana", senderEmail: "farhana@school.example.edu.my", organisation: "SMK Arau", subject: "School visit", message: "Can a class of 30 students visit the centre this term?", status: "replied", assignedTo: 1, handledAt: minsAgo(60 * 20), createdAt: minsAgo(60 * 48) },
        { id: 4, enquiryType: "general", senderName: "Marketing Team", senderEmail: "promo@spam.example.com", organisation: "", subject: "Boost your website traffic", message: "We can double your traffic in 30 days.", status: "closed", assignedTo: null, handledAt: minsAgo(60 * 70), createdAt: minsAgo(60 * 72) },
        { id: 5, enquiryType: "research_collab", senderName: "Lim Wei Jian", senderEmail: "wj.lim@aero.example.com", organisation: "Aero Industries", subject: "Payload testing partnership", message: "We have a sensor payload that needs 20 test hours on a fixed-wing platform.", status: "new", assignedTo: null, handledAt: "", createdAt: minsAgo(60 * 5) },
        { id: 6, enquiryType: "training_services", senderName: "Haslina Ahmad", senderEmail: "haslina@agency.example.gov.my", organisation: "State agency", subject: "Drone mapping for flood areas", message: "We would like a quote for mapping six flood-prone sites.", status: "in_progress", assignedTo: 1, handledAt: "", createdAt: minsAgo(60 * 50) },
    ],
};
const sampleCatalog = { users: [{ id: 1, name: "Aisyah Rahman" }, { id: 2, name: "Hafiz Roslan" }] };
const sampleHistory = [
    { id: 2, user: "Aisyah Rahman", action: "UPDATE", label: "Enquiries", at: minsAgo(60 * 20), changes: [{ field: "Status", from: "in_progress", to: "replied" }] },
    { id: 1, user: "Hafiz Roslan", action: "UPDATE", label: "Contact details", at: minsAgo(60 * 24 * 8), changes: [{ field: "Office hours", from: "Previous version", to: "Updated" }] },
];

/* ------------------------------- helpers -------------------------------- */

const clone = (v) => JSON.parse(JSON.stringify(v));
const sameJson = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const labelOf = (list, value) => list.find((o) => o.value === value)?.label || value || "";
const idEq = (a, b) => String(a) === String(b);
const isUrl = (v) => /^(https?:\/\/)[^\s.]+\.[^\s]{2,}$/i.test(v);
const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const emails = (v) => String(v || "").split(/[,;\s]+/).filter(Boolean);
const when = (iso) => (iso ? new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "");

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

const csvCell = (v) => `"${String(v ?? "").replace(/"/g, '""').replace(/\r?\n/g, " ")}"`;

/* ------------------------------ validation ------------------------------- */

function validate(d) {
    const e = {};
    const x = d.details;
    if (x.email && !isEmail(x.email)) e["details.email"] = "Enter a valid email address.";
    if (x.mapUrl && !isUrl(x.mapUrl)) e["details.mapUrl"] = "Use a full link, starting with https://";
    NOTIFY.forEach(({ k }) => {
        const list = emails(x[k]);
        if (list.length === 0) e[`details.${k}`] = "Add at least one address so enquiries are not lost.";
        else if (list.some((a) => !isEmail(a))) e[`details.${k}`] = "One of the addresses is not valid.";
    });
    d.offices.forEach((o) => {
        const k = (f) => `offices.${o.id}.${f}`;
        if (!o.name.trim()) e[k("name")] = "Name the office.";
        if (o.email && !isEmail(o.email)) e[k("email")] = "Enter a valid email address.";
        if (o.isVisible && !o.address.trim()) e[k("address")] = "Add the address before showing this office.";
    });
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
        download: <path d="M12 4v12m0 0-4-4m4 4 4-4M4 20h16" />,
        mail: (<><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>),
        alert: (<><path d="M12 3 2 20h20z" /><path d="M12 10v4M12 17h.01" /></>),
        check: <path d="m5 12 5 5 9-10" />,
        close: <path d="M18 6 6 18M6 6l12 12" />,
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
    const cls = `cnt-field ${error ? "has-error" : ""} ${wide ? "is-wide" : ""}`;
    if (opts) {
        return (
            <label className={cls}>
                <span className="cnt-label">{label}</span>
                <select className="cnt-input" value={value ?? ""} onChange={(e) => onChange(e.target.value)}>{opts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
            </label>
        );
    }
    const Tag = textarea ? "textarea" : "input";
    return (
        <label className={cls}>
            <span className="cnt-label">{label}</span>
            <Tag className="cnt-input" type={textarea ? undefined : type} rows={textarea ? rows : undefined} value={value ?? ""}
                aria-invalid={error ? "true" : undefined} aria-describedby={error ? errId : undefined} onChange={(e) => onChange(e.target.value)} />
            {hint && !error && <em className="cnt-hint">{hint}</em>}
            {error && <em className="cnt-error" id={errId}><Icon name="alert" size={13} /> {error}</em>}
        </label>
    );
}

function Switch({ checked, onChange, label }) {
    return (
        <label className="cnt-switch">
            <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
            <i aria-hidden="true" />
            <span>{label}</span>
        </label>
    );
}

function PanelHead({ title, text, children }) {
    return <div className="cnt-panel-head"><div><h2>{title}</h2><p>{text}</p></div>{children}</div>;
}

/* ------------------------- 1a. contact details ------------------------- */

function DetailsTab() {
    const { data, edit } = useCtx();
    const d = data.details;
    const set = (k) => (v) => edit((x) => { x.details[k] = v; });
    return (
        <div className="cnt-panel">
            <PanelHead title="Contact details" text="Shown at the top of the Contact page and in the site footer. Changes go live when you save." />
            <div className="cnt-grid">
                <Field label="Official email" errorKey="details.email" value={d.email} onChange={set("email")} />
                <Field label="Phone" value={d.phone} onChange={set("phone")} />
                <Field label="Postal address" textarea rows={3} wide value={d.address} onChange={set("address")} />
                <Field label="Office hours" value={d.officeHours} onChange={set("officeHours")} />
                <Field label="Map link" errorKey="details.mapUrl" value={d.mapUrl} hint="Opens from the Contact page. Start with https://" onChange={set("mapUrl")} />
            </div>
            <div className="cnt-sub">
                <div className="cnt-sub-head"><h3>Where each enquiry is sent</h3></div>
                <p className="cnt-hint">The Contact page has three enquiry types. A notification email goes to these addresses when one arrives. Separate several addresses with commas.</p>
                <div className="cnt-grid">
                    {NOTIFY.map((n) => <Field key={n.k} label={n.label} wide errorKey={`details.${n.k}`} value={d[n.k]} onChange={set(n.k)} />)}
                </div>
            </div>
        </div>
    );
}

/* ------------------------- 1b. offices (JSON list) ------------------------- */

function OfficesTab() {
    const { data, edit, errors, askDelete } = useCtx();
    const move = (i, to) => edit((d) => { const a = d.offices; if (to < 0 || to >= a.length) return; const [x] = a.splice(i, 1); a.splice(to, 0, x); });
    const upd = (i, k, v) => edit((d) => { d.offices[i][k] = v; });
    return (
        <div className="cnt-panel">
            <PanelHead title="Offices" text="Each visible office is listed on the Contact page, in this order. The main office is shown first.">
                <button type="button" className="cnt-btn-small" onClick={() => edit((d) => { d.offices.push({ id: uid(), name: "", address: "", phone: "", email: "", hours: "", isMain: d.offices.length === 0, isVisible: false }); })}><Icon name="plus" size={15} /> Add office</button>
            </PanelHead>
            {data.offices.length === 0 && <p className="cnt-empty">No offices yet. Add the first one.</p>}
            <ol className="cnt-list">
                {data.offices.map((o, i) => {
                    const bad = Object.keys(errors).filter((k) => k.startsWith(`offices.${o.id}.`)).length;
                    return (
                        <li key={o.id} className="cnt-office">
                            <div className="cnt-office-top">
                                <strong>{o.name || "New office"}</strong>
                                {bad > 0 && <span className="cnt-badge-error">{bad}</span>}
                                {o.isMain && <span className="cnt-pill is-info">Main office</span>}
                                <span className={`cnt-pill ${o.isVisible ? "is-ok" : "is-off"}`}>{o.isVisible ? "Visible" : "Hidden"}</span>
                                <span className="cnt-mover">
                                    <button type="button" className="cnt-iconbtn" disabled={i === 0} aria-label="Move up" onClick={() => move(i, i - 1)}><Icon name="up" size={16} /></button>
                                    <button type="button" className="cnt-iconbtn" disabled={i === data.offices.length - 1} aria-label="Move down" onClick={() => move(i, i + 1)}><Icon name="down" size={16} /></button>
                                    <button type="button" className="cnt-iconbtn is-danger" aria-label={`Delete ${o.name || "office"}`} onClick={() => askDelete({ what: o.name || "this office", note: "Offices are saved with the contact details, so this removes it from the Contact page when you save.", onConfirm: () => edit((d) => { d.offices.splice(i, 1); }) })}><Icon name="trash" size={16} /></button>
                                </span>
                            </div>
                            <div className="cnt-grid">
                                <Field label="Office name" errorKey={`offices.${o.id}.name`} value={o.name} onChange={(v) => upd(i, "name", v)} />
                                <Field label="Opening hours" value={o.hours} onChange={(v) => upd(i, "hours", v)} />
                                <Field label="Address" textarea rows={3} wide errorKey={`offices.${o.id}.address`} value={o.address} onChange={(v) => upd(i, "address", v)} />
                                <Field label="Phone" value={o.phone} onChange={(v) => upd(i, "phone", v)} />
                                <Field label="Email" errorKey={`offices.${o.id}.email`} value={o.email} onChange={(v) => upd(i, "email", v)} />
                            </div>
                            <div className="cnt-switches">
                                <Switch checked={o.isVisible} label={o.isVisible ? "Shown on the Contact page" : "Hidden from the Contact page"} onChange={(v) => upd(i, "isVisible", v)} />
                                <Switch checked={o.isMain} label="Main office" onChange={(v) => edit((d) => { d.offices.forEach((x, j) => { x.isMain = v && j === i; }); })} />
                            </div>
                        </li>
                    );
                })}
            </ol>
        </div>
    );
}

/* ------------------------- 2. enquiry inbox ------------------------- */

function InboxTab({ onExport }) {
    const { data, edit, askDelete, catalog } = useCtx();
    const [type, setType] = useState("all");
    const [q, setQ] = useState("");
    const [status, setStatus] = useState("all");
    const [assignee, setAssignee] = useState("all");
    const [sort, setSort] = useState("newest");
    const [openId, setOpenId] = useState(null);

    const term = q.trim().toLowerCase();
    const filterOf = (t) => (x) =>
        (t === "all" || x.enquiryType === t) &&
        (status === "all" || x.status === status) &&
        (assignee === "all" || (assignee === "none" ? !x.assignedTo : idEq(x.assignedTo, assignee))) &&
        (!term || `${x.senderName} ${x.senderEmail} ${x.organisation} ${x.subject} ${x.message}`.toLowerCase().includes(term));
    const list = useMemo(() => data.enquiries.filter(filterOf(type)).sort((a, b) => (sort === "newest" ? -1 : 1) * a.createdAt.localeCompare(b.createdAt)), [data.enquiries, type, q, status, assignee, sort]); // eslint-disable-line react-hooks/exhaustive-deps
    const counts = { all: data.enquiries.filter(filterOf("all")).length, ...Object.fromEntries(ENQ_TYPES.map((t) => [t.value, data.enquiries.filter(filterOf(t.value)).length])) };
    const open = data.enquiries.find((x) => idEq(x.id, openId)) || list[0] || null;
    const userName = (id) => catalog.users.find((u) => idEq(u.id, id))?.name || "Unassigned";

    const change = (id, fn) => edit((d) => { const t = d.enquiries.find((x) => idEq(x.id, id)); if (t) fn(t); });
    const setStatusOf = (id, v) => change(id, (t) => { t.status = v; t.handledAt = v === "replied" || v === "closed" ? t.handledAt || new Date().toISOString() : ""; });
    const assign = (id, v) => change(id, (t) => { t.assignedTo = v === "" ? null : Number(v) || v; if (t.assignedTo && t.status === "new") t.status = "in_progress"; });

    return (
        <div className="cnt-panel">
            <PanelHead title="Enquiries" text={`${data.enquiries.filter((x) => x.status === "new").length} new of ${data.enquiries.length}. Sender details and messages are read only; you change the status and who handles it.`}>
                <button type="button" className="cnt-btn-small" onClick={() => onExport({ type, status, assignee, q: term, rows: list })}><Icon name="download" size={15} /> Export {list.length} as CSV</button>
            </PanelHead>
            <div className="cnt-chips" role="tablist" aria-label="Enquiry type">
                {[{ value: "all", label: "All" }, ...ENQ_TYPES].map((t) => (
                    <button key={t.value} type="button" role="tab" aria-selected={type === t.value} className={type === t.value ? "is-active" : ""} onClick={() => setType(t.value)}>{t.label} ({counts[t.value]})</button>
                ))}
            </div>
            <div className="cnt-toolbar">
                <label className="cnt-search"><Icon name="search" size={16} /><input type="search" value={q} placeholder="Search name, organisation, subject" aria-label="Search enquiries" onChange={(e) => setQ(e.target.value)} /></label>
                <select className="cnt-input" aria-label="Status" value={status} onChange={(e) => setStatus(e.target.value)}><option value="all">Any status</option>{ENQ_STATUS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}</select>
                <select className="cnt-input" aria-label="Assigned to" value={assignee} onChange={(e) => setAssignee(e.target.value)}><option value="all">Anyone</option><option value="none">Unassigned</option>{catalog.users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}</select>
                <select className="cnt-input" aria-label="Sort" value={sort} onChange={(e) => setSort(e.target.value)}><option value="newest">Newest first</option><option value="oldest">Oldest first</option></select>
            </div>

            {list.length === 0 ? <p className="cnt-empty">{data.enquiries.length ? "No enquiries match these filters." : "No enquiries yet. They appear here when someone uses the Contact page."}</p> : (
                <div className="cnt-inbox">
                    <ul className="cnt-rows">
                        {list.map((x) => (
                            <li key={x.id}>
                                <button type="button" className={`cnt-row ${x.status === "new" ? "is-new" : ""} ${open && idEq(open.id, x.id) ? "is-open" : ""}`} onClick={() => setOpenId(x.id)} aria-current={open && idEq(open.id, x.id) ? "true" : undefined}>
                                    <span className="cnt-row-top"><strong>{x.senderName}</strong><small>{timeAgo(x.createdAt)}</small></span>
                                    <span className="cnt-row-sub">{x.subject}</span>
                                    <span className="cnt-row-meta">
                                        <span className={`cnt-pill ${STATUS_TONE[x.status]}`}>{labelOf(ENQ_STATUS, x.status)}</span>
                                        <span className="cnt-pill is-info">{labelOf(ENQ_TYPES, x.enquiryType)}</span>
                                        {x.assignedTo && <small>{userName(x.assignedTo)}</small>}
                                    </span>
                                </button>
                            </li>
                        ))}
                    </ul>
                    {open && (
                        <article className="cnt-detail" key={open.id}>
                            <div className="cnt-office-top">
                                <span className={`cnt-pill ${STATUS_TONE[open.status]}`}>{labelOf(ENQ_STATUS, open.status)}</span>
                                <span className="cnt-pill is-info">{labelOf(ENQ_TYPES, open.enquiryType)}</span>
                                <button type="button" className="cnt-iconbtn is-danger" style={{ marginLeft: "auto" }} aria-label="Delete enquiry"
                                    onClick={() => askDelete({ what: open.subject, onConfirm: () => edit((d) => { d.enquiries = d.enquiries.filter((x) => !idEq(x.id, open.id)); }) })}><Icon name="trash" size={16} /></button>
                            </div>
                            <h3>{open.subject}</h3>
                            <div className="cnt-from">
                                <span><b>{open.senderName}</b>{open.organisation ? `, ${open.organisation}` : ""}</span>
                                <span>{open.senderEmail}</span>
                                <small>Received {when(open.createdAt)}{open.handledAt ? ` · Handled ${when(open.handledAt)}` : ""}</small>
                            </div>
                            <p className="cnt-message">{open.message}</p>
                            <div className="cnt-grid">
                                <Field label="Status" opts={ENQ_STATUS} value={open.status} onChange={(v) => setStatusOf(open.id, v)} />
                                <Field label="Assigned to" opts={[{ value: "", label: "Unassigned" }, ...catalog.users.map((u) => ({ value: u.id, label: u.name }))]} value={open.assignedTo ?? ""} onChange={(v) => assign(open.id, v)} />
                            </div>
                            <div className="cnt-detail-actions">
                                <a className="cnt-btn-small" href={`mailto:${open.senderEmail}?subject=${encodeURIComponent(`Re: ${open.subject}`)}`} onClick={() => open.status === "new" && setStatusOf(open.id, "in_progress")}><Icon name="mail" size={15} /> Reply by email</a>
                                {open.status !== "replied" && open.status !== "closed" && <button type="button" className="cnt-btn-small" onClick={() => setStatusOf(open.id, "replied")}><Icon name="check" size={15} /> Mark as replied</button>}
                                {open.status !== "closed" && <button type="button" className="cnt-btn-small" onClick={() => setStatusOf(open.id, "closed")}>Close enquiry</button>}
                                {open.status === "closed" && <button type="button" className="cnt-btn-small" onClick={() => setStatusOf(open.id, "in_progress")}>Reopen</button>}
                            </div>
                        </article>
                    )}
                </div>
            )}
        </div>
    );
}

/* --------------------------- history, preview --------------------------- */

const ACTION_TONE = { CREATE: "is-new", UPDATE: "is-info", PUBLISH: "is-ok", UNPUBLISH: "is-warn", DELETE: "is-danger", RESTORE: "is-ok", EXPORT: "is-info" };

function HistoryPanel({ history }) {
    return (
        <div className="cnt-panel cnt-narrow">
            <PanelHead title="History" text="Every change in Contact and Enquiries, from the audit log." />
            {history.length === 0 && <p className="cnt-empty">Nothing recorded yet.</p>}
            <ol className="cnt-history">
                {history.map((h) => (
                    <li key={h.id}>
                        <span className={`cnt-pill ${ACTION_TONE[h.action] || "is-info"}`}>{h.action}</span>
                        <div><strong>{h.label}</strong><small>{h.user} · {timeAgo(h.at)}</small>
                            {h.changes?.length > 0 && <ul>{h.changes.map((c, k) => <li key={k}>{c.field}: {c.from} → {c.to}</li>)}</ul>}</div>
                    </li>
                ))}
            </ol>
        </div>
    );
}

const SITE_NAV = ["Home", "About", "People", "Research and Innovation", "Publications", "Facilities and Services", "Engagement", "Contact"];
const DEVICES = [{ key: "desktop", label: "Desktop", width: null }, { key: "tablet", label: "Tablet", width: 820 }, { key: "mobile", label: "Mobile", width: 390 }];

function PreviewModal({ data, onClose, previewUrl }) {
    const [device, setDevice] = useState("desktop");
    const width = DEVICES.find((d) => d.key === device).width;
    useEffect(() => {
        const onKey = (e) => e.key === "Escape" && onClose();
        document.addEventListener("keydown", onKey);
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
    }, [onClose]);
    const d = data.details;
    const offices = data.offices.filter((o) => o.isVisible).sort((a, b) => Number(b.isMain) - Number(a.isMain));
    const hidden = data.offices.length - offices.length;

    return (
        <div className="cnv-overlay" role="dialog" aria-modal="true" aria-label="Page preview">
            <div className="cnv-bar">
                <div className="cnv-bar-left"><span className="cnv-live"><i /> Preview</span><small>Your current edits, not the live page.{hidden > 0 && ` ${hidden} hidden office${hidden === 1 ? "" : "s"} not shown.`}</small></div>
                <div className="cnv-devices" role="tablist" aria-label="Screen size">
                    {DEVICES.map((v) => <button key={v.key} type="button" role="tab" aria-selected={device === v.key} className={device === v.key ? "is-on" : ""} onClick={() => setDevice(v.key)}>{v.label}</button>)}
                </div>
                <div className="cnv-bar-right">
                    {previewUrl && <a className="cnv-bar-btn" href={previewUrl} target="_blank" rel="noreferrer">Open saved preview</a>}
                    <button type="button" className="cnv-bar-btn" onClick={onClose}>Close <kbd>Esc</kbd></button>
                </div>
            </div>
            <div className="cnv-stage">
                <div className={`cnv-frame is-${device}`} style={width ? { width } : undefined}>
                    <div className="cnv">
                        <header className="cnv-nav"><b className="cnv-brand"><i />COE-UAS</b><nav aria-label="Site (preview)">{SITE_NAV.map((n) => <span key={n} className={n === "Contact" ? "is-on" : ""}>{n}</span>)}</nav><span className="cnv-cta">Contact us</span></header>
                        <div className="cnv-hero"><div className="cnv-wrap"><p><span>Contact</span> Contact and enquiries</p></div></div>
                        <section className="cnv-sec"><div className="cnv-wrap">
                            <h2>Get in touch</h2>
                            <div className="cnv-group">
                                <h3>Contact details</h3>
                                {d.email && <div className="cnv-row"><b>Email</b><span>{d.email}</span></div>}
                                {d.phone && <div className="cnv-row"><b>Phone</b><span>{d.phone}</span></div>}
                                {d.address && <div className="cnv-row"><b>Address</b><span>{d.address}</span></div>}
                                {d.officeHours && <div className="cnv-row"><b>Office hours</b><span>{d.officeHours}</span></div>}
                                {d.mapUrl && <div className="cnv-row"><b>Map</b><span>View on map</span></div>}
                            </div>
                            {offices.length > 0 && (
                                <div className="cnv-group">
                                    <h3>Offices</h3>
                                    <ul className="cnv-grid">
                                        {offices.map((o) => (
                                            <li key={o.id} className="cnv-card">
                                                <b>{o.name}</b>{o.isMain && <em>Main office</em>}
                                                <span>{o.address}</span>
                                                {o.phone && <small>{o.phone}</small>}{o.email && <small>{o.email}</small>}{o.hours && <small>{o.hours}</small>}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            <div className="cnv-group">
                                <h3>Send an enquiry</h3>
                                <ul className="cnv-grid">{ENQ_TYPES.map((t) => <li key={t.value} className="cnv-card"><b>{t.label}</b><span>Use this form for {t.label.toLowerCase()} questions.</span><span className="cnv-btn">Write to us</span></li>)}</ul>
                            </div>
                        </div></section>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* -------------------------------- the page -------------------------------- */

const pathInfo = (props, url) => props.view || VIEWS.find((v) => (url || "").includes(`/contact/${v.key}`))?.key || "details";
const KEY_LABEL = { details: "Contact details", offices: "Offices", enquiries: "Enquiries" };
const DATA_KEYS = Object.keys(KEY_LABEL);

export default function AdminCOEUASContactandEnquaries() {
    const { props, url } = usePage();
    const live = Boolean(props.contact?.data);
    const dialogTitleId = useId();
    const seed = useRef(live
        ? { data: { details: {}, offices: [], enquiries: [], ...props.contact.data }, history: props.contact.history || [] }
        : { data: sampleData, history: sampleHistory }).current;

    const [saved, setSaved] = useState(() => clone(seed.data));
    const [data, setData] = useState(() => clone(seed.data));
    const [localHistory, setLocalHistory] = useState(seed.history);
    const history = live ? props.contact.history || [] : localHistory;

    const first = pathInfo(props, url);
    const [view, setView] = useState(first);
    const [tab, setTab] = useState(VIEWS.find((v) => v.key === first).tabs[0][0]);
    const [submitted, setSubmitted] = useState(false);
    const [busy, setBusy] = useState(false);
    const [dialog, setDialog] = useState(null);
    const [preview, setPreview] = useState(false);
    const [toast, setToast] = useState(null);
    const busyRef = useRef(false);

    useEffect(() => { const v = pathInfo(props, url); setView(v); setTab(VIEWS.find((x) => x.key === v).tabs[0][0]); }, [props.view, url]);

    const dirty = useMemo(() => !sameJson(data, saved), [data, saved]);
    const allErrors = useMemo(() => validate(data), [data]);
    const errors = useMemo(() => ({ ...(props.errors || {}), ...(submitted ? allErrors : {}) }), [props.errors, submitted, allErrors]);
    const totalErrors = Object.keys(allErrors).length;
    const changedKeys = useMemo(() => DATA_KEYS.filter((k) => !sameJson(data[k], saved[k])), [data, saved]);
    const changedLabels = changedKeys.map((k) => KEY_LABEL[k]);
    const newCount = data.enquiries.filter((x) => x.status === "new").length;

    useEffect(() => {
        if (!toast) return undefined;
        const t = setTimeout(() => setToast(null), 5000);
        return () => clearTimeout(t);
    }, [toast]);

    /* warn before leaving with unsaved changes (moving between the two links is allowed: same page) */
    useEffect(() => {
        const beforeUnload = (e) => { if (dirty) { e.preventDefault(); e.returnValue = ""; } };
        window.addEventListener("beforeunload", beforeUnload);
        const off = router.on("before", (event) => {
            const target = event?.detail?.visit?.url?.pathname || "";
            if (target.startsWith(`${BASE}/contact`)) return undefined;
            if (dirty && !busyRef.current && !window.confirm("You have unsaved changes. Leave this page and discard them?")) return false;
            return undefined;
        });
        return () => { window.removeEventListener("beforeunload", beforeUnload); if (typeof off === "function") off(); };
    }, [dirty]);

    const edit = (fn) => setData((d) => { const copy = clone(d); fn(copy); return copy; });
    const askDelete = (info) => setDialog({ type: "delete", ...info });
    const finishBusy = () => { setBusy(false); busyRef.current = false; };
    const addHistory = (action, label, changes = []) => setLocalHistory((h) => [{ id: Date.now(), user: "You", action, label, at: new Date().toISOString(), changes }, ...h]);

    const jumpToFirstError = () => {
        const key = Object.keys(allErrors)[0];
        if (!key) return;
        setView("details"); setTab(key.startsWith("offices.") ? "offices" : "details");
        setTimeout(() => document.querySelector(".cnt-field.has-error")?.scrollIntoView({ behavior: "smooth", block: "center" }), 200);
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
            setToast({ tone: "ok", text: "Saved. Contact details are now live on the website." });
            finishBusy();
        };
        if (live) router.put(ENDPOINTS.save, payload, { preserveScroll: true, preserveState: true, onSuccess: done, onError: () => { finishBusy(); setSubmitted(true); setToast({ tone: "error", text: "The server rejected some values. Check the highlighted fields." }); } });
        else setTimeout(done, 350);
    };

    const confirmDelete = () => {
        dialog.onConfirm();
        if (!live) addHistory("DELETE", dialog.what, [{ field: "Moved to Trash", from: dialog.what, to: "(deleted)" }]);
        setToast({ tone: "ok", text: `“${dialog.what}” moved to Trash. It leaves the website when you save.` });
        setDialog(null);
    };

    /* live: the server streams the CSV and logs EXPORT. sample: build the CSV here. */
    const exportCsv = ({ type, status, assignee, q, rows }) => {
        const a = document.createElement("a");
        if (live) {
            a.href = `${ENDPOINTS.export}?${new URLSearchParams({ type, status, assignee, q })}`;
        } else {
            const names = Object.fromEntries((sampleCatalog.users).map((u) => [u.id, u.name]));
            const head = ["Reference", "Received", "Type", "Name", "Email", "Organisation", "Subject", "Status", "Assigned to", "Handled", "Message"];
            const body = rows.map((x) => [x.id, x.createdAt, labelOf(ENQ_TYPES, x.enquiryType), x.senderName, x.senderEmail, x.organisation, x.subject, labelOf(ENQ_STATUS, x.status), names[x.assignedTo] || "", x.handledAt, x.message]);
            a.href = URL.createObjectURL(new Blob([[head, ...body].map((r) => r.map(csvCell).join(",")).join("\r\n")], { type: "text/csv;charset=utf-8" }));
            a.download = `coeuas-enquiries-${new Date().toISOString().slice(0, 10)}.csv`;
            addHistory("EXPORT", "Enquiries", [{ field: "Rows", from: "", to: String(rows.length) }]);
        }
        document.body.appendChild(a); a.click(); a.remove();
        setToast({ tone: "ok", text: `Exporting ${rows.length} enquir${rows.length === 1 ? "y" : "ies"}.` });
    };

    useEffect(() => {
        const onKey = (e) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") { e.preventDefault(); save(); } };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    });

    const catalog = { users: [], ...(live ? props.contact.catalog : sampleCatalog) };
    const current = VIEWS.find((v) => v.key === view) || VIEWS[0];
    const tabs = [...current.tabs, ["history", "History"]];
    const ctx = { data, edit, errors, askDelete, catalog };

    return (
        <Ctx.Provider value={ctx}>
            <div className="coeuas-contact">
                <div className="cnt-heading">
                    <div>
                        <h1>{current.title}</h1>
                        <p>{current.text}</p>
                        <div className="cnt-status">
                            <span className={`cnt-pill ${newCount ? "is-new" : "is-ok"}`}>{newCount} new enquir{newCount === 1 ? "y" : "ies"}</span>
                            {dirty && <span className="cnt-pill is-warn">Unsaved: {changedLabels.join(", ")}</span>}
                            {totalErrors > 0 && submitted && <span className="cnt-pill is-danger">{totalErrors} to fix</span>}
                        </div>
                    </div>
                    <div className="cnt-actions">
                        <button type="button" className="cnt-btn-outline" onClick={() => setPreview(true)}><Icon name="eye" size={16} /> Preview</button>
                        <button type="button" className="cnt-btn-dark" onClick={save} disabled={!dirty || busy}><span className="cnt-btn-icon"><Icon name="save" size={16} /></span> {busy ? "Saving..." : "Save changes"}</button>
                    </div>
                </div>

                {!live && <p className="cnt-note"><Icon name="alert" size={16} /><span>Sample data. Every control works, but nothing is stored until your controller sends the <b>contact</b> prop.</span></p>}

                <div className="cnt-tabs" role="tablist" aria-label="Contact and Enquiries editor">
                    {tabs.map(([key, label]) => (
                        <button key={key} type="button" role="tab" aria-selected={tab === key} className={tab === key ? "is-active" : ""} onClick={() => setTab(key)}>
                            {label}
                            {key === "history" && <span className="cnt-badge">{history.length}</span>}
                            {key === "inbox" && newCount > 0 && <span className="cnt-badge">{newCount}</span>}
                            {key === "details" && Object.keys(errors).some((k) => k.startsWith("details.")) && <span className="cnt-badge-error">!</span>}
                            {key === "offices" && Object.keys(errors).some((k) => k.startsWith("offices.")) && <span className="cnt-badge-error">!</span>}
                        </button>
                    ))}
                </div>

                {tab === "history" && <HistoryPanel history={history} />}
                {tab === "details" && <DetailsTab />}
                {tab === "offices" && <OfficesTab />}
                {tab === "inbox" && <InboxTab onExport={exportCsv} />}

                {dirty && (
                    <div className="cnt-savebar" role="region" aria-label="Unsaved changes">
                        <span className="cnt-savebar-text"><i /> {changedLabels.length} area{changedLabels.length === 1 ? "" : "s"} edited, not saved</span>
                        <div>
                            <button type="button" className="cnt-btn-ghost" disabled={busy} onClick={() => { setData(clone(saved)); setSubmitted(false); setToast({ tone: "info", text: "Changes discarded." }); }}>Discard</button>
                            <button type="button" className="cnt-btn-accent" disabled={busy} onClick={save}>{busy ? "Saving..." : "Save changes"}</button>
                        </div>
                    </div>
                )}

                {dialog?.type === "delete" && (
                    <div className="cnt-overlay" onMouseDown={(e) => e.target === e.currentTarget && setDialog(null)}>
                        <div className="cnt-dialog cnt-small" role="alertdialog" aria-modal="true" aria-labelledby={dialogTitleId}>
                            <span className="cnt-dialog-icon"><Icon name="trash" size={22} /></span>
                            <h2 id={dialogTitleId}>Delete “{dialog.what}”?</h2>
                            <p>{dialog.note ? `${dialog.note} ` : ""}It moves to Deleted content, where only the Super Admin can restore or purge it.</p>
                            <div className="cnt-dialog-actions">
                                <button type="button" className="cnt-btn-outline" onClick={() => setDialog(null)} autoFocus>Keep it</button>
                                <button type="button" className="cnt-btn-danger" onClick={confirmDelete}><Icon name="trash" size={15} /> Move to Trash</button>
                            </div>
                        </div>
                    </div>
                )}

                {preview && <PreviewModal data={data} previewUrl={props.contact?.previewUrl} onClose={() => setPreview(false)} />}

                {toast && (
                    <div className={`cnt-toast is-${toast.tone}`} role="status">
                        <Icon name={toast.tone === "error" ? "alert" : "check"} size={16} /><span>{toast.text}</span>
                        <button type="button" aria-label="Dismiss" onClick={() => setToast(null)}><Icon name="close" size={14} /></button>
                    </div>
                )}
            </div>
        </Ctx.Provider>
    );
}

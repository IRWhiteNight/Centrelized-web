import { createContext, useContext, useEffect, useId, useMemo, useRef, useState } from "react";
import { router, usePage } from "@inertiajs/react";
import "../../../css/admin-COEUAS-css/admin-navigation-settings.css";

/* ====================================================================
   COE-UAS ADMIN → NAVIGATION AND SETTINGS      /admin/coeuas/settings/*

   Site map 1.3 (COE-UAS workspace → "Navigation and Settings"):
     Header and footer menus   → menus (location: header | footer | quick_link) + menu_items
     Logo, SEO defaults, social links, footer → site_settings (group + setting_key + setting_value)
     Featured items (use case 2.3)             → featured_items (placement, entity_type, entity_id, sort_order)
   Sidebar links (coeuasRoutes.js):  /settings/menus  ->  Menus tab
                                     /settings/site   ->  Site settings tab
                                     /settings/featured-items  ->  Featured items tab
   Common screens from the document: edit, preview, publish, History tab (audit_logs).
   Media is always chosen from media_assets (logo, favicon, share image).
   Menu items link to pages (menu_items.page_id) or a custom_url; a top-level
   item can be the one highlighted button (menu_items.is_button).

   SAMPLE DATA: the page works today (changes stay on screen only). Return an Inertia
   prop named `site` and it switches to LIVE mode:

   Inertia::render('admin-COEUAS/AdminCOEUASNavigationandSettings', [
       'section' => $section,   // menus | site | featured-items (from the route)
       'site' => [
           'content' => [...], // same shape as `sampleContent` below
           'meta'    => [...], // hasUnpublishedChanges, publishedAt, updatedBy, updatedAt
           'catalog' => ['media' => [], 'pages' => [], 'featured' => []],   // pages: id, title, slug, status; featured: type, id, label
           'history' => [...], // audit_logs rows for menus / menu_items / site_settings
           'previewUrl' => 'https://...', // optional signed preview link
       ],
   ]);

   Your existing GET route already maps /admin/coeuas/settings/{section?} to this component.
   Add the two write routes: Route::put('/admin/coeuas/settings', ...) and
   Route::post('/admin/coeuas/settings/publish', ...). Keep 'publish' out of the {section} pattern.
   The controller must: scope every row by the COE-UAS site_id, store each list's
   array order as sort_order, store each setting as a site_settings row, write
   audit_logs, and only apply the draft to the public site on publish.
==================================================================== */

const BASE = "/admin/coeuas"; // keep in sync with coeuasRoutes.js
const ENDPOINTS = {
    save: `${BASE}/settings`, // PUT   { content }   save as draft
    publish: `${BASE}/settings/publish`, // POST  { content }   save + publish now
    upload: `${BASE}/media/upload`, // POST  multipart { file }
};

/* the three menus (menus.location in the ERD) */
const AREAS = [
    {
        key: "header",
        label: "Header menu",
        hint: "Top bar of every page",
        text: "The main menu across the top of the public site. An item can open a dropdown, and one item can be the highlighted button.",
        topWord: "menu item",
        plural: "Menu items",
        newTop: "New menu item",
        dropdown: true,
        button: true,
        limit: 8,
    },
    {
        key: "footer",
        label: "Footer menu",
        hint: "Link columns in the footer",
        text: "Columns of links at the bottom of every page. Each top-level item is a column heading, and its links sit underneath.",
        topWord: "column",
        plural: "Columns",
        newTop: "New column",
        dropdown: true,
        button: false,
        limit: 5,
    },
    {
        key: "quick_link",
        label: "Quick links",
        hint: "One row of short links",
        text: "A single row of short links, such as the privacy policy and sitemap. No dropdowns.",
        topWord: "link",
        plural: "Links",
        newTop: "New link",
        dropdown: false,
        button: false,
        limit: 8,
    },
];

/* site_settings groups */
const GROUPS = [
    { key: "identity", label: "Site identity", hint: "Name, logo and favicon" },
    { key: "foot", label: "Footer and contact", hint: "Contact details and footer text" },
    { key: "social", label: "Social links", hint: "Five platforms" },
    { key: "seo", label: "Search and sharing", hint: "Default title, description, image" },
];

const LINK_TYPES = [
    { value: "page", label: "A page of this site" },
    { value: "url", label: "A web address" },
    { value: "none", label: "No link (heading only)" },
];

const SOCIALS = [
    { key: "facebook", label: "Facebook" },
    { key: "instagram", label: "Instagram" },
    { key: "linkedin", label: "LinkedIn" },
    { key: "youtube", label: "YouTube" },
    { key: "x", label: "X" },
];

const LIMITS = { children: 8, featured: 6 };

/* featured_items.placement values and entity types */
const PLACEMENTS = [
    { value: "home_featured", label: "Home: featured research and members" },
    { value: "home_highlights", label: "Home: highlights, achievements and partners" },
    { value: "home_news", label: "Home: latest news and activities" },
];
const ENTITY_LABELS = { member: "Member", project: "Project", post: "News", partner: "Partner" };
const YEAR_NOW = new Date().getFullYear();

const MIN = 60 * 1000;
const NOW = Date.now();
const minsAgo = (m) => new Date(NOW - m * MIN).toISOString();
let counter = 0;
const uid = () => `n${Date.now().toString(36)}${(counter += 1)}`;

/* ------------------------------ sample data ------------------------------ */

const item = (id, parentId, label, pageId, extra = {}) => ({
    id,
    parentId,
    label,
    linkType: pageId ? "page" : "none",
    pageId: pageId || null,
    customUrl: "",
    isButton: false,
    isVisible: true,
    ...extra,
});

const sampleContent = {
    menus: {
        header: [
            item("h1", null, "Home", 1),
            item("h2", null, "About", 2),
            item("h2a", "h2", "History and Milestones", 9),
            item("h2b", "h2", "Organisation and Leadership", 10),
            item("h2c", "h2", "Awards and Recognition", 11),
            item("h3", null, "People", 3),
            item("h3a", "h3", "Member directory", 12),
            item("h3b", "h3", "Postgraduate students", 13),
            item("h4", null, "Research and Innovation", 4),
            item("h5", null, "Publications", 5),
            item("h6", null, "Facilities", 6),
            item("h6a", "h6", "Training courses and calendar", 14),
            item("h7", null, "Engagement", 7),
            item("h7a", "h7", "News and activities", 15),
            item("h8", null, "Contact", 8),
            item("h9", null, "Contact us", 8, { isButton: true }),
        ],
        footer: [
            item("f1", null, "Explore", null),
            item("f1a", "f1", "About", 2),
            item("f1b", "f1", "People", 3),
            item("f1c", "f1", "Research and Innovation", 4),
            item("f1d", "f1", "Publications and Impact", 5),
            item("f2", null, "Work with us", null),
            item("f2a", "f2", "Training courses and calendar", 14),
            item("f2b", "f2", "News and activities", 15),
            item("f2c", "f2", "Contact", 8),
        ],
        quick_link: [
            item("q1", null, "Privacy policy", 16),
            item("q2", null, "Sitemap", 17),
            { ...item("q3", null, "UniMAP", null), linkType: "url", customUrl: "https://www.unimap.edu.my" },
        ],
    },
    settings: {
        identity: {
            siteName: "Centre of Excellence for Unmanned Aerial Systems",
            shortName: "COE-UAS",
            tagline: "Research, innovation and training in unmanned aerial systems.",
            logoMediaId: 1,
            faviconMediaId: 1,
        },
        foot: {
            contactEmail: "coe-uas@unimap.edu.my",
            phone: "+60 4-123 4567",
            address: "Universiti Malaysia Perlis (UniMAP), Kampus Pauh Putra, 02600 Arau, Perlis",
            blurb: "A UniMAP centre that brings researchers, engineers and students together around unmanned aerial technology.",
            copyright: `© ${YEAR_NOW} COE-UAS, Universiti Malaysia Perlis. All rights reserved.`,
            showSocial: true,
            showQuickLinks: true,
        },
        social: {
            facebook: "",
            instagram: "",
            linkedin: "https://www.linkedin.com/company/coe-uas",
            youtube: "",
            x: "",
        },
        seo: {
            titleSuffix: " | COE-UAS",
            defaultDescription: "The Centre of Excellence for Unmanned Aerial Systems at UniMAP: research, publications, facilities, training and industry engagement.",
            shareMediaId: 2,
            indexing: true,
        },
    },
    featured: [
        { id: "ft1", placement: "home_featured", entityType: "member", entityId: 2 },
        { id: "ft2", placement: "home_featured", entityType: "project", entityId: 1 },
        { id: "ft3", placement: "home_highlights", entityType: "partner", entityId: 1 },
        { id: "ft4", placement: "home_news", entityType: "post", entityId: 1 },
    ],
};

const sampleMeta = {
    hasUnpublishedChanges: false,
    publishedAt: minsAgo(60 * 30),
    updatedBy: "Aisyah Rahman",
    updatedAt: minsAgo(60 * 30),
};

const sampleCatalog = {
    media: [
        { id: 1, name: "coe-uas-logo.png", type: "image", alt: "COE-UAS logo", size: "0.1 MB", url: null },
        { id: 2, name: "centre-hangar.jpg", type: "image", alt: "Centre test hangar", size: "1.6 MB", url: null },
        { id: 3, name: "training-session.jpg", type: "image", alt: "Drone training session", size: "1.1 MB", url: null },
    ],
    pages: [
        { id: 1, title: "Home", slug: "/", status: "published" },
        { id: 2, title: "About", slug: "/about", status: "published" },
        { id: 3, title: "People", slug: "/people", status: "published" },
        { id: 4, title: "Research and Innovation", slug: "/research", status: "published" },
        { id: 5, title: "Publications and Impact", slug: "/publications", status: "published" },
        { id: 6, title: "Facilities and Services", slug: "/facilities", status: "published" },
        { id: 7, title: "Engagement", slug: "/engagement", status: "published" },
        { id: 8, title: "Contact", slug: "/contact", status: "published" },
        { id: 9, title: "History and Milestones", slug: "/about/history", status: "published" },
        { id: 10, title: "Organisation and Leadership", slug: "/about/organisation", status: "published" },
        { id: 11, title: "Awards and Recognition", slug: "/about/awards", status: "published" },
        { id: 12, title: "Member directory", slug: "/people/members", status: "published" },
        { id: 13, title: "Postgraduate students", slug: "/people/postgraduate", status: "published" },
        { id: 14, title: "Training courses and calendar", slug: "/facilities/training", status: "published" },
        { id: 15, title: "News and activities", slug: "/engagement/news", status: "published" },
        { id: 16, title: "Privacy policy", slug: "/privacy", status: "draft" },
        { id: 17, title: "Sitemap", slug: "/sitemap", status: "published" },
    ],
    featured: [
        { type: "member", id: 1, label: "Prof. Dr. Ahmad Zaki" },
        { type: "member", id: 2, label: "Dr. Nurul Huda" },
        { type: "project", id: 1, label: "Autonomous survey drone platform" },
        { type: "post", id: 1, label: "Training programme opens for 2027" },
        { type: "partner", id: 1, label: "Civil Aviation Authority of Malaysia" },
    ],
};

const sampleHistory = [
    { id: 3, user: "Aisyah Rahman", action: "PUBLISH", label: "Header menu", at: minsAgo(60 * 30), changes: [{ field: "Header menu", from: "Previous version", to: "Updated" }] },
    { id: 2, user: "Aisyah Rahman", action: "UPDATE", label: "Site identity", at: minsAgo(60 * 31), changes: [] },
    { id: 1, user: "Hafiz Roslan", action: "CREATE", label: "Footer menu", at: minsAgo(60 * 24 * 8), changes: [] },
];

/* ------------------------------- helpers -------------------------------- */

const clone = (v) => JSON.parse(JSON.stringify(v));
const sameJson = (a, b) => JSON.stringify(a) === JSON.stringify(b);

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

const move = (list, from, to) => {
    if (to < 0 || to >= list.length) return;
    const [it] = list.splice(from, 1);
    list.splice(to, 0, it);
};

const emailOk = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
const socialOk = (v) => /^https:\/\/[^\s/]+\.[^\s]+$/i.test(v.trim());
const linkOk = (v) => /^(\/\S*|https?:\/\/\S+|mailto:\S+|tel:[+0-9\s-]+)$/i.test(v.trim());

/* menu helpers: the ERD stores parent_id; array order is sort_order; two levels only */
const childOf = (items, n) => Boolean(n.parentId) && items.some((x) => x.id === n.parentId);
const parentKey = (items, n) => (childOf(items, n) ? n.parentId : null);
const kidsOf = (items, id) => items.filter((c) => c.parentId === id);

function ordered(items) {
    const out = [];
    items.filter((n) => !childOf(items, n)).forEach((p) => {
        out.push({ node: p, depth: 0 });
        kidsOf(items, p.id).forEach((c) => out.push({ node: c, depth: 1 }));
    });
    return out;
}

const liveTree = (items) =>
    items.filter((n) => !childOf(items, n) && n.isVisible).map((n) => ({ node: n, kids: kidsOf(items, n.id).filter((c) => c.isVisible) }));

/* ------------------------------ validation ------------------------------- */

function validate(f) {
    const e = {};
    const need = (key, value, msg) => { if (!String(value ?? "").trim()) e[key] = msg; };

    AREAS.forEach((a) => {
        const items = f.menus[a.key];
        const tops = items.filter((n) => !childOf(items, n));
        if (tops.length > a.limit) e[`${a.key}.limit`] = `Keep this menu to ${a.limit} ${a.topWord}s or fewer.`;
        if (a.key === "header" && !tops.some((n) => n.isVisible)) e["header.empty"] = "Show at least one item in the header menu.";

        let buttons = 0;
        items.forEach((n) => {
            need(`${a.key}.${n.id}.label`, n.label, "Give the item a label.");
            if (n.linkType === "page" && !n.pageId) e[`${a.key}.${n.id}.page`] = "Choose the page to open.";
            if (n.linkType === "url") {
                if (!n.customUrl.trim()) e[`${a.key}.${n.id}.url`] = "Enter the address.";
                else if (!linkOk(n.customUrl)) e[`${a.key}.${n.id}.url`] = "Use /page, https://, mailto: or tel:.";
            }
            if (n.linkType === "none" && kidsOf(items, n.id).length === 0) e[`${a.key}.${n.id}.link`] = "Add a link, or put sub-items under this heading.";
            if (n.isButton) {
                buttons += 1;
                if (buttons > 1) e[`${a.key}.${n.id}.button`] = "Only one item can be the button.";
            }
        });
    });

    const seen = new Set();
    f.featured.forEach((it) => {
        const k = `${it.placement}|${it.entityType}|${it.entityId}`;
        if (!it.entityId) e[`featured.${it.id}.entity`] = "Choose what to feature.";
        else if (seen.has(k)) e[`featured.${it.id}.entity`] = "This is already featured here.";
        seen.add(k);
    });
    PLACEMENTS.forEach((pl) => {
        if (f.featured.filter((it) => it.placement === pl.value).length > LIMITS.featured) e[`featured.${pl.value}`] = `Keep this list to ${LIMITS.featured} items or fewer.`;
    });

    const s = f.settings;
    need("identity.siteName", s.identity.siteName, "Write the site name.");
    need("identity.shortName", s.identity.shortName, "Write the short name shown in the header.");
    if (s.identity.shortName.length > 30) e["identity.shortName"] = "Keep the short name under 30 characters.";
    if (s.identity.siteName.length > 120) e["identity.siteName"] = "Keep the site name under 120 characters.";
    if (s.identity.tagline.length > 120) e["identity.tagline"] = "Keep the tagline under 120 characters.";

    if (s.foot.contactEmail.trim() && !emailOk(s.foot.contactEmail)) e["foot.contactEmail"] = "Enter a valid email address.";
    need("foot.copyright", s.foot.copyright, "Write the copyright line.");
    if (s.foot.blurb.length > 200) e["foot.blurb"] = "Keep the footer text under 200 characters.";

    SOCIALS.forEach(({ key }) => {
        const v = s.social[key].trim();
        if (v && !socialOk(v)) e[`social.${key}`] = "Use the full address, starting with https://.";
    });

    if (s.seo.titleSuffix.length > 30) e["seo.titleSuffix"] = "Keep the suffix under 30 characters.";
    need("seo.defaultDescription", s.seo.defaultDescription, "Write the default description.");
    if (s.seo.defaultDescription.length > 160) e["seo.defaultDescription"] = "Keep the description under 160 characters.";
    return e;
}

const sectionOfKey = (key) => key.split(".")[0];

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
        corner: <path d="M5 4v8a3 3 0 0 0 3 3h11m-4-4 4 4-4 4" />,
        link: <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />,
        menu: <path d="M4 7h16M4 12h16M4 17h16" />,
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

function Field({ label, errorKey, value, onChange, textarea, max, hint, placeholder, type = "text", rows = 3 }) {
    const { errors } = useCtx();
    const errId = useId();
    const error = errorKey ? errors[errorKey] : null;
    const Tag = textarea ? "textarea" : "input";
    return (
        <label className={`cn-field ${error ? "has-error" : ""}`}>
            <span className="cn-field-top">
                <span>{label}</span>
                {max && <small className={(value || "").length > max ? "is-over" : ""}>{(value || "").length}/{max}</small>}
            </span>
            <Tag
                className="cn-input"
                type={textarea ? undefined : type}
                rows={textarea ? rows : undefined}
                value={value ?? ""}
                placeholder={placeholder}
                aria-invalid={error ? "true" : undefined}
                aria-describedby={error ? errId : undefined}
                onChange={(e) => onChange(e.target.value)}
            />
            {hint && !error && <em className="cn-hint">{hint}</em>}
            {error && <em className="cn-error" id={errId}><Icon name="alert" size={13} /> {error}</em>}
        </label>
    );
}

function Select({ label, value, options, onChange, errorKey, empty, disabled, hint }) {
    const { errors } = useCtx();
    const error = errorKey ? errors[errorKey] : null;
    return (
        <label className={`cn-field ${error ? "has-error" : ""}`}>
            <span className="cn-field-top"><span>{label}</span></span>
            <select className="cn-input" value={value ?? ""} disabled={disabled} onChange={(e) => onChange(e.target.value)}>
                {empty && <option value="">{empty}</option>}
                {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            {hint && !error && <em className="cn-hint">{hint}</em>}
            {error && <em className="cn-error"><Icon name="alert" size={13} /> {error}</em>}
        </label>
    );
}

function Switch({ checked, onChange, label, disabled }) {
    return (
        <label className={`cn-switch ${disabled ? "is-disabled" : ""}`}>
            <input type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
            <i aria-hidden="true" />
            <span>{label}</span>
        </label>
    );
}

function Mover({ index, count, onMove, onDelete, deleteLabel }) {
    return (
        <div className="cn-mover">
            <button type="button" className="cn-iconbtn" disabled={index === 0} onClick={() => onMove(index - 1)} aria-label="Move up"><Icon name="up" size={16} /></button>
            <button type="button" className="cn-iconbtn" disabled={index === count - 1} onClick={() => onMove(index + 1)} aria-label="Move down"><Icon name="down" size={16} /></button>
            <button type="button" className="cn-iconbtn is-danger" onClick={onDelete} aria-label={deleteLabel}><Icon name="trash" size={16} /></button>
        </div>
    );
}

function PanelHead({ title, text }) {
    return (
        <div className="cn-panel-head">
            <div>
                <h2>{title}</h2>
                <p>{text}</p>
            </div>
        </div>
    );
}

function MediaSlot({ label, mediaId, onPick, onClear }) {
    const { media } = useCtx();
    const found = media.find((m) => m.id === mediaId);
    return (
        <div className="cn-media">
            <span className="cn-media-label">{label}</span>
            <div className="cn-media-box">
                <span className={`cn-thumb ${found ? "has-item" : ""}`}>{found?.url ? <img src={found.url} alt="" /> : <Icon name="image" size={20} />}</span>
                <span className="cn-media-text">
                    <strong>{found ? found.name : "Nothing selected"}</strong>
                    <small>{found ? found.alt || "No alt text yet" : "Choose from the Media Library"}</small>
                </span>
                <button type="button" className="cn-btn-small" onClick={onPick}>{found ? "Change" : "Choose"}</button>
                {found && <button type="button" className="cn-iconbtn" aria-label="Remove image" onClick={onClear}><Icon name="close" size={15} /></button>}
            </div>
        </div>
    );
}

/* ------------------------------ menu editor ------------------------------ */

function AreaEditor({ areaKey }) {
    const { form, edit, errors, askDelete, pages } = useCtx();
    const area = AREAS.find((a) => a.key === areaKey);
    const items = form.menus[areaKey];
    const rows = ordered(items);
    const tops = items.filter((n) => !childOf(items, n));
    const pageOptions = pages.map((p) => ({ value: String(p.id), label: `${p.title} (${p.slug})${p.status === "published" ? "" : ` · ${p.status}`}` }));

    const setItem = (id, patch) => edit((d) => { Object.assign(d.menus[areaKey].find((x) => x.id === id), patch); });
    const siblings = (n) => items.filter((x) => parentKey(items, x) === parentKey(items, n));

    const moveSibling = (n, dir) =>
        edit((d) => {
            const list = d.menus[areaKey];
            const sib = list.filter((x) => parentKey(list, x) === parentKey(list, n));
            const other = sib[sib.findIndex((x) => x.id === n.id) + dir];
            if (!other) return;
            const a = list.findIndex((x) => x.id === n.id);
            const b = list.findIndex((x) => x.id === other.id);
            [list[a], list[b]] = [list[b], list[a]];
        });

    const addTop = () =>
        edit((d) => {
            d.menus[areaKey].push({ id: uid(), parentId: null, label: "", linkType: areaKey === "footer" ? "none" : "page", pageId: null, customUrl: "", isButton: false, isVisible: true });
        });

    const addChild = (parent) =>
        edit((d) => {
            d.menus[areaKey].push({ id: uid(), parentId: parent.id, label: "", linkType: "page", pageId: null, customUrl: "", isButton: false, isVisible: true });
        });

    const setParent = (n, pid) =>
        edit((d) => {
            const x = d.menus[areaKey].find((i) => i.id === n.id);
            x.parentId = pid || null;
            if (pid) x.isButton = false;
        });

    const pickPage = (n, value) => {
        const id = value ? Number(value) : null;
        const pg = pages.find((p) => p.id === id);
        setItem(n.id, { pageId: id, ...(pg && !n.label.trim() ? { label: pg.title } : {}) });
    };

    const remove = (n) =>
        askDelete({
            what: n.label || "this item",
            where: area.label,
            note: kidsOf(items, n.id).length > 0 ? "Its sub-items move up to the top level." : undefined,
            onConfirm: () =>
                edit((d) => {
                    const list = d.menus[areaKey];
                    list.forEach((x) => { if (x.parentId === n.id) x.parentId = null; });
                    d.menus[areaKey] = list.filter((x) => x.id !== n.id);
                }),
        });

    const warningFor = (n) => {
        if (n.linkType !== "page" || !n.pageId) return null;
        const pg = pages.find((p) => p.id === n.pageId);
        if (!pg) return "This page no longer exists. Choose another page.";
        if (pg.status !== "published") return `“${pg.title}” is ${pg.status}. Visitors reach an error page until it is published.`;
        return null;
    };

    return (
        <>
            <PanelHead title={area.label} text={area.text} />
            {(errors[`${areaKey}.limit`] || errors[`${areaKey}.empty`]) && (
                <p className="cn-notice"><Icon name="alert" size={15} /> {errors[`${areaKey}.limit`] || errors[`${areaKey}.empty`]}</p>
            )}

            <div className="cn-block">
                <div className="cn-block-head">
                    <div><h3>{area.plural}</h3><small>{tops.length} of {area.limit} · {items.length} in total</small></div>
                    <button type="button" className="cn-btn-small" disabled={tops.length >= area.limit} onClick={addTop}><Icon name="plus" size={15} /> Add {area.topWord}</button>
                </div>
                {items.length === 0 && <p className="cn-empty">Nothing here yet. Add the first {area.topWord}.</p>}

                <ol className="cn-list">
                    {rows.map(({ node: n, depth }) => {
                        const kids = kidsOf(items, n.id);
                        const sib = siblings(n);
                        const index = sib.findIndex((x) => x.id === n.id);
                        const warn = warningFor(n);
                        const canParent = area.dropdown && kids.length === 0 && !n.isButton;
                        const parentOptions = tops.filter((x) => x.id !== n.id && !x.isButton).map((x) => ({ value: x.id, label: x.label || "Unnamed item" }));
                        return (
                            <li key={n.id} className={`cn-card cn-item ${depth === 0 ? "is-root" : ""} ${n.isVisible ? "" : "is-hidden"}`} style={{ "--depth": depth }}>
                                <div className="cn-card-top">
                                    {depth > 0 && <span className="cn-branch" aria-hidden="true"><Icon name="corner" size={16} /></span>}
                                    <strong>{n.label || (depth ? "New link" : area.newTop)}</strong>
                                    {n.isButton && <span className="cn-tag">Button</span>}
                                    {!n.isVisible && <span className="cn-pill is-off">Hidden</span>}
                                    {kids.length > 0 && <span className="cn-pill">{kids.length} {area.key === "footer" ? "link" : "sub-item"}{kids.length === 1 ? "" : "s"}</span>}
                                    <Mover index={index} count={sib.length} deleteLabel={`Delete ${n.label || "item"}`} onMove={(to) => moveSibling(n, to - index)} onDelete={() => remove(n)} />
                                </div>

                                <div className="cn-grid-3">
                                    <Field label="Label" errorKey={`${areaKey}.${n.id}.label`} value={n.label} onChange={(v) => setItem(n.id, { label: v })} />
                                    <Select label="Link to" errorKey={`${areaKey}.${n.id}.link`} value={n.linkType} options={LINK_TYPES} onChange={(v) => setItem(n.id, { linkType: v })} />
                                    {n.linkType === "page" && (
                                        <Select label="Page" empty="Choose a page" errorKey={`${areaKey}.${n.id}.page`} value={n.pageId ? String(n.pageId) : ""} options={pageOptions} onChange={(v) => pickPage(n, v)} />
                                    )}
                                    {n.linkType === "url" && (
                                        <Field label="Address" placeholder="https://" errorKey={`${areaKey}.${n.id}.url`} value={n.customUrl} onChange={(v) => setItem(n.id, { customUrl: v })} />
                                    )}
                                    {n.linkType === "none" && (
                                        <div className="cn-field"><span className="cn-field-top"><span>Page</span></span><span className="cn-input is-readonly">{kids.length ? "Opens its sub-items" : "Nothing to open"}</span></div>
                                    )}
                                </div>

                                {warn && <p className="cn-warn"><Icon name="alert" size={14} /> {warn}</p>}

                                <div className="cn-grid-2 is-controls">
                                    {area.dropdown ? (
                                        <Select
                                            label="Sits under"
                                            value={n.parentId && childOf(items, n) ? n.parentId : ""}
                                            empty="Top level"
                                            options={parentOptions}
                                            disabled={!canParent}
                                            hint={kids.length > 0 ? "Remove or move its sub-items first." : n.isButton ? "A button stays at the top level." : undefined}
                                            onChange={(v) => setParent(n, v)}
                                        />
                                    ) : <span />}
                                    <div className="cn-toggles">
                                        <Switch checked={n.isVisible} onChange={(v) => setItem(n.id, { isVisible: v })} label={n.isVisible ? "Shown on the site" : "Hidden from the site"} />
                                        {area.button && depth === 0 && (
                                            <Switch checked={n.isButton} disabled={kids.length > 0} onChange={(v) => setItem(n.id, { isButton: v })} label="Show as button" />
                                        )}
                                        {errors[`${areaKey}.${n.id}.button`] && <em className="cn-error"><Icon name="alert" size={13} /> {errors[`${areaKey}.${n.id}.button`]}</em>}
                                    </div>
                                </div>

                                {area.dropdown && depth === 0 && !n.isButton && (
                                    <div className="cn-card-foot">
                                        <button type="button" className="cn-btn-small" disabled={kids.length >= LIMITS.children} onClick={() => addChild(n)}>
                                            <Icon name="plus" size={15} /> Add {area.key === "footer" ? "link" : "sub-item"}
                                        </button>
                                    </div>
                                )}
                            </li>
                        );
                    })}
                </ol>
            </div>
        </>
    );
}

/* ----------------------------- settings panels ---------------------------- */

function IdentityPanel() {
    const { form, edit, pickMedia } = useCtx();
    const s = form.settings.identity;
    const set = (k) => (v) => edit((d) => { d.settings.identity[k] = v; });
    return (
        <>
            <PanelHead title="Site identity" text="The name, logo and favicon visitors see in the header and in the browser tab." />
            <div className="cn-stack">
                <Field label="Site name" max={120} errorKey="identity.siteName" value={s.siteName} onChange={set("siteName")} />
                <div className="cn-grid-2">
                    <Field label="Short name" max={30} errorKey="identity.shortName" value={s.shortName} onChange={set("shortName")} hint="Shown next to the logo in the header." />
                    <Field label="Tagline" max={120} errorKey="identity.tagline" value={s.tagline} onChange={set("tagline")} />
                </div>
                <div className="cn-grid-2">
                    <MediaSlot label="Logo" mediaId={s.logoMediaId} onPick={() => pickMedia({ type: "image", onSelect: (m) => set("logoMediaId")(m.id) })} onClear={() => set("logoMediaId")(null)} />
                    <MediaSlot label="Favicon" mediaId={s.faviconMediaId} onPick={() => pickMedia({ type: "image", onSelect: (m) => set("faviconMediaId")(m.id) })} onClear={() => set("faviconMediaId")(null)} />
                </div>
            </div>
        </>
    );
}

function FootPanel() {
    const { form, edit } = useCtx();
    const s = form.settings.foot;
    const set = (k) => (v) => edit((d) => { d.settings.foot[k] = v; });
    return (
        <>
            <PanelHead title="Footer and contact" text="What appears at the very bottom of every page. Offices and enquiry types are managed in Contact and Enquiries." />
            <div className="cn-stack">
                <Field label="Footer text" textarea rows={3} max={200} errorKey="foot.blurb" value={s.blurb} onChange={set("blurb")} />
                <div className="cn-grid-2">
                    <Field label="Contact email" type="email" errorKey="foot.contactEmail" value={s.contactEmail} onChange={set("contactEmail")} />
                    <Field label="Phone" value={s.phone} onChange={set("phone")} />
                </div>
                <Field label="Address" textarea rows={2} value={s.address} onChange={set("address")} />
                <Field label="Copyright line" max={160} errorKey="foot.copyright" value={s.copyright} onChange={set("copyright")} />
                <div className="cn-toggles is-row">
                    <Switch checked={s.showQuickLinks} onChange={set("showQuickLinks")} label="Show the quick links row" />
                    <Switch checked={s.showSocial} onChange={set("showSocial")} label="Show social icons" />
                </div>
            </div>
        </>
    );
}

function SocialPanel() {
    const { form, edit } = useCtx();
    const s = form.settings.social;
    return (
        <>
            <PanelHead title="Social links" text="Leave a platform empty to hide its icon. Icons appear in the footer when they are switched on." />
            <div className="cn-stack">
                {SOCIALS.map(({ key, label }) => (
                    <Field key={key} label={label} placeholder="https://" errorKey={`social.${key}`} value={s[key]} onChange={(v) => edit((d) => { d.settings.social[key] = v; })} />
                ))}
            </div>
        </>
    );
}

function SeoPanel() {
    const { form, edit, pickMedia } = useCtx();
    const s = form.settings.seo;
    const set = (k) => (v) => edit((d) => { d.settings.seo[k] = v; });
    return (
        <>
            <PanelHead title="Search and sharing" text="Defaults for any page that has no title, description or share image of its own." />
            <div className="cn-stack">
                <Field label="Title suffix" max={30} errorKey="seo.titleSuffix" value={s.titleSuffix} onChange={set("titleSuffix")} hint="Added after every page title." />
                <Field label="Default description" textarea rows={3} max={160} errorKey="seo.defaultDescription" value={s.defaultDescription} onChange={set("defaultDescription")} />
                <MediaSlot label="Default share image" mediaId={s.shareMediaId} onPick={() => pickMedia({ type: "image", onSelect: (m) => set("shareMediaId")(m.id) })} onClear={() => set("shareMediaId")(null)} />
                <div className="cn-snippet" aria-label="Search result preview">
                    <small>coeuas.example.my › about</small>
                    <strong>{`About COE-UAS${s.titleSuffix}`}</strong>
                    <p>{s.defaultDescription || "The description appears here."}</p>
                </div>
                <Switch checked={s.indexing} onChange={set("indexing")} label="Let search engines list this site" />
                {!s.indexing && <p className="cn-warn"><Icon name="alert" size={14} /> Search engines are asked to skip the whole site. Turn this on before launch.</p>}
            </div>
        </>
    );
}

const GROUP_PANELS = { identity: IdentityPanel, foot: FootPanel, social: SocialPanel, seo: SeoPanel };

/* ------------------------------ featured items ---------------------------- */

function FeaturedEditor() {
    const { form, edit, errors, askDelete, featuredCatalog } = useCtx();
    const items = form.featured;
    const options = featuredCatalog.map((o) => ({ value: `${o.type}:${o.id}`, label: `${ENTITY_LABELS[o.type] || o.type}: ${o.label}` }));

    const setEntity = (id, v) =>
        edit((d) => {
            const x = d.featured.find((i) => i.id === id);
            const [type, ref] = v ? v.split(/:(.+)/) : ["", ""];
            x.entityType = type || "";
            x.entityId = ref ? Number(ref) : null;
        });

    const swap = (rows, pos, to) =>
        edit((d) => {
            const a = d.featured.findIndex((x) => x.id === rows[pos].it.id);
            const b = d.featured.findIndex((x) => x.id === rows[to].it.id);
            [d.featured[a], d.featured[b]] = [d.featured[b], d.featured[a]];
        });

    return (
        <>
            <PanelHead title="Featured items" text="Pin members, projects, news and partners to the Home page lists that are picked by hand. The first item shows first." />
            {PLACEMENTS.map((pl) => {
                const rows = items.map((it, i) => ({ it, i })).filter(({ it }) => it.placement === pl.value);
                return (
                    <div key={pl.value} className="cn-block">
                        <div className="cn-block-head">
                            <div><h3>{pl.label}</h3><small>{rows.length} of {LIMITS.featured}</small></div>
                            <button type="button" className="cn-btn-small" disabled={rows.length >= LIMITS.featured} onClick={() => edit((d) => { d.featured.push({ id: uid(), placement: pl.value, entityType: "", entityId: null }); })}><Icon name="plus" size={15} /> Add item</button>
                        </div>
                        {errors[`featured.${pl.value}`] && <p className="cn-notice"><Icon name="alert" size={15} /> {errors[`featured.${pl.value}`]}</p>}
                        {rows.length === 0 && <p className="cn-empty">Nothing pinned here yet.</p>}
                        <ol className="cn-list">
                            {rows.map(({ it }, pos) => {
                                const label = featuredCatalog.find((o) => o.type === it.entityType && o.id === it.entityId)?.label;
                                return (
                                    <li key={it.id} className="cn-card">
                                        <div className="cn-card-top">
                                            <span className="cn-no">{pos + 1}</span>
                                            <strong>{label || "New featured item"}</strong>
                                            <Mover index={pos} count={rows.length} deleteLabel={`Remove ${label || "item"}`} onMove={(to) => swap(rows, pos, to)}
                                                onDelete={() => askDelete({ what: label || "this item", where: pl.label, onConfirm: () => edit((d) => { d.featured = d.featured.filter((x) => x.id !== it.id); }) })} />
                                        </div>
                                        <Select label="Feature" empty="Choose an item" errorKey={`featured.${it.id}.entity`} value={it.entityId ? `${it.entityType}:${it.entityId}` : ""} options={options} onChange={(v) => setEntity(it.id, v)} />
                                    </li>
                                );
                            })}
                        </ol>
                    </div>
                );
            })}
        </>
    );
}

/* ---------------------------- history / media ----------------------------- */

const ACTION_TONE = { CREATE: "is-new", UPDATE: "is-info", PUBLISH: "is-ok", UNPUBLISH: "is-warn", DELETE: "is-danger", RESTORE: "is-ok" };

function HistoryPanel({ history }) {
    return (
        <div className="cn-panel cn-narrow">
            <PanelHead title="History" text="Every change to menus and settings, from the audit log." />
            {history.length === 0 && <p className="cn-empty">Nothing recorded yet.</p>}
            <ol className="cn-history">
                {history.map((h) => (
                    <li key={h.id}>
                        <span className={`cn-pill ${ACTION_TONE[h.action] || "is-info"}`}>{h.action}</span>
                        <div>
                            <strong>{h.label}</strong>
                            <small>{h.user} · {timeAgo(h.at)}</small>
                            {h.changes?.length > 0 && <ul>{h.changes.map((c, i) => <li key={i}>{c.field}: {c.from} → {c.to}</li>)}</ul>}
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
        <div className="cn-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
            <div className="cn-dialog" role="dialog" aria-modal="true" aria-labelledby={titleId}>
                <div className="cn-dialog-head">
                    <h2 id={titleId}>Media Library</h2>
                    <button type="button" className="cn-iconbtn" aria-label="Close" onClick={onClose}><Icon name="close" size={16} /></button>
                </div>
                <div className="cn-media-grid">
                    {list.map((m) => (
                        <button key={m.id} type="button" className="cn-media-item" onClick={() => { state.onSelect(m); onClose(); }}>
                            <span className="cn-media-preview">{m.url ? <img src={m.url} alt="" /> : <Icon name="image" size={26} />}</span>
                            <strong>{m.name}</strong>
                            <small>{m.size}</small>
                        </button>
                    ))}
                    {list.length === 0 && <p className="cn-empty">The library has no images yet.</p>}
                </div>
                <div className="cn-dialog-actions">
                    <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => { if (e.target.files[0]) onUpload(e.target.files[0]); e.target.value = ""; }} />
                    <button type="button" className="cn-btn-outline" onClick={() => fileRef.current?.click()}><Icon name="upload" size={15} /> Upload new</button>
                    <button type="button" className="cn-btn-dark" onClick={onClose}>Done</button>
                </div>
            </div>
        </div>
    );
}

/* ------------------ preview: header and footer, public look ------------------ */

const DEVICES = [
    { key: "desktop", label: "Desktop", width: null },
    { key: "tablet", label: "Tablet", width: 820 },
    { key: "mobile", label: "Mobile", width: 390 },
];

function NavPreview({ form, media, onClose }) {
    const [device, setDevice] = useState("desktop");
    const headerTree = useMemo(() => liveTree(form.menus.header), [form.menus.header]);
    const [open, setOpen] = useState(() => headerTree.find((t) => !t.node.isButton && t.kids.length)?.node.id ?? null);
    const [burger, setBurger] = useState(false);
    const width = DEVICES.find((d) => d.key === device).width;

    const s = form.settings;
    const logo = media.find((m) => m.id === s.identity.logoMediaId)?.url || null;
    const links = headerTree.filter((t) => !t.node.isButton);
    const cta = headerTree.find((t) => t.node.isButton);
    const columns = liveTree(form.menus.footer);
    const quick = liveTree(form.menus.quick_link);
    const socials = SOCIALS.filter(({ key }) => s.social[key].trim());
    const hasContact = s.foot.contactEmail || s.foot.phone || s.foot.address;

    useEffect(() => {
        const onKey = (e) => e.key === "Escape" && onClose();
        document.addEventListener("keydown", onKey);
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
    }, [onClose]);

    const Brand = () => (
        <b className="nv-brand">{logo ? <img src={logo} alt="" /> : <i />}{s.identity.shortName || "Site name"}</b>
    );

    return (
        <div className="nv-overlay" role="dialog" aria-modal="true" aria-label="Header and footer preview">
            <div className="nv-bar">
                <div className="nv-bar-left">
                    <span className="nv-live"><i /> Preview</span>
                    <small>Your current edits, not the live site. Hidden items are left out.</small>
                </div>
                <div className="nv-devices" role="tablist" aria-label="Screen size">
                    {DEVICES.map((d) => (
                        <button key={d.key} type="button" role="tab" aria-selected={device === d.key} className={device === d.key ? "is-on" : ""} onClick={() => setDevice(d.key)}>{d.label}</button>
                    ))}
                </div>
                <button type="button" className="nv-bar-btn" onClick={onClose}>Close <kbd>Esc</kbd></button>
            </div>

            <div className="nv-stage">
                <div className={`nv-frame is-${device}`} style={width ? { width } : undefined}>
                    <div className="nv">
                        <header className="nv-head">
                            <Brand />
                            <nav className="nv-links" aria-label="Header menu (preview)">
                                {links.map(({ node, kids }) => (
                                    <div key={node.id} className={`nv-link ${open === node.id ? "is-open" : ""}`}>
                                        <button type="button" aria-expanded={kids.length ? open === node.id : undefined} onClick={() => kids.length && setOpen(open === node.id ? null : node.id)}>
                                            {node.label || "Untitled"}{kids.length > 0 && <Icon name="down" size={12} />}
                                        </button>
                                        {kids.length > 0 && open === node.id && (
                                            <ul className="nv-drop">{kids.map((k) => <li key={k.id}>{k.label || "Untitled"}</li>)}</ul>
                                        )}
                                    </div>
                                ))}
                            </nav>
                            {cta && <span className="nv-cta">{cta.node.label || "Button"}</span>}
                            <button type="button" className="nv-burger" aria-label="Toggle menu" aria-expanded={burger} onClick={() => setBurger((v) => !v)}><Icon name={burger ? "close" : "menu"} size={20} /></button>
                        </header>

                        {burger && (
                            <div className="nv-drawer">
                                {headerTree.map(({ node, kids }) => (
                                    <div key={node.id}>
                                        <span className={node.isButton ? "is-button" : ""}>{node.label || "Untitled"}</span>
                                        {kids.map((k) => <span key={k.id} className="is-sub">{k.label || "Untitled"}</span>)}
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="nv-page">
                            <p>Page content appears here</p>
                        </div>

                        <footer className="nv-foot">
                            <div className="nv-foot-grid">
                                <div className="nv-foot-brand">
                                    <Brand />
                                    {s.foot.blurb && <p>{s.foot.blurb}</p>}
                                    {hasContact && (
                                        <address>
                                            {s.foot.address && <span>{s.foot.address}</span>}
                                            {s.foot.contactEmail && <span>{s.foot.contactEmail}</span>}
                                            {s.foot.phone && <span>{s.foot.phone}</span>}
                                        </address>
                                    )}
                                </div>
                                {columns.map(({ node, kids }) => (
                                    <div key={node.id} className="nv-col">
                                        <h3>{node.label || "Untitled"}</h3>
                                        <ul>{kids.map((k) => <li key={k.id}>{k.label || "Untitled"}</li>)}</ul>
                                    </div>
                                ))}
                            </div>
                            <div className="nv-foot-base">
                                <span>{s.foot.copyright}</span>
                                {s.foot.showQuickLinks && quick.length > 0 && <ul>{quick.map(({ node }) => <li key={node.id}>{node.label || "Untitled"}</li>)}</ul>}
                                {s.foot.showSocial && socials.length > 0 && <ul className="nv-social">{socials.map(({ key, label }) => <li key={key}>{label}</li>)}</ul>}
                            </div>
                        </footer>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* -------------------------------- the page -------------------------------- */

/* tab <-> URL section from your routes: /settings/{menus|site|featured-items} */
const TABS = [["menus", "Menus"], ["site", "Site settings"], ["featured", "Featured items"], ["history", "History"]];
const SECTION_OF = { menus: "menus", site: "site", featured: "featured-items" };
const TAB_OF = { menus: "menus", site: "site", "featured-items": "featured" };
const MENU_KEYS = AREAS.map((a) => a.key);
const GROUP_KEYS = GROUPS.map((g) => g.key);

export default function AdminCOEUASNavigationandSettings() {
    const { props, url } = usePage();
    const live = Boolean(props.site?.content);
    const dialogTitleId = useId();

    const seed = useRef(
        live
            ? { content: props.site.content, meta: props.site.meta, catalog: props.site.catalog, history: props.site.history || [] }
            : { content: sampleContent, meta: sampleMeta, catalog: sampleCatalog, history: sampleHistory }
    ).current;

    const [saved, setSaved] = useState(() => clone(seed.content));
    const [form, setForm] = useState(() => clone(seed.content));
    const [meta, setMeta] = useState(seed.meta);
    const [localHistory, setLocalHistory] = useState(seed.history);
    const [mediaList, setMediaList] = useState(seed.catalog?.media || []);

    const history = live ? props.site.history || [] : localHistory;

    const wantedTab = () => {
        const w = props.section || (url || "").match(/\/settings\/(menus|site|featured-items)/)?.[1];
        return TAB_OF[w] || "menus";
    };
    const [tab, setTab] = useState(wantedTab);
    const [areaKey, setAreaKey] = useState("header");
    const [groupKey, setGroupKey] = useState("identity");
    const [submitted, setSubmitted] = useState(false);
    const [busy, setBusy] = useState(false);
    const [dialog, setDialog] = useState(null); // { type: publish | delete, ... }
    const [picker, setPicker] = useState(null);
    const [preview, setPreview] = useState(false);
    const [toast, setToast] = useState(null);
    const busyRef = useRef(false);

    /* when the sidebar link changes (Menus / Site settings / Featured items), follow it */
    useEffect(() => { setTab(wantedTab()); }, [props.section, url]);

    /* tabs keep the address in step with the sidebar; the form state is kept (same page) */
    const goTab = (key) => {
        setTab(key);
        if (SECTION_OF[key]) router.visit(`${BASE}/settings/${SECTION_OF[key]}`, { preserveState: true, preserveScroll: true, replace: true });
    };

    /* live mode: follow what Laravel sends back after each save */
    useEffect(() => { if (live) setMeta(props.site.meta); }, [live, props.site?.meta]);

    const dirty = useMemo(() => !sameJson(form, saved), [form, saved]);
    const allErrors = useMemo(() => validate(form), [form]);
    const errors = useMemo(() => ({ ...(props.errors || {}), ...(submitted ? allErrors : {}) }), [props.errors, submitted, allErrors]);
    const errorCountFor = (keys) => Object.keys(errors).filter((k) => keys.includes(sectionOfKey(k))).length;
    const totalErrors = Object.keys(allErrors).length;

    const changedLabels = useMemo(
        () => [
            ...AREAS.filter((a) => !sameJson(form.menus[a.key], saved.menus[a.key])).map((a) => a.label),
            ...GROUPS.filter((g) => !sameJson(form.settings[g.key], saved.settings[g.key])).map((g) => g.label),
            ...(sameJson(form.featured, saved.featured) ? [] : ["Featured items"]),
        ],
        [form, saved]
    );
    const unpublished = dirty || meta.hasUnpublishedChanges;

    useEffect(() => {
        if (!toast) return undefined;
        const t = setTimeout(() => setToast(null), 5000);
        return () => clearTimeout(t);
    }, [toast]);

    /* warn before leaving with unsaved changes (moving between this page's own links is allowed) */
    useEffect(() => {
        const beforeUnload = (e) => { if (dirty) { e.preventDefault(); e.returnValue = ""; } };
        window.addEventListener("beforeunload", beforeUnload);
        const off = router.on("before", (event) => {
            const target = event?.detail?.visit?.url?.pathname || "";
            if (target.startsWith(`${BASE}/settings`) && !target.endsWith("/publish")) return undefined;
            if (dirty && !busyRef.current && !window.confirm("You have unsaved changes. Leave this page and discard them?")) return false;
            return undefined;
        });
        return () => { window.removeEventListener("beforeunload", beforeUnload); if (typeof off === "function") off(); };
    }, [dirty]);

    const edit = (fn) => setForm((f) => { const copy = clone(f); fn(copy); return copy; });
    const askDelete = (info) => setDialog({ type: "delete", ...info });
    const pickMedia = (opts) => setPicker(opts);
    const finishBusy = () => { setBusy(false); busyRef.current = false; };

    const addHistory = (action, label, changes = []) =>
        setLocalHistory((h) => [{ id: Date.now(), user: "You", action, label, at: new Date().toISOString(), changes }, ...h]);
    const diffs = () => changedLabels.map((l) => ({ field: l, from: "Previous version", to: "Updated" }));

    const jumpToFirstError = () => {
        const first = Object.keys(allErrors)[0];
        if (!first) return;
        const key = sectionOfKey(first);
        if (MENU_KEYS.includes(key)) { goTab("menus"); setAreaKey(key); }
        else if (key === "featured") goTab("featured");
        else { goTab("site"); setGroupKey(key); }
        setTimeout(() => document.querySelector(".cn-field.has-error, .cn-notice")?.scrollIntoView({ behavior: "smooth", block: "center" }), 120);
    };

    /* ---- actions ---- */
    const saveDraft = () => {
        if (!dirty || busy) return;
        setBusy(true); busyRef.current = true;
        const done = () => {
            setSaved(clone(form));
            setMeta((m) => ({ ...m, hasUnpublishedChanges: true, updatedBy: "You", updatedAt: new Date().toISOString() }));
            if (!live) addHistory("UPDATE", changedLabels.join(", ") || "Navigation and Settings", diffs());
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
            setMeta((m) => ({ ...m, publishedAt: now, hasUnpublishedChanges: false, updatedBy: "You", updatedAt: now }));
            if (!live) addHistory("PUBLISH", "Navigation and Settings", diffs());
            setDialog(null);
            setSubmitted(false);
            setToast({ tone: "ok", text: "Published. Visitors now see the new menus and settings." });
            finishBusy();
        };
        const fail = () => { finishBusy(); setDialog(null); setToast({ tone: "error", text: "Something went wrong. Nothing was changed." }); };
        if (live) router.post(ENDPOINTS.publish, { content: form }, { preserveScroll: true, onSuccess: done, onError: fail });
        else setTimeout(done, 400);
    };

    const confirmDelete = () => {
        dialog.onConfirm();
        if (!live) addHistory("DELETE", `${dialog.where}: ${dialog.what}`, [{ field: "Removed from menu", from: dialog.what, to: "(removed)" }]);
        setToast({ tone: "ok", text: `“${dialog.what}” removed from the ${dialog.where.toLowerCase()}. It leaves the site when you publish.` });
        setDialog(null);
    };

    const uploadMedia = (file) => {
        const local = { id: Date.now(), name: file.name, type: "image", alt: "", size: `${(file.size / 1048576).toFixed(1)} MB`, url: URL.createObjectURL(file) };
        if (live) {
            router.post(ENDPOINTS.upload, { file }, { forceFormData: true, preserveScroll: true, onSuccess: () => setToast({ tone: "ok", text: `${file.name} uploaded.` }), onError: () => setToast({ tone: "error", text: "The upload failed. Try a smaller image." }) });
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

    const media = live ? props.site.catalog?.media || mediaList : mediaList;
    const pages = (live ? props.site.catalog?.pages : seed.catalog?.pages) || [];
    const featuredCatalog = (live ? props.site.catalog?.featured : seed.catalog?.featured) || [];
    const ctx = { form, edit, errors, media, pages, featuredCatalog, askDelete, pickMedia };
    const GroupPanel = GROUP_PANELS[groupKey];

    return (
        <Ctx.Provider value={ctx}>
            <div className="coeuas-navset">
                <div className="cn-heading">
                    <div>
                        <h1>Navigation and Settings</h1>
                        <p>Control the header and footer menus, the logo and the defaults used across the COE-UAS website.</p>
                        <div className="cn-status">
                            <span className="cn-pill is-ok">Live</span>
                            {unpublished && <span className="cn-pill is-warn">{dirty ? "Unsaved changes" : "Changes not published yet"}</span>}
                            {meta.updatedAt && <small>Last edited {timeAgo(meta.updatedAt)} by {meta.updatedBy}</small>}
                        </div>
                    </div>

                    <div className="cn-actions">
                        <button type="button" className="cn-btn-outline" onClick={() => setPreview(true)}><Icon name="eye" size={16} /> Preview</button>
                        <button type="button" className="cn-btn-outline" onClick={saveDraft} disabled={!dirty || busy}><Icon name="save" size={16} /> {busy && !dialog ? "Saving..." : "Save draft"}</button>
                        <button type="button" className="cn-btn-dark" onClick={startPublish} disabled={busy || !unpublished}>
                            <span className="cn-btn-icon"><Icon name="upload" size={16} /></span> Publish
                        </button>
                    </div>
                </div>

                {!live && (
                    <p className="cn-note"><Icon name="alert" size={16} /><span>Sample data. Every control works, but nothing is stored until your controller sends the <b>site</b> prop.</span></p>
                )}

                <div className="cn-tabs" role="tablist" aria-label="Navigation and settings">
                    {TABS.map(([key, label]) => {
                        const errs = key === "menus" ? errorCountFor(MENU_KEYS) : key === "site" ? errorCountFor(GROUP_KEYS) : key === "featured" ? errorCountFor(["featured"]) : 0;
                        return (
                            <button key={key} type="button" role="tab" aria-selected={tab === key} className={tab === key ? "is-active" : ""} onClick={() => goTab(key)}>
                                {label}
                                {errs > 0 && <span className="cn-badge-error">{errs}</span>}
                                {key === "history" && <span className="cn-badge">{history.length}</span>}
                            </button>
                        );
                    })}
                </div>

                {tab === "menus" && (
                    <div className="cn-layout">
                        <nav className="cn-rail" aria-label="Menus">
                            <ol>
                                {AREAS.map((a, i) => {
                                    const errs = errorCountFor([a.key]);
                                    const changed = !sameJson(form.menus[a.key], saved.menus[a.key]);
                                    return (
                                        <li key={a.key}>
                                            <button type="button" className={`cn-rail-item ${areaKey === a.key ? "is-active" : ""}`} aria-current={areaKey === a.key ? "true" : undefined} onClick={() => setAreaKey(a.key)}>
                                                <span className="cn-rail-no">{i + 1}</span>
                                                <span className="cn-rail-text"><strong>{a.label}</strong><small>{a.hint}</small></span>
                                                {errs > 0 ? <span className="cn-badge-error" title={`${errs} to fix`}>{errs}</span> : changed ? <span className="cn-dot" title="Edited" /> : null}
                                            </button>
                                        </li>
                                    );
                                })}
                            </ol>
                        </nav>
                        <div className="cn-panel" key={areaKey}><AreaEditor areaKey={areaKey} /></div>
                    </div>
                )}

                {tab === "featured" && <div className="cn-panel"><FeaturedEditor /></div>}

                {tab === "site" && (
                    <div className="cn-layout">
                        <nav className="cn-rail" aria-label="Settings groups">
                            <ol>
                                {GROUPS.map((g, i) => {
                                    const errs = errorCountFor([g.key]);
                                    const changed = !sameJson(form.settings[g.key], saved.settings[g.key]);
                                    return (
                                        <li key={g.key}>
                                            <button type="button" className={`cn-rail-item ${groupKey === g.key ? "is-active" : ""}`} aria-current={groupKey === g.key ? "true" : undefined} onClick={() => setGroupKey(g.key)}>
                                                <span className="cn-rail-no">{i + 1}</span>
                                                <span className="cn-rail-text"><strong>{g.label}</strong><small>{g.hint}</small></span>
                                                {errs > 0 ? <span className="cn-badge-error" title={`${errs} to fix`}>{errs}</span> : changed ? <span className="cn-dot" title="Edited" /> : null}
                                            </button>
                                        </li>
                                    );
                                })}
                            </ol>
                        </nav>
                        <div className="cn-panel" key={groupKey}><GroupPanel /></div>
                    </div>
                )}

                {tab === "history" && <HistoryPanel history={history} />}

                {dirty && (
                    <div className="cn-savebar" role="region" aria-label="Unsaved changes">
                        <span className="cn-savebar-text"><i /> {changedLabels.length} section{changedLabels.length === 1 ? "" : "s"} edited, not saved</span>
                        <div>
                            <button type="button" className="cn-btn-ghost" onClick={() => { setForm(clone(saved)); setSubmitted(false); setToast({ tone: "info", text: "Changes discarded." }); }} disabled={busy}>Discard</button>
                            <button type="button" className="cn-btn-accent" onClick={saveDraft} disabled={busy}>{busy ? "Saving..." : "Save draft"}</button>
                        </div>
                    </div>
                )}

                {dialog?.type === "delete" && (
                    <div className="cn-overlay" onMouseDown={(e) => e.target === e.currentTarget && setDialog(null)}>
                        <div className="cn-dialog cn-small" role="alertdialog" aria-modal="true" aria-labelledby={dialogTitleId}>
                            <span className="cn-dialog-icon is-danger"><Icon name="trash" size={22} /></span>
                            <h2 id={dialogTitleId}>Remove “{dialog.what}”?</h2>
                            <p>{dialog.note ? `${dialog.note} ` : ""}It is taken out of the {dialog.where.toLowerCase()}. Nothing else is deleted. It leaves the public site when you publish.</p>
                            <div className="cn-dialog-actions">
                                <button type="button" className="cn-btn-outline" onClick={() => setDialog(null)} autoFocus>Keep it</button>
                                <button type="button" className="cn-btn-danger" onClick={confirmDelete}><Icon name="trash" size={15} /> Remove</button>
                            </div>
                        </div>
                    </div>
                )}

                {dialog?.type === "publish" && (
                    <div className="cn-overlay" onMouseDown={(e) => e.target === e.currentTarget && !busy && setDialog(null)}>
                        <div className="cn-dialog cn-small" role="alertdialog" aria-modal="true" aria-labelledby={dialogTitleId}>
                            <span className="cn-dialog-icon"><Icon name="upload" size={22} /></span>
                            <h2 id={dialogTitleId}>Publish menus and settings?</h2>
                            <p>The header, footer and site defaults change on every page straight away.</p>
                            {changedLabels.length > 0 ? (
                                <ul className="cn-dialog-list">{changedLabels.map((l) => <li key={l}><Icon name="check" size={14} /> {l}</li>)}</ul>
                            ) : (
                                <p className="cn-hint">No new edits. This publishes the last saved draft.</p>
                            )}
                            <div className="cn-dialog-actions">
                                <button type="button" className="cn-btn-outline" onClick={() => setDialog(null)} disabled={busy}>Cancel</button>
                                <button type="button" className="cn-btn-dark" onClick={confirmPublish} disabled={busy}>{busy ? "Working..." : "Publish now"}</button>
                            </div>
                        </div>
                    </div>
                )}

                {picker && <MediaPicker state={picker} media={media} onClose={() => setPicker(null)} onUpload={uploadMedia} />}
                {preview && <NavPreview form={form} media={media} onClose={() => setPreview(false)} />}

                {toast && (
                    <div className={`cn-toast is-${toast.tone}`} role="status">
                        <Icon name={toast.tone === "error" ? "alert" : "check"} size={16} />
                        <span>{toast.text}</span>
                        <button type="button" aria-label="Dismiss" onClick={() => setToast(null)}><Icon name="close" size={14} /></button>
                    </div>
                )}
            </div>
        </Ctx.Provider>
    );
}

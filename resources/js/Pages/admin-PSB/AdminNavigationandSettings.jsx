import { createContext, useContext, useEffect, useId, useMemo, useRef, useState } from "react";
import { router, usePage } from "@inertiajs/react";
import "../../../css/admin-PSB-css/admin-navigation-settings.css";

/* ====================================================================
   PSB ADMIN → NAVIGATION AND SETTINGS        /admin/psb/settings/*

   Site map (PSB workspace → "Navigation and Settings"), one page for all three modules:
     1  Header menu and Apply button        → menus (location header) + menu_items (is_button)
     2  Footer and social links              → menus (footer, quick_link) + menu_items
                                               + site_settings (group "social" and "footer")
     3  Logo, SEO defaults, contact email    → site_settings (group "branding" and "seo")
                                               + media_assets (logo, favicon, share image)
   Menu items link to a page (menu_items.page_id → pages) or to a custom address
   (menu_items.custom_url). Menus can be nested through menu_items.parent_id.
   Common screens from the document: edit, reorder (drag), History tab (audit_logs for
   the menu or settings group). The ERD has no draft / status column on menus or
   site_settings, so changes go live when saved.
   Media is always chosen from media_assets (never stored inside the content).

   SAMPLE DATA: the page works today (changes stay on screen only). Return an Inertia prop
   named `navSettings` and it switches to LIVE mode:

   Inertia::render('admin/AdminNavigationandSettings', [
       'section' => 'navigation',   // optional: navigation | footer | branding
       'navSettings' => [
           'header'   => [...],  // { items: [...], button: {...}, updatedAt, updatedBy }  (same shape as `sample.header`)
           'footer'   => [...],  // { footerLinks, quickLinks, social, tagline, copyright, updatedAt, updatedBy }
           'branding' => [...],  // { siteName, tagline, logoId, faviconId, seoTitle, seoDescription, ogId, contactEmail, ... }
           'pages'    => [...],  // pages for the link picker: { id, title, slug, status }
           'media'    => [...],  // media_assets: { id, name, type, alt, size, url? }
           'history'  => [...],  // audit_logs rows: { id, key: "menu:header", user, action, label, at, changes }
       ],
   ]);

   Map the three sidebar routes (/admin/psb/settings/navigation, /footer, /branding) to this
   same component. LIVE mode sends one PUT per module (see API). The controller should save the
   whole menu in one transaction (keep ids, update parent_id and sort_order), write audit_logs
   and check the site scope (RBAC).
==================================================================== */

const BASE = "/admin/psb"; // keep in sync with psbRoutes.js
const API = {
    header: `${BASE}/settings/navigation`, //  PUT { record: { items, button } }
    footer: `${BASE}/settings/footer`, //      PUT { record: { footerLinks, quickLinks, social, tagline, copyright } }
    branding: `${BASE}/settings/branding`, //  PUT { record }
    upload: `${BASE}/media-library/upload`, // POST multipart { file }
};
const LIBRARY = `${BASE}/media-library`;
const PAGES_URL = BASE; // pages are managed in their own modules

const LIMITS = { top: 8, sub: 8, footerLinks: 8, quickLinks: 8 };

const MODULES = [
    { key: "header", route: "navigation", label: "Header menu and Apply button", hint: "The main menu at the top of every page", historyKey: "menu:header" },
    { key: "footer", route: "footer", label: "Footer and social links", hint: "Footer links, quick links and social media", historyKey: "menu:footer" },
    { key: "branding", route: "branding", label: "Logo, SEO defaults, contact email", hint: "Site identity and the defaults used by search engines", historyKey: "settings:branding" },
];

const SOCIALS = [
    { key: "facebook", label: "Facebook", placeholder: "https://www.facebook.com/yourpage" },
    { key: "instagram", label: "Instagram", placeholder: "https://www.instagram.com/yourname" },
    { key: "youtube", label: "YouTube", placeholder: "https://www.youtube.com/@yourchannel" },
    { key: "x", label: "X (Twitter)", placeholder: "https://x.com/yourname" },
    { key: "linkedin", label: "LinkedIn", placeholder: "https://www.linkedin.com/company/yourname" },
];

const MIN = 60 * 1000;
const NOW = Date.now();
const minsAgo = (m) => new Date(NOW - m * MIN).toISOString();
let counter = 0;
const uid = () => `n${Date.now().toString(36)}${(counter += 1)}`;

/* ------------------------------ sample data ------------------------------ */
/* addresses and logos below are placeholders for the sample only */

const item = (id, label, pageId, children = [], extra = {}) => ({ id, label, linkType: pageId ? "page" : "none", pageId: pageId || null, customUrl: "", visible: true, children, ...extra });

const sample = {
    media: [
        { id: 1, name: "psb-logo.png", type: "image", alt: "Perlis Airspace Sandbox logo", size: "48 KB" },
        { id: 2, name: "psb-favicon.png", type: "image", alt: "Perlis Airspace Sandbox icon", size: "6 KB" },
        { id: 3, name: "share-image.jpg", type: "image", alt: "Aerial view of the Sungai Batu Pahat site", size: "2.1 MB" },
        { id: 4, name: "site-aerial.jpg", type: "image", alt: "", size: "2.1 MB" },
    ],
    pages: [
        { id: 1, title: "Home", slug: "", status: "published" },
        { id: 2, title: "About the Sandbox", slug: "about", status: "published" },
        { id: 3, title: "Why Perlis, Malaysia?", slug: "about/why-perlis", status: "published" },
        { id: 4, title: "Governance and Management", slug: "about/governance", status: "published" },
        { id: 5, title: "Development Roadmap", slug: "about/roadmap", status: "published" },
        { id: 6, title: "Opportunities", slug: "opportunities", status: "published" },
        { id: 7, title: "Ways to Participate", slug: "opportunities/ways", status: "published" },
        { id: 8, title: "Open Programmes and Calls", slug: "opportunities/programmes", status: "published" },
        { id: 9, title: "Services", slug: "services", status: "published" },
        { id: 10, title: "Site Information", slug: "site-information", status: "published" },
        { id: 11, title: "Location and Access", slug: "site-information/location", status: "published" },
        { id: 12, title: "Media Centre", slug: "media-centre", status: "published" },
        { id: 13, title: "News and Project Updates", slug: "media-centre/news", status: "published" },
        { id: 14, title: "FAQ", slug: "faq", status: "published" },
        { id: 15, title: "Contact Us", slug: "contact", status: "published" },
        { id: 16, title: "Apply to Participate", slug: "apply-to-participate", status: "published" },
        { id: 17, title: "Privacy Policy", slug: "privacy-policy", status: "draft" },
        { id: 18, title: "Terms of Use", slug: "terms", status: "published" },
    ],
    header: {
        items: [
            item("h1", "About the Sandbox", 2, [item("h1a", "Why Perlis, Malaysia?", 3), item("h1b", "Governance and Management", 4), item("h1c", "Development Roadmap", 5)]),
            item("h2", "Opportunities", 6, [item("h2a", "Ways to Participate", 7), item("h2b", "Open Programmes and Calls", 8)]),
            item("h3", "Services", 9),
            item("h4", "Site Information", 10, [item("h4a", "Location and Access", 11)]),
            item("h5", "Media Centre", 12, [item("h5a", "News and Project Updates", 13)]),
            item("h6", "Contact Us", 15),
        ],
        button: { label: "Apply to Participate", linkType: "page", pageId: 16, customUrl: "", visible: true },
        updatedAt: minsAgo(60 * 24 * 9),
        updatedBy: "Aiman Hakim",
    },
    footer: {
        footerLinks: [item("f1", "Privacy Policy", 17), item("f2", "Terms of Use", 18)],
        quickLinks: [item("q1", "FAQ", 14), item("q2", "Apply to Participate", 16), item("q3", "Contact Us", 15), item("q4", "Location and Access", 11)],
        social: { facebook: "https://www.facebook.com/", instagram: "https://www.instagram.com/", youtube: "https://www.youtube.com/", x: "", linkedin: "" },
        tagline: "Malaysia’s first real-world testing ground for low-altitude airspace.",
        copyright: "© 2026 Perlis Airspace Sandbox. All rights reserved.",
        updatedAt: minsAgo(60 * 24 * 12),
        updatedBy: "Farid Rahman",
    },
    branding: {
        siteName: "Perlis Airspace Sandbox",
        tagline: "Innovating today, connecting tomorrow.",
        logoId: 1,
        faviconId: 2,
        seoTitle: "Perlis Airspace Sandbox | Low-altitude airspace testing",
        seoDescription: "A controlled, regulator-ready environment in Perlis for testing drones, air taxis and autonomous cargo.",
        ogId: 3,
        contactEmail: "info@example.com",
        updatedAt: minsAgo(60 * 24 * 20),
        updatedBy: "Aiman Hakim",
    },
    history: [
        { id: 3, key: "menu:header", user: "Aiman Hakim", action: "UPDATE", label: "Header menu and Apply button", at: minsAgo(60 * 24 * 9), changes: [{ field: "Added to header menu", from: "(none)", to: "Contact Us" }] },
        { id: 2, key: "menu:footer", user: "Farid Rahman", action: "UPDATE", label: "Footer and social links", at: minsAgo(60 * 24 * 12), changes: [{ field: "Facebook", from: "(empty)", to: "https://www.facebook.com/" }] },
        { id: 1, key: "settings:branding", user: "Aiman Hakim", action: "UPDATE", label: "Logo, SEO defaults, contact email", at: minsAgo(60 * 24 * 20), changes: [{ field: "Share image", from: "(empty)", to: "3" }] },
    ],
};

/* ------------------------------ helpers ------------------------------ */

const clone = (v) => JSON.parse(JSON.stringify(v));
const sameJson = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const initialsOf = (name) => (name || "?").split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase();
const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test((v || "").trim());
const isAddress = (v) => /^(https?:\/\/\S+|\/\S*|#\S*|mailto:\S+|tel:\S+)$/i.test((v || "").trim());
const isWebUrl = (v) => /^https?:\/\/[^\s/]+\.[^\s/]{2,}\S*$/i.test((v || "").trim());
const META_KEYS = ["updatedAt", "updatedBy"];
const contentOf = (o) => Object.fromEntries(Object.entries(o).filter(([k]) => !META_KEYS.includes(k)));

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

const moveIn = (list, from, to) => {
    if (to < 0 || to >= list.length) return list;
    const next = [...list];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    return next;
};

const short = (v) => {
    const s = v === null || v === undefined || v === "" ? "(empty)" : typeof v === "boolean" ? (v ? "Yes" : "No") : String(v).replace(/\s+/g, " ");
    return s.length > 70 ? `${s.slice(0, 67)}...` : s;
};

const pagePath = (p) => `/${p.slug}`;
const linkText = (it, pages) => {
    if (it.linkType === "page") { const p = pages.find((x) => x.id === it.pageId); return p ? pagePath(p) : "(no page)"; }
    if (it.linkType === "url") return it.customUrl || "(no address)";
    return "Heading only";
};

/* drawn thumbnail for a media asset (real files would use their own URL) */
function thumbOf(m) {
    if (m?.url) return m.url;
    const label = (m?.name || "media").replace(/[<>&"]/g, "");
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0b1a28"/><stop offset="1" stop-color="#1d4160"/></linearGradient></defs><rect width="320" height="200" fill="url(#g)"/><path d="M-10 170L120 110 330 70V110L130 150 -10 200Z" fill="#facc15" fill-opacity=".9"/><circle cx="160" cy="84" r="9" fill="#fff"/><path d="M130 54l60 60M190 54l-60 60" stroke="#fff" stroke-width="4" stroke-linecap="round"/><text x="14" y="186" fill="#fff" font-family="Arial,sans-serif" font-size="13" font-weight="700">${label}</text></svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const blankItem = () => ({ id: uid(), label: "", linkType: "page", pageId: null, customUrl: "", visible: true, children: [] });

/* ---- validation. Each returns { "scope.id.field": "message" } ---- */

function checkItem(e, it, keyPrefix, allowNone) {
    const label = (it.label || "").trim();
    if (!label) e[`${keyPrefix}.label`] = "Enter the menu text.";
    else if (label.length > 100) e[`${keyPrefix}.label`] = "Use 100 characters or fewer.";
    if (it.linkType === "page") { if (!it.pageId) e[`${keyPrefix}.link`] = "Choose a page."; }
    else if (it.linkType === "url") {
        if (!(it.customUrl || "").trim()) e[`${keyPrefix}.link`] = "Enter an address.";
        else if (!isAddress(it.customUrl)) e[`${keyPrefix}.link`] = "Use a full address (https://...) or a path starting with /";
        else if (it.customUrl.length > 255) e[`${keyPrefix}.link`] = "Use 255 characters or fewer.";
    } else if (!allowNone) e[`${keyPrefix}.link`] = "Choose a page or enter an address.";
}

function validateHeader(f) {
    const e = {};
    if (!f.items.length) e["header.items"] = "Add at least one menu item.";
    f.items.forEach((it) => {
        checkItem(e, it, `h.${it.id}`, it.children.length > 0);
        it.children.forEach((c) => checkItem(e, c, `h.${c.id}`, false));
    });
    if (f.button.visible) {
        const label = (f.button.label || "").trim();
        if (!label) e["btn.label"] = "Enter the button text.";
        else if (label.length > 30) e["btn.label"] = "Use 30 characters or fewer.";
        const tmp = {};
        checkItem(tmp, f.button, "btn", false);
        if (tmp["btn.link"]) e["btn.link"] = tmp["btn.link"];
    }
    return e;
}

function validateFooter(f) {
    const e = {};
    f.footerLinks.forEach((it) => checkItem(e, it, `f.${it.id}`, false));
    f.quickLinks.forEach((it) => checkItem(e, it, `q.${it.id}`, false));
    SOCIALS.forEach((s) => {
        const v = (f.social[s.key] || "").trim();
        if (v && !isWebUrl(v)) e[`social.${s.key}`] = "Use a full address starting with https://";
        else if (v.length > 300) e[`social.${s.key}`] = "Use 300 characters or fewer.";
    });
    if ((f.tagline || "").length > 200) e.tagline = "Use 200 characters or fewer.";
    if ((f.copyright || "").length > 150) e.copyright = "Use 150 characters or fewer.";
    return e;
}

function validateBranding(f) {
    const e = {};
    const need = (key, value, label, max) => {
        const v = (value || "").trim();
        if (!v) e[key] = `Enter ${label}.`;
        else if (v.length > max) e[key] = `Use ${max} characters or fewer.`;
    };
    need("siteName", f.siteName, "the site name", 100);
    if ((f.tagline || "").length > 150) e.tagline = "Use 150 characters or fewer.";
    if (!f.logoId) e.logoId = "Choose a logo.";
    need("seoTitle", f.seoTitle, "a default page title", 70);
    if ((f.seoDescription || "").length > 160) e.seoDescription = "Use 160 characters or fewer.";
    if (!(f.contactEmail || "").trim()) e.contactEmail = "Enter the contact email.";
    else if (!isEmail(f.contactEmail)) e.contactEmail = "Enter a valid email address.";
    else if (f.contactEmail.length > 190) e.contactEmail = "Use 190 characters or fewer.";
    return e;
}

/* ---- what changed, for the History tab ---- */

const flat = (items, pages, parent = null) => items.flatMap((x) => [{ id: x.id, parent, label: x.label, link: linkText(x, pages), visible: x.visible }, ...flat(x.children || [], pages, x.id)]);

function menuChanges(name, a, b, pages) {
    const A = flat(a, pages);
    const B = flat(b, pages);
    const byA = Object.fromEntries(A.map((x) => [x.id, x]));
    const byB = Object.fromEntries(B.map((x) => [x.id, x]));
    const out = [];
    B.filter((x) => !byA[x.id]).forEach((x) => out.push({ field: `Added to ${name}`, from: "(none)", to: x.label || "(no text)" }));
    A.filter((x) => !byB[x.id]).forEach((x) => out.push({ field: `Removed from ${name}`, from: x.label || "(no text)", to: "(deleted)" }));
    B.filter((x) => byA[x.id]).forEach((x) => {
        const o = byA[x.id];
        if (o.label !== x.label) out.push({ field: "Menu text", from: short(o.label), to: short(x.label) });
        if (o.link !== x.link) out.push({ field: `${x.label}: link`, from: short(o.link), to: short(x.link) });
        if (o.visible !== x.visible) out.push({ field: `${x.label}: shown`, from: short(o.visible), to: short(x.visible) });
        if (o.parent !== x.parent) out.push({ field: `${x.label}: moved`, from: "Previous position", to: "New position" });
    });
    const now = B.filter((x) => byA[x.id] && byA[x.id].parent === x.parent).map((x) => x.id).join();
    const before = A.filter((x) => byB[x.id] && byB[x.id].parent === x.parent).map((x) => x.id).join();
    if (now !== before) out.push({ field: `${name} order`, from: "Previous order", to: "New order" });
    return out;
}

const simpleDiff = (labels, a, b) => Object.keys(labels).filter((k) => JSON.stringify(a[k]) !== JSON.stringify(b[k])).map((k) => ({ field: labels[k], from: short(a[k]), to: short(b[k]) }));
const BRANDING_LABELS = { siteName: "Site name", tagline: "Tagline", logoId: "Logo", faviconId: "Favicon", seoTitle: "Default page title", seoDescription: "Default search description", ogId: "Share image", contactEmail: "Contact email" };

function describe(key, a, b, pages) {
    if (key === "header") {
        const btn = ["label", "visible"].filter((k) => a.button[k] !== b.button[k]).map((k) => ({ field: k === "label" ? "Apply button text" : "Apply button shown", from: short(a.button[k]), to: short(b.button[k]) }));
        const la = linkText(a.button, pages);
        const lb = linkText(b.button, pages);
        if (la !== lb) btn.push({ field: "Apply button link", from: short(la), to: short(lb) });
        return [...menuChanges("header menu", a.items, b.items, pages), ...btn];
    }
    if (key === "footer") {
        const social = SOCIALS.filter((s) => (a.social[s.key] || "") !== (b.social[s.key] || "")).map((s) => ({ field: s.label, from: short(a.social[s.key]), to: short(b.social[s.key]) }));
        return [...menuChanges("footer links", a.footerLinks, b.footerLinks, pages), ...menuChanges("quick links", a.quickLinks, b.quickLinks, pages), ...social, ...simpleDiff({ tagline: "Footer tagline", copyright: "Copyright line" }, a, b)];
    }
    return simpleDiff(BRANDING_LABELS, a, b);
}

/* ------------------------------ shared state ------------------------------ */

const Ctx = createContext(null);
const useNs = () => useContext(Ctx);

/* ------------------------------ icons ------------------------------ */

function Icon({ name, size = 18 }) {
    const icons = {
        save: (<><path d="M5 3h11l4 4v14H5z" /><path d="M8 3v6h8V3M8 21v-7h8v7" /></>),
        upload: (<><path d="M12 16V4M7 9l5-5 5 5" /><path d="M4 20h16" /></>),
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
        external: <path d="M14 4h6v6M20 4l-9 9M18 14v5H5V6h5" />,
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
        <button type="button" role="switch" aria-checked={checked} aria-label={label} className={`ns-toggle ${checked ? "is-on" : ""}`} onClick={() => onChange(!checked)}>
            <span />
        </button>
    );
}

/* One labelled text box or text area with a character counter and an error line */
function Field({ label, hint, value, onChange, error, max, rows, placeholder, type = "text" }) {
    const id = useId();
    const length = (value ?? "").length;
    return (
        <div className={`ns-field ${error ? "has-error" : ""}`}>
            <div className="ns-field-top">
                <label htmlFor={id}>{label}</label>
                {max && <span className={`ns-count ${length > max ? "is-over" : ""}`}>{length}/{max}</span>}
            </div>
            {rows ? (
                <textarea id={id} className="ns-input ns-textarea" rows={rows} value={value ?? ""} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
            ) : (
                <input id={id} type={type} className="ns-input" value={value ?? ""} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
            )}
            {hint && !error && <p className="ns-hint">{hint}</p>}
            {error && <p className="ns-error" role="alert"><Icon name="alert" size={13} /> {error}</p>}
        </div>
    );
}

function SelectField({ label, hint, value, onChange, options, error }) {
    const id = useId();
    return (
        <div className={`ns-field ${error ? "has-error" : ""}`}>
            <div className="ns-field-top"><label htmlFor={id}>{label}</label></div>
            <select id={id} className="ns-input ns-select is-block" value={value ?? ""} onChange={(e) => onChange(e.target.value)}>
                {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            {hint && !error && <p className="ns-hint">{hint}</p>}
            {error && <p className="ns-error" role="alert"><Icon name="alert" size={13} /> {error}</p>}
        </div>
    );
}

function BlockHead({ title, text, aside }) {
    return (
        <div className="ns-block-head">
            <div>
                <h3>{title}</h3>
                {text && <p>{text}</p>}
            </div>
            {aside}
        </div>
    );
}

function AddButton({ onClick, children, disabled }) {
    return <button type="button" className="ns-add" onClick={onClick} disabled={disabled}><Icon name="plus" size={15} /> {children}</button>;
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
                e.stopPropagation();
                from.current = i;
                e.dataTransfer.effectAllowed = "move";
                try { e.dataTransfer.setData("text/plain", String(i)); } catch { /* ignore */ }
                const row = e.currentTarget.closest("li");
                if (row) e.dataTransfer.setDragImage(row, 24, 24);
            },
            onDragEnd: () => { from.current = null; setOver(null); },
        }),
        rowProps: (i) => ({
            onDragOver: (e) => { if (from.current === null) return; e.preventDefault(); e.stopPropagation(); setOver(i); },
            onDrop: (e) => {
                if (from.current === null) return;
                e.preventDefault();
                e.stopPropagation();
                if (from.current !== i) onReorder(from.current, i);
                from.current = null;
                setOver(null);
            },
        }),
    };
}

/* An ordered list where every row can be moved and removed. Removing only takes it out of the form: nothing is saved until Save */
function Orderable({ items, onMove, onRemove, nameOf, children, empty }) {
    const drag = useDrag(onMove);
    if (!items.length) return <p className="ns-empty">{empty}</p>;
    return (
        <ul className="ns-list">
            {items.map((it, i) => (
                <li key={it.id} className={`ns-item ${drag.over === i ? "is-over" : ""}`} {...drag.rowProps(i)}>
                    <button type="button" className="ns-handle" aria-label={`Drag ${nameOf(it)} to reorder`} title="Drag to reorder" {...drag.handleProps(i)}>
                        <Icon name="grip" size={16} />
                    </button>
                    <span className="ns-item-no">{i + 1}</span>
                    <div className="ns-item-body">{children(it, i)}</div>
                    <div className="ns-item-tools">
                        <button type="button" className="ns-iconbtn" aria-label="Move up" title="Move up" disabled={i === 0} onClick={() => onMove(i, i - 1)}><Icon name="up" size={15} /></button>
                        <button type="button" className="ns-iconbtn" aria-label="Move down" title="Move down" disabled={i === items.length - 1} onClick={() => onMove(i, i + 1)}><Icon name="down" size={15} /></button>
                        <button type="button" className="ns-iconbtn is-danger" aria-label={`Remove ${nameOf(it)}`} title="Remove" onClick={() => onRemove(i)}><Icon name="trash" size={15} /></button>
                    </div>
                </li>
            ))}
        </ul>
    );
}

/* ------------------------------ menu editing ------------------------------ */

/* text, link type, page or address, and a show / hide switch for one menu item (or the Apply button) */
function ItemFields({ it, onPatch, errors, keyPrefix, allowNone, textLabel = "Menu text", shownLabel }) {
    const { pages } = useNs();
    const page = it.linkType === "page" ? pages.find((p) => p.id === it.pageId) : null;
    const types = [["page", "A page on this site"], ["url", "A custom address"], ...(allowNone ? [["none", "No link (drop-down heading only)"]] : [])];

    return (
        <div className="ns-fields">
            <div><Field label={textLabel} value={it.label} error={errors[`${keyPrefix}.label`]} max={keyPrefix === "btn" ? 30 : 100} onChange={(v) => onPatch({ label: v })} /></div>
            <div><SelectField label="Links to" value={it.linkType} options={types} onChange={(v) => onPatch({ linkType: v })} /></div>
            {it.linkType === "page" && (
                <div className="is-full">
                    <SelectField
                        label="Page"
                        value={it.pageId}
                        error={errors[`${keyPrefix}.link`]}
                        onChange={(v) => onPatch({ pageId: v ? Number(v) : null })}
                        options={[["", "Choose a page"], ...pages.map((p) => [p.id, `${p.title} (${pagePath(p)})${p.status === "published" ? "" : `, ${p.status}`}`])]}
                    />
                    {page && page.status !== "published" && <p className="ns-warn"><Icon name="alert" size={15} /> This page is {page.status}, so the link will not work for visitors until it is published.</p>}
                </div>
            )}
            {it.linkType === "url" && (
                <div className="is-full"><Field label="Address" value={it.customUrl} error={errors[`${keyPrefix}.link`]} max={255} placeholder="https://example.com or /path" onChange={(v) => onPatch({ customUrl: v })} hint="A full address (https://...), a path starting with /, or mailto: / tel:." /></div>
            )}
            {it.linkType === "none" && <div className="is-full"><p className="ns-hint ns-hint-pad">This item only opens its sub-menu.</p></div>}
            <div className="is-full">
                <label className="ns-visible">
                    <span>{it.visible ? (shownLabel || "Shown in the menu") : "Hidden from visitors"}</span>
                    <Toggle checked={it.visible} label={`Show ${it.label || "this item"}`} onChange={(v) => onPatch({ visible: v })} />
                </label>
                {errors[`${keyPrefix}.link`] && it.linkType === "none" && <p className="ns-error"><Icon name="alert" size={13} /> {errors[`${keyPrefix}.link`]}</p>}
            </div>
        </div>
    );
}

function MenuList({ items, onChange, max, prefix, nested, errors, empty, addLabel }) {
    const { confirm } = useNs();
    const patch = (id, p) => onChange(items.map((x) => (x.id === id ? { ...x, ...p } : x)));
    const remove = (i) => {
        const it = items[i];
        const go = () => onChange(items.filter((_, idx) => idx !== i));
        if (it.children?.length) confirm({ title: `Remove “${it.label || "this item"}”?`, text: `This also removes its ${it.children.length} sub-item${it.children.length === 1 ? "" : "s"}. Nothing changes on the site until you press Save.`, label: "Remove", onConfirm: go });
        else go();
    };

    return (
        <>
            <Orderable items={items} nameOf={(x) => x.label || "menu item"} onMove={(f, t) => onChange(moveIn(items, f, t))} onRemove={remove} empty={empty}>
                {(it) => (
                    <div className="ns-stack">
                        <ItemFields it={it} errors={errors} keyPrefix={`${prefix}.${it.id}`} allowNone={nested && it.children.length > 0} onPatch={(p) => patch(it.id, p)} />
                        {nested && (
                            <div className="ns-sub">
                                <div className="ns-sub-head"><h4>Sub-menu</h4><span className="ns-limit">{it.children.length} of {LIMITS.sub}</span></div>
                                <MenuList items={it.children} onChange={(kids) => patch(it.id, { children: kids })} max={LIMITS.sub} prefix={prefix} nested={false} errors={errors} empty="No sub-items. This item links straight to its page." addLabel="Add sub-item" />
                            </div>
                        )}
                    </div>
                )}
            </Orderable>
            <AddButton disabled={items.length >= max} onClick={() => onChange([...items, blankItem()])}>{addLabel}</AddButton>
        </>
    );
}

/* ------------------------------ media ------------------------------ */

function MediaField({ label, hint, mediaId, onChange, error, needAlt }) {
    const { media, pickMedia } = useNs();
    const asset = media.find((m) => m.id === mediaId);
    const missingAlt = needAlt && asset && !asset.alt;

    return (
        <div className={`ns-field ${error ? "has-error" : ""}`}>
            <div className="ns-field-top"><label>{label}</label></div>
            <div className="ns-media">
                <span className="ns-media-thumb">{asset ? <img src={thumbOf(asset)} alt="" /> : <Icon name="image" size={22} />}</span>
                <div className="ns-media-text">
                    {asset ? (
                        <>
                            <strong>{asset.name}</strong>
                            <small>Image · {asset.size}</small>
                            {missingAlt || (asset && !asset.alt) ? <small className="ns-media-warn"><Icon name="alert" size={12} /> No alt text. Add it in the Media Library.</small> : <small title={asset.alt}>Alt text: {asset.alt}</small>}
                        </>
                    ) : (
                        <>
                            <strong>No file chosen</strong>
                            <small>Pick an image from the Media Library</small>
                        </>
                    )}
                </div>
                <div className="ns-media-actions">
                    <button type="button" className="ns-btn-small" onClick={() => pickMedia({ selected: mediaId, onPick: onChange })}>{asset ? "Change" : "Choose"}</button>
                    {asset && <button type="button" className="ns-btn-small is-quiet" onClick={() => onChange(null)}>Remove</button>}
                </div>
            </div>
            {hint && !error && <p className="ns-hint">{hint}</p>}
            {error && <p className="ns-error" role="alert"><Icon name="alert" size={13} /> {error}</p>}
        </div>
    );
}

function MediaPicker({ state, media, onClose, onUpload }) {
    const [query, setQuery] = useState("");
    const fileRef = useRef(null);

    useEffect(() => {
        const onKey = (e) => e.key === "Escape" && onClose();
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [onClose]);

    const q = query.trim().toLowerCase();
    const list = media.filter((m) => m.type === "image" && (!q || m.name.toLowerCase().includes(q) || (m.alt || "").toLowerCase().includes(q)));

    return (
        <div className="ns-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
            <div className="ns-dialog ns-picker" role="dialog" aria-modal="true" aria-labelledby="ns-picker-title">
                <header className="ns-dialog-head">
                    <div>
                        <h2 id="ns-picker-title">Media Library</h2>
                        <p>Choose an image. Files are managed in the <a className="ns-link" href={LIBRARY}>Media Library</a>.</p>
                    </div>
                    <button type="button" className="ns-iconbtn" aria-label="Close" onClick={onClose}><Icon name="close" size={18} /></button>
                </header>

                <div className="ns-picker-tools">
                    <label className="ns-search">
                        <Icon name="search" size={16} />
                        <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by file name or alt text" aria-label="Search media" />
                    </label>
                    <button type="button" className="ns-btn-small" onClick={() => fileRef.current?.click()}><Icon name="upload" size={14} /> Upload</button>
                    <input ref={fileRef} type="file" hidden accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) onUpload(f); e.target.value = ""; }} />
                </div>

                <div className="ns-media-grid">
                    {list.length === 0 && <p className="ns-empty">No images match. Try another search or upload a new image.</p>}
                    {list.map((m) => (
                        <button key={m.id} type="button" className={`ns-media-card ${state.selected === m.id ? "is-selected" : ""}`} onClick={() => { state.onPick(m.id); onClose(); }}>
                            <img src={thumbOf(m)} alt="" />
                            <span className="ns-media-card-text">
                                <strong>{m.name}</strong>
                                <small>Image · {m.size}</small>
                            </span>
                            {state.selected === m.id && <span className="ns-media-check"><Icon name="check" size={14} /></span>}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

/* ------------------------------ dialogs and history ------------------------------ */

function ConfirmDialog({ dlg, onClose }) {
    useEffect(() => {
        const onKey = (e) => e.key === "Escape" && onClose();
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [onClose]);

    return (
        <div className="ns-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
            <div className="ns-dialog ns-small" role="alertdialog" aria-modal="true" aria-labelledby="ns-dlg-title">
                <span className="ns-dialog-icon is-danger"><Icon name="trash" size={22} /></span>
                <h2 id="ns-dlg-title">{dlg.title}</h2>
                <p>{dlg.text}</p>
                <div className="ns-dialog-actions">
                    <button type="button" className="ns-btn-outline" onClick={onClose} autoFocus>Keep it</button>
                    <button type="button" className="ns-btn-danger" onClick={() => { onClose(); dlg.onConfirm(); }}><Icon name="trash" size={15} /> {dlg.label}</button>
                </div>
            </div>
        </div>
    );
}

const ACTION_PILL = { CREATE: "warn", UPDATE: "info", PUBLISH: "dark", UNPUBLISH: "off", DELETE: "danger", RESTORE: "ok" };
const ACTION_LABEL = { CREATE: "Created", UPDATE: "Updated", PUBLISH: "Published", UNPUBLISH: "Unpublished", DELETE: "Deleted", RESTORE: "Restored" };

function HistoryPanel({ entries, title }) {
    const [open, setOpen] = useState(null);
    return (
        <section className="ns-card">
            <header className="ns-card-head">
                <div>
                    <span className="ns-card-no">History</span>
                    <h2>{title}</h2>
                    <p>Every update is recorded. Entries cannot be edited.</p>
                </div>
            </header>
            {entries.length === 0 ? (
                <p className="ns-empty ns-empty-pad">No history yet. It starts when you save.</p>
            ) : (
                <ul className="ns-history">
                    {entries.map((h) => {
                        const isOpen = open === h.id;
                        return (
                            <li key={h.id}>
                                <button type="button" className="ns-hist-row" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : h.id)} disabled={!h.changes?.length}>
                                    <span className="ns-avatar">{initialsOf(h.user)}</span>
                                    <span className="ns-hist-text">
                                        <strong>{h.user}</strong>
                                        <small>{ACTION_LABEL[h.action] || h.action} <b>{h.label}</b></small>
                                    </span>
                                    <span className={`ns-pill is-${ACTION_PILL[h.action] || "info"}`}>{ACTION_LABEL[h.action] || h.action}</span>
                                    <span className="ns-hist-time" title={formatDate(h.at)}>{timeAgo(h.at)}</span>
                                </button>
                                {isOpen && h.changes?.length > 0 && (
                                    <div className="ns-diff">
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
   PREVIEWS (built from the unsaved form)
==================================================================== */

function HeaderPreview({ form }) {
    const { data, media } = useNs();
    const [open, setOpen] = useState(null);
    const brand = data.branding;
    const logo = media.find((m) => m.id === brand.logoId);
    const shown = form.items.filter((i) => i.visible);

    return (
        <div className="ns-pv">
            <div className="ns-pv-bar">
                <span className="ns-pv-logo">{logo ? <img src={thumbOf(logo)} alt={logo.alt || brand.siteName} /> : brand.siteName}</span>
                <nav className="ns-pv-nav" aria-label="Header preview">
                    {shown.map((i) => {
                        const kids = i.children.filter((c) => c.visible);
                        return (
                            <div key={i.id} className="ns-pv-item">
                                <button type="button" onClick={() => setOpen(open === i.id ? null : i.id)} aria-expanded={kids.length ? open === i.id : undefined}>{i.label || "Untitled"}{kids.length > 0 && <Icon name="down" size={12} />}</button>
                                {open === i.id && kids.length > 0 && <ul>{kids.map((c) => <li key={c.id}>{c.label || "Untitled"}</li>)}</ul>}
                            </div>
                        );
                    })}
                </nav>
                {form.button.visible && <span className="ns-pv-btn">{form.button.label || "Button"}</span>}
            </div>
            {shown.length === 0 && <p className="ns-pv-none">No visible menu items.</p>}
        </div>
    );
}

function FooterPreview({ form }) {
    const { data, media } = useNs();
    const brand = data.branding;
    const logo = media.find((m) => m.id === brand.logoId);
    const social = SOCIALS.filter((s) => (form.social[s.key] || "").trim());

    return (
        <div className="ns-pv ns-pv-foot">
            <div className="ns-pv-cols">
                <div>
                    <span className="ns-pv-logo">{logo ? <img src={thumbOf(logo)} alt={logo.alt || brand.siteName} /> : brand.siteName}</span>
                    <p>{form.tagline || "Footer tagline"}</p>
                    {social.length > 0 && <div className="ns-pv-social">{social.map((s) => <span key={s.key} title={s.label}>{s.label.slice(0, 2)}</span>)}</div>}
                </div>
                <div>
                    <h5>Quick links</h5>
                    <ul>{form.quickLinks.filter((l) => l.visible).map((l) => <li key={l.id}>{l.label || "Untitled"}</li>)}</ul>
                </div>
                <div>
                    <h5>More</h5>
                    <ul>{form.footerLinks.filter((l) => l.visible).map((l) => <li key={l.id}>{l.label || "Untitled"}</li>)}</ul>
                </div>
            </div>
            <p className="ns-pv-copy">{form.copyright || "Copyright line"}</p>
        </div>
    );
}

/* ====================================================================
   MODULE FORMS
==================================================================== */

function HeaderForm({ form, set, errors }) {
    const it = form.button;
    return (
        <>
            <div className="ns-block">
                <BlockHead title="Header menu" text="Top-level items appear in the header. Add sub-items to make a drop-down." aside={<span className="ns-limit">{form.items.length} of {LIMITS.top}</span>} />
                <MenuList items={form.items} onChange={(items) => set({ items })} max={LIMITS.top} prefix="h" nested errors={errors} empty="No menu items yet." addLabel="Add menu item" />
                {errors["header.items"] && <p className="ns-error"><Icon name="alert" size={13} /> {errors["header.items"]}</p>}
            </div>
            <div className="ns-block">
                <BlockHead title="Apply button" text="The highlighted button at the right of the header." />
                <div className="ns-subcard">
                    <span className="ns-subcard-tag">Button</span>
                    <ItemFields it={it} errors={errors} keyPrefix="btn" textLabel="Button text" shownLabel="Shown in the header" onPatch={(p) => set({ button: { ...it, ...p } })} />
                </div>
            </div>
        </>
    );
}

function FooterForm({ form, set, errors }) {
    return (
        <>
            <div className="ns-block">
                <BlockHead title="Quick links" text="Shortcuts to the pages visitors use most." aside={<span className="ns-limit">{form.quickLinks.length} of {LIMITS.quickLinks}</span>} />
                <MenuList items={form.quickLinks} onChange={(quickLinks) => set({ quickLinks })} max={LIMITS.quickLinks} prefix="q" nested={false} errors={errors} empty="No quick links yet." addLabel="Add quick link" />
            </div>
            <div className="ns-block">
                <BlockHead title="Footer links" text="Legal and other links along the bottom of the page." aside={<span className="ns-limit">{form.footerLinks.length} of {LIMITS.footerLinks}</span>} />
                <MenuList items={form.footerLinks} onChange={(footerLinks) => set({ footerLinks })} max={LIMITS.footerLinks} prefix="f" nested={false} errors={errors} empty="No footer links yet." addLabel="Add footer link" />
            </div>
            <div className="ns-block">
                <BlockHead title="Social media" text="Leave a box empty to hide that icon." />
                <div className="ns-fields">
                    {SOCIALS.map((s) => (
                        <div key={s.key} className="is-full"><Field label={s.label} type="url" value={form.social[s.key]} error={errors[`social.${s.key}`]} max={300} placeholder={s.placeholder} onChange={(v) => set({ social: { ...form.social, [s.key]: v } })} /></div>
                    ))}
                </div>
            </div>
            <div className="ns-block">
                <BlockHead title="Footer text" />
                <Field label="Tagline" value={form.tagline} error={errors.tagline} max={200} rows={2} onChange={(v) => set({ tagline: v })} hint="A short line under the logo." />
                <Field label="Copyright line" value={form.copyright} error={errors.copyright} max={150} onChange={(v) => set({ copyright: v })} />
            </div>
        </>
    );
}

function BrandingForm({ form, set, errors }) {
    return (
        <>
            <div className="ns-block">
                <BlockHead title="Site identity" text="Used in the header, footer and browser tab." />
                <div className="ns-fields">
                    <div><Field label="Site name" value={form.siteName} error={errors.siteName} max={100} onChange={(v) => set({ siteName: v })} /></div>
                    <div><Field label="Tagline" value={form.tagline} error={errors.tagline} max={150} onChange={(v) => set({ tagline: v })} /></div>
                    <div className="is-full"><MediaField label="Logo" mediaId={form.logoId} error={errors.logoId} needAlt onChange={(id) => set({ logoId: id })} hint="A transparent PNG or SVG works best. The alt text is read aloud by screen readers." /></div>
                    <div className="is-full"><MediaField label="Favicon" mediaId={form.faviconId} onChange={(id) => set({ faviconId: id })} hint="Optional. A small square icon shown in the browser tab." /></div>
                </div>
            </div>
            <div className="ns-block">
                <BlockHead title="SEO defaults" text="Used when a page has no title, description or share image of its own." />
                <Field label="Default page title" value={form.seoTitle} error={errors.seoTitle} max={70} onChange={(v) => set({ seoTitle: v })} hint="Shown in the browser tab and search results." />
                <Field label="Default search description" value={form.seoDescription} error={errors.seoDescription} max={160} rows={3} onChange={(v) => set({ seoDescription: v })} />
                <MediaField label="Default share image" mediaId={form.ogId} onChange={(id) => set({ ogId: id })} hint="Shown when a link is shared on social media or chat." />
            </div>
            <div className="ns-block">
                <BlockHead title="Contact email" text="Used for website emails." />
                <Field label="Contact email" type="email" value={form.contactEmail} error={errors.contactEmail} max={190} placeholder="info@example.com" onChange={(v) => set({ contactEmail: v })} hint="The public phone, address and hours are under Contact and Enquiries." />
            </div>
        </>
    );
}

function HeaderSide({ form }) {
    return (
        <section className="ns-card ns-side-card">
            <BlockHead title="How it looks" text="Updates as you type." />
            <HeaderPreview form={form} />
            <p className="ns-hint ns-hint-pad">Click an item with an arrow to open its drop-down.</p>
        </section>
    );
}

function FooterSide({ form }) {
    return (
        <section className="ns-card ns-side-card">
            <BlockHead title="How it looks" text="Updates as you type." />
            <FooterPreview form={form} />
        </section>
    );
}

function BrandingSide({ form }) {
    const { media } = useNs();
    const logo = media.find((m) => m.id === form.logoId);
    const og = media.find((m) => m.id === form.ogId);
    return (
        <>
            <section className="ns-card ns-side-card">
                <BlockHead title="Logo" />
                <div className="ns-logo-pv">
                    <span className="is-dark">{logo ? <img src={thumbOf(logo)} alt="" /> : form.siteName}</span>
                    <span className="is-light">{logo ? <img src={thumbOf(logo)} alt="" /> : form.siteName}</span>
                </div>
                <p className="ns-hint">On a dark and a light background.</p>
            </section>
            <section className="ns-card ns-side-card">
                <BlockHead title="Search result preview" />
                <div className="ns-serp">
                    {og && <img src={thumbOf(og)} alt="" />}
                    <span>perlis-sandbox.my</span>
                    <strong>{form.seoTitle || "Page title"}</strong>
                    <p>{form.seoDescription || "Search description"}</p>
                </div>
            </section>
        </>
    );
}

const VIEWS = {
    header: { validate: validateHeader, Form: HeaderForm, Side: HeaderSide, title: "Who changed the header menu" },
    footer: { validate: validateFooter, Form: FooterForm, Side: FooterSide, title: "Who changed the footer" },
    branding: { validate: validateBranding, Form: BrandingForm, Side: BrandingSide, title: "Who changed the site identity" },
};

/* ====================================================================
   MODULE SCREEN: form, preview, save bar and History for one module
==================================================================== */

function ModuleView({ module }) {
    const { data, history, save, notify, live, dirtyRef } = useNs();
    const view = VIEWS[module.key];
    const initial = data[module.key];

    const [saved, setSaved] = useState(() => clone(initial));
    const [form, setForm] = useState(() => clone(initial));
    const [submitted, setSubmitted] = useState(false);
    const [tab, setTab] = useState("content");
    const busyRef = useRef(false);

    /* live mode: follow what Laravel sends back after each save */
    useEffect(() => { if (live) { setSaved(clone(initial)); setForm(clone(initial)); } }, [live, initial]);

    const dirty = useMemo(() => !sameJson(contentOf(form), contentOf(saved)), [form, saved]);
    const allErrors = useMemo(() => view.validate(form), [view, form]);
    const errors = submitted ? allErrors : {};
    const errorCount = Object.keys(allErrors).length;
    const set = (patch) => setForm((f) => ({ ...f, ...patch }));
    const entries = history.filter((h) => h.key === module.historyKey);
    const { Form, Side } = view;

    useEffect(() => { dirtyRef.current = dirty; return () => { dirtyRef.current = false; }; }, [dirty, dirtyRef]);

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

    const onSave = () => {
        if (!dirty) return;
        if (errorCount) {
            setSubmitted(true);
            setTab("content");
            notify("error", `Fix ${errorCount} field${errorCount === 1 ? "" : "s"} before saving.`);
            setTimeout(() => document.querySelector(".ns-field.has-error, .ns-error")?.scrollIntoView({ behavior: "smooth", block: "center" }), 80);
            return;
        }
        busyRef.current = true;
        save(module.key, contentOf(form), (rec) => {
            busyRef.current = false;
            setSubmitted(false);
            notify("ok", "Saved. Visitors now see these changes.");
            if (!live) { setSaved(clone(rec)); setForm(clone(rec)); }
        }, () => { busyRef.current = false; });
    };

    /* Ctrl / Cmd + S saves */
    useEffect(() => {
        const onKey = (e) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") { e.preventDefault(); onSave(); } };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    });

    return (
        <>
            <div className="ns-seg ns-seg-tabs" role="tablist" aria-label={module.label}>
                <button type="button" role="tab" aria-selected={tab === "content"} className={tab === "content" ? "is-on" : ""} onClick={() => setTab("content")}>
                    Content {submitted && errorCount > 0 && <span className="ns-badge-error">{errorCount}</span>}
                </button>
                <button type="button" role="tab" aria-selected={tab === "history"} className={tab === "history" ? "is-on" : ""} onClick={() => setTab("history")}>History <span className="ns-badge">{entries.length}</span></button>
            </div>

            {tab === "history" ? (
                <HistoryPanel entries={entries} title={view.title} />
            ) : (
                <div className="ns-layout">
                    <section className="ns-card">
                        <header className="ns-card-head">
                            <div>
                                <span className="ns-card-no">Site settings</span>
                                <h2>{module.label}</h2>
                                <p>{module.hint}. Changes go live when you save.{form.updatedAt ? ` Last edited ${timeAgo(form.updatedAt)} by ${form.updatedBy}.` : ""}</p>
                            </div>
                            <button type="button" className="ns-btn-dark" onClick={onSave} disabled={!dirty}><span className="ns-btn-icon"><Icon name="save" size={16} /></span> Save</button>
                        </header>
                        <Form form={form} set={set} errors={errors} />
                    </section>
                    <aside className="ns-side"><Side form={form} /></aside>
                </div>
            )}

            {dirty && (
                <div className="ns-savebar" role="region" aria-label="Unsaved changes">
                    <span className="ns-savebar-text"><i /> Unsaved changes</span>
                    <div>
                        <button type="button" className="ns-btn-ghost" onClick={() => { setForm(clone(saved)); setSubmitted(false); notify("info", "Changes discarded."); }}>Discard</button>
                        <button type="button" className="ns-btn-yellow" onClick={onSave}>Save</button>
                    </div>
                </div>
            )}
        </>
    );
}

/* ====================================================================
   PAGE
==================================================================== */

export default function AdminNavigationandSettings() {
    const { props, url } = usePage();
    const live = Boolean(props.navSettings?.header);

    const seed = useRef(live ? props.navSettings : sample).current;
    const [local, setLocal] = useState(() => ({ header: clone(seed.header), footer: clone(seed.footer), branding: clone(seed.branding), history: clone(seed.history || []) }));
    const [mediaList, setMediaList] = useState(seed.media);

    const src = live ? props.navSettings : local;
    const media = live ? props.navSettings.media : mediaList;
    const pages = live ? props.navSettings.pages : seed.pages;
    const history = src.history || [];
    const data = { header: src.header, footer: src.footer, branding: src.branding };
    const me = props.auth?.user?.name || "You";

    const [active, setActive] = useState(() => {
        const wanted = props.section || MODULES.find((m) => (url || "").includes(`/settings/${m.route}`))?.route;
        const i = MODULES.findIndex((m) => m.route === wanted);
        return i >= 0 ? i : 0;
    });
    const [dlg, setDlg] = useState(null);
    const [picker, setPicker] = useState(null);
    const [toast, setToast] = useState(null);
    const dirtyRef = useRef(false);

    const module = MODULES[active];
    const notify = (tone, text) => setToast({ tone, text });

    useEffect(() => {
        if (!toast) return undefined;
        const t = setTimeout(() => setToast(null), 5000);
        return () => clearTimeout(t);
    }, [toast]);

    /* changes are live as soon as they are saved */
    const save = (key, rec, done, fail) => {
        if (live) {
            router.put(API[key], { record: rec }, { preserveScroll: true, onSuccess: () => done(rec), onError: () => { fail?.(); notify("error", "The server rejected some values. Check the highlighted fields."); } });
            return;
        }
        setTimeout(() => {
            const prev = local[key];
            const next = { ...rec, updatedAt: new Date().toISOString(), updatedBy: me };
            const label = MODULES.find((m) => m.key === key);
            setLocal((l) => ({
                ...l,
                [key]: next,
                history: [{ id: Date.now() + Math.random(), key: label.historyKey, user: me, action: "UPDATE", label: label.label, at: next.updatedAt, changes: describe(key, prev, next, pages) }, ...l.history],
            }));
            done(next);
        }, 300);
    };

    const uploadMedia = (file) => {
        const item2 = { id: Date.now(), name: file.name, type: "image", alt: "", size: `${Math.max(1, Math.round(file.size / 1024))} KB`, url: URL.createObjectURL(file) };
        if (live) router.post(API.upload, { file }, { forceFormData: true, preserveScroll: true, onSuccess: () => notify("ok", `${file.name} uploaded.`), onError: () => notify("error", "The file could not be uploaded.") });
        else { setMediaList((m) => [item2, ...m]); notify("ok", `${file.name} added (sample data, not stored).`); }
    };

    const switchTo = (i) => {
        if (i === active) return;
        if (dirtyRef.current && !window.confirm("You have unsaved changes. Switch and discard them?")) return;
        setActive(i);
    };

    const ctx = { live, data, media, pages, history, notify, save, dirtyRef, confirm: (d) => setDlg(d), pickMedia: (opts) => setPicker(opts) };

    return (
        <Ctx.Provider value={ctx}>
            <div className="psb-settings">
                <div className="ns-heading">
                    <div>
                        <h1>Navigation and Settings</h1>
                        <p>Control the header and footer menus, the Apply button, social links, the logo, and the defaults used by search engines on the Perlis Airspace Sandbox website.</p>
                    </div>
                </div>

                {!live && (
                    <p className="ns-note"><Icon name="alert" size={16} /><span>Sample data. Every control works, but nothing is stored until your controller sends the <b>navSettings</b> prop.</span></p>
                )}

                <div className="ns-tabs" role="tablist" aria-label="Navigation and Settings modules">
                    {MODULES.map((m, i) => (
                        <button key={m.key} type="button" role="tab" aria-selected={active === i} className={active === i ? "is-active" : ""} onClick={() => switchTo(i)}>
                            {m.label}
                        </button>
                    ))}
                </div>

                <ModuleView key={module.key} module={module} />

                {dlg && <ConfirmDialog dlg={dlg} onClose={() => setDlg(null)} />}
                {picker && <MediaPicker state={picker} media={media} onClose={() => setPicker(null)} onUpload={uploadMedia} />}

                {toast && (
                    <div className={`ns-toast is-${toast.tone}`} role="status">
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
   AdminNavigationandSettings.layout = (page) => <NavigationBar>{page}</NavigationBar>;    */

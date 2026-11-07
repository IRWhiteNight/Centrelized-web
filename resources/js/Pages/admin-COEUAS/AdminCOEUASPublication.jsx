import { createContext, useContext, useEffect, useId, useMemo, useRef, useState } from "react";
import { router, usePage } from "@inertiajs/react";
import "../../../css/admin-COEUAS-css/admin-publication.css";

/* ====================================================================
   COE-UAS ADMIN → PUBLICATIONS AND IMPACT        /admin/coeuas/publications/*

   Site map 1.3 (COE-UAS workspace → "Publications and Impact"), one editor, five views:
     publications  Publications (journal, conference, book, other)  → publications                  (/publications/publications)
     authors       Author-to-member linking                          → publication_authors           (/publications/authors)
     import        Bulk import (CSV / BibTeX)                        → creates draft publications    (/publications/import)
     citations     Citations and research impact                     → citation_profiles             (/publications/citations)
     highlights    Annual research highlights                        → annual_highlights             (/publications/highlights)
   Use case 2.3: "Manage Publications", "Link Authors to Members", "Import Publications (CSV / BibTeX)",
   "Manage Citations and Impact", "Manage Annual Highlights".
   Common screens: list with search / filter (year, type, status) / sort, create / edit, preview,
   publish / unpublish, delete to Trash, History tab (audit_logs).

   ADDITION TO THE ERD: annual_highlights has no draft / published column. This page uses `isPublished`
   (BOOLEAN) on it. Publications already have `status` (draft, published).
   publication_authors rows live inside each publication as `authors` (array order = author_order).
   key_statistics (JSON) is edited as label / value rows and sent as an array of { label, value }.

   SAMPLE DATA: works today (changes stay on screen only). Return an Inertia prop named `publications` for LIVE mode:

   Inertia::render('admin-COEUAS/AdminCOEUASPublication', [
       'section' => 'publications',   // publications | authors | import | citations | highlights (your route passes this)
       'publications' => [
           'data'    => ['publications' => [], 'citations' => [], 'highlights' => []], // same shape as `sampleData`
           'catalog' => ['members' => [['id' => 1, 'name' => '...']], 'media' => [...]],
           'history' => [...],   // audit_logs rows
           'previewUrl' => 'https://...',
       ],
   ]);

   Send the same prop for every sidebar route. Save sends only the collections that changed:
   PUT /admin/coeuas/publications  { publications?, citations?, highlights? }
   Imported rows are added as drafts and saved with the rest. The controller must write audit_logs and
   soft-delete (deleted_at) removed records.
==================================================================== */

const BASE = "/admin/coeuas"; // keep in sync with coeuasRoutes.js
const ENDPOINTS = { save: `${BASE}/publications`, upload: `${BASE}/media/upload` };

const VIEWS = [
    { key: "publications", route: "publications", title: "Publications", text: "Journal papers, conference papers, books, chapters and reports shown on the website." },
    { key: "authors", route: "authors", title: "Author-to-member linking", text: "Connect each author to a COE-UAS member so papers appear on member profiles." },
    { key: "import", route: "import", title: "Bulk import", text: "Paste or upload a CSV or BibTeX file. Imported papers arrive as drafts." },
    { key: "citations", route: "citations", title: "Citations and research impact", text: "Scopus, Web of Science and Google Scholar numbers for each member." },
    { key: "highlights", route: "highlights", title: "Annual research highlights", text: "One summary per year, with its key numbers." },
];

const PUB_TYPES = [
    { value: "journal", label: "Journal" }, { value: "conference", label: "Conference" }, { value: "book", label: "Book" },
    { value: "chapter", label: "Book chapter" }, { value: "report", label: "Report" }, { value: "other", label: "Other" },
];
const SOURCES = [{ value: "scopus", label: "Scopus" }, { value: "wos", label: "Web of Science" }, { value: "scholar", label: "Google Scholar" }, { value: "other", label: "Other" }];

const LIMITS = { featured: 6, page: 10 };
const YEAR_MIN = 1980;
const YEAR_MAX = new Date().getFullYear() + 1;
const MIN = 60 * 1000;
const NOW = Date.now();
const minsAgo = (m) => new Date(NOW - m * MIN).toISOString();
let counter = 0;
const uid = () => `n${Date.now().toString(36)}${(counter += 1)}`;

/* ------------------------------ sample data ------------------------------ */

const sampleData = {
    publications: [
        { id: 1, pubType: "journal", title: "Detect-and-avoid for small UAS in shared airspace", venueName: "Journal of Unmanned Vehicle Systems", publisher: "Canadian Science Publishing", publicationYear: 2024, volumeIssuePages: "12(3): 201-219", doi: "10.1139/juvs-2023-0041", externalUrl: "", isFeatured: true, status: "published",
            authors: [{ id: "a1", memberId: 1, externalName: "", isCorresponding: true }, { id: "a2", memberId: 2, externalName: "", isCorresponding: false }, { id: "a3", memberId: null, externalName: "Tan Wei Ming", isCorresponding: false }] },
        { id: 2, pubType: "conference", title: "Visual localisation without GPS", venueName: "International Conference on Unmanned Aircraft Systems", publisher: "IEEE", publicationYear: 2023, volumeIssuePages: "pp. 410-417", doi: "10.1109/ICUAS57906.2023.0001", externalUrl: "", isFeatured: false, status: "published",
            authors: [{ id: "a4", memberId: 2, externalName: "", isCorresponding: true }, { id: "a5", memberId: null, externalName: "Nurul Huda", isCorresponding: false }] },
        { id: 3, pubType: "journal", title: "Safety cases for BVLOS trials", venueName: "Aerospace Science and Technology", publisher: "Elsevier", publicationYear: 2025, volumeIssuePages: "", doi: "", externalUrl: "", isFeatured: false, status: "draft",
            authors: [{ id: "a6", memberId: 1, externalName: "", isCorresponding: true }] },
        { id: 4, pubType: "report", title: "Low-altitude corridor study, interim report", venueName: "", publisher: "COE-UAS", publicationYear: 2022, volumeIssuePages: "", doi: "", externalUrl: "", isFeatured: false, status: "draft", authors: [] },
    ],
    citations: [
        { id: 1, memberId: 1, source: "scopus", totalCitations: 842, hIndex: 14, i10Index: 21, profileUrl: "https://www.scopus.com/authid/detail.uri?authorId=1", lastUpdatedOn: "2026-09-30" },
        { id: 2, memberId: 2, source: "scholar", totalCitations: 310, hIndex: 8, i10Index: 9, profileUrl: "", lastUpdatedOn: "2026-10-12" },
    ],
    highlights: [
        { id: 1, year: 2025, title: "A year of trials and new grants", summary: "Two detect-and-avoid trials, one new national grant and the first industry-funded postdoctoral place.", coverId: null, isPublished: true, stats: [{ id: "s1", label: "Publications", value: "18" }, { id: "s2", label: "Active grants", value: "6" }] },
        { id: 2, year: 2026, title: "", summary: "", coverId: null, isPublished: false, stats: [] },
    ],
};

const sampleCatalog = {
    members: [{ id: 1, name: "Prof. Dr. Ahmad Zaki" }, { id: 2, name: "Dr. Nurul Huda" }, { id: 3, name: "Ir. Dr. Faizal Karim" }],
    media: [{ id: 1, name: "annual-2025.jpg", type: "image", alt: "Trial day", size: "1.0 MB", url: null }],
};

const sampleHistory = [
    { id: 3, user: "Aisyah Rahman", action: "UPDATE", label: "Publications", at: minsAgo(60 * 3), changes: [{ field: "Publications", from: "Previous version", to: "Updated" }] },
    { id: 2, user: "Hafiz Roslan", action: "CREATE", label: "Citation profiles", at: minsAgo(60 * 24 * 4), changes: [] },
    { id: 1, user: "Hafiz Roslan", action: "CREATE", label: "Publications", at: minsAgo(60 * 24 * 10), changes: [] },
];

const KEYS = ["publications", "citations", "highlights"];
const KEY_LABEL = { publications: "Publications", citations: "Citation profiles", highlights: "Annual highlights" };
const VIEW_OF_PREFIX = { p: "publications", c: "citations", h: "highlights", featured: "publications" };

/* ------------------------------- helpers -------------------------------- */

const clone = (v) => JSON.parse(JSON.stringify(v));
const sameJson = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const toNum = (v) => (v === "" || v === null || v === undefined ? "" : Number(v));
const labelOf = (list, value) => list.find((o) => o.value === value)?.label || value;
const idEq = (a, b) => a !== null && a !== undefined && b !== null && b !== undefined && String(a) === String(b);
const idOrNull = (v) => (v ? Number(v) || v : null);
const isUrl = (v) => /^(https?:\/\/)[^\s.]+\.[^\s]{2,}$/i.test(v);
const isDoi = (v) => /^10\.\d{4,9}\/\S+$/.test(v);
const initialsOf = (name = "") => name.split(" ").filter((w) => /^[A-Za-z]/.test(w) && !/\.$/.test(w)).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "?";
const move = (list, from, to) => { if (to < 0 || to >= list.length) return; const [item] = list.splice(from, 1); list.splice(to, 0, item); };

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

function formatDate(iso) {
    if (!iso) return "";
    const d = new Date(`${iso}T00:00:00`);
    return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

/* Name matching: "Zaki, Ahmad", "Ahmad Zaki" and "Prof. Dr. Ahmad Zaki" all give the same tokens. */
const TITLES = new Set(["prof", "dr", "ir", "ts", "dato", "datuk", "assoc", "hj", "haji", "mr", "ms", "mrs"]);
function nameTokens(raw = "") {
    let s = String(raw).trim();
    if (s.includes(",")) { const [last, ...first] = s.split(","); s = `${first.join(" ")} ${last}`; }
    return s.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((t) => t && !TITLES.has(t));
}
function matchMember(name, members) {
    const a = nameTokens(name);
    if (a.length < 2) return null;
    const hit = members.find((m) => {
        const b = nameTokens(m.name);
        const [s, l] = a.length <= b.length ? [a, b] : [b, a];
        return s.length >= 2 && s.every((t) => l.includes(t));
    });
    return hit ? hit.id : null;
}

/* ------------------------------ import parsers ------------------------------ */

function parseCsv(text) {
    const rows = []; let row = []; let cell = ""; let quoted = false;
    const delim = text.split("\n")[0].includes("\t") ? "\t" : ",";
    for (let i = 0; i < text.length; i += 1) {
        const c = text[i];
        if (quoted) {
            if (c === '"' && text[i + 1] === '"') { cell += '"'; i += 1; } else if (c === '"') quoted = false; else cell += c;
        } else if (c === '"') quoted = true;
        else if (c === delim) { row.push(cell); cell = ""; }
        else if (c === "\n" || c === "\r") { if (c === "\r" && text[i + 1] === "\n") i += 1; row.push(cell); rows.push(row); row = []; cell = ""; }
        else cell += c;
    }
    if (cell || row.length) { row.push(cell); rows.push(row); }
    const [head, ...body] = rows.filter((r) => r.some((x) => x.trim()));
    if (!head) return [];
    const keys = head.map((h) => h.trim().toLowerCase());
    return body.map((r) => Object.fromEntries(keys.map((k, i) => [k, (r[i] || "").trim()])));
}

function parseBibtex(src) {
    const out = [];
    let i = 0;
    while ((i = src.indexOf("@", i)) !== -1) {
        const m = /^@(\w+)\s*\{/.exec(src.slice(i));
        if (!m) { i += 1; continue; }
        let j = i + m[0].length; let depth = 1; const start = j;
        while (j < src.length && depth > 0) { if (src[j] === "{") depth += 1; else if (src[j] === "}") depth -= 1; j += 1; }
        const body = src.slice(start, j - 1); i = j;
        const type = m[1].toLowerCase();
        if (["comment", "string", "preamble"].includes(type)) continue;
        const comma = body.indexOf(",");
        const rest = comma >= 0 ? body.slice(comma + 1) : "";
        const fields = {};
        let k = 0;
        while (k < rest.length) {
            const head = /\s*,?\s*(\w+)\s*=\s*/y; head.lastIndex = k;
            const r = head.exec(rest);
            if (!r) break;
            k = head.lastIndex;
            let val = "";
            if (rest[k] === "{") { let d = 1; const s = k + 1; k += 1; while (k < rest.length && d > 0) { if (rest[k] === "{") d += 1; else if (rest[k] === "}") d -= 1; k += 1; } val = rest.slice(s, k - 1); }
            else if (rest[k] === '"') { const e = rest.indexOf('"', k + 1); val = rest.slice(k + 1, e < 0 ? rest.length : e); k = e < 0 ? rest.length : e + 1; }
            else { const bare = /[^,}\s]+/y; bare.lastIndex = k; const v = bare.exec(rest); val = v ? v[0] : ""; k = v ? bare.lastIndex : k + 1; }
            fields[r[1].toLowerCase()] = val.replace(/[{}]/g, "").replace(/\s+/g, " ").trim();
        }
        out.push({ type, fields });
    }
    return out;
}

const BIB_TYPE = { article: "journal", inproceedings: "conference", conference: "conference", proceedings: "conference", book: "book", incollection: "chapter", inbook: "chapter", techreport: "report", report: "report" };
const cleanDoi = (v = "") => v.replace(/^https?:\/\/(dx\.)?doi\.org\//i, "").trim();

/* Both formats become the same draft shape, with authors matched to members where possible. */
function toDrafts(text, members) {
    const isBib = /@\w+\s*\{/.test(text);
    const raw = isBib
        ? parseBibtex(text).map(({ type, fields: f }) => ({
            pubType: BIB_TYPE[type] || "other", title: f.title || "", venueName: f.journal || f.booktitle || f.howpublished || "", publisher: f.publisher || f.institution || "",
            year: f.year || "", vip: [f.volume, f.number ? `(${f.number})` : "", f.pages ? `: ${f.pages}` : ""].join("").trim(), doi: cleanDoi(f.doi), url: f.url || "", authors: f.author || "", sep: /\s+and\s+/i,
        }))
        : parseCsv(text).map((r) => ({
            pubType: PUB_TYPES.some((t) => t.value === (r.type || "").toLowerCase()) ? r.type.toLowerCase() : "other", title: r.title || "", venueName: r.venue || r.journal || r.source || "", publisher: r.publisher || "",
            year: r.year || r.publication_year || "", vip: r.volume_issue_pages || r.volume || r.pages || "", doi: cleanDoi(r.doi), url: r.url || r.external_url || "", authors: r.authors || r.author || "", sep: /\s*;\s*|\s+and\s+/i,
        }));
    return raw.map((x, n) => {
        const names = x.authors.split(x.sep).map((s) => s.trim()).filter(Boolean);
        const authors = names.map((nm) => { const memberId = matchMember(nm, members); return { id: uid(), memberId, externalName: memberId ? "" : (nm.includes(",") ? nm.split(",").slice(1).join(" ").trim() + " " + nm.split(",")[0].trim() : nm), isCorresponding: false }; });
        const year = toNum(x.year);
        return {
            key: `i${n}`,
            pub: { id: uid(), pubType: x.pubType, title: x.title, venueName: x.venueName, publisher: x.publisher, publicationYear: Number.isNaN(year) ? "" : year, volumeIssuePages: x.vip, doi: x.doi, externalUrl: x.url, isFeatured: false, status: "draft", authors },
        };
    });
}

/* ------------------------------ validation ------------------------------- */
/* Drafts only need a title. Published records must be complete. */

function validate(d) {
    const e = {};
    const dois = new Set();
    d.publications.forEach((p) => {
        const k = (f) => `p.${p.id}.${f}`;
        const pub = p.status === "published";
        if (!p.title.trim()) e[k("title")] = "Write the title.";
        if (p.publicationYear !== "" && (p.publicationYear < YEAR_MIN || p.publicationYear > YEAR_MAX)) e[k("year")] = `Use a year from ${YEAR_MIN} to ${YEAR_MAX}.`;
        if (pub && p.publicationYear === "") e[k("year")] = "Add the year before publishing.";
        if (pub && p.pubType !== "report" && !p.venueName.trim()) e[k("venue")] = "Add the journal, conference or book before publishing.";
        if (p.doi && !isDoi(p.doi)) e[k("doi")] = "Use the DOI only, like 10.1000/example (no https://doi.org/).";
        if (p.doi && isDoi(p.doi)) { const key = p.doi.toLowerCase(); if (dois.has(key)) e[k("doi")] = "Another publication already has this DOI."; dois.add(key); }
        if (p.externalUrl && !isUrl(p.externalUrl)) e[k("url")] = "Use a full link, starting with https://";
        if (p.isFeatured && !pub) e[k("featured")] = "Only published papers can be featured.";
        if (pub && p.authors.length === 0) e[k("authors")] = "Add at least one author before publishing.";
        const seen = new Set();
        p.authors.forEach((a) => {
            if (!a.memberId && !a.externalName.trim()) e[k("authors")] = "Every author needs a member or a name.";
            if (a.memberId) { if (seen.has(String(a.memberId))) e[k("authors")] = "A member is listed twice."; seen.add(String(a.memberId)); }
        });
    });
    if (d.publications.filter((p) => p.isFeatured).length > LIMITS.featured) e.featured = `At most ${LIMITS.featured} publications can be featured.`;

    const profiles = new Set();
    d.citations.forEach((c) => {
        const k = (f) => `c.${c.id}.${f}`;
        if (!c.memberId) e[k("member")] = "Choose a member.";
        const key = `${c.memberId}|${c.source}`;
        if (c.memberId) { if (profiles.has(key)) e[k("source")] = "This member already has a profile for this source."; profiles.add(key); }
        ["totalCitations", "hIndex", "i10Index"].forEach((f) => { if (c[f] !== "" && Number(c[f]) < 0) e[k(f)] = "Cannot be negative."; });
        if (c.totalCitations !== "" && c.hIndex !== "" && Number(c.hIndex) > Number(c.totalCitations)) e[k("hIndex")] = "The h-index cannot be higher than total citations.";
        if (c.profileUrl && !isUrl(c.profileUrl)) e[k("url")] = "Use a full link, starting with https://";
    });

    const years = new Set();
    d.highlights.forEach((h) => {
        const k = (f) => `h.${h.id}.${f}`;
        if (h.year === "") e[k("year")] = "Add the year.";
        else if (h.year < YEAR_MIN || h.year > YEAR_MAX) e[k("year")] = `Use a year from ${YEAR_MIN} to ${YEAR_MAX}.`;
        else { if (years.has(String(h.year))) e[k("year")] = "There is already a highlight for this year."; years.add(String(h.year)); }
        if (h.isPublished) {
            if (!h.title.trim()) e[k("title")] = "Add a title before publishing.";
            if (!h.summary.trim()) e[k("summary")] = "Add a summary before publishing.";
        }
        h.stats.forEach((s) => { if (!s.label.trim()) e[k(`stat.${s.id}`)] = "Name this number."; });
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
        upload: <path d="M12 16V4m0 0-4 4m4-4 4 4M4 20h16" />,
        alert: (<><path d="M12 3 2 20h20z" /><path d="M12 10v4M12 17h.01" /></>),
        check: <path d="m5 12 5 5 9-10" />,
        close: <path d="M18 6 6 18M6 6l12 12" />,
        image: (<><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" /></>),
        star: <path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z" />,
        search: (<><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>),
        link: <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3A4 4 0 0 0 11 18.7l1-1" />,
    }[name];
    return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{p}</svg>;
}

/* ------------------------------ small parts ------------------------------ */

const Ctx = createContext(null);
const useCtx = () => useContext(Ctx);

function Field({ label, errorKey, value, onChange, textarea, hint, type = "text", rows = 3, min, maxValue, className = "" }) {
    const { errors } = useCtx();
    const errId = useId();
    const error = errorKey ? errors[errorKey] : null;
    const Tag = textarea ? "textarea" : "input";
    return (
        <label className={`cb-field ${className} ${error ? "has-error" : ""}`}>
            <span className="cb-field-top"><span>{label}</span></span>
            <Tag className="cb-input" type={textarea ? undefined : type} rows={textarea ? rows : undefined} min={type === "number" ? min : undefined} max={type === "number" ? maxValue : undefined}
                value={value ?? ""} aria-invalid={error ? "true" : undefined} aria-describedby={error ? errId : undefined} onChange={(e) => onChange(e.target.value)} />
            {hint && !error && <em className="cb-hint">{hint}</em>}
            {error && <em className="cb-error" id={errId}><Icon name="alert" size={13} /> {error}</em>}
        </label>
    );
}

function Select({ label, value, options, onChange, errorKey, empty, hint, className = "" }) {
    const { errors } = useCtx();
    const error = errorKey ? errors[errorKey] : null;
    return (
        <label className={`cb-field ${className} ${error ? "has-error" : ""}`}>
            <span className="cb-field-top"><span>{label}</span></span>
            <select className="cb-input" value={value ?? ""} onChange={(e) => onChange(e.target.value)}>
                {empty && <option value="">{empty}</option>}
                {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            {hint && !error && <em className="cb-hint">{hint}</em>}
            {error && <em className="cb-error"><Icon name="alert" size={13} /> {error}</em>}
        </label>
    );
}

function Switch({ checked, onChange, label, disabled, title }) {
    return (
        <label className={`cb-switch ${disabled ? "is-disabled" : ""}`} title={title}>
            <input type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
            <i aria-hidden="true" />
            {label && <span>{label}</span>}
        </label>
    );
}

function Mover({ index, count, onMove, onDelete, deleteLabel, noMove }) {
    return (
        <div className="cb-mover">
            {!noMove && <button type="button" className="cb-iconbtn" disabled={index === 0} onClick={() => onMove(index - 1)} aria-label="Move up"><Icon name="up" size={16} /></button>}
            {!noMove && <button type="button" className="cb-iconbtn" disabled={index === count - 1} onClick={() => onMove(index + 1)} aria-label="Move down"><Icon name="down" size={16} /></button>}
            <button type="button" className="cb-iconbtn is-danger" onClick={onDelete} aria-label={deleteLabel}><Icon name="trash" size={16} /></button>
        </div>
    );
}

function MediaSlot({ label, mediaId, onPick, onClear }) {
    const { media } = useCtx();
    const item = media.find((m) => idEq(m.id, mediaId));
    return (
        <div className="cb-media">
            <span className="cb-media-label">{label}</span>
            <div className="cb-media-box">
                <span className={`cb-thumb ${item ? "has-item" : ""}`}>{item?.url ? <img src={item.url} alt="" /> : <Icon name="image" size={20} />}</span>
                <span className="cb-media-text"><strong>{item ? item.name : "Nothing selected"}</strong><small>{item ? item.alt || "No alt text yet" : "Choose from the Media Library"}</small></span>
                <button type="button" className="cb-btn-small" onClick={onPick}>{item ? "Change" : "Choose"}</button>
                {item && <button type="button" className="cb-iconbtn" aria-label="Remove image" onClick={onClear}><Icon name="close" size={15} /></button>}
            </div>
        </div>
    );
}

function Chips({ options, value, onChange, counts, label }) {
    return (
        <div className="cb-chips" role="tablist" aria-label={label}>
            {options.map((t) => (
                <button key={t.value} type="button" role="tab" aria-selected={value === t.value} className={value === t.value ? "is-active" : ""} onClick={() => onChange(t.value)}>
                    {t.label}<b>{counts[t.value] ?? 0}</b>
                </button>
            ))}
        </div>
    );
}

function SearchBox({ value, onChange, placeholder }) {
    return (
        <label className="cb-search">
            <Icon name="search" size={16} />
            <input type="search" value={value} placeholder={placeholder} aria-label={placeholder} onChange={(e) => onChange(e.target.value)} />
        </label>
    );
}

function PanelHead({ title, text, children }) {
    return <div className="cb-panel-head"><div><h2>{title}</h2><p>{text}</p></div>{children}</div>;
}

const authorName = (a, nameOf) => (a.memberId ? nameOf(a.memberId) : a.externalName) || "Unnamed author";
const authorLine = (p, nameOf) => p.authors.map((a) => authorName(a, nameOf)).join(", ");

/* ------------------------------ 1. publications ------------------------------ */

function PublicationsView() {
    const { data, edit, errors, askDelete, nameOf, openId, setOpenId } = useCtx();
    const [q, setQ] = useState("");
    const [type, setType] = useState("all");
    const [status, setStatus] = useState("all");
    const [year, setYear] = useState("all");
    const [sort, setSort] = useState("year");
    const [shown, setShown] = useState(LIMITS.page);
    const items = data.publications;
    const featuredCount = items.filter((p) => p.isFeatured).length;
    const years = [...new Set(items.map((p) => p.publicationYear).filter((y) => y !== ""))].sort((a, b) => b - a);
    const counts = { all: items.length, ...Object.fromEntries(PUB_TYPES.map((t) => [t.value, items.filter((p) => p.pubType === t.value).length])) };
    const reset = () => setShown(LIMITS.page);

    const list = useMemo(() => {
        const term = q.trim().toLowerCase();
        const out = items.map((p, i) => ({ p, i })).filter(({ p }) =>
            (type === "all" || p.pubType === type) && (status === "all" || (status === "featured" ? p.isFeatured : p.status === status)) && (year === "all" || String(p.publicationYear) === year) &&
            (!term || `${p.title} ${p.venueName} ${p.doi} ${authorLine(p, nameOf)}`.toLowerCase().includes(term)));
        out.sort((a, b) => (sort === "year" ? Number(b.p.publicationYear || 0) - Number(a.p.publicationYear || 0) : sort === "year-asc" ? Number(a.p.publicationYear || 9999) - Number(b.p.publicationYear || 9999) : a.p.title.localeCompare(b.p.title)));
        return out;
    }, [items, q, type, status, year, sort, nameOf]);

    const add = () => {
        const rec = { id: uid(), pubType: "journal", title: "", venueName: "", publisher: "", publicationYear: new Date().getFullYear(), volumeIssuePages: "", doi: "", externalUrl: "", isFeatured: false, status: "draft", authors: [] };
        edit((d) => { d.publications.push(rec); });
        setType("all"); setStatus("all"); setYear("all"); setQ(""); setOpenId(rec.id);
    };

    return (
        <div className="cb-panel">
            <PanelHead title="Publications" text={`${items.length} publications. ${featuredCount} of ${LIMITS.featured} featured on the Home page.`}>
                <button type="button" className="cb-btn-small" onClick={add}><Icon name="plus" size={15} /> Add publication</button>
            </PanelHead>
            {errors.featured && <em className="cb-error"><Icon name="alert" size={13} /> {errors.featured}</em>}
            <div className="cb-toolbar">
                <SearchBox value={q} onChange={(v) => { setQ(v); reset(); }} placeholder="Search title, venue, DOI or author" />
                <select className="cb-input" aria-label="Status" value={status} onChange={(e) => { setStatus(e.target.value); reset(); }}>
                    <option value="all">Any status</option><option value="published">Published</option><option value="draft">Draft</option><option value="featured">Featured on Home</option>
                </select>
                <select className="cb-input" aria-label="Year" value={year} onChange={(e) => { setYear(e.target.value); reset(); }}>
                    <option value="all">All years</option>{years.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
                <select className="cb-input" aria-label="Sort" value={sort} onChange={(e) => setSort(e.target.value)}>
                    <option value="year">Newest year first</option><option value="year-asc">Oldest year first</option><option value="title">Title A to Z</option>
                </select>
            </div>
            <Chips label="Filter by type" value={type} onChange={(v) => { setType(v); reset(); }} counts={counts} options={[{ value: "all", label: "All" }, ...PUB_TYPES]} />
            {list.length === 0 && <p className="cb-empty">{items.length ? "No publications match these filters." : "No publications yet. Add one, or use Bulk import."}</p>}
            <ol className="cb-list">
                {list.slice(0, shown).map(({ p, i }) => {
                    const open = idEq(openId, p.id);
                    const bad = Object.keys(errors).filter((k) => k.startsWith(`p.${p.id}.`)).length;
                    const set = (patch) => edit((d) => { Object.assign(d.publications[i], patch); });
                    const k = (f) => `p.${p.id}.${f}`;
                    const published = p.status === "published";
                    return (
                        <li key={p.id} className="cb-card">
                            <div className="cb-card-top">
                                <button type="button" className="cb-toggle" aria-expanded={open} onClick={() => setOpenId(open ? null : p.id)}>
                                    <span className="cb-toggle-text"><strong>{p.title || "New publication"}</strong><small>{[labelOf(PUB_TYPES, p.pubType), p.publicationYear, p.venueName].filter(Boolean).join(" · ")}</small></span>
                                    <Icon name={open ? "up" : "down"} size={17} />
                                </button>
                                {bad > 0 && <span className="cb-badge-error">{bad}</span>}
                                {p.authors.some((a) => !a.memberId) && <span className="cb-pill is-info" title="Some authors are not linked to a member">{p.authors.filter((a) => !a.memberId).length} external</span>}
                                <span className={`cb-pill ${published ? "is-ok" : "is-warn"}`}>{published ? "Published" : "Draft"}</span>
                                <Mover noMove deleteLabel={`Delete ${p.title || "publication"}`} onDelete={() => askDelete({ what: p.title || "this publication", onConfirm: () => edit((d) => { d.publications.splice(i, 1); }) })} />
                            </div>
                            {open && (
                                <div className="cb-card-body">
                                    <div className="cb-grid">
                                        <Field className="cb-full" label="Title" textarea rows={2} errorKey={k("title")} value={p.title} onChange={(v) => set({ title: v })} />
                                        <Select label="Type" value={p.pubType} options={PUB_TYPES} onChange={(v) => set({ pubType: v })} />
                                        <Field label="Year" type="number" min={YEAR_MIN} maxValue={YEAR_MAX} errorKey={k("year")} value={p.publicationYear} onChange={(v) => set({ publicationYear: toNum(v) })} />
                                        <Field label={p.pubType === "conference" ? "Conference" : p.pubType === "book" || p.pubType === "chapter" ? "Book" : "Journal or venue"} errorKey={k("venue")} value={p.venueName} onChange={(v) => set({ venueName: v })} />
                                        <Field label="Publisher" value={p.publisher} onChange={(v) => set({ publisher: v })} />
                                        <Field label="Volume, issue, pages" value={p.volumeIssuePages} hint="For example 12(3): 201-219" onChange={(v) => set({ volumeIssuePages: v })} />
                                        <Field label="DOI" errorKey={k("doi")} value={p.doi} hint="Only the number, like 10.1000/example" onChange={(v) => set({ doi: v.trim() })} />
                                        <Field className="cb-full" label="External link" errorKey={k("url")} value={p.externalUrl} hint="Optional. Used when there is no DOI." onChange={(v) => set({ externalUrl: v })} />
                                    </div>
                                    <div className={`cb-field ${errors[k("authors")] ? "has-error" : ""}`}>
                                        <span className="cb-field-top"><span>Authors</span></span>
                                        <p className="cb-authors-line">{p.authors.length ? authorLine(p, nameOf) : "No authors yet."} <button type="button" className="cb-link" onClick={() => { setOpenId(p.id); window.dispatchEvent(new CustomEvent("cb-go", { detail: "authors" })); }}>Edit authors</button></p>
                                        {errors[k("authors")] && <em className="cb-error"><Icon name="alert" size={13} /> {errors[k("authors")]}</em>}
                                    </div>
                                    <div className="cb-switches">
                                        <Switch checked={published} label={published ? "Published on the website" : "Draft, not on the website"} onChange={(v) => set({ status: v ? "published" : "draft", ...(v ? {} : { isFeatured: false }) })} />
                                        <Switch checked={p.isFeatured} disabled={!published || (!p.isFeatured && featuredCount >= LIMITS.featured)} label={`Featured on the Home page (${featuredCount} of ${LIMITS.featured})`}
                                            title={!published ? "Publish the paper first" : undefined} onChange={(v) => set({ isFeatured: v })} />
                                        {errors[k("featured")] && <em className="cb-error"><Icon name="alert" size={13} /> {errors[k("featured")]}</em>}
                                    </div>
                                </div>
                            )}
                        </li>
                    );
                })}
            </ol>
            {list.length > shown && <button type="button" className="cb-btn-outline cb-more" onClick={() => setShown((n) => n + LIMITS.page)}>Show more ({list.length - shown} left)</button>}
        </div>
    );
}

/* ------------------------------ 2. author linking ------------------------------ */

function AuthorsView() {
    const { data, edit, errors, members, nameOf, openId, setOpenId } = useCtx();
    const [q, setQ] = useState("");
    const [filter, setFilter] = useState("all");
    const [shown, setShown] = useState(LIMITS.page);
    const items = data.publications;
    const external = (p) => p.authors.filter((a) => !a.memberId && a.externalName.trim());
    const counts = { all: items.length, unlinked: items.filter((p) => external(p).length).length, none: items.filter((p) => p.authors.length === 0).length, linked: items.filter((p) => p.authors.length && !external(p).length).length };
    const list = items.map((p, i) => ({ p, i })).filter(({ p }) =>
        (filter === "all" || (filter === "unlinked" ? external(p).length > 0 : filter === "none" ? p.authors.length === 0 : p.authors.length > 0 && !external(p).length)) &&
        (!q.trim() || `${p.title} ${authorLine(p, nameOf)}`.toLowerCase().includes(q.trim().toLowerCase())));
    const suggestions = items.reduce((n, p) => n + external(p).filter((a) => matchMember(a.externalName, members)).length, 0);

    const linkAll = () => edit((d) => {
        d.publications.forEach((p) => {
            p.authors.forEach((a) => { if (!a.memberId && a.externalName.trim()) { const id = matchMember(a.externalName, members); if (id && !p.authors.some((x) => idEq(x.memberId, id))) { a.memberId = id; a.externalName = ""; } } });
        });
    });

    return (
        <div className="cb-panel">
            <PanelHead title="Author-to-member linking" text="Linked authors make the paper appear on that member's profile. Authors outside the centre stay as plain names.">
                {suggestions > 0 && <button type="button" className="cb-btn-small" onClick={linkAll}><Icon name="link" size={15} /> Link {suggestions} matching name{suggestions === 1 ? "" : "s"}</button>}
            </PanelHead>
            <div className="cb-toolbar is-one"><SearchBox value={q} onChange={(v) => { setQ(v); setShown(LIMITS.page); }} placeholder="Search title or author" /></div>
            <Chips label="Filter" value={filter} onChange={(v) => { setFilter(v); setShown(LIMITS.page); }} counts={counts}
                options={[{ value: "all", label: "All" }, { value: "unlinked", label: "Has external authors" }, { value: "none", label: "No authors" }, { value: "linked", label: "All linked" }]} />
            {list.length === 0 && <p className="cb-empty">No publications match.</p>}
            <ol className="cb-list">
                {list.slice(0, shown).map(({ p, i }) => {
                    const open = idEq(openId, p.id);
                    const setAuthors = (fn) => edit((d) => { fn(d.publications[i].authors); });
                    const err = errors[`p.${p.id}.authors`];
                    return (
                        <li key={p.id} className="cb-card">
                            <div className="cb-card-top">
                                <button type="button" className="cb-toggle" aria-expanded={open} onClick={() => setOpenId(open ? null : p.id)}>
                                    <span className="cb-toggle-text"><strong>{p.title || "Untitled publication"}</strong><small>{p.authors.length ? authorLine(p, nameOf) : "No authors yet"}</small></span>
                                    <Icon name={open ? "up" : "down"} size={17} />
                                </button>
                                {err && <span className="cb-badge-error">!</span>}
                                <span className="cb-pill">{p.authors.filter((a) => a.memberId).length} of {p.authors.length} linked</span>
                            </div>
                            {open && (
                                <div className="cb-card-body">
                                    {err && <em className="cb-error"><Icon name="alert" size={13} /> {err}</em>}
                                    {p.authors.length === 0 && <p className="cb-empty">No authors yet.</p>}
                                    <ol className="cb-list">
                                        {p.authors.map((a, k) => {
                                            const guess = !a.memberId && a.externalName ? matchMember(a.externalName, members) : null;
                                            return (
                                                <li key={a.id} className="cb-authorrow">
                                                    <span className="cb-no">{k + 1}</span>
                                                    <div className="cb-authorrow-main">
                                                        <select className="cb-input" aria-label={`Author ${k + 1} member`} value={a.memberId ?? ""} onChange={(e) => setAuthors((list2) => { list2[k].memberId = idOrNull(e.target.value); if (e.target.value) list2[k].externalName = ""; })}>
                                                            <option value="">External author (not a member)</option>
                                                            {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                                                        </select>
                                                        {!a.memberId && <input className="cb-input" aria-label={`Author ${k + 1} name`} placeholder="Author name as printed" value={a.externalName} onChange={(e) => setAuthors((list2) => { list2[k].externalName = e.target.value; })} />}
                                                        {guess && <button type="button" className="cb-btn-small cb-suggest" onClick={() => setAuthors((list2) => { list2[k].memberId = guess; list2[k].externalName = ""; })}><Icon name="link" size={14} /> Link to {nameOf(guess)}</button>}
                                                    </div>
                                                    <Switch checked={a.isCorresponding} label="Corresponding" onChange={(v) => setAuthors((list2) => { list2[k].isCorresponding = v; })} />
                                                    <Mover index={k} count={p.authors.length} deleteLabel={`Remove author ${k + 1}`} onMove={(to) => setAuthors((list2) => move(list2, k, to))} onDelete={() => setAuthors((list2) => { list2.splice(k, 1); })} />
                                                </li>
                                            );
                                        })}
                                    </ol>
                                    <div className="cb-row-actions">
                                        <button type="button" className="cb-btn-small" onClick={() => setAuthors((l) => { l.push({ id: uid(), memberId: members[0]?.id ?? null, externalName: "", isCorresponding: false }); })}><Icon name="plus" size={15} /> Add member author</button>
                                        <button type="button" className="cb-btn-small" onClick={() => setAuthors((l) => { l.push({ id: uid(), memberId: null, externalName: "", isCorresponding: false }); })}><Icon name="plus" size={15} /> Add external author</button>
                                    </div>
                                </div>
                            )}
                        </li>
                    );
                })}
            </ol>
            {list.length > shown && <button type="button" className="cb-btn-outline cb-more" onClick={() => setShown((n) => n + LIMITS.page)}>Show more ({list.length - shown} left)</button>}
        </div>
    );
}

/* ------------------------------ 3. bulk import ------------------------------ */

const IMPORT_SAMPLE = `type,title,venue,publisher,year,volume_issue_pages,doi,url,authors
journal,"Battery health prediction for survey drones",Journal of Energy Storage,Elsevier,2024,"88: 110-120",10.1016/j.est.2024.0001,,"Zaki, Ahmad; Huda, Nurul; Lee Chong Wei"
conference,Landing pad detection from low altitude,Int. Conf. on Robotics,IEEE,2023,pp. 55-60,,,Nurul Huda; Faizal Karim`;

function ImportView() {
    const { data, edit, members, nameOf, go } = useCtx();
    const [text, setText] = useState("");
    const [rows, setRows] = useState(null);
    const [picked, setPicked] = useState({});
    const [note, setNote] = useState("");
    const fileRef = useRef(null);

    const existing = useMemo(() => ({
        dois: new Set(data.publications.map((p) => p.doi.toLowerCase()).filter(Boolean)),
        titles: new Set(data.publications.map((p) => p.title.trim().toLowerCase())),
    }), [data.publications]);

    const parse = () => {
        const found = toDrafts(text, members);
        if (!text.trim()) { setNote("Paste some text or choose a file first."); setRows(null); return; }
        if (found.length === 0) { setNote("No publications found. Check the format: BibTeX entries start with @article{ and CSV needs a header row with a title column."); setRows(null); return; }
        const marked = found.map((r) => {
            const issue = !r.pub.title.trim() ? "No title" : (r.pub.doi && existing.dois.has(r.pub.doi.toLowerCase())) || existing.titles.has(r.pub.title.trim().toLowerCase()) ? "Already exists" : "";
            return { ...r, issue };
        });
        setRows(marked);
        setPicked(Object.fromEntries(marked.map((r) => [r.key, !r.issue])));
        setNote("");
    };

    const readFile = (file) => { const reader = new FileReader(); reader.onload = () => { setText(String(reader.result || "")); setRows(null); setNote(`${file.name} loaded. Check the preview, then choose Read file.`); }; reader.readAsText(file); };
    const chosen = rows ? rows.filter((r) => picked[r.key]) : [];
    const doImport = () => {
        edit((d) => { chosen.forEach((r) => d.publications.push(r.pub)); });
        setNote(`${chosen.length} publication${chosen.length === 1 ? "" : "s"} added as drafts. Save to keep them.`);
        setRows(null); setText(""); setPicked({});
    };

    return (
        <div className="cb-panel">
            <PanelHead title="Bulk import" text="Works with a BibTeX export (.bib) or a CSV with a header row. Authors are matched to members by name; anything else stays as an external author.">
                <button type="button" className="cb-btn-small" onClick={() => { setText(IMPORT_SAMPLE); setRows(null); setNote(""); }}>Use sample CSV</button>
            </PanelHead>
            <p className="cb-note cb-inline"><Icon name="alert" size={16} /><span>CSV columns: <b>type, title, venue, publisher, year, volume_issue_pages, doi, url, authors</b> (separate authors with a semicolon). Everything imports as a draft, so nothing goes live until you publish it.</span></p>
            <label className="cb-field">
                <span className="cb-field-top"><span>Paste CSV or BibTeX</span></span>
                <textarea className="cb-input cb-mono" rows={9} value={text} onChange={(e) => { setText(e.target.value); setRows(null); }} placeholder={"@article{key,\n  title={...},\n  author={Zaki, Ahmad and Huda, Nurul},\n  year={2024}\n}"} />
            </label>
            <div className="cb-row-actions">
                <input ref={fileRef} type="file" accept=".csv,.bib,.txt,text/csv" hidden onChange={(e) => { if (e.target.files[0]) readFile(e.target.files[0]); e.target.value = ""; }} />
                <button type="button" className="cb-btn-outline" onClick={() => fileRef.current?.click()}><Icon name="upload" size={15} /> Choose file</button>
                <button type="button" className="cb-btn-dark" onClick={parse}>Read file</button>
            </div>
            {note && <p className="cb-note cb-inline"><Icon name="check" size={16} /><span>{note}{!rows && /added as drafts/.test(note) && <> <button type="button" className="cb-link" onClick={() => go("publications")}>Open publications</button></>}</span></p>}

            {rows && (
                <>
                    <div className="cb-block-head">
                        <h3>{rows.length} found, {chosen.length} selected</h3>
                        <div className="cb-row-actions">
                            <button type="button" className="cb-btn-small" onClick={() => setPicked(Object.fromEntries(rows.map((r) => [r.key, !r.issue])))}>Select valid</button>
                            <button type="button" className="cb-btn-small" onClick={() => setPicked({})}>Clear</button>
                        </div>
                    </div>
                    <ul className="cb-list">
                        {rows.map((r) => {
                            const linked = r.pub.authors.filter((a) => a.memberId).length;
                            return (
                                <li key={r.key} className={`cb-importrow ${r.issue ? "has-issue" : ""}`}>
                                    <label className="cb-check"><input type="checkbox" checked={Boolean(picked[r.key])} onChange={(e) => setPicked({ ...picked, [r.key]: e.target.checked })} /><i aria-hidden="true" /></label>
                                    <span className="cb-importrow-main">
                                        <strong>{r.pub.title || "No title"}</strong>
                                        <small>{[labelOf(PUB_TYPES, r.pub.pubType), r.pub.publicationYear, r.pub.venueName].filter(Boolean).join(" · ") || "No details"}</small>
                                        <small>{r.pub.authors.length ? `${r.pub.authors.length} author${r.pub.authors.length === 1 ? "" : "s"}, ${linked} matched to members: ${authorLine(r.pub, nameOf)}` : "No authors"}</small>
                                    </span>
                                    {r.issue ? <span className="cb-pill is-warn">{r.issue}</span> : <span className="cb-pill is-ok">Ready</span>}
                                </li>
                            );
                        })}
                    </ul>
                    <div className="cb-dialog-actions"><button type="button" className="cb-btn-dark" disabled={chosen.length === 0} onClick={doImport}>Import {chosen.length} as drafts</button></div>
                </>
            )}
        </div>
    );
}

/* ------------------------------ 4. citations ------------------------------ */

function CitationsView() {
    const { data, edit, errors, askDelete, members, nameOf, openId, setOpenId } = useCtx();
    const [q, setQ] = useState("");
    const [source, setSource] = useState("all");
    const items = data.citations;
    const without = members.filter((m) => !items.some((c) => idEq(c.memberId, m.id)));
    const counts = { all: items.length, ...Object.fromEntries(SOURCES.map((s) => [s.value, items.filter((c) => c.source === s.value).length])) };
    const list = items.map((c, i) => ({ c, i })).filter(({ c }) => (source === "all" || c.source === source) && (!q.trim() || nameOf(c.memberId).toLowerCase().includes(q.trim().toLowerCase())));
    const memberOptions = members.map((m) => ({ value: m.id, label: m.name }));

    const add = (memberId = null) => {
        const rec = { id: uid(), memberId, source: "scopus", totalCitations: "", hIndex: "", i10Index: "", profileUrl: "", lastUpdatedOn: new Date().toISOString().slice(0, 10) };
        edit((d) => { d.citations.push(rec); });
        setSource("all"); setQ(""); setOpenId(rec.id);
    };

    return (
        <div className="cb-panel">
            <PanelHead title="Citations and research impact" text={`${items.length} citation profiles. ${without.length} member${without.length === 1 ? "" : "s"} without a profile.`}>
                <button type="button" className="cb-btn-small" onClick={() => add()}><Icon name="plus" size={15} /> Add profile</button>
            </PanelHead>
            {without.length > 0 && (
                <div className="cb-suggest-box">
                    <small>Members with no profile yet</small>
                    <div className="cb-tags">{without.map((m) => <button key={m.id} type="button" className="cb-tag" onClick={() => add(m.id)}>+ {m.name}</button>)}</div>
                </div>
            )}
            <div className="cb-toolbar is-one"><SearchBox value={q} onChange={setQ} placeholder="Search member" /></div>
            <Chips label="Filter by source" value={source} onChange={setSource} counts={counts} options={[{ value: "all", label: "All" }, ...SOURCES]} />
            {list.length === 0 && <p className="cb-empty">No citation profiles to show.</p>}
            <ol className="cb-list">
                {list.map(({ c, i }) => {
                    const open = idEq(openId, c.id);
                    const bad = Object.keys(errors).filter((k) => k.startsWith(`c.${c.id}.`)).length;
                    const set = (patch) => edit((d) => { Object.assign(d.citations[i], patch); });
                    const k = (f) => `c.${c.id}.${f}`;
                    return (
                        <li key={c.id} className="cb-card">
                            <div className="cb-card-top">
                                <button type="button" className="cb-toggle" aria-expanded={open} onClick={() => setOpenId(open ? null : c.id)}>
                                    <span className="cb-toggle-text"><strong>{nameOf(c.memberId) || "Choose a member"}</strong><small>{labelOf(SOURCES, c.source)} · {c.totalCitations === "" ? "no numbers yet" : `${c.totalCitations} citations, h-index ${c.hIndex === "" ? "?" : c.hIndex}`}</small></span>
                                    <Icon name={open ? "up" : "down"} size={17} />
                                </button>
                                {bad > 0 && <span className="cb-badge-error">{bad}</span>}
                                {c.lastUpdatedOn && <small className="cb-when">Updated {formatDate(c.lastUpdatedOn)}</small>}
                                <Mover noMove deleteLabel={`Delete profile for ${nameOf(c.memberId) || "member"}`} onDelete={() => askDelete({ what: `${nameOf(c.memberId) || "this"} (${labelOf(SOURCES, c.source)}) profile`, onConfirm: () => edit((d) => { d.citations.splice(i, 1); }) })} />
                            </div>
                            {open && (
                                <div className="cb-card-body">
                                    <div className="cb-grid">
                                        <Select label="Member" value={c.memberId} empty="Choose a member" options={memberOptions} errorKey={k("member")} onChange={(v) => set({ memberId: idOrNull(v) })} />
                                        <Select label="Source" value={c.source} options={SOURCES} errorKey={k("source")} onChange={(v) => set({ source: v })} />
                                        <Field label="Total citations" type="number" min={0} errorKey={k("totalCitations")} value={c.totalCitations} onChange={(v) => set({ totalCitations: toNum(v) })} />
                                        <Field label="h-index" type="number" min={0} errorKey={k("hIndex")} value={c.hIndex} onChange={(v) => set({ hIndex: toNum(v) })} />
                                        <Field label="i10-index" type="number" min={0} errorKey={k("i10Index")} value={c.i10Index} onChange={(v) => set({ i10Index: toNum(v) })} />
                                        <Field label="Numbers last checked" type="date" value={c.lastUpdatedOn} onChange={(v) => set({ lastUpdatedOn: v })} />
                                        <Field className="cb-full" label="Profile link" errorKey={k("url")} value={c.profileUrl} hint="Link to the Scopus, Web of Science or Scholar page" onChange={(v) => set({ profileUrl: v })} />
                                    </div>
                                </div>
                            )}
                        </li>
                    );
                })}
            </ol>
        </div>
    );
}

/* ------------------------------ 5. annual highlights ------------------------------ */

function HighlightsView() {
    const { data, edit, errors, askDelete, pickMedia, openId, setOpenId } = useCtx();
    const items = data.highlights.map((h, i) => ({ h, i })).sort((a, b) => Number(b.h.year || 0) - Number(a.h.year || 0));

    const add = () => {
        const used = new Set(data.highlights.map((h) => Number(h.year)));
        let y = new Date().getFullYear(); while (used.has(y)) y -= 1;
        const rec = { id: uid(), year: y, title: "", summary: "", coverId: null, isPublished: false, stats: [] };
        edit((d) => { d.highlights.push(rec); });
        setOpenId(rec.id);
    };

    return (
        <div className="cb-panel">
            <PanelHead title="Annual research highlights" text="One entry per year. Key numbers show as a row of figures on the website.">
                <button type="button" className="cb-btn-small" onClick={add}><Icon name="plus" size={15} /> Add year</button>
            </PanelHead>
            {items.length === 0 && <p className="cb-empty">No highlights yet.</p>}
            <ol className="cb-list">
                {items.map(({ h, i }) => {
                    const open = idEq(openId, h.id);
                    const bad = Object.keys(errors).filter((k) => k.startsWith(`h.${h.id}.`)).length;
                    const set = (patch) => edit((d) => { Object.assign(d.highlights[i], patch); });
                    const setStat = (j, patch) => edit((d) => { Object.assign(d.highlights[i].stats[j], patch); });
                    const k = (f) => `h.${h.id}.${f}`;
                    const suggested = () => {
                        const pubs = data.publications.filter((p) => p.status === "published" && Number(p.publicationYear) === Number(h.year)).length;
                        const rows = [{ label: "Publications", value: String(pubs) }].filter((r) => !h.stats.some((s) => s.label.toLowerCase() === r.label.toLowerCase()));
                        if (rows.length) edit((d) => { rows.forEach((r) => d.highlights[i].stats.push({ id: uid(), ...r })); });
                    };
                    return (
                        <li key={h.id} className="cb-card">
                            <div className="cb-card-top">
                                <button type="button" className="cb-toggle" aria-expanded={open} onClick={() => setOpenId(open ? null : h.id)}>
                                    <span className="cb-year">{h.year || "?"}</span>
                                    <span className="cb-toggle-text"><strong>{h.title || "Untitled highlight"}</strong><small>{h.stats.length} key number{h.stats.length === 1 ? "" : "s"}</small></span>
                                    <Icon name={open ? "up" : "down"} size={17} />
                                </button>
                                {bad > 0 && <span className="cb-badge-error">{bad}</span>}
                                <span className={`cb-pill ${h.isPublished ? "is-ok" : "is-warn"}`}>{h.isPublished ? "Published" : "Draft"}</span>
                                <Mover noMove deleteLabel={`Delete ${h.year} highlight`} onDelete={() => askDelete({ what: `${h.year} highlight`, onConfirm: () => edit((d) => { d.highlights.splice(i, 1); }) })} />
                            </div>
                            {open && (
                                <div className="cb-card-body">
                                    <div className="cb-grid">
                                        <Field label="Year" type="number" min={YEAR_MIN} maxValue={YEAR_MAX} errorKey={k("year")} value={h.year} onChange={(v) => set({ year: toNum(v) })} />
                                        <Field label="Title" errorKey={k("title")} value={h.title} onChange={(v) => set({ title: v })} />
                                        <Field className="cb-full" label="Summary" textarea rows={6} errorKey={k("summary")} value={h.summary} onChange={(v) => set({ summary: v })} />
                                        <div className="cb-full"><MediaSlot label="Cover image" mediaId={h.coverId} onPick={() => pickMedia({ type: "image", onSelect: (x) => set({ coverId: x.id }) })} onClear={() => set({ coverId: null })} /></div>
                                    </div>
                                    <div className="cb-block">
                                        <div className="cb-block-head">
                                            <h3>Key numbers</h3>
                                            <div className="cb-row-actions">
                                                <button type="button" className="cb-btn-small" onClick={suggested}>Count {h.year} publications</button>
                                                <button type="button" className="cb-btn-small" onClick={() => edit((d) => { d.highlights[i].stats.push({ id: uid(), label: "", value: "" }); })}><Icon name="plus" size={15} /> Add number</button>
                                            </div>
                                        </div>
                                        {h.stats.length === 0 && <p className="cb-empty">No key numbers yet.</p>}
                                        <ol className="cb-list">
                                            {h.stats.map((s, j) => (
                                                <li key={s.id} className="cb-statrow">
                                                    <Field label="Label" errorKey={k(`stat.${s.id}`)} value={s.label} hint={j === 0 ? "For example Active grants" : undefined} onChange={(v) => setStat(j, { label: v })} />
                                                    <Field label="Value" value={s.value} hint={j === 0 ? "For example 6 or RM 1.2 million" : undefined} onChange={(v) => setStat(j, { value: v })} />
                                                    <Mover index={j} count={h.stats.length} deleteLabel={`Delete ${s.label || "number"}`} onMove={(to) => edit((d) => move(d.highlights[i].stats, j, to))} onDelete={() => edit((d) => { d.highlights[i].stats.splice(j, 1); })} />
                                                </li>
                                            ))}
                                        </ol>
                                    </div>
                                    <Switch checked={h.isPublished} label={h.isPublished ? "Published on the website" : "Draft, not on the website"} onChange={(v) => set({ isPublished: v })} />
                                </div>
                            )}
                        </li>
                    );
                })}
            </ol>
        </div>
    );
}

/* --------------------------- history, picker, dialogs --------------------------- */

const ACTION_TONE = { CREATE: "is-new", UPDATE: "is-info", PUBLISH: "is-ok", UNPUBLISH: "is-warn", DELETE: "is-danger", RESTORE: "is-ok" };

function HistoryPanel({ history }) {
    return (
        <div className="cb-panel cb-narrow">
            <PanelHead title="History" text="Every change in Publications and Impact, from the audit log." />
            {history.length === 0 && <p className="cb-empty">Nothing recorded yet.</p>}
            <ol className="cb-history">
                {history.map((h) => (
                    <li key={h.id}>
                        <span className={`cb-pill ${ACTION_TONE[h.action] || "is-info"}`}>{h.action}</span>
                        <div>
                            <strong>{h.label}</strong>
                            <small>{h.user} · {timeAgo(h.at)}</small>
                            {h.changes?.length > 0 && <ul>{h.changes.map((c, k) => <li key={k}>{c.field}: {c.from} → {c.to}</li>)}</ul>}
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
        <div className="cb-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
            <div className="cb-dialog" role="dialog" aria-modal="true" aria-labelledby={titleId}>
                <div className="cb-dialog-head">
                    <h2 id={titleId}>Media Library</h2>
                    <button type="button" className="cb-iconbtn" aria-label="Close" onClick={onClose}><Icon name="close" size={16} /></button>
                </div>
                <div className="cb-media-grid">
                    {list.map((m) => (
                        <button key={m.id} type="button" className="cb-media-item" onClick={() => { state.onSelect(m); onClose(); }}>
                            <span className="cb-media-preview">{m.url ? <img src={m.url} alt="" /> : <Icon name="image" size={26} />}</span>
                            <strong>{m.name}</strong><small>{m.size}</small>
                        </button>
                    ))}
                    {list.length === 0 && <p className="cb-empty">The library has no images yet.</p>}
                </div>
                <div className="cb-dialog-actions">
                    <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => { if (e.target.files[0]) onUpload(e.target.files[0]); e.target.value = ""; }} />
                    <button type="button" className="cb-btn-outline" onClick={() => fileRef.current?.click()}><Icon name="upload" size={15} /> Upload new</button>
                    <button type="button" className="cb-btn-dark" onClick={onClose}>Done</button>
                </div>
            </div>
        </div>
    );
}

/* ---------------------- full-page preview (public look) ---------------------- */

const SITE_NAV = ["Home", "About", "People", "Research and Innovation", "Publications and Impact", "Facilities", "Engagement", "Contact"];
const DEVICES = [{ key: "desktop", label: "Desktop", width: null }, { key: "tablet", label: "Tablet", width: 820 }, { key: "mobile", label: "Mobile", width: 390 }];

function PreviewModal({ data, media, nameOf, view, onClose, previewUrl }) {
    const [device, setDevice] = useState("desktop");
    const width = DEVICES.find((d) => d.key === device).width;
    const imageOf = (id) => media.find((m) => idEq(m.id, id))?.url || null;
    const pubs = data.publications.filter((p) => p.status === "published");
    const showCitations = view === "citations";
    const showHighlights = view === "highlights";
    const hiddenCount = showCitations ? 0 : showHighlights ? data.highlights.filter((h) => !h.isPublished).length : data.publications.length - pubs.length;
    const heading = showCitations ? "Citations and research impact" : showHighlights ? "Annual research highlights" : "Publications";
    const byYear = [...new Set(pubs.map((p) => p.publicationYear || 0))].sort((a, b) => b - a);

    useEffect(() => {
        const onKey = (e) => e.key === "Escape" && onClose();
        document.addEventListener("keydown", onKey);
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
    }, [onClose]);

    let body;
    if (showCitations) {
        const byMember = data.citations.reduce((acc, c) => { if (c.memberId) (acc[c.memberId] ||= []).push(c); return acc; }, {});
        const ids = Object.keys(byMember);
        body = (
            <>
                {ids.length === 0 && <p className="cbv-sub">No citation profiles yet.</p>}
                <ul className="cbv-grid">
                    {ids.map((id) => (
                        <li key={id} className="cbv-card">
                            <b>{nameOf(id)}</b>
                            {byMember[id].map((c) => (
                                <div key={c.id} className="cbv-stats">
                                    <small>{labelOf(SOURCES, c.source)}</small>
                                    <div><b>{c.totalCitations === "" ? "-" : c.totalCitations}</b><small>Citations</small></div>
                                    <div><b>{c.hIndex === "" ? "-" : c.hIndex}</b><small>h-index</small></div>
                                    <div><b>{c.i10Index === "" ? "-" : c.i10Index}</b><small>i10</small></div>
                                </div>
                            ))}
                        </li>
                    ))}
                </ul>
            </>
        );
    } else if (showHighlights) {
        const list = data.highlights.filter((h) => h.isPublished).sort((a, b) => b.year - a.year);
        body = (
            <>
                {list.length === 0 && <p className="cbv-sub">No published highlights yet.</p>}
                <ul className="cbv-stack">
                    {list.map((h) => (
                        <li key={h.id} className="cbv-year">
                            <span className="cbv-yearno">{h.year}</span>
                            <div>
                                {imageOf(h.coverId) && <img className="cbv-cover" src={imageOf(h.coverId)} alt="" />}
                                <h3>{h.title}</h3>
                                <p>{h.summary}</p>
                                {h.stats.length > 0 && <div className="cbv-figures">{h.stats.map((s) => <div key={s.id}><b>{s.value}</b><small>{s.label}</small></div>)}</div>}
                            </div>
                        </li>
                    ))}
                </ul>
            </>
        );
    } else {
        body = (
            <>
                {pubs.length === 0 && <p className="cbv-sub">No published papers yet.</p>}
                {byYear.map((y) => (
                    <div key={y} className="cbv-group">
                        <h3>{y || "Year not set"}</h3>
                        <ul className="cbv-pubs">
                            {pubs.filter((p) => (p.publicationYear || 0) === y).map((p) => (
                                <li key={p.id}>
                                    <em>{labelOf(PUB_TYPES, p.pubType)}</em>
                                    <b>{p.title}</b>
                                    <span>{authorLine(p, nameOf)}</span>
                                    <small>{[p.venueName, p.publisher, p.volumeIssuePages].filter(Boolean).join(", ")}{p.doi ? ` · doi:${p.doi}` : ""}</small>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </>
        );
    }

    return (
        <div className="cbv-overlay" role="dialog" aria-modal="true" aria-label="Page preview">
            <div className="cbv-bar">
                <div className="cbv-bar-left">
                    <span className="cbv-live"><i /> Preview</span>
                    <small>Your current edits, not the live page.{hiddenCount > 0 && ` ${hiddenCount} draft${hiddenCount === 1 ? "" : "s"} hidden.`}</small>
                </div>
                <div className="cbv-devices" role="tablist" aria-label="Screen size">
                    {DEVICES.map((d) => <button key={d.key} type="button" role="tab" aria-selected={device === d.key} className={device === d.key ? "is-on" : ""} onClick={() => setDevice(d.key)}>{d.label}</button>)}
                </div>
                <div className="cbv-bar-right">
                    {previewUrl && <a className="cbv-bar-btn" href={previewUrl} target="_blank" rel="noreferrer">Open saved preview</a>}
                    <button type="button" className="cbv-bar-btn" onClick={onClose}>Close <kbd>Esc</kbd></button>
                </div>
            </div>
            <div className="cbv-stage">
                <div className={`cbv-frame is-${device}`} style={width ? { width } : undefined}>
                    <div className="cbv">
                        <header className="cbv-nav">
                            <b className="cbv-brand"><i />COE-UAS</b>
                            <nav aria-label="Site (preview)">{SITE_NAV.map((n) => <span key={n} className={n === "Publications and Impact" ? "is-on" : ""}>{n}</span>)}</nav>
                            <span className="cbv-cta">Contact us</span>
                        </header>
                        <div className="cbv-hero"><div className="cbv-wrap"><p><span>Publications and Impact</span> {heading}</p></div></div>
                        <section className="cbv-sec"><div className="cbv-wrap"><h2>{heading}</h2>{body}</div></section>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* -------------------------------- the page -------------------------------- */

const pathInfo = (props, url) => ({
    view: VIEWS.find((v) => v.route === props.section)?.key || props.view || VIEWS.find((v) => (url || "").includes(`/publications/${v.route}`))?.key || "publications",
});

export default function AdminCOEUASPublication() {
    const { props, url } = usePage();
    const live = Boolean(props.publications?.data);
    const dialogTitleId = useId();

    const seed = useRef(
        live
            ? { data: { publications: [], citations: [], highlights: [], ...props.publications.data }, catalog: props.publications.catalog || {}, history: props.publications.history || [] }
            : { data: sampleData, catalog: sampleCatalog, history: sampleHistory }
    ).current;

    const [saved, setSaved] = useState(() => clone(seed.data));
    const [data, setData] = useState(() => clone(seed.data));
    const [localHistory, setLocalHistory] = useState(seed.history);
    const [mediaList, setMediaList] = useState(seed.catalog?.media || []);
    const history = live ? props.publications.history || [] : localHistory;

    const [view, setView] = useState(pathInfo(props, url).view);
    const [tab, setTab] = useState("content");
    const [openId, setOpenId] = useState(null);
    const [submitted, setSubmitted] = useState(false);
    const [busy, setBusy] = useState(false);
    const [dialog, setDialog] = useState(null);
    const [picker, setPicker] = useState(null);
    const [preview, setPreview] = useState(false);
    const [toast, setToast] = useState(null);
    const busyRef = useRef(false);

    useEffect(() => { setView(pathInfo(props, url).view); setTab("content"); setOpenId(null); }, [props.section, props.view, url]);

    const dirty = useMemo(() => !sameJson(data, saved), [data, saved]);
    const allErrors = useMemo(() => validate(data), [data]);
    const errors = useMemo(() => ({ ...(props.errors || {}), ...(submitted ? allErrors : {}) }), [props.errors, submitted, allErrors]);
    const totalErrors = Object.keys(allErrors).length;
    const changedKeys = useMemo(() => KEYS.filter((k) => !sameJson(data[k], saved[k])), [data, saved]);
    const changedLabels = changedKeys.map((k) => KEY_LABEL[k]);

    useEffect(() => {
        if (!toast) return undefined;
        const t = setTimeout(() => setToast(null), 5000);
        return () => clearTimeout(t);
    }, [toast]);

    /* warn before leaving with unsaved changes (moving between the Publications links is allowed: same page) */
    useEffect(() => {
        const beforeUnload = (e) => { if (dirty) { e.preventDefault(); e.returnValue = ""; } };
        window.addEventListener("beforeunload", beforeUnload);
        const off = router.on("before", (event) => {
            const target = event?.detail?.visit?.url?.pathname || "";
            if (target.startsWith(`${BASE}/publications`)) return undefined;
            if (dirty && !busyRef.current && !window.confirm("You have unsaved changes. Leave this page and discard them?")) return false;
            return undefined;
        });
        return () => { window.removeEventListener("beforeunload", beforeUnload); if (typeof off === "function") off(); };
    }, [dirty]);

    const media = live ? props.publications.catalog?.media || mediaList : mediaList;
    const members = (live ? props.publications.catalog?.members : seed.catalog.members) || [];
    const nameOf = (id) => members.find((m) => idEq(m.id, id))?.name || "";

    const edit = (fn) => setData((d) => { const copy = clone(d); fn(copy); return copy; });
    const askDelete = (info) => setDialog({ type: "delete", ...info });
    const pickMedia = (opts) => setPicker(opts);
    const finishBusy = () => { setBusy(false); busyRef.current = false; };

    const go = (next) => {
        setView(next); setTab("content");
        if (live) router.visit(`${BASE}/publications/${VIEWS.find((v) => v.key === next).route}`, { preserveState: true, preserveScroll: true });
    };

    /* the "Edit authors" link inside a publication card */
    useEffect(() => {
        const onGo = (e) => setView(e.detail);
        window.addEventListener("cb-go", onGo);
        return () => window.removeEventListener("cb-go", onGo);
    }, []);

    const addHistory = (action, label, changes = []) =>
        setLocalHistory((h) => [{ id: Date.now(), user: "You", action, label, at: new Date().toISOString(), changes }, ...h]);

    const jumpToFirstError = () => {
        const first = Object.keys(allErrors)[0];
        if (!first) return;
        const p = first.split(".");
        setView(p[2] === "authors" ? "authors" : VIEW_OF_PREFIX[p[0]]); setTab("content"); setOpenId(p[1] ?? null);
        setTimeout(() => document.querySelector(".cb-field.has-error")?.scrollIntoView({ behavior: "smooth", block: "center" }), 150);
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
            setSaved(clone(data));
            setSubmitted(false);
            if (!live) addHistory("UPDATE", changedLabels.join(", "), changedLabels.map((l) => ({ field: l, from: "Previous version", to: "Updated" })));
            setToast({ tone: "ok", text: "Saved. Published records are now live on the website." });
            finishBusy();
        };
        if (live) router.put(ENDPOINTS.save, payload, { preserveScroll: true, preserveState: true, onSuccess: done, onError: () => { finishBusy(); setSubmitted(true); setToast({ tone: "error", text: "The server rejected some values. Check the highlighted fields." }); } });
        else setTimeout(done, 350);
    };

    const confirmDelete = () => {
        dialog.onConfirm();
        if (!live) addHistory("DELETE", `${VIEWS.find((v) => v.key === view).title}: ${dialog.what}`, [{ field: "Moved to Trash", from: dialog.what, to: "(deleted)" }]);
        setToast({ tone: "ok", text: `“${dialog.what}” moved to Trash. It leaves the website when you save.` });
        setDialog(null);
    };

    const uploadMedia = (file) => {
        const local = { id: Date.now(), name: file.name, type: "image", alt: "", size: `${(file.size / 1048576).toFixed(1)} MB`, url: URL.createObjectURL(file) };
        if (live) {
            router.post(ENDPOINTS.upload, { file }, { forceFormData: true, preserveScroll: true, preserveState: true, onSuccess: () => setToast({ tone: "ok", text: `${file.name} uploaded.` }), onError: () => setToast({ tone: "error", text: "The upload failed. Try a smaller image." }) });
        } else {
            setMediaList((m) => [local, ...m]);
            setToast({ tone: "ok", text: `${file.name} added (sample data, not stored).` });
        }
    };

    useEffect(() => {
        const onKey = (e) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") { e.preventDefault(); save(); } };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    });

    const ctx = { data, edit, errors, media, members, nameOf, askDelete, pickMedia, openId, setOpenId, go };
    const current = VIEWS.find((v) => v.key === view);
    const publishedCount = data.publications.filter((p) => p.status === "published").length;
    const linkedCount = data.publications.filter((p) => p.authors.some((a) => a.memberId)).length;

    return (
        <Ctx.Provider value={ctx}>
            <div className="coeuas-publication">
                <div className="cb-heading">
                    <div>
                        <h1>{current.title}</h1>
                        <p>{current.text}</p>
                        <div className="cb-status">
                            <span className="cb-pill is-ok">{publishedCount} of {data.publications.length} publications published</span>
                            <span className="cb-pill is-info">{linkedCount} linked to members</span>
                            {dirty && <span className="cb-pill is-warn">Unsaved: {changedLabels.join(", ")}</span>}
                            {totalErrors > 0 && submitted && <span className="cb-pill is-danger">{totalErrors} to fix</span>}
                        </div>
                    </div>
                    <div className="cb-actions">
                        <button type="button" className="cb-btn-outline" onClick={() => setPreview(true)}><Icon name="eye" size={16} /> Preview</button>
                        <button type="button" className="cb-btn-dark" onClick={save} disabled={!dirty || busy}>
                            <span className="cb-btn-icon"><Icon name="save" size={16} /></span> {busy ? "Saving..." : "Save changes"}
                        </button>
                    </div>
                </div>

                {!live && <p className="cb-note"><Icon name="alert" size={16} /><span>Sample data. Every control works, but nothing is stored until your controller sends the <b>publications</b> prop.</span></p>}

                <div className="cb-tabs" role="tablist" aria-label="Publications and Impact sections">
                    {VIEWS.map((v) => (
                        <button key={v.key} type="button" role="tab" aria-selected={view === v.key && tab === "content"} className={view === v.key && tab === "content" ? "is-active" : ""} onClick={() => go(v.key)}>
                            {v.title}
                            {Object.keys(errors).some((k) => { const p = k.split("."); return (p[2] === "authors" ? "authors" : VIEW_OF_PREFIX[p[0]]) === v.key; }) && <span className="cb-badge-error">!</span>}
                        </button>
                    ))}
                    <button type="button" role="tab" aria-selected={tab === "history"} className={tab === "history" ? "is-active" : ""} onClick={() => setTab("history")}>
                        History<span className="cb-badge">{history.length}</span>
                    </button>
                </div>

                {tab === "history" && <HistoryPanel history={history} />}
                {tab === "content" && view === "publications" && <PublicationsView />}
                {tab === "content" && view === "authors" && <AuthorsView />}
                {tab === "content" && view === "import" && <ImportView />}
                {tab === "content" && view === "citations" && <CitationsView />}
                {tab === "content" && view === "highlights" && <HighlightsView />}

                {dirty && (
                    <div className="cb-savebar" role="region" aria-label="Unsaved changes">
                        <span className="cb-savebar-text"><i /> {changedLabels.length} area{changedLabels.length === 1 ? "" : "s"} edited, not saved</span>
                        <div>
                            <button type="button" className="cb-btn-ghost" onClick={() => { setData(clone(saved)); setSubmitted(false); setToast({ tone: "info", text: "Changes discarded." }); }} disabled={busy}>Discard</button>
                            <button type="button" className="cb-btn-accent" onClick={save} disabled={busy}>{busy ? "Saving..." : "Save changes"}</button>
                        </div>
                    </div>
                )}

                {dialog?.type === "delete" && (
                    <div className="cb-overlay" onMouseDown={(e) => e.target === e.currentTarget && setDialog(null)}>
                        <div className="cb-dialog cb-small" role="alertdialog" aria-modal="true" aria-labelledby={dialogTitleId}>
                            <span className="cb-dialog-icon is-danger"><Icon name="trash" size={22} /></span>
                            <h2 id={dialogTitleId}>Delete “{dialog.what}”?</h2>
                            <p>It moves to Deleted content, where only the Super Admin can restore or purge it. It leaves the website when you save.</p>
                            <div className="cb-dialog-actions">
                                <button type="button" className="cb-btn-outline" onClick={() => setDialog(null)} autoFocus>Keep it</button>
                                <button type="button" className="cb-btn-danger" onClick={confirmDelete}><Icon name="trash" size={15} /> Move to Trash</button>
                            </div>
                        </div>
                    </div>
                )}

                {picker && <MediaPicker state={picker} media={media} onClose={() => setPicker(null)} onUpload={uploadMedia} />}
                {preview && <PreviewModal data={data} media={media} nameOf={nameOf} view={view} previewUrl={props.publications?.previewUrl} onClose={() => setPreview(false)} />}

                {toast && (
                    <div className={`cb-toast is-${toast.tone}`} role="status">
                        <Icon name={toast.tone === "error" ? "alert" : "check"} size={16} />
                        <span>{toast.text}</span>
                        <button type="button" aria-label="Dismiss" onClick={() => setToast(null)}><Icon name="close" size={14} /></button>
                    </div>
                )}
            </div>
        </Ctx.Provider>
    );
}

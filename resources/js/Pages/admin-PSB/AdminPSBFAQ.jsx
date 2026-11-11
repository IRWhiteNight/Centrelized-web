import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { router, usePage } from "@inertiajs/react";
import {
    AlertTriangle,
    Check,
    ChevronDown,
    ChevronUp,
    Clock3,
    ExternalLink,
    Eye,
    EyeOff,
    Globe,
    GripVertical,
    Link2Off,
    MessageCircleQuestion,
    MoreHorizontal,
    PanelRight,
    Pencil,
    Plus,
    RefreshCw,
    RotateCcw,
    Save,
    Search,
    Trash2,
    Upload,
    X,
} from "lucide-react";
import "../../../css/admin-PSB-css/admin-faq.css";

/* ====================================================================
   PSB ADMIN → FAQ EDITOR                        /admin/psb/faq/*

   Sections (PSB workspace → "FAQ"), one editor for the whole page:
     1  Questions and Answers   → psb_faqs
     2  Categories              → psb_faq_categories
     3  Page Text and Contact   → page heading, intro, "Still have questions?" box
   Common screens from the Admin CMS document: list with search / filter by
   status / sort, create / edit form, draft + preview + publish, schedule,
   reorder (drag), delete to Trash, History tab (audit_logs).

   LIVE PREVIEW: the panel on the right has two views
     • Draft preview  - the public page built from what is on screen (unsaved edits too)
     • Live site      - the real public page (/faq) in a frame; reloads after publishing

   SAMPLE DATA: the page works today (changes stay on screen only). Return an Inertia
   prop named `faq` and it switches to LIVE mode:

   Route::get('/admin/psb/faq/{section?}', fn ($section = 'questions') =>
       Inertia::render('admin-PSB/AdminPSBFAQ', ['section' => $section])
   )->where('section', 'questions|categories|page-text');

   Inertia::render('admin-PSB/AdminPSBFAQ', [
       'section' => 'questions',
       'faq' => [
           'content' => [...],   // same shape as `sampleContent` below
           'meta'    => [...],   // status, publishedAt, scheduledAt, hasUnpublishedChanges, updatedBy, updatedAt
           'history' => [...],   // audit_logs rows for these records
           'trash'   => [...],   // soft-deleted questions: { id, item, categoryTitle, deletedAt }
           'liveUrl' => '/faq',  // optional, public page address
       ],
   ]);

   LIVE mode requests are listed in ENDPOINTS. The controller must write audit_logs.
==================================================================== */

const BASE = "/admin/psb"; // keep in sync with psbRoutes.js
const ENDPOINTS = {
    save: `${BASE}/faq`, // PUT   { content }            save as draft
    publish: `${BASE}/faq/publish`, // POST  { content }            save + publish now
    schedule: `${BASE}/faq/schedule`, // POST  { content, at }        save + publish later
    unpublish: `${BASE}/faq/unpublish`, // POST
};
const DEFAULT_LIVE_URL = "/faq";

const SECTIONS = [
    { key: "questions", route: "questions", label: "Questions and Answers", hint: "What visitors can read", noun: "question" },
    { key: "categories", route: "categories", label: "Categories", hint: "How questions are grouped", noun: "category" },
    { key: "page", route: "page-text", label: "Page Text and Contact", hint: "Heading, introduction and help box", noun: "block" },
];
/* which saved fields belong to which section (used for the "edited" dots and the publish summary) */
const SECTION_FIELDS = { questions: ["items"], categories: ["categories"], page: ["page", "contact"], seo: ["seo"] };

const QUESTION_STATUS = [
    { value: "draft", label: "Draft", tone: "off" },
    { value: "published", label: "Published", tone: "ok" },
];
const STATUS_BY = Object.fromEntries(QUESTION_STATUS.map((s) => [s.value, s]));

const MIN = 60 * 1000;
const NOW = Date.now();
const minsAgo = (m) => new Date(NOW - m * MIN).toISOString();
const dayOffset = (d) => new Date(NOW + d * 86400000).toISOString().slice(0, 10);
let counter = 0;
const uid = () => `n${Date.now().toString(36)}${(counter += 1)}`;

/* ------------------------------ sample data ------------------------------ */

const sampleContent = {
    page: {
        heading: "Frequently asked *questions.*",
        intro: "Find answers to common questions about the Perlis Airspace Sandbox.",
    },
    categories: [
        { id: "c1", title: "General Information" },
        { id: "c2", title: "About Perlis Airspace Sandbox" },
        { id: "c3", title: "Participation and Applications" },
        { id: "c4", title: "Testing and Operations" },
        { id: "c5", title: "Facilities and Infrastructure" },
    ],
    items: [
        { id: "q1", categoryId: "c1", status: "published", updatedAt: dayOffset(-9), question: "What is the Perlis Airspace Sandbox?", answer: "The Perlis Airspace Sandbox is an initiative designed to provide a structured environment for testing, demonstrating and developing Unmanned Aircraft Systems (UAS) and related technologies. It supports innovation, collaboration and the development of the Malaysian drone ecosystem." },
        { id: "q2", categoryId: "c1", status: "published", updatedAt: dayOffset(-9), question: "Where is the Perlis Airspace Sandbox located?", answer: "The Perlis Airspace Sandbox is located in Perlis, Malaysia. Detailed location information, access instructions and operational information are available on the Site Information page." },
        { id: "q3", categoryId: "c2", status: "published", updatedAt: dayOffset(-10), question: "Why was Perlis selected for the sandbox?", answer: "Perlis provides opportunities to develop a dedicated environment for UAS innovation, research, testing and collaboration. Its strategic location and potential for aviation-related development make it a suitable location for the initiative." },
        { id: "q4", categoryId: "c3", status: "published", updatedAt: dayOffset(-9), question: "Who can participate in the sandbox?", answer: "Participation may be open to drone operators, technology developers, researchers, universities, industry partners, government agencies and other relevant organisations, subject to programme requirements and applicable approvals." },
        { id: "q5", categoryId: "c3", status: "published", updatedAt: dayOffset(-9), question: "How can I apply to participate?", answer: "Interested participants can submit an application through the Apply to Participate section of the Perlis Airspace Sandbox website. Applications will be reviewed according to the relevant programme requirements." },
        { id: "q6", categoryId: "c4", status: "published", updatedAt: dayOffset(-12), question: "Do drone operations require approval?", answer: "Drone operations must comply with applicable aviation regulations, airspace requirements and operational approvals. Participants should refer to the relevant authorities and the sandbox operational guidelines before conducting any activities." },
        { id: "q7", categoryId: "c5", status: "draft", updatedAt: dayOffset(-8), question: "What facilities are available?", answer: "Information about available facilities, infrastructure and technical support will be provided through the Site Information and Services sections." },
    ],
    contact: {
        visible: true,
        heading: "Still have *questions?*",
        text: "Contact the Perlis Airspace Sandbox team for further assistance.",
        ctaLabel: "Contact Us",
        ctaUrl: "/contact",
    },
    seo: {
        title: "FAQ | Perlis Airspace Sandbox",
        description: "Answers to common questions about taking part in, applying to and operating within the Perlis Airspace Sandbox.",
    },
};

const sampleMeta = {
    status: "published",
    publishedAt: minsAgo(60 * 30),
    scheduledAt: null,
    hasUnpublishedChanges: false,
    updatedBy: "Aiman Hakim",
    updatedAt: minsAgo(60 * 30),
};

const sampleTrash = [
    {
        id: "q-old",
        categoryTitle: "Testing and Operations",
        deletedAt: minsAgo(60 * 60),
        item: { id: "q-old", categoryId: "c4", status: "draft", updatedAt: dayOffset(-20), question: "Can I test indoors?", answer: "Indoor testing is not available at the sandbox site at this time." },
    },
];

const sampleHistory = [
    { id: 5, user: "Aiman Hakim", action: "PUBLISH", label: "FAQ page", at: minsAgo(60 * 30), changes: [{ field: "Questions and Answers", from: "6 questions", to: "6 questions, 1 updated" }] },
    { id: 4, user: "Aiman Hakim", action: "UPDATE", label: "Question: How can I apply to participate?", at: minsAgo(60 * 31), changes: [{ field: "Answer", from: "Apply online.", to: "Interested participants can submit an application through the Apply to Participate section of the Perlis Airspace Sandbox website." }] },
    { id: 3, user: "Farid Rahman", action: "DELETE", label: "Question: Can I test indoors?", at: minsAgo(60 * 60), changes: [{ field: "Moved to Trash", from: "Can I test indoors?", to: "(deleted)" }] },
    { id: 2, user: "Farid Rahman", action: "CREATE", label: "Category: Facilities and Infrastructure", at: minsAgo(60 * 95), changes: [] },
    { id: 1, user: "Super Administrator", action: "CREATE", label: "FAQ page", at: minsAgo(60 * 24 * 9), changes: [] },
];

/* ------------------------------ helpers ------------------------------ */

const clone = (v) => JSON.parse(JSON.stringify(v));
const sameJson = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const isLink = (v) => /^(https?:\/\/|\/|#|mailto:)/i.test((v || "").trim());
const todayStr = () => new Date().toISOString().slice(0, 10);

function formatDate(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    return `${d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}, ${d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`;
}
const formatDay = (s) => (s ? new Date(`${String(s).slice(0, 10)}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "");

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

/* "Still have *questions?*" → highlighted words */
const Hl = ({ text = "" }) => text.split("*").map((x, i) => (i % 2 ? <em key={i}>{x}</em> : x));

const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

/* ------------------------------ validation ------------------------------ */

function questionErrors(q, categories, prefix) {
    const out = {};
    const k = (n) => `${prefix}${n}`;
    const need = (n, value, label, max) => {
        const v = (value ?? "").toString().trim();
        if (!v) out[k(n)] = `Enter ${label}.`;
        else if (max && v.length > max) out[k(n)] = `Use ${max} characters or fewer.`;
    };
    if (!q.categoryId || !categories.some((c) => c.id === q.categoryId)) out[k("categoryId")] = "Choose a category.";
    need("question", q.question, "the question", 400);
    need("answer", q.answer, "the answer", 2000);
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

    if (!f.categories.length) e["categories.items"] = "Add at least one category.";
    f.categories.forEach((c) => {
        need(`categories.items.${c.id}.title`, c.title, "a category name", 80);
        const name = (c.title || "").trim().toLowerCase();
        if (name && f.categories.some((x) => x.id !== c.id && (x.title || "").trim().toLowerCase() === name)) e[`categories.items.${c.id}.title`] = "Another category already uses this name.";
    });

    f.items.forEach((q) => Object.assign(e, questionErrors(q, f.categories, `items.${q.id}.`)));

    if (f.contact.visible) {
        need("contact.heading", f.contact.heading, "a heading", 80);
        maxLen("contact.text", f.contact.text, 240);
        need("contact.ctaLabel", f.contact.ctaLabel, "button text", 30);
        if (!(f.contact.ctaUrl || "").trim()) e["contact.ctaUrl"] = "Enter a button link.";
        else if (!isLink(f.contact.ctaUrl)) e["contact.ctaUrl"] = "Use a full address (https://...) or a path starting with /";
    }

    need("seo.title", f.seo.title, "a page title", 70);
    maxLen("seo.description", f.seo.description, 160);
    return e;
}

const sectionOfKey = (key) => {
    const head = key.split(".")[0];
    if (head === "items") return "questions";
    if (head === "categories") return "categories";
    if (head === "page" || head === "contact") return "page";
    return head; // seo
};

/* ------------------------------ shared state ------------------------------ */

const Ctx = createContext(null);
const useEd = () => useContext(Ctx);

/* ------------------------------ form pieces ------------------------------ */

function Toggle({ checked, onChange, label }) {
    return (
        <button type="button" role="switch" aria-checked={checked} aria-label={label} className={`fq-toggle ${checked ? "is-on" : ""}`} onClick={() => onChange(!checked)}>
            <span />
        </button>
    );
}

function Field({ label, hint, value, onChange, errorKey, max, rows, placeholder, className = "", type = "text", prefix }) {
    const { errors } = useEd();
    const error = errors[errorKey];
    const id = `fq-${errorKey}`;
    const length = (value || "").length;

    return (
        <div className={`fq-field ${error ? "has-error" : ""} ${className}`}>
            <div className="fq-field-top">
                <label htmlFor={id}>{label}</label>
                {max && <span className={`fq-count ${length > max ? "is-over" : ""}`}>{length}/{max}</span>}
            </div>
            {rows ? (
                <textarea id={id} className="fq-input fq-textarea" rows={rows} value={value || ""} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
            ) : prefix ? (
                <div className="fq-input-wrap">
                    <span className="fq-affix">{prefix}</span>
                    <input id={id} type={type} className="fq-input" value={value || ""} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
                </div>
            ) : (
                <input id={id} type={type} className="fq-input" value={value || ""} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
            )}
            {hint && !error && <p className="fq-hint">{hint}</p>}
            {error && <p className="fq-error" role="alert"><AlertTriangle size={13} /> {error}</p>}
        </div>
    );
}

function SelectField({ label, value, onChange, options, errorKey, hint, placeholder = "Choose..." }) {
    const { errors } = useEd();
    const error = errors[errorKey];
    const id = `fq-${errorKey}`;
    return (
        <div className={`fq-field ${error ? "has-error" : ""}`}>
            <div className="fq-field-top"><label htmlFor={id}>{label}</label></div>
            <select id={id} className="fq-input fq-select" value={value ?? ""} onChange={(e) => onChange(e.target.value || null)}>
                <option value="">{placeholder}</option>
                {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            {hint && !error && <p className="fq-hint">{hint}</p>}
            {error && <p className="fq-error" role="alert"><AlertTriangle size={13} /> {error}</p>}
        </div>
    );
}

function ErrorLine({ errorKey }) {
    const { errors } = useEd();
    return errors[errorKey] ? <p className="fq-error" role="alert"><AlertTriangle size={13} /> {errors[errorKey]}</p> : null;
}

function BlockHead({ title, text, aside }) {
    return (
        <div className="fq-block-head">
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

const moveIn = (list, from, to) => {
    if (to < 0 || to >= list.length) return list;
    const next = [...list];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    return next;
};

/* Ordered list: every row can be edited, moved and removed. Removing asks first (moves to Trash). */
function Orderable({ items, onMove, onRemove, nameOf, extraOf, children, empty }) {
    const { askDelete } = useEd();
    const drag = useDrag(onMove);

    if (!items.length) return <p className="fq-empty">{empty}</p>;

    return (
        <ul className="fq-list">
            {items.map((item, i) => (
                <li key={item.id} className={`fq-item ${drag.over === i ? "is-over" : ""}`} {...drag.rowProps(i)}>
                    <button type="button" className="fq-handle" aria-label={`Drag ${nameOf(item)} to reorder`} title="Drag to reorder" {...drag.handleProps(i)}>
                        <GripVertical size={16} />
                    </button>
                    <span className="fq-item-no">{i + 1}</span>
                    <div className="fq-item-body">{children(item, i)}</div>
                    <div className="fq-item-tools">
                        <button type="button" className="fq-iconbtn" aria-label="Move up" title="Move up" disabled={i === 0} onClick={() => onMove(i, i - 1)}><ChevronUp size={15} /></button>
                        <button type="button" className="fq-iconbtn" aria-label="Move down" title="Move down" disabled={i === items.length - 1} onClick={() => onMove(i, i + 1)}><ChevronDown size={15} /></button>
                        <button type="button" className="fq-iconbtn is-danger" aria-label={`Delete ${nameOf(item)}`} title="Delete (moves to Trash)" onClick={() => askDelete({ what: nameOf(item), extra: extraOf ? extraOf(item) : "", onConfirm: () => onRemove(i) })}><Trash2 size={15} /></button>
                    </div>
                </li>
            ))}
        </ul>
    );
}

/* ====================================================================
   SECTION EDITORS
==================================================================== */

function SectionHead({ sectionKey }) {
    const index = SECTIONS.findIndex((s) => s.key === sectionKey);
    const def = SECTIONS[index];

    return (
        <header className="fq-card-head">
            <div>
                <span className="fq-card-no">Section {index + 1} of {SECTIONS.length}</span>
                <h2>{def.label}</h2>
                <p>{def.hint}. Changes go live when you publish.</p>
            </div>
        </header>
    );
}

/* ---------- 1. Questions and Answers ---------- */
function QuestionsEditor() {
    const { form, edit, errors, openQuestion, askDelete, focusQuestion, sendToTrash } = useEd();
    const items = form.items;
    const [query, setQuery] = useState("");
    const [filter, setFilter] = useState("all");
    const [cat, setCat] = useState("all");
    const [sort, setSort] = useState("manual");

    const catName = (id) => form.categories.find((c) => c.id === id)?.title;
    const canReorder = sort === "manual" && filter === "all" && !query.trim();

    const rows = useMemo(() => {
        const q = query.trim().toLowerCase();
        const order = Object.fromEntries(form.categories.map((c, i) => [c.id, i]));
        const named = (id) => form.categories.find((c) => c.id === id)?.title || "";
        let list = items
            .map((x, i) => ({ ...x, _i: i }))
            .filter((x) => (filter === "all" || x.status === filter) && (cat === "all" || x.categoryId === cat)
                && (!q || x.question.toLowerCase().includes(q) || x.answer.toLowerCase().includes(q) || named(x.categoryId).toLowerCase().includes(q)));
        if (sort === "manual") list.sort((a, b) => ((order[a.categoryId] ?? 999) - (order[b.categoryId] ?? 999)) || a._i - b._i);
        if (sort === "newest") list.sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""));
        if (sort === "oldest") list.sort((a, b) => (a.updatedAt || "").localeCompare(b.updatedAt || ""));
        if (sort === "title") list.sort((a, b) => a.question.localeCompare(b.question));
        return list;
    }, [items, query, filter, cat, sort, form.categories]);

    /* questions can only be reordered inside their own category */
    const reorder = (from, to) => {
        const a = rows[from];
        const b = rows[to];
        if (!a || !b || a.categoryId !== b.categoryId) return;
        edit((d) => { d.items = moveIn(d.items, a._i, b._i); });
    };
    const drag = useDrag(reorder);

    const counts = QUESTION_STATUS.map((s) => ({ ...s, n: items.filter((q) => q.status === s.value).length }));
    const hasError = (id) => Object.keys(errors).some((k) => k.startsWith(`items.${id}.`));
    const togglePublish = (id) => edit((d) => {
        const q = d.items.find((x) => x.id === id);
        q.status = q.status === "published" ? "draft" : "published";
        q.updatedAt = todayStr();
    });

    return (
        <section className="fq-card">
            <SectionHead sectionKey="questions" />

            <div className="fq-block">
                <BlockHead
                    title="Questions and answers"
                    text="Draft questions stay hidden. Published ones show on the page under their category."
                    aside={<button type="button" className="fq-btn-yellow is-small" onClick={() => openQuestion(null)}><Plus size={15} /> Add question</button>}
                />

                <div className="fq-chips" role="group" aria-label="Filter by status">
                    <button type="button" className={filter === "all" ? "is-on" : ""} onClick={() => setFilter("all")}>All <b>{items.length}</b></button>
                    {counts.map((c) => <button key={c.value} type="button" className={filter === c.value ? "is-on" : ""} onClick={() => setFilter(c.value)}>{c.label} <b>{c.n}</b></button>)}
                </div>

                <div className="fq-toolbar">
                    <label className="fq-search">
                        <Search size={16} />
                        <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search questions, answers or categories" aria-label="Search questions" />
                    </label>
                    <select className="fq-input fq-select" value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Filter by category">
                        <option value="all">All categories</option>
                        {form.categories.map((c) => <option key={c.id} value={c.id}>{c.title || "Untitled category"}</option>)}
                    </select>
                    <select className="fq-input fq-select" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort questions">
                        <option value="manual">Page order (drag to change)</option>
                        <option value="newest">Recently updated</option>
                        <option value="oldest">Oldest updated</option>
                        <option value="title">Question A to Z</option>
                    </select>
                </div>

                {rows.length === 0 ? (
                    <p className="fq-empty">{items.length === 0 ? "No questions yet. Add the first one." : "No questions match your filters."}</p>
                ) : (
                    <ul className="fq-list">
                        {rows.map((q, i) => {
                            const status = STATUS_BY[q.status] || STATUS_BY.draft;
                            const sameAbove = i > 0 && rows[i - 1].categoryId === q.categoryId;
                            const sameBelow = i < rows.length - 1 && rows[i + 1].categoryId === q.categoryId;
                            return (
                                <li key={q.id} className={`fq-item fq-q ${canReorder && drag.over === i ? "is-over" : ""}`} {...(canReorder ? drag.rowProps(i) : {})}>
                                    {canReorder ? (
                                        <button type="button" className="fq-handle" aria-label={`Drag ${q.question} to reorder`} title="Drag to reorder inside its category" {...drag.handleProps(i)}><GripVertical size={16} /></button>
                                    ) : <span className="fq-handle is-off" aria-hidden="true"><GripVertical size={16} /></span>}
                                    <div className="fq-q-main">
                                        <strong>{q.question || "Untitled question"}</strong>
                                        <small>{[catName(q.categoryId) || "No category", q.updatedAt ? `Updated ${formatDay(q.updatedAt)}` : ""].filter(Boolean).join(" · ")}</small>
                                    </div>
                                    {hasError(q.id) && <span className="fq-badge-error" title="Needs attention">!</span>}
                                    <span className={`fq-pill is-${status.tone}`}>{status.label}</span>
                                    <div className="fq-item-tools">
                                        {canReorder && <>
                                            <button type="button" className="fq-iconbtn" aria-label="Move up" title="Move up" disabled={!sameAbove} onClick={() => reorder(i, i - 1)}><ChevronUp size={15} /></button>
                                            <button type="button" className="fq-iconbtn" aria-label="Move down" title="Move down" disabled={!sameBelow} onClick={() => reorder(i, i + 1)}><ChevronDown size={15} /></button>
                                        </>}
                                        <button type="button" className="fq-iconbtn" aria-label="Show in preview" title="Show in preview" onClick={() => focusQuestion(q)}><Eye size={15} /></button>
                                        <button type="button" className="fq-iconbtn" aria-label={`Edit ${q.question}`} title="Edit" onClick={() => openQuestion(items[q._i])}><Pencil size={15} /></button>
                                        <button type="button" className="fq-iconbtn" aria-label={q.status === "published" ? "Unpublish question" : "Publish question"} title={q.status === "published" ? "Move to draft" : "Mark as published"} onClick={() => togglePublish(q.id)}>{q.status === "published" ? <EyeOff size={15} /> : <Globe size={15} />}</button>
                                        <button type="button" className="fq-iconbtn is-danger" aria-label={`Delete ${q.question}`} title="Delete (moves to Trash)" onClick={() => askDelete({
                                            what: q.question || "this question",
                                            extra: "",
                                            onConfirm: () => {
                                                edit((d) => { d.items = d.items.filter((x) => x.id !== q.id); });
                                                sendToTrash([items[q._i]], catName(q.categoryId));
                                            },
                                        })}><Trash2 size={15} /></button>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
                {!canReorder && items.length > 1 && <p className="fq-hint">Reordering is available when the list is not searched or filtered by status and is sorted by page order.</p>}
            </div>
        </section>
    );
}

/* the create / edit form for one question (works on its own copy until "Save question") */
function QuestionDrawer({ state, onClose, onSave }) {
    const { form, ...base } = useEd();
    const [draft, setDraft] = useState(() => clone(state.item));
    const [tried, setTried] = useState(false);
    const isNew = state.mode === "new";
    const set = (patch) => setDraft((d) => ({ ...d, ...patch }));

    const errs = useMemo(() => questionErrors(draft, form.categories, "dr."), [draft, form.categories]);

    useEffect(() => {
        const onKey = (e) => e.key === "Escape" && onClose();
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [onClose]);

    const shown = tried ? errs : {};
    const scoped = { form, ...base, errors: shown };

    const submit = () => {
        setTried(true);
        if (Object.keys(errs).length) {
            setTimeout(() => document.querySelector(".fq-drawer .fq-field.has-error")?.scrollIntoView({ behavior: "smooth", block: "center" }), 60);
            return;
        }
        onSave(draft, isNew);
    };

    const categoryOptions = form.categories.map((c) => ({ value: c.id, label: c.title || "Untitled category" }));

    return (
        <Ctx.Provider value={scoped}>
            <div className="fq-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
                <aside className="fq-drawer" role="dialog" aria-modal="true" aria-labelledby="fq-drawer-title">
                    <header className="fq-dialog-head">
                        <div>
                            <h2 id="fq-drawer-title">{isNew ? "Add question" : "Edit question"}</h2>
                            <p>Saved to the page when you press Save question. It goes live when you publish.</p>
                        </div>
                        <button type="button" className="fq-iconbtn" aria-label="Close" onClick={onClose}><X size={18} /></button>
                    </header>

                    <div className="fq-drawer-body">
                        <SelectField label="Category" errorKey="dr.categoryId" value={draft.categoryId} onChange={(v) => set({ categoryId: v })} options={categoryOptions} placeholder="Select a category" />
                        <Field label="Question" errorKey="dr.question" value={draft.question} max={400} rows={2} onChange={(v) => set({ question: v })} placeholder="Enter the frequently asked question" />
                        <Field label="Answer" errorKey="dr.answer" value={draft.answer} max={2000} rows={9} onChange={(v) => set({ answer: v })} placeholder="Write a clear and informative answer" hint="Plain text. Line breaks are kept." />

                        <div className="fq-field">
                            <div className="fq-field-top"><span className="fq-label">Status</span></div>
                            <div className="fq-pick" role="radiogroup" aria-label="Status">
                                <button type="button" role="radio" aria-checked={draft.status === "draft"} className={draft.status === "draft" ? "is-on" : ""} onClick={() => set({ status: "draft" })}>
                                    <Pencil size={16} />
                                    <span><strong>Draft</strong><small>Hidden from visitors</small></span>
                                </button>
                                <button type="button" role="radio" aria-checked={draft.status === "published"} className={draft.status === "published" ? "is-on" : ""} onClick={() => set({ status: "published" })}>
                                    <Globe size={16} />
                                    <span><strong>Published</strong><small>Shown after you publish the page</small></span>
                                </button>
                            </div>
                        </div>
                    </div>

                    <footer className="fq-drawer-foot">
                        {tried && Object.keys(errs).length > 0 && <span className="fq-error"><AlertTriangle size={13} /> Fix {plural(Object.keys(errs).length, "field")} to continue.</span>}
                        <div>
                            <button type="button" className="fq-btn-outline" onClick={onClose}>Cancel</button>
                            <button type="button" className="fq-btn-yellow" onClick={submit}>{isNew ? "Add question" : "Save question"}</button>
                        </div>
                    </footer>
                </aside>
            </div>
        </Ctx.Provider>
    );
}

/* ---------- 2. Categories ---------- */
function CategoriesEditor() {
    const { form, edit, sendToTrash } = useEd();
    const items = form.categories;
    const used = (id) => form.items.filter((q) => q.categoryId === id).length;

    return (
        <section className="fq-card">
            <SectionHead sectionKey="categories" />

            <div className="fq-block">
                <BlockHead title="FAQ categories" text="Categories group the questions on the public page, in this order." aside={<span className="fq-limit">{plural(items.length, "category").replace("categorys", "categories")}</span>} />
                <Orderable
                    items={items}
                    nameOf={(c) => c.title || "category"}
                    extraOf={(c) => (used(c.id) ? `${plural(used(c.id), "question")} in this category will move to Trash too.` : "")}
                    onMove={(from, to) => edit((d) => { d.categories = moveIn(d.categories, from, to); })}
                    onRemove={(i) => {
                        const gone = items[i];
                        const qs = form.items.filter((q) => q.categoryId === gone.id);
                        edit((d) => {
                            d.categories.splice(i, 1);
                            d.items = d.items.filter((q) => q.categoryId !== gone.id);
                        });
                        if (qs.length) sendToTrash(qs, gone.title);
                    }}
                    empty="No categories yet."
                >
                    {(c) => (
                        <Field
                            label="Category name"
                            errorKey={`categories.items.${c.id}.title`}
                            value={c.title}
                            max={80}
                            onChange={(v) => edit((d) => { d.categories.find((x) => x.id === c.id).title = v; })}
                            hint={plural(used(c.id), "question") + " in this category"}
                        />
                    )}
                </Orderable>
                <ErrorLine errorKey="categories.items" />
                <button type="button" className="fq-add" onClick={() => edit((d) => { d.categories.push({ id: uid(), title: "" }); })}><Plus size={15} /> Add category</button>
            </div>
        </section>
    );
}

/* ---------- 3. Page Text and Contact ---------- */
function PageEditor() {
    const { form, edit } = useEd();
    const { page, contact } = form;

    return (
        <section className="fq-card">
            <SectionHead sectionKey="page" />

            <div className="fq-block">
                <BlockHead title="Heading and introduction" text="The text at the top of the public FAQ page." />
                <Field label="Heading" errorKey="page.heading" value={page.heading} max={80} onChange={(v) => edit((d) => { d.page.heading = v; })} hint="Put *asterisks* around the words that should be highlighted in yellow." />
                <Field label="Short introduction" errorKey="page.intro" value={page.intro} max={240} rows={2} onChange={(v) => edit((d) => { d.page.intro = v; })} />
            </div>

            <div className="fq-block">
                <BlockHead
                    title="Still have questions? box"
                    text="Sends visitors to the Contact Us page when the FAQ does not help."
                    aside={
                        <label className="fq-visible">
                            <span>{contact.visible ? "Shown on page" : "Hidden from page"}</span>
                            <Toggle checked={contact.visible} label="Show the contact box on the FAQ page" onChange={(v) => edit((d) => { d.contact.visible = v; })} />
                        </label>
                    }
                />
                <Field label="Heading" errorKey="contact.heading" value={contact.heading} max={80} onChange={(v) => edit((d) => { d.contact.heading = v; })} hint="Use *asterisks* to highlight words." />
                <Field label="Text" errorKey="contact.text" value={contact.text} max={240} rows={2} onChange={(v) => edit((d) => { d.contact.text = v; })} />
                <div className="fq-grid-2">
                    <Field label="Button text" errorKey="contact.ctaLabel" value={contact.ctaLabel} max={30} onChange={(v) => edit((d) => { d.contact.ctaLabel = v; })} />
                    <Field label="Button link" errorKey="contact.ctaUrl" value={contact.ctaUrl} placeholder="/contact" onChange={(v) => edit((d) => { d.contact.ctaUrl = v; })} />
                </div>
            </div>
        </section>
    );
}

/* ====================================================================
   PAGE SETTINGS, TRASH, HISTORY
==================================================================== */

function SeoPanel({ meta }) {
    const { form, edit } = useEd();
    const s = form.seo;
    const set = (patch) => edit((d) => Object.assign(d.seo, patch));

    return (
        <section className="fq-card">
            <header className="fq-card-head">
                <div>
                    <span className="fq-card-no">Page settings</span>
                    <h2>Search and sharing</h2>
                    <p>How the FAQ page looks in Google results and when someone shares the link.</p>
                </div>
            </header>

            <div className="fq-block">
                <Field label="Page title" errorKey="seo.title" value={s.title} max={70} onChange={(v) => set({ title: v })} hint="Shown in the browser tab and search results." />
                <Field label="Search description" errorKey="seo.description" value={s.description} max={160} rows={3} onChange={(v) => set({ description: v })} />
            </div>

            <div className="fq-block">
                <BlockHead title="Search result preview" />
                <div className="fq-serp">
                    <span>perlis-sandbox.my › faq</span>
                    <strong>{s.title || "Page title"}</strong>
                    <p>{s.description || "Search description"}</p>
                </div>
            </div>

            <div className="fq-block">
                <BlockHead title="Publishing" />
                <dl className="fq-facts">
                    <div><dt>Status</dt><dd>{meta.status === "published" ? "Published" : meta.status === "scheduled" ? "Scheduled" : "Draft"}</dd></div>
                    <div><dt>Published</dt><dd>{meta.publishedAt ? formatDate(meta.publishedAt) : "Not yet"}</dd></div>
                    <div><dt>Scheduled for</dt><dd>{meta.scheduledAt ? formatDate(meta.scheduledAt) : "None"}</dd></div>
                    <div><dt>Last edited</dt><dd>{meta.updatedAt ? `${formatDate(meta.updatedAt)} by ${meta.updatedBy}` : "Never"}</dd></div>
                </dl>
            </div>
        </section>
    );
}

function TrashPanel({ trash, onRestore }) {
    return (
        <section className="fq-card">
            <header className="fq-card-head">
                <div>
                    <span className="fq-card-no">Trash</span>
                    <h2>Deleted questions</h2>
                    <p>Restoring puts the question back into the draft. It returns to the page when you publish.</p>
                </div>
            </header>

            {trash.length === 0 ? (
                <p className="fq-empty">Trash is empty. Deleted questions will appear here.</p>
            ) : (
                <ul className="fq-list">
                    {trash.map((t) => (
                        <li key={t.id} className="fq-item fq-trash">
                            <div className="fq-q-main">
                                <strong>{t.item.question}</strong>
                                <small>{[t.categoryTitle, t.deletedAt ? `Deleted ${timeAgo(t.deletedAt)}` : ""].filter(Boolean).join(" · ")}</small>
                            </div>
                            <button type="button" className="fq-btn-small" onClick={() => onRestore(t)}><RotateCcw size={14} /> Restore</button>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}

const ACTION_PILL = { CREATE: "warn", UPDATE: "info", PUBLISH: "ok", UNPUBLISH: "off", DELETE: "danger", RESTORE: "ok" };
const ACTION_LABEL = { CREATE: "Created", UPDATE: "Updated", PUBLISH: "Published", UNPUBLISH: "Unpublished", DELETE: "Deleted", RESTORE: "Restored" };

function HistoryPanel({ history }) {
    const [open, setOpen] = useState(null);

    return (
        <section className="fq-card">
            <header className="fq-card-head">
                <div>
                    <span className="fq-card-no">History</span>
                    <h2>Who changed the FAQ page</h2>
                    <p>Every add, update, publish and delete is recorded. Entries cannot be edited.</p>
                </div>
            </header>

            {history.length === 0 ? (
                <p className="fq-empty">No history yet.</p>
            ) : (
                <ul className="fq-history">
                    {history.map((h) => {
                        const isOpen = open === h.id;
                        return (
                            <li key={h.id}>
                                <button type="button" className="fq-hist-row" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : h.id)} disabled={!h.changes?.length}>
                                    <span className="fq-avatar">{initialsOf(h.user)}</span>
                                    <span className="fq-hist-text">
                                        <strong>{h.user}</strong>
                                        <small>{ACTION_LABEL[h.action] || h.action} <b>{h.label}</b></small>
                                    </span>
                                    <span className={`fq-pill is-${ACTION_PILL[h.action] || "info"}`}>{ACTION_LABEL[h.action] || h.action}</span>
                                    <span className="fq-hist-time" title={formatDate(h.at)}>{timeAgo(h.at)}</span>
                                </button>
                                {isOpen && h.changes?.length > 0 && (
                                    <div className="fq-diff">
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

function DraftPreview({ form, activeKey, focus }) {
    const ref = useRef(null);

    const scrollToEl = (el) => {
        const box = ref.current;
        if (!box || !el) return;
        const top = el.getBoundingClientRect().top - box.getBoundingClientRect().top + box.scrollTop - 12;
        box.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
    };

    useEffect(() => {
        const id = activeKey === "page" ? "head" : "faqs";
        scrollToEl(ref.current?.querySelector(`[data-sec="${id}"]`));
    }, [activeKey]);

    useEffect(() => {
        if (!focus) return;
        scrollToEl(ref.current?.querySelector(`[data-q="${focus.id}"]`));
    }, [focus]);

    const published = form.items.filter((q) => q.status === "published");
    const drafts = form.items.length - published.length;
    const groups = form.categories
        .map((c) => ({ ...c, qs: published.filter((q) => q.categoryId === c.id) }))
        .filter((g) => g.qs.length);

    return (
        <div className="fq-pv-scroll" ref={ref}>
            <div className="fq-pv">
                <section data-sec="head" className={`fq-pv-sec ${activeKey === "page" ? "is-active" : ""}`}>
                    <span className="fq-pv-eyebrow">Perlis Airspace Sandbox</span>
                    <header className="fq-pv-head">
                        <h2><Hl text={form.page.heading} /></h2>
                        {form.page.intro && <p>{form.page.intro}</p>}
                    </header>
                </section>

                <section data-sec="faqs" className={`fq-pv-sec is-dark ${activeKey === "questions" || activeKey === "categories" ? "is-active" : ""}`}>
                    {groups.length === 0 && <p className="fq-pv-none">No published questions yet.</p>}
                    {groups.map((g) => (
                        <div className="fq-pv-group" key={g.id}>
                            <h3>{g.title || "Untitled category"}</h3>
                            {g.qs.map((q) => (
                                <article key={q.id} data-q={q.id} className={focus?.id === q.id ? "is-focus" : ""}>
                                    <strong>{q.question || "Untitled question"}</strong>
                                    <p>{q.answer}</p>
                                </article>
                            ))}
                        </div>
                    ))}
                    {drafts > 0 && <p className="fq-pv-drafts">{plural(drafts, "draft question")} hidden from the page</p>}
                </section>

                <section className={`fq-pv-sec ${activeKey === "page" ? "is-active" : ""}`}>
                    {form.contact.visible ? (
                        <div className="fq-pv-contact">
                            <strong><Hl text={form.contact.heading} /></strong>
                            {form.contact.text && <p>{form.contact.text}</p>}
                            <span>{form.contact.ctaLabel}</span>
                        </div>
                    ) : <div className="fq-pv-hidden">The contact box is hidden from the page</div>}
                </section>
            </div>
        </div>
    );
}

function LivePanel({ form, activeKey, focus, view, onView, liveUrl, reloadKey, onReload, onClose, status }) {
    const [device, setDevice] = useState("desktop");

    return (
        <aside className="fq-preview" aria-label="Live preview">
            <header className="fq-preview-head">
                <div className="fq-seg" role="tablist" aria-label="Preview type">
                    <button type="button" role="tab" aria-selected={view === "draft"} className={view === "draft" ? "is-on" : ""} onClick={() => onView("draft")}>Draft preview</button>
                    <button type="button" role="tab" aria-selected={view === "live"} className={view === "live" ? "is-on" : ""} onClick={() => onView("live")}>Live site</button>
                </div>
                <div className="fq-preview-tools">
                    <div className="fq-seg is-small" role="group" aria-label="Device">
                        <button type="button" className={device === "desktop" ? "is-on" : ""} onClick={() => setDevice("desktop")}>Desktop</button>
                        <button type="button" className={device === "mobile" ? "is-on" : ""} onClick={() => setDevice("mobile")}>Mobile</button>
                    </div>
                    {view === "live" && <button type="button" className="fq-iconbtn" aria-label="Reload live page" title="Reload live page" onClick={onReload}><RefreshCw size={16} /></button>}
                    <a className="fq-iconbtn" href={liveUrl} target="_blank" rel="noreferrer" aria-label="Open live page in a new tab" title="Open live page in a new tab"><ExternalLink size={16} /></a>
                    <button type="button" className="fq-iconbtn" aria-label="Hide preview" title="Hide preview" onClick={onClose}><X size={16} /></button>
                </div>
            </header>

            <p className="fq-preview-note">
                {view === "draft"
                    ? "Built from what you see on screen, including unsaved edits. Layout is simplified."
                    : status === "published" ? "The real public page, as visitors see it now. It updates after you publish." : "The real public page. It will not show your changes until you publish."}
            </p>

            <div className={`fq-preview-frame is-${device}`}>
                {view === "draft" ? (
                    <DraftPreview form={form} activeKey={activeKey} focus={focus} />
                ) : (
                    <iframe key={reloadKey} className="fq-iframe" src={liveUrl} title="Live FAQ page" loading="lazy" />
                )}
            </div>
        </aside>
    );
}

/* ====================================================================
   PAGE
==================================================================== */

export default function AdminPSBFAQ() {
    const { props, url } = usePage();
    const live = Boolean(props.faq?.content);
    const liveUrl = props.faq?.liveUrl || DEFAULT_LIVE_URL;

    const seed = useRef(
        live
            ? { content: props.faq.content, meta: props.faq.meta, history: props.faq.history || [], trash: props.faq.trash || [] }
            : { content: sampleContent, meta: sampleMeta, history: sampleHistory, trash: sampleTrash }
    ).current;

    const [saved, setSaved] = useState(() => clone(seed.content));
    const [form, setForm] = useState(() => clone(seed.content));
    const [meta, setMeta] = useState(seed.meta);
    const [localHistory, setLocalHistory] = useState(seed.history);
    const [trash, setTrash] = useState(seed.trash);

    const history = live ? props.faq.history || [] : localHistory;

    const [tab, setTab] = useState("content");
    const [active, setActive] = useState(() => {
        const wanted = props.section || SECTIONS.find((s) => (url || "").includes(`/faq/${s.route}`))?.route;
        const i = SECTIONS.findIndex((s) => s.route === wanted);
        return i >= 0 ? i : 0;
    });
    const [showPreview, setShowPreview] = useState(true);
    const [previewView, setPreviewView] = useState("draft");
    const [focus, setFocus] = useState(null);
    const [reloadKey, setReloadKey] = useState(0);
    const [submitted, setSubmitted] = useState(false);
    const [busy, setBusy] = useState(false);
    const [dialog, setDialog] = useState(null); // { type: publish | schedule | unpublish | delete, ... }
    const [drawer, setDrawer] = useState(null); // { mode: new | edit, item }
    const [menu, setMenu] = useState(false);
    const [toast, setToast] = useState(null);
    const [scheduleAt, setScheduleAt] = useState("");
    const busyRef = useRef(false);
    const menuRef = useRef(null);

    useEffect(() => { if (live) setMeta(props.faq.meta); }, [live, props.faq?.meta]);
    useEffect(() => { if (live && props.faq?.trash) setTrash(props.faq.trash); }, [live, props.faq?.trash]);

    const dirty = useMemo(() => !sameJson(form, saved), [form, saved]);
    const allErrors = useMemo(() => validate(form), [form]);
    const errors = useMemo(() => ({ ...(props.errors || {}), ...(submitted ? allErrors : {}) }), [props.errors, submitted, allErrors]);
    const errorCountFor = (key) => Object.keys(errors).filter((k) => sectionOfKey(k) === key).length;
    const totalErrors = Object.keys(allErrors).length;

    const changedKeys = useMemo(
        () => Object.keys(SECTION_FIELDS).filter((k) => SECTION_FIELDS[k].some((f) => !sameJson(form[f], saved[f]))),
        [form, saved]
    );
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
    const openQuestion = (item) => setDrawer(item
        ? { mode: "edit", item }
        : { mode: "new", item: { id: uid(), categoryId: form.categories[0]?.id || null, question: "", answer: "", status: "draft", updatedAt: todayStr() } });

    const sendToTrash = (list, categoryTitle) =>
        setTrash((t) => [
            ...list.map((q) => ({ id: q.id, item: q, categoryTitle: categoryTitle || "", deletedAt: new Date().toISOString() })),
            ...t.filter((x) => !list.some((q) => q.id === x.id)),
        ]);

    const focusQuestion = (q) => {
        setShowPreview(true);
        setPreviewView("draft");
        setFocus({ id: q.id, n: Date.now() });
    };

    const addHistory = (action, label, changes = []) =>
        setLocalHistory((h) => [{ id: Date.now(), user: "You", action, label, at: new Date().toISOString(), changes }, ...h]);
    const diffs = () => changedLabels.map((l) => ({ field: l, from: "Previous version", to: "Updated" }));
    const finishBusy = () => { setBusy(false); busyRef.current = false; };

    const jumpToFirstError = () => {
        const first = Object.keys(allErrors)[0];
        if (!first) return;
        const key = sectionOfKey(first);
        if (key === "seo") { setTab("seo"); return; }
        setTab("content");
        setActive(SECTIONS.findIndex((s) => s.key === key));
        const match = first.match(/^items\.([^.]+)\./);
        if (match) {
            const item = form.items.find((q) => q.id === match[1]);
            if (item) { setDrawer({ mode: "edit", item }); return; }
        }
        setTimeout(() => document.querySelector(".fq-editor .fq-field.has-error")?.scrollIntoView({ behavior: "smooth", block: "center" }), 80);
    };

    const saveQuestion = (item, isNew) => {
        const next = { ...item, updatedAt: todayStr() };
        edit((d) => {
            if (isNew) d.items.push(next);
            else d.items = d.items.map((q) => (q.id === next.id ? next : q));
        });
        setDrawer(null);
        setFocus({ id: next.id, n: Date.now() });
        setToast({ tone: "ok", text: isNew ? "Question added. It goes live when you publish." : "Question updated. It goes live when you publish." });
    };

    const restoreQuestion = (entry) => {
        edit((d) => {
            if (!d.categories.some((c) => c.id === entry.item.categoryId)) d.categories.push({ id: entry.item.categoryId, title: entry.categoryTitle || "Restored category" });
            d.items.push({ ...entry.item, updatedAt: todayStr() });
        });
        setTrash((t) => t.filter((x) => x.id !== entry.id));
        if (!live) addHistory("RESTORE", `Question: ${entry.item.question}`, []);
        setToast({ tone: "ok", text: "Question restored to the draft. It returns to the page when you publish." });
    };

    /* ---- actions ---- */
    const saveDraft = () => {
        if (!dirty || busy) return;
        setBusy(true); busyRef.current = true;
        const done = () => {
            setSaved(clone(form));
            setMeta((m) => ({ ...m, hasUnpublishedChanges: m.status === "published" ? true : m.hasUnpublishedChanges, updatedBy: "You", updatedAt: new Date().toISOString() }));
            if (!live) addHistory("UPDATE", changedLabels.join(", ") || "FAQ page", diffs());
            setToast({ tone: "ok", text: totalErrors ? `Draft saved. ${plural(totalErrors, "field")} still need attention before you can publish.` : "Draft saved. Visitors still see the published version." });
            finishBusy();
        };
        if (live) router.put(ENDPOINTS.save, { content: form }, { preserveScroll: true, onSuccess: done, onError: () => { finishBusy(); setSubmitted(true); setToast({ tone: "error", text: "The server rejected some values. Check the highlighted fields." }); } });
        else setTimeout(done, 350);
    };

    const startAction = (type) => {
        setMenu(false);
        if (type !== "unpublish") {
            setSubmitted(true);
            if (totalErrors) { setToast({ tone: "error", text: `Fix ${plural(totalErrors, "field")} before publishing.` }); jumpToFirstError(); return; }
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
            if (!live) addHistory(type === "unpublish" ? "UNPUBLISH" : "PUBLISH", "FAQ page", type === "unpublish" ? [] : diffs());
            setDialog(null);
            setSubmitted(false);
            setReloadKey((k) => k + 1);
            setToast({ tone: "ok", text: type === "publish" ? "Published. Visitors now see these changes." : type === "schedule" ? `Scheduled for ${formatDate(at)}.` : "Unpublished. The FAQ page is no longer public." });
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
        if (!live) addHistory("DELETE", `${SECTIONS[active].noun === "category" ? "Category" : "Question"}: ${dialog.what}`, [{ field: "Moved to Trash", from: dialog.what, to: "(deleted)" }]);
        setDialog(null);
        setToast({ tone: "ok", text: `“${dialog.what}” moved to Trash. It leaves the page when you publish.` });
    };

    /* Ctrl / Cmd + S saves the draft */
    useEffect(() => {
        const onKey = (e) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") { e.preventDefault(); saveDraft(); } };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    });

    const ctx = { form, edit, errors, askDelete, openQuestion, focusQuestion, sendToTrash };
    const Editor = [QuestionsEditor, CategoriesEditor, PageEditor][active];

    const sectionNote = (key) => {
        if (key === "questions") return plural(form.items.length, "question");
        if (key === "categories") return form.categories.length === 1 ? "1 category" : `${form.categories.length} categories`;
        return form.contact.visible ? "Contact box shown" : "Contact box hidden";
    };

    const statusTone = meta.status === "published" ? "ok" : meta.status === "scheduled" ? "warn" : "off";
    const statusText = meta.status === "published" ? "Published" : meta.status === "scheduled" ? `Scheduled · ${formatDate(meta.scheduledAt)}` : "Draft";
    const deleteExtra = dialog?.type === "delete" ? dialog.extra : "";

    return (
        <Ctx.Provider value={ctx}>
            <div className="fq">
                <div className="fq-heading">
                    <div>
                        <h1>Frequently Asked Questions</h1>
                        <p>Manage the questions, answers and categories shown on the Perlis Airspace Sandbox FAQ page.</p>
                        <div className="fq-status">
                            <span className={`fq-pill is-${statusTone}`}>{statusText}</span>
                            {unpublished && meta.status !== "draft" && <span className="fq-pill is-warn">{dirty ? "Unsaved changes" : "Changes not published yet"}</span>}
                            {meta.updatedAt && <small>Last edited {timeAgo(meta.updatedAt)} by {meta.updatedBy}</small>}
                        </div>
                    </div>

                    <div className="fq-actions">
                        <button type="button" className={`fq-btn-outline ${showPreview ? "is-on" : ""}`} onClick={() => setShowPreview((v) => !v)} aria-pressed={showPreview}><PanelRight size={16} /> {showPreview ? "Hide preview" : "Show preview"}</button>
                        <button type="button" className="fq-btn-outline" onClick={saveDraft} disabled={!dirty || busy}><Save size={16} /> {busy && !dialog ? "Saving..." : "Save draft"}</button>
                        <button type="button" className="fq-btn-yellow" onClick={() => startAction("publish")} disabled={busy || (!unpublished && meta.status === "published")}><Upload size={16} /> Publish</button>
                        <div className="fq-more" ref={menuRef}>
                            <button type="button" className="fq-iconbtn is-round" aria-label="More publishing options" aria-haspopup="menu" aria-expanded={menu} onClick={() => setMenu((v) => !v)}><MoreHorizontal size={18} /></button>
                            {menu && (
                                <div className="fq-menu" role="menu">
                                    <button type="button" role="menuitem" onClick={() => startAction("schedule")}><Clock3 size={16} /> Schedule publication</button>
                                    <button type="button" role="menuitem" disabled={meta.status === "draft"} onClick={() => startAction("unpublish")}><Link2Off size={16} /> Unpublish page</button>
                                    <a role="menuitem" href={liveUrl} target="_blank" rel="noreferrer"><ExternalLink size={16} /> Open live page</a>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {!live && (
                    <p className="fq-note"><AlertTriangle size={16} /><span>Sample data. Every control works, but nothing is stored until your controller sends the <b>faq</b> prop.</span></p>
                )}

                <div className="fq-tabs" role="tablist" aria-label="FAQ editor">
                    {[["content", "Content"], ["seo", "Page settings"], ["trash", "Trash"], ["history", "History"]].map(([key, label]) => (
                        <button key={key} type="button" role="tab" aria-selected={tab === key} className={tab === key ? "is-active" : ""} onClick={() => setTab(key)}>
                            {label}
                            {key === "seo" && errorCountFor("seo") > 0 && <span className="fq-badge-error">{errorCountFor("seo")}</span>}
                            {key === "trash" && <span className="fq-badge">{trash.length}</span>}
                            {key === "history" && <span className="fq-badge">{history.length}</span>}
                        </button>
                    ))}
                </div>

                {tab === "content" && (
                    <>
                        <nav className="fq-sections" aria-label="FAQ sections">
                            {SECTIONS.map((s, i) => {
                                const errs = errorCountFor(s.key);
                                return (
                                    <button key={s.key} type="button" className={`fq-section-pill ${active === i ? "is-active" : ""}`} aria-current={active === i ? "true" : undefined} onClick={() => setActive(i)}>
                                        <span className="fq-section-no">{i + 1}</span>
                                        <span className="fq-section-text"><strong>{s.label}</strong><small>{sectionNote(s.key)}</small></span>
                                        {errs > 0 ? <span className="fq-badge-error" title={`${errs} to fix`}>{errs}</span> : changedKeys.includes(s.key) ? <span className="fq-dot" title="Edited" /> : null}
                                    </button>
                                );
                            })}
                        </nav>

                        <div className={`fq-split ${showPreview ? "has-preview" : ""}`}>
                            <div className="fq-editor"><Editor /></div>
                            {showPreview && (
                                <LivePanel
                                    form={form}
                                    activeKey={activeKey}
                                    focus={focus}
                                    view={previewView}
                                    onView={setPreviewView}
                                    liveUrl={liveUrl}
                                    reloadKey={reloadKey}
                                    onReload={() => setReloadKey((k) => k + 1)}
                                    onClose={() => setShowPreview(false)}
                                    status={meta.status}
                                />
                            )}
                        </div>
                    </>
                )}
                {tab === "seo" && <SeoPanel meta={meta} />}
                {tab === "trash" && <TrashPanel trash={trash} onRestore={restoreQuestion} />}
                {tab === "history" && <HistoryPanel history={history} />}

                {dirty && (
                    <div className="fq-savebar" role="region" aria-label="Unsaved changes">
                        <span className="fq-savebar-text"><i /> {plural(changedLabels.length, "section")} edited, not saved</span>
                        <div>
                            <button type="button" className="fq-btn-ghost" onClick={() => { setForm(clone(saved)); setSubmitted(false); setToast({ tone: "info", text: "Changes discarded." }); }} disabled={busy}>Discard</button>
                            <button type="button" className="fq-btn-yellow" onClick={saveDraft} disabled={busy}>{busy ? "Saving..." : "Save draft"}</button>
                        </div>
                    </div>
                )}

                {/* dialogs */}
                {dialog?.type === "delete" && (
                    <div className="fq-overlay" onMouseDown={(e) => e.target === e.currentTarget && setDialog(null)}>
                        <div className="fq-dialog fq-small" role="alertdialog" aria-modal="true" aria-labelledby="fq-del-title">
                            <span className="fq-dialog-icon is-danger"><Trash2 size={22} /></span>
                            <h2 id="fq-del-title">Delete “{dialog.what}”?</h2>
                            <p>It moves to Trash, where you can restore it. It disappears from the page when you publish.</p>
                            {deleteExtra && <p className="fq-warn"><AlertTriangle size={15} /> {deleteExtra}</p>}
                            <div className="fq-dialog-actions">
                                <button type="button" className="fq-btn-outline" onClick={() => setDialog(null)} autoFocus>Keep it</button>
                                <button type="button" className="fq-btn-danger" onClick={confirmDelete}><Trash2 size={15} /> Move to Trash</button>
                            </div>
                        </div>
                    </div>
                )}

                {["publish", "schedule", "unpublish"].includes(dialog?.type) && (
                    <div className="fq-overlay" onMouseDown={(e) => e.target === e.currentTarget && !busy && setDialog(null)}>
                        <div className="fq-dialog fq-small" role="alertdialog" aria-modal="true" aria-labelledby="fq-act-title">
                            <span className={`fq-dialog-icon ${dialog.type === "unpublish" ? "is-danger" : ""}`}>
                                {dialog.type === "schedule" ? <Clock3 size={22} /> : dialog.type === "unpublish" ? <Link2Off size={22} /> : <Upload size={22} />}
                            </span>
                            <h2 id="fq-act-title">{dialog.type === "publish" ? "Publish the FAQ page?" : dialog.type === "schedule" ? "Schedule publication" : "Unpublish the FAQ page?"}</h2>
                            {dialog.type === "unpublish" ? (
                                <p>Visitors will no longer see the FAQ page until you publish it again. Nothing is deleted.</p>
                            ) : (
                                <>
                                    <p>{dialog.type === "publish" ? "Visitors will see your changes straight away." : "Your changes go live automatically at the time you choose."}</p>
                                    {changedLabels.length > 0 ? (
                                        <ul className="fq-dialog-list">{changedLabels.map((l) => <li key={l}><Check size={14} /> {l}</li>)}</ul>
                                    ) : (
                                        <p className="fq-hint">No new edits. This publishes the last saved draft.</p>
                                    )}
                                </>
                            )}
                            {dialog.type === "schedule" && (
                                <label className="fq-field">
                                    <span className="fq-field-top"><span className="fq-label">Publish on</span></span>
                                    <input type="datetime-local" className="fq-input" value={scheduleAt} min={new Date(Date.now() - new Date().getTimezoneOffset() * MIN).toISOString().slice(0, 16)} onChange={(e) => setScheduleAt(e.target.value)} />
                                </label>
                            )}
                            <div className="fq-dialog-actions">
                                <button type="button" className="fq-btn-outline" onClick={() => setDialog(null)} disabled={busy}>Cancel</button>
                                <button type="button" className={dialog.type === "unpublish" ? "fq-btn-danger" : "fq-btn-yellow"} onClick={confirmAction} disabled={busy}>
                                    {busy ? "Working..." : dialog.type === "publish" ? "Publish now" : dialog.type === "schedule" ? "Schedule" : "Unpublish"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {drawer && <QuestionDrawer key={drawer.item.id} state={drawer} onClose={() => setDrawer(null)} onSave={saveQuestion} />}

                {toast && (
                    <div className={`fq-toast is-${toast.tone}`} role="status">
                        {toast.tone === "error" ? <AlertTriangle size={16} /> : <Check size={16} />}
                        <span>{toast.text}</span>
                        <button type="button" aria-label="Dismiss" onClick={() => setToast(null)}><X size={14} /></button>
                    </div>
                )}
            </div>
        </Ctx.Provider>
    );
}

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { router, usePage } from "@inertiajs/react";
import "../../../css/admin-COEUAS-css/admin-media.css";

/* ====================================================================
   COE-UAS ADMIN → MEDIA LIBRARY                    /admin/coeuas/media

   Site map 1.3 (COE-UAS workspace → "Media Library"):
     "Folders, upload, replace, alt text. Usage check before delete."
   ERD-2: media_folders (site_id, parent_id, name) and media_assets
     (folder_id, media_type, original_name, mime_type, file_size, alt_text,
      caption, width / height, uploaded_by, created_at, deleted_at).
   Rule from the ERD: media files are never stored inside content tables.
   Content points to media_assets, which is what makes the usage check possible.

   What this page does:
     - Folders (nested, via parent_id): create, rename, delete when empty
     - Upload (button or drag and drop) into the open folder
     - Replace a file in place: every page that uses it shows the new file
     - Alt text and caption, with a "needs alt text" filter for images
     - Move to another folder (one file or many)
     - Usage check: a file that is used by content cannot be deleted; the panel
       lists every place that uses it. Unused files go to Trash (deleted_at).
     - History tab: audit_logs for the Media Library

   Every action here is immediate (no draft / publish step). Metadata edits in the
   side panel use "Save changes".

   SAMPLE DATA: the page works today (changes stay on screen only). Return an
   Inertia prop named `media` and it switches to LIVE mode:

   Inertia::render('admin-COEUAS/AdminCOEUASMedia', [
       'media' => [
           'folders' => [['id' => 1, 'parentId' => null, 'name' => 'Brand']],
           'assets'  => [[
               'id' => 1, 'folderId' => 1, 'type' => 'image',   // image | video | document | audio
               'name' => 'logo.png', 'mime' => 'image/png', 'size' => 102400,   // bytes
               'width' => 800, 'height' => 800, 'alt' => '', 'caption' => '',
               'url' => '/storage/...', 'uploadedBy' => 'Aisyah Rahman', 'uploadedAt' => '2026-10-01T08:00:00Z',
               'usage' => [['kind' => 'Member profile', 'label' => 'Dr. Nurul Huda', 'href' => '/admin/coeuas/people/profiles']],
           ]],
           'history' => [...],   // audit_logs rows for module = media
       ],
   ]);

   The controller must write audit_logs, refuse to delete a file that is in use,
   and soft-delete (deleted_at) removed files. Routes are listed in ENDPOINTS.
==================================================================== */

const BASE = "/admin/coeuas"; // keep in sync with coeuasRoutes.js
const ENDPOINTS = {
    upload: `${BASE}/media/upload`, // POST multipart { files[], folder_id }
    item: (id) => `${BASE}/media/${id}`, // PUT { name, alt, caption, folder_id } · DELETE
    replace: (id) => `${BASE}/media/${id}/replace`, // POST multipart { file }
    move: `${BASE}/media/move`, // POST { ids[], folder_id }
    bulkDelete: `${BASE}/media/bulk-delete`, // POST { ids[] }
    folders: `${BASE}/media/folders`, // POST { name, parent_id }
    folder: (id) => `${BASE}/media/folders/${id}`, // PUT { name } · DELETE
};

const MEDIA_TYPES = [
    { value: "image", label: "Images" },
    { value: "video", label: "Videos" },
    { value: "document", label: "Documents" },
    { value: "audio", label: "Audio" },
];
const TYPE_LABEL = { image: "Image", video: "Video", document: "Document", audio: "Audio" };
const LIMIT_MB = { image: 10, video: 100, document: 25, audio: 25 };
const DOC_EXT = ["pdf", "doc", "docx", "ppt", "pptx", "xls", "xlsx"];
const ACCEPT = "image/*,video/*,audio/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx";
const PAGE_SIZE = 48;
const ALT_MAX = 255;

const MIN = 60 * 1000;
const NOW = Date.now();
const minsAgo = (m) => new Date(NOW - m * MIN).toISOString();
let counter = 0;
const uid = () => `n${Date.now().toString(36)}${(counter += 1)}`;
const MB = 1048576;

/* ------------------------------ sample data ------------------------------ */

const sampleFolders = [
    { id: "f1", parentId: null, name: "Brand" },
    { id: "f2", parentId: null, name: "Centre and facilities" },
    { id: "f6", parentId: "f2", name: "Test hangar" },
    { id: "f3", parentId: null, name: "Training" },
    { id: "f4", parentId: null, name: "Members" },
    { id: "f5", parentId: null, name: "Press and publications" },
];

const use = (kind, label, path) => ({ kind, label, href: `${BASE}${path}` });

const sampleAssets = [
    { id: 1, folderId: "f1", type: "image", name: "coe-uas-logo.png", mime: "image/png", size: 0.1 * MB, width: 800, height: 800, alt: "COE-UAS logo", caption: "", url: null, uploadedBy: "Aisyah Rahman", uploadedAt: minsAgo(60 * 24 * 40), usage: [use("Site settings", "Logo", "/settings/site"), use("Header menu", "Brand mark", "/settings/menus")] },
    { id: 2, folderId: "f6", type: "image", name: "centre-hangar.jpg", mime: "image/jpeg", size: 1.6 * MB, width: 2400, height: 1600, alt: "Centre test hangar", caption: "The centre's test hangar", url: null, uploadedBy: "Aisyah Rahman", uploadedAt: minsAgo(60 * 24 * 30), usage: [use("About", "About image", "/about/overview"), use("About", "Page share image", "/about/overview")] },
    { id: 3, folderId: "f3", type: "image", name: "training-session.jpg", mime: "image/jpeg", size: 1.1 * MB, width: 1920, height: 1280, alt: "Drone training session", caption: "", url: null, uploadedBy: "Hafiz Roslan", uploadedAt: minsAgo(60 * 24 * 28), usage: [use("History", "Training programme launched, 2020", "/about/history")] },
    { id: 4, folderId: "f4", type: "image", name: "director-portrait.jpg", mime: "image/jpeg", size: 0.7 * MB, width: 1200, height: 1600, alt: "", caption: "", url: null, uploadedBy: "Hafiz Roslan", uploadedAt: minsAgo(60 * 24 * 21), usage: [use("Member profile", "Prof. Dr. Ahmad Zaki", "/people/profiles")] },
    { id: 5, folderId: "f2", type: "image", name: "field-trial-survey.jpg", mime: "image/jpeg", size: 2.3 * MB, width: 3000, height: 2000, alt: "Drone surveying a field", caption: "", url: null, uploadedBy: "Aisyah Rahman", uploadedAt: minsAgo(60 * 24 * 18), usage: [] },
    { id: 6, folderId: "f2", type: "video", name: "centre-overview.mp4", mime: "video/mp4", size: 48 * MB, width: 1920, height: 1080, alt: "", caption: "A short tour of the centre", url: null, uploadedBy: "Aisyah Rahman", uploadedAt: minsAgo(60 * 24 * 15), usage: [use("Media gallery", "Centre tour", "/engagement/gallery")] },
    { id: 7, folderId: "f5", type: "document", name: "coe-uas-brochure-2026.pdf", mime: "application/pdf", size: 3.2 * MB, width: null, height: null, alt: "", caption: "Corporate brochure, 2026 edition", url: null, uploadedBy: "Hafiz Roslan", uploadedAt: minsAgo(60 * 24 * 12), usage: [use("Brochures", "Corporate brochure", "/engagement/documents")] },
    { id: 8, folderId: "f5", type: "document", name: "annual-report-2025.pdf", mime: "application/pdf", size: 5.8 * MB, width: null, height: null, alt: "", caption: "", url: null, uploadedBy: "Hafiz Roslan", uploadedAt: minsAgo(60 * 24 * 11), usage: [] },
    { id: 9, folderId: "f3", type: "document", name: "training-calendar-2026.xlsx", mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", size: 0.2 * MB, width: null, height: null, alt: "", caption: "", url: null, uploadedBy: "Aisyah Rahman", uploadedAt: minsAgo(60 * 24 * 9), usage: [] },
    { id: 10, folderId: "f5", type: "audio", name: "podcast-interview.mp3", mime: "audio/mpeg", size: 9.4 * MB, width: null, height: null, alt: "", caption: "Director interview", url: null, uploadedBy: "Hafiz Roslan", uploadedAt: minsAgo(60 * 24 * 6), usage: [] },
    { id: 11, folderId: "f1", type: "image", name: "accreditation-certificate-2024.jpg", mime: "image/jpeg", size: 0.9 * MB, width: 1600, height: 1131, alt: "Accredited training provider certificate", caption: "", url: null, uploadedBy: "Aisyah Rahman", uploadedAt: minsAgo(60 * 24 * 4), usage: [use("Awards", "Accredited Training Provider", "/about/awards")] },
    { id: 12, folderId: null, type: "image", name: "team-photo.jpg", mime: "image/jpeg", size: 2.9 * MB, width: 3200, height: 2133, alt: "", caption: "", url: null, uploadedBy: "Aisyah Rahman", uploadedAt: minsAgo(60 * 3), usage: [] },
];

const sampleHistory = [
    { id: 3, user: "Aisyah Rahman", action: "CREATE", label: "team-photo.jpg", at: minsAgo(60 * 3), changes: [] },
    { id: 2, user: "Hafiz Roslan", action: "UPDATE", label: "director-portrait.jpg", at: minsAgo(60 * 24 * 20), changes: [{ field: "Folder", from: "Unfiled", to: "Members" }] },
    { id: 1, user: "Hafiz Roslan", action: "CREATE", label: "Folder: Members", at: minsAgo(60 * 24 * 22), changes: [] },
];

/* ------------------------------- helpers -------------------------------- */

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
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function formatSize(bytes = 0) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < MB) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / MB).toFixed(1)} MB`;
}

const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;
const needsAlt = (a) => a.type === "image" && !(a.alt || "").trim();

function typeOfFile(file) {
    if (file.type.startsWith("image/")) return "image";
    if (file.type.startsWith("video/")) return "video";
    if (file.type.startsWith("audio/")) return "audio";
    const ext = file.name.split(".").pop().toLowerCase();
    return DOC_EXT.includes(ext) ? "document" : null;
}

/* folder tree helpers (the ERD stores parent_id) */
const parentOf = (folders, f) => (f.parentId && folders.some((x) => x.id === f.parentId) ? f.parentId : null);
function flattenFolders(folders) {
    const out = [];
    const walk = (pid, depth) =>
        folders
            .filter((f) => parentOf(folders, f) === pid)
            .sort((a, b) => a.name.localeCompare(b.name))
            .forEach((f) => { out.push({ folder: f, depth }); walk(f.id, depth + 1); });
    walk(null, 0);
    return out;
}
function pathOf(folders, id) {
    const parts = [];
    let cur = folders.find((f) => f.id === id);
    while (cur) { parts.unshift(cur); cur = folders.find((f) => f.id === cur.parentId); }
    return parts;
}

/* -------------------------------- icons ---------------------------------- */

function Icon({ name, size = 18 }) {
    const p = {
        plus: <path d="M12 5v14M5 12h14" />,
        trash: <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />,
        upload: <path d="M12 16V4m0 0-4 4m4-4 4 4M4 20h16" />,
        search: (<><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>),
        grid: (<><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>),
        list: <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />,
        folder: <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />,
        image: (<><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" /></>),
        video: (<><rect x="3" y="5" width="14" height="14" rx="2" /><path d="m17 10 4-2v8l-4-2" /></>),
        document: (<><path d="M6 3h8l4 4v14H6z" /><path d="M14 3v4h4M9 12h6M9 16h6" /></>),
        audio: (<><path d="M9 18V6l10-2v12" /><circle cx="6" cy="18" r="3" /><circle cx="16" cy="16" r="3" /></>),
        replace: <path d="M4 8h13l-3-3M20 16H7l3 3" />,
        edit: <path d="M4 20h4L19 9l-4-4L4 16z" />,
        alert: (<><path d="M12 3 2 20h20z" /><path d="M12 10v4M12 17h.01" /></>),
        check: <path d="m5 12 5 5 9-10" />,
        close: <path d="M18 6 6 18M6 6l12 12" />,
        lock: (<><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></>),
        external: (<><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><path d="M15 3h6v6M10 14 21 3" /></>),
    }[name];
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            {p}
        </svg>
    );
}

/* ------------------------------ small parts ------------------------------ */

function Thumb({ asset, size = "md" }) {
    return (
        <span className={`mx-thumb is-${size} is-${asset.type}`}>
            {asset.type === "image" && asset.url ? <img src={asset.url} alt="" /> : <Icon name={asset.type} size={size === "lg" ? 40 : size === "sm" ? 18 : 28} />}
        </span>
    );
}

function Chips({ options, value, onChange, counts, label }) {
    return (
        <div className="mx-chips" role="tablist" aria-label={label}>
            {options.map((t) => (
                <button key={t.value} type="button" role="tab" aria-selected={value === t.value} className={value === t.value ? "is-active" : ""} onClick={() => onChange(t.value)}>
                    {t.label}<b>{counts[t.value] ?? 0}</b>
                </button>
            ))}
        </div>
    );
}

const ACTION_TONE = { CREATE: "is-new", UPDATE: "is-info", PUBLISH: "is-ok", UNPUBLISH: "is-warn", DELETE: "is-danger", RESTORE: "is-ok" };

function HistoryPanel({ history }) {
    return (
        <div className="mx-panel mx-narrow">
            <div className="mx-panel-head"><div><h2>History</h2><p>Every upload, replacement, move and deletion in the Media Library, from the audit log.</p></div></div>
            {history.length === 0 && <p className="mx-empty">Nothing recorded yet.</p>}
            <ol className="mx-history">
                {history.map((h) => (
                    <li key={h.id}>
                        <span className={`mx-pill ${ACTION_TONE[h.action] || "is-info"}`}>{h.action}</span>
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

/* ----------------------------- detail panel ------------------------------ */

function DetailPanel({ asset, draft, setDraft, errors, dirty, busy, folderOptions, onSave, onDiscard, onClose, onReplace, onDelete }) {
    const replaceRef = useRef(null);
    const altLen = (draft.alt || "").length;
    const usage = asset.usage || [];
    return (
        <aside className="mx-detail" aria-label="File details">
            <div className="mx-detail-head">
                <h2>File details</h2>
                <button type="button" className="mx-iconbtn" aria-label="Close details" onClick={onClose}><Icon name="close" size={16} /></button>
            </div>

            <div className="mx-preview"><Thumb asset={asset} size="lg" /></div>

            <div className="mx-meta">
                <span className="mx-pill">{TYPE_LABEL[asset.type]}</span>
                <span>{formatSize(asset.size)}</span>
                {asset.width && asset.height && <span>{asset.width} × {asset.height}</span>}
            </div>
            <small className="mx-uploaded">Uploaded by {asset.uploadedBy} on {formatDate(asset.uploadedAt)}</small>

            <div className="mx-form">
                <label className={`mx-field ${errors.name ? "has-error" : ""}`}>
                    <span className="mx-field-top"><span>File name</span></span>
                    <input className="mx-input" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
                    {errors.name && <em className="mx-error"><Icon name="alert" size={13} /> {errors.name}</em>}
                </label>

                {asset.type === "image" && (
                    <label className={`mx-field ${errors.alt ? "has-error" : ""}`}>
                        <span className="mx-field-top"><span>Alt text</span><small className={altLen > ALT_MAX ? "is-over" : ""}>{altLen}/{ALT_MAX}</small></span>
                        <textarea className="mx-input" rows={3} value={draft.alt} onChange={(e) => setDraft({ ...draft, alt: e.target.value })} />
                        {errors.alt ? <em className="mx-error"><Icon name="alert" size={13} /> {errors.alt}</em>
                            : !draft.alt.trim() ? <em className="mx-hint is-warn"><Icon name="alert" size={13} /> Describe what the picture shows. Screen readers read this out.</em>
                            : <em className="mx-hint">Short and specific works best.</em>}
                    </label>
                )}

                <label className={`mx-field ${errors.caption ? "has-error" : ""}`}>
                    <span className="mx-field-top"><span>Caption (optional)</span><small className={(draft.caption || "").length > ALT_MAX ? "is-over" : ""}>{(draft.caption || "").length}/{ALT_MAX}</small></span>
                    <input className="mx-input" value={draft.caption} onChange={(e) => setDraft({ ...draft, caption: e.target.value })} />
                    {errors.caption && <em className="mx-error"><Icon name="alert" size={13} /> {errors.caption}</em>}
                </label>

                <label className="mx-field">
                    <span className="mx-field-top"><span>Folder</span></span>
                    <select className="mx-input" value={draft.folderId ?? ""} onChange={(e) => setDraft({ ...draft, folderId: e.target.value || null })}>
                        {folderOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                </label>
            </div>

            <div className="mx-usage">
                <h3>Where it is used</h3>
                {usage.length === 0 ? (
                    <p className="mx-hint">Not used anywhere yet. It can be deleted safely.</p>
                ) : (
                    <>
                        <p className="mx-hint"><Icon name="lock" size={13} /> Used in {plural(usage.length, "place")}. Remove it from these first, or replace the file instead.</p>
                        <ul>
                            {usage.map((u, i) => (
                                <li key={i}>
                                    <small>{u.kind}</small>
                                    <a href={u.href}>{u.label} <Icon name="external" size={12} /></a>
                                </li>
                            ))}
                        </ul>
                    </>
                )}
            </div>

            <div className="mx-detail-actions">
                <input ref={replaceRef} type="file" accept={ACCEPT} hidden onChange={(e) => { if (e.target.files[0]) onReplace(e.target.files[0]); e.target.value = ""; }} />
                <button type="button" className="mx-btn-outline" onClick={() => replaceRef.current?.click()} disabled={busy}><Icon name="replace" size={15} /> Replace file</button>
                <button type="button" className="mx-btn-danger-outline" onClick={onDelete} disabled={busy}><Icon name="trash" size={15} /> Delete</button>
            </div>
            <small className="mx-hint">Replacing keeps the same record, so every page that uses this file shows the new one. The new file must be {asset.type === "document" ? "a document" : `${asset.type === "image" ? "an" : "a"} ${asset.type}`}.</small>

            {dirty && (
                <div className="mx-detail-save">
                    <button type="button" className="mx-btn-ghost" onClick={onDiscard} disabled={busy}>Discard</button>
                    <button type="button" className="mx-btn-accent" onClick={onSave} disabled={busy}>{busy ? "Saving..." : "Save changes"}</button>
                </div>
            )}
        </aside>
    );
}

/* -------------------------------- the page -------------------------------- */

export default function AdminCOEUASMedia() {
    const { props } = usePage();
    const live = Boolean(props.media?.assets);
    const dialogTitleId = useId();
    const fileRef = useRef(null);

    const [localAssets, setLocalAssets] = useState(sampleAssets);
    const [localFolders, setLocalFolders] = useState(sampleFolders);
    const [localHistory, setLocalHistory] = useState(sampleHistory);

    const assets = live ? props.media.assets : localAssets;
    const folders = (live ? props.media.folders : localFolders) || [];
    const history = live ? props.media.history || [] : localHistory;

    const [tab, setTab] = useState("library");
    const [sel, setSel] = useState("all"); // all | root | folder id
    const [typeFilter, setTypeFilter] = useState("all");
    const [query, setQuery] = useState("");
    const [sort, setSort] = useState("new");
    const [view, setView] = useState("grid");
    const [selected, setSelected] = useState([]);
    const [activeId, setActiveId] = useState(null);
    const [draft, setDraft] = useState(null);
    const [draftErrors, setDraftErrors] = useState({});
    const [dialog, setDialog] = useState(null);
    const [toast, setToast] = useState(null);
    const [busy, setBusy] = useState(false);
    const [dragging, setDragging] = useState(false);
    const [limit, setLimit] = useState(PAGE_SIZE);

    const active = assets.find((a) => a.id === activeId) || null;
    const draftDirty = Boolean(active && draft && (draft.name !== active.name || draft.alt !== (active.alt || "") || draft.caption !== (active.caption || "") || (draft.folderId ?? null) !== (active.folderId ?? null)));

    useEffect(() => { if (activeId && !active) { setActiveId(null); setDraft(null); } }, [activeId, active]);
    useEffect(() => { setSelected((s) => s.filter((id) => assets.some((a) => a.id === id))); }, [assets]);
    useEffect(() => { setLimit(PAGE_SIZE); }, [sel, typeFilter, query, sort]);

    useEffect(() => {
        if (!toast) return undefined;
        const t = setTimeout(() => setToast(null), 5000);
        return () => clearTimeout(t);
    }, [toast]);

    useEffect(() => {
        const onKey = (e) => { if (e.key === "Escape" && dialog && !busy) setDialog(null); };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [dialog, busy]);

    useEffect(() => {
        const beforeUnload = (e) => { if (draftDirty) { e.preventDefault(); e.returnValue = ""; } };
        window.addEventListener("beforeunload", beforeUnload);
        return () => window.removeEventListener("beforeunload", beforeUnload);
    }, [draftDirty]);

    const say = (tone, text) => setToast({ tone, text });
    const addHistory = (action, label, changes = []) =>
        setLocalHistory((h) => [{ id: Date.now(), user: "You", action, label, at: new Date().toISOString(), changes }, ...h]);

    /* one place for every action: live = ask Laravel, sample = change local state */
    const run = ({ method, url, data, options, local, ok, failText }) => {
        if (live) {
            setBusy(true);
            const opts = { preserveScroll: true, preserveState: true, ...options, onSuccess: () => { if (ok) say("ok", ok); }, onError: (errs) => say("error", Object.values(errs || {})[0] || failText || "Something went wrong. Nothing was changed."), onFinish: () => setBusy(false) };
            if (method === "delete") router.delete(url, opts);
            else router[method](url, data, opts);
        } else {
            local();
            if (ok) say("ok", ok);
        }
    };

    const folderOptions = useMemo(
        () => [{ value: "", label: "Unfiled" }, ...flattenFolders(folders).map(({ folder, depth }) => ({ value: folder.id, label: `${"— ".repeat(depth)}${folder.name}` }))],
        [folders]
    );
    const tree = useMemo(() => flattenFolders(folders), [folders]);
    const directCount = (id) => assets.filter((a) => (a.folderId ?? null) === id).length;
    const folderName = (id) => (id ? folders.find((f) => f.id === id)?.name || "Unfiled" : "Unfiled");

    /* ---- list ---- */
    const inScope = useMemo(() => {
        const q = query.trim().toLowerCase();
        return assets.filter((a) => {
            if (sel === "root" && a.folderId) return false;
            if (sel !== "all" && sel !== "root" && a.folderId !== sel) return false;
            if (q && !`${a.name} ${a.alt || ""} ${a.caption || ""}`.toLowerCase().includes(q)) return false;
            return true;
        });
    }, [assets, sel, query]);

    const counts = useMemo(() => {
        const c = { all: inScope.length, noalt: inScope.filter(needsAlt).length, unused: inScope.filter((a) => !(a.usage || []).length).length };
        MEDIA_TYPES.forEach((t) => { c[t.value] = inScope.filter((a) => a.type === t.value).length; });
        return c;
    }, [inScope]);

    const list = useMemo(() => {
        const base = inScope.filter((a) => {
            if (typeFilter === "all") return true;
            if (typeFilter === "noalt") return needsAlt(a);
            if (typeFilter === "unused") return !(a.usage || []).length;
            return a.type === typeFilter;
        });
        const sorted = [...base];
        if (sort === "name") sorted.sort((a, b) => a.name.localeCompare(b.name));
        else if (sort === "size") sorted.sort((a, b) => b.size - a.size);
        else sorted.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
        return sorted;
    }, [inScope, typeFilter, sort]);

    const shown = list.slice(0, limit);
    const crumbs = sel === "all" ? [] : sel === "root" ? [] : pathOf(folders, sel);
    const currentFolder = sel !== "all" && sel !== "root" ? folders.find((f) => f.id === sel) : null;

    /* ---- selection and details ---- */
    const openAsset = (a) => {
        if (a.id === activeId) return;
        if (draftDirty && !window.confirm("You have unsaved changes to this file. Discard them?")) return;
        setActiveId(a.id);
        setDraft({ name: a.name, alt: a.alt || "", caption: a.caption || "", folderId: a.folderId ?? null });
        setDraftErrors({});
    };
    const closeDetail = () => {
        if (draftDirty && !window.confirm("You have unsaved changes to this file. Discard them?")) return;
        setActiveId(null); setDraft(null);
    };
    const toggleSelect = (id) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
    const allShownSelected = shown.length > 0 && shown.every((a) => selected.includes(a.id));

    /* ---- actions ---- */
    const saveDraft = () => {
        const e = {};
        if (!draft.name.trim()) e.name = "Give the file a name.";
        else if (draft.name.length > 255) e.name = "Keep the name under 255 characters.";
        if (draft.alt.length > ALT_MAX) e.alt = `Keep the alt text under ${ALT_MAX} characters.`;
        if (draft.caption.length > ALT_MAX) e.caption = `Keep the caption under ${ALT_MAX} characters.`;
        setDraftErrors(e);
        if (Object.keys(e).length) return;

        const changes = [];
        if (draft.name !== active.name) changes.push({ field: "Name", from: active.name, to: draft.name });
        if (draft.alt !== (active.alt || "")) changes.push({ field: "Alt text", from: active.alt || "(empty)", to: draft.alt || "(empty)" });
        if (draft.caption !== (active.caption || "")) changes.push({ field: "Caption", from: active.caption || "(empty)", to: draft.caption || "(empty)" });
        if ((draft.folderId ?? null) !== (active.folderId ?? null)) changes.push({ field: "Folder", from: folderName(active.folderId), to: folderName(draft.folderId) });

        run({
            method: "put",
            url: ENDPOINTS.item(active.id),
            data: { name: draft.name.trim(), alt: draft.alt.trim(), caption: draft.caption.trim(), folder_id: draft.folderId },
            local: () => {
                setLocalAssets((l) => l.map((a) => (a.id === active.id ? { ...a, name: draft.name.trim(), alt: draft.alt.trim(), caption: draft.caption.trim(), folderId: draft.folderId } : a)));
                addHistory("UPDATE", draft.name.trim(), changes);
                setDraft((d) => ({ ...d, name: d.name.trim(), alt: d.alt.trim(), caption: d.caption.trim() }));
            },
            ok: "File details saved.",
        });
    };

    const handleFiles = (fileList, replaceTarget) => {
        const files = Array.from(fileList || []);
        if (!files.length) return;
        const rejected = [];
        const good = [];
        files.forEach((f) => {
            const type = typeOfFile(f);
            if (!type) rejected.push(`${f.name} (file type not allowed)`);
            else if (f.size > LIMIT_MB[type] * MB) rejected.push(`${f.name} (over ${LIMIT_MB[type]} MB)`);
            else if (replaceTarget && type !== replaceTarget.type) rejected.push(`${f.name} (must be ${replaceTarget.type === "document" ? "a document" : `${replaceTarget.type === "image" ? "an" : "a"} ${replaceTarget.type}`})`);
            else good.push({ file: f, type });
        });
        if (rejected.length) say("error", `Not added: ${rejected.slice(0, 2).join(", ")}${rejected.length > 2 ? ` and ${rejected.length - 2} more` : ""}.`);
        if (!good.length) return;

        if (replaceTarget) {
            const { file } = good[0];
            run({
                method: "post",
                url: ENDPOINTS.replace(replaceTarget.id),
                data: { file },
                options: { forceFormData: true },
                local: () => {
                    setLocalAssets((l) => l.map((a) => (a.id === replaceTarget.id ? { ...a, mime: file.type || a.mime, size: file.size, url: file.type.startsWith("image/") ? URL.createObjectURL(file) : a.url, uploadedBy: "You", uploadedAt: new Date().toISOString() } : a)));
                    addHistory("UPDATE", replaceTarget.name, [{ field: "File", from: formatSize(replaceTarget.size), to: `${file.name} (${formatSize(file.size)})` }]);
                },
                ok: `File replaced. ${(replaceTarget.usage || []).length ? `${plural(replaceTarget.usage.length, "place")} now show the new file.` : "It is not used anywhere yet."}`,
            });
            return;
        }

        const folderId = sel === "all" || sel === "root" ? null : sel;
        run({
            method: "post",
            url: ENDPOINTS.upload,
            data: { files: good.map((g) => g.file), folder_id: folderId },
            options: { forceFormData: true },
            local: () => {
                const created = good.map(({ file, type }) => ({
                    id: uid(), folderId, type, name: file.name, mime: file.type, size: file.size, width: null, height: null, alt: "", caption: "",
                    url: type === "image" ? URL.createObjectURL(file) : null, uploadedBy: "You", uploadedAt: new Date().toISOString(), usage: [],
                }));
                setLocalAssets((l) => [...created, ...l]);
                created.forEach((c) => addHistory("CREATE", c.name));
            },
            ok: `${plural(good.length, "file")} uploaded${live ? "" : " (sample data, not stored)"}.${good.some((g) => g.type === "image") ? " Add alt text to the images." : ""}`,
        });
    };

    const askDeleteAsset = (a) => setDialog({ type: "delete", ids: [a.id] });
    const askDeleteSelected = () => setDialog({ type: "delete", ids: selected });

    const confirmDelete = () => {
        const targets = assets.filter((a) => dialog.ids.includes(a.id));
        const free = targets.filter((a) => !(a.usage || []).length);
        if (!free.length) { setDialog(null); return; }
        const freeIds = free.map((a) => a.id);
        const done = () => { setDialog(null); setSelected((s) => s.filter((id) => !freeIds.includes(id))); if (freeIds.includes(activeId)) { setActiveId(null); setDraft(null); } };
        run({
            method: freeIds.length === 1 ? "delete" : "post",
            url: freeIds.length === 1 ? ENDPOINTS.item(freeIds[0]) : ENDPOINTS.bulkDelete,
            data: { ids: freeIds },
            options: { onFinish: () => setBusy(false), onSuccess: () => { done(); say("ok", `${plural(freeIds.length, "file")} moved to Trash.`); } },
            local: () => {
                setLocalAssets((l) => l.filter((a) => !freeIds.includes(a.id)));
                free.forEach((a) => addHistory("DELETE", a.name, [{ field: "Moved to Trash", from: a.name, to: "(deleted)" }]));
                done();
            },
            ok: `${plural(freeIds.length, "file")} moved to Trash.${targets.length > free.length ? ` ${plural(targets.length - free.length, "file")} kept because they are in use.` : ""}`,
        });
    };

    const moveSelected = (folderId) => {
        const ids = selected;
        if (!ids.length) return;
        run({
            method: "post",
            url: ENDPOINTS.move,
            data: { ids, folder_id: folderId },
            local: () => {
                setLocalAssets((l) => l.map((a) => (ids.includes(a.id) ? { ...a, folderId } : a)));
                addHistory("UPDATE", `${plural(ids.length, "file")} moved`, [{ field: "Folder", from: "Various", to: folderName(folderId) }]);
                setSelected([]);
            },
            options: { onSuccess: () => { setSelected([]); say("ok", `${plural(ids.length, "file")} moved to ${folderName(folderId)}.`); } },
            ok: `${plural(ids.length, "file")} moved to ${folderName(folderId)}.`,
        });
    };

    /* ---- folders ---- */
    const openFolderDialog = (mode, folder) => setDialog({ type: "folder", mode, folder, name: mode === "rename" ? folder.name : "", parentId: mode === "create" ? (sel !== "all" && sel !== "root" ? sel : null) : folder.parentId, error: "" });

    const confirmFolder = () => {
        const name = dialog.name.trim();
        const siblings = folders.filter((f) => (f.parentId ?? null) === (dialog.parentId ?? null) && f.id !== dialog.folder?.id);
        let error = "";
        if (!name) error = "Give the folder a name.";
        else if (name.length > 120) error = "Keep the name under 120 characters.";
        else if (siblings.some((f) => f.name.toLowerCase() === name.toLowerCase())) error = "A folder with this name already exists here.";
        if (error) { setDialog({ ...dialog, error }); return; }

        if (dialog.mode === "create") {
            const newId = uid();
            run({
                method: "post", url: ENDPOINTS.folders, data: { name, parent_id: dialog.parentId },
                local: () => { setLocalFolders((l) => [...l, { id: newId, parentId: dialog.parentId, name }]); addHistory("CREATE", `Folder: ${name}`); setSel(newId); },
                options: { onSuccess: () => { setDialog(null); say("ok", `Folder “${name}” created.`); } },
                ok: `Folder “${name}” created.`,
            });
        } else {
            run({
                method: "put", url: ENDPOINTS.folder(dialog.folder.id), data: { name },
                local: () => { setLocalFolders((l) => l.map((f) => (f.id === dialog.folder.id ? { ...f, name } : f))); addHistory("UPDATE", `Folder: ${name}`, [{ field: "Name", from: dialog.folder.name, to: name }]); },
                options: { onSuccess: () => { setDialog(null); say("ok", "Folder renamed."); } },
                ok: "Folder renamed.",
            });
        }
        if (!live) setDialog(null);
    };

    const confirmFolderDelete = () => {
        const f = dialog.folder;
        run({
            method: "delete", url: ENDPOINTS.folder(f.id),
            local: () => { setLocalFolders((l) => l.filter((x) => x.id !== f.id)); addHistory("DELETE", `Folder: ${f.name}`, [{ field: "Moved to Trash", from: f.name, to: "(deleted)" }]); if (sel === f.id) setSel(f.parentId || "all"); },
            options: { onSuccess: () => { if (sel === f.id) setSel(f.parentId || "all"); setDialog(null); say("ok", `Folder “${f.name}” deleted.`); } },
            ok: `Folder “${f.name}” deleted.`,
        });
        if (!live) setDialog(null);
    };

    const askFolderDelete = (f) => setDialog({ type: "folderDelete", folder: f, assets: directCount(f.id), subfolders: folders.filter((x) => x.parentId === f.id).length });

    /* drag and drop upload */
    const onDrop = (e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); };

    /* ---- render ---- */
    const dlgAssets = dialog?.type === "delete" ? assets.filter((a) => dialog.ids.includes(a.id)) : [];
    const dlgBlocked = dlgAssets.filter((a) => (a.usage || []).length);
    const dlgFree = dlgAssets.filter((a) => !(a.usage || []).length);
    const noAltTotal = assets.filter(needsAlt).length;
    const totalSize = assets.reduce((s, a) => s + (a.size || 0), 0);

    return (
        <div className="coeuas-media">
            <div className="mx-heading">
                <div>
                    <h1>Media Library</h1>
                    <p>Upload and organise the images, videos, documents and audio used across the COE-UAS website. Add alt text, replace files and check where each one is used.</p>
                    <div className="mx-status">
                        <span className="mx-pill is-info">{plural(assets.length, "file")} · {formatSize(totalSize)}</span>
                        {noAltTotal > 0 ? <button type="button" className="mx-pill is-warn mx-pill-btn" onClick={() => { setTab("library"); setSel("all"); setTypeFilter("noalt"); }}>{plural(noAltTotal, "image")} need alt text</button> : <span className="mx-pill is-ok">All images have alt text</span>}
                    </div>
                </div>
                <div className="mx-actions">
                    <input ref={fileRef} type="file" multiple accept={ACCEPT} hidden onChange={(e) => { handleFiles(e.target.files); e.target.value = ""; }} />
                    <button type="button" className="mx-btn-outline" onClick={() => openFolderDialog("create")}><Icon name="folder" size={16} /> New folder</button>
                    <button type="button" className="mx-btn-dark" onClick={() => { setTab("library"); fileRef.current?.click(); }} disabled={busy}>
                        <span className="mx-btn-icon"><Icon name="upload" size={16} /></span> Upload files
                    </button>
                </div>
            </div>

            {!live && (
                <p className="mx-note"><Icon name="alert" size={16} /><span>Sample data. Every control works, but nothing is stored until your controller sends the <b>media</b> prop.</span></p>
            )}

            <div className="mx-tabs" role="tablist" aria-label="Media Library">
                {[["library", "Library"], ["history", "History"]].map(([key, label]) => (
                    <button key={key} type="button" role="tab" aria-selected={tab === key} className={tab === key ? "is-active" : ""} onClick={() => setTab(key)}>
                        {label}{key === "history" && <span className="mx-badge">{history.length}</span>}
                    </button>
                ))}
            </div>

            {tab === "history" && <HistoryPanel history={history} />}

            {tab === "library" && (
                <div className={`mx-layout ${active ? "has-detail" : ""}`}>
                    {/* folders */}
                    <nav className="mx-rail" aria-label="Folders">
                        <ul>
                            <li><button type="button" className={`mx-folder ${sel === "all" ? "is-active" : ""}`} onClick={() => setSel("all")}><Icon name="image" size={17} /><span>All files</span><b>{assets.length}</b></button></li>
                            <li><button type="button" className={`mx-folder ${sel === "root" ? "is-active" : ""}`} onClick={() => setSel("root")}><Icon name="folder" size={17} /><span>Unfiled</span><b>{directCount(null)}</b></button></li>
                            {tree.map(({ folder, depth }) => (
                                <li key={folder.id} style={{ "--depth": Math.min(depth, 4) }}>
                                    <button type="button" className={`mx-folder is-nested ${sel === folder.id ? "is-active" : ""}`} onClick={() => setSel(folder.id)}>
                                        <Icon name="folder" size={17} /><span>{folder.name}</span><b>{directCount(folder.id)}</b>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </nav>

                    {/* files */}
                    <section
                        className={`mx-main ${dragging ? "is-dragging" : ""}`}
                        onDragOver={(e) => { if (e.dataTransfer?.types?.includes("Files")) { e.preventDefault(); setDragging(true); } }}
                        onDragLeave={(e) => { if (e.currentTarget === e.target) setDragging(false); }}
                        onDrop={onDrop}
                    >
                        <div className="mx-crumbs">
                            <div className="mx-crumb-trail" aria-label="Current folder">
                                <button type="button" onClick={() => setSel("all")}>Library</button>
                                {sel === "root" && <><span>/</span><strong>Unfiled</strong></>}
                                {crumbs.map((c, i) => (
                                    <span key={c.id} className="mx-crumb-part"><span>/</span>{i === crumbs.length - 1 ? <strong>{c.name}</strong> : <button type="button" onClick={() => setSel(c.id)}>{c.name}</button>}</span>
                                ))}
                                {sel === "all" && <><span>/</span><strong>All files</strong></>}
                            </div>
                            {currentFolder && (
                                <div className="mx-actions">
                                    <button type="button" className="mx-btn-small" onClick={() => openFolderDialog("create")}><Icon name="plus" size={14} /> Subfolder</button>
                                    <button type="button" className="mx-btn-small" onClick={() => openFolderDialog("rename", currentFolder)}><Icon name="edit" size={14} /> Rename</button>
                                    <button type="button" className="mx-btn-small is-danger" onClick={() => askFolderDelete(currentFolder)}><Icon name="trash" size={14} /> Delete folder</button>
                                </div>
                            )}
                        </div>

                        <div className="mx-toolbar">
                            <label className="mx-search">
                                <Icon name="search" size={16} />
                                <input type="search" placeholder="Search by name, alt text or caption" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search files" />
                            </label>
                            <label className="mx-select">
                                <span>Sort</span>
                                <select value={sort} onChange={(e) => setSort(e.target.value)}>
                                    <option value="new">Newest first</option>
                                    <option value="name">Name A to Z</option>
                                    <option value="size">Largest first</option>
                                </select>
                            </label>
                            <div className="mx-view" role="group" aria-label="View">
                                <button type="button" className={view === "grid" ? "is-on" : ""} aria-pressed={view === "grid"} onClick={() => setView("grid")} aria-label="Grid view"><Icon name="grid" size={16} /></button>
                                <button type="button" className={view === "list" ? "is-on" : ""} aria-pressed={view === "list"} onClick={() => setView("list")} aria-label="List view"><Icon name="list" size={16} /></button>
                            </div>
                        </div>

                        <Chips label="Filter by type" value={typeFilter} onChange={setTypeFilter} counts={counts}
                            options={[{ value: "all", label: "All" }, ...MEDIA_TYPES, { value: "noalt", label: "Needs alt text" }, { value: "unused", label: "Unused" }]} />

                        {selected.length > 0 && (
                            <div className="mx-bulk" role="region" aria-label="Selected files">
                                <label className="mx-check"><input type="checkbox" checked={allShownSelected} onChange={(e) => setSelected(e.target.checked ? Array.from(new Set([...selected, ...shown.map((a) => a.id)])) : selected.filter((id) => !shown.some((a) => a.id === id)))} /> <span>{selected.length} selected</span></label>
                                <div className="mx-bulk-actions">
                                    <label className="mx-select is-dark">
                                        <span>Move to</span>
                                        <select value="" onChange={(e) => { if (e.target.value !== "__") moveSelected(e.target.value || null); }} disabled={busy}>
                                            <option value="__">Choose folder</option>
                                            {folderOptions.map((o) => <option key={o.value || "root"} value={o.value}>{o.label}</option>)}
                                        </select>
                                    </label>
                                    <button type="button" className="mx-btn-ghost" onClick={askDeleteSelected} disabled={busy}><Icon name="trash" size={15} /> Delete</button>
                                    <button type="button" className="mx-btn-ghost" onClick={() => setSelected([])}>Clear</button>
                                </div>
                            </div>
                        )}

                        {dragging && <div className="mx-drop" aria-hidden="true"><Icon name="upload" size={28} /><strong>Drop to upload</strong><small>Files go to {sel === "all" || sel === "root" ? "Unfiled" : folderName(sel)}</small></div>}

                        {shown.length === 0 ? (
                            <div className="mx-empty-state">
                                <Icon name="image" size={30} />
                                <strong>{assets.length === 0 ? "The library is empty" : "No files match"}</strong>
                                <p>{assets.length === 0 ? "Upload your first file, or drag files onto this page." : "Try another folder, filter or search."}</p>
                                <button type="button" className="mx-btn-outline" onClick={() => fileRef.current?.click()}><Icon name="upload" size={15} /> Upload files</button>
                            </div>
                        ) : view === "grid" ? (
                            <ul className="mx-grid">
                                {shown.map((a) => (
                                    <li key={a.id} className={`mx-item ${a.id === activeId ? "is-open" : ""} ${selected.includes(a.id) ? "is-selected" : ""}`}>
                                        <label className="mx-pick" aria-label={`Select ${a.name}`}>
                                            <input type="checkbox" checked={selected.includes(a.id)} onChange={() => toggleSelect(a.id)} />
                                            <i aria-hidden="true"><Icon name="check" size={13} /></i>
                                        </label>
                                        <button type="button" className="mx-item-btn" onClick={() => openAsset(a)} aria-label={`Open details for ${a.name}`}>
                                            <Thumb asset={a} size="md" />
                                            <strong>{a.name}</strong>
                                            <small>{TYPE_LABEL[a.type]} · {formatSize(a.size)}</small>
                                        </button>
                                        <div className="mx-flags">
                                            {needsAlt(a) && <span className="mx-flag is-warn" title="This image has no alt text"><Icon name="alert" size={11} /> Alt text</span>}
                                            {(a.usage || []).length > 0 && <span className="mx-flag" title={`Used in ${plural(a.usage.length, "place")}`}><Icon name="lock" size={11} /> {a.usage.length}</span>}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="mx-table-wrap">
                                <table className="mx-table">
                                    <thead>
                                        <tr>
                                            <th className="is-check"><span className="mx-sr">Select</span></th>
                                            <th>Name</th><th>Type</th><th>Size</th><th>Folder</th><th>Used</th><th>Uploaded</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {shown.map((a) => (
                                            <tr key={a.id} className={`${a.id === activeId ? "is-open" : ""} ${selected.includes(a.id) ? "is-selected" : ""}`}>
                                                <td className="is-check"><label className="mx-check"><input type="checkbox" checked={selected.includes(a.id)} onChange={() => toggleSelect(a.id)} aria-label={`Select ${a.name}`} /></label></td>
                                                <td>
                                                    <button type="button" className="mx-row-btn" onClick={() => openAsset(a)}>
                                                        <Thumb asset={a} size="sm" />
                                                        <span><strong>{a.name}</strong>{needsAlt(a) && <em className="mx-flag is-warn"><Icon name="alert" size={11} /> No alt text</em>}</span>
                                                    </button>
                                                </td>
                                                <td>{TYPE_LABEL[a.type]}</td>
                                                <td>{formatSize(a.size)}</td>
                                                <td>{folderName(a.folderId)}</td>
                                                <td>{(a.usage || []).length > 0 ? plural(a.usage.length, "place") : <span className="mx-muted">Unused</span>}</td>
                                                <td>{formatDate(a.uploadedAt)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {list.length > shown.length && (
                            <div className="mx-more"><button type="button" className="mx-btn-outline" onClick={() => setLimit((n) => n + PAGE_SIZE)}>Show more ({list.length - shown.length} left)</button></div>
                        )}
                    </section>

                    {active && draft && (
                        <DetailPanel
                            asset={active} draft={draft} setDraft={setDraft} errors={draftErrors} dirty={draftDirty} busy={busy}
                            folderOptions={folderOptions}
                            onSave={saveDraft}
                            onDiscard={() => { setDraft({ name: active.name, alt: active.alt || "", caption: active.caption || "", folderId: active.folderId ?? null }); setDraftErrors({}); }}
                            onClose={closeDetail}
                            onReplace={(file) => handleFiles([file], active)}
                            onDelete={() => askDeleteAsset(active)}
                        />
                    )}
                </div>
            )}

            {/* delete files */}
            {dialog?.type === "delete" && (
                <div className="mx-overlay" onMouseDown={(e) => e.target === e.currentTarget && !busy && setDialog(null)}>
                    <div className="mx-dialog mx-small" role="alertdialog" aria-modal="true" aria-labelledby={dialogTitleId}>
                        <span className="mx-dialog-icon is-danger"><Icon name={dlgFree.length ? "trash" : "lock"} size={22} /></span>
                        {dlgFree.length === 0 ? (
                            <>
                                <h2 id={dialogTitleId}>{dlgAssets.length === 1 ? `“${dlgAssets[0]?.name}” is in use` : "These files are in use"}</h2>
                                <p>A file that content still uses cannot be deleted, or those pages would show a broken file. Remove it from the places below, or replace the file instead.</p>
                            </>
                        ) : (
                            <>
                                <h2 id={dialogTitleId}>{dlgFree.length === 1 ? `Delete “${dlgFree[0].name}”?` : `Delete ${dlgFree.length} files?`}</h2>
                                <p>{dlgFree.length === 1 ? "Nothing uses this file." : "Nothing uses these files."} {dlgFree.length === 1 ? "It moves" : "They move"} to Deleted content, where only the Super Admin can restore or purge {dlgFree.length === 1 ? "it" : "them"}.</p>
                            </>
                        )}
                        {dlgBlocked.length > 0 && (
                            <ul className="mx-dialog-list">
                                {dlgBlocked.slice(0, 4).map((a) => (
                                    <li key={a.id}><strong>{a.name}</strong><small>{a.usage.map((u) => `${u.kind}: ${u.label}`).slice(0, 2).join(" · ")}{a.usage.length > 2 ? ` · +${a.usage.length - 2} more` : ""}</small></li>
                                ))}
                                {dlgBlocked.length > 4 && <li><small>and {dlgBlocked.length - 4} more in use</small></li>}
                            </ul>
                        )}
                        {dlgFree.length > 0 && dlgBlocked.length > 0 && <p className="mx-hint">Only the {plural(dlgFree.length, "unused file")} will be deleted. The files in use stay.</p>}
                        <div className="mx-dialog-actions">
                            {dlgFree.length === 0 ? (
                                <button type="button" className="mx-btn-dark" onClick={() => setDialog(null)} autoFocus>Understood</button>
                            ) : (
                                <>
                                    <button type="button" className="mx-btn-outline" onClick={() => setDialog(null)} disabled={busy} autoFocus>Keep {dlgFree.length === 1 ? "it" : "them"}</button>
                                    <button type="button" className="mx-btn-danger" onClick={confirmDelete} disabled={busy}><Icon name="trash" size={15} /> {busy ? "Working..." : "Move to Trash"}</button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* create / rename folder */}
            {dialog?.type === "folder" && (
                <div className="mx-overlay" onMouseDown={(e) => e.target === e.currentTarget && !busy && setDialog(null)}>
                    <form className="mx-dialog mx-small" role="dialog" aria-modal="true" aria-labelledby={dialogTitleId} onSubmit={(e) => { e.preventDefault(); confirmFolder(); }}>
                        <span className="mx-dialog-icon"><Icon name="folder" size={22} /></span>
                        <h2 id={dialogTitleId}>{dialog.mode === "create" ? "New folder" : "Rename folder"}</h2>
                        <label className={`mx-field ${dialog.error ? "has-error" : ""}`}>
                            <span className="mx-field-top"><span>Folder name</span></span>
                            <input className="mx-input" autoFocus value={dialog.name} onChange={(e) => setDialog({ ...dialog, name: e.target.value, error: "" })} />
                            {dialog.error && <em className="mx-error"><Icon name="alert" size={13} /> {dialog.error}</em>}
                        </label>
                        {dialog.mode === "create" && (
                            <label className="mx-field">
                                <span className="mx-field-top"><span>Inside</span></span>
                                <select className="mx-input" value={dialog.parentId ?? ""} onChange={(e) => setDialog({ ...dialog, parentId: e.target.value || null, error: "" })}>
                                    <option value="">Top level</option>
                                    {folderOptions.filter((o) => o.value).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                                </select>
                            </label>
                        )}
                        <div className="mx-dialog-actions">
                            <button type="button" className="mx-btn-outline" onClick={() => setDialog(null)} disabled={busy}>Cancel</button>
                            <button type="submit" className="mx-btn-dark" disabled={busy}>{dialog.mode === "create" ? "Create folder" : "Save name"}</button>
                        </div>
                    </form>
                </div>
            )}

            {/* delete folder */}
            {dialog?.type === "folderDelete" && (
                <div className="mx-overlay" onMouseDown={(e) => e.target === e.currentTarget && !busy && setDialog(null)}>
                    <div className="mx-dialog mx-small" role="alertdialog" aria-modal="true" aria-labelledby={dialogTitleId}>
                        <span className="mx-dialog-icon is-danger"><Icon name={dialog.assets || dialog.subfolders ? "lock" : "trash"} size={22} /></span>
                        {dialog.assets || dialog.subfolders ? (
                            <>
                                <h2 id={dialogTitleId}>“{dialog.folder.name}” is not empty</h2>
                                <p>It holds {[dialog.assets ? plural(dialog.assets, "file") : null, dialog.subfolders ? plural(dialog.subfolders, "subfolder") : null].filter(Boolean).join(" and ")}. Move or delete {dialog.assets && dialog.subfolders ? "them" : dialog.assets ? "the files" : "the subfolder"} first, then delete the folder.</p>
                                <div className="mx-dialog-actions"><button type="button" className="mx-btn-dark" onClick={() => setDialog(null)} autoFocus>Understood</button></div>
                            </>
                        ) : (
                            <>
                                <h2 id={dialogTitleId}>Delete folder “{dialog.folder.name}”?</h2>
                                <p>The folder is empty. It moves to Deleted content, where only the Super Admin can restore or purge it.</p>
                                <div className="mx-dialog-actions">
                                    <button type="button" className="mx-btn-outline" onClick={() => setDialog(null)} autoFocus>Keep it</button>
                                    <button type="button" className="mx-btn-danger" onClick={confirmFolderDelete} disabled={busy}><Icon name="trash" size={15} /> Delete folder</button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {toast && (
                <div className={`mx-toast is-${toast.tone}`} role="status">
                    <Icon name={toast.tone === "error" ? "alert" : "check"} size={16} />
                    <span>{toast.text}</span>
                    <button type="button" aria-label="Dismiss" onClick={() => setToast(null)}><Icon name="close" size={14} /></button>
                </div>
            )}
        </div>
    );
}

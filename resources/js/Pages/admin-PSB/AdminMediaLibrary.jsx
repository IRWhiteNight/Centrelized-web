import { useEffect, useMemo, useRef, useState } from "react";
import { Link, router, usePage } from "@inertiajs/react";
import "../../../css/admin-PSB-css/admin-media-library.css";

/* ====================================================================
   PSB ADMIN → MEDIA LIBRARY                       /admin/psb/media-library

   Site map (PSB workspace → "Media Library"):
     Folders, upload, replace, alt text   ·   Usage check before delete
   Data: media_folders (parent_id, name) and media_assets (folder_id, media_type, original_name,
         stored_name, mime_type, file_size, storage_path, alt_text, caption, width / height).
   Content pages never store files; they point to media_assets, so every asset can say
   where it is used and a file in use cannot be deleted by accident.
   Delete moves a file to Content Trash (Super Admin restores or purges). Every upload, edit,
   move, replace and delete is written to audit_logs by the controller.

   SAMPLE DATA: the page works today (changes stay on screen only). Return an Inertia prop
   named `library` and it switches to LIVE mode:

   Route::get('/admin/psb/media-library', fn () =>
       Inertia::render('admin-PSB/AdminMediaLibrary', ['library' => [
           'folders' => [ ['id' => 1, 'parentId' => null, 'name' => 'Home page'] ],
           'assets'  => [[
               'id' => 1, 'name' => 'site-aerial.jpg', 'storedName' => '1-site-aerial.jpg',
               'type' => 'image',                 // image | video | document | audio
               'mime' => 'image/jpeg', 'size' => 2202009,      // bytes
               'width' => 1920, 'height' => 1080, // images only
               'alt' => '...', 'caption' => '',
               'folderId' => 1,                   // null = unfiled
               'url' => '/storage/media/1-site-aerial.jpg',
               'uploadedBy' => 'Aiman Hakim', 'uploadedAt' => '2026-11-01T09:00:00Z',
               'usage' => [['id' => 'a', 'module' => 'Home Page', 'label' => 'Main banner', 'href' => '/admin/psb/home/banner']],
           ]],
           'history' => [],                       // audit_logs rows for media
       ]])
   );

   LIVE mode requests are listed in ENDPOINTS.
==================================================================== */

const BASE = "/admin/psb"; // keep in sync with psbRoutes.js
const ENDPOINTS = {
    upload: `${BASE}/media-library/upload`, // POST  multipart { file, folder_id }
    asset: (id) => `${BASE}/media-library/${id}`, // PATCH { original_name, alt_text, caption, folder_id } · DELETE
    replace: (id) => `${BASE}/media-library/${id}/replace`, // POST  multipart { file }
    bulk: `${BASE}/media-library/bulk`, // POST  { ids, action: "move" | "delete", folder_id? }
    folders: `${BASE}/media-library/folders`, // POST  { name, parent_id }
    folder: (id) => `${BASE}/media-library/folders/${id}`, // PATCH { name } · DELETE (contents move up one level)
};

const TYPES = {
    image: { label: "Image", plural: "Images", exts: ["jpg", "jpeg", "png", "webp", "gif", "svg"], maxMb: 10 },
    video: { label: "Video", plural: "Videos", exts: ["mp4", "webm", "mov"], maxMb: 100 },
    document: { label: "Document", plural: "Documents", exts: ["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "csv"], maxMb: 25 },
    audio: { label: "Audio", plural: "Audio", exts: ["mp3", "wav", "ogg", "m4a"], maxMb: 30 },
};
const MIME = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", gif: "image/gif", svg: "image/svg+xml", mp4: "video/mp4", webm: "video/webm", mov: "video/quicktime", pdf: "application/pdf", mp3: "audio/mpeg", wav: "audio/wav", ogg: "audio/ogg", m4a: "audio/mp4" };

const PAGE_SIZE = 24;
const MIN = 60 * 1000;
const NOW = Date.now();
const minsAgo = (m) => new Date(NOW - m * MIN).toISOString();
const KB = 1024;
const MB = 1048576;
let counter = 0;
const uid = () => `u${Date.now().toString(36)}${(counter += 1)}`;

/* ------------------------------ sample data ------------------------------ */

const sampleFolders = [
    { id: 1, parentId: null, name: "Home page" },
    { id: 2, parentId: null, name: "Opportunities" },
    { id: 3, parentId: null, name: "Services icons" },
    { id: 4, parentId: null, name: "Partners" },
    { id: 5, parentId: null, name: "Documents" },
    { id: 6, parentId: 5, name: "Programme briefs" },
    { id: 7, parentId: null, name: "Media centre" },
    { id: 8, parentId: null, name: "Site and facilities" },
];

const use = (module, label, href) => ({ id: `${module}-${label}`, module, label, href });
const asset = (id, name, type, size, folderId, alt, extra = {}) => ({
    id, name, storedName: `${id}-${name}`, type, mime: MIME[name.split(".").pop()] || "application/octet-stream", size,
    width: type === "image" && !name.endsWith(".svg") ? extra.width || 1920 : extra.width || null,
    height: type === "image" && !name.endsWith(".svg") ? extra.height || 1080 : extra.height || null,
    alt, caption: extra.caption || "", folderId, url: null,
    uploadedBy: extra.by || "Aiman Hakim", uploadedAt: minsAgo(extra.ago ?? 60 * 24 * 3), usage: extra.usage || [],
});

const iconNames = ["regulatory", "planning", "infrastructure", "integration", "safety", "monitoring", "data", "partners", "training", "showcase"];
const sampleAssets = [
    asset(1, "banner-loop.mp4", "video", 18.4 * MB, 1, "", { usage: [use("Home Page", "Main banner and slogan", `${BASE}/home/banner`)], ago: 60 * 24 * 9 }),
    asset(2, "site-aerial.jpg", "image", 2.1 * MB, 1, "Aerial view of the Sungai Batu Pahat site", { usage: [use("Home Page", "Page settings (share image)", `${BASE}/home/banner`), use("Opportunities", "Page settings (share image)", `${BASE}/opportunities/ways`), use("Services", "Page settings (share image)", `${BASE}/services`)], ago: 60 * 24 * 9 }),
    asset(3, "paddy-corridor.jpg", "image", 1.7 * MB, 8, "Drone flying over paddy fields", { usage: [use("Home Page", "Why it matters", `${BASE}/home/introduction`)], ago: 60 * 24 * 8 }),
    asset(4, "team-briefing.jpg", "image", 1.2 * MB, 1, "", { usage: [use("Home Page", "Who should participate?", `${BASE}/home/participants`)], ago: 60 * 24 * 8 }),
    asset(5, "vertiport-concept.jpg", "image", 2.6 * MB, 8, "Concept drawing of the vertiport", { ago: 60 * 24 * 6 }),
    asset(6, "hangar-interior.jpg", "image", 1.9 * MB, 8, "Inside the research and maintenance hangar", { usage: [use("Opportunities", "Testing and Innovation Areas", `${BASE}/opportunities/testing-areas`)], ago: 60 * 24 * 6 }),
    asset(7, "evtol-hover.jpg", "image", 1.4 * MB, 2, "eVTOL aircraft hovering above a vertiport", { usage: [use("Opportunities", "Testing and Innovation Areas", `${BASE}/opportunities/testing-areas`)], ago: 60 * 24 * 5 }),
    asset(8, "rescue-drill.jpg", "image", 1.8 * MB, 2, "", { usage: [use("Opportunities", "Testing and Innovation Areas", `${BASE}/opportunities/testing-areas`)], by: "Farid Rahman", ago: 60 * 24 * 5 }),
    asset(9, "runway-upgrade.mp4", "video", 24 * MB, 7, "", { by: "Farid Rahman", ago: 60 * 24 * 4 }),
    ...iconNames.map((n, i) => asset(10 + i, `icon-${n}.svg`, "image", 4 * KB + i * 200, 3, i === 9 ? "" : `${n[0].toUpperCase()}${n.slice(1)} icon`, { usage: [use("Services", "Service offerings", `${BASE}/services`)], ago: 60 * 24 * 3 })),
    asset(20, "logo-unimap.png", "image", 86 * KB, 4, "UniMAP logo", { width: 512, height: 512, usage: [use("Home Page", "Partners preview", `${BASE}/home/partners-cta`)], ago: 60 * 24 * 12 }),
    asset(21, "logo-caam.png", "image", 64 * KB, 4, "CAAM logo", { width: 512, height: 512, usage: [use("Home Page", "Partners preview", `${BASE}/home/partners-cta`)], ago: 60 * 24 * 12 }),
    asset(22, "logo-might.png", "image", 72 * KB, 4, "", { width: 512, height: 512, usage: [use("Home Page", "Partners preview", `${BASE}/home/partners-cta`)], ago: 60 * 24 * 12 }),
    asset(23, "bvlos-corridor-brief.pdf", "document", 640 * KB, 6, "", { usage: [use("Opportunities", "Open Programmes and Calls", `${BASE}/opportunities/programmes`)], ago: 60 * 24 * 2 }),
    asset(24, "first-responder-exercise-brief.pdf", "document", 512 * KB, 6, "", { usage: [use("Opportunities", "Open Programmes and Calls", `${BASE}/opportunities/programmes`)], ago: 60 * 24 * 2 }),
    asset(25, "participation-guide.pdf", "document", 1.1 * MB, 5, "", { ago: 60 * 24 * 7 }),
    asset(26, "press-kit-2026.pdf", "document", 3.4 * MB, 7, "", { by: "Farid Rahman", ago: 60 * 24 * 1 }),
    asset(27, "sandbox-ambient.mp3", "audio", 4.2 * MB, 7, "", { ago: 60 * 24 * 1 }),
    asset(28, "unsorted-photo.jpg", "image", 1.5 * MB, null, "", { by: "Farid Rahman", ago: 90 }),
];

const sampleHistory = [
    { id: 6, user: "Farid Rahman", action: "CREATE", label: "unsorted-photo.jpg", at: minsAgo(90), changes: [{ field: "Uploaded to", from: "(new)", to: "Unfiled" }] },
    { id: 5, user: "Aiman Hakim", action: "UPDATE", label: "logo-caam.png", at: minsAgo(60 * 24), changes: [{ field: "Alt text", from: "", to: "CAAM logo" }] },
    { id: 4, user: "Farid Rahman", action: "CREATE", label: "press-kit-2026.pdf", at: minsAgo(60 * 24 + 5), changes: [{ field: "Uploaded to", from: "(new)", to: "Media centre" }] },
    { id: 3, user: "Aiman Hakim", action: "DELETE", label: "old-banner.jpg", at: minsAgo(60 * 24 * 2), changes: [{ field: "Moved to Trash", from: "old-banner.jpg", to: "(deleted)" }] },
    { id: 2, user: "Aiman Hakim", action: "UPDATE", label: "site-aerial.jpg", at: minsAgo(60 * 24 * 3), changes: [{ field: "File replaced", from: "1.4 MB", to: "2.1 MB" }] },
    { id: 1, user: "Super Administrator", action: "CREATE", label: "Media Library", at: minsAgo(60 * 24 * 14), changes: [] },
];

/* ------------------------------ helpers ------------------------------ */

const clone = (v) => JSON.parse(JSON.stringify(v));
const ACTION_PILL = { CREATE: "warn", UPDATE: "info", DELETE: "danger", RESTORE: "ok" };
const ACTION_LABEL = { CREATE: "Created", UPDATE: "Updated", DELETE: "Deleted", RESTORE: "Restored" };

function fmtBytes(n) {
    if (n >= MB) return `${(n / MB).toFixed(n >= 10 * MB ? 0 : 1)} MB`;
    if (n >= KB) return `${Math.round(n / KB)} KB`;
    return `${n} B`;
}
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
const extOf = (name) => (name.includes(".") ? name.split(".").pop().toLowerCase() : "");
const typeOfFile = (file) => Object.keys(TYPES).find((t) => TYPES[t].exts.includes(extOf(file.name))) || null;
const urlOf = (a) => a.url || `/storage/media/${a.storedName}`;

function checkFile(file, onlyType) {
    const type = typeOfFile(file);
    if (!type) return { error: `.${extOf(file.name) || "?"} files are not allowed. Use images, video, documents or audio.` };
    if (onlyType && type !== onlyType) return { error: `This file must be ${TYPES[onlyType].label.toLowerCase()} to replace the current one.` };
    if (file.size > TYPES[type].maxMb * MB) return { error: `${TYPES[type].plural} can be up to ${TYPES[type].maxMb} MB. This file is ${fmtBytes(file.size)}.` };
    return { type };
}

function readDims(file, type) {
    if (type !== "image" || extOf(file.name) === "svg") return Promise.resolve({ width: null, height: null });
    return new Promise((resolve) => {
        const img = new Image();
        const url = URL.createObjectURL(file);
        img.onload = () => { resolve({ width: img.naturalWidth, height: img.naturalHeight }); };
        img.onerror = () => resolve({ width: null, height: null });
        img.src = url;
    });
}

/* drawn thumbnail (real files use their own URL) */
function thumbOf(a) {
    if (a.type === "image" && a.url) return a.url;
    const label = (a.name || "file").replace(/[<>&"]/g, "");
    const shapes = {
        image: '<circle cx="160" cy="80" r="9" fill="#fff"/><path d="M130 50l60 60M190 50l-60 60" stroke="#fff" stroke-width="4" stroke-linecap="round"/>',
        video: '<circle cx="160" cy="80" r="26" fill="#fff" fill-opacity=".92"/><path d="M152 66v28l24-14z" fill="#0b1a28"/>',
        audio: '<path d="M130 100V60l50-10v40" stroke="#fff" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round"/><circle cx="122" cy="102" r="10" fill="#fff"/><circle cx="172" cy="92" r="10" fill="#fff"/>',
        document: '<rect x="118" y="30" width="84" height="108" rx="8" fill="#fff"/><path d="M134 62h52M134 80h52M134 98h32" stroke="#0b1a28" stroke-width="6" stroke-linecap="round"/><rect x="118" y="30" width="84" height="20" rx="8" fill="#facc15"/>',
    };
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0b1a28"/><stop offset="1" stop-color="#1d4160"/></linearGradient></defs><rect width="320" height="200" fill="url(#g)"/><path d="M-10 170L120 110 330 70V110L130 150 -10 200Z" fill="#facc15" fill-opacity=".9"/>${shapes[a.type] || shapes.image}<text x="14" y="188" fill="#fff" font-family="Arial,sans-serif" font-size="13" font-weight="700">${label.slice(0, 34)}</text></svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/* folder helpers */
const childrenOf = (folders, id) => folders.filter((f) => f.parentId === id);
function descendantIds(folders, id) {
    const out = [id];
    childrenOf(folders, id).forEach((c) => out.push(...descendantIds(folders, c.id)));
    return out;
}
function pathOf(folders, id) {
    const out = [];
    let cur = folders.find((f) => f.id === id);
    while (cur) { out.unshift(cur); cur = folders.find((f) => f.id === cur.parentId); }
    return out;
}
const needsAlt = (a) => a.type === "image" && !(a.alt || "").trim();

/* ------------------------------ icons ------------------------------ */

function Icon({ name, size = 18 }) {
    const icons = {
        upload: (<><path d="M12 16V4M7 9l5-5 5 5" /><path d="M4 20h16" /></>),
        folder: <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />,
        folderPlus: (<><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><path d="M12 11v6M9 14h6" /></>),
        grid: (<><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /></>),
        list: (<><path d="M8 6h13M8 12h13M8 18h13" /><circle cx="4" cy="6" r="1" /><circle cx="4" cy="12" r="1" /><circle cx="4" cy="18" r="1" /></>),
        search: (<><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4-4" /></>),
        image: (<><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" /></>),
        video: (<><rect x="2" y="5" width="14" height="14" rx="2" /><path d="m22 8-6 4 6 4z" /></>),
        audio: (<><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></>),
        doc: (<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><path d="M8 13h8M8 17h6" /></>),
        trash: (<><path d="M4 7h16M10 11v6M14 11v6" /><path d="M6 7l1 13h10l1-13M9 7V4h6v3" /></>),
        edit: (<><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></>),
        close: <path d="M6 6l12 12M18 6 6 18" />,
        check: <path d="m5 12 5 5 9-10" />,
        alert: (<><path d="M12 3 2.5 20h19z" /><path d="M12 10v4M12 17.2v.1" /></>),
        copy: (<><rect x="9" y="9" width="12" height="12" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h10" /></>),
        download: (<><path d="M12 4v12M7 11l5 5 5-5" /><path d="M4 20h16" /></>),
        replace: (<><path d="M21 12a9 9 0 1 1-3-6.7" /><polyline points="21 3 21 9 15 9" /></>),
        move: <path d="M5 12h14M13 6l6 6-6 6" />,
        right: <path d="m9 6 6 6-6 6" />,
        down: <path d="m6 9 6 6 6-6" />,
        external: <path d="M14 4h6v6M20 4l-9 9M18 14v5H5V6h5" />,
        link: (<><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7L11.5 6.8" /><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1.5-1.5" /></>),
        inbox: (<><path d="M22 12h-6l-2 3h-4l-2-3H2" /><path d="M5.5 5h13L22 12v7H2v-7z" /></>),
    };
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            {icons[name]}
        </svg>
    );
}
const typeIcon = (t) => ({ image: "image", video: "video", audio: "audio", document: "doc" }[t] || "doc");

/* ====================================================================
   FOLDER TREE
==================================================================== */

function FolderNode({ folder, depth, ctx }) {
    const { folders, active, setActive, counts, expanded, toggleExpand, dropOn, setDropOn, onDropAssets, openFolderDialog, askDeleteFolder } = ctx;
    const kids = childrenOf(folders, folder.id);
    const open = expanded.includes(folder.id);
    const isActive = active === folder.id;

    return (
        <li>
            <div
                className={`ml-node ${isActive ? "is-active" : ""} ${dropOn === folder.id ? "is-drop" : ""}`}
                style={{ paddingLeft: 8 + depth * 16 }}
                onDragOver={(e) => { if (e.dataTransfer.types.includes("application/x-ml-assets")) { e.preventDefault(); setDropOn(folder.id); } }}
                onDragLeave={() => setDropOn(null)}
                onDrop={(e) => onDropAssets(e, folder.id)}
            >
                <button type="button" className="ml-node-caret" aria-label={open ? "Collapse" : "Expand"} aria-expanded={open} onClick={() => toggleExpand(folder.id)} disabled={!kids.length} style={{ visibility: kids.length ? "visible" : "hidden" }}>
                    <span className={open ? "is-open" : ""}><Icon name="right" size={14} /></span>
                </button>
                <button type="button" className="ml-node-main" onClick={() => setActive(folder.id)} aria-current={isActive ? "true" : undefined}>
                    <Icon name="folder" size={16} />
                    <span>{folder.name}</span>
                    <b>{counts.get(folder.id) || 0}</b>
                </button>
                <span className="ml-node-tools">
                    <button type="button" className="ml-iconbtn" aria-label={`New folder inside ${folder.name}`} title="New subfolder" onClick={() => openFolderDialog({ mode: "new", parentId: folder.id })}><Icon name="folderPlus" size={14} /></button>
                    <button type="button" className="ml-iconbtn" aria-label={`Rename ${folder.name}`} title="Rename" onClick={() => openFolderDialog({ mode: "rename", folder })}><Icon name="edit" size={14} /></button>
                    <button type="button" className="ml-iconbtn is-danger" aria-label={`Delete ${folder.name}`} title="Delete folder" onClick={() => askDeleteFolder(folder)}><Icon name="trash" size={14} /></button>
                </span>
            </div>
            {open && kids.length > 0 && (
                <ul className="ml-tree">{kids.map((k) => <FolderNode key={k.id} folder={k} depth={depth + 1} ctx={ctx} />)}</ul>
            )}
        </li>
    );
}

/* ====================================================================
   ASSET DRAWER (details, alt text, usage, replace)
==================================================================== */

function AssetDrawer({ asset: a, folders, onClose, onSave, onReplacePick, onDelete, onCopy }) {
    const [name, setName] = useState(a.name);
    const [alt, setAlt] = useState(a.alt || "");
    const [caption, setCaption] = useState(a.caption || "");
    const [folderId, setFolderId] = useState(a.folderId ?? "");
    const [tried, setTried] = useState(false);

    const dirty = name !== a.name || alt !== (a.alt || "") || caption !== (a.caption || "") || String(folderId) !== String(a.folderId ?? "");

    const errors = {};
    if (!name.trim()) errors.name = "Enter a file name.";
    else if (name.length > 255) errors.name = "Use 255 characters or fewer.";
    else if (extOf(name) !== extOf(a.name)) errors.name = `Keep the file type: the name must end in .${extOf(a.name)}`;
    else if (/[\\/:*?"<>|]/.test(name)) errors.name = "Remove these characters: \\ / : * ? \" < > |";
    if (a.type === "image" && !alt.trim()) errors.alt = "Describe the image for people who cannot see it. Use a short sentence.";
    if (alt.length > 255) errors.alt = "Use 255 characters or fewer.";
    if (caption.length > 255) errors.caption = "Use 255 characters or fewer.";
    const shown = tried ? errors : {};

    const save = () => {
        setTried(true);
        if (Object.keys(errors).length) return;
        onSave(a.id, { name: name.trim(), alt: alt.trim(), caption: caption.trim(), folderId: folderId === "" ? null : Number(folderId) });
    };

    const used = a.usage || [];
    const options = [];
    const walk = (parent, depth) => childrenOf(folders, parent).forEach((f) => { options.push({ id: f.id, label: `${"— ".repeat(depth)}${f.name}` }); walk(f.id, depth + 1); });
    walk(null, 0);

    return (
        <div className="ml-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
            <aside className="ml-drawer" role="dialog" aria-modal="true" aria-labelledby="ml-drawer-title">
                <header className="ml-dialog-head">
                    <div>
                        <h2 id="ml-drawer-title">File details</h2>
                        <p>Changes are saved to the Media Library and used everywhere the file appears.</p>
                    </div>
                    <button type="button" className="ml-iconbtn" aria-label="Close" onClick={onClose}><Icon name="close" size={18} /></button>
                </header>

                <div className="ml-drawer-body">
                    <div className="ml-preview-box">
                        {a.type === "video" && a.url ? <video src={a.url} controls preload="metadata" /> :
                            a.type === "audio" && a.url ? <div className="ml-audio"><img src={thumbOf(a)} alt="" /><audio src={a.url} controls /></div> :
                                <img src={thumbOf(a)} alt={a.type === "image" ? alt : ""} />}
                    </div>

                    <div className="ml-quick">
                        <button type="button" className="ml-btn-small" onClick={() => onReplacePick(a)}><Icon name="replace" size={14} /> Replace file</button>
                        <button type="button" className="ml-btn-small" onClick={() => onCopy(a)}><Icon name="copy" size={14} /> Copy URL</button>
                        {a.url ? <a className="ml-btn-small" href={a.url} download={a.name}><Icon name="download" size={14} /> Download</a> : <button type="button" className="ml-btn-small" disabled title="Sample files cannot be downloaded"><Icon name="download" size={14} /> Download</button>}
                    </div>

                    <div className={`ml-field ${shown.name ? "has-error" : ""}`}>
                        <div className="ml-field-top"><label htmlFor="ml-name">File name</label><span className={`ml-count ${name.length > 255 ? "is-over" : ""}`}>{name.length}/255</span></div>
                        <input id="ml-name" className="ml-input" value={name} onChange={(e) => setName(e.target.value)} />
                        {shown.name && <p className="ml-error" role="alert"><Icon name="alert" size={13} /> {shown.name}</p>}
                    </div>

                    <div className={`ml-field ${shown.alt ? "has-error" : ""}`}>
                        <div className="ml-field-top"><label htmlFor="ml-alt">Alt text{a.type === "image" ? " (required)" : ""}</label><span className={`ml-count ${alt.length > 255 ? "is-over" : ""}`}>{alt.length}/255</span></div>
                        <textarea id="ml-alt" className="ml-input ml-textarea" rows={2} value={alt} onChange={(e) => setAlt(e.target.value)} placeholder={a.type === "image" ? "For example: Drone flying over paddy fields" : "Optional description"} />
                        {shown.alt ? <p className="ml-error" role="alert"><Icon name="alert" size={13} /> {shown.alt}</p> : <p className="ml-hint">{a.type === "image" ? "Read aloud by screen readers and shown if the image cannot load. Describe what the picture shows." : "Alt text is only required for images."}</p>}
                    </div>

                    <div className={`ml-field ${shown.caption ? "has-error" : ""}`}>
                        <div className="ml-field-top"><label htmlFor="ml-caption">Caption</label><span className={`ml-count ${caption.length > 255 ? "is-over" : ""}`}>{caption.length}/255</span></div>
                        <input id="ml-caption" className="ml-input" value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Optional. Shown under the file where the page supports it." />
                        {shown.caption && <p className="ml-error" role="alert"><Icon name="alert" size={13} /> {shown.caption}</p>}
                    </div>

                    <div className="ml-field">
                        <div className="ml-field-top"><label htmlFor="ml-folder">Folder</label></div>
                        <select id="ml-folder" className="ml-input ml-select" value={folderId} onChange={(e) => setFolderId(e.target.value)}>
                            <option value="">Unfiled</option>
                            {options.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                        </select>
                    </div>

                    <div className="ml-block">
                        <div className="ml-block-head"><h3>Where it is used</h3><span className={`ml-pill is-${used.length ? "ok" : "off"}`}>{used.length ? `${used.length} place${used.length === 1 ? "" : "s"}` : "Not used"}</span></div>
                        {used.length === 0 ? (
                            <p className="ml-hint">No page uses this file. It is safe to delete.</p>
                        ) : (
                            <ul className="ml-usage">
                                {used.map((u) => (
                                    <li key={u.id}>
                                        <Link href={u.href}><strong>{u.module}</strong><span>{u.label}</span><Icon name="external" size={13} /></Link>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <dl className="ml-info">
                        <div><dt>Type</dt><dd>{TYPES[a.type].label} · {a.mime}</dd></div>
                        <div><dt>Size</dt><dd>{fmtBytes(a.size)}</dd></div>
                        {a.width && <div><dt>Dimensions</dt><dd>{a.width} × {a.height} px</dd></div>}
                        <div><dt>Uploaded</dt><dd>{formatDate(a.uploadedAt)} by {a.uploadedBy}</dd></div>
                        <div><dt>Address</dt><dd className="is-mono">{urlOf(a)}</dd></div>
                    </dl>
                </div>

                <footer className="ml-drawer-foot">
                    <button type="button" className="ml-btn-danger is-ghost" onClick={() => onDelete([a.id])}><Icon name="trash" size={15} /> Delete</button>
                    <div>
                        <button type="button" className="ml-btn-outline" onClick={onClose}>Close</button>
                        <button type="button" className="ml-btn-yellow" onClick={save} disabled={!dirty}>Save changes</button>
                    </div>
                </footer>
            </aside>
        </div>
    );
}

/* ====================================================================
   PAGE
==================================================================== */

export default function AdminMediaLibrary() {
    const { props } = usePage();
    const live = Boolean(props.library?.assets);

    const [folders, setFolders] = useState(() => clone(live ? props.library.folders || [] : sampleFolders));
    const [assets, setAssets] = useState(() => (live ? props.library.assets : sampleAssets).map((a) => ({ ...a })));
    const [localHistory, setLocalHistory] = useState(sampleHistory);
    const history = live ? props.library.history || [] : localHistory;

    useEffect(() => {
        if (live) { setFolders(props.library.folders || []); setAssets(props.library.assets || []); }
    }, [live, props.library?.folders, props.library?.assets]);

    const [tab, setTab] = useState("library");
    const [active, setActive] = useState("all"); // "all" | "unfiled" | folder id
    const [includeSub, setIncludeSub] = useState(true);
    const [expanded, setExpanded] = useState([5]);
    const [query, setQuery] = useState("");
    const [filter, setFilter] = useState("all"); // all | image | video | document | audio | noalt | used | unused
    const [sort, setSort] = useState("newest");
    const [view, setView] = useState("grid");
    const [limit, setLimit] = useState(PAGE_SIZE);
    const [checked, setChecked] = useState([]);
    const [drawerId, setDrawerId] = useState(null);
    const [dialog, setDialog] = useState(null);
    const [uploads, setUploads] = useState([]);
    const [dropOn, setDropOn] = useState(null);
    const [dragFiles, setDragFiles] = useState(false);
    const [toast, setToast] = useState(null);
    const [folderName, setFolderName] = useState("");
    const [folderError, setFolderError] = useState("");
    const [moveTo, setMoveTo] = useState("");
    const fileRef = useRef(null);
    const replaceRef = useRef(null);
    const replaceFor = useRef(null);
    const nextId = useRef(1000);

    useEffect(() => {
        if (!toast) return undefined;
        const t = setTimeout(() => setToast(null), 5000);
        return () => clearTimeout(t);
    }, [toast]);

    useEffect(() => { setLimit(PAGE_SIZE); }, [active, filter, query, sort, includeSub]);

    useEffect(() => {
        const onKey = (e) => {
            if (e.key !== "Escape") return;
            if (dialog) setDialog(null);
            else if (drawerId) setDrawerId(null);
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [dialog, drawerId]);

    const say = (tone, text) => setToast({ tone, text });
    const addHistory = (action, label, changes = []) => { if (!live) setLocalHistory((h) => [{ id: Date.now() + Math.random(), user: "You", action, label, at: new Date().toISOString(), changes }, ...h]); };

    /* ---- derived data ---- */
    const folderOf = (id) => folders.find((f) => f.id === id);
    const folderLabel = (id) => (id == null ? "Unfiled" : pathOf(folders, id).map((f) => f.name).join(" › "));

    const counts = useMemo(() => {
        const m = new Map();
        assets.forEach((a) => { if (a.folderId != null) m.set(a.folderId, (m.get(a.folderId) || 0) + 1); });
        return m;
    }, [assets]);

    const stats = useMemo(() => ({
        total: assets.length,
        image: assets.filter((a) => a.type === "image").length,
        video: assets.filter((a) => a.type === "video").length,
        document: assets.filter((a) => a.type === "document").length,
        audio: assets.filter((a) => a.type === "audio").length,
        noalt: assets.filter(needsAlt).length,
        used: assets.filter((a) => (a.usage || []).length > 0).length,
        bytes: assets.reduce((s, a) => s + a.size, 0),
    }), [assets]);

    const filtered = useMemo(() => {
        const ids = typeof active === "number" ? (includeSub ? descendantIds(folders, active) : [active]) : null;
        const q = query.trim().toLowerCase();
        let list = assets.filter((a) => {
            if (active === "unfiled" && a.folderId != null) return false;
            if (ids && !ids.includes(a.folderId)) return false;
            if (["image", "video", "document", "audio"].includes(filter) && a.type !== filter) return false;
            if (filter === "noalt" && !needsAlt(a)) return false;
            if (filter === "used" && !(a.usage || []).length) return false;
            if (filter === "unused" && (a.usage || []).length) return false;
            return !q || a.name.toLowerCase().includes(q) || (a.alt || "").toLowerCase().includes(q) || (a.caption || "").toLowerCase().includes(q);
        });
        const by = { newest: (a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt), oldest: (a, b) => new Date(a.uploadedAt) - new Date(b.uploadedAt), name: (a, b) => a.name.localeCompare(b.name), size: (a, b) => b.size - a.size };
        return [...list].sort(by[sort]);
    }, [assets, folders, active, includeSub, query, filter, sort]);

    const visible = filtered.slice(0, limit);
    const allVisibleChecked = visible.length > 0 && visible.every((a) => checked.includes(a.id));
    const drawerAsset = assets.find((a) => a.id === drawerId) || null;
    const crumbs = typeof active === "number" ? pathOf(folders, active) : [];
    const activeName = active === "all" ? "All files" : active === "unfiled" ? "Unfiled" : folderOf(active)?.name || "All files";

    /* ---- requests (LIVE mode) ---- */
    const send = (method, url, data, { ok, progress, form } = {}) => {
        const opts = { preserveScroll: true, preserveState: true, forceFormData: form, onProgress: progress, onSuccess: () => ok?.(), onError: () => say("error", "Something went wrong. Nothing was changed.") };
        if (method === "delete") router.delete(url, opts);
        else router[method](url, data, opts);
    };

    /* ---- folder actions ---- */
    const openFolderDialog = (info) => {
        setFolderName(info.mode === "rename" ? info.folder.name : "");
        setFolderError("");
        setDialog({ type: "folder", ...info });
    };

    const submitFolder = () => {
        const name = folderName.trim();
        const parentId = dialog.mode === "new" ? dialog.parentId ?? null : dialog.folder.parentId;
        if (!name) return setFolderError("Enter a folder name.");
        if (name.length > 120) return setFolderError("Use 120 characters or fewer.");
        if (/[\\/]/.test(name)) return setFolderError("Folder names cannot contain / or \\");
        if (folders.some((f) => f.parentId === parentId && f.name.toLowerCase() === name.toLowerCase() && f.id !== dialog.folder?.id)) return setFolderError("A folder with this name already exists here.");

        if (dialog.mode === "new") {
            if (live) send("post", ENDPOINTS.folders, { name, parent_id: parentId }, { ok: () => say("ok", `Folder “${name}” created.`) });
            else {
                const f = { id: (nextId.current += 1), parentId, name };
                setFolders((l) => [...l, f]);
                if (parentId != null) setExpanded((x) => (x.includes(parentId) ? x : [...x, parentId]));
                setActive(f.id);
                addHistory("CREATE", `Folder: ${name}`, [{ field: "Created in", from: "(new)", to: parentId == null ? "Top level" : folderLabel(parentId) }]);
                say("ok", `Folder “${name}” created.`);
            }
        } else if (live) send("patch", ENDPOINTS.folder(dialog.folder.id), { name }, { ok: () => say("ok", "Folder renamed.") });
        else {
            setFolders((l) => l.map((f) => (f.id === dialog.folder.id ? { ...f, name } : f)));
            addHistory("UPDATE", `Folder: ${dialog.folder.name}`, [{ field: "Name", from: dialog.folder.name, to: name }]);
            say("ok", "Folder renamed.");
        }
        setDialog(null);
    };

    const confirmDeleteFolder = () => {
        const f = dialog.folder;
        if (live) send("delete", ENDPOINTS.folder(f.id), null, { ok: () => say("ok", `Folder “${f.name}” deleted. Its files moved up one level.`) });
        else {
            setAssets((l) => l.map((a) => (a.folderId === f.id ? { ...a, folderId: f.parentId } : a)));
            setFolders((l) => l.filter((x) => x.id !== f.id).map((x) => (x.parentId === f.id ? { ...x, parentId: f.parentId } : x)));
            addHistory("DELETE", `Folder: ${f.name}`, [{ field: "Deleted", from: f.name, to: "(deleted). Contents moved up one level" }]);
            say("ok", `Folder “${f.name}” deleted. Its files moved up one level.`);
        }
        if (active === f.id) setActive(f.parentId ?? "all");
        setDialog(null);
    };

    /* ---- file actions ---- */
    const moveAssets = (ids, folderId) => {
        if (!ids.length) return;
        const label = folderLabel(folderId);
        if (live) send("post", ENDPOINTS.bulk, { ids, action: "move", folder_id: folderId }, { ok: () => say("ok", `Moved ${ids.length} file${ids.length === 1 ? "" : "s"} to ${label}.`) });
        else {
            setAssets((l) => l.map((a) => (ids.includes(a.id) ? { ...a, folderId } : a)));
            addHistory("UPDATE", ids.length === 1 ? assets.find((a) => a.id === ids[0])?.name : `${ids.length} files`, [{ field: "Folder", from: "Previous folder", to: label }]);
            say("ok", `Moved ${ids.length} file${ids.length === 1 ? "" : "s"} to ${label}.`);
        }
        setChecked([]);
    };

    const onDropAssets = (e, folderId) => {
        setDropOn(null);
        const raw = e.dataTransfer.getData("application/x-ml-assets");
        if (!raw) return;
        e.preventDefault();
        try { moveAssets(JSON.parse(raw), folderId); } catch { /* ignore */ }
    };

    const saveAsset = (id, patch) => {
        const before = assets.find((a) => a.id === id);
        const changes = [];
        if (patch.name !== before.name) changes.push({ field: "File name", from: before.name, to: patch.name });
        if (patch.alt !== (before.alt || "")) changes.push({ field: "Alt text", from: before.alt || "", to: patch.alt });
        if (patch.caption !== (before.caption || "")) changes.push({ field: "Caption", from: before.caption || "", to: patch.caption });
        if (patch.folderId !== (before.folderId ?? null)) changes.push({ field: "Folder", from: folderLabel(before.folderId ?? null), to: folderLabel(patch.folderId) });
        if (live) send("patch", ENDPOINTS.asset(id), { original_name: patch.name, alt_text: patch.alt, caption: patch.caption, folder_id: patch.folderId }, { ok: () => say("ok", "File details saved.") });
        else {
            setAssets((l) => l.map((a) => (a.id === id ? { ...a, ...patch } : a)));
            addHistory("UPDATE", before.name, changes);
            say("ok", "File details saved.");
        }
        setDrawerId(null);
    };

    const askDelete = (ids) => setDialog({ type: "delete", ids });

    const confirmDelete = () => {
        const targets = dialog.ids.map((id) => assets.find((a) => a.id === id)).filter(Boolean);
        const free = targets.filter((a) => !(a.usage || []).length);
        if (!free.length) return setDialog(null);
        const ids = free.map((a) => a.id);
        if (live) send("post", ENDPOINTS.bulk, { ids, action: "delete" }, { ok: () => say("ok", `${ids.length} file${ids.length === 1 ? "" : "s"} moved to Trash.`) });
        else {
            setAssets((l) => l.filter((a) => !ids.includes(a.id)));
            free.forEach((a) => addHistory("DELETE", a.name, [{ field: "Moved to Trash", from: a.name, to: "(deleted)" }]));
            say("ok", `${ids.length} file${ids.length === 1 ? "" : "s"} moved to Trash. Only the Super Admin can restore them.`);
        }
        setChecked((c) => c.filter((id) => !ids.includes(id)));
        setDrawerId(null);
        setDialog(null);
    };

    const copyUrl = async (a) => {
        const full = `${window.location.origin}${urlOf(a)}`;
        try { await navigator.clipboard.writeText(full); say("ok", "File address copied."); } catch { say("info", full); }
    };

    /* replace: pick → validate → confirm → apply */
    const pickReplace = (a) => { replaceFor.current = a.id; replaceRef.current?.click(); };
    const onReplaceChosen = (file) => {
        const target = assets.find((a) => a.id === replaceFor.current);
        if (!file || !target) return;
        const check = checkFile(file, target.type);
        if (check.error) return say("error", check.error);
        setDialog({ type: "replace", asset: target, file });
    };

    const confirmReplace = async () => {
        const { asset: a, file } = dialog;
        if (live) send("post", ENDPOINTS.replace(a.id), { file }, { form: true, ok: () => say("ok", `${a.name} replaced. Every page that uses it now shows the new file.`) });
        else {
            const dims = await readDims(file, a.type);
            const url = a.type === "image" || a.type === "video" || a.type === "audio" ? URL.createObjectURL(file) : null;
            setAssets((l) => l.map((x) => (x.id === a.id ? { ...x, size: file.size, mime: file.type || x.mime, ...dims, url: url || x.url } : x)));
            addHistory("UPDATE", a.name, [{ field: "File replaced", from: fmtBytes(a.size), to: fmtBytes(file.size) }]);
            say("ok", `${a.name} replaced (sample data, not stored).`);
        }
        setDialog(null);
    };

    /* upload */
    const patchUpload = (id, patch) => setUploads((u) => u.map((x) => (x.id === id ? { ...x, ...patch } : x)));

    const uploadFiles = (files) => {
        const folderId = typeof active === "number" ? active : null;
        Array.from(files).forEach(async (file) => {
            const id = uid();
            const check = checkFile(file);
            if (check.error) { setUploads((u) => [{ id, name: file.name, size: file.size, progress: 0, status: "error", error: check.error }, ...u]); return; }
            setUploads((u) => [{ id, name: file.name, size: file.size, type: check.type, progress: 0, status: "uploading" }, ...u]);

            if (live) {
                router.post(ENDPOINTS.upload, { file, folder_id: folderId }, {
                    forceFormData: true, preserveScroll: true, preserveState: true,
                    onProgress: (e) => e && patchUpload(id, { progress: e.percentage || 0 }),
                    onSuccess: () => patchUpload(id, { progress: 100, status: "done" }),
                    onError: (errs) => patchUpload(id, { status: "error", error: Object.values(errs || {})[0] || "The upload failed." }),
                });
                return;
            }
            const dims = await readDims(file, check.type);
            let p = 0;
            const timer = setInterval(() => {
                p = Math.min(100, p + 12 + Math.random() * 18);
                patchUpload(id, { progress: p });
                if (p >= 100) {
                    clearInterval(timer);
                    const newId = (nextId.current += 1);
                    const a = {
                        id: newId, name: file.name, storedName: `${newId}-${file.name}`, type: check.type, mime: file.type || MIME[extOf(file.name)] || "application/octet-stream", size: file.size, ...dims,
                        alt: "", caption: "", folderId, url: ["image", "video", "audio"].includes(check.type) ? URL.createObjectURL(file) : null,
                        uploadedBy: "You", uploadedAt: new Date().toISOString(), usage: [],
                    };
                    setAssets((l) => [a, ...l]);
                    patchUpload(id, { status: "done", assetId: newId });
                    addHistory("CREATE", file.name, [{ field: "Uploaded to", from: "(new)", to: folderLabel(folderId) }]);
                }
            }, 220);
        });
    };

    const exportList = () => {
        const rows = [["Name", "Type", "Size", "Folder", "Alt text", "Used in", "Uploaded by", "Uploaded at"], ...filtered.map((a) => [a.name, TYPES[a.type].label, fmtBytes(a.size), folderLabel(a.folderId ?? null), a.alt || "", (a.usage || []).map((u) => `${u.module}: ${u.label}`).join(" | "), a.uploadedBy, a.uploadedAt])];
        const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
        const link = document.createElement("a");
        link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
        link.download = "media-library.csv";
        link.click();
        say("ok", `Exported ${filtered.length} file${filtered.length === 1 ? "" : "s"}.`);
    };

    const toggleCheck = (id) => setChecked((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]));
    const toggleExpand = (id) => setExpanded((x) => (x.includes(id) ? x.filter((y) => y !== id) : [...x, id]));

    const treeCtx = { folders, active, setActive, counts, expanded, toggleExpand, dropOn, setDropOn, onDropAssets, openFolderDialog, askDeleteFolder: (f) => setDialog({ type: "delete-folder", folder: f }) };

    /* dialog data */
    const delTargets = dialog?.type === "delete" ? dialog.ids.map((id) => assets.find((a) => a.id === id)).filter(Boolean) : [];
    const delUsed = delTargets.filter((a) => (a.usage || []).length);
    const delFree = delTargets.filter((a) => !(a.usage || []).length);

    const folderOptions = [];
    const walk = (parent, depth) => childrenOf(folders, parent).forEach((f) => { folderOptions.push({ id: f.id, label: `${"— ".repeat(depth)}${f.name}` }); walk(f.id, depth + 1); });
    walk(null, 0);

    const dragProps = {
        onDragOver: (e) => { if (e.dataTransfer.types.includes("Files")) { e.preventDefault(); setDragFiles(true); } },
        onDragLeave: (e) => { if (e.currentTarget === e.target) setDragFiles(false); },
        onDrop: (e) => { if (e.dataTransfer.files?.length) { e.preventDefault(); setDragFiles(false); uploadFiles(e.dataTransfer.files); } },
    };

    const accept = Object.values(TYPES).flatMap((t) => t.exts.map((x) => `.${x}`)).join(",");

    return (
        <div className="ml">
            <div className="ml-heading">
                <div>
                    <h1>Media Library</h1>
                    <p>Upload and organise images, videos, documents and audio. Each file shows where it is used, so nothing in use is deleted by accident.</p>
                </div>
                <div className="ml-actions">
                    <div className="ml-seg" role="group" aria-label="View">
                        <button type="button" className={view === "grid" ? "is-on" : ""} onClick={() => setView("grid")} aria-label="Grid view"><Icon name="grid" size={15} /> Grid</button>
                        <button type="button" className={view === "list" ? "is-on" : ""} onClick={() => setView("list")} aria-label="List view"><Icon name="list" size={15} /> List</button>
                    </div>
                    <button type="button" className="ml-btn-outline" onClick={() => openFolderDialog({ mode: "new", parentId: typeof active === "number" ? active : null })}><Icon name="folderPlus" size={16} /> New folder</button>
                    <button type="button" className="ml-btn-yellow" onClick={() => fileRef.current?.click()}><Icon name="upload" size={16} /> Upload files</button>
                    <input ref={fileRef} type="file" hidden multiple accept={accept} onChange={(e) => { if (e.target.files?.length) uploadFiles(e.target.files); e.target.value = ""; }} />
                    <input ref={replaceRef} type="file" hidden accept={accept} onChange={(e) => { onReplaceChosen(e.target.files?.[0]); e.target.value = ""; }} />
                </div>
            </div>

            {!live && <p className="ml-note"><Icon name="alert" size={16} /><span>Sample data. Every control works, but nothing is stored until your controller sends the <b>library</b> prop.</span></p>}

            <div className="ml-tabs" role="tablist" aria-label="Media Library">
                {[["library", "Files"], ["history", "History"]].map(([key, label]) => (
                    <button key={key} type="button" role="tab" aria-selected={tab === key} className={tab === key ? "is-active" : ""} onClick={() => setTab(key)}>
                        {label}{key === "history" && <span className="ml-badge">{history.length}</span>}
                    </button>
                ))}
            </div>

            {tab === "history" && (
                <section className="ml-card">
                    <header className="ml-card-head">
                        <div><span className="ml-card-no">History</span><h2>Who changed the Media Library</h2><p>Every upload, edit, move, replace and delete is recorded. Entries cannot be edited.</p></div>
                    </header>
                    {history.length === 0 ? <p className="ml-empty">No history yet.</p> : (
                        <ul className="ml-history">
                            {history.map((h) => (
                                <li key={h.id}>
                                    <div className="ml-hist-row">
                                        <span className="ml-avatar">{initialsOf(h.user)}</span>
                                        <span className="ml-hist-text"><strong>{h.user}</strong><small>{ACTION_LABEL[h.action] || h.action} <b>{h.label}</b></small></span>
                                        <span className={`ml-pill is-${ACTION_PILL[h.action] || "info"}`}>{ACTION_LABEL[h.action] || h.action}</span>
                                        <span className="ml-hist-time" title={formatDate(h.at)}>{timeAgo(h.at)}</span>
                                    </div>
                                    {h.changes?.length > 0 && <div className="ml-diff">{h.changes.map((c, i) => <div key={i}><span>{c.field}</span><del>{c.from || "(empty)"}</del><ins>{c.to}</ins></div>)}</div>}
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            )}

            {tab === "library" && (
                <>
                    <div className="ml-stats">
                        <article className="ml-stat is-hero"><span>Files</span><strong>{stats.total}</strong><small>{stats.used} in use · {stats.total - stats.used} unused</small></article>
                        <article className="ml-stat"><span>Images</span><strong>{stats.image}</strong><small>{stats.noalt ? `${stats.noalt} need alt text` : "All have alt text"}</small></article>
                        <article className="ml-stat"><span>Videos</span><strong>{stats.video}</strong><small>Up to {TYPES.video.maxMb} MB each</small></article>
                        <article className="ml-stat"><span>Documents and audio</span><strong>{stats.document + stats.audio}</strong><small>{stats.document} documents · {stats.audio} audio</small></article>
                        <article className="ml-stat"><span>Storage used</span><strong>{fmtBytes(stats.bytes)}</strong><small>{folders.length} folder{folders.length === 1 ? "" : "s"}</small></article>
                    </div>

                    {stats.noalt > 0 && (
                        <div className="ml-banner" role="status">
                            <Icon name="alert" size={18} />
                            <span><b>{stats.noalt} image{stats.noalt === 1 ? " has" : "s have"} no alt text.</b> Screen readers cannot describe {stats.noalt === 1 ? "it" : "them"}, and search engines cannot read {stats.noalt === 1 ? "it" : "them"}.</span>
                            <button type="button" className="ml-btn-small" onClick={() => { setFilter("noalt"); setActive("all"); }}>Show them</button>
                        </div>
                    )}

                    <div className="ml-layout">
                        <aside className="ml-folders" aria-label="Folders">
                            <div className="ml-folders-head"><h3>Folders</h3><button type="button" className="ml-iconbtn" aria-label="New top-level folder" title="New folder" onClick={() => openFolderDialog({ mode: "new", parentId: null })}><Icon name="folderPlus" size={16} /></button></div>
                            <ul className="ml-tree is-root">
                                <li><div className={`ml-node ${active === "all" ? "is-active" : ""}`}><span className="ml-node-caret" /><button type="button" className="ml-node-main" onClick={() => setActive("all")}><Icon name="inbox" size={16} /><span>All files</span><b>{assets.length}</b></button></div></li>
                                <li>
                                    <div
                                        className={`ml-node ${active === "unfiled" ? "is-active" : ""} ${dropOn === "unfiled" ? "is-drop" : ""}`}
                                        onDragOver={(e) => { if (e.dataTransfer.types.includes("application/x-ml-assets")) { e.preventDefault(); setDropOn("unfiled"); } }}
                                        onDragLeave={() => setDropOn(null)}
                                        onDrop={(e) => onDropAssets(e, null)}
                                    >
                                        <span className="ml-node-caret" />
                                        <button type="button" className="ml-node-main" onClick={() => setActive("unfiled")}><Icon name="folder" size={16} /><span>Unfiled</span><b>{assets.filter((a) => a.folderId == null).length}</b></button>
                                    </div>
                                </li>
                                {childrenOf(folders, null).map((f) => <FolderNode key={f.id} folder={f} depth={0} ctx={treeCtx} />)}
                            </ul>
                            <p className="ml-hint">Drag files onto a folder to move them.</p>
                        </aside>

                        <section className={`ml-main ${dragFiles ? "is-dragging" : ""}`} {...dragProps}>
                            <div className="ml-crumbs">
                                <button type="button" onClick={() => setActive("all")}>All files</button>
                                {active === "unfiled" && <><Icon name="right" size={13} /><span>Unfiled</span></>}
                                {crumbs.map((c, i) => <span key={c.id} className="ml-crumb"><Icon name="right" size={13} />{i === crumbs.length - 1 ? <strong>{c.name}</strong> : <button type="button" onClick={() => setActive(c.id)}>{c.name}</button>}</span>)}
                                {typeof active === "number" && childrenOf(folders, active).length > 0 && (
                                    <label className="ml-check-inline"><input type="checkbox" checked={includeSub} onChange={(e) => setIncludeSub(e.target.checked)} /> Include subfolders</label>
                                )}
                            </div>

                            <div className="ml-drop" role="button" tabIndex={0} onClick={() => fileRef.current?.click()} onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && fileRef.current?.click()}>
                                <span className="ml-drop-icon"><Icon name="upload" size={20} /></span>
                                <div>
                                    <strong>Drop files here or choose files</strong>
                                    <small>Uploading to <b>{typeof active === "number" ? folderLabel(active) : "Unfiled"}</b> · Images {TYPES.image.maxMb} MB · Video {TYPES.video.maxMb} MB · Documents {TYPES.document.maxMb} MB · Audio {TYPES.audio.maxMb} MB</small>
                                </div>
                            </div>

                            {uploads.length > 0 && (
                                <ul className="ml-queue" aria-label="Uploads">
                                    {uploads.slice(0, 6).map((u) => (
                                        <li key={u.id} className={`is-${u.status}`}>
                                            <span className="ml-queue-icon"><Icon name={u.status === "error" ? "alert" : u.status === "done" ? "check" : typeIcon(u.type)} size={15} /></span>
                                            <div className="ml-queue-text">
                                                <strong>{u.name}</strong>
                                                {u.status === "error" ? <small className="is-error">{u.error}</small> : <small>{u.status === "done" ? "Uploaded" : `${Math.round(u.progress)}%`} · {fmtBytes(u.size)}</small>}
                                                {u.status === "uploading" && <span className="ml-progress"><i style={{ width: `${u.progress}%` }} /></span>}
                                            </div>
                                            {u.status === "done" && u.assetId && assets.find((a) => a.id === u.assetId && needsAlt(a)) && <button type="button" className="ml-btn-small" onClick={() => setDrawerId(u.assetId)}>Add alt text</button>}
                                        </li>
                                    ))}
                                    {uploads.every((u) => u.status !== "uploading") && <li className="ml-queue-clear"><button type="button" className="ml-btn-small is-quiet" onClick={() => setUploads([])}>Clear list</button></li>}
                                </ul>
                            )}

                            <div className="ml-chips" role="group" aria-label="Filter files">
                                {[["all", "All", assets.length], ["image", "Images", stats.image], ["video", "Videos", stats.video], ["document", "Documents", stats.document], ["audio", "Audio", stats.audio], ["noalt", "Needs alt text", stats.noalt], ["used", "In use", stats.used], ["unused", "Unused", stats.total - stats.used]].map(([k, label, n]) => (
                                    <button key={k} type="button" className={filter === k ? "is-on" : ""} onClick={() => setFilter(k)}>{label} <b>{n}</b></button>
                                ))}
                            </div>

                            <div className="ml-toolbar">
                                <label className="ml-search"><Icon name="search" size={16} /><input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by file name, alt text or caption" aria-label="Search files" /></label>
                                <select className="ml-input ml-select" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort files">
                                    <option value="newest">Newest first</option>
                                    <option value="oldest">Oldest first</option>
                                    <option value="name">Name A to Z</option>
                                    <option value="size">Largest first</option>
                                </select>
                                <button type="button" className="ml-btn-small" onClick={exportList} disabled={!filtered.length}><Icon name="download" size={14} /> Export list</button>
                            </div>

                            {checked.length > 0 && (
                                <div className="ml-bulk" role="region" aria-label="Selected files">
                                    <span><b>{checked.length}</b> selected</span>
                                    <button type="button" className="ml-btn-small" onClick={() => { setMoveTo(""); setDialog({ type: "move", ids: checked }); }}><Icon name="move" size={14} /> Move to folder</button>
                                    <button type="button" className="ml-btn-small is-danger" onClick={() => askDelete(checked)}><Icon name="trash" size={14} /> Delete</button>
                                    <button type="button" className="ml-btn-small is-quiet" onClick={() => setChecked([])}>Clear</button>
                                </div>
                            )}

                            <div className="ml-listhead">
                                <label className="ml-check-inline"><input type="checkbox" checked={allVisibleChecked} onChange={() => setChecked(allVisibleChecked ? checked.filter((id) => !visible.some((a) => a.id === id)) : [...new Set([...checked, ...visible.map((a) => a.id)])])} /> Select all shown</label>
                                <span>{activeName}: {filtered.length} file{filtered.length === 1 ? "" : "s"}</span>
                            </div>

                            {filtered.length === 0 ? (
                                <div className="ml-empty-state">
                                    <Icon name="image" size={30} />
                                    <strong>{assets.length === 0 ? "No files yet" : "No files match"}</strong>
                                    <p>{assets.length === 0 ? "Upload your first file to get started." : "Try another search, filter or folder."}</p>
                                    {assets.length > 0 && <button type="button" className="ml-btn-small" onClick={() => { setQuery(""); setFilter("all"); setActive("all"); }}>Clear filters</button>}
                                </div>
                            ) : view === "grid" ? (
                                <ul className="ml-grid">
                                    {visible.map((a) => {
                                        const isSel = checked.includes(a.id);
                                        const uses = (a.usage || []).length;
                                        return (
                                            <li key={a.id}>
                                                <article
                                                    className={`ml-card-file ${isSel ? "is-selected" : ""}`}
                                                    draggable
                                                    onDragStart={(e) => { const ids = isSel ? checked : [a.id]; e.dataTransfer.setData("application/x-ml-assets", JSON.stringify(ids)); e.dataTransfer.effectAllowed = "move"; }}
                                                >
                                                    <label className="ml-check" title="Select"><input type="checkbox" checked={isSel} onChange={() => toggleCheck(a.id)} aria-label={`Select ${a.name}`} /><span><Icon name="check" size={13} /></span></label>
                                                    <button type="button" className="ml-card-open" onClick={() => setDrawerId(a.id)} aria-label={`Open details for ${a.name}`}>
                                                        <span className="ml-thumb"><img src={thumbOf(a)} alt="" loading="lazy" /></span>
                                                        <span className="ml-card-text"><strong title={a.name}>{a.name}</strong><small>{TYPES[a.type].label} · {fmtBytes(a.size)}{a.width ? ` · ${a.width}×${a.height}` : ""}</small></span>
                                                    </button>
                                                    <span className="ml-tags">
                                                        {needsAlt(a) && <span className="ml-tag is-warn"><Icon name="alert" size={11} /> Alt text</span>}
                                                        {uses > 0 && <span className="ml-tag"><Icon name="link" size={11} /> {uses}</span>}
                                                    </span>
                                                </article>
                                            </li>
                                        );
                                    })}
                                </ul>
                            ) : (
                                <ul className="ml-rows">
                                    <li className="ml-row is-head"><span /><span>Name</span><span>Type</span><span>Size</span><span>Folder</span><span>Alt text</span><span>Used</span><span>Uploaded</span></li>
                                    {visible.map((a) => {
                                        const isSel = checked.includes(a.id);
                                        return (
                                            <li key={a.id} className={`ml-row ${isSel ? "is-selected" : ""}`} draggable onDragStart={(e) => { const ids = isSel ? checked : [a.id]; e.dataTransfer.setData("application/x-ml-assets", JSON.stringify(ids)); e.dataTransfer.effectAllowed = "move"; }}>
                                                <label className="ml-check is-inline"><input type="checkbox" checked={isSel} onChange={() => toggleCheck(a.id)} aria-label={`Select ${a.name}`} /><span><Icon name="check" size={13} /></span></label>
                                                <button type="button" className="ml-row-name" onClick={() => setDrawerId(a.id)}><img src={thumbOf(a)} alt="" loading="lazy" /><strong title={a.name}>{a.name}</strong></button>
                                                <span>{TYPES[a.type].label}</span>
                                                <span>{fmtBytes(a.size)}</span>
                                                <span className="is-trunc" title={folderLabel(a.folderId ?? null)}>{folderLabel(a.folderId ?? null)}</span>
                                                <span>{a.type !== "image" ? "n/a" : needsAlt(a) ? <em className="ml-miss">Missing</em> : "Added"}</span>
                                                <span>{(a.usage || []).length || "None"}</span>
                                                <span title={formatDate(a.uploadedAt)}>{timeAgo(a.uploadedAt)}</span>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}

                            {filtered.length > visible.length && (
                                <div className="ml-more"><span>Showing {visible.length} of {filtered.length}</span><button type="button" className="ml-btn-outline" onClick={() => setLimit((l) => l + PAGE_SIZE)}>Show more</button></div>
                            )}

                            {dragFiles && <div className="ml-dropveil"><Icon name="upload" size={28} /><strong>Drop to upload to {typeof active === "number" ? folderLabel(active) : "Unfiled"}</strong></div>}
                        </section>
                    </div>
                </>
            )}

            {/* ---------- file drawer ---------- */}
            {drawerAsset && <AssetDrawer key={drawerAsset.id} asset={drawerAsset} folders={folders} onClose={() => setDrawerId(null)} onSave={saveAsset} onReplacePick={pickReplace} onDelete={askDelete} onCopy={copyUrl} />}

            {/* ---------- dialogs ---------- */}
            {dialog?.type === "folder" && (
                <div className="ml-overlay is-top" onMouseDown={(e) => e.target === e.currentTarget && setDialog(null)}>
                    <form className="ml-dialog ml-small" role="dialog" aria-modal="true" aria-labelledby="ml-folder-title" onSubmit={(e) => { e.preventDefault(); submitFolder(); }}>
                        <span className="ml-dialog-icon"><Icon name="folderPlus" size={22} /></span>
                        <h2 id="ml-folder-title">{dialog.mode === "new" ? "New folder" : "Rename folder"}</h2>
                        <p>{dialog.mode === "new" ? (dialog.parentId != null ? `It will be created inside “${folderOf(dialog.parentId)?.name}”.` : "It will be created at the top level.") : "Files inside keep their place."}</p>
                        <div className={`ml-field ${folderError ? "has-error" : ""}`}>
                            <div className="ml-field-top"><label htmlFor="ml-foldername">Folder name</label><span className={`ml-count ${folderName.length > 120 ? "is-over" : ""}`}>{folderName.length}/120</span></div>
                            <input id="ml-foldername" className="ml-input" value={folderName} onChange={(e) => { setFolderName(e.target.value); setFolderError(""); }} autoFocus />
                            {folderError && <p className="ml-error" role="alert"><Icon name="alert" size={13} /> {folderError}</p>}
                        </div>
                        <div className="ml-dialog-actions">
                            <button type="button" className="ml-btn-outline" onClick={() => setDialog(null)}>Cancel</button>
                            <button type="submit" className="ml-btn-yellow">{dialog.mode === "new" ? "Create folder" : "Save name"}</button>
                        </div>
                    </form>
                </div>
            )}

            {dialog?.type === "delete-folder" && (
                <div className="ml-overlay is-top" onMouseDown={(e) => e.target === e.currentTarget && setDialog(null)}>
                    <div className="ml-dialog ml-small" role="alertdialog" aria-modal="true" aria-labelledby="ml-delfolder-title">
                        <span className="ml-dialog-icon is-danger"><Icon name="trash" size={22} /></span>
                        <h2 id="ml-delfolder-title">Delete folder “{dialog.folder.name}”?</h2>
                        <p>The folder is removed. Its {counts.get(dialog.folder.id) || 0} file{(counts.get(dialog.folder.id) || 0) === 1 ? "" : "s"} and {childrenOf(folders, dialog.folder.id).length} subfolder{childrenOf(folders, dialog.folder.id).length === 1 ? "" : "s"} move up one level. No file is deleted.</p>
                        <div className="ml-dialog-actions">
                            <button type="button" className="ml-btn-outline" onClick={() => setDialog(null)} autoFocus>Keep it</button>
                            <button type="button" className="ml-btn-danger" onClick={confirmDeleteFolder}><Icon name="trash" size={15} /> Delete folder</button>
                        </div>
                    </div>
                </div>
            )}

            {dialog?.type === "move" && (
                <div className="ml-overlay is-top" onMouseDown={(e) => e.target === e.currentTarget && setDialog(null)}>
                    <div className="ml-dialog ml-small" role="dialog" aria-modal="true" aria-labelledby="ml-move-title">
                        <span className="ml-dialog-icon"><Icon name="move" size={22} /></span>
                        <h2 id="ml-move-title">Move {dialog.ids.length} file{dialog.ids.length === 1 ? "" : "s"}</h2>
                        <p>Pages keep working. Only the folder changes.</p>
                        <div className="ml-field">
                            <div className="ml-field-top"><label htmlFor="ml-moveto">Destination folder</label></div>
                            <select id="ml-moveto" className="ml-input ml-select" value={moveTo} onChange={(e) => setMoveTo(e.target.value)}>
                                <option value="">Unfiled</option>
                                {folderOptions.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                            </select>
                        </div>
                        <div className="ml-dialog-actions">
                            <button type="button" className="ml-btn-outline" onClick={() => setDialog(null)}>Cancel</button>
                            <button type="button" className="ml-btn-yellow" onClick={() => { moveAssets(dialog.ids, moveTo === "" ? null : Number(moveTo)); setDialog(null); }}>Move</button>
                        </div>
                    </div>
                </div>
            )}

            {dialog?.type === "delete" && (
                <div className="ml-overlay is-top" onMouseDown={(e) => e.target === e.currentTarget && setDialog(null)}>
                    <div className="ml-dialog ml-small" role="alertdialog" aria-modal="true" aria-labelledby="ml-del-title">
                        <span className={`ml-dialog-icon ${delFree.length ? "is-danger" : ""}`}><Icon name={delFree.length ? "trash" : "alert"} size={22} /></span>
                        <h2 id="ml-del-title">{delFree.length === 0 ? "This file is in use" : delTargets.length === 1 ? `Delete “${delTargets[0].name}”?` : `Delete ${delFree.length} of ${delTargets.length} files?`}</h2>
                        {delFree.length > 0 && <p>{delFree.length === 1 ? "It moves" : "They move"} to Content Trash, where only the Super Admin can restore or purge {delFree.length === 1 ? "it" : "them"}.</p>}
                        {delUsed.length > 0 && (
                            <div className="ml-blocked">
                                <p className="ml-blocked-title"><Icon name="alert" size={15} /> {delFree.length === 0 ? "It cannot be deleted while pages use it." : `${delUsed.length} file${delUsed.length === 1 ? " is" : "s are"} in use and will be kept.`}</p>
                                <ul>
                                    {delUsed.slice(0, 4).map((a) => (
                                        <li key={a.id}><strong>{a.name}</strong><span>{a.usage.map((u) => `${u.module}: ${u.label}`).join(" · ")}</span></li>
                                    ))}
                                    {delUsed.length > 4 && <li><span>and {delUsed.length - 4} more</span></li>}
                                </ul>
                                <p className="ml-hint">Replace the file instead, or remove it from those pages first.</p>
                            </div>
                        )}
                        <div className="ml-dialog-actions">
                            <button type="button" className="ml-btn-outline" onClick={() => setDialog(null)} autoFocus>{delFree.length ? "Keep" : "Close"}</button>
                            {delFree.length > 0 && <button type="button" className="ml-btn-danger" onClick={confirmDelete}><Icon name="trash" size={15} /> Move {delFree.length === 1 ? "to Trash" : `${delFree.length} to Trash`}</button>}
                        </div>
                    </div>
                </div>
            )}

            {dialog?.type === "replace" && (
                <div className="ml-overlay is-top" onMouseDown={(e) => e.target === e.currentTarget && setDialog(null)}>
                    <div className="ml-dialog ml-small" role="alertdialog" aria-modal="true" aria-labelledby="ml-rep-title">
                        <span className="ml-dialog-icon"><Icon name="replace" size={22} /></span>
                        <h2 id="ml-rep-title">Replace “{dialog.asset.name}”?</h2>
                        <p>The file is swapped for <b>{dialog.file.name}</b> ({fmtBytes(dialog.file.size)}). {(dialog.asset.usage || []).length > 0 ? `The ${dialog.asset.usage.length} page${dialog.asset.usage.length === 1 ? "" : "s"} that use it will show the new file straight away.` : "No page uses it yet."} The address stays the same.</p>
                        <div className="ml-dialog-actions">
                            <button type="button" className="ml-btn-outline" onClick={() => setDialog(null)}>Cancel</button>
                            <button type="button" className="ml-btn-yellow" onClick={confirmReplace}><Icon name="replace" size={15} /> Replace file</button>
                        </div>
                    </div>
                </div>
            )}

            {toast && (
                <div className={`ml-toast is-${toast.tone}`} role="status">
                    <Icon name={toast.tone === "error" ? "alert" : "check"} size={16} />
                    <span>{toast.text}</span>
                    <button type="button" aria-label="Dismiss" onClick={() => setToast(null)}><Icon name="close" size={14} /></button>
                </div>
            )}
        </div>
    );
}

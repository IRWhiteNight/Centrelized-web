import { useEffect, useRef, useState } from "react";
import { Head, router, usePage } from "@inertiajs/react";
import NavigationBar from "../../Components/Admin-COEUAS-Components/NavigationBar";
import { COEUAS_BASE } from "../../Components/Admin-COEUAS-Components/COEUASRoutes";
import "../../../css/admin-COEUAS-css/admin-home.css";

/* ==========================================================================
   COE-UAS · HOME PAGE   (/admin/coeuas/home)
   From the Admin CMS document (v1.0):
     Site map 1.3  → Home Page: Main banner and introduction · Research focus
                     and capabilities · Featured research and members (pin) ·
                     Highlights, achievements and partners · Latest news and
                     activities (pin)
     Use case 2.3  → Manage Home Banner and Sections · Feature Members on Home
     ERD-2         → pages / page_sections (section_key, section_type, heading,
                     body, cta_label, cta_url, media_id) · featured_items
                     (placement, entity_type, entity_id, sort_order) · partners

   DATA   The controller sends  props.home  :
            { sections: { banner, focus, featured, highlights, news } }
          Every section = { status: "published" | "draft", visible: bool,
                            updated_at, updated_by, ...content }  (see SAMPLE).
          Without props.home the page shows SAMPLE data and works in the
          browser only (tagged "Sample data").

   SAVE   PUT {BASE}/home/{sectionKey}
          body: { status, visible, ...content }
          Lists are sent in display order (sort_order = array index).
          Pinned items are marked  pinned: true  (max PIN_LIMIT per list).
   ========================================================================== */

const BASE = `${COEUAS_BASE}/home`;

// URL slug  ↔  section key. The slugs are the ones in COEUASRoutes.js (sidebar)
// and in the Laravel route:  /admin/coeuas/home/{section}
const SLUG = { banner: "banner", focus: "research-focus", featured: "featured", highlights: "highlights", news: "news" };
const KEY_OF = Object.fromEntries(Object.entries(SLUG).map(([k, v]) => [v, k]));
const PIN_LIMIT = 3; // assumption: how many items one list may pin
const uid = () => Math.random().toString(36).slice(2, 9);
const daysAgo = (d) => new Date(Date.now() - d * 86400000).toISOString();

/* ------------------------------------------------------------------ */
/* SECTION SETUP: edit labels, fields and limits here                  */
/* field: { k, label, type: text | area | select | date | url, options }*/
/* ------------------------------------------------------------------ */
const ICONS = ["drone", "chip", "shield", "flask", "radar", "globe"];
const SECTIONS = [
    { key: "banner", label: "Main banner and introduction", short: "Banner", hint: "The first screen visitors see." },
    {
        key: "focus", label: "Research focus and capabilities", short: "Research focus", hint: "Short cards about what the centre does.",
        heading: true,
        lists: [{
            key: "cards", title: "Focus areas", noun: "focus area", max: 6,
            fields: [
                { k: "title", label: "Title", required: true },
                { k: "text", label: "Short description", type: "area" },
                { k: "icon", label: "Icon", type: "select", options: ICONS },
            ],
        }],
    },
    {
        key: "featured", label: "Featured research and members", short: "Featured", hint: "Pin items so they appear first on Home.", pin: true,
        lists: [
            {
                key: "research", title: "Featured research", noun: "research item", max: 8,
                fields: [
                    { k: "title", label: "Title", required: true },
                    { k: "kind", label: "Type", type: "select", options: ["Research project", "Programme", "Grant", "Innovation"] },
                    { k: "url", label: "Link", type: "url" },
                ],
            },
            {
                key: "members", title: "Featured members", noun: "member", max: 8,
                fields: [
                    { k: "title", label: "Member name", required: true },
                    { k: "kind", label: "Category", type: "select", options: ["Academic staff", "Researcher", "Postdoctoral", "Postgraduate"] },
                    { k: "url", label: "Profile link", type: "url" },
                ],
            },
        ],
    },
    {
        key: "highlights", label: "Highlights, achievements and partners", short: "Highlights", hint: "Numbers, awards and logos of partners.",
        lists: [
            {
                key: "highlights", title: "Highlights", noun: "highlight", max: 8,
                fields: [
                    { k: "title", label: "Figure or headline", required: true },
                    { k: "text", label: "Label", type: "text" },
                ],
            },
            {
                key: "achievements", title: "Achievements", noun: "achievement", max: 10,
                fields: [
                    { k: "title", label: "Achievement", required: true },
                    { k: "year", label: "Year" },
                    { k: "text", label: "Details", type: "area" },
                ],
            },
            {
                key: "partners", title: "Partners", noun: "partner", max: 24,
                fields: [
                    { k: "title", label: "Partner name", required: true },
                    { k: "url", label: "Website", type: "url" },
                    { k: "logo", label: "Logo image URL", type: "url" },
                ],
            },
        ],
    },
    {
        key: "news", label: "Latest news and activities", short: "News", hint: "Pinned items stay at the top of the Home news strip.", pin: true,
        lists: [{
            key: "items", title: "News and activities", noun: "item", max: 12,
            fields: [
                { k: "title", label: "Headline", required: true },
                { k: "kind", label: "Type", type: "select", options: ["News", "Activity", "Event"] },
                { k: "date", label: "Date", type: "date" },
            ],
        }],
    },
];

/* ------------------------------------------------------------------ */
/* SAMPLE DATA (fictional, clearly marked in the UI)                   */
/* ------------------------------------------------------------------ */
const L = (arr) => arr.map((o) => ({ id: uid(), pinned: false, ...o }));
const SAMPLE = {
    sections: {
        banner: {
            status: "published", visible: true, updated_at: daysAgo(2), updated_by: "Sample Admin",
            heading: "Centre of Excellence for Unmanned Aerial Systems",
            body: "Sample text: research, innovation and training for safe and useful unmanned aircraft in Malaysia.",
            cta_label: "Explore our research", cta_url: "/research", media_url: "",
        },
        focus: {
            status: "published", visible: true, updated_at: daysAgo(9), updated_by: "Sample Admin",
            heading: "What we do",
            lists: {
                cards: L([
                    { title: "Flight systems", text: "Sample: control, navigation and autonomy for small aircraft.", icon: "drone" },
                    { title: "Sensing and AI", text: "Sample: perception and data analysis on board and on the ground.", icon: "chip" },
                    { title: "Safety and regulation", text: "Sample: risk methods that support safe operations.", icon: "shield" },
                ]),
            },
        },
        featured: {
            status: "draft", visible: true, updated_at: daysAgo(1), updated_by: "Sample Admin",
            lists: {
                research: L([
                    { title: "Perlis Airspace Sandbox", kind: "Programme", url: "/research/featured-programmes", pinned: true },
                    { title: "Sample: Low-altitude traffic management", kind: "Research project", url: "" },
                ]),
                members: L([
                    { title: "Sample Member A", kind: "Academic staff", url: "", pinned: true },
                    { title: "Sample Member B", kind: "Researcher", url: "" },
                ]),
            },
        },
        highlights: {
            status: "published", visible: true, updated_at: daysAgo(14), updated_by: "Sample Admin",
            lists: {
                highlights: L([{ title: "13 years", text: "Since 2013" }, { title: "24", text: "Active members" }]),
                achievements: L([{ title: "Sample: National innovation award", year: "2025", text: "Sample details." }]),
                partners: L([{ title: "Sample Partner One", url: "", logo: "" }, { title: "Sample Partner Two", url: "", logo: "" }]),
            },
        },
        news: {
            status: "published", visible: true, updated_at: daysAgo(3), updated_by: "Sample Admin",
            lists: {
                items: L([
                    { title: "Sample: Annual research highlights released", kind: "News", date: daysAgo(3).slice(0, 10), pinned: true },
                    { title: "Sample: Drone operations course opens", kind: "Activity", date: daysAgo(6).slice(0, 10) },
                    { title: "Sample: Industry briefing day", kind: "Event", date: daysAgo(12).slice(0, 10) },
                ]),
            },
        },
    },
};

/* ------------------------------------------------------------------ */
/* helpers                                                             */
/* ------------------------------------------------------------------ */
const clone = (o) => JSON.parse(JSON.stringify(o));
const sectionOf = (key) => SECTIONS.find((s) => s.key === key);
const countItems = (sec, data) => (sec.lists ? sec.lists.reduce((n, l) => n + (data?.lists?.[l.key]?.length ?? 0), 0) : null);
const fmtWhen = (iso) => {
    if (!iso) return "Not saved yet";
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

// Required fields and pin limits. Returns a message or "".
function validate(sec, data) {
    if (sec.key === "banner") return data.heading?.trim() ? "" : "Add a banner heading first.";
    for (const l of sec.lists ?? []) {
        const items = data.lists?.[l.key] ?? [];
        const req = l.fields.filter((f) => f.required);
        for (const [i, it] of items.entries()) {
            for (const f of req) if (!String(it[f.k] ?? "").trim()) return `${l.title}: item ${i + 1} needs a ${f.label.toLowerCase()}.`;
        }
        if (sec.pin && items.filter((x) => x.pinned).length > PIN_LIMIT) return `${l.title}: pin at most ${PIN_LIMIT} items.`;
    }
    return "";
}

/* ------------------------------------------------------------------ */
/* ICON                                                                */
/* ------------------------------------------------------------------ */
const PATHS = {
    up: "m6 15 6-6 6 6", down: "m6 9 6 6 6-6", plus: "M12 5v14M5 12h14", trash: "M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3",
    pin: "M12 17v5M8 3h8l-1 6 3 3H6l3-3z", eye: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",
    eyeoff: "M3 3l18 18M10.6 6.2A9.8 9.8 0 0 1 12 6c6 0 10 6 10 6a17 17 0 0 1-3.2 3.7M6.5 6.9C3.8 8.7 2 12 2 12s4 7 10 7c1.6 0 3-.4 4.3-1",
    ext: "M14 4h6v6M20 4l-9 9M18 14v5H5V6h5", img: "M3 5h18v14H3zM3 16l5-5 4 4 3-3 6 6M9 9a1 1 0 1 0 0 .01",
    check: "m5 12 5 5 9-10", save: "M5 4h11l3 3v13H5zM8 4v5h7V4M8 20v-6h8v6",
};
const Icon = ({ name, size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={PATHS[name]} /></svg>
);

/* ------------------------------------------------------------------ */
/* FIELD                                                               */
/* ------------------------------------------------------------------ */
function Field({ f, value, onChange, id }) {
    const common = { id, value: value ?? "", onChange: (e) => onChange(e.target.value) };
    return (
        <label className={`cuh-field ${f.type === "area" ? "is-wide" : ""}`} htmlFor={id}>
            <span>{f.label}{f.required && <i> *</i>}</span>
            {f.type === "area" ? <textarea rows={3} {...common} />
                : f.type === "select" ? <select {...common}>{f.options.map((o) => <option key={o} value={o}>{o}</option>)}</select>
                : <input type={f.type === "date" ? "date" : f.type === "url" ? "text" : "text"} inputMode={f.type === "url" ? "url" : undefined} placeholder={f.type === "url" ? "/page or https://…" : ""} {...common} />}
        </label>
    );
}

/* ------------------------------------------------------------------ */
/* LIST EDITOR: add, edit, reorder, remove (and pin)                   */
/* ------------------------------------------------------------------ */
function ListEditor({ spec, items, onChange, pin }) {
    const set = (i, patch) => onChange(items.map((x, n) => (n === i ? { ...x, ...patch } : x)));
    const move = (i, d) => { const j = i + d; if (j < 0 || j >= items.length) return; const next = [...items]; [next[i], next[j]] = [next[j], next[i]]; onChange(next); };
    const pinned = items.filter((x) => x.pinned).length;
    const add = () => {
        const blank = Object.fromEntries(spec.fields.map((f) => [f.k, f.type === "select" ? f.options[0] : f.type === "date" ? new Date().toISOString().slice(0, 10) : ""]));
        onChange([...items, { id: uid(), pinned: false, ...blank, _new: true }]);
    };
    return (
        <section className="cuh-list" aria-label={spec.title}>
            <header>
                <h3>{spec.title} <b>{items.length}</b></h3>
                {pin && <small>{pinned}/{PIN_LIMIT} pinned</small>}
            </header>
            {items.length === 0 && <p className="cuh-none">Nothing here yet. Add the first {spec.noun}.</p>}
            <ol>
                {items.map((it, i) => (
                    <li key={it.id} className={it.pinned ? "is-pinned" : ""}>
                        <div className="cuh-rowtop">
                            <span className="cuh-no">{i + 1}</span>
                            <div className="cuh-rowbtn">
                                {pin && (
                                    <button type="button" className={it.pinned ? "is-on" : ""} aria-pressed={!!it.pinned} title={it.pinned ? "Unpin" : "Pin to top"}
                                        disabled={!it.pinned && pinned >= PIN_LIMIT} onClick={() => set(i, { pinned: !it.pinned })}><Icon name="pin" /></button>
                                )}
                                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up"><Icon name="up" /></button>
                                <button type="button" onClick={() => move(i, 1)} disabled={i === items.length - 1} aria-label="Move down"><Icon name="down" /></button>
                                <button type="button" className="is-danger" onClick={() => onChange(items.filter((_, n) => n !== i))} aria-label={`Remove ${spec.noun} ${i + 1}`}><Icon name="trash" /></button>
                            </div>
                        </div>
                        <div className="cuh-fields">
                            {spec.fields.map((f) => <Field key={f.k} f={f} id={`${spec.key}-${it.id}-${f.k}`} value={it[f.k]} onChange={(v) => set(i, { [f.k]: v })} />)}
                        </div>
                    </li>
                ))}
            </ol>
            <button type="button" className="cuh-add" onClick={add} disabled={items.length >= spec.max}>
                <Icon name="plus" /> Add {spec.noun}{items.length >= spec.max ? ` (limit ${spec.max})` : ""}
            </button>
        </section>
    );
}

/* ------------------------------------------------------------------ */
/* BANNER EDITOR + live preview                                        */
/* ------------------------------------------------------------------ */
function BannerEditor({ data, onPatch }) {
    const f = (k, label, extra = {}) => <Field f={{ k, label, ...extra }} id={`bn-${k}`} value={data[k]} onChange={(v) => onPatch({ [k]: v })} />;
    return (
        <div className="cuh-banner">
            <div className="cuh-fields cuh-fields--one">
                {f("heading", "Heading", { required: true })}
                {f("body", "Introduction", { type: "area" })}
            </div>
            <div className="cuh-fields">
                {f("cta_label", "Button label")}
                {f("cta_url", "Button link", { type: "url" })}
                {f("media_url", "Banner image (URL from the Media Library)", { type: "url" })}
            </div>
            <div className="cuh-preview" aria-label="Preview of the banner">
                <small>Preview</small>
                <div className="cuh-hero" style={data.media_url ? { backgroundImage: `linear-gradient(90deg, rgba(0,0,0,.82), rgba(0,0,0,.35)), url(${data.media_url})` } : undefined}>
                    {!data.media_url && <span className="cuh-hero-ph"><Icon name="img" size={26} /> No image yet</span>}
                    <h4>{data.heading || "Your heading appears here"}</h4>
                    <p>{data.body || "Your introduction appears here."}</p>
                    {data.cta_label && <span className="cuh-hero-btn">{data.cta_label}</span>}
                </div>
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/* PAGE                                                                */
/* ------------------------------------------------------------------ */
export default function AdminCOEUASHome() {
    const { props } = usePage();
    const isSample = !props.home;
    const source = props.home ?? SAMPLE;

    const [saved, setSaved] = useState(() => clone(source.sections));
    const [draft, setDraft] = useState(() => clone(source.sections));
    const [active, setActive] = useState(KEY_OF[props.section] ?? "banner");
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState("");
    const [toast, setToast] = useState("");
    const toastTimer = useRef(null);

    // when the server sends fresh props after a save, take them in
    useEffect(() => {
        if (props.home?.sections) { setSaved(clone(props.home.sections)); setDraft(clone(props.home.sections)); }
    }, [props.home]);
    useEffect(() => () => clearTimeout(toastTimer.current), []);
    const say = (m) => { setToast(m); clearTimeout(toastTimer.current); toastTimer.current = setTimeout(() => setToast(""), 3600); };

    const sec = sectionOf(active);
    const data = draft[active] ?? {};
    const dirtyOf = (k) => JSON.stringify(draft[k]) !== JSON.stringify(saved[k]);
    const dirty = dirtyOf(active);
    const anyDirty = SECTIONS.some((s) => dirtyOf(s.key));
    const liveCount = SECTIONS.filter((s) => saved[s.key]?.status === "published" && saved[s.key]?.visible).length;

    const patch = (p) => { setErr(""); setDraft((d) => ({ ...d, [active]: { ...d[active], ...p } })); };
    const setList = (lk, items) => patch({ lists: { ...(data.lists ?? {}), [lk]: items } });

    // leave-page guard
    useEffect(() => {
        const h = (e) => { if (anyDirty) { e.preventDefault(); e.returnValue = ""; } };
        window.addEventListener("beforeunload", h);
        return () => window.removeEventListener("beforeunload", h);
    }, [anyDirty]);

    // sidebar sub-links change props.section → follow it
    useEffect(() => { if (KEY_OF[props.section]) { setActive(KEY_OF[props.section]); setErr(""); } }, [props.section]);

    // rail click: switch at once, and move the URL so the sidebar highlights the same item.
    // Partial reload ("only") keeps your unsaved edits.
    const pickSection = (k) => {
        setActive(k); setErr("");
        if (props.section !== undefined) router.get(`${BASE}/${SLUG[k]}`, {}, { only: ["section"], preserveState: true, preserveScroll: true, replace: false });
    };

    const save = (status) => {
        const problem = status === "published" ? validate(sec, data) : "";
        if (problem) { setErr(problem); return; }
        const next = { ...data, status, updated_at: new Date().toISOString(), updated_by: data.updated_by ?? "You" };
        const clean = clone(next);
        if (clean.lists) for (const l of Object.values(clean.lists)) l.forEach((x) => delete x._new);
        const done = () => {
            setSaved((s) => ({ ...s, [active]: clean }));
            setDraft((d) => ({ ...d, [active]: clean }));
            say(status === "published" ? `${sec.short} is live on the public Home page${clean.visible ? "" : " (but hidden: switch Show on Home on)"}.` : `${sec.short} saved as draft. Visitors still see the last published version.`);
        };
        if (isSample) { done(); return; }
        setBusy(true);
        router.put(`${BASE}/${active}`, clean, {
            preserveScroll: true, preserveState: true,
            onSuccess: done,
            onError: (e) => setErr(Object.values(e)[0] ?? "Could not save. Please try again."),
            onFinish: () => setBusy(false),
        });
    };

    const discard = () => { setDraft((d) => ({ ...d, [active]: clone(saved[active]) })); setErr(""); say("Changes discarded."); };

    const statusOf = (k) => (saved[k]?.status === "published" ? (saved[k].visible ? "live" : "hidden") : "draft");

    return (
        <>
            <Head title="COE-UAS · Home Page" />
            <section className="cuh">
                <header className="cuh-header">
                    <div>
                        <h1>Home Page</h1>
                        <p>
                            Manage what visitors see on the COE-UAS Home page. {liveCount} of {SECTIONS.length} sections are live.
                            {isSample && <span className="cuh-sample">Sample data</span>}
                        </p>
                    </div>
                    <a className="cuh-btn" href="/" target="_blank" rel="noreferrer"><Icon name="ext" /> View public Home</a>
                </header>

                <div className="cuh-grid">
                    <nav className="cuh-rail" aria-label="Home page sections">
                        {SECTIONS.map((s, i) => {
                            const st = statusOf(s.key);
                            const n = countItems(s, draft[s.key]);
                            return (
                                <button key={s.key} type="button" className={active === s.key ? "is-on" : ""} aria-current={active === s.key ? "true" : undefined} onClick={() => pickSection(s.key)}>
                                    <span className="cuh-rail-n">{i + 1}</span>
                                    <span className="cuh-rail-t">
                                        <b>{s.label}</b>
                                        <small>{n === null ? "1 block" : `${n} item${n === 1 ? "" : "s"}`}</small>
                                    </span>
                                    <span className={`cuh-dot is-${st}`} title={st} />
                                    {dirtyOf(s.key) && <i className="cuh-unsaved" title="Unsaved changes" />}
                                </button>
                            );
                        })}
                    </nav>

                    <div className="cuh-main">
                        <div className="cuh-head">
                            <div>
                                <small>Section {SECTIONS.indexOf(sec) + 1} of {SECTIONS.length}</small>
                                <h2>{sec.label}</h2>
                                <p>{sec.hint}</p>
                            </div>
                            <div className="cuh-meta">
                                <span className={`cuh-pill is-${statusOf(active)}`}>{statusOf(active)}</span>
                                <small>Updated {fmtWhen(saved[active]?.updated_at)}{saved[active]?.updated_by ? ` by ${saved[active].updated_by}` : ""}</small>
                            </div>
                        </div>

                        <label className="cuh-switch">
                            <input type="checkbox" checked={!!data.visible} onChange={(e) => patch({ visible: e.target.checked })} />
                            <i aria-hidden="true" />
                            <span><b>Show on Home</b><small>Turn off to hide this section without deleting it.</small></span>
                        </label>

                        {sec.key === "banner" && <BannerEditor data={data} onPatch={patch} />}
                        {sec.heading && (
                            <div className="cuh-fields cuh-fields--one">
                                <Field f={{ k: "heading", label: "Section heading" }} id="sec-heading" value={data.heading} onChange={(v) => patch({ heading: v })} />
                            </div>
                        )}
                        {sec.lists?.map((l) => (
                            <ListEditor key={`${active}-${l.key}`} spec={l} pin={sec.pin} items={data.lists?.[l.key] ?? []} onChange={(items) => setList(l.key, items)} />
                        ))}

                        {err && <p className="cuh-err" role="alert">{err}</p>}

                        <footer className="cuh-bar">
                            <span className={dirty ? "is-dirty" : ""}>{dirty ? "You have unsaved changes" : "All changes saved"}</span>
                            <div>
                                <button type="button" className="cuh-btn" onClick={discard} disabled={!dirty || busy}>Discard</button>
                                <button type="button" className="cuh-btn" onClick={() => save("draft")} disabled={busy || !dirty}><Icon name="save" /> Save as draft</button>
                                <button type="button" className="cuh-btn is-primary" onClick={() => save("published")} disabled={busy || (!dirty && saved[active]?.status === "published")}><Icon name="check" /> {busy ? "Saving…" : "Publish"}</button>
                            </div>
                        </footer>
                    </div>
                </div>

                {toast && <div className="cuh-toast" role="status">{toast}</div>}
            </section>
        </>
    );
}

// Inertia persistent layout: sidebar + topbar stay mounted between pages.
// Remove this line if your app already applies the COE-UAS layout somewhere else.
AdminCOEUASHome.layout = (page) => <NavigationBar>{page}</NavigationBar>;

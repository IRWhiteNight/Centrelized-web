import { useEffect, useMemo, useState } from "react";
import { Head, router, usePage } from "@inertiajs/react";
import NavigationBar from "../../Components/Admin-PSB-Components/NavigationBar";
import { PSB_ROUTES } from "../../Components/Admin-PSB-Components/psbRoutes";
import "../../../css/admin-PSB-css/admin-application.css";

/* ==========================================================================
   PSB · APPLICATIONS   (/admin/psb/applications)
   From the Admin CMS document:
     Site map  → Applications: application inbox (search, filter), application
                 detail and review, status workflow and remarks, export (CSV / PDF).
     Use cases → Review Participation Applications · Update Application Status ·
                 Request More Information · «include» Send Notification Email.
     ERD-5     → psb_applications (+ equipment, team_members, documents,
                 status_history).
     "History" tab on every record = audit entries for that record.

   DATA   The controller sends  props.applications  (array). Without it the page
          shows SAMPLE data and works fully in the browser ("Sample data" tag).
          One item:
          { id, reference_no, programme, status,
            applicant_name, applicant_email, applicant_phone,
            organisation_name, organisation_type, organisation_address,
            activity_title, activity_description, planned_start, planned_end,
            consent_accepted_at, submitted_at, review_notes,
            reviewed_by: { id, name } | null,
            equipment: [{ id, equipment_name, category_model, specifications }],
            team:      [{ id, name, role, qualification }],
            documents: [{ id, doc_type, file_name, url }],
            history:   [{ id, from_status, to_status, remarks, changed_at, changed_by: { name } }] }
          status is one of the ERD enum values (see STATUS below).

   LIVE   Endpoints, all under PSB_ROUTES.applications:
            PATCH  {base}/{id}/status   { to_status, remarks, notify }
            PUT    {base}/{id}/notes    { review_notes }
            GET    {base}/export?format=csv|pdf&status=&programme=&q=
          Laravel should (1) enforce the same transitions as TRANSITIONS,
          (2) write a psb_application_status_history row and set reviewed_by,
          (3) send the notification email when notify = true, and
          (4) write an audit_logs row (UPDATE) for every change.
   ========================================================================== */

/* ---------- workflow ---------- */
const STATUS = {
    submitted:      { label: "New",            hint: "Waiting for a reviewer" },
    under_review:   { label: "Under review",   hint: "A reviewer is checking it" },
    info_requested: { label: "Info requested", hint: "Waiting for the applicant" },
    approved:       { label: "Approved",       hint: "Ready to be carried out" },
    rejected:       { label: "Rejected",       hint: "Not accepted" },
    executed:       { label: "Executed",       hint: "Activity carried out" },
    closed:         { label: "Closed",         hint: "Finished" },
};
const STATUS_ORDER = Object.keys(STATUS);

/* Which status can follow which. ASSUMPTION: the PDF lists the statuses but not the
   allowed moves, so this is the natural order of the process
   (Express interest → Define activity → Review and approval → Execute).
   Change it here, and mirror it in Laravel.                                      */
const TRANSITIONS = {
    submitted:      ["under_review"],
    under_review:   ["info_requested", "approved", "rejected"],
    info_requested: ["under_review", "rejected"],
    approved:       ["executed", "closed"],
    rejected:       ["closed"],
    executed:       ["closed"],
    closed:         [],
};
const ACTION_LABEL = (from, to) =>
    ({
        under_review: from === "info_requested" ? "Information received, resume review" : "Start review",
        info_requested: "Request more information",
        approved: "Approve",
        rejected: "Reject",
        executed: "Mark as executed",
        closed: "Close application",
    }[to]);
const NEEDS_REMARKS = new Set(["info_requested", "rejected"]);          // the applicant must be told why
const NOTIFY_DEFAULT = new Set(["info_requested", "approved", "rejected"]); // email the applicant by default
const REMARK_LABEL = {
    info_requested: "Message to the applicant (what do you need?)",
    rejected: "Reason for the applicant",
};

const PAGE_SIZE = 8;
const MIN_REMARK = 5;

/* ---------- sample data (shown only when no props.applications) ---------- */
const daysAgo = (n, h = 10) => { const d = new Date(Date.now() - n * 86400000); d.setHours(h, 15, 0, 0); return d.toISOString(); };
const ymd = (n) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);

const EQ = [
    [{ equipment_name: "Hexacopter H6 Thermal", category_model: "Multirotor · H6-T", specifications: "MTOW 9 kg, 35 min endurance, thermal and zoom payload" },
     { equipment_name: "Ground control station", category_model: "GCS-2", specifications: "Dual-link radio, live video, telemetry logging" }],
    [{ equipment_name: "eVTOL scale demonstrator", category_model: "Tilt-rotor · SD-3", specifications: "Wingspan 2.4 m, 25 min endurance, BVLOS-capable datalink" }],
    [{ equipment_name: "Cargo quadcopter", category_model: "Multirotor · CQ-12", specifications: "Payload 12 kg, 22 min loaded, parachute recovery" },
     { equipment_name: "Release winch", category_model: "RW-1", specifications: "Rated 15 kg, failsafe release" }],
];
const TM = [
    [{ name: "Aisyah Rahman", role: "Project lead", qualification: "Remote pilot licence RPL-30417" },
     { name: "Hafiz Daud", role: "Pilot in command", qualification: "Remote pilot licence RPL-28831" },
     { name: "Lee Mei Ling", role: "Safety officer", qualification: "Aviation safety diploma" }],
    [{ name: "Dr. Lim Wei Han", role: "Principal investigator", qualification: "PhD Aerospace Engineering" },
     { name: "Siti Nadiah", role: "Flight test engineer", qualification: "BEng Mechatronics" }],
    [{ name: "Farid Hakim", role: "Operations manager", qualification: "Remote pilot licence RPL-31002" }],
];
const DOCS = [
    [{ doc_type: "Operations plan", file_name: "operations-plan-v2.pdf" }, { doc_type: "Insurance certificate", file_name: "insurance-2026.pdf" }, { doc_type: "Risk assessment", file_name: "risk-assessment.pdf" }],
    [{ doc_type: "Research proposal", file_name: "research-proposal.pdf" }, { doc_type: "Equipment datasheet", file_name: "sd3-datasheet.pdf" }],
];

const mk = (i, o) => {
    const e = EQ[i % EQ.length], t = TM[i % TM.length], d = DOCS[i % DOCS.length];
    const submitted_at = daysAgo(o.age);
    return {
        id: i + 1,
        applicant_phone: "+60 12-345 " + String(1000 + i * 37).slice(0, 4),
        organisation_address: "Lot " + (10 + i) + ", Jalan Kangar, 01000 Kangar, Perlis",
        consent_accepted_at: submitted_at,
        review_notes: "",
        reviewed_by: null,
        planned_start: ymd(21 + i * 4),
        planned_end: ymd(23 + i * 4),
        equipment: e.map((x, k) => ({ id: `${i}e${k}`, ...x })),
        team: t.map((x, k) => ({ id: `${i}t${k}`, ...x })),
        documents: d.map((x, k) => ({ id: `${i}d${k}`, url: null, ...x })),
        history: [],
        submitted_at,
        ...o,
    };
};
const REVIEWER = { id: 7, name: "Nadia Karim" };
const hist = (id, from, to, remarks, age, by = REVIEWER.name) => ({ id, from_status: from, to_status: to, remarks, changed_at: daysAgo(age, 14), changed_by: { name: by } });

const makeSample = () => [
    mk(16, { reference_no: "PSB-2026-0017", programme: "First Responder Operations", status: "submitted", age: 0,
        applicant_name: "Aisyah Rahman", applicant_email: "aisyah@example.com", organisation_name: "Rescue-Link Aerial Sdn Bhd", organisation_type: "Industry",
        activity_title: "Thermal search-and-rescue trial over paddy fields",
        activity_description: "Two-day trial of thermal-camera drones locating simulated casualties in open farmland, including hand-over to a ground team over radio." }),
    mk(15, { reference_no: "PSB-2026-0016", programme: "Advanced Air Mobility Operations", status: "under_review", age: 2, reviewed_by: REVIEWER,
        applicant_name: "Dr. Lim Wei Han", applicant_email: "lim.wh@example.com", organisation_name: "Northern Aviation Research Lab", organisation_type: "Research institution",
        activity_title: "Tilt-rotor transition flight characterisation",
        activity_description: "Collect transition-phase data for a 2.4 m tilt-rotor demonstrator within the test flight corridor, BVLOS with a safety observer.",
        history: [hist("h1", "submitted", "under_review", "Starting review. Documents look complete.", 1)] }),
    mk(14, { reference_no: "PSB-2026-0015", programme: "Cargo Logistics Operations", status: "info_requested", age: 4, reviewed_by: REVIEWER,
        applicant_name: "Farid Hakim", applicant_email: "farid@example.com", organisation_name: "Kangar Parcel Drones Sdn Bhd", organisation_type: "Start-up",
        activity_title: "12 kg parcel delivery between two pads",
        activity_description: "Repeated point-to-point cargo flights to measure battery use and landing accuracy with a 12 kg payload.",
        history: [hist("h2", "submitted", "under_review", "", 3), hist("h3", "under_review", "info_requested", "Please attach the parachute recovery test report and the payload release failsafe procedure.", 2)] }),
    mk(13, { reference_no: "PSB-2026-0014", programme: "Supporting technology and system integration", status: "approved", age: 7, reviewed_by: REVIEWER,
        applicant_name: "Nurul Izzah", applicant_email: "nurul@example.com", organisation_name: "SkyLink Telemetry Sdn Bhd", organisation_type: "Industry",
        activity_title: "Long-range telemetry link validation",
        activity_description: "Validate a long-range datalink against the sandbox communication system and record link quality along the corridor.",
        review_notes: "Link frequency cleared with the operations team.",
        history: [hist("h4", "submitted", "under_review", "", 6), hist("h5", "under_review", "approved", "Approved for the first available test window.", 4)] }),
    mk(12, { reference_no: "PSB-2026-0013", programme: "First Responder Operations", status: "executed", age: 15, reviewed_by: REVIEWER,
        applicant_name: "Capt. Zulkifli Omar", applicant_email: "zulkifli@example.com", organisation_name: "Regional Emergency Response Unit", organisation_type: "Government agency",
        activity_title: "Flood-assessment mapping drill",
        activity_description: "Government-led drill using mapping drones to assess a simulated flood area and brief the incident commander.",
        history: [hist("h6", "submitted", "under_review", "", 14), hist("h7", "under_review", "approved", "", 12), hist("h8", "approved", "executed", "Drill completed. Data handed over.", 3)] }),
    mk(11, { reference_no: "PSB-2026-0012", programme: "Cargo Logistics Operations", status: "rejected", age: 20, reviewed_by: REVIEWER,
        applicant_name: "Jason Tan", applicant_email: "jason@example.com", organisation_name: "Greenfield Courier", organisation_type: "Industry",
        activity_title: "Night-time urban-style delivery demo",
        activity_description: "Demonstration of night deliveries with a heavy-lift multirotor.",
        history: [hist("h9", "submitted", "under_review", "", 19), hist("h10", "under_review", "rejected", "Night operations are not offered in the current phase. You are welcome to re-apply for a daytime window.", 17)] }),
    mk(10, { reference_no: "PSB-2026-0011", programme: "Advanced Air Mobility Operations", status: "closed", age: 34, reviewed_by: REVIEWER,
        applicant_name: "Amirul Hakim", applicant_email: "amirul@example.com", organisation_name: "Aero Student Society", organisation_type: "Research institution",
        activity_title: "Student scale-model flight demonstration",
        activity_description: "Supervised demonstration of student-built models for training and showcase.",
        history: [hist("h11", "submitted", "under_review", "", 33), hist("h12", "under_review", "approved", "", 30), hist("h13", "approved", "executed", "", 22), hist("h14", "executed", "closed", "All follow-ups done.", 18)] }),
    mk(9, { reference_no: "PSB-2026-0010", programme: "Supporting technology and system integration", status: "submitted", age: 1,
        applicant_name: "Rohana Yusof", applicant_email: "rohana@example.com", organisation_name: "Paddy Sense Analytics", organisation_type: "Start-up",
        activity_title: "Crop-monitoring sensor payload integration",
        activity_description: "Integrate a multispectral sensor with the sandbox data network and test data hand-off." }),
    mk(8, { reference_no: "PSB-2026-0009", programme: "First Responder Operations", status: "under_review", age: 5, reviewed_by: REVIEWER,
        applicant_name: "Daniel Wong", applicant_email: "daniel@example.com", organisation_name: "Highland Rescue Volunteers", organisation_type: "Government agency",
        activity_title: "Loudspeaker drone communication test",
        activity_description: "Test voice-broadcast payloads for guiding people during a simulated evacuation.",
        history: [hist("h15", "submitted", "under_review", "", 4)] }),
];

/* ---------- small helpers ---------- */
const fmtDate = (v) => (v ? new Date(v).toLocaleDateString("en-MY", { day: "2-digit", month: "short", year: "numeric" }) : "—");
const fmtDateTime = (v) => (v ? new Date(v).toLocaleString("en-MY", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—");
const period = (a, b) => (a && b ? `${fmtDate(a)} – ${fmtDate(b)}` : fmtDate(a || b));
const initials = (n = "") => n.split(/\s+/).filter(Boolean).slice(0, 2).map((s) => s[0]).join("").toUpperCase();
const csvCell = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;

function Icon({ name, size = 18 }) {
    const p = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true };
    const d = {
        search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
        download: <><path d="M12 4v12" /><path d="m7 11 5 5 5-5" /><path d="M5 20h14" /></>,
        close: <path d="M6 6l12 12M18 6 6 18" />,
        mail: <><rect x="3" y="5" width="18" height="14" rx="3" /><path d="m4 7 8 6 8-6" /></>,
        phone: <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" />,
        clip: <path d="m20 11-8.5 8.5a5 5 0 0 1-7-7L13 4a3.5 3.5 0 0 1 5 5l-8.5 8.5a2 2 0 0 1-3-3L14 7" />,
        check: <path d="m5 12 5 5 9-10" />,
        chevL: <path d="m15 6-6 6 6 6" />,
        chevR: <path d="m9 6 6 6-6 6" />,
        inbox: <><path d="M3 13h5l1.5 3h5L16 13h5" /><path d="M5 13 7 5h10l2 8v6H5Z" /></>,
    }[name];
    return <svg {...p}>{d}</svg>;
}

const StatusPill = ({ status }) => <span className={`psba-pill is-${status}`}>{STATUS[status]?.label ?? status}</span>;

/* ---------- detail drawer ---------- */
function Section({ title, children, aside }) {
    return (
        <section className="psba-sec">
            <h3>{title}{aside ? <span>{aside}</span> : null}</h3>
            {children}
        </section>
    );
}
const Fact = ({ label, children, wide }) => (
    <div className={`psba-fact ${wide ? "is-wide" : ""}`}><dt>{label}</dt><dd>{children || "—"}</dd></div>
);

function ReviewPanel({ app, onStatus, onNotes }) {
    const [pending, setPending] = useState(null);
    const [remarks, setRemarks] = useState("");
    const [notify, setNotify] = useState(true);
    const [err, setErr] = useState("");
    const [saving, setSaving] = useState(false);
    const [notes, setNotes] = useState(app.review_notes ?? "");
    const [notesSaving, setNotesSaving] = useState(false);

    const next = TRANSITIONS[app.status] ?? [];
    const begin = (to) => { setPending(to); setRemarks(""); setNotify(NOTIFY_DEFAULT.has(to)); setErr(""); };
    const confirm = () => {
        if (NEEDS_REMARKS.has(pending) && remarks.trim().length < MIN_REMARK) {
            setErr("Write a short message for the applicant."); return;
        }
        setSaving(true); setErr("");
        onStatus(app, pending, remarks.trim(), notify, {
            onDone: () => { setSaving(false); setPending(null); },
            onFail: (m) => { setSaving(false); setErr(m || "Could not update the status."); },
        });
    };

    return (
        <div className="psba-review">
            <div className="psba-now">
                <div><small>Current status</small><StatusPill status={app.status} /></div>
                <p>{STATUS[app.status]?.hint}</p>
            </div>

            {!pending && next.length > 0 && (
                <div className="psba-next">
                    <small>Next step</small>
                    <div>
                        {next.map((to) => (
                            <button key={to} type="button" className={`psba-act is-${to}`} onClick={() => begin(to)}>
                                {ACTION_LABEL(app.status, to)}
                            </button>
                        ))}
                    </div>
                </div>
            )}
            {!pending && next.length === 0 && <p className="psba-final">This application is {STATUS[app.status].label.toLowerCase()}. No further steps.</p>}

            {pending && (
                <div className="psba-confirm">
                    <h4>{ACTION_LABEL(app.status, pending)} <i aria-hidden="true">→</i> <StatusPill status={pending} /></h4>
                    <label>
                        <span>{REMARK_LABEL[pending] || "Remarks (optional)"}</span>
                        <textarea rows={4} value={remarks} onChange={(e) => { setRemarks(e.target.value); if (err) setErr(""); }}
                            placeholder={NEEDS_REMARKS.has(pending) ? "This is sent to the applicant." : "Saved in the history of this application."} />
                    </label>
                    <label className="psba-check">
                        <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} />
                        <i aria-hidden="true" />
                        <span>Email the applicant ({app.applicant_email})</span>
                    </label>
                    {err && <p className="psba-err" role="alert">{err}</p>}
                    <div className="psba-confirm-actions">
                        <button type="button" className="psba-btn" onClick={() => setPending(null)} disabled={saving}>Cancel</button>
                        <button type="button" className="psba-btn is-primary" onClick={confirm} disabled={saving}>
                            {saving ? "Saving…" : "Confirm"}
                        </button>
                    </div>
                </div>
            )}

            <div className="psba-notes">
                <label>
                    <span>Internal review notes <em>(not shown to the applicant)</em></span>
                    <textarea rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Checks made, questions, conditions…" />
                </label>
                <button type="button" className="psba-btn" disabled={notesSaving || notes === (app.review_notes ?? "")}
                    onClick={() => { setNotesSaving(true); onNotes(app, notes, () => setNotesSaving(false)); }}>
                    {notesSaving ? "Saving…" : "Save notes"}
                </button>
            </div>
        </div>
    );
}

function Detail({ app, onClose, onStatus, onNotes }) {
    const [tab, setTab] = useState("details");
    useEffect(() => {
        const onKey = (e) => e.key === "Escape" && onClose();
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [onClose]);

    const history = useMemo(() => {
        const rows = [...(app.history ?? [])].sort((a, b) => new Date(b.changed_at) - new Date(a.changed_at));
        return rows;
    }, [app.history]);

    return (
        <>
            <div className="psba-overlay" onClick={onClose} aria-hidden="true" />
            <aside className="psba-drawer" role="dialog" aria-modal="true" aria-label={`Application ${app.reference_no}`}>
                <header className="psba-dh">
                    <div>
                        <small>{app.reference_no}</small>
                        <h2>{app.activity_title}</h2>
                        <p><StatusPill status={app.status} /> <span>Submitted {fmtDateTime(app.submitted_at)}</span></p>
                    </div>
                    <button type="button" className="psba-x" onClick={onClose} aria-label="Close"><Icon name="close" /></button>
                </header>

                <div className="psba-tabs2" role="tablist">
                    {[["details", "Details"], ["review", "Review"], ["history", `History (${history.length})`]].map(([k, l]) => (
                        <button key={k} type="button" role="tab" aria-selected={tab === k} className={tab === k ? "is-on" : ""} onClick={() => setTab(k)}>{l}</button>
                    ))}
                </div>

                <div className="psba-db">
                    {tab === "details" && (
                        <>
                            <Section title="Applicant / contact person">
                                <dl className="psba-facts">
                                    <Fact label="Name">{app.applicant_name}</Fact>
                                    <Fact label="Email">{app.applicant_email && <a href={`mailto:${app.applicant_email}`}><Icon name="mail" size={14} /> {app.applicant_email}</a>}</Fact>
                                    <Fact label="Phone">{app.applicant_phone && <a href={`tel:${app.applicant_phone.replace(/\s/g, "")}`}><Icon name="phone" size={14} /> {app.applicant_phone}</a>}</Fact>
                                    <Fact label="Programme">{app.programme}</Fact>
                                </dl>
                            </Section>

                            <Section title="Organisation">
                                <dl className="psba-facts">
                                    <Fact label="Name">{app.organisation_name}</Fact>
                                    <Fact label="Type">{app.organisation_type}</Fact>
                                    <Fact label="Address" wide>{app.organisation_address}</Fact>
                                </dl>
                            </Section>

                            <Section title="Proposed operation or testing activity">
                                <dl className="psba-facts">
                                    <Fact label="Planned period" wide>{period(app.planned_start, app.planned_end)}</Fact>
                                    <Fact label="Description" wide>{app.activity_description}</Fact>
                                </dl>
                            </Section>

                            <Section title="Equipment" aside={`${app.equipment?.length ?? 0}`}>
                                {app.equipment?.length ? (
                                    <ul className="psba-list">
                                        {app.equipment.map((e) => (
                                            <li key={e.id}><b>{e.equipment_name}</b><em>{e.category_model}</em><span>{e.specifications}</span></li>
                                        ))}
                                    </ul>
                                ) : <p className="psba-none">No equipment listed.</p>}
                            </Section>

                            <Section title="Team members and qualifications" aside={`${app.team?.length ?? 0}`}>
                                {app.team?.length ? (
                                    <ul className="psba-list">
                                        {app.team.map((m) => (
                                            <li key={m.id}><b>{m.name}</b><em>{m.role}</em><span>{m.qualification}</span></li>
                                        ))}
                                    </ul>
                                ) : <p className="psba-none">No team members listed.</p>}
                            </Section>

                            <Section title="Supporting documents" aside={`${app.documents?.length ?? 0}`}>
                                {app.documents?.length ? (
                                    <ul className="psba-docs">
                                        {app.documents.map((d) => (
                                            <li key={d.id}>
                                                <Icon name="clip" size={16} />
                                                <div><b>{d.doc_type}</b><span>{d.file_name}</span></div>
                                                {d.url ? <a href={d.url} target="_blank" rel="noreferrer">Open</a> : <em>sample</em>}
                                            </li>
                                        ))}
                                    </ul>
                                ) : <p className="psba-none">No documents uploaded.</p>}
                            </Section>

                            <Section title="Terms, consent and declaration">
                                <p className="psba-consent"><Icon name="check" size={16} /> {app.consent_accepted_at ? `Accepted on ${fmtDateTime(app.consent_accepted_at)}` : "Not recorded"}</p>
                            </Section>
                        </>
                    )}

                    {tab === "review" && <ReviewPanel key={app.id} app={app} onStatus={onStatus} onNotes={onNotes} />}

                    {tab === "history" && (
                        <ol className="psba-tl">
                            {history.map((h) => (
                                <li key={h.id}>
                                    <div className="psba-tl-top">
                                        {h.from_status ? <StatusPill status={h.from_status} /> : <em>start</em>}
                                        <i aria-hidden="true">→</i>
                                        <StatusPill status={h.to_status} />
                                    </div>
                                    {h.remarks ? <p>{h.remarks}</p> : null}
                                    <small>{h.changed_by?.name ?? "System"} · {fmtDateTime(h.changed_at)}</small>
                                </li>
                            ))}
                            <li>
                                <div className="psba-tl-top"><StatusPill status="submitted" /></div>
                                <p>Application submitted through Apply to Participate.</p>
                                <small>{app.applicant_name} · {fmtDateTime(app.submitted_at)}</small>
                            </li>
                        </ol>
                    )}
                </div>
            </aside>
        </>
    );
}

/* ---------- page ---------- */
export default function AdminApplication() {
    const { props } = usePage();
    const isSample = !props.applications;
    const me = props.auth?.user?.name ?? "You";
    const base = PSB_ROUTES.applications;

    const [apps, setApps] = useState(() => props.applications ?? makeSample());
    useEffect(() => { if (props.applications) setApps(props.applications); }, [props.applications]);

    const [q, setQ] = useState("");
    const [status, setStatus] = useState("all");
    const [programme, setProgramme] = useState("all");
    const [sort, setSort] = useState("newest");
    const [page, setPage] = useState(1);
    const [openId, setOpenId] = useState(null);
    const [toast, setToast] = useState("");

    useEffect(() => { if (!toast) return undefined; const t = setTimeout(() => setToast(""), 3800); return () => clearTimeout(t); }, [toast]);
    useEffect(() => { setPage(1); }, [q, status, programme, sort]);

    const counts = useMemo(() => {
        const c = Object.fromEntries(STATUS_ORDER.map((s) => [s, 0]));
        apps.forEach((a) => { c[a.status] = (c[a.status] ?? 0) + 1; });
        return c;
    }, [apps]);

    const programmes = useMemo(() => [...new Set(apps.map((a) => a.programme).filter(Boolean))].sort(), [apps]);

    const filtered = useMemo(() => {
        const needle = q.trim().toLowerCase();
        const rows = apps.filter((a) =>
            (status === "all" || a.status === status) &&
            (programme === "all" || a.programme === programme) &&
            (!needle || [a.reference_no, a.applicant_name, a.applicant_email, a.organisation_name, a.activity_title].some((v) => String(v ?? "").toLowerCase().includes(needle)))
        );
        const by = {
            newest: (x, y) => new Date(y.submitted_at) - new Date(x.submitted_at),
            oldest: (x, y) => new Date(x.submitted_at) - new Date(y.submitted_at),
            planned: (x, y) => new Date(x.planned_start || 8.64e15) - new Date(y.planned_start || 8.64e15),
            name: (x, y) => String(x.organisation_name).localeCompare(String(y.organisation_name)),
        }[sort];
        return rows.sort(by);
    }, [apps, q, status, programme, sort]);

    const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const safePage = Math.min(page, pages);
    const rows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
    const selected = apps.find((a) => a.id === openId) || null;

    /* ----- actions ----- */
    const changeStatus = (app, to, remarks, notify, cb = {}) => {
        if (isSample) {
            setApps((list) => list.map((a) => a.id !== app.id ? a : {
                ...a, status: to, reviewed_by: a.reviewed_by ?? { id: 0, name: me },
                history: [...(a.history ?? []), { id: `h${Date.now()}`, from_status: a.status, to_status: to, remarks, changed_at: new Date().toISOString(), changed_by: { name: me } }],
            }));
            setToast(`${app.reference_no} is now “${STATUS[to].label}”${notify ? " and the applicant was emailed" : ""} (sample data).`);
            cb.onDone?.();
            return;
        }
        router.patch(`${base}/${app.id}/status`, { to_status: to, remarks, notify }, {
            preserveScroll: true, preserveState: true,
            onSuccess: () => { setToast(`${app.reference_no} is now “${STATUS[to].label}”.`); cb.onDone?.(); },
            onError: (e) => cb.onFail?.(Object.values(e ?? {})[0]),
        });
    };

    const saveNotes = (app, text, done) => {
        if (isSample) {
            setApps((list) => list.map((a) => (a.id === app.id ? { ...a, review_notes: text } : a)));
            setToast("Review notes saved (sample data)."); done();
            return;
        }
        router.put(`${base}/${app.id}/notes`, { review_notes: text }, {
            preserveScroll: true, preserveState: true,
            onSuccess: () => setToast("Review notes saved."),
            onFinish: done,
        });
    };

    const exportRows = (format) => {
        if (!isSample) {
            const qs = new URLSearchParams({ format, status, programme, q }).toString();
            window.location.href = `${base}/export?${qs}`;
            return;
        }
        if (format === "pdf") { setToast("PDF export is produced by the server. The sample page can export CSV."); return; }
        const head = ["Reference", "Status", "Programme", "Applicant", "Email", "Phone", "Organisation", "Type", "Activity", "Planned start", "Planned end", "Submitted", "Reviewer"];
        const lines = filtered.map((a) => [a.reference_no, STATUS[a.status].label, a.programme, a.applicant_name, a.applicant_email, a.applicant_phone, a.organisation_name, a.organisation_type, a.activity_title, a.planned_start, a.planned_end, a.submitted_at, a.reviewed_by?.name].map(csvCell).join(","));
        const blob = new Blob(["﻿" + [head.map(csvCell).join(","), ...lines].join("\r\n")], { type: "text/csv;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = `psb-applications-${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
        setToast(`Exported ${filtered.length} application${filtered.length === 1 ? "" : "s"} to CSV.`);
    };

    const needsReview = counts.submitted + counts.under_review;
    const cards = [
        { key: "review", label: "Needs review", value: needsReview, sub: `${counts.submitted} new · ${counts.under_review} in review`, on: "submitted", hot: true },
        { key: "info", label: "Waiting for applicant", value: counts.info_requested, sub: "More information requested", on: "info_requested" },
        { key: "approved", label: "Approved", value: counts.approved, sub: "Ready to be carried out", on: "approved" },
        { key: "all", label: "Total received", value: apps.length, sub: `${counts.executed + counts.closed} finished`, on: "all" },
    ];

    return (
        <>
            <Head title="PSB Applications" />
            <section className="psba">
                <header className="psba-header">
                    <div>
                        <h1>Applications</h1>
                        <p>
                            Review Apply to Participate submissions, update their status and request more information.
                            {isSample && <span className="psba-sample">Sample data</span>}
                        </p>
                    </div>
                    <div className="psba-actions">
                        <button type="button" className="psba-btn" onClick={() => exportRows("csv")}><Icon name="download" size={16} /> Export CSV</button>
                        <button type="button" className="psba-btn" onClick={() => exportRows("pdf")}><Icon name="download" size={16} /> Export PDF</button>
                    </div>
                </header>

                <div className="psba-stats">
                    {cards.map((c) => (
                        <button key={c.key} type="button" className={`psba-stat ${c.hot ? "is-hot" : ""}`} onClick={() => setStatus(c.on)}>
                            <small>{c.label}</small>
                            <strong>{c.value}</strong>
                            <span>{c.sub}</span>
                        </button>
                    ))}
                </div>

                <div className="psba-card">
                    <div className="psba-toolbar">
                        <label className="psba-search">
                            <Icon name="search" size={17} />
                            <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search reference, applicant, organisation or activity" aria-label="Search applications" />
                        </label>
                        <label className="psba-select">
                            <span>Programme</span>
                            <select value={programme} onChange={(e) => setProgramme(e.target.value)}>
                                <option value="all">All programmes</option>
                                {programmes.map((p) => <option key={p} value={p}>{p}</option>)}
                            </select>
                        </label>
                        <label className="psba-select">
                            <span>Sort by</span>
                            <select value={sort} onChange={(e) => setSort(e.target.value)}>
                                <option value="newest">Newest first</option>
                                <option value="oldest">Oldest first</option>
                                <option value="planned">Planned start</option>
                                <option value="name">Organisation A–Z</option>
                            </select>
                        </label>
                    </div>

                    <div className="psba-tabs" role="tablist" aria-label="Filter by status">
                        {[["all", "All", apps.length], ...STATUS_ORDER.map((s) => [s, STATUS[s].label, counts[s]])].map(([k, l, n]) => (
                            <button key={k} type="button" role="tab" aria-selected={status === k} className={status === k ? "is-on" : ""} onClick={() => setStatus(k)}>
                                {l}<b>{n}</b>
                            </button>
                        ))}
                    </div>

                    {rows.length === 0 ? (
                        <div className="psba-empty">
                            <Icon name="inbox" size={34} />
                            <h3>No applications found</h3>
                            <p>{apps.length === 0 ? "Submissions from Apply to Participate will arrive here." : "Try another search or clear the filters."}</p>
                            {apps.length > 0 && <button type="button" className="psba-btn" onClick={() => { setQ(""); setStatus("all"); setProgramme("all"); }}>Clear filters</button>}
                        </div>
                    ) : (
                        <div className="psba-tablewrap">
                            <table className="psba-table">
                                <thead>
                                    <tr><th>Reference</th><th>Applicant</th><th>Organisation</th><th>Activity</th><th>Planned period</th><th>Submitted</th><th>Status</th></tr>
                                </thead>
                                <tbody>
                                    {rows.map((a) => (
                                        <tr key={a.id} className={a.status === "submitted" ? "is-new" : ""} onClick={() => setOpenId(a.id)}>
                                            <td data-label="Reference">
                                                <button type="button" className="psba-ref" onClick={(e) => { e.stopPropagation(); setOpenId(a.id); }}>{a.reference_no}</button>
                                                <small>{a.programme}</small>
                                            </td>
                                            <td data-label="Applicant">
                                                <div className="psba-who"><span aria-hidden="true">{initials(a.applicant_name)}</span><div><b>{a.applicant_name}</b><small>{a.applicant_email}</small></div></div>
                                            </td>
                                            <td data-label="Organisation"><b>{a.organisation_name}</b><small>{a.organisation_type}</small></td>
                                            <td data-label="Activity" className="psba-act-title">{a.activity_title}</td>
                                            <td data-label="Planned period">{period(a.planned_start, a.planned_end)}</td>
                                            <td data-label="Submitted">{fmtDate(a.submitted_at)}<small>{a.reviewed_by ? `Reviewer: ${a.reviewed_by.name}` : "Not assigned"}</small></td>
                                            <td data-label="Status"><StatusPill status={a.status} /></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {filtered.length > PAGE_SIZE && (
                        <nav className="psba-pager" aria-label="Pages">
                            <span>Showing {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length}</span>
                            <div>
                                <button type="button" onClick={() => setPage(safePage - 1)} disabled={safePage === 1} aria-label="Previous page"><Icon name="chevL" size={16} /></button>
                                <b>{safePage} / {pages}</b>
                                <button type="button" onClick={() => setPage(safePage + 1)} disabled={safePage === pages} aria-label="Next page"><Icon name="chevR" size={16} /></button>
                            </div>
                        </nav>
                    )}
                </div>

                {selected && <Detail app={selected} onClose={() => setOpenId(null)} onStatus={changeStatus} onNotes={saveNotes} />}
                {toast && <div className="psba-toast" role="status">{toast}</div>}
            </section>
        </>
    );
}

// Inertia persistent layout: sidebar + topbar stay mounted between pages.
// Remove this line if your app already applies the PSB layout somewhere else.
AdminApplication.layout = (page) => <NavigationBar>{page}</NavigationBar>;

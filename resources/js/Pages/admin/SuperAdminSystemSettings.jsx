import { useEffect, useMemo, useRef, useState } from "react";
import { Link, router, usePage } from "@inertiajs/react";
// Same helper file the dashboard uses
import { ROUTES } from "../../Components/Admin-Components/adminRoutes";
import "../../../css/admin-css/admin-system-settings.css";

/* ------------------------------------------------------------------
   SYSTEM SETTINGS  (Super Admin Console → /admin/super/settings)

   Site map: "System settings". Use cases: Manage System Settings, Manage Sites and Status.
   Data maps to the ERD:
     sites          → code, name, base_url, is_active, launch_phase      (Sites & status)
     site_settings  → group, setting_key, setting_value                  (everything else, site_id = NULL for system-wide)
     users          → two_factor_enabled, must_change_password           (Sign-in & security)
     password_resets→ expires_at                                         (reset link lifetime)
     media_assets   → media_type ENUM(image, video, document, audio)     (Content & media)

   SAMPLE DATA: the page works today with the sample below (saving only updates the screen).
   Have your controller return an Inertia prop named `settings` with the same shape and the
   page switches to LIVE mode automatically:

   Inertia::render('admin/SuperAdminSystemSettings', ['settings' => [
       'general'  => [...], 'sites' => [...], 'security' => [...], 'email' => [...], 'content' => [...],
   ]]);

   LIVE mode saves with  PUT  {ROUTES.settings}  and the whole object. Validation errors from
   Laravel are shown under the field, using keys like "security.sessionTimeout".
   Write one audit_logs row (module "settings", action UPDATE, old/new values) in the controller.
------------------------------------------------------------------- */

const ENDPOINTS = {
    save: ROUTES.settings,
    testEmail: `${ROUTES.settings}/test-email`,
};

const defaultSettings = {
    general: {
        systemName: "Admin Content Management System",
        supportEmail: "support@example.my",
        timezone: "Asia/Kuala_Lumpur",
        language: "en",
        dateFormat: "DD/MM/YYYY",
    },
    sites: [
        { code: "PSB", name: "Perlis Airspace Sandbox", baseUrl: "https://psb.example.my", isActive: true, launchPhase: 1, reserved: false },
        { code: "COEUAS", name: "COE-UAS", baseUrl: "https://coeuas.example.my", isActive: true, launchPhase: 1, reserved: false },
        { code: "VERTIPORT", name: "Vertiport Malaysia", baseUrl: "https://vertiport.example.my", isActive: false, launchPhase: 2, reserved: true },
    ],
    security: {
        sessionTimeout: 60, // minutes of inactivity before sign-out
        maxFailedAttempts: 5, // failed sign-ins before an account is suspended
        resetLinkMinutes: 60, // password_resets.expires_at
        minPasswordLength: 12,
        require2fa: false,
        forcePasswordChange: true, // users.must_change_password for new accounts
    },
    email: {
        senderName: "Admin CMS",
        senderEmail: "no-reply@example.my",
        notifyApplications: true, // new PSB participation application
        notifyEnquiries: true, // new contact enquiry
        notifySecurity: true, // repeated failed sign-ins, access denied
        dailyDigest: false,
    },
    content: {
        maxUploadMb: 50,
        allowedTypes: ["image", "video", "document"],
        trashRetentionDays: 0, // 0 = keep in trash until purged by hand
    },
};

/* ------------------------------ options ------------------------------- */

const TIMEZONES = [
    { value: "Asia/Kuala_Lumpur", label: "Kuala Lumpur (GMT+8)" },
    { value: "Asia/Singapore", label: "Singapore (GMT+8)" },
    { value: "Asia/Jakarta", label: "Jakarta (GMT+7)" },
    { value: "UTC", label: "UTC" },
];

const LANGUAGES = [
    { value: "en", label: "English" },
    { value: "ms", label: "Bahasa Melayu" },
];

const DATE_FORMATS = [
    { value: "DD/MM/YYYY", label: "31/10/2026" },
    { value: "DD MMM YYYY", label: "31 Oct 2026" },
    { value: "YYYY-MM-DD", label: "2026-10-31" },
];

const FILE_TYPES = [
    { value: "image", label: "Images" },
    { value: "video", label: "Video" },
    { value: "document", label: "Documents" },
    { value: "audio", label: "Audio" },
];

const SECTIONS = [
    { id: "general", label: "General" },
    { id: "sites", label: "Sites & status" },
    { id: "security", label: "Sign-in & security" },
    { id: "email", label: "Email notifications" },
    { id: "content", label: "Content & media" },
];

/* ------------------------------ helpers ------------------------------- */

function Icon({ name, size = 18 }) {
    const icons = {
        check: <path d="m5 12 5 5 9-10" />,
        close: <path d="M6 6l12 12M18 6 6 18" />,
        alert: (
            <>
                <path d="M12 3 2.5 20h19z" />
                <path d="M12 10v4M12 17.2v.1" />
            </>
        ),
        mail: (
            <>
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path d="m4 7 8 6 8-6" />
            </>
        ),
        lock: (
            <>
                <rect x="5" y="11" width="14" height="9" rx="2" />
                <path d="M8 11V8a4 4 0 0 1 8 0v3" />
            </>
        ),
        external: <path d="M14 4h6v6M20 4l-9 9M18 14v5H5V6h5" />,
    };

    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            {icons[name]}
        </svg>
    );
}

const clone = (value) => JSON.parse(JSON.stringify(value));
const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const isUrl = (v) => /^https?:\/\/[^\s/$.?#][^\s]*$/i.test(v);
const inRange = (v, min, max) => Number.isFinite(Number(v)) && v !== "" && Number(v) >= min && Number(v) <= max;

/* returns { "group.key": "message" } */
function validate(f) {
    const e = {};
    const g = f.general;
    if (!g.systemName.trim()) e["general.systemName"] = "Enter a system name.";
    else if (g.systemName.length > 60) e["general.systemName"] = "Use 60 characters or fewer.";
    if (!isEmail(g.supportEmail)) e["general.supportEmail"] = "Enter a valid email address.";

    f.sites.forEach((s) => {
        if (!isUrl(s.baseUrl)) e[`sites.${s.code}`] = "Enter a full address starting with https://";
    });

    const s = f.security;
    if (!inRange(s.sessionTimeout, 5, 480)) e["security.sessionTimeout"] = "Use 5 to 480 minutes.";
    if (!inRange(s.maxFailedAttempts, 3, 10)) e["security.maxFailedAttempts"] = "Use 3 to 10 attempts.";
    if (!inRange(s.resetLinkMinutes, 10, 1440)) e["security.resetLinkMinutes"] = "Use 10 to 1440 minutes.";
    if (!inRange(s.minPasswordLength, 8, 32)) e["security.minPasswordLength"] = "Use 8 to 32 characters.";

    const m = f.email;
    if (!m.senderName.trim()) e["email.senderName"] = "Enter a sender name.";
    if (!isEmail(m.senderEmail)) e["email.senderEmail"] = "Enter a valid email address.";

    const c = f.content;
    if (!inRange(c.maxUploadMb, 1, 500)) e["content.maxUploadMb"] = "Use 1 to 500 MB.";
    if (!c.allowedTypes.length) e["content.allowedTypes"] = "Allow at least one file type.";
    if (!inRange(c.trashRetentionDays, 0, 365)) e["content.trashRetentionDays"] = "Use 0 to 365 days.";

    return e;
}

/* ------------------------------ pieces ------------------------------- */

function Toggle({ checked, onChange, label, disabled }) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            aria-label={label}
            disabled={disabled}
            className={`set-toggle ${checked ? "is-on" : ""}`}
            onClick={() => onChange(!checked)}
        >
            <span />
        </button>
    );
}

function Row({ label, hint, error, htmlFor, children, wide }) {
    return (
        <div className={`set-row ${wide ? "is-wide" : ""} ${error ? "has-error" : ""}`}>
            <div className="set-row-text">
                <label htmlFor={htmlFor}>{label}</label>
                {hint && <p>{hint}</p>}
            </div>
            <div className="set-row-control">
                {children}
                {error && (
                    <p className="set-error" role="alert">
                        <Icon name="alert" size={13} /> {error}
                    </p>
                )}
            </div>
        </div>
    );
}

function Section({ id, title, text, children, aside }) {
    return (
        <section className="set-card" id={`set-${id}`} data-section={id} aria-labelledby={`set-${id}-title`}>
            <header className="set-card-head">
                <div>
                    <h2 id={`set-${id}-title`}>{title}</h2>
                    <p>{text}</p>
                </div>
                {aside}
            </header>
            <div className="set-card-body">{children}</div>
        </section>
    );
}

function NumberInput({ id, value, onChange, unit, min, max, disabled }) {
    return (
        <span className="set-number">
            <input
                id={id}
                type="number"
                inputMode="numeric"
                min={min}
                max={max}
                value={value}
                disabled={disabled}
                onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
            />
            {unit && <span>{unit}</span>}
        </span>
    );
}

/* ------------------------------- page -------------------------------- */

export default function SuperAdminSystemSettings() {
    const { props } = usePage();
    const live = Boolean(props.settings);

    const [saved, setSaved] = useState(() => clone(live ? props.settings : defaultSettings));
    const [form, setForm] = useState(() => clone(live ? props.settings : defaultSettings));
    const [submitted, setSubmitted] = useState(false);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState(null);
    const [confirmSite, setConfirmSite] = useState(null);
    const [active, setActive] = useState("general");
    const [mailState, setMailState] = useState("idle"); // idle | sending
    const savingRef = useRef(false);

    const dirty = useMemo(() => JSON.stringify(form) !== JSON.stringify(saved), [form, saved]);
    const clientErrors = useMemo(() => (submitted ? validate(form) : {}), [submitted, form]);
    const errors = { ...(props.errors || {}), ...clientErrors };
    const errorCount = Object.keys(clientErrors).length;

    /* toast auto-hide */
    useEffect(() => {
        if (!toast) return undefined;
        const timer = setTimeout(() => setToast(null), 4500);
        return () => clearTimeout(timer);
    }, [toast]);

    /* warn before leaving with unsaved changes */
    useEffect(() => {
        const beforeUnload = (e) => { if (dirty) { e.preventDefault(); e.returnValue = ""; } };
        window.addEventListener("beforeunload", beforeUnload);
        const off = router.on("before", () => {
            if (dirty && !savingRef.current && !window.confirm("You have unsaved changes. Leave this page and discard them?")) return false;
            return undefined;
        });
        return () => { window.removeEventListener("beforeunload", beforeUnload); if (typeof off === "function") off(); };
    }, [dirty]);

    /* highlight the section being read */
    useEffect(() => {
        const nodes = document.querySelectorAll("[data-section]");
        if (!("IntersectionObserver" in window) || !nodes.length) return undefined;
        const observer = new IntersectionObserver(
            (entries) => {
                const seen = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
                if (seen) setActive(seen.target.dataset.section);
            },
            { rootMargin: "-15% 0px -70% 0px" }
        );
        nodes.forEach((n) => observer.observe(n));
        return () => observer.disconnect();
    }, []);

    const setField = (group, key, value) => setForm((f) => ({ ...f, [group]: { ...f[group], [key]: value } }));
    const setSite = (code, patch) => setForm((f) => ({ ...f, sites: f.sites.map((s) => (s.code === code ? { ...s, ...patch } : s)) }));

    const toggleType = (type) => {
        const list = form.content.allowedTypes;
        setField("content", "allowedTypes", list.includes(type) ? list.filter((t) => t !== type) : [...list, type]);
    };

    const goTo = (id) => {
        setActive(id);
        document.getElementById(`set-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    const discard = () => { setForm(clone(saved)); setSubmitted(false); setToast({ tone: "info", text: "Changes discarded." }); };

    const save = () => {
        setSubmitted(true);
        const found = validate(form);
        const keys = Object.keys(found);

        if (keys.length) {
            setToast({ tone: "error", text: `Fix ${keys.length} field${keys.length === 1 ? "" : "s"} before saving.` });
            const first = document.querySelector(".set-row.has-error");
            first?.scrollIntoView({ behavior: "smooth", block: "center" });
            return;
        }

        const done = () => { setSaved(clone(form)); setSubmitted(false); setSaving(false); savingRef.current = false; setToast({ tone: "ok", text: live ? "Settings saved." : "Settings saved (sample data, not stored)." }); };

        setSaving(true);
        savingRef.current = true;

        if (live) {
            router.put(ENDPOINTS.save, form, {
                preserveScroll: true,
                onSuccess: done,
                onError: () => { setSaving(false); savingRef.current = false; setToast({ tone: "error", text: "The server rejected some values. Check the highlighted fields." }); },
            });
        } else {
            setTimeout(done, 400);
        }
    };

    const sendTest = () => {
        if (!isEmail(form.email.senderEmail)) { setSubmitted(true); setToast({ tone: "error", text: "Enter a valid sender email first." }); return; }
        setMailState("sending");
        const finish = (tone, text) => { setMailState("idle"); setToast({ tone, text }); };

        if (live) {
            router.post(ENDPOINTS.testEmail, { to: form.general.supportEmail }, {
                preserveScroll: true,
                onSuccess: () => finish("ok", `Test email sent to ${form.general.supportEmail}.`),
                onError: () => finish("error", "The test email could not be sent. Check the mail settings."),
            });
        } else {
            setTimeout(() => finish("info", "Sample data: no email was sent."), 600);
        }
    };

    const requestSiteToggle = (site, next) => {
        if (!next) setConfirmSite(site); // switching OFF needs a confirmation
        else setSite(site.code, { isActive: true });
    };

    const g = form.general, s = form.security, m = form.email, c = form.content;

    return (
        <div className="admin-settings">
            <div className="set-heading">
                <div>
                    <h1>System Settings</h1>
                    <p>Control how the admin portal behaves for every site: sign-in rules, email, uploads and which workspaces are open.</p>
                </div>
                <div className="set-actions">
                    <button type="button" className="set-btn-dark" onClick={save} disabled={!dirty || saving}>
                        <span className="set-btn-icon"><Icon name="check" size={15} /></span>
                        {saving ? "Saving..." : "Save changes"}
                    </button>
                    <Link href={ROUTES.auditLogs} className="set-btn-outline">View Audit Logs</Link>
                </div>
            </div>

            {!live && (
                <p className="set-note">
                    <Icon name="alert" size={16} />
                    <span>Sample data. You can try every control, but nothing is stored until your controller sends the <b>settings</b> prop.</span>
                </p>
            )}

            <div className="set-layout">
                <nav className="set-nav" aria-label="Settings sections">
                    <ul>
                        {SECTIONS.map((sec) => (
                            <li key={sec.id}>
                                <button type="button" className={active === sec.id ? "is-active" : ""} aria-current={active === sec.id ? "true" : undefined} onClick={() => goTo(sec.id)}>
                                    {sec.label}
                                </button>
                            </li>
                        ))}
                    </ul>
                </nav>

                <div className="set-main">
                    {/* GENERAL */}
                    <Section id="general" title="General" text="Names and defaults shown across the admin portal.">
                        <Row label="System name" hint="Shown in the browser tab and email footers." htmlFor="systemName" error={errors["general.systemName"]}>
                            <input id="systemName" className="set-input" value={g.systemName} maxLength={80} onChange={(e) => setField("general", "systemName", e.target.value)} />
                        </Row>
                        <Row label="Support email" hint="Where administrators are told to send problems." htmlFor="supportEmail" error={errors["general.supportEmail"]}>
                            <input id="supportEmail" type="email" className="set-input" value={g.supportEmail} onChange={(e) => setField("general", "supportEmail", e.target.value)} />
                        </Row>
                        <Row label="Time zone" hint="Used for scheduled publishing and every time shown in the portal." htmlFor="timezone">
                            <select id="timezone" className="set-input" value={g.timezone} onChange={(e) => setField("general", "timezone", e.target.value)}>
                                {TIMEZONES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                            </select>
                        </Row>
                        <Row label="Portal language" hint="Default language of the admin screens." htmlFor="language">
                            <select id="language" className="set-input" value={g.language} onChange={(e) => setField("general", "language", e.target.value)}>
                                {LANGUAGES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                            </select>
                        </Row>
                        <Row label="Date format" htmlFor="dateFormat">
                            <select id="dateFormat" className="set-input" value={g.dateFormat} onChange={(e) => setField("general", "dateFormat", e.target.value)}>
                                {DATE_FORMATS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                            </select>
                        </Row>
                    </Section>

                    {/* SITES */}
                    <Section id="sites" title="Sites & status" text="Turn a workspace on or off and set the public address of each site.">
                        <ul className="set-sites">
                            {form.sites.map((site) => {
                                const key = `sites.${site.code}`;
                                return (
                                    <li key={site.code} className={`set-site ${site.reserved ? "is-reserved" : ""} ${errors[key] ? "has-error" : ""}`}>
                                        <span className={`set-site-logo tone-${site.code.toLowerCase()}`}>{site.code === "COEUAS" ? "CU" : site.code.slice(0, 2)}</span>

                                        <div className="set-site-main">
                                            <div className="set-site-title">
                                                <strong>{site.name}</strong>
                                                <span className={`set-pill ${site.reserved ? "is-reserved" : site.isActive ? "is-live" : "is-off"}`}>
                                                    {site.reserved ? "Reserved, Phase 2" : site.isActive ? "Active" : "Inactive"}
                                                </span>
                                            </div>
                                            <label className="set-site-url">
                                                <span>Public address</span>
                                                <input
                                                    className="set-input"
                                                    value={site.baseUrl}
                                                    disabled={site.reserved}
                                                    onChange={(e) => setSite(site.code, { baseUrl: e.target.value })}
                                                    aria-label={`Public address of ${site.name}`}
                                                />
                                            </label>
                                            {errors[key] && <p className="set-error" role="alert"><Icon name="alert" size={13} /> {errors[key]}</p>}
                                        </div>

                                        <div className="set-site-switch">
                                            {site.reserved ? (
                                                <span className="set-locked"><Icon name="lock" size={14} /> Locked</span>
                                            ) : (
                                                <>
                                                    <Toggle checked={site.isActive} label={`${site.name} active`} onChange={(next) => requestSiteToggle(site, next)} />
                                                    <small>{site.isActive ? "Admins can sign in" : "Sign-in blocked"}</small>
                                                </>
                                            )}
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    </Section>

                    {/* SECURITY */}
                    <Section id="security" title="Sign-in & security" text="Rules that apply to every administrator account.">
                        <Row label="Sign out after inactivity" hint="Idle sessions end automatically." htmlFor="sessionTimeout" error={errors["security.sessionTimeout"]}>
                            <NumberInput id="sessionTimeout" value={s.sessionTimeout} unit="minutes" min={5} max={480} onChange={(v) => setField("security", "sessionTimeout", v)} />
                        </Row>
                        <Row label="Failed sign-ins before suspension" hint="After this many wrong passwords the account is suspended. Failures appear in Security Events." htmlFor="maxFailedAttempts" error={errors["security.maxFailedAttempts"]}>
                            <NumberInput id="maxFailedAttempts" value={s.maxFailedAttempts} unit="attempts" min={3} max={10} onChange={(v) => setField("security", "maxFailedAttempts", v)} />
                        </Row>
                        <Row label="Password reset link lifetime" hint="The emailed link stops working after this time." htmlFor="resetLinkMinutes" error={errors["security.resetLinkMinutes"]}>
                            <NumberInput id="resetLinkMinutes" value={s.resetLinkMinutes} unit="minutes" min={10} max={1440} onChange={(v) => setField("security", "resetLinkMinutes", v)} />
                        </Row>
                        <Row label="Minimum password length" htmlFor="minPasswordLength" error={errors["security.minPasswordLength"]}>
                            <NumberInput id="minPasswordLength" value={s.minPasswordLength} unit="characters" min={8} max={32} onChange={(v) => setField("security", "minPasswordLength", v)} />
                        </Row>
                        <Row label="Require two-factor sign-in" hint="Every administrator must set up a second step at the next sign-in.">
                            <Toggle checked={s.require2fa} label="Require two-factor sign-in" onChange={(v) => setField("security", "require2fa", v)} />
                        </Row>
                        <Row label="New accounts must change password" hint="The first sign-in forces a new password.">
                            <Toggle checked={s.forcePasswordChange} label="Force password change for new accounts" onChange={(v) => setField("security", "forcePasswordChange", v)} />
                        </Row>
                    </Section>

                    {/* EMAIL */}
                    <Section
                        id="email"
                        title="Email notifications"
                        text="Who the system writes as, and which events trigger an email."
                        aside={
                            <button type="button" className="set-btn-small" onClick={sendTest} disabled={mailState === "sending"}>
                                <Icon name="mail" size={13} /> {mailState === "sending" ? "Sending..." : "Send test email"}
                            </button>
                        }
                    >
                        <Row label="Sender name" htmlFor="senderName" error={errors["email.senderName"]}>
                            <input id="senderName" className="set-input" value={m.senderName} onChange={(e) => setField("email", "senderName", e.target.value)} />
                        </Row>
                        <Row label="Sender email" hint="The test email goes to the support email in General." htmlFor="senderEmail" error={errors["email.senderEmail"]}>
                            <input id="senderEmail" type="email" className="set-input" value={m.senderEmail} onChange={(e) => setField("email", "senderEmail", e.target.value)} />
                        </Row>
                        <Row label="New participation application" hint="Tell PSB administrators when someone applies.">
                            <Toggle checked={m.notifyApplications} label="Email on new application" onChange={(v) => setField("email", "notifyApplications", v)} />
                        </Row>
                        <Row label="New contact enquiry" hint="Tell the site administrators about new enquiries.">
                            <Toggle checked={m.notifyEnquiries} label="Email on new enquiry" onChange={(v) => setField("email", "notifyEnquiries", v)} />
                        </Row>
                        <Row label="Security alerts" hint="Tell the Super Admin about repeated failed sign-ins and blocked access.">
                            <Toggle checked={m.notifySecurity} label="Email security alerts" onChange={(v) => setField("email", "notifySecurity", v)} />
                        </Row>
                        <Row label="Daily summary" hint="One email each morning with new items waiting for review.">
                            <Toggle checked={m.dailyDigest} label="Send a daily summary" onChange={(v) => setField("email", "dailyDigest", v)} />
                        </Row>
                    </Section>

                    {/* CONTENT */}
                    <Section id="content" title="Content & media" text="Limits for the media library and the content trash.">
                        <Row label="Largest upload" hint="Per file, in the Media Library." htmlFor="maxUploadMb" error={errors["content.maxUploadMb"]}>
                            <NumberInput id="maxUploadMb" value={c.maxUploadMb} unit="MB" min={1} max={500} onChange={(v) => setField("content", "maxUploadMb", v)} />
                        </Row>
                        <Row label="Allowed file types" hint="Uploads of other types are refused." error={errors["content.allowedTypes"]} wide>
                            <div className="set-chips" role="group" aria-label="Allowed file types">
                                {FILE_TYPES.map((t) => {
                                    const on = c.allowedTypes.includes(t.value);
                                    return (
                                        <button key={t.value} type="button" aria-pressed={on} className={on ? "is-on" : ""} onClick={() => toggleType(t.value)}>
                                            {on && <Icon name="check" size={13} />} {t.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </Row>
                        <Row label="Remove trash automatically after" hint="Use 0 to keep deleted items until the Super Admin purges them." htmlFor="trashRetentionDays" error={errors["content.trashRetentionDays"]}>
                            <NumberInput id="trashRetentionDays" value={c.trashRetentionDays} unit="days" min={0} max={365} onChange={(v) => setField("content", "trashRetentionDays", v)} />
                        </Row>
                        <p className="set-footnote">Need to restore or purge something now? <Link href={ROUTES.trash}>Open Content Trash <Icon name="external" size={12} /></Link></p>
                    </Section>
                </div>
            </div>

            {/* sticky save bar */}
            {dirty && (
                <div className="set-savebar" role="region" aria-label="Unsaved changes">
                    <span className="set-savebar-text">
                        <i /> {errorCount ? `${errorCount} field${errorCount === 1 ? "" : "s"} need attention` : "You have unsaved changes"}
                    </span>
                    <div>
                        <button type="button" className="set-btn-ghost" onClick={discard} disabled={saving}>Discard</button>
                        <button type="button" className="set-btn-yellow" onClick={save} disabled={saving}>{saving ? "Saving..." : "Save changes"}</button>
                    </div>
                </div>
            )}

            {/* confirm switching a site off */}
            {confirmSite && (
                <div className="set-overlay" onMouseDown={(e) => e.target === e.currentTarget && setConfirmSite(null)}>
                    <div className="set-dialog" role="alertdialog" aria-modal="true" aria-labelledby="site-off-title">
                        <span className="set-dialog-icon"><Icon name="alert" size={22} /></span>
                        <h2 id="site-off-title">Turn off {confirmSite.name}?</h2>
                        <p>Administrators of this site will not be able to sign in until it is switched back on. Content is not deleted. The change takes effect when you save.</p>
                        <div className="set-dialog-actions">
                            <button type="button" className="set-btn-outline" onClick={() => setConfirmSite(null)} autoFocus>Keep active</button>
                            <button type="button" className="set-btn-danger" onClick={() => { setSite(confirmSite.code, { isActive: false }); setConfirmSite(null); }}>Turn off</button>
                        </div>
                    </div>
                </div>
            )}

            {toast && (
                <div className={`set-toast is-${toast.tone}`} role="status">
                    <Icon name={toast.tone === "error" ? "alert" : "check"} size={16} />
                    <span>{toast.text}</span>
                    <button type="button" aria-label="Dismiss" onClick={() => setToast(null)}><Icon name="close" size={14} /></button>
                </div>
            )}
        </div>
    );
}

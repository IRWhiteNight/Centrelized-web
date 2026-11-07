/* ==========================================================================
   PSB ROUTE DATA  —  /resources/js/data/PSB-data/PSBRoute.js
   Single source of truth for the PUBLIC Perlis Airspace Sandbox site map
   (from "Perlis Airspace Sandbox Website Structure"). The navbar, footer,
   breadcrumbs and in-page menus should all read from here.

   ADD a sub-page     add one line to that page's `children`
   RENAME a label     change `label`
   HIDE from menus    set  show: false   (the page still works)
   REORDER            move the object up/down
   DELETE             remove the object

   ⚠ KEEP IN SYNC with routes/web.php  ($psbPages array at the top).
     Every child `slug` here must also be listed in web.php for that page.
     Tip: psbWhere('about') prints the exact list to paste into web.php.
========================================================================== */

export const site = {
    name: 'Perlis Airspace Sandbox',
    slogan: 'Innovating today, connecting tomorrow.',
};

/* Prominent header button + quick-access link (sitemap: APPLY / FAQ) */
export const applyButton = { key: 'apply', label: 'Apply to Participate', path: '/apply' };
export const quickLink = { key: 'faq', label: 'FAQ', path: '/faq' };

/* ------------------------------------------------------------------------
   PAGES
   key   = Laravel route name        page = Inertia component (Pages/…)
   slug  = last part of the URL (/about/overview)      show = visible in menus
------------------------------------------------------------------------- */
export const pages = [
    {
        key: 'home', label: 'Home', path: '/', page: 'PSB/Home', show: true, children: [],
    },
    {
        key: 'about', label: 'About the Sandbox', path: '/about', page: 'PSB/About', show: true,
        children: [
            { slug: 'overview', label: 'Overview', desc: 'Definition, purpose, vision and objectives' },
            { slug: 'why-perlis', label: 'Why Perlis, Malaysia?', desc: 'Location advantages and strategic value' },
            { slug: 'governance', label: 'Governance & Management', desc: 'Public governance structure and responsibilities' },
            { slug: 'roadmap', label: 'Development Roadmap', desc: 'Project phases, milestones and current stage' },
            { slug: 'partners', label: 'Partners & Collaborators', desc: 'Supporting agencies, project organisations, industry partners and research collaborators' },
        ],
    },
    {
        key: 'opportunities', label: 'Opportunities', path: '/opportunities', page: 'PSB/Opportunities', show: true,
        children: [
            { slug: 'ways', label: 'Ways to Participate', desc: 'Government-led trials · Industry testing and demonstrations · Research and innovation' },
            { slug: 'testing-areas', label: 'Testing & Innovation Areas', desc: 'First responder · Advanced Air Mobility · Cargo logistics · Technology and system integration' },
            { slug: 'programmes', label: 'Open Programmes & Calls', desc: 'Participation openings, schedules and briefs' },
            { slug: 'how-to-participate', label: 'How to Participate', desc: 'Express interest → Define activity → Review and approval → Execute' },
            { slug: 'benefits', label: 'Participant Benefits', desc: 'Ecosystem access, collaboration, research opportunities and available support' },
        ],
    },
    {
        key: 'services', label: 'Services', path: '/services', page: 'PSB/Services', show: true,
        children: [
            { slug: 'application-regulatory', label: 'Application & Regulatory Facilitation' },
            { slug: 'test-planning', label: 'Test Planning & Operational Support' },
            { slug: 'infrastructure-site', label: 'Infrastructure & Site Support' },
            { slug: 'system-integration', label: 'System Integration Support' },
            { slug: 'safety-risk', label: 'Safety & Risk Management Support' },
            { slug: 'testing-execution', label: 'Testing Execution & Monitoring' },
            { slug: 'data-reporting', label: 'Data Collection & Reporting Support' },
            { slug: 'partner-matching', label: 'Industry Collaboration & Partner Matching' },
            { slug: 'training', label: 'Training & Capability Development' },
            { slug: 'demonstration', label: 'Demonstration & Showcase Support' },
        ],
    },
    {
        key: 'siteinfo', label: 'Site Information', path: '/siteinfo', page: 'PSB/SiteInfo', show: true,
        children: [
            { slug: 'location', label: 'Location & Access', desc: 'Map, address, coordinates and accessibility' },
            { slug: 'facilities', label: 'Facilities & Infrastructure', desc: 'Test areas, landing areas, hangars, ground support and available facilities' },
            { slug: 'airspace', label: 'Airspace & Operational Information', desc: 'Public airspace overview, operating areas, operating hours and general restrictions' },
            { slug: 'weather', label: 'Weather Information', desc: 'Weather summary and official information links' },
            { slug: 'downloads', label: 'Guidelines & Downloads', desc: 'Operational notes, safety guidance, participation documents and public charts' },
        ],
    },
    {
        key: 'media', label: 'Media Centre', path: '/media', page: 'PSB/MediaCentre', show: true,
        children: [
            { slug: 'news', label: 'News & Project Updates' },
            { slug: 'press-releases', label: 'Press Releases' },
            { slug: 'events', label: 'Events & Activities' },
            { slug: 'gallery', label: 'Photo & Video Gallery' },
            { slug: 'articles', label: 'Articles & Social Media' },
        ],
    },
    {
        key: 'contact', label: 'Contact Us', path: '/contact', page: 'PSB/Contact', show: true,
        children: [
            { slug: 'enquiry', label: 'General Enquiry Form' },
            { slug: 'contact-persons', label: 'Programme Contact Persons' },
            { slug: 'details', label: 'Official Email & Telephone' },
            { slug: 'address', label: 'Office Address & Operating Hours' },
        ],
    },
    {
        key: 'faq', label: 'FAQ', path: '/faq', page: 'PSB/FAQ', show: false /* shown as quick link */,
        children: [
            { slug: 'about', label: 'About the sandbox' },
            { slug: 'eligibility', label: 'Eligibility and participation' },
            { slug: 'application', label: 'Application requirements and approvals' },
            { slug: 'costs-timelines', label: 'Costs and timelines' },
            { slug: 'safety-data-ip', label: 'Safety, data and intellectual property' },
        ],
    },
    {
        key: 'apply', label: 'Apply to Participate', path: '/apply', page: 'PSB/Apply', show: false /* shown as header button */,
        children: [
            { slug: 'applicant', label: 'Applicant / contact-person information' },
            { slug: 'organisation', label: 'Organisation information' },
            { slug: 'activity', label: 'Proposed operation or testing activity' },
            { slug: 'equipment', label: 'Equipment information' },
            { slug: 'team', label: 'Team members and qualifications' },
            { slug: 'documents', label: 'Supporting document uploads' },
            { slug: 'declaration', label: 'Terms, consent and declaration' },
            { slug: 'acknowledgement', label: 'Submission acknowledgement' },
        ],
    },
];

/* Pages that exist but are NOT in the sitemap (kept so old links keep working) */
export const legacy = [
    { key: 'about.company', path: '/about/company', page: 'PSB/About/Company' },
    { key: 'innovation', path: '/innovation', page: 'PSB/Innovation' },
];

/* Footer columns: pick pages by key (edit freely) */
export const footerGroups = [
    { title: 'Sandbox', keys: ['about', 'siteinfo', 'media'] },
    { title: 'Participate', keys: ['opportunities', 'services', 'apply'] },
    { title: 'Help', keys: ['faq', 'contact'] },
];

/* ---------- helpers (no need to edit) ---------- */
const byKey = (key) => pages.find((p) => p.key === key);

/** URL of a page, or of one of its sub-pages: href('about') → /about, href('about','roadmap') → /about/roadmap */
export const href = (key, slug) => {
    const p = byKey(key);
    if (!p) return '/';
    return slug ? `${p.path}/${slug}` : p.path;
};

/** Main navigation: visible pages with their dropdown children */
export const mainNav = () =>
    pages.filter((p) => p.show !== false).map((p) => ({
        key: p.key, label: p.label, path: p.path,
        children: (p.children || []).filter((c) => c.show !== false).map((c) => ({ ...c, path: `${p.path}/${c.slug}` })),
    }));

/** Footer columns, ready to render */
export const footerNav = () =>
    footerGroups.map((g) => ({ title: g.title, links: g.keys.map(byKey).filter(Boolean).map((p) => ({ key: p.key, label: p.label, path: p.path })) }));

/** Breadcrumb trail for a URL such as /about/roadmap */
export const breadcrumbs = (url) => {
    const [, first, second] = url.split('?')[0].split('/');
    const crumbs = [{ label: 'Home', path: '/' }];
    const p = pages.find((x) => x.path === `/${first}`);
    if (p && p.key !== 'home') {
        crumbs.push({ label: p.label, path: p.path });
        const c = (p.children || []).find((x) => x.slug === second);
        if (c) crumbs.push({ label: c.label, path: `${p.path}/${c.slug}` });
    }
    return crumbs;
};

/** Is this menu item the current page? (use with usePage().url) */
export const isActive = (url, path) => (path === '/' ? url === '/' : url === path || url.startsWith(`${path}/`));

/** Prints the slug list to paste into web.php, e.g. psbWhere('about') → "overview|why-perlis|…" */
export const psbWhere = (key) => (byKey(key)?.children || []).map((c) => c.slug).join('|');

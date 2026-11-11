// COE-UAS site map: the single source of truth for the public navigation.
//
// Built from "COE-UAS Website Structure" (COEUAS_Site_Map_and_Use_Case.docx)
// and aligned with routes/web.php (public routes) and the admin sections.
//
// HOW ROUTES WORK
//   Every top-level page is ONE route  (/coeuas/about, /coeuas/people ...)
//   and every item below it is a SECTION on that page, reached with an
//   anchor (/coeuas/about#history). The page component must give the
//   matching `id` to the section element: <section id="history">.
//   The main section ids are identical to the admin `{section}` names in
//   routes/web.php, so the public page and its admin editor stay in step:
//
//     about        overview | history | organisation | strategy | awards
//     people       members | profiles | postdoctoral | postgraduate
//     research     groups | projects | grants | innovation | opportunities | featured-programmes
//     publications publications | citations | highlights | archive
//     facilities   equipment | services | solutions | training
//     engagement   linkages | affiliations | news | gallery
//     collaborate  (own route)  research | industry | partnership
//     contact      enquiries | research-enquiry | training-enquiry | details
//
//   Chip ids (the small links under a card) are sub-sections of the main
//   section. If a chip id does not exist on the page, the navbar falls back
//   to a partial id match and finally just opens the page, so nothing breaks.

export const BASE = "/coeuas";

// routes/web.php has /coeuas/home (there is no bare /coeuas route)
export const HOME = `${BASE}/home`;

export const u = (path = "/") => (path === "/" ? BASE : `${BASE}${path}`);

/* =========================================================
   HELPER
   entry(page, id, title, description, chips)
     page   route below /coeuas            ("/about")
     id     section id on that page         ("history") or null = whole page
     chips  [[label, sectionId?], ...]      id defaults to the entry's id
========================================================= */

const entry = (page, id, title, description, chips = []) => {
    const base = u(page);
    const href = (sid) => (sid ? `${base}#${sid}` : base);

    return {
        id,
        title,
        description,
        base,
        href: href(id),
        chips: chips.map(([label, sid]) => ({
            label,
            id: sid || id,
            base,
            href: href(sid || id),
        })),
    };
};

/* =========================================================
   MAIN NAVIGATION  (Home is added by the navbar itself)
========================================================= */

export const MAIN_NAV = [
    /* ---------------------------------------------------- ABOUT */
    {
        key: "about",
        label: "About",
        href: u("/about"),
        eyebrow: "The centre",
        title: "A centre built around unmanned flight.",
        description: "Our story, leadership, strategy and milestones.",
        entries: [
            entry("/about", "overview", "About COE-UAS", "Background, vision, mission and objectives.", [
                ["Background", "background"],
                ["Vision & mission", "vision-mission"],
                ["Strategic direction", "direction"],
            ]),
            entry("/about", "history", "History & Milestones", "From early origins to the 2013–2026 timeline.", [
                ["Origins", "origins"],
                ["Timeline 2013–2026", "timeline"],
                ["Major achievements", "achievements"],
            ]),
            entry("/about", "organisation", "Organisation & Leadership", "Structure, management and research groups.", [
                ["Organisation chart", "org-chart"],
                ["Leadership", "leadership"],
                ["Research groups", "research-groups"],
                ["Previous structures", "previous-structures"],
            ]),
            entry("/about", "strategy", "Strategy & Development", "Where the centre is heading next.", [
                ["Research & development", "strategy-rd"],
                ["Industry", "strategy-industry"],
                ["Training", "strategy-training"],
                ["Future plans", "strategy-future"],
            ]),
            entry("/about", "awards", "Awards & Recognition", "Awards, accreditations and certifications.", [
                ["Centre awards", "centre-awards"],
                ["Accreditations", "accreditations"],
                ["Member awards", "member-awards"],
            ]),
        ],
    },

    /* ---------------------------------------------------- PEOPLE */
    {
        key: "people",
        label: "People",
        href: u("/people"),
        eyebrow: "Our people",
        title: "Meet the minds behind the mission.",
        description: "Researchers, fellows, advisors and students.",
        entries: [
            entry("/people", "members", "Member Directory", "Browse every member by category.", [
                ["Leadership", "leadership"],
                ["Research fellows", "research-fellows"],
                ["Visiting fellows", "visiting-fellows"],
                ["Industry advisory", "industry-advisory"],
                ["Advisors & support", "advisors-support"],
            ]),
            entry("/people", "postdoctoral", "Postdoctoral Researchers", "Current and former postdoctoral researchers.", [
                ["Current", "postdoc-current"],
                ["Former", "postdoc-former"],
            ]),
            entry("/people", "postgraduate", "Postgraduate Students", "Research students and graduates.", [
                ["PhD", "pg-phd"],
                ["Master's", "pg-masters"],
                ["Alumni", "pg-alumni"],
            ]),
            entry("/people", "profiles", "Member Profiles", "A full portfolio for each member, from biography to networks."),
        ],
        foot: {
            label: "Inside a member profile",
            cta: "See a profile",
            to: entry("/people", "profiles", "Member Profiles", ""),
            steps: ["Overview", "Grants & awards", "Publications", "Networks"],
        },
    },

    /* ---------------------------------------------------- RESEARCH */
    {
        key: "research",
        label: "Research",
        fullLabel: "Research & Innovation",
        href: u("/research"),
        eyebrow: "Research & innovation",
        title: "Ideas engineered for the real world.",
        description: "Research groups, projects, grants and technology.",
        entries: [
            entry("/research", "groups", "Research Areas & Groups", "Expertise, teams and research directions."),
            entry("/research", "projects", "Research Projects", "Ongoing, completed, joint and industry work.", [
                ["Ongoing", "projects-ongoing"],
                ["Completed", "projects-completed"],
                ["Joint", "projects-joint"],
                ["Industry", "projects-industry"],
            ]),
            entry("/research", "grants", "Research Grants", "Funders, teams, duration, status and outputs."),
            entry("/research", "innovation", "Innovation & IP", "Prototypes, patents and technology transfer.", [
                ["Prototypes", "prototypes"],
                ["Patents & designs", "patents"],
                ["Technology transfer", "technology-transfer"],
            ]),
            entry("/research", "opportunities", "Research Opportunities", "Topics, industry challenges and places.", [
                ["Research topics", "research-topics"],
                ["Industry challenges", "industry-challenges"],
                ["Postgraduate & postdoc", "postgraduate-places"],
            ]),
            entry("/research", "featured-programmes", "Featured Programmes", "Major initiatives led by the centre.", [
                ["Perlis Airspace Sandbox", "perlis-airspace-sandbox"],
                ["Other initiatives", "other-initiatives"],
            ]),
        ],
    },

    /* ---------------------------------------------------- PUBLICATIONS */
    {
        key: "publications",
        label: "Publications",
        fullLabel: "Publications & Impact",
        href: u("/publications"),
        eyebrow: "Knowledge & impact",
        title: "Research that moves knowledge forward.",
        description: "Publications, citations and the 2013–2026 archive.",
        entries: [
            entry("/publications", "publications", "Publications", "Everything the centre has published.", [
                ["Journal articles", "journal-articles"],
                ["Conference papers", "conference-papers"],
                ["Books & chapters", "books-chapters"],
                ["Other", "other-publications"],
            ]),
            entry("/publications", "citations", "Citations & Research Impact", "Centre indicators and member citation profiles.", [
                ["Centre indicators", "citation-indicators"],
                ["Member profiles", "citation-members"],
            ]),
            entry("/publications", "highlights", "Annual Research Highlights", "Outputs and achievements, year by year."),
            entry("/publications", "archive", "Research Archive", "Search 2013–2026 by year, member, group or status.", [
                ["By year"],
                ["By member"],
                ["By group"],
                ["By status"],
            ]),
        ],
    },

    /* ---------------------------------------------------- FACILITIES */
    {
        key: "facilities",
        label: "Facilities",
        fullLabel: "Facilities & Services",
        href: u("/facilities"),
        eyebrow: "Capabilities",
        title: "Built to test. Ready to collaborate.",
        description: "Facilities, technical services, solutions and training.",
        entries: [
            entry("/facilities", "equipment", "Facilities & Equipment", "Labs, aircraft, platforms and test sites.", [
                ["Laboratories", "laboratories"],
                ["Aircraft & platforms", "platforms"],
                ["Test sites", "test-sites"],
            ]),
            entry("/facilities", "services", "Engineering & Technical Services", "Design, integration, testing and operations.", [
                ["Design & build", "svc-design"],
                ["Integration & testing", "svc-integration"],
                ["Maintenance", "svc-maintenance"],
                ["Aerial operations", "svc-operations"],
            ]),
            entry("/facilities", "solutions", "Industry Solutions & Case Studies", "Mapping, inspection, security, cargo and more.", [
                ["Survey & mapping", "survey-mapping"],
                ["Inspection", "inspection"],
                ["Security", "security"],
                ["Cargo", "cargo"],
                ["Agriculture", "agriculture"],
                ["AI & vision", "ai-vision"],
            ]),
            entry("/facilities", "training", "Training & Professional Development", "Courses, industry programmes and outreach.", [
                ["Drone courses", "drone-courses"],
                ["Industry & agency", "industry-courses"],
                ["Outreach", "outreach"],
                ["Calendar", "training-calendar"],
            ]),
        ],
    },

    /* ---------------------------------------------------- ENGAGEMENT */
    {
        key: "engagement",
        label: "Engagement",
        href: u("/engagement"),
        eyebrow: "Connect & collaborate",
        title: "A stronger ecosystem, together.",
        description: "Partners, activities, media and collaboration.",
        entries: [
            entry("/engagement", "linkages", "Networking & Linkages", "University, government, industry and global partners.", [
                ["Universities", "link-universities"],
                ["Government", "link-government"],
                ["Industry", "link-industry"],
                ["International", "link-international"],
            ]),
            entry("/engagement", "affiliations", "Membership & Affiliations", "Institutional and professional affiliations."),
            entry("/engagement", "news", "News & Activities", "Updates, visits, talks and demonstrations.", [
                ["Project updates", "news-updates"],
                ["Visits", "news-visits"],
                ["Conferences & talks", "news-conferences"],
                ["Exhibitions", "news-exhibitions"],
            ]),
            entry("/engagement", "gallery", "Media Gallery", "Photos, video, press coverage and brochures.", [
                ["Photos & video", "gallery"],
                ["Press coverage", "press-coverage"],
                ["Brochures", "documents"],
            ]),
            // its own route: /coeuas/collaborate
            entry("/collaborate", null, "Collaborate with Us", "Start a research, industry or partnership project.", [
                ["Research", "research"],
                ["Industry", "industry"],
                ["Partnership", "partnership"],
            ]),
        ],
    },
];

/* =========================================================
   CONTACT  (always-visible header button; also in the mobile drawer)
========================================================= */

export const CONTACT_PAGE = {
    key: "contact",
    label: "Contact",
    href: u("/contact"),
    entries: [
        entry("/contact", "enquiries", "General enquiry", "Questions about the centre."),
        entry("/contact", "research-enquiry", "Research & collaboration", "Projects, partnerships and postgraduate places."),
        entry("/contact", "training-enquiry", "Training & services", "Courses, calendar and technical services."),
        entry("/contact", "details", "Contact details & location", "Email, telephone, address and office hours."),
    ],
};

export const CONTACT_LINK = { label: "Contact us", href: CONTACT_PAGE.href };
export const COLLABORATE_LINK = { label: "Collaborate", href: u("/collaborate") };

/* =========================================================
   RELATED PROGRAMMES  (dropdown beside the logo)
========================================================= */

export const RELATED = [
    {
        name: "Perlis Airspace Sandbox",
        href: "/",
        internal: true, // same app, another site: use an Inertia visit
        logo: "sandbox",
    },
    {
        name: "Vertiport Malaysia",
        href: "https://example.com/vertiport", // TODO: real URL
        internal: false,
        logo: "vertiport",
    },
];

/* =========================================================
   REFERENCE STRUCTURES FOR THE PAGES AND ADMIN
   (not shown in the navbar; kept here so there is one site map)
========================================================= */

// Home page sections, in order
export const HOME_SECTIONS = [
    "banner",
    "research-focus",
    "featured",
    "members",
    "highlights",
    "news",
    "partners",
    "cta",
];

// Tabs of one member profile (People > Member Directory > Member > Profile)
export const MEMBER_PROFILE_TABS = [
    "overview",
    "postgraduate-students",
    "research-grants",
    "awards",
    "journal-articles",
    "conference-papers",
    "citations",
    "books-and-other",
    "postdoctoral-research",
    "membership-roles",
    "innovation",
    "joint-research",
    "networking",
];

// Filters of the research archive (2013–2026)
export const ARCHIVE_FILTERS = {
    year: { from: 2013, to: 2026 },
    by: ["member", "research-group", "category", "status"],
    status: ["ongoing", "completed", "proposed"],
};

// Flat list of every route + section, handy for a footer or /sitemap page
export const SITEMAP_INDEX = [
    { label: "Home", href: HOME },
    ...MAIN_NAV.map((p) => ({
        label: p.fullLabel || p.label,
        href: p.href,
        children: p.entries.map((e) => ({ label: e.title, href: e.href })),
    })),
    {
        label: CONTACT_PAGE.label,
        href: CONTACT_PAGE.href,
        children: CONTACT_PAGE.entries.map((e) => ({ label: e.title, href: e.href })),
    },
];


// COE-UAS public navigation.
// Keep route names aligned with routes/COEUASweb.php.

export const BASE = "/coeuas";

export const u = (path = "/") =>
    path === "/" ? BASE : `${BASE}${path}`;

/* =========================================================
   NAVIGATION ENTRY HELPER
========================================================= */

const entry = (
    path,
    title,
    description,
    links = []
) => ({
    title,
    description,
    href: u(path),

    links: links.map(([label, childPath]) => ({
        label,
        href: u(childPath),
    })),
});

/* =========================================================
   MAIN NAVIGATION
========================================================= */

export const MAIN_NAV = [

    /* =====================================================
       ABOUT
    ===================================================== */

    {
        key: "about",
        label: "About",
        href: u("/about"),

        eyebrow: "THE CENTRE",
        title: "Discover COE-UAS",
        description:
            "Our story, leadership, strategy and milestones.",

        entries: [
            entry(
                "/about",
                "About COE-UAS",
                "Background, vision, mission and objectives."
            ),

            entry(
                "/about/history",
                "History & Milestones",
                "From our origins to the next chapter."
            ),

            entry(
                "/about/organisation",
                "Organisation & Leadership",
                "Leadership, management and research groups."
            ),

            entry(
                "/about/strategy",
                "Strategy & Development",
                "Research, industry, training and future plans."
            ),

            entry(
                "/about/awards",
                "Awards & Recognition",
                "Awards, accreditations and certifications."
            ),
        ],
    },

    /* =====================================================
       PEOPLE
    ===================================================== */

    {
        key: "people",
        label: "People",
        href: u("/people"),

        eyebrow: "OUR PEOPLE",
        title: "Meet the minds behind the mission",
        description:
            "Find researchers, fellows, advisors and students.",

        entries: [
            entry(
                "/people",
                "Member Directory",
                "Browse members by category."
            ),

            entry(
                "/people/postdoctoral",
                "Postdoctoral Researchers",
                "Current and former postdoctoral researchers."
            ),

            entry(
                "/people/postgraduates",
                "Postgraduate Students",
                "PhD, Master's students and alumni."
            ),
        ],
    },

    /* =====================================================
       RESEARCH
    ===================================================== */

    {
        key: "research",
        label: "Research",
        fullLabel: "Research & Innovation",
        href: u("/research"),

        eyebrow: "RESEARCH & INNOVATION",
        title: "Ideas engineered for the real world",
        description:
            "Explore research groups, projects, grants and technology.",

        entries: [
            entry(
                "/research",
                "Research Areas & Groups",
                "Expertise, teams and research directions."
            ),

            entry(
                "/research/projects",
                "Research Projects",
                "Ongoing, completed, joint and industry projects."
            ),

            entry(
                "/research/grants",
                "Research Grants",
                "Funding, project teams and research outputs."
            ),

            entry(
                "/research/innovation",
                "Innovation & IP",
                "Prototypes, patents and technology transfer."
            ),

            entry(
                "/research/opportunities",
                "Research Opportunities",
                "Topics, industry challenges and postgraduate places."
            ),

            entry(
                "/research/programmes",
                "Featured Programmes",
                "Perlis Airspace Sandbox and major initiatives."
            ),
        ],
    },

    /* =====================================================
       PUBLICATIONS
    ===================================================== */

    {
        key: "publications",
        label: "Publications",
        fullLabel: "Publications & Impact",
        href: u("/publications"),

        eyebrow: "KNOWLEDGE & IMPACT",
        title: "Research that moves knowledge forward",
        description:
            "Browse publications, citations and annual highlights.",

        entries: [
            entry(
                "/publications",
                "Journal Articles",
                "Peer-reviewed research papers."
            ),

            entry(
                "/publications/conferences",
                "Conference Proceedings",
                "Conference papers and proceedings."
            ),

            entry(
                "/publications/books",
                "Books & Chapters",
                "Books, chapters and reports."
            ),

            entry(
                "/publications/other",
                "Other Publications",
                "Technical publications and other works."
            ),

            entry(
                "/publications/citations",
                "Citations & Research Impact",
                "Research indicators and citation profiles."
            ),

            entry(
                "/publications/highlights",
                "Annual Research Highlights",
                "Research outputs by year."
            ),
        ],
    },

    /* =====================================================
       FACILITIES
    ===================================================== */

    {
        key: "facilities",
        label: "Facilities",
        fullLabel: "Facilities & Services",
        href: u("/facilities"),

        eyebrow: "CAPABILITIES",
        title: "Built to test. Ready to collaborate.",
        description:
            "Discover facilities, technical services and training.",

        entries: [
            entry(
                "/facilities",
                "Facilities & Equipment",
                "Labs, aircraft, platforms and test sites."
            ),

            entry(
                "/facilities/services",
                "Engineering & Technical Services",
                "Design, integration, testing and operations."
            ),

            entry(
                "/facilities/solutions",
                "Industry Solutions",
                "Mapping, agriculture, security, cargo and more.",
                [
                    [
                        "Survey & mapping",
                        "/facilities/solutions#survey-and-mapping",
                    ],
                    [
                        "Agriculture",
                        "/facilities/solutions#agriculture",
                    ],
                    [
                        "Security",
                        "/facilities/solutions#security",
                    ],
                    [
                        "Cargo",
                        "/facilities/solutions#cargo",
                    ],
                ]
            ),

            entry(
                "/facilities/training",
                "Training & Professional Development",
                "Courses, industry programmes and outreach.",
                [
                    [
                        "Drone courses",
                        "/facilities/training#drone-courses",
                    ],
                    [
                        "Industry courses",
                        "/facilities/training#industry-and-agency-courses",
                    ],
                    [
                        "Outreach",
                        "/facilities/training#outreach",
                    ],
                ]
            ),
        ],
    },

    /* =====================================================
       ENGAGEMENT
    ===================================================== */

    {
        key: "engagement",
        label: "Engagement",
        href: u("/engagement"),

        eyebrow: "CONNECT & COLLABORATE",
        title: "A stronger ecosystem, together",
        description:
            "Partners, activities, media and collaboration.",

        entries: [
            entry(
                "/engagement",
                "Networking & Linkages",
                "University, government, industry and global partners."
            ),

            entry(
                "/engagement/membership",
                "Membership & Affiliations",
                "Institutional and professional affiliations."
            ),

            entry(
                "/engagement/news",
                "News & Activities",
                "Updates, visits, conferences and demonstrations."
            ),

            entry(
                "/engagement/media",
                "Media Gallery",
                "Photos, video and press coverage."
            ),

            entry(
                "/engagement/collaborate",
                "Collaborate with Us",
                "Start a research, training or industry project."
            ),
        ],
    },
];

/* =========================================================
   HEADER CTA LINKS
========================================================= */

export const CONTACT_LINK = {
    label: "Contact",
    href: u("/contact"),
};

export const COLLABORATE_LINK = {
    label: "Collaborate",
    href: u("/engagement/collaborate"),
};

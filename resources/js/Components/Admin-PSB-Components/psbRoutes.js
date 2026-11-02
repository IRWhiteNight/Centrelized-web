// PSB (Perlis Airspace Sandbox) admin workspace: routes + sidebar menu.
// Structure follows "1.2 PSB Admin Workspace (/admin/psb)" in the Admin CMS design document.

export const PSB_BASE = "/admin/psb";
const p = (path = "") => `${PSB_BASE}${path}`;

// Shared, non-PSB URLs. Point these at the same routes your AdminTopbar uses (ROUTES.logout etc.).
export const SHARED = {
    logout: "/admin/logout",
    console: "/admin/super",
    workspaces: "/admin/super/workspaces",
    coeuas: "/admin/coeuas",
};

export const PSB_ROUTES = {
    dashboard: p(),
    account: p("/account"),
    activity: p("/account/activity"),
    applications: p("/applications"),
    enquiries: p("/contact/enquiries"),
};

// badge: key inside props.psb.counts (e.g. { applications: 3, enquiries: 2, drafts: 5 })
export const PSB_NAV = [
    {
        section: "Overview",
        items: [{ key: "dashboard", label: "Dashboard", icon: "dashboard", href: p(), exact: true }],
    },
    {
        section: "Website content",
        items: [
            {
                key: "home",
                label: "Home Page",
                icon: "home",
                // Clicking "Home Page" opens its dropdown AND goes to this URL (/admin/psb/home).
                // Add `href` to any other group to give it the same behaviour.
                href: p("/home"),
                children: [
                    { label: "Main banner and slogan", href: p("/home/banner") },
                    { label: "What is the sandbox? / Why it matters", href: p("/home/introduction") },
                    { label: "Who should participate?", href: p("/home/participants") },
                    { label: "Featured programmes", href: p("/home/featured-programmes") },
                    { label: "Latest news and upcoming events", href: p("/home/news-events") },
                    { label: "Partners preview and CTA buttons", href: p("/home/partners-cta") },
                ],
            },
            {
                key: "about",
                label: "About the Sandbox",
                icon: "about",
                href: p("/about"),
                children: [
                    { label: "Overview", href: p("/about/overview") },
                    { label: "Why Perlis, Malaysia?", href: p("/about/why-perlis") },
                    { label: "Governance and Management", href: p("/about/governance") },
                    { label: "Development Roadmap", href: p("/about/roadmap") },
                    { label: "Partners and Collaborators", href: p("/about/partners") },
                ],
            },
            {
                key: "opportunities",
                label: "Opportunities",
                icon: "target",
                href: p("/opportunities"),
                children: [
                    { label: "Ways to Participate", href: p("/opportunities/ways") },
                    { label: "Testing and Innovation Areas", href: p("/opportunities/testing-areas") },
                    { label: "Open Programmes and Calls", href: p("/opportunities/programmes") },
                    { label: "How to Participate", href: p("/opportunities/how-to-participate") },
                    { label: "Participant Benefits", href: p("/opportunities/benefits") },
                ],
            },
            { key: "services", label: "Services", icon: "layers", href: p("/services") },
            {
                key: "site-information",
                label: "Site Information",
                icon: "pin",
                children: [
                    { label: "Location and Access", href: p("/site-information/location") },
                    { label: "Facilities and Infrastructure", href: p("/site-information/facilities") },
                    { label: "Airspace and Operational Info", href: p("/site-information/airspace") },
                    { label: "Weather Information and links", href: p("/site-information/weather") },
                    { label: "Guidelines and Downloads", href: p("/site-information/downloads") },
                ],
            },
            {
                key: "media-centre",
                label: "Media Centre",
                icon: "image",
                children: [
                    { label: "News and Project Updates", href: p("/media-centre/news") },
                    { label: "Press Releases", href: p("/media-centre/press-releases") },
                    { label: "Events and Activities", href: p("/media-centre/events") },
                    { label: "Photo and Video Gallery", href: p("/media-centre/gallery") },
                    { label: "Articles and Social Media", href: p("/media-centre/articles") },
                ],
            },
            {
                key: "faq",
                label: "FAQ",
                icon: "help",
                children: [
                    { label: "FAQ categories", href: p("/faq/categories") },
                    { label: "Questions and answers", href: p("/faq/questions") },
                ],
            },
        ],
    },
    {
        section: "Engagement",
        items: [
            {
                key: "contact",
                label: "Contact and Enquiries",
                icon: "mail",
                badge: "enquiries",
                children: [
                    { label: "Programme contact persons", href: p("/contact/persons") },
                    { label: "Email, phone, address, hours", href: p("/contact/details") },
                    { label: "General enquiry inbox", href: p("/contact/enquiries"), badge: "enquiries" },
                ],
            },
            { key: "applications", label: "Applications", icon: "file", href: p("/applications"), badge: "applications" },
            { key: "subscribers", label: "Subscribers", icon: "users", href: p("/subscribers") },
        ],
    },
    {
        section: "Manage",
        items: [
            { key: "media-library", label: "Media Library", icon: "folder", href: p("/media-library") },
            {
                key: "settings",
                label: "Navigation and Settings",
                icon: "sliders",
                children: [
                    { label: "Header menu and Apply button", href: p("/settings/navigation") },
                    { label: "Footer and social links", href: p("/settings/footer") },
                    { label: "Logo, SEO defaults, contact email", href: p("/settings/branding") },
                ],
            },
            {
                key: "account",
                label: "My Account",
                icon: "user",
                children: [
                    { label: "Profile and password", href: p("/account") },
                    { label: "My activity log", href: p("/account/activity") },
                ],
            },
        ],
    },
];

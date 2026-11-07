// COE-UAS admin workspace: routes and menu.
//
// Sources (Admin CMS design document, v1.0, 31 Oct 2026):
//   - Site map 1.3  "COE-UAS Admin Workspace (/admin/coeuas)", page 4  -> menu structure and labels
//   - Use case 2.3  "COE-UAS Admin Site", page 7                       -> features, Super Admin only band
//   - Site map 1.1, page 2                                             -> 13 modules in this workspace
//
// Labels below are the exact wording of the site map. Paths are suggestions that
// follow /admin/coeuas; change a path in this one file and the sidebar, the topbar
// search and the notifications all follow.

const BASE = "/admin/coeuas";
const r = (path = "") => `${BASE}${path}`;

export const COEUAS_BASE = BASE;

/* ------------------------------------------------------------------ */
/* ROUTES used outside the sidebar (topbar, notifications, dropdown)   */
/* ------------------------------------------------------------------ */
export const COEUAS_ROUTES = {
    dashboard: r(),
    enquiries: r("/contact/enquiries"),
    account: r("/account"),
    activity: r("/activity"),
};

/* ------------------------------------------------------------------ */
/* ROUTES that live in other workspaces                                */
/* ------------------------------------------------------------------ */
export const SHARED = {
    console: "/admin/super", // Super Admin Console
    psb: "/admin/psb", // PSB workspace
    workspaces: "/admin/super/workspaces",
    users: "/admin/super/users",
    auditLogs: "/admin/super/audit-logs",
    trash: "/admin/super/content-trash",
    logout: "/logout",
};

/* ------------------------------------------------------------------ */
/* SIDEBAR MENU                                                        */
/*                                                                     */
/* group : { section, items[] }                                        */
/* item  : { key, label, icon, href | children[], exact?, badge?, hint? }*/
/* child : { label, href, badge?, hint? }                              */
/*                                                                     */
/* badge = key in props.coeuas.counts ("enquiries", "drafts", ...)     */
/* hint  = wording from the site map / use cases; shown as a tooltip   */
/*         and searchable from the topbar search                       */
/* ------------------------------------------------------------------ */
export const COEUAS_NAV = [
    {
        section: "Overview",
        items: [
            {
                key: "dashboard",
                label: "Dashboard",
                icon: "dashboard",
                href: COEUAS_ROUTES.dashboard,
                exact: true,
                hint: "Content counts, drafts, scheduled items, new enquiries, my recent activity",
            },
        ],
    },

    {
        section: "Website content",
        items: [
            {
                key: "home",
                label: "Home Page",
                icon: "home",
                href: r("/home/banner"), // clicking "Home Page" opens this page and the dropdown
                children: [
                    { label: "Main banner and introduction", href: r("/home/banner") },
                    { label: "Research focus and capabilities", href: r("/home/research-focus") },
                    { label: "Featured research and members", href: r("/home/featured"), hint: "Pin; feature members on Home" },
                    { label: "Highlights, achievements and partners", href: r("/home/highlights") },
                    { label: "Latest news and activities", href: r("/home/news"), hint: "Pin" },
                ],
            },
            {
                key: "about",
                label: "About",
                icon: "about",
                href: r("/about/overview"),
                children: [
                    { label: "About COE-UAS", href: r("/about/overview"), hint: "Background, vision, mission" },
                    { label: "History and Milestones", href: r("/about/history"), hint: "2013 - 2026" },
                    { label: "Organisation and Leadership", href: r("/about/organisation"), hint: "Org chart" },
                    { label: "Strategy and Development", href: r("/about/strategy") },
                    { label: "Awards and Recognition", href: r("/about/awards") },
                ],
            },
            {
                key: "people",
                label: "People",
                icon: "users",
                href: r("/people/members"),
                children: [
                    { label: "Member categories and directory", href: r("/people/members") },
                    { label: "Member profile", href: r("/people/profiles"), hint: "13 sections" },
                    { label: "Postdoctoral researchers", href: r("/people/postdoctoral") },
                    { label: "Postgraduate students and supervision", href: r("/people/postgraduate") },
                ],
            },
        ],
    },

    {
        section: "Research and impact",
        items: [
            {
                key: "research",
                label: "Research and Innovation",
                icon: "flask",
                href: r("/research/groups"),
                children: [
                    { label: "Research areas and groups", href: r("/research/groups") },
                    { label: "Research projects", href: r("/research/projects") },
                    { label: "Research grants", href: r("/research/grants") },
                    { label: "Innovation and IP", href: r("/research/innovation") },
                    { label: "Research opportunities", href: r("/research/opportunities") },
                    { label: "Featured programmes", href: r("/research/featured-programmes"), hint: "For example Perlis Airspace Sandbox" },
                ],
            },
            {
                key: "publications",
                label: "Publications and Impact",
                icon: "book",
                href: r("/publications"),
                children: [
                    { label: "Publications", href: r("/publications"), hint: "Journal, conference, book, other" },
                    { label: "Author-to-member linking", href: r("/publications/authors") },
                    { label: "Bulk import", href: r("/publications/import"), hint: "CSV / BibTeX" },
                    { label: "Citations and research impact", href: r("/publications/citations") },
                    { label: "Annual research highlights", href: r("/publications/highlights") },
                ],
            },
        ],
    },

    {
        section: "Facilities and engagement",
        items: [
            {
                key: "facilities",
                label: "Facilities and Services",
                icon: "building",
                href: r("/facilities/equipment"),
                children: [
                    { label: "Facilities and equipment", href: r("/facilities/equipment") },
                    { label: "Engineering and technical services", href: r("/facilities/services") },
                    { label: "Industry solutions and case studies", href: r("/facilities/solutions") },
                    { label: "Training courses and calendar", href: r("/facilities/training") },
                ],
            },
            {
                key: "engagement",
                label: "Engagement",
                icon: "globe",
                href: r("/engagement/linkages"),
                children: [
                    { label: "Networking and linkages", href: r("/engagement/linkages") },
                    { label: "Membership and affiliations", href: r("/engagement/affiliations") },
                    { label: "News and activities", href: r("/engagement/news") },
                    { label: "Media gallery and press coverage", href: r("/engagement/gallery") },
                    { label: "Brochures and presentation materials", href: r("/engagement/documents") },
                ],
            },
        ],
    },

    {
        section: "Enquiries",
        items: [
            {
                key: "contact",
                label: "Contact and Enquiries",
                icon: "mail",
                badge: "enquiries",
                href: r("/contact/details"),
                children: [
                    { label: "Contact details and offices", href: r("/contact/details") },
                    {
                        label: "Enquiry inbox",
                        href: COEUAS_ROUTES.enquiries,
                        badge: "enquiries",
                        hint: "General, research and training enquiries; respond, update status, export",
                    },
                ],
            },
        ],
    },

    {
        section: "Site management",
        items: [
            {
                key: "taxonomy",
                label: "Archive Taxonomy",
                icon: "tag",
                href: r("/taxonomy"),
                hint: "Years, categories, status values, groups",
            },
            {
                key: "media",
                label: "Media Library",
                icon: "image",
                href: r("/media"),
                hint: "Folders, upload, replace, alt text; usage check before delete",
            },
            {
                key: "settings",
                label: "Navigation and Settings",
                icon: "sliders",
                href: r("/settings/menus"),
                children: [
                    { label: "Header and footer menus", href: r("/settings/menus") },
                    { label: "Logo, SEO defaults, social links", href: r("/settings/site"), hint: "Site settings and footer" },
                    // Not in site map 1.3, but use case 2.3 lists "Manage Featured Items".
                    { label: "Featured items", href: r("/settings/featured-items"), hint: "From use case 2.3" },
                ],
            },
        ],
    },

    {
        section: "Account",
        items: [
            { key: "account", label: "My Account", icon: "user", href: COEUAS_ROUTES.account, hint: "Profile and password" },
            { key: "activity", label: "My Activity Log", icon: "activity", href: COEUAS_ROUTES.activity },
        ],
    },
];

/* ------------------------------------------------------------------ */
/* SUPER ADMIN ONLY (use case 2.3, red band)                           */
/* Shown in the sidebar only to the Super Admin. Each link opens the   */
/* Super Admin Console already filtered to COE-UAS.                    */
/*   Restore Deleted Content, Purge Permanently, View Audit Log        */
/*   (COE-UAS scope), Manage COE-UAS Admin Accounts, Export Audit Log  */
/* ------------------------------------------------------------------ */
export const COEUAS_SUPER_NAV = {
    section: "Super Admin only",
    items: [
        {
            key: "sa-accounts",
            label: "COE-UAS admin accounts",
            icon: "users",
            href: `${SHARED.users}?site=COEUAS`,
            hint: "Manage COE-UAS admin accounts",
        },
        {
            key: "sa-audit",
            label: "Audit log",
            icon: "activity",
            href: `${SHARED.auditLogs}?site=COEUAS`,
            hint: "View and export the audit log, COE-UAS scope",
        },
        {
            key: "sa-trash",
            label: "Deleted content",
            icon: "trash",
            href: `${SHARED.trash}?site=COEUAS`,
            hint: "Restore deleted content or purge it permanently",
        },
    ],
};

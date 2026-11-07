// ═════════════════════════════════════════════════════════════════════
//  COE-UAS · ENGAGEMENT PAGE · CONTENT FILE
//  ─────────────────────────────────────────────────────────────────────
//  This is the ONLY file you need to edit to change text, add partners,
//  news, media or links. Engagement.jsx just reads from here.
//
//  HOW TO MAINTAIN
//  • Add an item  → copy one line/object in an array and edit it.
//  • Remove item  → delete that object.
//  • Reorder      → move objects up/down.
//  • Reorder / remove a whole scene → edit SCENES below.
//  • `sample: true` shows a small "Sample" badge. Delete that flag (or set
//    SHOW_SAMPLE_BADGE = false) once the entry is real content.
//  • `placeholder: true` renders a dashed "to be filled" chip.
//  • Leave `href: ""` empty to hide a link; use "https://…" for external
//    links or "/coeuas/…" for internal (Inertia) links.
// ═════════════════════════════════════════════════════════════════════

export const BASE = "/coeuas"; // same BASE as siteMapCOEUAS.js
export const SHOW_SAMPLE_BADGE = true;

export const PAGE = {
  title: "Engagement | COE-UAS",
  hint: "Scroll · swipe · ← → keys",
};

/* ─────────────────────────────────────────────────────────────────────
   SCENE ORDER  (each scene = one "screen")
   id          → must match a key in CONTENT below and a view in Engagement.jsx
   label       → shown in the bottom pager
   transition  → how the scene ARRIVES. Options:
                 "fade" | "iris" | "curtain" | "flip" | "slice" | "zoom" | "rise"
   ───────────────────────────────────────────────────────────────────── */
export const SCENES = [
  { id: "hero",        label: "Welcome",     transition: "fade"    },
  { id: "network",     label: "Networking",  transition: "iris"    },
  { id: "ecosystem",   label: "Ecosystem",   transition: "curtain" },
  { id: "membership",  label: "Membership",  transition: "flip"    },
  { id: "news",        label: "News",        transition: "slice"   },
  { id: "media",       label: "Media",       transition: "zoom"    },
  { id: "collaborate", label: "Collaborate", transition: "rise"    },
];

/* ═════════════ 01 · NETWORKING & LINKAGES (needed first for the counter) ═════════════ */
// Org names below come from the UniMAP Airspace Sandbox poster. Please confirm
// the wording of each relationship (partner / supporter / member) before launch.
const GROUPS = [
  {
    id: "universities",
    icon: "cap",
    accent: "#3fe0ff",
    label: "University & Research Institutions",
    short: "Universities",
    blurb: "Academic and research networks that share talent, facilities and knowledge with the Centre.",
    items: [
      { name: "Universiti Malaysia Perlis (UniMAP)", note: "Host institution" },
      { name: "Add a partner university", placeholder: true },
    ],
  },
  {
    id: "government",
    icon: "bank",
    accent: "#4ade80",
    label: "Government & Agencies",
    short: "Government",
    blurb: "National and state agencies that guide policy, regulation and real operational use cases.",
    items: [
      { name: "CAAM", note: "Civil Aviation Authority of Malaysia" },
      { name: "MCMC", note: "Malaysian Communications and Multimedia Commission" },
      { name: "NAICO", note: "Northern Corridor Implementation Authority" },
      { name: "STRIDE", note: "Science & Technology Research Institute for Defence" },
    ],
  },
  {
    id: "industry",
    icon: "factory",
    accent: "#fbbf24",
    label: "Industrial Collaborators",
    short: "Industry",
    blurb: "Innovation agencies and industry players that turn research into deployable solutions.",
    items: [
      { name: "MIGHT", note: "Malaysian Industry-Government Group for High Technology" },
      { name: "Futurise" },
      { name: "MRANTI", note: "Malaysian Research Accelerator for Technology & Innovation" },
      { name: "SIRIM" },
    ],
  },
  {
    id: "international",
    icon: "globe",
    accent: "#a78bfa",
    label: "International Collaborations",
    short: "International",
    blurb: "Overseas universities, institutes and companies working with COE-UAS on joint research.",
    items: [
      { name: "Add an international partner", placeholder: true },
      { name: "Add another international partner", placeholder: true },
    ],
  },
  {
    id: "agreements",
    icon: "doc",
    accent: "#60a5fa",
    label: "Agreements, Consortia & Joint Initiatives",
    short: "Agreements",
    blurb: "Formal MoUs, consortia and flagship programmes that bind the network together.",
    items: [
      { name: "Perlis Airspace Sandbox", note: "National platform for low-altitude testing & validation" },
      { name: "Vertiport Malaysia — Perlis", note: "Partner programme" },
      { name: "Add an MoU / consortium", placeholder: true },
    ],
  },
];

const PARTNER_COUNT = GROUPS.reduce(
  (n, g) => n + g.items.filter((i) => !i.placeholder).length, 0
);

/* ═════════════ CONTENT PER SCENE ═════════════ */
export const CONTENT = {
  /* ── Welcome ── */
  hero: {
    eyebrow: "COE-UAS · Centre of Excellence for Unmanned Aerial Systems",
    title: "ENGAGEMENT",
    rotatorLead: "Connecting with",
    words: ["Universities", "Government agencies", "Industry partners", "International networks", "The community"],
    description:
      "Networks, memberships, news and media — how COE-UAS, Universiti Malaysia Perlis, works with the people building Malaysia's low-altitude future.",
    stats: [
      { label: "Engagement pillars", value: 5 },
      { label: "Ecosystem partners", value: PARTNER_COUNT },
      { label: "Archive span", value: "2013–2026" },
    ],
    cta: "Begin the journey",
  },

  /* ── 01 Networking & Linkages ── */
  network: {
    eyebrow: "01 · Networking & Linkages",
    title: "One centre. A whole network.",
    description:
      "From universities to regulators, COE-UAS is linked into the ecosystem that moves research from the lab into real airspace.",
    centerLabel: "COE-UAS",
    groups: GROUPS,
  },

  /* ── Ecosystem (from the “Building Together” slide) ── */
  ecosystem: {
    eyebrow: "Stronger together · Farther together",
    quote: ["No single entity", "can do this alone.", "Ecosystem is the key."],
    // Words in this list get the blue highlight in the quote
    highlight: ["Ecosystem", "key."],
    pillars: [
      { role: "University", icon: "cap",     accent: "#3fe0ff", tag: "Research, talent & innovation",   text: "We create knowledge and future talent." },
      { role: "Industry",   icon: "factory", accent: "#4ade80", tag: "Deployment & commercialisation",  text: "We turn innovation into real solutions and market value." },
      { role: "Government", icon: "bank",    accent: "#a78bfa", tag: "National coordination & support", text: "We provide policy, funding and national direction." },
      { role: "Agencies",   icon: "users",   accent: "#60a5fa", tag: "Real operational use cases",      text: "We are the real users, driving real-world impact." },
      { role: "Regulator",  icon: "shield",  accent: "#fbbf24", tag: "Safety, governance & compliance", text: "We ensure safety, trust and responsible growth." },
    ],
    centerLabel: "Low Altitude Ecosystem · One vision. Shared impact.",
    together: [
      "A safer sky for all",
      "A stronger economy",
      "Innovation that matters",
      "A sustainable Malaysia",
      "Global competitiveness",
    ],
  },

  /* ── 02 Membership & Affiliations ── */
  membership: {
    eyebrow: "02 · Membership & Affiliations",
    title: "Belonging to something bigger",
    description: "The professional bodies, institutions and schemes that COE-UAS and its members belong to.",
    ghost: "MEMBERS",
    cards: [
      {
        icon: "badge",
        accent: "#3fe0ff",
        title: "Centre Institutional Memberships",
        text: "Organisations and bodies the Centre is formally part of.",
        items: [
          { text: "Add an institutional membership", placeholder: true },
          { text: "Add another membership", placeholder: true },
        ],
      },
      {
        icon: "users",
        accent: "#a78bfa",
        title: "Members' Professional Affiliations",
        text: "Professional societies, committees and appointments held by our researchers.",
        items: [
          { text: "Add a professional affiliation", placeholder: true },
          { text: "Add another affiliation", placeholder: true },
        ],
      },
      {
        icon: "star",
        accent: "#fbbf24",
        title: "COE-UAS Membership Scheme",
        badge: "If applicable",
        text: "Details of how individuals and organisations can join the COE-UAS community.",
        items: [{ text: "Add scheme benefits and eligibility", placeholder: true }],
        link: { label: "Ask about membership", href: `${BASE}/contact` },
      },
    ],
  },

  /* ── 03 News & Activities ── */
  news: {
    eyebrow: "03 · News & Activities",
    title: "What's happening",
    description: "Project updates, visits, talks, exhibitions and community work — as they happen.",
    categories: [
      { id: "updates",     label: "Project updates",       accent: "#3fe0ff" },
      { id: "visits",      label: "Official visits",       accent: "#4ade80" },
      { id: "talks",       label: "Conferences & talks",   accent: "#a78bfa" },
      { id: "exhibitions", label: "Exhibitions & demos",   accent: "#fbbf24" },
      { id: "community",   label: "Community engagement",  accent: "#60a5fa" },
    ],
    // Newest first. `image` is optional (e.g. "/images/coeuas/news-1.jpg").
    items: [
      {
        id: "n1",
        category: "updates",
        date: "2026",
        title: "Perlis Airspace Sandbox — Phase 1 gets under way",
        summary:
          "Foundation and initial operational setup runs from mid-2026 to early 2027: site development, a basic command & control centre, initial communication infrastructure and early BVLOS demonstration flights.",
        image: "",
        href: "",
      },
      {
        id: "n2",
        category: "updates",
        date: "2026",
        title: "Sandbox site and flight corridors identified at Sungai Batu Pahat",
        summary:
          "The proposed development area spans about 19.7 ha, with a 2.9 ha Phase 1 zone and an upgradeable runway. Corridors are planned east to Timah Tasoh Dam and west to Langkawi via Kuala Perlis.",
        image: "",
        href: "",
      },
      {
        id: "n3", category: "visits", date: "Add date", sample: true,
        title: "Official visit / delegation title goes here",
        summary: "Short description of who visited, what was shown and what was agreed.",
      },
      {
        id: "n4", category: "talks", date: "Add date", sample: true,
        title: "Conference or invited talk title goes here",
        summary: "Where it was held, who presented and the key message.",
      },
      {
        id: "n5", category: "exhibitions", date: "Add date", sample: true,
        title: "Exhibition or live demonstration goes here",
        summary: "Which platforms were demonstrated and to which audience.",
      },
      {
        id: "n6", category: "community", date: "Add date", sample: true,
        title: "Community outreach activity goes here",
        summary: "Schools, communities or agencies reached and the outcome.",
      },
    ],
  },

  /* ── 04 Media Gallery ── */
  media: {
    eyebrow: "04 · Media Gallery",
    title: "See it. Watch it. Read it.",
    description: "Photographs, video, press coverage and downloadable materials.",
    tabs: [
      {
        id: "gallery",
        kind: "gallery",
        label: "Photos & Videos",
        // src = image path. video = optional video file/URL (opens in the lightbox).
        // size: "" | "wide" | "tall" | "big"  → mosaic layout
        items: [
          { id: "g1", title: "Add photo caption", src: "", size: "big" },
          { id: "g2", title: "Add photo caption", src: "", size: "" },
          { id: "g3", title: "Add video caption", src: "", video: "", size: "tall" },
          { id: "g4", title: "Add photo caption", src: "", size: "wide" },
          { id: "g5", title: "Add photo caption", src: "", size: "" },
          { id: "g6", title: "Add photo caption", src: "", size: "" },
        ],
      },
      {
        id: "press",
        kind: "press",
        label: "Media Coverage",
        items: [
          { id: "p1", outlet: "Add outlet", date: "Add date", title: "Add press headline", href: "", sample: true },
          { id: "p2", outlet: "Add outlet", date: "Add date", title: "Add press headline", href: "", sample: true },
          { id: "p3", outlet: "Add outlet", date: "Add date", title: "Add press headline", href: "", sample: true },
        ],
      },
      {
        id: "docs",
        kind: "docs",
        label: "Brochures & Presentations",
        items: [
          { id: "d1", type: "PDF", title: "UniMAP Airspace Sandbox — overview poster", note: "The first dedicated low-altitude airspace testing facility", href: "" },
          { id: "d2", type: "PDF", title: "Low Altitude Air Space Sandbox — The Skyway of the Future", note: "National initiative for urban air mobility innovation", href: "" },
        ],
      },
    ],
  },

  /* ── 05 Collaborate with Us ── */
  collaborate: {
    eyebrow: "05 · Collaborate with Us",
    title: "COLLABORATE WITH US",
    description: "Research, industry and partnership enquiries — let's build the sky of the future together.",
    channels: [
      { icon: "flask",     accent: "#3fe0ff", title: "Research",    text: "Joint projects, grants, postgraduate and postdoctoral opportunities.", href: `${BASE}/contact?type=research` },
      { icon: "factory",   accent: "#4ade80", title: "Industry",    text: "Testing, validation, engineering services and technology transfer.",  href: `${BASE}/contact?type=industry` },
      { icon: "handshake", accent: "#fbbf24", title: "Partnership", text: "Agreements, consortia and government or international linkages.",    href: `${BASE}/contact?type=partnership` },
    ],
    primary: { label: "Start a conversation", href: `${BASE}/contact` },
    restart: "Back to the beginning",
    footer: "Building today the foundation for tomorrow's autonomous and connected airspace.",
  },
};

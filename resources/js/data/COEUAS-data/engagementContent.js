// COE-UAS Engagement: the ONE place to edit the page content.
// Put this file at: resources/js/data/COEUAS-data/engagementContent.js
//
// HOW TO MAINTAIN
//   Add          copy one object inside an array (`items`, `partners`, `list`, `categories`, `tabs`) and edit it.
//   Edit         change the text, `image`/`src`, or `href`.
//   Delete       remove the object from its array.
//   Reorder      move objects up or down. Sections: move the section object inside `sections`.
//   Hide         set `visible: false` on a section.
//   Hero numbers a stat with `of: "<section id>"` counts that section's items; `of: "<section id>.<field>"`
//                counts a nested list (placeholders are not counted). A plain `value` is shown as written.
//
// MARKERS
//   sample: true       shows a small "Sample" badge. Delete the flag when the entry is real.
//   placeholder: true  shows a dashed "to be filled" row. Set settings.showPlaceholders to false on the live site.
//   href: ""           no link is drawn. "https://..." and .pdf open in a new tab; "/contact" gets the /coeuas prefix.
//
// IDS
//   `id`      unique inside its array (React list key). Never reuse one.
//   `anchor`  optional element id so the navbar chips (/coeuas/engagement#link-government ...) scroll to the item.
//             For news categories and media tabs the anchor also opens that category / tab.
//
// Later this object can come from the admin CMS: <Engagement content={...} />.

import { useMemo } from "react";

export const IMAGE_BASE = "/images/coeuas/engagement/";

export const imgUrl = (file) => {
  if (!file) return "";
  return /^(https?:)?\/\//.test(file) || file.startsWith("/") ? file : IMAGE_BASE + file;
};

export function useEngagementContent(override) {
  const content = useMemo(() => override || engagementContent, [override]);
  return { content };
}

export const engagementContent = {
  page: { title: "Engagement | COE-UAS" },

  settings: {
    showSampleBadge: true,
    showPlaceholders: true, // false = hide the "Add a partner..." rows on the live site
    showSlotHints: true,    // false = hide the "Photo slot" labels on empty images
    emptyNote: "To be announced.",
  },

  /* ------------------------------ HERO ------------------------------ */
  hero: {
    eyebrow: "COE-UAS · Centre of Excellence for Unmanned Aerial Systems",
    headline: ["Stronger together,", "farther together."],
    highlight: "farther together.",
    lead: "Networks, memberships, news and media: how COE-UAS, Universiti Malaysia Perlis, works with the people building Malaysia's low-altitude future.",
    image: "",
    primary: { label: "Begin the journey", target: "linkages" }, // target = a section id
    secondary: { label: "Collaborate with us", href: "/collaborate" },
    caption: { place: "Perlis, Malaysia", note: "COE-UAS" },
    stats: [
      { label: "Engagement pillars", of: "ecosystem", note: "University, industry, government, agencies and regulator." },
      { label: "Ecosystem partners", of: "linkages.partners", note: "Named organisations in the network." },
      { label: "Archive span", value: "2013–2026", note: "Years of research and activity on record." },
    ],
  },

  /* ---------------------------- SECTIONS ----------------------------
     Order here = order on the page. `label` = short name in the sticky menu.
     tone: dark | navy | light | blue
     type: groups | pillars | panels | news | media | cta                      */
  sections: [
    /* ---------- Networking & Linkages ---------- */
    {
      id: "linkages",
      type: "groups",
      visible: true, nav: true, tone: "light",
      label: "Networking",
      eyebrow: "Networking & Linkages",
      title: "One centre. A whole network.",
      text: "From universities to regulators, COE-UAS is linked into the ecosystem that moves research from the lab into real airspace.",
      // Org names come from the UniMAP Airspace Sandbox poster.
      // Please confirm the wording of each relationship (partner / supporter / member) before launch.
      items: [
        {
          id: "universities", anchor: "link-universities", icon: "cap",
          label: "University & Research Institutions",
          blurb: "Academic and research networks that share talent, facilities and knowledge with the Centre.",
          partners: [
            { name: "Universiti Malaysia Perlis (UniMAP)", note: "Host institution" },
            { name: "Add a partner university", placeholder: true },
          ],
        },
        {
          id: "government", anchor: "link-government", icon: "bank",
          label: "Government & Agencies",
          blurb: "National and state agencies that guide policy, regulation and real operational use cases.",
          partners: [
            { name: "CAAM", note: "Civil Aviation Authority of Malaysia" },
            { name: "MCMC", note: "Malaysian Communications and Multimedia Commission" },
            { name: "NAICO", note: "Northern Corridor Implementation Authority" },
            { name: "STRIDE", note: "Science & Technology Research Institute for Defence" },
          ],
        },
        {
          id: "industry", anchor: "link-industry", icon: "factory",
          label: "Industrial Collaborators",
          blurb: "Innovation agencies and industry players that turn research into deployable solutions.",
          partners: [
            { name: "MIGHT", note: "Malaysian Industry-Government Group for High Technology" },
            { name: "Futurise" },
            { name: "MRANTI", note: "Malaysian Research Accelerator for Technology & Innovation" },
            { name: "SIRIM" },
          ],
        },
        {
          id: "international", anchor: "link-international", icon: "globe",
          label: "International Collaborations",
          blurb: "Overseas universities, institutes and companies working with COE-UAS on joint research.",
          partners: [
            { name: "Add an international partner", placeholder: true },
            { name: "Add another international partner", placeholder: true },
          ],
        },
        {
          id: "agreements", anchor: "link-agreements", icon: "doc",
          label: "Agreements, Consortia & Joint Initiatives",
          blurb: "Formal MoUs, consortia and flagship programmes that bind the network together.",
          partners: [
            { name: "Perlis Airspace Sandbox", note: "National platform for low-altitude testing & validation" },
            { name: "Vertiport Malaysia — Perlis", note: "Partner programme" },
            { name: "Add an MoU / consortium", placeholder: true },
          ],
        },
      ],
    },

    /* ---------- Ecosystem (from the "Building Together" slide) ---------- */
    {
      id: "ecosystem",
      type: "pillars",
      visible: true, nav: true, tone: "blue",
      label: "Ecosystem",
      eyebrow: "Stronger together · Farther together",
      quote: ["No single entity can do this alone.", "Ecosystem is the key."],
      highlight: ["Ecosystem", "key."], // words that get the highlight colour
      centerLabel: "Low Altitude Ecosystem · One vision. Shared impact.",
      togetherTitle: "Shared outcomes",
      together: [
        "A safer sky for all",
        "A stronger economy",
        "Innovation that matters",
        "A sustainable Malaysia",
        "Global competitiveness",
      ],
      items: [
        { id: "university", role: "University", icon: "cap", tag: "Research, talent & innovation", text: "We create knowledge and future talent." },
        { id: "industry", role: "Industry", icon: "factory", tag: "Deployment & commercialisation", text: "We turn innovation into real solutions and market value." },
        { id: "government", role: "Government", icon: "bank", tag: "National coordination & support", text: "We provide policy, funding and national direction." },
        { id: "agencies", role: "Agencies", icon: "users", tag: "Real operational use cases", text: "We are the real users, driving real-world impact." },
        { id: "regulator", role: "Regulator", icon: "shield", tag: "Safety, governance & compliance", text: "We ensure safety, trust and responsible growth." },
      ],
    },

    /* ---------- Membership & Affiliations ---------- */
    {
      id: "affiliations",
      type: "panels",
      visible: true, nav: true, tone: "navy",
      label: "Membership",
      eyebrow: "Membership & Affiliations",
      title: "Belonging to something bigger",
      text: "The professional bodies, institutions and schemes that COE-UAS and its members belong to.",
      items: [
        {
          id: "institutional", icon: "badge",
          title: "Centre Institutional Memberships",
          text: "Organisations and bodies the Centre is formally part of.",
          list: [
            { text: "Add an institutional membership", placeholder: true },
            { text: "Add another membership", placeholder: true },
          ],
        },
        {
          id: "professional", icon: "users",
          title: "Members' Professional Affiliations",
          text: "Professional societies, committees and appointments held by our researchers.",
          list: [
            { text: "Add a professional affiliation", placeholder: true },
            { text: "Add another affiliation", placeholder: true },
          ],
        },
        {
          id: "scheme", icon: "star", badge: "If applicable",
          title: "COE-UAS Membership Scheme",
          text: "Details of how individuals and organisations can join the COE-UAS community.",
          list: [{ text: "Add scheme benefits and eligibility", placeholder: true }],
          link: { label: "Ask about membership", href: "/contact" },
        },
      ],
    },

    /* ---------- News & Activities ---------- */
    {
      id: "news",
      type: "news",
      visible: true, nav: true, tone: "light",
      label: "News",
      eyebrow: "News & Activities",
      title: "What's happening",
      text: "Project updates, visits, talks, exhibitions and community work, as they happen.",
      allLabel: "All stories",
      emptyText: "No stories in this category yet.",
      categories: [
        { id: "updates", anchor: "news-updates", label: "Project updates" },
        { id: "visits", anchor: "news-visits", label: "Official visits" },
        { id: "talks", anchor: "news-conferences", label: "Conferences & talks" },
        { id: "exhibitions", anchor: "news-exhibitions", label: "Exhibitions & demos" },
        { id: "community", anchor: "news-community", label: "Community engagement" },
      ],
      // Newest first. `image` is optional (file name or full path).
      items: [
        {
          id: "n1", category: "updates", date: "2026", image: "", href: "",
          title: "Perlis Airspace Sandbox: Phase 1 gets under way",
          summary: "Foundation and initial operational setup runs from mid-2026 to early 2027: site development, a basic command & control centre, initial communication infrastructure and early BVLOS demonstration flights.",
        },
        {
          id: "n2", category: "updates", date: "2026", image: "", href: "",
          title: "Sandbox site and flight corridors identified at Sungai Batu Pahat",
          summary: "The proposed development area spans about 19.7 ha, with a 2.9 ha Phase 1 zone and an upgradeable runway. Corridors are planned east to Timah Tasoh Dam and west to Langkawi via Kuala Perlis.",
        },
        { id: "n3", category: "visits", date: "Add date", sample: true, title: "Official visit / delegation title goes here", summary: "Short description of who visited, what was shown and what was agreed." },
        { id: "n4", category: "talks", date: "Add date", sample: true, title: "Conference or invited talk title goes here", summary: "Where it was held, who presented and the key message." },
        { id: "n5", category: "exhibitions", date: "Add date", sample: true, title: "Exhibition or live demonstration goes here", summary: "Which platforms were demonstrated and to which audience." },
        { id: "n6", category: "community", date: "Add date", sample: true, title: "Community outreach activity goes here", summary: "Schools, communities or agencies reached and the outcome." },
      ],
    },

    /* ---------- Media Gallery ---------- */
    {
      id: "gallery",
      type: "media",
      visible: true, nav: true, tone: "dark",
      label: "Media",
      eyebrow: "Media Gallery",
      title: "See it. Watch it. Read it.",
      text: "Photographs, video, press coverage and downloadable materials.",
      tabs: [
        {
          id: "gallery", anchor: "gallery", kind: "gallery", label: "Photos & videos",
          // src = image. video = optional video file/URL (opens in the viewer).
          // size: "" | "wide" | "tall" | "big" controls the mosaic layout.
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
          id: "press", anchor: "press-coverage", kind: "press", label: "Media coverage",
          items: [
            { id: "p1", outlet: "Add outlet", date: "Add date", title: "Add press headline", href: "", sample: true },
            { id: "p2", outlet: "Add outlet", date: "Add date", title: "Add press headline", href: "", sample: true },
            { id: "p3", outlet: "Add outlet", date: "Add date", title: "Add press headline", href: "", sample: true },
          ],
        },
        {
          id: "docs", anchor: "documents", kind: "docs", label: "Brochures & presentations",
          items: [
            { id: "d1", type: "PDF", title: "UniMAP Airspace Sandbox: overview poster", note: "The first dedicated low-altitude airspace testing facility", href: "" },
            { id: "d2", type: "PDF", title: "Low Altitude Air Space Sandbox: The Skyway of the Future", note: "National initiative for urban air mobility innovation", href: "" },
          ],
        },
      ],
    },

    /* ---------- Collaborate with Us ---------- */
    {
      id: "collaborate",
      type: "cta",
      visible: true, nav: false, tone: "dark",
      title: "Collaborate with us",
      text: "Research, industry and partnership enquiries. Let's build the sky of the future together.",
      footer: "Building today the foundation for tomorrow's autonomous and connected airspace.",
      restart: "Back to the top",
      items: [
        { id: "research", icon: "flask", title: "Research", text: "Joint projects, grants, postgraduate and postdoctoral opportunities.", href: "/contact?type=research" },
        { id: "industry", icon: "factory", title: "Industry", text: "Testing, validation, engineering services and technology transfer.", href: "/contact?type=industry" },
        { id: "partnership", icon: "handshake", title: "Partnership", text: "Agreements, consortia and government or international linkages.", href: "/contact?type=partnership" },
      ],
    },
  ],
};

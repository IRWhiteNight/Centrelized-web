// COE-UAS Facilities & Services: the ONE place to edit the page content.
// Put this file at: resources/js/data/COEUAS-data/facilitiesContent.js
//
// HOW TO MAINTAIN
//   Add an item     copy one object inside a section's `items` array, change `id` and the text.
//   Edit an item    change its text, `image`, `href` or `anchor`.
//   Delete an item  remove its object from `items`.
//   Hide a section  set `visible: false`.   Reorder sections: move the object in `sections`.
//   Add a section   copy a section of the same `type` (cards | programme | steps | tiles | list).
//   Hero numbers    a stat with `of: "<section id>"` counts that section's items automatically,
//                   so the figures are always correct after you add or delete an item.
//
// RULES FOR IDS
//   `id`      unique inside its section (used by React as the list key). Never reuse one.
//   `anchor`  optional. Becomes the element id, so the navbar chips
//             (/coeuas/facilities#laboratories ...) scroll to that exact item.
//             Keep the anchors that exist in siteMapCOEUAS.js.
//   `href`    optional. Paths that start with "/" get the /coeuas prefix automatically.
//             Without `href` the item is shown as plain information, not a link.
//   `image`   optional. A file name inside IMAGE_BASE, or a full URL / path. Empty = placeholder.
//
// Later this object can come from the admin CMS: pass it to <Facilities content={...} />
// or return it from useFacilitiesContent().

import { useMemo } from "react";

export const IMAGE_BASE = "/images/coeuas/facilities/";

export const imgUrl = (file) => {
  if (!file) return "";
  return /^(https?:)?\/\//.test(file) || file.startsWith("/") ? file : IMAGE_BASE + file;
};

export function useFacilitiesContent(override) {
  const content = useMemo(() => override || facilitiesContent, [override]);
  return { content };
}

export const facilitiesContent = {
  settings: {
    showSlotHints: true, // false = hide the "Photo slot" labels on empty images (use on the live site)
  },

  /* ------------------------------ HERO ------------------------------ */
  hero: {
    eyebrow: "Facilities & Services",
    headline: ["Where unmanned flight", "is built, tested", "and proven."],
    highlight: "and proven.",
    lead: "Workshops, aircraft, flight sites and people in one place, open to industry, agencies and students.",
    image: "", // e.g. "hero.jpg"
    primary: { label: "Explore facilities", target: "equipment" }, // target = a section id
    secondary: { label: "Send an enquiry", href: "/contact#training-enquiry" },
    caption: { place: "Perlis, Malaysia", note: "COE-UAS" },
    stats: [
      { label: "Facility types", of: "equipment", note: "Labs, aircraft and test sites." },
      { label: "Technical services", of: "services", note: "From design to aerial operations." },
      { label: "Industry solutions", of: "solutions", note: "Mapping, inspection, cargo and more." },
      { label: "Training tracks", of: "training", note: "Courses, outreach and a calendar." },
    ],
  },

  /* ---------------------------- SECTIONS ----------------------------
     Order here = order on the page. `label` is the short name in the sticky menu.
     tone: dark | navy | light | blue                                          */
  sections: [
    {
      id: "equipment",
      type: "cards",
      visible: true,
      nav: true,
      tone: "light",
      label: "Facilities",
      eyebrow: "Facilities & equipment",
      title: "Facilities and equipment",
      text: "The places and platforms where unmanned systems are built and proven.",
      items: [
        { id: "labs", anchor: "laboratories", tag: "Lab", image: "", title: "Laboratories and workshops", text: "Benches and tooling for building, tuning and repairing unmanned aircraft and their electronics.", specs: [] },
        { id: "platforms", anchor: "platforms", tag: "Aircraft", image: "", title: "Aircraft and research platforms", text: "Fixed-wing, multirotor and hybrid airframes developed and flown by the Centre.", specs: ["Fixed-wing", "Multirotor", "Hybrid"] },
        { id: "test-sites", anchor: "test-sites", tag: "Test site", image: "", title: "Testing sites and flight facilities", text: "Runways, test ranges and controlled airspace where systems are proven in real conditions.", specs: [] },
        { id: "upgrades", anchor: "facility-upgrades", tag: "Upgrade", image: "", title: "Facility development and upgrades", text: "New buildings, runway upgrades and equipment programmes that extend what the Centre can test.", specs: [] },
      ],
    },

    {
      id: "sandbox",
      type: "programme",
      visible: true,
      nav: true,
      tone: "dark",
      label: "Airspace Sandbox",
      eyebrow: "Featured test site",
      title: "The Perlis Airspace Sandbox",
      text: "A dedicated low-altitude test site with a functional mock-up aerodrome.",
      image: "", // e.g. "sandbox.jpg"
      facts: [
        { label: "Site", value: "Sungai Batu Pahat" },
        { label: "East corridor", value: "To the Timah Tasoh Dam" },
        { label: "West corridor", value: "Over Kuala Perlis towards Langkawi" },
      ],
      link: { label: "See the programme", href: "/research#perlis-airspace-sandbox" },
      partsTitle: "What the site includes",
      items: [
        { id: "vertiport", title: "Vertiport" },
        { id: "corridor", title: "Test flight corridor" },
        { id: "hub", title: "Drone hub" },
        { id: "maintenance", title: "Research and maintenance facility" },
        { id: "simulator", title: "Flight simulator" },
        { id: "utm", title: "Radar, communication and UTM system" },
      ],
    },

    {
      id: "services",
      type: "steps", // numbered, because it is a sequence
      visible: true,
      nav: true,
      tone: "navy",
      label: "Technical services",
      eyebrow: "Engineering & technical services",
      title: "Engineering and technical services",
      text: "One project, four stages, one team.",
      items: [
        { id: "design", anchor: "svc-design", title: "Design, manufacturing and assembly", text: "From concept airframe to a flying prototype.", points: [] },
        { id: "integration", anchor: "svc-integration", title: "Systems integration and testing", text: "Payloads, autopilots and links joined up and verified.", points: [] },
        { id: "maintenance", anchor: "svc-maintenance", title: "Maintenance, repair and upgrading", text: "Keep fleets flying and bring older platforms up to date.", points: [] },
        { id: "operations", anchor: "svc-operations", title: "Aerial operations and data processing", text: "We fly the mission, then turn the data into answers.", points: [] },
      ],
    },

    {
      id: "solutions",
      type: "tiles",
      visible: true,
      nav: true,
      tone: "light",
      label: "Industry solutions",
      eyebrow: "Industry solutions & case studies",
      title: "Industry solutions and case studies",
      text: "What the Centre can do for your sector.",
      // TODO: replace the short descriptions with verified details and add `href` to case-study pages.
      items: [
        { id: "survey", anchor: "survey-mapping", title: "Surveying, mapping and photogrammetry", text: "Aerial surveys turned into maps and 3D models.", href: "" },
        { id: "volumetrics", anchor: "stockpile-volumetrics", title: "Stockpile and volumetric measurement", text: "Measure stockpiles and earthworks from the air.", href: "" },
        { id: "inspection", anchor: "inspection", title: "Heritage documentation and inspection", text: "Record and inspect structures without scaffolding.", href: "" },
        { id: "security", anchor: "security", title: "Security, surveillance and monitoring", text: "Aerial coverage for sites, borders and events.", href: "" },
        { id: "cargo", anchor: "cargo", title: "Cargo and goods transportation", text: "Moving light cargo where roads are slow.", href: "" },
        { id: "agriculture", anchor: "agriculture", title: "Agriculture, spraying and crop monitoring", text: "Healthier crops with targeted spraying and monitoring.", href: "" },
        { id: "ai", anchor: "ai-vision", title: "Autonomous systems, AI and computer vision", text: "Aircraft that see, decide and act on their own.", href: "" },
      ],
    },

    {
      id: "training",
      type: "list",
      visible: true,
      nav: true,
      tone: "dark",
      label: "Training",
      eyebrow: "Training & professional development",
      title: "Training and professional development",
      text: "Skilled, certified people keep the sky safe.",
      items: [
        { id: "courses", anchor: "drone-courses", title: "Drone operation and technical courses", text: "Hands-on courses for new and experienced operators.", href: "" },
        { id: "industry", anchor: "industry-courses", title: "Industry and agency training", text: "Programmes shaped around a team's own missions.", href: "" },
        { id: "outreach", anchor: "outreach", title: "Community and outreach programmes", text: "Open days and school sessions that bring people closer to the technology.", href: "" },
        { id: "calendar", anchor: "training-calendar", title: "Training calendar and enquiries", text: "See what is running next and ask about places.", href: "/facilities/training/calendar", cta: "View calendar" },
      ],
    },

    {
      id: "cta",
      type: "cta",
      visible: true,
      nav: false,
      tone: "dark",
      title: "Have a project in mind?",
      text: "Tell us what you want to build, test or learn.",
      footer: "© 2026 COE-UAS",
      items: [
        { id: "enquiry", title: "Send a training or services enquiry", text: "Courses, calendar and technical services", href: "/contact#training-enquiry" },
        { id: "collaborate", title: "Start a collaboration", text: "Research, industry or partnership", href: "/collaborate" },
        { id: "people", title: "Meet the team", text: "Researchers, fellows and advisors", href: "/people" },
      ],
    },
  ],
};

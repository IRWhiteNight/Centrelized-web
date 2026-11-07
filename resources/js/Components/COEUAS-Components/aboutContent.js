import { useMemo } from "react";

/* ------------------------------------------------------------------
   ABOUT PAGE CONTENT: everything an admin would edit.
   About.jsx contains NO text, links, images or numbers of its own.

   Structure follows the ABOUT branch of the COE-UAS site map:
     About COE-UAS · History & Milestones · Organisation & Leadership
     Strategy & Development · Awards & Recognition

   Anything marked TODO is sample wording. Replace it with verified
   facts before launch (later: the admin CMS).

   MEDIA SLOTS work like the Home page: { type, src, alt?, note? }.
   Files go in public/images/coe-uas/about/
------------------------------------------------------------------- */

const IMG = "/images/coe-uas/about/";
const image = (file, note, alt = "") => ({ type: "image", src: IMG + file, alt, note });

export const defaultAboutContent = {
  sections: [
    { id: "hero", label: "Intro", visible: true },
    { id: "background", label: "Background", visible: true },
    { id: "direction", label: "Vision and mission", visible: true },
    { id: "history", label: "History", visible: true },
    { id: "organisation", label: "Organisation", visible: true },
    { id: "strategy", label: "Strategy", visible: true },
    { id: "awards", label: "Awards", visible: true },
    { id: "cta", label: "Next", visible: true },
  ],

  /* Scrolling words shown between sections (id = the section it follows) */
  bands: {
    hero: "Research · Engineering · Industry · Training · Innovation ·",
    strategy: "Design · Test · Fly · Transfer · Repeat ·",
  },

  /* 1. INTRO */
  hero: {
    eyebrow: "About COE-UAS",
    headline: "Where unmanned flight becomes useful.",
    lead: "The Centre of Excellence for Unmanned Aerial Systems brings research, engineering and industry together to make aerial technology useful.",
    primary: { label: "Our story", target: "history" },
    secondary: { label: "Meet our people", href: "/people" },
    // counted up when the section appears
    stats: [
      { value: 13, suffix: "", label: "years, 2013 to 2026" },
      { value: 4, suffix: "", label: "strategic pillars" },
      { value: 3, suffix: "", label: "award categories" },
    ],
  },

  /* 2. ABOUT COE-UAS: background and establishment */
  background: {
    eyebrow: "Background and establishment",
    title: "How the Centre began.",
    // TODO: replace with the official background text
    text: [
      "COE-UAS was set up to give unmanned aerial systems research a home of its own: a place where ideas move from the lab to the flight line.",
      "Since its establishment the Centre has grown from a small research effort into a full programme of research, engineering services, training and partnerships.",
    ],
    points: ["Research", "Engineering", "Industry"],
    media: image("background.jpg", "Founding photo or aerial facility shot, 4:5"),
    gallery: [
      image("background/1.jpg", "Early team or lab, 4:3"),
      image("background/2.jpg", "First flight tests, 4:3"),
    ],
  },

  /* 3. VISION, MISSION, OBJECTIVES, DIRECTION */
  direction: {
    title: "Vision, mission and objectives.",
    // TODO: replace with the approved vision, mission and objectives
    cards: [
      { id: "vision", tag: "Vision", title: "A leading centre for unmanned aerial systems.", text: "Recognised for research that is trusted by industry, government and the community." },
      { id: "mission", tag: "Mission", title: "Make aerial technology useful.", text: "Bring research, engineering and industry together to solve real problems from the air." },
      {
        id: "objectives",
        tag: "Objectives",
        title: "What we work towards.",
        list: ["Advance research and development", "Grow industry and commercial engagement", "Build skills through training", "Expand facilities and linkages"],
      },
    ],
    directionTitle: "Research and strategic direction",
    directionText: "From 2026 the Perlis Airspace Sandbox shapes how the Centre plans, tests and shares its work.",
  },

  /* 4. HISTORY & MILESTONES: development timeline 2013 to 2026 */
  history: {
    eyebrow: "History and milestones",
    title: "Thirteen years in motion.",
    text: "From earlier origins to the Perlis Airspace Sandbox, the Centre has changed shape many times.",
    // TODO: replace sample years and wording with the verified timeline
    items: [
      { year: "Origins", title: "Establishment and earlier origins", text: "The research work and teams that led to the Centre." },
      { year: "2013", title: "The Centre is established", text: "COE-UAS begins as a dedicated unmanned aerial systems centre." },
      { year: "2016", title: "Research groups take shape", text: "Teams form around focused research areas and projects." },
      { year: "2019", title: "Industry work grows", text: "Engineering services and commercial projects expand." },
      { year: "2022", title: "Training and outreach", text: "Drone courses open to industry, agencies and the community." },
      { year: "2026", title: "Perlis Airspace Sandbox", text: "A new chapter that changes how the Centre is organised." },
    ],
    cta: { label: "Major achievements and transformations", href: "/publications/highlights" },
  },

  /* 5. ORGANISATION & LEADERSHIP */
  organisation: {
    eyebrow: "Organisation and leadership",
    title: "How we are organised.",
    root: "COE-UAS",
    nodes: [
      { title: "Leadership and management", text: "Direction, governance and day-to-day management." },
      { title: "Research group structure", text: "Groups built around research areas, members and projects." },
      { title: "Research and technical support", text: "Engineers, technicians and staff who keep flights running." },
    ],
    previous: "Previous structures and leadership periods",
    chartCta: { label: "Open the organisation chart", href: "/about/organisation" },
    cta: { label: "Meet leadership", href: "/people" },
  },

  /* 6. STRATEGY & DEVELOPMENT */
  strategy: {
    eyebrow: "Strategy and development",
    title: "Four pillars, one direction.",
    tabs: [
      { id: "rd", label: "Research and development", text: "Research that is built to be flown, tested and improved.", points: ["Research areas and groups", "Projects and grants", "Technologies and prototypes"], href: "/research" },
      { id: "industry", label: "Industry and commercial engagement", text: "Practical solutions for companies and agencies.", points: ["Surveying and mapping", "Inspection and monitoring", "Cargo, agriculture and AI"], href: "/facilities/solutions" },
      { id: "training", label: "Training and capability development", text: "Skills for operators, teams and communities.", points: ["Drone operation courses", "Industry and agency training", "Community and outreach"], href: "/facilities/training" },
      { id: "facilities", label: "Facilities and future plans", text: "Laboratories, aircraft and flight sites that keep growing.", points: ["Laboratories and workshops", "Testing sites and flight facilities", "Upgrade and development projects"], href: "/facilities" },
    ],
  },

  /* 7. AWARDS & RECOGNITION */
  awards: {
    eyebrow: "Awards and recognition",
    title: "Recognised for the work.",
    // TODO: replace with real awards, accreditations and certifications
    groups: [
      { id: "centre", title: "Centre awards and achievements", items: ["Award name, awarding body, year", "Award name, awarding body, year"] },
      { id: "accred", title: "Accreditations and certifications", items: ["Accreditation or certificate", "Accreditation or certificate"] },
      { id: "members", title: "Member awards", items: ["Linked to individual member profiles", "Browse them in the member directory"] },
    ],
    cta: { label: "Explore member profiles", href: "/people" },
  },

  /* 8. WHAT NEXT */
  cta: {
    title: "Where to next?",
    items: [
      { id: "c1", title: "Explore research", text: "Projects, grants and innovation.", href: "/research" },
      { id: "c2", title: "Meet our people", text: "Researchers, fellows and students.", href: "/people" },
      { id: "c3", title: "Collaborate with us", text: "Research, industry and training enquiries.", href: "/engagement/collaborate" },
    ],
    footer: "© 2026 COE-UAS",
  },
};

/* Today: returns the defaults. Later: merge an API response over them. */
export function useAboutContent(override) {
  return useMemo(() => ({ content: { ...defaultAboutContent, ...override } }), [override]);
}

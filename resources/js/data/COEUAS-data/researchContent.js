/* ==========================================================================
   researchContent.js: the ONLY place to edit Research page content.

   Research.jsx is layout only. To add, edit or delete anything, change one
   entry in an array below. Nothing else needs touching.

   - Every record has a unique `id` (later: the database primary key).
   - Records point to each other by id (project.group -> groups[].id).
   - Counts, totals and filter numbers are calculated, never typed in.
   - Everything marked SAMPLE is placeholder data. Replace before launch.

   LATER (admin CMS): change useResearchContent() at the bottom to fetch
   the same shape from your API. The page does not need to change.

   Section ids match the site map and the admin {section} names:
   groups | projects | grants | innovation | opportunities | featured-programmes
   Filter ids are the chip ids from siteMapCOEUAS.js, so links such as
   /coeuas/research#projects-ongoing open the page with that filter on.
========================================================================== */
import { useMemo } from "react";

/* ----- page structure: order, nav label, visibility, colour tone ----- */
const sections = [
  { id: "hero", label: "Overview", visible: true },
  { id: "groups", label: "Research groups", visible: true, nav: true, tone: "dark" },
  { id: "projects", label: "Projects", visible: true, nav: true, tone: "light" },
  { id: "grants", label: "Grants", visible: true, nav: true, tone: "navy" },
  { id: "innovation", label: "Innovation and IP", visible: true, nav: true, tone: "dark" },
  { id: "opportunities", label: "Opportunities", visible: true, nav: true, tone: "light" },
  { id: "featured-programmes", label: "Featured programmes", visible: true, nav: true, tone: "blue" },
  { id: "cta", label: "Get involved", visible: true },
];

/* ----- hero. Stats are calculated from the data below.
       source: groups | projects | ongoing | grants | grantValue | patents ----- */
const hero = {
  eyebrow: "Research and innovation",
  headline: ["Ideas engineered", "for the real world."],
  highlight: "for the real world.",
  lead: "Our research groups, projects, grants and technology, with the status and outputs of each in one place.",
  image: null, // e.g. "/images/research/hero.jpg" (optional)
  primary: { label: "Browse projects", target: "projects" },
  secondary: { label: "Collaborate with us", href: "/collaborate" },
  caption: { place: "COE-UAS", note: "Sample figures shown" },
  stats: [
    { label: "Research groups", source: "groups", note: "Each with its own focus and lead" },
    { label: "Projects", source: "projects", note: "Ongoing, completed, joint and industry" },
    { label: "Ongoing now", source: "ongoing", note: "Projects currently running" },
    { label: "Grant value", source: "grantValue", suffix: "M", decimals: 1, note: "Total across listed grants (RM)" },
  ],
};

const ticker = ["Unmanned aerial systems", "Autonomy and control", "Sensing and mapping", "Airspace integration", "Technology transfer"];

/* ----- 01 RESEARCH GROUPS ----- */
const groupsSection = {
  title: "Research areas and groups",
  text: "Six teams, each with a clear focus. Pick a group to see its projects.",
  viewLabel: "View projects",
};
const groups = [ // SAMPLE
  { id: "autonomy", name: "Autonomy and Control", lead: "Dr. Lead One", summary: "Flight control, path planning and decision-making for unmanned aircraft.", focus: ["Guidance and control", "Path planning", "Fault tolerance"], members: 12 },
  { id: "sensing", name: "Sensing and Mapping", lead: "Dr. Lead Two", summary: "Cameras, multispectral and LiDAR payloads, and what they reveal from the air.", focus: ["Photogrammetry", "Remote sensing", "Computer vision"], members: 9 },
  { id: "airspace", name: "Airspace and Regulation", lead: "Dr. Lead Three", summary: "Safe integration of drones into shared airspace, and the rules that enable it.", focus: ["Detect and avoid", "Traffic management", "Policy"], members: 7 },
  { id: "platforms", name: "Platforms and Propulsion", lead: "Dr. Lead Four", summary: "Airframes, batteries and propulsion for endurance, payload and reliability.", focus: ["Structures", "Energy systems", "Cargo vehicles"], members: 10 },
];

/* ----- 02 PROJECTS
   status: ongoing | completed      type: internal | joint | industry
   group: id from groups   outputs: number of papers, patents or reports ----- */
const projectsSection = {
  title: "Research projects",
  text: "Search or filter by status. Every card shows who leads it, who funds it and when it runs.",
  searchPlaceholder: "Search projects",
  groupLabel: "Research group",
  allGroups: "All groups",
  empty: "No project matches these filters.",
  clear: "Clear filters",
  cta: "Register interest",
  filters: [
    { id: "all", label: "All" },
    { id: "ongoing", label: "Ongoing", field: "status" },
    { id: "completed", label: "Completed", field: "status" },
    { id: "joint", label: "Joint", field: "type" },
    { id: "industry", label: "Industry", field: "type" },
  ],
};
const projects = [ // SAMPLE
  { id: "p1", title: "Trajectory planning in restricted airspace", group: "autonomy", status: "ongoing", type: "internal", lead: "Dr. Lead One", partner: "", funder: "Ministry of Higher Education", start: 2024, end: null, outputs: 3, summary: "Planning methods that keep fixed-wing aircraft inside approved corridors." },
  { id: "p2", title: "Vision-based landing on moving platforms", group: "autonomy", status: "completed", type: "joint", lead: "Dr. Lead One", partner: "Partner University A", funder: "Research grant", start: 2021, end: 2024, outputs: 5, summary: "Camera-only landing on a moving vessel in changing light and wind." },
  { id: "p3", title: "Crop stress mapping from low-altitude flights", group: "sensing", status: "ongoing", type: "industry", lead: "Dr. Lead Two", partner: "Plantation Co.", funder: "Industry contract", start: 2025, end: null, outputs: 1, summary: "Multispectral surveys that flag stressed crops weeks before they are visible." },
  { id: "p4", title: "Heritage structure documentation", group: "sensing", status: "completed", type: "internal", lead: "Dr. Lead Two", partner: "", funder: "University fund", start: 2019, end: 2022, outputs: 4, summary: "3D records of heritage buildings built from drone photography." },
  { id: "p5", title: "Detect-and-avoid for small aircraft", group: "airspace", status: "ongoing", type: "joint", lead: "Dr. Lead Three", partner: "Aviation Authority", funder: "Government grant", start: 2023, end: null, outputs: 6, summary: "A sensing and decision architecture for avoiding other aircraft." },
  { id: "p6", title: "Regulatory sandbox trial design", group: "airspace", status: "ongoing", type: "joint", lead: "Dr. Lead Three", partner: "State agency", funder: "Government grant", start: 2025, end: null, outputs: 2, summary: "Trial rules and safety cases for testing new aviation technology." },
  { id: "p7", title: "Battery endurance for cargo missions", group: "platforms", status: "completed", type: "industry", lead: "Dr. Lead Four", partner: "Logistics Co.", funder: "Industry contract", start: 2022, end: 2025, outputs: 3, summary: "Energy models that predict range for multirotor cargo flights." },
  { id: "p8", title: "Lightweight airframe structures", group: "platforms", status: "ongoing", type: "internal", lead: "Dr. Lead Four", partner: "", funder: "University fund", start: 2025, end: null, outputs: 0, summary: "Composite airframes tuned for payload and manufacturing cost." },
];

/* ----- 03 GRANTS (amount in the stated currency) ----- */
const grantsSection = {
  title: "Research grants",
  text: "Funder, lead, duration and value for every grant. Search by title, funder or lead.",
  searchPlaceholder: "Search grants",
  empty: "No grant matches this search.",
  clear: "Clear filters",
  totalLabel: "Total value shown",
  columns: { grant: "Grant", funder: "Funder", lead: "Lead", period: "Period", amount: "Amount", status: "Status" },
  filters: [
    { id: "all", label: "All" },
    { id: "ongoing", label: "Ongoing", field: "status" },
    { id: "completed", label: "Completed", field: "status" },
  ],
};
const grants = [ // SAMPLE
  { id: "g1", title: "Airspace integration for small unmanned aircraft", funder: "Ministry of Higher Education", lead: "Dr. Lead Three", start: 2023, end: 2027, amount: 1200000, currency: "RM", status: "ongoing", outputs: 6 },
  { id: "g2", title: "Autonomous landing systems", funder: "National research fund", lead: "Dr. Lead One", start: 2021, end: 2024, amount: 850000, currency: "RM", status: "completed", outputs: 5 },
  { id: "g3", title: "Precision agriculture sensing", funder: "Industry partner", lead: "Dr. Lead Two", start: 2025, end: 2027, amount: 640000, currency: "RM", status: "ongoing", outputs: 1 },
  { id: "g4", title: "Cargo UAS energy systems", funder: "Industry partner", lead: "Dr. Lead Four", start: 2022, end: 2025, amount: 480000, currency: "RM", status: "completed", outputs: 3 },
  { id: "g5", title: "Heritage digital documentation", funder: "University fund", lead: "Dr. Lead Two", start: 2019, end: 2022, amount: 150000, currency: "RM", status: "completed", outputs: 4 },
  { id: "g6", title: "Lightweight composite airframes", funder: "University fund", lead: "Dr. Lead Four", start: 2025, end: 2026, amount: 200000, currency: "RM", status: "ongoing", outputs: 0 },
];

/* ----- 04 INNOVATION AND IP.  kind = filter id ----- */
const innovationSection = {
  title: "Innovation and IP",
  text: "Prototypes, patents and technology we have moved out of the lab.",
  empty: "Nothing listed in this category yet.",
  filters: [
    { id: "all", label: "All" },
    { id: "prototypes", label: "Prototypes", field: "kind" },
    { id: "patents", label: "Patents and designs", field: "kind" },
    { id: "technology-transfer", label: "Technology transfer", field: "kind" },
  ],
};
const innovation = [ // SAMPLE
  { id: "i1", kind: "prototypes", title: "Fixed-wing survey aircraft", text: "Long-endurance airframe for mapping large areas.", meta: ["TRL 6", "Tested in the field"] },
  { id: "i2", kind: "prototypes", title: "Vision landing module", text: "Add-on unit that lands a multirotor on a moving deck.", meta: ["TRL 5"] },
  { id: "i3", kind: "patents", title: "Method for corridor-constrained path planning", text: "Planning method that keeps aircraft inside approved corridors.", meta: ["Patent filed", "Ref. to be added"] },
  { id: "i4", kind: "patents", title: "Quick-release payload mount", text: "Registered design for swapping sensors without tools.", meta: ["Registered design"] },
  { id: "i5", kind: "technology-transfer", title: "Crop stress analysis service", text: "Licensed to a plantation partner for routine surveys.", meta: ["Licensed", "2025"] },
  { id: "i6", kind: "technology-transfer", title: "Cargo range planner", text: "Software that predicts battery range for cargo missions.", meta: ["Industry pilot"] },
];

/* ----- 05 OPPORTUNITIES.  kind = filter id ----- */
const opportunitiesSection = {
  title: "Research opportunities",
  text: "Open topics, industry challenges and places for postgraduates and postdoctoral researchers.",
  empty: "Nothing open in this category right now.",
  defaultCta: { label: "Enquire", href: "/contact#research-enquiry" },
  filters: [
    { id: "all", label: "All" },
    { id: "research-topics", label: "Research topics", field: "kind" },
    { id: "industry-challenges", label: "Industry challenges", field: "kind" },
    { id: "postgraduate-places", label: "Postgraduate and postdoc", field: "kind" },
  ],
};
const opportunities = [ // SAMPLE
  { id: "o1", kind: "research-topics", title: "Safe autonomy near people", text: "How should a drone behave when a person walks into its landing zone?", tag: "Open topic", detail: "Autonomy and Control" },
  { id: "o2", kind: "research-topics", title: "Low-cost multispectral sensing", text: "Reaching useful crop data with cheaper cameras.", tag: "Open topic", detail: "Sensing and Mapping" },
  { id: "o3", kind: "industry-challenges", title: "Inspect a tall structure without scaffolding", text: "An industry-posed challenge on repeatable, close-range inspection.", tag: "Challenge", detail: "Open to industry partners" },
  { id: "o4", kind: "postgraduate-places", title: "PhD place: detect and avoid", text: "Fully funded place on the airspace programme.", tag: "PhD", detail: "Closes 31 January 2027", href: "/contact#research-enquiry" },
  { id: "o5", kind: "postgraduate-places", title: "Postdoctoral fellow: energy systems", text: "Two-year post on battery and propulsion research.", tag: "Postdoc", detail: "Apply any time" },
];

/* ----- 06 FEATURED PROGRAMMES ----- */
const programmesSection = {
  title: "Featured programmes",
  text: "Major initiatives led by the centre.",
  moreLabel: "Learn more",
};
const programmes = [ // SAMPLE
  { id: "sandbox", name: "Perlis Airspace Sandbox", status: "Open now", summary: "A regulated test site where new aviation technology can be flown, measured and approved.", highlights: ["About 30 hectares beside the runway", "Open calls for industry and researchers", "Trial design supported by the centre"], facts: [{ label: "Phases", value: "3" }, { label: "Partners", value: "12" }], href: "/", internal: true },
  { id: "other", name: "Other initiatives", status: "In development", summary: "Smaller programmes that grow out of the research groups.", highlights: ["Technology transfer clinics", "Student drone challenge"], facts: [], href: "" },
];

/* ----- closing call to action ----- */
const cta = {
  title: "Work with our researchers.",
  text: "Start a project, join a group or take a challenge to the lab.",
  footer: "We reply to every enquiry.",
  items: [
    { id: "c1", title: "Collaborate with us", text: "Research, industry or partnership", href: "/collaborate" },
    { id: "c2", title: "Ask about a place", text: "Postgraduate and postdoctoral", href: "/contact#research-enquiry" },
    { id: "c3", title: "Read the publications", text: "What the work has produced", href: "/publications" },
  ],
};

/* ----- status labels used by the pills ----- */
const statuses = {
  ongoing: "Ongoing",
  completed: "Completed",
};

export const researchContent = {
  settings: {},
  sections, hero, ticker, statuses,
  groupsSection, groups,
  projectsSection, projects,
  grantsSection, grants,
  innovationSection, innovation,
  opportunitiesSection, opportunities,
  programmesSection, programmes,
  cta,
};

/* Single entry point for the page. Later: fetch from the admin API here. */
export function useResearchContent(override) {
  const content = useMemo(() => override || researchContent, [override]);
  return { content };
}

/* Optional image helper. Change here if images are served from storage. */
export const assetUrl = (path) => (path ? path : "");

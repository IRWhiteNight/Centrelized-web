/* ------------------------------------------------------------------
   publicationsContent.js: the ONE place that holds data for the page.

   Publications.jsx contains layout and motion only. To add, edit or
   delete anything, change it here (later: the admin CMS returns the
   same shape, and you pass it in as the `content` prop or swap the
   body of usePublicationsContent for an Inertia prop / fetch).

   Collections (each has a stable `id`, so a CMS can CRUD them):
     publications  one record per paper, book, report ...
     members       people who appear in the citation table / filters
     groups        research groups (archive filter)
     types         the four publication types
     yearly        per-year totals (publications, citations) for the charts
     highlights    annual highlights, one block per year
   Single blocks: settings, sections, hero, indicators, texts, cta, ticker.

   Everything marked SAMPLE is placeholder data. Replace before launch.
------------------------------------------------------------------- */

export const TYPES = [
  { id: "journal", label: "Journal articles", tab: "Journals", chip: "journal-articles", text: "Peer-reviewed articles on aerial systems, autonomy, sensing and their applications." },
  { id: "conference", label: "Conference papers", tab: "Conferences", chip: "conference-papers", text: "Papers presented and published in conference proceedings." },
  { id: "book", label: "Books and chapters", tab: "Books", chip: "books-chapters", text: "Books, book chapters and edited volumes written by Centre members." },
  { id: "other", label: "Reports and other works", tab: "Other", chip: "other-publications", text: "Technical reports, editorial works and other publications." },
];

export const STATUSES = [
  { id: "published", label: "Published" },
  { id: "in-press", label: "In press" },
  { id: "submitted", label: "Submitted" },
];

export const GROUPS = [ // SAMPLE
  { id: "autonomy", label: "Autonomy and control" },
  { id: "sensing", label: "Sensing and mapping" },
  { id: "airspace", label: "Airspace and policy" },
  { id: "platforms", label: "Platforms and energy" },
];

export const MEMBERS = [ // SAMPLE. citations / hIndex come from Scopus
  { id: "m1", name: "Author A", group: "autonomy", pubs: 41, citations: 1260, hIndex: 21 },
  { id: "m2", name: "Author B", group: "sensing", pubs: 36, citations: 1105, hIndex: 19 },
  { id: "m3", name: "Author C", group: "airspace", pubs: 29, citations: 840, hIndex: 16 },
  { id: "m4", name: "Author D", group: "platforms", pubs: 24, citations: 612, hIndex: 14 },
  { id: "m5", name: "Author E", group: "sensing", pubs: 18, citations: 377, hIndex: 10 },
  { id: "m6", name: "Author F", group: "autonomy", pubs: 12, citations: 186, hIndex: 7 },
];

/* SAMPLE entries. url is optional (DOI or repository link). */
export const PUBLICATIONS = [
  { id: 1, type: "journal", year: 2025, cites: 18, status: "published", group: "airspace", members: ["m1", "m3"], authors: ["Author A", "Author C"], venue: "Journal name", title: "Trajectory planning for fixed-wing UAS in restricted airspace", url: "" },
  { id: 2, type: "journal", year: 2024, cites: 41, status: "published", group: "autonomy", members: ["m1", "m6"], authors: ["Author A", "Author F"], venue: "Journal name", title: "Vision-based landing on a moving platform", url: "" },
  { id: 3, type: "journal", year: 2022, cites: 87, status: "published", group: "sensing", members: ["m2", "m5"], authors: ["Author B", "Author E"], venue: "Journal name", title: "Multispectral crop stress mapping from low-altitude flights", url: "" },
  { id: 4, type: "conference", year: 2023, cites: 22, status: "published", group: "platforms", members: ["m4"], authors: ["Author D"], venue: "Conference name", title: "Battery endurance modelling for multirotor cargo missions", url: "" },
  { id: 5, type: "conference", year: 2021, cites: 64, status: "published", group: "airspace", members: ["m3", "m1"], authors: ["Author C", "Author A"], venue: "Conference name", title: "A detect-and-avoid architecture for small unmanned aircraft", url: "" },
  { id: 6, type: "journal", year: 2020, cites: 73, status: "published", group: "sensing", members: ["m2"], authors: ["Author B"], venue: "Journal name", title: "Photogrammetric documentation of heritage structures", url: "" },
  { id: 7, type: "book", year: 2019, cites: 31, status: "published", group: "airspace", members: ["m3"], authors: ["Author C"], venue: "Publisher name", title: "Safe integration of drones into low-level airspace", url: "" },
  { id: 8, type: "book", year: 2018, cites: 56, status: "published", group: "platforms", members: ["m4", "m2"], authors: ["Author D", "Author B"], venue: "Publisher name", title: "Unmanned Aerial Systems: A Practitioner Guide", url: "" },
  { id: 9, type: "other", year: 2026, cites: 2, status: "in-press", group: "airspace", members: ["m3"], authors: ["Author C"], venue: "Technical report", title: "Trial design report for the Perlis Airspace Sandbox", url: "" },
  { id: 10, type: "conference", year: 2022, cites: 38, status: "published", group: "autonomy", members: ["m6", "m1"], authors: ["Author F", "Author A"], venue: "Conference name", title: "Edge inference for onboard object detection", url: "" },
  { id: 11, type: "other", year: 2024, cites: 12, status: "published", group: "airspace", members: ["m3"], authors: ["Author C"], venue: "Policy brief", title: "Regulatory sandboxes for emerging aviation technology", url: "" },
  { id: 12, type: "journal", year: 2017, cites: 129, status: "published", group: "autonomy", members: ["m1"], authors: ["Author A"], venue: "Journal name", title: "Wind disturbance rejection in quadrotor control", url: "" },
  { id: 13, type: "journal", year: 2026, cites: 0, status: "submitted", group: "platforms", members: ["m4", "m5"], authors: ["Author D", "Author E"], venue: "Journal name", title: "Hybrid-electric propulsion for long-endurance survey aircraft", url: "" },
  { id: 14, type: "conference", year: 2019, cites: 27, status: "published", group: "sensing", members: ["m5"], authors: ["Author E"], venue: "Conference name", title: "Low-cost LiDAR mapping of plantation canopies", url: "" },
];

export const YEARLY = [ // SAMPLE, 2013 to 2026
  { year: 2013, pubs: 6, cites: 20 }, { year: 2014, pubs: 9, cites: 60 }, { year: 2015, pubs: 12, cites: 130 },
  { year: 2016, pubs: 14, cites: 210 }, { year: 2017, pubs: 16, cites: 320 }, { year: 2018, pubs: 18, cites: 430 },
  { year: 2019, pubs: 20, cites: 540 }, { year: 2020, pubs: 22, cites: 640 }, { year: 2021, pubs: 24, cites: 740 },
  { year: 2022, pubs: 26, cites: 820 }, { year: 2023, pubs: 27, cites: 880 }, { year: 2024, pubs: 28, cites: 860 },
  { year: 2025, pubs: 20, cites: 700 }, { year: 2026, pubs: 13, cites: 360 },
];

export const HIGHLIGHTS = [ // SAMPLE. kind: Award | Paper | Milestone | Funding
  {
    year: 2026,
    summary: "The Centre moved from planning to live trials, and the first trial reports reached print.",
    items: [
      { id: "h26a", kind: "Milestone", title: "Perlis Airspace Sandbox trial design published", text: "The first report describing how trials are designed and approved.", href: "" },
      { id: "h26b", kind: "Paper", title: "Hybrid-electric propulsion study submitted", text: "A study of long-endurance survey aircraft is now under review.", href: "" },
    ],
  },
  {
    year: 2025,
    summary: "A year of airspace research, led by work on trajectory planning in restricted areas.",
    items: [
      { id: "h25a", kind: "Paper", title: "Trajectory planning in restricted airspace", text: "Published in a leading aerospace journal.", href: "" },
      { id: "h25b", kind: "Award", title: "Best paper award", text: "Recognised at an international UAS conference.", href: "" },
    ],
  },
  {
    year: 2024,
    summary: "Vision-based landing and regulatory sandboxes drew the most attention.",
    items: [
      { id: "h24a", kind: "Paper", title: "Vision-based landing on a moving platform", text: "Cited 41 times in its first two years.", href: "" },
      { id: "h24b", kind: "Milestone", title: "Policy brief on regulatory sandboxes", text: "Shared with aviation regulators.", href: "" },
    ],
  },
  {
    year: 2022,
    summary: "Agricultural sensing research found its widest audience.",
    items: [
      { id: "h22a", kind: "Paper", title: "Multispectral crop stress mapping", text: "The most cited paper of the year, with 87 citations.", href: "" },
    ],
  },
];

export const CONTENT = {
  settings: { pageSize: 8, archivePageSize: 12, source: "Scopus", updated: "1 November 2026" }, // SAMPLE

  /* order and visibility of sections. ids match the site map anchors:
     /coeuas/publications#publications | #citations | #highlights | #archive */
  sections: [
    { id: "hero", visible: true },
    { id: "publications", label: "Publications", visible: true, nav: true, tone: "dark" },
    { id: "citations", label: "Citations and impact", visible: true, nav: true, tone: "navy" },
    { id: "highlights", label: "Annual highlights", visible: true, nav: true, tone: "light" },
    { id: "archive", label: "Research archive", visible: true, nav: true, tone: "dark" },
    { id: "cta", visible: true },
  ],

  hero: {
    image: "", // optional, e.g. "/images/coeuas/publications-hero.jpg"
    eyebrow: "Publications and impact",
    headline: ["Thirteen years", "of research,", "in print."],
    highlight: "in print.",
    lead: "Articles, papers, books and reports from the Centre, with the citations that show where they landed.",
    primary: { label: "Browse publications", target: "publications" },
    secondary: { label: "Search the archive", target: "archive" },
    stats: [ // value is managed here (from Scopus), so it matches the official count
      { label: "Publications", value: 255, note: "Since 2013" },
      { label: "Citations", value: 7110, note: "All sources combined" },
      { label: "h-index", value: 38, note: "Centre level" },
      { label: "Active members", value: 64, note: "Researchers and fellows" },
    ],
  },

  ticker: ["Journal articles", "Conference papers", "Books and chapters", "Technical reports", "Citations", "Annual highlights", "Research archive 2013 to 2026"],

  texts: {
    publications: {
      title: "Find a publication.",
      text: "Search by title, author or venue. Filter by type and sort by year or citations.",
      searchPlaceholder: "Search title, author or venue",
      allLabel: "All",
      empty: "No publications match your search. Try fewer words, or clear the filters.",
      more: "Show more",
      clear: "Clear filters",
    },
    citations: {
      title: "Where the work landed.",
      text: "Centre-wide indicators, the trend by year and the citation profile of each member.",
      indicatorsTitle: "Centre indicators",
      membersTitle: "Member citation profiles",
      profileLink: "View profile",
    },
    highlights: {
      title: "Year by year.",
      text: "Awards, major papers and milestones, one year at a time.",
      empty: "No highlights have been added for this year yet.",
    },
    archive: {
      title: "Search the archive.",
      text: "Every record from 2013 to 2026. Narrow it by year, member, group or status.",
      searchPlaceholder: "Search the archive",
      empty: "No records match these filters.",
      more: "Show more records",
      clear: "Clear filters",
    },
  },

  indicators: [ // shown at the top of the citations section
    { label: "Total citations", value: 7110 },
    { label: "Publications", value: 255 },
    { label: "h-index", value: 38 },
    { label: "i10-index", value: 112 },
  ],

  cta: {
    title: "Keep exploring.",
    text: "The papers are the end of the story. See the work and the people behind them.",
    footer: "",
    items: [
      { id: "c1", title: "Research and innovation", text: "Projects, grants and programmes behind the papers.", href: "/research" },
      { id: "c2", title: "People", text: "The researchers and fellows who wrote them.", href: "/people" },
      { id: "c3", title: "Collaborate with us", text: "Start a research, industry or partnership project.", href: "/collaborate" },
    ],
  },

  types: TYPES,
  statuses: STATUSES,
  groups: GROUPS,
  members: MEMBERS,
  publications: PUBLICATIONS,
  yearly: YEARLY,
  highlights: HIGHLIGHTS,
};

/* Hook used by the page. Pass `override` to preview changes (it replaces
   top-level keys). Replace the body later with data from the admin CMS. */
export function usePublicationsContent(override) {
  return { content: override ? { ...CONTENT, ...override } : CONTENT };
}

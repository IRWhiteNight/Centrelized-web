import { useEffect, useState } from "react";

/* ------------------------------------------------------------------
   PEOPLE PAGE CONTENT: everything an admin would edit.
   People.jsx contains NO text, links, images or numbers of its own.

   HOW TO MAINTAIN
   ADD a person      -> add one object to `people` (copy any existing one).
   UPDATE a person   -> edit that object.
   DELETE a person   -> remove that object.
   Leadership cards, the directory, the "Next generation" rail, the
   filter counts and the hero numbers all update by themselves.

   ADD a category    -> add one entry to `groups`, then use its id in
                        `group` on the people who belong to it.
   HIDE / REORDER a section -> edit `sections` (visible, order, tone).

   Photos go in public/images/coe-uas/people/ . Use the file name
   ("leadership/1.jpg"), or a full path / URL. No photo = placeholder.

   LATER (admin CMS): set PEOPLE_CONTENT_URL. The API only needs to
   return the parts that changed. Arrays are replaced whole.
------------------------------------------------------------------- */
export const PEOPLE_CONTENT_URL = null; // e.g. "/api/pages/people"

export const IMG = "/images/coe-uas/people/";

/* "leadership/1.jpg" -> "/images/coe-uas/people/leadership/1.jpg" */
export const photoUrl = (p) => {
  const f = p && (p.photo || p.image);
  if (!f) return "";
  return /^(\/|https?:|data:)/.test(f) ? f : IMG + f;
};

/* TODO: replace every sample person with real data (later: from the database). */
export const defaultPeopleContent = {
  settings: {
    showSlotHints: true, // true = empty photo slots show "Image slot" hints; set false before launch
  },

  /* order = order on the page. tone: dark | navy | light | blue
     nav:false keeps a section out of the sticky menu. */
  sections: [
    { id: "hero", label: "Our people", visible: true, nav: false },
    { id: "leadership", label: "Leadership", visible: true, tone: "light" },
    { id: "directory", label: "Directory", visible: true, tone: "dark" },
    { id: "early", label: "Next generation", visible: true, tone: "blue" },
    { id: "cta", label: "Join us", visible: true, tone: "dark" },
  ],

  hero: {
    eyebrow: "People",
    headline: ["The minds behind", "every flight."],
    highlight: "every flight.",
    lead: "Researchers, engineers, fellows and students working together to make unmanned aerial systems safer, smarter and useful.",
    image: "", // optional wide photo, e.g. "hero.jpg"
    primary: { label: "Browse the directory", target: "directory" },
    secondary: { label: "Join the team", href: "/research/opportunities" },
    caption: { place: "COE-UAS", note: "Centre of Excellence for Unmanned Aerial Systems" },
    /* value = fixed number | group = counts people in that group | all = counts everyone */
    stats: [
      { all: true, suffix: "", label: "people in the centre", note: "Researchers, fellows and students" },
      { group: "fellow", suffix: "", label: "research fellows", note: "Leading the research groups" },
      { group: "postgrad", suffix: "", label: "postgraduate students", note: "PhD and Master's candidates" },
      { value: 12, suffix: "", label: "countries of collaboration", note: "Partners around the world" },
    ],
  },

  ticker: [
    "Research", "Engineering", "Innovation", "Flight", "Mentors", "Fellows", "Scholars", "Pilots", "Collaboration",
  ],

  /* id = used in filters and on person cards.
     tab = filter button label, label = full title on cards, tag = short chip in the rail. */
  groups: [
    { id: "leadership", tab: "Leadership", label: "Leadership", tag: "Leadership" },
    { id: "fellow", tab: "Research Fellows", label: "Research Fellow", tag: "Fellow" },
    { id: "advisory", tab: "Industry Advisory", label: "Industry Advisory Fellow", tag: "Advisory" },
    { id: "postdoc", tab: "Postdoctoral", label: "Postdoctoral Researcher", tag: "Postdoctoral" },
    { id: "postgrad", tab: "Postgraduate", label: "Postgraduate Student", tag: "Postgraduate" },
  ],

  /* ONE list for the whole page.
     id      unique, used in the profile link /people/member/<id>
     group   one of the group ids above
     name, role, area   shown on cards
     bio     optional, shown on leadership cards
     topic   optional, shown on the Next generation rail (falls back to area)
     tag     optional, overrides the group tag on the rail (e.g. "PhD")
     photo   optional, file name inside public/images/coe-uas/people/  */
  people: [
    { id: "leader-1", group: "leadership", name: "Prof. Name Surname", role: "Director", area: "Autonomous flight systems", bio: "Leads the Centre's strategy and its partnerships with government and industry.", photo: "leadership/1.jpg" },
    { id: "leader-2", group: "leadership", name: "Assoc. Prof. Name Surname", role: "Deputy Director, Research", area: "Robotics and control", bio: "Oversees research groups, grants and publications.", photo: "leadership/2.jpg" },
    { id: "leader-3", group: "leadership", name: "Dr. Name Surname", role: "Head of Facilities and Services", area: "Flight operations and training", bio: "Runs the test sites, equipment and training programmes.", photo: "leadership/3.jpg" },

    { id: "fellow-1", group: "fellow", name: "Dr. Name Surname", role: "Research Fellow", area: "Computer vision", photo: "fellows/1.jpg" },
    { id: "fellow-2", group: "fellow", name: "Dr. Name Surname", role: "Research Fellow", area: "Photogrammetry and mapping", photo: "fellows/2.jpg" },
    { id: "fellow-3", group: "fellow", name: "Dr. Name Surname", role: "Research Fellow", area: "Precision agriculture", photo: "fellows/3.jpg" },

    { id: "advisory-1", group: "advisory", name: "Name Surname", role: "Industry Advisory Fellow", area: "Airspace regulation", photo: "advisory/1.jpg" },
    { id: "advisory-2", group: "advisory", name: "Name Surname", role: "Industry Advisory Fellow", area: "Cargo and logistics", photo: "advisory/2.jpg" },

    { id: "postdoc-1", group: "postdoc", name: "Dr. Name Surname", role: "Postdoctoral Researcher", area: "Swarm coordination", topic: "Swarm coordination for search and rescue", photo: "postdoc/1.jpg" },
    { id: "postdoc-2", group: "postdoc", name: "Dr. Name Surname", role: "Postdoctoral Researcher", area: "Battery and propulsion", topic: "Lightweight batteries for long endurance", photo: "postdoc/2.jpg" },

    { id: "postgrad-1", group: "postgrad", name: "Name Surname", role: "PhD Candidate", area: "Obstacle avoidance", topic: "Real-time obstacle avoidance", tag: "PhD", photo: "postgrad/1.jpg" },
    { id: "postgrad-2", group: "postgrad", name: "Name Surname", role: "Master's Student", area: "Remote sensing", topic: "Remote sensing for crop health", tag: "Master's", photo: "postgrad/2.jpg" },
    { id: "postgrad-3", group: "postgrad", name: "Name Surname", role: "PhD Candidate", area: "Computer vision", topic: "Safe landing with computer vision", tag: "PhD", photo: "postgrad/3.jpg" },
    { id: "postgrad-4", group: "postgrad", name: "Name Surname", role: "Master's Student", area: "3D mapping", topic: "Mapping heritage sites in 3D", tag: "Master's", photo: "postgrad/4.jpg" },
  ],

  /* the group whose people appear as big cards */
  leadership: {
    eyebrow: "Leadership",
    title: "Guided by experience.",
    text: "The people who set the direction of the Centre and carry its research into industry and policy.",
    group: "leadership",
    cardLink: "View profile",
  },

  directory: {
    eyebrow: "Directory",
    title: "Find the right person.",
    text: "Filter by category or search by name, role or research area.",
    allLabel: "Everyone",
    searchPlaceholder: "Search by name or research area",
    empty: "No one matches that search yet.",
    clear: "Clear filters",
  },

  /* the groups whose people appear in the scrolling rail */
  early: {
    eyebrow: "Next generation",
    title: "Where new ideas take off.",
    text: "Drag or use the arrows to meet our postdoctoral researchers and postgraduate students.",
    groups: ["postdoc", "postgrad"],
  },

  cta: {
    title: "Want to work with us?",
    text: "We welcome postgraduate students, postdoctoral researchers and industry collaborators.",
    items: [
      { id: "c1", title: "Open positions", text: "Postgraduate and postdoctoral calls.", href: "/research/opportunities" },
      { id: "c2", title: "Collaborate", text: "Research, industry and training enquiries.", href: "/collaborate" },
      { id: "c3", title: "Get in touch", text: "Talk to the team directly.", href: "/contact" },
    ],
    footer: "© 2026 COE-UAS",
  },
};

const merge = (base, patch = {}) => {
  const out = { ...base };
  for (const k of Object.keys(patch)) {
    const b = base[k], p = patch[k];
    out[k] = b && p && typeof b === "object" && typeof p === "object" && !Array.isArray(b) && !Array.isArray(p) ? { ...b, ...p } : p;
  }
  return out;
};

export function usePeopleContent(override) {
  const [content, setContent] = useState(() => merge(defaultPeopleContent, override));
  const [status, setStatus] = useState(PEOPLE_CONTENT_URL ? "loading" : "ready");

  useEffect(() => {
    if (!PEOPLE_CONTENT_URL) return;
    const ctrl = new AbortController();
    fetch(PEOPLE_CONTENT_URL, { signal: ctrl.signal })
      .then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then((data) => { setContent(merge(defaultPeopleContent, data)); setStatus("ready"); })
      .catch((e) => { if (e.name !== "AbortError") setStatus("error"); });
    return () => ctrl.abort();
  }, []);

  return { content, status };
}

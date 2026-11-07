import { useEffect, useState } from "react";

/* ------------------------------------------------------------------
   PEOPLE PAGE CONTENT: everything an admin would edit.
   People.jsx contains NO text, links, images or numbers of its own.
   Same slot system as homeContent.js:
     { type: "image" | "video", src, alt?, note? }
   Files go in public/images/coe-uas/people/ (see IMG below).

   Groups match the admin sections (admin/coeuas/people):
     members -> leadership, profiles -> fellow / advisory,
     postdoctoral -> postdoc, postgraduate -> postgrad.

   LATER (admin CMS): set PEOPLE_CONTENT_URL. The API only needs to return the
   parts that changed. Arrays and slot objects are replaced whole.
------------------------------------------------------------------- */
export const PEOPLE_CONTENT_URL = null; // e.g. "/api/pages/people"

const IMG = "/images/coe-uas/people/";
const image = (file, note, alt = "") => ({ type: "image", src: IMG + file, alt, note });

/* TODO: replace every sample person with real data (later: from the database). */
export const defaultPeopleContent = {
  sections: [
    { id: "hero", label: "Our people", visible: true },
    { id: "leadership", label: "Leadership", visible: true },
    { id: "directory", label: "Directory", visible: true },
    { id: "early", label: "Next generation", visible: true },
    { id: "cta", label: "Join us", visible: true },
  ],

  hero: {
    eyebrow: "People",
    headline: "The minds behind every flight.",
    lead: "Researchers, engineers, fellows and students working together to make unmanned aerial systems safer, smarter and useful.",
    primary: { label: "Browse the directory", target: "directory" },
    secondary: { label: "Join the team", href: "/research/opportunities" },
    stats: [
      { value: 40, suffix: "+", label: "researchers and fellows" },
      { value: 25, suffix: "+", label: "postgraduate students" },
      { value: 8, suffix: "", label: "research groups" },
      { value: 12, suffix: "", label: "countries of collaboration" },
    ],
  },

  bridges: [
    "Research · Engineering · Innovation · Flight ·",
    "Mentors · Fellows · Scholars · Pilots ·",
    "Curious · Bold · Collaborative · Precise ·",
  ],

  leadership: {
    eyebrow: "Leadership",
    title: "Guided by experience.",
    text: "The people who set the direction of the Centre and carry its research into industry and policy.",
    items: [
      { id: "leader-1", name: "Prof. Name Surname", role: "Director", area: "Autonomous flight systems", bio: "Leads the Centre's strategy and its partnerships with government and industry.", media: image("leadership/1.jpg", "Portrait, 4:5") },
      { id: "leader-2", name: "Assoc. Prof. Name Surname", role: "Deputy Director, Research", area: "Robotics and control", bio: "Oversees research groups, grants and publications.", media: image("leadership/2.jpg", "Portrait, 4:5") },
      { id: "leader-3", name: "Dr. Name Surname", role: "Head of Facilities and Services", area: "Flight operations and training", bio: "Runs the test sites, equipment and training programmes.", media: image("leadership/3.jpg", "Portrait, 4:5") },
    ],
  },

  directory: {
    eyebrow: "Directory",
    title: "Find the right person.",
    searchPlaceholder: "Search by name or research area",
    empty: "No one matches that search yet.",
    filters: [
      { id: "all", label: "Everyone" },
      { id: "leadership", label: "Leadership" },
      { id: "fellow", label: "Research Fellows" },
      { id: "advisory", label: "Industry Advisory" },
      { id: "postdoc", label: "Postdoctoral" },
      { id: "postgrad", label: "Postgraduate" },
    ],
    /* groups lists every group label used on cards */
    groupLabels: { leadership: "Leadership", fellow: "Research Fellow", advisory: "Industry Advisory Fellow", postdoc: "Postdoctoral Researcher", postgrad: "Postgraduate Student" },
    items: [
      { id: "leader-1", group: "leadership", name: "Prof. Name Surname", role: "Director", area: "Autonomous flight systems", media: image("leadership/1.jpg", "Portrait, 4:5") },
      { id: "leader-2", group: "leadership", name: "Assoc. Prof. Name Surname", role: "Deputy Director, Research", area: "Robotics and control", media: image("leadership/2.jpg", "Portrait, 4:5") },
      { id: "leader-3", group: "leadership", name: "Dr. Name Surname", role: "Head of Facilities and Services", area: "Flight operations", media: image("leadership/3.jpg", "Portrait, 4:5") },
      { id: "fellow-1", group: "fellow", name: "Dr. Name Surname", role: "Research Fellow", area: "Computer vision", media: image("fellows/1.jpg", "Portrait, 4:5") },
      { id: "fellow-2", group: "fellow", name: "Dr. Name Surname", role: "Research Fellow", area: "Photogrammetry and mapping", media: image("fellows/2.jpg", "Portrait, 4:5") },
      { id: "fellow-3", group: "fellow", name: "Dr. Name Surname", role: "Research Fellow", area: "Precision agriculture", media: image("fellows/3.jpg", "Portrait, 4:5") },
      { id: "advisory-1", group: "advisory", name: "Name Surname", role: "Industry Advisory Fellow", area: "Airspace regulation", media: image("advisory/1.jpg", "Portrait, 4:5") },
      { id: "advisory-2", group: "advisory", name: "Name Surname", role: "Industry Advisory Fellow", area: "Cargo and logistics", media: image("advisory/2.jpg", "Portrait, 4:5") },
      { id: "postdoc-1", group: "postdoc", name: "Dr. Name Surname", role: "Postdoctoral Researcher", area: "Swarm coordination", media: image("postdoc/1.jpg", "Portrait, 4:5") },
      { id: "postdoc-2", group: "postdoc", name: "Dr. Name Surname", role: "Postdoctoral Researcher", area: "Battery and propulsion", media: image("postdoc/2.jpg", "Portrait, 4:5") },
      { id: "postgrad-1", group: "postgrad", name: "Name Surname", role: "PhD Candidate", area: "Obstacle avoidance", media: image("postgrad/1.jpg", "Portrait, 4:5") },
      { id: "postgrad-2", group: "postgrad", name: "Name Surname", role: "Master's Student", area: "Remote sensing", media: image("postgrad/2.jpg", "Portrait, 4:5") },
    ],
  },

  early: {
    eyebrow: "Next generation",
    title: "Where new ideas take off.",
    text: "Drag or use the arrows to meet our postdoctoral researchers and postgraduate students.",
    items: [
      { id: "postdoc-1", tag: "Postdoctoral", name: "Dr. Name Surname", topic: "Swarm coordination for search and rescue", media: image("postdoc/1.jpg", "Portrait, 4:5") },
      { id: "postdoc-2", tag: "Postdoctoral", name: "Dr. Name Surname", topic: "Lightweight batteries for long endurance", media: image("postdoc/2.jpg", "Portrait, 4:5") },
      { id: "postgrad-1", tag: "PhD", name: "Name Surname", topic: "Real-time obstacle avoidance", media: image("postgrad/1.jpg", "Portrait, 4:5") },
      { id: "postgrad-2", tag: "Master's", name: "Name Surname", topic: "Remote sensing for crop health", media: image("postgrad/2.jpg", "Portrait, 4:5") },
      { id: "postgrad-3", tag: "PhD", name: "Name Surname", topic: "Safe landing with computer vision", media: image("postgrad/3.jpg", "Portrait, 4:5") },
      { id: "postgrad-4", tag: "Master's", name: "Name Surname", topic: "Mapping heritage sites in 3D", media: image("postgrad/4.jpg", "Portrait, 4:5") },
    ],
  },

  cta: {
    title: "Want to work with us?",
    text: "We welcome postgraduate students, postdoctoral researchers and industry collaborators.",
    items: [
      { id: "c1", title: "Open positions", text: "Postgraduate and postdoctoral calls.", href: "/research/opportunities" },
      { id: "c2", title: "Collaborate", text: "Research, industry and training enquiries.", href: "/engagement/collaborate" },
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

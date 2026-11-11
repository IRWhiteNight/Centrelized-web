import { useEffect, useState } from "react";
import { MAIN_NAV, CONTACT_LINK } from "./siteMapCOEUAS";

/* ------------------------------------------------------------------
   HOME PAGE CONTENT: everything an admin would edit.
   Home.jsx contains NO text, links, images or numbers of its own.

   MEDIA SLOTS
   Every image or video on the page is a "slot":
     { type: "image" | "video", src, poster?, alt?, note? }
   - src    where the file lives (files go in /public, see IMG and VID below)
   - note   a short brief shown inside the empty slot, so you know what belongs there
   While a file is missing, the slot shows a dashed placeholder with its note and
   file path. Drop the file in the path and it appears; no code change needed.
   To add more media to a gallery, add another entry to that array.
   To hide the placeholder hints before launch, set SHOW_SLOT_HINTS = false.

   PREVIEW IMAGES
   While USE_PREVIEW_IMAGES is true, every slot that has an entry in PREVIEW
   below shows an image from the internet, so you can see the finished layout.
   These are stand-ins only. When your own photos are ready, put them in
   public/images/coe-uas/ and set USE_PREVIEW_IMAGES = false.

   LATER (admin CMS): set HOME_CONTENT_URL to your API endpoint.
   The API only needs to return the parts that changed; anything it
   leaves out falls back to the defaults below. Arrays (items, stats,
   sections, gallery) and slot objects are replaced whole, so send the
   full list or the full slot when editing one.
------------------------------------------------------------------- */
export const HOME_CONTENT_URL = null; // e.g. "/api/pages/home"
export const SHOW_SLOT_HINTS = true;
export const USE_PREVIEW_IMAGES = true; // false = use only your own files

const IMG = "/images/coe-uas/"; // files in public/images/coe-uas/
const VID = "/videos/coe-uas/"; // files in public/videos/coe-uas/

/* ---------- preview images (stand-ins from the internet) ----------
   key   = the file name used in the slot below
   value = a search word (a photo of that subject), or a full image URL.
   Change a word to get a different kind of photo. */
const PREVIEW = {
  /* hero */
  "hero/1.jpg": "drone",
  "hero/2.jpg": "engineer",
  "hero/3.jpg": "airfield",

  /* capabilities */
  "capabilities/surveying.jpg": "survey",
  "capabilities/agriculture.jpg": "farm",
  "capabilities/security.jpg": "cctv",
  "capabilities/cargo.jpg": "logistics",
  "capabilities/autonomous-ai.jpg": "robot",
  "capabilities/heritage.jpg": "temple",

  /* featured */
  "perlis-airspace-sandbox.jpg": "drone",
  "featured/1.jpg": "aircraft",
  "featured/2.jpg": "controlroom",
  "featured/3.jpg": "circuit",

  /* members (portraits) */
  "members/1.jpg": "https://randomuser.me/api/portraits/men/32.jpg",
  "members/2.jpg": "https://randomuser.me/api/portraits/women/44.jpg",
  "members/3.jpg": "https://randomuser.me/api/portraits/men/75.jpg",
  "members/4.jpg": "https://randomuser.me/api/portraits/women/68.jpg",

  /* highlights */
  "highlights/1.jpg": "award",
  "highlights/2.jpg": "laboratory",
  "highlights/3.jpg": "field",

  /* news */
  "news/1.jpg": "airport",
  "news/2.jpg": "delegation",
  "news/3.jpg": "exhibition",

  /* partners (logo cards) */
  "partners/1.png": "https://placehold.co/480x200/ffffff/0a4dff/png?text=University+Networks",
  "partners/2.png": "https://placehold.co/480x200/ffffff/0a4dff/png?text=Government+Agencies",
  "partners/3.png": "https://placehold.co/480x200/ffffff/0a4dff/png?text=Industry+Partners",
  "partners/4.png": "https://placehold.co/480x200/ffffff/0a4dff/png?text=International",
  "partners/5.png": "https://placehold.co/480x200/ffffff/0a4dff/png?text=Consortia",
  "partners/6.png": "https://placehold.co/480x200/ffffff/0a4dff/png?text=Research+Institutions",

  /* join us */
  "cta/research.jpg": "science",
  "cta/people.jpg": "team",
  "cta/collaborate.jpg": "meeting",
};

/* same file name always gives the same photo (no random change on refresh) */
const hash = (s) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7) % 1000;
const preview = (file) => {
  if (!USE_PREVIEW_IMAGES) return null;
  const v = PREVIEW[file];
  if (!v) return null;
  return v.startsWith("http") ? v : `https://loremflickr.com/1200/800/${v}?lock=${hash(file)}`;
};

const image = (file, note, alt = "") => ({ type: "image", src: preview(file) || IMG + file, alt, note });

/* A video slot. In preview mode, a slot with no video file yet shows its poster
   as a preview image instead, so the layout is not empty. */
const video = (file, poster, note) => {
  const p = poster && preview(poster);
  if (p) return { type: "image", src: p, alt: "", note };
  return { type: "video", src: VID + file, poster: poster ? IMG + poster : undefined, note };
};

export const defaultHomeContent = {
  /* Order and visibility of sections. Reorder or hide here.
     id must match a section renderer in Home.jsx. */
  sections: [
    { id: "hero", label: "Banner", visible: true },
    { id: "capabilities", label: "Capabilities", visible: true },
    { id: "featured", label: "Featured research", visible: true },
    { id: "members", label: "Members", visible: true },
    { id: "highlights", label: "Highlights", visible: true },
    { id: "news", label: "News", visible: true },
    { id: "partners", label: "Partners", visible: true },
    { id: "cta", label: "Join us", visible: true },
  ],

  header: { logo: "COE-UAS", links: MAIN_NAV, contact: CONTACT_LINK },

  /* 1. BANNER: full-screen background video + a column of three small photos */
  hero: {
    eyebrow: "Centre of Excellence for Unmanned Aerial Systems",
    headline: "Engineering the future of unmanned flight.",
    lead: "The Centre brings research, engineering and industry together to make aerial technology useful.",
    background: video("hero.mp4", "hero-poster.jpg", "Looping aerial footage, 10 to 20 seconds, 1920x1080, under 8 MB"),
    gallery: [
      image("hero/1.jpg", "Drone in flight, 16:10"),
      image("hero/2.jpg", "Engineers at work, 16:10"),
      image("hero/3.jpg", "Test site, 16:10"),
    ],
    primary: { label: "Explore research", href: "/research" },
    secondary: { label: "See what we do" }, // scrolls to the next section
  },

  /* 2. CAPABILITIES: one image (or video) per capability */
  capabilities: {
    title: "One platform.\nSix ways to put it to work.",
    items: [
      { id: "survey", title: "Surveying and mapping", text: "Photogrammetry and stockpile measurement from the air.", media: image("capabilities/surveying.jpg", "Aerial survey or orthomosaic map, 4:3"), href: "/facilities/solutions" },
      { id: "agri", title: "Agriculture", text: "Crop monitoring and precision spraying.", media: image("capabilities/agriculture.jpg", "Spraying drone over crops, 4:3"), href: "/facilities/solutions" },
      { id: "security", title: "Security and monitoring", text: "Surveillance and inspection without risk to people.", media: image("capabilities/security.jpg", "Inspection or surveillance flight, 4:3"), href: "/facilities/solutions" },
      { id: "cargo", title: "Cargo transport", text: "Moving goods where roads can’t.", media: image("capabilities/cargo.jpg", "Cargo drone carrying a payload, 4:3"), href: "/facilities/solutions" },
      { id: "ai", title: "Autonomy and AI", text: "Computer vision and autonomous flight systems.", media: image("capabilities/autonomous-ai.jpg", "Computer vision overlay or autonomous flight, 4:3"), href: "/facilities/solutions" },
      { id: "heritage", title: "Heritage documentation", text: "Capturing historic sites in precise detail.", media: image("capabilities/heritage.jpg", "Historic site or 3D scan, 4:3"), href: "/facilities/solutions" },
    ],
  },

  /* 3. FEATURED RESEARCH: main video + a row of supporting photos */
  featured: {
    eyebrow: "Featured programme",
    title: "Perlis Airspace Sandbox",
    text: "A dedicated airspace for testing unmanned aircraft under real conditions, and the programme that shapes how the Centre works from 2026.",
    media: video("perlis-airspace-sandbox.mp4", "perlis-airspace-sandbox.jpg", "Programme overview video, 16:10, 1920x1200"),
    gallery: [
      image("featured/1.jpg", "Flight test, 4:3"),
      image("featured/2.jpg", "Control station, 4:3"),
      image("featured/3.jpg", "Prototype close-up, 4:3"),
    ],
    chips: ["Technologies and prototypes", "Patents and designs", "Technology transfer"],
    cta: { label: "View the programme", href: "/research/programmes/perlis-airspace-sandbox" },
  },

  /* 4. MEMBERS: one portrait per featured member */
  members: {
    title: "The people behind the flights.",
    cta: { label: "Meet our people", href: "/people" },
    // TODO: replace with real members (later: top featured members from the database)
    items: [
      { id: "member-1", name: "Member name", role: "Leadership", media: image("members/1.jpg", "Portrait, 4:5") },
      { id: "member-2", name: "Member name", role: "Research Fellow", media: image("members/2.jpg", "Portrait, 4:5") },
      { id: "member-3", name: "Member name", role: "Industry Advisory Fellow", media: image("members/3.jpg", "Portrait, 4:5") },
      { id: "member-4", name: "Member name", role: "Postdoctoral Researcher", media: image("members/4.jpg", "Portrait, 4:5") },
    ],
  },

  /* 5. HIGHLIGHTS: ambient background + stats + achievement photos */
  highlights: {
    title: "Thirteen years of measurable progress.",
    background: video("highlights-bg.mp4", "highlights-bg.jpg", "Optional dark ambient loop behind the numbers"),
    cta: { label: "See publications and impact", href: "/publications/highlights" },
    // TODO: replace sample numbers with verified figures
    stats: [
      { value: 13, suffix: "", label: "years of research, 2013 to 2026" },
      { value: 250, suffix: "+", label: "publications" },
      { value: 60, suffix: "+", label: "research grants" },
      { value: 40, suffix: "+", label: "partners and collaborators" },
    ],
    gallery: [
      image("highlights/1.jpg", "Award or ceremony, 16:10"),
      image("highlights/2.jpg", "Laboratory or workshop, 16:10"),
      image("highlights/3.jpg", "Field trial, 16:10"),
    ],
  },

  /* 6. NEWS: first item is shown large */
  news: {
    title: "Latest from the Centre.",
    // TODO: replace with real news (later: latest 3 published articles)
    items: [
      { id: "n1", category: "Project update", title: "Perlis Airspace Sandbox enters its next phase", date: "Nov 2026", media: image("news/1.jpg", "News cover photo, 16:9") },
      { id: "n2", category: "Official visit", title: "Delegation tours the flight test facilities", date: "Oct 2026", media: image("news/2.jpg", "News photo, 4:3") },
      { id: "n3", category: "Exhibition", title: "Live drone demonstration for industry partners", date: "Sep 2026", media: image("news/3.jpg", "News photo, 4:3") },
    ],
    upcomingTitle: "Coming up",
    upcoming: [
      { id: "u1", text: "Drone operation course: see training calendar", href: "/facilities/training/calendar" },
      { id: "u2", text: "Industry research challenge briefing", href: "/research/opportunities" },
      { id: "u3", text: "Postgraduate and postdoctoral open call", href: "/research/opportunities" },
    ],
  },

  /* 7. PARTNERS: a logo slot each; the card shows the name until the logo exists */
  partners: {
    title: "Built with partners.",
    text: "Universities, agencies and industry teams work with us on research, trials and training.",
    items: [
      { id: "p1", name: "University networks", media: image("partners/1.png", "Logo, transparent PNG or SVG") },
      { id: "p2", name: "Government agencies", media: image("partners/2.png", "Logo") },
      { id: "p3", name: "Industrial collaborators", media: image("partners/3.png", "Logo") },
      { id: "p4", name: "International collaborations", media: image("partners/4.png", "Logo") },
      { id: "p5", name: "Consortia and joint initiatives", media: image("partners/5.png", "Logo") },
      { id: "p6", name: "Research institutions", media: image("partners/6.png", "Logo") },
    ],
  },

  /* 8. JOIN US: background + one image per card */
  cta: {
    title: "Where do you want to start?",
    background: image("cta-bg.jpg", "Optional wide background, 21:9"),
    items: [
      { id: "c1", title: "Explore research", text: "Projects, grants and innovation.", media: image("cta/research.jpg", "Research image, 16:9"), href: "/research" },
      { id: "c2", title: "Meet our people", text: "Researchers, fellows and students.", media: image("cta/people.jpg", "Team photo, 16:9"), href: "/people" },
      { id: "c3", title: "Collaborate with us", text: "Research, industry and training enquiries.", media: image("cta/collaborate.jpg", "Partnership or meeting photo, 16:9"), href: "/engagement/collaborate" },
    ],
    footer: "© 2026 COE-UAS",
  },
};

/* Merge by section: a partial response only overrides what it contains. */
const merge = (base, patch = {}) => {
  const out = { ...base };
  for (const k of Object.keys(patch)) {
    const b = base[k], p = patch[k];
    out[k] = b && p && typeof b === "object" && typeof p === "object" && !Array.isArray(b) && !Array.isArray(p) ? { ...b, ...p } : p;
  }
  return out;
};

/* Today: returns the defaults instantly.
   Later: fetches from HOME_CONTENT_URL and shows defaults while loading or on error. */
export function useHomeContent(override) {
  const [content, setContent] = useState(() => merge(defaultHomeContent, override));
  const [status, setStatus] = useState(HOME_CONTENT_URL ? "loading" : "ready");

  useEffect(() => {
    if (!HOME_CONTENT_URL) return;
    const ctrl = new AbortController();
    fetch(HOME_CONTENT_URL, { signal: ctrl.signal })
      .then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then((data) => { setContent(merge(defaultHomeContent, data)); setStatus("ready"); })
      .catch((e) => { if (e.name !== "AbortError") setStatus("error"); });
    return () => ctrl.abort();
  }, []);

  return { content, status };
}

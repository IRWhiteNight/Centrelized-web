import { useEffect, useState } from "react";

/* ------------------------------------------------------------------
   RESEARCH PAGE CONTENT: everything an admin would edit.
   Research.jsx contains NO text, links, images or numbers of its own.
   Same rules as homeContent.js:

   MEDIA SLOT  { type: "image" | "video", src, poster?, alt?, note? }
   Files go in public/images/coe-uas/ and public/videos/coe-uas/.
   A missing file shows a dashed placeholder (see SHOW_SLOT_HINTS in homeContent.js).

   SECTION TRANSITIONS
   Each section has a `tx` that decides how it opens as you scroll into it:
     none   no entrance (use for the first section)
     rise   rounded panel grows up from the bottom
     iris   circle opens from the point you are scrolling to
     wipe   diagonal wipe, left to right
     wipeR  diagonal wipe, right to left
     open   splits open from the centre
     tilt   slanted edge flattens out
   Change `tx` or the order below. No code change needed.

   Link paths are written without /coeuas; Research.jsx adds it.
   Keep them in sync with routes/COEUASweb.php.

   LATER (admin CMS): set RESEARCH_CONTENT_URL to your API endpoint.
   Arrays and slot objects are replaced whole, so send the full list.
------------------------------------------------------------------- */
export const RESEARCH_CONTENT_URL = null; // e.g. "/api/pages/research"

const IMG = "/images/coe-uas/";
const VID = "/videos/coe-uas/";

const image = (file, note, alt = "") => ({ type: "image", src: IMG + file, alt, note });
const video = (file, poster, note) => ({ type: "video", src: VID + file, poster: poster ? IMG + poster : undefined, note });

export const defaultResearchContent = {
  sections: [
    { id: "hero", label: "Banner", visible: true, tx: "none" },
    { id: "areas", label: "Research areas", visible: true, tx: "rise" },
    { id: "programme", label: "Flagship programme", visible: true, tx: "iris" },
    { id: "pipeline", label: "Lab to field", visible: true, tx: "wipe" },
    { id: "outputs", label: "Outputs and impact", visible: true, tx: "open" },
    { id: "projects", label: "Current work", visible: true, tx: "tilt" },
    { id: "opportunities", label: "Get involved", visible: true, tx: "wipeR" },
    { id: "cta", label: "Start here", visible: true, tx: "iris" },
  ],

  /* 1. BANNER: looping video, headline with a rotating line, three facts */
  hero: {
    eyebrow: "Research & Innovation",
    headline: "Research that",
    rotator: ["maps the land.", "feeds the crops.", "guards the site.", "carries the load.", "flies itself.", "protects heritage."],
    lead: "From autonomy and AI to surveying, agriculture and cargo, the Centre turns unmanned flight research into technology that is tested and ready to use.",
    background: video("research-hero.mp4", "research-hero-poster.jpg", "Looping research footage, 10 to 20 seconds, 1920x1080, under 8 MB"),
    primary: { label: "Work with us", href: "/engagement/collaborate" },
    secondary: { label: "Explore the research" }, // scrolls to the next section
    facts: ["Six research areas", "Perlis Airspace Sandbox", "Research since 2013"],
  },

  /* 2. RESEARCH AREAS: expanding panels, one image or video each */
  areas: {
    title: "Where the research happens.",
    // Shown as a large scrolling line above the panels
    ribbon: ["Autonomy and AI", "Surveying and mapping", "Agriculture", "Security and monitoring", "Cargo transport", "Heritage documentation"],
    // TODO: point each href to its real area page
    items: [
      { id: "ai", title: "Autonomy and AI", text: "Computer vision and autonomous flight systems that let aircraft sense, decide and act.", tags: ["Computer vision", "Autonomous flight"], media: image("research/areas/autonomy-ai.jpg", "Computer vision overlay or autonomous flight, 3:4"), href: "/research/areas/autonomy-and-ai" },
      { id: "survey", title: "Surveying and mapping", text: "Photogrammetry and stockpile measurement from the air.", tags: ["Photogrammetry", "Stockpile measurement"], media: image("research/areas/surveying.jpg", "Aerial survey or orthomosaic map, 3:4"), href: "/research/areas/surveying-and-mapping" },
      { id: "agri", title: "Agriculture", text: "Crop monitoring and precision spraying.", tags: ["Crop monitoring", "Precision spraying"], media: image("research/areas/agriculture.jpg", "Spraying drone over crops, 3:4"), href: "/research/areas/agriculture" },
      { id: "security", title: "Security and monitoring", text: "Surveillance and inspection without risk to people.", tags: ["Surveillance", "Inspection"], media: image("research/areas/security.jpg", "Inspection or surveillance flight, 3:4"), href: "/research/areas/security-and-monitoring" },
      { id: "cargo", title: "Cargo transport", text: "Moving goods where roads can’t.", tags: ["Payload transport", "Hard-to-reach places"], media: image("research/areas/cargo.jpg", "Cargo drone carrying a payload, 3:4"), href: "/research/areas/cargo-transport" },
      { id: "heritage", title: "Heritage documentation", text: "Capturing historic sites in precise detail.", tags: ["Historic sites", "3D documentation"], media: image("research/areas/heritage.jpg", "Historic site or 3D scan, 3:4"), href: "/research/areas/heritage-documentation" },
    ],
  },

  /* 3. FLAGSHIP PROGRAMME: main video with radar overlay + three photos */
  programme: {
    eyebrow: "Featured programme",
    title: "Perlis Airspace Sandbox",
    text: "A dedicated airspace for testing unmanned aircraft under real conditions, and the programme that shapes how the Centre works from 2026.",
    chips: ["Technologies and prototypes", "Patents and designs", "Technology transfer"],
    media: video("perlis-airspace-sandbox.mp4", "perlis-airspace-sandbox.jpg", "Programme overview video, 16:10, 1920x1200"),
    gallery: [
      image("featured/1.jpg", "Flight test, 4:3"),
      image("featured/2.jpg", "Control station, 4:3"),
      image("featured/3.jpg", "Prototype close-up, 4:3"),
    ],
    cta: { label: "View the programme", href: "/research/programmes/perlis-airspace-sandbox" },
  },

  /* 4. LAB TO FIELD: a sequence, so the steps are numbered. The line draws as you scroll. */
  pipeline: {
    title: "From the lab to the airfield.",
    stages: [
      { id: "research", title: "Research", text: "A question from industry or the field becomes a research project." },
      { id: "prototype", title: "Prototype", text: "Technologies and prototypes are built and tested in our labs." },
      { id: "trial", title: "Field trial", text: "The prototype flies under real conditions in the Perlis Airspace Sandbox." },
      { id: "protect", title: "Protect", text: "Patents and designs secure what the Centre creates." },
      { id: "transfer", title: "Transfer", text: "Technology transfer puts the result in the hands of industry." },
    ],
  },

  /* 5. OUTPUTS AND IMPACT */
  outputs: {
    title: "What the research produces.",
    // TODO: point each href to its real page
    items: [
      { id: "tech", title: "Technologies and prototypes", text: "Working systems, from first bench models to flight-ready aircraft and software.", href: "/research/technologies-and-prototypes" },
      { id: "ip", title: "Patents and designs", text: "Registered inventions and designs that protect the Centre’s work.", href: "/research/patents-and-designs" },
      { id: "tt", title: "Technology transfer", text: "Licensing and partnerships that move results out of the lab.", href: "/research/technology-transfer" },
    ],
    // TODO: replace sample numbers with verified figures (same as the Home page)
    stats: [
      { value: 13, suffix: "", label: "years of research, 2013 to 2026" },
      { value: 250, suffix: "+", label: "publications" },
      { value: 60, suffix: "+", label: "research grants" },
      { value: 40, suffix: "+", label: "partners and collaborators" },
    ],
    cta: { label: "See publications and impact", href: "/publications/highlights" },
  },

  /* 6. CURRENT WORK: a draggable rail of project cards */
  projects: {
    title: "Current work.",
    // TODO: replace with real projects (later: from the database)
    items: [
      { id: "p1", area: "Agriculture", title: "Crop health mapping from the air", status: "Ongoing", media: image("research/projects/1.jpg", "Project photo, 4:3"), href: "/research/projects" },
      { id: "p2", area: "Autonomy and AI", title: "Autonomous inspection flight paths", status: "Ongoing", media: image("research/projects/2.jpg", "Project photo, 4:3"), href: "/research/projects" },
      { id: "p3", area: "Cargo transport", title: "Payload delivery to hard-to-reach sites", status: "Ongoing", media: image("research/projects/3.jpg", "Project photo, 4:3"), href: "/research/projects" },
      { id: "p4", area: "Heritage documentation", title: "3D records of historic sites", status: "Ongoing", media: image("research/projects/4.jpg", "Project photo, 4:3"), href: "/research/projects" },
      { id: "p5", area: "Surveying and mapping", title: "Stockpile measurement accuracy", status: "Ongoing", media: image("research/projects/5.jpg", "Project photo, 4:3"), href: "/research/projects" },
    ],
    cta: { label: "All projects", href: "/research/projects" },
  },

  /* 7. GET INVOLVED */
  opportunities: {
    title: "Ways to get involved.",
    items: [
      { id: "o1", title: "Industry research challenge", text: "Join the briefing", href: "/research/opportunities" },
      { id: "o2", title: "Postgraduate and postdoctoral open call", text: "Join a research team", href: "/research/opportunities" },
      { id: "o3", title: "Collaborate with us", text: "Research, industry and training enquiries", href: "/engagement/collaborate" },
      { id: "o4", title: "Drone operation course", text: "See the training calendar", href: "/facilities/training/calendar" },
    ],
  },

  /* 8. START HERE */
  cta: {
    title: "Have a problem that needs wings?",
    background: image("research/cta-bg.jpg", "Optional wide background, 21:9"),
    primary: { label: "Collaborate with us", href: "/engagement/collaborate" },
    secondary: { label: "Meet our people", href: "/people" },
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

export function useResearchContent(override) {
  const [content, setContent] = useState(() => merge(defaultResearchContent, override));
  const [status, setStatus] = useState(RESEARCH_CONTENT_URL ? "loading" : "ready");

  useEffect(() => {
    if (!RESEARCH_CONTENT_URL) return;
    const ctrl = new AbortController();
    fetch(RESEARCH_CONTENT_URL, { signal: ctrl.signal })
      .then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then((data) => { setContent(merge(defaultResearchContent, data)); setStatus("ready"); })
      .catch((e) => { if (e.name !== "AbortError") setStatus("error"); });
    return () => ctrl.abort();
  }, []);

  return { content, status };
}

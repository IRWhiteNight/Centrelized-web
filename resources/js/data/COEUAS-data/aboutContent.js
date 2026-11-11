import { useMemo } from "react";

/* ==================================================================
   COE-UAS ABOUT PAGE CONTENT  (the only file you edit for text/images)
   Place at: resources/js/data/COEUAS-data/aboutContent.js

   THE MODEL
   - Page = hero + ticker + SECTIONS. Every section = a list of BLOCKS.
   - Every section, block and item has a stable `id`. The page uses the
     id as its React key and (for sections) as the #anchor, so edits,
     reorders and deletes never confuse the page. Keep ids unique.
   - Order on the page = order in the array.

   ADD / UPDATE / DELETE (what to do in this file, or later in the CMS)
   - Add an item    : copy a sibling object into the same `items` array,
                      give it a NEW id, change the text.
   - Update an item : change its fields. Nothing else needs touching.
   - Hide an item   : visible: false  (kept in the data, not shown).
   - Delete an item : remove the object from its array.
   - Reorder        : move the object up or down in the array.
   - Add a section  : copy a whole section object, new id, new blocks.
   - Show it in the menu : give the section a `nav` label (no nav = not
                      in the menu). Hide a whole section: visible: false.
   - A section or block with nothing visible inside is skipped.

   TEXT RULES
   - Words between *stars* in a section title get the blue accent.
   - Images: put files in public/images/coe-uas/about/ and write only the
     file name ("hero.jpg", "strategy/1.jpg"). A missing image shows a
     neutral placeholder (set showSlotHints false to hide the hints).
   - Links: a path below /coeuas ("/people", "/about#history") or a full URL.

   SECTION  { id, nav?, eyebrow?, title, lede?, tone, visible?, blocks[] }
   tone     "dark" (black) | "navy" | "light" (white) | "blue"

   BLOCKS   (every block may also have  id  and  visible)
     split     { title?, paragraphs[], points[], file?, alt?, reverse? }
     stats     { items:[{ id, label, n, suffix?, unit? }] }
     cards     { cols?, items:[{ id, tag?, title, text?, list?[], href?, linkLabel?, file? }] }
     tabs      { items:[{ id, tab, title, text, points[], href?, linkLabel? }] }
     timeline  { items:[{ id, year, title, text, current? }] }
     org       { root, rootLabel?, rootText?, nodes:[{ id, title, text }], note?, links:[{ id, label, href }] }
     tags      { title?, items[] }
     people    { title?, items:[{ id, name, role, file, href? }] }
     gallery   { items:[{ id, file, alt }] }
     cta       { text, label, href }

   TODO marks sample wording: replace with verified facts.
================================================================== */

export const defaultAboutContent = {
  mediaBase: "/images/coe-uas/about/",
  showSlotHints: true, // set false before launch to hide the "Add image" hints

  /* ---------- HERO ---------- */
  hero: {
    eyebrow: "About COE-UAS",
    titleLines: ["Where unmanned", "flight becomes", "useful."],
    highlight: "useful.", // the line that gets the blue accent
    lede: "The Centre of Excellence for Unmanned Aerial Systems brings research, engineering and industry together to turn aerial technology into real solutions.",
    primary: { label: "Our story", target: "history" }, // target = a section id
    secondary: { label: "Meet our people", href: "/people" },
    file: "hero.jpg", // wide photo. Leave "" for the dark fallback
    caption: { place: "UniMAP, Perlis", note: "Research, engineering and training under one roof" }, // TODO
    // plain: true = show the number as it is (no count-up), good for years
    stats: [
      { id: "years", n: 13, label: "Years", note: "From 2013 to 2026" },
      { id: "pillars", n: 4, label: "Strategic pillars", note: "Research, industry, training, facilities" },
      { id: "awards", n: 3, label: "Award categories", note: "Centre, accreditation, members" },
      { id: "sandbox", n: 2026, plain: true, label: "Perlis Airspace Sandbox", note: "A new chapter for the Centre" },
    ],
  },

  /* scrolling band under the menu (leave [] to hide) */
  ticker: ["Research", "Engineering", "Industry partnerships", "Training", "Flight testing", "Perlis Airspace Sandbox"],

  /* ---------- SECTIONS ---------- */
  sections: [
    /* 1. ABOUT */
    {
      id: "overview",
      nav: "About",
      eyebrow: "Background and establishment",
      title: "How the Centre *began.*",
      lede: "A home for unmanned aerial systems research, where ideas move from the lab to the flight line.",
      tone: "light",
      blocks: [
        {
          type: "split",
          id: "background",
          // TODO: replace with the official background text
          paragraphs: [
            "COE-UAS was set up to give unmanned aerial systems research a home of its own: a place where ideas move from the lab to the flight line.",
            "Since its establishment the Centre has grown from a small research effort into a full programme of research, engineering services, training and partnerships.",
          ],
          points: ["Research", "Engineering", "Industry", "Training"],
          file: "background.jpg",
          alt: "Founding photo or aerial facility shot",
        },
        {
          type: "cards",
          id: "vision-mission",
          cols: 3,
          // TODO: replace with the approved vision, mission and objectives
          items: [
            { id: "vision", tag: "Vision", title: "A leading centre for unmanned aerial systems.", text: "Recognised for research that industry, government and the community trust." },
            { id: "mission", tag: "Mission", title: "Make aerial technology useful.", text: "Bring research, engineering and industry together to solve real problems from the air." },
            { id: "objectives", tag: "Objectives", title: "What we work towards.", list: ["Advance research and development", "Grow industry and commercial engagement", "Build skills through training", "Expand facilities and linkages"] },
          ],
        },
        {
          type: "cards",
          id: "direction",
          cols: 1,
          items: [
            { id: "strategic-direction", tag: "Strategic direction", title: "Research and strategic direction", text: "From 2026 the Perlis Airspace Sandbox shapes how the Centre plans, tests and shares its work." },
          ],
        },
      ],
    },

    /* 2. HISTORY */
    {
      id: "history",
      nav: "History",
      eyebrow: "History and milestones",
      title: "Thirteen years *in motion.*",
      lede: "From earlier origins to the Perlis Airspace Sandbox, the Centre has changed shape many times.",
      tone: "dark",
      blocks: [
        {
          type: "timeline",
          id: "timeline",
          // TODO: replace sample years and wording with the verified timeline
          // current: true highlights the milestone that is happening now
          items: [
            { id: "t-origins", year: "Origins", title: "Establishment and earlier origins", text: "The research work and teams that led to the Centre." },
            { id: "t-2013", year: "2013", title: "The Centre is established", text: "COE-UAS begins as a dedicated unmanned aerial systems centre." },
            { id: "t-2016", year: "2016", title: "Research groups take shape", text: "Teams form around focused research areas and projects." },
            { id: "t-2019", year: "2019", title: "Industry work grows", text: "Engineering services and commercial projects expand." },
            { id: "t-2022", year: "2022", title: "Training and outreach", text: "Drone courses open to industry, agencies and the community." },
            { id: "t-2026", year: "2026", title: "Perlis Airspace Sandbox", text: "A new chapter that changes how the Centre is organised.", current: true },
          ],
        },
        { type: "cta", id: "achievements", text: "See the major achievements and transformations.", label: "Annual research highlights", href: "/publications#highlights" },
      ],
    },

    /* 3. ORGANISATION */
    {
      id: "organisation",
      nav: "Organisation",
      eyebrow: "Organisation and leadership",
      title: "How we are *organised.*",
      lede: "Leadership, research groups and technical teams working as one structure.",
      tone: "navy",
      blocks: [
        {
          type: "org",
          id: "org-chart",
          rootLabel: "Centre",
          root: "COE-UAS",
          rootText: "One structure that joins direction, research and technical support.",
          nodes: [
            { id: "leadership", title: "Leadership and management", text: "Direction, governance and day-to-day management." },
            { id: "research-groups", title: "Research group structure", text: "Groups built around research areas, members and projects." },
            { id: "technical-support", title: "Research and technical support", text: "Engineers, technicians and staff who keep flights running." },
          ],
          note: "Previous structures and leadership periods",
          links: [
            { id: "l-leadership", label: "Meet leadership", href: "/people#leadership" },
            { id: "l-members", label: "All members", href: "/people" },
          ],
        },
      ],
    },

    /* 4. STRATEGY */
    {
      id: "strategy",
      nav: "Strategy",
      eyebrow: "Strategy and development",
      title: "Four pillars, *one direction.*",
      lede: "Where the Centre is heading next, one pillar at a time.",
      tone: "dark",
      blocks: [
        {
          type: "tabs",
          id: "pillars",
          items: [
            { id: "strategy-rd", tab: "Research and development", title: "Research that is built to be flown.", text: "Research that is designed, tested and improved in the air.", points: ["Research areas and groups", "Projects and grants", "Technologies and prototypes"], href: "/research", linkLabel: "Explore research" },
            { id: "strategy-industry", tab: "Industry and commercial", title: "Practical solutions for industry.", text: "Solutions for companies and agencies.", points: ["Surveying and mapping", "Inspection and monitoring", "Cargo, agriculture and AI"], href: "/facilities#solutions", linkLabel: "See our solutions" },
            { id: "strategy-training", tab: "Training and capability", title: "Skills for operators and teams.", text: "Courses and outreach for operators, teams and communities.", points: ["Drone operation courses", "Industry and agency training", "Community and outreach"], href: "/facilities#training", linkLabel: "See our training" },
            { id: "strategy-future", tab: "Facilities and future plans", title: "Facilities that keep growing.", text: "Laboratories, aircraft and flight sites that keep expanding.", points: ["Laboratories and workshops", "Testing sites and flight facilities", "Upgrade and development projects"], href: "/facilities", linkLabel: "See our facilities" },
          ],
        },
        {
          type: "gallery",
          id: "strategy-gallery",
          items: [
            { id: "g-1", file: "strategy/1.jpg", alt: "Flight testing" },
            { id: "g-2", file: "strategy/2.jpg", alt: "Laboratory" },
            { id: "g-3", file: "strategy/3.jpg", alt: "Training" },
            { id: "g-4", file: "strategy/4.jpg", alt: "Field operations" },
          ],
        },
      ],
    },

    /* 5. AWARDS */
    {
      id: "awards",
      nav: "Awards",
      eyebrow: "Awards and recognition",
      title: "Recognised for *the work.*",
      lede: "Centre awards, accreditations and the achievements of our members.",
      tone: "blue",
      blocks: [
        {
          type: "cards",
          id: "award-groups",
          cols: 3,
          // TODO: replace with real awards, accreditations and certifications
          items: [
            { id: "centre-awards", tag: "Centre", title: "Centre awards and achievements", list: ["Award name, awarding body, year", "Award name, awarding body, year"] },
            { id: "accreditations", tag: "Accreditation", title: "Accreditations and certifications", list: ["Accreditation or certificate", "Accreditation or certificate"] },
            { id: "member-awards", tag: "Members", title: "Member awards", list: ["Linked to individual member profiles", "Browse them in the member directory"] },
          ],
        },
        { type: "cta", id: "awards-cta", text: "Explore the people behind the awards.", label: "Explore member profiles", href: "/people" },
      ],
    },

    /* 6. WHAT NEXT */
    {
      id: "next",
      nav: "Next",
      eyebrow: "What next",
      title: "Where to *next?*",
      tone: "light",
      blocks: [
        {
          type: "cards",
          id: "next-links",
          cols: 3,
          items: [
            { id: "n-research", title: "Explore research", text: "Projects, grants and innovation.", href: "/research", linkLabel: "Go to research" },
            { id: "n-people", title: "Meet our people", text: "Researchers, fellows and students.", href: "/people", linkLabel: "Go to people" },
            { id: "n-collaborate", title: "Collaborate with us", text: "Research, industry and training enquiries.", href: "/collaborate", linkLabel: "Get in touch" },
          ],
        },
      ],
    },
  ],

  footer: "© 2026 COE-UAS",
};

/* Today: returns the defaults. Later: pass the API/CMS response as `override`
   (the same shape as above). `hero` is merged field by field; every other
   top-level key in the override replaces the default one. */
export function useAboutContent(override) {
  return useMemo(() => {
    const o = override || {};
    return {
      content: {
        ...defaultAboutContent,
        ...o,
        hero: { ...defaultAboutContent.hero, ...(o.hero || {}) },
      },
    };
  }, [override]);
}

export default defaultAboutContent;

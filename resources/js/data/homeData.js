/* ==========================================================================
   HOME PAGE DATA — edit everything here. You should not need to touch Home.jsx.

   TEXT TIPS
   • Headings: wrap words in *asterisks* to highlight them  →  "What is the *Sandbox?*"
   • "TBC" items are placeholders: replace them with real news / events.

   IMAGE TIPS (see the `images` block below)
   • Sample photos are loaded from the internet (picsum.photos) just so the page looks
     complete while you build. They are random demo pictures. Do NOT ship them.
   • To use your own picture, either:
        a) put the file in /public/images/ and write   src: '/images/site-aerial.jpg'
        b) or import it at the top of this file:        import siteAerial from '../images/site-aerial.jpg';
           and write                                    src: siteAerial
   • If an image fails to load, the page shows a labelled placeholder instead (never a broken icon).
   • Set src: null to show the placeholder on purpose.
========================================================================== */

/* sample-photo helper (picsum.photos): the same keyword + number always gives the same photo.
   These are random landscape photos, NOT topic-matched. They only fill the layout while you
   collect real pictures. If one fails to load, the page shows a drawn sample image instead. */
const sample = (keyword, w, h, lock) => `https://picsum.photos/seed/${keyword.replace(/\W+/g, '-')}-${lock}/${w}/${h}`;

/* ------------------------------ IMAGES ----------------------------------- */
export const images = {
    // 02 What is the sandbox?            portrait 1200×1500
    about:    { src: sample('airfield,runway', 900, 1100, 11), alt: 'Aerial view of the sandbox site' },
    // 03 Why it matters                  wide 1600×900
    why:      { src: sample('drone,aerial', 1400, 800, 12), alt: 'Drone operating over paddy fields' },
    // 04 Who should participate          portrait 1200×1500
    who:      { src: sample('engineer,aircraft', 900, 1100, 13), alt: 'Engineers and operators at the site' },
    // 05 Featured programmes             landscape 1200×800
    prog1:    { src: sample('rescue,helicopter', 800, 540, 14), alt: 'First responder operations' },
    prog2:    { src: sample('helicopter,aircraft', 800, 540, 15), alt: 'Advanced air mobility' },
    prog3:    { src: sample('cargo,drone', 800, 540, 16), alt: 'Cargo logistics' },
    prog4:    { src: sample('radar,antenna', 800, 540, 17), alt: 'Technology and integration' },
    // 06 News thumbnails                 square 400×400
    news1:    { src: sample('drone', 300, 220, 18), alt: '' },
    news2:    { src: sample('aircraft', 300, 220, 19), alt: '' },
    news3:    { src: sample('airport', 300, 220, 20), alt: '' },
    // 06 Project progress                wide 1600×700
    progress: { src: sample('construction,hangar', 1400, 500, 21), alt: 'Site progress' },
    // 07 Events gallery                  portrait 1200×1500
    events:   { src: sample('airshow,aircraft', 900, 1100, 22), alt: 'Sandbox events' },
    event1:   { src: sample('conference', 300, 220, 23), alt: '' },
    event2:   { src: sample('workshop', 300, 220, 24), alt: '' },
    event3:   { src: sample('drone,flight', 300, 220, 25), alt: '' },
    // 09 Apply / subscribe               portrait 1200×1500
    apply:    { src: sample('aircraft,sunset', 900, 1100, 26), alt: 'Perlis Airspace Sandbox' },
};

/* ------------------------------ SECTIONS --------------------------------- */
/* Small labels shown above each section (taken from the sitemap's HOME list) */
export const sectionLabels = [
    'Main banner',
    'What is the sandbox?',
    'Why it matters',
    'Who should participate?',
    'Featured testing programmes & opportunities',
    'Latest news & project progress',
    'Upcoming events',
    'Partners & collaborators',
    'Apply to participate / Subscribe for updates',
];

/* 01 — Main banner and slogan */
export const hero = {
    slogan: 'PERLIS AIRSPACE SANDBOX · Innovating today, connecting tomorrow.',
    title: 'Malaysia’s first real-world testing ground for *low-altitude airspace*',
    lede: 'A national platform for testing, validation and future airspace innovation, where drones, air taxis and autonomous cargo move from prototype to proven operation.',
    primaryCta: 'Apply to Participate',
    secondaryCta: 'Subscribe for updates',
    proof: [
        { value: '4', label: 'Development phases, 2026 – 2030+' },
        { value: '2', label: 'Flight corridors planned: Timah Tasoh Dam & Langkawi' },
        { value: '6', label: 'National application areas, one shared airspace' },
    ],
};

/* 02 — What is the sandbox? */
export const about = {
    title: 'What is the *Sandbox?*',
    rows: [
        ['Definition', 'A controlled testing environment where industry, researchers and government agencies can safely test and validate advanced aviation solutions (aircraft, operations and infrastructure) in coordination with the relevant authorities.'],
        ['Purpose', 'To accelerate Advanced Air Mobility through structured testing, regulatory validation, operational development and ecosystem collaboration, with safety, compliance and scalability built in.'],
        ['Location', 'Sungai Batu Pahat, Perlis, Malaysia: the first dedicated low-altitude airspace testing facility in the country, built around a functional mock-up aerodrome.'],
    ],
};

/* 03 — Why it matters */
export const why = {
    kicker: 'Malaysia is ready, but not fully prepared.',
    title: 'Low-altitude airspace is *the next infrastructure.*',
    gaps: [
        ['Limited real-world testing space', 'Prototypes stay prototypes without real airspace.'],
        ['No validation platform for industry', 'BVLOS needs real data, not just simulation.'],
        ['Regulators need operational evidence', 'Policy depends on proven, measured operations.'],
    ],
    market: [
        { value: 'US$137B', label: 'Global AAM market by 2035, growing at 24.6% a year' },
        { value: 'RM70B', label: 'Additional revenue the AAM industry could bring Malaysia over 20 years' },
        { value: 'RM34B', label: 'Projected contribution to Malaysia’s GDP over the same period' },
    ],
    source: 'Source: MIGHT & FUTURISE, Advanced Air Mobility Industry Report (2025); global figure from Grand View Research as cited in the report.',
};

/* 04 — Who should participate? */
export const who = {
    title: 'Who should *participate?*',
    items: [
        ['Aircraft & drone manufacturers', 'Prove aircraft in real, controlled airspace.'],
        ['Technology & system providers', 'Validate payloads, communications, detect-and-avoid and UTM.'],
        ['Operators & service providers', 'Rehearse real missions before wider deployment.'],
        ['Universities & research institutions', 'Run experiments backed by real operational data.'],
        ['Government agencies', 'Test real use cases and generate evidence for policy.'],
        ['Investors & strategic partners', 'Co-develop infrastructure and commercial pilots across the 2026 – 2030+ roadmap.'],
    ],
    ways: ['Government-led trials', 'Industry testing & demonstrations', 'Research & innovation'],
};

/* 05 — Featured testing programmes and opportunities */
export const programmes = {
    title: 'Featured testing *programmes.*',
    cta: 'Apply to Participate',
    items: [
        { img: 'prog1', n: '01', title: 'First Responder Operations', text: 'Search and rescue, disaster response and emergency support when every second counts.', tag: 'Public safety' },
        { img: 'prog2', n: '02', title: 'Advanced Air Mobility', text: 'Vertiport demonstrations, eVTOL integration studies and AAM operation simulation.', tag: 'eVTOL · Vertiport' },
        { img: 'prog3', n: '03', title: 'Cargo Logistics', text: 'Autonomous delivery of medicines, essentials and cargo along planned BVLOS corridors.', tag: 'BVLOS · Delivery' },
        { img: 'prog4', n: '04', title: 'Technology & Integration', text: 'UTM, digital airspace management, communications and system integration testing.', tag: 'UTM · Systems' },
    ],
};

/* 06 — Latest news and project progress */
export const news = {
    title: 'News & *project progress.*',
    newsLabel: 'Latest news',
    progressLabel: 'Project progress · Integrated development timeline',
    items: [
        { img: 'news1', date: 'Date TBC', title: 'News headline TBC', text: 'Short summary of the latest sandbox announcement.' },
        { img: 'news2', date: 'Date TBC', title: 'News headline TBC', text: 'Short summary of the latest sandbox announcement.' },
        { img: 'news3', date: 'Date TBC', title: 'News headline TBC', text: 'Short summary of the latest sandbox announcement.' },
    ],
    /* set now: true on the phase that is currently running */
    phases: [
        { period: 'Mid 2026 – Early 2027', title: 'Phase 1', name: 'Foundation & initial operations', text: 'Site development, basic command & control, communications, early BVLOS demonstration flights.', now: true },
        { period: 'Mid 2027 – 2028', title: 'Phase 2', name: 'Validation & ecosystem expansion', text: 'UTM development, BVLOS corridors, training & simulation centre.' },
        { period: '2028 – 2029', title: 'Phase 3', name: 'Advanced airspace ecosystem', text: 'Vertiport demonstration, eVTOL studies, inter-zone and maritime operations.' },
        { period: '2029 – 2030+', title: 'Phase 4', name: 'Sustainability & future mobility', text: 'Commercial model, ASEAN sandbox collaboration, global validation network.' },
    ],
    currentLabel: 'Current stage',
};

/* 07 — Upcoming events */
export const events = {
    title: 'Upcoming *events.*',
    items: [
        { img: 'event1', date: 'DATE TBC', title: 'Event name TBC', where: 'Venue TBC', type: 'Open day' },
        { img: 'event2', date: 'DATE TBC', title: 'Event name TBC', where: 'Venue TBC', type: 'Briefing' },
        { img: 'event3', date: 'DATE TBC', title: 'Event name TBC', where: 'Venue TBC', type: 'Demonstration' },
    ],
};

/* 08 — Partners and collaborators preview
   `logo`: leave null to show the name, or set a path/import to show a logo */
export const partners = {
    title: 'A national *ecosystem.*',
    lede: 'Government, regulators, research bodies and industry, working from application to execution.',
    groups: [
        { group: 'Supported by', items: [
            { name: 'UniMAP', logo: null }, { name: 'CAAM', logo: null }, { name: 'MCMC', logo: null },
            { name: 'MIGHT', logo: null }, { name: 'FUTURISE', logo: null }, { name: 'MRANTI', logo: null },
            { name: 'NAICO', logo: null }, { name: 'STRIDE', logo: null }, { name: 'SIRIM', logo: null }, { name: 'MOF', logo: null },
        ] },
        { group: 'Managed & designed by', items: [{ name: 'Vertiport Malaysia', logo: null }, { name: 'Araken', logo: null }] },
        { group: 'Collaborators', items: [{ name: 'EHANG', logo: null }, { name: 'TCAB', logo: null }, { name: 'MHS Aviation', logo: null }] },
    ],
};

/* 09 — Apply to Participate / Subscribe for Updates */
export const apply = {
    title: 'Ready to *fly with us?*',
    steps: ['Express interest', 'Define activity', 'Review & approval', 'Execute'],
    applyLabel: 'Apply to Participate',
    applyHref: '', // e.g. '/apply'. Leave '' to keep the button inactive for now
    subscribeLabel: 'Subscribe for updates',
    subscribeText: 'Sandbox milestones, programmes and Advanced Air Mobility news, in your inbox.',
    emailPlaceholder: 'Email address',
    subscribeButton: 'Subscribe',
    thanks: 'Thank you, you are subscribed.',
};

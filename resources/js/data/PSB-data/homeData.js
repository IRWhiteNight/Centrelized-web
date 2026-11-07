/* ==========================================================================
   HOME PAGE DATA  —  the ONLY file you edit to change the Home page.

   ADD     copy one line/object inside a list and change the text
   UPDATE  change the text
   DELETE  delete the line, OR set  active: false  to hide it without deleting
   REORDER move a line up/down inside a list, or move a key inside `layout`

   • Headings: wrap words in *asterisks* to highlight them.
   • Images: pic('seed', 'alt text', '/images/my-photo.jpg')
       - 3rd value = YOUR picture (put it in /public/images/ or import it).
       - leave it '' and a demo photo is shown. Replace demo photos before launch.
========================================================================== */

const pic = (seed, alt = '', src = '', w = 1000, h = 700) =>
    ({ src: src || `https://picsum.photos/seed/${seed}/${w}/${h}`, alt });

/* ------------------------- PAGE ORDER ------------------------------------
   Move a key up or down to rearrange the page. Remove a key to hide a section. */
export const layout = [
    'hero', 'activity', 'about', 'why', 'programmes', 'who',
    'roadmap', 'news', 'events', 'gallery', 'partners', 'apply',
];

/* label used by the side navigation */
export const labels = {
    hero: 'Home', activity: 'Current activity', about: 'The sandbox', why: 'Why it matters',
    programmes: 'Programmes', who: 'Participate', roadmap: 'Roadmap', news: 'News',
    events: 'Events', gallery: 'Gallery', partners: 'Partners', apply: 'Apply',
};

/* ------------------------- HERO ------------------------------------------ */
export const hero = {
    slogan: 'Perlis Airspace Sandbox · Innovating today, connecting tomorrow.',
    title: 'Malaysia’s first real-world testing ground for *low-altitude airspace*',
    lede: 'A national platform for testing, validation and future airspace innovation, where drones, air taxis and autonomous cargo move from prototype to proven operation.',
    primaryCta: { label: 'Apply to Participate', to: 'apply' },
    secondaryCta: { label: 'See current activity', to: 'activity' },
    images: [
        pic('hero-vertiport', 'Vertiport', '', 800, 1000),
        pic('hero-evtol', 'eVTOL air taxi', '', 800, 600),
        pic('hero-drone', 'Cargo drone', '', 800, 600),
    ],
    stats: [
        { to: 4, label: 'Development phases, 2026 – 2030+' },
        { to: 2, label: 'Planned corridors: Timah Tasoh Dam & Langkawi' },
        { to: 6, label: 'National application areas' },
        { to: 30, suffix: ' ha', label: 'Sandbox land area (about)' },
    ],
    ticker: ['Security & Surveillance', 'Logistics & Delivery', 'Agriculture Monitoring', 'Disaster Response', 'Infrastructure Inspection', 'Advanced Air Mobility'],
};

/* ------------------------- CURRENT ACTIVITY BANNER -----------------------
   Slides at the top of the page. Add/remove items freely.
   enabled:false hides the whole banner.   status: live | open | upcoming | done */
export const activity = {
    enabled: true,
    interval: 6500,
    kicker: 'Happening now',
    items: [
        { active: true, status: 'live', tag: 'Phase 1 · In progress', title: 'Site development & initial operations', text: 'Site preparation, basic command & control, communications and early BVLOS demonstration flights are under way at Sungai Batu Pahat.', date: 'Mid 2026 – Early 2027', cta: { label: 'View roadmap', to: 'roadmap' }, image: pic('act-site', 'Site development', '', 1600, 900) },
        { active: true, status: 'open', tag: 'Call for participants', title: 'Now open: apply to test in the sandbox', text: 'Manufacturers, operators, universities and agencies can express interest and define a test activity. (Sample text: replace.)', date: 'Rolling intake', cta: { label: 'Apply now', to: 'apply' }, image: pic('act-apply', 'Apply to participate', '', 1600, 900) },
        { active: true, status: 'upcoming', tag: 'Corridor survey', title: 'Planning the flight corridors', text: 'Eastbound to Timah Tasoh Dam, and westbound via Kuala Perlis to Langkawi Island across rivers, paddy fields and sea.', date: 'Date TBC', cta: { label: 'About the sandbox', to: 'about' }, image: pic('act-corridor', 'Flight corridor', '', 1600, 900) },
    ],
};

/* ------------------------- WHAT IS THE SANDBOX ---------------------------- */
export const about = {
    title: 'What is the *sandbox?*',
    rows: [
        ['Definition', 'A controlled testing environment where industry, researchers and government agencies safely test and validate advanced aviation solutions, in coordination with the relevant authorities.'],
        ['Purpose', 'To accelerate Advanced Air Mobility through structured testing, regulatory validation, operational development and ecosystem collaboration.'],
        ['Location', 'Sungai Batu Pahat, Perlis: the first dedicated low-altitude airspace testing facility in Malaysia, built around a functional mock-up aerodrome.'],
    ],
    image: pic('about-aerial', 'Aerial view of the sandbox site', '', 1000, 1300),
    facilitiesLabel: 'Functional mock-up aerodrome',
    facilities: [
        { title: 'Vertiport', text: 'Purpose-built take-off and landing pads.', image: pic('fac-vertiport', 'Vertiport') },
        { title: 'Test flight corridor', text: 'Segmented altitude zones for BVLOS trials.', image: pic('fac-corridor', 'Test flight corridor') },
        { title: 'Drone hub', text: 'Staging, charging and cargo handling.', image: pic('fac-hub', 'Drone hub') },
        { title: 'Research & maintenance', text: 'Workshops for integration and repair.', image: pic('fac-maint', 'Research and maintenance facility') },
        { title: 'Flight simulator', text: 'Operator training and mission rehearsal.', image: pic('fac-sim', 'Flight simulator') },
        { title: 'Radar / UTMS', text: 'Communications and traffic management.', image: pic('fac-radar', 'Radar and communication system') },
    ],
};

/* ------------------------- WHY IT MATTERS --------------------------------- */
export const why = {
    kicker: 'Malaysia is ready, but not fully prepared.',
    title: 'Low-altitude airspace is *the next infrastructure.*',
    image: pic('why-drone', 'Drone over paddy fields', '', 1400, 900),
    gaps: [
        ['Many drone technologies already exist', 'Innovation is happening.'],
        ['Limited real-world testing environment', 'Not enough space to test and prove.'],
        ['Gap between research and deployment', 'Prototypes remain prototypes.'],
        ['Industry lacks a validation platform', 'Hard to validate, hard to scale.'],
        ['Regulators need real operational data', 'Policy requires operational evidence.'],
    ],
    market: [
        { to: 137, prefix: 'US$', suffix: 'B', label: 'Global AAM market by 2035, growing 24.6% a year' },
        { to: 70, prefix: 'RM', suffix: 'B', label: 'Additional revenue for Malaysia over 20 years' },
        { to: 34, prefix: 'RM', suffix: 'B', label: 'Projected GDP contribution over the same period' },
    ],
    source: 'Source: MIGHT & FUTURISE, Advanced Air Mobility Industry Report (2025); global figure from Grand View Research as cited in the report.',
    perlisLabel: 'Why Perlis',
    perlis: ['Low population density', 'Less airspace congestion', 'Suitable terrain for testing', 'Safe and controlled environment', 'Potential new tech hub'],
};

/* ------------------------- PROGRAMMES ------------------------------------- */
export const programmes = {
    title: 'Featured testing *programmes*',
    lede: 'Four testing and innovation areas, open to government, industry and research.',
    items: [
        { active: true, title: 'First Responder Operations', text: 'Search and rescue, disaster response and emergency support when every second counts.', tag: 'Public safety', image: pic('prog-rescue', 'First responder operations') },
        { active: true, title: 'Advanced Air Mobility', text: 'Vertiport demonstrations, eVTOL integration studies and AAM operation simulation.', tag: 'eVTOL · Vertiport', image: pic('prog-aam', 'Advanced air mobility') },
        { active: true, title: 'Cargo Logistics', text: 'Autonomous delivery of medicines, essentials and cargo along planned BVLOS corridors.', tag: 'BVLOS · Delivery', image: pic('prog-cargo', 'Cargo logistics') },
        { active: true, title: 'Technology & Integration', text: 'UTM, digital airspace management, communications and system integration testing.', tag: 'UTM · Systems', image: pic('prog-tech', 'Technology and integration') },
    ],
};

/* ------------------------- WHO SHOULD PARTICIPATE ------------------------- */
export const who = {
    title: 'Who should *participate?*',
    image: pic('who-team', 'Engineers and operators', '', 1000, 1300),
    items: [
        ['Aircraft & drone manufacturers', 'Prove aircraft in real, controlled airspace.'],
        ['Technology & system providers', 'Validate payloads, communications, detect-and-avoid and UTM.'],
        ['Operators & service providers', 'Rehearse real missions before wider deployment.'],
        ['Universities & research institutions', 'Run experiments backed by real operational data.'],
        ['Government agencies', 'Test real use cases and generate evidence for policy.'],
        ['Investors & strategic partners', 'Co-develop infrastructure and commercial pilots.'],
    ],
    ways: ['Government-led trials', 'Industry testing & demonstrations', 'Research & innovation'],
};

/* ------------------------- ROADMAP ---------------------------------------- */
export const roadmap = {
    title: 'Development *roadmap*',
    lede: 'A progressive journey towards Malaysia’s low-altitude airspace ecosystem. Set now: true on the running phase.',
    currentLabel: 'Current stage',
    phases: [
        { period: 'Mid 2026 – Early 2027', title: 'Phase 1', name: 'Foundation & initial operations', text: 'Site development, basic command & control, communications, early BVLOS demonstration flights.', now: true },
        { period: 'Mid 2027 – 2028', title: 'Phase 2', name: 'Validation & ecosystem expansion', text: 'UTM development, BVLOS corridors, training & simulation centre.' },
        { period: '2028 – 2029', title: 'Phase 3', name: 'Advanced airspace ecosystem', text: 'Vertiport demonstration, eVTOL studies, inter-zone and maritime operations.' },
        { period: '2029 – 2030+', title: 'Phase 4', name: 'Sustainability & future mobility', text: 'Commercial model, ASEAN sandbox collaboration, global validation network.' },
    ],
    image: pic('road-site', 'Phase 1 site', '', 1600, 600),
};

/* ------------------------- NEWS ------------------------------------------- */
export const news = {
    title: 'Latest *news*',
    items: [
        { active: true, date: 'Date TBC', title: 'News headline TBC', text: 'Short summary of the latest sandbox announcement.', href: '', image: pic('news-1', '', '', 800, 560) },
        { active: true, date: 'Date TBC', title: 'News headline TBC', text: 'Short summary of the latest sandbox announcement.', href: '', image: pic('news-2', '', '', 800, 560) },
        { active: true, date: 'Date TBC', title: 'News headline TBC', text: 'Short summary of the latest sandbox announcement.', href: '', image: pic('news-3', '', '', 800, 560) },
    ],
};

/* ------------------------- EVENTS ----------------------------------------- */
export const events = {
    title: 'Upcoming *events*',
    items: [
        { active: true, day: '--', month: 'TBC', title: 'Event name TBC', where: 'Venue TBC', type: 'Open day', image: pic('ev-1', '', '', 700, 500) },
        { active: true, day: '--', month: 'TBC', title: 'Event name TBC', where: 'Venue TBC', type: 'Briefing', image: pic('ev-2', '', '', 700, 500) },
        { active: true, day: '--', month: 'TBC', title: 'Event name TBC', where: 'Venue TBC', type: 'Demonstration', image: pic('ev-3', '', '', 700, 500) },
    ],
};

/* ------------------------- GALLERY (add as many as you like) -------------- */
export const gallery = {
    title: 'Sandbox *in pictures*',
    items: [
        pic('g1', 'Vertiport at dusk', '', 900, 1200), pic('g2', 'Drone fleet', '', 1200, 800),
        pic('g3', 'Control room', '', 900, 900), pic('g4', 'Corridor over paddy fields', '', 900, 1300),
        pic('g5', 'Hangar interior', '', 1200, 800), pic('g6', 'Cargo drone', '', 900, 1000),
        pic('g7', 'Site survey', '', 1200, 900), pic('g8', 'Air taxi concept', '', 900, 1200),
    ],
};

/* ------------------------- PARTNERS  (logo: '' shows the name) ------------ */
export const partners = {
    title: 'A national *ecosystem*',
    lede: 'Government, regulators, research bodies and industry, working from application to execution.',
    groups: [
        { group: 'Supported by', items: ['UniMAP', 'CAAM', 'MCMC', 'MIGHT', 'FUTURISE', 'MRANTI', 'NAICO', 'STRIDE', 'SIRIM', 'MOF'].map((name) => ({ name, logo: '' })) },
        { group: 'Managed & designed by', items: [{ name: 'Vertiport Malaysia', logo: '' }, { name: 'Araken', logo: '' }] },
        { group: 'Collaborators', items: [{ name: 'EHANG', logo: '' }, { name: 'TCAB', logo: '' }, { name: 'MHS Aviation', logo: '' }] },
    ],
};

/* ------------------------- APPLY / SUBSCRIBE ------------------------------ */
export const apply = {
    title: 'Ready to *fly with us?*',
    steps: ['Express interest', 'Define activity', 'Review & approval', 'Execute'],
    applyLabel: 'Apply to Participate',
    applyHref: '',            // e.g. '/apply'. Leave '' to keep inactive for now
    subscribeLabel: 'Subscribe for updates',
    subscribeText: 'Sandbox milestones, programmes and Advanced Air Mobility news, in your inbox.',
    emailPlaceholder: 'Email address',
    subscribeButton: 'Subscribe',
    thanks: 'Thank you, you are subscribed.',
    image: pic('apply-sunset', 'Perlis Airspace Sandbox', '', 1000, 1300),
};

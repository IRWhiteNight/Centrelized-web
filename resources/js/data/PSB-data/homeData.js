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

   Sources: UniMAP Airspace Sandbox poster, "Skyway of the Future" deck,
   Website structure / use-case document, MIGHT & FUTURISE AAM Industry Report (2025).
========================================================================== */

const pic = (seed, alt = '', src = '', w = 1000, h = 700) =>
    ({ src: src || `https://picsum.photos/seed/${seed}/${w}/${h}`, alt });

/* ------------------------- PAGE ORDER ------------------------------------
   Follows the sitemap HOME structure. Move a key to rearrange; remove to hide. */
export const layout = [
    'hero', 'activity', 'about', 'why', 'capabilities', 'programmes', 'who',
    'roadmap', 'site', 'news', 'events', 'gallery', 'partners', 'apply',
];

export const labels = {
    hero: 'Home', activity: 'Current activity', about: 'The sandbox', why: 'Why it matters',
    capabilities: 'What we do', programmes: 'Programmes', who: 'Participate', roadmap: 'Roadmap',
    site: 'The site', news: 'News', events: 'Events', gallery: 'Gallery', partners: 'Partners', apply: 'Apply',
};

/* short names for the always-visible top navigation (falls back to `labels`) */
export const nav = {
    hero: 'Home', activity: 'Activity', about: 'Sandbox', why: 'Why', capabilities: 'What we do', programmes: 'Programmes',
    who: 'Participate', roadmap: 'Roadmap', site: 'Site', news: 'News', events: 'Events', gallery: 'Gallery', partners: 'Partners', apply: 'Apply',
};

/* ------------------------- HERO ------------------------------------------
   Simple centred hero: headline, lede, two buttons, four stats, and the slogan
   in the yellow ticker underneath. Every figure comes from the project documents. */
export const hero = {
    slogan: 'Innovating today, connecting tomorrow.',
    title: 'Malaysia’s first real-world testing ground for *low-altitude airspace*',
    lede: 'A national platform for testing, validation and future airspace innovation, where drones, air taxis and autonomous cargo move from prototype to proven operation.',
    primaryCta: { label: 'Apply to Participate', to: 'apply' },
    secondaryCta: { label: 'See current activity', to: 'activity' },
    stats: [
        { to: 4, label: 'Development phases, 2026 – 2030+' },
        { to: 2, label: 'Planned corridors: Timah Tasoh Dam & Langkawi' },
        { to: 6, label: 'National application areas' },
        { to: 30, suffix: ' ha', label: 'Sandbox land area (about)' },
    ],
    ticker: ['Innovating today, connecting tomorrow', 'Security & Surveillance', 'Logistics & Delivery', 'Agriculture Monitoring', 'Disaster Response', 'Infrastructure Inspection', 'Advanced Air Mobility'],
};

/* ------------------------- CURRENT ACTIVITY BANNER -----------------------
   Image banners only: no links. `image` is the banner. tag / title / text / date are optional;
   delete them from an item and that slide shows the picture alone.
   status: live | open | upcoming | done        enabled:false hides the banner */
export const activity = {
    enabled: true,
    interval: 6500,
    kicker: 'Happening now',
    items: [
        { active: true, status: 'live', tag: 'Phase 1 · In progress', title: 'Site development & initial operations', text: 'Site preparation, basic command & control, communications and early BVLOS demonstration flights are under way at Sungai Batu Pahat.', date: 'Mid 2026 – Early 2027', image: pic('act-site', 'Site development', '', 1600, 900) },
        { active: true, status: 'open', tag: 'Call for participants', title: 'Now open: apply to test in the sandbox', text: 'Manufacturers, operators, universities and agencies can express interest and define a test activity. (Sample text: replace.)', date: 'Rolling intake', image: pic('act-apply', 'Apply to participate', '', 1600, 900) },
        { active: true, status: 'upcoming', tag: 'Corridor survey', title: 'Planning the flight corridors', text: 'Eastbound to Timah Tasoh Dam, and westbound via Kuala Perlis to Langkawi Island across rivers, paddy fields and sea.', date: 'Date TBC', image: pic('act-corridor', 'Flight corridor', '', 1600, 900) },
    ],
};

/* ------------------------- WHAT IS THE SANDBOX ---------------------------- */
export const about = {
    title: 'What is the *sandbox?*',
    rows: [
        ['Definition', 'A controlled testing environment where industry, researchers and government agencies safely test and validate advanced aviation solutions, in coordination with the relevant authorities.'],
        ['Purpose', 'To accelerate Advanced Air Mobility through structured testing, regulatory validation, operational development and ecosystem collaboration.'],
        ['Core mission', 'A complete ecosystem for drone research and development, centred on a safe, controlled and fully functional mock-up aerodrome for real-world testing of new systems, procedures and technology, including drones, next-generation aerial mobility and Unmanned Traffic Management (UTM) systems.'],
        ['Location', 'Sungai Batu Pahat, Perlis: the first dedicated low-altitude airspace testing facility in Malaysia, spanning about 30 hectares.'],
    ],
    objectivesLabel: 'Objectives',
    objectives: [
        ['A national ecosystem', 'For secure drone R&D and real-world validation, where new technologies are researched, developed and proven in real operating conditions.'],
        ['Talent and collaboration', 'Advancing drone research through skill development, public engagement and collaborative R&D.'],
        ['Test-based feedback', 'Real-world feedback that improves drone operational guidelines and standards.'],
    ],
    featuresLabel: 'Key features',
    features: [
        ['Infrastructure development', ['Dedicated low-altitude test range', 'Segmented altitude zones for different operational scenarios', 'Purpose-built vertiports for take-off and landing', 'Autonomous charging stations', 'Maintenance facilities']],
        ['Talent development and collaboration', ['Partnerships with government agencies, industries and academia', 'Training programmes', 'Public demonstrations', 'Joint R&D initiatives']],
    ],
    image: pic('about-aerial', 'Aerial view of the sandbox site', '', 1000, 1300),
    facilitiesLabel: 'Functional mock-up aerodrome',
    facilities: [
        { title: 'Vertiport', text: 'Purpose-built take-off and landing pads.', image: pic('fac-vertiport', 'Vertiport') },
        { title: 'Test flight corridor', text: 'Segmented altitude zones for BVLOS trials.', image: pic('fac-corridor', 'Test flight corridor') },
        { title: 'Drone hub', text: 'Staging, charging and cargo handling.', image: pic('fac-hub', 'Drone hub') },
        { title: 'Research & maintenance', text: 'Workshops for integration and repair.', image: pic('fac-maint', 'Research and maintenance facility') },
        { title: 'Flight simulator', text: 'Operator training and mission rehearsal.', image: pic('fac-sim', 'Flight simulator') },
        { title: 'Radar / communication / UTMS', text: 'Communications and traffic management.', image: pic('fac-radar', 'Radar and communication system') },
    ],
};

/* ------------------------- VISION + WHY UNIMAP (under "about") ------------ */
export const vision = {
    kicker: 'Strategic long-term vision',
    title: 'Malaysia’s platform for *autonomous airspace*',
    text: 'The Perlis Airspace Sandbox is envisioned as Malaysia’s national platform for autonomous airspace innovation, future mobility validation and low altitude economy development.',
    tiers: [
        ['Future mobility', 'AAM · eVTOL · Autonomous mobility'],
        ['Autonomous airspace', 'Safe · Smart · Connected · Scalable'],
        ['Digital airspace management', 'UTM · U-DEF · AI · Automation'],
        ['High-tech industry growth', 'Innovation · Startups · R&D · Commercialization'],
        ['Low altitude economy', 'Jobs · Investment · Productivity · National growth'],
    ],
    whyLabel: 'Why UniMAP',
    whyLede: 'UniMAP is uniquely positioned to lead the low altitude economy. Through research excellence, industry partnerships and real-world focus, we have the capability, experience and platform to make it happen.',
    why: [
        ['Strong experience in UAS research', 'Years of focused research in UAS technologies, systems and applications.'],
        ['Close collaboration with industry', 'Active partnerships with industries, agencies and technology players.'],
        ['Proven track record in drone development', 'Developed multiple UAV platforms and systems with real-world applications.'],
        ['Focus on real-world implementation', 'From research to operations, we bridge the gap and deliver real impact.'],
        ['Strategic location in Perlis', 'Ideal environment for testing, validation and a future low altitude economy hub.'],
    ],
};

/* ------------------------- WHY IT MATTERS --------------------------------- */
export const why = {
    lede: 'Malaysia is ready, but not fully prepared. Technology exists and talent is building solutions, yet the path from prototype to real-world impact is still incomplete.',
    title: 'The next infrastructure is *in the sky.*',
    layers: [
        ['Roads', 'connect cities', 'Past'],
        ['Internet', 'connects people', 'Present'],
        ['Airspace', 'connects the future', 'Future'],
    ],
    layersNote: ['Low altitude airspace =', 'new economic layer'],
    image: pic('why-drone', 'Drone over paddy fields', '', 1400, 900),
    gaps: [
        ['Many drone technologies already exist', 'Innovation is happening.'],
        ['But limited real-world testing environment', 'Not enough space to test and prove.'],
        ['Gap between research and real deployment', 'Prototypes remain prototypes.'],
        ['Industry lacks a validation platform', 'Hard to validate, hard to scale.'],
        ['Regulators need real operational data', 'Policies require real operational evidence.'],
    ],
    missingLabel: 'What is missing?',
    missing: ['Real testing environment', 'Safe and controlled operational space', 'Platform for BVLOS validation', 'Training and competency ecosystem', 'Collaboration between academia, industry and government'],
    market: [
        { to: 137, prefix: 'US$', suffix: 'B', label: 'Global AAM market by 2035, growing 24.6% a year' },
        { to: 70, prefix: 'RM', suffix: 'B', label: 'Additional revenue for Malaysia over 20 years' },
        { to: 34, prefix: 'RM', suffix: 'B', label: 'Projected GDP contribution over the same period' },
    ],
    source: 'Source: MIGHT & FUTURISE, Advanced Air Mobility Industry Report (2025); global figure from Grand View Research as cited in the report.',
    perlisLabel: 'Why Perlis: the ideal test environment',
    perlisNote: 'Strategically positioned in the northern corridor with vast, less congested airspace.',
    perlis: [
        ['Low population density', 'Minimal impact on daily life and communities. Ideal for safe testing and operations.'],
        ['Less airspace congestion', 'Fewer restrictions, simpler approvals and more flexible operations.'],
        ['Suitable terrain for testing', 'Diverse landscape supporting multiple use cases and scenarios.'],
        ['Safe and controlled environment', 'Lower risk environment for testing, validation and training.'],
        ['Potential to become a new tech hub', 'Catalyzing economic growth, jobs, investment and regional development.'],
    ],
};

/* ------------------------- WHAT WE DO + NATIONAL APPLICATIONS ------------- */
export const capabilities = {
    title: 'What we do in the *sandbox*',
    lede: 'In the sandbox, we turn innovation into real impact: real-world operations, testing and ecosystem validation.',
    items: [
        ['BVLOS flight testing', 'Conduct safe and structured Beyond Visual Line of Sight flights in real-world conditions.'],
        ['Technology validation', 'Validate systems, payloads, communications and sense & avoid technologies.'],
        ['Operational testing (real missions)', 'Simulate real missions and use cases to prove operational feasibility and reliability.'],
        ['Training and certification', 'Develop skilled operators through structured training and certification programmes.'],
        ['Data collection for regulators', 'Generate high-quality airspace and operational data to support regulators.'],
        ['Development of SOP & safety framework', 'Build Standard Operating Procedures and a safety framework for the industry.'],
    ],
    appsTitle: 'National low altitude *ecosystem applications*',
    appsLede: 'One ecosystem. Multiple national applications.',
    badges: ['Shared airspace', 'Multiple missions', 'Real data, real decisions', 'Safe. Secure. Controlled.'],
    apps: [
        ['Security & surveillance', 'Real-time monitoring for border security, critical areas and situational awareness.', 'Faster detection. Stronger response.'],
        ['Logistics & delivery', 'Autonomous delivery solutions for medicines, essentials and remote communities.', 'Smarter logistics. Better connectivity.'],
        ['Agriculture monitoring', 'Precision agriculture through crop health analysis, livestock monitoring and smart farm insights.', 'Higher yield. Sustainable future.'],
        ['Disaster response', 'Rapid assessment, search & rescue and emergency support when every second counts.', 'Quick action. Saves lives.'],
        ['Infrastructure inspection', 'Safer and more efficient inspection of towers, bridges, pipelines and critical infrastructure.', 'Safer inspections. Lower risks. Lower costs.'],
        ['Advanced Air Mobility (AAM)', 'Enabling future air taxi operations and regional aerial mobility for smart, connected cities.', 'Future mobility. Connecting people.'],
    ],
};

/* ------------------------- FEATURED PROGRAMMES ---------------------------- */
export const programmes = {
    title: 'Featured testing *programmes*',
    lede: 'Testing and innovation areas, open to government, industry and research.',
    items: [
        { active: true, title: 'First Responder Operations', text: 'Search and rescue, disaster response and emergency support when every second counts.', tag: 'Public safety', image: pic('prog-rescue', 'First responder operations') },
        { active: true, title: 'Advanced Air Mobility Operations', text: 'Vertiport demonstrations, eVTOL integration studies and AAM operation simulation.', tag: 'eVTOL · Vertiport', image: pic('prog-aam', 'Advanced air mobility') },
        { active: true, title: 'Cargo Logistics Operations', text: 'Autonomous delivery of medicines, essentials and cargo along planned BVLOS corridors.', tag: 'BVLOS · Delivery', image: pic('prog-cargo', 'Cargo logistics') },
        { active: true, title: 'Supporting technology & system integration', text: 'UTM, digital airspace management, communications and system integration testing.', tag: 'UTM · Systems', image: pic('prog-tech', 'Technology and integration') },
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

/* ------------------------- ROADMAP ----------------------------------------
   from / to = position on the timeline in years (2026.5 = mid 2026).
   Set  now: true  on the running phase. `span` = first year, last year shown. */
export const roadmap = {
    title: 'Development *implementation roadmap*',
    lede: 'A progressive journey towards Malaysia’s low altitude airspace ecosystem. Select a phase to see its components and expected outcomes.',
    currentLabel: 'Current stage',
    span: [2026, 2031],
    phases: [
        {
            title: 'Phase 1', name: 'Foundation and initial operational setup', period: 'Mid 2026 – Early 2027', from: 2026.5, to: 2027.2, now: true,
            text: 'Establish the core operational, technological and governance foundation to enable safe and controlled low altitude airspace operations.',
            objective: 'Lay the essential foundation, validate initial operations, and build the key building blocks for future expansion.',
            components: [
                ['Site development', ['Site preparation', 'Initial operational area', 'Access & basic utilities', 'Operational safety zone']],
                ['Command & control center (basic)', ['Initial operations control', 'Basic communication systems', 'Operational monitoring', 'Initial flight operations management']],
                ['Communication infrastructure (initial)', ['Operational communication', 'Telemetry support', 'Operational monitoring infrastructure', 'Initial surveillance capability']],
                ['Initial operations', ['Early demonstration flights', 'Basic operation validation', 'Basic BVLOS operations', 'Collection of initial operational data']],
                ['Governance & regulatory alignment', ['Operational SOP development', 'Safety framework', 'Regulatory coordination', 'Governance framework']],
            ],
            outcomes: ['Initial operational capability', 'Basic operational infrastructure', 'Basic safety systems', 'Early validation platform', 'Foundation for ecosystem development'],
        },
        {
            title: 'Phase 2', name: 'Operational validation and ecosystem expansion', period: 'Mid 2027 – 2028', from: 2027.5, to: 2028.5,
            text: 'Building a safe, scalable and resilient airspace ecosystem that accelerates innovation, drives economic growth, and positions Malaysia as a regional leader in Urban Air Mobility.',
            components: [
                ['UTM system development', ['Digital airspace management', 'Flight authorization', 'Operational monitoring', 'Traffic coordination']],
                ['BVLOS operation expansion', ['Operational corridors', 'Long range validation', 'Multi-platform testing']],
                ['Training and simulation center', ['Operator training facilities', 'Operation simulation center', 'Multi-agency training', 'Safety training']],
                ['Safety and security enhancement', ['Surveillance enhancement', 'Emergency response systems', 'Safety monitoring', 'Compliance monitoring']],
                ['Industry & startup ecosystem', ['Technology demonstration', 'Startup acceleration', 'Commercialization support', 'Industry collaboration']],
            ],
            outcomes: ['Mature BVLOS operations at scale', 'Proven safety and security framework', 'Stronger ecosystem and industry participation', 'Multi-stakeholder collaboration and partnerships', 'Global recognition and positioning in UAM innovation'],
        },
        {
            title: 'Phase 3', name: 'Advanced airspace ecosystem development', period: '2028 – 2029', from: 2028.5, to: 2029.5,
            text: 'Vertiport demonstration, eVTOL integration studies, inter-zone and maritime operations.',
            components: [
                ['Advanced digital airspace management', ['Advanced airspace management', 'Data integration platform', 'Advanced surveillance system', 'Autonomous operation management']],
                ['Future air mobility demonstration', ['AAM operation simulation', 'Vertiport demonstration', 'eVTOL integration studies', 'Future mobility simulation']],
                ['Operation corridor expansion', ['Autonomous maritime operations', 'Aerial logistics operations', 'Inter-zone operations', 'Long-range operations']],
                ['R&D and international collaboration', ['International collaboration', 'Joint technology development', 'Global benchmarking', 'Advanced validation activities']],
            ],
            outcomes: ['National validation platform', 'AAM demonstration hub', 'Advanced autonomous operations', 'Global R&D collaboration'],
        },
        {
            title: 'Phase 4', name: 'Sustainability and future mobility integration', period: '2029 – 2030+', from: 2029.5, to: 2030.9,
            text: 'Commercial model, smart airspace integration, ASEAN sandbox collaboration and a global validation network.',
            components: [
                ['Sustainable operations', ['Commercial and business model', 'Financial sustainability', 'Operational efficiency']],
                ['Smart airspace integration', ['Integration with national systems', 'Smart city and smart logistics', 'Data-driven operations']],
                ['Regional collaboration (ASEAN)', ['ASEAN sandbox collaboration', 'Regional interoperability', 'Cross-border operations']],
                ['Global partnerships', ['International technology partners', 'Global validation network', 'Strategic investments']],
            ],
            outcomes: ['Regional low altitude airspace hub', 'International validation center', 'Sustainable future mobility ecosystem', 'Economic & industry growth'],
        },
    ],
    outcomeLabel: 'Strategic outcome',
    outcomes: ['Safe operations', 'Technology innovation', 'Industry growth', 'National & regional leadership', 'Global & regional leadership'],
    enablersLabel: 'Strategic enablers',
    enablers: ['Infrastructure readiness', 'Regulatory alignment', 'Technology maturity', 'Industry participation', 'Investment growth'],
    closing: 'Building today the foundation for tomorrow’s autonomous and connected airspace.',
    image: pic('road-site', 'Phase 1 site', '', 1600, 600),
};

/* ------------------------- THE SITE + CORRIDORS --------------------------- */
export const site = {
    title: 'The *site* & flight corridors',
    lede: 'Sungai Batu Pahat Mango Farm (PKENPs), Perlis, beside the COE-UAS & Boomslang runway.',
    where: {
        tag: 'Location',
        name: 'Sungai Batu Pahat Mango Farm (PKENPs)',
        note: 'The first dedicated low-altitude airspace testing facility in Malaysia.',
        facts: [
            ['State', 'Perlis, Malaysia'],
            ['Next to', 'COE-UAS & Boomslang runway'],
            ['Runway', 'To be upgraded as part of the sandbox'],
            ['Phase 1', 'Mango Farm development area'],
        ],
    },
    landLabel: 'Land use',
    /* the FIRST stat is the total; the bars are drawn to scale against it */
    stats: [
        { to: 30, suffix: ' ha', label: 'Sandbox land area (about)' },
        { to: 19.7, dec: 1, suffix: ' ha', label: 'Proposed development area' },
        { to: 2.9, dec: 1, suffix: ' ha', label: 'Phase 1 development area' },
    ],
    p1Label: 'Phase 1 · Mango Farm',
    p1Text: 'Architect’s conceptual layout for the first development area.',
    p1: ['Guard house', 'Main building', 'EV parking', 'Parking', 'Motorcycle parking', 'Helipad', 'Vertiport', 'Lake'],
    image: pic('site-plan', 'Phase 1 architect conceptual illustration', '', 1400, 900),

    corridorsLabel: 'Planned *corridors*',
    /* EXACT CORRIDOR MAP (optional). Leave both empty and the map block is hidden.
       - embed: the src of a Google Maps ("Share > Embed a map") or OpenStreetMap iframe
       - image: your own surveyed map, e.g. { src: '/images/corridor-map.png', alt: 'Planned flight corridors' } */
    map: { embed: '', image: null, title: 'Planned flight corridors' },
    corridors: [
        {
            tag: 'Eastbound', title: 'Timah Tasoh Dam',
            text: 'From Sungai Batu Pahat heading east, a flight path corridor will be built through rivers and paddy fields to Timah Tasoh Dam, then turning back towards the sandbox.',
            route: ['Sungai Batu Pahat', 'Rivers & paddy fields', 'Timah Tasoh Dam', 'Return to the sandbox'],
            image: pic('cor-east', 'Corridor towards Timah Tasoh Dam', '', 1200, 750),
        },
        {
            tag: 'Westbound', title: 'Kuala Perlis to Langkawi',
            text: 'Heading west via the upper river area and paddy fields to Kuala Perlis, then across the sea to Langkawi Island.',
            route: ['Sungai Batu Pahat', 'Upper river area & paddy fields', 'Kuala Perlis', 'Across the sea', 'Langkawi Island'],
            image: pic('cor-west', 'Corridor towards Langkawi Island', '', 1200, 750),
        },
    ],
    corridorsNote: 'Routes are indicative. Final alignments follow the corridor survey.',
};

/* ------------------------- NEWS ------------------------------------------- */
export const news = {
    title: 'Latest *news* & project progress',
    more: { label: 'Visit the Media Centre', href: '' },   // e.g. '/media-centre'. Leave '' to hide the button
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

/* ------------------------- GALLERY ---------------------------------------- */
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
    title: 'Building *together*',
    lede: 'A collaborative ecosystem where knowledge, innovation and collaboration come together to build Malaysia’s low altitude future.',
    quote: 'No single entity can do this alone. Ecosystem is the key.',
    roles: [
        ['University', 'Research, talent & innovation', 'We create knowledge and future talent.'],
        ['Industry', 'Deployment & commercialization', 'We turn innovation into real solutions and market value.'],
        ['Government', 'National coordination & support', 'We provide policy, funding and national direction.'],
        ['Agencies', 'Real operational use cases', 'We are the real users, driving real-world impact.'],
        ['Regulator', 'Safety, governance & compliance', 'We ensure safety, trust and responsible growth.'],
    ],
    strengthLabel: 'Our collective strength',
    strength: [
        ['Shared vision', 'One goal for Malaysia’s low altitude future.'],
        ['Shared resources', 'Pooling expertise, assets and capabilities.'],
        ['Shared commitment', 'Working together with trust and transparency.'],
        ['Shared impact', 'Delivering value for industry and nation.'],
    ],
    enableLabel: 'Together, we enable',
    enable: ['A safer sky for all', 'A stronger economy', 'Innovation that matters', 'A sustainable Malaysia', 'Global competitiveness'],
    groups: [
        { group: 'Led by', items: [{ name: 'UniMAP', logo: '' }, { name: 'COE-UAS', logo: '' }] },
        { group: 'Supported by', items: ['CAAM', 'MCMC', 'MIGHT', 'FUTURISE', 'MRANTI', 'NAICO', 'STRIDE', 'SIRIM', 'MOF'].map((name) => ({ name, logo: '' })) },
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

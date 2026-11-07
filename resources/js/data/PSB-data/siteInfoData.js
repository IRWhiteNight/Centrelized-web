/* ==========================================================================
   SITE INFORMATION: ALL CONTENT LIVES HERE
   Edit text, links and images in this file only. The page layout never needs to change.
   - "TBC" means the supplied documents do not contain this yet. Replace it when you have it.
   - Images live in  public/images/about/  (an empty or missing file shows a labelled placeholder).
   - Add / remove / reorder items in any list and the page follows.
   ========================================================================== */

const P = '/images/about/';

export const IMG = {
    aerial: P + 'site-aerial.jpg',
    plan: P + 'site-plan.jpg',
    farm: P + 'mango-farm-site.jpg',
    phase1: P + 'phase1-area.jpg',
    exterior: P + 'building-exterior.jpg',
    hangar: P + 'hangar-interior.jpg',
    gate: P + 'entrance-gate.jpg',
    photo1: P + 'site-photo-1.jpg',
    photo2: P + 'site-photo-2.jpg',
    dam: P + 'corridor-timah-tasoh.jpg',
    sea: P + 'corridor-langkawi.jpg',
};

export const page = {
    brand: 'Perlis Airspace Sandbox',
    homeHref: '/',
    applyHref: '/#join',
    applyLabel: 'Apply to participate',
};

export const hero = {
    eyebrow: 'Site information',
    title: 'Everything you need to know',
    titleEm: 'before you fly with us.',
    text: 'Where the sandbox is, what is on site, how the airspace works, today’s weather and the guidelines for taking part. In one place.',
    stats: [
        { to: 30, unit: ' ha', label: 'Sandbox facility (about)' },
        { to: 6, unit: '', label: 'Aerodrome facilities' },
        { to: 2, unit: '', label: 'Planned flight corridors' },
        { to: 4, unit: '', label: 'Development phases' },
    ],
};

/* Order here = order on the page = order in the top navigation */
export const sections = [
    { id: 'location', label: 'Location & Access', n: '01', title: 'Location', em: '& access.', intro: 'Sungai Batu Pahat, Perlis: a controlled, accessible, low-density environment for early-stage testing and scalable sandbox operations.' },
    { id: 'facilities', label: 'Facilities', n: '02', title: 'Facilities', em: '& infrastructure.', intro: 'A functional mock-up aerodrome: test areas, landing areas, hangar and ground support in one safe, controlled site.' },
    { id: 'airspace', label: 'Airspace', n: '03', title: 'Airspace &', em: 'operations.', intro: 'A controlled, regulator-ready airspace, coordinated with the Civil Aviation Authority of Malaysia and other agencies.' },
    { id: 'weather', label: 'Weather', n: '04', title: 'Weather', em: 'information.', intro: 'A quick summary for planning, with links to the official sources you should always check before flying.' },
    { id: 'guidelines', label: 'Guidelines', n: '05', title: 'Guidelines', em: '& downloads.', intro: 'How to take part, what support is provided, safety guidance and documents to download.' },
];

/* ---------- 01 LOCATION & ACCESS ---------- */
export const location = {
    address: [
        'Sungai Batu Pahat Mango Farm (PKENPs)',
        'Sungai Batu Pahat, Perlis, Malaysia',
    ],
    coordinates: 'TBC',
    postcode: 'TBC',
    /* Google Maps searches this text. Replace with exact coordinates later, e.g. '6.50,100.20' */
    mapQuery: 'Sungai Batu Pahat, Perlis, Malaysia',
    mapLink: 'https://www.google.com/maps/search/?api=1&query=Sungai+Batu+Pahat+Perlis+Malaysia',
    facts: [
        { to: 30, dec: 0, unit: ' ha', label: 'About 30 hectares: the sandbox facility in Sungai Batu Pahat, Perlis' },
        { to: 19.7, dec: 1, unit: ' ha', label: 'Sungai Batu Pahat Mango Farm site (PKENPs)' },
        { to: 2.9, dec: 1, unit: ' ha', label: 'Proposed Phase 1 development area' },
        { to: 2, dec: 0, unit: '', label: 'Planned flight path corridors from the site' },
    ],
    access: [
        { title: 'Site entrance', text: 'A guard house controls the entrance to the Phase 1 site.' },
        { title: 'Parking', text: 'Car parking, EV parking and motorcycle parking are planned beside the main building.' },
        { title: 'Connectivity', text: 'Well-connected with infrastructure, universities and innovation partners.' },
        { title: 'Low-density surroundings', text: 'Low population density means minimal impact on daily life and communities.' },
    ],
    nearby: ['Perlis Snake Park', 'Taman Eko-Rimba Bukit Ayer', 'Timah Tasoh Dam', 'Kuala Perlis', 'Langkawi Island (via the west corridor)'],
    gallery: [
        { src: IMG.aerial, caption: 'Sandbox site and the runway that will be upgraded' },
        { src: IMG.farm, caption: 'Sungai Batu Pahat Mango Farm site, 19.7 ha' },
        { src: IMG.phase1, caption: 'Proposed Phase 1 development area, 2.9 ha' },
        { src: IMG.photo2, caption: 'On site' },
    ],
};

/* ---------- 02 FACILITIES & INFRASTRUCTURE ---------- */
export const facilities = {
    items: [
        { name: 'Vertiport', tag: 'Landing areas', src: P + 'vertiport.jpg', text: 'Purpose-built vertiports for take-off and landing.' },
        { name: 'Test Flight Corridor', tag: 'Test areas', src: P + 'test-flight-corridor.jpg', text: 'A dedicated low-altitude test range with segmented altitude zones for different operational scenarios.' },
        { name: 'Drone Hub', tag: 'Ground support', src: P + 'drone-hub.jpg', text: 'The hub for drone operations within the functional mock-up aerodrome.' },
        { name: 'Research & Maintenance Facility', tag: 'Ground support', src: P + 'research-maintenance.jpg', text: 'Maintenance facilities and a base for research and development of new systems and technology.' },
        { name: 'Flight Simulator', tag: 'Training', src: P + 'flight-simulator.jpg', text: 'Operator training and simulation. The Phase 2 roadmap adds a full Training and Simulation Center.' },
        { name: 'Radar / Communication System / UTMS', tag: 'Airspace management', src: P + 'radar-utms.jpg', text: 'Radar, communication and Unmanned Traffic Management (UTM) systems for digital airspace management.' },
    ],
    hangar: { src: IMG.hangar, caption: 'Main building and hangar bay, architect conceptual render' },
    exterior: { src: IMG.exterior, caption: 'Main building, architect conceptual render' },
    planTitle: 'Phase 1 site plan',
    plan: { src: IMG.plan, caption: 'Architect conceptual illustration: Phase 1, Mango Farm' },
    legend: ['Guard House', 'Main Building', 'EV Parking', 'Parking', 'Motorcycle Parking', 'Helipad', 'Vertiport', 'Lake'],
    provided: {
        title: 'Available to participants',
        items: [
            'Access to sandbox test zones',
            'Vertiport, landing area and staging',
            'Power and charging support (if available)',
            'Site logistics coordination',
        ],
    },
    phase1: {
        title: 'Phase 1 build-out',
        note: 'Mid 2026 – Early 2027',
        items: ['Site development: initial operational area, access and basic utilities, operational safety zone', 'Command & control center (basic)', 'Communication infrastructure (initial): telemetry and operational monitoring', 'Runway upgrade at the COE-UAS & Boomslang Runway'],
    },
};

/* ---------- 03 AIRSPACE & OPERATIONAL INFORMATION ---------- */
export const airspace = {
    overview: [
        { title: 'Segmented altitude zones', text: 'Different zones for different operational scenarios.' },
        { title: 'Controlled but realistic', text: 'Safe, secure and flexible airspace designed for innovation.' },
        { title: 'Less congestion', text: 'Fewer restrictions, simpler approvals and more flexible operations.' },
        { title: 'Regulator-ready', text: 'Operations are coordinated with the Civil Aviation Authority of Malaysia and other agencies.' },
    ],
    areas: [
        { name: 'Test Zone A', text: 'Payload & navigation testing.' },
        { name: 'Test Zone B', text: 'Long range & endurance validation.' },
        { name: 'BVLOS Corridor', text: 'Beyond Visual Line of Sight operations.' },
        { name: 'Training Zone', text: 'Pilot & operator development.' },
    ],
    corridors: [
        { src: IMG.dam, title: 'East corridor: Timah Tasoh Dam', text: 'From Sungai Batu Pahat heading east, a flight path corridor will be built leading to the Timah Tasoh Dam through rivers and paddy fields.' },
        { src: IMG.sea, title: 'West corridor: Langkawi Island', text: 'An overall picture of the flight path corridor heading west to Langkawi Island via the Kuala Perlis sea.' },
    ],
    glance: [
        { k: 'Operating hours', v: 'TBC' },
        { k: 'Operating areas', v: 'Test Zone A, Test Zone B, BVLOS corridor, Training Zone' },
        { k: 'Airspace authority', v: 'Coordination with the Civil Aviation Authority of Malaysia and other agencies' },
        { k: 'Approval', v: 'Every activity is reviewed and approved with the relevant authorities before it is executed' },
        { k: 'General restrictions', v: 'TBC' },
    ],
};

/* ---------- 04 WEATHER ---------- */
export const weather = {
    /* Live summary from Open-Meteo (free, no key). Change lat/lon to the exact site when known. */
    label: 'Kangar, Perlis (nearest forecast point)',
    lat: 6.4414,
    lon: 100.1986,
    note: 'Indicative only. Always check the official sources below before any flight.',
    links: [
        { title: 'MET Malaysia', text: 'Official forecasts and warnings from the Malaysian Meteorological Department.', href: 'https://www.met.gov.my' },
        { title: 'CAAM', text: 'Civil Aviation Authority of Malaysia: aviation notices and regulations.', href: 'https://www.caam.gov.my' },
    ],
};

/* ---------- 05 GUIDELINES & DOWNLOADS ---------- */
export const guidelines = {
    steps: [
        { title: 'Submit interest', text: 'Send your Expression of Interest.' },
        { title: 'Define activity', text: 'Outline your testing scope and objectives.' },
        { title: 'Review & approval', text: 'Coordination and review with relevant authorities.' },
        { title: 'Execute', text: 'Conduct your testing within the sandbox.' },
    ],
    accordion: [
        {
            title: 'Who can participate',
            list: ['Aircraft & drone manufacturers', 'Technology & system providers', 'Operators & service providers', 'Universities & research institutions', 'Government agencies'],
        },
        {
            title: 'Operational notes',
            list: ['Ways to take part: join government-led trials, test & demonstrate your technology, or conduct research & innovation', 'Grant applications: funding opportunities, application guidance and documentation review', 'Collaboration: matching with local partners and joint testing with other participants and hosts'],
        },
        {
            title: 'Safety guidance',
            list: ['Operational SOP development', 'Safety framework', 'Regulatory coordination', 'Governance framework', 'Basic safety systems and an operational safety zone on site'],
        },
    ],
    /* href '' shows "Coming soon". Put the file in public/downloads/ and set e.g. '/downloads/eoi-form.pdf' */
    downloads: [
        { title: 'Expression of Interest form', type: 'PDF', href: '' },
        { title: 'Participation guide', type: 'PDF', href: '' },
        { title: 'Safety guidance & SOP summary', type: 'PDF', href: '' },
        { title: 'Public airspace chart', type: 'PDF', href: '' },
    ],
};

/* ==========================================================================
   OPPORTUNITIES PAGE CONTENT
   Edit text here, not in Opportunities.jsx.
   Sources: UniMAP Airspace Sandbox poster, "The Skyway of the Future" deck,
   FUTURISE / MIGHT AAM Industry Report (2025).
========================================================================== */

/* >>> Change these to your real route paths <<< */
export const links = {
    apply: '/apply',
    services: '/services',
    sandbox: '/about',
    contact: '/contact',
};

/* sticky sub menu: one entry per section of the page */
export const sections = [
    { id: 'ways', label: 'Ways to participate' },
    { id: 'areas', label: 'Testing and innovation areas' },
    { id: 'programmes', label: 'Open programmes and calls' },
    { id: 'how', label: 'How to participate' },
    { id: 'benefits', label: 'Participant benefits' },
];

export const hero = {
    eyebrow: 'Opportunities at the Perlis Airspace Sandbox',
    titleLines: ['Bring your', 'flight test', 'to Perlis.'],
    highlight: 'to Perlis.',
    lede: 'A controlled low altitude range, a mock-up aerodrome and planned flight corridors, open to government agencies, industry and researchers. Choose a way in, define your activity, and fly it.',
    primaryButton: 'Apply to participate',
    secondaryButton: 'See ways to participate',
    mapLabel: 'Schematic: three ways in and four testing areas around the sandbox',
};

export const heroStats = [
    { value: 3, label: 'ways to participate' },
    { value: 4, label: 'testing and innovation areas' },
    { value: 4, label: 'steps from interest to execution' },
    { value: 4, label: 'development phases, mid 2026 to 2030+' },
];

export const ticker = [
    'Government-led trials',
    'Industry testing and demonstrations',
    'Research and innovation',
    'First responder operations',
    'Advanced air mobility',
    'Cargo logistics',
    'System integration',
    'BVLOS validation',
    'UTM trials',
    'Operator training',
];

/* ---------- 01 WAYS TO PARTICIPATE ---------- */
export const ways = {
    heading: 'Three ways into the sandbox.',
    lede: 'Every participant starts from one of three routes. They differ in who leads and what comes out, but they share the same range, facilities and application process.',
    items: [
        {
            kind: 'For agencies and regulators',
            who: 'Government-led trials',
            text: 'Run structured trials with real aircraft and real missions, and gather operational data that supports policy and standards.',
            points: [
                'Test operational procedures and SOPs',
                'Collect data for regulators',
                'Rehearse multi-agency missions',
                'Feed back into drone operational guidelines',
            ],
            outcome: 'Evidence for rules and standards',
            cta: 'Plan a trial',
        },
        {
            kind: 'For companies and startups',
            who: 'Industry testing and demonstrations',
            text: 'Validate platforms, payloads and communications outside the lab, then show the results to customers and partners.',
            points: [
                'Validate systems, payloads and communications',
                'Simulate real missions and use cases',
                'Public and customer demonstrations',
                'Startup acceleration and commercialisation support',
            ],
            outcome: 'Proof a prototype works in the field',
            cta: 'Book a test window',
        },
        {
            kind: 'For universities and research teams',
            who: 'Research and innovation',
            text: 'Take research out of the lab onto a safe, controlled range, working alongside UniMAP and COE-UAS researchers.',
            points: [
                'Joint R&D with UniMAP and COE-UAS',
                'Real-world data for research',
                'Postgraduate and postdoctoral opportunities',
                'International research collaboration',
            ],
            outcome: 'Research that reaches deployment',
            cta: 'Propose a project',
        },
    ],
};

/* ---------- 02 TESTING AND INNOVATION AREAS ---------- */
export const areas = {
    heading: 'Four areas we test.',
    lede: 'Pick the area closest to your mission. Each one lists the scenarios it supports and the sandbox facilities you would use.',
    items: [
        {
            id: 'firstresponder',
            title: 'First responder operations',
            summary: 'Rapid assessment, search and rescue and emergency support, tested before every second counts.',
            scenarios: [
                'Search and rescue support',
                'Rapid disaster assessment',
                'Situational awareness for critical areas',
                'Multi-agency emergency response exercises',
            ],
            facilities: ['Test flight corridor', 'Radar and communication system / UTMS', 'Flight simulator'],
            outputs: ['Coverage and response-time data', 'Procedures tested against real flights'],
        },
        {
            id: 'aam',
            title: 'Advanced air mobility operations',
            summary: 'Prepare for air taxis and passenger eVTOLs through vertiport operations, integration studies and future mobility simulation.',
            scenarios: [
                'AAM operation simulation',
                'Vertiport demonstration',
                'eVTOL integration studies',
                'Future mobility simulation',
            ],
            facilities: ['Vertiport', 'Test flight corridor', 'Radar and communication system / UTMS'],
            outputs: ['Operating data for AAM rules', 'Vertiport procedures'],
            fact: 'The global AAM market is projected to reach USD 137.11 billion by 2035, growing about 24.6% a year from 2023 (Grand View Research, cited in the 2025 FUTURISE and MIGHT AAM industry report).',
        },
        {
            id: 'cargo',
            title: 'Cargo logistics operations',
            summary: 'Autonomous delivery for medicines, essentials and remote communities, from short hops to long corridors.',
            scenarios: [
                'Payload and navigation testing',
                'Long range and endurance validation',
                'Aerial logistics operations',
                'Inter-zone operations',
            ],
            facilities: ['Drone hub', 'Test flight corridor', 'Research and maintenance facility'],
            outputs: ['Delivery reliability data', 'Payload and range validation'],
        },
        {
            id: 'tech',
            title: 'Supporting technology and system integration',
            summary: 'Test the systems that keep low altitude airspace safe: UTM, communications, surveillance and data links.',
            scenarios: [
                'Digital airspace management and UTM',
                'Flight authorisation and traffic coordination',
                'Communication, telemetry and surveillance',
                'Platform and payload integration',
            ],
            facilities: ['Radar and communication system / UTMS', 'Research and maintenance facility', 'Flight simulator', 'Drone hub'],
            outputs: ['Integration test results', 'Interoperability findings'],
        },
    ],
    labels: { scenarios: 'What you can test', facilities: 'Facilities you would use', outputs: 'What you take away' },
};

/* ---------- 03 OPEN PROGRAMMES AND CALLS ----------
   PLACEHOLDER: windows below follow the development timeline (phases 1 to 4).
   Replace with confirmed calls when they are announced.
   status.key: 'open' (register interest now) or 'planned'. */
export const programmes = {
    heading: 'Open programmes and calls.',
    lede: 'Participation windows follow the sandbox development phases. Phase 1 is the first to open; later windows are planned. Open a row to see the brief.',
    note: 'Dates follow the development timeline and may change. Register interest and we will send the full brief when a call opens.',
    phases: [
        { n: 1, when: 'Mid 2026 to early 2027', name: 'Foundation and initial operational setup' },
        { n: 2, when: 'Mid 2027 to 2028', name: 'Operational validation and ecosystem expansion' },
        { n: 3, when: '2028 to 2029', name: 'Advanced airspace ecosystem development' },
        { n: 4, when: '2029 to 2030+', name: 'Sustainability and future mobility integration' },
    ],
    items: [
        {
            id: 'early-demo',
            phase: 1,
            areas: ['cargo', 'tech'],
            title: 'Early demonstration flights',
            window: 'Mid 2026 to early 2027',
            status: { key: 'open', label: 'Register interest' },
            summary: 'First flights from the Phase 1 site: demonstrations, basic operation validation and early BVLOS runs.',
            scope: ['Early demonstration flights', 'Basic operation validation', 'Basic BVLOS operations', 'Collection of initial operational data'],
            provided: ['Initial operational area and safety zone', 'Basic communication and monitoring', 'Operational SOP support'],
            who: 'Agencies and companies with a ready platform.',
        },
        {
            id: 'sop',
            phase: 1,
            areas: ['firstresponder', 'tech'],
            title: 'Governance and SOP development',
            window: 'Mid 2026 to early 2027',
            status: { key: 'open', label: 'Register interest' },
            summary: 'Work with regulators and the sandbox team to shape operating procedures and the safety framework.',
            scope: ['Operational SOP development', 'Safety framework', 'Regulatory coordination', 'Governance framework'],
            provided: ['Regulatory coordination support', 'Test-based feedback loop for guidelines'],
            who: 'Government agencies, regulators and operators.',
        },
        {
            id: 'bvlos',
            phase: 2,
            areas: ['cargo', 'firstresponder'],
            title: 'BVLOS operation expansion',
            window: 'Mid 2027 to 2028',
            status: { key: 'planned', label: 'Planned' },
            summary: 'Operational corridors, long range validation and multi-platform testing.',
            scope: ['Operational corridors', 'Long range validation', 'Multi-platform testing'],
            provided: ['Corridor access', 'Monitoring and data collection'],
            who: 'Operators and companies moving beyond visual line of sight.',
        },
        {
            id: 'utm',
            phase: 2,
            areas: ['tech'],
            title: 'UTM system trials',
            window: 'Mid 2027 to 2028',
            status: { key: 'planned', label: 'Planned' },
            summary: 'Digital airspace management trials for flight authorisation and traffic coordination.',
            scope: ['Digital airspace management', 'Flight authorisation', 'Operational monitoring', 'Traffic coordination'],
            provided: ['UTM environment', 'Radar and communication system'],
            who: 'UTM providers, agencies and system integrators.',
        },
        {
            id: 'training',
            phase: 2,
            areas: ['firstresponder', 'tech'],
            title: 'Operator training and simulation',
            window: 'Mid 2027 to 2028',
            status: { key: 'planned', label: 'Planned' },
            summary: 'Train operators and agency teams on simulators and in multi-agency exercises.',
            scope: ['Operator training facilities', 'Operation simulation centre', 'Multi-agency training', 'Safety training'],
            provided: ['Flight simulator', 'Training programmes'],
            who: 'Agencies, training providers and drone operators.',
        },
        {
            id: 'startup',
            phase: 2,
            areas: ['cargo', 'tech'],
            title: 'Industry and startup demonstrations',
            window: 'Mid 2027 to 2028',
            status: { key: 'planned', label: 'Planned' },
            summary: 'Show technology to customers and partners, with support to commercialise it.',
            scope: ['Technology demonstration', 'Startup acceleration', 'Commercialisation support', 'Industry collaboration'],
            provided: ['Demonstration slots', 'Partner matching'],
            who: 'Startups, SMEs and established technology companies.',
        },
        {
            id: 'aam-demo',
            phase: 3,
            areas: ['aam'],
            title: 'AAM and vertiport demonstration',
            window: '2028 to 2029',
            status: { key: 'planned', label: 'Planned' },
            summary: 'Simulate AAM operations, demonstrate the vertiport and study eVTOL integration.',
            scope: ['AAM operation simulation', 'Vertiport demonstration', 'eVTOL integration studies', 'Future mobility simulation'],
            provided: ['Vertiport', 'Test flight corridor'],
            who: 'eVTOL developers, vertiport operators and regulators.',
        },
        {
            id: 'corridors',
            phase: 3,
            areas: ['cargo'],
            title: 'Operation corridor expansion',
            window: '2028 to 2029',
            status: { key: 'planned', label: 'Planned' },
            summary: 'Longer corridors for maritime, logistics and inter-zone operations.',
            scope: ['Autonomous maritime operations', 'Aerial logistics operations', 'Inter-zone operations', 'Long-range operations'],
            provided: ['Corridor access', 'Monitoring and data collection'],
            who: 'Logistics operators and maritime users.',
        },
        {
            id: 'asean',
            phase: 4,
            areas: ['tech', 'cargo'],
            title: 'ASEAN sandbox collaboration',
            window: '2029 to 2030+',
            status: { key: 'planned', label: 'Planned' },
            summary: 'Regional interoperability and cross-border operations with partner sandboxes.',
            scope: ['ASEAN sandbox collaboration', 'Regional interoperability', 'Cross-border operations'],
            provided: ['Regional partner network'],
            who: 'Regional agencies, researchers and operators.',
        },
        {
            id: 'global',
            phase: 4,
            areas: ['aam', 'tech'],
            title: 'Global validation network',
            window: '2029 to 2030+',
            status: { key: 'planned', label: 'Planned' },
            summary: 'Validate technology for international partners and join a global network of sandboxes.',
            scope: ['International technology partners', 'Global validation network', 'Strategic investments'],
            provided: ['International validation platform'],
            who: 'International technology partners and investors.',
        },
    ],
    labels: { scope: 'Scope', provided: 'What the sandbox provides', who: 'Who it suits' },
};

/* ---------- 04 HOW TO PARTICIPATE ---------- */
export const how = {
    heading: 'From interest to flight in four steps.',
    lede: 'The same path applies to every route. Select a step to see what you do, what the sandbox team does, and what you get.',
    steps: [
        {
            title: 'Express interest',
            when: 'Start here',
            you: 'Tell us who you are and what you want to test.',
            we: 'Share the sandbox brief and match you with a programme or testing area.',
            out: 'A first conversation and a shortlist of programmes that fit.',
        },
        {
            title: 'Define activity',
            when: 'Plan',
            you: 'Describe the operation, the aircraft and equipment, your team and your preferred dates.',
            we: 'Help shape the test plan, the safety case and the site support you need.',
            out: 'A clearly defined test activity.',
        },
        {
            title: 'Review and approval',
            when: 'Assess',
            you: 'Submit supporting documents and accept the terms, consent and declaration.',
            we: 'Review safety, regulatory and site readiness with the relevant agencies.',
            out: 'Approval to proceed, or a list of changes to make.',
        },
        {
            title: 'Execute',
            when: 'Fly',
            you: 'Carry out the approved activity with sandbox support and monitoring.',
            we: 'Support the operation, collect data and report back.',
            out: 'Results, data and a debrief.',
        },
    ],
    labels: { you: 'You do', we: 'We do', out: 'You get' },
    prepTitle: 'Prepare before you apply',
    prepNote: 'These are the sections of the Apply to participate form. Tick what you already have.',
    prep: [
        'Applicant and contact person',
        'Organisation information',
        'Proposed operation or testing activity',
        'Equipment information',
        'Team members and qualifications',
        'Supporting documents',
        'Terms, consent and declaration',
    ],
};

/* ---------- 05 PARTICIPANT BENEFITS ---------- */
export const benefits = {
    heading: 'What participants get.',
    lede: 'Access to a real test environment and the people around it, with practical support from the first idea to the final report.',
    groups: [
        {
            title: 'Ecosystem access',
            text: 'One place to work with agencies, industry and universities.',
            points: [
                'Government agencies and regulators',
                'Industry and startup partners',
                'UniMAP and COE-UAS researchers',
                'A route into regional and international networks',
            ],
        },
        {
            title: 'Collaboration',
            text: 'Build partnerships while you test.',
            points: ['Joint R&D initiatives', 'Industry collaboration and partner matching', 'Public demonstrations', 'Multi-agency exercises'],
        },
        {
            title: 'Research opportunities',
            text: 'Real operating conditions instead of lab assumptions.',
            points: [
                'Real-world data for research',
                'Postgraduate and postdoctoral topics',
                'Access to the test range and corridors',
                'Training programmes',
            ],
        },
        {
            title: 'Available support',
            text: 'Help with the work around the flight.',
            points: [
                'Application and regulatory facilitation',
                'Test planning and operational support',
                'Infrastructure and site support',
                'Safety and risk management',
                'Data collection and reporting',
                'Training and capability development',
            ],
        },
    ],
    partnersTitle: 'Organisations shown with the sandbox programme',
    partners: ['CAAM', 'MCMC', 'MIGHT', 'FUTURISE', 'STRIDE', 'SIRIM', 'MRANTI', 'NAICO'],
    placesTitle: 'Where you will fly from',
    /* image keys are defined in Opportunities.jsx */
    places: [
        { image: 'site-aerial', caption: 'Sungai Batu Pahat site' },
        { image: 'render-hangar', caption: 'Hangar and maintenance bay (concept)' },
        { image: 'render-exterior', caption: 'Main building (concept)' },
        { image: 'corridor-dam', caption: 'Corridor to Timah Tasoh Dam' },
        { image: 'corridor-langkawi', caption: 'Corridor towards Kuala Perlis and Langkawi' },
    ],
};

export const closing = {
    heading: 'Ready to fly something?',
    text: 'Tell us what you want to test. We will match you with the right area, programme and window.',
};

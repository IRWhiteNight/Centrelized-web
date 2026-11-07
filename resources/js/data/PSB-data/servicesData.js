/* ==========================================================
   SERVICES DATA  —  edit THIS file, not Services.jsx
   Source: Sandbox_Website.xlsx → "Services" sheet (service names + activities),
           with supporting wording from the "FAQ" and "CTA" sheets.
==========================================================

   HOW TO MAINTAIN
   ─────────────────────────────────────────────────────────
   • Change text       → edit the strings below.
   • Add a service     → copy one block in `services`, change `id`, `title`, `summary`, `activities`.
   • Remove / reorder  → delete or move a block. Numbers and slide count update automatically.
   • Highlight a word  → put *asterisks* around it (hero + apply titles only).
   • Add a real image  → put the file in  public/images/services/  and write its path:
                           images: [
                               { src: '/images/services/application-1.jpg', alt: 'Team reviewing documents' },  // large
                               { src: '/images/services/application-2.jpg', alt: '...' },                       // small
                               { src: '/images/services/application-3.jpg', alt: '...' },                       // small
                           ]
                         Leave `src: ''` (or the whole list empty) to keep the temporary placeholder photo.
   • Placeholder style → set `placeholders.mode` below:
                           'photo' = random sample photos from the internet (default)
                           'box'   = labelled empty boxes (shows what image to add)
========================================================== */

export const placeholders = { mode: 'photo' }; // 'photo' | 'box'

/* Temporary sample photos (picsum.photos). Same seed = same photo every time. */
export const placeholderImage = (seed, w = 1200, h = 800) =>
    `https://picsum.photos/seed/${encodeURIComponent(seed)}/${w}/${h}`;

/* Banner + closing slide images */
export const pageImages = {
    background: { src: '', alt: 'AAM Sandbox Perlis test site' },   // full-screen banner picture
    strip: [                                                          // 4 small pictures on the banner
        { src: '', alt: 'Flight testing' },
        { src: '', alt: 'Ground infrastructure' },
        { src: '', alt: 'Operations team' },
        { src: '', alt: 'Demonstration event' },
    ],
    apply: { src: '', alt: 'Participants at the sandbox' },           // closing slide picture
};

export const hero = {
    slogan: 'AAM Sandbox Perlis',
    title: 'Ten ways we *support your testing*',
    lede: 'From your first application to a public demonstration, the AAM Sandbox Perlis provides the support participants need to plan, run and showcase their activities.',
    primaryCta: 'Explore the services',
    secondaryCta: 'Apply to Participate',
};

export const overview = {
    title: 'All *ten services*',
    lede: 'Select any service to jump straight to it, or keep scrolling to go through them in order.',
};

export const labels = {
    serviceOf: 'Service',      // eyebrow: "Service 01 / 10"
    includes: 'What this service includes',
    activities: 'activities',
};

export const apply = {
    title: 'Ready to use *these services?*',
    lede: 'Participating starts with an Expression of Interest. Our team then works with you through each step.',
    steps: ['Submit interest', 'Define activity', 'Review & approval', 'Execute'],
    buttonLabel: 'Apply to Participate',
    href: '/apply', // ← change to your real application route
};

export const services = [
    {
        id: 'application-regulatory-facilitation',
        title: 'Application & Regulatory Facilitation',
        summary:
            'Helps you prepare and submit a complete application and coordinates with the relevant authorities. All activities must comply with applicable aviation regulations, and participants remain responsible for obtaining the necessary approvals.',
        activities: [
            { name: 'Application guidance', detail: 'Guidance on how to apply and what the application process involves.' },
            { name: 'Coordination with Civil Aviation Authority of Malaysia', detail: 'The sandbox facilitates coordination with CAAM and other relevant agencies.' },
            { name: 'Documentation review (e.g. safety case, ops concept)', detail: 'Your supporting documents are reviewed before they go forward for assessment.' },
            { name: 'Pre-submission checks', detail: 'A completeness check before you submit, since approval time depends on how complete the submission is.' },
        ],
        images: [
            { src: '', alt: 'Team reviewing application documents' },
            { src: '', alt: 'Regulatory coordination meeting' },
            { src: '', alt: 'Safety case paperwork' },
        ],
    },
    {
        id: 'test-planning-operational-support',
        title: 'Test Planning & Operational Support',
        summary:
            'Turns your test objective into a workable plan, then coordinates the airspace, site time and people needed to carry it out.',
        activities: [
            { name: 'Test plan development', detail: 'Define the test objective, activities and expected outcomes for your proposed testing.' },
            { name: 'Operational coordination', detail: 'Align everyone involved in the activity so the day runs as planned.' },
            { name: 'Airspace / site usage planning', detail: 'Plan which parts of the sandbox airspace and site your activity will use.' },
            { name: 'Scheduling support', detail: 'Help fitting your testing into the sandbox schedule alongside other participants.' },
        ],
        images: [
            { src: '', alt: 'Test plan on a planning table' },
            { src: '', alt: 'Operations coordination' },
            { src: '', alt: 'Site and airspace map' },
        ],
    },
    {
        id: 'infrastructure-site-support',
        title: 'Infrastructure & Site Support',
        summary:
            'Gives participants access to the sandbox test zones and the ground facilities needed on site. Access to designated testing areas is subject to approval.',
        activities: [
            { name: 'Access to sandbox test zones', detail: 'Use of the designated testing areas, subject to approval.' },
            { name: 'Ground infrastructure (vertiport, landing area, staging)', detail: 'Ground facilities for landing, take-off and preparing aircraft and equipment.' },
            { name: 'Power / charging support (if available)', detail: 'Power and charging for your equipment, where available.' },
            { name: 'Site logistics coordination', detail: 'Help getting people, equipment and materials to and around the site.' },
        ],
        images: [
            { src: '', alt: 'Sandbox test zone' },
            { src: '', alt: 'Vertiport and landing area' },
            { src: '', alt: 'Charging and staging area' },
        ],
    },
    {
        id: 'system-integration-support',
        title: 'System Integration Support',
        summary:
            'Supports connecting your systems with the communication and traffic-management systems in the sandbox, and with the systems of other participants.',
        activities: [
            { name: 'UTM / communication system integration', detail: 'Integrate your system with the UTM and communication systems used in the sandbox.' },
            { name: 'Data interface support', detail: 'Help with the data interfaces between your system and other systems.' },
            { name: 'Multi-system coordination', detail: 'Coordinate several systems working together during a test.' },
        ],
        images: [
            { src: '', alt: 'UTM control screens' },
            { src: '', alt: 'Communication equipment' },
            { src: '', alt: 'Engineers integrating systems' },
        ],
    },
    {
        id: 'safety-risk-management-support',
        title: 'Safety & Risk Management Support',
        summary:
            'Safety is a key requirement for every sandbox activity. This service helps you show adequate safety planning, risk assessment and mitigation, and clear operational procedures.',
        activities: [
            { name: 'Risk assessment guidance', detail: 'Guidance on identifying the risks of your activity and how to mitigate them.' },
            { name: 'Safety case support', detail: 'Support preparing the safety case that forms part of your application.' },
            { name: 'Operational safety planning', detail: 'Plan the procedures and controls for operating safely.' },
            { name: 'Incident reporting framework', detail: 'A framework for reporting incidents if they occur.' },
        ],
        images: [
            { src: '', alt: 'Safety briefing on site' },
            { src: '', alt: 'Risk assessment workshop' },
            { src: '', alt: 'Safety equipment' },
        ],
    },
    {
        id: 'testing-execution-monitoring',
        title: 'Testing Execution & Monitoring',
        summary:
            'Supports the testing itself, with coordination on site, monitoring of what is happening, and a record of what was tested.',
        activities: [
            { name: 'On-site coordination', detail: 'A point of coordination on the test site while your activity runs.' },
            { name: 'Monitoring of activities', detail: 'Activities are monitored as they take place.' },
            { name: 'Compliance oversight', detail: 'Oversight that the activity stays within applicable regulations and approvals.' },
            { name: 'Test documentation', detail: 'Documentation of what was tested and how.' },
        ],
        images: [
            { src: '', alt: 'Live flight test' },
            { src: '', alt: 'Monitoring station' },
            { src: '', alt: 'Test documentation' },
        ],
    },
    {
        id: 'data-collection-reporting-support',
        title: 'Data Collection & Reporting Support',
        summary:
            'Helps you capture and report what your test produced. Participants retain ownership of their proprietary data and intellectual property; any data-sharing requirements are clarified during the application and agreement process.',
        activities: [
            { name: 'Data capture frameworks', detail: 'A structured way to capture data during your testing.' },
            { name: 'Performance reporting', detail: 'Reporting on how your aircraft, system or operation performed.' },
            { name: 'Test outcome documentation', detail: 'A written record of the outcomes of your test.' },
            { name: 'Insights generation (optional)', detail: 'Optional analysis that turns the results into insights.' },
        ],
        images: [
            { src: '', alt: 'Flight data on screen' },
            { src: '', alt: 'Performance report' },
            { src: '', alt: 'Data analysis' },
        ],
    },
    {
        id: 'industry-collaboration-partner-matching',
        title: 'Industry Collaboration & Partner Matching',
        summary:
            'Connects participants with local partners and research institutions. The programme is supported by UniMAP, MRANTI, NAICO, MIGHT, CAAM and MOF, and works with national and international collaborators such as EHANG, TCAB and MHS Aviation.',
        activities: [
            { name: 'Matching with local partners', detail: 'Introductions to local partners relevant to your activity.' },
            { name: 'Access to research institutions', detail: 'A route to universities and research bodies in the ecosystem.' },
            { name: 'Joint testing opportunities', detail: 'Opportunities to test together with other participants and hosts.' },
        ],
        images: [
            { src: '', alt: 'Partners meeting' },
            { src: '', alt: 'Research institution lab' },
            { src: '', alt: 'Joint test with partners' },
        ],
    },
    {
        id: 'training-capability-development',
        title: 'Training & Capability Development',
        summary:
            'Builds the skills participants need to operate in the sandbox, from operations and safety to familiarity with the systems in use.',
        activities: [
            { name: 'Operational training', detail: 'Training for the people who will carry out your operations.' },
            { name: 'Safety training', detail: 'Training on the safety requirements of sandbox activities.' },
            { name: 'System familiarisation', detail: 'Getting to know the sandbox systems before you test.' },
            { name: 'Workshops', detail: 'Workshops to develop skills and share knowledge.' },
        ],
        images: [
            { src: '', alt: 'Operational training session' },
            { src: '', alt: 'Safety training' },
            { src: '', alt: 'Workshop' },
        ],
    },
    {
        id: 'demonstration-showcase-support',
        title: 'Demonstration & Showcase Support',
        summary:
            'Helps you present your results to stakeholders and, where applicable, to the wider public.',
        activities: [
            { name: 'Demo event coordination', detail: 'Help organising a demonstration of your technology.' },
            { name: 'Stakeholder engagement sessions', detail: 'Sessions to bring stakeholders together around your demonstration.' },
            { name: 'Media exposure (if applicable)', detail: 'Media coverage of your activity, where applicable.' },
        ],
        images: [
            { src: '', alt: 'Public demonstration' },
            { src: '', alt: 'Stakeholder session' },
            { src: '', alt: 'Media coverage' },
        ],
    },
];

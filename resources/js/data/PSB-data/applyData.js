/* ==========================================================================
   APPLY — CONTENT FILE
   Everything on the Apply page is edited HERE. You never touch the JSX.

   WHERE THE FACTS COME FROM (your documents)
     - Site: Sungai Batu Pahat Mango Farm (PKENPs), 19.7 ha in total, Phase 1
       development area 2.9 ha, with the COE-UAS & Boomslang runway to be upgraded
     - Corridors: east to Timah Tasoh Dam, west via Kuala Perlis to Langkawi
     - Phase 1 facilities: guard house, main building, EV / car / motorcycle
       parking, helipad, vertiport, lake
     - Phases and timeline: Phase 1 mid 2026 – early 2027 ... Phase 4 2029 – 2030+
     - Participation model: government-led trials, industry testing and
       demonstrations, research and innovation; four test areas; four-step process

   !!! Items marked  (SAMPLE)  are placeholders: review timelines, document
   !!! lists, fees, eligibility rules and the FAQ answers. Replace them with the
   !!! programme's real rules before launch.
========================================================================== */

export const links = {
    opportunities: '/opportunities',
    innovation: '/innovation',
    contact: '/contact',
    media: '/media-centre',
};

export const page = {
    title: 'Apply',
    description: 'Apply to test, demonstrate or research in the Perlis Airspace Sandbox.',
};

export const hero = {
    eyebrow: 'Perlis Airspace Sandbox / Apply',
    titleLines: ['Bring your', 'technology to', 'the sandbox.'],
    highlight: 'technology to',
    lede: 'Government agencies, industry and researchers can apply to run trials, demonstrations and studies in a controlled low-altitude testbed in Perlis.',
    primaryButton: 'Start your application',
    secondaryButton: 'How it works',
    mapLabel: 'Schematic only — Sungai Batu Pahat sandbox and planned corridors',
};

export const heroStats = [
    { value: 19.7, decimals: 1, suffix: 'ha', label: 'Sandbox site at Sungai Batu Pahat' },
    { value: 2, prefix: '', suffix: '', label: 'Planned test corridors (Timah Tasoh Dam, Langkawi)' },
    { value: 4, label: 'Test areas open to applicants' },
    { value: 4, label: 'Steps from interest to execution' },
];

export const sections = [
    { id: 'who', label: 'Who can apply' },
    { id: 'areas', label: 'What you can test' },
    { id: 'resources', label: 'What is on site' },
    { id: 'process', label: 'The process' },
    { id: 'form', label: 'Application form' },
    { id: 'prepare', label: 'Prepare' },
    { id: 'faq', label: 'FAQ' },
];

export const ticker = [
    'Applications open',
    'Government · Industry · Research',
    'Perlis Airspace Sandbox',
    'First responder · AAM · Cargo · Technology',
    'Express interest → Define → Review → Execute',
];

/* ==========================================================================
   01 WHO CAN APPLY   (three ways to participate)
   `value` is what the form stores. Keep it the same as in `form.routes` below.
========================================================================== */

export const who = {
    heading: 'Three ways to take part',
    lede: 'Pick the route that matches what you want to do. You can change your mind inside the form.',
    items: [
        {
            value: 'Government-led trial',
            kind: 'For agencies and regulators',
            title: 'Government-led trials',
            text: 'Run structured trials led by a public body to build operational evidence for policy, procedures and standards.',
            points: ['Operational evidence for regulators', 'Multi-agency exercises', 'Procedure and SOP validation'],
        },
        {
            value: 'Industry testing & demonstration',
            kind: 'For companies and operators',
            title: 'Industry testing and demonstrations',
            text: 'Test and demonstrate aircraft, systems and services in real conditions, from first flights to proof of capability.',
            points: ['Technology demonstration', 'Operational validation', 'Showcase to partners and agencies'],
        },
        {
            value: 'Research & innovation',
            kind: 'For universities and start-ups',
            title: 'Research and innovation',
            text: 'Collect real flight data, test new methods and develop technology with the university and industry network around the sandbox.',
            points: ['Flight data collection', 'Joint technology development', 'Start-up validation'],
        },
    ],
};

/* ==========================================================================
   02 WHAT YOU CAN TEST  (the four test areas)
   `value` is stored by the form. `phase` shows when it is planned.
========================================================================== */

export const areas = {
    heading: 'Four test areas',
    lede: 'Choose one or more. Each area matches a planned programme track in the sandbox roadmap.',
    items: [
        {
            value: 'First responder operations',
            title: 'First responder operations',
            text: 'Emergency response, surveillance and safety monitoring with drones and supporting systems.',
            points: ['Emergency response systems', 'Surveillance enhancement', 'Safety and compliance monitoring'],
            phase: 'Phase 2 · Mid 2027 – 2028',
        },
        {
            value: 'Advanced Air Mobility operations',
            title: 'Advanced Air Mobility operations',
            text: 'AAM and eVTOL operation studies around the vertiport, helipad and runway.',
            points: ['Vertiport demonstration', 'eVTOL integration studies', 'AAM operation simulation'],
            phase: 'Phase 3 · 2028 – 2029',
        },
        {
            value: 'Cargo logistics operations',
            title: 'Cargo logistics operations',
            text: 'Aerial logistics over the planned corridors, from short hops to long-range routes.',
            points: ['Aerial logistics', 'Long-range and BVLOS operations', 'Inter-zone operations'],
            phase: 'Phase 2–3 · 2027 – 2029',
        },
        {
            value: 'Supporting technology & system integration',
            title: 'Supporting technology and system integration',
            text: 'The systems that make safe operations possible: airspace management, communication and data.',
            points: ['UTM and digital airspace management', 'Communications and telemetry', 'Data integration platform'],
            phase: 'Phase 1 onwards · Mid 2026',
        },
    ],
};

/* ==========================================================================
   03 WHAT IS ON SITE
   `ready`: 'Phase 1' etc. Shown as a badge. Edit to match what is built.
========================================================================== */

export const resources = {
    heading: 'What the sandbox gives you',
    lede: 'Facilities and corridors from the Phase 1 plan. Availability follows the construction and roadmap schedule.',
    site: [
        { label: 'Total site', value: '19.7 ha' },
        { label: 'Phase 1 area', value: '2.9 ha' },
        { label: 'Location', value: 'Sungai Batu Pahat, Perlis' },
        { label: 'Runway', value: 'Existing, to be upgraded' },
    ],
    facilities: [
        { n: 1, title: 'Main building', text: 'Hangar with workshop, operations and training space.', ready: 'Phase 1' },
        { n: 2, title: 'Vertiport', text: 'Landing and take-off area for AAM and eVTOL demonstration.', ready: 'Phase 1' },
        { n: 3, title: 'Helipad', text: 'Marked pad beside the main building.', ready: 'Phase 1' },
        { n: 4, title: 'Command and control (basic)', text: 'Initial operations control and flight operations management.', ready: 'Phase 1' },
        { n: 5, title: 'Communication infrastructure', text: 'Operational communication, telemetry and monitoring.', ready: 'Phase 1' },
        { n: 6, title: 'Runway', text: 'COE-UAS & Boomslang runway, planned for upgrade.', ready: 'Planned' },
        { n: 7, title: 'EV, car and motorcycle parking', text: 'Visitor and team parking with EV charging.', ready: 'Phase 1' },
        { n: 8, title: 'Guard house and lake', text: 'Controlled access and a landscaped lake.', ready: 'Phase 1' },
    ],
    corridors: [
        { title: 'East corridor', route: 'Sungai Batu Pahat → Timah Tasoh Dam', text: 'Over rivers and paddy fields, turning back towards the sandbox.' },
        { title: 'West corridor', route: 'Kuala Perlis → Langkawi Island', text: 'Via the upper river area and paddy fields, then over the Kuala Perlis sea.' },
    ],
    note: 'Corridors are planned flight-path concepts and still need airspace approval.',
};

/* ==========================================================================
   04 PROCESS (four steps)
   `time` values are (SAMPLE). Replace with the programme's real targets.
========================================================================== */

export const process = {
    heading: 'How applying works',
    lede: 'Four steps from first interest to your activity running in the sandbox.',
    steps: [
        { title: 'Express interest', text: 'Send the application form below. Tell us who you are and what you want to do.', time: 'You: about 10 minutes (SAMPLE)', out: 'Reference number' },
        { title: 'Define activity', text: 'The programme team contacts you to shape the scope, aircraft, location, dates and safety plan.', time: 'Together: 1–2 weeks (SAMPLE)', out: 'Activity brief' },
        { title: 'Review and approval', text: 'Safety, regulatory and programme review of the brief. We may ask for more documents.', time: 'Programme: 2–4 weeks (SAMPLE)', out: 'Approval decision' },
        { title: 'Execute', text: 'Fly your activity in the sandbox with on-site support, then share results and data as agreed.', time: 'On the agreed dates', out: 'Report and data' },
    ],
};

/* ==========================================================================
   05 APPLICATION FORM (4 steps)
   Choices below fill the radio chips and checkboxes. Edit freely.
========================================================================== */

export const form = {
    heading: 'Apply to participate',
    lede: 'Four short steps. Your answers are saved on this device while you type, so you can come back later.',
    endpoint: '',            /* POST target (JSON). Leave '' for demo mode: nothing is sent. */
    fallbackEmail: 'apply@example.com',
    draftKey: 'pas-apply-draft',
    steps: [
        { id: 'who', label: 'About you', hint: 'Who is applying' },
        { id: 'activity', label: 'Your activity', hint: 'What you want to do' },
        { id: 'needs', label: 'Needs & safety', hint: 'What you need on site' },
        { id: 'review', label: 'Review', hint: 'Check and send' },
    ],
    applicantTypes: ['Government agency', 'Industry / company', 'University / research', 'Start-up', 'Other'],
    routes: who.items.map((i) => i.value),
    areas: areas.items.map((i) => i.value),
    corridors: ['On-site only (sandbox)', 'East corridor (Timah Tasoh Dam)', 'West corridor (Kuala Perlis – Langkawi)', 'Not sure yet'],
    aircraft: ['Multirotor drone', 'Fixed-wing drone', 'VTOL / hybrid', 'eVTOL (crewed or uncrewed)', 'Helicopter', 'Ground system only'],
    timeframes: ['As soon as possible', 'Within 3 months', '3–6 months', '6–12 months', 'More than 12 months'],
    durations: ['One day', 'A few days', 'One to four weeks', 'More than a month', 'Recurring'],
    needs: ['Hangar space', 'Vertiport / helipad', 'Runway', 'Command and control room', 'Telemetry and communications', 'Workshop and charging', 'Meeting and training room', 'Accommodation help', 'Media / demo day support'],
    permits: ['Yes, all in place', 'In progress', 'Not yet', 'Not sure what is needed'],
    consent: 'I confirm the information is correct and agree that the programme team may contact me about this application.',
    success: {
        title: 'Application received.',
        text: 'Keep your reference number. The programme team will contact you to define the activity.',
        again: 'Start another application',
    },
    fail: 'Something went wrong. Please try again, or email us your details directly.',
    limits: { desc: 1500, safety: 800 },
};

/* ==========================================================================
   06 PREPARE — documents and details to have ready  (SAMPLE list)
========================================================================== */

export const prepare = {
    heading: 'Have these ready',
    lede: 'You do not need everything to apply. The team will ask for the rest in step two.',
    groups: [
        { title: 'About your organisation', items: ['Registration or institution details', 'Main contact and a safety lead', 'Short company or lab profile'] },
        { title: 'About the aircraft or system', items: ['Make, model and weight class', 'Operating limits and payload', 'Control and communication method', 'Maintenance and airworthiness records'] },
        { title: 'About the operation', items: ['Concept of operations and flight plan', 'Risk assessment and emergency procedures', 'Pilot and crew qualifications', 'Insurance cover'] },
        { title: 'Permissions', items: ['Operator permits held, or in progress', 'Letters of support from sponsors or agencies', 'Data-sharing intentions'] },
    ],
    note: 'Which permits apply depends on the activity and on the regulator. The programme team will advise during step two.',
};

/* ==========================================================================
   07 FAQ   (SAMPLE answers: replace)
========================================================================== */

export const faq = {
    heading: 'Questions we hear often',
    lede: 'Short answers. For anything else, contact the programme team.',
    items: [
        { q: 'Who can apply?', a: 'Government agencies, companies, universities, research groups and start-ups with a clear test, demonstration or research activity that fits one of the four test areas.' },
        { q: 'Is there a cost to apply?', a: 'Applying is free. Any charges for facilities or support are explained during step two. (SAMPLE: confirm with the programme.)' },
        { q: 'Can I test before the full facilities are built?', a: 'Early activities follow the Phase 1 roadmap, which begins in mid 2026. Availability depends on construction and approvals, so state your preferred dates in the form.' },
        { q: 'Do I need my own permits?', a: 'You usually need the operator permissions that apply to your aircraft and activity. The team helps you work out what is needed and coordinates with the regulator.' },
        { q: 'Can I fly beyond visual line of sight?', a: 'BVLOS operations are part of the roadmap, starting with basic BVLOS in Phase 1 and expanding in Phase 2. Corridors need airspace approval first.' },
        { q: 'Who owns the data from my tests?', a: 'This is agreed in step two. Many activities share anonymised results with the programme. (SAMPLE: confirm with the programme.)' },
        { q: 'Can I apply with partners?', a: 'Yes. Name your partners in the activity description and give one main contact.' },
    ],
};

export const closing = {
    heading: 'Not ready to apply?',
    text: 'Talk to the team first, or read how the sandbox is built and what is planned.',
};

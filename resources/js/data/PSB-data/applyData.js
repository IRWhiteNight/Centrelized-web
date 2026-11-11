/* ==========================================================================
   APPLY PAGE: CONTENT FILE  (data/PSB-data/applyData.js)
   You only edit THIS file. Apply.jsx never needs to change.

   HOW TO EDIT
   - Change text ........ edit the string.
   - Add an item ........ copy one { ... } block (or one 'string' line) in a list and paste it below.
   - Delete an item ..... delete that block / line.
   - Reorder ............ move the block up or down.

   SECTIONS (the page is built from the `sections` list)
   - Delete a section ... delete its line in `sections` (e.g. remove { id: 'prepare', ... }).
   - Reorder sections ... move its line up or down. Numbers 01, 02... update by themselves.
   - Change colour ...... set tone to 'light' | 'dark' | 'graphite' | 'yellow'.
   - Rename in menu ..... change `label`.
   - Available ids ...... who, areas, resources, process, prepare, form
   - To add a brand-new kind of section, add its content here and its block in Apply.jsx.

   FORM
   - Every question is one { ... } line in form.steps[n].fields.
   - Field types: text | email | tel | url | textarea | select | single | multi
   - Options: req (required), min / max (characters), half (half width),
              hint (help text), placeholder, options (choices), msg (error text).
   - Keep the keys `route` and `areas`: the "Apply this way" buttons fill them in.
   - Leave form.steps[last] (review) as it is.

   (SAMPLE) = placeholder. Replace timelines, fees and rules with the real ones before launch.
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

/* ---------- top of page ---------- */
export const hero = {
    eyebrow: 'Perlis Airspace Sandbox',
    titleLines: ['Apply to', 'the sandbox'],
    highlight: 'the sandbox',
    lede: 'Government agencies, industry and researchers can apply to run trials, demonstrations and studies in a controlled low-altitude testbed in Perlis.',
    primaryButton: 'Start your application',
    secondaryButton: 'See how it works',
    caption: { place: 'Sungai Batu Pahat, Perlis', note: 'Beside the UniMAP runway' },
    glanceLabel: 'Quick answers',
    facts: [
        { label: 'Cost to apply', value: 'Free', note: 'Charges for facilities, if any, are explained in step two' },
        { label: 'Time to apply', value: '10 min', note: 'Four short steps (SAMPLE)' },
        { label: 'Who can apply', value: '3 routes', note: 'Government, industry and research' },
        { label: 'What happens next', value: 'We call', note: 'The team contacts you to define the activity' },
    ],
};

/* ---------- page order + sticky menu ----------
   id    must match a block in Apply.jsx
   label text in the sticky menu and the small tag above each heading
   tone  background of the section                                        */
export const sections = [
    { id: 'who', label: 'Who can apply', tone: 'light' },
    { id: 'areas', label: 'What you can test', tone: 'dark' },
    { id: 'resources', label: 'On site', tone: 'light' },
    { id: 'process', label: 'The process', tone: 'graphite' },
    { id: 'prepare', label: 'Prepare', tone: 'light' },
    { id: 'form', label: 'Application form', tone: 'yellow' },
];

export const ticker = [
    'Applications open',
    'Government, industry and research',
    'Perlis Airspace Sandbox',
    'First responder, air mobility, cargo and technology',
    'Express interest, define, review, execute',
];

/* ---------- WHO CAN APPLY ---------- */
export const who = {
    heading: 'Three ways to take part',
    lede: 'Pick the route that matches what you want to do. You can change it inside the form.',
    button: 'Apply this way',
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

/* ---------- WHAT YOU CAN TEST ---------- */
export const areas = {
    heading: 'Four test areas',
    lede: 'Choose one or more. Each area matches a planned programme track in the sandbox roadmap.',
    button: 'Apply for this area',
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

/* ---------- WHAT IS ON SITE ---------- */
export const resources = {
    heading: 'What the sandbox gives you',
    lede: 'Facilities and corridors from the Phase 1 plan. Availability follows the construction and roadmap schedule.',
    site: [
        { label: 'Total site', value: '19.7 ha' },
        { label: 'Phase 1 area', value: '2.9 ha' },
        { label: 'Location', value: 'Sungai Batu Pahat, Perlis' },
        { label: 'Runway', value: 'Existing, to be upgraded' },
    ],
    facilitiesTitle: 'Facilities',
    facilities: [
        { title: 'Main building', text: 'Hangar with workshop, operations and training space.', ready: 'Phase 1' },
        { title: 'Vertiport', text: 'Landing and take-off area for AAM and eVTOL demonstration.', ready: 'Phase 1' },
        { title: 'Helipad', text: 'Marked pad beside the main building.', ready: 'Phase 1' },
        { title: 'Command and control (basic)', text: 'Initial operations control and flight operations management.', ready: 'Phase 1' },
        { title: 'Communication infrastructure', text: 'Operational communication, telemetry and monitoring.', ready: 'Phase 1' },
        { title: 'Runway', text: 'COE-UAS & Boomslang runway, planned for upgrade.', ready: 'Planned' },
        { title: 'EV, car and motorcycle parking', text: 'Visitor and team parking with EV charging.', ready: 'Phase 1' },
        { title: 'Guard house and lake', text: 'Controlled access and a landscaped lake.', ready: 'Phase 1' },
    ],
    corridorsTitle: 'Planned flight corridors',
    corridors: [
        { title: 'East corridor', route: 'Sungai Batu Pahat to Timah Tasoh Dam', text: 'Over rivers and paddy fields, turning back towards the sandbox.' },
        { title: 'West corridor', route: 'Kuala Perlis to Langkawi Island', text: 'Via the upper river area and paddy fields, then over the Kuala Perlis sea.' },
    ],
    note: 'Corridors are planned flight-path concepts and still need airspace approval.',
};

/* ---------- THE PROCESS ---------- */
export const howItWorks = {
    heading: 'How applying works',
    lede: 'Four steps from first interest to your activity running in the sandbox.',
    stepWord: 'Step',
    labels: { time: 'How long', out: 'You get' },
    startButton: 'Start now',
    steps: [
        { title: 'Express interest', text: 'Send the application form below. Tell us who you are and what you want to do.', time: 'You: about 10 minutes (SAMPLE)', out: 'Reference number' },
        { title: 'Define activity', text: 'The programme team contacts you to shape the scope, aircraft, location, dates and safety plan.', time: 'Together: 1–2 weeks (SAMPLE)', out: 'Activity brief' },
        { title: 'Review and approval', text: 'Safety, regulatory and programme review of the brief. We may ask for more documents.', time: 'Programme: 2–4 weeks (SAMPLE)', out: 'Approval decision' },
        { title: 'Execute', text: 'Fly your activity in the sandbox with on-site support, then share results and data as agreed.', time: 'On the agreed dates', out: 'Report and data' },
    ],
};

/* ---------- PREPARE ---------- */
export const prepare = {
    heading: 'Have these ready',
    lede: 'You do not need everything to apply. The team will ask for the rest in step two.',
    readyWord: 'ready',
    groups: [
        { title: 'About your organisation', items: ['Registration or institution details', 'Main contact and a safety lead', 'Short company or lab profile'] },
        { title: 'About the aircraft or system', items: ['Make, model and weight class', 'Operating limits and payload', 'Control and communication method', 'Maintenance and airworthiness records'] },
        { title: 'About the operation', items: ['Concept of operations and flight plan', 'Risk assessment and emergency procedures', 'Pilot and crew qualifications', 'Insurance cover'] },
        { title: 'Permissions', items: ['Operator permits held, or in progress', 'Letters of support from sponsors or agencies', 'Data-sharing intentions'] },
    ],
    note: 'Which permits apply depends on the activity and on the regulator. The programme team will advise during step two.',
};

/* ==========================================================================
   APPLICATION FORM
   Answer lists first (used by the dropdowns and choices below).
========================================================================== */
const applicantTypes = ['Government agency', 'Industry / company', 'University / research', 'Start-up', 'Other'];
const corridors = ['On-site only (sandbox)', 'East corridor (Timah Tasoh Dam)', 'West corridor (Kuala Perlis – Langkawi)', 'Not sure yet'];
const aircraft = ['Multirotor drone', 'Fixed-wing drone', 'VTOL / hybrid', 'eVTOL (crewed or uncrewed)', 'Helicopter', 'Ground system only'];
const timeframes = ['As soon as possible', 'Within 3 months', '3–6 months', '6–12 months', 'More than 12 months'];
const durations = ['One day', 'A few days', 'One to four weeks', 'More than a month', 'Recurring'];
const needs = ['Hangar space', 'Vertiport / helipad', 'Runway', 'Command and control room', 'Telemetry and communications', 'Workshop and charging', 'Meeting and training room', 'Accommodation help', 'Media / demo day support'];
const permits = ['Yes, all in place', 'In progress', 'Not yet', 'Not sure what is needed'];

export const form = {
    heading: 'Apply to participate',
    lede: 'Four short steps. Your answers are saved on this device while you type, so you can come back later.',
    stepWord: 'Step',
    endpoint: '',                      /* POST target (JSON). Leave '' for demo mode: nothing is sent. */
    fallbackEmail: 'apply@example.com',
    draftKey: 'pas-apply-draft',
    steps: [
        {
            id: 'who', label: 'About you', hint: 'Who is applying',
            fields: [
                { key: 'type', type: 'single', label: 'Applicant type', req: true, options: applicantTypes, msg: 'Choose the kind of applicant.' },
                { key: 'org', type: 'text', label: 'Organisation', req: true, min: 2, half: true, msg: 'Enter your organisation.' },
                { key: 'website', type: 'url', label: 'Website (optional)', half: true, placeholder: 'https://' },
                { key: 'name', type: 'text', label: 'Contact person', req: true, min: 2, half: true, msg: 'Enter the contact name.' },
                { key: 'role', type: 'text', label: 'Role (optional)', half: true },
                { key: 'email', type: 'email', label: 'Email', req: true, half: true, msg: 'Enter a valid email address.' },
                { key: 'phone', type: 'tel', label: 'Phone (optional)', half: true },
            ],
        },
        {
            id: 'activity', label: 'Your activity', hint: 'What you want to do',
            fields: [
                { key: 'route', type: 'single', label: 'How do you want to take part?', req: true, options: who.items.map((i) => i.value), msg: 'Choose how you want to take part.' },
                { key: 'areas', type: 'multi', label: 'Test areas (choose all that apply)', req: true, options: areas.items.map((i) => i.value), msg: 'Choose at least one test area.' },
                { key: 'title', type: 'text', label: 'Activity title', req: true, min: 4, max: 90, msg: 'Give your activity a short title.' },
                { key: 'desc', type: 'textarea', label: 'What do you want to do?', req: true, min: 30, max: 1500, rows: 6, hint: 'What will you test, what do you want to learn, and what does success look like?', msg: 'Describe the activity in at least a couple of sentences (30 characters).' },
                { key: 'aircraft', type: 'select', label: 'Aircraft or system (optional)', options: aircraft, half: true },
                { key: 'corridor', type: 'select', label: 'Where will you operate? (optional)', options: corridors, half: true },
                { key: 'timeframe', type: 'select', label: 'Preferred timeframe', req: true, options: timeframes, half: true, msg: 'Choose a preferred timeframe.' },
                { key: 'duration', type: 'select', label: 'How long? (optional)', options: durations, half: true },
                { key: 'partners', type: 'text', label: 'Partners (optional)', placeholder: 'Names of organisations involved' },
            ],
        },
        {
            id: 'needs', label: 'Needs and safety', hint: 'What you need on site',
            fields: [
                { key: 'needs', type: 'multi', label: 'What do you need on site? (optional)', options: needs },
                { key: 'permits', type: 'single', label: 'Do you hold the permits for your operation?', req: true, options: permits, msg: 'Tell us where your permits stand.' },
                { key: 'crew', type: 'text', label: 'Crew and pilots (optional)', hint: 'Number of people and their qualifications, if known.' },
                { key: 'safety', type: 'textarea', label: 'Safety notes (optional)', max: 800, rows: 4, hint: 'Known risks, safety measures or special conditions.' },
            ],
        },
        { id: 'review', label: 'Review', hint: 'Check and send', fields: [] },
    ],
    savedText: 'Draft saved on this device',
    reviewLede: 'Check your answers. Use an edit button to change anything before sending.',
    consent: 'I confirm the information is correct and agree that the programme team may contact me about this application.',
    success: {
        title: 'Application received.',
        text: 'Keep your reference number. The programme team will contact you to define the activity.',
        again: 'Start another application',
    },
    fail: 'Something went wrong. Please try again, or email us your details directly.',
};

/* ---------- closing block + floating button ---------- */
export const closing = {
    heading: 'Not ready to apply?',
    text: 'Talk to the team first, or read how the sandbox is built and what is planned.',
    buttons: [
        { label: 'Contact the team', href: links.contact, primary: true },
        { label: 'Opportunities', href: links.opportunities },
        { label: 'About the sandbox', href: links.innovation },
    ],
};

export const floatingButton = 'Apply now';

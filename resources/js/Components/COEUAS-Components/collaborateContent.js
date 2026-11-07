/* ==========================================================================
   COE-UAS · Collaborate page — ALL content lives here.
   Edit text, links, partners, slide order and transitions in this file only.
   (Place at: resources/js/data/collaborateContent.js)

   Writing tip: wrap words in *asterisks* inside any "title" to highlight them.
   Source of the wording: COEUAS_Site_Map_and_Use_Case.docx (Engagement →
   Collaborate with Us, Facilities & Services, actors/use cases) and the Perlis
   Airspace Sandbox decks/poster. Items marked EDIT are drafts to confirm.
========================================================================== */

/* ---------- 1. Behaviour -------------------------------------------------- */
export const settings = {
    transitionMs: 1250,   // length of every section-to-section transition
    showControls: true,   // small progress counter + prev/next buttons (bottom of screen)
    formEndpoint: '',     // Laravel POST route for the enquiry form, e.g. '/coeuas/collaborate/enquiry'
                          // leave '' to only show the success message (no request is sent)
};

/* ---------- 2. Slide order, colour and transition -------------------------
   • Reorder, remove or duplicate a slide by moving its line.
   • id    → must match a key in VIEWS inside Collaborate.jsx
   • theme → 'dark' | 'navy' | 'blue' | 'light'
   • fx    → how THIS slide enters (and leaves when you scroll back):
             'none' | 'iris' | 'diag' | 'doors' | 'rise' | 'zoom' | 'swing' | 'curtain' | 'sweep'
------------------------------------------------------------------------- */
export const slides = [
    { id: 'hero',     label: 'Welcome',                 theme: 'dark',  fx: 'none' },
    { id: 'why',      label: 'Why collaborate',         theme: 'navy',  fx: 'iris' },
    { id: 'pathways', label: 'Find your pathway',       theme: 'dark',  fx: 'diag' },
    { id: 'offer',    label: 'What we offer',           theme: 'light', fx: 'doors' },
    { id: 'sandbox',  label: 'Perlis Airspace Sandbox', theme: 'dark',  fx: 'zoom' },
    { id: 'roadmap',  label: 'Roadmap',                 theme: 'blue',  fx: 'swing' },
    { id: 'network',  label: 'Our network',             theme: 'navy',  fx: 'curtain' },
    { id: 'enquire',  label: 'Send an enquiry',         theme: 'light', fx: 'sweep' },
];

/* ---------- 3. Hero ------------------------------------------------------- */
export const hero = {
    title: 'Build the *low-altitude future* with COE-UAS',
    lede:
        'Researchers, industry, government agencies, students and training clients work with the Centre of Excellence for Unmanned Aerial Systems at Universiti Malaysia Perlis, from joint research to real-world testing in the Perlis Airspace Sandbox.',
    primaryCta: 'Send an enquiry',
    secondaryCta: 'Find your pathway',
    chips: [
        'Joint research',
        'Industry projects',
        'Sandbox testing',
        'Postgraduate and postdoctoral places',
        'Training and services',
    ],
    scrollHint: 'Scroll, swipe or use the arrow keys',
};

/* ---------- 4. Why collaborate ------------------------------------------- */
export const why = {
    title: 'No single organisation can do this *alone*',
    lede: 'Malaysia has the drone technology and the talent. What is still missing is the shared ground where research becomes real operations.',
    reasons: [
        {
            title: 'From prototype to real-world impact',
            text: 'Many drone technologies already exist, but the path from research to deployment is incomplete. Working together closes that gap.',
        },
        {
            title: 'A real place to test and prove',
            text: 'The Perlis Airspace Sandbox gives real aircraft, real missions and real operational conditions a safe, controlled airspace.',
        },
        {
            title: 'Academia, industry and government in one ecosystem',
            text: 'Each partner brings what the others need: research and talent, deployment, real use cases, safety and policy.',
        },
    ],
    // `to` counts up when the slide opens. Check these against the latest Sandbox documents.
    figures: [
        { to: 30, prefix: '~', suffix: ' ha', label: 'Sandbox site at Sungai Batu Pahat, Perlis' },
        { to: 6, prefix: '', suffix: '', label: 'Facilities in the functional mock-up aerodrome' },
        { to: 4, prefix: '', suffix: '', label: 'Development phases, 2026 to 2030+' },
    ],
};

/* ---------- 5. Pathways (one per actor in the use-case document) ----------
   role         → pre-selects "I am" in the enquiry form
   enquiryType  → pre-selects the enquiry type (must match enquire.types[].value)
------------------------------------------------------------------------- */
export const pathways = {
    title: 'Where do *you* fit in?',
    lede: 'Choose the route closest to you. We will carry it into the enquiry form.',
    items: [
        {
            id: 'student',
            short: 'Students and applicants',
            title: 'Prospective student or research applicant',
            text: 'Explore proposed research topics and postgraduate or postdoctoral opportunities with our research groups.',
            offers: ['Research opportunities', 'Postgraduate and postdoctoral places', 'Research enquiry'],
            cta: 'Ask about research places',
            role: 'Prospective student or research applicant',
            enquiryType: 'research',
        },
        {
            id: 'industry',
            short: 'Industry',
            title: 'Industry partner',
            text: 'Bring an operational challenge, validate a platform or take a technology towards commercialisation.',
            offers: [
                'Industry research challenges',
                'Industry solutions and case studies',
                'Facilities and technical services',
                'Perlis Airspace Sandbox programme',
            ],
            cta: 'Discuss a project',
            role: 'Industry partner',
            enquiryType: 'research',
        },
        {
            id: 'government',
            short: 'Government and agencies',
            title: 'Government and agency partner',
            text: 'Work with us on real operational use cases and on the operational data that policy and regulation depend on.',
            offers: ['Operational use cases', 'Data and insights for regulators', 'Joint initiatives and agreements'],
            cta: 'Start a partnership',
            role: 'Government or agency partner',
            enquiryType: 'research',
        },
        {
            id: 'research',
            short: 'Research partners',
            title: 'Research partner',
            text: 'Co-develop projects, share grants and link research groups across universities and countries.',
            offers: ['Joint research projects', 'Research areas and groups', 'Networking and linkages'],
            cta: 'Propose a joint project',
            role: 'Research partner',
            enquiryType: 'research',
        },
        {
            id: 'training',
            short: 'Training and services',
            title: 'Training or services enquirer',
            text: 'Book drone operation and technical courses, or ask for engineering and aerial data services.',
            offers: ['Training and professional development', 'Training calendar', 'Engineering and technical services'],
            cta: 'Ask about training',
            role: 'Training or services enquirer',
            enquiryType: 'training',
        },
    ],
};

/* ---------- 6. What we offer (Facilities & Services) --------------------- */
export const offer = {
    title: 'What we can build *with you*',
    lede: 'Engineering capability, industry know-how and training, available to partners.',
    servicesLabel: 'Engineering and technical services',
    services: [
        // EDIT: short descriptions are drafts; the titles come from the site map.
        { title: 'Design, manufacturing and assembly', text: 'From concept and prototype to built-to-order platforms.' },
        { title: 'Systems integration and testing', text: 'Bring payloads, avionics and software together and prove they work.' },
        { title: 'Maintenance, repair and upgrading', text: 'Keep research and operational fleets flying.' },
        { title: 'Aerial operations and data processing', text: 'Fly the mission, then turn the data into answers.' },
    ],
    solutionsLabel: 'Industry solutions and case studies',
    solutions: [
        'Surveying, mapping and photogrammetry',
        'Stockpile and volumetric measurement',
        'Heritage documentation and inspection',
        'Security, surveillance and monitoring',
        'Cargo and goods transportation',
        'Agriculture, spraying and crop monitoring',
        'Autonomous systems, AI and computer vision',
    ],
    trainingLabel: 'Training and professional development',
    training: [
        'Drone operation and technical courses',
        'Industry and agency training',
        'Community and outreach programmes',
        'Training calendar and enquiries',
    ],
};

/* ---------- 7. Perlis Airspace Sandbox (orbit diagram) ------------------- */
export const sandbox = {
    title: 'Test it for real at the *Perlis Airspace Sandbox*',
    lede:
        'The first dedicated low-altitude airspace testing facility in Malaysia: about 30 hectares at Sungai Batu Pahat, built around a safe, controlled and fully functional mock-up aerodrome.',
    objectives: [
        'A national ecosystem for secure drone research and real-world validation',
        'Skills development and joint research',
        'Test-based feedback for drone operational guidelines',
    ],
    coreLabel: 'Functional mock-up aerodrome',
    nodes: [
        { title: 'Vertiport', text: 'Purpose-built pads for take-off and landing of drones and next-generation air mobility.' },
        { title: 'Test flight corridor', text: 'A dedicated low-altitude test range with segmented altitude zones for different scenarios.' },
        { title: 'Drone hub', text: 'Operations base with autonomous charging stations.' },
        { title: 'Research and maintenance facility', text: 'Workshops for building, maintaining and upgrading platforms.' },
        { title: 'Flight simulator', text: 'Operator training and mission rehearsal before real flights.' },
        { title: 'Radar, communication and UTMS', text: 'Surveillance, links and unmanned traffic management for validation.' },
    ],
    cta: 'Explore the Sandbox',
    href: '', // EDIT: link to the Perlis Airspace Sandbox site, e.g. '/' or 'https://…'. Empty hides the button.
};

/* ---------- 8. Roadmap (from "Development Implementation Roadmap") -------- */
export const roadmap = {
    title: 'Join at *any phase*',
    lede: 'The sandbox grows in four phases. Here is where partners can get involved.',
    nowLabel: 'Current phase',
    phases: [
        {
            n: 1,
            name: 'Foundation and initial operational setup',
            period: 'Mid 2026 to early 2027',
            now: true,
            join: ['Early demonstration flights', 'Basic BVLOS operations', 'Operational SOP development'],
        },
        {
            n: 2,
            name: 'Operational validation and ecosystem expansion',
            period: 'Mid 2027 to 2028',
            join: ['UTM system development', 'Training and simulation centre', 'Industry and startup ecosystem'],
        },
        {
            n: 3,
            name: 'Advanced airspace ecosystem development',
            period: '2028 to 2029',
            join: ['Vertiport demonstration', 'eVTOL integration studies', 'International collaboration'],
        },
        {
            n: 4,
            name: 'Sustainability and future mobility integration',
            period: '2029 to 2030+',
            join: ['ASEAN sandbox collaboration', 'Smart city and smart logistics', 'Global validation network'],
        },
    ],
};

/* ---------- 9. Network ---------------------------------------------------- */
export const network = {
    title: 'A *growing network* of partners',
    lede: 'Universities, industry, government, agencies and regulators each play a part.',
    rolesLabel: 'Who does what',
    roles: [
        { name: 'University', text: 'Research, talent and innovation' },
        { name: 'Industry', text: 'Deployment and commercialisation' },
        { name: 'Government', text: 'National coordination and support' },
        { name: 'Agencies', text: 'Real operational use cases' },
        { name: 'Regulator', text: 'Safety, governance and compliance' },
    ],
    channelsLabel: 'Ways we link up',
    channels: [
        'University and research networks',
        'Government and agency relationships',
        'Industrial collaborators',
        'International collaborations',
        'Agreements, consortia and joint initiatives',
    ],
    // Add { name, logo } items; logo is an image URL (leave '' to show the name).
    // EDIT: the names below are the logos shown on the Sandbox poster. Confirm before publishing.
    groups: [
        {
            group: 'Agencies and national partners',
            items: [
                { name: 'CAAM', logo: '' },
                { name: 'MCMC', logo: '' },
                { name: 'MIGHT', logo: '' },
                { name: 'FUTURISE', logo: '' },
                { name: 'STRIDE', logo: '' },
                { name: 'SIRIM', logo: '' },
                { name: 'MRANTI', logo: '' },
                { name: 'NAICO', logo: '' },
            ],
        },
        {
            group: 'Academia and industry',
            items: [
                { name: 'Universiti Malaysia Perlis', logo: '' },
                { name: 'Vertiport Malaysia', logo: '' },
                // { name: 'Your partner', logo: '/images/partners/partner.png' },
            ],
        },
    ],
};

/* ---------- 10. Enquiry form --------------------------------------------- */
export const enquire = {
    title: 'Start the *conversation*',
    lede: 'Tell us what you have in mind. We will route your message to the right group.',
    // Three enquiry types from the Contact section of the site map
    types: [
        { value: 'general', label: 'General enquiry' },
        { value: 'research', label: 'Research and collaboration' },
        { value: 'training', label: 'Training and services' },
    ],
    // The five actors from the use-case document
    roles: [
        'Prospective student or research applicant',
        'Industry partner',
        'Government or agency partner',
        'Research partner',
        'Training or services enquirer',
        'Other',
    ],
    stepsLabel: 'What happens next', // EDIT: confirm the process with the centre
    steps: ['You send the enquiry', 'We pass it to the right research or training group', 'We reply to discuss next steps'],
    labels: {
        type: 'Type of enquiry',
        role: 'I am a',
        rolePlaceholder: 'Choose one',
        name: 'Full name',
        email: 'Email address',
        organisation: 'Organisation',
        message: 'How would you like to work with us?',
        submit: 'Send enquiry',
        sending: 'Sending…',
        another: 'Send another enquiry',
    },
    successTitle: 'Enquiry sent',
    successText: 'Thank you. We will reply to the email address you gave.',
    errorText: 'Your enquiry was not sent. Check the highlighted fields and try again.',
    // Leave a value '' to hide that line.
    contact: {
        organisation: 'Centre of Excellence for Unmanned Aerial Systems (COE-UAS), Universiti Malaysia Perlis',
        email: '',
        phone: '',
        sandbox: 'Perlis Airspace Sandbox, Sungai Batu Pahat, Perlis',
    },
};

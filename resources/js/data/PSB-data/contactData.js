/* ==========================================================================
   CONTACT US — CONTENT FILE
   Everything on the Contact page is edited HERE. You never touch the JSX.

   !!! Every name, email, phone number, address and opening hour below is
   !!! SAMPLE / PLACEHOLDER content. Replace it with your real details.
========================================================================== */

export const links = {
    opportunities: '/opportunities',
    media: '/media-centre',
    innovation: '/innovation',
};

export const page = {
    title: 'Contact Us',
    description: 'Get in touch with the Perlis Airspace Sandbox team.',
};

export const hero = {
    eyebrow: 'Perlis Airspace Sandbox / Contact Us',
    titleLines: ['Let’s talk about', 'the next', 'flight.'],
    highlight: 'the next',
    lede: 'Questions about the sandbox, testing opportunities, partnerships or media? Send us a message or reach the right person directly.',
    primaryButton: 'Send an enquiry',
    secondaryButton: 'Find a contact person',
    signalLabel: 'Sungai Batu Pahat, Perlis',
};

export const sections = [
    { id: 'enquiry', label: 'General Enquiry' },
    { id: 'people', label: 'Contact Persons' },
    { id: 'direct', label: 'Email & Telephone' },
    { id: 'visit', label: 'Address & Hours' },
];

export const ticker = [
    'We reply within 2 working days',
    'Perlis Airspace Sandbox',
    'Innovating today, connecting tomorrow',
    'COE-UAS · UniMAP',
    'Vertiport Malaysia Perlis',
];

/* ==========================================================================
   01 GENERAL ENQUIRY FORM
   `endpoint`: where the form is POSTed as JSON. Leave '' for demo mode
   (no request is sent, success is simulated).
   `fallbackEmail`: the "or email us directly" link (opens the visitor's mail app
   with their message pre-filled).
========================================================================== */

export const enquiry = {
    heading: 'Send us an enquiry',
    lede: 'Tell us what you need and we will route it to the right team. Fields marked * are required.',
    endpoint: '',
    fallbackEmail: 'info@example.com',
    topics: ['General', 'Testing & trials', 'Partnership', 'Research', 'Media', 'Careers'],
    messageMax: 1200,
    consent: 'I agree that my details may be used to reply to this enquiry.',
    button: 'Send message',
    success: {
        title: 'Message sent.',
        text: 'Thank you. A member of the team will reply within 2 working days.',
        again: 'Send another message',
    },
    fail: 'Something went wrong. Please try again or email us directly.',
    next: {
        title: 'What happens next',
        steps: [
            { title: 'We read it', text: 'Every enquiry is read by the programme office.' },
            { title: 'We route it', text: 'It goes to the person who can help, based on your topic.' },
            { title: 'We reply', text: 'Expect an answer within 2 working days.' },
        ],
        note: 'For urgent site or safety matters, call the programme office.',
    },
};

/* ==========================================================================
   02 PROGRAMME CONTACT PERSONS
   `area` creates the filter tabs automatically.
========================================================================== */

export const people = {
    heading: 'Programme contact persons',
    lede: 'Go straight to the person who looks after your area. Copy a detail or write to them in one click.',
    items: [
        { id: 'p1', name: 'Name Surname', role: 'Programme Director', area: 'Programme', focus: 'Overall programme, strategy and government liaison', email: 'director@example.com', phone: '+60 4-000 0001' },
        { id: 'p2', name: 'Name Surname', role: 'Testing & Operations Lead', area: 'Testing', focus: 'Test requests, flight plans, scheduling and site access', email: 'testing@example.com', phone: '+60 4-000 0002' },
        { id: 'p3', name: 'Name Surname', role: 'Industry & Partnerships Manager', area: 'Partnerships', focus: 'Industry collaboration, MoUs and participation', email: 'partners@example.com', phone: '+60 4-000 0003' },
        { id: 'p4', name: 'Name Surname', role: 'Research Coordinator', area: 'Research', focus: 'Academic collaboration, data and publications', email: 'research@example.com', phone: '+60 4-000 0004' },
        { id: 'p5', name: 'Name Surname', role: 'Safety & Regulatory Officer', area: 'Testing', focus: 'Safety cases, regulator coordination and permits', email: 'safety@example.com', phone: '+60 4-000 0005' },
        { id: 'p6', name: 'Name Surname', role: 'Communications Officer', area: 'Media', focus: 'Press, photography, events and social media', email: 'media@example.com', phone: '+60 4-000 0006' },
    ],
};

/* ==========================================================================
   03 OFFICIAL EMAIL & TELEPHONE
   type: 'email' | 'phone' | 'whatsapp'   (decides the link: mailto: / tel: / wa.me)
========================================================================== */

export const direct = {
    heading: 'Official email & telephone',
    lede: 'The main lines of the programme office. Tap to open, or copy the detail.',
    items: [
        { id: 'd1', label: 'General enquiries', type: 'email', value: 'info@example.com', note: 'Replies within 2 working days' },
        { id: 'd2', label: 'Programme office', type: 'phone', value: '+60 4-000 0000', note: 'During office hours' },
        { id: 'd3', label: 'Testing & trials', type: 'email', value: 'testing@example.com', note: 'Test requests and site access' },
        { id: 'd4', label: 'Media & press', type: 'email', value: 'media@example.com', note: 'Journalists and press kit' },
        { id: 'd5', label: 'WhatsApp', type: 'whatsapp', value: '+60 12-000 0000', note: 'Quick questions, text only' },
    ],
    social: [
        { name: 'LinkedIn', url: '#' },
        { name: 'Facebook', url: '#' },
        { name: 'Instagram', url: '#' },
        { name: 'YouTube', url: '#' },
    ],
};

/* ==========================================================================
   04 OFFICE ADDRESS & OPERATING HOURS
   hours: Monday first. Use  null  for closed days.  Times are 24h 'HH:MM'
   in the time zone given by `timeZone` (so "Open now" is right for every visitor).
========================================================================== */

export const visit = {
    heading: 'Office address & operating hours',
    lede: 'Visits are by appointment so we can arrange safe access to the site.',
    timeZone: 'Asia/Kuala_Lumpur',
    offices: [
        {
            id: 'o1',
            name: 'Programme Office',
            tag: 'Main office',
            lines: ['Centre of Excellence for Unmanned Aerial Systems (COE-UAS)', 'Universiti Malaysia Perlis', 'Kampus Pauh Putra', '02600 Arau, Perlis, Malaysia'],
            mapQuery: 'Universiti Malaysia Perlis Pauh Putra Arau Perlis',
        },
        {
            id: 'o2',
            name: 'Sandbox Site',
            tag: 'By appointment',
            lines: ['Perlis Airspace Sandbox', 'Sungai Batu Pahat', 'Perlis, Malaysia'],
            mapQuery: 'Sungai Batu Pahat Perlis',
        },
    ],
    hours: [
        { day: 'Monday', open: '08:00', close: '17:00' },
        { day: 'Tuesday', open: '08:00', close: '17:00' },
        { day: 'Wednesday', open: '08:00', close: '17:00' },
        { day: 'Thursday', open: '08:00', close: '17:00' },
        { day: 'Friday', open: '08:00', close: '16:30' },
        { day: 'Saturday', open: null, close: null },
        { day: 'Sunday', open: null, close: null },
    ],
    hoursNote: 'Closed on public holidays. Site visits must be booked at least 3 working days ahead.',
    getting: {
        title: 'Getting here',
        items: [
            { title: 'By road', text: 'About 15 minutes from Kangar town centre.' },
            { title: 'By air', text: 'Nearest airports: Alor Setar and Penang.' },
            { title: 'Visitors', text: 'Bring photo ID. Closed-toe shoes are required on site.' },
        ],
    },
};

export const closing = {
    heading: 'Ready to test in the sandbox?',
    text: 'If you already know what you want to test, start with the opportunities page.',
};

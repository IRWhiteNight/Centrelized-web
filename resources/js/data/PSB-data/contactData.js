/* ==========================================================================
   CONTACT US: CONTENT FILE  (data/PSB-data/contactData.js)

   Everything on the Contact page is edited HERE. You never touch the JSX.

   HOW TO EDIT
   - Update : change the text between the quotes.
   - Insert : copy one { ... }, line and paste it next to the others.
   - Delete : remove the whole { ... }, line.
   - Hide a whole section : delete its line in `sections` (the section and
     its menu item both disappear). Add it back to show it again.
   - Reorder menu items : only the menu order changes; the page keeps its
     layout order (Reach us, People, Enquiry, Visit).
   - Every list can grow or shrink. The layout adapts by itself.

   !!! Every name, email, phone number, address and opening hour below is
   !!! SAMPLE content. Replace it with the real details.
========================================================================== */

export const page = {
    title: 'Contact Us',
    description: 'Get in touch with the Perlis Airspace Sandbox team.',
};

/* Sticky menu + which sections are shown.  id must be: reach | people | enquiry | visit */
export const sections = [
    { id: 'reach', label: 'Reach us' },
    { id: 'people', label: 'Contact persons' },
    { id: 'enquiry', label: 'Send an enquiry' },
    { id: 'visit', label: 'Visit us' },
];

/* Yellow strip under the menu. Delete every line to hide the strip. */
export const ticker = [
    'We reply within 2 working days',
    'Perlis Airspace Sandbox',
    'Innovating today, connecting tomorrow',
    'COE-UAS · UniMAP',
    'Vertiport Malaysia Perlis',
];

/* Floating button that appears after scrolling. Delete the block to remove it.
   go: the section id it jumps to. */
export const fab = { label: 'Send an enquiry', go: 'enquiry' };

/* ==========================================================================
   01 REACH US   (first thing the visitor sees)
   channels : official email / phone / WhatsApp
              type: 'email' | 'phone' | 'whatsapp'   (decides the link)
   routes   : "What do you need?" shortcuts. go decides what happens:
              { go: 'people',  area: 'Testing' }   -> jumps to the people, filtered
              { go: 'enquiry', topic: 'Media' }    -> jumps to the form, topic chosen
              { go: 'visit',   office: 'o2' }      -> jumps to the map, office chosen
              { go: 'link',    href: '/opportunities' }
   statusOffice : id of the office whose "Open now" status is shown. Remove
                  the line to hide the status card.
========================================================================== */
export const reach = {
    heading: 'Contact the Perlis Airspace Sandbox team',
    lede: 'Call or email us directly, or choose what you need and we will take you to the right person.',
    statusOffice: 'o1',
    statusLabel: 'Programme office',
    channelsTitle: 'Call or email us',
    routesTitle: 'Not sure who to ask?',
    channels: [
        { id: 'd1', label: 'General enquiries', type: 'email', value: 'info@example.com', note: 'Replies within 2 working days' },
        { id: 'd2', label: 'Programme office', type: 'phone', value: '+60 4-000 0000', note: 'During office hours' },
        { id: 'd3', label: 'Testing and trials', type: 'email', value: 'testing@example.com', note: 'Test requests and site access' },
        { id: 'd4', label: 'Media and press', type: 'email', value: 'media@example.com', note: 'Journalists and press kit' },
        { id: 'd5', label: 'WhatsApp', type: 'whatsapp', value: '+60 12-000 0000', note: 'Quick questions, text only' },
    ],
    routes: [
        { title: 'Request a test slot', text: 'Talk to the testing and safety team', go: 'people', area: 'Testing' },
        { title: 'Explore a partnership', text: 'Industry, MoUs and participation', go: 'people', area: 'Partnerships' },
        { title: 'Speak to the press office', text: 'Interviews, photos and events', go: 'people', area: 'Media' },
        { title: 'Visit the sandbox site', text: 'Book safe access to the site', go: 'visit', office: 'o2' },
        { title: 'Ask something else', text: 'Send a message and we will route it', go: 'enquiry', topic: 'General' },
    ],
    /* Delete the list to hide the social row. */
    social: [
        { name: 'LinkedIn', url: '#' },
        { name: 'Facebook', url: '#' },
        { name: 'Instagram', url: '#' },
        { name: 'YouTube', url: '#' },
    ],
};

/* ==========================================================================
   02 CONTACT PERSONS
   `area` creates the filter chips automatically (and the counts).
   Optional per person:  photo: '/images/people/name.jpg'   initials: 'AB'
========================================================================== */
export const people = {
    heading: 'Programme contact persons',
    lede: 'Choose an area or search by name or topic. Tap an email or phone number to use it, or copy it.',
    searchPlaceholder: 'Search by name, role or topic',
    filterLabel: 'Show:',
    allLabel: 'Everyone',
    columns: ['Contact person', 'Can help with', 'How to reach them'],
    items: [
        { id: 'p1', name: 'Person A', role: 'Programme Director', area: 'Programme', focus: 'Overall programme, strategy and government liaison', email: 'director@example.com', phone: '+60 4-000 0001' },
        { id: 'p2', name: 'Person B', role: 'Testing and Operations Lead', area: 'Testing', focus: 'Test requests, flight plans, scheduling and site access', email: 'testing@example.com', phone: '+60 4-000 0002' },
        { id: 'p3', name: 'Person C', role: 'Industry and Partnerships Manager', area: 'Partnerships', focus: 'Industry collaboration, MoUs and participation', email: 'partners@example.com', phone: '+60 4-000 0003' },
        { id: 'p4', name: 'Person D', role: 'Research Coordinator', area: 'Research', focus: 'Academic collaboration, data and publications', email: 'research@example.com', phone: '+60 4-000 0004' },
        { id: 'p5', name: 'Person E', role: 'Safety and Regulatory Officer', area: 'Testing', focus: 'Safety cases, regulator coordination and permits', email: 'safety@example.com', phone: '+60 4-000 0005' },
        { id: 'p6', name: 'Person F', role: 'Communications Officer', area: 'Media', focus: 'Press, photography, events and social media', email: 'media@example.com', phone: '+60 4-000 0006' },
    ],
};

/* ==========================================================================
   03 ENQUIRY FORM
   endpoint : the Laravel route the form POSTs JSON to (example: '/contact').
              The CSRF token is read from <meta name="csrf-token"> and
              validation errors (HTTP 422) are shown next to each field.
              Leave '' for demo mode (nothing is sent, success is simulated).
   topics   : label = chip text, email = where the "or email us directly"
              link goes for that topic. Add / delete freely.
              The first topic is selected by default.
========================================================================== */
export const enquiry = {
    heading: 'Send us an enquiry',
    lede: 'Tell us what you need and we will send it to the right team. Fields marked * are required.',
    endpoint: '',
    fallbackEmail: 'info@example.com',
    topicsTitle: 'What is it about?',
    topics: [
        { label: 'General', email: 'info@example.com' },
        { label: 'Testing and trials', email: 'testing@example.com' },
        { label: 'Partnership', email: 'partners@example.com' },
        { label: 'Research', email: 'research@example.com' },
        { label: 'Media', email: 'media@example.com' },
        { label: 'Careers', email: 'info@example.com' },
    ],
    messageMax: 1200,
    consent: 'I agree that my details may be used to reply to this enquiry.',
    button: 'Send message',
    success: {
        title: 'Message sent',
        text: 'Thank you. A member of the team will reply within 2 working days.',
        again: 'Send another message',
    },
    fail: 'The message was not sent. Try again, or use the email link below.',
    next: {
        title: 'What happens next',
        steps: [
            { title: 'We read it', text: 'The programme office reads every enquiry.' },
            { title: 'We route it', text: 'It goes to the person who can help, based on your topic.' },
            { title: 'We reply', text: 'Expect an answer within 2 working days.' },
        ],
        note: 'For urgent site or safety matters, call the programme office.',
    },
};

/* ==========================================================================
   04 VISIT US
   offices : add / delete freely. Each office has its own hours.
     hours : 7 entries, MONDAY FIRST. Times are 24h 'HH:MM' in `timeZone`.
             Use open: null for a closed day, or  hours: null  for
             "by appointment only" (no hours table, no open/closed badge).
     mapQuery : what Google Maps searches for.
========================================================================== */
export const visit = {
    heading: 'Office address and operating hours',
    lede: 'Choose an office to see its address, opening hours and map. Site visits are by appointment so we can arrange safe access.',
    timeZone: 'Asia/Kuala_Lumpur',
    addressTitle: 'Address',
    hoursTitle: 'Opening hours',
    offices: [
        {
            id: 'o1',
            name: 'Programme Office',
            tag: 'Main office',
            lines: ['Centre of Excellence for Unmanned Aerial Systems (COE-UAS)', 'Universiti Malaysia Perlis', 'Kampus Pauh Putra', '02600 Arau, Perlis, Malaysia'],
            mapQuery: 'Universiti Malaysia Perlis Pauh Putra Arau Perlis',
            hours: [
                { day: 'Monday', open: '08:00', close: '17:00' },
                { day: 'Tuesday', open: '08:00', close: '17:00' },
                { day: 'Wednesday', open: '08:00', close: '17:00' },
                { day: 'Thursday', open: '08:00', close: '17:00' },
                { day: 'Friday', open: '08:00', close: '16:30' },
                { day: 'Saturday', open: null, close: null },
                { day: 'Sunday', open: null, close: null },
            ],
            hoursNote: 'Closed on public holidays.',
        },
        {
            id: 'o2',
            name: 'Sandbox Site',
            tag: 'By appointment',
            lines: ['Perlis Airspace Sandbox', 'Sungai Batu Pahat', 'Perlis, Malaysia'],
            mapQuery: 'Sungai Batu Pahat Perlis',
            hours: null,
            hoursNote: 'Book a site visit at least 3 working days ahead through the programme office.',
        },
    ],
    getting: {
        title: 'Getting here',
        items: [
            { title: 'By road', text: 'About 15 minutes from Kangar town centre.' },
            { title: 'By air', text: 'Nearest airports: Alor Setar and Penang.' },
            { title: 'Visitors', text: 'Bring photo ID. Closed-toe shoes are required on site.' },
        ],
    },
};

/* ==========================================================================
   CLOSING BANNER. style: 'solid' | 'ghost'.  Delete the block to hide it.
========================================================================== */
export const closing = {
    heading: 'Ready to test in the sandbox?',
    text: 'If you already know what you want to test, start with the opportunities page.',
    buttons: [
        { label: 'See opportunities', href: '/opportunities', style: 'solid' },
        { label: 'Innovation', href: '/innovation', style: 'ghost' },
        { label: 'Media Centre', href: '/media-centre', style: 'ghost' },
    ],
};

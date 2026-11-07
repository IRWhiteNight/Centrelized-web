/* ==========================================================================
   COE-UAS · Contact page — ALL content lives here.
   (Place at: resources/js/data/contactContent.js)

   • Wrap words in *asterisks* inside a "title" to highlight them.
   • Any value left '' is hidden on the page, so you can fill things in later.
   • Structure follows the site map: CONTACT → General enquiry, Research and
     collaboration enquiry, Training and services enquiry, Contact details,
     location and office information.
========================================================================== */

/* ---------- 1. Behaviour -------------------------------------------------- */
export const settings = {
    transitionMs: 1250,
    showControls: true,
    formEndpoint: '', // Laravel POST route, e.g. '/coeuas/contact'. '' = show success message only.
};

/* ---------- 2. Slide order / colour / transition ---------------------------
   theme: 'dark' | 'navy' | 'blue' | 'light'
   fx:    'none' | 'iris' | 'diag' | 'doors' | 'rise' | 'zoom' | 'swing' | 'curtain' | 'sweep'
------------------------------------------------------------------------- */
export const slides = [
    { id: 'hero',      label: 'Contact us',          theme: 'dark',  fx: 'none' },
    { id: 'routes',    label: 'Choose a route',      theme: 'navy',  fx: 'iris' },
    { id: 'details',   label: 'Contact details',     theme: 'light', fx: 'doors' },
    { id: 'locations', label: 'Where to find us',    theme: 'dark',  fx: 'zoom' },
    { id: 'form',      label: 'Send a message',      theme: 'blue',  fx: 'sweep' },
];

/* ---------- 3. Hero ------------------------------------------------------- */
export const hero = {
    title: 'Get in touch with *COE-UAS*',
    lede:
        'Ask a question, propose a project or enquire about training. Pick the route that fits and your message goes to the right team at the Centre of Excellence for Unmanned Aerial Systems, Universiti Malaysia Perlis.',
    primaryCta: 'Write to us',
    secondaryCta: 'See contact details',
    scrollHint: 'Scroll, swipe or use the arrow keys',
};

/* ---------- 4. Enquiry routes (the three enquiry types) ------------------- */
export const routes = {
    title: 'Which *route* fits you?',
    lede: 'Each route reaches a different team. Choosing one fills in the form for you.',
    items: [
        {
            value: 'general',
            title: 'General enquiry',
            text: 'Questions about the centre, visits, media or anything not covered elsewhere.',
            includes: ['About COE-UAS', 'Visits and media', 'Anything else'],
            cta: 'Ask a question',
        },
        {
            value: 'research',
            title: 'Research and collaboration',
            text: 'Joint projects, partnerships, research opportunities and the Perlis Airspace Sandbox.',
            includes: ['Joint research and industry projects', 'Postgraduate and postdoctoral opportunities', 'Perlis Airspace Sandbox programme'],
            cta: 'Propose a project',
        },
        {
            value: 'training',
            title: 'Training and services',
            text: 'Courses, the training calendar, engineering services and aerial data work.',
            includes: ['Drone operation and technical courses', 'Industry and agency training', 'Engineering and technical services'],
            cta: 'Ask about training',
        },
    ],
};

/* ---------- 5. Contact details ------------------------------------------- */
export const details = {
    title: 'Reach us *directly*',
    lede: 'Prefer email or a call? Use the details below.',
    organisation: 'Centre of Excellence for Unmanned Aerial Systems (COE-UAS), Universiti Malaysia Perlis',
    // kind: 'email' | 'phone' | 'text' | 'link'. Rows with an empty value are hidden.
    channels: [
        { label: 'General enquiries', kind: 'email', value: '' },                 // EDIT
        { label: 'Research and collaboration', kind: 'email', value: '' },        // EDIT
        { label: 'Training and services', kind: 'email', value: '' },             // EDIT
        { label: 'Office phone', kind: 'phone', value: '' },                      // EDIT
        { label: 'Office hours', kind: 'text', value: '' },                       // EDIT
        { label: 'Website or social media', kind: 'link', value: '' },            // EDIT
    ],
    fallback: 'Contact details are being updated. Please use the message form for now.',
    copyLabel: 'Copy',
    copiedLabel: 'Copied',
    cta: 'Or send a message',
};

/* ---------- 6. Locations -------------------------------------------------- */
export const locations = {
    title: 'Where to *find us*',
    lede: 'Two places, one team. Visits are by appointment, so send a message first.',
    visitNote: '', // EDIT: e.g. 'Please bring photo ID to the guard house.' Empty hides it.
    items: [
        {
            name: 'COE-UAS office',
            role: 'Centre of Excellence for Unmanned Aerial Systems',
            lines: ['Universiti Malaysia Perlis', ''],   // EDIT: add the full address line(s)
            embed: '',      // EDIT: Google Maps / OpenStreetMap "embed" URL. Empty shows the drawn marker.
            directions: '', // EDIT: link to open directions. Empty hides the button.
        },
        {
            name: 'Perlis Airspace Sandbox',
            role: 'Low-altitude airspace testing site, about 30 hectares',
            lines: ['Sungai Batu Pahat, Perlis', ''],
            embed: '',
            directions: '',
        },
    ],
    directionsLabel: 'Get directions',
};

/* ---------- 7. Message form ---------------------------------------------- */
export const form = {
    title: 'Send us a *message*',
    lede: 'Tell us what you need. We will reply to the email address you give.',
    types: [
        { value: 'general', label: 'General enquiry' },
        { value: 'research', label: 'Research and collaboration' },
        { value: 'training', label: 'Training and services' },
    ],
    defaultType: 'general',
    labels: {
        type: 'Type of enquiry',
        name: 'Full name',
        email: 'Email address',
        phone: 'Phone (optional)',
        organisation: 'Organisation (optional)',
        subject: 'Subject',
        message: 'Message',
        submit: 'Send message',
        sending: 'Sending…',
        another: 'Send another message',
    },
    successTitle: 'Message sent',
    successText: 'Thank you. We will reply to the email address you gave.',
    errorText: 'Your message was not sent. Check the highlighted fields and try again.',
    note: 'We use your details only to reply to this message.', // EDIT: match your privacy policy. Empty hides it.
};

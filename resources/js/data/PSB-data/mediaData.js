/* ==========================================================================
   MEDIA CENTRE — CONTENT FILE
   Everything on the Media Centre page is edited HERE. You never touch the JSX.

   HOW TO ADD A PHOTO
     1. Drop the file in  src/images/media/
     2. Add one import line below, and one line in the `images` object
     3. Add an item to `gallery.items` (or use the key as `image` in news/events/articles)

   HOW TO ADD A VIDEO
     Add an item with  type: 'video'  and ONE of:
        youtube: 'dQw4w9WgXcQ'          (the id after ?v= in the YouTube link)
        mp4:     '/videos/launch.mp4'   (a file in /public/videos)
     `image` is the poster/thumbnail. `duration` is just a label ('2:14').

   ALL names, dates, quotes and links below are SAMPLE CONTENT. Replace freely.
========================================================================== */

/* ---- images (import it here, then list it in `images`) ---- */
import posterSandbox from '../../images/media/poster-sandbox.jpg';
import skyInfra from '../../images/media/sky-infrastructure.jpg';
import renderExterior from '../../images/media/render-exterior.jpg';
import renderHangar from '../../images/media/render-hangar.jpg';
import renderEntrance from '../../images/media/render-entrance.jpg';
import renderHelipad from '../../images/media/render-helipad.jpg';
import cityEvtol from '../../images/media/city-evtol.jpg';
import siteAerial from '../../images/media/site-aerial.jpg';
import siteField1 from '../../images/media/site-field-1.jpg';
import siteField2 from '../../images/media/site-field-2.jpg';
import siteField3 from '../../images/media/site-field-3.jpg';
import siteField4 from '../../images/media/site-field-4.jpg';
import siteBoundary from '../../images/media/site-boundary.jpg';
import sitePlan from '../../images/media/site-plan.jpg';
import corridorTerrain from '../../images/media/corridor-terrain.jpg';
import visionPyramid from '../../images/media/vision-pyramid.jpg';
import roadmapPhases from '../../images/media/roadmap-phases.jpg';
import whyUnimap from '../../images/media/why-unimap.jpg';
import ecosystemApps from '../../images/media/ecosystem-apps.jpg';

export const images = {
    'poster-sandbox': posterSandbox,
    'sky-infra': skyInfra,
    'render-exterior': renderExterior,
    'render-hangar': renderHangar,
    'render-entrance': renderEntrance,
    'render-helipad': renderHelipad,
    'city-evtol': cityEvtol,
    'site-aerial': siteAerial,
    'site-field-1': siteField1,
    'site-field-2': siteField2,
    'site-field-3': siteField3,
    'site-field-4': siteField4,
    'site-boundary': siteBoundary,
    'site-plan': sitePlan,
    'corridor-terrain': corridorTerrain,
    'vision-pyramid': visionPyramid,
    'roadmap-phases': roadmapPhases,
    'why-unimap': whyUnimap,
    'ecosystem-apps': ecosystemApps,
};

/* ---- links used by buttons (change to your real routes) ---- */
export const links = {
    contact: '/contact',
    opportunities: '/opportunities',
    innovation: '/innovation',
    mediaKit: '#',
};

/* ==========================================================================
   PAGE / HERO / MENU
========================================================================== */

export const page = {
    title: 'Media Centre',
    description: 'News, press releases, events, galleries and stories from the Perlis Airspace Sandbox.',
};

export const hero = {
    eyebrow: 'Perlis Airspace Sandbox / Media Centre',
    titleLines: ['Stories from', 'the low-altitude', 'sky.'],
    highlight: 'the low-altitude',
    lede: 'Project updates, official statements, events, photos and film from the national low-altitude airspace testbed in Perlis.',
    primaryButton: 'Latest news',
    secondaryButton: 'Browse the gallery',
    // image keys shown in the hero film-strip (they scroll sideways, endlessly)
    strip: ['render-exterior', 'city-evtol', 'render-hangar', 'site-aerial', 'poster-sandbox', 'render-helipad', 'sky-infra', 'corridor-terrain'],
};

export const sections = [
    { id: 'news', label: 'News & Project Updates' },
    { id: 'press', label: 'Press Releases' },
    { id: 'events', label: 'Events & Activities' },
    { id: 'gallery', label: 'Photo & Video Gallery' },
    { id: 'articles', label: 'Articles & Social Media' },
];

export const ticker = [
    'Perlis Airspace Sandbox',
    'Innovating today, connecting tomorrow',
    'Low altitude airspace = new economic layer',
    'Advanced Air Mobility testbed',
    'COE-UAS · UniMAP',
    'Vertiport Malaysia Perlis',
];

/* ==========================================================================
   01 NEWS & PROJECT UPDATES
   - `featured: true` puts one story in the big hero card (use only one)
   - `body` is a list of paragraphs shown when the story is opened
========================================================================== */

export const news = {
    heading: 'News & project updates',
    lede: 'What is happening on site, in the lab and in the sky — newest first.',
    categories: ['All', 'Project update', 'Infrastructure', 'Partnership', 'Technology', 'Community'],
    items: [
        {
            id: 'n1',
            featured: true,
            title: 'Sandbox site survey completed at Sungai Batu Pahat',
            category: 'Infrastructure',
            date: '2026-10-28',
            readTime: 4,
            image: 'site-aerial',
            summary: 'Boundary mapping and ground inspection of the 6-acre site have been finished, clearing the way for the first facilities.',
            body: [
                'The survey team completed boundary mapping, terrain inspection and drainage assessment of the sandbox site at Sungai Batu Pahat.',
                'The data feeds directly into the site plan, which positions the main building, vertiport, drone-training area and the future test-flight corridor.',
                'Next steps include utilities planning and engagement with local authorities ahead of construction.',
            ],
        },
        {
            id: 'n2', title: 'Phase 1 foundation work moves into design review', category: 'Project update', date: '2026-10-21', readTime: 3,
            image: 'roadmap-phases', summary: 'Facility layouts, communications infrastructure and operational setup enter the design review stage.',
            body: ['The Phase 1 package covers the facility, communications infrastructure and initial operating procedures.', 'Design review brings together engineers, regulators and academic partners.'],
        },
        {
            id: 'n3', title: 'Hangar and vertiport concept renders released', category: 'Infrastructure', date: '2026-10-14', readTime: 2,
            image: 'render-hangar', summary: 'New renders show the hangar interior, the yellow steel frame and the helipad apron.',
            body: ['The concept renders show an open-span hangar designed for eVTOL and drone operations, with a mezzanine for control and training.'],
        },
        {
            id: 'n4', title: 'UniMAP COE-UAS opens collaboration with industry partners', category: 'Partnership', date: '2026-10-07', readTime: 3,
            image: 'why-unimap', summary: 'The Centre of Excellence for Unmanned Aerial Systems invites industry to join the testbed programme.',
            body: ['COE-UAS at Universiti Malaysia Perlis is opening structured collaboration for companies that need a real-world validation environment.'],
        },
        {
            id: 'n5', title: 'BVLOS validation corridor: terrain study published', category: 'Technology', date: '2026-09-30', readTime: 5,
            image: 'corridor-terrain', summary: 'Terrain and coastline analysis supports the proposed routes towards Timah Tasoh Dam and Langkawi.',
            body: ['The study maps terrain, population exposure and communications coverage along candidate corridors for beyond-visual-line-of-sight testing.'],
        },
        {
            id: 'n6', title: 'Community briefing held with Perlis stakeholders', category: 'Community', date: '2026-09-18', readTime: 2,
            image: 'city-evtol', summary: 'Residents and local leaders were briefed on the sandbox, safety planning and expected benefits.',
            body: ['The briefing explained how the sandbox operates, what is tested and how safety and noise are managed.'],
        },
        {
            id: 'n7', title: 'Ecosystem applications roadmap shared with agencies', category: 'Project update', date: '2026-09-05', readTime: 3,
            image: 'ecosystem-apps', summary: 'Security, logistics, agriculture, disaster response and infrastructure inspection are mapped to test plans.',
            body: ['The roadmap links each national application area to concrete test scenarios inside the sandbox.'],
        },
    ],
};

/* ==========================================================================
   02 PRESS RELEASES
   type: 'Announcement' | 'Statement' | 'Media advisory'   file: link to a PDF (or '')
========================================================================== */

export const press = {
    heading: 'Press releases',
    lede: 'Official statements for journalists and partners. Download the full release or the media kit.',
    types: ['All', 'Announcement', 'Statement', 'Media advisory'],
    items: [
        { id: 'p1', title: 'Perlis Airspace Sandbox announces site selection', date: '2026-10-28', type: 'Announcement', summary: 'The sandbox will be developed at Sungai Batu Pahat, Perlis, as a national low-altitude testbed.', file: '' },
        { id: 'p2', title: 'Statement on safety and airspace coordination', date: '2026-10-12', type: 'Statement', summary: 'How flight testing will be coordinated with regulators, airports and local authorities.', file: '' },
        { id: 'p3', title: 'Media advisory: site visit for journalists', date: '2026-09-26', type: 'Media advisory', summary: 'Accredited media are invited to a guided tour of the proposed site and briefing.', file: '' },
        { id: 'p4', title: 'UniMAP and partners sign collaboration framework', date: '2026-09-10', type: 'Announcement', summary: 'A framework for academia, industry and government cooperation on AAM validation.', file: '' },
        { id: 'p5', title: 'Vertiport Malaysia Perlis joins the programme', date: '2026-08-22', type: 'Announcement', summary: 'The vertiport operator confirms participation in the sandbox development.', file: '' },
        { id: 'p6', title: 'Statement on the Low Altitude Economy ambition', date: '2026-08-04', type: 'Statement', summary: 'Position on jobs, investment and national competitiveness from low-altitude airspace.', file: '' },
    ],
    kit: {
        title: 'Media kit',
        text: 'Logos, approved photography, boilerplate and spokesperson contact.',
        items: ['Logo pack (PNG, SVG)', 'Approved photo set', 'Fact sheet', 'Boilerplate text'],
        button: 'Download media kit',
    },
    contact: { label: 'Media enquiries', name: 'Communications Office', email: 'media@example.com' },
};

/* ==========================================================================
   03 EVENTS & ACTIVITIES
   Upcoming / past is worked out automatically from `date` (YYYY-MM-DD).
========================================================================== */

export const events = {
    heading: 'Events & activities',
    lede: 'Briefings, demonstrations, workshops and site visits. Upcoming events count down live.',
    items: [
        { id: 'e1', title: 'Industry Briefing: Testing in the Sandbox', date: '2026-11-20', time: '10:00 – 13:00', location: 'UniMAP, Perlis', type: 'Briefing', image: 'why-unimap', summary: 'How companies can plan, request and run test activities.', link: '#' },
        { id: 'e2', title: 'Drone Demonstration Day', date: '2026-12-05', time: '09:00 – 16:00', location: 'Sungai Batu Pahat', type: 'Demonstration', image: 'city-evtol', summary: 'Live demonstrations of cargo and first-responder drone operations.', link: '#' },
        { id: 'e3', title: 'AAM Policy Roundtable', date: '2027-01-15', time: '14:00 – 17:00', location: 'Kangar, Perlis', type: 'Roundtable', image: 'sky-infra', summary: 'Regulators, operators and researchers discuss operational evidence.', link: '#' },
        { id: 'e4', title: 'Site Walk with Stakeholders', date: '2026-10-25', time: '08:30 – 11:00', location: 'Sungai Batu Pahat', type: 'Site visit', image: 'site-field-2', summary: 'Walk-through of the boundary, access roads and planned facilities.', link: '' },
        { id: 'e5', title: 'Low Altitude Ecosystem Workshop', date: '2026-10-09', time: '09:00 – 17:00', location: 'UniMAP, Perlis', type: 'Workshop', image: 'ecosystem-apps', summary: 'Mapped national applications to test scenarios with agency partners.', link: '' },
        { id: 'e6', title: 'Sandbox Launch Briefing', date: '2026-09-02', time: '10:00 – 12:00', location: 'Kangar, Perlis', type: 'Briefing', image: 'poster-sandbox', summary: 'Introduction of the vision, roadmap and partners.', link: '' },
    ],
};

/* ==========================================================================
   04 PHOTO & VIDEO GALLERY
   type: 'photo' | 'video'     album: any name (tabs are built automatically)
   size: 'normal' | 'tall' | 'wide'  (how big the tile is in the mosaic)
   Order here = order on the page. Newest / best first is a good habit.
========================================================================== */

export const gallery = {
    heading: 'Photo & video gallery',
    lede: 'Renders, site photography and film. Click any tile to open it full screen — use the arrow keys to move through.',
    items: [
        { id: 'g1', type: 'video', album: 'Films', size: 'wide', title: 'The Next Infrastructure Is in the Sky', caption: 'Why low-altitude airspace is the new economic layer.', image: 'sky-infra', duration: '2:14', youtube: '', mp4: '' },
        { id: 'g2', type: 'photo', album: 'Renders', size: 'tall', title: 'Hangar interior', caption: 'Open-span hangar with eVTOL on the apron and a control mezzanine.', image: 'render-hangar' },
        { id: 'g3', type: 'photo', album: 'Renders', size: 'normal', title: 'Main building, aerial view', caption: 'Concept render of the sandbox main building and car park.', image: 'render-exterior' },
        { id: 'g4', type: 'photo', album: 'Renders', size: 'normal', title: 'Entrance & gate', caption: 'Street-level view of the visitor entrance.', image: 'render-entrance' },
        { id: 'g5', type: 'photo', album: 'Renders', size: 'normal', title: 'Helipad apron', caption: 'Marked helipad in front of the hangar doors.', image: 'render-helipad' },
        { id: 'g6', type: 'photo', album: 'Site', size: 'wide', title: 'Site from above', caption: 'Aerial photograph of the sandbox site and surrounding paddy fields.', image: 'site-aerial' },
        { id: 'g7', type: 'photo', album: 'Site', size: 'normal', title: 'Site boundary', caption: 'Surveyed boundary of the sandbox land.', image: 'site-boundary' },
        { id: 'g8', type: 'photo', album: 'Site', size: 'tall', title: 'Northern field', caption: 'Ground-level view towards the limestone hills.', image: 'site-field-2' },
        { id: 'g9', type: 'photo', album: 'Site', size: 'normal', title: 'Cleared ground', caption: 'Open land ready for utilities planning.', image: 'site-field-3' },
        { id: 'g10', type: 'photo', album: 'Site', size: 'normal', title: 'Access track', caption: 'Existing access track along the field edge.', image: 'site-field-1' },
        { id: 'g11', type: 'photo', album: 'Site', size: 'normal', title: 'Western edge', caption: 'View along the western boundary.', image: 'site-field-4' },
        { id: 'g12', type: 'video', album: 'Films', size: 'normal', title: 'Walk the site', caption: 'A short tour of the proposed sandbox land.', image: 'site-aerial', duration: '1:32', youtube: '', mp4: '' },
        { id: 'g13', type: 'photo', album: 'Plans', size: 'normal', title: 'Site plan', caption: 'Main building, vertiport, drone training area and lake.', image: 'site-plan' },
        { id: 'g14', type: 'photo', album: 'Plans', size: 'wide', title: 'Four-phase roadmap', caption: 'From foundation to sustainability and future mobility.', image: 'roadmap-phases' },
        { id: 'g15', type: 'photo', album: 'Plans', size: 'normal', title: 'Corridor terrain study', caption: 'Terrain and coastline along the test corridors.', image: 'corridor-terrain' },
        { id: 'g16', type: 'photo', album: 'Vision', size: 'tall', title: 'Long-term vision', caption: 'From low altitude economy up to autonomous airspace.', image: 'vision-pyramid' },
        { id: 'g17', type: 'photo', album: 'Vision', size: 'normal', title: 'Future city mobility', caption: 'eVTOL operations over a connected city.', image: 'city-evtol' },
        { id: 'g18', type: 'video', album: 'Films', size: 'normal', title: 'Sandbox in 60 seconds', caption: 'The mission, the site and the roadmap in one minute.', image: 'poster-sandbox', duration: '1:00', youtube: '', mp4: '' },
    ],
};

/* ==========================================================================
   05 ARTICLES & SOCIAL MEDIA
========================================================================== */

export const articles = {
    heading: 'Articles & social media',
    lede: 'Longer reads, expert views and the conversation online.',
    items: [
        { id: 'a1', title: 'Why the next infrastructure is in the sky', author: 'Programme team', date: '2026-10-30', readTime: 6, tag: 'Opinion', image: 'sky-infra', summary: 'Roads connected cities, the internet connected people. Low-altitude airspace connects what comes next.', link: '#' },
        { id: 'a2', title: 'What a sandbox gives regulators that a lab cannot', author: 'COE-UAS', date: '2026-10-16', readTime: 5, tag: 'Explainer', image: 'ecosystem-apps', summary: 'Real operational data is the evidence policy needs. Here is how a sandbox produces it.', link: '#' },
        { id: 'a3', title: 'From prototype to deployment: closing the validation gap', author: 'Programme team', date: '2026-10-02', readTime: 7, tag: 'Insight', image: 'roadmap-phases', summary: 'Many drone technologies exist. Few have a place to prove themselves.', link: '#' },
        { id: 'a4', title: 'Perlis as a strategic place to test', author: 'UniMAP', date: '2026-09-14', readTime: 4, tag: 'Feature', image: 'site-aerial', summary: 'Open land, controlled airspace and a university next door.', link: '#' },
        { id: 'a5', title: 'Building the low altitude economy workforce', author: 'COE-UAS', date: '2026-08-28', readTime: 5, tag: 'Opinion', image: 'why-unimap', summary: 'Skilled and certified people are the backbone of the industry.', link: '#' },
    ],
    social: {
        title: 'On social media',
        lede: 'Sample posts shown below — connect your real feeds or paste the latest posts here.',
        platforms: [
            { name: 'Facebook', handle: '@perlisairspacesandbox', url: '#' },
            { name: 'Instagram', handle: '@perlis.airspace', url: '#' },
            { name: 'LinkedIn', handle: 'Perlis Airspace Sandbox', url: '#' },
            { name: 'X', handle: '@PerlisSandbox', url: '#' },
            { name: 'YouTube', handle: 'Perlis Airspace Sandbox', url: '#' },
        ],
        posts: [
            { id: 's1', platform: 'LinkedIn', date: '2026-10-29', text: 'Site survey complete. The land at Sungai Batu Pahat is mapped and ready for the next phase. #PerlisAirspaceSandbox', image: 'site-boundary', url: '#' },
            { id: 's2', platform: 'Instagram', date: '2026-10-26', text: 'Inside the hangar. This is where eVTOL and drone operations will be tested. #AAM #Perlis', image: 'render-hangar', url: '#' },
            { id: 's3', platform: 'X', date: '2026-10-22', text: 'Roads connect cities. Internet connects people. Airspace connects the future.', image: '', url: '#' },
            { id: 's4', platform: 'Facebook', date: '2026-10-18', text: 'Thank you to everyone who joined the stakeholder site walk. Photos in the gallery.', image: 'site-field-2', url: '#' },
            { id: 's5', platform: 'YouTube', date: '2026-10-10', text: 'New film: The Next Infrastructure Is in the Sky.', image: 'sky-infra', url: '#' },
            { id: 's6', platform: 'Instagram', date: '2026-10-03', text: 'Four phases, one ecosystem. Swipe through the roadmap. #LowAltitudeEconomy', image: 'roadmap-phases', url: '#' },
        ],
    },
};

/* ==========================================================================
   NEWSLETTER / CLOSING
========================================================================== */

export const subscribe = {
    heading: 'Never miss an update.',
    text: 'Project news, event invitations and new films — straight to your inbox. No spam.',
    placeholder: 'you@company.com',
    button: 'Subscribe',
    success: 'You are on the list. Thank you!',
    error: 'Please enter a valid email address.',
    note: 'You can unsubscribe at any time.',
    // set this to your real endpoint, e.g. '/api/subscribe'. Empty = demo mode (no request is sent).
    endpoint: '',
};

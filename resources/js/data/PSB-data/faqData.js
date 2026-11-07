/* ==========================================================================
   FAQ: ALL CONTENT LIVES HERE
   Add, edit, remove or reorder questions in this file only. The page follows.
   - Every answer is written from the supplied project documents.
   - tbc: true  shows a "To be confirmed" badge on the answer.
   - popular: true  shows the question as a quick link under the search box.
   - Item fields:  id (unique, used for share links)  q  a (text)  list (optional bullets)
                   links (optional [{ label, href }])  tbc  popular
   - Images live in  public/images/about/  (an empty or missing file shows a labelled placeholder).
   ========================================================================== */

const P = '/images/about/';

/* Change these to your real routes */
export const routes = {
    home: '/',
    apply: '/#join',
    about: '/about',
    siteInfo: '/site-information',
    media: '/media-centre',
};

export const page = {
    brand: 'Perlis Airspace Sandbox',
    applyLabel: 'Apply to participate',
};

export const hero = {
    eyebrow: 'FAQ',
    title: 'Frequently asked',
    titleEm: 'questions.',
    text: 'Quick answers about the Perlis Airspace Sandbox: what it is, who can take part, how to apply, what you can test and how the airspace works.',
    searchPlaceholder: 'Search questions, e.g. “BVLOS” or “apply”',
    popularLabel: 'Popular',
};

export const categories = [
    {
        id: 'about',
        label: 'About the Sandbox',
        intro: 'What the sandbox is, where it is and who is behind it.',
        image: P + 'site-aerial.jpg',
        items: [
            {
                id: 'what-is-the-sandbox', popular: true,
                q: 'What is the Perlis Airspace Sandbox?',
                a: 'A controlled testing environment where industry, researchers and government agencies can safely test and validate advanced aviation solutions (aircraft, operations and infrastructure) in coordination with the relevant authorities. It is Malaysia’s first structured, real-world testing environment for drones, air taxis and the airspace that connects them.',
            },
            {
                id: 'where-is-the-sandbox',
                q: 'Where is it located?',
                a: 'In Sungai Batu Pahat, Perlis, Malaysia. It is the first dedicated low-altitude airspace testing facility in Malaysia, spanning about 30 hectares. The Phase 1 development area is proposed within the 19.7 ha Sungai Batu Pahat Mango Farm site.',
                links: [{ label: 'Location & access', href: routes.siteInfo + '#location' }],
            },
            {
                id: 'objective',
                q: 'What is the sandbox trying to achieve?',
                a: 'To accelerate the development and deployment of Advanced Air Mobility through a structured platform for testing, regulatory validation, operational development and ecosystem collaboration, while ensuring safety, compliance and scalability. Its core mission is to develop a complete ecosystem for drone research and development, centred around a safe and controlled, fully functional mock-up aerodrome.',
            },
            {
                id: 'who-is-behind-it',
                q: 'Who supports and runs the sandbox?',
                a: 'The sandbox is brought together by universities, government agencies and industry partners.',
                list: ['Supported by: UniMAP, MRANTI, NAICO, MIGHT, CAAM and MOF', 'Managed and designed by: Vertiport Malaysia and Araken', 'Collaborators: EHANG, TCAB and MHS Aviation'],
                links: [{ label: 'About the sandbox', href: routes.about }],
            },
            {
                id: 'why-perlis',
                q: 'Why was Perlis chosen?',
                a: 'Perlis is a strategic environment for future low altitude innovation: a controlled, accessible, low-density setting that suits early-stage testing and scalable sandbox operations.',
                list: ['Low population density, so minimal impact on daily life and communities', 'Less airspace congestion: fewer restrictions, simpler approvals and more flexible operations', 'Suitable terrain for testing, with a diverse landscape for multiple use cases', 'A safe and controlled, lower-risk environment for testing, validation and training', 'Potential to become a new tech hub, catalysing growth, jobs, investment and regional development'],
            },
        ],
    },
    {
        id: 'participation',
        label: 'Taking part',
        intro: 'Who can join, how to apply and what support you get.',
        image: P + 'hangar-interior.jpg',
        items: [
            {
                id: 'who-can-participate', popular: true,
                q: 'Who can participate?',
                a: 'The sandbox is open to:',
                list: ['Aircraft and drone manufacturers', 'Technology and system providers', 'Operators and service providers', 'Universities and research institutions', 'Government agencies'],
            },
            {
                id: 'ways-to-participate',
                q: 'What are the ways to participate?',
                a: 'There are three ways to take part:',
                list: ['Join government-led trials: take part in structured trials with regulators and agencies', 'Test and demonstrate your technology: prove your aircraft, systems and operations in real airspace', 'Conduct research and innovation: run experiments and early-stage research with academic partners'],
            },
            {
                id: 'how-to-apply', popular: true,
                q: 'How do I apply?',
                a: 'It takes four steps from interest to execution:',
                list: ['1. Submit interest: send your Expression of Interest', '2. Define activity: outline your testing scope and objectives', '3. Review and approval: coordination and review with the relevant authorities', '4. Execute: conduct your testing within the sandbox'],
                links: [{ label: 'Apply to participate', href: routes.apply }],
            },
            {
                id: 'approval-needed',
                q: 'Do I need approval before testing?',
                a: 'Yes. Every activity goes through review and approval before it is executed. The sandbox coordinates with the Civil Aviation Authority of Malaysia (CAAM) and other agencies, from application to execution.',
            },
            {
                id: 'funding',
                q: 'Is funding available?',
                a: 'Support is offered to help participants get started with grant applications:',
                list: ['Funding opportunities for participants', 'Application guidance', 'Documentation review'],
            },
            {
                id: 'finding-partners',
                q: 'Can the sandbox help me find partners?',
                a: 'Yes. The sandbox gives you direct access to universities, research bodies, government agencies and local and international partners.',
                list: ['Matching with local partners', 'Access to research institutions', 'Joint testing with other participants and hosts'],
            },
        ],
    },
    {
        id: 'facilities',
        label: 'Facilities & testing',
        intro: 'What you can test and what is on site.',
        image: P + 'vertiport.jpg',
        items: [
            {
                id: 'what-can-i-test', popular: true,
                q: 'What can I test at the sandbox?',
                a: 'The sandbox supports:',
                list: ['Flight testing', 'Infrastructure validation', 'System integration', 'Operational trials', 'Commercial pilot projects'],
                links: [{ label: 'See the facilities', href: routes.siteInfo + '#facilities' }],
            },
            {
                id: 'facilities-on-site',
                q: 'What facilities are on site?',
                a: 'The site is built around a functional mock-up aerodrome with:',
                list: ['Vertiport', 'Test flight corridor', 'Drone hub', 'Research and maintenance facility', 'Flight simulator', 'Radar / communication system / UTMS'],
            },
            {
                id: 'participant-support',
                q: 'What do participants get access to?',
                a: 'Participants can use a ready test environment:',
                list: ['Access to sandbox test zones', 'Vertiport, landing area and staging', 'Power and charging support (if available)', 'Site logistics coordination'],
            },
            {
                id: 'bvlos',
                q: 'Can I test Beyond Visual Line of Sight (BVLOS)?',
                a: 'Yes. The sandbox includes a BVLOS corridor and supports safe and structured BVLOS flight testing in real-world conditions. Phase 1 starts with basic BVLOS operations, and Phase 2 expands operational corridors, long range validation and multi-platform testing.',
            },
            {
                id: 'flight-corridors',
                q: 'Are there flight corridors outside the site?',
                a: 'Two flight path corridors are planned:',
                list: ['East: from Sungai Batu Pahat to the Timah Tasoh Dam, through rivers and paddy fields', 'West: to Langkawi Island via Kuala Perlis and the sea'],
                links: [{ label: 'Airspace & operations', href: routes.siteInfo + '#airspace' }],
            },
            {
                id: 'training',
                q: 'Is training offered?',
                a: 'Yes. The sandbox runs training programs and has a training zone for pilot and operator development. Phase 2 adds a Training and Simulation Center with operator training facilities, an operation simulation center, multi-agency training and safety training.',
            },
        ],
    },
    {
        id: 'airspace',
        label: 'Airspace, safety & regulation',
        intro: 'How the airspace is organised and kept safe.',
        image: P + 'test-flight-corridor.jpg',
        items: [
            {
                id: 'controlled-airspace',
                q: 'Is the airspace controlled?',
                a: 'Yes. The sandbox offers a controlled but realistic environment: safe, secure and flexible airspace designed for innovation, with segmented altitude zones for different operational scenarios.',
            },
            {
                id: 'operating-areas',
                q: 'What operating areas are there?',
                a: 'Testing is organised into dedicated areas:',
                list: ['Test Zone A: payload and navigation testing', 'Test Zone B: long range and endurance validation', 'BVLOS corridor: Beyond Visual Line of Sight operations', 'Training zone: pilot and operator development'],
            },
            {
                id: 'regulator',
                q: 'Who regulates the sandbox?',
                a: 'The sandbox works in coordination with the Civil Aviation Authority of Malaysia (CAAM) and other agencies. A regulator interface and real-time airspace management are part of the sandbox operations.',
            },
            {
                id: 'operating-hours',
                q: 'What are the operating hours and general restrictions?',
                a: 'Operating hours and general restrictions have not been announced yet. They will be published on the Site information page.',
                links: [{ label: 'Site information', href: routes.siteInfo + '#airspace' }],
                tbc: true,
            },
            {
                id: 'safety-measures',
                q: 'What safety measures are in place?',
                a: 'Safety is built in from Phase 1:',
                list: ['An operational safety zone on site', 'Basic safety systems', 'Operational SOP development', 'A safety framework', 'Regulatory coordination', 'A governance framework'],
            },
            {
                id: 'regulation-data',
                q: 'How does the sandbox help shape regulation?',
                a: 'Controlled sandbox trials generate high-quality airspace and operational data that supports regulators and informs Malaysia’s regulatory framework. The sandbox also helps build Standard Operating Procedures and a safety framework for the industry.',
            },
        ],
    },
    {
        id: 'roadmap',
        label: 'Roadmap & updates',
        intro: 'Where the project is heading and where to follow it.',
        image: P + 'building-exterior.jpg',
        items: [
            {
                id: 'timeline', popular: true,
                q: 'What is the development timeline?',
                a: 'The roadmap has four phases:',
                list: ['Phase 1, Mid 2026 – Early 2027: foundation and initial operational setup', 'Phase 2, Mid 2027 – 2028: operational validation and ecosystem expansion', 'Phase 3, 2028 – 2029: advanced airspace ecosystem development', 'Phase 4, 2029 – 2030+: sustainability and future mobility integration'],
            },
            {
                id: 'phase-1',
                q: 'What happens in Phase 1?',
                a: 'Phase 1 lays the essential foundation, validates initial operations and builds the key building blocks for future expansion.',
                list: ['Site development: site preparation, initial operational area, access and basic utilities, operational safety zone', 'A basic command and control center', 'Initial communication infrastructure: telemetry and operational monitoring', 'Early demonstration flights and collection of initial operational data', 'Governance and regulatory alignment'],
            },
            {
                id: 'latest-news',
                q: 'Where can I find the latest news?',
                a: 'News, press releases, events, photos and videos are collected in the Media Centre.',
                links: [{ label: 'Media Centre', href: routes.media }],
            },
            {
                id: 'contact',
                q: 'How do I contact the team?',
                a: 'Contact details have not been published yet. In the meantime, send your Expression of Interest through the application steps, or follow updates in the Media Centre.',
                links: [{ label: 'Apply to participate', href: routes.apply }],
                tbc: true,
            },
        ],
    },
];

export const cta = {
    title: 'Still have a',
    titleEm: 'question?',
    text: 'Tell us what you want to test and we will guide you from interest to execution.',
};

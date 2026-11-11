/*
  ABOUT PAGE CONTENT  ->  resources/js/data/PSB-data/aboutData.js
  Edit this file only. Every section renders itself from the data below.
  Images are file names inside resources/js/images/about/ (missing files show a labelled placeholder).
  A block or section with no items is hidden automatically, so you can leave awards/fellows empty until ready.

  Titles: wrap words in *stars* to make them accent words, e.g. 'Why *Perlis*.'
  Section options: align: 'center' | 'split' (default), eyebrow: small label above the title
  Tone: 'dark' (black) | 'graphite' (soft black) | 'yellow'

  Block types:
    collage  items: { kind:'stat', n, unit, label, span, off } | { kind:'img', file, alt, ratio, span, off }
    marquee  items: [{ file, alt }]  (auto-scrolling photo strip; reverse:true, speed:seconds)
    full     file, alt, kicker, caption   (full-bleed parallax photo)
    hscroll  items: [{ title, tag, text, file }]  (draggable cards)
    stats | gallery | defs | image | pairs | tabs | grid | tags | people | logos | cta (cta also takes word)
*/

const about = {
    sections: [
        {
            group: 'Perlis Airspace Sandbox', id: 'overview', nav: 'Overview', tone: 'dark', align: 'center',
            eyebrow: 'About the sandbox',
            title: 'Malaysia’s first dedicated *low-altitude* airspace testing facility.',
            lead: 'The Perlis Airspace Sandbox is a national initiative for Urban Air Mobility innovation, in Sungai Batu Pahat, Perlis.',
            blocks: [
                {
                    type: 'collage', items: [
                        { kind: 'stat', n: 30, unit: 'ha', label: 'Sandbox facility (approx.)', span: 3 },
                        { kind: 'img', file: 'building-exterior.jpg', alt: 'Main building, architect render', ratio: '4 / 5', span: 3, off: '-48px' },
                        { kind: 'img', file: 'hangar-interior.jpg', alt: 'Hangar interior, architect render', ratio: '4 / 3', span: 3, off: '40px' },
                        { kind: 'stat', n: 19.7, unit: 'ha', label: 'Mango Farm site (PKENPs)', span: 3, off: '-20px' },
                        { kind: 'img', file: 'collage-drone-flight.jpg', alt: 'Drone in flight over the site', ratio: '4 / 3', span: 3 },
                        { kind: 'stat', n: 2.9, unit: 'ha', label: 'Phase 1 development area', span: 3, off: '-24px' },
                        { kind: 'img', file: 'building-entrance.jpg', alt: 'Entrance and gate, architect render', ratio: '4 / 3', span: 3, off: '20px' },
                        { kind: 'stat', n: 2, unit: '', label: 'Planned flight corridors', span: 3, off: '-8px' },
                    ],
                },
                {
                    type: 'defs', items: [
                        ['What it is', 'A controlled testing environment where industry, researchers and government agencies safely test and validate aircraft, operations and infrastructure, in coordination with the relevant authorities.'],
                        ['Objective', 'To speed up Advanced Air Mobility through one structured platform for testing, regulatory validation, operational development and ecosystem collaboration, with safety, compliance and scalability built in.'],
                    ],
                },
                { type: 'full', file: 'overview-aerial.jpg', alt: 'Aerial view of the sandbox site', kicker: 'Sungai Batu Pahat', caption: 'Where Malaysia’s low-altitude future gets proven.' },
            ],
        },
        {
            group: 'Perlis Airspace Sandbox', id: 'need', nav: 'Why it exists', tone: 'graphite',
            eyebrow: 'The need',
            title: 'Technology is ready. The *testing ground* is not.',
            lead: 'Malaysia already has drone innovation, but too few places to prove it in real conditions. The sandbox closes five gaps.',
            aside: [{
                type: 'defs', title: 'Why low altitude matters', items: [
                    ['Roads', 'connected cities.'],
                    ['The internet', 'connects people.'],
                    ['Low-altitude airspace', 'connects the future, as a new economic layer.'],
                ],
            }],
            blocks: [
                {
                    type: 'pairs', head: ['The gap', 'What the sandbox provides'], items: [
                        ['Many drone technologies exist', 'Innovation is happening, but it stays at prototype stage.', 'A real testing environment', 'Real-world conditions, not just a lab.'],
                        ['Limited real-world testing space', 'Not enough room to test and prove.', 'Safe, controlled operational space', 'A secure airspace to test, learn and improve.'],
                        ['A gap between research and deployment', 'Prototypes stay prototypes.', 'A platform for BVLOS validation', 'Beyond Visual Line of Sight needs real data, not just simulation.'],
                        ['Industry lacks a validation platform', 'Hard to validate, hard to scale.', 'A training and competency ecosystem', 'Skilled, certified people are the backbone of the industry.'],
                        ['Regulators need real operational data', 'Policy needs real operational evidence.', 'Academia, industry and government together', 'Working together to build a sustainable ecosystem.'],
                    ],
                },
                {
                    type: 'marquee', speed: 55, ratio: '16 / 10', items: [
                        { file: 'need-1.jpg', alt: 'Drone prototype on a test bench' },
                        { file: 'need-2.jpg', alt: 'Operator at a ground control station' },
                        { file: 'need-3.jpg', alt: 'Drone over paddy fields' },
                        { file: 'need-4.jpg', alt: 'Engineers reviewing flight data' },
                        { file: 'need-5.jpg', alt: 'Cargo drone taking off' },
                    ],
                },
            ],
        },
        {
            group: 'Perlis Airspace Sandbox', id: 'mission', nav: 'Mission', tone: 'yellow',
            eyebrow: 'Core mission',
            title: 'What we *do* in the sandbox.',
            lead: 'Build a complete ecosystem for drone research and development, centred on a safe, controlled and fully functional mock-up aerodrome, where drone technology, next-generation aerial mobility and Unmanned Traffic Management (UTM) systems are tested and validated.',
            aside: [{
                type: 'defs', title: 'Objectives', items: [
                    ['A national ecosystem for secure drone R&D', 'New drone technologies are researched, developed and proven in real operating conditions.'],
                    ['Build talent and collaboration', 'Skills development, public engagement and collaborative R&D.'],
                    ['Test-based operational guidelines', 'Real-world feedback that improves drone operating standards.'],
                ],
            }],
            blocks: [
                {
                    type: 'tabs', items: [
                        { tab: 'BVLOS flight testing', file: 'mission-bvlos.jpg', title: 'BVLOS flight testing', text: 'Conduct safe, structured Beyond Visual Line of Sight flights in real-world conditions.' },
                        { tab: 'Technology validation', file: 'mission-validation.jpg', title: 'Technology validation', text: 'Validate systems, payloads, communications and sense-and-avoid technologies.' },
                        { tab: 'Operational testing', file: 'mission-operations.jpg', title: 'Operational testing (real missions)', text: 'Simulate real missions and use cases to prove operational feasibility and reliability.' },
                        { tab: 'Training and certification', file: 'mission-training.jpg', title: 'Training and certification', text: 'Develop skilled operators through structured training and certification programmes.' },
                        { tab: 'Data for regulators', file: 'mission-data.jpg', title: 'Data collection for regulators', text: 'Generate high-quality airspace and operational data to support regulators.' },
                        { tab: 'SOP and safety framework', file: 'mission-sop.jpg', title: 'SOP and safety framework', text: 'Build standard operating procedures and a safety framework for the industry.' },
                    ],
                },
            ],
        },
        {
            group: 'Perlis Airspace Sandbox', id: 'facilities', nav: 'Facilities', tone: 'dark',
            eyebrow: 'Facilities',
            title: 'A functional *mock-up* aerodrome.',
            aside: [
                { type: 'tags', title: 'Infrastructure', items: ['Dedicated low-altitude test range', 'Altitude zones for different operating scenarios', 'Purpose-built vertiports for take-off and landing', 'Autonomous charging stations', 'Maintenance facilities'] },
                { type: 'tags', title: 'Talent and collaboration', items: ['Partnerships with government, industry and academia', 'Training programmes', 'Public demonstrations', 'Joint R&D initiatives'] },
            ],
            blocks: [
                {
                    type: 'tabs', items: [
                        { tab: 'Vertiport', file: 'vertiport.jpg', title: 'Vertiport', text: 'Purpose-built pads for take-off and landing of drones and future eVTOL aircraft.' },
                        { tab: 'Test flight corridor', file: 'test-flight-corridor.jpg', title: 'Test flight corridor', text: 'A dedicated low-altitude range with altitude zones for different operating scenarios.' },
                        { tab: 'Drone hub', file: 'drone-hub.jpg', title: 'Drone hub', text: 'Staging, charging and dispatch for drone fleets and cargo missions.' },
                        { tab: 'Research and maintenance', file: 'research-maintenance.jpg', title: 'Research and maintenance facility', text: 'Workshops for building, testing and maintaining unmanned aircraft.' },
                        { tab: 'Flight simulator', file: 'flight-simulator.jpg', title: 'Flight simulator', text: 'Operator training and mission rehearsal before real flights.' },
                        { tab: 'Radar, comms and UTMS', file: 'radar-utms.jpg', title: 'Radar, communication system and UTMS', text: 'Surveillance, communication links and Unmanned Traffic Management for the whole airspace.' },
                        { tab: 'Main building', file: 'hangar-interior.jpg', title: 'Phase 1 main building', text: 'The hangar and operations building planned for Phase 1 (architect render).' },
                    ],
                },
            ],
        },
        {
            group: 'Perlis Airspace Sandbox', id: 'applications', nav: 'Applications', tone: 'graphite',
            eyebrow: 'Applications',
            title: 'One airspace, six *national* applications.',
            lead: 'Shared airspace, multiple missions, real data for real decisions, in a safe and controlled environment.',
            blocks: [{
                type: 'hscroll', items: [
                    { title: 'Security and surveillance', file: 'app-security.jpg', text: 'Real-time monitoring for border security, critical areas and situational awareness.', tag: 'Faster detection. Stronger response.' },
                    { title: 'Logistics and delivery', file: 'app-logistics.jpg', text: 'Autonomous delivery of medicines and essentials, including to remote communities.', tag: 'Smarter logistics. Better connectivity.' },
                    { title: 'Agriculture monitoring', file: 'app-agriculture.jpg', text: 'Precision agriculture through crop health analysis, livestock monitoring and smart farm insights.', tag: 'Higher yield. Sustainable future.' },
                    { title: 'Disaster response', file: 'app-disaster.jpg', text: 'Rapid assessment, search and rescue and emergency support when every second counts.', tag: 'Quick action. Saves lives.' },
                    { title: 'Infrastructure inspection', file: 'app-inspection.jpg', text: 'Safer, more efficient inspection of towers, bridges, pipelines and critical infrastructure.', tag: 'Safer inspections. Lower risk and cost.' },
                    { title: 'Advanced Air Mobility (AAM)', file: 'app-aam.jpg', text: 'Enabling future air taxi operations and regional aerial mobility for smart, connected cities.', tag: 'Future mobility. Connecting people.' },
                ],
            }],
        },
        {
            group: 'Perlis Airspace Sandbox', id: 'perlis', nav: 'Why Perlis', tone: 'yellow',
            eyebrow: 'Location',
            title: 'Why *Perlis.*',
            lead: 'A strategic environment for future low-altitude innovation: positioned in the northern corridor, with vast, less congested airspace.',
            aside: [{
                type: 'defs', items: [
                    ['Open airspace', 'More space, more possibilities.'],
                    ['Flexible corridors', 'Customisable routes and volumes for BVLOS testing and operations.'],
                    ['Connectivity and accessibility', 'Well connected to infrastructure, universities and innovation partners.'],
                    ['Natural advantage', 'Geography and terrain that support safe testing and operations.'],
                ],
            }],
            blocks: [
                { type: 'full', file: 'perlis-overview.jpg', alt: 'Perlis, aerial view', kicker: 'Perlis', caption: 'Open skies in Malaysia’s northern corridor.' },
                {
                    type: 'grid', cols: 3, items: [
                        { title: 'Low population density', text: 'Minimal impact on daily life and communities. Ideal for safe testing and operations.' },
                        { title: 'Less airspace congestion', text: 'Fewer restrictions, simpler approvals and more flexible operations.' },
                        { title: 'Suitable terrain for testing', text: 'A diverse landscape supporting multiple use cases and scenarios.' },
                        { title: 'Safe and controlled environment', text: 'Lower-risk setting for testing, validation and training.' },
                        { title: 'Potential new tech hub', text: 'Catalysing economic growth, jobs, investment and regional development.' },
                    ],
                },
            ],
        },
        {
            group: 'Perlis Airspace Sandbox', id: 'site', nav: 'Site and corridors', tone: 'dark',
            eyebrow: 'Site and corridors',
            title: 'The site and its *planned* corridors.',
            aside: [{
                type: 'defs', items: [
                    ['Location', 'Sungai Batu Pahat Mango Farm (PKENPs), Perlis, beside the COE-UAS and Boomslang runway.'],
                    ['Site size', '19.7 ha in total, with a 2.9 ha proposed Phase 1 development area.'],
                    ['Corridors', 'East to Timah Tasoh Dam, and west to Langkawi Island via Kuala Perlis.'],
                ],
            }],
            blocks: [{
                type: 'tabs', items: [
                    { group: 'Site', tab: 'Project site', file: 'project-site.jpg', text: 'The sandbox site in Perlis, marked in red.' },
                    { group: 'Site', tab: 'Site and runway', file: 'site-aerial.jpg', text: 'The sandbox site area in Sungai Batu Pahat, which also contains the runway that will be upgraded.' },
                    { group: 'Site', tab: 'Mango farm, 19.7 ha', file: 'mango-farm-site.jpg', text: 'The proposed development area at Sungai Batu Pahat Mango Farm, with the Phase 1 area outlined.' },
                    { group: 'Site', tab: 'Phase 1 area, 2.9 ha', file: 'phase1-area.jpg', text: 'The proposed Phase 1 development area.' },
                    { group: 'Site', tab: 'Ground photos', file: 'site-photos.jpg', text: 'The Phase 1 area photographed from four directions.' },
                    { group: 'Site', tab: 'Phase 1 plan', file: 'site-plan.jpg', text: 'Architect’s concept: guard house, main building, EV parking, parking, motorcycle parking, helipad, vertiport and lake.' },
                    { group: 'Corridors', tab: 'East to Timah Tasoh', file: 'corridor-east-1.jpg', text: 'From the sandbox heading east, a flight path corridor will lead to Timah Tasoh Dam through rivers and paddy fields.' },
                    { group: 'Corridors', tab: 'East: the loop', file: 'corridor-east-2.jpg', text: 'The corridor heads toward Timah Tasoh Dam and turns back toward Sungai Batu Pahat.' },
                    { group: 'Corridors', tab: 'West to Langkawi', file: 'corridor-west-1.jpg', text: 'The corridor heads toward Kuala Perlis and on to Langkawi Island via the upper river area and paddy fields.' },
                    { group: 'Corridors', tab: 'West: overview', file: 'corridor-west-2.jpg', text: 'An overall picture of the corridor heading west to Langkawi Island via the Kuala Perlis sea.' },
                ],
            }],
        },
        {
            group: 'Perlis Airspace Sandbox', id: 'roadmap', nav: 'Roadmap', tone: 'graphite',
            eyebrow: 'Roadmap',
            title: 'Development roadmap, *2026 to 2030+.*',
            aside: [
                { type: 'tags', title: 'Strategic enablers', items: ['Infrastructure readiness', 'Regulatory alignment', 'Technology maturity', 'Industry participation', 'Investment growth'] },
                {
                    type: 'defs', title: 'Long-term vision', items: [
                        ['Future mobility', 'AAM, eVTOL, autonomous mobility.'],
                        ['Autonomous airspace', 'Safe, smart, connected, scalable.'],
                        ['Digital airspace management', 'UTM, U-DEF, AI, automation.'],
                        ['High-tech industry growth', 'Innovation, startups, R&D, commercialisation.'],
                        ['Low altitude economy', 'Jobs, investment, productivity, national growth.'],
                    ],
                },
            ],
            blocks: [
                {
                    type: 'tabs', items: [
                        {
                            tab: 'Phase 1', file: 'phase-1.jpg', meta: 'Mid 2026 – Early 2027', title: 'Foundation and initial operational setup',
                            text: 'Establish the core operational, technological and governance foundation for safe, controlled low-altitude airspace operations.',
                            groups: [
                                { title: 'Site development', items: ['Site preparation', 'Initial operational area', 'Access and basic utilities', 'Operational safety zone'] },
                                { title: 'Command and control centre (basic)', items: ['Initial operations control', 'Basic communication systems', 'Operational monitoring', 'Initial flight operations management'] },
                                { title: 'Communication infrastructure', items: ['Operational communication', 'Telemetry support', 'Monitoring infrastructure', 'Initial surveillance capability'] },
                                { title: 'Initial operations', items: ['Early demonstration flights', 'Basic operation validation', 'Basic BVLOS operations', 'Initial operational data'] },
                                { title: 'Governance and regulatory alignment', items: ['Operational SOP development', 'Safety framework', 'Regulatory coordination', 'Governance framework'] },
                            ],
                            outcomes: ['Initial operational capability', 'Basic operational infrastructure', 'Basic safety systems', 'Early validation platform', 'Foundation for ecosystem development'],
                        },
                        {
                            tab: 'Phase 2', file: 'phase-2.jpg', meta: 'Mid 2027 – 2028', title: 'Operational validation and ecosystem expansion',
                            text: 'Build a safe, scalable and resilient airspace ecosystem that speeds up innovation, drives economic growth and positions Malaysia as a regional leader in Urban Air Mobility.',
                            groups: [
                                { title: 'UTM system development', items: ['Digital airspace management', 'Flight authorisation', 'Operational monitoring', 'Traffic coordination'] },
                                { title: 'BVLOS operation expansion', items: ['Operational corridors', 'Long-range validation', 'Multi-platform testing'] },
                                { title: 'Training and simulation centre', items: ['Operator training facilities', 'Operation simulation centre', 'Multi-agency training', 'Safety training'] },
                                { title: 'Safety and security enhancement', items: ['Surveillance enhancement', 'Emergency response systems', 'Safety monitoring', 'Compliance monitoring'] },
                                { title: 'Industry and startup ecosystem', items: ['Technology demonstration', 'Startup acceleration', 'Commercialisation support', 'Industry collaboration'] },
                            ],
                            outcomes: ['Mature BVLOS operations at scale', 'Proven safety and security framework', 'Stronger ecosystem and industry participation', 'Multi-stakeholder partnerships', 'Global recognition in UAM innovation'],
                        },
                        {
                            tab: 'Phase 3', file: 'phase-3.jpg', meta: '2028 – 2029', title: 'Advanced airspace ecosystem development',
                            groups: [
                                { title: 'Advanced digital airspace management', items: ['Advanced airspace management', 'Data integration platform', 'Advanced surveillance system', 'Autonomous operation management'] },
                                { title: 'Future air mobility demonstration', items: ['AAM operation simulation', 'Vertiport demonstration', 'eVTOL integration studies', 'Future mobility simulation'] },
                                { title: 'Operation corridor expansion', items: ['Autonomous maritime operations', 'Aerial logistics operations', 'Inter-zone operations', 'Long-range operations'] },
                                { title: 'R&D and international collaboration', items: ['International collaboration', 'Joint technology development', 'Global benchmarking', 'Advanced validation activities'] },
                            ],
                            outcomes: ['National validation platform', 'AAM demonstration hub', 'Advanced autonomous operations', 'Global R&D collaboration'],
                        },
                        {
                            tab: 'Phase 4', file: 'phase-4.jpg', meta: '2029 – 2030+', title: 'Sustainability and future mobility integration',
                            groups: [
                                { title: 'Sustainable operations', items: ['Commercial and business model', 'Financial sustainability', 'Operational efficiency'] },
                                { title: 'Smart airspace integration', items: ['Integration with national systems', 'Smart city and smart logistics', 'Data-driven operations'] },
                                { title: 'Regional collaboration (ASEAN)', items: ['ASEAN sandbox collaboration', 'Regional interoperability', 'Cross-border operations'] },
                                { title: 'Global partnerships', items: ['International technology partners', 'Global validation network', 'Strategic investments'] },
                            ],
                            outcomes: ['Regional low-altitude airspace hub', 'International validation centre', 'Sustainable future mobility ecosystem', 'Economic and industry growth'],
                        },
                    ],
                },
            ],
        },
        {
            id: 'awards', nav: 'Awards', tone: 'yellow',
            eyebrow: 'Recognition',
            title: 'Awards and *accreditation.*',
            lead: 'Recognition and certificates received by the Perlis Airspace Sandbox. Replace each slot with a real award.',
            blocks: [{
                type: 'people', ratio: '4 / 3', items: [
                    { name: 'Award name', role: 'Awarded by, year', file: 'award-1.jpg' },
                    { name: 'Award name', role: 'Awarded by, year', file: 'award-2.jpg' },
                    { name: 'Award name', role: 'Awarded by, year', file: 'award-3.jpg' },
                ],
            }],
        },
        {
            id: 'team', nav: 'Research team', tone: 'dark',
            eyebrow: 'The people',
            title: 'Research *team.*',
            lead: 'UniMAP is uniquely positioned to lead the low-altitude economy, through research excellence, industry partnerships and a real-world focus.',
            aside: [{
                type: 'grid', cols: 1, items: [
                    { title: 'Strong experience in UAS research', text: 'Years of focused research in UAS technologies, systems and applications.' },
                    { title: 'Proven track record in drone development', text: 'Multiple UAV platforms and systems developed for real-world use.' },
                    { title: 'Focus on real-world implementation', text: 'From research to operations, bridging the gap to real impact.' },
                ],
            }],
            blocks: [{
                type: 'people', items: [
                    { name: 'Prof. Ir. Ts. Dr. Hazry bin Haji Desa', role: 'Centre of Excellence for Unmanned Aerial Systems (COE-UAS), Universiti Malaysia Perlis', file: 'team-hazry.jpg' },
                    { name: 'Team member name', role: 'Role, institution', file: 'team-2.jpg' },
                    { name: 'Team member name', role: 'Role, institution', file: 'team-3.jpg' },
                    { name: 'Team member name', role: 'Role, institution', file: 'team-4.jpg' },
                ],
            }],
        },
        {
            id: 'visiting', nav: 'Visiting research fellows', tone: 'graphite',
            eyebrow: 'The people',
            title: 'Visiting research *fellows.*',
            lead: 'Researchers from partner universities and institutes who work with the sandbox.',
            blocks: [{ type: 'people', items: [
                { name: 'Fellow name', role: 'Institution, country', file: 'visiting-1.jpg' },
                { name: 'Fellow name', role: 'Institution, country', file: 'visiting-2.jpg' },
                { name: 'Fellow name', role: 'Institution, country', file: 'visiting-3.jpg' },
            ] }],
        },
        {
            id: 'advisory', nav: 'Industry advisory fellows', tone: 'dark',
            eyebrow: 'The people',
            title: 'Industry advisory *fellows.*',
            lead: 'Industry leaders who guide the sandbox on technology, operations and commercial direction.',
            blocks: [{ type: 'people', items: [
                { name: 'Fellow name', role: 'Company, position', file: 'advisory-1.jpg' },
                { name: 'Fellow name', role: 'Company, position', file: 'advisory-2.jpg' },
                { name: 'Fellow name', role: 'Company, position', file: 'advisory-3.jpg' },
            ] }],
        },
        {
            id: 'advisors', nav: 'Advisors', tone: 'graphite',
            eyebrow: 'The people',
            title: '*Advisors.*',
            lead: 'Senior advisors supporting policy, safety and strategy.',
            blocks: [{ type: 'people', items: [
                { name: 'Advisor name', role: 'Organisation, position', file: 'advisor-1.jpg' },
                { name: 'Advisor name', role: 'Organisation, position', file: 'advisor-2.jpg' },
                { name: 'Advisor name', role: 'Organisation, position', file: 'advisor-3.jpg' },
            ] }],
        },
        {
            id: 'partners', nav: 'Strategic partners', tone: 'yellow',
            eyebrow: 'Partners',
            title: 'Strategic *partners.*',
            lead: 'No single entity can do this alone. A collaborative ecosystem is the key to Malaysia’s low-altitude future.',
            blocks: [
                {
                    type: 'grid', cols: 3, items: [
                        { title: 'University', tag: 'Research, talent and innovation', text: 'We create knowledge and future talent.' },
                        { title: 'Industry', tag: 'Deployment and commercialisation', text: 'We turn innovation into real solutions and market value.' },
                        { title: 'Government', tag: 'National coordination and support', text: 'We provide policy, funding and national direction.' },
                        { title: 'Agencies', tag: 'Real operational use cases', text: 'We are the real users, driving real-world impact.' },
                        { title: 'Regulator', tag: 'Safety, governance and compliance', text: 'We ensure safety, trust and responsible growth.' },
                    ],
                },
                {
                    type: 'logos', groups: [
                        { title: 'Supported by', items: ['UniMAP', 'MRANTI', 'NAICO', 'MIGHT', 'CAAM', 'MOF'] },
                        { title: 'Managed and designed by', items: ['Vertiport Malaysia', 'Araken'] },
                        { title: 'Collaborators', items: ['EHANG', 'TCAB', 'MHS Aviation'] },
                        { title: 'Also credited', items: ['FUTURISE', 'MCMC', 'STRIDE', 'SIRIM'] },
                    ],
                },
            ],
        },
        {
            id: 'join', tone: 'dark', align: 'center',
            eyebrow: 'Join the sandbox',
            title: 'Have a *technology* to test?',
            blocks: [{ type: 'cta', text: 'Submit your Expression of Interest and test in Malaysia’s first structured, real-world low-altitude airspace environment.', label: 'Apply to participate', href: '/#join', word: 'Perlis' }],
        },
    ],
};

export default about;

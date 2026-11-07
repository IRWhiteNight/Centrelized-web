/* ==========================================================================
   INNOVATION PAGE — CONTENT FILE
   --------------------------------------------------------------------------
   Every word, number and link on the Innovation page lives in THIS file.
   You never need to touch Innovation.jsx to change content.

   HOW TO UPDATE
   • UPDATE  → change the text inside the quotes.
   • ADD     → copy one whole { ... }, block (keep the comma), paste it right
               after, then edit it. The page builds itself from the list.
   • REMOVE  → delete the whole { ... }, block.
   • REORDER → move a block up or down.

   Rules: keep the quotes ' ' around text, keep the commas between items.
   If a text contains an apostrophe use double quotes: "Malaysia's first".
   Sources: UniMAP poster, "The Skyway of the Future" deck, Sandbox Website.xlsx,
   AAM Industry Report (Futurise & MIGHT).
   ========================================================================== */

/* ---------- Page-wide settings (links & section menu) ---------- */

export const links = {
    apply: '/contact',                 // every "Apply to participate" button
    services: '/services',             // "See our services"
    sandbox: '/aam-sandbox-perlis',    // "About the sandbox"
};

/* The sticky menu under the hero. `id` must match a section that exists. */
export const sections = [
    { id: 'overview', label: 'Overview' },
    { id: 'facilities', label: 'Facilities' },
    { id: 'framework', label: 'Framework' },
    { id: 'applications', label: 'Applications' },
    { id: 'roadmap', label: 'Roadmap' },
    { id: 'projects', label: 'Projects' },
    { id: 'testing', label: 'Test plans' },
    { id: 'impact', label: 'Impact' },
    { id: 'participate', label: 'Participate' },
];

/* ---------- Hero ---------- */

export const hero = {
    eyebrow: 'Innovation · Perlis Airspace Sandbox',
    titleLines: ['The next', 'infrastructure', 'is in the sky.'],
    highlight: 'is in the sky.',          // the line shown in yellow
    lede: "Malaysia's first dedicated low-altitude airspace testing facility, where drones, air taxis and the airspace that connects them are proven in the real world.",
    primaryButton: 'Apply to participate',
    secondaryButton: 'Explore the sandbox',
    mapLabel: 'Schematic flight corridors, not to scale',
};

/* Numbers under the hero. value = number only; prefix/suffix are optional. */
export const heroStats = [
    { value: 30, suffix: ' ha', label: 'Dedicated test site in Sungai Batu Pahat' },
    { value: 6, label: 'Core sandbox activities' },
    { value: 4, label: 'Roadmap phases to 2030+' },
    { value: 2, label: 'Planned flight corridors' },
];

/* Scrolling word strip */
export const ticker = [
    'Flight testing', 'BVLOS', 'UTM', 'Vertiport', 'eVTOL', 'Drone logistics',
    'Autonomous airspace', 'Low-altitude economy', 'Regulatory validation', 'Training & certification',
];

/* ---------- 01 Overview ---------- */

export const overview = {
    heading: 'Why a sandbox, and why now?',
    lede: 'Low-altitude airspace is opening up. New technology needs a safe, real place to prove itself before it scales.',
    layers: [
        { label: 'Roads', text: 'connect cities', note: 'Past' },
        { label: 'Internet', text: 'connects people', note: 'Present' },
        { label: 'Airspace', text: 'connects the future', note: 'Future', highlight: true },
    ],
    tagline: 'Low-altitude airspace = a new economic layer',

    missionTitle: 'Core mission',
    mission: 'Develop a complete ecosystem for drone research and development, centred on a safe and controlled, fully functional mock-up aerodrome. A place for real-world testing and validation of new systems, procedures and technology, including drones, next-generation aerial mobility and Unmanned Traffic Management (UTM).',

    objectivesTitle: 'Objectives',
    objectives: [
        { title: 'A national ecosystem for secure drone R&D', text: 'A complete setting where new drone technologies are safely researched, developed and proven in real operating conditions.' },
        { title: 'Build talent and collaboration', text: 'Advance drone research through skills development, public engagement and collaborative R&D.' },
        { title: 'Test-based feedback for operational guidelines', text: 'Real-world feedback that improves drone operational standards and regulation.' },
    ],

    gapsTitle: 'What the ecosystem has been missing',
    gaps: [
        'A real testing environment',
        'A safe and controlled operational space',
        'A platform for BVLOS validation',
        'A training and competency ecosystem',
        'Collaboration between academia, industry and government',
    ],

    perlisTitle: 'Why Perlis',
    perlis: [
        { title: 'Low population density', text: 'Minimal impact on daily life. Ideal for safe testing.' },
        { title: 'Less airspace congestion', text: 'Fewer restrictions and more flexible operations.' },
        { title: 'Suitable terrain', text: 'Diverse landscape supporting many use cases.' },
        { title: 'Safe, controlled environment', text: 'Lower-risk setting for testing, validation and training.' },
        { title: 'A new tech hub', text: 'Catalysing growth, jobs, investment and regional development.' },
    ],
};

/* ---------- 02 Facilities ---------- */
/* pos = marker position on the site plan: x 0–100 (left→right), y 0–64 (top→bottom) */

export const facilities = {
    heading: 'The UniMAP Airspace Sandbox',
    lede: 'About 30 hectares in Sungai Batu Pahat, Perlis. Tap a facility to find it on the site plan.',
    planCaption: 'Illustrative site plan, not to scale',
    items: [
        { id: 'vertiport', title: 'Vertiport', text: 'Purpose-built vertiports for take-off and landing, with autonomous charging stations.', pos: { x: 24, y: 20 } },
        { id: 'corridor', title: 'Test flight corridor', text: 'A dedicated low-altitude test range with segmented altitude zones for different operational scenarios.', pos: { x: 86, y: 14 } },
        { id: 'drone-hub', title: 'Drone hub', text: 'The base for drone research, development and day-to-day operations on site.', pos: { x: 66, y: 28 } },
        { id: 'research', title: 'Research & maintenance facility', text: 'Workshops and maintenance facilities that keep test aircraft flying and support joint R&D.', pos: { x: 22, y: 46 } },
        { id: 'simulator', title: 'Flight simulator', text: 'Simulation for operator training and rehearsing procedures before they are flown for real.', pos: { x: 44, y: 52 } },
        { id: 'radar', title: 'Radar / communication system / UTMS', text: 'Surveillance, communication and Unmanned Traffic Management for monitored, coordinated flights.', pos: { x: 76, y: 50 } },
        { id: 'aerodrome', title: 'Functional mock-up aerodrome', text: 'A fully functional mock-up aerodrome: the safe, controlled core where new systems and procedures are validated.', pos: { x: 50, y: 34 } },
    ],
    featuresTitle: 'Key features',
    features: [
        { title: 'Infrastructure development', points: ['Dedicated low-altitude test range', 'Segmented altitude zones for different operational scenarios', 'Purpose-built vertiports for take-off and landing', 'Autonomous charging stations', 'Maintenance facilities'] },
        { title: 'Talent development and collaboration', points: ['Partnerships with government agencies, industry and academia', 'Training programmes', 'Public demonstrations', 'Joint R&D initiatives'] },
    ],
};

/* ---------- 03 Framework (six pillars) ---------- */

export const framework = {
    heading: 'Six pillars of development',
    lede: 'In the sandbox we turn innovation into real impact: real-world operations, testing and ecosystem validation.',
    pillars: [
        { title: 'BVLOS flight testing', text: 'Conduct safe, structured Beyond Visual Line of Sight flights in real-world conditions.' },
        { title: 'Technology validation', text: 'Validate systems, payloads, communications and sense-and-avoid technologies.' },
        { title: 'Operational testing', text: 'Simulate real missions and use cases to prove operational feasibility and reliability.' },
        { title: 'Training and certification', text: 'Develop skilled operators through structured training and certification programmes.' },
        { title: 'Data for regulators', text: 'Generate high-quality airspace and operational data to support regulators.' },
        { title: 'SOP and safety framework', text: 'Build Standard Operating Procedures and a safety framework for the industry.' },
    ],
};

/* ---------- 04 Applications ---------- */

export const applications = {
    heading: 'One ecosystem. Many national applications.',
    lede: 'Shared airspace, multiple missions, real data, real decisions. Safe, secure and controlled.',
    items: [
        { title: 'Security & surveillance', text: 'Real-time monitoring for border security, critical areas and situational awareness.', outcome: 'Faster detection. Stronger response.' },
        { title: 'Logistics & delivery', text: 'Autonomous delivery solutions for medicines, essentials and remote communities.', outcome: 'Smarter logistics. Better connectivity.' },
        { title: 'Agriculture monitoring', text: 'Precision agriculture through crop health analysis, livestock monitoring and smart farm insights.', outcome: 'Higher yield. Sustainable future.' },
        { title: 'Disaster response', text: 'Rapid assessment, search & rescue and emergency support when every second counts.', outcome: 'Quick action. Saves lives.' },
        { title: 'Infrastructure inspection', text: 'Safer, more efficient inspection of towers, bridges, pipelines and critical infrastructure.', outcome: 'Safer inspections. Lower risks. Lower costs.' },
        { title: 'Advanced Air Mobility', text: 'Enabling future air taxi operations and regional aerial mobility for smart, connected cities.', outcome: 'Future mobility. Connecting people.' },
    ],
};

/* ---------- 05 Roadmap ---------- */

export const roadmap = {
    heading: 'Development implementation roadmap',
    lede: "A progressive journey towards Malaysia's low-altitude airspace ecosystem.",
    phases: [
        {
            short: 'Foundation and initial operational setup',
            title: 'Foundation and initial operational setup',
            when: 'Mid 2026 – Early 2027',
            summary: 'Lay the essential foundation, validate initial operations and build the key building blocks for future expansion.',
            components: [
                { title: 'Site development', points: ['Site preparation', 'Initial operational area', 'Access and basic utilities', 'Operational safety zone'] },
                { title: 'Command & control centre (basic)', points: ['Initial operations control', 'Basic communication systems', 'Operational monitoring', 'Initial flight operations management'] },
                { title: 'Communication infrastructure (initial)', points: ['Operational communication', 'Telemetry support', 'Operational monitoring infrastructure', 'Initial surveillance capability'] },
                { title: 'Initial operations', points: ['Early demonstration flights', 'Basic operation validation', 'Basic BVLOS operations', 'Collection of initial operational data'] },
                { title: 'Governance & regulatory alignment', points: ['Operational SOP development', 'Safety framework', 'Regulatory coordination', 'Governance framework'] },
            ],
            outcomes: ['Initial operational capability', 'Basic operational infrastructure', 'Basic safety systems', 'Early validation platform', 'Foundation for ecosystem development'],
        },
        {
            short: 'Operational validation and ecosystem expansion',
            title: 'Operational validation and ecosystem expansion',
            when: 'Mid 2027 – 2028',
            summary: 'Build a safe, scalable and resilient airspace ecosystem that accelerates innovation and drives economic growth.',
            components: [
                { title: 'UTM system development', points: ['Digital airspace management', 'Flight authorisation', 'Operational monitoring', 'Traffic coordination'] },
                { title: 'BVLOS operation expansion', points: ['Operational corridors', 'Long-range validation', 'Multi-platform testing'] },
                { title: 'Training and simulation centre', points: ['Operator training facilities', 'Operation simulation centre', 'Multi-agency training', 'Safety training'] },
                { title: 'Safety and security enhancement', points: ['Surveillance enhancement', 'Emergency response systems', 'Safety monitoring', 'Compliance monitoring'] },
                { title: 'Industry & startup ecosystem', points: ['Technology demonstration', 'Startup acceleration', 'Commercialisation support', 'Industry collaboration'] },
            ],
            outcomes: ['Mature BVLOS operations at scale', 'Proven safety and security framework', 'Stronger ecosystem and industry participation', 'Multi-stakeholder collaboration and partnerships', 'Global recognition in UAM innovation'],
        },
        {
            short: 'Advanced airspace ecosystem development',
            title: 'Advanced airspace ecosystem development',
            when: '2028 – 2029',
            summary: 'Move from validated operations to advanced, connected and autonomous airspace.',
            components: [
                { title: 'Advanced digital airspace management', points: ['Advanced airspace management', 'Data integration platform', 'Advanced surveillance system', 'Autonomous operation management'] },
                { title: 'Future air mobility demonstration', points: ['AAM operation simulation', 'Vertiport demonstration', 'eVTOL integration studies', 'Future mobility simulation'] },
                { title: 'Operation corridor expansion', points: ['Autonomous maritime operations', 'Aerial logistics operations', 'Inter-zone operations', 'Long-range operations'] },
                { title: 'R&D and international collaboration', points: ['International collaboration', 'Joint technology development', 'Global benchmarking', 'Advanced validation activities'] },
            ],
            outcomes: ['National validation platform', 'AAM demonstration hub', 'Advanced autonomous operations', 'Global R&D collaboration'],
        },
        {
            short: 'Sustainability and future mobility integration',
            title: 'Sustainability and future mobility integration',
            when: '2029 – 2030+',
            summary: 'Integrate with national systems and the region, and sustain the sandbox for the long term.',
            components: [
                { title: 'Sustainable operations', points: ['Commercial and business model', 'Financial sustainability', 'Operational efficiency'] },
                { title: 'Smart airspace integration', points: ['Integration with national systems', 'Smart city and smart logistics', 'Data-driven operations'] },
                { title: 'Regional collaboration (ASEAN)', points: ['ASEAN sandbox collaboration', 'Regional interoperability', 'Cross-border operations'] },
                { title: 'Global partnerships', points: ['International technology partners', 'Global validation network', 'Strategic investments'] },
            ],
            outcomes: ['Regional low-altitude airspace hub', 'International validation centre', 'Sustainable future mobility ecosystem', 'Economic and industry growth'],
        },
    ],
    enablersTitle: 'Strategic enablers',
    enablers: ['Infrastructure readiness', 'Regulatory alignment', 'Technology maturity', 'Industry participation', 'Investment growth'],

    visionTitle: 'Strategic long-term vision',
    /* top → bottom of the stack */
    vision: [
        { title: 'Future mobility', text: 'AAM · eVTOL · Autonomous mobility' },
        { title: 'Autonomous airspace', text: 'UTM · U-DEP · AI · Automation' },
        { title: 'High-tech industry growth', text: 'Innovation · Startups · R&D · Commercialisation' },
        { title: 'Low-altitude economy', text: 'Jobs · Investment · Productivity · National growth' },
    ],
    visionCaption: "The Perlis Airspace Sandbox is envisioned as Malaysia's national platform for autonomous airspace innovation, future mobility validation and low-altitude economy development.",
};

/* ---------- 06 Projects ---------- */
/* image: file name inside /images/innovation/ (see `images` at the bottom of Innovation.jsx).
   featured: true makes a card wide. Add "tag" / "status" freely. */

export const projects = {
    heading: 'Projects',
    lede: 'What is being built and flown in Perlis.',
    items: [
        {
            featured: true,
            image: 'render-exterior',
            tag: 'Infrastructure',
            status: 'Phase 1 · Mid 2026 – Early 2027',
            title: 'Sungai Batu Pahat sandbox facility',
            text: 'Phase 1 development on the Sungai Batu Pahat mango farm (PKENPs): 2.9 ha of the 19.7 ha sandbox site, which also contains the runway to be upgraded.',
            facts: ['Guard house', 'Main building', 'Vertiport', 'Helipad', 'EV and general parking', 'Lake'],
        },
        {
            image: 'corridor-dam',
            tag: 'Flight corridor',
            status: 'Planned',
            title: 'Timah Tasoh Dam corridor',
            text: 'From the sandbox heading east to Timah Tasoh Dam across rivers and paddy fields, then turning back to Sungai Batu Pahat.',
            facts: ['BVLOS testing', 'Rural terrain'],
        },
        {
            image: 'corridor-langkawi',
            tag: 'Flight corridor',
            status: 'Planned',
            title: 'Kuala Perlis – Langkawi corridor',
            text: 'A west-bound route via the upper river area and paddy fields to Kuala Perlis, then over the sea to Langkawi Island.',
            facts: ['Over-water flight', 'Long range'],
        },
        {
            image: 'render-hangar',
            tag: 'AAM',
            status: 'Phase 3 · 2028 – 2029',
            title: 'Vertiport demonstration',
            text: 'AAM operation simulation, vertiport demonstration and eVTOL integration studies in the sandbox.',
            facts: ['eVTOL', 'Vertiport'],
        },
    ],
};

/* ---------- 07 Test plans (from Sandbox Website.xlsx → "Innovation") ---------- */
/* Man = people · Machine = aircraft & systems · Method = procedures · Material = infrastructure & equipment */

export const testing = {
    heading: 'What kind of testing happens here?',
    lede: 'Sample test plans organised by the 4Ms. Pick a focus area, then open any topic.',
    columns: [
        { key: 'man', label: 'Man', note: 'People & performance' },
        { key: 'machine', label: 'Machine', note: 'Aircraft & systems' },
        { key: 'method', label: 'Method', note: 'Procedures & workflow' },
        { key: 'material', label: 'Material', note: 'Infrastructure & equipment' },
    ],
    focus: [
      {
        id: "first-responder",
        title: "First Responder Operations",
        summary: "Emergency response, search & rescue and medical delivery missions.",
        cells: {
          man: [
            {
              title: "Remote Pilot / Operator Performance",
              points: [
                "Response time under emergency conditions",
                "Workload and fatigue assessment",
                "Multi-vehicle control capability"
              ]
            },
            {
              title: "First Responder Coordination",
              points: [
                "Interaction between drone/eVTOL operator and ground teams",
                "Communication clarity during time-critical missions"
              ]
            },
            {
              title: "Command & Control (C2) Structure",
              points: [
                "Decision-making hierarchy validation",
                "Role clarity between agencies"
              ]
            },
            {
              title: "Training Effectiveness",
              points: [
                "Simulation vs real-world readiness",
                "Skill gap identification"
              ]
            }
          ],
          machine: [
            {
              title: "Aircraft / UAS Performance",
              points: [
                "Flight stability in emergency conditions",
                "Payload capability (medical kits, sensors)",
                "Endurance and range"
              ]
            },
            {
              title: "Sensor & Payload Testing",
              points: [
                "Thermal imaging for search & rescue",
                "Surveillance cameras",
                "Loudspeaker / communication payloads"
              ]
            },
            {
              title: "Communication Systems",
              points: [
                "Link reliability in urban / remote areas",
                "Redundancy performance"
              ]
            },
            {
              title: "System Integration",
              points: [
                "Integration with UTM systems",
                "Multi-platform coordination"
              ]
            }
          ],
          method: [
            {
              title: "Standard Operating Procedures (SOPs)",
              points: [
                "Mission workflow validation",
                "Emergency deployment procedures"
              ]
            },
            {
              title: "Dispatch & Response Workflow",
              points: [
                "Time from alert → deployment → arrival",
                "Coordination between agencies"
              ]
            },
            {
              title: "Airspace Management",
              points: [
                "Priority handling for emergency flights",
                "Conflict resolution with other airspace users"
              ]
            },
            {
              title: "Emergency Scenario Simulation",
              points: [
                "Disaster response (flood, fire, accident)",
                "Search & rescue missions",
                "Medical delivery scenarios"
              ]
            }
          ],
          material: [
            {
              title: "Ground Support Equipment",
              points: [
                "Mobile command centres",
                "Portable landing zones"
              ]
            },
            {
              title: "Vertiport / Landing Area Readiness",
              points: [
                "Emergency landing site suitability",
                "Rapid deployment infrastructure"
              ]
            },
            {
              title: "Energy & Power Systems",
              points: [
                "Battery swap / charging speed",
                "Field deployment capability"
              ]
            },
            {
              title: "Logistics & Payload Handling",
              points: [
                "Medical supply handling",
                "Equipment loading/unloading"
              ]
            }
          ]
        }
      },
      {
        id: "aam",
        title: "Advanced Air Mobility Operations",
        summary: "Passenger and cargo eVTOL journeys, from vertiport to airspace.",
        cells: {
          man: [
            {
              title: "Pilot / Remote Operator Performance",
              points: [
                "Single vs multi-vehicle supervision",
                "Transition from piloted to autonomous ops",
                "Workload and situational awareness"
              ]
            },
            {
              title: "Air Traffic / UTM Operator Coordination",
              points: [
                "Interaction between AAM operators and ATM/UTM",
                "Decision-making in mixed airspace"
              ]
            },
            {
              title: "Ground Crew Operations",
              points: [
                "Turnaround procedures at vertiport",
                "Charging / battery swap handling",
                "Passenger handling readiness"
              ]
            },
            {
              title: "Passenger Experience & Acceptance",
              points: [
                "Boarding / disembarking flow",
                "Safety perception and comfort",
                "Wayfinding and user journey"
              ]
            },
            {
              title: "Multi-Agency Coordination",
              points: [
                "Operator, regulator (e.g. Civil Aviation Authority of Malaysia), and service providers"
              ]
            }
          ],
          machine: [
            {
              title: "eVTOL / AAM Aircraft Performance",
              points: [
                "Take-off and landing performance",
                "Range, endurance, payload",
                "Noise profile testing"
              ]
            },
            {
              title: "Navigation & Autonomy Systems",
              points: [
                "Assisted vs autonomous flight",
                "Precision landing systems"
              ]
            },
            {
              title: "Communication Systems",
              points: [
                "Data link reliability",
                "Redundancy and failover"
              ]
            },
            {
              title: "UTM / ATM Integration",
              points: [
                "Flight planning and tracking",
                "Conflict detection & resolution"
              ]
            },
            {
              title: "Vertiport Systems",
              points: [
                "Landing guidance systems",
                "Ground movement coordination"
              ]
            }
          ],
          method: [
            {
              title: "Concept of Operations (CONOPS) Validation",
              points: [
                "End-to-end passenger / cargo journey",
                "Multi-flight operations"
              ]
            },
            {
              title: "Flight Operations Procedures",
              points: [
                "Departure / arrival sequencing",
                "Emergency handling"
              ]
            },
            {
              title: "Vertiport Operations",
              points: [
                "Scheduling and slot management",
                "Ground handling procedures"
              ]
            },
            {
              title: "Airspace Integration",
              points: [
                "Mixed traffic operations (AAM + conventional + UAS)",
                "Priority and separation rules"
              ]
            },
            {
              title: "Turnaround & Throughput",
              points: [
                "Time efficiency between flights",
                "Capacity testing"
              ]
            }
          ],
          material: [
            {
              title: "Vertiport Infrastructure",
              points: [
                "Landing pads and layout",
                "Passenger facilities (basic level)",
                "Safety zones"
              ]
            },
            {
              title: "Energy & Charging Systems",
              points: [
                "Charging time and efficiency",
                "Battery swap operations",
                "Grid / genset support"
              ]
            },
            {
              title: "Support Infrastructure",
              points: [
                "Maintenance areas",
                "Ground support equipment"
              ]
            },
            {
              title: "Urban Integration",
              points: [
                "Site accessibility",
                "Noise and environmental constraints"
              ]
            }
          ]
        }
      },
      {
        id: "cargo",
        title: "Cargo Logistics Operations",
        summary: "Drone delivery, fleet management and last-mile networks.",
        cells: {
          man: [
            {
              title: "Remote Pilot / Fleet Operator Performance",
              points: [
                "Single vs multi-drone fleet management",
                "Monitoring multiple delivery missions",
                "Exception handling (lost link, reroute)"
              ]
            },
            {
              title: "Logistics Personnel Workflow",
              points: [
                "Loading / unloading efficiency",
                "Handling of sensitive cargo (medical, fragile items)",
                "Ground crew coordination"
              ]
            },
            {
              title: "Control Centre Operations",
              points: [
                "Dispatch and routing decisions",
                "Real-time monitoring and intervention"
              ]
            },
            {
              title: "Customer / End-User Interaction",
              points: [
                "Delivery handover process",
                "Acceptance and usability of drone delivery"
              ]
            }
          ],
          machine: [
            {
              title: "Cargo Drone / AAM Aircraft Performance",
              points: [
                "Payload capacity vs range",
                "Flight endurance under load",
                "Reliability in repeated operations"
              ]
            },
            {
              title: "Payload & Delivery Systems",
              points: [
                "Drop-off mechanisms (winch, landing delivery)",
                "Secure cargo containment",
                "Temperature-controlled payloads (for medical use)"
              ]
            },
            {
              title: "Navigation & Routing Systems",
              points: [
                "Route optimisation",
                "Dynamic rerouting"
              ]
            },
            {
              title: "Communication Systems",
              points: [
                "Connectivity in urban and remote environments",
                "Real-time tracking"
              ]
            },
            {
              title: "Fleet Management Systems",
              points: [
                "Multi-vehicle coordination",
                "Scheduling and dispatch automation"
              ]
            }
          ],
          method: [
            {
              title: "End-to-End Delivery Workflow",
              points: [
                "Order → dispatch → delivery → confirmation",
                "Time efficiency across the chain"
              ]
            },
            {
              title: "Hub-to-Hub & Last-Mile Operations",
              points: [
                "Distribution centre to drop-off point",
                "Rural vs urban delivery models"
              ]
            },
            {
              title: "Scheduling & Throughput",
              points: [
                "Delivery frequency",
                "Peak demand handling"
              ]
            },
            {
              title: "Airspace & Route Management",
              points: [
                "Dedicated corridors vs shared airspace",
                "Conflict avoidance"
              ]
            },
            {
              title: "Exception & Contingency Handling",
              points: [
                "Failed delivery",
                "Weather disruptions",
                "Emergency landing procedures"
              ]
            }
          ],
          material: [
            {
              title: "Logistics Hubs / Micro-Distribution Centres",
              points: [
                "Loading and dispatch areas",
                "Integration with existing supply chains"
              ]
            },
            {
              title: "Landing / Delivery Points",
              points: [
                "Design of delivery zones",
                "Urban vs rural deployment"
              ]
            },
            {
              title: "Energy & Charging Systems",
              points: [
                "Charging cycles for high-frequency operations",
                "Battery swap models"
              ]
            },
            {
              title: "Cargo Handling Equipment",
              points: [
                "Packaging standards",
                "Handling systems for automation"
              ]
            },
            {
              title: "Integration with Existing Infrastructure",
              points: [
                "Warehouses",
                "Hospitals (for medical delivery)",
                "Retail / e-commerce nodes"
              ]
            }
          ]
        }
      }
    ],
};

/* ---------- 08 Impact (AAM Industry Report) ---------- */

export const impact = {
    heading: 'Why it matters for Malaysia',
    lede: 'Advanced Air Mobility is set to become a new engine of economic growth.',
    stats: [
        { prefix: 'USD ', value: 137.11, decimals: 2, suffix: ' bn', label: 'Projected global AAM market by 2035 (24.6% CAGR from 2023)' },
        { prefix: 'RM', value: 70, suffix: ' bn', label: 'Additional revenue from AAM in Malaysia over the next 20 years' },
        { prefix: 'RM', value: 34, suffix: ' bn', label: 'Contribution to Malaysian GDP over 20 years' },
        { prefix: 'RM', value: 14, suffix: ' bn', label: 'Projected addition to worker salaries' },
    ],
    source: 'Source: Advanced Air Mobility (AAM) Industry Report, Futurise & Malaysian Industry-Government Group (MIGHT); Grand View Research for the global figure.',
};

/* ---------- 09 Participate ---------- */

export const participate = {
    heading: 'Ready to fly with us?',
    lede: 'Four ways to take part, from recreational flying to authority-led regulatory testing.',
    types: [
        { who: 'User', kind: 'Recreational', points: ['Recreational flight'] },
        { who: 'Vendor', note: 'OEM, service provider', kind: 'Industry-led (commercial and technology)', points: ['Tech demo', 'Infrastructure testing', 'Commercial pilot trials'] },
        { who: 'Collaborator', note: 'Authorities and agencies', kind: 'Authority-led (policy and regulatory)', points: ['Regulatory testing', 'Public service trials', 'Integrated system testing'] },
        { who: 'Researcher', note: 'Academia, R&D bodies', kind: 'Research (innovation and early-stage)', points: ['Academic research', 'Early-stage technology', 'Experimental operations'] },
    ],
    stepsTitle: 'From interest to execution',
    steps: [
        { title: 'Submit interest', text: 'Send your Expression of Interest.' },
        { title: 'Define activity', text: 'Outline your testing scope and objectives.' },
        { title: 'Review & approval', text: 'Coordination and review with the relevant authorities.' },
        { title: 'Execute', text: 'Conduct your testing within the sandbox.' },
    ],
    closing: {
        heading: 'Have a technology to test?',
        text: 'Tell us what you want to prove. We will help you plan, get approvals and fly.',
    },
};

// COE-UAS Collaborate: the ONE place to edit the page content.
// Put this file at: resources/js/data/COEUAS-data/collaborateContent.js
//
// HOW TO MAINTAIN
//   Add          copy one object inside an array (`items`, `phases`, `partners`, `blocks`) and edit it.
//   Edit         change the text or link.
//   Delete       remove the object from its array.
//   Reorder      move objects up or down. Sections: move the section object inside `sections`.
//   Hide         set `visible: false` on a section.
//   Simple lists (the offer block items, objectives, tags) can be plain strings: "Text".
//   Hero numbers a stat with `of: "<section id>"` counts that section's items; `of: "<section id>.<field>"`
//                counts a nested list (e.g. "network.partners"). A plain `value` is shown as written.
//
// IDS
//   `id`      unique inside its array (React list key). Never reuse one.
//   `anchor`  optional element id so the navbar chips (/coeuas/collaborate#research, #industry, #partnership)
//             scroll to that item. Keep the anchors that exist in siteMapCOEUAS.js.
//   `href`    "https://..." and .pdf open in a new tab; "/contact" gets the /coeuas prefix.
//
// Sources: COEUAS_Site_Map_and_Use_Case.docx (Engagement > Collaborate with Us), Facilities & Services,
// and the Perlis Airspace Sandbox decks and poster. Items marked EDIT are drafts to confirm.
//
// Later this object can come from the admin CMS: <Collaborate content={...} />.

import { useMemo } from "react";

export const IMAGE_BASE = "/images/coeuas/collaborate/";

export const imgUrl = (file) => {
  if (!file) return "";
  return /^(https?:)?\/\//.test(file) || file.startsWith("/") ? file : IMAGE_BASE + file;
};

export function useCollaborateContent(override) {
  const content = useMemo(() => override || collaborateContent, [override]);
  return { content };
}

export const collaborateContent = {
  page: { title: "Collaborate with Us | COE-UAS" },

  settings: {
    formEndpoint: "", // Laravel POST route for the enquiry form, e.g. "/coeuas/collaborate/enquiry".
                      // Leave "" to only show the success message (no request is sent).
  },

  /* ------------------------------ HERO ------------------------------ */
  hero: {
    eyebrow: "Collaborate with us",
    headline: ["Build the", "low-altitude future", "with COE-UAS"],
    highlight: "low-altitude future",
    lead: "Researchers, industry, government agencies, students and training clients work with the Centre of Excellence for Unmanned Aerial Systems at Universiti Malaysia Perlis, from joint research to real-world testing in the Perlis Airspace Sandbox.",
    image: "",
    primary: { label: "Send an enquiry", target: "enquire" }, // target = a section id
    secondary: { label: "Find your pathway", target: "pathways" },
    chips: ["Joint research", "Industry projects", "Sandbox testing", "Postgraduate and postdoctoral places", "Training and services"],
    caption: { place: "Perlis, Malaysia", note: "COE-UAS" },
    stats: [
      { label: "Ways to collaborate", of: "pathways", note: "Students, industry, government, research and training." },
      { label: "Sandbox facilities", of: "sandbox", note: "In the functional mock-up aerodrome." },
      { label: "Development phases", of: "roadmap", note: "From 2026 to 2030 and beyond." },
      { label: "Named partners", of: "network.partners", note: "Agencies, universities and industry." },
    ],
  },

  /* ---------------------------- SECTIONS ----------------------------
     Order here = order on the page. `label` = short name in the sticky menu.
     tone: dark | navy | light | blue
     type: reasons | pathways | offer | sandbox | roadmap | network | enquire    */
  sections: [
    /* ---------- Why collaborate ---------- */
    {
      id: "why",
      type: "reasons",
      visible: true, nav: true, tone: "navy",
      label: "Why collaborate",
      eyebrow: "Why collaborate",
      title: "No single organisation can do this alone",
      text: "Malaysia has the drone technology and the talent. What is still missing is the shared ground where research becomes real operations.",
      items: [
        { id: "impact", title: "From prototype to real-world impact", text: "Many drone technologies already exist, but the path from research to deployment is incomplete. Working together closes that gap." },
        { id: "test", title: "A real place to test and prove", text: "The Perlis Airspace Sandbox gives real aircraft, real missions and real operational conditions a safe, controlled airspace." },
        { id: "ecosystem", title: "Academia, industry and government in one ecosystem", text: "Each partner brings what the others need: research and talent, deployment, real use cases, safety and policy." },
      ],
      // Numbers count up when scrolled into view. Check against the latest Sandbox documents.
      figures: [
        { id: "area", to: 30, prefix: "~", suffix: " ha", label: "Sandbox site at Sungai Batu Pahat, Perlis" },
        { id: "facilities", to: 6, label: "Facilities in the functional mock-up aerodrome" },
        { id: "phases", to: 4, label: "Development phases, 2026 to 2030+" },
      ],
    },

    /* ---------- Pathways (one per actor in the use-case document) ----------
       role         pre-selects "I am a" in the enquiry form
       enquiryType  pre-selects the enquiry type (must match enquire.types[].value)   */
    {
      id: "pathways",
      type: "pathways",
      visible: true, nav: true, tone: "light",
      label: "Pathways",
      eyebrow: "Find your pathway",
      title: "Where do you fit in?",
      text: "Choose the route closest to you. We carry it into the enquiry form.",
      items: [
        {
          id: "student", anchor: "research", tag: "Students and applicants",
          title: "Prospective student or research applicant",
          text: "Explore proposed research topics and postgraduate or postdoctoral opportunities with our research groups.",
          offers: ["Research opportunities", "Postgraduate and postdoctoral places", "Research enquiry"],
          cta: "Ask about research places",
          role: "Prospective student or research applicant", enquiryType: "research",
        },
        {
          id: "industry", anchor: "industry", tag: "Industry",
          title: "Industry partner",
          text: "Bring an operational challenge, validate a platform or take a technology towards commercialisation.",
          offers: ["Industry research challenges", "Industry solutions and case studies", "Facilities and technical services", "Perlis Airspace Sandbox programme"],
          cta: "Discuss a project",
          role: "Industry partner", enquiryType: "research",
        },
        {
          id: "government", anchor: "partnership", tag: "Government and agencies",
          title: "Government and agency partner",
          text: "Work with us on real operational use cases and on the operational data that policy and regulation depend on.",
          offers: ["Operational use cases", "Data and insights for regulators", "Joint initiatives and agreements"],
          cta: "Start a partnership",
          role: "Government or agency partner", enquiryType: "research",
        },
        {
          id: "research", tag: "Research partners",
          title: "Research partner",
          text: "Co-develop projects, share grants and link research groups across universities and countries.",
          offers: ["Joint research projects", "Research areas and groups", "Networking and linkages"],
          cta: "Propose a joint project",
          role: "Research partner", enquiryType: "research",
        },
        {
          id: "training", tag: "Training and services",
          title: "Training or services enquirer",
          text: "Book drone operation and technical courses, or ask for engineering and aerial data services.",
          offers: ["Training and professional development", "Training calendar", "Engineering and technical services"],
          cta: "Ask about training",
          role: "Training or services enquirer", enquiryType: "training",
        },
      ],
    },

    /* ---------- What we offer (Facilities & Services) ---------- */
    {
      id: "offer",
      type: "offer",
      visible: true, nav: true, tone: "dark",
      label: "What we offer",
      eyebrow: "What we offer",
      title: "What we can build with you",
      text: "Engineering capability, industry know-how and training, available to partners.",
      // layout "cards" = title + text. layout "tags" = a wrapped set of short labels (plain strings are fine).
      items: [
        {
          id: "services", label: "Engineering and technical services", layout: "cards",
          items: [
            // EDIT: short descriptions are drafts; the titles come from the site map.
            { title: "Design, manufacturing and assembly", text: "From concept and prototype to built-to-order platforms." },
            { title: "Systems integration and testing", text: "Bring payloads, avionics and software together and prove they work." },
            { title: "Maintenance, repair and upgrading", text: "Keep research and operational fleets flying." },
            { title: "Aerial operations and data processing", text: "Fly the mission, then turn the data into answers." },
          ],
        },
        {
          id: "solutions", label: "Industry solutions and case studies", layout: "tags",
          items: [
            "Surveying, mapping and photogrammetry",
            "Stockpile and volumetric measurement",
            "Heritage documentation and inspection",
            "Security, surveillance and monitoring",
            "Cargo and goods transportation",
            "Agriculture, spraying and crop monitoring",
            "Autonomous systems, AI and computer vision",
          ],
        },
        {
          id: "training", label: "Training and professional development", layout: "tags",
          items: [
            "Drone operation and technical courses",
            "Industry and agency training",
            "Community and outreach programmes",
            "Training calendar and enquiries",
          ],
        },
      ],
    },

    /* ---------- Perlis Airspace Sandbox ---------- */
    {
      id: "sandbox",
      type: "sandbox",
      visible: true, nav: true, tone: "blue",
      label: "Airspace Sandbox",
      eyebrow: "Perlis Airspace Sandbox",
      title: "Test it for real at the Perlis Airspace Sandbox",
      text: "The first dedicated low-altitude airspace testing facility in Malaysia: about 30 hectares at Sungai Batu Pahat, built around a safe, controlled and fully functional mock-up aerodrome.",
      objectivesTitle: "What it is for",
      objectives: [
        "A national ecosystem for secure drone research and real-world validation",
        "Skills development and joint research",
        "Test-based feedback for drone operational guidelines",
      ],
      coreLabel: "Inside the functional mock-up aerodrome",
      link: { label: "Explore the Sandbox", href: "" }, // EDIT: e.g. "/" for the Sandbox site or "https://...". Empty hides the button.
      items: [
        { id: "vertiport", title: "Vertiport", text: "Purpose-built pads for take-off and landing of drones and next-generation air mobility." },
        { id: "corridor", title: "Test flight corridor", text: "A dedicated low-altitude test range with segmented altitude zones for different scenarios." },
        { id: "hub", title: "Drone hub", text: "Operations base with autonomous charging stations." },
        { id: "maintenance", title: "Research and maintenance facility", text: "Workshops for building, maintaining and upgrading platforms." },
        { id: "simulator", title: "Flight simulator", text: "Operator training and mission rehearsal before real flights." },
        { id: "utms", title: "Radar, communication and UTMS", text: "Surveillance, links and unmanned traffic management for validation." },
      ],
    },

    /* ---------- Roadmap (from "Development Implementation Roadmap") ---------- */
    {
      id: "roadmap",
      type: "roadmap", // numbered, because the phases are a sequence
      visible: true, nav: true, tone: "light",
      label: "Roadmap",
      eyebrow: "Roadmap",
      title: "Join at any phase",
      text: "The sandbox grows in four phases. Here is where partners can get involved.",
      nowLabel: "Current phase",
      items: [
        { id: "p1", name: "Foundation and initial operational setup", period: "Mid 2026 to early 2027", now: true, join: ["Early demonstration flights", "Basic BVLOS operations", "Operational SOP development"] },
        { id: "p2", name: "Operational validation and ecosystem expansion", period: "Mid 2027 to 2028", join: ["UTM system development", "Training and simulation centre", "Industry and startup ecosystem"] },
        { id: "p3", name: "Advanced airspace ecosystem development", period: "2028 to 2029", join: ["Vertiport demonstration", "eVTOL integration studies", "International collaboration"] },
        { id: "p4", name: "Sustainability and future mobility integration", period: "2029 to 2030+", join: ["ASEAN sandbox collaboration", "Smart city and smart logistics", "Global validation network"] },
      ],
    },

    /* ---------- Network ---------- */
    {
      id: "network",
      type: "network",
      visible: true, nav: true, tone: "dark",
      label: "Our network",
      eyebrow: "Our network",
      title: "A growing network of partners",
      text: "Universities, industry, government, agencies and regulators each play a part.",
      rolesTitle: "Who does what",
      roles: [
        { id: "university", name: "University", text: "Research, talent and innovation" },
        { id: "industry", name: "Industry", text: "Deployment and commercialisation" },
        { id: "government", name: "Government", text: "National coordination and support" },
        { id: "agencies", name: "Agencies", text: "Real operational use cases" },
        { id: "regulator", name: "Regulator", text: "Safety, governance and compliance" },
      ],
      channelsTitle: "Ways we link up",
      channels: [
        "University and research networks",
        "Government and agency relationships",
        "Industrial collaborators",
        "International collaborations",
        "Agreements, consortia and joint initiatives",
      ],
      // Add { name, logo } partners; logo is an image file or URL (leave "" to show the name).
      // EDIT: the names below are the logos shown on the Sandbox poster. Confirm before publishing.
      items: [
        {
          id: "agencies", group: "Agencies and national partners",
          partners: [
            { name: "CAAM", logo: "" }, { name: "MCMC", logo: "" }, { name: "MIGHT", logo: "" }, { name: "FUTURISE", logo: "" },
            { name: "STRIDE", logo: "" }, { name: "SIRIM", logo: "" }, { name: "MRANTI", logo: "" }, { name: "NAICO", logo: "" },
          ],
        },
        {
          id: "academia", group: "Academia and industry",
          partners: [
            { name: "Universiti Malaysia Perlis", logo: "" },
            { name: "Vertiport Malaysia", logo: "" },
          ],
        },
      ],
    },

    /* ---------- Enquiry form ---------- */
    {
      id: "enquire",
      type: "enquire",
      visible: true, nav: true, tone: "light",
      label: "Enquire",
      eyebrow: "Send an enquiry",
      title: "Start the conversation",
      text: "Tell us what you have in mind. We will route your message to the right group.",
      stepsTitle: "What happens next", // EDIT: confirm the process with the centre
      steps: ["You send the enquiry", "We pass it to the right research or training group", "We reply to discuss next steps"],
      // Three enquiry types from the Contact section of the site map
      types: [
        { value: "general", label: "General enquiry" },
        { value: "research", label: "Research and collaboration" },
        { value: "training", label: "Training and services" },
      ],
      defaultType: "research",
      // The five actors from the use-case document
      roles: [
        "Prospective student or research applicant",
        "Industry partner",
        "Government or agency partner",
        "Research partner",
        "Training or services enquirer",
        "Other",
      ],
      labels: {
        type: "Type of enquiry",
        role: "I am a",
        rolePlaceholder: "Choose one",
        name: "Full name",
        email: "Email address",
        organisation: "Organisation",
        message: "How would you like to work with us?",
        submit: "Send enquiry",
        sending: "Sending…",
        another: "Send another enquiry",
      },
      successTitle: "Enquiry sent",
      successText: "Thank you. We will reply to the email address you gave.",
      errorText: "Your enquiry was not sent. Check the highlighted fields and try again.",
      // Leave a value "" to hide that line.
      contact: {
        organisation: "Centre of Excellence for Unmanned Aerial Systems (COE-UAS), Universiti Malaysia Perlis",
        sandbox: "Perlis Airspace Sandbox, Sungai Batu Pahat, Perlis",
        email: "",
        phone: "",
      },
    },
  ],
};

import { useEffect, useState } from "react";

/* ------------------------------------------------------------------
   CONTACT PAGE CONTENT: everything an admin would edit.
   Contact.jsx contains NO text, links or numbers of its own.
   Place at: resources/js/data/COEUAS-data/contactContent.js

   HOW TO MAINTAIN
   ADD / UPDATE / DELETE an enquiry route   -> `enquiryTypes`
        (the route cards AND the form's "Type of enquiry" pills both
         come from this one list)
   ADD / UPDATE / DELETE a contact channel  -> `details.channels`
        (email, phone, text or link; a row with value "" is hidden)
   ADD / UPDATE / DELETE opening hours      -> `details.hours`
   ADD / UPDATE / DELETE a location         -> `locations.items`
   ADD / UPDATE / DELETE a FAQ              -> `faq.items`
   HIDE / REORDER a section                 -> `sections`
        (visible, order, tone: dark | navy | light | blue)

   Sections with no data (no locations, no FAQs, no routes) hide
   themselves, so you never get an empty block on the page.

   LATER (admin CMS): set CONTACT_CONTENT_URL. The API only needs to
   return the parts that changed. Arrays are replaced whole.
------------------------------------------------------------------- */
export const CONTACT_CONTENT_URL = null; // e.g. "/api/pages/contact"

export const defaultContactContent = {
  settings: {
    formEndpoint: "", // Laravel POST route, e.g. "/coeuas/contact". "" = show the success message only (preview).
  },

  /* order = order on the page.
     nav:false keeps a section out of the sticky menu.
     anchor = extra id so site-map links such as /coeuas/contact#details land here. */
  sections: [
    { id: "hero", label: "Contact", visible: true, nav: false },
    { id: "routes", label: "Enquiries", visible: true, tone: "light" },
    { id: "form", label: "Message", visible: true, tone: "dark" },
    { id: "details", label: "Contact details", visible: true, tone: "blue", anchor: "details" },
    { id: "locations", label: "Location", visible: true, tone: "navy" },
    { id: "faq", label: "FAQ", visible: true, tone: "light" },
  ],

  hero: {
    eyebrow: "Contact",
    headline: ["Let's talk about", "unmanned flight."],
    highlight: "unmanned flight.",
    lead: "Ask a question, propose a project or enquire about training. Choose the route that fits and your message goes to the right team at the Centre of Excellence for Unmanned Aerial Systems, Universiti Malaysia Perlis.",
    primary: { label: "Send a message", target: "form" },
    secondary: { label: "See contact details", target: "details" },
    caption: { place: "COE-UAS", note: "Universiti Malaysia Perlis" },
    /* count: "routes" | "locations" | "channels" = counted automatically
       text = any fixed text. A stat with nothing to show is hidden. */
    stats: [
      { count: "routes", label: "enquiry routes", note: "Each one reaches a different team" },
      { count: "locations", label: "places to visit", note: "Visits are by appointment" },
      { count: "channels", label: "ways to reach us", note: "Email, phone and more" },
      { text: "", label: "typical reply time", note: "" }, // EDIT: e.g. "2 working days"
    ],
  },

  /* ONE list used by the route cards and by the form pills.
     id       unique; sent to the server as the enquiry "type"
     anchor   id for site-map links (/contact#research-enquiry)
     title    card title   short  form pill label
     includes bullet list on the card
     reply    optional, e.g. "Within 2 working days" (hidden when empty)
     email    optional team address (hidden when empty) */
  enquiryTypes: [
    {
      id: "general",
      anchor: "enquiries",
      title: "General enquiry",
      short: "General",
      text: "Questions about the centre, visits, media or anything not covered elsewhere.",
      includes: ["About COE-UAS", "Visits and media", "Anything else"],
      reply: "",
      email: "",
      cta: "Ask a question",
    },
    {
      id: "research",
      anchor: "research-enquiry",
      title: "Research and collaboration",
      short: "Research",
      text: "Joint projects, partnerships, research opportunities and the Perlis Airspace Sandbox.",
      includes: ["Joint research and industry projects", "Postgraduate and postdoctoral places", "Perlis Airspace Sandbox programme"],
      reply: "",
      email: "",
      cta: "Propose a project",
    },
    {
      id: "training",
      anchor: "training-enquiry",
      title: "Training and services",
      short: "Training",
      text: "Courses, the training calendar, engineering services and aerial data work.",
      includes: ["Drone operation and technical courses", "Industry and agency training", "Engineering and technical services"],
      reply: "",
      email: "",
      cta: "Ask about training",
    },
  ],

  routes: {
    eyebrow: "Enquiries",
    title: "Which route fits you?",
    text: "Each route reaches a different team. Choose one and the form is filled in for you.",
  },

  form: {
    eyebrow: "Message",
    title: "Send us a message.",
    text: "Tell us what you need. We will reply to the email address you give.",
    defaultType: "general",
    /* "What happens next": add, edit or remove steps freely. */
    stepsTitle: "What happens next",
    steps: [
      { title: "We read it", text: "Your message goes to the team for the route you chose." },
      { title: "We reply by email", text: "A reply is sent to the address you give." },
      { title: "We follow up", text: "For visits or projects we may suggest a call or a meeting." },
    ],
    note: "We use your details only to reply to this message.", // EDIT: match your privacy policy. Empty hides it.
    directLabel: "Prefer email or a call?",
    directCta: "See contact details",
    labels: {
      type: "Type of enquiry",
      name: "Full name",
      email: "Email address",
      phone: "Phone (optional)",
      organisation: "Organisation (optional)",
      subject: "Subject",
      message: "Message",
      submit: "Send message",
      sending: "Sending…",
      another: "Send another message",
      replyLabel: "Typical reply",
      teamLabel: "Team email",
    },
    successTitle: "Message sent",
    successText: "Thank you. We will reply to the email address you gave.",
    errorText: "Your message was not sent. Check the highlighted fields and try again.",
  },

  details: {
    eyebrow: "Contact details",
    title: "Reach us directly.",
    text: "Prefer email or a call? Use the details below.",
    organisation: "Centre of Excellence for Unmanned Aerial Systems (COE-UAS), Universiti Malaysia Perlis",
    /* kind: "email" | "phone" | "text" | "link". Rows with an empty value are hidden.
       hint: optional one line under the value. */
    channels: [
      { id: "ch-general", label: "General enquiries", kind: "email", value: "", hint: "" },          // EDIT
      { id: "ch-research", label: "Research and collaboration", kind: "email", value: "", hint: "" }, // EDIT
      { id: "ch-training", label: "Training and services", kind: "email", value: "", hint: "" },      // EDIT
      { id: "ch-phone", label: "Office phone", kind: "phone", value: "", hint: "" },                 // EDIT
      { id: "ch-web", label: "Website or social media", kind: "link", value: "", hint: "" },         // EDIT
    ],
    /* opening hours: [{ day: "Monday to Thursday", time: "8:00 am to 5:00 pm" }] */
    hoursTitle: "Office hours",
    hours: [], // EDIT
    fallback: "Contact details are being updated. Please use the message form for now.",
    copyLabel: "Copy",
    copiedLabel: "Copied",
    openLabels: { email: "Write", phone: "Call", link: "Open" },
  },

  locations: {
    eyebrow: "Location",
    title: "Where to find us.",
    text: "Two places, one team. Visits are by appointment, so send a message first.",
    visitNote: "", // EDIT: e.g. "Please bring photo ID to the guard house." Empty hides it.
    directionsLabel: "Get directions",
    tipsTitle: "Good to know",
    items: [
      {
        id: "office",
        name: "COE-UAS office",
        role: "Centre of Excellence for Unmanned Aerial Systems",
        lines: ["Universiti Malaysia Perlis"], // EDIT: add the full address line(s)
        tips: [],                              // EDIT: e.g. ["Visitor parking at Block A"]
        embed: "",      // EDIT: Google Maps / OpenStreetMap "embed" URL. Empty shows the drawn marker.
        directions: "", // EDIT: link that opens directions. Empty hides the button.
      },
      {
        id: "sandbox",
        name: "Perlis Airspace Sandbox",
        role: "Low-altitude airspace testing site, about 30 hectares",
        lines: ["Sungai Batu Pahat, Perlis"],
        tips: [],
        embed: "",
        directions: "",
      },
    ],
  },

  faq: {
    eyebrow: "FAQ",
    title: "Quick answers.",
    text: "Short answers to what people ask us most.",
    items: [
      { id: "q1", q: "Which route should I choose?", a: "Pick the one closest to your question. If you are unsure, choose General enquiry and we will pass it to the right team." },
      { id: "q2", q: "Can I visit the centre or the sandbox?", a: "Yes, by appointment. Send a message first so we can arrange a date and tell you what to bring." },
      { id: "q3", q: "I want to study or do research with you. Where do I start?", a: "Choose Research and collaboration and tell us your area of interest. We will point you to the open places and the right research group." },
      { id: "q4", q: "Can my organisation book training or a technical service?", a: "Yes. Choose Training and services, describe what you need and how many people are involved, and we will reply with the next steps." },
    ],
  },
};

const merge = (base, patch = {}) => {
  const out = { ...base };
  for (const k of Object.keys(patch)) {
    const b = base[k], p = patch[k];
    out[k] = b && p && typeof b === "object" && typeof p === "object" && !Array.isArray(b) && !Array.isArray(p) ? { ...b, ...p } : p;
  }
  return out;
};

export function useContactContent(override) {
  const [content, setContent] = useState(() => merge(defaultContactContent, override));
  const [status, setStatus] = useState(CONTACT_CONTENT_URL ? "loading" : "ready");

  useEffect(() => {
    if (!CONTACT_CONTENT_URL) return;
    const ctrl = new AbortController();
    fetch(CONTACT_CONTENT_URL, { signal: ctrl.signal })
      .then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then((data) => { setContent(merge(defaultContactContent, data)); setStatus("ready"); })
      .catch((e) => { if (e.name !== "AbortError") setStatus("error"); });
    return () => ctrl.abort();
  }, []);

  return { content, status };
}

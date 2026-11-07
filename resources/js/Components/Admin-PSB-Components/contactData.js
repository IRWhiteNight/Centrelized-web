const MIN = 60 * 1000;
const NOW = Date.now();
export const minsAgo = (m) => new Date(NOW - m * MIN).toISOString();

export const sample = {
  media: [
    { id: 1, name: "contact-aiman.jpg", type: "image", alt: "Portrait of Aiman Hakim", size: "320 KB" },
    { id: 2, name: "contact-farid.jpg", type: "image", alt: "Portrait of Farid Rahman", size: "290 KB" },
    { id: 3, name: "contact-nurul.jpg", type: "image", alt: "", size: "340 KB" },
    { id: 4, name: "site-aerial.jpg", type: "image", alt: "Aerial view of the Sungai Batu Pahat site", size: "2.1 MB" },
  ],
  programmes: [
    { id: 1, title: "Open Call: BVLOS Corridor Trials" },
    { id: 2, title: "First Responder Drone Exercise" },
    { id: 3, title: "eVTOL Vertiport Demonstration" },
    { id: 4, title: "UTM Integration Trial" },
  ],
  admins: [
    { id: 1, name: "Aiman Hakim" },
    { id: 2, name: "Farid Rahman" },
    { id: 3, name: "Nurul Aina" },
  ],
  persons: [
    { id: 1, name: "Aiman Hakim", designation: "Programme Manager", programmeId: null, email: "programme@example.com", phone: "+60 4-000 0001", photoId: 1, updatedAt: minsAgo(60 * 24 * 10), updatedBy: "Aiman Hakim" },
    { id: 2, name: "Farid Rahman", designation: "Operations Lead, BVLOS Corridor Trials", programmeId: 1, email: "bvlos@example.com", phone: "+60 4-000 0002", photoId: 2, updatedAt: minsAgo(60 * 24 * 8), updatedBy: "Aiman Hakim" },
    { id: 3, name: "Nurul Aina", designation: "Coordinator, First Responder Drone Exercise", programmeId: 2, email: "responder@example.com", phone: "", photoId: 3, updatedAt: minsAgo(60 * 24 * 6), updatedBy: "Farid Rahman" },
    { id: 4, name: "Hafiz Zainal", designation: "Technical Lead, UTM Integration Trial", programmeId: 4, email: "", phone: "+60 4-000 0004", photoId: null, updatedAt: minsAgo(60 * 24 * 3), updatedBy: "Farid Rahman" },
  ],
  details: {
    email: "info@example.com",
    phone: "+60 4-000 0000",
    address: "Perlis Airspace Sandbox Programme Office\nSungai Batu Pahat, 02600 Arau,\nPerlis, Malaysia",
    hours: "Monday to Friday, 8:30 am – 5:30 pm (MYT)\nClosed on public holidays",
    notifyEmail: "enquiries@example.com",
    updatedAt: minsAgo(60 * 24 * 15),
    updatedBy: "Aiman Hakim",
  },
  enquiries: [
    { id: 109, type: "programme", senderName: "Lim Wei Jie", senderEmail: "weijie@example.com", organisation: "SkyHaul Logistics", subject: "BVLOS Corridor Trials: eligibility for foreign operators", message: "Hello,\n\nWe are a cargo drone operator based in Singapore. Can foreign operators apply for the BVLOS Corridor Trials, or must we partner with a Malaysian company?\n\nThank you.", status: "new", assignedTo: null, handledAt: null, createdAt: minsAgo(35), updatedAt: minsAgo(35), updatedBy: "" },
    { id: 108, type: "general", senderName: "Siti Aminah", senderEmail: "siti@example.com", organisation: "", subject: "Can schools visit the Sandbox Open Day?", message: "Good day. I teach at a secondary school in Kangar. Are school groups welcome at the Sandbox Open Day on 20 November? We would bring about 30 students.", status: "new", assignedTo: null, handledAt: null, createdAt: minsAgo(60 * 5), updatedAt: minsAgo(60 * 5), updatedBy: "" },
    { id: 107, type: "general", senderName: "Daniel Tan", senderEmail: "daniel@example.com", organisation: "Northern Media", subject: "Interview request about Phase 1", message: "We would like to interview a programme representative about Phase 1 site preparation for a regional feature. Please let us know who we can speak to.", status: "in_progress", assignedTo: 1, handledAt: null, createdAt: minsAgo(60 * 26), updatedAt: minsAgo(60 * 20), updatedBy: "Aiman Hakim" },
    { id: 106, type: "programme", senderName: "Dr. Rahim Osman", senderEmail: "rahim@example.com", organisation: "Northern University", subject: "Research partnership on detect-and-avoid testing", message: "Our lab is developing detect-and-avoid sensors. We would like to run controlled tests at the Sandbox. What is the process, and are there any costs?", status: "replied", assignedTo: 2, handledAt: minsAgo(60 * 24 * 2), createdAt: minsAgo(60 * 24 * 3), updatedAt: minsAgo(60 * 24 * 2), updatedBy: "Farid Rahman" },
    { id: 105, type: "general", senderName: "Mei Ling", senderEmail: "meiling@example.com", organisation: "", subject: "Where do I download the application form?", message: "I cannot find the application form on the website. Could you send me a link?", status: "closed", assignedTo: 3, handledAt: minsAgo(60 * 24 * 4), createdAt: minsAgo(60 * 24 * 5), updatedAt: minsAgo(60 * 24 * 4), updatedBy: "Nurul Aina" },
    { id: 104, type: "general", senderName: "Ahmad Faizal", senderEmail: "faizal@example.com", organisation: "Perlis Council", subject: "Flight schedule notice for nearby residents", message: "Will residents near Sungai Batu Pahat be notified before test flights begin? A few neighbours have asked.", status: "in_progress", assignedTo: 1, handledAt: null, createdAt: minsAgo(60 * 24 * 6), updatedAt: minsAgo(60 * 24 * 5), updatedBy: "Aiman Hakim" },
    { id: 103, type: "programme", senderName: "Kavitha Nair", senderEmail: "kavitha@example.com", organisation: "AeroVision", subject: "eVTOL Vertiport Demonstration: booking a slot", message: "We would like to reserve a demonstration slot for our eVTOL prototype in January. Is there a booking form?", status: "replied", assignedTo: 2, handledAt: minsAgo(60 * 24 * 6), createdAt: minsAgo(60 * 24 * 8), updatedAt: minsAgo(60 * 24 * 6), updatedBy: "Farid Rahman" },
    { id: 102, type: "general", senderName: "Omar Yusof", senderEmail: "omar@example.com", organisation: "", subject: "Newsletter not arriving", message: "I subscribed last week but have not received any update emails.", status: "closed", assignedTo: 3, handledAt: minsAgo(60 * 24 * 9), createdAt: minsAgo(60 * 24 * 10), updatedAt: minsAgo(60 * 24 * 9), updatedBy: "Nurul Aina" },
    { id: 101, type: "programme", senderName: "Grace Lee", senderEmail: "grace@example.com", organisation: "Responder Tech", subject: "First Responder Drone Exercise: team size", message: "How many team members can attend the First Responder Drone Exercise from one organisation?", status: "new", assignedTo: null, handledAt: null, createdAt: minsAgo(60 * 24 * 1), updatedAt: minsAgo(60 * 24 * 1), updatedBy: "" },
  ],
  history: [
    { id: 4, key: "enquiry:106", user: "Farid Rahman", action: "UPDATE", label: "Research partnership on detect-and-avoid testing", at: minsAgo(60 * 24 * 2), changes: [{ field: "Reply sent", from: "(none)", to: "Re: Research partnership on detect-and-avoid testing" }, { field: "Status", from: "In progress", to: "Replied" }] },
    { id: 3, key: "enquiry:107", user: "Aiman Hakim", action: "UPDATE", label: "Interview request about Phase 1", at: minsAgo(60 * 20), changes: [{ field: "Status", from: "New", to: "In progress" }, { field: "Assigned to", from: "Unassigned", to: "Aiman Hakim" }] },
    { id: 2, key: "details:1", user: "Aiman Hakim", action: "UPDATE", label: "Contact details", at: minsAgo(60 * 24 * 15), changes: [{ field: "Operating hours", from: "Monday to Friday, 9:00 am – 5:00 pm", to: "Monday to Friday, 8:30 am – 5:30 pm (MYT)..." }] },
    { id: 1, key: "person:2", user: "Aiman Hakim", action: "CREATE", label: "Farid Rahman", at: minsAgo(60 * 24 * 8), changes: [] },
  ],
};

export const ENQ_STATUS = {
  new: { label: "New", tone: "warn", text: "Not read or handled yet." },
  in_progress: { label: "In progress", tone: "info", text: "Someone is working on it." },
  replied: { label: "Replied", tone: "ok", text: "A reply has been sent." },
  closed: { label: "Closed", tone: "off", text: "No further action needed." },
};
export const ENQ_ORDER = ["new", "in_progress", "replied", "closed"];
export const ENQ_TYPE = { general: "General", programme: "Programme", research_collab: "Research collaboration", training_services: "Training and services" };
export const ENQ_TYPES_PSB = ["general", "programme"];
export const PERSON_LABELS = { name: "Name", designation: "Designation", programmeId: "Programme", email: "Email", phone: "Phone", photoId: "Photo" };
export const DETAIL_LABELS = { email: "Official email", phone: "Phone", address: "Address", hours: "Operating hours", notifyEmail: "Enquiry notification email" };
export const ACTION_LABEL = { CREATE: "Created", UPDATE: "Updated", PUBLISH: "Published", UNPUBLISH: "Unpublished", DELETE: "Deleted", RESTORE: "Restored" };

/**
 * LowKeySigns - Civic Counter Context Definition
 * Challenge: HTH-CV-09 (Accessibility-First Sign Language Communication Bridge)
 * 
 * Maps each of the 20 locked vocabulary words to comprehensive public-service
 * counter operational protocols across Hospitals, Government Desks, and Banks.
 */

export interface CivicActionProtocol {
  word: string;
  category: 'Medical & Triage' | 'Civic Administration' | 'Financial & Payment' | 'Queue & Navigation' | 'Dialogue & Civility';
  urgency: 'critical' | 'high' | 'standard' | 'courtesy';
  icon: string;
  civicDomain: string;
  intentSummary: string;
  clerkAction: string;
  visitorAssurance: string;
  recommendedNextSign: string;
  quickStaffReplies: string[];
}

export const CIVIC_CONTEXT_MAP: Record<string, CivicActionProtocol> = {
  // ── MEDICAL & TRIAGE ──────────────────────────────────────────────────────
  sick: {
    word: 'sick',
    category: 'Medical & Triage',
    urgency: 'high',
    icon: 'Thermometer',
    civicDomain: 'Public Health & Intake',
    intentSummary: 'Visitor reports feeling unwell, feverish, or experiencing illness symptoms.',
    clerkAction: 'Offer a sanitized mask and water. Fast-track through intake to prevent waiting room distress.',
    visitorAssurance: 'Health assistance assigned. Moving you to the priority triage desk.',
    recommendedNextSign: 'callonphone',
    quickStaffReplies: ['Here is water and a mask.', 'Let us check your temperature.', 'Please sit right here.'],
  },
  owie: {
    word: 'owie',
    category: 'Medical & Triage',
    urgency: 'high',
    icon: 'Activity',
    civicDomain: 'Clinical Symptom Assessment',
    intentSummary: 'Visitor indicates physical pain or acute discomfort.',
    clerkAction: 'Provide a comfortable chair. Offer a visual pain-scale chart (1–10) and notify triage.',
    visitorAssurance: 'We note you are in pain. Rapid clinical support is being assigned.',
    recommendedNextSign: 'callonphone',
    quickStaffReplies: ['Please sit comfortably.', 'Point on the chart where it hurts.', 'Nurse is coming now.'],
  },
  fireman: {
    word: 'fireman',
    category: 'Medical & Triage',
    urgency: 'critical',
    icon: 'Siren',
    civicDomain: 'Urgent Emergency Response',
    intentSummary: 'Visitor signals a fire or critical emergency requiring immediate response.',
    clerkAction: 'Trigger counter emergency alert immediately. Dispatch triage nurse or security escort.',
    visitorAssurance: 'Emergency response activated. Help is on the way.',
    recommendedNextSign: 'police',
    quickStaffReplies: ['Emergency team is on the way.', 'Please stay calm.', 'Help is right here.'],
  },
  callonphone: {
    word: 'callonphone',
    category: 'Medical & Triage',
    urgency: 'high',
    icon: 'Phone',
    civicDomain: 'Emergency Communication',
    intentSummary: 'Visitor requests an urgent phone call be placed on their behalf.',
    clerkAction: 'Place an urgent call immediately. Ask visitor to point at or write down the number.',
    visitorAssurance: 'Emergency call is being placed right now.',
    recommendedNextSign: 'wait',
    quickStaffReplies: ['Calling right away.', 'Please write the number here.', 'Call is connected.'],
  },

  // ── CIVIC ADMINISTRATION ─────────────────────────────────────────────────
  pen: {
    word: 'pen',
    category: 'Civic Administration',
    urgency: 'standard',
    icon: 'PenTool',
    civicDomain: 'Paperwork & Registration Desk',
    intentSummary: 'Visitor is requesting a pen to fill out a form or document.',
    clerkAction: 'Hand visitor a pen immediately. Highlight mandatory fields on the form.',
    visitorAssurance: 'Pen provided. Staff will guide you through each required field.',
    recommendedNextSign: 'finish',
    quickStaffReplies: ['Here is a pen.', 'I will highlight the fields for you.', 'Take your time.'],
  },
  who: {
    word: 'who',
    category: 'Civic Administration',
    urgency: 'standard',
    icon: 'UserCheck',
    civicDomain: 'Identity Verification & Staff Inquiry',
    intentSummary: 'Visitor is asking who the responsible staff member is.',
    clerkAction: 'Introduce yourself clearly. Display your staff ID or name badge.',
    visitorAssurance: 'Staff member identified. You are speaking with the correct officer.',
    recommendedNextSign: 'please',
    quickStaffReplies: ['I am the officer in charge today.', 'Here is my name badge.', 'How can I help you?'],
  },
  person: {
    word: 'person',
    category: 'Civic Administration',
    urgency: 'standard',
    icon: 'User',
    civicDomain: 'Human Representative Request',
    intentSummary: 'Visitor requests to speak with a human representative or staff member.',
    clerkAction: 'Confirm your presence. Signal a supervisor if specialised assistance is needed.',
    visitorAssurance: 'A dedicated officer is available to assist you personally.',
    recommendedNextSign: 'now',
    quickStaffReplies: ['I am here to help you.', 'Calling a supervisor now.', 'One moment please.'],
  },
  finish: {
    word: 'finish',
    category: 'Civic Administration',
    urgency: 'standard',
    icon: 'CheckCircle2',
    civicDomain: 'Process Completion',
    intentSummary: 'Visitor indicates they have finished signing or completing forms.',
    clerkAction: 'Collect documents, stamp, and issue receipt or acknowledgment token.',
    visitorAssurance: 'Your submission is complete. Confirmation has been issued.',
    recommendedNextSign: 'thankyou',
    quickStaffReplies: ['All done — here is your receipt.', 'Submission received.', 'Processing complete.'],
  },

  // ── QUEUE & NAVIGATION ───────────────────────────────────────────────────
  police: {
    word: 'police',
    category: 'Queue & Navigation',
    urgency: 'critical',
    icon: 'ShieldCheck',
    civicDomain: 'Security & Law Enforcement',
    intentSummary: 'Visitor is requesting security or police assistance.',
    clerkAction: 'Contact security desk immediately. Do not leave visitor unattended.',
    visitorAssurance: 'Security has been alerted and is on the way.',
    recommendedNextSign: 'wait',
    quickStaffReplies: ['Security is on the way.', 'Please stay calm.', 'Officer will be here shortly.'],
  },
  water: {
    word: 'water',
    category: 'Queue & Navigation',
    urgency: 'standard',
    icon: 'Droplets',
    civicDomain: 'Basic Needs & Visitor Comfort',
    intentSummary: 'Visitor is requesting drinking water.',
    clerkAction: 'Provide a sealed water bottle or point to the nearest water dispenser.',
    visitorAssurance: 'Water is being brought to you now.',
    recommendedNextSign: 'please',
    quickStaffReplies: ['Here is water for you.', 'Dispenser is around the corner.', 'Please help yourself.'],
  },
  wait: {
    word: 'wait',
    category: 'Queue & Navigation',
    urgency: 'standard',
    icon: 'Clock',
    civicDomain: 'Queue & Waiting Area Management',
    intentSummary: 'Visitor is acknowledging wait time or inquiring how long processing will take.',
    clerkAction: 'Issue priority vibrating pager or visual queue ticket with estimated duration.',
    visitorAssurance: 'Estimated wait time is 4 minutes. Your token will flash on Screen #1.',
    recommendedNextSign: 'now',
    quickStaffReplies: ['Estimated wait is 5 minutes.', 'Please relax in the lounge.', 'We will notify you immediately.'],
  },
  time: {
    word: 'time',
    category: 'Queue & Navigation',
    urgency: 'standard',
    icon: 'Calendar',
    civicDomain: 'Schedule & Appointment Timing',
    intentSummary: 'Visitor is asking about appointment time, schedule, or processing duration.',
    clerkAction: 'Check on-duty schedule. Confirm slot time and print verification token.',
    visitorAssurance: 'Your appointment has been confirmed. Staff will guide you to the correct counter.',
    recommendedNextSign: 'wait',
    quickStaffReplies: ['Your slot is at 11:30 AM.', 'Processing takes about 10 minutes.', 'You are next on schedule.'],
  },
  where: {
    word: 'where',
    category: 'Queue & Navigation',
    urgency: 'standard',
    icon: 'Compass',
    civicDomain: 'Facility Wayfinding & Directions',
    intentSummary: 'Visitor is asking for directions to a room, counter, restroom, or exit.',
    clerkAction: 'Display the visual facility floor map with high-visibility arrows pointing to the target.',
    visitorAssurance: 'Interactive floor plan displayed with clear navigation arrows.',
    recommendedNextSign: 'now',
    quickStaffReplies: ['Room 102 is down the left hallway.', 'Elevator is directly behind you.', 'Follow the green line.'],
  },
  now: {
    word: 'now',
    category: 'Queue & Navigation',
    urgency: 'standard',
    icon: 'Zap',
    civicDomain: 'Immediate Service Execution',
    intentSummary: 'Visitor requests immediate action or confirms readiness to proceed now.',
    clerkAction: 'Process request immediately without delay. Switch terminal to live intake.',
    visitorAssurance: 'Processing your request right now.',
    recommendedNextSign: 'please',
    quickStaffReplies: ['Processing right now.', 'Starting immediately.', 'All set to proceed.'],
  },

  // ── DIALOGUE & CIVILITY ──────────────────────────────────────────────────
  please: {
    word: 'please',
    category: 'Dialogue & Civility',
    urgency: 'courtesy',
    icon: 'HeartHandshake',
    civicDomain: 'Respectful Public Dialogue',
    intentSummary: 'Visitor expressing a polite request.',
    clerkAction: 'Smile, acknowledge with a welcoming nod, and proceed attentively.',
    visitorAssurance: 'With pleasure. We are fully at your service.',
    recommendedNextSign: 'now',
    quickStaffReplies: ['It is our pleasure.', 'Certainly, right away.', 'How may I assist?'],
  },
  thankyou: {
    word: 'thankyou',
    category: 'Dialogue & Civility',
    urgency: 'courtesy',
    icon: 'Smile',
    civicDomain: 'Service Conclusion & Feedback',
    intentSummary: 'Visitor expressing gratitude and concluding interaction.',
    clerkAction: 'Return warm acknowledgment. Hand completed paperwork and confirmation token.',
    visitorAssurance: 'You are very welcome. Have a wonderful day!',
    recommendedNextSign: 'bye',
    quickStaffReplies: ['You are very welcome!', 'Have a great day!', 'Glad we could help.'],
  },
  yes: {
    word: 'yes',
    category: 'Dialogue & Civility',
    urgency: 'courtesy',
    icon: 'Check',
    civicDomain: 'Affirmative Verification',
    intentSummary: 'Visitor confirms affirmation or agrees with option presented.',
    clerkAction: 'Record affirmative response. Proceed to next step in workflow.',
    visitorAssurance: 'Confirmed (Yes). Proceeding to next step.',
    recommendedNextSign: 'now',
    quickStaffReplies: ['Understood, proceeding.', 'Yes recorded.', 'Great, next step.'],
  },
  no: {
    word: 'no',
    category: 'Dialogue & Civility',
    urgency: 'courtesy',
    icon: 'X',
    civicDomain: 'Negative Verification / Alternative',
    intentSummary: 'Visitor declines or indicates a negative response.',
    clerkAction: 'Acknowledge decline. Present alternate option or clarification prompt.',
    visitorAssurance: 'Declined (No). Exploring alternate options for you.',
    recommendedNextSign: 'please',
    quickStaffReplies: ['Understood, skipping this.', 'Would you prefer another option?', 'No problem at all.'],
  },
  hello: {
    word: 'hello',
    category: 'Dialogue & Civility',
    urgency: 'courtesy',
    icon: 'Handshake',
    civicDomain: 'Initial Counter Greeting',
    intentSummary: 'Visitor greeting counter staff to initiate service.',
    clerkAction: 'Respond with a warm welcome. Offer assistance and make eye contact.',
    visitorAssurance: 'Welcome! We are ready to assist you.',
    recommendedNextSign: 'please',
    quickStaffReplies: ['Hello, welcome!', 'Good day, how can I help?', 'Please have a seat.'],
  },
  bye: {
    word: 'bye',
    category: 'Dialogue & Civility',
    urgency: 'courtesy',
    icon: 'LogOut',
    civicDomain: 'Service Conclusion',
    intentSummary: 'Visitor is concluding the interaction and preparing to leave.',
    clerkAction: 'Hand all completed documents and receipt. Wish the visitor well.',
    visitorAssurance: 'Goodbye! All your documents have been returned. Have a great day.',
    recommendedNextSign: 'thankyou',
    quickStaffReplies: ['Goodbye, take care!', 'Have a wonderful day!', 'Come back anytime.'],
  },
};

export const CIVIC_SECTORS = [
  {
    id: 'all',
    name: 'Full Civic Lexicon (20 Signs)',
    description: 'Complete WLASL-250 accessibility vocabulary for public service counters',
    words: Object.keys(CIVIC_CONTEXT_MAP),
  },
  {
    id: 'medical',
    name: 'Hospital & Emergency Triage',
    description: 'Illness, pain, fire emergencies, and phone call requests',
    words: ['sick', 'owie', 'fireman', 'callonphone'],
  },
  {
    id: 'admin',
    name: 'Municipal & Administrative Desk',
    description: 'Paperwork, staff identification, and process completion',
    words: ['pen', 'who', 'person', 'finish'],
  },
  {
    id: 'navigation',
    name: 'Queue & Wayfinding',
    description: 'Waiting, timing, directions, and security',
    words: ['wait', 'time', 'where', 'now', 'water', 'police'],
  },
  {
    id: 'dialogue',
    name: 'Greetings & Dialogue',
    description: 'Salutations, affirmations, and courtesy signs',
    words: ['hello', 'bye', 'please', 'thankyou', 'yes', 'no'],
  },
];

export function getCivicProtocol(word?: string): CivicActionProtocol {
  if (!word) return CIVIC_CONTEXT_MAP.wait;
  const raw = word.toLowerCase().trim();
  const normalized = raw.replace(/[\s_]+/g, '');
  return CIVIC_CONTEXT_MAP[raw] || CIVIC_CONTEXT_MAP[normalized] || CIVIC_CONTEXT_MAP.wait;
}

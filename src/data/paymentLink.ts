// ─── Interfaces ────────────────────────────────────────────────────────────────

export interface Cohort {
  id: string;
  startDate: string;   // ISO-8601, e.g. "2025-12-14"
  schedule: string;    // e.g. "7–9 PM IST" or "Weekend Track (IST)"
  seatsLeft?: number;
}

export interface Installment {
  amount: number;
  dueDate: string;
  label: string;
}

export interface DurationOption {
  id: string;
  label: string;
  price: number;
  isDefault?: boolean;
  isRecommended?: boolean;
  badge?: string;
}

export interface BumpProduct {
  id: string;
  name: string;
  description?: string;
  price: number;
  originalPrice?: number;
  sku_id: string;
  nsdc_course_name: string;
  /** Direct access URL shown as a "Get access here" CTA on the success page. Omit for email delivery. */
  accessUrl?: string;
}

export interface AudioProduct {
  id: string;
  name: string;
  description?: string;
  price: number;
  originalPrice?: number;
  sku_id: string;
  nsdc_course_name: string;
  durationLabel?: string;
  /** Direct access URL shown as a "Get access here" CTA on the success page. Omit for email delivery. */
  accessUrl?: string;
}

export interface DiscountWindow {
  discountedRemainingAmount: number;
  fullRemainingAmount: number;
  expiresAt: string;
  ctaLabel: string;
}

export interface ProgramDetails {
  title: string;
  sku_id: string;
  nsdc_course_name: string;
  isNsdcAligned: boolean;
  sscName: string;
  totalFee: number;
  bookingAmount: number;
  remainingAmount: number;
  duration_options?: DurationOption[];
  installments: Installment[];
  cohorts: Cohort[];
  defaultCohortId: string;
  features: string[];
  bump_products?: BumpProduct[];
  audio_products?: AudioProduct[];
  whatsapp_group_url?: string;
  redirect_url?: string;
  discount_window?: DiscountWindow;
}

// ─── Config ────────────────────────────────────────────────────────────────────

export const PROGRAM_DATA: ProgramDetails = {
  title: "AI Engineering Fellowship",
  sku_id: "AIEF-2025-ON",
  nsdc_course_name: "Gen AI for Tech Professionals - On Demand",

  isNsdcAligned: true,
  sscName: "Management & Entrepreneurship SSC",

  totalFee: 20000,
  bookingAmount: 5000,
  remainingAmount: 15000,

  duration_options: [
    { id: "d1",  label: "1 Month",   price: 5000  },
    { id: "d3",  label: "3 Months",  price: 12000 },
    { id: "d6",  label: "6 Months",  price: 20000, isDefault: true, isRecommended: true, badge: "Best Value" },
    { id: "d12", label: "12 Months", price: 35000 },
  ],

  installments: [
    { amount: 5000, dueDate: "2025-08-05", label: "Due 5 Aug 2025" },
    { amount: 5000, dueDate: "2025-08-15", label: "Due 15 Aug 2025" },
    { amount: 5000, dueDate: "2025-08-25", label: "Due 25 Aug 2025" },
  ],

  cohorts: [
    { id: "c3", startDate: "2026-07-05", schedule: "7–9 PM IST",         seatsLeft: 5 },
    { id: "c4", startDate: "2026-07-12", schedule: "Weekend Track (IST)", seatsLeft: 12 },
    { id: "c5", startDate: "2026-08-01", schedule: "7–9 PM IST" },
    { id: "c6", startDate: "2026-08-16", schedule: "Weekend Track (IST)" },
  ],
  defaultCohortId: "c3",

  features: [
    "Offline Induction & Demo day in Bangalore",
    "5 months of becoming a Full-Stack AI Innovator",
    "Month-long Hackathon to execute & build a Capstone project",
    "Learn directly from industry experts & future-proof your skills",
    "Be part of a global AI community driving innovation",
  ],

  bump_products: [
    {
      id: "bp1",
      name: "ChatGPT Prompts & AI Tools Pack",
      description: "250+ curated prompts and a list of 50+ AI tools to accelerate your workflow.",
      price: 13000,
      originalPrice: 20000,
      sku_id: "CGPT-PROMPTS-2025",
      nsdc_course_name: "AI Tools & Productivity",
    },
    {
      id: "bp2",
      name: "Interview Prep Bundle",
      description: "Mock interviews, resume review, and a 1:1 career coaching session.",
      price: 1499,
      originalPrice: 4999,
      sku_id: "IPB-2025-ADDON",
      nsdc_course_name: "Career Readiness for Tech Professionals",
    },
  ],

  audio_products: [
    {
      id: "ap1",
      name: "AI Fundamentals Audio Course",
      description: "8 hours of AI fundamentals — learn on the go.",
      price: 999,
      originalPrice: 2999,
      sku_id: "AFAC-2025-AUDIO",
      nsdc_course_name: "Foundational AI Concepts",
      durationLabel: "8 hours of audio content",
    },
  ],

  whatsapp_group_url: "https://chat.whatsapp.com/example-group-link",
  redirect_url: "https://outskill.com/get-started",

  discount_window: {
    discountedRemainingAmount: 12000,
    fullRemainingAmount: 15000,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    ctaLabel: "Pay Remaining at Discounted Rate",
  },
};

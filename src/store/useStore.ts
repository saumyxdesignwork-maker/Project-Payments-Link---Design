import { create } from 'zustand';
import { PROGRAM_DATA } from '../data/paymentLink';
import type { PostPaymentContext } from '../types/portal';

export type PaymentMode = 'partial' | 'full';
export type ProgramType = 'nsdc' | 'non-nsdc';
export type CheckoutScenario = 'standard' | 'no-addons' | 'full-no-addons' | 'full-with-addons';
export type BrandType = 'outskill' | 'growthschool';

export interface UserDetails {
  fullName: string;
  email: string;
  phone: string;
  /** ISO 3166-1 alpha-2 country code selected by the user on the details page.
   *  Defaults to 'IN' (India). Used by the portal to determine isIndianCustomer
   *  and therefore whether to show the NSDC registration step. */
  countryCode: string;
}

export interface GstDetails {
  companyName: string;
  gstin: string;
  billingAddress: string;
}

export type DuplicateStatus = 'idle' | 'checking' | 'found' | 'cleared';

interface AppState {
  // Core selections
  selectedCohortId: string;
  selectedDurationId: string;
  paymentMode: PaymentMode;
  programType: ProgramType;
  checkoutScenario: CheckoutScenario;
  brand: BrandType;

  // User details
  userDetails: UserDetails;
  step1Skipped: boolean;

  // Add-ons
  selectedBumpIds: string[];
  selectedAudioIds: string[];

  // GST invoice
  gstEnabled: boolean;
  gstDetails: GstDetails;

  // Duplicate payment detection
  duplicateStatus: DuplicateStatus;
  /** The masked email returned from the duplicate check, e.g. s***y@growthschool.io */
  duplicateMaskedEmail: string;

  // Actions
  setCohortId: (id: string) => void;
  setDurationId: (id: string) => void;
  setPaymentMode: (mode: PaymentMode) => void;
  setProgramType: (type: ProgramType) => void;
  setCheckoutScenario: (scenario: CheckoutScenario) => void;
  setBrand: (brand: BrandType) => void;
  setUserDetails: (details: Partial<UserDetails>) => void;
  setStep1Skipped: (v: boolean) => void;
  toggleBump: (id: string) => void;
  toggleAudio: (id: string) => void;
  setGstEnabled: (v: boolean) => void;
  setGstDetails: (details: Partial<GstDetails>) => void;
  setDuplicateStatus: (s: DuplicateStatus) => void;
  setDuplicateMaskedEmail: (email: string) => void;

  /** Called by the back button — resets duplicate check so it re-runs if
   *  the user edits their email and returns to Step 2. */
  resetDuplicateCheck: () => void;

  /** Called by "For someone else" — wipes all PII and returns to Step 1. */
  resetToStep1: () => void;

  // Post-payment portal context (set once payment completes)
  postPaymentContext: PostPaymentContext | null;
  setPostPaymentContext: (ctx: PostPaymentContext | null) => void;

  /**
   * Sum of selected bump/audio prices at the moment the user clicked Pay on Review.
   * Used so partial “booking” includes add-ons once; later installments are course remainder only.
   */
  checkoutAddonsTotal: number;
  setCheckoutAddonsTotal: (n: number) => void;

  /**
   * Set on Review “Pay” when a valid coupon was applied (e.g. 0.8 = 20% off).
   * Success + portal partial totals read this so post-checkout matches checkout.
   */
  checkoutDiscountMultiplier: number;
  setCheckoutDiscountMultiplier: (m: number) => void;

  /**
   * Flat rupee discount applied at checkout (e.g. 500 for FLAT500 coupon).
   * Subtracted after the percentage multiplier. 0 means no flat discount.
   */
  checkoutFlatDiscount: number;
  setCheckoutFlatDiscount: (n: number) => void;
}

const defaultDurationId =
  PROGRAM_DATA.duration_options?.find((d) => d.isDefault)?.id ??
  PROGRAM_DATA.duration_options?.[0]?.id ??
  '';

export const useStore = create<AppState>((set) => ({
  selectedCohortId: PROGRAM_DATA.defaultCohortId,
  selectedDurationId: defaultDurationId,
  paymentMode: 'full',
  programType: 'nsdc',
  checkoutScenario: 'standard',
  brand: 'outskill',

  userDetails: { fullName: '', email: '', phone: '', countryCode: 'IN' },
  step1Skipped: false,

  selectedBumpIds: [],
  selectedAudioIds: [],

  gstEnabled: false,
  gstDetails: { companyName: '', gstin: '', billingAddress: '' },

  duplicateStatus: 'idle',
  duplicateMaskedEmail: '',

  postPaymentContext: null,
  checkoutAddonsTotal: 0,
  checkoutDiscountMultiplier: 1,
  checkoutFlatDiscount: 0,

  setCohortId: (id) => set({ selectedCohortId: id }),
  setDurationId: (id) => set({ selectedDurationId: id }),
  setPaymentMode: (mode) => set({ paymentMode: mode }),
  setProgramType: (type) => set({ programType: type }),
  setCheckoutScenario: (scenario) => set({ checkoutScenario: scenario }),
  setBrand: (brand) => set({ brand }),
  setUserDetails: (details) =>
    set((state) => ({ userDetails: { ...state.userDetails, ...details } })),
  setStep1Skipped: (v) => set({ step1Skipped: v }),

  toggleBump: (id) =>
    set((state) => ({
      selectedBumpIds: state.selectedBumpIds.includes(id)
        ? state.selectedBumpIds.filter((x) => x !== id)
        : [...state.selectedBumpIds, id],
    })),
  toggleAudio: (id) =>
    set((state) => ({
      selectedAudioIds: state.selectedAudioIds.includes(id)
        ? state.selectedAudioIds.filter((x) => x !== id)
        : [...state.selectedAudioIds, id],
    })),

  setGstEnabled: (v) => set({ gstEnabled: v }),
  setGstDetails: (details) =>
    set((state) => ({ gstDetails: { ...state.gstDetails, ...details } })),

  setDuplicateStatus: (s) => set({ duplicateStatus: s }),
  setDuplicateMaskedEmail: (email) => set({ duplicateMaskedEmail: email }),

  resetDuplicateCheck: () =>
    set({ duplicateStatus: 'idle', duplicateMaskedEmail: '' }),

  setPostPaymentContext: (ctx) => set({ postPaymentContext: ctx }),
  setCheckoutAddonsTotal: (n) => set({ checkoutAddonsTotal: n }),
  setCheckoutDiscountMultiplier: (m) => set({ checkoutDiscountMultiplier: m }),
  setCheckoutFlatDiscount: (n) => set({ checkoutFlatDiscount: n }),

  resetToStep1: () =>
    set({
      userDetails: { fullName: '', email: '', phone: '', countryCode: 'IN' },
      step1Skipped: false,
      selectedBumpIds: [],
      selectedAudioIds: [],
      gstEnabled: false,
      gstDetails: { companyName: '', gstin: '', billingAddress: '' },
      duplicateStatus: 'idle',
      duplicateMaskedEmail: '',
      checkoutAddonsTotal: 0,
      checkoutDiscountMultiplier: 1,
      checkoutFlatDiscount: 0,
      checkoutScenario: 'standard',
    }),
}));

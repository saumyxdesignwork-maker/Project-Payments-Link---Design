/**
 * Curated list of countries used in the checkout phone field.
 *
 * `code`     — ISO 3166-1 alpha-2 country code (used to derive isIndianCustomer)
 * `name`     — Human-readable country name shown in the dropdown
 * `dialCode` — International dialling prefix (e.g. "+91")
 * `flag`     — Emoji flag for visual clarity in the selector
 * `digitLen` — Expected local phone number length (null = variable / no strict rule)
 *
 * India is placed first so it is pre-selected by default and easy to find.
 * The rest are ordered by global usage / likelihood of GrowthSchool learners.
 */

export interface Country {
  code: string;
  name: string;
  dialCode: string;
  flag: string;
  digitLen: number | null;
}

export const COUNTRIES: Country[] = [
  // ── India first (default) ────────────────────────────────────────────────────
  { code: 'IN', name: 'India',                dialCode: '+91',  flag: '🇮🇳', digitLen: 10 },

  // ── Rest of world, alphabetical ──────────────────────────────────────────────
  { code: 'AE', name: 'United Arab Emirates', dialCode: '+971', flag: '🇦🇪', digitLen: 9  },
  { code: 'AU', name: 'Australia',            dialCode: '+61',  flag: '🇦🇺', digitLen: 9  },
  { code: 'BD', name: 'Bangladesh',           dialCode: '+880', flag: '🇧🇩', digitLen: 10 },
  { code: 'BH', name: 'Bahrain',              dialCode: '+973', flag: '🇧🇭', digitLen: 8  },
  { code: 'CA', name: 'Canada',               dialCode: '+1',   flag: '🇨🇦', digitLen: 10 },
  { code: 'DE', name: 'Germany',              dialCode: '+49',  flag: '🇩🇪', digitLen: null },
  { code: 'EG', name: 'Egypt',                dialCode: '+20',  flag: '🇪🇬', digitLen: 10 },
  { code: 'ET', name: 'Ethiopia',             dialCode: '+251', flag: '🇪🇹', digitLen: 9  },
  { code: 'FR', name: 'France',               dialCode: '+33',  flag: '🇫🇷', digitLen: 9  },
  { code: 'GB', name: 'United Kingdom',       dialCode: '+44',  flag: '🇬🇧', digitLen: 10 },
  { code: 'GH', name: 'Ghana',                dialCode: '+233', flag: '🇬🇭', digitLen: 9  },
  { code: 'ID', name: 'Indonesia',            dialCode: '+62',  flag: '🇮🇩', digitLen: null },
  { code: 'IE', name: 'Ireland',              dialCode: '+353', flag: '🇮🇪', digitLen: 9  },
  { code: 'IL', name: 'Israel',               dialCode: '+972', flag: '🇮🇱', digitLen: 9  },
  { code: 'JP', name: 'Japan',                dialCode: '+81',  flag: '🇯🇵', digitLen: 10 },
  { code: 'KE', name: 'Kenya',                dialCode: '+254', flag: '🇰🇪', digitLen: 9  },
  { code: 'KW', name: 'Kuwait',               dialCode: '+965', flag: '🇰🇼', digitLen: 8  },
  { code: 'LK', name: 'Sri Lanka',            dialCode: '+94',  flag: '🇱🇰', digitLen: 9  },
  { code: 'MX', name: 'Mexico',               dialCode: '+52',  flag: '🇲🇽', digitLen: 10 },
  { code: 'MY', name: 'Malaysia',             dialCode: '+60',  flag: '🇲🇾', digitLen: null },
  { code: 'NG', name: 'Nigeria',              dialCode: '+234', flag: '🇳🇬', digitLen: 10 },
  { code: 'NL', name: 'Netherlands',          dialCode: '+31',  flag: '🇳🇱', digitLen: 9  },
  { code: 'NP', name: 'Nepal',                dialCode: '+977', flag: '🇳🇵', digitLen: 10 },
  { code: 'NZ', name: 'New Zealand',          dialCode: '+64',  flag: '🇳🇿', digitLen: null },
  { code: 'OM', name: 'Oman',                 dialCode: '+968', flag: '🇴🇲', digitLen: 8  },
  { code: 'PH', name: 'Philippines',          dialCode: '+63',  flag: '🇵🇭', digitLen: 10 },
  { code: 'PK', name: 'Pakistan',             dialCode: '+92',  flag: '🇵🇰', digitLen: 10 },
  { code: 'QA', name: 'Qatar',                dialCode: '+974', flag: '🇶🇦', digitLen: 8  },
  { code: 'SA', name: 'Saudi Arabia',         dialCode: '+966', flag: '🇸🇦', digitLen: 9  },
  { code: 'SG', name: 'Singapore',            dialCode: '+65',  flag: '🇸🇬', digitLen: 8  },
  { code: 'TZ', name: 'Tanzania',             dialCode: '+255', flag: '🇹🇿', digitLen: 9  },
  { code: 'UG', name: 'Uganda',               dialCode: '+256', flag: '🇺🇬', digitLen: 9  },
  { code: 'US', name: 'United States',        dialCode: '+1',   flag: '🇺🇸', digitLen: 10 },
  { code: 'ZA', name: 'South Africa',         dialCode: '+27',  flag: '🇿🇦', digitLen: 9  },
  { code: 'ZW', name: 'Zimbabwe',             dialCode: '+263', flag: '🇿🇼', digitLen: 9  },
];

/** Quick lookup: ISO code → Country object */
export const COUNTRY_BY_CODE: Record<string, Country> = Object.fromEntries(
  COUNTRIES.map((c) => [c.code, c]),
);

/** The default country (India) */
export const DEFAULT_COUNTRY = COUNTRIES[0];

/**
 * Returns true when the ISO country code belongs to India.
 * This is the single source of truth for the NSDC gate logic.
 */
export function isIndianCountryCode(code: string): boolean {
  return code === 'IN';
}

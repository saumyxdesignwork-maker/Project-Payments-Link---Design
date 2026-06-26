import outskillLogo from '../assets/outskill-logo.svg';
import gsLogo from '../assets/gs-logo-full.svg';
import type { BrandType } from '../store/useStore';

export interface BrandTokens {
  /** Space-separated RGB channels, e.g. "55 237 129" */
  primary: string;
  primaryHover: string;
  primaryLight: string;
  primaryForeground: string;
  hero: string;
}

export interface BrandConfig {
  id: BrandType;
  name: string;
  logo: string;
  logoAlt: string;
  /** Tailwind height class for the certificate card logo */
  cardLogoClass: string;
  tokens: BrandTokens;
}

export const BRANDS: Record<BrandType, BrandConfig> = {
  outskill: {
    id: 'outskill',
    name: 'Outskill',
    logo: outskillLogo,
    logoAlt: 'Outskill',
    cardLogoClass: 'h-4',
    tokens: {
      primary:            '30 58 47',
      primaryHover:       '22 45 36',
      primaryLight:       '232 240 235',
      primaryForeground:  '255 255 255',
      hero:               '4 27 1',
    },
  },
  growthschool: {
    id: 'growthschool',
    name: 'GrowthSchool',
    logo: gsLogo,
    logoAlt: 'GrowthSchool',
    cardLogoClass: 'h-6',
    tokens: {
      primary:            '3 10 33',
      primaryHover:       '7 20 55',
      primaryLight:       '232 234 241',
      primaryForeground:  '255 255 255',
      hero:               '3 10 33',
    },
  },
};

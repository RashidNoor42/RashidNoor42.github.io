/** Shape of public/data/cv.json — treat this as the database schema. */

export type SectionId = 'hero' | 'about' | 'skills' | 'resume' | 'portfolio' | 'contact';

export interface SiteSettings {
  siteTitle: string;
  metaDescription: string;
  accentColor: string;
  footerText: string;
  copyrightName: string;
  creditText: string;
  formspreeEndpoint: string;
  showBackToTop: boolean;
}

export interface SectionConfig {
  id: SectionId;
  navLabel: string;
  icon: string;
  title: string;
  intro: string;
  visible: boolean;
  showInNav: boolean;
}

export interface Profile {
  name: string;
  typedItems: string[];
  headline: string;
  shortIntro: string;
  bio: string;
  birthday: string; // YYYY-MM-DD
  showAge: boolean;
  website: string;
  phone: string;
  city: string;
  degree: string;
  email: string;
  availability: string;
  availabilityLabel: string;
  photo: string;
  summary: string;
}

export interface SocialLink { id: string; label: string; icon: string; url: string; showInHero: boolean; }
export interface Skill { id: string; name: string; level: number; }
export interface Education { id: string; degree: string; start: string; end: string; institution: string; description: string; }
export interface Experience { id: string; title: string; start: string; end: string; company: string; points: string[]; }
export interface Project { id: string; title: string; description: string; category: string; image: string; link: string; }

export interface CvData {
  version: number;
  updatedAt: string;
  settings: SiteSettings;
  sections: SectionConfig[];
  profile: Profile;
  social: SocialLink[];
  skills: Skill[];
  education: Education[];
  experience: Experience[];
  projects: Project[];
}

export function newId(prefix = 'i'): string {
  return prefix + Math.random().toString(36).slice(2, 9);
}

/** Minimal sanity check used before saving or importing. */
export function validateCv(d: any): string | null {
  if (!d || typeof d !== 'object') return 'Data is not an object.';
  for (const k of ['settings', 'profile']) if (!d[k] || typeof d[k] !== 'object') return `Missing "${k}".`;
  for (const k of ['sections', 'social', 'skills', 'education', 'experience', 'projects'])
    if (!Array.isArray(d[k])) return `"${k}" must be a list.`;
  return null;
}

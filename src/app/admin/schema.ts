import { CvData, newId } from '../core/cv.model';
import { formatPeriod } from '../core/format';

/**
 * Describes every editable part of cv.json. The dashboard builds its forms from this,
 * so adding a new field = add it to cv.model.ts + one line here (+ show it on the public page).
 */
export type FieldType =
  | 'text' | 'textarea' | 'url' | 'email' | 'number' | 'range'
  | 'month' | 'date' | 'color' | 'checkbox' | 'lines' | 'image' | 'icon';

export interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  help?: string;
  placeholder?: string;
  min?: number;
  max?: number;
  wide?: boolean;
}

export interface CollectionDef {
  key: keyof CvData;
  label: string;
  icon: string;
  description: string;
  kind: 'object' | 'list';
  fields: FieldDef[];
  itemLabel?: (item: any) => string;
  itemSub?: (item: any) => string;
  canAdd?: boolean;
  canRemove?: boolean;
  sortableByDate?: boolean;
  newItem?: () => any;
}

export const ICONS = [
  'bx bx-home', 'bx bx-user', 'bx bx-id-card', 'bx bx-file-blank', 'bx bx-book-content', 'bx bx-book',
  'bx bx-envelope', 'bx bx-phone', 'bx bx-map', 'bx bx-globe', 'bx bx-link', 'bx bx-bar-chart-alt-2',
  'bx bx-briefcase', 'bx bx-award', 'bx bx-code-alt', 'bx bx-code-block', 'bx bx-server', 'bx bx-data',
  'bx bx-star', 'bx bx-folder', 'bx bx-layout', 'bx bx-wrench',
  'bx bxl-github', 'bx bxl-gitlab', 'bx bxl-linkedin', 'bx bxl-twitter', 'bx bxl-facebook', 'bx bxl-instagram',
  'bx bxl-youtube', 'bx bxl-medium', 'bx bxl-dev-to', 'bx bxl-stack-overflow', 'bx bxl-whatsapp',
  'bx bxl-telegram', 'bx bxl-discord', 'bx bxl-python', 'bx bxl-angular',
];

const period = (i: any) => formatPeriod(i.start, i.end);

export const COLLECTIONS: CollectionDef[] = [
  {
    key: 'profile', label: 'Profile', icon: 'bx bx-user', kind: 'object',
    description: 'Your name, roles, photo and personal details (hero and About section).',
    fields: [
      { key: 'name', label: 'Full name', type: 'text' },
      { key: 'typedItems', label: 'Roles (typed in the hero)', type: 'lines', help: 'One per line. They cycle in the hero as >>> name.role' },
      { key: 'photo', label: 'Profile photo', type: 'image', wide: true },
      { key: 'headline', label: 'Headline', type: 'text', wide: true },
      { key: 'shortIntro', label: 'Short intro (italic)', type: 'textarea', wide: true },
      { key: 'bio', label: 'Bio paragraph', type: 'textarea', wide: true },
      { key: 'birthday', label: 'Birthday', type: 'date' },
      { key: 'showAge', label: 'Show age (calculated from birthday)', type: 'checkbox' },
      { key: 'website', label: 'Website', type: 'url' },
      { key: 'phone', label: 'Phone', type: 'text' },
      { key: 'city', label: 'City', type: 'text' },
      { key: 'degree', label: 'Degree', type: 'text' },
      { key: 'email', label: 'Email', type: 'email' },
      { key: 'availabilityLabel', label: 'Availability label', type: 'text', placeholder: 'e.g. Research, Freelance' },
      { key: 'availability', label: 'Availability value', type: 'text', placeholder: 'e.g. Available' },
      { key: 'summary', label: 'Hero summary (shown under your name)', type: 'textarea', wide: true },
    ],
  },
  {
    key: 'experience', label: 'Experience', icon: 'bx bx-briefcase', kind: 'list',
    description: 'Jobs shown under "Professional Experience". Use the arrows to reorder.',
    canAdd: true, canRemove: true, sortableByDate: true,
    itemLabel: (i) => `${i.title || 'Untitled role'} — ${i.company || '?'}`,
    itemSub: period,
    newItem: () => ({ id: newId('x'), title: '', company: '', start: '', end: '', points: [] }),
    fields: [
      { key: 'title', label: 'Job title', type: 'text' },
      { key: 'company', label: 'Company & location', type: 'text' },
      { key: 'start', label: 'Start (month)', type: 'month' },
      { key: 'end', label: 'End (month)', type: 'month', help: 'Leave empty for "Present".' },
      { key: 'points', label: 'Responsibilities / achievements', type: 'lines', wide: true, help: 'One bullet per line.' },
    ],
  },
  {
    key: 'education', label: 'Education', icon: 'bx bx-book', kind: 'list',
    description: 'Degrees and certifications shown in the Resume section.',
    canAdd: true, canRemove: true, sortableByDate: true,
    itemLabel: (i) => `${i.degree || 'Untitled'} — ${i.institution || '?'}`,
    itemSub: period,
    newItem: () => ({ id: newId('e'), degree: '', institution: '', start: '', end: '', description: '' }),
    fields: [
      { key: 'degree', label: 'Degree / certificate', type: 'text' },
      { key: 'institution', label: 'Institution', type: 'text' },
      { key: 'start', label: 'Start (month)', type: 'month' },
      { key: 'end', label: 'End (month)', type: 'month', help: 'Leave empty for "Present".' },
      { key: 'description', label: 'Description', type: 'textarea', wide: true },
    ],
  },
  {
    key: 'skills', label: 'Skills', icon: 'bx bx-bar-chart-alt-2', kind: 'list',
    description: 'Shown in the Skills section and as nodes in the hero graph (bigger level = bigger node).',
    canAdd: true, canRemove: true,
    itemLabel: (i) => i.name || 'Untitled skill',
    itemSub: (i) => `${i.level}%`,
    newItem: () => ({ id: newId('k'), name: '', level: 80 }),
    fields: [
      { key: 'name', label: 'Skill', type: 'text' },
      { key: 'level', label: 'Level (%)', type: 'range', min: 0, max: 100 },
    ],
  },
  {
    key: 'projects', label: 'Portfolio', icon: 'bx bx-book-content', kind: 'list',
    description: 'Project cards. Categories automatically become filter buttons.',
    canAdd: true, canRemove: true,
    itemLabel: (i) => i.title || 'Untitled project',
    itemSub: (i) => i.category || 'No category',
    newItem: () => ({ id: newId('p'), title: '', description: '', category: '', image: '', link: '' }),
    fields: [
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'category', label: 'Category', type: 'text', placeholder: 'e.g. ERP, Machine Learning' },
      { key: 'description', label: 'Description', type: 'textarea', wide: true },
      { key: 'image', label: 'Image', type: 'image', wide: true },
      { key: 'link', label: 'Link (optional)', type: 'url', wide: true, placeholder: 'https://github.com/…' },
    ],
  },
  {
    key: 'social', label: 'Social links', icon: 'bx bx-link', kind: 'list',
    description: 'Links shown in the hero and the contact section.',
    canAdd: true, canRemove: true,
    itemLabel: (i) => i.label || 'Untitled link',
    itemSub: (i) => i.url,
    newItem: () => ({ id: newId('s'), label: '', icon: 'bx bx-link', url: '', showInHero: true }),
    fields: [
      { key: 'label', label: 'Label', type: 'text' },
      { key: 'icon', label: 'Icon', type: 'icon' },
      { key: 'url', label: 'URL', type: 'text', wide: true, placeholder: 'https://… or mailto:…' },
      { key: 'showInHero', label: 'Show in hero (always shown in contact)', type: 'checkbox' },
    ],
  },
  {
    key: 'sections', label: 'Page sections', icon: 'bx bx-layout', kind: 'list',
    description: 'Titles, intro text, visibility and order of the page sections and the top menu.',
    itemLabel: (i) => `${i.navLabel} (${i.id})`,
    itemSub: (i) => [i.visible ? 'Visible' : 'Hidden', i.showInNav ? 'in menu' : 'not in menu'].join(', '),
    fields: [
      { key: 'navLabel', label: 'Menu label', type: 'text' },
      { key: 'icon', label: 'Icon (mobile menu)', type: 'icon' },
      { key: 'title', label: 'Section title', type: 'text' },
      { key: 'intro', label: 'Intro text', type: 'textarea', wide: true },
      { key: 'visible', label: 'Show this section', type: 'checkbox' },
      { key: 'showInNav', label: 'Show in top menu', type: 'checkbox' },
    ],
  },
  {
    key: 'settings', label: 'Site settings', icon: 'bx bx-cog', kind: 'object',
    description: 'Browser title, accent colour, footer and contact form.',
    fields: [
      { key: 'siteTitle', label: 'Browser tab title', type: 'text' },
      { key: 'accentColor', label: 'Accent colour', type: 'color' },
      { key: 'metaDescription', label: 'Search engine description', type: 'textarea', wide: true },
      { key: 'copyrightName', label: 'Copyright name', type: 'text' },
      { key: 'footerText', label: 'Footer text', type: 'textarea', wide: true },
      { key: 'creditText', label: 'Credit line (optional)', type: 'text', wide: true },
      {
        key: 'formspreeEndpoint', label: 'Formspree endpoint (contact form)', type: 'url', wide: true,
        placeholder: 'https://formspree.io/f/xxxxxxx',
        help: 'Optional. Create a free form at formspree.io and paste its URL to show a contact form. Leave empty to hide it.',
      },
      { key: 'showBackToTop', label: 'Show back-to-top button', type: 'checkbox' },
    ],
  },
];

export function collection(key: string): CollectionDef | undefined {
  return COLLECTIONS.find((c) => c.key === key);
}

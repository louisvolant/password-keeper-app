// src/app/links.ts
export interface LinkItem {
  label: string;
  href: string;
}

export const internalLinks: LinkItem[] = [
  { label: 'Home', href: '/' },
  { label: 'Confidentiality Rules', href: '/confidentiality-rules' },
  { label: 'General Conditions', href: '/general-conditions' },
];

export const externalLinks: LinkItem[] = [
  { label: 'Personnal Page', href: 'https://www.louisvolant.com' },
  { label: 'QR Code Tool', href: 'https://qr-code-tool.louisvolant.com' },
  { label: 'Random Text Generator', href: 'https://random-text-generator.louisvolant.com' },
  { label: '[ARCHIVE] Old blog', href: 'https://www.abricocotier.fr' },
];
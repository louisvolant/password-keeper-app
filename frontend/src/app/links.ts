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
  { label: 'Personal Page', href: 'https://www.louisvolant.com' },
  { label: 'QR Code Tool', href: 'https://qr-code-tool.louisvolant.com' },
  { label: 'MP3 Tool', href: 'https://mp3-tool.louisvolant.com' },
  { label: 'Random Text Generator', href: 'https://random-text-generator.louisvolant.com' },
  { label: 'Rain Under The Cloud', href: 'https://rainunderthe.cloud' },
  { label: 'My 20 years old blog', href: 'https://www.abricocotier.fr' },
];
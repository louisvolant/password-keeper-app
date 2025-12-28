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
  { label: 'MP3 Tool', href: 'https://mp3-tool.louisvolant.com' },
  { label: 'Skipass Checker', href: 'https://skipass-earlybird-checker.louisvolant.com' },
  { label: 'Sun Over The Cloud', href: 'https://sunoverthe.cloud' },
  { label: 'Build My CV', href: 'https://buildmycv.net' },
  { label: 'My 20 years old blog', href: 'https://www.abricocotier.fr' },
  { label: 'Currency Converter', href: 'https://currency-converter-pwa-js.vercel.app/' },
  { label: 'Whois', href: 'https://whois-js.vercel.app/' },
];
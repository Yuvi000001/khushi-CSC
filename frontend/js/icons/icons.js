// Inline SVG icon library (24x24, stroke). Koi emoji ya external image nahi.
const P = {
  id: '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="11" r="2"/><path d="M6 16c.6-1.4 1.8-2 3-2s2.4.6 3 2M14 10h4M14 14h4"/>',
  home: '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
  pension: '<circle cx="9" cy="7" r="3"/><path d="M3 20c0-3.3 2.7-6 6-6 1.2 0 2.3.3 3.2 1"/><path d="M14.5 15h5M17 15v6M15 18h4"/>',
  farm: '<path d="M12 21V9"/><path d="M12 9c-2-1-3-3-3-5 2 0 3 2 3 5zM12 9c2-1 3-3 3-5-2 0-3 2-3 5zM12 15c-2-1-3-3-3-5M12 15c2-1 3-3 3-5M12 20c-2-1-3-2-3-4M12 20c2-1 3-2 3-4"/>',
  health: '<path d="M12 20s-7-4.4-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.6-7 10-7 10z"/><path d="M12 9v5M9.5 11.5h5"/>',
  labor: '<path d="M4 15a8 8 0 0116 0z"/><path d="M12 7V4M3 19h18"/>',
  document: '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 16h6"/>',
  card: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M7 15h4"/>',
  rupee: '<path d="M7 5h10M7 9h10M7 5c5 0 7 2 7 4s-2 4-7 4l6 6"/>',
  bank: '<path d="M3 9l9-5 9 5M5 9v9M9 9v9M15 9v9M19 9v9M3 20h18"/>',
  shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>',
  print: '<path d="M7 9V3h10v6M7 17H4v-7h16v7h-3"/><rect x="7" y="14" width="10" height="7"/>',
  mobile: '<rect x="7" y="2.5" width="10" height="19" rx="2"/><path d="M11 18h2"/>',
  file: '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4"/><path d="M12 11v6M9.500 14.500L12 17l2.500-2.500"/>',
  ticket: '<path d="M3 7h18v4a2 2 0 000 4v4H3v-4a2 2 0 000-4z"/><path d="M14 7v12" stroke-dasharray="2 2"/>',
  phone: '<path d="M5 4h4l2 5-2.5 1.500a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z"/>',
  whatsapp: '<path d="M4 20l1.300-4A8 8 0 1112 20a8 8 0 01-3.800-1z"/><path d="M9 9c0 3 3 6 6 6l1-1.500-2-1-1 .8c-1-.4-2-1.400-2.400-2.400l.8-1-1-2z"/>',
  map: '<path d="M12 21s-7-6-7-11a7 7 0 0114 0c0 5-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
  check: '<path d="M5 12.5l4.5 4.500L19 7.500"/>',
  search: '<circle cx="11" cy="11" r="6.500"/><path d="M16 16l5 5"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6"/>',
  eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  refresh: '<path d="M20 11a8 8 0 00-14-4L4 9M4 4v5h5M4 13a8 8 0 0014 4l2-2M20 20v-5h-5"/>',
  logout: '<path d="M9 4H5v16h4M16 8l4 4-4 4M20 12H9"/>',
  dashboard: '<rect x="3" y="3" width="8" height="10" rx="1.500"/><rect x="13" y="3" width="8" height="6" rx="1.500"/><rect x="13" y="11" width="8" height="10" rx="1.500"/><rect x="3" y="15" width="8" height="6" rx="1.500"/>',
  clipboard: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4h6v3H9zM9 12h6M9 16h4"/>',
  inbox: '<path d="M3 13l3-8h12l3 8v6H3z"/><path d="M3 13h5l1 2h6l1-2h5"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1.500"/><rect x="14" y="3" width="7" height="7" rx="1.500"/><rect x="3" y="14" width="7" height="7" rx="1.500"/><rect x="14" y="14" width="7" height="7" rx="1.500"/>',
  users: '<circle cx="9" cy="8" r="3.500"/><path d="M2.500 20c0-3.500 2.900-6 6.500-6s6.500 2.500 6.500 6"/><circle cx="17" cy="9" r="2.500"/><path d="M17 14c2.500 0 4.500 1.700 4.500 4.500"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.400 3.600-7 8-7s8 2.600 8 7"/>',
  folder: '<path d="M3 6h6l2 2h10v11H3z"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.600 5.600l2.100 2.100M16.300 16.300l2.100 2.100M5.600 18.400l2.100-2.100M16.300 7.700l2.100-2.100"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/>',
  heart: '<path d="M12 20s-8-5-8-10.500A4.500 4.500 0 0112 7a4.500 4.500 0 018 2.500C20 15 12 20 12 20z"/>',
  upload: '<path d="M12 16V4M7 9l5-5 5 5M4 20h16"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  chevron: '<path d="M9 6l6 6-6 6"/>',
  arrow: '<path d="M4 12h16M14 6l6 6-6 6"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.500v.1"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>',
  chat: '<path d="M4 5h16v11H9l-5 4z"/><path d="M8 9h8M8 12h5"/>',
  toggle: '<rect x="2" y="7" width="20" height="10" rx="5"/><circle cx="16" cy="12" r="3"/>',
};

export function icon(name, size = 20, cls = '') {
  return `<svg class="ic ${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${P[name] || P.document}</svg>`;
}
export const iconNames = Object.keys(P).filter((k) => ['id','home','pension','farm','health','labor','document','card','rupee','bank','shield','edit','print','mobile','file','ticket'].includes(k));

export function logo(size = 44) {
  return `<img class="logo" src="/images/logo/logo-192.png" width="${size}" height="${size}" alt="Khushi Online Centre - CSC & Digital Services" decoding="async">`;
}

export function heroScene() {
  return `<svg viewBox="0 0 520 380" role="img" aria-label="सेवा केंद्र पर कंप्यूटर के साथ दो लोग">
  <rect x="16" y="24" width="488" height="316" rx="26" fill="#F6E3C3"/>
  <rect x="16" y="288" width="488" height="52" rx="0" fill="#EDD3A8"/>
  <rect x="48" y="62" width="72" height="88" rx="4" fill="#FFFAF0" stroke="#7A1F2B" stroke-width="4"/>
  <path d="M58 132l17-24 13 15 10-10 14 19z" fill="#D4AF37"/><circle cx="98" cy="84" r="8" fill="#F4A51C"/>
  <rect x="40" y="262" width="440" height="16" rx="4" fill="#8B5A3C"/><rect x="72" y="278" width="12" height="62" fill="#6F4630"/><rect x="436" y="278" width="12" height="62" fill="#6F4630"/>
  <rect x="112" y="192" width="76" height="72" rx="24" fill="#7A1F2B"/><circle cx="150" cy="166" r="23" fill="#E0A87A"/><path d="M127 163a23 23 0 0146 0c-9-8-37-8-46 0z" fill="#2A1D1A"/>
  <path d="M178 218l36 28" stroke="#7A1F2B" stroke-width="16" stroke-linecap="round"/>
  <rect x="372" y="192" width="76" height="72" rx="24" fill="#F4A51C"/><circle cx="410" cy="166" r="23" fill="#D9966A"/>
  <path d="M385 168c-2-34 52-34 50 0v24c-5 5-9-8-9-16-13-5-29-5-38 0 0 8-4 21-9 16z" fill="#2A1D1A"/>
  <path d="M382 218l-30 28" stroke="#F4A51C" stroke-width="16" stroke-linecap="round"/>
  <rect x="206" y="172" width="152" height="90" rx="7" fill="#2A1D1A"/><rect x="214" y="180" width="136" height="74" rx="3" fill="#FFFAF0"/>
  <rect x="222" y="188" width="52" height="8" rx="2" fill="#7A1F2B"/><rect x="222" y="202" width="118" height="5" rx="2" fill="#E0CFB5"/><rect x="222" y="212" width="96" height="5" rx="2" fill="#E0CFB5"/><rect x="222" y="226" width="40" height="14" rx="3" fill="#F4A51C"/><rect x="270" y="226" width="40" height="14" rx="3" fill="#1B9C6B"/>
  <path d="M192 262h180l-9-8H201z" fill="#BFB1A3"/>
  <rect x="452" y="230" width="28" height="32" rx="4" fill="#581520"/><path d="M466 230c-20-10-24-30-18-42 14 6 22 22 18 42zM466 230c20-10 24-30 18-42-14 6-22 22-18 42z" fill="#1B9C6B"/>
  </svg>`;
}

export function shopScene() {
  return `<svg viewBox="0 0 520 340" role="img" aria-label="खुशी ऑनलाइन सेंटर की दुकान का चित्र">
  <rect x="10" y="10" width="500" height="320" rx="24" fill="#F6E3C3"/>
  <rect x="10" y="286" width="500" height="44" fill="#EDD3A8"/>
  <rect x="70" y="70" width="380" height="216" fill="#FFFAF0" stroke="#7A1F2B" stroke-width="4"/>
  <rect x="58" y="50" width="404" height="46" rx="4" fill="#7A1F2B"/>
  <text x="260" y="80" text-anchor="middle" font-family="Tiro Devanagari Hindi, serif" font-size="24" fill="#FFFAF0">खुशी ऑनलाइन सेंटर</text>
  <g fill="#F4A51C">${[0,1,2,3,4,5,6,7].map((i) => `<path d="M${64 + i * 49.5} 96h49.500l-6 20h-37.500z" fill="${i % 2 ? '#FFFAF0' : '#F4A51C'}"/>`).join('')}</g>
  <rect x="92" y="136" width="130" height="90" rx="4" fill="#E8F1F0" stroke="#7A1F2B" stroke-width="3"/><path d="M92 181h130M157 136v90" stroke="#7A1F2B" stroke-width="2"/>
  <rect x="298" y="136" width="130" height="90" rx="4" fill="#E8F1F0" stroke="#7A1F2B" stroke-width="3"/><path d="M298 181h130M363 136v90" stroke="#7A1F2B" stroke-width="2"/>
  <rect x="236" y="150" width="48" height="136" rx="3" fill="#8B5A3C"/><circle cx="274" cy="220" r="3" fill="#F4A51C"/>
  <rect x="108" y="248" width="86" height="22" rx="3" fill="#1B9C6B"/><text x="151" y="264" text-anchor="middle" font-family="Inter, sans-serif" font-size="12" font-weight="600" fill="#fff">CSC</text>
  <rect x="330" y="248" width="86" height="22" rx="3" fill="#F4A51C"/><text x="373" y="264" text-anchor="middle" font-family="Inter, sans-serif" font-size="11" font-weight="600" fill="#2A1D1A">MP Online</text>
  <rect x="442" y="238" width="28" height="30" rx="4" fill="#581520"/><path d="M456 238c-18-9-22-28-16-40 13 6 20 20 16 40zM456 238c18-9 22-28 16-40-13 6-20 20-16 40z" fill="#1B9C6B"/>
  </svg>`;
}

const Y = (bg, inner) => `<svg viewBox="0 0 48 48" role="img" aria-hidden="true"><rect width="48" height="48" rx="12" fill="${bg}"/>${inner}</svg>`;
const W = 'fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"';
export const YOJANA_ICONS = {
  pmkisan: Y('#2E7D32', `<g ${W}><path d="M24 36V18M24 18c-4-2-5-6-5-9 4 0 5 4 5 9zM24 18c4-2 5-6 5-9-4 0-5 4-5 9zM24 27c-4-2-5-5-5-8M24 27c4-2 5-5 5-8"/></g><circle cx="35" cy="34" r="6" fill="#F57C00"/><path d="M32.500 32h5M32.500 34.500h5M32.500 32c3 0 3.500 2.500 0 2.500l3 3" stroke="#fff" stroke-width="1.500" fill="none"/>`),
  ayushman: Y('#E53935', `<path d="M24 38s-12-7-12-16a7 7 0 0112-4.500A7 7 0 0136 22c0 9-12 16-12 16z" fill="#fff"/><path d="M24 19v11M18.500 24.500h11" stroke="#E53935" stroke-width="3" stroke-linecap="round"/>`),
  eshram: Y('#2743A3', `<circle cx="19" cy="17" r="5" fill="#F9BF8A"/><path d="M10 34c0-6 4-9 9-9s9 3 9 9z" fill="#F9BF8A"/><rect x="28" y="22" width="12" height="16" rx="2" fill="#fff"/><path d="M31 27h6M31 31h6M31 35h3" stroke="#2743A3" stroke-width="1.500"/>`),
  digitalindia: Y('#FFFAF0', `<rect x="0" y="0" width="48" height="16" fill="#F4A51C"/><rect x="0" y="32" width="48" height="16" fill="#1B9C6B"/><circle cx="24" cy="24" r="8" fill="#FFFAF0" stroke="#7A1F2B" stroke-width="2"/><path d="M24 17v14M17 24h14M19 19l10 10M29 19L19 29" stroke="#7A1F2B" stroke-width="1"/>`),
  pmay: Y('#F57C00', `<g ${W}><path d="M9 25L24 12l15 13"/><path d="M13 23v14h22V23"/><path d="M21 37v-9h6v9"/></g>`),
  csc: Y('#7A1F2B', `<rect x="10" y="11" width="28" height="19" rx="2" fill="none" stroke="#fff" stroke-width="2.400"/><path d="M19 38h10M24 30v8" stroke="#fff" stroke-width="2.400" stroke-linecap="round"/><text x="24" y="25" text-anchor="middle" font-family="Inter, sans-serif" font-size="9" font-weight="700" fill="#F4A51C">CSC</text>`),
  samagra: Y('#1B9C6B', `<rect x="9" y="13" width="30" height="22" rx="3" fill="none" stroke="#fff" stroke-width="2.400"/><circle cx="18" cy="22" r="3" fill="#fff"/><circle cx="26" cy="23" r="2.200" fill="#fff"/><path d="M13 31c1-3 3-4 5-4s4 1 5 4M23 31c.800-2 2-3 3-3s2 1 3 3M32 21h3M32 26h3" stroke="#fff" stroke-width="1.800" fill="none" stroke-linecap="round"/>`),
  ration: Y('#8D6E63', `<g ${W}><path d="M14 9h14l7 7v23H14z"/><path d="M28 9v7h7M19 24h11M19 30h11"/></g>`),
  pension: Y('#7B1FA2', `<circle cx="19" cy="16" r="5" fill="#fff"/><path d="M9 36c0-7 4-10 10-10s10 3 10 10z" fill="#fff"/><circle cx="35" cy="31" r="7" fill="#F4A51C"/><path d="M32 29h6M32 32h6M32 29c4 0 4 3 0 3l4 3.500" stroke="#2A1D1A" stroke-width="1.500" fill="none"/>`),
  pan: Y('#1565C0', `<rect x="8" y="13" width="32" height="22" rx="3" fill="none" stroke="#fff" stroke-width="2.400"/><circle cx="17" cy="23" r="3.500" fill="#fff"/><path d="M25 20h10M25 25h10M25 30h6M12 31c1-2 3-3 5-3s4 1 5 3" stroke="#fff" stroke-width="1.800" fill="none" stroke-linecap="round"/>`),
};

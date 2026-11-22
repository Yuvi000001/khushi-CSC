import { api } from '../api.js';
import { CONFIG } from '../config.js';
import { DEFAULT_SERVICES } from '../data.js';
import { esc } from '../utils.js';
import { icon, YOJANA_ICONS } from '../icons/icons.js';
import { paymentAction } from './payment.js';

export const CATS = { govt: 'सरकारी एवं पंचायत सेवाएं', identity: 'पहचान एवं वित्तीय सेवाएं', digital: 'डिजिटल एवं इंटरनेट कैफे सेवाएं' };
export const CHIPS = [['all', 'सभी'], ['govt', 'सरकारी सेवाएं'], ['identity', 'पहचान व वित्तीय'], ['digital', 'डिजिटल सेवाएं']];

const DEFAULT_YOJANA = [
  { slug: 'pmkisan', name: 'पीएम किसान सम्मान निधि', nameEn: 'PM Kisan Samman Nidhi', description: 'किसानों को सालाना आर्थिक सहायता।', descriptionEn: 'Annual financial assistance for farmers.', category: 'कृषि', categoryEn: 'Agriculture' },
  { slug: 'ayushman', name: 'आयुष्मान भारत', nameEn: 'Ayushman Bharat', description: 'पात्र परिवारों के लिए स्वास्थ्य बीमा कवर।', descriptionEn: 'Health insurance coverage for eligible families.', category: 'स्वास्थ्य', categoryEn: 'Health' },
  { slug: 'eshram', name: 'ई-श्रम', nameEn: 'e-Shram', description: 'असंगठित श्रमिकों का राष्ट्रीय पंजीकरण।', descriptionEn: 'National registration for unorganised workers.', category: 'श्रम', categoryEn: 'Labour' },
  { slug: 'digitalindia', name: 'डिजिटल इंडिया', nameEn: 'Digital India', description: 'सेवाओं का डिजिटल और सुलभ वितरण।', descriptionEn: 'Accessible digital delivery of services.', category: 'डिजिटल', categoryEn: 'Digital' },
  { slug: 'pmay', name: 'प्रधानमंत्री आवास योजना', nameEn: 'Pradhan Mantri Awas Yojana', description: 'पात्र परिवारों को पक्के घर में सहायता।', descriptionEn: 'Housing assistance for eligible families.', category: 'आवास', categoryEn: 'Housing' },
  { slug: 'csc', name: 'कॉमन सर्विस सेंटर (CSC)', nameEn: 'Common Service Centre (CSC)', description: 'गाँव तक डिजिटल सेवाओं की पहुँच।', descriptionEn: 'Bringing digital services to villages.', category: 'सेवाएं', categoryEn: 'Services' },
  { slug: 'samagra', name: 'समग्र आईडी', nameEn: 'Samagra ID', description: 'मध्य प्रदेश के परिवारों की एकीकृत पहचान।', descriptionEn: 'Unified identification for families in Madhya Pradesh.', category: 'पहचान', categoryEn: 'Identity' },
  { slug: 'ration', name: 'राशन कार्ड', nameEn: 'Ration Card', description: 'सार्वजनिक वितरण प्रणाली का पात्रता कार्ड।', descriptionEn: 'Eligibility card for the public distribution system.', category: 'खाद्य सुरक्षा', categoryEn: 'Food Security' },
  { slug: 'pension', name: 'पेंशन योजनाएं', nameEn: 'Pension Schemes', description: 'वृद्ध, विधवा और दिव्यांग जनों को मासिक सहायता।', descriptionEn: 'Monthly assistance for older adults, widows, and people with disabilities.', category: 'सामाजिक सुरक्षा', categoryEn: 'Social Security' },
  { slug: 'pan', name: 'पैन कार्ड', nameEn: 'PAN Card', description: 'आयकर और वित्तीय कामों की पहचान संख्या।', descriptionEn: 'Identification number for tax and financial services.', category: 'वित्त', categoryEn: 'Finance' },
];

export async function fetchSchemes() {
  try { return (await api('/schemes')).data; }
  catch { return DEFAULT_YOJANA; }
}

let cache = null;
export async function fetchServices() {
  if (cache) return cache;
  try { cache = (await api('/services')).data; if (!cache.length) cache = DEFAULT_SERVICES; }
  catch { cache = DEFAULT_SERVICES; } // server na chale tab bhi list dikhe
  return cache;
}

export const serviceTile = (s) => `
  <a class="svc-tile" href="/services/${esc(s.slug)}" data-link data-cat="${esc(s.category)}" data-reveal>
    <span class="svc-ic" data-img="/images/services/${esc(s.slug)}" data-alt="${esc(s.name)}">${icon(s.icon, 26)}</span>
    <span class="svc-name" data-i18n-en="${esc(s.nameEn || '')}">${esc(s.name)}</span>
    <span class="svc-en">${esc(s.nameEn)}</span>
  </a>`;

export const chipsBar = (active = 'all') => `<div class="chips" role="tablist" aria-label="श्रेणी">${CHIPS.map(([k, t]) => `<button type="button" role="tab" class="chip${k === active ? ' active' : ''}" data-chip="${k}" aria-selected="${k === active}">${t}</button>`).join('')}</div>`;

export const yojanaSection = (schemes = DEFAULT_YOJANA) => `
  <section class="yojana" aria-labelledby="yojana-h">
    <div class="container">
      <h2 id="yojana-h" data-reveal>सरकारी योजनाएं</h2>
      <p class="section-sub" data-reveal>जिन योजनाओं में हम आवेदन और जानकारी में सहायता करते हैं।</p>
      <div class="yojana-grid">${schemes.map((scheme) => `
        <article class="yojana-item" data-reveal>
          ${scheme.imageUrl
    ? `<span class="yojana-ic"><img src="${esc(scheme.imageUrl)}" alt="${esc(scheme.name)}" loading="lazy"></span>`
    : `<span class="yojana-ic" data-img="/images/yojana/${esc(scheme.slug)}" data-alt="${esc(scheme.name)}">${YOJANA_ICONS[scheme.icon || scheme.slug] || icon('document', 32)}</span>`}
          <div><h3 data-i18n-en="${esc(scheme.nameEn || '')}">${esc(scheme.name)}</h3><p data-i18n-en="${esc(scheme.descriptionEn || '')}">${esc(scheme.description || '')}</p><span class="yojana-cat" data-i18n-en="${esc(scheme.categoryEn || '')}">${esc(scheme.category || '')}</span>${paymentAction(scheme, 'scheme')}</div>
        </article>`).join('')}
      </div>
      <p class="yojana-note">All yojana logos and scheme names are the property of their respective government departments and are used here for identification purposes only.</p>
    </div>
  </section>`;

// Chips + search se cards chhupana/dikhana (home aur services dono me)
export function bindFilter(root) {
  let cat = 'all', q = '';
  const apply = () => {
    root.querySelectorAll('.svc-tile').forEach((t) => {
      const ok = (cat === 'all' || t.dataset.cat === cat) && (!q || t.textContent.toLowerCase().includes(q));
      t.hidden = !ok;
    });
    root.querySelectorAll('.svc-group').forEach((g) => { g.hidden = ![...g.querySelectorAll('.svc-tile')].some((t) => !t.hidden); });
    const none = root.querySelector('.svc-empty');
    if (none) none.hidden = [...root.querySelectorAll('.svc-tile')].some((t) => !t.hidden);
  };
  root.addEventListener('click', (e) => {
    const c = e.target.closest('[data-chip]'); if (!c) return;
    cat = c.dataset.chip;
    root.querySelectorAll('[data-chip]').forEach((x) => { const on = x === c; x.classList.toggle('active', on); x.setAttribute('aria-selected', String(on)); });
    apply();
  });
  const s = root.querySelector('#svc-search');
  if (s) s.addEventListener('input', () => { q = s.value.trim().toLowerCase(); apply(); });
}

// images/ folder me asli image rakhne par (jaise images/yojana/pmkisan.png) wo apne aap
// custom icon ki jagah dikhne lagti hai. Nahi mile to icon hi rehta hai.
const EXTS = ['png', 'webp', 'jpg', 'jpeg', 'svg'];
function probe(base) {
  const key = `ko_img_${base}`;
  let cached = null;
  try { cached = sessionStorage.getItem(key); } catch { /* ignore */ }
  if (cached !== null) return Promise.resolve(cached === 'none' ? null : cached);
  return new Promise((resolve) => {
    let i = 0;
    const done = (v) => { try { sessionStorage.setItem(key, v || 'none'); } catch { /* ignore */ } resolve(v); };
    const next = () => {
      if (i >= EXTS.length) return done(null);
      const src = `${base}.${EXTS[i++]}`;
      const im = new Image();
      im.onload = () => done(src);
      im.onerror = next;
      im.src = src;
    };
    next();
  });
}
export function useRealImages(root) {
  if (!CONFIG.USE_REAL_IMAGES) return;
  root.querySelectorAll('[data-img]').forEach(async (el) => {
    const src = await probe(el.dataset.img);
    if (!src || !el.isConnected) return;
    el.innerHTML = `<img src="${src}" alt="${esc(el.dataset.alt || '')}" loading="lazy">`;
    el.classList.add('has-photo');
  });
}

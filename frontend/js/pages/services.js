import { CONFIG } from '../config.js';
import { icon } from '../icons/icons.js';
import { fetchServices, fetchSchemes, serviceTile, chipsBar, bindFilter, useRealImages, CATS, yojanaSection } from '../components/service-card.js';
import { bindPaymentActions } from '../components/payment.js';

export const meta = { title: 'हमारी सेवाएं', desc: `CSC और MP Online की सभी सेवाएं - सरकारी, पहचान एवं वित्तीय, डिजिटल और इंटरनेट कैफे सेवाएं। ईमेल: ${CONFIG.EMAIL}` };

export async function render() {
  const [services, schemes] = await Promise.all([fetchServices(), fetchSchemes()]);
  const groups = Object.entries(CATS).map(([k, title]) => {
    const list = services.filter((s) => s.category === k);
    return list.length ? `<section class="svc-group"><h2 data-reveal>${title}</h2><div class="svc-grid">${list.map(serviceTile).join('')}</div></section>` : '';
  }).join('');
  return `
  <section class="page-hero"><div class="container">
    <h1>हमारी सेवाएं</h1>
    <p>सरकारी योजनाओं, डिजिटल सेवाओं और ऑनलाइन काम के लिए पूरी सहायता, एक ही स्थान पर।</p>
  </div></section>
  <div id="svc-page" class="container svc-page">
    <div class="search">${icon('search', 18)}<input id="svc-search" type="search" placeholder="सेवा खोजें..." aria-label="सेवा खोजें" autocomplete="off"></div>
    ${chipsBar()}
    ${groups}
    <p class="svc-empty" hidden>कोई सेवा नहीं मिली। कृपया दूसरा शब्द खोजें या हमें कॉल करें।</p>
    <p class="svc-foot">सभी सेवाएं उपलब्धता, पात्रता और आधिकारिक पोर्टल उपलब्धता पर निर्भर हैं।</p>
  </div>
  ${yojanaSection(schemes)}`;
}

export function mount(root) { bindFilter(root.querySelector('#svc-page')); bindPaymentActions(root); useRealImages(root); }

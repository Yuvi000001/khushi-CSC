import { CONFIG } from '../config.js';
import { icon } from '../icons/icons.js';
import { useRealImages } from '../components/service-card.js';

export const meta = { title: 'हमारे बारे में', desc: 'खुशी ऑनलाइन सेंटर - विदिशा के राम द्वारा में CSC और MP Online सेवाओं का केंद्र। संचालक: Kop Singh Malviya।' };

export function render() {
  const info = [['id', 'CSC ID', CONFIG.CSC_ID], ['user', 'संचालक', CONFIG.OWNER], ['map', 'स्थान', CONFIG.ADDRESS], ['phone', 'मोबाइल', CONFIG.MOBILE]];
  const values = [['check', 'सुविधा', 'एक ही जगह पर कई सेवाएं, कम भागदौड़।'], ['heart', 'स्वच्छ सेवा', 'साफ़ और ईमानदार प्रक्रिया, बिना किसी अतिरिक्त दबाव के।'], ['shield', 'विश्वसनीय सहायता', 'आपकी जानकारी गोपनीय रहती है; हम OTP या PIN कभी नहीं मांगते।']];
  return `
  <section class="page-hero about-hero"><div class="container about-grid">
    <div>
      <h1>हमारे बारे में</h1>
      <h2 class="about-sub">${CONFIG.NAME_HI}</h2>
      <p>${CONFIG.NAME_HI}, CSC और MP Online की डिजिटल सेवाओं का केंद्र है। राम द्वारा, विदिशा के नागरिकों को सरकारी योजनाओं, प्रमाण पत्रों और ऑनलाइन कामों में सरल मार्गदर्शन देना हमारा उद्देश्य है।</p>
      <p>यह सरकारी वेबसाइट नहीं है; हम अधिकृत CSC केंद्र के रूप में सेवाओं में सहायता करते हैं। सेवाएं पात्रता और आधिकारिक पोर्टल की उपलब्धता पर निर्भर हैं।</p>
    </div>
    <div class="about-art" data-img="/images/banners/shop" data-alt="${CONFIG.NAME_HI}"><div class="logo-panel"><img src="/images/logo/logo-512.png" alt="Khushi Online Centre" width="320" height="320" decoding="async"></div></div>
  </div></section>
  <section class="container info-cards">${info.map(([ic, k, v]) => `<div class="info-card" data-reveal><span>${icon(ic, 22)}</span><div><small>${k}</small><strong>${v}</strong></div></div>`).join('')}</section>
  <section class="container values"><h2 data-reveal>हमारी कार्यशैली</h2>
    <div class="values-grid">${values.map(([ic, t, d]) => `<div class="value" data-reveal><span>${icon(ic, 30)}</span><h3>${t}</h3><p>${d}</p></div>`).join('')}</div>
    <blockquote class="quote" data-reveal>डिजिटल सेवा, हर नागरिक के लिए</blockquote>
  </section>`;
}

export function mount(root) { useRealImages(root); }

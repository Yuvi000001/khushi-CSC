import { CONFIG } from '../config.js';
import { icon } from '../icons/icons.js';

export function renderFooter() {
  document.getElementById('site-footer').innerHTML = `
  <footer class="footer">
    <div class="container footer-grid">
      <div>
        <h3>${CONFIG.NAME_HI}</h3>
        <p>CSC एवं MP Online की सेवाएं - सरल और भरोसेमंद तरीके से।</p>
        <p class="muted-light">CSC ID : ${CONFIG.CSC_ID}<br>संचालक : ${CONFIG.OWNER}</p>
      </div>
      <div><h4>जल्दी पहुँचें</h4><ul>
        <li><a href="/" data-link>होम</a></li><li><a href="/services" data-link>सेवाएं</a></li>
        <li><a href="/about" data-link>हमारे बारे में</a></li><li><a href="/contact" data-link>संपर्क</a></li></ul></div>
      <div><h4>लोकप्रिय सेवाएं</h4><ul>
        <li><a href="/services/samagra" data-link>समग्र आईडी एवं KYC</a></li><li><a href="/services/ration" data-link>राशन कार्ड</a></li>
        <li><a href="/services/pan" data-link>पैन कार्ड</a></li><li><a href="/services/pmkisan" data-link>पीएम किसान</a></li></ul></div>
      <div><h4>संपर्क</h4><ul class="contact-list">
        <li>${icon('phone', 16)}<a href="${CONFIG.CALL}">${CONFIG.MOBILE}</a></li>
        <li>${icon('mail', 16)}<a href="mailto:${CONFIG.EMAIL}">${CONFIG.EMAIL}</a></li>
        <li>${icon('whatsapp', 16)}<a href="${CONFIG.WHATSAPP}" target="_blank" rel="noopener">WhatsApp</a></li>
        <li>${icon('map', 14)}<a href="${CONFIG.MAPS}" target="_blank" rel="noopener">${CONFIG.ADDRESS_SHORT}</a></li></ul></div>
    </div>
    <div class="footer-note"><div class="container">
      <p>अस्वीकरण: यह सरकारी वेबसाइट नहीं है। सेवाएं पात्रता, पोर्टल की उपलब्धता और आधिकारिक अनुमति पर निर्भर हैं। सरकारी शुल्क अलग से लगेगा। हम कभी भी Aadhaar नंबर, OTP या Bank PIN नहीं मांगते।</p>
      <p>© ${new Date().getFullYear()} ${CONFIG.NAME_EN}</p>
    </div></div>
  </footer>`;
}

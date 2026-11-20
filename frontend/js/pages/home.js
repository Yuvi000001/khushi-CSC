import { CONFIG } from '../config.js';
import { icon } from '../icons/icons.js';
import { fetchServices, serviceTile, chipsBar, bindFilter, useRealImages } from '../components/service-card.js';
import { esc } from '../utils.js';

export const meta = { title: '', desc: 'खुशी ऑनलाइन सेंटर, विदिशा - CSC एवं MP Online की सेवाएं: समग्र आईडी, राशन कार्ड, पैन कार्ड, पीएम किसान, आयुष्मान कार्ड और अन्य।' };

export async function render() {
  const services = await fetchServices();
  const quick = services.slice(0, 8).map((s) => `
    <a class="quick" href="/services/${esc(s.slug)}" data-link><span class="quick-ic">${icon(s.icon, 24)}</span><span>${esc(s.name)}</span></a>`).join('');
  return `
  <section class="hero">
    <div class="container hero-grid">
      <div class="hero-copy">
        <h1>खुशी ऑनलाइन सेंटर में आपका स्वागत है</h1>
        <p class="hero-sub">CSC एवं MP Online की विश्वसनीय सेवाएं — एक ही स्थान पर, सरल और सुविधाजनक तरीके से।</p>
        <ul class="hero-badges">
          <li>${icon('id', 18)}<span>CSC ID : ${CONFIG.CSC_ID}</span></li>
          <li>${icon('map', 18)}<span>${CONFIG.ADDRESS_SHORT}</span></li>
        </ul>
        <div class="hero-cta">
          <a class="btn btn-primary" href="/services" data-link>सेवाएं देखें</a>
          <a class="btn btn-wa" href="${CONFIG.WHATSAPP}" target="_blank" rel="noopener">${icon('whatsapp', 18)}WhatsApp करें</a>
          <a class="btn btn-saffron" href="${CONFIG.CALL}">${icon('phone', 18)}कॉल करें</a>
        </div>
        <h2 class="quick-h">हमारी प्रमुख सेवाएं</h2>
        <div class="quick-grid">${quick}</div>
      </div>
      <div class="hero-art" data-img="/images/banners/hero" data-alt="${CONFIG.NAME_HI}"><div class="logo-panel"><img src="/images/logo/logo-512.png" alt="Khushi Online Centre - CSC &amp; Digital Services" width="360" height="360" decoding="async"></div></div>
    </div>
  </section>

  <section class="strip" aria-label="संपर्क जानकारी">
    <div class="container strip-grid">
      <a href="${CONFIG.CALL}">${icon('phone', 20)}<span>${CONFIG.MOBILE}</span></a>
      <a href="${CONFIG.MAPS}" target="_blank" rel="noopener">${icon('map', 20)}<span>${CONFIG.ADDRESS_SHORT}</span></a>
      <span>${icon('globe', 20)}<span>MP Online</span></span>
      <span>${icon('shield', 20)}<span>Digital India</span></span>
    </div>
  </section>

  <section class="how container">
    <div>
      <h2 data-reveal>कैसे काम करता है?</h2>
      <ol class="steps">
        <li class="step"><span class="step-n">1</span><p>सेवा चुनें और हमसे संपर्क करें</p></li>
        <li class="step-arrow" aria-hidden="true">${icon('arrow', 22)}</li>
        <li class="step"><span class="step-n">2</span><p>आवश्यक दस्तावेज़ लेकर आएं</p></li>
        <li class="step-arrow" aria-hidden="true">${icon('arrow', 22)}</li>
        <li class="step"><span class="step-n">3</span><p>सेवा प्राप्त करें</p></li>
      </ol>
    </div>
    <aside class="about-card" data-reveal>
      <h2>हमारे बारे में</h2>
      <p>हमारा उद्देश्य है कि नागरिकों को डिजिटल सेवाओं का लाभ सरल और सुगम तरीके से मिले।</p>
      <a class="btn btn-primary btn-sm" href="/about" data-link>और जानें</a>
    </aside>
  </section>

  <section class="home-services container" id="home-services">
    <h2 data-reveal>हमारी सेवाएं</h2>
    ${chipsBar()}
    <div class="svc-grid">${services.map(serviceTile).join('')}</div>
    <p class="svc-empty" hidden>इस श्रेणी में अभी कोई सेवा नहीं है।</p>
    <p class="center"><a class="btn btn-ghost" href="/services" data-link>सभी सेवाएं देखें</a></p>
  </section>`;
}

export function mount(root) { bindFilter(root.querySelector('#home-services')); useRealImages(root); }

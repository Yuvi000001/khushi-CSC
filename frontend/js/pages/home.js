import { CONFIG } from '../config.js';
import { api } from '../api.js';
import { icon } from '../icons/icons.js';
import { fetchServices, serviceTile, chipsBar, bindFilter, useRealImages } from '../components/service-card.js';
import { esc } from '../utils.js';

export const meta = { title: '', desc: 'खुशी ऑनलाइन सेंटर, विदिशा - CSC एवं MP Online की सेवाएं: समग्र आईडी, राशन कार्ड, पैन कार्ड, पीएम किसान, आयुष्मान कार्ड और अन्य।' };
let adSlides = [];
let adIntervalSeconds = 2;
let slideTimer = null;
let slideCleanup = null;

export async function render() {
  const services = await fetchServices();
  adSlides = [];
  adIntervalSeconds = 2;
  try {
    const response = await api('/ads');
    if (!Array.isArray(response.data)) throw new Error('होम विज्ञापन की सूची उपलब्ध नहीं है।');
    const seconds = response.intervalSeconds === undefined ? 2 : Number(response.intervalSeconds);
    if (!Number.isInteger(seconds) || seconds < 1 || seconds > 10) throw new Error('होम स्लाइड का समय अमान्य है।');
    adSlides = response.data;
    adIntervalSeconds = seconds;
  } catch (error) {
    console.error('होम विज्ञापन लोड नहीं हो सके।', error);
  }
  const heroArt = adSlides.length > 1
    ? `<div class="hero-art home-ad-carousel" role="region" aria-label="खुशी ऑनलाइन सेंटर के विज्ञापन"><div class="home-ad-track" data-home-ad-track>
        <img src="${esc(adSlides[0].url)}" alt="${esc(adSlides[0].alt || 'खुशी ऑनलाइन सेंटर का विज्ञापन')}" fetchpriority="high" decoding="async">
        <img src="${esc(adSlides[1].url)}" alt="${esc(adSlides[1].alt || 'खुशी ऑनलाइन सेंटर का विज्ञापन')}" loading="eager" decoding="async">
      </div></div>`
    : adSlides.length === 1
      ? `<div class="hero-art home-ad-carousel" role="region" aria-label="खुशी ऑनलाइन सेंटर का विज्ञापन"><img src="${esc(adSlides[0].url)}" alt="${esc(adSlides[0].alt || 'खुशी ऑनलाइन सेंटर का विज्ञापन')}" fetchpriority="high" decoding="async"></div>`
      : `<div class="hero-art" data-img="/images/banners/hero" data-alt="${CONFIG.NAME_HI}"><div class="logo-panel"><img src="/images/logo/logo-512.png" alt="Khushi Online Centre - CSC &amp; Digital Services" width="360" height="360" decoding="async"></div></div>`;
  const quick = services.slice(0, 8).map((s) => `
    <a class="quick" href="/services/${esc(s.slug)}" data-link><span class="quick-ic">${icon(s.icon, 24)}</span><span data-i18n-en="${esc(s.nameEn || '')}">${esc(s.name)}</span></a>`).join('');
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
          <a class="btn btn-ghost" href="/forms" data-link>${icon('file', 18)}फॉर्म डाउनलोड</a>
          <a class="btn btn-wa" href="${CONFIG.WHATSAPP}" target="_blank" rel="noopener">${icon('whatsapp', 18)}WhatsApp करें</a>
          <a class="btn btn-saffron" href="${CONFIG.CALL}">${icon('phone', 18)}कॉल करें</a>
        </div>
        <h2 class="quick-h">हमारी प्रमुख सेवाएं</h2>
        <div class="quick-grid">${quick}</div>
      </div>
      ${heroArt}
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

export function mount(root) {
  cleanup();
  bindFilter(root.querySelector('#home-services'));
  useRealImages(root);
  const frame = root.querySelector('.home-ad-carousel');
  if (!frame) return;
  const track = root.querySelector('[data-home-ad-track]');
  if (!track || adSlides.length < 2) {
    return;
  }
  frame.style.setProperty('--home-ad-slide-duration', `${Math.min(1200, adIntervalSeconds * 700)}ms`);
  let index = 0;
  let transitioning = false;
  const finishSlide = (event) => {
    if (event && (event.target !== track || event.propertyName !== 'transform')) return;
    if (!transitioning) return;
    transitioning = false;
    track.style.transition = 'none';
    track.append(track.firstElementChild);
    track.style.transform = 'translateX(0)';
    track.offsetWidth;
    track.style.transition = '';
    index = (index + 1) % adSlides.length;
    const next = track.children[1];
    const nextSlide = adSlides[(index + 1) % adSlides.length];
    next.src = nextSlide.url;
    next.alt = nextSlide.alt || 'खुशी ऑनलाइन सेंटर का विज्ञापन';
  };
  const beforeSlide = () => {
    const next = track.children[1];
    if (!next.complete || !next.naturalWidth) return;
    transitioning = true;
    track.style.transform = 'translateX(-50%)';
  };
  track.addEventListener('transitionend', finishSlide);
  slideCleanup = () => {
    track.removeEventListener('transitionend', finishSlide);
    frame.style.removeProperty('--home-ad-slide-duration');
  };
  slideTimer = window.setInterval(() => {
    if (transitioning) return;
    beforeSlide();
  }, adIntervalSeconds * 1000);
}

export function cleanup() {
  if (slideTimer) window.clearInterval(slideTimer);
  slideTimer = null;
  if (slideCleanup) slideCleanup();
  slideCleanup = null;
}

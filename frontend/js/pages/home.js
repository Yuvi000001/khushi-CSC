import { CONFIG } from '../config.js';
import { api } from '../api.js';
import { icon } from '../icons/icons.js';
import { bindPaymentActions } from '../components/payment.js';
import { fetchServices, serviceTile, chipsBar, bindFilter, useRealImages } from '../components/service-card.js';
import { esc } from '../utils.js';

export const meta = { title: '', desc: `खुशी ऑनलाइन सेंटर, विदिशा - CSC एवं MP Online की सेवाएं: समग्र आईडी, राशन कार्ड, पैन कार्ड, पीएम किसान, आयुष्मान कार्ड और अन्य। ईमेल: ${CONFIG.EMAIL}` };
let adSlides = [];
let adIntervalSeconds = 2;
let slideTimer = null;
let slideCleanup = null;
let slideIndex = 0;

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
    ? `<div class="hero-art home-ad-carousel" role="region" aria-label="खुशी ऑनलाइन सेंटर के विज्ञापन">
        <div class="home-ad-viewport">
          <div class="home-ad-track" data-home-ad-track>
            ${adSlides.map((slide, index) => `<img src="${esc(slide.url)}" alt="${esc(slide.alt || 'खुशी ऑनलाइन सेंटर का विज्ञापन')}" ${index ? 'loading="lazy"' : 'fetchpriority="high"'} decoding="async">`).join('')}
            <img src="${esc(adSlides[0].url)}" alt="" aria-hidden="true" loading="eager" decoding="async">
          </div>
        </div>
        <div class="home-ad-controls">
          <div class="home-ad-dots" role="group" aria-label="विज्ञापन चुनें">
            ${adSlides.map((_, index) => `<button type="button" class="home-ad-dot" data-home-ad-index="${index}" aria-label="विज्ञापन ${index + 1} दिखाएं"${index === 0 ? ' aria-current="true"' : ''}></button>`).join('')}
          </div>
        </div>
      </div>`
    : adSlides.length === 1
      ? `<div class="hero-art home-ad-carousel" role="region" aria-label="खुशी ऑनलाइन सेंटर का विज्ञापन"><img src="${esc(adSlides[0].url)}" alt="${esc(adSlides[0].alt || 'खुशी ऑनलाइन सेंटर का विज्ञापन')}" fetchpriority="high" decoding="async"></div>`
      : `<div class="hero-art" data-img="/images/banners/hero" data-alt="${CONFIG.NAME_HI}"><div class="logo-panel"><img src="/images/logo/logo-512.png" alt="Khushi Online Centre - CSC &amp; Digital Services" width="360" height="360" decoding="async"></div></div>`;
  const quick = services.slice(0, 8).map((s) => `
    <a class="quick" href="/services/${esc(s.slug)}" data-link><span class="quick-ic">${icon(s.icon, 24)}</span><span data-i18n-en="${esc(s.nameEn || '')}">${esc(s.name)}</span></a>`).join('');
  return `
  <section class="hero">
    <div class="container hero-grid${adSlides.length ? ' home-ad-grid' : ''}">
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
          <button class="btn btn-ghost" type="button" data-any-payment>${icon('rupee', 18)}Razorpay से भुगतान करें</button>
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
      <a href="mailto:${CONFIG.EMAIL}">${icon('mail', 20)}<span>${CONFIG.EMAIL}</span></a>
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
  bindPaymentActions(root);
  useRealImages(root);
  const frame = root.querySelector('.home-ad-carousel');
  if (!frame) return;
  const track = root.querySelector('[data-home-ad-track]');
  if (!track || adSlides.length < 2) {
    return;
  }
  slideIndex = 0;
  frame.style.setProperty('--home-ad-slide-duration', `${Math.min(1200, adIntervalSeconds * 700)}ms`);
  track.style.width = `${(adSlides.length + 1) * 100}%`;
  [...track.children].forEach((image) => {
    image.style.flex = `0 0 ${100 / (adSlides.length + 1)}%`;
    image.style.width = `${100 / (adSlides.length + 1)}%`;
  });
  const dots = [...frame.querySelectorAll('[data-home-ad-index]')];
  let pointerStart = null;
  const update = () => {
    track.style.transform = `translateX(-${slideIndex * 100 / (adSlides.length + 1)}%)`;
    dots.forEach((dot, index) => {
      if (index === slideIndex % adSlides.length) dot.setAttribute('aria-current', 'true');
      else dot.removeAttribute('aria-current');
    });
  };
  const nextSlide = () => {
    slideIndex = Math.min(slideIndex + 1, adSlides.length);
    update();
  };
  const onTransitionEnd = (event) => {
    if (event.target !== track || event.propertyName !== 'transform' || slideIndex !== adSlides.length) return;
    track.style.transition = 'none';
    slideIndex = 0;
    track.style.transform = 'translateX(0)';
    track.offsetWidth;
    track.style.transition = '';
    update();
  };
  const stopTimer = () => {
    if (slideTimer) window.clearTimeout(slideTimer);
    slideTimer = null;
  };
  const schedule = () => {
    stopTimer();
    if (pointerStart || document.hidden) return;
    slideTimer = window.setTimeout(() => {
      nextSlide();
      schedule();
    }, adIntervalSeconds * 1000);
  };
  const goTo = (index) => {
    slideIndex = (index + adSlides.length) % adSlides.length;
    update();
    schedule();
  };
  const onDotClick = (event) => {
    const dot = event.target.closest('[data-home-ad-index]');
    if (dot) goTo(Number(dot.dataset.homeAdIndex));
  };
  const onPointerDown = (event) => {
    if (event.target.closest('button')) return;
    pointerStart = { x: event.clientX, y: event.clientY };
    stopTimer();
    frame.setPointerCapture(event.pointerId);
  };
  const onPointerUp = (event) => {
    if (!pointerStart) return;
    const deltaX = event.clientX - pointerStart.x;
    const deltaY = event.clientY - pointerStart.y;
    pointerStart = null;
    if (deltaX <= -40 && Math.abs(deltaX) > Math.abs(deltaY)) nextSlide();
    schedule();
  };
  const onPointerCancel = () => {
    pointerStart = null;
    schedule();
  };
  const onVisibilityChange = () => schedule();
  frame.querySelector('.home-ad-dots').addEventListener('click', onDotClick);
  frame.addEventListener('pointerdown', onPointerDown);
  frame.addEventListener('pointerup', onPointerUp);
  frame.addEventListener('pointercancel', onPointerCancel);
  track.addEventListener('transitionend', onTransitionEnd);
  document.addEventListener('visibilitychange', onVisibilityChange);
  slideCleanup = () => {
    stopTimer();
    frame.querySelector('.home-ad-dots').removeEventListener('click', onDotClick);
    frame.removeEventListener('pointerdown', onPointerDown);
    frame.removeEventListener('pointerup', onPointerUp);
    frame.removeEventListener('pointercancel', onPointerCancel);
    track.removeEventListener('transitionend', onTransitionEnd);
    document.removeEventListener('visibilitychange', onVisibilityChange);
    frame.style.removeProperty('--home-ad-slide-duration');
    track.style.removeProperty('width');
    track.style.removeProperty('transform');
    track.style.removeProperty('transition');
    [...track.children].forEach((image) => {
      image.style.removeProperty('flex');
      image.style.removeProperty('width');
    });
  };
  schedule();
}

export function cleanup() {
  if (slideTimer) window.clearTimeout(slideTimer);
  slideTimer = null;
  if (slideCleanup) slideCleanup();
  slideCleanup = null;
}

import { createScope } from './gsap-config.js';

export function initPageAnimations(root) {
  createScope((gsap, cond) => {
    const q = (s) => [...root.querySelectorAll(s)];

    // Hero: heading + baaki cheezein
    const h1 = q('.hero h1');
    if (h1.length) {
      const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });
      tl.from(h1, { opacity: 0, y: 28, rotate: 1.2, duration: 0.7 })
        .from(q('.hero-sub, .hero-badges, .hero-cta'), { opacity: 0, y: 16, duration: 0.5, stagger: 0.12 }, '-=0.35');
      if (cond.desktop) {
        const art = q('.hero-art:not(.home-ad-carousel)');
        if (art.length) gsap.to(art, { y: -8, duration: 3, ease: 'sine.inOut', repeat: -1, yoyo: true });
      }
    }

    if (!window.ScrollTrigger) return;

    // Section headings aur cards scroll par
    const items = q('[data-reveal]');
    if (items.length) {
      gsap.set(items, { opacity: 0, y: 18 });
      window.ScrollTrigger.batch(items, {
        start: 'top 90%', once: true,
        onEnter: (els) => gsap.to(els, { opacity: 1, y: 0, duration: 0.45, stagger: 0.06, ease: 'power2.out', overwrite: true }),
      });
    }

    // Process steps ek ke baad ek
    const steps = q('.steps .step');
    if (steps.length) {
      gsap.set(steps, { opacity: 0, x: -14 });
      gsap.to(steps, { opacity: 1, x: 0, duration: 0.45, stagger: 0.25, ease: 'power2.out',
        scrollTrigger: { trigger: steps[0].parentElement, start: 'top 85%', once: true } });
    }
  });
}

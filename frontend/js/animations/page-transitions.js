import { motionOk, gsapReady } from './gsap-config.js';

export function pageOut(el) {
  if (!motionOk()) return Promise.resolve();
  return new Promise((res) => window.gsap.to(el, { opacity: 0, y: -8, duration: 0.16, ease: 'power1.in', onComplete: res }));
}
export function pageIn(el) {
  if (!gsapReady()) return;
  if (!motionOk()) { el.style.opacity = ''; el.style.transform = ''; return; }
  window.gsap.fromTo(el, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out', clearProps: 'opacity,transform' });
}

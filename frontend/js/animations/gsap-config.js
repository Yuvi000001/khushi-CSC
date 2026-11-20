// GSAP sirf ek baar register hota hai. Agar GSAP load na ho ya reduced-motion ho to
// koi animation nahi chalta aur poora content seedha dikhta hai.
let registered = false;
let scope = null;

export const gsapReady = () => typeof window.gsap !== 'undefined';
export const motionOk = () => gsapReady() && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function initGsap() {
  if (registered || !gsapReady()) return;
  if (window.ScrollTrigger) window.gsap.registerPlugin(window.ScrollTrigger);
  registered = true;
}

// Route badalne par purane animations/ScrollTriggers hata deta hai
export function killScope() {
  if (scope) { scope.revert(); scope = null; }
}

// fn(gsap, { desktop, mobile }) -> matchMedia ke andar chalta hai
export function createScope(fn) {
  killScope();
  if (!motionOk()) return;
  initGsap();
  scope = window.gsap.matchMedia();
  scope.add({ desktop: '(min-width: 769px)', mobile: '(max-width: 768px)' }, (ctx) => fn(window.gsap, ctx.conditions));
}

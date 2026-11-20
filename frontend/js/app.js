import { loadSession, logout } from './api.js';
import { initRouter, navigate } from './router.js';
import { renderNavbar, initNavbarEvents } from './components/navbar.js';
import { renderFooter } from './components/footer.js';
import { toast } from './components/notifications.js';
import { initGsap } from './animations/gsap-config.js';

(async function start() {
  initGsap();
  renderFooter();
  initNavbarEvents();
  await loadSession();
  document.addEventListener('session-change', () => { if (!document.body.classList.contains('is-admin')) renderNavbar(location.pathname); });
  document.addEventListener('click', async (e) => {
    if (!e.target.closest('[data-logout]')) return;
    await logout();
    toast('आप लॉगआउट हो गए हैं।');
    navigate('/');
  });
  initRouter();
})();

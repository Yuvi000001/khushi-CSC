import { loadSession, logout } from './api.js';
import { initRouter, navigate } from './router.js';
import { renderNavbar, initNavbarEvents } from './components/navbar.js';
import { renderFooter } from './components/footer.js';
import { initFaqChat } from './components/faq-chat.js';
import { toast } from './components/notifications.js';
import { initGsap } from './animations/gsap-config.js';
import { initLanguage } from './i18n.js';

(async function start() {
  initLanguage();
  initGsap();
  renderFooter();
  initFaqChat();
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

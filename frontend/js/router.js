import { session } from './api.js';
import { renderNavbar } from './components/navbar.js';
import { showLoader, hideLoader } from './components/loader.js';
import { pageOut, pageIn } from './animations/page-transitions.js';
import { killScope } from './animations/gsap-config.js';
import { initPageAnimations } from './animations/scroll-animations.js';
import { setMeta, esc } from './utils.js';

const R = (path, page, o = {}) => ({ path, page, ...o });
const ROUTES = [
  R('/', 'home'), R('/services', 'services'), R('/services/:slug', 'service-detail'), R('/about', 'about'), R('/contact', 'contact'), R('/forms', 'forms'),
  R('/login', 'login', { guest: true }), R('/register', 'register', { guest: true }),
  R('/forgot-password', 'forgot-password'), R('/reset-password', 'forgot-password'),
  R('/profile', 'profile', { auth: true }), R('/my-applications', 'my-applications', { auth: true }),
  R('/admin', 'admin-dashboard', { admin: true }), R('/admin/applications', 'admin-applications', { admin: true }),
  R('/admin/enquiries', 'admin-enquiries', { admin: true }), R('/admin/services', 'admin-services', { admin: true }),
  R('/admin/schemes', 'admin-schemes', { admin: true }), R('/admin/ads', 'admin-ads', { admin: true }),
  R('/admin/users', 'admin-users', { admin: true }), R('/admin/files', 'admin-files', { admin: true }),
  R('/admin/settings', 'admin-settings', { admin: true }),
].map((r) => ({ ...r, re: new RegExp(`^${r.path.replace(/:[a-z]+/g, '([^/]+)')}$`), keys: [...r.path.matchAll(/:([a-z]+)/g)].map((m) => m[1]) }));

let mod = null;
let seq = 0;

function match(path) {
  for (const r of ROUTES) {
    const m = path.match(r.re);
    if (m) return { route: r, params: Object.fromEntries(r.keys.map((k, i) => [k, decodeURIComponent(m[i + 1])])) };
  }
  return null;
}

export const safeNext = (n) => (n && n.startsWith('/') && !n.startsWith('//') ? n : null);

export function navigate(url, { replace = false } = {}) {
  history[replace ? 'replaceState' : 'pushState']({}, '', url);
  return render();
}

async function render() {
  const my = ++seq;
  const main = document.getElementById('main');
  const url = new URL(location.href);
  const path = url.pathname.replace(/\/+$/, '') || '/';
  const found = match(path);
  const query = Object.fromEntries(url.searchParams.entries());

  if (found) {
    const { route } = found;
    if ((route.auth || route.admin) && !session.user) return navigate(`/login?next=${encodeURIComponent(path)}`, { replace: true });
    if (route.admin && session.user.role !== 'admin') return navigate('/profile', { replace: true });
    if (route.guest && session.user) return navigate(session.user.role === 'admin' ? '/admin' : '/profile', { replace: true });
  }

  killScope();
  if (mod && mod.cleanup) { try { mod.cleanup(); } catch { /* ignore */ } }
  await pageOut(main);
  if (my !== seq) return;

  const isAdmin = !!(found && found.route.admin);
  document.body.classList.toggle('is-admin', isAdmin);
  if (!isAdmin) renderNavbar(path);

  showLoader();
  try {
    if (!found) {
      mod = null;
      main.innerHTML = `<section class="container notfound"><h1>पेज नहीं मिला</h1><p>आप जो पेज ढूँढ रहे हैं वह मौजूद नहीं है।</p><a class="btn btn-primary" href="/" data-link>होम पर जाएं</a></section>`;
      setMeta('पेज नहीं मिला');
    } else {
      const m = await import(`./pages/${found.route.page}.js`);
      const ctx = { params: found.params, query, path };
      const html = await m.render(ctx);
      if (my !== seq) return;
      mod = m;
      main.innerHTML = html;
      setMeta(m.meta && m.meta.title, m.meta && m.meta.desc);
      if (m.mount) await m.mount(main, ctx);
    }
  } catch (err) {
    main.innerHTML = `<section class="container notfound"><h1>पेज लोड नहीं हो सका</h1><p>${esc(err.message || 'कुछ गलत हो गया।')}</p><a class="btn btn-primary" href="">दोबारा कोशिश करें</a></section>`;
  } finally { hideLoader(); }
  if (my !== seq) return;
  window.scrollTo(0, 0);
  pageIn(main);
  initPageAnimations(main);
  main.focus({ preventScroll: true });
}

export function initRouter() {
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[data-link]');
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || a.target === '_blank') return;
    const href = a.getAttribute('href');
    if (!href || !href.startsWith('/')) return;
    e.preventDefault();
    if (href === location.pathname + location.search) return;
    navigate(href);
  });
  window.addEventListener('popstate', render);
  return render();
}

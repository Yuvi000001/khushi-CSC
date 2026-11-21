import { CONFIG } from '../config.js';
import { adminShell } from '../components/sidebar.js';
import { esc } from '../utils.js';

export const meta = { title: 'सेटिंग्स', desc: '' };

export function render() {
  const rows = [['केंद्र का नाम', CONFIG.NAME_EN], ['CSC ID', CONFIG.CSC_ID], ['संचालक', CONFIG.OWNER], ['मोबाइल', CONFIG.MOBILE], ['ईमेल', CONFIG.EMAIL], ['पता', CONFIG.ADDRESS], ['Backend (API) पता', CONFIG.API_BASE_URL || 'इसी डोमेन पर (खाली)'], ['वेबसाइट डोमेन', CONFIG.SITE_URL]];
  return adminShell('/admin/settings', 'सेटिंग्स', `<section class="panel"><h2>साइट की जानकारी</h2>
    <dl class="kv">${rows.map(([k, v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`).join('')}</dl>
    <p class="muted">इन्हें बदलने के लिए <code>frontend/js/config.js</code> फ़ाइल खोलें। ईमेल, डेटाबेस और Cloudinary की सेटिंग <code>backend/.env</code> में रहती हैं - वे ब्राउज़र में कभी नहीं दिखतीं।</p></section>`);
}

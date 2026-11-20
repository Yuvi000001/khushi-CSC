let n = 0;
export function showLoader() { n++; const l = document.getElementById('loader'); if (l) l.hidden = false; }
export function hideLoader() { n = Math.max(0, n - 1); if (!n) { const l = document.getElementById('loader'); if (l) l.hidden = true; } }
export const skeleton = (rows = 3) => `<div class="skeleton-wrap" aria-busy="true">${'<div class="skeleton"></div>'.repeat(rows)}</div>`;

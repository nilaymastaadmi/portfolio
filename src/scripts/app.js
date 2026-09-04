// Page wiring. Runs on every page load, including ClientRouter navigations.
import { get, set, motionOn } from './prefs.js';
const html = document.documentElement;

function applyFlags() {
  html.dataset.motion = get('motion', 'on');
  html.dataset.sound = get('sound', 'off');
  html.classList.toggle('js-motion', motionOn());
}
applyFlags();

let teardown = [];
async function init() {
  applyFlags();
  // toggles
  document.querySelectorAll('[data-toggle]').forEach((b) => {
    const k = b.dataset.toggle, on = get(k, k === 'motion' ? 'on' : 'off') === 'on';
    b.setAttribute('aria-pressed', String(on));
    b.textContent = `${k[0].toUpperCase() + k.slice(1)}: ${on ? 'on' : 'off'}`;
    b.onclick = () => { set(k, on ? 'off' : 'on'); init(); };
  });
  // menu
  const btn = document.querySelector('[data-menu]'), menu = document.getElementById('menu');
  if (btn && menu) btn.onclick = () => { const o = menu.dataset.open !== 'true'; menu.dataset.open = String(o); btn.setAttribute('aria-expanded', String(o)); };
  // CV dialog
  const dlg = document.getElementById('cv-dialog');
  if (dlg) {
    document.querySelectorAll('[data-cv]').forEach((a) => { a.onclick = (e) => { e.preventDefault(); const f = dlg.querySelector('iframe'); if (!f.src) f.src = f.dataset.src; dlg.showModal(); }; });
    dlg.querySelector('[data-cv-close]').onclick = () => dlg.close();
    dlg.onclick = (e) => { if (e.target === dlg) dlg.close(); };
  }
  // pages
  if (html.dataset.page === 'home') { const m = await import('./home.js'); teardown.push(m.init()); }
  if (html.dataset.page === 'station') { const m = await import('./station.js'); teardown.push(m.init()); }
  if (!motionOn()) document.querySelectorAll('.night-section').forEach((s) => s.classList.add('lit'));
}
document.addEventListener('astro:page-load', init);
document.addEventListener('astro:before-swap', () => { teardown.forEach((t) => typeof t === 'function' && t()); teardown = []; });

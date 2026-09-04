// Station page: doors open on arrival, close on leaving; arrow keys move along the line.
import { navigate } from 'astro:transitions/client';
import { motionOn } from './prefs.js';

export function init() {
  const doors = document.querySelector('[data-doors]');
  const kills = [];
  const motion = motionOn();

  if (doors) {
    if (!motion) doors.remove();
    else {
      requestAnimationFrame(() => requestAnimationFrame(() => doors.classList.add('open')));
      const done = () => doors.remove();
      doors.querySelector('.door.l').addEventListener('transitionend', done, { once: true });
      setTimeout(done, 1200);
    }
  }

  function leave(href) {
    if (!motion) return navigate(href);
    const d = document.createElement('div');
    d.className = 'doors open'; d.setAttribute('aria-hidden', 'true');
    d.innerHTML = '<div class="door l"></div><div class="door r"></div>';
    document.body.appendChild(d);
    void d.offsetWidth;
    d.classList.add('closing'); d.classList.remove('open');
    setTimeout(() => navigate(href), 380);
  }
  document.querySelectorAll('[data-leave]').forEach((a) => {
    const h = (e) => { if (e.metaKey || e.ctrlKey || e.shiftKey || e.button) return; e.preventDefault(); leave(a.getAttribute('href')); };
    a.addEventListener('click', h); kills.push(() => a.removeEventListener('click', h));
  });

  const onKey = (e) => {
    if (e.target.closest('input, textarea, [contenteditable]')) return;
    const map = { ArrowLeft: 'prev', ArrowRight: 'next', Escape: 'map' };
    const key = map[e.key]; if (!key) return;
    const a = document.querySelector(`[data-leave][data-key="${key}"]`); if (!a) return;
    e.preventDefault(); leave(a.getAttribute('href'));
  };
  addEventListener('keydown', onKey); kills.push(() => removeEventListener('keydown', onKey));

  // the window video starts after the page is in, and only when motion is on
  const v = document.querySelector('.window video[data-src]');
  if (v && motion) { const start = () => { v.src = v.dataset.src; v.play().catch(() => {}); }; document.readyState === 'complete' ? setTimeout(start, 600) : addEventListener('load', () => setTimeout(start, 600), { once: true }); }

  // Plain to Engineer slider: the words roll over at the halfway point, remembered per visitor
  const tone = document.querySelector('[data-tone-control] input'), how = document.querySelector('[data-how]');
  if (tone && how) {
    const apply = (v) => { const tech = v > 0.5; how.dataset.tone = tech ? 'tech' : 'plain'; how.querySelector('.how-plain').setAttribute('aria-hidden', String(tech)); how.querySelector('.how-tech')?.setAttribute('aria-hidden', String(!tech)); };
    let saved = 0; try { saved = Number(localStorage.getItem('tone') || 0); } catch {}
    tone.value = String(saved > 0.5 ? 1 : 0); apply(saved);
    const onInput = () => apply(Number(tone.value));
    const onChange = () => { const v = Number(tone.value) > 0.5 ? 1 : 0; tone.value = String(v); apply(v); try { localStorage.setItem('tone', String(v)); } catch {} };
    tone.addEventListener('input', onInput); tone.addEventListener('change', onChange);
    kills.push(() => { tone.removeEventListener('input', onInput); tone.removeEventListener('change', onChange); });
  }

  // only the first strip's marker carries the shared-element name
  document.querySelectorAll('.door-strip .here').forEach((h, i) => { h.style.viewTransitionName = i === 0 ? 'station' : ''; });
  return () => kills.forEach((k) => k());
}

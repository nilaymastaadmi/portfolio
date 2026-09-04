// Home: map entrance, lane focus, station signs, idle train, corridor tunnel, card tilt, lamps.
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { navigate } from 'astro:transitions/client';
import { motionOn } from './prefs.js';
gsap.registerPlugin(ScrollTrigger);

const visibleSvgs = (root) => [...root.querySelectorAll('svg')].filter((s) => s.getClientRects().length > 0);

export function init() {
  const reduce = !motionOn();
  const debug = location.hash;
  const phone = matchMedia('(max-width: 760px)').matches;
  const card = document.getElementById('map-card');
  const stage = document.getElementById('map-stage');
  const sign = document.getElementById('sign');
  const sections = document.querySelectorAll('.night-section');
  const kills = [];
  let tl = null, raf = 0, current = null, run = null, visible = false, prevT = 0, signFor = null;
  if (!card || !stage) return () => {};
  if (reduce) sections.forEach((s) => s.classList.add('lit'));
  const svgs = visibleSvgs(stage);

  // 1. entrance: the visible map draws on when the card scrolls in (a timer draws it regardless)
  if (!reduce && svgs.length) {
    tl = gsap.timeline({ defaults: { ease: 'power3.out' }, scrollTrigger: { trigger: card, start: 'top 80%', once: true } });
    for (const s of svgs) {
      const lines = s.querySelectorAll('.line-path'), st = s.querySelectorAll('.station'), labels = s.querySelectorAll('.label');
      gsap.set(lines, { strokeDasharray: 1, strokeDashoffset: 1 });
      gsap.set(st, { scale: 0, transformOrigin: '50% 50%' });
      gsap.set(labels, { opacity: 0, y: 4 });
      tl.to(lines, { strokeDashoffset: 0, duration: 1.3, stagger: 0.18 }, 0)
        .to(st, { scale: 1, duration: 0.45, stagger: 0.04, ease: 'back.out(1.6)' }, 1.0)
        .to(labels, { opacity: 1, y: 0, duration: 0.4, stagger: 0.02 }, 1.5);
    }
    const fallback = setTimeout(() => { if (tl && tl.progress() === 0) tl.play(); }, 4000);
    kills.push(() => clearTimeout(fallback));
  }

  // 2. lane focus
  const lanes = document.querySelectorAll('.lane[data-lane]');
  const on = (el) => !current || (el.dataset.lines || el.dataset.line || '').split(' ').includes(current);
  function setLane(lane) {
    current = current === lane ? null : lane;
    lanes.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lane === current)));
    stage.querySelectorAll('.line-path, .station').forEach((el) => gsap.to(el, { opacity: on(el) ? 1 : 0.12, duration: reduce ? 0 : 0.35, ease: 'power2.out', overwrite: 'auto' }));
    stage.querySelectorAll('svg').forEach((s) => { const sts = s.querySelectorAll('.station'); s.querySelectorAll('.label').forEach((el, i) => gsap.to(el, { opacity: on(sts[i]) ? 1 : 0.12, duration: reduce ? 0 : 0.35, overwrite: 'auto' })); });
    if (current) startTrain(current);
  }
  lanes.forEach((b) => { const h = () => setLane(b.dataset.lane); b.addEventListener('click', h); kills.push(() => b.removeEventListener('click', h)); });

  // 3. station signs on hover and keyboard focus
  let bios = {};
  try { bios = JSON.parse(document.getElementById('station-data')?.textContent || '{}'); } catch { bios = {}; }
  function showSign(a) {
    const d = bios[a.dataset.slug]; if (!sign || !d) return;
    signFor = a;
    sign.querySelector('.sign-line').style.background = d.colors.length > 1 ? `linear-gradient(90deg, ${d.colors[0]} 50%, ${d.colors[1]} 50%)` : d.colors[0];
    sign.querySelector('.sign-kind').textContent = `${d.kind} · ${d.lines}${d.state === 'construction' ? ' · under construction' : ''}`;
    sign.querySelector('.sign-title').textContent = d.title;
    sign.querySelector('.sign-bio').textContent = d.bio;
    const r = a.getBoundingClientRect(), c = card.getBoundingClientRect();
    const x = r.left + r.width / 2 - c.left, y = r.top - c.top;
    const below = y < 150;
    sign.classList.toggle('below', below);
    sign.style.left = `${Math.min(Math.max(x, 140), c.width - 140)}px`;
    sign.style.top = `${below ? y + r.height + 12 : y - 12}px`;
    sign.hidden = false;
    requestAnimationFrame(() => sign.classList.add('on'));
  }
  function hideSign() { if (!sign) return; signFor = null; sign.classList.remove('on'); setTimeout(() => { if (!signFor) sign.hidden = true; }, 180); }
  const over = (e) => { const a = e.target.closest('a.station'); if (a) showSign(a); };
  const out = (e) => { const a = e.target.closest('a.station'); if (a && !(e.relatedTarget && a.contains(e.relatedTarget))) hideSign(); };
  for (const [ev, fn] of [['mouseover', over], ['mouseout', out], ['focusin', over], ['focusout', out]]) { stage.addEventListener(ev, fn); kills.push(() => stage.removeEventListener(ev, fn)); }

  // 4. station click: a ghost dot carries the shared-element name into the carriage
  const onClick = (e) => {
    const a = e.target.closest('a.station'); if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
    e.preventDefault();
    if (!reduce && 'startViewTransition' in document) {
      const r = a.querySelector('circle').getBoundingClientRect();
      const g = document.createElement('div'); g.className = 'vt-ghost';
      g.style.left = `${r.left + r.width / 2 - 9}px`; g.style.top = `${r.top + r.height / 2 - 9}px`;
      document.body.appendChild(g); window.__ghostAt = Date.now();
    }
    navigate(a.getAttribute('href'));
  };
  document.addEventListener('click', onClick); kills.push(() => document.removeEventListener('click', onClick));

  // 5. idle train: along one line, pauses at stations, then the next line; only while in view
  const train = stage.querySelector('.train-html');
  const order = ['hardware', 'ml', 'markets', 'systems', 'community'];
  const speed = 46;
  function measure() { const s = visibleSvgs(stage)[0]; if (!s) return null; const r = s.getBoundingClientRect(), m = stage.getBoundingClientRect(); return { svg: s, k: r.width / s.viewBox.baseVal.width, ox: r.left - m.left, oy: r.top - m.top }; }
  function startTrain(lineId) {
    if (!train || reduce) return;
    const px = measure(); if (!px) return;
    const path = px.svg.querySelector(`.line-path[data-line="${lineId}"]`); if (!path) return;
    const L = path.getTotalLength();
    const stops = [...px.svg.querySelectorAll(`.station[data-lines~="${lineId}"]`)].map((a) => ({ x: +a.dataset.x, y: +a.dataset.y }));
    const stopAt = stops.map((s) => { let best = 0, bd = 1e9; for (let d = 0; d <= L; d += 3) { const p = path.getPointAtLength(d); const dd = (p.x - s.x) ** 2 + (p.y - s.y) ** 2; if (dd < bd) { bd = dd; best = d; } } return best; }).sort((a, b) => a - b);
    run = { path, L, stopAt, d: 0, pauseUntil: 0, lineId, px, nextStop: 0 };
  }
  function tick(t) {
    raf = requestAnimationFrame(tick);
    if (!run || !visible) { prevT = t; gsap.set(train, { opacity: 0 }); return; }
    const dt = Math.min(0.05, (t - prevT) / 1000); prevT = t;
    if (t < run.pauseUntil) return;
    run.d += speed * dt;
    if (run.nextStop < run.stopAt.length && run.d >= run.stopAt[run.nextStop]) { run.d = run.stopAt[run.nextStop]; run.nextStop++; run.pauseUntil = t + 1100; }
    if (run.d >= run.L) { const i = (order.indexOf(run.lineId) + 1) % order.length; startTrain(current || order[i]); return; }
    const p = run.path.getPointAtLength(run.d), q = run.path.getPointAtLength(Math.min(run.L, run.d + 2));
    const ang = (Math.atan2(q.y - p.y, q.x - p.x) * 180) / Math.PI;
    gsap.set(train, { opacity: 1, x: run.px.ox + p.x * run.px.k - 16, y: run.px.oy + p.y * run.px.k - 16, rotation: Math.abs(ang) > 90 ? ang + 180 : ang });
  }
  if (train && !reduce && debug !== '#notrain') {
    const io = new IntersectionObserver((es) => { visible = es[0].isIntersecting; }, { threshold: 0.05 });
    io.observe(card); kills.push(() => io.disconnect());
    startTrain('hardware'); raf = requestAnimationFrame(tick);
    kills.push(() => cancelAnimationFrame(raf));
  }

  // 6. tunnel: the corridor walls stream past as the planned extension scrolls through (desktop)
  const tunnel = document.getElementById('tunnel');
  if (tunnel && !reduce && !phone) {
    tunnel.querySelectorAll('.corridor .rails').forEach((r) => {
      const left = r.closest('.cwall').classList.contains('l');
      kills.push(gsap.fromTo(r, { xPercent: left ? 0 : -50 }, { xPercent: left ? -50 : 0, ease: 'none', scrollTrigger: { trigger: tunnel, start: 'top bottom', end: 'bottom top', scrub: 0.4 } }).scrollTrigger);
    });
  }

  // 7. the paper card tilts a little as it scrolls through (desktop); lamps light their sections once
  if (!reduce && !phone && debug !== '#notilt') {
    gsap.set(card, { transformPerspective: 1400, transformOrigin: '50% 0%' });
    kills.push(gsap.fromTo(card, { rotateX: 5, transformPerspective: 1400 }, { rotateX: -2, transformPerspective: 1400, ease: 'none', scrollTrigger: { trigger: card, start: 'top 90%', end: 'bottom 15%', scrub: 0.5 } }).scrollTrigger);
  }
  sections.forEach((s) => kills.push(ScrollTrigger.create({ trigger: s, start: 'top 72%', once: true, onEnter: () => s.classList.add('lit') })));

  const onResize = () => { if (run) run.px = measure() || run.px; ScrollTrigger.refresh(); };
  addEventListener('resize', onResize);
  return () => { kills.forEach((k) => k && (typeof k === 'function' ? k() : k.kill?.())); tl?.kill(); removeEventListener('resize', onResize); };
}

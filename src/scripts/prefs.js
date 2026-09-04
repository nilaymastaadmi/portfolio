// Motion and sound preferences. No imports, so nothing depends on module order.
const prefersReduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
export const get = (k, d) => { try { return localStorage.getItem(k) ?? d; } catch { return d; } };
export const set = (k, v) => { try { localStorage.setItem(k, v); } catch {} };
export const motionOn = () => !prefersReduced() && get('motion', 'on') === 'on';
export const soundOn = () => get('sound', 'off') === 'on';

// node scripts/test-metro.mjs : checks the map layout on the real content.
import { layout, strip, neighbours, PRESETS } from '../src/lib/metro.js';
import { lines, stations } from '../src/data/content.js';

let fails = 0;
const check = (ok, msg) => { if (!ok) { fails++; console.log('FAIL', msg); } };

for (const orient of ['landscape', 'portrait']) {
  const L = layout(lines, stations, PRESETS[orient]);
  console.log(`${orient}: ${L.w}x${L.h}, ${L.stations.length} stations, ${L.lines.length} lines`);
  // interchange sits between its two rows and appears in both line station lists
  for (const s of L.stations.filter((s) => s.interchange)) {
    check(s.row % 1 === 0.5, `${s.slug} interchange row ${s.row} not a midpoint`);
    for (const id of s.lines) check(L.lines.find((l) => l.id === id).stations.includes(s.slug), `${s.slug} missing from line ${id}`);
  }
  // no two stations share a cell; same-row neighbours at least one column apart
  const seen = new Set();
  for (const s of L.stations) { const k = `${s.col},${s.row}`; check(!seen.has(k), `cell collision at ${k} (${s.slug})`); seen.add(k); }
  // every path point inside the viewbox
  for (const l of L.lines) for (const m of l.d.matchAll(/[ML](-?[\d.]+) (-?[\d.]+)/g)) {
    check(+m[1] >= 0 && +m[1] <= L.w && +m[2] >= 0 && +m[2] <= L.h, `${l.id} path point (${m[1]},${m[2]}) outside ${L.w}x${L.h}`);
  }
  // label alternation: same-row single-line neighbours alternate sides
  const byRow = {};
  for (const s of L.stations) (byRow[s.row] ||= []).push(s);
  for (const row of Object.values(byRow)) {
    row.sort((a, b) => a.col - b.col);
    for (let i = 1; i < row.length; i++) if (!row[i].interchange && !row[i - 1].interchange && orient === 'landscape')
      check(Math.sign(row[i].label.y - row[i].y) !== Math.sign(row[i - 1].label.y - row[i - 1].y), `labels on same side: ${row[i - 1].slug}, ${row[i].slug}`);
  }
  if (orient === 'landscape') for (const l of L.lines) console.log(`  ${l.id.padEnd(10)} ${l.stations.join(' > ')}`);
}
const st = strip(lines[2], stations);
check(st.stations.length === 5, `ml strip has ${st.stations.length} stations, expected 5`);
const n = neighbours(lines[2], stations, 'pcb-drishti');
check(n.prev?.slug === 'market-query-agent' && n.next?.slug === 'document-qa', `pcb neighbours ${n.prev?.slug} / ${n.next?.slug}`);
console.log(fails ? `${fails} FAILURES` : 'all checks passed');
process.exit(fails ? 1 : 0);

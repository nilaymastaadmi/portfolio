// Metro map geometry from data. Pure functions, no DOM.
// layout(lines, stations, { orient }) -> { w, h, lines:[{id,d,color}], stations:[{slug,x,y,...}] }

export function validate(lines, stations) {
  const rowOf = Object.fromEntries(lines.map((l, i) => [l.id, i]));
  const slugs = new Set();
  for (const s of stations) {
    if (slugs.has(s.slug)) throw new Error(`duplicate station slug: ${s.slug}`);
    slugs.add(s.slug);
    if (!s.lines || s.lines.length < 1 || s.lines.length > 2) throw new Error(`${s.slug}: a station is on 1 or 2 lines`);
    for (const id of s.lines) if (!(id in rowOf)) throw new Error(`${s.slug}: unknown line ${id}`);
    if (s.lines.length === 2 && Math.abs(rowOf[s.lines[0]] - rowOf[s.lines[1]]) !== 1)
      throw new Error(`${s.slug}: lines ${s.lines.join(' and ')} must be adjacent rows to share a station`);
    if (!/^\d{4}-\d{2}$/.test(s.date)) throw new Error(`${s.slug}: date must be YYYY-MM`);
    if (!s.short || s.short.length > 14) throw new Error(`${s.slug}: short label required, 14 chars max`);
  }
}

export const PRESETS = {
  landscape: { orient: 'landscape', colGap: 64, rowGap: 52, pad: 40, labelGap: 15 },
  portrait: { orient: 'portrait', colGap: 60, rowGap: 80, pad: 34, labelGap: 15 },
};

export function layout(lines, stations, opts = {}) {
  const { orient = 'landscape', colGap = 64, rowGap = 52, pad = 40, labelGap = 15 } = opts;
  const stub = Math.max(colGap * 0.7, rowGap / 2 + 2); // terminus must fit a half-row climb
  validate(lines, stations);
  const rowOf = Object.fromEntries(lines.map((l, i) => [l.id, i]));
  const sorted = [...stations].sort((a, b) => a.date.localeCompare(b.date) || rowOf[a.lines[0]] - rowOf[b.lines[0]]);
  const nextCol = Object.fromEntries(lines.map((l) => [l.id, 0]));
  const place = {};
  for (const s of sorted) {
    const col = Math.max(...s.lines.map((id) => nextCol[id]));
    for (const id of s.lines) nextCol[id] = col + 1;
    const rows = s.lines.map((id) => rowOf[id]);
    place[s.slug] = { col, row: rows.reduce((a, b) => a + b, 0) / rows.length };
  }
  const cols = Math.max(...Object.values(place).map((p) => p.col)) + 1;
  const along = (col) => pad + stub + colGap * col;
  const across = (row) => pad + rowGap * row;
  const lenAlong = pad * 2 + stub * 2 + colGap * (cols - 1);
  const lenAcross = pad * 2 + rowGap * (lines.length - 1);
  const land = orient === 'landscape';
  const toXY = (u, v) => (land ? { x: u, y: v } : { x: v, y: u });
  const w = land ? lenAlong : lenAcross, h = land ? lenAcross : lenAlong;

  // Beck segment between two points in (u, v): straight, or horizontal then 45deg centred.
  function seg(u0, v0, u1, v1) {
    if (v0 === v1) return [[u1, v1]];
    const dv = Math.abs(v1 - v0), du = u1 - u0;
    if (du < dv) throw new Error(`diagonal does not fit: du ${du} < dv ${dv}; increase colGap or reduce rowGap`);
    const a = u0 + (du - dv) / 2;
    return [[a, v0], [a + dv, v1], [u1, v1]];
  }

  const linesOut = lines.map((l, i) => {
    const own = sorted.filter((s) => s.lines.includes(l.id)).sort((a, b) => place[a.slug].col - place[b.slug].col);
    const pts = [];
    if (own.length) {
      const first = place[own[0].slug], last = place[own[own.length - 1].slug];
      pts.push([along(first.col) - stub, across(i)]);
      let cur = pts[0];
      for (const s of own) {
        const p = place[s.slug];
        const target = [along(p.col), across(p.row)];
        for (const q of seg(cur[0], cur[1], target[0], target[1])) pts.push(q);
        cur = target;
      }
      const end = [along(last.col) + stub, across(i)];
      for (const q of seg(cur[0], cur[1], end[0], end[1])) pts.push(q);
    }
    const d = pts.map(([u, v], k) => { const { x, y } = toXY(u, v); return `${k ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`; }).join(' ');
    return { id: l.id, name: l.name, color: l.color, d, stations: own.map((s) => s.slug) };
  });

  const stationsOut = sorted.map((s) => {
    const p = place[s.slug];
    const { x, y } = toXY(along(p.col), across(p.row));
    const interchange = s.lines.length === 2;
    let label;
    if (land) {
      // interchanges sit where diagonals meet, so their label goes a full row-half clear of them; labelSide overrides the parity rule
      const above = s.labelSide ? s.labelSide === 'above' : (interchange || p.col % 2 === 0);
      label = { x, y: above ? y - (interchange ? labelGap * 2 : labelGap) : y + labelGap + 8, anchor: 'middle' };
    } else {
      label = { x: x + labelGap, y: y + 4, anchor: 'start' };
    }
    return { slug: s.slug, x, y, interchange, col: p.col, row: p.row, label, lines: s.lines, state: s.state || 'open' };
  });

  return { w, h, orient, lines: linesOut, stations: stationsOut };
}

// 1-D door strip for one line: positions along a horizontal strip.
export function strip(line, stations, { w = 640, pad = 28 } = {}) {
  const own = stations.filter((s) => s.lines.includes(line.id)).sort((a, b) => a.date.localeCompare(b.date));
  const gap = own.length > 1 ? (w - pad * 2) / (own.length - 1) : 0;
  return { w, line, stations: own.map((s, i) => ({ slug: s.slug, short: s.short, x: pad + gap * i, interchange: s.lines.length === 2, state: s.state || 'open' })) };
}

export function neighbours(line, stations, slug) {
  const own = stations.filter((s) => s.lines.includes(line.id)).sort((a, b) => a.date.localeCompare(b.date));
  const i = own.findIndex((s) => s.slug === slug);
  return { prev: i > 0 ? own[i - 1] : null, next: i >= 0 && i < own.length - 1 ? own[i + 1] : null };
}

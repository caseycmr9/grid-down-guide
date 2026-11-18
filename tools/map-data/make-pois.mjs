// Compact raw/pbf/poi.jsonl + places.jsonl -> out/pois.json and out/places.json
import fs from 'node:fs';
import readline from 'node:readline';
import { hav, U } from './geo.mjs';

const CAT_ORDER = ['hospital', 'urgent', 'vet', 'grocery', 'pharmacy', 'fuel', 'fire', 'police', 'airport', 'supplies', 'landmark'];
const DEFAULT_NAME = { hospital: 'Hospital', urgent: 'Urgent care', vet: 'Veterinarian', grocery: 'Grocery store', pharmacy: 'Pharmacy', fuel: 'Gas station', fire: 'Fire station', police: 'Police station', airport: 'Airfield', supplies: 'Supply store', landmark: '' };
const KEEP_UNNAMED = new Set(['hospital', 'fire', 'police', 'urgent']);
const bbox = [-124.6, 32.4, -114.0, 42.1];
const inCA0 = (x, y) => x >= bbox[0] && x <= bbox[2] && y >= bbox[1] && y <= bbox[3];
// points that fall inside a neighboring state (Census outlines in out/base.json), above the Oregon line or south of the Mexican border are dropped
const base = JSON.parse(fs.readFileSync('out/base.json', 'utf8'));
const nbrRings = [];
for (const rings of Object.values(base.neighbors)) for (const flat of rings) { const r = []; let X = 0, Y = 0; for (let i = 0; i < flat.length; i += 2) { X += flat[i]; Y += flat[i + 1]; r.push([X / U, Y / U]); } nbrRings.push(r); }
function pip(x, y, ring) { let c = false; for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) { const a = ring[i], b = ring[j]; if ((a[1] > y) !== (b[1] > y) && x < ((b[0] - a[0]) * (y - a[1])) / (b[1] - a[1]) + a[0]) c = !c; } return c; }
const inCA = (x, y) => inCA0(x, y) && y <= 42.0 && y >= 32.52 && !nbrRings.some((r) => pip(x, y, r));

const by = {}; for (const c of CAT_ORDER) by[c] = [];
const rl = readline.createInterface({ input: fs.createReadStream('raw/pbf/poi.jsonl', 'utf8'), crlfDelay: Infinity });
let total = 0;
for await (const line of rl) {
  if (!line) continue;
  const j = JSON.parse(line); total++;
  if (!by[j.k] || !inCA(j.x, j.y)) continue;
  if (j.k === 'landmark') {
    if (j.s === 2) { // peaks: only high, named ones (9,800 ft and up); the rest is clutter
      const m = /Elevation ([\d,]+) ft/.exec(j.a || ''); if (!m || +m[1].replace(/,/g, '') < 9800) continue;
    }
    if (j.s === 8 && /\d/.test(j.n || '')) continue; // dams named by state ID numbers are small
    if (/\(closed|Open Space|Limited Use|^NPS Land$/i.test(j.n || '')) continue;
    j.f = 0;
  }
  let name = j.n;
  if (!name) { if (!KEEP_UNNAMED.has(j.k)) continue; name = DEFAULT_NAME[j.k] + (j.c ? ' (' + j.c + ')' : ''); }
  by[j.k].push({ x: Math.round(j.x * U), y: Math.round(j.y * U), n: name, a: j.a || '', p: j.p || '', f: j.f || 0, s: j.s || 0, lon: j.x, lat: j.y });
}
// two national park units whose boundaries are not tagged as parks in OpenStreetMap; centre points taken from their published extents
by.landmark.push({ x: Math.round(-122.88 * U), y: Math.round(38.07 * U), n: 'Point Reyes National Seashore', a: 'National seashore', p: '', f: 0, s: 4, lon: -122.88, lat: 38.07 });
by.landmark.push({ x: Math.round(-115.6 * U), y: Math.round(35.1 * U), n: 'Mojave National Preserve', a: 'National preserve', p: '', f: 0, s: 4, lon: -115.6, lat: 35.1 });
// de-duplicate: same category, same name (case-insensitive), within 150 m (node and building outline of the same place)
const stats = {};
const out = {};
for (const c of CAT_ORDER) {
  const arr = by[c];
  const grid = new Map(); const keep = [];
  const RAD = c === 'landmark' ? 3000 : c === 'airport' ? 1500 : 150, CELL = c === 'landmark' ? 30 : c === 'airport' ? 60 : 200; // cells per degree
  for (const r of arr) {
    const key = Math.floor(r.lon * CELL) + ',' + Math.floor(r.lat * CELL);
    let dup = null;
    for (let dx = -1; dx <= 1 && !dup; dx++) for (let dy = -1; dy <= 1 && !dup; dy++) {
      const cell = grid.get((Math.floor(r.lon * CELL) + dx) + ',' + (Math.floor(r.lat * CELL) + dy));
      if (!cell) continue;
      for (const q of cell) if (q.n.toLowerCase() === r.n.toLowerCase() && hav(q.lon, q.lat, r.lon, r.lat) < RAD) { dup = q; break; }
    }
    if (dup) { // merge useful details into the kept record
      if (!dup.a && r.a) dup.a = r.a; if (!dup.p && r.p) dup.p = r.p; dup.f |= r.f; continue;
    }
    keep.push(r); if (!grid.has(key)) grid.set(key, []); grid.get(key).push(r);
  }
  // landmarks: also dedupe the same name anywhere within 2 km with a different subtype (e.g. a historic site and a museum)
  keep.sort((a, b) => a.x - b.x || a.y - b.y);
  out[c] = keep.map((r) => [r.x, r.y, r.n, r.a, r.p, r.f, r.s]);
  stats[c] = keep.length;
}
fs.writeFileSync('out/pois.json', JSON.stringify(out));
console.log('pois.json', (fs.statSync('out/pois.json').size / 1e6).toFixed(2), 'MB', JSON.stringify(stats), 'raw lines', total);

// ---- places
const KIND = { city: 0, town: 1, village: 2, hamlet: 3 };
const pl = [];
const rl2 = readline.createInterface({ input: fs.createReadStream('raw/pbf/places.jsonl', 'utf8'), crlfDelay: Infinity });
for await (const line of rl2) {
  if (!line) continue;
  const j = JSON.parse(line);
  if (!inCA(j.x, j.y)) continue;
  pl.push([Math.round(j.x * U), Math.round(j.y * U), j.n, KIND[j.k], j.p || 0]);
}
// de-duplicate same name within 3 km (keep the more important kind)
pl.sort((a, b) => a[3] - b[3] || b[4] - a[4]);
const keepP = [];
for (const r of pl) {
  let dup = false;
  for (const q of keepP) if (q[2] === r[2] && Math.abs(q[0] - r[0]) < 400 && Math.abs(q[1] - r[1]) < 400) { dup = true; break; }
  if (!dup) keepP.push(r);
}
fs.writeFileSync('out/places.json', JSON.stringify(keepP));
const kinds = [0, 0, 0, 0]; for (const r of keepP) kinds[r[3]]++;
console.log('places.json', (fs.statSync('out/places.json').size / 1e6).toFixed(2), 'MB', keepP.length, 'places; cities/towns/villages/hamlets', kinds.join('/'));

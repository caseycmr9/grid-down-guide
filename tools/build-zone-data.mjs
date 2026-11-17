// Builds data/zonedata.js: offline ZIP -> USDA hardiness zone + estimated frost dates and temperatures.
//
// Sources (download once, then run this script; the raw files are NOT committed):
//   1. USDA Plant Hardiness Zone Map 2023, ZIP code CSVs  (USDA-ARS / Oregon State University PRISM Group)
//        https://prism.oregonstate.edu/phzm/data/2023/phzm_{us,ak,hi,pr}_zipcode_2023.csv
//   2. US Census 2023 Gazetteer, ZCTA centroids
//        https://www2.census.gov/geo/docs/maps-data/data/gazetteer/2023_Gazetteer/2023_Gaz_zcta_national.zip   (unzip the .txt)
//   3. NOAA NCEI U.S. Climate Normals 1991-2020, annual/seasonal, by station (tar.gz, extract the per-station CSVs)
//        https://www.ncei.noaa.gov/data/normals-annualseasonal/1991-2020/archive/
//
// Usage:  node tools/build-zone-data.mjs --usda <dir> --gaz <2023_Gaz_zcta_national.txt> --noaa <dir> [--out data/zonedata.js]
//
// Method: each ZIP is matched to the best nearby NOAA station. Score = distance (km) + 25 km per half-zone of
// hardiness-zone mismatch between the ZIP and the station's own location, so a mountain town is not matched to a warm
// valley station. Frost dates are therefore estimates; the app says so.
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const root = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..');
const arg = (n) => { const i = process.argv.indexOf('--' + n); return i > 0 ? process.argv[i + 1] : null; };
const usdaDir = arg('usda'), gazFile = arg('gaz'), noaaDir = arg('noaa');
const outFile = path.resolve(arg('out') || path.join(root, 'data', 'zonedata.js'));
if (!usdaDir || !gazFile || !noaaDir) { console.error('Missing --usda, --gaz or --noaa'); process.exit(1); }

const RADIUS_KM = 120, ZONE_PENALTY_KM = 25;
const CUM = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
const doy = (s) => { const m = /(\d\d)\/(\d\d)/.exec(s || ''); return m ? CUM[+m[1] - 1] + +m[2] : 0; };
const rad = (d) => d * Math.PI / 180;
function km(lat1, lon1, lat2, lon2) {
  const a = Math.sin(rad(lat2 - lat1) / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(rad(lon2 - lon1) / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(a));
}
function splitCsv(line) {
  const o = []; let c = '', q = false;
  for (let i = 0; i < line.length; i++) { const ch = line[i]; if (ch === '"') q = !q; else if (ch === ',' && !q) { o.push(c); c = ''; } else c += ch; }
  o.push(c); return o;
}
const median = (a) => { if (!a.length) return 0; const s = a.slice().sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };

// ---- 1. USDA zones by ZIP
const zipZone = new Map(); const trangeOf = {};
for (const f of fs.readdirSync(usdaDir).filter((x) => /zipcode_2023\.csv$/.test(x))) {
  const lines = fs.readFileSync(path.join(usdaDir, f), 'utf8').split(/\r?\n/);
  if (!/^zipcode,zone/.test(lines[0])) throw new Error(f + ': unexpected header (is it really the CSV?)');
  for (const l of lines.slice(1)) {
    const p = l.split(','); if (p.length < 3 || !/^\d{5}$/.test(p[0])) continue;
    zipZone.set(p[0], p[1]); trangeOf[p[1]] = p[2];
  }
}
const zoneCodes = Object.keys(trangeOf).sort((a, b) => zoneStep(a) - zoneStep(b));
function zoneStep(z) { const m = /^(\d+)([ab])$/.exec(z); return (+m[1] - 1) * 2 + (m[2] === 'b' ? 1 : 0); }
console.log('ZIPs with zones:', zipZone.size, ' zones:', zoneCodes.join(' '));

// ---- 2. ZIP centroids (ZCTA); fallback to nearest numeric neighbour with coordinates
const coord = new Map();
for (const l of fs.readFileSync(gazFile, 'utf8').split(/\r?\n/).slice(1)) {
  const p = l.split('\t'); if (p.length < 7) continue;
  const lat = parseFloat(p[5]), lon = parseFloat(p[6]); if (isFinite(lat) && isFinite(lon)) coord.set(p[0].trim(), [lat, lon]);
}
const zips = [...zipZone.keys()].sort();
let filled = 0, missing = 0;
for (let i = 0; i < zips.length; i++) {
  if (coord.has(zips[i])) continue;
  let best = null;
  for (let d = 1; d <= 40 && !best; d++) for (const j of [i - d, i + d]) {
    const z = zips[j]; if (z && z.slice(0, 3) === zips[i].slice(0, 3) && coord.has(z)) { best = coord.get(z); break; }
  }
  if (best) { coord.set(zips[i], best); filled++; } else missing++;
}
console.log('ZIP coords: from ZCTA', coord.size - filled, ' borrowed from neighbour', filled, ' none', missing);

// grid index of ZIP centroids (for station zone proxies)
const cell = (lat, lon) => Math.floor(lat * 4) + ',' + Math.floor(lon * 4);
const zipGrid = new Map();
for (const z of zips) { const c = coord.get(z); if (!c) continue; const k = cell(c[0], c[1]); (zipGrid.get(k) || zipGrid.set(k, []).get(k)).push(z); }
function nearbyZips(lat, lon, r) {
  const out = []; const span = Math.ceil(r / 25) + 1;
  const ci = Math.floor(lat * 4), cj = Math.floor(lon * 4);
  for (let a = -span; a <= span; a++) for (let b = -span * 2; b <= span * 2; b++) for (const z of zipGrid.get((ci + a) + ',' + (cj + b)) || []) {
    const c = coord.get(z), d = km(lat, lon, c[0], c[1]); if (d <= r) out.push([d, z]);
  }
  return out.sort((x, y) => x[0] - y[0]);
}

// ---- 3. NOAA stations
let stations = []; let scanned = 0;
for (const f of fs.readdirSync(noaaDir).filter((x) => x.endsWith('.csv'))) {
  scanned++;
  const lines = fs.readFileSync(path.join(noaaDir, f), 'utf8').split(/\r?\n/);
  if (lines.length < 2) continue;
  const h = splitCsv(lines[0]), v = splitCsv(lines[1]);
  const idx = new Map(h.map((n, i) => [n, i]));
  const g = (n) => { const i = idx.get(n); return i === undefined ? '' : (v[i] || '').trim(); };
  const num = (n) => { const x = parseFloat(g(n)); return isFinite(x) && x > -9000 ? x : null; };
  const lat = num('LATITUDE'), lon = num('LONGITUDE'), tmin = num('ANN-TMIN-NORMAL'), tmax = num('ANN-TMAX-NORMAL');
  if (lat === null || lon === null || tmin === null || tmax === null) continue;
  if (lat < 17 || lat > 72 || lon > -64 || lon < -180) continue;
  const frzDays = num('ANN-TMIN-AVGNDS-LSTH032'), yrs = num('years_ANN-TMIN-AVGNDS-LSTH032');
  if (frzDays === null || (yrs !== null && yrs < 15)) continue;
  const l50 = doy(g('ANN-TMIN-PRBLST-T32FP50')), l10 = doy(g('ANN-TMIN-PRBLST-T32FP10'));
  let f50 = doy(g('ANN-TMIN-PRBFST-T32FP50')), f10 = doy(g('ANN-TMIN-PRBFST-T32FP10'));
  const noFreeze = frzDays < 0.5;
  if (!noFreeze && !(l50 && l10 && f50 && f10)) continue;
  if (f50 && f50 < l50) f50 += 365;
  if (f10 && f10 < l10) f10 += 365;
  const hot = num('ANN-TMAX-AVGNDS-GRTH090');
  let name = g('NAME').replace(/\s+US$/, '');
  const m = /^(.*), ([A-Z]{2})$/.exec(name);
  const KEEP = new Set(['AP', 'AFB', 'NWS', 'WSO', 'WFO', 'FAA', 'RGNL', 'INTL', 'NAS', 'USC', 'CAA', 'MT', 'ST']);
  const title = (s) => s.toLowerCase().replace(/\b[a-z]/g, (c) => c.toUpperCase()).replace(/\b(Ap|Afb|Nws|Wso|Wfo|Faa|Nas)\b/g, (w) => w.toUpperCase()).replace(/\bIntl\b/, 'Intl').replace(/\bRgnl\b/, 'Rgnl');
  name = m ? title(m[1]) + ', ' + m[2] : title(name);
  stations.push({ id: g('STATION'), name, lat, lon, elev: num('ELEVATION'), l50: noFreeze ? 0 : l50, l10: noFreeze ? 0 : l10, f50: noFreeze ? 0 : f50, f10: noFreeze ? 0 : f10, tmin: Math.round(tmin), tmax: Math.round(tmax), hot: Math.round(hot || 0), nf: noFreeze ? 1 : 0 });
}
console.log('NOAA files scanned', scanned, ' usable stations', stations.length);

// station zone proxy = median zone step of ZIP centroids within 12 km (else nearest within 40 km)
for (const s of stations) {
  let near = nearbyZips(s.lat, s.lon, 12);
  if (!near.length) near = nearbyZips(s.lat, s.lon, 40).slice(0, 1);
  s.zs = near.length ? median(near.map((n) => zoneStep(zipZone.get(n[1])))) : null;
}
const sGrid = new Map();
for (const s of stations) { const k = cell(s.lat, s.lon); (sGrid.get(k) || sGrid.set(k, []).get(k)).push(s); }

// ---- 4. match every ZIP to a station
const match = new Map(); const used = new Map(); // zip -> {s, d}
const STICKY = 6; // keep the previous ZIP's station unless another is better by more than this (km-equivalent); shrinks the packed data
let prev = null;
for (const z of zips) {
  const c = coord.get(z); if (!c) { prev = null; continue; }
  const span = Math.ceil(RADIUS_KM / 25) + 1, ci = Math.floor(c[0] * 4), cj = Math.floor(c[1] * 4);
  const zs = zoneStep(zipZone.get(z)); let best = null, keep = null;
  for (let a = -span; a <= span; a++) for (let b = -span * 2; b <= span * 2; b++) for (const s of sGrid.get((ci + a) + ',' + (cj + b)) || []) {
    const d = km(c[0], c[1], s.lat, s.lon); if (d > RADIUS_KM) continue;
    const score = d + (s.zs === null ? 10 : ZONE_PENALTY_KM * Math.abs(s.zs - zs));
    if (!best || score < best.score) best = { s, d, score };
    if (prev && s === prev) keep = { s, d, score };
  }
  if (best && keep && keep.score <= best.score + STICKY) best = keep;
  if (best) { match.set(z, best); used.set(best.s.id, best.s); }
  prev = best ? best.s : null;
}
console.log('ZIPs matched to a station:', match.size, 'of', zips.length, ' stations used:', used.size);

// ---- 5. zone typical values (ZIPs matched within 60 km)
const byZone = {};
for (const [z, m] of match) if (m.d <= 60) (byZone[zipZone.get(z)] ||= []).push(m.s);
const typ = zoneCodes.map((zc) => {
  const a = byZone[zc] || []; if (a.length < 3) return null;
  const nf = a.filter((s) => s.nf).length > a.length / 2;
  const f = (k) => nf ? 0 : median(a.filter((s) => !s.nf).map((s) => s[k]));
  return [f('l50'), f('l10'), f('f50'), f('f10'), median(a.map((s) => s.tmin)), median(a.map((s) => s.tmax)), median(a.map((s) => s.hot)), nf ? 1 : 0, a.length];
});
console.log('zones with typical data:', typ.filter(Boolean).length, 'of', zoneCodes.length);

// ---- 6. pack
// stations are numbered in order of first use while walking ZIPs in ascending order (so neighbours get nearby numbers)
const ids = new Map(); const order = [];
for (const z of zips) { const m = match.get(z); if (m && !ids.has(m.s.id)) { ids.set(m.s.id, order.length + 1); order.push(m.s); } }
const bytes = (arr) => Buffer.from(arr);
const varintTo = (out, n) => { while (n >= 128) { out.push((n & 127) | 128); n >>= 7; } out.push(n); };
// bitmap of existing ZIPs
const bits = Buffer.alloc(12500);
for (const z of zips) { const n = +z; bits[n >> 3] |= 1 << (n & 7); }
// run-length streams over the sorted existing-ZIP order: zone runs and station runs (station as zigzag delta from previous run)
const zr = [], sr = []; let zRuns = 0, sRuns = 0;
{
  let pz = -1, pn = 0, ps = -1, sn = 0, prevId = 0;
  const flushZ = () => { if (pn) { zr.push(pz); varintTo(zr, pn); zRuns++; } };
  const flushS = () => { if (sn) { const d = ps - prevId; varintTo(sr, d < 0 ? (-d * 2 - 1) : d * 2); varintTo(sr, sn); prevId = ps; sRuns++; } };
  for (const z of zips) {
    const zi = zoneCodes.indexOf(zipZone.get(z)); const m = match.get(z); const si = m ? ids.get(m.s.id) : 0;
    if (zi === pz) pn++; else { flushZ(); pz = zi; pn = 1; }
    if (si === ps) sn++; else { flushS(); ps = si; sn = 1; }
  }
  flushZ(); flushS();
}
// station table: 9 bytes each: last50 u16, (last10-last50) u8, first50 u16, (first50-first10) u8, tmin i8, tmax u8, hot90days u8
const sd = Buffer.alloc(order.length * 9);
order.forEach((s, i) => {
  const o = i * 9;
  sd.writeUInt16LE(s.l50, o); sd.writeUInt8(Math.max(0, Math.min(255, s.l10 - s.l50)), o + 2);
  sd.writeUInt16LE(s.f50, o + 3); sd.writeUInt8(Math.max(0, Math.min(255, s.f50 - s.f10)), o + 5);
  sd.writeInt8(Math.max(-128, Math.min(127, s.tmin)), o + 6); sd.writeUInt8(Math.max(0, Math.min(255, s.tmax)), o + 7); sd.writeUInt8(Math.max(0, Math.min(255, s.hot)), o + 8);
});
const data = {
  v: 2,
  zones: zoneCodes,
  trange: zoneCodes.map((z) => trangeOf[z]),
  typ,
  names: order.map((s) => s.name.split('|').join('/')).join('|'),
  sdata: sd.toString('base64'),
  bitmap: bits.toString('base64'),
  zruns: bytes(zr).toString('base64'),
  sruns: bytes(sr).toString('base64'),
  zipCount: zips.length
};
const runs = zRuns + '+' + sRuns;
const header = `/* Generated by tools/build-zone-data.mjs: do not edit.
   Hardiness zones: 2023 USDA Plant Hardiness Zone Map (USDA Agricultural Research Service and Oregon State University PRISM Group), by ZIP code.
   Frost dates and temperatures: NOAA NCEI U.S. Climate Normals 1991-2020, nearest suitable weather station (an estimate; local conditions vary).
   Station days are day-of-year (365 = Dec 31; above 365 = next year); 0 means no regular freeze. */\n`;
fs.writeFileSync(outFile, header + 'window.GDG_ZONEDATA = ' + JSON.stringify(data) + ';\n');
console.log('runs', runs, ' wrote', outFile, (fs.statSync(outFile).size / 1024).toFixed(0) + ' KB');

// ---- sanity samples
const sample = { '02101': 'Boston', '10001': 'New York', '30301': 'Atlanta', '33101': 'Miami', '60601': 'Chicago', '80202': 'Denver', '80424': 'Breckenridge (mountain)', '59701': 'Butte MT', '85001': 'Phoenix', '98101': 'Seattle', '99501': 'Anchorage', '96701': 'Hawaii', '77001': 'Houston', '55401': 'Minneapolis', '04401': 'Bangor ME' };
const dd = (n) => { if (!n) return 'none'; const d = new Date(2001, 0, n); return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); };
for (const [z, label] of Object.entries(sample)) {
  const m = match.get(z); if (!zipZone.has(z)) { console.log(z, label, 'not in USDA list'); continue; }
  console.log(z, label.padEnd(24), 'zone', zipZone.get(z).padEnd(3), m ? `${m.s.name} ${m.d.toFixed(0)}km (zone~${m.s.zs}) last ${dd(m.s.l50)}/${dd(m.s.l10)} first ${dd(m.s.f50)}/${dd(m.s.f10)} ${m.s.tmin}/${m.s.tmax}F hot${m.s.hot}` : 'no station');
}

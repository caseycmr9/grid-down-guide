// Build the street packs: per-county files with the smaller streets, ready to download in the app.
//   node --max-old-space-size=24000 make-streets.mjs [--out=docs/streets] [--index=map/streets-index.json] [--max-edges=90000]
//        [--bbox=minLon,minLat,maxLon,maxLat]   (development: only ways that start inside this box)
//        [--only=Sacramento,San Francisco]      (development: only write these counties)
// Needs (in the working folder): raw/pbf/hw.jsonl, raw/pbf/streets.jsonl, out/base.json, out/roads-osmids.json, out/roads-meta.json
//
// Pack file format (JSON, version 1). Coordinates are integers in units of 1e-5 degree (about 1.1 m): x = longitude * 1e5, y = latitude * 1e5.
//   { v:1, base:<hash of ca-roads.json the pack was built for>, id, name, labels:[string], nodes:[x0,y0,dx1,dy1,...]  (delta coded, in node order),
//     edges:[[a, b, cls, flags, lab, lenM, geom], ...], ties:[[node, key], ...] }
//   cls 2 primary, 3 secondary (both without a route number: city arterials), 4 tertiary or unclassified, 5 residential or living street.
//   flags bit 0 = one-way from a to b.  lab indexes labels (0 = no name).  geom = interior shape points as flat deltas in 1e-5 degree units, the first relative to node a.
//   ties join a pack node to the rest of the map: key >= 0 means "this is node <key> of the highway network (map/ca-roads.json)";
//   key < 0 means "this is the same OpenStreetMap node (id = -key) as in the other packs that have it".
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import readline from 'node:readline';
import { simplify, hav } from './geo.mjs';
import { streetInfo, BASE_OPTS } from './ways.mjs';

const arg = (k, d) => { const a = process.argv.find((x) => x.startsWith('--' + k + '=')); return a ? a.slice(k.length + 3) : d; };
const OUT_DIR = arg('out', 'docs/streets'), INDEX = arg('index', 'map/streets-index.json'), MAXE = +arg('max-edges', '90000');
const BBOX = arg('bbox', '') ? arg('bbox', '').split(',').map(Number) : null;
const ONLY = arg('only', '') ? arg('only', '').split(',').map((s) => s.trim().toLowerCase()) : null;
const E5 = 1e5;
const t00 = Date.now(); const lap = (m) => console.log(((Date.now() - t00) / 1000).toFixed(0).padStart(5) + ' s  ' + m);

// ---- inputs
const baseOsm = JSON.parse(fs.readFileSync('out/roads-osmids.json', 'utf8'));
const baseOf = new Map(); baseOsm.forEach((id, i) => { if (id) baseOf.set(id, i); });
const baseHash = JSON.parse(fs.readFileSync('out/roads-meta.json', 'utf8')).hash;
const baseJson = JSON.parse(fs.readFileSync('out/base.json', 'utf8'));
lap(`highway network: ${baseOf.size} nodes, hash ${baseHash}`);

// counties as plain polygons (degrees)
const counties = baseJson.counties.map((c) => {
  const rings = c.r.map((flat) => { const pts = []; let x = 0, y = 0; for (let i = 0; i < flat.length; i += 2) { x += flat[i]; y += flat[i + 1]; pts.push([x / 1e4, y / 1e4]); } return pts; });
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const r of rings) for (const p of r) { if (p[0] < x0) x0 = p[0]; if (p[0] > x1) x1 = p[0]; if (p[1] < y0) y0 = p[1]; if (p[1] > y1) y1 = p[1]; }
  return { name: c.n, slug: c.n.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''), rings, x0, y0, x1, y1, c: c.c };
});
function pip(x, y, ring) { let c = false; for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) { const a = ring[i], b = ring[j]; if ((a[1] > y) !== (b[1] > y) && x < ((b[0] - a[0]) * (y - a[1])) / (b[1] - a[1]) + a[0]) c = !c; } return c; }
const cellCache = new Map();
function countyAt(lon, lat) {
  const key = Math.floor(lon * 100) * 100000 + Math.floor(lat * 100);
  let v = cellCache.get(key); if (v !== undefined) return v;
  const cx = (Math.floor(lon * 100) + 0.5) / 100, cy = (Math.floor(lat * 100) + 0.5) / 100;
  v = -1;
  for (let i = 0; i < counties.length && v < 0; i++) { const c = counties[i]; if (cx < c.x0 || cx > c.x1 || cy < c.y0 || cy > c.y1) continue; for (const r of c.rings) if (pip(cx, cy, r)) { v = i; break; } }
  if (v < 0) { let best = 1e18; counties.forEach((c, i) => { const dx = Math.max(c.x0 - cx, 0, cx - c.x1), dy = Math.max(c.y0 - cy, 0, cy - c.y1), d = dx * dx + dy * dy; if (d < best) { best = d; v = i; } }); }
  cellCache.set(key, v); return v;
}

// ---- reading the ways: the unref'd primary/secondary roads from hw.jsonl and everything in streets.jsonl
async function* streetWays() {
  for (const f of ['raw/pbf/hw.jsonl', 'raw/pbf/streets.jsonl']) {
    const rl = readline.createInterface({ input: fs.createReadStream(f, 'utf8'), crlfDelay: Infinity });
    for await (const line of rl) {
      if (!line) continue;
      const j = JSON.parse(line);
      if (j.n.length < 2) continue;
      const info = streetInfo(j.t, BASE_OPTS);
      if (!info) continue;
      if (BBOX) { const p = j.g[0]; if (p[0] < BBOX[0] || p[0] > BBOX[2] || p[1] < BBOX[1] || p[1] > BBOX[3]) continue; }
      yield { id: j.id, info, n: j.n, g: j.g };
    }
  }
}

// ---- pass 1: assign node numbers, count how many ways use each node
const nodeNo = new Map();
let NN = 0;
const CAP = 22e6;
const nlon = new Float64Array(CAP), nlat = new Float64Array(CAP), osmOf = new Float64Array(CAP);
const use = new Uint8Array(CAP), endp = new Uint8Array(CAP);
let nWays = 0;
for await (const w of streetWays()) {
  nWays++;
  for (let i = 0; i < w.n.length; i++) {
    let k = nodeNo.get(w.n[i]);
    if (k === undefined) { k = NN++; nodeNo.set(w.n[i], k); nlon[k] = w.g[i][0]; nlat[k] = w.g[i][1]; osmOf[k] = w.n[i]; }
    if (use[k] < 255) use[k]++;
  }
  endp[nodeNo.get(w.n[0])] = 1; endp[nodeNo.get(w.n[w.n.length - 1])] = 1;
}
lap(`pass 1: ${nWays} ways, ${NN} nodes`);

// ---- pass 2: cut the ways into edges at junctions
const eA = [], eB = [], eCls = [], eFl = [], eLab = [], eLen = [], eGeom = []; // eGeom[i] = flat delta array (1e-5 deg), first delta relative to node a
const labels = new Map([['', 0]]); const labelList = [''];
const lab = (s) => { let i = labels.get(s); if (i === undefined) { i = labelList.length; labels.set(s, i); labelList.push(s); } return i; };
const ncx = (k) => Math.round(nlon[k] * E5), ncy = (k) => Math.round(nlat[k] * E5);
const TOL = 0.000012; // about 1.3 m
let dropped = 0;
for await (const w of streetWays()) {
  const n = w.n, g = w.g, inf = w.info;
  let start = 0;
  for (let i = 1; i < n.length; i++) {
    const k = nodeNo.get(n[i]);
    if (use[k] >= 2 || endp[k] || baseOf.has(n[i]) || i === n.length - 1) {
      const ks = nodeNo.get(n[start]);
      let pts = g.slice(start, i + 1);
      let len = 0; for (let q = 1; q < pts.length; q++) len += hav(pts[q - 1][0], pts[q - 1][1], pts[q][0], pts[q][1]);
      let a = ks, b = k;
      if (inf.rev) { const t = a; a = b; b = t; pts = pts.slice().reverse(); }
      if (len >= 0.5 && (a !== b || (len >= 15 && pts.length > 2))) {
        const s = pts.length > 2 ? simplify(pts, TOL) : pts;
        let px = ncx(a), py = ncy(a); const bx = ncx(b), by = ncy(b); const geom = [];
        for (let q = 1; q < s.length - 1; q++) { const x = Math.round(s[q][0] * E5), y = Math.round(s[q][1] * E5); if ((x === px && y === py) || (x === bx && y === by)) continue; geom.push(x - px, y - py); px = x; py = y; }
        eA.push(a); eB.push(b); eCls.push(inf.cls); eFl.push(inf.ow); eLab.push(lab(inf.label)); eLen.push(Math.round(len)); eGeom.push(geom);
      } else dropped++;
      start = i;
    }
  }
}
const NE = eA.length;
lap(`pass 2: ${NE} edges (${dropped} tiny ones dropped), ${labelList.length} street names`);

// ---- drop little disconnected scraps (under 150 m, not attached to the highway network)
const par = new Int32Array(NN); for (let i = 0; i < NN; i++) par[i] = i;
const find = (x) => { while (par[x] !== x) { par[x] = par[par[x]]; x = par[x]; } return x; };
for (let e = 0; e < NE; e++) { const ra = find(eA[e]), rb = find(eB[e]); if (ra !== rb) par[ra] = rb; }
const compLen = new Float64Array(NN), compBase = new Uint8Array(NN);
for (let e = 0; e < NE; e++) compLen[find(eA[e])] += eLen[e];
for (let k = 0; k < NN; k++) if (baseOf.has(osmOf[k])) compBase[find(k)] = 1;
const keep = []; let scraps = 0;
for (let e = 0; e < NE; e++) { const r = find(eA[e]); if (compLen[r] >= 150 || compBase[r]) keep.push(e); else scraps++; }
lap(`kept ${keep.length} edges, dropped ${scraps} scrap edges`);

// ---- group by county, split big counties into chunks of at most MAXE edges
const mid = (e) => { const a = eA[e], b = eB[e]; return a === b && eGeom[e].length ? [(nlon[a]), (nlat[a])] : [(nlon[a] + nlon[b]) / 2, (nlat[a] + nlat[b]) / 2]; };
const byCounty = counties.map(() => []);
for (const e of keep) { const m = mid(e); byCounty[countyAt(m[0], m[1])].push(e); }
const chunks = []; // {county, part, parts, edges}
function split(list, axis, parts) {
  if (parts <= 1) return [list];
  const mids = list.map((e) => [e, mid(e)[axis]]).sort((p, q) => p[1] - q[1]);
  const half = Math.floor(parts / 2), cut = Math.round(mids.length * half / parts);
  return [...split(mids.slice(0, cut).map((p) => p[0]), 1 - axis, half), ...split(mids.slice(cut).map((p) => p[0]), 1 - axis, parts - half)];
}
counties.forEach((c, ci) => {
  const L = byCounty[ci]; if (!L.length) return;
  const parts = Math.max(1, Math.ceil(L.length / MAXE));
  let axis = 0;
  if (parts > 1) { let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; for (const e of L) { const m = mid(e); if (m[0] < x0) x0 = m[0]; if (m[0] > x1) x1 = m[0]; if (m[1] < y0) y0 = m[1]; if (m[1] > y1) y1 = m[1]; } axis = (x1 - x0) * Math.cos(37 * Math.PI / 180) >= (y1 - y0) ? 0 : 1; }
  split(L, axis, parts).forEach((edges, i, all) => chunks.push({ ci, part: i + 1, parts: all.length, edges }));
});
lap(`${chunks.length} chunks for ${byCounty.filter((l) => l.length).length} counties`);

// nodes that appear in more than one chunk
const firstChunk = new Int32Array(NN).fill(-1), multi = new Uint8Array(NN);
chunks.forEach((ch, i) => { for (const e of ch.edges) for (const k of [eA[e], eB[e]]) { if (firstChunk[k] < 0) firstChunk[k] = i; else if (firstChunk[k] !== i) multi[k] = 1; } });

// ---- write the packs
fs.mkdirSync(OUT_DIR, { recursive: true });
for (const f of fs.readdirSync(OUT_DIR)) if (f.endsWith('.json')) fs.unlinkSync(path.join(OUT_DIR, f));
const index = { v: 1, base: baseHash, updated: new Date().toISOString().slice(0, 10), counties: [] };
const byCountyIdx = new Map();
let totalBytes = 0, totalGz = 0, totalKm = 0;
for (const ch of chunks) {
  const c = counties[ch.ci];
  if (ONLY && !ONLY.includes(c.name.toLowerCase())) continue;
  const id = ch.parts > 1 ? `${c.slug}-${ch.part}` : c.slug;
  const loc = new Map(); const nodes = []; let px = 0, py = 0; const ties = []; const labs = ['']; const labMap = new Map([['', 0]]);
  const locOf = (k) => {
    let i = loc.get(k);
    if (i === undefined) { i = loc.size; loc.set(k, i); const x = ncx(k), y = ncy(k); nodes.push(x - px, y - py); px = x; py = y;
      const bi = baseOf.get(osmOf[k]); if (bi !== undefined) ties.push([i, bi]); else if (multi[k]) ties.push([i, -osmOf[k]]); }
    return i;
  };
  const edges = []; let km = 0;
  for (const e of ch.edges) {
    const a = locOf(eA[e]), b = locOf(eB[e]);
    const name = labelList[eLab[e]]; let li = labMap.get(name); if (li === undefined) { li = labs.length; labMap.set(name, li); labs.push(name); }
    edges.push([a, b, eCls[e], eFl[e], li, eLen[e], eGeom[e]]); km += eLen[e] / 1000;
  }
  const pack = { v: 1, base: baseHash, id, name: c.name + (ch.parts > 1 ? ` (part ${ch.part} of ${ch.parts})` : ''), labels: labs, nodes, edges, ties };
  const text = JSON.stringify(pack);
  fs.writeFileSync(path.join(OUT_DIR, id + '.json'), text);
  const gz = zlib.gzipSync(text, { level: 6 }).length;
  totalBytes += text.length; totalGz += gz; totalKm += km;
  let entry = byCountyIdx.get(ch.ci);
  if (!entry) { entry = { id: c.slug, name: c.name, bbox: [c.x0, c.y0, c.x1, c.y1].map((v) => +v.toFixed(4)), c: c.c, chunks: [], bytes: 0, gz: 0, km: 0, edges: 0 }; byCountyIdx.set(ch.ci, entry); index.counties.push(entry); }
  entry.chunks.push({ f: 'streets/' + id + '.json', b: text.length, e: edges.length }); entry.bytes += text.length; entry.gz += gz; entry.km += Math.round(km); entry.edges += edges.length;
  console.log(id.padEnd(26), String(edges.length).padStart(7), 'edges', (text.length / 1e6).toFixed(2).padStart(6), 'MB', (gz / 1e6).toFixed(2).padStart(6), 'MB gz', String(Math.round(km)).padStart(7), 'km', String(ties.length).padStart(6), 'ties');
}
index.counties.sort((p, q) => p.name.localeCompare(q.name));
if (!ONLY) fs.writeFileSync(INDEX, JSON.stringify(index));
lap(`done: ${(totalBytes / 1e6).toFixed(1)} MB raw, ${(totalGz / 1e6).toFixed(1)} MB gzipped, ${Math.round(totalKm)} km of street`);

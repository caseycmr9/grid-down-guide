// Checks the street packs against the highway network and drives some street-level reference routes through the merged graph.
//   node tools/validate-streets.mjs [--dir=docs/streets] [--roads=map/ca-roads.json] [--packs=sacramento,yolo] [--routes]
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const root = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..');
const arg = (k, d) => { const a = process.argv.find((x) => x.startsWith('--' + k + '=')); return a ? a.slice(k.length + 3) : d; };
const dir = path.resolve(arg('dir', path.join(root, 'docs', 'streets')));
const roadsFile = path.resolve(arg('roads', path.join(root, 'map', 'ca-roads.json')));
const only = arg('packs', '') ? arg('packs', '').split(',') : null;
const routes = process.argv.includes('--routes');
const errors = [], warns = [];

const roads = JSON.parse(fs.readFileSync(roadsFile, 'utf8'));
const meta = JSON.parse(fs.readFileSync(path.resolve(arg('base', path.join(root, 'map', 'ca-base.json'))), 'utf8')).meta || {};
const NB = roads.nodes.length / 2;
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json') && (!only || only.some((o) => f === o + '.json' || f.startsWith(o + '-')))).sort();
if (!files.length) { console.log('No street packs in ' + dir); process.exit(0); }

// merged graph: node arrays in degrees
const lon = [], lat = [];
for (let i = 0; i < NB; i++) { lon.push(roads.nodes[2 * i] / 1e4); lat.push(roads.nodes[2 * i + 1] / 1e4); }
const adj = routes ? Array.from({ length: NB }, () => []) : [];
const addEdge = (a, b, len, ow, cls) => { if (!routes) return; adj[a].push([b, len, cls]); if (!ow) adj[b].push([a, len, cls]); };
for (const e of roads.edges) addEdge(e[0], e[1], e[5], e[3] & 1, e[2]);
const osmNode = new Map();
let totalEdges = 0, totalKm = 0;
for (const f of files) {
  const p = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
  if (p.v !== 1) errors.push(`${f}: unknown version`);
  if (meta.roadsHash && p.base !== meta.roadsHash) errors.push(`${f}: built for highway network ${p.base}, but map/ca-base.json says ${meta.roadsHash}`);
  const n = p.nodes.length / 2; if (p.nodes.length % 2) errors.push(`${f}: odd node array`);
  const gid = new Int32Array(n);
  let x = 0, y = 0;
  const px = [], py = [];
  for (let i = 0; i < n; i++) { x += p.nodes[2 * i]; y += p.nodes[2 * i + 1]; px.push(x / 1e5); py.push(y / 1e5); }
  const tied = new Int32Array(n).fill(-1);
  for (const [i, k] of p.ties) {
    if (!(i >= 0 && i < n)) { errors.push(`${f}: tie to a missing node`); continue; }
    if (k >= 0) { if (k >= NB) errors.push(`${f}: tie to highway node ${k} out of range`); else tied[i] = k; }
    else { const g = osmNode.get(k); if (g !== undefined) tied[i] = g; }
  }
  for (let i = 0; i < n; i++) {
    if (tied[i] >= 0) gid[i] = tied[i];
    else { gid[i] = lon.length; lon.push(px[i]); lat.push(py[i]); if (routes) adj.push([]); }
  }
  for (const [i, k] of p.ties) if (k < 0 && !osmNode.has(k)) osmNode.set(k, gid[i]);
  for (const e of p.edges) {
    if (!(e[0] >= 0 && e[0] < n && e[1] >= 0 && e[1] < n) || !(e[2] >= 2 && e[2] <= 5) || !(e[5] > 0) || e[4] >= p.labels.length || e[6].length % 2) { errors.push(`${f}: malformed edge`); break; }
    addEdge(gid[e[0]], gid[e[1]], e[5], e[3] & 1, e[2]); totalKm += e[5] / 1000;
  }
  totalEdges += p.edges.length;
  console.log(`${f.padEnd(28)} ${p.edges.length} edges, ${n} nodes, ${p.ties.length} ties`);
}
console.log(`merged graph: ${lon.length} nodes (${NB} highway), ${totalEdges} street edges, ${Math.round(totalKm)} km of street`);

if (routes) {
  const hav = (x1, y1, x2, y2) => { const r = Math.PI / 180, dl = (y2 - y1) * r, dn = (x2 - x1) * r; const a = Math.sin(dl / 2) ** 2 + Math.cos(y1 * r) * Math.cos(y2 * r) * Math.sin(dn / 2) ** 2; return 12742000 * Math.asin(Math.sqrt(a)); };
  const nearest = (lo, la) => { let b = -1, bd = 1e18; for (let i = 0; i < lon.length; i++) { if (!adj[i].length) continue; const d = hav(lo, la, lon[i], lat[i]); if (d < bd) { bd = d; b = i; } } return [b, bd]; };
  const SP = { 0: 62, 1: 52, 2: 40, 3: 36, 4: 30, 5: 25 };
  function route(s, t) {
    const dist = new Float64Array(lon.length).fill(Infinity), len = new Float64Array(lon.length); dist[s] = 0;
    const heap = [[0, s]];
    const push = (it) => { heap.push(it); let i = heap.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (heap[p][0] <= heap[i][0]) break; [heap[p], heap[i]] = [heap[i], heap[p]]; i = p; } };
    const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let i = 0; for (;;) { const l = 2 * i + 1, r = l + 1; let m = i; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === i) break; [heap[m], heap[i]] = [heap[i], heap[m]]; i = m; } } return top; };
    while (heap.length) { const [d, u] = pop(); if (d > dist[u]) continue; if (u === t) break; for (const [v, m, c] of adj[u]) { const nd = d + m / (SP[c] * 0.44704); if (nd < dist[v]) { dist[v] = nd; len[v] = len[u] + m; push([nd, v]); } } }
    return dist[t] === Infinity ? null : { mi: len[t] / 1609.34, min: dist[t] / 60 };
  }
  // [name, [lon, lat], name, [lon, lat], expected driving miles (rough, from public maps)]
  const R = [
    ['SF City Hall', [-122.4193, 37.7793], 'Pier 39', [-122.4098, 37.8087], 2.4],
    ['SF Ferry Building', [-122.3937, 37.7955], 'Golden Gate Bridge toll plaza', [-122.4737, 37.8100], 5.5],
    ['SF City Hall', [-122.4193, 37.7793], 'Ocean Beach (Great Highway at Judah)', [-122.5093, 37.7603], 5.5],
    ['Sacramento Capitol', [-121.4934, 38.5767], 'UC Davis Medical Center', [-121.4580, 38.5535], 3.5],
    ['Sacramento Capitol', [-121.4934, 38.5767], 'Arden Fair Mall', [-121.4272, 38.6012], 5.5],
    ['Sacramento Capitol', [-121.4934, 38.5767], 'UC Davis campus (Yolo County)', [-121.7494, 38.5382], 18]
  ];
  for (const [an, a, bn, b, mi] of R) {
    const sa = nearest(a[0], a[1]), sb = nearest(b[0], b[1]);
    if (sa[1] > 600 || sb[1] > 600) { console.log(`${an} -> ${bn}: skipped (no street within ${Math.round(Math.max(sa[1], sb[1]))} m: that pack is not loaded)`); continue; }
    const r = route(sa[0], sb[0]);
    if (!r) { console.log(`${an} -> ${bn}: NO ROUTE`); errors.push(`no route ${an} -> ${bn}`); continue; }
    const off = (r.mi - mi) / mi;
    console.log(`${(an + ' -> ' + bn).padEnd(70)} ${r.mi.toFixed(1).padStart(5)} mi (expect ~${mi}), ${r.min.toFixed(0)} min${Math.abs(off) > 0.25 ? '  <-- CHECK' : ''}`);
    if (Math.abs(off) > 0.5) errors.push(`route ${an} -> ${bn}: ${r.mi.toFixed(1)} mi, expected about ${mi}`);
  }
}
if (warns.length) console.log('\nWarnings:\n  ' + warns.join('\n  '));
if (errors.length) { console.log('\nStreet pack errors:\n  ' + errors.join('\n  ')); process.exit(1); }
console.log('\nStreet packs OK');

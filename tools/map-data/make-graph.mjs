// Build the routing graph from raw/roads/*.json -> out/roads.json
// Usage: node --max-old-space-size=6144 make-graph.mjs [classes e.g. mt,pr,sc] [--no-unref-primary]
import fs from 'node:fs';
import { simplify, hav, U, inBBox, CA_BBOX } from './geo.mjs';

import readline from 'node:readline';
import crypto from 'node:crypto';
import { streetInfo, BASE_OPTS } from './ways.mjs';
const args = process.argv.slice(2);
const noUnrefPrimary = args.includes('--no-unref-primary');
const secondaryRefOnly = args.includes('--secondary-ref');   // keep secondary roads only when they carry a route number
const useSecondary = args.includes('--secondary') || secondaryRefOnly;
const STAMP = (args.find((a) => a.startsWith('--stamp=')) || '--stamp=').slice(8);

// ---- load ways from the Geofabrik extract (raw/pbf/hw.jsonl)
const ways = new Map();
let stamp = STAMP;
{
  const rl = readline.createInterface({ input: fs.createReadStream('raw/pbf/hw.jsonl', 'utf8'), crlfDelay: Infinity });
  for await (const line of rl) {
    if (!line) continue;
    const j = JSON.parse(line);
    if (j.n.length < 2 || ways.has(j.id)) continue;
    ways.set(j.id, { id: j.id, tags: j.t, nodes: j.n, geometry: j.g.map((p) => ({ lon: p[0], lat: p[1] })) });
  }
}
console.log('ways loaded', ways.size, 'osm data timestamp', stamp);

const CLS = { motorway: 0, trunk: 1, primary: 2, secondary: 3 };
function wayInfo(w) {
  const t = w.tags || {}, hw = t.highway || '', link = hw.endsWith('_link'), base = hw.replace('_link', '');
  if (!(base in CLS)) return null;
  if (base === 'secondary' && (!useSecondary || (secondaryRefOnly && !t.ref))) return null;
  if (t.access === 'no' || t.access === 'private' || t.highway === 'construction') return null;
  if (t.construction || t.proposed) return null;
  let ow = 0, rev = false;
  if (t.oneway === 'yes' || t.oneway === 'true' || t.oneway === '1') ow = 1;
  else if (t.oneway === '-1' || t.oneway === 'reverse') { ow = 1; rev = true; }
  else if (t.junction === 'roundabout' || t.junction === 'circular') ow = 1;
  else if (!t.oneway && base === 'motorway') ow = 1;
  let ref = String(t.ref || '').split(';')[0].trim();
  let label = ref;
  if (!label && !link && t.name) label = String(t.name).trim();
  if (base === 'primary' && !ref && noUnrefPrimary) return null;
  return { cls: CLS[base], ow, rev, label, link };
}

// ---- node usage counts (junctions are nodes used by 2+ ways or at the ends of a way)
const cnt = new Map();
const good = [];
for (const w of ways.values()) {
  const info = wayInfo(w); if (!info) continue;
  // keep only ways that touch the California bounding box
  let touches = false;
  for (const g of w.geometry) if (g && inBBox(g.lon, g.lat)) { touches = true; break; }
  if (!touches) continue;
  w.info = info; good.push(w);
  const n = w.nodes;
  for (let i = 0; i < n.length; i++) cnt.set(n[i], (cnt.get(n[i]) || 0) + 1);
  cnt.set(n[0], cnt.get(n[0]) + 1); cnt.set(n[n.length - 1], cnt.get(n[n.length - 1]) + 1);
}
console.log('usable ways', good.length, 'distinct nodes', cnt.size);

// ---- nodes where a smaller street meets one of these roads must also be junctions, so the street packs can attach to the highway network
{
  const shared = new Set();
  const mark = (nodes) => { for (const id of nodes) if (cnt.has(id)) shared.add(id); };
  for (const w of ways.values()) if (!w.info && streetInfo(w.tags || {}, BASE_OPTS)) mark(w.nodes); // primary and secondary roads without a route number
  if (fs.existsSync('raw/pbf/streets.jsonl')) {
    const rl2 = readline.createInterface({ input: fs.createReadStream('raw/pbf/streets.jsonl', 'utf8'), crlfDelay: Infinity });
    for await (const line of rl2) { if (!line) continue; const j = JSON.parse(line); if (streetInfo(j.t, BASE_OPTS)) mark(j.n); }
  }
  for (const id of shared) cnt.set(id, cnt.get(id) + 1);
  console.log('junctions added where streets meet these roads:', shared.size);
}

// ---- split ways at junctions into edges
const nodeIdx = new Map(); const nodes = []; // nodes: x,y pairs
function nodeOf(osmId, g) {
  let i = nodeIdx.get(osmId);
  if (i === undefined) { i = nodes.length / 2; nodeIdx.set(osmId, i); nodes.push(Math.round(g.lon * U), Math.round(g.lat * U)); }
  return i;
}
const labels = ['']; const labIdx = new Map([['', 0]]);
function labelOf(s) { let i = labIdx.get(s); if (i === undefined) { i = labels.length; labels.push(s); labIdx.set(s, i); } return i; }

const edges = []; // [a,b,cls,flags,lab,lenM, pts(lonlat array)]
for (const w of good) {
  const n = w.nodes, g = w.geometry, inf = w.info;
  let start = 0;
  for (let i = 1; i < n.length; i++) {
    if (cnt.get(n[i]) >= 2 || i === n.length - 1) {
      if (n[start] !== n[i] && g[start] && g[i]) {
        let pts = [];
        for (let k = start; k <= i; k++) if (g[k]) pts.push([g[k].lon, g[k].lat]);
        let len = 0; for (let k = 1; k < pts.length; k++) len += hav(pts[k - 1][0], pts[k - 1][1], pts[k][0], pts[k][1]);
        let a = n[start], b = n[i], ga = g[start], gb = g[i];
        if (inf.rev) { const t = a; a = b; b = t; pts = pts.slice().reverse(); const t2 = ga; ga = gb; gb = t2; }
        if (len > 0.5) edges.push([nodeOf(a, ga), nodeOf(b, gb), inf.cls, inf.ow, labelOf(inf.link && !inf.label ? '' : inf.label), Math.round(len), pts]);
      }
      start = i;
    }
  }
}
console.log('edges', edges.length, 'nodes', nodes.length / 2);

// ---- drop tiny disconnected components (< 3 km of road)
const NN = nodes.length / 2, parent = new Int32Array(NN).map((_, i) => i);
const find = (x) => { while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; } return x; };
for (const e of edges) { const ra = find(e[0]), rb = find(e[1]); if (ra !== rb) parent[ra] = rb; }
const compLen = new Float64Array(NN);
for (const e of edges) compLen[find(e[0])] += e[5];
let big = 0, bigRoot = 0; for (let i = 0; i < NN; i++) if (compLen[i] > big) { big = compLen[i]; bigRoot = i; }
const kept = edges.filter((e) => compLen[find(e[0])] >= 3000);
console.log('largest component', Math.round(big / 1000), 'km; edges kept', kept.length, 'of', edges.length);

// ---- renumber nodes, simplify and encode geometry
const remap = new Int32Array(NN).fill(-1); const outNodes = [];
function nid(i) { if (remap[i] < 0) { remap[i] = outNodes.length / 2; outNodes.push(nodes[2 * i], nodes[2 * i + 1]); } return remap[i]; }
const outEdges = [];
const tolFor = (cls) => (cls <= 1 ? 0.00018 : 0.0004);
for (const e of kept) {
  const a = nid(e[0]), b = nid(e[1]);
  const s = simplify(e[6], tolFor(e[2]));
  let px = outNodes[2 * a], py = outNodes[2 * a + 1];
  const bx = outNodes[2 * b], by = outNodes[2 * b + 1];
  const geom = [];
  for (let k = 1; k < s.length - 1; k++) {
    const x = Math.round(s[k][0] * U), y = Math.round(s[k][1] * U);
    if ((x === px && y === py) || (x === bx && y === by)) continue;
    geom.push(x - px, y - py); px = x; py = y;
  }
  outEdges.push([a, b, e[2], e[3], e[4], e[5], geom]);
}
const stats = { byClass: [0, 0, 0, 0], km: [0, 0, 0, 0] };
for (const e of outEdges) { stats.byClass[e[2]]++; stats.km[e[2]] += e[5] / 1000; }
// ---- highway exits (numbers and names) attached to graph nodes
const exits = [];
if (fs.existsSync('raw/pbf/exits.jsonl')) {
  const seenExit = new Set();
  for (const line of fs.readFileSync('raw/pbf/exits.jsonl', 'utf8').split('\n')) {
    if (!line) continue;
    const j = JSON.parse(line);
    const i = nodeIdx.get(j.id);
    if (i === undefined || remap[i] < 0) continue;
    const nm = (j.name || j.to || '').replace(/\s+/g, ' ').trim();
    const ref = (j.ref || '').trim();
    if (!ref && !nm) continue;
    if (seenExit.has(remap[i])) continue;
    seenExit.add(remap[i]);
    exits.push([remap[i], ref, nm]);
  }
  console.log('exits attached', exits.length);
}
const roads = { labels, nodes: outNodes, edges: outEdges, exits };
fs.mkdirSync('out', { recursive: true });
const json = JSON.stringify(roads);
fs.writeFileSync('out/roads.json', json);
// OpenStreetMap id of every graph node (never shipped): the street packs use it to attach to this network
const osmIds = new Array(outNodes.length / 2).fill(0);
for (const [id, i] of nodeIdx) if (remap[i] >= 0) osmIds[remap[i]] = id;
fs.writeFileSync('out/roads-osmids.json', JSON.stringify(osmIds));
const hash = crypto.createHash('sha1').update(json).digest('hex').slice(0, 10);
fs.writeFileSync('out/roads-meta.json', JSON.stringify({ hash, osmTimestamp: stamp, nodes: outNodes.length / 2, edges: outEdges.length, labels: labels.length, byClass: stats.byClass, km: stats.km.map(Math.round) }));
console.log('roads.json', (json.length / 1e6).toFixed(2), 'MB;', outNodes.length / 2, 'nodes;', outEdges.length, 'edges; per class', JSON.stringify(stats.byClass), 'km', JSON.stringify(stats.km.map(Math.round)));

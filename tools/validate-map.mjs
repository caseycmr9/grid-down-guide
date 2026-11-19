// Checks the map data files in map/ (format, ranges, graph sanity) and, with --routes, runs reference routes on the road graph.
//   node tools/validate-map.mjs [--routes]
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';


const root = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..');
const dirArg = process.argv.find((a) => a.startsWith('--dir='));
const dir = dirArg ? path.resolve(dirArg.slice(6)) : path.join(root, 'map');
const errors = [], warns = [];
const err = (m) => errors.push(m), warn = (m) => warns.push(m);

if (!fs.existsSync(dir)) { console.log('No map/ folder: nothing to validate.'); process.exit(0); }
const M = {};
for (const f of ['ca-base.json', 'ca-places.json', 'ca-pois.json', 'ca-roads.json']) {
  const p = path.join(dir, f);
  if (!fs.existsSync(p)) { err(`missing map/${f}`); continue; }
  let d; try { d = JSON.parse(fs.readFileSync(p, 'utf8')); } catch (e) { err(`map/${f} is not valid JSON: ${e.message}`); continue; }
  if (f === 'ca-base.json') { M.meta = d.meta; M.base = d.base; } else M[f.slice(3, -5)] = d;
}
const BB = [-124.9, 32.2, -113.8, 42.3];
const U = 1e4;
const inBB = (x, y) => x / U >= BB[0] && x / U <= BB[2] && y / U >= BB[1] && y / U <= BB[3];
function flatOk(a, what) {
  if (!Array.isArray(a) || a.length < 4 || a.length % 2) { err(`${what}: not a flat coordinate array`); return false; }
  if (!a.every(Number.isInteger)) { err(`${what}: non-integer coordinate`); return false; }
  return true;
}

// ---- meta + base
if (!M.meta || !M.meta.updated || !M.meta.sources) err('meta (updated, sources) missing');
const B = M.base;
if (!B) err('base missing');
else {
  if (!Array.isArray(B.bbox) || B.bbox.length !== 4) err('base.bbox missing');
  if (!B.state || !B.state.length) err('base.state empty'); else B.state.forEach((r, i) => flatOk(r, 'state ring ' + i));
  if (!B.counties || B.counties.length !== 58) err(`base.counties should have 58 entries (has ${B.counties && B.counties.length})`);
  else B.counties.forEach((c) => { if (!c.n || !Array.isArray(c.c)) err('county entry malformed'); (c.r || []).forEach((r, i) => flatOk(r, c.n + ' ring ' + i)); });
}

// ---- places
const P = M.places;
if (!Array.isArray(P) || P.length < 300) err('places missing or too short');
else {
  let bad = 0; const kinds = [0, 0, 0, 0];
  for (const r of P) {
    if (!Array.isArray(r) || r.length !== 5 || !Number.isInteger(r[0]) || !Number.isInteger(r[1]) || typeof r[2] !== 'string' || !r[2] || !(r[3] >= 0 && r[3] <= 3) || !Number.isInteger(r[4]) || !inBB(r[0], r[1])) bad++; else kinds[r[3]]++;
  }
  if (bad) err(`places: ${bad} malformed records`);
  console.log(`places: ${P.length} (cities ${kinds[0]}, towns ${kinds[1]}, villages ${kinds[2]}, hamlets ${kinds[3]})`);
}

// ---- points of interest
const CATS = ['hospital', 'urgent', 'vet', 'grocery', 'pharmacy', 'fuel', 'fire', 'police', 'airport', 'supplies', 'landmark'];
const MIN = { hospital: 150, urgent: 100, vet: 500, grocery: 1000, pharmacy: 800, fuel: 1500, fire: 500, police: 400, airport: 100, supplies: 200, landmark: 300 };
if (!M.pois) err('pois missing');
else for (const c of CATS) {
  const a = M.pois[c];
  if (!Array.isArray(a)) { err('pois.' + c + ' missing'); continue; }
  if (a.length < MIN[c]) warn(`pois.${c} has only ${a.length} records (expected at least ${MIN[c]})`);
  let bad = 0;
  for (const r of a) if (!Array.isArray(r) || r.length !== 7 || !Number.isInteger(r[0]) || !Number.isInteger(r[1]) || typeof r[2] !== 'string' || !r[2] || typeof r[3] !== 'string' || typeof r[4] !== 'string' || !Number.isInteger(r[5]) || !Number.isInteger(r[6]) || !inBB(r[0], r[1])) bad++;
  if (bad) err(`pois.${c}: ${bad} malformed records`);
}
if (M.pois) console.log('pois: ' + CATS.map((c) => c + ' ' + (M.pois[c] ? M.pois[c].length : 0)).join(', '));

// ---- roads
const R = M.roads;
let NN = 0;
if (!R) err('roads missing');
else {
  const { labels, nodes, edges, exits } = R;
  if (!Array.isArray(labels) || labels[0] !== '') err('roads.labels must start with an empty label');
  if (!Array.isArray(nodes) || nodes.length % 2) err('roads.nodes malformed');
  NN = nodes ? nodes.length / 2 : 0;
  if (!Array.isArray(edges) || edges.length < 1000) err('roads.edges missing or too short');
  else {
    let bad = 0, oneway = 0; const byCls = [0, 0, 0, 0]; let km = 0;
    for (const e of edges) {
      if (!Array.isArray(e) || e.length !== 7 || !(e[0] >= 0 && e[0] < NN) || !(e[1] >= 0 && e[1] < NN) || !(e[2] >= 0 && e[2] <= 3) || !(e[3] === 0 || e[3] === 1) || !(e[4] >= 0 && e[4] < labels.length) || !(e[5] > 0) || !Array.isArray(e[6]) || e[6].length % 2) { bad++; continue; }
      byCls[e[2]]++; if (e[3] & 1) oneway++; km += e[5] / 1000;
    }
    if (bad) err(`roads: ${bad} malformed edges`);
    console.log(`roads: ${NN} nodes, ${edges.length} edges (freeway ${byCls[0]}, trunk ${byCls[1]}, primary ${byCls[2]}, secondary ${byCls[3]}), ${oneway} one-way, ${Math.round(km)} km, ${labels.length} labels, ${(exits || []).length} exits`);
  }
  if (exits) for (const x of exits) if (!(x[0] >= 0 && x[0] < NN)) { err('exit refers to a missing node'); break; }
}

// ---- reference routes (optional)
if (process.argv.includes('--routes') && R && !errors.length) {
  const nodes = R.nodes, edges = R.edges;
  const adj = Array.from({ length: NN }, () => []);
  for (const e of edges) { adj[e[0]].push([e[1], e[5], e[2], e[4]]); if (!(e[3] & 1)) adj[e[1]].push([e[0], e[5], e[2], e[4]]); }
  // strongly connected components (iterative Tarjan): a start or end only makes sense on the big component
  const comp = new Int32Array(NN).fill(-1), idx = new Int32Array(NN).fill(-1), low = new Int32Array(NN), onst = new Uint8Array(NN);
  let counter = 0, ncomp = 0; const stack = [];
  for (let s0 = 0; s0 < NN; s0++) {
    if (idx[s0] !== -1) continue;
    const work = [[s0, 0]]; idx[s0] = low[s0] = counter++; stack.push(s0); onst[s0] = 1;
    while (work.length) {
      const top = work[work.length - 1], u = top[0];
      if (top[1] < adj[u].length) {
        const v = adj[u][top[1]++][0];
        if (idx[v] === -1) { idx[v] = low[v] = counter++; stack.push(v); onst[v] = 1; work.push([v, 0]); }
        else if (onst[v]) low[u] = Math.min(low[u], idx[v]);
      } else {
        if (low[u] === idx[u]) { let w; do { w = stack.pop(); onst[w] = 0; comp[w] = ncomp; } while (w !== u); ncomp++; }
        work.pop(); if (work.length) { const p = work[work.length - 1][0]; low[p] = Math.min(low[p], low[u]); }
      }
    }
  }
  const csize = new Int32Array(ncomp); for (let i = 0; i < NN; i++) csize[comp[i]]++;
  let bigC = 0; for (let c = 1; c < ncomp; c++) if (csize[c] > csize[bigC]) bigC = c;
  let kmIn = 0, kmAll = 0; for (const e of edges) { kmAll += e[5]; if (comp[e[0]] === bigC && comp[e[1]] === bigC) kmIn += e[5]; }
  console.log(`largest two-way-connected network: ${csize[bigC]} of ${NN} nodes, ${(100 * kmIn / kmAll).toFixed(1)}% of road length`);
  if (kmIn / kmAll < 0.9) warn('less than 90% of road length is in the main connected network');
  const SP = [62, 52, 44, 38];
  const hav = (x1, y1, x2, y2) => { const r = Math.PI / 180, dl = (y2 - y1) / U * r, dn = (x2 - x1) / U * r; const a = Math.sin(dl / 2) ** 2 + Math.cos(y1 / U * r) * Math.cos(y2 / U * r) * Math.sin(dn / 2) ** 2; return 12742000 * Math.asin(Math.sqrt(a)); };
  function nearest(lon, lat) { let best = -1, bd = 1e18; const x = lon * U, y = lat * U; for (let i = 0; i < NN; i++) { if (comp[i] !== bigC) continue; const d = hav(x, y, nodes[2 * i], nodes[2 * i + 1]); if (d < bd) { bd = d; best = i; } } return [best, bd]; }
  function route(s, t) {
    const dist = new Float64Array(NN).fill(Infinity), len = new Float64Array(NN), prev = new Int32Array(NN).fill(-1), plab = new Int32Array(NN); dist[s] = 0;
    const heap = [[0, s]];
    const push = (it) => { heap.push(it); let i = heap.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (heap[p][0] <= heap[i][0]) break; [heap[p], heap[i]] = [heap[i], heap[p]]; i = p; } };
    const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let i = 0; for (;;) { let l = 2 * i + 1, r = l + 1, m = i; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === i) break; [heap[m], heap[i]] = [heap[i], heap[m]]; i = m; } } return top; };
    while (heap.length) {
      const [d, u] = pop(); if (d > dist[u]) continue; if (u === t) break;
      for (const [v, m, c, lb] of adj[u]) { const nd = d + m / (SP[c] * 0.44704); if (nd < dist[v]) { dist[v] = nd; len[v] = len[u] + m; prev[v] = u; plab[v] = lb; push([nd, v]); } }
    }
    if (dist[t] === Infinity) return null;
    const steps = []; for (let v = t; v !== s; v = prev[v]) { const lb = R.labels[plab[v]] || '(ramp/unlabeled)'; const m = (len[v] - len[prev[v]]) / 1609.34; if (steps.length && steps[steps.length - 1][0] === lb) steps[steps.length - 1][1] += m; else steps.push([lb, m]); }
    return { meters: len[t], seconds: dist[t], steps: steps.reverse() };
  }
  const C = { 'San Francisco': [-122.4194, 37.7749], 'Los Angeles': [-118.2437, 34.0522], 'Sacramento': [-121.4944, 38.5816], 'San Diego': [-117.1611, 32.7157], 'Redding': [-122.3917, 40.5865], 'Fresno': [-119.7871, 36.7378], 'Bakersfield': [-119.0187, 35.3733], 'Eureka': [-124.1637, 40.8021], 'San Jose': [-121.8863, 37.3382], 'Santa Barbara': [-119.6982, 34.4208], 'Bishop': [-118.3952, 37.3614], 'South Lake Tahoe': [-119.9772, 38.9399], 'Barstow': [-117.0173, 34.8958], 'Palm Springs': [-116.5453, 33.8303], 'Crescent City': [-124.2026, 41.7558], 'Alturas': [-120.5425, 41.4871], 'El Centro': [-115.5631, 32.792] };
  // Not listed on purpose: Santa Barbara -> Los Angeles (this test snaps to one node, which can land on the wrong side of a divided highway; the app snaps to several edges and gets 94 mi)
  // and Fresno -> Bishop (the short way is over Tioga Pass, which closes in winter).
  const T = [['San Francisco', 'Los Angeles', 382], ['Los Angeles', 'San Diego', 120], ['San Francisco', 'Sacramento', 87], ['Sacramento', 'Redding', 160], ['Los Angeles', 'Fresno', 220], ['Fresno', 'Sacramento', 170], ['Bakersfield', 'Los Angeles', 112], ['San Jose', 'San Francisco', 48], ['San Francisco', 'Eureka', 270], ['Los Angeles', 'Palm Springs', 107], ['Sacramento', 'South Lake Tahoe', 100], ['Los Angeles', 'Barstow', 115], ['San Diego', 'El Centro', 120], ['Redding', 'Crescent City', 190], ['Redding', 'Alturas', 150], ['San Diego', 'Redding', 720]];
  const snap = {};
  for (const [n, [lo, la]] of Object.entries(C)) { snap[n] = nearest(lo, la); if (snap[n][1] > 25000) warn(`${n}: nearest road node is ${(snap[n][1] / 1000).toFixed(0)} km away`); }
  const tr = process.argv.find((a) => a.startsWith('--trace='));
  if (tr) { const [a, b] = tr.slice(8).split(','); const r = route(snap[a][0], snap[b][0]); console.log(`TRACE ${a} -> ${b}: ` + (r ? (r.meters / 1609.34).toFixed(0) + ' mi, ' + r.steps.map((x) => x[0] + ' ' + x[1].toFixed(1)).join(' | ') : 'none')); }
  let bad = 0;
  for (const [a, b, mi] of T) {
    const r = route(snap[a][0], snap[b][0]);
    if (!r) { err(`no route ${a} -> ${b}`); bad++; continue; }
    const got = r.meters / 1609.34, off = (got - mi) / mi;
    const flag = Math.abs(off) > 0.15 ? '  <-- CHECK' : '';
    if (Math.abs(off) > 0.25) { err(`route ${a} -> ${b}: ${got.toFixed(0)} mi, expected about ${mi}`); bad++; }
    console.log(`${(a + ' -> ' + b).padEnd(40)} ${got.toFixed(0).padStart(4)} mi (expect ~${mi}), ${(r.seconds / 3600).toFixed(1)} h${flag}`);
  }
}

if (warns.length) console.log('\nWarnings:\n  ' + warns.join('\n  '));
if (errors.length) { console.log('\nMap data errors:\n  ' + errors.join('\n  ')); process.exit(1); }
console.log('\nMap data OK');

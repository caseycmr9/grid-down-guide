/* Grid Down Guide: California map and highway directions (route #/map).

   DATA FORMAT. Four lazily loaded JSON files (fetched, then JSON.parse; a huge script literal is slow and memory hungry on phones) are stored on window.GDG_MAP.
   Coordinates are integers in units of 1e-4 degree
   (x = longitude * 1e4, y = latitude * 1e4). A "flat delta" array is [x0, y0, dx1, dy1, dx2, dy2, ...]: the first pair is absolute, the rest are differences.
     map/ca-base.json    {meta:{updated, region, sources}, base:{bbox, state:[ring], neighbors:{name:[ring]}, counties:[{n, c:[lon,lat], r:[ring]}],
                       lakes:[{n, r:[ring]}], rivers:[{n, l:line}]}} with every ring and line a flat delta array.
     map/ca-places.json  [[x, y, name, kind (0 city, 1 town, 2 village, 3 hamlet), pop], ...]
     map/ca-pois.json    {hospital, urgent, vet, grocery, pharmacy, fuel, fire, police, airport, supplies, landmark: [[x, y, name, addr, phone, flags, sub], ...]}
                       flags: 1 = open 24/7, 2 = emergency room. sub: landmark subtype (LM below); airport 1 = commercial airline airport.
     map/ca-roads.json   {labels:[string], nodes:[x0,y0,x1,y1,...] (absolute; node id = pair index),
                       edges:[[a, b, cls, flags, lab, lenM, geom], ...], exits:[[nodeId, ref, name], ...]}
                       cls 0 freeway, 1 trunk, 2 primary, 3 secondary. flags bit 0 = one-way from a to b. lab indexes labels. lenM is the true length in meters.
                       geom = interior shape points only, as flat deltas (the first delta is relative to node a).
   ROUTING. Time-weighted A* over a CSR graph in typed arrays. Each endpoint is snapped to the nearest point on the nearest edges (grid over edge boxes, ring search),
   and the snapped points become virtual start and goal nodes, so a start in the middle of a 40 km edge works and one-way edges are respected.
   The search is fast enough (see App.mapTest.perf) to run on the main thread, so there is no worker.

   Sections: helpers, data loading, spatial lookup, routing, directions text, search index, then the screen (camera, drawing, gestures, UI panels). */
(window.GDG_MODULES = window.GDG_MODULES || []).push(function (App) {
  'use strict';
  var S = App.S, e = App.esc;
  var $ = function (s, el) { return (el || document).querySelector(s); };
  var NS = (window.GDG_MAP = window.GDG_MAP || {});
  var RAD = Math.PI / 180;
  var Z_MIN = 5, Z_MAX = 15;
  var ATTRIBUTION = '© OpenStreetMap contributors · US Census · Natural Earth';
  var SAFETY = 'Highway route only. Road closures, wildfire, flooding, snow and chain controls are not known to this app. Check signs and radio, and carry a paper map.';
  var OFFNET = 'This app has no local street data: use a paper map, signs and local knowledge for this part.';
  var FAIL_MSG = 'Map data could not load. Connect to the internet once so the app can finish saving it, then try again.';
  var FONT = 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
  var EMOJI_FONT = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';

  /* ================= 1. LAYERS AND SMALL HELPERS ================= */
  // min = lowest zoom where the layer draws; hs = half size of its badge in px; top = may draw over place labels
  var LAYERS = [
    { id: 'hospital', label: 'Hospitals', one: 'Hospital', icon: '🏥', min: 5, color: '#c62828', hs: 14, top: 1, words: 'hospital emergency room er medical center clinic' },
    { id: 'urgent', label: 'Urgent care', one: 'Urgent care', icon: '➕', min: 8.5, color: '#e65100', hs: 12, words: 'urgent care walk-in clinic' },
    { id: 'pharmacy', label: 'Pharmacies', one: 'Pharmacy', icon: '💊', min: 10, color: '#00838f', hs: 12, words: 'pharmacy drug store medicine' },
    { id: 'grocery', label: 'Groceries', one: 'Grocery store', icon: '🛒', min: 9.5, color: '#2e7d32', hs: 12, words: 'grocery supermarket food store market' },
    { id: 'fuel', label: 'Fuel', one: 'Fuel station', icon: '⛽', min: 9.5, color: '#1565c0', hs: 12, words: 'fuel gas station petrol diesel' },
    { id: 'fire', label: 'Fire', one: 'Fire station', icon: '🚒', min: 10, color: '#bf360c', hs: 12, words: 'fire station' },
    { id: 'police', label: 'Police', one: 'Police station', icon: '🚓', min: 10, color: '#283593', hs: 12, words: 'police sheriff station' },
    { id: 'vet', label: 'Vets', one: 'Veterinarian', icon: '🐾', min: 10, color: '#6a1b9a', hs: 12, words: 'veterinarian vet animal pet' },
    { id: 'airport', label: 'Airports', one: 'Airports and airfields', icon: '✈️', min: 7, color: '#455a64', hs: 13, words: 'airport airfield airstrip landing strip' },
    { id: 'supplies', label: 'Hardware', one: 'Hardware or supplies', icon: '🔧', min: 10.5, color: '#6d4c41', hs: 12, words: 'hardware supplies tools store' },
    { id: 'landmark', label: 'Landmarks', one: 'Landmark', icon: '⭐', min: 7, color: '#f9a825', hs: 12, words: 'landmark peak pass park viewpoint historic' }
  ];
  var LBY = {};
  LAYERS.forEach(function (L) { LBY[L.id] = L; });
  var ICON_ORDER = ['hospital', 'urgent', 'airport', 'landmark', 'pharmacy', 'fire', 'police', 'grocery', 'vet', 'fuel', 'supplies'];
  var DEFAULT_ON = { hospital: 1, urgent: 1, airport: 1, vet: 1, grocery: 1, fuel: 1 };
  var CAP = 150; // most icons drawn per layer
  // landmark subtypes: icon, plain name, importance weight
  var LM = {
    0: ['⭐', 'Attraction or viewpoint', 2], 1: ['🏰', 'Historic site', 2], 2: ['⛰️', 'Peak', 4], 3: ['🛣️', 'Mountain pass', 4], 4: ['🏞️', 'National or state park', 5],
    5: ['🏟️', 'Stadium, arena or theatre', 3], 6: ['🏛️', 'Government building', 2], 7: ['🎓', 'College or university', 3], 8: ['🌊', 'Dam', 2], 9: ['🗼', 'Tower or lighthouse', 3], 10: ['🎡', 'Museum, zoo or theme park', 3]
  };
  var NEAR_TYPES = [
    ['hospital', 'Hospital with ER', '🏥'], ['urgent', 'Urgent care', '➕'], ['vet', 'Veterinarian', '🐾'], ['grocery', 'Grocery', '🛒'], ['pharmacy', 'Pharmacy', '💊'],
    ['fuel', 'Fuel', '⛽'], ['fire', 'Fire station', '🚒'], ['police', 'Police', '🚓'], ['airport', 'Airfield', '✈️']
  ];
  var PLACE_LABEL = ['City', 'Town', 'Village', 'Hamlet'];

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function num(v) { return typeof v === 'number' && isFinite(v); }
  function fold(s) {
    s = String(s == null ? '' : s).toLowerCase();
    try { if (s.normalize) s = s.normalize('NFD').replace(/[̀-ͯ]/g, ''); } catch (err) { /* old engine: skip accent folding */ }
    return s.replace(/['’`]/g, '').replace(/[^a-z0-9]+/g, ' ').replace(/^ | $/g, '');
  }
  function hav(x1, y1, x2, y2) {
    var la1 = y1 * 1e-4 * RAD, la2 = y2 * 1e-4 * RAD, dl = (x2 - x1) * 1e-4 * RAD, dp = la2 - la1;
    var a = Math.sin(dp / 2) * Math.sin(dp / 2) + Math.cos(la1) * Math.cos(la2) * Math.sin(dl / 2) * Math.sin(dl / 2);
    return 12742017.6 * Math.asin(Math.min(1, Math.sqrt(a)));
  }
  function brg(x1, y1, x2, y2) {
    var la1 = y1 * 1e-4 * RAD, la2 = y2 * 1e-4 * RAD, dl = (x2 - x1) * 1e-4 * RAD;
    var yy = Math.sin(dl) * Math.cos(la2), xx = Math.cos(la1) * Math.sin(la2) - Math.sin(la1) * Math.cos(la2) * Math.cos(dl);
    return (Math.atan2(yy, xx) / RAD + 360) % 360;
  }
  var C8 = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  function c8(b) { return C8[Math.round(b / 45) % 8]; }
  function dirWord(b) { // signed-direction style: cardinal within 30 degrees, else a diagonal
    if (b < 30 || b >= 330) return 'northbound';
    if (b < 60) return 'northeastbound'; if (b < 120) return 'eastbound'; if (b < 150) return 'southeastbound';
    if (b < 210) return 'southbound'; if (b < 240) return 'southwestbound'; if (b < 300) return 'westbound'; return 'northwestbound';
  }
  function fmtMi(m) {
    var v = m / 1609.344;
    if (m < 160) return Math.max(10, Math.round(m * 3.28084 / 10) * 10) + ' ft';
    return v < 10 ? (Math.round(v * 10) / 10) + ' mi' : Math.round(v).toLocaleString('en-US') + ' mi';
  }
  function fmtKm(m) {
    if (m < 160) return Math.max(10, Math.round(m / 10) * 10) + ' m';
    var v = m / 1000;
    return v < 10 ? (Math.round(v * 10) / 10) + ' km' : Math.round(v).toLocaleString('en-US') + ' km';
  }
  function fmtDist(m) { return S.units === 'metric' ? fmtKm(m) : fmtMi(m); }
  function fmtBoth(m) { return S.units === 'metric' ? fmtKm(m) + ' (' + fmtMi(m) + ')' : fmtMi(m) + ' (' + fmtKm(m) + ')'; }
  function fmtTime(sec) {
    var mins = Math.max(1, Math.round(sec / 60));
    if (mins < 60) return mins + ' min';
    var h = Math.floor(mins / 60), m = mins % 60;
    return h + ' h' + (m ? ' ' + m + ' min' : '');
  }
  function fmtLL(x, y) { return (y / 1e4).toFixed(4) + ', ' + (x / 1e4).toFixed(4); }
  function digits(p) { return String(p || '').replace(/[^0-9+]/g, ''); }
  function copyText(text, okMsg) {
    function fallback() {
      try {
        var ta = document.createElement('textarea'); ta.value = text; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0';
        document.body.appendChild(ta); ta.select(); ta.setSelectionRange(0, text.length);
        var ok = document.execCommand('copy'); document.body.removeChild(ta);
        App.toast(ok ? okMsg : 'Could not copy. Select the text and copy it.');
      } catch (err) { App.toast('Could not copy. Select the text and copy it.'); }
    }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(function () { App.toast(okMsg); }, fallback);
    else fallback();
  }

  /* ================= 2. DATA LOADING ================= */
  var DS = { base: null, places: null, pois: null, roads: null }; // decoded structures, built once per page lifetime
  var ST = { base: 'idle', places: 'idle', pois: 'idle', roads: 'idle' }; // idle | loading | ok | err
  var INFLIGHT = {}, LISTEN = [], TIMES = {}; // TIMES: milliseconds spent loading (script fetch and parse) and building each part, for diagnostics
  function notify() { LISTEN.slice().forEach(function (f) { try { f(); } catch (err) { /* a closed screen */ } }); }

  var ERR = {}; // part -> short technical reason, shown under the failure message so a problem can be diagnosed from a phone
  function why(err) { var m = String(err && err.message || err || 'unknown'); return m.length > 140 ? m.slice(0, 140) + '…' : m; }
  function failHtml(name) { return e(FAIL_MSG) + (ERR[name] ? '<br><small>Details: ' + e(name) + ': ' + e(ERR[name]) + '</small>' : ''); }
  function sleepMs(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  // Reads one data file and returns the parsed object. The single-file build embeds the data as <script type="application/json" data-lazy="...">.
  // Otherwise it is fetched (from the offline cache when installed), retrying a few times in case the connection hiccups.
  function loadData(src) {
    var inline = document.querySelector('script[data-lazy="' + src + '"]');
    if (inline) return Promise.resolve().then(function () { return JSON.parse(inline.textContent); });
    var tries = [{}, { cache: 'reload' }, { cache: 'reload' }];
    // a damaged copy in the offline cache would be served again and again: drop it, then the next try goes to the network
    function dropCached() {
      if (!window.caches) return Promise.resolve();
      return caches.keys().then(function (ks) { return Promise.all(ks.map(function (k) { return caches.open(k).then(function (c) { return c.delete(src); }); })); }).catch(function () {});
    }
    function recache() {
      if (!window.caches || !window.GDG_VERSION) return;
      caches.open('gdg-' + window.GDG_VERSION).then(function (c) { return c.add(new Request(src, { cache: 'reload' })); }).catch(function () {});
    }
    function attempt(i) {
      return fetch(src, tries[i]).then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.text();
      }).then(function (t) {
        if (!t) throw new Error('empty response');
        var d = JSON.parse(t);
        if (i > 0) recache();
        return d;
      }).catch(function (err) {
        if (i + 1 >= tries.length) throw err;
        var damaged = (err && err.name === 'SyntaxError') || /empty response/.test(String(err && err.message));
        return (damaged ? dropCached() : Promise.resolve()).then(function () { return sleepMs(600 * (i + 1)); }).then(function () { return attempt(i + 1); });
      });
    }
    return attempt(0);
  }

  function decodeLine(a) {
    var out = new Int32Array(a.length), x = a[0], y = a[1];
    out[0] = x; out[1] = y;
    for (var i = 2; i < a.length; i += 2) { x += a[i]; y += a[i + 1]; out[i] = x; out[i + 1] = y; }
    return out;
  }
  function ringOf(a) {
    var p = decodeLine(a), x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (var i = 0; i < p.length; i += 2) { if (p[i] < x0) x0 = p[i]; if (p[i] > x1) x1 = p[i]; if (p[i + 1] < y0) y0 = p[i + 1]; if (p[i + 1] > y1) y1 = p[i + 1]; }
    return { p: p, x0: x0, y0: y0, x1: x1, y1: y1 };
  }
  function bboxOf(rings) {
    var b = { x0: 1e9, y0: 1e9, x1: -1e9, y1: -1e9 };
    rings.forEach(function (r) { b.x0 = Math.min(b.x0, r.x0); b.y0 = Math.min(b.y0, r.y0); b.x1 = Math.max(b.x1, r.x1); b.y1 = Math.max(b.y1, r.y1); });
    return b;
  }

  function buildBase() {
    var b = NS.base, out = { state: b.state.map(ringOf), nbr: [], counties: [], lakes: [], rivers: [] };
    Object.keys(b.neighbors || {}).forEach(function (k) { (b.neighbors[k] || []).forEach(function (r) { out.nbr.push(ringOf(r)); }); });
    out.counties = b.counties.map(function (c) {
      var rings = c.r.map(ringOf), bb = bboxOf(rings);
      return { n: String(c.n || ''), lx: Math.round(c.c[0] * 1e4), ly: Math.round(c.c[1] * 1e4), rings: rings, x0: bb.x0, y0: bb.y0, x1: bb.x1, y1: bb.y1 };
    });
    out.lakes = (b.lakes || []).map(function (l) { return { n: l.n, rings: l.r.map(ringOf) }; });
    out.rivers = (b.rivers || []).map(function (r) { return ringOf(r.l); });
    var bb = b.bbox || [-124.6, 32.4, -114, 42.1];
    out.bbox = { x0: Math.round(bb[0] * 1e4), y0: Math.round(bb[1] * 1e4), x1: Math.round(bb[2] * 1e4), y1: Math.round(bb[3] * 1e4) };
    DS.base = out;
  }

  function buildPlaces() {
    var a = NS.places, n = a.length, x = new Int32Array(n), y = new Int32Array(n), kind = new Uint8Array(n), pop = new Int32Array(n), name = [], m = 0, i;
    for (i = 0; i < n; i++) {
      var r = a[i];
      if (!r || !num(r[0]) || !num(r[1]) || typeof r[2] !== 'string') continue;
      x[m] = r[0]; y[m] = r[1]; name.push(r[2]); kind[m] = clamp(r[3] | 0, 0, 3); pop[m] = r[4] | 0; m++;
    }
    var ord = []; for (i = 0; i < m; i++) ord.push(i);
    ord.sort(function (p, q) { return kind[p] - kind[q] || pop[q] - pop[p] || p - q; });
    DS.places = { n: m, x: x, y: y, name: name, kind: kind, pop: pop, ord: Int32Array.from(ord) };
  }

  function importance(L, rec) {
    var f = rec[5] | 0;
    if (L.id === 'hospital') return (f & 2 ? 100 : 0) + (f & 1 ? 10 : 0);
    if (L.id === 'airport') return (rec[6] ? 100 : 0) + (/international/i.test(rec[2]) ? 20 : 0);
    if (L.id === 'landmark') return (LM[rec[6]] ? LM[rec[6]][2] : 2) * 10;
    return f & 1 ? 5 : 0;
  }
  function buildPois() {
    var src = NS.pois, out = {};
    LAYERS.forEach(function (L) {
      var a = Array.isArray(src[L.id]) ? src[L.id] : [], recs = [], i;
      for (i = 0; i < a.length; i++) { var r = a[i]; if (r && num(r[0]) && num(r[1])) recs.push(r); }
      var n = recs.length, x = new Int32Array(n), y = new Int32Array(n), pri = new Float64Array(n), idx = [];
      for (i = 0; i < n; i++) { x[i] = recs[i][0]; y[i] = recs[i][1]; pri[i] = importance(L, recs[i]) + ((Math.imul(i + 1, 2654435761) >>> 0) / 4294967296) * 0.9; idx.push(i); } // random tie-break keeps thinning even
      idx.sort(function (p, q) { return pri[q] - pri[p]; });
      out[L.id] = { id: L.id, n: n, x: x, y: y, rec: recs, pr: Int32Array.from(idx) };
    });
    DS.pois = out;
  }

  /* Roads: sorted by class, geometry flattened into one Int32Array, CSR adjacency. Built in time-sliced chunks so the UI never freezes. */
  var SPD = [62, 52, 44, 38].map(function (mph) { return mph * 0.44704; }); // meters per second by class
  var VMAX = SPD[0];
  function labelKind(s) { // 0 none, 1 interstate, 2 numbered route, 3 plain name, 5 numbered route variant (historic, business, express...)
    if (!s) return 0;
    if (/\b(Hist|BUS|ALT|EXPR|TRUCK|SPUR|CONN|BYP|TEMP)\b/i.test(s)) return 5;
    return /^I[ -]?\d/.test(s) ? 1 : /^(US|CA|SR|CR|Hwy|Route)[ -]?\d/i.test(s) ? 2 : 3;
  }
  function buildRoads() {
    return new Promise(function (resolve, reject) {
      try {
        var R = NS.roads, nodes = R.nodes, edges = R.edges, labels = R.labels.map(function (l) { return String(l == null ? '' : l).replace(/^([A-Z]{1,2})-(\d)/, '$1 $2'); });
        var tb0 = performance.now(), N = nodes.length >> 1, E0 = edges.length, i, cnt = [0, 0, 0, 0], cls = new Uint8Array(E0), ok = new Uint8Array(E0), total = 0;
        for (i = 0; i < E0; i++) {
          var ed = edges[i];
          if (!ed || !(ed[0] >= 0 && ed[0] < N && ed[1] >= 0 && ed[1] < N) || !Array.isArray(ed[6])) continue;
          ok[i] = 1; cls[i] = clamp(ed[2] | 0, 0, 3); cnt[cls[i]]++; total += (ed[6].length >> 1) + 2;
        }
        var E = cnt[0] + cnt[1] + cnt[2] + cnt[3], cs = [0, cnt[0], cnt[0] + cnt[1], cnt[0] + cnt[1] + cnt[2], E], fill = cs.slice(0, 4), ord = new Int32Array(E);
        for (i = 0; i < E0; i++) if (ok[i]) ord[fill[cls[i]]++] = i;
        var X = {
          N: N, E: E, cs: cs, labels: labels, ea: new Int32Array(E), eb: new Int32Array(E), ecl: new Uint8Array(E), efl: new Uint8Array(E), elab: new Int32Array(E),
          elen: new Float64Array(E), etime: new Float64Array(E), goff: new Int32Array(E + 1), P: new Int32Array(total * 2), bx0: new Int32Array(E), by0: new Int32Array(E),
          bx1: new Int32Array(E), by1: new Int32Array(E), nx: new Int32Array(N), ny: new Int32Array(N), lkind: new Uint8Array(labels.length), exits: {}
        };
        for (i = 0; i < N; i++) { X.nx[i] = nodes[2 * i]; X.ny[i] = nodes[2 * i + 1]; }
        X.lgrp = new Int32Array(labels.length); // labels that are the same road for directions (express lanes join their highway)
        var grpOf = {};
        for (i = 0; i < labels.length; i++) {
          X.lkind[i] = labelKind(labels[i]);
          var gk = labels[i].replace(/\s+EXPR$/i, '');
          if (grpOf[gk] === undefined) grpOf[gk] = i;
          X.lgrp[i] = grpOf[gk];
        }
        var k = 0, pos = 0, tSync = performance.now() - tb0, tMaxSlice = 0;
        function slice() {
          var t0 = Date.now(), ts0 = performance.now();
          while (k < E && Date.now() - t0 < 12) {
            var ed = edges[ord[k]], a = ed[0], b = ed[1], g = ed[6], P = X.P, o = pos * 2, x = X.nx[a], y = X.ny[a];
            var x0 = x, y0 = y, x1 = x, y1 = y, len = 0, px = x, py = y;
            P[o++] = x; P[o++] = y;
            var j, gx, gy;
            for (j = 0; j + 1 < g.length; j += 2) {
              gx = px + g[j]; gy = py + g[j + 1]; P[o++] = gx; P[o++] = gy; len += hav(px, py, gx, gy); px = gx; py = gy;
              if (gx < x0) x0 = gx; if (gx > x1) x1 = gx; if (gy < y0) y0 = gy; if (gy > y1) y1 = gy;
            }
            gx = X.nx[b]; gy = X.ny[b]; P[o++] = gx; P[o++] = gy; len += hav(px, py, gx, gy);
            if (gx < x0) x0 = gx; if (gx > x1) x1 = gx; if (gy < y0) y0 = gy; if (gy > y1) y1 = gy;
            X.ea[k] = a; X.eb[k] = b; X.ecl[k] = cls[ord[k]]; X.efl[k] = ed[3] & 1; X.elab[k] = ed[4] >= 0 && ed[4] < labels.length ? ed[4] | 0 : 0;
            X.elen[k] = ed[5] > 0 ? ed[5] : Math.max(1, len); X.etime[k] = X.elen[k] / SPD[X.ecl[k]];
            X.bx0[k] = x0; X.by0[k] = y0; X.bx1[k] = x1; X.by1[k] = y1;
            pos = o >> 1; X.goff[k + 1] = pos; k++;
          }
          tMaxSlice = Math.max(tMaxSlice, performance.now() - ts0);
          if (k < E) { setTimeout(slice, 0); return; }
          try {
            var tc0 = performance.now();
            // CSR adjacency: arc id = edge * 2 + dir (dir 0 travels a to b, dir 1 travels b to a)
            var deg = new Int32Array(N + 1), e2;
            for (e2 = 0; e2 < E; e2++) { deg[X.ea[e2] + 1]++; if (!X.efl[e2]) deg[X.eb[e2] + 1]++; }
            for (e2 = 0; e2 < N; e2++) deg[e2 + 1] += deg[e2];
            var adj = new Int32Array(deg[N]), at = deg.slice(0, N);
            for (e2 = 0; e2 < E; e2++) { adj[at[X.ea[e2]]++] = e2 * 2; if (!X.efl[e2]) adj[at[X.eb[e2]]++] = e2 * 2 + 1; }
            X.adjStart = deg; X.adjArc = adj; var tc1 = performance.now(); X.main = mainComponent(X);
            X.timing = { firstPassMs: Math.round(tSync), longestSliceMs: Math.round(tMaxSlice), csrMs: Math.round(tc1 - tc0), sccMs: Math.round(performance.now() - tc1) };
            (Array.isArray(R.exits) ? R.exits : []).forEach(function (x2) { if (x2 && x2[0] >= 0 && x2[0] < N) X.exits[x2[0]] = { ref: String(x2[1] == null ? '' : x2[1]), name: String(x2[2] == null ? '' : x2[2]) }; });
            DS.roads = X; resolve();
          } catch (err) { reject(err); }
        }
        slice();
      } catch (err) { reject(err); }
    });
  }

  // Largest strongly connected component (iterative Tarjan): the part of the road network you can drive into and out of again.
  // Small one-way-only pockets and islands fall outside it, so the router does not snap to them when a main road is close.
  function mainComponent(X) {
    var N = X.N, idx = new Int32Array(N).fill(-1), low = new Int32Array(N), onSt = new Uint8Array(N), stack = new Int32Array(N), call = new Int32Array(N), ptr = new Int32Array(N), comp = new Int32Array(N);
    var counter = 0, sp = 0, nc = 0, sizes = [], s;
    for (s = 0; s < N; s++) {
      if (idx[s] >= 0) continue;
      var cp = 0;
      call[cp++] = s; idx[s] = low[s] = counter++; stack[sp++] = s; onSt[s] = 1; ptr[s] = X.adjStart[s];
      while (cp > 0) {
        var v = call[cp - 1];
        if (ptr[v] < X.adjStart[v + 1]) {
          var arc = X.adjArc[ptr[v]++], e2 = arc >> 1, w = arc & 1 ? X.ea[e2] : X.eb[e2];
          if (idx[w] < 0) { idx[w] = low[w] = counter++; stack[sp++] = w; onSt[w] = 1; ptr[w] = X.adjStart[w]; call[cp++] = w; }
          else if (onSt[w] && idx[w] < low[v]) low[v] = idx[w];
        } else {
          if (low[v] === idx[v]) { var size = 0, w2; do { w2 = stack[--sp]; onSt[w2] = 0; comp[w2] = nc; size++; } while (w2 !== v); sizes.push(size); nc++; }
          cp--;
          if (cp > 0) { var u = call[cp - 1]; if (low[v] < low[u]) low[u] = low[v]; }
        }
      }
    }
    var best = 0, c; for (c = 1; c < nc; c++) if (sizes[c] > sizes[best]) best = c;
    var main = new Uint8Array(N); for (s = 0; s < N; s++) main[s] = comp[s] === best ? 1 : 0;
    X.mainCount = sizes[best] || 0;
    return main;
  }

  var PARTS = {
    base: { src: 'map/ca-base.json', assign: function (d) { NS.meta = d && d.meta; NS.base = d && d.base; }, check: function () { var b = NS.base; return !!(b && Array.isArray(b.state) && Array.isArray(b.counties) && b.counties.length); }, build: function () { buildBase(); } },
    places: { src: 'map/ca-places.json', assign: function (d) { NS.places = d; }, check: function () { return Array.isArray(NS.places); }, build: function () { buildPlaces(); } },
    pois: { src: 'map/ca-pois.json', assign: function (d) { NS.pois = d; }, check: function () { return !!(NS.pois && typeof NS.pois === 'object'); }, build: function () { buildPois(); } },
    roads: { src: 'map/ca-roads.json', assign: function (d) { NS.roads = d; }, check: function () { var r = NS.roads; return !!(r && Array.isArray(r.nodes) && Array.isArray(r.edges) && Array.isArray(r.labels)); }, build: buildRoads }
  };
  function loadPart(name) {
    var P = PARTS[name];
    if (ST[name] === 'ok') return Promise.resolve();
    if (INFLIGHT[name]) return INFLIGHT[name];
    ST[name] = 'loading'; notify();
    var t0 = performance.now(), t1 = 0;
    INFLIGHT[name] = Promise.resolve()
      .then(function () { return P.check() ? null : loadData(P.src).then(function (d) { P.assign(d); }); })
      .then(function () { t1 = performance.now(); if (!P.check()) throw new Error('bad data in ' + P.src); return P.build(); })
      .then(function () { if (name === 'base') NS.base = null; else NS[name] = null; /* the built typed arrays replace the raw data: let it go to save phone memory */ ST[name] = 'ok'; ERR[name] = ''; TIMES[name] = { load: Math.round(t1 - t0), build: Math.round(performance.now() - t1) }; }, function (err) { ST[name] = 'err'; ERR[name] = why(err); try { NS[name] = undefined; if (name === 'base') NS.meta = undefined; } catch (e2) { /* ignore */ } if (window.console) console.warn('map: ' + name + ' failed', err); })
      .then(function () { INFLIGHT[name] = null; notify(); });
    return INFLIGHT[name];
  }
  function loadAll() {
    var go = function () { loadPart('places'); loadPart('pois'); loadPart('roads'); };
    loadPart('base').then(go);
  }
  function retryFailed() {
    var again = ST.base === 'err';
    if (again) loadPart('base').then(function () { ['places', 'pois', 'roads'].forEach(function (n) { if (ST[n] !== 'ok') loadPart(n); }); });
    else ['places', 'pois', 'roads'].forEach(function (n) { if (ST[n] === 'err') loadPart(n); });
  }

  /* ================= 3. SPATIAL LOOKUP: counties, projection ================= */
  var MY0 = 300000, MYN = 140001, MYT = null; // Mercator y lookup for integer latitudes 30.0000 to 44.0000 degrees
  function mercN(latDeg) { var s = Math.sin(latDeg * RAD); return 0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI); }
  function initMerc() { if (MYT) return; MYT = new Float64Array(MYN); for (var i = 0; i < MYN; i++) MYT[i] = mercN((MY0 + i) * 1e-4); }
  function nxOf(X) { return (X + 1800000) / 3600000; }
  function nyOf(Y) { var i = Y - MY0; return i >= 0 && i < MYN ? MYT[i] : mercN(Y * 1e-4); }
  function latOfNy(n) { return Math.atan(Math.sinh(Math.PI * (1 - 2 * n))) / RAD; }

  function pipRing(p, x, y) {
    var inside = false, n = p.length;
    for (var i = 0, j = n - 2; i < n; j = i, i += 2) {
      var xi = p[i], yi = p[i + 1], xj = p[j], yj = p[j + 1];
      if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  }
  function countyAt(x, y) {
    var B = DS.base; if (!B) return '';
    for (var i = 0; i < B.counties.length; i++) {
      var c = B.counties[i];
      if (x < c.x0 || x > c.x1 || y < c.y0 || y > c.y1) continue;
      for (var j = 0; j < c.rings.length; j++) if (pipRing(c.rings[j].p, x, y)) return c.n;
    }
    return '';
  }

  /* ================= 4. ROUTING ================= */
  var V_OFF = 11.18; // m/s (25 mph): the cost of the off-network distance from a point to its snapped road point
  var RG = null;
  function rtInit() {
    var R = DS.roads;
    if (RG && RG.R === R) return RG;
    RG = {
      R: R, g: new Float64Array(R.N), gs: new Int32Array(R.N), cl: new Int32Array(R.N), prev: new Int32Array(R.N), tx: new Float64Array(R.N), ts: new Int32Array(R.N), tw: new Int32Array(R.N),
      run: 0, seen: new Int32Array(R.E), sstamp: 0, hk: new Float64Array(1 << 15), hn: new Int32Array(1 << 15), hs: 0, popK: 0, grid: null
    };
    return RG;
  }
  function hpush(k, n) {
    var G = RG;
    if (G.hs >= G.hk.length) { var nk = new Float64Array(G.hk.length * 2), nn = new Int32Array(G.hn.length * 2); nk.set(G.hk); nn.set(G.hn); G.hk = nk; G.hn = nn; }
    var hk = G.hk, hn = G.hn, i = G.hs++;
    while (i > 0) { var p = (i - 1) >> 1; if (hk[p] <= k) break; hk[i] = hk[p]; hn[i] = hn[p]; i = p; }
    hk[i] = k; hn[i] = n;
  }
  function hpop() {
    var G = RG, hk = G.hk, hn = G.hn, rn = hn[0], s = --G.hs;
    G.popK = hk[0];
    if (s > 0) {
      var k = hk[s], n = hn[s], i = 0;
      for (;;) { var c = 2 * i + 1; if (c >= s) break; if (c + 1 < s && hk[c + 1] < hk[c]) c++; if (hk[c] >= k) break; hk[i] = hk[c]; hn[i] = hn[c]; i = c; }
      hk[i] = k; hn[i] = n;
    }
    return rn;
  }
  function rtGrid() {
    var G = rtInit(); if (G.grid) return G.grid;
    var R = DS.roads, cs = 500, E = R.E, i, minX = 1e9, minY = 1e9, maxX = -1e9, maxY = -1e9;
    for (i = 0; i < E; i++) { if (R.bx0[i] < minX) minX = R.bx0[i]; if (R.bx1[i] > maxX) maxX = R.bx1[i]; if (R.by0[i] < minY) minY = R.by0[i]; if (R.by1[i] > maxY) maxY = R.by1[i]; }
    if (!E) { minX = minY = 0; maxX = maxY = 1; }
    var x0 = Math.floor(minX / cs), y0 = Math.floor(minY / cs), w = Math.floor(maxX / cs) - x0 + 1, h = Math.floor(maxY / cs) - y0 + 1;
    var cnt = new Int32Array(w * h + 1), cx, cy;
    for (i = 0; i < E; i++) for (cy = Math.floor(R.by0[i] / cs) - y0; cy <= Math.floor(R.by1[i] / cs) - y0; cy++) for (cx = Math.floor(R.bx0[i] / cs) - x0; cx <= Math.floor(R.bx1[i] / cs) - x0; cx++) cnt[cy * w + cx + 1]++;
    for (i = 0; i < w * h; i++) cnt[i + 1] += cnt[i];
    var at = cnt.slice(0, w * h), list = new Int32Array(cnt[w * h]);
    for (i = 0; i < E; i++) for (cy = Math.floor(R.by0[i] / cs) - y0; cy <= Math.floor(R.by1[i] / cs) - y0; cy++) for (cx = Math.floor(R.bx0[i] / cs) - x0; cx <= Math.floor(R.bx1[i] / cs) - x0; cx++) list[at[cy * w + cx]++] = i;
    G.grid = { cs: cs, x0: x0, y0: y0, w: w, h: h, start: cnt, list: list };
    return G.grid;
  }
  var SN = { t: 0, sx: 0, sy: 0 };
  // distance in meters from query to the polyline of edge e; also sets SN (position along the edge in meters and the snapped point)
  function polyDist(ei, qx, qy, mx, my) {
    var R = DS.roads, P = R.P, i0 = R.goff[ei] * 2, i1 = R.goff[ei + 1] * 2;
    var best = Infinity, bestAlong = 0, along = 0, bsx = 0, bsy = 0;
    var ax = (P[i0] - qx) * mx, ay = (P[i0 + 1] - qy) * my;
    for (var i = i0 + 2; i < i1; i += 2) {
      var bx = (P[i] - qx) * mx, by = (P[i + 1] - qy) * my, dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy;
      var u = l2 > 0 ? clamp(-(ax * dx + ay * dy) / l2, 0, 1) : 0, qx2 = ax + u * dx, qy2 = ay + u * dy, d2 = qx2 * qx2 + qy2 * qy2, sl = Math.sqrt(l2);
      if (d2 < best) { best = d2; bestAlong = along + u * sl; bsx = qx + qx2 / mx; bsy = qy + qy2 / my; }
      along += sl; ax = bx; ay = by;
    }
    SN.t = along > 0 ? bestAlong * (R.elen[ei] / along) : 0; SN.sx = bsx; SN.sy = bsy;
    return Math.sqrt(best);
  }
  // A person cannot join a freeway mid-way, so freeway mainline and trunk edges count as farther away than they are (in meters)
  function snapPenalty(ei) {
    var R = DS.roads, c = R.ecl[ei];
    if (c === 0) return R.elab[ei] ? 1500 : 400;
    if (c === 1) return R.elab[ei] ? 500 : 300;
    return 0;
  }
  // Candidate points on nearby edges, best first: every edge within (best + 2.5 km), up to 24, so both carriageways of a divided
  // highway and better connected roads nearby are options (each candidate pays its own off-network distance at 25 mph in the search). Edges outside the main network (small one-way pockets, islands) are skipped when a main road is within 5 km of the best one (they cannot be routed to reliably).
  function snapPoint(qx, qy, maxM) {
    var G = rtInit(), g = rtGrid(), R = DS.roads, mx = 11.132 * Math.cos(qy * 1e-4 * RAD), my = 11.0574;
    var cellM = Math.min(g.cs * mx, g.cs * my), qcx = Math.floor(qx / g.cs) - g.x0, qcy = Math.floor(qy / g.cs) - g.y0;
    G.sstamp++;
    var stp = G.sstamp, seen = G.seen, all = [], bestMain = Infinity, bestAll = Infinity, limit = maxM || 90000;
    for (var r = 0; ; r++) {
      for (var cy = qcy - r; cy <= qcy + r; cy++) {
        if (cy < 0 || cy >= g.h) continue;
        var full = cy === qcy - r || cy === qcy + r;
        for (var cx = qcx - r; cx <= qcx + r; cx += full ? 1 : 2 * r) {
          if (cx < 0 || cx >= g.w) continue;
          for (var a = g.start[cy * g.w + cx], b = g.start[cy * g.w + cx + 1]; a < b; a++) {
            var ei = g.list[a];
            if (seen[ei] === stp) continue;
            seen[ei] = stp;
            var d = polyDist(ei, qx, qy, mx, my), pd = d + snapPenalty(ei), isMain = !!(R.main[R.ea[ei]] && R.main[R.eb[ei]]);
            all.push({ e: ei, d: d, pd: pd, t: SN.t, sx: SN.sx, sy: SN.sy, main: isMain });
            if (pd < bestAll) bestAll = pd;
            if (isMain && pd < bestMain) bestMain = pd;
          }
        }
      }
      if ((bestMain < Infinity && bestMain + 2500 <= r * cellM) || r * cellM > limit || r > g.w + g.h) break;
    }
    if (!all.length) return [];
    var useMain = bestMain < Infinity && bestMain <= bestAll + 5000, base = useMain ? bestMain : bestAll;
    var cands = all.filter(function (c) { return (!useMain || c.main) && c.pd <= base + 2500 && c.d <= limit; }).sort(function (p, q) { return p.pd - q.pd; });
    return cands.slice(0, 24);
  }

  // points (flat x,y numbers) of edge ei between positions t0 and t1 (meters along the edge from node a); order follows t0 -> t1
  function sliceEdge(ei, t0, t1, out) {
    var R = DS.roads, P = R.P, i0 = R.goff[ei] * 2, i1 = R.goff[ei + 1] * 2, np = (i1 - i0) >> 1, i;
    var mx = 11.132 * Math.cos(P[i0 + 1] * 1e-4 * RAD), my = 11.0574, cum = new Float64Array(np), tot = 0;
    for (i = 1; i < np; i++) { tot += Math.sqrt(Math.pow((P[i0 + 2 * i] - P[i0 + 2 * i - 2]) * mx, 2) + Math.pow((P[i0 + 2 * i + 1] - P[i0 + 2 * i - 1]) * my, 2)); cum[i] = tot; }
    var sc = tot > 0 ? R.elen[ei] / tot : 0;
    for (i = 0; i < np; i++) cum[i] *= sc;
    function at(t) {
      var j = 1; while (j < np - 1 && cum[j] < t) j++;
      var s0 = cum[j - 1], s1 = cum[j], u = s1 > s0 ? clamp((t - s0) / (s1 - s0), 0, 1) : 0;
      return [P[i0 + 2 * (j - 1)] + u * (P[i0 + 2 * j] - P[i0 + 2 * (j - 1)]), P[i0 + 2 * (j - 1) + 1] + u * (P[i0 + 2 * j + 1] - P[i0 + 2 * (j - 1) + 1])];
    }
    var fwd = t0 <= t1, lo = Math.min(t0, t1), hi = Math.max(t0, t1), pts = [], a = at(lo), b = at(hi);
    pts.push(a[0], a[1]);
    for (i = 1; i < np - 1; i++) if (cum[i] > lo && cum[i] < hi) pts.push(P[i0 + 2 * i], P[i0 + 2 * i + 1]);
    pts.push(b[0], b[1]);
    if (!fwd) { var rv = []; for (i = pts.length - 2; i >= 0; i -= 2) rv.push(pts[i], pts[i + 1]); pts = rv; }
    var skip = out.length >= 2 && Math.abs(out[out.length - 2] - pts[0]) < 0.6 && Math.abs(out[out.length - 1] - pts[1]) < 0.6 ? 2 : 0;
    for (i = skip; i < pts.length; i++) out.push(pts[i]);
  }

  // A*: starts and goals are snapped candidates. Returns {cost, seed:[si,side], node, goal:[ki,side]} or {cost, direct:[si,ki]} or null.
  function aStar(starts, goals, gx, gy) {
    var G = rtInit(), R = DS.roads, run = ++G.run, best = Infinity, bestNode = -1, direct = null, i, j;
    G.hs = 0;
    var slack = 60; goals.forEach(function (c) { if (c.d > slack) slack = c.d; });
    var gcos = Math.cos(gy * 1e-4 * RAD);
    function h(n) {
      var dx = (R.nx[n] - gx) * 11.132 * gcos, dy = (R.ny[n] - gy) * 11.0574, d = Math.sqrt(dx * dx + dy * dy) - slack;
      return d > 0 ? d * 0.985 / VMAX : 0;
    }
    function seed(node, cost, tag) {
      if (G.gs[node] !== run || cost < G.g[node]) { G.g[node] = cost; G.gs[node] = run; G.prev[node] = tag; hpush(cost + h(node), node); }
    }
    function setGoal(node, extra, who) { if (G.ts[node] !== run || extra < G.tx[node]) { G.tx[node] = extra; G.ts[node] = run; G.tw[node] = who; } }
    for (i = 0; i < goals.length; i++) {
      var gc = goals[i], ge = gc.e, glen = R.elen[ge], gsp = SPD[R.ecl[ge]], goff = gc.pd / V_OFF;
      setGoal(R.ea[ge], gc.t / gsp + goff, i * 2);
      if (!R.efl[ge]) setGoal(R.eb[ge], (glen - gc.t) / gsp + goff, i * 2 + 1);
    }
    for (i = 0; i < starts.length; i++) {
      var sc = starts[i], se = sc.e, slen = R.elen[se], ssp = SPD[R.ecl[se]], soff = sc.pd / V_OFF;
      seed(R.eb[se], soff + (slen - sc.t) / ssp, -1 - (i * 2 + 1));
      if (!R.efl[se]) seed(R.ea[se], soff + sc.t / ssp, -1 - i * 2);
      for (j = 0; j < goals.length; j++) { // start and goal on the same edge: drive straight along it when the direction allows
        if (goals[j].e !== se) continue;
        var dt = goals[j].t - sc.t, cost = Infinity;
        if (dt >= 0) cost = dt / ssp; else if (!R.efl[se]) cost = -dt / ssp;
        cost += soff + goals[j].pd / V_OFF;
        if (cost < best) { best = cost; direct = [i, j]; }
      }
    }
    while (G.hs > 0) {
      var n = hpop();
      if (G.popK >= best) break;
      if (G.cl[n] === run) continue;
      G.cl[n] = run;
      var gn = G.g[n];
      if (G.ts[n] === run) { var tot = gn + G.tx[n]; if (tot < best) { best = tot; bestNode = n; direct = null; } }
      for (var a = R.adjStart[n], ae = R.adjStart[n + 1]; a < ae; a++) {
        var arc = R.adjArc[a], ei = arc >> 1, m = arc & 1 ? R.ea[ei] : R.eb[ei];
        if (G.cl[m] === run) continue;
        var ng = gn + R.etime[ei];
        if (G.gs[m] !== run || ng < G.g[m]) { G.g[m] = ng; G.gs[m] = run; G.prev[m] = arc; hpush(ng + h(m), m); }
      }
    }
    if (best === Infinity) return null;
    if (direct) return { cost: best, direct: direct };
    var arcs = [], n2 = bestNode;
    while (G.prev[n2] >= 0) { var ar = G.prev[n2]; arcs.push(ar); n2 = ar & 1 ? R.eb[ar >> 1] : R.ea[ar >> 1]; }
    arcs.reverse();
    var tag = -1 - G.prev[n2], wh = G.tw[bestNode];
    return { cost: best, arcs: arcs, seed: [tag >> 1, tag & 1], goal: [wh >> 1, wh & 1] };
  }

  /* ================= 5. DIRECTIONS (route object, steps, text) ================= */
  // item: {x, y, name}. Returns {ok:true, ...} or {ok:false, reason}.
  function findRoute(from, to) {
    var R = DS.roads;
    if (!R || !R.E) return { ok: false, reason: 'noroads' };
    var starts = snapPoint(from.x, from.y), goals = snapPoint(to.x, to.y);
    if (!starts.length || !goals.length) return { ok: false, reason: 'noroad', side: !starts.length ? 'start' : 'end' };
    var t0 = performance.now(), res = aStar(starts, goals, to.x, to.y), ms = performance.now() - t0;
    if (!res) return { ok: false, reason: 'disconnected', ms: ms };
    var pieces = [], i;
    function piece(ei, a, b, node0) { pieces.push({ e: ei, t0: a, t1: b, len: Math.abs(b - a), node0: node0 }); }
    var sCand, gCand;
    if (res.direct) { sCand = starts[res.direct[0]]; gCand = goals[res.direct[1]]; piece(sCand.e, sCand.t, gCand.t, -1); }
    else {
      sCand = starts[res.seed[0]]; gCand = goals[res.goal[0]];
      if (res.seed[1] === 1) piece(sCand.e, sCand.t, R.elen[sCand.e], -1); else piece(sCand.e, sCand.t, 0, -1);
      res.arcs.forEach(function (arc) { var ei = arc >> 1; if (arc & 1) piece(ei, R.elen[ei], 0, R.eb[ei]); else piece(ei, 0, R.elen[ei], R.ea[ei]); });
      if (res.goal[1] === 0) piece(gCand.e, 0, gCand.t, R.ea[gCand.e]); else piece(gCand.e, R.elen[gCand.e], gCand.t, R.eb[gCand.e]);
    }
    pieces = pieces.filter(function (p) { return p.len >= 0.5; });
    var pts = [], dist = 0, time = 0;
    pieces.forEach(function (p) {
      p.pi0 = pts.length >> 1; sliceEdge(p.e, p.t0, p.t1, pts); p.pi1 = pts.length >> 1;
      p.time = p.len / SPD[R.ecl[p.e]]; dist += p.len; time += p.time;
    });
    var steps = makeSteps(pieces, pts);
    return {
      ok: true, from: from, to: to, pts: pts, pieces: pieces, steps: steps, dist: dist, time: time, ms: ms, mode: res.direct ? 'direct' : 'graph',
      a: { d: sCand.d, sx: sCand.sx, sy: sCand.sy }, b: { d: gCand.d, sx: gCand.sx, sy: gCand.sy },
      firstRoad: steps.length ? steps[0].label : '', lastRoad: steps.length ? steps[steps.length - 1].label : ''
    };
  }

  // merge consecutive pieces that share a label; unlabeled ramps and links join the next labeled step
  function makeSteps(pieces, pts) {
    var R = DS.roads, steps = [], cur = null, pend = [], i;
    pieces.forEach(function (p) {
      var li = R.elab[p.e], L = R.labels[li] || '';
      if (!L) { pend.push(p); return; }
      if (cur && cur.grp === R.lgrp[li]) { cur.pieces = cur.pieces.concat(pend, [p]); pend = []; return; }
      cur = { label: L, grp: R.lgrp[li], pieces: pend.concat([p]) }; pend = []; steps.push(cur);
    });
    if (pend.length) { if (cur) cur.pieces = cur.pieces.concat(pend); else steps.push({ label: '', grp: -1, pieces: pend }); }
    function total(s) { s.dist = 0; s.time = 0; s.pieces.forEach(function (p) { s.dist += p.len; s.time += p.time; }); }
    steps.forEach(total);
    // very short steps (a few hundred meters of a different road) are noise: fold them into the step before, and rejoin equal neighbors
    for (i = 1; i < steps.length;) {
      if (steps[i].dist < 800) {
        steps[i - 1].pieces = steps[i - 1].pieces.concat(steps[i].pieces); total(steps[i - 1]); steps.splice(i, 1);
        if (i < steps.length && steps[i].grp === steps[i - 1].grp) { steps[i - 1].pieces = steps[i - 1].pieces.concat(steps[i].pieces); total(steps[i - 1]); steps.splice(i, 1); }
      } else i++;
    }
    var out = [];
    steps.forEach(function (s) {
      var first = s.pieces[0], last = s.pieces[s.pieces.length - 1];
      splitLong({ label: s.label.replace(/\s+EXPR$/i, ''), node: first.node0, pi0: first.pi0, pi1: last.pi1, dist: s.dist, time: s.time, cont: false }, pts, out);
    });
    var cum = 0;
    out.forEach(function (s) { s.bearing = stepBearing(s, pts); cum += s.dist; s.cum = cum; });
    return out;
  }
  function stepBearing(s, pts) {
    var x0 = pts[s.pi0 * 2], y0 = pts[s.pi0 * 2 + 1], acc = 0, j = s.pi0 + 1;
    for (; j < s.pi1; j++) { acc += hav(pts[j * 2 - 2], pts[j * 2 - 1], pts[j * 2], pts[j * 2 + 1]); if (acc >= 2000) break; }
    j = Math.min(j, s.pi1 - 1);
    if (j <= s.pi0) return 0;
    return brg(x0, y0, pts[j * 2], pts[j * 2 + 1]);
  }
  // A long run on one road that turns a corner becomes "Continue on ..." steps so the heading words stay true
  function splitLong(s, pts, out) {
    var n = s.pi1 - s.pi0, j;
    if (s.dist < 40000 || n < 6) { out.push(s); return; }
    var seg = new Float64Array(n), L = 0;
    for (j = 1; j < n; j++) { seg[j] = hav(pts[(s.pi0 + j - 1) * 2], pts[(s.pi0 + j - 1) * 2 + 1], pts[(s.pi0 + j) * 2], pts[(s.pi0 + j) * 2 + 1]); L += seg[j]; }
    if (L <= 0) { out.push(s); return; }
    var scale = s.dist / L, tscale = s.time / L, start = s.pi0, ref = stepBearing({ pi0: start, pi1: s.pi1 }, pts), acc = 0, win = 0, used = 0, first = true;
    for (j = 1; j < n; j++) {
      acc += seg[j]; win += seg[j];
      if (win >= 6000 && acc >= 20000 && L - used - acc >= 8000) {
        win = 0;
        var ahead = stepBearing({ pi0: s.pi0 + j, pi1: s.pi1 }, pts);
        if (Math.abs(((ahead - ref + 540) % 360) - 180) >= 70) {
          out.push({ label: s.label, node: first ? s.node : -1, pi0: start, pi1: s.pi0 + j + 1, dist: acc * scale, time: acc * tscale, cont: !first });
          start = s.pi0 + j; used += acc; acc = 0; first = false; ref = ahead;
        }
      }
    }
    out.push({ label: s.label, node: first ? s.node : -1, pi0: start, pi1: s.pi1, dist: (L - used) * scale, time: (L - used) * tscale, cont: !first });
  }
  function exitText(node) {
    var R = DS.roads, x = node >= 0 && R ? R.exits[node] : null;
    if (!x) return '';
    if (x.ref) return x.name ? 'Exit ' + x.ref + ' (' + x.name + ')' : 'Exit ' + x.ref;
    return x.name ? 'the exit for ' + x.name : '';
  }
  function stepText(s, i, route) {
    var road = s.label || 'the road', dw = dirWord(s.bearing), dist = fmtDist(s.dist), joined = i === 0 && route.a.d >= 160;
    var verb = s.cont ? 'Continue on' : i === 0 ? (joined ? 'Join' : 'Start on') : 'Take';
    var core = verb + ' ' + road + ' ' + dw + ' for ' + dist;
    var ex = s.cont ? '' : exitText(s.node);
    return ex ? 'At ' + ex + ', ' + core.charAt(0).toLowerCase() + core.slice(1) + '.' : core + '.';
  }
  // all text lines of a route (used by the panel, Copy, Print and Share)
  function routeLines(route) {
    var lines = [], mi = route.a.d / 1609.344, mi2 = route.b.d / 1609.344;
    if (route.a.d >= 160) lines.push({ off: true, text: 'Off the highway network: about ' + fmtDist(route.a.d) + ' straight-line to ' + (route.firstRoad || 'the nearest highway') + '. ' + OFFNET, meta: '' });
    route.steps.forEach(function (s, i) { lines.push({ off: false, text: stepText(s, i, route), meta: 'Total so far: ' + fmtDist(s.cum) }); });
    if (route.b.d >= 160) lines.push({ off: true, text: 'Off the highway network: about ' + fmtDist(route.b.d) + ' straight-line from ' + (route.lastRoad || 'the highway') + ' to ' + (route.to.name || 'your destination') + '. ' + OFFNET, meta: '' });
    lines.push({ off: false, arrive: true, text: 'Arrive at ' + (route.to.name || 'your destination') + '.', meta: '' });
    return lines;
  }
  function routeText(route) {
    var t = 'Grid Down Guide: highway directions\nFrom: ' + route.from.name + '\nTo: ' + route.to.name + '\nHighway distance: ' + fmtBoth(route.dist) + '\nEstimated driving time: about ' + fmtTime(route.time) +
      ' (a rough estimate with no traffic, closures or weather)\n\n';
    routeLines(route).forEach(function (l, i) { t += (i + 1) + '. ' + l.text + (l.meta ? ' (' + l.meta.toLowerCase() + ')' : '') + '\n'; });
    return t + '\n' + SAFETY + '\n';
  }

  /* ================= 6. SEARCH INDEX (built lazily, in chunks) ================= */
  var SI = { n: 0, norm: [], type: [], src: [], x: [], y: [], did: {}, building: false };
  // type codes: 0 county, 1..4 place kind 0..3, 10 + layer index for points of interest
  function indexGroups() {
    var g = [];
    if (DS.base) g.push(['counties', function (add) { DS.base.counties.forEach(function (c, i) { add(c.n + ' county', 0, i, c.lx, c.ly); }); }]);
    if (DS.places) g.push(['places', function (add) { var P = DS.places; for (var i = 0; i < P.n; i++) add(P.name[i], 1 + P.kind[i], i, P.x[i], P.y[i]); }]);
    if (DS.pois) LAYERS.forEach(function (L, li) { g.push(['p:' + L.id, function (add) { var P = DS.pois[L.id]; for (var i = 0; i < P.n; i++) add(P.rec[i][2] || '', 10 + li, i, P.x[i], P.y[i]); }]); });
    return g;
  }
  // folds the names of newly loaded data into the index, a few milliseconds at a time
  function ensureIndex(cb) {
    if (SI.building) return;
    var pending = [];
    indexGroups().forEach(function (g) {
      if (SI.did[g[0]]) return;
      SI.did[g[0]] = true;
      g[1](function (text, type, src, x, y) { pending.push([text, type, src, x, y]); });
    });
    if (!pending.length) return;
    SI.building = true;
    var i = 0;
    (function chunk() {
      var t0 = Date.now();
      while (i < pending.length && Date.now() - t0 < 8) {
        var p = pending[i++];
        SI.norm.push(fold(p[0])); SI.type.push(p[1]); SI.src.push(p[2]); SI.x.push(p[3]); SI.y.push(p[4]);
      }
      SI.n = SI.norm.length;
      if (i < pending.length) { setTimeout(chunk, 0); return; }
      SI.building = false;
      if (cb) cb();
      ensureIndex(cb);
    })();
  }
  function indexReady() { return !!(SI.did.counties && SI.did.places && SI.did['p:landmark'] && !SI.building); }
  function poiRec(type, src) { var L = LAYERS[type - 10]; return DS.pois[L.id].rec[src]; }
  function typeRank(type) { return type === 0 ? 1.5 : type <= 4 ? type - 1 : 5; }
  // returns up to 30 matches: {i (index entry), q (match quality 0 best)}
  function searchIndex(query, refx, refy) {
    var toks = fold(query).split(' ').filter(Boolean).slice(0, 5);
    if (!toks.length) return [];
    var out = [], i, n = SI.n, norm = SI.norm, type = SI.type, t;
    var padded = ' ';
    for (i = 0; i < n; i++) {
      var s = padded + norm[i], q = 0, ok = true;
      for (t = 0; t < toks.length; t++) {
        if (s.indexOf(' ' + toks[t]) < 0) { ok = false; break; }
      }
      if (ok) { q = norm[i] === toks.join(' ') ? 0 : norm[i].indexOf(toks[0]) === 0 ? 1 : 2; out.push({ i: i, q: q }); continue; }
      if (type[i] >= 10) { // type words (hospital, fuel, vet...) match lower
        var words = ' ' + LAYERS[type[i] - 10].words + ' ', all = true;
        for (t = 0; t < toks.length; t++) if (words.indexOf(' ' + toks[t]) < 0 && s.indexOf(' ' + toks[t]) < 0) { all = false; break; }
        if (all) out.push({ i: i, q: 3 });
      }
    }
    out.forEach(function (o) {
      var ty = type[o.i], grp = ty < 10 ? 0 : 1, d = hav(SI.x[o.i], SI.y[o.i], refx, refy), pop = 0, imp = 0;
      if (ty >= 1 && ty <= 4) pop = DS.places.pop[SI.src[o.i]];
      if (ty >= 10) imp = importance(LAYERS[ty - 10], poiRec(ty, SI.src[o.i]));
      o.k = [grp, Math.min(o.q, 2) + (o.q === 3 ? 3 : 0), grp ? 0 : typeRank(ty), -(pop + imp * 1000), d];
    });
    out.sort(function (a, b) { for (var k = 0; k < 5; k++) { if (a.k[k] !== b.k[k]) return a.k[k] - b.k[k]; } return 0; });
    return out.slice(0, 30);
  }

  /* ================= 7. THE SCREEN ================= */
  var INST = null;
  var vsc = 0, vkx = 0, vox = 0, voy = 0, vx0 = 0, vx1 = 0, vy0 = 0, vy1 = 0; // view transform of the frame being drawn
  function pxOf(X) { return X * vkx + vox; }
  function pyOf(Y) { var i = Y - MY0; return (i >= 0 && i < MYN ? MYT[i] : mercN(Y * 1e-4)) * vsc + voy; }
  var PAL_KEYS = ['ocean', 'land', 'nbr', 'nbrLine', 'county', 'state', 'lake', 'river', 'rd0', 'rd0c', 'rd1', 'rd1c', 'rd2', 'rd2c', 'rd3', 'rd3c', 'text', 'halo', 'muted', 'countyText', 'route', 'routeC', 'me', 'sel', 'a', 'b', 'badgeLine', 'shield', 'shieldT', 'shield2', 'shield2T', 'shield2L'];
  var FONTS = ['700 15px ' + FONT, '600 13.5px ' + FONT, '500 13px ' + FONT, '500 12px ' + FONT];
  var PLACE_MINZ = [5, 7, 9, 11];
  var NICE = [0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100, 200, 500];

  function viewHtml() {
    return '<div class="gm-root" id="gm-root">' +
      '<div class="gm-stage"><canvas class="gm-canvas" id="gm-canvas" tabindex="0" role="application" aria-label="Map of California. Drag to move the map. Use the plus and minus buttons to zoom."></canvas></div>' +
      '<div class="gm-top" id="gm-top">' +
      '<div class="gm-row" id="gm-srow"><div class="gm-search"><input id="gm-q" type="search" inputmode="search" enterkeyhint="search" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Search a town, hospital, fuel…" aria-label="Search the map"><button class="gm-qx" id="gm-qx" data-gm="qclear" aria-label="Clear search" hidden>✕</button></div>' +
      '<button class="gm-btn" data-gm="info" aria-label="Map legend and help">ⓘ</button></div>' +
      '<div class="gm-row gm-actions"><button class="gm-btn primary" data-gm="dir"><span class="t">Directions</span></button><button class="gm-btn" data-gm="near"><span class="t">Nearest…</span></button>' +
      '<button class="gm-btn" data-gm="loc" id="gm-loc"><span class="t">My location</span></button><button class="gm-btn gm-layers-btn" data-gm="layers">Layers</button></div>' +
      '<div class="gm-chips" id="gm-chips" role="group" aria-label="Map layers"></div>' +
      '<div class="gm-status" id="gm-status"></div><div class="gm-banner" id="gm-banner" hidden></div></div>' +
      '<div class="gm-results" id="gm-results" hidden></div>' +
      '<div class="gm-ctrl"><button class="gm-btn" data-gm="zin" aria-label="Zoom in">+</button><button class="gm-btn" data-gm="zout" aria-label="Zoom out">−</button><button class="gm-btn small" data-gm="fit" aria-label="Show all of California">CA</button></div>' +
      '<div class="gm-strip"><div class="gm-scale"><span class="gm-scalebar" id="gm-sb"></span><span id="gm-sl"></span></div><div class="gm-coords" id="gm-cc"></div><div class="gm-attr">' + e(ATTRIBUTION) + '</div></div>' +
      '<div class="gm-routebar" id="gm-routebar" hidden></div>' +
      '<section class="gm-panel" id="gm-panel" hidden aria-live="polite"><button class="gm-grip" data-gm="grip" aria-label="Make the panel taller or shorter"></button><div class="gm-pb" id="gm-pb"></div></section>' +
      '<div class="gm-fatal" id="gm-fatal" hidden></div><div class="gm-print" id="gm-print"></div></div>';
  }

  function mount(params) {
    var root = document.getElementById('gm-root');
    if (!root) return null;
    var alive = true, T = {}, html = document.documentElement, undo = [];
    var q = function (id) { return document.getElementById(id); };
    var canvas = q('gm-canvas'), top = q('gm-top'), qin = q('gm-q'), qx = q('gm-qx'), resBox = q('gm-results'), chips = q('gm-chips'), status = q('gm-status'), banner = q('gm-banner');
    var panel = q('gm-panel'), pb = q('gm-pb'), routebar = q('gm-routebar'), fatal = q('gm-fatal'), printBox = q('gm-print');
    var ctx = null, W = 0, H = 0, dpr = 1, zMin = Z_MIN, inited = false;
    var cam = { cx: 0.5, cy: 0.5, z: 5.5 };
    var dirty = false, raf = 0, anim = null, inertia = null, hits = [], PAL = null, palKey = '', SPR = {}, wc = [{}, {}, {}, {}], lcand = [], ptrs = [], g = {}, lastTap = null, sbSig = '', chipSig = '', lastCC = '';
    var perf = { frames: 0, total: 0, max: 0, last: 0, sync: false, route: 0, renders: 0, baseMs: 0, parts: null };
    var st = { sel: null, start: null, end: null, pick: '', mode: '', route: null, routing: false, me: null, watch: null, geoBusy: false, tall: false, nearType: '', nearList: [], results: [] };
    var mq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
    html.classList.add('gm-lock');
    initMerc();

    /* ---------- prefs ---------- */
    function prefs() {
      if (!S.map || typeof S.map !== 'object' || Array.isArray(S.map)) S.map = {};
      if (!S.map.l || typeof S.map.l !== 'object' || Array.isArray(S.map.l)) S.map.l = {};
      return S.map;
    }
    function layerOn(id) { var l = prefs().l; return l[id] === undefined ? !!DEFAULT_ON[id] : !!l[id]; }
    function savedView() {
      var v = prefs().v;
      if (Array.isArray(v) && v.length === 3 && num(v[0]) && num(v[1]) && num(v[2]) && v[0] > -127 && v[0] < -112 && v[1] > 30 && v[1] < 44 && v[2] >= 3 && v[2] <= 16) return v;
      return null;
    }
    function saveView() {
      if (!inited) return;
      var p = prefs(), ll = centerLL();
      p.v = [+ll.lon.toFixed(4), +ll.lat.toFixed(4), +cam.z.toFixed(2)];
      App.save();
    }

    /* ---------- layout, canvas size, camera ---------- */
    function measure() {
      var hdr = document.querySelector('header.top'), tabs = document.getElementById('tabs');
      var t = hdr ? hdr.offsetHeight : 0, b = tabs ? tabs.offsetHeight : 0;
      if (t > 0 && t < window.innerHeight * 0.4) root.style.setProperty('--gm-top', t + 'px');
      if (b > 0 && b < window.innerHeight * 0.4) root.style.setProperty('--gm-nav', b + 'px');
    }
    var wideMQ = window.matchMedia ? window.matchMedia('(min-width: 900px), (max-height: 520px) and (min-width: 640px)') : null; // same query as map.css
    function isWide() { return wideMQ ? wideMQ.matches : root.clientWidth >= 900; }
    var INS = { l: 0, t: 0, b: 0 }; // parts of the map covered by controls (top rows, the side card or the bottom sheet)
    function layoutVars() {
      var wide = isWide(), bot = 0, sr = q('gm-srow'), t = sr.offsetTop + sr.offsetHeight, o = INS;
      if (!wide) { if (!panel.hidden) bot = panel.offsetHeight; else if (!routebar.hidden) bot = routebar.offsetHeight + 8; }
      if (chips.offsetHeight) t = chips.offsetTop + chips.offsetHeight;
      if (!banner.hidden) t = Math.max(t, banner.offsetTop + banner.offsetHeight);
      INS = wide ? { l: 470, t: 0, b: 0 } : { l: 0, t: Math.min(t, H * 0.5), b: bot }; // wide screens keep the controls in a left column
      if (inited && W && !anim && (o.b !== INS.b || o.l !== INS.l)) { // a sheet opened or closed: keep what you were looking at in the middle of the part still visible
        var sc0 = scaleNow(), dx = ((o.l + W) / 2 - (INS.l + W) / 2) / sc0, dy = ((H - o.b) / 2 - (H - INS.b) / 2) / sc0;
        cam.cx += dx; cam.cy += dy; clampCam(); invalidate(); onMoveEnd();
      }
      root.classList.toggle('gm-noctrl', !wide && H - INS.t - INS.b < 250); // no room for the zoom buttons beside a tall sheet
      root.style.setProperty('--gm-bot', bot + 'px');
      root.style.setProperty('--gm-top-h', top.offsetHeight + 'px');
      root.style.setProperty('--gm-sb', (sr.offsetTop + sr.offsetHeight + 6) + 'px');
    }
    function pads() { return { l: INS.l + 14, r: 62, t: INS.t + Math.min(44, H * 0.07), b: INS.b + Math.min(78, H * 0.12) }; }
    function visCenter() { return [(INS.l + W) / 2, (INS.t + H - INS.b) / 2]; } // the middle of the part of the map you can see
    function scaleNow() { return 256 * Math.pow(2, cam.z); }
    function centerLL() { return { lon: (cam.cx - 0.5) * 360, lat: latOfNy(cam.cy) }; }
    function clampCam() {
      cam.z = clamp(cam.z, zMin, Z_MAX);
      cam.cx = clamp(cam.cx, nxOf(-1262000), nxOf(-1125000));
      cam.cy = clamp(cam.cy, nyOf(436000), nyOf(309000));
    }
    function fitZoom(x0, y0, x1, y1, pd) {
      var w = (nxOf(x1) - nxOf(x0)) * 256, h = (nyOf(y0) - nyOf(y1)) * 256;
      return Math.log(Math.max(1, Math.min((W - pd.l - pd.r) / Math.max(w, 1e-9), (H - pd.t - pd.b) / Math.max(h, 1e-9)))) / Math.LN2;
    }
    function viewFor(x0, y0, x1, y1, pd, maxZ) { // camera that shows a box inside the free area
      var z = clamp(fitZoom(x0, y0, x1, y1, pd), zMin, maxZ || Z_MAX), sc = 256 * Math.pow(2, z);
      var fx = (pd.l + W - pd.r) / 2, fy = (pd.t + H - pd.b) / 2;
      return { z: z, cx: (nxOf(x0) + nxOf(x1)) / 2 + (W / 2 - fx) / sc, cy: (nyOf(y0) + nyOf(y1)) / 2 + (H / 2 - fy) / sc };
    }
    function caBox() { var b = DS.base ? DS.base.bbox : { x0: -1246000, y0: 324000, x1: -1140000, y1: 421000 }; return b; }
    function updateZMin() { var b = caBox(); zMin = Math.min(Z_MIN, fitZoom(b.x0, b.y0, b.x1, b.y1, pads()) - 0.3); }
    function fitCA(animate) {
      var b = caBox(), v = viewFor(b.x0, b.y0, b.x1, b.y1, pads());
      if (animate) animateTo(v.cx, v.cy, v.z, 450); else { cam.cx = v.cx; cam.cy = v.cy; cam.z = v.z; clampCam(); invalidate(); }
    }
    function initView() {
      inited = true;
      updateZMin();
      var v = savedView(), lat = params && parseFloat(params.get('lat')), lon = params && parseFloat(params.get('lon')), z = params && parseFloat(params.get('z'));
      if (num(lat) && num(lon) && lat > 30 && lat < 44 && lon > -127 && lon < -112) { cam.z = clamp(num(z) ? z : 11, 3, Z_MAX); cam.cx = nxOf(Math.round(lon * 1e4)); cam.cy = nyOf(Math.round(lat * 1e4)); clampCam(); }
      else if (v) { cam.z = v[2]; cam.cx = nxOf(Math.round(v[0] * 1e4)); cam.cy = nyOf(Math.round(v[1] * 1e4)); clampCam(); }
      else fitCA(false);
    }
    function resize() {
      measure();
      var host = canvas.parentNode, r = host.getBoundingClientRect(), w = Math.round(r.width), h = Math.round(r.height);
      if (w < 2 || h < 2) { W = H = 0; return; } // not laid out yet: wait for the next resize
      var d = Math.min(2, window.devicePixelRatio || 1);
      if (w !== W || h !== H || d !== dpr || !ctx) {
        W = w; H = h; dpr = d;
        canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
        ctx = canvas.getContext('2d', { alpha: false });
        SPR = {};
      }
      layoutVars();
      if (!inited) initView(); else updateZMin();
      invalidate();
    }
    function panBy(dx, dy) { var sc = scaleNow(); cam.cx -= dx / sc; cam.cy -= dy / sc; clampCam(); invalidate(); }
    function anchorZoom(px, py, nz) {
      nz = clamp(nz, zMin, Z_MAX);
      var sc0 = scaleNow(), sc1 = 256 * Math.pow(2, nz), wx = cam.cx + (px - W / 2) / sc0, wy = cam.cy + (py - H / 2) / sc0;
      cam.z = nz; cam.cx = wx - (px - W / 2) / sc1; cam.cy = wy - (py - H / 2) / sc1; clampCam(); invalidate();
    }
    function animateTo(cx, cy, z, dur) {
      stopMotion();
      anim = { t0: performance.now(), dur: dur || 500, cx0: cam.cx, cy0: cam.cy, z0: cam.z, cx1: cx, cy1: cy, z1: clamp(z, zMin, Z_MAX) };
      schedule();
    }
    function zoomAnim(px, py, nz) {
      nz = clamp(nz, zMin, Z_MAX);
      var sc0 = scaleNow(), sc1 = 256 * Math.pow(2, nz), wx = cam.cx + (px - W / 2) / sc0, wy = cam.cy + (py - H / 2) / sc0;
      animateTo(wx - (px - W / 2) / sc1, wy - (py - H / 2) / sc1, nz, 240);
    }
    function flyTo(x, y, z, dur) { // put a point in the middle of the free part of the map
      z = clamp(z, zMin, Z_MAX);
      var vc = visCenter(), sc = 256 * Math.pow(2, z), fx = vc[0], fy = vc[1];
      animateTo(nxOf(x) + (W / 2 - fx) / sc, nyOf(y) + (H / 2 - fy) / sc, z, dur || 600);
    }
    function stopMotion() { anim = null; inertia = null; }
    function unproject(px, py) {
      var sc = scaleNow(), nx = cam.cx + (px - W / 2) / sc, ny = cam.cy + (py - H / 2) / sc;
      return { x: Math.round((nx - 0.5) * 3600000), y: Math.round(latOfNy(ny) * 1e4) };
    }
    function project(X, Y) { var sc = scaleNow(); return [(nxOf(X) - cam.cx) * sc + W / 2, (nyOf(Y) - cam.cy) * sc + H / 2]; }
    function onMoveEnd() { clearTimeout(T.save); T.save = setTimeout(saveView, 800); }

    /* ---------- frame loop ---------- */
    function schedule() { if (!raf && alive) raf = requestAnimationFrame(frame); }
    function invalidate() { dirty = true; schedule(); }
    function frame(ts) {
      raf = 0;
      if (!alive) return;
      var again = false, now = performance.now();
      if (anim) {
        var k = clamp((now - anim.t0) / anim.dur, 0, 1), t = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
        cam.cx = anim.cx0 + (anim.cx1 - anim.cx0) * t; cam.cy = anim.cy0 + (anim.cy1 - anim.cy0) * t; cam.z = anim.z0 + (anim.z1 - anim.z0) * t;
        clampCam(); dirty = true;
        if (k >= 1) { anim = null; onMoveEnd(); } else again = true;
      }
      if (inertia) {
        var dt = Math.min(50, now - inertia.t); inertia.t = now;
        panBy(inertia.vx * dt, inertia.vy * dt);
        var f = Math.exp(-dt / 320); inertia.vx *= f; inertia.vy *= f;
        if (Math.hypot(inertia.vx, inertia.vy) < 0.03) { inertia = null; onMoveEnd(); } else again = true;
      }
      if (dirty) { dirty = false; draw(); }
      if (again) schedule();
    }

    /* ---------- palette and sprites ---------- */
    function themeKey() {
      var t = html.getAttribute('data-theme');
      return t === 'night' || t === 'dark' || t === 'light' ? t : mq && mq.matches ? 'dark' : 'light';
    }
    function loadPal() {
      var k = themeKey();
      if (PAL && k === palKey) return;
      var cs = getComputedStyle(root); PAL = {}; palKey = k; SPR = {};
      PAL_KEYS.forEach(function (key) { PAL[key] = cs.getPropertyValue('--gm-' + key.replace(/[A-Z]/g, function (m) { return '-' + m.toLowerCase(); })).trim() || '#888888'; });
    }
    function rr(c, x, y, w, h, r) {
      c.beginPath(); c.moveTo(x + r, y); c.lineTo(x + w - r, y); c.arcTo(x + w, y, x + w, y + r, r); c.lineTo(x + w, y + h - r); c.arcTo(x + w, y + h, x + w - r, y + h, r);
      c.lineTo(x + r, y + h); c.arcTo(x, y + h, x, y + h - r, r); c.lineTo(x, y + r); c.arcTo(x, y, x + r, y, r); c.closePath();
    }
    function icoFor(L, sub) { return L.id === 'landmark' ? (LM[sub] || LM[0])[0] : L.icon; }
    function sprite(L, sub) {
      var key = L.id + (L.id === 'landmark' ? sub : '') + '|' + (L.id === 'airport' ? sub : '') + '|' + palKey + '|' + dpr, c = SPR[key];
      if (c) return c;
      var size = L.hs * 2 + (L.id === 'airport' && sub ? 4 : 0), night = palKey === 'night', gx;
      c = document.createElement('canvas'); c.width = c.height = Math.ceil(size * dpr); c.sz = size;
      gx = c.getContext('2d'); gx.scale(dpr, dpr);
      gx.shadowColor = 'rgba(0,0,0,.35)'; gx.shadowBlur = 3; gx.shadowOffsetY = 1;
      if (L.id === 'urgent') { gx.beginPath(); gx.arc(size / 2, size / 2, size / 2 - 2, 0, 6.2832); } else rr(gx, 2, 2, size - 4, size - 4, 6);
      gx.fillStyle = night ? '#2a0603' : L.color; gx.fill();
      gx.shadowColor = 'transparent'; gx.lineWidth = 2; gx.strokeStyle = night ? '#ff4a3d' : PAL.badgeLine; gx.stroke();
      if (L.id === 'hospital' || L.id === 'urgent') { // cross drawn as a shape, so it never depends on an emoji font
        var arm = size * (L.id === 'hospital' ? 0.2 : 0.15), len = size * (L.id === 'hospital' ? 0.58 : 0.5), m = size / 2;
        gx.fillStyle = night ? '#ff6a5c' : '#ffffff'; gx.fillRect(m - len / 2, m - arm / 2, len, arm); gx.fillRect(m - arm / 2, m - len / 2, arm, len);
      } else {
        gx.font = Math.round(size * 0.56) + 'px ' + EMOJI_FONT; gx.textAlign = 'center'; gx.textBaseline = 'middle'; gx.fillStyle = '#000';
        gx.fillText(icoFor(L, sub), size / 2, size / 2 + 1);
        if (night) { gx.save(); gx.globalCompositeOperation = 'multiply'; gx.fillStyle = '#ff5a4d'; gx.fillRect(0, 0, size, size); gx.restore(); }
      }
      SPR[key] = c;
      return c;
    }

    /* ---------- collision grid for labels and icons ---------- */
    function makeGrid() {
      var cells = {}, CS = 64;
      return {
        hit: function (x0, y0, x1, y1) {
          for (var cy = Math.floor(y0 / CS), ey = Math.floor(y1 / CS); cy <= ey; cy++) for (var cx = Math.floor(x0 / CS), ex = Math.floor(x1 / CS); cx <= ex; cx++) {
            var l = cells[cx * 8192 + cy];
            if (!l) continue;
            for (var i = 0; i < l.length; i++) { var r = l[i]; if (x0 < r[2] && x1 > r[0] && y0 < r[3] && y1 > r[1]) return true; }
          }
          return false;
        },
        add: function (x0, y0, x1, y1) {
          var r = [x0, y0, x1, y1];
          for (var cy = Math.floor(y0 / CS), ey = Math.floor(y1 / CS); cy <= ey; cy++) for (var cx = Math.floor(x0 / CS), ex = Math.floor(x1 / CS); cx <= ex; cx++) { var k = cx * 8192 + cy; (cells[k] = cells[k] || []).push(r); }
        }
      };
    }
    function haloText(txt, x, y, font, fill, align) {
      ctx.font = font; ctx.textAlign = align || 'left'; ctx.lineWidth = 3.5; ctx.strokeStyle = PAL.halo; ctx.strokeText(txt, x, y); ctx.fillStyle = fill; ctx.fillText(txt, x, y);
    }

    /* ---------- drawing ---------- */
    function tracePoly(p, close) {
      var n = p.length, x = p[0] * vkx + vox, y = pyOf(p[1]), lx = x, ly = y;
      ctx.moveTo(x, y);
      for (var i = 2; i < n; i += 2) {
        x = p[i] * vkx + vox; y = pyOf(p[i + 1]);
        if (Math.abs(x - lx) + Math.abs(y - ly) < 0.7 && i < n - 2) continue;
        ctx.lineTo(x, y); lx = x; ly = y;
      }
      if (close) ctx.closePath();
    }
    function seen(r) { return !(r.x1 < vx0 || r.x0 > vx1 || r.y1 < vy0 || r.y0 > vy1); }
    function drawBase() {
      var B = DS.base, z = cam.z, i, j;
      ctx.beginPath(); for (i = 0; i < B.nbr.length; i++) if (seen(B.nbr[i])) tracePoly(B.nbr[i].p, true);
      ctx.fillStyle = PAL.nbr; ctx.fill(); ctx.lineWidth = 1; ctx.strokeStyle = PAL.nbrLine; ctx.stroke();
      ctx.beginPath(); for (i = 0; i < B.state.length; i++) if (seen(B.state[i])) tracePoly(B.state[i].p, true);
      ctx.fillStyle = PAL.land; ctx.fill();
      ctx.beginPath();
      for (i = 0; i < B.counties.length; i++) { var c = B.counties[i]; if (!seen(c)) continue; for (j = 0; j < c.rings.length; j++) tracePoly(c.rings[j].p, true); }
      ctx.lineWidth = z < 7 ? 0.7 : 1; ctx.strokeStyle = PAL.county; ctx.stroke();
      ctx.beginPath(); for (i = 0; i < B.lakes.length; i++) for (j = 0; j < B.lakes[i].rings.length; j++) if (seen(B.lakes[i].rings[j])) tracePoly(B.lakes[i].rings[j].p, true);
      ctx.fillStyle = PAL.lake; ctx.fill(); ctx.lineWidth = 1; ctx.strokeStyle = PAL.river; ctx.stroke();
      if (z >= 6) {
        ctx.beginPath(); for (i = 0; i < B.rivers.length; i++) if (seen(B.rivers[i])) tracePoly(B.rivers[i].p, false);
        ctx.lineWidth = clamp(0.9 + (z - 6) * 0.25, 0.9, 3); ctx.strokeStyle = PAL.river; ctx.stroke();
      }
      ctx.beginPath(); for (i = 0; i < B.state.length; i++) if (seen(B.state[i])) tracePoly(B.state[i].p, true);
      ctx.lineWidth = 1.8; ctx.strokeStyle = PAL.state; ctx.stroke();
    }
    var RW = [2.4, 2.0, 1.6, 1.2], RMAX = [12, 10, 8.5, 6.5];
    function roadW(c, z) { return clamp(RW[c] * Math.pow(1.3, z - 8), 0.9, RMAX[c]); }
    // One Path2D per road class, drawn lowest class first. Edges are short in the real data, so tiny ones become a single segment,
    // and an edge that starts where the last drawn edge ended continues the same sub-path (fewer path commands).
    function drawRoads() {
      var R = DS.roads;
      lcand.length = 0;
      if (!R) return;
      var z = cam.z, P = R.P, goff = R.goff, bx0 = R.bx0, by0 = R.by0, bx1 = R.bx1, by1 = R.by1, elab = R.elab, lkind = R.lkind, minc = [0, 5.5, 8, 9.5], ramps = z >= 13;
      ctx.lineCap = 'butt'; ctx.lineJoin = z >= 12 ? 'round' : 'bevel';
      for (var c = 3; c >= 0; c--) {
        if (z < minc[c]) continue;
        var path = new Path2D(), any = false, penx = -1e9, peny = -1e9, shieldZ = c < 2 ? 8 : 9.5;
        for (var e2 = R.cs[c], e3 = R.cs[c + 1]; e2 < e3; e2++) {
          if (bx1[e2] < vx0 || bx0[e2] > vx1 || by1[e2] < vy0 || by0[e2] > vy1) continue;
          if (!ramps && c < 2 && !elab[e2]) continue; // ramps and links only when zoomed in
          var i0 = goff[e2] * 2, i1 = goff[e2 + 1] * 2, x = P[i0] * vkx + vox, y = pyOf(P[i0 + 1]);
          // a gap of more than ~1.5 px starts a new sub-path; otherwise the edge continues the pen, and points closer than ~1.2 px to the pen are dropped
          if (Math.abs(x - penx) + Math.abs(y - peny) > 1.6) { path.moveTo(x, y); penx = x; peny = y; }
          if (i1 - i0 === 4 || ((bx1[e2] - bx0[e2]) * vkx < 3 && (by1[e2] - by0[e2]) * vkx * 1.3 < 3)) {
            x = P[i1 - 2] * vkx + vox; y = pyOf(P[i1 - 1]);
            if (Math.abs(x - penx) + Math.abs(y - peny) >= 1.2) { path.lineTo(x, y); penx = x; peny = y; }
          } else {
            for (var i = i0 + 2; i < i1; i += 2) {
              x = P[i] * vkx + vox; y = pyOf(P[i + 1]);
              if (i < i1 - 2 && Math.abs(x - penx) + Math.abs(y - peny) < 1.5) continue;
              path.lineTo(x, y); penx = x; peny = y;
            }
          }
          any = true;
          var lk = elab[e2] ? lkind[elab[e2]] : 0;
          if (lk && lcand.length < 9000 && (lk < 3 ? z >= shieldZ : lk === 3 ? z >= 13.5 : z >= 12)) lcand.push(e2);
        }
        if (!any) continue;
        var w = roadW(c, z);
        if (z >= 10 && w >= 2.2 && (c < 2 || z >= 11)) { ctx.lineWidth = w + 2; ctx.strokeStyle = PAL['rd' + c + 'c']; ctx.stroke(path); }
        ctx.lineWidth = w; ctx.strokeStyle = PAL['rd' + c]; ctx.stroke(path);
      }
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    }
    var labelGrid = null;
    function drawLabels() {
      var lg = labelGrid = makeGrid(), z = cam.z, P = DS.places, R = DS.roads, B = DS.base, i, count = 0, cand = BC.lcand;
      ctx.textBaseline = 'middle';
      if (P) {
        for (var oi = 0; oi < P.n && count < 420; oi++) {
          i = P.ord[oi];
          var k = P.kind[i];
          if (z < PLACE_MINZ[k]) break; // ordered by kind, and the minimum zoom rises with kind
          var X = P.x[i], Y = P.y[i];
          if (X < vx0 || X > vx1 || Y < vy0 || Y > vy1) continue;
          var sx = pxOf(X), sy = pyOf(Y), nm = P.name[i], w = wc[k][nm];
          if (w === undefined) { ctx.font = FONTS[k]; w = wc[k][nm] = ctx.measureText(nm).width; }
          var r = k === 0 ? 4.5 : 3.5, off = r + 4, h2 = k === 0 ? 9 : 8, side = 1, x0 = sx - r - 1, x1 = sx + off + w + 3;
          if (x1 > W - 3 || lg.hit(x0, sy - h2, x1, sy + h2)) { side = -1; x0 = sx - off - w - 3; x1 = sx + r + 1; if (x0 < 3 || lg.hit(x0, sy - h2, x1, sy + h2)) continue; }
          lg.add(x0, sy - h2, x1, sy + h2);
          ctx.beginPath(); ctx.arc(sx, sy, r, 0, 6.2832); ctx.fillStyle = k === 0 ? PAL.text : PAL.muted; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = PAL.halo; ctx.stroke();
          haloText(nm, side > 0 ? sx + off : sx - off, sy, FONTS[k], PAL.text, side > 0 ? 'left' : 'right');
          hits.push({ k: 'place', i: i, x: sx, y: sy });
          count++;
        }
      }
      if (R && cand.length) { // road shields: one per road per ~140 px cell of the world, so they do not jump while panning
        var cellX = Math.max(1, 140 / vkx), cellY = cellX * 0.8, best = {}, keys = [], n;
        for (n = 0; n < cand.length; n++) {
          var ei = cand[n], j0 = R.goff[ei] * 2, j1 = R.goff[ei + 1] * 2, np = (j1 - j0) >> 1, mxd, myd;
          if (np === 2) { mxd = (R.P[j0] + R.P[j0 + 2]) * 0.5; myd = (R.P[j0 + 1] + R.P[j0 + 3]) * 0.5; } else { mxd = R.P[j0 + (np >> 1) * 2]; myd = R.P[j0 + (np >> 1) * 2 + 1]; }
          if (mxd < vx0 || mxd > vx1 || myd < vy0 || myd > vy1) continue;
          var fx = Math.floor(mxd / cellX), fy = Math.floor(myd / cellY), key = (R.elab[ei] * 1000 + (fx % 1000)) * 1000 + (fy % 1000);
          var dd = Math.abs(mxd / cellX - fx - 0.5) + Math.abs(myd / cellY - fy - 0.5), cur = best[key];
          if (cur === undefined) { keys.push(key); best[key] = { e: ei, d: dd, x: mxd, y: myd }; } else if (dd < cur.d) best[key] = { e: ei, d: dd, x: mxd, y: myd };
        }
        var list = keys.map(function (kk) { return best[kk]; });
        list.sort(function (a, b) { return R.ecl[a.e] - R.ecl[b.e] || a.d - b.d; });
        var placed = [], tried = 0;
        for (n = 0; n < list.length && tried < 220; n++) {
          var li = R.elab[list[n].e], lk = R.lkind[li], text = R.labels[li], bx = pxOf(list[n].x), by = pyOf(list[n].y);
          if (bx < 18 || bx > W - 18 || by < 18 || by > H - 18) continue;
          tried++;
          var near = false;
          for (var pi = 0; pi < placed.length; pi++) if (placed[pi].t === text && Math.abs(placed[pi].x - bx) + Math.abs(placed[pi].y - by) < 90) { near = true; break; }
          if (near) continue;
          ctx.font = lk === 3 ? 'italic 500 12px ' + FONT : '700 12px ' + FONT;
          var tw = ctx.measureText(text).width, bw = lk === 3 ? tw : tw + 10, bh = lk === 3 ? 14 : 17;
          if (lg.hit(bx - bw / 2, by - bh / 2, bx + bw / 2, by + bh / 2)) continue;
          lg.add(bx - bw / 2 - 2, by - bh / 2 - 2, bx + bw / 2 + 2, by + bh / 2 + 2);
          placed.push({ t: text, x: bx, y: by });
          if (lk === 3) { haloText(text, bx, by, ctx.font, PAL.muted, 'center'); continue; }
          rr(ctx, bx - bw / 2, by - bh / 2, bw, bh, 5);
          ctx.fillStyle = lk === 1 ? PAL.shield : PAL.shield2; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = lk === 1 ? PAL.shieldT : PAL.shield2L; ctx.stroke();
          ctx.fillStyle = lk === 1 ? PAL.shieldT : PAL.shield2T; ctx.textAlign = 'center'; ctx.fillText(text, bx, by + 0.5);
        }
      }
      if (B && z >= 6 && z < 9.6) { // county names, faint, last
        ctx.font = 'italic 600 12px ' + FONT;
        for (i = 0; i < B.counties.length; i++) {
          var cn = B.counties[i];
          if (cn.lx < vx0 || cn.lx > vx1 || cn.ly < vy0 || cn.ly > vy1) continue;
          var cx = pxOf(cn.lx), cy = pyOf(cn.ly), cw = ctx.measureText(cn.n).width;
          if (lg.hit(cx - cw / 2, cy - 8, cx + cw / 2, cy + 8)) continue;
          lg.add(cx - cw / 2, cy - 8, cx + cw / 2, cy + 8);
          haloText(cn.n, cx, cy, 'italic 600 12px ' + FONT, PAL.countyText, 'center');
        }
      }
    }
    function drawPois() {
      var PO = DS.pois, z = cam.z, sel = st.sel, ig = makeGrid(), zf = clamp(0.5 + (z - 5.5) * 0.15, 0.5, 1), cap = z < 6.5 ? 40 : z < 8 ? 90 : CAP;
      if (!PO) return;
      for (var oi = 0; oi < ICON_ORDER.length; oi++) {
        var L = LBY[ICON_ORDER[oi]], LP = PO[L.id];
        if (!LP || z < L.min || !layerOn(L.id)) continue;
        var shown = 0, avoid = !L.top || z < 9;
        for (var k = 0; k < LP.n && shown < cap; k++) {
          var i = LP.pr[k], X = LP.x[i], Y = LP.y[i];
          if (X < vx0 || X > vx1 || Y < vy0 || Y > vy1) continue;
          var sub = L.id === 'landmark' || L.id === 'airport' ? LP.rec[i][6] | 0 : 0;
          if (L.id === 'airport' && !sub && z < 9.5) continue; // small airfields only when zoomed in
          var sx = pxOf(X), sy = pyOf(Y), h = (L.hs + (L.id === 'airport' && sub ? 2 : 0)) * zf;
          if (sx < -h || sx > W + h || sy < -h || sy > H + h) continue;
          if (ig.hit(sx - h, sy - h, sx + h, sy + h)) continue;
          if (avoid && labelGrid && labelGrid.hit(sx - h, sy - h, sx + h, sy + h)) continue;
          ig.add(sx - h, sy - h, sx + h, sy + h);
          ctx.drawImage(sprite(L, sub), sx - h, sy - h, h * 2, h * 2);
          hits.push({ k: 'poi', l: L.id, i: i, x: sx, y: sy });
          shown++;
        }
      }
      if (sel && sel.kind === 'poi') { var p = project(sel.x, sel.y); ctx.beginPath(); ctx.arc(p[0], p[1], 19, 0, 6.2832); ctx.lineWidth = 3.5; ctx.strokeStyle = PAL.sel; ctx.stroke(); }
    }
    function legPath(x0, y0, x1, y1) { ctx.beginPath(); ctx.moveTo(pxOf(x0), pyOf(y0)); ctx.lineTo(pxOf(x1), pyOf(y1)); }
    function drawRoute() {
      var r = st.route;
      if (!r || !r.ok) return;
      ctx.setLineDash([3, 8]); ctx.lineWidth = 3.5; ctx.strokeStyle = PAL.route;
      if (r.a.d > 20) { legPath(r.from.x, r.from.y, r.a.sx, r.a.sy); ctx.stroke(); }
      if (r.b.d > 20) { legPath(r.b.sx, r.b.sy, r.to.x, r.to.y); ctx.stroke(); }
      ctx.setLineDash([]);
      var pts = r.pts, n = pts.length, x = pxOf(pts[0]), y = pyOf(pts[1]), lx = x, ly = y;
      ctx.beginPath(); ctx.moveTo(x, y);
      for (var i = 2; i < n; i += 2) {
        x = pxOf(pts[i]); y = pyOf(pts[i + 1]);
        if (i < n - 2 && Math.abs(x - lx) + Math.abs(y - ly) < 1.2) continue;
        ctx.lineTo(x, y); lx = x; ly = y;
      }
      ctx.lineWidth = 9.5; ctx.strokeStyle = PAL.routeC; ctx.stroke();
      ctx.lineWidth = 5.5; ctx.strokeStyle = PAL.route; ctx.stroke();
    }
    function drawPin(sx, sy, fill, letter) {
      var r = 12, cy2 = sy - 23;
      ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx - r * 0.72, cy2 + r * 0.72); ctx.arc(sx, cy2, r, Math.PI * 0.75, Math.PI * 0.25, false); ctx.closePath();
      ctx.fillStyle = fill; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = PAL.routeC === '#000000' ? '#000000' : '#ffffff'; ctx.stroke();
      if (letter) { ctx.font = '800 14px ' + FONT; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = palKey === 'night' ? '#000000' : '#ffffff'; ctx.fillText(letter, sx, cy2 + 0.5); }
      else { ctx.beginPath(); ctx.arc(sx, cy2, 4, 0, 6.2832); ctx.fillStyle = '#ffffff'; ctx.fill(); }
    }
    function drawMarkers() {
      var sel = st.sel, p;
      if (sel && sel !== st.start && sel !== st.end && sel.kind !== 'gps') { p = project(sel.x, sel.y); drawPin(p[0], p[1], PAL.sel, ''); }
      if (st.start) { p = project(st.start.x, st.start.y); drawPin(p[0], p[1], PAL.a, 'A'); }
      if (st.end) { p = project(st.end.x, st.end.y); drawPin(p[0], p[1], PAL.b, 'B'); }
    }
    function drawMe() {
      var me = st.me; if (!me) return;
      var p = project(me.x, me.y), lat = me.y * 1e-4, mpp = 40075016.686 * Math.cos(lat * RAD) / scaleNow(), ar = me.acc / mpp;
      if (ar > 12) { ctx.globalAlpha = 0.16; ctx.beginPath(); ctx.arc(p[0], p[1], Math.min(ar, 600), 0, 6.2832); ctx.fillStyle = PAL.me; ctx.fill(); ctx.globalAlpha = 1; }
      ctx.beginPath(); ctx.arc(p[0], p[1], 9, 0, 6.2832); ctx.fillStyle = '#ffffff'; ctx.fill();
      ctx.beginPath(); ctx.arc(p[0], p[1], 6.2, 0, 6.2832); ctx.fillStyle = PAL.me; ctx.fill();
    }
    /* The basemap (ocean, land, counties, water, roads) is drawn into an offscreen bitmap a bit larger than the screen and just
       moved while panning. It is redrawn when the pan runs past its margin or the zoom changes. Labels, icons and the route are drawn every frame. */
    var BC = { cv: null, cx: null, w: 0, h: 0, cx0: 0, cy0: 0, sc0: 0, valid: false, dpr: 0, lcand: [], key: '' };
    function setView(w, h, cx, cy, z) {
      vsc = 256 * Math.pow(2, z); vkx = vsc / 3600000; vox = (0.5 - cx) * vsc + w / 2; voy = h / 2 - cy * vsc;
      vx0 = (-40 - vox) / vkx; vx1 = (w + 40 - vox) / vkx;
      vy0 = latOfNy((h + 40 - voy) / vsc) * 1e4; vy1 = latOfNy((-40 - voy) / vsc) * 1e4;
    }
    function baseKey() { return palKey + '|' + dpr + '|' + (DS.roads ? 1 : 0) + (DS.base ? 1 : 0); }
    function renderBase() {
      var t0 = performance.now(), w = W + 2 * Math.ceil(W * 0.3), h = H + 2 * Math.ceil(H * 0.3), main = ctx;
      if (!BC.cv || BC.w !== w || BC.h !== h || BC.dpr !== dpr) {
        BC.cv = document.createElement('canvas'); BC.cv.width = Math.round(w * dpr); BC.cv.height = Math.round(h * dpr);
        BC.cx = BC.cv.getContext('2d', { alpha: false }); BC.w = w; BC.h = h; BC.dpr = dpr;
      }
      ctx = BC.cx;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      setView(w, h, cam.cx, cam.cy, cam.z);
      ctx.fillStyle = PAL.ocean; ctx.fillRect(0, 0, w, h);
      if (DS.base) drawBase();
      drawRoads();
      BC.lcand = lcand.slice(); BC.cx0 = cam.cx; BC.cy0 = cam.cy; BC.sc0 = vsc; BC.valid = true; BC.key = baseKey();
      ctx = main;
      perf.renders++; perf.baseMs = performance.now() - t0;
      if (perf.sync) { try { BC.cx.getImageData(0, 0, 1, 1); perf.baseMs = performance.now() - t0; } catch (err) { /* ignore */ } }
    }
    function paintBase() {
      var sc = scaleNow(), k = BC.valid ? sc / BC.sc0 : 0, ok = false, dx = 0, dy = 0;
      if (BC.valid && BC.key === baseKey()) {
        dx = W / 2 + (BC.cx0 - cam.cx) * sc - BC.w * k / 2; dy = H / 2 + (BC.cy0 - cam.cy) * sc - BC.h * k / 2;
        ok = k > 0.55 && k < 1.8 && dx <= 0.5 && dy <= 0.5 && dx + BC.w * k >= W - 0.5 && dy + BC.h * k >= H - 0.5;
      }
      if (!ok) { renderBase(); k = 1; dx = (W - BC.w) / 2; dy = (H - BC.h) / 2; }
      else if (Math.abs(k - 1) > 0.002) {
        if (!T.bc) T.bc = setTimeout(function () { T.bc = 0; BC.valid = false; invalidate(); }, 160); // sharpen after the zoom settles
      } else { dx = Math.round(dx * dpr) / dpr; dy = Math.round(dy * dpr) / dpr; }
      ctx.drawImage(BC.cv, 0, 0, BC.cv.width, BC.cv.height, dx, dy, BC.w * k, BC.h * k);
    }
    function draw() {
      if (!ctx || !W || !H) return;
      var t0 = performance.now();
      loadPal();
      hits.length = 0; labelGrid = null;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      paintBase();
      var t1 = performance.now();
      setView(W, H, cam.cx, cam.cy, cam.z);
      drawLabels();
      var t2 = performance.now();
      drawPois();
      var t3 = performance.now();
      drawRoute();
      drawMarkers();
      drawMe();
      var vc = visCenter();
      ctx.beginPath(); ctx.moveTo(vc[0] - 9, vc[1]); ctx.lineTo(vc[0] + 9, vc[1]); ctx.moveTo(vc[0], vc[1] - 9); ctx.lineTo(vc[0], vc[1] + 9);
      ctx.globalAlpha = 0.4; ctx.lineWidth = 1.5; ctx.strokeStyle = PAL.text; ctx.stroke(); ctx.globalAlpha = 1;
      updateReadouts();
      if (perf.sync) { try { ctx.getImageData(0, 0, 1, 1); } catch (err) { /* ignore */ } }
      var t4 = performance.now(), dt = t4 - t0;
      perf.frames++; perf.total += dt; perf.last = dt; if (dt > perf.max) perf.max = dt;
      if (perf.log) perf.log.push(dt);
      perf.parts = { base: t1 - t0, labels: t2 - t1, pois: t3 - t2, rest: t4 - t3 };
    }
    function updateReadouts() {
      var ll = centerLL(), vcp = visCenter(), vll = unproject(vcp[0], vcp[1]), cc = (vll.y / 1e4).toFixed(4) + ', ' + (vll.x / 1e4).toFixed(4);
      if (cc !== lastCC) { lastCC = cc; q('gm-cc').textContent = 'Center ' + cc; }
      var mpp = 40075016.686 * Math.cos(ll.lat * RAD) / scaleNow(), metric = S.units === 'metric', unit = metric ? 1000 : 1609.344, i, best = NICE[0];
      for (i = 0; i < NICE.length; i++) { if (NICE[i] * unit / mpp <= 120) best = NICE[i]; }
      var m = best * unit, bw = Math.max(8, Math.round(m / mpp)), alt = metric ? m / 1609.344 : m / 1000;
      var sig = bw + '|' + best + '|' + metric;
      if (sig !== sbSig) {
        sbSig = sig; q('gm-sb').style.width = bw + 'px';
        q('gm-sl').textContent = best + (metric ? ' km' : ' mi') + ' (' + (alt < 1 ? alt.toFixed(2) : alt < 10 ? alt.toFixed(1) : Math.round(alt)) + (metric ? ' mi' : ' km') + ')';
      }
      var cs = LAYERS.map(function (L) { return layerOn(L.id) && cam.z < L.min ? 1 : 0; }).join('') + (DS.pois ? 'p' : '');
      if (cs !== chipSig) renderChips();
    }

    /* ---------- items (what a tap or a search result means) ---------- */
    function poiItem(lid, i) {
      var L = LBY[lid], r = DS.pois[lid].rec[i], sub = r[6] | 0, tl = L.one, icon = L.icon;
      if (lid === 'landmark') { var m = LM[sub] || LM[0]; tl = m[1]; icon = m[0]; }
      if (lid === 'airport') tl = sub ? 'Airport with airline flights' : 'Airfield';
      return { kind: 'poi', layer: lid, idx: i, name: r[2] || L.one, x: r[0], y: r[1], addr: r[3] || '', phone: r[4] || '', flags: r[5] | 0, sub: sub, type: tl, icon: icon };
    }
    function placeItem(i) { var P = DS.places; return { kind: 'place', idx: i, name: P.name[i], x: P.x[i], y: P.y[i], type: PLACE_LABEL[P.kind[i]], icon: '📍', pop: P.pop[i] }; }
    function pinAt(px, py) { var p = unproject(px, py); return { kind: 'pin', name: 'Dropped pin', x: p.x, y: p.y, type: 'Dropped pin', icon: '📍' }; }
    function gpsItem() { var m = st.me; return { kind: 'gps', name: 'My location', x: m.x, y: m.y, type: 'Your position', icon: '◎', acc: m.acc }; }
    function hitTest(px, py) {
      var best = null, bd = 24 * 24;
      for (var i = 0; i < hits.length; i++) {
        var h = hits[i], dx = h.x - px, dy = h.y - py, d = dx * dx + dy * dy + (h.k === 'place' ? 90 : 0);
        if (d < bd) { bd = d; best = h; }
      }
      return best;
    }
    function itemFromHit(h) { return h.k === 'place' ? placeItem(h.i) : poiItem(h.l, h.i); }
    function refPoint() {
      if (st.start) return { x: st.start.x, y: st.start.y, label: 'your start point', kind: 'start' };
      if (st.me) return { x: st.me.x, y: st.me.y, label: 'your location', kind: 'gps' };
      var vc = visCenter(), u = unproject(vc[0], vc[1]); return { x: u.x, y: u.y, label: 'the middle of the map', kind: 'center' };
    }
    function nameCounty(it) { var c = it.kind === 'county' ? '' : countyAt(it.x, it.y); return c ? c + ' County' : ''; }

    /* ---------- panels ---------- */
    function showFatal() {
      if (ST.base === 'err') { fatal.innerHTML = '<p><b>' + e(FAIL_MSG) + '</b></p>' + (ERR.base ? '<p><small>Details: ' + e(ERR.base) + '</small></p>' : '') + '<button class="btn primary" data-gm="retry">Retry</button>'; fatal.hidden = false; }
      else fatal.hidden = true;
    }
    function renderStatus() {
      var h = '', failed = false;
      if (ST.base === 'loading' || ST.base === 'idle') h += '<span class="gm-load">Loading map…</span>';
      [['places', 'places'], ['pois', 'points of interest'], ['roads', 'roads']].forEach(function (p) {
        if (ST[p[0]] === 'loading' || ST[p[0]] === 'idle') h += '<span class="gm-load">Loading ' + p[1] + '…</span>';
        else if (ST[p[0]] === 'err') failed = true;
      });
      if (failed && ST.base !== 'err') h += '<div class="gm-fail">' + e(FAIL_MSG) + '<br><small>Details: ' + e(['places', 'pois', 'roads'].filter(function (n) { return ST[n] === 'err'; }).map(function (n) { return n + ': ' + ERR[n]; }).join('; ')) + '</small><br><button class="btn small" data-gm="retry">Retry</button></div>';
      status.innerHTML = h;
      showFatal();
      layoutVars();
    }
    function renderChips() {
      var z = cam.z, h = '';
      chipSig = LAYERS.map(function (L) { return layerOn(L.id) && z < L.min ? 1 : 0; }).join('') + (DS.pois ? 'p' : '');
      LAYERS.forEach(function (L) {
        var on = layerOn(L.id), far = on && z < L.min, n = DS.pois && DS.pois[L.id] ? DS.pois[L.id].n : null;
        h += '<button class="gm-chip' + (on ? ' on' : '') + (far ? ' far' : '') + '" data-gm="layer" data-l="' + L.id + '" aria-pressed="' + on + '" title="' + (far ? 'On. Zoom in to see these.' : '') + '"><span class="ck">' + (on ? '✓' : '') + '</span>' + L.icon + ' ' + e(L.label) + (n !== null ? ' <span class="n">' + n.toLocaleString('en-US') + '</span>' : '') + '</button>';
      });
      chips.innerHTML = h;
    }
    function setCompact() {
      var c = !!(st.mode || st.pick || !resBox.hidden);
      root.classList.toggle('gm-compact', c);
      layoutVars();
    }
    function closeResults() { resBox.hidden = true; setCompact(); }
    function hidePanel() { st.mode = ''; panel.hidden = true; st.tall = false; panel.classList.remove('tall'); renderRouteBar(); setCompact(); }
    function openMode(mode) { st.mode = mode; closeResults(); renderPanel(); }
    function head(icon, title, sub) {
      return '<div class="gm-head"><span class="gm-ico">' + icon + '</span><div class="gm-ttl"><h2>' + e(title) + '</h2>' + (sub ? '<div class="gm-sub">' + e(sub) + '</div>' : '') + '</div><button class="gm-x" data-gm="close" aria-label="Close">✕</button></div>';
    }
    function sheetHtml(it) {
      var county = nameCounty(it), sub = it.type + (county ? ' · ' + county : ''), h = head(it.icon || '📍', it.name, sub), pills = '';
      if (it.flags & 1) pills += '<span class="gm-pill">Open 24 hours</span>';
      if (it.flags & 2) pills += '<span class="gm-pill er">Emergency room</span>';
      if (pills) h += '<div class="gm-badges">' + pills + '</div>';
      if (it.addr) h += '<p>' + e(it.addr) + '</p>';
      if (it.phone) h += '<p><a class="gm-tel" href="tel:' + e(digits(it.phone)) + '">📞 ' + e(it.phone) + '</a></p>';
      if (it.kind === 'gps') h += '<p class="muted">Accuracy about ' + e(fmtDist(it.acc || 0)) + '. The blue dot follows you while this screen is open.</p>';
      h += '<p><button class="gm-coord" data-gm="copy-coords" aria-label="' + (it.kind === 'gps' ? 'Copy my coordinates' : 'Copy coordinates') + '">' + e(fmtLL(it.x, it.y)) + ' <span>' + (it.kind === 'gps' ? 'Copy my coordinates' : 'Copy') + '</span></button></p>';
      if (st.start && st.start !== it && !(st.start.x === it.x && st.start.y === it.y)) {
        var d = hav(st.start.x, st.start.y, it.x, it.y);
        h += '<p class="muted">Straight-line distance from your start point: <b>' + e(fmtBoth(d)) + '</b>, ' + c8(brg(st.start.x, st.start.y, it.x, it.y)) + ' of the start.</p>';
      }
      h += '<div class="gm-btns"><button class="btn primary" data-gm="start-here">Start here</button><button class="btn primary" data-gm="go-here">Go here</button>';
      if (st.start && st.end) h += '<button class="btn" data-gm="open-route">Directions</button>';
      if (it.kind === 'gps') h += '<button class="btn" data-gm="stop-track">Stop tracking</button>';
      return h + '</div>';
    }
    function endRow(which, it) {
      var isA = which === 'a', nm = it ? it.name : 'Not set yet', sb = (isA ? 'Start' : 'Destination') + (it ? ' · ' + fmtLL(it.x, it.y) : ' · tap Set, then tap the map or search');
      return '<div class="gm-end ' + which + '"><span class="ab">' + (isA ? 'A' : 'B') + '</span><div class="tx"><span class="nm">' + e(nm) + '</span><span class="sb">' + e(sb) + '</span></div>' +
        (isA ? '<button class="btn" data-gm="use-gps-start" aria-label="Use my location as the start" title="Use my location">◎</button>' : '') +
        '<button class="btn" data-gm="' + (isA ? 'pick-start' : 'pick-end') + '">' + (it ? 'Change' : 'Set') + '</button></div>';
    }
    function routeHtml() {
      var r = st.route, h = head('➜', 'Directions', ''), ends = '<div class="gm-ends">' + endRow('a', st.start) + endRow('b', st.end) + '</div>' +
        '<div class="gm-btns small"><button class="btn" data-gm="swap">⇅ Swap</button><button class="btn" data-gm="clear">Clear</button></div>';
      if (ST.roads !== 'ok') {
        h += '<div class="gm-warn">' + (ST.roads === 'err' ? failHtml('roads') + '<br><button class="btn small" data-gm="retry">Retry</button>' : 'The highway data is still loading. Directions will work in a moment.') + '</div>';
        return h + ends + '<div class="gm-note">' + e(SAFETY) + '</div>';
      }
      if (!st.start || !st.end) return h + ends + '<p class="muted">Set both a start and a destination. You can tap the map, use the search box, or use the buttons above.</p><div class="gm-note">' + e(SAFETY) + '</div>';
      if (st.routing) return h + ends + '<p><b>Finding route…</b></p>';
      if (!r) return h + ends + '<div class="gm-btns"><button class="btn primary" data-gm="do-route">Get directions</button></div>';
      if (!r.ok) {
        var msg = r.reason === 'noroad' ? 'There is no highway in this app near your ' + (r.side === 'start' ? 'start point' : 'destination') + '. Try a point closer to a major road.'
          : r.reason === 'disconnected' ? 'No highway connection found between these points in the app’s road data. Try a point nearer a main highway.'
            : r.reason === 'same' ? 'The start and the destination are the same place.'
              : r.reason === 'noroads' ? 'The highway data has no roads in it.' : 'Something went wrong while finding the route. Try again.';
        return h + '<div class="gm-warn">' + e(msg) + '</div>' + ends + '<div class="gm-note">' + e(SAFETY) + '</div>';
      }
      if (r.dist < 100) {
        return h + '<div class="gm-warn">These two places are about ' + e(fmtBoth(hav(r.from.x, r.from.y, r.to.x, r.to.y))) + ' apart in a straight line and are closest to the same part of the highway network, so there is no highway route to show. ' + e(OFFNET) + '</div>' + ends + '<div class="gm-note">' + e(SAFETY) + '</div>';
      }
      h += '<div class="gm-sum"><div class="big">' + e(fmtBoth(r.dist)) + '</div><div class="kk">About ' + e(fmtTime(r.time)) + ' of highway driving</div>' +
        '<div class="muted">A rough estimate: it does not include traffic, closures, weather or the off-highway parts.</div></div>';
      h += ends;
      var mi = 15 * 1609.344;
      if (r.a.d > mi) h += '<div class="gm-warn">Your start point is about ' + e(fmtBoth(r.a.d)) + ' from the nearest highway in this app. The route begins at the nearest highway point. If water or rough country lies in between, you may not be able to get there.</div>';
      if (r.b.d > mi) h += '<div class="gm-warn">Your destination is about ' + e(fmtBoth(r.b.d)) + ' from the nearest highway in this app. The route ends at the nearest highway point. If water or rough country lies in between, you may not be able to get there.</div>';
      h += '<div class="gm-note">' + e(SAFETY) + '</div><ol class="gm-steps">';
      routeLines(r).forEach(function (l) { h += '<li' + (l.off ? ' class="off"' : '') + '><div class="gm-st-t">' + e(l.text) + '</div>' + (l.meta ? '<div class="gm-st-m">' + e(l.meta) + '</div>' : '') + '</li>'; });
      h += '</ol><div class="gm-btns"><button class="btn" data-gm="copy-dir">📋 Copy directions</button><button class="btn" data-gm="print">🖨 Print</button>' + (navigator.share ? '<button class="btn" data-gm="share">📤 Share</button>' : '') + '</div>';
      return h;
    }
    function nearHtml() {
      var ref = refPoint(), h = head('📍', 'Nearest…', '');
      h += '<p class="muted">Measured in a straight line from <b>' + e(ref.label) + '</b>.</p>';
      if (ref.kind !== 'start' && ref.kind !== 'gps') h += '<div class="gm-btns"><button class="btn" data-gm="loc-near">◎ Use my location</button></div>';
      if (!ST.pois || ST.pois !== 'ok') { if (ST.pois !== 'ok') return h + '<p>' + (ST.pois === 'err' ? failHtml('pois') + '<br><button class="btn small" data-gm="retry">Retry</button>' : 'Loading the places list…') + '</p>'; }
      if (!st.nearType) {
        h += '<div class="gm-near-grid">';
        NEAR_TYPES.forEach(function (t) { h += '<button class="btn" data-gm="near-type" data-t="' + t[0] + '"><span aria-hidden="true">' + t[2] + '</span> ' + e(t[1]) + '</button>'; });
        return h + '</div>';
      }
      var nt = NEAR_TYPES.filter(function (t) { return t[0] === st.nearType; })[0] || NEAR_TYPES[0];
      h += '<h3>' + nt[2] + ' ' + e(nt[1]) + ' <button class="btn small" data-gm="near-back">Other types</button></h3>';
      if (!st.nearList.length) return h + '<p>None found in the map data.</p>';
      st.nearList.forEach(function (n, i) {
        var it = n.item, sb = fmtDist(n.d) + ' ' + c8(n.b) + (it.phone ? ' · ' + it.phone : '') + ((it.flags & 1) ? ' · 24 hours' : '') + ((it.flags & 2) && it.layer === 'hospital' ? ' · Emergency room' : '');
        h += '<div class="gm-nrow"><button class="main" data-gm="near-item" data-i="' + i + '"><span class="nm">' + e(it.name) + '</span><span class="sb">' + e(sb) + '</span></button><button class="btn small" data-gm="near-dir" data-i="' + i + '">Directions</button></div>';
      });
      return h + (st.nearNote ? '<p class="muted">' + e(st.nearNote) + '</p>' : '');
    }
    function infoHtml() {
      var meta = NS.meta || {}, h = head('ⓘ', 'About this map', '');
      h += '<h3>How to use it</h3><ul><li>Drag to move. Pinch, double-tap, or use + and − to zoom. The CA button shows all of California.</li><li>Tap an icon or a town name for details. Tap empty ground to drop a pin.</li>' +
        '<li><b>Directions</b>: tap a start, then a destination. <b>Nearest…</b> finds the closest hospital, fuel and more.</li><li>The numbers in the corner are the latitude and longitude of the middle of the map. They are useful on a radio or for rescuers.</li></ul>';
      h += '<h3>Legend</h3><div class="gm-leg">';
      LAYERS.forEach(function (L) { h += '<span class="ic">' + L.icon + '</span><span>' + e(L.one) + (L.id === 'hospital' ? ' (red cross)' : L.id === 'urgent' ? ' (round, cross)' : '') + '</span>'; });
      h += '<span class="ic">🛣️</span><span>Landmarks use their own icons: peaks, passes, parks, dams and more.</span>';
      h += '<span><span class="gm-sw r0"></span></span><span>Freeway</span><span><span class="gm-sw r1"></span></span><span>Major divided highway</span><span><span class="gm-sw r2"></span></span><span>State or US highway</span><span><span class="gm-sw r3"></span></span><span>Other main road</span><span><span class="gm-sw rt"></span></span><span>Your route</span></div>';
      h += '<h3>What it does not have</h3><ul><li>No local streets, only highways and main roads.</li><li>No live traffic, closures, fire, flood, snow or chain controls.</li><li>It may be out of date. Hospitals and businesses move or close. Call first when you can.</li></ul>';
      var mo = /^(\d{4})-(\d{2})/.exec(meta.updated || ''), months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      h += '<h3>About the data</h3><p>Built from OpenStreetMap volunteers’ data (' + e(mo ? months[+mo[2] - 1] + ' ' + mo[1] : 'date unknown') + '). It is not complete: some hospitals, vets, stores and roads are missing or out of date.</p>';
      h += '<p class="muted">Map data date: <b>' + e(meta.updated || 'unknown') + '</b>.</p><p class="muted">' + e(ATTRIBUTION) + '</p><p class="muted">' + e(meta.sources || '') + '</p>';
      return h + '<div class="gm-note">' + e(SAFETY) + '</div>';
    }
    function renderPanel() {
      var h = '';
      if (st.mode === 'sheet' && st.sel) h = sheetHtml(st.sel);
      else if (st.mode === 'route') h = routeHtml();
      else if (st.mode === 'near') h = nearHtml();
      else if (st.mode === 'info') h = infoHtml();
      else { hidePanel(); return; }
      pb.innerHTML = h; pb.scrollTop = 0;
      panel.hidden = false; panel.classList.toggle('tall', st.tall && st.mode === 'route');
      routebar.hidden = true;
      setCompact();
      invalidate();
    }
    function renderRouteBar() {
      var r = st.route;
      if (!r || !r.ok || st.mode) { routebar.hidden = true; layoutVars(); return; }
      routebar.innerHTML = '<div class="tx"><span class="tt">' + e(fmtBoth(r.dist)) + ' · ' + e(fmtTime(r.time)) + '</span><span class="ss">' + e(r.from.name + ' to ' + r.to.name) + '</span></div>' +
        '<button class="btn primary" data-gm="open-route">Steps</button><button class="gm-x" data-gm="clear" aria-label="Clear route">✕</button>';
      routebar.hidden = false; layoutVars();
    }
    function updatePrint() {
      var r = st.route;
      if (!r || !r.ok) { printBox.innerHTML = ''; return; }
      var h = '<h1>Grid Down Guide: highway directions</h1><div class="kv2"><b>From:</b> ' + e(r.from.name) + ' (' + e(fmtLL(r.from.x, r.from.y)) + ')</div><div class="kv2"><b>To:</b> ' + e(r.to.name) + ' (' + e(fmtLL(r.to.x, r.to.y)) + ')</div>' +
        '<div class="kv2"><b>Highway distance:</b> ' + e(fmtBoth(r.dist)) + '</div><div class="kv2"><b>Estimated driving time:</b> about ' + e(fmtTime(r.time)) + ' (rough estimate: no traffic, closures or weather)</div>' +
        '<div class="box">' + e(SAFETY) + '</div><ol>';
      routeLines(r).forEach(function (l) { h += '<li>' + e(l.text) + (l.meta ? ' <small>(' + e(l.meta.toLowerCase()) + ')</small>' : '') + '</li>'; });
      printBox.innerHTML = h + '</ol><p><small>Printed ' + e(new Date().toLocaleString()) + '. Map data date ' + e((NS.meta && NS.meta.updated) || 'unknown') + '. ' + e(ATTRIBUTION) + '</small></p>';
    }

    /* ---------- selecting, start and destination, routing ---------- */
    function openSheet(it, fly) {
      st.sel = it; st.mode = 'sheet'; closeResults(); renderPanel();
      if (fly) flyTo(it.x, it.y, Math.max(cam.z, fly));
    }
    function banner2() {
      if (!st.pick) { banner.hidden = true; setCompact(); return; }
      banner.innerHTML = '<span>' + (st.pick === 'start' ? 'Tap your starting point on the map' : 'Tap your destination') + '</span><span style="display:flex;gap:6px">' +
        (st.pick === 'start' ? '<button class="gm-btn" data-gm="use-gps-start">◎ My location</button>' : '') + '<button class="gm-btn" data-gm="cancel-pick">Cancel</button></span>';
      banner.hidden = false; setCompact();
    }
    function startPick(which) {
      st.pick = which; st.mode = ''; panel.hidden = true; closeResults(); renderRouteBar(); banner2(); invalidate();
    }
    function cancelPick() { st.pick = ''; banner2(); if (st.start && st.end) openMode('route'); }
    function setEnd(which, it) {
      var c = { kind: it.kind, name: it.name, x: it.x, y: it.y, icon: it.icon, type: it.type };
      if (which === 'start') st.start = c; else st.end = c;
      st.route = null; st.routing = false; printBox.innerHTML = ''; st.sel = null;
    }
    function afterEnds() { // continue the two-step flow, or show directions
      if (!st.start) { startPick('start'); return; }
      if (!st.end) { startPick('end'); return; }
      st.pick = ''; banner2(); openMode('route'); computeRoute();
    }
    function choose(it) { // a place was picked for the pick-mode flow
      var which = st.pick; st.pick = '';
      setEnd(which, it); banner2(); afterEnds();
    }
    function computeRoute() {
      if (!st.start || !st.end || ST.roads !== 'ok') return;
      st.routing = true; st.route = null;
      if (st.mode === 'route') renderPanel();
      clearTimeout(T.rt);
      T.rt = setTimeout(function () {
        if (!alive) return;
        var res;
        try {
          if (st.start.x === st.end.x && st.start.y === st.end.y) res = { ok: false, reason: 'same' };
          else res = findRoute(st.start, st.end);
        } catch (err) { if (window.console) console.warn('route failed', err); res = { ok: false, reason: 'error' }; }
        st.routing = false; st.route = res; perf.route = res.ms || 0;
        updatePrint();
        if (st.mode === 'route') renderPanel(); else renderRouteBar();
        if (res.ok) fitRoute(); invalidate();
      }, 30);
    }
    function fitRoute() {
      var r = st.route; if (!r || !r.ok) return;
      var x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9, p = r.pts, i;
      for (i = 0; i < p.length; i += 2) { if (p[i] < x0) x0 = p[i]; if (p[i] > x1) x1 = p[i]; if (p[i + 1] < y0) y0 = p[i + 1]; if (p[i + 1] > y1) y1 = p[i + 1]; }
      [r.from, r.to].forEach(function (it) { x0 = Math.min(x0, it.x); x1 = Math.max(x1, it.x); y0 = Math.min(y0, it.y); y1 = Math.max(y1, it.y); });
      var v = viewFor(x0, y0, x1, y1, pads(), 13);
      animateTo(v.cx, v.cy, v.z, 600);
    }

    /* ---------- tap, pick, search results ---------- */
    function onTap(px, py) {
      closeResults(); qin.blur();
      var h = hitTest(px, py), it = h ? itemFromHit(h) : pinAt(px, py);
      if (st.pick) { choose(it); return; }
      openSheet(it, 0);
      st.sel = it; invalidate();
      var p = project(it.x, it.y);
      if (p[1] > H - INS.b - 30 || p[1] < INS.t + 30 || p[0] < INS.l + 10 || p[0] > W - 10) flyTo(it.x, it.y, cam.z, 350); // do not leave the tapped place under the sheet
    }
    function flyZoomFor(it) { return it.kind === 'poi' ? 13 : it.kind === 'county' ? 8.2 : it.kind === 'place' ? [10, 11, 12, 13][['City', 'Town', 'Village', 'Hamlet'].indexOf(it.type)] : 13; }
    function itemFromEntry(i) {
      var ty = SI.type[i], src = SI.src[i];
      if (ty === 0) { var c = DS.base.counties[src]; return { kind: 'county', name: c.n + ' County', x: c.lx, y: c.ly, type: 'County', icon: '📍' }; }
      if (ty <= 4) return placeItem(src);
      return poiItem(LAYERS[ty - 10].id, src);
    }
    function renderResults(v) {
      var h = '', ref = refPoint();
      st.results.forEach(function (m, n) {
        var i = m.i, ty = SI.type[i], it = itemFromEntry(i), cty = it.kind === 'county' ? '' : countyAt(it.x, it.y), d = hav(ref.x, ref.y, it.x, it.y);
        var sb = it.type + (cty ? ' · ' + cty + ' County' : '') + ' · ' + fmtDist(d) + ' ' + c8(brg(ref.x, ref.y, it.x, it.y));
        h += '<button class="gm-res" data-gm="result" data-i="' + n + '"><span class="ic">' + e(it.icon) + '</span><span class="tx"><span class="nm">' + e(it.name) + '</span><span class="sb">' + e(sb) + '</span></span></button>';
      });
      var note = '';
      if (!indexReady()) note = 'Still preparing the search list…';
      if (!st.results.length) note = indexReady() ? 'Nothing found for “' + v.trim() + '”. Try fewer letters or the name of a nearby town.' : 'Preparing the search list…';
      resBox.innerHTML = h + (note ? '<div class="gm-res-note">' + e(note) + '</div>' : '');
      resBox.hidden = false; resBox.scrollTop = 0; setCompact();
    }
    function runSearch(v) {
      clearTimeout(T.qw);
      ensureIndex(function () { if (alive && qin.value.trim()) runSearch(qin.value); });
      var ref = refPoint();
      st.results = searchIndex(v, ref.x, ref.y);
      renderResults(v);
      if (!indexReady()) T.qw = setTimeout(function () { if (alive && qin.value === v) runSearch(v); }, 400);
    }
    function onQuery() {
      var v = qin.value; qx.hidden = !v; clearTimeout(T.q);
      if (!v.trim()) { closeResults(); return; }
      T.q = setTimeout(function () { runSearch(v); }, 130);
    }
    function chooseResult(n) {
      var m = st.results[n]; if (!m) return;
      var it = itemFromEntry(m.i);
      closeResults(); qin.blur();
      if (st.pick) { choose(it); flyTo(it.x, it.y, Math.max(cam.z, 9)); return; }
      openSheet(it, 0);
      flyTo(it.x, it.y, Math.max(Math.min(cam.z, 13), flyZoomFor(it)));
    }

    /* ---------- nearest ---------- */
    function nearestOf(lid, ref) {
      var P = DS.pois && DS.pois[lid]; if (!P) return [];
      var cosl = Math.cos(ref.y * 1e-4 * RAD), best = [], onlyER = lid === 'hospital', anyER = false, i;
      if (onlyER) for (i = 0; i < P.n; i++) if (P.rec[i][5] & 2) { anyER = true; break; }
      for (i = 0; i < P.n; i++) {
        if (onlyER && anyER && !(P.rec[i][5] & 2)) continue;
        var dx = (P.x[i] - ref.x) * cosl, dy = P.y[i] - ref.y, d2 = dx * dx + dy * dy;
        if (best.length < 5 || d2 < best[best.length - 1].d2) {
          best.push({ i: i, d2: d2 }); best.sort(function (a, b) { return a.d2 - b.d2; }); if (best.length > 5) best.pop();
        }
      }
      st.nearNote = onlyER && !anyER ? 'The map data does not say which hospitals have an emergency room, so all hospitals are listed. Call ahead.' : '';
      return best.map(function (b) { var it = poiItem(lid, b.i); return { item: it, d: hav(ref.x, ref.y, it.x, it.y), b: brg(ref.x, ref.y, it.x, it.y) }; });
    }
    function showNearest(lid) {
      st.nearType = lid; st.nearList = lid ? nearestOf(lid, refPoint()) : [];
      openMode('near');
    }

    /* ---------- location ---------- */
    function geoMessage(err) {
      if (err && err.code === 1) return 'Location is turned off for this app. Allow location for this site in your browser settings, then try again.';
      if (err && err.code === 3) return 'Finding your position took too long. Try again with a clear view of the sky.';
      return 'Your device could not find its position. Go outside or near a window, make sure Location (GPS) is on, and try again.';
    }
    function locBtn() { var b = q('gm-loc'); if (b) b.querySelector('.t').textContent = st.geoBusy ? 'Finding…' : 'My location'; }
    function locate(then) {
      if (!navigator.geolocation) { App.toast('This device or browser cannot find your location.', 4000); return; }
      if (window.isSecureContext === false) { App.toast('Location only works when the app is opened from its web address (https), not from a saved file.', 5000); return; }
      if (st.watch !== null) { // already tracking: use the latest fix
        if (st.me) { then(); return; }
      }
      st.geoBusy = true; locBtn();
      var first = true;
      if (st.watch !== null) { try { navigator.geolocation.clearWatch(st.watch); } catch (err) { /* ignore */ } st.watch = null; }
      try {
        st.watch = navigator.geolocation.watchPosition(function (pos) {
          if (!alive) return;
          st.geoBusy = false; locBtn();
          st.me = { x: Math.round(pos.coords.longitude * 1e4), y: Math.round(pos.coords.latitude * 1e4), acc: pos.coords.accuracy || 0 };
          invalidate();
          if (first) { first = false; then(); }
          else if (st.sel && st.sel.kind === 'gps' && st.mode === 'sheet') { /* keep the sheet stable */ }
        }, function (err) {
          if (!alive) return;
          st.geoBusy = false; locBtn();
          if (first || !st.me) { if (st.watch !== null) { try { navigator.geolocation.clearWatch(st.watch); } catch (e2) { /* ignore */ } st.watch = null; } App.toast(geoMessage(err), 6000); }
        }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 });
      } catch (err) { st.geoBusy = false; locBtn(); App.toast(geoMessage(err), 6000); }
    }
    function stopTracking() {
      if (st.watch !== null) { try { navigator.geolocation.clearWatch(st.watch); } catch (err) { /* ignore */ } st.watch = null; }
      st.me = null; st.geoBusy = false; locBtn(); if (st.sel && st.sel.kind === 'gps') { st.sel = null; hidePanel(); } invalidate(); App.toast('Stopped following your location.');
    }
    function showMe() { var it = gpsItem(); openSheet(it, 0); flyTo(it.x, it.y, Math.max(cam.z, 12)); }

    /* ---------- clicks on buttons ---------- */
    function onClick(ev) {
      var el = ev.target.closest ? ev.target.closest('[data-gm]') : null;
      if (!el || !root.contains(el)) return;
      var a = el.getAttribute('data-gm'), id = el.getAttribute('data-i'), n;
      switch (a) {
        case 'close': if (st.mode === 'sheet') st.sel = null; hidePanel(); invalidate(); break;
        case 'grip': st.tall = !st.tall; panel.classList.toggle('tall', st.tall); layoutVars(); break;
        case 'info': if (st.mode === 'info') hidePanel(); else openMode('info'); break;
        case 'qclear': qin.value = ''; qx.hidden = true; closeResults(); qin.focus(); break;
        case 'result': chooseResult(+id); break;
        case 'layer': {
          var lid = el.getAttribute('data-l'), p = prefs(), on = !layerOn(lid), L = LBY[lid];
          p.l[lid] = on ? 1 : 0; App.save(); renderChips(); invalidate();
          if (on && cam.z < L.min) App.toast(L.label + ' show up when you zoom in closer.', 3500, 'Zoom in', function () { if (alive) zoomAnim(W / 2, H / 2, L.min + 0.3); });
          break;
        }
        case 'layers': chips.classList.toggle('open'); layoutVars(); break;
        case 'zin': zoomAnim(W / 2, H / 2, cam.z + 1); break;
        case 'zout': zoomAnim(W / 2, H / 2, cam.z - 1); break;
        case 'fit': fitCA(true); break;
        case 'dir': if (ST.roads !== 'ok') openMode('route'); else if (!st.start) startPick('start'); else if (!st.end) startPick('end'); else { openMode('route'); if (!st.route) computeRoute(); } break;
        case 'near': st.nearType = ''; st.nearList = []; openMode('near'); break;
        case 'near-type': showNearest(el.getAttribute('data-t')); break;
        case 'near-back': st.nearType = ''; st.nearList = []; renderPanel(); break;
        case 'near-item': { var ni = st.nearList[+id]; if (ni) { openSheet(ni.item, 0); flyTo(ni.item.x, ni.item.y, Math.max(cam.z, 12)); } break; }
        case 'near-dir': {
          var nd = st.nearList[+id]; if (!nd) break;
          var ref = refPoint(); setEnd('end', nd.item);
          if (ref.kind === 'start') { afterEnds(); break; }
          if (ref.kind === 'gps') { setEnd('start', gpsItem()); afterEnds(); break; }
          afterEnds(); break;
        }
        case 'loc': locate(function () { showMe(); }); break;
        case 'loc-near': locate(function () { st.nearList = st.nearType ? nearestOf(st.nearType, refPoint()) : []; if (st.mode === 'near') renderPanel(); }); break;
        case 'stop-track': stopTracking(); break;
        case 'use-gps-start': locate(function () { st.pick = ''; setEnd('start', gpsItem()); banner2(); afterEnds(); }); break;
        case 'copy-coords': if (st.sel) copyText(fmtLL(st.sel.x, st.sel.y), 'Coordinates copied'); break;
        case 'start-here': if (st.sel) { setEnd('start', st.sel); afterEnds(); } break;
        case 'go-here': if (st.sel) { setEnd('end', st.sel); afterEnds(); } break;
        case 'open-route': st.tall = true; openMode('route'); if (!st.route && st.start && st.end) computeRoute(); break;
        case 'pick-start': startPick('start'); break;
        case 'pick-end': startPick('end'); break;
        case 'cancel-pick': cancelPick(); break;
        case 'swap': n = st.start; st.start = st.end; st.end = n; st.route = null; printBox.innerHTML = ''; renderPanel(); if (st.start && st.end) computeRoute(); invalidate(); break;
        case 'clear': st.start = st.end = st.route = st.sel = null; st.pick = ''; st.routing = false; printBox.innerHTML = ''; banner2(); hidePanel(); invalidate(); break;
        case 'do-route': computeRoute(); break;
        case 'copy-dir': if (st.route && st.route.ok) copyText(routeText(st.route), 'Directions copied'); break;
        case 'print': updatePrint(); window.print(); break;
        case 'share': if (st.route && st.route.ok && navigator.share) { try { navigator.share({ title: 'Highway directions', text: routeText(st.route) }).catch(function () { /* cancelled */ }); } catch (err) { /* ignore */ } } break;
        case 'retry': retryFailed(); break;
        default: break;
      }
    }

    /* ---------- pointer gestures ---------- */
    function pidx(id) { for (var i = 0; i < ptrs.length; i++) if (ptrs[i].id === id) return i; return -1; }
    function rel(ev) { var r = canvas.getBoundingClientRect(); return { x: ev.clientX - r.left, y: ev.clientY - r.top }; }
    function onDown(ev) {
      if (ev.pointerType === 'mouse' && ev.button !== 0) return;
      closeResults(); qin.blur();
      var p = rel(ev), now = performance.now();
      ptrs.push({ id: ev.pointerId, x: p.x, y: p.y });
      try { canvas.setPointerCapture(ev.pointerId); } catch (err) { /* ignore */ }
      stopMotion();
      if (ptrs.length === 1) { g = { mode: 'pan', sx: p.x, sy: p.y, lx: p.x, ly: p.y, t0: now, moved: false, samples: [{ t: now, x: p.x, y: p.y }], slop: ev.pointerType === 'mouse' ? 4 : 10 }; canvas.classList.add('grab'); }
      else if (ptrs.length === 2) startPinch();
      ev.preventDefault();
    }
    function startPinch() {
      var a = ptrs[0], b = ptrs[1], mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2, sc = scaleNow();
      g = { mode: 'pinch', d0: Math.max(1, Math.hypot(a.x - b.x, a.y - b.y)), z0: cam.z, wx: cam.cx + (mx - W / 2) / sc, wy: cam.cy + (my - H / 2) / sc, moved: true };
    }
    function onMove(ev) {
      var i = pidx(ev.pointerId); if (i < 0) return;
      var p = rel(ev), pt = ptrs[i];
      pt.x = p.x; pt.y = p.y;
      if (g.mode === 'pan' && ptrs.length === 1) {
        if (!g.moved && Math.hypot(p.x - g.sx, p.y - g.sy) > g.slop) { g.moved = true; g.lx = g.sx; g.ly = g.sy; }
        if (g.moved) {
          panBy(p.x - g.lx, p.y - g.ly); g.lx = p.x; g.ly = p.y;
          var now = performance.now(); g.samples.push({ t: now, x: p.x, y: p.y }); if (g.samples.length > 8) g.samples.shift();
        }
      } else if (g.mode === 'pinch' && ptrs.length >= 2) {
        var a = ptrs[0], b = ptrs[1], mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2, d = Math.max(1, Math.hypot(a.x - b.x, a.y - b.y));
        var z = clamp(g.z0 + Math.log(d / g.d0) / Math.LN2, zMin, Z_MAX), sc = 256 * Math.pow(2, z);
        cam.z = z; cam.cx = g.wx - (mx - W / 2) / sc; cam.cy = g.wy - (my - H / 2) / sc; clampCam(); invalidate();
      }
    }
    function onUp(ev) {
      var i = pidx(ev.pointerId); if (i < 0) return;
      var pt = ptrs[i], now = performance.now(); ptrs.splice(i, 1);
      try { canvas.releasePointerCapture(ev.pointerId); } catch (err) { /* ignore */ }
      if (g.mode === 'pan' && ptrs.length === 0) {
        canvas.classList.remove('grab');
        if (!g.moved && ev.type !== 'pointercancel' && now - g.t0 < 700) handleTap(pt.x, pt.y);
        else if (g.moved && ev.type !== 'pointercancel') {
          var s = g.samples || [], f = s[0], l = s[s.length - 1];
          for (var k = 0; k < s.length; k++) if (l.t - s[k].t <= 110) { f = s[k]; break; }
          var dt = l ? l.t - f.t : 0;
          if (l && dt > 8 && now - l.t < 90) { var vx = (l.x - f.x) / dt, vy = (l.y - f.y) / dt; if (Math.hypot(vx, vy) > 0.12) { inertia = { vx: vx, vy: vy, t: now }; schedule(); } }
          if (!inertia) onMoveEnd();
        }
        g = {};
      } else if (g.mode === 'pinch') {
        if (ptrs.length === 1) g = { mode: 'pan', moved: true, lx: ptrs[0].x, ly: ptrs[0].y, sx: ptrs[0].x, sy: ptrs[0].y, t0: now, samples: [], slop: 10 };
        else if (ptrs.length === 0) g = {};
        onMoveEnd();
      }
    }
    function handleTap(x, y) {
      var now = performance.now();
      if (lastTap && now - lastTap.t < 330 && Math.hypot(x - lastTap.x, y - lastTap.y) < 40) { clearTimeout(T.tap); lastTap = null; zoomAnim(x, y, cam.z + 1); return; }
      lastTap = { t: now, x: x, y: y };
      clearTimeout(T.tap);
      T.tap = setTimeout(function () { lastTap = null; if (alive) onTap(x, y); }, 280);
    }
    function onWheel(ev) {
      ev.preventDefault();
      var p = rel(ev), dy = ev.deltaY * (ev.deltaMode === 1 ? 16 : ev.deltaMode === 2 ? 100 : 1);
      stopMotion();
      anchorZoom(p.x, p.y, cam.z - clamp(dy * (ev.ctrlKey ? 0.012 : 0.005), -1.2, 1.2));
      onMoveEnd();
    }
    function onKey(ev) {
      var k = ev.key;
      if (k === 'ArrowLeft') panBy(60, 0); else if (k === 'ArrowRight') panBy(-60, 0); else if (k === 'ArrowUp') panBy(0, 60); else if (k === 'ArrowDown') panBy(0, -60);
      else if (k === '+' || k === '=') zoomAnim(W / 2, H / 2, cam.z + 0.7); else if (k === '-' || k === '_') zoomAnim(W / 2, H / 2, cam.z - 0.7);
      else return;
      ev.preventDefault(); onMoveEnd();
    }
    function onDocKey(ev) {
      if (ev.key !== 'Escape') return;
      if (!resBox.hidden) closeResults(); else if (st.pick) cancelPick(); else if (st.mode) { if (st.mode === 'sheet') st.sel = null; hidePanel(); invalidate(); }
    }

    /* ---------- wiring ---------- */
    function on(target, type, fn, opts, global) { target.addEventListener(type, fn, opts); undo.push(function () { target.removeEventListener(type, fn, opts); }); }
    on(root, 'click', onClick);
    on(canvas, 'pointerdown', onDown); on(canvas, 'pointermove', onMove); on(canvas, 'pointerup', onUp); on(canvas, 'pointercancel', onUp);
    on(canvas, 'wheel', onWheel, { passive: false });
    on(canvas, 'keydown', onKey);
    on(canvas, 'contextmenu', function (ev) { ev.preventDefault(); });
    ['gesturestart', 'gesturechange', 'gestureend'].forEach(function (t) { on(root, t, function (ev) { ev.preventDefault(); }); }); // iOS Safari page pinch
    on(qin, 'input', onQuery);
    on(qin, 'focus', function () { if (qin.value.trim() && !resBox.hidden === false && st.results.length) { resBox.hidden = false; setCompact(); } });
    on(qin, 'keydown', function (ev) { if (ev.key === 'Enter') { ev.preventDefault(); clearTimeout(T.q); if (qin.value.trim()) { runSearch(qin.value); if (st.results.length) chooseResult(0); } } });
    on(document, 'keydown', onDocKey);
    on(window, 'resize', resize); on(window, 'orientationchange', function () { setTimeout(resize, 120); });
    if (mq && mq.addEventListener) on(mq, 'change', function () { palKey = ''; invalidate(); });
    var ro = null;
    if (window.ResizeObserver) {
      ro = new ResizeObserver(function () { resize(); });
      ro.observe(root); ro.observe(panel); ro.observe(top);
      var hdr = document.querySelector('header.top'), tabs = document.getElementById('tabs');
      if (hdr) ro.observe(hdr); if (tabs) ro.observe(tabs);
    }
    var listener = function () { if (!alive) return; BC.valid = false; renderStatus(); renderChips(); ensureIndex(); invalidate(); if (st.mode === 'route' || st.mode === 'near') renderPanel(); if (!st.route && st.start && st.end && ST.roads === 'ok' && st.mode === 'route' && !st.routing) computeRoute(); };
    LISTEN.push(listener);

    /* ---------- start ---------- */
    renderStatus(); renderChips();
    resize();
    if (ST.base === 'idle') loadAll();
    else { if (ST.base === 'err' || ST.places === 'err' || ST.pois === 'err' || ST.roads === 'err') retryFailed(); }
    ensureIndex();
    if (params && params.get('near') && LBY[params.get('near')]) {
      var wantNear = params.get('near');
      (function waitNear() { if (!alive) return; if (ST.pois === 'ok') showNearest(wantNear); else if (ST.pois !== 'err') T.wn = setTimeout(waitNear, 200); })();
    }

    var api = {
      cam: cam, st: st, perf: perf, hits: hits, DS: DS, ST: ST, SI: SI, LAYERS: LAYERS,
      size: function () { return { W: W, H: H, dpr: dpr, zMin: zMin }; },
      draw: function () { dirty = true; draw(); }, render: function () { dirty = true; frame(performance.now()); },
      setView: function (lon, lat, z) { stopMotion(); cam.cx = nxOf(Math.round(lon * 1e4)); cam.cy = nyOf(Math.round(lat * 1e4)); cam.z = z; clampCam(); invalidate(); },
      project: function (x, y) { return project(x, y); }, unproject: unproject,
      snap: function (x, y) { return snapPoint(x, y); }, route: function (a, b) { return findRoute(a, b); },
      setRoute: function (a, b) { setEnd('start', a); setEnd('end', b); afterEnds(); },
      stepText: stepText, routeLines: routeLines, routeText: routeText, search: function (v) { var r = refPoint(); return searchIndex(v, r.x, r.y); },
      nearest: function (lid) { return nearestOf(lid, refPoint()); }, countyAt: countyAt, saveView: saveView,
      geoFix: function (lon, lat, acc) { st.me = { x: Math.round(lon * 1e4), y: Math.round(lat * 1e4), acc: acc || 25 }; invalidate(); },
      timers: function () { return Object.keys(T).filter(function (k) { return T[k]; }).length; },
      alive: function () { return alive; }, BC: BC, TIMES: TIMES
    };
    INST = { api: api };

    return function cleanup() {
      alive = false;
      if (raf) cancelAnimationFrame(raf); raf = 0;
      Object.keys(T).forEach(function (k) { clearTimeout(T[k]); });
      if (st.watch !== null && navigator.geolocation) { try { navigator.geolocation.clearWatch(st.watch); } catch (err) { /* ignore */ } st.watch = null; }
      undo.forEach(function (f) { try { f(); } catch (err) { /* ignore */ } });
      if (ro) ro.disconnect();
      BC.cv = BC.cx = null; BC.valid = false;
      var i = LISTEN.indexOf(listener); if (i >= 0) LISTEN.splice(i, 1);
      saveView();
      html.classList.remove('gm-lock');
      if (INST && INST.api === api) INST = null;
    };
  }

  App.homeBlock(function () { return '<a class="start-card" href="#/map">🗺 <b>California map &amp; highway directions</b><small>Hospitals, vets, groceries, fuel, and routes between cities. Works with no signal</small></a>'; });
  App.mapTest = function () { return INST ? INST.api : null; }; // read-only handle for automated tests
  App.register('map', function (parts, params) {
    return { title: 'California Map', back: true, tab: 'more', html: viewHtml(), after: function () { return mount(params); } };
  });
});

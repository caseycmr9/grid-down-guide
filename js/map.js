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
   STREET PACKS (optional, one download per county): map/streets-index.json lists 58 counties, each with one or more chunk files streets/<id>.json
     {v:1, base:<roadsHash>, id, name, labels, nodes:[x0,y0,dx,dy...] (1e-5 degree units, delta coded), edges:[[a,b,cls 2..5,flags,lab,lenM,geom],...], ties:[[node,key],...]}
   They are saved in the Cache API cache 'streets-v1' (never 'gdg-...', the service worker deletes those), recorded in S.map.streets, parsed into compact typed-array
   records and merged with the highway network into ONE graph (section 2b). INSIDE the graph every coordinate is an Int32 in units of 1e-5 degree (the highway data is
   multiplied by 10, so it draws exactly as before); everything outside it (items, pins, route points, snapped points) stays in 1e-4 degree units (floats where needed).
   Merged classes: 0 to 3 highways, 4 to 7 = street classes 2 to 5 (city arterial, secondary, tertiary, residential).
   ROUTING. Time-weighted A* over a CSR graph in typed arrays. Each endpoint is snapped to the nearest point on the nearest edges (grid over edge boxes, ring search;
   street edges have one small grid per pack file), and the snapped points become virtual start and goal nodes, so a start in the middle of a 40 km edge works and one-way edges are respected.
   The search is fast enough (see App.mapTest.perf) to run on the main thread, so there is no worker.

   Sections: helpers, data loading, street packs, spatial lookup, routing, directions text, search index, then the screen (camera, drawing, gestures, UI panels). */
(window.GDG_MODULES = window.GDG_MODULES || []).push(function (App) {
  'use strict';
  var S = App.S, e = App.esc;
  var $ = function (s, el) { return (el || document).querySelector(s); };
  var NS = (window.GDG_MAP = window.GDG_MAP || {});
  var RAD = Math.PI / 180;
  var Z_MIN = 5, Z_MAX = 15;
  var ATTRIBUTION = '© OpenStreetMap contributors · US Census · Natural Earth';
  /* Satellite view: USGS National Map imagery tiles (public domain, CORS open). ArcGIS tile order is z/y/x; levels 0 to 16 exist, 17 and up return an error page.
     The map's own zoom z has 256 * 2^z pixels around the world, so map zoom z is the same as standard tile level z. */
  var SAT_URL = 'https://basemap.nationalmap.gov/arcgis/rest/services/USGSImageryOnly/MapServer/tile/';
  var SAT_ATTR = 'Imagery: USGS The National Map, USDA';
  var SAT_CACHE = 'tiles-usgs-v1'; // must not start with 'gdg-': the service worker deletes every cache with that prefix on each app update
  var SAT_MAXZ = 16, SAT_MEM = 150, SAT_FLY = 6, SAT_SAVE_FLY = 4, SAT_KB = 25, SAT_MAX_SAVE = 3000, SAT_SMALL = 1500, SAT_SAVE_MAXL = 15, SAT_AUTO_MAX = 4000; // SAT_AUTO_MAX: pictures kept just from looking; past that, viewing no longer stores more (saving an area still does)
  var SAT_NOTICE = 'Satellite pictures come from the US Geological Survey over the internet. To get them, the part of the map you are looking at is sent to the USGS. They only show with a connection, unless you save an area first.';
  var SAT_SVG = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">';
  var SAT_ICON_GLOBE = SAT_SVG + '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3.4 3.2 3.4 14.8 0 18M12 3c-3.4 3.2-3.4 14.8 0 18"/></svg>';
  var SAT_ICON_MAP = SAT_SVG + '<path d="M3 6.5l6-2.5 6 2.5 6-2.5v13.5l-6 2.5-6-2.5-6 2.5z"/><path d="M9 4v13.5M15 6.5V20"/></svg>';
  var SAFETY = 'Streets are only known where street maps are saved; elsewhere this app has highways and main roads only. Road closures, one-way changes, construction, wildfire, flooding, snow and chain controls are not known to it. Check signs and radio, and carry a paper map.';
  var OFFNET = 'This app has no local street data here: use a paper map, signs and local knowledge for this part.';
  var OFFNET_ST = 'No mapped road is closer: use signs, a paper map and local knowledge for this part.';
  var STREETS_CACHE = 'streets-v1'; // must not start with 'gdg-': the service worker deletes every cache with that prefix on each app update
  var STREETS_INDEX = 'map/streets-index.json';
  var Z_STREETS = 17; // deepest zoom while street packs are loaded (Z_MAX otherwise)
  var ST_JUNC = 0; // seconds added to the routing cost of every street edge (tested: 0 gives the best routes, 5 sends city trips round the long way over highway-class roads)
  var ST_STOP = 5; // seconds added to the ESTIMATED time for every street edge driven (a junction, a turn or a stop sign), so a city trip does not look as quick as open road
  var ST_FLY = 2, ST_CELL = 400; // downloads in flight at once; street grid cell size in 1e-5 degrees (about 440 m)
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
  function hav5(x1, y1, x2, y2) { // same as hav, for the graph's 1e-5 degree units
    var la1 = y1 * 1e-5 * RAD, la2 = y2 * 1e-5 * RAD, dl = (x2 - x1) * 1e-5 * RAD, dp = la2 - la1;
    var a = Math.sin(dp / 2) * Math.sin(dp / 2) + Math.cos(la1) * Math.cos(la2) * Math.sin(dl / 2) * Math.sin(dl / 2);
    return 12742017.6 * Math.asin(Math.min(1, Math.sqrt(a)));
  }
  function brg(x1, y1, x2, y2) {
    var la1 = y1 * 1e-4 * RAD, la2 = y2 * 1e-4 * RAD, dl = (x2 - x1) * 1e-4 * RAD;
    var yy = Math.sin(dl) * Math.cos(la2), xx = Math.cos(la1) * Math.sin(la2) - Math.sin(la1) * Math.cos(la2) * Math.cos(dl);
    return (Math.atan2(yy, xx) / RAD + 360) % 360;
  }
  var C8 = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  var C8W = ['north', 'northeast', 'east', 'southeast', 'south', 'southwest', 'west', 'northwest'];
  function c8(b) { return C8[Math.round(b / 45) % 8]; }
  function c8w(b) { return C8W[Math.round(b / 45) % 8]; }
  function slugOf(s) { return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
  function dirWord(b) { // signed-direction style: cardinal within 30 degrees, else a diagonal
    if (b < 30 || b >= 330) return 'northbound';
    if (b < 60) return 'northeastbound'; if (b < 120) return 'eastbound'; if (b < 150) return 'southeastbound';
    if (b < 210) return 'southbound'; if (b < 240) return 'southwestbound'; if (b < 300) return 'westbound'; return 'northwestbound';
  }
  function fmtMi(m) {
    var v = m / 1609.344;
    if (m < 160.9) return Math.max(50, Math.round(m * 3.28084 / 50) * 50) + ' ft'; // under 0.1 mi: feet, to the nearest 50
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
  var DS = { base: null, places: null, pois: null, roads: null, hroads: null }; // decoded structures, built once per page lifetime (roads = highways plus any loaded street packs, hroads = the highways alone)
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
  var SPD = [62, 52, 44, 38, 40, 36, 30, 25].map(function (mph) { return mph * 0.44704; }); // meters per second by class (0 to 3 highways, 4 to 7 streets)
  var VMAX = SPD[0];
  // time slicing: long jobs are generator functions that yield when due() says the current slice (about 10 ms) is used up
  var SL = { dl: Infinity };
  function due() { return performance.now() > SL.dl; }
  var CANCEL = { cancelled: true };
  function runSync(gen) { SL.dl = Infinity; var r; do { r = gen.next(); } while (!r.done); return r.value; }
  function runSliced(gen, dead) { // drives a generator in slices, a timer tick apart, so the screen stays responsive; dead() cancels it
    return new Promise(function (resolve, reject) {
      function step() {
        if (dead && dead()) { reject(CANCEL); return; }
        SL.dl = performance.now() + 10;
        var r; try { r = gen.next(); } catch (err) { reject(err); return; }
        if (r.done) resolve(r.value); else setTimeout(step, 0);
      }
      step();
    });
  }
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
          N: N, E: E, Nh: N, Eh: E, lh: labels.length, H: null, sgrids: [], hgrid: null, cs: cs, labels: labels, ea: new Int32Array(E), eb: new Int32Array(E), ecl: new Uint8Array(E), efl: new Uint8Array(E), elab: new Int32Array(E),
          elen: new Float64Array(E), etime: new Float64Array(E), goff: new Int32Array(E + 1), P: new Int32Array(total * 2), bx0: new Int32Array(E), by0: new Int32Array(E),
          bx1: new Int32Array(E), by1: new Int32Array(E), nx: new Int32Array(N), ny: new Int32Array(N), lkind: new Uint8Array(labels.length), exits: {}
        };
        for (i = 0; i < N; i++) { X.nx[i] = nodes[2 * i] * 10; X.ny[i] = nodes[2 * i + 1] * 10; } // the graph keeps 1e-5 degrees so street shapes keep their 1.1 m precision
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
              gx = px + g[j] * 10; gy = py + g[j + 1] * 10; P[o++] = gx; P[o++] = gy; len += hav5(px, py, gx, gy); px = gx; py = gy;
              if (gx < x0) x0 = gx; if (gx > x1) x1 = gx; if (gy < y0) y0 = gy; if (gy > y1) y1 = gy;
            }
            gx = X.nx[b]; gy = X.ny[b]; P[o++] = gx; P[o++] = gy; len += hav5(px, py, gx, gy);
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
            X.adjStart = deg; X.adjArc = adj; X.ndeg = nodeDegrees(X); var tc1 = performance.now(); X.main = runSync(mainComponentGen(X));
            X.timing = { firstPassMs: Math.round(tSync), longestSliceMs: Math.round(tMaxSlice), csrMs: Math.round(tc1 - tc0), sccMs: Math.round(performance.now() - tc1) };
            (Array.isArray(R.exits) ? R.exits : []).forEach(function (x2) { if (x2 && x2[0] >= 0 && x2[0] < N) X.exits[x2[0]] = { ref: String(x2[1] == null ? '' : x2[1]), name: String(x2[2] == null ? '' : x2[2]) }; });
            DS.roads = DS.hroads = X; resolve();
          } catch (err) { reject(err); }
        }
        slice();
      } catch (err) { reject(err); }
    });
  }

  // Largest strongly connected component (iterative Tarjan): the part of the road network you can drive into and out of again.
  // Small one-way-only pockets and islands fall outside it, so the router does not snap to them when a main road is close.
  function nodeDegrees(X) { // number of edge ends at each node (a loop counts twice), at most 255
    var d = new Uint8Array(X.N), i, a, b;
    for (i = 0; i < X.E; i++) { a = X.ea[i]; b = X.eb[i]; if (d[a] < 255) d[a]++; if (d[b] < 255) d[b]++; }
    return d;
  }
  function* mainComponentGen(X) {
    var N = X.N, idx = new Int32Array(N).fill(-1), low = new Int32Array(N), onSt = new Uint8Array(N), stack = new Int32Array(N), call = new Int32Array(N), ptr = new Int32Array(N), comp = new Int32Array(N);
    var counter = 0, sp = 0, nc = 0, sizes = [], s, guard = 0;
    for (s = 0; s < N; s++) {
      if (idx[s] >= 0) continue;
      var cp = 0;
      call[cp++] = s; idx[s] = low[s] = counter++; stack[sp++] = s; onSt[s] = 1; ptr[s] = X.adjStart[s];
      while (cp > 0) {
        if ((++guard & 8191) === 0 && due()) yield;
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

  /* ================= 2b. STREET PACKS: index, saved counties, parsing, merging, downloading ================= */
  // STR: what is known and loaded. recs = parsed chunk files by URL (compact typed arrays, the raw JSON is dropped at once), loaded = counties merged into DS.roads,
  // bad = counties that could not be loaded ('damaged' or 'update'). DL: the download queue. Both live as long as the page, like DS; downloads and loading stop when the screen closes.
  // street maps are held in memory while the map is open (about 5 to 8 times their size): past this much, an older phone can slow down or restart the page
  var BIG_STREETS = 40e6, BIG_NOTE = 'Street maps use the phone’s memory while the map is open. With this many counties the map can run slowly or restart on an older phone. Save only the counties you travel in.';
  var STR = { idx: null, idxState: 'idle', idxP: null, cacheP: null, api: true, recs: {}, loaded: {}, bad: {}, sig: '', failedSig: null, syncing: false, again: false, tok: 0, loading: '', merges: 0, est: null, verified: false, verifying: false, last: null };
  var DL = { per: {}, q: [], active: 0, tok: 0, on: null, say: null, persisted: false, timer: 0 };

  function mp() { // the saved map preferences (S.map), made safe to read
    if (!S.map || typeof S.map !== 'object' || Array.isArray(S.map)) S.map = {};
    if (!S.map.l || typeof S.map.l !== 'object' || Array.isArray(S.map.l)) S.map.l = {};
    return S.map;
  }
  function savedMap() { // S.map.streets = {countyId: {base, n, t}}: entries that are not well formed are dropped
    var p = mp(), s = p.streets;
    if (!s || typeof s !== 'object' || Array.isArray(s)) { p.streets = {}; return p.streets; }
    Object.keys(s).forEach(function (k) {
      var v = s[k];
      if (!/^[a-z0-9-]{1,40}$/.test(k) || !v || typeof v !== 'object' || typeof v.base !== 'string' || !(v.n >= 1 && v.n <= 40 && v.n === Math.floor(v.n)) || !num(v.t)) delete s[k];
    });
    return s;
  }
  function roadsHash() { return NS.meta && NS.meta.roadsHash ? String(NS.meta.roadsHash) : ''; }
  function strHere() { return !!(window.caches && typeof caches.open === 'function' && /^https?:$/.test(location.protocol)); } // not the single-file build, and the browser has a Cache API
  function strUrl(f) { try { return new URL(f, document.baseURI).href; } catch (err) { return f; } }
  function strCache() { // the saved packs; null when the browser refuses (private mode)
    if (!STR.cacheP) STR.cacheP = Promise.resolve().then(function () { return strHere() ? caches.open(STREETS_CACHE) : null; }).catch(function () { return null; }).then(function (c) { if (!c) STR.api = false; return c; });
    return STR.cacheP;
  }
  function strParseIndex(d) {
    if (!d || d.v !== 1 || typeof d.base !== 'string' || !Array.isArray(d.counties)) throw new Error('bad street index');
    var cs = [], by = {}, slug = {};
    d.counties.forEach(function (c) {
      if (!c || typeof c.id !== 'string' || !/^[a-z0-9-]{1,40}$/.test(c.id) || typeof c.name !== 'string' || !Array.isArray(c.bbox) || c.bbox.length !== 4 || !c.bbox.every(num) || !Array.isArray(c.c) || !Array.isArray(c.chunks) || !c.chunks.length || by[c.id]) return;
      var ch = c.chunks.filter(function (k) { return k && typeof k.f === 'string' && /^streets\/[a-z0-9-]+\.json$/.test(k.f) && num(k.b) && k.b > 0; });
      if (ch.length !== c.chunks.length) return;
      var bytes = 0, edges = 0;
      var o = { id: c.id, name: c.name, bbox: c.bbox, cx: num(c.c[0]) ? c.c[0] : (c.bbox[0] + c.bbox[2]) / 2, cy: num(c.c[1]) ? c.c[1] : (c.bbox[1] + c.bbox[3]) / 2, chunks: ch.map(function (k) { bytes += k.b; edges += k.e | 0; return { f: k.f, url: strUrl(k.f), b: k.b, e: k.e | 0 }; }) };
      o.bytes = num(c.bytes) && c.bytes > 0 ? c.bytes : bytes; o.gz = num(c.gz) && c.gz > 0 ? c.gz : Math.round(o.bytes * 0.36); o.edges = num(c.edges) ? c.edges : edges;
      cs.push(o); by[o.id] = o; slug[slugOf(o.name)] = o;
    });
    if (!cs.length) throw new Error('empty street index');
    cs.sort(function (a, b) { return a.name < b.name ? -1 : a.name > b.name ? 1 : 0; });
    STR.idx = { base: d.base, updated: typeof d.updated === 'string' ? d.updated : '', counties: cs, by: by, slug: slug };
  }
  function strLoadIndex() {
    if (STR.idxP) return STR.idxP;
    if (!strHere()) { STR.idxState = 'off'; STR.api = false; return Promise.resolve(); } // single-file build or no Cache API: street maps stay hidden
    STR.idxState = 'loading';
    STR.idxP = loadData(STREETS_INDEX).then(function (d) { strParseIndex(d); STR.idxState = 'ok'; ERR.streets = ''; }, function (err) { STR.idxState = 'err'; ERR.streets = why(err); STR.idxP = null; }).then(function () { notify(); });
    return STR.idxP;
  }
  function strUsable() { return STR.idxState === 'ok' && STR.api !== false; }
  function strStatus(id) { // {s: 'none' | 'saved' | 'update' | 'damaged', loaded}
    var c = STR.idx && STR.idx.by[id], rec = c ? savedMap()[id] : null, hash = roadsHash(), s = 'none';
    if (rec) {
      if (rec.base !== hash || STR.idx.base !== hash || rec.n !== c.chunks.length || STR.bad[id] === 'update') s = 'update';
      else s = STR.bad[id] ? 'damaged' : 'saved';
    }
    return { s: s, loaded: !!STR.loaded[id], rec: rec };
  }
  function strCountyAt(x, y) { // index entry of the county at a point (1e-4 degrees), or null
    if (!STR.idx) return null;
    var n = countyAt(x, y); return n ? STR.idx.slug[slugOf(n)] || null : null;
  }
  function strLoadedAny() { for (var k in STR.loaded) if (STR.loaded[k]) return true; return false; }
  function fmtSz(b) {
    if (b >= 1e9) return (b / 1e9).toFixed(1) + ' GB';
    var mb = b / 1e6;
    if (mb >= 10) return Math.round(mb).toLocaleString('en-US') + ' MB';
    if (mb >= 0.95) return (Math.round(mb * 10) / 10) + ' MB';
    return Math.max(1, Math.round(b / 1e3)) + ' KB';
  }

  // ---- parsing one chunk file into typed arrays (a generator: it yields now and then so the screen stays responsive) ----
  function* strRecGen(p, url) {
    if (!p || p.v !== 1 || !Array.isArray(p.nodes) || (p.nodes.length & 1) || !Array.isArray(p.edges) || !Array.isArray(p.labels) || !Array.isArray(p.ties)) return null;
    var nodes = p.nodes, edges = p.edges, n = nodes.length >> 1, E0 = edges.length, i, j, x = 0, y = 0, dx, dy;
    var nx = new Int32Array(n), ny = new Int32Array(n), bx0 = 2e9, by0 = 2e9, bx1 = -2e9, by1 = -2e9;
    for (i = 0; i < n; i++) {
      dx = nodes[2 * i]; dy = nodes[2 * i + 1];
      if (typeof dx !== 'number' || typeof dy !== 'number') return null;
      x += dx; y += dy; nx[i] = x; ny[i] = y;
      if (x < bx0) bx0 = x; if (x > bx1) bx1 = x; if (y < by0) by0 = y; if (y > by1) by1 = y;
      if ((i & 16383) === 16383 && due()) yield;
    }
    var valid = 0, tp = 0, ed, a, b, c, g;
    for (i = 0; i < E0; i++) {
      ed = edges[i];
      if (ed && ed.length >= 7 && (a = ed[0]) === (a | 0) && a >= 0 && a < n && (b = ed[1]) === (b | 0) && b >= 0 && b < n && (c = ed[2]) >= 2 && c <= 5 && ed[5] > 0 && Array.isArray(g = ed[6]) && !(g.length & 1)) { valid++; tp += g.length >> 1; }
      if ((i & 16383) === 16383 && due()) yield;
    }
    if (valid < E0 - Math.max(5, E0 * 0.01)) return null; // too many broken edges: treat the file as damaged
    var ea = new Int32Array(valid), eb = new Int32Array(valid), ecl = new Uint8Array(valid), efl = new Uint8Array(valid), elab = new Int32Array(valid), elen = new Int32Array(valid);
    var goff = new Int32Array(valid + 1), gp = new Int32Array(tp * 2), k = 0, pos = 0, nl = p.labels.length, px, py, lb;
    for (i = 0; i < E0; i++) {
      ed = edges[i];
      if (!(ed && ed.length >= 7 && (a = ed[0]) === (a | 0) && a >= 0 && a < n && (b = ed[1]) === (b | 0) && b >= 0 && b < n && (c = ed[2]) >= 2 && c <= 5 && ed[5] > 0 && Array.isArray(g = ed[6]) && !(g.length & 1))) continue;
      ea[k] = a; eb[k] = b; ecl[k] = c | 0; efl[k] = ed[3] & 1; lb = ed[4]; elab[k] = lb === (lb | 0) && lb > 0 && lb < nl ? lb : 0; elen[k] = Math.max(1, Math.round(ed[5]));
      px = nx[a]; py = ny[a];
      for (j = 0; j < g.length; j += 2) {
        dx = g[j]; dy = g[j + 1];
        if (typeof dx !== 'number' || typeof dy !== 'number') return null;
        px += dx; py += dy; gp[pos * 2] = px; gp[pos * 2 + 1] = py; pos++;
        if (px < bx0) bx0 = px; if (px > bx1) bx1 = px; if (py < by0) by0 = py; if (py > by1) by1 = py;
      }
      goff[++k] = pos;
      if ((k & 8191) === 0 && due()) yield;
    }
    if (bx0 < -13000000 || bx1 > -11000000 || by0 < 3000000 || by1 > 4400000) return null; // coordinates outside California: a damaged file
    var tn = [], tk = [], t;
    for (i = 0; i < p.ties.length; i++) { t = p.ties[i]; if (t && t.length >= 2 && t[0] === (t[0] | 0) && t[0] >= 0 && t[0] < n && typeof t[1] === 'number' && isFinite(t[1])) { tn.push(t[0]); tk.push(t[1]); } }
    var labels = p.labels.map(function (l) { return typeof l === 'string' ? l.trim().slice(0, 120) : ''; });
    return { url: url, n: n, nx: nx, ny: ny, tn: Int32Array.from(tn), tk: Float64Array.from(tk), E: valid, ea: ea, eb: eb, ecl: ecl, efl: efl, elab: elab, elen: elen, goff: goff, gp: gp, labels: labels, x0: bx0, y0: by0, x1: bx1, y1: by1 };
  }

  // ---- merging the loaded chunks with the highway graph H into one new graph (a generator). H is never changed. ----
  function* strMergeGen(H, recs) {
    var T0 = performance.now(), tm = {}, r, i, k, e, rc, gm, lm;
    // street names: one label id per distinct name, after the highway labels (id 0 means no name)
    var lnames = H.labels.slice(), lmap = new Map(), lmaps = [];
    for (r = 0; r < recs.length; r++) {
      var rl = recs[r].labels; lm = new Int32Array(rl.length);
      for (i = 1; i < rl.length; i++) {
        var nm = rl[i]; if (!nm) continue;
        var id = lmap.get(nm); if (id === undefined) { id = lnames.length; lnames.push(nm); lmap.set(nm, id); }
        lm[i] = id;
      }
      lmaps.push(lm);
      if (due()) yield;
    }
    // nodes: tied to a highway node (use that one), shared with another chunk (use the first chunk's), or new
    var Nh = H.N, total = Nh, gms = [], osm = new Map(), Es = 0, Ps = 0, key, nd, g0;
    for (r = 0; r < recs.length; r++) {
      rc = recs[r]; gm = new Int32Array(rc.n).fill(-1);
      for (i = 0; i < rc.tn.length; i++) {
        key = rc.tk[i]; nd = rc.tn[i];
        if (key >= 0) { if (key < Nh && key === Math.floor(key)) gm[nd] = key; } else { g0 = osm.get(key); if (g0 !== undefined) gm[nd] = g0; }
      }
      for (i = 0; i < rc.n; i++) if (gm[i] < 0) gm[i] = total++;
      for (i = 0; i < rc.tn.length; i++) if (rc.tk[i] < 0 && !osm.has(rc.tk[i])) osm.set(rc.tk[i], gm[rc.tn[i]]);
      gms.push(gm); Es += rc.E; Ps += rc.E * 2 + (rc.gp.length >> 1);
      if (due()) yield;
    }
    var Eh = H.E, E = Eh + Es, N = total, PT = H.goff[Eh] + Ps, L = lnames.length;
    var X = {
      N: N, E: E, Nh: Nh, Eh: Eh, lh: H.lh, H: H, cs: H.cs, exits: H.exits, hgrid: H.hgrid, sgrids: [], labels: lnames, ea: new Int32Array(E), eb: new Int32Array(E), ecl: new Uint8Array(E), efl: new Uint8Array(E),
      elab: new Int32Array(E), elen: new Float64Array(E), etime: new Float64Array(E), goff: new Int32Array(E + 1), P: new Int32Array(PT * 2), bx0: new Int32Array(E), by0: new Int32Array(E), bx1: new Int32Array(E),
      by1: new Int32Array(E), nx: new Int32Array(N), ny: new Int32Array(N), lkind: new Uint8Array(L), lgrp: new Int32Array(L), streetEdges: Es
    };
    X.ea.set(H.ea); X.eb.set(H.eb); X.ecl.set(H.ecl); X.efl.set(H.efl); X.elab.set(H.elab); X.elen.set(H.elen); X.etime.set(H.etime); X.goff.set(H.goff); X.P.set(H.P);
    X.bx0.set(H.bx0); X.by0.set(H.by0); X.bx1.set(H.bx1); X.by1.set(H.by1); X.nx.set(H.nx); X.ny.set(H.ny); X.lkind.set(H.lkind); X.lgrp.set(H.lgrp);
    for (i = H.lh; i < L; i++) { X.lkind[i] = 3; X.lgrp[i] = i; }
    var ea = X.ea, eb = X.eb, ecl = X.ecl, efl = X.efl, elab = X.elab, elen = X.elen, etime = X.etime, goff = X.goff, P = X.P, bx0 = X.bx0, by0 = X.by0, bx1 = X.bx1, by1 = X.by1, nx = X.nx, ny = X.ny;
    tm.setup = performance.now() - T0;
    var ei = Eh, pos = H.goff[Eh], chunkRanges = [], a, b, cl, len, o, x, y, x0, y0, x1, y1, gx, gy, j, je;
    for (r = 0; r < recs.length; r++) {
      rc = recs[r]; gm = gms[r]; lm = lmaps[r];
      for (i = 0; i < rc.n; i++) { g0 = gm[i]; if (g0 >= Nh) { nx[g0] = rc.nx[i]; ny[g0] = rc.ny[i]; } }
      var e0 = ei, gpa = rc.gp, rgo = rc.goff;
      for (k = 0; k < rc.E; k++, ei++) {
        a = gm[rc.ea[k]]; b = gm[rc.eb[k]]; cl = rc.ecl[k] + 2; len = rc.elen[k];
        ea[ei] = a; eb[ei] = b; ecl[ei] = cl; efl[ei] = rc.efl[k]; elab[ei] = lm[rc.elab[k]]; elen[ei] = len; etime[ei] = len / SPD[cl] + ST_JUNC;
        o = pos * 2; x = nx[a]; y = ny[a]; x0 = x1 = x; y0 = y1 = y;
        P[o++] = x; P[o++] = y;
        for (j = rgo[k] * 2, je = rgo[k + 1] * 2; j < je; j += 2) {
          gx = gpa[j]; gy = gpa[j + 1]; P[o++] = gx; P[o++] = gy;
          if (gx < x0) x0 = gx; if (gx > x1) x1 = gx; if (gy < y0) y0 = gy; if (gy > y1) y1 = gy;
        }
        gx = nx[b]; gy = ny[b]; P[o++] = gx; P[o++] = gy;
        if (gx < x0) x0 = gx; if (gx > x1) x1 = gx; if (gy < y0) y0 = gy; if (gy > y1) y1 = gy;
        pos = o >> 1; goff[ei + 1] = pos; bx0[ei] = x0; by0[ei] = y0; bx1[ei] = x1; by1[ei] = y1;
        if ((k & 4095) === 4095 && due()) yield;
      }
      chunkRanges.push([e0, ei]);
    }
    tm.edges = performance.now() - T0;
    // CSR adjacency: arc id = edge * 2 + dir (dir 0 travels a to b, dir 1 travels b to a)
    var deg = new Int32Array(N + 1);
    for (e = 0; e < E; e++) {
      deg[ea[e] + 1]++; if (!efl[e]) deg[eb[e] + 1]++;
      if ((e & 32767) === 32767 && due()) yield;
    }
    for (i = 0; i < N; i++) deg[i + 1] += deg[i];
    var adj = new Int32Array(deg[N]), at = deg.slice(0, N);
    for (e = 0; e < E; e++) {
      adj[at[ea[e]]++] = e * 2; if (!efl[e]) adj[at[eb[e]]++] = e * 2 + 1;
      if ((e & 32767) === 32767 && due()) yield;
    }
    X.adjStart = deg; X.adjArc = adj; X.ndeg = nodeDegrees(X);
    // primary and secondary highway-network roads that meet street junctions (city arterials such as Van Ness Avenue) are driven like city streets, not at open-road speed
    var xd = X.ndeg, hd = H.ndeg, cl2;
    for (e = 0; e < Eh; e++) {
      cl2 = ecl[e];
      if (cl2 >= 2 && (xd[ea[e]] > hd[ea[e]] || xd[eb[e]] > hd[eb[e]])) etime[e] = elen[e] / SPD[cl2 + 2] + ST_JUNC;
    }
    tm.csr = performance.now() - T0;
    // one small grid of edge boxes per chunk file: used for drawing and for finding the street nearest to a point
    for (r = 0; r < chunkRanges.length; r++) {
      var ra = chunkRanges[r], gX0 = 2e9, gY0 = 2e9, gX1 = -2e9, gY1 = -2e9, cs = ST_CELL;
      if (ra[1] <= ra[0]) continue;
      for (e = ra[0]; e < ra[1]; e++) { if (bx0[e] < gX0) gX0 = bx0[e]; if (bx1[e] > gX1) gX1 = bx1[e]; if (by0[e] < gY0) gY0 = by0[e]; if (by1[e] > gY1) gY1 = by1[e]; }
      while (((gX1 - gX0) / cs + 2) * ((gY1 - gY0) / cs + 2) > 2e6) cs *= 2; // a damaged file with a huge area must not make a huge grid
      var cx0 = Math.floor(gX0 / cs), cy0 = Math.floor(gY0 / cs), w = Math.floor(gX1 / cs) - cx0 + 1, h = Math.floor(gY1 / cs) - cy0 + 1, cnt = new Int32Array(w * h + 1), cx, cy, c0, c1, r0, r1;
      for (e = ra[0]; e < ra[1]; e++) {
        c0 = Math.floor(bx0[e] / cs) - cx0; c1 = Math.floor(bx1[e] / cs) - cx0; r0 = Math.floor(by0[e] / cs) - cy0; r1 = Math.floor(by1[e] / cs) - cy0;
        for (cy = r0; cy <= r1; cy++) for (cx = c0; cx <= c1; cx++) cnt[cy * w + cx + 1]++;
        if ((e & 16383) === 16383 && due()) yield;
      }
      for (i = 0; i < w * h; i++) cnt[i + 1] += cnt[i];
      var gat = cnt.slice(0, w * h), glist = new Int32Array(cnt[w * h]);
      for (e = ra[0]; e < ra[1]; e++) {
        c0 = Math.floor(bx0[e] / cs) - cx0; c1 = Math.floor(bx1[e] / cs) - cx0; r0 = Math.floor(by0[e] / cs) - cy0; r1 = Math.floor(by1[e] / cs) - cy0;
        for (cy = r0; cy <= r1; cy++) for (cx = c0; cx <= c1; cx++) glist[gat[cy * w + cx]++] = e;
        if ((e & 16383) === 16383 && due()) yield;
      }
      X.sgrids.push({ cs: cs, x0: cx0, y0: cy0, w: w, h: h, start: cnt, list: glist, bx0: gX0, by0: gY0, bx1: gX1, by1: gY1, e0: ra[0], e1: ra[1] });
    }
    tm.grids = performance.now() - T0;
    // street name to edges (for search)
    var lst = new Int32Array(L + 1), lb2;
    for (e = Eh; e < E; e++) { lb2 = elab[e]; if (lb2) lst[lb2 + 1]++; }
    for (i = 0; i < L; i++) lst[i + 1] += lst[i];
    var lat = lst.slice(0, L), led = new Int32Array(lst[L]);
    for (e = Eh; e < E; e++) { lb2 = elab[e]; if (lb2) led[lat[lb2]++] = e; }
    X.lstart = lst; X.ledge = led;
    tm.labels = performance.now() - T0;
    X.main = yield* mainComponentGen(X);
    tm.scc = performance.now() - T0;
    X.timing = { setupMs: Math.round(tm.setup), edgesMs: Math.round(tm.edges - tm.setup), csrMs: Math.round(tm.csr - tm.edges), gridsMs: Math.round(tm.grids - tm.csr), labelsMs: Math.round(tm.labels - tm.grids), sccMs: Math.round(tm.scc - tm.labels), totalMs: Math.round(tm.scc), counties: recs.length };
    return X;
  }

  // ---- loading the saved counties from the cache (never from the network) and keeping the graph in step with them ----
  function strWant() {
    var idx = STR.idx, rec = savedMap(), hash = roadsHash(), out = [];
    if (!idx || !hash || idx.base !== hash) return out;
    idx.counties.forEach(function (c) { var r = rec[c.id]; if (r && r.base === hash && r.n === c.chunks.length && !STR.bad[c.id]) out.push(c.id); });
    return out;
  }
  function strUnload(id) {
    var c = STR.idx && STR.idx.by[id];
    if (c) c.chunks.forEach(function (ch) { delete STR.recs[ch.url]; });
    STR.loaded[id] = false;
  }
  async function strLoadCounty(id, dead) { // true when every chunk of the county was read from the cache and parsed
    var c = STR.idx.by[id], cache = await strCache(), hash = roadsHash(), i, ch, resp, text, obj, rc;
    function fail(why2) { STR.bad[id] = why2; c.chunks.forEach(function (k) { delete STR.recs[k.url]; }); return false; }
    if (!cache) return false;
    for (i = 0; i < c.chunks.length; i++) {
      ch = c.chunks[i];
      if (STR.recs[ch.url]) continue;
      resp = null; try { resp = await cache.match(ch.url); } catch (err) { resp = null; }
      if (dead()) throw CANCEL;
      if (!resp) return fail('damaged');
      obj = null;
      try { text = await resp.text(); obj = JSON.parse(text); } catch (err) { obj = null; }
      text = '';
      if (dead()) throw CANCEL;
      if (!obj || obj.v !== 1) return fail('damaged');
      if (obj.base !== hash) return fail('update');
      rc = null;
      try { rc = await runSliced(strRecGen(obj, ch.url), dead); } catch (err) { if (err === CANCEL) throw err; rc = null; }
      obj = null;
      if (!rc) return fail('damaged');
      STR.recs[ch.url] = rc;
    }
    return true;
  }
  async function strSyncRun(tok) {
    var dead = function () { return tok !== STR.tok; }, idx = STR.idx, want = strWant(), i, id, t0 = performance.now();
    Object.keys(STR.loaded).forEach(function (k) { if (STR.loaded[k] && want.indexOf(k) < 0) strUnload(k); }); // deleted, or found damaged: free its parsed data
    for (i = 0; i < want.length; i++) {
      id = want[i];
      if (STR.loaded[id]) continue;
      STR.loading = idx.by[id].name + ' County'; notify();
      if (await strLoadCounty(id, dead)) STR.loaded[id] = true;
      if (dead()) throw CANCEL;
    }
    var ids = want.filter(function (k) { return STR.loaded[k]; }).sort(), sig = ids.join(',');
    if (sig !== STR.sig) { // what the live graph holds differs from what should be in it: build the merged graph once for the whole batch
      var recs = [];
      ids.forEach(function (k) { idx.by[k].chunks.forEach(function (ch) { if (STR.recs[ch.url]) recs.push(STR.recs[ch.url]); }); });
      STR.loading = 'merge'; RG = null; notify(); // the routing scratch arrays of the old graph go first, so the old and the new graph are not both in memory with them
      var X = recs.length ? await runSliced(strMergeGen(DS.hroads, recs), dead) : DS.hroads;
      if (dead()) throw CANCEL;
      DS.roads = X; STR.sig = sig; STR.merges++; STR.last = { counties: ids.length, ms: Math.round(performance.now() - t0), timing: X.timing || null, edges: X.streetEdges || 0 };
    }
  }
  function strSync() { // make the live graph match the saved counties; safe to call often
    if (!INST || STR.idxState !== 'ok' || ST.roads !== 'ok' || !roadsHash() || !DS.hroads) return;
    if (STR.syncing) { STR.again = true; return; }
    var wantSig = strWant().sort().join(',');
    if (wantSig === STR.sig || wantSig === STR.failedSig) return;
    STR.syncing = true;
    var tok = STR.tok;
    strSyncRun(tok).then(null, function (err) { if (err !== CANCEL) { if (window.console) console.warn('street maps: loading failed', err); STR.failedSig = wantSig; STR.sig = ''; Object.keys(STR.loaded).forEach(function (k) { if (STR.loaded[k]) strUnload(k); }); DS.roads = DS.hroads; } })
      .then(function () {
        STR.syncing = false; STR.loading = '';
        if (STR.again) { STR.again = false; strSync(); }
        notify();
      });
  }
  // ---- what is really in the cache (run when the street panel opens): flags missing or cut-short files, sweeps files that belong to no saved county ----
  function strVerify() {
    if (STR.verifying || !STR.idx) return Promise.resolve();
    STR.verifying = true;
    return strCache().then(function (c) {
      if (!c) return null;
      return c.keys().then(function (ks) {
        var have = {}, keep = {}, rec = savedMap(), checks = [], busy = {}, dropped = false;
        ks.forEach(function (r) { have[r.url] = 1; });
        Object.keys(rec).forEach(function (k) { if (!STR.idx.by[k]) { delete rec[k]; dropped = true; } }); // a county that is no longer in the list
        if (dropped) App.save();
        Object.keys(DL.per).forEach(function (k) { var d = DL.per[k]; if (d.state === 'queued' || d.state === 'run') busy[k] = 1; });
        STR.idx.counties.forEach(function (cn) {
          if (busy[cn.id]) { cn.chunks.forEach(function (ch) { keep[ch.url] = 1; }); return; }
          var r = rec[cn.id];
          if (!r) return;
          cn.chunks.forEach(function (ch) { keep[ch.url] = 1; });
          if (r.base === roadsHash() && r.n === cn.chunks.length && !STR.bad[cn.id]) {
            cn.chunks.forEach(function (ch) {
              if (!have[ch.url]) STR.bad[cn.id] = 'damaged';
              else checks.push(c.match(ch.url).then(function (resp) { var n = resp ? +resp.headers.get('x-gdg-bytes') : 0; if (!resp || (n > 0 && n < ch.b * 0.5)) STR.bad[cn.id] = 'damaged'; }, function () { STR.bad[cn.id] = 'damaged'; }));
            });
          }
        });
        ks.forEach(function (r) { if (!keep[r.url]) c.delete(r).catch(function () { /* ignore */ }); }); // leftovers of cancelled or replaced downloads
        return Promise.all(checks);
      });
    }).catch(function () { /* ignore */ }).then(function () { STR.verifying = false; STR.verified = true; strEstimate(); strSync(); notify(); });
  }
  function strEstimate() {
    try {
      if (navigator.storage && navigator.storage.estimate) navigator.storage.estimate().then(function (es) { STR.est = { usage: (es && es.usage) || 0, quota: (es && es.quota) || 0 }; if (DL.on) DL.on('state'); }, function () { /* ignore */ });
    } catch (err) { /* ignore */ }
  }
  function strRemoveSaved(id) { // forget a county: its record first (so it never shows as saved), then its files
    var c = STR.idx && STR.idx.by[id];
    delete savedMap()[id]; App.save(); delete STR.bad[id];
    return strCache().then(function (ca) { if (!ca || !c) return null; return Promise.all(c.chunks.map(function (ch) { return ca.delete(ch.url).catch(function () { /* ignore */ }); })); });
  }
  function strDelete(id) { return strRemoveSaved(id).then(function () { strSync(); strEstimate(); notify(); }); }
  function strDeleteAll() {
    var s = savedMap(); Object.keys(s).forEach(function (k) { delete s[k]; }); App.save(); STR.bad = {};
    var done = function () { STR.cacheP = null; strSync(); strEstimate(); notify(); };
    try { if (window.caches && caches.delete) return caches.delete(STREETS_CACHE).then(done, done); } catch (err) { /* ignore */ }
    done(); return Promise.resolve();
  }
  function strSavedBytes() { var t = 0, n = 0, rec = savedMap(); if (STR.idx) STR.idx.counties.forEach(function (c) { if (rec[c.id]) { t += c.bytes; n++; } }); return { bytes: t, n: n }; }

  // ---- downloading: at most ST_FLY requests at once, a retry or two for each file, progress by bytes, everything cancellable ----
  function dlTick(now) {
    if (!DL.on) return;
    if (now) { clearTimeout(DL.timer); DL.timer = 0; DL.on('state'); return; }
    if (!DL.timer) DL.timer = setTimeout(function () { DL.timer = 0; if (DL.on) DL.on('progress'); }, 120);
  }
  function dlMsg(err) {
    var m = String(err && err.message || '');
    if (err && (err.name === 'QuotaExceededError' || err.code === 22 || /quota/i.test(m))) return 'Your phone has no more room for it. Delete another county’s street maps, then try again.';
    if (err && err.http === 404) return 'This county’s street map is not on the server yet.';
    if (err && err.http >= 500) return 'The server had a problem (error ' + err.http + '). Try again later.';
    if (err && err.http) return 'The server said no (error ' + err.http + '). Try again later.';
    if (err && err.kind === 'newer') return 'These street maps are for a newer version of the map. Open the app while online so it can update, then try again.';
    if (err && (err.kind === 'cut' || err.kind === 'bad')) return 'The download arrived damaged. Check your connection and try again.';
    if (err && err.name === 'TypeError' || navigator.onLine === false) return 'No connection. Connect to the internet and try again.';
    return 'Could not download it (' + why(err) + '). Try again.';
  }
  function dlCheck(bytes, task) { // cheap check that the file is whole and was built for this version of the map
    var n = bytes.length, head = '', i, er;
    for (i = 0; i < Math.min(n, 240); i++) head += String.fromCharCode(bytes[i]);
    if (n < 40 || head.indexOf('"v":1') < 0 || head.indexOf('"base":"') < 0) { er = new Error('not a street map file'); er.kind = 'bad'; throw er; }
    if (head.indexOf('"base":"' + roadsHash() + '"') < 0) { er = new Error('built for another map version'); er.kind = 'newer'; throw er; }
    var j = n - 1; while (j > 1 && (bytes[j] === 10 || bytes[j] === 13 || bytes[j] === 32)) j--;
    if (bytes[j] !== 125 || bytes[j - 1] !== 93 || n < task.ch.b * 0.5) { er = new Error('cut short'); er.kind = 'cut'; throw er; }
    if (n < 300000 && typeof TextDecoder === 'function') { try { JSON.parse(new TextDecoder().decode(bytes)); } catch (err2) { er = new Error('not valid JSON'); er.kind = 'bad'; throw er; } }
  }
  function dlFetch(task) {
    var d = DL.per[task.id];
    return fetch(task.ch.url, { cache: 'no-store', credentials: 'same-origin', signal: task.ac ? task.ac.signal : undefined }).then(function (r) {
      if (!r.ok) { var er = new Error('HTTP ' + r.status); er.http = r.status; try { if (r.body && r.body.cancel) r.body.cancel(); } catch (e3) { /* ignore */ } throw er; }
      if (r.body && r.body.getReader) {
        var rd = r.body.getReader(), parts = [], got = 0;
        return (function pump() {
          return rd.read().then(function (x) {
            if (x.done) { var out = new Uint8Array(got), at = 0; parts.forEach(function (p) { out.set(p, at); at += p.length; }); return out; }
            parts.push(x.value); got += x.value.length; task.got += x.value.length; if (d) d.got += x.value.length; dlTick();
            return pump();
          });
        })();
      }
      return r.arrayBuffer().then(function (ab) { task.got += ab.byteLength; if (d) d.got += ab.byteLength; dlTick(); return new Uint8Array(ab); });
    });
  }
  async function dlChunk(task, tok) {
    var d = DL.per[task.id], attempt = 0, bytes;
    for (;;) {
      task.ac = typeof AbortController === 'function' ? new AbortController() : null; task.got = 0;
      try {
        bytes = await dlFetch(task);
        dlCheck(bytes, task);
        var cache = await strCache();
        if (!cache) throw new Error('this browser cannot keep street maps');
        await cache.put(task.ch.url, new Response(bytes, { headers: { 'Content-Type': 'application/json', 'X-Gdg-Bytes': String(bytes.length) } }));
        task.ac = null;
        return;
      } catch (err) {
        if (d) d.got = Math.max(0, d.got - task.got); task.got = 0;
        if (tok !== DL.tok || !d || DL.per[task.id] !== d || d.state === 'cancel' || d.state === 'error') throw CANCEL;
        var quota = err && (err.name === 'QuotaExceededError' || err.code === 22 || /quota/i.test(String(err.message || '')));
        if (quota || (err && (err.http === 404 || (err.http >= 400 && err.http < 500) || err.kind === 'newer')) || attempt >= 2 || navigator.onLine === false) throw err;
        attempt++;
        await sleepMs(attempt === 1 ? 1000 : 3000);
        if (tok !== DL.tok || DL.per[task.id] !== d || d.state === 'cancel' || d.state === 'error') throw CANCEL;
      }
    }
  }
  function dlDropFiles(id) { // delete whatever was stored for a county that did not finish
    var c = STR.idx && STR.idx.by[id];
    strCache().then(function (ca) { if (ca && c) c.chunks.forEach(function (ch) { ca.delete(ch.url).catch(function () { /* ignore */ }); }); });
  }
  function dlFail(id, err) {
    var d = DL.per[id]; if (!d || d.state === 'error' || d.state === 'cancel') return;
    d.state = 'error'; d.msg = dlMsg(err);
    if (DL.say) DL.say('Could not save the street maps for ' + STR.idx.by[id].name + ' County. ' + d.msg);
    DL.q = DL.q.filter(function (t) { return t.id !== id; });
    d.tasks.forEach(function (t) { if (t.ac) { try { t.ac.abort(); } catch (e2) { /* ignore */ } } });
    dlDropFiles(id); dlTick(true);
  }
  function dlFinish(id) {
    var d = DL.per[id], c = STR.idx.by[id];
    savedMap()[id] = { base: roadsHash(), n: c.chunks.length, t: Date.now() }; App.save(); delete STR.bad[id];
    d.state = 'done'; delete STR.loaded[id];
    if (DL.say) DL.say('Street maps for ' + c.name + ' County are saved.');
    setTimeout(function () { if (DL.per[id] === d && d.state === 'done') { delete DL.per[id]; dlTick(true); } }, 1500);
    strSync(); strEstimate(); notify(); dlTick(true);
  }
  function dlPump() {
    while (DL.active < ST_FLY) {
      var ti = -1, i;
      for (i = 0; i < DL.q.length; i++) { var d0 = DL.per[DL.q[i].id]; if (d0 && d0.ready) { ti = i; break; } }
      if (ti < 0) return;
      dlRun(DL.q.splice(ti, 1)[0]);
    }
  }
  function dlRun(task) {
    var d = DL.per[task.id], tok = DL.tok;
    DL.active++; d.state = 'run'; d.tasks.push(task); dlTick(true);
    dlChunk(task, tok).then(function () {
      d.left--;
      if (d.left <= 0 && d.state === 'run' && tok === DL.tok) dlFinish(task.id);
    }, function (err) {
      if (err !== CANCEL && tok === DL.tok) dlFail(task.id, err);
    }).then(function () { if (tok !== DL.tok) return; DL.active--; d.tasks = d.tasks.filter(function (t) { return t !== task; }); dlPump(); });
  }
  function dlStart(ids) { // user tapped Download (or Update, or Save counties on screen)
    if (!strUsable() || !roadsHash() || STR.idx.base !== roadsHash()) return 0;
    var n = 0;
    ids.forEach(function (id) {
      var c = STR.idx.by[id], d = DL.per[id], s = strStatus(id).s;
      if (!c || (d && (d.state === 'queued' || d.state === 'run')) || s === 'saved') return;
      d = DL.per[id] = { state: 'queued', got: 0, total: c.bytes, msg: '', left: c.chunks.length, tasks: [], ready: false };
      c.chunks.forEach(function (ch, k) { DL.q.push({ id: id, k: k, ch: ch, ac: null, got: 0 }); });
      n++;
      var tok = DL.tok;
      (s === 'none' ? Promise.resolve() : strRemoveSaved(id)).then(function () { if (tok === DL.tok && DL.per[id] === d && d.state === 'queued') { d.ready = true; dlPump(); } }); // a stale or damaged copy goes first, so the service worker cannot hand it back
    });
    if (n && !DL.persisted) { DL.persisted = true; try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist().then(null, function () { /* best effort */ }); } catch (err) { /* ignore */ } }
    if (n) strSync();
    dlTick(true);
    return n;
  }
  function dlCancel(id) {
    var d = DL.per[id]; if (!d) return;
    var active = d.state === 'queued' || d.state === 'run';
    d.state = 'cancel';
    DL.q = DL.q.filter(function (t) { return t.id !== id; });
    (d.tasks || []).forEach(function (t) { if (t.ac) { try { t.ac.abort(); } catch (e2) { /* ignore */ } } });
    delete DL.per[id];
    if (active) dlDropFiles(id);
    dlTick(true);
  }
  function dlAbortAll() { // the screen closed: stop every request and remove what was half saved
    Object.keys(DL.per).forEach(function (id) { dlCancel(id); });
    DL.tok++; DL.q.length = 0; DL.per = {}; DL.active = 0; DL.on = null; DL.say = null; clearTimeout(DL.timer); DL.timer = 0;
  }
  function dlBusy() { return Object.keys(DL.per).some(function (k) { return DL.per[k].state === 'queued' || DL.per[k].state === 'run'; }); }

  /* ================= 3. SPATIAL LOOKUP: counties, projection ================= */
  var MY0 = 300000, MYN = 140001, MYT = null; // Mercator y lookup for integer latitudes 30.0000 to 44.0000 degrees
  function mercN(latDeg) { var s = Math.sin(latDeg * RAD); return 0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI); }
  function initMerc() { if (MYT) return; MYT = new Float64Array(MYN); for (var i = 0; i < MYN; i++) MYT[i] = mercN((MY0 + i) * 1e-4); }
  function nxOf(X) { return (X + 1800000) / 3600000; }
  function nyOf(Y) { // Y in 1e-4 degrees, whole or fractional (street points and pins have a finer position): the table is interpolated
    var t = Y - MY0, i = Math.floor(t);
    return i >= 0 && i < MYN - 1 ? MYT[i] + (MYT[i + 1] - MYT[i]) * (t - i) : mercN(Y * 1e-4);
  }
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
  // the grid over the highway edges (the first Eh edges), cell 0.05 degrees; shared by every graph built from the same highway network
  function rtGrid() {
    var G = rtInit(); if (G.grid) return G.grid;
    var R = DS.roads, H = R.H || R;
    if (!H.hgrid) H.hgrid = buildHGrid(H);
    R.hgrid = H.hgrid; G.grid = H.hgrid;
    return G.grid;
  }
  function buildHGrid(R) {
    var cs = 5000, E = R.Eh, i, minX = 1e9, minY = 1e9, maxX = -1e9, maxY = -1e9;
    for (i = 0; i < E; i++) { if (R.bx0[i] < minX) minX = R.bx0[i]; if (R.bx1[i] > maxX) maxX = R.bx1[i]; if (R.by0[i] < minY) minY = R.by0[i]; if (R.by1[i] > maxY) maxY = R.by1[i]; }
    if (!E) { minX = minY = 0; maxX = maxY = 1; }
    var x0 = Math.floor(minX / cs), y0 = Math.floor(minY / cs), w = Math.floor(maxX / cs) - x0 + 1, h = Math.floor(maxY / cs) - y0 + 1;
    var cnt = new Int32Array(w * h + 1), cx, cy;
    for (i = 0; i < E; i++) for (cy = Math.floor(R.by0[i] / cs) - y0; cy <= Math.floor(R.by1[i] / cs) - y0; cy++) for (cx = Math.floor(R.bx0[i] / cs) - x0; cx <= Math.floor(R.bx1[i] / cs) - x0; cx++) cnt[cy * w + cx + 1]++;
    for (i = 0; i < w * h; i++) cnt[i + 1] += cnt[i];
    var at = cnt.slice(0, w * h), list = new Int32Array(cnt[w * h]);
    for (i = 0; i < E; i++) for (cy = Math.floor(R.by0[i] / cs) - y0; cy <= Math.floor(R.by1[i] / cs) - y0; cy++) for (cx = Math.floor(R.bx0[i] / cs) - x0; cx <= Math.floor(R.bx1[i] / cs) - x0; cx++) list[at[cy * w + cx]++] = i;
    return { cs: cs, x0: x0, y0: y0, w: w, h: h, start: cnt, list: list };
  }
  var SN = { t: 0, sx: 0, sy: 0 };
  // distance in meters from query to the polyline of edge e; also sets SN (position along the edge in meters and the snapped point). Coordinates are graph units (1e-5 degrees);
  // mx and my are meters per unit.
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
  // Where street packs are loaded and a street is among the nearest roads, the window shrinks to best + 700 m (streets are dense, so the 24 candidates are the nearest streets and
  // a freeway a kilometer away is not one of them). Takes 1e-4 degree coordinates; the points it returns are 1e-4 degree floats.
  function snapPoint(qx4, qy4, maxM) {
    var G = rtInit(), g = rtGrid(), R = DS.roads, qx = qx4 * 10, qy = qy4 * 10, mx = 1.1132 * Math.cos(qy * 1e-5 * RAD), my = 1.10574;
    var cellM = Math.min(g.cs * mx, g.cs * my), qcx = Math.floor(qx / g.cs) - g.x0, qcy = Math.floor(qy / g.cs) - g.y0;
    G.sstamp++;
    var stp = G.sstamp, seen = G.seen, all = [], bestMain = Infinity, bestAll = Infinity, bestStreet = Infinity, limit = maxM || 90000, Eh = R.Eh;
    function take(ei) {
      if (seen[ei] === stp) return;
      seen[ei] = stp;
      var d = polyDist(ei, qx, qy, mx, my), pd = d + snapPenalty(ei), isMain = !!(R.main[R.ea[ei]] && R.main[R.eb[ei]]);
      all.push({ e: ei, d: d, pd: pd, t: SN.t, sx: SN.sx, sy: SN.sy, main: isMain });
      if (pd < bestAll) bestAll = pd;
      if (isMain && pd < bestMain) bestMain = pd;
      if (isMain && ei >= Eh && pd < bestStreet) bestStreet = pd;
    }
    for (var r = 0; ; r++) {
      for (var cy = qcy - r; cy <= qcy + r; cy++) {
        if (cy < 0 || cy >= g.h) continue;
        var full = cy === qcy - r || cy === qcy + r;
        for (var cx = qcx - r; cx <= qcx + r; cx += full ? 1 : 2 * r) {
          if (cx < 0 || cx >= g.w) continue;
          for (var a = g.start[cy * g.w + cx], b = g.start[cy * g.w + cx + 1]; a < b; a++) take(g.list[a]);
        }
      }
      if ((bestMain < Infinity && bestMain + 2500 <= r * cellM) || r * cellM > limit || r > g.w + g.h) break;
    }
    if (R.sgrids.length) { // street packs: look in a growing circle until the nearest main street and its neighbors (within 700 m) are all in
      for (var rad = 300; ; rad = rad < 750 ? 750 : rad < 1900 ? 1900 : rad < 4800 ? 4800 : 8000) {
        scanStreets(R, qx, qy, mx, my, rad, take);
        if (bestStreet < Infinity && Math.min(bestStreet, bestMain) + 700 <= rad) break;
        if (rad >= 8000) break;
      }
    }
    if (!all.length) return [];
    var useMain = bestMain < Infinity && bestMain <= bestAll + 5000, base = useMain ? bestMain : bestAll;
    var extra = bestStreet < Infinity && bestStreet <= base + 700 ? Math.max(60, base * 0.6) : 2500; // in street areas: stay on the street nearest to the point (and its neighbors)
    var cands = all.filter(function (c) { return (!useMain || c.main) && c.pd <= base + extra && c.d <= limit; }).sort(function (p, q) { return p.pd - q.pd; });
    cands = cands.slice(0, 24);
    cands.forEach(function (c) { c.sx /= 10; c.sy /= 10; });
    return cands;
  }
  function scanStreets(R, qx, qy, mx, my, rad, take) { // offers every street edge near (qx, qy) within rad meters to take()
    var dx = rad / mx, dy = rad / my, wx0 = qx - dx, wx1 = qx + dx, wy0 = qy - dy, wy1 = qy + dy, r2 = rad * rad, bx0 = R.bx0, by0 = R.by0, bx1 = R.bx1, by1 = R.by1;
    for (var gi = 0; gi < R.sgrids.length; gi++) {
      var g = R.sgrids[gi];
      if (wx1 < g.bx0 || wx0 > g.bx1 || wy1 < g.by0 || wy0 > g.by1) continue;
      var c0 = Math.max(0, Math.floor(wx0 / g.cs) - g.x0), c1 = Math.min(g.w - 1, Math.floor(wx1 / g.cs) - g.x0), r0 = Math.max(0, Math.floor(wy0 / g.cs) - g.y0), r1 = Math.min(g.h - 1, Math.floor(wy1 / g.cs) - g.y0);
      for (var cy = r0; cy <= r1; cy++) for (var cx = c0; cx <= c1; cx++) {
        for (var a = g.start[cy * g.w + cx], b = g.start[cy * g.w + cx + 1]; a < b; a++) {
          var ei = g.list[a], ddx = Math.max(bx0[ei] - qx, 0, qx - bx1[ei]) * mx, ddy = Math.max(by0[ei] - qy, 0, qy - by1[ei]) * my;
          if (ddx * ddx + ddy * ddy <= r2) take(ei);
        }
      }
    }
  }

  // points (flat x,y numbers, in 1e-4 degree floats) of edge ei between positions t0 and t1 (meters along the edge from node a); order follows t0 -> t1
  function sliceEdge(ei, t0, t1, out) {
    var R = DS.roads, P = R.P, i0 = R.goff[ei] * 2, i1 = R.goff[ei + 1] * 2, np = (i1 - i0) >> 1, i;
    var mx = 1.1132 * Math.cos(P[i0 + 1] * 1e-5 * RAD), my = 1.10574, cum = new Float64Array(np), tot = 0;
    for (i = 1; i < np; i++) { tot += Math.sqrt(Math.pow((P[i0 + 2 * i] - P[i0 + 2 * i - 2]) * mx, 2) + Math.pow((P[i0 + 2 * i + 1] - P[i0 + 2 * i - 1]) * my, 2)); cum[i] = tot; }
    var sc = tot > 0 ? R.elen[ei] / tot : 0;
    for (i = 0; i < np; i++) cum[i] *= sc;
    function at(t) {
      var j = 1; while (j < np - 1 && cum[j] < t) j++;
      var s0 = cum[j - 1], s1 = cum[j], u = s1 > s0 ? clamp((t - s0) / (s1 - s0), 0, 1) : 0;
      return [P[i0 + 2 * (j - 1)] + u * (P[i0 + 2 * j] - P[i0 + 2 * (j - 1)]), P[i0 + 2 * (j - 1) + 1] + u * (P[i0 + 2 * j + 1] - P[i0 + 2 * (j - 1) + 1])];
    }
    var fwd = t0 <= t1, lo = Math.min(t0, t1), hi = Math.max(t0, t1), pts = [], a = at(lo), b = at(hi);
    pts.push(a[0] / 10, a[1] / 10);
    for (i = 1; i < np - 1; i++) if (cum[i] > lo && cum[i] < hi) pts.push(P[i0 + 2 * i] / 10, P[i0 + 2 * i + 1] / 10);
    pts.push(b[0] / 10, b[1] / 10);
    if (!fwd) { var rv = []; for (i = pts.length - 2; i >= 0; i -= 2) rv.push(pts[i], pts[i + 1]); pts = rv; }
    var skip = out.length >= 2 && Math.abs(out[out.length - 2] - pts[0]) < 0.05 && Math.abs(out[out.length - 1] - pts[1]) < 0.05 ? 2 : 0;
    for (i = skip; i < pts.length; i++) out.push(pts[i]);
  }

  // A*: starts and goals are snapped candidates. Returns {cost, seed:[si,side], node, goal:[ki,side]} or {cost, direct:[si,ki]} or null.
  function aStar(starts, goals, gx, gy) {
    var G = rtInit(), R = DS.roads, run = ++G.run, best = Infinity, bestNode = -1, direct = null, i, j;
    G.hs = 0;
    var slack = 60; goals.forEach(function (c) { if (c.d > slack) slack = c.d; });
    var gcos = Math.cos(gy * 1e-4 * RAD), gx5 = gx * 10, gy5 = gy * 10; // the goal comes in 1e-4 degrees, the graph is in 1e-5
    function h(n) {
      var dx = (R.nx[n] - gx5) * 1.1132 * gcos, dy = (R.ny[n] - gy5) * 1.10574, d = Math.sqrt(dx * dx + dy * dy) - slack;
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
  function streetsAt(x, y) { // are street maps loaded for the county at this point (1e-4 degrees)?
    var c = strCountyAt(x, y);
    return !!(c && ('|' + STR.sig.split(',').join('|') + '|').indexOf('|' + c.id + '|') >= 0);
  }
  function streetHint(x, y, d) { // for a start or end far from any road: the county, if its street maps are not saved, we are online, and saving them is possible
    if (d < 160 || !strUsable() || navigator.onLine === false || !STR.idx || STR.idx.base !== roadsHash()) return null;
    var c = strCountyAt(x, y);
    return c && strStatus(c.id).s === 'none' ? { id: c.id, name: c.name } : null;
  }
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
    var pts = [], dist = 0, time = 0, streets = false;
    pieces.forEach(function (p) {
      p.pi0 = pts.length >> 1; sliceEdge(p.e, p.t0, p.t1, pts); p.pi1 = pts.length >> 1;
      var cl = R.ecl[p.e];
      p.time = R.elen[p.e] > 0 ? p.len * (R.etime[p.e] / R.elen[p.e]) : p.len / SPD[cl];
      if (cl >= 4 && R.elen[p.e] > 0) p.time += ST_STOP * Math.min(1, p.len / R.elen[p.e]);
      dist += p.len; time += p.time;
      if (cl >= 4) streets = true;
    });
    var steps = makeSteps(pieces, pts);
    return {
      ok: true, from: from, to: to, pts: pts, pieces: pieces, steps: steps, dist: dist, time: time, ms: ms, mode: res.direct ? 'direct' : 'graph', streets: streets,
      a: { d: sCand.d, sx: sCand.sx, sy: sCand.sy }, b: { d: gCand.d, sx: gCand.sx, sy: gCand.sy },
      cov: { a: sCand.e >= R.Eh || streetsAt(from.x, from.y), b: gCand.e >= R.Eh || streetsAt(to.x, to.y) }, hint: { a: streetHint(from.x, from.y, sCand.d), b: streetHint(to.x, to.y, gCand.d) },
      firstRoad: steps.length ? steps[0].label : '', lastRoad: steps.length ? steps[steps.length - 1].label : ''
    };
  }

  // heading in degrees of the last `win` meters of the route ahead of point j, and of the first `win` meters after it (null when there is no length)
  function headBefore(pts, j, win) {
    var k = j, acc = 0;
    while (k > 0 && acc < win) { acc += hav(pts[k * 2 - 2], pts[k * 2 - 1], pts[k * 2], pts[k * 2 + 1]); k--; }
    return k === j || acc < 1 ? null : brg(pts[k * 2], pts[k * 2 + 1], pts[j * 2], pts[j * 2 + 1]);
  }
  function headAfter(pts, j, win) {
    var n = pts.length >> 1, k = j, acc = 0;
    while (k < n - 1 && acc < win) { acc += hav(pts[k * 2], pts[k * 2 + 1], pts[k * 2 + 2], pts[k * 2 + 3]); k++; }
    return k === j || acc < 1 ? null : brg(pts[j * 2], pts[j * 2 + 1], pts[k * 2], pts[k * 2 + 1]);
  }
  function turnAt(pts, j) { // signed turn in degrees at route point j, positive to the right; null when the route has no length on one side
    if (j < 0) return null;
    var a = headBefore(pts, j, 30), b = headAfter(pts, j, 30);
    return a === null || b === null ? null : ((b - a + 540) % 360) - 180;
  }

  // merge consecutive pieces that share a label; unlabeled highway ramps and links join the next labeled step.
  // Street pieces (merged class 4 and up) also start a new step where the street itself bends sharply at a junction.
  function makeSteps(pieces, pts) {
    var R = DS.roads, steps = [], cur = null, pend = [], i;
    pieces.forEach(function (p) {
      var li = R.elab[p.e], L = R.labels[li] || '', st = R.ecl[p.e] >= 4, grp = L ? R.lgrp[li] : -2;
      if (!L && !st) { pend.push(p); return; }
      if (cur && cur.grp === grp && cur.st === st) {
        if (st && L && p.pi0 > 0 && p.node0 >= 0) { // the same street bends at a junction: a new step, but only after a real stretch (a short jog does not count)
          var t = turnAt(pts, p.pi0 - 1), cd = 0;
          cur.pieces.forEach(function (q2) { cd += q2.len; });
          if (t !== null && cd >= 60 && (Math.abs(t) >= 50 || (Math.abs(t) >= 25 && R.ndeg[p.node0] >= 3))) { cur = { label: L, grp: grp, st: true, same: true, pieces: [p] }; steps.push(cur); return; }
        }
        cur.pieces = cur.pieces.concat(pend, [p]); pend = []; return;
      }
      cur = { label: L, grp: grp, st: st, pieces: pend.concat([p]) }; pend = []; steps.push(cur);
    });
    if (pend.length) { if (cur) cur.pieces = cur.pieces.concat(pend); else steps.push({ label: '', grp: -1, st: false, pieces: pend }); }
    function total(s) { s.dist = 0; s.time = 0; s.pieces.forEach(function (p) { s.dist += p.len; s.time += p.time; }); }
    steps.forEach(total);
    // very short highway steps (a few hundred meters of a different road) are noise: fold them into the step before, and rejoin equal neighbors. A tiny unnamed street step folds too.
    for (i = 1; i < steps.length;) {
      var s = steps[i], pv = steps[i - 1];
      if (!s.st && !pv.st && s.dist < 800) {
        pv.pieces = pv.pieces.concat(s.pieces); total(pv); steps.splice(i, 1);
        if (i < steps.length && steps[i].grp === pv.grp && steps[i].st === pv.st) { pv.pieces = pv.pieces.concat(steps[i].pieces); total(pv); steps.splice(i, 1); }
      } else if (s.st && ((!s.label && s.dist < 25) || (s.same && s.dist < 30))) { pv.pieces = pv.pieces.concat(s.pieces); total(pv); steps.splice(i, 1); }
      else if (s.st && s.dist < 20 && i < steps.length - 1 && steps[i + 1].st) { steps[i + 1].pieces = s.pieces.concat(steps[i + 1].pieces); total(steps[i + 1]); steps.splice(i, 1); if (steps[i].grp === pv.grp && pv.st && pv.label) { pv.pieces = pv.pieces.concat(steps[i].pieces); total(pv); steps.splice(i, 1); } } // a jog of a few meters at a junction: the next step starts where it began (and rejoins the step before when it is the same street)
      else i++;
    }
    var out = [];
    steps.forEach(function (s) {
      var first = s.pieces[0], last = s.pieces[s.pieces.length - 1];
      var base = { label: s.label.replace(/\s+EXPR$/i, ''), node: first.node0, pi0: first.pi0, pi1: last.pi1, dist: s.dist, time: s.time, cont: false, st: s.st, same: !!s.same };
      if (s.st) out.push(base); else splitLong(base, pts, out);
    });
    var cum = 0;
    out.forEach(function (s, idx) {
      s.bearing = stepBearing(s, pts, s.st ? 120 : 2000);
      s.turn = idx > 0 && !s.cont && s.pi0 > 0 ? turnAt(pts, s.pi0 - 1) : null;
      s.exit = s.st ? '' : exitText(s.node);
      cum += s.dist; s.cum = cum;
    });
    return out;
  }
  function stepBearing(s, pts, win) {
    var x0 = pts[s.pi0 * 2], y0 = pts[s.pi0 * 2 + 1], acc = 0, j = s.pi0 + 1;
    for (; j < s.pi1; j++) { acc += hav(pts[j * 2 - 2], pts[j * 2 - 1], pts[j * 2], pts[j * 2 + 1]); if (acc >= (win || 2000)) break; }
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
          out.push({ label: s.label, node: first ? s.node : -1, pi0: start, pi1: s.pi0 + j + 1, dist: acc * scale, time: acc * tscale, cont: !first, st: false });
          start = s.pi0 + j; used += acc; acc = 0; first = false; ref = ahead;
        }
      }
    }
    out.push({ label: s.label, node: first ? s.node : -1, pi0: start, pi1: s.pi1, dist: (L - used) * scale, time: (L - used) * tscale, cont: !first, st: false });
  }
  function exitText(node) {
    var R = DS.roads, x = node >= 0 && R && node < R.Nh ? R.exits[node] : null;
    if (!x) return '';
    if (x.ref) return x.name ? 'Exit ' + x.ref + ' (' + x.name + ')' : 'Exit ' + x.ref;
    return x.name ? 'the exit for ' + x.name : '';
  }
  // a step along streets: heading words from the bearings before and after the junction
  function streetText(s, i) {
    var road = s.label, dist = fmtDist(s.dist), t = s.turn;
    if (i === 0) return 'Head ' + c8w(s.bearing) + (road ? ' on ' + road + ' for ' : ' for ') + dist + (road ? '' : ' (no name on the map)') + '.';
    var a = t === null ? 0 : Math.abs(t), side = t > 0 ? 'right' : 'left', verb;
    if (a < 20) return road ? 'Continue onto ' + road + ', then go ' + dist + '.' : 'Continue for ' + dist + '.';
    verb = a >= 160 ? 'Make a U-turn' : a > 135 ? 'Sharp ' + side : a >= 60 ? 'Turn ' + side : 'Bear ' + side;
    return verb + (road ? (s.same ? ' to stay on ' : ' onto ') + road : ' (no name on the map)') + ', then go ' + dist + '.';
  }
  function stepText(s, i, route) {
    if (s.st) return streetText(s, i);
    var road = s.label || 'the road', dw = dirWord(s.bearing), dist = fmtDist(s.dist), joined = i === 0 && route.a.d >= 160;
    var verb = s.cont ? 'Continue on' : i === 0 ? (joined ? 'Join' : 'Start on') : 'Take';
    var core = verb + ' ' + road + ' ' + dw + ' for ' + dist;
    var ex = s.cont ? '' : (s.exit !== undefined ? s.exit : exitText(s.node));
    return ex ? 'At ' + ex + ', ' + core.charAt(0).toLowerCase() + core.slice(1) + '.' : core + '.';
  }
  function offText(route, side) { // the note for a start or end that is far from any mapped road
    var a = side === 'a', d = route[side].d, mapped = route.streets || route.cov.a || route.cov.b, hint = route.hint[side];
    var road = a ? (route.firstRoad || (mapped ? 'the nearest road' : 'the nearest highway')) : (route.lastRoad || (mapped ? 'the road' : 'the highway'));
    return (mapped ? 'Off the mapped roads' : 'Off the highway network') + ': about ' + fmtDist(d) + (a ? ' straight-line to ' + road : ' straight-line from ' + road + ' to ' + (route.to.name || 'your destination')) + '. ' +
      (route.cov[side] ? OFFNET_ST : OFFNET) + (hint ? ' Save street maps for ' + hint.name + ' County for street-level directions.' : '');
  }
  // all text lines of a route (used by the panel, Copy, Print and Share)
  function routeLines(route) {
    var lines = [];
    if (route.a.d >= 160) lines.push({ off: true, text: offText(route, 'a'), meta: '' });
    route.steps.forEach(function (s, i) { lines.push({ off: false, text: stepText(s, i, route), meta: 'Total so far: ' + fmtDist(s.cum) }); });
    if (route.b.d >= 160) lines.push({ off: true, text: offText(route, 'b'), meta: '' });
    lines.push({ off: false, arrive: true, text: 'Arrive at ' + (route.to.name || 'your destination') + '.', meta: '' });
    return lines;
  }
  function routeText(route) {
    var t = 'Grid Down Guide: ' + (route.streets ? 'directions' : 'highway directions') + '\nFrom: ' + route.from.name + '\nTo: ' + route.to.name + '\n' + (route.streets ? 'Distance: ' : 'Highway distance: ') + fmtBoth(route.dist) + '\nEstimated driving time: about ' + fmtTime(route.time) +
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
    streetResults(toks, refx, refy).forEach(function (o) { out.push(o); });
    out.sort(function (a, b) { for (var k = 0; k < 5; k++) { if (a.k[k] !== b.k[k]) return a.k[k] - b.k[k]; } return 0; });
    return out.slice(0, 30);
  }

  /* Street names of the loaded packs: a second list (one entry per distinct name), built in chunks after each merge. A result is the name plus the
     edge of that street nearest to the map center, so tapping it goes to the closest one. House numbers are not in the data: a leading number is ignored. */
  var SS = { R: null, n: 0, norm: [], lab: [], building: false };
  function ensureStreetIndex(cb) {
    var R = DS.roads;
    if (SS.R === R) return;
    SS.R = R; SS.norm = []; SS.lab = []; SS.n = 0; SS.building = false;
    if (!R || !R.sgrids || !R.sgrids.length) return;
    var j = R.lh, L = R.labels.length;
    SS.building = true;
    (function chunk() {
      if (SS.R !== R) return; // the graph changed: a newer build took over
      var t0 = Date.now();
      while (j < L && Date.now() - t0 < 8) { SS.norm.push(' ' + fold(R.labels[j])); SS.lab.push(j); j++; }
      SS.n = SS.norm.length;
      if (j < L) { setTimeout(chunk, 0); return; }
      SS.building = false;
      if (cb) cb();
    })();
  }
  function edgeMid(R, e, out) { // the middle of an edge's shape, in 1e-4 degree floats
    var i0 = R.goff[e] * 2, np = (R.goff[e + 1] * 2 - i0) >> 1, m = ((np - 1) >> 1) * 2;
    out[0] = (R.P[i0 + m] + R.P[i0 + m + 2]) * 0.05; out[1] = (R.P[i0 + m + 1] + R.P[i0 + m + 3]) * 0.05;
  }
  var EM = [0, 0];
  function nearestStreet(lab, refx, refy) { // the edge of street name `lab` closest to a point (1e-4 degrees), or null
    var R = DS.roads, a = R.lstart[lab], b = R.lstart[lab + 1];
    if (!(b > a)) return null;
    var cosl = Math.cos(refy * 1e-4 * RAD), best = Infinity, be = -1, bx = 0, by = 0, step = Math.max(1, Math.floor((b - a) / 4000)), k;
    for (k = a; k < b; k += step) {
      var e2 = R.ledge[k]; edgeMid(R, e2, EM);
      var dx = (EM[0] - refx) * cosl, dy = EM[1] - refy, d2 = dx * dx + dy * dy;
      if (d2 < best) { best = d2; be = e2; bx = EM[0]; by = EM[1]; }
    }
    return be < 0 ? null : { e: be, x: bx, y: by, d: hav(bx, by, refx, refy) };
  }
  function streetMatches(toks) { // up to 160 matching names: exact ones first, then names that start with the words, then the rest (in list order when there are many)
    var buckets = [[], [], []], i, t, n = SS.n, norm = SS.norm, needles = toks.map(function (x) { return ' ' + x; }), exact = ' ' + toks.join(' '), first = needles[0], nt = needles.length, taken = 0;
    for (i = 0; i < n && taken < 4000; i++) {
      var s = norm[i], ok = true;
      for (t = 0; t < nt; t++) if (s.indexOf(needles[t]) < 0) { ok = false; break; }
      if (ok) { buckets[s === exact ? 0 : s.indexOf(first) === 0 ? 1 : 2].push({ lab: SS.lab[i], q: s === exact ? 0 : s.indexOf(first) === 0 ? 1 : 2, len: s.length }); taken++; }
    }
    var out = [];
    for (t = 0; t < 3 && out.length < 160; t++) {
      if (buckets[t].length > 400) buckets[t].length = 400;
      buckets[t].sort(function (a, b) { return a.len - b.len; });
      out = out.concat(buckets[t]);
    }
    return out;
  }
  function streetResults(toks, refx, refy) {
    var R = DS.roads, res = [];
    if (!SS.n || SS.R !== R) return res;
    var m = streetMatches(toks), hn = false;
    if (!m.length && toks.length > 1 && /^[0-9]+[a-z]?$/.test(toks[0])) { m = streetMatches(toks.slice(1)); hn = m.length > 0; }
    m.slice(0, 60).forEach(function (c) {
      var ns = nearestStreet(c.lab, refx, refy);
      if (ns) res.push({ s: true, i: -1, lab: c.lab, q: c.q, x: ns.x, y: ns.y, hn: hn, k: [0, Math.min(c.q, 2), 5, 0, ns.d] });
    });
    return res;
  }
  function nearestPlaceName(x, y) { // the closest named place (within about 20 km) to a point, for the hint under a street result
    var P = DS.places; if (!P) return '';
    var cosl = Math.cos(y * 1e-4 * RAD), best = Infinity, bi = -1, i;
    for (i = 0; i < P.n; i++) { var dx = (P.x[i] - x) * cosl, dy = P.y[i] - y, d2 = dx * dx + dy * dy; if (d2 < best) { best = d2; bi = i; } }
    return bi >= 0 && best < 1800 * 1800 ? P.name[bi] : '';
  }

  /* ================= 7. THE SCREEN ================= */
  var INST = null;
  var vsc = 0, vkx = 0, vkf = 0, vox = 0, voy = 0, vx0 = 0, vx1 = 0, vy0 = 0, vy1 = 0, rx0 = 0, rx1 = 0, ry0 = 0, ry1 = 0; // view transform of the frame being drawn (rx0 to ry1: the same view box in the graph's 1e-5 degree units)
  function pxOf(X) { return X * vkx + vox; }
  function pyOf(Y) { // Y in 1e-4 degrees, whole or fractional (whole values give exactly the table value)
    var t = Y - MY0, i = Math.floor(t);
    return (i >= 0 && i < MYN - 1 ? MYT[i] + (MYT[i + 1] - MYT[i]) * (t - i) : mercN(Y * 1e-4)) * vsc + voy;
  }
  var PAL_KEYS = ['ocean', 'land', 'nbr', 'nbrLine', 'county', 'state', 'lake', 'river', 'rd0', 'rd0c', 'rd1', 'rd1c', 'rd2', 'rd2c', 'rd3', 'rd3c', 'st', 'stc', 'stl', 'text', 'halo', 'muted', 'countyText', 'route', 'routeC', 'me', 'sel', 'a', 'b', 'badgeLine', 'shield', 'shieldT', 'shield2', 'shield2T', 'shield2L'];
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
      '<div class="gm-status" id="gm-status" role="status"></div><div class="gm-banner" id="gm-banner" hidden></div></div>' +
      '<div class="gm-results" id="gm-results" hidden></div>' +
      '<div class="gm-ctrl"><button class="gm-btn gm-satbtn" id="gm-sat" data-gm="sat" aria-label="Switch to satellite pictures"><span class="gm-satic" id="gm-sat-i">' + SAT_ICON_GLOBE + '</span><span class="t" id="gm-sat-t">Satellite</span></button><button class="gm-btn" data-gm="zin" aria-label="Zoom in">+</button><button class="gm-btn" data-gm="zout" aria-label="Zoom out">−</button><button class="gm-btn small" data-gm="fit" aria-label="Show all of California">CA</button></div>' +
      '<div class="gm-strip"><div class="gm-scale"><span class="gm-scalebar" id="gm-sb"></span><span id="gm-sl"></span></div><div class="gm-coords" id="gm-cc"></div><div class="gm-attr">' + e(ATTRIBUTION) + '</div><div class="gm-attr" id="gm-attr2" hidden>' + e(SAT_ATTR) + '</div></div>' +
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
    var ctx = null, W = 0, H = 0, dpr = 1, zMin = Z_MIN, zMax = Z_MAX, inited = false;
    var cam = { cx: 0.5, cy: 0.5, z: 5.5 };
    var dirty = false, raf = 0, anim = null, inertia = null, hits = [], PAL = null, PALN = null, PALS = null, palKey = '', SPR = {}, LC = [], wc = [{}, {}, {}, {}], lcand = [], ptrs = [], g = {}, lastTap = null, sbSig = '', chipSig = '', lastCC = '';
    var perf = { frames: 0, total: 0, max: 0, last: 0, sync: false, route: 0, renders: 0, baseMs: 0, parts: null };
    var st = { sel: null, start: null, end: null, pick: '', mode: '', route: null, routing: false, me: null, watch: null, geoBusy: false, tall: false, nearType: '', nearList: [], results: [], dlg: '', stHi: '', stQ: '', stConf: '', stBulk: null, stScreen: [], stNear: [], stHide: {}, stc: null, stcSig: '' };
    var mq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
    html.classList.add('gm-lock');
    initMerc();

    /* ---------- prefs ---------- */
    function prefs() { return mp(); }
    function setZMax() { // street packs allow zooming in further (street names show from z15.5)
      var nz = STR.sig || Object.keys(savedMap()).length ? Z_STREETS : Z_MAX;
      if (nz !== zMax) { zMax = nz; if (inited) { clampCam(); invalidate(); } }
    }
    function layerOn(id) { var l = prefs().l; return l[id] === undefined ? !!DEFAULT_ON[id] : !!l[id]; }
    function savedView() {
      var v = prefs().v;
      if (Array.isArray(v) && v.length === 3 && num(v[0]) && num(v[1]) && num(v[2]) && v[0] > -127 && v[0] < -112 && v[1] > 30 && v[1] < 44 && v[2] >= 3 && v[2] <= Z_STREETS) return v;
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
      root.classList.toggle('gm-nostrip', !wide && H - INS.t - INS.b < 130); // a tall sheet leaves no room for the scale and credit lines
      root.classList.toggle('gm-nosat', !wide && H - INS.t - INS.b < 262); // nor for the satellite button above them (four buttons, 202 px, 54 px up from the bottom, plus a small gap)
      root.style.setProperty('--gm-bot', bot + 'px');
      root.style.setProperty('--gm-top-h', top.offsetHeight + 'px');
      root.style.setProperty('--gm-sb', (sr.offsetTop + sr.offsetHeight + 6) + 'px');
    }
    function pads() { return { l: INS.l + 14, r: 62, t: INS.t + Math.min(44, H * 0.07), b: INS.b + Math.min(78, H * 0.12) }; }
    function visCenter() { return [(INS.l + W) / 2, (INS.t + H - INS.b) / 2]; } // the middle of the part of the map you can see
    function scaleNow() { return 256 * Math.pow(2, cam.z); }
    function centerLL() { return { lon: (cam.cx - 0.5) * 360, lat: latOfNy(cam.cy) }; }
    function clampCam() {
      cam.z = clamp(cam.z, zMin, zMax);
      cam.cx = clamp(cam.cx, nxOf(-1262000), nxOf(-1125000));
      cam.cy = clamp(cam.cy, nyOf(436000), nyOf(309000));
    }
    function fitZoom(x0, y0, x1, y1, pd) {
      var w = (nxOf(x1) - nxOf(x0)) * 256, h = (nyOf(y0) - nyOf(y1)) * 256;
      return Math.log(Math.max(1, Math.min((W - pd.l - pd.r) / Math.max(w, 1e-9), (H - pd.t - pd.b) / Math.max(h, 1e-9)))) / Math.LN2;
    }
    function viewFor(x0, y0, x1, y1, pd, maxZ) { // camera that shows a box inside the free area
      var z = clamp(fitZoom(x0, y0, x1, y1, pd), zMin, maxZ || zMax), sc = 256 * Math.pow(2, z);
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
      if (num(lat) && num(lon) && lat > 30 && lat < 44 && lon > -127 && lon < -112) { cam.z = clamp(num(z) ? z : 11, 3, zMax); cam.cx = nxOf(Math.round(lon * 1e4)); cam.cy = nyOf(Math.round(lat * 1e4)); clampCam(); }
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
      nz = clamp(nz, zMin, zMax);
      var sc0 = scaleNow(), sc1 = 256 * Math.pow(2, nz), wx = cam.cx + (px - W / 2) / sc0, wy = cam.cy + (py - H / 2) / sc0;
      cam.z = nz; cam.cx = wx - (px - W / 2) / sc1; cam.cy = wy - (py - H / 2) / sc1; clampCam(); invalidate();
    }
    function animateTo(cx, cy, z, dur) {
      stopMotion();
      anim = { t0: performance.now(), dur: dur || 500, cx0: cam.cx, cy0: cam.cy, z0: cam.z, cx1: cx, cy1: cy, z1: clamp(z, zMin, zMax) };
      schedule();
    }
    function zoomAnim(px, py, nz) {
      nz = clamp(nz, zMin, zMax);
      var sc0 = scaleNow(), sc1 = 256 * Math.pow(2, nz), wx = cam.cx + (px - W / 2) / sc0, wy = cam.cy + (py - H / 2) / sc0;
      animateTo(wx - (px - W / 2) / sc1, wy - (py - H / 2) / sc1, nz, 240);
    }
    function flyTo(x, y, z, dur) { // put a point in the middle of the free part of the map
      z = clamp(z, zMin, zMax);
      var vc = visCenter(), sc = 256 * Math.pow(2, z), fx = vc[0], fy = vc[1];
      animateTo(nxOf(x) + (W / 2 - fx) / sc, nyOf(y) + (H / 2 - fy) / sc, z, dur || 600);
    }
    function stopMotion() { anim = null; inertia = null; }
    function unproject(px, py) {
      var sc = scaleNow(), nx = cam.cx + (px - W / 2) / sc, ny = cam.cy + (py - H / 2) / sc;
      return { x: Math.round((nx - 0.5) * 3600000), y: Math.round(latOfNy(ny) * 1e4) };
    }
    function unprojectF(px, py) { // a finer position (about 1 m) for dropped pins, so a pin on a street snaps to that street
      var sc = scaleNow(), nx = cam.cx + (px - W / 2) / sc, ny = cam.cy + (py - H / 2) / sc;
      return { x: Math.round((nx - 0.5) * 36000000) / 10, y: Math.round(latOfNy(ny) * 1e5) / 10 };
    }
    function project(X, Y) { var sc = scaleNow(); return [(nxOf(X) - cam.cx) * sc + W / 2, (nyOf(Y) - cam.cy) * sc + H / 2]; }
    function onMoveEnd() { clearTimeout(T.save); T.save = setTimeout(saveView, 800); }

    /* ---------- frame loop ---------- */
    function schedule() { if (!raf && alive) raf = requestAnimationFrame(frame); }
    function invalidate() { dirty = true; schedule(); scheduleStChip(); }
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
      if (PALN && k === palKey) return;
      var cs = getComputedStyle(root); PALN = {}; palKey = k; SPR = {};
      PAL_KEYS.forEach(function (key) { PALN[key] = cs.getPropertyValue('--gm-' + key.replace(/[A-Z]/g, function (m) { return '-' + m.toLowerCase(); })).trim() || '#888888'; });
      PALS = satPal(PALN, k);
    }
    // Colors over imagery: bright road fills with dark casings, light dashed boundaries, white names with a dark halo. The ground fills are the dark
    // stand-in map shown where a picture is missing. Red night mode keeps its red colors (the imagery itself is dimmed and tinted red, see drawTiles).
    function satPal(n, k) {
      var P = {}, key;
      for (key in n) P[key] = n[key];
      if (k === 'night') {
        P.rd0c = P.rd1c = P.rd2c = P.rd3c = P.stc = '#000000';
        P.satCounty = 'rgba(255,110,98,.6)'; P.satCountyU = 'rgba(0,0,0,.5)'; P.satState = 'rgba(255,140,128,.95)'; P.satStateU = 'rgba(0,0,0,.6)';
        return P;
      }
      P.ocean = '#15303f'; P.land = '#2b392d'; P.nbr = '#1e271f'; P.nbrLine = '#3a4a3d'; P.county = '#3d4f40'; P.state = '#8a9c86'; P.lake = '#1f4a63'; P.river = '#2f6a88';
      P.rd0 = '#ffb83d'; P.rd1 = '#ffe27a'; P.rd2 = '#ffffff'; P.rd3 = '#f1f1ea';
      P.rd0c = P.rd1c = P.rd2c = P.rd3c = 'rgba(10,10,10,.92)';
      P.st = '#ffffff'; P.stc = 'rgba(10,10,10,.88)'; P.stl = '#f4f4ee';
      P.text = '#ffffff'; P.halo = 'rgba(0,0,0,.85)'; P.muted = '#eef1ea'; P.countyText = '#f4f4f0';
      P.route = '#ff3d9a'; P.routeC = '#ffffff';
      P.satCounty = 'rgba(255,255,255,.62)'; P.satCountyU = 'rgba(0,0,0,.38)'; P.satState = 'rgba(255,255,255,.95)'; P.satStateU = 'rgba(0,0,0,.5)';
      return P;
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
      ctx.font = font; ctx.textAlign = align || 'left'; ctx.lineWidth = satOn ? 4.6 : 3.5; ctx.strokeStyle = PAL.halo; ctx.strokeText(txt, x, y); ctx.fillStyle = fill; ctx.fillText(txt, x, y);
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
    function pyF(Y) { // graph units (1e-5 degrees) to screen y
      var t = Y / 10 - MY0, i = Math.floor(t);
      return (i >= 0 && i < MYN - 1 ? MYT[i] + (MYT[i + 1] - MYT[i]) * (t - i) : mercN(Y * 1e-5)) * vsc + voy;
    }
    // Street lines (merged classes 4 to 7), from the per-pack grids: only edges whose box meets the view are looked at, once each (a stamp per edge), grouped by class into one Path2D each.
    var SW = [1.55, 1.3, 1.05, 0.85], SMAXW = [9, 7.5, 6.2, 5.2], SMINZ = [11, 11, 12.5, 14], scand = [], SC = [], SCR = null;
    function streetW(k, z) { return clamp(SW[k] * Math.pow(1.38, z - 13), 0.8, SMAXW[k]); }
    function drawStreets(R, z) {
      scand.length = 0;
      var grids = R.sgrids;
      if (!grids || !grids.length || z < SMINZ[0]) return;
      var P = R.P, goff = R.goff, bx0 = R.bx0, by0 = R.by0, bx1 = R.bx1, by1 = R.by1, ecl = R.ecl, elab = R.elab, kf = vkf, ox = vox;
      var stamp = R.dstamp || (R.dstamp = new Int32Array(R.E)), cur = R.dcur = (R.dcur | 0) + 1, names = z >= 15.5, namesAll = z >= 16;
      var paths = [null, null, null, null], penx = [-1e9, -1e9, -1e9, -1e9], peny = [-1e9, -1e9, -1e9, -1e9], gi, cx, cy, a, b, ei, c, k4, path, i0, i1, i, x, y;
      for (gi = 0; gi < grids.length; gi++) {
        var g = grids[gi];
        if (g.bx1 < rx0 || g.bx0 > rx1 || g.by1 < ry0 || g.by0 > ry1) continue;
        var c0 = Math.max(0, Math.floor(rx0 / g.cs) - g.x0), c1 = Math.min(g.w - 1, Math.floor(rx1 / g.cs) - g.x0), r0 = Math.max(0, Math.floor(ry0 / g.cs) - g.y0), r1 = Math.min(g.h - 1, Math.floor(ry1 / g.cs) - g.y0);
        for (cy = r0; cy <= r1; cy++) for (cx = c0; cx <= c1; cx++) {
          for (a = g.start[cy * g.w + cx], b = g.start[cy * g.w + cx + 1]; a < b; a++) {
            ei = g.list[a];
            if (stamp[ei] === cur) continue;
            stamp[ei] = cur;
            c = ecl[ei]; k4 = c - 4;
            if (z < SMINZ[k4]) continue;
            if (bx1[ei] < rx0 || bx0[ei] > rx1 || by1[ei] < ry0 || by0[ei] > ry1) continue;
            path = paths[k4] || (paths[k4] = new Path2D());
            i0 = goff[ei] * 2; i1 = goff[ei + 1] * 2; x = P[i0] * kf + ox; y = pyF(P[i0 + 1]);
            if (Math.abs(x - penx[k4]) + Math.abs(y - peny[k4]) > 1.6) { path.moveTo(x, y); penx[k4] = x; peny[k4] = y; }
            if (i1 - i0 === 4 || ((bx1[ei] - bx0[ei]) * kf < 3 && (by1[ei] - by0[ei]) * kf * 1.3 < 3)) {
              x = P[i1 - 2] * kf + ox; y = pyF(P[i1 - 1]);
              if (Math.abs(x - penx[k4]) + Math.abs(y - peny[k4]) >= 1.2) { path.lineTo(x, y); penx[k4] = x; peny[k4] = y; }
            } else {
              for (i = i0 + 2; i < i1; i += 2) {
                x = P[i] * kf + ox; y = pyF(P[i + 1]);
                if (i < i1 - 2 && Math.abs(x - penx[k4]) + Math.abs(y - peny[k4]) < 1.5) continue;
                path.lineTo(x, y); penx[k4] = x; peny[k4] = y;
              }
            }
            if (names && elab[ei] && (k4 < 3 || namesAll) && scand.length < 9000) { var ddx = (bx1[ei] - bx0[ei]) * kf, ddy = (by1[ei] - by0[ei]) * kf * 1.25; if (ddx * ddx + ddy * ddy >= 36) scand.push(ei); }
          }
        }
      }
      var lines = !satOn && z < 13.5, k5, w;
      for (k5 = 0; k5 < 2; k5++) { // pass 0: the casings of every class, pass 1: the lines on top, so crossings look joined
        if (k5 === 0 && lines) continue;
        for (k4 = 3; k4 >= 0; k4--) {
          if (!paths[k4]) continue;
          w = streetW(k4, z);
          if (satOn) w = clamp(w * 0.85, 1.2, 6);
          ctx.lineCap = w >= 2.4 ? 'round' : 'butt'; ctx.lineJoin = 'round';
          if (k5 === 0) { ctx.lineWidth = w + (satOn ? 2.2 : w >= 3 ? 2 : 1.4); ctx.strokeStyle = PAL.stc; ctx.stroke(paths[k4]); }
          else { ctx.lineWidth = w; ctx.strokeStyle = lines ? PAL.stl : PAL.st; ctx.stroke(paths[k4]); }
        }
      }
      if (scand.length > 1) scand.sort(function (p, q) { return ecl[p] - ecl[q] || ((bx1[q] - bx0[q]) + (by1[q] - by0[q])) - ((bx1[p] - bx0[p]) + (by1[p] - by0[p])); });
    }
    // One Path2D per road class, drawn lowest class first. Edges are short in the real data, so tiny ones become a single segment,
    // and an edge that starts where the last drawn edge ended continues the same sub-path (fewer path commands).
    function drawRoads() {
      var R = DS.roads;
      lcand.length = 0; scand.length = 0;
      if (!R) return;
      var z = cam.z, P = R.P, goff = R.goff, bx0 = R.bx0, by0 = R.by0, bx1 = R.bx1, by1 = R.by1, elab = R.elab, lkind = R.lkind, minc = [0, 5.5, 8, 9.5], ramps = z >= 13, kf = vkf, ox = vox;
      drawStreets(R, z); // under the highways
      ctx.lineCap = 'butt'; ctx.lineJoin = z >= 12 ? 'round' : 'bevel';
      for (var c = 3; c >= 0; c--) {
        if (z < minc[c]) continue;
        var path = new Path2D(), any = false, penx = -1e9, peny = -1e9, shieldZ = c < 2 ? 8 : 9.5;
        for (var e2 = R.cs[c], e3 = R.cs[c + 1]; e2 < e3; e2++) {
          if (bx1[e2] < rx0 || bx0[e2] > rx1 || by1[e2] < ry0 || by0[e2] > ry1) continue;
          if (!ramps && c < 2 && !elab[e2]) continue; // ramps and links only when zoomed in
          var i0 = goff[e2] * 2, i1 = goff[e2 + 1] * 2, x = P[i0] * kf + ox, y = pyF(P[i0 + 1]);
          // a gap of more than ~1.5 px starts a new sub-path; otherwise the edge continues the pen, and points closer than ~1.2 px to the pen are dropped
          if (Math.abs(x - penx) + Math.abs(y - peny) > 1.6) { path.moveTo(x, y); penx = x; peny = y; }
          if (i1 - i0 === 4 || ((bx1[e2] - bx0[e2]) * kf < 3 && (by1[e2] - by0[e2]) * kf * 1.3 < 3)) {
            x = P[i1 - 2] * kf + ox; y = pyF(P[i1 - 1]);
            if (Math.abs(x - penx) + Math.abs(y - peny) >= 1.2) { path.lineTo(x, y); penx = x; peny = y; }
          } else {
            for (var i = i0 + 2; i < i1; i += 2) {
              x = P[i] * kf + ox; y = pyF(P[i + 1]);
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
        if (satOn) { w = clamp(w * 0.72, 1.5, 6.5); ctx.lineWidth = w + 3; ctx.strokeStyle = PAL['rd' + c + 'c']; ctx.stroke(path); } // always outlined over imagery
        else if (z >= 10 && w >= 2.2 && (c < 2 || z >= 11)) { ctx.lineWidth = w + 2; ctx.strokeStyle = PAL['rd' + c + 'c']; ctx.stroke(path); }
        ctx.lineWidth = w; ctx.strokeStyle = PAL['rd' + c]; ctx.stroke(path);
      }
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    }
    var labelGrid = null, iconGrid = null;
    function drawLabels() {
      var lg = labelGrid = makeGrid(), z = cam.z, P = DS.places, R = DS.roads, B = DS.base, i, count = 0, cand = LC;
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
          if (np === 2) { mxd = (R.P[j0] + R.P[j0 + 2]) / 20; myd = (R.P[j0 + 1] + R.P[j0 + 3]) / 20; } else { mxd = R.P[j0 + (np >> 1) * 2] / 10; myd = R.P[j0 + (np >> 1) * 2 + 1] / 10; } // graph units are 1e-5 degrees, the view box is in 1e-4
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
      iconGrid = ig;
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
      if (sel && sel.kind === 'poi') {
        var p = project(sel.x, sel.y); ctx.beginPath(); ctx.arc(p[0], p[1], 19, 0, 6.2832);
        if (satOn) { ctx.lineWidth = 7; ctx.strokeStyle = palKey === 'night' ? '#000000' : '#ffffff'; ctx.stroke(); }
        ctx.lineWidth = 3.5; ctx.strokeStyle = PAL.sel; ctx.stroke();
      }
    }
    // Street names along the streets (z15.5 and closer): drawn after places and icons and keeping clear of both, in the order the bitmap pass sorted them (arterials first, long edges first).
    // A name is put along ONE edge when that is long enough, otherwise along a chain of same-named edges (blocks are short: the chain follows the street through its junctions).
    var TX = new Float64Array(320), TY = new Float64Array(320), TC = new Float64Array(320), snw = {}, SPA = [0, 0], SPB = [0, 0];
    function polyAt(np, s0, out) { // the point at distance s0 along the screen polyline in TX, TY, TC
      var j = 1; while (j < np - 1 && TC[j] < s0) j++;
      var d = TC[j] - TC[j - 1], u = d > 0 ? clamp((s0 - TC[j - 1]) / d, 0, 1) : 0;
      out[0] = TX[j - 1] + (TX[j] - TX[j - 1]) * u; out[1] = TY[j - 1] + (TY[j] - TY[j - 1]) * u;
    }
    function pushEdge(R, e, rev, n) { // adds the screen points of edge e (backwards when rev) after the n points already there; returns the new count, or -1 when it would not fit
      var i0 = R.goff[e] * 2, np = ((R.goff[e + 1] * 2) - i0) >> 1, j, jj, x, y, P = R.P;
      if (n + np > 310) return -1;
      for (j = n > 0 ? 1 : 0; j < np; j++) {
        jj = rev ? np - 1 - j : j; x = P[i0 + 2 * jj] * vkf + vox; y = pyF(P[i0 + 2 * jj + 1]);
        TX[n] = x; TY[n] = y; TC[n] = n ? TC[n - 1] + Math.sqrt((x - TX[n - 1]) * (x - TX[n - 1]) + (y - TY[n - 1]) * (y - TY[n - 1])) : 0; n++;
      }
      return n;
    }
    function leaveHeading(R, e, rev) { // screen heading of edge e at its start (its end when rev)
      var i0 = R.goff[e] * 2, i1 = R.goff[e + 1] * 2, P = R.P, ax, ay, bx, by;
      if (!rev) { ax = P[i0]; ay = P[i0 + 1]; bx = P[i0 + 2]; by = P[i0 + 3]; } else { ax = P[i1 - 2]; ay = P[i1 - 1]; bx = P[i1 - 4]; by = P[i1 - 3]; }
      return Math.atan2(pyF(by) - pyF(ay), (bx - ax) * vkf);
    }
    function turnAbs(a, b) { var d = Math.abs(a - b) % (2 * Math.PI); return d > Math.PI ? 2 * Math.PI - d : d; }
    // the edge that carries the street on from `node` (leaving it) with the straightest heading, or -1; arc >> 1 is the edge, arc & 1 says it is travelled from its b end
    function nextArc(R, node, fromE, lab, heading) {
      var best = -1, bd = 0.7, a, arc, e2, d;
      for (a = R.adjStart[node]; a < R.adjStart[node + 1]; a++) {
        arc = R.adjArc[a]; e2 = arc >> 1;
        if (e2 === fromE || R.elab[e2] !== lab) continue;
        d = turnAbs(leaveHeading(R, e2, (arc & 1) === 1), heading);
        if (d < bd) { bd = d; best = arc; }
      }
      return best;
    }
    function chainFor(R, ei, need) { // screen polyline (TX, TY, TC) of the street through edge ei, about `need` px long; returns the point count
      var lab = R.elab[ei], s0 = ei, rev0 = false, k, arc, node, h, a, e2, d, bd, ba;
      for (k = 0; k < 3; k++) { // step back along the street a little, so the label is not forced to start at this edge
        node = rev0 ? R.eb[s0] : R.ea[s0]; h = leaveHeading(R, s0, rev0) + Math.PI; ba = -1; bd = 0.7;
        for (a = R.adjStart[node]; a < R.adjStart[node + 1]; a++) {
          arc = R.adjArc[a]; e2 = arc >> 1;
          if (e2 === s0 || R.elab[e2] !== lab) continue;
          d = turnAbs(leaveHeading(R, e2, (arc & 1) === 1), h);
          if (d < bd) { bd = d; ba = arc; }
        }
        if (ba < 0 || (ba >> 1) === ei) break;
        s0 = ba >> 1; rev0 = (ba & 1) === 0;
      }
      var n = pushEdge(R, s0, rev0, 0), cur = s0, used = 1; if (n < 0) return 0;
      node = rev0 ? R.ea[s0] : R.eb[s0];
      while (TC[n - 1] < need && used < 9) {
        h = Math.atan2(TY[n - 1] - TY[n - 2], TX[n - 1] - TX[n - 2]);
        arc = nextArc(R, node, cur, lab, h);
        if (arc < 0) break;
        e2 = arc >> 1; var nn = pushEdge(R, e2, (arc & 1) === 1, n);
        if (nn < 0) break;
        n = nn; cur = e2; node = (arc & 1) === 1 ? R.ea[e2] : R.eb[e2]; used++;
      }
      return n;
    }
    function drawStreetNames() {
      var R = DS.roads, cand = SC;
      if (!R || SCR !== R || !cand || !cand.length || cam.z < 15.5 || !labelGrid) return;
      var goff = R.goff, bx0 = R.bx0, by0 = R.by0, bx1 = R.bx1, by1 = R.by1, labels = R.labels, elab = R.elab, lg = labelGrid, ig = iconGrid;
      var sg = makeGrid(), placed = [], count = 0, tried = 0, n, j, pa = SPA, pb = SPB, xmin = INS.l + 8, xmax = W - 8, ymin = INS.t + 8, ymax = H - INS.b - 78, ctop = H - INS.b - 330, cx0 = W - 70; // keep clear of the top buttons, the scale and credit lines, and the zoom buttons
      ctx.font = '600 13px ' + FONT; ctx.textBaseline = 'middle'; ctx.textAlign = 'center'; ctx.lineJoin = 'round';
      for (n = 0; n < cand.length && count < 70 && tried < 700; n++) {
        var ei = cand[n];
        if (bx1[ei] < rx0 || bx0[ei] > rx1 || by1[ei] < ry0 || by0[ei] > ry1) continue;
        var name = labels[elab[ei]], tw = snw[name];
        if (tw === undefined) tw = snw[name] = ctx.measureText(name).width;
        tried++;
        var np = pushEdge(R, ei, false, 0);
        if (np < 0) continue;
        if (TC[np - 1] < tw + 16) { np = chainFor(R, ei, tw * 1.6 + 30); if (np < 2 || TC[np - 1] < tw + 16) continue; }
        var tot = TC[np - 1], s0 = tot / 2 - tw / 2;
        polyAt(np, s0, pa); polyAt(np, s0 + tw, pb);
        var ax = pa[0], ay = pa[1], bx = pb[0], by = pb[1], dx = bx - ax, dy = by - ay, cl = Math.sqrt(dx * dx + dy * dy);
        if (cl < tw * 0.85 || Math.min(ax, bx) < xmin || Math.max(ax, bx) > xmax || Math.min(ay, by) < ymin || Math.max(ay, by) > ymax || (Math.max(ax, bx) > cx0 && Math.max(ay, by) > ctop)) continue;
        var bend = false;
        for (j = 1; j < np - 1; j++) { if (TC[j] <= s0 || TC[j] >= s0 + tw) continue; if (Math.abs((TX[j] - ax) * dy - (TY[j] - ay) * dx) / cl > 4.5) { bend = true; break; } }
        if (bend) continue; // the street curves too much here: another stretch of it will do
        var cx = (ax + bx) / 2, cy = (ay + by) / 2, near = false, pi;
        for (pi = 0; pi < placed.length; pi++) if (placed[pi].t === name && Math.abs(placed[pi].x - cx) + Math.abs(placed[pi].y - cy) < 190) { near = true; break; }
        if (near) continue;
        var nsub = Math.ceil(tw / 24), q, hit = false;
        for (q = 0; q < nsub && !hit; q++) {
          var t = (q + 0.5) / nsub, rx = ax + dx * t, ry = ay + dy * t;
          if (lg.hit(rx - 14, ry - 9, rx + 14, ry + 9) || (ig && ig.hit(rx - 14, ry - 9, rx + 14, ry + 9)) || sg.hit(rx - 14, ry - 9, rx + 14, ry + 9)) hit = true;
        }
        if (hit) continue;
        for (q = 0; q < nsub; q++) { var t2 = (q + 0.5) / nsub, rx2 = ax + dx * t2, ry2 = ay + dy * t2; sg.add(rx2 - 14, ry2 - 9, rx2 + 14, ry2 + 9); }
        placed.push({ t: name, x: cx, y: cy });
        var ang = Math.atan2(dy, dx);
        if (ang > Math.PI / 2) ang -= Math.PI; else if (ang < -Math.PI / 2) ang += Math.PI; // never upside down
        ctx.save(); ctx.translate(cx, cy); ctx.rotate(ang);
        ctx.lineWidth = satOn ? 4.2 : 3.2; ctx.strokeStyle = PAL.halo; ctx.strokeText(name, 0, 0);
        ctx.fillStyle = PAL.text; ctx.fillText(name, 0, 0);
        ctx.restore();
        count++;
      }
      perf.names = count; perf.nameTries = tried;
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
      vsc = 256 * Math.pow(2, z); vkx = vsc / 3600000; vkf = vkx / 10; vox = (0.5 - cx) * vsc + w / 2; voy = h / 2 - cy * vsc;
      vx0 = (-40 - vox) / vkx; vx1 = (w + 40 - vox) / vkx;
      vy0 = latOfNy((h + 40 - voy) / vsc) * 1e4; vy1 = latOfNy((-40 - voy) / vsc) * 1e4;
      rx0 = vx0 * 10; rx1 = vx1 * 10; ry0 = vy0 * 10; ry1 = vy1 * 10;
    }
    var BL = { cv: null, cx: null, w: 0, h: 0, cx0: 0, cy0: 0, sc0: 0, valid: false, dpr: 0, key: '', over: false, lcand: [] }; // satellite view: roads and boundary lines on a transparent bitmap
    // kind: 'base' = ground, water, lines and roads (normal map); 'fill' = ground and water only (the dark stand-in under missing pictures); 'over' = boundary lines and roads on a transparent bitmap
    function cacheKey(kind) { return kind + '|' + palKey + '|' + dpr + '|' + (DS.roads ? 1 : 0) + (DS.base ? 1 : 0) + '|' + STR.merges; }
    function drawOver() {
      var B = DS.base, z = cam.z, i, j;
      if (B) {
        ctx.beginPath();
        for (i = 0; i < B.counties.length; i++) { var c = B.counties[i]; if (!seen(c)) continue; for (j = 0; j < c.rings.length; j++) tracePoly(c.rings[j].p, true); }
        ctx.lineWidth = 3; ctx.strokeStyle = PAL.satCountyU; ctx.stroke();
        ctx.setLineDash([5, 5]); ctx.lineWidth = z < 7 ? 1 : 1.4; ctx.strokeStyle = PAL.satCounty; ctx.stroke(); ctx.setLineDash([]);
        ctx.beginPath(); for (i = 0; i < B.state.length; i++) if (seen(B.state[i])) tracePoly(B.state[i].p, true);
        var far = z < 8; // a little finer when the whole state is on screen
        ctx.lineWidth = far ? 3.4 : 4.4; ctx.strokeStyle = PAL.satStateU; ctx.stroke();
        ctx.setLineDash(far ? [8, 5] : [11, 6]); ctx.lineWidth = far ? 1.7 : 2.2; ctx.strokeStyle = PAL.satState; ctx.stroke(); ctx.setLineDash([]);
      }
      drawRoads();
    }
    function renderCache(C, kind) {
      var t0 = performance.now(), w = W + 2 * Math.ceil(W * 0.3), h = H + 2 * Math.ceil(H * 0.3), main = ctx, over = kind === 'over';
      if (!C.cv || C.w !== w || C.h !== h || C.dpr !== dpr || C.over !== over) {
        C.cv = document.createElement('canvas'); C.cv.width = Math.round(w * dpr); C.cv.height = Math.round(h * dpr);
        C.cx = C.cv.getContext('2d', { alpha: over }); C.w = w; C.h = h; C.dpr = dpr; C.over = over;
      }
      ctx = C.cx;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      setView(w, h, cam.cx, cam.cy, cam.z);
      if (over) { ctx.clearRect(0, 0, w, h); drawOver(); }
      else { ctx.fillStyle = PAL.ocean; ctx.fillRect(0, 0, w, h); if (DS.base) drawBase(); if (kind === 'base') drawRoads(); }
      if (kind !== 'fill') { C.lcand = lcand.slice(); LC = C.lcand; C.scand = scand.slice(); SC = C.scand; SCR = DS.roads; }
      C.cx0 = cam.cx; C.cy0 = cam.cy; C.sc0 = vsc; C.valid = true; C.key = cacheKey(kind);
      ctx = main;
      perf.renders++; perf.baseMs = performance.now() - t0;
      if (perf.sync) { try { C.cx.getImageData(0, 0, 1, 1); perf.baseMs = performance.now() - t0; } catch (err) { /* ignore */ } }
    }
    // draws a cached bitmap, shifted and scaled to the current camera; re-renders it when the pan or zoom ran past its margin
    function paintCache(C, kind) {
      var sc = scaleNow(), k = C.valid ? sc / C.sc0 : 0, ok = false, dx = 0, dy = 0;
      if (C.valid && C.key === cacheKey(kind)) {
        dx = W / 2 + (C.cx0 - cam.cx) * sc - C.w * k / 2; dy = H / 2 + (C.cy0 - cam.cy) * sc - C.h * k / 2;
        ok = k > 0.55 && k < 1.8 && dx <= 0.5 && dy <= 0.5 && dx + C.w * k >= W - 0.5 && dy + C.h * k >= H - 0.5;
      }
      if (!ok) { renderCache(C, kind); k = 1; dx = (W - C.w) / 2; dy = (H - C.h) / 2; }
      else if (Math.abs(k - 1) > 0.002) {
        if (!T.bc) T.bc = setTimeout(function () { T.bc = 0; BC.valid = false; BL.valid = false; invalidate(); }, 160); // sharpen after the zoom settles
      } else { dx = Math.round(dx * dpr) / dpr; dy = Math.round(dy * dpr) / dpr; }
      ctx.drawImage(C.cv, 0, 0, C.cv.width, C.cv.height, dx, dy, C.w * k, C.h * k);
    }
    function paintBase() { if (satOn) paintSat(); else paintCache(BC, 'base'); }

    /* ---------- satellite pictures: tiles, memory, loading ----------
       Tiles are drawn every frame straight from memory (cheap) under a cached transparent bitmap of roads and boundary lines.
       Where a picture is missing, a coarser one already in memory stands in; if there is none, the dark stand-in map shows through. */
    var satOn = false, SATO = { maxLevel: SAT_MAXZ, noOver: false }; // SATO.maxLevel is a test hook; the level is never above 16
    var SAT = { mem: new Map(), pend: new Map(), bad: new Map(), queue: [], inflight: 0, want: null, chip: '', missing: 0, nbad: 0, loadSince: 0, cacheP: null, gen: 0, stored: -1,
      stats: { net: 0, cache: 0, fail: 0, aborted: 0, dropped: 0, decoded: 0, drawn: 0, plans: 0, maxFly: 0 } };
    var PLAN = { slots: [], n: 0, holes: false, missing: 0, nbad: 0, L: 0 };
    function satWanted() { var p = prefs(); return p.sat === 1 && p.satOk === 1; } // only an exact 1, and only after the notice was accepted
    function tileKey(z, x, y) { return z * 4294967296 + x * 65536 + y; }
    function tileUrl(z, x, y) { return SAT_URL + z + '/' + y + '/' + x; }
    // Tile level: one level deeper than the zoom on a 2x screen, so the pictures are sharp; never above 16 (the service has nothing deeper, the last level is scaled up)
    function tileLevel(z) { return clamp(Math.floor(z + Math.log(dpr || 1) / Math.LN2 + 0.3), 0, Math.min(SAT_MAXZ, SATO.maxLevel)); }
    function closeImg(b) { try { if (b && b.close) b.close(); } catch (err) { /* ignore */ } }
    // is this picture still needed? A normal request is for the current level and screen; a stand-in (it.sub) is a coarser picture asked for where the service has no sharp one
    function wanted(it) {
      var w = SAT.want; if (!w) return false;
      var d = w.L - it.z;
      if (it.sub ? d < 1 : d !== 0) return false;
      return it.x >= (w.x0 >> d) && it.x <= (w.x1 >> d) && it.y >= (w.y0 >> d) && it.y <= (w.y1 >> d);
    }
    function satCache() { // the saved pictures; null when this browser has no Cache API or refuses it (private mode): then it is network only
      if (!SAT.cacheP) {
        SAT.cacheP = Promise.resolve().then(function () { return window.caches && caches.open ? caches.open(SAT_CACHE) : null; }).catch(function () { return null; });
        SAT.cacheP.then(function (c) { if (c) return c.keys().then(function (ks) { SAT.stored = ks.length; }); }).catch(function () { /* ignore */ });
      }
      return SAT.cacheP;
    }
    function cacheGet(url) { return satCache().then(function (c) { return c ? c.match(url, { ignoreVary: true }).catch(function () { return null; }) : null; }); }
    function cachePut(url, resp) {
      if (SAT.stored >= SAT_AUTO_MAX) return; // enough kept just from looking: the picture still shows, it is just not stored
      satCache().then(function (c) { return c ? c.put(url, resp).then(function () { if (SAT.stored >= 0) SAT.stored++; }) : null; }).catch(function () { /* full or blocked: the picture still shows */ });
    }
    function cacheDel(url) { satCache().then(function (c) { return c ? c.delete(url) : null; }).catch(function () { /* ignore */ }); }
    function decodeImg(blob) {
      function viaImage() {
        return new Promise(function (resolve, reject) {
          var u = URL.createObjectURL(blob), im = new Image();
          im.onload = function () { URL.revokeObjectURL(u); resolve(im); };
          im.onerror = function () { URL.revokeObjectURL(u); reject(new Error('could not decode a picture')); };
          im.src = u;
        });
      }
      if (typeof createImageBitmap === 'function') return createImageBitmap(blob).catch(viaImage);
      return viaImage();
    }
    function netFetch(url, it) { // one network request: CORS, no cookies, no referrer, 20 second limit; a picture is also stored for offline use
      var ac = typeof AbortController === 'function' ? new AbortController() : null;
      if (it) {
        it.ac = ac;
        it.tm = setTimeout(function () { it.tm = 0; if (ac) { try { ac.abort(); } catch (err) { /* ignore */ } } }, 20000);
      }
      function clearTm() { if (it && it.tm) { clearTimeout(it.tm); it.tm = 0; } }
      return fetch(url, { mode: 'cors', credentials: 'omit', referrerPolicy: 'no-referrer', signal: ac ? ac.signal : undefined }).then(function (r) {
        if (r.status === 404 || r.status === 400) { var er = new Error('no picture here'); er.none = true; throw er; }
        if (!r.ok) throw new Error('HTTP ' + r.status);
        if (String(r.headers.get('content-type') || '').indexOf('image/') !== 0) throw new Error('not a picture'); // for example a Wi-Fi sign-in page
        cachePut(url, r.clone());
        return r.blob();
      }).then(function (b) { clearTm(); return b; }, function (err) { clearTm(); throw err; });
    }
    function startTile(it) {
      var url = tileUrl(it.z, it.x, it.y), gen = SAT.gen;
      it.st = 'f'; it.net = false; it.off = false; it.fromCache = false; it.dead = false; SAT.inflight++;
      if (SAT.inflight > SAT.stats.maxFly) SAT.stats.maxFly = SAT.inflight;
      cacheGet(url).then(function (hit) {
        if (gen !== SAT.gen) return null;
        if (hit) { SAT.stats.cache++; it.fromCache = true; return hit.blob(); }
        if (navigator.onLine === false) { it.off = true; return null; } // no connection and not saved: do not even try
        it.net = true; SAT.stats.net++;
        return netFetch(url, it);
      }).then(function (blob) {
        if (!blob || gen !== SAT.gen) return null;
        return decodeImg(blob).then(function (img) { return { img: img, alpha: !/jpe?g/i.test(blob.type || '') }; }); // JPEG squares are opaque; a PNG square may have see-through parts (no imagery there)
      }).then(function (res) { tileDone(it, res, gen); }, function (err) { tileFailed(it, err, gen, url); });
    }
    function tileDone(it, res, gen) {
      var img = res && res.img;
      if (gen !== SAT.gen || !alive) { closeImg(img); return; }
      SAT.inflight = Math.max(0, SAT.inflight - 1);
      SAT.pend.delete(it.k); it.ac = null;
      if (!img) SAT.bad.set(it.k, 'o'); // offline and not saved
      else {
        SAT.stats.decoded++;
        SAT.mem.set(it.k, { b: img, w: img.naturalWidth || img.width || 256, a: res.alpha });
        while (SAT.mem.size > SAT_MEM) { var first = SAT.mem.keys().next().value, old = SAT.mem.get(first); closeImg(old && old.b); SAT.mem.delete(first); }
      }
      invalidate(); satPump();
    }
    function tileFailed(it, err, gen, url) {
      if (gen !== SAT.gen || !alive) return;
      SAT.inflight = Math.max(0, SAT.inflight - 1); it.ac = null;
      if (it.dead) { SAT.pend.delete(it.k); satPump(); return; } // stopped on purpose: it scrolled out of view
      if (err && err.none) { // the service has no picture for this square (for example far out at sea): do not ask again, ask for the coarser picture above it to show instead
        SAT.pend.delete(it.k); SAT.bad.set(it.k, 'n');
        if (it.z > 5) standIn(it.z - 1, it.x >> 1, it.y >> 1);
        invalidate(); satPump(); return;
      }
      if (it.fromCache) cacheDel(url); // a damaged saved copy: drop it so the next try uses the network
      it.n++; SAT.stats.fail++;
      if (it.n < 3) { // at most two retries, 1.5 s then 4 s later
        it.st = 'w';
        it.timer = setTimeout(function () {
          it.timer = 0;
          if (gen !== SAT.gen || !alive) return;
          if (wanted(it)) { it.st = 'q'; SAT.queue.push(it); } else SAT.pend.delete(it.k);
          satPump();
        }, it.n === 1 ? 1500 : 4000);
      } else { SAT.pend.delete(it.k); SAT.bad.set(it.k, 'x'); invalidate(); } // gives up until the connection returns or the user taps Try again
      satPump();
    }
    function enqueue(z, x, y, k) {
      var it = { k: k, z: z, x: x, y: y, sub: false, st: 'q', n: 0, ac: null, tm: 0, timer: 0, dead: false, net: false, off: false, fromCache: false };
      SAT.pend.set(k, it); SAT.queue.push(it);
    }
    function standIn(z, x, y) {
      var k = tileKey(z, x, y);
      if (SAT.mem.has(k) || SAT.pend.has(k) || SAT.bad.has(k)) return;
      enqueue(z, x, y, k); SAT.pend.get(k).sub = true;
    }
    // starts requests, nearest to the middle of the screen first, at most SAT_FLY at once; drops queued ones that scrolled out of view
    function satPump() {
      if (!alive || !satOn) return;
      var q = SAT.queue, i;
      for (i = q.length - 1; i >= 0; i--) if (!wanted(q[i])) { SAT.pend.delete(q[i].k); q.splice(i, 1); SAT.stats.dropped++; }
      if (SAT.inflight) SAT.pend.forEach(function (it) {
        if (it.st === 'f' && it.net && !it.dead && !wanted(it)) { it.dead = true; SAT.stats.aborted++; try { if (it.ac) it.ac.abort(); } catch (err) { /* ignore */ } }
      });
      if (!q.length || SAT.inflight >= SAT_FLY) return;
      var vc = visCenter(), sc = scaleNow(), ccx = cam.cx + (vc[0] - W / 2) / sc, ccy = cam.cy + (vc[1] - H / 2) / sc;
      while (q.length && SAT.inflight < SAT_FLY) {
        var bi = 0, bd = Infinity;
        for (i = 0; i < q.length; i++) {
          var it2 = q[i], n = Math.pow(2, it2.z), dx = (it2.x + 0.5) / n - ccx, dy = (it2.y + 0.5) / n - ccy, d = dx * dx + dy * dy;
          if (d < bd) { bd = d; bi = i; }
        }
        startTile(q.splice(bi, 1)[0]);
      }
    }
    function satChip() { // the little status note: shown only when loading takes more than a moment, or when pictures are missing and cannot be had
      var now = performance.now(), chip = '';
      if (satOn) {
        if (SAT.pend.size) {
          if (!SAT.loadSince) { SAT.loadSince = now; clearTimeout(T.sc); T.sc = setTimeout(function () { T.sc = 0; if (alive) satChip(); }, 340); }
          if (now - SAT.loadSince > 300) chip = 'load';
        } else {
          SAT.loadSince = 0;
          if (SAT.missing && (SAT.nbad || navigator.onLine === false)) chip = 'off';
        }
      }
      if (chip !== SAT.chip) { SAT.chip = chip; if (!T.ss) T.ss = setTimeout(function () { T.ss = 0; if (alive) renderStatus(); }, 0); }
    }
    function satRetry() { // forget the failures and look again (the connection came back, or the user tapped Try again)
      SAT.bad.forEach(function (v, k) { if (v !== 'n') SAT.bad.delete(k); });
      invalidate();
    }
    function satReset() { // forget everything: running and queued requests, retry timers, decoded pictures
      SAT.gen++;
      SAT.pend.forEach(function (it) { if (it.timer) clearTimeout(it.timer); if (it.tm) clearTimeout(it.tm); if (it.ac) { try { it.ac.abort(); } catch (err) { /* ignore */ } } });
      SAT.pend.clear(); SAT.queue.length = 0; SAT.inflight = 0; SAT.bad.clear(); SAT.want = null; SAT.chip = ''; SAT.missing = 0; SAT.nbad = 0; SAT.loadSince = 0;
      SAT.mem.forEach(function (e) { closeImg(e.b); }); SAT.mem.clear();
      PLAN.n = 0;
    }
    function slotAt(i) { return PLAN.slots[i] || (PLAN.slots[i] = { tx: 0, ty: 0, l: 0, t: 0, w: 0, h: 0, kind: 3, e: null, sx: 0, sy: 0, sw: 0, ue: null, ux: 0, uy: 0, us: 0, kids: [null, null, null, null] }); }
    var PAR = { e: null, sx: 0, sy: 0, sw: 0 };
    // the nearest coarser picture in memory (up to 5 levels up) and the part of it that lies under square tx,ty of level L
    function parentOf(L, tx, ty) {
      for (var d = 1; d <= 5 && L - d >= 0; d++) {
        var px = tx >> d, py = ty >> d, pk = tileKey(L - d, px, py), pe = SAT.mem.get(pk);
        if (pe) { memTouch(pk, pe); PAR.e = pe; PAR.sw = pe.w / (1 << d); PAR.sx = (tx - (px << d)) * PAR.sw; PAR.sy = (ty - (py << d)) * PAR.sw; return true; }
      }
      return false;
    }
    function memTouch(k, e) { SAT.mem.delete(k); SAT.mem.set(k, e); }
    // Works out which pictures cover the screen: the exact tile, else a coarser one already in memory (up to 5 levels up), else finer ones; asks for what is missing
    function satPlan() {
      var sc = scaleNow(), L = tileLevel(cam.z), n = Math.pow(2, L), ts = sc / n, offx = W / 2 - cam.cx * sc, offy = H / 2 - cam.cy * sc, mg = 64, ty, tx, i = 0, s;
      var x0 = Math.max(0, Math.floor((-mg - offx) / ts)), x1 = Math.min(n - 1, Math.floor((W + mg - offx) / ts));
      var y0 = Math.max(0, Math.floor((-mg - offy) / ts)), y1 = Math.min(n - 1, Math.floor((H + mg - offy) / ts));
      PLAN.n = 0; PLAN.missing = 0; PLAN.nbad = 0; PLAN.L = L; PLAN.holes = offx > 0 || offy > 0 || offx + n * ts < W || offy + n * ts < H; // the world edge is never covered
      SAT.want = { L: L, x0: x0, x1: x1, y0: y0, y1: y1 };
      SAT.stats.plans++;
      if (x1 < x0 || y1 < y0 || (x1 - x0 + 1) * (y1 - y0 + 1) > 400) { PLAN.holes = true; SAT.missing = 0; SAT.nbad = 0; return PLAN; }
      for (ty = y0; ty <= y1; ty++) {
        var t = Math.round((ty * ts + offy) * dpr) / dpr, b = Math.round(((ty + 1) * ts + offy) * dpr) / dpr;
        for (tx = x0; tx <= x1; tx++) {
          var l = Math.round((tx * ts + offx) * dpr) / dpr, r = Math.round(((tx + 1) * ts + offx) * dpr) / dpr, vis = r > 0 && l < W && b > 0 && t < H;
          var k = tileKey(L, tx, ty), e = SAT.mem.get(k), bad = e ? undefined : SAT.bad.get(k);
          if (e) { if (!vis) continue; memTouch(k, e); s = slotAt(i++); s.tx = tx; s.ty = ty; s.l = l; s.t = t; s.w = r - l; s.h = b - t; s.kind = 0; s.e = e; s.ue = null;
            if (e.a) { PLAN.holes = true; if (parentOf(L, tx, ty)) { s.ue = PAR.e; s.ux = PAR.sx; s.uy = PAR.sy; s.us = PAR.sw; } } // partly see-through square: a coarser picture goes under it
            continue;
          }
          if (!bad && !SAT.pend.has(k)) enqueue(L, tx, ty, k);
          if (!vis) continue;
          s = slotAt(i++); s.tx = tx; s.ty = ty; s.l = l; s.t = t; s.w = r - l; s.h = b - t; s.kind = 3; s.e = null; s.ue = null;
          if (bad !== 'n') PLAN.missing++;
          if (bad === 'o' || bad === 'x') PLAN.nbad++;
          var found = parentOf(L, tx, ty);
          if (found) { if (PAR.e.a) PLAN.holes = true; s.kind = 1; s.e = PAR.e; s.sw = PAR.sw; s.sx = PAR.sx; s.sy = PAR.sy; }
          else if (L < SAT_MAXZ) { // finer pictures (after zooming out) fill part of the square
            var qn = 0, qq;
            for (qq = 0; qq < 4; qq++) {
              var ck = tileKey(L + 1, tx * 2 + (qq & 1), ty * 2 + (qq >> 1)), ce = SAT.mem.get(ck);
              s.kids[qq] = ce || null;
              if (ce) { qn++; memTouch(ck, ce); if (ce.a) PLAN.holes = true; }
            }
            if (qn) { s.kind = 2; if (qn < 4) PLAN.holes = true; }
          }
          if (s.kind === 3) PLAN.holes = true;
        }
      }
      PLAN.n = i; SAT.missing = PLAN.missing; SAT.nbad = PLAN.nbad;
      return PLAN;
    }
    function drawTiles(P) {
      var c = ctx, i, s, q;
      c.imageSmoothingEnabled = true;
      for (i = 0; i < P.n; i++) {
        s = P.slots[i];
        if (s.ue) c.drawImage(s.ue.b, s.ux, s.uy, s.us, s.us, s.l, s.t, s.w, s.h);
        if (s.kind === 0) c.drawImage(s.e.b, s.l, s.t, s.w, s.h);
        else if (s.kind === 1) c.drawImage(s.e.b, s.sx, s.sy, s.sw, s.sw, s.l, s.t, s.w, s.h);
        else if (s.kind === 2) {
          for (q = 0; q < 4; q++) {
            if (!s.kids[q]) continue;
            var dl = Math.round((s.l + (q & 1) * s.w / 2) * dpr) / dpr, dr = Math.round((s.l + ((q & 1) + 1) * s.w / 2) * dpr) / dpr, dt = Math.round((s.t + (q >> 1) * s.h / 2) * dpr) / dpr, db = Math.round((s.t + ((q >> 1) + 1) * s.h / 2) * dpr) / dpr;
            c.drawImage(s.kids[q].b, dl, dt, dr - dl, db - dt);
          }
        }
      }
      SAT.stats.drawn += P.n;
      // Night mode: red light only and dim, so the screen stays easy on dark-adapted eyes. Dark mode: a little dimmer.
      if (palKey === 'night') { c.globalCompositeOperation = 'multiply'; c.fillStyle = '#ff1a0d'; c.fillRect(0, 0, W, H); c.globalCompositeOperation = 'source-over'; c.fillStyle = 'rgba(0,0,0,.5)'; c.fillRect(0, 0, W, H); }
      else if (palKey === 'dark') { c.fillStyle = 'rgba(0,0,0,.2)'; c.fillRect(0, 0, W, H); }
    }
    function paintSat() {
      var P = satPlan();
      if (P.holes) paintCache(BC, 'fill'); // the dark stand-in map under squares with no picture yet
      drawTiles(P);
      if (!SATO.noOver) paintCache(BL, 'over'); // noOver is a test switch: the pictures without the lines, to check alignment
      satPump(); satChip();
    }
    function draw() {
      if (!ctx || !W || !H) return;
      var t0 = performance.now();
      loadPal(); PAL = satOn ? PALS : PALN;
      hits.length = 0; labelGrid = null;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      paintBase();
      var t1 = performance.now();
      setView(W, H, cam.cx, cam.cy, cam.z);
      drawLabels();
      var t2 = performance.now();
      drawPois();
      drawStreetNames();
      var t3 = performance.now();
      drawRoute();
      drawMarkers();
      drawMe();
      var vc = visCenter();
      ctx.beginPath(); ctx.moveTo(vc[0] - 9, vc[1]); ctx.lineTo(vc[0] + 9, vc[1]); ctx.moveTo(vc[0], vc[1] - 9); ctx.lineTo(vc[0], vc[1] + 9);
      if (satOn) { ctx.globalAlpha = 0.5; ctx.lineWidth = 3.5; ctx.strokeStyle = '#000000'; ctx.stroke(); } // the middle mark needs a dark edge over imagery
      ctx.globalAlpha = satOn ? 0.9 : 0.4; ctx.lineWidth = 1.5; ctx.strokeStyle = PAL.text; ctx.stroke(); ctx.globalAlpha = 1;
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
      if (chipSigNow() !== chipSig) renderChips();
    }

    /* ---------- items (what a tap or a search result means) ---------- */
    function poiItem(lid, i) {
      var L = LBY[lid], r = DS.pois[lid].rec[i], sub = r[6] | 0, tl = L.one, icon = L.icon;
      if (lid === 'landmark') { var m = LM[sub] || LM[0]; tl = m[1]; icon = m[0]; }
      if (lid === 'airport') tl = sub ? 'Airport with airline flights' : 'Airfield';
      return { kind: 'poi', layer: lid, idx: i, name: r[2] || L.one, x: r[0], y: r[1], addr: r[3] || '', phone: r[4] || '', flags: r[5] | 0, sub: sub, type: tl, icon: icon };
    }
    function placeItem(i) { var P = DS.places; return { kind: 'place', idx: i, name: P.name[i], x: P.x[i], y: P.y[i], type: PLACE_LABEL[P.kind[i]], icon: '📍', pop: P.pop[i] }; }
    function pinAt(px, py) { var p = unprojectF(px, py); return { kind: 'pin', name: 'Dropped pin', x: p.x, y: p.y, type: 'Dropped pin', icon: '📍' }; }
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
      if (satOn && SAT.chip === 'load') h += '<span class="gm-load gm-satst">Loading satellite…</span>';
      else if (satOn && SAT.chip === 'off') h += '<span class="gm-load gm-satst">Satellite needs a connection or a saved area</span>' + (navigator.onLine !== false && SAT.nbad ? '<button class="gm-btn gm-satretry" data-gm="sat-retry">Try again</button>' : '');
      if (SAVE.phase === 'run' && st.mode !== 'info') h += saveCardHtml();
      if (STR.loading) h += '<span class="gm-load gm-satst">Loading streets…</span>';
      if (dlBusy() && st.mode !== 'streets') h += dlCardHtml();
      if (st.mode !== 'streets' && strUsable()) {
        var need = attentionCount();
        if (need) h += '<button class="gm-load gm-stchip" data-gm="streets">' + (need === 1 ? 'A saved street map is' : need + ' saved street maps are') + ' out of date or damaged. Tap to fix</button>';
        if (st.stc) h += '<span class="gm-stchipw"><button class="gm-load gm-stchip" data-gm="st-county" data-c="' + e(st.stc.id) + '">Local streets for ' + e(st.stc.name) + ' County are not saved. Save (' + e(fmtSz(st.stc.bytes)) + ')</button><button class="gm-stx" data-gm="st-chip-x" data-c="' + e(st.stc.id) + '" aria-label="Hide this note">✕</button></span>';
      }
      if (failed && ST.base !== 'err') h += '<div class="gm-fail">' + e(FAIL_MSG) + '<br><small>Details: ' + e(['places', 'pois', 'roads'].filter(function (n) { return ST[n] === 'err'; }).map(function (n) { return n + ': ' + ERR[n]; }).join('; ')) + '</small><br><button class="btn small" data-gm="retry">Retry</button></div>';
      status.innerHTML = h;
      showFatal();
      layoutVars();
    }
    function nSaved() { var s2 = mp().streets; return s2 && typeof s2 === 'object' && !Array.isArray(s2) ? Object.keys(s2).length : 0; }
    function chipSigNow() { return LAYERS.map(function (L) { return layerOn(L.id) && cam.z < L.min ? 1 : 0; }).join('') + (DS.pois ? 'p' : '') + (strUsable() ? 's' + nSaved() : ''); }
    function renderChips() {
      var z = cam.z, h = '';
      chipSig = chipSigNow();
      if (strUsable()) { var ns = nSaved(); h += '<button class="gm-chip gm-chip-st" data-gm="streets" aria-label="Street maps for offline use">🏙️ Streets' + (ns ? ' <span class="n">' + ns + ' saved</span>' : '') + '</button>'; }
      LAYERS.forEach(function (L) {
        var on = layerOn(L.id), far = on && z < L.min, n = DS.pois && DS.pois[L.id] ? DS.pois[L.id].n : null;
        h += '<button class="gm-chip' + (on ? ' on' : '') + (far ? ' far' : '') + '" data-gm="layer" data-l="' + L.id + '" aria-pressed="' + on + '" title="' + (far ? 'On. Zoom in to see these.' : '') + '"><span class="ck">' + (on ? '✓' : '') + '</span>' + L.icon + ' ' + e(L.label) + (n !== null ? ' <span class="n">' + n.toLocaleString('en-US') + '</span>' : '') + '</button>';
      });
      chips.innerHTML = h;
      chips.classList.toggle('gm-nost', !strUsable());
    }
    /* ---------- satellite: switch, first-use notice, saving an area, saved pictures ---------- */
    var SAVE = { phase: 'idle', list: null, skipped: 0, done: 0, got: 0, failed: 0, none: 0, next: 0, active: 0, consec: 0, stop: false, reason: '', msg: '', ac: null, tok: 0 }; // phase: idle | plan | big | run | done
    var SAVED = { n: -1, usage: 0, quota: 0, api: true, busy: false, confirm: false }; // what is stored on this device
    var dlgAfter = null;
    function fmtMB(n) { var mb = n * SAT_KB / 1000; return (mb < 10 ? Math.round(mb * 10) / 10 : Math.round(mb)).toLocaleString('en-US') + ' MB'; }
    function fmtSize(b) { return b >= 1e9 ? (b / 1e9).toFixed(1) + ' GB' : Math.max(1, Math.round(b / 1e6)).toLocaleString('en-US') + ' MB'; }
    function plural(n, one, many) { return n.toLocaleString('en-US') + ' ' + (n === 1 ? one : many); }

    function closeDlg() { var m = q('gm-modal'); if (m && m.parentNode) m.parentNode.removeChild(m); st.dlg = ''; dlgAfter = null; }
    function openDlg(name, html) {
      closeDlg();
      var m = document.createElement('div');
      m.className = 'gm-modal'; m.id = 'gm-modal'; m.setAttribute('data-gm', 'dlg-bk');
      m.innerHTML = '<div class="gm-dlg" role="dialog" aria-modal="true" aria-labelledby="gm-dlg-t">' + html + '</div>';
      root.appendChild(m); st.dlg = name;
      var f = m.querySelector('button.primary') || m.querySelector('button');
      if (f) { try { f.focus(); } catch (err) { /* ignore */ } }
    }
    function showSatNotice(after, yes) { // the one-time notice: nothing is requested from the USGS before it is accepted
      openDlg('sat', '<h2 id="gm-dlg-t">Satellite pictures</h2><p>' + e(SAT_NOTICE) + '</p><div class="gm-btns"><button class="btn primary" data-gm="sat-ok">' + e(yes || 'Show satellite') + '</button><button class="btn" data-gm="dlg-no">Cancel</button></div>');
      dlgAfter = after; // set after openDlg, which clears it
    }
    function satUi() {
      var b = q('gm-sat'), on = satOn;
      if (b) {
        b.setAttribute('aria-label', on ? 'Switch back to the normal map' : 'Switch to satellite pictures');
        q('gm-sat-t').textContent = on ? 'Map' : 'Satellite';
        q('gm-sat-i').innerHTML = on ? SAT_ICON_MAP : SAT_ICON_GLOBE;
        b.classList.toggle('on', on);
      }
      q('gm-attr2').hidden = !on;
      var ib = q('gm-sat-info'); if (ib) ib.textContent = on ? 'Back to the normal map' : 'Show satellite pictures';
      var lg = pb.querySelector('.gm-leg'); if (lg) lg.classList.toggle('sat', on);
    }
    function syncSat() { // makes the screen match the saved choice; every switch starts a fresh set of requests
      satOn = satWanted();
      satReset();
      if (!satOn) { BL.cv = BL.cx = null; BL.valid = false; }
      BC.valid = false; BL.valid = false;
      satUi(); renderStatus(); invalidate();
    }
    function setSat(on) {
      var p = prefs();
      if (on && p.satOk !== 1) { showSatNotice(function () { setSat(true); }); return; }
      p.sat = on ? 1 : 0;
      var hint = on && p.satHint !== 1; if (hint) p.satHint = 1;
      App.save();
      syncSat();
      if (hint) App.toast('Satellite is on. To use it with no signal, tap the i button and save this area.', 7000);
    }

    // ---- saving an area for offline use ----
    function areaBox() { // the part of the map you can see (not under the top controls, the side card or the sheet), in 0..1 world coordinates
      var sc = scaleNow(), l = INS.l, t = INS.t, r = W, b = H - INS.b;
      if (r - l < 60 || b - t < 60) { l = 0; t = 0; b = H; }
      return { x0: cam.cx + (l - W / 2) / sc, x1: cam.cx + (r - W / 2) / sc, y0: cam.cy + (t - H / 2) / sc, y1: cam.cy + (b - H / 2) / sc };
    }
    function countAt(box, l) {
      var n = Math.pow(2, l), x0 = clamp(Math.floor(box.x0 * n), 0, n - 1), x1 = clamp(Math.floor(box.x1 * n), 0, n - 1), y0 = clamp(Math.floor(box.y0 * n), 0, n - 1), y1 = clamp(Math.floor(box.y1 * n), 0, n - 1);
      return { l: l, x0: x0, x1: x1, y0: y0, y1: y1, c: (x1 - x0 + 1) * (y1 - y0 + 1) };
    }
    // levels from two coarser than the one on screen (so zooming out a little still works) up through 15; level 16 only when the whole area is small
    function areaPlan() {
      var box = areaBox(), L0 = Math.min(tileLevel(cam.z), SAT_SAVE_MAXL), lo = Math.max(5, L0 - 2), levels = [], total = 0, l, c;
      for (l = lo; l <= SAT_SAVE_MAXL; l++) { c = countAt(box, l); levels.push(c); total += c.c; }
      if (total <= SAT_MAX_SAVE && SAT_MAXZ > SAT_SAVE_MAXL) { c = countAt(box, SAT_MAXZ); if (total + c.c <= SAT_SMALL) { levels.push(c); total += c.c; } }
      return { levels: levels, total: total, big: total > SAT_MAX_SAVE };
    }
    function startSavePlan() {
      if (SAVE.phase === 'run') return;
      var tok = ++SAVE.tok;
      SAVE.msg = ''; SAVE.list = null;
      satCache().then(function (c) {
        if (tok !== SAVE.tok || !alive) return null;
        if (!c) { SAVED.api = false; SAVE.phase = 'idle'; satBoxUpdate(); return null; }
        var pl = areaPlan();
        if (pl.big) { SAVE.phase = 'big'; satBoxUpdate(); return null; }
        return c.keys().then(function (ks) {
          if (tok !== SAVE.tok || !alive) return;
          var have = {}, list = [], skipped = 0;
          ks.forEach(function (r) { have[r.url] = 1; });
          pl.levels.forEach(function (lv) {
            for (var y = lv.y0; y <= lv.y1; y++) for (var x = lv.x0; x <= lv.x1; x++) { var u = tileUrl(lv.l, x, y); if (have[u]) skipped++; else list.push({ u: u, l: lv.l }); }
          });
          SAVE.list = list; SAVE.skipped = skipped; SAVE.phase = 'plan'; satBoxUpdate();
        });
      }).catch(function () { if (tok === SAVE.tok && alive) { SAVE.phase = 'idle'; SAVE.msg = 'Could not check what is already saved. Try again.'; satBoxUpdate(); } });
    }
    function saveEnd(tok) {
      if (tok !== SAVE.tok || !alive || SAVE.phase !== 'run') return;
      var got = SAVE.got, r = SAVE.reason, m;
      var sofar = got ? 'Saved ' + plural(got, 'picture', 'pictures') + ' so far, about ' + fmtMB(got) + '.' : 'Nothing was saved.';
      if (r === 'cancel') m = 'Cancelled. ' + sofar;
      else if (r === 'fails') m = 'Stopped after 3 downloads failed in a row. Check your connection and try again. ' + sofar;
      else if (r === 'space') m = 'Your device has no more room for pictures. ' + sofar + ' Delete saved pictures to make room.';
      else m = 'Saved ' + plural(got, 'picture', 'pictures') + ', about ' + fmtMB(got) + '.' + (SAVE.failed ? ' ' + plural(SAVE.failed, 'picture', 'pictures') + ' could not be downloaded.' : '');
      SAVE.phase = 'done'; SAVE.msg = m; SAVE.ac = null; if (SAT.stored >= 0) SAT.stored += got;
      refreshSaved(); renderStatus(); satBoxUpdate();
      if (st.mode !== 'info') App.toast(m, 5000);
    }
    function runSave() {
      var list = SAVE.list, tok = ++SAVE.tok;
      if (SAVE.phase === 'run' || !list) return;
      if (!list.length) { SAVE.phase = 'done'; SAVE.msg = 'Everything in this area is already saved.'; satBoxUpdate(); return; }
      if (navigator.onLine === false) { SAVE.phase = 'done'; SAVE.msg = 'You are offline. Connect to the internet to save pictures.'; satBoxUpdate(); return; }
      SAVE.phase = 'run'; SAVE.done = 0; SAVE.got = 0; SAVE.failed = 0; SAVE.none = 0; SAVE.next = 0; SAVE.active = 0; SAVE.consec = 0; SAVE.stop = false; SAVE.reason = ''; SAVE.msg = '';
      SAVE.ac = typeof AbortController === 'function' ? new AbortController() : null;
      renderStatus(); satBoxUpdate();
      satCache().then(function (c) {
        if (tok !== SAVE.tok || !alive) return;
        if (!c) { SAVE.stop = true; saveEnd(tok); return; }
        function work() {
          if (tok !== SAVE.tok || !alive) return;
          if (SAVE.stop || SAVE.next >= list.length) { if (SAVE.active === 0) saveEnd(tok); return; }
          var it = list[SAVE.next++];
          SAVE.active++;
          fetch(it.u, { mode: 'cors', credentials: 'omit', referrerPolicy: 'no-referrer', signal: SAVE.ac ? SAVE.ac.signal : undefined }).then(function (r) {
            if (r.status === 404 || r.status === 400) return 'none';
            if (!r.ok) throw new Error('HTTP ' + r.status);
            if (String(r.headers.get('content-type') || '').indexOf('image/') !== 0) throw new Error('not a picture');
            return c.put(it.u, r).then(function () { return 'ok'; });
          }).then(function (res) {
            if (tok !== SAVE.tok) return;
            SAVE.active--; SAVE.done++; SAVE.consec = 0;
            if (res === 'ok') SAVE.got++; else SAVE.none++;
            saveProgress(); work();
          }, function (err) {
            if (tok !== SAVE.tok) return;
            SAVE.active--;
            if (SAVE.stop) { work(); return; } // cancelled
            SAVE.done++;
            if (err && (err.name === 'QuotaExceededError' || err.code === 22)) { SAVE.stop = true; SAVE.reason = 'space'; }
            else { SAVE.failed++; SAVE.consec++; if (SAVE.consec >= 3) { SAVE.stop = true; SAVE.reason = 'fails'; if (SAVE.ac) { try { SAVE.ac.abort(); } catch (e2) { /* ignore */ } } } }
            saveProgress(); work();
          });
        }
        for (var w = 0; w < SAT_SAVE_FLY; w++) work();
      }).catch(function () { SAVE.stop = true; saveEnd(tok); });
    }
    function cancelSave() {
      if (SAVE.phase !== 'run') return;
      SAVE.stop = true; SAVE.reason = 'cancel';
      if (SAVE.ac) { try { SAVE.ac.abort(); } catch (err) { /* ignore */ } }
      if (SAVE.active === 0) saveEnd(SAVE.tok);
    }
    function saveText() { return 'Saving satellite pictures: ' + SAVE.done.toLocaleString('en-US') + ' of ' + (SAVE.list ? SAVE.list.length : 0).toLocaleString('en-US'); }
    function savePct() { return SAVE.list && SAVE.list.length ? Math.round(SAVE.done / SAVE.list.length * 100) : 0; }
    function progHtml(pre) { var p = savePct(); return '<div class="gm-prog" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + p + '"><i id="' + pre + 'b" style="width:' + p + '%"></i></div>'; }
    function saveCardHtml() { return '<div class="gm-savecard"><div class="tt" id="gm-sc-t">' + e(saveText()) + '</div>' + progHtml('gm-sc-') + '<button class="gm-btn" data-gm="sat-cancel">Cancel saving</button></div>'; }
    function saveProgress() { // updates the numbers in place (rebuilding the buttons while they are being tapped would swallow the tap)
      if (T.sp) return;
      T.sp = setTimeout(function () {
        T.sp = 0; if (!alive) return;
        ['gm-sc-', 'gm-sp-'].forEach(function (pre) {
          var t = q(pre + 't'), b = q(pre + 'b');
          if (t) t.textContent = saveText();
          if (b) { b.style.width = savePct() + '%'; if (b.parentNode) b.parentNode.setAttribute('aria-valuenow', savePct()); }
        });
      }, 120);
    }

    // ---- what is stored, and deleting it ----
    function refreshSaved() {
      if (SAVED.busy) return;
      SAVED.busy = true;
      satCache().then(function (c) {
        if (!c) { SAVED.api = false; return null; }
        SAVED.api = true;
        return c.keys().then(function (ks) { SAVED.n = ks.length; });
      }).catch(function () { SAVED.api = false; }).then(function () {
        if (navigator.storage && navigator.storage.estimate) return navigator.storage.estimate().then(function (es) { SAVED.usage = (es && es.usage) || 0; SAVED.quota = (es && es.quota) || 0; }).catch(function () { /* ignore */ });
        return null;
      }).then(function () { SAVED.busy = false; if (alive) satBoxUpdate(); });
    }
    function deleteSaved() {
      SAVED.confirm = false;
      var done = function () { SAT.cacheP = null; SAT.stored = 0; SAVED.n = 0; refreshSaved(); App.toast('Saved satellite pictures deleted'); };
      try {
        if (window.caches && caches.delete) caches.delete(SAT_CACHE).then(done, function () { App.toast('Could not delete the saved pictures. Try again.', 4000); satBoxUpdate(); });
        else done();
      } catch (err) { done(); }
    }
    function satBoxHtml() {
      var h = '', S2 = SAVE, ph = S2.phase;
      if (!SAVED.api) return '<p class="muted">This browser cannot keep satellite pictures for offline use. Satellite view still works with a connection.</p>';
      if (ph === 'run') h += '<div class="gm-savebox"><p><b id="gm-sp-t">' + e(saveText()) + '</b></p>' + progHtml('gm-sp-') + '<div class="gm-btns"><button class="btn" data-gm="sat-cancel">Cancel</button></div></div>';
      else if (ph === 'plan' && S2.list) {
        var n = S2.list.length;
        h += '<div class="gm-savebox">' + (n ? '<p><b>This area needs ' + e(plural(n, 'picture', 'pictures')) + ', about ' + e(fmtMB(n)) + '.</b>' + (S2.skipped ? ' ' + e(plural(S2.skipped, 'picture is', 'pictures are')) + ' already saved.' : '') + ' Saving uses your data plan or Wi-Fi.</p><div class="gm-btns"><button class="btn primary" data-gm="sat-go">Start saving</button><button class="btn" data-gm="sat-no2">Cancel</button></div>'
          : '<p><b>Everything in this area is already saved.</b></p><div class="gm-btns"><button class="btn" data-gm="sat-no2">OK</button></div>') + '</div>';
      } else if (ph === 'big') h += '<div class="gm-warn">That area is too big. Zoom in and try again.</div><div class="gm-btns"><button class="btn" data-gm="sat-no2">OK</button></div>';
      else if (ph === 'done') h += '<div class="gm-savebox"><p><b>' + e(S2.msg) + '</b></p><div class="gm-btns"><button class="btn" data-gm="sat-no2">OK</button></div></div>';
      else h += '<div class="gm-btns"><button class="btn" data-gm="sat-save">Save this area for offline</button></div>' + (S2.msg ? '<p class="muted">' + e(S2.msg) + '</p>' : '<p class="muted">Saves the pictures for the part of the map you can see now, from here to close-up zoom.</p>');
      // what is stored
      h += '<p class="gm-savedline"><b>Saved satellite:</b> ' + (SAVED.n < 0 ? 'checking…' : e(plural(SAVED.n, 'picture', 'pictures')) + ', about ' + e(fmtMB(SAVED.n))) + '.</p>';
      if (SAVED.quota > 0) h += '<p class="muted">This app is using about ' + e(fmtSize(SAVED.usage)) + ' of the ' + e(fmtSize(SAVED.quota)) + ' your browser allows.</p>';
      if (SAVED.confirm) h += '<div class="gm-warn">Delete all ' + e(plural(SAVED.n, 'saved picture', 'saved pictures')) + '? You can save them again later with a connection.</div><div class="gm-btns"><button class="btn danger" data-gm="sat-del-yes">Yes, delete them</button><button class="btn" data-gm="sat-del-no">Keep them</button></div>';
      else if (SAVED.n > 0) h += '<div class="gm-btns"><button class="btn" data-gm="sat-del">Delete saved satellite pictures</button></div>';
      return h;
    }
    function satBoxUpdate() {
      var el = q('gm-satbox'); if (!el) return;
      var sig = SAVE.phase + '|' + (SAVE.list ? SAVE.list.length : 0) + '|' + SAVE.msg + '|' + SAVED.n + '|' + SAVED.usage + '|' + SAVED.api + '|' + SAVED.confirm;
      if (el.getAttribute('data-sig') === sig && SAVE.phase !== 'run') return;
      if (SAVE.phase === 'run' && el.getAttribute('data-ph') === 'run' && q('gm-sp-t')) { saveProgress(); return; }
      el.innerHTML = satBoxHtml(); el.setAttribute('data-sig', sig); el.setAttribute('data-ph', SAVE.phase);
    }

    /* ---------- street maps: the panel, the little cards, and the status note ---------- */
    function attentionCount() { // saved counties that cannot be used until they are updated or downloaded again
      if (!STR.idx) return 0;
      var n = 0; STR.idx.counties.forEach(function (c) { var s2 = strStatus(c.id).s; if (s2 === 'update' || s2 === 'damaged') n++; });
      return n;
    }
    var BSLUG = null;
    function baseCounty(id) { if (!BSLUG && DS.base) { BSLUG = {}; DS.base.counties.forEach(function (c) { BSLUG[slugOf(c.n)] = c; }); } return BSLUG ? BSLUG[id] : null; }
    function countyMeetsBox(bc, x0, y0, x1, y1) { // does a county's land meet a box (1e-4 degrees)?
      if (bc.x1 < x0 || bc.x0 > x1 || bc.y1 < y0 || bc.y0 > y1) return false;
      var j, i, p, cxm = (x0 + x1) / 2, cym = (y0 + y1) / 2;
      for (j = 0; j < bc.rings.length; j++) { p = bc.rings[j].p; for (i = 0; i < p.length; i += 2) if (p[i] >= x0 && p[i] <= x1 && p[i + 1] >= y0 && p[i + 1] <= y1) return true; }
      for (j = 0; j < bc.rings.length; j++) { p = bc.rings[j].p; if (pipRing(p, cxm, cym) || pipRing(p, x0, y0) || pipRing(p, x1, y0) || pipRing(p, x0, y1) || pipRing(p, x1, y1)) return true; }
      return false;
    }
    function onScreenIds() { // counties that show on the map now and are not saved yet (or need an update)
      if (!STR.idx) return [];
      var box = areaBox(), x0 = (box.x0 - 0.5) * 3600000, x1 = (box.x1 - 0.5) * 3600000, yt = latOfNy(box.y0) * 1e4, yb = latOfNy(box.y1) * 1e4, out = [];
      STR.idx.counties.forEach(function (c) {
        var bc = baseCounty(c.id), hit = bc ? countyMeetsBox(bc, x0, yb, x1, yt) : !(c.bbox[2] * 1e4 < x0 || c.bbox[0] * 1e4 > x1 || c.bbox[3] * 1e4 < yb || c.bbox[1] * 1e4 > yt);
        if (hit && strStatus(c.id).s !== 'saved' && !DL.per[c.id]) out.push(c.id);
      });
      return out;
    }
    function nearIds() { // up to four counties within about 30 km of the middle of the map
      if (!STR.idx) return [];
      var vc = visCenter(), u = unproject(vc[0], vc[1]), lon = u.x / 1e4, lat = u.y / 1e4, cosl = Math.cos(lat * RAD), out = [];
      STR.idx.counties.forEach(function (c) {
        var dx = Math.max(c.bbox[0] - lon, 0, lon - c.bbox[2]) * cosl, dy = Math.max(c.bbox[1] - lat, 0, lat - c.bbox[3]), d = Math.sqrt(dx * dx + dy * dy) * 111;
        if (d <= 30) out.push({ id: c.id, d: d });
      });
      out.sort(function (a, b) { return a.d - b.d; });
      return out.slice(0, 4).map(function (o) { return o.id; });
    }
    function stChipNow() { // the note under the buttons: the map is zoomed in on a county whose street maps are not saved, and we are online
      if (cam.z < 12.5 || !strUsable() || navigator.onLine === false || ST.base !== 'ok' || !roadsHash() || STR.idx.base !== roadsHash() || st.mode === 'streets' || !DS.base) return null;
      var vc = visCenter(), u = unproject(vc[0], vc[1]), c = strCountyAt(u.x, u.y);
      if (!c || st.stHide[c.id] || DL.per[c.id] || strStatus(c.id).s !== 'none') return null;
      return { id: c.id, name: c.name, bytes: c.bytes };
    }
    function checkStChip() {
      T.stc = 0; if (!alive) return;
      var n = stChipNow(), sig = n ? n.id : '';
      if (sig !== st.stcSig) { st.stcSig = sig; st.stc = n; renderStatus(); }
    }
    function scheduleStChip() { if (!T.stc && alive && (cam.z >= 12.5 || st.stc)) T.stc = setTimeout(checkStChip, 300); }
    function dlTotals() {
      var tot = 0, got = 0, n = 0;
      Object.keys(DL.per).forEach(function (id) { var d = DL.per[id]; if (d.state === 'queued' || d.state === 'run') { tot += d.total; got += d.got; n++; } });
      return { tot: tot, got: got, n: n, pct: tot ? Math.min(99, Math.round(got / tot * 100)) : 0 };
    }
    function dlCardHtml() {
      var t = dlTotals();
      return '<div class="gm-savecard"><div class="tt" id="gm-sd-t">Saving street maps: ' + t.pct + '%' + (t.n > 1 ? ' (' + t.n + ' counties)' : '') + '</div><div class="gm-prog" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + t.pct + '"><i id="gm-sd-b" style="width:' + t.pct + '%"></i></div><button class="gm-btn" data-gm="st-cancel-all">Cancel saving</button></div>';
    }
    function stProgress() { // numbers and bars in place (rebuilding buttons while they are tapped would swallow the tap)
      if (!alive) return;
      Object.keys(DL.per).forEach(function (id) {
        var d = DL.per[id]; if (d.state !== 'run' && d.state !== 'queued') return;
        var pct = d.total ? Math.min(99, Math.round(d.got / d.total * 100)) : 0, t = q('gm-stt-' + id), b = q('gm-stp-' + id);
        if (t) t.textContent = d.state === 'queued' ? 'Waiting to download…' : 'Downloading ' + pct + '%';
        if (b) { b.style.width = pct + '%'; if (b.parentNode) b.parentNode.setAttribute('aria-valuenow', pct); }
      });
      var tt = dlTotals(), ct = q('gm-sd-t'), cb = q('gm-sd-b');
      if (ct) ct.textContent = 'Saving street maps: ' + tt.pct + '%' + (tt.n > 1 ? ' (' + tt.n + ' counties)' : '');
      if (cb) { cb.style.width = tt.pct + '%'; if (cb.parentNode) cb.parentNode.setAttribute('aria-valuenow', tt.pct); }
    }
    function stShell() {
      var h = head('🏙️', 'Street maps for offline use', '');
      h += '<details class="gm-intro"' + (nSaved() ? '' : ' open') + '><summary>About street maps</summary><p>Street maps add local streets, street names and street-by-street directions. The highways and main roads are always in the map. Each county is a separate download: you need a connection once to save it, then it works with no signal and stays on this phone.</p></details>' +
        '<div id="gm-st-note"></div><div id="gm-st-store" class="muted"></div>' +
        '<div class="gm-find" id="gm-st-find"><label class="gm-vh" for="gm-st-q">Find a county</label><input id="gm-st-q" type="search" inputmode="search" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Find a county" value="' + e(st.stQ) + '"></div>' +
        '<div id="gm-st-bulk"></div><div id="gm-st-list" class="gm-clist"></div><div id="gm-st-foot"></div>';
      return h;
    }
    function stRowHtml(c) {
      var id = c.id, s2 = strStatus(id), d = DL.per[id], stt = '', btn = '', xtra = '', sizes = 'uses ' + fmtSz(c.bytes) + ', download about ' + fmtSz(c.gz), canDl = strUsable() && STR.idx.base === roadsHash();
      if (d && (d.state === 'queued' || d.state === 'run')) {
        var pct = d.total ? Math.min(99, Math.round(d.got / d.total * 100)) : 0;
        stt = '<span class="stt" id="gm-stt-' + id + '">' + (d.state === 'queued' ? 'Waiting to download…' : 'Downloading ' + pct + '%') + '</span>';
        xtra = '<div class="gm-prog" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + pct + '"><i id="gm-stp-' + id + '" style="width:' + pct + '%"></i></div>';
        btn = '<button class="btn small" data-gm="st-cancel" data-c="' + id + '">Cancel</button>';
      } else if (st.stConf === id) {
        stt = '<span class="stt">Saved</span>';
        xtra = '<div class="gm-warn">Delete the street maps for ' + e(c.name) + ' County from this phone? You can save them again later with a connection.</div><div class="gm-btns"><button class="btn danger" data-gm="st-del-yes" data-c="' + id + '">Yes, delete</button><button class="btn" data-gm="st-del-no">Keep them</button></div>';
      } else if (s2.s === 'saved') {
        stt = '<span class="stt ok">Saved' + (s2.rec && s2.rec.t ? ' ' + e(new Date(s2.rec.t).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })) : '') + (s2.loaded ? '' : (STR.loading ? ' (loading…)' : '')) + '</span>';
        btn = '<button class="btn small" data-gm="st-del" data-c="' + id + '" aria-label="Delete the street maps for ' + e(c.name) + ' County">Delete</button>';
      } else if (s2.s === 'update') {
        stt = '<span class="stt warn">Update needed</span>';
        btn = canDl ? '<button class="btn small primary" data-gm="st-dl" data-c="' + id + '" aria-label="Download the new street maps for ' + e(c.name) + ' County">Update</button>' : '';
        if (!canDl) xtra = '<div class="sb">Saved for an older version of the map. Open the app while online to get the new version.</div>';
      } else if (s2.s === 'damaged') {
        stt = '<span class="stt warn">Damaged, download again</span>';
        btn = canDl ? '<button class="btn small primary" data-gm="st-dl" data-c="' + id + '">Download again</button>' : '';
      } else {
        stt = d && d.state === 'error' ? '<span class="stt warn">Could not save</span>' : '<span class="stt">Not saved</span>';
        if (d && d.state === 'error') xtra = '<div class="gm-warn">' + e(d.msg) + '</div>';
        btn = canDl ? '<button class="btn small primary" data-gm="st-dl" data-c="' + id + '" aria-label="Download the street maps for ' + e(c.name) + ' County">' + (d && d.state === 'error' ? 'Try again' : 'Download') + '</button>' : '';
      }
      return '<div class="gm-crow' + (st.stHi === id ? ' hi' : '') + '" id="gm-cr-' + id + '"><div class="main"><div class="tx"><span class="nm">' + e(c.name) + '</span><span class="sb">' + e(sizes) + '</span>' + stt + '</div>' + (btn ? '<div class="act">' + btn + '</div>' : '') + '</div>' + xtra + '</div>';
    }
    function stUpdate() { // fills the parts of the panel from the current state (the search box itself is never rebuilt, so typing is not interrupted)
      var list = q('gm-st-list'); if (!list || st.mode !== 'streets') return;
      var ok = strUsable(), canDl = ok && STR.idx.base === roadsHash(), note = '', c;
      if (STR.idxState === 'off' || STR.api === false) note = '<div class="gm-warn">Street maps need the installed app. This browser (or private browsing, or the single-file copy) cannot keep them for use with no signal.</div>';
      else if (STR.idxState === 'err') note = '<div class="gm-warn">The list of street maps could not load. Connect to the internet once, then close the map and open it again.' + (ERR.streets ? '<br><small>Details: ' + e(ERR.streets) + '</small>' : '') + '</div>';
      else if (STR.idxState !== 'ok') note = '<p class="muted">Loading the list…</p>';
      else if (!canDl) note = '<div class="gm-warn">The street maps on the server are for a different version of the map. Open the app while online so it can update, then try again.</div>';
      else if (navigator.onLine === false) note = '<div class="gm-note">You are offline. Saved street maps work, but saving a new county needs a connection.</div>';
      q('gm-st-note').innerHTML = note;
      var find = q('gm-st-find'); if (find) find.hidden = !ok;
      var sv = ok ? strSavedBytes() : { n: 0, bytes: 0 }, store = '';
      if (ok) {
        store = '<b>Saved on this phone:</b> ' + (sv.n ? sv.n + (sv.n === 1 ? ' county, ' : ' counties, ') + e(fmtSz(sv.bytes)) + ' of street maps' : 'no street maps') + '.';
        if (STR.est && STR.est.quota > 0) store += ' This app uses about ' + e(fmtSz(STR.est.usage)) + ' of the ' + e(fmtSz(STR.est.quota)) + ' your browser allows.';
        if (sv.bytes > BIG_STREETS) store += '<br><span class="muted">' + BIG_NOTE + '</span>';
      }
      q('gm-st-store').innerHTML = store;
      var bulk = '';
      if (canDl) { // save the counties on screen
        var ids = st.stScreen.filter(function (id) { return !DL.per[id] && strStatus(id).s !== 'saved'; }), tb = 0, tg = 0;
        ids.forEach(function (id) { var cc = STR.idx.by[id]; tb += cc.bytes; tg += cc.gz; });
        if (!ids.length) bulk = '<p class="muted">Every county on the map screen is already saved or downloading.</p>';
        else if (st.stBulk === 'confirm') bulk = '<div class="gm-warn">Save ' + e(plural(ids.length, 'county', 'counties')) + ', about ' + e(fmtSz(tb)) + '?<br><span class="muted">It uses ' + e(fmtSz(tb)) + ' on this phone and downloads about ' + e(fmtSz(tg)) + '.' + (tg > 40e6 ? ' That is a lot: use Wi-Fi if you can.' : '') + (tb + sv.bytes > BIG_STREETS ? '<br>' + BIG_NOTE : '') + '</span></div><div class="gm-btns"><button class="btn primary" data-gm="st-bulk-yes">Yes, save them</button><button class="btn" data-gm="st-bulk-no">Cancel</button></div>';
        else bulk = '<div class="gm-btns"><button class="btn" data-gm="st-bulk">Save counties on screen (' + e(plural(ids.length, 'county', 'counties')) + ', ' + e(fmtSz(tb)) + ')</button></div>';
        if (dlTotals().n > 1) bulk += '<div class="gm-btns"><button class="btn" data-gm="st-cancel-all">Cancel all downloads</button></div>';
      }
      q('gm-st-bulk').innerHTML = bulk;
      var h = '';
      if (ok) {
        var qs = fold(st.stQ), cs = STR.idx.counties, near = st.stNear.filter(function (id) { return STR.idx.by[id]; });
        if (qs) { cs.filter(function (cc) { return fold(cc.name).indexOf(qs) >= 0; }).forEach(function (cc) { h += stRowHtml(cc); }); if (!h) h = '<p class="muted">No county matches “' + e(st.stQ.trim()) + '”.</p>'; }
        else {
          if (near.length) { h += '<h3 class="gm-chead">Near the map center</h3>'; near.forEach(function (id) { h += stRowHtml(STR.idx.by[id]); }); h += '<h3 class="gm-chead">All counties</h3>'; }
          cs.forEach(function (cc) { if (near.indexOf(cc.id) < 0) h += stRowHtml(cc); });
        }
      }
      list.innerHTML = h;
      var foot = '';
      if (ok && sv.n) foot = st.stConf === '*' ? '<div class="gm-warn">Delete all street maps from this phone? You can save them again later with a connection.</div><div class="gm-btns"><button class="btn danger" data-gm="st-delall-yes">Yes, delete all</button><button class="btn" data-gm="st-delall-no">Keep them</button></div>' : '<div class="gm-btns"><button class="btn" data-gm="st-delall">Delete all street maps</button></div>';
      q('gm-st-foot').innerHTML = foot;
      if (st.stHi && !st.stHiDone) { c = q('gm-cr-' + st.stHi); if (c) { st.stHiDone = true; try { c.scrollIntoView({ block: 'center' }); } catch (err) { /* ignore */ } } }
    }
    function openStreets(hi) {
      st.stHi = hi || ''; st.stHiDone = false; st.stQ = ''; st.stConf = ''; st.stBulk = null; st.tall = true;
      st.stScreen = onScreenIds(); st.stNear = nearIds();
      openMode('streets');
      strVerify(); strEstimate();
    }
    function onDlEvent(kind) {
      if (!alive) return;
      if (kind === 'progress') stProgress(); else { stUpdate(); renderStatus(); stProgress(); }
    }
    function stDownload(ids) {
      if (!ids.length) return;
      if (navigator.onLine === false) { App.toast('You are offline. Connect to the internet to save street maps.', 4000); return; }
      DL.on = onDlEvent; DL.say = function (m) { if (alive) App.toast(m, 4500); };
      dlStart(ids); stUpdate(); renderStatus();
    }

    function setCompact() {
      var c = !!(st.mode || st.pick || !resBox.hidden);
      root.classList.toggle('gm-compact', c);
      layoutVars();
    }
    function closeResults() { resBox.hidden = true; setCompact(); }
    function hidePanel() { var was = st.mode; st.mode = ''; panel.hidden = true; st.tall = false; panel.classList.remove('tall'); st.stConf = ''; st.stBulk = null; renderRouteBar(); setCompact(); if (SAVE.phase === 'run' || was === 'streets' || dlBusy()) renderStatus(); scheduleStChip(); }
    function openMode(mode) { st.mode = mode; closeResults(); renderPanel(); }
    function head(icon, title, sub) {
      return '<div class="gm-head"><span class="gm-ico">' + icon + '</span><div class="gm-ttl"><h2>' + e(title) + '</h2>' + (sub ? '<div class="gm-sub">' + e(sub) + '</div>' : '') + '</div><button class="gm-x" data-gm="close" aria-label="Close">✕</button></div>';
    }
    function sheetHtml(it) {
      var county = nameCounty(it), sub = it.type + (it.near ? ' near ' + it.near : '') + (county ? ' · ' + county : ''), h = head(it.icon || '📍', it.name, sub), pills = '';
      if (it.flags & 1) pills += '<span class="gm-pill">Open 24 hours</span>';
      if (it.flags & 2) pills += '<span class="gm-pill er">Emergency room</span>';
      if (pills) h += '<div class="gm-badges">' + pills + '</div>';
      if (it.addr) h += '<p>' + e(it.addr) + '</p>';
      if (it.kind === 'street') h += '<p class="muted">This pin is on the street, at the point of that street nearest to the middle of the map.' + (it.hn ? ' House numbers are not in the map data, so it is not at the address.' : '') + '</p>';
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
        var msg = r.reason === 'noroad' ? 'There is no road in this app near your ' + (r.side === 'start' ? 'start point' : 'destination') + '. Try a point closer to a road.'
          : r.reason === 'disconnected' ? 'No road connection found between these points in the app’s road data. Try a point nearer a main road.'
            : r.reason === 'same' ? 'The start and the destination are the same place.'
              : r.reason === 'noroads' ? 'The highway data has no roads in it.' : 'Something went wrong while finding the route. Try again.';
        return h + '<div class="gm-warn">' + e(msg) + '</div>' + ends + '<div class="gm-note">' + e(SAFETY) + '</div>';
      }
      if (r.dist < 100) {
        return h + '<div class="gm-warn">These two places are about ' + e(fmtBoth(hav(r.from.x, r.from.y, r.to.x, r.to.y))) + ' apart in a straight line and are closest to the same part of the road network, so there is no route to show. ' + e(OFFNET) + '</div>' + ends + '<div class="gm-note">' + e(SAFETY) + '</div>';
      }
      h += '<div class="gm-sum"><div class="big">' + e(fmtBoth(r.dist)) + '</div><div class="kk">About ' + e(fmtTime(r.time)) + (r.streets ? ' of driving' : ' of highway driving') + '</div>' +
        '<div class="muted">A rough estimate: it does not include traffic, closures, weather or the parts off the mapped roads.</div></div>';
      h += ends;
      var mi = 15 * 1609.344;
      if (r.a.d > mi) h += '<div class="gm-warn">Your start point is about ' + e(fmtBoth(r.a.d)) + ' from the nearest ' + (r.streets || r.cov.a ? 'mapped road' : 'highway') + ' in this app. The route begins at the nearest road point. If water or rough country lies in between, you may not be able to get there.</div>';
      if (r.b.d > mi) h += '<div class="gm-warn">Your destination is about ' + e(fmtBoth(r.b.d)) + ' from the nearest ' + (r.streets || r.cov.b ? 'mapped road' : 'highway') + ' in this app. The route ends at the nearest road point. If water or rough country lies in between, you may not be able to get there.</div>';
      ['a', 'b'].forEach(function (sd) { var ht = r.hint && r.hint[sd]; if (ht && !(sd === 'b' && r.hint.a && r.hint.a.id === ht.id)) h += '<div class="gm-btns"><button class="btn" data-gm="st-county" data-c="' + e(ht.id) + '">Save street maps for ' + e(ht.name) + ' County for street-level directions</button></div>'; });
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
    function satInfoHtml() {
      return '<h3>Satellite view</h3>' +
        '<div class="gm-btns"><button class="btn primary" id="gm-sat-info" data-gm="sat">' + (satOn ? 'Back to the normal map' : 'Show satellite pictures') + '</button></div>' +
        '<div class="gm-satbox" id="gm-satbox"></div>' +
        '<ul><li>The pictures come from the US Geological Survey (USGS National Map, USDA imagery) over the internet. They only show with a connection, unless you save an area first.</li>' +
        '<li>The photos were taken in recent years, not live, and the date is different from place to place. They show the ground, not current conditions: fire, flood, snow, closures and damage may not show.</li>' +
        '<li>To use satellite with no signal: zoom to the area you need, tap <b>Save this area for offline</b>, check the size, then tap <b>Start saving</b>. Pictures you have already looked at are kept on this device too.</li>' +
        (palKey === 'night' ? '<li>In red night mode the pictures are dimmed and shown in red.</li>' : '') + '</ul>';
    }
    function streetsInfoHtml() {
      var h = '<h3>Street maps</h3>';
      if (!strUsable()) return h + '<p>Street maps (local streets and street names, one download per county) are not available here: ' + (STR.idxState === 'err' ? 'their list could not load. Connect to the internet once and open the map again.' : STR.idxState === 'loading' || STR.idxState === 'idle' ? 'their list is still loading.' : 'they need the installed app.') + ' Highways and main roads are always in the map.</p>';
      var mn = Infinity, mx = 0, tot = 0; STR.idx.counties.forEach(function (c) { if (c.bytes < mn) mn = c.bytes; if (c.bytes > mx) mx = c.bytes; tot += c.bytes; });
      h += '<p>Highways and main roads are always in this map, with nothing to download. Street maps are optional extras: for each county you save, the map shows local streets and their names, and directions go street by street.</p>' +
        '<div class="gm-btns"><button class="btn primary" data-gm="streets">Open street maps</button></div><ul>' +
        '<li><b>To save a county:</b> tap <b>Streets</b>, find the county, tap <b>Download</b>. You need a connection once. After that the streets work with no signal and stay on this phone.</li>' +
        '<li>A county takes between ' + e(fmtSz(mn)) + ' and ' + e(fmtSz(mx)) + ' on your phone (all of California: about ' + e(fmtSz(tot)) + '). The download is smaller than that.</li>' +
        '<li>Streets are only known for the counties you saved. Everywhere else the map has highways and main roads only.</li>' +
        '<li>There are no house numbers: you can look up a street by name, not an address.</li>' +
        '<li>No closures, detours, one-way changes, construction, fire, flood or snow.</li>' +
        '<li>The streets come from OpenStreetMap volunteers. Private roads and gated areas are left out, and new streets may be missing.</li></ul>' +
        '<p class="muted">Street data date: <b>' + e(STR.idx.updated || 'unknown') + '</b>.</p>';
      return h;
    }
    function infoHtml() {
      var meta = NS.meta || {}, h = head('ⓘ', 'About this map', '');
      h += streetsInfoHtml();
      h += satInfoHtml();
      h += '<h3>How to use it</h3><ul><li>Drag to move. Pinch, double-tap, or use + and − to zoom. The CA button shows all of California.</li><li>Tap an icon or a town name for details. Tap empty ground to drop a pin.</li>' +
        '<li><b>Directions</b>: tap a start, then a destination. <b>Nearest…</b> finds the closest hospital, fuel and more.</li><li>The numbers in the corner are the latitude and longitude of the middle of the map. They are useful on a radio or for rescuers.</li></ul>';
      h += '<h3>Legend</h3><div class="gm-leg' + (satOn ? ' sat' : '') + '">';
      LAYERS.forEach(function (L) { h += '<span class="ic">' + L.icon + '</span><span>' + e(L.one) + (L.id === 'hospital' ? ' (red cross)' : L.id === 'urgent' ? ' (round, cross)' : '') + '</span>'; });
      h += '<span class="ic">🛣️</span><span>Landmarks use their own icons: peaks, passes, parks, dams and more.</span>';
      h += '<span><span class="gm-sw r0"></span></span><span>Freeway</span><span><span class="gm-sw r1"></span></span><span>Major divided highway</span><span><span class="gm-sw r2"></span></span><span>State or US highway</span><span><span class="gm-sw r3"></span></span><span>Other main road</span><span><span class="gm-sw s1"></span></span><span>Main street (with saved street maps)</span><span><span class="gm-sw s2"></span></span><span>Local street (with saved street maps)</span><span><span class="gm-sw rt"></span></span><span>Your route</span><span class="gm-satonly"><span class="gm-sw dl"></span></span><span class="gm-satonly">County and state lines (dashed, on satellite pictures)</span></div>';
      h += '<h3>What it does not have</h3><ul><li>No local streets until you save street maps for a county (tap Streets). Without them: highways and main roads only. No house numbers.</li><li>No live traffic, closures, fire, flood, snow or chain controls.</li><li>It may be out of date. Hospitals and businesses move or close. Call first when you can.</li></ul>';
      var mo = /^(\d{4})-(\d{2})/.exec(meta.updated || ''), months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      h += '<h3>About the data</h3><p>Built from OpenStreetMap volunteers’ data (' + e(mo ? months[+mo[2] - 1] + ' ' + mo[1] : 'date unknown') + '). It is not complete: some hospitals, vets, stores, roads and streets are missing or out of date.</p>';
      h += '<p class="muted">Map data date: <b>' + e(meta.updated || 'unknown') + '</b>.</p><p class="muted">' + e(ATTRIBUTION) + '</p><p class="muted">' + e(meta.sources || '') + '</p>';
      return h + '<div class="gm-note">' + e(SAFETY) + '</div>';
    }
    function renderPanel() {
      var h = '';
      if (st.mode === 'sheet' && st.sel) h = sheetHtml(st.sel);
      else if (st.mode === 'route') h = routeHtml();
      else if (st.mode === 'near') h = nearHtml();
      else if (st.mode === 'info') h = infoHtml();
      else if (st.mode === 'streets') h = stShell();
      else { hidePanel(); return; }
      pb.innerHTML = h; pb.scrollTop = 0;
      if (st.mode === 'info') { satBoxUpdate(); refreshSaved(); }
      if (st.mode === 'streets') { stUpdate(); renderStatus(); }
      if (SAVE.phase === 'run') renderStatus(); // the saving card in the status row hides while the info panel shows its own progress
      panel.hidden = false; panel.classList.toggle('tall', st.tall && (st.mode === 'route' || st.mode === 'streets'));
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
      var h = '<h1>Grid Down Guide: ' + (r.streets ? 'directions' : 'highway directions') + '</h1><div class="kv2"><b>From:</b> ' + e(r.from.name) + ' (' + e(fmtLL(r.from.x, r.from.y)) + ')</div><div class="kv2"><b>To:</b> ' + e(r.to.name) + ' (' + e(fmtLL(r.to.x, r.to.y)) + ')</div>' +
        '<div class="kv2"><b>' + (r.streets ? 'Distance:' : 'Highway distance:') + '</b> ' + e(fmtBoth(r.dist)) + '</div><div class="kv2"><b>Estimated driving time:</b> about ' + e(fmtTime(r.time)) + ' (rough estimate: no traffic, closures or weather)</div>' +
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
    function flyZoomFor(it) { return it.kind === 'street' ? 16 : it.kind === 'poi' ? 13 : it.kind === 'county' ? 8.2 : it.kind === 'place' ? [10, 11, 12, 13][['City', 'Town', 'Village', 'Hamlet'].indexOf(it.type)] : 13; }
    function itemFromEntry(i) {
      var ty = SI.type[i], src = SI.src[i];
      if (ty === 0) { var c = DS.base.counties[src]; return { kind: 'county', name: c.n + ' County', x: c.lx, y: c.ly, type: 'County', icon: '📍' }; }
      if (ty <= 4) return placeItem(src);
      return poiItem(LAYERS[ty - 10].id, src);
    }
    function streetItem(m) { // a street found by name: the point is the part of that street nearest to where the search started
      var R = DS.roads, nm = R && R.labels[m.lab] ? R.labels[m.lab] : 'Street';
      return { kind: 'street', name: nm, x: m.x, y: m.y, type: 'Street', icon: '🛣️', hn: !!m.hn, near: nearestPlaceName(m.x, m.y) };
    }
    function renderResults(v) {
      var h = '', ref = refPoint();
      st.results.forEach(function (m, n) {
        var it = m.s ? streetItem(m) : itemFromEntry(m.i), cty = it.kind === 'county' ? '' : countyAt(it.x, it.y), d = hav(ref.x, ref.y, it.x, it.y);
        var sb = it.type + (it.near ? ' near ' + it.near : '') + (cty ? ' · ' + cty + ' County' : '') + ' · ' + fmtDist(d) + ' ' + c8(brg(ref.x, ref.y, it.x, it.y));
        h += '<button class="gm-res" data-gm="result" data-i="' + n + '"><span class="ic">' + e(it.icon) + '</span><span class="tx"><span class="nm">' + e(it.name) + '</span><span class="sb">' + e(sb) + '</span>' + (m.hn ? '<span class="sb">House numbers are not in the data</span>' : '') + '</span></button>';
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
      ensureStreetIndex(function () { if (alive && qin.value.trim()) runSearch(qin.value); });
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
      var it = m.s ? streetItem(m) : itemFromEntry(m.i);
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
        case 'info': if (st.mode === 'info') hidePanel(); else { if (SAVE.phase !== 'run') { SAVE.phase = 'idle'; SAVE.list = null; SAVE.msg = ''; } SAVED.confirm = false; openMode('info'); } break;
        case 'sat': setSat(!satOn); break;
        case 'streets': openStreets(''); break;
        case 'st-county': openStreets(el.getAttribute('data-c') || ''); break;
        case 'st-chip-x': st.stHide[el.getAttribute('data-c')] = 1; st.stc = null; st.stcSig = ''; renderStatus(); break;
        case 'st-dl': stDownload([el.getAttribute('data-c')]); break;
        case 'st-cancel': dlCancel(el.getAttribute('data-c')); stUpdate(); renderStatus(); break;
        case 'st-cancel-all': Object.keys(DL.per).forEach(function (k) { dlCancel(k); }); stUpdate(); renderStatus(); break;
        case 'st-del': st.stConf = el.getAttribute('data-c'); stUpdate(); break;
        case 'st-del-no': st.stConf = ''; stUpdate(); break;
        case 'st-del-yes': { var dc = el.getAttribute('data-c'); st.stConf = ''; strDelete(dc).then(function () { if (alive) { stUpdate(); renderStatus(); renderChips(); App.toast('Street maps deleted'); } }); stUpdate(); break; }
        case 'st-bulk': st.stBulk = 'confirm'; stUpdate(); break;
        case 'st-bulk-no': st.stBulk = null; stUpdate(); break;
        case 'st-bulk-yes': { var bids = st.stScreen.filter(function (k) { return !DL.per[k] && strStatus(k).s !== 'saved'; }); st.stBulk = null; stDownload(bids); break; }
        case 'st-delall': st.stConf = '*'; stUpdate(); break;
        case 'st-delall-no': st.stConf = ''; stUpdate(); break;
        case 'st-delall-yes': st.stConf = ''; strDeleteAll().then(function () { if (alive) { stUpdate(); renderStatus(); renderChips(); App.toast('All street maps deleted'); } }); stUpdate(); break;
        case 'sat-ok': { var after = dlgAfter; prefs().satOk = 1; App.save(); closeDlg(); if (after) after(); break; }
        case 'dlg-no': closeDlg(); break;
        case 'dlg-bk': if (ev.target === el) closeDlg(); break;
        case 'sat-save': if (prefs().satOk !== 1) showSatNotice(startSavePlan, 'Continue'); else startSavePlan(); break;
        case 'sat-go': runSave(); break;
        case 'sat-no2': SAVE.phase = 'idle'; SAVE.list = null; SAVE.msg = ''; satBoxUpdate(); break;
        case 'sat-cancel': cancelSave(); break;
        case 'sat-del': SAVED.confirm = true; satBoxUpdate(); break;
        case 'sat-del-no': SAVED.confirm = false; satBoxUpdate(); break;
        case 'sat-del-yes': deleteSaved(); break;
        case 'sat-retry': satRetry(); renderStatus(); break;
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
        case 'share': if (st.route && st.route.ok && navigator.share) { try { navigator.share({ title: st.route.streets ? 'Directions' : 'Highway directions', text: routeText(st.route) }).catch(function () { /* cancelled */ }); } catch (err) { /* ignore */ } } break;
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
        var z = clamp(g.z0 + Math.log(d / g.d0) / Math.LN2, zMin, zMax), sc = 256 * Math.pow(2, z);
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
      if (st.dlg) { // a dialog is open: Escape cancels, Tab stays inside it
        if (ev.key === 'Escape') { closeDlg(); ev.preventDefault(); }
        else if (ev.key === 'Tab') {
          var m = q('gm-modal'), bs = m ? m.querySelectorAll('button') : [];
          if (bs.length) {
            var f0 = bs[0], l0 = bs[bs.length - 1], ae = document.activeElement;
            if (!m.contains(ae) || (ev.shiftKey && ae === f0)) { l0.focus(); ev.preventDefault(); } else if (!ev.shiftKey && ae === l0) { f0.focus(); ev.preventDefault(); }
          }
        }
        return;
      }
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
    on(root, 'input', function (ev) { var t2 = ev.target; if (t2 && t2.id === 'gm-st-q') { st.stQ = t2.value; st.stHi = ''; stUpdate(); } });
    on(qin, 'focus', function () { if (qin.value.trim() && !resBox.hidden === false && st.results.length) { resBox.hidden = false; setCompact(); } });
    on(qin, 'keydown', function (ev) { if (ev.key === 'Enter') { ev.preventDefault(); clearTimeout(T.q); if (qin.value.trim()) { runSearch(qin.value); if (st.results.length) chooseResult(0); } } });
    on(document, 'keydown', onDocKey);
    on(window, 'resize', resize); on(window, 'orientationchange', function () { setTimeout(resize, 120); });
    on(window, 'online', function () { if (satOn) { satRetry(); renderStatus(); } }); // the connection is back: try the pictures that could not load
    on(window, 'offline', function () { if (satOn) invalidate(); });
    if (mq && mq.addEventListener) on(mq, 'change', function () { palKey = ''; invalidate(); });
    var ro = null;
    if (window.ResizeObserver) {
      ro = new ResizeObserver(function () { resize(); });
      ro.observe(root); ro.observe(panel); ro.observe(top);
      var hdr = document.querySelector('header.top'), tabs = document.getElementById('tabs');
      if (hdr) ro.observe(hdr); if (tabs) ro.observe(tabs);
    }
    var lastMerge = STR.merges;
    var listener = function () {
      if (!alive) return;
      BC.valid = false; BL.valid = false; setZMax(); renderStatus(); renderChips(); ensureIndex(); ensureStreetIndex(); invalidate(); strSync(); scheduleStChip();
      if (st.mode === 'streets') stUpdate();
      if (st.mode === 'route' || st.mode === 'near') renderPanel();
      if (lastMerge !== STR.merges) { // the street set changed: routes found before may now have a better way
        lastMerge = STR.merges;
        if (st.start && st.end && ST.roads === 'ok' && !st.routing) { if (st.route && st.route.ok) st.route = null; computeRoute(); }
      }
      if (!st.route && st.start && st.end && ST.roads === 'ok' && st.mode === 'route' && !st.routing) computeRoute();
    };
    LISTEN.push(listener);

    /* ---------- start ---------- */
    satOn = satWanted(); satUi();
    renderStatus(); renderChips();
    resize();
    if (ST.base === 'idle') loadAll();
    else { if (ST.base === 'err' || ST.places === 'err' || ST.pois === 'err' || ST.roads === 'err') retryFailed(); }
    ensureIndex();
    setZMax();
    DL.on = onDlEvent; STR.failedSig = null; // a loading failure is tried again each time the map opens
    if (STR.idxState === 'err') STR.idxP = null; // try the list again each time the map opens
    strLoadIndex().then(function () { if (alive) { setZMax(); renderChips(); renderStatus(); strSync(); } });
    strSync();
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
      alive: function () { return alive; }, BC: BC, TIMES: TIMES,
      str: { STR: STR, DL: DL, SS: SS, status: strStatus, sync: strSync, verify: strVerify, start: function (ids) { return dlStart(ids); }, del: strDelete, delAll: strDeleteAll, merge: function () { return STR.last; }, open: openStreets,
        tune: function (j) { ST_JUNC = j; STR.sig = 'x'; strSync(); }, chip: function () { return st.stc; }, checkChip: checkStChip, onScreen: onScreenIds, near: nearIds, zMax: function () { return zMax; }, saved: savedMap, names: function () { return SC.length; }, scand: function () { return SC; } },
      sat: { // satellite view test handles (the opts object is a test switch: opts.maxLevel lowers the deepest tile level)
        on: function () { return satOn; }, opts: SATO, slots: function () { return PLAN.slots.slice(0, PLAN.n).map(function (s) { return { L: PLAN.L, tx: s.tx, ty: s.ty, l: s.l, t: s.t, w: s.w, h: s.h, kind: s.kind }; }); }, stats: SAT.stats, save: SAVE, saved: SAVED, level: tileLevel, plan: areaPlan, box: areaBox,
        state: function () { return { mem: SAT.mem.size, pend: SAT.pend.size, queued: SAT.queue.length, inflight: SAT.inflight, bad: SAT.bad.size, chip: SAT.chip, missing: SAT.missing, level: PLAN.L, holes: PLAN.holes, slots: PLAN.n, gen: SAT.gen }; }
      }
    };
    INST = { api: api };

    return function cleanup() {
      alive = false;
      if (raf) cancelAnimationFrame(raf); raf = 0;
      Object.keys(T).forEach(function (k) { clearTimeout(T[k]); });
      if (st.watch !== null && navigator.geolocation) { try { navigator.geolocation.clearWatch(st.watch); } catch (err) { /* ignore */ } st.watch = null; }
      undo.forEach(function (f) { try { f(); } catch (err) { /* ignore */ } });
      if (ro) ro.disconnect();
      SAVE.tok++; SAVE.stop = true; if (SAVE.ac) { try { SAVE.ac.abort(); } catch (err) { /* ignore */ } } SAVE.ac = null; // leaving the screen stops saving and every picture request
      satReset(); closeDlg();
      STR.tok++; dlAbortAll(); // leaving the screen stops loading and downloading street maps, and removes anything half saved
      BC.cv = BC.cx = null; BC.valid = false; BL.cv = BL.cx = null; BL.valid = false;
      var i = LISTEN.indexOf(listener); if (i >= 0) LISTEN.splice(i, 1);
      saveView();
      html.classList.remove('gm-lock');
      if (INST && INST.api === api) INST = null;
    };
  }

  App.homeBlock(function () { return '<a class="start-card" href="#/map">🗺 <b>California map &amp; directions</b><small>Hospitals, vets, groceries, fuel, and routes between cities. Save a county for street-level directions. Works with no signal</small></a>'; });
  App.mapTest = function () { return INST ? INST.api : null; }; // read-only handle for automated tests
  App.register('map', function (parts, params) {
    return { title: 'California Map', back: true, tab: 'more', html: viewHtml(), after: function () { return mount(params); } };
  });
});

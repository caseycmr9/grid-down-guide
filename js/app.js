/* Grid Down Guide — app logic. Hash-routed single page app, no dependencies, fully offline. */
(function () {
  'use strict';

  var MD = window.MD;
  var e = MD.esc;
  var $ = function (s, el) { return (el || document).querySelector(s); };
  var $$ = function (s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); };

  var CATS = window.CATEGORIES || [];
  var ARTS = window.ARTICLES || [];
  var byId = {}, byCat = {}, catById = {};
  CATS.forEach(function (c) { catById[c.id] = c; byCat[c.id] = []; });
  ARTS.forEach(function (a) { byId[a.id] = a; (byCat[a.cat] = byCat[a.cat] || []).push(a); });

  /* ---------------- state ---------------- */
  var KEY = 'gdg.v1';
  function loadState() { try { var r = localStorage.getItem(KEY); return r ? JSON.parse(r) : {}; } catch (err) { return {}; } }
  var S = Object.assign({
    size: 100, theme: 'auto', saved: [], recent: [], checks: {}, timers: [], frost: {}, intro: false, keepAwake: false,
    region: 'us', units: 'us', hazards: [], card: null, inv: [], plan: { people: 2, foodDays: 0 }, maint: {}, crisis: { read: true, rate: 1, breaths: false }
  }, loadState());
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (err) { /* storage unavailable: app still works */ } }

  /* Regions: emergency numbers and units. Article text is written for the US; "911" is swapped for the local number. */
  var REGIONS = {
    us: { name: 'United States', emerg: '911', also: '', lines: [['☠️', 'Poison Control', '1-800-222-1222', '18002221222'], ['💬', '988 Crisis line', '988', '988']] },
    ca: { name: 'Canada', emerg: '911', also: '', lines: [['☠️', 'Poison Centre', '1-844-764-7669', '18447647669'], ['💬', '9-8-8 Crisis line', '988', '988']] },
    uk: { name: 'United Kingdom', emerg: '999', also: '112 also works', lines: [['📞', 'NHS 111 (urgent advice, poisoning)', '111', '111'], ['💬', 'Samaritans', '116 123', '116123']] },
    ie: { name: 'Ireland', emerg: '112', also: '999 also works', lines: [['💬', 'Samaritans', '116 123', '116123']] },
    au: { name: 'Australia', emerg: '000', also: '112 works from mobiles', lines: [['☠️', 'Poisons Information', '13 11 26', '131126'], ['💬', 'Lifeline', '13 11 14', '131114']] },
    nz: { name: 'New Zealand', emerg: '111', also: '', lines: [['☠️', 'National Poisons Centre', '0800 764 766', '0800764766'], ['💬', 'Need to talk? (call or text)', '1737', '1737']] },
    eu: { name: 'European Union', emerg: '112', also: '', lines: [['☠️', 'Poison centre', 'look up yours and write it on your Emergency Card', '']] },
    other: { name: 'Somewhere else', emerg: '112', also: 'works on most mobile phones worldwide', lines: [['☠️', 'Poison centre', 'look up yours and write it on your Emergency Card', '']] }
  };
  function region() { return REGIONS[S.region] || REGIONS.us; }

  /* Extension points for the feature modules (crisis.js, personal.js, share.js): extra routes, home-page blocks, button actions */
  var EXT = {}, ACTIONS = {}, EXTRAS = { home: [] };
  function localize(html) { var r = region(); return r.emerg === '911' ? html : html.replace(/\b911\b/g, r.emerg); }

  function applyPrefs() {
    document.documentElement.style.fontSize = S.size + '%';
    if (S.theme === 'auto') document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme', S.theme);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', S.theme === 'night' ? '#000000' : S.theme === 'dark' ? '#18201a' : '#2d6a3e');
  }

  /* ---------------- toast, wake lock ---------------- */
  var toastTimer = null;
  function toast(msg, ms, actionLabel, action) {
    var t = $('#toast');
    t.innerHTML = e(msg) + (actionLabel ? '<button type="button" id="toast-act">' + e(actionLabel) + '</button>' : '');
    t.hidden = false;
    if (actionLabel) $('#toast-act').onclick = function () { t.hidden = true; if (action) action(); };
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.hidden = true; }, ms || 3000);
  }

  var wakeSentinel = null, wakeWanted = false;
  function wake(on) {
    wakeWanted = !!on || S.keepAwake;
    if (!wakeWanted) { if (wakeSentinel) { try { wakeSentinel.release(); } catch (err) {} wakeSentinel = null; } return; }
    if (!('wakeLock' in navigator) || wakeSentinel) return;
    navigator.wakeLock.request('screen').then(function (s) { wakeSentinel = s; s.addEventListener('release', function () { wakeSentinel = null; }); }).catch(function () {});
  }
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible' && wakeWanted) wake(true); });

  /* ---------------- search ---------------- */
  var INDEX = ARTS.map(function (a) {
    var raw = MD.plain(a.body || '');
    return { a: a, title: a.title.toLowerCase(), sum: (a.summary || '').toLowerCase(), tags: (a.tags || []).join(' ').toLowerCase(), body: raw.toLowerCase(), raw: raw };
  });
  function count(hay, needle, cap) { var n = 0, i = -1; while ((i = hay.indexOf(needle, i + 1)) > -1) { if (++n >= cap) break; } return n; }
  function variants(t) {
    var v = [t];
    if (t.length > 3) {
      if (/ies$/.test(t)) v.push(t.slice(0, -3) + 'y');
      else if (/es$/.test(t)) v.push(t.slice(0, -2));
      if (/s$/.test(t)) v.push(t.slice(0, -1));
      if (/ing$/.test(t) && t.length > 5) v.push(t.slice(0, -3));
    }
    return v;
  }
  function search(q) {
    var toks = q.toLowerCase().replace(/[^a-z0-9\s'-]/g, ' ').split(/\s+/).filter(Boolean).slice(0, 6);
    if (!toks.length) return { toks: toks, hits: [] };
    var out = [];
    INDEX.forEach(function (ix) {
      var score = 0;
      for (var i = 0; i < toks.length; i++) {
        var vs = variants(toks[i]), s = 0;
        for (var j = 0; j < vs.length; j++) {
          var v = vs[j];
          if (ix.title.indexOf(v) > -1) s = Math.max(s, 12);
          else if (ix.tags.indexOf(v) > -1) s = Math.max(s, 8);
          else if (ix.sum.indexOf(v) > -1) s = Math.max(s, 5);
          else { var c = count(ix.body, v, 4); if (c) s = Math.max(s, c); }
        }
        if (!s) return;
        score += s;
      }
      if (ix.a.priority) score += 1;
      out.push({ ix: ix, score: score });
    });
    out.sort(function (a, b) { return b.score - a.score; });
    return { toks: toks, hits: out.slice(0, 60) };
  }
  function snippet(ix, toks) {
    var low = ix.body, pos = -1;
    for (var i = 0; i < toks.length && pos < 0; i++) {
      var vs = variants(toks[i]);
      for (var j = 0; j < vs.length; j++) { var p = low.indexOf(vs[j]); if (p > -1 && (pos < 0 || p < pos)) pos = p; }
    }
    if (pos < 0) return e(ix.a.summary || '');
    var from = Math.max(0, pos - 50), to = Math.min(ix.raw.length, pos + 110);
    var s = (from > 0 ? '…' : '') + ix.raw.slice(from, to).replace(/\s+/g, ' ') + (to < ix.raw.length ? '…' : '');
    var re = new RegExp('(' + toks.map(function (t) { return variants(t).join('|'); }).join('|').replace(/[.*+?^${}()[\]\\]/g, '\\$&') + ')', 'gi');
    return e(s).replace(re, '<mark>$1</mark>');
  }

  /* ---------------- reusable fragments ---------------- */
  function ctxFor(id) { return { articleId: id, titleOf: function (i) { return byId[i] ? byId[i].title : i; } }; }
  function catTile(c) {
    return '<a class="tile" href="#/c/' + c.id + '"><div class="ic">' + c.icon + '</div><div class="tt">' + e(c.title) + '</div><div class="bl">' + e(c.blurb) + '</div></a>';
  }
  function artRow(a, showCat) {
    var c = catById[a.cat];
    return '<a href="#/a/' + a.id + '"><div class="t">' + e(a.title) + (a.priority ? '<span class="flag">★ KEY</span>' : '') + '</div><div class="s">' + e(a.summary || '') + '</div>' +
      (showCat && c ? '<div class="m">' + c.icon + ' ' + e(c.title) + '</div>' : '') + '</a>';
  }
  function searchBox(q) {
    return '<form id="sform" class="noprint" action="#"><input class="search" id="q" type="search" enterkeyhint="search" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Search everything (burn, bleach, canning…)" value="' + e(q || '') + '"></form>';
  }
  function emptyState(msg) { return '<div class="card muted">' + msg + '</div>'; }

  /* ---------------- views ---------------- */
  var QUICK = [
    ['Medical emergencies', [
      ['❤️', 'Not breathing / no response', 'cpr'], ['😮', 'Choking', 'choking'], ['🔴', 'Heavy bleeding', 'severe-bleeding'],
      ['😨', 'Shock (pale, clammy, confused)', 'shock'], ['💔', 'Chest pain or stroke signs', 'heart-stroke'],
      ['🤧', 'Severe allergic reaction', 'allergic-reaction'], ['☠️', 'Poisoning, overdose, carbon monoxide', 'poisoning-overdose'],
      ['🔥', 'Burn', 'burns'], ['🦴', 'Broken bone or bad sprain', 'fractures-sprains'], ['🧠', 'Head, neck or back injury', 'head-spine-injury'],
      ['🥶', 'Too cold: hypothermia, frostbite', 'hypothermia-frostbite'], ['🥵', 'Too hot: heat stroke', 'heat-illness'],
      ['🐍', 'Snake, spider, insect or animal bite', 'bites-stings'], ['🤰', 'A baby is coming', 'childbirth'],
      ['💧', 'Dehydration, vomiting, diarrhea', 'dehydration-ors']
    ]],
    ['Survival situations', [
      ['⚡', 'The power is out', 'power-outage-basics'], ['🚰', 'Need safe drinking water', 'water-safety'], ['🧪', 'Treat water with bleach', 'chemical-disinfection'],
      ['🏕️', 'Need shelter now', 'emergency-shelters'], ['🔥', 'Need to make a fire', 'fire-starting'], ['🧭', 'I am lost', 'lost-procedure'],
      ['📡', 'Signal for rescue', 'signaling-rescue'], ['🚽', 'No working toilets', 'human-waste'], ['🧯', 'Fire in the house', 'fire-safety']
    ]],
    ['Disaster happening now', [
      ['🌪️', 'Tornado or severe storm', 'severe-storms-tornado'], ['🌊', 'Flood', 'flood'], ['🏚️', 'Earthquake', 'earthquake'],
      ['🔥', 'Wildfire', 'wildfire'], ['❄️', 'Blizzard or deep cold', 'winter-storm'], ['☢️', 'Nuclear or radiation emergency', 'radiation-nuclear'],
      ['☣️', 'Chemical spill or gas leak', 'chemical-hazmat'], ['🚗', 'Need to evacuate', 'evacuation']
    ]]
  ];

  function viewHome() {
    var recent = S.recent.map(function (id) { return byId[id]; }).filter(Boolean).slice(0, 3);
    var h = '<div class="hero"><h1>Grid Down Guide</h1><p class="muted">Offline survival &amp; preparedness handbook. Everything here works with no internet and no power grid.</p></div>';
    h += searchBox('');
    h += '<a class="sos-btn" href="#/emergency"><span class="big-ic">🚨</span><span>EMERGENCY<small>Someone hurt? Need help now? Tap here.</small></span></a>';
    if (window.GDG_CRISIS && window.GDG_CRISIS.length) h += '<a class="start-card step-card" href="#/crisis">▶ <b>Step-by-step help</b><small>CPR, choking, bleeding and more: one big step at a time, can read aloud</small></a>';
    EXTRAS.home.forEach(function (fn) { try { h += fn() || ''; } catch (err) { console.error(err); } });
    if (byId['grid-down-timeline']) h += '<a class="start-card" href="#/a/grid-down-timeline">⚡ <b>The power is out. What now?</b><small>Hour-by-hour plan for the first day, week and month</small></a>';
    if (byId['read-first']) h += '<a class="start-card" href="#/a/read-first">📘 <b>New here? Read this first</b><small>How to use the app and how to be ready</small></a>';
    h += '<h2 class="sec">Browse by topic</h2><div class="grid">' + CATS.filter(function (c) { return byCat[c.id] && byCat[c.id].length; }).map(catTile).join('') + '</div>';
    if (recent.length) h += '<h2 class="sec">Continue reading</h2><div class="list">' + recent.map(function (a) { return artRow(a, true); }).join('') + '</div>';
    h += '<h2 class="sec">Tools that work offline</h2><div class="grid">' +
      [['cpr', '❤️', 'CPR Metronome'], ['timers', '⏱️', 'Timers & Tourniquet Clock'], ['water', '💧', 'Water Treatment'], ['supplies', '📦', 'Supplies Calculator']].map(function (t) {
        return '<a class="tile" href="#/t/' + t[0] + '"><div class="ic">' + t[1] + '</div><div class="tt">' + t[2] + '</div></a>';
      }).join('') + '</div>';
    h += '<p class="muted" style="margin-top:1.5rem;font-size:.85rem">' + ARTS.length + ' guides · ' + (window.GDG_VERSION ? 'version ' + e(window.GDG_VERSION) : '') + '</p>';
    return { title: 'Grid Down Guide', back: false, tab: 'home', html: h, after: function () { bindSearchForm(); } };
  }

  function viewCategory(id) {
    var c = catById[id]; if (!c) return viewNotFound();
    var list = (byCat[id] || []);
    var h = '<h1 class="page-title">' + c.icon + ' ' + e(c.title) + '</h1><p class="page-sub">' + e(c.blurb) + ' · ' + list.length + ' guides</p>';
    h += '<div class="list">' + (list.map(function (a) { return artRow(a, false); }).join('') || emptyState('No guides in this section yet.')) + '</div>';
    return { title: c.title, back: true, tab: 'home', html: h };
  }

  var NOTES = {
    firstaid: 'First-aid guidance is not a substitute for hands-on training or professional medical care. If emergency services can be reached, call them. Take a first aid and CPR class when you can.',
    health: 'This is general information, not medical advice. Talk with a doctor about your own health needs and medications before a crisis.',
    forage: 'Never eat a wild plant or mushroom unless you are 100% certain what it is. Text cannot replace a printed field guide for your region and an experienced person.',
    preserve: 'Use only tested methods and current USDA / National Center for Home Food Preservation guidance for canning and curing.',
    hunt: 'Follow local laws in normal times. Cook game thoroughly and handle carcasses with gloves.',
    rebuild: 'Electricity, fire, heavy lifting, structures and hot metal can kill or maim. Start small, wear eye, ear and lung protection, never work alone, and follow local building and electrical codes. Have a qualified person check anything structural, electrical or involving a chimney before you rely on it.',
    health2: ''
  };

  function viewArticle(id) {
    var a = byId[id]; if (!a) return viewNotFound();
    var c = catById[a.cat] || { id: a.cat, title: a.cat, icon: '' };
    var list = byCat[a.cat] || [], idx = list.indexOf(a);
    var prev = idx > 0 ? list[idx - 1] : null, next = idx > -1 && idx < list.length - 1 ? list[idx + 1] : null;
    var hasChecks = /^\s*[-*]\s+\[[ xX]\]/m.test(a.body);
    var saved = S.saved.indexOf(id) > -1;
    var steps = (window.GDG_CRISIS || []).filter(function (s) { return s.article === id; });
    var rg = region();
    var h = '<article class="article">' +
      '<div class="crumb"><a href="#/c/' + c.id + '">' + c.icon + ' ' + e(c.title) + '</a></div>' +
      '<h1>' + e(a.title) + '</h1><p class="lede">' + e(a.summary || '') + '</p>' +
      steps.map(function (s) { return '<a class="btn danger big noprint step-link" href="#/crisis/' + s.id + '">▶ Step-by-step: ' + e(s.title) + '</a>'; }).join('') +
      (S.region !== 'us' && S.region !== 'ca' && (c.id === 'firstaid' || c.id === 'health' || c.id === 'disasters') ? '<div class="art-note noprint">Your region is set to ' + e(rg.name) + ': “911” below is shown as ' + e(rg.emerg) + '. Hotlines, medicine names and rules in this guide are mostly US; check what applies where you live.</div>' : '') +
      '<div class="art-actions noprint"><button class="btn small" data-act="save" data-id="' + id + '">' + (saved ? '★ Saved' : '☆ Save') + '</button>' +
      '<button class="btn small" data-act="print">🖨 Print</button>' +
      (hasChecks ? '<button class="btn small" data-act="resetchk" data-id="' + id + '">↺ Reset checklist</button>' : '') + '</div>' +
      localize(MD.render(a.body, ctxFor(id)));
    if (NOTES[a.cat]) h += '<div class="art-note">' + e(NOTES[a.cat]) + '</div>';
    h += '</article>';
    h += '<div class="pager noprint">' + (prev ? '<a href="#/a/' + prev.id + '"><small>← Previous</small>' + e(prev.title) + '</a>' : '<span style="flex:1"></span>') +
      (next ? '<a class="next" href="#/a/' + next.id + '"><small>Next →</small>' + e(next.title) + '</a>' : '<span style="flex:1"></span>') + '</div>';
    return {
      title: c.title, back: true, tab: 'home', html: h,
      after: function () {
        $$('input[data-chk]').forEach(function (cb) { cb.checked = !!S.checks[cb.getAttribute('data-chk')]; });
        S.recent = [id].concat(S.recent.filter(function (x) { return x !== id; })).slice(0, 12); save();
      }
    };
  }

  function viewSearch(q) {
    var h = searchBox(q) + '<div id="results"></div>';
    return {
      title: 'Search', back: false, tab: 'search', html: h,
      after: function () {
        bindSearchForm(true);
        var inp = $('#q'); if (!q) inp.focus();
        renderResults(q);
      }
    };
  }
  function renderResults(q) {
    var box = $('#results'); if (!box) return;
    q = (q || '').trim();
    if (!q) {
      box.innerHTML = '<h2 class="sec">Try searching for</h2><div class="btn-row">' +
        ['bleeding', 'burn', 'water purify', 'bleach', 'canning', 'hypothermia', 'fire', 'generator', 'diarrhea', 'chicken', 'seeds', 'radio'].map(function (w) { return '<a class="btn small" href="#/search?q=' + encodeURIComponent(w) + '">' + w + '</a>'; }).join('') + '</div>';
      return;
    }
    var r = search(q);
    box.innerHTML = r.hits.length
      ? '<p class="muted">' + r.hits.length + (r.hits.length === 60 ? '+' : '') + ' result' + (r.hits.length === 1 ? '' : 's') + '</p><div class="list">' +
        r.hits.map(function (h) {
          var c = catById[h.ix.a.cat];
          return '<a href="#/a/' + h.ix.a.id + '"><div class="t">' + e(h.ix.a.title) + (h.ix.a.priority ? '<span class="flag">★ KEY</span>' : '') + '</div><div class="s">' + snippet(h.ix, r.toks) + '</div>' + (c ? '<div class="m">' + c.icon + ' ' + e(c.title) + '</div>' : '') + '</a>';
        }).join('') + '</div>'
      : emptyState('Nothing found for “' + e(q) + '”. Try fewer or simpler words (for example “burn” instead of “burned hand”).');
  }
  function bindSearchForm(live) {
    var f = $('#sform'), inp = $('#q'); if (!f) return;
    f.addEventListener('submit', function (ev) { ev.preventDefault(); var q = inp.value.trim(); if (live) { renderResults(q); inp.blur(); } else location.hash = '#/search' + (q ? '?q=' + encodeURIComponent(q) : ''); });
    if (live) {
      var tm = null;
      inp.addEventListener('input', function () {
        clearTimeout(tm);
        tm = setTimeout(function () {
          var q = inp.value.trim();
          try { history.replaceState(null, '', '#/search' + (q ? '?q=' + encodeURIComponent(q) : '')); } catch (err) {}
          renderResults(q);
        }, 120);
      });
    }
  }

  function viewEmergency() {
    var rg = region();
    var h = '<h1 class="page-title" style="color:var(--danger)">🚨 Emergency</h1>' +
      '<p class="page-sub">Tap what is happening. Each guide starts with what to do first.</p>' +
      '<div class="callout danger"><div class="co-title">If you can call for help, do it first</div><div class="co-body">Call your local emergency number (' + e(rg.emerg) + ' in ' + e(rg.name) + '). Put the phone on speaker and keep helping while you talk.</div></div>' +
      '<div class="emg-num"><a href="tel:' + rg.emerg + '">📞 ' + e(rg.emerg) + '<small>Emergency' + (rg.also ? ' (' + e(rg.also) + ')' : '') + '</small></a>' +
      rg.lines.map(function (l) { return l[3] ? '<a href="tel:' + l[3] + '">' + l[0] + ' ' + e(l[1]) + '<small>' + e(l[2]) + '</small></a>' : '<a href="#/card">' + l[0] + ' ' + e(l[1]) + '<small>' + e(l[2]) + '</small></a>'; }).join('') + '</div>' +
      (window.GDG_CRISIS && window.GDG_CRISIS.length ? '<a class="sos-btn step-btn" href="#/crisis"><span class="big-ic">▶</span><span>STEP-BY-STEP HELP<small>One step at a time, huge text, can read aloud. CPR, choking, bleeding…</small></span></a>' : '') +
      '<div class="btn-row"><a class="btn danger" href="#/t/cpr">❤️ CPR metronome</a><a class="btn" href="#/t/timers">⏱️ Tourniquet clock</a><a class="btn" href="#/t/light">🔦 Light &amp; SOS</a></div>';
    QUICK.forEach(function (g) {
      var items = g[1].filter(function (q) { return byId[q[2]]; });
      if (!items.length) return;
      h += '<h2 class="sec">' + e(g[0]) + '</h2><div class="quick">' + items.map(function (q) { return '<a href="#/a/' + q[2] + '"><span class="ic">' + q[0] + '</span><span>' + e(q[1]) + '</span></a>'; }).join('') + '</div>';
    });
    var key = ARTS.filter(function (a) { return a.priority; });
    if (key.length) {
      h += '<h2 class="sec">All key guides</h2><div class="list">' + key.map(function (a) { return artRow(a, true); }).join('') + '</div>';
    }
    return { title: 'Emergency', back: false, tab: 'sos', html: h };
  }

  function viewTools() {
    var list = (window.GDG_TOOLS && window.GDG_TOOLS.list) || [];
    var h = '<h1 class="page-title">🧰 Tools</h1><p class="page-sub">Calculators and gadgets that work with no connection.</p><div class="list">' +
      list.map(function (t) { return '<a href="#/t/' + t.id + '"><div class="t">' + t.icon + ' ' + e(t.title) + '</div><div class="s">' + e(t.desc) + '</div></a>'; }).join('') + '</div>';
    return { title: 'Tools', back: false, tab: 'tools', html: h };
  }
  var toolCleanup = null;
  function viewTool(id) {
    var list = (window.GDG_TOOLS && window.GDG_TOOLS.list) || [];
    var t = list.filter(function (x) { return x.id === id; })[0];
    if (!t) return viewNotFound();
    return {
      title: t.title, back: true, tab: 'tools',
      html: '<h1 class="page-title">' + t.icon + ' ' + e(t.title) + '</h1><p class="page-sub">' + e(t.desc) + '</p><div id="toolbox"></div>',
      after: function () { toolCleanup = t.mount($('#toolbox'), window.App) || null; }
    };
  }

  function viewMore() {
    var h = '<h1 class="page-title">More</h1><div class="list">' +
      (EXT.plan ? '<a href="#/plan"><div class="t">📋 My Plan &amp; Readiness</div><div class="s">Emergency card, inventory, reminders, your readiness score</div></a>' : '') +
      (EXT.map ? '<a href="#/map"><div class="t">🗺 California Map &amp; Directions</div><div class="s">Hospitals, vets, groceries, fuel, highways. Works with no signal</div></a>' : '') +
      (EXT.booklet ? '<a href="#/booklet"><div class="t">🖨 Print kit booklet</div><div class="s">Choose the guides to print or save as a PDF for your go-bag</div></a>' : '') +
      (EXT.share ? '<a href="#/share"><div class="t">📤 Share this app</div><div class="s">QR code and link so a neighbor can install it too</div></a>' : '') +
      '<a href="#/saved"><div class="t">⭐ Saved & recently read</div><div class="s">' + S.saved.length + ' saved guide' + (S.saved.length === 1 ? '' : 's') + '</div></a>' +
      '<a href="#/help"><div class="t">📲 Install & offline help</div><div class="s">Put this app on your phone or tablet and make sure it works offline</div></a>' +
      '<a href="#/settings"><div class="t">⚙️ Settings</div><div class="s">Text size, night (red) mode, screen on</div></a>' +
      '<a href="#/about"><div class="t">ℹ️ About & disclaimer</div><div class="s">Sources, limits, version ' + e(window.GDG_VERSION || '') + '</div></a></div>';
    return { title: 'More', back: false, tab: 'more', html: h };
  }

  function viewSaved() {
    var saved = S.saved.map(function (id) { return byId[id]; }).filter(Boolean);
    var recent = S.recent.map(function (id) { return byId[id]; }).filter(Boolean);
    var h = '<h1 class="page-title">⭐ Saved</h1>' +
      '<div class="list">' + (saved.map(function (a) { return artRow(a, true); }).join('') || emptyState('Nothing saved yet. Open any guide and tap “☆ Save”.')) + '</div>' +
      '<h2 class="sec">Recently read</h2><div class="list">' + (recent.map(function (a) { return artRow(a, true); }).join('') || emptyState('Nothing yet.')) + '</div>';
    return { title: 'Saved', back: true, tab: 'more', html: h };
  }

  var deferredInstall = null;
  function viewHelp() {
    var h = '<h1 class="page-title">📲 Install & offline help</h1>' +
      '<div class="card"><h3>1. Open it once with a connection</h3><p>Load this app while you still have internet (or on a computer, then copy the folder). It saves itself to your device. When the top bar shows <b>✓ Offline ready</b>, everything is stored.</p></div>' +
      '<div class="card"><h3>2. Add it to your home screen</h3>' +
      '<p><b>iPhone / iPad (Safari):</b> tap the Share button, then <b>Add to Home Screen</b>.</p>' +
      '<p><b>Android (Chrome):</b> tap the ⋮ menu, then <b>Install app</b> (or <b>Add to Home screen</b>).</p>' +
      '<p><b>Windows / Mac / Chromebook (Chrome or Edge):</b> click the install icon in the address bar.</p>' +
      '<div class="btn-row" id="install-row"' + (deferredInstall ? '' : ' hidden') + '><button class="btn primary" data-act="install">Install now</button></div></div>' +
      '<div class="card"><h3>3. Test it</h3><p>Turn on airplane mode, close the app, and open it again. It should work exactly the same. Do this <i>before</i> you need it.</p></div>' +
      '<div class="card"><h3>Keep paper backups</h3><p>Phones break, batteries die. Use the <b>🖨 Print</b> button on key guides (CPR, bleeding, water treatment, master checklist) and keep the pages in your kit. Keep a charged power bank and a way to recharge it (solar panel or car charger).</p></div>' +
      '<div class="card"><h3>Offline status</h3><div id="offinfo" class="muted">Checking…</div><div class="btn-row"><button class="btn small" data-act="update">Check for updates</button></div></div>' +
      '<div class="card"><h3>Single-file backup copy</h3><p>There is also a single <b>grid-down-guide.html</b> file with the whole guide inside. Download it (needs a connection), then copy it to a USB stick, SD card, or another device and open it in any browser with no installation. On Android and computers it works straight from the file.</p>' +
      (location.protocol === 'file:' ? '' : '<div class="btn-row"><a class="btn" href="grid-down-guide.html" download>⬇ Download backup file</a></div>') + '</div>';
    return { title: 'Install & offline', back: true, tab: 'more', html: h, after: offlineInfo };
  }

  function viewSettings() {
    var h = '<h1 class="page-title">⚙️ Settings</h1>' +
      '<div class="card"><h3>Text size: <span id="szv">' + S.size + '%</span></h3><input type="range" id="sz" min="85" max="175" step="5" value="' + S.size + '"><p class="muted">Bigger text is easier to read when you are stressed or it is dark.</p></div>' +
      '<div class="card"><h3>Display</h3><select id="theme"><option value="auto">Match my device</option><option value="light">Light</option><option value="dark">Dark</option><option value="night">Red night mode (keeps night vision)</option></select></div>' +
      '<div class="card"><h3>Screen</h3><label class="chk"><input type="checkbox" id="wake"><span>Keep the screen awake while the app is open (uses more battery)</span></label></div>' +
      '<div class="card"><h3>Region &amp; units</h3><select id="region">' + Object.keys(REGIONS).map(function (k) { return '<option value="' + k + '">' + e(REGIONS[k].name) + '</option>'; }).join('') + '</select>' +
      '<p class="muted">Sets the emergency number shown in the Emergency screen and in the guides (“911” becomes your local number). Most guides are written for the US: hotlines, medicine names and laws may differ where you live.</p>' +
      '<label class="f" for="units" style="display:block;margin-top:.8rem">Unit Converter starts with</label><select id="units"><option value="us">US units (gallons, °F, miles)</option><option value="metric">Metric units (litres, °C, km)</option></select></div>' +
      '<div class="card"><h3>Your data</h3><p class="muted">Saved guides, checklist ticks, your Emergency Card, inventory and reminders are stored only on this device. Download a backup file so you can restore them on a new phone.</p>' +
      '<div class="btn-row"><button class="btn" data-act="export">⬇ Download my data</button><label class="btn" for="import-file" style="cursor:pointer">⬆ Restore from file</label><input type="file" id="import-file" accept=".json,application/json" hidden></div>' +
      '<div class="btn-row"><button class="btn danger" data-act="clear">Clear saved items &amp; checklists</button></div></div>' +
      '<div class="card"><h3>Storage</h3><div id="offinfo" class="muted">Checking…</div></div>';
    return {
      title: 'Settings', back: true, tab: 'more', html: h,
      after: function () { $('#theme').value = S.theme; $('#wake').checked = !!S.keepAwake; $('#region').value = S.region; $('#units').value = S.units; offlineInfo(); }
    };
  }

  function viewAbout() {
    var words = INDEX.reduce(function (n, ix) { return n + ix.raw.split(/\s+/).length; }, 0);
    var h = '<h1 class="page-title">ℹ️ About & disclaimer</h1>' +
      '<div class="callout important"><div class="co-title">Important</div><div class="co-body">This app is an <b>educational reference</b>. It is not medical, legal, or professional advice and cannot replace training, a doctor, emergency services, or local rules. Practice skills <i>before</i> you need them. You use this information at your own risk.</div></div>' +
      '<div class="card"><h3>This copy</h3><div class="kv"><span>Version</span><b>' + e(window.GDG_VERSION || 'dev') + '</b></div><div class="kv"><span>Guides</span><b>' + ARTS.length + '</b></div><div class="kv"><span>Words</span><b>' + words.toLocaleString() + '</b></div></div>' +
      '<div class="card"><h3>Where the guidance comes from</h3><p>Content is written to follow widely accepted public guidance: American Red Cross and American Heart Association (first aid, CPR), CDC and WHO (water, sanitation, health), EPA and FEMA / Ready.gov (disasters, water), USDA and the National Center for Home Food Preservation (food safety and canning), NOAA / National Weather Service, Wilderness Medical Society and NOLS, and university Extension services (gardening, livestock).</p><p>Planting Calendar data: hardiness zones by ZIP code from the 2023 USDA Plant Hardiness Zone Map (USDA Agricultural Research Service and the PRISM Group at Oregon State University); frost dates and temperatures from NOAA NCEI U.S. Climate Normals 1991–2020. This app is not the official USDA map.</p><p>Standards change and local conditions differ. When you can, check current official sources and learn from people who do these things in your area.</p></div>' +
      '<div class="card"><h3>Diagrams, not photos</h3><p>Key skills have simple line diagrams, and there are no photographs, so the app stays small and works anywhere. For plant identification, mushrooms, snakes, and anything you could get badly wrong, <b>also keep printed field guides and manuals for your region</b>.</p></div>' +
      '<div class="card"><h3>Checked, but not certified</h3><p>The guides were written with AI assistance and then checked against current official sources (Red Cross, AHA, CDC, USDA, FEMA and others). A fact-check log for each section is kept with the project. That check is <b>not</b> a substitute for review by a nurse, EMT, extension agent or other qualified person, and standards change. Corrections are welcome.</p></div>';
    if (EXT.map) h += '<div class="card"><h3>Map data</h3><p>The California map uses data © <b>OpenStreetMap contributors</b> (open license, openstreetmap.org/copyright), boundaries from the <b>US Census Bureau</b>, and lakes and rivers from <b>Natural Earth</b>. OpenStreetMap is built by volunteers and is not complete: some hospitals, vets, stores and roads are missing or out of date. The map has highways only, no local streets, no live traffic and no road closures.</p></div>';
    return { title: 'About', back: true, tab: 'more', html: h };
  }

  function viewNotFound() {
    return { title: 'Not found', back: true, tab: 'home', html: '<h1 class="page-title">Not found</h1><p>That page does not exist.</p><a class="btn primary" href="#/">Go home</a>' };
  }

  /* ---------------- router ---------------- */
  var view = $('#view'), navCount = 0;
  function route() {
    navCount++;
    if (toolCleanup) { try { toolCleanup(); } catch (err) {} toolCleanup = null; }
    var raw = location.hash.replace(/^#/, '') || '/';
    var qs = '', qi = raw.indexOf('?');
    if (qi > -1) { qs = raw.slice(qi + 1); raw = raw.slice(0, qi); }
    var parts = raw.split('/').filter(Boolean);
    var params = new URLSearchParams(qs);
    var v;
    try {
      if (!parts.length) v = viewHome();
      else if (parts[0] === 'c') v = viewCategory(parts[1]);
      else if (parts[0] === 'a') v = viewArticle(parts[1]);
      else if (parts[0] === 'search') v = viewSearch(params.get('q') || '');
      else if (parts[0] === 'emergency') v = viewEmergency();
      else if (parts[0] === 'tools') v = viewTools();
      else if (parts[0] === 't') v = viewTool(parts[1]);
      else if (parts[0] === 'more') v = viewMore();
      else if (parts[0] === 'saved') v = viewSaved();
      else if (parts[0] === 'help') v = viewHelp();
      else if (parts[0] === 'settings') v = viewSettings();
      else if (parts[0] === 'about') v = viewAbout();
      else if (EXT[parts[0]]) v = EXT[parts[0]](parts.slice(1), params);
      else v = viewNotFound();
    } catch (err) {
      console.error(err);
      v = { title: 'Error', back: true, tab: 'home', html: '<h1 class="page-title">Something went wrong</h1><p>' + e(String(err && err.message || err)) + '</p><a class="btn primary" href="#/">Go home</a>' };
    }
    view.innerHTML = v.html;
    $('#hdr-title').textContent = v.title;
    $('#back').hidden = !v.back;
    document.body.classList.toggle('full', !!v.full);
    $$('#tabs a').forEach(function (a) { a.classList.toggle('active', a.getAttribute('data-tab') === v.tab); });
    if (!(parts[0] === 'search')) window.scrollTo(0, 0);
    wake(false);
    var after = v.after ? v.after() : null;
    if (typeof after === 'function') toolCleanup = after;
  }
  window.addEventListener('hashchange', route);

  /* ---------------- events ---------------- */
  document.addEventListener('click', function (ev) {
    var el = ev.target.closest('[data-act]'); if (!el) return;
    var act = el.getAttribute('data-act'), id = el.getAttribute('data-id');
    if (act === 'save') {
      var i = S.saved.indexOf(id);
      if (i > -1) { S.saved.splice(i, 1); el.textContent = '☆ Save'; toast('Removed from saved'); }
      else { S.saved.unshift(id); el.textContent = '★ Saved'; toast('Saved. Find it under More → Saved'); }
      save();
    } else if (act === 'print') { window.print(); }
    else if (act === 'resetchk') {
      Object.keys(S.checks).forEach(function (k) { if (k.indexOf(id + ':') === 0) delete S.checks[k]; });
      save(); $$('input[data-chk]').forEach(function (cb) { cb.checked = false; }); toast('Checklist reset');
    } else if (act === 'clear') {
      if (confirm('Clear all saved guides, recent history and checklist ticks on this device?')) { S.saved = []; S.recent = []; S.checks = {}; save(); toast('Cleared'); }
    } else if (act === 'install') {
      if (deferredInstall) { deferredInstall.prompt(); deferredInstall = null; }
    } else if (act === 'update') {
      checkUpdate();
    } else if (act === 'accept') {
      S.intro = true; save(); var m = $('#intro'); if (m) m.remove();
    } else if (act === 'export') {
      exportData();
    } else if (ACTIONS[act]) {
      ACTIONS[act](el, ev);
    }
  });
  document.addEventListener('change', function (ev) {
    var t = ev.target;
    if (t.matches && t.matches('input[data-chk]')) { var k = t.getAttribute('data-chk'); if (t.checked) S.checks[k] = 1; else delete S.checks[k]; save(); }
    else if (t.id === 'theme') { S.theme = t.value; save(); applyPrefs(); }
    else if (t.id === 'wake') { S.keepAwake = t.checked; save(); wake(S.keepAwake); }
    else if (t.id === 'region') { S.region = t.value; save(); toast('Region: ' + region().name + '. Emergency number: ' + region().emerg); }
    else if (t.id === 'units') { S.units = t.value; save(); }
    else if (t.id === 'import-file') { importData(t); }
  });

  /* Backup / restore of everything stored on this device */
  function download(name, mime, text) {
    var blob = new Blob([text], { type: mime }), url = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = url; a.download = name; document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(url); a.remove(); }, 1500);
  }
  function exportData() {
    var d = new Date(), stamp = d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
    download('grid-down-guide-data-' + stamp + '.json', 'application/json', JSON.stringify({ app: 'grid-down-guide', saved: stamp, data: S }, null, 1));
    toast('Backup file downloaded');
  }
  function importData(input) {
    var f = input.files && input.files[0]; if (!f) return;
    var r = new FileReader();
    r.onload = function () {
      try {
        var o = JSON.parse(r.result);
        if (!o || o.app !== 'grid-down-guide' || !o.data || typeof o.data !== 'object') throw new Error('not a Grid Down Guide backup');
        if (!confirm('Replace the data on this device (saved guides, Emergency Card, inventory, reminders, checklists) with the backup from ' + (o.saved || 'that file') + '?')) return;
        Object.keys(o.data).forEach(function (k) { S[k] = o.data[k]; });
        save(); applyPrefs(); toast('Backup restored'); route();
      } catch (err) { toast('Could not read that file: ' + err.message, 5000); }
      input.value = '';
    };
    r.readAsText(f);
  }
  document.addEventListener('input', function (ev) {
    if (ev.target.id === 'sz') { S.size = parseInt(ev.target.value, 10); $('#szv').textContent = S.size + '%'; applyPrefs(); save(); }
  });
  $('#back').addEventListener('click', function () { if (history.length > 1) history.back(); else location.hash = '#/'; });
  $('#aa').addEventListener('click', function () {
    var steps = [100, 115, 130, 150, 175], i = steps.findIndex(function (s) { return s > S.size; });
    S.size = i === -1 ? 100 : steps[i]; applyPrefs(); save(); toast('Text size ' + S.size + '%', 1200);
  });
  window.addEventListener('beforeinstallprompt', function (ev) { ev.preventDefault(); deferredInstall = ev; var r = $('#install-row'); if (r) r.hidden = false; });

  /* ---------------- offline / service worker ---------------- */
  function cacheInfo() {
    if (!window.caches) return Promise.resolve(null);
    return caches.keys().then(function (keys) {
      var k = keys.filter(function (x) { return x.indexOf('gdg-') === 0; }).pop();
      if (!k) return { cached: 0, total: (window.GDG_ASSETS || []).length };
      return caches.open(k).then(function (c) { return c.keys(); }).then(function (r) { return { name: k, cached: r.length, total: (window.GDG_ASSETS || []).length }; });
    });
  }
  function setStatus(text, cls) { var s = $('#status'); s.textContent = text; s.className = 'chip ' + (cls || ''); }
  function updateStatus() {
    if (location.protocol === 'file:') { setStatus('✓ Local file', 'ok'); return; }
    if (!('serviceWorker' in navigator)) { setStatus('Offline not supported', 'bad'); return; }
    cacheInfo().then(function (i) {
      if (i && i.cached && i.cached >= i.total) setStatus('✓ Offline ready', 'ok');
      else if (i && i.cached) setStatus('Saving… ' + i.cached + '/' + i.total, 'bad');
      else setStatus('Not saved offline yet', 'bad');
    }).catch(function () { setStatus('Offline status unknown', 'bad'); });
  }
  function offlineInfo() {
    var box = $('#offinfo'); if (!box) return;
    if (location.protocol === 'file:') { box.innerHTML = 'Running as a local file: everything is already on this device. (Install-to-home-screen needs the hosted version.)'; return; }
    var html = '';
    cacheInfo().then(function (i) {
      html += i && i.cached >= i.total ? '✅ All ' + i.total + ' files are saved on this device. The app works offline.' : '⚠️ ' + (i ? i.cached : 0) + ' of ' + (i ? i.total : '?') + ' files saved. Stay connected until it says Offline ready.';
      if (navigator.storage && navigator.storage.persisted) return navigator.storage.persisted().then(function (p) { html += '<br>Storage protection: ' + (p ? 'on (the browser will not clear it automatically)' : 'not guaranteed. Installing to the home screen helps.'); });
    }).then(function () { box.innerHTML = html; }).catch(function () { box.textContent = 'Could not read offline status.'; });
  }
  function checkUpdate() {
    if (!('serviceWorker' in navigator)) return toast('Updates need a service worker');
    navigator.serviceWorker.getRegistration().then(function (r) {
      if (!r) return toast('Not installed as an offline app yet');
      return r.update().then(function () { toast('Checked. You are on the newest version unless the app says Updated.', 3500); });
    }).catch(function () { toast('Could not check (you may be offline)'); });
  }
  var hadController = !!(navigator.serviceWorker && navigator.serviceWorker.controller);
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    // updateViaCache 'none': the update check also bypasses the HTTP cache for js/version.js, so new versions are noticed immediately
    navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).then(function () {
      updateStatus();
      if (navigator.storage && navigator.storage.persist) navigator.storage.persist();
    }).catch(function () { setStatus('Offline setup failed', 'bad'); });
    navigator.serviceWorker.addEventListener('message', function (ev) { if (ev.data && ev.data.type === 'ready') updateStatus(); });
    navigator.serviceWorker.addEventListener('controllerchange', function () {
      updateStatus();
      if (hadController) toast('A new version was installed.', 8000, 'Reload', function () { location.reload(); });
      hadController = true;
    });
    setTimeout(updateStatus, 2500); setTimeout(updateStatus, 8000);
  } else { updateStatus(); }

  /* ---------------- first-run disclaimer ---------------- */
  function intro() {
    if (S.intro) return;
    var d = document.createElement('div');
    d.id = 'intro'; d.className = 'modal-bg';
    d.innerHTML = '<div class="modal" role="dialog" aria-modal="true" aria-labelledby="intro-h"><h2 id="intro-h">Before you start</h2>' +
      '<p>This is an <b>offline reference guide</b> for emergencies and self-reliance. It is <b>not</b> a substitute for medical care, emergency services, professional training, or local laws.</p>' +
      '<ul><li>If you can reach emergency services, call them.</li><li>Practice skills <b>before</b> a crisis.</li><li>Never eat a wild plant or mushroom you are not 100% sure of.</li><li>Keep paper backups and spare power for your phone.</li></ul>' +
      '<p class="muted">Tip: add this app to your home screen, then test it in airplane mode. See More → Install &amp; offline help.</p>' +
      '<button class="btn primary big" data-act="accept">I understand. Continue</button></div>';
    document.body.appendChild(d);
  }

  /* ---------------- shared API for tools ---------------- */
  window.App = {
    S: S, save: save, toast: toast, wake: wake, esc: e, byId: byId, byCat: byCat, catById: catById, ARTS: ARTS, CATS: CATS,
    artRow: artRow, localize: localize, region: region, REGIONS: REGIONS, download: download, route: route, applyPrefs: applyPrefs,
    navCount: function () { return navCount; },
    register: function (name, fn) { EXT[name] = fn; },         // add a #/name/... route: fn(parts, params) -> view {title, back, tab, html, after, full}
    action: function (name, fn) { ACTIONS[name] = fn; },        // handle clicks on [data-act="name"]
    homeBlock: function (fn) { EXTRAS.home.push(fn); }           // add html to the home screen
  };

  /* ---------------- start ---------------- */
  applyPrefs();
  if (window.GDG_TOOLS && window.GDG_TOOLS.boot) window.GDG_TOOLS.boot(window.App);
  (window.GDG_MODULES || []).forEach(function (init) { try { init(window.App); } catch (err) { console.error('module failed', err); } });
  route();
  intro();
})();

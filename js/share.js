/* Grid Down Guide — sharing and printing: Share this app (QR code, link, backup file) and the Print kit booklet.
   Routes: #/share  #/booklet  #/booklet/view */
(window.GDG_MODULES = window.GDG_MODULES || []).push(function (App) {
  'use strict';
  var S = App.S, e = App.esc, byId = App.byId;
  var $ = function (s, el) { return (el || document).querySelector(s); };
  var $$ = function (s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); };

  /* ================= SHARE ================= */
  function appUrl() {
    if (!/^https?:$/.test(location.protocol)) return '';
    return location.origin + location.pathname.replace(/index\.html$/, '');
  }
  function qrSvg(text) {
    try { return window.QR ? window.QR.svg(text, { ecc: 'M', label: 'QR code for ' + text }) : ''; } catch (err) { return ''; }
  }
  function viewShare() {
    var url = appUrl(), hosted = !!url;
    var h = '<h1 class="page-title">📤 Share this app</h1><p class="page-sub">Preparedness is a team sport. A neighbor who is ready makes everyone safer.</p>';
    if (hosted) {
      var svg = qrSvg(url);
      h += '<div class="card"><h3>Scan to open</h3><p class="muted">Point a phone camera at this code. It works even when you have no connection, because the code is made on this device.</p>' +
        (svg ? '<div class="qr-box">' + svg + '</div>' : '<p class="muted">The code could not be drawn here. Use the link below.</p>') +
        '<p style="word-break:break-all;text-align:center"><b>' + e(url) + '</b></p>' +
        '<div class="btn-row noprint">' + (navigator.share ? '<button class="btn primary" data-act="share-link">📤 Share link…</button>' : '') + '<button class="btn" data-act="share-copy">📋 Copy link</button><button class="btn" data-act="print">🖨 Print this page</button></div></div>';
    } else {
      h += '<div class="card"><h3>This copy is a file on your device</h3><p>A QR code needs the web address of the installed app, and a file has none. Open the hosted app in your phone’s browser (with a connection), then open <b>More → Share this app</b> there.</p>' +
        '<p>To give someone this exact copy with no internet at all, send them the file <b>grid-down-guide.html</b> by Bluetooth, AirDrop, Nearby Share, a USB stick or an SD card.</p></div>';
    }
    h += '<div class="card"><h3>What to tell them</h3><ol class="steps">' +
      '<li>Open the link or scan the code <b>while connected</b>. Wait until the top of the app says <b>✓ Offline ready</b>.</li>' +
      '<li><b>iPhone / iPad:</b> in Safari tap Share, then <b>Add to Home Screen</b>. <b>Android:</b> Chrome menu ⋮, then <b>Install app</b>.</li>' +
      '<li>Turn on airplane mode and open it once to be sure it works.</li></ol>' +
      (hosted ? '<div class="btn-row noprint"><a class="btn" href="grid-down-guide.html" download>⬇ Download the single-file backup copy</a></div><p class="muted">The single file opens in any browser with no installation. On Android and computers it works straight from the file. iPhones cannot reliably open local HTML files, so iPhone users should install from the link.</p>' : '') + '</div>' +
      '<div class="card"><h3>Be a good neighbor</h3><p>Offer to help a neighbor install it, especially older neighbors or anyone who relies on medical equipment. See ' + (byId['community-mutual-aid'] ? '<a href="#/a/community-mutual-aid">Working With Neighbors</a>' : 'the neighborhood guide') + '.</p></div>';
    return { title: 'Share', back: true, tab: 'more', html: h };
  }
  App.action('share-link', function () {
    try { navigator.share({ title: 'Grid Down Guide', text: 'A free offline survival and preparedness guide. Install it before you need it.', url: appUrl() }).catch(function () {}); } catch (err) {}
  });
  App.action('share-copy', function () {
    var u = appUrl();
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(u).then(function () { App.toast('Link copied'); }, function () { App.toast('Could not copy. Select the link and copy it.'); });
    else App.toast('Select the link and copy it.');
  });

  /* ================= PRINT BOOKLET ================= */
  var PRESETS = {
    essentials: { label: 'Essentials (★ key guides only)', cats: [], key: true, card: true, saved: false },
    firstaid: { label: 'First aid & health', cats: ['firstaid', 'health'], key: false, card: true, saved: false },
    water: { label: 'Water, sanitation & shelter', cats: ['water', 'sanitation', 'shelter'], key: false, card: false, saved: false },
    grid: { label: 'Power outage pack', cats: ['start', 'power', 'prep'], key: false, card: true, saved: false },
    saved: { label: 'Just my saved guides', cats: [], key: false, card: false, saved: true }
  };
  function bk() {
    if (!S.booklet || typeof S.booklet !== 'object') S.booklet = { cats: [], key: true, card: true, saved: false };
    if (!Array.isArray(S.booklet.cats)) S.booklet.cats = [];
    return S.booklet;
  }
  function selection() {
    var b = bk(), seen = {}, out = [];
    function add(a) { if (a && !seen[a.id]) { seen[a.id] = 1; out.push(a); } }
    if (b.key) App.ARTS.filter(function (a) { return a.priority; }).forEach(add);
    b.cats.forEach(function (c) { (App.byCat[c] || []).forEach(add); });
    if (b.saved) S.saved.forEach(function (id) { add(byId[id]); });
    return out;
  }
  function words(a) { return window.MD.plain(a.body || '').split(/\s+/).length; }
  function estPages(list) { return Math.max(list.length ? 1 : 0, Math.round(list.reduce(function (n, a) { return n + words(a) / 380 + 0.45; }, 0))); }

  function viewBooklet() {
    var b = bk();
    var h = '<h1 class="page-title">🖨 Print kit booklet</h1><p class="page-sub">Paper does not run out of battery. Pick what goes in your go-bag binder, then print it or “Save as PDF”.</p>' +
      '<div class="card"><h3>Quick picks</h3><div class="btn-row">' + Object.keys(PRESETS).map(function (k) { return '<button class="btn small" data-preset="' + k + '">' + e(PRESETS[k].label) + '</button>'; }).join('') + '</div></div>' +
      '<div class="card"><h3>Choose sections</h3><label class="chk"><input type="checkbox" id="bk-key"><span>All ★ KEY guides (the emergency essentials)</span></label>' +
      '<label class="chk"><input type="checkbox" id="bk-card"><span>My Emergency Card (from My Plan)</span></label>' +
      '<label class="chk"><input type="checkbox" id="bk-saved"><span>My saved guides</span></label><hr>' +
      App.CATS.filter(function (c) { return App.byCat[c.id] && App.byCat[c.id].length; }).map(function (c) {
        return '<label class="chk"><input type="checkbox" data-bc="' + c.id + '"><span>' + c.icon + ' ' + e(c.title) + ' <span class="muted">(' + App.byCat[c.id].length + ')</span></span></label>';
      }).join('') + '</div>' +
      '<div class="card"><div id="bk-sum"></div><div class="btn-row"><a class="btn primary big" href="#/booklet/view">Build booklet</a></div></div>' +
      '<p class="muted">Tip: print double-sided, keep it in a zip bag, and re-print after you update the app. Some guides have interactive checklists; they print as empty boxes you can tick with a pen.</p>';
    return {
      title: 'Print booklet', back: true, tab: 'more', html: h,
      after: function () {
        function sync() {
          var b2 = bk(); $('#bk-key').checked = !!b2.key; $('#bk-card').checked = !!b2.card; $('#bk-saved').checked = !!b2.saved;
          $$('[data-bc]').forEach(function (c) { c.checked = b2.cats.indexOf(c.getAttribute('data-bc')) > -1; });
          var list = selection();
          $('#bk-sum').innerHTML = list.length ? '<b>' + list.length + ' guides</b>, about <b>' + estPages(list) + ' pages</b>' + (b2.card ? ' plus your Emergency Card' : '') : '<span class="muted">Nothing selected yet.</span>';
        }
        $('#bk-key').onchange = function () { bk().key = this.checked; App.save(); sync(); };
        $('#bk-card').onchange = function () { bk().card = this.checked; App.save(); sync(); };
        $('#bk-saved').onchange = function () { bk().saved = this.checked; App.save(); sync(); };
        $$('[data-bc]').forEach(function (c) {
          c.onchange = function () {
            var id = c.getAttribute('data-bc'), cs = bk().cats.filter(function (x) { return x !== id; });
            if (c.checked) cs.push(id); bk().cats = cs; App.save(); sync();
          };
        });
        $$('[data-preset]').forEach(function (btn) {
          btn.onclick = function () { var p = PRESETS[btn.getAttribute('data-preset')]; S.booklet = { cats: p.cats.slice(), key: p.key, card: p.card, saved: p.saved }; App.save(); sync(); };
        });
        sync();
      }
    };
  }

  function cardSheet() {
    var c = S.card; if (!c || !Array.isArray(c.people)) return '';
    var people = c.people.filter(function (p) { return p && (p.name || p.allergies || p.meds || p.conditions); });
    if (!people.length) return '';
    function row(l, v) { return v ? '<tr><th style="text-align:left;width:30%;vertical-align:top">' + e(l) + '</th><td style="white-space:pre-wrap">' + e(v) + '</td></tr>' : ''; }
    return '<section class="book-art"><h1>Emergency Card</h1>' + people.map(function (p) {
      return '<table style="width:100%;border-collapse:collapse;margin-bottom:.8rem" border="1" cellpadding="5"><tbody><tr><th colspan="2" style="text-align:left;background:#eee">' + e(p.name || '') + (p.dob ? ' · born ' + e(p.dob) : '') + (p.blood ? ' · ' + e(p.blood) : '') + '</th></tr>' +
        row('Allergies', p.allergies) + row('Conditions', p.conditions) + row('Medicines', p.meds) + row('Doctor', p.doctor) + row('Notes', p.notes) + '</tbody></table>';
    }).join('') + (c.contacts || []).filter(function (x) { return x && (x.name || x.phone); }).map(function (x) { return '<p>📞 ' + e(x.name || '') + ' ' + e(x.phone || '') + '</p>'; }).join('') + '</section>';
  }

  function viewBookletView() {
    var list = selection(), b = bk(), rg = App.region();
    var h = '<div class="btn-row noprint"><button class="btn primary big" data-act="print">🖨 Print / save as PDF</button><a class="btn" href="#/booklet">← Change selection</a></div>' +
      '<div class="book-cover"><h1 style="font-size:2.4rem">Grid Down Guide</h1><h2>Kit booklet</h2><p>' + list.length + ' guides · printed ' + e(new Date().toLocaleDateString([], { year: 'numeric', month: 'long', day: 'numeric' })) + '</p>' +
      '<p>Emergency number: <b>' + e(rg.emerg) + '</b></p><p class="muted">Version ' + e(window.GDG_VERSION || '') + '. Educational reference only: not a substitute for training, medical care or emergency services.</p></div>' +
      '<section class="book-art"><h1>Contents</h1><ol>' + list.map(function (a) { return '<li>' + e(a.title) + '</li>'; }).join('') + '</ol></section>' +
      (b.card ? cardSheet() : '') +
      list.map(function (a) {
        var ctx = { articleId: 'bk-' + a.id, titleOf: function (i) { return byId[i] ? byId[i].title : i; } };
        return '<section class="book-art"><h1>' + e(a.title) + '</h1><p class="lede">' + e(a.summary || '') + '</p>' + App.localize(window.MD.render(a.body, ctx)) + '</section>';
      }).join('');
    return { title: 'Booklet', back: true, tab: 'more', html: h, after: function () { $$('input[data-chk]').forEach(function (cb) { cb.disabled = true; }); } };
  }

  App.register('share', viewShare);
  App.register('booklet', function (parts) { return parts[0] === 'view' ? viewBookletView() : viewBooklet(); });
});

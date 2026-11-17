/* Grid Down Guide — personal tools: My Plan (readiness score), Emergency Card, Inventory with expiry tracking, Maintenance reminders (+ .ics export).
   Everything is stored on this device only (App.S). Routes: #/plan  #/card  #/card/print  #/inventory  #/maint */
(window.GDG_MODULES = window.GDG_MODULES || []).push(function (App) {
  'use strict';
  var S = App.S, e = App.esc, byId = App.byId;
  var $ = function (s, el) { return (el || document).querySelector(s); };
  var $$ = function (s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); };
  var pad = function (n) { return n < 10 ? '0' + n : '' + n; };

  /* ---------- helpers ---------- */
  function iso(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function today() { var d = new Date(); return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
  function parseISO(s) { var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || ''); return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null; }
  function daysFrom(d) { return Math.round((d.getTime() - today().getTime()) / 864e5); }
  function addDays(d, n) { var x = new Date(d.getTime()); x.setDate(x.getDate() + n); return x; }
  function fmtDate(d) { return d.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' }); }
  function uid() { return Math.random().toString(36).slice(2, 9); }
  function plan() { if (!S.plan) S.plan = {}; if (!(S.plan.people > 0)) S.plan.people = 2; if (!(S.plan.foodDays >= 0)) S.plan.foodDays = 0; if (!(S.plan.soon > 0)) S.plan.soon = 90; return S.plan; }
  function link(id, label) { return byId[id] ? '<a href="#/a/' + id + '">' + (label || e(byId[id].title)) + '</a>' : ''; }
  function bar(p, cls) { p = Math.max(0, Math.min(1, p)); return '<div class="prog ' + (cls || '') + '"><i style="width:' + Math.round(p * 100) + '%"></i></div>'; }
  function pct(p) { return Math.round(Math.max(0, Math.min(1, p)) * 100); }

  /* ================= INVENTORY ================= */
  var INV_CATS = [['water', '💧 Water'], ['food', '🥫 Food'], ['medical', '💊 Medical & meds'], ['hygiene', '🧼 Hygiene & sanitation'], ['power', '🔋 Power, fuel & light'], ['tools', '🔧 Tools & gear'], ['docs', '📄 Documents & other']];
  var UNITS = ['items', 'gal', 'L', 'lb', 'kg', 'oz', 'cans', 'jars', 'bottles', 'boxes', 'bags', 'packs', 'rolls', 'doses'];
  var PRESETS = [
    ['Drinking water', 'gal', 'water'], ['Canned beans', 'cans', 'food'], ['Rice', 'lb', 'food'], ['Dry beans', 'lb', 'food'], ['Canned vegetables', 'cans', 'food'], ['Peanut butter', 'jars', 'food'],
    ['Bandages / first aid kit', 'items', 'medical'], ['Prescription medicine', 'doses', 'medical'], ['Pain reliever', 'bottles', 'medical'], ['Toilet paper', 'rolls', 'hygiene'], ['Bleach (unscented)', 'bottles', 'hygiene'],
    ['Batteries', 'packs', 'power'], ['Propane / fuel', 'items', 'power'], ['Flashlights / lanterns', 'items', 'power']
  ];
  function inv() { if (!Array.isArray(S.inv)) S.inv = []; return S.inv; }
  function expStatus(it) {
    var d = parseISO(it.exp); if (!d) return { k: 'none', n: null };
    var n = daysFrom(d);
    return { k: n < 0 ? 'expired' : n <= plan().soon ? 'soon' : 'ok', n: n };
  }
  function expBadge(it) {
    var s = expStatus(it);
    if (s.k === 'none') return '';
    if (s.k === 'expired') return '<span class="badge bad">expired ' + Math.abs(s.n) + ' d ago</span>';
    if (s.k === 'soon') return '<span class="badge warn">' + (s.n === 0 ? 'expires today' : 'in ' + s.n + ' d') + '</span>';
    return '<span class="badge ok">' + fmtDate(parseISO(it.exp)) + '</span>';
  }
  function waterDays() {
    var gal = 0;
    inv().forEach(function (it) { if (it.cat === 'water') { var q = parseFloat(it.qty) || 0; if (it.unit === 'gal') gal += q; else if (it.unit === 'L') gal += q / 3.785; } });
    var people = plan().people || 1;
    return { gal: gal, days: gal / people };   // 1 gallon per person per day
  }
  function invCounts() {
    var c = { expired: 0, soon: 0, total: inv().length };
    inv().forEach(function (it) { var s = expStatus(it).k; if (s === 'expired') c.expired++; else if (s === 'soon') c.soon++; });
    return c;
  }

  function viewInventory() {
    var h = '<h1 class="page-title">📦 Inventory</h1><p class="page-sub">What you have stored and when it expires. Stays on this device.</p>' +
      '<div id="inv-sum"></div>' +
      '<details class="card frm" id="inv-add"><summary><b>＋ Add or edit an item</b></summary>' +
      '<div class="btn-row" style="margin-top:.6rem">' + PRESETS.map(function (p, i) { return '<button class="btn small" data-preset="' + i + '">' + e(p[0]) + '</button>'; }).join('') + '</div>' +
      '<label class="f" for="i-name">Item</label><input type="text" id="i-name" placeholder="e.g. Canned chicken" autocomplete="off">' +
      '<div class="two"><div><label class="f" for="i-qty">How many</label><input type="number" id="i-qty" min="0" step="any" value="1" inputmode="decimal"></div>' +
      '<div><label class="f" for="i-unit">Unit</label><select id="i-unit">' + UNITS.map(function (u) { return '<option>' + u + '</option>'; }).join('') + '</select></div></div>' +
      '<div class="two"><div><label class="f" for="i-cat">Group</label><select id="i-cat">' + INV_CATS.map(function (c) { return '<option value="' + c[0] + '">' + e(c[1]) + '</option>'; }).join('') + '</select></div>' +
      '<div><label class="f" for="i-exp">Best by / expires (optional)</label><input type="date" id="i-exp"></div></div>' +
      '<label class="f" for="i-note">Note (where it is, size, etc.)</label><input type="text" id="i-note" autocomplete="off">' +
      '<div class="btn-row"><button class="btn primary" id="i-save">Add item</button><button class="btn" id="i-clear" hidden>Cancel edit</button></div></details>' +
      '<div class="card"><label class="f" for="i-soon">“Expiring soon” means within</label><select id="i-soon"><option value="30">30 days</option><option value="60">60 days</option><option value="90">90 days</option><option value="180">6 months</option></select></div>' +
      '<div id="inv-list"></div>' +
      '<div class="btn-row noprint"><button class="btn" data-act="print">🖨 Print list</button><button class="btn" data-act="inv-copy">📋 Copy as text</button></div>' +
      '<p class="muted">Tip: “best by” dates are quality dates, not safety cliffs, but cans that are bulging, leaking or spurting must be thrown out. See ' + link('pantry-rotation') + ' and ' + link('food-safety-basics') + '. Rotate: use the oldest first and replace what you use.</p>';
    return {
      title: 'Inventory', back: true, tab: 'more', html: h,
      after: function () {
        var editing = null;
        function fillForm(it) {
          editing = it ? it.id : null;
          $('#i-name').value = it ? it.name : ''; $('#i-qty').value = it ? it.qty : 1; $('#i-unit').value = it ? it.unit : 'items';
          $('#i-cat').value = it ? it.cat : 'food'; $('#i-exp').value = it ? (it.exp || '') : ''; $('#i-note').value = it ? (it.note || '') : '';
          $('#i-save').textContent = it ? 'Save changes' : 'Add item'; $('#i-clear').hidden = !it;
          if (it) { $('#inv-add').open = true; $('#i-name').scrollIntoView({ block: 'center' }); }
        }
        function list() {
          var c = invCounts(), w = waterDays();
          $('#inv-sum').innerHTML = '<div class="card"><div class="kv"><span>Items</span><b>' + c.total + '</b></div>' +
            '<div class="kv"><span>Expired</span><b' + (c.expired ? ' style="color:var(--danger)"' : '') + '>' + c.expired + '</b></div>' +
            '<div class="kv"><span>Expiring within ' + plan().soon + ' days</span><b' + (c.soon ? ' style="color:var(--warn)"' : '') + '>' + c.soon + '</b></div>' +
            '<div class="kv"><span>Stored water (gal or L entries)</span><b>' + (Math.round(w.gal * 10) / 10) + ' gal ≈ ' + (Math.round(w.days * 10) / 10) + ' days for ' + plan().people + ' ' + (plan().people === 1 ? 'person' : 'people') + '</b></div></div>';
          var items = inv().slice().sort(function (a, b) {
            var da = parseISO(a.exp), db = parseISO(b.exp);
            if (da && db) return da - db; if (da) return -1; if (db) return 1; return a.name.localeCompare(b.name);
          });
          if (!items.length) { $('#inv-list').innerHTML = '<div class="card muted">Nothing here yet. Tap “Add or edit an item”, or one of the quick buttons, to start. Even 10 items helps.</div>'; return; }
          var out = '';
          INV_CATS.forEach(function (cat) {
            var rows = items.filter(function (it) { return it.cat === cat[0]; });
            if (!rows.length) return;
            out += '<h2 class="sec">' + e(cat[1]) + '</h2><div class="card" style="padding:.2rem 1rem">' + rows.map(function (it) {
              return '<div class="inv-row"><div class="nm"><b>' + e(it.name) + '</b> ' + expBadge(it) + '<small>' + e(it.qty + ' ' + it.unit) + (it.note ? ' · ' + e(it.note) : '') + '</small></div>' +
                '<button class="btn small noprint" data-edit="' + it.id + '">Edit</button><button class="btn small noprint" data-del="' + it.id + '" aria-label="Delete ' + e(it.name) + '">✕</button></div>';
            }).join('') + '</div>';
          });
          $('#inv-list').innerHTML = out;
        }
        $('#i-soon').value = String(plan().soon);
        $('#i-soon').onchange = function () { plan().soon = parseInt(this.value, 10) || 90; App.save(); list(); };
        $('#i-save').onclick = function () {
          var name = $('#i-name').value.trim(); if (!name) { App.toast('Type the item name first'); return; }
          var rec = { id: editing || uid(), name: name, qty: parseFloat($('#i-qty').value) || 0, unit: $('#i-unit').value, cat: $('#i-cat').value, exp: $('#i-exp').value || '', note: $('#i-note').value.trim() };
          if (editing) { var ix = inv().findIndex(function (x) { return x.id === editing; }); if (ix > -1) inv()[ix] = rec; } else inv().push(rec);
          App.save(); fillForm(null); list(); App.toast(editing ? 'Saved' : 'Added');
        };
        $('#i-clear').onclick = function () { fillForm(null); };
        $$('[data-preset]').forEach(function (b) {
          b.onclick = function () { var p = PRESETS[+b.getAttribute('data-preset')]; fillForm(null); $('#i-name').value = p[0]; $('#i-unit').value = p[1]; $('#i-cat').value = p[2]; $('#inv-add').open = true; $('#i-qty').focus(); $('#i-qty').select(); };
        });
        $('#inv-list').onclick = function (ev) {
          var ed = ev.target.closest('[data-edit]'), dl = ev.target.closest('[data-del]');
          if (ed) fillForm(inv().filter(function (x) { return x.id === ed.getAttribute('data-edit'); })[0]);
          else if (dl && confirm('Remove this item?')) { S.inv = inv().filter(function (x) { return x.id !== dl.getAttribute('data-del'); }); App.save(); list(); }
        };
        list();
      }
    };
  }
  App.action('inv-copy', function () {
    var lines = inv().slice().sort(function (a, b) { return (a.cat + a.name).localeCompare(b.cat + b.name); }).map(function (it) {
      return '- ' + it.name + ': ' + it.qty + ' ' + it.unit + (it.exp ? ' (best by ' + it.exp + ')' : '') + (it.note ? ' [' + it.note + ']' : '');
    });
    var txt = 'Grid Down Guide inventory (' + iso(new Date()) + ')\n' + lines.join('\n');
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(function () { App.toast('Copied'); }, function () { App.toast('Could not copy'); });
    else App.toast('Copy is not available here. Use Print.');
  });

  /* ================= MAINTENANCE REMINDERS ================= */
  var TASKS = [
    { id: 'smoke', t: 'Test smoke and carbon monoxide alarms', m: 1, art: 'fire-safety', note: 'Press the test button on every alarm.' },
    { id: 'extinguisher', t: 'Check fire extinguishers (gauge in the green, no damage)', m: 1, art: 'fire-safety' },
    { id: 'radios', t: 'Test your radios and check in on your net or family channel', m: 1, art: 'radio-basics' },
    { id: 'generator', t: 'Run the generator outdoors for 15–30 minutes (follow your manual)', m: 1, art: 'generator-safety', note: 'Check oil and fuel. Never run it in a garage.' },
    { id: 'power', t: 'Top up power banks, lanterns and rechargeable batteries', m: 3, art: 'batteries-charging' },
    { id: 'app', t: 'Open this app while online so it can update, then check it says Offline ready', m: 3, art: 'help' },
    { id: 'water', t: 'Replace stored tap water (bottled water: by its date)', m: 6, art: 'water-storage', note: 'Label containers with the date.' },
    { id: 'food', t: 'Check the food stockpile dates and use the oldest first', m: 6, art: 'pantry-rotation' },
    { id: 'kit', t: 'Check the first aid kit and medicines for expired items', m: 6, art: 'first-aid-kit' },
    { id: 'bag', t: 'Refresh the go-bag: clothes for the season and kids’ sizes, batteries, food and water', m: 6, art: 'bug-out-bag' },
    { id: 'fuel', t: 'Use up and replace stored gasoline (stabilized or not, see the guide)', m: 6, art: 'fuel-storage' },
    { id: 'drill', t: 'Practice a home fire escape drill with everyone', m: 6, art: 'kids-safety-skills', alt: 'fire-safety' },
    { id: 'plan', t: 'Review the family plan and meeting places', m: 12, art: 'family-plan' },
    { id: 'card', t: 'Update the Emergency Card, documents and copies', m: 12, art: 'documents-money' },
    { id: 'battery', t: 'Replace smoke and CO alarm batteries (alarms themselves: about every 10 years)', m: 12, art: 'fire-safety' },
    { id: 'chimney', t: 'Have the chimney or wood stove cleaned and checked', m: 12, art: 'heating-home' },
    { id: 'seeds', t: 'Check seeds, plan the garden and test the soil', m: 12, art: 'garden-planning' }
  ];
  function maint() { if (!S.maint) S.maint = {}; return S.maint; }
  function taskState(t) {
    var last = parseISO(maint()[t.id]), months = t.m;
    if (!last) return { due: today(), n: -9999, k: 'never', last: null };
    var due = new Date(last.getFullYear(), last.getMonth() + months, last.getDate());
    var n = daysFrom(due);
    return { due: due, n: n, k: n < 0 ? 'overdue' : n <= 7 ? 'soon' : 'ok', last: last };
  }
  function dueList() { return TASKS.map(function (t) { return { t: t, s: taskState(t) }; }).filter(function (x) { return x.s.k === 'overdue' || x.s.k === 'soon' || x.s.k === 'never'; }); }
  function everyLabel(m) { return m === 1 ? 'every month' : m === 12 ? 'every year' : 'every ' + m + ' months'; }

  function ics(tasks) {
    var crlf = '\r\n', out = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Grid Down Guide//EN', 'CALSCALE:GREGORIAN'];
    function fold(l) { var r = ''; while (l.length > 68) { r += l.slice(0, 68) + crlf + ' '; l = l.slice(68); } return r + l; }
    function esc(s) { return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n'); }
    var stamp = iso(new Date()).replace(/-/g, '') + 'T000000Z', n = 0;
    tasks.forEach(function (t) {
      var s = taskState(t), start = s.k === 'ok' || s.k === 'soon' ? s.due : addDays(today(), 1 + (n++ % 14));
      var ds = iso(start).replace(/-/g, '');
      out.push('BEGIN:VEVENT', 'UID:gdg-' + t.id + '@grid-down-guide', 'DTSTAMP:' + stamp, 'DTSTART;VALUE=DATE:' + ds,
        fold('SUMMARY:' + esc('Prep: ' + t.t)), fold('DESCRIPTION:' + esc((t.note || '') + ' (Grid Down Guide reminder)')),
        'RRULE:FREQ=' + (t.m === 12 ? 'YEARLY;INTERVAL=1' : 'MONTHLY;INTERVAL=' + t.m), 'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:' + esc(t.t), 'TRIGGER:PT9H', 'END:VALARM', 'END:VEVENT');
    });
    out.push('END:VCALENDAR');
    return out.join(crlf) + crlf;
  }

  function viewMaint() {
    var h = '<h1 class="page-title">🔔 Maintenance reminders</h1><p class="page-sub">The small jobs that keep a kit working. Tap “Done today” and the app tracks when each is next due. No account, no internet.</p><div id="mt-list"></div>' +
      '<div class="card"><h3>Add them to your phone’s calendar</h3><p class="muted">Downloads a calendar file with the tasks you tick below as repeating all-day events. Open the file to import it into your calendar app.</p>' +
      '<div id="mt-pick">' + TASKS.map(function (t) { return '<label class="chk"><input type="checkbox" data-t="' + t.id + '" checked><span>' + e(t.t) + ' <span class="muted">(' + everyLabel(t.m) + ')</span></span></label>'; }).join('') + '</div>' +
      '<div class="btn-row"><button class="btn primary" data-act="mt-ics">⬇ Download calendar file (.ics)</button></div></div>';
    return {
      title: 'Reminders', back: true, tab: 'more', html: h,
      after: function () {
        function draw() {
          $('#mt-list').innerHTML = '<div class="card" style="padding:.2rem 1rem">' + TASKS.map(function (t) {
            var s = taskState(t), cls = s.k === 'overdue' || s.k === 'never' ? 'bad' : s.k === 'soon' ? 'warn' : 'ok';
            var label = s.k === 'never' ? 'not done yet' : s.k === 'overdue' ? 'overdue by ' + Math.abs(s.n) + ' d' : s.k === 'soon' ? 'due ' + (s.n === 0 ? 'today' : 'in ' + s.n + ' d') : 'next ' + fmtDate(s.due);
            var a = byId[t.art] ? t.art : (byId[t.alt] ? t.alt : null);
            return '<div class="inv-row"><div class="nm"><b>' + e(t.t) + '</b> <span class="badge ' + cls + '">' + label + '</span><small>' + everyLabel(t.m) + (t.note ? ' · ' + e(t.note) : '') + (a ? ' · <a href="#/a/' + a + '">guide</a>' : '') + '</small></div>' +
              '<button class="btn small" data-done="' + t.id + '">Done today</button></div>';
          }).join('') + '</div>';
        }
        $('#mt-list').onclick = function (ev) {
          var b = ev.target.closest('[data-done]'); if (!b) return;
          maint()[b.getAttribute('data-done')] = iso(new Date()); App.save(); draw(); App.toast('Recorded. Nice work.');
        };
        draw();
      }
    };
  }
  App.action('mt-ics', function () {
    var ids = $$('#mt-pick input:checked').map(function (c) { return c.getAttribute('data-t'); });
    var tasks = TASKS.filter(function (t) { return ids.indexOf(t.id) > -1; });
    if (!tasks.length) { App.toast('Tick at least one task'); return; }
    App.download('grid-down-guide-reminders.ics', 'text/calendar', ics(tasks));
    App.toast('Calendar file downloaded. Open it to add the reminders.', 5000);
  });

  /* ================= EMERGENCY CARD ================= */
  function card() {
    if (!S.card || typeof S.card !== 'object') S.card = {};
    var c = S.card;
    if (!Array.isArray(c.people) || !c.people.length) c.people = [{}];
    if (!Array.isArray(c.contacts) || !c.contacts.length) c.contacts = [{}, {}];
    ['outOfArea', 'meet'].forEach(function (k) { if (!c[k] || typeof c[k] !== 'object') c[k] = {}; });
    return c;
  }
  function getPath(o, p) { return p.split('.').reduce(function (a, k) { return a == null ? '' : a[k]; }, o); }
  function setPath(o, p, v) { var ks = p.split('.'), last = ks.pop(); var t = ks.reduce(function (a, k) { if (a[k] == null) a[k] = {}; return a[k]; }, o); t[last] = v; }
  function fld(path, label, opts) {
    opts = opts || {};
    var v = getPath(card(), path) || '';
    var id = 'c-' + path.replace(/\./g, '-');
    if (opts.area) return '<label class="f" for="' + id + '">' + e(label) + '</label><textarea id="' + id + '" data-p="' + path + '" placeholder="' + e(opts.ph || '') + '">' + e(v) + '</textarea>';
    return '<label class="f" for="' + id + '">' + e(label) + '</label><input type="' + (opts.type || 'text') + '" id="' + id + '" data-p="' + path + '" value="' + e(v) + '" placeholder="' + e(opts.ph || '') + '" autocomplete="off"' + (opts.type === 'tel' ? ' inputmode="tel"' : '') + '>';
  }
  function cardForm() {
    var c = card(), h = '';
    h += '<h2 class="sec">People</h2>';
    c.people.forEach(function (p, i) {
      h += '<details class="person frm"' + (i === 0 ? ' open' : '') + '><summary>' + e(p.name || 'Person ' + (i + 1)) + '</summary>' +
        fld('people.' + i + '.name', 'Full name') +
        '<div class="two"><div>' + fld('people.' + i + '.dob', 'Date of birth', { type: 'date' }) + '</div><div>' + fld('people.' + i + '.blood', 'Blood type (if known)', { ph: 'e.g. O+' }) + '</div></div>' +
        fld('people.' + i + '.allergies', 'Allergies (medicine, food, insect stings)', { area: true, ph: 'e.g. penicillin, peanuts (carries epinephrine)' }) +
        fld('people.' + i + '.conditions', 'Medical conditions & devices', { area: true, ph: 'e.g. type 1 diabetes, pacemaker, asthma' }) +
        fld('people.' + i + '.meds', 'Medicines and doses', { area: true, ph: 'name, dose, how often' }) +
        fld('people.' + i + '.doctor', 'Doctor / clinic and phone', { ph: 'Dr. Name 555-0100' }) +
        fld('people.' + i + '.notes', 'Other notes (language, glasses, mobility, wishes)', { area: true }) +
        (c.people.length > 1 ? '<div class="btn-row"><button class="btn small danger" data-act="card-delperson" data-id="' + i + '">Remove this person</button></div>' : '') + '</details>';
    });
    h += '<div class="btn-row"><button class="btn" data-act="card-addperson">＋ Add a person</button></div>';
    h += '<h2 class="sec">Emergency contacts</h2><div class="card frm">';
    c.contacts.forEach(function (x, i) {
      h += '<div class="two"><div>' + fld('contacts.' + i + '.name', 'Name' + (i ? '' : ' (first to call)')) + '</div><div>' + fld('contacts.' + i + '.phone', 'Phone', { type: 'tel' }) + '</div></div>';
    });
    h += '<div class="btn-row"><button class="btn small" data-act="card-addcontact">＋ Add a contact</button></div>' +
      '<p class="muted">Tip: also list one contact who lives <b>out of your area</b>. Local lines jam in a disaster, and an out-of-state relative can relay messages.</p>' +
      '<div class="two"><div>' + fld('outOfArea.name', 'Out-of-area contact') + '</div><div>' + fld('outOfArea.phone', 'Phone', { type: 'tel' }) + '</div></div></div>';
    h += '<h2 class="sec">Meeting places</h2><div class="card frm">' +
      fld('meet.near', '1. Right outside the home', { ph: 'e.g. the mailbox at the end of the driveway' }) +
      fld('meet.hood', '2. In the neighborhood (if you cannot go home)', { ph: 'e.g. the church parking lot on Main St' }) +
      fld('meet.far', '3. Out of town (if the area is closed)', { ph: 'e.g. Aunt Lee’s house, 40 miles north' }) + '</div>';
    h += '<h2 class="sec">Home</h2><div class="card frm">' + fld('address', 'Home address', { area: true }) +
      fld('utilities', 'Where the shutoffs are (water, gas, electric)', { area: true }) +
      fld('insurance', 'Insurance companies and policy numbers (only if you are comfortable storing them)', { area: true }) +
      fld('pets', 'Pets (name, kind, vet and phone)', { area: true }) + fld('notes', 'Anything else rescuers or family should know', { area: true }) + '</div>';
    return h;
  }
  function viewCard() {
    var h = '<h1 class="page-title">📇 Emergency Card</h1>' +
      '<p class="page-sub">Who needs what, who to call, where to meet. Saved only on this device as you type.</p>' +
      '<div class="callout tip"><div class="co-title">Make it work when you cannot unlock your phone</div><div class="co-body">Print it (button below) and keep a copy in your wallet, your go-bag and the glovebox. Or open <b>Print view</b>, take a screenshot, and set the screenshot as your lock-screen picture so first responders can read it.</div></div>' +
      '<div class="btn-row noprint"><a class="btn primary" href="#/card/print">🖨 Print view &amp; wallet cards</a></div>' +
      '<div id="cardform">' + cardForm() + '</div>' +
      '<p class="muted">Your information never leaves this device. Use “Download my data” in Settings to keep a backup file.</p>';
    return {
      title: 'Emergency Card', back: true, tab: 'more', html: h,
      after: function () {
        var box = $('#cardform');
        var timer = null;
        box.addEventListener('input', function (ev) {
          var p = ev.target.getAttribute && ev.target.getAttribute('data-p'); if (!p) return;
          setPath(card(), p, ev.target.value);
          if (/^people\.\d+\.name$/.test(p)) { var s = ev.target.closest('details').querySelector('summary'); if (s) s.textContent = ev.target.value || 'Person'; }
          clearTimeout(timer); timer = setTimeout(App.save, 300);
        });
        var ph = function () { App.save(); };
        window.addEventListener('pagehide', ph);
        return function () { window.removeEventListener('pagehide', ph); App.save(); };
      }
    };
  }
  function redrawCard() { var b = $('#cardform'); if (b) b.innerHTML = cardForm(); }
  App.action('card-addperson', function () { card().people.push({}); App.save(); redrawCard(); var d = $$('#cardform details.person'); if (d.length) { d[d.length - 1].open = true; d[d.length - 1].scrollIntoView({ block: 'center' }); } });
  App.action('card-delperson', function (el) { var i = +el.getAttribute('data-id'); if (confirm('Remove this person from the card?')) { card().people.splice(i, 1); App.save(); redrawCard(); } });
  App.action('card-addcontact', function () { card().contacts.push({}); App.save(); redrawCard(); });

  function viewCardPrint() {
    var c = card(), rg = App.region();
    function row(label, v) { return v ? '<tr><th style="text-align:left;width:32%;vertical-align:top">' + e(label) + '</th><td style="white-space:pre-wrap">' + e(v) + '</td></tr>' : ''; }
    var people = c.people.filter(function (p) { return p && (p.name || p.allergies || p.meds || p.conditions); });
    var contacts = c.contacts.filter(function (x) { return x && (x.name || x.phone); });
    var h = '<div class="btn-row noprint"><button class="btn primary" data-act="print">🖨 Print / save as PDF</button><a class="btn" href="#/card">← Edit</a></div>' +
      '<div class="sheet"><h1 style="margin-top:0">Emergency Information</h1><p>Printed ' + e(fmtDate(new Date())) + '. Emergency number: <b>' + e(rg.emerg) + '</b></p>' +
      (people.length ? '<h2>People</h2>' + people.map(function (p) {
        return '<table style="width:100%;border-collapse:collapse;margin-bottom:.8rem" border="1" cellpadding="5"><tbody>' +
          '<tr><th colspan="2" style="text-align:left;background:#eee">' + e(p.name || '(no name)') + (p.dob ? ' · born ' + e(p.dob) : '') + (p.blood ? ' · blood type ' + e(p.blood) : '') + '</th></tr>' +
          row('Allergies', p.allergies) + row('Conditions & devices', p.conditions) + row('Medicines', p.meds) + row('Doctor', p.doctor) + row('Notes', p.notes) + '</tbody></table>';
      }).join('') : '') +
      (contacts.length || (c.outOfArea && (c.outOfArea.name || c.outOfArea.phone)) ? '<h2>Call</h2><table style="width:100%;border-collapse:collapse" border="1" cellpadding="5"><tbody>' +
        contacts.map(function (x) { return '<tr><td>' + e(x.name || '') + '</td><td>' + e(x.phone || '') + '</td></tr>'; }).join('') +
        (c.outOfArea && (c.outOfArea.name || c.outOfArea.phone) ? '<tr><td>' + e(c.outOfArea.name || '') + ' <i>(out of area)</i></td><td>' + e(c.outOfArea.phone || '') + '</td></tr>' : '') + '</tbody></table>' : '') +
      ((c.meet.near || c.meet.hood || c.meet.far) ? '<h2>Meeting places</h2><ol>' + [c.meet.near, c.meet.hood, c.meet.far].filter(Boolean).map(function (m) { return '<li>' + e(m) + '</li>'; }).join('') + '</ol>' : '') +
      ((c.address || c.utilities || c.insurance || c.pets || c.notes) ? '<h2>Home</h2><table style="width:100%;border-collapse:collapse" border="1" cellpadding="5"><tbody>' + row('Address', c.address) + row('Shutoffs', c.utilities) + row('Insurance', c.insurance) + row('Pets', c.pets) + row('Notes', c.notes) + '</tbody></table>' : '') +
      (!people.length && !contacts.length ? '<p><i>The card is empty. Go back and fill it in first.</i></p>' : '') +
      (people.length ? '<h2 style="break-before:page">Wallet cards (cut out)</h2>' + people.map(function (p) {
        var first = contacts[0];
        return '<div class="wallet"><b>' + e(p.name || '') + '</b>' + (p.dob ? ' · b. ' + e(p.dob) : '') + (p.blood ? ' · ' + e(p.blood) : '') + '<br>' +
          (p.allergies ? '<b>ALLERGIES:</b> ' + e(p.allergies) + '<br>' : '') + (p.conditions ? '<b>CONDITIONS:</b> ' + e(p.conditions) + '<br>' : '') + (p.meds ? '<b>MEDS:</b> ' + e(p.meds) + '<br>' : '') +
          (first ? '<b>CALL:</b> ' + e(first.name || '') + ' ' + e(first.phone || '') + '<br>' : '') + (p.doctor ? '<b>DOCTOR:</b> ' + e(p.doctor) : '') + '</div>';
      }).join('') : '') + '</div>';
    return { title: 'Print Emergency Card', back: true, tab: 'more', html: h };
  }

  /* ================= MY PLAN & READINESS ================= */
  var READY = ['master-checklist', '72-hour-kit', 'bug-out-bag', 'family-plan', 'documents-money', 'first-aid-kit', 'vehicle-kit'];
  var HAZARDS = ['earthquake', 'severe-storms-tornado', 'hurricane', 'flood', 'wildfire', 'winter-storm', 'extreme-heat', 'radiation-nuclear', 'chemical-hazmat', 'pandemic', 'civil-unrest', 'geologic-hazards', 'emp-solar-storm', 'infrastructure-failure'];
  function checklistProgress(id) {
    var a = byId[id]; if (!a) return null;
    var total = (a.body.match(/^\s*[-*]\s+\[[ xX]\]/gm) || []).length; if (!total) return null;
    var done = 0; Object.keys(S.checks || {}).forEach(function (k) { if (k.indexOf(id + ':') === 0 && S.checks[k]) done++; });
    return { id: id, title: a.title, done: Math.min(done, total), total: total, p: Math.min(done, total) / total };
  }
  function readiness() {
    var rows = READY.map(checklistProgress).filter(Boolean);
    var cl = rows.length ? rows.reduce(function (s, r) { return s + r.p; }, 0) / rows.length : 0;
    var w = waterDays(), wp = Math.min(1, w.days / 14), fd = Math.min(1, (plan().foodDays || 0) / 14);
    var ic = invCounts(), rot = ic.total ? 1 - Math.min(1, (ic.expired + ic.soon * 0.5) / ic.total) : 0;
    var dl = dueList().length, mp = 1 - Math.min(1, dl / TASKS.length);
    var score = 0.35 * cl + 0.2 * wp + 0.2 * fd + 0.1 * rot + 0.15 * mp;
    return { rows: rows, cl: cl, water: w, wp: wp, fd: fd, rot: rot, ic: ic, mp: mp, score: score, due: dl };
  }
  function nextStep(r) {
    var weakest = [['water', r.wp], ['food', r.fd], ['lists', r.cl], ['tasks', r.mp]].sort(function (a, b) { return a[1] - b[1]; })[0][0];
    if (weakest === 'water') return 'Store water first: aim for 14 days at 1 gallon (4 L) per person per day. You have about ' + (Math.round(r.water.days * 10) / 10) + ' days.';
    if (weakest === 'food') return 'Build up your food: aim for at least 14 days of food your family will really eat. Use the Supplies Calculator to see how much.';
    if (weakest === 'lists') { var low = r.rows.slice().sort(function (a, b) { return a.p - b.p; })[0]; return low ? 'Work on “' + low.title + '”: ' + low.done + ' of ' + low.total + ' items ticked.' : 'Tick off items in the kit checklists.'; }
    return 'Do the overdue maintenance tasks: a kit only helps if it works.';
  }
  function scoreHtml(r) {
    var cls = r.score < 0.34 ? 'bad' : r.score < 0.67 ? 'warn' : '';
    return '<div class="big-score">' + pct(r.score) + '%</div>' + bar(r.score, cls) + '<p><b>Next step:</b> ' + e(nextStep(r)) + '</p>' +
      '<p class="muted">This score is only a planning aid. Being ready also means skills, training and neighbors, which no number captures.</p>';
  }
  function progHtml(r) {
    var p = plan();
    return '<div class="kv"><span>💧 Water stored</span><b>' + (Math.round(r.water.days * 10) / 10) + ' of 14 days</b></div>' + bar(r.wp) +
      '<div class="kv"><span>🥫 Food stored</span><b>' + p.foodDays + ' of 14 days</b></div>' + bar(r.fd) +
      r.rows.map(function (x) { return '<div class="kv"><span><a href="#/a/' + x.id + '">' + e(x.title) + '</a></span><b>' + x.done + '/' + x.total + '</b></div>' + bar(x.p); }).join('');
  }
  function viewPlan() {
    var r = readiness(), p = plan();
    var h = '<h1 class="page-title">📋 My Plan &amp; Readiness</h1><p class="page-sub">A rough guide to how ready you are, and the next best step. Stays on this device.</p>' +
      '<div class="card" id="pl-score">' + scoreHtml(r) + '</div>' +
      '<div class="list"><a href="#/card"><div class="t">📇 Emergency Card</div><div class="s">People, medicines, allergies, contacts, meeting places. Print wallet cards.</div></a>' +
      '<a href="#/inventory"><div class="t">📦 Inventory' + (r.ic.expired ? '<span class="badge bad">' + r.ic.expired + ' expired</span>' : '') + (r.ic.soon ? '<span class="badge warn">' + r.ic.soon + ' expiring soon</span>' : '') + '</div><div class="s">What you have stored and when it expires</div></a>' +
      '<a href="#/maint"><div class="t">🔔 Maintenance reminders' + (r.due ? '<span class="badge ' + (r.due > 3 ? 'bad' : 'warn') + '">' + r.due + ' due</span>' : '') + '</div><div class="s">Smoke alarms, water rotation, generator test… plus a calendar file</div></a>' +
      '<a href="#/t/supplies"><div class="t">🔢 Supplies Calculator</div><div class="s">How much water and food your household needs</div></a>' +
      (App.byId['master-checklist'] ? '<a href="#/a/master-checklist"><div class="t">✅ Master checklist</div><div class="s">Everything to have, in one list</div></a>' : '') + '</div>' +
      '<h2 class="sec">Your household</h2><div class="card frm"><label class="f" for="pl-people">People in your household: <b id="pl-pv">' + p.people + '</b></label><input type="range" id="pl-people" min="1" max="12" value="' + p.people + '">' +
      '<label class="f" for="pl-food">Days of food you have stored (your best estimate): <b id="pl-fv">' + p.foodDays + '</b></label><input type="range" id="pl-food" min="0" max="90" value="' + p.foodDays + '">' +
      '<p class="muted">Water is counted from the Inventory (entries in gallons or litres).</p></div>' +
      '<h2 class="sec">Progress</h2><div class="card" id="pl-prog">' + progHtml(r) + '</div>' +
      '<h2 class="sec">The hazards where you live</h2><div class="card frm"><p class="muted">Pick the ones that apply. Their playbooks will show on your home screen.</p>' +
      HAZARDS.filter(function (id) { return byId[id]; }).map(function (id) { return '<label class="chk"><input type="checkbox" data-hz="' + id + '"' + ((S.hazards || []).indexOf(id) > -1 ? ' checked' : '') + '><span>' + e(byId[id].title) + '</span></label>'; }).join('') + '</div>';
    return {
      title: 'My Plan', back: true, tab: 'more', html: h,
      after: function () {
        function refresh() { var x = readiness(); $('#pl-score').innerHTML = scoreHtml(x); $('#pl-prog').innerHTML = progHtml(x); }
        $('#pl-people').oninput = function () { p.people = +this.value; $('#pl-pv').textContent = this.value; App.save(); refresh(); };
        $('#pl-food').oninput = function () { p.foodDays = +this.value; $('#pl-fv').textContent = this.value; App.save(); refresh(); };
        $$('[data-hz]').forEach(function (cb) {
          cb.onchange = function () {
            var id = cb.getAttribute('data-hz'); S.hazards = (S.hazards || []).filter(function (x) { return x !== id; });
            if (cb.checked) S.hazards.push(id); App.save();
          };
        });
      }
    };
  }

  /* ---------- home screen blocks ---------- */
  App.homeBlock(function () {
    var out = '', due = dueList().filter(function (x) { return x.s.k !== 'never'; }), ic = invCounts();
    var items = [];
    if (due.length) items.push('⏰ ' + due.length + ' maintenance task' + (due.length === 1 ? '' : 's') + ' due');
    if (ic.expired) items.push('🥫 ' + ic.expired + ' stored item' + (ic.expired === 1 ? '' : 's') + ' expired');
    else if (ic.soon) items.push('🥫 ' + ic.soon + ' item' + (ic.soon === 1 ? '' : 's') + ' expiring soon');
    if (items.length) out += '<a class="start-card" href="' + (due.length ? '#/maint' : '#/inventory') + '"><b>' + items.join(' · ') + '</b><small>Tap to take care of it</small></a>';
    var hz = (S.hazards || []).filter(function (id) { return byId[id]; });
    if (hz.length) out += '<div class="card"><b>Your hazards</b><div class="btn-row">' + hz.map(function (id) { return '<a class="btn small" href="#/a/' + id + '">' + e(byId[id].title) + '</a>'; }).join('') + '</div></div>';
    var r = readiness();
    out += '<a class="start-card" href="#/plan">📋 <b>My Plan &amp; Readiness: ' + pct(r.score) + '%</b><small>Emergency card · inventory · reminders · next best step</small></a>';
    return out;
  });

  App.register('plan', viewPlan);
  App.register('inventory', viewInventory);
  App.register('maint', viewMaint);
  App.register('card', function (parts) { return parts[0] === 'print' ? viewCardPrint() : viewCard(); });
  App.TASKS = TASKS;
});

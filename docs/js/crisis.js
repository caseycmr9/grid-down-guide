/* Grid Down Guide — Crisis mode: one big step at a time, optional read-aloud (the phone's own offline voice), built-in CPR beat and step timers.
   Scripts live in data/crisis-steps.js (window.GDG_CRISIS). Routes: #/crisis (list), #/crisis/<id> (stepper). */
(window.GDG_MODULES = window.GDG_MODULES || []).push(function (App) {
  'use strict';
  var S = App.S, e = App.esc;
  var $ = function (s, el) { return (el || document).querySelector(s); };
  var T = function () { return window.GDG_TOOLS || {}; };
  var synth = window.speechSynthesis || null;

  function cfg() { if (!S.crisis) S.crisis = { read: true, rate: 1, breaths: false }; return S.crisis; }
  function scripts() { return window.GDG_CRISIS || []; }
  function find(id) { return scripts().filter(function (s) { return s.id === id; })[0]; }

  /* ---------- speech ---------- */
  function spoken(text) {
    var num = App.region().emerg;
    text = String(text).replace(/\b911\b/g, num).replace(new RegExp('\\b' + num + '\\b', 'g'), num.split('').join(' '));
    return text.replace(/\bAED\b/g, 'A E D').replace(/\bCPR\b/g, 'C P R').replace(/\bORS\b/g, 'O R S').replace(/\bCO\b/g, 'carbon monoxide')
      .replace(/(\d)\s*°\s*F\b/g, '$1 degrees Fahrenheit').replace(/(\d)\s*°\s*C\b/g, '$1 degrees Celsius').replace(/\bin\b(?=\s*\()/g, 'inches');
  }
  function lang() { var r = S.region; return r === 'uk' || r === 'ie' ? 'en-GB' : r === 'au' || r === 'nz' ? 'en-AU' : 'en-US'; }
  function say(text) {
    if (!synth || !text) return false;
    try {
      synth.cancel();
      var u = new SpeechSynthesisUtterance(spoken(text));
      u.rate = cfg().rate || 1; u.lang = lang();
      synth.speak(u);
      return true;
    } catch (err) { return false; }
  }
  function stopSay() { try { if (synth) synth.cancel(); } catch (err) {} }
  function stepText(st) { return st.t + (st.d ? ' ' + st.d : '') + (st.danger ? ' Warning. ' + st.danger : ''); }

  /* ---------- list ---------- */
  function viewList() {
    var list = scripts();
    var h = '<h1 class="page-title" style="color:var(--danger)">▶ Step-by-step help</h1>' +
      '<p class="page-sub">One step at a time. Big text. The phone can read each step aloud so your hands stay free.</p>' +
      '<div class="callout danger"><div class="co-title">Call for help first</div><div class="co-body">If you can, call ' + e(App.region().emerg) + ' (or have someone call), put the phone on speaker, then start.</div></div>' +
      '<div class="cr-list">' + list.map(function (s) {
        return '<a href="#/crisis/' + s.id + '"><span class="ic">' + (s.icon || '🚑') + '</span><span>' + e(s.title) + '</span></a>';
      }).join('') + '</div>' +
      '<div class="card"><h3>Read aloud</h3>' +
      (synth ? '<label class="chk"><input type="checkbox" id="cr-read"' + (cfg().read ? ' checked' : '') + '><span>Read each step aloud (uses your phone\'s built-in voice; works offline)</span></label>' +
        '<label class="f">Speed <select id="cr-rate"><option value="0.8">Slow</option><option value="1">Normal</option><option value="1.2">Fast</option></select></label>' +
        '<div class="btn-row"><button class="btn small" id="cr-test">🔊 Test the voice</button></div><p class="muted">Turn the volume up. If you hear nothing, check the silent switch and that your phone has a text-to-speech voice installed.</p>'
        : '<p class="muted">This device does not offer read-aloud. The big text still works.</p>') + '</div>' +
      '<p class="muted">These steps are short reminders for people who already called for help or cannot. For the full guide, tap “Full guide” inside any script. Taking a hands-on class is the best preparation.</p>';
    return {
      title: 'Step-by-step help', back: true, tab: 'sos', html: h,
      after: function () {
        var r = $('#cr-rate'); if (r) { r.value = String(cfg().rate || 1); r.onchange = function () { cfg().rate = parseFloat(r.value) || 1; App.save(); }; }
        var c = $('#cr-read'); if (c) c.onchange = function () { cfg().read = c.checked; App.save(); };
        var t = $('#cr-test'); if (t) t.onclick = function () { if (!say('Step one. Check that the scene is safe. Then call for help.')) App.toast('Read aloud is not available on this device'); };
        return stopSay;
      }
    };
  }

  /* ---------- stepper ---------- */
  function viewStepper(id) {
    var sc = find(id);
    if (!sc) return { title: 'Not found', back: true, tab: 'sos', html: '<h1 class="page-title">Script not found</h1><a class="btn primary" href="#/crisis">Back to the list</a>' };
    var N = sc.steps.length, i = 0;
    var tick = null, tEnd = 0, beatTimer = null, beating = false, beatN = 0, beatNext = 0, breathing = false, subs = [];

    var h = '<div class="crisis" id="cr">' +
      '<div class="cr-top"><button class="btn small" id="cr-exit">✕ Exit</button><div class="cr-title">' + (sc.icon || '') + ' ' + e(sc.title) + '</div></div>' +
      '<div class="cr-bar"><i id="cr-prog"></i></div><div class="cr-count" id="cr-count"></div>' +
      '<div class="cr-body" id="cr-body"></div>' +
      '<div class="cr-nav"><button class="btn big" id="cr-prev">◀ Back</button><button class="btn big primary" id="cr-next">Next ▶</button></div>' +
      '<div class="cr-foot">' + (synth ? '<button class="btn small" id="cr-say">🔊 Repeat</button><label class="chk"><input type="checkbox" id="cr-auto"><span>Read aloud</span></label>' : '') +
      (sc.article ? '<a class="btn small" href="#/a/' + sc.article + '">📖 Full guide</a>' : '') + '</div></div>';

    function stopTimer() { clearInterval(tick); tick = null; }
    function stopBeat() { beating = false; clearTimeout(beatTimer); subs.forEach(clearTimeout); subs = []; }
    function clearStep() { stopTimer(); stopBeat(); }

    function beatLoop() {
      if (!beating) return;
      var el = $('#cr-bc'), msg = $('#cr-bm'), cnt = $('#cr-bn'), iv = 60000 / 110;
      var useBreaths = !!cfg().breaths;
      if (breathing) { breathing = false; beatN = 0; }
      beatN++;
      if (cnt) cnt.textContent = beatN;
      if (el) { el.classList.remove('pulse'); void el.offsetWidth; el.classList.add('pulse'); }
      if (T().beep) T().beep(useBreaths && beatN === 1 ? 1200 : 880, 70, 0.25);
      if (T().vibrate) T().vibrate(25);
      var delay = iv;
      if (msg) msg.textContent = useBreaths ? 'PUSH ' + beatN + ' / 30' : 'PUSH';
      if (useBreaths && beatN === 30) {
        breathing = true; delay = iv + 5000;
        subs.push(setTimeout(function () { if (beating && msg) msg.textContent = 'GIVE 2 BREATHS'; }, iv * 0.9));
        subs.push(setTimeout(function () { if (beating && T().beep) T().beep(440, 450, 0.3); }, iv + 800));
        subs.push(setTimeout(function () { if (beating && T().beep) T().beep(440, 450, 0.3); }, iv + 3000));
      }
      beatNext += delay;
      beatTimer = setTimeout(beatLoop, Math.max(0, beatNext - performance.now()));
    }
    function startBeat() {
      if (T().audio) T().audio();
      beating = true; beatN = 0; breathing = false; beatNext = performance.now();
      var b = $('#cr-bgo'); if (b) b.textContent = 'Stop the beat';
      beatLoop();
    }

    function render(speak) {
      clearStep();
      var st = sc.steps[i], last = i === N - 1;
      $('#cr-count').textContent = (last && N > 1 ? 'Last step · ' : '') + 'Step ' + (i + 1) + ' of ' + N;
      $('#cr-prog').style.width = ((i + 1) / N * 100) + '%';
      var d = '<div class="cr-t">' + e(App.localize(st.t)) + '</div>';
      if (st.d) d += '<div class="cr-d">' + e(App.localize(st.d)) + '</div>';
      if (st.danger) d += '<div class="cr-danger">⚠ ' + e(App.localize(st.danger)) + '</div>';
      var dg = st.fig && window.GDG_DIAGRAMS && window.GDG_DIAGRAMS[st.fig];
      if (dg) d += '<figure class="fig cr-fig" role="img" aria-label="' + e(dg.alt || dg.title) + '">' + dg.svg + '<figcaption>' + e(dg.title) + '</figcaption></figure>';
      if (st.timer) d += '<div class="cr-timer"><button class="btn big" id="cr-tgo">⏱ Start ' + (st.timer >= 120 ? Math.round(st.timer / 60) + ' minute' : st.timer + ' second') + ' timer</button><div class="cr-clock" id="cr-clock" hidden></div></div>';
      if (st.beat) {
        d += '<div class="cr-beat"><div class="cpr-circle" id="cr-bc"><div class="n" id="cr-bn">0</div><div class="m" id="cr-bm">Ready</div></div>' +
          '<div class="btn-row"><button class="btn" id="cr-bgo">Start the beat</button></div>' +
          '<label class="chk"><input type="checkbox" id="cr-br"' + (cfg().breaths ? ' checked' : '') + '><span>I am trained: add 2 rescue breaths after every 30 pushes</span></label></div>';
      }
      $('#cr-body').innerHTML = d;
      $('#cr-prev').disabled = i === 0;
      var nx = $('#cr-next'); nx.textContent = last ? 'Done ✓' : 'Next ▶';
      if (speak && cfg().read) say(stepText(st));
      var tg = $('#cr-tgo');
      if (tg) tg.onclick = function () {
        stopTimer(); tEnd = Date.now() + st.timer * 1000;
        var clock = $('#cr-clock'); clock.hidden = false; tg.textContent = '⏱ Restart timer';
        if (T().audio) T().audio();
        var upd = function () {
          var left = Math.max(0, Math.round((tEnd - Date.now()) / 1000));
          clock.textContent = Math.floor(left / 60) + ':' + ('0' + (left % 60)).slice(-2);
          if (left <= 0) {
            stopTimer(); clock.textContent = 'TIME'; clock.classList.add('done');
            [0, 450, 900].forEach(function (ms) { setTimeout(function () { if (T().beep) T().beep(988, 300, 0.3); }, ms); });
            if (T().vibrate) T().vibrate([300, 150, 300]);
            if (cfg().read) say('Time.');
          }
        };
        clock.classList.remove('done'); upd(); tick = setInterval(upd, 250);
      };
      var bg = $('#cr-bgo');
      if (bg) {
        bg.onclick = function () { if (beating) { stopBeat(); bg.textContent = 'Start the beat'; $('#cr-bm').textContent = 'Stopped'; } else startBeat(); };
        $('#cr-br').onchange = function () { cfg().breaths = this.checked; App.save(); beatN = 0; };
        if (st.beat && sc.tool === 'cpr') startBeat();   // started by the Next tap, so sound is allowed
      }
      window.scrollTo(0, 0);
    }

    function finish() {
      clearStep(); stopSay();
      $('#cr-count').textContent = 'Finished'; $('#cr-prog').style.width = '100%';
      $('#cr-body').innerHTML = '<div class="cr-t">Keep watching the person.</div><div class="cr-d">Stay with them until help arrives. If anything gets worse, start again from the first step or call for help again.</div>' +
        '<div class="btn-row"><button class="btn big" id="cr-again">↺ Start over</button><a class="btn big" href="#/crisis">All scripts</a>' + (sc.article ? '<a class="btn big" href="#/a/' + sc.article + '">📖 Full guide</a>' : '') + '</div>';
      $('#cr-prev').disabled = false; $('#cr-next').disabled = true;
      $('#cr-again').onclick = function () { i = 0; $('#cr-next').disabled = false; render(true); };
    }

    return {
      title: sc.title, back: false, tab: 'sos', html: h, full: true,
      after: function () {
        App.wake(true);
        var auto = $('#cr-auto');
        if (auto) { auto.checked = !!cfg().read; auto.onchange = function () { cfg().read = auto.checked; App.save(); if (!auto.checked) stopSay(); else say(stepText(sc.steps[i])); }; }
        $('#cr-next').onclick = function () { if (i < N - 1) { i++; render(true); } else finish(); };
        $('#cr-prev').onclick = function () {
          $('#cr-next').disabled = false;
          if ($('#cr-again')) { i = N - 1; render(true); } else if (i > 0) { i--; render(true); }
        };
        var sy = $('#cr-say'); if (sy) sy.onclick = function () { if (!say(stepText(sc.steps[i]))) App.toast('Read aloud is not available'); };
        $('#cr-exit').onclick = function () { if (App.navCount() > 1) history.back(); else location.hash = '#/crisis'; };
        render(true);
        return function () { clearStep(); stopSay(); };
      }
    };
  }

  App.register('crisis', function (parts) { return parts[0] ? viewStepper(parts[0]) : viewList(); });
});

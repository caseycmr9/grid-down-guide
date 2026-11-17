/* Grid Down Guide — offline tools. Each tool: { id, icon, title, desc, mount(el, App) -> cleanup fn }. */
(function () {
  'use strict';

  var App = null;
  var e = function (s) { return window.MD.esc(s); };
  var $ = function (s, el) { return (el || document).querySelector(s); };
  var $$ = function (s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); };
  var pad = function (n) { return n < 10 ? '0' + n : '' + n; };

  /* ---------- audio / vibration ---------- */
  var AC = null;
  function audio() {
    if (!AC) { var C = window.AudioContext || window.webkitAudioContext; if (C) { try { AC = new C(); } catch (err) {} } }
    if (AC && AC.state === 'suspended') AC.resume();
    return AC;
  }
  function beep(freq, ms, vol) {
    var ac = audio(); if (!ac) return;
    var o = ac.createOscillator(), g = ac.createGain(), t = ac.currentTime, d = ms / 1000;
    o.type = 'sine'; o.frequency.value = freq || 880;
    g.gain.setValueAtTime(vol || 0.2, t); g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(d, 0.03));
    o.connect(g); g.connect(ac.destination); o.start(t); o.stop(t + Math.max(d, 0.03) + 0.02);
  }
  function vibrate(p) { try { if (navigator.vibrate) navigator.vibrate(p); } catch (err) {} }
  function fmt(sec) {
    sec = Math.max(0, Math.round(sec));
    var h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
    return (h ? h + ':' + pad(m) : '' + m) + ':' + pad(s);
  }
  function clock(ms) { return new Date(ms).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }); }
  function num(v, d) { var n = parseFloat(v); return isFinite(n) ? n : d; }
  function link(id, label) { return '<a href="#/a/' + id + '">' + label + '</a>'; }

  /* ================= CPR METRONOME ================= */
  function mountCPR(el) {
    var bpm = 110, mode = 'cont', running = false, n = 0, breathing = false, nextT = 0, timer = null, sub = [];
    el.innerHTML =
      '<div class="callout danger"><div class="co-title">First</div><div class="co-body">Call 911 or send someone to call, and get an AED if one is near. Then push hard and fast in the center of the chest. Do not stop.</div></div>' +
      '<div class="cpr-circle" id="cc"><div class="n" id="cn">0</div><div class="m" id="cm">Ready</div></div>' +
      '<div class="seg" id="cmode"><button data-m="cont" class="on">Hands-only</button><button data-m="302">30 pushes : 2 breaths</button></div>' +
      '<label class="f">Speed: <b id="cbv">110</b> per minute (aim for 100 to 120)</label><input type="range" id="cb" min="100" max="120" value="110">' +
      '<div class="btn-row"><button class="btn danger big" id="cgo">START</button></div>' +
      '<p class="muted">No sound? Turn off silent mode and turn the volume up (iPhones mute this in silent mode). The pulsing circle and vibration also keep the beat.</p>' +
      '<div class="card"><h3>Quick reminders</h3><ul>' +
      '<li><b>Adult:</b> heel of one hand on the center of the chest, other hand on top, arms straight. Push down 2 to 2.4 in (5 to 6 cm). Let the chest rise fully each time.</li>' +
      '<li><b>Child:</b> one or two hands, about 2 in (5 cm) deep.</li>' +
      '<li><b>Infant:</b> two fingers just below the nipple line, about 1.5 in (4 cm) deep.</li>' +
      '<li>Swap pushers about every 2 minutes if you can. Keep going until help takes over, an AED tells you otherwise, the person breathes normally, or you cannot continue.</li></ul>' +
      '<p>Full steps: ' + link('cpr', 'CPR guide') + ' · ' + link('choking', 'Choking') + '</p></div>';
    var cc = $('#cc', el), cn = $('#cn', el), cm = $('#cm', el), go = $('#cgo', el);

    function clearSub() { sub.forEach(clearTimeout); sub = []; }
    function beat() {
      if (!running) return;
      var interval = 60000 / bpm;
      if (breathing) { breathing = false; n = 0; }
      n++;
      cn.textContent = n;
      cc.classList.remove('pulse'); void cc.offsetWidth; cc.classList.add('pulse');
      beep(mode === '302' && n === 1 ? 1200 : 880, 70, 0.25); vibrate(25);
      var delay = interval;
      if (mode === '302') {
        cm.textContent = 'PUSH ' + n + ' / 30';
        if (n === 30) {
          breathing = true; delay = interval + 5000;
          sub.push(setTimeout(function () { if (running) cm.textContent = 'GIVE 2 BREATHS'; }, interval * 0.9));
          sub.push(setTimeout(function () { if (running) beep(440, 450, 0.3); }, interval + 800));
          sub.push(setTimeout(function () { if (running) beep(440, 450, 0.3); }, interval + 3000));
        }
      } else { cm.textContent = 'PUSH'; }
      nextT += delay;
      timer = setTimeout(beat, Math.max(0, nextT - performance.now()));
    }
    function start() {
      audio(); beep(660, 60, 0.15);
      running = true; n = 0; breathing = false; nextT = performance.now(); go.textContent = 'STOP'; App.wake(true); beat();
    }
    function stop() {
      running = false; clearTimeout(timer); clearSub(); go.textContent = 'START'; cm.textContent = 'Stopped'; App.wake(false);
    }
    go.onclick = function () { running ? stop() : start(); };
    $('#cb', el).oninput = function () { bpm = parseInt(this.value, 10); $('#cbv', el).textContent = bpm; };
    $$('#cmode button', el).forEach(function (b) {
      b.onclick = function () { mode = b.getAttribute('data-m'); $$('#cmode button', el).forEach(function (x) { x.classList.toggle('on', x === b); }); if (running) { n = 0; breathing = false; } };
    });
    return function () { running = false; clearTimeout(timer); clearSub(); App.wake(false); };
  }

  /* ================= TIMERS ================= */
  function alarm(label) {
    App.toast('⏰ ' + label, 9000);
    [0, 450, 900].forEach(function (t) { setTimeout(function () { beep(988, 300, 0.3); }, t); });
    vibrate([300, 150, 300, 150, 300]);
  }
  function tickTimers() {
    var now = Date.now(), changed = false;
    (App.S.timers || []).forEach(function (t) { if (t.kind === 'down' && !t.fired && t.end <= now) { t.fired = true; changed = true; alarm(t.label + ' is done'); } });
    if (changed) App.save();
  }
  function mountTimers(el) {
    el.innerHTML =
      '<div class="card"><h3>Tourniquet clock</h3><p>Start this the moment a tourniquet is applied. Write the clock time on the person (forehead or the tourniquet itself) and tell medical help.</p>' +
      '<button class="btn danger big" data-p="tq">🔴 Tourniquet just applied: start clock</button></div>' +
      '<div class="card"><h3>Quick timers</h3><div class="btn-row">' +
      '<button class="btn small" data-p="60|Boil water (1 min rolling boil)">Boil 1:00</button>' +
      '<button class="btn small" data-p="180|Boil water (3 min, high altitude)">Boil 3:00</button>' +
      '<button class="btn small" data-p="1800|Bleach contact time (30 min)">Bleach wait 30:00</button>' +
      '<button class="btn small" data-p="3600|Bleach contact time (cold or cloudy water)">Wait 60:00</button>' +
      '<button class="btn small" data-p="1200|Cool the burn under running water">Burn cooling 20:00</button>' +
      '<button class="btn small" data-p="120|Swap CPR rescuers">CPR swap 2:00</button>' +
      '<button class="btn small" data-p="600|Rest break">Rest 10:00</button></div>' +
      '<div class="two"><div><label class="f">Custom minutes</label><input type="number" id="tm" min="1" value="10" inputmode="numeric"></div><div><label class="f">Label</label><input type="text" id="tl" placeholder="e.g. Canner, bread"></div></div>' +
      '<div class="btn-row"><button class="btn primary" id="tadd">Start custom timer</button></div></div>' +
      '<h2 class="sec">Running</h2><div id="tlist"></div>' +
      '<p class="muted">Timers keep running if you leave this page, but the phone must stay on. Keep this app open for the loudest alarm.</p>';

    function draw() {
      var now = Date.now(), list = App.S.timers || [];
      $('#tlist', el).innerHTML = list.length ? list.map(function (t, i) {
        var val, extra = '', cls = '';
        if (t.kind === 'up') { val = fmt((now - t.start) / 1000); extra = 'Started ' + clock(t.start); }
        else { var left = (t.end - now) / 1000; val = left > 0 ? fmt(left) : 'DONE'; if (left <= 0) cls = ' done'; }
        return '<div class="timer-row' + cls + '"><div class="tm">' + val + '</div><div class="lb"><b>' + e(t.label) + '</b>' + (extra ? '<br><span class="muted">' + extra + '</span>' : '') + '</div><button class="btn small" data-rm="' + i + '">✕</button></div>';
      }).join('') : '<div class="card muted">No timers running.</div>';
    }
    function add(label, kind, secs) {
      var t = { id: Date.now() + Math.random(), label: label, kind: kind };
      if (kind === 'up') t.start = Date.now(); else { t.end = Date.now() + secs * 1000; t.fired = false; }
      App.S.timers.push(t); App.save(); draw(); audio();
    }
    el.onclick = function (ev) {
      var b = ev.target.closest('button'); if (!b) return;
      var p = b.getAttribute('data-p'), rm = b.getAttribute('data-rm');
      if (p === 'tq') add('Tourniquet on', 'up');
      else if (p) { var parts = p.split('|'); add(parts[1], 'down', parseInt(parts[0], 10)); }
      else if (rm !== null) { App.S.timers.splice(parseInt(rm, 10), 1); App.save(); draw(); }
      else if (b.id === 'tadd') { var m = num($('#tm', el).value, 10); add($('#tl', el).value.trim() || 'Timer', 'down', Math.max(1, m) * 60); }
    };
    draw();
    var iv = setInterval(draw, 1000);
    return function () { clearInterval(iv); };
  }

  /* ================= LIGHT, SOS, MORSE ================= */
  var MORSE = { A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.', G: '--.', H: '....', I: '..', J: '.---', K: '-.-', L: '.-..', M: '--', N: '-.', O: '---', P: '.--.', Q: '--.-', R: '.-.', S: '...', T: '-', U: '..-', V: '...-', W: '.--', X: '-..-', Y: '-.--', Z: '--..', '0': '-----', '1': '.----', '2': '..---', '3': '...--', '4': '....-', '5': '.....', '6': '-....', '7': '--...', '8': '---..', '9': '----.', '.': '.-.-.-', ',': '--..--', '?': '..--..', '/': '-..-.', '-': '-....-', '=': '-...-', '@': '.--.-.' };
  function timeline(text) {
    var seq = [], words = text.toUpperCase().trim().split(/\s+/).filter(Boolean), first = true;
    words.forEach(function (w, wi) {
      if (wi) seq.push([0, 7]);
      first = true;
      w.split('').forEach(function (ch) {
        var code = MORSE[ch]; if (!code) return;
        if (!first) seq.push([0, 3]);
        first = false;
        code.split('').forEach(function (sym, si) { if (si) seq.push([0, 1]); seq.push([1, sym === '.' ? 1 : 3]); });
      });
    });
    return seq;
  }
  function player(seq, unit, loopGapUnits, onState, sound) {
    var stopped = false, i = 0, tm = null;
    function step() {
      if (stopped) return;
      if (i >= seq.length) { onState(0); if (loopGapUnits == null) return; i = 0; tm = setTimeout(step, loopGapUnits * unit); return; }
      var s = seq[i++]; onState(s[0]);
      if (s[0] && sound) beep(700, s[1] * unit, 0.2);
      tm = setTimeout(step, s[1] * unit);
    }
    step();
    return function () { stopped = true; clearTimeout(tm); onState(0); };
  }
  var torchStream = null;
  function setTorch(on) {
    if (!on) { if (torchStream) { torchStream.getTracks().forEach(function (t) { t.stop(); }); torchStream = null; } return Promise.resolve(true); }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return Promise.resolve(false);
    return navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } }).then(function (stream) {
      var track = stream.getVideoTracks()[0], caps = track.getCapabilities ? track.getCapabilities() : {};
      if (!caps.torch) { stream.getTracks().forEach(function (t) { t.stop(); }); return false; }
      return track.applyConstraints({ advanced: [{ torch: true }] }).then(function () { torchStream = stream; return true; });
    }).catch(function () { return false; });
  }
  function mountLight(el) {
    var overlay = null, stopPlay = null;
    el.innerHTML =
      '<div class="card"><h3>Screen light</h3><p>Set screen brightness to maximum for the brightest light. Red keeps your eyes adjusted to the dark.</p><div class="btn-row">' +
      '<button class="btn" data-c="#ffffff|#000000">⚪ White</button><button class="btn" data-c="#ffb347|#000000">🔶 Warm</button><button class="btn" data-c="#ff0000|#000000">🔴 Red</button></div>' +
      '<div class="btn-row"><button class="btn" id="torch">📸 Try phone flashlight (camera LED)</button></div></div>' +
      '<div class="card"><h3>SOS signal</h3><p>Flashes ··· −−− ··· (three short, three long, three short) over and over. Face the screen toward rescuers, aircraft or distant people. Slow flashing is easier to see than fast.</p>' +
      '<label class="chk"><input type="checkbox" id="ssound"><span>Beep with the flashes</span></label><div class="btn-row"><button class="btn danger" id="sos">Start SOS flasher</button></div></div>' +
      '<div class="card"><h3>Morse message</h3><input type="text" id="mt" placeholder="Type a short message, e.g. NEED WATER" maxlength="80">' +
      '<label class="f">Speed</label><select id="ms"><option value="400">Slow (best for beginners)</option><option value="250" selected>Normal</option><option value="150">Fast</option></select>' +
      '<div id="mprev" class="muted" style="margin:.5rem 0;word-break:break-all;font-family:monospace"></div><div class="btn-row"><button class="btn primary" id="mgo">Flash message</button></div>' +
      '<label class="chk"><input type="checkbox" id="msound"><span>Beep with the flashes</span></label></div>' +
      '<p>Code chart and signals: ' + link('phonetic-morse', 'Morse &amp; phonetic alphabet') + ' · ' + link('signaling-rescue', 'Signaling for rescue') + '</p>';

    function open(bg) {
      close();
      overlay = document.createElement('div'); overlay.className = 'light-overlay'; overlay.style.background = bg;
      overlay.style.color = bg === '#ffffff' || bg === '#ffb347' ? '#000' : '#fff';
      overlay.textContent = 'Tap anywhere to turn off'; overlay.onclick = close;
      document.body.appendChild(overlay); App.wake(true);
    }
    function close() {
      if (stopPlay) { stopPlay(); stopPlay = null; }
      if (overlay) { overlay.remove(); overlay = null; }
      App.wake(false);
    }
    el.onclick = function (ev) {
      var b = ev.target.closest('button'); if (!b) return;
      var c = b.getAttribute('data-c');
      if (c) { open(c.split('|')[0]); }
      else if (b.id === 'sos') {
        open('#000000'); var snd = $('#ssound', el).checked, ov = overlay;
        stopPlay = player(timeline('SOS'), 250, 9, function (on) { ov.style.background = on ? '#ffffff' : '#000000'; }, snd);
      } else if (b.id === 'mgo') {
        var seq = timeline($('#mt', el).value); if (!seq.length) return App.toast('Type a message first');
        open('#000000'); var ov2 = overlay, unit = parseInt($('#ms', el).value, 10);
        stopPlay = player(seq, unit, 14, function (on) { ov2.style.background = on ? '#ffffff' : '#000000'; }, $('#msound', el).checked);
      } else if (b.id === 'torch') {
        if (torchStream) { setTorch(false); b.textContent = '📸 Try phone flashlight (camera LED)'; return; }
        setTorch(true).then(function (ok) {
          if (ok) b.textContent = '📸 Flashlight ON (tap to turn off)';
          else App.toast('This browser cannot control the camera light. Use the screen light instead.', 4500);
        });
      }
    };
    $('#mt', el).oninput = function () {
      $('#mprev', el).textContent = this.value.toUpperCase().split('').map(function (ch) { return ch === ' ' ? '/' : (MORSE[ch] || ''); }).join(' ');
    };
    return function () { close(); setTorch(false); };
  }

  /* ================= COMPASS ================= */
  function mountCompass(el) {
    var on = false, got = false, chk = null;
    el.innerHTML =
      '<div class="compass-wrap"><div class="compass-needle"></div><div class="compass-dial" id="dial">' +
      '<span style="left:50%;top:10%;color:var(--danger)">N</span><span style="left:90%;top:50%;margin-top:-.7rem">E</span><span style="left:50%;top:90%;margin-top:-1.4rem">S</span><span style="left:10%;top:50%;margin-top:-.7rem">W</span></div></div>' +
      '<div class="heading-read" id="hd">--</div><div class="muted" style="text-align:center" id="hdt">Hold the phone flat and level.</div>' +
      '<div class="btn-row"><button class="btn primary big" id="cs">Start compass</button></div>' +
      '<div class="callout warning"><div class="co-title">Check it</div><div class="co-body">Phone compasses are thrown off by magnets, metal, cases with magnetic clasps, cars and power lines. Wave the phone in a figure-8 to calibrate and cross-check with the sun or stars: ' + link('direction-sun-stars', 'Finding direction') + '. This shows <b>magnetic</b> north; true north differs by your local declination (see ' + link('map-compass', 'maps &amp; compass') + '). Not every device has a compass sensor.</div></div>';
    function dirName(h) { return ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'][Math.round(h / 22.5) % 16]; }
    function onOrient(ev) {
      var h = null;
      if (typeof ev.webkitCompassHeading === 'number') h = ev.webkitCompassHeading;
      else if ((ev.absolute === true || ev.type === 'deviceorientationabsolute') && typeof ev.alpha === 'number') h = (360 - ev.alpha) % 360;
      if (h === null) return;
      got = true;
      $('#dial', el).style.transform = 'rotate(' + (-h) + 'deg)';
      $('#hd', el).textContent = Math.round(h) + '° ' + dirName(h);
      $('#hdt', el).textContent = 'Magnetic heading';
    }
    function start() {
      var go = function () {
        window.addEventListener('deviceorientationabsolute', onOrient, true);
        window.addEventListener('deviceorientation', onOrient, true);
        on = true; $('#cs', el).textContent = 'Stop compass';
        chk = setTimeout(function () { if (!got) $('#hdt', el).textContent = 'No compass data. This device or browser may not support it, or permission was denied.'; }, 2500);
      };
      if (window.DeviceOrientationEvent && typeof DeviceOrientationEvent.requestPermission === 'function') {
        DeviceOrientationEvent.requestPermission().then(function (r) { if (r === 'granted') go(); else $('#hdt', el).textContent = 'Permission denied. Allow motion & orientation access in Settings.'; }).catch(function () { $('#hdt', el).textContent = 'Could not get permission.'; });
      } else go();
    }
    function stop() {
      window.removeEventListener('deviceorientationabsolute', onOrient, true);
      window.removeEventListener('deviceorientation', onOrient, true);
      on = false; clearTimeout(chk); $('#cs', el).textContent = 'Start compass';
    }
    $('#cs', el).onclick = function () { on ? stop() : start(); };
    return stop;
  }

  /* ================= WATER TREATMENT CALCULATOR ================= */
  function mountWater(el) {
    el.innerHTML =
      '<div class="callout warning"><div class="co-title">Use the right bleach</div><div class="co-body">Plain household bleach with sodium hypochlorite as the only active ingredient. <b>No</b> scents, added cleaners, or color-safe formulas. Old bleach weakens (use a bottle less than a year old). Bleach kills germs; it does <b>not</b> remove fuel, pesticides or heavy metals.</div></div>' +
      '<div class="card"><div class="two"><div><label class="f">Amount of water</label><input type="number" id="wv" value="1" min="0" step="any" inputmode="decimal"></div>' +
      '<div><label class="f">Unit</label><select id="wu"><option value="gal">gallons</option><option value="qt">quarts</option><option value="L">liters</option></select></div></div>' +
      '<label class="f">Bleach strength (read the label)</label><select id="ws"><option value="6">5–6% sodium hypochlorite (regular)</option><option value="8.25">8.25% (concentrated / splashless)</option><option value="x">Other (type percent)</option></select>' +
      '<div id="wx" hidden><label class="f">Percent sodium hypochlorite</label><input type="number" id="wp" value="6" min="1" max="12" step="any" inputmode="decimal"></div>' +
      '<label class="chk"><input type="checkbox" id="wc"><span>Water is cloudy or discolored (double the dose, and strain it through clean cloth first)</span></label></div>' +
      '<div class="card" id="wr"></div>' +
      '<div class="card"><h3>Other ways</h3><ul><li><b>Boil:</b> rolling boil 1 minute (3 minutes above 5,000 ft / 1,500 m). Safest choice if you can.</li><li><b>Pool shock</b> (calcium hypochlorite): see ' + link('chemical-disinfection', 'disinfecting with bleach, pool shock and tablets') + '.</li><li><b>Filters, sunlight, tablets:</b> ' + link('water-filters', 'filters') + ', ' + link('boiling-water', 'sunlight') + '.</li></ul></div>';
    function calc() {
      var v = num($('#wv', el).value, 0), u = $('#wu', el).value, sv = $('#ws', el).value;
      $('#wx', el).hidden = sv !== 'x';
      var pct = sv === 'x' ? num($('#wp', el).value, 6) : parseFloat(sv);
      var gal = u === 'gal' ? v : u === 'qt' ? v / 4 : v / 3.78541;
      var perGal = sv === '6' ? 8 : sv === '8.25' ? 6 : 48 / pct; // CDC: 8 drops/gal at 5-6%, 6 drops/gal at 8.25%
      var cloudy = $('#wc', el).checked;
      if (cloudy) perGal *= 2;
      var drops = Math.max(1, Math.ceil(gal * perGal - 0.25)), ml = drops * 0.05;
      var note = '';
      if (pct < 4) note = '<div class="callout danger"><div class="co-title">Too weak</div><div class="co-body">Bleach under about 5% may not disinfect at this dose. Use boiling instead.</div></div>';
      else if (pct > 9) note = '<div class="callout warning"><div class="co-title">Strong product</div><div class="co-body">Only use products labeled safe for disinfecting drinking water, and measure with an eyedropper.</div></div>';
      var tsp = ml >= 0.6 ? ' (about ' + (ml / 4.93 < 0.1 ? '1/8' : (Math.round(ml / 4.93 * 8) / 8)) + ' tsp)' : '';
      $('#wr', el).innerHTML = v > 0
        ? note + '<div class="heading-read" style="font-size:1.6rem">Add ' + drops + ' drop' + (drops === 1 ? '' : 's') + '</div><div class="muted" style="text-align:center">≈ ' + (Math.round(ml * 10) / 10) + ' mL' + tsp + ' of bleach</div>' +
          '<ol class="steps"><li>Stir or shake well.</li><li>Wait <b>30 minutes</b> (60 minutes if the water is very cold or cloudy).</li><li>It should smell slightly of chlorine. If not, add the same dose again and wait 15 more minutes. If it still does not smell, do not drink it.</li></ol>'
        : '<p class="muted">Enter an amount.</p>';
    }
    $$('input,select', el).forEach(function (n) { n.oninput = calc; n.onchange = calc; });
    calc();
    return null;
  }

  /* ================= SUPPLIES CALCULATOR ================= */
  function mountSupplies(el) {
    el.innerHTML =
      '<div class="card"><div class="two"><div><label class="f">Adults &amp; teens</label><input type="number" id="sa" value="2" min="0" inputmode="numeric"></div><div><label class="f">Children</label><input type="number" id="sk" value="0" min="0" inputmode="numeric"></div>' +
      '<div><label class="f">Days to cover</label><input type="number" id="sd" value="14" min="1" inputmode="numeric"></div><div><label class="f">Dogs / Cats</label><div class="two"><input type="number" id="sdog" value="0" min="0" inputmode="numeric"><input type="number" id="scat" value="0" min="0" inputmode="numeric"></div></div></div>' +
      '<label class="chk"><input type="checkbox" id="sh"><span>Hot climate or hard physical work (+50% water)</span></label></div>' +
      '<div id="sr"></div>' +
      '<p class="muted">Quick presets: <a href="#" data-d="3">3 days</a> · <a href="#" data-d="14">2 weeks</a> · <a href="#" data-d="90">3 months</a> · <a href="#" data-d="365">1 year</a>. Rule-of-thumb survival ration; add canned vegetables, fruit, meat, spices and comfort foods. See ' + link('home-stockpile', 'Home Stockpile') + ' and ' + link('pantry-rotation', 'Pantry Rotation') + '.</p>';
    function row(a, b) { return '<tr><td>' + a + '</td><td>' + b + '</td></tr>'; }
    function r1(x) { return Math.round(x * 10) / 10; }
    function calc() {
      var A = Math.max(0, num($('#sa', el).value, 0)), K = Math.max(0, num($('#sk', el).value, 0)), D = Math.max(1, num($('#sd', el).value, 1));
      var dogs = Math.max(0, num($('#sdog', el).value, 0)), cats = Math.max(0, num($('#scat', el).value, 0)), hot = $('#sh', el).checked;
      var people = A + K, eq = A + K * 0.7;
      var gal = (people * 1 + dogs * 0.35 + cats * 0.1) * D * (hot ? 1.5 : 1);
      var kcal = (A * 2200 + K * 1500) * D;
      var f = function (lbPerDay) { return lbPerDay * eq * D; };
      var rice = f(0.5), flour = f(0.25), beans = f(0.35), oilOz = f(1), sugarOz = f(1.5), saltOz = f(0.1);
      var dry = rice + flour + beans + sugarOz / 16 + saltOz / 16;
      var html = '<h2 class="sec">Water</h2><div class="tbl-wrap"><table class="res-table"><tbody>' +
        row('Total water', r1(gal) + ' gal (' + r1(gal * 3.785) + ' L)') + row('5-gallon jugs', Math.ceil(gal / 5)) + row('55-gallon drums', r1(gal / 55)) + '</tbody></table></div>' +
        '<h2 class="sec">Food (about ' + Math.round(kcal / D / Math.max(1, people)) + ' kcal per person per day)</h2><div class="tbl-wrap"><table class="res-table"><tbody>' +
        row('Total calories', Math.round(kcal).toLocaleString() + ' kcal') +
        row('Rice or other grain', r1(rice) + ' lb (' + r1(rice * 0.4536) + ' kg)') + row('Flour or rolled oats', r1(flour) + ' lb (' + r1(flour * 0.4536) + ' kg)') +
        row('Dry beans or lentils', r1(beans) + ' lb (' + r1(beans * 0.4536) + ' kg)') + row('Cooking oil', r1(oilOz / 16) + ' pt (' + r1(oilOz * 0.0296) + ' L)') +
        row('Sugar', r1(sugarOz / 16) + ' lb') + row('Salt', r1(saltOz / 16) + ' lb') +
        row('Dry storage needed', '≈ ' + Math.max(1, Math.ceil(dry / 35)) + ' five-gallon buckets') + '</tbody></table></div>' +
        '<h2 class="sec">Household</h2><div class="tbl-wrap"><table class="res-table"><tbody>' +
        row('Toilet paper', Math.ceil(people * D / 7) + ' rolls') + row('Bar soap', Math.max(1, Math.ceil(people * D / 30))) + row('Trash bags (heavy)', Math.max(5, Math.ceil(D / 2))) + row('Vitamins (multi)', Math.ceil(people * D) + ' tablets') + '</tbody></table></div>';
      $('#sr', el).innerHTML = html;
    }
    $$('input', el).forEach(function (n) { n.oninput = calc; n.onchange = calc; });
    el.addEventListener('click', function (ev) { var a = ev.target.closest('a[data-d]'); if (a) { ev.preventDefault(); $('#sd', el).value = a.getAttribute('data-d'); calc(); } });
    calc();
    return null;
  }

  /* ---- ZIP -> zone / frost lookup (data in data/zonedata.js, built by tools/build-zone-data.mjs) ---- */
  var ZD = null;
  function zoneData() {
    if (ZD) return ZD;
    var D = window.GDG_ZONEDATA; if (!D) return null;
    function b64(s) { var bin = atob(s), a = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i); return a; }
    function pop(b) { b = b - ((b >> 1) & 0x55); b = (b & 0x33) + ((b >> 2) & 0x33); return (b + (b >> 4)) & 0x0f; }
    function varint(a, p) { var r = 0, sh = 0, b; do { b = a[p.i++]; r += (b & 127) * Math.pow(2, sh); sh += 7; } while (b & 128); return r; }
    var bits = b64(D.bitmap), sd = b64(D.sdata), zr = b64(D.zruns), sr = b64(D.sruns), names = D.names.split('|');
    var cum = new Uint32Array(bits.length + 1);
    for (var i = 0; i < bits.length; i++) cum[i + 1] = cum[i] + pop(bits[i]);
    var zs = [], zv = [], ss = [], sv = [], p = { i: 0 }, n = 0, id = 0;
    while (p.i < zr.length) { var zc = zr[p.i++], cnt = varint(zr, p); zs.push(n); zv.push(zc); n += cnt; }
    p = { i: 0 }; n = 0;
    while (p.i < sr.length) { var d = varint(sr, p); d = (d % 2) ? -((d + 1) / 2) : d / 2; id += d; var c2 = varint(sr, p); ss.push(n); sv.push(id); n += c2; }
    function find(starts, rank) { var lo = 0, hi = starts.length - 1; while (lo < hi) { var mid = (lo + hi + 1) >> 1; if (starts[mid] <= rank) lo = mid; else hi = mid - 1; } return lo; }
    function station(sid) {
      if (!sid) return null;
      var o = (sid - 1) * 9, l50 = sd[o] | (sd[o + 1] << 8), f50 = sd[o + 3] | (sd[o + 4] << 8), tm = sd[o + 6];
      return { name: names[sid - 1], l50: l50, l10: l50 + sd[o + 2], f50: f50, f10: f50 - sd[o + 5], tmin: tm > 127 ? tm - 256 : tm, tmax: sd[o + 7], hot: sd[o + 8] };
    }
    ZD = {
      zones: D.zones, trange: D.trange, typ: D.typ,
      lookup: function (zip) {
        var z = parseInt(zip, 10); if (!(z >= 0 && z < 100000)) return null;
        var by = z >> 3, bit = z & 7; if (!((bits[by] >> bit) & 1)) return null;
        var rank = cum[by] + pop(bits[by] & ((1 << bit) - 1));
        return { zip: ('00000' + z).slice(-5), zone: D.zones[zv[find(zs, rank)]], station: station(sv[find(ss, rank)]) };
      }
    };
    return ZD;
  }

  /* ================= PLANTING CALENDAR ================= */
  // [crop, action, weeksFromStart, weeksToEnd] relative to LAST spring frost (negative = before)
  var SPRING = [
    ['Onions from seed', 'Start indoors', -12, -10], ['Peppers, eggplant', 'Start indoors', -10, -8], ['Broccoli, cabbage, cauliflower', 'Start indoors', -10, -6],
    ['Tomatoes', 'Start indoors', -8, -6], ['Sweet potato slips', 'Start slips indoors', -8, -6], ['Lettuce, kale', 'Start indoors', -6, -4],
    ['Peas', 'Sow outdoors', -6, -4], ['Spinach', 'Sow outdoors', -6, -4], ['Onion sets / plants', 'Plant outdoors', -4, -2], ['Potatoes (seed potatoes)', 'Plant outdoors', -4, -2],
    ['Lettuce, kale, chard', 'Sow outdoors', -4, -2], ['Broccoli, cabbage (transplants)', 'Transplant outdoors', -4, -2], ['Beets, radishes, turnips', 'Sow outdoors', -4, -1], ['Carrots', 'Sow outdoors', -3, -1],
    ['Tomatoes', 'Transplant outdoors', 1, 2], ['Peppers, eggplant', 'Transplant outdoors', 2, 3], ['Bush and pole beans', 'Sow outdoors', 1, 3], ['Corn', 'Sow outdoors', 1, 3],
    ['Squash, pumpkin, cucumber, melon', 'Sow outdoors', 1, 3], ['Sweet potatoes', 'Plant slips outdoors', 2, 4], ['Sunflowers', 'Sow outdoors', 0, 2]
  ];
  // relative to FIRST fall frost (negative = weeks before)
  var FALL = [
    ['Bush beans', 'Sow outdoors', -12, -10], ['Carrots', 'Sow outdoors', -12, -10], ['Broccoli, cabbage (transplants)', 'Transplant outdoors', -12, -10], ['Peas (fall crop)', 'Sow outdoors', -12, -10],
    ['Beets', 'Sow outdoors', -10, -8], ['Kale, collards', 'Sow or transplant', -10, -8], ['Spinach, lettuce', 'Sow outdoors', -8, -6], ['Radishes, turnips', 'Sow outdoors', -8, -6],
    ['Garlic', 'Plant cloves', 2, 4]
  ];
  function mountPlanting(el) {
    var Z = zoneData();
    var now = new Date(), yr = now.getMonth() >= 9 ? now.getFullYear() + 1 : now.getFullYear();
    var fr = App.S.frost || {};
    var st = { zip: fr.zip || '', zone: fr.zone || '', mode: fr.mode === 'safe' ? 'safe' : 'avg', manual: fr.manual === undefined ? !!(fr.last || fr.first) && !fr.zone : !!fr.manual, res: null };
    var fToC = function (f) { return Math.round((f - 32) * 5 / 9); };
    var rangeStr = function (tr) { var m = /^(-?\d+) to (-?\d+)$/.exec(tr); return m ? m[1] + ' to ' + m[2] + ' °F (' + fToC(+m[1]) + ' to ' + fToC(+m[2]) + ' °C)' : tr; };
    var shortDay = function (d) { return new Date(2001, 0, d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }); };
    var zoneOpts = Z ? Z.zones.map(function (c, i) { return '<option value="' + c + '">Zone ' + c + ' (' + Z.trange[i].replace(' to ', ' to ') + ' °F)</option>'; }).join('') : '';

    el.innerHTML =
      '<div class="callout note"><div class="co-title">How this works</div><div class="co-body">Type your ZIP code. The app finds your USDA hardiness zone, estimates your frost dates and temperatures from nearby weather-station records, and fills in the calendar. You can change the zone or the dates at any time. All of this works offline. See ' + link('frost-dates-calendar', 'frost dates &amp; zones') + '.</div></div>' +
      (Z ? '<div class="card"><h3>1. Your ZIP code</h3><div class="zip-row"><input type="text" id="pz" inputmode="numeric" maxlength="5" autocomplete="postal-code" placeholder="US ZIP, e.g. 80202" aria-label="US ZIP code"><button class="btn primary" id="pgo">Look up</button></div><div id="pzmsg" class="muted" style="margin-top:.4rem"></div>' +
        '<label class="f" for="pzone">2. Your hardiness zone</label><select id="pzone"><option value="">Pick your zone…</option>' + zoneOpts + '</select><div class="muted" style="margin-top:.3rem">Filled in from your ZIP. Change it if you know better (a sheltered yard, a high hillside) or if you have no ZIP.</div>' +
        '<label class="f">3. How cautious?</label><div class="seg" id="pmode"><button data-m="avg">Average frost dates</button><button data-m="safe">Play it safe</button></div><div class="muted" id="pmodetx"></div></div>' +
        '<div id="pinfo"></div>' : '') +
      '<div class="card"><h3>' + (Z ? 'Your dates (you can edit)' : 'Your frost dates') + '</h3><div class="two"><div><label class="f">Last spring frost</label><input type="date" id="pl" value="' + (fr.last || '') + '"></div><div><label class="f">First fall frost</label><input type="date" id="pf" value="' + (fr.first || '') + '"></div></div>' +
      '<label class="f">Planting year</label><input type="number" id="py" value="' + yr + '" min="2000" max="2200" inputmode="numeric"></div>' +
      '<div id="pr"></div>' +
      '<details class="card"><summary><b>About this data</b></summary><p class="muted">Zones: 2023 USDA Plant Hardiness Zone Map (USDA Agricultural Research Service and the PRISM Group at Oregon State University), by ZIP code. This app is not the official map; for that see planthardiness.ars.usda.gov.</p><p class="muted">Frost dates and temperatures: NOAA NCEI U.S. Climate Normals 1991–2020 from a nearby weather station chosen to match your zone. &ldquo;Frost&rdquo; here means 32 °F (0 °C). &ldquo;Average&rdquo; dates have a 50% chance of a frost afterward (spring) or before (fall). &ldquo;Play it safe&rdquo; dates have only about a 10% chance. These are estimates: hills, valleys, cities, lakes and the weather of the year can move the real dates by weeks.</p></details>';

    function sel(id) { return $(id, el); }
    function msg(t) { var m = sel('#pzmsg'); if (m) m.innerHTML = t; }
    function station() { return st.res && st.res.zone === st.zone && st.res.station ? st.res.station : null; }
    function vals() {
      if (!Z || !st.zone) return null;
      var s = station();
      if (s) return { src: 'station', name: s.name, l50: s.l50, l10: s.l10, f50: s.f50, f10: s.f10, tmin: s.tmin, tmax: s.tmax, hot: s.hot, nf: s.l50 === 0 };
      var t = Z.typ[Z.zones.indexOf(st.zone)];
      return t ? { src: 'zone', n: t[8], l50: t[0], l10: t[1], f50: t[2], f10: t[3], tmin: t[4], tmax: t[5], hot: t[6], nf: !!t[7] } : { src: 'none' };
    }
    function iso(y, m, d) { return y + '-' + (m + 1 < 10 ? '0' : '') + (m + 1) + '-' + (d < 10 ? '0' : '') + d; }
    function applyDates() {
      var v = vals(); if (!v || v.src === 'none') return;
      var y = parseInt(sel('#py').value, 10) || yr, lm, ld, fm, fd, fy = y;
      if (v.nf) { lm = 0; ld = 31; fm = 11; fd = 15; }   // no regular freeze: stand-in anchors
      else {
        var L = new Date(2001, 0, st.mode === 'safe' ? v.l10 : v.l50), F = new Date(2001, 0, st.mode === 'safe' ? v.f10 : v.f50);
        lm = L.getMonth(); ld = L.getDate(); fm = F.getMonth(); fd = F.getDate(); if (F.getFullYear() > 2001) fy = y + 1;
      }
      sel('#pl').value = iso(y, lm, ld); sel('#pf').value = iso(fy, fm, fd);
    }
    function renderInfo() {
      var box = sel('#pinfo'); if (!box) return;
      if (!st.zone) { box.innerHTML = '<div class="card muted">Enter a ZIP code or pick a zone to see frost dates and temperatures.</div>'; return; }
      var zi = Z.zones.indexOf(st.zone), v = vals(), h = '<div class="card"><h3>Zone ' + st.zone + '</h3><div class="muted">Coldest winter nights (yearly average low): ' + rangeStr(Z.trange[zi]) + '</div>';
      if (!v || v.src === 'none') h += '<p>There is not enough weather-station data for this zone. Please enter your frost dates below.</p>';
      else {
        if (v.nf) h += '<p><b>Freezes are rare or absent here.</b> You can grow warm-season crops almost all year. The calendar below uses Jan 31 and Dec 15 as stand-in "frost" dates, so plan around heat and rain too.</p>';
        else {
          var gd = function (l, f) { return Math.max(0, f - l); };
          h += '<div class="tbl-wrap"><table class="res-table"><thead><tr><th></th><th>Average</th><th>Play it safe</th></tr></thead><tbody>' +
            '<tr><td>Last spring frost</td><td>' + shortDay(v.l50) + '</td><td>' + shortDay(v.l10) + '</td></tr>' +
            '<tr><td>First fall frost</td><td>' + shortDay(v.f50) + '</td><td>' + shortDay(v.f10) + '</td></tr>' +
            '<tr><td>Frost-free days</td><td>' + gd(v.l50, v.f50) + '</td><td>' + gd(v.l10, v.f10) + '</td></tr></tbody></table></div>';
        }
        h += '<div class="kv"><span>Average daily high / low (whole year)</span><b>' + v.tmax + ' / ' + v.tmin + ' °F (' + fToC(v.tmax) + ' / ' + fToC(v.tmin) + ' °C)</b></div>' +
          '<div class="kv"><span>Days per year at or above 90 °F (32 °C)</span><b>' + v.hot + '</b></div>';
        h += '<p class="muted" style="margin-top:.6rem">' + (v.src === 'station'
          ? 'Based on the nearby weather station <b>' + e(v.name) + '</b> (NOAA 1991–2020 normals). It is usually near your ZIP but can be some miles away.'
          : 'Typical for zone ' + e(st.zone) + ' across the US (median of ' + v.n + ' nearby ZIP codes\' stations). Your exact spot can differ by weeks.') + '</p>';
        if (v.hot >= 60) h += '<div class="callout note"><div class="co-title">Hot summers</div><div class="co-body">With this many days at or above 90 °F, lettuce, spinach, peas and broccoli do best in fall, winter and early spring. Heat-lovers (okra, sweet potatoes, southern peas, peppers) thrive in summer. Mulch and afternoon shade help.</div></div>';
      }
      box.innerHTML = h + '</div>';
    }
    function syncMode() {
      $$('#pmode button', el).forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-m') === st.mode); });
      var t = sel('#pmodetx'); if (t) t.textContent = st.mode === 'safe' ? 'Dates with only about a 10% chance of a frost afterward (spring) or before (fall). Best for tender crops.' : 'Dates with a 50% chance of a frost afterward (spring) or before (fall). The usual gardening standard.';
    }
    function save() { App.S.frost = { last: sel('#pl').value, first: sel('#pf').value, zip: st.zip, zone: st.zone, mode: st.mode, manual: st.manual }; App.save(); }
    function refresh(reapply) {
      if (Z) { renderInfo(); syncMode(); if (reapply) { st.manual = false; applyDates(); } }
      calc(); save();
    }

    function md(date) { return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }); }
    function parts(s) { var p = s.split('-'); return p.length === 3 ? { m: parseInt(p[1], 10) - 1, d: parseInt(p[2], 10) } : null; }
    function table(rows, anchor, title) {
      var today = new Date(); today.setHours(0, 0, 0, 0);
      var list = rows.map(function (r) {
        var a = new Date(anchor.getTime() + r[2] * 7 * 864e5), b = new Date(anchor.getTime() + r[3] * 7 * 864e5);
        return { r: r, a: a, b: b, now: today >= a && today <= b };
      }).sort(function (x, y) { return x.a - y.a; });
      return '<h2 class="sec">' + title + '</h2><div class="tbl-wrap"><table><thead><tr><th>When</th><th>What</th></tr></thead><tbody>' +
        list.map(function (x) { return '<tr class="' + (x.now ? 'win-now' : '') + '"><td>' + md(x.a) + ' – ' + md(x.b) + (x.now ? ' <b>NOW</b>' : '') + '</td><td><b>' + e(x.r[0]) + '</b><br><span class="muted">' + e(x.r[1]) + '</span></td></tr>'; }).join('') + '</tbody></table></div>';
    }
    function calc() {
      var l = sel('#pl').value, f = sel('#pf').value, y = parseInt(sel('#py').value, 10) || yr;
      var h = '', lp = parts(l), fp = parts(f), spring = lp ? new Date(y, lp.m, lp.d) : null, fall = null;
      if (fp) { fall = new Date(y, fp.m, fp.d); if (spring && fall < spring) fall.setFullYear(y + 1); }
      if (spring) h += table(SPRING, spring, 'Spring planting (from ' + md(spring) + ' last frost)');
      if (fall) h += table(FALL, fall, 'Fall planting (counting back from ' + md(fall) + ' first frost)');
      if (spring && fall) h += '<p class="muted">Frost-free season: about ' + Math.round((fall - spring) / 864e5) + ' days.</p>';
      if (!h) h = '<p class="muted">Enter at least one date above.</p>';
      else h += '<p class="muted">Cool-season crops (peas, spinach, lettuce, kale, broccoli, potatoes) tolerate light frost. Warm-season crops (tomatoes, peppers, beans, corn, squash) are killed by frost: wait until the soil is also warm (about 60°F / 16°C). Start-indoors dates assume a sunny window or grow light. Full crop details: ' + link('veg-quick-reference', 'Vegetable Quick Reference') + '.</p>';
      sel('#pr').innerHTML = h;
    }

    function lookup() {
      var inp = sel('#pz'), z = inp.value.replace(/\D/g, '').slice(0, 5); inp.value = z;
      if (z.length !== 5) { msg('Enter all 5 digits of your ZIP code.'); return; }
      var r = Z.lookup(z);
      if (!r) { st.res = null; msg('ZIP ' + e(z) + ' is not in the USDA list (PO-box-only ZIPs and some areas are missing). Try a nearby ZIP, or pick your zone below.'); return; }
      st.zip = z; st.res = r; st.zone = r.zone; sel('#pzone').value = r.zone;
      msg('ZIP <b>' + e(z) + '</b> is in <b>zone ' + e(r.zone) + '</b>.' + (r.station ? '' : ' No close weather station, so typical zone values are used.'));
      refresh(true);
    }
    if (Z) {
      if (st.zip) st.res = Z.lookup(st.zip);
      if (st.res && !st.zone) st.zone = st.res.zone;
      sel('#pz').value = st.zip; sel('#pzone').value = st.zone;
      if (st.res) msg('ZIP <b>' + e(st.zip) + '</b> is in <b>zone ' + e(st.res.zone) + '</b>.');
      sel('#pgo').onclick = lookup;
      sel('#pz').oninput = function () { this.value = this.value.replace(/\D/g, '').slice(0, 5); if (this.value.length === 5) lookup(); };
      sel('#pz').onkeydown = function (ev) { if (ev.key === 'Enter') { ev.preventDefault(); lookup(); } };
      sel('#pzone').onchange = function () {
        st.zone = this.value;
        if (st.res && st.zone && st.res.zone !== st.zone) msg('Using typical values for zone ' + e(st.zone) + ' (your ZIP is in zone ' + e(st.res.zone) + ').');
        else if (st.res) msg('ZIP <b>' + e(st.zip) + '</b> is in <b>zone ' + e(st.res.zone) + '</b>.');
        refresh(true);
      };
      $$('#pmode button', el).forEach(function (b) { b.onclick = function () { st.mode = b.getAttribute('data-m'); refresh(true); }; });
    }
    sel('#pl').onchange = sel('#pf').onchange = function () { st.manual = true; calc(); save(); };
    sel('#py').onchange = sel('#py').oninput = function () { if (Z && !st.manual && st.zone) applyDates(); calc(); save(); };
    if (Z) { renderInfo(); syncMode(); if (!st.manual && st.zone) applyDates(); }
    calc();
    return null;
  }

  /* ================= UNIT CONVERTER ================= */
  var UNITS = {
    Volume: [['US gallon', 'gal', 3785.41], ['US quart', 'qt', 946.353], ['US pint', 'pt', 473.176], ['US cup', 'cup', 236.588], ['fluid ounce', 'fl oz', 29.5735], ['tablespoon', 'Tbsp', 14.7868], ['teaspoon', 'tsp', 4.92892], ['liter', 'L', 1000], ['milliliter', 'mL', 1]],
    Weight: [['pound', 'lb', 453.592], ['ounce', 'oz', 28.3495], ['kilogram', 'kg', 1000], ['gram', 'g', 1]],
    Length: [['mile', 'mi', 1609.344], ['yard', 'yd', 0.9144], ['foot', 'ft', 0.3048], ['inch', 'in', 0.0254], ['kilometer', 'km', 1000], ['meter', 'm', 1], ['centimeter', 'cm', 0.01]],
    Area: [['acre', 'acre', 4046.856], ['square foot', 'sq ft', 0.092903], ['square yard', 'sq yd', 0.836127], ['square meter', 'sq m', 1], ['hectare', 'ha', 10000]],
    Pressure: [['psi', 'psi', 6.89476], ['kilopascal', 'kPa', 1], ['bar', 'bar', 100], ['atmosphere', 'atm', 101.325]],
    Temperature: [['Fahrenheit', '°F'], ['Celsius', '°C'], ['Kelvin', 'K']]
  };
  function mountConvert(el) {
    var cat = 'Volume';
    function draw() {
      el.innerHTML = '<div class="seg" id="cseg" style="flex-wrap:wrap">' + Object.keys(UNITS).map(function (k) { return '<button data-k="' + k + '" class="' + (k === cat ? 'on' : '') + '" style="min-width:33%">' + k + '</button>'; }).join('') + '</div>' +
        '<div class="card"><div class="two"><div><label class="f">Amount</label><input type="number" id="cv" value="1" step="any" inputmode="decimal"></div><div><label class="f">From</label><select id="cu">' +
        UNITS[cat].map(function (u, i) { return '<option value="' + i + '">' + u[0] + ' (' + u[1] + ')</option>'; }).join('') + '</select></div></div></div><div id="cr"></div>';
      $$('#cseg button', el).forEach(function (b) { b.onclick = function () { cat = b.getAttribute('data-k'); draw(); }; });
      if (App.S.units === 'metric') {   // metric preference: start from the first metric unit of this group
        var mi = -1; UNITS[cat].forEach(function (u, ix) { if (mi < 0 && /^(L|mL|kg|g|km|m|cm|sq m|ha|kPa|bar|°C)$/.test(u[1])) mi = ix; });
        if (mi > -1) $('#cu', el).value = String(mi);
      }
      $('#cv', el).oninput = calc; $('#cu', el).onchange = calc; calc();
    }
    function fmtN(x) { var a = Math.abs(x); return a >= 1000 ? x.toLocaleString(undefined, { maximumFractionDigits: 1 }) : '' + parseFloat(x.toPrecision(5)); }
    function calc() {
      var v = num($('#cv', el).value, 0), i = parseInt($('#cu', el).value, 10), list = UNITS[cat], out = [];
      if (cat === 'Temperature') {
        var c = i === 0 ? (v - 32) * 5 / 9 : i === 1 ? v : v - 273.15;
        out = [['Fahrenheit', '°F', c * 9 / 5 + 32], ['Celsius', '°C', c], ['Kelvin', 'K', c + 273.15]];
      } else out = list.map(function (u) { return [u[0], u[1], v * list[i][2] / u[2]]; });
      $('#cr', el).innerHTML = '<div class="tbl-wrap"><table class="res-table"><tbody>' + out.map(function (o) { return '<tr><td>' + o[0] + '</td><td>' + fmtN(o[2]) + ' ' + o[1] + '</td></tr>'; }).join('') + '</tbody></table></div>';
    }
    draw();
    return null;
  }

  /* ---------- registry ---------- */
  var LIST = [
    { id: 'cpr', icon: '❤️', title: 'CPR Metronome', desc: 'Steady 100–120 beat with a count and breath reminders.', mount: mountCPR },
    { id: 'timers', icon: '⏱️', title: 'Timers & Tourniquet Clock', desc: 'Tourniquet time, boil and bleach waits, burn cooling, custom timers.', mount: mountTimers },
    { id: 'light', icon: '🔦', title: 'Light, SOS & Morse', desc: 'Screen flashlight (white, warm, red), SOS flasher, Morse message flasher.', mount: mountLight },
    { id: 'compass', icon: '🧭', title: 'Compass', desc: 'Magnetic compass using your phone sensor (if it has one).', mount: mountCompass },
    { id: 'water', icon: '💧', title: 'Water Treatment Calculator', desc: 'Exact bleach drops for your amount of water.', mount: mountWater },
    { id: 'supplies', icon: '📦', title: 'Supplies Calculator', desc: 'How much water, food and basics for people, pets and days.', mount: mountSupplies },
    { id: 'planting', icon: '🌱', title: 'Planting Calendar & Zone Finder', desc: 'Enter your ZIP: hardiness zone, frost dates, temperatures and sow/transplant dates.', mount: mountPlanting },
    { id: 'convert', icon: '📏', title: 'Unit Converter', desc: 'Cups, gallons, pounds, miles, °F/°C, psi and more.', mount: mountConvert }
  ];

  window.GDG_TOOLS = {
    list: LIST,
    zones: zoneData,   // ZIP -> zone/frost lookup (also used by tests)
    beep: beep, vibrate: vibrate, audio: audio,   // shared with crisis mode
    boot: function (app) { App = app; if (!App.S.timers) App.S.timers = []; setInterval(tickTimers, 1000); }
  };
})();

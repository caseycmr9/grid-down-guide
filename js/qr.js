/* qr.js — dependency-free QR Code (Model 2) encoder per ISO/IEC 18004: byte mode (UTF-8), versions 1-10, ECC L/M/Q/H.
   QR.matrix(text, ecc) -> { size, modules[row][col] (true = dark), version, mask }   (ecc default 'M')
   QR.svg(text, {ecc, label}) -> black-on-white <svg> string incl. 4-module quiet zone
   QR.maxBytes(ecc) -> longest UTF-8 byte length that fits; longer input throws Error('too long'). */
(function (g) {
  'use strict';

  var ECL = { L: 0, M: 1, Q: 2, H: 3 };
  var FMT = [1, 0, 3, 2]; /* format-info ECC bits for L, M, Q, H */
  /* EC codewords per block, and block counts: versions 1-10, rows L,M,Q,H */
  var ECW = [
    [7, 10, 15, 20, 26, 18, 20, 24, 30, 18],
    [10, 16, 26, 18, 24, 16, 18, 22, 22, 26],
    [13, 22, 18, 26, 18, 24, 18, 22, 20, 24],
    [17, 28, 22, 16, 22, 28, 26, 26, 24, 28]
  ];
  var BLK = [
    [1, 1, 1, 1, 1, 2, 2, 2, 2, 4],
    [1, 1, 1, 2, 2, 4, 4, 4, 5, 5],
    [1, 1, 2, 2, 4, 4, 6, 6, 8, 8],
    [1, 1, 2, 4, 4, 4, 5, 6, 8, 8]
  ];
  /* alignment pattern centre coordinates by version */
  var ALN = [0, [], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34], [6, 22, 38], [6, 24, 42], [6, 26, 46], [6, 28, 50]];
  var P1 = [1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 0], P2 = [0, 0, 0, 0, 1, 0, 1, 1, 1, 0, 1];

  /* GF(256), primitive polynomial x^8+x^4+x^3+x^2+1 (0x11d) */
  var EXP = [], LOG = [];
  (function () {
    var x = 1, i;
    for (i = 0; i < 255; i++) { EXP[i] = x; LOG[x] = i; x <<= 1; if (x > 255) x ^= 0x11d; }
    for (i = 255; i < 512; i++) EXP[i] = EXP[i - 255];
  })();
  function mul(a, b) { return a && b ? EXP[LOG[a] + LOG[b]] : 0; }

  function rsGen(n) {
    var p = [1], q, i, j;
    for (i = 0; i < n; i++) {
      q = [];
      for (j = 0; j <= p.length; j++) q[j] = 0;
      for (j = 0; j < p.length; j++) { q[j] ^= p[j]; q[j + 1] ^= mul(p[j], EXP[i]); }
      p = q;
    }
    return p;
  }
  function rsRem(data, gen) {
    var n = gen.length - 1, r = [], i, j, f;
    for (i = 0; i < n; i++) r[i] = 0;
    for (i = 0; i < data.length; i++) {
      f = data[i] ^ r.shift();
      r.push(0);
      if (f) for (j = 0; j < n; j++) r[j] ^= mul(gen[j + 1], f);
    }
    return r;
  }

  function utf8(s) {
    var o = [], i, c, d;
    s = String(s);
    for (i = 0; i < s.length; i++) {
      c = s.charCodeAt(i);
      if (c >= 0xd800 && c < 0xdc00 && i + 1 < s.length && (d = s.charCodeAt(i + 1)) >= 0xdc00 && d < 0xe000) {
        c = 0x10000 + ((c - 0xd800) << 10) + (d - 0xdc00); i++;
      } else if (c >= 0xd800 && c < 0xe000) c = 0xfffd; /* lone surrogate */
      if (c < 0x80) o.push(c);
      else if (c < 0x800) o.push(0xc0 | (c >> 6), 0x80 | (c & 63));
      else if (c < 0x10000) o.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
      else o.push(0xf0 | (c >> 18), 0x80 | ((c >> 12) & 63), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
    }
    return o;
  }

  function rawCw(v) { /* total codewords (data + EC) in a version */
    var r = (16 * v + 128) * v + 64, n;
    if (v >= 2) { n = ALN[v].length; r -= (25 * n - 10) * n - 55; }
    if (v >= 7) r -= 36;
    return r >> 3;
  }
  function dataCw(v, e) { return rawCw(v) - ECW[e][v - 1] * BLK[e][v - 1]; }
  function maxFor(v, e) { return dataCw(v, e) - (v < 10 ? 2 : 3); } /* 4-bit mode + 8/16-bit count */
  function eccIndex(ecc) {
    var e = ECL[String(ecc || 'M').toUpperCase()];
    if (e === undefined) throw new Error('bad ecc');
    return e;
  }

  function dataWords(bytes, v, e) {
    var cap = dataCw(v, e), bits = [], cw = [], i, k, b;
    function put(val, len) { for (var t = len - 1; t >= 0; t--) bits.push((val >>> t) & 1); }
    put(4, 4); put(bytes.length, v < 10 ? 8 : 16);
    for (i = 0; i < bytes.length; i++) put(bytes[i], 8);
    put(0, Math.min(4, cap * 8 - bits.length));
    while (bits.length & 7) bits.push(0);
    for (i = 0; i < bits.length; i += 8) {
      for (b = 0, k = 0; k < 8; k++) b = (b << 1) | bits[i + k];
      cw.push(b);
    }
    for (i = 0; cw.length < cap; i++) cw.push(i & 1 ? 0x11 : 0xec);
    return cw;
  }

  /* split into blocks, add Reed-Solomon EC, interleave */
  function interleave(data, v, e) {
    var nb = BLK[e][v - 1], el = ECW[e][v - 1], raw = rawCw(v);
    var nShort = nb - (raw % nb), sLen = Math.floor(raw / nb) - el;
    var gen = rsGen(el), blocks = [], ecs = [], out = [], k = 0, i, j, d;
    for (i = 0; i < nb; i++) {
      d = data.slice(k, k + sLen + (i < nShort ? 0 : 1));
      k += d.length;
      blocks.push(d); ecs.push(rsRem(d, gen));
    }
    for (i = 0; i <= sLen; i++) for (j = 0; j < nb; j++) if (i < blocks[j].length) out.push(blocks[j][i]);
    for (i = 0; i < el; i++) for (j = 0; j < nb; j++) out.push(ecs[j][i]);
    return out;
  }

  /* 15-bit format info (BCH(15,5), generator 0x537, XOR mask 0x5412) written in both copies + dark module */
  function drawFormat(m, fn, n, e, mask) {
    var d = (FMT[e] << 3) | mask, r = d, bits, i;
    function s(row, col, i) { m[row][col] = ((bits >>> i) & 1) === 1; fn[row][col] = true; }
    for (i = 0; i < 10; i++) r = (r << 1) ^ ((r >>> 9) * 0x537);
    bits = ((d << 10) | r) ^ 0x5412;
    for (i = 0; i <= 5; i++) s(i, 8, i);
    s(7, 8, 6); s(8, 8, 7); s(8, 7, 8);
    for (i = 9; i < 15; i++) s(8, 14 - i, i);
    for (i = 0; i < 8; i++) s(8, n - 1 - i, i);
    for (i = 8; i < 15; i++) s(n - 15 + i, 8, i);
    m[n - 8][8] = true; fn[n - 8][8] = true; /* always-dark module */
  }

  /* 18-bit version info (BCH(18,6), generator 0x1f25) for versions >= 7, two 6x3 blocks */
  function drawVersion(m, fn, n, v) {
    var r = v, bits, i, a, b;
    for (i = 0; i < 12; i++) r = (r << 1) ^ ((r >>> 11) * 0x1f25);
    bits = (v << 12) | r;
    for (i = 0; i < 18; i++) {
      a = n - 11 + (i % 3); b = Math.floor(i / 3);
      m[b][a] = m[a][b] = ((bits >>> i) & 1) === 1;
      fn[b][a] = fn[a][b] = true;
    }
  }

  function maskBit(k, i, j) {
    switch (k) {
      case 0: return (i + j) % 2 === 0;
      case 1: return i % 2 === 0;
      case 2: return j % 3 === 0;
      case 3: return (i + j) % 3 === 0;
      case 4: return (Math.floor(i / 2) + Math.floor(j / 3)) % 2 === 0;
      case 5: return ((i * j) % 2) + ((i * j) % 3) === 0;
      case 6: return (((i * j) % 2) + ((i * j) % 3)) % 2 === 0;
      default: return ((((i + j) % 2) + ((i * j) % 3)) % 2) === 0;
    }
  }

  /* N1 (runs of 5+) and N3 (1:1:3:1:1 pattern with 4 light modules beside it) for one line */
  function lineScore(a) {
    var s = 0, n = a.length, run = 1, i, k, x, y;
    for (i = 1; i <= n; i++) {
      if (i < n && a[i] === a[i - 1]) run++;
      else { if (run >= 5) s += run - 2; run = 1; }
    }
    for (i = 0; i + 11 <= n; i++) {
      x = y = 1;
      for (k = 0; k < 11; k++) { if (a[i + k] !== P1[k]) x = 0; if (a[i + k] !== P2[k]) y = 0; }
      s += 40 * (x + y);
    }
    return s;
  }
  function penalty(m, n) {
    var s = 0, dark = 0, i, j, row, col;
    for (i = 0; i < n; i++) {
      row = []; col = [];
      for (j = 0; j < n; j++) {
        row.push(m[i][j] ? 1 : 0); col.push(m[j][i] ? 1 : 0);
        if (m[i][j]) dark++;
        if (i + 1 < n && j + 1 < n && m[i][j] === m[i][j + 1] && m[i][j] === m[i + 1][j] && m[i][j] === m[i + 1][j + 1]) s += 3; /* N2 */
      }
      s += lineScore(row) + lineScore(col);
    }
    /* N4: 10 points per full 5% deviation of the dark ratio from 50% */
    return s + 10 * Math.floor(Math.abs(dark * 20 - n * n * 10) / (n * n));
  }

  /* force (0-7) is for testing only; normally the lowest-penalty mask is chosen */
  function matrix(text, ecc, force) {
    var e = eccIndex(ecc), bytes = utf8(text), v = 1, n, m = [], fn = [], i, j, k, c, t, x, row, up, a, dr, dc, cw, total, best, bestScore, cand, sc;
    while (v <= 10 && bytes.length > maxFor(v, e)) v++;
    if (v > 10) throw new Error('too long');
    n = 4 * v + 17;
    for (i = 0; i < n; i++) { m.push([]); fn.push([]); for (j = 0; j < n; j++) { m[i].push(false); fn[i].push(false); } }
    function set(r, cc, d) { m[r][cc] = d; fn[r][cc] = true; }
    for (i = 0; i < n; i++) { set(6, i, i % 2 === 0); set(i, 6, i % 2 === 0); } /* timing */
    for (k = 0; k < 3; k++) { /* finders + separators */
      row = k === 2 ? n - 4 : 3; c = k === 1 ? n - 4 : 3;
      for (dr = -4; dr <= 4; dr++) for (dc = -4; dc <= 4; dc++) {
        if (row + dr < 0 || row + dr >= n || c + dc < 0 || c + dc >= n) continue;
        t = Math.max(Math.abs(dr), Math.abs(dc));
        set(row + dr, c + dc, t !== 2 && t !== 4);
      }
    }
    a = ALN[v];
    for (i = 0; i < a.length; i++) for (j = 0; j < a.length; j++) { /* alignment, skipping the 3 finder corners */
      if ((i === 0 && (j === 0 || j === a.length - 1)) || (i === a.length - 1 && j === 0)) continue;
      for (dr = -2; dr <= 2; dr++) for (dc = -2; dc <= 2; dc++) set(a[i] + dr, a[j] + dc, Math.max(Math.abs(dr), Math.abs(dc)) !== 1);
    }
    drawFormat(m, fn, n, e, 0); /* reserve format areas */
    if (v >= 7) drawVersion(m, fn, n, v);

    cw = interleave(dataWords(bytes, v, e), v, e);
    total = cw.length * 8; k = 0;
    for (c = n - 1; c >= 1; c -= 2) { /* zigzag placement, right to left in column pairs */
      if (c === 6) c = 5;
      up = ((c + 1) & 2) === 0;
      for (t = 0; t < n; t++) for (x = 0; x < 2; x++) {
        row = up ? n - 1 - t : t;
        if (!fn[row][c - x] && k < total) { m[row][c - x] = ((cw[k >> 3] >>> (7 - (k & 7))) & 1) === 1; k++; }
      }
    }

    best = null; bestScore = 1e9;
    for (k = 0; k < 8; k++) {
      if (force !== undefined && force !== k) continue;
      cand = [];
      for (i = 0; i < n; i++) { cand.push([]); for (j = 0; j < n; j++) cand[i].push(fn[i][j] ? m[i][j] : m[i][j] !== maskBit(k, i, j)); }
      drawFormat(cand, fn, n, e, k);
      sc = penalty(cand, n);
      if (sc < bestScore) { bestScore = sc; best = { size: n, modules: cand, version: v, mask: k }; }
    }
    return best;
  }

  function maxBytes(ecc) { return maxFor(10, eccIndex(ecc)); }

  function svg(text, opts) {
    opts = opts || {};
    var q = matrix(text, opts.ecc), n = q.size, w = n + 8, d = '', x, y, s;
    var label = String(opts.label == null ? 'QR code' : opts.label).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    for (y = 0; y < n; y++) {
      for (x = 0; x < n; x++) {
        if (!q.modules[y][x]) continue;
        s = x;
        while (x < n && q.modules[y][x]) x++;
        d += 'M' + (s + 4) + ' ' + (y + 4) + 'h' + (x - s) + 'v1h-' + (x - s) + 'z';
      }
    }
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + w + ' ' + w + '" shape-rendering="crispEdges" role="img" aria-label="' + label + '">' +
      '<rect width="' + w + '" height="' + w + '" fill="#fff"/><path fill="#000" d="' + d + '"/></svg>';
  }

  g.QR = { matrix: matrix, svg: svg, maxBytes: maxBytes };
})(typeof window !== 'undefined' ? window : this);

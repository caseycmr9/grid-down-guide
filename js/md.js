/* md.js — tiny "markdown-lite" parser/renderer used for all article bodies.
   Runs in the browser and (via vm) in the Node validator. No dependencies. */
(function (g) {
  'use strict';

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* Inline: [[id]] / [[id|label]] cross-links, **bold**, *italic* */
  function inline(s, ctx) {
    var t = esc(s);
    t = t.replace(/\[\[([a-z0-9-]+)(?:\|([^\]]+))?\]\]/g, function (m, id, label) {
      var text = label;
      if (!text) text = ctx && ctx.titleOf ? esc(ctx.titleOf(id)) : id;
      return '<a class="xref" href="#/a/' + id + '">' + text + '</a>';
    });
    t = t.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    t = t.replace(/(^|[\s(\[])\*([^*\s][^*]*?)\*(?=[\s).,;:!?\]]|$)/g, '$1<em>$2</em>');
    return t;
  }

  function stripInline(s) {
    return String(s)
      .replace(/\[\[([a-z0-9-]+)\|([^\]]+)\]\]/g, '$2')
      .replace(/\[\[([a-z0-9-]+)\]\]/g, '$1')
      .replace(/\*\*(.+?)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1');
  }

  var CALLOUT_RE = /^(WARNING|DANGER|CAUTION|TIP|NOTE|IMPORTANT|STOP|CALL)\s*:\s*/i;
  var LIST_RE = /^(\s*)([-*]|\d+[.)])\s+(.*)$/;

  var FIG_RE = /^\s*\[\[fig:([a-z0-9-]+)\]\]\s*$/;
  function isBlockStart(l) {
    return /^#{2,3}\s/.test(l) || /^\s*>/.test(l) || /^\s*\|/.test(l) || LIST_RE.test(l) || /^-{3,}\s*$/.test(l) || FIG_RE.test(l);
  }

  function parse(src) {
    var lines = String(src).replace(/\r/g, '').split('\n');
    var blocks = [];
    var i = 0, m;
    while (i < lines.length) {
      var l = lines[i];
      if (/^\s*$/.test(l)) { i++; continue; }

      if ((m = /^(#{2,3})\s+(.*)$/.exec(l))) {
        blocks.push({ t: m[1].length === 2 ? 'h2' : 'h3', x: m[2].trim() });
        i++; continue;
      }
      if (/^-{3,}\s*$/.test(l)) { blocks.push({ t: 'hr' }); i++; continue; }
      if ((m = FIG_RE.exec(l))) { blocks.push({ t: 'fig', id: m[1] }); i++; continue; }

      if (/^\s*>/.test(l)) {
        var buf = [];
        while (i < lines.length && /^\s*>/.test(lines[i])) { buf.push(lines[i].replace(/^\s*>\s?/, '')); i++; }
        var txt = buf.join('\n').trim();
        var kind = 'note', mm = CALLOUT_RE.exec(txt);
        if (mm) { kind = mm[1].toLowerCase(); txt = txt.slice(mm[0].length); }
        blocks.push({ t: 'callout', kind: kind, x: txt });
        continue;
      }

      if (/^\s*\|/.test(l)) {
        var rows = [];
        while (i < lines.length && /^\s*\|/.test(lines[i])) {
          var cells = lines[i].trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map(function (c) { return c.trim(); });
          rows.push(cells); i++;
        }
        var sepIdx = -1;
        if (rows.length > 1 && rows[1].every(function (c) { return /^:?-{2,}:?$/.test(c); })) sepIdx = 1;
        var head = sepIdx === 1 ? rows[0] : null;
        var body = rows.slice(sepIdx === 1 ? 2 : 0);
        blocks.push({ t: 'table', head: head, rows: body, cols: rows[0].length, all: rows });
        continue;
      }

      if (LIST_RE.test(l)) {
        var first = LIST_RE.exec(l);
        var ordered = /\d/.test(first[2]);
        var start = ordered ? parseInt(first[2], 10) : 1;
        var items = [];
        while (i < lines.length) {
          var cur = lines[i];
          if (/^\s*$/.test(cur)) {
            // blank line: continue list only if next non-blank is a top-level item of same kind
            var j = i + 1;
            while (j < lines.length && /^\s*$/.test(lines[j])) j++;
            var nm = j < lines.length ? LIST_RE.exec(lines[j]) : null;
            if (nm && nm[1].length < 2 && /\d/.test(nm[2]) === ordered) { i = j; continue; }
            break;
          }
          var im = LIST_RE.exec(cur);
          if (im && im[1].length < 2) {
            if (/\d/.test(im[2]) !== ordered) break;
            var item = { x: im[3], kids: [], check: null };
            var cm = /^\[( |x|X)\]\s+(.*)$/.exec(item.x);
            if (cm) { item.check = true; item.x = cm[2]; }
            items.push(item); i++; continue;
          }
          if (im && im[1].length >= 2 && items.length) {
            items[items.length - 1].kids.push({ x: im[3] }); i++; continue;
          }
          if (/^\s{2,}\S/.test(cur) && items.length) {
            var tgt = items[items.length - 1];
            if (tgt.kids.length) tgt.kids[tgt.kids.length - 1].x += ' ' + cur.trim();
            else tgt.x += ' ' + cur.trim();
            i++; continue;
          }
          break;
        }
        blocks.push({ t: ordered ? 'ol' : 'ul', start: start, items: items });
        continue;
      }

      // paragraph
      var pbuf = [l.trim()];
      i++;
      while (i < lines.length && !/^\s*$/.test(lines[i]) && !isBlockStart(lines[i])) { pbuf.push(lines[i].trim()); i++; }
      blocks.push({ t: 'p', x: pbuf.join(' ') });
    }
    return blocks;
  }

  var LABELS = { warning: 'Warning', danger: 'Danger', caution: 'Caution', tip: 'Tip', note: 'Note', important: 'Important', stop: 'Stop', call: 'Get help' };

  function render(src, ctx) {
    ctx = ctx || {};
    var aid = ctx.articleId || 'x';
    var out = [], chk = 0;
    parse(src).forEach(function (b) {
      switch (b.t) {
        case 'h2': out.push('<h2>' + inline(b.x, ctx) + '</h2>'); break;
        case 'h3': out.push('<h3>' + inline(b.x, ctx) + '</h3>'); break;
        case 'hr': out.push('<hr>'); break;
        case 'fig':
          var d = g.GDG_DIAGRAMS && g.GDG_DIAGRAMS[b.id];
          if (d) out.push('<figure class="fig" role="img" aria-label="' + esc(d.alt || d.title) + '">' + d.svg +
            '<figcaption><b>' + esc(d.title) + '</b>' + (d.caption ? '. ' + esc(d.caption) : '') + '</figcaption></figure>');
          break;
        case 'p': out.push('<p>' + inline(b.x, ctx) + '</p>'); break;
        case 'callout':
          var k = LABELS[b.kind] ? b.kind : 'note';
          out.push('<div class="callout ' + k + '"><div class="co-title">' + LABELS[k] + '</div><div class="co-body">' +
            inline(b.x, ctx).replace(/\n/g, '<br>') + '</div></div>');
          break;
        case 'ul':
        case 'ol':
          var isCheck = b.items.some(function (it) { return it.check; });
          var tag = b.t;
          var cls = isCheck ? ' class="checklist"' : (tag === 'ol' ? ' class="steps"' : '');
          var startAttr = tag === 'ol' && b.start !== 1 ? ' start="' + b.start + '" style="counter-reset:s ' + (b.start - 1) + '"' : '';
          var h = '<' + tag + cls + startAttr + '>';
          b.items.forEach(function (it) {
            var inner = inline(it.x, ctx);
            if (it.check) {
              var key = aid + ':' + (chk++);
              inner = '<label class="chk"><input type="checkbox" data-chk="' + key + '"><span>' + inner + '</span></label>';
            }
            if (it.kids.length) {
              inner += '<ul>' + it.kids.map(function (kd) { return '<li>' + inline(kd.x, ctx) + '</li>'; }).join('') + '</ul>';
            }
            h += '<li>' + inner + '</li>';
          });
          out.push(h + '</' + tag + '>');
          break;
        case 'table':
          var t = '<div class="tbl-wrap"><table>';
          if (b.head) t += '<thead><tr>' + b.head.map(function (c) { return '<th>' + inline(c, ctx) + '</th>'; }).join('') + '</tr></thead>';
          t += '<tbody>' + b.rows.map(function (r) {
            return '<tr>' + r.map(function (c) { return '<td>' + inline(c, ctx) + '</td>'; }).join('') + '</tr>';
          }).join('') + '</tbody></table></div>';
          out.push(t);
          break;
      }
    });
    return out.join('\n');
  }

  function blockText(b) {
    switch (b.t) {
      case 'h2': case 'h3': case 'p': return stripInline(b.x);
      case 'callout': return stripInline(b.x);
      case 'ul': case 'ol':
        return b.items.map(function (it) { return stripInline(it.x) + ' ' + it.kids.map(function (k) { return stripInline(k.x); }).join(' '); }).join('\n');
      case 'table':
        return b.all.map(function (r) { return r.map(stripInline).join(' '); }).join('\n');
      default: return '';
    }
  }

  function plain(src) { return parse(src).map(blockText).join('\n'); }

  function links(src) {
    var out = [], re = /\[\[([a-z0-9-]+)(?:\|[^\]]+)?\]\]/g, m;
    while ((m = re.exec(String(src)))) out.push(m[1]);
    return out;
  }

  function figs(src) {
    var out = [], re = /^\s*\[\[fig:([a-z0-9-]+)\]\]\s*$/gm, m;
    while ((m = re.exec(String(src)))) out.push(m[1]);
    return out;
  }

  /* Returns an array of human-readable problems (empty = clean). */
  function lint(src) {
    var probs = [];
    var raw = String(src);
    raw.split('\n').forEach(function (line, n) {
      if (/^#\s/.test(line)) probs.push('line ' + (n + 1) + ': single "#" heading (use ## or ###; the title is added automatically)');
      if (/\[\[[^\]]*$/.test(line) || /^[^\[]*\]\]/.test(line)) probs.push('line ' + (n + 1) + ': malformed [[link]]');
      if (/\[\[[^a-z0-9|\]-]/.test(line)) probs.push('line ' + (n + 1) + ': [[link]] id must be lowercase-hyphen');
      if ((line.match(/\*\*/g) || []).length % 2) probs.push('line ' + (n + 1) + ': unbalanced ** (bold)');
      if (/<\/?[a-z][^>]*>/i.test(line)) probs.push('line ' + (n + 1) + ': contains HTML-like tag; write plain text (it is escaped)');
    });
    parse(src).forEach(function (b) {
      if (b.t === 'table') {
        b.all.forEach(function (r, ri) {
          if (r.length !== b.cols) probs.push('table row ' + (ri + 1) + ' has ' + r.length + ' cells, expected ' + b.cols);
        });
      }
    });
    return probs;
  }

  g.MD = { render: render, parse: parse, plain: plain, links: links, figs: figs, lint: lint, esc: esc };
})(typeof window !== 'undefined' ? window : this);

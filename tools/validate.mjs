// Usage:
//   node tools/validate.mjs data/firstaid.js        (validate one or more content files)
//   node tools/validate.mjs --all                   (validate everything + check cross-links + coverage)
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import url from 'node:url';

const root = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const ALL = args.includes('--all');
const read = (p) => fs.readFileSync(p, 'utf8');

const master = JSON.parse(read(path.join(root, 'tools', 'master-list.json')));
const masterIds = new Map(); // id -> cat
for (const [cat, list] of Object.entries(master)) for (const a of list) masterIds.set(a[0], cat);

function sandbox() {
  const win = {};
  const ctx = vm.createContext({ window: win, console });
  vm.runInContext(read(path.join(root, 'js', 'md.js')), ctx, { filename: 'md.js' });
  vm.runInContext(read(path.join(root, 'data', 'categories.js')), ctx, { filename: 'categories.js' });
  return { win, ctx };
}
const { win, ctx } = sandbox();
const MD = win.MD;
const NON_ARTICLE = new Set(['categories.js', 'zonedata.js', 'diagrams.js', 'crisis-steps.js']);
if (fs.existsSync(path.join(root, 'data', 'diagrams.js'))) {
  try { vm.runInContext(read(path.join(root, 'data', 'diagrams.js')), ctx, { filename: 'diagrams.js' }); } catch (e) { console.log('  ERROR  could not load data/diagrams.js: ' + e.message); process.exitCode = 1; }
}
const catIds = new Set(win.CATEGORIES.map((c) => c.id));

const dataDir = path.join(root, 'data');
const files = ALL
  ? fs.readdirSync(dataDir).filter((f) => f.endsWith('.js') && !NON_ARTICLE.has(f)).map((f) => path.join(dataDir, f))
  : args.filter((a) => !a.startsWith('--')).map((a) => path.resolve(a));

let errors = 0, warns = 0;
const err = (m) => { errors++; console.log('  ERROR  ' + m); };
const warn = (m) => { warns++; console.log('  warn   ' + m); };

const seen = new Map(); // id -> file
const allArticles = [];
let totalWords = 0;

for (const file of files) {
  const rel = path.relative(root, file);
  console.log('\n' + rel);
  let arts;
  try {
    const w = {};
    const c = vm.createContext({ window: w });
    vm.runInContext(read(file), c, { filename: rel });
    arts = w.ARTICLES || [];
  } catch (e) {
    err('could not load file: ' + e.message);
    continue;
  }
  if (!arts.length) { err('no articles found (did you push to window.ARTICLES?)'); continue; }

  let words = 0;
  for (const a of arts) {
    const tag = '[' + (a.id || '?') + '] ';
    for (const f of ['id', 'cat', 'title', 'summary', 'body']) if (!a[f] || typeof a[f] !== 'string') err(tag + 'missing/invalid field: ' + f);
    if (!a.id) continue;
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(a.id)) err(tag + 'id must be lowercase-hyphen');
    if (!catIds.has(a.cat)) err(tag + 'unknown category: ' + a.cat);
    if (seen.has(a.id)) err(tag + 'duplicate id (also in ' + seen.get(a.id) + ')');
    seen.set(a.id, rel);
    if (!masterIds.has(a.id)) warn(tag + 'id not in tools/master-list.json');
    else if (masterIds.get(a.id) !== a.cat) err(tag + 'category mismatch: master says ' + masterIds.get(a.id));
    if (a.tags && !Array.isArray(a.tags)) err(tag + 'tags must be an array');
    if (a.summary && a.summary.length > 160) warn(tag + 'summary is ' + a.summary.length + ' chars (keep under 160)');
    if (!a.body) continue;
    for (const p of MD.lint(a.body)) err(tag + p);
    for (const f of MD.figs(a.body)) if (!(win.GDG_DIAGRAMS && win.GDG_DIAGRAMS[f])) err(tag + 'unknown figure: ' + f);
    try { MD.render(a.body, { articleId: a.id }); } catch (e) { err(tag + 'render failed: ' + e.message); }
    const wc = MD.plain(a.body).split(/\s+/).filter(Boolean).length;
    words += wc;
    if (wc < 150) warn(tag + 'thin: only ' + wc + ' words');
    if (wc > 1000) warn(tag + 'very long: ' + wc + ' words');
    if (!/^##\s/m.test(a.body)) warn(tag + 'no ## headings');
    allArticles.push(a);
  }
  totalWords += words;
  console.log('  ' + arts.length + ' articles, ' + words + ' words');
}

// cross-link check
const known = ALL ? new Set(seen.keys()) : null;
for (const a of allArticles) {
  for (const id of MD.links(a.body)) {
    if (ALL) { if (!known.has(id)) err('[' + a.id + '] links to missing article: ' + id); }
    else if (!masterIds.has(id) && !seen.has(id)) err('[' + a.id + '] links to unknown id (not in master list): ' + id);
  }
}

if (ALL) {
  // diagrams
  const D = win.GDG_DIAGRAMS || {};
  for (const [id, d] of Object.entries(D)) {
    const t = '[fig ' + id + '] ';
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(id)) err(t + 'bad id');
    if (!d.title || !d.alt || !d.svg) err(t + 'needs title, alt and svg');
    if (d.svg) {
      if (!/^<svg[\s>]/.test(d.svg.trim())) err(t + 'svg must start with <svg');
      if (!/viewBox="/.test(d.svg)) err(t + 'svg needs a viewBox');
      if (/<script|<foreignObject|\son[a-z]+\s*=|href\s*=\s*["']https?:|javascript:/i.test(d.svg)) err(t + 'svg contains disallowed content');
      if (d.svg.length > 14000) warn(t + 'svg is large (' + d.svg.length + ' chars)');
    }
  }
  const usedFigs = new Set(allArticles.flatMap((a) => MD.figs(a.body)));
  const unused = Object.keys(D).filter((k) => !usedFigs.has(k));
  if (unused.length) warn('diagrams not used by any article: ' + unused.join(', '));
  console.log(Object.keys(D).length + ' diagrams');
  // crisis step scripts
  const cf = path.join(root, 'data', 'crisis-steps.js');
  if (fs.existsSync(cf)) {
    const w2 = {}; const c2 = vm.createContext({ window: w2 });
    try { vm.runInContext(read(cf), c2, { filename: 'crisis-steps.js' }); } catch (e) { err('could not load crisis-steps.js: ' + e.message); }
    const C = w2.GDG_CRISIS || [];
    const cids = new Set();
    for (const s of C) {
      const t = '[crisis ' + s.id + '] ';
      if (!s.id || !s.title || !Array.isArray(s.steps) || !s.steps.length) { err(t + 'needs id, title, steps'); continue; }
      if (cids.has(s.id)) err(t + 'duplicate id'); cids.add(s.id);
      if (s.article && !seen.has(s.article)) err(t + 'unknown article: ' + s.article);
      s.steps.forEach((st, i) => {
        if (!st.t || typeof st.t !== 'string') err(t + 'step ' + (i + 1) + ' needs t');
        else if (st.t.split(/\s+/).length > 16) warn(t + 'step ' + (i + 1) + ' headline is long (' + st.t.split(/\s+/).length + ' words)');
        if (st.fig && !D[st.fig]) err(t + 'step ' + (i + 1) + ' unknown figure ' + st.fig);
      });
    }
    console.log(C.length + ' crisis scripts');
  }
  const missing = [...masterIds.keys()].filter((id) => !seen.has(id));
  if (missing.length) console.log('\nNot yet written (' + missing.length + '): ' + missing.join(', '));
  console.log('\nTOTAL: ' + seen.size + ' articles, ' + totalWords + ' words');
}
console.log('\n' + (errors ? errors + ' ERROR(S)' : 'OK') + (warns ? ', ' + warns + ' warning(s)' : ''));
process.exit(errors ? 1 : 0);

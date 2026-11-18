// Inserts [[fig:id]] lines into article bodies according to tools/figure-placements.json
//   node tools/place-figures.mjs          (apply; safe to re-run, already-placed figures are skipped)
//   node tools/place-figures.mjs --dry    (report only)
//   node tools/place-figures.mjs tools/figure-placements-rebuild.json   (use another placement list)
// Placement entry: { fig, article, heading, where: 'start' | 'end' }
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import vm from 'node:vm';

const root = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..');
const dry = process.argv.includes('--dry');
const fileArg = process.argv.slice(2).find((x) => !x.startsWith('--'));
const placements = JSON.parse(fs.readFileSync(fileArg ? path.resolve(fileArg) : path.join(root, 'tools', 'figure-placements.json'), 'utf8'));
const master = JSON.parse(fs.readFileSync(path.join(root, 'tools', 'master-list.json'), 'utf8'));
const catOf = new Map();
for (const [cat, list] of Object.entries(master)) for (const a of list) catOf.set(a[0], cat);

const diagrams = (() => {
  const w = {}; const c = vm.createContext({ window: w });
  for (const f of fs.readdirSync(path.join(root, 'data')).filter((x) => /^diagrams.*\.js$/.test(x))) vm.runInContext(fs.readFileSync(path.join(root, 'data', f), 'utf8'), c);
  return w.GDG_DIAGRAMS || {};
})();

const fileOf = new Map(); // article id -> data file
for (const f of fs.readdirSync(path.join(root, 'data')).filter((x) => x.endsWith('.js') && !/^(categories|zonedata|crisis-steps)\.js$|^diagrams/.test(x))) {
  const t = fs.readFileSync(path.join(root, 'data', f), 'utf8');
  for (const m of t.matchAll(/^\s*id:\s*['"]([a-z0-9-]+)['"]/gm)) fileOf.set(m[1], path.join(root, 'data', f));
}
const files = new Map(); // file -> text
let placed = 0, skipped = 0, problems = 0;
for (const p of placements) {
  const tag = `${p.fig} -> ${p.article} / "${p.heading}" (${p.where})`;
  if (!diagrams[p.fig]) { console.log('PROBLEM unknown diagram: ' + tag); problems++; continue; }
  const cat = catOf.get(p.article);
  if (!cat) { console.log('PROBLEM unknown article: ' + tag); problems++; continue; }
  const file = fileOf.get(p.article) || path.join(root, 'data', cat + '.js');
  let text = files.get(file) ?? fs.readFileSync(file, 'utf8');
  const idRe = new RegExp("id:\\s*['\"]" + p.article.replace(/-/g, '\\-') + "['\"]");
  const m = idRe.exec(text);
  if (!m) { console.log('PROBLEM article not in ' + cat + '.js: ' + tag); problems++; continue; }
  const bStart = text.indexOf('body: `', m.index);
  if (bStart < 0) { console.log('PROBLEM no body: ' + tag); problems++; continue; }
  const from = bStart + 'body: `'.length;
  const to = text.indexOf('`', from);
  let body = text.slice(from, to);
  if (body.includes('[[fig:' + p.fig + ']]')) { skipped++; continue; }
  const lines = body.split('\n');
  const hi = lines.findIndex((l) => /^#{2,3}\s/.test(l) && l.replace(/^#{2,3}\s+/, '').trim() === p.heading.trim());
  if (hi < 0) { console.log('PROBLEM heading not found: ' + tag); problems++; continue; }
  let at = hi + 1;
  if (p.where === 'end') {
    at = lines.length;
    for (let i = hi + 1; i < lines.length; i++) if (/^#{2,3}\s/.test(lines[i])) { at = i; break; }
    while (at > hi + 1 && /^\s*$/.test(lines[at - 1])) at--;
  }
  lines.splice(at, 0, '', '[[fig:' + p.fig + ']]', '');
  body = lines.join('\n').replace(/\n{3,}/g, '\n\n');
  text = text.slice(0, from) + body + text.slice(to);
  files.set(file, text);
  placed++;
  console.log('placed  ' + tag);
}
if (!dry) for (const [f, t] of files) fs.writeFileSync(f, t);
console.log(`\n${placed} placed, ${skipped} already there, ${problems} problems${dry ? ' (dry run, nothing written)' : ''}`);
process.exit(problems ? 1 : 0);

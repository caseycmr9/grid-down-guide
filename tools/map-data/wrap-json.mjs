// Turn a pipeline result (out/*.json) into the file the app loads from map/.
//   node wrap-json.mjs base out/base.json map/ca-base.json '{"updated":"YYYY-MM-DD","region":"California","sources":"..."}'
//   node wrap-json.mjs places|pois|roads out/<part>.json map/ca-<part>.json
import fs from 'node:fs'; import path from 'node:path';
const [, , part, inFile, outFile, metaJson] = process.argv;
const data = JSON.parse(fs.readFileSync(inFile, 'utf8'));
let out = data;
if (part === 'base') {
  const meta = JSON.parse(metaJson);
  // the street packs are built for one exact highway network: remember which (see make-streets.mjs)
  if (fs.existsSync('out/roads-meta.json')) meta.roadsHash = JSON.parse(fs.readFileSync('out/roads-meta.json', 'utf8')).hash;
  out = { meta, base: data };
}
fs.mkdirSync(path.dirname(path.resolve(outFile)), { recursive: true });
fs.writeFileSync(outFile, JSON.stringify(out));
console.log(outFile, (fs.statSync(outFile).size / 1e6).toFixed(2), 'MB');

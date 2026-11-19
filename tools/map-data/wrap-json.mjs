// Turn a pipeline result (out/*.json) into the file the app loads from map/.
//   node wrap-json.mjs base out/base.json map/ca-base.json '{"updated":"YYYY-MM-DD","region":"California","sources":"..."}'
//   node wrap-json.mjs places|pois|roads out/<part>.json map/ca-<part>.json
import fs from 'node:fs'; import path from 'node:path';
const [, , part, inFile, outFile, metaJson] = process.argv;
const data = JSON.parse(fs.readFileSync(inFile, 'utf8'));
const out = part === 'base' ? { meta: JSON.parse(metaJson), base: data } : data;
fs.mkdirSync(path.dirname(path.resolve(outFile)), { recursive: true });
fs.writeFileSync(outFile, JSON.stringify(out));
console.log(outFile, (fs.statSync(outFile).size / 1e6).toFixed(2), 'MB');
